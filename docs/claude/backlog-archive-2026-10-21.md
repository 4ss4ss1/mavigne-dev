# Backlog d’avant l’audit du 21/10/2026 — archive

> Le chapitre 28 de `CLAUDE.md` tel qu’il était avant l’audit BACKLOG-1 (§411) : 75 rubriques, 236 points, posés du 11/08 au 21/10. Conservé **mot pour mot** : c’est ici qu’on lit le détail d’un point avant de le reprendre. La liste à jour est dans `CLAUDE.md` §28.

### ⚠️ SÉRIE CHARTE (CHARTE-1 à CHARTE-5c) — CE QUI RESTE OUVERT (§367 à §381, posé le 19/10) : **à regarder chez Nico**, PC et iPhone, clair et sombre : les flèches, coches et étoiles (→ ✓ ★), la seule forme qui a pu bouger (CHARTE-1) ; CHARTE-2 ne change rien à l’écran (prouvé au navigateur). **Le look se change dans `src/charte.css`** — couleurs, polices, tailles, espacements, arrondis, ombres, mouvement ; le sombre en DEUX blocs à l’identique (`mv-harnais-charte` D) ; une police neuve demande ses fichiers dans `public/fonts/` (`mv-harnais-police` E). **Fait (CHARTE-2B, §369)** : le mode plein soleil a rejoint la charte — plus aucun réglage hors d’elle, sauf les documents imprimés ; et les fenêtres le prennent aussi (défaut d’avant, corrigé : **à regarder chez Nico**, plein soleil allumé, une fenêtre de saisie en clair et en sombre). **Trouvé, à ranger** : ~120 lignes de règles d’écran dans le `<style>` du `<body>` d’index.html (campagne, archives, périodes, choix des tâches, carte vivante du hub), lues APRÈS la feuille — les ramener dans styles.css en gardant leur rang (TETE-2 doit rester le dernier bloc, `mv-harnais-tete2`), avec preuve au navigateur ; le CSS du splash, lui, reste en ligne (§4). **CHARTE-3a fait (§370)** : les pièces `.mvbtn` et neuf anciennes classes ; **vus dans leurs écrans (CAPTURES-1, §371)** : les options (transmission, opération de cave, raison du retrait d’un fût) et « Enregistrer » d’une session, justes en clair et en sombre ; **à regarder chez Nico** : Planning › modèles, que l’outil n’ouvre pas encore. **CHARTE-3b fait (§372)** : le bouton des fenêtres (`.mbtn`, 101 emplois) au jeu, vu dans ses écrans. **e2e-local et mv-tour** butent sur les mêmes causes (§371b) : leur connexion est à reprendre. **CHARTE-3c fait (§373)** : les « − / + » au jeu ; « Valider » et « Début » des cartes l’étaient déjà (PARC-1/2). **CHARTE-4a fait (§374)** : le jeu de pastilles (maquette validée, « étiquettes neutres ») et sept familles d’avant au jeu — vues en vrai pour la Cave (« FML ✓ », §375) ; les autres attendent une démo qui porte leurs états (heures sup, tâche à répartir, session chronométrée). **CHARTE-4b fait (§377)** : les filtres du Chai, de l’opération de cave et d’une session. **CHARTE-4c fait (§378)** : 34 pastilles faites à la main au jeu, cliquet sur les 56 restantes ; les filtres du Tracteur restent un contrôle segmenté (TRAC-2) — une pièce « contrôle segmenté » commune serait un lot à part. **CHARTE-5a fait (§379)** : le jeu de cartes et trois cartes d’avant ; les pièces de l’encadré et du bloc de chiffres sont posées mais pas encore employées. **CHARTE-5b fait (§380)** : 21 encadrés du Phyto et des Réglages. **La console GUERETTECH est hors charte** (décision de Nico, §398) : ne pas la proposer. **CHARTE-5c fait (§381)** : 43 encadrés de plus et `.cmp-alert`. **REVUE-1 (§389)** : vus en vrai — « Ma trace » de l’ouvrier, la fiche d’une cuvée, les documents, le mot de passe en erreur ; **pas encore vus** — la saisie d’un traitement (le registre ne l’ouvre pas au toucher), la fiche d’un produit, le mur, les demandes du Planning, Décider avec des tâches, une session chronométrée ; tranchés et corrigés en REVUE-2 (§390) : l’encadré « Obligatoire » en ambre, les cartes du mur et de « Ma trace » avec une marge de côté, le bouton et le choix du mur au jeu ; **toujours pas vus** — Pilotage › Décider avec des tâches, une session chronométrée, la Discussion avec un message non lu, les demandes d’un salarié, la fiche d’un produit phyto, l’encadré « conforme / dépassement » d’une saisie (il faut lui donner une dose). **Si le preflight rougit dans la chaîne en parallèle et passe seul** : un incident de charge (vu une fois, §390) — s’il revient, le jouer seul (`SEULS`) ou lui faire retenter une vérification qui n’a pas pu se lancer. **La suite, série CHARTE** : les 168 encadrés faits à la main restants ne sont plus des « colorés » — des blocs neutres (notes, tuiles, lignes), des couleurs calculées par le code, la console GT (50) : à trancher un par un, pas à la machine ; puis les cartes d’avant restantes (le cockpit `.ck-panneau` et `.pil-cockpit-card`, à trancher : un dessin écran par écran) ; puis le reste des boutons — les classes de la refonte déjà proches (`.mvr-btn*`, `.mat-btn`, `.pl2-*`, `.mod-home-btn`), `.plan-cont-btn` (une carte d’option), les boutons encore stylés sur place et ceux sans classe —, puis cartes, pastilles, champs, listes, chacune avec son cliquet ; les couleurs écrites à la main (~4 400 dans les modules, n°29) ; les impressions qui lisent la charte. **Restes** : trois polices de code hors réglage ; deux contre-épreuves hors chaîne déjà rouges sur `d741866` (`mv-harnais-jetons --contre` : « on retire --r-md » et « un cercle converti » — plancher des cercles à 80 pour 107 ; `mv-harnais-cuvdoc --contre`) ; trois cliquets en baisse à regraver (C24b, icônes, contraste sombre).
### ⚠️ LE RANGEMENT DU CUVIER (MATU-1, REC-1, CUVES-1, TOURCUV-1) — CE QUI RESTE OUVERT (§366, posé le 19/10 ; §382 à §384, le 20/10) : **Tournée (TOURCUV-1)** — à regarder chez Nico : la carte de progression collée en haut quand la liste défile, et la barre du bas (« Terminer » et « Intervention groupée » côte à côte sur 390 px). **Tutos (TUTO-8, §388)** — le tuto des maturités fait ; le compte redescend à 820 ; les prochains qui le feront baisser le plus : peser une récolte (`openOvVendRec` et sa fenêtre), ouvrir une cuve en fiche (`_vendBascOuv`), la tournée du Cuvier. **Roue crantée (CAVEREG-1 et 2, §386-387)** — faite : quatre sections, une ligne par réglage, chacun sa fenêtre. À regarder chez Nico : la fenêtre de la fourchette en degré, celle de l’ouillage. ⚠️ L’inventaire des tutos ne voit pas les gestes passés par une variable (`onclick="'+geste+'"`) : les fenêtres des réglages n’y comptent pas. **Cuves (CUVES-1)** — à regarder chez Nico : la fiche en fenêtre au téléphone (le détail d’avant y est long : la fenêtre défile) et à droite sur PC ; la fiche reprend le détail dans SON ordre (frise, courbe, labo, puis les chiffres), pas dans celui de la maquette — le réordonner toucherait le code que lisent GF, CUV-13 et fusion ; au téléphone la ligne reste marquée « ouverte » après la fermeture de la fenêtre par le voile. **Récoltes (REC-1)** — **à regarder chez Nico**, téléphone et PC, clair et sombre — vu au code et au harnais seulement : la ligne d’une parcelle sur 390 px (le nom, la barre, la valeur), la fiche en fenêtre, le journal. **Choix faits sans maquette, à valider** : « Encore sur pied » reste la carte d’avant, sous le rendement (la maquette mêlait les deux dans la même liste) — garder la carte gardait SANSREC-1 et ses deux harnais ; l’encadré des ventes en raisin (« Voir les ventes », retours attendus) remplace le bandeau d’avant ; l’historique de la fiche montre les cinq dernières vendanges, celles du fichier des parcelles en barres pâles, estimées d’après leurs kilos. **Le plafond des gestes sans tuto relevé une deuxième fois** (813 → 820 → 823) : le tuto « Noter des mesures, peser une récolte » devient le prochain à écrire.  **Maturités (MATU-1)** — **à regarder chez Nico sur un vrai téléphone** : la fiche d’une parcelle en fenêtre, la saisie en série au clavier (le pavé décimal, la virgule), la bande verte en thème sombre, le choix de la vendange (liste native) — vus au code et au harnais seulement, pas au navigateur. **Pas fait, prévu** : le minimum de l’appellation (le trait rouge de la maquette) arrive avec le lot de la roue crantée, où il se règle à côté du rendement maximum ; — les Récoltes, les Cuves et la Tournée sont faites (REC-1 à TOURCUV-1, §382 à §384). **Deux décisions à revoir** : `typo-baseline.json` regravé pour cuvier.js (531 → 568 ko) et styles.css (747 → 787 ko) — les trois onglets suivants du Cuvier feront encore grossir cuvier.js : poser la question d’un module à part AVANT le lot Récoltes ; le plafond de `tutos-couverture.json` relevé de 813 à 820 pour les sept gestes neufs des Maturités — un tuto « Noter des mesures » les couvrirait. **Restes** : le style `.mvsy-` / `.mvcl-` / `.mva-` de `_caveV2InjectCss` (cave.js) n’a plus d’usage côté Maturités, à retirer après un grep ; `config.mat_objectif` n’est plus lu nulle part (donnée morte si un domaine l’avait posée).

### ⚠️ AIDE-1 — CE QUI RESTE OUVERT (§365, posé le 19/10) : **à regarder chez Nico** sur un vrai téléphone : l’aide de deux ou trois modules (l’icône dans sa tuile, le gras) — vue au Chromium du bac à sable seulement, clair et sombre. **Pas fait, à trancher** : la fiche du Pilotage (48 points, le premier de ~2 000 caractères) se lit encore par endroits comme un journal des changements (« n’est plus un onglet », « désormais », « était rangé ») ; seules ses deux phrases fausses ont été réécrites, et les dix fiches n’ont pas été relues phrase à phrase contre leurs écrans (§365g). Vu en passant, hors lot : le chevron de « Tous les tutos » pointe vers le bas alors qu’il ouvre un autre écran ; une espace simple avant « ; » laisse le point-virgule commencer une ligne.
### ⚠️ TUTO-1 à TUTO-7 — CE QUI RESTE OUVERT (§358 à §364, posé le 18/10) : **à regarder chez Nico** : sur ordinateur, ouvrir un tuto depuis un écran où l’on est déjà (le panneau doit commencer à la bonne étape), faire le geste chez lui et voir le panneau suivre ; si le panneau dit « Mise à jour à finir » : fermer tous les onglets Ma Vigne et rouvrir. **Leçon (§361)** : un fichier du démarrage sans numéro dans son nom ne doit jamais être servi depuis un cache — adresse versionnée, `no-cache`, réseau d’abord. **La suite** : l’inventaire (`node scripts/mv-tutos-inventaire.mjs`) se trie module par module en écrivant les tutos — d’abord la Vigne —, chaque étape à valeurs fictives avec son `reel` — jamais la même vérification pour deux étapes (§364), chaque étape de chemin marquée `chemin` ; tutos de l’ouvrier et du tractoriste ; données fictives élargies ; gestes serveur à trancher.
### ⚠️ MANQUE-1 — CE QUI RESTE OUVERT (§357, posé le 18/10) : **à regarder chez Nico** sur un vrai téléphone (clair et sombre) : le panneau « Ce qu’il manque » jusqu’au dernier bouton (trait d’accueil d’un iPhone compris), « Saisir les comptes » → feuille → compteur qui baisse — vu au navigateur du bac à sable seulement. Le fondu sans `forwards` vaut pour TOUTES les pages : ce qu’une page range en `position:fixed` reprend son z-index au-dessus de la barre du bas, comme en animations réduites (inventaire au §357d : rien d’autre ne chevauche la barre) — à confirmer à l’usage. Inchangé : un traitement sans dose au milieu de traitements dosés compte pour zéro sans constat. `src/utils.js` regravé à la main dans `typo-baseline.json` (902 → 948 ko) : sortir `WHATS_NEW` dans un module à lui, à trancher (§357f). Vu en passant, hors lot : le « + » de la feuille des comptes dessine les trois points du menu « Plus » (`ic-plus`) — §357g.
### ⚠️ FML-1 — CE QUI RESTE OUVERT (§356, posé le 17/10)
1. **À regarder chez Nico** (téléphone et ordinateur, clair et sombre) : une cuve décuvée (frise sur FML, phrase dessous), la fiche cuvée à trois boutons, « Et la malo ? » au décuvage, la légende de la courbe au premier passage par le Cuvier — aucun navigateur ici. Une malo finie mais jamais déclarée au Chai reste « pas encore déclarée » jusqu’à sa déclaration ; le parcours du Cuvier reste celui du rouge (pas de parcours propre au blanc).

### ⚠️ COMPTE-1 et TACHEPER-1 — CE QUI RESTE OUVERT (§352, §353, posé le 17/10)
1. **À regarder chez Nico** (téléphone et ordinateur) : le pavé, la feuille des comptes, la fiche (marqués · percés · plantés, « Corriger le compte »), la tarière préremplie — aucun harnais ne lit une mise en page. **Le domaine du signalement** n’aura la réparation qu’au déploiement général (contournement « + Nouvelle tâche » fait le 16/10).
2. **Pas de tâche « Repérage » dans la convention** (elle exigerait sa fiche POURQUOI-1) : chaque domaine crée la sienne et coche le réglage au crayon. L’entrée de journal à la main ne demande pas le compte (feuille des comptes) mais écrit les pieds de l’entreplantation (COMPTE-2, §354) ; il n’existe pas de validation en lot dans la Vigne (vérifié le 17/10). Idée non demandée : le total par cépage pour commander les plants.

### ⚠️ JALONS-1, JALONS-2 et JALONS-2B — CE QUI RESTE OUVERT (§340 à §342, posé le 15/10)
0. **Le canal « refonte » partage la base et les règles de la production** (Nico, 16/10 : tout passe par `hosting:channel:deploy
   refonte` jusqu’au déploiement général). Sans les lignes `jalons_` en production, la lecture des jalons est refusée : depuis
   JALONS-2B, rien ne s’affiche ni ne s’écrit. Les règles partent au déploiement général — ou avant, après comparaison des règles en
   ligne avec celles du dépôt (`firebase deploy --only firestore:rules` publie le fichier ENTIER, pas seulement les jalons).
