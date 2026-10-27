# Ma Vigne — plan de mise en place de toutes les améliorations (25 octobre 2026)

Base : `b57e4fe` (cavepil3), APP 10.13. Chaque point « faisable » ci-dessous a été vérifié dans le code (règles Firestore et Storage, en-têtes CSP, composants existants, champs des parcelles). Ce document reprend les trois audits : **niveau au-dessus** (fonctions), **UX v1** (patrons communs), **UX v2** (module par module).

---

## 1. En deux mots

- **22 lots**, en **5 phases**, pour **≈ 42 séances** de travail.
- **Tout est faisable** : les 16 écrans des maquettes sont réalisables tels que dessinés, avec deux nuances (le Pilotage garde deux bandes au repos ; la ligne « Journées de cave » du Planning attend son chantier) — § 5.
- **Les trois décisions sont prises** (§ 6, mise à jour du 25/10) : photo hors réseau en version simple ; seuils de floraison et de véraison trouvés dans la publication ; la densité existe déjà dans Réglages › Vigne.
- Aucun service payant à ajouter. Deux lignes de sécurité à toucher (une règle Storage, une ligne CSP), chacune dans un lot à part, comme d'habitude.

---

## 2. Comment lire ce plan

- **Un lot** = une livraison complète (fichiers entiers, aide, guide, tuto s'il y a un geste nouveau, What's New), un bump APP + SW, un déploiement. Comme aujourd'hui.
- **Une séance** = une conversation de travail : je livre, tu testes, tu déploies. Un lot **petit** tient en une séance, un **moyen** en deux, un **gros** en trois ou quatre (livré en plusieurs morceaux testables).
- **Dépend de** : ce qui doit être en place avant. Les lots d'une même phase sans dépendance entre eux peuvent se faire dans n'importe quel ordre.

---

## 3. Les cinq phases, dans l'ordre

| Phase | Ce qu'elle apporte | Lots | Séances |
|---|---|---|---|
| **0 · Le cliquet** | la mesure en CI, pour que rien ne redescende | 1 | 1 |
| **1 · La charte et les gestes** | cibles, Annuler, en-tête, filtres, PC liste-détail — ce qui se voit partout | 8 | 16 |
| **2 · Module par module** | Tracteur, Cave, Réserve, Planning, Phyto, Réglages — la maquette v2 | 6 | 8 |
| **3 · L'œil du chef** | phénologie, signalements avec photo, et leurs branchements | 3 | 11 |
| **4 · Prévoir et prouver** | fenêtre v2, récolte prévue, IFT, registre 2027 complet | 4 | 6 |
| | | **22** | **≈ 42** |

Pourquoi cet ordre : les phases 1 et 2 sont **visibles tout de suite** par tes clients et ne touchent pas aux données ; la phase 3 crée des données nouvelles (stades, signalements, photos) et touche aux règles de sécurité — mieux vaut l'aborder quand l'appli est posée ; la phase 4 s'appuie sur la 3.

---

## 4. Les lots, un par un

### Phase 0 — le cliquet

| Lot | Ce qu'il fait | Fichiers | Taille | Dépend de |
|---|---|---|---|---|
| **UX-0** | `mv-mesure-ux.mjs` devient `scripts/mv-harnais-ux.mjs` ; budgets de la v1 et de la v2 (cibles < 24 = 0, < 44 ≤ 15 %, textes < 11 = 0, chrome ≤ 120 / 56 px, session Tracteur visible, « + » sans recouvrement…) ; rougit en CI après le gabarit | `scripts/`, `mv-lanceur.mjs`, `CLAUDE.md` | petit | — |

### Phase 1 — la charte et les gestes

