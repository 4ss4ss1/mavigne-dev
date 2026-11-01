# La console GUERETTECH — audit du 1er novembre 2026

> Base `4d25f83` (« pheno1c »), APP 10.57, SW 11.38. À ranger dans `docs/maquettes/` avec `maquette-console-gt-v1.html`, au premier lot du chantier (comme COMPT-1 l’a fait pour le compteur).
> Lu : `src/admin-gt.js` (6 135 lignes, 310 fonctions), `src/gt/console.html`, `src/gt/connexion.html`, `scripts/mv-gt-page.mjs`, les fonctions de `src/firebase.js` et de `src/utils.js` que la console appelle, le bloc `_guerettech` de `firestore.rules`, et `gtDeleteTenant`, `checkTrialToken`, `appendAccessLog` dans `functions/claims.js`.
> **Rien n’a tourné contre la vraie base** : chaque défaut est lu dans le code, avec sa ligne. Ce qui reste à voir à l’écran est dit à la fin (§10).
> **Relu le 01/11 sur `2fc0168` (« pheno1d »)**, à la demande de Nico : `admin-gt.js`, `firebase.js` et `claims.js` n’ont pas bougé, les numéros de ligne tiennent. La relecture a corrigé un compte (cinq P1, pas sept, viennent de la cause commune) et trouvé trois écritures de plus du même motif, rangées dans GT-B02 et GT-B06.

**La demande de Nico (01/11)** : « de même que le reste de l’application », passer la console GT au niveau d’un logiciel pro — tout rangé, ergonomique, classé (par priorité, par date, par client, par tout), avec le relevé de ses manques et de ses bugs, classés par priorité.

---

## 1. En une page

- **10 défauts P1** (perte de données, sécurité, argent), **10 P2** (chiffre faux, fonction qui ment), **6 P3** (gêne), et la dette P4 (l’aspect « logiciel pro »).
- **Le défaut de fond** : la console réécrit des documents entiers à partir d’une copie lue plus tôt, ou d’une lecture ratée prise pour une liste vide. **Cinq des dix P1 en viennent** (B01, B02, B03, B06, B07). La console écrit aussi en contournant les gardes anti-perte de l’appli (`fbAdminWrite` n’a aucun plancher).
- **L’argent** : l’encaissé est compté à la date de facture, et une relance réclame le montant brut, avoir oublié (990 € au lieu de 495 € dans le cas de l’offre de lancement).
- **Ce qui manque pour un logiciel pro** : trier, chercher, donner une priorité et un statut à un bug, savoir de quelle version vient une erreur, voir l’état des sauvegardes et des versions, ouvrir un lien direct vers un incident.
- **L’ordre proposé** (§9) : sécuriser les écritures d’abord (GTFIX-1 à 3), puis le suivi des incidents (GT-SUIVI-1), puis la nouvelle console dessinée dans la maquette (GT-UI-1 à 6).

---

## 2. Ce qu’est la console aujourd’hui

**La page** : `gt.html`, fabriquée par `scripts/mv-gt-page.mjs` à partir d’`index.html` (GT-1, §249). L’appli des clients ne charge plus `admin-gt.js`.

| Onglet | Ce qu’il contient |
|---|---|
| **Radar** (accueil) | 4 chiffres (abonnés et revenu mensuel, à encaisser, incidents ouverts, demandes du site) ; la liste « À traiter » (erreurs critiques, signalements, factures, essais, leads, silences de plus de 14 jours) ; la carte de la démo publique |
| **Clients** | une carte dépliable par domaine : connexions par membre, facturation, incidents, accès GT, appareils, puis 9 boutons (Fiche client, Préparer, Accéder, Invitation, Journal, Parcelles, Config, Membres, Erreurs) et la suppression |
| **Business** | 4 chiffres, « À traiter », 3 courbes, une carte par client avec ses lignes de facture et un formulaire de saisie, le tarif remisé, l’export CSV |
| **Incidents** | deux vues : les erreurs groupées par empreinte (4 rangées de filtres, la santé de la remontée par domaine), et les signalements |
| **Leads** | les demandes du site, filtre « À traiter / Installés / Tout », 5 statuts, une note, le mail de réponse |
| **Outils** | catalogue E-Phy, import KML, journal d’accès, démo et codes d’essai |

**Les fenêtres** : la fiche client (7 sections éditables : Domaine, Parcelles, Membres, Tâches, Tracteurs, Saisons, Abonnement), l’assistant d’installation, la création de l’équipe en lot, et 9 fenêtres plein écran construites à la main (`agt-fiche-ov`, `agt-panel-overlay`, `agt-prc-overlay`, `agt-mbr-overlay`, `agt-deltenant-overlay`, `agt-fcdel-ov`, `agt-fcguard-ov`, `agt-prep-ov`, `agt-ins-ov`). Aucune ne passe par `openOv`.

