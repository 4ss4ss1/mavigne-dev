// MA VIGNE — Service Worker v6.95
// v6.95 (22/08/2026) — ELEVER EN CUVE, PAS SEULEMENT EN FUT.
//   Le Chai ne connaissait que la barrique : le volume d'une cuvee valait
//   nb_tonneaux x fut_l, et rien d'autre. Un parc a cuves vit desormais dans
//   CONFIG.cave.cuves[] — materiel durable, JAMAIS dans cuvee.tonneaux[], qui
//   alimente le parc a futs de La Reserve. Une cuve glissee dans tonneaux[]
//   aurait ete comptee comme un fut en vin par _mvFutParc, aurait recu un age
//   dans la pyramide, et aurait valu 228 L.
//   Les 29 sites qui convertissaient des futs en hL ont ete tries en DEUX
//   familles : « combien de vin » passe par _caveVolL (futs + cuves), « combien
//   de bois » ne bouge pas. Le denominateur de la part des anges reste en futs
//   seuls : y ajouter l'inox l'aurait SOUS-ESTIMEE.
//   _caveOuille garde l'ouillage : zero contenant en bois, pas de jauge, pas
//   d'alerte. Trouve par la preuve du jour 0 : une cuvee dont tous les futs
//   avaient ete retires affichait un « a ouiller » rouge PERMANENT.
//   Fichiers : cave.js, utils.js, app.js, index.html.
// v6.94 (20/08/2026) — LE RETARD SUR UN JOUR SUPPLEMENTAIRE.
//   Un jour de REPOS PREVU portant des heures saisies (07:00->16:30 = 8h30) a un
//   _planPlanned de 0. Le retard y repondait « aucune heure prevue ce jour-la »
//   et le verdict affichait « arrivee a 07:30, pas apres 07:00 ». QUATRE fonctions
//   prenaient la reference du jour de quatre facons : _planDayH par _planPlanned,
//   _planWorkH par _planDayH(null), _planAbsLostH par _planPlanned, _pl2Cell par
//   son propre calcul. Une seule repond desormais : _planRefH, ou le timing saisi
//   prime sur le planning. Le timing du jour survit aussi a l'enregistrement.
//   Fichiers : planning.js, utils.js, index.html.
// v6.93 (20/08/2026) — LE RETARD LIT L'HORAIRE DU JOUR, PAS CELUI DU PLANNING.
//   Correctif de 6.92. _planRetardBornes n'interrogeait que _planDefTiming : sur un
//   jour portant son propre horaire (ent.timing), l'ecran affichait un depart et le
//   moteur en comparait un autre. Une arrivee en retard ressortait « a l'heure,
//   aucune absence enregistree » et RIEN n'etait ecrit. Deux sources d'horaire pour
//   une meme journee — le defaut que le lot pretendait justement eviter.
//   Aussi : « a l'heure » recouvrait les jours hors contrat et non planifies ;
//   trois causes, trois compteurs, trois messages.
//   Fichiers : planning.js, utils.js, index.html.
// v6.92 (20/08/2026) — LE RETARD SE SAISIT PAR L'HEURE D'ARRIVEE.
//   Noter un retard mettait la journee entiere a ZERO heure et ne comptait aucune
//   heure due, sauf si le reglage « Absences qui doivent des heures » avait ete pose
//   — ce qu'il n'est pas par defaut. Une heure de retard coutait sept heures.
//   Le retard sort de cette fenetre : il retire ses propres heures, toujours.
//   Saisie par l'heure d'arrivee, case orange portant les heures faites, bascule
//   automatique en absence injustifiee si l'arrivee depasse la fin prevue.
//   Fichiers : planning.js, styles.css, utils.js, index.html.
// v6.91 (20/08/2026) — « INACTIF » N'EFFACE PLUS LE PASSE.
//   ⚠️⚠️ SEPT FICHES RANGEES EN FIN DE SAISON, ET JANVIER->JUILLET TOMBE A ZERO.
//     Sept ecrans du Planning partaient de _planMbrs(), qui filtre statut !==
//     'Inactif'. Or ce statut se pose A LA MAIN a la fin d'un contrat : il
//     effacait RETROACTIVEMENT des heures qui ont ete faites. Meme famille que
//     la mesure du 03/08 sur le Pilotage, restee non traitee cote Planning.
//   Une primitive unique, _planCouvre(mbr,d0,d1) + _planMbrsMois/_planMbrsAn :
//     « son contrat recoupe-t-il la periode ? », TOUS contrats confondus, le
//     statut ignore. Sept points d'appel : la grille du mois, la bande de KPI,
//     le badge d'effectif, « hors contrat », les anciens salaries, le recap
//     annuel, la cadence du Pilotage, le planning annuel imprime.
//   ⚠️ Sans AUCUNE date de contrat une fiche ne peut pas etre situee dans le
//     temps : active elle compte (CDI sans date), inactive elle ne compte que
//     si l'annee demandee porte des heures saisies.
//   Le recap annuel devient l'ENTREE DE MESURE 5/5 (mode large) : sa reference
//     se lit par _planSummary, bornee aux contrats, et non plus sur le modele
//     nu — un permanent embauche en aout portait sept mois de « prevu » face a
//     zero heure faite, et les barres tombaient au plancher. Une ligne de cadre
//     dit desormais ce que mesure la hauteur.
//   Reglages : le PDF mensuel lit enfin l'ANNEE du champ (_planSurAnnee) et
//     borne sa reference aux contrats ; les deux documents nominatifs proposent
//     les anciens salaries, marques comme tels.
//   ⚰️ _planHasContractThisMonth supprimee : zero appelant apres ce lot, preuve
//     par grep sur tout le depot AVANT d'obeir a C15 (cf. §51).
// v6.90 (18/08/2026) — LA CARTE DE PARCELLE, RANGEE.
//   ⚠️⚠️ UNE REGLE CSS ORPHELINE DEPUIS LA CHARTE DS-2. `.pc-ord` (le rang de
//     tournee) n'etait style que sous `.pc-nom`, le titre d'AVANT DS-2, que plus
//     aucun ecran n'emet. La pastille sortait sans aucun style : « 1Comble ».
//     Elle vit maintenant sous `.mv-t-ord`, avec une GOUTTIERE DE LARGEUR FIXE
//     — sinon « 1 » et « 12 » ne demarrent pas le nom au meme endroit.
//   Le rail d'action sort du padding de la carte et vient a fleur du bord, sur
//   toute la hauteur (`.pcard-qv{padding:0;overflow:hidden}` + padding sur
//   `.pc-left`) : le filet ne touche plus le pourcentage, et les 16 px de vide
//   a droite des boutons disparaissent.
//   ⚠️ Les deux glyphes du rail etaient des EMOJIS (0x2713, 0x23F3) : un emoji
//     ignore `color` et se dessine autrement sur chaque systeme. Sprite DS-1
//     (`check`, `sablier`), plus un libelle « Debut » / « Valider » / « Fait ».
//   Surface ecrite en francais (virgule), espace insecable avant le %.
//   Accompagnement (regle d'or n°4) : fiche MV_AIDE `parcelles` et guide 04-vigne
//   decrivent le rail et le numero de tournee.
// v6.89 (18/08/2026) — LE CARBURANT COMPTE LES PLEINS REELS, PLUS UNE ESTIMATION.
//   Le cout GNR etait heures de session x conso L/h x prix : une somme d'estimations,
//   dont une session non notee retirait silencieusement une part. Il vaut desormais la
//   somme des pleins releves, chacun au prix du litre a SA date ; les heures ne servent
//   plus qu'a repartir cette enveloppe entre les parcelles. Repli sur l'ancien modele
//   si aucun plein n'est releve — et l'ecran affiche alors « L ESTIMES ».
//   Cote saisie, cocher « Plein fait » dans une fiche d'entretien EXIGE les litres et
//   decompte la cuve, comme le bouton « Plein ».
//   ⚠️⚠️ CE LOT A D'ABORD ETE LIVRE EN 6.34/6.88 — numeros DEJA PRIS par le
//     correctif .mod-header-icon du 17/08. Construit sur un clone anterieur, il a
//     ecrase l'entree WHATS_NEW 6.34 et ce changelog 6.88, tous deux RESTAURES ici.
//     Le correctif lui-meme n'a rien perdu : il vit dans styles.css, jamais touche.
//     Lecon : cloner AVANT d'ecrire, pas avant de concevoir.
//   BUMP : utils.js modifie (MV_AIDE + WHATS_NEW + APP_VERSION). APP 6.34 -> 6.35.
// v6.88 (17/08/2026) — .mod-header-icon N'AVAIT JAMAIS DE COULEUR.
//   ⚠️ MEME PIEGE QUE LE DOCK EN 6.87, UNE REGLE PLUS LOIN. `.mod-header-icon`
//     n'a jamais eu de `color` : l'icone (currentColor) heritait de `--texte`,
//     sombre en theme clair, sur le fond sombre du bandeau — invisible tant
//     que c'etaient des emojis, expose des le passage en SVG (6.32 puis 6.33).
//     Titre, sous-titre et .mvu-tab avaient deja leur creme en dur ; l'icone
//     du bandeau principal, non. Meme correction : color:#F4ECD8 !important,
//     coherent avec le garde-fou deja pose contre un bandeau qui reclaircit.
//   ★ Partage par les 9 modules : corrige tous les bandeaux d'un coup, pas
//     que Planning.
// v6.87 (17/08/2026) — LES CINQ DERNIERS BANDEAUX + LES MODULES DU BAS EN RELIEF.
//   ★ BANDEAUX : Planning, La Reserve, Le Chai, Le Cuvier, Le millesime gardaient
//     leurs anciens dessins — 13 glyphes. ⚠️ Les trois en-tetes de la Cave etaient
//     ECRASES en `textContent` a chaque changement de section : l'icone SVG posee
//     dans index.html au lot 6.32 disparaissait des le premier clic. Passes par
//     `_mvSetIcon`, avec le nom de l'ONGLET DE SECTION correspondant.
//   ★ SPRITE 57 -> 59 : `barrique` (barrel) et `parcours` (waypoints). Un CADDIE
//     pour des futs et un BARIL DE PETROLE pour un chai disaient autre chose que
//     ce qu'on compte ; une HELICE D'ADN pour la ligne de vie du vin, de meme.
//     Regenere par build-sprite.mjs, les 57 formes existantes identiques a
//     l'octet pres (lucide 1.31.0, la meme que le sprite en place).
//   ★ DOCK : l'icone flottait nue. Elle vit dans un carre de 40 px, CREUSE au
//     repos, qui RESSORT en or quand on l'ouvre — deux ombres interieures
//     opposees, plus le filet de lumiere sur l'arete haute.
//     ⚠️ Le filet dore de 3 px au-dessus de l'onglet actif est RETIRE : deux
//       marqueurs pour un meme etat, c'est celui du haut qu'on ne lit jamais.
//     ⚠️ La couleur au repos n'est plus `--texte-doux` : #5F5F5F en theme clair,
//       elle etait deja plus sombre que son propre libelle sur le fond cave.
//   ★ `WHATS_NEW` accepte un NOM D'ICONE dans son champ `emoji` (_wnIco), et le
//     harnais LIT ce champ — sinon un nom mal ecrit rendait un carre pointille
//     sur l'ecran que tous les clients voient apres une mise a jour.
// v6.86 (17/08/2026) — METEO PAR SECTEUR + LES BANDEAUX DU HAUT.
//   ⚠️⚠️ « soleil » et « nuage » ECRITS EN TOUTES LETTRES par-dessus le nom de
//     la commune. `wx.emoji` porte un NOM d'icone depuis 6.82 et etait insere
//     tel quel. ★ TROISIEME point de lecture de ce champ decouvert APRES COUP
//     (en-tete Pilotage, mini-meteo, puis secteurs) : une bascule de format se
//     traite en cherchant TOUS les lecteurs d'un coup, pas au fil des captures.
//   ★ BANDEAUX : en-tete de module, sous-onglets, boutons ronds, pastille de
//     saison, mini-meteo — 39 glyphes sur 39 lignes. Sprite : 57 symboles.
//     ⚠️ `font-size` ne dimensionne plus rien quand le contenu devient une
//       image : .mod-header-icon et .mvu-tab-em passent en flex centre.
//       TROISIEME fois que ce piege revient (logo, ob-logo, ici).
//   ⚠️ RESTE ~260 pictogrammes dans index.html (overlays, formulaires, aides).
//     Le compteur les voit desormais : ils ne se cacheront plus.
// v6.85 (17/08/2026) — `euro` MANQUANT, ET LA REGLE QUI M'A FAIT LE SUPPRIMER.
//   ⚠️⚠️⚠️ TROISIEME PANNE CAUSEE PAR MA PROPRE ASSERTION « aucun symbole
//     declare sans emploi ». Elle m'a fait retirer `equipe`, `soleil`, `cle`
//     puis `euro` parce qu'aucun APPEL LITTERAL ne les citait — alors qu'une
//     table les demandait a l'execution. Trois carres pointilles chez le client.
//     ★★ Elle optimisait un NON-PROBLEME : quelques centaines d'octets de SVG
//       dans un sprite deja precache. Elle passe en AVERTISSEMENT, et la regle
//       devient : ON N'ENLEVE UN SYMBOLE QUE SUR PREUVE.
//       Un filet qui pousse a casser n'est pas un filet.
//   ⚠️ La convention de nom (_IC/_ICO/...) ne suffisait pas : `_PIL_TABS` est
//     une table de TRIPLETS `['cle','icone','Libelle']`. On ne peut pas lire
//     toutes ses chaines (la cle et le libelle n'en sont pas). Le harnais tient
//     donc un REGISTRE EN DUR des tables a triplets — assume : une liste
//     explicite et fausse se corrige, un trou silencieux non.
//   Sprite : 54 symboles.
// v6.84 (17/08/2026) — LES ONGLETS DU PILOTAGE + LE COMPTEUR QUI MENTAIT.
//   ⚠️ Les 10 entrees de `_PIL_TABS`/`_PIL_TOOLS` portaient encore des emojis
//     alors que leurs TROIS rendus etaient deja passes a `_mvIcon` : dix carres
//     pointilles a l'ecran. Cause : un script de patch interrompu en cours
//     n'ecrit RIEN, et j'avais suppose que sa premiere moitie avait pris.
//   ★★★ MAIS LE VRAI DEFAUT EST AILLEURS ET IL EST GRAVE : UN EMOJI ECRIT EN
//     ECHAPPEMENT EST INVISIBLE AU COMPTEUR. `'\uD83D\uDD17 planning'` ne
//     contient aucun caractere pictographique — ce sont des lettres ASCII.
//     Le cliquet mesurait l'ECRITURE du fichier, pas ce que voit l'utilisateur.
//     → Le compteur DECODE desormais avant de compter. Le compte reel n'est pas
//       169 mais 1358, et il ne l'a jamais ete : les chiffres annonces tout au
//       long des lots DS-1/DS-2 etaient faux, tous.
//   ⚠️ Consequence assumee : « zero emoji dans reglages.js » etait vrai sur un
//     comptage aveugle et faux en realite (115 restants). L'assertion devient
//     un CLIQUET (le compte ne peut que descendre) au lieu d'une cible fausse.
//     On ne baisse pas une exigence en douce : on remplace une cible fausse par
//     une mesure vraie, et on l'ecrit.
// v6.83 (17/08/2026) — PILOTAGE NE REPONDAIT PLUS. Correctif + le filet qui
//   manquait.
//   ⚠️⚠️⚠️ `_opEmo is not defined` : j'avais supprime la fonction en cherchant
//     ses usages sous d'autres formes (`emo+`, `.emos`, `_opParcTaskEmos`) mais
//     PAS `_opEmo(` lui-meme. Promesse rejetee -> plus un clic sur l'ecran.
//     ★★ NI `node --check` NI ESLINT NE LE VOIENT : la syntaxe est valable et
//       `no-undef` est desactive (a raison : les modules s'appellent par window).
//   ★★★ NOUVEAU CONTROLE C23 dans preflight : tout `_xxx(` appele doit etre
//     declare dans le fichier, importe, ou expose sur window quelque part.
//     La convention `_` = prive au module rend le controle exact, sans faux
//     positif. Il rejoue la panne du jour et rougit. 15e contre-epreuve.
//     ⚠️ Il a aussi fallu lui apprendre `var _a=.., _b=..` (2e declarateur) et
//       les expositions croisees, sinon deux faux positifs.
//   ★ METEO DE L'EN-TETE PILOTAGE : affichait « nuage » EN TOUTES LETTRES. Le
//     champ porte un nom d'icone depuis 6.82 et etait insere tel quel. Repli
//     sur la forme, comme ailleurs — le cache d'hier reste lisible.
//   ★ LA BARRE D'ONGLETS DE PILOTAGE etait la DERNIERE en emojis (9 onglets +
//     2 outils). C'est de la navigation : elle passe au sprite.
//     ⚠️ Les CLES (`auj`,`an`,`avc`,`equ`,`sim`,`cav`,`eco`,`cfm`) ne bougent
//       pas : memorisees chez les clients, citees par app.js, verifiees par C22.
//       On change l'icone, jamais la cle.
// v6.82 (17/08/2026) — DEUX SYMBOLES ABSENTS, ET LE HARNAIS QUI NE POUVAIT PAS
//   LES VOIR. Trouve par l'E2E DE LA CI, pas ici : « [icone] icone inconnue :
//   equipe » sur la page d'accueil.
//   ★ Le repli visible de `_mvIcon` a fait son travail : carre pointille a
//     l'ecran + ligne au journal. Sans lui, un blanc, et personne n'aurait rien
//     vu. C'est la justification retrospective du filet.
//   ⚠️⚠️⚠️ LE VRAI DEFAUT ETAIT DANS LE HARNAIS : son lecteur de tables faisait
//     `if (!symboles.has(nom)) continue;` — il SAUTAIT les noms absents au lieu
//     de les signaler. UN CONTROLE QUI, PAR CONSTRUCTION, NE PEUT PAS ECHOUER.
//     Il est reste vert du debut a la fin du lot.
//     → Il lit desormais la VALEUR de chaque paire `cle:'valeur'`, et un nom
//       absent est un ROUGE. Des sa correction il a trouve `soleil` (MV_METEO_IC)
//       en plus d'`equipe` : le beau temps rendait un carre pointille.
//   ⚠️ `FB_STATIC` finit par « IC » : douze faux positifs. Le motif exige
//     maintenant un dernier SEGMENT SOULIGNE (_IC/_ICO/_ICON/_ICONE/_ICONES).
//     `TICON` devient `TACHE_ICO` pour suivre la convention.
//   ⚠️ Pilotage avait DEUX tables en cascade (`_PIL_TILE_ICO` -> `_PIL_IC` ->
//     sprite). Une table dont les valeurs ne sont PAS des noms d'icones est
//     indistinguable d'une table dont elles le sont : l'indirection est
//     supprimee, une seule table, toutes valeurs = sprite. Sprite : 53.
//   ★ 14e contre-epreuve : « une table qui demande un symbole absent ».
// v6.81 (16/08/2026) — LA CHARTE D'ILOTS : ACCUEIL ET PARCELLES (DS-2).
//   DS-1 avait change les pictogrammes et ca n'a PAS suffi : ce qui faisait
//   brouillon n'etait pas l'icone, c'etait le CONTENANT. Quatre briques dans
//   styles.css — l'ilot `.mv-c`, la hierarchie a TROIS niveaux (.mv-t / .mv-n /
//   .mv-l), le badge `.mv-bdg` et le bouton fantome `.mv-gh`.
//   ★ TROIS NIVEAUX DE TEXTE, JAMAIS QUATRE. Un quatrieme et la hierarchie ne
//     se lit plus : c'est precisement ce qui donnait l'effet brouillon.
//   ★ L'ETAT SE POSE A DROITE, toujours — c'est l'alignement vertical des
//     badges qui rend une liste de 46 parcelles scannable. Et `tabular-nums`
//     sur les chiffres : sans lui, « 62 % » et « 100 % » ne s'alignent pas
//     d'une carte a l'autre.
//   ★ QUATRE TONS DE BADGE, ENSEMBLE FERME (`_mvBadge`) : vert / ambre /
//     rouge / neutre. Un ton inconnu retombe sur neutre ET part au journal.
//   ⚠️ AUCUNE COULEUR D'ETAT EN DUR. Les fonds sont en `color-mix` de la teinte
//     du theme : un #EAF5E4 ecrit en dur est juste sur la carte claire et vire
//     sale en sombre. Le harnais garde les quatre tons et les 12 briques.
//   ★ LE DRAE PASSE EN BADGE ROUGE puis en encart dedie dans la fiche : c'est
//     reglementaire, ca doit arreter l'oeil, pas se deviner sur un liseré.
//   ★ REGLAGES Y EST PASSE AUSSI : ligne d'un travail, activite tracteur,
//     rubriques de la fiche membre. Les badges maison a couleur ecrite en dur
//     (#4A9FC8, rgba(61,107,39,...)) sont remplaces par `_mvBadge`.
//   ★ LE CLIQUET A FAIT SON TRAVAIL : en retirant les icones decoratives des
//     listes, trois symboles se sont retrouves sans appelant (cle, euro,
//     soleil). Retires de la CORRESPONDANCE (scripts/build-sprite.mjs), pas
//     du sprite a la main : 36 -> 33 symboles.
//   ★ ACCUEIL : le delai de rentree et « ma semaine » passent a la charte.
//     ⚠️ `home_layout` n'etait PAS un blocage : il indexe par la CLE du widget
//       (data-w), pas par la structure interne. Annonce comme bloquant sans
//       avoir ete lu — verifier, ne pas croire, y compris sa propre prudence.
//   ⚠️⚠️ REGRESSION CAUSEE PAR CE LOT, ET REPAREE : le mode COMPACT de
//     l'accueil visait les enfants de #home-stat-content PAR LEUR RANG
//     (`>div:first-child`). La charte a change cet ordre : la regle visait le
//     mauvais bloc, en silence. Le mode compact est une preference PAR
//     UTILISATEUR — personne ne l'aurait vu. Les regles visent des CLASSES
//     desormais, et le harnais interdit le selecteur de rang.
//   ⚠️ Un element VIDE garde son fond et sa marge : #home-stat-picto et
//     #home-stat-chip sont masques par `:empty`. Vider n'est pas masquer.
//   ★ ACCUEIL COMPLET : delai de rentree, ma semaine, derniers travaux, ma
//     part du chantier, raccourcis, pastille de priorite.
//   ★ BARRE DE NAVIGATION : les emojis passent au sprite (35 symboles, +verre
//     +plus). ⚠️ `filter:grayscale()` etait la pour DESATURER UN EMOJI, qui
//     gardait sa couleur quoi qu'on fasse. Une icone suit `currentColor` :
//     l'onglet inactif s'eteint par la COULEUR, pas par un filtre qui grise
//     le trait et se voit en sombre.
//   ⚠️ Le harnais ne voyait pas les noms passes par une TABLE (`ic:'verre'`) :
//     `verre` passait pour mort, et les autres n'echappaient au rouge que
//     parce qu'ils servaient AUSSI ailleurs — par chance. Corrige.
//   ★ ACCUEIL TERMINE : mise en route, avancement par tache, carte tracteur.
//     ⚠️ La carte tracteur GARDE son fond sombre (contraste en cabine) : elle
//       prend la hierarchie de la charte, pas son fond. La charte encadre,
//       elle n'uniformise pas ce qui a une raison d'etre different.
//   ★ JOURNAL : chaque entree devient un ilot, l'etat en badge a droite.
//     ⚠️ La FRISE verticale de gauche reste : elle porte la lecture du temps.
//     La pastille 👥 disparait — « Equipe (Victor + Lea) » le dit deja en mots ;
//     sa regle CSS part avec elle, une regle morte finit par etre recopiee.
//   ★ TRACTEUR : 127 -> 35 pictogrammes. Sessions, parc, fiches de controle,
//     historique de reparations. Les badges maison (tpc-badge, tpc-pill,
//     sc-st) passent a `_mvBadge`.
//     ⚠️ `.scard-enc` GARDE son fond sombre : une session en cours se lit en
//       cabine, au soleil. Elle prend la hierarchie, pas le fond.
//     ⚠️ `✱` RESTE : c'est un signe de renvoi typographique, pas un emoji.
//     ⚠️ Vider une variable (`var em=''`) laisse une espace en tete de titre :
//       « ␣Broyage ». On SUPPRIME la variable, on ne la vide pas.
//   ★ CAVE : 73 -> 17 pictogrammes. Recoltes, cuves, analyses, clients vrac.
//     Les huit operations de cuve perdent leur emoji : huit dessins a retenir,
//     c'etait sept de trop — le mot les dit mieux.
//     ⚠️⚠️ TROISIEME FOIS AUJOURD'HUI : la passe de retrait a VIDE les deux
//       etats vides (`<div class="mvv-empty-ic"></div>`). Un ECRAN VIDE est
//       l'un des trois cas ou l'icone RESTE. Restaures.
//     ⚠️⚠️ `_mvIcon` a ete pose dans cave.js SANS ETRE IMPORTE : ESLint n'a
//       rien dit (no-undef ne couvre pas les globales) et l'ecran aurait
//       plante a l'ouverture. Un appel sans import ne se voit qu'a l'usage.
//   ★ APP : 177 -> 125. Messages de connexion, ecrans d'attente et de verrou,
//     filtres par tache, avancement par tache, alerte gel.
//   ⚠️⚠️ REGRESSION DE MA PROPRE PASSE, ATTRAPEE : le « ✓ » de
//     `_mapLabelsVisible ? '🏷 Noms ✓' : '🏷 Noms'` etait la SEULE difference
//     entre les deux etats. Le retirer a donne deux branches identiques : le
//     bouton ne disait plus rien, et RIEN NE PLANTAIT. Nouvelle assertion —
//     « aucun ternaire ne rend deux fois la meme chaine » — qui a trouve DEUX
//     autres cas des sa premiere execution, dont un anterieur au lot
//     (planning.js:425, un faux choix depuis toujours).
//   ★ Avant de retirer un glyphe : verifier qu'il ne porte pas a lui seul une
//     DIFFERENCE entre deux etats.
//   ★ UTILS + METEO : 74 -> 66. Les ONZE fiches d'aide portent un nom du
//     sprite dans `ico` ; `wmoEmoji` devient `wmoIcone` et rend un NOM.
//     ⚠️ `wmoEmoji` reste EXPORTEE en repli : un module non migre qui
//       appellerait `wmoIcone` afficherait « nuage » en toutes lettres.
//     ⚠️ Le champ `emoji:` GARDE son nom : il part en cache et dans les
//       instantanes meteo du journal. On change ce qu'on y MET, pas son nom.
//       `_mvSetIcon` tranche sur la forme : le cache d'hier reste lisible.
//     ⚠️ La correspondance meteo vit dans une TABLE (`MV_METEO_IC`), pas dans
//       une cascade de `return` : des noms rendus en dur par une fonction
//       sont invisibles au harnais, qui les declarait « symboles morts ».
//   Sprite : 46 symboles (+10 : meteo, livre, bogue, carte, journal).
//   ⚠️ Sur les 66 restants d'utils.js : 26 sont les EMOJIS DU JOURNAL DES
//     NOUVEAUTES (un par entree — c'est un journal, pas de l'habillage) et 19
//     sont TEMOJI, encore lu par pilotage.js. Il reste donc 21 vrais.
//   ★★ PILOTAGE : 29 -> 6, et surtout LA DEUXIEME BIBLIOTHEQUE D'ICONES
//     DISPARAIT. `_pilIco` embarquait QUINZE formes en SVG inline, avec sa
//     propre epaisseur (1,6 contre 1,75). Deux bibliotheques, c'est deux
//     grilles et un jour deux dessins pour la meme idee. Il ne reste qu'une
//     correspondance `_PIL_IC` vers le sprite commun. Sprite : 50 symboles.
//     ⚠️ `_pilTile(id, ico, ...)` : le 2e argument n'etait PLUS LU depuis que
//       l'en-tete passe par `_pilIcoFor(id)`. Il ne transportait que des
//       emojis morts. Retire des 25 appels. Un parametre qu'on ne lit plus
//       finit par mentir.
//     ⚠️ `.pil-th-ico svg{width:14px}` ECRASAIT la taille posee par `_mvIcon`
//       (le CSS l'emporte sur un attribut de presentation) — le piege deja
//       documente dans .mv-ic, et il etait la AVANT le lot.
//     ★ L'echelle `--pt-*` de ce module N'EST PAS TOUCHEE : elle a onze pas,
//       son propre harnais, et la charte n'en a que trois. Les unifier est un
//       arbitrage, pas une conversion — c'est DS-3.
//   ⚠️⚠️ QUATRIEME angle mort du meme type dans le harnais : un nom d'icone
//     range dans une TABLE lui est invisible. La liste en dur qu'on rallonge
//     a chaque incident est remplacee par une REGLE : toute table dont le nom
//     finit par IC/ICO/ICON/ICONES est lue, dans n'importe quel module.
//   ★★★ `TEMOJI` EST SUPPRIMEE. Elle associait un emoji a chaque travail et
//     etait lue 14 fois dans app.js, 2 dans pilotage.js, 3 dans reglages.js.
//     Partout, l'emoji precedait un NOM DE TACHE deja ecrit a cote : il ne
//     disait rien de plus. `TICON` la remplace et rend un NOM D'ICONE.
//     ⚠️ Ne pas la reintroduire « juste pour une liste » : c'est comme ca
//       qu'elle etait arrivee.
//   ★ PHYTO (25->10), FIREBASE (25->11), ONBOARDING (14->0). Le bandeau de
//     synchro, les erreurs de connexion, la premiere installation : des
//     puits de texte pur, ou la couleur disait deja tout.
//   ⚠️ LA CONTRE-EPREUVE DEPENDAIT DE L'ORDRE D'EXECUTION : l'epreuve « le
//     compte remonte » restait verte si la reference du depot datait d'avant
//     une baisse. Le bac regrave desormais SON cliquet avant d'injecter.
//     Une contre-epreuve ne doit dependre que de la faute qu'elle pose.
//   ★ TRACTEUR 35 -> 7, APP 119 -> 92. Boutons d'une fiche parcelle, points de
//     controle, canaux de discussion, pastilles d'etat.
//     ⚠️⚠️ EN SUPPRIMANT LE CHAMP `icon` DES SIX POINTS DE CONTROLE, J'AI
//       LAISSE TROIS LECTURES DE CE CHAMP : elles auraient rendu « undefined »
//       a l'ecran. ESLint ne dit rien d'un champ d'objet absent. C'est le
//       revers du piege « vider n'est pas supprimer » : supprimer la SOURCE
//       sans chercher qui la LIT. Cherche `\.champ\b` apres chaque retrait.
//     ⚠️ Meme famille : l'ancre d'un des retraits existait DEUX fois avec la
//       meme indentation — l'assert count==1 a sauve la mise.
//   ★ RESTENT TYPOGRAPHIQUES, donc conserves : « ↩ » dans la phrase qui decrit
//     le geste (« Tap 1 = commence, ↩ annule ») et « ↑ 24° ↓ 12° » (min/max).
//   ★ APP 92 -> 58. Bandeau de synchro, bulle d'etat, equipe du jour, filtre
//     du journal, roue d'attente, parc tracteur en mode GT.
//     ⚠️⚠️ DEUX FILTRES TESTAIENT LA PRESENCE D'UN EMOJI DANS LE MESSAGE du
//       bandeau (`/Synchronisation|🔄|rétablie|📶|…/`). Les messages n'en ont
//       plus : le test ne serait plus JAMAIS tombe juste, et le bandeau aurait
//       garde la mauvaise couleur. Ils testent desormais les MOTS.
//       ★ Retirer un emoji d'un message, c'est aussi casser qui le CHERCHE.
//     ★ L'assert `count==1` a de nouveau mordu : le champ `icon` des points de
//       controle avait ENCORE un lecteur ici (doublon GT de tracteur.js).
//       La regle posee au tour precedent a servi des le tour suivant.
//   ★ ADMIN-GT : 72 -> 7. La console operateur passe aux memes icones.
//     ⚠️ Le JOURNAL D'ACCES est ecrit en base : les lignes d'avant ce lot
//       portent un emoji, celles d'apres un nom. `_agtIco` traduit A LA
//       LECTURE — un journal qu'on reecrit n'est plus un journal.
//     ⚠️⚠️ TROIS ECHECS PARTIELS DE SUITE SUR CE FICHIER, meme cause : un
//       script qui echoue au milieu N'ECRIT RIEN, mais les scripts PRECEDENTS
//       ont ecrit. L'etat reel n'est jamais celui qu'on croit. Ici `_agtIco`
//       etait APPELE sans etre DEFINI — invisible jusqu'a l'ouverture.
//       → Relire le fichier avant chaque lot d'ancres (§25).
//   ★ LE LOGO GT remplace l'emoji grappe sur les TROIS ecrans d'entree :
//     connexion, onboarding, fin d'installation.
//     ⚠️ L'ID `login-logo-tap` RESTE SUR LE CONTENEUR, pas sur l'image : le
//       geste des CINQ TAPS qui ouvre la console GT y est branche
//       (onboarding.js). Le deplacer aurait coupe l'acces operateur en
//       silence — et personne d'autre que Nico ne l'aurait vu.
//     ⚠️ `font-size` ne dimensionne plus rien quand le contenu devient une
//       IMAGE : les trois conteneurs passent a une hauteur FIXE, sinon
//       l'ecran saute pendant le chargement.
//     ★ `logo-gt.png` etait deja dans SHELL_STATIC : en cache des
//       l'installation, donc present hors ligne au tout premier ecran.
//   Cliquet : 920 -> 169 pictogrammes rendus (82 % de moins).
//   ★★ DS-3 — LES DEUX ECHELLES. `--e-0..8` (multiples de 4) pour l'espace,
//     et la charte DS-2 adopte `--pt-*` pour le texte.
//     ⚠️⚠️ `--pt-*` ETAIT DEJA DANS :root — ce n'est PAS l'echelle de Pilotage,
//       c'est celle de l'APPLICATION, et ma charte l'avait ignoree en ecrivant
//       six tailles a la main. Une echelle qu'on ignore n'en est plus une.
//     ⚠️ LA FEUILLE N'EST PAS REECRITE D'UN COUP : remapper 800 declarations
//       sans pouvoir verifier une capture serait un pari. La charte s'y range,
//       le reste est tenu par un CLIQUET (1004 valeurs hors echelle, qui ne
//       peut plus monter) et se resorbe ecran par ecran.
//     ⚠️ Le harnais d'echelle ne COMPILAIT PLUS apres mon ajout (collision de
//       nom `enDur`) : ses 25 assertions ne tournaient plus du tout, et le
//       lanceur affichait quand meme un resultat. Et `--baseline` etait lu
//       comme un nom de fichier — drapeaux desormais filtres des chemins.
//   ⚠️ RESTENT, et pourquoi : utils 47 (dont 26 = un emoji par entree du
//     journal des nouveautes, c'est sa forme), app 58 (dont 14 de semence
//     ACTIVITES bloquee par les <option>, et des legendes ✓▶○ typographiques),
//     reglages 18 (_ACT_EMOJIS, exemptes), firebase 11, phyto 10.
// v6.80 (16/08/2026) — LES EMOJIS DE REGLAGES DEVIENNENT UN JEU D'ICONES (DS-1).
//   Sprite de 36 <symbol> LUCIDE dans index.html + `_mvIcon` / `_mvIconInline` /
//   `_mvSetIcon` dans utils.js. reglages.js : 243 pictogrammes -> 0 rendu.
//   ⚠️ TROIS PUITS NE PEUVENT PAS RECEVOIR DE SVG, et c'est structurel :
//     · showToast fait `m.textContent = msg` — 82 glyphes retires, la pastille
//       de couleur disait deja refus / avertissement / succes ;
//     · un DOCUMENT IMPRIME s'ouvre dans un autre onglet, sans le sprite :
//       <use href="#ic-x"> n'y rend RIEN. D'ou `_mvIconInline`, qui recopie la
//       forme relue dans le sprite du DOM. Une seule source, pas deux tables ;
//     · une balise <option> ne peut pas contenir d'icone — `a.emoji` reste donc
//       un emoji en base, range dans `data-emoji`, traduit par `_actIcone` a
//       l'affichage. Zero ecriture en base. La bascule viendra avec les <option>.
//   ★★ LES FORMES VIENNENT DE LUCIDE (ISC, lucide.dev), regenerees par
//     scripts/build-sprite.mjs a partir du paquet `lucide-static`. TROIS jeux
//     dessines a la main ont ete refuses avant : sur 36 dessins, la coherence
//     d'une bibliotheque entretenue ne se rattrape pas a la main.
//     ⚠️ NE JAMAIS retoucher une forme dans index.html : le prochain passage
//       du script l'ecrase sans bruit. La correspondance est dans le script.
//     ⚠️ `lucide-static` n'est PAS dans package.json : le sprite est commite,
//       ni la CI ni un client n'en ont besoin.
//   ★ UNE SEULE GRAISSE (1,75 dans .mv-ic) et UNE SEULE ECHELLE DE TAILLES :
//     16 en ligne · 18 bouton · 20 ligne · 24 tuile · 40 ecran vide. 78 appels
//     ramenes dessus. Deux icones de meme niveau a deux tailles differentes,
//     c'est le premier signe du bricolage : le harnais le refuse.
//   ★ LA TUILE `_mvIconTuile` : l'icone dans un carre teinte de 34 px, pour
//     les LIGNES et les RUBRIQUES seulement — jamais en pastille, ou elle
//     ecraserait le texte. Fond en `color-mix` : suit le theme.
//   ★ `▲ ▼ →` RESTENT : un triangle colle a un pourcentage est un signe de
//     delta, une fleche dans une phrase est de la ponctuation. Exemptions
//     nommees dans le harnais, pas un zero absolu.
//   ★ Harnais `mv-harnais-icones.mjs` + sa contre-epreuve, branches en CI :
//     tout appel a son symbol, aucun symbol mort, aucune forme ne fige sa
//     couleur, aucun document imprime n'appelle `_mvIcon`, et le compte global
//     d'emojis ne remonte jamais (cliquet a 654).
// v6.79 (15/08/2026) — CINQ VIGNETTES RECALEES A L'OEIL, ET PLUS AUCUN MONTANT.
//   ⚠️ 144 assertions vertes n'avaient PAS vu ces cinq-la. Un harnais verifie
//     ce qu'on facture et ce qu'on vise ; il ne voit pas un projecteur mal pose
//     ni une phrase qui decrit un autre ecran. Sur une demo, l'assertion la
//     moins chere reste un oeil.
//   ★★★ 4/19 — L'OUVRIER ATTERRIT SUR SA LISTE DE PARCELLES, pas sur l'accueil.
//     `pTacheFilter` se pose DANS ce moment : sans filtre, _pvActions sort vide
//     et il n'y a aucune coche a montrer.
//   ★★★ 5/19 — LE MEME BOUTON DES DEUX COTES. Le moment disait « notez-le » : on
//     ne voyait ni que l'ouvrier coche lui-meme, ni qu'un oubli se rattrape.
//     canWrite() est vrai pour l'ouvrier comme pour l'admin — c'est ce qui
//     repond a « et s'il oublie ? », la vraie objection.
//   ★★ 8/19 — LE TEXTE PARLAIT D'UN CHRONO QU'ON NE VOIT PAS.
//     _chronoEnabledForSession exige CONFIG.chrono_mode==='on' ET une mesure
//     ouverte ; le scenario n'en ouvre aucune. La liste des sessions porte deja
//     l'argument : les parcelles FAITES, cochees une par une.
//   ★★★ 13/19 — « Jean, une heure de retard » NE SE VOIT PAS : il est marque
//     absent. DEFAUT PRODUIT, pas defaut de demo : _pl2Cell rend TOUTE entree
//     `absent:true` par la meme croix rouge, avant meme de lire `motif` et
//     `motif_h`. Un retard d'une heure et une journee entiere s'affichent
//     pareil. Narration recalee ; le correctif du tableau est au backlog.
//   ★★ 15/19 — LA SURBRILLANCE SUIVAIT LE MAUVAIS BLOC. Le texte parle de
//     marge, de charge et de cadence : tout cela vit dans `.pil-cockpit-card`.
//     La cible etait `.pil-dec`, le bloc D'EN DESSOUS — qui contient la carte
//     « Traiter ? » deja eclairee au moment 2 (§35e, encore).
//   ★★★ ZERO MONTANT DANS L'ADDITION. Elle donnait un cout « par heure rendue »
//     apres avoir donne une soustraction en euros. Les deux sont partis : ni
//     symbole EUR, ni abonnement, ni installation, ni taux horaire. Le gain se
//     dit en heures et en journees de bureau, ligne par ligne, chacune adossee
//     a un ecran. Le prix appartient a la conversation, pas a la demonstration
//     — et le harnais l'interdit desormais (4 motifs + contre-epreuve).
// v6.78 (15/08/2026) — LA VISITE GUIDEE, REVUE DE BOUT EN BOUT.
//   ★★★ TROIS MOMENTS QUI MANQUAIENT. « Ce que voit Jean » (bascule reelle sur
//     le role ouvrier) : l'objection numero un d'un patron n'est pas le prix,
//     c'est « mes gars ne s'en serviront pas », et la visite entiere se jouait
//     depuis le fauteuil du chef. « Le jour du controle » montre desormais deux
//     parcelles FERMEES par un delai de rentree — le seul moment ou le logiciel
//     rattrape l'utilisateur au lieu de l'assister. « La date qui ne rentre
//     pas » ouvre les echeances par tache : une date et des heures restantes,
//     pas un pourcentage.
//   ★★★ LE CHIFFRAGE NE FACTURE PLUS CE QU'IL NE MONTRE PAS. La plus grosse
//     ligne du total (« retrouver l'info », 37 h, un tiers) n'etait demontree
//     par AUCUN moment : elle sort du total et s'annonce a part. Trois lignes
//     neuves la remplacent, chacune adossee a un ecran : pointage du soir,
//     carnet tracteur, papiers du controle. 111 h -> 127 h demontrables.
//   ★★★ LA CLOTURE NE SE SABORDE PLUS. Elle finissait sur « +260 EUR la
//     premiere annee » : une marge plus mince que le scepticisme du lecteur.
//     Le gain reste en HEURES, le cout se dit en heures de main-d'oeuvre, et
//     la fin donne un SEUIL HORAIRE que le lecteur valide avec son propre taux.
//   ★★ « PASSER » PROMETTAIT UN SAUT ET FAISAIT UNE SORTIE : sauter un ecran
//     faisait perdre tous les suivants ET l'addition. Deux boutons distincts,
//     et « Quitter » mene desormais a l'addition, pas au menu.
//   ★★ _mvtQuery REFUSE UNE CIBLE INVISIBLE. Depuis §42 les cartes du Pilotage
//     arrivent repliees (.pil-tbody en display:none) : querySelector trouvait
//     l'element, il mesurait zero, et les masques couvraient l'ecran ENTIER.
//     Aucun moment ne tombait dedans aujourd'hui — la garde est posee avant
//     que le premier n'y tombe. C22 voit qu'un selecteur existe, jamais qu'il
//     est visible.
//   ★ L'onglet Economie s'ouvrait sur « Synthese » pendant qu'on parlait du
//     cout par parcelle : la sous-vue est desormais forcee, comme le depli de
//     la carte des echeances (_mvtPecSub, _mvtPilOuvrir, et un delai `wait`
//     par moment).
//   ★ Duree annoncee : quatre minutes (mesuree a ~5, annoncee a 3).
//   ★ Le Cuvier sort du parcours et reste dans les 26 ecrans : trois moments
//     de cave d'affilee cassaient le rythme.
// v6.77 (15/08/2026) — CE QUI N’ETAIT PAS A SA PLACE. Quatre lots, sur retour
//   de Nico, tous sur la MEME question : un chiffre range sous une echelle qui
//   n’est pas la sienne.
//   ★★★ LE BANDEAU DES QUATRE PHOTOS N’EST PLUS UN BANDEAU. Il sortait sur les
//     HUIT onglets. Sur Economie et sur Conformite, la photo repetait mot pour
//     mot l’ecran juste en dessous — et le code l’admettait deja : cliquer une
//     photo depuis son propre onglet ne navigue pas, elle DEFILE. Un « voir le
//     detail » qui ne peut que descendre dans la page est l’aveu qu’il n’avait
//     rien a faire la. Les photos vivent desormais sur les DEUX niveaux de zoom
//     (`an`, `avc`) et nulle part ailleurs — _pilPhotosIci(tab).
//   ★★ LA PHOTO CONFORMITE PART, ET LA MESURE EST PLUS FINE QUE « QUATRE
//     ECHELLES ». Travaux est une SOMME sur la portee, Effectif un MAXIMUM
//     hebdomadaire sur la portee, Budget une somme en euros : trois statistiques
//     legitimes de la meme fenetre. Le cuivre, lui, roule sur SEPT ANS GLISSANTS
//     et ignore la portee. C’est le seul vrai intrus. 4 colonnes -> 3.
//   ★★ UNE SEULE FENETRE DE TRAITEMENT. _pilCkTraiter et _pilPanelTraitement
//     lisaient le MEME _pilTreatDays() dans deux onglets. Le guide tranchait deja
//     la place sans qu’on l’ecoute : « l’indicateur qu’on regarde le soir » est une
//     decision DU JOUR. Le dessin des cinq jours est EXTRAIT (_pilTreatRows), pas
//     recopie — recopier, c’est garantir la divergence. Il arrive derriere un
//     <details> : la grille .pil-dec est en trois colonnes, cinq lignes toujours
//     ouvertes auraient etire les deux cartes voisines.
//   ★ LE REGISTRE PHYTO DESCEND DANS CONFORMITE, en detail de « Passages phyto »,
//     qui lit les memes traitements. ⚠️ La cle `mat_phyto` NE CHANGE PAS : elle est
//     gravee dans le localStorage des clients, la renommer rallumerait la carte
//     chez qui l’avait eteinte.
//   ★★ « SIMULER » DEVIENT « DECIDER ». Deux des trois cartes sont en lecture
//     seule et le disent. La troisieme ECRIT CONFIG.ordre_passage_t et pilote
//     l’ecran Vigne de l’equipe : la seule carte du module qui touche une donnee
//     partagee, rangee sous un verbe qui promet qu’il ne se passe rien.
//     ⚠️ Retour en arriere ASSUME : §34 lot 5 avait declare « Decider » mort. Il
//     l’avait tue quand la barre etait une liste de SUJETS ; c’est un axe de ZOOM
//     depuis, et un verbe en bout d’axe se tient. La cle `sim` ne bouge pas.
//   ★ LE BUDGET DE L’ANNEE, MOIS PAR MOIS (`an_budget`). Deux courbes cumulees :
//     le prevu au bareme (cd.months[].chargeOrd x _ecoRate) et la depense reelle
//     (_pexData.byM), arretee au mois courant — la prolonger a plat ferait lire
//     « plus rien ne sort » la ou il n’y a pas de donnee.
//     ⚠⚠⚠ LE GRAPHE DEMANDE — « bareme prevu contre bareme FAIT », a perimetre
//     egal — N’EST PAS CONSTRUCTIBLE, et c’est le module qui l’ecrit lui-meme dans
//     _pilPhotosData : « le pourcentage fait n’a d’assiette que sur la periode
//     CONSULTEE — calcHeures() ne connait qu’elle ». L’etendre a l’exercice serait
//     un pourcentage sans denominateur. On trace donc les deux courbes
//     CONSTRUCTIBLES, et on NOMME les deux perimetres : le prevu ne chiffre que la
//     vigne, la depense porte tout le domaine. L’ecart n’est PAS un depassement, et
//     l’ecran l’ecrit sous le graphe — sans quoi c’est la faute de §33/§34.
//   · _mvGraphRepeindre() au depliage d’une carte : un graphe dessine dans un
//     .pil-tbody en display:none l’a ete a la largeur par defaut (clientWidth=0).
//   · Accompagnement dans le MEME lot : guide/11-pilotage.html, huit points de
//     MV_AIDE qui decrivaient l’ancien ecran, fiche MV_INFO `pil.an.budget`.
// v6.76 (15/08/2026) — CE QU’ON TRAVERSE AVANT LE PREMIER CHIFFRE.
//   MESURE AU NAVIGATEUR, sur le squelette reel monte en executant _pilSkeleton :
//   sur telephone, il fallait descendre de <b>728 px</b> avant d’atteindre une
//   donnee — pour un ecran de 844. Presque tout l’ecran en chrome. Cinq bandeaux
//   empiles : masthead 200, fil d’Ariane 68, onglets 59, photos 259, titre 52.
//   ★ LE BANDEAU DE TITRE DISPARAIT. `<h2 class="pil-h2">` repetait mot pour mot
//     l’onglet actif, en 26 px, sur une ligne a lui — deux sur telephone. La
//     barre d’onglets le dit deja, en surbrillance. Ce qu’il apportait en plus,
//     le sous-titre des libelles longs, descend en une ligne fine.
//     « Choisir les indicateurs » rejoint la meme ligne, en roue crantee.
//     ⚠️ `#pil-gear` garde son nom : _pilBind le retrouve, le panneau s’ouvre
//     au meme endroit. On deplace un bouton, on ne renomme rien.
//   ★ LES QUATRE PHOTOS PASSENT EN FRISE sous 700 px : une ligne qui defile, le
//     chiffre a cote de l’etiquette au lieu d’etre dessous. 259 -> 114 px.
//     ⚠️ Elles restent QUATRE et restent VISIBLES : on ne remplace pas quatre
//     chiffres par un bouton « voir les chiffres ». Seule la fleche « voir le
//     detail » disparait — la carte entiere etait deja cliquable.
//   ★ Le masthead se compacte (200 -> 124) et l’instruction « cliquez une
//     campagne pour zoomer » quitte la barre COLLANTE sur telephone : une ligne
//     qu’on apprend une fois n’a pas a occuper chaque ecran en permanence.
//     Sur grand ecran elle reste — la place ne manque pas.
//   · Resultat mesure : <b>728 -> 442 px</b> sur telephone (-39 %), et la hauteur
//     collante en permanence passe de 127 a 108 px.
//   ⚠️ UN DEFAUT VU A LA CAPTURE ET PAR RIEN D’AUTRE : en frise, la premiere
//     photo occupait presque toute la largeur — `.pil-photo` porte `width:100%`
//     dans sa regle de base, qu’il fallait neutraliser. Aucun controle ne lit
//     une mise en page.
// v6.75 (15/08/2026) — LES QUATRE DERNIERS ONGLETS, EN UN SEUL LOT.
//   Simuler, Conformite, Cave, La campagne. Le chantier de texte est termine :
//   les huit onglets du Pilotage suivent la meme regle.
//   ★★ « COMMENT LIRE » EST, PAR DEFINITION, CE QU’ON LIT UNE FOIS. Le
//     simulateur affichait SIX blocs de ce nom, de 130 a 730 caracteres, coinces
//     entre chaque titre d’etape et son graphe. Une fois qu’on sait lire une
//     frise, on ne relit pas la notice — on la traverse pour atteindre le dessin.
//     Ils passent derriere la pastille du titre d’etape, ou ils restent a un doigt.
//   ★ LA LEGENDE DES COULEURS, ELLE, RESTE. On ne la LIT pas, on la CONSULTE du
//     regard, chaque fois qu’on revient au graphe. Ce qui part, c’est ce que
//     chaque couleur veut dire en profondeur : la definition du « retard », la
//     majoration par semaine, les conges compris dans l’ecart.
//   ★ CONFORMITE — le fait qui PROTEGE reste affiche : « ne pas penetrer la
//     parcelle sans equipement avant l’heure indiquee ». C’est le derive des
//     phrases de risque CLP qui passe dans la fiche, pas la consigne.
//   ★ CAVE — _pcavCard prend une cle de fiche en 7e argument, comme _pilTile.
//     La pastille va dans l’EN-TETE, pas dans le pied : sous le graphe, elle
//     serait deja hors de vue.
//   · 14 fiches neuves. Le module en compte 34, pour 20 000 caracteres de
//     methode ranges — et plus une seule notice en travers d’un graphe.
// v6.74 (15/08/2026) — LE SOUS-TITRE D’UNE CARTE EST UNE LIGNE DE CADRE.
//   Dernier morceau d’Economie : les sept sous-titres qui restaient. Ils ne
//   disaient pas SUR QUOI porte le chiffre — ils expliquaient comment il est
//   fabrique, en 100 a 330 caracteres, relus a chaque ouverture de l’ecran.
//   Six fiches neuves : prix de revient, ou part l’argent, cout par travail,
//   tableau des parcelles, heures payees / au champ, les trois postes.
//   ★ LE HARNAIS A TROUVE CE QUE MA RELECTURE AVAIT MANQUE. Une assertion neuve
//     — « aucun sous-titre ne depasse 95 caracteres » — a designe DEUX cartes de
//     l’Exercice que je n’avais pas vues : « trois postes, et rien d’autre… »
//     (178 car.) et le graphe mois par mois (105). Une regle mecanique voit ce
//     qu’une relecture attentive laisse passer.
//   ⚠️ Et elle a rougi une fois A TORT : « hypothese de conversion » survit dans
//     le libelle du REGLAGE lui-meme (_PEC_HYPO), ou il est a sa place. Devant un
//     rouge, la premiere question reste : lequel des deux a tort ?
//   · Le module compte desormais 19 fiches « i ».
// v6.73 (15/08/2026) — LE VERDICT D’ECONOMIE.
//   C’est la premiere chose qu’on lit en ouvrant l’onglet, et la seule qui
//   reponde a « ou j’en suis ». Une seule branche s’affiche a la fois : ce
//   n’etait donc pas un mur. Le defaut etait ailleurs — CHAQUE branche melangeait
//   trois choses dans un paragraphe de 200 a 550 caracteres : le verdict, la mise
//   en garde de METHODE, et un chemin a retenir.
//   ⚠️⚠️ LA MISE EN GARDE ETAIT DITE DEUX FOIS. « La presence vient du planning,
//     elle contient aussi la cave et l’atelier » etait ecrite mot pour mot dans
//     le verdict ET dans la fiche `pil.cadence` depuis le 15/08. Deux copies qui
//     auraient vieilli separement. Il n’en reste qu’une, et le verdict pose la
//     pastille de cette fiche-la au lieu d’en ecrire une seconde.
//   ★ « Reglages › Taches » et « Postes & travaux » deviennent des boutons. Le
//     second passe par data-pec="sub", le commutateur de sous-vue qui existait
//     deja — on ne recree pas une navigation.
//   ★ Quand le chiffre vient de l’an dernier, sa provenance descend dans une
//     LIGNE DE CADRE, avec le meme filet dore que les cartes du module.
//   ⚠️⚠️ UN PIEGE DE MISE EN PAGE, TROUVE A LA CAPTURE ET PAR RIEN D’AUTRE :
//     dans un conteneur flex, CHAQUE element enfant devient un item a part. Le
//     <b> du nom de campagne formait sa propre colonne et la phrase se coupait en
//     trois morceaux. Le texte est enveloppe dans un <span>. Aucun controle
//     automatique ne lit une mise en page — seule une capture regardee le voit.
//     ★ Le meme piege est impossible sur les cartes : _pilTile ECHAPPE son
//       sous-titre, donc aucune balise n’y devient un item.
//   · Mesure sur les huit branches, executees : 318 -> 203 caracteres en moyenne
//     (-36 %), et -41 % sur la plus chargee. Rien n’est supprime.
// v6.72 (15/08/2026) — L’EXERCICE, ET UNE CARTE POUR DEUX ECRANS.
//   L’onglet Économie › Exercice empilait SEPT paves colores avant le premier
//   chiffre, tous au meme poids : « le planning n’est pas charge, les salaires
//   comptent pour zero » pesait autant que « l’ecart entre les deux, c’est
//   votre stock ». Meme mal que la Synthese, meme remede.
//   ★★ _pecFiabCard — UN SEUL RENDU POUR LES DEUX ECRANS. La carte ecrite hier
//     pour la Synthese repondait deja a la question de l’Exercice. La
//     re-implementer, c’etait garantir qu’elles divergeraient — la faute que ce
//     chantier passe son temps a corriger. Elle prend ses cles en argument, donc
//     chaque ecran garde SA fiche et SES remarques.
//   · _pexZeros / _pexRemarques : la liste de l’Exercice n’est pas celle de la
//     Synthese. Ici on chiffre un bilan entier — les achats d’intrants comptent,
//     et le planning doit avoir ete ouvert une fois pour que les heures existent.
//   ★ LE GARDE COMPTABLE RAMENE A SON CADRE. « Ce total n’est pas un compte de
//     resultat » change la lecture du chiffre : sans cette phrase on le compare
//     au bilan et on conclut de travers. Elle RESTE. L’inventaire de ce qui n’y
//     est pas — fermage, amortissements, assurances, cotisations d’exploitant,
//     embouteillage, frais generaux — se lit une fois : il passe dans la fiche.
//   · Mesure sur le meme etat (trois postes manquants) : en tete d’ecran,
//     1 828 -> 341 caracteres, soit 81 % de moins. Rien n’est supprime.
// v6.71 (15/08/2026) — LE MUR D’ALERTES D’ECONOMIE.
//   « Ce qu’il faut regarder » empilait jusqu’a DOUZE paves colores, de 100 a
//   350 caracteres chacun, tous au meme poids visuel. On ouvrait Economie et on
//   lisait un mur avant d’atteindre un chiffre. Le pire y cotoyait le detail :
//   « la main-d’oeuvre compte pour zero » avait la meme taille que « le chiffre
//   montera mecaniquement ».
//   ★ _pecZeros / _pecRemarques separent les deux natures. Ce qui met un poste
//     a ZERO devient une CARTE DE FIABILITE : le nombre de postes fausses en
//     gros, leurs noms, et UN BOUTON PAR POSTE qui ouvre l’ecran de saisie.
//     Le reste part derriere une puce « N remarques ».
//   ⚠️ RIEN N’EST SUPPRIME : les douze constats sont tous calcules et tous
//     lisibles. Ce qui change, c’est ce qu’on voit SANS RIEN OUVRIR.
//   ★ LES FICHES VIVANTES (_mvInfoSet, utils.js). Certaines explications citent
//     des chiffres du moment — « 2 parcelles depassent de 30 % » — donc elles ne
//     peuvent pas etre ecrites d’avance. Mais on n’ouvre pas une porte a du
//     contenu libre : la cle reste DECLAREE dans MV_INFO avec un repli honnete,
//     et _mvInfoSet refuse toute cle non declaree. Le controle statique tient.
//   ⚠️⚠️ DOUBLON CONNU, NON RESOLU. _pilDiag (le bouton « a completer ») porte
//     deja un constat « N fiches sans taux horaire » ; celui d’Economie teste
//     « AUCUN taux, nulle part ». Deux constats voisins sur la meme donnee, a
//     deux endroits de la meme page. C’est la faute de §34 en plus petit. La
//     fusion est un chantier de moteur, pas d’ergonomie : notee au backlog.
//   · La pastille de l’ecart de cadence retourne a cote du CHIFFRE (le KPI) :
//     elle vivait dans le pave d’alerte, et la refonte du mur l’emportait avec
//     lui — la fiche `pil.cadence` redevenait inatteignable. Trouve par le
//     harnais, qui exige que toute fiche ecrite soit posee quelque part.
// v6.70 (15/08/2026) — « L’EQUIPE & LE MATERIEL » PASSE A LA REGLE DES TROIS
//   FAMILLES. Six cartes reprises une par une : ce qui CADRE le chiffre devient
//   sa ligne de cadre, ce qui EXPLIQUE le calcul part dans MV_INFO, ce qui DIT
//   QUOI FAIRE devient un bouton. Six fiches neuves : equipe, presences,
//   tracteur, gnr, phyto, traitement.
//   ★ TROIS DOUBLONS TROUVES EN DEPLACANT, qu'aucun controle ne pouvait voir :
//     · Phyto refermait sa liste par « 18 interventions enregistrees » sous un
//       en-tete affichant deja « 18 interv. » — le meme nombre deux fois, plus
//       « Catalogue E-Phy a jour » qui n'est pas une donnee de cette carte.
//     · GNR affichait « 840 L » en gros dans le corps sous « 42 % » en gros dans
//       l'en-tete : une seule grandeur, deux echelles. L'en-tete porte desormais
//       les litres — c'est eux qu'on lit pour decider d'un plein.
//     · Equipe empilait dans son sous-titre trois choses de natures differentes :
//       la composition, « hors capacite vigne », et une action a executer de
//       memoire. Chacune part ou elle doit.
//   ★ Le parc tracteur remonte l'echeance de revision la plus proche dans sa
//     ligne de cadre : c'est la seule chose qu'on venait verifier, et il fallait
//     deplier pour la voir.
//   ★ PREMIERE CIBLE DE NAVIGATION HORS DES REGLAGES. « Cuve GNR a renseigner
//     (Tracteur › Entretien) » etait du texte mort : lire, retenir, sortir du
//     module, retrouver l'onglet. _PIL_DIAG_CIBLES accepte un 4e element qui
//     nomme le commutateur du module vise ; sans lui on garde switchReglTab, et
//     les sept cibles existantes ne changent pas d'un iota.
//   · PIL_TREAT_DAYS : l'horizon de prevision etait en dur dans un slice(0,5).
//     La ligne de cadre l'annonce, donc il se nomme.
// v6.69 (15/08/2026) — LA CARTE A TROIS ETAGES, ET UN DEFAUT QUI S’INVERSE.
//   Le Pilotage affichait ses dix-huit tuiles OUVERTES des l’arrivee. Or une
//   tuile ouverte prend toute la ligne : la grille etait reglee sur 2 a 4
//   colonnes et ne se remplissait JAMAIS. Sept indicateurs = sept pleines
//   largeurs empilees. Le systeme de mise en page etait desactive par son
//   propre reglage d’usine.
//   ★ _pilTile rend desormais TROIS ETAGES, tous dans .pil-th donc tous
//     visibles carte repliee : l’etiquette (+ pastille « i » + chevron), LE
//     CHIFFRE seul sur sa ligne, puis LA LIGNE DE CADRE — filet dore, date,
//     source, perimetre. Replier ne cache plus aucun nombre, seulement le detail.
//   ★ Une seule carte depliee a la fois : c’est ce qui rend ses colonnes a la
//     grille. Le meme chemin d’etat ferme les autres — rien n’est ferme a
//     l’ecran sans etre ecrit dans `collapsed`, sinon le rendu suivant rouvre.
//   ⚠️⚠️ _PIL_ST_V — LA MIGRATION QUI REND LE LOT VISIBLE. _pilSaveState grave
//     l’etat COMPLET des qu’on touche une tuile : les clients installes ont
//     depuis des mois un `collapsed` tout a zero, et au chargement le memorise
//     gagne sur le defaut. Changer le defaut sans marqueur ne leur aurait
//     STRICTEMENT RIEN fait. Meme piege que `avc_etp`/`an_frise`. Seule la
//     DISPOSITION repart du neuf : `show`, `pie`, `bar`, `sub` survivent.
//   · Les selecteurs ne bougent pas : .pil-tile, data-pid, .pil-th, .pil-th-t,
//     .pil-th-stat, .pil-tsub, .pil-tbody, #pil-body-<id>. La visite guidee vise
//     .pil-tile[data-pid="traitement"] et C22 le verifie.
//   · .pil-panels descend a minmax(250px) : une carte repliee n’a pas besoin
//     de 280 px.
// v6.68 (15/08/2026) — LA PASTILLE « i », ET DEUX CHOSES QUI REMONTENT D’UN CRAN.
//   Le Pilotage affichait ~25 000 caracteres de prose en permanence : 217 phrases,
//   neuf pages A4, et AUCUN moyen d’en replier une seule — pas un <details>, pas
//   une infobulle, rien, dans tout le projet. Le chiffre etait noye dans sa notice.
//   ★ MV_INFO + _mvInfoOpen (utils.js) + #ovInfo (index.html) : une primitive,
//     une feuille, un seul ecouteur delegue. Elle vit a cote de MV_AIDE pour que
//     la regle d’accompagnement la couvre — une fiche posee ailleurs vieillit.
//   ★ LA REGLE DES TROIS FAMILLES, ecrite dans utils.js : ce qui CADRE le chiffre
//     reste a l’ecran en une ligne · ce qui EXPLIQUE le calcul passe derriere le
//     « i » · ce qui DIT QUOI FAIRE devient un bouton. Ce n’est PAS « cacher le
//     texte » : la moitie de ces phrases est la seule trace ecrite d’une
//     convention du domaine, et un chiffre sans son cadre ment (§34, §41).
//   · Trois emplacements pilotes, texte reellement deplace : la capacite au pic
//     (les deux « c’est une autre date / une autre fenetre »), l’ecart de cadence
//     (le biais cave/atelier/bureau), les deux facons de compter l’annee.
//   · ⚠️ stopPropagation sur l’ecouteur : la pastille vit dans un en-tete de tuile
//     qui replie la tuile au clic. Sans lui, ouvrir la fiche fermait l’ecran.
//   · Deux dettes de §34i soldees, parce que ce lot bumpe : _PIL_SEM (la palette
//     semantique) et l’echelle de texte --pt-* remontent de pilotage.js vers
//     utils.js et styles.css. Une palette et une echelle ne sont pas la propriete
//     d’un module. ★ Les appels gardent leur repli — var(--pt-txt,12.5px) reste
//     juste si styles.css est en retard chez un client.
//   · pilotage.js n’avait AUCUN import : il lisait tout depuis window. _PIL_SEM
//     y arrive par un vrai import. Un appel qui marche par ordre de chargement
//     n’est pas un appel correct.
// v6.67 (14/08/2026) — L’ECART DE CADENCE AVAIT UNE SEULE SOURCE, OU AUCUNE.
//   Sous 40 % de bareme realise l’indicateur se taisait, y compris quand la MEME
//   periode de la campagne precedente etait archivee et parfaitement lisible. Un
//   escalier de sources est cable : periode en cours -> meme periode l’an dernier
//   -> rien. La marche 2 recalcule la presence sur PLANNING_ENTRIES (cle par annee,
//   jamais purge) et lit le bareme dans le snapshot (stats.hFaites) — TRAVAUX ayant
//   ete remis a zero a la cloture, c’est la seule grandeur non recalculable.
//   ★ QUATRE points d’affichage annoncent la source (verdict, note du graphe, KPI,
//     alerte) avec un ↩ et le nom de la campagne. Un chiffre d’histoire presente
//     comme une mesure du moment, c’est la faute de §34 — deux choses sous un mot.
//   ★ Le seuil ne s’applique PAS a la marche 2 : c’est la representativite qui le
//     justifiait, et une periode close est representative d’elle-meme.
//   · planning.js : les compteurs des 1607 h des contrats SOLDES dans l’annee civile
//     s’affichent enfin (backlog 0e). Un salarie reembauche en avait N, l’ecran n’en
//     montrait qu’un. Affichage seul — aucun calcul ne bouge.
//   · planning.js : openPlanCPSel fusionnee dans openPlanCP(fromSel) (backlog 3).
//   · pilotage.js : _ecoRate pondere par les heures annuelles du gabarit (backlog 9).
//     Un temps plein a 12 €/h pesait autant qu’un mi-temps a 14. Repli h=1 si le
//     planning n’est pas charge — resultat identique a l’ancien, zero regression.
//   BUMP : utils.js est modifie (MV_AIDE + APP_VERSION). APP 6.13 -> 6.14.
// v6.66 (14/08/2026) — UN COMPTE A REBOURS QUI NE DISAIT PAS CE QU'IL Y AVAIT APRES.
//   Le bandeau d'essai affichait « J-4 » et rien d'autre. Un decompte sans suite
//   annoncee se lit comme une menace de perte de donnees : c'est faux — a l'echeance
//   le domaine passe en LECTURE SEULE, tout reste consultable, seule la saisie
//   s'arrete. Le client l'ignorait, et devait deviner qu'il fallait relancer.
//   · Bandeau (app.js) : sous-ligne les 3 derniers jours — ce qui reste, et le fait
//     que Nicolas est prevenu tout seul. Le seuil 3 est le miroir de TRIAL_WARN_D
//     dans functions/claims.js : on ne promet l'alerte que les jours ou elle part.
//   · Ecran de fin (index.html) : dit la lecture seule, et que la reconduction de
//     quinze jours existe. Le titre ne dit plus « de 15 jours » — apres reconduction
//     l'essai en a dure trente.
//   BUMP : index.html est modifie. Regle du doute — le sauter figerait l'ancien
//   index.html dans le cache des clients installes, definitivement.
//   app.js + index.html -> APP_VERSION inchange (6.13) : rien ici ne merite une
//   entree « Nouveautes » chez les clients payants, qui ne voient jamais ce bandeau.
//
// v6.65 (14/08/2026) — LA VISITE S'ARRETAIT AU 18e MOMENT. TROIS DEFAUTS.
//   Symptomes rapportes : voile noir sans rien de surligne sur les moments 16
//   a 18, puis BLOCAGE au 18 — le bouton a toucher n'existait pas, et un moment
//   d'action n'offre pas de « Continuer ».
//   ★ 1. « #page-pilotage .content » N'EXISTE PAS. _pilSkeleton() emet
//     <div class="pil-content" id="pil-content"> : il n'y a aucun .content dans
//     cette page. Ce selecteur etait le REPLI FINAL des trois moments — quand le
//     premier echouait, il ne restait rien, _mvtEl passait a null et
//     _mvtReposition masquait l'ecran ENTIER. D'ou le voile noir.
//     ⚠️ Ce selecteur mort vient de la visite D'ORIGINE (moments 11-13) : il
//     n'avait jamais servi tant que le premier selecteur repondait. Remplace par
//     #pil-content, le seul ID que le squelette pose sans condition.
//   ★ 2. L'ONGLET DU PILOTAGE EST MEMORISE. renderPilotage() fait
//     _PIL_TAB=_pilLoadTab() a CHAQUE rendu, et tout clic d'onglet ecrit dans
//     localStorage. Le moment « Conformite » ajoute en 6.64 laissait donc 'cfm'
//     derriere lui, et le moment « decision du jour » rouvrait Pilotage sur
//     Conformite — ou ni .pil-dec ni .pil-cockpit-card n'existent. C'est le lot
//     precedent qui a arme le defaut 1.
//   ★ 3. UN MOMENT D'ACTION SANS CIBLE FIGEAIT LA VISITE. _mvtPlace affiche la
//     consigne A LA PLACE du bouton « Continuer » : si clickSel ne repond pas, il
//     ne reste que « Passer ». Or .rf-strat.best n'existe que si le simulateur
//     trouve un placement qui BOUCLE — n'en trouver aucun est un cas NORMAL.
//     La cible est desormais verifiee AVANT de choisir l'affichage, et _mvtQuery
//     replie en dernier recours sur .page.active : plus de blocage, plus d'ecran
//     noir muet, et une trace logError qui nomme le selecteur manquant.
//   pilotage.js : _pilSetTab(t,opts) devient LE seul chemin pour changer
//   d'onglet — le clic sur #pil-tabs le traverse aussi. Le module portait la
//   note « il n'existe PAS de _pilSetTab [...] plutot que d'inventer une seconde
//   facon de changer d'onglet » : on factorise celle qui existe au lieu de la
//   doubler, et la note est corrigee (un commentaire faux trompe le relecteur
//   suivant). La visite ne simule plus de clic : le garde-fou
//   « if(t===_PIL_TAB) return » et le scrollTo({behavior:'smooth'}) du handler
//   sont faits pour un doigt, pas pour un appelant qui veut poser un ecran.
//   ★ LA DEMO NE LAISSE PLUS RIEN DERRIERE ELLE : l'onglet du visiteur est
//   memorise au premier passage et lui est rendu a l'addition — et aussi quand
//   il passe la visite. Une demo qui laisse le Pilotage sur « Simuler un
//   renfort » a modifie les reglages de quelqu'un qui n'a rien demande.
//   app.js + pilotage.js -> APP_VERSION inchange (6.13), WHATS_NEW intact.
// v6.64 (14/08/2026) — LA VISITE GUIDEE RATTRAPE SIX MOIS D'APP.
//   La demo publique (?demo=visite) montrait 13 moments et 12 chapitres. Elle
//   ne connaissait AUCUN des lots d'aout : ni Le Millesime, ni la mise en
//   bouteille, ni le controle de maturite, ni le hub Documents, ni cinq des
//   dix onglets du Pilotage. Le Tracteur n'apparaissait dans aucun recit.
//   Parcours : 13 -> 19 moments (meteo par secteur, carte du domaine,
//   entretien & GNR, conformite cuivre/DRE, Le Millesime, les 22 documents).
//   Chapitres : 12 -> 26, ranges en 6 familles (vigne, cave, equipe, materiel,
//   piloter, papiers) — une liste a plat de 26 entrees ne se lit pas.
//   ★ TROIS ECRANS SE SERAIENT OUVERTS VIDES, sans une erreur :
//     · la synthese cuivre — _cuIsCu() exige type==='Cuivre' ET cuMetal>0, et
//       le seed posait le bon type sans jamais poser cuMetal ;
//     · le controle de maturite — CAVE_VENDANGE.analyses etait [] ;
//     · l'archive bouteilles — aucune cuvee en statut 'embouteille'.
//   Corriges en executant les VRAIES fonctions (_cuParcRollSum, _matSynth) sur
//   les donnees du seed, pas en relisant le code. Meme lecon que le Cuvier vide
//   de juillet et le simulateur vide d'aout.
//   ★ LE COMPTEUR N'EST PLUS ECRIT A LA MAIN. Chaque kick portait son propre
//   « n sur 13 » et les points de progression bouclaient sur i<14 : ajouter un
//   moment laissait la barre muette, et c'est ce codage en dur qui avait fait
//   ecrire « 15e moment » au backlog pour une visite qui en comptait 13. La
//   numerotation derive desormais de _mvtSteps.length.
//   ★ Le seed est derive de window.PARCELLES, jamais de noms ecrits en dur :
//   _matSynth croise sur le nom REEL de la parcelle, et des analyses orphelines
//   ne se seraient vues nulle part.
//   Le hub Documents est referme avant l'addition (sinon l'ecran de fin, celui
//   qui porte le bouton d'essai, se dessinait dessous).
//   app.js seul -> APP_VERSION inchange (6.13), WHATS_NEW intact : rien de tout
//   ceci n'est visible d'un client, c'est la demo des prospects.
// v6.63 (14/08/2026) — DEUX CHIFFRES QUI NE SUIVAIENT PLUS LEUR SOURCE.
//   1) LA COURBE D'EFFECTIF GELEE. Le memo _PIL_ANN (pilotage.js) etait cle
//   sur des LONGUEURS : MEMBRES.length, PARCELLES.length, TACHES.length. Or
//   aucune longueur ne bouge quand on saisit une date de contrat, qu'on coche
//   Bureau, qu'on change l'effectif d'une equipe collective ou une surface.
//   La frise reservait donc l'ancien calcul JUSQU'AU PROCHAIN F5, sans rien
//   signaler. Mesure : capture calibree au pixel = 3,005 constant sur 1 309
//   colonnes ; les memes fonctions rejouees sur les memes donnees rendent
//   4 → 3,857 → 3. Le calcul etait juste, l'affichage etait perime.
//   ★ UN CACHE DONT LA CLE NE DERIVE PAS DE SES ENTREES N'EST PAS UN CACHE,
//   C'EST UN GEL — et il ment sans erreur, sans trou, sans valeur aberrante.
//   La cle derive desormais de tout ce que lit _chargeSaisonData.
//   2) FICHE SANS DATES + INACTIF = SORTIE DE TOUTES LES PERIODES, PASSEES
//   COMPRISES. _mvEnContratSurPeriode faisait `return m.statut !== 'Inactif'`
//   quand la fiche ne portait aucune date. Une campagne ARCHIVEE se rejouait
//   donc avec un salarie de moins, des mois apres sa cloture. Or « Inactif »
//   est un confort de saisie, pas un fait d'historique. Convention du 09/07
//   retablie : sans date = CDI depuis toujours, present partout.
//   ⚠️ Corollaire : un compte de service sans dates compterait comme un CDI.
//   La reponse est le drapeau `bureau`, pas le statut.
// v6.62 (13/08/2026) — LES DOCUMENTS : QUATRE LOTS, ET UN ECRASEMENT REPARE.
//   ⚠️⚠️⚠️ D'ABORD L'INCIDENT, PARCE QU'IL EXPLIQUE CE NUMERO.
//   Ces quatre lots ont ete ecrits sur un clone du depot date de 07:33. Six
//   commits ont ete pousses entre-temps (le chantier CONTRATS, v6.58 a v6.61).
//   Livres en FICHIERS COMPLETS, ils ont ecrase ce chantier au commit
//   « mesure » : 331 lignes perdues dans reglages.js, 216 dans utils.js, 171
//   dans planning.js, 19 dans app.js — dont la correction de `pShowDone`.
//   ★ C'EST C23, ECRIT LE JOUR MEME, QUI A SONNE : le controle a retrouve
//   l'onclick que sa propre correction venait de retirer. La CI a echoue avant
//   le build. Sans lui, l'ecrasement partait en production.
//   Repare par `git revert` du commit fautif (etat restaure au caractere pres,
//   verifie par diff), puis les quatre lots REJOUES sur la base a jour : les
//   15 points d'ancrage ont ete retrouves, une seule fois chacun.
//   ⚠️ LES NUMEROS 6.58, 6.60 ET 6.61 ONT SERVI DEUX CONTENUS DIFFERENTS, et
//   les deux ont ete deployes. On repart a 6.62, jamais servi. Regle rappelee :
//   sauter un numero ne coute rien, en reutiliser un coute un client fige.
//   ★ LEÇON A GRAVER : un fichier COMPLET livre depuis une base vieille de
//   quelques heures est une bombe a retardement. La fraicheur se re-mesure
//   AVANT CHAQUE LIVRAISON, pas une fois par session.
//
//   ── CE QUE CONTIENT LE LOT ──────────────────────────────────────────────
//   1. LE CUVIER ETAIT MUET (acces). cave.js portait deja _matDoc et _cuvDoc
//      depuis la v6.58 — sans AUCUNE entree au hub. Deux documents en
//      production, atteignables par personne : C15 grandeur nature, cause par
//      une livraison en morceaux. Entrees ajoutees, plus les deux cas docsGo.
//   2. ETAT DU VIGNOBLE (reglages.js, paysage). Une ligne par parcelle :
//      commune, ha, cepages, avancement, taches hors sujet, dernier travail,
//      dernier rendement a l'hectare, puis repartition par cepage et arrachees.
//      ★ Sa derniere colonne dit CE QUI MANQUE : cepage absent, aucune
//      position, aucun contour. Feuille a cocher d'une installation.
//      Moteurs lus, jamais refaits : getPCls, getTachesSaison, _mvParcGeo,
//      _mvKmlCtrs, _dpRendHistRows (une ligne d'export dans app.js plutot
//      qu'une copie du calcul). AUCUNE HEURE : leur calcul vit dans openDP
//      avec les trous de plantation et les exclusions — le recopier en ferait
//      une seconde definition.
//      ⚠️ Le journal porte AUSSI les releves meteo : sans le filtre !j.meteo,
//      la « derniere intervention » aurait pu etre une note de pluie.
//   3. RELEVE INDIVIDUEL (planning.js). Le document existait ; il se cachait
//      dans la fiche du salarie. Entree au hub avec panneau (salarie + mois),
//      plus deux blocs neufs :
//      · LES CONTRATS, lus sur window._mvPeriodes (v6.59) — periodes NON
//        fusionnees, chacune avec SON type — et les COUPURES nommees en jours,
//        avec le meme vocabulaire que la frise de la fiche membre (v6.60).
//        _mvContrats fusionne les contigus : bon pour « etait-il la ? »,
//        faux pour lister des contrats.
//      · LES CONGES PAYES : solde initial, pris, reste, periode et mode de
//        decompte. Rien pour une equipe collective, qui n'a pas de compteur.
//      ⚠️ Le pied du bloc suit window._mvAnnualise (v6.61) : ecrire « plafond
//      proratise » sur le releve d'un TESA serait faux depuis ce lot-la.
//      ⚠️ planExportPDF lit la variable de module planMonth. Le point d'entree
//      la deplace puis LA REMET (finally) : editer un releve depuis les
//      Documents ne doit pas changer le mois affiche au Planning.
//      ⚠️ _planFmt formate des HEURES : _planFmt(12) rend « 12h ». Les conges
//      se comptent en JOURS — le harnais a trouve « 12h j » avant le papier.
//   4. CARNET D'ENTRETIEN A LA CHARTE (app.js). Il titrait « Ma Vigne —
//      Entretien tracteurs » et signait « © GUERETTECH » : le nom de
//      l'editeur sur le document du vigneron, ce que MV_DOC interdit noir sur
//      blanc. Marges deja 14mm 12mm : la largeur utile ne bouge pas.
//      ★ L'AUDIT DES CHARTES, mesure avant d'ecrire : il n'y a pas huit
//      documents en desordre, il y a DEUX chartes. MV_DOC (8 documents) et une
//      seconde, non ecrite mais coherente, sur trois documents RECENTS de la
//      Cave et de la Reserve (encre #14110D, filet #8A5A38->#C2871E->#3D6B27,
//      Cormorant) — plus riche que MV_DOC, ecrite apres elle. Les aplatir
//      ferait PERDRE. Question ouverte : remonter ce hero dans la charte ?
//      Restent 4 vrais retardataires (releve mensuel, registre phyto en 9mm,
//      rapport de saison en margin:0, releve individuel en 10mm) : leur
//      conversion CHANGE LA LARGEUR UTILE et demande un rendu, pas une
//      relecture de source.
//   ── LES FILETS AJOUTES ───────────────────────────────────────────────────
//   · scripts/mv-chartes-doc.mjs : recense les 15 generateurs, dit qui suit
//     quelle charte, ECHOUE si le nombre de documents hors MV_DOC augmente.
//     Sa propre contre-epreuve a trouve une faille dans le detecteur : il
//     comptait la MENTION de _mvDocOpen, or le garde `typeof window._mvDocOpen`
//     cite le nom sans appeler. Il cherche l'APPEL desormais.
//   · scripts/mv-whatsnew-check.mjs : execute le journal au lieu de le relire
//     (tete = APP_VERSION, ordre, doublons, backslash rendu, demi-surrogates
//     apparies, _whatsNewSince joue).
//   · 3 harnais neufs (vignoble, releve, entretien) sur le patron de cuvdoc :
//     module reel ou fonctions EXTRAITES du source, et contre-epreuves.
//   Fichiers : app.js, planning.js, reglages.js, utils.js, index.html, guide.
// v6.61 (13/08/2026) — C23 : CE QU'UN ATTRIBUT HTML NOMME DOIT VIVRE SUR window.
//   ★★★ CORRECTIF 6.60. Les neuf fonctions _emhX de la fiche membre etaient
//   exposees, l'ETAT ne l'etait pas : `var _EMH` est une variable de MODULE,
//   `oninput="_EMH.d=this.value"` s'evalue dans la portee GLOBALE. Au premier
//   caractere tape : « _EMH is not defined ». 27 references reecrites en
//   window._EMH. C'est C15 applique a une VARIABLE et non a une fonction.
//   ★★ NOUVEAU CONTROLE C23 (scripts/preflight.mjs), avec cliquet. C6 existait
//   deja mais ne lit que le PREMIER identifiant du gestionnaire, seulement s'il
//   est suivi d'une parenthese, et ecarte explicitement tout ce qui contient un
//   point — `_EMH.d=` cochait les trois cases. C23 lit le CORPS ENTIER :
//   appels, acces propriete, affectations. Exposition croisee entre fichiers
//   (un handler de reglages.js peut nommer une fonction d'app.js), variables
//   declarees dans le gestionnaire ignorees, mots-cles et globaux natifs exclus.
//   ★ TROUVE DES LE PREMIER PASSAGE, un defaut ancien et sans rapport :
//   `let pShowDone` (app.js) est enferme dans la fermeture de l'IIFE produite
//   par Rollup. La puce « A faire / Toutes » des parcelles, visible des qu'on
//   filtre par tache, levait une ReferenceError a CHAQUE clic — en silence.
//   Le bouton ne faisait rien depuis toujours. Corrige : window.pShowDone.
//   ⚠️ Un `let` de haut niveau n'est joignable ni via window, ni via la portee
//   globale : le bundle est une IIFE, il n'y a pas de portee globale a atteindre.
//
// v6.60 (13/08/2026) — LA FICHE MEMBRE REFONDUE (lot C2 — la saisie).
//   Sept champs disparates deviennent UN BANDEAU + UN HISTORIQUE : type, debut,
//   fin, liste des contrats precedents, renouvellement_date, renouvellement_fin,
//   taux + serie de taux. On lisait des cases, jamais une suite.
//   ★★★ LA COUPURE EST DESSINEE. Le rail de la frise est PLEIN pendant un
//   contrat et POINTILLE dans le vide ; le trou porte son propre encart hachure
//   (« coupure de 23 jours — le compteur du precedent est solde »). C'est ce
//   trou qui decide si le compteur repart de zero, et il n'etait affiche NULLE
//   PART : c'est la cause commune des defauts des lots A, B et C1.
//   ★★ CHAQUE GESTE ANNONCE SON EFFET AVANT VALIDATION, meme patron que
//   _planAbsEffet (motifs d'absence du Planning). L'encart est CALCULE en
//   simulant l'ajout sur _mvPeriodes, jamais ecrit en dur : un texte fige
//   finirait par mentir le jour ou la regle change.
//   ★ UN EVENEMENT S'ECRIT DES QU'IL EST VALIDE, pas a l'enregistrement de la
//   fiche : un fait se consigne quand on le consigne, et fermer la fiche ne
//   perd plus un contrat saisi. Le « × » de chaque ligne fait marche arriere.
//   ★ LE RAPPEL NE PEUT PLUS SE TAIRE. reglages.js:432 testait
//   `if(!m.renouvellement_date && fin...)` : remplir le champ FACULTATIF
//   « date de renouvellement » ETEIGNAIT l'alerte de fin de contrat — annoncer
//   un renouvellement pour janvier faisait taire l'application sur un CDD qui
//   se terminait en aout. Source unique desormais : la fin du contrat, toujours
//   renseignee sur un CDD. Deux boutons dessus (renouveler / acter l'arret).
//   renouvellement_date et renouvellement_fin sont SUPPRIMES du modele ; le
//   second n'etait lu nulle part depuis toujours.
//   ★ LA GRILLE HORAIRE EST PORTEE PAR LE CONTRAT, pas par un evenement a part.
//   Mesure : _planPlId est affecte HORS BOUCLE dans 26 fonctions, et les
//   modeles sont deja dates a l'ANNEE (PLANNING_TEMPLATES[annee]) — dater
//   l'affectation au JOUR aurait melange deux granularites sur le meme calcul.
//   m.planning_id devient un miroir de plus. Changer de grille = signer.
//   Supprimes : _emContratsHtml, _emPickType, _paieSerieHtml et le chemin
//   d'ecriture du contrat livre en 6.59 (le modele, lui, est inchange).
//
// v6.59 (13/08/2026) — LE JOURNAL DU SALARIE (lot C1 — modele seul, ecran inchange).
//   ★★★ QUATRE MEMOIRES PARALLELES. La vie contractuelle d'un salarie vivait a
//   quatre endroits qui ne se parlaient pas : le couple debut/fin (contrat en
//   cours), m.contrats[] (les precedents, invisibles des moteurs avant 6.58),
//   renouvellement_date/_fin (une alerte — et renouvellement_fin n'etait LU
//   NULLE PART, ecrit ligne 1789 et jamais relu), PAIE.taux_serie (le salaire).
//   Deux sur quatre etaient datees ET lues.
//   m.hist[] devient la SOURCE. Trois evenements, tous producteurs :
//     embauche {d,type,fin?} · renouvellement {d,fin} · fin {d}
//   ⚠️ LE MODELE RESTE EN DEUX MORCEAUX. `membres` est lisible par toute
//   l'equipe, `paie` est admin-only (firestore.rules:201-202) : les contrats
//   vont dans membres, les salaires restent dans paie, fusion A LA LECTURE.
//   ★ MIGRATION A ZERO ECRITURE. Journal absent -> derive a la lecture depuis
//   contrats[] + le couple. Rien n'est ecrit tant qu'une fiche n'est pas
//   enregistree. Un domaine qui n'ouvre aucune fiche calcule comme avant.
//   ★★ LES ANCIENS CHAMPS DEVIENNENT DES MIROIRS, reecrits par _mvHistMirror()
//   a l'enregistrement : les ~40 points de lecture (paie, 1607 h, conges, MSA,
//   Pilotage) n'ont pas bouge d'une ligne. Patron de taux[nom] retrograde en
//   miroir de taux_serie[nom] (§36).
//   ⚠️ PROPRIETE CENTRALE, verifiee sur 10 formes de fiche : DERIVER PUIS
//   REMIROITER EST L'IDENTITE. Sans elle, le premier enregistrement d'une fiche
//   reecrirait ses dates en silence. Le harnais l'a fait echouer deux fois :
//   (1) un contrat archive SANS type se voyait inventer un 'CDI' — un
//   saisonnier serait devenu permanent ; (2) meme chose sur le contrat en cours
//   d'une fiche ancienne. Un type inconnu reste desormais inconnu.
//   ★ PROLONGER UN CONTRAT LAISSE UNE TRACE. Repousser fin_contrat sur un
//   contrat ouvert ecrasait l'ancienne date sans un mot ; c'est maintenant un
//   evenement `renouvellement`, et le contrat reste UN SEUL contrat (un seul
//   compteur). Deux gestes distincts comme pour le salaire : prolonger ouvre
//   une ligne, corriger reecrit la ligne existante.
//   ★ GARDE ANTI-PERTE. `membres` est un TABLEAU : _mvDocSize renvoyait le
//   NOMBRE DE FICHES. Vider le journal des huit salaries d'un domaine passait
//   sans un bruit (8 -> 8) alors qu'il porte les dates qui pilotent la masse
//   salariale et le compteur des 1607 h. _mvMembresCount compte fiches ET
//   evenements. Une fiche non migree vaut 1, comme avant.
//   NON FAIT, VOLONTAIREMENT : la refonte de la SAISIE (liste chronologique +
//   bouton « + ») attend une maquette — lot C2. Ni renouvellement_fin ranime,
//   ni grille horaire datee (_planPlId a 48 points d'appel) : un evenement qui
//   ne pilote rien serait exactement le defaut qu'on vient de retirer.
//
// v6.58 (13/08/2026) — LE CONTRAT ARCHIVE NE PESAIT PLUS RIEN (lots A + B).
//   ★★★ LE TROU. §33 avait ajoute m.contrats[] pour ne plus perdre le passe
//   d'un salarie reembauche. La fiche le retrouvait, l'effectif le comptait —
//   mais le MOTEUR D'HEURES, lui, ne voyait toujours que le contrat en cours.
//   Mesure du 13/08 sur une fiche reelle (CDD 02/03->24/07 archive, nouveau
//   contrat au 17/08) : 0 h payee sur mars->juillet contre 735 h pour la meme
//   fiche non archivee. Meme homme, meme planning ; seule difference l'archivage.
//   Pire : _pexData fait `if(hp<=0 && hw<=0) return;` — la personne DISPARAIT
//   de la liste au lieu d'y figurer a zero. Le total etait donc sous-evalue
//   sans le moindre signal. Touchait la masse salariale de l'exercice, la
//   capacite ETP, la cadence d'equipe et la presence reelle.
//   ⚠️ LE CORRECTIF N'ELARGIT PAS _planInContract. Un contrat qui se termine
//   SOLDE son compteur (paye, donc a zero) ; le suivant repart de sa date de
//   debut, sans du ni indu. Ses ~31 appels — plafond 1607 h, conges, grille,
//   maxima hebdo — sont inchanges. On ajoute un SECOND portail,
//   _planJourCouvert, pose par _planWide() sur quatre entrees de mesure
//   seulement : _planRangeH, _planTeamCadence, capEquipe, capPresent.
//   Drapeau de contexte (meme patron que _planCtxYear) plutot qu'un parametre :
//   _planSummary appelle _planCalcMonth, _planRempH et _planAbsNeutH, qui
//   gataient toutes sur le contrat — threader `wide` = 7 signatures et un oubli
//   qui passe en silence. try/finally : une exception ne peut pas laisser le
//   drapeau pose.
//   ★★ ANNUALISATION PAR TYPE DE CONTRAT. type_contrat etait lu 8 fois dans
//   tout le code et AUCUNE n'etait un calcul : deux libelles, un repli de taux,
//   des alertes. _planAnnuPlafond proratisait donc 1607 h pour TOUT LE MONDE —
//   un vendangeur en TESA avait un compteur d'annualisation, de la modulation
//   et des heures sup. Ils sont payes A L'HEURE. window.MV_HORS_ANNU
//   (utils.js, definition unique) = TESA/Saisonnier/Extra. ⚠️ La liste enumere
//   ce qu'on RETIRE : une liste d'inclusion ferait disparaitre en silence le
//   compteur de tout type non nomme (libelle futur, import, faute de frappe).
//   Tout ce qui n'y figure pas reste annualise, donc aucun domaine existant ne
//   perd son compteur. ★ Ce qui remplace le compteur
//   compte autant que l'exemption : la carte devient un COMPTAGE (heures
//   faites, jours travailles) — une carte vide serait une regression deguisee.
//   ★ RELEVE PDF PAR CONTRAT. rowFor() gatait sur _planInContract : apres
//   archivage, le releve des mois du contrat archive sortait BLANC — pas une
//   erreur, une page sans lignes, introuvable pour la MSA. Troisieme contexte
//   _planCtrCtx (oppose au premier : borner a UN contrat au lieu de les voir
//   tous), pose par _planSurContrat(). planExportPDF se borne au contrat qui
//   couvre le mois affiche ; mois a cheval sur deux contrats ou fiche a contrat
//   unique -> comportement d'origine. Le releve n'est JAMAIS blanc.
//   ⚠️ _planInContractCtr : lecteur des fonctions qui suivent UN contrat mais
//   JAMAIS le mode large (_planAnnuPlafond, _planWorkMonth, _planDaysWorked).
//   NON TRAITE, a decider : heures sup, solde de depart et solde annuel restent
//   affiches pour les non-annualises (mecanisme hebdomadaire distinct).
//
// v6.57 (12/08/2026) — AUDIT DU PILOTAGE : CE QUE L'ECRAN PROMETTAIT SANS LE TENIR.
//   Onze defauts trouves en relisant le module apres la refonte du 12/08 (§34).
//   ★★★ TROIS ETAIENT DES PROMESSES NON TENUES PAR L'ECRAN LUI-MEME :
//   1. LA BARRE DE PORTEE DISPARAISSAIT AU SCROLL. .pil-portee (sticky top:0
//      z-index:34) et .pil-tabsbar (sticky top:0 z-index:60) etaient collees au
//      MEME point : les onglets recouvraient le fil d'Ariane des le premier
//      defilement. La piece maitresse de la refonte s'oubliait donc exactement
//      comme avant. La hauteur du fil est MESUREE (--pil-portee-h) et devient le
//      `top` des onglets. ⚠️ Deux barres collantes au meme top se recouvrent —
//      la seconde n'a pas d'erreur a signaler, elle passe simplement dessus.
//   2. « TOUT L'ECRAN SUIT » N'ETAIT VRAI QUE DE LA MOITIE DE L'ECRAN. Economie
//      cadre sur la periode CONSULTEE, la Cave sur le MILLESIME, la Conformite sur
//      SEPT ANS. Avec « Vendanges » epingle en haut, ces trois-la repondaient sur
//      une autre fenetre SANS LE DIRE. On ne leur ajoute pas un sixieme selecteur :
//      on NOMME leur cadre (_pilCadreAvert), comme le faisait deja le Parametrage.
//   3. LA BARRE ET LES TITRES DISAIENT DEUX MODULES. _PIL_TABS renomme, _PIL_LABELS
//      pas : « La campagne » titrait « Avancement », « Simuler » titrait « Decider »
//      — le libelle que le lot 5 declarait mort. Et `an` n'avait AUCUNE entree : le
//      titre du niveau ① sortait VIDE. ★ L'onglet ③ promettait « les taches » et
//      n'en montrait aucune (Personnel + Materiel) -> « L'equipe & le materiel ».
//      Les descendre ici les aurait DUPLIQUEES : elles vivent au niveau ②.
//   ★★ ET UN BUG DE MEMOIRE A EFFET RETARD : `an_cadres`/`an_frise` manquaient aux
//   defauts, donc _pilNormalize les PURGEAIT a chaque chargement, pendant que
//   `avc_etp` — reste des defauts alors que l'indicateur avait demenage —
//   ressuscitait a 1 et etait recopie par la migration. Une case decochee se
//   recochait toute seule. Correction en deux gestes : les cles ajoutees, et
//   L'ORDRE INVERSE — on MIGRE AVANT DE NORMALISER, sinon la normalisation jette
//   la valeur que la migration devait lire.
//   AUTRES : 7 impasses `pil-empty` branchees sur _pilGo (_pilEmptyGo) et le mot
//   « Saisons » — nom de code interne jamais affiche — remplace par « Campagne »,
//   son vrai titre a l'ecran · le bouton « Voir les deux cadres » ouvrait Reglages
//   (cible interne `an_cadres` + _pilFlash extrait) · photo Conformite : tiret au
//   lieu de « 0 kg Cu » quand _cfmCuivre echoue (source absente ⇒ tiret, jamais
//   zero) · clic sur une photo deja ouverte ne tombe plus dans le vide · onglet ③
//   tout decoche ne sort plus un ecran BLANC · branche morte `d.exm` retiree ·
//   registre unifie au VOUS (15 « tu/ton/tes » restants du module).
//   Preflight 0/0, ESLint 0/0, catch muets 16 -> 16 (deux introduits, refermes).
// v6.56 (12/08/2026) — LE SALAIRE EST UNE SERIE DATEE.
//   Le taux horaire d'un salarie etait UN SCALAIRE lu SANS DATE par les trois
//   calculs de cout : cout par parcelle (_ecoJhByParc), sessions tracteur
//   (_tauxCond) et exercice comptable (_pexData). Augmenter quelqu'un
//   revalorisait donc retroactivement TOUT l'historique, y compris un exercice
//   DEJA CLOS. `taux_hist` existait mais n'etait lu par AUCUN calcul — une
//   phrase sous le champ, rien de plus.
//   ★★★ UNE TRACE AFFICHEE N'EST PAS UNE TRACE LUE. Elle donnait l'illusion que
//   le probleme etait traite pendant que les totaux bougeaient en silence. Meme
//   famille que l'IDCC affiche mais non ecrit (§30i) et que les commentaires pris
//   pour des preuves (§34g).
//   MODELE : `paie.taux_serie[nom] = [{d,v}]` croissante = SOURCE DE VERITE ;
//   `taux[nom]` devient le MIROIR du taux en vigueur AUJOURD'HUI (relu par la
//   fiche, le compteur de la carte Economie et le garde anti-perte).
//   MIGRATION A ZERO ECRITURE : serie absente -> DERIVEE a la lecture depuis
//   `taux` + `taux_hist`, regle de Nico « les salaires indiques sont ok jusqu'a
//   leur date de modification inscrite » (de vaut JUSQU'A d, a vaut A PARTIR DE d).
//   Un domaine sans historique derive [{depuis toujours, taux courant}] : ancien
//   comportement a l'identique.
//   TROIS GESTES, UN SEUL FABRIQUE UNE PERIODE — champ de date PRE-REMPLI a
//   aujourd'hui (augmentation), date VIDEE (correction sur place, aucune periode
//   fabriquee), lignes retirees a l'ecran (relecture DOM, meme idiome que les
//   contrats precedents). ⚠️ LE CHAMP VIDE NE SUPPRIME PLUS RIEN : un champ de
//   saisie ne doit pas pouvoir detruire un historique (lecon §33 lot 2).
//   L'EXERCICE COUPE LE MOIS a la date exacte du changement (_pexSegsTaux) : une
//   augmentation au 15 mars ne revalorise pas les 15 premiers jours. La colonne
//   affiche « 12,10 puis 13,50 » plutot qu'une moyenne que personne n'a signee.
//   Les heures sans taux ne comptent plus l'exercice entier d'une personne mais
//   les seules heures reellement non valorisees.
//   `_mvPaieCount` compte desormais `taux_serie` : ce n'est plus un derive, c'est
//   la source de tout cout de main-d'oeuvre date.
//   Harnais mv-harnais-salaires.mjs : 51 assertions, contre-epreuve sur 4 defauts.
//
// v6.55 (12/08/2026) — Pilotage : COHERENCE. Huit lots, mesures sur le code.
//   ① TOUTES les dates du module reculaient d'un jour : epoque LOCALE relue
//     avec des accesseurs UTC. 1 avr -> 31 juil s'affichait 31 mars -> 30 juil.
//     Un inverse unique, _pilOrdD / _pilOrdIso, meme base que _ford.
//   ② LE PIC A 46,3. Fenetre de tache dont les dates ne rencontrent pas la
//     periode : rabotee sans test de recouvrement -> ws=we -> UN JOUR, toutes
//     les heures dessus. CONFIG.task_windows est un override GLOBAL a dates
//     ABSOLUES applique a CHAQUE periode. Repli sur la fenetre par defaut +
//     drapeau horsPeriode. Et le moignon de semaine de fin est fondu.
//   ③ CAPACITE VS CHARGE : PP.pic moins presentChamp (tetes d'AUJOURD'HUI).
//     Deux dates, deux unites. Le manque vient de PP.manque.
//   ④ GRAPHE RENFORT : Math.min(att,4) -> plateau a 6,0 absent des donnees.
//     Plafond retire, rouge empile au sommet reel, ligne en equivalents-personnes.
//   ⑤ STRATEGIES : une proposition ciblee plus chere que la solution globale
//     est retiree (« Accolage 26 pers. » a cote de « 7 sur toute la periode »).
//   ⑥ FIN INCLUSE + REGLE A. we = dernier jour + 1, affichage en we-1 : les
//     dates montrees ne bougent pas. capCum sort de _chargeSaisonData, le
//     simulateur le LIT : une seule regle d'etalement.
//   ⑦★★★ L'EFFECTIF SE LIT SUR LA FENETRE DU TRAVAIL, PAS SUR AUJOURD'HUI.
//     Le lot 6.54 ponderait les equipes collectives et ne changeait RIEN a
//     l'ecran : d.membres vient de _pilMembresActifs, qui filtre sur
//     _mvEnContratLe(m, AUJOURD'HUI). 40 vendangeurs sous CONTRAT DE GROUPE du
//     26 aout au 4 septembre n'existent pas le 12 aout — la fiche n'atteignait
//     meme pas la ponderation. « EFFECTIF 1 » sur un ordre de passage ENVOYE
//     aux ouvriers. _pilEffFenetre / _pilFenTaches / _pilEffTaches lisent la
//     fenetre des taches cochees. _pilEffSemaine supprimee (C15).
//   ⑧ headMax : head est LISSE sur la semaine — 40 vendangeurs demarrant un
//     mercredi y valent 28,6. Personne ne travaille a 28,6. _headDayMax donne
//     le nombre de corps au plus fort de la semaine ; head reste la courbe.
//   ➕ Zone partagee par deux periodes hachuree (trame opposee aux trous).
//     Guide 11-pilotage, MV_AIDE.pilotage et WHATS_NEW repris dans CE lot.
//   ⚠ Contre-epreuve : 40 defauts reinjectes un par un, 40 attrapes.
// v6.54 (12/08/2026) — Pilotage : LES CINQ RETOURS.
//   ① Le temps de l'equipe change de NIVEAU. Repartition, frise prevu/reel,
//     courbe par semaine et ecart parlent d'UNE campagne ; ils etaient dans
//     « L'annee » sous un bandeau qui s'en excusait. UN BANDEAU QUI EXPLIQUE
//     POURQUOI UN BLOC EST AU MAUVAIS ENDROIT NE LE DEPLACE PAS. Nouveau
//     _pilPanelTemps (cle avc_temps, tuile 'temps'), _pilPanelEtp reduit a la
//     frise annuelle + le pic. Chip « Annee » retiree : une case qui vide son
//     propre panneau n'est pas un reglage.
//   ② Le chevauchement de periodes n'est plus un defaut. Le constat disait
//     « les jours communs sont comptes deux fois » : FAUX. _chargeSaisonData
//     calcule la charge sur les TACHES de la periode (s.taches), jamais sur ses
//     jours. Constat retire de _pilDiag, banniere rouge remplacee par une note
//     grise. NE PAS LE REINTRODUIRE sans avoir mesure un double comptage reel.
//   ③ Le bareme se lit sur le BON CHAMP. Le constat « N taches sans bareme »
//     testait t.h_ha, un champ qui n'existe sur AUCUNE tache (h_ha ne vit que
//     sur TRAVAUX[] et sur les activites tracteur) : il se declenchait donc sur
//     100 % des taches de la periode consultee. Nouveau _pilTacheHha, qui lit
//     t.hha et comprend niveaux / passages / tariere. Meme famille que
//     CONFIG.ecartRang (§34d) : un champ suppose, jamais verifie.
//   ④ Le simulateur part des CONTRATS SIGNES. Le socle lisait toujours
//     headPerm (collectifs exclus) : 34 vendangeurs deja sous contrat etaient
//     invisibles et l'ecran reclamait 34 renforts pour une equipe embauchee,
//     pendant que la frise annuelle (head) montrait la vendange couverte.
//     Ce qui separe le socle du renfort n'est pas « permanent / saisonnier »
//     mais « DEJA ENGAGE / ENCORE A DECIDER ». _RF_SEL.base ('eng' par defaut,
//     'perm' au selecteur), head/capH/capPay au lieu des variantes *Perm.
//     ctx.baseLbl/baseCourt = SOURCE UNIQUE du mot, lue par les 4 ecrans.
//   ⑤ Plus deux fois le meme graphique. « deux graphes » se decidait sur
//     nSkip>0 : des que la campagne avait commence, l'ecran dessinait deux fois
//     le meme profil, seuls le voile gris et l'axe changeaient. Nouveau
//     _rfMemeImage (travail fait / semaines ecartees chargees / fenetres
//     deplacees), _rfPair rend deux fois le plan et pose `meme`.
//   Accompagnement du meme lot : MV_AIDE.pilotage (2 lignes neuves + Simuler
//   reecrit), guide/11-pilotage.html (3 blocs) + regeneration, 5 items
//   WHATS_NEW. Contre-epreuve : 63 assertions, 14 defauts rejoues, tous rouges.
// v6.53 (12/08/2026) — Pilotage : LE SIXIEME SELECTEUR, PURGE.
//   La v6.00 avait fondu cinq selecteurs dans _PIL_SCOPE. Il en restait un,
//   invisible parce qu'il ne ressemble pas a un selecteur : _pilSaison(), la
//   periode CONSULTEE. _pilCkEtp, _pilPanelEtp et _pilPanelCapacite la lisaient
//   pendant que photos et frise lisaient la portee -> le zoom ne les bougeait
//   pas, et sur l'annee la photo repondait pour l'ANNEE quand la tuile juste
//   dessous repondait pour UNE campagne. Deux nombres, un seul mot.
//   NOUVEAU, definitions uniques : _pilPeriodeVue (periode designee par la
//   portee, repli sur la consultee), _pilCdVue (+ memo par rendu, oubli aux
//   memes 3 points que _pilExoOublier), _pilVueEstConsultee, _pilPicPortee
//   (LE pic, lu par la photo, le KPI, la tuile ETP et Capacite vs charge),
//   _pilCadreLbl, _pilSemLabO. _pilPhotosData ne recalcule plus le pic.
//   Le cadre est ECRIT sous chaque chiffre (sur l'exercice / sur <campagne>).
//   _tractHoursSeason cale sur _pilPeriodeVue : les deux parts de la
//   repartition parlaient de deux fenetres differentes.
//   _pilTaskReal(cd,d,memeSaison) : sans le drapeau, l'avancement de la periode
//   consultee declarait 'termine'/'en cours' sur une AUTRE campagne. Repli sur
//   ce que le journal sait (campagne close = tache close). Appel a 2 arguments
//   strictement inchange.
//   PARAMETRAGE : il ECRIT (s.echeances de la periode consultee) -> il ne suit
//   PAS le zoom, et il l'ANNONCE quand la portee designe une autre campagne.
//   Une ecriture silencieuse au mauvais endroit ne se voit qu'a la campagne
//   suivante.
//   ⚠ Ce lot REMPLACE les fichiers du lot 6.02 / SW 6.52 livre le meme jour et
//   non deploye. Bump par regle du doute : 6.52 peut etre en ligne, et on ne
//   reutilise jamais un numero (sauter n'a aucune consequence, reutiliser fige
//   l'index.html des clients deja passes).
// v6.52 (12/08/2026) — Pilotage : SEPT DEFAUTS SIGNALES PAR NICO, MEME SEANCE.
//   1+2. Delegation de clic posee sur #pil-content alors que les 4 photos, le
//        fil d'Ariane et le bouton « a completer » sont ses FRERES depuis 6.50 :
//        data-pgo, .pil-flag, #pil-diagbtn, #pil-cr-root/x etaient morts, sans
//        erreur ni trace. Delegation deplacee sur #page-pilotage, une seule fois
//        (garde _pilDeleg : la page survit aux rendus, les ecouteurs s'empileraient).
//   3.   Photo Effectif : ann.weeks n'etait pas borne a [ann.s,ann.e] -> pic de
//        60,8 pris dans une campagne que l'ecran declare lui-meme hors exercice,
//        contre 36,6 au panneau Charge & ETP. Bornage + _dansEx sur le total.
//   4.   cd.totalTotal/totalReste N'EXISTENT PAS sur _chargeSaisonData (elles
//        viennent de calcHeures, app.js) -> Travaux et les 4 lignes de « Deux
//        facons de compter » sortaient a 0 h. Lecture de `charge`. Le pourcentage
//        fait ne s'affiche plus que sur la periode consultee (seule assiette).
//   4bis. La cellule « Exercice comptable » lisait _pecData (cadre CAMPAGNE) :
//        45 kEUR de vendange sous l'etiquette d'une annee. Passe a _pexData
//        (salaires charges + GNR + achats, fenetre de dates), memoise par rendu.
//   5.   MV_GRAPH_MAX=760 plafonnait TOUS les graphes : _mvGraphW(el,max) et
//        _mvGraphSuivre(sel,build,opts) en AJOUT PUR ; frise annuelle, frise
//        prevu/reel et courbe hebdo a 1800 ; hauteur suivant la largeur.
//   6.   _pilMargeCalc projetait charge/cadence des 4 dernieres semaines : 15 h/j
//        mesures en aout avec une personne, appliques jusqu'en janvier, en
//        ignorant 36 vendangeurs sous contrat. Nouveau _pilCapaProj : consomme la
//        charge sur weeks[].capH (capacite REELLEMENT planifiee, contrats et dates
//        de debut compris), facteur presence->bareme pris de l'ecart de cadence
//        deja mesure par _pecData, borne [0,5;3]. Repli ANNONCE sur la cadence.
//        _pilAnnuelData transporte capH, qu'elle jetait.
//   7.   _pilDemandSvg graduait de 1 en 1 : 38 etiquettes dans 238 px sur une
//        vendange a 36,6. Pas adaptatif, meme echelle que la frise annuelle.
//   BUMP APP 6.01 -> 6.02 : utils.js touche (_mvGraphW / _mvGraphSuivre).
// v6.51 (12/08/2026) — Pilotage / cadre annuel : CORRECTION DE FOND. L'ecran
//   declarait l'exercice « mal aligne » et poussait a le deplacer, jusqu'a
//   « aucune lecture annuelle n'est fiable ». Mauvais conseil : un exercice
//   comptable est une DONNEE (comptable, statut), pas un reglage d'affichage.
//   La panne reelle etait UN SEUL cadre pour DEUX questions. Nouveau panneau
//   _pilDeuxCadresHtml au niveau `an` : exercice comptable (cout, via _pecData,
//   non recalcule) vs annee vigne (heures de bareme), campagnes marquees « a
//   cheval » / « hors exercice », et l'explication de l'ecart.
//   Le constat de diagnostic passe de 'o' a 'b' et ne se declenche PLUS que sur
//   align.coupe (une vendange qui « ouvre » l'annee n'est pas un defaut).
//   _pilAnnSplitVend chiffre le partage en JOURS exacts, pas en euros prorates.
//   Fil d'Ariane et photo Budget nomment le cadre : « exercice comptable ».
//   BUMP par regle du doute : 6.50 peut etre deja en ligne, on ne reutilise pas.
// v6.50 (12/08/2026) — Pilotage : la barre d'onglets devient un AXE DE ZOOM
//   (Aujourd'hui · 1 L'annee · 2 La campagne · 3 L'equipe & les taches ·
//   4 Simuler | Cave · Economie · Conformite). Les CLES sont inchangees
//   (avc/equ/sim memorisees chez les clients, citees par app.js, verifiees
//   par C22) : seuls les libelles et l'ordre bougent. Nouvel onglet `an` ;
//   _pilPanelEtp y demenage depuis `avc` (un seul appel dans le fichier).
//   _PIL_SHOW_MIGR reporte avc_etp -> an_frise sur les deux sources d'etat.
//   PORTEE UNIQUE _PIL_SCOPE : _PIL_ETPSEL n'est plus qu'un alias en lecture
//   (Object.defineProperty). Fin des cinq selecteurs qui s'ignoraient.
//   Quatre photos (travaux/effectif/budget/conformite) en tete de tous les
//   onglets ; l'effectif lit le PIC, jamais la moyenne ; source absente = tiret.
//   MOTEUR DE DIAGNOSTIC _pilDiag() : 9 constats calcules, 3 gravites, et
//   _pilGo() qui ouvre la page + switchReglTab + scrollIntoView + clignotement
//   (7 ancres set-sec-* verifiees dans index.html). Les drapeaux des photos
//   tirent du MOTEUR, pas de tests ecrits sur place.
//   _pilPolyBreak : la ligne d'effectif se COUPE sur un trou au lieu de le
//   traverser en droite ligne (elle affirmait un effectif non mesure).
//   Palette semantique _PIL_SEM : col.alerte portait DEUX sens dans la meme
//   image (renfort a trouver + trait du jour) ; le trait du jour a son encre.
// v6.49 (12/08/2026) — Contrats : m.contrats[] garde les contrats PRECEDENTS d'une
//   fiche, archives automatiquement quand un nouveau debut est posterieur a la fin
//   du precedent. _mvContrats (utils.js) = definition unique, fusionne les contrats
//   CONTIGUS (fin+1j = debut) et separe ceux coupes par un jour. _mvEnContratLe,
//   _mvEnContratSurPeriode et _inContractDay voient tous les contrats ; _planInContract
//   NON (plafond 1607 h, conges, grille : un contrat = un compteur).
//   Pilotage : pic et effectif rebases sur la SEMAINE (le mois divisait 4 jours de
//   vendange par 22 jours de capacite), frise annuelle zoomable, detail mois retire,
//   equipe collective ponderee dans capEquipe/capPresent (barre a 392 % corrigee).
// v6.48 (11/08/2026) — Les comptes crees en lot arrivent avec les modules de leur
//                       role. Un ouvrier ne voit plus la Cave, la Reserve, le
//                       Tracteur ni le Phyto dans sa barre ; un tractoriste garde
//                       Tracteur et Phyto. Avant, les sept modules etaient la pour
//                       tout le monde et il fallait rouvrir chaque fiche pour les
//                       decocher. Sur un domaine de douze permanents, c'etait douze
//                       fiches — ou douze personnes qui decouvraient l'application
//                       avec quatre modules hors de leur travail.
//                       ⚠️ Le Planning reste visible pour TOUS : c'est la que chacun
//                       lit son mois, ses heures et ses conges.
//                       ⚠️ Cumul de roles : un module n'est masque que si TOUS les
//                       roles le masquent. Un ouvrier-tractoriste garde le Tracteur.
//                       L'apercu de creation dit maintenant ce qui sera masque, et
//                       la fiche membre gagne un bouton « Selon le role » qui pose
//                       la meme combinaison — meme table, un seul endroit.
// v6.47 (11/08/2026) — Lot d'hygiene, cinq points verifies un par un sur le code.
//                       ⚠️ DEFAUT REEL : la meteo enregistree au journal a la
//                       validation d'une tache remontait jusqu'a la PREMIERE ligne
//                       « En cours » du journal, sans aucune borne. Une tache restee
//                       ouverte d'une campagne a l'autre faisait moyenner quatorze
//                       mois de meteo, et le chiffre partait dans la tracabilite.
//                       Desormais borne a la periode de la validation, avec repli
//                       sur la campagne puis sur le jour meme.
//                       Entre 761 et 767 px de large, l'ecran d'accueil du Pilotage
//                       se rendait de travers : aucune des deux regles responsive ne
//                       s'appliquait. Sept pixels de trou, referme.
//                       Menage : le calcul du pic hebdomadaire du simulateur de
//                       renfort, calcule et jamais lu ; une regle CSS d'onglets de
//                       Cave devenue orpheline ; et 44 couleurs de repli a 3,66:1,
//                       sous le seuil AA — invisibles (la variable est toujours
//                       definie) mais fausses.
// v6.46 (11/08/2026) — Planning, lot 2 : trois onglets, un verbe chacun (mois /
//                       gens / cadre), table _PLAN_TAB_MIGR pour l'onglet memorise.
//                       L'ouvrier n'a plus d'onglets et tombe sur son mois. Fin du
//                       doublon grille+syntheses : les cartes, le recap annuel et les
//                       anciens salaries passent dans « Les gens ». Le menu « Outils »
//                       et la feuille « Anciens salaries » disparaissent (9 feuilles
//                       -> 5 depuis le debut de la serie). « Conges sur une periode »
//                       et « Chaleur sur une periode » deviennent deux boutons
//                       visibles au-dessus de la grille.
//                       ⚠️ DEFAUT REEL corrige : le mode de decompte des conges et la
//                       periode de reference — deux reglages DU DOMAINE — se reglaient
//                       depuis l'onglet Conges d'UN salarie. Deplaces dans « Le cadre ».
//                       ★ C15 les a attrapes orphelins entre les deux gestes : la
//                       preuve que sortir un bloc sans le reposer ne passe pas.
// v6.45 (11/08/2026) — Planning, lot 1 : la selection n'est plus un mode. Toucher
//                       une case la coche, toujours ; le bouton « Selection
//                       multiple » disparait. L'en-tete d'un jour coche la colonne,
//                       un nom coche la ligne, le coin coche la vue. La barre du bas
//                       annonce QUI et QUAND, et ne montre que les actions qui
//                       s'appliquent (« Effectif » n'apparait que s'il y a une equipe
//                       collective cochee ; « Effacer » que s'il y a une saisie).
//                       Trois feuilles deviennent une : l'editeur du jour absorbe
//                       « Heures » et « Absence » en selection — ids pmh-/pma-
//                       supprimes, namespaces devenus inutiles. Une seule regle
//                       metier dessous : _planApplyHeures / _planApplyAbs /
//                       _planApplySimple, sans lecture du DOM, donc testables.
//                       ⚠️ BUG REEL corrige : « Recup » et « Chaleur » en lot
//                       ECRASAIENT les conges deja poses, sans un mot. Preserves
//                       desormais, et comptes dans le toast ; le geste sur une case
//                       unique, lui, ecrase toujours (force).
// v6.44 (11/08/2026) — L'accompagnement rattrape les deux lots du jour. La fiche
//                       d'aide du Tracteur ne parlait NI du chrono inversé (v5.92)
//                       NI du mode du jour (v5.93) : douze points au lieu de six,
//                       dont les trois compteurs, le cadrage « ce n'est pas la
//                       journée de travail », la mesure écartée et le chemin
//                       d'activation (Réglages › Tracteur). La fiche Accueil gagne
//                       la question du matin et le widget Mise en route. Trois
//                       chemins de réglage qui manquaient : coupure (Planning ›
//                       Outils), barème régional, rendement au pressoir.
//                       ⚠️ BUG RÉEL trouvé en auditant : la visite guidée publique
//                       annonçait « sur 14 » dans ses 13 étapes — un prospect la
//                       terminait à « 13 sur 14 ». C22 ne lit pas le texte, il ne
//                       pouvait pas le voir. Guide : 06-tracteur et 12-reglages.
// v6.43 (11/08/2026) — Mode du jour. Le tracteur se prend pour la journee entiere,
//                       mais le lendemain la meme personne repart au terrain : a la
//                       1re ouverture du jour, si la personne cumule ouvrier ET
//                       tractoriste (hors admin) ET qu'une session tracteur est
//                       ouverte, l'app demande « Tu prends le tracteur aujourd'hui ? ».
//                       La question porte sur le FAIT, pas sur l'identite. Reponse
//                       memorisee pour la journee (date dans la valeur : expire seule
//                       a minuit). Sans session ouverte, rien ne change. Le mode RANGE
//                       le dock et choisit l'atterrissage — il ne touche AUCUN droit,
//                       et rien ne disparait : ce qui sort des 4 cases passe sous
//                       « Plus », qui porte aussi la sortie du mode.
// v6.42 (11/08/2026) — Chrono tracteur inversé : la coche EST le chrono. Toucher
//                       une parcelle démarre la mesure, « J'ai fini » la ferme,
//                       toucher la suivante enchaîne sans compter de déplacement,
//                       appui long = bloc partagé à la surface. Trois compteurs
//                       séparés (dans les parcelles / hors parcelle / pause
//                       déjeuner) et un cadrage explicite : ce chrono BUDGÈTE les
//                       travaux, il ne fait pas la journée de travail (lavage,
//                       niveaux, plein n'y sont pas). État persisté avec t0 ABSOLU
//                       — un téléphone verrouillé ne perd plus la mesure, c'était
//                       le vrai défaut. Mesure hors seuils barème (3× / 40 % / 12 h)
//                       écartée : pas de dmin écrit, la parcelle retombe au barème
//                       par le chemin déjà existant, et l'écart est DIT. Liste des
//                       parcelles rangée par distance au point courant (centroïdes
//                       KML, aucune géolocalisation du tractoriste) ; une tournée
//                       rangée par le chef reste prioritaire.
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
const CACHE_NAME   = 'mavigne-v6.95';
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
  if(DEBUG) console.log('[SW] Ma Vigne v6.95 installé');
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
  if(DEBUG) console.log('[SW] Ma Vigne v6.95 activé');
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