| Lot | Ce qu'il fait | Fichiers | Taille | Dépend de |
|---|---|---|---|---|
| **CIBLE-1** | `--h-sm` 28 → 36 px + zone de 44 par pseudo-élément ; `.ck-i` 24 dans 44 ; chips 36 ; aide / synchro / roue en 44 ; plancher de texte 11 px (12 au téléphone) ; initiales `.java` 7 → 11 dans un rond de 28 ; `.pl2-name-s` 9 → 12 tronqué | `charte.css`, `styles.css`, 4 classes dans `app.js`, `cockpit-vue.js`, `planning.js` | petit | UX-0 (pour voir le chiffre tomber) |
| **ANNULER-1** | `showToast` gagne une action (« Annuler », 6 s, barre de temps) ; les 5 actions réversibles les plus fréquentes passent en Annuler : dévalider, retirer un fût, retirer un intrant, déplacer une journée, effacer une journée | `utils.js`, `app.js`, `reserve.js`, `planning.js`, `index.html` | moyen | — |
| **ANNULER-2** | le tri des 41 autres confirmations : Annuler pour le réversible, fenêtre nommant la conséquence pour l'irréversible, nom à taper pour ce qui touche tout le domaine ; plus jamais « Oui / Non » | `cave.js`, `cuvier.js`, `tracteur.js`, `phyto.js`, `reglages.js`, `admin-gt.js` | moyen | ANNULER-1 |
| **TETE-3** | l'en-tête qui se replie, sur tous les modules : au repos une bande + un segment (104 px), en défilant une ligne de 56 px ; la bande campagne / date descend dans la ligne de cadre de la première carte ; les onglets deviennent un segment collant | `index.html` (en-têtes des 8 modules), `styles.css`, `app.js` (écouteur de défilement), chaque module pour la ligne de cadre | gros | CIBLE-1 |
| **FILTRE-1** | Journal et Parcelles : la liste d'abord ; barre basse Recherche + « Filtrer · n » ; feuille du bas (sur le patron de `mv-dock-sheet`, qui existe) ; chips des filtres actifs seuls ; « + Ajouter » en bouton flottant | `app.js` (renderJournal, Parcelles), `index.html`, `styles.css` | moyen | TETE-3 |
| **FILTRE-2** | le même patron sur Phyto (Registre) et Réserve | `phyto.js`, `reserve.js` | petit | FILTRE-1 |
| **PC-LISTE-1** | le Journal sur PC en trois colonnes : filtres à gauche, lignes de 48 px au centre, fiche à droite — sur le patron de la fiche collante qui existe déjà pour Parcelles et Tracteur (`#p-fiche`, `#trac-fiche`) ; raccourcis J / K / ↵ / E / N / « / » | `app.js`, `styles.css` | moyen | FILTRE-1 |
| **PC-LISTE-2** | même chose pour le Registre phyto, la Réserve (fûts) et Le Chai | `phyto.js`, `reserve.js`, `cave.js`, `styles.css` | moyen | PC-LISTE-1 |

### Phase 2 — module par module (maquette v2)

| Lot | Ce qu'il fait | Fichiers | Taille | Dépend de |
|---|---|---|---|---|
| **TRAC-UX-1** | la session en cours en tête avec ses deux boutons de 44 ; compteurs sur une ligne, zéros masqués ; chips dans « Filtrer » ; 90 px de marge sous la liste (le « + » `#trac-fab` existe) ; PC : en cours à gauche, parc et GNR à droite | `tracteur.js`, `index.html`, `styles.css` | petit | FILTRE-1 |
| **CAVE-UX-1** | Relever · Ouiller · Soutirer en plein, 44 px, sur chaque contenant ; sommaire collant (Ce qui presse · À faire · Cuves · Fûts) ; compteurs sur une ligne ; PC en trois colonnes avec le contenant choisi | `cave.js`, `styles.css`, `index.html` | moyen | CIBLE-1 |
| **RSV-UX-1** | bouton flottant → feuille Entrée · Sortie · Ouillage ; pyramide en premier ; part des anges vide en une ligne avec son bouton ; étiquettes à 12 | `reserve.js`, `index.html`, `styles.css` | petit | FILTRE-1 |
| **PLAN-UX-1** | la grille dès 300 px ; menu « … » en feuille (Congés, Chaleur, Année suivante, Relevé PDF — et Journées de cave quand ce chantier existera) ; noms à 12, cases à 44 ; bascule d'année en « ‹ 2026 › » | `planning.js`, `planning-vue.js`, `styles.css` | petit | CIBLE-1 |
| **PHY-UX-1** | dates écrites en français partout ; chaque ligne du registre dit l'état de la rentrée (le DRE est déjà calculé pour « À savoir ») et le cuivre cumulé ; tri du plus récent au plus ancien ; tags à 12 ; l'assistant garde sa forme, le stepper de dose en 44 | `phyto.js` | petit | FILTRE-2 |
| **REGL-UX-1** | le domaine en première ligne ; chaque réglage avec sa valeur à droite ; lignes de 48 ; fin des textes de 8-9 px | `reglages.js`, `styles.css` | petit | CIBLE-1 |