**Les données** : `_guerettech/tenants` (public : slugs et statuts), `_guerettech/clients` (formule, essai, statut), `_guerettech/billing` (factures, remises, interne), `_guerettech/leads_status`, `_guerettech/access_log`, `_guerettech/demo_tokens`, `_guerettech/support_reports`, la collection `leads`, et dans chaque domaine `config`, `membres`, `parcelles`, `error_log`, `support_reports`, `saisons`, `appareils`.

**Les mesures** :

| Mesure | Valeur |
|---|---|
| Choix de tri offerts à l’écran | **0** (les ordres sont figés dans le code) |
| Champs de recherche | **0** |
| Lectures au chargement | **7 par domaine, l’une après l’autre**, plus 8 lectures GT et 1 appel serveur |
| Styles écrits dans le code | **753** |
| Couleurs écrites en dur | **522** hexadécimales + **840** `rgba` |
| Tailles de texte en pixels | **105**, dont **65 sous 11 px** (le plancher de l’appli depuis LISIBLE-1 : 11 px, 12 au téléphone) |
| Attributs d’accessibilité (`aria-`, `role=`) | **0** |
| Thème | **sombre seulement** (`.agt-hdr{background:#1A1428}`, `.agt-body{background:#0A0810}`), hors de la charte |
| Mise en page sur PC | celle du téléphone, étirée (`.agt-body` sans largeur maximale) |

---

## 3. Comment les priorités sont données

| Priorité | Ce que ça veut dire | Exemple |
|---|---|---|
| **P1** | perte de données, faille de sécurité, argent faux | une écriture qui efface la liste des clients |
| **P2** | un chiffre faux ou une fonction qui ment, sans perte | « Abonné » affiché pour un domaine de test |
| **P3** | une gêne, une incohérence d’affichage | un compteur qui ne se remet pas à jour |
| **P4** | finition et dette : ce qui fait « fait-maison » | 753 styles écrits à la main |

Chaque défaut porte un numéro **GT-B01…** pour être repris dans un lot.

---

## 4. Le relevé des bugs

### P1 — à corriger d’abord

**GT-B01 — Le registre des clients peut s’effacer sur une lecture ratée.**
*Effet* : tous les clients sauf un disparaissent de la console, avec leur formule, leur essai et leur statut.
*Cause* : `fbAdminReadGT` (firebase.js l.2984) rend `null` sur n’importe quelle erreur. Quatre gestes prennent ce `null` pour une liste vide, puis réécrivent le registre :
- `saveAddTenant` (l.1493) et `agtInsGo` (l.4614) repartent de `['marchand-grillot']` ;
- `agtInsTrialGo` (l.4761) et `_fcSaveAbo` (l.3458) repartent de `{}`, et `_agtWriteClients` (l.66) écrit alors `slugs: []` ;
- `_agtReadClients` (l.53) rend `{}` si la lecture échoue : `_guerettech/clients` est réécrit avec un seul domaine.
*Quand* : réseau instable au moment d’ajouter un client, d’installer un domaine ou de démarrer un essai. Hors ligne, l’écriture attend le retour du réseau, puis part.
*Correction* : une écriture GT relit au moment d’écrire, dans une transaction, et n’écrit jamais après une lecture ratée (§7, R1).

**GT-B02 — L’équipe, la config ou les parcelles d’un domaine peuvent être réécrites après une lecture ratée.**
*Effet* : ajouter un membre peut effacer tous les autres ; enregistrer le nom ou les coordonnées d’un domaine peut effacer toute sa config ; importer des contours avec « créer les fiches » peut remplacer toutes ses parcelles par les seules fiches neuves.
*Cause* : le motif de GT-B01, côté domaine. `agtSaveAddMembre` (l.1697) lit l’équipe avec `|| []` ; `agtSaveConfig` (l.2201) et `_fcSaveDom` (l.3437) lisent la config avec `|| {}` ; `agtKmlSave` relit bien contours et fiches (l.2836-2839), mais un échec y vaut `[]` — « compléter » devient « remplacer ». Et `agtLotGo` (l.1948) ajoute l’équipe en lot à la copie lue à l’ouverture de l’écran.
*Trouvé à la relecture du 01/11* : la config, le KML et le lot.
*Correction* : R1 — transaction ; pour le KML (deux documents), relecture au serveur qui arrête tout si elle échoue.

**GT-B03 — La fiche client écrase ce que le client a saisi entre-temps.**
*Effet* : une parcelle, un membre, une tâche, un tracteur ou une saison ajoutés par le client pendant que la fiche est ouverte disparaissent à l’enregistrement.
*Cause* : `_fcSave` (l.3419) réenregistre la copie lue à l’ouverture (`_fcLoad`, l.3488), document entier, sans relire. La garde des 25 % n’arrête que les grosses chutes.
*Correction* : R2 — les données du domaine ne s’éditent plus dans la console (décision D1).

