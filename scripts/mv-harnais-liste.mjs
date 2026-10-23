#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   LISTE-1 (§190) — LA LISTE UNIQUE DES CONTRÔLES
   Lue par : scripts/mv-lanceur.mjs  (npm run check = prebuild = la CI)
             scripts/mv-harnais-portes.mjs  (la cohérence des portes)

   ══ POURQUOI ══
   Jusqu'au 27/09, la même chaîne de 142 commandes était écrite DEUX FOIS dans
   package.json (`check` et `prebuild`, copiées à la main), et la CI en rejouait une
   partie à la main (70 invocations, étapes nommées) avant que `npm run build` ne
   relance TOUT via `prebuild` : chaque harnais de la CI tournait deux fois. Trois
   listes pour une seule porte — `mv-harnais-portes` existait pour les empêcher de
   diverger, parce qu'elles avaient déjà divergé (46 contre 25, dont 14 que le poste
   ne lançait jamais).
   ★ Il n'y a plus qu'UNE liste, ici. Ajouter un harnais = UNE ligne ci-dessous
     (et sa contre-épreuve sur la ligne suivante). Rien dans package.json, rien dans
     ci.yml.

   ══ FORME ══
   HARNAIS : [commande, groupe] dans l'ORDRE D'EXÉCUTION — celui de l'ancienne
   chaîne `check`, repris tel quel (rien n'a été réordonné). Le groupe est facultatif :
   il nomme ce qui a une raison écrite (GROUPES), et `--groupe` permet d'en lancer un.
   GROUPES : les raisons d'être, reprises MOT POUR MOT des commentaires de l'ancien
   ci.yml, qui les portait au-dessus de chaque étape. Elles n'ont pas été réécrites.
   ⚠️ Ces commentaires parlent parfois de l'ANCIENNE CI (« npm run build le relance en
     prebuild », « ici c'est pour échouer VITE »…) : ils sont d'avant LISTE-1, gardés tels
     quels parce qu'ils disent POURQUOI le contrôle existe — c'est cela qui compte.
   ⚠️ Une commande = `node scripts/<fichier>.mjs` + au plus un drapeau (`--contre`,
     `--check`, `--test`). Le lanceur refuse toute autre forme : pas de `&&`, pas de
     tube, pas de variable — une liste qu'on peut relire ligne à ligne.
   ─────────────────────────────────────────────────────────────────────────── */

export const GROUPES = {

  // AIDE-1 (§365) : la fenêtre « ? Aide » — openAide rejouée sur chaque fiche : aucun code à l'écran, l'icône dessinée,
  //   le gras apparié, et l'aide du Pilotage qui dit vrai sur ses onglets.
  'aide-sans-code': 'Aide — rien de codé à l’écran, l’icône dessinée, le gras en gras, les onglets du Pilotage dits vrais',

  // TUTO-1 (§358) : les tutos guidés — la porte unique de firebase.js, la mémoire jetable de boot.js, les étiquettes
  //   visées, les fonctions enseignées, et le compte des gestes sans tuto qui ne peut que baisser.
  'tutoriels-guides': 'Tutos guidés — rien ne sort pendant l’entraînement, chaque étiquette existe, aucun geste nouveau sans tuto',

  // MANQUE-1 (§357) : « Ce qu'il manque » du Pilotage — lisible jusqu'en bas, plus d'alerte « sans barème » pour le temps
  //   passé, l'entreplantation par ses pieds comptés, plus de fausse alerte phyto sur une période sans traitement.
  'pilotage-ce-qui-manque': 'Ce qu’il manque — le bas du panneau, le temps passé, les pieds comptés, le phyto d’hiver',

  // FML-1 (§356) : une cuve n'est « finie » qu'avec sa malo — décuvée, la frise lit la malo de sa cuvée au Chai.
  'fin-vinification-malo': 'Fin de vinification — pas de « Fini » avant la malo, « Pas de malo (voulu) », « Terminé » depuis l’étape FML',

  // COMPTE-1 (§353) : le compte du repérage devient les trous prévus de l'entreplantation.
  'entreplantation-pieds-marques': 'Pieds marqués — le compte du repérage chiffre l’entreplantation, avant la tarière',
  // TACHEPER-1 (§352) : une tâche cochée dans une période existe dans le domaine.
  'periodes-taches-du-domaine': 'Périodes — une tâche cochée, à la création comme à la modification, entre dans le domaine',
  // POURQUOI-1 (§336) : le catalogue « Pourquoi on le fait » couvre chaque tâche, activité et opération ; ses pastilles sont posées.
  'pourquoi-une-fiche-par-tache': 'Pourquoi on le fait — une fiche par tâche, posée là où le geste a lieu',
  // ARRIVEE-1 (§337) : qui a le Journal — une seule question, posée partout.
  'arrivee-deux-onglets': 'Arrivée de l’ouvrier — deux onglets, ni « + Journal » ni « Valider » à l’Accueil',
  // JALONS-1 (§340) : le calcul joué sur des données inventées ; les règles écrites (le moteur réel les joue dans mv-harnais-rules).
  'jalons-calcul-et-memoire': 'Jalons — le calcul, la fusion qui n’enlève rien, les ouvertures, le document de la personne',
  // COEQ-1 (§343) : le réglage « à deux » des activités et le coéquipier d'une session.
  'coequipier-tracteur': 'Coéquipier — choisi avec l’activité du tracteur (tarière, ensemencement, engrais)',
  // PRESENCE-1 (§344) : les opérations du Chai où la personne est notée, la carte de l'Accueil.
  'presence-notee-chai': 'Présence notée — les opérations du Chai où l’admin vous a coché, avec le pourquoi du geste',
  // PREMIERES-1 (§345) : la frise du parcours au domaine, sur les vraies dates.
  'premieres-fois': 'Premières fois — la frise du parcours au domaine, sur les vraies dates',

  // BUILD-1 (§305) : le lanceur fait tourner les controles EN PARALLELE. Ce harnais prouve, sur un
  // faux executant, que les sorties sortent dans l'ordre de la liste, qu'une commande SEULE ne croise
  // jamais une autre, qu'au premier rouge plus rien ne demarre (et que rien n'est tue) — et que tout
  // script de la liste qui ecrit dans le depot est declare dans SEULS ou ECRIT_HORS_LISTE.
  'lanceur-parallele': 'Lanceur — parallele, ordre de sortie, commandes seules',

  // C1–C22 : le filet anti-regression. Lecture seule, ~1 s.
  // (npm run build le relance en prebuild ; ici c'est pour echouer VITE
  //  et sur une etape NOMMEE, avant les 50 s de build.)
  'preflight': 'Preflight (C1–C22)',

  // Confidentialite : aucune adresse e-mail de tiers dans ce qui est PUBLIE.
  // Vecu le 05/09 : app.js portait sept personnes nommees avec leur adresse
  // personnelle reelle, servies a tous les domaines, depuis le premier commit.
  // ⚠ Ne dit rien de l'historique git, qui garde tout : cf. CLAUDE.md.
  'confidentialite-aucune': 'Confidentialite — aucune donnee personnelle publiee',

  // Portee des noms apres bundling : un nom lu dans un module et declare
  // dans un autre sans window n'existe pas dans le bundle (Rollup renomme).
  'globaux-un-nom-lu-existe-t': 'Globaux — un nom lu existe-t-il apres bundling',

  // Cliquet : bloque toute erreur NOUVELLE, tolere le plafond documente
  // dans scripts/lint-cliquet.mjs.
  'eslint-cliquet-anti': 'ESLint — cliquet anti-regression',

  // Cliquet de vocabulaire : « pause dejeuner » est banni du PLANNING (le mot
  // designe en droit un droit du salarie). Il etait ecrit depuis le 11/08 mais
  // AUCUN appelant ne l'executait — ni npm run lint, ni la CI. Branche ici.
  'vocabulaire-presence-coupure': 'Vocabulaire — presence / coupure / heures dues',

  // Le guide public est ASSEMBLE depuis guide/*.html par un script hors build.
  // Vecu le 13/08 : les sources avaient ete enrichies sans regenerer, et la
  // page deployee est restee en retard sans que rien ne le signale.
  'guide-la-page-deployee-est': 'Guide — la page deployee est en phase avec ses sources',

  // Le tri des parcelles et l'appartenance d'une tache a une periode. La table
  // d'etats faisait DESCENDRE la parcelle qu'on venait de commencer, et une tache
  // creee hors convention n'entrait dans aucune periode : elle disparaissait de
  // l'ecran au moment de l'enregistrement. Contre-epreuve incluse.
  'tri-des-parcelles-tache': 'Harnais — tri des parcelles + tache/periode',

  // Le journal des nouveautes s'EXECUTE au lieu de se relire, et les
  // documents ne doivent pas s'echapper de la charte MV_DOC (cliquet).
  'journal-des-nouveautes': 'Journal des nouveautes + chartes de document',

  // Harnais des documents : modules reels charges dans Node, aucun reseau.
  'les-six-documents': 'Harnais — les six documents',

  // Deux cliquets du Pilotage. L'echelle : 28 tailles de texte ecrites a la
  // main vivent desormais sur onze pas nommes — sans ce controle, la 29e
  // revient au premier ecran ajoute et rien ne rougit. La pastille : aucune
  // ne doit ouvrir une feuille vide, aucune fiche ne doit rester orpheline,
  // et l'ecouteur doit garder son stopPropagation (sans lui, ouvrir la fiche
  // replie la tuile qu'on cherche a comprendre). La carte : le chiffre et sa
  // ligne de cadre doivent rester DANS l'en-tete — c'est la seule chose qui
  // autorise le repli par defaut — et la migration de disposition est
  // EXECUTEE sur de vrais etats memorises, pas relue.
  'echelle-pastille-i-carte-a': 'Harnais — echelle, pastille « i », carte a trois etages',

  // Le jeu d'icones (DS-1). Un <use> qui vise un symbol absent ne rend RIEN,
  // en silence : c'est le piege du repli CSS applique aux icones. Le harnais
  // verifie que tout appel a son symbol, qu'aucun symbol ne dort sans emploi,
  // qu'aucune forme ne fige sa couleur (elle ne se repeindrait plus en mode
  // sombre), qu'aucun DOCUMENT IMPRIME n'appelle `_mvIcon` (le sprite n'existe
  // pas dans l'onglet ou il s'ouvre) et que le compte d'emojis rendus NE
  // REMONTE JAMAIS — module par module, pas seulement au total.
  // ⚠️ La contre-epreuve tourne AUSSI : un harnais qui ne rougit jamais ne
  //   prouve rien. Elle repose les six fautes, une par une, sur une copie.
  // ⚠️ Le sprite est COMMITE et `lucide-static` n'est PAS une dependance :
  // la CI n'installe rien de plus. `build-sprite.mjs` est un outil manuel.
  'le-jeu-dicones-et-sa-contre': 'Harnais — le jeu d\'icones, et sa contre-epreuve',

  // La carte d'une PARCELLE dans la liste (a ne pas confondre avec
  // `mv-harnais-carte.mjs`, qui vise la carte a trois etages du Pilotage).
  // ⚠️ Il existe parce qu'une regle CSS a vecu des mois SANS ATTEINDRE son
  //   element : `.pc-ord` etait ecrite `.pc-nom .pc-ord`, or `.pc-nom` est le
  //   titre d'AVANT la charte DS-2 et plus aucun ecran ne l'emet. Le rang de
  //   tournee sortait en texte brut, colle au nom. Une regle qui ne s'applique
  //   a rien ne casse pas : elle se tait. Ni node --check, ni ESLint, ni le
  //   preflight ne pouvaient la voir. Le harnais reconstruit la CHAINE
  //   D'ANCETRES emise par app.js et exige qu'une regle la MATCHE.
  // ⚠️⚠️ La contre-epreuve tourne AUSSI, et elle a servi le jour meme : la
  //   premiere version du controle cherchait `.pc-ord` QUELQUE PART dans la
  //   feuille — et `.pc-nom .pc-ord` contient cette chaine. Elle repondait
  //   vert sur le defaut exact qu'elle visait. Meme famille que §48.
  'la-carte-de-parcelle-et-sa': 'Harnais — la carte de parcelle, et sa contre-epreuve',

  // La visite guidee est la VITRINE : une demo cassee est cassee en public.
  // Deux regles qu'aucun autre controle ne porte. ① On ne facture que ce
  // qu'on a montre : toute ligne de DEMO2_CREDITS doit etre demontree par
  // un moment (la plus grosse ligne du chiffrage ne l'etait pas). ② Aucun
  // moment ne vise le corps d'une carte du Pilotage : depuis §42 elles
  // arrivent repliees, `querySelector` trouve un element qui mesure zero,
  // et les masques couvrent l'ecran ENTIER. C22 voit qu'un selecteur EXISTE,
  // jamais qu'il est VISIBLE.
  // ⚠️ La contre-epreuve tourne AUSSI en CI : un harnais qui ne rougit
  //   jamais ne prouve rien, et c'est elle qui a trouve que l'assertion sur
  //   les selecteurs se prouvait toute seule (elle cherchait la cible dans
  //   le fichier qui l'ecrit).
  'la-visite-guidee-et-sa': 'Harnais — la visite guidee, et sa contre-epreuve',

  // Le pic du Pilotage. Deux fautes reelles, toutes deux invisibles a la
  // relecture : un pic de la FENETRE affiche sur l'ecran « Aujourd'hui »
  // (donc un renfort reclame pour une semaine deja faite), et un manque
  // calcule sur un comptage de tetes proratise sur des jours de CALENDRIER
  // au lieu des heures reellement travaillables. Le harnais EXECUTE
  // _pilPicPortee sur des semaines ou head, headMax et capH/cap valent trois
  // nombres DIFFERENTS : aucune assertion ne peut passer par hasard.
  // ⚠️ La contre-epreuve tourne AUSSI : neuf fautes reposees une par une,
  //   dont le repli sur headMax — qui aurait ferme le manque en silence.
  'le-pic-a-venir-et-sa-contre': 'Harnais — le pic a venir, et sa contre-epreuve',

  // CRB-2 — l'enveloppe de dispersion des courbes de la cave. Il tient les
  // invariants du moteur (min <= mediane <= max, aucune extrapolation, le
  // couloir qui s'arrete sous trois cuves) ET le fait que le cahier de
  // cuverie imprime ne passe PAS par le couloir.
  // ⚠️ La contre-epreuve tourne AUSSI ici : un harnais qui ne rougit sur
  //    rien ne prouve rien.
  'crb-2-le-couloir-des-courbes': 'Harnais — CRB-2, le couloir des courbes',

  // ⚠️⚠️ Un modele de planning est un CALENDRIER, pas une semaine type : il se
  // lit « mois -> numero du jour -> heures ». Relu sur une autre annee il
  // glisse d'un jour (0 lundi et 39 samedis sur 2027), ET AUCUN TOTAL NE
  // BOUGE — aucun controle par les sommes ne pouvait le voir.
  'recalage-du-modele-sur': 'Harnais — recalage du modele sur l\'annee affichee',

  // ★★★ RECUP-1 : une journee ecourtee se retire du compteur AU TAUX NORMAL, les heures
  // sup gardent leur taux (25 % jusqu'a la 43e heure de la semaine, 50 % au-dela), et ce
  // que le compteur ne couvre pas est retenu sur la paie — sauf si le domaine a arrete la
  // journee. Une regle qui chiffre des euros : ses neuf defauts doivent tous rougir.
  'heures-manquees-et-recup': 'Harnais — heures manquees et recup majoree',

  // ★★★ RELEVE-3 (27/09) : le bouton « Releve » plantait sur un mois FIGE (mode paye, dimanche
  // travaille hors heures sup) — l'instantane de « Figer » garde la majoration sans ses jours.
  // Tous les harnais etaient verts : ils ne jouaient que des donnees ecrites par le code du jour.
  // Celui-ci tire des mois AU HASARD, avec des saisies abimees et des instantanes d'avant, et
  // appelle chaque surface du Planning : aucune exception, aucun « undefined » / « NaN » affiche.
  'aucune-donnee-ne-fait-planter': 'Harnais — aucune donnee ne fait planter le Planning',

  // ★★★ BOOT-1 + REPRISE-1 (§145) : le demarrage ne reste jamais muet (attentes bornees,
  // filet final, demarrage sans attendre `load`), et le retour de veille verifie que le
  // serveur repond encore (sonde, relance du flux, relecture, voyant « Pas de synchro »).
  // Rejoue sous une HORLOGE SIMULEE : une attente qui ne se regle jamais se teste en 1 ms.
  'demarrage-borne-et-retour-de': 'Harnais — demarrage borne et retour de veille',

  // ★★★ FUSION-1 (§146) : une ecriture n'efface plus ce qu'un autre appareil a saisi. Fusion a
  // trois voies, transaction, file hors ligne avec sa base, parcelles : 400 tirages au hasard ou
  // rien ne se perd, et chaque defaut corrige, reintroduit, doit rougir.
  'fusion-des-documents-entre': 'Harnais — fusion des documents entre appareils',

  // ★★ CIBLE-1 (§163) : ce que les cartes entourent — la parcelle COMMENCEE et pas finie, sinon la PROCHAINE
  // (n°1 de la tournee enregistree dans Decider). Definitions EXECUTEES sur des parcelles et des journaux
  // fabriques, plus les quatre cartes qui les appellent. Le depart retenait la PREMIERE validee du jour :
  // ce defaut, reinjecte (deux fois : _opJournalLast et _dzDernierFait), doit rougir.
  'ce-que-les-cartes-montrent': 'Harnais — ce que les cartes montrent',

  // CREUX-1 (§165) : ce qui manque dans les futs dit la verite — la feuille Decuver
  // ne double plus le bois, un fut enleve de la fiche emporte son vide, « Mes futs
  // sont pleins » corrige le manque. Sur les vraies fonctions de la Cave.
  'ce-qui-manque-dans-les-futs': 'Harnais — ce qui manque dans les futs',

  // TAP-1 (§166) : dans une session tracteur, faire defiler cochait la parcelle sous le doigt (la coche
  // partait au lever du doigt, quel que soit son chemin). Le vrai bloc de tracteur.js, sous de vrais
  // enchainements d'evenements tactiles ; la contre-epreuve remet l'ancien geste et doit rougir.
  'un-appui-nest-pas-un': 'Harnais — un appui n\'est pas un defilement (sessions tracteur)',

  // SESS-1 (§167) : le moteur des sessions tracteur perdait des mesures — rouvrir la session tuait la
  // mesure en cours, la pause oubliait le temps d'avant, refaire une parcelle remplacait son temps, un
  // seul chrono pour tout l'appareil. Le vrai moteur de tracteur.js, rejoue sous une horloge factice.
  'les-sessions-tracteur-ne': 'Harnais — les sessions tracteur ne perdent plus rien',

  // CHAMP-1 (§169) : Decider comptait dans l'equipe du jour un salarie en formation ou en evenement familial
  // (travail effectif de la loi, assimile). Les vraies fonctions de planning.js, jour par jour et sur une plage ;
  // la contre-epreuve remet l'ancienne lecture et doit rougir. La paie, elle, garde la formation.
  'qui-est-dans-les-rangs-ce': 'Harnais — qui est dans les rangs ce jour-la (Decider)',

  // TOUR-2 (§171) : le retour Android ne fermait que la famille .overlay (feuilles du Cuvier, « Plus »,
  // « c'est fait », « Ce qu'il manque », tri, Decider restaient ouvertes) ; un crayon invisible dans la puce
  // de conducteur volait l'appui. Le VRAI _mvBack d'app.js dans un DOM factice ; 11 contre-epreuves.
  'le-retour-ferme-ce-qui-est': 'Harnais — le retour ferme ce qui est ouvert, un appui va ou l\'on appuie',

  // TV-1 (§172) : le temps reellement passe dans chaque parcelle — heures dans les rangs du planning (moins la
  // conduite tracteur) versees aux parcelles validees par le salarie ou son groupe, au prorata de la surface.
  // Les vraies fonctions de pilotage.js ; 8 contre-epreuves (parts egales, pas de report, tracteur, niveaux...).
  'le-temps-reel-contre-le': 'Harnais — le temps reel contre le bareme (TV-1)',

  // PRES-1 + PDF-1 + SYNC-1 + ESC-1 (§174) : une seule regle de presence (Inactive sans date = absente, sauf
  // heures saisies) executee sur les cinq lecteurs ; purge des PDF orphelins ; badge de synchro ; echappement.
  'une-seule-regle-de-presence': 'Harnais — une seule regle de presence, PDF orphelins (PRES-1)',

  // TAILLE-1 (§177) : le calcul de taille Firestore rejoue l'exemple publie (147 octets). Le script lui-meme
  // se lance sur une sauvegarde, sur le poste (npm run taille -- fichier.json).
  'auto-controle-calcul-de': 'Auto-controle — calcul de taille des documents (TAILLE-1)',

  // ARCH-1 (§178) : l'archive de campagne ne porte que SA campagne ; la cloture n'active la nouvelle campagne
  // que si l'archive est reellement enregistree. Vraies fonctions de reglages.js ; 6 contre-epreuves.
  'archive-de-campagne-et': 'Harnais — archive de campagne et cloture sure (ARCH-1)',

  // STOCK-1 (§180) : une saisie hors ligne ne disparait plus quand le disque refuse d'ecrire la file ;
  // stockage persistant demande. Vraies fonctions de firebase.js ; 5 contre-epreuves.
  'file-hors-ligne-et-stockage': 'Harnais — file hors ligne et stockage persistant (STOCK-1)',

  // ENVOI-1 (§326) : une saisie partie vers le serveur est notee sur le disque ; une relance pendant
  // l'envoi ne la perd plus ; apres relance l'ecran montre ce qui attend ; le vidage ne retire que ce qu'il a
  // envoye ; ce que la garde refuse va au coffre, qui fusionne. Vraies fonctions de firebase.js ; 13 contre-epreuves.
  'envoi-jamais-perdu': 'Harnais — une saisie enregistree ne se perd plus, meme relancee en route (ENVOI-1)',

  // MAJ-2 (§327) : la version telechargee s'installe aux moments calmes (arriere-plan, retour avant le premier geste),
  // jamais avec une fenetre ouverte, un champ actif ou un envoi en route ; la barre, la carte, le toast ; sw.js refuse si
  // une autre fenetre est affichee ; le piege de VER-1 (installation pas finie). Vraies fonctions d'app.js ; 11 contre-epreuves.
  'maj-moments-calmes': 'Harnais — la mise a jour ne traine plus : moments calmes, barre, geste (MAJ-2)',

  // HORLOGE-1 (§181) : aujourd'hui / campagne / exercice a 10 instants pieges (heure de Paris, horloge figee) et
  // semaine ISO du planning 2024-2030 sous 4 fuseaux. Le harnais se relance en fils, un par fuseau.
  'dates-pieges-et-changement': 'Harnais — dates pieges et changement d\'heure (HORLOGE-1)',

  // TOUR-6 (§182) : frise du cockpit (etiquettes sur etages) et echelle des mois des Archives (une sur deux
  // en ecran etroit) — deux chevauchements vus par npm run tour, tenus sans navigateur.
  'etiquettes-de-la-frise-et-de': 'Harnais — etiquettes de la frise et de l\'echelle (TOUR-6)',

  // VER-1 (§184) : version plancher automatique (/version.json, MV_FORMAT), mise a jour au retour, parc
  // d'appareils. Vraies fonctions d'app.js, firebase.js, admin-gt.js ; 6 contre-epreuves.
  'versions-perimees-et-parc': 'Harnais — versions perimees et parc d\'appareils (VER-1)',

  // DROITS-1 (§185) : lecture seule identique dans l'appli (_mvLectureSeule) et sur le serveur (deriveRo), sur
  // les 32 combinaisons de roles ; fbSave ne tente plus ; regle error_log pour tout membre.
  'lecture-seule-et-remontee': 'Harnais — lecture seule et remontee des erreurs (DROITS-1)',
};

export const HARNAIS = [
  ['node scripts/mv-base.mjs'],
  ['node scripts/mv-lots.mjs'],   // LOTS-1 (§231) : la garde des lots frères, juste après celle de la base
  ['node scripts/mv-harnais-portes.mjs'],
  ['node scripts/mv-harnais-portes.mjs --contre'],   // LISTE-1 (§190) : le câblage de la liste unique, et sa contre-épreuve
  ['node scripts/mv-harnais-lanceur.mjs', 'lanceur-parallele'],   // BUILD-1 (§305) : le lanceur en parallele, et sa contre-epreuve
  ['node scripts/mv-harnais-lanceur.mjs --contre'],
  ['node scripts/lint-cliquet.mjs', 'eslint-cliquet-anti'],
  ['node scripts/preflight.mjs', 'preflight'],
  ['node scripts/mv-harnais-globaux.mjs', 'globaux-un-nom-lu-existe-t'],
  ['node scripts/mv-harnais-cuvier.mjs', 'globaux-un-nom-lu-existe-t'],
  ['node scripts/mv-harnais-confidentialite.mjs', 'confidentialite-aucune'],
  ['node scripts/mv-harnais-icones.mjs', 'le-jeu-dicones-et-sa-contre'],
  ['node scripts/mv-harnais-theme.mjs'],
  ['node scripts/mv-harnais-echelle.mjs', 'echelle-pastille-i-carte-a'],
  ['node scripts/mv-harnais-jetons.mjs'],
  ['node scripts/mv-harnais-carte-parcelle.mjs', 'la-carte-de-parcelle-et-sa'],
  ['node scripts/mv-harnais-arrachage.mjs'],
  ['node scripts/mv-harnais-selection.mjs'],
  ['node scripts/mv-harnais-arrach3.mjs'],
  ['node scripts/mv-harnais-arrach4.mjs'],
  ['node scripts/mv-harnais-arrach5.mjs'],
  ['node scripts/mv-harnais-avc-arr.mjs'],
  ['node scripts/mv-harnais-arrach6.mjs'],
  ['node scripts/mv-harnais-arrach7.mjs'],
  ['node scripts/mv-harnais-arrach8.mjs'],   // ★ ARRACH-8 (§306) — l'arrachee d'avant l'appli, l'annulation commune
  ['node scripts/mv-harnais-coh1.mjs'],
  ['node scripts/mv-harnais-coh1.mjs --contre'],
  ['node scripts/mv-harnais-renf2.mjs'],
  ['node scripts/mv-harnais-renf2.mjs --contre'],
  ['node scripts/mv-harnais-kit1.mjs'],
  ['node scripts/mv-harnais-kit1.mjs --contre'],
  ['node scripts/mv-harnais-kit2.mjs'],
  ['node scripts/mv-harnais-kit2.mjs --contre'],
  ['node scripts/mv-harnais-kit3.mjs'],
  ['node scripts/mv-harnais-kit3.mjs --contre'],
  ['node scripts/mv-harnais-kit4.mjs'],
  ['node scripts/mv-harnais-kit4.mjs --contre'],
  ['node scripts/mv-harnais-renom.mjs'],
  ['node scripts/mv-harnais-renom.mjs --contre'],
  ['node scripts/mv-harnais-annee.mjs'],
  ['node scripts/mv-harnais-annee.mjs --contre'],
  ['node scripts/mv-harnais-lots.mjs'],
  ['node scripts/mv-harnais-lots.mjs --contre'],   // RENF-2 (§224) : le renfort en calendrier, sans heures sup   // COH-1 (§222) : un même chiffre, un même nom, une même surface partout
  ['node scripts/mv-harnais-equipes-jour.mjs'],
  ['node scripts/mv-harnais-kml-fusion.mjs'],
  ['node scripts/mv-harnais-effectif-periode.mjs'],
  ['node scripts/mv-harnais-pic-avenir.mjs', 'le-pic-a-venir-et-sa-contre'],
  ['node scripts/mv-harnais-retard.mjs'],
  ['node scripts/mv-harnais-schema-planning.mjs'],
  ['node scripts/mv-harnais-ctx-planning.mjs'],
  ['node scripts/mv-harnais-dma.mjs'],
  ['node scripts/mv-harnais-releve.mjs', 'les-six-documents'],
  ['node scripts/mv-harnais-recalage.mjs', 'recalage-du-modele-sur'],
  ['node scripts/mv-harnais-fuseau.mjs'],
  ['node scripts/mv-harnais-ateliers.mjs'],
  ['node scripts/mv-harnais-achats.mjs'],
  ['node scripts/mv-harnais-vendange-parts.mjs'],
  ['node scripts/mv-harnais-vendange-garde.mjs'],
  ['node scripts/mv-harnais-reste-a-rentrer.mjs'],
  ['node scripts/mv-harnais-rdtmil.mjs'],
  ['node scripts/mv-harnais-poids-caisse.mjs'],
  ['node scripts/mv-harnais-couches.mjs'],
  ['node scripts/mv-harnais-subset.mjs'],
  ['node scripts/mv-harnais-intrants.mjs'],
  ['node scripts/mv-harnais-fusion.mjs'],
  ['node scripts/mv-harnais-cuvdoc.mjs', 'les-six-documents'],
  ['node scripts/mv-harnais-courbes.mjs'],
  ['node scripts/mv-harnais-parcours.mjs'],
  ['node scripts/mv-harnais-alignement.mjs'],
  ['node scripts/mv-harnais-majoration.mjs'],
  ['node scripts/mv-harnais-recup.mjs', 'heures-manquees-et-recup'],
  ['node scripts/mv-harnais-semaine.mjs', 'heures-manquees-et-recup'],
  ['node scripts/mv-harnais-robustesse-planning.mjs', 'aucune-donnee-ne-fait-planter'],
  ['node scripts/mv-harnais-robustesse-pilotage.mjs'],
  ['node scripts/mv-harnais-robustesse-cave.mjs'],
  ['node scripts/mv-harnais-gf.mjs'],   // ★ GF-1 (§302) — les sucres au labo
  ['node scripts/mv-harnais-labo.mjs'],   // ★ LABO-1 (§319) — les rapports du labo : rien ne s'efface
  ['node scripts/mv-harnais-robustesse-tracteur.mjs'],
  ['node scripts/mv-harnais-robustesse-reserve.mjs'],
  ['node scripts/mv-harnais-robustesse-accueil.mjs'],
  ['node scripts/mv-harnais-agenda.mjs'],
  ['node scripts/mv-harnais-vigne-tri.mjs', 'tri-des-parcelles-tache'],
  ['node scripts/mv-harnais-vigne-tri.mjs --contre', 'tri-des-parcelles-tache'],
  ['node scripts/mv-harnais-cave-auj.mjs'],
  ['node scripts/mv-harnais-cave-reglages.mjs'],
  ['node scripts/mv-harnais-cave-mil.mjs'],
  ['node scripts/mv-harnais-cave6.mjs'],
  ['node scripts/mv-harnais-cuv7.mjs'],
  ['node scripts/mv-harnais-cuv8.mjs'],
  ['node scripts/mv-harnais-cuv13.mjs'],
  ['node scripts/mv-harnais-futcap.mjs'],
  ['node scripts/mv-harnais-futcap.mjs --contre'],
  ['node scripts/mv-harnais-revient.mjs'],
  ['node scripts/mv-harnais-revient.mjs --contre'],
  ['node scripts/mv-harnais-vol1.mjs'],
  ['node scripts/mv-harnais-vol1.mjs --contre'],
  ['node scripts/mv-harnais-asm1.mjs'],
  ['node scripts/mv-harnais-asm1.mjs --contre'],
  ['node scripts/mv-harnais-creux.mjs', 'ce-qui-manque-dans-les-futs'],
  ['node scripts/mv-harnais-creux.mjs --contre', 'ce-qui-manque-dans-les-futs'],
  ['node scripts/mv-harnais-prep.mjs'],
  ['node scripts/mv-harnais-tri1.mjs'],
  ['node scripts/mv-harnais-tri2.mjs'],
  ['node scripts/mv-harnais-parc-xls.mjs'],
  ['node scripts/mv-harnais-fertil.mjs'],          // FERTI-1 : amendement et registre de fertilisation
  ['node scripts/mv-harnais-tri3.mjs'],
  ['node scripts/mv-harnais-cuvgr3.mjs'],
  ['node scripts/mv-harnais-crb2.mjs', 'crb-2-le-couloir-des-courbes'],
  ['node scripts/mv-harnais-regl-module.mjs'],
  ['node scripts/mv-harnais-reseau.mjs'],
  ['node scripts/mv-harnais-tiers.mjs'],
  ['node scripts/mv-harnais-tiers.mjs --contre'],
  ['node scripts/mv-harnais-signature.mjs'],
  ['node scripts/mv-harnais-signature.mjs --contre'],
  ['node scripts/mv-harnais-auth1.mjs'],
  ['node scripts/mv-harnais-reprise.mjs', 'demarrage-borne-et-retour-de'],
  ['node scripts/mv-harnais-reprise.mjs --contre', 'demarrage-borne-et-retour-de'],
  ['node scripts/mv-harnais-fusion-docs.mjs', 'fusion-des-documents-entre'],
  ['node scripts/mv-harnais-fusion-docs.mjs --contre', 'fusion-des-documents-entre'],
  ['node scripts/mv-harnais-toast-honnete.mjs'],
  ['node scripts/mv-harnais-info.mjs', 'echelle-pastille-i-carte-a'],
  ['node scripts/mv-harnais-pourquoi.mjs', 'pourquoi-une-fiche-par-tache'],   // POURQUOI-1 (§336) : une fiche par tâche, posée là où le geste a lieu
  ['node scripts/mv-harnais-pourquoi.mjs --contre', 'pourquoi-une-fiche-par-tache'],
  ['node scripts/mv-harnais-arrivee1.mjs', 'arrivee-deux-onglets'],   // ARRIVEE-1 (§337) : chez l'ouvrier, la Vigne a deux onglets
  ['node scripts/mv-harnais-arrivee1.mjs --contre', 'arrivee-deux-onglets'],
  ['node scripts/mv-harnais-arrivee2.mjs', 'arrivee-deux-onglets'],   // ARRIVEE-2 (§338) : l'arrivée de l'ouvrier sur sa priorité, resserrée
  ['node scripts/mv-harnais-arrivee2.mjs --contre', 'arrivee-deux-onglets'],
  ['node scripts/mv-harnais-arrivee4.mjs', 'arrivee-deux-onglets'],   // ARRIVEE-4 (§355) : le bouton « Filtres »
  ['node scripts/mv-harnais-arrivee4.mjs --contre', 'arrivee-deux-onglets'],
  ['node scripts/mv-harnais-jalons.mjs', 'jalons-calcul-et-memoire'],   // JALONS-1 (§340) : le calcul des jalons et leur mémoire
  ['node scripts/mv-harnais-jalons.mjs --contre', 'jalons-calcul-et-memoire'],
  ['node scripts/mv-harnais-coeq1.mjs', 'coequipier-tracteur'],   // COEQ-1 (§343) : le coéquipier, choisi avec l'activité
  ['node scripts/mv-harnais-coeq1.mjs --contre', 'coequipier-tracteur'],
  ['node scripts/mv-harnais-presence1.mjs', 'presence-notee-chai'],   // PRESENCE-1 (§344) : « Ta présence est notée »
  ['node scripts/mv-harnais-presence1.mjs --contre', 'presence-notee-chai'],
  ['node scripts/mv-harnais-premieres1.mjs', 'premieres-fois'],   // PREMIERES-1 (§345) : « Vos premières fois »
  ['node scripts/mv-harnais-premieres1.mjs --contre', 'premieres-fois'],
  ['node scripts/mv-harnais-presence2.mjs', 'presence-notee-chai'],   // PRESENCE-2 (§346) : « Qui était là » au Cuvier
  ['node scripts/mv-harnais-presence2.mjs --contre', 'presence-notee-chai'],
  ['node scripts/mv-harnais-fetes1.mjs', 'jalons-calcul-et-memoire'],   // FETES-1 (§347) : « Annoncer mes jalons » se coupe
  ['node scripts/mv-harnais-fetes1.mjs --contre', 'jalons-calcul-et-memoire'],
  ['node scripts/mv-harnais-rangbout1.mjs', 'premieres-fois'],   // RANGBOUT-1 (§349) : « Du rang à la bouteille »
  ['node scripts/mv-harnais-rangbout1.mjs --contre', 'premieres-fois'],
  ['node scripts/mv-harnais-cartedom1.mjs', 'premieres-fois'],   // CARTEDOM-1 (§350) : « La carte de votre saison »
  ['node scripts/mv-harnais-cartedom1.mjs --contre', 'premieres-fois'],
  ['node scripts/mv-harnais-saisonimg1.mjs', 'premieres-fois'],   // SAISONIMG-1 (§351) : « Ma saison en images »
  ['node scripts/mv-harnais-saisonimg1.mjs --contre', 'premieres-fois'],
  ['node scripts/mv-harnais-tacheper1.mjs', 'periodes-taches-du-domaine'],   // TACHEPER-1 (§352) : une tâche cochée en modifiant une période entre dans le domaine
  ['node scripts/mv-harnais-tacheper1.mjs --contre', 'periodes-taches-du-domaine'],
  ['node scripts/mv-harnais-compte1.mjs', 'entreplantation-pieds-marques'],   // COMPTE-1 (§353) : les pieds marqués chiffrent l'entreplantation
  ['node scripts/mv-harnais-compte1.mjs --contre', 'entreplantation-pieds-marques'],
  ['node scripts/mv-harnais-fml1.mjs', 'fin-vinification-malo'],   // FML-1 (§356) : pas de « Fini » avant la malo
  ['node scripts/mv-harnais-fml1.mjs --contre', 'fin-vinification-malo'],
  ['node scripts/mv-harnais-manque1.mjs', 'pilotage-ce-qui-manque'],   // MANQUE-1 (§357) : « Ce qu'il manque » lisible et vrai
  ['node scripts/mv-harnais-manque1.mjs --contre', 'pilotage-ce-qui-manque'],
  ['node scripts/mv-harnais-pil-coherence.mjs'],
  ['node scripts/mv-harnais-axe.mjs'],
  ['node scripts/mv-harnais-sauvegarde.mjs'],
  ['node scripts/mv-harnais-typo.mjs'],
  ['node scripts/mv-harnais-contraste.mjs'],
  ['node scripts/mv-harnais-avale.mjs'],
  ['node scripts/mv-banc-documents.mjs'],
  ['node scripts/harnais-claude-md.mjs'],
  ['node scripts/mv-claude-index.mjs --check'],
  ['node scripts/banc/banc.mjs'],
  ['node scripts/banc/garde-projection.mjs'],
  ['node scripts/harnais-escattr.mjs'],
  ['node scripts/build-guide.mjs --check', 'guide-la-page-deployee-est'],
  ['node scripts/lint-vocabulaire.mjs', 'vocabulaire-presence-coupure'],
  ['node scripts/mv-sitemap.mjs --check'],
  ['node scripts/mv-whatsnew-check.mjs', 'journal-des-nouveautes'],
  ['node scripts/mv-chartes-doc.mjs', 'journal-des-nouveautes'],
  ['node scripts/mv-harnais-vignoble.mjs', 'les-six-documents'],
  ['node scripts/mv-harnais-carte.mjs', 'echelle-pastille-i-carte-a'],
  ['node scripts/mv-harnais-entretien.mjs', 'les-six-documents'],
  ['node scripts/harnais-demo.mjs', 'la-visite-guidee-et-sa'],
  ['node scripts/harnais-demo-contre.mjs', 'la-visite-guidee-et-sa'],
  ['node scripts/mv-harnais-confidentialite.mjs --contre', 'confidentialite-aucune'],
  ['node scripts/mv-harnais-globaux.mjs --contre', 'globaux-un-nom-lu-existe-t'],
  ['node scripts/mv-harnais-cuvier.mjs --contre', 'globaux-un-nom-lu-existe-t'],
  ['node scripts/mv-harnais-carte-parcelle.mjs --contre', 'la-carte-de-parcelle-et-sa'],
  ['node scripts/mv-harnais-arrachage.mjs --contre'],
  ['node scripts/mv-harnais-selection.mjs --contre'],
  ['node scripts/mv-harnais-arrach3.mjs --contre'],
  ['node scripts/mv-harnais-arrach4.mjs --contre'],
  ['node scripts/mv-harnais-arrach5.mjs --contre'],
  ['node scripts/mv-harnais-avc-arr.mjs --contre'],
  ['node scripts/mv-harnais-arrach6.mjs --contre'],
  ['node scripts/mv-harnais-arrach7.mjs --contre'],
  ['node scripts/mv-harnais-arrach8.mjs --contre'],
  ['node scripts/mv-harnais-equipes-jour.mjs --contre'],
  ['node scripts/mv-harnais-pic-avenir.mjs --contre', 'le-pic-a-venir-et-sa-contre'],
  ['node scripts/mv-harnais-icones-contre.mjs', 'le-jeu-dicones-et-sa-contre'],
  ['node scripts/mv-harnais-crb2.mjs --contre', 'crb-2-le-couloir-des-courbes'],
  ['node scripts/mv-harnais-recalage.mjs --contre', 'recalage-du-modele-sur'],
  ['node scripts/mv-harnais-cuv8.mjs --contre'],
  ['node scripts/mv-harnais-cuv13.mjs --contre'],
  ['node scripts/mv-harnais-prep.mjs --contre'],
  ['node scripts/mv-harnais-axe.mjs --contre'],
  ['node scripts/mv-harnais-sauvegarde.mjs --contre'],
  ['node scripts/mv-harnais-typo.mjs --contre'],
  ['node scripts/mv-harnais-contraste.mjs --contre'],
  ['node scripts/mv-harnais-avale.mjs --contre'],
  ['node scripts/mv-banc-documents.mjs --contre'],
  ['node scripts/mv-harnais-subset.mjs --contre'],
  ['node scripts/mv-harnais-recup.mjs --contre', 'heures-manquees-et-recup'],
  ['node scripts/mv-harnais-robustesse-planning.mjs --contre', 'aucune-donnee-ne-fait-planter'],
  ['node scripts/mv-harnais-robustesse-pilotage.mjs --contre'],
  ['node scripts/mv-harnais-robustesse-cave.mjs --contre'],
  ['node scripts/mv-harnais-gf.mjs --contre'],
  ['node scripts/mv-harnais-labo.mjs --contre'],
  ['node scripts/mv-harnais-robustesse-tracteur.mjs --contre'],
  ['node scripts/mv-harnais-robustesse-reserve.mjs --contre'],
  ['node scripts/mv-harnais-robustesse-accueil.mjs --contre'],
  ['node scripts/mv-harnais-schema-planning.mjs --contre'],
  ['node scripts/mv-harnais-ctx-planning.mjs --contre'],
  ['node scripts/mv-harnais-dma.mjs --contre'],
  ['node scripts/mv-harnais-cible.mjs', 'ce-que-les-cartes-montrent'],
  ['node scripts/mv-harnais-cible.mjs --contre', 'ce-que-les-cartes-montrent'],
  ['node scripts/mv-harnais-tap.mjs', 'un-appui-nest-pas-un'],
  ['node scripts/mv-harnais-tap.mjs --contre', 'un-appui-nest-pas-un'],
  ['node scripts/mv-harnais-sessions.mjs', 'les-sessions-tracteur-ne'],
  ['node scripts/mv-harnais-sessions.mjs --contre', 'les-sessions-tracteur-ne'],
  ['node scripts/mv-harnais-champ.mjs', 'qui-est-dans-les-rangs-ce'],
  ['node scripts/mv-harnais-champ.mjs --contre', 'qui-est-dans-les-rangs-ce'],
  ['node scripts/mv-harnais-retour.mjs', 'le-retour-ferme-ce-qui-est'],
  ['node scripts/mv-harnais-retour.mjs --contre', 'le-retour-ferme-ce-qui-est'],
  ['node scripts/mv-harnais-temps-vigne.mjs', 'le-temps-reel-contre-le'],
  ['node scripts/mv-harnais-temps-vigne.mjs --contre', 'le-temps-reel-contre-le'],
  ['node scripts/mv-harnais-pres.mjs', 'une-seule-regle-de-presence'],
  ['node scripts/mv-harnais-pres.mjs --contre', 'une-seule-regle-de-presence'],
  ['node scripts/mv-taille-docs.mjs --test', 'auto-controle-calcul-de'],
  ['node scripts/mv-harnais-arch.mjs', 'archive-de-campagne-et'],
  ['node scripts/mv-harnais-arch.mjs --contre', 'archive-de-campagne-et'],
  ['node scripts/mv-harnais-stock.mjs', 'file-hors-ligne-et-stockage'],
  ['node scripts/mv-harnais-stock.mjs --contre', 'file-hors-ligne-et-stockage'],
  ['node scripts/mv-harnais-envoi.mjs', 'envoi-jamais-perdu'],
  ['node scripts/mv-harnais-envoi.mjs --contre', 'envoi-jamais-perdu'],
  ['node scripts/mv-harnais-maj2.mjs', 'maj-moments-calmes'],
  ['node scripts/mv-harnais-maj2.mjs --contre', 'maj-moments-calmes'],
  ['node scripts/mv-harnais-horloge.mjs', 'dates-pieges-et-changement'],
  ['node scripts/mv-harnais-horloge.mjs --contre', 'dates-pieges-et-changement'],
  ['node scripts/mv-harnais-etiquettes.mjs', 'etiquettes-de-la-frise-et-de'],
  ['node scripts/mv-harnais-etiquettes.mjs --contre', 'etiquettes-de-la-frise-et-de'],
  ['node scripts/mv-harnais-version.mjs', 'versions-perimees-et-parc'],
  ['node scripts/mv-harnais-version.mjs --contre', 'versions-perimees-et-parc'],
  ['node scripts/mv-version-json.mjs --test', 'versions-perimees-et-parc'],
  ['node scripts/mv-harnais-droits.mjs', 'lecture-seule-et-remontee'],
  ['node scripts/mv-harnais-droits.mjs --contre', 'lecture-seule-et-remontee'],
  ['node scripts/mv-harnais-tutos.mjs', 'tutoriels-guides'],
  ['node scripts/mv-harnais-tutos.mjs --contre', 'tutoriels-guides'],
  ['node scripts/mv-harnais-aide.mjs', 'aide-sans-code'],          // AIDE-1 (§365) : la fenêtre « ? Aide » se lit
  ['node scripts/mv-harnais-aide.mjs --contre', 'aide-sans-code'],
  ['node scripts/mv-harnais-gnr-mesure.mjs'],          // GNR-M (§213) : le tracteur sur les travaux en cours, conso mesurée
  ['node scripts/mv-harnais-gnr-mesure.mjs --contre'],
  ['node scripts/mv-harnais-spark.mjs'],               // SPARK-1 (§214) : la petite courbe d’un chiffre
  ['node scripts/mv-harnais-spark.mjs --contre'],
  ['node scripts/mv-harnais-tension.mjs'],             // TENS-1 (§215) : la tension de l’équipe face au planning prévu
  ['node scripts/mv-harnais-tension.mjs --contre'],
  ['node scripts/mv-harnais-tournee-rdt.mjs'],         // TOUR-RDT (§216) : le rendement de la tournée
  ['node scripts/mv-harnais-tournee-rdt.mjs --contre'],
  ['node scripts/mv-harnais-carte-vues.mjs'],          // CARTE-1 (§217) : les vues de la carte
  ['node scripts/mv-harnais-carte-vues.mjs --contre'],
  ['node scripts/mv-harnais-protection.mjs'],          // PROT-1 + INACTION-1 (§218)
  ['node scripts/mv-harnais-protection.mjs --contre'],
  ['node scripts/mv-harnais-photo.mjs'],               // PHOTO-1 (§219) : la photo quotidienne des chiffres
  ['node scripts/mv-harnais-photo.mjs --contre'],
  ['node scripts/mv-harnais-annonces.mjs'],           // ANN-1 (§225) : les quatre niveaux des nouveautés
  ['node scripts/mv-harnais-annonces.mjs --contre'],
  ['node scripts/mv-harnais-prio.mjs'],               // PRIO-1 (§235) : la tâche du moment, une seule règle
  ['node scripts/mv-harnais-prio.mjs --contre'],
  ['node scripts/mv-harnais-gestes.mjs'],             // GESTES-1 (§239) : déguster, traiter, filtrer
  ['node scripts/mv-harnais-gestes.mjs --contre'],
  ['node scripts/mv-harnais-demo.mjs'],               // DEMO-4 (§240) : la démo du site, un domaine, quatre téléphones
  ['node scripts/mv-harnais-demo.mjs --contre'],
  ['node scripts/mv-harnais-align.mjs'],              // ALIGN-1 (§236) : la décision du jour, quatre tuiles bâties pareil
  ['node scripts/mv-harnais-align.mjs --contre'],
  ['node scripts/mv-harnais-align2.mjs'],             // ALIGN-2 (§237) : l'Accueil en rangées
  ['node scripts/mv-harnais-align2.mjs --contre'],
  ['node scripts/mv-harnais-valid1.mjs'],             // VALID-1 + LOGIN-1 (§242) : valider sans attendre la météo ; la connexion dit la vérité
  ['node scripts/mv-harnais-valid1.mjs --contre'],
  ['node scripts/mv-harnais-voile1.mjs'],             // VOILE-1 + PROFILS-1 (§243) : le voile tant que rien n'est prêt ; les tuiles de l'appareil d'abord
  ['node scripts/mv-harnais-voile1.mjs --contre'],
  ['node scripts/mv-harnais-entree1.mjs'],            // ENTREE-1 (§244) : se connecter sans réseau, en retapant son mot de passe
  ['node scripts/mv-harnais-entree1.mjs --contre'],
  ['node scripts/mv-harnais-rendu1.mjs'],             // RENDU-1 (§245) : un rendu, de la seule page affichée, par image
  ['node scripts/mv-harnais-rendu1.mjs --contre'],
  ['node scripts/mv-harnais-taille2.mjs'],            // TAILLE-2 (§246) : la taille mesurée avant d'envoyer, alerte à 70 %, refus clair
  ['node scripts/mv-harnais-taille2.mjs --contre'],
  ['node scripts/mv-harnais-textea.mjs'],             // TEXTE-A (§247) : les trois petits crans relevés, la ligne du registre phyto
  ['node scripts/mv-harnais-textea.mjs --contre'],
  ['node scripts/mv-harnais-journal1.mjs'],           // JOURNAL-1 (§248) : seuls les jours visibles mis en page, au pixel près
  ['node scripts/mv-harnais-journal1.mjs --contre'],
  ['node scripts/mv-harnais-gt1.mjs'],                // GT-1 (§249) : la console GUERETTECH hors de l'appli des clients (gt.html)
  ['node scripts/mv-harnais-gt1.mjs --contre'],
  ['node scripts/mv-harnais-ids1.mjs'],               // IDS-1 lot 1 (§252) : identifiants permanents des parcelles, sans entrée ressuscitée
  ['node scripts/mv-harnais-ids1.mjs --contre'],
  ['node scripts/mv-harnais-ids1b.mjs'],              // IDS-1 lot 2 (§253) : le nom suit l'identifiant (renommage sans reprendre les écrans)
  ['node scripts/mv-harnais-ids1b.mjs --contre'],
  ['node scripts/mv-harnais-renom-parc.mjs'],         // IDS-1 lot 4 (§254) : renommer une parcelle, tous les registres, règle du domaine
  ['node scripts/mv-harnais-renom-parc.mjs --contre'],
  ['node scripts/mv-harnais-aoc-cave.mjs'],           // AOC-1 (§255) : les appellations dans la roue de la Cave (deux lignes, deux fenêtres)
  ['node scripts/mv-harnais-aoc-cave.mjs --contre'],
  ['node scripts/mv-harnais-renom-membre.mjs'],        // IDS-1 salariés (§257) : renommer un salarié, tous les registres, planning et paie
  ['node scripts/mv-harnais-renom-membre.mjs --contre'],
  ['node scripts/mv-harnais-renom-act.mjs'],           // IDS-1 activités (§258) : renommer une activité ; les tracteurs, déjà sûrs
  ['node scripts/mv-harnais-renom-act.mjs --contre'],
  ['node scripts/mv-harnais-motifs1.mjs'],            // MOTIFS-1 (§250) : motifs, heures sup et acomptes ne quittent plus l'appareil de l'admin
  ['node scripts/mv-harnais-motifs1.mjs --contre'],
  ['node scripts/mv-harnais-vueeq1.mjs'],             // VUE-EQUIPE-1 (§251) : l'équipe du mois vue par un salarié — présent / absent, jamais le motif
  ['node scripts/mv-harnais-vueeq1.mjs --contre'],
  ['node scripts/mv-harnais-gnr2.mjs'],               // GNR-2 (§256) : la cuve GNR se lit sur téléphone (le bloc tracteur a sa grille)
  ['node scripts/mv-harnais-gnr2.mjs --contre'],
  ['node scripts/mv-harnais-mouv1.mjs'],              // MOUV-1 (§259) : jetons du mouvement, _mvAnim, courbes qui se dessinent, infobulle qui suit
  ['node scripts/mv-harnais-mouv1.mjs --contre'],
  ['node scripts/mv-harnais-auj1.mjs'],               // AUJ-1 (§260) : le cockpit d'Aujourd'hui, vue Terrain (src/cockpit.js)
  ['node scripts/mv-harnais-auj1.mjs --contre'],
  ['node scripts/mv-harnais-auj2.mjs'],               // AUJ-2 (§261) : « À savoir » — météo, absences, contrats, retards, matériel et cave
  ['node scripts/mv-harnais-auj2.mjs --contre'],
  ['node scripts/mv-harnais-auj3.mjs'],               // AUJ-3 (§262) : le domaine en direct (plan par appellation, état par tâche)
  ['node scripts/mv-harnais-auj3.mjs --contre'],
  ['node scripts/mv-harnais-auj4.mjs'],               // AUJ-4 (§263) : bascule Terrain / Économie (l'onglet Économie tel quel)
  ['node scripts/mv-harnais-auj4.mjs --contre'],
  ['node scripts/mv-harnais-sect1.mjs'],              // SECT-1 (§264) : la météo par secteur dans « À savoir »
  ['node scripts/mv-harnais-sect1.mjs --contre'],
  ['node scripts/mv-harnais-prol1.mjs'],              // PROL-1 (§265) : ce qu'une prolongation de contrat ferait gagner
  ['node scripts/mv-harnais-prol1.mjs --contre'],
  ['node scripts/mv-harnais-ref1.mjs'],               // REF-1 (§266) : Aujourd'hui reprend la maquette validée, montée avec le modèle réel
  ['node scripts/mv-harnais-ref1.mjs --contre'],
  ['node scripts/mv-harnais-ref2.mjs'],               // REF-2 (§267) : la photo économique du jour, depuis le moteur de l'onglet Économie
  ['node scripts/mv-harnais-ref2.mjs --contre'],
  ['node scripts/mv-harnais-coq1.mjs'],               // COQ-1 + PAL-1 (§268) : barre latérale et recherche Ctrl K, sur ordinateur
  ['node scripts/mv-harnais-coq1.mjs --contre'],
  ['node scripts/mv-harnais-coq2.mjs'],               // COQ-2 (§271) : la barre, la recherche et le dock au dessin de la maquette v2
  ['node scripts/mv-harnais-coq2.mjs --contre'],
  ['node scripts/mv-harnais-tete1.mjs'],              // TETE-1 (§272) : en-têtes et onglets au dessin de la maquette v2
  ['node scripts/mv-harnais-tete1.mjs --contre'],
  ['node scripts/mv-harnais-tete2.mjs'],              // TETE-2 (§329) : un seul modèle d'en-tête, lisible et calé, Pilotage compris
  ['node scripts/mv-harnais-tete2.mjs --contre'],
  ['node scripts/mv-harnais-colle1.mjs'],             // COLLE-1 (§412) : « En direct » au-dessus d’« À savoir », collés sous le bandeau et les onglets
  ['node scripts/mv-harnais-colle1.mjs --contre'],
  ['node scripts/mv-harnais-parc1.mjs'],              // PARC-1 (§274) : les Parcelles sur ordinateur, liste + fiche (maquette v3)
  ['node scripts/mv-harnais-parc1.mjs --contre'],
  ['node scripts/mv-harnais-parc2.mjs'],              // PARC-2 (§275) : les cartes de travail du téléphone (maquette v3)
  ['node scripts/mv-harnais-parc2.mjs --contre'],
  ['node scripts/mv-harnais-acc1.mjs'],               // ACC-1 (§276) : l'Accueil en grille 12 colonnes, cadre commun, Personnaliser
  ['node scripts/mv-harnais-acc1.mjs --contre'],
  ['node scripts/mv-harnais-acc2.mjs'],               // ACC-2 (§277) : la priorité épinglée en carte, l'avancement au cadre neutre
  ['node scripts/mv-harnais-acc2.mjs --contre'],
  ['node scripts/mv-harnais-acc3.mjs'],               // ACC-3 (§278) : météo 5 jours et derniers travaux au dessin de la v4
  ['node scripts/mv-harnais-acc3.mjs --contre'],
  ['node scripts/mv-harnais-plan1.mjs'],              // PLAN-1 (§279) : le Planning « Le mois » au dessin de la maquette v5
  ['node scripts/mv-harnais-plan1.mjs --contre'],
  ['node scripts/mv-harnais-plan2.mjs'],              // PLAN-2 (§280) : Planning « Les gens » en liste + fiche
  ['node scripts/mv-harnais-plan2.mjs --contre'],
  ['node scripts/mv-harnais-plan3.mjs'],              // PLAN-3 (§281) : les feuilles du Planning et le récap annuel à la charte
  ['node scripts/mv-harnais-plan3.mjs --contre'],
  ['node scripts/mv-harnais-cadre1.mjs'],            // CADRE-1 (§300) : cases dans leur cadre, barre sous les fenêtres, fiche rangée sans gel
  ['node scripts/mv-harnais-cadre1.mjs --contre'],
  ['node scripts/mv-harnais-forme1.mjs'],            // FORME-1 (§301) : le plan aux formes réelles, l'équipe de chaque parcelle en cours, le toucher → la fiche
  ['node scripts/mv-harnais-forme1.mjs --contre'],
  ['node scripts/mv-harnais-auj5.mjs'],              // AUJ-5 (§307) : le planning fait foi (repos, retours, brûlage), la disposition de la maquette, « À savoir » collant, la carte qui se redessine
  ['node scripts/mv-harnais-auj5.mjs --contre'],
  ['node scripts/mv-harnais-auj6.mjs'],              // AUJ-6 (§308) : les dessins qui ne disparaissent plus (montage remis à zéro), « À savoir » sous les onglets, la courbe sans traits
  ['node scripts/mv-harnais-auj6.mjs --contre'],
  ['node scripts/mv-harnais-auj7.mjs'],              // AUJ-7 (§309) : la vue Économie d'Aujourd'hui sur les vrais chiffres (fin projetée, main-d'œuvre payée), l'arrachage travail à l'heure, l'espace fine
  ['node scripts/mv-harnais-auj7.mjs --contre'],
  ['node scripts/mv-harnais-notif2.mjs'],            // NOTIF-2 (§310) : une notification ne part que si l'appareil l'autorise ; un refus avalé avec son nom, jamais affiché
  ['node scripts/mv-harnais-notif2.mjs --contre'],
  ['node scripts/mv-harnais-notif3.mjs'],            // NOTIF-3 (§311) : une seule notification par jour travaillé, à la prise de poste du planning (serveur + appli + sw.js)
  ['node scripts/mv-harnais-notif3.mjs --contre'],
  ['node scripts/mv-harnais-auj8.mjs'],              // AUJ-8 (§312) : « À savoir » donne des faits — risque de pluie, cumul et vent sous chaque jour, ce qui est en cours dans les communes touchées, plus de brûlage
  ['node scripts/mv-harnais-auj8.mjs --contre'],
  ['node scripts/mv-harnais-rail1.mjs'],             // RAIL-1 (§313) : la barre latérale dans l'ordre du dock (Pilotage en tête, Réglages au pied) et son logo dessiné pour 28 px
  ['node scripts/mv-harnais-rail1.mjs --contre'],
  ['node scripts/mv-harnais-bulle1.mjs'],            // BULLE-1 (§314) : chaque « i » ouvre une bulle collée à lui — position, « Lire la suite », fenêtre hôte, toucher à côté, Échap, cockpit
  ['node scripts/mv-harnais-bulle1.mjs --contre'],
  ['node scripts/mv-harnais-forme2.mjs'],            // FORME-2 (§315) : les parcelles de la carte de l'Accueil à leur vraie forme, à la surface de leur ancien rectangle ; l'appui ouvre la fiche
  ['node scripts/mv-harnais-forme2.mjs --contre'],
  ['node scripts/mv-harnais-chant1.mjs'],            // CHANT-1 (§316) : les chantiers par date de début, les terminés en bas, l'arrachage fini pour l'équipe en tête des terminés
  ['node scripts/mv-harnais-chant1.mjs --contre'],
  ['node scripts/mv-harnais-arrach9.mjs'],           // ARRACH-9 (§317) : la parcelle d'arrachage au prestataire quitte « À faire » et les cartes de l'équipe
  ['node scripts/mv-harnais-arrach9.mjs --contre'],
  ['node scripts/mv-harnais-direct1.mjs'],           // DIRECT-1 (§318) : « Début » enregistre l'équipe, « sans moi » dans le cockpit, « En direct » : en ce moment, puis la journée, tracteur compris
  ['node scripts/mv-harnais-direct1.mjs --contre'],
  ['node scripts/mv-harnais-etat1.mjs'],             // ETAT-1 (§320) : le plan du cockpit lit l'état de la fiche (annulations, saisons passées, tâches sans fenêtre) ; le journal ne dit plus que qui
  ['node scripts/mv-harnais-etat1.mjs --contre'],
  ['node scripts/mv-harnais-hors1.mjs'],             // HORS-1 (§322) : la parcelle pas concernée par la tâche (désactivée, pas choisie) en fantôme — plan, plan de secours, À savoir, carte de l'Accueil
  ['node scripts/mv-harnais-hors1.mjs --contre'],
  ['node scripts/mv-harnais-dates1.mjs'],            // DATES-1 (§323) : les dates de travaux valent pour toutes les tâches, barème ou pas (ligne, ordre, retard, À savoir) ; la mémoire de L'année suit les dates
  ['node scripts/mv-harnais-dates1.mjs --contre'],
  ['node scripts/mv-harnais-tournee1.mjs'],          // TOURNEE-1 (§324) : « Tournée définie pour » ne propose que les tournées utiles (campagne en cours, une parcelle à faire) ; une tâche finie n'applique plus sa tournée ; la liste vide redessine la barre
  ['node scripts/mv-harnais-tournee1.mjs --contre'],
  ['node scripts/mv-harnais-trn1.mjs'],             // TRN-1 (§330) : les tournées — CONFIG.tournees seul juge (l'ancienne carte lue en repli), ordre en pid (renommer ne la touche pas), écriture avec la copie par tâche pour Décider et les appareils en retard
  ['node scripts/mv-harnais-trn1.mjs --contre'],
  ['node scripts/mv-harnais-trn2.mjs'],             // TRN-2 (§331) : une tournée par équipe du jour (lue pour la personne connectée, gardée à l'enregistrement, relue alignée) ; la tournée passe devant la proximité chez l'équipe
  ['node scripts/mv-harnais-trn2.mjs --contre'],
  ['node scripts/mv-harnais-sansrec1.mjs'],          // SANSREC-1 (§332) : « pas de récolte cette année » — règle, Encore sur pied, feuille de récolte, Revient
  ['node scripts/mv-harnais-sansrec1.mjs --contre'],
  ['node scripts/mv-harnais-range1.mjs'],            // RANGE-1 (§335) : Le millésime rangé — la tête, les quatre vues, la chaîne de chaque cuvée (ex-CHAINE-1)
  ['node scripts/mv-harnais-range1.mjs --contre'],
  ['node scripts/mv-harnais-hlha1.mjs'],             // HLHA-1 (§413) : le hL/ha de chaque cuvée (fiche) et le rendement par appellation et par couleur (Parcelles)
  ['node scripts/mv-harnais-hlha1.mjs --contre'],
  ['node scripts/mv-harnais-matu1.mjs'],             // MATU-1 (§366) : les Maturités rangées — la vendange bornée, la fourchette par couleur, l'ordre, la saisie en série
  ['node scripts/mv-harnais-matu1.mjs --contre'],
  ['node scripts/mv-harnais-rec1.mjs'],              // REC-1 (§382) : les Récoltes rangées — la moyenne pondérée, valeur ou fourchette, le dépassement, le journal, la fiche
  ['node scripts/mv-harnais-rec1.mjs --contre'],
  ['node scripts/mv-harnais-cuves1.mjs'],            // CUVES-1 (§383) : une cuve s'ouvre en fiche — l'ordinateur, la fenêtre du téléphone, le bac à sable ; les quatre chiffres
  ['node scripts/mv-harnais-cuves1.mjs --contre'],
  ['node scripts/mv-harnais-tourcuv1.mjs'],          // TOURCUV-1 (§384) : la Tournée du Cuvier rangée — la tête claire, les filtres et les boutons du jeu
  ['node scripts/mv-harnais-tourcuv1.mjs --contre'],
  ['node scripts/mv-harnais-minaoc1.mjs'],           // MINAOC-1 (§385) : le minimum de maturité de l'appellation — le réglage, le trait, la phrase, la fiche
  ['node scripts/mv-harnais-minaoc1.mjs --contre'],
  ['node scripts/mv-harnais-cavereg1.mjs'],          // CAVEREG-1 (§386) : la roue crantée de la Cave en quatre sections, une à la fois ; les minimums par appellation
  ['node scripts/mv-harnais-cavereg1.mjs --contre'],
  ['node scripts/mv-harnais-cavereg2.mjs'],          // CAVEREG-2 (§387) : les réglages du Cuvier et du Chai en lignes, leur fenêtre, les règles d'avant
  ['node scripts/mv-harnais-cavereg2.mjs --contre'],
  ['node scripts/mv-harnais-tuto8.mjs'],             // TUTO-8 (§388) : le tuto des maturités — ses étiquettes, ce qu'il couvre, la vendange fictive à dates calculées
  ['node scripts/mv-harnais-tuto8.mjs --contre'],
  ['node scripts/mv-harnais-police.mjs'],            // CHARTE-1 (§367) : la police passe par les deux réglages de la charte — aucune police en toutes lettres hors réglage, repli ou exemption
  ['node scripts/mv-harnais-police.mjs --contre'],
  ['node scripts/mv-harnais-charte.mjs'],            // CHARTE-2 (§368) : les réglages ne se déclarent que dans src/charte.css ; la charte ne contient que des réglages ; le sombre redit à l'identique
  ['node scripts/mv-harnais-charte.mjs --contre'],
  ['node scripts/mv-harnais-boutons.mjs'],           // CHARTE-3 (§370) : le jeu de boutons commun — les pièces, aucune couleur en dur, les classes passées au jeu sans allure propre, le plafond des boutons « maison »
  ['node scripts/mv-harnais-boutons.mjs --contre'],
  ['node scripts/mv-harnais-pastilles.mjs'],         // CHARTE-4 (§374) : le jeu de pastilles commun — les pièces, aucune couleur en dur ni capitale, les classes passées au jeu sans allure propre, le plafond des pastilles « maison », les couleurs de type et d’état dans la charte
  ['node scripts/mv-harnais-pastilles.mjs --contre'],
  ['node scripts/mv-harnais-cartes.mjs'],            // CHARTE-5 (§379) : le jeu de cartes commun — les pièces, aucune couleur en dur, les cartes passées au jeu sans fond/filet/arrondi/ombre propres, le plafond des cartes « maison » et des encadrés faits à la main, la couleur « informer » dans la charte
  ['node scripts/mv-harnais-cartes.mjs --contre'],
  ['node scripts/mv-harnais-champs.mjs'],            // CHARTE-6 (§400) : le jeu des cases de saisie — les pièces, aucune couleur en dur, le filet dans la charte, .fi/.fsel dessinés par le jeu seul, 16 px au téléphone
  ['node scripts/mv-harnais-champs.mjs --contre'],
  ['node scripts/mv-harnais-chemins.mjs'],           // §376 : aucun script de la chaîne ne prend le chemin d’un fichier par `new URL(…).pathname` (faux sous Windows, §53) — fileURLToPath seul
  ['node scripts/mv-harnais-chemins.mjs --contre'],
  ['node scripts/mv-harnais-larg1.mjs'],             // LARG-1 (§334) : une seule largeur sur ordinateur — chaque page bornée par la règle, ou exemptée avec sa raison
  ['node scripts/mv-harnais-larg1.mjs --contre'],
  ['node scripts/mv-harnais-retrait1.mjs'],          // RETRAIT-1 (§325) : une tâche ordinaire désactivée sur des parcelles pour la période — règle, feuille, croix, renommages, L'année
  ['node scripts/mv-harnais-retrait1.mjs --contre'],
  ['node scripts/mv-harnais-direct2.mjs'],           // DIRECT-2 (§328) : « En direct » donne le vrai jour de début d'un arrachage en étapes (sa première étape validée) ; un jour inconnu ne s'écrit plus « aujourd'hui »
  ['node scripts/mv-harnais-direct2.mjs --contre'],
  ['node scripts/mv-harnais-trac1.mjs'],              // TRAC-1 (§282) : les sessions du Tracteur en liste + fiche
  ['node scripts/mv-harnais-trac1.mjs --contre'],
  ['node scripts/mv-harnais-trac2.mjs'],              // TRAC-2 (§283) : l'Entretien du Tracteur sur deux colonnes
  ['node scripts/mv-harnais-trac2.mjs --contre'],
  ['node scripts/mv-harnais-trac3.mjs'],              // TRAC-3 (§284) : heures et GNR d'une session, bouton « Démarrer », fenêtres
  ['node scripts/mv-harnais-trac3.mjs --contre'],
  ['node scripts/mv-harnais-phyto1.mjs'],             // PHYTO-1 (§285) : le registre phyto en liste + fiche
  ['node scripts/mv-harnais-phyto1.mjs --contre'],
  ['node scripts/mv-harnais-phyto2.mjs'],             // PHYTO-2 (§286) : le catalogue E-Phy en liste + fiche
  ['node scripts/mv-harnais-phyto2.mjs --contre'],
  ['node scripts/mv-harnais-phyto3.mjs'],             // PHYTO-3 (§287) : la Fertilisation à la charte
  ['node scripts/mv-harnais-phyto3.mjs --contre'],
  ['node scripts/mv-harnais-cave1.mjs'],              // CAVE-1 (§288) : la Cave › Aujourd'hui et la bande à la charte
  ['node scripts/mv-harnais-cave1.mjs --contre'],
  ['node scripts/mv-harnais-caveauj1.mjs'],
  ['node scripts/mv-harnais-caveauj1.mjs --contre'],
  ['node scripts/mv-harnais-caveauj2.mjs'],
  ['node scripts/mv-harnais-caveauj2.mjs --contre'],
  ['node scripts/mv-harnais-cavepil1.mjs'],
  ['node scripts/mv-harnais-cavepil1.mjs --contre'],
  ['node scripts/mv-harnais-cavepil2.mjs'],
  ['node scripts/mv-harnais-cavepil2.mjs --contre'],
  ['node scripts/mv-harnais-caveauj3.mjs'],
  ['node scripts/mv-harnais-caveauj3.mjs --contre'],
  ['node scripts/mv-harnais-cave2.mjs'],              // CAVE-2 (§289) : le Cuvier à la charte
  ['node scripts/mv-harnais-cave2.mjs --contre'],
  ['node scripts/mv-harnais-cave3.mjs'],              // CAVE-3 (§290) : le Chai en liste + fiche
  ['node scripts/mv-harnais-cave3.mjs --contre'],
  ['node scripts/mv-harnais-cave4.mjs'],              // CAVE-4 (§291) : le Millésime à la charte
  ['node scripts/mv-harnais-cave4.mjs --contre'],
  ['node scripts/mv-harnais-rsv1.mjs'],               // RSV-1 (§292) : la Réserve › Fûts à la charte
  ['node scripts/mv-harnais-rsv1.mjs --contre'],
  ['node scripts/mv-harnais-rsv2.mjs'],               // RSV-2 (§293) : la Réserve › Intrants à la charte
  ['node scripts/mv-harnais-rsv2.mjs --contre'],
  ['node scripts/mv-harnais-rsv3.mjs'],               // RSV-3 (§294) : le Bilan matière à la charte
  ['node scripts/mv-harnais-rsv3.mjs --contre'],
  ['node scripts/mv-harnais-rg1.mjs'],                // RG-1 (§295) : Réglages › Domaine à la charte
  ['node scripts/mv-harnais-rg1.mjs --contre'],
  ['node scripts/mv-harnais-rg2.mjs'],                // RG-2 (§296) : Réglages › Équipe et Moi à la charte
  ['node scripts/mv-harnais-rg2.mjs --contre'],
  ['node scripts/mv-harnais-coul1.mjs'],              // COUL-1 (§297) : teintes plus franches, fond un peu plus soutenu
  ['node scripts/mv-harnais-coul1.mjs --contre'],
  ['node scripts/mv-harnais-pil1.mjs'],               // PIL-1 (§298) : les sept onglets du Pilotage à la charte
  ['node scripts/mv-harnais-pil1.mjs --contre'],
  ['node scripts/mv-harnais-pro1.mjs'],               // PRO-1 (§269) : la barre à sa vraie largeur, les boutons du cockpit, la consommation refaite
  ['node scripts/mv-harnais-pro1.mjs --contre'],
  ['node scripts/mv-harnais-vif1.mjs'],               // VIF-1 (§414) : Aujourd'hui en direct, pastilles de la barre, trois défauts
  ['node scripts/mv-harnais-vif1.mjs --contre'],
  ['node scripts/mv-harnais-etats1.mjs'],             // ETATS-1 (§415) : états francs sur les plans, quatre finitions du Pilotage
  ['node scripts/mv-harnais-etats1.mjs --contre'],
  ['node scripts/mv-harnais-accv1.mjs'],
  ['node scripts/mv-harnais-accv1.mjs --contre'],
  ['node scripts/mv-harnais-accv2.mjs'],             // ACCV-2 (§417) : l'Accueil Vigne en sept cartes (maquette, lots 2 à 4)
  ['node scripts/mv-harnais-accv2.mjs --contre'],
  ['node scripts/mv-harnais-accv4.mjs'],
  ['node scripts/mv-harnais-accv4.mjs --contre'],
  ['node scripts/mv-harnais-anticipe1.mjs'],          // ANTICIPE-1 (§420) : les points à anticiper en tête d'« À savoir », la phrase qui y mène, les absences
  ['node scripts/mv-harnais-anticipe1.mjs --contre'],
  ['node scripts/mv-harnais-jeq1.mjs'],
  ['node scripts/mv-harnais-jeq1.mjs --contre'],
  ['node scripts/mv-harnais-tuto9.mjs'],             // TUTO-9 (§423) : le Journal du domaine fictif, l'étape « Enregistrer », test:tutos qui joue tout et compte, la marque qui exige les tutos rejoués
  ['node scripts/mv-harnais-tuto9.mjs --contre'],
  ['node scripts/mv-harnais-cote1.mjs'],             // COTE-1 (§424) : le panneau du tuto collé à droite, l'inventaire des couches fixes, la barre latérale, le « + »
  ['node scripts/mv-harnais-cote1.mjs --contre'],
  ['node scripts/mv-harnais-etain1.mjs'],            // ETAIN-1 (§426) : les icônes en relief — la charte, le bloc de la feuille, « Plus » allumé, la tuile de la barre latérale
  ['node scripts/mv-harnais-etain1.mjs --contre'],
  ['node scripts/mv-harnais-tuto10.mjs'],            // TUTO-10 (§425) : l'aiguillage — seulement les tutos que le changement touche ; test:tutos --concernes ; la marque qui exige la couverture
  ['node scripts/mv-harnais-tuto10.mjs --contre'],
  ['node scripts/mv-harnais-perdate1.mjs'],          // PERDATE-1 (§427) : une date impossible (31/09) n'est pas une case vide — les deux fenêtres de période, une seule liste de tâches
  ['node scripts/mv-harnais-perdate1.mjs --contre'],
  ['node scripts/mv-harnais-jcave1.mjs'],          // JCAVE-1 (§428) : les journées de cave — la marque (Planning, équipes du jour), le temps réel, la capacité
  ['node scripts/mv-harnais-jcave1.mjs --contre'],
  ['node scripts/mv-harnais-diag1.mjs'],          // DIAG-1 (§429) : le diagnostic du Chai — six cuvées du domaine fictif, sur le vrai _laboLignes et le vrai module
  ['node scripts/mv-harnais-diag1.mjs --contre'],
];

/* ── BUILD-1 (§305) — COMMENT LE LANCEUR JOUE LA LISTE ─────────────────────────
   Le lanceur fait tourner les commandes À PLUSIEURS EN MÊME TEMPS. C'est sans danger tant qu'une
   commande ne fait que LIRE le dépôt. Deux familles écrivent dedans :

   SEULS — elles écrivent dans le dépôt PENDANT la liste. Le lanceur les joue EN PREMIER, une par
   une, avant toutes les autres. Ajouter un harnais qui écrit dans src/, scripts/ ou un vrai fichier
   = une ligne ici, avec sa raison. mv-harnais-lanceur rougit sinon. */
export const SEULS = {
  'scripts/mv-harnais-cuvgr3.mjs': "ses contre-epreuves reecrivent un VRAI fichier de src/ (cave, utils) le temps d'un essai, puis le rendent",
  'scripts/mv-harnais-releve.mjs': 'ses contre-epreuves posent src/.mv-ko-rlv-N.js, que les controles qui listent src/ liraient',
  'scripts/mv-harnais-fuseau.mjs': 'ses contre-epreuves posent src/.mv-ko-tz-N.js, que les controles qui listent src/ liraient',
  'scripts/mv-harnais-vignoble.mjs': 'ses contre-epreuves posent src/.mv-ko-vgn-N.js (meme raison) — trouve par mv-harnais-lanceur a sa mise en service',
  'scripts/mv-harnais-entretien.mjs': 'ses contre-epreuves posent src/.mv-ko-ent-N.js (meme raison) — idem',
  'scripts/mv-harnais-gt1.mjs': 'charge ses modules depuis scripts/.mv-gt1-*.mjs, que harnais-claude-md compterait comme un script muet',
  'scripts/mv-harnais-ids1.mjs': 'charge depuis scripts/.mv-ids1-*.mjs (meme raison)',
  'scripts/mv-harnais-ids1b.mjs': 'charge depuis scripts/.mv-ids1b-*.mjs (meme raison)',
  'scripts/mv-harnais-renom-parc.mjs': 'charge depuis scripts/.mv-renp-*.mjs (meme raison)',
};

/* LOURDES — ★ CHARGE-1 (§391) : des commandes qui prennent beaucoup de mémoire ou de processeur. Le lanceur n’en fait tourner
   que quelques-unes en même temps (MV_LOURDS, 2 par défaut) ; une commande qui a duré plus d’une minute au build d’avant
   est lourde d’office. Mesures du PC de Nico le 20/10, douze à la fois : 4 rouges de charge — Node tué (code 134), ESLint,
   preflight, icônes. Une ligne par commande, avec sa raison ; mv-harnais-lanceur refuse une entrée hors de la liste. */
export const LOURDS = {
  'node scripts/mv-harnais-recup.mjs --contre': '290 à 330 s, la plus longue de la liste',
  'node scripts/preflight.mjs': '200 à 240 s : environ 450 `node --check` lancés l’un après l’autre — rouge deux fois sous la charge',
  'node scripts/mv-harnais-icones-contre.mjs': '200 à 230 s, rejoue l’appli dans un bac à sable — rouge sous la charge',
  'node scripts/mv-harnais-robustesse-planning.mjs --contre': '160 à 200 s',
  'node scripts/mv-harnais-robustesse-pilotage.mjs --contre': '110 à 140 s',
  'node scripts/mv-harnais-pic-avenir.mjs --contre': 'tuée par manque de mémoire (code 134) quand les lourdes tournaient ensemble',
  'node scripts/lint-cliquet.mjs': 'ESLint sur tout src/ — rouge (code 2) sous la charge',
};

/* ECRIT_HORS_LISTE — elles écrivent dans le dépôt, mais SEULEMENT sous un drapeau que la liste ne
   passe jamais. mv-harnais-lanceur vérifie que la liste ne le passe pas (ou passe bien --check / --test). */
export const ECRIT_HORS_LISTE = {
  'scripts/preflight.mjs': '--baseline',
  'scripts/mv-harnais-icones.mjs': '--baseline',
  'scripts/mv-harnais-echelle.mjs': '--baseline',
  'scripts/mv-harnais-jetons.mjs': '--baseline',
  'scripts/mv-harnais-subset.mjs': '--baseline',
  'scripts/mv-harnais-typo.mjs': '--baseline',
  'scripts/mv-harnais-contraste.mjs': '--baseline',
  'scripts/banc/banc.mjs': '--engraver',
  'scripts/mv-claude-index.mjs': 'sans --check',
  'scripts/build-guide.mjs': 'sans --check',
  'scripts/mv-sitemap.mjs': 'sans --check',
  'scripts/mv-version-json.mjs': 'sans --test',
};