### Phase 3 — l'œil du chef

| Lot | Ce qu'il fait | Fichiers | Taille | Dépend de |
|---|---|---|---|---|
| **PHENO-1** | le stade par parcelle (saisie au téléphone, report par cépage et secteur) ; la vue « Stades » avec la mosaïque de précocité ; la somme de températures depuis le 1ᵉʳ mars (archive Open-Meteo, mise en cache dans un doc Firestore par campagne) ; la prévision floraison et véraison par cépage (modèle GFV, seuils publiés, § 6), « à une semaine près », recalée à chaque stade noté ; pour un cépage sans seuil publié, le seuil du domaine appris au premier stade noté | `app.js` (ou nouveau `pheno.js`), `firebase.js` (clé `stades`, clé `meteo_hist`), `firebase.json` (une ligne CSP : `archive-api.open-meteo.com`), `index.html`, `styles.css`, `utils.js` | gros | — |
| **PHENO-2** | les quatre branchements : stade BBCH proposé au registre ; protection restante raccourcie pendant la pousse (coefficient réglé par l'admin) ; créneau du soir pour les parcelles en fleur (coucher du soleil calculé, formule NOAA) ; alerte gel limitée aux parcelles débourrées | `phyto.js`, `pilotage.js`, `app.js`, `reglages.js` | moyen | PHENO-1 |
| **OBS-1** | « Signaler » depuis la parcelle et l'Accueil : type, intensité, photo compressée (canvas, ≈ 200 ko), point GPS, note ; clé `observations_<campagne>` ; chemin Storage `tenants/{tenant}/photos/` avec sa règle (image, 1 Mo max) ; couche sur la carte ; ligne dans « À savoir » ; historique sur la fiche parcelle ; droits : l'ouvrier signale, l'admin clôt ; hors réseau, le signalement part et la photo est marquée « à reprendre » (§ 6, décision 1) | `app.js`, `firebase.js`, `storage.rules`, `firestore.rules` (`countOk` pour la nouvelle clé), `index.html`, `styles.css`, `utils.js` | gros | — (indépendant de PHENO) |

### Phase 4 — prévoir et prouver

| Lot | Ce qu'il fait | Fichiers | Taille | Dépend de |
|---|---|---|---|---|
| **FENETRE-2** | hygrométrie dans la règle du créneau (un champ à ajouter à la requête horaire) ; pluie prévue après le créneau face au seuil de lessivage ; lecture croisée « parcelles à nu × créneau » ; frise des cinq jours heure par heure ; créneau du soir si PHENO-2 est là | `pilotage.js`, `app.js`, `utils.js` | moyen | PHENO-2 pour le créneau du soir (le reste sans) |
| **RECOLTE-1** | comptage de grappes sur dix pieds, poids moyen par cépage (réglage, recalé à la récolte), pieds/ha tirés des **écartements du domaine** (`_mvVigne()`, déjà en place, § 6), manquants déduits ; hL prévus face à l'AOC max et aux cuves ; volet « Prévu » dans Récoltes | `cuvier.js`, `reglages.js`, `pilotage.js` | moyen | — |
| **IFT-1** | IFT réel = dose appliquée ÷ dose homologuée × surface traitée ÷ surface du domaine ; par parcelle, par campagne, biocontrôle à part ; face à la référence déjà réglée dans Conformité | `pilotage.js`, `phyto.js` | petit | — |
| **REG27-1** | surface traitée partielle ; cible et mode d'application préremplis, modifiables ; rentrée anticipée (moment, lieu, motif, mesures) ; vérification ligne par ligne avant export | `phyto.js`, `index.html` | petit | — |

---

## 5. Les maquettes face à l'appli, écran par écran

| Maquette · écran | Verdict | Pourquoi, et ce qui diffère |
|---|---|---|
| Niveau au-dessus · 1 Phénologie | **à l'identique** (maquette corrigée le 25/10) | seuils publiés pour le Pinot noir et le Chardonnay ; la carte « Ce qui vient » montre maintenant une somme cohérente avec le modèle, deux jalons (floraison, véraison) au lieu de trois — la fermeture de grappe n'est pas couverte par ce modèle — et « à une semaine près » |
| Niveau au-dessus · 2 Signaler | **à l'identique** (maquette corrigée le 25/10) | la maquette dit maintenant ce qui sera fait : hors réseau, le signalement part tout de suite, la photo se reprend au retour du réseau (décision 1) |
| Niveau au-dessus · 3 Traiter ? v2 | **à l'identique** | l'hygrométrie est un champ de plus dans la requête ; le coucher du soleil se calcule ; les parcelles à nu existent déjà |
| Niveau au-dessus · 4 Récolte prévue | **à l'identique** | la densité vient des écartements du domaine, déjà saisis pour le barème ; les cuves, l'AOC max et les manquants existent |
| Niveau au-dessus · 5 Registre 2027 + IFT | **à l'identique** | la dose homologuée est déjà lue (`_phCsvDose`), la référence régionale est déjà un réglage |
| UX v1 · 1 En-tête qui se replie | **à l'identique**, sauf le Pilotage | le Pilotage garde sa barre « Vous regardez » : deux bandes au repos au lieu d'une (sa portée en a besoin) |
| UX v1 · 2 Contenu d'abord | **à l'identique** | la feuille existe (`mv-dock-sheet`), le bouton flottant existe (Tracteur, Phyto) |
| UX v1 · 3 Cibles | **à l'identique** | du CSS, sauf les cases du Planning, laissées telles quelles comme prévu |
| UX v1 · 4 Annuler | **à l'identique** | le toast existe ; il lui manque l'action et les 6 secondes (aujourd'hui 2,2 s) |
| UX v1 · 5 PC liste-détail | **à l'identique** | le patron (fiche collante en colonne 2) existe déjà pour Parcelles et Tracteur |
| UX v2 · Tracteur | **à l'identique** | `#trac-fab` existe ; l'ordre des cartes est l'ordre du rendu |
| UX v2 · Phyto | **à l'identique** | le DRE est déjà calculé pour « À savoir » |
| UX v2 · Cave | **à l'identique** | sommaire collant = `position:sticky`, déjà utilisé 31 fois |
| UX v2 · Réserve | **à l'identique** | |
| UX v2 · Planning | **à l'identique**, moins une ligne | la ligne « Journées de cave » du menu n'existe que si ce chantier est fait |
| UX v2 · Réglages | **à l'identique** | |

---

## 6. Les trois décisions — prises le 25 octobre

**1 · La photo hors réseau → la version simple.** Le signalement part hors réseau (Firestore le garde et l'envoie au retour) ; la photo, elle, demande le réseau. Sans réseau au moment d'enregistrer, le signalement part sans photo, marqué « photo à reprendre », avec un bouton « Ajouter la photo » sur sa fiche. La file d'attente locale devient **OBS-2**, hors des 22 lots, à faire si les ouvriers la réclament. La maquette dit maintenant exactement ça.

**2 · Les seuils de floraison et de véraison → trouvés.** Le modèle s'appelle **GFV** (Grapevine Flowering Véraison) : Parker et al., *Australian Journal of Grape and Wine Research*, 2011, puis la classification de 95 cépages pour la floraison et 104 pour la véraison, *Agricultural and Forest Meteorology*, 2013, sur plus de 2 000 observations de chaque stade, surtout en France. La règle est simple : chaque jour, on ajoute la température moyenne (mini + maxi, divisé par 2), à partir du 1ᵉʳ mars, au-dessus de 0 °C ; le stade arrive quand la somme atteint le seuil du cépage.

| Cépage | Floraison (50 %) | Véraison (50 %) | D'où vient le chiffre |
|---|---|---|---|
| Pinot noir | 1 219 °C·j | 2 511 °C·j | floraison : Parker 2011 ; véraison : Parker 2013, repris par Cuccia et al. 2014 pour le Pinot noir en Bourgogne |
| Chardonnay | 1 217 °C·j | 2 541 °C·j | floraison : Parker 2013 (même valeur en 2011) ; véraison : Parker 2011 |
| Gamay | non trouvé | 2 533 °C·j | Parker 2013 |
| Aligoté et les autres | non trouvé | non trouvé | pas en accès libre |

**La précision publiée** : en moyenne 5,9 jours d'erreur pour la floraison et 7,7 pour la véraison, tous cépages confondus (Parker 2011) ; sur une collection indépendante à Bordeaux, 4,2 et 5,1 jours pour le Pinot noir, 4,0 et 4,2 pour le Chardonnay ; en Champagne, le Chardonnay est prédit en moyenne 4 jours trop tôt. D'où « à une semaine près » à l'écran, jamais une date sèche.

Trois choix de mise en œuvre, tirés de ces chiffres :
- **2011 ou 2013 ?** L'écart est de 4 °C·j sur la véraison du Pinot noir (2 507 contre 2 511), moins d'une demi-journée en juillet. On prend la valeur la plus récente trouvée pour chaque case.
- **Le recalage.** Les seuils ont été calculés avec des stations à moins de 5 km et 100 m de dénivelé ; Ma Vigne lira une archive météo en mailles de quelques kilomètres, un petit biais local est probable (l'exemple de la Champagne le montre). Quand tu notes un stade, l'appli mesure l'écart entre la somme atteinte ce jour-là et le seuil, et décale d'autant le stade suivant. C'est un recalage pratique, pas une méthode publiée : on le juge sur deux saisons.
- **Un cépage sans seuil publié** n'a pas de prévision la première année. Dès qu'un stade est noté, l'appli connaît la somme atteinte ce jour-là chez toi : c'est le seuil du domaine, calculé de la même façon que dans la publication. L'admin peut aussi en saisir un.

**Les températures** : l'archive Open-Meteo (réanalyse, environ 5 jours de retard) du 1ᵉʳ mars à J−5, puis l'API de prévision déjà utilisée par l'appli (jusqu'à 92 jours passés, 16 jours devant), puis la moyenne des dix dernières années pour le reste de la saison. Une ligne CSP (§ 7), aucune clé, gratuit.

**Conséquence sur la maquette** : la carte « Ce qui vient » est corrigée (une somme cohérente avec le modèle, 1 060 °C·j fin mai ; floraison et véraison seulement ; « à une semaine près » ; les seuils écrits en note). PHENO-3 n'existe plus : la prévision entre dans PHENO-1.

**3 · La densité → elle existe, je me suis trompé.** Réglages › Vigne porte les écartements du domaine (entre rangs × sur le rang), et l'appli en tire les pieds/ha (`_mvVigne()` dans `utils.js`) : c'est ce qui ramène déjà le barème au nombre de pieds réel. J'avais cherché un champ par parcelle et je n'ai pas vu ce réglage du domaine. RECOLTE-1 le lit tel quel : **aucun champ à ajouter**. Sans écartements renseignés, l'appli dit ce qu'elle dit déjà pour le barème (« 10 000 pieds/ha supposés ») avec le lien vers le réglage. Une densité par parcelle n'existe pas ; elle ne servira que si un domaine mélange des écartements — hors du plan.

---

## 7. Les points de sécurité à ne pas oublier (chacun dans son lot, jamais mélangé)

- **CSP** (`firebase.json`) : une ligne pour `https://archive-api.open-meteo.com` — PHENO-1. L'API de prévision (`api.open-meteo.com`) est déjà autorisée.
- **Storage** (`storage.rules`) : un bloc `tenants/{tenant}/photos/{filename}`, image seulement, 1 Mo max, lecture par les membres du tenant, suppression par l'admin — OBS-1.
- **Firestore** (`firestore.rules`) : les clés nouvelles (`stades`, `observations_<campagne>`, `comptages`, `meteo_hist`) tombent dans la règle 3 (tout membre non lecteur-seul) ; ajouter un plafond dans `countOk` pour `observations_*` — OBS-1 et PHENO-1.
- **Clés lues au démarrage** (`firebase.js`, `COLLECTIONS`) : chaque clé nouvelle s'y ajoute, sinon elle n'est jamais lue.
- **Coût** : photos ≈ 200 ko × signalements ; à mille signalements par an et par domaine, 200 Mo — quelques centimes par mois en Blaze. L'archive Open-Meteo est gratuite, sans clé.

---

## 8. Le rythme, et par quoi commencer

Chaque lot est un déploiement. Les lots d'une phase sans dépendance entre eux peuvent s'intercaler avec les chantiers déjà ouverts (Accueil Vigne, Cave Aujourd'hui, journées de cave…). Trois premiers lots que je recommande, parce qu'ils se voient tout de suite et ne touchent à aucune donnée :

1. **UX-0** — la mesure en CI (1 séance).
2. **CIBLE-1** — 69 % de cibles trop petites → moins de 15 %, 67 textes illisibles → 0 (1 séance).
3. **ANNULER-1** — le toast « Annuler » et les cinq gestes les plus fréquents (2 séances).

Puis TETE-3 et FILTRE-1, qui changent le plus la sensation d'usage.

---

## 9. Ce que je n'ai pas vérifié

- Le comportement du défilement **sur iPhone en PWA** pour l'en-tête qui se replie : `position:sticky` est déjà en production, mais le repli au défilement ne l'est pas ; TETE-3 se teste sur ton téléphone avant déploiement général.
- Le temps réel de chaque séance dépend de ce que tu trouves au test ; les tailles sont des ordres de grandeur, calés sur les lots du même genre déjà faits (REF-1, COLLE-1, AUJ-x).
- Gamay (floraison) et Aligoté : pas de seuil en accès libre ; ils seront appris sur le domaine.
- Le recalage par stade noté : pratique, pas publié — à juger sur deux saisons.
- Les écartements réellement saisis chez toi dans Réglages › Vigne (le code les lit, je n'ai pas vu tes données).

---

## 10. Sources des seuils et des données (lues le 25/10/2026)

- Parker A. et al., « General phenological model to characterise the timing of flowering and veraison of *Vitis vinifera* L. », *Australian Journal of Grape and Wine Research* 17, 206-216, 2011 — tableau de validation par cépage (Pinot noir 1 219 / 2 507, Chardonnay 1 217 / 2 541) ; erreur tous cépages 5,9 j (floraison) et 7,7 j (véraison), actes du congrès Terroir 2012 (IVES).
- Parker A. et al., « Classification of varieties for their timing of flowering and veraison using a modelling approach », *Agricultural and Forest Meteorology* 180, 249-264, 2013 — Chardonnay floraison 1 217, Gamay véraison 2 533, Sauvignon 1 282 / 2 528 ; plus de 2 000 observations par stade, 123 sites, surtout en France.
- Cuccia C. et al., « Phenological model performance to warmer conditions: application to Pinot noir in Burgundy », *OENO One* 48 (3), 169-178, 2014 — Pinot noir véraison 2 511 (valeur de Parker 2013), validé en Bourgogne.
- Parker A. et al., « Adaptation to climate change by determining grapevine cultivar differences using temperature-based phenology models », *OENO One*, numéro du congrès Terroir 2020 — validations indépendantes (Bordeaux, Champagne, Marlborough).
- Open-Meteo : archive (réanalyse ERA5, ≈ 5 jours de retard) et prévision (`past_days` jusqu'à 92) — lu dans des documentations tierces ; à confirmer sur la documentation officielle au début de PHENO-1.