**GT-B04 — La fiche client renomme sans suivre la règle de renommage.**
*Effet* : une parcelle renommée dans la fiche perd son contour sur la carte et son historique : registre phyto, sessions du tracteur, cave, fertilisation, tournées. Même chose pour une tâche ou un salarié.
*Cause* : les champs « Nom » de la fiche (l.3047, 3081, 3099) ne changent que le nom dans la liste. Le vrai renommage (`_renameParcelle`, reglages.js l.1976, et `_mvAppliquerRenommages` l.1914) réécrit neuf registres et pose une règle du domaine (`renommages_parcelles`, IDS-1 lot 4, §254).
*Correction* : R2. Renommer reste un geste de la roue crantée du module, dans la préparation.

**GT-B05 — Le verrou d’inactivité passe sous les fenêtres ouvertes.**
*Effet* : au bout de 15 minutes sans geste, si la fiche client, l’équipe, le journal, les erreurs ou la préparation sont ouverts, ils restent visibles et utilisables au-dessus du verrou.
*Cause* : le verrou (`#agt-lock`, `src/gt/console.html`) est au plan 9500 ; les fenêtres sont posées sur la page aux plans 9999 à 10001 (par exemple `agt-fiche-ov`, l.3523). Le commentaire du verrou dit qu’il doit rester « au-dessus de TOUT ». Aucun conteneur parent ne change l’ordre (vérifié dans la feuille).
*Correction* : le verrou au-dessus de tout, et le reste de la page rendu inerte pendant le verrou.

**GT-B06 — Le journal d’accès perd des lignes, et ne tient pas sa promesse.**
*Effet* : des accès disparaissent du journal. L’écran annonce « Conservés 90 jours » (l.1089), mais le code garde 100 lignes, quelle que soit leur date.
*Cause* : `agtLogAccess` (l.682) réécrit tout le journal depuis la copie chargée à l’ouverture. Il efface ce qui a été écrit depuis : les entrées des codes d’essai notées par le serveur (`appendAccessLog`, claims.js l.2243, qui, lui, travaille en transaction), et « Préparation fermée », notée depuis l’autre fenêtre par `_agtLogAccessLu` (l.1001). Celui-ci relit bien, mais prend une lecture ratée pour un journal vide (`if(!d) liste=[]`, l.1005) : il réécrit alors le journal avec une seule ligne (trouvé à la relecture). Le journal mélange aussi les accès aux données et des gestes commerciaux (factures, statuts de lead).
*À trancher* : `gtDeleteTenant` (claims.js l.1665) efface les accès du domaine supprimé — la trace de ce qui a été fait chez lui disparaît avec lui (décision D4).
*Correction* : R1, une durée tenue par la date, et deux familles séparées (accès aux données, gestes commerciaux).

**GT-B07 — Traiter une erreur efface les erreurs arrivées depuis.**
*Effet* : des erreurs remontées pendant que la console est ouverte disparaissent dès qu’on en marque une comme traitée.
*Cause* : `agtResolveError` (l.1538), `agtResolveGroup` (l.1394) et `agtPurgeErrors` (l.1563) réécrivent le journal d’erreurs de chaque domaine depuis la copie chargée. La purge part en un clic, sans confirmation (l.1375).
*Correction* : R3 — le suivi (traité, priorité, notes) vit chez GUERETTECH ; la console n’écrit plus dans le journal d’erreurs des domaines.

**GT-B08 — L’encaissé est compté à la date de facture.**
*Effet* : une facture de décembre payée en janvier compte dans les encaissements de décembre. Le chiffre affiché n’est donc pas celui à déclarer.
*Cause* : `_agtBizMois` (l.5022) range l’encaissé au mois de la facture. `paye_le` est écrit (l.5672) mais lu nulle part, et il prend la date du clic, pas celle du virement. Aucun mode de règlement n’est noté. L’export CSV (l.5803) n’a pas de date de paiement.
*Pourquoi c’est P1* : le livre des recettes d’un micro-entrepreneur se tient dans l’ordre des encaissements, à la date où l’argent arrive, pas à la date de la facture, avec six mentions par ligne : date d’encaissement, numéro de facture, client, nature de la prestation, montant, mode de règlement (sources : lecoindesentrepreneurs.fr/livres-comptables-obligatoires-micro-entreprise, abby.fr/guide/micro-entreprise/livre-recettes-auto-entrepreneur).
*Correction* : R5 — date et mode de paiement saisis, encaissé rangé à la date de paiement, livre des recettes exportable.

**GT-B09 — La relance réclame le montant brut, avoir oublié.**
*Effet* : une installation à 990 € avec l’offre de lancement à −495 € est relancée pour **990 €**, alors que 495 € sont dus. Le Radar et « À traiter » affichent aussi 990 €, et « dont X en retard » additionne les montants bruts.
*Cause* : `agtBizRelance` (l.5786), `_agtBizTodoRows` (l.5146) et le total des retards de `_agtBuildBusiness` lisent `f.montant`, pas le reste dû par référence (`_agtFVent` sait pourtant le calculer). C’est le cas réel que le code cite : « le solde réclamé était presque du double ».
*Correction* : R5 — un seul « reste dû par facture », lu partout.

