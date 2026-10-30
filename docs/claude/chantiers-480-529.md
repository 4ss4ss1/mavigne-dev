# Ma Vigne — Chantiers §480 à §529

> Ouvert le 28/10/2026 (§480), sur le modèle de `chantiers-430-479.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.

## 480. ★★ TRAC-UX-1A — TRACTEUR : LA SESSION EN COURS EN TÊTE, « TERMINER » AVEC ANNULER ; AU TÉLÉPHONE, « FILTRER » ET LA RECHERCHE EN BAS (28/10 — `index.html` (la carte en tête, la feuille, la barre basse) · `src/tracteur.js` (`_trEncoursHtml`, `_trTerminer`, `_tTrouve`, `_tCompteurs`, `_tFeuille`, `_tFiltresEffacer`, `_tCherche`) · `src/styles.css` · `guide/06-tracteur.html` · `src/utils.js` (APP 10.32) · `src/whats-new.js` · `public/sw.js` (SW 11.13) · `scripts/mv-harnais-traux1a.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-cote1.mjs` · `scripts/mv-harnais-kit4.mjs` · `scripts/tutos-couverture.json` · `scripts/mv-ux-baseline.json` · `scripts/mv-ux-rendu.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` (neuf) · `docs/claude/INDEX.md` · `.mv-base` · `lots/TRAC-UX-1A.json` · base `3cc562d`)

### 480a. D’où ça vient
Le premier lot après la Phase 1 du plan, dessiné dans `docs/maquettes/maquette-ux-v2.html` (« Tracteur — la session en cours en tête ») : mesuré, 22 cibles sur 30 sous 44 px ; la session en cours arrivait après quatre compteurs (deux à zéro) et deux rangées de pastilles de 28 px ; le « + » flottant recouvrait le crayon de la carte suivante. ★ **Deux gestes de la maquette n’existaient pas** ; Nico a tranché (28/10) : **« Terminer » s’ajoute, avec Annuler** ; **sur ordinateur, le parc et le GNR à droite**, comme la maquette (TRAC-UX-1B). Découpé en deux, l’arrivée restant la maquette : **1A** ce lot ; **1B** l’ordinateur.

### 480b. Ce qui change
- **La session en cours en tête** (`#trac-encours`, avant les compteurs, sur tous les écrans) : « En cours », l’activité, qui · quel tracteur · depuis quand, le pourcentage, la barre, « x ha sur y » (le calcul des cartes : parcelles actives moins celles retirées, la surface des faites). Pour qui peut saisir (tractoriste, admin) : **« Enregistrer l’avancement »** — `openSessionDetail`, la feuille qui existe — et **« Terminer »**. Elle ne se répète plus dans la liste ; le bandeau « n session(s) en cours » laisse la place à la carte.
- **« Terminer »** (`_trTerminer`, geste neuf) : la session passe « Terminé » aujourd’hui (`dateFin`), marquée `termineeMain` ; les parcelles pas faites restent à faire ; « Annuler » six secondes remet le statut, la date de fin et la marque tels qu’ils étaient. Sans droit de saisie, rien.
- **Les compteurs sur une ligne**, ceux à zéro cachés (`_tCompteurs`) : les mêmes chiffres qu’avant (les heures de moteur sont celles de la saison — la maquette dit « ce mois », un chiffre qui n’existe pas : rien d’inventé).
- **Au téléphone** : les pastilles (conducteur, activité) dans une feuille « Filtrer les sessions » ; la barre basse porte une **recherche** (`_tTrouve` : l’activité, le conducteur, les parcelles prévues ou faites, les produits) et « Filtrer · n » ; les pastilles du parc cachées (elles reviennent à droite sur ordinateur, 1B) ; le « + » remonte au-dessus de la barre et la liste garde la marge de la maquette sous lui. Sur ordinateur, les pastilles restent à leur place (1B).
- Quatre gestes neufs exemptés de tuto, motivés (dont « Terminer » : le bouton dit ce qu’il fait, Annuler rattrape) ; la feuille, son voile et la barre exemptés du panneau côte à côte (au téléphone seulement).

### 480c. Mesuré
- `mv-harnais-traux1a` : 11 assertions — la carte JOUÉE (ce qu’elle dit, ses deux boutons pour qui peut saisir, aucun sinon), « Terminer » et son Annuler (la date de fin et la marque retirées), « Terminer » refusé sans droit, la recherche, les compteurs sans zéros, la structure (la carte avant les compteurs, les pastilles dans la feuille, la barre), la liste sans la session en cours, le « + » et la marge ; **7/7 mutants**.
- `test:ux` (référence regravée, 7 baisses, aucune hausse) : **la session en cours, 462 → 178 px** du haut (objectif ≤ 200) ; **les cibles sous le « + » : 1 → 0**. La mesure cherchait `.scard-enc` dans la liste : elle lit maintenant la carte de tête (`#trac-encours .trx`) — sans quoi elle se disait « perdue ».
- Chaîne (581 commandes) : **KIT-4** compte les passages par les formateurs de surface (`window._mvHaT`) dans `tracteur.js` — la carte de la session en cours en ajoute deux (les hectares faits et le total) : son compte passe de 9 à 11, écrit (`scripts/mv-harnais-kit4.mjs`). Plus `build-guide --check`, attendu.
- Tutos : voir la note de livraison.

### 480d. Fiches et guide
`guide/06-tracteur.html` : la session en cours (ses deux boutons, « Terminer » et Annuler, les compteurs sans zéros) et « Filtrer » au téléphone. `MV_AIDE` relue : rien sur ces blocs.

### 480e. Ce qui reste ouvert
- **TRAC-UX-1B** : l’ordinateur — la session en cours et la liste à gauche, le parc (heures, prochain entretien) et le GNR (cuve, consommation) à droite ; la fiche de session s’ouvrira en feuille, comme au téléphone.
- **À vérifier chez Nico et chez un tractoriste, au téléphone** : la carte en tête, « Terminer » puis « Annuler », la recherche, « Filtrer », le « + » qui ne cache plus la dernière session.

## 481. ★★ TRAC-UX-1B — LE TRACTEUR SUR ORDINATEUR : LE PARC ET LE GNR À DROITE, LA SESSION EN FEUILLE (28/10 — `src/tracteur.js` (`_trParcEtat`, `_trDroiteHtml` ; le clic des sessions ; `_trSel` retirée) · `src/styles.css` · `index.html` (`#trac-droite`) · `src/utils.js` (l’aide du Tracteur, APP 10.33) · `guide/06-tracteur.html` · `src/whats-new.js` · `public/sw.js` (SW 11.14) · `scripts/mv-harnais-traux1b.mjs` (neuf) · `scripts/mv-harnais-trac1.mjs` · `scripts/tutos-couverture.json` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/TRAC-UX-1B.json` · base `faaf11a`)

### 481a. D’où ça vient
La seconde moitié de TRAC-UX-1 (§480a) : sur ordinateur, `docs/maquettes/maquette-ux-v2.html` met la session en cours à gauche, le parc et l’entretien à droite, « mêmes données qu’aujourd’hui, rangées par ordre d’urgence : ce qui tourne, ce qui doit passer à l’atelier, ce qui se vide ». Décision de Nico (28/10) : **comme la maquette** — la colonne de droite remplace la fiche de session de TRAC-1 (§282).