1. **Les règles n’ont pas tourné sur le moteur ici** (l’émulateur ne se télécharge pas depuis ce bac à sable) : les cas B18 à B25
   de `mv-harnais-rules` les jouent dans la CI (job `rules`) ou chez Nico (`npm run test:rules`, Java présent). À lire au push.
2. **L’annonce ne suit que la feuille de validation** (`confirmValidation`) : une validation en lot ou une entrée de journal
   gagne son jalon en silence, et il apparaît dans « Mes jalons » à la connexion suivante.
3. **Le plan GRATIF est au bout** (16/10) : la saison en images (SAISONIMG-1, §351), la carte du
   domaine (CARTEDOM-1, §350) ; faits aussi : du rang à la bouteille (RANGBOUT-1, §349), le coéquipier (COEQ-1, §343), la présence notée au Chai (PRESENCE-1, §344) et au Cuvier (PRESENCE-2, §346), les premières fois (PREMIERES-1, §345), l’annonce qui se coupe (FETES-1, §347).
4. **Plus tard (décision de Nico, 15/10)** : la page de confidentialité (`public/confidentialite.html`) devra parler des jalons et
   du compteur d’ouvertures (donnée nouvelle, propre à la personne). Pas dans ce lot : « on fera la mise à jour à un autre moment ».

### ⚠️ ARRIVEE-1 à ARRIVEE-3 — CE QUI RESTE OUVERT (§337 à §339, posé le 15/10)
1. **Mesuré à 375 × 667, sans tournée** : premier « Valider » de 800 à 530 px, au-dessus du dock. **Pas mesuré avec une tournée
   active** : chez l’ouvrier, la barre de la tournée remplace alors « Trier par proximité » (TRN-2) — à regarder au domaine.
2. **À regarder chez Nico** : un vrai compte ouvrier au téléphone — deux onglets, « Ma trace », « Prochaine », niveau et équipe.

### ⚠️ POURQUOI-1 — CE QUI RESTE OUVERT (§336, posé le 15/10)
1. **À regarder chez Nico, au téléphone puis sur PC, en clair et en sombre** : la pastille « Pourquoi ? » à côté de la tâche choisie ou de la priorité
   du moment (Parcelles), dans la feuille de validation, dans la fiche d’une session tracteur, sous les types de « Nouvelle opération », et la
   bulle qui s’ouvre. Aucun navigateur ici n’a rendu ces écrans avec les données d’un vrai domaine.
2. **POURQUOI-2 — l’admin réécrit les fiches** : rien n’est saisissable aujourd’hui, les textes sont du code (C19). La saisie devra
   être échappée avant d’entrer dans la bulle.
3. **Pas encore posées** : le Cuvier (remontage, pigeage, délestage, saignée, chaptalisation ont leur fiche, sans pastille), la mise en
   bouteille, et les activités du tracteur sans fiche (broyage…), qui n’affichent rien — c’est voulu.

### ⚠️ GRATIF-0 et ERGO-0 — MAQUETTES DE L’OUVRIER ET DÉCISIONS DE NICO (posé le 15/10 ; intégrés : POURQUOI-1 §336, ARRIVEE-1 §337, ARRIVEE-2 §338, ARRIVEE-3 §339, JALONS-1 §340, JALONS-2 §341, JALONS-2B §342, COEQ-1 §343, PRESENCE-1 §344, PREMIERES-1 §345, PRESENCE-2 §346, FETES-1 §347, PRESENCE-2B §348, RANGBOUT-1 §349, CARTEDOM-1 §350, SAISONIMG-1 §351)

Maquettes livrées dans la conversation, non versionnées : `maquette-ergo.html` (arrivée de l’ouvrier, Accueil, Journal côté admin)
et `maquette-gratification.html` (petites victoires, jalons, fêtes rares, saison, tractoriste, cave, premières fois, 37 fiches).
1. **Décisions de Nico** : taille du texte et des boutons, pas pour le moment (03/10) ; l’Accueil de l’ouvrier n’a ni « Valider » ni
   « Noter au journal » : il arrive sur Parcelles avec la priorité (vérifié : `_goLanding` lit `_prioForMember`) ; pas d’onglet Journal
   chez l’ouvrier (14/10, intégré : ARRIVEE-1) ; ni bravos, ni classement, ni record de vitesse, ni jalon sur les traitements ou les quantités épandues.
   **Appli professionnelle** : un trait d’humour, jamais de ridicule. Écartés le 15/10 : bilan du saisonnier, compteur d’équipe,
   « vendange du vendangeur », diplôme imprimé. **Plus tard** : l’album photo de la saison (idée gardée, pas maintenant).
2. **Paliers** : ouvertures et validations 1, 10, 25, 50, 100, 250, 500, 1 000 ; sessions tracteur 1 à 250 ; trous de tarière
   (conducteur et coéquipier) 1, 10, 100, 250, 500, 1 000, 2 000, 5 000, 10 000 ; hectares d’ensemencement et d’engrais (conducteur et
   coéquipier) 1, 5, 10, 25, 50, 100, 250, 500 ; ouillages 1 à 250, soutirages 1 à 50. Le palier 1 de chaque compteur est une
   « première fois » (frise « Ton parcours au domaine »). Fête rare : parcelle ou tournée bouclée, jalon atteint.
3. **« Pourquoi on le fait » : hyper important** (Nico, 15/10 : ça fait ouvrir l’appli, valider, discuter). Une fiche par tâche : le
   catalogue, relevage, dégraffage, tracteur, cuvier, chai (37), plus des « Le saviez-tu ? ». Textes par défaut, réécrits par l’admin,
   affichés là où le geste a lieu — livré par POURQUOI-1 (§336) ; la réécriture par l’admin, c’est POURQUOI-2.
4. **Cave** : chaque opération du Chai garde ses `intervenants` (`cave.js`) : ceux que l’admin a notés le voient (« Ta présence est
   notée », avec le pourquoi — livré, PRESENCE-1 §344). Le Cuvier aussi, depuis PRESENCE-2 §346 (« Qui était là »). Coéquipier : COEQ-1 §343.
5. **Garder les récompenses d’un téléphone à l’autre** : un document `jalons_<uid>` par personne, que lui seul lit et écrit (pas l’admin).
   L’exclure de la lecture et de l’écriture générales de `firestore.rules` (comme `planning_moi_`), règle propriétaire ouverte aux
   comptes en lecture seule (comme `appareils`). Un jalon gagné reste gagné.

### ⚠️ RANGE-1 — CE QUI RESTE OUVERT (§335, posé le 15/10)
1. **À regarder chez Nico, au téléphone puis sur PC, en clair et en sombre** : Cave › Le millésime, la tête et les quatre vues — aucun navigateur ici. **Vu, non touché** : les courbes ne suivent pas l'année choisie (elles lisent les cuves en cours ; la vue le dit) ; `cave.js` est à 667 ko — le prochain gros lot de la Cave pose d'abord la question du découpage (§335e).

### ⚠️ LARG-1 — CE QUI RESTE OUVERT (§334, posé le 14/10)
1. **À regarder chez Nico, sur son PC** : chaque module au même endroit que le Pilotage, les onglets de la Réserve, et « Les gens » du Planning, où la liste passe de 826 à 744 px (de 1 210 à 744 px à 1 920) — mesuré dans Chromium sur des données fabriquées, pas sur les siennes ni à sa largeur exacte. **Vu, non touché** : le premier onglet du Pilotage part 24 px plus à droite que celui des autres modules (`.pil-tabsbar`) ; l'onglet « Labo » de la Cave garde son texte sur 760 px, à gauche (`.lbo-page`) ; `#page-chat` (sans appelant) reste exempté.
2. **Hors lot, trouvé par la chaîne — la date du jour en heure universelle (§334f)** : `_vendSince` (`cuvier.js`) lit « AAAA-MM-JJ » à minuit UTC ; à Paris, de minuit à 2 h l'été (1 h l'hiver), une cuve relevée la veille n'est pas « à mesurer » et un relevé du jour compte −1 jour — en ligne, `mv-harnais-cuv13` rougit dans cette fenêtre. `mv-harnais-reste-a-rentrer` y rougit aussi, par la faute de son décor (`toISOString`). `mv-harnais-ref1` a rougi une fois à 1 h, non reproduit. Correctif à décider par Nico, dans un lot à part.
### ⚠️ SANSREC-1 — CE QUI RESTE OUVERT (§332, posé le 14/10)
1. **À regarder chez Nico, au téléphone puis sur PC** : Cave › Le Cuvier › Récoltes — « Une parcelle ne sera pas récoltée ? » en pied d'« Encore sur pied » (admin), la feuille « Récolte 2026 » (décocher, « Enregistrer »), puis « Tout est rentré » et la ligne « Pas de récolte cette année · Modifier » ; Le millésime ; Pilotage › Économie › Revient (« constaté », la note, la pastille, « coût réparti ») ; la fiche de la parcelle (Vendange « Pas cette période »). Vérifié par `mv-harnais-sansrec1` (vraies fonctions, 31 vérifications, 12 contre-épreuves) ; ni navigateur ni ses données.
2. **Vu, non touché** : deux définitions de « la vendange » (`_mvEstVendange`, utils.js ; `_rfEstCouperet`, pilotage.js) ; une vendange renommée sans le drapeau `couperet` n'est pas reconnue (la question ne s'affiche pas) ; la feuille garde dans ses autres modes ses surfaces brutes (« 0.42 ») et son « Enregistrer » sans couleur (`mbtn` seule) ; le chevron d'« Encore sur pied » pointe à gauche une fois ouvert.

### ⚠️ TRN-1 et TRN-2 — CE QUI RESTE OUVERT (§330, §331, posé le 14/10)
1. **À regarder chez Nico, sur PC et au téléphone, en clair et en sombre** : Vigne › roue crantée › Tournées (les tournées d'avant déjà là) et l'éditeur (glisser, menu d'une ligne, « Placer après… », « Ranger automatiquement », carte et « Tracer sur la carte », Annuler / Rétablir, « L'équipe la suit pour », Enregistrer) ; Parcelles (« Tournée « … » », « Modifier ») et Décider (« Modifier la tournée ») ; Accueil › Équipes du jour (une tournée pour une équipe), puis le téléphone d'un salarié de cette équipe (« · votre équipe », plus de « Trier par proximité » ; l'administrateur garde ce tri).
2. **`MV_FORMAT` passe à 3** (2 avec TRN-1, 3 avec TRN-2) : un appareil en retard arrête d'écrire jusqu'à sa mise à jour (automatique, VER-1) — à suivre dans le parc d'appareils de l'Admin GT le jour du déploiement. Les deux points de conception laissés par TRN-1 sont fermés par TRN-2 (§331).

### ⚠️ TETE-2 — CE QUI RESTE OUVERT (§329, posé le 14/10)
1. **À regarder chez Nico, téléphone et PC, clair et sombre** : les dix en-têtes — la ligne du jour sur une ligne, le « ? » rond au téléphone, la météo qui porte « mer. 14 oct. » (Accueil, Pilotage), le cas « Hors ligne ». Vu sur la vraie appli (Vite, données injectées, météo simulée) à 360 / 390 / 1 280 px, 0 débordement mesuré ; pas sur son téléphone (taille de texte d'Android).
2. **Vu, non touché** : la CSS du bandeau brun (`.pil-mast*` dans `styles.css` et `_pilCssV2`, lue par `mv-harnais-tete1`) est sans emploi ; sous-titres coupés quand un badge est là (Cave « Domaine … », Phyto) ; couleurs du badge « Admin » écrites en ligne (`reglages.js`, `index.html`), neutralisées par le bloc. La chaîne `npm run check` n'a pas été jouée jusqu'au bout ici (159/393 puis 74 contrôles choisis) : `npm run build` la rejoue.

### ⚠️ DIRECT-2 — CE QUI RESTE OUVERT (§328, posé le 14/10)
1. **À regarder chez Nico, au téléphone et sur PC** : Pilotage › Aujourd'hui › En direct — les parcelles d'arrachage de sa capture disent « commencée le … », le jour de leur première étape (la fiche le montre : « Étape validée le … »), et passent sous les parcelles commencées après ; la loupe du plan dit le même jour, la pastille est en clair. Vérifié par `mv-harnais-direct2` (vraies fonctions, 27 vérifications, 17 contre-épreuves) ; ni navigateur, ni ses données. Une parcelle en cours sans aucune étape cette campagne ni « Début » (« remis », ligne effacée) s'affiche désormais sans date : c'est voulu.
2. **Vu, non touché** : « Personne d'indiqué » reste pour un arrachage en étapes (Nico, 14/10), alors que la ligne d'une étape porte `qui` et `membresEquipe` (`_mvEqApplique`, sans la règle de groupe de DIRECT-1) ; `_pilCk2Modele` garde `String(e.date||auj)` pour une ligne « Début » sans date (les deux « Début » datent toujours).

### ⚠️ MAJ-2 — CE QUI RESTE OUVERT (§327, posé le 14/10)
1. **La 8.94 → 8.95 passe encore par l'ANCIENNE règle** : le code qui tourne pendant ce passage est celui de la 8.94 (retour après 4 h, ou fermeture complète). Les moments calmes valent à partir de la mise à jour SUIVANTE. Après ce déploiement, fermer complètement l'appli sur les téléphones de l'équipe accélère le passage ; regarder le parc (Admin GT).
2. **À regarder chez Nico, en vrai** : téléphone — appli ouverte, déployer, passer à une autre appli puis revenir : la nouvelle version est là (« Ma Vigne est à jour · … ») ; une fiche ouverte en partant : elle attend, la barre « Nouvelle version prête » s'affiche ; un appui → écran de démarrage « Mise à jour ». Ordinateur — onglet laissé ouvert : la carte apparaît en bas de la barre latérale (30 min au plus) ; deux fenêtres affichées côte à côte : pas d'installation douce. Réglages › Moi › Mise à jour › « Rechercher ». Vérifié par `mv-harnais-maj2` (vraies fonctions, bouchons) ; ni navigateur, ni vrai service worker.
3. **Ouvert** : après le rechargement, l'appli repart sur son premier écran (comme une relance), pas sur l'écran où l'on était ; iOS peut geler une appli cachée tout de suite — l'installation se fait alors au retour (écran de démarrage 2 s).

### ⚠️ ENVOI-1 — CE QUI RESTE OUVERT (§326, posé le 13/10)
1. **À vérifier chez Nico, au téléphone, en vrai** : des parcelles au tracteur là où le réseau s'affiche sans que le serveur réponde, voyant orange, puis « Relancer l'application » : après la relance, elles restent affichées et partent quand le serveur répond (« En attente » au-delà de 20 s). Vérifié par `mv-harnais-envoi` (12 essais, 13 contre-épreuves, vraies fonctions de `firebase.js`), la perte reproduite sur le code d'avant ; ni navigateur, ni vrai Firestore.
2. **Les téléphones doivent prendre la 8.94** : celui de Nico tournait en 8.85 le 13/10. Regarder le parc (Admin GT) après le déploiement : un téléphone resté sur une ancienne version garde l'ancien défaut.
3. **Ouvert, sans perte** : une ligne supprimée pendant qu'une ancienne valeur attend en file peut revenir (la fusion garde ce qu'un côté a ajouté) ; le coffre renvoie un document entier (STASH-1, inchangé) ; la borne de 20 s est un choix, à resserrer sur pièces.