**GT-B10 — Un client supprimé sort du chiffre d’affaires.**
*Effet* : ses factures restent en base mais disparaissent des totaux, des courbes et de l’export. Le numéro de facture suivant proposé peut en reprendre un déjà servi.
*Cause* : `_agtBizLignes` (l.5001), `agtBizCsv` (l.5803) et `_agtBizNextRef` (l.5547) ne parcourent que les domaines du registre. `gtDeleteTenant` retire le domaine du registre et ne touche pas à `billing` (zéro mention dans claims.js).
*Correction* : R5 — la facturation lit toutes les factures de `billing`, domaine supprimé compris, marqué comme tel.

### P2 — chiffres faux, fonctions qui mentent

**GT-B11 — La console se charge une lecture après l’autre.**
*Effet* : l’attente grandit avec chaque client. Aujourd’hui environ 30 allers-retours à la suite ; à 30 clients, environ 220. Changer le statut d’un lead ou lui ajouter une note recharge tout.
*Cause* : `renderAdminGT` (l.338, boucle l.365) attend chaque lecture avant la suivante, et lit des documents entiers (`parcelles`, `membres`, `error_log`, `saisons`, `appareils`) pour n’en garder qu’un compte. `agtLeadSet` (l.5974) et `agtLeadNote` rappellent `renderAdminGT`. L’appli lit déjà en parallèle (PERF-1, `fbLireTout`).
*Correction* : lectures en parallèle, affichage au fur et à mesure (squelettes), mise à jour locale après un geste.

**GT-B12 — Une lecture ratée affiche « 0 membre, 0 parcelle ».**
*Cause* : `fbAdminRead` (firebase.js l.2975) rend `null` sur erreur, et l’écran le compte comme vide. « Un écran vide n’est pas un message. »
*Correction* : chaque domaine porte l’état de sa lecture (en cours, faite, en échec), affiché.

**GT-B13 — Un abonnement annuel déclenche une fausse alerte tous les mois.**
*Effet* : « abonnement à émettre » au Radar et dans Business pendant 11 mois, alors que l’écran demande lui-même de saisir l’annuel en une seule ligne.
*Cause* : `_agtBizTodoRows` (l.5183) suppose un abonnement mensuel (dernière facture + 1 mois).
*Correction* : une périodicité par abonnement (mensuelle, annuelle).

**GT-B14 — Un domaine sans fiche commerciale compte comme « Abonné » à 79 €.**
*Effet* : le domaine jetable de l’installation à blanc (backlog §28, « le seul critique ouvert ») gonflera le revenu mensuel et demandera d’émettre un abonnement.
*Cause* : `_agtStatutOf` (l.4873) rend « Abonné » par défaut, `_agtPlan` (l.4858) rend « Domaine » par défaut.
*Correction* : « À qualifier » par défaut, jamais compté dans le revenu.

**GT-B15 — Le compteur d’accès des codes d’essai reste à 0.**
*Cause* : `window.agtUpdateEssaiAccess` (l.2505) vit dans `admin-gt.js`, que l’appli des clients ne charge plus depuis GT-1 ; l’appel d’app.js (l.1697) ne trouve donc rien. Le compte démo ne pourrait de toute façon pas écrire `demo_tokens` (règle GT seulement). Le serveur note bien chaque entrée, mais dans le journal d’accès (`checkTrialToken`).
*Correction* : compter les entrées `essai:<code>` du journal d’accès ; retirer la fonction morte.

**GT-B16 — « Accéder », le bouton principal de la carte client, n’accède à rien.**
*Effet* : un nouvel onglet s’ouvre sur l’écran de connexion du domaine (la session GT ne vit que dans son onglet depuis SEC-GT), et le journal note « Accès dashboard » : la trace d’un accès qui n’a pas eu lieu.
*Cause* : `agtAccedeTenant` (l.982) ; le commentaire de `agtPrepOuvrir` le dit déjà (« chevauchement signalé, non tranché », §134). Décision déjà au backlog : « Accéder » ou « Préparer », une seule porte.
*Correction* : une seule porte, « Préparer » ; le lien public devient « Copier le lien du domaine », sans trace d’accès.

**GT-B17 — Config : une latitude vide devient 0.**
*Effet* : la météo de repli du domaine part au large du golfe de Guinée.
*Cause* : `agtSaveConfig` (l.2197) écrit `parseFloat(...) || 0` — exactement le motif interdit par la règle « `(x || défaut)` quand x peut valoir 0 ». La fiche › Domaine (`_fcSaveDom`, l.3431) fait juste : deux écrans, deux règles pour le même champ.
*Correction* : un seul écran pour la config d’un domaine.