### 481b. Ce qui change (à partir de 1 024 px ; au téléphone, rien)
- **La grille** : la page Tracteur en deux colonnes — à gauche la session en cours, les compteurs, la recherche et la liste ; à droite `#trac-droite`, collante. Les pastilles du parc et la fiche de session sont cachées ; **l’onglet Entretien garde sa propre mise en page** (`trac-ent-on` : machines et cuve à gauche, révision à droite), sans la colonne.
- **Le parc** (`_trParcEtat`, `_trDroiteHtml`) rangé par urgence — au garage (et la date de retour), révision dépassée ou à 50 h ou moins, à 120 h ou moins, le reste ; l’ordre du parc à égalité. Chaque ligne : le tracteur, ses heures, « révision dans n h » ou ★ **« révision dépassée de n h »**, un badge ; un appui ouvre son entretien.
- **Le GNR** : la cuve (niveau / capacité, relevée le …, « Sous le seuil ») et les heures de moteur du mois (les sessions du mois, hors traitements). La maquette dit aussi les litres et le prix du mois : les appoints vivent dans `paie` (lecture admin seule) et les litres par mois ne sont pas tenus — rien d’inventé.
- **Une session s’ouvre en feuille partout** (`openSessionDetail`) ; `_trSel`, sans appelant, retirée. **TRAC-1 suit** (`scripts/mv-harnais-trac1.mjs`) : son assertion du clic et celle de l’aide réécrites, sa contre-épreuve vise le geste neuf (8/8). L’aide du Tracteur (`MV_AIDE`, « Sur un ordinateur ») réécrite.

### 481c. Vu en route — les pastilles du parc ne passaient jamais au rouge
`renderTracParcPills` calculait `rc` en 'bad' / 'warn' / 'ok' puis choisissait la couleur sur 'urg' / 'soon' : toujours neutre. Et une révision dépassée s’écrivait « Révision dans −18 h ». La colonne de droite le dit juste ; les pastilles, cachées partout désormais, n’ont pas été retouchées (à retirer si rien ne les rappelle).

### 481d. Mesuré
- `mv-harnais-traux1b` : 8 assertions — le parc et le GNR JOUÉS (l’ordre d’urgence, « dépassée de 18 h », « au garage · retour », l’entretien d’un appui, la cuve et son seuil, les heures du mois sans les traitements ni le mois d’avant, l’absence dite), la grille, l’Entretien sans colonne, le remplissage, le clic ; **6/6 mutants**.
- Chaîne (583 commandes) : la contre-épreuve du contrôle des tutos (« un geste nouveau sans tuto ») restait verte — `_trSel` retirée, les gestes sans tuto sont passés de 806 à 805, un cran sous le plafond ; le contrôle le demandait lui-même : **le plafond descend à 805** (`scripts/tutos-couverture.json`), le cliquet mord de nouveau. Plus `build-guide --check`, attendu.
- `test:ux` et tutos : voir la note de livraison.

### 481e. Ce qui reste ouvert
- Les pastilles du parc (`renderTracParcPills`) : cachées partout, à retirer avec leur code.
- **CAVE-UX-1**, le lot suivant du plan.
- **À vérifier chez Nico, sur son PC** : la colonne de droite, l’ordre du parc, un appui sur un tracteur, l’onglet Entretien, une session ouverte en feuille.

## 482. ★★ TETE-3D — LA BANDE CAMPAGNE/DATE, SOUS L’EN-TÊTE, RETROUVE SA FORME ; TEST:UX LA GARDE AU RENDU (29/10 — `src/styles.css` (le bloc TETE-2 aux deux places ; la pastille blanche) · `scripts/mv-ux-rendu.mjs` (la règle de la bande, la contre-épreuve) · `scripts/mv-ux-baseline.json` · `scripts/mv-harnais-tete3d.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-ux0.mjs` · `src/utils.js` (APP 10.34) · `index.html` · `src/whats-new.js` · `public/sw.js` (SW 11.15) · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/TETE-3D.json` · base `98b75bd`)

