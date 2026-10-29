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