**GT-B18 — Une erreur remontée ne dit pas de quelle version elle vient.**
*Effet* : impossible d’écrire « apparue en 10.55, corrigée en 10.57 », ni de voir qu’un bug corrigé revient.
*Cause* : l’entrée de `logError` (utils.js l.2310) porte niveau, message, détail, utilisateur, domaine, page — pas `APP_VERSION`. Les signalements, eux, portent `appVersion`.
*Correction* : R4 (touche `utils.js` : bump APP et SW).

**GT-B19 — Un signalement passe à « résolu » même si le serveur refuse.**
*Cause* : `agtResolveReport` (l.673) change l’écran avant d’appeler `resolveReport`, et ne revient pas en arrière sur un échec.
*Correction* : changer l’écran après la réponse, ou revenir en arrière avec le message.

**GT-B20 — Rien ne se trie, rien ne se cherche.**
*Effet* : six onglets, aucun choix de tri, aucun champ de recherche. Les listes sont coupées sans page suivante : 40 signalements (l.2337), 40 groupes d’erreurs (l.1310), 50 accès (l.1094), 20 entrées de journal (l.2220).
*Correction* : la nouvelle console (maquette) — tri sur chaque colonne, recherche partout, filtres mémorisés, vues enregistrées.

### P3 — gêne et incohérences

**GT-B21 — Les compteurs ne bougent pas après un geste.** Les chiffres du bandeau et les pastilles des onglets ne se recalculent qu’au rechargement complet. La pastille « N critiques » du bas remplace le point vert (l.473) et ne revient jamais au vert.

**GT-B22 — Chaque carte client a une barre de saison toujours vide.** Sa largeur est écrite à 0 % (l.924) ; rien ne la calcule.

**GT-B23 — Le journal d’accès (Outils) affiche « cle » ou « crayon » en toutes lettres.** `_agtBuildLog` (l.1097) pose l’icône brute ; la fiche, elle, passe par `_agtIco` (l.861).

**GT-B24 — La fenêtre « Erreurs » d’un domaine montre des doublons et compte en heures.** Les erreurs locales et celles du domaine sont mises bout à bout sans retirer les doubles (l.2245) ; une erreur de deux semaines s’affiche « il y a 312 h » (l.2261).

**GT-B25 — La console garde les données de tous les domaines dans le navigateur.** `gt.html` prend le même cache Firestore persistant que l’appli (firebase.js, création de la base). Sans effet en fenêtre privée — la procédure actuelle —, mais rien n’empêche d’ouvrir `gt.html` dans une fenêtre normale. Le mode tuto force déjà le cache mémoire : la même ligne suffit pour `gt.html`.

**GT-B26 — Le vocabulaire se contredit.** Deux « essais » différents (les codes de démo de 30 jours dans Outils, l’essai de 15 jours installé chez le client) ; « Tenants actifs — N » (l.904) compte aussi les domaines en attente ; deux onglets en anglais (Business, Leads).

### P4 — la dette : ce qui fait « fait-maison »

- **GT-B27 — Une mise en page de téléphone étirée sur PC** : une colonne, des cartes dépliables, pas de largeur maximale, pas de liste à côté d’une fiche.
- **GT-B28 — Hors de la charte, sombre seulement** : 753 styles et 1 362 couleurs écrits dans le code, 65 tailles sous 11 px, aucun attribut d’accessibilité. La série CHARTE veut un seul fichier pour tout le style.
- **GT-B29 — Neuf fenêtres plein écran faites à la main** : aucune ne passe par `openOv` — ni retour arrière, ni Échap, ni focus gardé dans la fenêtre (A11Y-2).
- **GT-B30 — Des règles en double** : trois façons d’écrire « il y a… » (`_agtRelTime`, `_agtCnxFmt`, `agtShowErreurs`), deux éditeurs de config, deux vues des erreurs, deux écrivains du journal d’accès.
- **GT-B31 — Pas de lien direct** : l’onglet n’existe qu’en mémoire ; recharger ramène au Radar ; impossible de garder ou d’envoyer le lien d’un incident.
- **GT-B32 — Le domaine de référence écrit en dur à 8 endroits** (l.355, 357, 962, 1493, 2695, 2917, 4614, 4949). Ce n’est pas une fuite (le slug est autorisé, CONF-2), c’est un domaine particulier dans le code.

### Récapitulatif

