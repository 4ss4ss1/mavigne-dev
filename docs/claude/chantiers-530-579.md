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
