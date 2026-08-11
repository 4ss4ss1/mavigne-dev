// MA VIGNE — Service Worker v6.41
// v6.41 (11/08/2026) — Vocabulaire du planning : « pause déjeuner » devient
//                       « coupure déjeuner », le mot pause restant réservé à la
//                       pause légale. Nouveau réglage de l'heure de coupure
//                       (fixe / selon le chantier / non renseigné), 6e colonne
//                       facultative du CSV, cliquet scripts/lint-vocabulaire.mjs.
// v6.40 (11/08/2026) — Nouveau document « Planning de l'année » : le rythme de
//                       l'équipe sur douze mois, avec heures de prise et de fin de
//                       service et coupure déjeuner déduite de l'amplitude. Une page
//                       par modèle de semaine. Ajouté au hub Documents (reglages.js),
//                       généré par planning.js via la charte MV_DOC.
// v6.39 (10/08/2026) — Ordre des trois onglets de la Cave : Le Cuvier, Le Chai,
//                       Le millesime. Le raisin entre au cuvier avant de partir au
//                       chai ; les onglets suivaient l'ordre inverse. Trois blocs
//                       deplaces dans index.html, rien d'autre : la section par
//                       defaut reste Le Chai (caveSection = 'elevage') et
//                       _caveSyncSecTabs resynchronise le bouton actif a chaque
//                       rendu, donc aucun ordre n'est code ailleurs. Suivent les
//                       trois supports d'accompagnement, meme lot : la fiche
//                       MV_AIDE de la Cave (sa phrase de synthese enumerait les
//                       sections dans l'ancien ordre - la liste, elle, se lit deja
//                       dans le DOM), la section Cave du guide public, et la
//                       description du module dans le masquage des Reglages, qui
//                       annoncait encore deux sections sur trois - vAPP 5.89
// v6.38 (10/08/2026) — Les graphiques dessinaient dans un cadre fixe de 940 a
//                       1000 unites que l'ecran reduisait ensuite. L'app etant
//                       bornee a 430 px sur telephone et 760 sur ordinateur,
//                       SEPT graphes n'etaient lisibles a AUCUNE largeur : 3 a
//                       7 px de texte. Le min-width:560px pose sur cinq d'entre
//                       eux ajoutait un defilement sans agrandir quoi que ce
//                       soit. Charte MV_GRAPH dans utils.js, generalisee du
//                       seul graphe qui faisait deja bien (_mlFluxSvg) : la
//                       largeur est MESUREE, posee en repere ET en attribut,
//                       donc une unite vaut un pixel. Seize SVG convertis, onze
//                       enregistres et repeints au redimensionnement, zero
//                       couleur en clair hors palettes categorielles et hors
//                       documents imprimes. Plus un ratio kg/hL unique (135
//                       etait en dur a deux endroits) et un seul sens de lecture
//                       pour les rendements par millesime - vAPP 5.88
// v6.37 (09/08/2026) — Les ecartements de plantation avaient un reglage mais pas
//                       de porte : window._tcvSetDens n'etait atteignable que depuis
//                       le modal du bareme, ouvert par un bouton libelle « Nouvelle
//                       tache ». Le conseil de la Mise en route menait deja, lui,
//                       sur Reglages > Vigne, ou le reglage ne figurait pas : geste
//                       promis, ecran vide. Nouvelle section « Vos plantations » dans
//                       cet onglet, qui appelle la MEME fonction et affiche les deux
//                       ecartements plus les pieds/ha. Le bandeau du modal reste, il
//                       devient un doublon d'affichage assume - vAPP 5.87
// v6.36 (09/08/2026) — Mise en route sur l'Accueil de l'administrateur : sept
//                       etapes qui se cochent en LISANT ce qui est deja en base, sans
//                       une seule case a remplir. Chacune mene au bon ecran, sauf
//                       celles que le client ne peut pas faire lui-meme (parcelles et
//                       contours, poses a l'installation) : elles se constatent, elles
//                       n'envoient nulle part. Le bloc s'efface quand tout est fait,
//                       ou se reduit a un seul conseil utile (SIRET, ecartements de
//                       plantation) — ce qui absorbe le rappel MT-A sans ecran neuf.
//                       Admin seulement. Nouveau widget 'demarrage' en tete de
//                       HOME_WIDGETS et HOME_NEW_TOP, masquable par l'oeil comme les
//                       autres. CSS injecte par app.js, styles.css intact - vAPP 5.86
// v6.35 (09/08/2026) — L'aide « ? Aide » de chaque module decrivait des ecrans
//                       d'il y a plusieurs mois : le Pilotage y annoncait six onglets
//                       quand il en a sept, en nommant deux qui n'existent plus ;
//                       la Cave et La Reserve ignoraient le parc a futs, la
//                       separation des millesimes et les documents ; le Journal et
//                       les Reglages renvoyaient l'export au mauvais endroit.
//                       Les dix fiches sont refaites. Surtout : un point d'aide peut
//                       desormais etre une FONCTION evaluee a l'ouverture, et la
//                       liste des onglets est LUE dans le code (window._PIL_TABS,
//                       expose par pilotage.js) ou a l'ecran — elle ne peut plus
//                       vieillir toute seule. Preflight C22 vert.
//                       WHATS_NEW annonce aussi le correctif de l'ecart de cadence
//                       d'Economie du 09/08, livre dans pilotage.js seul et donc
//                       reste muet jusqu'ici - vAPP 5.85
// v6.34 (09/08/2026) — La visite guidee publique visait un onglet du Pilotage
//                       qui n'existe plus : la cle `ecf` a disparu au regroupement
//                       des onglets. querySelector rend null sans lever, donc le
//                       catch de repli ne s'est jamais declenche : le moment « le
//                       cout reel par parcelle » restait sur l'onglet courant, avec
//                       le projecteur pose au hasard — sur le lien de demo publie.
//                       Meme defaut dans la demo a code. Corrige, et un bouton
//                       introuvable est desormais trace au lieu d'etre muet.
//                       Au preflight : nouveau controle C22 — l'aide contextuelle
//                       et la visite guidee ne peuvent plus decrocher du code sans
//                       que le build le dise (cles d'onglet retirees, selecteurs,
//                       fonctions de navigation, fiches sans page, ancres du guide).
//                       Aucun ecran client modifie - WHATS_NEW inchange - vAPP inchange
// v6.33 (09/08/2026) — Rien de faux affiche au client : le carnet d'entretien
//                       portait un numero de version fige (v4.26) et le log de
//                       chargement un autre (v2.84b) ; les deux lisent desormais
//                       APP_VERSION. L'ecran d'installation annoncait l'import KML
//                       comme "prochainement" alors qu'il est fait a l'installation.
// v6.32 (09/08/2026) — Suite de la charte : les cinq documents restants
//                       (rapport de saison, releve mensuel, registre phyto, fiche
//                       salarie, carnet d'entretien) chargent enfin /fonts/fonts.css
//                       et passent a la police du domaine. Le rapport de saison
//                       demandait Outfit sans jamais la charger. Marges et covers
//                       propres inchangees : mises en page calibrees, a arbitrer
//                       sur epreuve papier.
// v6.31 (09/08/2026) — Charte commune des documents (MV_DOC dans utils.js) :
//                       meme format de page, memes polices, meme en-tete a filet
//                       d'or et meme pied. Appliquee a la Cave (recoltes, rapport
//                       d'operations) et a La Reserve (bilan matiere, inventaire
//                       des futs). Les deux documents de la Cave s'impriment au
//                       lieu de telecharger un fichier .html a rouvrir a la main.
// v6.30 (09/08/2026) — Suite du hub : les anciens raccourcis d'export sont
//                       retires de la Cave (rapport d'operations, recoltes,
//                       registre des manipulations) et de La Reserve (bilan
//                       matiere). Restent en place ceux dont le document depend
//                       de l'ecran : inventaire des futs, bilan de campagne,
//                       registre phyto CSV, fiche salarie, CSV planning et couts,
//                       carnet d'entretien.
// v6.29 (09/08/2026) — Documents & impressions : un seul endroit. Les documents
//                       partaient de quatre boutons repartis dans six ecrans ; la
//                       section Import/Export de Reglages devient le hub unique,
//                       classe par usage (obligatoire / suivi / donnees brutes).
//                       Le releve mensuel et le reglage des heures de saison ont
//                       leur propre panneau. Aucune fonction de generation touchee.
// v6.28 (09/08/2026) — Le Cuvier prend la peau de la Cave. Il etait le seul
//                       ecran sombre, avec un accent framboise qu'on ne trouve
//                       nulle part ailleurs. Desormais : les chiffres passent
//                       dans la bande commune sous l'en-tete, comme Le Chai et
//                       Le millesime, puis onglets et cartes sur papier. Or pour
//                       ce qui est actif, vert pour ce qui est a jour, terre
//                       cuite pour ce qui est du. Corrige au passage sept textes
//                       herites du sombre, illisibles dans les fenetres claires
//                       « Nouvelle recolte » et « Cuve ». APP 5.80 (inchange).
// v6.27 (09/08/2026) — Soutirage : une seule verite, l'operation datee. Le
//                       bouton « Soutirer » du Pilotage ouvrait le CUVIER
//                       (_mlGo ne connaissait pas ce kind et repliait sur les
//                       cuves) ; le toggle « sous tirage » de la fiche de cuvee
//                       est retire — un oui/non ne peut pas decrire un geste
//                       repete. _caveLastSout/_caveSoutOps deviennent la source
//                       unique, consommee par le Pilotage. Un soutirage
//                       anterieur a la fin de malo n'acquitte plus le geste.
//                       Annonce aussi les lots C et D du 07/08, restes muets :
//                       part des anges et ouillage par millesime, registre et
//                       bilan par millesime. APP 5.80.
// v6.26 (07/08/2026) — Chai : seuil d'ouillage reglable PAR MILLESIME
//                       (config.ouillage_par_mil, repli sur le seuil global :
//                       aucun domaine existant ne bouge). Source unique
//                       _caveSeuilOu — 8 lecteurs y passent, plus de copies.
//                       Le bandeau de KPIs et l'alerte suivent enfin le filtre
//                       millesime, qui existait deja. APP 5.79.
// v6.25 (07/08/2026) — Cave : une operation porte sur UN SEUL millesime. Selecteur
//                       d'annee en tete du formulaire, cuvees filtrees, « Toutes »
//                       borne au millesime courant, garde finale avant ecriture.
//                       Corrige _mlVolParFut, qui testait o.cuvees au lieu de
//                       o.cuvees_ids : le volume propose venait de TOUS les
//                       ouillages du domaine. APP 5.78.
// v6.24 (07/08/2026) — Malo : l'acide malique se saisit dans l'analyse (index.html),
//                       et _mlProjMalo projette la fin de malo de CHAQUE cuvee sur ses
//                       propres mesures, jamais sur une duree moyenne. Deux pentes,
//                       comme la FA : moyenne sur 3 pour la date, 2 dernieres pour le
//                       blocage. Pilotage > Cave refondu en 3 vues decisionnelles.
//                       Corrige aussi une perte : une analyse editee ecrasait ses SO2
//                       et son AV avec le contenu du DOM. APP 5.77.
// v6.23 (07/08/2026) — Bilan de campagne : un etat interne de fin d'annee, imprimable,
//                       qui agrege la vigne (journal), la recolte, le flux benne ->
//                       bouteille, le chai, le parc a futs et la protection. Aucun
//                       calcul neuf : il consomme _mlChaine, _mvFutParc et _rmLignes.
//                       Deux portes : Pilotage > Archives et Reglages > Import/Export.
//                       Ce n'est pas une declaration. APP 5.76.
// v6.22 (06/08/2026) — Cave : au decuvage, les barriques se choisissent dans le parc
//                       a futs (tonnelier + annee), elles en sortent et emportent leur
//                       identite ; l'age des futs d'une cuvee neuve est enfin juste.
//                       Nouveau registre des manipulations oenologiques, imprimable,
//                       depuis Le Cuvier > Reglages et Reglages > Import/Export.
//                       Etat interne, jamais une declaration. APP 5.75.
// v6.21 (06/08/2026) — Parc a futs : un fut entre et sort, et c'est trace.
//                       La mise en bouteille rend les futs de la cuvee au parc ;
//                       retirer un fut d'une cuvee le libere aussi, sauf si on le
//                       jette. Nouveau geste « Se separer de futs » (vente, retour
//                       au tonnelier, destruction) dans La Reserve, avec registre
//                       des mouvements. Moteur partage dans utils.js (_mvFut*),
//                       appele par cave.js ET reserve.js. APP 5.74.
// v6.20 (06/08/2026) — Cave : troisieme ecran « Le millesime », a cote du Chai et du
//                       Cuvier. Onglet « Ce qui vient » : futs a ouiller, cuves a
//                       mesurer, fin de fermentation estimee, fermentation qui
//                       ralentit, sur quatre semaines. Onglet « La ligne de vie » :
//                       parcours du millesime de la vigne a la bouteille, rendement
//                       par parcelle face au maximum de l'appellation, origine de
//                       chaque cuvee. Aucune saisie nouvelle : tout est deduit.
//                       APP 5.73. Axe campagne remonte dans utils.js (_mvCampagneDe),
//                       pilotage.js pointe dessus au lieu d'en garder une copie.
// v6.19 (06/08/2026) — Panneau GUERETTECH : 8 onglets deviennent 6, avec un Radar
//                       en page d'accueil (ce qui demande une action aujourd'hui),
//                       une fiche client qui reunit facturation, incidents et acces,
//                       et un onglet Outils pour la maintenance. Invisible cote client.
// v6.18 (06/08/2026) — SEC-GT/2 : le mot de passe ne suffit plus à ouvrir le panneau
//                       GUERETTECH. Un code à usage unique part sur la boîte de
//                       l'opérateur et ouvre une session de 8 h (claim `gts`), que les
//                       règles Firestore exigent désormais : un mot de passe qui fuit
//                       ne donne plus accès aux données clients, même par le SDK.
//                       Invisible côté client.
// v6.17 (06/08/2026) — SEC-GT : le panneau GUERETTECH n'est plus atteignable sur la
//                       foi d'un drapeau JS. goTo('admin-gt') est gardé, renderAdminGT
//                       exige le claim serveur gtAdmin lu dans le jeton, la session GT
//                       ne survit plus à la fermeture de l'onglet (browserSessionPersistence)
//                       et se verrouille après 15 min d'inactivité. AXE A : deux onglets
//                       Business (MRR, essais, facturation) et Leads (formulaire public,
//                       collection leads jamais affichée jusqu'ici). Invisible côté client.
// v6.16 (05/08/2026) — LE CHAI S'OUVRAIT VIDE AU PREMIER ACCES. cave.js initialisait
//                       caveTab a 'dash' — un onglet de tableau de bord PURGE depuis longtemps,
//                       absent des quatre onglets reels (cuv / journal / reglages / bouteille).
//                       renderCave() passait donc 'dash' a switchCaveOng(), dont la boucle masque
//                       les 4 vues ET desactive les 4 boutons : ecran vide, aucun onglet
//                       surligne, aucune erreur, aucune trace, aucun test qui le voie. Il fallait
//                       cliquer un onglet pour que le Chai apparaisse. Corrige en TROIS gestes
//                       indissociables : (1) valeur initiale 'cuv' ; (2) FILET DE TOLERANCE en
//                       tete de switchCaveOng — toute valeur hors liste replie sur 'cuv', meme
//                       patron que switchPhytoTab ; sans (2), une valeur inconnue reposee plus
//                       tard reproduit le bug a l'identique ; (3) les deux lignes de app.js
//                       (page==='cave') qui reposaient caveTab='dash' et caveSection=null sont
//                       SUPPRIMEES : elles ne faisaient rien (ni caveTab ni caveSection ne sont
//                       exposes sur window, les gardes if(window.X!==undefined) etaient fausses)
//                       mais ressusciteraient le bug le jour ou ils le seraient.
//                       + La liste des 4 onglets n'est plus ecrite qu'UNE fois dans la fonction
//                         (le filet et la boucle d'affichage lisent la meme constante locale) :
//                         deux definitions du meme concept = incoherence garantie.
//                       + ANCIEN NUMERO DE TELEPHONE encore vivant : app.js portait 2 fois
//                         06 22 07 47 86 (dont un tel:+33622074786), au pied de l'ecran du code
//                         demo et dans le message << Periode d'essai expiree >>. Remplacees par
//                         06 99 42 48 59. Verifie par grep sur tout le depot, DANS LES DEUX
//                         FORMATS (espace et compact) : il n'en reste aucune.
//                       + APP_VERSION INCHANGEE (utils.js non touche) et WHATS_NEW inchange :
//                         correctif invisible du point de vue du recap client, bump SW SEUL.
//                       + 0 catch{} ajoute (app.js 165, cave.js 4 — cliquet C14). 27 scenarios
//                         executes sur les vraies fonctions extraites de cave.js.
// v6.15 (05/08/2026) — LA SNAPSHOT localStorage : QUATRE DEFAUTS DANS LE MEME BLOC.
//                       (1) la copie de secours du jour etait REECRITE a CHAQUE saveData
//                           -- des dizaines de fois par jour pour un contenu quasi
//                           identique. Elle ne s'ecrit plus qu'UNE fois par jour.
//                       (2) elle etait batie en RELISANT localStorage juste apres y
//                           avoir ecrit : on reutilise desormais la chaine JSON deja en
//                           main (UNE serialisation, UNE ecriture, ZERO relecture).
//                       (3) la purge ne regardait que l'AGE : 7 copies + la copie
//                           courante ne tiennent pas dans les ~5 Mo du localStorage des
//                           qu'un domaine a deux ans d'historique -> on borne le VOLUME
//                           (_MV_BK_MAX = 3 copies, les plus recentes).
//                       (4) le catch etait VIDE. Sur QuotaExceededError (3 noms : std,
//                           Firefox, Safari/iOS code 22) on purge les copies de secours,
//                           on retente UNE fois, et si ca echoue encore ON LE DIT :
//                           logError level:'warning' cat:'storage' + toast orange
//                           #B85A1A, au plus 1 toutes les 10 min. Une sauvegarde locale
//                           qui echoue en silence, c'est << j'ai tout perdu en zone
//                           blanche >>.
//                       + ECRITURE GROUPEE 2 s, le dernier appel gagne, avec flush
//                         immediat sur visibilitychange et pagehide -- meme patron que
//                         le stepper de futs de La Reserve. Vingt validations d'affilee
//                         ne serialisent plus vingt fois tout le domaine.
//                       + ATTENTION : _mvSnapCancel() est appele par logout() ET par
//                         resetData(). Sans lui, une snapshot EN ATTENTE se reecrirait
//                         APRES la purge SEC-5 -- les donnees du domaine survivraient a
//                         la deconnexion sur un poste partage, et resetData() ne
//                         reinitialiserait rien. Toute future purge volontaire de LS_KEY
//                         doit appeler _mvSnapCancel() AVANT d'effacer.
//                       + Contenu ecrit STRICTEMENT identique a l'ancien chemin
//                         (_mvSnapPayload, memes cles, meme ordre). 43 tests executes.
//                       + 4 catch{} vides en moins dans app.js (169 -> 165, cliquet C14)
//                         -> la baseline du preflight signalera une BAISSE : la regraver.
// v6.14 (05/08/2026) — L'EXERCICE COMPTABLE DANS PILOTAGE > ECONOMIE. L'onglet ne
//                       savait chiffrer qu'une CAMPAGNE (structurel : surface x bareme
//                       x taux, sans aucune date). Un bilan, lui, est une fenetre de
//                       dates : impossible de decouper l'un pour obtenir l'autre.
//                       Nouvelle sous-vue << Exercice >>, moteur separe sur les faits
//                       DATES, defaut 1er aout N -> 31 juillet N+1 (CONFIG.eco.exercice_mois).
//                       + PIEGE EVITE : la conduite du tracteur est DEJA dans les heures
//                         du planning ; ne s'ajoute donc que le CARBURANT, jamais le
//                         cout de conduite (sinon le tractoriste etait paye deux fois).
//                       + _planRangeH (planning.js) : UN parcours, DEUX mesures
//                         (paid=_planDayH socle paye / work=_planWorkH travail effectif),
//                         effectif des equipes collectives integre, annee-aware.
//                       + _ecoTracHByParc / _ecoPhytoByParc prennent une fenetre
//                         OPTIONNELLE : sans argument, comportement inchange.
//                       + _mvExercice/_mvExerciceAn/_mvExerciceList (utils.js) = source
//                         unique de la fenetre, comme CONFIG.cp_periode_debut pour les CP.
// v6.13 (05/08/2026) — LA TOURNEE ARRIVE SUR L'ECRAN DE L'EQUIPE. Pilotage >
//                       Decider > Ordre de passage ecrivait CONFIG.ordre_passage
//                       et affichait « partage a l'equipe » : verifie par grep,
//                       AUCUN autre fichier ne le lisait. Le message etait faux
//                       depuis le premier jour.
//                       + ordre range PAR TACHE (CONFIG.ordre_passage_t) : deux
//                         equipes sur deux travaux voient chacune sa tournee ;
//                         cocher plusieurs travaux ecrit le meme ordre pour tous.
//                       + Vigne trie les parcelles dans cet ordre et affiche le
//                         numero sur la fiche ET sur l'etiquette de la carte.
//                       + numerotation VIVANTE : rang recalcule sur les parcelles
//                         affichees (1,2,3... sans trou), comme _opParcelles.
//                       + priorite : arrachees > proximite GPS > tournee > statut.
//                       + bouton « Tri normal » memorise par utilisateur, bouton
//                         « Retirer » cote admin (on pouvait publier, jamais
//                         depublier), et toast honnete : config est lu au
//                         demarrage, la tournee arrive a la prochaine ouverture.
//                       + helpers _mvOrdreMap/_mvOrdreFor/_mvOrdreTaches/
//                         _mvOrdreRangs dans utils.js : app.js et pilotage.js
//                         posent la meme question, une seule reponse possible.
// v6.12 (04/08/2026) — REGISTRE PHYTO EXPORTABLE (Excel/CSV). Le registre n'existait
//                       qu'en PDF, or le reglement (UE) 2023/564 et l'arrete du
//                       24/12/2025 exigent un registre tenu sous forme ELECTRONIQUE,
//                       LISIBLE PAR MACHINE : un PDF imprime n'en est pas un. Nouveau
//                       bouton (bas du registre + Reglages > Export) -> window._phytoExportCsv,
//                       une ligne par produit ET par parcelle (la localisation est
//                       exigee pour chaque surface traitee), colonnes dans l'ordre de
//                       l'annexe II cas A. Contenu obligatoire depuis le 01/01/2026 ;
//                       format electronique ferme au 01/01/2027.
//                       + CONFIG.siret et CONFIG.bio saisis dans Reglages > Domaine
//                         (l'annexe les impose sur chaque ligne).
//                       + window._mvParcGeo/_mvKmlCtrs EXTRAITS de pilotage.js vers
//                         utils.js : les parcelles n'ont pas de GPS propre, la position
//                         se deduit du centroide du polygone KML — deux copies du calcul
//                         auraient donne deux reponses a la meme question.
//                       + exportCSVJournal/Parcelles passent au POINT-VIRGULE et a la
//                         decimale francaise : avec la virgule, Excel FR entassait tout
//                         dans une seule colonne.
// v6.11 (04/08/2026) — BAREMES REGIONAUX. TACHES_CATALOGUE portait les heures de la Cote
//                       de Nuits comme s'il s'agissait d'une verite generale : hors de
//                       Bourgogne elles sont fausses d'un facteur 2 a 3. MV_BAREMES
//                       (app.js) accueille desormais plusieurs jeux, et le domaine choisit
//                       le sien dans le panneau « Bareme de la convention ». Deux jeux au
//                       depart : Cote de Nuits (accord du 2 octobre 2023) et Gironde hors
//                       Medoc, guyot simple (avenant n°12 du 30 juin 2021, IDCC 9331,
//                       art. 89 — temps exprimes AUX 1000 PIEDS dans le texte, ramenes ici
//                       a 10 000 pieds/ha). ⚠️ Un bareme regional est un CALQUE : il ne
//                       redefinit que des heures, jamais la structure des travaux — donc
//                       ajouter une region = une entree dans MV_BAREMES, rien d'autre. Un
//                       travail que le bareme ne prevoit pas (Accolage et Palissage n'ont
//                       pas d'equivalent girondin hors Medoc) reste SANS valeur conseillee :
//                       mieux vaut ne rien dire que dire faux. ⚠️ Le bareme regional
//                       s'applique AVANT la densite (v6.10) : les deux reglages se
//                       composent et restent independants. ⚠️ Changer de bareme ne touche
//                       AUCUNE donnee du domaine — seules les valeurs CONSEILLEES bougent.
//                       CONFIG.bareme, repli sur 'cote-nuits' si la cle est inconnue.
// v6.10 (04/08/2026) — DENSITE DE PLANTATION. Le bareme de TACHES_CATALOGUE vaut pour
//                       10 000 pieds/ha (vigne basse, 1 x 1 m) : c'est une constante
//                       REGIONALE, fausse d'un facteur 2 a 3 des qu'on sort de la Cote
//                       de Nuits. L'accord du 2 octobre 2023 prevoit lui-meme qu'en cas
//                       de densite differente les temps se calculent AU PRORATA du
//                       nombre de pieds/hectare — la regle n'est donc pas inventee ici.
//                       CONFIG.vigne = {ec_rang, ec_pied} se saisit dans le panneau
//                       « Bareme de la convention » (deux openPrompt, jamais prompt()).
//                       Helpers utils.js : MV_DENS_REF, _mvPiedsHa, _mvVigne,
//                       _mvDensCoef, _mvHhaDens. ⚠️ AUCUN calcul d'heures ne change :
//                       TACHES[].hha reste la seule source. La densite ne fait que
//                       PROPOSER — « Conseille 23 (bareme 70) » — et le bouton de
//                       remise a zero pose la valeur ajustee. Le marqueur « votre
//                       valeur » compare desormais au bareme RAMENE a la densite, sinon
//                       un domaine correctement cale aurait vu toutes ses taches
//                       signalees. ⚠️ NEUTRE PAR DEFAUT : sans ecartements renseignes le
//                       coefficient vaut 1 et rien ne bouge — verifie par execution sur
//                       les donnees reelles des deux domaines clients.
// v6.09 (04/08/2026) — PLOMBERIE DES TACHES, deux pertes silencieuses. (1) tcfgSave
//                       (reglages.js) reconstruisait l'entree de zero : ni saisons ni
//                       anytime ni conv n'etaient reecrits, donc _normalizeTaches
//                       reposait au rechargement les saisons du CATALOGUE. Ouvrir
//                       « Pioche » et enregistrer SANS RIEN CHANGER la faisait passer
//                       d'Automne a Printemps — verifie par execution sur les donnees
//                       reelles d'un domaine client. Il repart desormais de l'existant.
//                       (2) _normalizeTaches (app.js) reconstruisait elle aussi champ
//                       par champ : tout champ hors de sa liste blanche disparaissait AU
//                       CHARGEMENT, sans erreur, puis etait efface en base au premier
//                       saveData('taches'). Preuve vivante : t.count, ecrit par tcfgSave
//                       et detruit au rechargement suivant. Elle part maintenant de
//                       Object.assign({},t) et n'impose que ce qui vient du catalogue —
//                       la NATURE du travail. C'est le prealable a tout barème portant
//                       une unite ou une densite, qui aurait subi le meme sort.
//                       Au passage : t.count supprime (redondant avec passagesHha.length
//                       et niveaux.length), et openTacheCfg derive ce nombre de l'entree
//                       DU DOMAINE et non du catalogue. Round-trip prouve identique sur
//                       les docs reels de Marchand-Grillot et de Chapelle.
// v6.08 (04/08/2026) — HEURES SAUTEES : un niveau marque « Auto » (pose tout seul quand
//                       on valide directement le dernier relevage) comptait comme un
//                       passage reellement fait. Un relevage mene en UN passage pesait
//                       donc 100 h/ha au lieu de 50 — sur presque toutes les parcelles,
//                       soit pres de 600 h fantomes sur une campagne de 12 ha : cout de
//                       main-d'oeuvre par parcelle gonfle, et ecart de cadence penchant
//                       a tort vers « l'equipe va plus vite que le bareme ». Regle
//                       arbitree : N passages faits = les N PREMIERS niveaux du bareme
//                       (un relevage unique est le travail d'un PREMIER relevage), et un
//                       passage saute sort AUSSI du reste a faire, sinon on remplace un
//                       travail imaginaire par une dette imaginaire. Fonction unique
//                       window._mvNivH (utils.js), appelee par recalcTravaux (app.js,
//                       2 sites) ET par pilotage.js, qui portait sa PROPRE copie du
//                       calcul. La surface faite ne bouge pas : une parcelle relevee une
//                       fois reste terminee a 100 %.
// v6.07 (04/08/2026) — MENAGE : suppression de code mort (carte « Travaux par ouvrier »
//                       jamais rendue, regles CSS .mvt-end*, gardes des barres d'onglets
//                       Cave purgees d'index.html, en-tete maison de La Reserve remplace
//                       par .mod-header). Au passage, un vrai correctif : la garde
//                       #hv2-meteo-card en tete du catch meteo visait un id INEXISTANT,
//                       donc son return partait a tous les coups et le repli hors ligne
//                       (derniere meteo connue, badge « Hors ligne ») n'a jamais tourne.
// v6.06 (04/08/2026) — DOCK-4 : la barre du bas montre 4 modules au lieu de 3, et le
//                       bouton « Plus » disparait quand le domaine tient en 5 modules.
//                       Les deux changements sont indissociables : monter slice(0,3) a
//                       slice(0,4) sans monter la garde <=4 a <=5 aurait laisse un
//                       domaine a 5 modules avec 3 cases et un « Plus » n'en contenant
//                       que 2. Aucun changement CSS : .mv-dk est en flex:1.
// v6.05 (03/08/2026) — DECIDER-1 : l'onglet Decider disait faux sur quatre points.
//                       (1) la fenetre agronomique comptait les jours DEJA PASSES
//                       (65 j annonces au 15 juin sur une fenetre avril-juin qui n'en
//                       offre plus que 12) -> _mvFenetre() rend joursRestants, _mvProj
//                       s'y compare. (2) l'effectif conseille ignorait le temps de
//                       trajet et prescrivait donc l'equipe deja en place. (3) plusieurs
//                       taches cochees etaient jugees sur l'ENVELOPPE de leurs fenetres
//                       (141 j la ou les deux fenetres reelles en totalisent 64) ->
//                       fen.parTache[], un verdict par tache. (4) la surface de la
//                       journee 1 etait portee au jour de FIN de parcelle -> 0,00 ha
//                       affiche apres une journee pleine sur une grande parcelle.
//                       Simulateur « et si ? » : la fin de saison divisait par le POOL,
//                       elle est desormais celle de la DERNIERE tache finie (une tache
//                       sans personne ne finit pas). 22 scenarios executes.
// v6.04 (03/08/2026) — COLLECTIF-1 : membre « equipe collective » — une seule ligne de
//                       planning qui porte un effectif (vendange, prestataire). Effectif par
//                       defaut sur la fiche + effectif par jour via la selection multiple
//                       (bouton Effectif, fusion et non ecrasement de l'entree du jour).
//                       Ecarte de tout ce qui est individuel : 1607 h, conges, heures sup,
//                       maxima hebdomadaires, releve MSA. Pese son effectif dans le Sigma
//                       jour et dans la repartition de « Ma part du chantier ».
// v6.03 (03/08/2026) — EFFECTIF-1 : une fiche passée en Inactif n'efface plus le travail
//                       de la campagne — courbe « personnes / semaine », capacité d'équipe
//                       et taux horaire moyen comptent qui était sous contrat SUR LA PÉRIODE.
// v6.02 (03/08/2026) — DEMO-3c : cause racine du Cuvier noir corrigée (parcelles de cuve en
//                       TABLEAU — TypeError au rendu, prouvée en exécutant renderVendCuves),
//                       exceptions Chai/Cuvier tracées au journal des erreurs, ROI complet
//                       avec l'abonnement 79 €/mois : payé dès la première année.
// v6.01 (03/08/2026) — DEMO-3b : geste sur le VRAI conseiller (« meilleur placement »), ceinture
//                       vendange (Cuvier plein), permanents à 4, ROI à 7 lignes (> 2 000 €/an,
//                       saisonniers + info retrouvée), textes des seeds dé-échappés.
// v6.00 (02/08/2026) — DEMO-3 : spotlights sur les VRAIS conteneurs (Reserve, Chai, Cuvier,
//                       Planning), saisons de demo datees → simulateur Renfort et tableau ETP
//                       vivants, cinetique de densite au Cuvier, analyses comparees au Chai,
//                       fiche salarie ouverte pour le recap paie, ROI par module.
// v5.99 (02/08/2026) — DEMO-2e : l'addition dit aussi ce qui ne se compte pas en minutes —
//                       traçabilité (registre → bilan matière), mémoire du domaine (millésime
//                       après millésime), et les décisions du Pilotage.
// v5.98 (02/08/2026) — DEMO-2d : pointage du soir, retard d'une heure et récap fin de mois
//                       (acompte, heures sup, remplacement + récup) entrent dans la visite — 14 moments.
// v5.97 (02/08/2026) — DEMO-2c : Réserve, Chai et Cuvier entrent dans la visite (12 moments) ;
//                       chiffrage recalé sur le réel — 250 tâches validées janv→juil, ≈ 400/an à 5 min.
// v5.96 (02/08/2026) — DEMO-2b : l'addition définit la campagne (12 mois, récolte à récolte).
// v5.95 (02/08/2026) — DEMO-2 « L'addition » : visite guidée refaite (9 moments, narration en
//                       bandeau bas, compteur « de moins qu'au papier », décisions Pilotage,
//                       simulateur Renfort pré-réglé, écran final — 990 €).
// v5.94 (01/08/2026) — Annonce du lot UX-1 : APP 5.59, bloc « Nouveautés » (boîtes
//                       natives iOS, saisie du consommé, focus sur le champ manquant).
// v5.93 (01/08/2026) — UX-1 : suppression des boîtes natives alert()/confirm()/prompt(),
//                       BLOQUANTES en PWA iOS (prompt n'y affiche rien du tout). 13 alert
//                       (tracteur ×7, réglages ×4, app, phyto), 1 confirm (Admin GT) et le
//                       dernier prompt (La Réserve) remplacés par toast / #ovConfirmDel /
//                       nouvelle primitive #ovPrompt. + focus automatique sur le champ
//                       manquant quand une saisie est incomplète.
// v5.92 (31/07/2026) — IDENTITÉ : nouveau SIRET GUERETTECH (établissement …00022, SIREN
//                       inchangé) dans l'écran « À propos », les CGU et le DPA embarqués,
//                       le pied des rapports PDF phyto, et les pages publiques (mentions
//                       légales, confidentialité, CGU, DPA, guide, démarrage).
// v5.91 (30/07/2026) — METEO : la visite guidée polluait les caches météo (non rattachés au
//                       domaine), le cache par secteur n'était ni daté ni vérifié et sa seule
//                       présence interdisait tout nouvel appel, le drapeau anti-relance
//                       retombait après 50 ms (rafales d'appels → limite de débit), le statut
//                       HTTP n'était pas testé (429 → sablier muet), et ce SW servait du cache
//                       météo sans limite d'âge. + même modèle Météo-France pour l'en-tête et
//                       les cartes de secteur.
// v5.90 (30/07/2026) — Lot UX-R5 : chantier termine plein ecran + comparaison a l'an dernier + correctif periode consultee
// v5.89 (30/07/2026) — Lot UX-R4 : le mur du domaine + mot du chef de culture (app.js + styles.css + index.html)
// v5.88 (30/07/2026) — Lot UX-R3 : page « Ma trace » (app.js + styles.css + index.html)
// v5.87 (30/07/2026) — Lot UX-R2 : widget d'accueil « Ma part du chantier » (app.js + styles.css + index.html)
// v5.86 (30/07/2026) — Lot UX-R1 : fiche « c'est fait » après validation (app.js + styles.css + index.html)
// v5.85 (27/07/2026) — EFFECTIFS : un membre n'est compté que s'il est actif ET sous contrat
//                       à la date consultée (règle unique : window._mvEnContratLe, utils.js).
//                       pilotage.js ne connaissait PAS fin_contrat : carte Équipe, présences du jour,
//                       effectif au champ, cadence de secours (7h x nV), date de fin de saison,
//                       simulateur de journée et taux horaire moyen étaient tous surévalués tant
//                       qu'une fiche échue restait « Active ». Complète le v5.84, qui n'avait
//                       corrigé que la branche head[] du simulateur de renfort.
//                       + badge « contrat terminé » dans Réglages › Équipe.
// v5.84 - Decider, 4 correctifs remontes de l'ecran reel. (1) L'EFFECTIF PERMANENT etait compte en TETES (membres actifs non-bureau) : saisonniers enregistres et CDD hors periode comptaient chacun pour 1 -> « 5 permanents » affiches la ou Charge & ETP, qui lit cd.weeks[].head (effectif LISSE au prorata des jours sous contrat, _headWeek), en montrait 2 a 3. Le simulateur passe sur head[] SEMAINE PAR SEMAINE : une seule definition de « combien on est » dans le module, et la ligne noire du profil devient un ESCALIER qui suit les contrats. (2) RECHERCHE BORNEE : _rfStrategies balayait toutes les combinaisons nombre x debut x fin, ~10 000 simulations completes A CHAQUE RENDU et a chaque clic -> les boutons semblaient inertes alors qu'ils mettaient plusieurs secondes. Remplace par une recherche gloutonne (plus petit effectif qui boucle sur la campagne entiere, puis retrecissement de la fenetre tant que ca boucle, + 2 effectifs au-dessus) : ~250 simulations. (3) L'edition au CLIC dans les colonnes est retiree au profit d'un SELECTEUR (nombre + du/au) : la zone cliquable couvrait tout le graphique. (4) Lisibilite : mention « aucun renfort pose » tant que la selection est vide, bande doree sur les seules semaines d'emploi - invisible (WHATS_NEW inchange) - vAPP inchange
// v5.83 - Pilotage, lot 3/3 : le simulateur « Cout selon l'effectif » est REMPLACE par « Renfort : combien, et quand ». L'ancien modele avait trois defauts de fond : (1) il rapportait d.totalReste ENTIER a _mvFenetre(), l'enveloppe des seules taches PORTANT une echeance -> 15 personnes sur un chantier date de 10 j, et l'inverse (1,3) des que plusieurs taches elargissent l'enveloppe ; (2) il facturait toutes les heures au taux, alors que les permanents sont payes quoi qu'il arrive -> courbe plate a droite, sur-effectif a 180 EUR/tete ; (3) le retard etait un % du cout de MAIN-D'OEUVRE. Nouveau modele : socle permanent DONNE, decision = profil de renfort par semaine ; le travail est pose par cd.weeks[] ; ce qui n'est pas absorbe GLISSE et devient +k %/semaine plus long (k=15 % par defaut, CONFIG.eco.k_retard) ; rien n'est abandonne. ETP tracteur MESURE sur _ecoTracHByParc (surcharge CONFIG.eco.trac_etp). Profil hebdo cliquable, classement PARMI CE QUI BOUCLE la campagne. « Charge & ETP » quitte Avancement pour Decider (cle avc_etp conservee, perso non invalidee). Barre reorganisee au lot 2, pastille d'Aide au lot 1 - vAPP 5.51
// v5.82 - Pilotage : la pastille « ? Aide » etait INATTEIGNABLE depuis ce module. _mvInjectHelpBtn() cible « .mod-header .mod-meta-row » et index.html n'en compte que 8 ; la page Pilotage est un <div> vide rempli par _pilSkeleton(), elle n'en avait aucune — la fiche MV_AIDE.pilotage etait donc ecrite depuis le lot v5.76 sans aucun moyen de l'ouvrir. Hote dedie .pil-metahost dans le masthead (et NON la classe .mod-header sur .pil-mast : le bloc UI-4 impose background/border/padding en !important et masque les pseudo-elements, le masthead serait repeint en clair sous son texte creme et perdrait son filet horizon). Variante sombre de la pastille, ~12:1. Au passage : le masthead annoncait « Saison active » alors que _pilSaison() renvoie la periode CONSULTEE — libelle corrige en « Periode » - invisible (WHATS_NEW inchange) - vAPP inchange
// v5.81 - Synchro temps reel : un onSnapshot en erreur est DETACHE DEFINITIVEMENT par Firestore, et rien ne le reposait (l'ecouteur 'online' fait un fbPullAll, pas un fbListen) - un onglet pouvait tourner des heures sans aucune synchro, pastille verte comprise, pendant que deux appareils divergeaient en silence. (1) logout() et _mvSessRecover() se desabonnent AVANT signOut : sans ca les 12 listeners tombaient en rafale de permission-denied a chaque deconnexion. (2) Handles indexes par cle + reprise bornee : refus de droits = UNE reprise (rotation de jeton), autre code = 3 reprises 2s/5s/15s, plafond de 30 par session, un seul avertissement pour toute une rafale. (3) Le badge n'affiche plus « Synchronise » quand une cle n'a plus de listener - invisible (WHATS_NEW inchange) - vAPP inchange
// v5.80 - Signalement : classement des erreurs corrige. (1) Les toasts sont captures sur leur COULEUR, or l'ambre et le bordeaux servent autant aux echecs qu'aux confirmations : « Cuve corrigee · 290 L » (une REUSSITE) remontait en [error] et devenait le titre du mail de support, pendant que le permission-denied de la minute finissait en derniere ligne. Tri a deux seaux (panne reelle avant message d'ecran), puis fraicheur 24 h, puis gravite. (2) Repli des rafales : douze listeners qui tombent dans la meme seconde portent UNE information mais occupaient les 8 places du signalement - regroupement sur niveau+categorie+famille+detail avec compteur [xN]. (3) Mail : messages d'ecran marques, age relatif de chaque entree, « Gravite max » limite aux vraies pannes - invisible (WHATS_NEW inchange) - vAPP inchange
// v5.79 - Signalement de probleme exploitable : le mail de support n'imprimait ni la CAUSE (le champ detail etait jete par submitReport) ni la bonne selection (les 5 erreurs les PLUS RECENTES, or une rafale de synchro chasse l'unique [error] qui explique la panne). App : tri par gravite puis par date, 8 entrees, detail borne a 400 caracteres. Fonction submitReport : detail conserve et imprime, ligne Gravite max, garde de POIDS sur support_reports (un document plein aurait tue le canal de support en silence) - invisible (WHATS_NEW inchange) - vAPP inchange
// v5.78 — Moteur de projection unique : l'ordre de passage, le simulateur de cout, la marge et l'ETP annoncaient 39 / 27 / 44 jours pour la MEME charge et le MEME effectif. Trois definitions concurrentes d'une journee de travail (pause deduite du travail, 7 h en dur, jours ouvres lun-ven) -> un seul moteur _mvProj dans utils.js. La journee reglee est du travail EFFECTIF. Les projections se calent sur la FENETRE agronomique des taches (7j/7 sur un chantier) au lieu de la campagne entiere. La penalite de retard ne cree plus de journees de travail (156 j affiches pour 105 j reels) et n'est plus fondue dans le total. Le simulateur dimensionne sur le RESTE et non sur le total theorique. _chargeSaisonData lit enfin la liste explicite de taches de la periode : une periode au nom libre ne remontait AUCUNE tache au Pilotage — vAPP 5.50
// v5.77 — Journal des erreurs rebranche : logError envoyait dans _guerettech/errors_…, collection GT-only ou les rules refusaient l'ecriture client, refus avale par un catch vide -> AUCUNE erreur client n'est jamais remontee depuis la mise en service. logError appelle desormais window.fbAppendError, qui existait deja et ecrit dans mavigne_{slug}/error_log, deja autorise et deja lu par le tableau de bord GT. Niveaux critical + error + warning (info reste local), anti-doublon 10 min, plafond 20 envois/session. Admin GT : agtRenderErrorLog mort supprime, resolution/purge etendues aux entrees Firebase, fiche client repointee de 'erreurs' vers 'error_log' — invisible (WHATS_NEW inchange) — vAPP inchange
// v5.76 — Aide contextuelle : fiches Pilotage et La Reserve (les deux derniers modules tombaient sur le texte generique) — invisible (WHATS_NEW inchange) — vAPP inchange
// v5.75 — Annonce du lot Campagne/Archives (frise recalee, retention 18 mois, onglet Archives, comparateur apparie par l'axe campagne) — vAPP.5.49
// v5.74 — Campagne : l'echelle des mois recalee sur le meme barreme que les segments (elle mentait des 14 mois de fenetre) · Reglages ne garde que 18 mois glissants · Pilotage > Archives : toutes les campagnes sur l'axe 1er aout -> 31 juillet, comparateur multi-saisons rapatrie — vAPP inchange
// v5.73 — Cadrage : l'en-tete de chaque module reste fige au defilement ; l'animation d'entree repasse en fondu pur (le transform residuel decrochait le bouton + et laissait l'ecran glisser lateralement) — vAPP.5.48
// v5.72 — Demo : remunerations fictives (taux individuels + PMP du GNR) pour que le cout par parcelle soit reellement pondere — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.71 — Visite guidee : 10 -> 14 etapes (cout par parcelle, effectifs, planning annualise, vendange) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.70 — Demo : chapitres Economie (cout/ha), Effectifs (ETP) et Le Cuvier (vendange semee) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.69 — Demo : grille du planning reparee (le seed ecrivait sans le niveau annee), modeles horaires semes, chapitre La Reserve — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.68 — Demo : pastille meteo rebranchee sur l'Accueil, chapitre Registre phyto dans la visite guidee, date de l'en-tete lisible (2,95:1 -> AA) — vAPP.5.47
// v5.67 — Campagne : fin des 4 types de saison, periodes a nom libre + frise annuelle (trous et chevauchements signales), renommage sans perte — vAPP.5.46
// v5.66 — Campagne : chaque periode porte sa propre liste de taches (le nom n'est plus interprete) + journal pilote par la date saisie — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.65 — Aide contextuelle : pastille « ? Aide » sur les 8 modules (l'essentiel de l'ecran + guide complet + signalement pre-rempli de la page) — vAPP.5.45
// v5.64 — Pilotage/Economie : cout par parcelle en euros ET a l'hectare (bascule + tri) · entreplantation comptee aux plants reels (fin du repli 15 h/ha fantome) · Reglages/Vigne : bareme et creation libre reunis en deux boutons — vAPP.5.44
// v5.63 — Modules visibles par membre : chaque personne ne voit dans la barre du bas que les modules qui la concernent (Reglages > Equipe > fiche) — vAPP.5.43
// v5.62 — Planning : le solde de depart entre dans le compteur (paye/recup s'imputent sur le cumul) + jours travailles sur le releve PDF (MSA) · Tâches : barème de la convention consultable + rattachement manuel — vAPP.5.42
// v5.61 — Annualisation : compteur d'heures annuel (plafond 1607 h proratise, modulation 250 h), travail effectif distinct des heures remunerees, motifs d'absence types, periode de reference des conges — vAPP.5.41
// v5.60 — Nettoyage : purge du CSS des anciens systemes d'onglets + fin des ids dupliques ocd-* (openConfirmDel affiche enfin ses titres) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.59 — Nettoyage : suppression du code mort restant dans app.js (fonctions sans appelant, appels vers des elements disparus) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.58 — Anti-perte : verrou de chargement etendu a tous les domaines (n'etait actif que sur marchand-grillot) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.57 — Lisibilite (suite) : le garde-fou « .mod-header .mvu-tab » repeignait le creme de l'en-tete sur le papier depuis UI-4 (1,09:1 sur 8 modules) — vAPP.5.40
// v5.56 — Lisibilite : onglets de module + badges sous le seuil AA — vAPP.5.40
// v5.55 — Reserve : derniers onglets unifies + ANNONCE de la refonte navigation — vAPP.5.40
// v5.54 — Vigne : en-tetes unifies (Accueil/Parcelles/Journal) + onglets unifies — fin de la refonte navigation — vAPP inchange
// v5.53 — Pilotage : 9 onglets regroupes en 5 + tiroir Outils (Simulation, Parametrage) — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.52 — Planning : en-tete unifie (fin des classes plan-hdr propres au module) + onglets unifies equipe/fiche salarie — vAPP inchange
// v5.51 — Phyto devient un module autonome du dock · Tracteur : onglets unifies (Sessions/Entretien) + tiroir Outils d'entretien — vAPP inchange
// v5.50 — Cave : en-tete unifie (fin du double en-tete empile) + sections Le Chai/Le Cuvier en onglets + sous-onglets unifies — vAPP inchange
// v5.49 — Paie : taux horaire par salarie (collection `paie`, admin-only) + appoint de cuve GNR (prix a la livraison) + onglet Tracteur dans Reglages — vAPP 5.39
// v5.48 — Reglages : barre d'onglets unifiee (.mvu-tabs) + en-tete a hauteur fixe (stats descendues dans le corps) — vAPP inchange
// v5.47 — Vigne : historique des rendements par millésime dans le détail d'une parcelle (kg/ha, évolution N/N-1) — vAPP inchange
// v5.46 — Garde de session multi-onglet : alerte si la demo (autre onglet) remplace la session du domaine — invisible (WHATS_NEW=[]) — vAPP inchange
// v5.45 — Pilotage : onglets Economie (cout/ha par parcelle : MO+tracteur+GNR+phyto) & Conformite (cuivre 7 ans, passages phyto/IFT, delai de rentree DRE) — vAPP.5.38
// v5.44 — SEC-5 : purge du cache tenant local a la deconnexion (poste partage) — invisible (WHATS_NEW=[]) — vAPP.5.37
// v5.43 — Accessibilite (zoom reactive, Echap/focus clavier) & rapidite (carte a la demande, SRI) + PWA (mobile-web-app-capable, host-guard) — vAPP.5.37
// v5.42 — PERF-3 : skeletons de chargement (mv-sk, tous modules) — invisible (WHATS_NEW=[]) — vAPP.5.36
// v5.41 — Le Cuvier : analyses de maturité du raisin (sucre/degré, courbe par parcelle) · Le Chai : mise en bouteille + stock archivé par millésime + tri par millésime — v5.36
// v5.40 — Extraction du module Phyto (app.js -> phyto.js), iso-comportement, aucune fonctionnalite modifiee — vAPP inchange
// v5.39 — Exemplaire personnalise du contrat (DPA/CGU) rempli aux coordonnees du client + copie signee a telecharger — v5.35
// v5.38 — Nouveau module La Reserve : inventaire des futs + stock des intrants (bilan matiere bio) — v5.34
// v5.37 — Acceptation des CGU et du DPA (RGPD art. 28) a la 1re ouverture du domaine — v5.33
// v5.36 — Mots de passe : un mot de passe unique par compte, remplace obligatoirement a la 1re connexion ; reinitialisation par l'admin du domaine ; correctif du bouton "Changer mon mot de passe" (casse depuis toujours) — v5.32
// v5.35 — En-tetes : hauteur et axe identiques sur tous les modules ; barre saison+date partout — v5.31
// v5.34 — Accessibilite des fenetres : Echap ferme, focus piege puis restaure, fond verrouille (aria-modal) — v5.30
// v5.33 — Cartes Tracteur repensees (bande de statut, nom Cormorant, jauge epaissie) — fin du lot UI-3 — v5.30
// v5.32 — Accueil et Pilotage : finition papier, filet horizon, jauges animees — v5.29
// v5.31 — Journal repense : en-tete de jour Cormorant, timeline affinee, cartes papier — v5.28
// v5.30 — Cartes Parcelles repensees (bande de statut, nom Cormorant, jauge animee) + correctif ombre des cartes stats/KPI — v5.27
// v5.29 — Correctifs interface 2 : Accueil/Parcelles/Journal barre saison+date et onglets lisibles ; bande parc Tracteur masquee — v5.26
// v5.28 — Correctifs interface : bande parc Tracteur lisible (fond clair), en-tete Cave unifie, label sections corrige, jauges/barres animees — v5.26
// v5.27 — Interface repensee : en-tetes de tous les modules unifies (bandeau sombre a hauteur identique, filet horizon, tuile d'icone) — v5.26
// v5.26 — Planning : poser des congés sur une période, pour plusieurs salariés à la fois — v5.25
// v5.25 — Correctif : les erreurs internes du SDK Firestore (« INTERNAL ASSERTION FAILED ») ne s'affichent plus à l'écran (loggées silencieusement, 1 trace error_log/session) ; l'écoute temps réel est réabonnée proprement à chaque reconnexion (fin de l'empilement de listeners) — v5.24
// v5.24 — Session tracteur : chrono par parcelle (temps réel mesuré, portée par sélection, pause, réparti à la surface) — opt-in (Réglages › Activités tracteur), non bloquant ; le temps mesuré prime sur le barème dans le Rapport de saison et le Pilotage — v5.24
// v5.23 — Module Vendange « Le Cuvier » repensé : récoltes en caisses (→ kg/hL), cuves de vinification avec suivi de fermentation, densité automatiquement ramenée à 20 °C (degré potentiel juste), opérations (chaptalisation avec calcul du sucre, refroidissement, saignée, levurage, nutriment, SO₂…), vente en vrac par client (poids/caisse propre), décuvage → crée la cuvée dans Le Chai (élevage) — v5.23
// v5.22 — Planning : appliquer un horaire (heures travaillées) à une sélection multiple dans la grille d’équipe — v5.22
// v5.21 — Rapport de saison : section Heures repensée — la présence (Planning) est répartie en Travaux vigne (barème) / Tracteur (estimé h/ha) / Autres, avec ETP par poste et ETP vigne ; tracteur fondu dans « Autres » tant qu’aucun barème h/ha n’est saisi — v5.21
// v5.20 — Rapport de saison : la section Heures & ETP se remplit automatiquement depuis le Planning pour une saison de l’année en cours (heures travaillées/prévues, ETP, détail par personne, fenêtre de dates exacte) ; une saisie manuelle (Réglages) reste prioritaire — v5.20
// v5.19 — Rapport de saison unifié et enrichi (un seul bouton, choix de la saison ; avancement par tâche/parcelle, tracteur, entretien, incidents, réparations, phyto, cuivre bio, ETP) + heures mémorisées par saison (CONFIG.etp_saisons) — v5.20
// v5.18 — Réglages › Saisons : reconstruire l’avancement d’une saison à partir du journal (validations sur la période de la saison, additif, récap avant application) ; consultation d’une saison : libellés accueil/avancement/onglets alignés sur la saison consultée — v5.19
// v5.17 — Assistant phyto : budget cuivre métal 7 ans par parcelle (source unique = synthèse Réglages), avertissement non bloquant — v5.18
// v5.16 — Module Tracteur : bouton ＋ unifié (choix Session tracteur / Traitement phyto) — v5.17
// v5.15 — Module Tracteur : finition cartes de session (accent « terminé » vert) + annonce Nouveautés du module repensé — v5.16
// v5.14 — Module Tracteur : chantier en cours en héros (carte live, avancement surface, action) — v5.15
// v5.13 — Module Tracteur : bande parc (cartes machine, révision + état réparation) — v5.14
// v5.12 — Module Tracteur : nouvel en-tête (filet horizon, icône & badge acier) — v5.13
// v5.11 — Élevage repensé : en-tête « Le Chai » (état du chai en un coup d'œil), jauge « part des anges » par cuvée, tri par urgence + ouillage groupé, gestes rapides (ouiller/soutirer/analyser) sur chaque carte, journal en frise mensuelle, onglet Réglages — v5.12
// v5.10 — Clôture de campagne : bouton « Clôturer la campagne » (Réglages › Saisons) — bilan + archivage HISTORIQUE + démarrage de la campagne suivante ; les travaux tracteur ne s'affichent plus sur une saison consultée autre que la leur (accueil + PDF de saison + Pilotage) — v5.11
// v5.09 — Correctif : les « fenetres des taches » (Pilotage › Parametrage) sont de nouveau modifiables — l'editeur ecrit desormais dans les dates de travaux de la saison (source unique avec Reglages › Modifier la periode) au lieu d'un store separe qui etait masque par ces dates — v5.10
// v5.08 — Correctif Pilotage : l'avancement ne s'affiche plus a 100% « fantome » en consultant une autre saison apres un rechargement (cache TRAVAUX reconstruit sur la saison consultee des le login + taches simples toujours recalculees) ; charge/ETP repartis au prorata de la capacite (plus de faux pic les semaines de feries) et fenetres lues depuis les dates de travaux de la saison — v5.10
// v5.07 — « Nouveautés » cumulatives au démarrage : le récap affiche désormais TOUTES les mises à jour depuis la dernière ouverture (groupées par version), pas seulement la dernière — v5.10
// v5.06 — Préparation de saison isolée : consulter/préparer une autre saison (travaux + pilotage) sans changer la vue de l'équipe ; le pointeur de saison consultée est désormais LOCAL (jamais propagé en base), la bascule tenant-wide ne se fait qu'à l'activation ; + dates de travaux estimées par tâche (préparation du pilotage) et badge « lecture seule » en consultation d'une saison — v5.10
// v5.05 — Correctif avancement : plus de 100% fantôme dans Pilotage — Entreplantation sans trou (repli surface) + l'activation d'une saison bascule désormais la vue et le cache TRAVAUX (les tâches d'une autre saison ne s'affichent plus à 100%), clôture correcte des travaux tracteur au changement de campagne — v5.09
// v5.04 — Correctif : modifier un traitement déjà créé — le cuivre métal est de nouveau saisissable/modifiable en édition et le conducteur se re-sélectionne (liste alignée sur l'assistant : membres tractoriste/admin inclus, valeur d'origine préservée) — v5.09
// v5.03 — Correctif : l’avancement des travaux ne peut plus se perdre en changeant de saison (chaque parcelle memorise sa saison, ecriture atomique) ; noms de saison en double refuses ; bouton « Réparer l’avancement des saisons » dans Réglages — v5.09
// v5.02 — Synthèse cuivre métal (bio) : saisie du cuivre métal par traitement, écran de synthèse par parcelle face au plafond réglementaire (moyenne lissée 7 ans) et encart PDF enrichi pour le contrôle de certification — v5.09
// v5.01 — Correctif : dans un traitement phytosanitaire, cocher une parcelle ne fait plus remonter la liste en haut du panneau (mise à jour ciblée, le scroll reste en place) — v5.08
// v5.00 — Planning repensé : grille équipe (semaine/mois) avec totaux et alerte cadre légal, éditeur de jour sans navigation (jour suivant, bascule salarié), sélection multiple (CP/absence/récup/chaleur), horaires chaleur multi-salariés, fiche salarié 4 volets (mois, congés, heures sup, acomptes, PDF) — v5.08
// v4.99 — Correctif : les membres créés à l’installation (statut en minuscule) apparaissent bien dans le sélecteur de conducteur, la sélection d’équipe et les chips ouvriers — v5.07
// v4.98 — Conducteurs : les membres tractoristes/admin sont proposés directement comme conducteurs (Tracteur + traitement phytosanitaire) ; bouton « + Conducteur » rétabli dans Tracteur — v5.07
// v4.97 — Pilotage repensé : bandeau sombre du domaine (saison, vignoble, météo), onglets à soulignement or, cartes et indicateurs unifiés, icônes affinées, alertes sobres — v5.06
// v4.96 — Priorité du moment : plusieurs tâches prioritaires en parallèle avec équipes affectées (exclusivité membre), atterrissage direct sur les parcelles pour les membres concernés — v5.05
// v4.95 — Optimisation : feuille de style externalisée (index.html allégé de moitié, CSS servi en cache-first) + purge du code dormant de l'ancienne navigation (hub 6 cartes, sidebar, journal d'alertes du hub) — v5.04
// v4.94 — Sécurité : Service Worker redéployé pour appliquer la CSP à jour (connect-src autorise les tuiles carte OpenStreetMap + unpkg pour les requêtes du service worker) — v5.04
// v4.93 — Sécurité : échappement HTML systématique des noms de tracteurs, notes de réparation et libellés (vues Tracteur + export PDF entretien) + en-têtes HTTP de sécurité (CSP en observation, X-Content-Type-Options, anti-clickjacking) — v5.04
// v4.92 — Polices auto-hébergées (Cormorant Garamond + Outfit servies depuis /fonts, plus aucune dépendance à Google Fonts) + le domaine technique .web.app redirige vers mavigneapp.fr — v5.04
// v4.91 — Référencement : l'app (écran de connexion) sort de l'index des moteurs + Open Graph/Twitter pour l'aperçu de partage — v5.04
// v4.90 — Signaler un problème : bouton dans Réglages + lien sur l'écran de connexion ; le contexte technique (page, appareil, dernières erreurs, y compris les messages fugaces) part automatiquement avec le message, notification e-mail au support — v5.04
// v4.89 — Démo : le bouton « Demander un accès d'essai » ouvre le formulaire d'essai en ligne (au lieu d'un e-mail pré-rempli) — v5.03
// v4.88 — Vocabulaire corrigé : « Complantation » = parcelle plantée en plusieurs cépages (mention cépage), « Entreplantation » = tâche de remplacement des pieds manquants (tarière) — fin de l'inversion et de l'affichage « undefinedh/ha · NaNh » sur l'ancienne tâche — v5.03
// v4.87 — Tutoriels « Guide complet » et « Démarrage rapide » entièrement actualisés (toutes les nouvelles fonctionnalités : pilotage, météo par secteur, entreplantation à la tarière, saisons, planning) ; accès « Aide & Documentation » rétabli et fiabilisé dans Réglages — v5.02
// v4.86 — Acceptation des CGU à la 1re connexion du domaine (écran bloquant) + accès aux guides depuis Réglages — v5.02
// v4.85 — Visite de démonstration : logo affiché sur fond transparent (suppression du cadre qui créait des bordures) — v5.01
// v4.84 — Visite de démonstration : logo GUERETTECH à la place de l’emoji grappe dans l’écran d’accueil — v5.01
// v4.83 — Visite de démonstration : correctifs d’affichage (bulle d’aide fantôme en haut à gauche de l’accueil, chevauchement bulle/fenêtre de priorité, surbrillance manquante sur l’étape Pilotage) — v5.01
// v4.82 — Visite guidée de démonstration repensée : journée type + chapitres (pilotage, carte, météo par secteur, planning, tracteur, cave, vue ouvrier) et domaine de démo enrichi ; aucun impact sur les domaines clients — v5.01
// v4.81 — Vocabulaire : la tâche « Complantation » est renommée « Entreplantation » partout (terme métier exact) ; migration automatique des données (avancement par parcelle + parcelles multi-cépages) — v5.01
// v4.80 — Pilotage repensé : navigation par onglets (Aujourd'hui, Avancement, Personnel, Matériel, Cave) + objectif de fin des travaux avec marge (avance / retard) selon la cadence réelle, indicateurs configurables par onglet — v5.00
// v4.79 — Fenêtre de traitement : alerte lessivage (pluie après la fenêtre) + probabilité de pluie par créneau — v4.99
// v4.78 — Correctif : changer de saison ne déclenche plus la fausse alerte « protection anti-perte de données » ; la saison consultée ne peut plus se désynchroniser de l'avancement (fin de la boucle « Erreur critique » au chargement) — v4.98
// v4.77 — Avancement : une tâche sans surface concernée (0 h à faire) s'affiche désormais à 100 % au lieu de 0 % (rien à faire = terminé) — v4.98
// v4.76 — Surface du domaine calculée depuis les parcelles réelles (plus de 11,76 ha figé) ; nom du domaine dynamique (cave, PDF, export) — Marchand-Grillot inchangé — v4.97
// v4.75 — Création de saison : choix des tâches du cycle (heures conseillées affichées) ; retrait d'une tâche d'une seule saison ; suppression d'une saison (confirmation) — v4.97
// v4.74 — Correctif : la migration Plantation→Entreplantation attend que la config soit chargée avant de l'écrire (fin de l'alerte « fbSave config bloqué » au 1er chargement) — v4.96
// v4.73 — Saisons agricoles (création par type, dates pouvant chevaucher l'année civile) ; tâches choisies dans la convention (heures conseillées, multi-saisons ou toute l'année) ; travaux complémentaires au temps réel ; entreplantation pilotée par la tarière, la plantation de parcelle neuve devient complémentaire — v4.96
// v4.72 — Tarière → Plantation : le nombre de trous d'une session Tarière définit la tâche Plantation par parcelle (vignes concernées + temps = trous × temps/trou, réglable dans Réglages) ; rapport de saison enrichi — v4.95
// v4.71 — Heures/ha des tâches calées sur le barème conventionnel Côte de Nuits (485 h/ha) — défauts des nouveaux domaines ; Marchand-Grillot inchangé — v4.94
// v4.70 — Lisibilité : audit complet des couleurs — plus aucun texte invisible en thème clair ou sombre (étiquettes produits phyto, motifs d’absence, tableaux, badges, champs de saisie) — v4.94
// v4.69 — Catalogue E-Phy : le délai de rentrée affiché est le délai réel du produit (6 h, 24 h ou 48 h) déduit de sa classification de danger, avec le motif — v4.93
// v4.68 — Nettoyage multi-tenant : les données par défaut (tracteurs, activités, template de planning personnel) ne s'appliquent plus qu'au domaine de référence ; un nouveau domaine démarre neutre — aucun changement visible pour Marchand-Grillot — v4.92
// v4.67 — Carte du domaine : la carte s'ouvre cadrée sur le vignoble du domaine (au lieu d'un point fixe en Bourgogne) ; chaque parcelle apparaît sur sa commune même sans contour KML importé — v4.91
// v4.66 — Fenêtres : une fenêtre ouverte par-dessus une autre (ex. choix de la commune d’une parcelle) s’affiche désormais au premier plan — v4.90
// v4.65 — Météo par secteur : chaque parcelle peut être affectée à sa commune (suggestion auto par GPS) ; sur l’accueil, météo détaillée par secteur pour les domaines aux parcelles dispersées, et chaque parcelle utilise son centroïde GPS — v4.89
// v4.64 — Protection anti-perte de données : garde anti-écrasement global (aucun état vide ou squelette par défaut ne peut remplacer des données peuplées, toutes collections) + verrou de chargement Marchand-Grillot + sauvegardes JSON quotidiennes — v4.88
// v4.63 — Onboarding du 1er client externe : création serveur du domaine (compte admin + claim tenant) et écriture des données initiales, routage de l'assistant via le registre, garde anti-fuite des données du domaine de dev, formule & essai posés à la création — v4.87
// v4.62 — Formules selon l'abonnement (modules) + essai 15 j (bandeau J-X évolutif, lecture seule à l'expiration) + changement d'e-mail d'un membre (admin payé) — v4.86
// v4.61 — Navigation entre saisons : avancement stocké par saison + sélecteur (Lot 4) — v4.85
// v4.60 — Tag saison sur sessions de traitement à la création (par date, cohérent avec le recalage) — v4.84
// v4.59 — Fix sessions : saison déduite de la DATE (jamais la saison active) + bouton de recalage — v4.83
// v4.58 — Sessions tracteur rattachées à la saison (tag à la création + filtre + migration) — v4.82
// v4.57 — Saisons : dates de début/fin éditables (fondation du calcul de charge) — v4.81
// v4.56 — Conformité HTML : éléments internes des boutons (icônes, libellés, interrupteurs) passés de <div> à <span> — aucun changement visible — v4.80
// v4.55 — Démonstration : visite guidée sans code — écran de bienvenue + parcours narratif (une journée au domaine), thème clair — v4.79
// v4.54 — Vigne : tâche prioritaire diffusée par l'admin (l'équipe ouvre Parcelles focalisée dessus), bouton « Commencer » sur les parcelles, et carte interactive (« Ma position » + validation directe au toucher d'une parcelle) — v4.78
// v4.53 — Vigne : sur téléphone, l'onglet Journal ne descend plus (son sous-titre passait sur 2 lignes à cause d'un libellé un peu long) — v4.77
// v4.52 — Vigne : changement d'onglet (Accueil/Parcelles/Journal) fluide, sans scintillement ni décalage ; bouton « + » du tracteur remonté au-dessus de la barre du bas — v4.77
// v4.51 — Vigne : le bandeau d'onglets (Accueil / Parcelles / Journal) se fond dans l'en-tête, sans rupture de couleur, comme les autres modules — v4.76
// v4.50 — Nouvelle navigation : barre du bas (dock) sur mobile et ordinateur, le hub disparaît, ouverture directe sur Vigne (ou Pilotage pour admin) — v4.75
// v4.49 — Cercles décoratifs sur les en-têtes des modules (Parcelles, Journal…) pour une identité visuelle homogène avec l'Accueil — v4.74
// v4.48 — Accueil (hub) repensé : message personnalisé selon l'heure + 4 indicateurs clés du domaine en un coup d'œil (saison, session en cours, cuvées, équipe), cartes ton « papier » — v4.73
// v4.47 — Nouvelle identité visuelle (refonte 1/6) : en-têtes sombres « cave » + filet d'or, cartes ton « papier », accent or unifié — v4.72
// v4.46 — Fenêtres de confirmation : au retour d'un tracteur, bouton vert « Oui, rentré » (au lieu de « Supprimer ») ; bouton « Annuler » de nouveau lisible dans toutes les confirmations — v4.71
// v4.45 — Parcelles : nouveau bouton « Trier par proximité » qui classe les parcelles de la plus proche à la plus éloignée d'après le GPS du téléphone — v4.70
// v4.44 — Réparateur : au retour d'un tracteur, la période de réparation (dates + motif) est archivée dans un historique consultable (Tracteur › Entretien) au lieu d'être effacée — v4.69
// v4.43 — Sessions tracteur datées (début → fin, fin auto à 100 %) ; cuve GNR : plein qui décompte + correction manuelle du niveau ; compteur de sessions aligné sur l’affichage ; message de priorité n’écrase plus le reste de la config — v4.68
// v4.42 — Rôles d’un membre : un changement de rôle (ex. ajout Pilotage) est pris en compte immédiatement sur la session active, sans reconnexion — v4.67
// v4.41 — Tâches désactivées : les heures à faire et l’avancement de la saison ne comptent plus les parcelles où la tâche est désactivée, et la désactivation est correctement enregistrée — v4.66
// v4.40 — Pilotage : échéances par tâche (jours ouvrés + fin de saison), météo 5 jours opérationnelle, fenêtre de traitement (forecast horaire), simulateur « et si » de réallocation — v4.65
// v4.39 — Délai de rentrée (réentrée dans une parcelle traitée) affiché sur chaque traitement du registre et dans sa fiche, avec alerte tant qu’il court ; sans délai spécifique au produit, le minimum réglementaire de 6 h est appliqué (au lieu de « sans délai ») — v4.64
// v4.38 — Icône Relevage alignée dans les listes de tâches (largeur emoji) — v4.63
// v4.37 — Registre phyto complet (substance active, n° AMM, dose, parcelles, stade, conducteur, DAR, délai de rentrée) y compris produits E-Phy, et fiche détaillée au tap sur une ligne ; modification d'un traitement déjà enregistré (correction de date, dose, conducteur, parcelles, stade…) répercutée sur la session de tracteur — v4.62
// v4.36 — Catalogue E-Phy élargi : engrais foliaires/biostimulants (MFSC), adjuvants et produits mixtes autorisés sur vigne, en plus des produits phyto ; recherche par nom de revente (le nom du bidon, pas seulement la référence) dans le catalogue et à la saisie ; la fiche liste les noms de revente — v4.61
// v4.35 — Saisie d'un traitement : recherche directe dans le catalogue E-Phy (ANSES) par nom ou substance — DAR, ZNT, délai de rentrée et dose préremplis ; raccourci « produits récents » disponible hors-ligne ; onglet Catalogue réduit au seul référentiel E-Phy (saisie manuelle de produits retirée) — v4.60
// v4.34 — Catalogue phyto E-Phy (ANSES) : correction du chargement — le référentiel officiel s'affiche enfin dans Tracteur › Phyto › Catalogue (et se met à jour automatiquement) ; raccourci « Phyto » retiré du menu latéral (déjà accessible dans Tracteur) — v4.59
// v4.33 — Pilotage : la carte du domaine affiche le nom et un repère coloré sur chaque parcelle (comme l'onglet carte de Parcelles) ; carte recadrée sur le vignoble et zoom ajusté pour une vue d'ensemble lisible ; bouton « Noms » pour masquer les libellés — v4.58
// v4.32 — Pilotage : carte du domaine intégrée (parcelles colorées par avancement) + panneaux pliables (réduits à l'info clé, dépliables au tap) ; charge restante en jours ouvrés (cadence réelle du planning, 4 dernières semaines) ; graphique comparatif d'avancement N-1 ; salariés « bureau » exclus du calcul de capacité de travail — v4.57
// v4.31 — Cuve GNR (litrage restant + alerte niveau bas) et prochaine révision par tracteur (compteur + échéance), saisis dans Tracteur › Entretien ; alerte ouillage réglable 7/14 j (Cave › Divers) ; pilotage enrichi (GNR, réparations, présences du jour CP/maladie, ouillage, révisions ; sélection granulaire) — v4.56
// v4.30 — Rôle Pilotage : profil décisionnel en lecture seule (accès au tableau de bord, consultation des modules, aucune écriture) — attribuable depuis Réglages › Membres — v4.55
// v4.29 — Pilotage (admin, ordinateur) : nouveau tableau de bord vue d'ensemble (avancement de la saison, indicateurs clés, graphiques avancement par tâche + répartition de charge, panneaux équipe/tracteur/cave/phyto), affichage personnalisable par utilisateur — v4.54
// v4.28 — Météo localisée par domaine : conditions et prévisions centrées sur le centroïde des parcelles géolocalisées (au lieu d'un point fixe) ; coordonnées du domaine réglables dans Réglages › Nom du domaine — v4.53
// v4.27 — Planning : cadre légal des heures — suivi hebdomadaire avec durées max à ne pas dépasser (48 h/sem, 44 h moy. 12 sem., 10 h/jour), alerte des semaines en dépassement ; seuils préréglés convention Production Agricole et CUMA, paramétrables par tenant — v4.53
// v4.26 — Maintenance interne : constantes d'icones dedupliquees (source unique utils.js) ; emoji des passages Ebourgeonnage 1/2 homogeneise dans le journal — v4.52
// v4.25 — Interface : retour tactile sur les boutons + pastille de synchro, halo de focus sur les champs (polissage visuel) — v4.52
// v4.24 — Bandeau demo : mention « modifications non enregistrees » (les essais du prospect restent locaux) — v4.49
// v4.23 — Demo interactive : le tenant de demonstration peut etre modifie librement (bac a sable local, aucune ecriture en base, remise a neuf a chaque rechargement) — v4.49
// v4.22 — Activation App Check : clé reCAPTCHA v3 renseignée côté client (firebase.js) — v4.49
// v4.21 — Hygiène/cohérence : boutons export/import en HTML valide (span dans button), manifeste PWA neutre (start_url + icônes), droits saisonnier alignés sur le serveur, message d'attente si trop de tentatives sur un code d'essai — v4.49
// v4.20 — Fiabilité multi-utilisateur : sauvegarde des parcelles fusionnée 3-way (fin des écrasements lors de validations simultanées et à la reprise hors-ligne), cloisonnement des données pour un nouveau tenant (plus de défauts Marchand-Grillot recopiés), App Check côté client (dormant jusqu'à configuration de la clé) — v4.49
// v4.19 — Correctif carte : parcelles « Fourneau Vieille » et « Fourneau Jeune » — nom du polygone aligné sur la parcelle (était « Fourneaux » avec x) → couleur d'avancement correcte + nom piloté par le toggle « Noms » ; durcissement : tout libellé de polygone est désormais suivi (plus de label orphelin si un nom diverge) — v4.49
// v4.18 — Lot 5 : export PDF du rapport de saison (Réglages › Exporter) — synthèse, avancement par tâche, travaux tracteur, registre phyto, réparations ponctuelles par parcelle, trous de plantation par parcelle ; HTML imprimable A4 — v4.49
// v4.17 — « Nouveautés » au démarrage réactivé : après une mise à jour, récap des changements visibles affiché une fois (APP_VERSION 4.48, WHATS_NEW à jour) ; pas de recap au tout premier install — v4.48
// v4.16 — Lot 4 (finition) : coach-mark « Mode plein soleil » affiché une fois au 1er login (pointe le bouton ☀️ du hub) + touch targets remontés à ≥44px (sélecteur passage, chips membres) — v4.47
// v4.15 — Lot 4 : équipe mémorisée PAR TÂCHE (équipes en parallèle : une ébourgeonne, une autre relève) — le bandeau « Équipe sur {tâche} » suit le filtre tâche ; équipes récentes (réassignation 1 tap) + « Moi seul » ; pré-sélection de l'équipe de la tâche dans la saisie manuelle du Journal ; migration douce depuis l'ancienne équipe unique — v4.46
// v4.14 — Lot 2 : indicateur de synchronisation permanent dans les headers (hub + modules) — 🟢 synchronisé / 🔵 synchro / 🟠 hors-ligne + compteur de modifications en attente, tap → détail ; branché sur showSyncBadge + file offline existante — v4.45
// v4.13 — Validation rapide : l'« Équipe du jour » exclut les membres inactifs (picker + équipe mémorisée nettoyée) — v4.44
// v4.12 — Lot 1 : validation rapide depuis la liste filtrée — bouton ✓ 1 tap par parcelle (tâches simples + passages Ébourg./Pioche + niveaux Relevage, sélecteur de passage à défaut intelligent), bandeau « Équipe du jour » mémorisé, toast avec Annuler — v4.43
// v4.11 — Lot 0.5 : bouton retour Android/navigateur — ferme désormais la modale RÉELLEMENT au-dessus (z-index + ordre DOM) au lieu de la première du DOM ; corrige le cas modale-dans-modale — v4.42
// v4.10 — Lot 0 stabilité : météo journal à id déterministe (meteo-{date}, anti-doublon multi-appareils) + carte parcelles via double requestAnimationFrame (fin de la carte grise sur appareils lents) — v4.41
// v4.09 — Planning RH : anciens salariés (Inactif) — retirés du choix de profil (plus d'accès appli) ; section « Anciens salariés » dans l'onglet Saisie (heures + PDF restent accessibles à l'admin) — v4.40
// v4.08 — Planning RH : feuille d'heures PDF condensée sur 1 page (2 colonnes) intégrant le compteur heures sup. (payé/reporté/récup · à payer ≥ 3 mois) — v4.40
// v4.07 — Planning RH : compteur heures sup. (CDI/CDD) — type de jour « Récup » (déduit les heures planifiées du jour), répartition payé/reporté, banque FIFO, alerte ≥ 3 mois — v4.39
// v4.06 — Carte : légende remplacée par une barre dégradée 0→100% (cohérente avec les polygones en dégradé continu) + pastille Arrachée distincte — v4.38
// v4.05 — Carte : dégradé d'avancement continu 0→100% (pctColor, terre→ambre→vert vigne) sur polygones Leaflet + cards parcelles · réparation ponctuelle par parcelle (chips Piquet/Amarre/Fil multi + quantité, entrée journal dédiée sans impact sur la tâche planifiée) · météo conditions du moment en haute résolution AROME ~1,5 km (models=meteofrance_seamless, repli best_match) · carte retirée de l'accueil et des choix de widgets — v4.37
// v4.04 — Hub vivant (stats live par univers : session tracteur en cours, cuvées en élevage, progression saison, membres) + mode plein soleil (haute lisibilité, mémorisé par utilisateur) + accessibilité clavier sur les cards du hub (role/tabindex/focus) — v4.36
// v4.03 — Navigation : routeur d'historique (bouton retour Android/navigateur ferme l'overlay ouvert puis revient au hub) + transitions slide directionnelles entre pages (prefers-reduced-motion respecte) — v4.35
// v4.02 — Accueil Vigne v2 : 5 nouveaux widgets (météo 5 jours, ma semaine, délai de rentrée DRE, raccourcis, mini-carte SVG), priorité épinglée en haut, drag&drop appui long, taille compacte par bloc, mode card mémorisé, disposition par défaut du domaine (admin) — v4.34
// v4.01 — Fix _openOv exposé window + badge header sessions Tracteur
// v4.00 — Accueil personnalisable (ordre + masquage des blocs par utilisateur, CONFIG.home_layout + localStorage) · Journal d'alertes hub (cloche 🔔, badges par module, ouillage/SO₂/réparateur/gel/priorité/DAR/fin de contrat, état lu local) · Cave : multi-intervenants sur les opérations (intervenants[], rétro-compatible operateur, avatars empilés) — v4.33
// v3.99 — Zéro défaut PWA : précache ATOMIQUE des assets hashés à l'install (liste injectée au build par scripts/inject-precache.mjs) — le nouveau SW ne s'active que si TOUT le bundle est en cache ; sinon l'ancienne version reste active
// v3.98 — Robustesse démarrage PWA : assets Vite hashés en CACHE-FIRST (immuables — le réseau instable pendant un deploy ne peut plus geler le splash), garde de démarrage boot.js précachée (reload auto + écran Réessayer)
// v3.97 — Planning : calcul horaire à la minute près (_planTimingH + écart vs prévu — 8h45 ne s'affiche plus 8h48), input Heures décomptées (CP) reçoit une valeur numérique (fix warning '7h cannot be parsed')
// v3.96 — Fix SW : requêtes non-GET ignorées (Cache.put rejette POST — appels Cloud Functions lot 5) + bypass cloudfunctions.net
// v3.95 — Lot 5 sécurité : custom claims multi-tenant (Cloud Functions claims.js), création membres via createMemberAccount (claims atomiques), codes d'essai validés serveur (checkTrialToken/logTrialAccess), refresh token forcé au chargement, fbCallFn générique — v4.31
// v3.94 — Lot 4 audit (nettoyage) : tNom/TABREV dédoublonnés (import utils.js), let tracSessionId orphelin retiré d'app.js, doublons CSS .tabcont + .cave-divers-row/.cave-divers-ico/.rfut-reason-btn supprimés, SVG empty-state entretien factorisé (tracteur.js) — v4.30
// v3.93 — Lot 3 audit : Planning dark mode — header anatomie mod-header (icône+Cormorant+stats band), ~190 couleurs hardcodées → variables (planning.js hors PDF + CSS plan-*), vars --plan-acc/--plan-acc-pale jour+nuit — v4.29
// v3.92 — Lot 2 audit : suppression code mort nav-bar 7 icônes (HTML <nav>, CSS .nav-bar/.nb*, vars --nav-h/--nav-bg/--nav-border, updateNavForRoles + 3 appels, gestion .nb dans logout/applyRoles/goHub/goTo, pastille chat-nav-dot) — v4.28
// v3.91 — HOTFIX ReferenceError tracSessionId : porté par window (pattern v3.87 fCond) — init header + 12 refs window.tracSessionId dans tracteur.js
// v3.90 — Audit XSS lot 1 : _escHtml/_escAttr sur tracteur.js (produits, tracteurs, anomalies, parcelles session), planning.js (noms membres texte+onclick, notes acomptes, templates), reglages.js (activités, saisons historique, openEditHha via _escAttr)
// v3.89 — Fix iPhone : sync-badge (témoin chargement) sous l'encoche — top:calc(env(safe-area-inset-top)+10px)
// v3.88 — Fix PDF feuille d'heures : jours hors periode de contrat exclus (tableau aligne sur les totaux _planSummary)
// v3.87 — Fix ReferenceError fCond (module Tracteur) : filtres fCond/fAct/selEmoji portés par window, lecture/écriture alignées + échappement chips conducteurs/activités
// v3.86 — Retrait fût ancré sur la répartition des tonneaux : chips d'année, décrément cuv.tonneaux[], annee_fut dans l'historique
// v3.85 — P2/P3 audit : deepClone+_swNotify centralisés utils.js · Cave Export Bridge supprimé · logo extrait en logo-gt.png (−193 Ko index.html) · touch targets 44px · :hover @media(hover:hover) · aria nav · v4.27
// v3.84 — P1 audit : _escAttr (utils.js) · XSS phyto note/produit/opérateur · apostrophes onclick parcelles/tâches/membres · échappement reglages+onboarding · storage.rules démo exclu
// v3.83 — P0 audit : fbLoginDemo/fbReadDemoTokens/fbLogDemoAccess/fbAdminWrite/fbCheckTenantExists (firebase.js) · retrait fût + upload analyse exposés (cave.js) · access_log {value:…} · règles demo_tokens/tenants/access_log
// v3.82 — Dark mode fix : color:var(--texte) sur #app-root + palette --*-pale rgba() + contraste textes
// v3.81 — Fix new Notification illégal mobile : _swNotify via SW (app.js + reglages.js)
// v3.80 — Fix notifications mobile : _swNotify via SW (new Notification illégal sur Android)
// v3.81 — Parcelles : bouton "Ouvrir dans carte" + toggle labels noms (noir jour / crème nuit)
// v3.79 — Carte Parcelles : labels noms vignes permanents (tooltip Leaflet centroïde)
// v3.78 — Masquage complet exports/imports non-admins : regl-export-row, ent-export-pdf-btn, cave-divers-exports
// v3.77 — Exports/imports masqués pour non-admins : cave Divers (switchCaveOng), guards silencieux reglages/planning/cave
// v3.76 — VRAIE CAUSE : ovCaveExport était enfant de #mv-critical-overlay (display:none) — </div> de fermeture manquant
// v3.75 — cave.js : suppression guard isAdmin() dans openOvCaveExport + generateCaveExport
// v3.74 — Cave Divers : fix root cause — div→span dans buttons (div enfant invalide HTML5 fermait le button)
// v3.73 — Cave Export Bridge : script non-module dans index.html (openOvCaveExport + generateCaveExport garantis sur window)
// v3.70 — Cave : amélioration contraste fiches cuvées (labels grille, valeurs, SO₂, ouillage alerte)
// v3.69 — Cave Journal : pills cuvées (vrais noms), boîte date analyse, tri par date_analyse
// v3.68 — Réglages : navigation par onglets (Domaine / Vigne / Équipe / App)
// v3.67 — KML dynamique : kml_polygons dans COLLECTIONS + fbAdminWrite cross-tenant + onglet KML Admin GT
// v3.66 — Fix controllerchange sans guard (navigation privée + premier install)
// v3.65 — Essais 30j : onglet Admin GT + écran code d'accès tenant démo + fonctions firebase.js
// v3.64 — cave.js: _vendCfg, masquage vues cross-section, noms cuvées dans journal, label date analyse, export PDF download
// v3.63 — Audit juin 2026 : 3 bugs (setInterval météo, CAVE_ELEVAGE analyses, ref morte), 7 incohérences (COULEURS_MBR, TABREV, GT_ADMIN_EMAIL, versions, Alicia, Relevage h/ha, sw.js doublon)
// v3.62 — Cave Divers : fix doublon #cave-view-divers · export PDF via Blob URL (popup blocker fix)
// v3.61 — Cave Élevage : champs FML terminée + sous tirage sur la cuvée (éditables a posteriori)
// v3.60 — Démo tenant (bannière + bouton auto-login) · Protection domaine · Minification Terser activée
// v3.58 — Parcelles : suppression icône card (nom plus grand) · Cave : rattachement PDF à opération analyse existante
// v3.47 (06/06/2026) — Cave : suppression section Stock · cuvée détail cliquable · edit analyse · fix onglets élevage · persistance vendange · parcelles : icône + taille nom
// v3.43 (06/06/2026) — Fix critique: revert _showAppLoader, sync vars ES module, msg erreur extension
// v3.42 (05/06/2026) — Extraction reglages.js (Phase 3b) : module Réglages séparé de app.js
// v3.38 (05/06/2026) — Journal : pagination 200 entrées/page + bouton Charger plus
// v3.37 (05/06/2026) — Carte Leaflet : invalidateSize() au retour sur Parcelles, plus de remove()/recreate
// v3.36 (05/06/2026) — Toast sur deleteSession + deleteHistoSnapshot (retour visuel suppression)
// v3.35 (05/06/2026) — XSS audit : _escHtml sur tous innerHTML Firestore/user (app.js ×22, planning.js ×4)
// v3.34 (05/06/2026) — Hub GT Admin : masquer cartes Vigne/Tracteur/Cave/Planning/Réglages pour login GUERETTECH
// v3.32 (05/06/2026) — Extraction planning.js (Phase 3a) : module Planning RH séparé de app.js
// v3.31 (05/06/2026) — Cave : accès membres + banner lecture seule saisonniers + masquage vue vendange au retour élevage
// v3.30 (05/06/2026) — Cave Vendange : récoltes, cuves vinif, journal FA, toggle vendu en raisin
// v3.29 (05/06/2026) — Fix GT login : window.setCurrentUser sync var locale app.js → hub carte Admin GT + sidebar GUERETTECH corrects
// v3.24 (05/06/2026) — Flag DEBUG : console.log silencieux en production (location.hostname !== localhost)
// v3.23 (04/06/2026) — Rapport PDF mensuel : arrachée exclue · Relevage N1/N2/N3 · mise en page colonnée
// v3.25 (05/06/2026) — Fix Admin GT : règles Firestore _guerettech ngdevpro@gmail.com · saisonNom array · slugs fallback robuste
// v3.22 (04/06/2026) — Météo temps réel : rafraîchissement 15min · fetchMeteoMoyenne() · meteo_snapshot sur entrées Validé · affichage bande météo dans jcard journal
// v3.21 (04/06/2026) — Extraction cave.js (Phase 2b) : module Cave Élevage séparé de app.js
// v3.17 — Login GT : suppression placeholder email (sécurité)
// v3.16 — Fix Cave : goTo('cave') appelait renderCave() seulement via DEV_MODULES → ajout dans goTo() directement
// v3.15 — Planning : acomptes salariés (PLANNING_ACOMPTES) · card amber dans fiche salarié · bloc PDF compta · Firebase planning_acomptes
// v3.14 — Phase 1a : extraction utils.js (showSyncBadge, showToast, dark mode, auth helpers, logError) · window.currentUser synchronisé login/logout
// v3.13 — Cave : sélecteur 3 sections (Vendange & Vinif · Élevage · Stock) · Vendange/Stock admin-only avec badge "En développement" · backToCaveSections() · caveSection state
// v3.11 — Édition h/ha par tâche dans Réglages : overlay openEditHha · types simple/passages/niveaux · badge ✎ modifié · fix _normalizeTaches préserve h/ha custom Firebase
// v3.10 — Fix P4 PDF saison : note parcelles arrachées dynamique (nom(s) + pluriel) au lieu de "Chazière" codé en dur
// v3.09 — Fix _normalizeTaches : tâches supprimées dans Réglages ne réapparaissent plus au login (ne réinjecte plus les standards absents)
// v3.08 — Fix P1 : renderSessionProgress() persiste avancement+statut session tracteur (saveData après calcul pct)
// v3.07 — Cépage : entreplantation checkbox · sélection jusqu'à 3 cépages par parcelle · p.cepages[] + p.entreplantation · badge dans openDP
// v3.06 — Planning RH : compteur CP activé (_planCpPris, _planCpSolde) · champ Solde initial CP dans editMembre · badge CP dans tableau Planning · Cépage par parcelle (CEPAGES, openDPCepage, saveDPCepage, ovCepage overlay)
// v3.05 — Fix } manquante renderReglages() L7572 (parseerror module ESLint) · Fix var mi redéclaré L3119
// v3.03 — Manifest dynamique par tenant : SW intercepte manifest.json → start_url avec slug correct · copyTenantLink + agtSlugPreview + saveAddTenant Admin GT
// v3.02 — Fix bug _emPickType undefined · Contrats CDD/TESA/Saisonnier/Extra : section renouvellement (date + nouvelle fin) · Alertes admin contrats dans les 30j · Badge 🔄 dans liste membres
// v2.97 — Cave Élevage : accès étendu à gueret.nicolas@gmail.com (DEV_EMAILS) pour tests domaine
// v2.96 — 3 états tâches : Commencé/Validé/verrouillé + bouton ↩ annulation pour tous · cascade niveaux Relevage
// v2.95 — ETP PDF mensuel : calcul absolu (ratio × nb salariés) · champ hidden pdf-nb-membres · label ETP équipe · exportPDFMois cohérent
// v2.99 — Cave Élevage : multi-cuvées + ouillettes + SO2 soutirage unique/répété
// v2.94 — Planning RH → PDF mensuel : pré-remplissage auto heures travaillées + référence · badges planning/modifié · ETP live · détail par salarié
// v2.92 — Admin GT redesign : 3 onglets (Clients/Accès log/Erreurs) · cartes dépliables · barre basse · design maquette intégré
// v2.91 — Re-patch GT_ADMIN_EMAIL=ngdevpro@gmail.com · suppression || nom===Nico tous guards · firebase.js commentaire
// v2.90 — GT_ADMIN_EMAIL → ngdevpro@gmail.com (séparation compte pro GUERETTECH / compte perso marchand-grillot) · firestore.rules _guerettech mis à jour
// v2.89 — Admin GT : GT_ADMIN_EMAIL constante centralisée · suppression || nom===Nico · fbAppendError cross-tenant (critical+error+warning→Firebase) · agtRenderErrorLog merge Firebase+localStorage · agt-sv3 erreurs header
// v2.87 — Planning modal: hintTpl+planCalcResult utilisent _planDayH comme référence (Thilio inclus) — cohérence Prévu/timing/diff
// v2.86 — Planning : tous les jours affiches · _planDayH timing annualisé · _planDefTiming: fin=debut+pl+pause (csv source verité), Thilio D/M/A → debut mensuel+fin 16h30 · PLAN_DEF_T corrigé +5h
// v2.85 — Heures card : bug fix N2/N3 niveaux à 0% corrigé · barre globale parent (total tâche + sous-niveaux) · renderHome() après confirmNiveaux/Passages/annulerTache
// v2.84 — Planning : pause déjeuner configurable (30min/1h/2h) · PLAN_PAUSE_MIN · sauvé dans config.pause_dejeuner · label continu corrigé
// v2.83 — iOS fix planning : .value explicite sur input[type=time] après innerHTML (Safari ignore l'attribut value)
// v2.82 — iOS fixes : safe-area-inset-top/bottom sur tous les headers/modals, anti-zoom inputs, toast repositionné
// v2.81 — Système de gestion des erreurs applicatives : logError() + intercepteurs globaux + overlay critique + dashboard Admin GT
// v2.80 — Fix obFinalize : TENANT_ID → fbSetTenant, fbDoc().set() → window.fbSave()
// v2.79 — Fix isolation tenants : LS_KEY tenant-aware, guard fbPushIfAbsent, onboarding si membres absent
// v2.78 — Admin GUERETTECH : page dashboard tenants, hub card, fbAdminRead/WriteGT
// v2.77 — CGU v1.1 intégrées : ovMentions complet, checkbox onboarding step 4, Réglages row mis à jour
// v2.76 — TenantId multi-tenant : suppression VALID_TENANTS whitelist → regex format slug ; manifest start_url → ?tenant=marchand-grillot
// v2.75 — SW : suppression postMessage SW_UPDATED → controllerchange natif dans app.js (plus fiable sur PWA Android)
// v2.74 — SW install résilient : Promise.allSettled sur tous les fichiers (locaux+CDN) → plus d'échec install sur mobile data
// v2.73 — SW : notifie la page via postMessage(SW_UPDATED) après clients.claim() → rechargement automatique PWA Android
// v2.72 — Réglages : suppression bouton "Tout valider P1" pour Ebourgeonnage et Pioche
// v2.71 — Tracteur : suppression session depuis ovSessionDetail (bouton admin 🗑 avec double-confirmation)
// v2.70 — Planning : contraste inputs Prise/Fin de service (color:#1a1a2e sur fond #f9f8ff)
// v2.69 — Planning : suppression PLAN_REF_H hardcodé · _planGetRefH calcule depuis grille template (filtre clés numériques) · récap heures référence dans éditeur template
// v2.68 — Planning : CP (type:cp,heures) dans PLANNING_ENTRIES · badge CP amber · Hors contrat grisé · Contrat type+dates dans editMembre+saveEditMembre
// v2.67 — Fix critique : window.PLANNING_TEMPLATES={} et PLANNING_ENTRIES={} mal placés dans bloc cave_elevage → resetaient les templates à chaque load · console.log version pour debug
// v2.66 — Fix critique : planning_templates + planning_entries ajoutés à COLLECTIONS + FB_REALTIME → chargement Firebase sur tous les appareils (téléphone) + re-render planning au changement
// v2.65 — Planning Saisie : sam/dim toujours visibles en mode admin (canEdit) pour saisir du travail le WE même si pl=0
// v2.64 — Fix sw.js clone error : try-catch autour de r.clone() dans cache-first (extensions Chrome type MetaMask consomment le body avant le SW)
// v2.63 — Planning CSV codes D/M/A : jours Thilio (début/fin modifiés) · _timings_jour dans template · _planDefTiming résout code par jour · badge T Thilio
// v2.62 — Planning CSV : séparateur point-virgule (Excel FR) · noms de mois (jan/fev/..) · oui/non pour continu · auto-détection séparateur à l'import
// v2.61 — Planning Templates : CSV ↑ par template · horaires timing dans CSV (lignes timing,mois,debut,fin) · suppression templates custom · _planDefTiming consulte _timings du template
// v2.60 — Fix HTML : #page-planning display:flex→active only · ovSession overlay wrapper ajouté · ovChampValidation div fermé (balance 1180=1180)
// v2.59 — Module Planning RH : tableau équipe, mon planning (horaires prise/fin service, continu), saisie admin, éditeur grille templates, CSV import/export, PDF feuille heures, membres dynamiques · 5e carte hub Planning
// v2.57 — Permissions tracteur renforcées : sections Réglages (Parc tracteurs + Activités) admin uniquement · boutons ajout cond/act admin uniquement · ✏️ conducteur chips admin uniquement
// v2.56 — Cave Élevage : barriques, soutirages, analyses (SO₂+FML), ouillages · Firebase cave_elevage · alertes ouillage admin-configurables
// v2.55 — Passages/Niveaux : override par parcelle Relevage · sélecteur Seul/Équipe dans Eb/Pioche · SAISON_PASSAGES unifié (Eb+Pioche+Relevage) · _computeAutoNiv generalisé planNb
// v2.53 — Fix pct>100% sur tâches simples (Réparation) : surf_total toujours rafraîchi · Reset TRAVAUX complet au login · Avancement Accueil par surface (cohérent avec heures card)
// v2.52 — Fix création membre : saveMembre() crée maintenant le compte Firebase Auth (app secondaire) · MDP défaut vigne21 effectif
// v2.51 — Relevage multi-niveaux (N1/N2/N3 + skip rule) · Eb/Pioche multi-passages · Migration Relevage 2 · Config passages
// v2.41 — Dark mode OS fix (media query + data-theme) · bg:white → bg-card audit complet · shimmer fix
// v2.40 — updateHubCaveCard robuste email+nom+_firebaseUser · debug console
// v2.39 — Dev mode Cave : guard DEV_MODULES+DEV_ADMIN_EMAIL · badge 🛠 Dev pour Nico · bientôt pour autres
// v2.38 — Fix phyto : openOvPhyto() peuple select avant ouverture · renderCatalogueTrac riche (catitem) · expo window
// v2.37 — En-têtes harmonisés 3 pages Vigne · Domaine sur Hub · meta row saison+date · stats band Accueil
// v2.36 — Fix definitif : bloc audit déplacé DANS l'IIFE (Rollup tree-shaking eliminait les assignations window.* hors-IIFE)
// v2.28 — Fix clic parcelle sessions · refresh + PTR · editSaison · tâche annulée propre · index v4.27
// v2.27 — Migration Vite+Firebase Hosting : network-first étendu aux assets JS hashés · fix onboarding PWA installée
// v2.26 — Fix SyntaxError ligne 3505 : apostrophe parasite dans catch confirmLogin · index v4.26
// v2.22 — Fix profils vides : guard vide dans loadData() pour MEMBRES/SAISONS/TACHES
// v2.17 — Onboarding intégré + tenantId · v2.06 — Firebase Auth · v2.00–v2.05 — divers
const DEBUG = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const CACHE_NAME   = 'mavigne-v6.41';
const TENANT_CACHE = 'mavigne-tenant';   // Cache persistant — préservé à chaque mise à jour SW
const SYNC_TAG     = 'mavigne-sync';