| N° | P | Onglet | Effet, en une ligne | Lot |
|---|---|---|---|---|
| B01 | P1 | Clients, installation, essai | le registre des clients peut s’effacer | GTFIX-1 |
| B02 | P1 | Membres, Config, KML | l’équipe, la config ou les parcelles d’un domaine peuvent être réécrites | GTFIX-1 |
| B03 | P1 | Fiche client | les saisies du client sont écrasées | GTFIX-2 |
| B04 | P1 | Fiche client | un renommage détache l’historique | GTFIX-2 |
| B05 | P1 | Partout | le verrou passe sous les fenêtres | GTFIX-2 |
| B06 | P1 | Outils › Journal | des accès disparaissent du journal | GTFIX-1 |
| B07 | P1 | Incidents | traiter une erreur en efface d’autres | GT-SUIVI-1 |
| B08 | P1 | Business | encaissé à la date de facture | GTFIX-3 |
| B09 | P1 | Business, Radar | relance au montant brut | GTFIX-3 |
| B10 | P1 | Business | un client supprimé sort du CA | GTFIX-3 |
| B11 | P2 | Partout | chargement une lecture après l’autre | GTFIX-4 |
| B12 | P2 | Partout | lecture ratée affichée comme « 0 » | GTFIX-4 |
| B13 | P2 | Business, Radar | fausse alerte d’abonnement annuel | GTFIX-3 |
| B14 | P2 | Business, Radar | un domaine de test compté abonné | GTFIX-3 |
| B15 | P2 | Outils › Démo | compteur des codes figé à 0 | GTFIX-4 |
| B16 | P2 | Clients | « Accéder » n’accède à rien | GTFIX-4 |
| B17 | P2 | Clients › Config | latitude vide écrite à 0 | GTFIX-1 (case vide) · GTFIX-4 (un seul écran) |
| B18 | P2 | Incidents | erreur sans version | GT-SUIVI-1 |
| B19 | P2 | Incidents | « résolu » sans réponse du serveur | GT-SUIVI-1 |
| B20 | P2 | Partout | aucun tri, aucune recherche | GT-UI-1 à 6 |
| B21 | P3 | Bandeau | compteurs figés | GTFIX-4 |
| B22 | P3 | Clients | barre de saison vide | GTFIX-4 |
| B23 | P3 | Outils › Journal | icônes en toutes lettres | GTFIX-4 |
| B24 | P3 | Clients › Erreurs | doublons, « 312 h » | GTFIX-4 |
| B25 | P3 | Partout | données gardées dans le navigateur | GTFIX-2 |
| B26 | P3 | Partout | vocabulaire contradictoire | GT-UI-1 |
| B27 à B32 | P4 | Partout | l’aspect « fait-maison » | GT-UI-1 à 6 |

---

## 5. Ce qui est sain — vérifié

- **La session GT** : le droit est lu dans le jeton (pas dans l’objet local), la session ne survit pas à l’onglet, le code à usage unique ferme la session au bout de 8 h, le verrou demande le vrai mot de passe, et la sortie efface la mémoire et l’écran avant de se déconnecter (`_agtGuard`, `agtUnlock`, `agtLockOut`).
- **Les boutons** : sur les 109 fonctions appelées depuis le HTML que la console écrit, une seule n’est pas exposée — `openOv`, une fonction de l’appli, comme attendu (§6c).
- **Ni `alert`, ni `confirm`, ni `prompt`** ; **aucun `catch` vide**.
- **Plus aucune facture nominative dans le code** : il ne reste que le slug du domaine de référence, autorisé (CONF-2).
- **L’import KML relit la base au moment d’écrire** et sépare « compléter » de « remplacer » (KML-FUSION) : c’est le modèle à étendre aux autres écritures.
- **Les erreurs sont groupées par empreinte**, avec leurs dates et les domaines touchés, et la console distingue « aucune erreur » de « aucune connexion, rien à conclure » : la bonne idée de départ du suivi des incidents.
- **L’assistant d’installation** (354 assertions en août, §18b) n’a pas été rouvert ici ; il reste à jouer de bout en bout sur un domaine jetable (backlog §28).

---

## 6. Les manques, face aux références

Ce que font les logiciels de référence, et ce qui manque ici. Ne sont retenues que des fonctions stables et connues de ces outils.

**Le suivi des bugs (Linear).** Chaque ticket a une priorité (urgente, haute, moyenne, basse, ou aucune) et un statut dans un flux. Les listes se trient, se filtrent et se regroupent sur n’importe quel champ ; les vues filtrées s’enregistrent ; une barre de commande (⌘K) ouvre tout.
→ *Manque ici* : priorité, statut au-delà de « ouvert / résolu », ticket saisi à la main (un client qui appelle), lien entre une erreur et un signalement, notes, âge du ticket, lien vers le lot qui corrige.

**Le suivi des erreurs (outils de supervision).** Regroupement par empreinte, première et dernière apparition, utilisateurs touchés — déjà là. En plus : la version où l’erreur apparaît et celle qui la corrige, et une erreur corrigée qui revient se rouvre toute seule (régression).
→ *Manque ici* : la version (GT-B18), la régression, l’état « sans suite ».