### 482a. D’où ça vient
La CI rougissait depuis `tete3c` (run #326) à l’étape « Gabarit du Pilotage » : la date de la bande campagne/date en graisse 300 (« Mercredi 28 octobre », Aujourd’hui › Terrain, Cave et Économie, sur ordinateur). Neuf runs de suite sans un vert (#324 à #332, rouges ou annulés) ; l’étape suivante, `test:ux`, sautée depuis. Capture du run #331 envoyée par Nico. ★ **La cause** : TETE-3B (§474) a sorti la bande des en-têtes ; ce qui la mettait en forme — TETE-1 (§272) et TETE-2 (§329), écrits `body .mod-header .X` — ne la visait plus. 26 règles perdues, relevées une à une dans le navigateur (la bande remise dans l’en-tête, puis à sa place : les règles qui la trouvaient dedans et plus dehors). Le Gabarit avait raison : hors de l’en-tête, la bande n’est plus une « pièce commune ».

### 482b. Mesuré avant de toucher — dix modules, téléphone et ordinateur, clair et sombre, l’avant-TETE-3B contre `tracux1b`
- Au téléphone, la saison sur deux lignes (45 px au lieu de 28), la date aussi, en graisse 300, sans « … ».
- Le Pilotage au téléphone : une bande de 90 px au lieu de 42 — la date longue à côté de la météo, qui porte déjà la date courte.
- « ? Aide » en toutes lettres au téléphone (68 px au lieu d’un « ? » de 28), son « ? » à 10 px ; la température en Cormorant 15 px, sans chiffres droits.
- ★ **Vu en route** : la pastille blanche à filet fin que TETE-3B croyait poser (la `.pill` de la maquette ux-v1) ne s’est jamais affichée — la règle d’UI-3 CORRECTIFS 2 `.hv2-saison-pill{background:var(--gris-clair)!important…}` l’emportait. Son harnais lisait la source : la leçon de §475, encore.
- ★ **Vu à la capture** : à 360 px, la météo du Pilotage poussait « ? » hors de l’écran — déjà vrai dans l’en-tête, avant TETE-3B.

### 482c. Ce qui change
- **Le bloc TETE-2** (le dernier de la feuille : son harnais exige que seul GABARIT-1 le suive) : chaque règle de la ligne du jour porte en tête la nouvelle place, `body .mod-header + .mod-meta-row` ; les chaînes que lit `mv-harnais-tete2` restent entières (au téléphone, une règle à part pour la même raison). La météo y prend la forme de TETE-2, pas sa peau grise (les couleurs de la page, celles de TETE-3B, restent) ; ses deux lignes à 12 px et non 11 (LISIBLE-1, §470 : le cliquet des textes sous 12 px) ; le point de la saison au vert du thème.
- ★ **Décision de Nico (29/10)** : la pastille saison **blanche**, filet fin, ronde — la maquette et l’intention de TETE-3B — plutôt que le gris affiché depuis le 28/10. Une règle `:not(.consult)` à côté de celle de TETE-3B : une campagne passée garde son ambre.
- **À côté de la météo** (la date longue cachée), c’est la campagne qui cède en « … » ; le « ? » rond du téléphone garde 44 px d’appui en largeur (sa zone d’UX-1, §467, débordait de 6 px : pensée pour « ? Aide », 40 px autour de 28).

### 482d. Le contrôle au rendu — le point ouvert de §475e
- `test:ux` porte une **règle, pas un cliquet** : sur les vingt vues, la bande juste sous l’en-tête tient sur une ligne, chaque pièce entière, la saison, la météo et l’aide à 28 px, « ? Aide » présent (« ? » seul au téléphone), la date en 400 avec « … » ou cachée par la météo, la température à chiffres droits. Rien n’est gravé : un défaut rougit toujours, et bloque une regravure. Sa contre-épreuve pose deux défauts de plus (la date du Journal en 300, « Aide » au Pilotage).
- ★ **La contre-épreuve de `test:ux` était déjà rouge sur `tracux1b` intact** (« journal › téléphone › c24, t11 ») : son premier défaut visait les puces du Journal, rangées dans la feuille cachée depuis FILTRE-1A (§476). Il vise aussi « Filtrer », la recherche et le « + » ; après la regravure : **10/10**.
- `mv-harnais-tete3d` : 8 assertions (le bloc TETE-2 aux deux places, la peau blanche et l’ambre, le téléphone, la campagne qui cède, la règle de `test:ux` et sa contre-épreuve, la CI qui le joue) ; **15/15 mutants**.

### 482e. Mesuré après
- `test:gabarit` : **vert**, 15 vérifications. `test:ux` : vert, 18 vérifications ; référence regravée, 34 baisses — plus aucun texte sous 11 px nulle part, aucun sous 12 au téléphone ; le contenu remonte de 17 px (session du Tracteur 178 → 161, grille du Planning 460 → 443, premier réglage 372 → 356). L’Accueil au téléphone compte une cible sous 44 px de plus (21 → 22, dans la marge) : la pastille saison, qu’on touche pour changer de campagne, revient à 28 px — sur deux lignes, elle en mesurait 45. ⚠️ **Le Pilotage sur ordinateur gardé à 42 à la main** dans la référence (relevé ici à 39 : la valeur qui suit l’heure réelle, §470e).
- La bande contre l’avant-TETE-3B : identique sur les vingt vues, sauf le voulu (blanche et ronde ; 38 px au lieu de 42, le resserrement de TETE-3B ; la météo à 12 px). Captures à 360 px, clair et sombre.
- `mv-harnais-tete2` 17 (17/17), `tete3b` 6 (7/7), `tete3c` 5 (5/5) : inchangés. Preflight : 0 erreur, 14 avertissements, les mêmes que sur `tracux1b`. Tutos concernés : aucun (7 tutos) ; panneau côte à côte rejoué, vert.
- Chaîne complète (585 commandes, 1 084 s) : **un rouge, suivi** — `mv-harnais-ux0` comptait huit défauts attendus dans la contre-épreuve de `test:ux` ; il en attend dix (16 assertions, 17/17), rejoué vert.

### 482f. Fiches et guide
`guide/01-demarrer.html` relu (« la campagne et la date sont sur la ligne juste en dessous » reste juste) ; `13-donnees` et `14-depannage` disent la pastille « ? Aide » « en haut de chaque écran » — juste. `MV_AIDE` : aucune fiche ne décrit la bande, rien à changer. `MV_INFO` : aucun calcul touché.

### 482g. Ce qui reste ouvert
- Le Pilotage sur ordinateur dans `test:ux` (39 ↔ 42 selon l’heure, §470e) : trouver ce qui lit l’heure réelle malgré l’horloge posée.
- Les règles de TETE-1 et TETE-2 « dans l’en-tête » ne trouvent plus rien (aucune bande n’y vit) : gardées, comme l’injecteur de l’aide lit les deux places.
- **À vérifier chez Nico** : la bande au téléphone (une ligne, « ? » rond), le Pilotage avec la météo, une campagne passée choisie sur l’Accueil (la pastille orangée), en clair et en sombre.

## 483. ★★ COMPT-1 — LE COMPTEUR DES TRACTEURS AVANCE TOUT SEUL ; ON LE RELÈVE AU PASSAGE (29/10 — `src/tracteur.js` (`_trCompteur`, `_trHeuresNotees`, `_trEcart`, `_trRelevePassage`, la feuille `_rel*` ; `_trParcEtat`, `_trDroiteHtml`, `_revCardHtml`, `saveRev`, `savePleinFiche`, `openSessionDetail`, `closeSessionDetail`, `_trTerminer`) · `src/app.js` (`renderHomeTrac`, `exportRapportSaison`) · `src/pilotage.js` (`_pilData`, la liste et la tuile) · `index.html` (`#ovReleve`, v10.35) · `src/styles.css` · `src/utils.js` (APP 10.35, l’aide du Tracteur) · `src/whats-new.js` · `guide/06-tracteur.html` · `public/sw.js` (SW 11.16) · `scripts/mv-harnais-compt1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `docs/maquettes/maquette-compteur-tracteur-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-1.json` · base `336a8e1`)

### 483a. D’où ça vient
Demande de Nico (29/10) : la prise des heures de révision des tracteurs n’est pas pratique — une obligation à chaque utilisation, ou mieux. Benchmark (John Deere Operations Center, Fleetio, Karnott, une GMAO) et maquette `docs/maquettes/maquette-compteur-tracteur-v1.html` ; « go » de Nico (29/10) : COMPT-1, le premier des trois lots qu’elle découpe. Mesuré avant : `saveRev` était le seul geste qui écrivait `compteur_h` ; les heures notées des sessions ne le nourrissaient pas ; cinq écrans lisaient ce chiffre figé ; quatre écrivaient « dans −n h » (la carte Révision, le rapport de saison, la liste et la tuile du Pilotage).

### 483b. Ce qui change
- **Les relevés** : `t.releves` = [{d, ts, h, par, src}] — `jour`, `plein`, `manuel` ; « pas devant le tracteur » noté sans `h` (`manque:true`) ; les 120 derniers. `compteur_h` reste le dernier vrai relevé : ce qui le lit encore reste juste.
- **L’estimation** (`_trCompteur`) : dernier relevé + heures notées depuis × l’écart appris. Heures notées (`_trHeuresNotees`) : par parcelle, le chrono, sinon le barème (la règle de `_pilGmHeuresSession`) ; le tracteur de la session ou de son activité, par id ou par nom ; un relevé sépare par l’heure du chrono (`t1`), sinon par le jour. Écart (`_trEcart`) : médiane « compteur ÷ heures notées » des cinq derniers intervalles d’au moins 2 h, 1 sous deux intervalles, borné 0,8–2 — la route et le ralenti tournent au cadran sans être notés. « env. » dès que quelque chose est estimé (`_trHeuresTxt`). Un ancien `compteur_h` sans relevé sert de base, sans date ni estimation.
- **Le relevé au passage** (`_trRelevePassage`) : une fois par jour et par tracteur, quand on referme la feuille après y avoir coché ou mesuré (`_trSdOuvert` garde l’état des parcelles à l’ouverture : regarder ne demande rien) ou qu’on termine ; jamais en entraînement (`__MV_TUTO`), au garage, ni pour qui ne conduit pas. « Pas devant le tracteur » repose la question au geste suivant.
- **La feuille** `#ovReleve` : le cadran case par case, le dixième à part ; douze touches de 52 px ; le contrôle sous le cadran ; « Valider » dit ce qu’il note ; le clavier physique marche (chiffres, virgule ou point, retour, Entrée). Trois contrôles (`_relEtat`, repris de Fleetio) : plus bas que le dernier relevé, refusé (un compteur changé se corrige au crayon) ; plus de 24 h par jour écoulé, refusé ; plus de 1,5 fois l’attendu et 10 h d’écart, « Oui, n h est le bon chiffre ». Annuler six secondes.
- **Au plein** (`savePleinFiche`) : la feuille s’ouvre par-dessus ; la fiche (avec `compteur_h`) et la cuve ne s’enregistrent qu’avec le chiffre. **« Relever »** (`_trRelever`) dans la carte Révision de l’Entretien. **Le crayon** (`saveRev`) écrit un relevé `manuel` : la nouvelle base, même plus basse.
- **Les lecteurs** : `_trParcEtat` et `_trDroiteHtml` (le parc de droite, « env. »), `_revCardHtml` (l’estimé, « dépassée de n h », « Relevé le … par … · depuis, n h notées × 1,3 »), `renderHomeTrac`, `exportRapportSaison` (« dépassée de n h »), `_pilData` (`revReste` sur l’estimé ; la liste et la tuile disent « dépassée de n h »). Tous passent par `window._trCompteur` avec repli sur `compteur_h` : les harnais qui les jouent sans tracteur.js restent justes.
- **Quatre gestes neufs exemptés de tuto** (`_relTouche`, `_relValider`, `_relPlusTard`, `_trRelever`) : la feuille arrive seule et se lit.
- **`MV_INFO`** : « Parc tracteur » et « Révision dans les travaux en cours » disent le nouveau calcul — et corrigent « au plus tôt, jamais au plus tard », qui était faux : une session oubliée éloigne l’échéance, le relevé du jour la rattrape.
- **« env. »** marque un chiffre estimé : la maquette disait « ≈ », que les polices de l’appli ne savent pas dessiner (`mv-harnais-subset`). Les cases du cadran sont claires (un jeton de surface en couleur de texte est refusé, `mv-harnais-contraste`).

### 483c. Décisions
- « Pas devant le tracteur » est gardé, comme la maquette le recommandait ; Nico n’a pas demandé le relevé bloquant.
- Le relevé n’arrête jamais un travail : la feuille monte après l’enregistrement. Seul le plein exige le chiffre — on est devant la machine.
- Seuils inchangés : orange à 120 h, rouge à 50 h.

### 483d. Mesuré
- `mv-harnais-compt1` : 24 assertions — l’estimation JOUÉE (écart 1,3 appris, 1033,8 = 1026 + 6 × 1,3, l’autre tracteur écarté, rien d’inventé, les bornes), les trois contrôles, le cadran, la question une fois par jour (déjà relevé, « pas devant », feuille regardée, entraînement, garage, droits), les branchements, les lecteurs, la feuille, les exemptions ; **11/11 mutants**.
- **Chaîne complète verte sur les sources finales** : 587 commandes, jouées en quatre reprises (le bac à sable coupe une commande à cinq minutes). Rougis en route et corrigés : « ⌫ » compté comme emoji (icône `ic-gauche`), les replis des jetons du socle, « ≈ » hors du jeu des polices, un jeton de surface en couleur de texte, le bloc CSS à poser avant TETE-2 (qui reste en fin de feuille) et sans couleur en dur (ARRIVEE-4). `typo-baseline.json` regravé : tracteur.js 200 → 223 ko, découpage écarté (le compteur est un morceau du Tracteur, lu ailleurs par `window._trCompteur`) ; le regravage absorbe aussi la croissance d’autres modules depuis le dernier.
- **Build** : app 10.35. **Tutos concernés : aucun** (7 tutos, aucun ne touche ce changement) ; panneau côte à côte rejoué, 3/3.
- **Essai réel sur le build** (mode entraînement, Chromium 390 px) : « Relever » ouvre la feuille ; le pavé tape « 490,5 » ; « Valider 490,5 h » enregistre le relevé (`src:'manuel'`) et `compteur_h`, la feuille se referme ; aucune erreur.

### 483e. Ce qui reste ouvert
- **COMPT-2** : les intervalles (heures et/ou mois, au premier atteint), « Révision faite » qui calcule la suivante, la reprise de `revision_h`, l’obligation au démarrage (révision à 50 h ou moins, dépassée, ou 7 jours sans vrai relevé).
- **COMPT-3** : sur ordinateur, la fiche du tracteur dans l’Entretien — la courbe, les relevés, Corriger et Écarter.
- La fiche d’entretien cochée « Plein fait » (l’autre chemin du plein) ne demande pas encore le compteur.
- `renderTracParcPills` remplit toujours une bande masquée partout (§481e) : à retirer.
- L’aide dit encore « Le parc s’affiche en pastilles sous les chiffres » : la bande est masquée depuis UI-3, à réécrire.
- Vocabulaire : la case « Heures de moteur » compte des heures notées ; avec l’écart appris, elle pourrait dire vrai.

## 484. ★★ COMPT-2 — LA RÉVISION SE RECALCULE ; LE COMPTEUR EXIGÉ AU DÉMARRAGE QUAND ÇA COMPTE (29/10 — `src/tracteur.js` (`_trSuivi`, `_trAjoutMois`, `_trRevDate`, `_trRevEtat`, `_trReleveExige`, `_trRevFaite` ; `_relOuvrir`, `_relRendu`, `_trRelevePassage`, `_revCardHtml`, `saveRev`, `_trParcEtat`, `_trDroiteHtml`, `saveSession`) · `index.html` (`#rel-ban`, v10.36) · `src/styles.css` · `src/utils.js` (APP 10.36, l’aide du Tracteur) · `src/whats-new.js` · `guide/06-tracteur.html` · `public/sw.js` (SW 11.17) · `scripts/mv-harnais-compt2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-2.json` · base `aa11e82`)

### 484a. D’où ça vient
Le deuxième lot de `docs/maquettes/maquette-compteur-tracteur-v1.html` (§483) ; « go » de Nico (29/10). Après une révision, la cible suivante se calculait de tête et se retapait au crayon ; et COMPT-1 interrogeait tous les tracteurs, même ceux d’un domaine qui ne tient pas les heures.

### 484b. Ce qui change
- **L’intervalle**, au crayon de « Prochaine révision » : `t.rev_h` (toutes les N heures) et/ou `t.rev_mois` (tous les N mois), au premier atteint.
- **« Révision faite »** (`_trRevFaite`) : la feuille du compteur (src `revision`), puis `rev_fait_h` et `rev_fait_d` ; `revision_h` = compteur + `rev_h` — tous les lecteurs le lisent déjà ; `rev_date` = aujourd’hui + `rev_mois` (`_trAjoutMois`, la fin de mois gardée). Annuler six secondes ; le relevé reste, c’est un vrai chiffre. Sans intervalle, la révision est notée et la carte dit de le régler.
- **L’échéance au premier atteint** (`_trRevEtat`) : heures et date ; rouge à 50 h ou 14 jours, orange à 120 h ou 30 jours. La carte Révision dit « ou le … » ou « date dépassée (…) », l’intervalle et la dernière révision ; le parc de droite range une date dépassée avec les révisions dépassées, et dit « à relever » quand le dernier vrai relevé a plus de 7 jours.
- **Le compteur exigé au démarrage** (`saveSession`, `_trReleveExige`) : révision dépassée, à 50 h ou moins, à 14 jours ou moins, ou 7 jours sans vrai relevé (un ancien chiffre sans date compte) → la feuille, son bandeau (`#rel-ban`), sans « Pas devant le tracteur » ; la session part avec le compteur. Jamais en entraînement, au garage, ni le jour d’un relevé. Le travail n’est pas arrêté : la session se crée dès le chiffre donné.
- **Les tracteurs non suivis** (`_trSuivi` : ni compteur, ni révision, ni relevé, ni intervalle) ne sont jamais interrogés — au démarrage comme au passage.
- **« Révision faite »** exempté de tuto (la feuille est celle du relevé).

### 484c. Mesuré
- `mv-harnais-compt2` : 16 assertions — l’ajout de mois, l’échéance heures et date, le compteur exigé (dépassée, proche en heures et en jours, vieux relevé, ancien chiffre ; pas le jour d’un relevé, pas au garage, pas un tracteur non suivi), « Révision faite » qui calcule et s’annule, sans intervalle, le passage, les branchements ; **9/9 mutants**. `compt1`, `traux1a`, `traux1b`, `coeq1`, `sessions`, `trac3` restent verts, contre-épreuves comprises.
- **Chaîne complète verte** : 589 commandes, en quatre reprises (le bac à sable coupe une commande à cinq minutes), juste avant le dernier retouché. Après lui : preflight, les harnais du Tracteur (`compt1`, `compt2`, `traux1a`, `traux1b`, `coeq1`, `sessions`, `trac3`, `tap`, contre-épreuves comprises) et du style (`typo`, `subset`, `contraste`, `jetons`, `globaux`) verts.
- **Build** : app 10.36. **Tutos concernés : aucun** (7 tutos, aucun ne touche ce changement) ; panneau côte à côte rejoué après le dernier retouché, 3/3.
- **Essai réel sur le build** (mode entraînement, Chromium 390 px) : la carte dit « Toutes les 500 h ou 12 mois, au premier atteint » et porte « Révision faite » ; la feuille dit « révision faite : le chiffre du cadran », puis « Noter la révision à 485 h » ; après : `revision_h` 985, `rev_fait_h` 485, `rev_date` 2027-10-29, aucune erreur. ★ **Vu en route** : la carte et le toast écrivaient « ou le 29 Oct » — `fmtDate` tait l’année, et une échéance d’un an la perd. D’où `_trDateAn` (« 29 oct. 2027 »), le dernier retouché, vérifié par le harnais. Le compteur exigé au démarrage, coupé en entraînement par choix, n’est vérifié que par le harnais.

### 484d. Ce qui reste ouvert
- **COMPT-3** : la fiche du tracteur sur ordinateur — la courbe, les relevés, Corriger et Écarter.
- Le plan à plusieurs entretiens (vidange pont et boîte, filtres) : un seul intervalle par tracteur pour l’instant.
- La date de l’intervalle ne remonte ni au Pilotage, ni à l’accueil, ni au rapport de saison, qui lisent les heures ; un tracteur suivi à la date seule s’affiche « révision à renseigner » dans le parc.
- Toujours ouverts depuis §483e : la fiche « Plein fait » sans compteur, la bande des pastilles à retirer, la ligne d’aide des pastilles, le vocabulaire « Heures de moteur ».

## 485. ★★ COMPT-3 — LA FICHE DU COMPTEUR, SUR ORDINATEUR (29/10 — `src/tracteur.js` (`_trUtc`, `_trJoursOuvres`, `_trAjoutOuvres`, `_trRythme`, `_trRepere`, `_trLignesReleves`, `_trCourbeSvg`, `_trFicheCptHtml`, `_trRelEcarte` ; `_trVrais`, `renderEntretiens`) · `index.html` (v10.37) · `src/styles.css` · `src/utils.js` (APP 10.37, l’aide du Tracteur) · `src/whats-new.js` · `guide/06-tracteur.html` · `public/sw.js` (SW 11.18) · `scripts/mv-harnais-compt3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-3.json` · base `913f01b`)

### 485a. D’où ça vient
Le troisième lot de `docs/maquettes/maquette-compteur-tracteur-v1.html` (§483, écran « Tracteur › Entretien › la fiche du tracteur ») ; « suite » de Nico (29/10). L’admin voyait un chiffre estimé sans pouvoir juger s’il tenait, ni retirer un relevé faux.

### 485b. Ce qui change
- **La fiche du compteur** (`_trFicheCptHtml`), à partir de 1 024 px (`.cpt-fiche`, cachée au téléphone), dans sa zone `#cpt-fiche-zone` : le dernier enfant du panneau de l’Entretien, sur toute la largeur de sa grille (`grid-column:1 / -1`), sous les deux colonnes — dans la colonne de droite, elle n’avait que 194 px ; un tracteur non suivi n’en a pas.
- **Ce que Ma Vigne a appris** : l’écart (× 1,3 « appris sur n intervalles », ou « pas encore appris » sous deux intervalles d’au moins 2 h notées) ; **le rythme au compteur** (`_trRythme` : les vrais relevés des 4 dernières semaines, Δ heures ÷ jours ouvrés du lundi au vendredi, `_trJoursOuvres`) ; **le repère de révision** (`_trRepere` : reste ÷ rythme, arrondi au jour ouvré supérieur, `_trAjoutOuvres`), dit comme un repère, pas une date promise ; le nombre de relevés en 30 jours.
- **La courbe** (`_trCourbeSvg`) : les douze derniers vrais relevés (rond, carré au plein), l’estimé en pointillé jusqu’à aujourd’hui, la révision en rouge, le repère en orange. Couleurs par jetons.
- **Les relevés** (`_trLignesReleves`) : les dix derniers, « pas devant le tracteur » compris, l’estimé du jour en tête ; **l’écart à l’estimé** de chaque vrai relevé = relevé − (relevé d’avant + heures notées entre les deux × l’écart d’aujourd’hui).
- **« Écarter » / « Rétablir »** (`_trRelEcarte`, admin) : le relevé reste écrit, barré, mais ne compte plus (`ecarte:true`, exclu par `_trVrais` : ni base, ni écart, ni rythme) ; `compteur_h` redevient le dernier vrai relevé ; Annuler six secondes. Exempté de tuto.

### 485c. Mesuré
- `mv-harnais-compt3` : 11 assertions — les jours ouvrés, le rythme (92 h en 20 jours ouvrés = 4,6 h) et le repère (14 jours ouvrés, le 18 nov.), l’écart à l’estimé ligne par ligne, la fiche (appris, rythme, repère, courbe, tableau, boutons de l’admin seulement, pas de fiche pour un tracteur non suivi), « Écarter » refusé à un non-admin, qui retire le chiffre et recalcule, « Annuler », le branchement et l’ordinateur seul ; **10/10 mutants**. `compt1`, `compt2`, `traux1a`, `traux1b`, `robustesse-tracteur` verts, contre-épreuves comprises.
- **Chaîne complète verte sur les sources finales** : 591 commandes, en quatre reprises (le bac à sable coupe une commande à cinq minutes). Rougis en route et corrigés : un filet de la courbe sans repli (`mv-harnais-jetons` lit aussi tracteur.js) ; tracteur.js qui enfle de plus de 5 % — `typo-baseline.json` regravé, 223 → 241 ko (COMPT-2 et COMPT-3), le découpage laissé à Nico : le compteur pèse environ 45 ko dans tracteur.js.
- **Build** : app 10.37. **Tutos concernés : aucun** (7 tutos, aucun ne touche ce changement) ; panneau côte à côte rejoué après le dernier retouché, 3/3.
- **Essai réel sur le build** (mode entraînement, Chromium) : ★ **vu en route** — la fiche, rendue d’abord dans la colonne de droite de l’Entretien, n’y avait que 194 px à 1 280 (le panneau d’entraînement, le rail et la colonne de 400 px se partagent l’écran) : texte tassé, tableau à défiler. Dans sa zone pleine largeur : 784 px pour une appli de 1 280 (viewport 1 700 avec le panneau), 610 px à 1 280 avec le panneau ; le tableau tient (782 px, 608 px). Appris, rythme (4,7 h par jour ouvré), repère (16 jours ouvrés, le 20 nov. 2026), courbe, six lignes, cinq « Écarter » pour l’admin ; cachée au téléphone ; aucune erreur.

### 485d. Ce qui reste ouvert
- « Corriger » un relevé : pour l’instant, on l’écarte et on relève à nouveau (le nouveau chiffre porte la date du jour).
- Le repère compte les jours du lundi au vendredi, sans les jours fériés ni le planning (le Pilotage, lui, lit le planning — §440).
- Un tracteur dont tous les vrais relevés sont écartés garde son `compteur_h` d’avant.
- Toujours ouverts depuis §484d et §483e : le plan à plusieurs entretiens, la date au Pilotage, la fiche « Plein fait » sans compteur, la bande des pastilles, la ligne d’aide des pastilles, « Heures de moteur ».

## 486. ★★ COMPT-4 — LE COMPTEUR, LES FINITIONS (29/10 — `src/tracteur.js` (`_trFerie`, `_trRelCorriger`, `_relEtatCorr`, `_relValiderCorr` ; `_trJoursOuvres`, `_trAjoutOuvres`, `_relRendu`, `_relValider`, `_trFicheCptHtml`, `savePleinFiche`, `saveEntretien`, `_trDroiteHtml`, la fiche de session ; `renderTracParcPills` retirée) · `src/pilotage.js` (`_pilData`, la liste) · `src/app.js` (`renderHomeTrac`, `exportRapportSaison`) · `index.html` (la bande des pastilles retirée, « Heures de travail », v10.38) · `src/styles.css` (33 règles des pastilles retirées) · `src/utils.js` (APP 10.38, l’aide du Tracteur) · `src/whats-new.js` · `guide/06-tracteur.html` · `public/sw.js` (SW 11.19) · `scripts/mv-harnais-compt4.mjs` (neuf) · `scripts/mv-harnais-compt1.mjs`, `scripts/mv-harnais-compt3.mjs`, `scripts/mv-harnais-trac3.mjs`, `scripts/mv-harnais-traux1b.mjs` (suivent) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-4.json` · base `39924bf`)

### 486a. D’où ça vient
Nico (29/10) : « finir ce qui est resté ouvert en un lot ». Proposé et accepté (« suite ») : COMPT-4 pour les petits restes de §483e, §484d et §485d ; COMPT-5 pour plusieurs entretiens par tracteur ; le module du compteur à part, ensuite. Libellé choisi : « heures de travail ».

### 486b. Ce qui change
- **« Corriger » un relevé** (`_trRelCorriger`, admin, dans la fiche du compteur) : la feuille du relevé en mode `correction`, bornée entre le vrai relevé d’avant et celui d’après (`_relEtatCorr` : plus bas, plus haut, refusé — le contrôle de séquence de Fleetio) ; l’ancien chiffre reste dans `corrige` ; le dernier relevé se recalcule ; Annuler six secondes. Exempté de tuto.
- **Les jours fériés** (`_trFerie`, les fériés du planning `window._feriesY`) : `_trJoursOuvres` et `_trAjoutOuvres` les sautent — le rythme et le repère de révision aussi.
- **La date d’échéance partout** : `_pilData` reçoit `revDate` et `revJours` ; la liste du Pilotage dit « ou le … » ou « date dépassée », et « Révision le … » pour un tracteur suivi à la date seule ; l’accueil du tractoriste et le rapport de saison la disent après les heures. (La carte Révision du Pilotage, `_pilGmRevision`, reste aux heures.)
- **Le plein** : le bouton « Plein » ne demande plus le compteur qu’à un tracteur suivi (COMPT-1 le demandait à tous) ; **la fiche « Plein fait »** (`saveEntretien`) le demande aussi, et le range dans la fiche.
- **La bande des pastilles retirée** : `renderTracParcPills`, ses deux appels, `#trac-parc-pills` et ses 33 règles (`.tpc`, `.trac-parc-pill`). La ligne d’aide « Le parc » réécrite (la colonne de droite sur ordinateur, l’onglet Entretien au téléphone).
- **« Heures de travail »** remplace « Heures de moteur » à l’écran : la bande des compteurs, la fiche d’une session, la colonne de droite (« Ce mois »), l’aide et le guide — ce sont les heures notées par les sessions, pas le cadran.

### 486c. Mesuré
- `mv-harnais-compt4` : 13 assertions — les jours ouvrés sans les fériés (du 9 au 13 nov. : 3 ; 14 jours ouvrés après le 29 oct. : le 19 nov.), « Corriger » borné, ouvert sur les voisins, qui remplace, s’annule, recalcule le dernier relevé et se refuse à un non-admin, le plein et « Plein fait », la date au Pilotage, à l’accueil et au rapport, la bande retirée, « heures de travail », l’aide du parc ; **8/8 mutants**. Suivent : `compt1` (l’ancre du plein, désormais double, précisée), `compt3` (l’ancre des jours ouvrés), `trac3` et `traux1b` (« de travail », la règle CSS sans la bande).
- **Chaîne complète verte sur les sources finales** : 593 commandes, en quatre reprises. Rougi en route et corrigé : `mv-harnais-pastilles` — sa contre-épreuve « une pastille maison de plus » ne mordait plus, le compte étant tombé de 90 à 88 avec `.tpc-pill` et `.trac-parc-pill` ; le plafond descend à 88, comme il le demande.
- **Build** : app 10.38. **Tutos concernés : aucun** (7 tutos, aucun ne touche ce changement) ; panneau côte à côte rejoué, 3/3.
- **Essai réel sur le build** (mode entraînement, Chromium) : quatre « Corriger » dans la fiche ; la feuille « corriger le relevé du 23 Oct », bornée « entre 1 154 h et 1 178 h » ; 1 165 accepté, « Corriger : 1 165 h » ; après, `h` 1165 et `corrige` 1163,5, le toast « Relevé corrigé · 1 165 h (était 1 163,5 h) ». Le repère saute l’Armistice : 16 jours ouvrés, le 23 nov. 2026 (le 20 sans férié). Plus de `#trac-parc-pills` ; « Heures de travail » dans la bande. Aucune erreur. La date dans la liste du Pilotage n’a pas pu être vue en entraînement (la liste du parc n’y est pas affichée) : seul le harnais la garde.

### 486d. Ce qui reste ouvert
- **COMPT-5** : plusieurs entretiens par tracteur (la maquette : révision, vidange pont et boîte, filtre à air cabine, « Ajouter un entretien »).
- **Le module du compteur** à part (environ 45 ko dans tracteur.js).
- La carte Révision du Pilotage (`_pilGmRevision`) ne lit que les heures.

## 487. ★★ COMPT-5 — PLUSIEURS ENTRETIENS PAR TRACTEUR (29/10 — `src/tracteur.js` (`_trEntEtat`, `_trEntTexte`, `_trEntIntervalle`, `_trEntPlusUrgent`, `_trEntUrgent`, `_trEntProgHtml`, `_trEntForm`, `_trEntEdit`, `_trEntAnnuler`, `_trEntSave`, `_trEntSuppr`, `_trEntFait`, `_relFait` ; `_relOuvrir`, `_trRelCorriger`, `_trRevFaite`, `_trReleveExige`, `_trDroiteHtml`, `renderEntretiens`) · `index.html` (`#rel-faits`, v10.39) · `src/styles.css` · `src/utils.js` (APP 10.39, l’aide du Tracteur) · `src/whats-new.js` · `guide/06-tracteur.html` · `public/sw.js` (SW 11.20) · `scripts/mv-harnais-compt5.mjs` (neuf) · `scripts/mv-harnais-autete1.mjs` (sa fenêtre) · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-5.json` · base `541b1c5`)

### 487a. D’où ça vient
Le dernier lot fonctionnel du plan accepté par Nico (29/10, §486a) ; « go » de Nico. La maquette (`docs/maquettes/maquette-compteur-tracteur-v1.html`, « Entretiens programmés ») : révision 500 h, vidange pont et boîte 1 000 h, filtre à air cabine 12 mois, « Ajouter un entretien ».

### 487b. Ce qui change
- **Les autres entretiens** : `t.entretiens_prog` = [{id, nom, tous_h, tous_mois, fait_h, fait_d}], à côté de la révision — qui reste sur `revision_h`, que tous les lecteurs lisent déjà.
- **L’échéance au premier atteint** (`_trEntEtat`) : `fait_h + tous_h` au compteur estimé, `fait_d + tous_mois` ; **seuils à la mesure de l’intervalle** — rouge à un dixième (5 h au moins) ou 14 jours, orange au quart (10 h au moins) ou 30 jours : un graissage toutes les 50 h serait sinon toujours rouge (pour 500 h : 50 et 125, les seuils de la révision). Jamais noté : dit tel quel.
- **La carte « Autres entretiens »** (`_trEntProgHtml`) sous la carte Révision : chaque entretien, son intervalle, sa dernière fois, son échéance en couleur ; « Fait » (tractoriste, admin) ; le crayon et « Ajouter » (admin) ouvrent un formulaire sur place (`_trEntForm` : nom, heures et/ou mois, dernière fois) ; « Retirer » avec Annuler.
- **« Fait »** (`_trEntFait`) : la feuille du compteur (src `entretien`, le nom de l’entretien en sous-titre), puis `fait_h`/`fait_d` et le prochain dans le toast ; Annuler.
- **« Fait aussi »** dans la feuille de « Révision faite » (`#rel-faits`, des cases, `_relFait`) : les entretiens cochés sont notés au même compteur ; le toast les nomme ; Annuler les défait avec la révision.
- **Le plus urgent** (`_trEntPlusUrgent` : dépassé, puis rouge, puis orange) : rouge, il s’ajoute à la ligne du tracteur dans le parc de droite (`_trEntUrgent`) et compte pour le compteur exigé au démarrage (`_trReleveExige` : dépassé → « dépassée », rouge → « proche »).
- **Six gestes neufs exemptés de tuto**, chacun avec sa raison.

### 487c. Mesuré
- `mv-harnais-compt5` : 13 assertions — l’échéance aux heures, aux mois et au premier atteint, « jamais noté », les seuils proportionnels (un graissage de 50 h à 14 h, à 10 h, à 4 h), le plus urgent, le compteur exigé, le formulaire (nom et intervalle obligatoires, un nouvel entretien complet, l’admin seul, « Retirer » annulable), « Fait » et son Annuler, « Fait aussi » à la révision et son Annuler, les branchements ; **9/9 mutants**. Les harnais du compteur (`compt1` à `compt4`), du Tracteur et du style restent verts, contre-épreuves comprises.
- **Chaîne complète verte** : 595 commandes, en sept reprises. Rougis en route et corrigés : le **preflight** (C19 : `'+e.nom+'` à moins de 260 caractères d’un `<div` — du texte, échappé plus loin par `_trDroiteHtml`, ou posé en `textContent` ; écrit par `join`), **tracteur.js** qui enfle (241 → 254 ko, `typo-baseline.json` regravé), **les boutons « maison »** (66 pour 65 au plafond : les boutons de la carte prennent le kit `mvbtn mvbtn-secondaire`), et **AUTETE-1** (I4 cherchait la ligne d’AUJ-TETE-1 dans les 30 premières lignes de sw.js ; chaque lot en ajoute une en tête : la fenêtre passe à 80). Après le dernier retouché : preflight, les harnais du compteur et du style verts.
- **Build** : app 10.39. **Tutos concernés : aucun** (7 tutos, aucun ne touche ce changement) ; panneau côte à côte rejoué, 3/3.
- **Essai réel sur le build** (mode entraînement, Chromium 390 px) : la carte « Autres entretiens » (vidange pont et boîte « dans 334 h », graissage de 50 h « dans 4 h ») ; « Ajouter » ouvre le formulaire, « Filtre à air cabine », 12 mois, enregistré ; « Révision faite » montre « Fait aussi » avec les trois cases ; graissage coché, 1 190 → révision suivante à 1 690 h, graissage noté à 1 190 h, la vidange intacte, le toast « … · Graissage aussi ». Aucune erreur.

### 487d. Ce qui reste ouvert
- **Le module du compteur** à part : tracteur.js porte maintenant la série entière.
- La carte Révision du Pilotage (`_pilGmRevision`) ne lit que les heures de la révision ; les autres entretiens n’y remontent pas.

## 488. ★ COMPT-6 — LE COMPTEUR DANS SON MODULE (29/10 — `src/compteur.js` (neuf) · `src/tracteur.js` · `scripts/mv-harnais-compt1.mjs` à `compt5.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-6.json` · base `42235ca`)

### 488a. D’où ça vient
Laissé ouvert par COMPT-3 à COMPT-5 (§485d–§487d) ; « go » de Nico (29/10). La série du compteur avait porté tracteur.js de 199 à 258 ko, avec trois regravures du plafond de croissance (`typo-baseline.json`).

### 488b. Ce qui change
- **`src/compteur.js`** : tout le compteur des tracteurs, d’un bloc — relevés, estimation, feuille du relevé, relevé au passage, révision et intervalles, compteur exigé, fiche sur ordinateur, autres entretiens (53 fonctions, 44 ko). **tracteur.js l’importe en tête** (`import './compteur.js'`) : `app.js` ne change pas, la place dans l’ordre des imports non plus.
- **Le pont** (`window._trPont`, posé par tracteur.js) : ce que le compteur emprunte au Tracteur — ses outils (`_gnrNum`, `_fmtDate`, `_saveData`, `_openOv`…), ses rendus, et la sélection (`selId`, `onglet`). Un objet à part, pour ne rien écraser sur `window`. Côté compteur, de petits délégués aux mêmes noms, et `_trSelTracteur()` à la place de `_tracSelId?getTracteurSel():null`.
- **Les relais** dans tracteur.js : les seize noms que le Tracteur appelle (`_trCompteur`, `_relOuvrir`, `_trRelevePassage`…), en `var … = function` qui passe par `window` (`_cpt`, avec le repli d’avant si le compteur manque). **Les gestes du Tracteur n’ont pas changé d’une lettre** ; un harnais qui joue une fonction de tracteur.js sans le compteur retombe sur le repli d’avant.
- **Les drapeaux de reprise** (`_trPleinH`, `_trDemH`, `_trEntH`) restent dans tracteur.js, où vivent les gestes qui les posent ; `_TR_REL_MAX` (120) est redit dans les deux fichiers.
- **Les harnais compt1 à compt5** lisent tracteur.js + compteur.js, bout à bout (le précédent de WN-COUPE-1, §469) ; compt2 et compt5 fournissent `_trSelTracteur`.
- **Rien ne change à l’écran** : ni aide, ni guide, ni nouveautés. **Pas de montée de version** : seuls des fichiers de module bougent (la règle des modules).

### 488c. Mesuré
- tracteur.js : **258 → 221 ko** ; compteur.js : 44 ko.
- **Chaîne complète verte** : 595 commandes, en quatre reprises, puis la tête (62 commandes) rejouée après le dernier retouché. **Un rouge, et il avait raison** : `mv-harnais-globaux` a vu un nom libre `a` dans tracteur.js — les replis de deux relais (`_trAjoutMois`, `_trDateAn`) lisaient `a[0]`, qui n’existe pas à cet endroit : un ReferenceError en production à la première révision réglée en mois. Écrits `arguments[0]`, vérifiés à la main (repli et relais).
- Harnais du compteur (`compt1` à `compt5`) et du Tracteur (`traux1a`, `traux1b`, `trac3`, `robustesse-tracteur`, `sessions`, `coeq1`), couverture des tutos : verts, contre-épreuves comprises.
- **Build** vert. **Tutos concernés : aucun.**
- **Essai réel sur le build** (mode entraînement, Chromium 1 280 px) : `window._trPont` posé, `_trCompteur` et `_relOuvrir` joignables ; la fiche du compteur, la carte « Autres entretiens » et la révision s’affichent par les relais ; « Relever » ouvre la feuille (geste global), 1 190 validé → le relevé `manuel` rangé, `compteur_h` à 1 190 ; le parc dit « 1 190 h · révision dans 510 h · Graissage dans 0 h ». Aucune erreur.

### 488d. Ce qui reste ouvert
- La carte Révision du Pilotage (`_pilGmRevision`) ne lit que les heures de la révision ; les autres entretiens et les dates n’y remontent pas.

## 489. ★★ COMPT-7 — LA CARTE DE LA RÉVISION DU PILOTAGE DIT L’ENTRETIEN LE PLUS PRESSANT (29/10 — `src/pilotage.js` (`_pilGmRevision` réécrite, `_pilGmRevOrdre`, `_pilGmDateAn`, `_pilGmRevTxt` ; `_pilData` : `ents` ; la carte ② du tracteur) · `src/compteur.js` (`window._trEntEtat`) · `src/utils.js` (APP 10.40, l’info `pil.trxrev`) · `index.html` (v10.40) · `src/whats-new.js` · `guide/11-pilotage.html` · `public/sw.js` (SW 11.21) · `scripts/mv-harnais-compt7.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-480-529.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/COMPT-7.json` · base `8116939`)

### 489a. D’où ça vient
Le dernier point laissé ouvert par la série du compteur (§486d–§488d) ; « suite » de Nico (29/10). La carte « Révision » du tracteur, dans le Pilotage, ne lisait que les heures de la révision : une révision dépassée à la date, un tracteur suivi à la date seule, un graissage dû demain restaient muets.

### 489b. Ce qui change
- **`_pilGmRevision` prend l’entretien le plus pressant** de chaque tracteur : la révision (heures restantes, et la date de son intervalle) et les autres entretiens (`_pilData` les lit par `window._trEntEtat`, avec leurs propres seuils, §487). **Rang 0** : dépassé, aux heures ou à la date ; **rang 1** : atteint pendant les travaux en cours, ou dû dans les 14 jours ; **rang 2** : proche (révision à 120 h ou 30 jours, entretien orange) — sinon rien, comme avant. Entre égaux : les heures, puis les jours.
- **Comme avant pour la révision aux heures** : même objet rendu (`t`, `seq`, `tot`, `dans`, `sansBareme`), mêmes textes (« Révision dépassée de n h », « Atteinte pendant : … », « Pas atteinte par les travaux en cours ») ; `mv-harnais-gnr-mesure` et `gnr2` restent verts sans retouche.
- **La carte** lit l’entretien choisi (`R.it`), plus `revReste` : son titre le nomme (« Graissage · NH »), la ligne en grand dit « date dépassée (le …) » ou « … le 5 nov. » quand c’est la date qui presse, la date vient sous la carte quand elle n’est pas déjà dite, et **« Aussi »** nomme les autres en vue du même tracteur.
- **L’info de la carte** (`pil.trxrev`) le dit ; le guide du Pilotage aussi.

### 489c. Mesuré
- `mv-harnais-compt7` : 9 assertions — la compatibilité (révision atteinte pendant un travail devant une plus proche hors travaux, le Griffage à 82 %, dépassée d’abord, loin = rien), la date (400 h devant mais la date passée → dépassée ; suivi à la date seule, dû dans 7 jours → montré), un autre entretien qui prend la carte (le graissage pendant le Rognage), « aussi », un entretien loin qui ne fait rien, les textes, la carte qui ne lit plus `revReste`, `_pilData` et l’export ; **8/8 mutants**.
- `mv-harnais-gnr-mesure` (dont ④, qui rend `_pilCkTracteur` en entier avec la nouvelle carte) et `gnr2` verts sans retouche, contre-épreuves comprises ; `compt1`, `compt4`, `compt5`, `robustesse-pilotage` verts.
- **Chaîne complète verte** : 597 commandes, en quatre reprises, sans un rouge. **Build** : app 10.40. **Tutos concernés : aucun.**
- **Pas vérifiable en entraînement** : le Pilotage ne s’ouvre pas dans le domaine fictif (déjà noté en §486c). Les nouvelles branches de la carte — le titre au nom de l’entretien, la date en grand, « Aussi » — ne sont gardées que par le harnais (logique jouée, texte du rendu vérifié dans la source) : **à regarder sur le vrai Pilotage après déploiement**.

### 489d. Ce qui reste ouvert
- La série du compteur est close. La liste des tracteurs du Pilotage dit toujours la seule révision (heures et date, §486) ; les autres entretiens n’y sont pas.