### ⚠️ RETRAIT-1 — CE QUI RESTE OUVERT (§325, posé le 13/10)
1. **À regarder chez Nico, sur PC et au téléphone** : roue crantée › Tâches, la ligne sous la Réparation ; la feuille (tout coché, « Tout décocher », une parcelle commencée qui ne se décoche pas, une parcelle désactivée avant le lot marquée « désactivée pour toutes les périodes ») ; puis la liste de l'équipe filtrée sur la Réparation, la fiche (« Désactivée pour cette période »), Pilotage › Aujourd'hui et L'année sans recharger. Vérifié par `mv-harnais-retrait1` sur les vraies fonctions ; ni navigateur ni ses données. Revoir aussi TOURNEE-1 (§324), que la première livraison de ce lot avait écrasée : « Tournée définie pour » ne propose que les tournées utiles.
2. **Vu, non touché** : l'amendement au tracteur (`phyto.js`, `_ferSyncSessions`) lit `p.tachesExclues` seul — sa ligne ancre une contre-épreuve de `mv-harnais-fertil` ; la croix d'une tâche ordinaire reste ouverte à tout compte qui écrit (`canExcl`), la feuille à l'admin ; l'arrachage, le désherbage manuel et l'effeuillage restent à la campagne (SEL-1), à confirmer par Nico ; un retrait définitif n'existe plus que pour ceux d'avant le lot et l'assistant d'amendement ; `surfFn` lit la sélection SEL-1 de la campagne consultée (inchangé).

### ⚠️ TOURNEE-1 — CE QUI RESTE OUVERT (§324, posé le 13/10)
1. **À regarder chez Nico, au téléphone et sur PC** : Parcelles sur « Toutes tâches » (l'encart sans Dégraffage ni Vendange) ; une puce ; une tâche finie choisie dans la rangée des tâches (ni barre ni numéros, en « À faire » comme en « Toutes ») ; « Tri normal » puis « Reprendre la tournée du domaine ». Vérifié sur l'appli entière dans Node (`mv-harnais-tournee1`), pas dans un navigateur ni sur ses données. **Vu, non touché** : en « Toutes », la barre d'une tâche en cours compte les parcelles faites dans « N parcelles à faire » (`_pOrdRangs` numérote les parcelles affichées) ; une liste vide ne rappelle toujours pas `_pFicheSync` (la fiche de droite sur ordinateur) ; une tâche dont les parcelles restantes sont toutes hors de sa tournée garde sa puce, et sa barre dit « aucune parcelle de la tournée dans la liste ».

### ⚠️ DATES-1 — CE QUI RESTE OUVERT (§323, posé le 13/10)
1. **À regarder chez Nico, sur PC et au téléphone** : Pilotage › Aujourd'hui (l'Arrachage du 10 sept. au 10 oct., « fenêtre passée » tant que l'équipe n'a pas fini ; l'Entreplantation du 1er nov. au 15 déc., après la Réparation), l'ordre d'« Avancement par tâche » à l'Accueil et de La campagne ; puis une date changée dans Réglages : L'année suit sans recharger. Vérifié par `mv-harnais-dates1` dans l'appli entière, sur un domaine fabriqué ; ni ses données ni un navigateur. **Vu, non touché** : la clé de `_PIL_ANN` semble ignorer encore le modèle du planning, les trous d'entreplantation et la fiche « Non applicable » (à confirmer) ; le Paramétrage de la roue crantée ne liste que les tâches au barème (les autres se datent dans Réglages) ; PRIO-1 lit l'échéance, sinon toute la période, le cockpit l'échéance, sinon la fenêtre par défaut (§316c ④) ; une vendange sans barème reste invisible à `out.vend` (L'année, Économie › Revient).

### ⚠️ HORS-1 — CE QUI RESTE OUVERT (§322, posé le 12/10)
1. **À regarder chez Nico, sur PC et au téléphone, en clair et en sombre** : Pilotage › Aujourd'hui sur une tâche désactivée sur quelques parcelles, puis l'effeuillage ou le désherbage choisis sur peu — le fantôme, la ligne « Pas concernées », la loupe, le % des appellations (tiret quand aucune n'est concernée) ; la carte « Priorité du moment » de l'Accueil. Rendu regardé dans Chromium sur un banc (vraie feuille, formes fabriquées), pas sur ses données. **Vu, non touché** : la loupe accorde toujours au masculin (« Entreplantation fait » : `f:false` dans `_pilCk2Modele`) ; `art` reste une règle de lettres (un nom de tâche personnalisé peut garder un article faux) ; le plan de secours (`_ckPlanSvg`) n'a aucune règle `.ck-pl-*` dans `styles.css` — s'il s'affiche un jour, ses rectangles prendraient le noir par défaut d'un SVG (à confirmer, non regardé).

### ⚠️ ETAT-1 — CE QUI RESTE OUVERT (§320, posé le 12/10)
1. **À regarder chez Nico, sur PC et au téléphone** : la parcelle signalée repasse « à faire » dans le plan (onglet Entreplantation) ; une validation puis ↩ : le plan suit la fiche ; l'onglet Arrachage (fini pour l'équipe : fait, la loupe dit la suite au prestataire ; une étape sur trois : en cours, « Personne d'indiqué » — les étapes n'écrivent pas de « Début »). Aucun rendu dans un navigateur ici, ni ses données (laquelle des deux causes a joué chez lui : son Journal le dira). **Vu, non touché** : ~~une tâche non choisie ou désactivée sur une parcelle reste « à faire » sur le plan~~ — fait au §322 (HORS-1, le fantôme) ; la loupe accorde au masculin (« Entreplantation fait » : `f:false` pour toutes les tâches dans `_pilCk2Modele`).

### ⚠️ LABO-1 et LABO-2 — CE QUI RESTE OUVERT (§319, §321, posé le 12/10) : **à regarder chez Nico** (Le Chai › onglet « Labo », PC et téléphone : fiche neuve, même date ressaisie, n° retapé à une autre date, filtre millésime, « Au labo ») ; le poids de `cave.js` (découpage en `src/labo.js`) ; l'ancien import « PDF seul » sans porte ; champs neufs hors export et Suivi d'élevage — détail au §319g.
### ⚠️ DIRECT-1 — CE QUI RESTE OUVERT (§318, posé le 12/10)
1. **À regarder chez Nico, au téléphone et sur PC** : Parcelles › Réparation › « Changer » puis la même équipe → dans Aujourd'hui, Pasquier des Chenes passe de « N » à l'équipe ; un « Début » neuf ; « En direct » un jour de tracteur (en marche, en pause, parcelle finie, fin de journée). Aucun rendu dans un navigateur ici. **Vu, non touché** : « sans moi » reste ignoré par « Ma part du chantier » (`_mvPartCalc`), le mur (`_mvMurData`) et Ma trace ; le fil de secours (`_ckFilHtml`) n'a ni « En ce moment » ni tracteur ; un chrono laissé ouvert reste « en cours » jusqu'à « Fin de journée » ; la pastille du plan ne montre que deux initiales (une équipe de quatre : « VS »).