**La facturation (Stripe).** Les factures ont un statut (brouillon, ouverte, payée, annulée, irrécouvrable), une échéance, une date de paiement ; elles se cherchent, se filtrent, s’exportent ; la fiche d’un client montre son historique.
→ *Manque ici* : date et mode de paiement (GT-B08), reste dû net partout (GT-B09), périodicité (GT-B13), ancienneté des créances, livre des recettes, contacts de facturation (les relances partent sans destinataire : « aucune adresse client n’est stockée »).

**Le suivi commercial (outils de type CRM).** Un pipeline par étapes, la date de la prochaine action, la valeur estimée, la source, l’historique des échanges, le passage du prospect au client.
→ *Manque ici* : prochaine action et relance (le Radar ne montre que les leads « Nouveau » ; un lead « Répondu » oublié depuis trois semaines ne remonte jamais), historique (seule la dernière date est gardée), source, valeur, lien vers le domaine installé.

**Les consoles d’exploitation SaaS.** La liste des clients en tableau (santé, revenu, dernière activité, version des appareils), une fiche par client avec sa chronologie, et l’état du système : sauvegardes de la nuit, synchronisations planifiées, file des e-mails, versions en service.
→ *Manque ici* : tout le volet « santé du système ». Aucun écran ne dit si la sauvegarde de 2 h a tourné, si E-Phy s’est synchronisé mercredi, si la file d’e-mails avance (l’incident du 26/07 : plus aucun e-mail ne partait). Le parc d’appareils n’existe que domaine par domaine, alors que le déploiement général demande de vérifier, avant de déployer, que tous les téléphones ont la bonne version (backlog §28.2, `QDN_DEPUIS`).

**Partout.** Recherche globale, tri sur chaque colonne, filtres mémorisés, liens directs, Échap et retour arrière, clair et sombre, chargement progressif avec « à jour il y a N min », actions groupées (traiter cinq erreurs d’un coup), toast « Annuler » (l’appli l’a déjà : ANNULER-1).

---

## 7. Les recommandations de structure

- **R1 — Une écriture GT relit au moment d’écrire, et n’écrit jamais après une lecture ratée.** Un seul outil dans `firebase.js` (une transaction : lire, modifier, écrire d’un bloc). Une lecture qui échoue arrête tout et le dit : « lecture impossible, rien n’a été écrit ». Concerne `tenants`, `clients`, `billing`, `leads_status`, `access_log`, `demo_tokens`, et `membres` des domaines.
- **R2 — Les données d’un domaine ne s’éditent plus dans la console.** La fiche client passe en lecture seule pour les parcelles, membres, tâches, tracteurs et saisons, avec « Modifier dans la préparation » : les vrais écrans, avec leurs règles (renommage, gardes anti-perte, identifiants). La fiche garde ce qui appartient à GUERETTECH : formule, modules, essai, abonnement, contacts.
- **R3 — Le suivi des incidents vit chez GUERETTECH.** Un document `_guerettech/suivi`, rangé par empreinte : statut, priorité, versions, notes, signalements liés, lot. La règle `_guerettech/{document=**}` couvre déjà ce chemin : aucune règle à déployer. Le journal d’erreurs des domaines n’est plus réécrit par la console.
- **R4 — Chaque erreur remontée porte sa version** (`v: APP_VERSION` dans `logError`).
- **R5 — L’argent à la date d’encaissement.** Un paiement = une date saisie et un mode ; l’encaissé se range à cette date ; un seul « reste dû par facture », lu par la relance, le Radar et les retards ; la facturation lit toutes les factures de `billing`, domaines supprimés compris ; la numérotation compte toutes les factures ; le livre des recettes s’exporte.
- **R6 — Une seule porte vers un domaine : « Préparer ».**
- **R7 — La console sur la charte** : clair et sombre, fenêtres par `openOv`, verrou au-dessus de tout, cache mémoire sur `gt.html`.

---

## 8. Les décisions à prendre (avec ma recommandation)

| # | Question | Recommandation |
|---|---|---|
| D1 | La fiche client passe-t-elle en lecture seule pour les données du domaine ? | **Oui** — on modifie par « Préparer ». C’est ce qui ferme GT-B03 et GT-B04 pour de bon. |
| D2 | Quelle échelle de priorité ? | **P1 à P4**, avec une priorité *suggérée* (gravité, nombre de domaines, fréquence, régression) que tu confirmes ou changes. |
| D3 | Les codes de démo de 30 jours servent-ils encore, depuis l’essai de 15 jours installé ? | **Les garder** pour qui veut seulement voir l’appli, compteur lu dans le journal ; sinon retirer l’onglet. À toi de dire. |
| D4 | Supprimer un domaine efface-t-il ses accès du journal ? | **Non** — la trace de ce qui a été fait chez lui doit survivre à sa suppression. Et une durée de conservation tenue par la date : **1 an** proposé (l’écran promet 90 jours, les CGU et le DPA ne fixent rien). |
| D5 | Garder les contacts d’un client dans la console (signataire, contact technique, e-mail de facturation) ? | **Oui**, dans `_guerettech/clients` (GT seulement) : les relances partent avec leur destinataire. |
| D6 | La console produit-elle le livre des recettes ? | **Oui**, avec le mode de règlement saisi au paiement. |
| D7 | Les noms des onglets ? | « Business » devient **Facturation** ; « Leads » garde son nom. |

