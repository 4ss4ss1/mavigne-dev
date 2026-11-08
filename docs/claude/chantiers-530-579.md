# Ma Vigne — Chantiers §530 à §579

> Ouvert le 05/11/2026 (§530), sur le modèle de `chantiers-480-529.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.

## 530. ★★★ FICHE-1 — LA FICHE COMPLÈTE D'UN CLIENT, LES PIÈCES SIGNÉES, LE DÉPÔT DE PIÈCES (05/11 — `src/gt/fiche.js` (neuf) · `src/gt/pieces.js` (neuf) · `src/admin-gt.js` · `src/firebase.js` · `firestore.rules` · `storage.rules` · `src/gt/console.html` · `src/gt/coquille.js` · `src/gt/clients.js` · `src/gt.js` · `src/styles.css` · `public/sw.js` · `docs/maquettes/maquette-fiche-client-v1.html` (neuve) · `scripts/mv-harnais-fiche1.mjs` (neuf) · `scripts/mv-harnais-gtfix4.mjs` · `scripts/mv-harnais-gtui1.mjs` · `scripts/mv-harnais-gtui6.mjs` · `scripts/mv-harnais-gtsuivi1.mjs` · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` — base `85b89dc` « gtrestes1 » — APP 10.65 inchangé, **SW 11.54 → 11.55**)

### 530a. D'où ça vient
- **Nico, 04/11** : dans la console, une fiche par client avec toutes les informations (domaine, contact, date, signature, tarif, renouvellement), tout ce qui a été signé entre ses clients et lui, une fiche de procédure en cas d'incident de données. **Maquette d'abord** : `docs/maquettes/maquette-fiche-client-v1.html` (faite avec la vraie feuille et la vraie coquille de la console), trois écrans, cinq décisions.
- **Nico, 05/11** : D1 à D5 validées ; **D2 : oui, pouvoir déposer les pièces signées hors de l'appli** ; « je veux que ça corresponde parfaitement à la maquette ». FICHE-1 fait les écrans 1 et 2 et le dépôt ; INCIDENT-1 fera l'écran 3.
- **Relu avant d'écrire** : la preuve d'acceptation (`_mv_signatures/{slug}`, écrite par `acceptTerms`, SIGN-1 §156 : référence, `ts_ms`, signataire, raison sociale, SIRET, adresse, versions et empreintes SHA-256 des textes servis, `ip_hash`, navigateur, historique `hist/`) ; les règles laissaient la console lire la preuve, **pas son historique** ; l'appli redemande déjà l'acceptation quand une version change (`_mvTermsOk`) ; le stockage existe (`storage.rules`).