### ⚠️ ARRACH-9 — CE QUI RESTE OUVERT (§317, posé le 12/10)
1. **À regarder chez Nico, au téléphone** : Parcelles › Arrachage en « À faire » (une parcelle démontée ne doit plus y être) puis « Toutes » (badge « Au prestataire », la fiche valide l'étape du prestataire) ; la carte de l'Accueil si l'arrachage est la priorité. Vu, non touché : un ouvrier peut valider l'étape du prestataire depuis la fiche, comme avant (le plan du cockpit qui lisait le journal : réglé par ETAT-1, §320).

### ⚠️ CHANT-1 — CE QUI RESTE OUVERT (§316, posé le 12/10)
1. ~~**Les tâches sans barème n'ont pas de fenêtre**~~ — fait au §323 (DATES-1 : `taskDates`, toutes les tâches de la période). **À regarder chez Nico** : les trois listes sur ses données, téléphone et PC (aucun rendu navigateur ici). Vu, non touché : PRIO-1 date sans échéance par toute la période, l'ordre par la fenêtre par défaut ; les puces de Parcelles se rangent « finie ou non ».

### ⚠️ FORME-2 — CE QUI RESTE OUVERT (§315, posé le 11/10)
1. **À regarder chez Nico, sur SES contours, au téléphone et sur PC** : la carte du haut de l'Accueil — vue dans Chromium sur un domaine fabriqué (38 parcelles), pas sur ses données. Au téléphone la mosaïque grandit (145 → 187 px) : si c'est trop, un seul facteur dans `_homeForme` la ramène, au prix de formes plus petites que les anciens rectangles. Une lanière fine devient un trait ; en sombre, « à faire » reste pâle (même jeton qu'avant, `--ligne-forte`).

### ⚠️ BULLE-1 — CE QUI RESTE OUVERT (§314, posé le 11/10)
1. **À regarder chez Nico, au téléphone et sur PC** : un « i » d'Aujourd'hui, un du Pilotage à fiche longue (« Lire la suite »), un de la Cave, et celui de Réglages › Documents › Journal des interventions (la bulle DANS la fenêtre). Vus dans Chromium sur un banc (vraie feuille, vrai `utils.js`, A11Y-2 et le geste du cockpit rejoués), pas dans l'appli entière : le branchement du cockpit est tenu par `mv-harnais-bulle1`. Un « i » collé au bord gauche sur ordinateur : la bulle peut passer sur la barre latérale (voulu, elle est au-dessus).

### ⚠️ RAIL-1 — CE QUI RESTE OUVERT (§313, posé le 11/10)
1. **À regarder chez Nico, sur son PC** : la barre ouverte et repliée, en clair et en sombre, et le logo à sa vraie taille — rendus dans Chromium à 125 % (vrai `coquille.js`, vraie feuille, données fabriquées). Un admin en mode tracteur garde le Pilotage au-dessus de Terrain (le dock le range après Tracteur, Phyto, Vigne) : à trancher si ça gêne.

### ⚠️ AUJ-8 — CE QUI RESTE OUVERT (§312, posé le 11/10)
1. **À regarder chez Nico, au téléphone et sur PC** : la bande (barre et % du risque de pluie, mm, vent) et une ligne « En cours sur … » sur SES données — vues dans Chromium à 300, 340 (sombre), 358 et 420 px sur des données fabriquées. Le vent est le plus fort des 24 h, nuit comprise (vent moyen, sans rafales) ; une tâche sans fenêtre dans la campagne n'est jamais dite « en cours ».

### ⚠️ NOTIF-3 — CE QUI RESTE OUVERT (§311, posé le 11/10 ; reprend NOTIF-2, §310)
1. **D'abord les deux secrets et l'ordre de déploiement (§311f).** **À regarder chez Nico** : Réglages › Moi › Notifications sur chaque téléphone (iPhone : appli installée), le message du jour travaillé suivant à la prise de poste, les journaux de `notifMatin` ; plus de message orange à la mise en ligne (NOTIF-2) — marquer les 19 rapports traités. Jamais testé sur un vrai téléphone. Les lignes tracteur et DAR suivent la DERNIÈRE publication de l'admin (son enregistrement, ou sa première ouverture du jour) ; 14 jours sans admin = plus d'envoi ; rien après 20 h 45 ; changer la paire de clés désabonne tout le monde.

### ⚠️ AUJ-7 — CE QUI RESTE OUVERT (§309, posé le 11/10)
1. **À regarder chez Nico, sur ses données et au téléphone** : la vue Économie et la tuile Budget, qui monte (le payé, plus le barème du fait). Vues dans Chromium sur un domaine reconstitué.
2. **Le jour mêlé se partage à la SURFACE** entre arrachage et travaux au barème (aucun temps d'arrachage dans les conventions) ; plus fin, il faudrait lire les « Début ».
3. Vu, non touché : « Par appellation » compare le barème du travail validé, pas le temps réel ; les heures d'un arrachage commencé restent « en attente » jusqu'à sa validation.

### ⚠️ AUJ-6 — CE QUI RESTE OUVERT (§308, posé le 11/10)
1. **À regarder chez Nico, sur son PC** : « À savoir » sous les onglets en descendant, la pastille « Nouveau » entière, un passage par Économie puis une donnée qui arrive
   (le plan et la courbe restent). Vu dans Chromium sur un domaine reconstitué, pas sur ses données ni à sa largeur d'écran.
2. **La courbe repart du 10/10** : les photos sans période (d'avant AUJ-5) sont écartées ; une photo à 0 h suivie d'un reste plus haut aussi.
3. Vu, non touché : le sélecteur de tâches du plan défile de côté sans indice (« Entreplantation » coupée au bord) ; à chaque montage, les parcelles reviennent en fondu (0,7 s).

### ⚠️ AUJ-5 — CE QUI RESTE OUVERT (§307, posé le 10/10)
1. **À regarder chez Nico, sur son PC** : trois colonnes et « À savoir » collant à sa largeur réelle ; la vue Économie et la tuile Budget (le domaine reconstitué
   n'avait pas de taux horaire) ; la pastille un jour travaillé (rendu un samedi : fixe, voulu) ; un jour chômé, l'Effectif montre le prochain jour travaillé.
2. Les photos d'avant le 10/10 n'ont pas de période (`p`) : toutes restent affichées jusqu'à leur sortie des 60 jours.

### ⚠️ ARRACH-8 — CE QUI RESTE OUVERT (§306, posé le 10/10)
1. **Chez Nico, une fois déployé** : redéclarer la parcelle arrachée en janvier (fiche complète → « Arracher cette parcelle… », sa vraie date). La case
   « Valider aussi » doit disparaître ; la fiche de droite dire « Arrachée le … » et « Plus aucun travail sur cette parcelle ». Vérifié par `mv-harnais-arrach8`, ni sur ses données ni dans un navigateur.
2. **Si la période active a commencé après le 25/09**, l'arrachage validé ce jour-là sur cette parcelle reste vivant dans SA période : l'annulation d'octobre,
   saisie dans une autre période, ne le vise pas (c'est ce que fait `annulerTache`). Il compte au temps réel du 25/09 — l'arrachage après la date reste permis
   (souches, piquets). Aucun écran ne retire une saisie d'une période close.
3. **Trois définitions d'une annulation subsistent** : `_mvAnnulee` (ARRACH-8 : étapes + période), `_mvDerniereValidee` (CIBLE-1, copie privée), `_ecoTvEvents` (retire la
   DERNIÈRE clôture, sans période). D'accord dans le cas courant (`mv-harnais-arrach8`, I1-I2) ; à faire converger vers `_mvAnnulee`. `pQuickUndo` remet l'état sans
   trace au journal : sa validation reste « Validé » pour les trois.
4. **« 0/0 tâche »** sur une parcelle sans aucun travail dans la période (arrachée d'avant) : `_pvCompte` pourrait écrire un tiret.

### ⚠️ BUILD-1 — CE QUI RESTE OUVERT (§305, posé le 09/10)
- **Le chiffre de Nico** : la dernière ligne du lanceur donne le total et les 5 plus longues — à comparer à ses builds d'avant. · **Compilation Vite** (Terser, 2 passes) : mesurée §305f, à trancher par Nico.
- **`recup --contre`** (134 s, 90 défauts, recharge tout `planning.js` à chaque défaut) = le plancher du parallèle : à alléger. · **`entree1`** : ~50 s d'attente VOULUE (WebCrypto, 350 ms par scénario), cachée par le parallèle.
- Contre-épreuves en CI seulement : écarté pour l'instant (≈ 1 min de gain une fois en parallèle).

### ⚠️ GF-1 — CE QUI RESTE OUVERT (§302, posé le 09/10)
1. **Deux réglages viennent de Claude, pas de Nico — à caler sur ses cuves** : « ça stagne » sous 5 % de baisse par jour (`_VEND_GF_STAGNE`) et
   une analyse réclamée tous les 4 jours (`_VEND_GF_CAD`). Son rythme d'envoi au labo n'a pas été donné.
2. **Le repère de densité reste théorique** : sur 0,2 g/L il descend de 0,8 point, alors que les cuves du domaine sont sèches vers 997-998 au
   densimètre. Les relevés portent désormais densité ET labo : un lot à part pourra caler le repère sur les cuves du domaine.
3. **À regarder chez Nico, sur téléphone** : la feuille de relevé (champ labo, chapeau masqué après pressurage), le bloc et la courbe des sucres,
   « Déclarer la FA finie », la ligne du Chai, le cahier de cuverie imprimé. Vérifiés par `mv-harnais-gf`, pas regardés sur ses données.
4. **`scripts/mv-harnais-cuvier-correction.mjs` ne démarre plus** (il lit `src/cave.js` seul depuis CUV-DEC, §164) et n'est dans aucune chaîne.

### ⚠️ FORME-1 — CE QUI RESTE OUVERT (§301, posé le 09/10)
1. **À regarder chez Nico, avec SES contours** (essais sur un domaine reconstitué) : PC (loupe, deux colonnes), téléphone (repli, toucher → fiche). Un contour dont le
   nom diffère de la parcelle donne un carré de surface, et la note sous le plan le nomme. Le sens des rangs dessinés est un repère (plus petit rectangle).

### ⚠️ CADRE-1 — CE QUI RESTE OUVERT (§300, posé le 09/10)

1. **À regarder chez Nico, sur son PC** : la journée ouverte depuis la barre (la barre passe dessous), « Les gens » (clic sur une autre ligne,
   défilement, puis un autre module), deux ou trois fenêtres de saisie (plus de barre horizontale). Ici, les barres de Windows n'ont pas pu être
   imitées (navigateur de test à barres invisibles) : le débordement a été MESURÉ (largeur du contenu contre celle du cadre), pas regardé.
2. **Le reste du socle du cockpit vaut toujours pour toute l'appli** (`body` — police et interligne 1,45 —, `button{font:inherit}`,
   `:focus-visible`, `[hidden]`) : la refonte a été dessinée et validée par-dessus ; ne pas le défaire sans capture avant / après.
3. Vu, non touché : dans le cockpit, des boutons `.ck-ch` dépassent leur parent de 8 px (avant comme après ce lot).
4. Les cases grises « 7h » (heures saisies = prévu, `pl2c-mod`) gardent l'ancienne pastille, par choix de PLAN-1 (§279b) : à trancher avec Nico.

### ⚠️ PRO-1 — CE QUI RESTE OUVERT (§269, posé le 08/10)

1. **La frise des 24 h de « Traiter ? » n'a pas été vue à l'écran** : le domaine reconstitué n'avait pas de prévisions horaires. Le dessin
   vient de `_pilTraiterCalc().fen` (harnais) — à regarder sur le vrai domaine un jour de fenêtre.
2. **Trois colonnes seulement au-delà de 1 150 px de contenu** (`ranger`, seuil de la maquette) : à 1 440 px barre ouverte, Aujourd'hui
   reste sur deux colonnes. Conforme à la maquette ; à regarder avec Nico sur un grand écran.
3. **Le rendu du §269 a dû cliquer « Se connecter » par script et simuler `_mvLoadClaims`** : `scripts/e2e-local.mjs` fait un vrai clic
   et ne simule que la connexion — à rejouer une fois (`npm run test:e2e`) avant de s'y fier.

### ⚠️ GNR-2 — CE QUI RESTE OUVERT (§256, posé le 06/10)

1. **À regarder chez Nico, sur ses vraies données** : la carte Cuve au téléphone (toute la largeur, titre sur une ligne, barres, échelle),
   puis sur ordinateur les travaux et la cuve côte à côte, la révision dessous quand elle s'affiche. Côté Claude, le rendu a été regardé
   sur des données reconstituées d'après sa capture (Chromium), pas sur les siennes.
2. **Limites assumées** : un nom de travail long reste coupé par des points de suspension dans la cascade (la colonne s'élargit jusqu'à
   176 px, elle ne passe pas à la ligne) ; une tablette en paysage (≥ 1 024 px) prend la mise en page de l'ordinateur.

### ⚠️ VUE-EQUIPE-1 — CE QUI RESTE OUVERT (§251, posé le 05/10)

1. **À regarder chez Nico, sur un téléphone de salarié** : les deux onglets, la grille en semaine et sur le mois, la ligne « Présents »,
   « vous », la note de lecture seule, et en thème sombre. Aucun harnais ne lit une mise en page ; rendu non regardé côté Claude.
2. **Le mois en cours seulement** (demande de Nico) : le 30, la semaine d'après n'est pas visible et « Présents demain » vaut « · » le dernier
   jour du mois. À rouvrir si ça gêne à l'usage (mois en cours + suivant).
3. Les équipes collectives s'affichent (×N) mais ne comptent pas dans « Présents » ; la visite guidée n'a pas de moment pour cet onglet.

### ⚠️ MOTIFS-1 — CE QUI RESTE OUVERT (§250, posé le 05/10)

1. **Déployer DANS CET ORDRE** : `firebase deploy --only functions:planningVuesEntrees,functions:planningVuesMembres,functions:gtPlanningVues`
   (premiers déclencheurs Firestore du projet : la CLI peut demander d'activer Eventarc / Pub/Sub, puis un second essai quelques minutes
   plus tard) → rattrapage depuis `/gt.html`, session ouverte, console : `await fbCallFn('gtPlanningVues', {}, { timeout: 300000 })` →
   console Firestore : `planning_equipe` (aucun motif autre que « autre ») et des `planning_moi_<uid>` → `npm run site` → `npm run build`
   → `firebase deploy --only hosting` → « Mon mois » regardé sur un téléphone de salarié → **seulement alors**
   `firebase deploy --only firestore:rules`. Les règles avant l'appli : un téléphone pas encore à jour perdrait son planning.
2. **`npm run test:rules` chez Nico** (ou le job CI `rules`) : 70 cas dont 17 P, 15 contre-épreuves dont 3 MOTIFS-1 — jamais joués côté
   Claude (pas d'émulateur dans le bac à sable).
3. **Limites assumées** : la vue personnelle d'un membre retiré n'est pas effacée (lisible par son seul compte, coupé par `off`) ; une fiche
   Inactive sans date de contrat peut manquer aux listes d'un salarié pour une année où elle n'avait que des horaires saisis
   (`_mvCompteSansDate` lit l'existence de l'année ; la vue d'équipe ne garde qu'absences, échanges et effectifs) ; les copies de secours
   locales d'avant le lot partent en trois jours d'ouverture ; un rôle `pilotage` sans `admin` voit « absent » au lieu de « en arrêt ».
4. **Un champ ajouté demain à une journée de planning** se décide aussi dans `functions/planning-vues-calc.js` (`CHAMPS_JOUR`, `vueJour`) :
   tant qu'il n'y est pas, il ne sort pas vers les collègues (liste blanche, voulu).

### ⚠️ AUDIT-PERF — CE QUI RESTE OUVERT (§241, posé le 04/10)

1. **Le plan est dans `audit-perf-ux.md`** (racine). ✅ VALID-1, LOGIN-1 (§242), VOILE-1, PROFILS-1 (§243), ENTREE-1 (§244), RENDU-1 (§245), TAILLE-2 (§246), TEXTE-A (§247), JOURNAL-1 (§248), GT-1 (§249) — tout le décidé du 04/10. Restent : DONNEES-1 (il faut une vraie sauvegarde), IDS-1, le lot B de TEXTE-A (réglage « Taille du texte »).
2. **Tranché par Nico le 04/10** : ENTREE-1 = le mot de passe se retape comme d'habitude ET ouvre l'appli sans réseau (fait, §244) ; PAQUET-1 abandonné ; TEXTE-A en maquette ; GT-1 décidé ; le premier appui qui « démarre » dans la fiche parcelle est voulu.
3. **À fournir par Nico** : `npm run taille -- "<sauvegarde complète>.json"` avec le VRAI chemin du fichier téléchargé (le 04/10, les noms d'exemple ont été tapés tels quels) — puis une seconde sauvegarde plus tard, pour le rythme.

### ⚠️ GESTES-1 — CE QUI RESTE OUVERT (§239, posé le 04/10)

1. **GESTES-2 (validé, non fait)** : la suite d'une dégustation dans « Ce qui vient » jusqu'au geste qui la solde (Soutirer, Analyser,
   Assembler, Retirer le fût) ; « Prête pour la mise » lue par Pilotage › Cave (§20g). Aujourd'hui la suite est notée et affichée, sans rappel.
2. **Lot 2 de la série cave (proposé)** : bâtonnage + rappel, méchage des fûts vides ; puis analyses complètes, mise en bouteille enrichie.
3. **À regarder sur capture** : les huit boutons de type au téléphone (3 à 4 rangées).

### ⚠️ ALIGN-1 — CE QUI RESTE OUVERT (§236, posé le 04/10)

1. **ALIGN-2, l'Accueil en rangées** : fait (§237) ; correctif ALIGN-3 (§238) — un bloc masqué réapparaissait sur ordinateur. À regarder à l'œil chez Nico sur ordinateur : les rangées, le bouton « Pleine
   largeur » en mode édition, la météo par secteur en une carte, un bloc masqué qui laisse son voisin s'étirer.
2. **À l'œil chez Nico** : la rangée de la décision du jour (ordinateur et téléphone), la carte « Protection restante » et son
   bouton, la tuile de la tension. Aucun harnais ne lit une mise en page.
3. `mv-harnais-audit-pil` (hors de `npm run check`) porte 2 rouges déjà présents sur la base `3b9c695` (B5 Cave, B6 clé `equ`) :
   non touchés par ALIGN-1, à regarder à part.

### ⚠️ PRIO-1 — CE QUI RESTE OUVERT (§235, posé le 04/10)

1. **À regarder chez Nico** : les dates de travaux de chaque tâche de l'hiver en cours — sans dates à elle, une tâche court sur
   toute la période et chevauche tout, et la carte dira « À choisir » ; puis la carte Tâche prioritaire et Ma part du chantier sur
   ses vraies données (ordinateur et téléphone). Aucun harnais ne lit une mise en page.
2. **L'alignement** : maquette validée le 04/10 ; le Pilotage (ALIGN-1, §236) et l'Accueil (ALIGN-2, §237) sont faits.
3. **Le crayon de la pastille priorité de l'Accueil est toujours caché** (`renderHome` pose `display:none` dans les deux branches) :
   la priorité se fixe depuis Parcelles, ou depuis le bouton de la carte du Pilotage. À trancher avec Nico.
4. **L'anneau doré de la carte** (`_mvTachePrio`, utils.js) suit la seule priorité fixée, pas la règle des dates : laissé tel quel,
   hors du périmètre annoncé à Nico.

### ⚠️ ANNEE-1 — CE QUI RESTE OUVERT (§234, posé le 04/10)

1. **À regarder chez Nico** : L'année sur ses vraies données, ordinateur et téléphone — le cadre, les deux graphes coupés, les
   lignes du renfort ; et son mois de campagne (s'il est resté sur août, l'année vigne a les dates de l'exercice : l'écran le dit).
2. **Économie, « bis repetita »** (Nico, 04/10) : la même revue est à faire sur l'onglet Économie — après L'année.
3. Le renfort de L'année (photo) et celui de Décider (simulation) peuvent différer : voulu (Nico, 04/10), écrit dans `MV_INFO`.

### ⚠️ ANN-1 — CE QUI RESTE OUVERT SUR LES NOUVEAUTÉS (§225, posé le 03/10)

1. **À regarder chez Nico, sur téléphone** : la ligne « À vérifier » sous les chiffres (admin), la pastille sur Réglages › Moi ›
   Journal des nouveautés, le Journal lui-même. Aucun harnais ne lit une mise en page ; rendu non regardé côté Claude.
2. **« Vu » est par appareil** (localStorage, clé domaine + personne) : un « Vu » du téléphone ne suit pas sur l'ordinateur. Le
   porter en base = une collection par personne ; à décider si ça gêne à l'usage.
3. **Le niveau 2 « à l'endroit du geste »** (dans la feuille de validation d'un ouvrier) n'existe pas : il vit sur l'Accueil.

### ⚠️ COH-1 — LA DEMANDE DU 03/10 : UNE APPLI HOMOGÈNE (§222, posé le 03/10)

Nico, 03/10 (cinq captures) : l'arrachage n'est pas compté partout, les cartes débordent sur PC, les graphiques sont trop
différents entre eux, et des heures sup apparaissent dans Décider › le renfort. Découpage validé avec lui : trois lots.
2. ✅ **Lot 2 — fait au §224 (RENF-2).** Pour mémoire, la demande : Nico : le renfort doit dire combien de saisonniers il faut sur une période,
   JUSTEMENT pour que l'équipe n'en fasse pas. Capacité = heures du planning, rien de plus (`hMax = hJour`, comme la fin
   prévue — décision du 10/09) ; plus de part « Heures sup » au coût ni au verdict ; la réponse devient un CALENDRIER
   « du … au … : N saisonniers ». Un saisonnier compte aux heures du modèle standard de la semaine (Nico : surtout des
   TESA, qui suivent l'horaire de l'équipe ; un CDD peut différer → réglage éventuel). Maquette → validation → intégration.
   Vérifié le 03/10 : la capacité lit déjà le planning (`_capDayReal` : modèle de chacun, entrées, CP et récup à 0) et
   `w.cap` le modèle standard jour par jour (`_cap1`) ; le seul ajout fixe est le ×8/7 de `_rfSim` (`hMax/hJour`).
   ⚠️ Le modèle INTÉGRÉ dit 32 h en janvier-février (Nico : 28-29 h l'hiver, 39 h l'été) : vérifier chez lui que le modèle
   2027 est enregistré (sinon bandeau « Le modèle … a été replacé » dans le Planning).
3. ✅ **Lot 3 — kit graphique + mise en page PC** : 3a au §226 (KIT-1), deux colonnes au §227 (KIT-2), 3b au §228 (KIT-3),
   3c et les surfaces de tous les modules au §229 (KIT-4). Reste le tour à l'œil chez Nico, écran par écran. Pour mémoire : Recommandation retenue : PAS d'option petit/grand par utilisateur ; un kit
   (une barre en deux épaisseurs, un cadre en trois hauteurs, un seul style de grand chiffre, mêmes couleurs d'état) et un
   bouton « Agrandir » sur chaque graphique (il existe déjà sur la carte de Décider). Constat : une vingtaine de familles de
   barres dans `styles.css`, donuts et jauges chacun à sa taille, l'avancement par tâche dessiné deux fois (Accueil
   `htache-*`, Pilotage `pil-b*`). Mise en page : `.page{max-width:none}` au-delà de 1200 px (Accueil et Parcelles à
   1 900 px de large), `.pil-wrap` à 1 280. Maquette d'une page témoin d'abord.
4. **La passe d'audit écran par écran** (téléphone et PC) promise à Nico : avec le lot 3.
10. **RENF-2, à regarder chez Nico** (§224) : la carte sur ses vraies données — le calendrier de l'hiver, le plafond proposé
    (la semaine la plus longue de SON modèle), le coût de l'inaction qui monte (plus d'heure sup cachée). Le CDD est à
    35 h fixes, en dur (`c.hCdd`) : un réglage si un domaine en a besoin.
9. ✅ **Lot 2 — maquette v2 validée par Nico (03/10), intégrée au §224** : en plus du calendrier, « Et sans renfort ? » — l'équipe seule avec
   des heures sup plafonnées (39 / 43 / 48 h ; défaut proposé : la semaine la plus longue du modèle du planning), leur coût
   aux taux du relevé (25 % jusqu'à la 43e heure, 50 % au-delà) et le retard qui reste ; plus « sans renfort ni heures sup ».
### ⚠️ GNR-M ET LA SÉRIE « DENSIFIER LE PILOTAGE » — CE QUI RESTE OUVERT (§222, posé le 03/10)

1. **À l'œil chez Nico, sur ses vraies données** : les trois cartes d'Aujourd'hui sur téléphone (mise en page reprise au §256), la part chronométrée et les
   intervalles écartés de la tuile Consommation mesurée. Aucun harnais ne lit ses pleins réels.
2. **Les lots suivants de la maquette validée** (`maquette-pilotage-densite.html`), dans l'ordre recommandé :
   ✅ **SPARK** — fait au §214 pour la **seule Cadence** (`_mvGraphSpark` sur le moteur commun). ⚠️ **Question à Nico : un
   relevé quotidien ?** Charge restante et Budget n'ont aucun historique daté (§214a) ; pour leur donner une courbe, il faut
   écrire chaque jour un instantané (reste, % consommé, % fait). Recommandation : un document par domaine, une ligne par jour,
   écrit au premier affichage du Pilotage par un admin, borné à 60 jours. Pas de rétroactif : la courbe se remplit en 14 jours.
   ✅ **TENS** — fait au §215 (face au prévu du modèle, semaine face au cadre légal du Planning) ; ✅ **TOUR** — fait au §216 (rendement sous le résultat, comparaison « au plus proche ») ; ✅ **CARTE** — fait au §217 (cinq vues, chacune à sa source) ; ✅ **PROT + INACTION** — faits au §218 (rémanences réglables 10 / 12 / 14 j, mode déduit de la substance ; coût de l'inaction = le « sans renfort » de Décider).
3. ✅ **PHOTO-1** — fait au §219 (`CONFIG.photo`, 60 jours ; courbes de la Charge restante et du Budget). **À regarder chez Nico
   après deux ouvertures d'Aujourd'hui.** Découpage de `pilotage.js` : décision de Nico, **rien maintenant** (866 ko, on découpe si
   on approche 950).
4. ✅ **PLUIE-1** — fait au §220 (lue chez Open-Meteo, pas stockée ; seuil réglable). Reste : la pousse, et l'heure du traitement
   face à une pluie dans les 2 h.
5. ✅ **Le traitement conseillé en pointillé dans la cuve** — fait au §221 (protection à nu + fenêtre + activité de pulvérisation).
   Éteint par `CONFIG.features.trait_cuve` jusqu'à l'été, à la cadence mesurée des traitements ; à allumer avec son Quoi de neuf.
6. **Limites assumées du §213** : conso par tracteur, pas par travail ; heures restantes au barème (le rythme chronométré de chaque
   session pourrait les affiner).

### ⚠️ SEL-1 / ARRACH-3 à 5 — CE QUI RESTE OUVERT (§205-208, posé le 02/10)

2. **À regarder chez Nico** : l'avancement de l'Effeuillage et du Désherbage sur la campagne en cours, juste après le
   déploiement — les parcelles déjà saisies doivent compter d'office ; les autres, plus.
3. ✅ ~~Double saisie de la facture~~ — garde croisée au §208. ⚠️ Limite écrite : sans n° de facture, rien ne prouve le doublon ;
   le nom « prestation / main-d'œuvre / arrachage » est refusé dans La Réserve, mais un intrant au nom anodin passerait.
4. **Le bouton « Début »** écrit encore un arrachage « En cours » sans étape (sans effet sur les heures ni l'argent).

### ⚠️ FERTI-3 — CE QUI RESTE OUVERT SUR L'AMENDEMENT (§202-203, posé le 02/10)
2. ✅ **La session « Amendement » valide la tâche** : FAIT au §204 (`auTracteur`, écarté du temps vigne). ⚠️ À voir
   si d'autres activités tracteur doivent un jour cocher LEUR tâche : le mécanisme est écrit pour l'amendement seul.
3. **Calendrier d'épandage vigne** non contrôlé (grille régionale en couleurs, dates par type non lues). Seul le type 0
   (15/12 – 15/01) l'est. ✅ **Année de plantation** : `p.plantee`, §203.
4. **À l'œil, sur téléphone** : l'assistant (5 cartes repliables), l'onglet, le cahier imprimé. Aucun harnais ne lit une mise en page.

### ⚠️ REV-1 — CE QUI RESTE OUVERT SUR LE REVIENT (§194, posé le 28/09)

1. **À regarder chez Nico, sur les vraies données** : le cycle affiché (sans récolte 2025 saisie, il part un an avant la fin), le
   coût vigne par bouteille, et l'écart avec l'ancien chiffre de la Synthèse (annoncé dans `WHATS_NEW`).
2. **Le prévu de main-d'œuvre ne sait ni le tracteur ni la cave à venir** (`_pecRevPrevuMO`) : il est plutôt haut. Le dire à la
   fiche a suffi pour ce lot ; le soustraire exigerait un planning d'activités qui n'existe pas.
3. **`_pecRevData` est appelé par la Synthèse ET par Revient** : `_ecoTempsVigne` n'a qu'une case de cache, les deux fenêtres
   (période et cycle) se chassent. Coût non mesuré sur un vrai domaine — à regarder si l'onglet rame.

### ⚠️ RULES-1 — LE PREMIER RUN RÉEL, PUIS DEUX ÉCARTS À TRANCHER (§189, posé le 27/09)

1. ✅ **Premier run réel, chez Nico le 27/09 : 53/53, 12/12.** Reste à voir le job CI `rules` vert au premier push,
   et que le journal du SDK se tait (`setLogLevel('silent')`, posé après ce run, pas encore rejoué).
2. **F01 — une fiche Inactive lit encore `_mv_signatures/{slug}`** : ce bloc compare le claim `tenant` sans
   regarder `off`. Faible (un reçu CGU, aucune donnée métier), mais contraire à ACCES-1 (§186). Ajouter
   `&& request.auth.token.get('off', false) != true` ? **Décision de Nico.**
3. **F02 — `error_log` n'est borné que pour les `ro`** : la règle 3 (tout membre non-ro) l'accepte sans le plafond
   de 100 de la règle 5. Sans gravité (la limite de 1 Mio de Firestore tient), à aligner ou à assumer.
   Chaque écart fermé : retirer sa ligne de `CONSTATS` dans `mv-harnais-rules.mjs` (le harnais le signale).
4. ✅ **FAIT (LISTE-1, §190) — une liste unique des harnais.** Historique de l'entrée : `check` et `prebuild` sont **deux chaînes identiques de
   142 commandes**, copiées à la main ; et la CI rejoue un sous-ensemble à la main, puis `npm run build` relance
   **tout** via `prebuild` (double exécution). Un manifeste lu par un seul lanceur, `prebuild: "npm run check"`,
   la CI sur le même lanceur. ⚠️ Ne PAS déplacer les scripts en sous-dossiers : les contre-épreuves calculent la
   racine par `join(ICI, '..')`, et les chemins sont écrits dans `ci.yml`, le crochet et des centaines de renvois.

### ⚠️ DIM-4 — L'ORDRE DE SORTIE DES HEURES, CHOIX DU DOMAINE (§193f, posé le 27/09)

Aujourd'hui le taux le plus élevé sort d'abord, partout (paiement, récup, absences). Nico : *« prendre d'abord les heures du taux le
plus élevé ou alors laisser le choix lors de la demande »* — ce n'est pas une généralité, ses clients peuvent faire autrement. La loi
ne règle pas l'ordre ; le choix paiement/repos relève de l'accord collectif ou de l'employeur, jamais du salarié seul. À faire : un
réglage de domaine (défaut : le plus élevé), et le choix de l'employeur au moment de la demande.

★ **Une nouvelle liste d'objets = l'ajouter à `_MV_LISTES_OBJETS`** (LISTES-1). ★ Le chargeur de l'application entière est partagé (`scripts/mv-app-node.mjs`, `chargerApp({remplace})`) : ses doublures (`logError`, `_mvAvale`…) se posent **APRÈS** le chargement, sinon utils.js les écrase sans bruit.

### ⚠️ QUESTION OUVERTE — L'ÉCART DE CADENCE ET LE TEMPS RÉEL (§172f ③, posée le 23/09)

Deux mesures du temps existent depuis TV-1. **L'écart de cadence** (`_pecCadPresence`, Synthèse, verdict, date de fin, facteur
`_pilFacteurK`) compare la **présence globale** du planning (moins le tracteur) au barème de TOUT le travail fait — cave, atelier et
bureau restent dedans (biais écrit à l'écran). **Le temps réel** (`_ecoTempsVigne`) verse les heures aux parcelles **validées** :
il n'a pas ce biais, mais il ne voit que ce qui est validé (le reste est « en attente »).
**La question** : brancher la cadence sur les heures VERSÉES (Σ h versées contre Σ barème des clôtures) ? Nico, 23/09 : *« on laisse
l'écart de cadence comme il est pour le moment »*. **Ne rien changer sans lui.** ★ Depuis ENG-2 (§173), l'engagé retire les journées de cave
et la cadence non : un argument de plus pour la brancher, à lui présenter tel quel. Avant d'en reparler, mesurer chez MG : la part
d'heures « en attente », et l'écart des deux mesures sur une période close.

### ⚠️ PREP-1 — À JOUER SUR UN DOMAINE JETABLE AVANT UN VRAI CLIENT (§134)

1. ⚠️⚠️⚠️ **Le protocole de §134h, en entier, dans la fenêtre privée ngdevpro.** Aucun navigateur côté
   Claude : le harnais prouve la logique, pas l'écran. Point dur : **la feuille, le bandeau, le refus de
   « Début »/« Valider », la sortie, et le journal d'accès relu intact**.
2. **« Accéder » ou « Préparer » : trancher.** Deux portes vers le même domaine, dont une qui n'y fait
   plus entrer (§134e).
3. **Le trou de C23 dans `firebase.js`** : réparer le nettoyeur de commentaires de `preflight.mjs`, puis
   regarder ce que la zone cachait (§134e ⑤).

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §43 (la visite guidée)

1. ⚠️⚠️⚠️ **ALIGNER LES TROIS CHIFFRES DU ROI.** La démo dit **127 h (+37 hors total)**.
   `mvprint.py` dit **215 h/an pour 10 ha** et l'argumentaire oral **3 à 5 h/mois**. Tant que les
   trois ne disent pas la même chose, la plaquette contredit la démo devant le même prospect.
   **C'est le point n°1, avant le devis le prospect Gironde.**
2. ⚠️⚠️ **REGARDER LES 19 MOMENTS EN VRAI.** Le harnais vérifie ce qu'on facture et ce qu'on vise ;
   **il ne voit pas un projecteur mal posé**. En particulier : le moment ouvrier (bascule + retour),
   le dépli des échéances, la sous-vue Parcelles d'Économie, et les deux moments qui enchaînent
   plusieurs rendus (`wait`).
3. ★ **Caler les trois estimations neuves** : pointage 10 min × 220, carnet tracteur 10 min × 60,
   papiers du contrôle 60 min × 6. Elles sont de moi, pas de Nico — lui seul peut les signer,
   comme il a signé les 250 tâches de janvier à juillet.
4. ★ **ESLint et un navigateur se jouent côté Claude** (vérifié le 19/10, AIDE-1 §365) : `npm ci` installe tout, ESLint compris (l’entrée « jamais joué », rayée le 01/09, est au §365h). Un Chromium vit dans `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` : `test:tutos` le prend par `MV_CHROMIUM`.
   ⚠️ `test:smoke` et `test:e2e` lancent le Chromium par défaut de Playwright (révision 1228, absente du bac à sable) : les jouer avec `PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb` et un lien vers la 1194 (recette au §365e — smoke vert, e2e vert hors météo, injoignable d’ici), ou leur faire lire `MV_CHROMIUM`.

### ⚠️ OUVERT DEPUIS LE 25/08 — L'ÉLÉMENT QUI DÉBORDE SUR L'ACCUEIL (§67c)

**La garde `overflow-x:clip` neutralise l'effet ; la cause n'est pas nommée.** Tant qu'elle ne l'est
pas, elle peut réapparaître ailleurs (une page qui n'aurait pas la garde, un document imprimé, un
écran futur). **Le geste** : la sonde complète de §67c, **en simulation mobile (~390 px)**, connecté,
sur l'accueil — pas en largeur bureau, où le layout n'est pas celui du téléphone.
★ Piste à mesurer, **pas un constat** : les items flex de l'accueil sans `min-width:0`
(`.hdre-tit`, `.hmsem-l`, `.hdre-bad`) ne peuvent pas rétrécir sous leur mot le plus long.

### ★ À ÉCRIRE — `mv-harnais-contraste.mjs` (§67d)

Aucun harnais du projet ne lit une couleur. Celui-ci rendrait `index.html` sous Chromium, jouerait
les **deux** thèmes et exigerait ≥ 4,5:1 sur tout élément à texte direct **réellement rendu**.
⚠️ Deux pièges déjà payés : filtrer sur `getBoundingClientRect()` non nul (et **jamais** sur
`getComputedStyle().display`, qui ne voit pas un ancêtre caché), et **recharger la page entre les
deux thèmes**.

### ⚠️⚠️⚠️ AUDIT DU 16/08 — LIRE §44 AVANT DE TRAVAILLER DANS CE BACKLOG

**Ce backlog a été confronté aux fichiers le 16/08, entrée par entrée.** Résultat : **onze entrées
rayées** (le code les avait déjà réglées), **quatre chiffres corrigés à la hausse**, et **neuf
harnais sur vingt-six qui ne peuvent pas démarrer** — dont six qui portent un chemin de bac à sable
en dur et se lisent donc comme des succès.

**Les trois priorités qui en sortent** :

1. ~~⚠️⚠️ **`_pl2Cell`**~~ — **FAIT** (constaté le 31/08, §74a). Le code rendait déjà le retard en
   orange avec ses heures (`pl2c-late`) **avant** la croix rouge. **Douzième entrée périmée** de ce
   backlog. Le reste réel — l'entrée de légende — a été livré le 31/08.
2. ~~⚠️⚠️ **Les six harnais à chemin absolu** (§44c)~~ — **RAYÉ, vérifié le 01/09.** Les huit
   harnais concernés (`bandeau-essai`, `cadence-escalier`, `claude-md`, `parcours-prospect`,
   `reconduction`, `sec3`, `sec7-contre`, `vitrine`) **démarrent tous, code de sortie 0**. Les seules
   occurrences de `/home/claude` qui subsistent sont dans des **commentaires qui documentent le
   piège corrigé** — un `grep` sur le chemin les compte encore et fait mentir cette entrée.
   **Treizième entrée périmée de ce backlog** (§44, §74). ★ *Une entrée de backlog vérifiée par
   `grep` sur une chaîne se périme au moment où quelqu'un écrit un commentaire à son sujet : la
   vérification utile est d'exécuter, pas de chercher.*
3. ⚠️ **0a-quater** — la masse salariale exclut les bureaux pendant que son commentaire dit
   l'inverse. **`avecBureau` : 0 occurrence.**

⚠️ **L'audit n'a PAS pu vérifier l'état EN LIGNE** (bac à sable sans accès au domaine) : tout ce qui
suit décrit **le dépôt**, pas la production. **Détail, preuves et règles nouvelles : §44.**

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §42

1. **`npm run lint` et ESLint** — **jamais joués côté Claude de tout le chantier** (`node_modules`
   absent du bac à sable ; l'échec est identique sur la base d'origine, ce n'est donc pas le lot).
2. ⚠️⚠️ **REGARDER Simuler et Cave.** Leurs rendus sont vérifiés par assertion mais **n'ont pas été
   regardés** — budget d'outils épuisé sur le dernier lot. Vu que **trois** défauts du chantier n'ont
   été trouvés que par l'œil (§42h), c'est le point faible du paquet. En particulier **l'étape 2 du
   simulateur**, dont la légende de couleurs a été remaniée.
3. **`test:smoke` et `test:e2e`** — jamais joués côté Claude (CDN Playwright injoignable pour
   l'installation de Chromium ; les mesures de ce chantier passent par le Chromium déjà présent).
4. ★ **La migration `_PIL_ST_V` remet la disposition à neuf UNE fois chez MG et le second domaine** : les
   cartes qu'ils avaient ouvertes ou fermées repartent repliées. C'est annoncé dans le journal des
   nouveautés — vérifier que le message est bien passé avant qu'ils s'en étonnent.

### ⚠️⚠️ NOUVEAU AU BACKLOG (issu de §55 — 23/08)

1. ⚠️⚠️⚠️ **REPOSER LE 19 ET LE 20 AOÛT chez le domaine de référence.** Leurs entrées ont été enregistrées
   avant le correctif : plus d'horaire, plus de drapeau d'échange, **et aucun calcul ne peut les
   retrouver**. Tant que ce n'est pas fait, la feuille de Victor sort à **+8h** au lieu de −8h30.
   Geste : *Annuler l'absence → sélection → mode Remplacement 07:00→16:30 → reposer le retard (19) /
   l'absence injustifiée (20)*. **Seule action bloquante du lot.**
2. ⚠️⚠️ **Le même patron de destruction, ailleurs.** Les trois écrivains de congés payés
   (`planning.js` l. 3610, 3788, 4761) et `_planApplySimple` (récup, chaleur) reconstruisent aussi
   l'entrée à neuf : un jour d'échange y perd drapeau et horaire. Effet moins grave (l'écart y reste
   neutre au lieu de devenir faux), **mais c'est le même défaut**. Remède propre : **un point de
   passage unique** « conserver la nature du jour », avec son harnais. Lot à part, pas un ajout.
3. ⚠️⚠️ **`new Date().toISOString().slice(0,10)` — 64 occurrences, « aujourd'hui » en UTC.**
   Entre minuit et 2 h du matin à Paris, elles rendent **la veille** : date de journal, date
   d'édition, comparaison « en cours », échéances. `_mvAujIso()` (la forme juste) existe dans
   `utils.js` depuis toujours et **n'est appelée qu'à 7 endroits**. Lot à part : mesurer d'abord
   lesquelles sont visibles du client, puis convertir — pas un chercher-remplacer.
4. ⚠️⚠️ **Les harnais ne tournent JAMAIS sur Windows côté Claude.** C26 couvre désormais le piège
   `import()`, mais pas les autres (séparateurs de chemin, CRLF, casse des noms de fichiers). ★ La
   seule parade réelle : **Nico lance `npm run check` avant que je déclare un lot vert**. Trois
   plantages Windows en trois lots livrés verts (§53, §55n) — **et un défaut de production que
   seul son fuseau révélait** (§55o). ★ Côté Claude, désormais : lancer aussi
   **`TZ=Europe/Paris npm run check`**, qui est le fuseau réel de tous les clients.
4. ⚠️⚠️ **Sortir un vrai PDF de la feuille d'heures et LE REGARDER.** 83 assertions tiennent les
   tailles, les graisses, les marges et les bornes — **aucune ne lit une mise en page** (§42h).
   C'est le point faible du paquet, avant tout envoi client.
4. ✅ **TRANCHÉ le 23/08 (§55m)** — `CONFIG.hsup_dues_debut` ne commande plus l'absence
   injustifiée : elle doit ses heures comme le retard, réglage ou pas. Le réglage ne borne plus que
   les motifs neutres. ⚠️ **À vérifier après déploiement** : sur les mois passés de MG et le second domaine,
   une injustifiée déjà enregistrée descend maintenant « reste à prendre ». C'est une correction,
   pas une régression — mais **regarder les compteurs avant de sortir une paie**.
5. **« ETP » subsiste à l'écran** (`pl2-mc-etp`) alors que le document imprimé dit désormais
   « Réalisation N % du prévu ». `s.etp` vaut `worked/ref` : un taux, pas un équivalent temps plein.
   Renommer partout = décision de vocabulaire.

### NOUVEAU AU BACKLOG (issu de §42)

- ⚠️ **Le doublon `_pilDiag` / `_pecZeros`.** Les deux portent un constat voisin sur « pas de taux
  horaire », à **deux endroits de la même page** : le bouton « à compléter » en tête de module, et la
  carte de fiabilité d'Économie. Ils ne disent pas tout à fait la même chose (`N fiches sans taux`
  contre `aucun taux nulle part`), mais le lecteur, lui, voit deux avertissements sur le même sujet.
  **C'est §34 en plus petit.** Fusion = chantier de moteur, pas d'ergonomie.
- **Les cartes sans ligne de cadre.** Toutes les cartes du Pilotage n'en ont pas encore une : celles
  qui ne passaient aucun sous-titre gardent un en-tête à deux étages. C'est visible, et c'est du
  travail d'écriture, pas de code.
- **Le `.pil-cr-note` masqué sur téléphone** : l'instruction « cliquez une campagne pour zoomer »
  disparaît sous 700 px. Un utilisateur qui n'a que son téléphone ne l'apprendra jamais.
  Piste : la dire une fois dans la fiche d'aide du module — ou une pastille « i » sur le fil.
- **Mesurer si les fiches « i » sont ouvertes.** Tout ce chantier parie qu'un vigneron touche la
  pastille quand il en a besoin. **Ce pari n'est pas vérifié.** Si personne ne l'ouvre jamais, c'est
  que le texte manque là où il était, pas qu'il était de trop.

### NOUVEAU AU BACKLOG (issu de §43)

- ⚠️⚠️ **UN RETARD D'UNE HEURE ET UNE ABSENCE D'UNE JOURNÉE S'AFFICHENT PAREIL.** `_pl2Cell` :
  `if(e&&e.absent) return {txt:'✕', cls:'pl2c-abs'}` — la croix rouge tombe **avant** toute lecture
  de `motif` et de `motif_h`. Or le motif `retard` porte `heures:true` : **la donnée est là,
  l'affichage l'écrase.** Trouvé à l'œil sur la démo, **mais c'est le produit** : chez MG et
  le second domaine, un retard saisi ressemble à une journée perdue sur le tableau. Piste : un glyphe
  distinct (⏰ + les heures) quand `motif_h > 0`, et la légende qui suit.
- **Le chrono tracteur n'est jamais visible en démo** (`CONFIG.chrono_mode` à 'off', aucune mesure
  ouverte). Soit on le sème pour en faire un moment — c'est l'argument de précision le plus fort
  du module — soit on l'assume hors parcours. Aujourd'hui : hors parcours.
- ⚠️⚠️⚠️ **NEUF HARNAIS SUR VINGT-SIX NE PROTÈGENT RIEN** — l'entrée disait « deux harnais périmés
  rougissent la CI ». **Les deux existent bien**, mais le constat était faux sur deux points, et
  incomplet sur le reste. Mesuré le 16/08, chaque script lancé un par un :
  · **Ni l'un ni l'autre n'est dans `ci.yml`.** Ils ne rougissent donc **rien du tout** — ils se
    taisent, ce qui est pire.
  · `harnais-bandeau-essai` : **2 rouges sur 15**, dont *« APP_VERSION délibérément inchangé
    (6.13) »* — il fige une version que le dépôt a dépassée de douze crans.
  · `harnais-cadence-escalier` : **1 rouge sur 28** — *« l'alerte >15 % ne crie plus au dérapage sur
    un chiffre d'histoire »*.
  · ★★★ **SIX SCRIPTS PORTENT `/home/claude/mavigne-dev/` EN DUR** : `harnais-bandeau-essai`,
    `harnais-cadence-escalier`, `harnais-claude-md`, `harnais-parcours-prospect`,
    `harnais-reconduction`, `harnais-vitrine`. **Ils ne peuvent démarrer que dans le bac à sable.**
    Chez Nico comme en CI, ils sortent en `ENOENT` — et un script qui ne démarre pas se lit comme un
    succès. **C'est l'entrée 0h (`lint-cliquet`), mais multipliée par six et jamais consignée.**
  · `harnais-vitrine` et `contre-epreuves` : `ENOENT` sur `logiciel-vigne.html` — chemin relatif au
    répertoire courant, pas au dépôt.
  · `harnais-essai-borne.cjs` : `Cannot find module 'firebase-admin'`.
  · `harnais-claude-md` : **1 rouge sur 23** — c'est ce document lui-même qui se déclare périmé.
  → **Correctif type, une ligne par script** : `new URL('../<chemin>', import.meta.url)` au lieu du
  chemin absolu, et `os.tmpdir()` pour les fichiers de contre-épreuve. Détail en **§44c**.

### ✅ L'OFFRE DE LANCEMENT EST BORNÉE (14/08)
**Réglé.** 15 jours, reconductibles une fois, puis lecture seule — cf. §14b et §40. C'était le point
bloquant du devis le prospect Gironde depuis trois sessions. **Reste à trancher : ce qui se passe après J30.**
L'hypothèse en vigueur — la lecture seule dure — n'a jamais été confirmée explicitement.

### ⚠️⚠️ NOUVEAU AU BACKLOG (issu de §43 — 15/08)

- ⚠️⚠️ **Vérifier la persistance cloud tenant par tenant** — le code est bon, l'existence des
  documents chez chaque client n'est pas prouvée. Procédure : **§43g**.
- ⚠️ **La marge en jours n'est surveillée par aucun test** — bloqué par l'export. **§43f**.
- ⚠️ **Aligner `npm run check` sur le workflow CI** — `mv-harnais-echelle.mjs` n'était lancé que par
  le CI : le rouge n'apparaissait qu'après le push (**§43i**). Vérifier qu'aucun autre harnais du
  workflow ne manque au `check` local.
- **Ajouter la vérification des six clés à la fin de toute mise en route** (§27f).
- **Clôture d'une saison très incomplète** — `Hiver 2025–2026` archivé à 32 %. Empêcher, ou
  signaler ?
- **Rejouer les 6 contre-épreuves de `cadAppl`** — écrites avant les gardes 2 et 3, la redondance
  a pu en rendre certaines aveugles (piège de **§43e**).

- ⚠️ **`trialExp` / `trial_until` peuvent diverger.** Trois chemins les écrivent ensemble
  (`_fcSaveAbo`, `agtInsTrialGo`, `gtRenewTrial`). Un quatrième qui l'oublierait ferait mentir la
  veille **en silence**. Piste : une assertion de cohérence dans `trialWatch`, qui alerte au lieu de
  se taire.
- **Durcir la lecture seule côté serveur** — `firestore.rules` ignore `trial`. Décision commerciale
  avant technique : est-ce un frein ou une serrure ?
- **Mesure d'audience** sur `essai.html` et la démo guidée.
- **Les trois nombres dupliqués** (§14b) — vivre avec, ou générer l'un depuis l'autre.

### ⚠️ Lots encore non documentés ici

Connus par le seul changelog de `sw.js`, **à consigner par Nico** :
- **06/08** : « panneau GUERETTECH : 8 onglets deviennent 6 » · « SEC-GT/2 » (code à usage unique).
- **05/08** : la tournée sur l'écran de l'équipe · l'exercice comptable · les 4 défauts de la
  snapshot localStorage · le Chai qui s'ouvrait vide.
- **09/08 matin** : le soutirage à source unique · le Cuvier repeint · le **hub Documents** ·
  la **charte `MV_DOC`**.

### ★★ Le fait commercial : le prospect Gironde

**Premier prospect arrivé hors réseau**, par le formulaire d'essai du site : **Lalande-de-Pomerol
(Gironde)** — ~45 ha en conventionnel, ~40 parcelles multi-communes, **12 permanents** + saisonniers,
6 machines, 4 cuvées. Profil **Domaine**, et le premier vrai test du travail multi-terroir (§30).

**Séquence de réponse préparée (dans l'ordre)** :
1. ⚠️ **Vérifier que `mise-en-route.html` est bien EN LIGNE** avant d'envoyer le lien — ★ et que la
   nouvelle version, celle qui **envoie**, est déployée (§18b).
2. Envoyer la réponse + le lien du formulaire (§27f).
3. Au retour : **enregistrer le slug `chateau-garraud` dans `_guerettech/tenants` AVANT
   `onboardTenant`** (§14) — ★ l'assistant le fait lui-même en première étape.
4. **DPA signé AVANT la création des 12 comptes salariés.**
5. Devis sur la **nouvelle grille** : Domaine = 990 € / 20 h incluses (−50 % lancement si l'offre est
   maintenue — **à borner**).
6. **Recalibrage du barème = partie du forfait** : densité girondine, jeu `gironde`, et les cinq
   questions du §30c — ★ **dont les réponses seront déjà dans son dossier** s'il a rempli le
   formulaire (§18b).
7. ★★ **Trois arguments neufs** : un château de 45 ha avec 4 cuvées a forcément plusieurs millésimes
   en cave (**la série MILLÉSIME lui parle directement**) ; **12 salariés à faire démarrer**, ce qui
   met l'accompagnement (§27) au cœur de la vente ; et ★ **son installation devrait coûter ~9 h au
   lieu de 28** compte tenu de sa taille — c'est ce qui rend le forfait tenable.
⚠️ **Détails à ne pas oublier pour ce client** : **volume de fût 225 L** · barème girondin ·
40 parcelles sur plusieurs communes · noms de parcelles probablement différents du fichier.

### Backlog — commercial & administratif

1. ★★★ **LE DEVIS GARRAUD** — la séquence complète est ci-dessus. ⚠️ **Il ne peut pas partir avant
   le point 2** : le devis chiffre une remise dont la durée n'est pas définie.
2. ⚠️⚠️ **BORNER L'OFFRE DE LANCEMENT** (durée jamais définie) — **bloquant pour le devis le prospect Gironde.**
   Une remise « −50 % » sans date de fin sur un document contractuel engage sans limite.
3. **Vérifier les empreintes de `_mv_signatures`** contre les archives du 31/07.
4. **Vérifier l'indexation dans Search Console.**
5. **LinkedIn posts #4 et suivants** — **douze angles prêts** (§27).
6. ★ **Trois questions à poser à le contact technique** : ses écartements commune par commune · le recours
   éventuel à un prestataire · **pourquoi Pliage, Palissage et Entreplantation sont absents de son
   barème** (75 h/ha, soit 1 350 h sur 18 ha, §30d).

### Backlog — technique, par ordre d'effort/effet

★★★ **AUDITÉ LIGNE PAR LIGNE LE 11/08 AU SOIR**, sur le dépôt cloné (commit `636630a`,
APP 5.96 · SW 6.46). **Chaque entrée porte sa preuve mesurée**, fichier et ligne, pas un souvenir.
**Six points rayés · cinq chiffres corrigés · trois qui avaient EMPIRÉ.**

⚠️⚠️ **La leçon de cet audit : un backlog non audité dérive DANS LES DEUX SENS.** Six entrées
décrivaient du travail déjà fait — le document faisait travailler dans le vide. Et trois chiffres
avaient grossi sans que personne le voie : **1 625 → 1 639 sites sous 12 px**, **~2 300 → 2 922
hex**, **~375 → 407 ko pour `cave.js`**. Un backlog écrit une fois est une photo ; **une entrée
non re-mesurée depuis une semaine est une hypothèse, pas un constat.** C'est la règle d'or n°1
appliquée au document lui-même.

★ **AJOUT DU 12/08 — les entrées 0a à 0d sortent du chantier ETP/année/contrats (§33).** Elles
sont neuves, donc **non auditées** : les traiter comme des hypothèses jusqu'à re-mesure.

0a. ✅ ~~**DÉPLOYER — APP 6.06 · SW 6.56**~~ — **RAYÉ LE 16/08, ET C'EST LE PLUS GROS DÉFAUT
   D'ENTRETIEN DE CE DOCUMENT À CE JOUR.** L'entrée est restée en tête de backlog, trois étoiles,
   pendant **dix-neuf versions APP et vingt-trois versions SW**. Le dépôt lu le 16/08 porte tout
   §37, §38, §40, §41, §42 et §43 par-dessus : le paquet décrit ici comme « jamais mis en ligne »
   a été déployé, puis recouvert six fois.
   ★★★ **La leçon est de méthode** : *une entrée « À DÉPLOYER » est la seule du backlog qui se
   périme toute seule.* Elle ne demande pas de travail, elle demande une lecture — et tant qu'on ne
   la relit pas, elle occupe la première place en criant sur un fait faux.
   → **Règle** : toute entrée « à déployer » se relit **en tête de session**, en comparant les
   numéros qu'elle cite à `APP_VERSION` et `CACHE_NAME`. Si elle cite plus bas, elle part.
   Détail en **§44a**.
   ⚠️ **Ce qui reste vrai et qu'il ne faut pas jeter avec** : `npm run build && firebase deploy` —
   ⚠️ **un seul `&&`** : `inject-precache` tourne déjà en postbuild, un second passage sort en 1
   et annule le déploiement. Tant que ce n'est pas fait, les clients lisent encore
   « manque 15,8 ETP » sur une vendange couverte, et **une augmentation de salaire continue de
   rechiffrer les exercices clos**.
   ⚠️⚠️ **`scripts/preflight-baseline.json` fait partie de la livraison du 12/08 nuit** : la
   baseline a été **regravée** sur une diminution réelle (un `catch{}` vide parti avec
   `_paieHistTxt`). Sans elle, le prochain preflight avertit sans raison — et un avertissement
   qu'on apprend à ignorer est un cliquet mort.
0a-ter. ★★★ **COMPTER LES ETP BUREAU — orientation produit, 14/08.** Nico :
   *« je veux compter aussi les ETP bureaux pour pouvoir budgéter au plus près de la réalité (on
   fera ça sur une prochaine mise à jour) »*. ⚠️ **Ce n'est pas un simple retrait du filtre** :
   `m.bureau` est lu à des endroits qui ne posent pas la même question.
   · **La capacité vignes** (`_headWeek`, courbe d'effectif, simulateur de renfort) doit **rester**
     hors bureau — c'est le sens même du champ, *« non compté dans la capacité de travail des
     vignes »*, et un administratif dans la courbe de taille ferait croire un pic couvert.
   · **Le budget** (masse salariale, coût employeur, ETP payés) doit **les inclure** — un salaire
     est un salaire. **Voir 0a-quater : c'est déjà censé être le cas, et ça ne l'est pas.**
   → Le travail réel est de **séparer les deux questions** : « qui travaille la vigne ? » et
   « qui coûte ? ». Aujourd'hui `_mvEnContratSurPeriode` répond aux deux avec le même filtre.
0a-quater. ★★★ **DÉFAUT MESURÉ LE 14/08 — la masse salariale perd tous les bureaux.**
   `_pexData` (pilotage.js l.6971) filtre avec `_mvEnContratSurPeriode`, dont **la toute première
   ligne** est `if(!m || m.bureau) return false;`. Or le commentaire posé trois lignes au-dessus
   dit : *« Le "bureau" N'EST PAS exclu : c'est un salaire, et on chiffre une masse salariale. »*
   ⚠️⚠️ **Le commentaire décrit l'intention, la ligne fait le contraire.** Sur le tenant de
   référence, Etienne et Chloé sont bureau : leurs salaires **ne figurent pas** dans le total de
   l'exercice. Correctif = un 4ᵉ argument `avecBureau` sur `_mvEnContratSurPeriode`, passé `true`
   **au seul appelant l.6971** — les trois autres (coût MO par parcelle l.5564, cadence l.6064,
   effectif présent planning.js l.881) posent bien la question « qui travaille la vigne ».
   **NON LIVRÉ** : ça change un chiffre d'argent, et Nico a explicitement mis le sujet bureau à la
   *prochaine mise à jour*. À faire au même lot que 0a-ter. Détail en **§39i**.
0b. ✅ **Le CDD de Victor est RESSAISI** (confirmé par Nico le 12/08 au soir).
   ⚠️ **Le même geste reste à faire pour Shana, Alicia et Vic** dès leur resignature (annoncée au
   17/08) : mettre les anciennes dates dans la fiche, enregistrer, puis remettre la nouvelle date de
   début → l'archivage se déclenche seul.
0c. ❌ **ENTRÉE ANNULÉE — c'était un mauvais conseil.** Elle demandait de régler l'ouverture
   d'exercice au 1ᵉʳ octobre « pour que la vendange clôture l'année ». ⚠️⚠️ **Un exercice comptable
   est fixé par le comptable, parfois par le statut : ce n'est pas un réglage d'affichage.**
   La vraie correction est livrée au **lot 6 du §34** : l'écran montre désormais les **deux cadres**
   (exercice comptable / année vigne), dit **pourquoi leurs totaux diffèrent**, et se contente de
   chiffrer — **en jours exacts** — le partage de la vendange quand la clôture la traverse.
   Le décalage reste **proposé**, jamais prescrit. **Ne pas rouvrir cette entrée.**
0c-bis. ★★ **Les filtres cépage / commune du Pilotage** — démontrés dans la maquette v3, **non
   livrés volontairement** (§34i). Ils exigent que le calcul de charge descende à la parcelle.
   ⚠️ **Un filtre qui change la liste sans changer les chiffres est un décor.** Les données existent
   déjà : `p.cepages[]` et `p.commune`. Aucune saisie neuve à demander au client.
0c-ter. ✅ ~~**Déplacer `_PIL_SEM` dans `utils.js`**~~ — **FAIT, vérifié le 16/08.**
   `utils.js:1968` la définit, `utils.js:2345` l'expose, `pilotage.js:15` l'importe, et
   `pilotage.js:9650` porte le commentaire *« n'est plus exposé ici »*.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-frise` cherche encore la palette dans
   `pilotage.js` — **il rougit sur trois assertions à cause de ce déplacement réussi** (§44c).

0d. ★★ **Le pont coût annuel ↔ campagnes** — le gros morceau ouvert par Nico le 12/08, détaillé en
   fin de §33. Coût annuel **par date**, part d'une campagne **par tâche**, et le **reste**
   (vinification, entretien, temps mort) qui n'est lisible **qu'avec un taux de saisie**.
   ⚠️ Le journal ne stocke **pas d'heures** : le croisement passe par les heures payées du jour.
0f. ★ **Resserrer la fin de la période *Vendanges*** — elle court au 30/09 alors que le travail
   s'arrête le 06/09. Le pic n'est plus faussé, mais la moyenne « sur la période » reste diluée
   sur trois semaines vides.
0g. ★★★ **`taux_serie` est clé par NOM** — ouvert par §36, **volontairement non fermé**. Renommer un
   salarié dans sa fiche **détache son historique de salaire**. C'est la faiblesse de tout le modèle
   (`MEMBRES`, `PLANNING_ENTRIES`, `taux`, `_mvPoidsNom` — tous clés par nom), mais **ici elle
   chiffre des euros dans un exercice comptable**. ⚠️ **Ne pas bricoler un rattrapage local dans
   `paie`** : ça donnerait un identifiant stable à un seul endroit et une fausse impression de
   sécurité partout ailleurs. Le vrai lot est *un identifiant de fiche membre*, et il touche bien
   plus que la paie. **Chantier à part entière, à chiffrer avant d'être promis.**
0h. ✅ **RAYÉ LE 29/09 — `lint-cliquet.mjs` démarre et passe** (« Aucune erreur nouvelle », joué par `npm run check`). Historique :
   ~~**`scripts/lint-cliquet.mjs` PLANTE**~~ en `MODULE_NOT_FOUND` (constaté le 12/08 au soir en
   l'exécutant, pas en le supposant). **Préexistant**, mais ⚠️ *un linter qui ne démarre pas ne
   protège rien* — et il fait partie des paliers de test (§6b), donc son silence se lit comme un
   succès. Le réparer ou le retirer des paliers : les deux valent mieux que le laisser mort.

1. ★★★ **INSTALLATION À BLANC de bout en bout sur un slug JETABLE — LE SEUL CRITIQUE OUVERT.**
   Elle valide les cinq lots d'un coup et **mesure les temps réels** (tableau prévu dans
   `INSTALLER-UN-DOMAINE.md`). Les lots sont déployés ; **le « 20 h → ~9 h » n'a jamais été vérifié.**
   ⚠️ **Un essai consomme un identifiant** : `onboardTenant` refuse un domaine déjà peuplé. Prendre
   un nom jetable, **jamais `chateau-garraud`**.
4. ✅ ~~**Corriger `_findDebutTache`**~~ — **RAYÉ, vérifié le 16/08.** La fonction est passée en
   `app.js:3572` et **porte désormais ses bornes** : elle résout la période par `_saisonForDate`,
   retombe sur `_mvCampagneDe`, et en dernier recours sur le jour même. Le `reduce` ne s'applique
   plus qu'à `ok`, filtré par `dans(j.date)`. ⚠️ **L'entrée citait `app.js:3116` — un numéro de
   ligne de backlog vieillit encore plus vite qu'un chiffre** (§44b).
6. ★ **Découper `demarrage.html`** sur le modèle du guide — **938 lignes, monolithique** (§27d).
   ✅ La section **Données** est faite : `guide/13-donnees.html` existe (7,5 ko).
8. ✅ ~~**Purger le calcul de pic mort dans `_rfCtx`**~~ — **FAIT, vérifié le 16/08.**
   `pilotage.js:3193` porte le commentaire de purge : *« `pic` était calculé ici et renvoyé dans le
   contexte […] après vérification (`grep '.pic'` = 0 consommateur) »*. ⚠️ **Ne pas confondre avec
   les `pic` VIVANTS** : `_rfWeeks` (l.1387) et `_pilAnnuCtx` (l.8764) en renvoient un, consommé
   l.1841 et l.4427 — ceux-là sont utiles.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-portee` exige encore *« le pic est calculé »*
   et **rougit sur quatre assertions à cause de cette purge réussie** (§44c).
10. ★ **Chip de cuvée `Village 2026· 12`, sans espace avant le point médian.** ⚠️ **Non retrouvé au
    grep le 11/08** — soit corrigé entre-temps, soit le motif de recherche est mauvais.
    **Varier le motif avant de conclure** (règle vécue avec `mvprint.py` et DOCK).
11. ★★ **Import KML en MERGE** sur un domaine vivant — `_parseKML` est en `admin-gt.js:2298`,
    **aucun mode merge**. Avec les **coordonnées écrites dans les parcelles** et **la densité comme
    propriété de la parcelle**. ⚠️ Préserver `p.commune`, `p.plantation_trous`, `p.entreplantation`,
    `p.tachesAll`, `p.rendement_hist`, `p.rdt_max`.
12. ★★ **Le rattachement des anciens fûts à une référence** — maquetté et validé, **non intégré** :
    0 trace dans `reserve.js`.
13. ❌ **ENTRÉE PÉRIMÉE, RÉÉCRITE LE 16/08.** Elle disait « un 14ᵉ moment », après avoir corrigé
    « 15ᵉ » en « 13 ». **La visite en compte DIX-NEUF** depuis §43 (`harnais-demo` : *« 19 moments »*).
    ★★ **Trois chiffres successifs dans la même entrée, tous faux au moment où on la lit** : c'est le
    symptôme, pas l'exception. Ce qui reste vrai : **la cave n'a toujours pas son moment**, et c'est
    le plus vendeur du parcours. **Renuméroter n'est pas le travail — l'ajouter l'est.**
14. ★ **Le Cuvier n'enregistre pas d'intervenant** là où le Chai le fait — **`cave.js:6290` le dit
    à l'écran** (« la colonne reste vide pour celles-ci »). Le défaut est assumé, pas corrigé.
17. **Terminologie heures sup** : « Solde cumulé » (`planning.js:2319`) vs « Reste à prendre »
    (`l.4322`) — **les deux libellés coexistent, vérifié**.
17b. ★ **Le nom d'un salarié, dans la grille, coche sa ligne** et n'ouvre plus sa fiche (§19a).
    Décision assumée — une cible, un effet — mais **à confirmer à l'usage** : c'est le seul point de
    dépaysement de la refonte, et il est réversible en une ligne.
18. **Batch a11y** · résorption des `catch{}` vides — ⚠️ **RE-MESURÉ LE 16/08 : 193, pas 200.**
    **135 sont dans `app.js` à eux seuls** (puis `pilotage.js` 15, `onboarding.js` et
    `tracteur.js` 4, `cave.js` 3). ★ **C'est la seule ligne du backlog qui a BAISSÉ deux audits de
    suite** — 234 → 200 → 193. Le cliquet C14 travaille.
    **La baisse est réelle** (C14 fait son travail) : le cliquet interdit d'en ajouter, il ne purge
    pas l'existant. **Un lot ciblé `app.js` réglerait les trois quarts du sujet.**
    ★ **Re-mesuré le 02/10 (audit) : 17 vides** (pilotage 10). Les autres sont passés en `_mvAvale` (§132) — vides devenus
    traçables, pas résolus. Depuis AVALE-2 (§212), une répétition remonte à l'Admin GT : **le tri par emplacement peut
    désormais se faire sur les `warning` « ×10 » du journal**, pas sur un avis.
19. **Rôle `pilotage` (`pil:true`)** — **0 occurrence, vérifié.** 2 arbitrages préalables.
    Corriger aussi `getLoginRoster` (`functions/claims.js:1360`, renvoie toujours `roles`).
20. **Injection de données pures dans les guides.**
21. **Lot B pluie** — ⚠️ **à re-qualifier : la collecte horaire EXISTE DÉJÀ.** `app.js:3061` remplit
    `window.METEO_HOURLY` avec `precipitation` heure par heure et le met en cache
    (`mavigne_meteohr_cache`). **Ce qui manque n'est pas la donnée, c'est son exploitation.**
    L'historique reste irrécupérable rétroactivement.
22. **DRY surface** — ⚠️ **21 sommes à la main au 16/08** (22 au 11/08, 32 à l'origine).
24. ✅ ~~**Fusion de fûts à l'ÉDITION**~~ — **FAIT, vérifié le 16/08.** `_futSameLot(x, four, ref,
    annee)` compare fournisseur + référence + millésime en tolérant casse et espaces ; `_rsvSaveFut`
    cherche le doublon et fait `dup.qte = (parseInt(dup.qte)||0) + qte` au lieu de pousser une
    seconde carte. ⚠️ **Le commentaire que l'entrée citait est TOUJOURS LÀ** — il décrit désormais
    l'intention du code au-dessous, plus un manque. ★★ **Piège de méthode** : *un commentaire qui
    décrit un défaut ne disparaît pas quand le défaut est corrigé.* Ne jamais conclure à l'absence
    en lisant un commentaire ; lire la fonction (règle vécue avec `mvprint.py` et DOCK).
27. ★ **Variantes girondines** — le barème régional **existe** et `app.js:1062` nomme déjà le Médoc,
    le guyot double et les vignes de plus de 20 ans. **Reste la vérification documentaire :
    qu'aucun avenant postérieur à 2021 n'a révisé ces temps** (§30a).
28. ★ **Type de contrat « tâcheron »** (§30f) — **0 occurrence, vérifié.** À prévoir, pas urgent.
29. **Tokeniser les hex des JS** — ⚠️⚠️ **RE-MESURÉ LE 16/08 : 3 319.** ~2 300 → 2 922 → **3 319**,
    soit **+14 % en cinq jours** et +44 % depuis l'origine. **Il grossit à chaque lot** : le classer
    bas ne le fait pas rétrécir, ça ne fait que rendre le lot plus cher quand il arrivera.
30. **Mise à jour SW choisie — niveau 1** (§8). Le socle est là : `updatefound` (`app.js:9083`)
    et `SKIP_WAITING` (`sw.js:1047`).
31. **Lot 8 différé** (Google Play TWA) — jusqu'à **5+ clients actifs**.
32. **Une passe Lighthouse sur `staging`.**
33. ★ **Thème saisonnier** — étude faite, maquette 4 saisons à produire, **décision de Nico** (§21d).
34. ⚠️⚠️ **Surveiller la taille des gros modules** — **RE-MESURÉ LE 16/08, et ce n'est plus
    `cave.js` le sujet** :

    | Fichier | 11/08 | 16/08 | |
    |---|---|---|---|
    | `pilotage.js` | 461 ko | **657 ko** | **+42 % en cinq jours** |
    | `app.js` | 633 ko | 667 ko | +5 % |
    | `cave.js` | 407 ko | 456 ko | +12 % |

    ★★★ **`pilotage.js` a pris 196 ko** — c'est §42 (dix lots d'ergonomie) qui les a posés, et
    personne ne l'a vu passer. **Il est désormais le deuxième fichier de l'app.**
    ⚠️ **La surveillance sans seuil ne surveille rien** : trois audits de suite ont écrit « à
    surveiller » et le chiffre a monté trois fois. → **Poser un plafond dans le preflight** (700 ko ?)
    ou **retirer l'entrée** — les deux valent mieux qu'une veille qui ne déclenche jamais.
36. ★★★ **L'ÉCHELLE TYPOGRAPHIQUE — le plus gros effet client du backlog** (audit du 11/08,
    re-mesuré le 16/08).
    ⚠️ **1 593 sites sous 12 px** (153 dans `index.html` + 419 dans `styles.css` + **1 021 dans les
    JS**) et ⚠️⚠️ **295 sites sous 10 px**. Suite complète : 1 625 → 1 639 → **1 593** sous 12 px,
    mais 257 → 277 → **295** sous 10 px.
    ★★★ **Lire les deux ensemble** : le total baisse pendant que **le plancher s'enfonce**. §42 a
    unifié la typographie du Pilotage sur `--pt-*` — ce qui explique la baisse — mais l'échelle
    posée dans `styles.css` **descend elle-même à `--pt-nano:9.5px` et `--pt-lbl:10.5px`**. La
    variable a rendu le 9,5 px *légitime et réutilisable*. **On a industrialisé le trop petit.**
    → **Le lot A n'est plus un remplacement de valeurs en dur : c'est un relèvement de l'échelle
    elle-même**, `--pt-nano` et `--pt-lbl` en tête. Deux lignes touchent alors 1 021 sites JS.
    ★★ **La vraie surprise est la répartition** : les deux tiers sont **dans les JS**, en HTML
    généré — un lot qui ne toucherait que `styles.css` ne réglerait qu'un quart du problème.
    **Lot A : FAIT par les jetons (§247, 05/10 — choix de Nico sur maquette).** Il reste les tailles écrites en dur sous 12 px.
    ⚠️ **Pas une substitution aveugle** : certains 9 px sont des exposants ou des unités collées à
    un chiffre. **Maquette sur trois écrans d'abord** — accueil ouvrier, session tracteur, registre
    phyto — puis intégration au tableau motif → compte attendu.
    **Lot B : le réglage « Taille du texte ».** Les sites de 10 à 11,5 px convertis en variables
    CSS pilotées par un attribut `data-fs` sur `#app-root`, **jumeau exact de `data-hicontrast`**.
    Trois crans : Normal · Grand · Très grand, dans Réglages › Moilication, sous « Plein soleil ».
    ⚠️ **Ne PAS passer par un `zoom` CSS global** (qui serait une ligne) : il agrandirait aussi la
    carte Leaflet, les overlays `position:fixed` et la largeur du corps bornée à 430 px — le risque
    porterait sur l'écran le plus utilisé.
37. ★★ **`mvDate()` et `mvNum()` dans `utils.js`** — **0 occurrence, vérifié.**
    `mvDate(iso, forme)` : `'jma'` dans les documents et registres (traçabilité), `'court'` dans les
    listes denses, `'long'` dans les titres, **jamais `'court'` là où l'année est ambiguë** (défaut
    actuel de `_vendFrDate`). `mvNum(v, unité)` : décimales imposées par l'unité.
    **Décision de forme AVANT le code.** Supprimer les 2 paires de doublons littéraux.
38. ★ **Purger le bloc de ré-export de `app.js`** — **314 `window.X` comptés**, du
    `window._mvKeyLoaded` de la ligne 51 au `window.exportSaisonPDF` de la ligne 10536.
    111 lignes inutiles + 5 noms morts. **Unifier `phyto.js` sur la même forme et supprimer sa
    boucle `for..in` (`phyto.js:1165`)**, invisible au preflight. Regraver la baseline **après**
    avoir prouvé la baisse.
39. ★ **`.val-toggle` 26 → 44 px de haut** — **vérifié `styles.css:283` : toujours 26 px** (pour
    44 de large). C'est l'interrupteur qu'un ouvrier bascule par équipier, avec des gants.
    **`.fiche-admin-btn` est à 32 px** (`l.483`) ; vérifier aussi `.pc-start` et `.plan-mo-btn`.
40. ★★ **Valeurs par défaut de modules PAR RÔLE à la création d'un membre** : un ouvrier arrive avec
    Cave / Réserve / Planning décochées, un tractoriste avec Vigne / Tracteur / Phyto. **Vérifié :
    `_canModule` (`app.js:3860`, socle en `admin-gt.js:2664`) = formule ∧ masquage manuel, le rôle
    n'entre nulle part.**
    ⚠️ **Gain direct sur le prospect Gironde : 12 personnes × 7 arbitrages.** À faire **avant** l'installation.
42. ⚠️⚠️ **Points de rupture responsive — QUATORZE, pas neuf** (re-compté le 16/08, `@media` de
    `styles.css` **ET** des JS) : **360, 400, 430, 520, 560, 600, 640, 700, 767.98, 768, 880, 900,
    980, 1200.** Le `760` est devenu `767.98` (entrée 5, ✅).
    ★★★ **Voilà pourquoi les audits précédents disaient neuf** : ils comptaient `styles.css`.
    **Cinq points de rupture — 360, 430, 520, 700, 880 — vivent dans du CSS injecté depuis le JS**,
    posés par §42 et invisibles à tout `grep` sur la feuille de style.
    ⚠️ **C'est le vrai sujet, et il est plus gros que l'entrée ne le disait** : la moitié des règles
    responsive a quitté la feuille de style. Les ramener à trois suppose d'abord de savoir où elles
    sont — et **le preflight ne le sait pas non plus**. **Après** le lot typographique, pas avant.
43. ⚠️ **Registre d'entrées-sorties et DRM — un chantier à part, PAS MAINTENANT** (décision de Nico, 04/10 : *« je ne veux pas de
    réglementaire […] je reste pour l'instant sur une application à but indicatif »*). **Vérifié : 0 occurrence** de `DRM`, `douane`,
    `DGDDI` dans `src/` et `index.html` ; le registre l'écrit (« Ma Vigne prépare, l'exploitant déclare », `cave.js`). ⚠️⚠️ **Tant que
    cette entrée est ouverte, aucun lot Cave n'ajoute de déclaration, de plafond ni de contrôle de conformité.** ★ Le jour où le chantier
    s'ouvre, il rouvre le **stock de bouteilles** (abandonné, cf. « Rayés ») : une comptabilité matières suit aussi le vin en bouteille.
44. ✅ ~~**Le coéquipier dans une session tracteur**~~ — FAIT par COEQ-1 (§343, 16/10) : choisi avec l’activité, réglage « Se fait à deux ».

### Backlog juridique & contenu public

- Durées de conservation · sous-traitants à publier (Google Ireland + SMTP) · relecture juriste.
- **Relecture trimestrielle des pages publiques** :
  `grep -i "compléter\|à valider\|à arbitrer\|en cours de\|\[.*\]"` sur `public/*.html` **et
  `guide/*.html`**.
  ★★ **Étendre ce contrôle aux ÉCRANS DE L'APP** : l'onglet Cave du Pilotage a affiché « module à
  venir » à un client payant pendant des semaines.
  **Grepper aussi `à venir|à structurer|à construire|chantier prévu` dans `src/*.js`.**
  ★ Contrôle fait le 09/08 : les occurrences restantes sont toutes **légitimes**.
- Les deux gabarits restants de `dpa.html`.
- ★ **Écrire dans le guide et les CGU que Ma Vigne produit un RELEVÉ D'HEURES, pas un bulletin de
  paie.** ★ **C'est déjà dit dans la fiche d'aide Planning** — reste à le porter dans les documents
  contractuels.
- ★★ **La même borne pour les documents de cave** : le registre des manipulations et le bilan de
  campagne sont des **états internes**. C'est écrit **dans les documents eux-mêmes**.

---

