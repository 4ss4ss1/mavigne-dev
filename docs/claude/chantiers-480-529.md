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