### 530b. Ce qui change
- **La fiche complète** (`src/gt/fiche.js`, écran 1) : en pleine page (« Fiche complète » de la fiche courte, ou `#clients/<slug>/fiche`) ; le bandeau (slug et « client depuis », nom, raison sociale et SIRET, statut, état de la signature, factures en retard ; Copier le lien, Relancer s'il y a du retard, Préparer ce domaine) ; à gauche **Identité** (tirée de la preuve), **Contact de facturation**, **Contrat** (formule, tarif HT et périodicité, début, essai « du … au … », prochain renouvellement et son montant, conservation 90 jours après résiliation), **Facturation** ; à droite **Signature** (versions, horodatage serveur, signataire, référence, empreintes abrégées, reçu, trace, historique lu à l'ouverture), **Pièces** (textes signés, reçu, pièces déposées ; « + Déposer une pièce signée »), **Chronologie** (avec les acceptations). L'en-tête prend le nom du domaine et « Retour aux clients » ; « Clients » revient à la liste. L'ancienne fenêtre reste, renommée « Formule, essai et statut » (elle seule modifie la formule, l'essai, le statut).
- **Les pièces signées** (`src/gt/pieces.js`, écran 2, « Pièces signées » dans la barre avec le compteur des domaines à refaire signer, `#pieces`) : quatre chiffres, les onglets (toutes, à jour, à refaire signer, sans signature, pièces déposées), la recherche sans accents, le registre, la fiche d'une preuve (accepté le, par et compte, au nom de, versions et empreintes, trace, reçu, historique ; ouvrir le texte, télécharger la preuve en JSON, renvoyer le reçu).
- **D3** : « Demander la signature de la nouvelle version » prépare **un brouillon** (contacts en copie cachée) ; l'appli fait accepter à la prochaine connexion d'administrateur. **D5** : relance, demande, reçu — des `mailto:`, rien ne part seul.
- **Le dépôt (D2)** : `fbGtPieceDeposer` met le fichier sous `_guerettech/pieces/<slug>/` (stockage), `_agtPieceDeposer` ajoute sa ligne à `_guerettech/pieces` par transaction (`fbGtMaj`), le journal d'accès le note ; `agtPieceOuvrir` ouvre par un lien signé. **Règles** : Firestore `_mv_signatures/{slug}/hist/{h}` lu par GUERETTECH seul, écriture fermée ; stockage `_guerettech/pieces/{slug}/{fichier}` : GUERETTECH seul, PDF ou image, 10 Mo, ni réécriture ni effacement.
- **Les versions en vigueur** (`_AGT_TEXTES`) sont celles du serveur (`TERMS_*_CUR`) et de l'appli (`_MVT_*`) — le harnais compare les trois.

### 530c. Mesuré
- **Les comparaisons contre la maquette** (livrées) : fiche complète et pièces signées, côte à côte ; les écarts relevés au premier rendu corrigés (séparateurs des pièces, essai « du … au … », « en retard de N jours », version d'iOS, « Par » avec le compte, historique court, compte de l'onglet des pièces). **Écarts restants, assumés** : la surface (« 22,8 ha ») n'est pas dans le registre des domaines — la ligne Vignoble dit parcelles et membres ; l'entrée « Incident de données » de la barre arrive avec INCIDENT-1 ; l'étiquette « à décider » de la maquette disparaît (décidé).
- `mv-harnais-fiche1` (neuf) : **12 assertions, 8/8 mutants**.
- **Trois pièges** : la chaîne `image/` suivie d'une étoile (le sélecteur de fichier) ouvre un commentaire pour le preflight, qui ne voyait plus le reste du fichier (des dizaines de faux « C23 ») — types écrits en toutes lettres ; **`styles.css` touche 1 Mo** (le plafond du harnais des tailles) — des commentaires raccourcis sans toucher aux ancres des harnais ; **le prochain lot doit sortir les styles de la console dans leur propre fichier** ; `admin-gt.js` +5,7 % — référence regravée (les données de la fiche vivent avec la console, les écrans sont dans des modules).
- `gtfix4` (huit onglets avec bandeau ; « Formule, essai et statut »), `gtui1` (la route `<slug>/fiche`), `gtui6` (`'sante'` n'est plus le dernier de la liste) suivent.
- **La chaîne**, premier passage complet (672 commandes) : deux rouges, tous deux de ce lot — `mv-harnais-tutos` (le dépôt appelait l'envoi brut du stockage ; **tout envoi passe par la porte des tutos**, `uploadBytesResumable`, qui le refuse pendant l'entraînement) ; `mv-harnais-gtsuivi1` (la liste des documents lus se termine désormais par `'pieces'`). **Second passage, sur le code final : 672 commandes, 0 rouge.** `harnais-sec7-contre` y a pris 269 s (193 s au lot précédent) : la durée de la CI reste à surveiller (§529c).
- **Tutos concernés** : aucun ; **le côte à côte rejoué** sur la construction finale, aux trois tailles : vert.

### 530d. Ce qui reste ouvert
- **INCIDENT-1** : l'écran 3 de la maquette — la procédure, le message aux clients, le registre des violations, l'horloge des 72 h ; **avec la sortie des styles de la console hors de `styles.css`** (plafond de 1 Mo).
- **Déploiement** : `npm run build && firebase deploy --only hosting,firestore:rules,storage`.

## 531. ★★★ INCIDENT-1 — L'INCIDENT DE DONNÉES ; LA FEUILLE DE LA CONSOLE (06/11 — `src/gt/incident.js` (neuf) · `src/gt/console.css` (neuve) · `src/admin-gt.js` · `src/gt/console.html` · `src/gt/coquille.js` · `src/gt.js` · `src/styles.css` · `public/sw.js` · `scripts/mv-harnais-incident1.mjs` (neuf) · `scripts/mv-harnais-jetons.mjs` · `scripts/mv-harnais-echelle.mjs` · `scripts/mv-harnais-contraste.mjs` · `scripts/mv-harnais-typo.mjs` · `scripts/mv-harnais-fiche1.mjs` · `scripts/mv-harnais-gtsuivi1.mjs` · `scripts/mv-harnais-gtfix4.mjs` · `scripts/contraste-baseline.json` · `scripts/mv-harnais-liste.mjs` — base `5b84788` « fiche1 » — APP 10.65 inchangé, **SW 11.55 → 11.56**)

### 531a. D'où ça vient
- **Nico, 04/11** : « une fiche de procédure en cas d'incident de données » ; la maquette `maquette-fiche-client-v1.html`, écran 3, D4 (le registre dans la console, tenu même sans notification) et D5 (rien ne part seul) validées le 05/11 ; « que ça corresponde parfaitement à la maquette ».
- **`styles.css` au plafond de 1 Mo** (§530c) : ce lot commence par la feuille de la console.
- **Les engagements, relus dans les textes signés** : CG 4.8 et accord de traitement — en sous-traitant, GUERETTECH notifie le client « dans les meilleurs délais » (nature, catégories, volume approximatif, mesures) ; le client apprécie la CNIL (72 h, art. 33) ; pour ses propres données (comptes, facturation, demandes du site), GUERETTECH notifie la CNIL. Le contact du message est celui des mentions légales et de la politique de confidentialité (adresse, téléphone) : rien d'inventé.

### 531b. Ce qui change
- **La feuille de la console** `src/gt/console.css`, importée par `src/gt.js` : la console seule la charge (la construction produit une feuille `gt-*.css` à côté de celle de l'appli). Les styles des écrans neufs y vivent (FICHE-1 y déménage, INCIDENT-1 s'y ajoute) ; les blocs plus anciens restent dans `styles.css`, où leurs harnais les lisent. **Les harnais des jetons, de l'échelle, du contraste et des tailles lisent la nouvelle feuille** avec `styles.css` — rien n'échappe aux contrôles.
- **L'écran « Incident de données »** (`src/gt/incident.js`, `#incident`, dans la barre sous Système et dans la feuille « Plus ») : **l'horloge** (`horloge` : écoulé depuis la prise de connaissance, échéance des 72 h, heures restantes, dépassement ; sans incident : « Ouvrir un incident ») ; **la procédure en 7 étapes**, le texte de la maquette — au repos, chaque étape se lit comme la maquette ; un clic sur le numéro la coche (l'étape 4 cochée date la prévenance des clients), un clic sur le titre l'ouvre pour noter ce qu'on sait (nature, catégories, volume, personnes, rôle de GUERETTECH, domaines touchés, mesures, CNIL) ; **le message aux clients** (`message`) rempli de ce qui est noté, ce qu'on ignore entre crochets — « Préparer les brouillons » ouvre UN brouillon, contacts des domaines touchés en copie cachée (D5) ; **le registre des violations** (en cours, clos ; « + Inscrire » une violation passée ; une ligne ouvre son incident) ; les contacts utiles ; ce que disent les textes signés.
- **Les données** : `_guerettech/violations` (règle existante `_guerettech/{document=**}` : GUERETTECH seul), écrit par transaction (`_agtViolMaj`, `fbGtMaj`) ; un incident clos ne bouge plus ; l'ouverture et la clôture vont au journal d'accès.

### 531c. Mesuré
- **La comparaison contre la maquette** (livrée) : au premier rendu, deux écarts — ce qu'on sait s'affichait sous les étapes au repos (déplacé dans l'étape ouverte) ; le contact écrit avec des tirets (les points de la maquette). Au second : identique.
- `mv-harnais-incident1` (neuf) : **9 assertions, 7/7 mutants**.
- Le preflight a relevé 6 valeurs posées dans des gestes sans `_escAttr` à l'interpolation (C24b) — échappées.
- `gtsuivi1` (la liste lue se termine par `'violations'`), `gtfix4` (neuf onglets avec bandeau), `fiche1` (sa feuille) suivent ; la référence du contraste regravée (un écart de moins en sombre).
- **La chaîne**, premier passage complet (674 commandes) : deux rouges, tous deux de ce lot — la contre-épreuve de `mv-harnais-fiche1` (son ancre du brouillon de demande de signature n'était plus unique : le message d'incident commence pareil — l'ancre se précise) ; `mv-harnais-icones-contre` (son épreuve de l'échelle travaille dans une copie sans `src/gt/console.css` : les harnais de l'échelle et des jetons ne lisent la feuille de la console **que si elle existe**). **Second passage, sur le code final : 674 commandes, 0 rouge.**
- **Tutos concernés** : aucun ; **le côte à côte rejoué** sur la construction finale, aux trois tailles : vert.

### 531d. Ce qui reste ouvert
- **La demande du 04/11 est couverte** (FICHE-1 et INCIDENT-1). Rien d'autre d'ouvert sur la console à ce jour ; à vérifier chez Nico après déploiement (liste « À vérifier » de CLAUDE.md).

## 532. ★★ CUVFICHE-1 — LA FICHE D'UNE CUVE AU TÉLÉPHONE : ELLE DÉFILE, CE QU'ELLE OUVRE PASSE DEVANT ELLE, ELLE SE REPEINT (06/11 — `src/cuvier.js` · `src/whats-new.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-cuvfiche1.mjs` (neuf) · `scripts/mv-harnais-cuves1.mjs` · `scripts/mv-harnais-liste.mjs` — base `d5fa1e5` « incident1 » — **APP 10.65 → 10.66, SW 11.56 → 11.57**)

### 532a. D'où ça vient
- **Nico, 06/11, au téléphone** : « comment je fais pour entonner une cuvée du cuvier ? ». La réponse — « Décuver », en bas de la fiche de la cuve — était juste dans le code et fausse à l'écran : la fiche d'une cuve en Pressurage ne descendait pas sous sa courbe. Puis : « Noter un relevé » s'affiche derrière la fiche.
- **Une première passe, sous Sonnet, dans la même conversation** : le défilement, et `openOv` pour le relevé, la cuve et la réception. Livrée en fichiers à plat, puis en zip **incomplet** (ni doc, ni marque, ni harnais neuf). **Relue sous Opus avant intégration, elle ne réglait pas la demande** (532b). Nico prévenu de ne pas coller ce zip (à confirmer, §28).

### 532b. Ce qu'on a trouvé en relisant, et ce qui a été retenu
- **La fiche est un dialogue** : `_vendBascOuv` l'ouvre par `openOv`, donc au plancher des modales (9200, UI-Z §85). Les quatre gestes du bas — Décuver, Changer l'étape, Opération, Déclarer la FA finie — ouvrent une feuille `.mvv-ov` (9000) : **dessous**. La première passe rendait Décuver atteignable… pour ouvrir sa feuille derrière la fiche.
- ⚠️ **Baisser la fiche sous 9000 ne suffit pas** : `_mvOvSync` pose `inert` sur tout ce qui est hors du dialogue `.overlay` du dessus — la feuille aurait été visible, et intouchable. Écartés aussi : glisser `#mvv-ov` DANS la fiche (le retour Android départage les surfaces par z-index puis ordre DOM, `_mvTopSurface` : égalités fragiles) ; faire entrer `.mvv-ov` dans la famille `.overlay` (toutes les feuilles du Cuvier et du Chai touchées, pour un seul écran).
- **Retenu : la fiche s'écarte.** `_vendSheet` appelle `_vendFicheEcarter` (au téléphone, fiche ouverte : son état noté, `closeOv`) ; `_vendSheetClose` rappelle `_vendFicheRevenir` au minuteur — après l'enregistrement, qui repeint la liste d'abord. ⚠️ Une feuille qui en enchaîne une autre se ferme puis se rouvre, et son `open` n'arrive qu'à l'image suivante (`requestAnimationFrame`) : le minuteur la croirait partie. `_vendSheetSeq` (un numéro par ouverture) tranche. La fiche ne revient pas si un autre dialogue est ouvert, si l'écran s'est élargi, si l'on a quitté les Cuves ou choisi une autre cuve.
- **La fiche ne se repeignait jamais au téléphone** : `renderVendCuves` ne touchait pas sa fenêtre. Un relevé enregistré depuis la fiche n'y apparaissait qu'en la rouvrant. `_vendFicheRafraichir`, en fin de `renderVendCuves` et avant les courbes, la repeint ; une cuve supprimée la ferme.
- **Un repeint replie les listes** : Parcours, relevés et opérations sont des `<details>`, état tenu par le DOM seul — corriger un relevé depuis la liste l'aurait repliée, et le défilement serait retombé à côté. Elles portent une clé (`data-vf`) ; `_vendFicheEtat` / `_vendFicheRendre` gardent les ouvertes et le défilement (rétabli après les listes, puis à l'image suivante, une fois les courbes peintes).
- **Deux touchers pour rouvrir** : refermée par le fond ou le retour, la fiche gardait `_vendOuvert`, et le toucher suivant la « refermait ». Désormais : fenêtre fermée = on ouvre.
- **Vérifié, déjà juste** : « Corriger le volume » (`openPrompt`) et « Agrandir » (`openOv('ovGraph')`) passent devant la fiche ; le bloc « Au labo » n'a aucun bouton.
- Le style du défilement vit dans `_vendInjectCss` : `styles.css` est à 768 octets du plafond de 1 Mo (§531).

### 532c. Mesuré
- `mv-harnais-cuvfiche1` (neuf) : **23 assertions, 15/15 mutants** — les vraies fonctions dans un faux DOM qui tient les classes, le défilement (remis à zéro par un contenu réécrit, comme un navigateur), les `<details>`, les minuteurs et les images.
- `mv-harnais-cuves1` : ses fonctions extraites appellent les nouvelles, ajoutées à sa liste — 24 verts, 8/8.
- Preflight : 0 erreur. Harnais du Cuvier (13), version, annonces, typographie, couches, cliquets : verts. `WHATS_NEW` 10.66 exécuté en Node : trois items, niveau 0, admin et cave.
- **La chaîne complète, sur le code final : 676 commandes, 0 rouge.** Jouée par tranches — le bac à sable coupe un appel à 300 s et tue ce qui tourne en fond : 1 à 215 ; `icones-contre` seule (71 s) ; 217 à 307 ; 273 à 669 ; 670 à 676. Construction (`vite build`) verte.
- ★ **Le premier passage a trouvé un rouge de ce lot** : `mv-harnais-tutos` — `index.html` chargeait encore `boot.js?v=10.65`. La montée de version de la première passe n'avait changé que les quatre affichages `v…` ; le preflight, qui ne lit pas `?v=`, était vert. Corrigé, puis tout rejoué.
- **Tutos concernés** : aucun (11 tutos, aucun ne touche ce changement) ; le côte à côte : rien qui le touche.
- **Pas vu** : un vrai téléphone — le défilement, l'écart et le retour de la fiche, le retour Android sur une feuille ouverte (§28).

### 532d. Ce qui reste ouvert
- **À vérifier chez Nico** et **vu en route** (les autres fenêtres `.mat-modal` sans zone qui défile — traité au §533 ; `mv-harnais-cuvier-correction` périmé) : §28, bloc CUVFICHE-1.

## 533. ★★ FENETRES-1 — LES FENÊTRES DU CUVIER ET DU CHAI DÉFILENT ; « NOTER DES MESURES » NE PERD PLUS SON BOUTON ENREGISTRER (06/11 — `src/styles.css` · `src/cuvier.js` · `src/whats-new.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-fenetres1.mjs` (neuf) · `scripts/mv-harnais-cuvfiche1.mjs` · `scripts/mv-harnais-liste.mjs` — base `8f3713a` « cuvfiche1 » — **APP 10.66 → 10.67, SW 11.57 → 11.58**)

### 533a. D'où ça vient
- **Vu en route au §532** (la fiche cuve), puis **Nico, 06/11** : « occupe-toi des autres fenêtres alors ». Plan reformulé et validé (« oui ») : une règle commune, vérifier ce que chaque fenêtre ouvre, une preuve au navigateur, le rituel.

### 533b. Ce qu'on a trouvé
- **Six fenêtres partagent la coque `.mat-modal`** (`index.html`, `styles.css` : colonne flex, `max-height:92vh`, `overflow:hidden`) : la saisie en série des maturités, la couleur des parcelles, le réglage de la roue crantée (Cuvier et Chai), les fiches récolte, maturité et cuve — toutes ouvertes par `openOv`. **Aucun corps ne défilait.**
- ★ **Trois d'entre elles étaient écrites pour défiler** : `.mat-f-hd` et `.mat-f-pied` en `flex:none`, `.mat-f-liste` en `flex:1 1 auto; min-height:0; overflow-y:auto` — le schéma juste d'une feuille à liste. Mais leur parent (`#mat-saisie-corps`, `#mat-coul-corps`, `#creg-ed-corps`) était un bloc ordinaire : **des règles flex sur des éléments qui ne sont pas des éléments flex ne font rien**, sans un mot d'erreur. La liste prenait toute sa hauteur et poussait le pied — Enregistrer — sous la coupe.
- **Ce que chaque fenêtre ouvre passe devant elle** (vérifié) : la fiche maturité ouvre la saisie par `openOv`, la fiche récolte « Modifier » par `openOv` (CUVFICHE-1) ; les autres boutons restent dans la fenêtre. Rien à corriger de ce côté.
- **Retenu** : une règle commune `.mat-modal>[id$="-corps"]` (le corps remplit la fenêtre, peut rétrécir, défile), et une colonne `display:flex; flex-direction:column` pour les trois fenêtres à pied — leur liste défile entre l'en-tête et le pied, qui reste visible. Les fiches sans pied restent des blocs : en colonne, leurs marges verticales auraient cessé de fusionner, et leur mise en page aurait bougé. La règle de la fiche cuve (CUVFICHE-1, dans `_vendInjectCss`) rejoint la règle commune.
- ⚠️ **`styles.css` passe à 1 048 122 octets** — 454 sous le plafond de 1 024 ko que tient `mv-harnais-typo`. Le prochain style d'écran ira dans une feuille à part (comme `src/gt/console.css`, §531) ; `charte.css` ne reçoit que des réglages (couleurs, tailles), pas des mises en page.

### 533c. Mesuré
- **Dans Chromium, à 390 × 844**, avec les vraies `charte.css` et `styles.css`, avant (`8f3713a`) puis après, et la structure réelle de chaque fenêtre :

  | Fenêtre | Avant | Après |
  |---|---|---|
  | Saisie en série, 40 parcelles | Enregistrer et la dernière parcelle inatteignables | Enregistrer visible d'emblée ; la liste défile jusqu'à la dernière |
  | Couleur des parcelles, 30 | idem | idem, corrigé |
  | Réglage du Cuvier (court) | bouton visible | inchangé |
  | Fiches récolte, maturité, cuve (longues) | bouton du bas inatteignable | le corps défile jusqu'à lui |

  ⚠️ **Le premier passage disait tout invisible, même le réglage de 177 px** : la coque monte par une animation (`slideUp`), et on mesurait pendant la montée. Animations coupées, les chiffres sont ceux ci-dessus. Le script de cette preuve est resté hors du dépôt (un `--navigateur` dans le harnais demanderait Chromium dans la CI).
- `mv-harnais-fenetres1` (neuf) : **9 assertions, 7/7 mutants**. Il lit le texte et garde l'invariant pour les fenêtres à venir : un corps en « -corps » pour chaque coque ; tout corps rempli par une fonction qui écrit `.mat-f-pied` est en colonne. ⚠️ Un mutant (« une fiche gagne un pied ») est d'abord passé : le harnais cherchait la fonction autour de `m.index + 1`, donc avant le mot `function` entier, et lisait la précédente.
- `mv-harnais-cuvfiche1` lit la règle commune dans `styles.css` (son mutant « la fiche ne défile plus » suit) — 23 verts, 15/15.
- Preflight 0 erreur ; `matu1`, `rec1`, `cuves1` (et leurs contre-épreuves), version, annonces, typographie, couches, cliquets : verts. Aide et guide 08 relus : rien à changer.
- **La chaîne complète, sur le code final : 678 commandes, 0 rouge.** Jouée par tranches (le bac à sable coupe un appel à 300 s) : 1 à 215 ; `icones-contre` seule ; 217 à 229 ; 230 à 589 ; 590 à 678. Construction (`vite build`) verte.
- **Tutos concernés** : aucun (11 tutos) ; **le panneau côte à côte était à rejouer** (`styles.css` touché) : rejoué sur la construction finale, vert aux trois tailles (1280, 1536, 1920).

### 533d. Ce qui reste ouvert
- **À vérifier chez Nico** et **vu en route** (la fiche récolte ne se repeint pas après « Modifier ») : §28, bloc FENETRES-1.

## 534. ★★ PACK-1 — PROTÉGER LE CODE : UN ZIP REMPLACE LE CLONE QUAND LE DÉPÔT EST PRIVÉ ; LA LICENCE (06/11 — `scripts/mv-pack-claude.mjs` (neuf) · `package.json` · `LICENSE` (neuf) · `CLAUDE.md` · `.mv-base` — base `6dc415d` « fenetres1 » — APP 10.67 inchangé, SW 11.58 inchangé)

### 534a. D'où ça vient
Nico est suivi sur les réseaux par des éditeurs de logiciels viticoles et veut protéger son code, ses données et sa méthode. Constat du 06/11 : le dépôt est **public** — `functions/` (le serveur, invisible autrement), `firestore.rules`, `storage.rules`, CLAUDE.md et tout `docs/claude/` (la méthode, le backlog), les lots. Il l'était **par nécessité** : le clone anonyme de Claude. Contrainte posée par Nico : passer en privé **sans ralentir** le travail.

### 534b. Ce qui est livré
- **`npm run pack-claude`** → `scripts/mv-pack-claude.mjs`, pur Node (aucun git requis, le poste de Nico n'a que GitHub Desktop) : copie le dossier sans `.git`, `node_modules`, `dist`, `.firebase`, `gt.html`, `.env*`, ni fichier de clé (`*.pem`, `*.key`, `*.p12`, `service-account*.json`) ; écrit `PACK-INFO.txt` (date, commit lu dans `.git` sans git) ; zippe par `Compress-Archive` sous Windows, `zip` ailleurs. Sortie : `..\mavigne-dev-claude.zip`, **hors du dépôt** (jamais commité).
- **`CLAUDE.md`** (ouverture et Environnement de Nico) : deux modes d'accès ; ordre de recherche en tête de session **zip → clone → le dire à Nico** ; fraîcheur du mode zip = le commit de `PACK-INFO.txt`.
- **`LICENSE`** : tous droits réservés, aucune licence accordée.
- ⚠️ **Non livré exprès : `public/cgu.html`.** Les clients signent la version avec son empreinte SHA-256 : toute modification est une v1.2 + ré-acceptation, donc un lot à part. La clause « article 7 bis — restrictions d'usage » est proposée hors dépôt.

### 534c. Vérifié
- **Le zip** : 13,1 Mo, 986 entrées, aucune sous `node_modules`, `.git/`, `dist/`, ni `.env` ; `PACK-INFO.txt` porte le commit. ⚠️ **Testé sous Linux seulement** : la branche Windows (`Compress-Archive`) n'a jamais tourné ici — le premier lancement chez Nico en est la preuve.
- **Audit du dépôt** : aucune clé privée ni jeton dans HEAD ni dans l'historique. La clé `AIza…` de `src/firebase.js` est la clé web Firebase, publique par nature : elle se restreint par référents HTTP dans Google Cloud. Les commits portent l'adresse personnelle de Nico.
- ★ **Une erreur de ce lot, corrigée avant livraison** : un premier passage a lu dans le premier commit (`6756111`, « socle propre ») « l'adresse d'un tiers et des coordonnées de parcelles ». Relu : l'adresse est **celle de Nico** (`DEV_EMAILS`, encore dans `src/app.js`, donc dans le bundle servi), les coordonnées sont les **centres de Gevrey, Brochon et Fixin**. `DEV_MODULES` est vide : aucun module en développement ne part caché dans le bundle aujourd'hui. ⚠️ **Vrai, en revanche** : `scripts/mv-harnais-kml-fusion.mjs` porte un contour réel (« le vrai contour du fichier d'Alexandre », Vris Bas), dans HEAD et dans l'historique.
- `harnais-claude-md` : 63 vertes.

### 534d. Ce qui reste ouvert
- §28, bloc PACK-1.

## 535. ★★ RESTE-1 — L’ENTREPLANTATION GARDE CE QUI RESTE À PLANTER : LES TROUS MOINS LES PLANTÉS, D’UNE CAMPAGNE À L’AUTRE (06/11 — `src/comptes.js` (le bloc exécutable : `_cptComptes`, `_cptCompteCamp`, `_cptBilan`, `_cptPoser` à historique ; les lectures `_cptEtat`, `_cptReste`, `_cptResteA`, `_cptPrevus`, `_cptPlantesPer`, `_cptMarques`, `_cptPerces`, `_cptAPercer`, `_cptPlantesEntree`, `_cptStatutApres`, `_cptInvalider`) · `src/app.js` (`calcHeures`, `recalcTravaux`, la fiche, `openValidationPanel`, `confirmValidation`, `pQuickValidate`, `_plantParcReste`, `_plantFaitsTot`, `_recalcPlantationTrous`, `_mvReconPlan`) · `src/pilotage.js` (`_opParcReste`, `_ecoTvBar`, `_ecoTvEvents`) · `src/reglages.js` (la clôture, le document du vignoble) · `src/tracteur.js` (la tarière préremplie) · `src/utils.js` (APP, MV_AIDE Vigne, Tracteur, Réglages) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/05-saisons.html` · `guide/06-tracteur.html` · `scripts/mv-harnais-reste1.mjs` (neuf) · `scripts/mv-harnais-compte1.mjs` (réécrit) · `scripts/mv-harnais-robustesse-accueil.mjs` (ancre) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/RESTE-1.json` · **APP 10.67 → 10.68, SW 11.58 → 11.59**, base `f16f710`)

### 535a. D’où ça vient
Un client demande à Nico s’il perd « le nombre de trous » en clôturant sa campagne. Vérifié dans le code : la clôture (`_clotExec`) archive une copie et range `p.taches` sous le nom de l’ancienne période ; rien n’est effacé. Trois défauts sont apparus en route : (1) valider l’entreplantation voulait dire « parcelle finie », même deux plantés sur trois ; (2) le nombre de plantés tapé ÉCRASAIT `p.plantation_trous` (`confirmValidation`, `_cptAuValider`) ; (3) `_recalcPlantationTrous` resommait au chargement TOUTES les sessions de tarière, toutes années confondues — l’année suivante aurait ajouté ses trous à ceux, déjà plantés, de l’année d’avant. Règle de Nico (« go ») : **il reste les trous moins les plantés** ; 3 trous, 2 plantés → 1 ; l’an prochain, les nouveaux trous s’ajoutent dessus ; au repérage suivant, on ne compte que les nouveaux pieds marqués.

### 535b. Le modèle, et ce qui a été écarté
- Les trous et les plantés ne sont plus des champs de la parcelle : ils se **relisent dans les événements** — les sessions d’une activité qui alimente les trous (jour : `x.d` de FERTI-9, sinon le chrono, sinon la session), les validations `Validé` d’une tâche à trous (une annulation ensuite les retire : `_mvAnnulee`, la source unique d’ARRACH-8 ; sans nombre = « tout ce qui restait »), les comptes du repérage (un par campagne).
- `_cptBilan(p, ev, campDe, jusqua)`, dans le bloc exécutable (aucune dépendance : l’axe de campagne passe en argument) : campagne par campagne (`_mvCampagneDe`, 1er août), le compte de la campagne s’ajoute aux marqués pas encore percés ; un trou percé consomme un marqué ; un planté bouche un trou, sinon un marqué (trou fait à la main), jamais sous zéro ; les trous ouverts et les marqués pas encore percés passent à la campagne suivante. Le « plus grand des deux » de COMPTE-1 en est le cas d’une seule campagne (rejoué : 120/60 → 120, 90 sur 80 → 90).
- Écarté : **un report posé à la clôture** (`p.trous_report`). La clôture n’est pas obligatoire, les périodes ne coïncident pas avec les campagnes, et une session corrigée après coup n’aurait jamais rectifié le report. Le calcul relu suit tout, sans déclencheur.
- Écarté : **le reste sur toute l’histoire, sans campagne** (Σ trous − Σ plantés). Le compte du repérage est un ÉTAT (« combien de pieds sont marqués »), pas un ajout : corrigé après la tarière, il aurait compté deux fois.
- **Le compte repart à chaque campagne** : un compte d’une autre campagne n’est pas écrasé, `_cptPoser` le range dans `p.trous_marques_hist` (« Annuler » l’en ressort) ; `_cptMarques` ne rend que celui de la campagne en cours (« pas encore compté » après le 1er août). Un compte sans date vaut pour la campagne du jour (`campDe('')`).
- **Période et campagne** : les trous prévus d’une période = les pieds plantés pendant (rattachés par `_saisonForDate`) + ce qui reste à sa fin (aujourd’hui si elle court). L’avancement compte les plantés de toutes les parcelles, finies ou en cours (`_plantFaitsTot`), plus seulement les validées.
- **Plantée en partie → « En cours »** : `_cptStatutApres`, après l’écriture (feuille de la fiche, « Valider » d’un appui). Pas de feuille « c’est fait » : un message dit le reste. La reconstruction depuis le journal (🩹) laisse « En cours » une parcelle qui garde du reste.
- **Pilotage** : `_opParcReste` lit le reste ; `_ecoTvBar` prend les pieds de la validation (sans nombre : ce qu’elle a planté d’après les comptes, `_cptPlantesEntree`), plus jamais le total brut de la tarière ; RÉAL-1 ne retire plus le barème d’une deuxième validation d’une tâche à trous — une entreplantation se plante en plusieurs fois.
- `p.plantation_trous` reste écrit par `_recalcPlantationTrous`, pour mémoire ; plus aucune règle ne le lit. Le document du vignoble affiche le reste ; l’écran de clôture dit combien de pieds passent à la suivante.
- **Le cache** (`_cptIdx`) : même empreinte que `_mvAnnulIdx` (journal et sessions), plus un compteur que les écrivains font avancer (`_cptInvalider` : validation, annulation, compte posé, session changée via `_recalcPlantationTrous`) ; les comptes de la parcelle entrent dans la clé de l’état.

### 535c. Ce qui a été vérifié
- `mv-harnais-reste1` (neuf) : l’appli entière dans Node — 30 trous, la feuille préremplie à 30, 20 plantés → « En cours » et 10 qui restent, l’avancement 46 / 20 / 43 %, la fiche, l’écran de clôture (« 26 pieds encore à planter »), la vraie clôture, un an plus tard 10 reportés, +5 trous → 15, « Valider » sans nombre → 15 plantés et validée, l’annulation de l’administrateur → 15 reviennent, la période d’avant consultée → 30 prévus (20 + 10). 25 vertes ; 6 contre-épreuves, chacune dans un processus à part.
  ⚠️ `currentUser` est une variable du module app.js : le `window.currentUser` du chargeur ne l’atteint pas, et une validation lit `currentUser.nom`. Le harnais pose la personne dans sa copie d’app.js (hors dépôt). Et l’horloge figée donnait le même id à deux saisies du même instant : une annulation ne se rangeait plus après sa validation — le harnais fait avancer `Date.now()`.
- `mv-harnais-compte1` réécrit : 21 règles exécutées + 16 de câblage, 37 vertes ; 9 contre-épreuves.
- ★ **MANQUE-1 a trouvé un vrai défaut du lot** : dans un domaine sans session, `_recalcPlantationTrous` ne tourne pas, et l’état gardé avant la pose d’un compte resservait — le constat « aucun pied compté » restait. Correctif : les comptes de la parcelle dans la clé de l’état. Rien d’autre ne l’aurait vu.
- `mv-harnais-robustesse-accueil` : l’ancre de la contre-épreuve « NaN h » suit la nouvelle ligne de la fiche (5 sur 5 rougissent).
- **La chaîne complète** (680 commandes) : deux rouges, tous deux du lot, corrigés — `mv-harnais-portes` (le groupe du harnais neuf n’existait pas : rangé sous `entreplantation-pieds-marques`) et `mv-harnais-typo` (« un module enfle de plus de 5 % » : `src/comptes.js` 23 → 36 ko ; la question du découpage posée — la règle des trous vit ici, source unique, et le module reste petit — puis cliquet regravé, `scripts/typo-baseline.json`). Les deux et leurs contre-épreuves rejoués verts ; les 230 dernières commandes rejouées après correction : 0 rouge.
- **Construit** (`vite build`, `version.json` 10.68) ; le seul tuto concerné, « noter le stade d’une parcelle » (`openDP` a changé), rejoué au téléphone, à l’ordinateur, au panneau et au miroir : vert.
- ⚠️ Non vu au navigateur : le message « reste N à planter », la ligne de l’écran de clôture, la ligne de la fiche.

### 535d. Ce qui reste ouvert
- §28, bloc RESTE-1.

## 536. ★★ MODELES-1 — LES MODÈLES DE SEMAINE SE COMPTENT EN MODÈLES : LE RANGEMENT PAR ANNÉE N’EST PLUS REFUSÉ, UNE VRAIE PERTE SE VOIT (06/11 — `src/firebase.js` (`_mvModelesCount` neuf, `_mvDocSize`, `_MV_GUARD_FLOORS` : `planning_templates` 1 → 2) · `scripts/preflight.mjs` (C20 : le compteur évalué, cinq cas) · `scripts/mv-harnais-modeles1.mjs` (neuf) · `scripts/mv-harnais-valid1.mjs` (repère) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/MODELES-1.json` · **APP 10.68 inchangé, SW 11.59 inchangé**, base `27a2048`)

### 536a. D’où ça vient
Un rapport critique de la console GT (06/11, 14 h 17) : `fbSave planning_templates BLOQUE (anti-ecrasement)`, `cur=5 new=1`, écran Planning, un compte administrateur d’un domaine client. Rien de perdu : la garde a refusé l’envoi ; la saisie est au coffre de son téléphone (Réglages › Saisies non enregistrées). La cause, mesurée sur le code puis confirmée sur ses données par Nico (`fbAdminRead('<domaine>','planning_templates')` → cinq noms de modèles, aucune année) : ses modèles sont restés à l’ANCIENNE forme, à plat. `renderPlanning` appelle `_planMigrateYears`, qui les range en mémoire sous `_MV_PLAN_BASE_YEAR` (2026) : 5 clés → 1. `_mvDocSize` comptait des clés ; la fusion de l’envoi rend la valeur du téléphone (le serveur n’a pas bougé depuis la base) ; 1 < 5 × 0,5 → refusé. Et à chaque essai : après le refus, la mémoire reprend la forme à plat du serveur, le rendu suivant la range de nouveau. Tout domaine resté à l’ancienne forme avec 3 modèles ou plus était bloqué de la même façon, pour tout geste qui enregistre les modèles (créer, enregistrer la grille, importer un CSV, supprimer).
Le défaut symétrique, trouvé en route : sur la forme par année, cinq modèles ramenés à un dans la même année laissaient une clé de chaque côté. La garde de `planning_templates` ne protégeait plus les modèles, seulement les années.

### 536b. Le modèle, et ce qui a été écarté
- `_mvModelesCount` : les modèles de chaque année (clé de quatre chiffres, la règle de `_planMigrateYears`), plus ceux de l’ancienne forme qu’aucune année ne porte déjà. Un modèle rangé sous 2026 ET resté à plat ne compte qu’une fois : la migration écarte ce doublon, il ne doit pas faire croire à une perte. Par construction, le rangement par année ne fait jamais baisser le compte. Même famille que `_mvIntrantsCount` et `_mvPaieCount` : un document conteneur se mesure à son CONTENU.
- **Plancher 2, plus 1** : compté en modèles, supprimer son dernier modèle (1 → 0) aurait été refusé — un geste à la main. Avant, l’année restait (`{2026:{}}` : 1 clé → 1 clé) et passait. À 2 rien ne change pour ce geste ; deux modèles effacés d’un coup restent refusés.
- **Écarté : écrire la forme par année au chargement** (ranger le serveur sans geste). Une écriture que personne n’a demandée, sur chaque domaine à l’ancienne forme, à l’ouverture du Planning ou du Pilotage (les deux appellent `_planMigrateYears`) — et pour rien : l’appli lit très bien l’ancienne forme. Le premier enregistrement de modèle l’écrit rangée, maintenant qu’il passe.
- **Écarté : retirer `planning_templates` de la garde**, ou l’exempter pendant le rangement. Elle ne protégeait presque rien (des années) ; elle protège maintenant les modèles.
- **Écarté : corriger la donnée du client depuis la console** (`fbAdminWrite`). Inutile une fois le compte juste, et une écriture GT dans les données d’un client sans geste de sa part.
- Effet voulu : l’écran de restauration d’une sauvegarde compte « Modèles de semaine » avec le même compteur (`window._mvTailleDoc`). Il dit le nombre de modèles, plus le nombre d’années ; une sauvegarde rangée par année, restaurée sur l’ancienne forme, ne s’affiche plus en baisse rouge (5 → 1).

### 536c. Ce qui a été vérifié
- `scripts/mv-harnais-modeles1.mjs` (neuf) : les vraies fonctions, extraites des fichiers — la fusion (`_mvFusion` et ses aides), `_mvDocSize`, `_mvModelesCount`, les deux chemins de la garde (`_mvSauverFusion` sur une transaction simulée ; `_mvBlockDestructive`, la file et le coffre) et `_planMigrateYears` de planning.js. Le cas vécu rejoué : cinq modèles à plat rangés sous 2026, un modèle créé passe, le serveur reçoit la forme par année avec les cinq intacts ; la même saisie reprise du coffre passe ; 3 et 2 modèles passent ; une vraie perte dans une année est refusée (l’alerte dit `cur=5 new=1`) ; l’année vidée et l’ancienne forme écrasée sont refusées ; les suppressions une à une passent jusqu’au dernier ; la forme mêlée passe ; la règle des quatre chiffres est la même dans les deux fichiers. 23 vertes ; 5 contre-épreuves tenues sur 5, chacune dans un processus à part.
- `scripts/preflight.mjs` C20 : `_mvModelesCount` évalué, cinq cas de plus dans la table de la garde.
- ★ **Trouvé en route, hors de ce lot : `mv-harnais-valid1 --contre` était rouge sur la base** (`27a2048`). RESTE-1 (§535) a inséré `var _cptStA=…` entre `JOURNAL.unshift(_mvEqApplique(jEntry));` et `recalcTravaux(_validTache);` dans `confirmValidation` : la contre-épreuve « la feuille attend de nouveau la météo » ne trouvait plus son repère (« non injecté », 9/10). La protection elle-même était intacte (31 vertes). Le lanceur s’arrête au premier rouge, et `npm run build` le lance d’abord : **aucune construction n’était possible depuis RESTE-1.** Repère suivi, 10/10.
- Ce qui n’a pas pu être vu : les données des autres domaines (combien sont restés à l’ancienne forme) ; le geste « Renvoyer » du coffre sur un vrai téléphone.

### 536d. Ce qui reste ouvert
- §28, bloc MODELES-1.

## 537. ★★ CPJOURS-1 — LES CONGÉS SE DÉCOMPTENT PAR PÉRIODE : UNE SEMAINE DE CONGÉ COMPTE SES JOURS DE REPOS (06/11 — `src/planning.js` (`_planCpJours`, `_planCpAjout`, `_planCpCle` neufs ; `_planCpPris` ; `_planCpPlan` ; `_planCpSelBuild` ; la note de la fenêtre de pose) · `src/whats-new.js` · `src/utils.js` (APP) · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-cpjours1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `docs/maquettes/maquette-planning-annee-v2.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `.mv-base` · `lots/CPJOURS-1.json` — base `677ef67` « modeles1 » — **APP 10.68 → 10.69, SW 11.59 → 11.60**)

### 537a. D’où ça vient
Nico (06/11), en pleine maquette du planning de l’année : « quand je prends une semaine de congé du lundi au vendredi, notre convention c’est 6 jours ; si c’était un jour où je ne travaillais pas le mercredi, ça compte que 4 jours ». Mesuré : `_planCpPris` comptait les jours portant une saisie `cp` (lundi→samedi en ouvrables, lundi→vendredi en ouvrés), plus le samedi qui suit un vendredi posé. La pose depuis la grille ne prend que les cases cochées : le mercredi de repos (0 h) n’est pas coché, il manque. L’outil « Poser des congés » du … au … le posait (saisie à 0 h) et tombait juste sur ce cas — mais faux sur deux autres : lundi-mardi avant un mercredi de repos (2 au lieu de 3), une période qui commence un jour de repos (un jour de trop).
La règle, vérifiée : fiche service-public (« le lundi, le mardi et le mercredi même si le salarié ne travaille pas ce jour »), Cass. soc. 23/02/2000 (le premier jour où il aurait dû travailler, puis tous les jours ouvrables jusqu’à la reprise), jours ouvrés admis s’ils ne sont pas moins favorables — ceux de l’entreprise, pas ceux du salarié —, fériés chômés exclus ; accord national du 23/12/1981, art. 3. Le réglage 5 ou 6 jours reste celui du domaine (Nico : « chaque domaine est différent, il ne faut pas que ça bloque »).

### 537b. Le modèle, et ce qui a été écarté
- **Une période** = des jours posés reliés par des jours de repos (6 au plus d’affilée), prolongée par ses jours de repos jusqu’à la veille de la reprise (6 au plus ; au-delà, le seul samedi qui suit — la règle d’avant). **Départ** : le premier jour où il aurait travaillé (travail prévu, ou fermeture). **Compte** : lundi→samedi (ouvrables) ou lundi→vendredi (ouvrés), hors fériés, dimanches, hors contrat, dans la période de référence. Jour de repos = sans travail prévu, sans autre saisie, dans le contrat.
- ★ **Le piège évité : les fermetures à 0 h des modèles 2026** (trois semaines d’août). Prises pour des jours de repos, un congé posé la veille aurait avalé toute la fermeture, et une fermeture posée en congé (saisies à 0 h) n’aurait plus rien compté — aucun jour « travaillé » pour partir. Règle : un jour ouvré à 0 h dans une semaine entièrement à 0 h est une fermeture, une borne et un départ valable (cas H et I du harnais).
- **L’aperçu n’a plus sa propre règle** : `_planCpAjout` = le solde après moins le solde avant, par `_planCpJours`, sur les deux chemins de pose (période, sélection). `_planCpCount` reste écrite — ancre de `mv-harnais-ctx-planning` — mais n’est plus appelée.
- Écarté : poser des saisies `cp` sur les jours de repos au moment de la pose (le compte doit tenir pour les poses déjà faites, et une saisie à 0 h n’apporte rien) ; toucher au réglage 5/6.

### 537c. Ce qui a été vérifié
- `scripts/mv-harnais-cpjours1.mjs` (neuf) : les vraies fonctions extraites de `planning.js`, 2027 et ses fériés réels, quatre modèles fictifs — 23 cas (A à N, et le câblage des deux chemins de pose), 6 contre-épreuves tenues ; « les jours de repos ne comptent plus » rend 4 au cas A, le chiffre que voyait Nico.
- Ce qui n’a pas pu être vu : les soldes réels des domaines (un décompte peut monter d’un ou deux jours, voir §28) ; la fenêtre de pose sur un vrai téléphone.

### 537d. Ce qui reste ouvert
- §28, bloc CPJOURS-1.

## 538. ★★ BASEAN-1 — LA BASE DE L’ANNÉE REMPLACE LES 1 607 H, ET LA JOURNÉE DE SOLIDARITÉ SE RÈGLE DANS LA ROUE CRANTÉE (06/11 — `src/planning.js` (`_planBaseActive`, `_planJoursSem`, `_planBaseAn`, `_planSolid*`, `_planFerieMbr`, `_planCreditFerie`, `_planSemFermee`, `_planCompteH`, `_planCompteMonth`, `_planModelBrut`, `_planBaseAttendue`, `_planBaseCarte`, `planSaveSolid`, `planSolidMode` neufs ; `_planPlanned` ; `_planAnnuPlafond` ; `_planAnnu` ; `_planMajMonth` ; le bloc DIM-3 ; `_planDfMois` ; la carte du compteur ; Le cadre ; `planSaveLegal` ; le planning imprimé) · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `src/tutos.js` (le tuto « solidarite ») · `index.html` (APP, `data-tuto="plan.roue"`) · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-basean1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-effectif-periode.mjs` · `scripts/mv-harnais-majoration.mjs` · `scripts/mv-harnais-retard.mjs` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/BASEAN-1.json` — base `f5eae4f` « cpjours1 » — **APP 10.69 → 10.70, SW 11.60 → 11.61**)

### 538a. D’où ça vient
Lot 2 du chantier « le planning de l’année » (maquette v2, validée le 06/11). Le compteur annuel comparait le **travail effectif** à 1 607 h ; les modèles portaient les congés en fermetures à 0 h. Nico (06/11) : le domaine n’est jamais vraiment fermé, les congés se prennent au cas par cas — « il faut faire quelque chose avec les congés payés, ça fausse tout ». La règle validée : le planning ne porte plus de congés ; un congé et un férié chômé comptent les heures prévues ce jour-là ; la base = 35 h par semaine en moyenne, calculée sur le calendrier. La journée de solidarité, tranchée le 06/11 : « nous, nous la travaillons, étalée sur l’année ; certains la travaillent un férié, d’autres ne la travaillent pas — fais au plus large ».
Vérifié (chronique juridique FRSEA 2025, fiches officielles) : 7 h de travail en plus, non payées, au prorata d’un temps partiel ; un férié chômé autre que le 1er mai, un jour de repos de l’annualisation, ou toute autre organisation (fractionnée en heures si ce sont vraiment 7 h de plus) ; jamais un jour de congé, ni un dimanche, ni au-delà de 48 h dans la semaine ; moins de 18 ans dispensés quand c’est un férié ; embauché en cours d’année : les 7 h entières ; déjà faite ailleurs : peut refuser, sinon payée ; absent le jour fixé : pas reportée ; pas de majoration de férié ; Alsace-Moselle : ni le 25 ou le 26 décembre, ni le Vendredi saint.

### 538b. Le modèle, et ce qui a été écarté
- **À partir de 2027 seulement** (`CONFIG.base_annee_depuis`, 2027 par défaut) : 2026 tourne encore sur des modèles à fermetures ; y appliquer la base aurait crédité 0 aux congés posés sur ces fermetures et creusé un faux déficit. Une année commencée ne change pas de règle.
- **Le crédit d’un férié** : le modèle met 0 un férié ; on prend le même jour de la semaine, une ou deux semaines avant ou après, **le même mois d’abord** (les modèles changent de rythme au 1er : l’Ascension 2027 vaut un jeudi de mai, 8 h 30, pas d’avril). Un férié prévu travaillé au modèle n’est pas crédité.
- **Le jour de solidarité garde son crédit de férié**, et ses 7 h de travail viennent EN PLUS, face aux 7 h ajoutées à la base : le compte reste juste quel que soit le férié choisi (même un jour prévu à 8 h 30). Écarté : retirer le crédit et faire dépendre la base des heures du jour (juste, mais illisible).
- **7 h prévues ce jour-là** (`_planPlanned`, modes férié et autre jour), au prorata du modèle (`_planSolidRatio`, ses fériés compris, arrondi au centième ; au-dessus de 90 % de la base, un temps plein) : la journée travaillée n’est pas une heure sup. **Non majorée** : `_planFerieMbr` remplace `_planFerie` dans `_planMajMonth`, le bloc DIM-3 et `_planDfMois`.
- **Un congé posé sur une semaine entièrement à 0 h** vaut 7 h (la lecture de fermeture de CPJOURS-1) : un modèle importé avec des fermetures reste lisible.
- Écarté : écrire les 7 h dans les grilles des modèles (une écriture de données à défaire à chaque changement de choix) ; une option « 1 607 h fixes » à côté de la base (Nico : « au plus large », mais la base est la règle de l’accord agricole, et 2026 garde 1 607 h).

### 538c. Ce qui a été vérifié
- `scripts/mv-harnais-basean1.mjs` (neuf) : les vraies fonctions, 2027 et ses fériés réels, un modèle d’équipe « domaine ouvert » aux rythmes de la maquette — 32 cas (bases 2026 à 2032, crédits des fériés, modèle juste à 1 827 h, congés d’août et d’octobre neutres, fermeture à 7 h, temps partiel, les quatre choix de solidarité et les dispenses), 6 contre-épreuves tenues.
- `_planPlanned` et `_planMajMonth` ont de nouvelles dépendances : `mv-harnais-effectif-periode`, `mv-harnais-majoration` et `mv-harnais-retard` les extraient désormais aussi (les vraies fonctions, rien n’est simulé), verts. La contre-épreuve DIM-3 de `mv-harnais-recup` visait l’ancienne ligne `_planFerie(y.m,y.d)` : son motif suit `_planFerieMbr`, même défaut — 90 défauts sur 90 détectés.
- **Le tuto « Comment faire pour régler la journée de solidarité ? »** (`solidarite`, Planning, admin) : la roue crantée (`data-tuto="plan.roue"`, posé dans `index.html`), « Étalée sur l’année », « Enregistrer » ; il passe d’abord le Planning sur 2027 (`avant`, la vue seulement). Il couvre `planSolidMode` et `planSaveSolid` : gestes sans tuto 801, le plafond tenu. Rejoué sur le build : téléphone, ordinateur, panneau et miroir, 4 étapes sur 4.
- Rejeu local des tutos : le Playwright de `npm ci` attend un navigateur plus récent que celui du poste ; il a été relié à celui de `/opt/pw-browsers` (sans incidence sur le dépôt).
- Ce qui n’a pas pu être vu : la carte de Le cadre et la fiche sur un vrai téléphone ; le relevé d’un mois portant un jour de solidarité férié.

### 538d. Ce qui reste ouvert
- §28, bloc BASEAN-1.

## 539. ★★ FRISE-1 — L’ANNÉE D’UN MODÈLE, EN FRISE : LA GRILLE RELUE EN SAISONS (06/11 — `src/planning.js` (`_planAnneeLire`, `_planAnneeSaison`, `_planAnneeTon`, `_planAnneeDate`, `_planAnneePlage`, `_planAnneeJours`, `_planRenderAnnee`, `planAnneeOuvrir`, `planAnneeFermer`, `PLAN_MOIS_C` neufs ; `_planRenderCadre` ; la carte d’un modèle) · `src/tutos.js` (le tuto « annee ») · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frise1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/FRISE-1.json` — base `5f473d9` « basean1 » — **APP 10.70 → 10.71, SW 11.61 → 11.62**)

### 539a. D’où ça vient
Lot 3a du chantier « le planning de l’année » : la maquette v2 (validée le 06/11) décrit l’année « mois par mois » — une frise, une semaine type par saison, une barre par semaine. Avant de pouvoir la modifier là (lot 3b), on la lit : la grille de 365 cases, telle qu’elle est, relue en saisons.

### 539b. Le modèle, et ce qui a été écarté
- **La semaine type d’un mois** : pour chaque jour de la semaine, les heures les plus fréquentes de ses jours, fériés et semaines fermées mis à part ; à égalité, la première rencontrée (novembre 2026 : deux vendredis à 4 h, deux libres → 4 h, les deux libres en jours à part). Les mois voisins de même semaine type font une saison : les modèles changent de rythme au 1er du mois.
- **Une semaine à part** : 3 jours ou plus qui s’écartent de leur mois (les vendanges : lundi→samedi 7 h). **Un jour à part** : ce qui s’écarte encore (le jeudi 7 mai 2026 court devant le vendredi 8 férié, la veille de Noël). **Une fermeture** : une semaine dont les jours ouvrés hors fériés sont tous à 0 h, semaines voisines réunies.
- **La vue loge dans `_planEditing={annee}`** : `_planCadreOpen` remet `_planEditing` à zéro, la roue rouverte repart donc de la liste sans le toucher (son texte est tenu par `mv-harnais-regl-module`).
- Écarté : couper les mois en deux à la lecture (une coupe se décide, elle viendra avec l’édition) ; des couleurs écrites en dur (la rampe prend les jetons de la charte : vert, or pâle, or clair, terre, accent).

### 539c. Ce qui a été vérifié
- `scripts/mv-harnais-frise1.mjs` (neuf) : les vraies fonctions et la VRAIE grille 2026 du modèle « standard » — six saisons, quatre fermetures, la semaine de vendanges, quatre jours à part, tous attendus d’une lecture à la main avant le premier passage ; un modèle 2027 « domaine ouvert » ; 11 cas, 4 contre-épreuves tenues.
- Le tuto « Comment faire pour voir l’année d’un modèle ? » couvre `planAnneeOuvrir` et `planAnneeFermer` (gestes sans tuto : plafond tenu).
- Ce qui n’a pas pu être vu : la frise sur les vrais modèles de Nico et sur un vrai téléphone.

### 539d. Ce qui reste ouvert
- §28, bloc FRISE-1.

## 540. ★★ FRISE-2 — L’ANNÉE D’UN MODÈLE SE RÈGLE SUR LA FRISE (07/11 — `src/planning.js` (`_planAnneeCopie`, `_planAnneeTotal`, `_planAnneeCible`, `_planAnneePose`, `_planAnneeReguliers`, `_planAnneePasVal`, `_planAnneeNomS`, `_planAnneeRetouches`, `_planAnneeSuggestions`, `_planAnneeGrille`, `_planAnneeJoursEd`, `planAnneePas`, `planAnneeJuste`, `planAnneeAppliquer`, `planAnneeEnregistrer`, `planAnneeAnnuler` neufs ; `_planRenderAnnee` ; `_planCreditFerie`, `_planModelBrut`, `_planSolidRatio`, `_planAnneeLire` lisent un brouillon) · `src/tutos.js` (le tuto « reglerannee ») · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frise2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (regravée) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/FRISE-2.json` — base `880c21a` « frise1 » — **APP 10.71 → 10.72, SW 11.62 → 11.63**)

### 540a. D’où ça vient
Lot 3b du chantier « le planning de l’année », première part : la maquette v2 règle l’année sur la frise, saison par saison, et « Tomber juste » propose les retouches. FRISE-1 (§539) la lisait ; FRISE-2 la règle.

### 540b. Le modèle, et ce qui a été écarté
- **Une saison − / +** (`planAnneePas`, le jour de la semaine choisi) va à ses **jours réguliers** — ceux qui suivent sa semaine type : jours à part, semaines à part et fermetures ne bougent pas (le jeudi 7 mai 2026 garde ses 5 h quand les jeudis d’été passent à 9 h). Un jour réduit ne descend pas sous 3 h 30, ni au-dessus du maximum du cadre.
- **« Tomber juste »** (`_planAnneeSuggestions`) : les retouches d’une saison (jours courts ± 30 min ou 1 h, jours longs ± 30 min), la veille de Noël et de la Saint-Sylvestre (± un jour à part), une semaine de plus prise sur la saison voisine ; une ou deux, dans le sens de l’écart, la juste d’abord. Sur le modèle 2027 de la maquette, 1 827 h 30 pour 1 827 h : d’abord le jeudi 23 décembre à 6 h 30, comme au 24 décembre 2026.
- **Un brouillon** (`_planEditing.brouillon`) : la grille de l’année copiée au premier geste ; le compte, la frise, le cadre le lisent (paramètre `G`). « Enregistrer » écrit les douze mois de l’année du modèle et garde ses clés d’horaires (`_timings`, `_timings_jour`, `_horaires_dma`) ; « Annuler » le jette ; « Retour sans enregistrer » le dit.
- Écarté pour ce lot : couper un mois en deux et régler les semaines ou jours à part sur la frise (FRISE-3) ; effacer l’éditeur de 365 cases avant que la frise sache tout faire.

### 540c. Ce qui a été vérifié
- `scripts/mv-harnais-frise2.mjs` (neuf) : les vraies fonctions, la vraie grille 2026 du modèle « standard » et le modèle 2027 de la maquette — « Tomber juste » d’abord sur la veille de Noël, appliquer pose le total sur la base, le modèle enregistré ne bouge pas avant « Enregistrer », « Annuler », une saison − / + qui épargne la semaine fermée et le jour à part, l’enregistrement qui garde les horaires ; 11 cas, 4 contre-épreuves tenues.
- Le tuto « Comment faire pour régler l’année d’un modèle ? » couvre les cinq gestes ; chaque étape attend la précédente (au miroir, aucune ne passe pour faite trop tôt).
- **La taille des modules** : `mv-harnais-typo` a rougi — `src/planning.js` 682 → 725 ko, `src/tutos.js` 104 → 112 ko depuis la référence (au-delà des 5 % permis), BASEAN-1, FRISE-1 et FRISE-2 cumulés. La question du découpage posée : la frise (lecture, réglage, « Tomber juste ») est un bloc autonome, à sortir dans `src/planning-annee.js` au lot FRISE-3 ; la référence est regravée (`node scripts/mv-harnais-typo.mjs --baseline`, 31 fichiers), aucune autre mesure du cliquet ne remontant.
- Ce qui n’a pas pu être vu : sur les vrais modèles de Nico, et sur un vrai téléphone.

### 540d. Ce qui reste ouvert
- §28, bloc FRISE-2.

## 541. ★★ FRISE-3 — UN MOIS COUPÉ EN DEUX SE LIT ET SE DÉPLACE SUR LA FRISE ; LES JOURS ET SEMAINES À PART SE RÈGLENT (07/11 — `src/planning.js` (`_planAnneeLire` : coupes, semaines à part après elles, `x.s` ; `_planAnneeReguliers` ; `_planAnneeBrouillon`, `planAnneeCoupe`, `planAnneeJour`, `planAnneeRemettre`, `_planAnneeEtat` neufs ; `_planRenderAnnee`) · `src/tutos.js` (le tuto « coupe ») · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frise3.mjs` (neuf) · `scripts/mv-harnais-frise1.mjs` · `scripts/mv-harnais-frise2.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/FRISE-3.json` — base `3d910f1` « frise2 » — **APP 10.72 → 10.73, SW 11.63 → 11.64**)

### 541a. D’où ça vient
Lot 3b, deuxième part : la maquette v2 montrait « la fin d’année dès le 15 novembre ». FRISE-1 lisait chaque mois d’une seule semaine type : les vendredis libres de fin novembre sortaient en « jours à part ». FRISE-3 lit la coupe, la déplace, et règle les jours et semaines à part sur la frise.

### 541b. Le modèle, et ce qui a été écarté
- **Une coupe** : la fin (ou le début) d’un mois qui suit déjà la semaine type du mois voisin, sur au moins deux jours qui l’en distinguent ; elle part du lundi de la semaine où le premier jour se distingue (pas d’un samedi vide, ni d’un vendredi pareil des deux côtés). Novembre 2026 : la fin d’année dès le lundi 16.
- ★ **Les coupes avant les semaines à part** : au premier passage, une fin de février avancée sur mars sortait en « semaine à part » (4 jours qui s’écartent de février) et bloquait la coupe — vu par le harnais FRISE-3 ; les semaines à part se lisent désormais face à la semaine type de la saison du jour (`type[x.coupe ?? x.m]`).
- **Chaque jour a sa saison** (`x.s`) : la frise, les jours réguliers d’une saison (`_planAnneeReguliers`), les dates d’une saison (« 16 nov. → 31 déc. ») la lisent.
- **Les gestes** : « 1 sem. plus tôt / plus tard » sur la saison qui commence (`planAnneeCoupe` : les sept jours réguliers de part et d’autre prennent la semaine type de l’autre saison) ; un jour à part − / + (`planAnneeJour`) ; « comme la saison » pour un jour ou une semaine à part (`planAnneeRemettre`). Tous sur le brouillon de FRISE-2, chacun compté (`E.n`, lu par les tutos via `_planAnneeEtat`).
- Écarté : un sélecteur de date pour la coupe (un tuto ne sait pas choisir dans une liste native ; une semaine à la fois suffit) ; découper `planning.js` dans ce lot (reporté, §28).

### 541c. Ce qui a été vérifié
- `scripts/mv-harnais-frise3.mjs` (neuf) : les vraies fonctions et la vraie grille 2026 — la fin d’année dès le 16 novembre, mars avancé d’une semaine et sa coupe lue au 23 février, le jeudi 7 mai réglé puis remis comme la saison, la semaine de vendanges remise comme l’été, les gestes comptés ; 8 cas, 3 contre-épreuves tenues.
- `mv-harnais-frise1` : deux jours à part au lieu de quatre (le changement voulu, écrit dans le harnais) ; son motif « jours » et celui de `mv-harnais-frise2` (« réguliers ») suivent les lignes réécrites, mêmes défauts.
- Ce qui n’a pas pu être vu : sur les vrais modèles de Nico, et sur un vrai téléphone.

### 541d. Ce qui reste ouvert
- §28, bloc FRISE-3.

## 542. ★ ANNEE-DEC — L’ANNÉE D’UN MODÈLE SORT DE planning.js : `src/planning-annee.js` (07/11 — `src/planning-annee.js` (neuf : la frise de FRISE-1 à 3, ses emprunts, ses expositions) · `src/planning.js` (le bloc sort ; la frontière des emprunts ; `_planEditingGet` / `_planEditingSet` ; la roue appelle `window._planRenderAnnee`) · `src/app.js` (l’import, juste après `planning.js`) · `src/utils.js` (APP) · `src/whats-new.js` (annonce muette) · `index.html` · `public/sw.js` · `scripts/mv-harnais-anneedec.mjs` (neuf) · `scripts/mv-harnais-frise1.mjs` · `scripts/mv-harnais-frise2.mjs` · `scripts/mv-harnais-frise3.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (regravée à la baisse) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/ANNEE-DEC.json` — base `4cf131e` « frisr3 » — **APP 10.73 → 10.74, SW 11.64 → 11.65**)

### 542a. D’où ça vient
À FRISE-2 (§540c), `mv-harnais-typo` avait rougi : `planning.js` avait pris plus de 5 % depuis la référence. La référence avait été regravée sur une promesse — sortir la frise — reportée d’un lot à FRISE-3 (la frise bougeait encore), et notée « avant tout nouveau lot sur le Planning ». La voici tenue, sans rien changer à l’écran.

### 542b. Le modèle, et ce qui a été écarté
- **Le bloc entier de la frise** (FRISE-1 à 3, ~30 ko, de son commentaire de tête à `planOpenGridEditor` exclu) passe tel quel dans `src/planning-annee.js` : ses lignes ne changent pas, sauf l’état de la vue et deux variables.
- **Les emprunts gardent les noms du Planning** : `function _planGetTpl(){ return window._planGetTpl.apply(null, arguments); }` et 14 autres, en tête — le code de la frise reste lisible tel qu’il était, les harnais qui l’extraient trouvent la vraie fonction dans `planning.js` (lu en premier). `planning.js` expose les 9 qui ne l’étaient pas.
- **L’état de la vue reste dans `planning.js`** (`_planEditing`) : `_planCadreOpen`, dont `mv-harnais-regl-module` tient le texte, le remet toujours à zéro. La frise le lit par `_paE()` et l’écrit par `window._planEditingSet` — jamais par une copie (comme `_caveSectionAct()` pour le Cuvier).
- `PLANNING_ENTRIES[` et `PLAN_MOIS[` se lisent `window.…` dans la frise. Rien ne s’exécute au chargement : les emprunts lisent window à l’appel.
- Écarté : un module pur à dépendances injectées (comme `planning-vue.js`) — la frise touche l’écran et l’état, la frontière par window est le modèle du Cuvier ; renommer les emprunts (`_paTpl`…) — il aurait fallu réécrire la frise et les harnais.

### 542c. Ce qui a été vérifié
- `scripts/mv-harnais-anneedec.mjs` (neuf) : l’ordre d’import, l’import seul de `utils.js`, chaque emprunt exposé par `planning.js`, l’état par fonction, aucun `_planEditing` en direct, la frise sortie de `planning.js`, chaque geste exposé, le rendu appelé par window, rien d’exécuté au chargement ; 9 cas, 3 contre-épreuves tenues.
- FRISE-1, 2, 3 lisent les deux fichiers et restent verts avec leurs contre-épreuves (FRISE-2 : le motif « annuler » suit `_paE()`, les mois passent par window dans son bac).
- La taille : `planning.js` 748 → 718 ko, `planning-annee.js` 34 ko ; la référence regravée à la baisse.

### 542d. Ce qui reste ouvert
- Rien de propre au lot. La suite du chantier : les fermetures et les horaires sur la frise, puis effacer l’éditeur de 365 cases ; le lot 4 (programme indicatif, « Mon année ») ; le lot 5 (rythme sur deux semaines).

## 543. ★★ FRISE-4 — UNE SEMAINE SE RÈGLE SUR LA FRISE ; UNE ANNÉE VIDE SE CONSTRUIT (07/11 — `src/planning-annee.js` (`_planAnneeSemDefaut`, `_planAnneeSemSel`, `planAnneeSemaine`, `planAnneeFermeSem`, `planAnneeDesIci` neufs ; `_planAnneeLire` (une année vide sans fermetures) ; `planAnneeRemettre` (une semaine fermée se rouvre) ; `_planAnneeEtat` (la semaine) ; `_planRenderAnnee` (le bloc de la semaine, la semaine vue dans les barres, « Exporter (CSV) »)) · `src/tutos.js` (le tuto « semaine ») · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frise4.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (regravée) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/FRISE-4.json` — base `dbd98c5` « anneedec » — **APP 10.74 → 10.75, SW 11.65 → 11.66**)

### 543a. D’où ça vient
Pour effacer la grille de 365 cases, la frise devait savoir tout ce qu’elle fait : régler n’importe quel jour, poser et retirer une fermeture, construire un modèle vide. La grille n’éditait que les heures par jour et exportait en CSV — pas les horaires.

### 543b. Le modèle, et ce qui a été écarté
- **Une semaine choisie** sous la frise : « Précédente » / « Suivante » (par défaut la semaine d’aujourd’hui si l’année est l’année en cours, sinon la première qui travaille) ; elle se voit dans les barres (un contour). Ses jours se règlent un par un (`planAnneeJour`, déjà là pour les jours à part, vaut pour n’importe quel jour).
- **Fermer / rouvrir** : « Fermer la semaine » met ses jours (hors fériés) à 0 — la frise la lit fermée ; « Rouvrir comme la saison » est `planAnneeRemettre` sur la semaine, qui inclut désormais les jours fermés.
- **« Changer le rythme à partir d’ici »** : un jour de la semaine, sur les jours réguliers de la saison de cette semaine, d’elle jusqu’à la fin de la saison. La lecture de FRISE-3 y voit une coupe : une nouvelle saison naît sans qu’on la « crée » (la frise est lue des heures, jamais d’une liste de saisons).
- **Une année vide n’a pas de fermetures** : sans aucune heure, chaque semaine serait « fermée » et aucune retouche n’aurait de jour régulier ; vide, elle a une seule saison à zéro, que − / + construit.
- Écarté : des barres de semaine cliquables (trop fines au téléphone ; une `<div>` cliquable sans clavier) — « Précédente / Suivante » ; un sélecteur de date (un tuto ne choisit pas dans une liste native).

### 543c. Ce qui a été vérifié
- `scripts/mv-harnais-frise4.mjs` (neuf) : la vraie grille 2026 — la semaine du 12 janvier fermée puis rouverte, le vendredi dès la semaine du 19 octobre (et pas le 16), la nouvelle saison lue dès le 19 octobre, « Suivante » ; une année vide sans fermeture, son lundi construit ; 8 cas, 3 contre-épreuves tenues.
- Le tuto « Comment faire pour régler une semaine d’un modèle ? » couvre les trois gestes neufs ; chaque étape attend le geste compté de la précédente.
- **La taille** : `mv-harnais-typo` a rougi sur `src/planning-annee.js`, 33 → 40 ko (+7 ko, +21 %) — la question du découpage posée : un fichier de 40 ko ne se découpe pas (la règle des 5 % vise les gros modules) ; référence regravée (`scripts/typo-baseline.json`).
- Ce qui n’a pas pu être vu : sur les vrais modèles de Nico, et sur un vrai téléphone.

### 543d. Ce qui reste ouvert
- §28, bloc FRISE-4.

## 544. ★★ FRISE-5 — LA GRILLE DE 365 CASES LAISSE LA PLACE À LA FRISE (07/11 — `src/planning.js` (`planOpenGridEditor`, `_planRenderGridEditor`, `planEditorSetMonth`, `planUpdateDay`, `planCloseGridEditor` et leurs expositions retirés ; le bouton « Modifier » ; `_planRenderCadre` ; `planCreateTemplate`) · `index.html` (APP, un commentaire) · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frise5.mjs` (neuf) · `scripts/mv-harnais-recalage.mjs` · `scripts/mv-harnais-regl-module.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (regravée à la baisse) · `scripts/tutos-couverture.json` (plafond 801 → 796) · `scripts/preflight-baseline.json` (C24b de planning.js 23 → 20) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/FRISE-5.json` — base `dfa67fd` « frise4 » — **APP 10.75 → 10.76, SW 11.66 → 11.67**)

### 544a. D’où ça vient
Le plan du chantier (06/11) : « l’éditeur de 365 cases s’efface » quand la frise sait tout faire. Depuis FRISE-4 (§543), elle règle n’importe quel jour, pose et retire une fermeture, construit un modèle vide et exporte en CSV — tout ce que faisait la grille (elle n’éditait ni les horaires ni les codes).

### 544b. Le modèle, et ce qui a été écarté
- **Retirés** : les cinq fonctions de l’éditeur, leurs quatre expositions, le bouton « Modifier », la route `if(_planEditing){_planRenderGridEditor();return;}` de la roue. `_planEditing` ne porte plus que `{annee}` (et le brouillon).
- **Un modèle neuf s’ouvre sur son année** (`window.planAnneeOuvrir(id)`) : vide, il n’a pas de fermetures et se construit avec − / + (FRISE-4).
- ★ **La leçon du recalage survit à `planUpdateDay`** : « avec PLAN_DEF brut, toucher une seule case de janvier 2027 recopiait le janvier 2026 entier dans la base » (le commentaire parti avec la fonction). La frise part de `_planGetTpl` — recalée sur l’année — et « Enregistrer » écrit les douze mois qu’on a vus ; `mv-harnais-recalage` le tient désormais là (S4, S5, et la contre-épreuve « le brouillon de la frise repart de PLAN_DEF brut »). L’ancienne S6 (« un modèle maison n’hérite pas de standard au premier chiffre saisi ») tombe avec la saisie case par case : la frise montre l’année entière avant d’écrire.
- ⚠️ **Le bump de `index.html`** : « 10.75 » y figure aussi dans le tracé SVG de l’icône œil (quatre fois) ; on remplace `v10.xx` et `boot.js?v=10.xx`, jamais le nombre nu.
- Écarté : garder « Modifier » en secours (deux éditeurs pour la même grille, l’un sans les règles de l’autre) ; retirer les règles CSS `.plan-ge-*` dans ce lot (`styles.css` et le jeu des champs : à faire avec la charte).

### 544c. Ce qui a été vérifié
- `scripts/mv-harnais-frise5.mjs` (neuf) : plus une trace de l’éditeur dans l’appli (fonctions, appels, expositions, tutos), plus de « Modifier », la roue ne route que l’année, un modèle neuf s’ouvre sur son année, le CSV reste, « Enregistrer » écrit par `planSaveTpl` ; 6 cas, 3 contre-épreuves tenues.
- `mv-harnais-recalage` (S4, S5 sur la frise, sa contre-épreuve) et `mv-harnais-regl-module` (l’hôte de l’année) verts.
- **Le cliquet des gestes sans tuto** : quatre gestes partis avec l’éditeur, le compte tombe de 801 à 796 — la contre-épreuve « un geste nouveau sans tuto » de `mv-harnais-tutos` restait verte sous l’ancien plafond ; `scripts/tutos-couverture.json` abaissé à 796 (le harnais le demandait).
- **Le cliquet C24b** (valeur crue dans un gestionnaire) : trois des siens partis avec l’éditeur (« Modifier » et ses onglets de mois), `src/planning.js` tombe de 23 à 20 — la contre-épreuve C24b de `harnais-sec7-contre` « ne prouvait plus rien » sous l’ancienne référence ; `scripts/preflight-baseline.json` regravé (`node scripts/preflight.mjs --baseline`) : seule baisse, 23 → 20, aucune hausse.

### 544d. Ce qui reste ouvert
- §28, bloc FRISE-5.

## 545. ★★ PROG-1 — LE PROGRAMME INDICATIF DE MODULATION (art. 10.4) SUIT CHAQUE MODÈLE DANS LE PLANNING DE L’ANNÉE (07/11 — `src/planning-annee.js` (`_planAnneeHoraireTxt`, `_planAnneeNature`, `_planAnneeModulation`, `_planAnneeProgramme` neufs ; quatre emprunts de plus) · `src/planning.js` (`_paDoc` : la page suit chaque modèle ; la frontière : `_planBaseAn`, `_planJoursSem`, `_planSolid`, `_planSolidJour`, `PLAN_SOLID_MODES` ; `_PA_CSS`) · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-prog1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (regravée) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/PROG-1.json` — base `efedddd` « frise5 » — **APP 10.76 → 10.77, SW 11.67 → 11.68**)

### 545a. D’où ça vient
Lot 4 du chantier « le planning de l’année ». L’accord national du 23/12/1981 (art. 10.4, avenant 19 de 2019) veut, avant le début de la période de modulation, un programme indicatif pour l’équipe : la formule, les salariés concernés, les périodes de forte, faible ou nulle activité, l’horaire indicatif de chacune ; affiché au moins une semaine avant, modifié dans le même délai sauf force majeure. Le but de Nico : « le salarié qui demande son planning en janvier doit recevoir un document clair avec les bonnes heures ».

### 545b. Le modèle, et ce qui a été écarté
- **Tout se lit de la frise** (`_planAnneeLire`) : les saisons (leur semaine type → l’horaire indicatif, leurs heures par semaine → la nature : au-delà de 35 h forte, en deçà réduite, à 0 nulle), les semaines à part (les vendanges), les fermetures (activité nulle).
- **La formule** (`_planAnneeModulation`) : la somme, semaine par semaine, de ce qui dépasse 35 h (fériés chômés comptés pour leurs heures prévues, depuis la base de l’année) ; jusqu’à 200 h, contingent d’heures supplémentaires hors modulation de 150 h ; jusqu’à 250 h, 100 h ; au-delà, le programme le dit « à revoir avant de l’afficher ».
- **La règle de décompte écrite en clair** : la base, la journée de solidarité (son mode, sa date), et le choix du domaine — congés et fériés chômés aux heures prévues, avec les articles qui le fondent (4.3, 10.4) ; avant 2027, les 1 607 h.
- **La date limite d’affichage** : le 25 décembre de l’année d’avant (une semaine avant le 1er janvier).
- **Une page par modèle**, à la suite de sa grille, dans le planning de l’année (la page de l’équipe, celle qu’on affiche) — pas dans le planning nominatif, qui est la feuille de chacun (« Mon année », la suite du lot).
- Écarté : un document à part (deux boutons pour la même année) ; les heures de prise et de fin de service dans le tableau (elles sont dans la grille de la même feuille, le programme y renvoie).

### 545c. Ce qui a été vérifié
- `scripts/mv-harnais-prog1.mjs` (neuf) : les vraies fonctions — le modèle 2027 de la maquette (périodes, natures, horaires, vendanges, ~100 h donc 150 h, base, solidarité, 25 décembre 2026), la grille 2026 du modèle « standard » (quatre fermetures en activité nulle, 1 607 h, 25 décembre 2025), un modèle chargé (> 200 h donc 100 h) ; 11 cas, 3 contre-épreuves tenues.
- **La typographie** : la mise en page de la page passe en tailles relatives (`em`, `thin`) — le cliquet refusait 4 px en dur et 3 tailles sous 12 px de plus ; `src/planning-annee.js` 40 → 46 ko (+15 %) : un fichier de 46 ko ne se découpe pas, référence regravée (`scripts/typo-baseline.json`).
- Ce qui n’a pas pu être vu : la feuille imprimée elle-même (mise en page de la page du programme, sur papier).

### 545d. Ce qui reste ouvert
- §28, bloc PROG-1.

## 546. ★★ MONAN-1 — « MON ANNÉE » : LA FRISE, LE COMPTEUR, LES CONGÉS ET LE PLANNING IMPRIMÉ DE CHAQUE SALARIÉ (07/11 — `src/planning-annee.js` (`_planAnneeMini` neuf, exposé) · `src/planning.js` (`_planBuildMonHtml` : la carte ; `_paDocNom` : le programme du modèle) · `src/utils.js` (APP, MV_AIDE) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-monan1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` (un exempté) · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/MONAN-1.json` — base `ea00de0` « prog1 » — **APP 10.77 → 10.78, SW 11.68 → 11.69**)

### 546a. D’où ça vient
Lot 4 du chantier, deuxième part : la maquette v1 (« Section Salarié : Mon année ») et le but de Nico — « le salarié qui demande son planning en janvier doit recevoir un document clair avec les bonnes heures ». Le planning nominatif existait (`_paDocNom`), atteignable seulement depuis les réglages de l’admin.

### 546b. Le modèle, et ce qui a été écarté
- **La carte « Mon année »** dans la vue d’un salarié (`_planBuildMonHtml`), entre son mois et ses jours : ses heures comptées à fin du mois affiché sur sa base (ou son plafond avant 2027) et la fin d’année prévue (`_planAnnu`, seulement s’il est annualisé), ses congés posés et à prendre, sa petite frise, et son PDF.
- **La petite frise** (`_planAnneeMini`) : la même lecture que « L’année » (saisons, semaines à part, fermetures), en lecture seule, avec chaque période en clair dans l’ordre de l’année ; une saison s’arrête à la fermeture qui la suit (la fin d’année 2026 : du 16 novembre au 27 décembre).
- **Le PDF** reprend `planAnnuelNomPdf` (le geste existait, depuis les réglages) par `data-*` — aucune valeur crue dans le geste (C24b) ; la feuille porte désormais le programme indicatif de son modèle (PROG-1).
- Écarté : la grande frise de l’admin dans la vue du salarié (faite pour régler, pas pour lire) ; le programme de toute l’équipe dans sa feuille (celui de son modèle suffit).

### 546c. Ce qui a été vérifié
- `scripts/mv-harnais-monan1.mjs` (neuf) : la petite frise de la vraie grille 2026 (l’ordre de l’année, la fermeture du 1er au 4 janvier puis la saison du 5 janvier, les quatre fermetures, les vendanges, la fin d’année du 16 novembre au 27 décembre — mon attente disait le 31 : la fermeture du 28 la termine), la carte dans la vue, son PDF par `data-*`, le programme dans la feuille ; 10 cas, 3 contre-épreuves tenues.
- **Le geste du PDF** (`planAnnuelNomPdf`) devient un geste à l’écran (il n’était appelé que depuis les réglages, par JavaScript) : le compte des gestes sans tuto passait 796 → 797. Exempté dans `scripts/tutos-couverture.json`, raison écrite : il ouvre une fenêtre d’impression (rien à jouer sur le domaine d’entraînement), et la carte vit dans la vue d’un salarié, que l’utilisateur du domaine fictif — admin — ne voit pas.
- Ce qui n’a pas pu être vu : la carte sur un vrai téléphone de salarié.

### 546d. Ce qui reste ouvert
- §28, bloc MONAN-1.