// Fichiers mis en cache à l'install
// Note : manifest.json retiré — désormais généré dynamiquement par le SW (start_url par tenant)
const SHELL_STATIC = ['./icon-192.png', './icon-512.png', './logo-gt.png', './boot.js'];
// Liste des assets Vite hashés du build courant — injectée dans dist/sw.js par
// scripts/inject-precache.mjs (npm run build). Vide en dev (placeholder).
const PRECACHE_ASSETS = [/*__MV_PRECACHE__*/];
const CDN_URLS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', event => {
  if(DEBUG) console.log('[SW] Ma Vigne v6.41 installé');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // ── Cœur applicatif : STRICT (mise à jour ATOMIQUE) ──
      // Si UN seul fichier échoue, l'install échoue : l'ancien SW et l'ancien
      // cache restent actifs, l'app continue de tourner — le navigateur
      // retentera l'installation plus tard. Aucune fenêtre où l'app dépend
      // du réseau pour démarrer.
      await cache.addAll(['./index.html', ...SHELL_STATIC, ...PRECACHE_ASSETS]);
      // ── CDN (Leaflet, fonts) : tolérant — non bloquant pour le boot ──
      await Promise.allSettled(CDN_URLS.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  if(DEBUG) console.log('[SW] Ma Vigne v6.41 activé');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        // Supprimer les anciens caches SAUF le cache courant ET le cache tenant (persistant)
        keys.filter(k => k !== CACHE_NAME && k !== TENANT_CACHE).map(k => {
          if(DEBUG) console.log('[SW] Suppression ancien cache :', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ne pas intercepter Firebase / Google
  // Ignorer les requêtes non-http(s) (chrome-extension://, data://, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Ne jamais intercepter les requêtes non-GET (POST Cloud Functions, etc.)
  // Cache.put() rejette tout sauf GET — v3.96
  if (event.request.method !== 'GET') return;

  // Cloud Functions : toujours réseau direct
  if (url.hostname.includes('cloudfunctions.net')) return;

  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic.com')) return;

  // ── Manifest dynamique par tenant ──
  // Intercepté en priorité : retourne un manifest avec start_url contenant le slug du tenant courant.
  // Le tenant est stocké dans TENANT_CACHE via message SET_TENANT (envoyé par firebase.js au chargement).
  // Fallback : 'marchand-grillot' si le cache tenant est vide (1er install avant firebase.js).
  if (url.pathname.endsWith('/manifest.json')) {
    event.respondWith(
      caches.open(TENANT_CACHE).then(function(cache) {
        return cache.match('current-tenant').then(function(resp) {
          return (resp ? resp.text() : Promise.resolve('marchand-grillot')).then(function(tenant) {
            var slug = (tenant && /^[a-z0-9][a-z0-9-]*$/.test(tenant) && tenant.length <= 50)
              ? tenant : 'marchand-grillot';
            var manifest = {
              name: 'Ma Vigne',
              short_name: 'Ma Vigne',
              description: 'Gestion viticole \u2014 Suivi parcelles, travaux, tracteur et phyto',
              start_url: 'https://mavigneapp.fr/?tenant=' + slug,
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#0F1319',
              theme_color: '#0F1319',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
              ]
            };
            if(DEBUG) console.log('[SW] Manifest servi pour tenant :', slug);
            return new Response(JSON.stringify(manifest, null, 2), {
              status: 200,
              headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'no-store'
              }
            });
          });
        });
      })
    );
    return;
  }

  // Météo : network-first, fallback cache BORNÉ DANS LE TEMPS
  // v5.91 : le repli servait n'importe quelle réponse déjà en cache, sans limite d'âge
  // et sans le moindre signe à l'écran. Une coupure ou une limite de débit suffisait donc
  // à réafficher, comme s'il s'agissait de l'instant présent, un relevé vieux de plusieurs
  // semaines — et une température de printemps un jour de canicule ne se voit pas comme
  // une panne, elle se voit comme un logiciel qui ment. Au-delà de MET_MAX_AGE on préfère
  // l'échec net : l'app sait dire « météo indisponible ».
  if (url.hostname.includes('open-meteo.com')) {
    const MET_MAX_AGE = 3 * 60 * 60 * 1000;
    const metStale = (reason) => new Response('{"error":true,"reason":"'+reason+'"}',
      { status: 503, headers: { 'Content-Type': 'application/json' } });
    event.respondWith(
      fetch(event.request).then(r => {
        if (r.ok) {
          const h = new Headers(r.headers);
          h.set('x-mv-cached-at', String(Date.now()));
          r.clone().blob()
            .then(b => caches.open(CACHE_NAME).then(c => c.put(event.request, new Response(b, { status: 200, headers: h }))))
            .catch(e => { if (DEBUG) console.warn('[SW] météo non mise en cache', e); });
        }
        return r;
      }).catch(() => caches.match(event.request).then(cached => {
        if (!cached) return metStale('offline');
        const at = +(cached.headers.get('x-mv-cached-at') || 0);
        if (!at || (Date.now() - at) > MET_MAX_AGE) return metStale('stale');
        return cached;
      }))
    );
    return;
  }

  // ── NETWORK-FIRST pour index.html uniquement ──
  // (F5 après deploy suffit toujours : l'index frais référence les nouveaux assets)
  const isNavigate = url.pathname.endsWith('/') ||
                     url.pathname.endsWith('/index.html') ||
                     event.request.mode === 'navigate';

  if (isNavigate) {
    event.respondWith(
      fetch(event.request).then(r => {
        if (r.ok) {
          const rc = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, rc));
        }
        return r;
      }).catch(() => caches.match(event.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // ── CACHE-FIRST pour les assets Vite hashés (immuables par construction) ──
  // v3.98 : un nom hashé (main-XXXX.js) ne change jamais de contenu → le réseau
  // n'apporte rien une fois l'asset en cache, et le réseau instable pendant une
  // mise à jour ne peut plus geler l'app sur le splash.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => {
          if (r.ok) { const rc = r.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, rc)); }
          return r;
        });
      })
    );
    return;
  }

  // CDN (Leaflet, fonts) et statics : cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(r => {
        if (r.ok) { try { const rc=r.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, rc)); } catch(e) {} }
        return r;
      }).catch(() => undefined);
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushOfflineQueue());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'FLUSH_QUEUE') flushOfflineQueue();
  // Mise à jour du tenant courant dans le cache persistant
  if (event.data?.type === 'SET_TENANT') {
    var tenant = event.data.tenant;
    if (tenant && /^[a-z0-9][a-z0-9-]*$/.test(tenant) && tenant.length <= 50) {
      caches.open(TENANT_CACHE).then(function(cache) {
        cache.put('current-tenant', new Response(tenant));
      });
      if(DEBUG) console.log('[SW] Tenant mis à jour :', tenant);
    }
  }
});

async function flushOfflineQueue() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' }));
}