---

## 9. Le plan de lots

Ordre : **ce qui perd des données et ce qui fausse l’argent d’abord**, avant de poser la nouvelle console sur les mêmes écritures.

**Onze lots en tout** : quatre GTFIX, un GT-SUIVI, six GT-UI.

| Lot | Contenu | Défauts | Fichiers | Version | Taille |
|---|---|---|---|---|---|
| **GTFIX-1** | Les écritures sûres : l’outil de transaction, toutes les écritures GT passées dessus, refus d’écrire après une lecture ratée ; harnais avec une base factice qui tombe en panne | B01, B02, B06 | `src/firebase.js`, `src/admin-gt.js` | aucune | M |
| **GTFIX-2** | Le verrou au-dessus de tout ; la fiche client en lecture seule (D1) ; le cache mémoire sur `gt.html` | B03, B04, B05, B25 | `src/admin-gt.js`, `src/gt/console.html`, `src/firebase.js` | aucune | M |
| **GTFIX-3** | L’argent juste : date et mode de paiement, encaissé à la date de paiement, reste dû net partout, factures des domaines supprimés, numérotation, périodicité, « À qualifier » par défaut, livre des recettes ; harnais chiffré | B08, B09, B10, B13, B14 | `src/admin-gt.js` | aucune | M |
| **GTFIX-4** | Ce qui ment : chargement en parallèle et progressif, lecture ratée signalée, lead sans tout recharger, compteur des codes, une seule porte (R6), config, compteurs à jour, barre de saison retirée, icônes du journal, fenêtre des erreurs | B11, B12, B15, B16, B17, B21 à B24 | `src/admin-gt.js` | aucune | M |
| **GT-SUIVI-1** | Le suivi des incidents : `_guerettech/suivi`, priorités, statuts, versions, notes, liens, ticket saisi à la main ; la version dans chaque erreur | B07, B18, B19 | `src/admin-gt.js`, `src/utils.js` | **APP + SW** (`WHATS_NEW` : `items: []`) | L |
| **GT-UI-1** | La coquille de la maquette : barre latérale, recherche ⌘K, liens directs, clair et sombre sur la charte, fenêtres par `openOv`, un composant de tableau triable partagé | B20, B26, B27 à B31 | `src/admin-gt.js`, `src/gt/console.html`, `src/styles.css` | **SW** (la feuille est commune) | L |
| **GT-UI-2** | Radar et Incidents, PC et téléphone | B20 | `src/admin-gt.js` | aucune | L |
| **GT-UI-3** | Clients : le tableau, la fiche à onglets, la santé, les contacts (D5) | B20 | `src/admin-gt.js` | aucune | L |
| **GT-UI-4** | Facturation : le tableau des factures, les encaissements, le livre des recettes, les relances | B20 | `src/admin-gt.js` | aucune | M |
| **GT-UI-5** | Leads en pipeline ; la santé du système (sauvegardes, E-Phy, file d’e-mails, versions de tout le parc) — les fonctions planifiées écrivent leur état dans `_guerettech/sante` | B20 | `src/admin-gt.js`, `functions/index.js`, `functions/ephy.js` | aucune (déploiement des fonctions) | M |
| **GT-UI-6** | Outils et finition : le journal d’accès en tableau, KML, démo ; retrait de l’ancien CSS `.agt-*` | B32 | `src/admin-gt.js`, `src/styles.css` | **SW** | S |

**L’accompagnement** : la console est hors du périmètre client (`AIDE_EXEMPT` de C22 : `admin-gt`). Pas de fiche `MV_AIDE`, pas de section du guide, pas de tuto. `WHATS_NEW` ne bouge qu’avec GT-SUIVI-1 (`items: []` : rien à annoncer aux vignerons).

---

## 10. Ce qui n’a pas été vérifié

- **Aucun écran de la console n’a été ouvert** : il faut la connexion GT et le code à usage unique. Le verrou sous les fenêtres (GT-B05) est lu dans les plans de la feuille, pas vu.
- **Les temps de chargement sont estimés**, pas mesurés : à mesurer chez toi avant et après GTFIX-4 (onglet Réseau du navigateur).
- **Les écritures concurrentes** (GT-B03, B06, B07) sont lues dans le code ; aucune n’a été reproduite contre la vraie base.
- **Les fonctions serveur** n’ont pas été exécutées : leur comportement est lu dans `functions/claims.js`.
- **La maquette** porte des données fictives ; ses chiffres sont cohérents entre eux, pas ceux de ta base.
