// =============================================================================
// Ma Vigne — WHATS_NEW, le journal des nouveautés (WN-COUPE-1, §469)
// -----------------------------------------------------------------------------
// Sorti de src/utils.js le 27/10/2026 : utils.js touchait le plafond de 1024 ko (mv-harnais-typo, « au-delà, on découpe »)
// et plus aucune annonce n'y tenait. Le format ne change pas — un bloc par version APP, toujours préfixé en tête ;
// la règle « annoncer, c'est bumper » (CLAUDE.md, règle d'or n°4) vaut ici. utils.js l'importe et le réexporte :
// le code de l'appli ne voit aucune différence ; les contrôles lisent utils.js + ce fichier, bout à bout.
// =============================================================================
export const WHATS_NEW = [
  { v: '10.30', d: '2026-10-28', items: [
    { niv: 0, pour: ['admin'], emoji: 'ecran', titre: 'Le Journal sur ordinateur : la liste et la fiche côte à côte',
      desc: "Sur ordinateur, le Journal passe en trois colonnes\u00a0: les filtres à gauche, les entrées en lignes au centre, et à droite la fiche de l’entrée choisie (date et heure, tâche, parcelle, surface, qui, l’équipe). Un appui sur une entrée la choisit\u00a0; au clavier, J et K passent d’une entrée à l’autre, N en ouvre une nouvelle, «\u00a0/\u00a0» va à la recherche. Au téléphone, rien ne change." },
  ] },
  { v: '10.29', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'loupe', titre: 'Parcelles au téléphone : la liste d’abord',
      desc: "Au téléphone, Parcelles garde ses compteurs en haut et montre les parcelles tout de suite. La recherche et «\u00a0Filtres\u00a0» sont dans une barre en bas\u00a0; «\u00a0Filtres\u00a0» ouvre une feuille avec ce qu’on affiche (à faire, finies, en cours…), la tâche, la liste ou la carte, et l’ordre — et son bouton dit combien de parcelles il va montrer. Sur la carte, «\u00a0Liste\u00a0» revient en haut. Sur ordinateur, rien ne change." },
  ] },
  { v: '10.28', d: '2026-10-28', items: [
    { niv: 0, pour: ['admin'], emoji: 'loupe', titre: 'Le Journal au téléphone : la liste d’abord',
      desc: "Au téléphone, le Journal montre ses entrées dès le haut de l’écran. La recherche et «\u00a0Filtrer\u00a0» sont dans une barre en bas, sous le pouce\u00a0; «\u00a0Filtrer\u00a0» ouvre une feuille (qui, tâche, quand, parcelle) dont le bouton dit combien d’entrées il va montrer. Les filtres actifs restent en pastilles sous l’en-tête — un appui en retire un — et «\u00a0+\u00a0» ajoute une entrée. Sur ordinateur, rien ne change." },
  ] },
  { v: '10.27', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'aide', titre: 'Le bouton « ? Aide » est revenu',
      desc: "Depuis la mise à jour précédente, le bouton «\u00a0? Aide\u00a0» avait disparu en haut de huit modules (Vigne, Tracteur, Phyto, Réglages, Planning, Cave)\u00a0: il est revenu, sur la ligne de la campagne et de la date. Le Pilotage et la Réserve prennent le même en-tête que les autres modules." },
  ] },
  { v: '10.26', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'fleche-haut', titre: 'Un en-tête plus court, en haut de chaque page',
      desc: "L’en-tête tient en une bande et un cadre d’onglets\u00a0: dans la Vigne, le titre dit la page («\u00a0Journal\u00a0», «\u00a0Vigne · 14 entrées\u00a0») et les onglets n’ont plus d’icônes. La campagne et la date sont sur une ligne juste en dessous, qui défile avec la page\u00a0; sur l’Accueil, on y choisit toujours une campagne passée." },
  ] },
  { v: '10.25', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'fleche-haut', titre: 'L’en-tête se range quand on descend',
      desc: "Au téléphone, en descendant dans une page, l’en-tête tient en une ligne\u00a0: la campagne, la date et les onglets se cachent et laissent la place à la liste. Ils reviennent en remontant, en haut de la page, ou en touchant la ligne." },
  ] },
  { v: '10.24', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'retour', titre: 'Huit gestes de plus se rattrapent avec « Annuler »',
      desc: "Supprimer un relevé du Cuvier ou une étape d’une cuve, une fiche d’entretien, une réparation de l’historique, un conducteur, une activité du Tracteur, retirer une cuve du parc ou d’une cuvée, ou une tâche d’une période\u00a0: plus de fenêtre, le geste part tout de suite et «\u00a0Annuler\u00a0» reste six secondes. La fiche d’entretien était annoncée «\u00a0irréversible\u00a0»\u00a0: elle se remet." },
    { niv: 0, pour: ['admin'], emoji: 'alerte', titre: 'Les fenêtres qui restent disent ce qu’elles font',
      desc: "Le bouton nomme le geste («\u00a0Supprimer ce traitement\u00a0», «\u00a0Supprimer la cuvée et ses opérations\u00a0»…). Le retour d’un tracteur de réparation affichait «\u00a0Supprimer\u00a0» en rouge\u00a0: il dit «\u00a0Marquer le retour\u00a0». Pour supprimer une saison, une tâche du domaine ou un snapshot, on tape maintenant son nom (accents et majuscules comme on veut) au lieu de «\u00a0SUPPRIMER\u00a0»." },
  ] },
  { v: '10.23', d: '2026-10-28', items: [
    { niv: 0, pour: ['tous'], emoji: 'retour', titre: 'Annuler plutôt que confirmer',
      desc: "Un geste qui se répare part tout de suite, et un bandeau «\u00a0Annuler\u00a0» reste six secondes, avec une barre qui s’épuise. C’était déjà le cas après Valider\u00a0; c’est maintenant le cas quand on remet une tâche en cours (le bouton «\u00a0Fait\u00a0»), quand on retire un lot de fûts de la Réserve (plus de fenêtre «\u00a0Supprimer ce lot de fûts\u00a0?\u00a0») et quand on efface des saisies, pose des récups ou des horaires de chaleur au Planning — ces trois-là s’appliquaient sans retour possible." },
  ] },
  { v: '10.22', d: '2026-10-27', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Des textes plus grands, et des petits boutons plus faciles à toucher',
      desc: "Plus aucun texte n’est sous 11\u00a0px, et au téléphone plus rien sous 12\u00a0px\u00a0: les heures du Planning («\u00a0173h / 152h\u00a0»), l’échelle de la campagne dans Réglages et quelques étiquettes descendaient jusqu’à 7\u00a0px. Au Journal, chaque initiale est dans un rond plus grand, deux au plus, puis «\u00a0+2\u00a0» pour les autres. Les petits boutons «\u00a0discrets\u00a0» et secondaires se touchent sur 44\u00a0px de haut sans changer de dessin\u00a0; le crayon de la priorité, «\u00a0Pourquoi\u00a0?\u00a0», les tuiles de l’Accueil et les champs de recherche sont plus faciles à attraper." },
  ] },
  { v: '10.21', d: '2026-10-27', items: [] },   // WN-COUPE-1 (§469) : WHATS_NEW sort d’utils.js — technique, rien ne change à l’écran
  { v: '10.20', d: '2026-10-26', items: [
    { niv: 1, pour: ['admin'], emoji: 'pousse', titre: 'Fertilisation : vos produits retrouvés, avec leurs teneurs de chaque campagne',
      desc: "Dans un amendement, la recherche trouve d’abord vos produits déjà utilisés, toutes campagnes\u00a0: en choisir un remplit la fiche comme au dernier apport (norme, fournisseur, nature, dose, sac, prix). Les teneurs sont celles de la dernière campagne, datées\u00a0; celles des campagnes précédentes restent à un geste, car elles changent d’une année à l’autre selon l’analyse du produit. Un nouveau tuto le montre." }
  ] },
  { v: '10.19', d: '2026-10-26', items: [] },   // FERTI-7B (§465) : version technique — l’étiquette du tuto posée après le geste du bouton de saisie
  { v: '10.18', d: '2026-10-26', items: [
    { niv: 0, pour: ['admin'], emoji: 'pousse', titre: 'Un tuto\u00a0: comment saisir un amendement',
      desc: "Dans les tutos, «\u00a0Comment faire pour saisir un amendement\u00a0?\u00a0» montre, sur un domaine d’entraînement, un produit vendu sans AMM\u00a0: sa norme écrite sur le sac, la formule «\u00a04-10-1\u00a0», ce qu’est le produit, puis les parcelles cochées en retirant une appellation. Sur votre domaine, rien ne bouge." }
  ] },
  { v: '10.17', d: '2026-10-26', items: [
    { niv: 1, pour: ['admin'], emoji: 'pousse', titre: 'Fertilisation : cocher les parcelles par règle',
      desc: "À l’étape «\u00a0Les parcelles\u00a0» d’un amendement, donnez un seuil de rendement (celui de la vendange, repris du Cuvier) et touchez les appellations à retirer, par exemple Bourgogne\u00a0: «\u00a0Cocher ces parcelles\u00a0» coche celles qui restent. Une parcelle sans rendement connu reste de côté, et l’écran la nomme. Chaque ligne montre maintenant son appellation et son rendement." }
  ] },
  { v: '10.16', d: '2026-10-26', items: [
    { niv: 1, pour: ['admin'], emoji: 'pousse', titre: 'Fertilisation : la recherche E-Phy trouve tous les produits qui ont une autorisation',
      desc: "Une matière fertilisante autorisée «\u00a0toutes cultures\u00a0», sans culture précisée, ou dont l’autorisation écrit «\u00a0raisin de cuve\u00a0» restait introuvable\u00a0: la recherche répondait «\u00a0pas dans E-Phy\u00a0». Chaque résultat dit maintenant ce que son autorisation permet\u00a0: <b>Vigne</b>, <b>Toutes cultures</b>, <b>Culture non précisée</b> ou <b>Pas la vigne</b>. Ce dernier reste choisissable, avec un avertissement. Choisi dans E-Phy, un produit apporte ses teneurs déclarées. «\u00a0Pas dans E-Phy\u00a0» ne vise plus que les produits sans numéro d’AMM, vendus sous une norme." },
    { niv: 1, pour: ['admin'], emoji: 'pousse', titre: 'Fertilisation : la norme, la formule du sac et le type nitrates en un geste',
      desc: "Sous «\u00a0Norme ou AMM\u00a0», trois boutons\u00a0: NF U 44-051, NF U 42-001, fertilisant UE. Tapez la formule du sac, comme <b>4-10-1</b>\u00a0: l’azote, le phosphore et la potasse se remplissent. «\u00a0Ce que c’est\u00a0» pose le type nitrates et dit pourquoi\u00a0: un compost de fumier ou de marc est de type I.a. La mention «\u00a0utilisable en agriculture biologique\u00a0» n’est pas la norme\u00a0: elle se coche." }
  ] },
  { v: '10.15', d: '2026-10-26', items: [
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage › Aujourd’hui, vue Économie : l’écart au barème dit la même chose partout',
      desc: "La tuile «\u00a0Écart au barème\u00a0» affichait 0,0\u00a0% tant que 40\u00a0% du travail de la période n’était pas validé, même quand la carte d’à côté montrait des tâches bien au-dessus du barème. Elle donne maintenant le total de la carte «\u00a0Écart au barème, par tâche\u00a0» : les heures réellement passées sur les parcelles validées face à leur barème, journées de cave retirées, et un tiret tant que rien n’est à comparer. Dans la carte, le pourcentage se calcule sur les heures écrites dessous — il était calculé en euros —, avec les chiffres de «\u00a0Temps réel contre barème\u00a0» de l’onglet Économie. Les barres sont à l’échelle jusqu’à 50\u00a0% : au-delà, elles sont pleines et finissent en pointe (elles s’arrêtaient à 10\u00a0%, et +13\u00a0% avait la même longueur que +620\u00a0%)." }
  ] },
  { v: '10.14', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'balance', titre: 'Planning : un motif d’absence «\u00a0Mise à pied disciplinaire\u00a0»',
      desc: "Une mise à pied n’avait pas de motif à elle : notée en absence injustifiée, elle se reprenait sur la récup et les heures sup du salarié. Dans <b>Absence</b>, choisissez maintenant <b>Mise à pied disciplinaire</b>, sur les jours de la sanction — toujours des journées entières. Le contrat est suspendu ces jours-là : ils ne sont ni payés ni rattrapés, ne touchent ni à la récup ni aux heures sup du mois, qui restent dues, et abaissent le plafond annuel. Le cadre «\u00a0Pour la compta\u00a0» leur donne une ligne à part, avec les heures du planning à retirer et les dates. Les collègues voient «\u00a0absent\u00a0», jamais le motif." },
    { niv: 0, pour: ['admin'], emoji: 'document', titre: 'Pour la compta : «\u00a0Aucune autre retenue\u00a0» à côté d’un congé sans solde',
      desc: "Un mois avec un congé sans solde affichait «\u00a0Aucune retenue\u00a0» et «\u00a0le salaire de base se paie en entier\u00a0», juste au-dessus de la ligne «\u00a0Congé sans solde : à retirer\u00a0». La ligne du salaire de base dit maintenant «\u00a0Aucune autre retenue\u00a0» et renvoie à la ligne à retirer ; dans le mois jour par jour et sur le relevé, ces journées portent «\u00a0non payée\u00a0»." }
  ] },
  { v: '10.13', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'barrique', titre: 'Pilotage › vue Cave : seuls les fûts qui demandent un geste sont dessinés',
      desc: "Dans « La cave en direct », les cuvées à jour ne remplissent plus le Chai de ronds verts : elles tiennent sur une ligne, avec leur nombre, leurs fûts et le prochain ouillage. Les cuvées qui suivent leur cours (fermentation, malo) ont leur ligne aussi. Seules les cuvées qui demandent un geste gardent un rond par fût. « Tout voir », ou l’état choisi dans la légende, déplie la ligne avec tous ses fûts, comme avant. Un fût marqué <b>fleur</b>, <b>piqué</b> ou <b>oxydé</b> garde son rond juste sous la ligne, et une malo qui bloque passe en rouge : elle reste dessinée." }
  ] },
  { v: '10.12', d: '2026-10-25', items: [
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage : les barres des graphiques à la même mesure',
      desc: "Dans la frise prévu / réel de Travaux, dans Économie › Postes & travaux et Parcelles, les barres des graphiques ont maintenant toutes la même épaisseur et le même arrondi, comme les jauges ; les colonnes des graphiques par mois ou par semaine, le même arrondi. Plus de barre plus épaisse ici, plus fine là." }
  ] },
  { v: '10.11', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage : tous les onglets se lisent de la même façon',
      desc: "Le même chiffre changeait de taille, de police ou de graisse d’un onglet à l’autre, et les jauges n’avaient pas la même épaisseur. Chaque élément a maintenant un seul style dans tout le Pilotage, calé sur Aujourd’hui : une seule police, le chiffre d’une carte, le titre d’un panneau, le nom et la valeur d’une ligne à la même taille partout, des jauges de même épaisseur à bout rond et des cartes au même dessin. Les sous-vues d’Économie et les choix dans les cartes prennent le dessin des bascules d’Aujourd’hui, et les trois chiffres de Travaux forment une bande, comme sur Aujourd’hui. Aucun calcul ne change." }
  ] },
  { v: '10.10', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-resume', emoji: 'graphique', titre: 'Pilotage : la phrase d’Aujourd’hui dit par rapport à quoi',
      desc: "Sous chaque chiffre de la phrase du haut, sa référence : sous l’avance ou le retard, la fin prévue et l’objectif ; sous l’écart au budget, le coût à la fin et le budget — le petit « i » dit comment c’est compté. Sous la date, la campagne que lisent ces chiffres, ses dates et le jour où vous en êtes : Aujourd’hui lit toujours la campagne en cours, quel que soit le choix de la barre « Vous regardez ». La phrase prend toute la ligne, et la bascule Terrain · Cave · Économie monte en haut à droite du cadre, à côté de la roue. Touchez un chiffre : le retard mène à la fin prévue, le budget à la vue Économie." }
  ] },
  { v: '10.09', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'barrique', titre: 'Cave : une cuvée s’ouvre dans sa fiche, depuis Le Millésime et les bouteilles',
      desc: "Dans Le Millésime › Cuvées, une cuvée du Chai s’ouvre maintenant dans sa fiche à quatre volets, sur « Volumes & origine », au lieu d’une seconde fiche à part ; une cuve pas encore décuvée garde son détail. Dans Le Chai › Bouteilles, une cuvée embouteillée a son bouton « Fiche de la cuvée ». Le Millésime garde ses quatre onglets : son tableau des cuvées et ses courbes ne se trouvent nulle part ailleurs." }
  ] },
  { v: '10.08', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'raisin', titre: 'Cave : le millésime regardé, en haut',
      desc: "Le choix du millésime n’est plus à deux endroits (sous les onglets du Chai, en tête du Millésime) : une seule barre « Millésime regardé », juste sous les sections de la Cave, pour Le Chai et Le Millésime. Aujourd’hui et Le Cuvier ne la montrent pas : l’un regarde toute la cave, l’autre la campagne." }
  ] },
  { v: '10.07', d: '2026-10-25', items: [
    { niv: 1, pour: ['admin'], emoji: 'barrique', titre: 'Cave : une seule fiche par cuvée',
      desc: "La fiche d’une cuvée a maintenant quatre volets : Élevage (les fûts, l’ouillage, le soutirage, le journal), Analyses (le labo), Volumes & origine (la chaîne des volumes, les parcelles, le hL/ha) et Diagnostic (ce qu’il dit de cette cuvée, et le chemin vers son détail). Elle s’ouvre depuis le Chai comme avant, et aussi depuis Le Millésime (« Fiche complète de la cuvée ») et depuis le Diagnostic (« Fiche de la cuvée »). Rien n’a disparu de ces écrans." }
  ] },
  { v: '10.06', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'raisin', titre: 'Cave : un seul millésime regardé',
      desc: "Le Chai et Le Millésime avaient chacun leur choix de millésime : on pouvait filtrer le Chai sur 2025 et lire Le Millésime 2026 sans s’en rendre compte. Ils partagent maintenant le même choix : une année choisie dans l’un est choisie dans l’autre. Quand le Chai montre « Tous », Le Millésime montre celui de la campagne en cours, et le dit." }
  ] },
  { v: '10.05', d: '2026-10-23', items: [
    { niv: 2, pour: ['admin'], emoji: 'sablier', titre: 'Cave : la part des anges d’un jeune millésime est juste',
      desc: "La part des anges s’affichait « par an », mais elle n’était pas ramenée à l’année : pour un millésime entré en fût il y a trois mois, le chiffre était environ quatre fois trop bas. Chaque ligne dit maintenant le pourcentage sur la période réelle (« 0,8 % en 3 mois ») et, à côté, son équivalent sur un an (« soit env. … %/an »). Pour un millésime en fût depuis plus de onze mois, rien ne change. Vérifiez vos jeunes millésimes dans La Réserve › Fûts." }
  ] },
  { v: '10.04', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'calendrier', titre: 'Économie : « Le détail de l’exercice » suit la barre du haut',
      desc: "La sous-vue « Exercice » d’Économie s’appelle maintenant « Le détail de l’exercice » (ou « … de l’année vigne », selon ce que vous regardez). Elle n’a plus ses propres boutons d’année : elle montre l’année choisie dans la barre « Vous regardez », la même que le budget de l’année. Ses trois réglages — le mois où s’ouvre l’exercice, celui où s’ouvre l’année vigne, et la façon de compter un fût acheté — sont rangés dans la roue crantée du Pilotage." }
  ] },
  { v: '10.03', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'engrenage', titre: 'Pilotage : « Afficher dans cet onglet » ne propose que ce qui sert',
      desc: "Sur Aujourd’hui, la liste des cartes à afficher proposait 21 cases, dont 17 ne faisaient plus rien depuis le nouveau cockpit. Il en reste deux, qui agissent vraiment : la vue Cave et ses points dans « À savoir ». La tension par personne se règle maintenant dans L’équipe et le matériel, la protection restante dans Conformité, là où elles s’affichent ; vos choix sont gardés. Et la case « Pour finir les travaux tracteur en cours », une fois décochée, reste décochée." }
  ] },
  { v: '10.02', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'raisin', titre: 'Pilotage : l’onglet « La campagne » devient « Travaux »',
      desc: "La barre « Vous regardez » dit déjà « La campagne » : l’onglet qui montre l’avancement des travaux s’appelle maintenant « Travaux ». La jauge de la saison n’est plus une carte à part : elle ouvre « Avancement par tâche », avec les mêmes chiffres. Le donut s’appelle « La charge par tâche », pour le distinguer du « Temps de l’équipe », qui montre où passent les heures de présence." }
  ] },
  { v: '10.01', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage : l’onglet L’année est rangé',
      desc: "Maintenant que la barre « Vous regardez » choisit l’exercice ou l’année vigne, l’onglet L’année n’a plus lieu d’être. Son budget s’ouvre en tête de la Synthèse d’Économie, avec les avis du cadre ; le renfort à prévoir est dans Équipe et matériel, partie Personnel. Les chiffres ne changent pas : ce sont les mêmes calculs. Si vous aviez laissé le Pilotage sur L’année, il s’ouvre sur Économie." }
  ] },
  { v: '10.00', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], cible: '#pil-crumb', emoji: 'calendrier', titre: 'Pilotage : une seule barre « Vous regardez »',
      desc: "En haut du Pilotage, la barre « Vous regardez » dit ce que montrent tous les écrans : la campagne, l’année vigne ou l’exercice. Touchez « La campagne » puis son nom pour en choisir une autre ; sur l’année vigne ou l’exercice, les flèches remontent aux années passées. À côté, les dates et le jour où vous en êtes. Le choix de l’année ne se cache plus dans l’onglet L’année : celui-ci garde son budget, son renfort et ses avis." }
  ] },
  { v: '9.99', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'tracteur', titre: 'Équipe et matériel : la carte du tracteur revient',
      desc: "Depuis le nouveau cockpit, les cartes du tracteur ne s’affichaient plus nulle part. Elles reviennent dans Pilotage › Équipe & matériel, partie Matériel, sous le parc, la cuve et la consommation : les heures et les litres qu’il reste pour finir les travaux tracteur en cours, le gasoil qu’il restera ensuite dans la cuve, et si la révision tombe pendant ces travaux. Elles ne s’affichent que s’il y a quelque chose à dire, et se masquent depuis « Afficher dans cet onglet ». L’ancien écran Aujourd’hui, qui n’était plus affiché, est retiré de l’appli : rien ne change sur celui que vous voyez." }
  ] },
  { v: '9.98', d: '2026-10-23', items: [
    { niv: 2, pour: ['admin'], emoji: 'calendrier', titre: 'Pilotage : les jours d’avance ou de retard se comptent sur votre planning',
      desc: "Les jours d’avance ou de retard d’Aujourd’hui, la date de fin calculée à la cadence et les jours des Échéances par tâche comptaient tous les jours du lundi au vendredi. Ils comptent maintenant les jours où votre équipe travaille au planning : un jour férié, un vendredi non travaillé de l’horaire d’hiver ou une semaine de fermeture ne comptent plus. Un retard compte les jours travaillés après l’objectif, jusqu’au jour de fin compris : un objectif posé un dimanche ne fait plus perdre un jour. Le chiffre a donc pu bouger d’un jour ou plus, surtout en novembre et en décembre : c’est le bon. Un férié travaillé compte s’il est saisi au planning." }
  ] },
  { v: '9.97', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'verre', titre: 'Cave › Aujourd’hui : des boutons fins, à droite du nom',
      desc: "Dans « À faire aujourd’hui », chaque geste a maintenant un petit bouton à droite du nom de la cuve ou de la cuvée, au lieu d’un grand bouton sur toute la largeur : au téléphone, la liste prend un tiers de place en moins, et le bouton reste aussi facile à toucher. Une cuve qui a une alerte et un relevé en retard n’a plus deux « Relever » : un seul, qui ouvre la fenêtre du relevé — c’est le relevé qui contrôle l’alerte. Quand une cuvée a deux gestes (ouiller et soutirer), leurs boutons passent sous les raisons. « Faire la tournée » et « Nouvelle opération » sont moins hauts." }
  ] },
  { v: '9.96', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'barrique', titre: 'Pilotage › vue Cave : la fleur, le piqué et l’oxydé sur le fût goûté',
      desc: "Dans « La cave en direct », le fût goûté porte le signe de sa dernière dégustation : <b>fleur</b>, <b>piqué</b> ou <b>oxydé</b>, à sa place parmi les fûts de la cuvée — repéré par son tonnelier, son année et sa référence saisis à l’entonnage. Au survol, une bulle donne la référence, le signe, la date et qui a goûté ; sous les fûts, une ligne les liste. Le signe part quand une dégustation plus récente du même fût ne le note plus." }
  ] },
  { v: '9.95', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'verre', titre: 'Pilotage › Aujourd’hui : la vue Cave',
      desc: "La bascule du haut passe à trois vues : <b>Terrain</b>, <b>Cave</b>, <b>Économie</b>. La vue Cave montre d’un coup d’œil ce qui presse en cave (le verdict de la Cave, mot pour mot), chaque cuve dessinée avec son niveau et chaque fût coloré selon ce qu’il demande, la semaine de l’équipe en cave face aux gestes prévus, le millésime de la vigne à la bouteille, les derniers gestes et ce qu’il faut savoir. Chaque ligne ouvre l’écran de la Cave : rien ne se fait depuis le Pilotage. Quand la cave presse, un point s’allume sur « Cave », la phrase du haut le dit et une ligne Cave s’ajoute dans « À savoir »." },
    { niv: 0, pour: ['admin'], emoji: 'microscope', titre: 'Un signe fort au Diagnostic passe en tête de « Ce qui presse »',
      desc: "Quand le Diagnostic du Chai relève des signes forts sur une cuvée (plusieurs indices qui vont ensemble), Cave › Aujourd’hui le dit en premier, et la vue Cave du Pilotage aussi. Un statut décrit des indices, pas une certitude." }
  ] },
  { v: '9.94', d: '2026-10-23', items: [
    { niv: 1, pour: ['admin'], emoji: 'barrique', titre: 'Cave › Aujourd’hui : Le Cuvier, Le Chai et les derniers gestes d’un coup d’œil',
      desc: "Sous « Ce qui presse », « Le Cuvier » montre chaque cuve suivie — son état, sa courbe de densité, le dernier relevé et sa température, la fin estimée — et « Le Chai » chaque cuvée : ses fûts, une jauge d’ouillage (jours passés face au seuil), la malo et le soutirage. Pendant les vendanges le Cuvier passe en premier. Tout en bas, « Derniers gestes » reprend les dix derniers jours : opérations, relevés, décuvages." },
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Un ouillage du week-end revient au vendredi, celui d’un jour férié à la veille',
      desc: "Quand un ouillage tombe un samedi ou un dimanche, la Cave le rappelle le vendredi ; un jour férié, la veille (un lundi férié, le vendredi). La ligne dit « avancé du … », et l’ouillage suivant se compte à partir de ce jour-là." }
  ] },
  { v: '9.93', d: '2026-10-22', items: [
    { niv: 1, pour: ['admin'], emoji: 'verre', titre: 'Cave › Aujourd’hui : une ligne par cuve ou cuvée, un bouton par geste',
      desc: "En tête, le verdict dit ce qui presse, pourquoi, puis ce qui suit. Dessous, chaque cuve ou cuvée a sa ligne avec tous ses gestes — « Relever », « Ouiller », « Soutirer »… — au lieu d’une ligne par geste. « Déjà fait aujourd’hui » reprend les relevés et opérations du jour, « En cave aujourd’hui » montre qui est marqué au Planning, et « Faire la tournée » ouvre la tournée du Cuvier. Sur ordinateur, « À surveiller » reste à droite quand on descend, si elle tient dans l’écran. Les quatre semaines deviennent un calendrier : touchez un jour pour son détail." },
    { niv: 0, pour: ['admin'], emoji: 'alerte', titre: 'Une macération à froid n’est plus « une fermentation qui ralentit »',
      desc: "Une cuve en macération pré-fermentaire, à densité stable, faisait dire à la Cave et au Pilotage « 1 cuve demande un contrôle ». Elle ne déclenche plus d’alerte. À la place, « À surveiller » prévient quand la macération dure plus que les jours prévus à la création de la cuve." },
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Le chiffre « à faire » ne compte que des gestes',
      desc: "Dans la bande de la Cave et la carte Cave du Pilotage, une fin de fermentation estimée n’est plus comptée comme une chose à faire. Le verdict accorde aussi ses mots : « 2 cuvées ont fini leur malo », et « 1 cuvée demande un contrôle » quand c’est la malo d’une cuvée qui bloque." }
  ] },
  { v: '9.92', d: '2026-10-22', items: [
    { niv: 1, pour: ['admin'], emoji: 'thermometre', titre: 'Température du chai, mesures de la mise, part des anges',
      desc: "À la dégustation, notez la température du chai (facultatif) : en dessous de 16 °C, le Diagnostic la compte parmi les freins de la malo. À la mise en bouteille, l’oxygène dissous et les tests de stabilité tartrique et protéique se notent aussi (facultatifs) : une mise à plus de 1 mg/L d’oxygène ou un test instable apparaissent dans les risques de la bouteille. La part des anges de chaque cuvée se calcule seule sur vos volumes d’ouillage, et la Comparaison peut maintenant la mettre en regard des fûts." },
  ] },
  { v: '9.91', d: '2026-10-22', items: [
    { niv: 0, pour: ['admin'], emoji: 'goutte', titre: 'La force de votre solution de SO2, et le diagnostic chiffre vos sulfitages',
      desc: "Dans les Réglages du Diagnostic, indiquez la force de la solution de SO2 utilisée au Chai (5, 6, 8, 10 ou 18 %). Les doses du soutirage, saisies en cL ou mL par fût, deviennent des mg/L : le diagnostic calcule le rendement de chaque sulfitage et peut estimer la dose qui ramènerait le SO2 actif à l’objectif. « Pour confirmer » dit aussi quand une analyse a déjà été faite, avec son résultat." },
  ] },
  { v: '9.90', d: '2026-10-22', items: [
    { niv: 1, pour: ['admin'], emoji: 'fiole', titre: 'Quatre analyses de plus au labo, et le diagnostic les lit',
      desc: "La fiche du labo propose l’azote assimilable (à la vendange), les éthylphénols (4-EP + 4-EG), l’acétate d’éthyle et l’éthanal. Le Diagnostic du Chai les compare au seuil de perception : au-dessus, l’analyse confirme la piste (Brett, piqûre acétique, oxydation) et compte comme un indice principal ; en dessous, elle l’affaiblit — la cuvée ne peut plus être en « Signes forts » pour cette cause, et la carte l’affiche en « Analyse contraire ». L’azote faible pour le degré appuie une fermentation qui traîne." },
  ] },
  { v: '9.89', d: '2026-10-22', items: [
    { niv: 0, pour: ['admin'], emoji: 'verre', titre: 'Aération au soutirage, fleur à la dégustation',
      desc: "Dans Nouvelle opération, le soutirage dit maintenant s’il s’est fait à l’abri de l’air ou à l’air, et la dégustation a un signal « Fleur en surface ». Le Diagnostic du Chai les lit : un soutirage à l’air ou de la fleur appuient une piqûre acétique ou une oxydation, au lieu d’apparaître « non suivis ». Rien de coché reste « non renseigné » : le diagnostic ne suppose rien." },
  ] },
  { v: '9.88', d: '2026-10-22', items: [
    { niv: 1, pour: ['admin'], cible: '#mvc-tbtn-diag', emoji: 'loupe', titre: 'Le Chai a son diagnostic',
      desc: "Nouvel onglet « Diagnostic » dans Le Chai : il croise ce que vous notez déjà — analyses du labo, opérations, fûts, dégustations — et nomme une cause possible quand plusieurs signaux vont ensemble (Brett, piqûre acétique, oxydation, malo lente), avec les indices qui la déclenchent et ce qui permettrait de la confirmer, au labo ou au chai. Rien à y saisir : le seul bouton, « Demander une analyse », prépare la demande pour le labo. L’Échéancier annonce les sulfitages à prévoir ; la Comparaison met vos cuvées côte à côte selon les fûts et le millésime." },
  ] },
  { v: '9.87', d: '2026-10-22', items: [
    { niv: 1, pour: ['admin'], cible: '#plan-mbar-cave', emoji: 'verre', titre: 'Les journées de cave se marquent au Planning',
      desc: "Les heures réelles du Pilotage comptaient en vigne les journées passées en cave — pressurage, entonnage, un ouillage sans nom coché — et les versaient à la prochaine parcelle validée : une réparation pouvait afficher dix fois son barème. Au Planning, cochez les cases de ceux qui étaient en cave, touchez « Cave », puis choisissez la journée, le matin ou l’après-midi. La case garde ses heures, la paie ne change pas, et porte une bande au pied. Le Pilotage ne verse plus ces heures aux parcelles, et la fin prévue des travaux en tient compte, même pour un jour à venir." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: '« Cave » dans les équipes du jour',
      desc: "Le matin même, la fenêtre des équipes du jour propose « Cave » à côté des équipes : la personne passe la journée en cave, ses heures ne vont pas à la vigne et elle quitte les équipes. C’est la même marque qu’au Planning ; une demi-journée se marque au Planning." },
  ] },
  { v: '9.86', d: '2026-10-22', items: [
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Une date qui n’existe pas est signalée',
      desc: "En créant une période, une fin au 31 septembre faisait répondre « Début et fin obligatoires » alors que les deux cases étaient remplies : le 31 septembre n’existe pas, et la case se lisait vide. En modifiant une période, la même date effaçait sa fin sans prévenir. Une date impossible ou incomplète passe maintenant en rouge, avec son explication, et rien n’est enregistré tant qu’elle n’est pas corrigée — pas plus qu’une fin placée avant le début. Au passage, la liste des tâches d’une nouvelle période écrit « temps réel » là où elle affichait « undefined h/ha »." },
  ] },
  { v: '9.85', d: '2026-10-22', items: [
    { niv: 1, pour: ['tous'], cible: '#mv-dock', emoji: 'oeil', titre: 'Les icônes des modules prennent du relief',
      desc: "En bas de l’écran comme dans la barre de gauche sur ordinateur, chaque module a maintenant son icône sur une petite tuile de métal gris, et celui où vous êtes ressort en lie-de-vin. Dans le menu « Plus », les modules sont rangés quatre par ligne, comme sur l’écran d’accueil d’un téléphone ; quand vous êtes dans l’un d’eux, c’est « Plus » qui s’allume." },
  ] },
  { v: '9.84', d: '2026-10-22', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Sur ordinateur, le tuto se range à côté de l’appli',
      desc: "Le panneau du tuto se posait par-dessus la droite de l’écran et cachait justement le bouton à toucher, celui que montre le cercle doré. Il se colle maintenant au bord droit et l’appli se resserre à côté : vous voyez et touchez les deux en même temps, fenêtres comprises. Si la place manque, la barre des modules se replie d’elle-même. Sur un écran de moins de 1 280 pixels, l’entraînement s’ouvre en plein écran, comme sur téléphone." },
    { niv: 0, pour: ['tous'], emoji: 'ajout', titre: 'Le « + » des boutons d’ajout est revenu',
      desc: "« Noter des mesures », « Nouvelle récolte », « Nouvelle cuve », « Saisir un rapport » et les autres boutons d’ajout montraient trois points au lieu d’un « + ». Ils ont retrouvé leur « + » ; les trois points restent au menu « Plus »." },
  ] },
  { v: '9.83', d: '2026-10-22', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Le tuto « corriger l’équipe d’une validation » va au bout',
      desc: "Il restait bloqué dès la première étape : le domaine d’entraînement n’avait aucune validation dans son Journal, donc aucun bouton « Équipe » à montrer. Il en a maintenant, et le tuto se joue jusqu’à « Enregistrer », sur téléphone comme sur ordinateur, et à côté de l’appli." },
  ] },
  { v: '9.82', d: '2026-10-22', items: [
    { niv: 0, pour: ['tous'], emoji: 'nuage', titre: 'La bascule de la carte Météo, discrète et lisible',
      desc: "Sur un domaine à plusieurs communes, les boutons « Vignoble » et « Secteurs » de la carte Météo étaient trop gros et trop voyants, et rien ne montrait lequel était choisi. Ils deviennent une petite bascule dans un même cadre, comme les autres de l’appli : la vue choisie est surlignée." },
  ] },
  { v: '9.81', d: '2026-10-21', items: [
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Corriger l’équipe : on voit qui est coché, et seulement qui était là',
      desc: "Dans la fenêtre « Qui a fait ce travail ? » du Journal, les personnes cochées ne se distinguaient pas des autres, et tous les noms jamais inscrits s’affichaient. Les cochées passent en vert ; la liste ne propose plus que les personnes sous contrat le jour de l’entrée, plus celles déjà notées." },
    { niv: 0, pour: ['tous'], emoji: 'equipe', titre: 'Les listes d’équipe ne proposent que les personnes sous contrat',
      desc: "À la validation, dans la barre « Équipe sur… » des Parcelles et dans « Équipes du jour », un saisonnier dont le contrat était fini restait proposé tant que sa fiche n’était pas passée « Inactif ». Ces listes suivent maintenant les dates de contrat ; à la validation, celles du jour choisi : changez la date, la liste suit et garde les cochés." },
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'Les compteurs de la barre, discrets et alignés',
      desc: "Sur ordinateur, les ronds rouges de la barre de gauche étaient trop voyants, tombaient trop bas et le « 9+ » dépassait. Le nombre devient un petit compteur gris au bout de la ligne, tous alignés ; barre repliée, un point sur l’icône, et le nombre au survol. Les libellés s’accordent (« 2 points à anticiper »)." },
  ] },
  { v: '9.80', d: '2026-10-21', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-savoir', emoji: 'graphique', titre: 'Les points à anticiper, en tête et d’un geste',
      desc: "La phrase du haut d’Aujourd’hui annonçait des « points à anticiper » sans qu’on les trouve : dans « À savoir », ils venaient après les absences et pouvaient rester cachés sous « Tout voir ». Ils passent en tête de la liste, surlignés et marqués « À anticiper » ; touchez la phrase pour y aller. Ce sont les tâches dont les dates sont passées, les contrats qui finissent dans les 30 jours, et la pluie ou le vent sur une commune où une tâche est en cours." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Les absences s’écrivent sans faute d’accord',
      desc: "La tuile Effectif écrivait « absent » derrière chaque prénom, même au féminin ; elle dit maintenant « Absences : » suivi des prénoms ; un motif connu reste derrière le prénom, comme avant (« en congé », « en arrêt »). Dans « À savoir », « Absence de » prend l’apostrophe devant une voyelle." },
  ] },
  { v: '9.79', d: '2026-10-21', items: [
    { niv: 1, pour: ['admin'], cible: '#page-journal', emoji: 'equipe', titre: 'Corriger l’équipe d’une validation',
      desc: "Dans le Journal, le bouton « Équipe » d’une validation dit qui a vraiment travaillé : vous pouvez rester décoché si vous avez validé pour les autres. « Toute la journée » corrige d’un coup les validations de la même tâche, le même jour." },
    { niv: 0, pour: ['tous'], emoji: 'maison', titre: 'L’Accueil compte comme le reste de l’appli',
      desc: "« La saison » et la carte du jour comptent les étapes d’un arrachage, comme les Parcelles ; le pourcentage de la saison est celui du Pilotage ; « En direct » ne montre que les sessions de tracteur de la saison ; « Ma saison » ne compte plus celui qui a validé sans travailler." },
  ] },
  { v: '9.78', d: '2026-10-21', items: [
    { niv: 0, pour: ['tous'], emoji: 'nuage', titre: 'La météo en une seule carte',
      desc: "« Vignoble » montre les cinq jours ; quand le domaine a plusieurs communes, « Secteurs » montre la météo de chaque commune, dans la même carte." },
  ] },
  { v: '9.77', d: '2026-10-21', items: [
    { niv: 1, pour: ['tous'], cible: '#home-savoir', emoji: 'maison', titre: 'L’Accueil rangé en sept cartes',
      desc: "La carte du jour, « À savoir » (délai de rentrée, pluie, gel, vent), la météo, « La saison », « Ma saison » (votre part, votre semaine en hectares, vos jalons), « Au tracteur » et « En direct ». Sur ordinateur, la journée à gauche et une colonne à droite qui reste visible en descendant ; au téléphone, l’ordre des questions du matin." },
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Personnaliser : l’œil seul',
      desc: "Chacun choisit les cartes qu’il affiche ; l’ordre suit la journée et ne bouge plus." },
  ] },
  { v: '9.76', d: '2026-10-21', items: [
    { niv: 1, pour: ['tous'], cible: '#home-prio-mos', emoji: 'eclair', titre: 'La carte du jour, refaite',
      desc: "En haut de l’Accueil : la tâche du jour en grand, le message de l’administrateur, l’avancement en hectares avec ce qui a avancé aujourd’hui et hier, votre équipe, la parcelle en cours et la fin prévue. À côté, les parcelles à leur forme, avec leurs rangs, en couleurs franches. Un délai de rentrée en cours s’affiche en rouge en haut de la carte et sur les parcelles concernées." },
    { niv: 0, pour: ['admin'], emoji: 'crayon', titre: 'La priorité se modifie depuis la carte',
      desc: "« Modifier » sur la carte du jour ouvre la priorité et son message ; « Équipes du jour » se règle juste dessous." },
  ] },
  { v: '9.75', d: '2026-10-21', items: [
    { niv: 1, pour: ['tous'], emoji: 'feuille', titre: 'Des parcelles bien colorées sur les plans',
      desc: "Sur le plan du Pilotage, la carte de l’Accueil et les fiches : fait en vert, en cours en ambre, à faire en blanc, en retard en rouge, arrachée en gris hachuré — on les distingue d’un coup d’œil." },
    { niv: 0, pour: ['admin'], emoji: 'cle', titre: 'Quatre finitions du Pilotage',
      desc: "« En direct » nomme l’équipe d’un arrachage fait en étapes ; le choix de la tâche montre qu’il défile ; les lignes des chantiers tiennent dans leur carte ; l’aide dit comment zoomer sur une campagne." },
  ] },
  { v: '9.74', d: '2026-10-21', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-page', emoji: 'eclair', titre: 'Aujourd’hui bouge en direct',
      desc: "Quand l’équipe valide, Pilotage › Aujourd’hui se met à jour sans recharger : la date de fin roule, les barres avancent, la parcelle s’éclaire sur le plan et le fil s’allonge." },
    { niv: 0, pour: ['tous'], emoji: 'alerte', titre: 'Des pastilles dans la barre latérale',
      desc: "Sur ordinateur, une pastille rouge signale ce qui attend : un tracteur en réparation, ce qui presse en cave, et pour l’admin un contrat qui finit dans le mois ou un point prioritaire du Pilotage." },
  ] },
  { v: '9.73', d: '2026-10-21', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#ml-tab-parc', emoji: 'raisin', titre: 'Le rendement par appellation, et le hL/ha de chaque cuvée',
      desc: "Dans Le millésime, la vue Parcelles s’ouvre maintenant sur ce qui se déclare : pour chaque appellation et chaque couleur, la surface récoltée, le volume et le hL/ha, face au maximum de l’appellation. Le raisin vendu compte, sur toute la surface de sa parcelle. "
        + "Dans la vue Cuvées, la fiche d’une cuvée donne aussi son hL/ha, sous le kg/hL : ses hectolitres sur la surface des parcelles qui ont rempli la cuve, part du domaine seulement. Quand une surface manque, la fiche dit laquelle au lieu d’afficher un chiffre trop haut." },
  ] },
  { v: '9.72', d: '2026-10-21', items: [   // COLLE-1 (§412) : « En direct » au-dessus d’« À savoir », plus rien sous le bandeau
    { niv: 1, pour: ['admin'], cible: '#ck-fil', emoji: 'oeil', titre: '« En direct » rejoint « À savoir », à droite',
      desc: "Sur ordinateur, dans Pilotage › Aujourd’hui, « En direct » passe en haut de la colonne de droite, au-dessus d’« À savoir », et les deux restent visibles quand vous descendez dans la page : ils ne passent plus sous le bandeau du haut, et les onglets du Pilotage restent en haut eux aussi. « En direct » garde la hauteur d’une journée calme ; quand il y a plus, « Tout voir » le déplie." },
  ] },
  { v: '9.71', d: '2026-10-21', items: [   // REVUE-10 (§410) : les finitions de la revue
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Dernières finitions',
      desc: "Le titre de la campagne dans les Réglages et quelques titres des Archives passent en lettres normales ; dans le Tracteur, le bouton d’ajout d’un conducteur s’écrit « + Conducteur »." },
  ] },
  { v: '9.70', d: '2026-10-21', items: [   // REVUE-9 (§409) : la visite de démo sans « Mise en route »
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Visite de démo : un domaine installé',
      desc: "Dans la visite de démonstration, l’Accueil ne montre plus « Mise en route » (le nom du domaine, les parcelles, les contours…) : un visiteur découvre un domaine en marche, il n’a rien à installer. Votre propre Accueil ne change pas." },
  ] },
  { v: '9.69', d: '2026-10-21', items: [   // REVUE-8 (§408) : rien à mesurer ne fait plus 100 %
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Plus de « 100 % » sans travaux',
      desc: "Quand aucun travail n’est encore prévu (une saison qui démarre), l’avancement s’affiche « — » sur l’Accueil et dans le Pilotage, au lieu d’un « 100 % » trompeur ; la carte de la saison dit « À venir »." },
  ] },
  { v: '9.68', d: '2026-10-21', items: [   // REVUE-7 (§407) : la lecture — chiffres et libellés
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Des chiffres et des titres plus faciles à lire',
      desc: "Les chiffres s’écrivent tous à pleine hauteur et s’alignent en colonne : fini le « 0 » qui ressemblait à un « o ». Les petits titres qui étaient en capitales espacées (« Millésime », « Mes jalons », « Finies »…) s’écrivent en lettres normales, et « Arrach. » devient « Arrachées »." },
  ] },
  { v: '9.67', d: '2026-10-21', items: [   // REVUE-6 (§406) : la revue complète, premières corrections
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Petites corrections, grand confort',
      desc: "Le message « Mode hors ligne » ne reste plus posé sur l’en-tête : il s’annonce puis s’efface, le voyant en haut à droite garde l’état. La suppression d’une session se range dans une zone de danger, en bouton discret (le rouge plein n’arrive qu’à la confirmation). La priorité du jour s’écrit dans un doré lisible, et le Chai dit « Ouiller la cuvée aujourd’hui » quand il n’y en a qu’une." },
  ] },
  { v: '9.66', d: '2026-10-21', items: [   // CHARTE-6e (§405) : l’interrupteur et les dernières étiquettes
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Interrupteurs à la couleur de l’appli',
      desc: "Les interrupteurs (« Masquer les retirés » du catalogue phyto, les affichages du Pilotage) prennent la couleur d’action quand ils sont activés, et leur piste se voit mieux quand ils ne le sont pas. Quelques titres de champs encore en petites capitales passent en lettres normales." },
  ] },
  { v: '9.65', d: '2026-10-20', items: [   // CHARTE-6d (§404) : les derniers champs faits à la main
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Les derniers champs au même dessin',
      desc: "Une cinquantaine de champs faits à part (assistant phyto, Planning, Réglages, Tracteur, fenêtres de l’appli) prennent le dessin commun ; les petits champs de chiffres gardent leur taille. Sur iPhone, aucun ne fait plus zoomer l’écran." },
  ] },
  { v: '9.64', d: '2026-10-20', items: [   // CHARTE-6c (§403) : les champs du Cuvier au même dessin
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Cuvier : des champs et un « Enregistrer » comme ailleurs',
      desc: "Dans les fiches du Cuvier (clients, apports, décuvage, opérations), les champs prennent le dessin commun — blancs, contour net, titres en lettres normales — et « Enregistrer » la couleur d’action, plus le doré. Pareil pour la fiche d’une cuve de la Cave et les réglages des tournées." },
  ] },
  { v: '9.63', d: '2026-10-20', items: [   // RSV-BTN (§402) : les boutons de la Réserve au jeu commun
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Réserve : les boutons comme ailleurs',
      desc: "Dans la Réserve, « Enregistrer » prend la couleur d’action de l’appli (plus le brun), « Annuler » et les petits boutons des listes le dessin commun, et le choix « Par unités / Directe / Les deux » se marque de la même couleur. Les « − / + » des fûts aussi." },
  ] },
  { v: '9.62', d: '2026-10-20', items: [   // CHARTE-6b (§401) : les autres champs au même dessin
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Les mêmes champs partout',
      desc: "Les formulaires de la Réserve (achats, inventaires), des heures, du Planning et de la visite guidée prennent les mêmes champs blancs au contour net, avec leur titre en lettres normales. Les cases à cocher prennent la couleur de l’appli." },
  ] },
  { v: '9.61', d: '2026-10-20', items: [   // CHARTE-6a (§400) : le jeu des cases de saisie
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Des champs plus lisibles',
      desc: "Les cases où l’on écrit ont un fond blanc et un contour bien visible, même au soleil, et leur titre au-dessus s’écrit en lettres normales, plus en petites capitales grises. Quand on touche un champ, son contour prend la couleur de l’appli." },
  ] },
  { v: '9.60', d: '2026-10-20', items: [   // CHARTE-5f (§399) : les états et les choix au dessin commun
    { niv: 0, pour: ['admin','tractoriste'], emoji: 'check', titre: 'Traitement phyto : les choix et les alertes au même dessin',
      desc: "Dans l’assistant d’un traitement, ce qu’on choisit (produit, parcelles, conducteur, conventionnel ou bio) s’entoure de lie-de-vin, et « Continuer » prend la couleur d’action. Dans la fiche d’un produit et d’un traitement, le DAR, le délai de rentrée et la ZNT prennent les tons communs : vert si c’est bon, ambre à surveiller, rouge en cas de danger." },
  ] },
  { v: '9.59', d: '2026-10-20', items: [   // CHARTE-5e (§398) : tuiles, lignes et petites cartes au dessin commun
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Tuiles et listes au même dessin',
      desc: "Les petites tuiles de chiffres (récapitulatifs du Planning, réglages), les lignes qu’on touche (traitements du Tracteur, communes, choix de complantation) et les cartes d’analyses de la Cave prennent le dessin commun des cartes : fond, filet fin, coins arrondis." },
  ] },
  { v: '9.58', d: '2026-10-20', items: [   // ZONES-1 (§397) : les zones sombres tranchées
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Les bandeaux sombres au même dessin',
      desc: "« Ma trace », le mur du domaine et le bilan du cuivre partagent le même bandeau sombre, aux coins plus discrets, sans capitales. La fiche d’une cuvée range ouillage, analyse et soutirage dans une seule carte. Les mentions légales et quelques messages restent lisibles en mode clair." },
  ] },
  { v: '9.57', d: '2026-10-20', items: [   // CHARTE-5d (§396) : les notes grises au dessin commun
    { niv: 1, pour: ['tous'], emoji: 'check', titre: 'Les petites notes au même dessin',
      desc: "Les petits blocs gris d’explication (dans le Phyto, les Réglages, le Planning, la Cave, le Pilotage et les fenêtres) prennent tous la même forme : mêmes coins, même marge, même gris, en clair comme en sombre." },
  ] },
  { v: '9.56', d: '2026-10-20', items: [   // CHAT-0 (§395) : l’ancien module de discussion retiré
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Ménage : l’ancienne discussion retirée',
      desc: "Le premier module de discussion de l’appli (canaux et messages privés) est retiré. Il n’était plus accessible depuis longtemps : pour échanger avec l’équipe, WhatsApp, les messages et les appels font ça plus simplement. Vos données ne sont pas touchées." },
  ] },
  { v: '9.55', d: '2026-10-20', items: [   // CHRONO-1 (§394) : le chrono au dessin commun
    { niv: 0, pour: ['admin','tractoriste'], emoji: 'check', titre: 'Le chrono plus lisible',
      desc: "Dans une session, les trois temps du chrono tiennent dans une seule carte, une case chacun, les chiffres en noir et bien gros. Chaque sorte de temps garde sa couleur, sur son icône : vert dans les parcelles, gris hors parcelle, ambre pour la pause — les deux bleus d’avant se confondaient au soleil. L’explication passe en encadré bleu, « Pause déjeuner » et « Fin de journée » prennent le dessin commun." },
  ] },
  { v: '9.54', d: '2026-10-20', items: [   // REVUE-4 (§393) : la revue à l’écran, quatrième passage
    { niv: 1, pour: ['admin','tractoriste'], emoji: 'check', titre: 'Session : l’écart du chrono ne déborde plus',
      desc: "Dans une session de tracteur, l’étiquette qui signale un écart du chrono (par exemple « chrono resté ouvert ») passe à la ligne au lieu d’écraser le nom de la parcelle." },
  ] },
  { v: '9.53', d: '2026-10-20', items: [   // REVUE-3 (§392) : l’assistant de traitement phyto au dessin commun
    { niv: 1, pour: ['admin','tractoriste'], emoji: 'check', titre: 'Traitement phyto : le récapitulatif plus net',
      desc: "Dans l’assistant d’un traitement, le budget cuivre devient une carte neutre (le titre n’est plus bleu), les boutons « Tout » et « Aucune » des parcelles prennent le dessin commun, et l’information du registre passe à l’encadré bleu." },
  ] },
  { v: '9.52', d: '2026-10-20', items: [   // REVUE-2 (§390) : la revue à l’écran, deuxième passage
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Le mur et « Ma trace » respirent',
      desc: "Sur le mur du domaine et dans « Ma trace », les cartes ne touchent plus les bords de l’écran du téléphone. Sur le mur, « Enregistrer le mot » et le choix « toute l’équipe / l’administrateur seul » prennent le dessin commun. Dans les documents, l’encadré « Obligatoire » passe en ambre : une obligation, pas un danger." },
  ] },
  { v: '9.51', d: '2026-10-20', items: [   // REVUE-1 (§389) : la revue des écrans passés au nouveau dessin
    { niv: 1, pour: ['admin'], emoji: 'check', titre: 'Export de la Cave : la cuvée choisie se voit de nouveau',
      desc: "Dans l’export de la Cave, la cuvée que vous cochez reprend la couleur lie-de-vin du choix. Depuis le nouveau dessin des filtres, elle ne se distinguait plus des autres." },
  ] },
  { v: '9.50', d: '2026-10-20', items: [
    { niv: 0, pour: ['admin'], emoji: 'raisin', titre: 'Un tuto pour les maturités',
      desc: "« Comment faire pour noter des mesures de maturité ? » rejoint les tutos guidés : la Cave, Le Cuvier, Maturités, « Noter des mesures », une valeur, enregistrer — sur un domaine fictif, sans rien toucher au vôtre." },
  ] },
  { v: '9.49', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin'], cible: '#cave-hdr-gear', emoji: 'engrenage', titre: 'Une ligne par réglage',
      desc: "Dans la roue crantée de la Cave, Le Cuvier et Le Chai montrent chaque réglage sur une ligne : sa valeur, à quoi il sert, et « Modifier », qui ouvre sa fenêtre. "
        + "La fourchette de maturité se saisit en sucre ou en degré ; chaque réglage s’enregistre seul — le bouton « Enregistrer les paramètres » est parti. Les règles restent : une valeur hors bornes est ramenée et l’écran le dit, des ratios inversés sont remis dans l’ordre." },
  ] },
  { v: '9.48', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin'], cible: '#cave-hdr-gear', emoji: 'engrenage', titre: 'La roue crantée de la Cave, rangée',
      desc: "Les réglages et documents de la cave se rangent en quatre sections — Le Cuvier, Le Chai, Appellations, Documents —, une à la fois : la navigation est en haut au téléphone, à gauche sur ordinateur. "
        + "Appellations montre chaque appellation avec son maximum du millésime et son minimum de maturité, et les deux minimums (rouges, blancs) s’y posent d’un geste." },
  ] },
  { v: '9.47', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#mvv-tab-ana', emoji: 'raisin', titre: 'Le minimum de l’appellation',
      desc: "Chaque appellation porte maintenant sa richesse minimale en sucre, par couleur, comme dans son cahier des charges (Gevrey-Chambertin : 180 g/L en rouge). Elle se pose dans Appellations & plafonds, avec « ··· ». "
        + "Les Maturités la tracent en trait rouge sur chaque parcelle rattachée, comptent celles qui sont dessous, et la fiche d’une parcelle dit « atteint le… » ou ce qu’il manque." },
  ] },
  { v: '9.46', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#mvv-tab-tour', emoji: 'check', titre: 'La tournée, à la même enseigne',
      desc: "La Tournée du Cuvier prend la tête claire des autres onglets : « Tournée du jour », la date, « Qui ? ». La progression et les filtres tiennent dans une carte collée en haut de l’écran. "
        + "En bas, « Terminer la tournée » et « Intervention groupée », écrit en toutes lettres à la place du « + ». La saisie, les compteurs et l’enregistrement ne changent pas." },
  ] },
  { v: '9.45', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#mvv-tab-cuves', emoji: 'cuve', titre: 'Les cuves s’ouvrent en fiche',
      desc: "Touchez une cuve : sa fiche s’ouvre à droite sur ordinateur, dans une fenêtre au téléphone — la frise, la courbe, le labo, les relevés, les opérations et tous les boutons, comme avant. "
        + "En haut de l’onglet Cuves : la vendange choisie, « Fusionner », « Nouvelle cuve », et quatre chiffres (en fermentation, à relever, en cuve, en attente d’encuvage). Sur ordinateur, le plan de cuverie occupe la droite tant qu’aucune cuve n’est ouverte." },
  ] },
  { v: '9.44', d: '2026-10-20', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#mvv-tab-rec', emoji: 'raisin', titre: 'Les récoltes, rangées',
      desc: "L’onglet Récoltes du Cuvier se range comme les Maturités, sur la même vendange choisie : quatre chiffres (rentrées, rendement moyen, récolté, en cuve), puis le rendement de chaque parcelle face au maximum de son appellation, avec l’an passé en rond creux. "
        + "Une valeur quand le volume est mesuré, une fourchette quand il est estimé — les mêmes chiffres que Le millésime. Le journal range les pesées par jour ; touchez une parcelle pour sa fiche : pesées, historique, « Voir sa maturité »." },
  ] },
  { v: '9.43', d: '2026-10-19', items: [   // CHARTE-5c (§381) : les encadrés d’alerte, partout ailleurs
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les encadrés d’alerte, partout',
      desc: "Les encadrés qui préviennent ou rassurent prennent les quatre tons communs dans le reste de l’appli : fenêtres de saisie, Planning, Accueil, Cave, Pilotage, et le bilan de la campagne dans les Réglages. Bleu pour informer, vert quand c’est bon, ambre pour faire attention, rouge pour un danger." },
  ] },
  { v: '9.42', d: '2026-10-19', items: [   // CHARTE-5b (§380) : les encadrés du Phyto et des Réglages au jeu
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les encadrés d’alerte au même dessin',
      desc: "Au Phyto et dans les Réglages, les encadrés qui préviennent ou rassurent prennent les quatre tons communs : bleu pour informer, vert quand c’est bon, ambre pour faire attention, rouge pour un danger. Le texte reste noir, lisible ; la couleur dit le sens." },
  ] },
  { v: '9.41', d: '2026-10-19', items: [   // CHARTE-5a (§379) : le jeu de cartes commun, premier passage
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les cartes au même dessin',
      desc: "Les cartes prennent un dessin commun : fond blanc, un filet fin, coins arrondis, sans ombre. Premier passage : les demandes du Planning, « Ma trace » et le mur de l’équipe sur l’Accueil. Les autres suivront, avec les encadrés d’information." },
  ] },
  { v: '9.40', d: '2026-10-19', items: [   // CHARTE-4c (§378) : 34 pastilles faites à la main rendues au jeu
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les dernières petites étiquettes au même dessin',
      desc: "Les petites étiquettes qu’on avait dessinées une par une prennent la forme commune : au Phyto (DAR, ZNT, délai de rentrée, autorisé, retiré), à la Cave (FML, SO2), au Planning (conforme, semaines au-delà du maximum, CP), au Tracteur (en réparation, DAR, rentrée) et dans les exports des Réglages." },
  ] },
  { v: '9.39', d: '2026-10-19', items: [   // CHARTE-4b (§377) : trois filtres au jeu de pastilles
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les filtres au même dessin',
      desc: "Les petits boutons qui trient une liste ont tous la même forme ronde, et celui qui est choisi prend la couleur lie-de-vin : les millésimes du Chai, les cuvées d’une opération de cave, « Désactiver » et « Voir toutes » dans une session de tracteur." },
  ] },
  { v: '9.38', d: '2026-10-19', items: [   // CHARTE-4a (§374) : le jeu de pastilles commun, premier passage
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les petites étiquettes au même dessin',
      desc: "Les petites étiquettes qui disent l’état d’une chose (fait, en cours, en retard) prennent toutes la même forme et la couleur de leur sens : vert pour ce qui est fait, ambre pour ce qui est à surveiller, rouge pour ce qui est en retard. Les autres restent neutres. Premier passage : le Planning, la Cave, le Tracteur, le Pilotage et la Discussion." },
  ] },
  { v: '9.37', d: '2026-10-19', items: [   // CHARTE-3c (§373) : les « − / + » passent au jeu commun
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les « − » et « + » au même dessin',
      desc: "Les petits boutons « − » et « + » qui font monter ou descendre un nombre (volume d’une ouillette, nombre de fûts, tournée du Cuvier, réparations) ont tous le même dessin : un carré bordé, à la taille du doigt au téléphone. Ils étaient ronds, gris ou couleur terre selon l’écran." },
  ] },
  { v: '9.36', d: '2026-10-19', items: [   // CHARTE-3b (§372) : le bouton des fenêtres passe au jeu commun
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Les boutons des fenêtres aussi',
      desc: "Dans les fenêtres qui s’ouvrent pour ajouter, enregistrer ou confirmer, le bouton d’action prend la couleur lie-de-vin, et les suppressions le rouge du bouton Danger — fini le vert, l’orange, le bordeaux ou le bleu selon l’écran. « Annuler » et « Fermer » ont tous le même dessin." },
  ] },
  { v: '9.35', d: '2026-10-19', items: [   // CHARTE-3 (§370) : le jeu de boutons commun, premier passage
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Des boutons qui se ressemblent',
      desc: "Premier passage au jeu de boutons commun : l’action principale prend partout la même couleur lie-de-vin (Planning, Cave, Tracteur), et les choix entre options — type de travail, opération de cave, motif de sortie d’un fût — ont une seule apparence. Au téléphone, ces boutons sont plus hauts, pour le doigt ; sur ordinateur, plus serrés." },
  ] },
  { v: '9.34', d: '2026-10-19', items: [   // CHARTE-2B (§369) : le mode plein soleil rejoint la charte, et les fenêtres le prennent aussi
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Plein soleil : les fenêtres aussi',
      desc: "En mode plein soleil (Réglages › Moi), les fenêtres qui s’ouvrent par-dessus l’écran — saisies, confirmations, fiches — gardaient les encres ordinaires, moins lisibles dehors. Elles prennent maintenant les mêmes encres renforcées que le reste de l’appli." },
  ] },
  { v: '9.33', d: '2026-10-19', items: [] },   // CHARTE-2 (§368) : les réglages rassemblés dans src/charte.css — rien ne change à l’écran
  { v: '9.32', d: '2026-10-19', items: [] },   // CHARTE-1 (§367) : la police passe par la charte — rien ne change à l’écran
  { v: '9.31', d: '2026-10-19', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#mvv-tab-ana', emoji: 'raisin', titre: 'Les maturités, rangées',
      desc: "L’onglet Maturités du Cuvier tient sur un écran clair : en haut, la vendange choisie et «\u00a0Noter des mesures\u00a0» ; puis où en est la maturité, avec trois tuiles qui filtrent ; puis l’ordre de maturité, une ligne par parcelle, la plus avancée en tête. "
        + "Touchez une parcelle pour sa fiche : dernière mesure, vitesse, rang, courbe et mesures. «\u00a0Noter des mesures\u00a0» ouvre une seule feuille pour toute la tournée : remplissez les parcelles mesurées, puis enregistrez tout d’un coup. "
        + "Nouveau réglage dans la roue crantée › Le Cuvier : la fourchette de sucre visée, une pour les rouges et une pour les blancs. Elle se dessine en bande sur chaque ligne et sur les courbes. Et les années ne se mélangent plus." },
  ] },
  { v: '9.30', d: '2026-10-19', items: [
    { niv: 0, pour: ['tous'], emoji: 'livre', titre: 'La fenêtre d’aide s’affiche proprement',
      desc: "Dans la fenêtre «\u00a0? Aide\u00a0», le nom de l’icône s’écrivait en toutes lettres en haut («\u00a0graphique\u00a0», «\u00a0feuille\u00a0»…), et des bouts de code apparaissaient au milieu des phrases, surtout dans l’aide du Pilotage, de la Cave et des Parcelles. "
        + "L’icône est revenue et le gras s’affiche en gras. Dans l’aide du Pilotage, deux phrases fausses sont corrigées\u00a0: le nombre d’onglets, et l’onglet où il s’ouvre — toujours Aujourd’hui à l’ouverture de l’appli." },
  ] },
  { v: '9.29', d: '2026-10-19', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Le tuto des équipes ne saute plus d’étape',
      desc: "Correction : quand vous placiez quelqu’un dans une équipe sur votre domaine, le tuto ouvert à côté pouvait sauter une étape. "
        + "Il attend maintenant que vous enregistriez, puis rejoue les choix dans l’ordre. Un même geste n’est plus jamais refait deux fois." },
  ] },
  { v: '9.28', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Le tuto à côté de l’appli suit plus vite',
      desc: "Quand vous faites un geste sur votre domaine, le tuto ouvert à côté passe à l’étape suivante en une demi-seconde, au lieu de trois. "
        + "Il ne rejoue plus le geste avec son doigt animé : il le fait d’un coup. Le panneau affiche «\u00a0Préparation de l’entraînement…\u00a0» pendant qu’il s’ouvre." },
  ] },
  { v: '9.27', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Le tuto à côté de l’appli démarre là où vous êtes',
      desc: "Si votre appli est déjà sur le bon module ou le bon onglet, le tuto ouvert à côté commence directement à cette étape, sans refaire le chemin. "
        + "Il regarde lui-même votre appli pour suivre vos gestes : le message «\u00a0Votre appli ne répond pas\u00a0» disparaît." },
  ] },
  { v: '9.26', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Le tuto ouvert à côté de l’appli suit vraiment vos gestes',
      desc: "Correction : une ancienne pièce de l’appli restait en mémoire après les mises à jour, et le panneau du tuto ne voyait pas vos gestes sur votre domaine. "
        + "Elle est maintenant toujours à jour. Le panneau dit s’il vous suit : «\u00a0Je suis vos gestes sur votre domaine\u00a0»." },
  ] },
  { v: '9.25', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Sur ordinateur, le tuto suit vos gestes sur votre domaine',
      desc: "Quand le tuto est ouvert à côté de l’appli, faites chaque geste où vous voulez : dans le tuto, ou pour de vrai sur votre domaine. "
        + "Si vous le faites sur votre domaine, le tuto le voit et avance tout seul : plus besoin de le faire deux fois. "
        + "Un cercle doré discret montre le bouton à toucher sur votre domaine. Le tuto, lui, ne touche jamais à votre domaine." },
  ] },
  { v: '9.24', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'doigt', titre: 'Sur ordinateur, le tuto s’ouvre à côté de l’appli',
      desc: "«\u00a0Me montrer comment faire\u00a0» ouvre maintenant l’entraînement dans un panneau à droite de l’écran : vous suivez le tuto d’un côté et vous pouvez faire le geste pour de vrai sur votre domaine de l’autre, en même temps. "
        + "«\u00a0De l’autre côté\u00a0» déplace le panneau, «\u00a0Fenêtre à part\u00a0» l’ouvre dans sa propre fenêtre. Sur téléphone, rien ne change. "
        + "Chaque tuto porte maintenant la question qu’on se pose : «\u00a0Comment faire pour noter un plein de GNR\u00a0?\u00a0»." },
  ] },
  { v: '9.23', d: '2026-10-18', items: [
    { niv: 1, pour: ['admin'], cible: '#home-aide-btn', emoji: 'doigt', titre: 'Des tutos guidés : l’appli vous montre où toucher',
      desc: "Dans l’aide de l’Accueil et du Tracteur, «\u00a0Me montrer comment faire\u00a0» lance un entraînement : un cadre doré montre où toucher, une consigne dit quoi faire, et c’est vous qui touchez. "
        + "Il se joue sur le Domaine des Grandes Vignes, un domaine fictif : rien de ce que vous touchez n’arrive sur votre domaine, et un bouton vous y ramène à la fin. "
        + "Deux tutos pour commencer : indiquer les équipes du jour, et noter un plein de GNR. «\u00a0Montre-moi\u00a0» fait le geste à votre place si vous êtes bloqué." },
  ] },
  { v: '9.22', d: '2026-10-18', items: [
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage\u00a0: « Ce qu’il manque » n’est plus coupé en bas',
      desc: "La barre des modules passait encore devant le bas du panneau ouvert par «\u00a0N choses à compléter\u00a0» : la dernière ligne et son bouton restaient cachés, même en faisant défiler. "
        + "Le panneau passe maintenant devant la barre, et tout se lit jusqu’au dernier bouton." },
    { niv: 0, pour: ['admin'], emoji: 'balance', titre: 'Pilotage\u00a0: l’arrachage ne réclame plus de barème',
      desc: "« Ce qu’il manque » demandait des heures par hectare pour l’arrachage et l’entreplantation, et renvoyait vers les tâches de la Vigne, où il n’y avait rien à corriger. "
        + "L’arrachage, le désherbage manuel, l’effeuillage et la vendange se comptent au temps passé : ils n’ont pas de barème, et l’alerte n’en parle plus. "
        + "L’entreplantation se chiffre avec les pieds marqués : tant qu’aucun pied n’est compté, l’alerte le dit, et son bouton «\u00a0Saisir les comptes\u00a0» ouvre la feuille des comptes. Une parcelle sans pied à remplacer se compte à zéro." },
    { niv: 0, pour: ['admin'], emoji: 'eprouvette', titre: 'Pilotage\u00a0: plus de fausse alerte phyto en hiver',
      desc: "Sur une période sans aucun traitement, comme l’hiver, «\u00a0Doses phyto non structurées\u00a0» s’affichait quand même, alors que le registre était complet. "
        + "L’alerte, devenue «\u00a0Traitements sans dose chiffrée\u00a0», ne vient plus que si la période a des traitements et qu’aucun n’a de dose chiffrée." },
  ] },
  { v: '9.21', d: '2026-10-17', items: [
    { niv: 1, pour: ['cave'], emoji: 'cuve', titre: 'Une cuve n’est plus « finie » avant sa malo',
      desc: "Jusqu’ici, « Décuver » marquait la cuve « Terminé » le jour même, et la frise du Cuvier passait l’étape FML comme si la malo était faite. "
        + "Après le décuvage, la frise reste désormais sur FML, et la phrase dessous dit où en est la malo au Chai : pas encore déclarée, en cours avec sa fin estimée, ou bloquée quand l’acide malique ne descend plus. "
        + "« Fini » s’affiche avec la date de fin de malo, déclarée au Chai (analyse ou fiche de la cuvée). La feuille de décuvage demande si la malo est déjà finie en cuve, « Terminé » ne se pose plus à la main sans passer par l’étape FML, "
        + "et le jour du décuvage s’appelle « Décuvée » dans le parcours, sur la courbe et dans le cahier de cuverie." },
    { niv: 1, pour: ['cave'], cible: '#cuv-fml-sans', emoji: 'verre', titre: '« Pas de malo (voulu) » pour les vins qui l’évitent',
      desc: "Sur la fiche d’une cuvée du Chai, un troisième choix rejoint « Non terminée » et « Terminée » : « Pas de malo (voulu) », quand le domaine évite la malo exprès pour garder l’acidité (blancs, rosés). "
        + "La cuve du Cuvier passe alors à « Fini », et Aujourd’hui ne signale plus cette cuvée comme une malo bloquée." },
    { niv: 0, pour: ['cave'], emoji: 'graphique', titre: 'La légende de la courbe de fermentation s’affiche proprement',
      desc: "Ouverte sans passer par Le Chai, la légende sous la courbe d’une cuve sortait en vrac : textes collés, sans les petits traits de couleur. C’est corrigé." },
  ] },
  { v: '9.20', d: '2026-10-17', items: [
    { niv: 1, pour: ['vigne'], emoji: 'curseurs', titre: 'Un bouton « Filtres » pour une liste plus courte',
      desc: "Quand vous arrivez sur votre priorité, la recherche partage sa ligne avec « Filtres » et la carte. « Filtres » ouvre une feuille : afficher les parcelles à faire, toutes, les finies, en cours ou arrachées ; l’ordre par proximité ou l’ordre normal — ou la tournée du domaine quand l’admin en a choisi une. "
        + "Une pastille sur le bouton dit quand un filtre est actif. La première parcelle à valider remonte d’autant." },
  ] },
  { v: '9.19', d: '2026-10-17', items: [
    { niv: 1, pour: ['tous'], emoji: 'pousse', titre: 'Les pieds marqués chiffrent l’entreplantation',
      desc: "Beaucoup de domaines marquent les pieds à remplacer avant de passer la tarière. Ce compte entre maintenant dans l’appli : en validant une tâche de repérage réglée pour le demander, un pavé de gros chiffres demande combien de pieds sont marqués sur la parcelle. "
        + "L’administrateur peut aussi tout saisir d’un coup (roue crantée de la Vigne, sous l’entreplantation : « Saisir les comptes »). L’entreplantation compte ses heures dès le repérage, la tarière arrive préremplie, et une parcelle comptée se valide d’un seul appui." },
    { niv: 0, pour: ['admin'], emoji: 'outil', titre: 'Une tâche ajoutée à une période existante n’apparaissait nulle part',
      desc: "Cocher une tâche de la convention en modifiant une période déjà créée l’enregistrait dans la période sans l’ajouter aux tâches du domaine : elle n’apparaissait sur aucun écran. "
        + "C’est corrigé, et les tâches déjà touchées réapparaissent seules dès qu’un administrateur ouvre l’appli. Le message « Période mise à jour » s’affiche aussi correctement." },
  ] },
  { v: '9.18', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'etoile', titre: 'Ma saison en images',
      desc: "Dans « Ma trace », six cartes racontent votre saison : votre part en hectares, votre parcelle de cœur, vos gestes, le tracteur et la cave, vos premières fois et vos jalons, les vins nés de votre travail. "
        + "Elles se font défiler du doigt, et « Enregistrer en PDF » en garde une copie." },
  ] },
  { v: '9.17', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'carte', titre: 'La carte de votre saison',
      desc: "Dans « Ma trace », les parcelles du domaine sont dessinées et colorées selon vos passages depuis le début de la saison : aucun, un, deux à trois, quatre et plus. Un appui sur une parcelle donne son nom et le nombre de passages. "
        + "La carte n’a pas de fond : elle s’affiche aussi sans réseau, dans les vignes." },
  ] },
  { v: '9.16', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'raisin', titre: 'Du rang à la bouteille : les vins de votre travail',
      desc: "Dans « Ma trace », « Les vins de votre travail » relie ce que vous avez fait dans les parcelles aux vins qui en sont nés : pour chaque millésime, la cuvée (en cuve, en élevage ou en bouteille), les parcelles d’où elle vient, et ce que vous y avez fait — la taille, le relevage, la vendange… "
        + "Le chemin est celui que la Cave connaît déjà : la récolte de la parcelle, sa cuve, la cuvée du décuvage." },
  ] },
  { v: '9.15', d: '2026-10-16', items: [
    { niv: 0, pour: ['tous'], emoji: 'verre', titre: 'La tournée du Cuvier note aussi votre présence',
      desc: "Les personnes nommées dans « Qui ? » de la tournée du Cuvier voient sur leur Accueil que leur présence est notée, comme pour un relevé ou une opération du Chai. Celui qui fait la tournée ne se le signale pas à lui-même." },
  ] },
  { v: '9.14', d: '2026-10-16', items: [
    { niv: 0, pour: ['tous'], emoji: 'etoile', titre: 'L’annonce des jalons se coupe',
      desc: "Réglages › Moi › Mon compte : « Annoncer mes jalons ». Coupée, la ligne « Nouveau jalon » ne s’affiche plus après une validation ; vos jalons se comptent quand même et restent dans « Ma trace ». "
        + "Le réglage vaut pour ce téléphone." },
  ] },
  { v: '9.13', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'verre', titre: 'Au Cuvier aussi, votre présence est notée',
      desc: "Le relevé d’une cuve a maintenant « Qui était là » sous les remontages et les pigeages. Les personnes cochées le voient sur leur Accueil pendant trois jours, avec le pourquoi du geste, comme pour les opérations du Chai. "
        + "Le premier remontage et le premier pigeage entrent dans « Vos premières fois »." },
  ] },
  { v: '9.12', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'drapeau', titre: 'Vos premières fois',
      desc: "Dans « Ma trace », une frise retrace votre parcours au domaine : l’arrivée, la première validation, le premier hectare, le premier trou de tarière, le premier ouillage, un an au domaine… avec leurs vraies dates. "
        + "Celles qui viennent, comme la première vendange ou la première taille, attendent en pointillé." },
  ] },
  { v: '9.11', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'verre', titre: 'Votre présence au chai est notée',
      desc: "Quand l’administrateur vous coche parmi les intervenants d’une opération du Chai (ouillage, soutirage, sulfitage…), votre Accueil vous le dit pendant trois jours : qui vous a noté, sur quoi, pour quels vins, avec qui, et pourquoi on fait ce geste. "
        + "« Vu » range la carte. Côté administrateur, une phrase sous les intervenants le rappelle." },
  ] },
  { v: '9.10', d: '2026-10-16', items: [
    { niv: 1, pour: ['tous'], emoji: 'tracteur', titre: 'Le coéquipier, choisi avec l’activité',
      desc: "Pour la tarière, l’ensemencement et l’engrais, la nouvelle session propose un coéquipier, choisi en même temps que l’activité. Il apparaît dans la fiche de la session, et ses trous de tarière et ses hectares comptent pour ses jalons. "
        + "L’administrateur peut le proposer pour d’autres activités, ou l’enlever, dans les réglages du tracteur (« Se fait à deux »)." },
  ] },
  { v: '9.09', d: '2026-10-16', items: [] },   // JALONS-2B (§342) : correctif des jalons (lecture refusée ou impossible, écriture des seuls nouveaux) — rien de visible
  { v: '9.08', d: '2026-10-15', items: [
    { niv: 1, pour: ['tous'], emoji: 'etoile', titre: 'Vos jalons s’affichent',
      desc: "Quand une validation vous fait atteindre un jalon, la feuille qui suit le dit : « Nouveau jalon », avec un mot pour l’occasion. "
        + "Dans « Ma trace », « Mes jalons » montre ceux que vous avez gagnés et les trois prochains, avec le chemin qui reste. Vous seul les voyez." },
  ] },
  { v: '9.07', d: '2026-10-15', items: [
    { niv: 0, pour: ['tous'], emoji: 'liste', titre: 'Vos jalons commencent à se compter',
      desc: "Ma Vigne retient désormais, pour chacun et pour lui seul, ses jalons : validations, kilomètres de rangs, sessions de tracteur, trous de tarière, ouillages… L’administrateur n’y a pas accès. "
        + "Ils s’afficheront dans une prochaine version ; ceux que vous atteignez d’ici là sont gardés, avec leur date." },
  ] },
  { v: '9.06', d: '2026-10-15', items: [
    { niv: 1, pour: ['salaries'], emoji: 'carte', titre: 'La prochaine parcelle tient dans le premier écran',
      desc: "Sur votre priorité, le niveau (N1, N2, N3) et l’équipe tiennent maintenant sur une seule ligne, sous la barre dorée : l’équipe se lit à ses pastilles, « Changer » ouvre les noms. "
        + "Au téléphone, la prochaine parcelle et son bouton « Valider » apparaissent sans faire défiler." },
  ] },
  { v: '9.05', d: '2026-10-15', items: [
    { niv: 1, pour: ['salaries'], emoji: 'carte', titre: 'L’arrivée sur votre priorité, resserrée',
      desc: "Quand vous arrivez dans les Parcelles sur la priorité du moment, elle n’est plus annoncée deux fois. Les trois tuiles de chiffres laissent leurs nombres aux filtres « Finies » et « En cours », qui partagent leur ligne avec Liste et Carte. "
        + "La prochaine parcelle à valider, dans l’ordre affiché, porte la marque « Prochaine »." },
  ] },
  { v: '9.04', d: '2026-10-15', items: [
    { niv: 1, pour: ['admin', 'salaries'], emoji: 'carte', titre: 'Chez l’ouvrier, la Vigne va à l’essentiel',
      desc: "Un ouvrier valide depuis les Parcelles : l’onglet Journal, et les raccourcis « + Journal » et « Valider » de l’Accueil, disparaissent de son écran. « Ma semaine » mène à « Ma trace », qui garde l’historique de son travail. "
        + "L’administrateur et le pilotage gardent le Journal." },
  ] },
  { v: '9.03', d: '2026-10-15', items: [
    { niv: 1, pour: ['tous'], emoji: 'feuille', titre: 'Pourquoi on le fait : chaque tâche s’explique',
      desc: "Une pastille « Pourquoi ? » apparaît là où le geste a lieu : à côté de la tâche choisie dans les Parcelles (ou de la priorité du moment) et dans la feuille de validation, dans la fiche d’une session du tracteur, et au choix d’une opération de cave. "
        + "Elle dit quand on fait la tâche, pourquoi, et ce que ça change pour le vin, avec un « Le saviez-tu ? ». Trente-sept fiches, de la taille à la mise en bouteille." },
  ] },
  { v: '9.02', d: '2026-10-15', items: [
    { niv: 1, pour: ['admin', 'cave'], cible: '#ml-tab-cuv', emoji: 'bouteille', titre: 'Le millésime, rangé : une tête et quatre vues',
      desc: "Le millésime empilait tout sur une seule colonne. Il s’ouvre maintenant sur l’année, son état et ses chiffres, puis quatre vues : Ensemble (ce qu’il faut surveiller, le parcours du vin, les repères), Parcelles, Cuvées et Courbes. "
        + "Dans Cuvées, chaque cuvée du millésime a sa fiche, cuves pas encore décuvées et raisin vendu compris. Sur ordinateur, les courbes se comparent côte à côte." },
  ] },
  { v: '9.01', d: '2026-10-14', items: [
    { niv: 0, pour: ['tous'], emoji: 'carre', titre: 'Sur ordinateur, tous les modules à la même largeur',
      desc: "Sur un grand écran, l’Accueil, les Parcelles et le Pilotage restaient au centre, mais le Journal, le Tracteur, Phyto, la Cave, la Réserve, le Planning et Réglages prenaient toute la largeur : l’écran changeait de largeur d’un module à l’autre. "
        + "Ils suivent maintenant la même colonne centrée ; sur «\u00a0Les gens\u00a0» du Planning, la liste et la fiche s’y partagent la place. Les onglets de la Réserve partent du bord, comme ailleurs. Au téléphone et sur un petit écran d’ordinateur, rien ne change." },
  ] },
  { v: '9.00', d: '2026-10-14', items: [
    { niv: 1, pour: ['admin'], cible: '#mvv-reste-q', emoji: 'raisin', titre: 'Une parcelle qui ne sera pas récoltée cette année',
      desc: "Une parcelle condamnée à l’arrachage, grêlée ou trop jeune restait «\u00a0encore sur pied\u00a0» dans Le Cuvier, Le millésime et le Revient : pour l’en sortir, il fallait la déclarer arrachée. "
        + "En bas de la carte «\u00a0Encore sur pied\u00a0», touchez «\u00a0Une parcelle ne sera pas récoltée ?\u00a0» et décochez-la. Elle reste dans le domaine, une ligne la nomme, et «\u00a0Modifier\u00a0» la remet. L’an prochain, tout repart normalement." },
    { niv: 0, pour: ['admin'], emoji: 'bouteille', titre: 'Le Revient ne compte plus de bouteilles sur une vigne non récoltée',
      desc: "Une parcelle sans récolte prenait la moyenne de ses millésimes passés : le Revient annonçait des bouteilles qui n’existeront pas, et restait «\u00a0probable\u00a0». "
        + "Déclarée sans récolte, elle sort du rendement et des bouteilles, ne bloque plus le «\u00a0constaté\u00a0», et son coût de l’année se répartit sur les autres vignes. Une note le dit sous les trois chiffres." },
  ] },
  { v: '8.99', d: '2026-10-14', items: [
    { niv: 1, pour: ['admin'], cible: '#home-eqj-wrap', emoji: 'equipe', titre: 'Une tournée par équipe',
      desc: "Dans «\u00a0Équipes du jour\u00a0», sous les noms, choisissez la tournée de chaque équipe — par défaut, celle du travail. "
        + "Toute la journée, chaque salarié voit ses parcelles numérotées dans l’ordre de son équipe." },
    { niv: 0, pour: ['tous'], emoji: 'route', titre: 'La tournée passe aussi devant le tri par proximité',
      desc: "Quand un travail suit une tournée, l’équipe ne voit plus «\u00a0Trier par proximité\u00a0» : l’ordre est celui que l’administrateur a choisi. Lui garde ce tri." },
  ] },
  { v: '8.98', d: '2026-10-14', items: [
    { niv: 2, pour: ['admin'], emoji: 'route', titre: 'Les tournées se règlent dans la roue crantée de la Vigne',
      desc: "Vigne › roue crantée › <b>Tournées</b> : un nom, l’ordre de toutes vos parcelles, et les travaux qui la suivent — la taille, le tirage, les travaux au tracteur… "
        + "On range en glissant la poignée, par le menu d’une parcelle, en touchant la carte dans l’ordre, ou d’un coup avec «\u00a0Ranger automatiquement\u00a0». "
        + "Vos tournées d’avant y sont déjà, une par travail : renommez-les, et regroupez les travaux qui partagent le même ordre." },
    { niv: 0, pour: ['tous'], emoji: 'nombre', titre: 'L’équipe suit la tournée choisie par l’administrateur',
      desc: "Sur Parcelles, la barre porte le nom de la tournée, et «\u00a0Tri normal\u00a0» n’est plus proposé à l’équipe : c’est l’administrateur qui décide de l’ordre. "
        + "Lui garde «\u00a0Modifier\u00a0», qui ouvre la tournée du travail affiché." },
    { niv: 0, pour: ['admin'], emoji: 'curseurs', titre: 'Décider ne range plus la tournée',
      desc: "Les tris de Pilotage › Décider restent des essais à l’écran ; la tournée se règle maintenant à un seul endroit, et Décider la suit. «\u00a0Modifier la tournée\u00a0» y mène." },
  ] },
  { v: '8.97', d: '2026-10-14', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Des en-têtes lisibles, rangés pareil sur tous les écrans',
      desc: "En haut du Pilotage, la météo et le bouton d’aide se voyaient à peine (texte clair sur fond clair), et sur l’Accueil la saison et la date s’étalaient sur plusieurs lignes. "
        + "Tous les écrans ont maintenant le même en-tête : le nom de l’écran, puis une ligne avec la saison, la date — ou la météo du jour, qui porte alors la date — et l’aide au bout. "
        + "Au téléphone, l’aide est le bouton rond « ? » ; sur ordinateur, « ? Aide » reste écrit." },
  ] },
  { v: '8.96', d: '2026-10-14', items: [
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'En direct donne le vrai jour de début d’un arrachage',
      desc: "Dans Pilotage › Aujourd’hui, « En direct » écrivait « commencée aujourd’hui » sur des parcelles d’arrachage commencées bien avant, et les mettait en tête de « En ce moment ». "
        + "Un arrachage en étapes compte maintenant depuis sa première étape validée, et reprend sa place dans la liste ; la loupe du plan dit le même jour. Quand le jour du début n’est pas connu, aucune date ne s’affiche." },
  ] },
  { v: '8.95', d: '2026-10-14', items: [
    { niv: 1, pour: ['tous'], cible: '#regl-maj-row', emoji: 'rotation', titre: 'L’application se met à jour toute seule, sans attendre',
      desc: "Une nouvelle version pouvait attendre des jours avant de s’installer : il fallait fermer complètement l’application, ou la laisser plusieurs heures en arrière-plan. "
        + "Maintenant, elle s’installe dès que vous quittez l’application ou que vous y revenez, si rien n’est en cours. Sinon, une barre « Nouvelle version prête » s’affiche au-dessus du menu (sur ordinateur, en bas de la barre de gauche) : un appui, quelques secondes. "
        + "Réglages › Moi › Mise à jour vérifie à la main." },
  ] },
  { v: '8.94', d: '2026-10-13', items: [
    { niv: 2, pour: ['tous'], emoji: 'rotation', titre: 'Une saisie enregistrée ne se perd plus, même en relançant l’appli',
      desc: "Quand le téléphone affichait du réseau mais que le serveur ne répondait pas, une saisie restait en attente sans être gardée sur le téléphone : relancer l’application à ce moment-là l’effaçait. Et après une relance, les saisies encore en attente n’apparaissaient plus, puis la saisie suivante les remplaçait. "
        + "Maintenant, chaque saisie est gardée sur le téléphone avant de partir. Relancée, fermée ou coupée par le téléphone, l’application la retrouve, l’affiche et l’envoie dès que le serveur répond. Après 20 secondes sans réponse, l’indicateur en haut de l’écran passe à « En attente »." },
    { niv: 0, pour: ['admin'], emoji: 'cadenas', titre: 'La protection anti-perte garde votre saisie au lieu de la jeter',
      desc: "Quand la protection contre l’écrasement des données refusait un envoi resté en attente, la saisie était retirée sans être gardée. Elle va maintenant dans Réglages › Saisies non enregistrées, avec les précédentes : une deuxième saisie refusée ne remplace plus la première." },
  ] },
  { v: '8.93', d: '2026-10-13', items: [
    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Désactiver une tâche sur plusieurs parcelles d’un coup, pour la période',
      desc: "Pour qu’une tâche comme la réparation ne concerne pas toutes les parcelles, il fallait ouvrir chaque fiche. Dans la roue crantée de la Vigne, « Tâches », la ligne de chaque travail ouvre maintenant la liste des parcelles : tout y est coché, décochez celles qui ne le feront pas, puis « Enregistrer » ; « Tout cocher » et « Tout décocher » vont plus vite. "
        + "Le choix vaut pour la période consultée : à la période suivante, toutes repartent concernées — l’hiver et le printemps peuvent avoir des parcelles différentes. Une parcelle où la tâche est commencée reste concernée." },
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'La croix d’une tâche, sur la fiche d’une parcelle, vaut pour la période',
      desc: "Cette croix désactivait la tâche sur la parcelle pour toujours. Elle ne la désactive plus que pour la période consultée, et « Réactiver » la remet pour cette période. Une tâche désactivée avant cette mise à jour le reste pour toutes les périodes, jusqu’à ce que vous la réactiviez." },
  ] },
  { v: '8.92', d: '2026-10-13', items: [
    { niv: 0, pour: ['tous'], emoji: 'route', titre: 'La tournée ne propose plus les travaux finis',
      desc: "Sur Parcelles, en «\u00a0Toutes tâches\u00a0», l’encart «\u00a0Tournée définie pour\u00a0» proposait encore un travail terminé, ou d’une autre campagne — les vendanges en plein hiver. Il ne garde maintenant que les travaux de la campagne en cours où il reste au moins une parcelle à faire, et disparaît quand il n’y en a plus, comme «\u00a0Reprendre la tournée du domaine\u00a0». "
        + "En passant d’un travail à un travail terminé, la barre de la tournée précédente restait affichée au-dessus du message «\u00a0… terminé\u00a0» : elle suit maintenant le travail choisi, et un travail terminé ne porte plus de numéros de tournée. "
        + "Les tournées enregistrées dans Décider ne sont pas effacées : celle des vendanges reviendra avec sa campagne." },
  ] },
  { v: '8.91', d: '2026-10-13', items: [
    { niv: 0, pour: ['tous'], emoji: 'calendrier', titre: 'Les dates de travaux valent aussi pour les tâches sans barème',
      desc: "L’arrachage, l’entreplantation sans trou compté, le désherbage manuel ou l’effeuillage n’ont pas d’heures au barème : les dates que vous leur donnez dans la saison (Réglages, « Dates de travaux estimées ») n’étaient pas lues. Dans Pilotage › Aujourd’hui, leur ligne affichait les dates du premier chantier et de l’objectif, et ces tâches se rangeaient en tête des chantiers, comme dans Pilotage › La campagne et dans « Avancement par tâche » de l’Accueil. "
        + "Elles prennent maintenant vos dates : l’ordre des chantiers les suit, et une tâche dont les dates sont passées sans qu’elle soit finie est dite en retard, comme les autres. L’arrachage fini pour l’équipe reste vert : la suite revient au prestataire." },
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'L’année suit vos dates de travaux sans recharger l’appli',
      desc: "Après un changement des dates de travaux d’une saison, dans Réglages ou dans la roue crantée du Pilotage, L’année (ses graphiques et le renfort) et les photos du haut du Pilotage gardaient les anciennes dates jusqu’au rechargement de l’appli. Elles suivent maintenant tout de suite." },
  ] },
  { v: '8.90', d: '2026-10-12', items: [
    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Le domaine en direct : les parcelles pas concernées en fantôme',
      desc: "Dans Pilotage › Aujourd’hui, une parcelle où la tâche affichée est désactivée sur sa fiche (« Non applicable sur cette parcelle »), ou pas choisie pour la campagne pour l’arrachage, le désherbage et l’effeuillage, s’affichait « à faire », puis « en retard », et comptait dans les chiffres. "
        + "Elle reste maintenant à sa place sur le plan, en contour pâle : elle ne compte plus dans « à faire », ni dans l’avancement de son appellation, ni dans les parcelles « pas encore faites » d’À savoir. La légende ajoute alors « Pas concernées », et la loupe dit pourquoi." },
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'La priorité du moment ne compte que les parcelles concernées',
      desc: "Sur la carte du haut de l’Accueil, une parcelle où la tâche prioritaire est désactivée comptait « à faire » dans le pourcentage et les hectares. Elle s’affiche maintenant en contour pâle, en dernier, et ne compte plus." },
  ] },
  { v: '8.89', d: '2026-10-12', items: [
    { niv: 1, pour: ['cave'], cible: '#lbo-saisir', emoji: 'microscope', titre: 'Les rapports du labo ont leur onglet',
      desc: "Ils étaient rangés dans le Journal du Chai, derrière un filtre. Ils ont maintenant leur onglet, « Labo », à côté de Cuvées, Bouteilles et Journal : les fiches par date, « Saisir un rapport » en tête, et le filtre millésime du Chai s’y applique. "
        + "Le bouton « Analyse » de Nouvelle opération ouvre toujours une fiche neuve ; une fois enregistrée, vous revenez sur l’onglet, la fiche touchée en surbrillance." },
  ] },
  { v: '8.88', d: '2026-10-12', items: [
    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Le domaine en direct suit la fiche de chaque parcelle',
      desc: "Dans Pilotage › Aujourd’hui, le plan pouvait montrer une parcelle faite alors que sa fiche disait « À faire » : une validation annulée y comptait encore, et, pour une tâche sans dates dans la campagne (l’entreplantation sans trou compté, l’arrachage), une validation d’une saison passée aussi. "
        + "Le plan lit maintenant l’état de la fiche, pour la période : une parcelle y est faite une fois validée, en cours une fois commencée. Un arrachage fini pour l’équipe reste fait, et la loupe dit que la suite revient au prestataire." },
  ] },
  { v: '8.87', d: '2026-10-12', items: [
    { niv: 1, pour: ['cave'], cible: '#lbo-saisir', emoji: 'microscope', titre: 'Les rapports du labo : une fiche par envoi, chaque chiffre à sa place',
      desc: "Saisir un bulletin du labo prenait une analyse par cuvée, et le TAV, le degré probable, le glucose + fructose d’un vin en élevage ou l’acidité totale n’avaient pas de case. "
        + "Dans Le Chai › Journal, « Rapports du labo » ouvre une fiche par envoi : la date du prélèvement, les analyses demandées (reprises de la fiche précédente), puis une ligne par rapport — n° de rapport, n° d’échantillon, la cuvée au Chai ou la cuve au Cuvier, et son PDF. "
        + "Avant d’enregistrer, l’écran montre où va chaque chiffre. Ressaisir la même date ou le même n° de rapport complète la fiche : une case vide n’efface rien, deux valeurs différentes se choisissent. Le bouton « Analyse » de Nouvelle opération ouvre la même fiche." },
    { niv: 0, pour: ['cave'], emoji: 'graphique', titre: 'Un bloc « Au labo » dans la fiche de chaque cuvée et de chaque cuve',
      desc: "La fiche d’une cuvée du Chai trace la courbe de chaque analyse dès deux rapports — TAV, sucres, volatile, acidité totale, pH, SO2 total, malique — en reprenant ceux de la cuve d’où elle vient. Une cuve du Cuvier a le même bloc ; son glucose garde sa courbe des sucres." },
    { niv: 0, pour: ['cave'], emoji: 'eprouvette', titre: 'Le repère « vin sec » d’une cuve prend le degré probable du labo',
      desc: "Le repère de densité d’une cuve se calculait sur le degré potentiel lu sur son premier relevé, ou sur les contrôles de maturité. Quand un rapport du labo donne le degré probable du moût, c’est lui qui compte : la fiche de la cuve l’écrit (« moût à 12,6° au labo »)." },
  ] },
  { v: '8.86', d: '2026-10-12', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-fil', emoji: 'equipe', titre: 'En direct : qui est où, et le tracteur',
      desc: "Dans Pilotage › Aujourd’hui, « En direct » disait « Rien encore aujourd’hui » alors qu’une équipe travaillait sur une parcelle commencée un autre jour, et le travail au tracteur n’y paraissait pas. "
        + "Il montre maintenant, en haut, qui est où en ce moment : chaque parcelle en cours avec son équipe et depuis quand, le tracteur en marche ou en pause. Dessous, la journée : validations, débuts, parcelles finies au tracteur avec le temps mesuré, traitements." },
    { niv: 0, pour: ['vigne'], emoji: 'equipe', titre: '« Début » enregistre l’équipe, comme « Valider »',
      desc: "Une parcelle commencée avec « Début » ne gardait que le nom de celui qui avait appuyé : le Pilotage la montrait avec sa seule pastille, même avec l’équipe programmée sur la tâche. "
        + "« Début » enregistre maintenant l’équipe du bandeau « Équipe sur … », « sans moi » compris. Une parcelle déjà commencée sans équipe la reçoit quand vous changez l’équipe de la tâche." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: '« Sans moi » respecté dans le Pilotage',
      desc: "Une validation faite « sans moi » vous comptait encore dans les noms et la pastille de Pilotage › Aujourd’hui. Vous n’y figurez plus, comme dans le temps passé ; l’équipe passe d’abord." },
  ] },
  { v: '8.85', d: '2026-10-12', items: [
    { niv: 0, pour: ['vigne'], emoji: 'carte', titre: 'L’arrachage fini pour l’équipe quitte « À faire »',
      desc: "Dans Parcelles, filtré sur l’arrachage, une parcelle où l’équipe avait fait toutes ses étapes restait « commencée », en tête de la liste « À faire », alors que la suite revient au prestataire. "
        + "Elle quitte maintenant « À faire » : « Toutes » la montre, marquée « Au prestataire », et sa fiche permet toujours de valider l’étape du prestataire. La carte de l’Accueil, l’anneau des cartes et la tournée ne la comptent plus comme commencée." },
  ] },
  { v: '8.84', d: '2026-10-12', items: [
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'Les chantiers se rangent par date de début',
      desc: "Dans Pilotage › Aujourd’hui (« Chantiers de la saison »), dans Pilotage › La campagne et dans la carte « Avancement par tâche » de l’Accueil, les tâches suivaient l’ordre de la liste des Réglages, pas leurs dates. "
        + "Elles se rangent maintenant par date de début : ce qui reste à faire ou est en cours en haut, les tâches terminées en bas." },
    { niv: 0, pour: ['tous'], emoji: 'engrenage', titre: 'L’arrachage fini pour l’équipe passe en tête des terminées',
      desc: "Quand l’équipe a fini ses étapes d’arrachage sur toutes les parcelles et que la suite revient au prestataire, la tâche se range en tête des tâches terminées, en vert, avec son vrai pourcentage et la mention « la suite au prestataire »." },
  ] },
  { v: '8.83', d: '2026-10-11', items: [
    { niv: 1, pour: ['vigne'], cible: '#home-prio-mos', emoji: 'carte', titre: 'L’Accueil dessine chaque parcelle à sa forme',
      desc: "Dans la carte du haut de l’Accueil, les parcelles étaient de petits rectangles : on ne reconnaissait pas ses vignes d’un coup d’œil. "
        + "Chacune a maintenant la forme de son contour, nord en haut, avec la même surface que son ancien rectangle. Les couleurs ne changent pas : vert, c’est fait ; gris foncé, c’est commencé. "
        + "Une parcelle dont le contour n’est pas enregistré garde son rectangle, en pointillé." },
    { niv: 0, pour: ['vigne'], emoji: 'doigt', titre: 'Toucher une parcelle de l’Accueil ouvre sa fiche',
      desc: "Dans cette même carte, toucher une parcelle n’ouvrait rien, et un salarié lisait « Admin requis ». Sa fiche s’ouvre maintenant." },
  ] },
  { v: '8.82', d: '2026-10-11', items: [
    { niv: 0, pour: ['tous'], emoji: 'info', titre: 'Le « i » ouvre une bulle à côté du chiffre',
      desc: "Dans le Pilotage, toucher un « i » d’Aujourd’hui faisait tomber son explication tout en bas de la page, sans mise en forme. Ailleurs, le « i » ouvrait une feuille par-dessus l’écran. "
        + "Maintenant, chaque « i » de l’application ouvre une bulle juste à côté de lui : l’essentiel d’abord, et « Lire la suite » quand l’explication est longue. Touchez ailleurs, ou Échap sur ordinateur, pour la refermer." },
  ] },
  { v: '8.81', d: '2026-10-11', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Sur ordinateur, la barre de gauche suit l’ordre du téléphone',
      desc: "Le Pilotage passe en tête de la barre, pour qui y a accès, puis les modules rangés par thème : Terrain (Vigne, Tracteur, Phyto), Cave et réserve, Organisation (Planning). Réglages descend en bas, au-dessus de votre nom. "
        + "Le logo en tête de barre, pâle à cette taille, est redessiné avec un trait plus épais et des couleurs plus franches, en clair comme en sombre. Sur téléphone et tablette, rien ne change." },
  ] },
  { v: '8.80', d: '2026-10-11', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-savoir', emoji: 'pluie', titre: 'La météo d’« À savoir » donne des faits, plus de verdict',
      desc: "La barre « brûlage possible » disparaît : ce n’est pas à l’application de décider si un travail peut se faire. Sous chaque jour, la météo donne maintenant le risque de pluie, le cumul en millimètres et le vent le plus fort de la journée. "
        + "Les lignes de pluie et de vent disent ce qui est en cours dans les communes touchées — la tâche et ses parcelles pas encore faites —, sans conclure à votre place. Sur un domaine à plusieurs communes, elles disaient toujours « Aucun chantier en cours ne craint ce temps », même avec du brûlage à finir : ce compte par commune est réparé." },
  ] },
  { v: '8.79', d: '2026-10-11', items: [
    { niv: 2, pour: ['tous'], emoji: 'cloche', titre: 'Une seule notification par jour, à votre prise de poste',
      desc: "Les notifications arrivaient n’importe quand : la priorité et les délais avant récolte toutes les heures tant que l’application restait ouverte, une notification à chaque mise à jour — et rien du tout l’application fermée. "
        + "Maintenant, un seul message par jour travaillé, envoyé sur votre téléphone à l’heure de prise de poste inscrite au planning, même application fermée : la priorité qui vous concerne et, pour l’administrateur et le tractoriste, un tracteur qui revient du réparateur ou un délai avant récolte qui se termine. Rien les jours de repos, de congé ou d’arrêt. "
        + "<b>À faire une fois sur chaque téléphone</b> : Réglages › Moi › Notifications. Sur iPhone, depuis Ma Vigne installée sur l’écran d’accueil." },
  ] },
  { v: '8.78', d: '2026-10-11', items: [
    { niv: 0, pour: ['tous'], emoji: 'cloche', titre: 'Plus de message d’erreur en anglais après une mise à jour',
      desc: "Sur un appareil où les notifications ne sont pas activées, un message orange s’affichait parfois à l’ouverture de l’application, juste après une mise à jour : « Promesse rejetée : Failed to execute 'showNotification'… ». "
        + "Rien n’était perdu : l’application essayait de vous annoncer la mise à jour par une notification que l’appareil refusait. Elle n’essaie plus sans votre accord, et le message ne s’affiche plus." },
  ] },
  { v: '8.77', d: '2026-10-11', items: [
    { niv: 2, pour: ['admin'], emoji: 'euro', titre: 'La vue Économie d’Aujourd’hui dit enfin où va la campagne',
      desc: "Elle annonçait « Dans le budget » et des « 0 € » à chaque ligne : sa fin de campagne valait le budget tant qu’on était dessous, et la main-d’œuvre « dépensée » était le barème du travail fait, pas les heures payées. "
        + "Maintenant, la fin de campagne est celle de l’onglet Économie — ce qui est dépensé, plus le travail qui reste, à la cadence mesurée de l’équipe —, la main-d’œuvre compte les heures payées du planning, et « Par poste » n’écrit un écart que là où il est calculé. "
        + "<b>À vérifier</b> : la tuile Budget et la fin de campagne bougent ; elles disent désormais ce qui se passe vraiment." },
    { niv: 0, pour: ['admin'], emoji: 'raisin', titre: 'L’arrachage compte comme un travail payé à l’heure',
      desc: "Un jour où une étape d’arrachage et une réparation étaient validées ensemble, l’arrachage ne prenait aucune heure : la réparation ramassait toute la journée. La journée se partage maintenant à la surface entre les deux. "
        + "L’arrachage — comme le désherbage manuel, l’effeuillage et la vendange, sans barème — a sa ligne « Travaux à l’heure » dans l’Économie : son budget est ce qu’il a coûté, et ses heures ne font plus paraître l’équipe lente dans l’écart au barème." },
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'La vue Économie : un graphe sans colonnes, une seule taille de texte',
      desc: "Plus d’aire verte entre les courbes du graphe « dépensé face au fait » : la main-d’œuvre payée et le travail fait partent du début de la période et ne font que monter. "
        + "Les chiffres des tuiles ne sont plus plus gros que la phrase principale, et les lignes des cartes ont toutes la même taille. La cadence de l’équipe affiche ses heures par jour : elle montrait 7 h, la journée de référence." },
  ] },
  { v: '8.76', d: '2026-10-11', items: [
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'La charge restante ne fait plus de traits qui montent et descendent',
      desc: "La courbe relie la photo de chaque jour, sans ronds, jusqu’au point d’aujourd’hui. Des photos avaient été prises à l’ouverture de l’appli, avant l’arrivée des données : elles comptaient 0 h et tiraient des traits verticaux. "
        + "La photo du jour attend maintenant les données, et la courbe écarte les photos à 0 h impossibles et celles d’avant le 10 octobre, qui ne disaient pas à quelle période elles appartenaient : elle repart de cette date." },
    { niv: 0, pour: ['admin'], emoji: 'carte', titre: 'Le domaine en direct et la charge restante ne disparaissent plus',
      desc: "Après un passage par la vue Économie, le plan pouvait rester vide (les noms d’appellation seuls) et la courbe blanche, jusqu’au rechargement de l’appli. C’est réparé. Quand les données se mettent à jour pendant que vous êtes sur Économie, le cockpit y reste." },
    { niv: 0, pour: ['admin'], emoji: 'oeil', titre: '« À savoir » reste entier quand vous descendez',
      desc: "Sur ordinateur, « À savoir » se cale sous la barre des onglets au lieu de passer dessous, et la pastille « Nouveau » n’est plus coupée. Le nom et les dates d’une absence passent sur deux lignes quand la colonne est étroite, au lieu d’être coupés." },
  ] },
  { v: '8.75', d: '2026-10-10', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-savoir', emoji: 'graphique', titre: 'Aujourd’hui retrouve la disposition de la maquette',
      desc: "Sur ordinateur, Aujourd’hui s’affiche sur trois colonnes : la fin prévue et la décision du jour à gauche, le domaine en direct au centre, « À savoir » à droite — et « À savoir » reste visible quand vous descendez dans la page. "
        + "Les tailles de texte sont harmonisées : la phrase de fin prévue n’écrase plus le reste. La météo retrouve ses couleurs, et la pastille de l’équipe clignote sur la carte les jours travaillés." },
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Le Pilotage suit le planning',
      desc: "Un jour sans travail au planning (week-end, jour chômé), l’Effectif et les Présences montrent le prochain jour travaillé au lieu d’annoncer toute l’équipe. "
        + "Dans « À savoir », un absent revient le premier jour où le planning le prévoit — plus jamais un samedi —, un congé de deux semaines tient sur une seule ligne, et un arrêt maladie dit sa date de fin. "
        + "Le brûlage possible et les heures à faire par jour se comptent aussi sur les jours du planning." },
    { niv: 0, pour: ['admin'], emoji: 'oeil', titre: 'À l’ouverture, le Pilotage s’ouvre sur Aujourd’hui',
      desc: "Il rouvrait sur le dernier onglet consulté. Les ouvriers et tractoristes arrivent toujours sur l’Accueil, ou sur Parcelles avec la tâche prioritaire quand ils en ont une." },
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'La charge restante et la tuile Budget se lisent mieux',
      desc: "La courbe de la charge restante montre un point par mesure, sans la bande qui formait une colonne près d’« aujourd’hui ». "
        + "La tuile Budget dit maintenant « du budget main-d’œuvre dépensé, pour N % du travail fait ». La carte des parcelles se redessine d’elle-même quand sa place change." },
  ] },
  { v: '8.74', d: '2026-10-10', items: [
    { niv: 2, pour: ['admin'], emoji: 'raisin', titre: 'Une parcelle arrachée avant l’appli se déclare à sa vraie date',
      desc: "Déclarer arrachée une parcelle avec une date d’avant la période en cours ne valide plus rien : la case « Valider aussi le travail d’arrachage » disparaît, et la parcelle ne porte plus aucun travail dans cette période — ni « à faire », ni dans l’avancement. "
        + "Les passages d’un autre travail saisis par erreur après la date d’arrachage restent au journal, mais ne comptent plus : ils ne prennent plus d’heures dans le temps réel du Pilotage, qui rend la journée aux parcelles réellement travaillées. Les heures du Pilotage peuvent donc bouger un peu sur les périodes concernées." },
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'La fiche de droite des Parcelles ne dit plus « À faire » pour une tâche désactivée',
      desc: "Sur ordinateur, « Travaux de la campagne » mettait toutes les tâches de la période en « À faire », même celles désactivées sur la parcelle ou pas choisies pour la campagne : elles y sont maintenant grisées, comme dans la fiche complète. "
        + "Une parcelle arrachée l’écrit en haut, avec sa date. « Dernier passage » ne montre plus une validation annulée ensuite, ni celle d’une autre période, et les derniers passages disent « Annulé ensuite » ou « Après l’arrachage »." },
    { niv: 0, pour: ['admin'], emoji: 'check', titre: 'Un arrachage annulé ne garde plus la parcelle à arracher',
      desc: "Une parcelle dont l’arrachage avait été validé puis annulé restait comptée dans l’arrachage de la campagne, et ne se décochait plus de la liste des parcelles choisies. Une validation annulée ensuite ne compte plus." }
  ] },
  { v: '8.73', d: '2026-10-09', items: [
    { niv: 1, pour: ['cave'], cible: '#vm-gf', emoji: 'eprouvette', titre: 'Les sucres au labo prennent le relais de la densité',
      desc: "En fin de fermentation, la densité ne bouge presque plus : c’est l’analyse du labo — glucose + fructose, en g/L — qui dit si une cuve est sèche. "
        + "La feuille de relevé du Cuvier a désormais un champ « Sucres au labo », à la date du prélèvement ; la densité y devient facultative. "
        + "La fiche de la cuve trace la courbe des sucres sous celle de la densité et dit où elle en est : en route vers le sec (avec une date estimée dès trois analyses), ça stagne, ça remonte, ou sèche au labo — 0,2 g/L ou moins. "
        + "La ligne de la cuve porte le dernier chiffre du labo, « Ce qui vient » annonce la fin estimée, et une cuve suivie au labo réclame une analyse tous les 4 jours au lieu d’une densité par jour." },
    { niv: 0, pour: ['cave'], emoji: 'cuve', titre: 'Déclarer la fin de fermentation d’une cuve qui finit au chai',
      desc: "Une cuve décuvée avec « elle finira au chai » le restait pour toujours : rien ne permettait de dire ensuite que c’était fini. Elle restait dans la tournée, et sa cuvée gardait « attendez avant la malo ou le sulfitage ». "
        + "Le bouton « Déclarer la FA finie » de sa fiche le permet maintenant ; la date proposée est celle de l’analyse qui la dit sèche, et c’est vous qui validez. La date et le chiffre du labo restent écrits sur la cuvée." },
    { niv: 0, pour: ['cave'], emoji: 'graphique', titre: 'Le repère « vin sec » passe au seuil des labos : 0,2 g/L',
      desc: "Le repère de densité tracé sur les courbes était calculé sur 2 g/L de sucres, un ancien seuil. Il l’est maintenant sur 0,2 g/L, le seuil des labos : il descend d’environ 0,8 point (un moût à 13° : de 993,8 à 993,0). "
        + "Le jour du vin sec du comparatif peut donc arriver un relevé plus tard. Le repère reste une estimation : c’est l’analyse du labo qui tranche." },
    { niv: 0, pour: ['cave'], emoji: 'cuve', titre: 'Trois corrections au Cuvier et au Chai',
      desc: "Un relevé pris sur une cuve pressurée enregistrait 2 remontages et 1 pigeage par défaut : après le pressurage, la feuille ne les propose plus. "
        + "Corriger un relevé de la tournée effaçait qui l’avait pris : ce n’est plus le cas. "
        + "Au Chai, la ligne « Fermentation à finir » ou « Mise en fût » d’une cuvée se coupait en colonnes : elle se lit maintenant d’un trait." }
  ] },
  { v: '8.72', d: '2026-10-09', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-plan', emoji: 'carte', titre: 'Le domaine en direct : chaque parcelle à sa forme',
      desc: "Au Pilotage › Aujourd’hui, chaque parcelle a maintenant la forme de son contour, nord en haut, à la même échelle pour tout le domaine. Le plan est deux fois plus compact : une ligne par appellation, avec son avancement. "
        + "Sur ordinateur, passez la souris sur une parcelle : une loupe la montre en grand, avec sa surface, son état et l’équipe. Au téléphone, le plan se replie sous ses premières appellations ; « Tout le plan » ouvre le reste." },
    { niv: 1, pour: ['tous'], cible: '#dp-forme', emoji: 'raisin', titre: 'La forme de la parcelle dans sa fiche',
      desc: "En haut de la fiche d’une parcelle, sa forme, tirée de son contour, avec une échelle en mètres. Sur ordinateur, elle s’affiche aussi dans la fiche de droite des Parcelles. Une parcelle sans contour n’en affiche pas." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Chaque parcelle en cours porte son équipe',
      desc: "Une parcelle commencée un autre jour restait « en cours » sur le plan, sans pastille, et le plan écrivait « aucune équipe ». Elle porte désormais les initiales de ceux qui l’ont commencée ; la loupe dit depuis quand." },
    { niv: 0, pour: ['tous'], emoji: 'doigt', titre: 'Choisir une parcelle ouvre bien sa fiche',
      desc: "Depuis le plan du Pilotage et depuis la recherche (Ctrl K), choisir une parcelle n’ouvrait rien. Sa fiche s’ouvre maintenant." },
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'La commune s’écrit en toutes lettres',
      desc: "Dans le plan du Pilotage et dans la fiche de droite des Parcelles, la commune d’une parcelle rattachée à un secteur météo s’affichait « [object Object] ». Elle s’écrit maintenant en toutes lettres." },
  ] },
  { v: '8.71', d: '2026-10-09', items: [
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Planning : « Les gens » ne fige plus l’appli',
      desc: "Sur ordinateur, en ouvrant « Les gens », tout se figeait sauf la fiche de droite : plus de clic sur la liste, les onglets ou la barre de gauche, plus de défilement — et le gel suivait sur le module ouvert ensuite. La fiche rangée à droite était encore traitée comme une fenêtre posée par-dessus la page. Elle ne l’est plus : la liste, la fiche et le reste de l’appli répondent normalement." },
    { niv: 0, pour: ['tous'], emoji: 'curseurs', titre: 'Les fenêtres et les cases du Planning tiennent de nouveau dans leur cadre',
      desc: "Depuis le 7 octobre, beaucoup de fenêtres ouvertes par un bouton étaient un peu plus larges que leur cadre — d’où des barres de défilement sur ordinateur —, et les cases colorées du Planning débordaient sur la ligne du dessus. Une règle de mise en page prévue pour le seul tableau de bord du Pilotage s’appliquait à toute l’appli : elle est remise à sa place." },
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Planning : la barre du bas ne cache plus la journée',
      desc: "Quand les animations de l’ordinateur sont coupées, la barre noire du bas (Heures, Congé, Absence…) restait par-dessus la fenêtre de la journée ouverte depuis elle. Elle passe désormais dessous, comme sous toute fenêtre." },
  ] },
  { v: '8.70', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage : tous les onglets à la nouvelle charte',
      desc: "L’année, La campagne, L’équipe & le matériel, Décider, Économie, Conformité et Archives prennent le dessin du cockpit « Aujourd’hui » : titres sans capitales ni pastilles dorées, chiffres dans la police de l’appli, boutons segmentés clairs, la jauge d’avancement en vert, l’exercice comptable et « choses à compléter » en couleurs d’état. Rien ne change dans les calculs." }
  ] },
  { v: '8.69', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'soleil', titre: 'Des couleurs plus franches, des cartes qui se détachent mieux',
      desc: "Le vert, l’ambre, le rouge et la lie-de-vin, et surtout leurs fonds pâles (étiquettes, alertes, cases du Planning), sont un cran plus soutenus : on les voit mieux, sans que ce soit criard. Le fond crème des pages est un peu plus marqué, les cartes blanches s’en détachent davantage. Les textes gardent le même contraste de lecture." }
  ] },
  { v: '8.68', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'curseurs', titre: 'La nouvelle charte est en place sur toute l’appli',
      desc: "Dernière étape : dans les Réglages, l’équipe tient dans une carte (rôles plus lisibles, l’admin en couleur, « Ajouter un membre » en couleur) et, sur ordinateur, les sections de « Moi » vont par deux ; la zone dangereuse reste bordée de rouge. Avec ce lot, tous les écrans de Ma Vigne ont pris la nouvelle charte — sans qu’aucun réglage, aucun calcul ni aucun droit n’ait changé en route." }
  ] },
  { v: '8.67', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'curseurs', titre: 'Réglages › Domaine passe à la charte',
      desc: "La carte d’identité du domaine passe sur fond clair. Chaque section devient une carte au cadre clair, avec ses titres en casse normale ; sur ordinateur, « Mon domaine » et « Données » sont côte à côte, la campagne sur toute la largeur. Aucun réglage ne change : seul le dessin bouge." }
  ] },
  { v: '8.66', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'liste', titre: 'Réserve › Bilan matière passe à la charte : la Réserve est finie',
      desc: "Le bilan matière quitte son en-tête noir pour une carte claire ; le tableau prend les filets et les titres de colonne de l’appli, les chiffres alignés, et un stock négatif reste en rouge. La note du contrôle bio passe sur fond doux. Rien ne change dans le tableau lui-même. Avec ce lot, toute la Réserve a pris la nouvelle charte." }
  ] },
  { v: '8.65', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'carton', titre: 'Réserve › Intrants passe à la charte',
      desc: "Les cartes d’intrant prennent le cadre clair de l’appli. Le stock s’écrit dans la police de l’appli, en rouge s’il est négatif, et l’alerte de stock négatif passe en rouge pâle. Sur ordinateur, les cartes vont par deux. « Achat » est en couleur. Rien ne change dans les calculs ni dans le bilan." }
  ] },
  { v: '8.64', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'carton', titre: 'Réserve › Fûts passe à la charte',
      desc: "La Réserve prend toute la largeur de l’écran sur ordinateur. La carte du parc passe sur fond clair, les chiffres tiennent en une bande, « Ajouter des fûts » est en couleur, le millésime choisi aussi. Les fournisseurs et leurs lots prennent le cadre clair de l’appli ; sur ordinateur, les lots d’un fournisseur vont par deux. Un lot s’ouvre toujours dans son formulaire." }
  ] },
  { v: '8.63', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'verre', titre: 'Cave › Le Millésime passe à la charte : la Cave est finie',
      desc: "Le choix du millésime et de la vue passe en boutons de l’appli, le millésime choisi en couleur. Les tuiles face à l’an passé prennent un fond clair et leurs chiffres la police de l’appli ; un rendement au-delà du plafond reste en rouge. Rien ne change dans ce que le Millésime calcule. Avec ce lot, toute la Cave a pris la nouvelle charte." }
  ] },
  { v: '8.62', d: '2026-10-08', items: [
    { niv: 0, pour: ['admin'], emoji: 'barrique', titre: 'Cave › Le Chai : la liste et la fiche côte à côte',
      desc: "Sur ordinateur, toucher une cuvée ouvre sa fiche à droite de la liste, sans fenêtre : ouillage, dernière analyse, dernier soutirage, opérations et boutons. Après un ouillage ou une opération, la fiche se met à jour sur place. Les cartes prennent le cadre clair de l’appli, l’alerte d’ouillage passe en ambre, « Ouiller » et « Nouvelle cuvée » en couleur. Au téléphone, la fiche s’ouvre comme avant." }
  ] },
  { v: '8.61', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'cuve', titre: 'Cave › Le Cuvier passe à la charte',
      desc: "Les cuves prennent le dessin de l’appli : lignes au cadre clair, la cuve ouverte cerclée en couleur, les filtres et le tri en boutons, l’alerte « cuves à mesurer » en ambre, « Nouvelle cuve » en couleur. Sur ordinateur, les cuves vont par deux et celle qu’on ouvre prend toute la largeur. La cuve s’ouvre toujours sur place, avec ses relevés et sa cinétique." }
  ] },
  { v: '8.60', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'verre', titre: 'Cave › Aujourd’hui passe à la charte',
      desc: "Les quatre chiffres de la Cave tiennent en une bande. « Ce qui presse » devient une carte : sa phrase en grand, en couleur selon l’urgence, avec un filet sur le côté. Les semaines à venir sont des cartes, la semaine en cours cerclée en couleur ; sur ordinateur, « Ce qui presse » est à gauche et les semaines à droite. Rien ne change dans ce que la Cave calcule." }
  ] },
  { v: '8.59', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'pousse', titre: 'Phyto › Fertilisation passe à la charte',
      desc: "Les cartes de la fertilisation (apports, azote de la campagne, ce qu’un contrôle va demander) prennent le dessin de l’appli ; sur ordinateur, elles vont par deux, et la liste du contrôle tient toute la largeur. « Saisir un amendement » est un bouton au-dessus des cartes, et « Imprimer le cahier » passe en couleur. Rien ne change dans ce que l’onglet calcule ni dans le cahier." }
  ] },
  { v: '8.58', d: '2026-10-08', items: [
    { niv: 1, pour: ['tous'], emoji: 'eprouvette', titre: 'Phyto › Catalogue : la fiche E-Phy à côté de la liste',
      desc: "Sur ordinateur, toucher un produit du catalogue ouvre sa fiche E-Phy à droite, sans fenêtre : statut, délai de rentrée, substance active, mentions, usages homologués sur la vigne, et le rappel que ces données sont indicatives. La recherche et les filtres prennent le dessin de l’appli. Au téléphone, la fiche s’ouvre comme avant." }
  ] },
  { v: '8.57', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'eprouvette', titre: 'Phyto : le registre en liste et fiche',
      desc: "Sur ordinateur, toucher un traitement le choisit : sa fiche s’ouvre à droite avec les mentions du registre (produit, AMM, type, date, dose, parcelles, opérateur, réentrée et avant-récolte avec leur date de fin, ZNT). Une réentrée en cours s’affiche en rouge. « Saisir un traitement » devient un bouton au-dessus de la liste. Au téléphone, rien ne change." }
  ] },
  { v: '8.56', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'tracteur', titre: 'Tracteur : les heures et le GNR de chaque session',
      desc: "La fiche d’une session dit ses heures de moteur — au chrono quand il a mesuré la parcelle, sinon au barème de l’activité — et le GNR consommé : ces heures fois la consommation réglée, 6 L par heure tant qu’elle ne l’est pas. La bande du haut compte les heures de la saison. Sur ordinateur, « Démarrer une session » est un bouton au-dessus de la liste ; la nouvelle session et la feuille de travail prennent le dessin de l’appli." }
  ] },
  { v: '8.55', d: '2026-10-08', items: [
    { niv: 1, pour: ['tous'], emoji: 'outil', titre: 'Tracteur › Entretien sur deux colonnes',
      desc: "Sur ordinateur, les machines (en liste) et la cuve de GNR passent à gauche, la prochaine révision, les derniers contrôles et la nouvelle fiche à droite. Les cartes prennent le cadre clair de l’appli, « Appoint de cuve » et « Nouvelle fiche d’entretien » sont en couleur, une anomalie non traitée borde sa carte de rouge. Au téléphone, l’ordre ne change pas." }
  ] },
  { v: '8.54', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'tracteur', titre: 'Tracteur : les sessions en liste et fiche',
      desc: "Sur ordinateur, toucher une session la choisit : sa fiche s’ouvre à droite, avec l’avancement, la surface faite, les parcelles et la note, et un bouton pour ouvrir la feuille de travail (chrono, parcelles). Les filtres deviennent des boutons segmentés, la session en cours est cerclée en couleur, les chiffres tiennent en une bande. Au téléphone, un appui ouvre toujours la feuille." }
  ] },
  { v: '8.53', d: '2026-10-08', items: [
    { niv: 1, pour: ['admin'], emoji: 'calendrier', titre: 'Les fenêtres du Planning passent à la charte',
      desc: "« Congés sur une période », « Chaleur sur une période », la journée d’un salarié et sa fiche s’ouvrent avec un en-tête clair (plus de bande brune ni violette), des champs et des boutons comme dans le reste de l’appli, le bouton principal en couleur. Le récapitulatif annuel de l’équipe montre le mois en cours en couleur. Rien ne change dans ce que font ces fenêtres." }
  ] },
  { v: '8.52', d: '2026-10-08', items: [
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Planning › Les gens : la liste et la fiche côte à côte',
      desc: "Sur ordinateur, « Les gens » montre la liste des salariés à gauche et la fiche de la personne choisie à droite, sans fenêtre par-dessus : Résumé, Jours, Compteur, Congés et acomptes, le mois, le relevé. Toucher une autre ligne change la fiche. Les lignes prennent le dessin des listes de l’appli, et l’en-tête de la fiche passe sur fond clair. Au téléphone, la fiche s’ouvre comme avant." }
  ] },
  { v: '8.51', d: '2026-10-08', items: [
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Le Planning prend la nouvelle charte',
      desc: "Dans « Le mois », les outils tiennent sur une ligne (année, semaine ou mois, congés et chaleur sur une période), les trois chiffres en bande fine, et la grille sur une carte. Les cases sont à plat et teintées : vert pour des heures en plus, ambre en moins, lie-de-vin pour un congé, rouge pour une absence, gris pour une récup, contour ambre pour la chaleur. Aujourd’hui est marqué en couleur, la case cochée est cerclée, et la barre du bas passe en sombre. Les gestes ne changent pas." }
  ] },
  { v: '8.50', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'nuage', titre: 'La météo et les derniers travaux de l’Accueil, redessinés',
      desc: "La météo 5 jours montre le jour en tête (température, ciel, minimum), puis cinq colonnes avec une barre de pluie sous chaque jour : c’est le risque de pluie, en pour cent. Une note signale le premier jour où il dépasse 50 %. Les derniers travaux deviennent un fil rangé par jour : l’heure, les initiales, qui a validé ou commencé quoi, et où." }
  ] },
  { v: '8.49', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'La priorité du moment devient une carte',
      desc: "En haut de l’Accueil, la priorité tient dans une carte : la tâche du moment avec son pourcentage et sa barre, puis toutes les parcelles dessinées à leur surface, en vert quand c’est fait, en gris foncé quand c’est commencé. Un appui sur une parcelle l’ouvre. Les trois chiffres du domaine passent dans la carte, et les équipes du jour en pied. La carte « Avancement de la saison » quitte son fond vert." }
  ] },
  { v: '8.48', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'L’Accueil prend la grille de la nouvelle charte',
      desc: "Sur ordinateur, les deux blocs d’une rangée ne sont plus de même largeur : l’un en prend un peu plus, et ça s’inverse d’une rangée à la suivante. Les titres des blocs quittent les capitales, la carte des travaux mécaniques passe au cadre clair, et les outils de « Personnaliser » prennent l’habit du reste de l’appli. Vos blocs, leur ordre et vos réglages ne changent pas." },
    { niv: 1, pour: ['admin'], emoji: 'graphique', titre: 'Pilotage : la projection des deux pistes en pointillé fin',
      desc: "Sur « Fin prévue des travaux » et « Atterrissage de la campagne », la partie prévue de la piste est un fin pointillé au milieu de la barre, au lieu d’une rangée de blocs : on distingue tout de suite ce qui est fait de ce qui est prévu." }
  ] },
  { v: '8.47', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'check', titre: 'Au téléphone, deux grands boutons en bas de chaque carte',
      desc: "Quand une tâche est choisie, chaque carte de parcelle dit l’état de cette tâche (pas commencé, en cours, fait) et porte en bas « Début » et « Valider », en grand, pour le pouce. Une parcelle commencée ne garde que « Valider ». Les filtres deviennent des boutons segmentés qui défilent, et la priorité tient en un bandeau fin." }
  ] },
  { v: '8.46', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'Sur ordinateur, les Parcelles en liste et fiche',
      desc: "Sur un écran large, la liste passe à gauche, une ligne par parcelle avec « Début » et « Valider », et la fiche de la parcelle choisie s’ouvre à droite : l’état de la tâche, les travaux de la campagne, les derniers passages, le délai de réentrée s’il y en a un. Les flèches haut et bas passent d’une parcelle à l’autre, la touche V valide. Les filtres deviennent des boutons segmentés. Sur téléphone, rien ne change." }
  ] },
  { v: '8.45', d: '2026-10-08', items: [
    { niv: 1, pour: ['tous'], emoji: 'oeil', titre: 'Une échelle de texte plus régulière',
      desc: "Les tailles de texte suivent maintenant une seule échelle, calée de 4 en 4 : le texte courant des listes gagne un demi-point, les étiquettes rejoignent les légendes, les grands chiffres et les titres de section prennent un point. Rien ne bouge de place." }
  ] },
  { v: '8.44', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Des en-têtes clairs et des onglets soulignés',
      desc: "Le haut de chaque module passe sur fond clair : l’icône du module sans cadre, le titre dans la police de l’appli, les boutons discrets. Les onglets ne sont plus des pastilles : l’onglet ouvert est simplement souligné. Le bandeau du Pilotage prend le même habit. Sur ordinateur, le contenu se pose sur le fond comme un panneau, à côté de la barre." }
  ] },
  { v: '8.43', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'loupe', titre: 'Sur ordinateur, la barre et la recherche prennent la nouvelle charte',
      desc: "La barre de gauche passe sur le fond clair de l’appli : la marque en tête, votre domaine dessous, l’écran ouvert marqué d’un seul trait de couleur. Le bouton à côté de votre nom, ou la touche « [ », la replie et la déplie. La recherche (Ctrl K ou « / ») range ses réponses en « Aller à », « Parcelles » et « Actions » : une nouvelle entrée de journal, le thème clair ou sombre, replier la barre." },
    { niv: 1, pour: ['tous'], emoji: 'oeil', titre: 'Sur téléphone, la barre du bas est à plat',
      desc: "Fond blanc, un simple filet en haut, l’écran ouvert en couleur. Le menu « Plus » montre les autres modules en tuiles." }
  ] },
  { v: '8.42', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Une charte plus sobre, dans toute l’appli',
      desc: "Les fonds crème deviennent un blanc et un gris neutres, les arrondis sont plus fins, les ombres plus légères. La couleur ne sert plus qu’à deux choses : agir (une lie-de-vin, celle des grappes du logo) et dire l’état (vert fait, orange à surveiller, rouge en retard). Les textes discrets restent lisibles sur tous les fonds, en clair comme en sombre." },
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Aujourd’hui prend la même charte',
      desc: "Le cockpit du Pilotage garde tout son contenu et ses gestes. Ses titres passent dans la police de l’appli, ses barres en cours sont gris foncé au lieu de doré, et le fond n’est plus dégradé." }
  ] },
  { v: '8.41', d: '2026-10-08', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Sur ordinateur, la barre latérale ne recouvre plus les écrans',
      desc: "Barre ouverte, le bord gauche de chaque module passait sous la barre — des titres et des chiffres coupés — et le bas de la barre sortait de l’écran. La barre a maintenant exactement la place qui lui est réservée. La replier ou la déplier recale les graphiques et la carte, et sous 1 200 pixels de large elle reste repliée d’office." },
    { niv: 0, pour: ['admin'], emoji: 'crayon', titre: 'Aujourd’hui : des boutons qui font ce qu’ils disent',
      desc: "« Changer la priorité » ouvre le choix de la priorité (il menait à un autre onglet). « Agrandir » ouvre la courbe de la charge restante en grand. Le bouton de l’objectif règle vraiment sa date. Et la tâche prioritaire s’affiche par son nom, avec sa propre avancée, au lieu d’un tiret." },
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'Aujourd’hui : des cases plus nettes',
      desc: "La fenêtre de traitement se dessine sur 24 heures, le plan range les appellations côte à côte et se lit, la courbe garde des graduations rondes et des mois qui ne se chevauchent plus, et une case vide le dit au lieu d’afficher une frise vide. Dans la vue Économie, le coût de l’heure de la main-d’œuvre s’écrit arrondi (il s’affichait avec quatorze décimales)." },
    { niv: 0, pour: ['admin'], emoji: 'carburant', titre: 'La consommation de carburant, refaite',
      desc: "Une ligne par tracteur, la valeur sur une ligne, l’échelle sous les bons traits — et une phrase claire quand les pleins notés ne suffisent pas encore à mesurer." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'La tension par personne et la protection des parcelles reviennent',
      desc: "Elles avaient disparu avec le nouvel Aujourd’hui. La tension par personne vit dans L’équipe & le matériel — « Voir le détail » y mène — et la protection restante, parcelle par parcelle, dans Conformité." },
  ] },
  { v: '8.40', d: '2026-10-07', items: [
    { niv: 1, pour: ['tous'], cible: '#mv-dock', emoji: 'loupe', titre: 'Sur ordinateur : la barre latérale et Ctrl K',
      desc: "Sur un écran d’ordinateur, les modules passent dans une barre à gauche (repliable), et Ctrl K ouvre une recherche : un écran, un onglet du Pilotage, une parcelle. Sur téléphone et tablette, rien ne change." },
  ] },
  { v: '8.39', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-verdict', emoji: 'euro', titre: 'La photo économique du jour',
      desc: "Au Pilotage › Aujourd’hui, la bascule Terrain / Économie : l’atterrissage de la campagne, le coût à l’hectare, l’écart au barème, le dépensé face au fait, les postes, les appellations et les tâches — les mêmes chiffres que l’onglet Économie." },
  ] },
  { v: '8.38', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-verdict', emoji: 'graphique', titre: 'Aujourd’hui, comme la maquette',
      desc: "Le Pilotage › Aujourd’hui reprend la maquette validée : la fin prévue et sa frise, la décision du jour, le domaine en direct avec les équipes sur leurs parcelles, les chantiers, la charge restante, « À savoir » avec la météo des cinq jours, et le fil de l’équipe — avec vos vraies données." },
  ] },
  { v: '8.37', d: '2026-10-07', items: [
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Prolonger un contrat : ce que ça change',
      desc: "Dans « À savoir », un contrat qui finit dans le mois dit ce qu’une prolongation d’un mois éviterait : les heures de rattrapage et les tâches qui sortiraient de leur fenêtre, calculées comme le coût de l’inaction." },
  ] },
  { v: '8.36', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-savoir', emoji: 'pluie', titre: 'La météo, secteur par secteur',
      desc: "« À savoir » dit maintenant sur quelles communes la pluie ou le vent tombera demain et après-demain, et combien de parcelles de brûlage devront y attendre un temps sec." },
  ] },
  { v: '8.35', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-vue-eco', emoji: 'euro', titre: 'Aujourd’hui, côté terrain ou côté argent',
      desc: "Au Pilotage › Aujourd’hui, une bascule Terrain / Économie : la même journée vue du terrain (fin prévue, plan, chantiers, fil) ou de l’argent (coût de l’inaction, budget, et tout l’onglet Économie, avec les mêmes chiffres)." },
  ] },
  { v: '8.34', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-plan', emoji: 'carte', titre: 'Le domaine en direct',
      desc: "Au Pilotage › Aujourd’hui : toutes vos parcelles d’un coup d’œil, rangées par appellation puis par commune, la largeur de chacune selon sa surface, colorées selon la tâche choisie (faite, en cours, à faire, en retard). Les équipes du jour y apparaissent ; touchez une parcelle pour ouvrir sa fiche." },
  ] },
  { v: '8.33', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-savoir', emoji: 'pluie', titre: '« À savoir » prévient avant',
      desc: "Au Pilotage › Aujourd’hui : la pluie ou le vent des deux jours qui viennent (et le brûlage qui attendra), les absences de la semaine, les contrats qui finissent dans le mois et les tâches en retard, avec le bouton pour agir. Le matériel immobilisé et la cave y sont rangés." },
  ] },
  { v: '8.32', d: '2026-10-07', items: [
    { niv: 1, pour: ['admin'], cible: '#ck-fil', emoji: 'graphique', titre: 'Aujourd’hui se lit d’un coup d’œil',
      desc: "Au Pilotage › Aujourd’hui : une phrase résume la journée, les chantiers en cours et la courbe de la charge restante ont leur place, et le fil « En direct » montre ce que l’équipe valide, dès que ça arrive. Tout ce qui s’affichait avant est toujours là." },
  ] },
  { v: '8.31', d: '2026-10-07', items: [
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'Les graphiques prennent vie',
      desc: "La première fois qu’un graphique s’affiche, sa courbe se dessine sous vos yeux. Faites glisser le doigt, ou passez la souris, le long d’un graphique : l’infobulle suit, avec un trait sur le jour montré. Rien ne bouge si votre téléphone demande moins d’animations." },
  ] },
  { v: '8.30', d: '2026-10-07', items: [
    { niv: 0, pour: ['admin'], emoji: 'tracteur', titre: 'Renommer une activité du tracteur',
      desc: "Dans la fiche de l’activité (Tracteur › roue crantée › Activités) : toutes ses sessions prennent le nouveau nom, y compris sur les téléphones restés hors ligne. « Traitement » garde le sien, le registre phyto l’attend. Les tracteurs, eux, se renomment déjà dans leur fiche." },
  ] },
  { v: '8.29', d: '2026-10-07', items: [
    { niv: 0, pour: ['admin'], emoji: 'crayon', titre: 'Renommer un salarié',
      desc: "Dans sa fiche (Réglages › Équipe). Tout son historique suit — journal, tracteur, phyto, Chai, planning, heures sup, acomptes, paie —, y compris sur les téléphones restés hors ligne. Son compte ne change pas : même adresse, même mot de passe. Les archives, les documents déjà imprimés et le chat gardent l’ancien nom." },
  ] },
  { v: '8.28', d: '2026-10-06', items: [
    { niv: 0, pour: ['admin'], emoji: 'carburant', titre: 'La cuve GNR se lit de nouveau sur téléphone',
      desc: "Au Pilotage › Aujourd’hui, la carte Cuve GNR était tassée dans une demi-colonne : barres invisibles, litres coupés, échelle illisible. Sur téléphone et tablette, les cartes du tracteur prennent maintenant toute la largeur. Sur ordinateur, la cuve se lit à droite des travaux en cours, et la révision passe dessous." },
  ] },
  { v: '8.27', d: '2026-10-06', items: [
    { niv: 0, pour: ['admin'], emoji: 'etiquette', titre: 'Les appellations, rangées dans la Cave',
      desc: "Appellations et plafonds de rendement quittent Réglages › Domaine pour la roue crantée de la Cave, bloc « Le Millésime » : deux lignes qui résument, chacune ouvre sa fenêtre — les plafonds par millésime, et le rattachement des parcelles (celles sans appellation en tête)." },
  ] },
  { v: '8.26', d: '2026-10-06', items: [
    { niv: 0, pour: ['admin'], emoji: 'crayon', titre: 'Renommer une parcelle',
      desc: "Dans la roue crantée de la Vigne › Parcelles & secteurs météo. La parcelle garde tout son historique : journal, sessions tracteur, registre phyto, vendanges, carte et tournées prennent le nouveau nom, y compris sur les téléphones restés hors ligne. Les archives des campagnes passées gardent l’ancien." },
  ] },
  { v: '8.25', d: '2026-10-05', items: [
    { niv: 0, pour: ['salaries'], emoji: 'equipe', titre: 'L’équipe du mois dans le Planning',
      desc: "Un nouvel onglet, L’équipe, montre qui est là jour par jour ce mois-ci : présent ou absent, sans jamais le motif — même un congé s’affiche « Abs ». Votre propre mois reste dans Mon mois." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Vos salariés voient qui est là',
      desc: "Dans le Planning, chaque salarié a désormais un onglet L’équipe, en lecture seule : présent ou absent pour chacun, sur le mois en cours, sans motif, sans heures ni congés restants. Rien ne change dans vos écrans." },
  ] },
  { v: '8.24', d: '2026-10-05', items: [
    { niv: 0, pour: ['admin'], emoji: 'cadenas', titre: 'Les motifs d’absence ne quittent plus votre appareil',
      desc: "Le téléphone d’un salarié ne reçoit plus les motifs d’absence, les commentaires, les heures sup ni les acomptes de ses collègues : seulement ses propres jours, et l’équipe sans aucun motif. Rien ne change pour vous, ni à l’écran des salariés." },
  ] },
  { v: '8.23', d: '2026-10-05', items: [
    { niv: 0, pour: ['tous'], emoji: 'chrono', titre: 'Le journal s’ouvre plus vite',
      desc: "Le journal ne dessine plus que les jours visibles à l’écran : il s’affiche environ deux fois et demie plus vite sur un téléphone moyen." },
  ] },
  { v: '8.22', d: '2026-10-05', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Des petits textes plus grands',
      desc: "Étiquettes, dates et mentions sont plus grandes dans toute l’appli, pour mieux se lire au soleil. Dans le registre phyto, la ligne des parcelles tient de nouveau sur une seule ligne." },
  ] },
  { v: '8.21', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'chrono', titre: 'L’écran ne se fige plus quand un collègue valide',
      desc: "Quand un collègue valide une tâche, seul l’écran que vous regardez se met à jour, une fois. Avant, toute la Vigne se redessinait à chaque fois." },
  ] },
  { v: '8.20', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'horsligne', titre: 'Se connecter sans réseau',
      desc: "Au fond d’une cave ou dans une zone sans signal, si le téléphone a fermé l’appli : tapez votre mot de passe comme d’habitude, il ouvre l’appli même sans réseau. "
        + "Il faut s’être déjà connecté une fois avec du réseau sur ce téléphone, et être la dernière personne à s’y être connectée. "
        + "Ce que vous saisissez part dès le retour du signal." },
  ] },
  { v: '8.19', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'eclair', titre: 'L’appli s’ouvre plus vite',
      desc: "Le logo animé de l’ouverture durait plus de trois secondes à chaque fois, même quand l’appli était prête. "
        + "Il disparaît maintenant dès que l’écran est prêt ; l’animation complète ne se joue qu’à la première ouverture d’un téléphone. "
        + "Et quand le réseau traîne, votre profil s’affiche tout de suite, depuis le téléphone, au lieu d’attendre le serveur." },
  ] },
  { v: '8.18', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'valide', titre: '« Valider » ne reste plus bloqué quand le réseau traîne',
      desc: "Depuis la fiche d’une parcelle (et depuis le journal), « Valider » attendait la météo de la tâche avant d’enregistrer : "
        + "sur un réseau faible, la fenêtre restait ouverte et rien n’était écrit. La validation s’enregistre maintenant tout de suite ; "
        + "la météo s’ajoute à l’entrée dès qu’elle arrive — ou pas, si le réseau ne répond pas." },
    { niv: 0, pour: ['tous'], emoji: 'cadenas', titre: 'Sans réseau, l’écran de connexion dit la vérité',
      desc: "Sans réseau, « Se connecter » affichait « Mot de passe incorrect », alors que le mot de passe n’avait même pas été vérifié. "
        + "L’écran dit maintenant « Pas de connexion réseau » : la connexion en demande, réessayez quand le téléphone capte. "
        + "Vos saisies en attente restent sur l’appareil." },
  ] },
  { v: '8.17', d: '2026-10-04', items: [
    { niv: 0, pour: ['cave'], emoji: 'verre', titre: 'Déguster, traiter, filtrer : trois gestes neufs au Chai',
      desc: "Dans « Nouvelle opération », trois boutons de plus. <b>Dégustation</b> : une cuvée à la fois — ou un fût précis si une anomalie s’y montre —, comment il goûte, ce qu’on remarque, la suite à donner ; « Enregistrer et goûter la suivante » enchaîne les cuvées. "
        + "<b>Traitement</b> : collage, stabilisation, acidité, tanins et gomme, ensemencement ; le produit vient de La Réserve, la quantité se calcule et sort du stock. "
        + "<b>Filtration</b> : le type, le seuil, la perte. Tout arrive au journal, au Suivi d’élevage et au registre des manipulations ; « Autre » reste pour le reste." },
    { niv: 0, pour: ['cave'], emoji: 'crayon', titre: 'Deux détails du formulaire de cave',
      desc: "Les pastilles de cuvée retrouvent leur espace avant le point (« Village 2026 · 12 »), et l’aperçu des pastilles de soufre attend qu’une cuvée soit cochée au lieu de compter des fûts qui n’existent pas." },
  ] },
  { v: '8.16', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Accueil : un bloc masqué reste masqué',
      desc: "Sur ordinateur, un bloc masqué réapparaissait en quittant la personnalisation, et les rangées se décalaient. C’est corrigé. "
        + "En mode personnalisation, l’œil est barré sur un bloc masqué : touchez-le pour le réafficher." },
  ] },
  { v: '8.15', d: '2026-10-04', items: [
    { niv: 0, pour: ['tous'], emoji: 'feuille', titre: 'L’Accueil rangé en rangées',
      desc: "Sur ordinateur, les blocs de l’Accueil vont par deux, en rangées : les deux blocs d’une rangée ont la même hauteur, leurs bas s’alignent. "
        + "En mode édition, le bouton « Pleine largeur » met un bloc sur toute la rangée ; un bloc masqué laisse son voisin prendre toute la largeur. "
        + "La météo par secteur a son propre bloc, en une seule carte." },
  ] },
  { v: '8.14', d: '2026-10-04', items: [
    { niv: 0, pour: ['admin'], emoji: 'graphique', titre: 'La décision du jour, mieux rangée',
      desc: "Au Pilotage, les quatre cartes du jour sont bâties pareil : le verdict, la raison, un repère, un bouton — les verdicts tombent sur la même ligne, les boutons aussi. "
        + "La protection restante et le détail de la tension ont leur propre carte juste en dessous, avec les 5 lignes les plus urgentes et un bouton pour le reste. "
        + "La carte de la tâche prioritaire propose toujours à l’administrateur de fixer la priorité. Sur téléphone, les quatre cartes vont par deux." },
  ] },
  { v: '8.13', d: '2026-10-04', items: [
    { niv: 2, pour: ['admin'], emoji: 'cible', titre: 'La tâche prioritaire suit vos dates de travaux',
      desc: "Le Pilotage affichait en tâche prioritaire celle qui avait le plus d’heures restantes — la taille tout l’hiver, quelle que soit la priorité que vous fixiez. "
        + "Maintenant, <b>la priorité que vous fixez passe devant partout</b> : Pilotage, Accueil, Décider. Sans priorité, c’est la seule tâche qui est dans ses dates de travaux ; "
        + "quand plusieurs tâches se chevauchent, l’application ne choisit plus à votre place : la carte vous propose de fixer la priorité. "
        + "<b>À vérifier</b> : que chaque tâche de la saison a ses dates (Réglages › Domaine › Saisons, le crayon, « Dates de travaux estimées » — ou la roue crantée du Pilotage). Une tâche sans dates court sur toute la saison et chevauche toutes les autres." },
    { niv: 0, pour: ['tous'], emoji: 'feuille', titre: 'Ma part du chantier suit la priorité de votre équipe',
      desc: "Le bloc de l’Accueil montrait la tâche la plus travaillée par l’équipe ces 15 derniers jours, ou à défaut la première de la liste — même quand une autre priorité était fixée. "
        + "Il suit maintenant la priorité de votre équipe ; sans priorité, la seule tâche dans ses dates de travaux ; si plusieurs se chevauchent, celle où <b>vous</b> avez le plus travaillé ces 15 derniers jours. La ligne sous le titre dit pourquoi." },
  ] },
  { v: '8.12', d: '2026-10-04', items: [
    { niv: 1, pour: ['admin'], cible: '#pil-an-cadres', emoji: 'calendrier', titre: 'L’année se lit dans un seul cadre à la fois',
      desc: "L’onglet « L’année » du Pilotage mettait en avant le pic des vendanges, affichait plusieurs chiffres différents pour le même exercice, et posait votre exercice comptable en euros à côté d’une année vigne en heures — qui n’était même pas la même année. "
        + "Choisissez maintenant en tête d’onglet l’<b>exercice comptable</b> ou l’<b>année vigne</b>, et l’année avec les flèches : tout l’écran suit. Le <b>budget</b> est en euros, avec le même calcul dans les deux cadres : dépensé, reste prévu, total attendu. "
        + "<b>Le renfort à prévoir</b> dit, avec l’équipe prévue au planning, combien de personnes manqueront et quand ; un bouton mène à Décider pour chiffrer les embauches." },
    { niv: 0, pour: ['admin'], emoji: 'equipe', titre: 'Le chiffre « Effectif » regarde devant',
      desc: "En tête de L’année, il annonçait le pic de la vendange, même passée. Il dit maintenant combien de personnes il faudra trouver, et à partir de quand. Sur une campagne choisie, il garde son pic." },
    { niv: 0, pour: ['admin'], emoji: 'euro', titre: 'Les mois du budget retombent sur le total',
      desc: "Le budget mois par mois oubliait les fûts et les prestations d’arrachage, et ne plaçait pas les amendements prévus : la somme des mois ne retombait pas sur le total de l’année. La barre du haut affichait aussi « Exercice » tout court : elle nomme maintenant le cadre consulté." }
  ] },
  { v: '8.11', d: '2026-10-03', items: [
    { niv: 0, pour: ['admin'], emoji: 'etiquette', titre: 'Renommer une tâche : l’administrateur l’impose partout',
      desc: "Quand un administrateur renomme une tâche créée par son domaine, le nouveau nom s’impose à tous les téléphones : chacun le reprend à sa prochaine synchronisation, sans que personne ait rien à faire. "
        + "Un téléphone resté hors ligne qui écrirait encore l’ancien nom est corrigé à son retour ; si deux valeurs se croisent, l’état le plus avancé est gardé." },
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'L’Accueil sur ordinateur, sans trous',
      desc: "Sur deux colonnes, les blocs de l’Accueil s’empilent maintenant sans laisser de blanc sous un bloc court. L’ordre se lit de haut en bas, colonne de gauche puis colonne de droite." },
  ] },
  { v: '8.10', d: '2026-10-03', items: [
    { niv: 0, pour: ['admin'], emoji: 'etiquette', titre: 'Renommer une tâche créée par votre domaine',
      desc: "Dans <b>Réglages › Tâches</b>, la fenêtre « Modifier » (le crayon) d’une tâche créée par votre domaine propose « Renommer cette tâche ». Tout son historique suit le nouveau nom : "
        + "l’avancement des parcelles, le journal, les périodes et leurs échéances, la priorité, les équipes du jour. Les tâches du catalogue ne se renomment pas." },
  ] },
  { v: '8.09', d: '2026-10-03', items: [
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'Les surfaces s’écrivent de la même façon dans tous les modules',
      desc: "Le Traitement, le Tracteur, les Réglages et le Cuvier écrivaient encore certaines surfaces avec un point (« 1.25 ha »). "
        + "Partout maintenant : une parcelle au centiare près (« 0,0870 ha »), un total au centième (« 11,85 ha »), avec la virgule." },
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'La Cave et le Cuvier au même dessin',
      desc: "Les jauges de la Cave, l’avancement de la vendange et des travaux du Cuvier prennent la barre commune de l’application. Le niveau d’une cuve garde sa couleur terre, celle des volumes mesurés." },
  ] },
  { v: '8.08', d: '2026-10-03', items: [
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'Les barres de la Vigne, du Planning et du Tracteur au même dessin',
      desc: "Les barres d’avancement de la fiche rapide de la carte, du Planning, des sessions tracteur et des cartes de l’Accueil ont maintenant la même épaisseur et la même forme que le reste de l’application. "
        + "Leur couleur dit l’état : verte quand c’est fini, dorée en cours — une session tracteur en cours n’est plus orange, couleur réservée au retard. "
        + "Les cercles du Pilotage ont tous la même taille." },
    { niv: 0, pour: ['admin'], emoji: 'calendrier', titre: 'Les échéances comptent la journée de votre planning',
      desc: "Quand le planning ne mesure aucune présence récente, les <b>échéances par tâche</b> estimaient une journée de 7 h. Elles lisent maintenant la journée prévue par votre modèle de planning — plus courte l’hiver dans un domaine annualisé. "
        + "La « journée de référence » des hypothèses ne sert plus qu’en dernier recours." },
  ] },
  { v: '8.07', d: '2026-10-03', items: [
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'Sur ordinateur, l’Accueil et les Parcelles passent sur deux colonnes',
      desc: "À partir de 1 024 px de large, les blocs de l’Accueil se rangent deux par deux, dans l’ordre que vous leur avez donné. "
        + "En mode Personnaliser, un bloc se glisse aussi d’une colonne à l’autre. La liste des parcelles se range aussi sur deux colonnes, les bandeaux du haut gardent toute la largeur. Au téléphone, rien ne change." },
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: 'Les chiffres se lisent du premier coup',
      desc: "Les grands chiffres de l’application étaient dessinés « à l’ancienne », un 1 court comme un I : « 17 % » se lisait « I7% », « 19° » « I9° ». "
        + "Ils sont maintenant droits partout. Sur l’Accueil, la surface s’écrit « 11,85 ha » et la barre de la saison est dorée tant qu’elle n’est pas finie." },
  ] },
  { v: '8.06', d: '2026-10-03', items: [
    { niv: 3, pour: ['tous'], emoji: 'livre', titre: 'Les mises à jour se lisent maintenant dans Réglages › Moi',
      desc: "Pour voir ce qui a changé dans Ma Vigne — les nouveautés comme les petites corrections —, ouvrez <b>Réglages › Moi › Journal des nouveautés</b> : tout y est rangé, mois par mois. "
        + "L’application ne vous interrompt plus à chaque mise à jour : cette fenêtre ne s’ouvre plus que pour une grande nouveauté, au plus une fois par mois." },
  ] },
  { v: '8.05', d: '2026-10-03', items: [
    { niv: 0, pour: ['tous'], emoji: 'graphique', titre: 'L’avancement par tâche, un seul dessin',
      desc: "À l’Accueil comme dans <b>Pilotage › La campagne</b>, l’avancement par tâche se dessine de la même façon : les noms en entier, une barre fine, "
        + "et une couleur qui dit l’état — vert quand c’est fini, doré en cours, orange quand la fenêtre du travail est passée sans qu’il soit fini. "
        + "La couleur ne dépend plus du pourcentage : une tâche à 10 % en début de saison n’apparaît plus en faute. Sur la liste des parcelles, la barre suit la même règle." },
    { niv: 0, pour: ['tous'], emoji: 'oeil', titre: '« Agrandir » sur chaque graphique',
      desc: "Les graphiques du Pilotage et de la Cave portent un bouton « Agrandir » : le même dessin s’ouvre en grand, à la largeur de l’écran." },
    { niv: 0, pour: ['tous'], emoji: 'carte', titre: 'Sur ordinateur, les pages ne s’étirent plus',
      desc: "Au-delà de 1 200 px de large, l’Accueil, les Parcelles et le Pilotage gardent une largeur de lecture et se centrent, au lieu de s’étaler sur tout l’écran. "
        + "Et les grands chiffres s’écrivent sans trou : « 12 % » ne se lit plus « I 2 % »." },
  ] },
  { v: '8.04', d: '2026-10-03', items: [
    { niv: 2, pour: ['admin'], emoji: 'cloche', titre: 'Les nouveautés ne s’ouvrent plus à chaque mise à jour',
      desc: "Une fenêtre ne s’ouvre plus que pour une <b>grande nouveauté</b> : au plus une fois par mois, trois au plus. "
        + "Ce qui demande votre attention — un chiffre qui change, un réglage à vérifier — tient en une ligne sur l’Accueil, pour les seules personnes concernées, jusqu’à ce que vous touchiez « Vu ». "
        + "Une nouveauté porte une pastille « Nouveau » là où elle se trouve, jusqu’à ce que vous vous en serviez. "
        + "Chacun ne voit que ce qui le concerne : un ouvrier n’a plus à lire les nouveautés du Pilotage. "
        + "Tout le reste, petites corrections comprises, se lit quand vous voulez dans <b>Réglages › Moi › Journal des nouveautés</b>." },
    { niv: 1, pour: ['tous'], cible: '#regl-nouv-row', emoji: 'livre', titre: 'Le Journal des nouveautés',
      desc: "Dans <b>Réglages › Moi</b> : tout ce qui a changé dans Ma Vigne, mois par mois. Les grandes nouveautés d’abord, ce qu’il faut vérifier ensuite, puis les nouveautés ; les corrections sont repliées en bas. "
        + "Les versions d’avant octobre 2026 s’y relisent aussi, sous « Versions précédentes »." },
  ] },
  { v: '8.03', items: [
    { emoji: 'equipe', titre: 'Le renfort dit combien de saisonniers, et quand — sans heures sup',
      desc: "Dans <b>Pilotage › Décider</b>, la carte du renfort répond d’office : combien de saisonniers, de quelle date à quelle date, pour quel travail, et ce que ça coûte. "
        + "Elle se calcule aux heures prévues au planning — un saisonnier en TESA suit l’horaire de l’équipe — et ne compte plus aucune heure sup : le renfort sert justement à ne pas en faire. "
        + "Jusqu’ici, le simulateur laissait chacun travailler une heure de plus par jour avant de réclamer du monde." },
    { emoji: 'balance', titre: 'Et sans renfort ? Le coût des heures sup et le retard, côte à côte',
      desc: "Sous le calendrier, trois lignes comparent le renfort proposé, l’équipe seule qui monte jusqu’à un plafond (39, 43 ou 48 h par semaine) avec le coût de ses heures sup et le retard qui reste, "
        + "et l’équipe seule sans heures sup. « Choisir moi-même la période » donne le nombre de saisonniers pour les dates de votre choix." },
    { emoji: 'alerte', titre: 'Le coût de l’inaction se calcule aux heures du planning',
      desc: "Sur l’écran du matin, le coût de l’inaction ne cache plus une heure de plus par jour dans son calcul : il suppose l’équipe aux heures prévues, comme le renfort. Le chiffre peut monter — il était trop optimiste." },
  ] },
  { v: '8.02', items: [
    { emoji: 'raisin', titre: 'L\u2019arrachage compte au Pilotage comme sur la liste des parcelles',
      desc: "Un arrachage d\u00e9coup\u00e9 en \u00e9tapes, d\u00e9montage fait, s\u2019affichait \u00e0 50\u00a0% sur la liste des parcelles et \u00e0 0\u00a0% dans <b>Pilotage \u203a La campagne</b>. "
        + "Les deux lisent maintenant la m\u00eame part. Et une t\u00e2che sans heures pr\u00e9vues \u00e0 l\u2019hectare (arrachage, d\u00e9sherbage manuel) ne s\u2019affiche plus \u00ab\u00a00/0\u00a0h\u00a0\u00bb\u00a0: "
        + "elle s\u2019avance en surface, faite sur concern\u00e9e. Sur la carte d\u2019une parcelle, le compte des t\u00e2ches suit le pourcentage\u00a0: \u00ab\u00a01,5/2\u00a0t\u00e2ches\u00a0\u00bb au lieu de \u00ab\u00a075\u00a0% \u00b7 1/2\u00a0\u00bb." },
    { emoji: 'carte', titre: 'La carte du domaine ne passe plus par-dessus la barre du bas',
      desc: "Sur ordinateur, la carte du Pilotage recouvrait la barre des modules en bas de l\u2019\u00e9cran. Elle reste maintenant dans sa carte, comme celle de Parcelles. M\u00eame chose pour la carte de la tourn\u00e9e, dans D\u00e9cider." },
    { emoji: 'check', titre: 'Un m\u00eame travail porte un seul nom, partout',
      desc: "\u00ab\u00a0Reparation\u00a0\u00bb sur les filtres, \u00ab\u00a0R\u00e9par.\u00a0\u00bb au Pilotage, \u00ab\u00a0Brulage\u00a0\u00bb sans accent\u00a0: les travaux s\u2019\u00e9crivent maintenant en entier et accentu\u00e9s. "
        + "La forme courte ne reste que dans la petite carte \u00ab\u00a0Avancement par t\u00e2che\u00a0\u00bb de l\u2019Accueil, o\u00f9 la place manque. Une t\u00e2che cr\u00e9\u00e9e par votre domaine garde le nom que vous lui avez donn\u00e9." },
    { emoji: 'carte', titre: 'Les surfaces s\u2019\u00e9crivent toutes de la m\u00eame fa\u00e7on',
      desc: "Une parcelle s\u2019\u00e9crit au centiare pr\u00e8s, avec quatre d\u00e9cimales\u00a0: \u00ab\u00a00,0870\u00a0ha\u00a0\u00bb sous \u00ab\u00a00,1144\u00a0ha\u00a0\u00bb, au lieu de \u00ab\u00a00,087\u00a0\u00bb. Un total s\u2019\u00e9crit au centi\u00e8me\u00a0: "
        + "la carte du domaine dit \u00ab\u00a011,85\u00a0ha\u00a0\u00bb, plus \u00ab\u00a012\u00a0ha\u00a0\u00bb. "
        + "Et la liste des parcelles qui restent, dans <b>Ma part du chantier</b>, ne finit plus par quatre points." },
  ] },
  { v: '8.01', items: [
    { emoji: 'etincelles', titre: 'Une grande mise à jour : Ma Vigne prévoit',
      desc: "Cette version est spéciale. Le Pilotage a été repensé pour tirer le meilleur des prévisions que l’application peut faire avec ce que vous saisissez chaque jour. La puissance de calcul disponible aujourd’hui permet d’anticiper beaucoup de choses, et c’est maintenant dans Ma Vigne : "
        + "<b>le tracteur</b> se projette sur les travaux en cours — révision, cuve, consommation mesurée sur vos pleins ; <b>la protection phyto</b> se lit parcelle par parcelle, pluie comprise ; <b>l’équipe</b> a sa cadence, sa tension et ses petites courbes ; <b>la tournée</b> dit son rendement ; <b>la carte</b> se lit de cinq façons ; <b>le coût de l’inaction</b> s’affiche sur l’écran du matin ; une <b>photo quotidienne</b> donne une courbe à la charge restante et au budget. "
        + "Chaque chiffre nouveau porte un « i » qui dit d’où il vient, et le guide a été mis à jour pour vous accompagner (Pilotage, en tête de section). Prenez une quinzaine de jours pour vous approprier ces nouveaux repères : c’est normal, et c’est fait pour durer. Il peut rester des erreurs : n’hésitez pas à les remonter avec « Signaler un problème ». Je reste à votre disposition pour tout échange, et d’autres nouveautés suivront une fois ces repères pris en main. "
        + "Vous tenez là un outil puissant pour la conduite de votre vigne — faites-le travailler pour vous. — Nico, GUERETTECH" },
  ] },
  { v: '8.00', items: [
    { emoji: 'pluie', titre: 'La pluie lessive maintenant les contacts',
      desc: "La protection restante compte la pluie tombée depuis chaque traitement, lue chez Météo-France via Open-Meteo pour les 15 derniers jours. "
        + "Un contact (cuivre, soufre, folpel…) est à nu dès 20 mm cumulés, réglable dans Réglages › Pilotage › Conformité ; les pénétrants et systémiques ne se lessivent pas. "
        + "Chaque ligne dit ses millimètres ; le jour même ne compte que ses heures déjà passées. Sans réseau, l’écran le dit et garde les jours seuls." },
  ] },
  { v: '7.99', items: [
    { emoji: 'graphique', titre: 'La charge restante et le budget ont leur petite courbe',
      desc: "Chaque jour, à la première ouverture d’Aujourd’hui par un administrateur, l’appli note la charge restante, le budget consommé et le travail fait — une ligne par jour, 60 jours gardés, dans la configuration du domaine. "
        + "Au bout de quelques jours, la Charge restante montre sa pente sur 14 jours, et le Budget l’écart entre ce qui est consommé et ce qui est fait. Rien n’est rétroactif : les courbes se remplissent en deux semaines. Un jour sans ouverture est un trou, pas un zéro." },
  ] },
  { v: '7.98', items: [
    { emoji: 'bouclier', titre: 'Ce qu’il reste de protection, parcelle par parcelle',
      desc: "La carte « Traiter ? » dit maintenant combien de parcelles sont à nu, lesquelles le seront d’ici deux jours, et pour chacune le dernier traitement et les jours de protection qui restent. "
        + "Trois rémanences, par mode d’action, se règlent dans Réglages › Pilotage › Conformité : contact 10 jours, pénétrant 12, systémique 14 par défaut. Le mode d’action est déduit de la substance active ; quand il est deviné, un « ? » le dit." },
    { emoji: 'euro', titre: 'Le coût de l’inaction, sur l’écran du matin',
      desc: "Sous la marge sur votre objectif, Aujourd’hui affiche ce que le retard ajoute si personne n’est ajouté : les heures et les euros, d’après le simulateur de renfort de Décider, avec son hypothèse (+15 % par semaine de retard, réglable). C’est un modèle, pas une mesure, et c’est écrit à côté." },
  ] },
  { v: '7.97', items: [
    { emoji: 'carte', titre: 'La carte du domaine change de lecture',
      desc: "Pilotage › La campagne : au-dessus de la carte, cinq vues — l’avancement, les jours depuis le dernier traitement, le cépage, les passages phyto de la campagne face à votre référence, et le coût engagé à l’hectare. "
        + "La légende suit la vue choisie ; une parcelle sans donnée reste grise, et touchez-en une pour lire sa valeur." },
  ] },
  { v: '7.96', items: [
    { emoji: 'parcours', titre: 'Ce que rapporte l’ordre de passage',
      desc: "Sous le résultat de la tournée, Décider affiche maintenant son rendement : la part du temps de l’équipe passée sur les parcelles face aux trajets (à pied, en camion), le coût de l’équipe pour la tournée et le revient à l’hectare. "
        + "La même tournée est recalculée « au plus proche » pour comparer jours, trajets et euros à l’hectare — et un bouton prend cet ordre si vous le préférez." },
  ] },
  { v: '7.95', items: [
    { emoji: 'equipe', titre: 'La tension de l’équipe, face au planning prévu',
      desc: "Pilotage › Aujourd’hui compare, pour chaque personne, le travail effectif des 14 derniers jours à ce que le planning prévoyait — pas au contrat : en modulation, une semaine haute est prévue. "
        + "Une personne passe au seuil à plus de 10 % au-dessus du prévu, ou quand une des deux dernières semaines dépasse la moyenne autorisée réglée dans le Planning (44 h par défaut). Au-delà du maximum (48 h), elle passe en rouge. "
        + "Le chiffre du haut a sa petite courbe : l’écart de l’équipe, jour après jour." },
  ] },
  { v: '7.94', items: [
    { emoji: 'graphique', titre: 'La cadence a sa petite courbe',
      desc: "Dans Pilotage › Aujourd’hui, la Cadence équipe montre ses 14 derniers jours : chaque point est la cadence des 7 jours précédents, comparée au chiffre affiché (les 4 dernières semaines). "
        + "Sous le pointillé, l’équipe va moins vite que d’habitude : la courbe passe en orange, et la ligne du dessous donne l’écart du moment." },
  ] },
  { v: '7.93', items: [
    { emoji: 'tracteur', titre: 'Le tracteur se projette sur les travaux en cours',
      desc: "Un travail tracteur lancé doit couvrir tout le domaine : Pilotage › Aujourd’hui affiche maintenant, pour chaque session en cours, les hectares qui restent, les heures et les litres pour finir. "
        + "L’amendement suit ses parcelles choisies, dès la création de l’apport. Un travail terminé disparaît. "
        + "La <b>révision</b> se place dans ces travaux (« atteinte pendant le rognage ») et la <b>cuve</b> se lit après eux : ce qu’il restera quand tout sera fini, face à votre seuil." },
    { emoji: 'carburant', titre: 'La consommation de chaque tracteur est mesurée',
      desc: "Les litres de vos pleins, divisés par les heures notées entre deux pleins : Pilotage › L’équipe & le matériel montre la consommation réelle de chaque tracteur, et la part des heures chronométrées. "
        + "Tant qu’un tracteur n’a pas assez de pleins notés avec leurs litres, le réglage du Tracteur reste utilisé, et l’écran le dit." },
  ] },
  { v: '7.92', items: [
    { emoji: 'equipe', titre: 'L\u2019arrachage fini pour l\u2019\u00e9quipe, la suite au prestataire',
      desc: "Quand l\u2019arrachage est d\u00e9coup\u00e9 en \u00e9tapes, son avancement compte maintenant la part faite\u00a0: d\u00e9montage fait, ramassage au prestataire, la parcelle est \u00e0 la moiti\u00e9 au lieu de 0\u00a0%. "
        + "Et d\u00e8s que les \u00e9tapes de l\u2019\u00e9quipe sont faites partout, <b>Ma part du chantier</b> passe au chantier suivant\u00a0: ce qui reste est l\u2019affaire du prestataire. La fiche de la parcelle l\u2019\u00e9crit\u00a0: \u00ab\u00a0fini pour l\u2019\u00e9quipe, la suite au prestataire\u00a0\u00bb." },
  ] },
  { v: '7.91', items: [
    { emoji: 'corbeille', titre: 'Arracher une parcelle valide aussi le travail, en un seul geste',
      desc: "D\u00e9clarer une parcelle \u00ab\u00a0Arrach\u00e9e\u00a0\u00bb ne validait pas le travail d\u2019arrachage\u00a0: il fallait la remettre en exploitation pour le valider, et les autres travaux de la p\u00e9riode r\u00e9apparaissaient. "
        + "La feuille \u00ab\u00a0Arracher cette parcelle\u00a0\u00bb porte maintenant <b>Valider aussi le travail d\u2019arrachage</b>, coch\u00e9 d\u2019office\u00a0: la parcelle est arrach\u00e9e et son arrachage passe \u00e0 100\u00a0%, \u00e0 la date choisie. "
        + "Dans l\u2019autre sens, valider l\u2019arrachage d\u2019une vigne en place propose de la d\u00e9clarer arrach\u00e9e." },
  ] },
  { v: '7.90', items: [
    { emoji: 'carte', titre: 'L\u2019avancement d\u2019une parcelle arrach\u00e9e ne compte plus que l\u2019arrachage',
      desc: "Une parcelle arrach\u00e9e affichait par exemple \u00ab\u00a050\u00a0% \u00b7 1/2 t\u00e2ches\u00a0\u00bb alors que l\u2019arrachage y \u00e9tait \u00e0 0\u00a0%\u00a0: les autres travaux de la p\u00e9riode \u00e9taient encore compt\u00e9s sur une vigne qui n\u2019existe plus. "
        + "Elle ne porte plus que l\u2019arrachage\u00a0: dans son pourcentage, dans sa fiche, et aucun autre travail ne peut plus y \u00eatre valid\u00e9 ni d\u00e9marr\u00e9." },
  ] },
  { v: '7.89', items: [
    { emoji: 'raisin', titre: 'L\u2019arrachage p\u00e8se sur le prix de la bouteille',
      desc: "Dans le Pilotage, \u00c9conomie, <b>Revient</b>, le co\u00fbt vigne par bouteille compte maintenant ce que l\u2019arrachage et les prestataires ont co\u00fbt\u00e9 sur l\u2019ann\u00e9e vigne\u00a0: une prestation sur une vigne en place va \u00e0 cette vigne, et ce qu\u2019une vigne arrach\u00e9e a co\u00fbt\u00e9 (tracteur, phyto, prestataire) se r\u00e9partit sur les vignes en place. "
        + "Les heures de l\u2019\u00e9quipe pass\u00e9es \u00e0 arracher y \u00e9taient d\u00e9j\u00e0. Une ligne \u00ab\u00a0Arrachage & prestations\u00a0\u00bb s\u2019ajoute \u00e0 la r\u00e9partition du co\u00fbt." },
    { emoji: 'bouclier', titre: 'Une facture de prestataire ne se note qu\u2019une fois',
      desc: "La facture d\u2019un prestataire se note sur l\u2019\u00e9tape d\u2019arrachage, avec son num\u00e9ro. La R\u00e9serve refuse alors la m\u00eame facture (m\u00eame fournisseur, m\u00eame num\u00e9ro), et l\u2019inverse. Elle refuse aussi un \u00ab\u00a0intrant\u00a0\u00bb dont le nom dit prestation, main-d\u2019\u0153uvre ou arrachage." },
    { emoji: 'check', titre: 'Le bouton \u00ab\u00a0Prestataire\u00a0\u00bb s\u2019allume',
      desc: "Dans le r\u00e9glage des \u00e9tapes de l\u2019arrachage, le bouton \u00ab\u00a0Prestataire\u00a0\u00bb restait gris une fois touch\u00e9. Il passe maintenant au vert." },
  ] },
  { v: '7.88', items: [
    { emoji: 'euro', titre: 'Les prestations comptent dans l\u2019\u00c9conomie',
      desc: "Le montant factur\u00e9 par un prestataire pour une \u00e9tape d\u2019arrachage entre maintenant dans le Pilotage, \u00c9conomie\u00a0: un poste <b>Prestations</b> dans le co\u00fbt de la campagne et dans l\u2019exercice, et une colonne dans le tableau des parcelles, \u00e0 la date de l\u2019\u00e9tape. "
        + "Une \u00e9tape annul\u00e9e ne compte plus, une \u00e9tape revalid\u00e9e ne compte qu\u2019une fois." },
    { emoji: 'carte', titre: 'Une parcelle arrach\u00e9e appara\u00eet dans le co\u00fbt parcelle par parcelle',
      desc: "Quand une vigne arrach\u00e9e a co\u00fbt\u00e9 sur la p\u00e9riode \u2014 heures d\u2019arrachage, tracteur, prestataire \u2014, elle a sa ligne dans le tableau des parcelles, marqu\u00e9e \u00ab\u00a0arrach\u00e9e\u00a0\u00bb. "
        + "Sans bar\u00e8me et sans surface au total\u00a0: le co\u00fbt \u00e0 l\u2019hectare du domaine reste celui des vignes en place." },
    { emoji: 'journal', titre: '\u00ab\u00a0+ Journal\u00a0\u00bb conna\u00eet les \u00e9tapes de l\u2019arrachage',
      desc: "Quand l\u2019arrachage est d\u00e9coup\u00e9 en \u00e9tapes, la saisie du journal demande laquelle, avec le prestataire et son montant pour une \u00e9tape qui en a un. La parcelle avance comme depuis sa fiche." },
  ] },
  { v: '7.87', items: [
    { emoji: 'curseurs', titre: 'L\u2019arrachage en \u00e9tapes, compos\u00e9 par vous',
      desc: "Dans la roue crant\u00e9e de la Vigne, <b>T\u00e2ches</b>, la ligne Arrachage propose maintenant de <b>d\u00e9couper en \u00e9tapes</b>\u00a0: d\u00e9montage du palissage, arrachage des souches, ramassage, \u00e9pierrage, travail du sol avant repos, ou une \u00e9tape \u00e0 vous. "
        + "Cochez celles que vous faites, dans l\u2019ordre. Une \u00e9tape marqu\u00e9e <b>prestataire</b> se valide, mais aucune heure de l\u2019\u00e9quipe n\u2019y est compt\u00e9e\u00a0; le nom et le montant factur\u00e9 se notent dessus. "
        + "Vous choisissez aussi quand l\u2019application propose de passer la parcelle en \u00ab\u00a0Arrach\u00e9e\u00a0\u00bb\u00a0: apr\u00e8s une \u00e9tape pr\u00e9cise, ou quand tout est fait." },
    { emoji: 'graphique', titre: 'Les heures de chaque \u00e9tape, dans le temps r\u00e9el',
      desc: "Dans le Pilotage, \u00c9conomie, le tableau \u00ab\u00a0Temps r\u00e9el contre bar\u00e8me\u00a0\u00bb affiche une ligne par \u00e9tape sous l\u2019arrachage, avec son h/ha r\u00e9el. Apr\u00e8s vos chantiers, vous connaissez vos propres temps, \u00e9tape par \u00e9tape." },
  ] },
  { v: '7.86', items: [
    { emoji: 'carte', titre: 'Arrachage, d\u00e9sherbage manuel, effeuillage\u00a0: vous choisissez les parcelles',
      desc: "Ces trois travaux ne concernent jamais tout le domaine. Activ\u00e9s, ils s\u2019affichaient pourtant \u00ab\u00a0\u00e0 faire\u00a0\u00bb partout, et l\u2019avancement les comptait sur toutes les parcelles. "
        + "Dans la roue crant\u00e9e de la Vigne, <b>T\u00e2ches</b>, la ligne de chacun ouvre une liste\u00a0: l\u2019administrateur touche les parcelles concern\u00e9es, le total des hectares s\u2019affiche en bas. "
        + "Le choix vaut pour la <b>campagne</b>\u00a0: l\u2019an prochain, la liste repart vide. Une parcelle o\u00f9 le travail a d\u00e9j\u00e0 \u00e9t\u00e9 saisi compte d\u2019office." },
    { emoji: 'journal', titre: 'Le temps pass\u00e9 apr\u00e8s l\u2019arrachage se saisit sur la bonne parcelle',
      desc: "Une parcelle d\u00e9clar\u00e9e arrach\u00e9e disparaissait du journal. Les journ\u00e9es pass\u00e9es ensuite \u00e0 ramasser souches et piquets ne pouvaient plus y \u00eatre not\u00e9es, "
        + "et ces heures finissaient sur une autre parcelle. Elle reste maintenant propos\u00e9e au journal, en bas de la liste, <b>pour l\u2019arrachage seulement</b>, tant qu\u2019elle est choisie pour la campagne." },
  ] },
  { v: '7.85', items: [
    { emoji: 'tracteur', titre: 'Le semis au tracteur coche la t\u00e2che \u00ab\u00a0Amendement\u00a0\u00bb',
      desc: "Quand une parcelle est faite dans une session tracteur de l\u2019activit\u00e9 \u00ab\u00a0Amendement\u00a0\u00bb, sa t\u00e2che \u00ab\u00a0Amendement\u00a0\u00bb se valide toute seule. "
        + "Le journal le note \u00ab\u00a0Fait au tracteur\u00a0\u00bb, au nom du conducteur. Dans le Pilotage, ce temps reste celui de la session\u00a0: il n\u2019est pas compt\u00e9 une seconde fois, et les heures de l\u2019\u00e9quipe ne vont pas sur la parcelle sem\u00e9e. "
        + "Une validation annul\u00e9e depuis la parcelle n\u2019est pas refaite par la m\u00eame session." },
  ] },
  { v: '7.84', items: [
    { emoji: 'euro', titre: 'Le co\u00fbt d\u2019un amendement, d\u00e8s qu\u2019il est pr\u00e9vu',
      desc: "Un amendement enregistr\u00e9 avec un prix entre maintenant au <b>pr\u00e9vu</b> des achats dans Pilotage \u203a \u00c9conomie \u203a Exercice, \u00e0 sa semaine pr\u00e9vue. "
        + "D\u00e8s que sa facture est saisie dans La R\u00e9serve, c\u2019est elle qui compte, \u00e0 l\u2019engag\u00e9\u00a0: le montant n\u2019est jamais compt\u00e9 deux fois. Sans prix, rien n\u2019est pr\u00e9vu." },
    { emoji: 'pousse', titre: 'L\u2019ann\u00e9e de plantation sur le cahier de fertilisation',
      desc: "La fiche d\u2019une parcelle, dans l\u2019onglet Fertilisation, prend son <b>ann\u00e9e de plantation</b>. Elle sort sur le cahier imprim\u00e9 et dans le fichier tableur, \u00e0 la place du tiret." },
  ] },
  { v: '7.83', items: [
    { emoji: 'pousse', titre: 'Un amendement, et le cahier de fertilisation qui se remplit seul',
      desc: "Dans Phyto, un nouvel onglet <b>Fertilisation</b>. Le bouton rond ouvre l\u2019amendement\u00a0: le produit (cherch\u00e9 dans E-Phy, ou un produit norm\u00e9 avec sa norme), "
        + "sa composition lue sur le sac, la dose conseill\u00e9e \u00e0 l\u2019hectare et le poids d\u2019un sac. Vous cochez les parcelles\u00a0: le nombre de sacs de chacune et la commande se calculent. "
        + "La vitesse dans le rang et le temps utile donnent le temps tracteur. \u00c0 l\u2019enregistrement, la t\u00e2che \u00ab\u00a0Amendement\u00a0\u00bb est pr\u00e9vue sur ces parcelles, "
        + "l\u2019activit\u00e9 tracteur re\u00e7oit son bar\u00e8me et le produit entre dans La R\u00e9serve. Rien n\u2019est obligatoire\u00a0: sans prix, le co\u00fbt reste \u00ab\u00a0\u2014\u00a0\u00bb." },
    { emoji: 'document', titre: 'Le cahier d\u2019enregistrement de la fertilisation',
      desc: "Chaque parcelle se date seule le jour o\u00f9 elle est valid\u00e9e\u00a0: session tracteur de l\u2019activit\u00e9 \u00ab\u00a0Amendement\u00a0\u00bb, ou t\u00e2che valid\u00e9e. "
        + "L\u2019onglet montre l\u2019azote apport\u00e9 sur la campagne et ce qu\u2019un contr\u00f4le va demander\u00a0: zone vuln\u00e9rable, \u00eelot PAC, type de sol, analyse de sol. "
        + "Le cahier s\u2019imprime, ou sort en fichier tableur, depuis l\u2019onglet ou la roue crant\u00e9e du Phyto." },
  ] },
  { v: '7.82', items: [
    { emoji: 'raisin', titre: 'Le rendement en hL/ha, enfin rempli dans le fichier Excel des parcelles',
      desc: "Le fichier Excel des parcelles sortait ses colonnes de rendement \u00e0 z\u00e9ro \u2014 \u00ab\u00a00 estim\u00e9\u00a0\u00bb, fourchette \u00ab\u00a00 \u2013 0\u00a0\u00bb \u2014 alors que les kilos \u00e9taient bien l\u00e0. "
        + "Le millésime choisi n\u2019\u00e9tait pas reconnu par le calcul du volume. C\u2019est corrig\u00e9\u00a0: le hL/ha, mesur\u00e9 ou estim\u00e9, et sa fourchette sortent maintenant comme \u00e0 l\u2019\u00e9cran Le mill\u00e9sime, et le tri par rendement redevient juste." },
    { emoji: 'document', titre: 'Les récoltes de la vendange en hL/ha',
      desc: "Le document des r\u00e9coltes affichait le rendement en kg/ha. Il l\u2019affiche d\u00e9sormais en <b>hL/ha</b>, le m\u00eame chiffre que Le mill\u00e9sime, avec un \u00ab\u00a0~\u00a0\u00bb quand il est encore estim\u00e9, et le tri par rendement suit ce chiffre. "
        + "Un \u00e9tat sanitaire que personne n\u2019a not\u00e9 \u00e0 la saisie s\u2019affiche \u00ab\u00a0\u2014\u00a0\u00bb au lieu de \u00ab\u00a00\u00a0%\u00a0\u00bb, et ne tire plus la moyenne vers le bas." },
    { emoji: 'calendrier', titre: 'Le planning de l\u2019ann\u00e9e ne nomme plus les absents',
      desc: "Imprim\u00e9 en cours d\u2019ann\u00e9e, le planning listait tous ceux qui avaient travaill\u00e9 au domaine depuis janvier, saisonniers partis et fiches inactives compris. "
        + "Il ne nomme plus que les personnes sous contrat d\u2019aujourd\u2019hui au 31 d\u00e9cembre, et l\u2019\u00e9crit dans son en-t\u00eate. Une ann\u00e9e pass\u00e9e garde toute son \u00e9quipe." },
    { emoji: 'imprimante', titre: 'Les documents et les réglages de la Cave s\u2019affichent correctement',
      desc: "Sur t\u00e9l\u00e9phone, les documents \u00e0 imprimer s\u2019ouvraient \u00e9cras\u00e9s \u00e0 la largeur de l\u2019\u00e9cran\u00a0: horaires coup\u00e9s, tableaux qui d\u00e9bordaient. L\u2019aper\u00e7u montre maintenant la feuille enti\u00e8re, comme elle sortira de l\u2019imprimante. "
        + "Et la roue crant\u00e9e de la Cave, ouverte sans passer par Le Cuvier, affichait ses r\u00e9glages sans mise en forme\u00a0: c\u2019est r\u00e9par\u00e9." },
  ] },
  { v: '7.81', items: [
    { emoji: 'raisin', titre: 'Le fichier Excel des parcelles, aussi dans la Cave',
      desc: "Le fichier des parcelles tri\u00e9 par rendement se trouvait dans la Vigne. Il est maintenant aussi dans la roue crant\u00e9e de la Cave, "
        + "bloc Documents, juste apr\u00e8s les r\u00e9coltes de la vendange\u00a0: m\u00eame fichier, m\u00eame choix du mill\u00e9sime et de l\u2019ordre, "
        + "par nom ou par rendement en hL/ha, du plus fort au plus faible ou l\u2019inverse." },
  ] },
  { v: '7.80', items: [
    { emoji: 'equipe', titre: 'Les équipes du jour, depuis l\u2019Accueil',
      desc: "Quand le domaine travaille en plusieurs équipes, l\u2019administrateur touche «\u00a0Équipes du jour\u00a0» sur l\u2019Accueil et répartit "
        + "chacun. Toute la journée, un salarié qui valide ou démarre une parcelle le fait avec <b>son</b> équipe, sans rien cocher et sans "
        + "pouvoir la changer. Dans le Pilotage, chaque équipe garde ses parcelles\u00a0: quelqu\u2019un qui passe plusieurs jours seul sur une "
        + "grande parcelle voit ses heures y aller, et plus sur celles des autres. Rien de réglé\u00a0: l\u2019application fait comme avant, et "
        + "le lendemain tout repart à zéro." },
    { emoji: 'raisin', titre: 'Pilotage\u00a0: le coût parcelle par parcelle devient cohérent',
      desc: "Dans Économie › Parcelles, des séries de parcelles affichaient \u221290\u00a0% et d\u2019autres +300\u00a0%\u00a0: quand vous validiez "
        + "pour l\u2019équipe sans la cocher, seules vos heures allaient aux parcelles du jour, et celles de l\u2019équipe partaient sur sa "
        + "validation suivante. Désormais, la journée de tous ceux qui travaillent dans les rangs se partage entre <b>toutes les parcelles "
        + "validées ce jour-là</b>, au prorata du <b>barème</b>. Une équipe cochée garde ses parcelles, un administrateur décoché reste à "
        + "part. Les chiffres par parcelle, le temps réel contre barème et le coût par travail changent donc un peu\u00a0: le total, lui, ne bouge pas." },
  ] },
  { v: '7.79', items: [
    { emoji: 'liste', titre: 'Le fichier Excel des parcelles se trie, et donne le rendement',
      desc: "Le fichier des parcelles sortait toujours de A \u00e0 Z, sans aucun rendement. Avant de le t\u00e9l\u00e9charger, vous choisissez \u00e0 pr\u00e9sent "
        + "le mill\u00e9sime et l\u2019ordre\u00a0: par nom, de A \u00e0 Z ou de Z \u00e0 A, ou par rendement en hL/ha, du plus fort au plus faible ou l\u2019inverse. "
        + "Le fichier donne les kilos, le rendement \u2014 le m\u00eame chiffre que dans Le mill\u00e9sime \u2014, dit s\u2019il est mesur\u00e9 ou estim\u00e9 et donne sa fourchette. "
        + "Une parcelle sans r\u00e9colte cette ann\u00e9e-l\u00e0 part en fin de liste, cases vides. Vigne \u203a roue crant\u00e9e \u203a Documents, ou R\u00e9glages \u203a Documents & impressions." },
  ] },
  { v: '7.78', items: [
    { emoji: 'raisin', titre: 'Arracher une parcelle depuis sa fiche',
      desc: "Quand une vigne est arrach\u00e9e, il n\u2019y avait aucun moyen de le noter dans l\u2019application. Un administrateur peut "
        + "d\u00e9sormais ouvrir la fiche de la parcelle, toucher \u00ab\u00a0Arracher cette parcelle\u00a0\u00bb, indiquer la date et le motif. "
        + "La parcelle n\u2019est pas supprim\u00e9e\u00a0: elle sort des surfaces, de l\u2019avancement, du planning et du registre phyto, "
        + "et son historique reste consultable. Une erreur se corrige dans la m\u00eame fiche avec \u00ab\u00a0Remettre en exploitation\u00a0\u00bb." },
  ] },
  { v: '7.77', items: [
    { emoji: 'document', titre: 'Un seul retour du client pour plusieurs livraisons',
      desc: "Un acheteur de raisin envoie souvent un seul total de jus et de lie pour tout ce qu\u2019il a re\u00e7u, alors que les "
        + "livraisons sont parties des jours diff\u00e9rents. Dans les ventes en vrac, le bouton \u00ab\u00a0Un seul retour pour plusieurs "
        + "livraisons\u00a0\u00bb permet de cocher les livraisons couvertes et de saisir ce total une fois\u00a0: les litres sont r\u00e9partis au "
        + "prorata des kilos, livraison par livraison, et le rendement de chaque parcelle suit. Rouvrir une de ces livraisons rouvre tout le "
        + "retour group\u00e9." },
  ] },
  { v: '7.76', items: [
    { emoji: 'bouteille', titre: 'Le revient du millésime, dans Économie',
      desc: "Nouvelle sous-vue «\u00a0Revient\u00a0»\u00a0: le rendement, les bouteilles et le coût vigne par bouteille du millésime, par "
        + "appellation. Tant que la vendange n’est pas finie, une parcelle pas encore récoltée prend la moyenne de ses millésimes "
        + "connus, et les chiffres sont marqués «\u00a0probable\u00a0». Tout se lit sur le cycle du millésime, d’une vendange à la suivante." },
    { emoji: 'check', titre: 'Les mêmes bouteilles que la Cave',
      desc: "Le coût à la bouteille de la Synthèse utilisait sa propre conversion (1,3\u00a0kg de raisin par bouteille) et divisait le "
        + "coût de la période affichée par toute la récolte. Il compte désormais comme la Cave, au kg/hL du Cuvier, sur le cycle "
        + "entier\u00a0: le chiffre peut bouger nettement. Le raisin vendu sort des bouteilles et de leur coût." },
    { emoji: 'engrenage', titre: 'Deux réglages dans la roue crantée',
      desc: "Les pertes d’élevage (5\u00a0% par défaut, remplacées par la part des anges mesurée quand un millésime est entièrement "
        + "mis en bouteille), et, si vous le voulez, vos autres charges de l’année — fermage, cave, structure — pour un coût "
        + "complet indicatif. «\u00a0Raisin par bouteille\u00a0» disparaît." }
  ] },
  { v: '7.75', items: [
    { emoji: 'document', titre: 'Enfin un relevé d’heures compréhensible',
      desc: "Après de longues heures de réflexion et de prise de tête, l’application arrive enfin à un relevé d’heures et une "
        + "impression des plannings compréhensibles. «\u00a0Pour la compta\u00a0» se lit comme la compta saisit\u00a0: le salaire de base, "
        + "puis trois cases — heures à 25\u00a0%, à 50\u00a0%, à 100\u00a0% —, chacune avec le mois d’où viennent ses heures, et un "
        + "contrôle qui additionne jusqu’à la demande du salarié." },
    { emoji: 'calendrier', titre: 'Un dimanche travaillé compte en entier',
      desc: "Un dimanche ou un férié qui n’était pas prévu au planning compte toujours en heures sup, à son taux, même quand la "
        + "semaine avait une absence\u00a0: 4\u00a0h de dimanche = 6\u00a0h de récup, ou 4\u00a0h payées à 50\u00a0%. L’absence se reprend "
        + "sur la récup. Un dimanche prévu au planning garde sa majoration seule, rangée dans la case de son taux." },
    { emoji: 'graphique', titre: 'L’année en trois colonnes',
      desc: "Le détail mois par mois montre côte à côte les heures sup de semaine, les dimanches et les jours fériés, chacun "
        + "fait et payé, puis la récup. En mode payé, la majoration d’un dimanche voyage avec l’heure\u00a0: elle n’est plus "
        + "ajoutée en repos à part, la récup restante peut changer." },
    { emoji: 'cle', titre: 'Dimanches et fériés\u00a0: toujours des heures sup, si vous le voulez',
      desc: "Nouveau réglage dans la roue crantée du Planning\u00a0: les heures d’un dimanche ou d’un férié peuvent compter "
        + "toujours en heures sup, à leur taux, même quand le jour figure au modèle de planning — avant septembre aussi. Par "
        + "défaut, rien ne change\u00a0: un dimanche prévu garde sa majoration seule." },
    { emoji: 'check', titre: 'Le relevé ne coupe plus rien',
      desc: "Un mois très chargé perdait ses derniers jours et sa ligne Total en bas de la première page. La page s’allonge "
        + "désormais d’une feuille quand il le faut. Et un mois figé montre ce qui est parti à la compta, pas un recalcul." }
  ] },
  { v: '7.74', items: [
    { emoji: 'document', titre: 'Le relevé d’heures tient de nouveau sur deux pages',
      desc: "Chez un salarié qui avait travaillé beaucoup de dimanches, le relevé débordait\u00a0: le détail de l’année mordait sur la "
        + "colonne de droite, les blocs Contrats et Congés étaient décalés, et les signatures partaient sur une troisième page. "
        + "La page 2 se répartit maintenant toute seule sur ses deux colonnes, et les signatures restent ensemble." },
    { emoji: 'check', titre: 'Chaque chose n’est plus écrite qu’une fois',
      desc: "Le relevé redisait plusieurs fois la même chose\u00a0: la majoration des dimanches d’avant septembre (sous chaque mois et "
        + "dans son tableau), le dimanche travaillé du mois (pages 1 et 2), la règle des heures sup d’avant septembre (trois fois). "
        + "Chaque information a maintenant une seule place. Les mois à venir, vides, ne s’impriment plus." }
  ] },
  { v: '7.73', items: [
    { emoji: 'document', titre: 'Le relevé d’heures s’imprime aussi pour un mois figé',
      desc: "Planning, fiche d’un salarié, bouton «\u00a0Relevé\u00a0»\u00a0: sur un mois déjà figé pour la compta, avec un dimanche ou un "
        + "jour férié travaillé, le relevé ne s’ouvrait pas et un message d’erreur apparaissait. Il s’imprime de nouveau, et nomme "
        + "bien le jour travaillé. Rien n’est à refaire\u00a0: le mois reste figé tel qu’il est parti." }
  ] },
  { v: '7.72', items: [
    { emoji: 'euro', titre: 'Le réalisé d’un travail est ce qu’il a vraiment coûté',
      desc: "Pilotage › Économie, «\u00a0Coût par travail\u00a0»\u00a0: une tâche finie affichait un réalisé égal à son budget "
        + "alors que les heures passées disaient autre chose. Le réalisé compte maintenant les heures du planning versées aux "
        + "parcelles validées, au taux chargé du jour, et une colonne «\u00a0Écart\u00a0» montre la différence avec le barème du "
        + "travail fait\u00a0: en plus, c’est plus cher que prévu. Même chose dans le tableau parcelle par parcelle." },
    { emoji: 'chrono', titre: 'Une parcelle validée deux fois ne compte plus double',
      desc: "Dans «\u00a0Temps réel contre barème\u00a0», une parcelle revalidée sans annulation entre les deux voyait son barème "
        + "compté deux fois, ce qui masquait l’écart réel. Ses heures y vont toujours, son barème une seule fois." }
  ] },
  { v: '7.71', items: [
    { emoji: 'check', titre: 'Vérification de version plus discrète',
      desc: "La vérification automatique de la version, arrivée en 7.68, pouvait laisser une fausse alerte dans le journal "
        + "d’incidents quand le serveur ne répondait pas comme prévu. Elle se tait désormais dans ce cas. Rien ne change pour vous." }
  ] },
  { v: '7.70', items: [
    { emoji: 'bouclier', titre: 'Un compte sans rôle ne peut plus rien modifier',
      desc: "Seuls les rôles administrateur, ouvrier et tractoriste enregistrent. Un compte sans aucun de ces rôles était déjà "
        + "privé de boutons, mais le serveur l’aurait laissé écrire\u00a0; c’est fermé. Vérifiez dans Réglages › Équipe que "
        + "chaque personne qui saisit a bien l’un de ces trois rôles." },
    { emoji: 'cle', titre: 'Une fiche passée Inactive perd vraiment l’accès',
      desc: "Passer un salarié ou un saisonnier en Inactif retirait sa tuile de connexion, mais un téléphone resté connecté "
        + "gardait l’accès au domaine. Désormais l’accès est coupé, sessions ouvertes comprises (dans l’heure au plus tard). "
        + "S’il revient, repassez la fiche en Actif avec un rôle\u00a0: l’accès revient à sa prochaine connexion." }
  ] },
  { v: '7.69', items: [
    { emoji: 'oeil', titre: 'Lecture seule\u00a0: un message clair au lieu d’un refus en rouge',
      desc: "Un saisonnier ou un pilote est en lecture seule. S’il touchait un bouton d’enregistrement, l’appli tentait quand "
        + "même, se faisait refuser et affichait en rouge «\u00a0Enregistrement refusé\u00a0». Elle n’essaie plus\u00a0: un message "
        + "dit une fois que son rôle est en lecture seule. Et ses incidents remontent désormais à l’assistance, comme ceux des autres." }
  ] },
  { v: '7.68', items: [
    { emoji: 'bouclier', titre: 'Une vieille version ne peut plus écraser vos données',
      desc: "Une application restée ouverte des jours pouvait continuer à enregistrer avec une ancienne version. Quand une mise "
        + "à jour change la façon dont les données sont enregistrées, l’ancienne version s’arrête maintenant d’écrire et affiche "
        + "«\u00a0Mise à jour obligatoire\u00a0» — vos saisies restent sur l’appareil et partent après la mise à jour." },
    { emoji: 'chrono', titre: 'La mise à jour se fait au retour, pas pendant la saisie',
      desc: "Si Ma Vigne est restée en arrière-plan plusieurs heures, elle installe la nouvelle version en revenant au premier "
        + "plan — seulement si rien n’est en cours. Pendant que vous travaillez, rien ne change." }
  ] },
  { v: '7.67', items: [
    { emoji: 'oeil', titre: 'Deux libellés qui se marchaient dessus',
      desc: "Pilotage › Aujourd’hui\u00a0: quand l’objectif ou la fin prévue tombe près d’aujourd’hui, «\u00a0Auj.\u00a0», «\u00a0Fin prévue\u00a0» "
        + "et «\u00a0Objectif\u00a0» se superposaient sur la frise. Ils se placent maintenant sur deux lignes. Archives, sur téléphone\u00a0: "
        + "l’échelle des mois n’affiche plus qu’un mois sur deux, pour que «\u00a0août\u00a026\u00a0» ne recouvre plus «\u00a0sept\u00a0»." }
  ] },
  { v: '7.66', items: [
    { emoji: 'antenne', titre: 'Une saisie faite hors ligne ne se perd plus',
      desc: "Si la mémoire du téléphone était pleine, une saisie faite sans réseau pouvait disparaître au retour du réseau, sans "
        + "un mot. Elle est maintenant gardée jusqu’à l’envoi, et un message vous prévient de ne pas fermer l’appli d’ici là. "
        + "Ma Vigne demande aussi au navigateur de ne pas effacer ses données quand le téléphone manque de place." }
  ] },
  { v: '7.65', items: [
    { emoji: 'calendrier', titre: 'Le bilan par année, dans les Archives',
      desc: "Pilotage › Archives\u00a0: sous la frise, une carte par année regroupe les campagnes closes — heures archivées, "
        + "interventions, parcelles touchées, sessions tracteur et principales tâches. Elle est <b>calculée</b> à partir des "
        + "archives de campagne, jamais recopiée. L’administrateur choisit le cadre\u00a0: <b>année vigne</b> ou <b>exercice "
        + "comptable</b>. Une intervention n’est jamais comptée deux fois, même dans les archives faites avant la v7.64." }
  ] },
  { v: '7.64', items: [
    { emoji: 'carton', titre: 'Chaque archive est la photo de sa campagne',
      desc: "À la clôture, l’archive recopiait <b>tout le journal depuis le premier jour</b>\u00a0: l’archive du printemps contenait "
        + "aussi l’hiver. Elle ne garde plus que le journal et les sessions de <b>sa</b> campagne. Les archives déjà faites sont "
        + "allégées de la même façon à la prochaine clôture. Le journal en cours, lui, ne change pas." },
    { emoji: 'bouclier', titre: 'Une clôture ne perd plus son archive',
      desc: "La nouvelle campagne n’est activée que lorsque l’archive est réellement enregistrée sur le serveur. Hors ligne, ou si "
        + "l’enregistrement est refusé, rien ne change et un message le dit\u00a0: vous réessayez avec du réseau." }
  ] },
  { v: '7.63', items: [
    { emoji: 'bouclier', titre: 'Le Pilotage reste réservé, même par un lien direct',
      desc: "Le Pilotage n’est proposé qu’à l’administrateur et au rôle pilotage. Un ouvrier, un tractoriste ou un saisonnier "
        + "pouvait pourtant l’ouvrir par un appel direct. C’est fermé\u00a0: il retombe sur son écran d’accueil. Les rémunérations, "
        + "elles, n’ont jamais été lisibles hors administrateur." }
  ] },
  { v: '7.62', items: [
    { emoji: 'equipe', titre: 'Une fiche sans date de contrat est maintenant signalée',
      desc: "Chaque salarié doit avoir ses dates de contrat. Le Pilotage affiche désormais «\u00a0fiche sans date de contrat\u00a0» dans "
        + "<b>Ce qu’il faut regarder</b>, avec les noms concernés et un bouton vers Réglages › Équipe. La règle est la même partout\u00a0: "
        + "une fiche <b>inactive sans date</b> ne compte plus dans l’effectif ni la capacité, sauf les années où elle a des heures au "
        + "planning — ces heures ont été faites et restent payées. Le Planning et le Pilotage ne peuvent plus compter la même personne "
        + "différemment." },
    { emoji: 'document', titre: 'Cave\u00a0: un PDF supprimé l’est vraiment',
      desc: "Supprimer une opération ou une cuvée, ou remplacer le PDF d’une analyse, laissait l’ancien fichier sur le serveur. "
        + "Il est maintenant effacé dès que plus aucune opération ni analyse ne l’utilise." },
    { emoji: 'check', titre: 'Le point de synchronisation suit toutes les actions',
      desc: "Après «\u00a0Actualiser\u00a0», un envoi de PDF en Cave ou un message non envoyé, le petit point de synchronisation "
        + "restait sur son état précédent. Il suit maintenant chaque changement, comme la pastille." }
  ] },
  { v: '7.61', items: [
    { emoji: 'euro', titre: 'Pilotage\u00a0: « Engagé à ce jour » compte les heures vraiment passées',
      desc: "La main-d’œuvre engagée valorisait au barème les seules parcelles <b>validées</b>\u00a0: une semaine de dégrafage pas encore validée "
        + "valait zéro. Elle se lit maintenant dans le <b>planning</b>\u00a0: les heures dans les rangs de chaque salarié vigne depuis le début de "
        + "la période, validées ou non, à son taux chargé du jour. La conduite du tracteur reste comptée à part, et une journée où le salarié figure "
        + "sur une <b>opération de cave</b> sort de la vigne. «\u00a0% du budget\u00a0» et «\u00a0% du travail fait\u00a0» se lisent côte à côte\u00a0: "
        + "l’écart entre les deux dit si l’on est en avance ou en retard." }
  ] },
  { v: '7.60', items: [
    { emoji: 'chrono', titre: 'Pilotage\u00a0: le temps réellement passé dans chaque parcelle',
      desc: "Nouvelle carte «\u00a0Temps réel contre barème\u00a0» dans Économie › Postes & travaux. Les heures «\u00a0dans les rangs\u00a0» du planning "
        + "de chaque salarié (congés, absences, formation et conduite du tracteur retirés) sont versées aux parcelles qu’il valide, "
        + "lui ou son groupe\u00a0: trois personnes une heure sur un are, c’est trois heures sur ce travail. Plusieurs parcelles le même jour "
        + "se partagent <b>au prorata de la surface</b>, et les jours sans validation vont au travail validé ensuite. Pour chaque travail, "
        + "le <b>h/ha réel</b> se lit à côté du <b>h/ha du barème</b>\u00a0: plus vite, ou plus lent, que la convention." },
    { emoji: 'equipe', titre: 'Valider pour l’équipe sans être dans les rangs',
      desc: "L’administrateur qui valide un travail pour son équipe peut maintenant <b>se décocher</b> du groupe\u00a0: puce «\u00a0Moi\u00a0» dans le "
        + "panneau de validation, ou «\u00a0Moi aussi dans les rangs\u00a0» sur la barre d’équipe de la tâche. La validation reste signée de son nom, "
        + "mais ses heures ne partent pas sur la parcelle. Le choix est retenu pour chaque tâche." }
  ] },
  { v: '7.59', items: [
    { emoji: 'retour', titre: 'Le bouton retour du téléphone ferme ce qui est ouvert',
      desc: "Sur Android, le bouton retour ne fermait que certaines fenêtres. Avec une feuille du Cuvier, la feuille «\u00a0Plus\u00a0» du menu, "
        + "la feuille «\u00a0c’est fait\u00a0» après une validation, le panneau «\u00a0Ce qu’il manque\u00a0» du Pilotage, la feuille de tri ou les feuilles "
        + "de Décider, il changeait de page et laissait la feuille par-dessus. Il la ferme maintenant, et vous restez où vous étiez." },
    { emoji: 'tracteur', titre: 'Tracteur\u00a0: toucher un conducteur filtre, le crayon modifie',
      desc: "Pour l’administrateur, un crayon invisible vivait dans chaque nom de conducteur\u00a0: un appui au milieu de «\u00a0Jean\u00a0» ouvrait "
        + "sa fiche au lieu de filtrer ses sessions. Le nom filtre, et un petit crayon visible, juste à côté, ouvre la fiche. "
        + "L’icône de la case «\u00a0traitement\u00a0» du formulaire de session ne disparaît plus au premier appui." },
    { emoji: 'doigt', titre: 'Des appuis plus sûrs',
      desc: "Deux appuis rapides sur un bouton ne font plus zoomer la page sur iPhone. Les puces de filtre, «\u00a0Tout voir\u00a0» de l’accueil "
        + "et la roue du Pilotage répondent sur une zone plus large que leur dessin." }
  ] },
  { v: '7.58', items: [
    { emoji: 'contraste', titre: 'Des textes redevenus lisibles',
      desc: "Plusieurs titres et chiffres étaient écrits foncé sur fond foncé ou clair sur fond clair\u00a0: la session tracteur <b>en cours</b> "
        + "(titre et pourcentage), la carte «\u00a0Travaux mécaniques\u00a0» de l’accueil, la <b>date</b> sous l’en-tête de chaque module, "
        + "les samedis et dimanches du Planning, l’année choisie du Planning. En thème sombre\u00a0: les chiffres et les titres de "
        + "Pilotage › L’année, le panneau «\u00a0Ce qu’il manque\u00a0», les titres des Réglages, les pastilles «\u00a0Active\u00a0». Tout se lit, dans les deux thèmes." },
    { emoji: 'cuve', titre: 'Le Cuvier\u00a0: la ligne de chaque cuve ne se chevauche plus',
      desc: "Dans la liste des cuves, le nom, les parcelles, le pourcentage de fermentation et l’état se superposaient sur une seule ligne. "
        + "Le nom est de nouveau au-dessus, les parcelles et le dernier relevé en dessous, la barre d’avancement sous le tout." },
    { emoji: 'lune', titre: 'Thème sombre\u00a0: les champs de saisie ne sont plus blancs',
      desc: "Dans la tournée du Cuvier, les maturités, la mise en bouteille, les relevés et l’écran d’acceptation des conditions, "
        + "les champs restaient blancs avec un texte clair\u00a0: on ne voyait pas ce qu’on tapait. Ils suivent maintenant le thème, "
        + "comme la cuve déjà relevée de la tournée et le formulaire des maturités." },
    { emoji: 'graphique', titre: 'Pilotage\u00a0: « Ce qu’il manque » passe devant la barre du bas',
      desc: "Le panneau ouvert par «\u00a0N choses à compléter\u00a0» passait sous la barre des modules, qui cachait son bas. Il passe désormais devant." }
  ] },
  { v: '7.57', items: [
    { emoji: 'equipe', titre: 'Décider ne compte plus un salarié en formation dans l’équipe du jour',
      desc: "Dans Pilotage › Décider, la tournée du jour et «\u00a0Qui fait quoi\u00a0» comptaient un salarié <b>en formation</b> "
        + "(jour de CFA) ou en <b>événement familial</b> comme s’il était dans les rangs\u00a0: pour la paie, ces jours valent "
        + "du travail, mais personne n’est à la vigne. Ils sont maintenant retirés, comme les congés, la récup, les arrêts et "
        + "les absences. Une formation d’une demi-journée ne retire que ses heures. Dans la liste de l’équipe, chaque absent "
        + "dit pourquoi\u00a0: «\u00a0en formation\u00a0», «\u00a0en arrêt\u00a0», «\u00a0en congé\u00a0»… La paie et le compteur d’heures ne changent pas." },
    { emoji: 'graphique', titre: 'La cadence ne compte plus la formation comme du temps à la vigne',
      desc: "La cadence de l’équipe et l’écart de cadence face au barème (Pilotage) comptaient un jour de formation ou "
        + "d’événement familial comme une journée passée dans les rangs\u00a0: le temps «\u00a0réellement passé\u00a0» était gonflé, "
        + "et l’écart penchait vers «\u00a0barème trop serré\u00a0». Ils comptent désormais zéro, comme dans Décider. "
        + "Le coût de la main-d’œuvre, lui, compte toujours ces heures\u00a0: elles sont payées." }
  ] },
  { v: '7.55', items: [
    { emoji: 'chrono', titre: 'Rouvrir la session ne tue plus la mesure en cours',
      desc: "Fermer puis rouvrir la session pendant une mesure — ou revenir dans l’appli après une mise en veille — "
        + "arrêtait la parcelle en cours et l’«\u00a0écartait\u00a0» (<b>chrono lancé en retard</b>). C’est fini\u00a0: seule "
        + "une mesure oubliée — ouverte plus de 12 heures, ou bien au-delà du barème — se ferme toute seule." },
    { emoji: 'tracteur', titre: 'Une parcelle se reprend\u00a0: le temps s’ajoute',
      desc: "Chrono allumé, toucher une parcelle déjà faite propose <b>Reprendre la mesure</b>\u00a0: le temps de la "
        + "nouvelle fois s’ajoute à celui d’avant, et le tout est jugé ensemble contre le barème. Une grande parcelle "
        + "faite en plusieurs fois n’est plus écartée morceau par morceau." },
    { emoji: 'pause', titre: 'La pause garde le temps déjà passé',
      desc: "Interrompre une parcelle pour déjeuner faisait repartir sa mesure de zéro à la reprise\u00a0: le temps du "
        + "matin était perdu. Il est maintenant compté. Une fin de journée pendant la pause écrit la parcelle, arrêtée "
        + "à l’heure de l’interruption." },
    { emoji: 'check', titre: 'Un historique pour tout retrouver',
      desc: "En bas de chaque session, l’administrateur voit l’<b>historique des gestes</b> des trois derniers jours — "
        + "début, fin, reprise, pause, décoche — et <b>Rétablir</b> remet une parcelle décochée par erreur telle "
        + "qu’elle était." },
    { emoji: 'alerte', titre: 'Et d’autres défauts des sessions',
      desc: "Une session ne se dit plus terminée à 99,6\u00a0% ; la regarder ne la rouvre plus ; ouvrir une autre session "
        + "n’efface plus le chrono en cours, et en commencer une ferme celui resté ouvert ailleurs ; «\u00a0Modifier\u00a0» "
        + "ne change plus 0\u00a0% en 100\u00a0%." }
  ] },
  { v: '7.54', items: [
    { emoji: 'calendrier', titre: 'Les dimanches et fériés d’avant septembre comptent enfin en repos',
      desc: "Avant septembre 2026, en mode «\u00a0payé\u00a0», la majoration d’un dimanche ou d’un férié travaillé partait "
        + "«\u00a0à la paie\u00a0»… que Ma Vigne n’éditait pas\u00a0: elle n’allait nulle part. Elle est maintenant lue au planning "
        + "de chacun, jour par jour, et <b>entre au compteur en repos</b> le mois où le jour a été travaillé\u00a0: "
        + "<b>+50\u00a0% le dimanche</b>, +100\u00a0% le férié (réglables dans Planning › Le cadre). Un dimanche de 8\u00a0h "
        + "ajoute 4\u00a0h de repos. Depuis septembre, rien ne change\u00a0: payé → paie, récup → compteur." },
    { emoji: 'liste', titre: 'Une colonne «\u00a0Dim. et fériés\u00a0», mois par mois',
      desc: "Dans le tableau «\u00a0Écart au planning · mois par mois\u00a0» de chaque salarié, une colonne donne les heures "
        + "faites le dimanche et les jours fériés\u00a0; la colonne «\u00a0Majoration\u00a0» dit ce qu’elles ajoutent. Et le "
        + "relevé, comme l’onglet Compteur, ont un tableau <b>«\u00a0Dimanches et jours fériés travaillés avant septembre\u00a0»</b>\u00a0: "
        + "le mois, les heures, le repos ajouté, le total." }
  ] },
  { v: '7.53', items: [
    { emoji: 'tracteur', titre: 'Faire défiler ne coche plus une parcelle',
      desc: "Dans une session tracteur, faire défiler la liste pouvait cocher la parcelle qui se trouvait sous le doigt au "
        + "moment de le lever — chrono allumé, cela fermait même la mesure en cours. Désormais <b>seule compte une parcelle "
        + "touchée doigt immobile</b>. Toucher l’écran pour arrêter une liste qui défile encore ne coche rien non plus." },
    { emoji: 'chrono', titre: 'Deux appuis coup sur coup n’en font qu’un',
      desc: "Après un appui, la liste se réordonne\u00a0: un deuxième appui trop rapproché tombait sur la parcelle qui venait "
        + "de glisser sous le doigt. Il est ignoré pendant une demi-seconde. Un doigt qui tremble un peu, cahoté dans la "
        + "cabine, compte toujours comme un appui." },
    { emoji: 'check', titre: 'Décocher demande une confirmation',
      desc: "Dans «\u00a0Voir toutes\u00a0», un appui de travers sur une parcelle déjà faite la décochait sans rien dire, et "
        + "effaçait le temps mesuré ou la valeur saisie dessus. L’application demande maintenant de confirmer. Cocher, "
        + "lui, reste d’un seul geste." }
  ] },
  { v: '7.52', items: [
    { emoji: 'barrique', titre: 'Des fûts «\u00a0pas pleins\u00a0» alors qu’ils le sont\u00a0: dites-le',
      desc: "Dans Le Chai, la feuille «\u00a0Compléter le fût\u00a0» a une nouvelle sortie\u00a0: <b>«\u00a0Mes fûts sont pleins — "
        + "corriger ce qui manque\u00a0»</b>. Utile quand des fûts comptés en trop ont été retirés\u00a0: leur vide restait "
        + "sur les vrais fûts, qui «\u00a0attendaient\u00a0» presque tout le vin, et la cuve décuvée ne pouvait plus servir "
        + "à les compléter. Mettez 0 si tout est plein. C’est une correction\u00a0: rien ne part au registre." },
    { emoji: 'barrique', titre: 'Un fût enlevé de la fiche retourne dans La Réserve',
      desc: "Dans «\u00a0Modifier la cuvée\u00a0», enlever une ligne de fûts enlève aussi le vide qu’elle portait, et les "
        + "fûts <b>retournent dans La Réserve</b> s’ils en venaient. Avant, ils disparaissaient du parc\u00a0: ceux qui "
        + "ont été perdus ainsi se remettent à la main dans leur lot." },
    { emoji: 'cuve', titre: 'Décuver\u00a0: les fûts que vous choisissez restent les vôtres',
      desc: "Les fûts ajoutés avec «\u00a0+\u00a0» <b>remplacent</b> ceux que l’application avait proposés en trop, au lieu "
        + "de s’y ajouter — les fûts proposés, rangés en bas de la liste, ne se voyaient pas. Et taper ou corriger le "
        + "volume après avoir choisi ses fûts ne défait plus le choix\u00a0: seuls les fûts proposés se recomptent." }
  ] },
  { v: '7.51', items: [
    { emoji: 'carte', titre: 'Sur les cartes, un anneau montre où vous en êtes',
      desc: "Un <b>anneau doré respire doucement</b> autour de la parcelle <b>commencée et pas finie</b> — celle où «\u00a0Début\u00a0» "
        + "a été touché sans validation. S’il n’y en a aucune, il se pose sur la <b>prochaine à faire</b>\u00a0: le n°\u00a01 de la "
        + "tournée enregistrée dans Pilotage\u00a0› Décider. Sur Parcelles il suit le travail affiché (sur «\u00a0toutes\u00a0», la "
        + "priorité du moment), sur la carte du domaine la priorité du moment, sur la carte de la tournée les travaux cochés. "
        + "Plusieurs parcelles commencées\u00a0? Chacune a son anneau. Rien quand vous consultez une période archivée." },
    { emoji: 'route', titre: 'La tournée part bien de la dernière parcelle faite',
      desc: "Quand plusieurs parcelles avaient été validées le même jour, le départ «\u00a0dernière faite\u00a0» de la tournée était "
        + "en réalité la <b>première</b> de la journée\u00a0: l’ordre proposé repartait du matin. Le même défaut se cachait dans "
        + "«\u00a0Qui fait quoi\u00a0» quand aucune tournée n’est enregistrée. C’est corrigé, et une validation annulée n’est plus "
        + "prise pour un départ." }
  ] },
  { v: '7.49', items: [
    { emoji: 'cible', titre: 'Décider part du planning\u00a0: rien à régler pour commencer',
      desc: "Dans Pilotage › Décider, la tournée du jour se remplit toute seule\u00a0: le travail en priorité, le prochain jour \
travaillé, l’équipe affectée à la priorité et <b>présente ce jour-là</b> (congés et récup retirés), ses heures et sa \
coupure au planning. Chaque case dit d’où vient sa valeur. En toucher une passe l’écran en simulation\u00a0; \
«\u00a0Valeurs réelles\u00a0» revient au planning." },
    { emoji: 'route', titre: 'Les trajets entre les vignes sont calculés',
      desc: "Plus de minutes «\u00a0par saut\u00a0» à deviner\u00a0: le temps de trajet se calcule entre chaque parcelle et la \
suivante — à pied jusqu’à 300\u00a0m, au-delà en camion. La règle se règle dans la case Trajets." },
    { emoji: 'calendrier', titre: 'La fin tombe au bon jour',
      desc: "La date de fin se calcule jour par jour, avec l’équipe réelle de chaque jour\u00a0: un congé lundi, un retour \
mardi, une fin de contrat comptent. La liste est rangée par jour. Quand ça déborde de la fenêtre, l’écran dit combien \
de personnes il faudrait en plus, et un bouton l’essaie." },
    { emoji: 'carte', titre: 'Sur téléphone, la carte laisse défiler la page',
      desc: "Faire glisser le doigt sur la carte de la tournée fait défiler la page\u00a0; deux doigts la déplacent. \
«\u00a0Agrandir\u00a0» l’ouvre en plein écran. Les quatre réglages tiennent maintenant dans l’écran." },
    { emoji: 'equipe', titre: '«\u00a0Qui fait quoi\u00a0» remplace «\u00a0Et si\u00a0»',
      desc: "La répartition part de l’affectation de la priorité, avec le même calcul que la tournée\u00a0: les deux cartes \
donnent la même date. + et − déplacent une personne, la date de fin de chaque travail suit." }
  ] },
  { v: '7.48', items: [
    { emoji: 'balance', titre: 'Les heures sup d’avant septembre prennent leur majoration en récup',
      desc: "Des heures sup faites avant septembre 2026 et <b>encore au compteur</b> valaient 1\u00a0h pour 1\u00a0h en récup, "
        + "alors que les mêmes heures, payées, étaient majorées. Depuis le 1er septembre, elles valent comme les autres\u00a0: "
        + "<b>1\u00a0h\u00a015 pour une heure à 25\u00a0%, 1\u00a0h\u00a030 pour une heure à 50\u00a0%</b>. La récup restante de "
        + "chacun monte d’autant, une fois, en septembre — la ligne «\u00a0Majoration des heures sup d’avant septembre\u00a0» "
        + "le montre. Rien ne change de janvier à août, ni dans les paies déjà faites. Un dimanche déjà majoré à part et le "
        + "report d’avant Ma Vigne restent à 1\u00a0h pour 1\u00a0h." },
    { emoji: 'document', titre: 'Le détail de l’année dit la règle des mois d’avant',
      desc: "Sous le tableau, la légende annonçait «\u00a0majoration comprise\u00a0» au-dessus d’un mois d’août à 27\u00a0h pour "
        + "27\u00a0h. Les mois d’avant septembre portent maintenant un <b>astérisque</b>, et la légende dit qu’ils comptaient "
        + "1\u00a0h pour 1\u00a0h, et combien de majoration est entrée en septembre." }
  ] },
  { v: '7.47', items: [
    { emoji: 'document', titre: 'Pour la compta : trois totaux d’heures sup, et plus de phrase à déchiffrer',
      desc: "Sur la fiche et sur le relevé, «\u00a0Heures sup à payer\u00a0» tient maintenant en <b>trois cases, toujours les mêmes</b>\u00a0: "
        + "à +25\u00a0%, à +50\u00a0%, dimanches et jours fériés. Chaque case donne son total et d’où viennent ses heures "
        + "(«\u00a012h du mois + 11h d’avant\u00a0»). La ligne «\u00a0heures sup d’avant septembre (estimées…)\u00a0» disparaît\u00a0: ces "
        + "heures sont comptées dans la case de leur taux. Ce qui n’a pas de taux connu — un report d’avant Ma Vigne — "
        + "reste sur sa ligne, «\u00a0taux à vérifier\u00a0»." },
    { emoji: 'valide', titre: '«\u00a0Aucune retenue\u00a0», en toutes lettres',
      desc: "Quand il n’y a rien à retirer du salaire, le cadre écrivait «\u00a0Maintenu\u00a0». Il écrit maintenant "
        + "<b>Aucune retenue</b>, et dessous\u00a0: le salaire de base se paie en entier. Avec une retenue, il dit combien "
        + "d’heures sont à retirer du salaire de base, et pourquoi." },
    { emoji: 'soleil', titre: 'Les dimanches d’avant septembre, dits clairement',
      desc: "«\u00a0Un dimanche ou un férié, déjà majorées\u00a0» ne se comprenait pas. Ces heures sup faites un dimanche avant "
        + "septembre 2026 ont déjà reçu leur majoration à l’époque, en récup\u00a0: elles se paient donc <b>sans "
        + "majoration</b>, et la feuille l’écrit ainsi — dans la case des dimanches, et dans les heures restantes." }
  ] },
  { v: '7.46', items: [
    { emoji: 'balance', titre: 'Le taux le plus fort sort toujours en premier',
      desc: "Après une absence ou un paiement, il pouvait rester <b>plus d’heures sup à 50\u00a0% qu’à 25\u00a0%</b>\u00a0: les "
        + "heures à 25\u00a0% partaient en premier. Désormais, tout ce qui sort du compteur — une absence, des heures à "
        + "rattraper, une récup, <b>un paiement</b> — prend les heures à 50\u00a0% d’abord. Rien ne change en valeur\u00a0: 1\u00a0h "
        + "d’absence retire toujours 1\u00a0h de récup. Pour une même valeur, on paie donc un peu moins d’heures, à un "
        + "taux plus fort. L’estimation des heures d’avant septembre suit la même règle." },
    { emoji: 'soleil', titre: 'Jamais une retenue à côté d’une majoration du dimanche',
      desc: "Quand le domaine <b>paie</b> ses heures sup, un dimanche ou un jour férié travaillé hors heures sup donnait une "
        + "majoration à payer même si le salarié avait une retenue sur salaire le même mois. La majoration <b>couvre "
        + "maintenant d’abord les absences</b>, comme les heures sup\u00a0: seul ce qu’il en reste se paie. Une feuille porte "
        + "une retenue ou quelque chose à payer, jamais les deux." },
    { emoji: 'document', titre: 'Le détail de l’année se lit enfin',
      desc: "Sur le relevé et dans l’onglet Compteur, 7\u00a0h d’absence s’écrivaient «\u00a05h36\u00a0», et la colonne "
        + "«\u00a0en repos\u00a0» ne disait pas ce qu’elle comptait. Le tableau donne maintenant, mois par mois\u00a0: heures sup "
        + "faites, heures sup payées, <b>récup gagnée</b>, <b>récup prise</b>, <b>absences reprises</b>, <b>récup restante</b> "
        + "et <b>heures à rattraper</b>. Chaque ligne tombe juste." },
    { emoji: 'crayon', titre: 'Un relevé aux phrases plus nettes',
      desc: "Finis «\u00a0Congé payé payée\u00a0», «\u00a0Récup payée\u00a0» et «\u00a0Les heures sup de octobre\u00a0». Une absence reprise "
        + "s’appelle partout <b>reprise sur la récup</b>. La ligne de semaine dit qu’une heure en plus qui rattrape une "
        + "absence de la même semaine <b>n’est pas une heure sup</b>\u00a0: elle compte heure pour heure, sans majoration." }
  ] },
  { v: '7.45', items: [
    { emoji: 'cloche', titre: 'Une notification quand une mise à jour est prête',
      desc: "Un déploiement ne recharge plus l'application pendant que vous l'utilisez. Si les notifications "
        + "sont activées (Réglages), un message prévient dès qu'une mise à jour est installée et prête\u00a0: "
        + "fermez et rouvrez l'application pour en profiter. Sans notifications activées, elle s'applique en "
        + "silence, à la prochaine fermeture." }
  ] },
  { v: '7.44', items: [
    { emoji: 'document', titre: 'La fiche et le relevé commencent par « Pour la compta »',
      desc: "Une ligne par chose que la compta saisit, toujours dans le même ordre\u00a0: salaire de base (retenue de tant d’heures, "
        + "ou maintenu), heures sup à payer par taux, congés payés, arrêt de travail, acompte. Le chiffre est en gros, «\u00a0aucun\u00a0» "
        + "en gris, le pourquoi en petit dessous. La récup restante et les heures à rattraper passent dessous, plus discrètes, et "
        + "la ligne du mois s’additionne enfin\u00a0: prévues = faites + absences − heures faites en plus." },
    { emoji: 'euro', titre: 'Une demande de paiement ne fond plus',
      desc: "Le nombre d’heures demandé est un total. Si les heures sup du mois baissent ensuite — une absence rattrapée dans "
        + "sa semaine, par exemple —, le reste se prend au compteur au lieu de disparaître sans un mot. Les demandes déjà "
        + "saisies se relisent ainsi\u00a0; un mois figé garde ce qui est parti à la compta." },
    { emoji: 'equipe', titre: 'Dans la semaine, le salarié passe d’abord',
      desc: "Les heures en plus d’une semaine rattrapent d’abord les absences du salarié, puis les journées écourtées par le "
        + "domaine. Avant, un lundi écourté par le domaine passait devant une absence du mardi\u00a0: le salarié se voyait "
        + "retenir des heures pendant que celles du domaine étaient rattrapées. Une heure du domaine ne fait plus jamais "
        + "retenir une absence\u00a0: elle va aux heures à rattraper." },
    { emoji: 'imprimante', titre: 'Le relevé tient sur deux pages, et dit ce qui a été récupéré',
      desc: "Le détail mois par mois sépare la récup prise des absences reprises\u00a0: une absence couverte par le compteur ne "
        + "s’écrit plus «\u00a0récupérée\u00a0». La page 2 va à l’essentiel — «\u00a0À savoir\u00a0» en quatre points, plus de taux "
        + "à 0h — et ne déborde plus sur une troisième page." }
  ] },
  { v: '7.43', items: [
    { emoji: 'barrique', titre: 'Un fût pas plein se complète depuis Le Chai',
      desc: "Quand le volume entonné mesuré est plus petit que les fûts, la carte de la cuvée le dit\u00a0: «\u00a01 fût entamé, il "
        + "attend 30\u00a0L\u00a0». Touchez-le pour le compléter avec le vin d’une autre cuve — même pas encore décuvée — ou d’une "
        + "cuvée du Chai. La composition est gardée (d’où, combien, quelle appellation, quel millésime), le journal et le "
        + "registre aussi\u00a0; supprimer la ligne défait tout." },
    { emoji: 'balance', titre: 'Le Chai compte le vin réel',
      desc: "Un fût entamé ne compte plus plein\u00a0: volume de la cuvée, bouteilles théoriques, millésime et bilan de campagne "
        + "suivent. Le vin prélevé dans une cuve du Cuvier sort de ce qu’elle contient, mais reste dans le rendement de ses "
        + "parcelles\u00a0: ses raisins l’ont produit." },
    { emoji: 'bouteille', titre: 'Le kg/hL de chaque étape',
      desc: "Sur la chaîne De la récolte à la bouteille, sous chaque étape\u00a0: en cuve, votre règle\u00a0; entonné, ce que le "
        + "pressoir a vraiment donné\u00a0; en bouteilles, ce qui est arrivé au bout. De quoi caler la règle du Cuvier. Et les "
        + "barres ne disparaissent plus quand on vient de l’onglet Bouteilles." }
  ] },
  { v: '7.42', items: [
    { emoji: 'bouteille', titre: 'La chaîne « De la récolte à la bouteille » suit le vin',
      desc: "En cuve, ce sont les hectolitres estimés d’après vos caisses, à la règle du Cuvier — plus la contenance de la "
        + "cuve. Entonné, c’est le volume décuvé que vous avez mesuré — plus la taille du fût. Tant qu’il n’est pas saisi, "
        + "l’étape reste en pointillé et la carte propose <b>Saisir le volume entonné</b>." },
    { emoji: 'balance', titre: 'Chaptalisation, soufre et intrants : calculés sur ce que la cuve contient',
      desc: "Avant le décuvage, le volume proposé était la contenance de la cuve\u00a0: kilos de sucre, grammes de SO<sub>2</sub> "
        + "et doses d’intrants sortaient trop hauts dès qu’une cuve n’était pas pleine — y compris dans l’intervention "
        + "groupée, sans case pour corriger. C’est maintenant le volume estimé d’après les caisses, saignées déduites. Le "
        + "SO<sub>2</sub> du Cuvier a sa case de volume, et le registre des manipulations recalcule les grammes déjà saisis. "
        + "Les chaptalisations déjà enregistrées gardent leurs kilos\u00a0: relisez celles de cette vendange." },
    { emoji: 'cuve', titre: 'Contenance et contenu ne se confondent plus',
      desc: "La liste des cuves décuvées dit le volume parti au Chai, le rattachement d’une récolte dit ce qui est déjà dans "
        + "la cuve, et le cahier de cuverie imprime la contenance et le volume, chacun sous son nom. Une saignée retire son "
        + "volume de ce que contient la cuve, plus de sa contenance." }
  ] },
  { v: '7.41', items: [
    { emoji: 'check', titre: 'Figer le mois à l’envoi à la compta',
      desc: "Dans la fiche d’un salarié, la carte <b>Envoi à la compta</b> a un bouton <b>Figer</b>\u00a0: ce qui est payé et "
        + "retenu ne bouge plus. Ce qui change ensuite dans le mois — une absence, des heures en plus, un motif corrigé — passe "
        + "sur le mois suivant\u00a0: à retenir (repris d’abord sur la récup et les heures sup), à rendre, ou une majoration à "
        + "payer. Le relevé porte la date d’envoi\u00a0; «\u00a0Défiger\u00a0» rouvre le mois." }
  ] },
  { v: '7.40', items: [
    { emoji: 'balance', titre: 'Une retenue ou des heures sup à payer, jamais les deux',
      desc: "Le relevé pouvait payer des heures sup et retenir des heures d’absence sur la même feuille. Les absences passent "
        + "maintenant d’abord\u00a0: celles du salarié (injustifiée, personnelle, retard) se rattrapent dans la semaine, puis sur la "
        + "récup et les heures sup du mois\u00a0; seul ce qui reste est <b>retenu sur le salaire</b>. On ne paie que les heures sup qui "
        + "restent une fois les absences couvertes." },
    { emoji: 'pluie', titre: 'Les absences du domaine se rattrapent, sans retenue',
      desc: "Une absence ou une journée écourtée par le domaine se reprend d’abord sur la récup\u00a0; ce qui manque va au "
        + "<b>compteur des heures à rattraper</b>, affiché sur le relevé à côté de la récup restante, et les prochaines heures sup "
        + "le comblent. Jamais de retenue." },
    { emoji: 'calendrier', titre: 'Le relevé compte tout le mois',
      desc: "Envoyé à la compta la dernière semaine, le relevé compte les jours à venir aux heures du planning\u00a0: il n’est "
        + "plus provisoire et se signe. Une ligne dit à partir de quel jour les heures viennent du planning." },
    { emoji: 'croix', titre: 'Plus d’absence «\u00a0sans motif\u00a0»',
      desc: "Depuis septembre 2026, une absence sans motif compte comme une absence injustifiée\u00a0: plus rien n’est «\u00a0à "
        + "préciser\u00a0». Une journée écourtée sans motif reste comptée comme écourtée par le domaine." },
    { emoji: 'check', titre: 'Le lundi 31 août ne sert plus deux fois',
      desc: "Ses heures en plus, déjà comptées en août, rattrapaient encore une absence du 1er septembre." }
  ] },
  { v: '7.39', items: [
    { emoji: 'verre', titre: 'Une cuvée remise en élevage reprend ses fûts',
      desc: "Passée par erreur à «\u00a0Embouteillée\u00a0» puis remise «\u00a0En élevage\u00a0» depuis sa fiche, une cuvée reprend "
        + "ses fûts au parc — sinon ils comptaient deux fois. S’ils n’y sont plus tous, la fiche refuse et dit combien manquent." },
    { emoji: 'barrique', titre: 'L’ouillage à prévoir compte chaque fût à sa contenance',
      desc: "Un demi-muid de 500\u00a0L boit plus qu’une pièce\u00a0: dans l’agenda de la Cave, les litres à prévoir comptent "
        + "chaque fût à sa contenance, d’après vos propres ouillages. Une cuvée toute en pièces ne change pas d’un litre." }
  ] },
  { v: '7.38', items: [
    { emoji: 'cuve', titre: 'Le volume décuvé se saisit',
      desc: "La feuille «\u00a0Décuver\u00a0» a un champ <b>Volume décuvé</b>, goutte et presse. Saisi, c’est lui qui fait le "
        + "rendement des parcelles de la cuve, et les fûts se proposent dessus\u00a0; le bilan se lit au litre («\u00a0le "
        + "dernier fût attend 10\u00a0L\u00a0»). Pour une cuve déjà décuvée\u00a0: «\u00a0Corriger le volume\u00a0», dans son détail." },
    { emoji: 'barrique', titre: 'Chaque lot de fûts a sa contenance',
      desc: "Demi-muid, feuillette, fût de 225\u00a0L\u00a0: la contenance se règle dans le lot de La Réserve, ou en la "
        + "touchant au décuvage. Elle suit le fût au Chai et revient avec lui, et tous les volumes du Chai la lisent. Un fût "
        + "hors format n’est jamais proposé d’office\u00a0: il se choisit." },
    { emoji: 'verre', titre: '«\u00a0Modifier la cuvée\u00a0» garde vos fûts',
      desc: "Réenregistrer une cuvée effaçait le tonnelier et la référence de ses fûts\u00a0: c’est fini. Une cuvée logée "
        + "en cuve ne reçoit plus six fûts d’office, et «\u00a0Embouteillée\u00a0» posé depuis la fiche rend les fûts au parc." }
  ] },
  { v: '7.37', items: [
    { emoji: 'balance', titre: 'Les heures sup d’avant septembre ont un taux estimé',
      desc: "Quand des heures sup d’avant septembre 2026 sont payées ou restent au compteur, la fiche et le relevé ne disent plus "
        + "seulement «\u00a0taux à vérifier\u00a0»\u00a0: ils donnent une <b>estimation</b>, à +25\u00a0% et à +50\u00a0%, en relisant "
        + "chaque semaine avec la règle d’aujourd’hui. Rien ne change au compteur ni aux paies déjà faites\u00a0; la compta confirme." },
    { emoji: 'liste', titre: 'Le report d’avant Ma Vigne reste à part',
      desc: "La ligne «\u00a0Heures reportées, taux à vérifier\u00a0» se sépare en trois\u00a0: les heures sup d’avant septembre, "
        + "estimées\u00a0; la majoration des dimanches et fériés, déjà calculée\u00a0; le report d’avant Ma Vigne, toujours à vérifier." }
  ] },
  { v: '7.36', items: [
    { emoji: 'equipe', titre: 'Deux appareils, les deux saisies gardées',
      desc: "Ce que vous enregistrez n’efface plus ce qu’un autre appareil a saisi entre-temps. Le journal, le tracteur, le "
        + "phyto, la cave, le planning, les réglages\u00a0: tout est désormais <b>fusionné</b>, comme les parcelles l’étaient déjà. "
        + "Une ligne supprimée d’un côté et modifiée de l’autre est gardée\u00a0: rien ne disparaît en silence." },
    { emoji: 'horsligne', titre: 'Au retour du réseau, rien n’est écrasé',
      desc: "Les saisies faites hors réseau se fusionnent avec ce que les autres ont enregistré pendant ce temps, au lieu de "
        + "le remplacer. Quand une sauvegarde reprend des saisies d’un autre appareil, le badge le dit\u00a0: «\u00a0fusionné avec "
        + "un autre appareil\u00a0»." }
  ] },
  { v: '7.35', items: [
    { emoji: 'rotation', titre: 'Au retour dans l’application, les saisies des autres arrivent',
      desc: "Quand vous revenez dans l’application après une mise en veille, elle vérifie qu’elle joint encore le serveur, "
        + "relance la connexion si besoin et récupère ce que les autres ont enregistré entre-temps — la Cave comprise. "
        + "Si le serveur ne répond plus, elle ne prétend plus que tout est à jour." },
    { emoji: 'horsligne', titre: 'Le voyant dit «\u00a0Pas de synchro\u00a0» quand le serveur ne répond pas',
      desc: "Avec du réseau mais sans serveur, le voyant en haut de l’écran passe à l’orange avec «\u00a0Pas de synchro\u00a0»\u00a0: "
        + "le téléphone ne reçoit plus ce que les autres saisissent. Touchez-le, puis «\u00a0Relancer l’application\u00a0» pour "
        + "rétablir la connexion. Vos saisies restent enregistrées sur l’appareil." },
    { emoji: 'cle', titre: 'L’écran de connexion ne reste plus vide',
      desc: "Si le serveur tarde à répondre, les profils enregistrés sur le téléphone s’affichent au bout de quelques secondes, "
        + "et «\u00a0Relancer l’application\u00a0» est proposé quand la connexion échoue alors qu’il y a du réseau. Avant, "
        + "l’écran pouvait rester sur le logo, sans aucun profil." }
  ] },
  { v: '7.34', items: [
    { emoji: 'personne', titre: 'La fiche du salarié dit la même chose que le relevé',
      desc: "Le cadre «\u00a0Pour la paie\u00a0» affiche les <b>absences par cause</b> — payées, par le domaine, du salarié, à "
        + "préciser — et additionne les heures sup semaine par semaine. Tant que le mois n’est pas fini, il dit "
        + "«\u00a0à ce jour\u00a0»\u00a0: les jours à venir ne comptent plus comme faits." },
    { emoji: 'calendrier', titre: 'L’onglet Jours se lit à la semaine',
      desc: "Du lundi au dimanche, avec en gris le lundi du mois d’avant quand la semaine commence avant le 1er. La "
        + "colonne «\u00a0Heures sup\u00a0» remplace l’écart du jour, chaque absence dit <b>ce qu’elle devient</b>, et des "
        + "étiquettes préviennent\u00a0: plus de 10\u00a0h dans la journée, sept jours travaillés. La note du bas parlait "
        + "encore de la 43e heure\u00a0: corrigée." },
    { emoji: 'balance', titre: 'Compteur\u00a0: du solde d’avant au solde d’après',
      desc: "Le temps de récup se lit ligne par ligne, du solde du mois d’avant au solde de fin de mois. Une nouvelle "
        + "carte, <b>Heures à rattraper</b>, suit les journées écourtées par le domaine\u00a0: ce que la semaine et le "
        + "compteur ont rattrapé, ce qui reste. L’année a son total depuis janvier, et les mois à venir restent vides." }
  ] },
  { v: '7.33', items: [
    { emoji: 'document', titre: 'Le relevé d’heures est refait',
      desc: "Chaque absence dit maintenant <b>sa cause et ce qu’elle devient</b>\u00a0: payée, rattrapée dans la semaine, reprise "
        + "sur la récup, à rattraper, non payée. Une absence injustifiée ne s’appelle plus «\u00a0Récup\u00a0». La semaine se lit en "
        + "entier, avec en gris le lundi du mois d’avant quand elle commence avant le 1er. Page\u00a02, le compteur de récup "
        + "part du solde du mois d’avant et <b>tombe juste</b>, et un nouveau bloc suit les <b>heures à rattraper</b>." },
    { emoji: 'calendrier', titre: 'Un relevé édité en cours de mois est provisoire',
      desc: "Le relevé imprimait «\u00a0faits\u00a0» les jours à venir et les additionnait. Édité avant la fin du mois, il est "
        + "maintenant marqué <b>provisoire</b>\u00a0: les jours à venir ne comptent pas, et il ne se signe pas." },
    { emoji: 'alerte', titre: 'Ce que le relevé signale',
      desc: "Une absence <b>sans motif</b> est marquée «\u00a0à préciser\u00a0» avant l’envoi à la compta. Le relevé signale aussi "
        + "une journée de plus de 10\u00a0h, une semaine sans jour de repos, et le droit à repos ouvert dès 7\u00a0h de récup. "
        + "Les congés n’affichent plus de reste négatif quand le solde de départ n’est pas saisi." }
  ] },
  { v: '7.32', items: [
    { emoji: 'balance', titre: 'Les heures sup se comptent à la semaine',
      desc: "À partir de septembre 2026, les heures sup ne se comptent plus jour par jour mais <b>à la semaine</b>, du lundi "
        + "au dimanche\u00a0: ce qui est fait au-delà du planning de la semaine. Les heures en plus <b>rattrapent d’abord</b> "
        + "les heures manquées de la même semaine — journée écourtée par le domaine, absence — et seul le reste part au "
        + "compteur. Une semaine appartient au <b>mois où elle finit</b>\u00a0: celle du 28 septembre se compte en octobre." },
    { emoji: 'liste', titre: '25\u00a0% d’abord, 50\u00a0% ensuite',
      desc: "Les <b>huit premières</b> heures sup de la semaine sont à 25\u00a0%, les suivantes à 50\u00a0%. Avant, le 50\u00a0% "
        + "partait de la 44e heure travaillée\u00a0: sur une semaine au planning de 40\u00a0h, on pouvait lire moins d’heures à "
        + "25\u00a0% qu’à 50\u00a0%. Sur un planning de 35\u00a0h, rien ne change." },
    { emoji: 'reveil', titre: 'Un jour sans saisie vaut les heures du planning',
      desc: "Un jour que personne n’a touché s’imprimait parfois «\u00a0prévu 8\u00a0h, fait 8\u00a0h\u00a030\u00a0»\u00a0: l’horaire "
        + "affiché ne faisait pas les heures du modèle. Le jour vaut maintenant les heures du modèle, et l’horaire prévu "
        + "se cale dessus. Les mois d’avant septembre ne changent pas." }
  ] },
  { v: '7.31', items: [
    { emoji: 'liste', titre: 'Le détail mois par mois se lit en heures sup',
      desc: "Dans l’onglet Compteur de la fiche et sur le relevé, le tableau de l’année donne désormais, pour chaque mois : "
        + "les <b>heures sup du mois</b>, les <b>payées</b>, les <b>récupérées</b> et le <b>solde restant</b>. Tout est "
        + "compté en heures sup, comme la paie : chaque ligne fait « solde d’avant + heures sup − payées − récupérées », "
        + "et le solde du mois en cours est celui des heures sup restantes à payer. Une récup retire les heures sup "
        + "qu’elle consomme, à leur taux." }
  ] },
  { v: '7.30', items: [
    { emoji: 'euro', titre: 'Payer aussi les heures sup gardées au compteur',
      desc: "La case « demande à être payé » ne s’arrête plus aux heures sup du mois : on peut inscrire sur la paie du "
        + "mois en cours <b>tout ce que le compteur contient encore</b>. Les heures du mois se paient d’abord, puis on "
        + "puise dans le compteur, les plus anciennes en premier. Un nouveau raccourci, <b>Tout le compteur</b>, "
        + "propose le maximum. Les heures reportées d’avant septembre 2026 apparaissent à part, <b>taux à vérifier</b> : "
        + "le compteur ne sait pas à quel taux elles ont été faites." }
  ] },
  { v: '7.29', items: [
    { emoji: 'euro', titre: 'Un nombre d’heures par taux, et ce qu’il reste à payer',
      desc: "Quand un salarié demande à être payé, le cadre <b>Pour la paie</b> donne toujours quatre lignes : heures sup "
        + "à +25 %, à +50 %, heures du dimanche et heures de jour férié, même à zéro. Les heures prises sur le compteur "
        + "rejoignent la ligne de leur taux. L’onglet <b>Compteur</b> ajoute <b>les heures sup restantes à payer</b>, taux "
        + "par taux, avec le décompte (reportées + faites − payées − prises en récup) et leur équivalent en récup : "
        + "ce sont les mêmes heures, comptées une fois en repos, une fois en heures brutes. Le relevé les reprend." }
  ] },
  { v: '7.28', items: [
    { emoji: 'document', titre: 'Le relevé du mois suit la fiche',
      desc: "À partir de septembre 2026, le relevé d’un salarié tient sur deux pages A4. Page 1 : le cadre "
        + "<b>Pour la paie</b> en tête, puis chaque jour avec trois colonnes surlignées, <b>Prévu</b>, <b>Fait</b> et "
        + "<b>Absence payée</b>, le total de chaque semaine et celui du mois. Page 2 : où vont les heures sup et la "
        + "demande du salarié, le temps de récup, le détail mois par mois, les contrats, les congés, le compteur "
        + "d’heures, les acomptes, et trois signatures, dont la date d’envoi à la compta. Les mois d’avant "
        + "septembre gardent leur relevé." }
  ] },
  { v: '7.27', items: [
    { emoji: 'liste', titre: 'La fiche d’un salarié se lit comme une paie',
      desc: "Quatre onglets : <b>Résumé</b>, <b>Jours</b>, <b>Compteur</b>, <b>Congés et acomptes</b>, et le mois se change "
        + "sans fermer la fiche. Le Résumé commence par le cadre <b>Pour la paie</b> : le salaire de base (heures prévues, "
        + "faites et absences payées), ce qui est à payer en plus, ce qui est à retirer, et ce qui est pour information. "
        + "Comme en paie, un congé payé ou une récup ne se lit jamais comme des heures manquées." },
    { emoji: 'euro', titre: 'Un salarié peut demander à être payé de ses heures sup',
      desc: "Dans le Résumé, la case <b>« demande à être payé »</b> et le nombre d’heures, avec trois raccourcis : aucune, "
        + "sans toucher la récup déjà prise, tout le mois. Les heures payées se prennent d’abord sur celles à 25 %, "
        + "sortent de la récup et s’inscrivent aussitôt dans le cadre. La case existe quel que soit le mode du domaine." },
    { emoji: 'calendrier', titre: 'Chaque jour du mois, prévu et fait côte à côte',
      desc: "L’onglet <b>Jours</b> montre tous les jours, pas seulement les jours modifiés : l’horaire prévu, l’horaire fait, "
        + "les absences payées et l’écart. Chaque semaine dit ses heures sup par taux et prévient au-delà des 48 h." }
  ] },
  { v: '7.26', items: [
    { emoji: 'balance', titre: 'Pour la compta : l’heure et son taux, jamais 1h15',
      desc: "Dans la fiche d’un salarié, onglet Compteur, et sur son relevé, la carte <b>Pour la compta</b> donne "
        + "pour chaque taux trois chiffres\u00a0: le <b>temps en récup</b>, les <b>heures à déclarer</b> et le <b>taux à "
        + "appliquer</b>. Une heure sup à 25\u00a0% vaut 1\u00a0h\u00a015 de repos, mais la compta, qui majore elle-même, "
        + "reçoit <b>1\u00a0h à +25\u00a0%</b>\u00a0: lui déclarer 1\u00a0h\u00a015, ce serait majorer deux fois. Une heure sup "
        + "un dimanche ou un jour férié garde le taux le plus fort, sur une seule ligne." },
    { emoji: 'chrono', titre: 'Le compteur compte en temps de récup, même quand les heures se paient',
      desc: "Chaque heure garde son taux au compteur. Payer des heures en puisant dans le compteur retire ce "
        + "qu’elles valent (2\u00a0h à 25\u00a0% = 2\u00a0h\u00a030 de récup) et les déclare en heures brutes, avec leur "
        + "taux. Les heures payées dans le mois se déclarent de la même façon, et seules celles qui restent "
        + "entrent au compteur." }
  ] },
  { v: '7.25', items: [
    { emoji: 'calendrier', titre: 'Une absence peut ne couvrir qu’une partie de la journée',
      desc: "Resté chez lui l’après-midi, parti une heure plus tôt, arrivé en retard\u00a0: dans la feuille du jour, "
        + "<b>Absence › Une partie seulement</b> se note de telle heure à telle heure, avec un raccourci pour le matin, "
        + "l’après-midi, un retard ou un départ, puis un <b>motif</b>. Deux motifs arrivent\u00a0: <b>Personnel (autorisé)</b> "
        + "et <b>Décidé par le domaine</b>. L’écran compte les heures manquées, coupure déduite, et dit avant d’enregistrer "
        + "ce qu’elles retirent du compteur." },
    { emoji: 'crayon', titre: 'Un horaire raccourci dit pourquoi',
      desc: "Raccourcir une journée dans «\u00a0Travaillé\u00a0» ne demandait qu’une heure de fin. L’écran demande "
        + "maintenant le <b>motif</b>\u00a0: personnel, injustifié, décidé par le domaine, arrêt de travail. Les horaires "
        + "chaleur et les jours d’échange n’ont pas à le dire\u00a0: c’est le domaine qui les pose." },
    { emoji: 'balance', titre: 'Les heures sup deviennent du temps de récup majoré',
      desc: "À partir de septembre 2026, les heures faites au-delà du planning gardent leur taux\u00a0: <b>25\u00a0%</b> "
        + "jusqu’à la 43e heure de la semaine, <b>50\u00a0%</b> au-delà — soit 1\u00a0h\u00a015 ou 1\u00a0h\u00a030 de récup "
        + "par heure. Une journée écourtée se retire d’abord de ce temps, <b>au taux normal</b>\u00a0: 1\u00a0h manquée, "
        + "1\u00a0h de récup en moins. Ce qui n’est pas couvert est retenu sur la paie, sauf si le domaine a arrêté la "
        + "journée. Arrêt de travail, formation, événement familial et congé sans solde ne retirent rien. L’onglet "
        + "Compteur de la fiche et le relevé montrent tout le calcul. Les mois d’avant septembre ne changent pas." }
  ] },
  { v: '7.24', items: [
    { emoji: 'cuve', titre: 'L’étape « Décuvage » s’appelle « Pressurage », et la cuve reste suivie',
      desc: "Poser une cuve à l’étape «\u00a0Décuvage\u00a0» la sortait du suivi\u00a0: plus de bouton "
        + "«\u00a0Saisir une mesure\u00a0», plus de champ dans la tournée. Or à ce moment-là on presse, "
        + "et le jus peut très bien finir sa fermentation <b>dans une autre cuve</b> avant d’être mis "
        + "en fût. L’étape porte maintenant son vrai nom, <b>Pressurage</b>, et la cuve <b>reste "
        + "réclamée</b>\u00a0: dans la tournée, dans les cuves à mesurer, avec ses relevés sur la même "
        + "courbe. Le bouton «\u00a0Décuver\u00a0» ne change pas\u00a0: c’est toujours lui qui envoie le vin "
        + "au Chai. Une cuve déjà posée à cette étape suit la nouvelle règle d’elle-même, sans rien "
        + "ressaisir." },
    { emoji: 'eprouvette', titre: 'Le badge de l’onglet Cuves compte les mêmes cuves que l’alerte',
      desc: "L’alerte «\u00a0à mesurer\u00a0» de la liste comptait une cuve décuvée qui finit sa "
        + "fermentation au chai\u00a0; le badge de l’onglet et la barre du haut l’oubliaient, et "
        + "annonçaient «\u00a0Fermentations suivies\u00a0» juste au-dessus. Ils lisent désormais la même "
        + "règle, cuves pressurées comprises." }
  ] },
  { v: '7.23', items: [
    { emoji: 'contraste', titre: 'Des pastilles illisibles en mode sombre',
      desc: "Les petites pastilles de couleur — celles qui portent un stade, un statut, un rappel — écrivaient leur texte dans la même teinte que leur fond dès que l'application passait en <b>mode sombre</b>. Sur fond crème le contraste était bon, et personne ne voyait le problème ; sur fond noir il tombait à trois fois moins que ce qu'il faut pour lire confortablement. Quatre familles sont corrigées — terre, bleu, violet et rouge — avec une <b>encre distincte du fond</b>, comme les étiquettes du planning en avaient déjà une. <b>Rien ne change en mode clair</b> : les teintes y sont exactement celles d'avant, au chiffre près." }
  ] },
  { v: '7.22', items: [
    { emoji: 'eprouvette', titre: 'Sur une cuve pas finie, l’avertissement du Chai visait le mauvais geste',
      desc: "Il demandait d’attendre la fin de fermentation «\u00a0avant de sulfiter\u00a0». En rouge de "
        + "garde on entonne justement <b>sans SO2</b> pour enchaîner sur la malo en fût, et le soufre "
        + "ne vient qu’après, une fois la malo finie et vérifiée\u00a0: la phrase nommait un geste que "
        + "personne ne fait à ce moment-là. Le vrai risque, c’est de <b>lancer la malo sur du "
        + "sucre</b>\u00a0— piqûre lactique. L’avertissement du Chai, l’aide de la Cave et la note de "
        + "la version 7.12 nomment maintenant les deux gestes. <b>Aucun calcul, aucun écran n’a "
        + "changé.</b>" }
  ] },
  { v: '7.21', items: [
    { emoji: 'eprouvette', titre: 'La densité se relève encore une fois la cuve décuvée',
      desc: "Une fois le marc sorti, l’application fermait le dossier\u00a0: plus de bouton "
        + "«\u00a0Saisir une mesure\u00a0», plus de champ dans la tournée — et la tournée elle-même "
        + "annonçait «\u00a0aucune cuve en fermentation\u00a0» dès que la dernière cuve était décuvée, "
        + "c’est-à-dire <b>tous les ans, à partir de la fin des vendanges</b>. Le vin, lui, continue "
        + "de se goûter et de se mesurer. Les trois portes sont rouvertes\u00a0: le bouton dans le "
        + "détail de la cuve, les champs dans la tournée sous «\u00a0Toutes\u00a0», et la tournée qui "
        + "s’ouvre désormais <b>sur les cuves décuvées</b> quand plus rien ne fermente. Le relevé "
        + "rejoint la <b>même courbe</b>, jamais une seconde." },
    { emoji: 'cuve', titre: 'Relever ne rouvre rien, et n’est jamais réclamé',
      desc: "Sortir le marc, c’est avoir constaté que la fermentation était finie\u00a0: un chiffre "
        + "saisi après coup ne contredit pas ce que vous avez vu et goûté. Votre cuve <b>reste "
        + "décuvée</b>, son parcours reste clos, et une cuve déclarée finie au décuvage ne revient "
        + "pas dans les cuves à mesurer ni dans les rappels — <b>pouvoir relever n’est pas devoir "
        + "relever</b>. Au Chai, la cuvée née du décuvage affiche le <b>dernier relevé de sa cuve</b>, "
        + "puisque c’est là qu’on décide de sulfiter. Et si la courbe remonte après le décuvage, "
        + "l’écran en donne la raison\u00a0: les relevés portent alors sur la masse assemblée, goutte "
        + "et presse, et <b>le pressurage relargue du sucre</b> — jusqu’ici la seule explication "
        + "proposée était une chaptalisation, qu’il n’y avait pas lieu de chercher." }
  ] },
  { v: '7.20', items: [
    { emoji: 'imprimante', titre: 'Le titre de la feuille de tri ne se lisait pas',
      desc: "Quand vous ouvriez « Trier » avant d’éditer un document — le vignoble, la cave, "
        + "la réserve — le bandeau du haut sortait noir sur noir : le titre était bien là, "
        + "illisible. La ligne d’explication juste en dessous partait en majuscules et se "
        + "coupait au bout d’une ligne. La feuille retrouve son bandeau clair, son titre et "
        + "sa phrase entière, et elle se recolle au bas de l’écran au lieu de flotter." },
    { emoji: 'cuve', titre: 'La tournée du Cuvier : en-tête en vrac et boutons sous la barre',
      desc: "En haut, la date, la jauge d’avancement et les trois filtres se mettaient "
        + "côte à côte sur une seule ligne au lieu de s’empiler. En bas, « Terminer la "
        + "tournée » et le bouton d’intervention groupée passaient <b>derrière la barre de "
        + "navigation</b> : on les voyait à peine, et le bas du bouton ne répondait pas. "
        + "L’en-tête se range de nouveau en trois étages, et la barre se pose au-dessus "
        + "de la navigation." },
    { emoji: 'ajout', titre: 'Le + des boutons d’ajout n’était pas dessiné par la police de l’app',
      desc: "Le signe + de « + Ajouter », « + Nouvelle tâche », « + Nouvelle cuve » et de "
        + "soixante autres boutons était un caractère que <b>ni Cormorant ni Outfit ne "
        + "contiennent</b> : votre appareil le remplaçait par le sien, plus large et mal "
        + "aligné sur le texte — et sur certains écrans il ne s’affichait pas du tout. "
        + "Il est remplacé par le + de la police, celui qui va avec le − des mêmes boutons." }
  ] },
  { v: '7.19', items: [
    { emoji: 'bouclier', titre: 'Votre sauvegarde ne gardait qu’un tiers du domaine',
      desc: "Le fichier proposé sous « Sauvegarde complète » n’en portait pas le tiers : "
        + "il gardait vos parcelles, votre journal, vos sessions tracteur et votre registre "
        + "phyto, et laissait dehors <b>tout le planning</b>, <b>toute la cave</b>, la réserve, "
        + "les machines, les entretiens, les contours de vos parcelles, vos réglages et vos taux "
        + "horaires. Il se construit désormais à partir de la <b>liste des données du domaine "
        + "elle-même</b> : ce qui existe est dedans, et ce qui viendra plus tard y sera aussi, sans "
        + "que personne ait à y penser. Le fichier est lu <b>sur le serveur</b>, pas sur votre "
        + "téléphone, et il écrit à l’intérieur de lui-même ce qu’il contient — s’il manque quelque "
        + "chose, il le dit, au lieu de vous laisser croire que tout y est." },
    { emoji: 'retour', titre: 'Restaurer effaçait l’historique de vos contrats',
      desc: "L’ancienne sauvegarde ne gardait de chaque salarié que son <b>nom, ses rôles et son "
        + "statut</b> — et la restauration réécrivait la fiche avec ça. Elle détruisait donc "
        + "<b>l’historique des contrats</b>, qui porte tous vos coûts de main-d’œuvre datés, ainsi "
        + "que les adresses e-mail et les couleurs de l’équipe. Le geste censé vous sortir "
        + "d’affaire était le seul de l’application capable de faire ce dégât-là. C’est corrigé. "
        + "Et avant d’écrire quoi que ce soit, l’écran <b>compare le fichier à votre domaine "
        + "actuel</b> et vous montre, élément par élément, ce qui sera remplacé, ce qui va "
        + "rétrécir et ce à quoi il ne touchera pas. Vos anciens fichiers de sauvegarde restent "
        + "lisibles : l’écran signale simplement ce qu’ils ne contiennent pas." }
  ] },
  { v: '7.18', items: [
    { emoji: 'raisin', titre: 'Le cadre de votre campagne se r\u00e8gle enfin',
      desc: "L\u2019application datait vos campagnes <b>du 1<sup>er</sup> ao\u00fbt au 31 juillet</b>, sans "
        + "que vous puissiez y toucher. Or une campagne est un <b>cycle de production</b>, et ce qui "
        + "le borne, c\u2019est votre <b>vendange</b>. Sur le cadre d\u2019ao\u00fbt elle tombe dans les premiers "
        + "jours\u00a0: elle <b>ouvre</b> l\u2019ann\u00e9e au lieu de la clore, et la campagne 2025-2026 associait "
        + "la r\u00e9colte de 2025 aux travaux qui feraient le mill\u00e9sime 2026. <b>Le cadre de la campagne "
        + "se r\u00e8gle</b> d\u00e9sormais, dans la roue du Pilotage, juste sous celui de l\u2019exercice "
        + "comptable\u00a0: vos deux ann\u00e9es au m\u00eame endroit. L\u2019\u00e9cran vous dit o\u00f9 tombe <b>votre</b> "
        + "vendange dans le cadre choisi \u2014 elle l\u2019ouvre, elle la cl\u00f4t, ou la borne la coupe en deux "
        + "\u2014 et le mois qu\u2019il propose est celui qui suit la fin de vos vendanges, lu dans vos propres "
        + "dates. Rien ne bouge tant que vous n\u2019y touchez pas, et ce choix ne change ni le "
        + "mill\u00e9sime d\u2019un vin, ni vos p\u00e9riodes de travail." },
    { emoji: 'journal', titre: 'Imprimer tout ce qui a \u00e9t\u00e9 fait sur une ann\u00e9e',
      desc: "Il manquait le document le plus simple\u00a0: la <b>liste</b> des interventions sur une "
        + "ann\u00e9e. Le bilan de campagne la r\u00e9sumait t\u00e2che par t\u00e2che, le fichier Excel du journal "
        + "sortait tout l\u2019historique d\u2019un bloc. Le <b>journal des interventions</b> (Documents \u2039 Suivi "
        + "du domaine) se demande sur la campagne, sur l\u2019exercice comptable ou sur une p\u00e9riode de "
        + "travail, et rend trois sections dat\u00e9es\u00a0: travaux de la vigne, sessions tracteur, "
        + "traitements. Le panneau annonce le nombre d\u2019interventions <b>avant</b> d\u2019imprimer." },
    { emoji: 'eprouvette', titre: 'Le registre phyto imprim\u00e9 sortait toutes vos ann\u00e9es',
      desc: "Le PDF n\u2019\u00e9tait born\u00e9 par <b>aucune date</b>\u00a0: il imprimait la totalit\u00e9 des "
        + "traitements depuis la mise en service, en se titrant \u00ab\u00a0Campagne\u00a0\u00bb suivi du nom de "
        + "votre p\u00e9riode de travail en cours \u2014 et l\u2019attestation \u00e0 signer, en bas, certifiait "
        + "\u00ab\u00a0pour la campagne\u00a0\u00bb ce m\u00eame nom. Le fichier Excel du m\u00eame registre, lui, \u00e9tait "
        + "correctement born\u00e9 depuis des semaines. <b>Le PDF pose maintenant la m\u00eame question</b>, "
        + "porte ses vraies dates sur la couverture, dans la mention r\u00e9glementaire et dans "
        + "l\u2019attestation, et compte les traitements sans date qu\u2019il a d\u00fb \u00e9carter." },
    { emoji: 'boussole', titre: 'Le mot \u00ab\u00a0campagne\u00a0\u00bb voulait dire trois choses',
      desc: "Selon l\u2019\u00e9cran, il d\u00e9signait l\u2019axe des Archives, le cycle d\u2019une vendange \u00e0 la "
        + "suivante, ou simplement votre <b>p\u00e9riode de travail</b> en cours \u2014 l\u2019export phyto "
        + "proposait ainsi une \u00ab\u00a0campagne consult\u00e9e\u00a0\u00bb qui \u00e9tait un printemps. Tous les documents "
        + "dat\u00e9s lisent d\u00e9sormais <b>la m\u00eame liste de fen\u00eatres</b>, o\u00f9 chacune porte son nom\u00a0: "
        + "campagne, exercice comptable, p\u00e9riode de travail. Quand deux d\u2019entre elles tombent aux "
        + "m\u00eames dates, la liste le dit au lieu de vous laisser choisir au hasard." }
  ] },
  { v: '7.17', items: [
    { emoji: 'reveil', titre: 'Une saisie faite \u00e0 minuit et demie \u00e9tait dat\u00e9e de la veille',
      desc: "L\u2019application prenait la date sur l\u2019horloge de r\u00e9f\u00e9rence mondiale, pas sur la v\u00f4tre. "
        + "Entre minuit et 2\u00a0h l\u2019\u00e9t\u00e9 (1\u00a0h l\u2019hiver), tout ce que vous enregistriez portait "
        + "<b>la date de la veille</b>\u00a0: une pes\u00e9e de caisses en pleine vendange, un ajout de SO\u2082 en fin de "
        + "nuit, une ligne de journal, un traitement. Deux de ces registres sont r\u00e9glementaires. "
        + "<b>78\u00a0endroits</b> ont \u00e9t\u00e9 remis \u00e0 l\u2019heure de votre appareil, et un contr\u00f4le "
        + "automatique rejoue d\u00e9sormais les calculs de dates sous cinq fuseaux avant chaque livraison." },
    { emoji: 'goutte', titre: 'Le cuivre liss\u00e9 sur 7\u00a0ans criait au loup',
      desc: "La moyenne glissante ne divisait que par les ann\u00e9es o\u00f9 vous aviez trait\u00e9. Une parcelle \u00e0 "
        + "4\u00a0kg en 2020, plus rien pendant cinq ans, puis 4\u00a0kg en 2026 affichait <b>4,00\u00a0kg/ha/an "
        + "\u2014 Vigilance</b>, comme un domaine coll\u00e9 au plafond depuis sept ans. Sa vraie moyenne\u00a0: "
        + "<b>1,14</b>. Une ann\u00e9e sans cuivre \u00e0 l\u2019int\u00e9rieur de la p\u00e9riode suivie compte "
        + "d\u00e9sormais pour z\u00e9ro, les ann\u00e9es d\u2019avant votre premi\u00e8re trace ne comptent pas, et "
        + "l\u2019\u00e9cran <b>dit sur combien d\u2019ann\u00e9es il divise</b>\u00a0\u2014 sans cette assiette, "
        + "\u00ab\u202f1,7\u00a0kg/ha/an\u202f\u00bb ne se lit pas." },
    { emoji: 'curseurs', titre: 'Votre plafond cuivre s\u2019applique enfin partout',
      desc: "Le plafond annuel est r\u00e9glable (R\u00e9glages \u203a Domaine), mais le budget sur sept ans \u00e9tait "
        + "\u00e9crit \u00ab\u202f28\u202f\u00bb en dur \u00e0 six endroits\u00a0: la vue annuelle suivait votre "
        + "r\u00e9glage, la vue sept ans non. Il en d\u00e9coule maintenant\u00a0\u2014 une seule notion, un seul chiffre." },
    { emoji: 'balance', titre: 'Les r\u00e9glages de vendange ne se saisissent plus \u00e0 c\u00f4t\u00e9',
      desc: "Poids par caisse, ratio kg/hL et sucre par degr\u00e9 pilotent <b>tous les volumes</b> de "
        + "l\u2019application, jusqu\u2019au rendement en hL/ha. Rien ne les v\u00e9rifiait\u00a0: une valeur "
        + "aberrante s\u2019enregistrait en silence, et intervertir les ratios minimum et maximum retournait "
        + "toutes les fourchettes (\u00ab\u202f15,4\u201314,3\u202f\u00bb). Les valeurs sont born\u00e9es, les deux "
        + "ratios remis dans l\u2019ordre, et l\u2019application <b>vous le dit</b> au lieu de corriger en douce." },
    { emoji: 'cadenas', titre: 'Deux corrections que vous ne verrez pas',
      desc: "Le registre commercial de GUERETTECH vivait dans un document lisible sans compte\u00a0: il est "
        + "d\u00e9plac\u00e9. Et l\u2019application gardait un nom de domaine par d\u00e9faut \u00e0 deux endroits qui "
        + "s\u2019ex\u00e9cutent avant votre connexion\u00a0\u2014 la sauvegarde hors ligne d\u2019un nouveau domaine "
        + "pouvait s\u2019\u00e9crire dans le mauvais tiroir, et son raccourci install\u00e9 sur t\u00e9l\u00e9phone "
        + "pouvait pointer ailleurs. Les deux d\u00e9fauts sont ferm\u00e9s." }
  ] },
  { v: '7.16', items: [
    { emoji: 'raisin', titre: 'Le contr\u00f4le de maturit\u00e9 et le cahier de cuverie se rangent aussi',
      desc: "Les deux documents demandaient d\u00e9j\u00e0 leur ann\u00e9e dans une petite bo\u00eete\u00a0; c\u2019est "
        + "maintenant la m\u00eame feuille que les autres, avec <b>l\u2019ordre en plus</b>. Le "
        + "<b>contr\u00f4le de maturit\u00e9</b>\u00a0: maturit\u00e9 (l\u2019ordre habituel, toujours par d\u00e9faut), "
        + "parcelle, surface, vitesse, date du dernier rel\u00e8vement. Le <b>cahier de "
        + "cuverie</b>\u00a0: encuvage (par d\u00e9faut), cuve, volume, dur\u00e9e de cuvaison \u2014 utile pour "
        + "retrouver une cuve par son nom quand il y en a vingt. Aucun geste de plus\u00a0: la "
        + "question de l\u2019ann\u00e9e et celle du tri tiennent sur le m\u00eame \u00e9cran." },
    { emoji: 'document', titre: 'Le titre du tableau ne ment plus sur son ordre',
      desc: "Le contr\u00f4le de maturit\u00e9 annon\u00e7ait \u00ab\u00a0Ordre de maturit\u00e9\u00a0\u00bb quel que soit le "
        + "classement. Il ne le dit plus que quand c\u2019en est un. Une cuve encore en cuve n\u2019a pas "
        + "de dur\u00e9e de cuvaison, une parcelle avec un seul rel\u00e8vement n\u2019a pas de vitesse\u00a0: "
        + "elles partent <b>en fin de liste dans les deux sens</b>, jamais en t\u00eate d\u2019un ordre "
        + "croissant o\u00f9 elles se liraient comme des z\u00e9ros." }
  ] },
  { v: '7.15', items: [
    { emoji: 'carte', titre: 'L\u2019\u00e9tat du vignoble et le bilan mati\u00e8re se rangent aussi',
      desc: "Apr\u00e8s les r\u00e9coltes, deux autres documents demandent leur ordre. <b>\u00c9tat du "
        + "vignoble</b>\u00a0: tourn\u00e9e (l\u2019ordre habituel, toujours par d\u00e9faut), parcelle, surface, "
        + "avancement, dernier rendement ou date du dernier travail. <b>Inventaire des "
        + "intrants</b>\u00a0: nom, cat\u00e9gorie, stock, ou coh\u00e9rence \u2014 ce dernier en d\u00e9croissant "
        + "met <b>les \u00e9carts en t\u00eate</b>, pour le contr\u00f4le. Une parcelle ou un produit dont la "
        + "valeur manque part <b>en fin de liste dans les deux sens</b>\u00a0: une donn\u00e9e absente "
        + "n\u2019est pas une petite valeur." },
    { emoji: 'graphique', titre: 'Le dernier rendement connu n\u2019est pas la m\u00eame ann\u00e9e partout',
      desc: "La colonne \u00ab\u00a0dernier rendement\u00a0\u00bb de l\u2019\u00e9tat du vignoble montre le dernier de "
        + "<b>chaque</b> parcelle\u00a0: toutes n\u2019ont pas \u00e9t\u00e9 vendang\u00e9es la m\u00eame ann\u00e9e. Le "
        + "document <b>nomme d\u00e9sormais les mill\u00e9simes compar\u00e9s</b> sous le tableau d\u00e8s qu\u2019il "
        + "y en a plusieurs. Le classement reste utile, il ne fait plus croire \u00e0 une m\u00eame "
        + "campagne." },
    { emoji: 'liste', titre: 'Les deux exports CSV sortent toujours dans le m\u00eame ordre',
      desc: "<b>Journal des travaux</b> par date puis par parcelle, <b>avancement par parcelle</b> "
        + "de A \u00e0 Z. Ils suivaient l\u2019ordre de saisie\u00a0: deux exports du m\u00eame jour pouvaient "
        + "sortir diff\u00e9remment, et comparer deux fichiers devenait illisible. Aucune question "
        + "n\u2019est pos\u00e9e \u2014 un tableur retrie en un clic, mais l\u2019ordre de d\u00e9part est d\u00e9sormais "
        + "stable." }
  ] },
  { v: '7.14', items: [
    { emoji: 'imprimante', titre: 'Vos documents s\u2019impriment dans l\u2019ordre que vous choisissez',
      desc: "Le document <b>R\u00e9coltes de la vendange</b> sortait ses lignes dans l\u2019ordre o\u00f9 vous "
        + "les aviez saisies \u2014 c\u2019est-\u00e0-dire dans aucun ordre, pour qui cherche une parcelle sur "
        + "la feuille. Il demande maintenant <b>par quoi trier</b>\u00a0: parcelle, surface, rendement, "
        + "kilos ou date, dans un sens ou dans l\u2019autre. Vous pouvez aussi lui demander <b>une ligne "
        + "par parcelle</b> au lieu d\u2019une ligne par benne. L\u2019ordre choisi est <b>\u00e9crit dans "
        + "l\u2019en-t\u00eate</b>\u00a0: deux tirages tri\u00e9s diff\u00e9remment ne se ressemblent plus sans le dire. "
        + "Votre choix est retenu pour la fois suivante." },
    { emoji: 'raisin', titre: 'Une benne n\u2019a pas de rendement',
      desc: "La colonne \u00ab\u00a0rendement\u00a0\u00bb divisait les kilos <b>d\u2019un seul apport</b> par la surface "
        + "de <b>toute la parcelle</b>. Trois bennes sur la m\u00eame parcelle affichaient donc trois "
        + "tiers de rendement, chacun pr\u00e9sent\u00e9 comme un rendement. Le chiffre est d\u00e9sormais celui "
        + "de la <b>parcelle enti\u00e8re sur le mill\u00e9sime</b>, cuvier et vrac r\u00e9unis \u2014 une parcelle "
        + "qui part aux deux endroits n\u2019en montre plus deux moiti\u00e9s. Une parcelle sans surface "
        + "enregistr\u00e9e laisse la case <b>vide</b>, et le document dit lesquelles." },
    { emoji: 'calendrier', titre: 'Le document des r\u00e9coltes demande son mill\u00e9sime',
      desc: "Il prenait <b>tout l\u2019historique</b> des r\u00e9coltes et se titrait avec l\u2019ann\u00e9e en cours\u00a0: "
        + "d\u00e8s la vendange suivante, une feuille intitul\u00e9e \u00ab\u00a02027\u00a0\u00bb aurait list\u00e9 2026. Le "
        + "mill\u00e9sime se choisit maintenant \u00e0 l\u2019ouverture, et il est <b>toujours \u00e9crit</b> en t\u00eate "
        + "du document." }
  ] },
  { v: '7.13', items: [
    { emoji: 'cuve', titre: 'D\u00e9cuver, c\u2019est dire que la fermentation est finie',
      desc: "Le comparatif annon\u00e7ait <b>\u00ab pas encore \u00bb</b> sur des cuves d\u00e9j\u00e0 d\u00e9cuv\u00e9es, marc "
        + "sorti. Il comparait une densit\u00e9 \u00e0 un rep\u00e8re calcul\u00e9\u00a0; or ce n\u2019est pas un chiffre qui "
        + "dit qu\u2019une cuve est finie, <b>c\u2019est vous</b>, \u00e0 la d\u00e9gustation et \u00e0 l\u2019\u00e9tat de la cuve. "
        + "D\u00e9sormais la feuille de d\u00e9cuvage pose la question une fois\u00a0: <b>termin\u00e9e en cuve</b> "
        + "(coch\u00e9 d\u2019avance) ou <b>elle finira au chai</b>. La colonne s\u2019appelle <b>Fin de FA</b> et "
        + "affiche la <b>date du d\u00e9cuvage</b>\u00a0; une cuve qui fermente encore est \u00ab en cours \u00bb, "
        + "plus \u00ab pas encore \u00bb. Les cuves d\u00e9cuv\u00e9es <b>avant</b> cette mise \u00e0 jour gardent leur "
        + "date sans que rien ne soit devin\u00e9 pour elles." },
    { emoji: 'eprouvette', titre: 'La densit\u00e9 \u00e0 la mise en f\u00fbt, l\u00e0 o\u00f9 elle se prend',
      desc: "Au d\u00e9cuvage on presse, et le pressurage <b>relargue du sucre</b>\u00a0: la densit\u00e9 de la "
        + "masse remonte par rapport au vin de goutte. La feuille \u00ab D\u00e9cuver \u00bb accepte donc une "
        + "<b>densit\u00e9 de mise en f\u00fbt</b> avec sa temp\u00e9rature, goutte et presse assembl\u00e9es. Elle "
        + "s\u2019affiche sur la cuv\u00e9e au Chai. Elle ne rejoint pas la courbe du Cuvier\u00a0: ce n\u2019est pas "
        + "un relev\u00e9 de cuve, c\u2019est le point de fermeture de l\u2019une et d\u2019ouverture de l\u2019autre." },
    { emoji: 'graphique', titre: 'Le seuil de vin sec redevient un rep\u00e8re',
      desc: "Il ne d\u00e9clenche plus rien\u00a0: ni \u00ab finie \u00bb, ni \u00ab pas finie \u00bb, ni une entr\u00e9e dans la "
        + "tourn\u00e9e. Il se dessine sur les courbes, et le d\u00e9tail d\u2019une cuve dit d\u00e9sormais <b>o\u00f9 il "
        + "est et d\u2019o\u00f9 il vient</b> \u2014 le degr\u00e9 potentiel du mo\u00fbt, ou le rep\u00e8re g\u00e9n\u00e9ral quand "
        + "rien ne permet de le lire. <b>Sa valeur reste \u00e0 caler sur vos analyses</b>\u00a0: nos "
        + "cuves sont s\u00e8ches vers 997-998 au densim\u00e8tre, un chiffre plus haut que ce que dit le "
        + "calcul. Une s\u00e9rie de sucres r\u00e9ducteurs au labo tranchera." }
  ] },
  { v: '7.12', items: [
    { emoji: 'eprouvette', titre: 'Le seuil du vin sec suit votre mo\u00fbt, plus un nombre unique',
      desc: "Jusqu\u2019ici, une seule densit\u00e9 (996) servait de \u00ab\u00a0vin sec\u00a0\u00bb \u00e0 toutes les cuves. "
        + "Elle n\u2019existe pas\u00a0: une cuve est s\u00e8che d\u2019autant plus bas que son mo\u00fbt \u00e9tait riche. "
        + "Chaque cuve a d\u00e9sormais <b>son</b> seuil, calcul\u00e9 sur le degr\u00e9 potentiel de son mo\u00fbt "
        + "\u2014 lu sur votre premier relev\u00e9, \u00e0 d\u00e9faut sur vos contr\u00f4les de maturit\u00e9, et une "
        + "chaptalisation l\u2019abaisse. Un mo\u00fbt \u00e0 12\u00b0 est sec vers <b>995</b>, un mo\u00fbt \u00e0 14\u00b0 vers "
        + "<b>992,7</b>. Avant, l\u2019\u00e9cran d\u00e9clarait s\u00e8che une cuve qui portait encore 8\u00a0g/L sur un "
        + "millésime chaud. La courbe, le cahier de cuverie et le comparatif portent tous le m\u00eame "
        + "seuil, et le comparatif dessine une <b>bande</b> quand vos cuves n\u2019ont pas le m\u00eame. "
        + "Le chiffre reste une estimation\u00a0: seule une analyse de sucres r\u00e9ducteurs tranche." },
    { emoji: 'cuve', titre: 'Une cuve d\u00e9cuv\u00e9e avant la fin de FA reste suivie',
      desc: "\u00c9couler t\u00f4t pour arr\u00eater l\u2019extraction du marc et laisser la fermentation finir en "
        + "phase liquide est une pratique courante \u2014 l\u2019application, elle, fermait le dossier au "
        + "d\u00e9cuvage\u00a0: plus de bouton pour relever, la cuve sortait de la tourn\u00e9e, et le comparatif "
        + "la laissait \u00ab\u00a0pas encore\u00a0\u00bb s\u00e8che pour toujours. Elle porte maintenant "
        + "<b>D\u00e9cuv\u00e9e \u00b7 FA</b>, garde \u00ab\u00a0Saisir une mesure\u00a0\u00bb, <b>reste dans la tourn\u00e9e</b> et dans "
        + "la liste \u00e0 mesurer, jusqu\u2019au relev\u00e9 qui passe sous son seuil \u2014 c\u2019est la m\u00eame courbe, "
        + "pas une seconde. La cuv\u00e9e n\u00e9e du d\u00e9cuvage l\u2019annonce aussi au Chai\u00a0: ni malo "
        + "ni sulfitage tant qu\u2019il reste du sucre." }
  ] },
  { v: '7.11', items: [
    { emoji: 'euro', titre: 'Ce qui est sorti cette ann\u00e9e, d\u00e8s l\u2019ouverture de l\u2019\u00c9conomie',
      desc: "Une bande <b>L\u2019exercice en cours</b> se pose sous le budget de campagne, dans "
        + "<b>Pilotage \u203a \u00c9conomie \u203a Synth\u00e8se</b>\u00a0: le total <b>sorti depuis l\u2019ouverture</b> de l\u2019exercice, "
        + "son co\u00fbt \u00e0 l\u2019hectare, et sa r\u00e9partition entre <b>salaires</b>, <b>carburant</b>, <b>achats</b>, "
        + "<b>r\u00e9parations</b> et <b>f\u00fbts</b>. Les deux chiffres se lisent d\u00e9sormais l\u2019un sous l\u2019autre\u00a0: "
        + "au-dessus ce que la campagne <b>co\u00fbtera</b> \u2014 un bar\u00e8me, sans date \u2014, en dessous ce qui est "
        + "<b>r\u00e9ellement sorti</b> du compte, \u00e0 sa date. "
        + "Quand des achats ou des r\u00e9parations attendent leur facture, la bande le dit\u00a0: le total "
        + "affich\u00e9 est alors un <b>plancher</b>." }
  ] },
  { v: '7.10', items: [
    { emoji: 'euro', titre: 'Deux \u00e9crans d\u2019argent qui portaient presque le m\u00eame nom',
      desc: "Dans <b>Pilotage \u203a \u00c9conomie</b>, deux cartes s\u2019appelaient \u00e0 un mot pr\u00e8s pareil\u00a0: "
        + "\u00ab\u00a0O\u00f9 part l\u2019argent\u00a0\u00bb (la campagne) et \u00ab\u00a0O\u00f9 est parti l\u2019argent\u00a0\u00bb (l\u2019exercice). "
        + "On y cherchait donc ses <b>achats</b>, ses <b>r\u00e9parations</b> et ses <b>f\u00fbts</b>\u00a0\u2014 qui n\u2019y sont pas, "
        + "et ne peuvent pas y \u00eatre\u00a0: la carte de la campagne est un <b>bar\u00e8me</b> (surface \u00d7 heures par hectare "
        + "\u00d7 taux), elle ne porte aucune date, alors qu\u2019un achat en porte une. "
        + "Elle s\u2019appelle d\u00e9sormais <b>Le co\u00fbt de la campagne</b>, elle \u00e9crit noir sur blanc ce qu\u2019elle "
        + "ne contient pas, et un bouton m\u00e8ne \u00e0 <b>Exercice</b>, o\u00f9 tout l\u2019argent sorti est compt\u00e9 "
        + "d\u2019un bilan \u00e0 l\u2019autre, salaires compris." }
  ] },
  { v: '7.09', items: [
    { emoji: 'calendrier', titre: 'Le planning d\u2019une ann\u00e9e neuve ne d\u00e9cale plus les jours',
      desc: "Sur une ann\u00e9e sans mod\u00e8le enregistr\u00e9 \u2014 2027, par exemple \u2014 la grille affichait "
        + "<b>tous les jours d\u00e9cal\u00e9s d\u2019une case</b>\u00a0: quelqu\u2019un qui travaille du lundi au vendredi "
        + "apparaissait <b>du mardi au samedi</b>. En cause\u00a0: un mod\u00e8le de planning n\u2019est pas une semaine "
        + "type, c\u2019est un <b>calendrier</b>, et il \u00e9tait relu tel quel sur l\u2019ann\u00e9e suivante. "
        + "Les jours sont d\u00e9sormais <b>replac\u00e9s sur le bon jour de la semaine</b>. "
        + "Point important\u00a0: <b>aucun total ne bougeait</b>, ni le mois, ni les 1\u00a0607\u00a0h. C\u2019est pourquoi les r\u00e9glages "
        + "avaient l\u2019air justes. <b>Reprenez l\u2019\u00e9cart et les heures dues des mois d\u00e9j\u00e0 consult\u00e9s "
        + "sur une ann\u00e9e neuve</b>, ils \u00e9taient calcul\u00e9s sur le mauvais calendrier." },
    { emoji: 'info', titre: 'L\u2019\u00e9cran dit d\u2019o\u00f9 vient la grille, et ce qui manque',
      desc: "Tant qu\u2019aucun mod\u00e8le n\u2019est enregistr\u00e9 pour l\u2019ann\u00e9e affich\u00e9e, un bandeau au-dessus "
        + "de la grille annonce que c\u2019est un <b>report</b> du mod\u00e8le int\u00e9gr\u00e9, et compte les <b>jours "
        + "qui restent \u00e0 poser</b>\u00a0: une ann\u00e9e n\u2019a pas les m\u00eames semaines qu\u2019une autre, un mois peut "
        + "compter cinq jeudis puis quatre. <b>Rien n\u2019est ajout\u00e9 \u00e0 votre place</b> \u2014 un planning se signe. "
        + "Le planning imprim\u00e9 dit la m\u00eame chose, au m\u00eame endroit du raisonnement." },
  ]},
  { v: '7.08', items: [
    { emoji: 'euro', titre: 'Les prix d\u2019achat s\u2019enregistrent de nouveau',
      desc: "Dans <b>Pilotage \u203a \u00c9conomie \u203a Achats</b>, chiffrer un achat d\u2019intrants ou un lot de f\u00fbts "
        + "affichait bien le message vert \u00ab\u00a0Enregistr\u00e9\u00a0\u00bb\u2026 et le prix <b>disparaissait au rechargement</b>. "
        + "Le montant \u00e9tait pos\u00e9 en m\u00e9moire mais <b>n\u2019\u00e9tait jamais envoy\u00e9</b>\u00a0: l\u2019application le confiait "
        + "\u00e0 la mauvaise porte, qui sauvait tous les <b>autres</b> documents et jamais celui-l\u00e0. Rien ne circulait "
        + "donc dans le reste du Pilotage. C\u2019est corrig\u00e9\u00a0: <b>ressaisissez vos prix, ils tiennent</b>. Les montants "
        + "des interventions chez le r\u00e9parateur, eux, n\u2019ont jamais \u00e9t\u00e9 touch\u00e9s." },
    { emoji: 'barrique', titre: 'Le registre des mouvements de f\u00fbts ne s\u2019efface plus',
      desc: "Les entr\u00e9es et sorties du parc \u00e0 f\u00fbts \u2014 achats, ventes, f\u00fbts reform\u00e9s ou rendus \u2014 "
        + "\u00e9taient bien enregistr\u00e9es, mais <b>jamais relues</b> au d\u00e9marrage\u00a0: le registre repartait vide, et "
        + "la premi\u00e8re sauvegarde suivante l\u2019<b>\u00e9crasait pour de bon</b>. Il est de nouveau charg\u00e9 et conserv\u00e9. "
        + "<b>Attention</b>\u00a0: les mouvements perdus avant cette version ne peuvent pas \u00eatre retrouv\u00e9s. Le "
        + "<b>nombre de f\u00fbts au domaine</b>, lui, n\u2019a jamais d\u00e9pendu de ce registre." },
    { emoji: 'bouclier', titre: 'Une sauvegarde qui ne part pas vous le dit',
      desc: "Quand l\u2019application ne savait pas o\u00f9 ranger une saisie, elle <b>ne disait rien</b> et sauvait "
        + "autre chose \u00e0 la place. Elle refuse d\u00e9sormais franchement, l\u2019\u00e9crit \u00e0 l\u2019\u00e9cran en rouge et le consigne "
        + "dans <b>\u00ab\u00a0Signaler un probl\u00e8me\u00a0\u00bb</b>. Un message vert veut dire que c\u2019est fait." }
  ] },
  { v: '7.07', items: [
    { emoji: 'graphique', titre: 'Les courbes du mill\u00e9sime deviennent lisibles sur t\u00e9l\u00e9phone',
      desc: "Quinze cuves superpos\u00e9es, quinze noms \u00e9crits dans la marge\u00a0: sur un t\u00e9l\u00e9phone, le trac\u00e9 tenait dans un tiers de l\u2019\u00e9cran et plus personne n\u2019y lisait rien. <b>Cave \u203a Le mill\u00e9sime \u203a Les courbes</b> montre d\u00e9sormais un <b>couloir</b>\u00a0: la zone dor\u00e9e va de la cuve la plus lente \u00e0 la plus rapide, le pointill\u00e9 est la m\u00e9diane du cuvage. <b>Touchez une pastille</b> au-dessus du graphe \u2014 ou une ligne du tableau \u2014 et cette cuve-l\u00e0 passe en trait \u00e9pais par-dessus le couloir. Deux au maximum, et la m\u00eame s\u00e9lection vaut pour les densit\u00e9s comme pour les temp\u00e9ratures. <b>Un appui sur le graphe</b> donne le jour\u00a0: votre cuve, la m\u00e9diane, et l\u2019\u00e9cart entre les deux. Sur le <b>cahier de cuverie imprim\u00e9</b>, rien ne se r\u00e9sume\u00a0: les quinze courbes gardent leur nom, une feuille A4 a la place. Il gagne m\u00eame un second trac\u00e9, celui des <b>temp\u00e9ratures</b> sur le m\u00eame rail de jours \u2014 le palier de densit\u00e9 et la mac\u00e9ration qui l\u2019explique se lisent enfin c\u00f4te \u00e0 c\u00f4te sur le papier." }
  ] },
  { v: '7.06', items: [
    { emoji: 'graphique', titre: 'Touchez la courbe de fermentation pour lire un relev\u00e9',
      desc: "La courbe montrait la forme, jamais les chiffres\u00a0: pour savoir ce que valait ce point-l\u00e0, il fallait descendre dans la liste des relev\u00e9s. Un <b>appui sur la courbe</b> ouvre maintenant une \u00e9tiquette\u00a0: la date, la densit\u00e9 \u00e0 20&nbsp;\u00b0C, la temp\u00e9rature, les pigeages et remontages, l\u2019op\u00e9ration et la note du jour. Pas besoin de viser le point\u00a0: toute la colonne au-dessus r\u00e9pond. Le cahier de cuverie imprim\u00e9 ne change pas." }
  ] },
  { v: '7.05', items: [
    { emoji: 'cuve', titre: 'La tourn\u00e9e du cuvier',
      desc: "Un quatri\u00e8me onglet dans Le Cuvier\u00a0: <b>Tourn\u00e9e</b>. Toutes vos cuves en fermentation sur un seul \u00e9cran, deux champs par cuve, temp\u00e9rature et densit\u00e9. La touche <b>Suivant</b> du clavier passe \u00e0 la cuve d\u2019apr\u00e8s sans refermer le clavier ni vous faire viser un champ, et la ligne passe au vert quand elle est faite. Avant, il fallait ouvrir, saisir, enregistrer et fermer une fiche par cuve\u00a0: quinze fois." },
    { emoji: 'check', titre: 'Pigeages et remontages au pouce',
      desc: "Deux compteurs par cuve, <b>P</b> et <b>R</b>\u00a0: un appui ajoute un, un appui long en retire un. Pas d\u2019\u00e9cran \u00e0 ouvrir, pas de champ \u00e0 viser." },
    { emoji: 'etincelles', titre: 'Sulfiter huit cuves en une fois',
      desc: "Le bouton <b>+</b> en bas \u00e0 droite de la tourn\u00e9e ouvre une intervention group\u00e9e\u00a0: l\u2019op\u00e9ration, les cuves (ou <b>Toutes</b>), la dose. Chaque cuve re\u00e7oit son op\u00e9ration avec <b>son propre volume</b>, et chacune reste corrigible depuis sa fiche." },
    { emoji: 'chrono', titre: 'Un relev\u00e9 par cuve et par jour',
      desc: "La tourn\u00e9e met \u00e0 jour le relev\u00e9 du jour au lieu d\u2019en empiler un deuxi\u00e8me\u00a0: corriger une faute de frappe ne pose plus deux points sur la m\u00eame date dans la courbe. Un champ laiss\u00e9 vide veut dire \u00ab je n\u2019ai pas saisi \u00bb, jamais \u00ab efface \u00bb\u00a0\u2014 pour effacer une valeur, passez par \u00ab Saisir une mesure \u00bb." },
    { emoji: 'graphique', titre: 'Le pourcentage de FA ne tombe plus \u00e0 z\u00e9ro',
      desc: "Un relev\u00e9 qui ne porte qu\u2019une temp\u00e9rature ou qu\u2019un pigeage faisait afficher \u00ab 0\u00a0% \u00bb \u00e0 une cuve suivie depuis trois semaines, et aplatissait sa courbe. L\u2019avancement, la courbe et la fin estim\u00e9e partent d\u00e9sormais du dernier relev\u00e9 qui porte une densit\u00e9." }
  ] },
  { v: '7.04', items: [
    { emoji: 'liste', titre: 'La parcelle o\u00f9 vous travaillez passe en t\u00eate',
      desc: "Vous appuyez sur <b>D\u00e9but</b> sur une parcelle&nbsp;: elle monte imm\u00e9diatement en haut de la liste, et elle y reste jusqu\u2019\u00e0 ce que vous validiez. Elle passe devant la tourn\u00e9e du domaine et devant la proximit\u00e9&nbsp;GPS, parce qu\u2019appuyer sur D\u00e9but est un geste que vous avez fait expr\u00e8s. Avant, elle descendait \u2014 et sur les t\u00e2ches \u00e0 passages ou \u00e0 niveaux, comme le Relevage ou l\u2019\u00c9bourgeonnage, l\u2019\u00e9tat ne comptait pas du tout dans l\u2019ordre." },
    { emoji: 'feuille', titre: 'Cr\u00e9er une t\u00e2che&nbsp;: un seul \u00e9cran',
      desc: "\u00ab Nouvelle t\u00e2che selon le bar\u00e8me \u00bb et \u00ab Nouvelle t\u00e2che libre \u00bb ne font plus qu\u2019un bouton, <b>+ Nouvelle t\u00e2che</b>, dans la roue crant\u00e9e de la Vigne. Vous tapez le nom&nbsp;: s\u2019il existe dans la convention on vous le propose avec ses heures de r\u00e9f\u00e9rence, sinon on cr\u00e9e votre travail \u00e0 vous. Les p\u00e9riodes o\u00f9 la t\u00e2che se fait \u2014 et leurs dates estim\u00e9es \u2014 sont dans le m\u00eame \u00e9cran, celle que vous consultez d\u00e9j\u00e0 coch\u00e9e. Le bar\u00e8me de la convention et vos \u00e9cartements se consultent depuis ce m\u00eame panneau." },
    { emoji: 'alerte', titre: 'Une t\u00e2che cr\u00e9\u00e9e ne dispara\u00eet plus',
      desc: "Une t\u00e2che cr\u00e9\u00e9e hors convention n\u2019\u00e9tait rattach\u00e9e \u00e0 aucune p\u00e9riode&nbsp;: elle sortait de la liste au moment m\u00eame o\u00f9 vous l\u2019enregistriez, et il fallait aller la cocher dans la p\u00e9riode pour la revoir. Elle est maintenant pos\u00e9e dans les p\u00e9riodes que vous cochez, en une fois." },
    { emoji: 'calendrier', titre: 'Cocher une t\u00e2che ouvre ses dates tout de suite',
      desc: "Dans <b>Modifier la p\u00e9riode</b>, cocher une t\u00e2che n\u2019ouvrait sa ligne de dates qu\u2019apr\u00e8s avoir enregistr\u00e9 puis rouvert la p\u00e9riode. La ligne appara\u00eet d\u00e9sormais au moment o\u00f9 vous cochez, et les dates d\u00e9j\u00e0 tap\u00e9es ne sont pas perdues." }
  ] },
  { v: '7.03', items: [
    { emoji: 'carton', titre: 'Un lot de f\u00fbts est achet\u00e9 ou lou\u00e9',
      desc: "La R\u00e9serve \u203a F\u00fbts vous demande d\u00e9sormais si le lot est <b>achet\u00e9</b> ou <b>lou\u00e9</b>. Un lot lou\u00e9 porte son <b>loyer HT par f\u00fbt et par an</b> et les dates de son contrat ; un lot achet\u00e9 porte sa <b>date de facture</b>, qui remplace la date de saisie. Les lots existants restent des achats, rien \u00e0 reprendre." },
    { emoji: 'euro', titre: 'La location de f\u00fbts entre enfin dans l\u2019exercice',
      desc: "\u00c9conomie \u203a Exercice l\u2019annon\u00e7ait depuis le premier jour sans jamais le faire. Le loyer y figure maintenant comme un poste \u00e0 part, <b>au prorata des jours de contrat</b> \u2014 un contrat ouvert en septembre ne co\u00fbte pas une ann\u00e9e pleine sur un exercice ouvert en ao\u00fbt \u2014 et calcul\u00e9 sur les f\u00fbts que vous d\u00e9tenez vraiment, libres comme en vin. Rendre deux f\u00fbts en cours de contrat fait baisser le loyer tout seul." },
    { emoji: 'engrenage', titre: 'Un f\u00fbt achet\u00e9 : \u00e0 vous de dire s\u2019il compte',
      desc: "En bas de l\u2019Exercice, un r\u00e9glage : le f\u00fbt achet\u00e9 reste <b>hors exercice</b> (par d\u00e9faut, aucun de vos chiffres ne bouge) ou <b>compte en entier \u00e0 la date de sa facture</b>. Chaque choix affiche ce qu\u2019il ferait avant que vous le preniez." },
    { emoji: 'alerte', titre: '\u00c0 r\u00e9former et \u00e0 rendre ne sont plus le m\u00eame compteur',
      desc: "Le parc \u00e0 f\u00fbts s\u00e9pare les deux : un f\u00fbt achet\u00e9 en fin de vie se <b>r\u00e9forme</b>, un f\u00fbt lou\u00e9 en fin de contrat se <b>rend</b>. Le lou\u00e9 sort de l\u2019alerte de r\u00e9forme \u2014 on ne r\u00e9forme pas le bien d\u2019un autre \u2014 mais il garde sa place dans la pyramide des \u00e2ges." },
    { emoji: 'document', titre: '\u00ab \u00e0 chiffrer \u00bb et \u00ab sans frais \u00bb ne se confondent plus',
      desc: "Un achat enregistr\u00e9 sans prix s\u2019affichait \u00ab sans frais \u00bb dans \u00c9conomie \u203a Achats et n\u2019apparaissait jamais dans le filtre \u00ab \u00c0 chiffrer \u00bb. C\u2019est corrig\u00e9 : un prix vide reste vide. Les r\u00e9parations en attente de facture rejoignent aussi la liste \u00ab \u00e0 compl\u00e9ter \u00bb de l\u2019exercice." },
    { emoji: 'calendrier', titre: 'L\u2019\u00e9cran Achats se borne \u00e0 l\u2019exercice',
      desc: "Son total couvrait tout l\u2019historique du domaine, pos\u00e9 \u00e0 c\u00f4t\u00e9 d\u2019un total d\u2019exercice qui, lui, ne couvrait qu\u2019une ann\u00e9e. Deux boutons choisissent maintenant la fen\u00eatre : <b>Exercice</b> ou <b>Tout l\u2019historique</b>." },
    { emoji: 'carton', titre: 'Deux livraisons du m\u00eame f\u00fbt font deux lots',
      desc: "Saisir un r\u00e9assort identique grossissait le lot existant sans toucher \u00e0 sa date ni \u00e0 son prix : la seconde commande \u00e9tait alors compt\u00e9e au prix de la premi\u00e8re, et dat\u00e9e de son ann\u00e9e. Chaque facture a maintenant son lot. Le +/- de la carte reste l\u00e0 pour corriger une quantit\u00e9." }
  ] },
  { v: '7.02', items: [
    { emoji: 'chrono', titre: 'La date de fin d\u2019Aujourd\u2019hui est celle de La campagne',
      desc: "Aujourd\u2019hui annon\u00e7ait <b>+32 j d\u2019avance</b> pendant que La campagne montrait du travail en retard fin mars, sur les m\u00eames donn\u00e9es : le cockpit comptait l\u2019\u00e9quipe d\u2019octobre sur une taille qui n\u2019ouvre qu\u2019en novembre, et ne d\u00e9duisait pas le tracteur. La date, la marge et les \u00ab N j \u00bb par t\u00e2che viennent d\u00e9sormais du simulateur de La campagne sans renfort \u2014 chaque travail dans sa fen\u00eatre, tracteur d\u00e9duit, aux heures normales du planning. Les jours ouvr\u00e9s se comptent depuis aujourd\u2019hui, la phrase sous le chiffre dit quand l\u2019\u00e9quipe est reconduite au-del\u00e0 de la p\u00e9riode, et un petit \u00ab i \u00bb explique le calcul." }
  ] },
  { v: '7.01', items: [
    { emoji: 'euro', titre: 'L\u2019exercice est coup\u00e9 au jour : engag\u00e9, pr\u00e9vu, \u00e0 la cl\u00f4ture',
      desc: "\u00c9conomie \u203a Exercice disait \u00ab 216 k\u20ac \u00b7 10 113 h pay\u00e9es \u00bb un 10 septembre \u2014 deux mois sortis et dix mois lus dans la grille du planning. Il dit maintenant <b>ce qui est sorti</b> \u00e0 ce jour, <b>ce que la grille pr\u00e9voit</b> jusqu\u2019\u00e0 la cl\u00f4ture (hachur\u00e9 sur le graphe, avec le trait d\u2019aujourd\u2019hui), et le total des deux. Un mois entam\u00e9 est coup\u00e9 au jour. La comparaison avec l\u2019an dernier se fait <b>aux m\u00eames jours</b>, et l\u2019exercice complet dit qu\u2019il contient du pr\u00e9vu." },
    { emoji: 'alerte', titre: 'Une seule liste \u00ab \u00e0 compl\u00e9ter \u00bb',
      desc: "Le bandeau en t\u00eate du Pilotage et la carte \u00ab Ce qu\u2019il faut regarder \u00bb d\u2019\u00c9conomie tenaient chacun leur liste, avec des mots diff\u00e9rents. La carte relit d\u00e9sormais celle du bandeau, n\u2019en garde que ce qui met un poste du budget \u00e0 z\u00e9ro, et le dit : \u00ab 2 des 3 choses \u00e0 compl\u00e9ter \u00bb. M\u00eames mots, m\u00eames boutons \u2014 et le prix du GNR comme les doses phyto figurent enfin dans le bandeau." },
    { emoji: 'chrono', titre: 'Le Pilotage donne une seule date de fin',
      desc: "La carte <b>\u00c9ch\u00e9ances par t\u00e2che</b> (La campagne) calculait sa propre fin de saison, avec la cadence des quatre derni\u00e8res semaines, pendant qu\u2019<b>Aujourd\u2019hui</b> lisait l\u2019\u00e9quipe planifi\u00e9e : jusqu\u2019\u00e0 dix-huit jours d\u2019\u00e9cart entre deux onglets. Les deux lisent maintenant le m\u00eame calcul, et la carte dit lequel." },
    { emoji: 'equipe', titre: 'Une \u00e9quipe de vendange compte pour son effectif, partout',
      desc: "La \u00ab Cadence \u00e9quipe \u00bb, le simulateur \u00ab et si ? \u00bb et le taux horaire moyen comptaient une ligne d\u2019\u00e9quipe collective pour <b>une</b> personne. Trente vendangeurs valaient une fiche : le simulateur annon\u00e7ait 13 jours pour un travail que la tourn\u00e9e finissait en 2. Un cong\u00e9 pay\u00e9 ne compte plus comme une pr\u00e9sence." },
    { emoji: 'euro', titre: 'Un \u00e9cart de cadence hors bornes se lit, il ne s\u2019applique plus',
      desc: "Quand le facteur sort de [0,5\u00a0; 3], il mesure un trou de saisie, pas une cadence. Il n\u2019\u00e9tait d\u00e9j\u00e0 pas appliqu\u00e9 \u00e0 la date de fin \u2014 mais il l\u2019\u00e9tait au budget projet\u00e9 \u00e0 quinze centim\u00e8tres. Les deux disent d\u00e9sormais la m\u00eame chose, et pourquoi. M\u00eame r\u00e8gle pour un \u00e9cart lu sur la campagne pr\u00e9c\u00e9dente : le verdict ne projette plus \u00ab 0 \u20ac au-dessus du budget \u00bb." },
    { emoji: 'personne', titre: 'La masse salariale de l\u2019exercice compte le bureau',
      desc: "\u00c9conomie \u203a Exercice \u00e9cartait les salaires administratifs alors que le tableau les annon\u00e7ait. Ils y sont, avec une pastille <b>bureau</b> ; la colonne s\u2019appelle <b>Travaill\u00e9es</b>. La capacit\u00e9 au champ, le pic et le renfort restent hors bureau." },
    { emoji: 'graphique', titre: 'Quatre chiffres remis d\u2019aplomb',
      desc: "<b>Pr\u00e9sences du jour</b> compte hors bureau, comme la carte du cockpit. Le <b>rythme de d\u00e9pense</b> ne remonte plus avant le d\u00e9but de la p\u00e9riode (dix jours de vendange \u00e9tal\u00e9s sur vingt-huit donnaient un rythme trois fois trop bas). La photo <b>Travaux</b> compte une campagne \u00e0 cheval sur la cl\u00f4ture au prorata de ses jours dans l\u2019exercice. Et \u00ab 1 t\u00e2ches \u00bb s\u2019\u00e9crit au singulier." }
  ] },
  { v: '7.00', items: [
    { emoji: 'raisin', titre: 'Le Cuvier se lit dans l\u2019ordre de la vendange',
      desc: "Ses trois onglets \u00e9taient rang\u00e9s <b>R\u00e9coltes \u00b7 Cuves \u00b7 Maturit\u00e9s</b>, c\u2019est-\u00e0-dire en partant du milieu. Ils suivent maintenant le raisin : <b>Maturit\u00e9s</b> \u00e0 la vigne, avant de couper \u2014 puis <b>R\u00e9coltes</b>, ce qui rentre \u2014 puis <b>Cuves</b>, ce qui fermente. Rien d\u2019autre ne bouge : m\u00eames \u00e9crans, m\u00eames gestes." },
    { emoji: 'barrique', titre: 'Le filtre mill\u00e9sime vaut pour tout Le Chai',
      desc: "Il vivait en t\u00eate de la liste des cuv\u00e9es : passer au <b>Journal</b> le faisait dispara\u00eetre de l\u2019\u00e9cran alors qu\u2019il restait pos\u00e9, et l\u2019on ne pouvait pas demander \u00ab qu\u2019a-t-on fait sur le 2025 \u00bb. Il est d\u00e9sormais <b>sous les onglets</b> et s\u2019applique aux trois : cuv\u00e9es, journal, bouteilles. Une op\u00e9ration qui porte sur deux mill\u00e9simes \u00e0 la fois n\u2019est rattach\u00e9e \u00e0 aucun : elle sort du filtre, et l\u2019\u00e9cran dit combien il en \u00e9carte plut\u00f4t que de les faire dispara\u00eetre en silence." },
    { emoji: 'verre', titre: 'Les textes de la Cave ont retrouv\u00e9 une taille',
      desc: "Trente-sept tailles de caract\u00e8re diff\u00e9rentes cohabitaient dans la Cave, dont du <b>7,5\u00a0px</b> \u2014 illisible \u00e0 bout de bras, entre deux rangs. Elles suivent maintenant la m\u00eame \u00e9chelle que le reste de l\u2019application, et <b>rien ne descend sous 9,5\u00a0px</b>. Les tailles montent l\u00e9g\u00e8rement par endroits : c\u2019est voulu." }
  ] },
  { v: '6.99', items: [
    { emoji: 'engrenage', titre: 'Chaque module a sa roue crant\u00e9e \u2014 le Phyto et la R\u00e9serve aussi',
      desc: "Le registre phyto (PDF et fichier tableur) et la synth\u00e8se cuivre s\u2019impriment depuis la roue du Phyto ; le gros bouton violet au bas du registre n\u2019existe plus. Les deux inventaires de la R\u00e9serve sont dans la sienne. M\u00eame geste sur les sept modules." },
    { emoji: 'curseurs', titre: 'R\u00e9glages : Domaine, \u00c9quipe, Moi',
      desc: "Le troisi\u00e8me onglet s\u2019appelle <b>Moi</b> : mot de passe, th\u00e8me, plein soleil, notifications, aide, CGU, d\u00e9connexion. Le catalogue complet des documents \u2014 registres, rapports, sauvegarde \u2014 est pass\u00e9 dans <b>Domaine</b>, o\u00f9 il a sa place. Un mot par chose : les en-t\u00eates disent \u00ab Cave \u00bb et \u00ab R\u00e9serve \u00bb comme le menu du bas, \u00ab Le Mill\u00e9sime \u00bb s\u2019\u00e9crit comme \u00ab Le Cuvier \u00bb, et le mot \u00ab Param\u00e9trage \u00bb a disparu." }
  ] },
  { v: '6.98', items: [
    { emoji: 'graphique', titre: 'Le Pilotage n\u2019a plus de bouton \u00ab Outils \u00bb',
      desc: "Il cachait deux choses de nature diff\u00e9rente. <b>Archives</b> se lit : c\u2019est maintenant un onglet, apr\u00e8s \u00c9conomie et Conformit\u00e9. <b>Param\u00e9trage</b> se r\u00e8gle : objectifs de fin, fen\u00eatres des t\u00e2ches et hypoth\u00e8ses de calcul sont dans la roue crant\u00e9e en haut \u00e0 droite, avec le bilan de campagne \u00e0 imprimer." },
    { emoji: 'curseurs', titre: 'Deux nombres ont rejoint leur module',
      desc: "La consommation GNR de r\u00e9f\u00e9rence est dans la roue du Tracteur, avec l\u2019\u00e9tat du prix du litre ; l\u2019IFT de r\u00e9f\u00e9rence dans la roue du Pilotage, \u00e0 c\u00f4t\u00e9 de ce qu\u2019il alimente. La carte \u00ab \u00c9conomie &amp; conformit\u00e9 \u00bb de R\u00e9glages \u203a Domaine, qui commen\u00e7ait par dire \u00ab se renseigne ailleurs \u00bb, n\u2019existe plus." }
  ] },
  { v: '6.97', items: [
    { emoji: 'calendrier', titre: 'Le Planning a deux onglets, et sa roue crant\u00e9e',
      desc: "\u00ab Le cadre \u00bb \u2014 mod\u00e8les de semaine, coupure, convention, r\u00e8gle des cong\u00e9s, heures sup \u2014 se r\u00e8gle une fois l\u2019an : il n\u2019avait rien \u00e0 faire \u00e0 c\u00f4t\u00e9 du mois. Il est dans la roue crant\u00e9e en haut \u00e0 droite, avec les relev\u00e9s \u00e0 imprimer \u2014 relev\u00e9 mensuel, relev\u00e9 d\u2019un salari\u00e9, planning de l\u2019ann\u00e9e, Heures &amp; ETP. Un onglet m\u00e9moris\u00e9 sur \u00ab Le cadre \u00bb rouvre sur le mois." }
  ] },
  { v: '6.96', items: [
    { emoji: 'engrenage', titre: 'La Vigne et le Tracteur r\u00e8glent leurs affaires chez eux',
      desc: "Une roue crant\u00e9e en haut \u00e0 droite de la Vigne ouvre vos t\u00e2ches et leur bar\u00e8me, vos \u00e9cartements de plantation et vos secteurs m\u00e9t\u00e9o ; celle du Tracteur ouvre le parc, les activit\u00e9s et le chrono. C\u2019\u00e9tait dans R\u00e9glages, deux onglets plus loin \u2014 m\u00eame \u00e9cran, m\u00eame contenu, \u00e0 un tap du module. Comme la Cave depuis la semaine derni\u00e8re." },
    { emoji: 'imprimante', titre: 'Les documents d\u2019un module sont dans sa roue',
      desc: "L\u2019\u00e9tat du vignoble, le rapport de saison et les fichiers du journal et des parcelles s\u2019impriment depuis la roue de la Vigne ; le carnet d\u2019entretien depuis celle du Tracteur. Le catalogue complet reste dans R\u00e9glages \u203a Domaine \u203a Documents &amp; impressions." },
    { emoji: 'curseurs', titre: 'R\u00e9glages a trois onglets, et une seule sortie par \u00e9cran',
      desc: "Domaine, \u00c9quipe, App \u2014 plus de barre qui d\u00e9file, plus de compteurs en t\u00eate. Le petit bouton maison des en-t\u00eates est parti : il faisait la m\u00eame chose que le menu du bas, et sur l\u2019Accueil il vous envoyait ailleurs. Le voyant de synchronisation, lui, est toujours \u00e0 sa place." }
  ] },
  { v: '6.95', items: [
    { emoji: 'corbeille', titre: 'Un peu de m\u00e9nage dans la Cave',
      desc: "Trois \u00e9crans de l\u2019ancienne Cave, d\u2019avant Le Chai, dormaient encore dans l\u2019application sans jamais s\u2019afficher. Ils sont retir\u00e9s, avec ce qui ne servait qu\u2019\u00e0 eux. Rien ne change \u00e0 l\u2019\u00e9cran\u00a0: la s\u00e9rie \u00ab\u00a0une question, un \u00e9cran\u00a0\u00bb est termin\u00e9e." },
  ] },
  { v: '6.94', items: [
    { emoji: 'verre', titre: 'La Cave du Pilotage est rentr\u00e9e dans la Cave',
      desc: "L\u2019onglet <b>Pilotage \u203a Cave</b> \u00e9tait une seconde cave, rang\u00e9e par question sur les m\u00eames moteurs. Il n\u2019existe plus\u00a0: ce qui presse est <b>Cave \u203a Aujourd\u2019hui</b>, le mill\u00e9sime et ses courbes sont <b>Cave \u203a Le mill\u00e9sime</b>, le parc \u00e0 f\u00fbts est en t\u00eate de <b>La R\u00e9serve \u203a F\u00fbts</b>. Dans Pilotage \u203a Aujourd\u2019hui reste une carte <b>Cave</b>\u00a0: le verdict et un bouton. Un appareil qui avait m\u00e9moris\u00e9 l\u2019onglet s\u2019ouvre sur Aujourd\u2019hui." },
    { emoji: 'graphique', titre: 'Le mill\u00e9sime a deux onglets\u00a0: La ligne de vie, Les courbes',
      desc: "La ligne de vie gagne ses quatre chiffres en t\u00eate et la comparaison <b>face \u00e0 l\u2019an dernier</b>\u00a0; Les courbes mettent toutes les cuves c\u00f4te \u00e0 c\u00f4te, chacune sur son jour z\u00e9ro. Un seul \u00e9cran s\u2019appelle d\u00e9sormais \u00ab\u00a0Le mill\u00e9sime\u00a0\u00bb." },
  ] },
  { v: '6.93', items: [
    { emoji: 'engrenage', titre: 'Les r\u00e9glages de la cave ont une seule porte : la roue crant\u00e9e',
      desc: "Le Cuvier avait son onglet R\u00e9glages, Le Chai aussi. Les deux sont r\u00e9unis derri\u00e8re la roue en haut \u00e0 droite de la Cave, avec le renvoi vers les appellations et les documents de la cave. Ce qu\u2019on r\u00e8gle une fois l\u2019an ne se glisse plus entre deux onglets du quotidien." },
    { emoji: 'raisin', titre: 'Au Cuvier, les onglets disent ce qu\u2019ils contiennent',
      desc: "\u00ab\u00a0Cuvier\u00a0\u00bb dans \u00ab\u00a0Le Cuvier\u00a0\u00bb s\u2019appelle <b>Cuves</b>, et \u00ab\u00a0Analyses\u00a0\u00bb \u2014 les contr\u00f4les de maturit\u00e9, \u00e0 la vigne \u2014 s\u2019appelle <b>Maturit\u00e9s</b>\u00a0: Le Chai a ses analyses labo, un m\u00eame mot pour deux choses ne renvoyait nulle part. L\u2019ordre suit la vendange\u00a0: R\u00e9coltes, Cuves, Maturit\u00e9s." },
  ] },
  { v: '6.92', items: [
    { emoji: 'chrono', titre: 'La Cave s\u2019ouvre sur Aujourd\u2019hui',
      desc: "Un seul \u00e9cran dit ce qui presse\u00a0: cuves \u00e0 mesurer, ouillages dus, soutirages \u00e0 faire, doses de SO\u2082 programm\u00e9es \u2014 puis les quatre semaines \u00e0 venir. Chaque ligne est un bouton vers le geste. \u00ab\u00a0Ce qui vient\u00a0\u00bb du mill\u00e9sime disait la m\u00eame chose que \u00ab\u00a0Ce qui presse\u00a0\u00bb du Pilotage\u00a0: c\u2019est ici d\u00e9sormais, l\u00e0 o\u00f9 l\u2019on fait le geste." },
    { emoji: 'graphique', titre: 'Quatre chiffres, les m\u00eames sur tous les onglets de la Cave',
      desc: "hL en cuve, f\u00fbts en vin, \u00e0 faire cette semaine, tonnes rentr\u00e9es. La bande changeait de sens d\u2019un onglet \u00e0 l\u2019autre\u00a0; elle est maintenant la photo de la cave enti\u00e8re, et la ligne sous les chiffres dit sur quel mill\u00e9sime ils sont calcul\u00e9s." },
  ] },
  { v: '6.91', items: [
    { emoji: 'balance', titre: 'Le rendement moyen se calcule sur la surface que vous avez vraiment r\u00e9colt\u00e9e',
      desc: "Quand vous vendez du raisin, vous saisissez la <b>surface achet\u00e9e</b> par l\u2019acheteur. Cette information n\u2019\u00e9tait pas lue\u00a0: la moyenne du domaine rapportait ce que vous rentrez \u00e0 la surface <b>enti\u00e8re</b> des parcelles. Elle la rapporte d\u00e9sormais \u00e0 <b>ce qui vous reste</b>. Deux chiffres cohabitent maintenant, et c\u2019est voulu\u00a0: la <b>ligne d\u2019une parcelle</b> montre tout son raisin sur toute sa surface \u2014 c\u2019est ce que l\u2019arr\u00eat\u00e9 plafonne, quel que soit l\u2019acheteur\u00a0; la <b>moyenne du domaine</b> montre ce qui remplit votre cave." },
    { emoji: 'alerte', titre: 'Une surface vendue non renseign\u00e9e est d\u00e9sormais annonc\u00e9e',
      desc: "Si plusieurs destinations d\u2019une m\u00eame parcelle n\u2019ont pas de surface achet\u00e9e saisie, l\u2019application partage la surface <b>au prorata des kilos</b> \u2014 ce qui suppose un rendement identique partout. C\u2019est une hypoth\u00e8se, pas une mesure. Le chiffre sort quand m\u00eame, mais pr\u00e9c\u00e9d\u00e9 d\u2019un \u00ab \u2248 \u00bb, et l\u2019\u00e9cran <b>compte les parcelles concern\u00e9es</b> pour que vous sachiez o\u00f9 compl\u00e9ter. Le bilan de campagne imprim\u00e9 porte la m\u00eame r\u00e9serve." }
  ] },
  { v: '6.90', items: [
    { emoji: 'balance', titre: 'Le rendement moyen ne comptait pas votre raisin vendu',
      desc: "Le chiffre du haut d\u2019\u00e9cran additionnait le vin <b>log\u00e9 au domaine</b> et le divisait par la surface <b>totale</b> r\u00e9colt\u00e9e. Or le raisin vendu ne passe jamais en cuve\u00a0: sur une vendange o\u00f9 <b>9\u00a0370\u00a0kg sur 29\u00a0t</b> partent chez un acheteur, un tiers de la r\u00e9colte sortait du calcul <b>en gardant sa surface au d\u00e9nominateur</b>. La moyenne tombait \u00e0 13,7\u00a0hL/ha pendant que les parcelles juste en dessous annon\u00e7aient 24 \u00e0 48. <b>Vendre son raisin ne fait pas baisser son rendement.</b> La moyenne agr\u00e8ge d\u00e9sormais exactement les m\u00eames parcelles que la liste, et tombe donc dans sa fourchette." },
    { emoji: 'oeil', titre: 'Une parcelle sans surface ne se glisse plus dans la moyenne',
      desc: "Ses kilos comptaient au num\u00e9rateur sans que sa surface compte au d\u00e9nominateur\u00a0: elle <b>gonflait</b> le rendement de tout le domaine. Elle est maintenant \u00e9cart\u00e9e des deux c\u00f4t\u00e9s, et l\u2019\u00e9cran <b>dit combien</b> l\u2019ont \u00e9t\u00e9 plut\u00f4t que de les faire dispara\u00eetre en silence." }
  ] },
  { v: '6.89', items: [
    { emoji: 'etiquette', titre: 'D\u00e9clarez vos appellations, et le plafond se pose une seule fois',
      desc: "Un arr\u00eat\u00e9 ne vise pas une parcelle, il vise une <b>appellation</b>. <b>R\u00e9glages \u203a Domaine \u203a Appellations</b> vous laisse d\u00e9clarer les v\u00f4tres, poser leur rendement maximum <b>pour chaque mill\u00e9sime</b>, et y rattacher vos parcelles d\u2019une liste d\u00e9roulante. Un plafond pos\u00e9 directement sur une parcelle reste <b>prioritaire</b> : un r\u00e9glage g\u00e9n\u00e9ral ne d\u00e9fait jamais une saisie faite \u00e0 la main. Renommer une appellation emm\u00e8ne ses parcelles avec elle ; la supprimer vous dit d\u2019abord combien en perdront le rattachement." },
    { emoji: 'balance', titre: 'Le rendement moyen affichait \u00ab 0 hL/ha \u00bb alors que rien n\u2019\u00e9tait mesur\u00e9',
      desc: "Sur <b>Pilotage \u203a Cave \u203a Le mill\u00e9sime</b>, le rendement moyen ne divisait que le volume <b>d\u00e9cuv\u00e9</b> \u2014 nul tant qu\u2019aucune cuve n\u2019est termin\u00e9e. La carte annon\u00e7ait donc <b>0 hL/ha</b> juste sous un bandeau disant \u00ab 162 hL en cuve \u00bb, et juste au-dessus de parcelles \u00e0 44 hL/ha. <b>Un z\u00e9ro a l\u2019aplomb d\u2019un fait</b> : il se croit. Le chiffre inclut d\u00e9sormais ce qui est encore en cuve, s\u2019affiche pr\u00e9c\u00e9d\u00e9 d\u2019un \u00ab \u2248 \u00bb tant que tout n\u2019est pas d\u00e9cuv\u00e9, et dit \u00ab mesur\u00e9 au d\u00e9cuvage \u00bb quand il n\u2019y a rien \u00e0 annoncer." },
    { emoji: 'document', titre: 'Le bilan de campagne et le Pilotage donnaient deux rendements diff\u00e9rents',
      desc: "Le document <b>Bilan de campagne</b> estimait le rendement moyen d\u2019apr\u00e8s les kilos pendant que le Pilotage divisait le volume d\u00e9cuv\u00e9 : deux chiffres pour une seule grandeur, sans que rien ne le dise. Ils lisent maintenant <b>le m\u00eame calcul</b>, et le document imprim\u00e9 pr\u00e9cise lui aussi si le chiffre est mesur\u00e9 ou estim\u00e9 \u2014 il se relit des ann\u00e9es plus tard, sans l\u2019\u00e9cran \u00e0 c\u00f4t\u00e9." }
  ] },
  { v: '6.88', items: [
    { emoji: 'balance', titre: 'Le plafond de rendement appartient au mill\u00e9sime, plus \u00e0 la parcelle',
      desc: "Le <b>rendement maximum de l\u2019appellation</b> ne se posait qu\u2019<b>une fois par parcelle</b>, sans ann\u00e9e\u00a0: le r\u00e9gler pour 2026 r\u00e9\u00e9crivait 2025 et 2024, en silence, sur un \u00e9cran qui affichait pourtant un mill\u00e9sime. Or ce plafond est fix\u00e9 <b>par arr\u00eat\u00e9, campagne par campagne</b>. Chaque mill\u00e9sime a maintenant le sien. <b>Rien n\u2019est \u00e0 ressaisir</b>\u00a0: une valeur pos\u00e9e avant cette mise \u00e0 jour continue de servir partout, annonc\u00e9e comme <b>h\u00e9rit\u00e9e</b> \u2014 elle n\u2019a \u00e9t\u00e9 v\u00e9rifi\u00e9e contre l\u2019arr\u00eat\u00e9 d\u2019aucune ann\u00e9e, autant le dire. Corrigez-la mill\u00e9sime par mill\u00e9sime, et validez \u00e0 vide pour retirer celui d\u2019une ann\u00e9e." },
    { emoji: 'raisin', titre: 'Poser un plafond depuis l\u2019\u00e9cran qui montre lesquels manquent',
      desc: "<b>Pilotage \u203a Cave \u203a Le mill\u00e9sime</b> listait vos parcelles \u00ab\u00a0plafond non renseign\u00e9\u00a0\u00bb et vous renvoyait \u00ab\u00a0depuis Le mill\u00e9sime\u00a0\u00bb\u2026 alors que l\u2019\u00e9cran o\u00f9 vous \u00e9tiez porte <b>exactement ce nom</b>. Le renvoi d\u00e9signait une autre page, et l\u2019option n\u2019existait nulle part sous vos yeux. <b>Touchez une parcelle</b>\u00a0: le plafond se pose l\u00e0, sur le mill\u00e9sime affich\u00e9. Le chemin complet est \u00e9crit quand le geste n\u2019est pas possible sur place." },
    { emoji: 'liste', titre: 'Un chiffre pos\u00e9 une fois, propos\u00e9 pour toutes les autres',
      desc: "Un arr\u00eat\u00e9 fixe le m\u00eame rendement pour toute une appellation\u00a0: taper 45 quarante-cinq fois n\u2019est pas une saisie, c\u2019est une corv\u00e9e \u2014 et \u00e7a explique \u00e0 soi seul qu\u2019un domaine n\u2019ait jamais eu un seul plafond renseign\u00e9. Apr\u00e8s la premi\u00e8re pose, l\u2019application propose de porter la valeur sur les parcelles du mill\u00e9sime qui n\u2019en ont <b>aucun</b>, en les <b>nommant</b> avant que vous ne disiez oui. Celles qui ont d\u00e9j\u00e0 un plafond ne sont jamais touch\u00e9es." }
  ] },
  { v: '6.87', items: [
    { emoji: 'graphique', titre: 'Les courbes de la cave, r\u00e9unies dans le Pilotage',
      desc: "<b>Pilotage \u203a Cave</b> gagne un quatri\u00e8me \u00e9cran, <b>Les courbes</b>\u00a0: le parcours d\u2019un vin, de la maturit\u00e9 \u00e0 la bouteille, sur une seule page. On y retrouve le <b>comparatif des cuves</b> du cahier de cuverie \u2014 toutes les densit\u00e9s align\u00e9es sur <b>leur propre jour d\u2019encuvage</b> \u2014 accompagn\u00e9 d\u2019un trac\u00e9 neuf des <b>temp\u00e9ratures</b> sur le m\u00eame rail de jours\u00a0: un palier de densit\u00e9 s\u2019explique souvent l\u00e0, douze degr\u00e9s cinq jours durant, c\u2019est une mac\u00e9ration et pas une fermentation qui tra\u00eene. La malo s\u2019affiche d\u00e9sormais sur un <b>vrai axe de temps</b>, en mois depuis l\u2019entonnage\u00a0: deux analyses \u00e0 six semaines d\u2019\u00e9cart ne dessinent plus la m\u00eame pente que deux analyses \u00e0 trois jours. <b>Aucune temp\u00e9rature n\u2019est enregistr\u00e9e en \u00e9levage</b>\u00a0: la courbe s\u2019arr\u00eate au d\u00e9cuvage, et l\u2019\u00e9cran le dit plut\u00f4t que de vous laisser chercher." },
    { emoji: 'oeil', titre: 'Les onglets de la Cave affichaient le nom de leur ic\u00f4ne',
      desc: "Les boutons de <b>Pilotage \u203a Cave</b> \u00e9crivaient, en toutes lettres, \u00ab\u00a0chrono Ce qui presse\u00a0\u00bb, \u00ab\u00a0raisin Le mill\u00e9sime\u00a0\u00bb et \u00ab\u00a0barrique Le parc\u00a0\u00bb. Les ic\u00f4nes existaient\u00a0; elles n\u2019\u00e9taient simplement pas appel\u00e9es. Elles s\u2019affichent." },
    { emoji: 'eprouvette', titre: 'L\u2019export du Chai annon\u00e7ait un degr\u00e9 d\u2019alcool \u00e0 la place de l\u2019acidit\u00e9 volatile',
      desc: "Dans l\u2019export des op\u00e9rations, la valeur d\u2019<b>acidit\u00e9 volatile</b> d\u2019une analyse sortait sous le nom \u00ab\u00a0Alcool\u00a0\u00bb et en \u00ab\u00a0%\u00a0vol.\u00a0\u00bb, au lieu de <b>g/L</b>. Le chiffre \u00e9tait le bon, son nom ne l\u2019\u00e9tait pas \u2014 et un registre de cave se relit parfois des ann\u00e9es plus tard. Les autres \u00e9crans disaient d\u00e9j\u00e0 juste. La puce d\u2019analyse porte aussi son unit\u00e9, comme celle de l\u2019acide malique \u00e0 c\u00f4t\u00e9." },
    { emoji: 'graphique', titre: 'Deux cuves finissant \u00e0 la m\u00eame densit\u00e9 \u00e9crivaient leur nom l\u2019un sur l\u2019autre',
      desc: "Sur le comparatif du cahier de cuverie, les noms pos\u00e9s au bout des courbes s\u2019\u00e9cartaient bien\u2026 sauf quand la pile touchait le bas du cadre, o\u00f9 le dernier \u00e9tait rabattu sur le bord. Or les cuves <b>finissent toutes s\u00e8ches</b>\u00a0: c\u2019\u00e9tait donc le cas le plus courant, et le graphe pouvait se tromper sur qui est qui. La pile remonte d\u00e9sormais en bloc." }
  ] },
  { v: '6.86', items: [
    { emoji: 'graphique', titre: 'Un comparatif de toutes les cuves, align\u00e9es sur leur jour d\u2019encuvage',
      desc: "Le cahier de cuverie s\u2019ouvre maintenant sur un <b>comparatif</b>\u00a0: toutes les cin\u00e9tiques sur un m\u00eame graphe, mais <b>en jours depuis l\u2019encuvage</b> plut\u00f4t qu\u2019en dates. Sur un calendrier, une cuve entr\u00e9e le 16 et une autre le 24 n\u2019ont aucun point commun\u00a0; align\u00e9es sur leur propre J0, elles se superposent et se comparent. Chaque courbe porte son nom au bout et un <b>point plein \u00e0 son d\u00e9part</b>. Dessous, un tableau r\u00e9pond au \u00ab\u00a0pourquoi\u00a0\u00bb\u00a0: densit\u00e9 et sucre de d\u00e9part, degr\u00e9 potentiel, <b>sucre \u00e0 la vigne</b> relev\u00e9 lors des derni\u00e8res analyses d\u2019avant encuvage, temp\u00e9rature moyenne et maxi, jour d\u2019atteinte du vin sec et vitesse moyenne. Le classement se fait sur le <b>jour du vin sec</b>, pas sur la vitesse\u00a0: une pente mesur\u00e9e sur trois jours n\u2019est pas comparable \u00e0 une pente mesur\u00e9e sur dix." }
  ] },
  { v: '6.85', items: [
    { emoji: 'parcours', titre: 'La courbe montre les changements d\u2019\u00e9tat de la cuve',
      desc: "Une remont\u00e9e de la courbe s\u2019expliquait d\u00e9j\u00e0 par une chaptalisation, dat\u00e9e sur le graphe. Un <b>palier</b>, lui, ne s\u2019expliquait pas\u00a0: cinq jours \u00e0 12\u00a0\u00b0C en mac\u00e9ration pr\u00e9fermentaire ressemblaient \u00e0 une fermentation qui tra\u00eene. Chaque <b>passage</b> de la cuve \u2014 MPF, FA, d\u00e9cuvage, FML \u2014 pose maintenant un <b>trait vertical gris tiret\u00e9</b> sur la courbe, nomm\u00e9 dans la marge, et la l\u00e9gende les date en jours. Sur l\u2019\u00e9cran du Cuvier comme dans le cahier de cuverie. Une cuve dont les passages n\u2019ont jamais \u00e9t\u00e9 dat\u00e9s n\u2019a aucun trait\u00a0: l\u2019application pr\u00e9f\u00e8re ne rien dessiner qu\u2019une date invent\u00e9e." }
  ] },
  { v: '6.84', items: [
    { emoji: 'graphique', titre: 'Le cahier de cuverie imprime la courbe de fermentation',
      desc: "Le document sortait vos relev\u00e9s en tableau\u00a0: des dizaines de lignes de chiffres, o\u00f9 l\u2019allure de la fermentation ne se voyait pas. Chaque cuve porte maintenant, au-dessus de son tableau, <b>la courbe de l\u2019\u00e9cran</b> \u2014 densit\u00e9 corrig\u00e9e \u00e0 20\u00a0\u00b0C en trait plein, <b>temp\u00e9rature</b> en pointill\u00e9 sur son propre axe chiffr\u00e9, un rep\u00e8re en haut pour chaque op\u00e9ration dat\u00e9e, et le seuil du vin sec. Une remont\u00e9e de la courbe se lit alors pour ce qu\u2019elle est\u00a0: la chaptalisation, \u00e0 la date o\u00f9 elle a \u00e9t\u00e9 faite. Une cuve qui a moins de trois relev\u00e9s de densit\u00e9 garde son tableau seul." }
  ] },
  { v: '6.83', items: [
    { emoji: 'bouclier', titre: 'La fen\u00eatre de confirmation s\u2019ouvrait derri\u00e8re la feuille',
      desc: "En corrigeant un poids de caisse, la fen\u00eatre \u00ab\u00a0Corriger 36 r\u00e9coltes\u00a0?\u00a0\u00bb s\u2019ouvrait <b>derri\u00e8re</b> l\u2019\u00e9cran du Cuvier\u00a0: invisible, impossible \u00e0 atteindre, et le clic \u00e0 c\u00f4t\u00e9 annulait tout sans rien enregistrer. <b>La correction ne partait jamais.</b> Le d\u00e9faut touchait toutes les confirmations et toutes les saisies de valeur ouvertes depuis un \u00e9cran du Cuvier \u2014 supprimer une r\u00e9colte, une cuve, un relev\u00e9, un client \u2014 ainsi que le tiroir du Pilotage. Tout dialogue passe maintenant <b>au-dessus</b> de ce qu\u2019il interrompt." }
  ] },
  { v: '6.82', items: [
    { emoji: 'fiole', titre: 'Les hectolitres d\u2019une cuve se calculent enfin sur vos kilos',
      desc: "Le volume estim\u00e9 d\u2019une cuve venait de <b>ses caisses multipli\u00e9es par le poids du r\u00e9glage</b>. Sur un domaine qui a des caisses de 25, de 20 et de 12\u00a0kg, ce calcul ne pouvait pas tomber juste\u00a0: sur une vendange r\u00e9elle, <b>3\u00a0541\u00a0kg d\u2019\u00e9cart</b> entre ce que disait le Cuvier et ce que disaient les jauges. Tout ce qui affiche un hectolitre estim\u00e9 \u2014 la jauge de remplissage, les apports par parcelle, les couches d\u2019une cuve, la proposition de f\u00fbts au d\u00e9cuvage, le parcours de la r\u00e9colte \u2014 lit d\u00e9sormais <b>le poids r\u00e9el de chaque apport</b>." },
    { emoji: 'balance', titre: 'Le correcteur de poids ne se trompe plus de ligne',
      desc: "Un poids r\u00e9el tap\u00e9 pour les caisses de 12 restait affich\u00e9 quand on revenait sur celles de 25, et l\u2019aper\u00e7u annon\u00e7ait alors un \u00e9cart de plusieurs tonnes avec l\u2019aplomb d\u2019un chiffre juste. Il <b>se vide maintenant</b> d\u00e8s que vous changez de ligne ou de mill\u00e9sime. Et une correction qui d\u00e9passe <b>40\u00a0% du poids d\u2019une caisse</b> est signal\u00e9e avant que vous n\u2019appuyiez\u00a0: c\u2019est possible, mais \u00e7a m\u00e9rite un second regard." },
    { emoji: 'bouclier', titre: 'Une correction qui ne trouve rien ne laisse plus rien derri\u00e8re elle',
      desc: "Quand le correcteur ne trouvait <b>aucun apport</b> au poids demand\u00e9, il repartait sans rien enregistrer \u2014 mais il avait d\u00e9j\u00e0 modifi\u00e9 le <b>poids par d\u00e9faut</b> et les <b>fiches client</b> au passage. Ces changements orphelins partaient ensuite dans le premier enregistrement venu, depuis n\u2019importe quel \u00e9cran, sans que rien ne le dise. Une ex\u00e9cution qui n\u2019aboutit pas laisse maintenant tout exactement en place." }
  ] },
  { v: '6.81', items: [
    { emoji: 'balance', titre: 'Corriger un poids de caisse sur toute une vendange',
      desc: "Quand ce n\u2019est pas la saisie qui s\u2019est tromp\u00e9e mais <b>la caisse</b> \u2014 des caisses annonc\u00e9es \u00e0 25\u00a0kg qui en pesaient 20 \u2014 il fallait rouvrir les r\u00e9coltes une par une, sans aucun moyen de voir laquelle avait \u00e9t\u00e9 oubli\u00e9e. <b>R\u00e9glages du Cuvier \u203a Corriger un poids d\u00e9j\u00e0 saisi</b> montre les poids r\u00e9ellement en place sur un mill\u00e9sime, ce qu\u2019ils p\u00e8sent, et applique la correction d\u2019un coup. Vous voyez <b>avant</b> ce que la campagne va devenir, destinataire par destinataire. Les <b>rendements kg/ha et hL/ha</b> de chaque parcelle sont recalcul\u00e9s dans la foul\u00e9e, et les fiches client comme le poids par d\u00e9faut peuvent suivre. Les litres rendus par un acheteur, eux, ne bougent pas\u00a0: c\u2019est sa mesure, pas la v\u00f4tre." },
    { emoji: 'graphique', titre: 'Corriger une livraison met enfin le rendement de la parcelle \u00e0 jour',
      desc: "En reprenant les caisses ou le poids d\u2019un chargement depuis <b>Livraisons et bons</b>, les kilos changeaient au Cuvier mais le <b>rendement de la parcelle</b> restait \u00e0 son ancienne valeur \u2014 et c\u2019est celle-l\u00e0 que le Pilotage lit pour son prix de revient. Les deux \u00e9crans avaient l\u2019air justes chacun de son c\u00f4t\u00e9. Ils disent maintenant la m\u00eame chose." },
    { emoji: 'raisin', titre: 'Le bilan de campagne ne pesait pas vos caisses',
      desc: "Le document <b>Bilan de campagne</b> comptait <b>toutes</b> les caisses \u00e0 25\u00a0kg, quel que soit le poids saisi. Une caisse de 12\u00a0kg partie chez un n\u00e9gociant y pesait donc plus du double de son poids r\u00e9el, et le rendement de la parcelle avec elle. Il lit d\u00e9sormais le poids de chaque apport." }
  ] },
  { v: '6.80', items: [
    { emoji: 'parcours', titre: 'Changer l\u2019\u00e9tape d\u2019une cuve garde la date du changement',
      desc: "Une cuve qui passait de <b>mac\u00e9ration pr\u00e9fermentaire \u00e0 froid</b> \u00e0 <b>fermentation alcoolique</b> perdait tout ce qui pr\u00e9c\u00e9dait\u00a0: elle avait l\u2019air d\u2019\u00eatre en fermentation <b>depuis l\u2019encuvage</b>. D\u00e9sormais, chaque passage est <b>dat\u00e9</b>. Quand vous changez l\u2019\u00e9tape dans la fiche de la cuve, un champ <b>\u00ab\u00a0Depuis le\u00a0\u00bb</b> appara\u00eet, r\u00e9gl\u00e9 sur aujourd\u2019hui\u00a0\u2014 changez-le si vous notez le passage le lendemain matin. La frise des \u00e9tapes porte maintenant les dates, et la cuve annonce <b>\u00ab\u00a0FA depuis le 16/09\u00a0\u00b7 3\u00a0j\u00a0\u00bb</b>." },
    { emoji: 'crayon', titre: 'Le parcours d\u2019une cuve se corrige, \u00e9tape par \u00e9tape',
      desc: "D\u00e9pliez une cuve\u00a0: sous la frise, <b>Parcours</b> liste tous ses passages avec leur dur\u00e9e. Un crayon par ligne rouvre celui que vous d\u00e9signez\u00a0\u2014 date et \u00e9tape\u00a0\u2014 et une \u00e9tape se supprime. Le bouton <b>Changer l\u2019\u00e9tape</b> fait la m\u00eame chose depuis le d\u00e9tail de la cuve. Une date <b>avant l\u2019encuvage</b> ou <b>dans le futur</b> est refus\u00e9e. Les cuves d\u2019avant cette mise \u00e0 jour n\u2019ont pas de date de passage\u00a0: la frise \u00e9crit un <b>tiret</b> plut\u00f4t que d\u2019inventer une date. Posez-la \u00e0 la main si vous la connaissez." },
    { emoji: 'chrono', titre: 'La fin de fermentation ne compte plus les jours de froid',
      desc: "Cinq jours de mac\u00e9ration \u00e0 froid puis deux jours de fermentation, et l\u2019application croyait la cuve partie depuis sept jours\u00a0: elle ouvrait une <b>projection de fin</b> sur une fermentation qui venait \u00e0 peine de commencer. Elle compte maintenant les jours <b>depuis le d\u00e9but de la FA</b>. Et le <b>cahier de cuverie</b> imprime la dur\u00e9e de mac\u00e9ration <b>r\u00e9ellement faite</b>\u00a0; quand elle n\u2019est pas connue, il \u00e9crit la dur\u00e9e <b>pr\u00e9vue</b> et le dit." }
  ] },
  { v: '6.79', items: [
    { emoji: 'raisin', titre: 'Le Cuvier dit ce qu\u2019il reste \u00e0 rentrer',
      desc: "L\u2019\u00e9cran <b>R\u00e9coltes</b> ne savait montrer que ce qui \u00e9tait <b>d\u00e9j\u00e0</b> vendang\u00e9\u00a0: pour savoir ce qu\u2019il restait, il fallait comparer de t\u00eate avec la liste des parcelles. Une carte <b>\u00ab\u00a0Encore sur pied\u00a0\u00bb</b> s\u2019affiche maintenant en haut de l\u2019\u00e9cran\u00a0: les parcelles <b>sans aucune r\u00e9colte saisie</b> cette campagne, avec leur surface, leur c\u00e9page et leur <b>derni\u00e8re analyse de maturit\u00e9</b>\u00a0\u2014 <b>la plus m\u00fbre en premier</b>. Touchez-en une\u00a0: la nouvelle r\u00e9colte s\u2019ouvre avec la parcelle d\u00e9j\u00e0 choisie. Quand tout est rentr\u00e9, la carte le dit." },
    { emoji: 'carte', titre: 'Une parcelle arrach\u00e9e n\u2019est plus annonc\u00e9e \u00ab\u00a0encore sur pied\u00a0\u00bb',
      desc: "Dans <b>Le mill\u00e9sime</b>, la ligne \u00ab\u00a0Encore sur pied\u00a0\u00bb comptait aussi les parcelles <b>arrach\u00e9es</b>\u00a0\u2014 des vignes qui n\u2019existent plus. \u00c0 l\u2019inverse, une parcelle dont la <b>surface n\u2019est pas renseign\u00e9e</b> en \u00e9tait retir\u00e9e sans un mot\u00a0: elle manquait \u00e0 l\u2019appel sans qu\u2019on puisse le deviner. Les deux \u00e9crans comptent d\u00e9sormais de la m\u00eame fa\u00e7on." },
    { emoji: 'loupe', titre: 'Une parcelle rentr\u00e9e n\u2019est plus r\u00e9clam\u00e9e \u00e0 cause d\u2019une majuscule',
      desc: "Le nom de parcelle d\u2019une r\u00e9colte peut avoir \u00e9t\u00e9 tap\u00e9 \u00e0 la main. \u00ab\u00a0les grandes vignes\u00a0\u00bb et \u00ab\u00a0Les Grandes Vignes\u00a0\u00bb sont maintenant reconnus comme la <b>m\u00eame parcelle</b>\u00a0: personne n\u2019est envoy\u00e9 vendanger une vigne d\u00e9j\u00e0 vide. Et si une r\u00e9colte porte un nom qui n\u2019existe pas au parcellaire, la carte le <b>signale</b> au lieu de laisser un compte inexplicable." }
  ] },
  { v: '6.78', items: [
    { emoji: 'equipe', titre: 'L\u2019effectif au pic ne r\u00e9clame plus du renfort pour une semaine d\u00e9j\u00e0 faite',
      desc: "Sur un exercice, la semaine la plus charg\u00e9e de l\u2019ann\u00e9e est presque toujours la <b>vendange</b>. Une fois qu\u2019elle \u00e9tait pass\u00e9e, le Pilotage continuait pourtant d\u2019afficher son manque en orange sur l\u2019\u00e9cran du jour\u00a0: \u00ab\u00a0il manque 4 personnes au pic\u00a0\u00bb, sur un travail termin\u00e9, sans un mot pour dire que c\u2019\u00e9tait derri\u00e8re. <b>Aujourd\u2019hui</b> et <b>Capacit\u00e9 vs charge</b> regardent maintenant le <b>pic \u00e0 venir</b> — la semaine la plus charg\u00e9e parmi celles qui restent. Le pic de l\u2019exercice n\u2019est pas perdu\u00a0: il est \u00e9crit en bas de la carte, dat\u00e9, et marqu\u00e9 <b>d\u00e9j\u00e0 pass\u00e9</b>. L\u2019onglet <b>L\u2019ann\u00e9e</b>, lui, continue de le montrer en grand — c\u2019est son r\u00f4le." },
    { emoji: 'balance', titre: 'Le manque au pic se compte enfin sur les heures r\u00e9ellement disponibles',
      desc: "Le chiffre en face du besoin \u00e9tait un comptage de t\u00eates \u00e9tal\u00e9 sur les <b>sept jours</b> de la semaine. Une \u00e9quipe engag\u00e9e du samedi au mercredi y pesait cinq septi\u00e8mes, alors que la semaine ne donne du travail que du lundi au vendredi\u00a0: on lisait \u00ab\u00a034,4 personnes\u00a0\u00bb, un effectif qui n\u2019a exist\u00e9 <b>aucun jour</b> de cette semaine-l\u00e0. La carte compare d\u00e9sormais le besoin aux <b>heures que l\u2019\u00e9quipe peut vraiment faire</b>\u00a0: horaire de chacun, cong\u00e9s, absences et contrats compris. Et elle donne l\u2019autre lecture juste en dessous, celle qui sert \u00e0 organiser une tourn\u00e9e\u00a0: le nombre de <b>personnes dans les rangs au plus fort de la semaine</b>." },
    { emoji: 'calendrier', titre: 'La semaine du pic porte son ann\u00e9e',
      desc: "\u00ab\u00a0Semaine du 29 ao\u00fbt\u00a0\u00bb ne disait pas s\u2019il s\u2019agissait de la vendange qu\u2019on venait de faire ou de celle de l\u2019an prochain — un exercice traverse deux ann\u00e9es civiles. L\u2019ann\u00e9e est maintenant \u00e9crite partout o\u00f9 une semaine est nomm\u00e9e." }
  ] },
  /* ⚠ 6.76 n'a jamais été déployé (CI rouge) : ses deux items remontent ici.
     Un bloc de tête SANS item est refusé par mv-whatsnew-check — bumper
     APP_VERSION, c'est s'engager à annoncer quelque chose. */
  { v: '6.77', items: [
    { emoji: 'cadenas', titre: 'Le lien \u00ab\u00a0Mot de passe oubli\u00e9\u00a0?\u00a0\u00bb r\u00e9pond de nouveau', desc: "Sur l\u2019\u00e9cran de connexion, ce lien ne faisait <b>rien du tout</b>\u00a0: on cliquait, l\u2019\u00e9cran ne bougeait pas, et il fallait passer par l\u2019administrateur du domaine pour repartir. Il ouvre \u00e0 nouveau la demande de lien de r\u00e9initialisation." },
    { emoji: 'eprouvette', titre: 'Le bouton \u00ab\u00a0nouveau traitement\u00a0\u00bb ouvre enfin la saisie', desc: "Sur la page Phyto, le bouton <b>+</b> en bas \u00e0 droite n\u2019ouvrait aucune fen\u00eatre. La liste des <b>stades ph\u00e9nologiques</b> \u2014 d\u00e9bourrement, floraison, v\u00e9raison\u2026 \u2014 manquait \u00e0 l\u2019appel au moment d\u2019afficher le formulaire, et la saisie s\u2019arr\u00eatait l\u00e0, sans un mot. Le parcours complet est de retour, stade compris." }
  ] },
  { v: '6.75', items: [
    { emoji: 'nuage', titre: 'Ce que vous saisissez ne se perd plus quand le r\u00e9seau l\u00e2che', desc: "Au fond de la cave ou dans les vignes, une saisie pouvait dispara\u00eetre\u00a0: l\u2019\u00e9cran disait \u00ab\u00a0enregistr\u00e9\u00a0\u00bb, et au red\u00e9marrage de l\u2019application elle n\u2019\u00e9tait plus l\u00e0. Quand le t\u00e9l\u00e9phone n\u2019arrivait pas \u00e0 renouveler votre connexion, l\u2019application croyait \u00e0 un refus et <b>jetait la saisie</b>. Elle est d\u00e9sormais <b>gard\u00e9e sur le t\u00e9l\u00e9phone et repart toute seule</b> d\u00e8s que le r\u00e9seau revient. R\u00e9colte, relev\u00e9, cong\u00e9, acompte\u00a0: rien ne dispara\u00eet." },
    { emoji: 'check', titre: 'Un enregistrement annonc\u00e9 est un enregistrement fait', desc: "Le message vert partait <b>avant</b> la r\u00e9ponse du serveur\u00a0: vous pouviez lire \u00ab\u00a0R\u00e9colte enregistr\u00e9e\u00a0\u00bb sur une \u00e9criture qui n\u2019\u00e9tait jamais partie. Il attend maintenant la confirmation. Si le r\u00e9seau tra\u00eene, l\u2019\u00e9cran dit <b>\u00ab\u00a0en attente de r\u00e9seau, envoi automatique\u00a0\u00bb</b> au lieu de vous laisser croire que c\u2019est fait. Corrig\u00e9 partout\u00a0: <b>Planning, Cuvier, Chai, R\u00e9glages, Tracteur</b>." },
    { emoji: 'cadenas', titre: 'Un refus se lit en fran\u00e7ais, et votre saisie est conserv\u00e9e', desc: "Quand une \u00e9criture est vraiment refus\u00e9e, le bandeau affichait un nom technique en travers de l\u2019\u00e9cran. Il dit maintenant <b>quel \u00e9cran est concern\u00e9</b>, et la saisie est gard\u00e9e sur l\u2019appareil\u00a0: vous la retrouvez dans <b>R\u00e9glages \u203a App \u203a Saisies non enregistr\u00e9es</b>, pour la <b>renvoyer</b> ou l\u2019<b>abandonner</b>. <b>Attention</b>\u00a0: renvoyer remplace tout l\u2019\u00e9cran concern\u00e9 par son \u00e9tat au moment du refus\u00a0\u2014 l\u2019application vous le rappelle avant. Et les \u00e9crans de vendange pr\u00e9viennent <b>avant</b> la saisie quand un compte est en lecture seule, au lieu de laisser tout taper pour rien." }
  ] },
  { v: '6.74', items: [
    { emoji: 'chrono', titre: 'Les dimanches et les jours f\u00e9ri\u00e9s travaill\u00e9s se majorent tout seuls', desc: "Un dimanche de vendange ou un 1\u1d49\u02b3 mai pass\u00e9 \u00e0 la vigne se comptait comme n\u2019importe quel autre jour\u00a0: il fallait reprendre la feuille \u00e0 la main pour retrouver ce qui \u00e9tait major\u00e9. L\u2019application le fait maintenant \u00e0 votre place \u2014 <b>50\u202f% le dimanche, 100\u202f% un jour f\u00e9ri\u00e9</b>, et vous r\u00e9glez les deux taux dans <b>Planning \u203a Le cadre</b>. Seules les heures <b>r\u00e9ellement faites</b> comptent\u00a0: un f\u00e9ri\u00e9 ch\u00f4m\u00e9 reste pay\u00e9 sans majoration, un cong\u00e9 ou une r\u00e9cup ne majorent rien." },
    { emoji: 'euro', titre: 'La majoration va l\u00e0 o\u00f9 vont vos heures sup', desc: "Si votre domaine <b>paie</b> les heures au-del\u00e0 du planning, la majoration s\u2019imprime sur la feuille d\u2019heures, pr\u00eate pour la paie. S\u2019il les fait <b>r\u00e9cup\u00e9rer en repos</b>, elle s\u2019ajoute au compteur d\u2019heures. C\u2019est le r\u00e9glage «\u00a0Heures au-del\u00e0 du planning du mois\u00a0» qui d\u00e9cide\u00a0: vous n\u2019avez rien de plus \u00e0 poser." },
    { emoji: 'calendrier', titre: 'Un f\u00e9ri\u00e9 qui tombe un dimanche ne compte qu\u2019une fois', desc: "Le 1\u1d49\u02b3 novembre 2026 tombe un dimanche. Ce jour-l\u00e0 prend le <b>taux le plus fort des deux</b>, jamais les deux additionn\u00e9s. Le samedi n\u2019est pas concern\u00e9. Le calcul d\u00e9marre en <b>janvier 2026</b>\u00a0: les mois d\u00e9j\u00e0 pass\u00e9s en paie avant cette date ne bougent pas. Et les heures de majoration ne comptent pas dans les 1\u202f607\u202fh\u00a0\u2014 c\u2019est du temps pay\u00e9, pas du temps pass\u00e9 \u00e0 la vigne." }
  ] },
  { v: '6.73', items: [
    { emoji: 'liste', titre: 'Le Cuvier se lit d\u2019un coup d\u2019\u0153il', desc: "Une cuve prenait un \u00e9cran entier\u00a0: il fallait faire d\u00e9filer dix-sept hauteurs de t\u00e9l\u00e9phone pour douze cuves. La liste ne montre plus que l\u2019essentiel \u2014 <b>rep\u00e8re de cuverie, nom, densit\u00e9, temp\u00e9rature, avancement</b> \u2014 et une cuve s\u2019ouvre au doigt quand vous en avez besoin. <b>Neuf cuves tiennent \u00e0 l\u2019\u00e9cran</b> au lieu d\u2019une." },
    { emoji: 'boussole', titre: 'Vos cuves ne bougent plus de place', desc: "La liste \u00e9tait class\u00e9e par retard\u00a0: <b>mesurer une cuve la renvoyait en bas</b>, et l\u2019ordre changeait tous les jours. Elle suit d\u00e9sormais <b>l\u2019ordre de votre cuverie</b>, celui \u00e9crit sur les cuves. L\u2019urgence n\u2019a pas disparu \u2014 elle est dans le bandeau du haut et la pastille rouge, o\u00f9 elle se voit mieux. Tri par urgence ou par avancement d\u2019un doigt, recherche par nom ou par parcelle, et cinq filtres avec leur compte." },
    { emoji: 'carre', titre: 'Le plan de cuverie', desc: "Votre cave en vignettes\u00a0: chaque cuve dessin\u00e9e avec <b>son niveau et sa couleur d\u2019\u00e9tat</b>. Une cuve non mesur\u00e9e depuis la veille passe au rouge. Le bouton est en haut \u00e0 droite, \u00e0 c\u00f4t\u00e9 de celui de la liste." },
    { emoji: 'cuve', titre: 'Fusionner plusieurs cuves en une', desc: "Deux cuves, trois cuves, un seul vin. Les <b>raisins, les kilos et les parcelles suivent</b> vers la cuve d\u2019arriv\u00e9e\u00a0\u2014 une des cuves choisies, ou une cuve libre du parc. Les cuves de d\u00e9part quittent la liste et <b>lib\u00e8rent leur cuve</b>, mais gardent leurs relev\u00e9s et leurs op\u00e9rations sous leur nom d\u2019origine\u00a0: c\u2019est sous ce nom que le SO\u2082 a \u00e9t\u00e9 ajout\u00e9, et le registre doit le dire comme \u00e7a. Une ligne <b>Assemblage</b> s\u2019ajoute au registre des manipulations." }
  ] },
  { v: '6.72', items: [
    { emoji: 'fiole', titre: 'Tanins, enzymes et bentonite s\u2019enregistrent au Cuvier', desc: "Trois op\u00e9rations de plus sur une cuve de vinification, \u00e0 c\u00f4t\u00e9 du levurage et du nutriment. On choisit le <b>produit dans La R\u00e9serve</b>, une <b>dose</b>, un <b>volume</b>\u00a0\u2014 et la quantit\u00e9 r\u00e9elle s\u2019affiche pendant la saisie. L\u2019unit\u00e9 de dose suit le produit\u00a0: g/hL pour un sac, mL/hL pour un bidon. Les trois partent au <b>registre des manipulations</b>, famille Adjonctions, o\u00f9 le contr\u00f4le bio les attend." },
    { emoji: 'carton', titre: 'Ce qui part dans la cuve sort du stock', desc: "Un intrant \u0153no pos\u00e9 sur une cuve est <b>d\u00e9compt\u00e9 tout seul</b> du bilan mati\u00e8re de La R\u00e9serve\u00a0: rien \u00e0 ressaisir. Pendant la saisie, l\u2019\u00e9cran montre le stock avant et apr\u00e8s. <b>Un stock qui passe en n\u00e9gatif n\u2019emp\u00eache jamais d\u2019enregistrer</b>\u00a0\u2014 le tanin est d\u00e9j\u00e0 dans la cuve, c\u2019est la facture qui manque. L\u2019\u00e9cart se r\u00e9gularise plus tard, La R\u00e9serve le signale en attendant." },
    { emoji: 'balance', titre: 'Le volume dit toujours d\u2019o\u00f9 il vient', desc: "La quantit\u00e9 d\u2019un intrant se calcule sur un volume, et <b>la contenance d\u2019une cuve n\u2019est pas son contenu</b>. Tant que la cuve n\u2019est pas d\u00e9cuv\u00e9e, l\u2019\u00e9cran \u00e9crit <b>volume estim\u00e9</b>, le registre imprime <i>(estim\u00e9)</i>, et l\u2019alerte de stock n\u00e9gatif rappelle combien d\u2019adjonctions reposent sur une estimation\u00a0\u2014 pour ne pas chercher une facture qui n\u2019existe pas." }
  ] },
  { v: '6.71', items: [
    { emoji: 'crayon', titre: 'Corriger un relev\u00e9 de fermentation d\u00e9j\u00e0 enregistr\u00e9', desc: "Une densit\u00e9 not\u00e9e de travers, une date saisie la veille pour le lendemain\u00a0: il fallait vivre avec. Chaque cuve affiche maintenant <b>la liste de ses relev\u00e9s</b>, et un crayon sur chacun d\u2019eux \u2014 date, densit\u00e9, temp\u00e9rature, remontages, pigeages, note. Un relev\u00e9 peut aussi \u00eatre <b>supprim\u00e9</b>. La liste reste accessible sur une <b>cuve d\u00e9j\u00e0 d\u00e9cuv\u00e9e</b>\u00a0: c\u2019est souvent apr\u00e8s coup qu\u2019on s\u2019aper\u00e7oit d\u2019une erreur. Les <b>op\u00e9rations</b> de la cuve sont corrigeables de la m\u00eame fa\u00e7on, et toutes visibles \u2014 la liste ne s\u2019arr\u00eate plus \u00e0 la derni\u00e8re." },
    { emoji: 'thermometre', titre: 'Dire <i>comment</i> le froid a \u00e9t\u00e9 fait', desc: "Un refroidissement n\u2019enregistrait que la <b>temp\u00e9rature vis\u00e9e</b>. Il demande maintenant le <b>moyen</b>\u00a0: groupe de froid, \u00e9changeur, glace carbonique, azote liquide, CO\u2082 liquide, eau froide. Pour les trois qui se p\u00e8sent, une <b>quantit\u00e9 en kilos</b> \u2014 et pour la glace carbonique, l\u2019abaissement approximatif s\u2019affiche pendant la saisie (environ 1,4\u00a0\u00b0C par kilo et par hectolitre, un ordre de grandeur, pas une promesse). Le r\u00e9chauffement a sa propre liste\u00a0: ceinture, \u00e9changeur, thermoplongeur, remontage \u00e0 chaud. <b>Tout cela remonte au registre des manipulations</b>, o\u00f9 c\u2019est justement ce qui est attendu." },
    { emoji: 'cuve', titre: 'Les relev\u00e9s se rangent d\u00e9sormais par date, pas par ordre de saisie', desc: "Un relev\u00e9 rattrap\u00e9 le lendemain \u2014 le carnet rest\u00e9 au cuvier \u2014 se pla\u00e7ait <b>en bout de liste</b>, et tout ce qui lit \u00ab\u00a0le dernier relev\u00e9\u00a0\u00bb le croyait le plus r\u00e9cent\u00a0: la jauge d\u2019avancement, la courbe, la <b>fin de fermentation estim\u00e9e</b>, l\u2019alerte de temp\u00e9rature et le compteur \u00ab\u00a0X\u00a0jours sans relev\u00e9\u00a0\u00bb. Ils se remettent dans l\u2019ordre du temps tout seuls, <b>y compris sur vos saisies pass\u00e9es</b>, d\u00e8s l\u2019ouverture du Cuvier. Rien \u00e0 ressaisir." },
    { emoji: 'thermometre', titre: 'Une temp\u00e9rature de 0\u00a0\u00b0C n\u2019est plus effac\u00e9e', desc: "Saisir <b>0</b> dans la temp\u00e9rature d\u2019un relev\u00e9 revenait \u00e0 ne rien saisir du tout\u00a0\u2014 et la densit\u00e9 n\u2019\u00e9tait alors pas corrig\u00e9e \u00e0 20\u00a0\u00b0C. Le z\u00e9ro est une valeur comme une autre." }
  ] },
  { v: '6.70', items: [
    { emoji: 'balance', titre: 'Les rendements par parcelle \u00e9taient beaucoup trop \u00e9lev\u00e9s', desc: "Dans <b>Le mill\u00e9sime</b> et dans <b>Pilotage \u203a Cave</b>, le rendement de certaines parcelles annon\u00e7ait <b>deux \u00e0 trois fois</b> la r\u00e9alit\u00e9 \u2014 jusqu\u2019\u00e0 117 hL/ha sur une parcelle qui en avait fait 44. En cause\u00a0: le volume inscrit sur une cuve de vinification est sa <b>contenance</b>, celle qui se remplit toute seule depuis votre parc \u00e0 cuves. L\u2019application la prenait pour le volume de vin produit. Une cuve de 60\u00a0hL \u00e0 moiti\u00e9 pleine comptait donc 60\u00a0hL, et l\u2019erreur se r\u00e9partissait sur <b>toutes les parcelles de cette cuve</b>. <b>Aucune saisie n\u2019est \u00e0 refaire</b>\u00a0: les chiffres se corrigent d\u2019eux-m\u00eames \u00e0 l\u2019ouverture de l\u2019\u00e9cran." },
    { emoji: 'cuve', titre: 'Le vrai volume se compte au d\u00e9cuvage, pas avant', desc: "Tant qu\u2019une cuve mac\u00e8re ou fermente, elle contient du <b>raisin</b>\u00a0: aucun volume de vin n\u2019a encore \u00e9t\u00e9 mesur\u00e9. Le rendement affiche donc une <b>fourchette</b>, comme le faisait d\u00e9j\u00e0 Le mill\u00e9sime, et le chiffre net n\u2019arrive qu\u2019au d\u00e9cuvage \u2014 calcul\u00e9 sur ce qui est <b>r\u00e9ellement log\u00e9</b>, f\u00fbts et cuves compris. Pour les cuves d\u00e9j\u00e0 d\u00e9cuv\u00e9es, le volume se relit tout seul sur la cuv\u00e9e du Chai\u00a0: rien \u00e0 ressaisir." },
    { emoji: 'cuve', titre: 'Le champ \u00ab\u00a0volume\u00a0\u00bb d\u2019une cuve devient \u00ab\u00a0contenance\u00a0\u00bb', desc: "En rattachant une r\u00e9colte \u00e0 une cuve, l\u2019application proposait \u00ab\u00a0contenance + volume estim\u00e9 de l\u2019apport\u00a0\u00bb et r\u00e9\u00e9crivait ce total \u00e0 chaque enregistrement\u00a0: <b>rouvrir une r\u00e9colte pour corriger une faute de frappe ajoutait une seconde fois son volume</b>. Le champ demande maintenant la contenance, qui ne bouge pas d\u2019une r\u00e9colte \u00e0 l\u2019autre, et l\u2019\u00e9cran affiche \u00e0 c\u00f4t\u00e9 ce qui est d\u00e9j\u00e0 dedans et le taux de remplissage \u2014 recalcul\u00e9s \u00e0 chaque fois depuis vos r\u00e9coltes. Au d\u00e9cuvage, le nombre de barriques propos\u00e9 suit le volume attendu, et non plus la contenance de la cuve." }
  ] },
  { v: '6.69', items: [
    { emoji: 'antenne', titre: 'Un r\u00e9seau qui faiblit ne ressemble plus \u00e0 une panne', desc: "Au fond d\u2019une cave ou d\u2019un cuvier, la 4G d\u00e9croche. Quand cela arrivait pendant un enregistrement \u2014 une analyse, un ouillage, une pes\u00e9e \u2014 l\u2019application affichait <b>un message d\u2019erreur en anglais</b> en travers de l\u2019\u00e9cran\u00a0: <i>Promesse rejet\u00e9e\u00a0: Firebase\u00a0Error (auth/network-request-failed)</i>. De quoi croire que la saisie \u00e9tait perdue. <b>Elle ne l\u2019\u00e9tait pas</b>\u00a0: elle attendait sagement dans l\u2019appareil et repartait d\u00e8s le retour du r\u00e9seau. Ce message dispara\u00eet. \u00c0 la place, le bandeau de synchro annonce <b>\u00ab\u00a0R\u00e9seau instable \u2014 1 modification en attente, envoi automatique\u00a0\u00bb</b>, et le compteur retombe \u00e0 z\u00e9ro tout seul." },
    { emoji: 'antenne', titre: 'Le bandeau ne dit plus \u00ab\u00a0hors ligne\u00a0\u00bb quand vous avez du r\u00e9seau', desc: "Une modification pouvait \u00eatre mise en attente alors que le t\u00e9l\u00e9phone affichait quatre barres\u00a0: le bandeau annon\u00e7ait quand m\u00eame <b>\u00ab\u00a0hors ligne\u00a0\u00bb</b>. Il distingue maintenant les deux cas \u2014 <b>coup\u00e9</b> ou <b>instable</b> \u2014 et pr\u00e9cise dans les deux que l\u2019envoi se fera tout seul." }
  ] },
  { v: '6.68', items: [
    { emoji: 'contraste', titre: 'Les chiffres du haut d\u2019\u00e9cran redeviennent lisibles en mode sombre', desc: "Les <b>trois cases de chiffres</b> sous l\u2019en-t\u00eate \u2014 sur l\u2019Accueil, les Parcelles, le Journal, le Tracteur, les R\u00e9glages, le Planning et la Cave \u2014 \u00e9crivaient le chiffre en <b>presque noir sur fond sombre</b>\u00a0: il \u00e9tait quasiment invisible. Le libell\u00e9 dessous, lui, se lisait tr\u00e8s bien, ce qui rendait le d\u00e9faut d\u2019autant plus \u00e9trange. C\u2019est corrig\u00e9 partout, ainsi que <b>l\u2019onglet actif du Chai et du Mill\u00e9sime</b>, qui avait le m\u00eame probl\u00e8me. Deux chiffres souffraient de l\u2019inverse \u2014 trop p\u00e2les en mode clair\u00a0: l\u2019alerte \u00ab\u00a0semaines au-dessus du maximum\u00a0\u00bb du Planning et la case \u00ab\u00a0en cours\u00a0\u00bb du Chai." },
    { emoji: 'ancre', titre: 'L\u2019\u00e9cran d\u2019accueil ne se balade plus', desc: "Sur l\u2019Accueil, l\u2019\u00e9cran avait <b>du jeu dans les quatre sens</b>\u00a0: quelques millim\u00e8tres \u00e0 droite, \u00e0 gauche, en haut et en bas. Assez peu pour passer inaper\u00e7u, assez pour <b>couper les noms des modules dans la barre du bas</b> et donner l\u2019impression que rien n\u2019est fix\u00e9. Il suffisait qu\u2019un seul \u00e9l\u00e9ment d\u00e9passe de quelques pixels sur la droite\u00a0: le t\u00e9l\u00e9phone agrandit alors toute la page, et la barre du bas descend sous le bord de l\u2019\u00e9cran. L\u2019application se recadre maintenant d\u2019elle-m\u00eame, <b>quelle que soit la cause du d\u00e9passement</b>." }
  ] },
  { v: '6.67', items: [
    { emoji: 'carton', titre: 'La R\u00e9serve passe aux vraies ic\u00f4nes', desc: "Les f\u00fbts, les intrants, l\u2019inventaire d\u2019ouverture et les \u00e9crans vides gardaient leurs anciens pictogrammes. <b>Le document de restitution</b> \u2014 celui que vous \u00e9ditez quand un salari\u00e9 rend son mat\u00e9riel \u2014 en avait aussi, et comme il s\u2019imprime, ils pouvaient sortir en carr\u00e9s vides. Tout est repris. <b>Aucun stock, aucun f\u00fbt n\u2019a boug\u00e9.</b>" }
  ] },
  // 6.65 : correctif de l'ecran de recolte livre en 6.64 (le bloc de repartition
  // disparaissait a la deuxieme ouverture). Rien de NEUF pour l'utilisateur :
  // ce que 6.64 annonce est simplement redevenu vrai.
  { v: '6.66', items: [
    { emoji: 'carte', titre: 'La surface et le poids s\u2019\u00e9crivent \u00e0 la virgule, comme on les dit', desc: "Sur la r\u00e9partition d\u2019une r\u00e9colte, taper <b>0,12</b> ha ne marchait pas\u00a0: le champ n\u2019acceptait que le point, et il effa\u00e7ait la saisie <b>sans rien dire</b>. Pire, la ligne se redessinait \u00e0 chaque frappe et le curseur sautait d\u00e8s le premier chiffre. Surface, poids par caisse, litres de jus et de lie\u00a0: tous ces champs acceptent maintenant la <b>virgule</b> ou le point, et vous laissent taper tranquillement. La surface se lit et se r\u00e9\u00e9crit au <b>centi\u00e8me d\u2019hectare</b>." }
  ] },
  { v: '6.65', items: [] },
  { v: '6.64', items: [
    { emoji: 'carton', titre: 'Une r\u00e9colte peut partir chez plusieurs acheteurs \u00e0 la fois', desc: "Jusqu\u2019ici une r\u00e9colte n\u2019avait qu\u2019un destinataire\u00a0: deux n\u00e9goces sur la m\u00eame parcelle obligeaient \u00e0 saisir <b>deux r\u00e9coltes le m\u00eame jour</b>, et la parcelle \u00e9tait compt\u00e9e deux fois partout o\u00f9 on la compte une. La r\u00e9colte porte maintenant une <b>r\u00e9partition</b>\u00a0: une ligne par destinataire \u2014 le domaine et chaque acheteur \u2014 avec ses caisses. <b>Les hectolitres estim\u00e9s ne comptent que la part du domaine.</b>" },
    { emoji: 'balance', titre: 'Le poids d\u2019une caisse est celui du jour, et il ne bouge plus apr\u00e8s coup', desc: "Chaque ligne porte son propre poids par caisse\u00a0: les caisses d\u2019un n\u00e9goce ne p\u00e8sent pas celles d\u2019un autre, et le m\u00eame client peut changer de caisse d\u2019un jour \u00e0 l\u2019autre. La fiche du client <b>propose</b> son poids habituel, elle ne l\u2019impose plus. Avant, corriger cette fiche d\u00e9pla\u00e7ait <b>tous les kilos d\u00e9j\u00e0 livr\u00e9s</b>, y compris ceux d\u2019un bon d\u00e9j\u00e0 sign\u00e9. Ce n\u2019est plus le cas." },
    { emoji: 'document', titre: 'Le bon de livraison, et les litres que le client renvoie', desc: "Sur l\u2019\u00e9cran R\u00e9coltes, la ligne \u00ab\u00a0kg vendus en raisin\u00a0\u00bb ouvre les <b>ventes en vrac</b>\u00a0: un client, ses livraisons, son <b>bon de livraison</b> et son <b>r\u00e9cap de campagne</b> \u00e0 imprimer. Le bon ne dit que des kilos. Quand l\u2019acheteur renvoie ses <b>litres de jus et de lie</b>, on les saisit sur la livraison\u00a0: le rendement r\u00e9el en kg/hL appara\u00eet. Tant qu\u2019un retour manque, la livraison est marqu\u00e9e \u00ab\u00a0retour attendu\u00a0\u00bb." },
    { emoji: 'graphique', titre: 'Le rendement dit d\u00e9sormais ce qu\u2019il sait et ce qu\u2019il devine', desc: "Le rendement par parcelle \u00e9tait une <b>estimation</b> d\u2019apr\u00e8s les kilos, affich\u00e9e comme un chiffre net et compar\u00e9e au maximum de l\u2019appellation. Il va maintenant chercher le volume l\u00e0 o\u00f9 il a \u00e9t\u00e9 mesur\u00e9\u00a0: les litres rendus par l\u2019acheteur, puis le volume log\u00e9 en cuve. <b>Tant qu\u2019un volume manque, la parcelle affiche une fourchette</b> et la part r\u00e9ellement mesur\u00e9e \u2014 il manque des litres, pas des raisins. Le pourcentage du maximum s\u2019\u00e9crit alors \u00ab\u00a0\u2248\u00a0\u00bb." },
    { emoji: 'carte', titre: 'La surface, quand un acheteur prend une partie de la parcelle', desc: "Chaque destinataire peut porter sa <b>surface r\u00e9colt\u00e9e</b>. Laiss\u00e9e vide, la ligne prend tout le reste\u00a0: 12 ares vendus sur 34, et le domaine se voit attribuer les 22 restants sans rien taper. Le bon porte la surface \u2014 l\u2019acheteur en a besoin pour sa propre d\u00e9claration. <b>Une parcelle vendang\u00e9e en deux passages n\u2019est jamais compt\u00e9e deux fois.</b>" }
  ] },
  { v: '6.63', items: [
    { emoji: 'imprimante', titre: 'Le carnet d\u2019entretien imprim\u00e9 revient \u00e0 la normale', desc: "La derni\u00e8re mise \u00e0 jour avait mis des ic\u00f4nes dans la fiche d\u2019entretien du tracteur \u2014 sauf que ce carnet <b>s\u2019ouvre dans un autre onglet pour \u00eatre imprim\u00e9</b>, et l\u00e0 les ic\u00f4nes sortaient vides. C\u2019est corrig\u00e9\u00a0: le carnet a d\u00e9sormais ses propres dessins, ind\u00e9pendants de l\u2019application. <b>Aucune fiche, aucune case coch\u00e9e n\u2019est touch\u00e9e.</b>" }
  ] },
  { v: '6.62', items: [
    { emoji: 'cercle-pointille', titre: 'Les quatre \u00e9tats d\u2019une t\u00e2che se distinguent enfin', desc: "Dans les ronds de niveau, une t\u00e2che pouvait \u00eatre <b>faite</b>, <b>en cours</b>, <b>pas commenc\u00e9e</b>, ou <b>d\u00e9duite automatiquement</b>. Ce dernier cas s\u2019affichait avec un tilde \u2014 un signe de ponctuation, au milieu de trois ronds. Les quatre sont maintenant une famille\u00a0: coche, lecture, rond vide, et <b>rond en pointill\u00e9</b> pour ce que l\u2019application a d\u00e9duit sans que vous l\u2019ayez saisi. Le pointill\u00e9 dit exactement \u00e7a\u00a0: pas encore confirm\u00e9." },
    { emoji: 'outil', titre: 'La fiche d\u2019entretien du tracteur passe aux ic\u00f4nes', desc: "Plein, huile, filtre \u00e0 air, radiateur, pression des pneus, lavage\u00a0: les six points \u00e0 cocher, plus la m\u00e9t\u00e9o de la semaine et la fiche parcelle. <b>Rien de coch\u00e9 n\u2019a \u00e9t\u00e9 d\u00e9coch\u00e9.</b>" }
  ] },
  { v: '6.61', items: [
    { emoji: 'livre', titre: 'Le guide en ligne passe aux m\u00eames ic\u00f4nes que l\u2019application', desc: "Les <b>234 pictogrammes</b> du guide \u2014 titres de section, puces de conseil, sommaire \u2014 sont devenus les ic\u00f4nes de l\u2019application. C\u2019est la page que vous ouvrez depuis <b>R\u00e9glages \u203a Aide</b>, et celle qu\u2019un visiteur lit avant de vous appeler\u00a0: elle ne pouvait pas rester le dernier endroit avec des dessins d\u2019une autre \u00e9poque. <b>Pas un mot du guide n\u2019a chang\u00e9.</b>" }
  ] },
  { v: '6.60', items: [
    { emoji: 'etincelles', titre: 'L\u2019\u00e9cran des nouveaut\u00e9s passe aux vraies ic\u00f4nes', desc: "Celui que vous \u00eates en train de lire. Chacune des <b>346 nouveaut\u00e9s</b> \u00e9crites depuis le d\u00e9but portait un pictogramme, et c\u2019est l\u2019\u00e9cran que <b>tout le monde voit apr\u00e8s chaque mise \u00e0 jour</b> \u2014 donc le dernier endroit o\u00f9 il aurait fallu laisser des dessins qui changent d\u2019un appareil \u00e0 l\u2019autre. <b>Aucun texte n\u2019a \u00e9t\u00e9 touch\u00e9</b>\u00a0: les titres et les explications sont mot pour mot les m\u00eames qu\u2019\u00e0 leur publication." }
  ] },
  { v: '6.59', items: [
    { emoji: 'eprouvette', titre: 'Le catalogue phyto ne dit plus deux fois la m\u00eame chose', desc: "Chaque produit portait une pastille de couleur devant son nom \u2014 bleu pour le cuivre, jaune pour le soufre, vert pour un fongicide. Sauf que <b>le type est d\u00e9j\u00e0 \u00e9crit en toutes lettres au bout de la m\u00eame ligne</b>, dans une \u00e9tiquette de la m\u00eame couleur. La pastille r\u00e9p\u00e9tait l\u2019information \u00e0 six pixels d\u2019elle. Elle dispara\u00eet, l\u2019\u00e9tiquette reste\u00a0: <b>ni la couleur ni le mot ne sont perdus.</b>" },
    { emoji: 'graphique', titre: 'Le verdict de cadence a une vraie tuile', desc: "Sur l\u2019Exercice, le grand pictogramme en t\u00eate du verdict devient une <b>ic\u00f4ne dans un carr\u00e9 teint\u00e9</b>\u00a0: vert quand la cadence colle au bar\u00e8me, ambre en cas de d\u00e9rive, rouge quand le travail d\u00e9passe. La couleur dit toujours la m\u00eame chose, et le dessin ne change plus d\u2019un t\u00e9l\u00e9phone \u00e0 l\u2019autre." }
  ] },
  { v: '6.58', items: [
    { emoji: 'curseurs', titre: 'Les R\u00e9glages finissent leur passage aux ic\u00f4nes', desc: "Le choix des modules visibles par salari\u00e9, l\u2019historique d\u2019emploi (embauche, renouvellement, changement de taux) et les alertes de campagne gardaient leurs anciens pictogrammes. C\u2019est le dernier \u00e9cran de r\u00e9glage \u00e0 y passer. <b>Aucun param\u00e8tre n\u2019a chang\u00e9 de valeur.</b>" }
  ] },
  { v: '6.57', items: [
    { emoji: 'check', titre: 'Les messages de confirmation s\u2019all\u00e8gent encore', desc: "Vingt-huit bandeaux de plus perdent le petit signe qu\u2019ils affichaient devant leur texte. Le bandeau porte <b>d\u00e9j\u00e0 une pastille de couleur</b> \u2014 verte quand \u00e7a a march\u00e9, rouge sinon \u2014 et le signe disait la m\u00eame chose une deuxi\u00e8me fois. Les boutons qui passent en « V\u00e9rification\u2026 » ou « Cr\u00e9ation\u2026 » aussi." }
  ] },
  { v: '6.56', items: [
    { emoji: 'calendrier', titre: 'Le Planning passe aux vraies ic\u00f4nes', desc: "Les motifs d\u2019absence \u2014 arr\u00eat de travail, cong\u00e9 sans solde, \u00e9v\u00e9nement familial, formation, retard \u2014 avaient chacun leur pictogramme, et ils ne se dessinaient pas pareil d\u2019un t\u00e9l\u00e9phone \u00e0 l\u2019autre. Sur un \u00e9cran o\u00f9 on les compare en colonne, \u00e7a compte. La barre d\u2019actions et les cartes de compteur suivent aussi. <b>Aucune heure, aucun cong\u00e9 pos\u00e9 n\u2019est touch\u00e9.</b>" },
    { emoji: 'chrono', titre: 'La feuille d\u2019heures imprim\u00e9e reste lisible', desc: "Un jour en horaires chaleur s\u2019affichait avec un petit soleil. Le m\u00eame libell\u00e9 sert \u00e0 l\u2019\u00e9cran <b>et</b> \u00e0 la feuille d\u2019heures imprim\u00e9e, o\u00f9 ce genre de dessin peut sortir en carr\u00e9 vide selon l\u2019imprimante. Le jour est d\u00e9sormais \u00e9crit <b>Chaleur</b>, tout simplement \u2014 comme les six autres statuts, qui n\u2019ont jamais eu de dessin." }
  ] },
  { v: '6.55', items: [
    { emoji: 'graphique', titre: 'Le Pilotage passe aux vraies ic\u00f4nes', desc: "Les cartes de la Cave, l\u2019Exercice, la tourn\u00e9e des parcelles et les bandeaux d\u2019avertissement gardaient leurs anciens pictogrammes. Ils suivent maintenant le reste de l\u2019application, et prennent la couleur du texte au lieu de rester des taches vives en mode sombre. <b>Les pastilles de couleur restent des pastilles</b> \u2014 vert, orange, rouge disent quelque chose qu\u2019un dessin ne dirait pas. <b>Aucun chiffre n\u2019a boug\u00e9.</b>" }
  ] },
  { v: '6.54', items: [
    { emoji: 'verre', titre: 'La Cave passe aux vraies ic\u00f4nes, y compris \u00e0 l\u2019impression', desc: "Le Chai, le Cuvier, le journal des op\u00e9rations et les r\u00e9glages de cave gardaient leurs anciens pictogrammes. Surtout, <b>le registre de cave et le bilan de campagne</b> en imprimaient aussi \u2014 et un pictogramme ne se dessine pas pareil selon la machine qui imprime. Ils sortent maintenant avec les m\u00eames ic\u00f4nes que l\u2019\u00e9cran, identiques partout. <b>Aucun chiffre n\u2019a chang\u00e9</b>, et vos op\u00e9rations non plus." }
  ] },
  { v: '6.53', items: [
    { emoji: 'boussole', titre: 'La visite guid\u00e9e et la d\u00e9mo passent aux vraies ic\u00f4nes', desc: "C\u2019est le premier \u00e9cran qu\u2019un visiteur voit en cliquant « Voir la d\u00e9mo » sur le site, et le seul qui tournait encore enti\u00e8rement au pictogramme : le menu des chapitres, les six familles, le bandeau du haut. Il ressemble maintenant au reste de l\u2019application. <b>Rien ne change pour vous</b> si vous ne repassez pas par la visite." },
    { emoji: 'check', titre: 'Les messages de confirmation ne r\u00e9p\u00e8tent plus leur pastille', desc: "« Ordre enregistr\u00e9 », « Commune enregistr\u00e9e » : le bandeau qui appara\u00eet en bas de l\u2019\u00e9cran porte <b>d\u00e9j\u00e0 une pastille verte</b>, et le petit signe en plus disait la m\u00eame chose une deuxi\u00e8me fois. Les boutons « Enregistrement\u2026 » aussi. Un peu moins de bruit \u00e0 chaque geste." }
  ] },
  { v: '6.52', items: [
    { emoji: 'tracteur', titre: 'Les \u00e9crans du Tracteur passent aux vraies ic\u00f4nes', desc: "Le chrono, la cuve GNR, la prochaine r\u00e9vision et le catalogue des produits gardaient leurs anciens pictogrammes. Ils suivent maintenant le reste de l\u2019application \u2014 et, comme partout ailleurs, ils prennent la couleur du texte \u00e0 c\u00f4t\u00e9 d\u2019eux au lieu de rester des taches vives en mode sombre. <b>Aucun bouton n\u2019a chang\u00e9 de place.</b>" },
    { emoji: 'liste', titre: 'La liste des activit\u00e9s n\u2019affiche plus que leur nom', desc: "Dans le menu d\u00e9roulant d\u2019une session tracteur, chaque activit\u00e9 \u00e9tait pr\u00e9c\u00e9d\u00e9e de son pictogramme. Un menu d\u00e9roulant est le seul endroit de l\u2019application o\u00f9 une vraie ic\u00f4ne ne peut pas entrer \u2014 c\u2019est le navigateur qui le dessine, pas nous. Le pictogramme a donc <b>rejoint les puces de filtre</b>, juste au-dessus, o\u00f9 il est lisible partout. <b>Vos activit\u00e9s et vos sessions ne changent pas</b>, et celles d\u00e9j\u00e0 enregistr\u00e9es non plus." }
  ] },
  { v: '6.51', items: [
{ emoji: 'soleil', titre: 'Le mode sombre ne s\u2019arr\u00eate plus \u00e0 la porte des fen\u00eatres', desc: "En th\u00e8me sombre, chaque fen\u00eatre qui s\u2019ouvre par-dessus l\u2019\u00e9cran \u2014 une confirmation, un choix de parcelle, un export, les conditions d\u2019utilisation \u2014 sortait <b>en blanc</b>, en pleine nuit. Le soir au bureau ou t\u00f4t le matin dans la cuve, \u00e7a \u00e9blouissait \u00e0 chaque clic. <b>Trente-sept fen\u00eatres</b> \u00e9taient concern\u00e9es. Elles suivent d\u00e9sormais le th\u00e8me comme le reste de l\u2019application. <b>Rien ne change en th\u00e8me clair</b>, et aucune donn\u00e9e n\u2019est touch\u00e9e." }
  ] },
  { v: '6.50', items: [
    { emoji: 'curseurs', titre: 'Les fen\u00eatres et les titres passent aux m\u00eames ic\u00f4nes que le reste', desc: "Depuis le passage aux vraies ic\u00f4nes, une moiti\u00e9 de l\u2019application avait chang\u00e9 et l\u2019autre non\u00a0: les listes \u00e9taient nettes, mais d\u00e8s qu\u2019une fen\u00eatre s\u2019ouvrait par-dessus \u2014 une confirmation, un choix de c\u00e9page, un export, tout l\u2019\u00e9cran R\u00e9glages \u2014 les vieux pictogrammes revenaient. <b>Deux cent cinquante-deux</b> d\u2019entre eux viennent d\u2019y passer. Un pictogramme ne se dessine pas pareil sur un iPhone, un Android et un PC\u00a0; une ic\u00f4ne, si. <b>Rien n\u2019a boug\u00e9 dans vos donn\u00e9es</b>, et aucun bouton n\u2019a chang\u00e9 de place." },
    { emoji: 'oeil', titre: 'Les ic\u00f4nes suivent enfin le mode sombre partout', desc: "Un pictogramme garde sa couleur quoi qu\u2019on fasse\u00a0: en th\u00e8me sombre, les fen\u00eatres gardaient des taches vives sans rapport avec le reste. Les ic\u00f4nes, elles, prennent la couleur du texte \u00e0 c\u00f4t\u00e9 d\u2019elles \u2014 elles s\u2019\u00e9claircissent la nuit et se foncent au soleil, comme tout le reste de la page." }
  ] },
  { v: '6.48', items: [
    { emoji: 'euro', titre: 'Un \u00e9cran Achats\u00a0: le seul endroit o\u00f9 l\u2019on met les prix', desc: "Chaque module y d\u00e9pose ses lignes tout seul\u00a0: un achat saisi dans La R\u00e9serve, un lot de f\u00fbts, une machine rentr\u00e9e du r\u00e9parateur. Vous les chiffrez quand les factures arrivent, en une fois, dans <b>Pilotage \u203a \u00c9conomie \u203a Achats</b>. Le prix retourne dans la fiche d\u2019origine\u00a0: <b>rien \u00e0 ressaisir nulle part</b>. Un filtre montre ce qui reste \u00e0 chiffrer." },
    { emoji: 'cle', titre: 'Vous notez d\u00e9sormais chez qui part la machine', desc: "Quand un tracteur est signal\u00e9 chez le r\u00e9parateur, un champ demande le garage. Au retour, l\u2019intervention appara\u00eet dans Achats avec sa dur\u00e9e d\u2019immobilisation, en attente de son montant. <b>Aucun montant n\u2019est demand\u00e9 sur le terrain</b> \u2014 la facture arrive des semaines plus tard, et celui qui rend les cl\u00e9s ne l\u2019a pas. Les fiches d\u2019entretien quotidiennes, elles, ne remontent pas\u00a0: un plein de gazole n\u2019est pas un achat." },
    { emoji: 'graphique', titre: 'Ce que co\u00fbtent la vigne, la cave et le tracteur', desc: "L\u2019Exercice r\u00e9partit vos consommables par <b>atelier</b>, en plus de leur nature. Un bouton bascule entre les deux lectures. <b>Rien de plus \u00e0 saisir</b>\u00a0: l\u2019atelier se d\u00e9duit du type d\u2019intrant, et le carburant part au tracteur tout seul. Les salaires ne sont pas r\u00e9partis, et l\u2019\u00e9cran le dit\u00a0: le planning enregistre des heures, jamais l\u2019activit\u00e9 qui va avec." },
    { emoji: 'alerte', titre: 'L\u2019application pr\u00e9vient quand la r\u00e9partition devient bancale', desc: "Si un cinqui\u00e8me de vos consommables n\u2019est rattach\u00e9 \u00e0 aucun atelier, ou si des lignes restent sans montant, le bouton \u00ab\u00a0\u00e0 compl\u00e9ter\u00a0\u00bb du Pilotage le dit et vous emm\u00e8ne au bon endroit. Le total reste juste \u2014 mais <b>comparer les ateliers ne veut plus dire grand-chose</b> tant qu\u2019une part pareille reste de c\u00f4t\u00e9." },
    { emoji: 'balance', titre: 'Le co\u00fbt phyto par parcelle s\u2019affichait \u00e0 z\u00e9ro', desc: "Le Pilotage attendait un prix au kilo que <b>rien ne permettait de saisir</b>\u00a0: le co\u00fbt des traitements par parcelle restait donc vide depuis le d\u00e9but, sans que rien ne le signale. Il se calcule maintenant sur <b>vos factures d\u2019achat</b>, euros divis\u00e9s par quantit\u00e9, et s\u2019affiche sur chaque fiche d\u2019intrant. Les lignes sans prix sont \u00e9cart\u00e9es du calcul plut\u00f4t que compt\u00e9es \u00e0 z\u00e9ro \u2014 sinon la moyenne serait tir\u00e9e vers le bas sans en avoir l\u2019air. <b>Aucune saisie \u00e0 refaire</b>." }
  ] },
  { v: '6.47', items: [
    { emoji: 'calendrier', titre: 'Deux contrats qui se suivent n\u2019en font bien qu\u2019un', desc: "Quand un contrat se termine un 30 juin et que le suivant commence le 1er juillet, l\u2019application doit les traiter comme <b>une seule p\u00e9riode</b> \u2014 un seul compteur d\u2019heures, un seul plafond annuel. Elle ne le faisait plus : une comparaison de dates se trompait d\u2019un jour, et les deux contrats repartaient chacun de z\u00e9ro. Sur une feuille d\u2019heures, le compteur pouvait alors m\u00e9langer les deux. <b>Aucune saisie n\u2019est \u00e0 refaire</b> : le calcul se corrige tout seul \u00e0 la prochaine ouverture." }
  ] },
  { v: '6.46', items: [
    { emoji: 'balance', titre: 'Les chiffres s\u2019alignent enfin en colonne', desc: "Dans un tableau, un \u00ab 1 \u00bb est bien plus \u00e9troit qu\u2019un \u00ab 0 \u00bb : deux lignes l\u2019une sous l\u2019autre ne tombaient jamais en face. Sur les \u00e9crans du Pilotage et du Planning, l\u2019\u0153il devait relire chaque ligne au lieu de balayer la colonne. Tous les chiffres de l\u2019application ont d\u00e9sormais <b>la m\u00eame largeur</b>, d\u2019un bout \u00e0 l\u2019autre \u2014 les tableaux, les totaux et les heures se lisent en descendant. <b>Aucun chiffre n\u2019a chang\u00e9 de valeur</b> : c\u2019est leur alignement qui bouge, pas leur calcul." },
    { emoji: 'cible', titre: 'On voit o\u00f9 l\u2019on est quand on navigue au clavier', desc: "Sur ordinateur, en passant d\u2019un champ \u00e0 l\u2019autre avec la touche Tab, rien ne disait o\u00f9 l\u2019on \u00e9tait : il fallait cliquer pour en \u00eatre s\u00fbr. Un <b>liser\u00e9 dor\u00e9</b> entoure maintenant l\u2019\u00e9l\u00e9ment actif. Il n\u2019appara\u00eet qu\u2019au clavier \u2014 \u00e0 la souris et au doigt, rien ne change, et sur le t\u00e9l\u00e9phone au vignoble l\u2019\u00e9cran est strictement identique." }
  ] },
  { v: '6.45', items: [
    { emoji: 'personne', titre: 'Votre profil vous attend d\u00e9j\u00e0 \u00e0 l\u2019ouverture', desc: "Sur un domaine de dix ou quinze personnes, il fallait retrouver son nom dans la liste \u00e0 chaque ouverture \u2014 t\u00e9l\u00e9phone en main, souvent avec des gants. D\u00e9sormais l\u2019appareil se souvient du dernier profil qui s\u2019y est connect\u00e9 et n\u2019affiche que celui-l\u00e0. <b>La liste compl\u00e8te reste \u00e0 un seul geste</b> : \u00ab Ce n\u2019est pas moi \u00bb, juste en dessous. C\u2019est un confort, pas une protection : les noms n\u2019ont jamais \u00e9t\u00e9 secrets, ils sont \u00e9crits sur les tuiles. Sur une tablette partag\u00e9e, rien ne change vraiment \u2014 et une d\u00e9connexion volontaire efface le souvenir, comme elle efface d\u00e9j\u00e0 les donn\u00e9es du domaine sur l\u2019appareil." }
  ] },
  { v: '6.44', items: [
    { emoji: 'microscope', titre: 'Le Cuvier conna\u00eet vos cuves', desc: "En cr\u00e9ant une cuve de vinification, choisissez-la dans votre parc : son nom et sa contenance se remplissent tout seuls, et elle est marqu\u00e9e occup\u00e9e jusqu\u2019au d\u00e9cuvage. Plus besoin de retaper \u00ab Cuve 3 \u2014 inox 40 hL \u00bb \u00e0 chaque mill\u00e9sime. Surtout, <b>le parc \u00e0 cuves dit enfin la v\u00e9rit\u00e9</b> : jusqu\u2019ici il ne regardait que Le Chai et pouvait annoncer une cuve libre alors qu\u2019elle fermentait. Rien n\u2019est obligatoire \u2014 une cuve saisie \u00e0 la main fonctionne comme avant, et les champs que vous avez d\u00e9j\u00e0 remplis ne sont jamais \u00e9cras\u00e9s." }
  ] },
  { v: '6.43', items: [
    { emoji: 'raisin', titre: 'D\u00e9cuver dans une cuve, pas seulement en barriques', desc: "Au Cuvier, le bouton \u00ab D\u00e9cuver \u00bb demande maintenant o\u00f9 part le vin : <b>en barriques</b> (comme avant, et c\u2019est le choix par d\u00e9faut), <b>en cuve</b>, ou <b>les deux</b>. En mode mixte, ce qui ne tient pas dans la cuve est automatiquement converti en barriques, et un compteur montre en permanence combien d\u2019hectolitres sont log\u00e9s sur le volume d\u00e9cuv\u00e9. La cuve que vous \u00eates en train de vider reste propos\u00e9e \u2014 on \u00e9l\u00e8ve tr\u00e8s bien sur lies dans la cuve o\u00f9 l\u2019on a ferment\u00e9. Si votre parc \u00e0 cuves est vide, l\u2019\u00e9cran ne change pas d\u2019un pixel." }
  ] },
  { v: '6.42', items: [
    { emoji: 'barrique', titre: '\u00c9lever en cuve, pas seulement en f\u00fbt', desc: "Un vin peut vieillir en cuve inox, en b\u00e9ton ou en foudre bois \u2014 Le Chai ne connaissait que la barrique. D\u00e9clarez vos cuves une bonne fois dans <b>Cave \u203a Le Chai \u203a R\u00e9glages \u203a Le parc \u00e0 cuves</b> (un nom, une contenance en litres, la mati\u00e8re), puis logez-y une cuv\u00e9e depuis sa fiche, avec le volume r\u00e9ellement dedans \u2014 on remplit rarement \u00e0 ras. Une cuv\u00e9e peut tenir \u00e0 la fois des f\u00fbts et une cuve : les hectolitres du Chai, la mise en bouteille et le bilan du mill\u00e9sime comptent d\u00e9sormais les deux. Une cuve n\u2019est jamais compt\u00e9e comme un f\u00fbt : votre parc \u00e0 f\u00fbts de La R\u00e9serve ne bouge pas d\u2019une unit\u00e9." },
    { emoji: 'sablier', titre: 'Plus de rappel d\u2019ouillage sur ce qui ne s\u2019\u00e9vapore pas', desc: "L\u2019inox et le b\u00e9ton ne respirent pas : une cuv\u00e9e log\u00e9e uniquement dans ce type de cuve n\u2019a plus de jauge \u00ab part des anges \u00bb, ne passe plus au rouge, et ne compte plus dans les alertes du Chai. Sa fiche l\u2019\u00e9crit noir sur blanc plut\u00f4t que de laisser un blanc. Un foudre en bois, lui, garde son suivi. Et une cuv\u00e9e dont tous les f\u00fbts avaient \u00e9t\u00e9 retir\u00e9s affichait un \u00ab \u00e0 ouiller \u00bb rouge qui ne partait jamais : elle demande maintenant simplement qu\u2019on lui renseigne un contenant." }
  ] },
  { v:'6.41', items:[
    { emoji: 'carte', titre: "La carte des parcelles se bloquait sur \u00ab\u00a0Toutes t\u00e2ches\u00a0\u00bb",
      desc: "Sur l\u2019onglet <b>Parcelles</b>, filtre \u00ab\u00a0Toutes t\u00e2ches\u00a0\u00bb, le bandeau qui propose les tourn\u00e9es du domaine s\u2019interrompait et faisait appara\u00eetre un message d\u2019erreur rouge en bas de l\u2019\u00e9cran. Le pictogramme du travail manquait \u00e0 l\u2019appel devant chaque bouton de tourn\u00e9e\u00a0; il est de retour et le bandeau s\u2019affiche normalement." }
  ] },
  { v:'6.40', items:[
    { emoji: 'chrono', titre: "Le retard fonctionne sur un jour suppl\u00e9mentaire",
      desc: "Une journ\u00e9e <b>hors planning</b> dont vous aviez saisi les horaires \u2014 un renfort, une reprise, un jour \u00e9chang\u00e9 \u2014 refusait le retard avec \u00ab\u00a0aucune heure pr\u00e9vue ce jour-l\u00e0\u00a0\u00bb, et le d\u00e9tail affichait \u00ab\u00a0arriv\u00e9e \u00e0 07:30, pas apr\u00e8s 07:00\u00a0\u00bb alors que 07:30 est bien apr\u00e8s 07:00. Les heures de la journ\u00e9e \u00e9taient lues sur le planning, qui ne conna\u00eet pas ces jours-l\u00e0, au lieu de l\u2019horaire que vous aviez saisi. Le retard s\u2019y pose maintenant normalement, et <b>les horaires de la journ\u00e9e sont conserv\u00e9s</b>." }
  ] },
  { v:'6.39', items:[
    { emoji: 'chrono', titre: "Un retard sur un jour \u00e0 horaire d\u00e9cal\u00e9 n\u2019\u00e9tait pas enregistr\u00e9",
      desc: "Sur une journ\u00e9e dont l\u2019horaire avait \u00e9t\u00e9 saisi \u00e0 la main \u2014 une prise de poste avanc\u00e9e, un jour de vendange \u2014 la feuille affichait bien l\u2019heure de d\u00e9but du jour, mais le calcul, lui, se basait sur l\u2019horaire <b>par d\u00e9faut du planning</b>. R\u00e9sultat\u00a0: une arriv\u00e9e r\u00e9ellement en retard ressortait \u00ab\u00a0arriv\u00e9e \u00e0 l\u2019heure, aucune absence enregistr\u00e9e\u00a0\u00bb, et <b>rien n\u2019\u00e9tait \u00e9crit</b>. Le calcul lit maintenant l\u2019horaire du jour, celui-l\u00e0 m\u00eame qui est affich\u00e9." },
    { emoji: 'info', titre: "Le message dit d\u00e9sormais pourquoi rien n\u2019a \u00e9t\u00e9 enregistr\u00e9",
      desc: "Un jour <b>hors contrat</b> ou <b>sans heures pr\u00e9vues</b> affichait lui aussi \u00ab\u00a0arriv\u00e9e \u00e0 l\u2019heure\u00a0\u00bb, ce qui envoyait chercher l\u2019erreur au mauvais endroit. Chaque cas a maintenant son message." }
  ] },
  { v:'6.38', items:[
    { emoji: 'chrono', titre: "Un retard se note par l\u2019heure d\u2019arriv\u00e9e",
      desc: "Il fallait convertir soi-m\u00eame le retard en heures avant de le saisir. Vous indiquez d\u00e9sormais <b>l\u2019heure \u00e0 laquelle la personne est arriv\u00e9e</b>, et l\u2019\u00e9cran vous dit, avant d\u2019enregistrer, ce qui a \u00e9t\u00e9 travaill\u00e9 et ce qui est d\u00fb. La coupure d\u00e9jeuner est prise en compte : arriver \u00e0 14 h ne doit pas l\u2019heure du repas." },
    { emoji: 'alerte', titre: "Un retard d\u2019une heure effa\u00e7ait la journ\u00e9e enti\u00e8re",
      desc: "C\u2019est le d\u00e9faut le plus co\u00fbteux de ce lot. Noter un retard mettait la journ\u00e9e \u00e0 <b>z\u00e9ro heure</b> et ne comptait <b>aucune heure due</b> \u2014 sauf si le r\u00e9glage \u00ab\u00a0Absences qui doivent des heures\u00a0\u00bb avait \u00e9t\u00e9 pos\u00e9, ce qu\u2019il n\u2019est pas par d\u00e9faut. Une heure de retard co\u00fbtait donc sept heures au salari\u00e9. Le retard ne d\u00e9pend plus de ce r\u00e9glage : il retire ses propres heures, toujours, et la journ\u00e9e est pay\u00e9e \u00e0 hauteur de ce qui a \u00e9t\u00e9 fait. <b>Vos retards d\u00e9j\u00e0 saisis reprennent leurs vraies heures</b>, et les heures manqu\u00e9es apparaissent au compteur." },
    { emoji: 'calendrier', titre: "Le retard ne se confond plus avec une absence dans la grille",
      desc: "Une croix rouge marquait aussi bien un retard d\u2019une heure qu\u2019une journ\u00e9e enti\u00e8re manqu\u00e9e. La case du retard porte maintenant <b>les heures r\u00e9ellement faites</b>, en orange, avec une pastille. La fiche du jour affiche l\u2019horaire\u00a0: arriv\u00e9e \u2192 fin pr\u00e9vue." },
    { emoji: 'check', titre: "Arriver apr\u00e8s la fin de la journ\u00e9e n\u2019est plus un retard",
      desc: "Une arriv\u00e9e post\u00e9rieure \u00e0 l\u2019heure de d\u00e9bauche voulait dire que rien n\u2019avait \u00e9t\u00e9 travaill\u00e9. L\u2019enregistrement bascule seul en <b>absence injustifi\u00e9e</b>, qui dit la m\u00eame chose plus juste sur le relev\u00e9, et le message vous le signale." }
  ] },
  { v:'6.37', items:[
    { emoji: 'equipe', titre: "Les heures d\u2019un salari\u00e9 parti disparaissaient de tout l\u2019historique",
      desc: "Le jour o\u00f9 vous passez une fiche en <b>Inactif</b>, ses heures d\u00e9j\u00e0 faites s\u2019effa\u00e7aient de partout\u00a0: le r\u00e9cap annuel, la grille des mois pass\u00e9s, les totaux du mois, la cadence du Pilotage et le planning de l\u2019ann\u00e9e imprim\u00e9. Sur un domaine r\u00e9el, sept fiches rang\u00e9es en fin de saison ont ramen\u00e9 <b>janvier \u00e0 juillet \u00e0 z\u00e9ro</b>. Un contrat termin\u00e9 n\u2019efface plus le travail qui a \u00e9t\u00e9 fait\u00a0: chaque \u00e9cran regarde d\u00e9sormais <b>qui \u00e9tait l\u00e0 \u00e0 ce moment-l\u00e0</b>, pas qui est l\u00e0 aujourd\u2019hui." },
    { emoji: 'calendrier', titre: "Un ancien salari\u00e9 remonte dans la liste du mois o\u00f9 il travaillait",
      desc: "Dans <b>Les gens</b>, la liste et la grille suivent maintenant le mois affich\u00e9. Reculez en juin\u00a0: la saisonni\u00e8re dont le contrat s\u2019est termin\u00e9 en juillet y reprend sa ligne, avec ses heures. La section <b>Anciens salari\u00e9s</b>, en bas, ne garde que ceux qui n\u2019\u00e9taient pas sous contrat ce mois-l\u00e0 \u2014 plus personne n\u2019appara\u00eet deux fois." },
    { emoji: 'graphique', titre: "Le r\u00e9cap annuel dit enfin ce qu\u2019il mesure",
      desc: "Les douze barres ne sont pas un volume d\u2019heures\u00a0: c\u2019est la <b>part du pr\u00e9vu r\u00e9alis\u00e9e</b>, mois par mois. Une ligne sous les barres le dit, avec le total des heures faites et pr\u00e9vues sur l\u2019ann\u00e9e. Et le \u00ab\u00a0pr\u00e9vu\u00a0\u00bb est maintenant born\u00e9 aux contrats\u00a0: un permanent embauch\u00e9 en ao\u00fbt ne tra\u00eene plus sept mois de pr\u00e9visionnel face \u00e0 z\u00e9ro heure faite." },
    { emoji: 'dossier', titre: "Le relev\u00e9 et le planning d\u2019un ancien salari\u00e9 s\u2019\u00e9ditent encore",
      desc: "Les deux documents nominatifs refusaient de proposer une personne d\u00e8s que sa fiche passait en Inactif \u2014 exactement au moment o\u00f9 elle les demande, son d\u00e9part. Elle est de nouveau dans la liste, marqu\u00e9e \u00ab\u00a0ancien salari\u00e9\u00a0\u00bb." },
    { emoji: 'alerte', titre: "Le PDF mensuel chiffrait la mauvaise ann\u00e9e",
      desc: "Choisir \u00ab\u00a0juin 2025\u00a0\u00bb dans <b>R\u00e9glages \u203a Documents</b> pr\u00e9-remplissait les heures de juin de l\u2019ann\u00e9e ouverte dans le Planning, sans le dire. L\u2019ann\u00e9e du champ est enfin lue." }
  ] },
  { v:'6.36', items:[
    { emoji: 'carte', titre: "Le numéro de tournée n’est plus collé au nom",
      desc: "Quand une tournée est fixée, chaque parcelle porte son rang de passage. Il sortait en <b>chiffre nu, collé au nom</b> : « 1Comble ». Pire, il poussait le nom d’une largeur différente selon le rang, si bien qu’aucun nom ne commençait au même endroit d’une ligne à l’autre. Le numéro reprend sa pastille et une <b>largeur fixe</b> : la colonne des noms se lit d’un trait, même à quarante parcelles." },
    { emoji: 'check', titre: "Les boutons de validation ont de l’air et un nom",
      desc: "La colonne de droite était <b>collée au pourcentage</b>, avec du vide perdu à sa droite. Elle vient désormais au bord de la carte, sur toute la hauteur, et le pourcentage retrouve sa marge. Les deux gestes ne sont plus des pictogrammes à deviner : ils s’appellent <b>Début</b> et <b>Valider</b>." },
    { emoji: 'alerte', titre: "Le sablier et la coche s’affichaient au hasard du téléphone",
      desc: "C’étaient des émoji : chaque système les dessine à sa manière, et aucun ne prenait la couleur voulue — la coche s’affichait en noir sur certains Android alors qu’elle est censée être verte. Elles viennent maintenant du jeu d’icônes de l’application : même trait, même couleur, sur tous les téléphones." },
    { emoji: 'raisin', titre: "Les surfaces s’écrivent en français",
      desc: "La liste affichait « 0.2961 ha », avec un point. C’est une virgule : « 0,2961 ha ». La précision ne bouge pas." }
  ] },
  { v:'6.35', items:[
    { emoji: 'tracteur', titre: "Le carburant compte enfin vos vrais pleins",
      desc: "Vous mettez 30\u202fL dans un tracteur : jusqu\u2019ici, ces 30\u202fL n\u2019entraient nulle part dans le coût. Le carburant était <b>deviné</b> — heures de session × 6\u202fL/h × prix — et une session non notée faisait <b>disparaître</b> du carburant. Désormais le total, c\u2019est la somme de vos pleins. Les heures ne servent plus qu\u2019à le <b>répartir</b> entre les parcelles : une heure oubliée déplace du carburant d\u2019une parcelle à l\u2019autre, elle n\u2019en efface plus. Et chaque plein est valorisé au prix du litre <b>en vigueur à sa date</b>, plus au prix moyen de toute l\u2019année." },
    { emoji: 'goutte', titre: "Un plein se note toujours en litres",
      desc: "Cocher «\u202fPlein fait\u202f» dans une fiche d\u2019entretien ne demandait <b>aucun litre</b> : le plein était enregistré, le chiffre perdu. Le champ apparaît maintenant dès que vous cochez la case, et la cuve en est décomptée comme avec le bouton «\u202fPlein\u202f». Corriger un chiffre trop haut ou décocher la case <b>rend les litres à la cuve</b>. Les litres s\u2019affichent aussi dans le carnet, à côté du point de contrôle." },
    { emoji: 'alerte', titre: "Un poste qui n\u2019est pas mesuré le dit",
      desc: "Tant qu\u2019aucun plein n\u2019est relevé sur la période, le carburant reste calculé à l\u2019ancienne — et la ligne affiche «\u202fL ESTIMÉS\u202f» au lieu de «\u202fL relevés\u202f». Si des pleins ont été cochés sans litres, leur nombre est indiqué : c\u2019est toute la différence entre «\u202fpeu de carburant\u202f» et «\u202fcarburant mal relevé\u202f»." }
  ] },
  { v:'6.34', items:[
    { emoji: 'check', titre: "Les ic\u00f4nes des bandeaux du haut \u00e9taient presque invisibles",
      desc: "\u00c0 c\u00f4t\u00e9 du titre de chaque \u00e9cran, l\u2019ic\u00f4ne se fondait dans le fond sombre du bandeau et devenait tr\u00e8s difficile \u00e0 voir. C\u2019est corrig\u00e9 : elle reprend <b>la m\u00eame couleur cr\u00e8me que le titre</b>." }
  ] },
  { v:'6.33', items:[
    { emoji: 'barrique', titre: "Cinq \u00e9crans gardaient encore les anciens dessins",
      desc: "Le Planning, La R\u00e9serve, Le Chai, Le Cuvier et Le mill\u00e9sime affichaient toujours de vieux pictogrammes en haut de page, l\u00e0 o\u00f9 le reste de l\u2019application avait chang\u00e9. C\u2019est align\u00e9. Au passage, <b>les f\u00fbts ont enfin un dessin de f\u00fbt</b> \u2014 c\u2019\u00e9tait un caddie dans La R\u00e9serve et un bidon dans Le Chai." },
    { emoji: 'ajout', titre: "Les modules du bas se voient mieux",
      desc: "Dans la barre du bas, chaque module vit d\u00e9sormais dans un carr\u00e9 en relief : creus\u00e9 quand il est ferm\u00e9, <b>en or quand il est ouvert</b>. Le petit trait dor\u00e9 tout en haut de la barre, qu\u2019on ne remarquait jamais, dispara\u00eet." }
  ] },
  { v:'6.32', items:[
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o par secteur affichait un mot \u00e0 la place du dessin",
      desc: "Sur l\u2019accueil, chaque commune montrait \u00ab\u202fsoleil\u202f\u00bb ou \u00ab\u202fnuage\u202f\u00bb \u00e9crit en gros par-dessus son nom. C\u2019est corrig\u00e9 : le dessin revient, et <b>vos relev\u00e9s d\u00e9j\u00e0 enregistr\u00e9s restent lisibles</b>." },
    { emoji: 'boussole', titre: "Les bandeaux du haut passent aux m\u00eames ic\u00f4nes",
      desc: "Le titre de chaque \u00e9cran, les sous-onglets (Accueil, Parcelles, Journal\u2026) et les boutons ronds en haut \u00e0 droite \u00e9taient rest\u00e9s en \u00e9mojis. Ils rejoignent le jeu d\u2019ic\u00f4nes du reste de l\u2019application \u2014 <b>trente-neuf pictogrammes remplac\u00e9s</b>." }
  ] },
  { v:'6.31', items:[
    { emoji: 'euro', titre: "L\u2019onglet \u00c9conomie du Pilotage retrouve son ic\u00f4ne",
      desc: "Dernier carr\u00e9 rouge en pointill\u00e9s : l\u2019onglet \u00c9conomie du Pilotage. C\u2019est corrig\u00e9." }
  ] },
  { v:'6.30', items:[
    { emoji: 'boussole', titre: "Les onglets du Pilotage affichaient un carr\u00e9 rouge",
      desc: "Les neuf onglets de l\u2019\u00e9cran Pilotage montraient un carr\u00e9 rouge en pointill\u00e9s \u00e0 la place de leur ic\u00f4ne. C\u2019est corrig\u00e9 : ils ont les m\u00eames ic\u00f4nes que le reste de l\u2019application." }
  ] },
  { v:'6.29', items:[
    { emoji: 'outil', titre: "Pilotage \u00e0 nouveau utilisable",
      desc: "L\u2019\u00e9cran Pilotage ne r\u00e9pondait plus aux clics depuis la derni\u00e8re mise \u00e0 jour. <b>C\u2019est r\u00e9par\u00e9.</b> Au passage, la m\u00e9t\u00e9o de l\u2019en-t\u00eate affichait \u00ab\u202fnuage\u202f\u00bb \u00e9crit en toutes lettres, et la barre d\u2019onglets \u00e9tait la derni\u00e8re \u00e0 garder des \u00e9mojis : les deux sont corrig\u00e9es." },
  ] },
  { v:'6.28', items:[
    { emoji: 'outil', titre: "Deux ic\u00f4nes manquantes r\u00e9par\u00e9es",
      desc: "Sur le tableau de bord, la vignette \u00c9quipe et l\u2019ic\u00f4ne de beau temps affichaient un carr\u00e9 rouge en pointill\u00e9s \u00e0 la place du dessin. C\u2019est corrig\u00e9. <b>Ce carr\u00e9 n\u2019est pas un bogue d\u2019affichage, c\u2019est un signal volontaire</b> : plut\u00f4t qu\u2019un blanc qu\u2019on ne remarque jamais, une ic\u00f4ne absente se voit tout de suite." }
  ] },
  { v:'6.27', items:[
    { emoji: 'balance', titre: "L\u2019accueil et les parcelles ont \u00e9t\u00e9 remis \u00e0 plat",
      desc: "Les informations \u00e9taient empil\u00e9es les unes sous les autres, s\u00e9par\u00e9es par des traits, et tout avait la m\u00eame importance \u00e0 l\u2019\u0153il. D\u00e9sormais <b>chaque parcelle est une carte</b>, avec de l\u2019air autour, et <b>trois niveaux de lecture</b> : le nom, le chiffre qui compte, et le d\u00e9tail en petit. Sur l\u2019accueil, l\u2019avancement de la saison devient le sujet de l\u2019\u00e9cran au lieu d\u2019une vignette parmi d\u2019autres." },
    { emoji: 'valide', titre: "L\u2019\u00e9tat d\u2019une parcelle se lit d\u2019un coup d\u2019\u0153il",
      desc: "Chaque carte porte une <b>\u00e9tiquette de couleur cal\u00e9e \u00e0 droite</b> \u2014 en cours, bient\u00f4t fini, saison termin\u00e9e. Elles sont toujours au m\u00eame endroit : en descendant une liste de quarante parcelles, l\u2019\u0153il suit une colonne au lieu de chercher. Les pourcentages sont align\u00e9s au chiffre pr\u00e8s, \u00ab\u202f62\u202f%\u202f\u00bb et \u00ab\u202f100\u202f%\u202f\u00bb ne se d\u00e9calent plus." },
    { emoji: 'alerte', titre: "Le d\u00e9lai de r\u00e9entr\u00e9e ne se rate plus",
      desc: "Un d\u00e9lai de r\u00e9entr\u00e9e en cours \u00e9tait signal\u00e9 par un fin liser\u00e9 rouge sur le bord de la carte. C\u2019est maintenant une <b>\u00e9tiquette rouge dans la liste</b> et, dans la fiche, <b>un encart \u00e0 part avec le nombre d\u2019heures restantes en gros</b>. C\u2019est une obligation r\u00e9glementaire : elle doit arr\u00eater l\u2019\u0153il, pas se deviner." },
    { emoji: 'raisin', titre: "Le logo GUERETTECH remplace la grappe g\u00e9n\u00e9rique",
      desc: "L\u2019\u00e9cran de connexion et la premi\u00e8re installation affichaient l\u2019\u00e9moji grappe du t\u00e9l\u00e9phone \u2014 diff\u00e9rent sur chaque appareil. Ils affichent maintenant <b>le vrai logo</b>." },
    { emoji: 'balance', titre: "Les espaces suivent enfin une r\u00e8gle",
      desc: "Les marges de l\u2019application \u00e9taient choisies une par une \u2014 vingt valeurs diff\u00e9rentes, de 1 \u00e0 20 pixels. Les nouvelles cartes suivent maintenant <b>une \u00e9chelle unique par multiples de 4</b>, et les tailles de texte aussi. Les \u00e9crans respirent au m\u00eame rythme. Le reste de l\u2019application s\u2019y rangera \u00e9cran par \u00e9cran." },
    { emoji: 'bouclier', titre: "La console d\u2019administration aussi",
      desc: "L\u2019\u00e9cran r\u00e9serv\u00e9 \u00e0 l\u2019\u00e9diteur passe aux m\u00eames ic\u00f4nes. <b>Le journal des acc\u00e8s d\u00e9j\u00e0 enregistr\u00e9 reste lisible tel quel</b> : les lignes anciennes gardent leur pictogramme, on ne r\u00e9\u00e9crit pas un journal." },
    { emoji: 'rotation', titre: "Le bandeau de synchronisation et l\u2019\u00e9quipe du jour",
      desc: "Le bandeau du haut, la bulle de synchronisation, les pastilles d\u2019\u00e9quipe et le filtre du journal sont pass\u00e9s aux m\u00eames ic\u00f4nes. <b>Le bandeau reste color\u00e9</b> \u2014 vert quand tout est \u00e0 jour, orange quand il reste des modifications en attente." },
    { emoji: 'valide', titre: "Les boutons d\u2019une parcelle et les contr\u00f4les tracteur",
      desc: "Les boutons Niveaux, Passages, Annuler et Exclure d\u2019une fiche parcelle ont de vraies ic\u00f4nes. Les <b>six points de contr\u00f4le tracteur</b> (plein, huile, filtre, radiateur, pneus, lavage) n\u2019ont plus de pictogramme : leur nom est \u00e9crit juste \u00e0 c\u00f4t\u00e9, il y en avait six \u00e0 retenir pour rien." },
    { emoji: 'etincelles', titre: "Phyto, synchronisation et premi\u00e8re installation nettoy\u00e9s",
      desc: "Le bandeau de synchronisation en haut d\u2019\u00e9cran, les messages d\u2019erreur de connexion et l\u2019\u00e9cran de premi\u00e8re installation ne portent plus de petits dessins : la <b>couleur du bandeau dit d\u00e9j\u00e0</b> si c\u2019est en cours, r\u00e9ussi ou en attente." },
    { emoji: 'graphique', titre: "Pilotage : un seul jeu d\u2019ic\u00f4nes pour toute l\u2019application",
      desc: "L\u2019\u00e9cran Pilotage avait ses propres dessins, avec un trait un peu plus fin que partout ailleurs \u2014 une diff\u00e9rence qu\u2019on ne voit pas mais qu\u2019on sent. Il utilise maintenant <b>les m\u00eames ic\u00f4nes que le reste de l\u2019application</b>. Les pictogrammes des t\u00e2ches ont \u00e9t\u00e9 retir\u00e9s des listes : le nom du travail suffit." },
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o et les fiches d\u2019aide en vraies ic\u00f4nes",
      desc: "Le soleil, le nuage et la pluie affich\u00e9s sur l\u2019accueil \u00e9taient des \u00e9mojis : ils sont devenus des ic\u00f4nes nettes, de la m\u00eame famille que le reste. Les onze fiches d\u2019aide (le bouton \u00ab\u202f?\u202f\u00bb de chaque \u00e9cran) aussi. <b>Vos rel\u00e9v\u00e9s m\u00e9t\u00e9o d\u00e9j\u00e0 enregistr\u00e9s continuent de s\u2019afficher normalement</b>." },
    { emoji: 'carte', titre: "Moins de pictogrammes partout ailleurs",
      desc: "Messages de connexion, \u00e9crans d\u2019attente, filtres par t\u00e2che, avancement par t\u00e2che, alerte gel : les petits dessins qui pr\u00e9c\u00e9daient les textes ont \u00e9t\u00e9 retir\u00e9s ou remplac\u00e9s par de vraies ic\u00f4nes. Sur l\u2019ensemble de l\u2019application, on est pass\u00e9 de <b>920 pictogrammes \u00e0 422</b>." },
    { emoji: 'verre', titre: "La Cave se lit comme le reste",
      desc: "R\u00e9coltes, cuves, analyses et clients vrac passent aux m\u00eames \u00e9tiquettes de couleur. Les huit op\u00e9rations de cuve (chaptalisation, saign\u00e9e, levurage\u2026) <b>n\u2019ont plus de pictogramme</b> : le mot les dit mieux \u2014 huit petits dessins \u00e0 retenir, c\u2019\u00e9tait sept de trop." },
    { emoji: 'tracteur', titre: "Les sessions tracteur adoptent les m\u00eames cartes",
      desc: "Sessions, parc de machines, fiches de contr\u00f4le et historique de r\u00e9parations passent \u00e0 la m\u00eame pr\u00e9sentation : l\u2019activit\u00e9 en t\u00eate, <b>l\u2019\u00e9tat en \u00e9tiquette de couleur \u00e0 droite</b>, l\u2019avancement en gros chiffre. <b>La carte sombre d\u2019une session en cours reste sombre</b> \u2014 elle est faite pour se lire en cabine, au soleil." },
    { emoji: 'journal', titre: "Le journal se lit comme les parcelles",
      desc: "Chaque entr\u00e9e du journal devient une carte, avec le travail en t\u00eate, la personne et la parcelle en dessous, et <b>l\u2019\u00e9tat en \u00e9tiquette de couleur cal\u00e9e \u00e0 droite</b>. Le pictogramme qui pr\u00e9c\u00e9dait chaque travail a \u00e9t\u00e9 retir\u00e9. <b>La frise verticale \u00e0 gauche reste</b> : c\u2019est elle qui donne le fil du temps." },
    { emoji: 'boussole', titre: "La barre du bas a de vraies ic\u00f4nes",
      desc: "Les pictogrammes de la barre de navigation \u00e9taient des \u00e9mojis gris\u00e9s par un filtre. Ce sont maintenant <b>de vraies ic\u00f4nes</b>, toutes de la m\u00eame taille, qui <b>prennent la couleur verte de l\u2019onglet actif</b> au lieu d\u2019\u00eatre \u00e9teintes par un voile gris. C\u2019est plus net, et lisible en plein soleil." },
    { emoji: 'engrenage', titre: "Les \u00e9crans de R\u00e9glages passent aux m\u00eames cartes",
      desc: "Vos travaux, vos activit\u00e9s tracteur et les fiches d\u2019\u00e9quipe adoptent la m\u00eame pr\u00e9sentation que les parcelles : <b>une carte par \u00e9l\u00e9ment</b>, le nom en t\u00eate, les \u00e9tiquettes d\u2019\u00e9tat cal\u00e9es \u00e0 droite, et les boutons Modifier et Supprimer regroup\u00e9s en bas. <b>Rien ne change dans ce que font ces \u00e9crans</b> \u2014 ils se lisent simplement plus vite." },
    { emoji: 'loupe', titre: "La fiche d\u2019une parcelle tient sur un regard",
      desc: "Trois chiffres en t\u00eate \u2014 avancement, surface, travaux faits \u2014 puis les travaux de la saison en lignes align\u00e9es. Les pictogrammes qui pr\u00e9c\u00e9daient chaque ligne ont \u00e9t\u00e9 retir\u00e9s : <b>dans une liste, c\u2019est le texte qui porte l\u2019information</b>, et l\u2019\u0153il descend plus vite sans eux." }
  ] },
  { v:'6.26', items:[
    { emoji: 'etincelles', titre: "Les pictogrammes de R\u00e9glages sont devenus de vraies ic\u00f4nes",
      desc: "Les petits dessins color\u00e9s de l\u2019\u00e9cran R\u00e9glages \u00e9taient des \u00e9mojis : chaque t\u00e9l\u00e9phone les dessinait \u00e0 sa fa\u00e7on, ils ne s\u2019alignaient jamais avec le texte et gardaient leur couleur, m\u00eame en mode sombre ou en plein soleil. Ils sont remplac\u00e9s par un <b>jeu d\u2019ic\u00f4nes dessin\u00e9 pour l\u2019application</b>, identique partout, qui prend la couleur du texte \u00e0 c\u00f4t\u00e9 \u2014 et qui reste lisible \u00e0 la taille d\u2019un badge. <b>Rien ne change dans ce que fait l\u2019\u00e9cran</b> \u2014 c\u2019est son aspect qui change. Les autres \u00e9crans suivront." },
    { emoji: 'tracteur', titre: "L\u2019ic\u00f4ne d\u2019un type d\u2019activit\u00e9 se choisit dans une planche, plus dans une liste d\u2019\u00e9mojis",
      desc: "Quand vous cr\u00e9ez ou modifiez un type d\u2019activit\u00e9 tracteur, vous choisissez maintenant parmi <b>dix-huit ic\u00f4nes</b> au lieu de dix-huit \u00e9mojis. <b>Vos activit\u00e9s existantes gardent leur dessin</b> : rien n\u2019a \u00e9t\u00e9 r\u00e9\u00e9crit dans vos donn\u00e9es, l\u2019ancien \u00e9moji est simplement traduit \u00e0 l\u2019affichage." },
    { emoji: 'document', titre: "Le rapport mensuel et le registre phyto n\u2019impriment plus d\u2019\u00e9mojis",
      desc: "Sur un document imprim\u00e9 ou transform\u00e9 en PDF, un \u00e9moji sort en couleur au milieu d\u2019une page en noir \u2014 quand il ne sort pas en carr\u00e9 vide. Les documents produits depuis R\u00e9glages (rapport du mois, registre phytosanitaire, d\u00e9tail tracteur) utilisent d\u00e9sormais <b>les m\u00eames ic\u00f4nes que l\u2019\u00e9cran</b>, en noir, et les titres de section s\u2019appuient sur leur typographie plut\u00f4t que sur un pictogramme." },
    { emoji: 'valide', titre: "Les messages de confirmation ne r\u00e9p\u00e8tent plus leur pastille",
      desc: "\u00ab\u202f\u2705 Lien envoy\u00e9\u202f\u00bb, \u00ab\u202f\u274c Erreur\u202f\u00bb : le bandeau qui appara\u00eet en bas de l\u2019\u00e9cran porte <b>d\u00e9j\u00e0 une pastille de couleur</b> qui dit si \u00e7a a march\u00e9. L\u2019\u00e9moji en t\u00eate du message disait la m\u00eame chose une deuxi\u00e8me fois. Les messages ne gardent que leur phrase." }
  ] },
  { v:'6.25', items:[
    { emoji: 'ouvrier', titre: "La visite guid\u00e9e montre l\u2019\u00e9cran d\u2019un ouvrier \u2014 et qu\u2019un oubli se rattrape",
      desc: "La d\u00e9mo publique (le lien \u00ab\u202fVoir la d\u00e9mo\u202f\u00bb) faisait visiter le domaine depuis votre fauteuil, jamais depuis le t\u00e9l\u00e9phone de vos salari\u00e9s. Elle bascule d\u00e9sormais sur <b>la liste des parcelles telle qu\u2019un ouvrier l\u2019ouvre</b> : la t\u00e2che du jour, ses parcelles, un \u2713 \u00e0 cocher, rien d\u2019autre. Et le moment suivant montre que <b>vous pouvez cocher \u00e0 sa place</b> si personne ne l\u2019a fait \u2014 c\u2019est la premi\u00e8re question que pose tout le monde. <b>Rien ne change dans l\u2019application</b> : c\u2019est la vitrine qui change." },
    { emoji: 'bouclier', titre: "La d\u00e9mo montre une parcelle ferm\u00e9e par un d\u00e9lai de rentr\u00e9e",
      desc: "Elle promettait \u00ab\u202fdemain, la parcelle trait\u00e9e s\u2019affichera ferm\u00e9e\u202f\u00bb sans jamais le montrer. Deux parcelles apparaissent maintenant <b>barr\u00e9es en rouge dans la liste</b>, en accord avec ce que le Pilotage affichait d\u00e9j\u00e0 de son c\u00f4t\u00e9. La liste et le Pilotage se contredisaient." },
    { emoji: 'calendrier', titre: "Le bouton \u00ab\u202fPasser\u202f\u00bb de la visite quittait tout",
      desc: "Il annon\u00e7ait un saut d\u2019\u00e9cran et faisait une sortie : le visiteur perdait tous les moments suivants. Il y a d\u00e9sormais <b>\u00ab\u202fPasser ce moment\u202f\u00bb</b> et <b>\u00ab\u202fQuitter\u202f\u00bb</b>, et quitter m\u00e8ne au r\u00e9capitulatif final." },
    { emoji: 'chrono', titre: "Le r\u00e9capitulatif de fin ne compte plus que ce qu\u2019il a montr\u00e9",
      desc: "La plus grosse ligne du calcul de temps gagn\u00e9 n\u2019\u00e9tait <b>d\u00e9montr\u00e9e par aucun \u00e9cran</b> de la visite. Elle est sortie du total et annonc\u00e9e \u00e0 part. Trois lignes la remplacent \u2014 pointage du soir, carnet tracteur, papiers du contr\u00f4le \u2014 et chacune correspond \u00e0 un \u00e9cran que le visiteur vient de voir. Et <b>le r\u00e9capitulatif ne cite plus aucun tarif</b> : il ne compte qu\u2019en heures et en journ\u00e9es de bureau. Le prix se dit de vive voix." }
  ] },
  { v:'6.24', items:[
    { emoji: 'graphique', titre: "Les chiffres du haut du Pilotage ne vous suivent plus partout",
      desc: "Les quatre chiffres en t\u00eate du Pilotage s\u2019affichaient sur les <b>huit onglets</b>. Sur \u00c9conomie et sur Conformit\u00e9, ils r\u00e9p\u00e9taient mot pour mot l\u2019\u00e9cran juste en dessous. Ils ne restent d\u00e9sormais que sur <b>L\u2019ann\u00e9e</b> et <b>La campagne</b> \u2014 les deux niveaux de zoom, les deux endroits o\u00f9 ils servent \u00e0 choisir o\u00f9 aller. Sur Aujourd\u2019hui, le tableau de bord r\u00e9pondait d\u00e9j\u00e0 aux m\u00eames questions, en mieux." },
    { emoji: 'bouclier', titre: "La conformit\u00e9 quitte les chiffres du haut \u2014 elle ne parlait pas de la m\u00eame chose",
      desc: "Les trois autres chiffres se recadrent quand vous cliquez une campagne. Le cuivre, lui, se compte sur <b>sept ans glissants</b> : il ne bougeait pas, et donnait l\u2019impression d\u2019un chiffre fig\u00e9 ou faux. Il se lit en entier dans l\u2019onglet <b>Conformit\u00e9</b>. Rien n\u2019est perdu : le bouton \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb continue de remonter ses alertes, sur tous les onglets." },
    { emoji: 'goutte', titre: "La fen\u00eatre de traitement \u00e9tait affich\u00e9e \u00e0 deux endroits",
      desc: "La m\u00eame pr\u00e9vision vivait sur <b>Aujourd\u2019hui</b> (\u00ab\u202fTraiter\u202f?\u202f\u00bb) et dans <b>L\u2019\u00e9quipe &amp; le mat\u00e9riel</b> \u2014 deux cartes, une seule source. C\u2019est une d\u00e9cision du jour : elle reste dans Aujourd\u2019hui. Le verdict du moment est en grand, et <b>les cinq jours \u00e0 venir</b> se d\u00e9plient d\u2019un doigt juste en dessous. Rien n\u2019a \u00e9t\u00e9 retir\u00e9 du calcul." },
    { emoji: 'feuille', titre: "Le registre phyto passe dans Conformit\u00e9",
      desc: "Il \u00e9tait rang\u00e9 \u00e0 c\u00f4t\u00e9 du parc de tracteurs, alors qu\u2019il lit <b>exactement les m\u00eames traitements</b> que \u00ab\u202fPassages phyto / parcelle\u202f\u00bb. Il se place maintenant juste en dessous, en d\u00e9tail de ce total. Si vous l\u2019aviez masqu\u00e9, il reste masqu\u00e9 : votre r\u00e9glage a suivi la carte." },
    { emoji: 'curseurs', titre: "\u00ab\u202fSimuler\u202f\u00bb s\u2019appelle maintenant \u00ab\u202fD\u00e9cider\u202f\u00bb",
      desc: "Deux des trois cartes de cet onglet sont bien des simulations \u2014 rien n\u2019y est enregistr\u00e9. Mais la troisi\u00e8me, <b>l\u2019ordre de passage</b>, s\u2019enregistre et part sur l\u2019\u00e9cran de toute l\u2019\u00e9quipe. C\u2019est le seul endroit du Pilotage o\u00f9 vous changez ce que les autres voient, et il \u00e9tait rang\u00e9 sous un mot qui promettait le contraire. Rien ne change dans son fonctionnement." },
    { emoji: 'euro', titre: "Le budget de l\u2019ann\u00e9e se lit enfin mois par mois",
      desc: "Nouveau graphe dans <b>L\u2019ann\u00e9e</b> : votre <b>budget de vigne pr\u00e9vu</b> au bar\u00e8me (en tiret\u00e9) face \u00e0 la <b>d\u00e9pense r\u00e9elle</b> (en trait plein), cumul\u00e9s d\u2019un mois \u00e0 l\u2019autre. Les deux totaux \u00e9taient d\u00e9j\u00e0 sur la carte au-dessus ; la courbe dit <b>\u00e0 quel moment</b> l\u2019\u00e9cart se creuse. \u26a0\ufe0f <b>Cet \u00e9cart n\u2019est pas un d\u00e9passement</b> : le pr\u00e9vu ne chiffre que le travail de vigne, la d\u00e9pense r\u00e9elle porte tout le domaine, cave et atelier compris. L\u2019\u00e9cran l\u2019\u00e9crit sous le graphe." },
  ] },
  { v:'6.23', items:[
    { emoji: 'doigt', titre: "Le Pilotage tient enfin sur un t\u00e9l\u00e9phone",
      desc: "Sur t\u00e9l\u00e9phone, il fallait descendre de <b>728 pixels</b> \u2014 presque un \u00e9cran entier \u2014 avant d\u2019atteindre le premier chiffre. Cinq bandeaux s\u2019empilaient\u202f: le nom du domaine, le fil d\u2019Ariane, les onglets, les quatre chiffres du haut, puis le titre de l\u2019onglet. C\u2019est tomb\u00e9 \u00e0 <b>442 pixels</b>. Le <b>titre de l\u2019onglet</b> a disparu\u202f: la barre d\u2019onglets le disait d\u00e9j\u00e0. Les <b>quatre chiffres du haut</b> se rangent en une ligne qui d\u00e9file, au lieu de deux rang\u00e9es \u2014 ils restent tous les quatre, et tous visibles. Le <b>nom du domaine</b> prend moins de place\u202f: on sait chez qui on est." },
    { emoji: 'engrenage', titre: "\u00ab\u202fChoisir les indicateurs\u202f\u00bb devient une roue crant\u00e9e",
      desc: "Le bouton occupait une ligne enti\u00e8re \u00e0 lui seul. Il est maintenant \u00e0 droite du sous-titre de l\u2019onglet, sous forme de <b>roue crant\u00e9e</b>. Le panneau qu\u2019il ouvre n\u2019a pas boug\u00e9." },
  ] },
  { v:'6.22', items:[
    { emoji: 'curseurs', titre: "Le simulateur\u202f: les notices \u00ab\u202fcomment lire\u202f\u00bb passent derri\u00e8re le \u00ab\u202fi\u202f\u00bb",
      desc: "Chaque \u00e9tape du simulateur portait un pav\u00e9 \u00ab\u202fComment lire\u202f\u00bb entre son titre et son graphique \u2014 six au total. Utile la premi\u00e8re fois\u202f; ensuite on le traversait pour atteindre le dessin. Ils sont maintenant derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb du titre d\u2019\u00e9tape. <b>La l\u00e9gende des couleurs reste affich\u00e9e</b>\u202f: celle-l\u00e0, on ne la lit pas, on la consulte du regard \u00e0 chaque retour sur le graphe." },
    { emoji: 'bouclier', titre: "Conformit\u00e9 et Cave suivent la m\u00eame r\u00e8gle",
      desc: "Cuivre sur sept ans, passages et IFT, d\u00e9lai de rentr\u00e9e, part des anges, soutirage et malo, ouillages, rendements\u202f: chaque carte garde <b>une ligne</b> sous son titre, et son mode de calcul derri\u00e8re le \u00ab\u202fi\u202f\u00bb. <b>Ce qui vous prot\u00e8ge reste affich\u00e9\u202f</b>: \u00ab\u202fne pas p\u00e9n\u00e9trer la parcelle sans \u00e9quipement avant l\u2019heure indiqu\u00e9e\u202f\u00bb ne se replie pas." },
    { emoji: 'valide', titre: "Les huit onglets du Pilotage sont align\u00e9s",
      desc: "C\u2019est la fin de ce chantier. Partout dans le Pilotage\u202f: le <b>chiffre</b> d\u2019abord, une <b>ligne</b> qui dit sur quoi il porte, le <b>d\u00e9tail du calcul</b> derri\u00e8re le \u00ab\u202fi\u202f\u00bb, et un <b>bouton</b> quand il y a quelque chose \u00e0 faire. Rien n\u2019a \u00e9t\u00e9 supprim\u00e9 en chemin\u202f: <b>34 fiches</b> conservent l\u2019int\u00e9gralit\u00e9 des explications." },
  ] },
  { v:'6.21', items:[
    { emoji: 'lien', titre: "\u00c9conomie\u202f: les derniers pav\u00e9s d\u2019explication passent derri\u00e8re le \u00ab\u202fi\u202f\u00bb",
      desc: "Chaque carte d\u2019\u00c9conomie portait sous son titre un paragraphe qui expliquait <b>comment</b> son chiffre est fabriqu\u00e9\u202f: l\u2019hypoth\u00e8se de conversion du prix de revient, le d\u00e9tail des colonnes du tableau des parcelles, la diff\u00e9rence entre heures pay\u00e9es et heures au champ\u2026 Utile la premi\u00e8re fois, relu cent fois ensuite. Ces paragraphes sont maintenant derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb de chaque carte. Sous le titre, il ne reste plus qu\u2019une ligne\u202f: <b>sur quoi porte le chiffre</b>. L\u2019onglet \u00c9conomie est d\u00e9sormais enti\u00e8rement pass\u00e9 \u00e0 cette r\u00e8gle." },
  ] },
  { v:'6.20', items:[
    { emoji: 'graphique', titre: "Le verdict d\u2019\u00c9conomie va droit au but",
      desc: "La carte qui r\u00e9pond \u00e0 \u00ab\u202fo\u00f9 j\u2019en suis\u202f\u00bb m\u00e9langeait trois choses dans un m\u00eame paragraphe\u202f: le constat, la mise en garde sur la fa\u00e7on dont le chiffre est calcul\u00e9, et un chemin \u00e0 retenir. D\u00e9sormais le constat tient en une ou deux phrases, la mise en garde est derri\u00e8re le petit \u00ab\u202fi\u202f\u00bb, et \u00ab\u202fR\u00e9glages \u203a T\u00e2ches\u202f\u00bb ou \u00ab\u202fPostes & travaux\u202f\u00bb sont des <b>boutons</b>. Quand la cadence affich\u00e9e vient de la campagne pr\u00e9c\u00e9dente, une ligne sous le texte le dit, avec le nom de la campagne et l\u2019avancement qu\u2019il reste \u00e0 atteindre." },
  ] },
  { v:'6.19', items:[
    { emoji: 'recu', titre: "L\u2019onglet Exercice s\u2019aligne\u202f: sept avertissements deviennent une carte",
      desc: "M\u00eame changement que la Synth\u00e8se la semaine derni\u00e8re, appliqu\u00e9 au bilan d\u2019un exercice. Vous voyez d\u2019abord <b>combien de postes sortent \u00e0 z\u00e9ro</b> et le bouton pour aller les renseigner\u202f; le reste se replie derri\u00e8re la puce \u00ab\u202fN remarques\u202f\u00bb. Le rappel \u00ab\u202fce total n\u2019est pas un compte de r\u00e9sultat\u202f\u00bb <b>reste affich\u00e9</b> \u2014 c\u2019est lui qui vous \u00e9vite de comparer ce chiffre ligne \u00e0 ligne au bilan de votre comptable. La liste de ce qui n\u2019y est pas (fermage, amortissements, assurances\u2026) est derri\u00e8re son petit \u00ab\u202fi\u202f\u00bb." },
  ] },
  { v:'6.18', items:[
    { emoji: 'carre', titre: "\u00c9conomie\u202f: le mur d\u2019avertissements devient une carte et des boutons",
      desc: "L\u2019onglet \u00c9conomie pouvait afficher <b>douze pav\u00e9s color\u00e9s</b> les uns sous les autres avant le premier chiffre \u2014 et tous de la m\u00eame taille, si bien que \u00ab\u202fla main-d\u2019\u0153uvre compte pour z\u00e9ro\u202f\u00bb pesait autant que \u00ab\u202fle chiffre montera m\u00e9caniquement\u202f\u00bb. \u00c0 la place\u202f: une <b>carte de fiabilit\u00e9</b> qui dit combien de postes de d\u00e9pense sortent \u00e0 z\u00e9ro, lesquels, et pose <b>un bouton par poste</b> pour aller renseigner ce qui manque. Le reste \u2014 les remarques sur la lecture des chiffres \u2014 se replie derri\u00e8re une puce\u202f: touchez-la pour tout lire. <b>Rien n\u2019est supprim\u00e9\u202f</b>: tout est toujours calcul\u00e9 et toujours lisible." },
  ] },
  { v:'6.17', items:[
    { emoji: 'equipe', titre: "\u00ab\u202fL\u2019\u00e9quipe & le mat\u00e9riel\u202f\u00bb\u202f: six cartes remises \u00e0 plat",
      desc: "Chaque carte de cet onglet affiche maintenant, <b>sans qu\u2019on la d\u00e9plie</b>, son chiffre et la ligne qui dit sur quoi il a \u00e9t\u00e9 calcul\u00e9. Le parc tracteur remonte la <b>r\u00e9vision la plus proche</b> \u2014 il fallait ouvrir la carte pour la voir. La cuve GNR affiche les <b>litres</b> plut\u00f4t que le pourcentage, parce que c\u2019est ce qu\u2019on lit pour d\u00e9cider d\u2019un plein. Le d\u00e9tail du calcul de chaque chiffre est derri\u00e8re son petit \u00ab\u202fi\u202f\u00bb." },
    { emoji: 'lien', titre: "Les phrases qui vous envoyaient ailleurs sont devenues des boutons",
      desc: "\u00ab\u202fCuve GNR \u00e0 renseigner (Tracteur \u203a Entretien)\u202f\u00bb, \u00ab\u202ffiches \u00e0 passer en Inactif\u202f\u00bb\u202f: il fallait lire, retenir le chemin, sortir de l\u2019\u00e9cran et retrouver le bon onglet. Ce sont d\u00e9sormais des <b>boutons</b> qui ouvrent l\u2019\u00e9cran directement, au bon endroit, avec un clignotement pour vous dire o\u00f9 regarder." },
  ] },
  { v:'6.16', items:[
    { emoji: 'dossier', titre: "Le Pilotage arrive rang\u00e9 : le chiffre d\u2019abord, le d\u00e9tail au besoin",
      desc: "Les blocs du Pilotage s\u2019ouvraient <b>tous en m\u00eame temps</b> d\u00e8s l\u2019arriv\u00e9e. Comme un bloc ouvert prend toute la largeur, sept indicateurs faisaient sept \u00e9crans \u00e0 faire d\u00e9filer, et l\u2019on cherchait un chiffre au milieu de ses explications. D\u00e9sormais chaque bloc est une <b>carte compacte</b>, et elles se rangent <b>c\u00f4te \u00e0 c\u00f4te</b>\u202f: sur un onglet, vous voyez tous les chiffres d\u2019un coup d\u2019\u0153il. <b>Rien n\u2019est cach\u00e9</b>\u202f: le chiffre et la ligne qui dit sur quoi il a \u00e9t\u00e9 calcul\u00e9 \u2014 sa date, sa source, son p\u00e9rim\u00e8tre \u2014 restent affich\u00e9s carte ferm\u00e9e. Touchez une carte pour voir son d\u00e9tail\u202f; elle s\u2019ouvre en grand, et la pr\u00e9c\u00e9dente se referme." },
    { emoji: 'balance', titre: "Vos blocs d\u00e9pli\u00e9s repartent une fois du r\u00e9glage d\u2019usine",
      desc: "Cette mise \u00e0 jour <b>remet une seule fois</b> les cartes du Pilotage \u00e0 l\u2019\u00e9tat repli\u00e9, y compris celles que vous aviez ouvertes ou ferm\u00e9es vous-m\u00eame\u202f: la disposition ne veut plus dire la m\u00eame chose qu\u2019avant. <b>Vos autres choix ne bougent pas</b> \u2014 les indicateurs coch\u00e9s dans \u00ab\u202fChoisir les indicateurs\u202f\u00bb, l\u2019onglet du graphe, la vue du camembert restent comme vous les aviez laiss\u00e9s." },
  ] },
  { v:'6.15', items:[
    { emoji: 'info', titre: "Les explications de calcul passent derri\u00e8re un petit \u00ab\u202fi\u202f\u00bb",
      desc: "Le Pilotage affichait en permanence <b>neuf pages</b> de texte expliquant comment chaque chiffre est calcul\u00e9. C\u2019est utile la premi\u00e8re fois, encombrant les cent suivantes\u202f: on relisait la m\u00e9thode pour atteindre le nombre. Ces explications se rangent d\u00e9sormais derri\u00e8re un <b>petit rond \u00ab\u202fi\u202f\u00bb</b>, \u00e0 c\u00f4t\u00e9 du chiffre concern\u00e9\u202f: touchez-le et la fiche s\u2019ouvre. <b>Rien n\u2019est perdu</b>, et ce qui <b>cadre</b> un chiffre \u2014 sa date, sa source, son p\u00e9rim\u00e8tre \u2014 reste \u00e0 l\u2019\u00e9cran, en une ligne. Trois endroits l\u2019inaugurent\u202f: la capacit\u00e9 au pic, l\u2019\u00e9cart de cadence, et les deux fa\u00e7ons de compter l\u2019ann\u00e9e. Les autres suivront." },
  ] },
  { v:'6.14', items:[
    { emoji: 'retour', titre: "L\u2019\u00e9cart de cadence se taisait alors que l\u2019an dernier \u00e9tait lisible",
      desc: "En d\u00e9but de p\u00e9riode, l\u2019indicateur \u00ab\u202f\u00e9cart de cadence\u202f\u00bb affichait un tiret\u202f: il attend <b>40\u202f% du bar\u00e8me r\u00e9alis\u00e9</b> avant de se prononcer, parce qu\u2019un travail de janvier ne pr\u00e9dit pas celui de juin. Mais quand la <b>m\u00eame p\u00e9riode de la campagne pr\u00e9c\u00e9dente</b> \u00e9tait archiv\u00e9e, elle \u00e9tait ignor\u00e9e alors qu\u2019elle disait quelque chose. L\u2019\u00e9cran la reprend d\u00e9sormais comme <b>hypoth\u00e8se de projection</b> \u2014 et le dit\u202f: la ligne porte un <b>\u21a9</b> et nomme la campagne d\u2019o\u00f9 vient le chiffre. Elle sera remplac\u00e9e par la vraie mesure d\u00e8s le seuil atteint. Si aucune campagne comparable n\u2019est archiv\u00e9e, l\u2019\u00e9cran continue de le dire plut\u00f4t que d\u2019inventer." },
    { emoji: 'chrono', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 n\u2019avait qu\u2019un compteur d\u2019heures affich\u00e9",
      desc: "Quand quelqu\u2019un finit un contrat puis en resigne un autre dans la <b>m\u00eame ann\u00e9e civile</b>, il a <b>deux compteurs des 1607\u202fh</b>, chacun proratis\u00e9 \u00e0 la dur\u00e9e de son contrat. L\u2019\u00e9cran n\u2019en montrait qu\u2019un\u202f: celui du contrat en cours. Les contrats <b>sold\u00e9s dans l\u2019ann\u00e9e</b> ont maintenant leur propre carte, au-dessus, avec leurs dates, leurs heures faites et leur plafond. Le calcul, lui, \u00e9tait d\u00e9j\u00e0 juste \u2014 c\u2019est l\u2019affichage qui \u00e9tait incomplet." },
    { emoji: 'euro', titre: "Le taux horaire moyen comptait un mi-temps comme un temps plein",
      desc: "Quand une parcelle n\u2019a pas d\u2019\u00e9quipe nomm\u00e9e au journal, son co\u00fbt est valoris\u00e9 au <b>taux moyen du domaine</b>. Ce moyen \u00e9tait une simple moyenne par t\u00eate\u202f: quelqu\u2019un pr\u00e9sent quatre mois pesait autant qu\u2019un permanent. Il est d\u00e9sormais <b>pond\u00e9r\u00e9 par les heures annuelles</b> de chaque grille horaire. Sur un domaine qui m\u00e9lange permanents et saisonniers, attendez-vous \u00e0 un chiffre l\u00e9g\u00e8rement diff\u00e9rent \u2014 plus proche de ce que vous payez r\u00e9ellement." },
  ] },
  { v:'6.13', items:[
    { emoji: 'graphique', titre: "La courbe d\u2019effectif ne bougeait pas quand vous modifiiez un contrat",
      desc: "Vous saisissiez une date de contrat dans R\u00e9glages, vous reveniez sur <b>Pilotage</b>, et la courbe \u00ab\u202fpersonnes n\u00e9cessaires par semaine\u202f\u00bb affichait toujours l\u2019ancien effectif. Idem apr\u00e8s avoir coch\u00e9 \u00ab\u202fBureau\u202f\u00bb, chang\u00e9 l\u2019effectif d\u2019une \u00e9quipe collective, corrig\u00e9 une surface ou des heures par hectare. L\u2019\u00e9cran ne se remettait \u00e0 jour qu\u2019en <b>rechargeant l\u2019application</b>, et rien ne le signalait\u202f: la courbe \u00e9tait parfaitement lisible, simplement p\u00e9rim\u00e9e. Elle suit maintenant vos saisies imm\u00e9diatement." },
    { emoji: 'personne', titre: "Une personne mise en \u00ab\u202finactif\u202f\u00bb disparaissait de vos campagnes pass\u00e9es",
      desc: "Passer quelqu\u2019un en <b>inactif</b> sert \u00e0 ne plus avoir \u00e0 le s\u00e9lectionner tous les jours\u202f; \u00e7a ne devrait rien changer \u00e0 ce qu\u2019il a fait. Pourtant, si sa fiche ne portait <b>aucune date de contrat</b>, il sortait de <b>toutes</b> les p\u00e9riodes \u2014 y compris des <b>campagnes archiv\u00e9es</b>, dont l\u2019effectif et les co\u00fbts se rejouaient alors avec une personne de moins. Une fiche sans dates est un <b>CDI depuis le d\u00e9but</b>\u202f: elle compte partout, quel que soit son statut." },
  ] },
  { v:'6.12', items:[
    { emoji: 'raisin', titre: "Deux documents du Cuvier existaient sans que personne puisse les ouvrir",
      desc: "Le <b>contr\u00f4le de maturit\u00e9</b> et le <b>cahier de cuverie</b> \u00e9taient dans l\u2019application depuis quelques jours, mais aucun bouton n\u2019y menait. Ils sont d\u00e9sormais dans <b>R\u00e9glages \u203a App \u203a Documents</b>. Le premier reprend vos rel\u00e8vements d\u2019avant vendange en un tableau \u2014 une ligne par parcelle, une colonne par jour, <b>dans l\u2019ordre de maturit\u00e9</b>, avec la vitesse de progression. Le second donne <b>une page par cuve</b> : densit\u00e9 corrig\u00e9e \u00e0 20\u00a0\u00b0C, sucre restant estim\u00e9, remontages, pigeages, op\u00e9rations et cuv\u00e9e de sortie." },
    { emoji: 'carte', titre: "Le vignoble ne sortait qu\u2019en tableur",
      desc: "L\u2019<b>\u00e9tat du vignoble</b> tient sur une page\u00a0: une ligne par parcelle avec la surface, le c\u00e9page, la commune, l\u2019avancement, le dernier travail et le dernier rendement, puis la r\u00e9partition par c\u00e9page. Sa derni\u00e8re colonne dit <b>ce qui manque</b> \u2014 c\u00e9page absent, aucune position, aucun contour \u2014 et la fin du document les compte et les nomme. C\u2019est la feuille \u00e0 cocher d\u2019une installation." },
    { emoji: 'personne', titre: "Le relev\u00e9 d\u2019un salari\u00e9 se cachait dans le Planning",
      desc: "C\u2019est le document qu\u2019on vous demande en premier en cas de contr\u00f4le, et il fallait ouvrir le Planning, trouver la fiche de la personne, puis le bouton PDF. Il figure maintenant dans <b>R\u00e9glages \u203a App \u203a Documents</b>, avec le choix du salari\u00e9 et du mois. Il porte en plus <b>la liste dat\u00e9e des contrats</b> \u2014 chacun avec son type, et les <b>coupures</b> signal\u00e9es, puisque c\u2019est la coupure qui d\u00e9cide si le compteur repart de z\u00e9ro \u2014 et <b>les cong\u00e9s pay\u00e9s</b> de la p\u00e9riode." },
    { emoji: 'tracteur', titre: "Votre carnet d\u2019entretien portait le nom de l\u2019\u00e9diteur",
      desc: "Il s\u2019intitulait « Ma Vigne \u2014 Entretien tracteurs » et se signait « \u00a9 GUERETTECH », l\u00e0 o\u00f9 tous vos autres documents portent <b>le nom de votre domaine</b>. C\u2019est votre carnet, pas le n\u00f4tre. Il reprend l\u2019en-t\u00eate commun \u2014 domaine, titre, machines concern\u00e9es, date \u2014 et les m\u00eames polices que le reste. Les marges n\u2019ont pas boug\u00e9\u00a0: rien ne se d\u00e9cale dans les tableaux." },
  ] },
  { v:'6.11', items:[
    { emoji: 'carre', titre: "Le filtre \u00ab\u00a0\u00c0 faire\u00a0\u00bb des parcelles r\u00e9pond enfin",
      desc: "Quand vous filtriez les parcelles par t\u00e2che, la puce <b>\u00ab\u00a0\u{1F532}\u00a0\u00c0 faire\u00a0/\u00a0\u{1F441}\u00a0Toutes\u00a0\u00bb</b> qui appara\u00eet \u00e0 droite ne faisait <b>rien du tout</b>\u00a0: le clic \u00e9chouait en silence, sans message, et la liste restait telle quelle. Elle bascule d\u00e9sormais correctement entre les parcelles qui restent \u00e0 faire et toutes les parcelles." }
  ]},
  { v:'6.10', items:[
    { emoji: 'dossier', titre: "La fiche d\u2019un salari\u00e9 raconte enfin son histoire",
      desc: "Le contrat, les contrats pr\u00e9c\u00e9dents, le renouvellement et le taux horaire \u00e9taient quatre blocs s\u00e9par\u00e9s qui ne se parlaient pas\u00a0: on lisait des cases, jamais une suite. La fiche s\u2019ouvre maintenant sur <b>le contrat en cours</b> \u2014 type, dates, grille, taux, et s\u2019il est annualis\u00e9 ou pay\u00e9 \u00e0 l\u2019heure \u2014 puis sur <b>un historique dat\u00e9</b> o\u00f9 chaque changement a sa ligne. Le bouton <b>\u00ab\u00a0Ajouter un \u00e9v\u00e9nement\u00a0\u00bb</b> ne demande plus une valeur mais <b>ce qui s\u2019est pass\u00e9</b>\u00a0: une embauche, un renouvellement, une fin de contrat, une augmentation. Chacun annonce son effet <b>avant</b> que vous validiez." },
    { emoji: 'secateur', titre: "La coupure entre deux contrats se voit",
      desc: "C\u2019est elle qui d\u00e9cide si le compteur d\u2019heures repart de z\u00e9ro, et elle n\u2019\u00e9tait affich\u00e9e nulle part. L\u2019historique la dessine d\u00e9sormais en clair\u00a0: <i>coupure de 23 jours, le compteur du pr\u00e9c\u00e9dent est sold\u00e9</i>. Prolonger un contrat et en signer un nouveau ne se ressemblent plus \u2014 le premier garde un seul compteur, le second en ouvre un." },
    { emoji: 'cloche', titre: "Le rappel de fin de contrat ne peut plus se taire",
      desc: "L\u2019alerte \u00e0 trente jours lisait un champ facultatif, \u00ab\u00a0date de renouvellement\u00a0\u00bb. Le remplir <b>\u00e9teignait</b> l\u2019alerte de fin de contrat\u00a0: indiquer un renouvellement pr\u00e9vu en janvier faisait taire l\u2019application sur un CDD qui se terminait en ao\u00fbt. Le rappel lit maintenant la <b>fin du contrat</b>, toujours renseign\u00e9e, et propose directement de renouveler ou d\u2019acter l\u2019arr\u00eat. Les deux champs de renouvellement disparaissent." },
    { emoji: 'calendrier', titre: "La grille horaire suit le contrat",
      desc: "Changer quelqu\u2019un de grille recalculait ses heures pr\u00e9vues depuis janvier, donc ses heures suppl\u00e9mentaires, sans rien annoncer. La grille est d\u00e9sormais un attribut du contrat\u00a0: elle se choisit \u00e0 l\u2019embauche, s\u2019affiche dans le bandeau, et un changement ne s\u2019applique qu\u2019\u00e0 partir du contrat qui le porte." }
  ]},
  { v:'6.09', items:[
    { emoji: 'journal', titre: "Prolonger un contrat ne fait plus dispara\u00eetre l\u2019ancienne date",
      desc: "Quand vous repoussiez la date de fin d\u2019un contrat en cours, l\u2019ancienne \u00e9tait <b>\u00e9cras\u00e9e sans un mot</b>\u00a0: plus moyen de savoir jusqu\u2019o\u00f9 courait le contrat avant l\u2019avenant. C\u2019est d\u00e9sormais un <b>renouvellement</b>, qui garde la trace des deux dates. Le contrat reste <b>un seul contrat</b>, avec un seul compteur d\u2019heures\u00a0\u2014 prolonger n\u2019est pas r\u00e9embaucher. Corriger une faute de frappe dans une date, en revanche, r\u00e9\u00e9crit simplement la ligne\u00a0: les deux gestes sont distincts, comme pour les taux horaires. <b>L\u2019\u00e9cran ne change pas</b>, c\u2019est le m\u00eame formulaire." }
  ]},
  { v:'6.08', items:[
    { emoji: 'euro', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 retrouve ses heures et son co\u00fbt",
      desc: "Depuis la version pr\u00e9c\u00e9dente, l\u2019application gardait bien les contrats pass\u00e9s d\u2019un salari\u00e9\u00a0\u2014 mais seulement pour dire qu\u2019il \u00e9tait <b>l\u00e0</b>. Ses heures et son salaire, eux, restaient \u00e0 z\u00e9ro sur toute la p\u00e9riode de l\u2019ancien contrat. Un CDD de mars \u00e0 juillet, archiv\u00e9 puis suivi d\u2019un nouveau contrat en ao\u00fbt, pesait <b>0\u00a0h et 0\u00a0\u20ac</b> dans l\u2019exercice au lieu de 735\u00a0h. Il n\u2019apparaissait m\u00eame pas comme une ligne vide\u00a0: il disparaissait de la liste, et le total \u00e9tait donc faux sans que rien ne le signale. La masse salariale, la capacit\u00e9 de l\u2019\u00e9quipe, la cadence et la pr\u00e9sence r\u00e9elle comptent d\u00e9sormais <b>tous</b> les contrats de la fiche. Attendez-vous \u00e0 voir ces chiffres monter\u00a0: ils \u00e9taient sous-\u00e9valu\u00e9s." },
    { emoji: 'chrono', titre: "Un saisonnier n\u2019a plus de compteur annuel qui n\u2019a pas lieu d\u2019\u00eatre",
      desc: "Les TESA, saisonniers et extras sont pay\u00e9s <b>\u00e0 l\u2019heure</b>\u00a0: l\u2019annualisation ne les concerne pas. L\u2019application leur affichait pourtant un plafond de 1607\u00a0h proratis\u00e9, des heures de modulation et un \u00ab\u00a0reste \u00e0 faire\u00a0\u00bb\u00a0\u2014 des nombres qu\u2019ils ne toucheront jamais, et qu\u2019on ne v\u00e9rifie pas parce qu\u2019ils ont l\u2019air d\u2019une mesure. Leur fiche montre maintenant ce qui les concerne vraiment\u00a0: heures faites et jours travaill\u00e9s. Les CDI, CDD, apprentis et g\u00e9rants ne changent pas." },
    { emoji: 'document', titre: "Le relev\u00e9 PDF d\u2019un mois pass\u00e9 ne sort plus blanc",
      desc: "Quand un contrat \u00e9tait archiv\u00e9, le relev\u00e9 des mois de ce contrat sortait <b>vide</b>\u00a0\u2014 pas une erreur, une page sans lignes. Le relev\u00e9 de mars d\u2019un salari\u00e9 r\u00e9embauch\u00e9 en ao\u00fbt \u00e9tait donc introuvable, alors qu\u2019il en a besoin pour la MSA. Chaque mois sort d\u00e9sormais le relev\u00e9 du contrat qui le couvre, et l\u2019en-t\u00eate indique lequel." }
  ]},
  { v:'6.07', items:[
    { emoji: 'epingle', titre: "La barre du haut dispara\u00eessait d\u00e8s qu\u2019on faisait d\u00e9filer",
      desc: "La ligne qui dit <b>ce que vous regardez</b> \u2014 l\u2019exercice, ou une campagne \u00e9pingl\u00e9e \u2014 passait sous la barre des onglets au premier d\u00e9filement. Vous pouviez donc lire un tableau filtr\u00e9 sur les vendanges en croyant regarder l\u2019ann\u00e9e enti\u00e8re. Les deux barres se rangent d\u00e9sormais l\u2019une sous l\u2019autre, et le fil reste visible du haut en bas de la page." },
    { emoji: 'dossier', titre: "Trois \u00e9crans r\u00e9pondaient sur une autre p\u00e9riode que celle affich\u00e9e",
      desc: "\u00c9conomie chiffre la <b>p\u00e9riode consult\u00e9e</b>, la Cave suit le <b>mill\u00e9sime</b>, la Conformit\u00e9 roule sur <b>sept ans</b>\u202f: aucun des trois ne se recadre sur la campagne \u00e9pingl\u00e9e en haut, et ils ne le disaient pas. Chacun l\u2019annonce maintenant en une ligne, au-dessus de ses chiffres. Rien n\u2019a chang\u00e9 dans les calculs \u2014 seulement dans ce qu\u2019ils avouent." },
    { emoji: 'etiquette', titre: "Le titre de « L\u2019ann\u00e9e » \u00e9tait vide, et deux onglets portaient deux noms",
      desc: "On cliquait « La campagne » et on atterrissait sous « Avancement »\u202f; « Simuler » s\u2019intitulait « D\u00e9cider ». Et le niveau <b>L\u2019ann\u00e9e</b> s\u2019ouvrait carr\u00e9ment <b>sans titre</b>. Les libell\u00e9s sont align\u00e9s. L\u2019onglet « L\u2019\u00e9quipe &amp; les t\u00e2ches » devient <b>« L\u2019\u00e9quipe &amp; le mat\u00e9riel »</b>\u202f: il ne montrait aucune t\u00e2che, elles vivent dans « La campagne »." },
    { emoji: 'check', titre: "Vos cases coch\u00e9es dans « L\u2019ann\u00e9e » ne tenaient pas la nuit",
      desc: "Les deux indicateurs du niveau <b>L\u2019ann\u00e9e</b> \u2014 les deux fa\u00e7ons de compter, et les 52 semaines \u2014 n\u2019\u00e9taient pas connus du r\u00e9glage\u202f: d\u00e9coch\u00e9s, ils se recochaient tout seuls \u00e0 la session suivante. Votre choix est d\u00e9sormais m\u00e9moris\u00e9 comme celui des autres onglets." },
    { emoji: 'lien', titre: "« Renseignez Réglages › Saisons » sans le moindre lien",
      desc: "Sept \u00e9crans vides vous renvoyaient \u00e0 un r\u00e9glage <b>en texte mort</b>, avec un nom de section qui n\u2019existe nulle part\u202f: la carte s\u2019appelle <b>Campagne</b>. Chacun porte maintenant un bouton qui ouvre le bon \u00e9cran, fait d\u00e9filer jusqu\u2019au bon bloc et le fait clignoter \u2014 comme le fait d\u00e9j\u00e0 la liste « \u00e0 compl\u00e9ter ». Le bouton « Voir les deux cadres », lui, ouvrait Réglages au lieu du panneau qu\u2019il annon\u00e7ait." },
    { emoji: 'bouclier', titre: "La conformit\u00e9 affichait 0 kg de cuivre quand le calcul \u00e9chouait",
      desc: "Un z\u00e9ro est une mesure\u202f: \u00e9crire « 0 kg Cu \u00b7 aucun apport enregistr\u00e9 » l\u00e0 o\u00f9 la synth\u00e8se n\u2019avait pas abouti revenait \u00e0 certifier une absence qu\u2019on n\u2019avait pas v\u00e9rifi\u00e9e. C\u2019est un tiret d\u00e9sormais, avec la pastille qui dit o\u00f9 aller voir." },
  ] },
  { v:'6.06', items:[
    { emoji: 'euro', titre: "Augmenter quelqu\u2019un rechiffrait tout son pass\u00e9",
      desc: "Le taux horaire d\u2019un salari\u00e9 \u00e9tait <b>un seul nombre, sans date</b>. Le jour o\u00f9 vous le changiez, l\u2019application recalculait avec le nouveau taux <b>toutes les heures d\u00e9j\u00e0 travaill\u00e9es</b>\u202f: le co\u00fbt de la taille de f\u00e9vrier, celui d\u2019une campagne archiv\u00e9e, et jusqu\u2019au total d\u2019un <b>exercice comptable d\u00e9j\u00e0 clos</b>. Une ligne \u00ab\u202fdernier changement\u202f\u00bb s\u2019affichait bien sous le champ, mais elle n\u2019entrait dans aucun calcul\u202f: elle donnait l\u2019impression que c\u2019\u00e9tait g\u00e9r\u00e9. \u00c0 partir de maintenant, chaque heure est valoris\u00e9e au taux qui valait <b>ce jour-l\u00e0</b>." },
    { emoji: 'calendrier', titre: "Une augmentation porte une date, et ne remonte pas le temps",
      desc: "Dans la fiche d\u2019un salari\u00e9 (R\u00e9glages \u203a \u00c9quipe), sous le taux, un champ <b>\u00ab \u00c0 partir du \u00bb</b> pr\u00e9-rempli \u00e0 aujourd\u2019hui. Vous changez la valeur, vous enregistrez\u202f: le taux pr\u00e9c\u00e9dent reste attach\u00e9 aux heures d\u00e9j\u00e0 faites. La fiche affiche d\u00e9sormais <b>la liste compl\u00e8te</b> de ce que ce taux a valu et depuis quand. Si vous avez simplement <b>tap\u00e9 un chiffre de travers</b>, videz la date\u202f: la derni\u00e8re ligne est corrig\u00e9e sur place, sans inventer d\u2019augmentation qui n\u2019a pas eu lieu." },
    { emoji: 'graphique', titre: "L\u2019exercice coupe le mois \u00e0 la bonne date",
      desc: "Une augmentation au 15 mars ne revalorise plus les quinze premiers jours du mois\u202f: les heures sont d\u00e9coup\u00e9es \u00e0 la date exacte du changement. Dans <b>Pilotage \u203a \u00c9conomie \u203a Exercice</b>, la colonne du taux montre alors les deux valeurs, \u00ab\u202f12,10 puis 13,50\u202f\u00bb, au lieu d\u2019un seul chiffre que personne n\u2019a jamais sign\u00e9." },
    { emoji: 'cadenas', titre: "Un champ de saisie ne peut plus effacer un historique",
      desc: "Vider le champ du taux ne supprime plus rien. Pour retirer une valeur, on retire sa ligne dans la liste \u2014 elle est visible, donc v\u00e9rifiable. Ces montants restent lisibles des <b>seuls administrateurs</b>, comme avant." },
  ] },
  { v:'6.05', items:[
    { emoji: 'equipe', titre: "L\u2019ordre de passage comptait UNE personne pour un chantier \u00e0 quarante",
      desc: "Simuler lisait l\u2019effectif <b>d\u2019aujourd\u2019hui</b>. Un contrat de groupe qui d\u00e9marre dans quinze jours n\u2019existait donc pas, et un cong\u00e9 du jour retirait quelqu\u2019un d\u2019un chantier qui commence en septembre. La tourn\u00e9e envoy\u00e9e aux ouvriers \u00e9tait d\u00e9coup\u00e9e pour une personne. L\u2019effectif se lit maintenant sur la <b>fen\u00eatre du travail</b>\u202f: le jour de la vendange, personne n\u2019est en cong\u00e9 et tous les contrats courent. L\u2019\u00e9cran affiche sur quelles dates il a compt\u00e9, et l\u2019\u00e9cart avec la pr\u00e9sence du jour." },
    { emoji: 'calendrier', titre: "Les dates du Pilotage \u00e9taient d\u00e9cal\u00e9es d\u2019un jour",
      desc: "Une campagne du 1\u1d49\u02b3 avril au 31 juillet s\u2019affichait \u00ab\u202fdu 31 mars au 30 juillet\u202f\u00bb, le pic tombait \u00ab\u202fsemaine du 31 mars\u202f\u00bb pour la semaine du 1\u1d49\u02b3 avril, et les fen\u00eatres de travaux reculaient pareil. Les calculs \u00e9taient bons\u202f: <b>toutes les dates \u00e9crites</b> \u00e9taient fausses. Corrig\u00e9 partout, en une seule fois." },
    { emoji: 'balance', titre: "Un pic \u00e0 46 personnes sur un domaine qui en emploie deux",
      desc: "Quand une fen\u00eatre de travail enregistr\u00e9e ne tombait pas dans la p\u00e9riode consult\u00e9e, <b>toutes ses heures s\u2019\u00e9crasaient sur un seul jour</b> \u2014 d\u2019o\u00f9 un pic \u00e9norme, port\u00e9 par une barre large d\u2019un pixel, qui \u00e9crasait l\u2019\u00e9chelle des 52 semaines. La fen\u00eatre par d\u00e9faut s\u2019applique d\u00e9sormais \u00e0 la place, et le tableau des fen\u00eatres (Outils \u203a Param\u00e9trage) marque la ligne <b>\u26a0 hors p\u00e9riode</b> au lieu de se taire." },
    { emoji: 'balance', titre: "\u00ab\u202fIl manque 44 ETP\u202f\u00bb\u202f: deux chiffres qui n\u2019allaient pas ensemble",
      desc: "Le besoin de la semaine la plus charg\u00e9e \u00e9tait compar\u00e9 \u00e0 la <b>pr\u00e9sence d\u2019aujourd\u2019hui</b>. Deux dates, deux fa\u00e7ons de compter. Le manque se lit maintenant sur la semaine du pic, contre ce qui est pr\u00e9vu au planning <b>cette semaine-l\u00e0</b>\u202f; la pr\u00e9sence du jour est affich\u00e9e \u00e0 part, sous son propre nom." },
    { emoji: 'graphique', titre: "Le graphe du renfort plafonnait le manque \u00e0 quatre",
      desc: "Une semaine \u00e0 qui il manquait quarante personnes se dessinait comme une semaine \u00e0 qui il en manquait quatre \u2014 d\u2019o\u00f9 ces plateaux parfaitement plats qui n\u2019existaient pas dans les donn\u00e9es. Le plafond est retir\u00e9, l\u2019axe monte avec le manque. Et les propositions qui co\u00fbtent plus cher que de tenir toute la campagne ne vous sont plus pr\u00e9sent\u00e9es." },
    { emoji: 'calendrier', titre: "\u00ab\u202fFin le 25 avril\u202f\u00bb s\u2019arr\u00eatait le 24",
      desc: "La derni\u00e8re journ\u00e9e de chaque fen\u00eatre de travail ne recevait aucune heure, y compris le dernier jour de la p\u00e9riode elle-m\u00eame. Elle travaille maintenant\u202f: les dates affich\u00e9es n\u2019ont pas boug\u00e9, c\u2019est le calcul qui a gagn\u00e9 le jour. Au passage, les heures se r\u00e9partissent d\u00e9sormais partout au prorata des jours <b>travaillables</b>\u202f: une semaine de ponts en re\u00e7oit moins, les semaines pleines r\u00e9cup\u00e8rent le reste." },
    { emoji: 'alerte', titre: "Deux p\u00e9riodes qui se recouvrent, deux barres au m\u00eame endroit",
      desc: "Rien n\u2019est compt\u00e9 deux fois \u2014 les heures suivent les t\u00e2ches, et une t\u00e2che n\u2019appartient qu\u2019\u00e0 une seule p\u00e9riode. Mais sur les jours partag\u00e9s, la frise dessinait deux barres l\u2019une sur l\u2019autre sans le dire. Ces jours sont maintenant <b>hachur\u00e9s en violet</b>, avec une trame diff\u00e9rente de celle des trous de calendrier." },
  ] },
  { v:'6.04', items:[
    { emoji: 'chrono', titre: "\u00ab\u202fO\u00f9 va le temps de l\u2019\u00e9quipe\u202f\u00bb est pass\u00e9 dans \u00ab\u202fLa campagne\u202f\u00bb",
      desc: "La r\u00e9partition du temps, la frise pr\u00e9vu/r\u00e9el, la courbe par semaine et l\u2019\u00e9cart parlent tous d\u2019<b>une campagne</b>. Ils \u00e9taient rang\u00e9s dans \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb, sous un bandeau qui expliquait qu\u2019ils d\u00e9taillaient en fait une campagne. Un bandeau qui explique pourquoi un bloc est au mauvais endroit ne le d\u00e9place pas\u202f: ils sont maintenant dans \u00ab\u202fLa campagne\u202f\u00bb, et le bandeau a disparu avec eux. \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb garde ce qui la regarde\u202f: les 52 semaines de l\u2019exercice et le pic." },
    { emoji: 'equipe', titre: "Le simulateur de renfort voit enfin vos embauches d\u00e9j\u00e0 sign\u00e9es",
      desc: "Il ne comptait que les <b>permanents</b>\u202f: 34 vendangeurs d\u00e9j\u00e0 sous contrat du 17 ao\u00fbt au 3 septembre n\u2019existaient pas pour lui, et il vous r\u00e9clamait \u00ab\u202f34 personnes de renfort \u00e0 poser\u202f\u00bb pour une \u00e9quipe d\u00e9j\u00e0 recrut\u00e9e \u2014 pendant que la frise de l\u2019ann\u00e9e, elle, montrait la vendange couverte. Le m\u00eame module disait deux choses. Il part maintenant de l\u2019effectif <b>d\u00e9j\u00e0 sous contrat</b>, et le renfort que vous posez s\u2019<b>ajoute</b> \u00e0 cette ligne. Le s\u00e9lecteur \u00ab\u202fOn part de\u202f\u00bb permet de revenir aux permanents seuls\u202f: c\u2019est l\u2019autre question, celle qui sert \u00e0 pr\u00e9parer la campagne suivante." },
    { emoji: 'balance', titre: "Deux p\u00e9riodes qui se chevauchent ne sont plus une alerte",
      desc: "L\u2019\u00e9cran annon\u00e7ait en orange que les jours communs \u00e0 deux p\u00e9riodes \u00e9taient \u00ab\u202fcompt\u00e9s deux fois\u202f\u00bb et que vos heures \u00e9taient gonfl\u00e9es d\u2019autant. C\u2019\u00e9tait <b>faux</b>\u202f: les heures suivent les <b>t\u00e2ches</b>, et chaque t\u00e2che n\u2019appartient qu\u2019\u00e0 une seule p\u00e9riode. Sur les jours communs, ce sont les bandes du calendrier qui se superposent, jamais la charge. Le fait reste \u00e9crit, en gris, sous la frise \u2014 et il n\u2019y a rien \u00e0 corriger." },
    { emoji: 'balance', titre: "\u00ab\u202fT\u00e2che sans bar\u00e8me h/ha\u202f\u00bb ne se d\u00e9clenche plus \u00e0 tort",
      desc: "Le contr\u00f4le cherchait les heures par hectare dans un champ qui n\u2019existe sur aucune t\u00e2che. Il ne trouvait donc jamais rien, et signalait <b>toutes</b> les t\u00e2ches de la p\u00e9riode consult\u00e9e comme d\u00e9pourvues de bar\u00e8me \u2014 y compris celles que vous aviez remplies. Sur une p\u00e9riode \u00e0 une seule t\u00e2che, \u00e7a donnait \u00ab\u202f1 t\u00e2che sans bar\u00e8me\u202f\u00bb\u202f: plausible, et faux. Il lit maintenant le bon champ, et comprend aussi les t\u00e2ches \u00e0 niveaux, \u00e0 passages, et celles pilot\u00e9es \u00e0 la tari\u00e8re, qui n\u2019ont pas d\u2019heures par hectare \u00e0 avoir." },
    { emoji: 'graphique', titre: "Le simulateur ne dessine plus deux fois le m\u00eame graphique",
      desc: "\u00ab\u202fCe qu\u2019il reste \u00e0 faire\u202f\u00bb et \u00ab\u202fle plan de d\u00e9part\u202f\u00bb apparaissaient tous les deux d\u00e8s que la campagne avait commenc\u00e9 \u2014 m\u00eames colonnes, m\u00eame ligne d\u2019effectif, seule la l\u00e9gende changeait. Deux images identiques sous deux titres diff\u00e9rents ne se comparent pas. L\u2019\u00e9cran v\u00e9rifie maintenant qu\u2019elles racontent vraiment deux choses\u202f; sinon il n\u2019en montre qu\u2019une, et dit pourquoi." }
  ]},
  { v:'6.03', items:[
    { emoji: 'loupe', titre: "Cliquer une campagne recadre enfin TOUT l\u2019\u00e9cran",
      desc: "Choisir une campagne dans la frise bougeait la frise, les quatre chiffres du haut\u2026 et laissait trois blocs sur une autre p\u00e9riode\u202f: le chiffre <b>Effectif</b> d\u2019Aujourd\u2019hui, la tuile <b>Charge & ETP</b> et <b>Capacit\u00e9 vs charge</b>. Ils lisaient la p\u00e9riode que vous consultez, pas celle que vous regardez. Sur l\u2019ann\u00e9e enti\u00e8re, la photo r\u00e9pondait donc pour l\u2019ann\u00e9e et la tuile juste en dessous pour une seule campagne\u202f: deux nombres, un seul mot, \u00e0 quinze centim\u00e8tres l\u2019un de l\u2019autre. Tout suit maintenant la m\u00eame barre du haut \u2014 la r\u00e9partition du temps, la frise pr\u00e9vu/r\u00e9el, la courbe par semaine et l\u2019\u00e9cart compris." },
    { emoji: 'etiquette', titre: "Chaque chiffre dit d\u00e9sormais sur quoi il porte",
      desc: "\u00ab\u202f36,6 au pic\u202f\u00bb ne veut rien dire sans savoir si c\u2019est le pic de l\u2019ann\u00e9e ou celui d\u2019une campagne. Le cadre est maintenant \u00e9crit sous le chiffre, partout\u202f: \u00ab\u202fsur l\u2019exercice\u202f\u00bb, \u00ab\u202fsur Vendanges\u202f\u00bb, avec la semaine du pic. Un pic sans cadre n\u2019est pas une mesure, c\u2019est une opinion." },
    { emoji: 'balance', titre: "Les blocs qui ne peuvent pas suivre le zoom le disent",
      desc: "Une frise de t\u00e2ches, une courbe par semaine ou un \u00e9cart pr\u00e9vu/r\u00e9el n\u2019existent qu\u2019\u00e0 la maille d\u2019une campagne\u202f: sur l\u2019ann\u00e9e enti\u00e8re, ils ne peuvent montrer qu\u2019une campagne. Ils l\u2019\u00e9crivent maintenant en clair au lieu de laisser croire qu\u2019ils r\u00e9pondent pour l\u2019ann\u00e9e. Et le <b>Param\u00e9trage</b>, qui \u00e9crit dans vos donn\u00e9es, pr\u00e9vient si vous regardez une campagne alors qu\u2019il porte sur une autre \u2014 une \u00e9criture au mauvais endroit ne se voit qu\u2019\u00e0 la campagne suivante." },
    { emoji: 'valide', titre: "Une t\u00e2che n\u2019est plus d\u00e9clar\u00e9e termin\u00e9e d\u2019apr\u00e8s une autre campagne",
      desc: "La frise pr\u00e9vu/r\u00e9el jugeait \u00ab\u202ftermin\u00e9\u202f\u00bb ou \u00ab\u202fen cours\u202f\u00bb avec l\u2019avancement de la p\u00e9riode consult\u00e9e, quelle que soit la campagne affich\u00e9e. En zoomant sur une campagne pass\u00e9e, vous pouviez voir \u00ab\u202fen cours\u202f\u00bb sur des travaux finis depuis des mois. Elle s\u2019appuie maintenant sur ce que le journal sait vraiment." }
  ]},
  { v:'6.02', items:[
    { emoji: 'doigt', titre: "\u00ab\u202fvoir le d\u00e9tail\u202f\u00bb et \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb r\u00e9pondent enfin",
      desc: "Les quatre chiffres en haut du Pilotage, le bouton \u00ab\u202fN choses \u00e0 compl\u00e9ter\u202f\u00bb et la croix qui revient \u00e0 l\u2019ann\u00e9e enti\u00e8re ne r\u00e9agissaient pas au clic. Pas d\u2019erreur, pas de message\u202f: rien. Ces boutons avaient \u00e9t\u00e9 sortis de la zone qui \u00e9coute les clics lors de la refonte pr\u00e9c\u00e9dente, et personne ne le voyait tant qu\u2019on ne cliquait pas. C\u2019est r\u00e9par\u00e9\u202f: chaque chiffre ouvre l\u2019\u00e9cran qui le d\u00e9taille, chaque pastille rouge ou orange ouvre la liste de ce qui le fausse." },
    { emoji: 'balance', titre: "Vos heures de bar\u00e8me ne s\u2019affichent plus \u00e0 z\u00e9ro",
      desc: "La photo \u00ab\u202fTravaux\u202f\u00bb annon\u00e7ait \u00ab\u202f0 h, aucune t\u00e2che dat\u00e9e\u202f\u00bb et le tableau \u00ab\u202fDeux fa\u00e7ons de compter votre ann\u00e9e\u202f\u00bb sortait toutes ses campagnes \u00e0 0 h \u2014 sur des domaines qui affichaient des milliers d\u2019heures restantes deux centim\u00e8tres plus haut. L\u2019application cherchait le total au mauvais endroit et trouvait \u00ab\u202frien\u202f\u00bb, ce qu\u2019elle affichait comme un z\u00e9ro. Les heures sont l\u00e0. Et le pourcentage \u00ab\u202f% fait\u202f\u00bb ne s\u2019affiche plus que sur la p\u00e9riode que vous consultez, la seule o\u00f9 il a un sens." },
    { emoji: 'euro', titre: "Un exercice comptable qui affiche vraiment l\u2019exercice",
      desc: "La case \u00ab\u202fExercice comptable\u202f\u00bb affichait le co\u00fbt de la <b>campagne en cours</b> sous les dates de l\u2019ann\u00e9e enti\u00e8re\u202f: 45\u202fk\u20ac pour douze mois, alors que c\u2019\u00e9tait le co\u00fbt de dix jours de vendange. Le chiffre \u00e9tait juste, son \u00e9tiquette \u00e9tait fausse \u2014 et c\u2019est pire, parce qu\u2019on ne v\u00e9rifie pas une \u00e9tiquette. La case lit maintenant le m\u00eame moteur que \u00c9conomie \u203a Exercice\u202f: salaires charg\u00e9s, carburant GNR et achats d\u2019intrants, entre vos deux bilans." },
    { emoji: 'equipe', titre: "L\u2019effectif au pic ne va plus chercher hors de votre exercice",
      desc: "Le chiffre \u00ab\u202fEffectif\u202f\u00bb annon\u00e7ait un pic de 60,8 personnes \u00ab\u202fsur l\u2019exercice\u202f\u00bb pendant que l\u2019\u00e9cran Charge & ETP, juste en dessous, en affichait 36,6. Les deux \u00e9taient justes\u202f: le premier allait chercher son pic dans une campagne que l\u2019application affiche elle-m\u00eame comme \u00ab\u202fhors exercice\u202f\u00bb. Deux r\u00e9ponses \u00e0 la m\u00eame question sur le m\u00eame \u00e9cran, et aucune ne disait sur quoi elle portait. Le pic reste d\u00e9sormais dans le cadre annonc\u00e9." },
    { emoji: 'calendrier', titre: "La date de fin compte enfin vos saisonniers",
      desc: "\u00ab\u202f85\u202fj de retard, fin le 27\u202fjanvier\u202f\u00bb sur une vendange de dix jours\u202f: la projection divisait le travail restant par la cadence des <b>quatre derni\u00e8res semaines</b>, mesur\u00e9e en ao\u00fbt avec une personne, et l\u2019appliquait telle quelle jusqu\u2019en janvier. Les trente-six vendangeurs d\u00e9j\u00e0 sous contrat n\u2019entraient nulle part. Elle consomme maintenant la charge sur l\u2019\u00e9quipe <b>r\u00e9ellement planifi\u00e9e</b>, semaine par semaine, dates de d\u00e9but de contrat comprises \u2014 et quand cette \u00e9quipe ne suffit pas, elle vous dit combien d\u2019heures manquent au lieu d\u2019inventer une date. La phrase sous le chiffre dit toujours sur quoi la date est b\u00e2tie." },
    { emoji: 'graphique', titre: "La frise de l\u2019ann\u00e9e prend toute la largeur, et son axe redevient lisible",
      desc: "La frise des douze mois s\u2019arr\u00eatait \u00e0 760\u202fpixels quelle que soit la taille de votre \u00e9cran\u202f: sur un ordinateur, cinquante-deux semaines \u00e9cras\u00e9es dans 60\u202f% de la page. Elle occupe maintenant toute la carte, et grandit en hauteur avec elle. Et la courbe \u00ab\u202fpersonnes n\u00e9cessaires par semaine\u202f\u00bb tra\u00e7ait une graduation par personne\u202f: sur une vendange \u00e0 37\u202fpersonnes, trente-huit \u00e9tiquettes empil\u00e9es sur 24\u202fcentim\u00e8tres carr\u00e9s, soit un p\u00e2t\u00e9 noir \u00e0 la place de l\u2019axe. Elle gradue d\u00e9sormais de 5 en 5 ou de 10 en 10, comme la frise." }
  ]},
  { v:'6.01', items:[
    { emoji: 'livre', titre: "Votre exercice comptable et votre ann\u00e9e vigne, c\u00f4te \u00e0 c\u00f4te",
      desc: "L\u2019\u00e9cran vous disait que votre exercice \u00e9tait \u00ab\u202fmal align\u00e9\u202f\u00bb et vous proposait de le d\u00e9placer. C\u2019\u00e9tait un mauvais conseil\u202f: un exercice comptable est fix\u00e9 par votre comptable, parfois par votre statut, et on ne le d\u00e9cale pas pour qu\u2019un graphique tombe mieux. Le vrai manque \u00e9tait ailleurs\u202f: l\u2019application n\u2019avait <b>qu\u2019un seul cadre</b> pour deux questions diff\u00e9rentes. Le niveau \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb s\u2019ouvre maintenant sur les deux, nomm\u00e9s\u202f: l\u2019<b>exercice comptable</b>, d\u2019un bilan \u00e0 l\u2019autre, qui r\u00e9pond \u00e0 \u00ab\u202fce que m\u2019a co\u00fbt\u00e9 l\u2019ann\u00e9e fiscale\u202f\u00bb\u202f; et l\u2019<b>ann\u00e9e vigne</b>, d\u2019apr\u00e8s une vendange jusqu\u2019\u00e0 la fin de la suivante, qui r\u00e9pond \u00e0 \u00ab\u202fce que m\u2019a co\u00fbt\u00e9 un cycle\u202f\u00bb. Les deux totaux ne sont pas les m\u00eames, et l\u2019\u00e9cran explique enfin pourquoi\u202f: une campagne \u00e0 cheval sur la cl\u00f4ture est partag\u00e9e entre deux bilans, une campagne enti\u00e8rement hors de l\u2019exercice n\u2019y appara\u00eet pas du tout." },
    { emoji: 'calendrier', titre: "Une vendange \u00e0 cheval sur deux bilans, dite en jours",
      desc: "Quand la cl\u00f4ture de votre exercice traverse la vendange, la r\u00e9colte se lit sur deux bilans. L\u2019application vous dit d\u00e9sormais combien de jours tombent de chaque c\u00f4t\u00e9 \u2014 en jours, compt\u00e9s exactement, plut\u00f4t qu\u2019en euros approxim\u00e9s. Et elle ne pr\u00e9sente plus \u00e7a comme une erreur \u00e0 corriger\u202f: c\u2019est votre calendrier comptable, il n\u2019y a rien \u00e0 changer, il faut seulement le savoir en lisant le bilan. Si votre comptable accepte de d\u00e9placer la cl\u00f4ture, le bouton reste l\u00e0 \u2014 mais c\u2019est propos\u00e9, plus prescrit. Au passage, l\u2019alerte orange qui s\u2019affichait quand la vendange \u00ab\u202fouvrait\u202f\u00bb l\u2019ann\u00e9e a disparu\u202f: il n\u2019y avait rien \u00e0 corriger." }
  ]},
  { v:'6.00', items:[
    { emoji: 'boussole', titre: "Le Pilotage s\u2019ouvre sur l\u2019ann\u00e9e, puis vous zoomez",
      desc: "Les onglets \u00e9taient sept sujets pos\u00e9s c\u00f4te \u00e0 c\u00f4te\u202f: on ne voyait jamais son ann\u00e9e, on tombait dans un sujet. Ils vont maintenant du large au fin \u2014 <b>l\u2019ann\u00e9e</b>, puis <b>la campagne</b>, puis <b>l\u2019\u00e9quipe et les t\u00e2ches</b>, puis <b>la simulation</b> \u2014 avec leur num\u00e9ro devant. Un trait marque o\u00f9 le zoom s\u2019arr\u00eate\u202f: apr\u00e8s lui, la Cave, l\u2019\u00c9conomie et la Conformit\u00e9 sont des \u00e9crans de d\u00e9tail. La frise des douze mois, qui \u00e9tait rang\u00e9e dans une tuile pliable au milieu d\u2019un \u00e9cran parlant d\u2019une campagne, ouvre d\u00e9sormais le niveau \u00ab\u202fL\u2019ann\u00e9e\u202f\u00bb. Si vous aviez d\u00e9coch\u00e9 \u00ab\u202fCharge &amp; ETP\u202f\u00bb, votre choix vous suit\u202f: rien \u00e0 recocher." },
    { emoji: 'lien', titre: "Cliquer une campagne fait bouger tout l\u2019\u00e9cran",
      desc: "Avant, choisir une campagne dans la frise ne changeait <b>qu\u2019un seul panneau</b>. Les chiffres au-dessus restaient sur une autre fen\u00eatre sans le dire, et le m\u00eame \u00e9cran pouvait donner deux r\u00e9ponses justes \u00e0 la m\u00eame question. Une barre en haut affiche maintenant o\u00f9 vous regardez \u2014 l\u2019exercice entier, ou telle campagne \u2014 et tout ce qui est affich\u00e9 s\u2019y cale. La croix revient \u00e0 l\u2019ann\u00e9e. Si vous supprimez une p\u00e9riode, l\u2019\u00e9cran ne reste pas bloqu\u00e9 dessus." },
    { emoji: 'graphique', titre: "Quatre chiffres en t\u00eate, quelle que soit la page",
      desc: "Les travaux, l\u2019effectif, le budget et la conformit\u00e9 sont d\u00e9sormais visibles en haut de tous les \u00e9crans du Pilotage, \u00e0 la maille de ce que vous regardez. Toucher l\u2019un d\u2019eux ouvre l\u2019\u00e9cran qui le d\u00e9taille. L\u2019effectif affiche le <b>pic</b>, pas la moyenne\u202f: une moyenne annuelle n\u2019existe aucun jour de l\u2019ann\u00e9e, et c\u2019est le pic qui d\u00e9cide d\u2019un recrutement. Quand un calcul n\u2019aboutit pas, le chiffre affiche un tiret au lieu d\u2019un z\u00e9ro." },
    { emoji: 'loupe', titre: "L\u2019application dit ce qui manque, et vous y emm\u00e8ne",
      desc: "Un bouton \u00ab\u202f\u00e0 compl\u00e9ter\u202f\u00bb en haut de l\u2019\u00e9cran liste ce qui emp\u00eache vos chiffres d\u2019\u00eatre justes\u202f: p\u00e9riodes sans dates, trous dans le calendrier, p\u00e9riodes qui se chevauchent, salari\u00e9s sans taux horaire, t\u00e2ches sans heures par hectare, parcelles sans surface, cuivre proche du plafond. Chaque ligne dit <b>ce que \u00e7a fausse</b>, pas seulement ce qui manque \u2014 et le bouton ouvre la bonne page, sur le bon onglet, au bon endroit, qui clignote une seconde. Un rond rouge sur un chiffre veut dire qu\u2019il ne se calcule pas\u202f; un rond orange, qu\u2019il sort mais faux." },
    { emoji: 'graphique', titre: "Un trou dans le calendrier ne se dessine plus \u00e0 z\u00e9ro",
      desc: "Quand deux p\u00e9riodes \u00e9taient s\u00e9par\u00e9es de quelques semaines, la courbe d\u2019effectif tra\u00e7ait un trait droit au travers \u2014 elle affirmait un effectif sur une fen\u00eatre o\u00f9 personne n\u2019avait rien compt\u00e9. Elle s\u2019interrompt maintenant, et reprend apr\u00e8s. Un trou n\u2019est pas un z\u00e9ro\u202f: un z\u00e9ro est une mesure. Le trait du jour a aussi chang\u00e9 de couleur, il partageait le rouge des barres de renfort alors qu\u2019il ne signale rien d\u2019inqui\u00e9tant." }
  ]},
  { v:'5.99', items:[
    { emoji: 'dossier', titre: "Un salari\u00e9 r\u00e9embauch\u00e9 ne perd plus son pass\u00e9", desc: "Quand quelqu\u2019un finit un contrat puis en resigne un autre plus tard, il fallait \u00e9craser ses dates par les nouvelles \u2014 et l\u2019application oubliait alors compl\u00e8tement qu\u2019il avait travaill\u00e9 avant. Il dispara\u00eessait des campagnes pass\u00e9es\u202f: plus dans l\u2019effectif, plus dans les heures, plus dans le co\u00fbt. Un domaine a vu dix personnes au pic s\u2019afficher comme quatre. D\u00e9sormais l\u2019ancien contrat est archiv\u00e9 tout seul d\u00e8s que vous saisissez une date de d\u00e9but post\u00e9rieure \u00e0 la fin du pr\u00e9c\u00e9dent, et la fiche affiche la liste des contrats pr\u00e9c\u00e9dents, que vous pouvez corriger ou supprimer. Deux contrats qui se suivent sans un jour de coupure sont trait\u00e9s comme un seul\u202f; d\u00e8s qu\u2019il y a une coupure, ce sont deux contrats, chacun avec son propre compteur d\u2019heures annuelles. Rien ne change pour la paie ni pour les cong\u00e9s, qui continuent de porter sur le contrat en cours." },
    { emoji: 'calendrier', titre: "Le Pilotage compte les personnes \u00e0 la semaine", desc: "L\u2019\u00e9cran Charge & ETP raisonnait au mois. Une vendange de quatre jours en septembre \u00e9tait divis\u00e9e par un mois entier de travail et ressortait \u00e0 six personnes, quand la m\u00eame vendange \u00e0 cheval sur la fin ao\u00fbt en affichait vingt-sept. Et l\u2019effectif en face \u00e9tait une moyenne du mois\u202f: une semaine \u00e0 quarante personnes noy\u00e9e dans trois semaines \u00e0 deux donnait douze, un chiffre qui n\u2019existait aucun jour de l\u2019ann\u00e9e. L\u2019\u00e9cran annon\u00e7ait donc un manque de seize personnes pendant que la courbe, juste, montrait la vendange couverte. Tout se lit maintenant \u00e0 la semaine, la seule maille o\u00f9 le rapport a un sens." },
    { emoji: 'calendrier', titre: "Une frise de toute l\u2019ann\u00e9e, et le clic qui zoome", desc: "Le Pilotage s\u2019ouvre d\u00e9sormais sur une frise de la campagne enti\u00e8re\u202f: vos p\u00e9riodes en couleur, et sous chacune le nombre de personnes n\u00e9cessaires semaine par semaine. Le vert est ce que votre \u00e9quipe absorbe, le rouge ce qu\u2019il reste \u00e0 recruter \u2014 vous lisez le renfort en hauteur de rouge, sans calcul. Cliquez une p\u00e9riode\u202f: l\u2019axe se recale dessus, l\u2019\u00e9chelle verticale suit, et les t\u00e2ches qui la composent apparaissent en bandes. C\u2019est ce qui permet de voir la taille alors que la vendange \u00e9crase tout. Les zones hachur\u00e9es ne sont couvertes par aucune p\u00e9riode." },
    { emoji: 'equipe', titre: "Une \u00e9quipe de vendangeurs compte pour son effectif", desc: "Une fiche d\u2019\u00e9quipe collective r\u00e9gl\u00e9e \u00e0 quarante personnes ne comptait que pour une seule dans le calcul de la pr\u00e9sence de l\u2019\u00e9quipe. Le bandeau \u00ab\u202fO\u00f9 va le temps\u202f\u00bb affichait alors une part de 392\u202f%\u202f\u2014 une r\u00e9partition qui d\u00e9passe cent \u2014 et annon\u00e7ait z\u00e9ro heure de cave et de trajets, ce qui \u00e9tait faux. C\u2019est corrig\u00e9\u202f; et si votre charge d\u00e9passe vraiment votre pr\u00e9sence, la surcharge est d\u00e9sormais \u00e9crite en clair au lieu d\u2019\u00eatre absorb\u00e9e." }
  ]},
  { v:'5.98', items:[
    { emoji: 'cible', titre: "Chaque personne voit les modules de son m\u00e9tier", desc: "Quand on cr\u00e9e plusieurs comptes d\u2019un coup, chacun arrivait avec les sept modules dans sa barre du bas \u2014 y compris la Cave et la R\u00e9serve pour quelqu\u2019un qui ne quitte pas les vignes. Il fallait rouvrir chaque fiche pour d\u00e9cocher. Maintenant le r\u00f4le suffit\u202f: un ouvrier arrive avec la Vigne et le Planning, un tractoriste garde en plus le Tracteur et le Phyto. Le Planning reste visible pour tout le monde, c\u2019est l\u00e0 que chacun lit ses heures et ses cong\u00e9s. Rien n\u2019est fig\u00e9\u202f: la fiche de chaque personne, dans R\u00e9glages, permet de recocher ce qu\u2019on veut, et un nouveau bouton \u00ab Selon le r\u00f4le \u00bb repose la combinaison standard d\u2019un geste. Les personnes d\u00e9j\u00e0 en place ne changent pas." }
  ]},
  { v:'5.97', items:[
    { emoji: 'nuage', titre: "La m\u00e9t\u00e9o enregistr\u00e9e \u00e0 la validation d\u2019une t\u00e2che", desc: "Quand vous validez une t\u00e2che sur une parcelle, l\u2019application enregistre au journal la m\u00e9t\u00e9o moyenne du chantier. Elle la calculait depuis la toute premi\u00e8re fois o\u00f9 cette t\u00e2che avait \u00e9t\u00e9 mise « en cours » sur cette parcelle \u2014 m\u00eame si c\u2019\u00e9tait la campagne d\u2019avant, sur une ligne rest\u00e9e ouverte par oubli. Une taille valid\u00e9e en mars pouvait ainsi porter la moyenne de quatorze mois. Le calcul s\u2019arr\u00eate maintenant au d\u00e9but de la p\u00e9riode en cours. Les m\u00e9t\u00e9os d\u00e9j\u00e0 enregistr\u00e9es ne changent pas." },
    { emoji: 'doigt', titre: "L\u2019accueil du Pilotage sur \u00e9cran \u00e9troit", desc: "Sur les \u00e9crans d\u2019une largeur tr\u00e8s pr\u00e9cise \u2014 certaines tablettes en portrait, une fen\u00eatre de navigateur r\u00e9duite \u00e0 la main \u2014 le bandeau du haut du Pilotage gardait deux colonnes dans un espace pr\u00e9vu pour une seule. Le texte se tassait. C\u2019est corrig\u00e9." }
  ]},
  { v:'5.96', items:[
    { emoji: 'dossier', titre:'Le planning en trois onglets',
      desc:"Le module m\u00e9langeait trois choses qui ne se font ni au m\u00eame rythme ni par la m\u00eame personne. Elles ont chacune leur onglet\u00a0: <b>Le mois</b>, la grille de l\u2019\u00e9quipe\u00a0; <b>Les gens</b>, une ligne par salari\u00e9 avec sa fiche, le r\u00e9cap annuel et les anciens salari\u00e9s\u00a0; <b>Le cadre</b>, les mod\u00e8les de semaine, la coupure, la convention, les cong\u00e9s et les heures sup. Si vous n\u2019\u00eates pas administrateur, vous n\u2019avez plus d\u2019onglets du tout\u00a0: vous arrivez directement sur votre mois." },
    { emoji: 'loupe', titre:'Les salari\u00e9s n\u2019apparaissent plus deux fois',
      desc:"Sous la grille, une deuxi\u00e8me liste r\u00e9p\u00e9tait les m\u00eames noms et les m\u00eames heures, et les deux ouvraient la m\u00eame fiche. Il n\u2019en reste qu\u2019une, dans \u00ab\u00a0Les gens\u00a0\u00bb." },
    { emoji: 'engrenage', titre:'Le menu \u00ab\u00a0Outils\u00a0\u00bb a disparu',
      desc:"Ses quatre entr\u00e9es sont sorties de leur tiroir\u00a0: poser des cong\u00e9s et des horaires chaleur sur une p\u00e9riode sont deux boutons visibles au-dessus de la grille, les mod\u00e8les et le cadre l\u00e9gal ont leur onglet, les anciens salari\u00e9s sont avec les gens." },
    { emoji: 'alerte', titre:'Un r\u00e9glage du domaine \u00e9tait cach\u00e9 dans la fiche d\u2019une personne',
      desc:"La r\u00e8gle de d\u00e9compte des cong\u00e9s (6\u00a0jours ouvrables ou 5\u00a0jours ouvr\u00e9s) et la p\u00e9riode de r\u00e9f\u00e9rence se r\u00e9glaient depuis l\u2019onglet Cong\u00e9s de n\u2019importe quel salari\u00e9 \u2014 alors qu\u2019elles s\u2019appliquent \u00e0 toute l\u2019\u00e9quipe. Elles sont maintenant dans \u00ab\u00a0Le cadre\u00a0\u00bb, avec les autres r\u00e9glages du domaine. Rien ne change dans vos soldes." }
  ]},
  { v:'5.95', items:[
    { emoji: 'chevron', titre:'Le planning : plus de \u00ab\u00a0mode\u00a0\u00bb \u00e0 activer',
      desc:"Avant, toucher une case ouvrait la fiche du jour \u2014 sauf si le bouton \u00ab\u00a0S\u00e9lection multiple\u00a0\u00bb \u00e9tait allum\u00e9, auquel cas la m\u00eame case se cochait. Le bouton a disparu\u00a0: toucher une case la coche, toujours. La barre du bas dit qui est coch\u00e9 et \u00e0 quelles dates, puis propose ce qu\u2019on peut en faire." },
    { emoji: 'calendrier', titre:'Toute une journ\u00e9e, toute une personne, en une touche',
      desc:"Toucher le num\u00e9ro du jour, en haut de la grille, coche toute l\u2019\u00e9quipe ce jour-l\u00e0. Toucher un nom coche sa semaine enti\u00e8re. Toucher \u00ab\u00a0Salari\u00e9\u00a0\u00bb, dans le coin, coche tout ce qui est affich\u00e9. Un deuxi\u00e8me appui d\u00e9coche." },
    { emoji: 'document', titre:'Une seule fiche pour un jour comme pour trente',
      desc:"Les horaires et les absences avaient chacun leur \u00e9cran selon qu\u2019on modifiait un jour ou plusieurs. C\u2019est la m\u00eame fiche d\u00e9sormais\u00a0: elle s\u2019adapte au nombre de cases coch\u00e9es." },
    { emoji: 'bouclier', titre:'Un cong\u00e9 ne s\u2019efface plus en silence',
      desc:"Poser \u00ab\u00a0R\u00e9cup\u00a0\u00bb ou \u00ab\u00a0Chaleur\u00a0\u00bb sur une semaine \u00e9crasait sans le dire les cong\u00e9s d\u00e9j\u00e0 pos\u00e9s dessus. Ils sont maintenant conserv\u00e9s, et le message de confirmation indique combien ont \u00e9t\u00e9 pr\u00e9serv\u00e9s. Sur une seule case, choisie \u00e0 la main, le remplacement reste possible." }
  ]},
  { v:'5.94', items:[
    { emoji: 'info', titre:'L\u2019aide du Tracteur ne parlait ni du chrono ni du mode du jour',
      desc:"Deux changements r\u00e9cents \u2014 la coche qui lance la mesure, et la question \u00ab Tu prends le tracteur aujourd\u2019hui ? \u00bb \u2014 n\u2019\u00e9taient expliqu\u00e9s nulle part. La pastille \u00ab ? Aide \u00bb du Tracteur les d\u00e9crit maintenant : les trois compteurs, ce que le chrono mesure et ce qu\u2019il ne mesure pas, la mesure \u00e9cart\u00e9e, et o\u00f9 le domaine active le chrono. Celle de l\u2019Accueil dit \u00e0 quoi sert la question du matin, et rappelle qu\u2019elle ne change aucun droit." },
    { emoji: 'liste', titre:'Trois r\u00e9glages dont l\u2019aide ne disait pas o\u00f9 ils se trouvaient',
      desc:"L\u2019heure de la coupure d\u00e9jeuner (Planning, Outils), le bar\u00e8me de r\u00e9f\u00e9rence de votre r\u00e9gion et votre rendement au pressoir en kilos par hectolitre (Cave, Le Cuvier, R\u00e9glages) existaient tous les trois, mais rien ne menait \u00e0 eux. Les fiches d\u2019aide du Planning, des R\u00e9glages et de la Cave indiquent d\u00e9sormais le chemin." }
  ]},
  { v:'5.93', items:[
    { emoji: 'tracteur', titre:'\u00ab\u00a0Tu prends le tracteur aujourd\'hui\u00a0?\u00a0\u00bb',
      desc:"Si tu es \u00e0 la fois ouvrier et tractoriste et qu'une session tracteur est ouverte, l'app pose la question \u00e0 la premi\u00e8re ouverture du jour. Ta r\u00e9ponse tient la journ\u00e9e\u00a0; demain elle se repose." },
    { emoji: 'doigt', titre:'Tes \u00e9crans du jour en premier',
      desc:"En mode tracteur, Tracteur, Phyto et Vigne passent en t\u00eate du menu du bas et l'app s'ouvre directement sur le Tracteur. Rien n'est retir\u00e9\u00a0: le reste glisse sous \u00ab\u00a0Plus\u00a0\u00bb, o\u00f9 se trouve aussi le retour au terrain." }
  ]},
  { v:'5.92', items:[
    { emoji: 'chrono', titre:'Le chrono tracteur ne se perd plus',
      desc:"Avant, verrouiller son t\u00e9l\u00e9phone pendant le travail effa\u00e7ait la mesure en cours sans rien dire. Elle est maintenant retrouv\u00e9e \u00e0 la r\u00e9ouverture, m\u00eame plusieurs heures apr\u00e8s." },
    { emoji: 'doigt', titre:'Toucher une parcelle lance la mesure',
      desc:"Plus de bouton D\u00e9marrer. On touche la parcelle o\u00f9 l'on commence, on touche \u00ab\u00a0J'ai fini\u00a0\u00bb en partant. Toucher directement la parcelle suivante ench\u00e2ine sans compter de d\u00e9placement." },
    { emoji: 'route', titre:'Trajets et pause d\u00e9jeuner s\u00e9par\u00e9s du travail',
      desc:"Trois compteurs au lieu d'un\u00a0: le temps dans les parcelles, le temps hors parcelle, la pause d\u00e9jeuner. La cadence ne m\u00e9lange plus la route et le travail." },
    { emoji: 'alerte', titre:'Un chrono oubli\u00e9 n\'est plus comptabilis\u00e9',
      desc:"Une mesure tr\u00e8s longue ou tr\u00e8s courte par rapport au bar\u00e8me est \u00e9cart\u00e9e\u00a0: la parcelle reste coch\u00e9e au bar\u00e8me, et l'\u00e9cran dit pourquoi." },
    { emoji: 'epingle', titre:'Les parcelles les plus proches en premier',
      desc:"La liste se range par distance \u00e0 la parcelle en cours au lieu de l'ordre alphab\u00e9tique. Une tourn\u00e9e rang\u00e9e par le chef reste prioritaire." }
  ]},
  { v:'5.91', items:[
    { emoji: 'chrono', titre:'La coupure d\u00e9jeuner dit enfin quand elle tombe',
      desc:'Un ouvrier qui lisait \u00ab une heure de pause \u00bb pouvait croire qu\u2019il en choisissait le moment ; la paie et le chef d\u2019exploitation y lisaient autre chose. Le planning parle maintenant de \u00ab coupure \u00bb, et vous pouvez dire \u00e0 quelle heure elle a lieu : Planning, onglet Mod\u00e8les, sous la dur\u00e9e. Une heure fixe, \u00ab selon le chantier \u00bb, ou rien du tout \u2014 tant que vous ne r\u00e9pondez pas, rien ne change chez vous. Les journ\u00e9es s\u2019affichent alors coup\u00e9es en deux : 09:00 \u2192 12:00 puis 13:00 \u2192 16:00.' },
    { emoji: 'balance', titre:'Trois nombres qui ne se confondent plus',
      desc:'Pr\u00e9sence, coupure, heures dues : une journ\u00e9e de 09:00 \u00e0 16:00 avec une heure de coupure fait 7 h de pr\u00e9sence et 6 h dues. Chaque dur\u00e9e affich\u00e9e porte d\u00e9sormais son \u00e9tiquette, pour que le chef, l\u2019ouvrier et la paie lisent la m\u00eame ligne sans l\u2019interpr\u00e9ter chacun \u00e0 sa fa\u00e7on.' }
  ] },
  { v:'5.90', items:[
    { emoji: 'calendrier', titre:'Le planning de l\u2019ann\u00e9e s\u2019imprime',
      desc:'Un nouveau document sort le rythme de l\u2019\u00e9quipe sur douze mois : jours travaill\u00e9s, heures de prise et de fin de service, coupure d\u00e9jeuner, fermetures et jours f\u00e9ri\u00e9s. Il se trouve dans R\u00e9glages, onglet App, \u00ab Documents & impressions \u00bb, et vous propose par d\u00e9faut l\u2019ann\u00e9e \u00e0 venir. Une page par mod\u00e8le de semaine : quand toute l\u2019\u00e9quipe suit le m\u00eame rythme, une seule feuille suffit.' }
  ] },
  { v:'5.89', items:[
    { emoji: 'raisin', titre:'La Cave suit le chemin du raisin',
      desc:'Les trois onglets de la Cave changent d\u2019ordre : Le Cuvier passe en premier, Le Chai vient ensuite, Le mill\u00e9sime ferme la marche. C\u2019est le trajet r\u00e9el du raisin, de la benne \u00e0 la bouteille. Rien ne bouge \u00e0 l\u2019int\u00e9rieur des \u00e9crans, aucune saisie n\u2019est d\u00e9plac\u00e9e, et la Cave continue de s\u2019ouvrir sur Le Chai.' }
  ] },
  { v:'5.88', items:[
    { emoji: 'graphique', titre:'Les graphiques ne se lisent plus \u00e0 la loupe',
      desc:'Sur t\u00e9l\u00e9phone, les chiffres et les \u00e9tiquettes des graphiques du Pilotage descendaient jusqu\u2019\u00e0 3 pixels, et ne d\u00e9passaient pas 7 sur un ordinateur : ils \u00e9taient dessin\u00e9s dans un cadre fixe que l\u2019\u00e9cran r\u00e9duisait ensuite. Chaque graphique mesure d\u00e9sormais la place dont il dispose et dessine \u00e0 cette taille, si bien que les textes font partout leur taille r\u00e9elle. Sur un \u00e9cran \u00e9troit, un calendrier de douze mois d\u00e9file au lieu de r\u00e9tr\u00e9cir, et les graphiques se recomposent : moins de graduations, et les noms passent au-dessus des barres plut\u00f4t que dans une colonne qui mangeait le tiers de l\u2019\u00e9cran.' },
    { emoji: 'bulle', titre:'Un graphique sans donn\u00e9e dit ce qui lui manque',
      desc:'Un titre s\u2019affichait, et sous lui, rien. Impossible de savoir s\u2019il manquait une saisie ou si l\u2019\u00e9cran \u00e9tait cass\u00e9. Les graphiques qui n\u2019ont pas de quoi tracer expliquent maintenant ce qui manque et o\u00f9 le saisir. Ceux qui n\u2019ont vraiment rien \u00e0 dire continuent de s\u2019effacer enti\u00e8rement, sans laisser un titre tout seul.' },
    { emoji: 'raisin', titre:'Le rendement au pressoir que vous avez r\u00e9gl\u00e9 sert partout',
      desc:'Le Cuvier vous laisse fixer votre fourchette de kilos par hectolitre. Deux \u00e9crans s\u2019en servaient, deux autres divisaient par 135 quoi qu\u2019il arrive : la cha\u00eene r\u00e9colte vers bouteilles du Chai, et le rendement du bilan de campagne. Tant que le r\u00e9glage restait \u00e0 sa valeur d\u2019origine, la diff\u00e9rence \u00e9tait invisible ; d\u00e8s qu\u2019on y touchait, deux \u00e9crans donnaient deux chiffres pour la m\u00eame cuv\u00e9e. Ils lisent tous le m\u00eame r\u00e9glage.' },
    { emoji: 'graphique', titre:'Les rendements par mill\u00e9sime se lisent dans le m\u00eame sens partout',
      desc:'La fiche parcelle affichait les mill\u00e9simes du plus r\u00e9cent au plus ancien, le Cuvier du plus ancien au plus r\u00e9cent : m\u00eame donn\u00e9e, deux sens de lecture. La fiche parcelle suit d\u00e9sormais celui du Cuvier, le plus ancien en haut, et l\u2019\u00e9cart se compare toujours \u00e0 la ligne du dessus.' }
  ] },
  { v:'5.87', items:[
    { emoji: 'feuille', titre:'Vos \u00e9cartements de plantation se r\u00e8glent enfin depuis R\u00e9glages',
      desc:'La distance entre vos rangs et entre vos pieds sert \u00e0 ramener les heures conseill\u00e9es \u00e0 votre densit\u00e9 r\u00e9elle : \u00e0 6 000 pieds \u00e0 l\u2019hectare, un bar\u00e8me pens\u00e9 pour 10 000 propose un tiers d\u2019heures de trop. Le r\u00e9glage existait, mais il n\u2019\u00e9tait accessible qu\u2019en ouvrant le bar\u00e8me de la convention par le bouton \u00ab \u002b Nouvelle t\u00e2che \u00bb \u2014 personne n\u2019allait l\u2019y chercher, et la mise en route vous envoyait sur l\u2019onglet Vigne o\u00f9 il ne figurait pas. Il a maintenant sa ligne, dans R\u00e9glages \u203a Vigne, qui affiche vos deux \u00e9cartements et le nombre de pieds \u00e0 l\u2019hectare qui en d\u00e9coule. Tant qu\u2019ils ne sont pas renseign\u00e9s, rien ne change nulle part.' }
  ] },
  { v:'5.86', items:[
    { emoji: 'boussole', titre:'Un domaine qui vient d\u2019\u00eatre install\u00e9 sait par o\u00f9 commencer',
      desc:'L\u2019Accueil d\u2019un administrateur affiche d\u00e9sormais une mise en route : le nom du domaine, les parcelles et leurs contours, les p\u00e9riodes de travail, le bar\u00e8me des t\u00e2ches, l\u2019\u00e9quipe, puis la premi\u00e8re validation. Rien n\u2019est \u00e0 cocher \u00e0 la main : chaque \u00e9tape se lit dans ce qui est d\u00e9j\u00e0 enregistr\u00e9, et m\u00e8ne d\u2019un geste au bon \u00e9cran. Le bloc s\u2019efface tout seul quand tout est fait. S\u2019il reste un r\u00e9glage qui rendrait un calcul plus juste \u2014 le SIRET pour le registre phyto en fichier, vos \u00e9cartements de plantation pour le bar\u00e8me \u2014 il ne garde qu\u2019une ligne. Les ouvriers ne le voient pas : ce sont des r\u00e9glages de domaine.' }
  ] },
  { v:'5.85', items:[
    { emoji: 'info', titre:'L\u2019aide de chaque \u00e9cran dit enfin ce que l\u2019\u00e9cran fait',
      desc:'La pastille « ? Aide » d\u00e9crivait des modules tels qu\u2019ils \u00e9taient il y a plusieurs mois. Celle du Pilotage annon\u00e7ait six onglets quand il y en a sept, et en nommait deux qui n\u2019existent plus. Celles de la Cave et de La R\u00e9serve ignoraient le parc \u00e0 f\u00fbts, la s\u00e9paration des mill\u00e9simes et les documents. Les dix fiches sont refaites, et la liste des onglets est d\u00e9sormais lue dans l\u2019application au moment o\u00f9 vous ouvrez l\u2019aide : elle ne pourra plus vieillir toute seule.' },
    { emoji: 'euro', titre:'\u00c9conomie annon\u00e7ait une fin de p\u00e9riode moins ch\u00e8re que ce que vous aviez d\u00e9j\u00e0 d\u00e9pens\u00e9',
      desc:'L\u2019\u00e9cart de cadence \u2014 « votre \u00e9quipe va-t-elle plus vite ou moins vite que le bar\u00e8me ? » \u2014 comptait les heures de pr\u00e9sence \u00e0 partir des seules journ\u00e9es portant une validation. Or une validation couvre souvent plusieurs jours de travail : sur le printemps, 165 journ\u00e9es sur 559 en portaient une, et l\u2019application concluait que vous alliez deux fois plus vite que pr\u00e9vu. Elle projetait alors une fin de p\u00e9riode \u00e0 37 000 \u20ac sur une p\u00e9riode termin\u00e9e o\u00f9 79 000 \u20ac \u00e9taient d\u00e9j\u00e0 engag\u00e9s, et conseillait en vert de r\u00e9duire un bar\u00e8me qui \u00e9tait juste. La pr\u00e9sence vient maintenant du planning, comme dans Exercice comptable, et la cadence ne s\u2019applique plus qu\u2019\u00e0 ce qui reste \u00e0 faire : une projection ne peut plus contredire ce qui est d\u00e9j\u00e0 d\u00e9pens\u00e9. Le planning dit qui \u00e9tait l\u00e0, jamais ce que la personne a fait \u2014 l\u2019\u00e9cran le rappelle sous l\u2019indicateur.' }
  ] },
  { v:'5.84', items:[
    { emoji: 'carte', titre:'Vos parcelles sont bien cartographi\u00e9es d\u00e8s l\u2019installation',
      desc:'L\u2019\u00e9cran d\u2019installation annon\u00e7ait que l\u2019import du fichier KML \u00ab arriverait prochainement \u00bb. C\u2019\u00e9tait inexact : le contour de chaque parcelle est mis en place d\u00e8s l\u2019installation, \u00e0 partir de votre fichier. La phrase le dit maintenant.' },
    { emoji: 'nombre', titre:'Le carnet d\u2019entretien affichait un num\u00e9ro de version faux',
      desc:'Son pied de page indiquait toujours la m\u00eame version, fig\u00e9e depuis longtemps, quelle que soit la version r\u00e9ellement install\u00e9e chez vous. Il affiche d\u00e9sormais la bonne.' }
  ] },
  { v:'5.83', items:[
    { emoji: 'crayon', titre:'Tous vos documents sont \u00e0 la police du domaine',
      desc:'Le rapport de saison, le relev\u00e9 mensuel, le registre phyto, la fiche salari\u00e9 et le carnet d\u2019entretien sortaient chacun dans une police diff\u00e9rente \u2014 Georgia, Helvetica, Segoe UI \u2014 selon le navigateur qui les ouvrait. Le rapport de saison demandait m\u00eame la bonne police sans jamais la charger. Ils utilisent maintenant tous celle du domaine, comme les documents de la cave.' }
  ] },
  { v:'5.82', items:[
    { emoji: 'document', titre:'Vos documents se ressemblent enfin',
      desc:'Chaque document imprimable avait sa propre mise en page : des marges diff\u00e9rentes d\u2019un document \u00e0 l\u2019autre, et la plupart sortaient dans la police par d\u00e9faut du navigateur au lieu de la v\u00f4tre. Ils partagent maintenant le m\u00eame en-t\u00eate au nom de votre domaine, le m\u00eame pied de page et les m\u00eames marges. Le paysage reste r\u00e9serv\u00e9 aux grands tableaux, comme le registre phyto.' },
    { emoji: 'imprimante', titre:'Les documents de la cave s\u2019impriment directement',
      desc:'Le rapport d\u2019op\u00e9rations et l\u2019export des r\u00e9coltes ne s\u2019imprimaient pas : ils t\u00e9l\u00e9chargeaient un fichier qu\u2019il fallait retrouver dans ses t\u00e9l\u00e9chargements puis rouvrir soi-m\u00eame. Ils s\u2019ouvrent d\u00e9sormais dans un onglet, pr\u00eats \u00e0 imprimer ou \u00e0 enregistrer en PDF, comme tous les autres.' }
  ] },
  { v:'5.81', items:[
    { emoji: 'imprimante', titre:'Tous vos documents au m\u00eame endroit',
      desc:'Le registre phyto \u00e9tait dans un \u00e9cran, l\u2019inventaire des f\u00fbts dans un autre, le bilan de campagne dans un troisi\u00e8me, et le reste dans « Exporter / Importer ». Il fallait savoir o\u00f9 chaque document avait \u00e9t\u00e9 rang\u00e9. R\u00e9glages ouvre maintenant « Documents & impressions » : tout ce que Ma Vigne sait imprimer y figure, class\u00e9 par usage. Ce que vous devez pouvoir montrer en contr\u00f4le d\u2019abord, vos \u00e9tats internes ensuite, vos donn\u00e9es brutes pour finir. Chaque ligne dit son format et ce qu\u2019elle va vous demander avant de g\u00e9n\u00e9rer.' },
    { emoji: 'liste', titre:'Le registre phyto en fichier Excel est mis en avant',
      desc:'Il devient obligatoire au 1er janvier 2027 : un registre imprim\u00e9 ne suffira plus, il faudra un fichier lisible par machine. Il \u00e9tait d\u00e9j\u00e0 disponible, mais peu visible. Il est d\u00e9sormais en t\u00eate de la liste, avec sa date limite \u00e9crite \u00e0 c\u00f4t\u00e9.' },
    { emoji: 'calendrier', titre:'Le relev\u00e9 mensuel se pr\u00e9pare sur son propre \u00e9cran',
      desc:'Le formulaire du relev\u00e9 d\u2019heures occupait le haut de la page \u00e0 chaque ouverture, m\u00eame quand vous veniez chercher autre chose. Il s\u2019ouvre maintenant quand vous cliquez dessus, et le r\u00e9glage des heures de la saison a sa propre ligne.' }
  ] },
  { v:'5.80', items:[
    { emoji: 'rotation', titre:'Le soutirage se lit pareil partout',
      desc:'Le bouton « Soutirer » du Pilotage ouvrait le Cuvier, alors que le soutirage se fait au Chai. Et la fiche de cuv\u00e9e pouvait annoncer un soutirage que le journal du Chai ne connaissait pas. Le r\u00e9glage « sous tirage » de la fiche est retir\u00e9 : une cuv\u00e9e se soutire plusieurs fois pendant l\u2019\u00e9levage, un oui/non ne pouvait pas le dire. On enregistre le soutirage au Chai, avec sa date, et la cuv\u00e9e affiche « Soutir\u00e9e le\u2026 ». \u26a0\u{FE0F} Une cuv\u00e9e que vous aviez seulement coch\u00e9e r\u00e9appara\u00eetra « \u00e0 soutirer » tant que le soutirage n\u2019est pas enregistr\u00e9 : l\u2019application n\u2019en a aucune trace dat\u00e9e.' },
    { emoji: 'eprouvette', titre:'Un soutirage trop ancien ne compte plus',
      desc:'Une cuv\u00e9e soutir\u00e9e avant la fin de sa malo \u00e9tait consid\u00e9r\u00e9e comme faite. Le Pilotage compare maintenant la date du soutirage \u00e0 celle o\u00f9 la malo a \u00e9t\u00e9 constat\u00e9e termin\u00e9e, et vous dit pourquoi la cuv\u00e9e reste \u00e0 soutirer.' },
    { emoji: 'sablier', titre:'La part des anges, mill\u00e9sime par mill\u00e9sime',
      desc:'Un seul taux pour toute la cave donnait une moyenne qui ne d\u00e9crivait aucun vin. Chaque mill\u00e9sime a maintenant sa ligne dans le Pilotage : volume remis, nombre d\u2019ouillages, f\u00fbts concern\u00e9s et taux annuel qui lui est propre. La fen\u00eatre est de douze mois glissants.' },
    { emoji: 'calendrier', titre:'L\u2019ouillage group\u00e9 par mill\u00e9sime',
      desc:'Les cuv\u00e9es \u00e0 ouiller sont regroup\u00e9es par ann\u00e9e, avec le d\u00e9lai propre \u00e0 chacune. Si vous n\u2019avez qu\u2019un mill\u00e9sime en cave, rien ne change \u00e0 l\u2019\u00e9cran.' },
    { emoji: 'document', titre:'Registre et bilan par mill\u00e9sime',
      desc:'Le registre des manipulations et le bilan de campagne se lisent d\u00e9sormais mill\u00e9sime par mill\u00e9sime. Une campagne contient deux vins \u2014 celui qui rentre et celui qui finit son \u00e9levage \u2014 et les m\u00e9langer produisait des documents illisibles. Le bilan indique lui-m\u00eame ce qui rel\u00e8ve de la campagne et ce qui rel\u00e8ve du mill\u00e9sime.' }
  ]},
  { v:'5.79', items:[
    { emoji: 'sablier', titre:'Un seuil d\u2019ouillage par mill\u00e9sime',
      desc:'Un vin jeune se rattrape plus souvent qu\u2019un vin d\u2019un an. Vous pouvez d\u00e9sormais r\u00e9gler le d\u00e9lai d\u2019alerte mill\u00e9sime par mill\u00e9sime, dans les r\u00e9glages du Chai. Sans r\u00e9glage propre, un mill\u00e9sime suit le seuil g\u00e9n\u00e9ral \u2014 rien ne change pour vous tant que vous n\u2019y touchez pas.' },
    { emoji: 'loupe', titre:'Les chiffres du Chai suivent le filtre',
      desc:'En filtrant sur un mill\u00e9sime, le bandeau affichait encore les totaux de toute la cave. Cuv\u00e9es, f\u00fbts, hectolitres et cuv\u00e9es \u00e0 ouiller correspondent maintenant \u00e0 ce que vous regardez.' }
  ]},
  { v:'5.78', items:[
    { emoji: 'dossier', titre:'Un mill\u00e9sime \u00e0 la fois dans la Cave',
      desc:'Une op\u00e9ration porte d\u00e9sormais sur un seul mill\u00e9sime : on choisit l\u2019ann\u00e9e, puis seules ses cuv\u00e9es sont propos\u00e9es. On n\u2019ouille pas les f\u00fbts d\u2019un mill\u00e9sime avec le vin d\u2019un autre.' },
    { emoji: 'goutte', titre:'Le volume d\u2019ouillage propos\u00e9 devient juste',
      desc:'Le volume conseill\u00e9 par f\u00fbt \u00e9tait calcul\u00e9 sur la moyenne de tous vos ouillages, tous mill\u00e9simes confondus. Il ne regarde plus que les ouillages de la cuv\u00e9e concern\u00e9e.' }
  ]},
  { v:'5.77', items:[
    { emoji: 'microscope', titre:'L\u2019acide malique se saisit dans l\u2019analyse',
      desc:'Un champ de plus dans le formulaire d\u2019analyse, \u00e0 recopier depuis le bulletin du labo. \u00c0 partir de trois valeurs, Ma Vigne projette la fin de la malo de chaque cuv\u00e9e \u2014 sur vos mesures, pas sur une moyenne.' },
    { emoji: 'rotation', titre:'Le Pilotage vous dit quelle cuv\u00e9e soutirer',
      desc:'L\u2019onglet Cave signale les cuv\u00e9es dont la malo est finie et qui attendent leur soutirage, et alerte quand le malique cesse de descendre alors qu\u2019il en reste.' },
    { emoji: 'outil', titre:'Une analyse modifi\u00e9e ne perd plus ses valeurs',
      desc:'En rouvrant une analyse pour corriger sa date, les SO\u2082 et l\u2019acidit\u00e9 volatile pouvaient \u00eatre remplac\u00e9s par ceux de la saisie pr\u00e9c\u00e9dente. Le formulaire affiche maintenant les vraies valeurs de l\u2019analyse.' },
    { emoji: 'verre', titre:'La Cave du Pilotage devient un tableau de bord',
      desc:'Trois vues : ce qui presse aujourd\u2019hui, o\u00f9 en est le mill\u00e9sime, et ce que co\u00fbte le parc \u00e0 f\u00fbts. Chaque ligne renvoie vers l\u2019\u00e9cran de saisie correspondant.' }
  ]},
  // 5.76 — Bilan de campagne.
  { v: '5.76', items: [
    { emoji: 'livre', titre: 'Le bilan de votre campagne',
      desc: 'Une année entière sur deux pages imprimables : les travaux de la vigne, la récolte '
          + 'parcelle par parcelle, le chemin du raisin jusqu’à la bouteille, l’état du chai et '
          + 'du parc à fûts, la protection du vignoble. Rien de plus à saisir : tout vient de '
          + 'ce que vous avez noté au fil de l’année.' },
    { emoji: 'dossier', titre: 'Deux façons de l’ouvrir',
      desc: 'Depuis Pilotage › Archives, l’écran de fin de campagne, ou depuis '
          + 'Réglages › Import / Export à côté de vos autres documents.' },
    { emoji: 'boussole', titre: 'Des chiffres qui disent leur assiette',
      desc: 'La surface travaillée additionne les passages : une parcelle relevée deux fois y '
          + 'compte deux fois. Le rendement moyen ne porte que sur les parcelles récoltées. '
          + 'Le document le dit, pour qu’aucun chiffre ne soit lu de travers.' }
  ] },
  // 5.75 — Entonnage depuis le parc + registre des manipulations.
  { v: '5.75', items: [
    { emoji: 'verre', titre: 'Choisir ses barriques au décuvage',
      desc: 'Au décuvage, vous piochez maintenant dans vos fûts libres : tonnelier par tonnelier, '
          + 'année par année. L’app propose de commencer par les plus vieux et signale si elle doit '
          + 'prendre du bois neuf. Vos cuvées savent enfin d’où viennent leurs fûts, et leur âge '
          + 'est juste — avant, tout fût créé au décuvage passait pour neuf.' },
    { emoji: 'liste', titre: 'Le registre des manipulations',
      desc: 'Toutes vos manipulations œnologiques d’une campagne, mises en forme et imprimables : '
          + 'enrichissement, sulfitage, adjonctions, pratiques de cave. Rien de plus à saisir, tout '
          + 'vient de ce que vous notez déjà au Cuvier et au Chai. Depuis Le Cuvier › Réglages, '
          + 'ou Réglages › Import / Export.' },
    { emoji: 'recu', titre: 'Un état interne, pas une déclaration',
      desc: 'Le registre vous aide à retrouver et présenter vos manipulations. Il ne remplace aucune '
          + 'déclaration officielle : Ma Vigne prépare, vous déclarez.' }
  ] },
  // 5.74 — Le parc a futs : mouvements d'entree et de sortie.
  { v: '5.74', items: [
    { emoji: 'bouteille', titre: 'Vos fûts reviennent au parc',
      desc: 'Quand une cuvée part en bouteille, ses fûts redeviennent disponibles dans '
          + 'La Réserve, vieillis d’un vin. Même chose quand vous retirez des fûts d’une '
          + 'cuvée : le fût vide revient, sauf si vous le jetez.' },
    { emoji: 'envoyer', titre: 'Se séparer de fûts',
      desc: 'Vente, retour au tonnelier ou destruction : trois motifs, depuis l’onglet Fûts '
          + 'de La Réserve. Le mouvement reste au registre, même pour un fût détruit.' },
    { emoji: 'liste', titre: 'Le registre du parc',
      desc: 'Tout ce qui entre et sort, avec son motif et sa date. Entonner ou embouteiller ne '
          + 'change pas le nombre de fûts du domaine : seuls un achat ou une séparation le font '
          + 'bouger, et le registre explique l’écart entre deux inventaires.' }
  ] },
  // 5.73 — Cave : troisieme ecran « Le millesime ».
  { v: '5.73', items: [
    { emoji: 'chrono', titre: 'La cave dit enfin ce qui arrive',
      desc: 'Un nouvel écran « Le millésime », à côté du Chai et du Cuvier. Il montre les quatre '
          + 'prochaines semaines : les fûts à ouiller, les cuves à mesurer, la fin de fermentation '
          + 'estimée, et les fermentations qui ralentissent. Rien de plus à saisir : tout se déduit '
          + 'de ce que vous notez déjà.' },
    { emoji: 'raisin', titre: 'De la vigne à la bouteille, d’un seul regard',
      desc: 'Le second onglet suit le parcours d’un millésime : ce qui est rentré, ce qui fermente, '
          + 'ce qui est en fût, ce qui est en bouteille, avec la perte à chaque étape. On y voit aussi '
          + 'le rendement de chaque parcelle et d’où vient chaque cuvée.' },
    { emoji: 'balance', titre: 'Le rendement de l’appellation',
      desc: 'Posez une fois le maximum autorisé sur une parcelle, en touchant sa ligne : '
          + 'un dépassement se voit immédiatement. Rien n’est bloqué, c’est vous qui décidez.' }
  ] },
  // 5.72 — SEC-GT/2 : second facteur sur le panneau GUERETTECH. Interne.
  { v: '5.72', items: [] },
  // 5.71 — SEC-GT + Business/Leads : panneau GUERETTECH interne, rien de visible
  // côté client. items:[] = sous-lot technique (le modal ne s'ouvre pas).
  { v: '5.71', items: [] },
  { v: '5.70', items: [
    { emoji: 'calendrier', titre: "Ce que l\u2019exercice a co\u00fbt\u00e9, d\u2019un bilan \u00e0 l\u2019autre", desc: "Pilotage \u203a \u00c9conomie ne savait chiffrer qu\u2019une campagne. Or un comptable ne raisonne pas en campagne, il raisonne du 1\u1D49\u02B3 ao\u00fbt au 31 juillet. Nouvel onglet \u00ab Exercice \u00bb : salaires charg\u00e9s, carburant et achats d\u2019intrants sur la fen\u00eatre exacte de votre bilan, mois par mois, avec la comparaison \u00e0 l\u2019exercice pr\u00e9c\u00e9dent." },
    { emoji: 'euro', titre: "Des salaires compt\u00e9s une seule fois", desc: "Le budget de campagne s\u00e9pare le travail de la vigne et la conduite du tracteur, parce que le bar\u00e8me h/ha ne conna\u00eet pas les heures de tracteur. Le planning, lui, contient d\u00e9j\u00e0 toutes les heures pay\u00e9es. L\u2019exercice compte donc la paie une seule fois, et n\u2019ajoute au tracteur que son carburant." },
    { emoji: 'engrenage', titre: "Votre date de bilan", desc: "R\u00e9glable dans l\u2019onglet Exercice si votre cl\u00f4ture ne tombe pas fin juillet. Le mois choisi vaut pour tout le domaine et ne touche ni aux campagnes, ni aux cong\u00e9s, ni \u00e0 aucun chiffre existant." },
    { emoji: 'recu', titre: "Ce que le total ne contient pas, \u00e9crit noir sur blanc", desc: "Fermage, amortissements, assurances, cotisations du chef d\u2019exploitation, embouteillage, frais g\u00e9n\u00e9raux : Ma Vigne ne les conna\u00eet pas. L\u2019\u00e9cran le dit \u00e0 c\u00f4t\u00e9 du total, pour que personne ne le compare \u00e0 un compte de r\u00e9sultat." }
  ] },
  { v: '5.69', items: [
    { emoji: 'boussole', titre: "L\u2019ordre de passage arrive enfin sur l\u2019\u00e9cran de l\u2019\u00e9quipe", desc: "Dans Pilotage \u203a D\u00e9cider, ranger les parcelles puis enregistrer affichait \u00ab partag\u00e9 \u00e0 l\u2019\u00e9quipe \u00bb. En r\u00e9alit\u00e9, l\u2019ordre n\u2019\u00e9tait lu nulle part : personne ne le voyait. Il pilote maintenant l\u2019\u00e9cran Vigne \u2014 les parcelles s\u2019affichent dans l\u2019ordre de la tourn\u00e9e, avec leur num\u00e9ro sur la fiche et sur la carte." },
    { emoji: 'cible', titre: "Une tourn\u00e9e par travail", desc: "L\u2019ordre s\u2019enregistre pour le ou les travaux s\u00e9lectionn\u00e9s, pas pour le domaine en bloc. Deux \u00e9quipes qui tournent sur deux travaux diff\u00e9rents voient chacune son propre parcours. Pour reprendre le m\u00eame ordre sur plusieurs travaux, il suffit de les cocher ensemble avant d\u2019enregistrer." },
    { emoji: 'nombre', titre: "Des num\u00e9ros qui restent justes tout seuls", desc: "Le num\u00e9ro se recalcule sur ce qui reste \u00e0 faire : 1, 2, 3\u2026 sans trou, m\u00eame apr\u00e8s trois jours de chantier. Une parcelle termin\u00e9e sort simplement de la tourn\u00e9e. Un bouton \u00ab Tri normal \u00bb permet \u00e0 chacun de revenir \u00e0 l\u2019affichage habituel, et l\u2019administrateur peut retirer une tourn\u00e9e quand elle n\u2019a plus lieu d\u2019\u00eatre." }
  ] },
  { v: '5.68', items: [
    { emoji: 'graphique', titre: "Votre registre phyto s\u2019exporte maintenant en Excel", desc: "Le registre existait en PDF. Depuis janvier 2026, la r\u00e9glementation demande qu\u2019il soit tenu sous forme \u00e9lectronique, dans un fichier qu\u2019un logiciel peut lire \u2014 ce qu\u2019un PDF imprim\u00e9 n\u2019est pas. Un nouveau bouton, en bas du registre et dans R\u00e9glages \u203a Export, produit ce fichier : une ligne par produit et par parcelle, avec la date, la dose, les horaires, le stade, la surface trait\u00e9e et les coordonn\u00e9es de la parcelle. Il s\u2019ouvre d\u2019un double-clic dans Excel. L\u2019obligation devient ferme au 1er janvier 2027." },
    { emoji: 'recu', titre: "Le SIRET et le mode de production du domaine", desc: "Le registre export\u00e9 doit porter le num\u00e9ro SIRET de l\u2019exploitation et dire si la production est conduite en bio. Ces deux informations se saisissent une fois pour toutes dans R\u00e9glages \u203a Domaine, et se retrouvent ensuite sur chaque ligne du registre. Tant que le SIRET manque, l\u2019export vous le signale au lieu de sortir un fichier incomplet sans rien dire." },
    { emoji: 'document', titre: "Les exports CSV s\u2019ouvrent enfin correctement dans Excel", desc: "Les exports du journal et des parcelles s\u00e9paraient leurs colonnes par une virgule. Ouverts en France, ils entassaient tout dans une seule colonne, et les surfaces \u00e0 virgule s\u2019y m\u00e9langeaient aux s\u00e9parateurs. Ils utilisent d\u00e9sormais le point-virgule, comme le reste de l\u2019application." }
  ] },
  { v: '5.67', items: [
    { emoji: 'liste', titre: "Choisissez le barème de votre région", desc: "Les heures conseillées de l'application venaient toutes de l'accord bourguignon. Un domaine girondin y lisait des chiffres qui n'étaient pas les siens. Dans l'écran du barème, vous choisissez maintenant votre région : la Bourgogne ou la Gironde pour commencer, d'autres viendront au fil des installations. Chaque barème indique son texte source et sa date. Rien n'est imposé : c'est une référence, vos heures restent les vôtres, et changer de barème ne modifie aucune de vos valeurs." }
  ] },
  { v: '5.66', items: [
    { emoji: 'feuille', titre: "Le barème s'adapte à la densité de vos vignes", desc: "Les heures par hectare du barème valent pour une vigne à 10 000 pieds — un mètre entre les rangs, un mètre sur le rang. Une parcelle plantée à trois mètres compte trois fois moins de pieds, donc à peu près trois fois moins de travail à la taille. Dans l'écran du barème, vous pouvez maintenant indiquer vos écartements : les heures conseillées sont recalculées en conséquence, comme le prévoit l'accord collectif. Rien n'est imposé — c'est une proposition, vos valeurs restent les vôtres. Et tant que vous ne renseignez rien, absolument rien ne change." }
  ] },
  { v: '5.65', items: [
    { emoji: 'calendrier', titre: "Modifier les heures d'une tâche changeait sa saison", desc: "Dans Réglages › Tâches, ouvrir une tâche et l'enregistrer — même sans rien changer — effaçait les saisons qu'on lui avait données et remettait celles du barème. Une pioche réglée sur l'automne repassait au printemps, sans un mot. La cause : l'écran des heures réécrivait la tâche entière au lieu de ne toucher qu'aux heures. Il ne modifie plus que ce qu'on lui demande." }
  ] },
  { v: '5.64', items: [
    { emoji: 'chrono', titre: "Les passages sautés ne comptent plus comme du travail fait", desc: "Quand le relevage se fait en un seul passage, on valide directement le dernier niveau et les précédents se cochent tout seuls. L'application comptait alors les trois passages : 100 heures par hectare au lieu des 50 réellement passées. Sur un domaine où presque toutes les parcelles sont dans ce cas, cela représentait près de 600 heures de travail qui n'ont jamais eu lieu — de quoi gonfler le coût de main-d'œuvre par parcelle et laisser croire que l'équipe allait plus vite que le barème. Un passage sauté ne compte plus, ni dans le travail fait, ni dans le travail qui reste : une parcelle relevée une fois est terminée, et son reste à faire est bien zéro. L'avancement en surface, lui, ne bouge pas d'un centième." }
  ] },
  { v: '5.63', items: [
    { emoji: 'doigt', titre: "Quatre modules dans la barre du bas, au lieu de trois", desc: "Sur téléphone, la barre du bas n'affichait que trois modules : tout le reste était rangé derrière le bouton « ⋯ Plus », y compris des modules ouverts plusieurs fois par jour. Elle en montre maintenant quatre. Et quand un domaine tient en cinq modules — parce que sa formule en donne cinq, ou parce que certains ont été décochés dans la fiche d'un membre — ils sont tous dans la barre : le bouton « Plus » disparaît." }
  ] },
  { v: '5.62', items: [
    { emoji: 'calendrier', titre: "« Ça tient dans la fenêtre » alors que la fenêtre était déjà passée", desc: "Dans Pilotage › Décider, le bandeau de l'ordre de passage comparait le travail restant à la fenêtre entière de la tâche — du premier au dernier jour où elle peut se faire. Consulté le 15 juin sur un relevage prévu du 1er avril au 30 juin, il annonçait 65 jours disponibles alors qu'il n'en restait que 12, et affichait un feu vert sur un chantier qui débordait de deux semaines. Il compte maintenant les jours qui restent à partir d'aujourd'hui." },
    { emoji: 'equipe', titre: "Le nombre de personnes conseillé ne suffisait pas", desc: "Quand le travail débordait, l'écran indiquait combien de personnes il faudrait — sans compter les déplacements entre parcelles, qui sont pourtant les mêmes quel que soit le nombre de bras. Sur vingt parcelles à cinq personnes, il conseillait cinq personnes : exactement l'équipe déjà en place. Il en fallait sept. Les trajets sont désormais dans le calcul." },
    { emoji: 'feuille', titre: "Chaque tâche est jugée sur sa propre période", desc: "En cochant plusieurs tâches, l'application les évaluait sur une seule période allant du début de la plus précoce à la fin de la plus tardive. Taille en janvier et effeuillage en juillet donnaient ainsi 141 jours de marge quand les deux périodes réelles n'en totalisent que 64 : le verdict était favorable d'avance. Chaque tâche a maintenant sa ligne, sa charge et son verdict." },
    { emoji: 'curseurs', titre: "Deux chiffres qui se contredisaient", desc: "Le bandeau pouvait afficher « 0,00 ha » après une journée entière passée sur une grande parcelle : la surface n'était comptée qu'au jour où la parcelle se termine. Elle se répartit désormais sur les journées réellement travaillées. Dans le simulateur « et si ? », la fin de saison ne bougeait pas d'un jour quand on déplaçait l'équipe entre les tâches, et restait affichée même avec deux tâches à l'arrêt. Elle suit maintenant la dernière tâche à finir — et le dit clairement quand une tâche n'a personne." }
  ] },
  { v: '5.61', items: [
    { emoji: 'equipe', titre: "Une seule ligne pour toute une equipe", desc: "Pour la vendange, il fallait creer une fiche par personne : trente fiches qui ne se connecteront jamais, qui n'ont aucun compteur d'annualisation a tenir, et qui rendent la grille illisible le seul mois ou elle sert vraiment. Une fiche peut desormais etre declaree \u00ab\u00a0equipe collective\u00a0\u00bb dans Reglages \u203a Equipe, avec un nombre de personnes. La ligne reste unique dans le planning, mais ses heures comptent pour tout le monde." },
    { emoji: 'calendrier', titre: "L'effectif se change jour par jour", desc: "Une vendange ne se fait pas au meme nombre du premier au dernier jour. Dans la grille Equipe, la selection multiple porte un nouveau bouton Effectif : on touche les jours concernes, on saisit le nombre, c'est applique d'un coup. La saisie du jour prime sur le nombre par defaut de la fiche, et elle ne touche pas aux horaires deja poses." },
    { emoji: 'balance', titre: "Ce qui reste strictement individuel", desc: "Une equipe collective n'entre ni dans le compteur des 1607 heures, ni dans les conges payes, ni dans les heures supplementaires, ni dans les alertes de depassement hebdomadaire, ni dans le releve d'heures individuel. Ces compteurs ne veulent rien dire pour trente personnes reunies sous un seul nom, et les laisser tourner aurait declenche une alarme des le premier jour de vendange." },
    { emoji: 'feuille', titre: "Le partage du travail tient compte du nombre", desc: "Quand une parcelle est faite par le chef de culture et l'equipe de vendange, \u00ab\u00a0Ma part du chantier\u00a0\u00bb ne partage plus la surface en deux parts egales : chacun pese son effectif reel. Le total affiche reste evidemment identique." }
  ] },
  { v: '5.60', items: [
    { emoji: 'equipe', titre: "Les saisonniers disparaissaient de la courbe d'effectif", desc: "Dans Pilotage, la courbe « Personnes nécessaires / semaine » et le calcul d'ETP ne comptaient que les fiches encore marquées Actives. Or on passe une fiche en Inactif quand le contrat se termine — l'application le conseille elle-même. Résultat : dès qu'un saisonnier était rangé en fin de mission, il s'effaçait de toute la campagne, comme s'il n'avait jamais travaillé. Sur un domaine réel, le pic affichait 4 personnes au lieu de 10. Une fiche compte désormais dans une campagne dès que ses dates de contrat la recoupent, quel que soit son statut d'aujourd'hui." },
    { emoji: 'euro', titre: "Le coût de main-d'oeuvre reposait sur une seule personne", desc: "Le taux horaire moyen qui sert au coût par hectare était calculé sur les seules personnes sous contrat le jour de la consultation. Une fois la saison terminée, il ne restait souvent qu'un permanent : tout le budget travail de la campagne se retrouvait chiffré sur son seul taux. La moyenne porte maintenant sur l'équipe qui a réellement fait la campagne." },
    { emoji: 'calendrier', titre: "Ce qui n'a pas changé", desc: "Les écrans qui répondent à « qui est là aujourd'hui » — carte Équipe, présences du jour, effectif au champ — gardent exactement le même comportement qu'avant. Seuls les calculs de campagne ont été corrigés. Les personnes rattachées au bureau restent hors du calcul de charge des vignes, comme avant." }
  ] },
  { v: '5.59', items: [
    { emoji: 'doigt', titre: "Sur iPhone, des messages ne s'affichaient jamais", desc: "Plusieurs écrans passaient par les petites fenêtres du navigateur pour vous avertir : « date obligatoire », « réservé aux tractoristes », « sélectionnez un mois ». Quand l'application est installée sur l'écran d'accueil d'un iPhone, ces fenêtres ne s'affichent pas : le message restait invisible, l'action ne partait pas, et rien n'expliquait pourquoi. Quinze messages étaient concernés, dont sept dans Tracteur. Ils passent tous par les bandeaux habituels de l'application." },
    { emoji: 'crayon', titre: "Le consommé saisi à la main redevient modifiable", desc: "Dans La Réserve, le crayon à côté du consommé ouvrait une fenêtre de saisie du navigateur. Sur iPhone, cette fenêtre n'apparaît pas du tout : le crayon ne faisait tout simplement rien. Il ouvre maintenant une vraie fiche, avec le nom du produit, son unité et le clavier numérique. La virgule est acceptée." },
    { emoji: 'cible', titre: "Le champ oublié se met en avant tout seul", desc: "Quand il manque une date, un nom ou un mois, l'application ne se contente plus de le signaler : elle place le curseur dans le champ concerné et ouvre le clavier dessus. Une manipulation de moins quand on a les mains prises." }
  ] },
  { v: '5.58', items: [
    { emoji: 'nuage', titre: "La météo par secteur affichait un jour qui n'existait pas", desc: "Un secteur montrait un relevé sans rapport avec la journée en cours — 18° et 11°/21° un jour de canicule — pendant que tous les autres restaient bloqués sur un sablier. En cause : la visite de démonstration écrivait sa météo inventée dans la même mémoire que votre domaine et ne la nettoyait jamais, et cette mémoire, une fois présente, empêchait toute nouvelle demande. Le relevé est désormais rattaché à votre domaine, daté, et redemandé dès qu'il vieillit ou qu'il manque un secteur." },
    { emoji: 'thermometre', titre: "Un seul chiffre pour une seule heure", desc: "La pastille en haut de l'écran et les cartes par secteur interrogeaient deux modèles différents : deux températures pouvaient s'afficher au même moment pour le même endroit. Tout passe maintenant par le modèle Météo-France. Et quand un relevé date de plus de vingt minutes, son âge est écrit à côté du titre." },
    { emoji: 'antenne', titre: "Plus de sablier qui tourne dans le vide", desc: "L'application redemandait la météo à chaque rafraîchissement de l'accueil, jusqu'à se faire refuser par le service météo — un refus qu'elle ne savait pas reconnaître, d'où le sablier indéfini et l'absence totale de trace. Les demandes sont désormais espacées, les refus sont détectés et consignés, et si la météo est vraiment indisponible, c'est écrit." }
  ] },
  { v: '5.57', items: [
    { emoji: 'drapeau', titre: "La fin d'un chantier prend tout l'écran", desc: "Quand la dernière parcelle d'une tâche tombe, le récapitulatif s'affiche en plein écran au lieu d'une fiche en bas : la surface, le nombre de parcelles, les jours passés et les personnes qui y étaient. Cela n'arrive que cinq ou six fois par campagne — c'est ce qui lui donne sa valeur." },
    { emoji: 'calendrier', titre: "« Est-ce qu'on s'y est pris plus tôt cette année ? »", desc: "La question qu'on se pose vraiment à la fin d'un chantier trouve enfin sa réponse dans l'application. À la fin d'une tâche, et sous la date de fin prévue du bloc « Ma part du chantier », l'écart avec la campagne précédente s'affiche en clair : tant de jours plus tôt, ou plus tard. La comparaison se fait sur le rang du jour dans la campagne, pas sur la date brute — deux campagnes qui ne commencent pas le même jour restent comparables. Elle est lue dans le journal, elle n'a donc besoin d'aucune clôture préalable." },
    { emoji: 'dossier', titre: "Consulter une archive ne mélange plus les années", desc: "En consultant une période passée, les surfaces venaient bien de l'archive mais les intervenants étaient relus dans le journal de l'année en cours : votre part et celle de l'équipe pouvaient être fausses sur les écrans d'archive. Tout se lit désormais sur la période que vous consultez, jamais sur celle qui est active." }
  ] },
  { v: '5.56', items: [
    { emoji: 'epingle', titre: "Personne ne savait que quelqu'un lisait", desc: "On saisit tous les jours sans jamais voir ce que ça donne à l'échelle du domaine. La nouvelle page « Le domaine cette semaine » montre la surface parcourue par toute l'équipe depuis lundi, puis qui a fait quoi — par ordre alphabétique, jamais par quantité. Aucune heure, aucune rémunération n'apparaît là : uniquement des hectares et des noms de parcelles." },
    { emoji: 'bulle', titre: "Un mot à l'équipe, une fois par semaine", desc: "L'administrateur peut écrire deux lignes qui s'affichent pour tout le monde : ce qui a bien tourné, ce qui vient lundi. C'est le seul texte saisi à la main de toute cette série de nouveautés, et probablement le plus utile — un mot d'un humain vaut mieux qu'une jauge." },
    { emoji: 'oeil', titre: "Vous décidez qui voit ce mur", desc: "Un réglage en bas de la page, réservé à l'administrateur : visible par toute l'équipe (par défaut) ou par l'administrateur seul. Les surfaces sont des données d'activité individuelle — le choix vous revient, et il se change à tout moment." }
  ] },
  { v: '5.55', items: [
    { emoji: 'livre', titre: "Une page à vous : « Ma trace »", desc: "Dix modules servent à piloter le domaine et aucun ne vous montrait votre propre travail. Depuis le bloc « Ma part du chantier », le lien « Ma trace » ouvre le bilan de votre campagne : la surface totale que vous avez travaillée, le détail par tâche, les parcelles où vous êtes intervenu et les personnes avec qui vous avez travaillé. Tout est en hectares — aucune heure, aucune rémunération n'apparaît sur cette page." },
    { emoji: 'lien', titre: "Rien n'est comparé entre collègues", desc: "La surface d'une parcelle se partage entre les personnes notées sur le chantier : une parcelle faite à trois compte pour un tiers à chacun. « Avec qui » compte des journées passées ensemble, pas des performances — aucun classement, aucun chiffre d'une personne mis en face de celui d'une autre." }
  ] },
  { v: '5.54', items: [
    { emoji: 'etoile', titre: "Vous ne vous voyiez nulle part dans l'avancement", desc: "L'accueil affichait l'avancement du domaine — jamais ce que vous y aviez fait, vous. Un nouveau bloc « Ma part du chantier » reprend la même barre et la coupe en deux : votre part en doré, celle du reste de l'équipe en vert, chacune en hectares. Le partage suit les intervenants notés au journal : une parcelle faite à trois compte pour un tiers à chacun. Rien n'est comparé entre collègues, et aucune heure n'apparaît là — ce sont des hectares." },
    { emoji: 'calendrier', titre: "Vous savez quand le chantier se termine", desc: "Sous la barre : les parcelles qui restent, leur surface, leurs noms, et une date de fin calculée sur la cadence des quinze derniers jours. Une date approximative vaut mieux qu'un pourcentage quand il s'agit de décider si on prend du renfort ou si on tient." },
    { emoji: 'engrenage', titre: "Le bloc se range comme les autres", desc: "Il apparaît en haut de l'accueil et suit les mêmes règles que les autres blocs : appui long pour le déplacer, le réduire ou le masquer. Le chantier affiché est celui sur lequel l'équipe a le plus travaillé ces quinze derniers jours ; les chantiers terminés laissent la place au suivant." }
  ] },
  { v: '5.53', items: [
    { emoji: 'valide', titre: "Valider une parcelle ne vous rendait rien", desc: "Vous validiez une parcelle, un bandeau vert passait deux secondes, et c'était tout. Le geste le plus fréquent de l'application — celui qu'on fait entre deux rangs, parfois vingt fois par semaine — était traité comme un simple accusé de réception. Désormais une fiche s'ouvre : la parcelle et sa surface, l'avancement du domaine qui bouge sous vos yeux, et ce qu'il reste. Sur les parcelles validées en un geste depuis la liste, le bandeau et son bouton « Annuler » restent inchangés tant que la parcelle n'est pas terminée : rien ne ralentit la validation à la chaîne." },
    { emoji: 'feuille', titre: "Vous savez enfin ce qu'il reste sur le chantier", desc: "Un pourcentage ne dit pas grand-chose quand on est dans les vignes. La fiche annonce le nombre de parcelles encore à faire, leur surface et leurs noms — et propose d'enchaîner directement sur la suivante, sans repasser par la liste. Trois parcelles nommées valent mieux que « 74 % »." },
    { emoji: 'drapeau', titre: "La fin d'un chantier se voit", desc: "Quand la dernière parcelle d'une tâche tombe, le domaine entier vient de passer — et jusqu'ici cela s'affichait exactement comme la première. La fiche devient un récapitulatif : la surface totale, le nombre de parcelles, le nombre de jours depuis le premier travail enregistré, et les personnes qui y ont participé. Cela n'arrive que cinq ou six fois dans une campagne." }
  ] },
  { v: '5.52', items: [
    { emoji: 'equipe', titre: "Les effectifs comptaient des gens partis", desc: "Le Pilotage ne regardait que la case « Actif » d\u2019une fiche, jamais la date de fin de contrat. Un saisonnier dont le contrat s\u2019\u00e9tait termin\u00e9 continuait donc d\u2019\u00eatre compt\u00e9 tant que personne ne le passait « Inactif » \u00e0 la main. Trois contrats finis suffisaient \u00e0 afficher sept personnes au lieu de quatre. Un membre n\u2019est d\u00e9sormais compt\u00e9 que s\u2019il est actif ET sous contrat \u00e0 la date que vous consultez \u2014 en archives, c\u2019est l\u2019\u00e9quipe de l\u2019\u00e9poque qui s\u2019affiche, pas celle d\u2019aujourd\u2019hui." },
    { emoji: 'sablier', titre: "Vos chantiers finissaient trop t\u00f4t sur le papier", desc: "Cette m\u00eame erreur remontait dans tout le module : les pr\u00e9sences du jour, le nombre de personnes au champ, le simulateur de journ\u00e9e, et surtout la cadence \u2014 avec cinq personnes compt\u00e9es au lieu de deux, l\u2019application tablait sur 35 heures par jour quand vous en faisiez 14, et annon\u00e7ait une fin de chantier deux fois et demie trop t\u00f4t. Le co\u00fbt du travail est touch\u00e9 lui aussi : le taux horaire moyen incluait les taux de gens qui ne travaillent plus." },
    { emoji: 'liste', titre: "Les contrats termin\u00e9s se voient enfin", desc: "Dans R\u00e9glages \u203a \u00c9quipe, une fiche encore « Active » dont le contrat est \u00e9chu porte maintenant une mention orange. Et sous la carte \u00c9quipe du Pilotage, le nombre de contrats termin\u00e9s est rappel\u00e9 \u2014 pour que la baisse d\u2019effectif s\u2019explique d\u2019elle-m\u00eame plut\u00f4t que de vous faire chercher o\u00f9 sont pass\u00e9s vos gens." }
  ] },
  { v: '5.51', items: [
    { emoji: 'equipe', titre: "Le simulateur d\u2019effectif conseillait n\u2019importe quoi", desc: "Il pouvait annoncer qu\u2019il vous fallait 15 personnes, tout en affichant juste \u00e0 c\u00f4t\u00e9 une cadence conseill\u00e9e de 4,2 \u2014 et le d\u00e9tail sous le graphique \u00e9tiquetait « le moins cher » quatorze lignes sur vingt et une. Trois causes : il rapportait toute la charge de la p\u00e9riode \u00e0 la fen\u00eatre d\u2019une seule t\u00e2che dat\u00e9e, il facturait les heures de vos permanents comme si vous ne les payiez pas d\u00e9j\u00e0, et il chiffrait le retard en pourcentage du co\u00fbt du travail. Il est remplac\u00e9 par « Renfort : combien, et quand », dans le nouvel onglet D\u00e9cider." },
    { emoji: 'calendrier', titre: "Le moment o\u00f9 vous prenez du renfort change le prix", desc: "Le nouvel \u00e9cran pose le travail semaine par semaine \u00e0 partir des fen\u00eatres que vous avez saisies. Ce qui n\u2019est pas absorb\u00e9 glisse sur la semaine suivante \u2014 et une t\u00e2che faite en retard devient plus longue, ce qui d\u00e9cale celle d\u2019apr\u00e8s. Vous dessinez votre renfort en cliquant dans les colonnes, et vous voyez trois choses d\u2019un coup : les semaines qui d\u00e9bordent, les gens pay\u00e9s pendant qu\u2019aucun travail n\u2019est ouvert, et ce que chaque strat\u00e9gie co\u00fbte. Les propositions qui ne bouclent pas la campagne ne sont plus pr\u00e9sent\u00e9es comme les moins ch\u00e8res : elles sont \u00e9cart\u00e9es." },
    { emoji: 'boussole', titre: "Le Pilotage se lit dans l\u2019ordre o\u00f9 l\u2019on travaille", desc: "Aujourd\u2019hui, Avancement, D\u00e9cider, \u00c9quipe, Cave, \u00c9conomie : o\u00f9 j\u2019en suis, ce qui vient, ce que je d\u00e9cide, avec qui, ce que \u00e7a co\u00fbte. La simulation \u00e9tait enterr\u00e9e dans le menu Outils alors que c\u2019est la seule page o\u00f9 l\u2019on arbitre quelque chose ; les Archives, qu\u2019on ouvre deux fois l\u2019an, y prennent sa place. Et le bouton « ? Aide » manquait \u00e0 ce module : sa fiche existait sans aucun moyen de l\u2019ouvrir." }
  ] },
  { v: '5.50', items: [
    { emoji: 'calculatrice', titre: "Les dur\u00e9es de chantier disaient toutes autre chose", desc: "Pour la m\u00eame charge et la m\u00eame \u00e9quipe, l\u2019ordre de passage annon\u00e7ait 39 jours, le simulateur de co\u00fbt 27 et le tableau de bord 44. Trois calculs s\u00e9par\u00e9s, trois d\u00e9finitions diff\u00e9rentes d\u2019une journ\u00e9e de travail : l\u2019un retirait la pause du temps de travail, l\u2019autre la passait sous silence, le troisi\u00e8me divisait par des jours ouvr\u00e9s. Tout part d\u00e9sormais d\u2019un seul calcul. La journ\u00e9e r\u00e9gl\u00e9e est du travail effectif \u2014 la pause s\u2019ajoute \u00e0 l\u2019amplitude, elle ne se soustrait plus \u00e0 l\u2019ouvrage." },
    { emoji: 'calendrier', titre: "La fen\u00eatre des t\u00e2ches est enfin respect\u00e9e", desc: "Vous pouviez inscrire que la vendange se fait du 26 ao\u00fbt au 6 septembre : le simulateur d\u2019effectif n\u2019en tenait aucun compte et raisonnait sur la campagne enti\u00e8re. Il pouvait donc conseiller un effectif qui vendange jusqu\u2019\u00e0 fin septembre sans jamais signaler le d\u00e9bordement. Les projections se calent maintenant sur vos dates, et sur un chantier comme la vendange elles comptent tous les jours, samedi et dimanche compris." },
    { emoji: 'chrono', titre: "Le retard ne cr\u00e9e plus de journ\u00e9es de travail", desc: "Le co\u00fbt de retard \u2014 une estimation de ce que vaut une vigne travaill\u00e9e trop tard \u2014 \u00e9tait ajout\u00e9 aux heures, qui rallongeaient le chantier, qui aggravait le retard. \u00c0 une personne, le simulateur affichait 156 jours l\u00e0 o\u00f9 le travail en demande 105. Les jours affich\u00e9s sont d\u00e9sormais les vrais, et le surco\u00fbt de retard appara\u00eet \u00e0 part : une heure estim\u00e9e et une heure pay\u00e9e ne sont pas de m\u00eame nature." },
    { emoji: 'calendrier', titre: "La fin pr\u00e9vue ne part plus du jour o\u00f9 vous regardez", desc: "La date de fin se projetait \u00e0 partir du jour de consultation, m\u00eame quand les travaux ne pouvaient pas commencer avant trois semaines : fin juillet, une vendange qui d\u00e9marre le 26 ao\u00fbt s\u2019affichait avec quatre jours d\u2019avance. La projection part maintenant de l\u2019ouverture de la fen\u00eatre." },
    { emoji: 'feuille', titre: "Le Pilotage retrouve les t\u00e2ches des p\u00e9riodes au nom libre", desc: "La charge et l\u2019ETP de la campagne cherchaient encore les t\u00e2ches d\u2019apr\u00e8s le premier mot du nom de la p\u00e9riode \u2014 l\u2019ancien fonctionnement, abandonn\u00e9 partout ailleurs. Une p\u00e9riode appel\u00e9e \u00ab Campagne 2026 \u00bb ne remontait donc aucune t\u00e2che : tableau de bord vide, frise vide, aucun ETP. Le Pilotage lit maintenant la liste de t\u00e2ches que vous avez d\u00e9finie pour la p\u00e9riode." }
  ] },
  { v: '5.49', items: [
    { emoji: 'calendrier', titre: 'La frise de la campagne dit enfin la v\u00e9rit\u00e9', desc: "Les mois \u00e9crits au-dessus de la frise \u00e9taient r\u00e9partis \u00e0 parts \u00e9gales et s\u2019arr\u00eataient au quatorzi\u00e8me. Sur une campagne qui s\u2019\u00e9tale sur dix-huit mois, l\u2019\u00e9chelle ne correspondait plus aux couleurs : une p\u00e9riode ouverte le 1er mars se lisait sous le libell\u00e9 de mai, et les derniers mois manquaient tout simplement. Chaque mois est d\u00e9sormais pos\u00e9 \u00e0 sa vraie place, avec un trait par mois et l\u2019ann\u00e9e rappel\u00e9e sur chaque janvier \u2014 sur une campagne \u00e0 cheval sur deux ann\u00e9es, deux \u00ab oct \u00bb ne se ressemblaient que trop." },
    { emoji: 'etincelles', titre: 'R\u00e9glages ne garde que les p\u00e9riodes qui servent', desc: "\u00c0 raison de quatre \u00e0 six p\u00e9riodes par an, la liste et la frise devenaient illisibles au bout de deux campagnes \u2014 et vous y cherchiez la p\u00e9riode en cours au milieu de celles d\u2019il y a deux ans. R\u00e9glages \u203a Campagne n\u2019affiche plus que les dix-huit derniers mois, plus tout ce qui est en cours ou \u00e0 venir. Rien n\u2019est supprim\u00e9 : un lien sous la liste emm\u00e8ne vers les archives. La p\u00e9riode active et celle que vous consultez restent visibles quoi qu\u2019il arrive." },
    { emoji: 'dossier', titre: 'Archives des campagnes', desc: "Le Pilotage gagne un onglet \u00ab Archives \u00bb. Toutes vos campagnes y sont empil\u00e9es sur un m\u00eame axe, du 1er ao\u00fbt au 31 juillet \u2014 de r\u00e9colte \u00e0 r\u00e9colte, pour que l\u2019hiver ne soit pas coup\u00e9 en deux par le 31 d\u00e9cembre. D\u2019une ligne \u00e0 l\u2019autre se lit le d\u00e9calage des travaux : est-ce qu\u2019on s\u2019y est pris plus t\u00f4t cette ann\u00e9e ? Les heures affich\u00e9es viennent des instantan\u00e9s pris \u00e0 la cl\u00f4ture de chaque campagne. La comparaison de deux saisons, jusqu\u2019ici cach\u00e9e derri\u00e8re un bouton des R\u00e9glages, a d\u00e9m\u00e9nag\u00e9 ici \u2014 et elle refonctionne quel que soit le nom de vos p\u00e9riodes : elle les rapproche par leur place dans l\u2019ann\u00e9e, plus par leur intitul\u00e9." }
  ] },
  { v: '5.48', items: [
    { emoji: 'epingle', titre: "L\u2019en-t\u00eate de chaque module reste en place", desc: "D\u00e8s qu\u2019on faisait d\u00e9filer un \u00e9cran, le bandeau du module partait vers le haut : le nom de la p\u00e9riode consult\u00e9e, les onglets et l\u2019aide disparaissaient, et il fallait remonter tout en haut rien que pour changer d\u2019onglet. L\u2019en-t\u00eate reste d\u00e9sormais fixe \u2014 seul le contenu d\u00e9file dessous. Deux g\u00eanes du m\u00eame ordre disparaissent avec lui : le bouton + ne d\u00e9rive plus avec la liste, et l\u2019\u00e9cran ne peut plus glisser de travers apr\u00e8s un changement de module." }
  ] },
  { v: '5.47', items: [
    { emoji: 'nuage', titre: 'La m\u00e9t\u00e9o revient en haut de l\u2019Accueil', desc: "Le temps qu\u2019il fait \u00e9tait calcul\u00e9 et tenu \u00e0 jour, mais plus rien ne l\u2019affichait en haut de l\u2019\u00e9cran : il fallait descendre jusqu\u2019\u00e0 la carte m\u00e9t\u00e9o pour le voir. La pastille est de retour sur la ligne de la p\u00e9riode \u2014 temp\u00e9rature et vent, d\u2019un coup d\u2019\u0153il, d\u00e8s l\u2019ouverture. Hors ligne, elle affiche la derni\u00e8re valeur connue en plus p\u00e2le." },
    { emoji: 'oeil', titre: 'La date de l\u2019en-t\u00eate \u00e9tait devenue illisible', desc: "Sur l\u2019Accueil, les Parcelles et le Journal, la date affich\u00e9e \u00e0 c\u00f4t\u00e9 de la p\u00e9riode \u00e9tait rest\u00e9e gris fonc\u00e9 sur le bandeau sombre \u2014 un reliquat d\u2019une ancienne version o\u00f9 ce bandeau \u00e9tait clair. Elle se lisait \u00e0 2,95 contre 4,5 exig\u00e9s. C\u2019est corrig\u00e9 sur les trois \u00e9crans." }
  ] },
  { v: '5.46', items: [
    { emoji: 'calendrier', titre: 'Votre ann\u00e9e se d\u00e9coupe comme vous la travaillez', desc: "L\u2019application imposait quatre saisons \u2014 Hiver, Printemps, \u00c9t\u00e9, Automne \u2014 et d\u00e9duisait les travaux \u00e0 faire du premier mot du nom de la saison. Un domaine qui parle d\u2019une saison de taille et d\u2019une saison verte, ou qui nomme sa campagne autrement, se retrouvait avec un \u00e9cran vide sans comprendre pourquoi. Ce d\u00e9coupage dispara\u00eet. Vous cr\u00e9ez d\u00e9sormais des p\u00e9riodes : un nom libre, une date de d\u00e9but, une date de fin, et la liste des travaux qui s\u2019y font. Deux p\u00e9riodes, quatre, ou six : c\u2019est le v\u00f4tre. R\u00e9glages \u203a Domaine \u203a Campagne." },
    { emoji: 'calendrier', titre: 'La frise de la campagne', desc: "En haut des R\u00e9glages, une frise montre l\u2019ann\u00e9e enti\u00e8re : vos p\u00e9riodes en couleur, le trait du jour, et surtout ce qui manque. Un intervalle que plus aucune p\u00e9riode ne couvre appara\u00eet hachur\u00e9 avec ses dates \u2014 une saisie tomb\u00e9e l\u00e0 ne se rattache \u00e0 rien. Deux p\u00e9riodes qui se recouvrent sont cercl\u00e9es de rouge, avec la r\u00e8gle appliqu\u00e9e \u00e9crite en clair. Une p\u00e9riode se renomme sans rien perdre : l\u2019avancement d\u00e9j\u00e0 enregistr\u00e9 la suit." },
    { emoji: 'journal', titre: 'Le journal ne masque plus aucune t\u00e2che', desc: "La liste des t\u00e2ches du journal suivait la saison en cours : une taille dat\u00e9e de f\u00e9vrier \u00e9tait tout simplement introuvable pendant la saison verte. Elle suit maintenant la <b>date que vous saisissez</b>. Les travaux de la p\u00e9riode qui contient cette date arrivent en t\u00eate, tous les autres restent accessibles juste en dessous. Plus rien n\u2019est cach\u00e9." }
  ] },
  { v: '5.45', items: [
    { emoji: 'eclair', titre: 'Une aide sur chaque \u00e9cran', desc: "L\u2019aide et le signalement d\u2019un probl\u00e8me n\u2019existaient qu\u2019au fond des R\u00e9glages : personne n\u2019allait les y chercher depuis le module o\u00f9 le doute venait de na\u00eetre. Chaque \u00e9cran porte d\u00e9sormais une pastille \u00ab ? Aide \u00bb, \u00e0 droite de la ligne de la saison. Elle ouvre l\u2019essentiel du module en quelques lignes \u2014 ce que font les onglets, ce qui se calcule tout seul, ce qui est r\u00e9serv\u00e9 aux administrateurs \u2014 avec le guide complet \u00e0 un geste, et le signalement d\u2019un probl\u00e8me juste \u00e0 c\u00f4t\u00e9. Le signalement part avec l\u2019\u00e9cran depuis lequel il a \u00e9t\u00e9 envoy\u00e9 : plus besoin de raconter o\u00f9 vous \u00e9tiez." }
  ] },
  { v: '5.44', items: [
    { emoji: 'euro', titre: 'Le co\u00fbt d\u2019une parcelle, en euros comme \u00e0 l\u2019hectare', desc: "Le tableau Pilotage \u203a \u00c9conomie n\u2019affichait qu\u2019un co\u00fbt \u00e0 l\u2019hectare. Comme le budget d\u2019une saison se calcule justement en heures par hectare, ce chiffre \u00e9tait rigoureusement le m\u00eame sur toutes les parcelles : rien \u00e0 y comparer. Chaque ligne porte d\u00e9sormais les deux montants \u2014 ce que co\u00fbte la parcelle enti\u00e8re, et ce qu\u2019elle co\u00fbte \u00e0 l\u2019hectare \u2014 et un bouton choisit lequel s\u2019affiche en grand et sert au tri. Le total dit o\u00f9 part l\u2019argent ; l\u2019hectare dit ce qu\u2019une parcelle a de particulier : des plants \u00e0 remplacer, une t\u00e2che en plus, davantage de r\u00e9parations." },
    { emoji: 'outil', titre: 'La plantation se compte au plant, plus \u00e0 l\u2019hectare', desc: "L\u2019entreplantation se mesure au nombre de trous faits \u00e0 la tari\u00e8re. Le tableau des co\u00fbts, lui, appliquait une estimation de quinze heures par hectare \u00e0 toutes les parcelles, y compris celles o\u00f9 il n\u2019y a rien \u00e0 replanter \u2014 pendant que l\u2019avancement des travaux, au m\u00eame moment, comptait bien z\u00e9ro. C\u2019est corrig\u00e9 : sans trou renseign\u00e9, aucune heure n\u2019est compt\u00e9e. L\u00e0 o\u00f9 il y en a, la ligne de la parcelle affiche le nombre de plants et ce qu\u2019ils co\u00fbtent, avec le prix d\u2019un plant rappel\u00e9 en haut du tableau. Vos co\u00fbts vont baisser : ils sont simplement devenus justes." },
    { emoji: 'liste', titre: 'Ajouter une t\u00e2che : les deux chemins c\u00f4te \u00e0 c\u00f4te', desc: "Le bar\u00e8me de la convention \u00e9tait un bandeau en t\u00eate de la liste des t\u00e2ches, le bouton de cr\u00e9ation tout en bas : deux gestes \u00e9loign\u00e9s pour une m\u00eame intention. Ils sont maintenant r\u00e9unis sous la liste, dans R\u00e9glages \u203a Vigne. \u00ab Nouvelle t\u00e2che selon le bar\u00e8me de la convention \u00bb part des travaux officiels et de leurs heures de r\u00e9f\u00e9rence ; \u00ab Nouvelle t\u00e2che libre \u00bb cr\u00e9e la v\u00f4tre de bout en bout." }
  ] },
  { v: '5.43', items: [
    { emoji: 'oeil', titre: 'Chaque personne ne voit que ses modules', desc: "La barre du bas proposait les m\u00eames modules \u00e0 toute l\u2019\u00e9quipe. Vous pouvez d\u00e9sormais masquer, personne par personne, ceux qui ne la concernent pas \u2014 dans R\u00e9glages \u203a \u00c9quipe, en ouvrant sa fiche : un caviste n\u2019a que faire de l\u2019avancement des vignes, un ouvrier n\u2019a rien \u00e0 faire dans la cave. Quatre boutons posent une combinaison courante d\u2019un seul geste, Tout \u00b7 Vigne \u00b7 Tracteur \u00b7 Cave, et vous ajustez ensuite case par case. Le changement s\u2019applique \u00e0 la prochaine ouverture de la personne concern\u00e9e. Il s\u2019agit d\u2019all\u00e9ger l\u2019\u00e9cran, pas de prot\u00e9ger une donn\u00e9e\u202f: ce sont les r\u00f4les qui d\u00e9cident de ce que chacun peut modifier, et les R\u00e9glages restent accessibles \u00e0 tous." }
  ] },
  { v: '5.42', items: [
    { emoji: 'calculatrice', titre: 'Vos heures report\u00e9es comptent enfin dans le compteur', desc: "Le solde de d\u00e9part \u2014 les heures acquises avant Ma Vigne, que vous saisissez une fois par salari\u00e9 \u2014 s\u2019affichait bien dans la fiche, mais le compteur l\u2019ignorait : impossible de payer ou de faire r\u00e9cup\u00e9rer ces heures-l\u00e0. Un salari\u00e9 arriv\u00e9 avec quarante heures en r\u00e9serve, et sans heure suppl\u00e9mentaire depuis, se voyait refuser toute saisie de paiement sans la moindre explication. Ce report est d\u00e9sormais la ligne la plus ancienne du compteur : c\u2019est lui qui part en premier quand une heure est r\u00e9cup\u00e9r\u00e9e ou pay\u00e9e. Cons\u00e9quence visible dans la fiche salari\u00e9 : le \u00ab Compteur \u00bb et le solde net de l\u2019ann\u00e9e affichent maintenant le m\u00eame chiffre." },
    { emoji: 'document', titre: 'Le nombre de jours travaill\u00e9s sur le relev\u00e9 d\u2019heures', desc: "Le relev\u00e9 PDF d\u2019un salari\u00e9 indique maintenant, \u00e0 c\u00f4t\u00e9 des heures, le nombre de jours r\u00e9ellement travaill\u00e9s dans le mois \u2014 le chiffre que r\u00e9clame la MSA pour les saisonniers. Un jour compte d\u00e8s qu\u2019il a \u00e9t\u00e9 travaill\u00e9, quelle que soit sa dur\u00e9e ; les cong\u00e9s, les r\u00e9cup\u00e9rations et les absences n\u2019en sont pas. Un samedi ou un jour f\u00e9ri\u00e9 r\u00e9ellement travaill\u00e9 compte, lui, normalement." },
    { emoji: 'liste', titre: 'Le bar\u00e8me de la convention, et vos t\u00e2ches rattach\u00e9es', desc: "Les travaux de la vigne et leurs heures \u00e0 l\u2019hectare de r\u00e9f\u00e9rence se consultent d\u00e9sormais depuis R\u00e9glages \u203a Saisons, en haut de la liste des t\u00e2ches : le cycle complet, les travaux compl\u00e9mentaires, et pour chacun les t\u00e2ches de votre domaine qui s\u2019y rattachent. Surtout, une t\u00e2che que vous aviez cr\u00e9\u00e9e vous-m\u00eame portait la mention \u00ab Hors convention \u00bb sans aucun recours. Touchez cette mention : vous choisissez le travail conventionnel auquel elle correspond. Votre t\u00e2che garde son nom, ses saisons et ses heures \u00e0 l\u2019hectare \u2014 le rattachement sert de rep\u00e8re, il ne la remplace pas." }
  ] },
  { v: '5.41', items: [
    { emoji: 'chrono', titre: 'Vos heures se comptent maintenant \u00e0 l\u2019ann\u00e9e', desc: "L\u2019onglet \u00ab H. sup \u00bb de la fiche salari\u00e9 devient \u00ab Compteur \u00bb. Il raisonnait mois par mois, avec des heures qui disparaissaient au bout de trois mois. Le d\u00e9compte suit d\u00e9sormais l\u2019ann\u00e9e compl\u00e8te : un plafond annuel \u2014 1607 heures pour un temps plein, proratis\u00e9 pour un contrat plus court \u2014 et le cumul des heures r\u00e9ellement travaill\u00e9es en face. Plus rien ne p\u00e9rime en cours d\u2019ann\u00e9e, le solde se r\u00e8gle \u00e0 la cl\u00f4ture du 31 d\u00e9cembre. Une seconde jauge suit les heures faites au-del\u00e0 de 35 heures dans une semaine, face au plafond de 250 heures par an de l\u2019accord agricole. Le d\u00e9tail mois par mois reste \u00e0 sa place, \u00e0 l\u2019\u00e9cran comme sur le relev\u00e9 PDF." },
    { emoji: 'soleil', titre: 'Un jour de cong\u00e9 n\u2019est plus une heure travaill\u00e9e', desc: "La journ\u00e9e reste pay\u00e9e exactement comme avant, rien ne change sur la paie. En revanche elle ne compte plus comme du temps de travail dans les compteurs \u2014 c\u2019est la r\u00e8gle. Une semaine avec un jour de cong\u00e9 ne peut donc plus d\u00e9clencher une alerte de d\u00e9passement, et les cong\u00e9s ne remplissent plus le compteur annuel, puisque les 1607 heures sont d\u00e9j\u00e0 calcul\u00e9es cong\u00e9s d\u00e9duits. Vous verrez des totaux plus bas qu\u2019avant sur le cadre l\u00e9gal : ce sont les bons." },
    { emoji: 'pansement', titre: 'Chaque absence a maintenant son motif', desc: "Une absence se notait par une case et un commentaire libre. Elle se choisit d\u00e9sormais parmi sept motifs, et chacun affiche son effet en clair au moment o\u00f9 vous le s\u00e9lectionnez. Un arr\u00eat de travail abaisse le plafond annuel du salari\u00e9 : ses heures ne sont pas \u00e0 rattraper. Une formation compte comme du travail effectif. Un retard se saisit en heures et non en journ\u00e9e. Vos absences d\u00e9j\u00e0 enregistr\u00e9es gardent leur comportement actuel tant que vous ne leur donnez pas de motif." },
    { emoji: 'soleil', titre: 'Le solde de cong\u00e9s suit votre p\u00e9riode de r\u00e9f\u00e9rence', desc: "Le compteur de jours pris additionnait tous les cong\u00e9s jamais enregistr\u00e9s, toutes ann\u00e9es confondues : un salari\u00e9 pr\u00e9sent depuis deux ans voyait un solde faux. Il se limite maintenant \u00e0 la p\u00e9riode en cours, du 1er juin au 31 mai. Si la v\u00f4tre suit l\u2019ann\u00e9e civile, cela se r\u00e8gle dans la fiche salari\u00e9, onglet Cong\u00e9s." },
    { emoji: 'engrenage', titre: 'Les r\u00e8gles de votre domaine', desc: "Ce que deviennent les heures faites au-del\u00e0 du planning du mois \u2014 pay\u00e9es en acompte, r\u00e9cup\u00e9r\u00e9es en repos, ou report\u00e9es \u00e0 la cl\u00f4ture \u2014 se choisit dans Planning \u203a Le cadre, avec la dur\u00e9e annuelle et le plafond de modulation si votre accord en fixe d\u2019autres." }
  ] },
  { v: '5.40', items: [
    { emoji: 'boussole', titre: 'Une seule façon de naviguer, partout', desc: "Chaque module était construit à sa manière : les onglets tantôt en haut, tantôt en bas, des en-têtes de hauteurs différentes, des piles de boutons qui variaient d'un écran à l'autre. Tout suit désormais la même anatomie : le nom du module et la saison en haut, les onglets juste en dessous — toujours au même endroit, toujours de la même hauteur — puis les chiffres clés, puis le contenu. Vous n'avez plus à réapprendre chaque écran : ce que vous savez faire dans un module se retrouve à l'identique dans les autres. Rien n'a changé dans vos données ni dans vos réglages." },
    { emoji: 'eprouvette', titre: 'Le phyto a son propre module', desc: "Le registre des traitements et le catalogue E-Phy étaient cachés dans un onglet du module Tracteur, ce qui n'allait pas de soi quand on cherchait simplement à noter une pulvérisation. Le phyto devient un module à part entière, avec son entrée dédiée dans la barre du bas. Registre et catalogue sont maintenant deux onglets en haut de l'écran, et le bouton « nouveau traitement » est le gros bouton rond en bas à droite, comme ailleurs. Le Tracteur, lui, se concentre sur ce qu'il fait de mieux : les sessions et l'entretien." },
    { emoji: 'verre', titre: 'La Cave va droit au but', desc: "Il fallait d'abord passer par un écran de sélection pour choisir entre « Vendange » et « Élevage » avant d'atteindre quoi que ce soit. Cet écran disparaît : Le Chai et Le Cuvier sont devenus deux onglets, vous arrivez directement dans le chai. Au passage, un défaut d'affichage est corrigé — deux en-têtes se superposaient, affichant deux fois le nom du domaine et deux fois la date." },
    { emoji: 'graphique', titre: 'Le Pilotage passe de neuf onglets à cinq', desc: "Neuf onglets, c'était trop pour s'y retrouver. « Personnel » et « Matériel » n'en font plus qu'un, « Économie » et « Conformité » également, et les deux écrans que l'on ouvre rarement — la simulation et le paramétrage — se rangent derrière un bouton « Outils » en bout de barre. L'onglet sur lequel vous étiez resté et les indicateurs que vous aviez décochés sont conservés." }
  ] },
  { v: '5.39', items: [
    { emoji: 'euro', titre: 'Un taux horaire par salari\u00e9', desc: "Le co\u00fbt du travail ne se r\u00e8gle plus par cat\u00e9gorie de contrat mais personne par personne. Ouvrez la fiche d\u2019un salari\u00e9 dans R\u00e9glages \u203a \u00c9quipe : un champ \u00ab Taux horaire charg\u00e9 \u00bb y attend son co\u00fbt employeur r\u00e9el, \u00e0 renseigner \u00e0 l\u2019embauche ou plus tard, et \u00e0 modifier d\u2019un geste en cas d\u2019augmentation \u2014 l\u2019application garde la trace du changement. Le co\u00fbt \u00e0 l\u2019hectare du tableau de bord Pilotage s\u2019appuie d\u00e9sormais sur ces taux r\u00e9els. Ces montants vivent dans un espace \u00e0 part, lisible des seuls administrateurs : aucun salari\u00e9 ne peut voir la r\u00e9mun\u00e9ration d\u2019un coll\u00e8gue." },
    { emoji: 'barrique', titre: 'Le prix du GNR se note \u00e0 la livraison', desc: "Nouvelle action \u00ab Appoint de cuve \u00bb dans Tracteur \u203a Entretien : \u00e0 chaque remplissage de la cuve du domaine, indiquez les litres livr\u00e9s, le prix au litre, la date et le fournisseur. Le niveau de la cuve remonte automatiquement et le prix du carburant se met \u00e0 jour tout seul \u2014 en moyenne pond\u00e9r\u00e9e sur vos appoints, donc au plus pr\u00e8s de ce que vous payez vraiment. Fini le prix du GNR \u00e0 saisir \u00e0 la main dans les r\u00e9glages : il se note l\u00e0 o\u00f9 vous avez la facture sous les yeux. R\u00e9serv\u00e9 \u00e0 l\u2019administrateur." },
    { emoji: 'tracteur', titre: 'Un onglet Tracteur dans les R\u00e9glages', desc: "Le parc de tracteurs et les activit\u00e9s tracteur \u00e9taient rang\u00e9s dans l\u2019onglet \u00ab \u00c9quipe \u00bb, o\u00f9 personne ne pensait \u00e0 les chercher. Ils ont maintenant leur propre onglet \u00ab Tracteur \u00bb." }
  ] },
  { v: '5.38', items: [
    { emoji: 'euro', titre: 'Le coût de chaque parcelle, en euros', desc: "Le tableau de bord Pilotage gagne un onglet « Économie ». Pour chaque parcelle, il affiche son coût à l’hectare : la main-d’œuvre (heures de vigne au barème + heures de tracteur réalisées, à votre taux horaire), le carburant GNR estimé, et les produits phyto. Les parcelles sont classées de la plus coûteuse à la moins coûteuse — de quoi repérer d’un coup d’œil celles qui pèsent le plus. Pour l’activer, renseignez dans Réglages › Domaine un taux horaire par type de contrat et le prix du litre de GNR. Le coût phyto se calcule tout seul à partir des doses de vos traitements et du prix unitaire des intrants saisi dans La Réserve. En lecture seule, réservé aux profils administrateur et pilotage." },
    { emoji: 'bouclier', titre: 'Votre conformité réglementaire en direct', desc: "Toujours dans Pilotage, un onglet « Conformité » réunit trois suivis longtemps calculés en coulisse, enfin visibles au même endroit. Le cuivre : le cumul de cuivre métal sur 7 ans de chaque parcelle face au plafond bio de 28 kg/ha, avec un code couleur qui signale les dépassements. Les passages phyto : le nombre d’interventions par parcelle sur la saison, comparé à une référence régionale que vous ajustez dans Réglages. Et le délai de rentrée (DRE) : après un traitement, les parcelles où l’entrée reste interdite, avec l’heure exacte à laquelle elles redeviennent accessibles." }
  ] },
  { v: '5.37', items: [
    { emoji: 'loupe', titre: 'Lire plus facilement, même en plein soleil', desc: "Deux améliorations pour la lisibilité en extérieur. D'abord, le pincer-pour-zoomer est réactivé partout dans l'application : écartez deux doigts pour agrandir un petit texte, un tableau ou la carte — rien n'est verrouillé, c'est vous qui choisissez la taille. Ensuite, le mode « Plein soleil » (contraste renforcé pour l'extérieur) retrouve son accès dans Réglages › Moilication, d'un simple appui." },
    { emoji: 'nombre', titre: 'Les fenêtres se ferment au clavier', desc: "Sur ordinateur, la touche Échap referme n'importe quelle fenêtre ouverte ; le focus reste à l'intérieur de la fenêtre (fini le saut inattendu vers l'arrière-plan) puis revient à sa place à la fermeture. Les lecteurs d'écran annoncent désormais correctement l'ouverture d'une fenêtre." },
    { emoji: 'eclair', titre: 'Des écrans plus rapides', desc: "L'application démarre plus vite : la carte n'est plus chargée qu'au moment où vous l'ouvrez (Parcelles ou Pilotage), au lieu de peser sur chaque démarrage — y compris l'écran de connexion. Et pendant qu'un module se remplit, une trame de chargement remplace l'écran blanc, pour une attente plus douce." },
    { emoji: 'doigt', titre: 'Mieux installée sur votre téléphone', desc: "Quelques réglages internes améliorent le comportement de Ma Vigne quand elle est installée sur l'écran d'accueil de votre téléphone, et renforcent la redirection vers le domaine officiel de l'application." }
  ] },
  { v: '5.36', items: [
    { emoji: 'microscope', titre: 'Suivre la maturité du raisin, parcelle par parcelle', desc: "Un nouvel onglet « Analyses » ouvre la marche dans Cave › Vendange (Le Cuvier). Avant les vendanges, relevez la maturité de chaque parcelle : saisissez au choix le sucre en g/L ou le degré potentiel en %vol — l'application convertit l'un en l'autre (degré = sucre ÷ 16,83) et affiche l'estimation alcoolique en direct. Chaque parcelle conserve l'historique de ses mesures et trace sa courbe d'évolution, pour choisir le meilleur moment de récolte d'un coup d'œil. Au passage, les onglets du Cuvier suivent désormais l'ordre du travail : Analyses, Récoltes, puis Cuvier." },
    { emoji: 'bouteille', titre: 'Mettre vos cuvées en bouteille', desc: "Le Chai (Cave › Élevage) gagne un onglet « Bouteilles ». Quand une cuvée est prête, l'application propose un nombre de bouteilles calculé sur le volume élevé — ajustable au chiffre réel —, puis la cuvée quitte le chai et rejoint votre stock. Ce stock s'archive par millésime, avec le nombre exact de bouteilles par cuvée, modifiable à tout moment. Et pour chaque cuvée embouteillée, un graphique retrace la perte de volume tout au long de la chaîne — de la récolte à la cuve, puis à l'élevage et enfin à la bouteille — dès que ces étapes sont renseignées." },
    { emoji: 'dossier', titre: 'Trier vos cuvées par millésime', desc: "Quand plusieurs millésimes cohabitent dans le chai, des filtres apparaissent au-dessus de vos cuvées : d'un geste, n'affichez que le dernier millésime, un plus ancien, ou l'ensemble." }
  ] },
  { v: '5.35', items: [
    { emoji: 'document', titre: 'Votre contrat rempli et signé, à télécharger', desc: "Quand vous acceptez les CGU et le DPA à la première ouverture de votre domaine, vos deux documents se remplissent désormais automatiquement avec les coordonnées de votre exploitation — raison sociale, SIRET, adresse et signataire. L’écran de fin vous propose de télécharger l’exemplaire signé de chacun (date, référence et empreinte de sécurité SHA-256), que vous retrouvez à tout moment dans Réglages › CGU & Mentions légales, avec un bouton « Imprimer / Enregistrer en PDF ». Et avant de signer, les liens « Lire » affichent désormais un aperçu déjà rempli à vos informations." }
  ] },
  { v: '5.34', items: [
    { emoji: 'carton', titre: 'La Réserve : vos fûts et vos stocks d’intrants', desc: "Un nouveau module « La Réserve » fait son entrée dans la barre du bas. Il réunit l’inventaire de vos fûts — fournisseur, référence, millésime et quantité, avec des listes déroulantes qui se remplissent au fil de vos saisies — et le suivi du stock de vos intrants (phyto et œno). Enregistrez vos achats et votre inventaire d’ouverture, et l’application calcule toute seule ce qu’il vous reste : entrées − consommé = stock. Pour l’œno, le consommé se déduit directement des opérations de la cave ; pour le phyto, du registre. Nouveauté : les intrants phyto se choisissent directement dans le catalogue officiel E-Phy (ANSES), leur numéro d’AMM conservé pour le contrôle. Un bilan matière prêt à présenter au contrôle bio (règlement UE 2021/771) est exportable en PDF." }
  ] },
  { v: '5.33', items: [] },
  { v: '5.32', items: [
    { emoji: 'cle', titre: 'Chacun son mot de passe', desc: "Jusqu\u2019ici tous les comptes partageaient le m\u00eame mot de passe, et le bouton \u00ab Changer mon mot de passe \u00bb ne fonctionnait pas \u2014 impossible d\u2019en sortir, m\u00eame en le voulant. C\u2019est corrig\u00e9. Chaque nouveau compte re\u00e7oit d\u00e9sormais un mot de passe unique et facile \u00e0 dire (par exemple \u00ab cave-rouge-427 \u00bb), affich\u00e9 une seule fois \u00e0 l\u2019administrateur au moment de la cr\u00e9ation. La personne le tape \u00e0 sa premi\u00e8re connexion, choisit imm\u00e9diatement le sien, et personne d\u2019autre ne le conna\u00eet \u2014 pas m\u00eame son responsable." },
    { emoji: 'rotation', titre: 'D\u00e9panner quelqu\u2019un qui a oubli\u00e9 le sien', desc: "Sur la fiche d\u2019un membre (R\u00e9glages \u203a Membres), un bouton \u00ab R\u00e9initialiser le mot de passe \u00bb g\u00e9n\u00e8re un nouveau mot de passe provisoire, affich\u00e9 une seule fois. Vous le communiquez \u00e0 la personne, qui choisit le sien \u00e0 la connexion suivante. Aucune adresse e-mail n\u2019est n\u00e9cessaire \u2014 pratique pour les saisonniers, qui n\u2019en ont pas. Les administrateurs, eux, doivent avoir une vraie adresse : c\u2019est leur seul moyen de r\u00e9cup\u00e9rer leur acc\u00e8s, puisque personne n\u2019est au-dessus d\u2019eux pour les d\u00e9panner." }
  ] },
  { v: '5.31', items: [
    { emoji: 'balance', titre: 'Des en-t\u00eates enfin align\u00e9s', desc: "Le bandeau sombre du haut a d\u00e9sormais exactement la m\u00eame hauteur sur tous les modules \u2014 Vigne, Tracteur, Cave, Planning, R\u00e9glages : plus aucun saut en passant de l\u2019un \u00e0 l\u2019autre, et le titre d\u00e9marre toujours au m\u00eame endroit. Le rappel \u00ab Ma Vigne \u00bb, qui n\u2019apparaissait que sur les pages Vigne et cr\u00e9ait le d\u00e9calage, laisse la place au contenu. En \u00e9change, la barre \u00ab saison \u00b7 date \u00bb descend sur tous les modules : vous savez en permanence quelle saison vous consultez, o\u00f9 que vous soyez dans l\u2019application. Cave et Le Chai gagnent leur tuile d\u2019ic\u00f4ne et voient leurs boutons regroup\u00e9s \u00e0 droite, comme partout ailleurs." }
  ] },
  { v: '5.30', items: [
    { emoji: 'etincelles', titre: 'Interface repens\u00e9e', desc: "Toute l\u2019application parle d\u00e9sormais le m\u00eame langage visuel. Les en-t\u00eates de chaque module \u2014 Vigne, Parcelles, Journal, Tracteur, Cave, Planning, Pilotage, R\u00e9glages \u2014 ont maintenant exactement la m\u00eame hauteur : plus de d\u00e9calage en passant de l\u2019un \u00e0 l\u2019autre. Chacun est soulign\u00e9 du m\u00eame filet terre \u2192 or \u2192 vert et porte son ic\u00f4ne dans une tuile aux couleurs du module. Les compteurs qui vivaient dans le bandeau sombre sont descendus sur des cartes claires, plus lisibles en plein soleil. Les listes \u2014 parcelles, journal, sessions tracteur \u2014 adoptent la carte \u00ab papier \u00bb : une bande de couleur sur le c\u00f4t\u00e9 donne l\u2019\u00e9tat d\u2019un coup d\u2019\u0153il, vert termin\u00e9, or bien avanc\u00e9, rouge en retard. Les noms de parcelles, de cuv\u00e9es et d\u2019activit\u00e9s passent en Cormorant, et les jauges, plus \u00e9paisses, se remplissent en douceur \u00e0 l\u2019ouverture. Au passage, plusieurs textes trop p\u00e2les pour \u00eatre lus \u2014 badges \u00ab Valid\u00e9 \u00bb, \u00ab S\u00e9lectionner une section \u00bb \u2014 ont retrouv\u00e9 un contraste correct." }
  ] },
  { v: '5.29', items: [] },
  { v: '5.28', items: [] },
  { v: '5.27', items: [] },
  { v: '5.26', items: [] },
  { v: '5.25', items: [
    { emoji: 'soleil', titre: 'Poser des congés sur une période', desc: "Dans Planning › Outils, un nouvel outil « Poser des congés » permet de poser des CP sur toute une période en une fois, pour un ou plusieurs salariés à la fois — pratique quand l’équipe part en même temps. Choisissez les dates de début et de fin, cochez les salariés concernés, et l’aperçu vous montre le nombre de jours décomptés pour chacun (selon votre mode de décompte, jours ouvrables ou ouvrés). Les dimanches et jours fériés ne sont jamais décomptés. Un bouton « Retirer » efface les congés de la période si besoin." }
  ] },
  { v: '5.24', items: [
    { emoji: 'chrono', titre: 'Chronométrer le temps de travail au tracteur', desc: "Dans une session tracteur, vous pouvez désormais mesurer le temps réel passé, parcelle par parcelle. Démarrez le chrono, cochez les parcelles pendant qu’il tourne (elles se partagent le temps, réparti à la surface), mettez en pause au besoin, puis arrêtez : chaque parcelle reçoit son temps mesuré. C’est optionnel — sans chrono, le barème habituel s’applique — et à activer dans Réglages › Activités tracteur. L’avancement d’une session reste calculé en hectares ; le temps mesuré alimente en plus le Rapport de saison et le Pilotage, au plus près du terrain." }
  ] },
  { v: '5.23', items: [
    { emoji: 'raisin', titre: 'Le Cuvier : les vendanges de A à Z', desc: "L’onglet Cave › Vendange fait peau neuve. Pesez vos récoltes en caisses (le poids se convertit en kilos et en hectolitres estimés selon votre rendement), suivez chaque cuve de vinification avec sa courbe de fermentation, et enregistrez vos opérations : chaptalisation — le nombre de kilos de sucre est calculé d’après le volume et le degré visé —, refroidissement, saignée, levurage, nutriment… La densité relevée est automatiquement ramenée à 20 °C, pour un degré potentiel juste quelle que soit la température du moût." },
    { emoji: 'verre', titre: 'Vendre en vrac, ou passer la cuvée en élevage', desc: "Une parcelle part chez un client ? Indiquez-le (avec son propre poids de caisse) et la récolte est comptée en vente vrac. Et une fois la cuvaison terminée, le bouton « Décuver » crée directement la cuvée dans Le Chai avec ses barriques — le suivi d’ouillage démarre tout seul." }
  ] },
  { v: '5.22', items: [
    { emoji: 'chrono', titre: 'Modifier les heures d’un coup sur plusieurs jours', desc: "Dans la grille d’équipe, la sélection multiple permet maintenant de fixer un horaire (prise et fin de service, avec ou sans pause déjeuner) et de l’appliquer à tous les jours cochés en une seule fois. Pratique pour caler la semaine de toute l’équipe, ou une journée de vendanges un samedi. Les congés, absences et récupérations compris dans la sélection sont préservés." }
  ] },
  { v: '5.21', items: [
    { emoji: 'balance', titre: 'Rapport de saison : où va le temps de l’équipe', desc: "La section Heures du rapport montre désormais comment se répartit la présence de l’équipe : travaux vigne (au barème), tracteur et autres activités (cave, trajets, entretien…), avec l’ETP nécessaire pour chaque poste. L’avancement vigne et l’« ETP vigne » (nombre d’équivalents temps plein pour les seuls travaux de la vigne) sont mis en avant. Le tracteur reste fondu dans « autres » tant qu’aucun barème d’heures par hectare n’est renseigné." }
  ] },
  { v: '5.20', items: [
    { emoji: 'document', titre: 'Rapport de saison enrichi, au choix de la saison', desc: "Le rapport PDF de saison couvre désormais toute la campagne : avancement par tâche et par parcelle (avec dates de validation), sessions tracteur, parc et fiches d’entretien, incidents et réparations, réparations de palissage, registre phyto, conformité cuivre bio et heures/ETP. Un seul bouton dans Réglages, et vous choisissez la saison à éditer — active ou passée. Les heures de chaque saison sont désormais mémorisées séparément." }
  ] },
  { v: '5.19', items: [
    { emoji: 'pansement', titre: 'Reconstruire l’avancement d’une saison passée', desc: "Un travail validé cet hiver figure déjà dans le journal, mais l’avancement de cette saison affiche encore 0 % ? Le bouton « Reconstruire l’avancement d’après le journal » (Réglages › Saisons) reconstitue l’avancement de la saison consultée à partir des validations du journal, sur sa période. Un récapitulatif est proposé avant d’appliquer, et rien n’est jamais supprimé." },
    { emoji: 'calendrier', titre: 'Consultation de saison plus lisible', desc: "Quand vous consultez une autre saison que l’active, l’accueil, la carte d’avancement et les onglets Parcelles et Journal affichent désormais la saison consultée (et non l’active) — seule la pastille conserve la mention « consultée »." }
  ] },
  { v: '5.18', items: [
    { emoji: 'info', titre: 'Budget cuivre en direct dans le traitement', desc: "Lors d'une saisie de traitement au cuivre, l'assistant affiche pour chaque parcelle traitée le cumul de cuivre métal sur 7 ans face au plafond bio de 28 kg/ha — cumul actuel + apport de ce traitement. Un dépassement est signalé, mais n'empêche jamais l'enregistrement (le registre doit refléter la réalité). Le calcul est exactement celui de votre synthèse cuivre dans Réglages." }
  ] },
  { v: '5.17', items: [
    { emoji: 'ajout', titre: 'Ajouter : session ou traitement', desc: "Le bouton + de l'onglet Tracteur propose maintenant un choix — démarrer une session mécanique, ou saisir un traitement phytosanitaire (qui ouvre l'assistant réglementaire avec les produits E-Phy). Un seul point d'entrée pour les deux." }
  ] },
  { v: '5.16', items: [
    { emoji: 'tracteur', titre: 'Module Tracteur repensé', desc: "L'onglet Tracteur fait peau neuve : le chantier en cours s'affiche désormais en grande carte « live » — avancement en hectares et bouton pour enregistrer directement. Le parc devient une bande de cartes où chaque machine indique d'un coup d'œil sa prochaine révision ou son passage au garage (touchez-la pour ouvrir son entretien). L'ensemble adopte le filet doré du domaine et un accent vert sur les sessions terminées." }
  ] },
  { v: '5.15', items: [] },
  { v: '5.14', items: [] },
  { v: '5.13', items: [] },
  { v: '5.12', items: [
    { emoji: 'verre', titre: "Cave › Élevage repensé", desc: "L'onglet Cave › Élevage fait peau neuve. Un en-tête « Le Chai » résume l'état du chai d'un coup d'œil (cuvées, fûts, hectolitres, ouillages en retard), et chaque cuvée affiche sa jauge « part des anges » : le temps écoulé depuis le dernier ouillage face à votre seuil, du vert à l'orange puis au rouge. Les cuvées à ouiller remontent en tête de liste, avec un bouton pour lancer l'ouillage de toutes celles qui le réclament, et les gestes du quotidien (ouiller, soutirer, analyser) sont à portée directe sur chaque carte. Le journal passe en frise chronologique par mois." }
  ] },
  { v: '5.11', items: [
    { emoji: 'drapeau', titre: "Clôturer la campagne", desc: "Un bouton dans Réglages › Saisons pour terminer officiellement la campagne : bilan de l'équipe, archivage dans l'Historique, puis démarrage de la suivante. Toute l'équipe bascule ensemble et la nouvelle campagne démarre vierge (les travaux tracteur de la campagne finie restent rangés dans leur saison)." }
  ] },
  { v: '5.10', items: [
    { emoji: 'dossier', titre: "Préparer une saison à l'avance", desc: "Consultez une autre saison (l'hiver, la campagne suivante…) pour préparer vos travaux et votre pilotage — sans rien changer pour l'équipe, qui reste sur la saison active. La bascule de tous ne se fait qu'en ACTIVANT la saison. Le choix de la saison consultée est propre à chaque appareil." },
  { emoji: 'calendrier', titre: "Dates de travaux estimées", desc: "En modifiant une saison (Réglages › Saisons › ✏️), indiquez une fenêtre de dates estimée par tâche (ex. Taille : 15 janv. → 28 févr.). Elles s'affichent dans le Pilotage de la saison consultée pour anticiper la charge et les échéances." }
  ] }
];
