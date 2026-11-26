# Ma Vigne — Chantiers §580 à §629

> Ouvert le 16/11/2026 (§580), sur le modèle de `chantiers-530-579.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.

## 580. ★★★ MOTS-0 — MOINS À LIRE, PLUS À VOIR : LE RELEVÉ DES 46 ÉCRANS, HUIT RÈGLES, UN LEXIQUE, ET LE CLIQUET DES MOTS (16/11 — `scripts/mv-mots-rendu.mjs` (neuf) · `scripts/mv-mots-baseline.json` (neuf) · `scripts/mv-harnais-mots0.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-ci1.mjs` · `package.json` · `.github/workflows/ci.yml` · `docs/maquettes/maquette-moins-de-texte-v3.html` (neuf) · `docs/maquettes/LISEZMOI.md`)

### 580a. D’où ça vient
- **Nico, 16/11** : « dans le pilotage il y a trop d’écriture, de texte à lire, et donc l’information est à chercher et nous fait dépenser trop de charge cognitive. Regarde ce que font les plus grands logiciels et propose. » Objectif confirmé : que l’information se voie d’un coup d’œil, sans lire.
- Puis, le même jour : « vérifie tous les modules et fais une maquette de tous, je pense que cave est dans le même cas » ; puis « vérifie aussi dans tous les onglets du pilotage pour que ça passe propre, qu’on ait quelque chose de cohérent au niveau de l’application ». Trois maquettes : v1 (le Pilotage et le benchmark), v2 (les 46 écrans, cinq refaits), v3 (tout le Pilotage, la cohérence). **« Go » sur la v3**, les avis proposés suivis. La v3 est dans `docs/maquettes/` ; elle reprend tout, sauf le tableau du benchmark (580c le garde).
- C’est le second temps annoncé par le rangement admin (§577) : « chaque lot DÉPLACE sans redessiner ; l’allègement de l’écran vient ensuite ». L’allègement a maintenant ses règles et sa mesure.

### 580b. Ce qui a été mesuré
- **Sur l’appli construite** (démo, admin ; base `ebd5f09`, « tete4c » ; téléphone 390 × 844, PC 1366 × 900 ; l’horloge au mardi 27/10/2026, 9 h), **46 écrans** : les modules, leurs onglets, leurs sous-onglets. Un mot = au moins deux lettres ; ni le bandeau ni la ligne d’écran ; fenêtres fermées.
- **Au téléphone : 8 818 mots**, 75 phrases de 15 mots et plus (le relevé du matin, qui dédoublonnait autrement, en comptait 77 — c’est le chiffre des maquettes). **Par module** (mots · phrases longues) : Pilotage 4 018 · 42 ; Cave 2 550 · 23 ; Phyto 551 · 3 ; Réserve 289 · 4 ; Planning 424 · 3 ; Vigne 587 · 1 ; Tracteur 133 · 1 ; Réglages 266 · 0.
- **Le texte en trop n’est pas réparti : il est là où l’appli calcule.** Pilotage › Économie porte 26 des 42 phrases longues du Pilotage (Le détail de l’exercice : 649 mots, 5,7 hauteurs d’écran ; Synthèse : 85 mots à passer avant le premier grand chiffre, à 680 px du haut). Cave › Le Millésime porte 15 des 23 de la Cave ; la légende de ses Courbes fait 170 mots, le plus long bloc de l’appli. Là où l’appli enregistre un geste — Tracteur › Sessions (30 mots), le Journal, les Parcelles, Planning › Mois — elle est déjà sobre.
- **Six familles de texte en trop** : la méthode de calcul à demeure (« Chaque euro est posé à sa date… », 93 mots) ; l’état écrit en phrase (« Toute l’équipe est là », « Rien à régler ») ; le sous-titre qui redit le titre (« Économie — budget, rythme de dépense et prix de revient », sur quatre onglets) ; le mode d’emploi à demeure (« Pour ranger : ⇅ prend la parcelle en main… ») ; l’avis de réglage en tête d’écran ; le même chiffre plusieurs fois (« 255 L » trois fois sur L’équipe & le matériel).
- **Pas mesuré** : la fiche d’une personne au Planning (ses quatre onglets comptent pour un écran : `planFicheTab` ne l’ouvre pas sans personne choisie), Parcelles › Carte, les fenêtres qui s’ouvrent par-dessus, le thème sombre, la vue de l’équipe (jugée bonne par Nico le 13/11).

### 580c. Les règles, le lexique, les pastilles — décidés le 16/11
- **Ce que font les références** (leurs règles publiées, lues le 16/11 ; aucun de leurs logiciels ouvert avec un compte) : Nielsen Norman Group, 1997 — 79 % des gens survolent une page, 16 % la lisent mot à mot ; moitié moins de mots, 58 % d’efficacité mesurée en plus (`nngroup.com/alertbox/9710a.html`). Nielsen, 2008 — 20 à 28 % des mots lus ; cent mots de plus, 4,4 s de plus (`nngroup.com/alertbox/percent-text-read.html`). Stephen Few — un tableau de bord tient sur un écran et se surveille d’un coup d’œil. Microsoft, Power BI — tout sur un écran, sans ascenseur, le détail derrière, le plus important en haut à gauche (`learn.microsoft.com/en-gb/power-BI/create-reports/service-dashboards-design-tips`). Apple — un graphique simple, le détail à la demande, mais son message résumé en une ligne. IBM Carbon — un état : une forme, une couleur, un mot court (`carbondesignsystem.com/patterns/status-indicator-pattern`). Grafana — la description d’un panneau s’ouvre sur son « i ». ⚠️ Les deux études de Nielsen portent sur des pages web lues une fois, pas sur un outil ouvert chaque matin.
- **Huit règles** : ① une phrase par écran, celle du haut (elle garde ses repères : la règle de Nico du 23/10) ; ② un chiffre = une étiquette de un à trois mots et un repère de quatre à cinq mots au plus ; ③ l’état se dessine — une pastille ; rien à signaler = une coche, sans phrase ; ④ la méthode de calcul va derrière le « i » (rien n’est supprimé : le texte passe dans la fiche `MV_INFO` du chiffre) ; ⑤ ce qui demande un geste est en haut, le reste se replie avec son chiffre sur le titre (replier ne cache aucun chiffre) ; ⑥ un chiffre, une fois par écran ; ⑦ ni sous-titre d’écran ni mode d’emploi à demeure — l’aide s’ouvre par « ? » ; ⑧ un écran vide tient en une ligne : ce qu’on utilise en attendant, et ce qui manque.
- **Le gabarit d’un écran** : la phrase · ce qui demande un geste (une seule bande d’alerte, sous la phrase) · les chiffres · le reste replié.
- **Le lexique — onze choses, onze mots** (le mot gardé ← ceux qui partent) : **fait** ← réalisé, avancement, barème réalisé, validé · **reste** ← restantes, reste à engager, encore à faire · **prévu** (des heures) ← planifiées, attendus · **budget** (les euros de la campagne) ← budget de la période · **engagé** (les euros de la campagne, sans date) ← dépensé, consommé · **sorti** (les euros de l’exercice, à leur date) ← dépensé, « engagé à ce jour » dans Le détail de l’exercice · **présents** (ceux qui sont là aujourd’hui) ← effectif, présences, au champ · **équipe** (les personnes sous contrat) ← actifs, personnel · **renfort** (les personnes à trouver) ← « effectif » dans Travaux, à trouver · **fin prévue** ← fin de saison, fin estimée, pour finir · **la campagne** ← la saison, la période, d’automne. Trois écritures : une date s’écrit « 25 nov. » ; une estimation prend « ≈ » ; un total incomplet prend « ≥ ».
- **Quatre couleurs de pastille** : vert = c’est bon ; orange = à surveiller, ou il manque une donnée ; rouge = en retard, ou à faire maintenant ; gris = une information. **Le « ! » des tuiles (`_pilFlag`) et le point de couleur devant un titre de tuile (`_pilTile`, deuxième argument) partent** : le « ! » veut dire « chiffre incomplet » et ne le dit que dans une bulle `title`, invisible au téléphone — il se pose sur « 0 pers. à trouver, l’équipe suffit » ; le point est une couleur fixe par tuile, pas un état.
- **Un écran, un périmètre** : la campagne partout ; l’exercice dans Économie › Le détail de l’exercice et dans Archives. Les trois tuiles « exercice » en tête de Travaux partent. La barre « Vous regardez » dit ce que l’écran chiffre : l’avis de 24 mots (« Cet écran chiffre Après-vendange…, pas l’exercice comptable affiché en haut ») disparaît de Synthèse, Postes, Parcelles et Achats. Les pour-cent sont entiers sur les tuiles et les phrases ; la décimale reste dans le détail ouvert.
- **Dans la maquette v3**, les douze écrans du Pilotage passent de 3 252 mots à 637 au téléphone, aucun au-delà de 1,6 hauteur d’écran. Aujourd’hui y part de la structure validée le 13/11 (§577 : la phrase, à décider, l’équipe du jour, quatre portes ; plus de bascule Terrain · Cave · Économie).
- **Pas d’écran refait pour Vigne, Tracteur, Réglages et Planning** : rien à redessiner, six phrases à déplacer (la liste est dans la maquette, « Module par module »). Annoncé à Nico comme un écart au plan d’un écran par module.

### 580d. Ce qui a été fait : le cliquet des mots
- **`scripts/mv-mots-rendu.mjs`** (`npm run test:mots`, après le build) — sur le modèle de l’expérience d’usage (§459) : le build servi en local, la démo ouverte sur le domaine fictif des tutos, l’horloge posée au 27/10/2026 9 h, les 46 écrans au téléphone et sur ordinateur. Quatre mesures par écran, comparées à **`scripts/mv-mots-baseline.json`** : `mots` (jeu de 2), `p15` (les blocs de 15 mots et plus, aucun jeu), `avant` (les mots avant le premier chiffre de 20 px et plus, jeu de 2 ; `null` si l’écran n’en a pas), `lex` (au Pilotage seulement : les mots hors lexique, aucun jeu). Hausse → rouge nommé ; baisse → « regraver » ; `--baseline` refuse une hausse sans `--accepte "<raison>"`, et une référence trouée ; `--liste` imprime le relevé ; `--contre` pose une phrase de 22 mots et un mot hors lexique en tête de Synthèse et exige que les quatre mesures rougissent.
- **Un bloc** = le plus petit élément non « inline » au-dessus d’un texte : une phrase coupée par du gras reste une phrase, et un texte n’est compté qu’une fois.
- **Un écran** = une clé (« Cave › Le Millésime › Courbes »), une page, les gestes pour y arriver : `{ js }` appelle une fonction de `window` (elle doit exister, sinon rouge), `{ clic }` touche le bouton dont c’est le texte exact (la bascule d’Aujourd’hui, les sous-vues d’Économie). ★ **Un onglet qui déménage** (rangement admin) : retirer sa clé de `ECRANS`, poser la nouvelle, regraver avec `--motif` — `mv-harnais-mots0` refuse une référence qui garde un écran disparu.
- **`scripts/mv-harnais-mots0.mjs`** (dans la liste, avec sa contre-épreuve) garde le branchement : npm, la CI après l’expérience d’usage, 46 écrans sans doublon et quatorze au Pilotage, la référence complète et datée de la même horloge que `mv-ux-rendu.mjs`, le refus de regraver, la contre-épreuve, le lexique, le lexique au Pilotage seulement, le bandeau hors du compte. `mv-harnais-ci1` suit : les mots veulent leur build et leur navigateur, et ne se jouent pas dans le job des contrôles.
- **La CI** : une étape de plus dans le job « mesures », après l’expérience d’usage. Aucun bump, aucune annonce : rien de ce lot n’arrive chez un client.

### 580e. Arbitrages, et ce qui a été trouvé en route
- ★★ **L’attente fixe coûtait quatre minutes** (92 écrans × 900 ms par geste) : trop pour le job « mesures » (CI-1, §514 — aucun job près de sa limite). `pose()` attend que le texte de la page ne bouge plus (deux lectures égales à 200 ms d’écart, 3 s au plus) : 2 min 36 dans le bac à sable, et **les mêmes mots au mot près** que le relevé à délai fixe (8 818 et 10 296).
- ★★ **Le lexique ne se lit qu’au Pilotage, et dans le rendu, pas dans `lint-vocabulaire.mjs`** (annoncé à Nico comme « on l’ajoute au contrôle du vocabulaire ») : lu dans les sources, « consommé » rougirait sur un intrant de la Réserve et « restants » sur les kilos du Millésime, où ce sont les bons mots. Le compte au Pilotage vaut 100 aujourd’hui ; c’est un cliquet, pas un zéro exigé.
- ★★★ **La tuile « Conformité » d’Aujourd’hui ne peut dire que « 0 point à régler »** : `_pilCk2Modele` (`pilotage.js`) compte les lignes de `_pilDiag()` dont `touche` contient `'cfm'` — **aucune ligne de `_pilDiag()` ne porte `'cfm'`** (elles portent `travaux`, `effectif`, `budget`). Pendant ce temps l’onglet Conformité signale « SIRET manquant » et « catalogue E-Phy absent », par ses propres tuiles. Trouvé en cherchant pourquoi les deux écrans se contredisaient. **Pas corrigé dans ce lot** : il faut d’abord dire ce qui compte comme « un point à régler ».
- ★★★ **« Coût à la fin » : deux calculs, deux chiffres** — 15 317 € sur Aujourd’hui (`cockpit-vue.js` : le payé, plus le reste au barème, corrigé du rythme de l’équipe dès 40 % du travail fait), 81,0 k€ sous le graphique de Synthèse (`pilotage.js`, vers la ligne 8216 : `projEndV = cum + pace × jours jusqu’à la fin de la PÉRIODE`). Le second prolonge le rythme des derniers jours (« Rythme des 3 derniers jours : 638 € par jour », sur la démo) jusqu’à la fin de la période, le 28 février — 124 jours —, alors que la fin prévue des travaux est le 25 novembre. D’où « budget épuisé le 18 nov. » à côté de « Le budget tient ». **Pas corrigé dans ce lot** : la fenêtre du rythme est un arbitrage de Nico (le commentaire au-dessus du calcul le raconte).
- ★ **« La campagne » a deux sens dans l’appli** : partout, c’est la période de travaux en cours (« Vous regardez : La campagne », « Clôturer la campagne ») ; dans Archives, « Campagne 2026–2027 · 1 période » en fait l’année qui contient les périodes. Vu en écrivant le lexique, **après** la validation : le cliquet ne compte donc que « la période », « cette période », « de la période » — pas « 2 périodes ». À trancher avec Nico.
- **Vu sur la démo, pas cherché** : Économie › Parcelles — trois parcelles « faites à 31 % » avec 0 € de main-d’œuvre et un écart de −100 % ; Le détail de l’exercice — « +220,1 % » à date comparable à côté de « −6,1 % » sur l’exercice complet ; le rendement 2026 vaut « 37,8 hL/ha, constaté » dans Revient et « ≈ 37,9, estimé » dans Cave › Le Millésime ; Cave › Aujourd’hui annonce « À surveiller 4 » au sommaire et en liste 2.
- **À retirer de l’écran, vu au relevé** : Économie › Achats porte trois paragraphes de conception (103 mots : « Le prix retourne dans l’objet, pas dans une table à part… ») — écrits pour nous, lus par le client ; Réserve › Intrants écrit « (lot suivant) ».
- **Le mot « phrases » des maquettes** compte des blocs de 8 mots et plus, où une ligne de liste entre aussi (le Registre du Phyto : 14, aucune vraie phrase). Le cliquet ne garde que 15 mots et plus.

### 580f. Mesuré
- `npm run test:mots` sur le build : **92 écrans relevés**, vert — mots : 8 818 au téléphone, 10 296 sur ordinateur ; phrases de 15 mots et plus : 75 et 86 ; le pire « avant » : 85 ; hors lexique au Pilotage : 100 et 100. Rejoué deux fois de suite : aucune hausse, aucune baisse. `-- --contre` : les **4** défauts rougissent (mots 445 → 470, p15 5 → 6, avant 85 → 110, lex 14 → 15).
- `mv-harnais-mots0` (neuf, branché) : **19 assertions**, **22/22** contre-épreuves. `mv-harnais-ci1` : 23 vertes, 20/20.
- La chaîne : **764 commandes, aucun rouge** (623 s), au premier passage. La CI n’a pas tourné ici : l’étape neuve du job « mesures » se vérifie au premier envoi (trois minutes de plus, pour une limite de quinze).

### 580g. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : les deux désaccords de calcul à trancher, puis les lots, dans l’ordre validé.

## 581. ★★★ COHER-1 — TROIS DÉSACCORDS ENTRE ÉCRANS DU PILOTAGE FERMÉS : LA TUILE CONFORMITÉ COMPTE CE QUE L’ONGLET SIGNALE, UN SEUL « COÛT À LA FIN », « CAMPAGNE » N’A PLUS QU’UN SENS DANS ARCHIVES (16/11 — `src/pilotage.js` · `src/cockpit-vue.js` · `src/utils.js` · `src/whats-new.js` · `index.html` (versions) · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-coher1.mjs` (neuf) · `scripts/mv-harnais-ref1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · deux captures de la démo du site)

### 581a. D’où ça vient
- Le §580e laissait deux désaccords de calcul « à trancher avant le lot Économie », et un mot à deux sens. **Nico, 16/11** : « ok, suite (on prend tes recommandations) » — la tuile compte ce que l’onglet signale ; le graphique reprend le chiffre d’Aujourd’hui, sans « budget épuisé le… » quand le budget tient ; dans Archives, « campagne » devient l’année.
- Alléger un écran qui se contredit ne sert à rien : ce lot passe avant Économie › Synthèse (§28, « ★ MOINS DE TEXTE »).

### 581b. La cause, lue dans le code
- **Conformité.** `_pilCk2Modele` comptait `_pilDiag().filter(x => x.touche.indexOf('cfm') >= 0)`. Aucune ligne de `_pilDiag()` ne porte `'cfm'` : la tuile d’Aujourd’hui ne pouvait afficher que « 0 point à régler · Rien à régler ». L’onglet, lui, écrit ses mentions tuile par tuile, chacune à sa façon (`_pilPanelPhyto` : « SIRET manquant » ; `_pilIftTuile` : « catalogue E-Phy absent » ; le cuivre : `cu.over`). Deux écrans, deux sources, aucune commune.
- **Coût à la fin.** Aujourd’hui lit `E.projFin` (`_pilCk2Eco` : l’engagé, plus le reste au barème, corrigé de la cadence quand elle s’applique). Le graphique de Synthèse lisait `TL.projEndV = cum + rythme × jours jusqu’à la fin de la PÉRIODE` (`_pecTimeline`). Sur la démo : 1 940 € engagés en trois jours, 638 € par jour, 124 jours jusqu’au 28 février → 81,0 k€ et « budget épuisé le 18 nov. », sous un verdict « Le budget tient » et face à 15 317 € sur Aujourd’hui. Le rythme de trois jours de travail ne dit rien des cent jours qui suivent la fin des travaux (25 novembre).
- **Archives.** `_arcLigne` écrivait « Campagne 2026–2027 · 1 période » : l’année du 1er août au 31 juillet (`_mvCampagneBornes`), qui contient les périodes de travail. Sur le MÊME écran, le bilan par année (ARCH-2) écrit « Aucune campagne close cette année » — la campagne y est la période. Et la barre « Vous regardez » (PIL-RANGE-2a, §443) appelle ce cadre « L’année vigne ».

### 581c. Ce qui a été fait
- **`_pilCfmPoints()` — une liste, deux lecteurs.** Un point = ce que l’onglet écrit sur une tuile avant un contrôle : un plafond de cuivre dépassé (`_cfmCuivre().over`), un registre qui n’est pas prêt (`_cfmRegPoint(V)` : SIRET manquant, N à compléter, N sans date — l’ordre de `_regVerdict`), un IFT sans catalogue alors qu’il y a des traitements (`_cfmIftPoint(R)`). Les tuiles du registre et de l’IFT relisent ces deux petites fonctions : changer la mention d’une tuile, c’est changer le point. Le modèle d’Aujourd’hui lit la liste, sous garde (`try`, liste vide en cas d’erreur) ; le texte nomme le premier point et compte les autres (« Registre : SIRET manquant · +1 »). La fiche « i » de la tuile est réécrite.
- **`_pecTimeline(E, finIso)` — la projection rejoint le coût à la fin.** `finV = max(cum, E.projFin)` ; `finMs` = la fin prévue des travaux passée par `_pilTabEco` (`_pilMargeCalc(d).proj`, la date d’Aujourd’hui), à défaut la fin de la période ; `projT0` = aujourd’hui (rien ne s’engage entre la dernière saisie et ce matin) ; `projMs` (« budget épuisé le ») n’existe que si `finV > budget` : le jour où la projection croise le budget. `projEndV` n’existe plus. Le graphique trace à plat jusqu’à aujourd’hui, puis jusqu’à (`finMs`, `finV`) ; la ligne sous le titre écrit « coût à la fin 15 317 €, fin prévue 25 nov. » (`_ecoEur`, `_pecJourCourt` — l’euro et le jour d’Aujourd’hui) ; la légende dit « Projection » ; le verdict n’ajoute « Le budget serait épuisé le…, avant la fin des travaux » que si la date existe. Le rythme (`pace`, `nDays`) reste affiché : une mesure, plus une prévision.
- **Archives.** Une ligne porte ses années (« 2026–2027 », comme le bilan par année dessous) et compte ses campagnes ; la phrase du haut dit « Toutes les années vigne sur le même axe » ; le compteur : « années vigne », « campagnes » (accordés — « périodes » restait au pluriel pour une seule) ; l’écran vide parle de campagnes. Les noms du code (`_arcCampagneDe`, `_mvCampagneBornes`) ne changent pas.
- **`scripts/mv-harnais-coher1.mjs`** (neuf, dans la liste) : il JOUE le vrai code — la liste sur onze situations, `_pecTimeline` sur le cas de la démo et neuf bords (horloge posée), `_arcLigne` — et lit les branchements, les fiches, le guide, l’annonce, les versions.

### 581d. Arbitrages, et ce qui a été trouvé en route
- ★★ **Le catalogue E-Phy absent compte comme un point** (décidé : « SIRET, catalogue E-Phy »). Lu ensuite : c’est un état de l’appareil (« pas chargé sur cet appareil… il se charge à la connexion »), pas un manque du domaine. Il ne compte que s’il y a des traitements dans l’année ; il s’efface une fois en ligne. À revoir si la tuile se met à compter « 1 » sur des téléphones hors réseau.
- **N’en sont pas** : la vigilance cuivre (sous le plafond), un délai de rentrée en cours (« À savoir » le dit), la protection restante (« à nu depuis 53 j » en octobre est une lecture de saison). **Une tuile éteinte** dans « Choisir les indicateurs » ne compte pas : la tuile ne dit que ce que l’onglet montre.
- ★ **Le texte de la tuile tient en trois mots** : « Registre 2026 : SIRET manquant · et 1 autre » faisait rougir le cliquet des mots (Aujourd’hui, 318 → 321, jeu de 2) — le premier rouge utile du cliquet. Écrit « Registre : SIRET manquant · +1 » (319).
- **La projection part d’aujourd’hui, pas de la dernière saisie** : sinon « budget épuisé le » pouvait tomber dans le passé après deux semaines sans saisie. Une fin prévue déjà passée, ou absente : la fin de la période, et l’écran n’écrit pas « fin prévue ». Une fin prévue APRÈS la période est gardée : le retard se voit, l’axe s’allonge.
- **Gardé tel quel, à revoir au lot Synthèse** : le trait horizontal « Fin projetée à la cadence » (le même chiffre que le bout du pointillé quand la cadence s’applique — règle 6, un chiffre une fois) ; « 638 € par jour » à côté d’un coût à la fin qu’il n’explique pas.
- **Vu au passage** : le rythme vaut 636,7 € et non 650 sur la démo — le 25/10/2026 dure 25 h à Paris, la fenêtre se compte en millisecondes ÷ 86 400 000 (2,04 jours). Deux pour cent, pas corrigé. Sur le graphique au téléphone, « objectif » est coupé à droite et le trait de l’objectif passe sur « Budget 15,8 k€ » : d’avant ce lot.
- ★★★ **« Campagne » a une couche plus ancienne que l’écran d’Archives, pas touchée** : le réglage « Le cadre de votre campagne » (Pilotage › roue crantée : « Une campagne est un cycle de production », « Campagne en cours : 1ᵉʳ août 2026 → 31 juillet 2027 », « Caler la campagne sur ma vendange »), la fiche `pil.camp.mois`, la fiche `doc.fenetres` (« La campagne est votre année vigne »), `MV_AIDE` (« le cadre de votre campagne »), le guide (« Une campagne est un cycle de production »), le « bilan de campagne » de la Cave et les fenêtres des documents datés. Là, campagne = année vigne, par décision (AXE-1) ; depuis PIL-RANGE-2a (§443), la barre dit l’inverse. Ce lot aligne l’écran d’Archives sur la barre et sur son propre bilan ; le réglage et les documents demandent une décision de Nico et un lot à eux.
- **Pas touché dans Archives** : le bouton « Comparer deux saisons » et sa fenêtre « Historique multi-saisons » (le lot Archives, §28).
- **La démo du site** : deux captures refaites (`pilotage-auj-pc`, `pilotage-auj-apres-pc` ; `r-ger-pilotage` rejouée, inchangée — la tuile n’y est pas à l’écran). La tuile y affiche « 2 points à régler · Registre : SIRET manquant · +1 » : le domaine fictif n’a pas de SIRET, et le catalogue ne se charge pas hors réseau. Vrai, mais à l’image du site : à décider (donner un SIRET au domaine fictif).
- `mv-harnais-ref1` bouchonnait `_pilDiag` avec une ligne `'cfm'` qui n’existe pas dans l’appli — le contrôle donnait raison au défaut. Il bouchonne maintenant la liste.

### 581e. Mesuré
- **Relu sur le build** (démo, téléphone 390 px et PC 1366 px, horloge au 27/10/2026) : Aujourd’hui — « Coût à la fin 15 317 € · Fin prévue 25 novembre », tuile « 2 points à régler · Registre : SIRET manquant · +1 » ; Conformité — « SIRET manquant », « catalogue E-Phy absent », cuivre « ↑ 2 » (vigilance, pas compté) ; Économie › Synthèse — « Rythme des 3 derniers jours : 638 € par jour · coût à la fin 15 317 €, fin prévue 25 nov. », le pointillé s’arrête fin novembre sous le trait du budget, verdict « Le budget tient » sans date ; Archives — « 2026–2027 en cours · 1 campagne · pas d’instantané », « 2 années vigne · 2 campagnes ».
- `mv-harnais-coher1` : **49 assertions**, **34/34** contre-épreuves (vert aussi en `TZ=UTC`). `mv-harnais-ref1` : 18, 11 défauts.
- `npm run test:mots` : vert, 4 baisses regravées (Synthèse 445 → 440 mots au téléphone, 448 → 443 sur ordinateur ; Archives, mots avant le premier chiffre 48 → 47 et 54 → 53) ; Aujourd’hui +1 mot, dans le jeu. Totaux : 8 816 et 10 294 mots. `npm run test:ux` : vert (18). `npm run test:gabarit` : vert (15).
- Tutos : l’aiguillage n’en désigne aucun (25 tutos).
- La chaîne : 766 commandes au premier passage (504 s), trois rouges — `mv-harnais-ift1` et sa contre-épreuve (il joue `_pilIftTuile`, qui lit maintenant `_cfmIftPoint` : la fonction entre dans son extrait), une contre-épreuve de `mv-harnais-robustesse-pilotage` (son ancre visait « périodes » dans le compteur d’Archives) ; au second, **766 commandes, aucun rouge** (507 s).
- **Pas vu à l’écran** (le harnais seul les joue) : un coût à la fin au-dessus du budget (« budget épuisé le »), une fin prévue après la période, une période finie. **Pas regardé** : le thème sombre, un PC à 125 %, un vrai domaine.

### 581f. Fiches et guide
- `MV_INFO` : `pil.eco.engage` gagne un paragraphe (où va le pointillé, quand s’écrit « budget épuisé le ») ; la fiche « i » de la tuile Conformité (`cockpit-vue.js`). `MV_AIDE` : Archives (« empile les années vigne… chacune avec ses campagnes »).
- Guide 11 : « Le verdict, en tête d’Économie » (le graphique), « Aujourd’hui » (ce que compte la tuile), « Archives des campagnes » (une ligne = une année vigne). `public/guide.html` régénéré.
- `WHATS_NEW` 11.09 : trois annonces, pour l’admin.

### 581g. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : « campagne » dans le réglage et les documents ; le SIRET du domaine fictif ; puis Économie › Synthèse.

## 582. ★★★ MOTS-1 — ÉCONOMIE › SYNTHÈSE SE LIT D’UN COUP D’ŒIL : UNE PHRASE, CE QUI DEMANDE UN GESTE, QUATRE CHIFFRES, TROIS TUILES REPLIÉES (16/11 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `index.html` (versions) · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-mots1.mjs` (neuf) · neuf harnais suivis · `scripts/mv-mots-baseline.json` · deux captures de la démo du site)

### 582a. D’où ça vient
- Le premier écran du plan « ★ MOINS DE TEXTE » (§28), le plus chargé du relevé (§580b) : 445 mots au téléphone, cinq phrases de 15 mots et plus, 85 mots avant le premier grand chiffre, 4,3 hauteurs d’écran. **Nico, 16/11** : « suite », sur l’objectif reformulé — ramener la Synthèse à une soixantaine de mots sur le gabarit de la maquette v3, la méthode derrière les « i », rien de supprimé.
- La maquette : `docs/maquettes/maquette-moins-de-texte-v3.html`, écran « Économie › Synthèse ». Les règles et le lexique : §580c.

### 582b. Ce qui a été fait
- **L’écran, de haut en bas** : la sous-barre · une carte — la campagne et ses dates (« Après-vendange 2026-2027 · 24 oct. → 28 févr. »), puis LA phrase (« Le budget tient : 12 % engagé pour 16 % du travail fait. ») et ses boutons quand un geste est utile · la bande rouge d’un poste compté pour zéro, avec le bouton qui y mène · quatre chiffres — Budget, Engagé, Reste, Écart de cadence —, chacun son repère court, et une barre (le plein = l’engagé, le trait = le travail fait) · trois tuiles REPLIÉES, leur chiffre sur le titre : « Coût à la fin · 15 317 € · 25 nov. », « L’exercice · 58 k€ sur 159 k€ », « Prix de revient · 1,56 € la bouteille » · « 1 remarque sur ces chiffres ».
- **`_pecVerdictM(E,TL)`** — le verdict en un titre et un repère, pour-cent entiers (`_pecPct0`). Les sept états d’avant, plus un : **« Le budget serait dépassé »** quand `E.projFin` passe le budget sans cadence mesurée — l’écran disait « Le budget tient » pendant qu’Aujourd’hui annonçait le dépassement (le même chiffre, COHER-1, §581). `_pecVerdict(E,TL,Z)` rend la carte ; `_pecPerLigne` la ligne de la campagne.
- **La fiabilité, en trois pièces, UN rendu pour les deux écrans** (`_pecFiabOk`, `_pecFiabBande`, `_pecFiabRemq` ; `_pecFiabCard` les assemble pour Le détail de l’exercice) : la carte « N postes comptés pour zéro — … des 3 choses à compléter qui touchent ce budget » devient une bande (« 1 poste à zéro · Traitements sans dose chiffrée · 1 des 3 à compléter » — le « N des M » de `mv-harnais-pil-coherence` ⑬ reste) ; « Le chiffrage est complet · taux horaires, prix du GNR… » devient une coche « complet » (règle 3) ; « N remarques sur la lecture de ces chiffres » devient « N remarques sur ces chiffres ». `_pecAlertes` n’existe plus.
- **Les tuiles** sont des `_pilTile` — le dépliant de tout le Pilotage, un seul ouvert à la fois —, repliées par défaut (`ecofin`, `ecorev`, avec `anbudget`, dans `_PIL_DEFAULT.collapsed`). `_pecTuileFin` : le graphique de l’engagé, sa légende, le rythme en mesure ; `_pecTuileRevient` ; `_pilPanelAnBudget(avis)` — la tuile de l’année, qui suit la barre « Vous regardez » (« L’exercice » ou « L’année vigne », l’année dessous), où s’ouvrent aussi les avis du cadre.
- **Parti de l’écran** : le sous-titre « Économie — budget, rythme de dépense et prix de revient » (`_PIL_LABELS.eco` = « Économie », sur les six sous-vues) ; l’avis de 24 mots « Cet écran chiffre… » (la Synthèse nomme sa campagne — les cinq autres sous-vues le gardent jusqu’à leur lot) ; la ligne « … · 7,02 ha · taux moyen 13,19 €/h » de la sous-barre (l’hectare est sous le budget, le taux dans « Prix de revient ») ; la bande « L’exercice en cours » (`_pecBandeExo`) et `_pilAnEcoHtml` ; la note de 93 mots sous le graphique ; la carte « Ce qu’il faut regarder ».
- **Passé derrière un « i »** (règle 4) : la note de méthode → la fiche neuve `pil.eco.fin`, que `_pecTuileFin` complète au rendu des heures du moment (`_mvInfoSet`, le texte fixe d’abord) ; « salaires chargés… tout le domaine » et « deux questions, jamais deux totaux » → `pil.an.budget` ; « la bouteille sur le cycle, le reste sur la campagne » → `pil.eco.revient`. Le biais cave/atelier/bureau était déjà dans `pil.cadence` : il n’est plus réécrit.
- **Le lexique** (§580c) : « Budget de la période » → Budget ; « Engagé à ce jour » → Engagé ; « Reste à engager » → Reste ; « La période démarre » → « La campagne démarre » ; dans la tuile de l’année, « Dépensé » → Sorti, « Total attendu » → Total prévu.

### 582c. Arbitrages, et ce qui a été trouvé en route
- ★★ **La tuile du graphique s’appelle « Coût à la fin », pas « Le rythme »** (la maquette disait « Le rythme · 638 € par jour »). Depuis COHER-1 le pointillé mène au coût à la fin : c’est ce chiffre que le graphique montre, le même mot et le même montant qu’Aujourd’hui. Le rythme est dedans, comme une mesure.
- ★★ **Une seule tuile pour l’exercice, pas deux blocs** : l’écran portait « Le budget de l’année · 58 k€ dépensés sur 159 k€ attendus » (PIL-RANGE-2b, §444) ET la bande « L’exercice en cours · Sorti 58 293 € · à la clôture 158,8 k€ » — les deux mêmes chiffres, deux fois. La tuile de l’année reste (elle suit la barre, elle a le reste prévu, le mois par mois, les postes) ; la bande part. **Perdu sur la Synthèse** : « à l’hectare 8 304 € » et l’avis « N achats sans prix : ce total est un plancher » — tous deux dans Le détail de l’exercice, à un toucher (« Ouvrir le détail »).
- ★ **La phrase garde la taille du verdict de tout le Pilotage** (`styles.css`, l’échelle unique : `.pec-verdict .t`). La maquette la dessinait plus fine ; l’échelle du Pilotage passe avant.
- ★ **Les étiquettes « 12 % » et « 16 % » sont deux fois à l’écran** dans deux états sur huit (la phrase, puis « 12 % du budget » et « travail fait 16 % ») : la phrase résume, les repères restent quand elle parle d’autre chose. La règle 6 cède ici à la règle 1.
- ★★★ **`mv-harnais-info` gardait un principe que la première écriture violait** : « un seul rendu pour les deux écrans » de la carte de fiabilité (la Synthèse et l’exercice). La bande écrite pour la seule Synthèse en faisait un second ; elle est devenue le rendu partagé. Le détail de l’exercice change donc d’allure dans ce lot (une bande ou une coche, au lieu d’une carte) — annoncé.
- ★★ **`harnais-bandeau-essai` rougissait à tort sur le SW 12.01** : il cherchait le numéro précédent sous la forme « v12.0 », qui est aussi le début de « v12.01 ». Il l’écrit sur deux chiffres. Le défaut dormait depuis toujours : il ne mord qu’aux versions en « .01 ».
- **Suivis** : `mv-harnais-annee`, `-pilrange2a`, `-pilrange2b` (l’année est une tuile de la Synthèse ; `_pilAnEcoHtml` n’existe plus), `-revient` (G3), `-temps-vigne` (J6), `-coher1` (la ligne sous le graphique est devenue le titre de la tuile), `harnais-cadence-escalier` et `mv-harnais-coeq5` (qui le lit), `mv-harnais-pil-coherence` ⑬, `mv-harnais-icones-contre` (son ancre), `banc/garde-projection` (la légende « Fin à la cadence mesurée », rétablie : le trait existe toujours), `mv-harnais-gabarit1` et `-icones` (classes mortes `.prv-go`, `.pec-fia*` retirées ; une icône de 14 px remise à 16).
- **Pas fait, annoncé** : la ligne d’écran dit encore « Exercice 2026–2027 » au-dessus d’un écran de campagne (la maquette y écrit « La campagne ») — c’est le lot de la barre « Vous regardez », quand Économie et Archives seront seuls à la porter (§28, « ★ RANGEMENT ADMIN ») ; le point de couleur fixe et l’icône des tuiles (§580c) partent avec les autres onglets ; le trait « Fin à la cadence mesurée » du graphique reste.

### 582d. Mesuré
- **`npm run test:mots`** (regravé) — Synthèse au téléphone : **440 → 63 mots**, phrases de 15 mots et plus **5 → 0**, mots avant le premier grand chiffre **85 → 14**, mots hors lexique **14 → 0** ; les cinq autres sous-vues perdent 8 mots (le sous-titre). Le détail de l’exercice : 649 → 623 (sa fiabilité en bande). Totaux : 8 381 mots au téléphone, 9 856 sur ordinateur ; 70 et 81 phrases longues ; hors lexique au Pilotage 81.
- **Relu sur le build** (démo, téléphone 390 px et PC 1366 px) : l’écran replié, chaque tuile ouverte (le graphique se trace, le mois par mois aussi), la fiche « Le coût à la fin, et son graphique » ouverte depuis son « i » sans replier la tuile, Le détail de l’exercice. Aucune erreur de page.
- `mv-harnais-mots1` (neuf) : **57 assertions**, **40/40** contre-épreuves — il JOUE `_pecVerdictM` sur ses huit états, `_pecVerdict`, la bande, les remarques, `_pecTuileFin`. `npm run test:ux` : vert (18). `npm run test:gabarit` : vert (15).
- Tutos : aucun concerné ; le panneau côte à côte rejoué vert aux trois largeurs (`styles.css` a changé). Démo du site : `r-ger-cout` et `cout-pc` refaites (le sous-titre d’Économie), les trois d’Aujourd’hui rejouées, inchangées.
- La chaîne, trois passages : dix-huit rouges au premier (les harnais qui lisaient l’ancien écran, §582c), trois au deuxième (`mv-harnais-coeq5`, `-pil-coherence` ⑬, `-icones-contre`), puis **768 commandes, aucun rouge** (505 s).
- **Pas vu à l’écran** (le harnais seul les joue) : les sept autres états du verdict, la coche « complet », « budget épuisé le » sur le titre, la suite de la fiche `pil.eco.fin` (les heures du moment, derrière « Lire la suite »), l’année vigne dans la barre. **Pas regardé** : le thème sombre, un PC à 125 %, un vrai domaine.

### 582e. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : les cinq autres sous-vues d’Économie, dans l’ordre.

## 583. ★★★ MOTS-2 — LES CINQ AUTRES VUES D’ÉCONOMIE SE LISENT COMME LA SYNTHÈSE : UNE LIGNE, UNE PHRASE, UNE BANDE S’IL Y A UN GESTE ; LES TABLEAUX NE BOUGENT PAS (16/11 — `src/pilotage.js` · `src/utils.js` · `src/whats-new.js` · `index.html` (versions) · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-mots2.mjs` (neuf) · six harnais suivis · `scripts/mv-mots-baseline.json` · deux captures de la démo du site)

### 583a. D’où ça vient
- La suite du plan « ★ MOINS DE TEXTE » (§28). Après MOTS-1 (§582), Postes & travaux, Parcelles, Revient, Achats et Le détail de l’exercice gardaient l’avis gris « Cet écran chiffre la campagne…, pas l’exercice comptable affiché en haut » (24 mots), la ligne « … · 7,02 ha · taux moyen 13,19 €/h », un sous-titre sous chaque titre de carte et des notes de méthode à demeure : 221, 203, 178, 271 et 623 mots au téléphone.
- **Nico, 16/11** : « redis-moi en langage simple, je ne comprends pas » sur la reformulation d’un lot par sous-vue — puis, la chose redite en mots simples (le pavé gris du haut disparaît, une phrase en tête, les tableaux ne bougent pas) : **« les 5 d’un coup »**. Un seul lot, un seul zip, un seul déploiement.
- La maquette : `docs/maquettes/maquette-moins-de-texte-v3.html`, les cinq écrans d’Économie. Les règles et le lexique : §580c.

### 583b. Ce qui a été fait
- **Un en-tête commun, `_pecEnteteVue(per, phrase, cle)`** : une carte — la ligne de ce que l’écran chiffre, puis UNE phrase à la taille du verdict du Pilotage ; la pastille « i » se pose à droite de la carte (`.pec-phi`), pas au bout de la phrase. **Une bande orange, `_pecBandeAvis(txt, bouton)`** (`.pec-al.or`, `role="status"`) : seulement s’il y a un geste à faire. `_pecBandeAttente(E)` : « 74 h payées sans validation · 959 € » — des heures payées que personne n’a validées au journal ; rien sous un euro, ni planning fermé.
- **Plus rien au-dessus des sous-vues** : `_pilAvertEco` n’existe plus (`_pilTabEco` rend la sous-barre, puis la vue) ; `_pecSubNav` n’écrit plus la ligne « … · ha · taux moyen ». L’avis de Conformité (`_pilAvertCfm`) n’est pas touché.
- **Postes & travaux** : « Après-vendange 2026-2027 · 24 oct. → 28 févr. » · « **1 940 €** engagés sur **15 784 €**. » · la bande des heures en attente. Les deux tableaux, le graphique en anneau et la porte « Le détail de l’exercice » sont inchangés. Partis : le sous-titre de la carte, la note « les achats, les réparations et les fûts n’y sont pas… », le sous-titre du tableau du temps ; la note du temps ne reste que si elle a quelque chose à dire (des euros versés hors de la liste de la campagne, ou « Planning pas encore ouvert : le réalisé est au barème. »).
- **Parcelles** : la campagne · « **982 €** réalisés sur **8 parcelles**. » · la même bande. Le tableau garde ses treize colonnes ; ses boutons s’appellent « Tableau (CSV) » et « Copier ».
- **Revient** : « **Millésime 2026** · 24 oct. 2025 → 23 oct. 2026 » (dates courtes, `_pecDfrIso`) · « **1,56 €** la bouteille, à la vigne. » · trois chiffres — Rendement, Bouteilles, **Coût du cycle** (« 46,0 k€ · ÷ 29 418 cols ») : le prix de la bouteille n’est plus écrit deux fois. Ce qui borne le chiffre s’ouvre d’un toucher (« 1 remarque sur ces chiffres », le rendu de la Synthèse, `_pecFiabRemq(notes,'pil.eco.revremq')`). Sans rendement : « Pas encore de coût à la bouteille : il manque un rendement. »
- **Achats** : « **Au moins 210 €** d’achats. » (ou « 210 € d’achats chiffrés. » quand tout a un prix) · la bande « **2 achats sans prix** · le total est un plancher », avec le bouton **Chiffrer ›** qui pose le filtre « À chiffrer ». Les trois chiffres et la liste restent. Partis : le titre et le sous-titre de la carte, trois paragraphes de conception, la carte « Ce que cet écran ne fait pas ».
- **Le détail de l’exercice** : `_pexBarreEx(E)` rend l’en-tête — « **Exercice 2026–2027** · 1 août → 31 juil. » (ou « Année vigne », selon la barre « Vous regardez ») · « **58 293 €** sortis : **37 %** de l’exercice. » (clos : « X € sortis. »). Les quatre chiffres disent **Sorti · Prévu · À la clôture · Contre 2025–2026** (« Engagé à ce jour », « Prévu jusqu’à la clôture » : le lexique, §580c — *sorti* pour les euros de l’exercice) ; la colonne du tableau des postes aussi. Partis : la phrase « L’année se choisit dans la barre… », le cadre « 37 % de l’exercice est sorti… », le sous-titre « Trois postes, et rien d’autre », la seconde ligne de « Ce total n’est pas un compte de résultat », trois notes des consommables, la carte **« Ce qui n’entre pas dans ce total »** (`_pexHorsPerim`, trois pavés), le sous-titre et deux notes des salaires.
- **Passé derrière un « i »** (règle 4, rien de supprimé) : deux fiches neuves — `pil.eco.achats` (« Achats : le seul endroit où l’on met les prix ») et `pil.eco.revremq` (remplie au rendu) — et neuf fiches allongées : `pil.eco.postes`, `pil.eco.travaux`, `pil.eco.parcelles`, `pil.eco.revrdt`, `pil.eco.revconv`, `pil.exo.postes`, `pil.exo.garde`, `pil.exo.ateliers`, `pil.exo.salaires`. Un sous-titre réduit à sa pastille porte `.pec-cs.pec-ci` et reste sur la ligne du titre.

### 583c. Arbitrages, et ce qui a été trouvé en route
- ★★★ **Les tableaux restent des tableaux.** La maquette dessinait Postes & travaux et Parcelles en listes à déplier ; ce que j’ai dit à Nico en mots simples, et qu’il a validé, c’est « les tableaux ne bougent pas ». Le lot allège ce qui est AU-DESSUS et AUTOUR ; passer un tableau de treize colonnes en liste est une autre décision (tri, export, lecture sur ordinateur), à poser à part.
- ★★ **Parcelles dit « réalisés », pas « engagés ».** La maquette écrivait « 982 € engagés sur 8 parcelles ». Deux écrans plus haut, Postes & travaux écrit « 1 940 € engagés » : le même mot pour deux totaux (982 € ne compte que les heures validées, versées aux parcelles ; 1 940 € compte toutes les heures payées). La phrase reprend le mot de la colonne qu’elle totalise, « Réalisé ». La différence entre les deux est justement la bande orange : 959 € d’heures payées sans validation.
- ★★ **« Au moins 210 € », pas « ≥ 210 € ».** Le signe « ≥ » (U+2265) n’est pas dans le jeu de caractères de la police de l’appli : `mv-harnais-subset` rougit, et le signe s’affiche dans une police de secours. Écrit en toutes lettres — plus clair aussi pour qui lit. **Le lexique (§580c) est corrigé sur ce point** (§28).
- ★★ **La carte « Ce qui n’entre pas dans ce total » disait une chose fausse** : « le réglage est en bas de cet écran ». Depuis PIL-RANGE-4b (§447) il est dans la roue crantée du Pilotage. Son texte est passé dans `pil.exo.garde`, corrigé. `mv-harnais-ateliers` gardait « le hors-périmètre est une CARTE, pas une note » : il garde maintenant « il se lit dans la fiche de la garde comptable ».
- ★ **Trois mots retirés pour tenir « 15 mots avant le premier grand chiffre »** : « · tout est récolté » sur la ligne du millésime (la pastille « constaté » le dit déjà ; « N % récolté » reste tant que tout n’est pas rentré) et « · en cours » sur la ligne de l’exercice (la part de l’exercice, dans la phrase, le dit).
- ★ **Le cliquet a compté une hausse qui n’en est pas une** : Postes & travaux et Parcelles n’avaient AUCUN grand chiffre (« avant : aucun ») ; leur phrase en pose un, à 14 mots du début. Regravé avec `--accepte` et sa raison.
- ★ **Le chiffre de la phrase est aussi dans le tableau ou dans les chiffres du dessous** (1 940 € et 15 784 € au total du tableau ; 210 € sous « Chiffré » ; 58 293 € sous « Sorti ») : comme sur la maquette. La règle 6 cède ici à la règle 1 — même arbitrage qu’en MOTS-1.
- **Suivis** : `mv-harnais-mots1` (plus d’avis de périmètre ni de ligne de contexte sur AUCUNE sous-vue ; sa fiche `pil.eco.fin` se découpe seule), `-pilrange4b` (il JOUE `_pexBarreEx` avec ses aides ; plus de renvoi à la barre), `-pil-coherence` ⑫ (Sorti · Prévu · À la clôture), `-temps-vigne` J10 (les heures en attente, en tête), `-info` (la garde comptable : une ligne à l’écran, le reste dans la fiche), `-ateliers`. Style mort retiré : `.pex-bar`.
- **Pas fait, annoncé** : la bande des quatre chiffres du Détail de l’exercice n’est pas dans une carte blanche comme celles des autres vues (c’était déjà le cas) ; « Réalisé » reste le mot des tableaux de Postes & travaux et de Parcelles (une notion à part de l’engagé — à trancher avec le lexique) ; la ligne d’écran dit toujours « Exercice 2026–2027 » au-dessus des vues de campagne (§582c).

### 583d. Mesuré
- **`npm run test:mots`** (regravé), au téléphone — Postes & travaux **221 → 120 mots**, Parcelles **203 → 106**, Revient **178 → 104**, Achats **271 → 86**, Le détail de l’exercice **623 → 217** ; phrases de 15 mots et plus : 3, 2, 1, 5 et 10 → **0 partout** ; mots avant le premier grand chiffre : aucun chiffre, aucun chiffre, 15, 59 et 30 → **14, 14, 14, 11 et 14**. Totaux : 7 523 mots au téléphone (8 381 avant le lot), 8 998 sur ordinateur ; 49 et 60 phrases longues ; hors lexique au Pilotage 70.
- **Relu sur le build** (démo, téléphone 390 px et PC 1366 px) : les cinq écrans, du haut jusqu’en bas pour Le détail de l’exercice et Postes & travaux. Aucune erreur de page.
- `mv-harnais-mots2` (neuf) : **45 assertions**, **38/38** contre-épreuves — il JOUE `_pecEnteteVue`, `_pecBandeAvis`, `_pecBandeAttente`, `_pecDfrIso` et `_pexBarreEx` (en cours, clos, année vigne). `npm run test:ux` : vert (18). `npm run test:gabarit` : vert (15).
- Tutos : aucun concerné ; panneau côte à côte : rien qui le touche. Démo du site : `r-ger-cout` et `cout-pc` refaites, les trois d’Aujourd’hui rejouées, inchangées.
- La chaîne : dix rouges au premier passage (les six harnais suivis, §583c, et `mv-harnais-subset` pour « ≥ »), puis **770 commandes, aucun rouge** (522 s).
- **Pas vu à l’écran** (le harnais seul les joue) : un exercice clos, l’année vigne dans la barre, Achats quand tout est chiffré, Revient sans rendement ou à moitié récolté, un écran sans heures en attente. **Pas regardé** : le thème sombre, un PC à 125 %, un vrai domaine, les fiches « i » ouvertes une à une (leur texte est relu, pas leur affichage).

### 583e. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : Archives, puis les quatre onglets qui déménagent.

## 584. ★★★ MOTS-3 — POSTES & TRAVAUX ET PARCELLES EN LISTES, COMME LA MAQUETTE : UNE LIGNE, UNE JAUGE, UNE PASTILLE ; LE DÉTAIL D’UN TOUCHER (16/11 — `src/pilotage.js` · `src/utils.js` · `src/whats-new.js` · `index.html` (versions) · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-mots3.mjs` (neuf) · cinq harnais suivis · `scripts/mv-mots-baseline.json` · deux captures de la démo du site)

### 584a. D’où ça vient
- MOTS-2 (§583) avait allégé le haut des cinq vues d’Économie et gardé leurs tableaux — c’est ce qui avait été dit à Nico en mots simples. La note de livraison signalait l’écart à la maquette : sur `maquette-moins-de-texte-v3.html`, Postes & travaux et Parcelles sont des LISTES.
- **Nico, 16/11** : « langage simple ou remets-moi les deux maquettes en face à face que je compare ». Deux images envoyées (la maquette à gauche, l’appli livrée à droite, au téléphone) et la différence dite en quatre lignes ; deux choix posés. Réponse : **« comme la maquette »**.
- ★ **Ce qui a marché** : montrer les deux écrans côte à côte. Une ligne de note (« les tableaux restent des tableaux ») ne disait rien ; l’image a tranché en une minute. **Un écart à une maquette validée se montre en image, pas en phrase.**

### 584b. Ce qui a été fait
- **`_pecLigne(nom, val, pct, col, rep, pst, det)`** — la ligne de liste : un nom et un montant ; dessous, une jauge fine (bornée de 0 à 100), son repère (« sur 15 447 € »), une pastille s’il y a quelque chose à dire. C’est un `<details>` : la ligne s’ouvre d’un toucher sur le reste des colonnes, sans rien écouter ni mémoriser. **`_pecEcPst(ec)`** — l’écart en pastille : fond orange quand le réalisé dépasse le barème du travail fait, gris quand il est en dessous, rien sous un euro.
- **Postes & travaux** : deux cartes côte à côte sur ordinateur (`.pec-g2`, dès 881 px), l’une sous l’autre au téléphone. **Par poste** — l’engagé du poste, sa jauge sur le budget du poste, « projeté » ; la ligne ouverte : la base de calcul, le coût à l’hectare, la part du budget. Le surcoût de retard garde sa ligne « hors total ». **Par travail · main-d’œuvre** — le réalisé payé, la jauge du fait, « fait 50 % · budget 4 827 € », l’écart en pastille ; la ligne ouverte : les heures du barème, les heures passées, le reste, l’hectare, la part. Dessous, **`_pecTuileTemps()`** : « Temps réel contre barème » devient une tuile REPLIÉE (`ecotemps`), son chiffre sur le titre — un seul travail mesuré : « 17,1 h/ha · barème 50 » et son nom ; plusieurs : l’écart de toutes les heures validées au barème des mêmes surfaces (« −10 % contre barème »). Les deux portes en bas (le détail de l’exercice, parcelle par parcelle — l’émoji du second bouton est devenu l’icône `raisin`).
- **Parcelles** : à gauche la liste **Parcelle par parcelle · réalisé**, dans l’ordre du tri mémorisé (`_pecSortRows`) — le nom et sa surface, le réalisé, sa jauge sur le budget de la parcelle, l’écart ; la ligne ouverte : le fait, la main-d’œuvre, le tracteur, le GNR, le phyto, les prestations, le reste, l’hectare, les plants, le retard, d’où vient le taux. À droite, **quatre chiffres** deux par deux (`.pec-k2`), chacun son repère : Budget (la surface), Reste (« de main-d’œuvre »), Écart (« contre le barème »), À l’hectare (« de budget ») ; puis la tuile repliée **Écart au coût moyen à l’hectare** (`ecoecart`, le graphique inchangé). Dessous, sur toute la largeur, la tuile repliée **Le tableau complet** (`ecotab`) : les treize colonnes, à trier d’un toucher sur un en-tête — le tri range aussi la liste. Les boutons **Tableau (CSV)** et **Copier** sont hors de la tuile : ils exportent sans l’ouvrir.
- **Partis** : les deux tableaux de Postes & travaux, l’anneau des postes (`_pecDonutSvg`) et le graphique en barres des travaux (`_pecTaskSvg`, son bouton « Agrandir ») — la jauge de chaque ligne les remplace ; `_pecCarteTemps` (devenue la tuile) ; le style `.pec-grid2`.
- **La bande des heures payées sans validation mène au Journal** (bouton « Journal › », `data-diag="journal"`, cible neuve de `_PIL_DIAG_CIBLES`) — elle était sur la maquette, pas dans MOTS-2. Son montant ne se coupe plus en fin de ligne.
- **Les trois tuiles arrivent repliées** (`_PIL_DEFAULT.collapsed`) et ont leur icône (`_PIL_TILE_ICO`). Chez un client dont l’état est déjà mémorisé, `_pilNormalize` donne le défaut à une clé neuve : pas de numéro d’état à monter.
- **Les fiches** `pil.eco.postes`, `pil.eco.travaux`, `pil.eco.parcelles` (retitrée « Parcelle par parcelle ») disent ce qu’une ligne montre et ce qu’elle ouvre ; la phrase sur « le trait vertical du graphique » est partie avec lui.

### 584c. Arbitrages, et ce qui a été trouvé en route
- ★★★ **Le tableau complet des parcelles reste, replié** — la maquette ne l’a pas. Promis à Nico en posant le choix (« le tableau complet reste accessible sur ordinateur et par l’export ») : treize colonnes triables ne tiennent pas dans une ligne ouverte, et c’est le tri qu’on vient y chercher. Pour Postes & travaux, pas de tableau gardé : tout ce que portaient ses colonnes est dans la ligne ouverte.
- ★★★ **« Reste » veut dire deux choses, et la maquette le posait en gros chiffre.** Sur la Synthèse, Reste = budget moins engagé (13 843 € sur la démo). Dans le tableau des parcelles — et sur la maquette, en grand —, Reste = la main-d’œuvre qui reste à faire, au barème (13 092 €). Le désaccord existait, enfoui dans un pied de tableau ; en chiffre de carte il devenait visible. Le chiffre garde le total du tableau et porte son repère (« de main-d’œuvre ») ; la fiche le dit. **À trancher** : un seul « Reste » dans Économie (§28).
- ★★ **Le texte des pastilles d’écart est sombre, pas orange.** `mv-harnais-contraste` a compté deux écarts de plus : l’orange sur orange pâle et le gris doux sur gris clair passent sous 4,5. Fond orange pâle et texte normal ; fond gris clair et texte moyen. Les deux couples fautifs existent encore ailleurs dans le Pilotage (pastilles « hors total », « taux moyen ») : ils sont au cliquet, pas corrigés ici.
- ★★ **Le chiffre de la tuile du temps** : la maquette écrivait « 17,1 h/ha · barème 50 », vrai pour UN travail. Un h/ha moyen de la taille et du tirage ne veut rien dire : à plusieurs travaux mesurés, la tuile écrit l’écart global des heures au barème.
- ★ **`mv-whatsnew-check` refuse un « & » dans un titre d’annonce** (le titre est échappé) : « Postes & travaux » est dans le texte, pas dans le titre. ★ **`mv-harnais-jetons`** refuse une graisse de plus hors de 500 / 600 / 700 : la surface à côté du nom est en `normal`.
- ★ **Trouvé en reposant le choix** : `git rev-parse --short HEAD origin/main` (deux révisions avec `--short`) répond « Needed a single revision » — interroger une révision à la fois. Nico avait poussé « mots2 » pendant le travail : `git reset origin/main` (sans toucher aux fichiers) a aligné la base avant de continuer.
- **Suivis** : `mv-harnais-temps-vigne` (G1, G2, G4, J8, J11 : la tuile, la liste, plus de graphe), `mv-harnais-gabarit2` (sept graphiques au lieu de huit ; la jauge fine des lignes), `mv-harnais-kit3` (un seul cercle, plus d’anneau en Économie), `mv-harnais-mots1` (la ligne des tuiles repliées), `mv-harnais-mots2` (la bande et son bouton, plus de tableaux dans Postes & travaux, le guide).
- **Pas fait, annoncé** : une ligne ouverte se referme quand le Pilotage se repeint (une validation qui arrive en direct) — c’est un `<details>`, sans mémoire ; au téléphone le tableau complet se fait glisser de côté, comme avant ; « réalisé » n’est toujours pas au lexique (§583c).

### 584d. Mesuré
- **`npm run test:mots`** (regravé) — Postes & travaux : **120 → 63 mots** (221 avant MOTS-2), au téléphone comme sur ordinateur ; Parcelles : **106 → 91** (203 avant MOTS-2). Aucune phrase de 15 mots ; 14 mots avant le premier grand chiffre ; hors lexique 1 → 0 et 2 → 2. Totaux : 7 446 mots au téléphone, 8 920 sur ordinateur. **En hauteur, au téléphone** : Postes & travaux tenait sur 4 102 px de page (à l’échelle 2), il tient sur environ 2 900 ; la maquette en comptait 2 066.
- **Relu sur le build** (démo, téléphone 390 px et PC 1366 px) : les deux écrans fermés ; une ligne ouverte dans chaque liste ; les trois tuiles ouvertes une à une (le tableau du temps, le graphique des écarts qui se trace, le tableau complet et ses treize colonnes). Aucune erreur de page. `goTo('journal')` ouvre bien le Journal (joué dans le navigateur).
- `mv-harnais-mots3` (neuf) : **43 assertions**, **41/41** contre-épreuves — il JOUE `_pecLigne`, `_pecEcPst` et `_pecTuileTemps` (un travail mesuré, plusieurs, aucun, pas de période, une lecture qui échoue). `npm run test:ux` : vert (18). `npm run test:gabarit` : vert (15).
- Tutos : aucun concerné ; panneau côte à côte : rien qui le touche. Démo du site : `r-ger-cout` et `cout-pc` refaites — elles montrent Parcelles, donc la liste —, les trois d’Aujourd’hui rejouées, inchangées.
- La chaîne : dix rouges au premier passage (les cinq harnais suivis, le contraste, les graisses, le titre de l’annonce), puis **772 commandes, aucun rouge** (522 s).
- **Pas vu à l’écran** (le harnais seul les joue) : le surcoût de retard, une parcelle arrachée, des plants, plusieurs travaux mesurés sur la tuile du temps, un écran sans heures en attente. **Pas fait** : toucher le bouton « Journal › » dans le navigateur (la cible est jouée, pas le clic) ; un tri depuis le tableau complet, relu sur la liste. **Pas regardé** : le thème sombre, un PC à 125 %, un vrai domaine avec quarante parcelles (la liste sera longue : le tableau l’était aussi).

### 584e. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : Archives, puis les quatre onglets qui déménagent. À trancher : un seul « Reste » dans Économie.

## 585. ★★★ MOTS-4 — ARCHIVES ALLÉGÉ : UNE PHRASE, TROIS CHIFFRES, UNE FRISE SANS NOMS QUI DIT LE NOM D’UNE CAMPAGNE AU SURVOL OU AU TOUCHER (16/11 — `src/pilotage.js` · `index.html` (style des Archives, fenêtre, versions) · `src/styles.css` · `src/reglages.js` · `src/utils.js` · `src/whats-new.js` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `docs/maquettes/maquette-archives-frise-v2.html` (neuf) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots4.mjs` (neuf) · trois harnais suivis · `scripts/mv-mots-baseline.json`)

### 585a. D’où ça vient
- La suite du plan « ★ MOINS DE TEXTE » (§28). Archives : 110 mots au téléphone, deux phrases de 15 mots, 47 mots avant le premier chiffre ; les barres de la frise portaient leur nom, tronqué au téléphone (« Après-vendange 202 »).
- **Nico, 16/11**, sur le face-à-face (l’appli, la maquette v3) et deux écarts annoncés : « Propose une maquette de chaque ». Deux frises côte à côte (`maquette-archives-frise-v1`, non gardée) : A, les noms sous la barre ; B, sans les noms. Réponse : « Non, mais tu peux faire en sorte que, quand la souris survole la frise, ça indique le nom de la période. Puis pareil que si on touche la frise sur téléphone. » La maquette du geste, testable : `docs/maquettes/maquette-archives-frise-v2.html`. **« Go ».**
- ★ **Ce qui a marché, encore** : une maquette qu’on TOUCHE. Le choix A / B ne convenait pas ; c’est en essayant B que la troisième voie est venue de lui.

### 585b. Ce qui a été fait
- **L’écran, de haut en bas** (dans `.pec-wrap`, avec les pièces d’Économie) : UNE phrase — « **2 années vigne**, 2 campagnes. Aucune clôture cette année. » (`_pecEnteteVue` ; une clôture = un instantané au nom d’une campagne de l’année vigne en cours) · trois chiffres de front (`.pec-k3`) : Années vigne, Campagnes, Heures archivées (« — · à la première clôture ») · **La frise · août → juil.** (l’axe est LU dans le réglage, AXE-1) · **Bilan par année** · deux boutons, « Comparer deux campagnes » et « Éditer le bilan ». Sur ordinateur, la frise à gauche, le bilan et les boutons à droite (`.pec-g2.pec-g21`).
- **La frise sans les noms.** `_arcLigne(an,list,cur)` rend les années de la ligne et ses barres. Une barre est un **bouton** de 36 px de haut (la zone de toucher), le trait coloré de 16 px dedans ; son nom, ses dates et ses heures sont en attributs (`data-n`, `data-d` : « 24 oct. → 28 févr. · en cours », ou « · 1 840 h » pour une campagne close) et dans `aria-label`. Le trait d’aujourd’hui reste ; sous la frise, une ligne nomme la campagne en cours.
- **La bulle** — `_arcBulle(seg)` : le nom et les dates de la barre visée, posés en TEXTE (jamais en HTML), au-dessus d’elle, tenus dans la carte (bornée à gauche et à droite, la flèche suit la barre). **Les gestes** (`_pilBindContent`) : `mouseover` l’ouvre, `mouseout` la referme, `focusin` l’ouvre au clavier ; un toucher (`click`) la fixe (`_ARC_FIXE`) jusqu’au toucher suivant — la même barre, ou ailleurs.
- **Le bilan par année** (`_arcBlocAnnuel`) : une carte, son titre, sa fiche, le choix « Année vigne | Exercice » (toujours réservé à l’administrateur). Une année sans clôture n’affiche que son nom et « en cours » ; les dates d’une année ne s’écrivent que si le cadre est l’exercice (elles sont alors autres que celles de la frise). « dont X h réparties », sans sa phrase.
- **Partis de l’écran** : le paragraphe du haut (33 mots), l’échelle des mois (`_cmpEchelle` n’est plus appelée ici ; Réglages › Campagne la garde), « N campagne · pas d’instantané » sur chaque ligne, « Calculé à partir des archives de campagne… », « Aucune campagne close cette année. Le bilan se remplit à chaque clôture. », la note du bas, le sous-titre d’écran (« Archives des campagnes » → « Archives »). **Passés derrière un « i »** : deux fiches neuves, `pil.arc.frise` et `pil.arc.bilan`.
- **L’écran vide** tient en une ligne : « Aucune campagne datée. » et le bouton « Réglages › Campagne › ».
- **La fenêtre « Comparer »** (`renderHistorique`, `#ovHistorique`) : elle s’appelle « Comparer deux campagnes » (plus « Historique multi-saisons · Comparaison entre saisons · Comparaison multi-saisons », trois titres pour une fenêtre) ; son sous-titre porte le compte ; « saison » → « campagne », « snapshot » → « archive » ; vide, une ligne (« Aucune campagne archivée · La comparaison s’ouvre à la première clôture. »).
- **Le style** : les règles des Archives (dans `index.html`) sont réécrites ; neuf classes mortes retirées (`arc-intro`, `arc-kpi`, `arc-lab`, `arc-fr`, `arc-note`, `arcan-h`, `arcan-t`, `arcan-sub`, `arcan-vide`) et leurs mentions dans l’échelle unique de `styles.css` ; la règle de hauteur de barre vise `.arc-seg i`.

### 585c. Arbitrages, et ce qui a été trouvé en route
- ★★★ **La maquette v3 disait « 2 campagnes, 2 périodes »** : elle date d’avant COHER-1 (§581). L’écran dit « années vigne » et « campagnes ». Une maquette validée n’est pas à jour des décisions prises après elle : l’écart se dit avant de coder (il l’a été).
- ★★ **L’échelle des mois est partie** (la maquette ne l’a pas). Les dates sont dans la bulle ; « août → juil. » sur le titre. Ce qu’on perd : lire d’un coup d’œil à quel mois commence une barre. À rendre si ça manque — `_cmpEchelle` existe toujours.
- ★★ **La bulle prend `--inverse` / `--sur-inverse`**, pas `--texte` / `--bg-card` : `mv-harnais-contraste` refuse un jeton de SURFACE employé comme encre (« juste dans un thème, invisible dans l’autre »).
- ★ **« à la première clôture », pas « à la 1ʳᵉ clôture »** : les lettres en exposant ne sont pas dans la police de l’appli (`mv-harnais-subset`, même cause que « ≥ », §583c).
- ★ **La fenêtre « Comparer » n’est alignée que dans ce qu’elle écrit elle-même.** Les boîtes de confirmation qu’elle ouvre (« Archiver la saison ? », « Écraser le snapshot ? ») gardent « saison » et « snapshot » : elles ont un mot à taper et leurs propres contrôles — c’est le lot du vocabulaire « campagne » (§28).
- ★ **Le premier patch s’est appliqué à moitié** : `pilotage.js` écrit, puis une assertion fausse a arrêté le script avant `index.html` (un compte de lignes à garder : 9, pas 8). Les deux scripts suivants préparent tout en mémoire et n’écrivent qu’à la fin, une fois toutes les ancres vérifiées. **Un patch à plusieurs fichiers écrit à la fin, ou pas du tout.**
- **Suivis** : `mv-harnais-coher1` (la ligne d’Archives JOUÉE avec ses aides ; « en cours » est sur la barre), `mv-harnais-arch` (le bilan a besoin des dates courtes), `mv-harnais-robustesse-pilotage` (l’ancre du défaut « NaN »).
- **Pas fait, annoncé** : la fenêtre « Comparer » garde sa mise en page (styles en ligne, tailles de 10 px) — seuls ses mots changent ; ses boîtes de confirmation (ci-dessus) ; au téléphone, une barre de moins de 8 px de large reste difficile à viser (une campagne de quelques jours).

### 585d. Mesuré
- **`npm run test:mots`** (regravé) — Archives : **110 → 37 mots** au téléphone (116 → 37 sur ordinateur), phrases de 15 mots **2 → 0**, mots avant le premier grand chiffre **47 → 1**, hors lexique **5 → 0**. Totaux : 7 373 mots au téléphone, 8 841 sur ordinateur ; 47 et 58 phrases longues ; hors lexique au Pilotage 64.
- **Joué dans le navigateur, sur le build** (démo, téléphone 390 px et PC 1366 px) : la souris passe sur une barre → la bulle (« Printemps 2026 / 1 mars → 23 oct. »), dans la carte ; la souris partie → refermée ; au téléphone, un toucher l’ouvre, un toucher ailleurs la referme. Rejoué avec une année complète et close injectée dans la page (quatre campagnes, deux archives — données de test, jamais écrites) : le bilan rempli, la bulle « Été 2026 / 1 juin → 31 juil. » au bord droit, tenue dans la carte. La fenêtre « Comparer deux campagnes », vide puis avec une archive. Aucune erreur de page.
- `mv-harnais-mots4` (neuf) : **51 assertions**, **48/48** contre-épreuves — il JOUE `_arcLigne` (l’ordre, « en cours », les heures, un nom avec guillemets et chevron) et `_arcBulle` sur un faux écran (texte, bords, fermeture, écran repeint, hors Archives). `npm run test:ux` : vert (18). `npm run test:gabarit` : vert (15).
- Tutos : aucun concerné ; le panneau côte à côte rejoué vert aux trois largeurs (`index.html` et `styles.css` ont changé). Démo du site : aucune capture ne montre Archives, les cinq rejouées, inchangées.
- La chaîne : cinq rouges au premier passage (les trois harnais suivis, le contraste de la bulle), puis **774 commandes, aucun rouge** (522 s).
- **Pas vu à l’écran** (le harnais seul les joue) : l’écran vide, le cadre « Exercice » et ses dates, « dont X h réparties », une campagne close avec ses heures dans la bulle, le clavier. **Pas regardé** : le thème sombre (la bulle prend les jetons inverses, pas vue), un PC à 125 %, un vrai domaine avec dix ans d’archives, un vrai téléphone (le toucher est joué par l’émulation de Chromium).

### 585e. Ce qui reste ouvert
§28, « ★ MOINS DE TEXTE » : les quatre onglets qui déménagent s’allègent dans le lot de leur déménagement ; puis la Cave.

## 586. ★★★ MOTS-5 — AUJOURD’HUI ALLÉGÉ : TOUTES LES CARTES GARDÉES, MOINS DE MOTS DANS CHACUNE (16/11 — `src/cockpit-vue.js` · `src/aujourdhui.css` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-mots5.mjs`)

**Ce que Nico a dit.** Devant la maquette v1 (l’écran réduit à cinq blocs, le reste envoyé dans d’autres onglets) : « Non, ça ne va pas. […] L’onglet de pilotage doit vraiment rapporter chaque élément. […] L’onglet comme il était avant me semblait bien. Effectivement, il faut l’alléger. Mais je veux continuer de voir les cartes en direct, je veux voir tout ce qu’il y a ». Puis, sur la v2 : « sur tel il faudrait pouvoir mettre À savoir et En direct en avant » ; sur la v3 : il manque la colonne de gauche sur ordinateur ; sur la v4 : « c’est parfait, tu lances comme ça ». Le réglage de l’ordre des cartes : « si ça ne rajoute pas de lot ou de complications dans le code. Sinon, on laisse comme ça » — **pas fait** (il faudrait un écran de réglage, une sauvegarde par personne et un ordre par largeur : un lot à lui seul).

**LA RÈGLE (elle vaut pour les vues Cave et Économie d’Aujourd’hui, à venir).** Un écran de pilotage **garde tout sur l’écran** ; on allège **dans** chaque carte : un titre, un chiffre, une barre ou une couleur ; la méthode derrière le « i » ; le détail au toucher. ⚠️ Alléger n’est pas retirer : la v1 avait compris « moins de texte » comme « moins de cartes ». Les références lues le 16/11 disent la même chose (un tableau de bord = l’essentiel sur un seul écran ; ne pas replier ce qu’on regarde à chaque fois ; le plus important en haut au téléphone).

**Ce qui change, carte par carte (`src/cockpit-vue.js`).**
- **La phrase du jour** (`majResume`) : la phrase (le délai, l’écart au budget — en vert l’avance, en rouge le retard ou le dépassement), les points à voir en **pastilles qui se touchent** (`.ck-res-pl`, mêmes boutons qu’avant : `data-fn="anticiper"`, `data-fn="cave"`), puis **une ligne de repères** (`.ck-res-rep` : « fin prévue 25 nov. · objectif 28 févr. (i) », « coût à la fin … · budget … (i) »). `refChiffre` rend une ligne ; `calerRefs` est **retirée** (elle calait au pixel les repères sous chaque chiffre, AUJ-TETE-1 §454). Le mot « Aujourd’hui » du cadre ne se redit plus (`.ck-cadre-nom` retiré) ; dès 700 px, la bascule flotte à droite de la ligne de date.
- **Les tuiles** (`tuile`, `htmlPhotos`, `barresPh`) : une **barre** à la place de la petite courbe (Budget : la barre est la part engagée, le trait la part du travail fait), « 175 / 1 123 h », « présents » (ou le texte des absences), « engagé · fait 16 % », la pastille « à régler ». « Effectif » s’appelle **Équipe**. ⚠️ Les chiffres montent seuls au montage, sans `majPhotos` : les barres se posent aux deux endroits (`barresPh`), sinon elles restent vides au premier affichage.
- **Fin prévue** (`htmlVerdict`, `majVerdict`) : la date en grand (`dCourt`), « 65 j avant l’objectif » à côté, la jauge (le losange EST la date : plus d’étiquette dessus), « Objectif 28 févr. », « Simuler un renfort ».
- **À savoir** (`htmlSavoir`) : le compte en pastille (« 2 points »), le cadenas seul ; un point = son titre et son moment, **ce qu’il change se déplie** (`<details class="ck-sv-d">`) ; plus d’étiquette « À anticiper » (le fond orange le dit) ni de légende sous la météo (elle est dans le « i ») ; le vent avant le cumul.
- **La décision du jour** (`htmlDecision`) : une question par ligne — la question et son bouton (« Planning », « Phyto », « Changer », « Détail », le nom long en `aria-label`), la réponse et son dessin ; **la raison se déplie en touchant la réponse** (`<details class="ck-dz-d">`). Elle reste écrite : c’est elle qui dit « pluie à 14 h ».
- **Le domaine en direct** : deux appellations de front dès 300 px (`mesuresPlan`, une seule avant sous 420 px) ; la phrase d’état est masquée (les compteurs de la légende la disent) ; une famille à zéro s’efface (`.zero`), « Arrachée » ne s’affiche que s’il y en a ; la note devient « 7 sans contour », la phrase se déplie.
- **Chantiers** (`htmlChantiers`) : une ligne par chantier (nom, barre, %, heures) ; ses dates sous le chantier affiché sur le plan (`.vue`) ; « fenêtre passée » et « la suite au prestataire » toujours visibles (`suiteFen` ne commence plus par une virgule). Une fiche « i » (`chant`) porte la règle de l’ordre.
- **Charge restante** : le chiffre en grand et « 73 h par jour » (`#ck-gr-cadre`), plus de légende — « fin prévue 25 nov. » au losange, « allure objectif » écrit sur sa droite (muet quand elle est trop courte ou collée à la projection) ; le graphe est plus bas (`cadre(…, bas)`, celui d’Économie ne change pas). ⚠️ « Agrandir » remettait le graphe **devant la légende** : sans légende il était supprimé au retour — il revient en fin de carte.
- **Au téléphone** (`RANGS.t.petit` et la feuille) : « En direct » puis « À savoir » juste sous la phrase, **avant les tuiles** — les tuiles sont hors des colonnes, l’ordre se fait donc dans la feuille (`.ck-page[data-taille="petit"]` en colonne, la vue Terrain et ses colonnes en `display:contents`, `order`) ; les tuiles deux par deux (elles défilaient de côté : deux visibles sur quatre) ; 16 px de marge au lieu de 40 ; les pastilles de la phrase qui redisent un point écrit dessous s’effacent (`.dbl`).

**⚠️ LEÇONS.**
- **`styles.css` est à son plafond (1 024 ko, `mv-harnais-typo`) : rien n’y entre.** Le bloc du lot, posé en fin de feuille, a rougi trois harnais d’un coup (`typo` : 1 033 ko ; `gabarit1` et `tete2` : le gabarit du Pilotage doit garder le dernier mot de la feuille). Les règles du lot vivent dans **`src/aujourdhui.css`**, importée par le module d’entrée après `styles.css` et `bandeau.css` (comme TETE-4A, §577) ; `styles.css` ne perd que ses règles mortes. ⚠️ Avant d’écrire une règle : regarder le poids de la feuille.
- **Retirer une légende, c’est retirer ses règles — pas celles du voisin.** `.lg-mes` servait aussi à la légende d’Économie (« Budget dépensé ») : le harnais du lot l’a vu.
- **Une ligne qui se déplie est une cible à toucher.** Les `<summary>` (la réponse d’une question, un point d’« À savoir », « 7 sans contour »), les pastilles de la phrase et les lignes de chantier passées sur une ligne faisaient moins de 44 px : `npm run test:ux` a rougi (6 cibles sous 24 px, +2 à +6 sous 44). Elles gardent leur dessin et gagnent leur zone : hauteur minimale de 44 px reprise par une marge négative, ou bordure transparente (`background-clip:padding-box`) pour une pastille. ⚠️ Ce cliquet n’est pas dans la chaîne : le lancer à la main.
- **Une page de 32 px de large n’est pas un téléphone.** Une capture pleine page (et un onglet caché) pose un instant la page à largeur nulle : `ranger` passait en « petit », déplaçait les cartes, puis revenait. Avec l’ordre du téléphone fait en feuille, la capture a montré l’ordre du téléphone à 1 366 px. `ranger` ne range plus rien sous 200 px.
- **L’échelle unique du Pilotage est en `!important`** : une hauteur de barre ou une taille écrite dans un bloc de lot ne prend pas. Les barres des tuiles sont des `.ck-barre.fine` ; la réponse d’une question passe à `--t-ligne` par une règle de la même force.
- **Un harnais qui JOUE une fonction casse au premier changement de sa signature** (`mv-harnais-autete1`, `-anticipe1` : la fin de `refChiffre` servait de borne d’extraction). Lire le plantage avant de croire à 9 rouges.
- **Dans une maquette qui réutilise une feuille, préfixer ses classes** : `.t`, `.pl`, `.ic` ont heurté la tuile, la pastille et le bouton (une case rouge géante dans la légende, un jour de météo décalé).

**Mesuré (démo, 27/10).** Le cliquet des mots (`npm run test:mots`, vue Terrain) : téléphone **319 → 157 mots**, ordinateur **324 → 164** ; mots hors lexique 13 → 3 ; aucune phrase de 15 mots. Hauteur de la page au téléphone : 4 609 → 3 230 px (5,5 → 3,8 hauteurs d’écran) ; sur ordinateur 2 165 → 1 838 px. Cibles sous 44 px au Pilotage (`npm run test:ux`) : 41 → 35 au téléphone, 41 → 37 sur ordinateur. La maquette annonçait mieux (2,9 et 1,3 hauteurs) : l’appli garde ses marges de carte, un plan aux formes réelles plus haut que celui de la maquette, et « En direct » sa hauteur d’une journée calme.

**Harnais** : `mv-harnais-mots5.mjs` (36 assertions, 29 contre-épreuves) — il a trouvé un vrai défaut avant la livraison : la règle `.lg-mes` retirée avec la légende de la charge restante servait encore à la légende d’Économie (« Budget dépensé »). Adaptés : `autete1` (la phrase et ses repères, `calerRefs` retirée : section F et E6 supprimées, 9 assertions et 5 contre-épreuves réécrites), `anticipe1`, `chant1`, `auj5`, `auj8`, `pro1`.

**NON vérifié** : un vrai téléphone ; le thème sombre ; les vues Cave et Économie d’Aujourd’hui (pas touchées) ; un domaine avec beaucoup de tâches ou d’appellations ; l’écran d’un non-administrateur.

## 587. ★★ MOTS-5B — LE CLIQUET DES MOTS ÉTAIT ROUGE APRÈS MOTS-5 : UNE ZONE DE TOUCHER QUI REMONTAIT (17/11 — `src/aujourdhui.css` · `scripts/mv-harnais-mots5.mjs`)

**Ce que Nico a vu.** Après le push de « mots5 » (`345d78e`) : « le commit et push précédent n’est pas passé […] ce sont les mots qui ressortent ». Aucun défaut à l’écran au déploiement. Reproduit sur `345d78e` : `npm run test:mots` **rouge** — « mots avant le premier grand chiffre », ordinateur, 13 → 19 sur les trois vues d’Aujourd’hui (Terrain, Cave, Économie : la tête est commune). `test:gabarit` et `test:ux` verts.

**La cause.** Le cliquet lit, pour chaque texte, **le haut de la boîte de son élément** (`el.getBoundingClientRect().top`) et compte les mots posés plus de 4 px au-dessus du premier grand chiffre — ici la phrase du jour. Pour que les pastilles de la phrase se touchent sur 44 px (§586, `test:ux`), je leur avais mis une bordure transparente de 8 px **tout autour**, reprise par une marge négative : le dessin ne bougeait pas, mais la boîte remontait de 8 px, donc au-dessus de la phrase. Les mots des deux pastilles (« point », « anticiper », « cuves », « mesurer », « en », « cave » : 6) passaient « avant le premier chiffre ».

**Le correctif.** La bordure descend **sous** la pastille (16 px en bas, rien en haut), la marge négative aussi. La boîte fait toujours 44 px (`test:ux` vert), son haut est celui du dessin (`test:mots` vert **sans regraver** : 13). Rien ne change à l’écran. APP 11.14 → 11.15 (bloc d’annonce vide), SW 12.05 → 12.06.

**⚠️ LA FAUTE DE MÉTHODE, ET LA RÈGLE.** La référence des mots avait été regravée au milieu de MOTS-5 ; la zone de toucher est venue **après**, pour verdir `test:ux` — et `test:mots` n’a pas été relancé. Les trois cliquets rendus (`npm run test:mots`, `test:ux`, `test:gabarit`) **ne sont pas dans la chaîne** (`mv-lanceur`). **Ils se lancent TOUS LES TROIS, EN DERNIER, après la dernière retouche de feuille ou de gabarit — et de nouveau si l’un d’eux fait retoucher quelque chose.** Corriger l’un peut rougir l’autre : ils mesurent la même boîte, pas la même chose (sa hauteur pour l’un, son haut pour l’autre).

**Le harnais du lot (`mv-harnais-mots5.mjs`, 39 assertions, 33 contre-épreuves).** Deux assertions de plus (la bordure ne remonte pas ; la référence garde 13 mots au plus avant le premier chiffre sur ordinateur) et leurs contre-épreuves. ⚠️ Sa ligne des versions disait « 11.14 partout » : elle aurait rougi au premier lot suivant — elle dit maintenant « 11.14 au moins », comme celle de MOTS-4.

**NON vérifié** : un vrai téléphone ; le thème sombre.

## 588. ★★★ MOTS-6 — AUJOURD’HUI, LA VUE CAVE ALLÉGÉE : LES SIX CARTES GARDÉES, MOINS DE MOTS DANS CHACUNE (17/11 — `src/cockpit-vue.js` · `src/pilotage.js` · `src/cave.js` · `src/aujourdhui.css` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-mots6.mjs`)

**La demande.** Après MOTS-5 (§586, la vue Terrain), Nico : « suite », puis « oui » à « finir Aujourd’hui : la vue Cave, puis la vue Économie ». Maquette téléphone et ordinateur, Avant / Après, cadre réel de l’appli : `docs/maquettes/maquette-aujourdhui-cave-v1.html` — « Parfait pour la maquette » (17/11). Base `9da4aa8` (« mots5b »). APP 11.15 → 11.16, SW 12.06 → 12.07.

**La règle, la même que la vue Terrain.** Rien ne quitte l’écran : les six cartes restent, à la même place sur ordinateur. Dans une carte : un titre, un chiffre, une barre ou une couleur. Le pourquoi du jour et la méthode vont derrière le « i ». Le détail se déplie au toucher. Aucun calcul ne change.

### 588a. Carte par carte

| Carte | Avant | Après |
|---|---|---|
| **Ce qui presse** (ex « Ce qui presse en cave ») | une grande phrase, une phrase de suite (« Pas de relevé… Puis : … »), une note de trois lignes | le chiffre en grand, son mot, « aujourd’hui » en petit ; ce qui suit en pastilles ; trois compteurs (« cette semaine », « semaine prochaine », « dans 2 à 4 sem. ») ; les deux boutons |
| **Le millésime** | une phrase, quatre blocs de trois lignes, une phrase de rendement, une note | le tonnage en grand ; la barre ; une ligne de légende par étape, **en hL comme la barre** ; ce qu’elle compte (tonnes, cuves, fûts) au toucher ; « rendement — 38 hL/ha » ; les autres millésimes ; les deux liens |
| **La cave en direct** | sous chaque cuve : matière, contenance, état, mesure, suite ; par cuvée : nom, fûts, volume, état, ronds, une ligne de suite | une cuve : son dessin (64 px), son nom, son état, sa mesure ; une cuvée : son nom, son état, ses fûts, son retard ; le reste au toucher, avec « Ouvrir » ; « En cours » et « À jour » : le nom, le compte, un chevron |
| **La cave dans la semaine** | un sous-titre, la légende des ronds, une phrase de total, un bandeau de deux lignes, trois lignes par période | cinq jours (aujourd’hui plus large) ; une ligne orange « 2 soutirages, 1 ouillage sans journée de cave » + « Prévoir » ; une ligne par période, « sans journée » en pastille |
| **En direct** | un sous-titre, le nom complet de la cuve à chaque ligne, une liste coupée en fondu | « Relevé · Cuve 3 », la mesure dessous, « auj. » ; trois gestes, la suite sous « Tout voir » (dans l’en-tête) |
| **À savoir** | quatre blocs de quatre à cinq lignes | le compte en pastille ; un point par ligne, avec un bouton court (« Cuvée », « Prévoir », « Diagnostic », « Cuvier » — le nom long en `aria-label`) ; ce que change le point au toucher |

Au téléphone : « En direct », puis « À savoir », juste sous la phrase du jour, puis les tuiles et les cartes de la cave — l’ordre de la vue Terrain (`RANGS.c.petit`, et la feuille : `:is(#ck-vue-terrain,#ck-vue-cave)`).

### 588b. Comment c’est fait

- **Rien n’est recalculé.** `_mlVerdict` (cave.js) rend, en plus de `t` et `s`, ses pièces : `why` (le pourquoi du premier point) et `puis` (ce qui suit, trois au plus). `_pilCk2Cave` (pilotage.js) ajoute au modèle des **pièces courtes**, à côté des champs d’avant, tous gardés : `verdict.t / quand / puis / pourquoi`, `cuvier.court`, `chai.court`, par cuvée `rt` (le retard d’ouillage) et `d` (le reste), `semaine.manqueC / totC`, par période `court` et `jours`, `mil.t / sousT / leg / rdtV / rdtS`, par point `ac` (le bouton court). Le fil est mis en forme court (« Relevé · Cuve 3 », « 1006 · 23 °C », « auj. »). « 2 cuvées ont fini leur malo » se dit « 2 malos finies » dans la pastille — la seule réécriture, faite sur le texte de la Cave.
- **`INFO_PLUS`** (cockpit-vue.js, à côté d’`INFO`) : ce qu’une carte ajoute à sa bulle au moment où elle se dessine — le pourquoi du verdict et son cadre, le total des journées de cave, la règle des kilos et le rendement. `ouvrirInfo` les met **avant** la méthode. Une fiche à titre (objet) ne change pas.
- **Le toucher.** Une cuve, une cuvée, une étape du millésime sont des `<details>` : le toucher **déplie** (avant, il ouvrait l’écran de la Cave). « Ouvrir » (`cvOuvrir`, un `data-cave`) y mène. Au survol (souris) et au clavier, la bulle `cvTip` reste ; elle s’efface quand la ligne se déplie. **Toujours aucun bouton de geste.**
- **Les rangées « En cours » / « À jour »** (CAVEPIL-3, §457) : même HTML ; la feuille cache l’icône, le mot « Tout voir » et, repliée, la ligne du prochain ouillage. Le chevron seul reste. Dépliée, la rangée redonne tout.
- **La feuille** : tout dans `src/aujourdhui.css` (bloc MOTS-6). `styles.css` (au plafond) n’a fait que **perdre** ses règles mortes (`.cv-etapes`, `.cv-et`, `.cv-mil-tete`, `.cv-note`, `.cv-leg-j`, `.cv-tot`, `.cv-cuvee-s`, `.cv-btl-ic`, le fondu d’« En direct »…) : 1 047 060 → 1 043 231 octets.
- **Le lexique (§580c)** : « Fin estimée jeu. 29 » (sous une cuve, puis dans son détail) devient « Fin de FA prévue jeu. 29 ».

### 588c. Mesuré (build, démo au 27/10, Chromium du bac à sable)

| | Avant | Après |
|---|---|---|
| Mots de la vue Cave (`npm run test:mots`) — téléphone | 485 | **226** |
| … ordinateur | 533 | **232** |
| Phrases de 15 mots et plus | 5 | **0** |
| Mots hors lexique | 2 | 1 (la date longue de la tête, commune aux trois vues) |
| Hauteur de la page — téléphone (390 px) | 4 282 px (5,1 écrans) | 3 306 px (3,9 écrans) |
| … ordinateur (1 366 px) | 2 167 px (2,4 écrans) | 1 790 px (2,0 écrans) |

Gestes rejoués à l’écran, téléphone et ordinateur : une cuve, une cuvée, une rangée, une ligne du millésime, un point d’« À savoir » se déplient ; les bulles « i » de « Ce qui presse », de la semaine et du millésime ouvrent sur la phrase du jour ; « Tout voir » déplie le fil ; « Ouvrir » ouvre la Cave ; la légende filtre.

### 588d. Écarts avec la maquette, à connaître

- **La page est plus haute que sur la maquette** (téléphone 3,9 écrans contre 3,2 annoncés ; ordinateur 2,0 contre 1,6) : la légende à quatre boutons du plan, les zones de toucher de 44 px et les marges réelles des cartes prennent plus de place que le dessin.
- **« Ouvrir »** n’était pas sur la maquette : le toucher d’une cuve ou d’une cuvée dépliant son détail, il fallait une porte vers l’écran de la Cave. Elle est dans le détail déplié.
- **« Ce qui presse » n’a pas de fond de carte**, comme « Fin prévue » de la vue Terrain (la pièce `.ck-verdict`) ; la maquette le dessinait en carte.
- **Les libellés gardent leur majuscule** (« À mesurer », « Alerte 0 », « Prioritaire ») : ce sont les pastilles de l’appli. La légende du plan garde ses boutons (elle filtre).
- **« En retard de 5 j »** dans « À savoir » (la maquette écrivait « retard 5 j ») : le texte est celui de la Cave. Sur la ligne de la cuvée, c’est bien « retard 5 j ».
- **Au téléphone, « aujourd’hui » fait 1,4 fois un autre jour** (1,7 sur ordinateur) ; un mot long (« Décuvage », « Dégustation ») se coupe plutôt que de sortir de sa case.
- **Sur ordinateur, la légende du millésime tient sur une colonne** quand la carte est étroite (sous 280 px) : sur deux colonnes, les noms passaient à la ligne.

### 588e. Les harnais

- **`mv-harnais-mots6.mjs`** : 49 assertions, 51 contre-épreuves. Le modèle sort du **vrai** `_pilCk2Cave`, le verdict du **vrai** `_mlVerdict`, le dessin du **vrai** cockpit, montés dans Node sur le domaine de démo ; chaque carte est comparée à ce que montre la maquette.
- **Adaptés** : `cavepil1` (deux contre-épreuves visaient des lignes parties), `cavepil3` (la bulle, l’aide et le guide disent « Toucher la ligne », plus « Tout voir »), `autete1` (son bac charge `INFO_PLUS`), `mots5` (l’ordre du téléphone couvre les deux vues).
- ⚠️ **Une contre-épreuve ne prouve rien tant que la suite de base est rouge** : `mots6 --contre` annonçait « 51 rougissent » alors qu’une assertion (la référence des mots, pas encore regravée) était rouge — toutes les mutations « rougissaient » par elle. Relancée après le vert : une restait verte (« le retard d’une cuvée est inventé »), assertion ajoutée. **Lancer `--contre` seulement sur une suite verte.**

**Les trois cliquets rendus, lancés en dernier** (règle du §587) : `npm run test:mots` (référence regravée, 6 baisses, aucune hausse), `npm run test:ux`, `npm run test:gabarit` — verts.

**NON vérifié** : un vrai téléphone ; le thème sombre ; un domaine avec beaucoup de cuves (plus de six de front) ou de cuvées ; un signe fort du Diagnostic à l’écran (joué par le harnais CAVEPIL-1, pas regardé) ; une semaine avec des journées de cave au planning (jouée par le harnais, pas regardée) ; un écran non admin. **Reste à faire** : la vue Économie d’Aujourd’hui, même règle, maquette d’abord.

## 589. ★★★ MOTS-7 — AUJOURD’HUI, LA VUE ÉCONOMIE ALLÉGÉE, ET CDDCDI-1 RÉGULARISÉ (17/11 — `src/cockpit-vue.js` · `src/aujourdhui.css` · `src/styles.css` · `src/planning.js` · `src/utils.js` · `src/whats-new.js` · `guide/11-pilotage.html` · `guide/10-planning.html` · `scripts/mv-harnais-mots7.mjs` · `scripts/mv-harnais-cddcdi1.mjs`)

**La demande.** Après MOTS-6 (§588, la vue Cave), Nico : « suite ». Maquette téléphone et ordinateur, Avant / Après, cadre réel de l’appli : `docs/maquettes/maquette-aujourdhui-economie-v1.html` — « C’est parfait ». Dans le même message : « régularise en même temps et si tu veux faire un lot de l’intégralité, c’est mieux » — le commit « planning » (`1b14008`, CDDCDI-1) était arrivé sans harnais, sans version, sans doc, et cassait deux contrôles. Un seul lot pour les deux. Base `1b14008`. APP 11.16 → 11.17, SW 12.07 → 12.08.

### 589a. La vue Économie, carte par carte

Même règle que les vues Terrain (§586) et Cave (§588) : rien ne quitte l’écran, les six cartes restent à leur place ; dans une carte, un chiffre, une barre ou une couleur ; le pourquoi du jour et la méthode derrière le « i » (`INFO_PLUS`) ; le détail au toucher (`<details class="ck-dp">`). **Aucun calcul ne change.**

| Carte | Avant | Après |
|---|---|---|
| **Coût à la fin** (ex « Atterrissage de la campagne ») | « La campagne devrait coûter 15 317 € . », une phrase de suite, trois étiquettes sur les repères de la frise (qui se chevauchaient) | le montant en grand, « 467 € sous le budget » en couleur à côté ; la frise sans étiquette ; dessous « engagé 1 940 € » et « budget 15 784 € » ; « Ouvrir l’Économie », « Exporter » (nom long en `aria-label`) |
| **Les quatre chiffres** | sous chaque chiffre, une à quatre lignes ; « Rien à rattraper » en gros titre vert | le nom, le chiffre, deux ou trois mots (« prévu 2 248 », « plus rapide », « il en faut 11 ») ; « Cadence », « Retard » ; l’écart au barème en vert (plus rapide) ou orange (plus lent) ; « rien à rattraper » en pastille verte ; la phrase d’avant derrière le « i » |
| **Main-d’œuvre** (ex « Main-d’œuvre : dépensé face au fait ») | un titre long, un sous-titre, une légende sous le graphe, « 100 % fait » et « 97 % du budget » aux deux bouts | « fait 16 % » et « engagé 12 % » en chiffres au-dessus, qui servent de légende ; au bout des pointillés « fin prévue 25 nov. » puis « fait 100 % · engagé 97 % » (à droite du point s’il y a la place, sinon à gauche) |
| **Par poste** | un sous-titre, trois lignes par poste | le nom, l’écart, la barre, « 1 888 / 15 447 € » ; les heures, le taux, les litres au toucher ; « Toute la campagne » a désormais sa barre, son trait et le coût à la fin au toucher |
| **Par appellation** | un sous-titre, trois lignes par appellation, dans l’ordre du domaine ; les appellations sans travail en entier ; une note de trois lignes | une ligne par appellation (nom, barre, €/ha), **de la plus chère à la moins chère** ; la surface au toucher ; « 2 sans travail validé » sur une ligne repliée ; « +230 % de Bourgogne à Gevrey-Chambertin » ; la phrase derrière le « i » |
| **Écart par tâche** (ex « Écart au barème, par tâche ») | un sous-titre, trois mots d’échelle, deux lignes par tâche | le nom, la barre, l’écart ; les heures au toucher ; « plus rapide / plus lent » au-dessus de la barre seule |

Au téléphone, l’ordre ne change pas (la vue n’a ni « En direct » ni « À savoir »).

### 589b. Les mots (§580c)

- « Atterrissage » → **« coût à la fin »**, le mot de la phrase du haut — à l’écran, dans les bulles, l’aide et le guide.
- « Dépensé » / « payé » → **« engagé »** : le mot du lexique pour les euros de la campagne, celui de la tuile Budget. ⚠️ La maquette validée écrit « dépensé » : le cliquet des mots le compte hors lexique (`d[ée]pens[ée]e?s?`). Le code suit le lexique ; l’écart est dit au LISEZMOI.
- « Cadence de l’équipe » → « Cadence » ; « Coût de l’inaction » → « Retard » ; la bulle du graphe (survol) dit « fait » / « engagé » comme sa légende.
- La date longue de la tête (« Mardi 27 octobre ») reste le seul mot hors lexique de la vue : elle est commune aux trois vues.

### 589c. CDDCDI-1, régularisé

**Le commit** (`1b14008`, `src/planning.js` seul) : quand un CDD devient CDI, la fiche garde le CDI comme contrat en cours ; la grille ne lisait que lui (`_planInContract`) et tous les jours d’avant tombaient en « – ». `_pl2Cell` affiche maintenant un jour couvert par un contrat archivé (`_planJourCouvert`), marqué `ro` (lecture seule), sans en faire un bouton ; la ligne « Σ jour » compte ces jours (`_planJourArchive`) ; la fiche du mois ne les ouvre pas. Les compteurs restent sur `_planInContract` — la règle des « deux portails ».

**Ce que le lot y ajoute** :
- `mv-harnais-retard.mjs` **plantait** : son banc ne chargeait pas `_pl2CellJour`. Ajouté à sa liste.
- `mv-harnais-vueeq1.mjs --contre` : une contre-épreuve visait `h+='<div class="pl2-cell pleq-ro'`, et la case en lecture seule de l’admin avait pris la classe `pleq-ro` de la vue Équipe du salarié — deux ancres. La case a maintenant sa classe à elle, **`pl2-cell-ro`** (curseur au repos, avec `.pl2-cell-out` et `.pl2-cell-hc`).
- **`mv-harnais-cddcdi1.mjs`** : 15 assertions, 14 contre-épreuves, sur les vraies fonctions de contrat et la vraie case montées dans Node (un CDD archivé sans coupure, un CDD suivi d’une coupure).
- La version (11.17), l’annonce à l’admin (« Planning : un CDD devenu CDI garde son passé à l’écran »), une ligne d’aide (Planning), une puce au guide (`10-planning.html`).
- **Pas vérifié à l’écran** : la démo n’a pas de contrat archivé ; la grille n’a été jouée que dans Node.

### 589d. Comment c’est fait

- Les pièces du jour vont dans `INFO_PLUS` (déclaré à côté d’`INFO`) : `atterrissage` (le reste au barème ou au rythme mesuré), `cadence` (l’allure pour tenir l’objectif), `inaction` (pourquoi le retard est nul, ou ce qu’il coûte), `apps` (l’écart entre appellations). `ouvrirInfo` les met avant la méthode (MOTS-6).
- `ecCadre` dit le sens (« plus rapide », « plus lent », « au barème », « rien de validé ») ; `ecCls` la couleur. `ligneTot` fait de « Toute la campagne » une ligne de poste comme les autres.
- Feuille : tout dans `src/aujourdhui.css` (bloc MOTS-7). `styles.css` n’a fait que perdre ses règles mortes (`.ck-ek-calme`, `.ck-gr-leg`, `.ck-ap-b`, `.ck-ap-c`, `.ck-e-lf`, l’étiquette « dépensé » de la frise, l’ancienne grille des tâches…) — sauf `.ck-fr-visee em`, partagée avec la vue Terrain (589g).

### 589e. Mesuré (build, démo au 27/10)

| | Avant | Après |
|---|---|---|
| Mots de la vue Économie (`npm run test:mots`) — téléphone | 243 | **115** |
| … ordinateur | 249 | **121** |
| Mots hors lexique | 10 | 1 (la date de la tête) |
| Hauteur de la page — téléphone (390 px) | 3 098 px (3,7 écrans) | 2 382 px (2,8 écrans) |
| … ordinateur (1 366 px) | 1 628 px (1,8 écran) | 1 181 px (1,3 écran) |

Gestes rejoués à l’écran, téléphone et ordinateur : un poste, une appellation, la ligne « sans travail validé », une tâche se déplient ; les bulles « i » du coût à la fin, de la cadence, du retard et des appellations ouvrent sur la phrase du jour ; « Ouvrir l’Économie » ouvre l’onglet ; rien ne déborde d’une carte ; aucune erreur.

### 589f. Écarts avec la maquette

- « engagé » au lieu de « dépensé » (589b).
- La page est plus haute que la maquette (téléphone 2,8 écrans contre 2,3 ; ordinateur 1,3 contre 1,1) : les zones de toucher de 44 px et les marges réelles des cartes.
- « Coût à la fin » n’a pas de fond de carte, comme « Fin prévue » (Terrain) et « Ce qui presse » (Cave).
- Sur ordinateur, dans les tuiles étroites, les noms (« Coût à l’hectare », « Écart au barème ») passent sur deux lignes et « rien à rattraper » aussi.

### 589g. Leçons

- ⚠️ **Une espace fine écrite en clair dans le source** (le caractère, au lieu de `\u202f`) ne se voit pas à l’écran et passe tous les contrôles rendus ; elle casse les harnais qui cherchent le texte du source (ici REF-2). Avant de livrer : `grep -c $'\u202f\|\u00a0'` sur chaque fichier touché, comparé à `HEAD`.
- ⚠️ **Une règle « morte » peut servir ailleurs** : `.ck-fr-visee em` (l’étiquette d’un repère de frise) semblait propre à la vue Économie ; la frise de la vue Terrain l’utilise aussi (« Objectif »). Retirée, l’étiquette est remontée au-dessus du trait — aucun harnais ni cliquet ne l’a vu, **la capture de démo l’a vu** (`mv-demo-captures`, comparée pixel à pixel). Rendue, et gardée par `mots7`. Avant de retirer une règle : chercher chacune de ses classes dans tout `src/`, pas seulement dans la fonction réécrite.
- ⚠️ **Un commit poussé sans lot** (CDDCDI-1) : la chaîne le dit, pas le commit. Deux contrôles rouges depuis `1b14008` ; relancer la chaîne à chaque reprise, même quand le lot précédent était vert.

**Harnais adaptés** : `auj5` (la règle à 20 px n’a plus `.ck-ek-calme`), `ecart1` (`ecCadre`, la classe de l’écart, le nom de la carte), `mots5` (« fin prévue » s’écrit trois fois), `pro1` (« pile dans le budget »), `ref2` (l’inaction lue avec son calme), `retard` (`_pl2CellJour`). **Nouveaux** : `mots7` (37 assertions, 51 contre-épreuves), `cddcdi1` (15, 14). Les contre-épreuves de chaque harnais ne se lancent que sur une suite verte (§588).

**Les trois cliquets rendus, lancés en dernier** (§587) : `npm run test:mots` (référence regravée : 4 baisses, aucune hausse), `npm run test:ux`, `npm run test:gabarit` — verts.

**NON vérifié** : un vrai téléphone ; le thème sombre ; un domaine au-dessus du budget (l’écart en orange, la zone de la frise en orange) ; un retard non nul à l’écran (joué par le harnais) ; un domaine avec beaucoup de postes ou d’appellations ; la grille du Planning avec un contrat archivé, à l’écran. **Reste à faire** dans « ★ MOINS DE TEXTE » : la suite du plan (§28) — Travaux, Décider, L’équipe & le matériel, Conformité dans leurs lots de déménagement, puis Cave › Le Millésime, Cave › Aujourd’hui, Phyto › Registre, la Réserve, le balayage.

## 590. ★★★ MOTS-8 — PILOTAGE › TRAVAUX ALLÉGÉ SUR PLACE : L’ONGLET RESTE, SES CARTES AUSSI (17/11 — `src/pilotage.js` · `src/utils.js` · `src/pilotage.css` (neuve) · `src/app.js` · `src/whats-new.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-mots8.mjs`)

**La demande.** Nico (17/11), en reprenant le plan du rangement : « J’aimerais bien garder le mode de pilotage comme il est actuellement, avec travaux, décider, l’équipe, le matériel, conformité […] que le pilote puisse ouvrir sans avoir à ouvrir les autres onglets, les autres modules, vraiment pour visiter un petit peu tout ce qu’il y a à voir. […] Regarde un petit peu ce qui se fait. » Recherche faite (les tableaux de bord de direction des outils de gestion de chantier et d’exploitation : une vue de pilotage qui se suffit à elle-même, qui résume et renvoie vers l’outil de travail) ; recommandation : **garder les quatre onglets** avec trois règles — confirmée (« oui »). Puis « suite » : maquette de Travaux, téléphone et ordinateur, Avant / Après, cadre réel — `docs/maquettes/maquette-pilotage-travaux-v1.html` — « go ».

### 590a. La décision du 17/11 (elle remplace celle du 13/11 pour le Pilotage)

- Travaux, L’équipe & le matériel, Décider et Conformité **restent** dans le Pilotage. Les cinq lots de déménagement (Travaux et Décider dans la Vigne, l’équipe au Planning, le matériel au Tracteur, Conformité au Phyto) sont **abandonnés** ; chaque onglet s’allège sur place.
- **① Le Pilotage montre et décide, les modules font** : un bouton « Ouvrir » par carte vers le module où l’on agit ; seules les micro-actions (une priorité, un objectif) se font dans le Pilotage.
- **② Les mêmes chiffres** : le Pilotage LIT les calculs des modules, il ne recalcule rien (la leçon de COHER-1, §581).
- **③ Un résumé, pas une copie** : environ cinq éléments par carte, la liste entière dans le module.
- Le reste du plan ne change pas (la Cave rangée, « Vous regardez » sur Économie et Archives seulement, l’Accueil de l’admin). Consigné au §28, « ★ RANGEMENT ADMIN » et « ★ MOINS DE TEXTE ».

### 590b. Travaux, carte par carte

| Carte | Avant | Après |
|---|---|---|
| **Le haut** | le sous-titre « Travaux — où en est-on, et quand aura-t-on fini » | la réponse : « **16 % fait**, fin prévue **25 nov.** » — la date de la fin prévue d’Aujourd’hui (`_pilMargeCalc`, la même), verte avant l’objectif, rouge après |
| **Le bandeau** | trois photos avec une icône, deux lignes de texte et « voir le détail › » ; au téléphone, elles défilaient, coupées | trois tuiles comme celles d’Aujourd’hui : le nom (et son point quand le chiffre attend une donnée), un chevron, le chiffre, une barre ou une pastille, deux ou trois mots. « Effectif : 0 pers. à trouver » → **« Renfort : 0 »** et la pastille « l’équipe suffit » ; « dépensés au 27 oct. · 159 k€ attendus » → **« sorti · prévu 159 k€ »** et sa barre. La phrase d’avant reste au survol (titre de la tuile). Au téléphone, les trois tiennent de front |
| **Avancement** (ex « Avancement par tâche ») | « Avancement de la saison », le nom de la campagne, le 16 % une deuxième fois, « réalisées · restantes · planifiées · terminées · en cours » | la barre, « 175 h fait · 948 h reste · 1 123 h prévu », la pastille « 3 en cours » ; une ligne par tâche avec la pastille de sa couleur ; **toucher une tâche** dit sa fenêtre prévue, ce que dit le journal, l’écart au départ (« départ 31 j plus tôt »), « sa fenêtre est passée » ; « Ouvrir les parcelles » |
| **La charge par tâche** | un titre qui changeait avec le bouton (« · restante », « · réalisée »…) ; la couleur d’une tâche suivait le RANG de sa part — elle changeait d’un bouton à l’autre | un titre fixe et son « i » ; « Reste · Fait · Prévu » ; **une couleur par tâche** |
| **Le temps de l’équipe** (replié) | « 4 574 h de présence », « 1 123 h de barème · 1,8 ETP vigne », un titre tronqué (« … · Après-vendange 2026-2027 ») | « 4 574 h », « de présence · 25 % dans les rangs ». Ouvert : la barre et trois lignes (« dans les rangs », « au tracteur », « cave, trajets, entretien… » — heures, part, personnes à temps plein) ; une ligne orange **« Le tracteur n’a pas de barème » + « Régler »** (les activités du Tracteur) au lieu d’une phrase de deux lignes ; la frise « Prévu et fait », « Personnes nécessaires par semaine », « Écart au prévu » en une ligne par tâche (le détail au toucher) ; « Ouvrir le planning » ; les trois boutons Frise · Semaines · Écart en bas. « Il faut 1,8 personne… en moyenne », « Une moyenne n’est pas un pic » : dans le « i », avec les chiffres du jour (fiche vivante) |
| **Échéances** (ex « Échéances par tâche ») | « fin de saison ~mer. 25 nov. · 20 j ouvrés · même calcul qu’Aujourd’hui — la campagne sans renfort, aux heures normales » ; « pôle long » | replié : « 3 tâches », « fin de la dernière : 21–27 nov. ». Ouvert : « Fin prévue : mer. 25 nov., dans 20 jours travaillés », une ligne par tâche (sa fin ; « la plus longue » en pastille ; % fait, heures, fenêtre, jours au toucher) ; la méthode dans le « i » |
| **Carte du domaine** | « 16 % » (le troisième de l’écran), « 8 parcelles · 7,02 ha » | « 8 parcelles », « 7,02 ha · colorées par avancement » (la vue choisie) ; « Ouvrir la carte » (Vigne › Carte) |

### 590c. Une couleur par tâche — et la barre garde son état

- Trois couleurs vivaient dans l’onglet : le donut (au rang de la part), la frise et l’écart (`_PIL_TASK_COL`, neuf tâches connues — les autres toutes brunes, Taille et Tirage confondus), les barres (l’état). **`_pilTCol(nom)`** : la place de la tâche dans la période consultée (`s.taches`), dans la palette du donut ; hors liste, une place fixe tirée du nom. `_taskColor` la lit (frise, écart, fenêtres de la roue) ; `_PIL_TASK_COL` est parti.
- ⚠️ **Écart avec la maquette** : la maquette peignait la barre d’une tâche à sa couleur. La barre garde la couleur d’**état** (KIT-1, §226 : « fini, en cours, en retard ») — c’est elle qui dit « en retard » ; la couleur de la tâche passe en **pastille devant le nom**. Le kit commun `_mvkAvancement` prend un 3e argument facultatif (`{col, dates}`) : l’Accueil, qui n’en passe pas, ne change pas d’un caractère (le harnais le vérifie) ; avec des dates, la ligne devient le `<summary>` d’un `<details>`, en `<span>` (6e argument de `_mvkLigne`) — un `<summary>` n’accepte que du texte en ligne.
- Dans la démo, l’ordre de la campagne est Palissage, Tirage, Taille : le Palissage est bordeaux, la Taille violette (la maquette, dessinée à la main, avait l’inverse).

### 590d. Comment c’est fait

- `_pilTabAvc(d, m)` : les cartes dans un cadre `.pil-tv` ; `m` = `_pilMargeCalc(d)`, calculé UNE fois par `_pilFillContent` pour la phrase (`_pilTvPhrase`, posée dans `#pil-souslig-t`) et pour `_pilPanelEcheances(d, m)`.
- Le bandeau : `_pilPhotoHtml(k, val, unite, vis, sous, cible, drapeau, quest, titre)` (l’icône est partie ; `vis` = `_pilPhBar` ou `_pilPhPl`) ; le point `_pilFlag` n’écrit plus « ! » (son nom est dans `aria-label` et au survol) ; avec une campagne zoomée, la deuxième tuile s’appelle « Équipe au pic » (le pic de cette campagne, « +N à prévoir » s’il manque du monde).
- « Ouvrir » : `_pilTvBtn` / `_pilTvGo` (`data-tvgo`) — `parcelles` (Vigne, onglet Liste : la Vigne garde son dernier onglet), `carte` (Vigne › Carte, `switchPTab`), `planning`, `tracbar` (→ `_pilGo('tracact')`, cible neuve : roue du Tracteur, bloc `set-sec-act-trac`).
- Les dates d’une tâche (`_pilTvDatesFn`) lisent les fenêtres de la frise (`cd.taskWindows`) et le journal (`_pilTaskReal`) — rien quand la portée regarde une autre campagne que celle des pourcentages.
- Les fiches neuves : `pil.avc.avancement`, `pil.avc.charge`, `pil.avc.frise`, `pil.avc.courbe`, `pil.avc.echeances` ; `pil.avc.temps` devient vivante (les chiffres du jour devant la méthode, comme `pil.eco.fin`) ; `pil.carte` dit son nouveau chiffre.
- **Feuille neuve `src/pilotage.css`**, importée après `aujourdhui.css` : les onglets du Pilotage allégés sur place y vivront (styles.css est au plafond). Le bloc GABARIT-1 de styles.css pose bordures, fond et marges des photos en `!important` et les empilait au téléphone : la feuille le reprend au même niveau, plus précise (`.pil-tv-tu`).
- COH-1 tenu : sous 0,05 personne, la part en personnes ne s’écrit pas (« 0,0 pers. »).

### 590e. Le bandeau compte l’exercice, les cartes la campagne

En haut, « 1 869 h prévu sur l’exercice » (ce que dit « Vous regardez ») ; dessous, 1 123 h (la campagne). Ce lot ne change pas ce comportement — il écrit seulement « sur l’exercice » sous le chiffre. **À régler avec le lot « Vous regardez »**, proposé juste après (noté au §28).

### 590f. Mesuré (build, démo au 27/10)

| | Avant | Après |
|---|---|---|
| Mots de Travaux (`npm run test:mots`) — téléphone | 104 | **65** |
| … ordinateur | 113 | **65** |
| Mots hors lexique | 16 | 2 (« Avancement », le titre validé sur la maquette, et « colorées par avancement » — le lexique dit « fait ») |
| Phrases de 15 mots et plus | 1 | 0 |
| Mots avant le premier grand chiffre — téléphone / ordinateur | 11 / 11 | 7 / 0 |
| Hauteur de la page — téléphone (390 px) | 1 739 px (2,1 écrans) | 1 598 px (1,9 écran) |
| … ordinateur (1 366 px) | 979 px | 943 px |

La maquette promettait 1,6 écran au téléphone : les zones de toucher de 44 px et les marges réelles des cartes.

Gestes rejoués à l’écran (téléphone et ordinateur) : une tâche se déplie et dit ses dates ; « N-1 » (« Aucune saison comparable archivée… ») ; « Fait » / « Prévu » / « Reste » (la même couleur pour chaque tâche, le titre fixe) ; « Ouvrir les parcelles » (Vigne › Liste), « Ouvrir la carte » (Vigne › Carte), « Ouvrir le planning », « Régler » (la roue du Tracteur, bloc des activités) ; le bouton « Frise » cache et rend la frise ; le point d’une tuile ouvre « à compléter » ; le « i » de « La charge par tâche ».

### 590g. Leçons

- ⚠️ **Les outils d’écriture décodent les séquences d’échappement** (`\u00a0` écrit dans un fichier devient le caractère) : c’est par là que des espaces brutes entraient dans le source (§589g). Méthode du lot : écrire deux barres obliques dans le code neuf, puis un script les ramène à une et remet en séquence les espaces brutes des seules lignes neuves ; comparer le compte d’espaces brutes à `HEAD` avant de livrer.
- ⚠️ **Une règle `!important` d’un autre lot** (GABARIT-1) gagne sur une feuille neuve même plus précise : il faut la reprendre au même niveau, et le dire dans la feuille.
- ⚠️ **« ≈ » n’est pas dans la police de l’appli** (U+2248, hors du sous-ensemble d’Outfit — le cliquet SUBSET l’a vu : `pilotage.js` 27 → 29) : comme « ≥ » (§583c), il se dessine dans une police de repli. Échéances l’a perdu (« fin de la dernière : 21–27 nov. » — une fourchette dit déjà l’estimation ; « environ »). ★ Le lexique (§580c) le recommande pour une estimation : à trancher — l’ajouter au sous-ensemble de la police, ou écrire « environ ».
- ⚠️ **Une couleur « par tâche » ne doit pas écraser une couleur qui porte un sens** : la maquette mettait la couleur de la tâche sur la barre ; la barre disait l’état (le retard). La pastille devant le nom porte la tâche, la barre garde l’état.

**Harnais adaptés** : `pilrange3` (« Avancement », le titre fixe du donut), `kit1` et `chant1` (les signatures du kit commun), `coh1` (« 0,0 pers. » ne s’écrit pas), `pilrange2b` (la tuile Budget sans icône), `pil-coherence` (la source d’Échéances dans le « i »), `info` (`pil.avc.temps` devient vivante, comme `pil.eco.fin`), `pil1` et `gabarit1` (`.pil-gauge-lab` / `.pil-gauge-pct` partis : leurs règles mortes ont quitté `styles.css`, avec `.pil-gauge-top` et `.pil-photo .go`), `pilrange4a` (la ligne des cases de Travaux), `subset` (« ≈ »), `robustesse-pilotage` (le barème se lit au survol de la tuile), `pastilles` (`PLAFOND_MAIN` 40 → 39 : l’écart n’écrit plus ses pastilles sur place), `carte` (« voir le détail » est parti : la tuile est le bouton, un chevron le dit). **Nouveau** : `mots8` (38 assertions, 47 contre-épreuves).

**Les trois cliquets rendus, lancés en dernier** (§587) : `npm run test:mots` (référence regravée : Travaux 104 → 65, 113 → 65), `npm run test:ux`, `npm run test:gabarit` — verts (le cliquet du gabarit a vu un `<small>` à 10,8 px — le nom de la campagne dans « Où va le temps » — : sa taille est posée, 12 px).

**NON vérifié** : un vrai téléphone ; le thème sombre ; une campagne zoomée dans « Vous regardez » (la tuile « Équipe au pic ») ; un domaine sans planning (le repli sur le rythme des quatre semaines) ; un domaine en surcharge (la ligne orange « Surcharge ») ; la carte Leaflet (les tuiles du fond ne se chargent pas hors ligne ici). **Reste à faire** dans « ★ MOINS DE TEXTE » : L’équipe & le matériel, Décider, Conformité sur place ; le lot « Vous regardez » (590e) ; la suite du plan (§28).

## 591. ★★★ PORTEE-1 — « VOUS REGARDEZ » NE RESTE QUE LÀ OÙ IL CHANGE L’ÉCRAN : LA CAMPAGNE SE CHOISIT À LA PASTILLE (18/11 — `src/pilotage.js` · `src/cockpit-vue.js` · `src/app.js` · `src/pilotage.css` · `src/utils.js` · `src/whats-new.js` · `index.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-portee1.mjs`)

**La demande.** « suite » après MOTS-8 : le lot suivant du plan (§28, « ★ RANGEMENT ADMIN ») — « Vous regardez » sur Économie et Archives seulement, et le désaccord laissé ouvert au §590e (le bandeau de Travaux comptait l’exercice, les cartes la campagne). Maquette d’abord, en captures de l’appli et du prototype qui tourne : `docs/maquettes/maquette-vous-regardez-v1.html` (neuf vues, téléphone et ordinateur, Avant / Après). Nico (18/11) : « Go » — les quatre choix recommandés.

### 591a. Mesuré avant de proposer (démo au 27/10, chaque onglet lu dans les trois positions, puis une campagne passée)

| Onglet | Ce que « Vous regardez » changeait |
|---|---|
| Aujourd’hui, Décider, Archives | rien |
| Travaux | le bandeau (l’exercice : 1 869 h « prévu sur l’exercice », 58 k€ sortis) et « Le temps de l’équipe » — au-dessus d’un Avancement de la campagne (1 123 h) |
| L’équipe & le matériel | la carte Capacité |
| Économie | les mots « exercice ↔ année vigne » (Le détail lit l’année) |
| Conformité | un avertissement, sur « La campagne » |

Et « La campagne » doublait le choix de la campagne de toute l’appli (la pastille de la Vigne). Une campagne passée consultée (Printemps 2026, close le 23/10) : la pastille restait verte, « Vous regardez » disait « Exercice 2026–2027 · 88ᵉ jour », Travaux annonçait « 0 % fait, fin prévue 14 déc. », Aujourd’hui « 35 jours de retard, 154 934 € au-dessus du budget, coût à la fin 187 743 € ».

### 591b. Ce qui change

- **Une seule question : quelle campagne ?** La pastille du haut du Pilotage devient un bouton (`data-pilsaison`, `aria-haspopup`) qui ouvre **le menu de la Vigne**, ancré sous elle (`_seasonMenuToggle(e, ancre)` dans `app.js` ; `_seasonMenuClose` relâche toutes les pastilles ouvertes). Le choix vaut pour tout le Pilotage et pour la Vigne (`_switchSaison`). Le menu tient en une ligne : « La campagne active s’ouvre par défaut. » (« saison » est hors du lexique, `index.html`).
- **La ligne d’écran** (`_pilCrumbHtml`) : sur **Économie › Le détail**, « Vous regardez » et le seul choix de l’**année** (l’exercice ou l’année vigne, ‹ › — `_pilCrumbAnnee`) ; sur **Travaux, L’équipe & le matériel, Décider**, la campagne, ses dates et le jour (`_pilCrumbCampagne`, `_pilPorteeJour` ; au téléphone, le jour seul) ; ailleurs, rien. Archives n’a pas de ligne : elle ne lisait rien de la barre (mesuré).
- **Le bandeau de Travaux** : deux tuiles de la **campagne** — « Équipe au pic » (`_pilPicPortee(_pilSaisonNom())`, la définition unique du pic ; « l’équipe suffit », « +N à prévoir » ou « pic passé ») et « Budget » (l’engagé face au budget, `_pecData`, les chiffres de la tuile Budget d’Aujourd’hui). La tuile « Travaux » part : ses heures sont dans la phrase et dans Avancement (choix 1 de la maquette). Les chiffres de l’**année** restent là où l’année est le sujet : le renfort dans Personnel, le budget dans Économie.
- **Une campagne passée** : la pastille passe à l’ambre (`.consult`, « · consultée » ; au téléphone le nom seul, et la ligne dit « consultée · terminée le 23 oct. »). Travaux dit « 0 % fait, campagne terminée le 23 oct. » (`_pilTvPhrase`). Aujourd’hui en fait le bilan (choix 2) : « Campagne terminée le 23 oct., 122 125 € au-dessus du budget », repères « fait · engagé · budget » (`majResume`) ; la carte de fin dit « Fin de la campagne · 23 oct. · 0 % fait · Terminée », sans frise, objectif ni « Simuler un renfort » (`majVerdict`, `.ck-v-finie`). ★ « Finie » se lit sur la **fin de la campagne** (`_pilCk2Per` : `fin`, `finie`), jamais sur l’objectif, que l’administrateur déplace. « terminée » au féminin pour une campagne (`_pilPorteeBornes(d0,d1,1)`).
- **« ≈ » quitte le Pilotage** (choix 4, hors de la police — §590g) : « environ » (les trajets, « Il manque environ… ») ; rien sur les bouteilles, dont l’étiquette dit déjà « probable ». « Avancement » reste (choix 4).

### 591c. Ce qui part (mesuré : personne d’autre ne le lisait)

Le **zoom par campagne** et tout ce qui le servait : « La campagne » dans la barre, sa campagne par défaut (`_pilPorteeCampDefaut`, `_pilPorteePeriodes`, `_pilPorteePeriode`), sa liste (`_pilPorteePopHtml`, `#pil-ptpop`), la frise et ses puces (`_pilAnFriseCadre`, `data-etpc`, et leur CSS `.pil-anfr*`, `.pil-anchip*`, `.pil-ptbtn`, `.pil-ptcamp`), l’alias `window._PIL_ETPSEL` (une seule occurrence dans le paquet construit : sa définition), l’avertissement de la Conformité (`_pilAvertCfm`, `_pilCadreAvert`), les photos de l’année (`_pilPhotosData`, `_pilPhotoEffAn`, `_pilPhotoBudAn`) et leur mémo (`_pilExoData`, que le preflight a trouvé sans appelant). `_PIL_SCOPE.camp` reste dans l’état mais ne se pose plus : `_pilScopeLoad` oublie une campagne mémorisée par une version d’avant ; ses lectures valent `null` et retombent sur le cadre de l’année. `pilotage.js` : 983 647 → 967 928 octets.

### 591d. Mesuré après (build, démo au 27/10)

- `npm run test:mots` vert ; référence regravée (Décider 377 → 378 mots : sa ligne de la campagne) ; les autres écrans ne bougent pas au compte du cliquet.
- Prototype rejoué à l’écran, téléphone et ordinateur : la pastille ouvre le menu sous elle ; Printemps 2026 choisi → pastille ambrée, ligne, phrase et carte de fin en bilan ; aucune erreur de page.
- Captures de la démo regravées (la pastille et la ligne d’écran changent) : `r-ger-pilotage`, `r-ger-echeances`, `r-ger-renfort`, `r-ger-cout`, `r-ger-conformite`, `pilotage-auj-pc`, `cout-pc`, `renfort-pc`, `pilotage-auj-apres-pc` (et leurs vignettes).
- Cliquets regravés, pour des raisons écrites : **TYPO** (`cockpit-vue.js` 181 → 191 ko, au-delà des +5 % — la référence datait de TETE-4C, les lots MOTS l’avaient déjà fait monter à 189 ; loin du plafond de 1 024 ko, pas de découpage) ; **CONTRASTE** (1 033 → 1 030 paires : les règles de la liste et des puces sont parties avec elles).

### 591e. Harnais

`scripts/mv-harnais-portee1.mjs` (25 assertions, 36 contre-épreuves) : la pastille et son menu ancré ; la ligne d’écran jouée sur les huit vues ; la ligne de la campagne et sa forme consultée ; « Vous regardez » sans campagne ; la campagne mémorisée oubliée, le cadre gardé ; le bandeau joué (deux tuiles, le pic de LA campagne, « +N à prévoir ») ; la phrase et la tête du cockpit sur une campagne finie ; la carte de fin ; l’ambre ; ce qui est parti ; « ≈ » ; l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `pilrange2a` (la barre ne choisit plus que l’année ; la liste et la campagne par défaut parties), `tete4c` (le bouton du téléphone dit l’année ; plus de liste), `annee` (le budget et le renfort de l’année se lisent dans leurs cartes), `pil-coherence` (plus de photo de l’année à prorater), `mots8` (la forme de la tuile reste ; le bandeau de l’année est remplacé), `mots2` (l’avis de Conformité est parti), `pilrange2b` (la tuile Budget de la campagne mène à Économie), `pilrange3` (« La campagne » à la pastille et sur la ligne), `pilrange4b` (le guide), `autete1` (« meme » ne se pose plus ; la fin de la campagne dite ; l’aide dit le bilan au lieu de l’exception d’Aujourd’hui), `etats1` (l’aide), `robustesse-pilotage` (le barème se lit dans la phrase). ★ `fenetre2` rougissait **sur le code publié aussi**, selon la date du jour : sa prévision d’essai mettait l’air sec de 9 h à 16 h le 2ᵉ jour ; fin novembre le soleil se couche vers 16 h 50 et il ne restait aucun créneau — l’air sec passe à 11 h-14 h, la règle jouée ne change pas.

### 591f. Restes, à leur lot

- « ≈ » reste dans la Cave, le Cuvier et la Réserve (13 au compte du cliquet SUBSET) : au lot de la Cave rangée.
- « ᵉ » (U+1D49) est hors de la police lui aussi (dette du cliquet SUBSET, d’avant ce lot) : « 4ᵉ jour sur 128 » le dessine dans une police de repli, comme la barre avant elle.
- L’avertissement du Paramétrage « Vous regardez X… » (`_zoomAilleurs`) ne peut plus s’allumer (la campagne zoomée n’existe plus) : à retirer au lot qui touche le Paramétrage.
- **Vu en passant** : sur la démo, ouvrir Conformité met une écriture de la configuration du domaine en attente quelques secondes plus tard — **aussi sur le code publié** (mesuré). Ouvrir un onglet ne devrait rien écrire : à chercher à part.

### 591g. Leçons

- ⚠️ **La pastille du Pilotage ne montrait pas la consultation** : depuis TETE-4C, `body .mod-header .hv2-saison-pill` la repeint en gris avec `!important` ; la marque `.consult` ne gagnait pas. Il faut la reprendre au même niveau (`pilotage.css`).
- ⚠️ **Une campagne « finie » se lit sur SA fin**, pas sur l’objectif : le prototype comparait l’objectif à aujourd’hui ; un objectif avancé par l’administrateur aurait fait dire « terminée » à une campagne en cours.
- ⚠️ `index.html`, `app.js`, `CLAUDE.md` et le journal se modifient par l’outil d’édition (le garde de confidentialité refuse le shell sur eux) ; la version affichée se vérifie dans le navigateur (la page servie, comptée) — le cinquième affichage est `boot.js?v=`.

## 592. ★★★ MOTS-9 — PILOTAGE › L’ÉQUIPE & LE MATÉRIEL ALLÉGÉ SUR PLACE : LES MÊMES CARTES, MOINS DE MOTS (18/11 — `src/pilotage.js` · `src/pilotage.css` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `index.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-mots9.mjs`)

**La demande.** « suite » après PORTEE-1 : le lot suivant du plan (§28, « ★ RANGEMENT ADMIN », décision du 17/11) — L’équipe & le matériel reste dans le Pilotage et s’allège sur place, comme Travaux (§590). Maquette d’abord, en captures de l’appli et du prototype qui tourne : `docs/maquettes/maquette-equipe-materiel-v1.html` (téléphone et ordinateur, Avant / Après, chaque carte ouverte). Nico (18/11) : « Go avec tes recommandations. » — ① les trois grandes cartes du tracteur en **une** carte ; ② « Tracteurs » = le nombre de tracteurs, la révision la plus proche dessous, une révision dépassée dans la phrase du haut ; ③ « Renfort » et « Équipe au pic » gardés tous les deux, le renfort écrit son année.

### 592a. Mesuré avant de proposer (démo au 27/10, cliquet des mots sur le build)

- **254 mots au téléphone, 259 sur ordinateur** ; 3 phrases de 15 mots et plus ; 6 mots hors lexique (« actifs », « présences », « au champ », « à trouver », « pour finir »…). Hauteur : 2 976 px au téléphone, 2 132 px sur ordinateur.
- La section « **Pour finir les travaux tracteur en cours** » : trois grandes cartes ouvertes (les travaux, la révision, « Gasoil après les travaux »), chacune son grand titre-phrase. **« 255 L » s’écrivait trois fois** (la tuile Cuve GNR, le grand chiffre de « Gasoil après les travaux », son graphique).
- La **tension** : une carte ouverte en grand sous trois titres (« Tension de l’équipe — détail », « Les 14 derniers jours », « 14 derniers jours · … ») et une phrase de méthode.
- « Consommation mesurée » : un paragraphe de 36 mots à demeure quand rien n’est mesuré, et un tiret pour chiffre.

### 592b. Ce qui change

- **Une phrase en haut** (`_pilEqPhrase`, à la place du sous-titre, comme Travaux) : les présents du jour, la tension, la cuve sous le seuil, une révision dépassée — les mots et les nombres du cockpit (« 4/4 présents », « 2 personnes au seuil », « 1 au-delà du maximum »). Rien qui presse : la phrase s’arrête à l’équipe.
- **Toutes les cartes restent, repliées, à leur place** (`_pilTabEqu` remplace `_pilTabPrs` et `_pilTabMat`) ; chacune tient en un titre, un chiffre, une pastille ; le détail au toucher ; un bouton « Ouvrir » vers le module où l’on agit (`_pilTvBtn` → `_pilTvGo` : l’équipe, l’entretien et le renfort par les chemins de `_pilGo`, le tracteur et le planning par `goTo`).
  - **Personnel** : « Équipe » (le nombre ; la composition au toucher), « Présents » (« 4/4 » et « au complet » / « N absent(s) »), « Équipe au pic » (le nom, le chiffre et la pastille de la tuile de Travaux — `_pilPicPortee` ; au toucher, le disponible et le nécessaire sur **la même échelle**), « Tension » (`_pilPanelTension` : le chiffre du cockpit « N au seuil », la pastille « N au-delà du maximum », une ligne par personne au toucher), « Renfort » (son année écrite : « exercice 2026–2027 · jusqu’au 28 févr. »).
  - **Matériel** : « Tracteurs » (le nombre, « révision dans 18 h · New Holland » dessous), « Cuve GNR » (le niveau en chiffre, « sous le seuil » en pastille, **le seuil posé sur la barre** ; au toucher, la cascade « Après les travaux en cours », seulement quand un travail a des litres à compter), « Consommation » (le chiffre mesuré, ou le réglage — celui que prennent tous les calculs de carburant — avec sa pastille), « **Travaux tracteur en cours** » (`_pilPanelTrx` : « N en cours », « reste X h · Y L » ; au toucher, chaque travail et l’entretien qui tombe dedans, dont la pastille monte sur le chiffre quand elle n’est pas verte).
- **Les morceaux de l’ancienne section** sont calculés UNE fois (`_pilTrxParts`) pour la carte des travaux et la cuve : mêmes calculs qu’avant (`_pilGmTravaux`, `_pilGmRevision`, la cascade GNR-2). « 255 L » s’écrit une fois.
- **La méthode passe dans le « i »** : `pil.tens` (neuve — pas `pil.tension`, fiche de l’ancien Aujourd’hui retirée au §441 et épinglée absente par `pilrange1`), `pil.trxrev` fondue dans `pil.trx`, `pil.trxgnr` dans `pil.gnr`, le paragraphe de 36 mots dans `pil.conso`. Titres des fiches renommés comme leurs cartes. `MV_AIDE` : une ligne « L’équipe & le matériel se lit d’un coup d’œil ».
- Les cases « Afficher dans cet onglet » prennent les noms des cartes (mêmes clés : les choix mémorisés restent) ; tension, consommation et travaux arrivent repliés.

### 592c. Vu en route, corrigé dans le lot

- **« reste 0,0 h · 0 L »** pour un travail sans barème (la démo : un griffage lancé, sans barème) — la carte dit « 1 sans barème », jamais un zéro qu’on ne sait pas compter ; la révision de même (« 0,0 h en cours sur ce tracteur » → « 1 sans barème »).
- **La date de l’entretien** se perdait quand un travail l’atteignait (la pastille ne la disait pas) : elle reste sous la carte, sauf quand la pastille la dit déjà (`etatDate`).
- **Le pointillé du traitement conseillé** (TRAIT-CUVE §221) gardait ses lignes mais avait perdu leur raison : « En pointillé : » les parcelles à nu ou presque, la fenêtre, les heures sur le domaine et leur source (barème ou cadence mesurée) reviennent sous la cascade.

### 592d. Ce qui part (mesuré : personne d’autre ne le lisait)

`_pilTabPrs`, `_pilTabMat`, `_pilCardTension`, `_pilCkTracteur`, `_pilAnyShow` (le preflight l’a trouvée sans appelant) ; les fiches `pil.trxrev`, `pil.trxgnr` ; dans `styles.css`, la grille de l’ancien bloc (`.pil-trx`, `-cote1`, `-cote2`, `-paire`), `.pil-tension-det`, `.pil-trx-v`, `.pil-trx-vu`, `.pil-trx-axl`, `.pil-cso-msg` (1 040 380 → 1 038 586 octets). Le reste du style des cartes allégées vit dans `pilotage.css` (bloc MOTS-9, sous `.pil-eq`).

### 592e. Mesuré après (build, démo au 27/10)

- Cliquet des mots : **254 → 64 mots au téléphone, 259 → 64 sur ordinateur** ; phrases de 15 mots 3 → 0 ; hors lexique 6 → 0. ★ « Mots avant le premier grand chiffre » au téléphone **5 → 11** (la phrase du haut, validée sur la maquette ; sous l’objectif de 15) — hausse acceptée par écrit dans la référence ; sur ordinateur 11 → 0.
- Hauteur : **2 976 → 1 401 px** au téléphone, **2 132 → 918 px** sur ordinateur. Aucune erreur de page, chaque carte ouverte une à une (téléphone, ordinateur).

### 592f. Harnais

`scripts/mv-harnais-mots9.mjs` (26 assertions, 32 contre-épreuves) : l’ordre des cartes et les intertitres ; la phrase (les mots du cockpit, la cuve, la révision, « au-delà du maximum » plutôt que « au seuil ») ; chaque carte jouée (titre, chiffre, pastille, bouton) ; « 255 L » une fois ; le seuil sur la barre ; « reste 0,0 h » jamais ; les replis par défaut ; « Voir le détail » du cockpit déplie la tension ; ce qui est parti ; l’aide, le guide, l’annonce, le service worker, la maquette, la liste.

**Harnais adaptés** : `gnr2` (**réécrit** — la grille qu’il tenait est partie ; il tient ce qui reste de sa raison : la cascade garde sa barre sur le plus petit téléphone, la ligne d’un travail rétrécit, la grille morte ne revient pas), `gnr-mesure` (le rendu joué est celui des deux cartes ; la carte dit le sans-barème ; le pointillé dit pourquoi), `tension` (la carte repliée), `pilrange1` (`_pilTabEqu`), `pilrange2b`, `pilrange4a` (★ une ligne de `_PIL_PERSO_DEFS` doit finir par `]],` : un commentaire en bout de ligne la rendait invisible au harnais — il est passé au-dessus), `annee`, `mots3`, `mots8` (le mutant de l’aide visait la première phrase « « Ouvrir » mène au module… », désormais celle de L’équipe), `portee1` (la phrase « Il manque environ… » est partie ; les versions « au moins »), `compt1` (« révision dans »), `compt7` (la révision est un morceau de `_pilTrxParts` ; la date gardée), `pro1`.

### 592g. Restes, à leur lot

- « Équipe au pic » ouverte dit « Disponible 10 pers. » la semaine du pic, sur la démo où l’équipe compte 4 personnes : le même chiffre qu’avant le lot (`_pilDispoSem`, règle ②) — **pas vérifié** ici s’il est juste ; à regarder à part.
- Les restes du §591f ne bougent pas : « ≈ » de la Cave, l’avis `_zoomAilleurs` du Paramétrage, l’écriture de la configuration à l’ouverture de Conformité.

### 592h. Leçons

- ⚠️ **Une ligne de table « à cases » se lit à la regex** (`pilrange4a`) : un commentaire en bout de ligne la fait disparaître du harnais, et ses neuf clés passent pour des défauts orphelins. Le commentaire va au-dessus.
- ⚠️ **Rejouer la démo carte par carte**, ouverte : le zéro d’un travail sans barème ne se voit qu’ouvert, sur une donnée réelle — aucun harnais ne l’avait.
- ⚠️ **Une clé de fiche retirée reste retirée** : reprendre `pil.tension` pour une carte neuve aurait fait mentir l’épinglage du §441. Un nom neuf (`pil.tens`).

## 593. ★★★ DEBORD-1 — PLUS RIEN NE DÉBORDE : LA BULLE ROUGE DU PILOTAGE, VINGT AUTRES CORRECTIONS, ET UNE RÈGLE QUI REGARDE L’ÉCRAN (18/11 — `src/aujourdhui.css` · `src/styles.css` · `src/cave.js` · `src/cuvier.js` · `src/planning-annee.js` · `src/pilotage.js` · `src/reglages.js` · `index.html` · `scripts/mv-debord-rendu.mjs` · `.github/workflows/ci.yml` · `scripts/mv-harnais-debord1.mjs`)

**La demande.** Nico (18/11), avec le « suite » qui lance le lot suivant : « fais aussi une vérif des graphismes, exemple la bulle rouge de 2 cuves demandent… qui déborde, il ne faut plus voir ce genre de problème ». Correction, pas refonte : rien ne change de place, aucune maquette.

### 593a. Ce qui a été trouvé (la démo au 27/10, deux cuves passées à 31 °C pour faire naître l’alerte)

Aucun des 780 contrôles ne voyait la bulle : ils lisent les sources, ou mesurent des mots, des tailles, des contrastes — jamais une boîte qui sort d’une autre. Un relevé écrit pour l’occasion (les 46 écrans du cliquet des mots, à 360, 390, 412, 768, 1 024, 1 280, 1 366 et 1 440 px), puis chaque trouvaille **regardée** en capture :

| Où | Largeur | Le défaut |
|---|---|---|
| Pilotage › Aujourd’hui (les trois vues) | ≥ 1 280 | **la bulle rouge** « 2 cuves demandent un contrôle en cave » : `.alerte{background:…}` (le raccourci) remettait `background-clip` à `border-box` ; la pastille se peignait sous sa bordure transparente — la zone de toucher de MOTS-5B (§587), 16 px en bas, 8 de côté — et descendait sur la ligne « fin prévue · coût à la fin » |
| Cave (les 14 écrans) | 360 | la bande « ≈ 182 hL en cuve · 43 fûts · 7 à faire · 36 t rentrées » : « rentrées » sortait de la carte |
| Cave › Aujourd’hui | 1 024 – 1 366 | **le tableau des cuves et des cuvées** passait en cinq colonnes dès 1 024 px d’écran, dans une carte de ~410 px (1 280) à ~490 px (1 366) : « 1007 vers aujourd’hui jeu 29 », « il y a 2 j » et « 24 °C par jour » s’écrivaient les uns sur les autres ; les pastilles « Fermentation », « Macération · J8 », « Fait le 23 oct. » sortaient de leur colonne |
| Cave › Aujourd’hui, la semaine | 1 024 – 1 280 | les sept jours dans ~330 px : « lunmamejeuven », les gestes sur les numéros |
| Cave › Le Cuvier › Tournée | 360 – 390 | « Intervention groupée » sortait de l’écran, à droite de « Terminer la tournée » |
| Cave › Le Millésime › Ensemble | 360 | « Encore en cuve » posée sur « Charmes-Combotte » |
| Cave › Le Millésime › Courbes | 360 – 1 280 | le tableau de la densité coupé par sa carte, ses chiffres collés (« 1007 8,1 ») |
| Cave › Le Millésime › Cuvées | 360 | la fiche d’une cuvée sans aucune marge ; « 6× Neuf **&amp;middot;** 8× 2025 » en toutes lettres |
| Planning › Année | toutes | l’horaire « 7 h 00 → 15 h 00 » sortait de sa colonne ; au téléphone, les douze noms de mois se chevauchaient ; à 768, le « + » de la semaine type |
| Pilotage › Décider | 360 | « J3→J4 » coupé en un rectangle gris vide après « Champ de la Croix… » |
| Pilotage › Décider, la carte | toutes | **deux « Agrandir »** : celui des graphes (KIT-1) posé SUR « trajet ~ 4,1 km » |
| Tracteur › Entretien | 390 – 1 366 | la page garde 360 px à droite pour la fiche : en deux colonnes, celle de droite tombait à 106 px (1 024) et coupait « Relever », le crayon, « Ajouter » ; et quatre cartes sans aucune marge intérieure |
| Vigne › Journal | 1 024 | « Validé » sur « Ébourgeonnage » (le titre rétrécissait à 45 px) |
| Vigne › Parcelles › Stades | 1 024 | les onze stades d’une ligne sous la carte « Ce qui vient » |
| Vigne › Accueil | 1 024 | la pastille « Après-vendange 2026-2027 » sortait de sa carte |
| Réglages › Domaine | 360 – 412 | « Après-vendange 2026-2027 » coupé net dans la frise des campagnes |

### 593b. Les corrections — chacune à sa place, sans changer le dessin

- **La bulle** : `background-color` seule (`aujourdhui.css`). Une variante ne touche que la couleur.
- **Requêtes de conteneur** là où un composant vit dans une colonne étroite : le tableau des cuves et des cuvées (`#page-cave .caj-c{container-type:inline-size}`, `@container (min-width:640px)`), la semaine de la Cave (la même carte), les colonnes de contexte des courbes (`.pcrb-b`, au-dessous de 640 px). Ils suivaient la largeur de l’ÉCRAN ; leur carte, entre le sommaire et « À surveiller », en a deux fois moins.
- **L’Entretien du Tracteur** en deux colonnes à partir de 1 600 px seulement (la fiche garde ses 360 px) ; les cartes sans en-tête prennent la marge de la carte (`:not(:has(> .ent-resume-hd))`).
- **Passer à la ligne plutôt que sortir** : la ligne d’un jour du Planning (et ses colonnes à 300 et 240 px), les stades, l’en-tête d’une carte du Journal, la pastille de l’Accueil, les deux boutons de la tournée (« Intervention groupée » au plus 42 %), la ligne d’une cuvée du Millésime au téléphone (le nom a sa ligne).
- **Abréger plutôt que couper** : le nom d’une parcelle de Décider dans son `<span class="nmt">` (le badge reste entier), le nom d’une campagne de la frise (`…`, et le nom entier en bulle).
- Au téléphone, un nom de mois sur trois au Planning ; la bande de la Cave pose le mot sous le chiffre ; la fiche d’une cuvée a sa marge.
- La carte du trajet garde son seul « Agrandir » (`_mvGraphSuivre(…, { agrandir:false })`).
- `_caveTonneauxStr` joint par le caractère « · » (plus l’entité, que la fiche échappait) ; le nom d’une cuve n’est plus centré par un `align-self:center` pensé pour une autre grille.

### 593c. La règle — `npm run test:debord` (`scripts/mv-debord-rendu.mjs`)

- Les **46 écrans** du cliquet des mots (la liste est lue dans `mv-mots-rendu.mjs` : un écran ajouté là est regardé ici), à **sept largeurs** (360, 390, 412, 768, 1 024, 1 280, 1 366), horloge au 27/10 9 h, **deux cuves en alerte** (l’état qui fait naître la bulle : la démo seule n’en a pas). 322 relevés.
- Six sortes, cherchées dans la page active : ① un texte hors de sa boîte peinte, ou coupé net (sans « … ») par une boîte basse ; ② une boîte hors de la boîte qui la contient, ou de l’écran ; ③ un fond peint sous une bordure transparente ; ④ un texte recouvert par une boîte peinte (`elementFromPoint`, la page défilée) ; ⑤ deux textes l’un sur l’autre ; ⑥ un texte collé au bord d’une carte bordée. Ne comptent pas : un défilement horizontal voulu, une liste repliée qui coupe en bas, un texte en « … », une barre fixe au-dessus du contenu, une zone de toucher transparente.
- **Une règle, pas un cliquet** : un débordement rougit toujours. `-- --contre` pose un défaut de chaque sorte dans Pilotage › Aujourd’hui (6/6 trouvés). `-- --largeurs`, `-- --ecran` pour aller vite pendant un lot.
- Deux largeurs à la fois (`MV_DEBORD_PAR`, 2 par défaut) : un peu plus de cinq minutes dans le bac à sable (vingt en file). **Un job de la CI à part** (« Débordements — sept largeurs », 25 minutes au plus), pour ne pas peser sur les mesures.
- Le relevé final : **322 écrans, aucun débordement** ; 1 440 px regardé à part, propre.

### 593d. Harnais

`scripts/mv-harnais-debord1.mjs` (36 assertions, 37 contre-épreuves) : chacune des corrections sur le texte, avec l’ancien texte interdit quand il est connu (le raccourci `background:` sur une variante de la bulle, les deux colonnes de l’Entretien dès 1 024, le tableau des cuves sur l’écran, `minmax(230px…)`, `minmax(210px…)`) ; le branchement de la règle (ses six sortes, ses largeurs, l’état, npm, la CI) ; l’annonce, le service worker, la liste. **Harnais adaptés** : `tourcuv1` (les deux boutons de la tournée rétrécissent), `mots9` (les versions « au moins »). `cave1` a rougi : la règle de la frise du Planning (un `font-size:0`) avait été posée dans le bloc CAVE-1, « par jetons seulement » — elle est sortie du bloc.

### 593e. Restes, à leur lot

- La cellule « décuvée 26/10 » des courbes est en Cormorant (`.pcrb-sec`, `--font-titre`) au milieu de chiffres en Outfit : un choix de police, pas un débordement — au lot de la Cave rangée.
- Pas regardé par la règle : les fenêtres qui s’ouvrent par-dessus, la fiche d’une personne, le thème sombre, la vue de l’équipe, une largeur entre deux de la liste, 1 600 px et plus (l’Entretien en deux colonnes).
- La maquette de **Décider** (le lot MOTS suivant) n’est pas faite dans ce lot.

### 593f. Leçons

- ⚠️ **Le raccourci `background:` remet à zéro `background-clip`, `background-origin` et `background-size`.** Une variante qui ne change que la couleur s’écrit `background-color`. La zone de toucher par bordure transparente (MOTS-5B) n’est sûre que si AUCUNE règle ne réécrit `background:` sur l’élément.
- ⚠️ **Un composant ne connaît pas la largeur de sa colonne.** Une requête `@media (min-width:1024px)` dit « l’écran est large », pas « ma carte est large » : avec un sommaire à gauche et une colonne à droite, la carte du milieu fait 330 à 490 px. Pour un tableau, une semaine, des colonnes de contexte : `container-type:inline-size` sur la carte et `@container`.
- ⚠️ **1 024 px est la largeur où tout casse** (tablette couchée, petit portable) : la règle la joue toujours.
- ⚠️ Un relevé de l’écran se trompe facilement : la boîte d’un texte en « … » dépasse sa boîte (la plage ignore l’ellipse), une zone de toucher transparente répond à `elementFromPoint`, une liste repliée cache ses lignes exprès. Chaque exclusion de la règle a été vérifiée en capture.

## 594. ★★★ MOTS-10 — PILOTAGE › DÉCIDER ALLÉGÉ SUR PLACE : UNE PHRASE, TROIS CARTES REPLIÉES, LES SIMULATEURS ENTIERS (18/11 — `src/pilotage.js` · `src/pilotage.css` · `src/cockpit-vue.js` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `docs/maquettes/maquette-decider-v1.html` (neuve) · `scripts/mv-harnais-mots10.mjs` (neuf) · six harnais suivis · `scripts/mv-demo-captures.mjs` · deux captures de la démo du site · `scripts/mv-debord-rendu.mjs` · `scripts/mv-harnais-debord1.mjs`)

**La demande.** « suite » après DEBORD-1 : le lot suivant du plan (§28, « ★ RANGEMENT ADMIN », décision du 17/11) — Décider reste dans le Pilotage et s’allège sur place, comme Travaux (§590) et L’équipe & le matériel (§592). Maquette d’abord, en captures de l’appli et du prototype qui tourne : `docs/maquettes/maquette-decider-v1.html` (téléphone et ordinateur, Avant / Après, quatre vues : l’onglet, la tournée ouverte, Qui fait quoi, Renfort). Validée (« go », 18/11) avec ses trois recommandations : la tournée arrive repliée ; le Renfort ne change que par son en-tête (son intérieur suit la maquette Renfort v1 du 17/11, cinq choix en attente) ; « Ouvrir la priorité du moment » sous Qui fait quoi.

### 594a. Mesuré avant de proposer (démo au 27/10, cliquet des mots sur le build)

- **377 mots à l’arrivée** (téléphone et ordinateur) ; deux phrases de 21 et 23 mots (« Les tris ci-dessus sont un essai… roue crantée de la Vigne », « Pour ranger : ⇅ prend la parcelle en main… Enregistrer la diffuse à l’équipe, dans Vigne ») ; cinq mots hors lexique (« pour finir » ×2, « au champ » ×2, « trajet ~ 4,1 km »). Hauteur : **3 239 px au téléphone (3,8 écrans)**, 1 948 px sur ordinateur — la tournée arrivait **ouverte** (DZ-1 §162), Qui fait quoi et le Renfort repliés tout en bas.
- **Des redites** : « 3 nov. » trois fois dans Qui fait quoi (l’en-tête, la ligne du travail, le bilan « travail fini ») ; « 6 jours pour finir → 3 nov. » puis « tient dans la fenêtre — fini le 3 nov., fenêtre jusqu’au 28 févr. (89 jours travaillés d’ici là) » ; « Aucune tournée pour ce travail » puis « Aucune tournée diffusée pour l’instant — l’équipe voit ses parcelles dans l’ordre habituel » (`_opDiffusHtml`, la carte héritée `ordre_passage_t`) ; « L’ordre actuel est déjà celui « au plus proche » » quand la pastille du tri le montrait déjà.
- **Une consigne fausse** : « Enregistrer la diffuse à l’équipe, dans Vigne » — il n’y a plus de bouton Enregistrer depuis TRN-1 (§330, la tournée se règle dans la roue crantée de la Vigne).
- Sous chaque case de « La journée de l’équipe », une ligne qui ne disait rien de plus que le chiffre (« planning de mardi · par personne », « planning · allonge la présence », « par déplacement · calculés sur les distances », « toute l’équipe au champ »).

### 594b. Ce qui change

- **Une phrase en haut** (`_pilDcPhrase`, à la place du sous-titre, comme Travaux et L’équipe) : « **Palissage : ce soir à La Combotte, fin prévue 3 nov., l’équipe suffit** » — le travail, où l’équipe sera le soir du jour choisi (« le 28 oct. à … » un autre jour), la fin prévue (rouge et « déborde » hors fenêtre, « ne finit pas »), le renfort (« l’équipe suffit », ou « N saisonniers à prévoir » en orange), « simulation » quand un essai est en cours. ★ **Règle ②** : elle lit les calculs des cartes (`_DZ_LAST`, `_DZ_REP_LAST`, `_RF_RES`) et n’en refait aucun ; elle se pose APRÈS les trois cartes (`_pilFillContent`) et suit les essais (`_pilDcPhraseMaj` au bout de `_pilSimRefresh`, où `_pilOpRefresh` finit aussi).
- **Les trois cartes arrivent repliées**, sous `.pil-tv.pil-dc` (la règle de Travaux) : « **La tournée du jour** » (« 6 jours · fin prévue 3 nov. » et la pastille tient / déborde / ne finit pas — aucune quand aucun travail coché n’a de fenêtre), « **Qui fait quoi** » (« 3 nov. fin prévue » et la même pastille ; « 4 présents le 27 oct. »), « **Renfort** » (« 0 » et « l’équipe suffit », ou « N saisonniers · coût » et « à prévoir » — les pastilles de L’équipe & le matériel ; « aux heures du planning, sans heures sup »). `ordrepassage:1` rejoint les replis par défaut : la clé n’a jamais été gravée chez les clients (`_pilNormalize` ne garde que les clés des défauts), le défaut s’applique dès le chargement, sans monter `_PIL_ST_V`.
- **Les simulateurs gardent tous leurs boutons** ; seuls leurs mots changent :
  - *La journée de l’équipe* : la ligne d’une case ne parle plus que d’une modification (« modifié — planning : 8 h ») ou de ce qui explique le chiffre (`_dzEqSrc` : affectée à la priorité, une équipe collective, les absents) ; vide, elle se tait (`.src:empty`). Le titre dit « lues au planning ».
  - *Le résultat* : « Ce soir » (ou « mer. 28 oct., le soir »), la parcelle, « reste 43 h · reprise le 28 oct. », trois chiffres en deux mots (« faits », « de travail », « de trajet ») ; « 6 jours fin prévue mar. 3 nov. » **reste ici, sous les réglages** : au téléphone, l’en-tête est loin quand on touche − ou +, et c’est elle qui répond. Le verdict qui tient devient une pastille (« tient · fenêtre jusqu’au 28 févr. ») ; celui qui déborde garde son encadré et ses boutons (« Il faudrait **+2 personnes** chaque jour »).
  - *Le rendement* : « Rendement » ; « déjà au plus proche » en pastille du titre ; « coût de la tournée », « à l’hectare ».
  - *L’ordre de passage* : une ligne, « Tournée de l’équipe : aucune » ou « « Hiver » · 12 oct. » (lue sur `_mvTourneeDe`, la seule qui fasse foi depuis TRN-1), avec « Créer / Modifier la tournée » ; « Ici, un essai : rien n’est enregistré. » ; la reprise d’une parcelle en une ligne ; « ⇅ prend une parcelle, une fente dorée la repose ; ⇅ bloc : toute une commune. » ; la carte dit « trajet environ 4,1 km » (« ≈ » est hors de la police de l’appli, PORTEE-1 §591 ; la maquette montrait « ≈ », corrigé au codage).
  - *Qui fait quoi* : plus de « À partir du … — même jour, même planning, mêmes trajets que la tournée » (le jour est dans l’en-tête, la méthode dans le « i ») ; « toute l’équipe » ; le bilan seulement pour plusieurs travaux ou un travail sans personne ; « Sans priorité : les 4 présents, à parts égales. » ; **« Ouvrir la priorité du moment »** (règle ① — `_pilTvGo('priorite')` → `_pilGo('priorite')` → `openPriorityEdit`, administrateur seulement).
- **Le « i »** : `pil.tournee` reçoit les deux consignes sorties de l’écran (l’essai et la roue crantée ; ⇅ et la fente dorée) ; « + ajoute une personne… » était déjà dans `pil.quifait`. `MV_AIDE` : « Décider se lit d’un coup d’œil ». La note de Paramétrage nommait encore « la courbe « Renfort : combien, et quand » » : « la carte « Renfort » ».

### 594c. Vu en route, corrigé dans le lot

- **« Simuler un renfort » menait à un Renfort replié.** Trois portes (la carte Fin prévue d’Aujourd’hui et « À savoir » — `choisirOnglet('sim')` dans `cockpit-vue.js` —, la carte Renfort de L’équipe — `_pilGo('renfort')`) arrivaient sur Décider, tournée ouverte, Renfort replié tout en bas. Mesuré après correction : la carte ouverte, en haut de l’écran (y = 103 px), depuis les deux onglets.
- **« Voir le détail » de la tension (MOTS-9) avait le même défaut** : `_PIL_STATE.collapsed.tension=0` puis `renderPilotage()` — qui **relit l’état mémorisé** : la carte repartait repliée (mesuré : ouverte = false depuis Aujourd’hui). `_pilDeplier(id)` ouvre ET enregistre, comme le geste du toucher ; la tension et le renfort s’en servent.
- **Avant le premier rendu du Pilotage** (la démo du site appelle `_pilGo('renfort')` juste après `goTo('pilotage')`), `_PIL_STATE` n’est pas encore lu : `_pilDeplier` le lit lui-même. Vu sur la capture de la démo, qui restait repliée.
- **La carte ouverte passait sous les barres collantes** sur ordinateur (`_pilFlash` centre ; la carte du renfort ouverte est plus haute que l’écran) : `_pilVersCarte` pose `scroll-margin-top` à la hauteur mesurée des barres (la mesure de `cockpit-vue.js/colleHaut`), puis clignote.
- **Les deux captures « renfort » de la démo du site** (`r-ger-renfort`, `renfort-pc`, l’étape « Faut-il embaucher ? ») montraient l’onglet replié : `scripts/mv-demo-captures.mjs` ouvre la carte comme « Simuler un renfort » (`_pilGo('renfort')`) ; captures et `public/demo.html` (les cadres de l’anneau) régénérés.
- `_opDiffusHtml`, `_opDateFr` (le preflight l’a trouvée sans appelant) et la règle `.pil-dz-dif` (styles.css) sont partis : personne d’autre ne les lisait.

### 594c bis. La règle des débordements rougissait sur la CI (« go (avant pb sur github) »)

- **Le constat** : le job « Débordements — sept largeurs » a rougi sur la PR Dependabot #450, qui ne changeait que trois versions d’actions dans `ci.yml`. Le journal (copié par Nico) : **une** trouvaille — « 390 px · Pilotage › Économie › Le détail de l’exercice · texte collé au bord (2 px) · div.pec-card · « 0 € » ».
- **Pas reproduit ici, puis compris** : la règle était verte chez Claude sur le code de `main` avec Chrome 153, avec le Chromium sans tête de Playwright (build 1243), avec les polices réduites à DejaVu, puis à celles que Playwright installe sur la CI (WenQuanYi en repli). Mesuré : ce « 0 € » est dans un **tableau qui défile de côté** (`.pec-scroll`, 695 px de contenu dans 304 px), colonne « À la clôture » — à **8 px** du bord ici, à 2 px sur la CI : la largeur des colonnes varie d’un Chromium à l’autre. Ce n’est pas un débordement : le bord touché est celui du défilement, la suite du tableau est derrière.
- **La correction** (la règle, pas l’écran) : la sorte ⑥ « texte collé au bord » saute un texte qui a, entre lui et sa carte, un défilement horizontal qui déborde (`scrollWidth > clientWidth`). Une **contre-épreuve inverse** le tient : un tableau qui défile de côté, texte au ras du bord, posé avec les six défauts — il ne doit PAS être trouvé (sans la correction : rouge ; avec : vert).
- **Pour la prochaine fois** : sur la CI, chaque trouvaille devient une **annotation** (les dix premières, visibles sur la page du run) et un **tableau dans le résumé du job** ; la règle dit avec quel Chromium elle a mesuré.

### 594d. Mesuré après (build, démo au 27/10)

- Cliquet des mots : **377 → 45 mots** (téléphone et ordinateur) ; phrases de 15 mots et plus 2 → 0 ; hors lexique 5 → 0 ; mots avant le premier grand chiffre 16 → 14 au téléphone, 16 → 0 sur ordinateur.
- Hauteur : **3 239 → 844 px** au téléphone (3,8 écrans → 1), **1 948 → 918 px** sur ordinateur. La tournée ouverte : 365 → 259 mots, 2 652 → 2 358 px au téléphone (un outil : ses boutons restent ; le gros est la liste jour par jour et la carte). Qui fait quoi ouvert : 75 → 36 mots.
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : ouvrir la tournée (la carte se dessine), + sur Travail (la phrase finit par « simulation », la case dit « modifié — planning : 8 h »), « Valeurs réelles », jour suivant (« le 28 oct. à La Combotte, fin prévue 4 nov. »), + dans Qui fait quoi, « Ouvrir la priorité du moment » (la feuille « Priorité du moment » s’ouvre).

### 594e. Harnais

`scripts/mv-harnais-mots10.mjs` (28 assertions, 33 contre-épreuves) : l’onglet et son repli ; la phrase jouée (le soir, un autre jour, la fin qui déborde en rouge, le renfort en orange, « simulation », la tournée masquée, rien à dire) et sa source (aucun calcul de plus) ; les trois en-têtes joués ; les corps (les cases, le résultat, la pastille du rendement, la ligne de la tournée, la liste, Qui fait quoi et son bouton) ; les replis et `_pilDeplier` ; le cockpit ; le lexique ; le « i » ; l’aide, le guide, l’annonce, les versions, la maquette, la liste.

`debord1` : une ligne de plus (le défilement de côté), 37 assertions, 38 contre-épreuves. `npm run test:debord -- --contre` : six défauts trouvés, la contre-épreuve inverse verte.

**Harnais adaptés** : `tournee-rdt` (la pastille « déjà au plus proche » au lieu de la phrase ; `_pilPhPl` dans son bac à sable), `pro1` et `mots9` (la tension se déplie par `_pilDeplier`), `mots8` et `mots9` (la sous-ligne porte aussi la phrase de Décider), `annee` (`_pilTvGo` sait aussi `priorite`).

### 594f. Restes, à leur lot

- **Le Renfort, dedans** : la maquette Renfort v1 (17/11) attend ses cinq choix. Vu en passant : sous son graphique, « oct. » et « nov. » se chevauchent (« octnov. ») — le nouveau graphique les remplace ; la règle des débordements ne regarde pas les étiquettes d’un SVG.
- Non vu à l’écran (la démo tient) : la phrase et les pastilles quand un travail déborde, ou quand la tournée n’a plus rien (« Palissage : rien à faire ») — joués par le harnais seulement.
- Les restes du §592g ne bougent pas.

### 594g. Leçons

- ⚠️ **`renderPilotage()` relit l’état mémorisé.** Écrire `_PIL_STATE.collapsed[id]=0` avant de changer d’onglet ne sert à rien : il faut l’enregistrer (`_pilDeplier`). Le harnais du §592 tenait le texte de la ligne, pas son effet — c’est en jouant le bouton qu’on l’a vu.
- ⚠️ **Dans un simulateur, la réponse reste près des boutons.** L’en-tête de la carte dit la fin prévue ; le résultat la redit sous les réglages, parce qu’au téléphone l’en-tête est à 800 px quand on touche − ou +. Une redite qui sert n’est pas une redite.
- ⚠️ **Le lexique du §28 disait encore « ≈ » pour une estimation** ; PORTEE-1 (§591) l’a sorti du Pilotage — U+2248 n’est pas dans la police de l’appli. La maquette l’a montré, `portee1` l’a refusé dans la chaîne : « environ ». La ligne du lexique est corrigée.
- ⚠️ **Une capture « pleine page » cache ce qui colle** : le script qui masquait les barres du bas (position fixe ou collante) masquait aussi les en-têtes de jour de la tournée — on croyait la liste sans jours. Ne masquer que le fixe.

## 595. ★★★ FRAIS-1 — PLANNING › LES FRAIS À REMBOURSER : TICKETS, CARTE BANCAIRE ET INDEMNITÉS KM, ENVOYÉS AVEC LA PAIE (18/11 — `src/planning-frais.js` (neuf) · `src/frais.css` (neuve) · `src/planning.js` · `src/app.js` · `src/firebase.js` · `src/utils.js` · `src/whats-new.js` · `src/tutos.js` · `index.html` · `storage.rules` · `public/sw.js` · `guide/10-planning.html` · `docs/maquettes/maquette-frais-v2.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-frais1.mjs` (neuf) · `scripts/mv-harnais-ajour1.mjs` · `scripts/mv-harnais-info.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `public/demo.html` · `public/demo/fiche-jean.webp`)

**La demande.** Nico (18/11) : « au niveau de l’équipe planning, une case frais personnels à rembourser » — les tickets et paiements par carte avancés pour le domaine, avec leur motif, envoyés à la compta en même temps que la paie ; et les forfaits kilométriques d’un déplacement avec le véhicule personnel, justes selon la puissance et les kilomètres en plus ; recherches sur Internet, puis maquette. Précisé : **l’admin seul saisit et valide**. Sur la v1 (trajets en étapes A → B, domicile déduit), Nico : « fais juste le nombre de kilomètres parcourus pour un trajet professionnel […] la justification […] pas d’étapes […] On marque juste le nombre de kilomètres supplémentaires parcourus. Point. » Maquette v2 (`docs/maquettes/maquette-frais-v2.html`) : « parfait (on suit les recommandations) ». Puis « Tu peux pas faire les trois lots en même temps ? » : un seul lot.

### 595a. Recherché avant la maquette (et ce qu’on n’a pas pu vérifier)

- **Le barème fiscal kilométrique** publié le **9 avril 2026** pour les revenus 2025 (le tableau de l’arrêté du 27/03/2023, inchangé) : d ≤ 5 000 km → d × a ; 5 001 à 20 000 → d × b + c ; au-delà → d × e ; de 3 CV et moins à 7 CV et plus. **100 % électrique : + 20 %** (le tableau `e` de `FRAIS_BAREME`). Hybride : le barème des voitures thermiques.
- **URSSAF** : les indemnités sont exonérées dans la limite du barème ; au-delà, l’excédent entre dans l’assiette des cotisations, sauf si l’employeur prouve les frais réels. Le trajet domicile – travail n’est pas indemnisé, sauf contrainte. Garder les justificatifs et la carte grise (au nom du salarié ou de son foyer).
- **PLF 2027** : un plancher de + 10 % du barème pour les revenus 2026, adopté en première lecture le 15/10/2026, **pas définitif**, et hors 100 % électrique — **non intégré**, à surveiller (§595f).
- **Accords territoriaux** : certains fixent leur propre taux (exemple trouvé : 0,53 €/km, CUMA de la Mayenne). **Rien de vérifié pour la Côte-d’Or** : d’où le « taux du domaine », facultatif, dans la roue.

### 595b. Ce qui change

- **Planning › Personnel › la fiche d’un salarié : un cinquième onglet « Frais »** (`_pfFrais`, `src/planning-frais.js`). En haut une phrase : « **87,42 €** à rembourser avec la paie de novembre » (ou « Novembre figé : 87,42 € partis avec la paie »), la pastille « 1 ticket manquant », deux tuiles (Tickets, Km), « + Ticket », « + Trajet », la liste du mois, les cartes « Sa voiture » et « Km payés en 2026 » (le palier, le taux du km suivant, un « i » `plan.frais.km`).
- **Un ticket** : le montant, la date, pour quoi (achat pour le domaine, carburant d’un engin, péage et parking, repas, hébergement, autre — le carburant de sa propre voiture passe par les km), le motif, payé avec sa carte ou en espèces, la TVA si elle est indiquée, la photo (réduite comme celle d’un signalement, `_mvPhotoReduire`). Sans photo : « ticket manquant », sur le volet, dans la compta et sur le relevé.
- **Un trajet** : les km faits **en plus** de son trajet habituel, et « Où et pourquoi ». Rien d’autre — pas d’étapes, pas de domicile (décision de Nico). L’aperçu du montant se calcule pendant la saisie, au palier de l’année.
- **Sa voiture** (demandée avant le premier trajet) : modèle facultatif, puissance (case P.6 de la carte grise), énergie, carte grise au nom du salarié ou de son foyer, et sa photo.
- **Le calcul** : chaque trajet vaut `barème(km de l’année avant lui + ses km) − barème(km de l’année avant lui)`, dans l’ordre de saisie, sur l’année civile du mois de paie (`_fraisCalcAnnee`). La somme des trajets de l’année est donc **exactement** le barème des km de l’année : le changement de palier se répartit tout seul. Un mois figé garde ses montants (`fige.frais.mt`). Le **taux du domaine** (`CONFIG.frais_km`, 0 < taux < 5 €/km) remplace le barème par km × taux ; au-dessus du barème, la roue prévient (l’excédent est cotisé).
- **Le mois** : un frais part avec la paie du mois affiché dans la fiche ; si ce mois est figé, avec le premier mois suivant qui ne l’est pas (`_fraisMoisCible`). Les lignes d’un mois figé sont verrouillées (une ligne simple, pas un bouton).
- **Résumé › « Pour la compta »** : un bloc « Remboursements, hors salaire » — Frais avancés (« 3 tickets, joints au relevé · 2 manquants »), Indemnités km (« 84 km · 5 CV essence · barème fiscal »), À rembourser.
- **Figer** fige aussi les frais (`_fraisInstantane` → `fige.frais` : tickets, km, total, km de l’année, nombre, montant de chaque trajet) ; la phrase de Figer dit « payé, retenu et remboursé ».
- **Le relevé** : une page 3 « Les frais à rembourser » — tickets et paiements, indemnités kilométriques, la voiture et le barème lu, le total, les justificatifs (photos ou « ticket manquant ») ; le cadre papier de la page 1 l’annonce.
- **La roue du Planning** : « Barème fiscal » (par défaut, sa date de publication dite) ou « Taux du domaine ».
- **Supprimer un frais se répare** (ANNULER-1, §471) : le geste part tout de suite, « Annuler » remet la ligne à sa place ; sa photo ne s’efface du serveur qu’après le toast (8 s), et seulement si la ligne n’est pas revenue.
- **Les données** : `PLANNING_HSUP[nom].frais = { voiture, lignes }` — dans `planning_hsup`, déjà lu par l’admin seul (MOTIFS-1, §250) : **aucune clé Firestore nouvelle, aucune règle Firestore changée**. Vérifié avant : aucun code ne parcourt les clés de `PLANNING_HSUP[nom]` comme des mois ; le renommage d’un salarié déplace l’objet entier. **Les photos** : `tenants/<domaine>/frais/<id>.jpg` (`fbFraisPhoto`, `fbFraisPhotoSuppr`, `firebase.js`) — `storage.rules` : l’admin du domaine lit, dépose et supprime ; une image d’1 Mo au plus ; pas de modification ; jamais le compte de démo. En démo, la photo reste « jointe » sans fichier (`{demo:1}`).
- **La démo** : Jean a quatre frais dans le mois de la démo (deux trajets de 24 km, un ticket de 38,90 € avec sa photo, un repas de 18 € sans) ; la capture « fiche-jean » de la démo du site est refaite (`mv-demo-captures.mjs --ecrans fiche-jean` : « Pour la compta » y montre maintenant « Remboursements, hors salaire »), et sa scène dit « frais à rembourser ».
- **Le tuto** « Comment faire pour noter un frais à rembourser ? » (10 étapes : Personnel, Jean, Frais, Ticket, 18,50, Repas, le motif, Ajouter, la phrase) ; quatre gestes exemptés avec leur raison (fermer, la photo, supprimer, le taux).
- `MV_AIDE.planning` (cinq onglets, « Les frais à rembourser »), `MV_INFO['plan.frais.km']`, `guide/10-planning.html`, l’annonce 11.23 (admin).

### 595c. Vu en route, corrigé dans le lot

- **v1 → v2 du modèle de trajet** : l’exemple de Nico (domicile Nuits-Saint-Georges, travail Gevrey, labo à Beaune) donnait 0 km avec la déduction du trajet habituel. La v2 ne déduit rien : on tape les km en plus.
- **L’arrondi** : arrondir chaque barème avant la différence donnait 14,00 € au lieu de 13,99 € (le 3ᵉ trajet de la maquette). On arrondit la différence.
- **C24b** (`harnais-sec7 --contre`) : des variables dans les `onclick` des lignes et des choix. Passés en `data-*` lus par `this.dataset`.
- **Sur ordinateur, la liste tenait en une lettre de large** : la fiche est une colonne d’environ 420 px à droite de la liste des salariés, et la grille du volet suivait la largeur de l’écran (`@media`). Elle suit maintenant **la largeur du volet** (`.frs{container-type:inline-size}`, `@container`).
- **Le relevé** disait « photo jointe » en orange, comme « ticket manquant » : gris, trait plein.
- **Supprimer** partait sans retour : « Annuler » (ci-dessus).

### 595d. Mesuré (build, dans le navigateur)

- Joué dans l’appli construite, entrée par la démo (téléphone 390 × 844, ordinateur 1366 × 900, clair et sombre), sans erreur de page : le volet de Jean (**87,42 €** = 56,90 € de tickets + 30,52 € pour 48 km) ; + Ticket 24,90 € « Repas » → la pastille passe à 2 manquants ; + Trajet 36 km → **22,90 €** (palier 1, 0,636 €/km), total **135,22 €** ; Résumé › « Pour la compta » (81,80 €, 53,42 €, 135,22 €) ; le relevé (3 pages, la page 3 lue) ; la roue ; **Figer** → `fige.frais` = 56,90 / 30,52 / 87,42, 48 km, les deux trajets à 15,26 € ; un ticket saisi ensuite part en **décembre** (« part avec la paie de décembre ») ; une ligne figée ne s’ouvre pas ; taux du domaine 0,50 → 24,00 € pour 48 km, retour au barème → 30,52 €.
- Le tuto `frais` : 10/10 étapes au téléphone, sur ordinateur, au panneau et au miroir ; le côte à côte et le vieux boot.js verts.

### 595e. Harnais

`scripts/mv-harnais-frais1.mjs` (24 assertions, 19 contre-épreuves) : le barème publié, l’électrique, la maquette (Marie : 15,26 / 15,26 / 13,99 €, cumul 456 km ; Arthur 96,07 €), la somme des trajets = le barème de l’année, l’année qui repart, le taux du domaine, les totaux du mois et le ticket manquant, le mois figé et ses montants, le mois cible, l’instantané de Figer, la compta, le relevé, la robustesse et l’échappement, supprimer puis Annuler (la photo attend le toast), le branchement (index, planning, app, storage.rules, AJOUR-1, aide, « i », guide, annonce, sw, maquette, liste). `ajour1` : `ovPlanFrais` est un FORMULAIRE. `info` : son corpus lit `planning-frais.js` (sinon la fiche `plan.frais.km` passait pour orpheline — la règle d’AXE-1 : une surface qui pose une pastille entre dans le corpus). `onglets1` a refusé « <b>Le mois</b> » dans le guide (l’ancien nom de l’onglet) : la puce dit « Avec quelle paie ». `tutos-couverture.json` : quatre exemptions, plafond inchangé (793).

### 595f. Restes, à leur lot

- **Le barème des revenus 2026** sera publié au printemps 2027 : d’ici là, les trajets de 2027 se calculent au barème du 9 avril 2026 (`FRAIS_BAREME` ne porte qu’un tableau). Si le PLF 2027 passe (+ 10 %), c’est ce nouveau tableau qui le portera.
- **La Côte-d’Or** : aucun accord territorial vérifié ; le taux du domaine reste au choix de l’admin.
- **Deux-roues** (motos, cyclomoteurs) : un autre barème, pas fait. **Un changement de voiture en cours d’année** : le cumul des km se compte sur l’année, toutes voitures confondues (le barème se lit par véhicule) — à faire si le cas se présente.
- **Une photo prise hors réseau** n’est pas mise en file d’attente : l’envoi échoue, la ligne reste « ticket manquant », à reprendre au retour du réseau.
- **Le salarié ne voit pas ses frais** (l’admin seul saisit et valide, décision de Nico) ; s’il faut un jour les lui montrer, `planning_hsup` est en lecture admin seule (§250).
- **Non regardé à l’écran** : le sombre du relevé (il s’imprime en clair), un vrai envoi de photo au serveur (bac à sable sans réseau).

### 595g. Leçons

- ⚠️ **Sur ordinateur, la fiche d’un salarié est une colonne** : une grille qui suit la largeur de l’écran (`@media`) s’y écrase. Régler la mise en page d’un volet sur **sa** largeur (`container-type:inline-size`, `@container`).
- ⚠️ **Une ligne qu’on supprime avec sa photo** : la photo ne part du serveur qu’une fois l’« Annuler » passé — sinon Annuler remet une ligne qui pointe vers un fichier effacé.
- ⚠️ **Toucher `src/firebase.js` fait rejouer tous les tutos** (TUTO-10, §425 : `TOUS_FICHIERS`) — à compter dans le temps du lot.

## 596. ★★★ CHAINE-1 — UN CDD QUI DEVIENT CDI SANS COUPURE : UN SEUL COMPTEUR, ET DES JOURS QUI SE MODIFIENT (18/11 — `src/utils.js` · `src/planning.js` · `src/reglages.js` · `src/styles.css` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `guide/12-reglages.html` · `scripts/mv-harnais-chaine1.mjs` (neuf) · `scripts/mv-harnais-cddcdi1.mjs` · `scripts/mv-harnais-retard.mjs` · `scripts/mv-harnais-annuler1.mjs` · `scripts/mv-harnais-jcave1.mjs` · `scripts/mv-harnais-effectif-periode.mjs` · `scripts/mv-harnais-frais1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs`)

**La demande**, mot pour mot (18/11, au soir) : *« quand je ne veux pas être bloqué sur des modifications quand un salarié passe d'un CDD à un CDI, je ne peux plus modifier la période là sur le planning où il était en CDD. De même que lorsque un CDD et un CDI s'enchaînent, le mois est compté comme un mois standard. Là, c'est juste une formalité au niveau des papiers, mais d'un point de vue du planning, ça ne change strictement rien. Au niveau du comptage d'heures, ça ne change strictement rien. Il ne faut pas être bloqué là-dessus. »* Reformulée, puis « go avec tes recommandations » sur les deux questions posées (ci-dessous).

### 596a. Le constat, dans le code

- La règle existait depuis le 12/08 (§33, lot 2) : *deux contrats qui se touchent n'en font qu'un*. **Seule la présence la suivait** (`_mvContrats` fusionne). Le compteur — `_planInContract`, ~35 appels : plafond, congés, heures sup, grille, maxima — ne lisait que le couple `debut_contrat`/`fin_contrat`, donc **le CDI seul** : le compteur repartait de zéro à la date du CDI, le mois du changement devenait un mois partiel, le CDD sortait en carte « Compteur soldé ». Le relevé, lui, disait déjà « se poursuit sans interruption · même compteur » (§38) : **le document disait la règle, le calcul ne la faisait pas.**
- CDDCDI-1 (§589, la veille) avait rendu les jours du CDD visibles **en lecture seule** — d'où « je ne peux plus modifier ».
- Mesuré dans l'appli entière (Node, `mv-app-node`), un CDD du 1er mars au 31 août puis un CDI le 1er septembre : **539,5 h** au compteur de l'année avant, **1 333 h** après — exactement celles d'un CDI depuis mars. Un CDD jusqu'au 15 novembre puis un CDI le 16 : **167,5 h** avant (le CDI seul), 1 333 h après.
- Vu en route : l'historique de Réglages dessinait « **Coupure de 0 jour** — le compteur du contrat précédent est soldé » entre un CDD et un CDI contigus (`_emhJours(fin, début) − 1 = 0`) : il se contredisait.

### 596b. Les deux décisions (posées en question, « go avec tes recommandations »)

1. **Un contrat séparé par une coupure** (un saisonnier réembauché) garde son compteur à part, soldé — mais **ses jours se modifient** comme les autres. Écrire une case de planning ne mélange aucun compteur : chacun se recalcule sur ses propres dates (`_planSurContrat`).
2. **Un contrat payé à l'heure** (`MV_HORS_ANNU` : TESA, saisonnier, extra) suivi d'un CDI sans coupure **ne verse pas** ses heures, déjà payées, dans le compteur annuel du CDI : deux chaînes.

### 596c. Ce qui change

- **`window._mvChaines(m)`** (utils.js, à côté de `_mvContrats`) : les périodes de `_mvPeriodes`, regroupées en **chaînes** — contiguës (fin + 1 jour ≥ début suivant ; un chevauchement aussi : une embauche posée avant la fin prévue du contrat d'avant) **et** de même régime (`_mvAnnuType`, la même lecture que `_mvAnnualise` : type inconnu = CDI ; pour la dernière période, `type_contrat` en repli). Rend `{debut, fin, annu, debuts, types}`. Avec `_mvSuitSansCoupure(a, b)` et `_mvAnnuType(type)`.
- **`_planInContract`** garde le couple du contrat en cours (la paie), mais son **début** recule au début de la chaîne : `_planDebutCompteur(mbr)`. Chemin court sans journal ni contrats précédents (comportement d'avant, à l'octet). La réponse est **gardée par fiche** (`WeakMap`), tant que le journal, les contrats et le couple sont les mêmes objets, de même longueur — le journal est toujours **remplacé**, jamais modifié sur place (`_emhCommit`, `_mvHistGrille`, vérifié par grep) ; le harnais joue un journal remplacé seul, sans toucher au couple.
- **`_planJourSaisissable(mbr, m, d)`** = `_planInContract || _planJourCouvert` : la question de toute case qu'on coche, qu'on ouvre ou qu'on écrit — la case (`_pl2Cell`), la ligne, la colonne, « tout cocher », les statistiques de la sélection, les trois applications (`_planApplyHeures`, `_planApplyAbs`, `_planApplySimple`), l'effectif, l'absence sur une partie de journée, la marque « cave », « Mon planning », la ligne « Σ jour ». **`_planJourArchive` est retiré** (son seul appelant était la ligne « Σ jour ») ; la case `.pl2-cell-ro`, son `title` « lecture seule » et sa règle de style aussi.
- **`_planCtrDuMois`** (le relevé, borné à un contrat) lit les chaînes : un mois TESA → CDI n'est plus « un seul contrat ».
- **La fiche › Compteur** : une carte « Compteur soldé » par **chaîne** passée et annualisée — plus de carte pour un CDD suivi sans coupure, aucune pour un TESA.
- **Le relevé** : « se poursuit sans interruption » dit « même compteur », ou « payé à l'heure avant · compteur à part ».
- **Réglages › l'historique** : plus d'encart pour une coupure de 0 jour ; la ligne de l'embauche dit « sans coupure : même compteur » (`_emhSuite`) ; l'effet d'une embauche le lendemain d'une fin le dit avant d'enregistrer (« le même compteur continue », CDD → CDI) ; le choix « Embauche » aussi.
- **L'aide** (`MV_AIDE.planning`, « Un CDD devenu CDI »), **le guide** (`10-planning`, `12-reglages`), **l'annonce** 11.24 (niv 2 aux administrateurs : le compteur de leurs salariés passés de CDD en CDI reprend leurs heures de CDD — un chiffre qui bouge ; niv 0 pour Réglages).

### 596d. Mesuré

- `mv-harnais-chaine1` (appli entière dans Node) : **42 assertions, 10 contre-épreuves** — l'année et le mois du changement d'un CDD devenu CDI **égaux au caractère près** à ceux d'une fiche à un seul contrat (cumul, plafond, reste ; `_planSummary` de novembre) ; une fiche jamais migrée (`contrats[]` + couple) et un CDI posé avant la fin prévue du CDD aussi ; après une coupure ou un TESA, égaux à un CDI depuis septembre (comme avant) ; écrire, cocher la ligne (30 jours d'avril, 15 de juin, pas la coupure), la grille (bouton ordinaire, tiret dans la coupure), la fiche, le relevé, Réglages.
- `mv-harnais-cddcdi1`, réécrit pour la nouvelle règle : 12 assertions, 9 contre-épreuves.
- Harnais adaptés (le banc ne connaissait pas `_planJourSaisissable`) : `retard` (+ `_planJourCouvert` simulé : aucun contrat archivé), `annuler1`, `jcave1`.
- `effectif-periode` charge `_planDebutCompteur` (son banc monte `_planInContract` seul : sans `_mvChaines`, le repli rend le contrat en cours, comme avant). `frais1` cherchait l’annonce de FRAIS-1 **en tête** de `WHATS_NEW` et sa ligne en **deuxième** ligne de `sw.js` : il aurait rougi au premier lot d’après, n’importe lequel. Il la cherche à sa version (11.23, v12.14).
- La chaîne entière : **796 commandes, 0 rouge** (484 s). Build, puis `test:tutos --concernes` (le tuto « cave », téléphone, ordinateur, panneau, miroir, côte à côte), `test:mots` (vert, aucune hausse), `test:debord --ecran Planning` (21 écrans, 7 largeurs, aucun débordement), `test:ux` (18 vérifications vertes).

### 596e. Ce qui n'a PAS été vérifié

- **Sur les vraies fiches du domaine** : le compteur des salariés passés de CDD en CDI va **monter** (il reprend les heures du CDD) — c'est voulu, et c'est pourquoi l'annonce est en « À vérifier ». Un salarié dont le CDD avait été payé comme un compteur soldé verrait ces heures comptées deux fois : à regarder fiche par fiche.
- **Le relevé PDF d'un mois d'un contrat séparé par une coupure** : `_planPaieMois` lit `_planInContract` sans le contexte du contrat (`_planSurContrat` ne borne que `_planInContractCtr`) — d'avant ce lot, non touché ; maintenant que ces jours se saisissent, à regarder si un tel relevé est demandé.
- Le rendu à l'écran (téléphone, ordinateur) de la grille et de l'historique de Réglages n'a été joué que dans Node.

### 596f. Leçons

- ⚠️ **Un harnais qui cherche l’annonce de son lot « en tête » rougit au lot suivant** (`frais1`) : chercher une annonce à SA version, une ligne de changelog par son texte, jamais par sa position.
- ⚠️ **Un document qui dit la règle n'est pas un calcul qui la fait.** Le relevé écrivait « même compteur » depuis §38 ; le guide aussi (« deux contrats qui se suivent sans un jour de coupure ne font qu'un ») ; le compteur repartait de zéro. Un harnais qui compare **deux fiches** (la chaîne contre un seul contrat) le prouve en une ligne ; aucune lecture ne l'avait vu.
- ⚠️ **Un affichage en lecture seule peut être la mauvaise réponse à un vrai défaut** (CDDCDI-1) : le passé redevenait visible, mais la cause — un compteur qui ne voyait que le contrat en cours — restait. Demander « que doit-on pouvoir FAIRE de ces jours ? » avant de choisir entre afficher et bloquer.
- ⚠️ **Outil, dans le bac à sable** : un `\u2013` écrit dans un heredoc ou une chaîne brute Python arrive **déjà converti** en « – » par la couche d'outil ; une ancre qui doit trouver l'échappement en clair dans le source ne correspond plus. Écrire l'échappement par un marqueur (`@@u2013` → `chr(92)+'u'`) ou le lire du fichier (`repr()`).

## 597. ★★★ FRAIS-2 — L’ONGLET « FRAIS » SE VOIT : CINQ ONGLETS SUR UNE LIGNE, LES ACOMPTES PASSENT DANS « FRAIS » (18/11 — `index.html` · `src/planning.js` · `src/planning-frais.js` · `src/frais.css` · `src/utils.js` · `src/whats-new.js` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-frais2.mjs` (neuf) · `scripts/mv-harnais-frais1.mjs` · `scripts/mv-harnais-liste.mjs`)

**La demande.** Nico (18/11), FRAIS-1 en ligne : « il n’y a pas frais ». L’onglet existait, poussé hors de la barre de la fiche. Proposé : « Congés et acomptes » devient « Congés », les onglets se resserrent. Nico : « acomptes va avec frais alors, pas avec congé ». Reformulé (« Congés » ne garde que les congés ; les acomptes passent dans « Frais », sous la liste des frais ; « Frais » reste court), « oui ».

### 597a. Mesuré avant (l’appli construite, la fiche de Jean)

- La barre des onglets de la fiche défile de côté (`overflow-x:auto`) : **423 px d’onglets** pour **324 px** de place à 360 px, **354** à 390 px, **402** dans la colonne de la fiche sur ordinateur (1 366 et 1 536 px). « Frais » commençait à 382 px au téléphone (hors de l’écran), à 1 300 px pour une barre qui finit à 1 338 sur ordinateur (« Frai »).
- 191 px de texte en tout (Résumé 42, Jours 29, Compteur 54, Congés et acomptes 108, Frais 26), 14 px de marge de chaque côté de chaque onglet (`.mvu-tab`, styles.css).
- ⚠️ Les captures de FRAIS-1 le montraient (la barre s’arrêtait sur « Congés et acomptes ») et le tuto `frais` allait au bout : son moteur fait défiler la cible jusqu’à elle. Personne ne l’a vu avant Nico.

### 597b. Ce qui change

- **« Congés et acomptes » devient « Congés »** (`index.html`) ; **les onglets de la fiche ont 8 px de marge par côté** au lieu de 14 (`#ovPlanFiche .pl2-ftabs .mvu-tab`, dans `src/frais.css` : `styles.css` est à son plafond).
- **Les acomptes passent dans « Frais »** : `_pfConges` ne pose plus `_planAcomptesCard` ; la branche `frais` de `_planFicheRender` la donne à `_pfFrais(mbr, P, apres)`, qui la pose **dans la colonne de la liste, sous les frais**, avant « Sa voiture » et « Km payés » (sur ordinateur, la colonne de gauche). Sans `planning-frais.js`, l’onglet montrerait les acomptes seuls.
- **Un ancien lien « ac »** (l’identifiant des acomptes d’avant FICHE-1) ouvre « Frais » (`{mois:'jours',ac:'frais'}`).
- `MV_AIDE.planning` : « Congés : le solde de congés et les jours pris. Frais : … et sous la liste les acomptes » ; la fiche « Les frais à rembourser » dit les acomptes, « Annuler » après une suppression, et « les salariés ne voient ni les frais ni leurs photos » (elle disait « un salarié ne voit pas les frais de ses collègues », comme le guide de FRAIS-1 avant sa correction). Le guide : « Congés », les acomptes dans « Frais », « dans l’onglet Frais de sa fiche » sous Compteur & acomptes. L’annonce 11.25 (admin).

### 597c. Mesuré après (l’appli construite)

- La barre : **324 / 324 px à 360 px, 354 / 354 à 390, 402 / 402 sur ordinateur (1 366 et 1 536)** — plus rien ne défile, « Frais » entier (289 → 339 px à 360). Les onglets grandissent pour remplir la barre (`flex:1 0 auto`).
- Joué (téléphone et ordinateur, clair et sombre, aucune erreur de page) : « Frais » de Jean — les quatre frais, puis « Acomptes sur salaire » (300 €), puis la voiture ; « Ajouter un acompte » depuis « Frais » (150 € le 16/11, enregistré, l’onglet reste « Frais ») ; « Congés » sans acomptes ; `planFicheTab('ac')` ouvre « Frais ».

### 597d. Harnais

`scripts/mv-harnais-frais2.mjs` (10 assertions, 12 contre-épreuves) : les cinq onglets dans l’ordre et sous leurs noms ; **un budget de largeur**, étalonné sur la mesure du 18/11 (lettres × 6,4 px + par onglet deux marges et deux bords + écarts et marge de la barre ≤ 324 px) — un libellé rallongé, un sixième onglet ou des marges élargies rougissent ; les acomptes hors de « Congés », dans « Frais », sous la liste et dans sa colonne (le module joué dans un bac à sable) ; l’ancien lien « ac » ; l’aide, le guide, l’annonce, le service worker. ⚠️ Il ne mesure pas l’écran : le budget est une estimation tirée d’une mesure. `frais1` : la ligne de la branche `frais` porte maintenant les acomptes (son assertion et sa contre-épreuve suivent).

### 597e. Restes

- Le budget tient à 360 px ; un téléphone de 320 px (très rare aujourd’hui) ferait encore défiler la barre.
- La règle des débordements (`test:debord`) ne regarde pas la fiche d’une personne (en-tête de `mv-debord-rendu.mjs`) — c’est pour ça que le budget vit dans un harnais.

### 597f. Leçons

- ⚠️ **Une barre d’onglets qui défile cache ses derniers onglets sans rien dire.** À chaque onglet ajouté, mesurer la barre à 360 px (`scrollWidth` contre `clientWidth`), pas seulement regarder l’onglet ouvert.
- ⚠️ **Un tuto qui va au bout ne prouve pas qu’on voit le bouton** : le moteur fait défiler jusqu’à la cible.
- ⚠️ **Une capture se lit en entier** : celle de FRAIS-1 montrait une barre arrêtée sur « Congés et acomptes ».

## 598. ★★ GEO-1 — LE SITE SE PRÉSENTE AUX MOTEURS ET AUX IA : `llms.txt`, LES ROBOTS D’IA NOMMÉS, UN SITEMAP QUI AJOUTE SEUL LES PAGES NEUVES (23/11 — `public/llms.txt` (neuf) · `public/robots.txt` · `public/logiciel-vigne.html` · `scripts/mv-sitemap.mjs` · `scripts/harnais-claude-md.mjs`)

**La demande.** Nico (23/11) : que Ma Vigne remonte sur Google et soit citée par ChatGPT, Gemini, Perplexity et Claude sur des requêtes métier (temps de travail dans les vignes, registre phyto 2027, gestion d’équipe) ; en cinq étapes — audit, fondations techniques, trois pages « cas d’usage », préparation Play Store (TWA), kit de diffusion externe. Reformulé, confirmé (« Oui »). Audit puis plan livrés ; Nico a tranché : **Play Store : on attend 5 clients** (le backlog le disait déjà) ; **tarifs : ceux de la page en ligne** (pas les décisions du 06/11, tarif annuel et options payantes, jamais intégrées) ; **écran de lancement clair `#F0EEE9` : oui** (pour le lot du manifest).

### 598a. Mesuré avant (audit du 23/11, base `a6ea9ff`)

- **`/` est l’appli** (écran d’accueil en JS, `noindex`). La page d’accueil réelle pour Google et les IA est `logiciel-vigne.html` (301 depuis `/logiciel-vigne`). Pages indexables : logiciel-vigne, essai, guide, demarrage, mentions légales, confidentialité ; `demo.html` et `mise-en-route.html` en `noindex`.
- **Chaque page porte son style et son en-tête/pied** : pas de gabarit commun. Adresses en `.html`, et `mv-sitemap.mjs` l’exige (R4 compare `<loc>` au canonical, le nom de fichier sort du `<loc>`).
- **robots.txt** : `User-agent: *` / `Allow: /` — **tous les robots d’IA étaient déjà autorisés**.
- **Sitemap** : 6 adresses ; le script **redatait** mais **n’ajoutait pas** : une page neuve rougissait le `--check` jusqu’à une écriture à la main.
- **logiciel-vigne** : balises complètes (title, description, canonical, OpenGraph 1200×630, Twitter) ; JSON-LD valide — `SoftwareApplication` (`BusinessApplication`, « Web (PWA), Android, iOS », 3 formules + 3 mises en route, éditeur), `FAQPage` de 8 questions. **Ce que l’étape 2 demandait existait déjà.**
- ⚠️ **Écart de tarifs** : la page en ligne (commit du 31/10) n’a pas les décisions du 06/11 (tarif annuel affiché, création des contours sans KML/Telepac et reprise des données en options payantes). Nico garde les tarifs en ligne (23/11).
- **`llms.txt` absent.** Vérifié avant de le promettre : Google range `llms.txt` parmi les choses inutiles pour ses fonctions d’IA, et John Mueller a écrit qu’aucun système d’IA ne l’utilise (juin 2025). **Il coûte peu, on le pose ; l’effet viendra des pages, du JSON-LD et des avis.**
- **PWA** : le service worker met l’appli en cache (hors ligne ✓), `start_url` et `standalone` ✓. Manquent : une icône maskable (l’actuelle est sur fond transparent, le dessin va de 27 à 482 px sur 512 : Android la rognerait), `id`, `scope`, `lang`. Couleurs `#0F1319` (l’ancienne charte) alors que l’appli est claire.
- **`.well-known/assetlinks.json`** : absent. **Testé** : Vite 5 copie `public/.well-known/` dans `dist/`, et le `listFiles` de firebase-tools 14.27.0 (glob 10.4.1) garde `.well-known/assetlinks.json` **malgré** `"**/.*"` dans `ignore` (le motif vise un dernier segment qui commence par un point, pas un fichier rangé dans un dossier à point). **firebase.json n’a pas à changer pour la TWA.**
- **Play Console** : un compte **personnel** créé après le 13/11/2023 doit tenir un test fermé de 12 testeurs inscrits 14 jours d’affilée avant la production ; un compte **organisation** (D-U-N-S) en est décrit comme exempté — déduction des sources secondaires, Google ne l’écrit pas.
- **Registre 2027, vérifié aux sources** : règlement d’exécution (UE) 2023/564 modifié par (UE) 2025/2203, arrêté du 24/12/2025 (JO du 31/12) ; de 2027 à 2029, conversion au format électronique avant le 31 janvier de l’année suivante ; dès 2030, sous 30 jours ; les utilisations d’avant 2027 peuvent ne pas être converties.

### 598b. Ce qui change

- **`public/llms.txt`** (neuf, format llmstxt.org) : ce qu’est Ma Vigne, pour qui, les modules, le temps de travail (le rang validé part au journal, aux heures et sur la carte ; heures de référence du barème de la convention ramenées à la densité ; cadence réelle et fin annoncée), le registre et l’échéance de 2027 (dates vérifiées), le terrain (PWA, hors réseau), **les tarifs de la page en ligne** (tableau des trois formules, mises en route, 60 €/h, 293 B, essai 15 jours), les données, l’éditeur (GUERETTECH, EI, Nuits-Saint-Georges, SIRET public des mentions légales), les pages principales. **Chaque phrase reprend la page en ligne, le guide ou les mentions légales** ; le fichier dit qu’en cas d’écart, la page fait foi.
- **`public/robots.txt`** : un groupe qui nomme GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended → `Allow: /`. Noms vérifiés aux documentations (Anthropic, Perplexity). ⚠️ Écrit dans le fichier : **un robot nommé ne lit plus le groupe `*`** (RFC 9309) — une interdiction ajoutée un jour sous `*` doit être recopiée dans ce groupe.
- **`scripts/mv-sitemap.mjs`** : sans `--check`, une page indexable absente du sitemap et de `HORS_SITEMAP` est **ajoutée** à la fin (lastmod depuis git, sinon aujourd’hui ; `monthly`, `0.8`, constante `PAGE_NEUVE`) — **à condition que son canonical vaille `https://mavigneapp.fr/<fichier>`**, sinon rien n’est écrit et la ligne est rouge. En `--check`, la page absente rougit toujours, et le message nomme `npm run site`. La sortie reste 0 en écriture (un R1 réécrit n’est plus vrai ; une page refusée rougit au `--check` du build).
- **`public/logiciel-vigne.html`** : `publisher.address` dans le JSON-LD (`PostalAddress` : Nuits-Saint-Georges, 21700, Côte-d’Or, FR) — la même entité que `llms.txt` et les mentions légales. Rien d’autre ; la FAQ reste alignée sur les tarifs en ligne.
- **Pas de bump** : pages de `public/` hors `SHELL_STATIC`, scripts et doc.

### 598c. Mesuré après

- `node scripts/mv-sitemap.mjs --check` : 14 vert, 0 rouge sur la base du lot.
- Le script éprouvé sur deux pages jetables : `test-geo.html` (canonical juste) **ajoutée** (`2026-11-23`, `monthly`, `0.8`), `test-geo-faux.html` (canonical vers une autre adresse) **refusée**, en rouge ; `--check` ensuite : 16 vert ; relancé : « rien à réécrire » (idempotent). Les deux pages retirées, le sitemap restauré.
- JSON-LD de logiciel-vigne relu par `json.loads` : valide, l’adresse en place.

### 598d. Ce qui reste (le plan validé)

- **Lot B (étape 3)** — trois pages « cas d’usage », **une d’abord** (registre 2027) pour valider le ton : `suivi-temps-travail-vigne.html`, `registre-phytosanitaire-2027.html`, `gestion-equipe-viticole.html` ; style, en-tête et pied de logiciel-vigne ; réponse dès le premier paragraphe ; tableau fonctions / compatibilité / tarifs en ligne ; FAQ de 4-5 questions + `FAQPage` ; 301 sans `.html` dans `firebase.json` ; liens depuis le pied de page et les sections de logiciel-vigne ; `llms.txt` complété ; `npm run site` les ajoute au sitemap. **Chaque fonction citée se vérifie dans le code** — ⚠️ la page en ligne dit encore « surface de la parcelle, jamais une portion » alors que REG27-1A (§572) saisit la surface traitée : à vérifier avant d’écrire la page registre, et à corriger sur logiciel-vigne.
- **Lot C (manifest)** — sans la TWA : icônes maskable 192/512 sur fond plein, `id: "/"` (l’identité actuelle des applis installées), `scope`, `lang`, couleurs `#F0EEE9` (la balise `theme-color` de `index.html` suit → bump APP + SW). `assetlinks.json` et Bubblewrap : **à 5 clients**.
- **Lot D (étape 5)** — `docs/geo-kit.md` : fiches annuaires B2B, message de demande d’avis Google.

### 598e. Leçons

- ⚠️ **Avant d’autoriser un robot, lire ce que dit déjà `*`** : l’« autorisation des IA » demandée était acquise ; la nommer est de la lisibilité, pas un effet. Et nommer un robot le **sort** du groupe `*`.
- ⚠️ **Une promesse sur un fichier pour les IA se vérifie comme une autre** : `llms.txt` n’est lu par aucun grand moteur selon Google. On le pose sans le vendre.
- ★ **Un doute sur ce que Firebase déploie se teste avec le code de Firebase**, pas avec un fil de forum : le `listFiles` du paquet, la même version de glob, un `dist/` jetable.

## 599. ★★ GEO-2 — TROIS PAGES « CAS D’USAGE » : LE REGISTRE 2027, LE TEMPS DE TRAVAIL, LA GESTION D’ÉQUIPE (23/11 — `public/registre-phytosanitaire-2027.html` (neuve) · `public/suivi-temps-travail-vigne.html` (neuve) · `public/gestion-equipe-viticole.html` (neuve) · `public/logiciel-vigne.html` · `public/llms.txt` · `firebase.json` · `scripts/harnais-claude-md.mjs`)

**La demande.** Étape 3 du plan validé le 23/11 (§598d) : trois pages ciblées, une réponse dès le premier paragraphe, un tableau factuel (fonctions, compatibilité, tarifs), une FAQ de 4 à 5 questions et son `FAQPage`, le maillage avec la page d’accueil. La page registre d’abord, livrée en aperçu autonome pour le ton ; Nico : « go » (23/11) — les deux autres sur le même modèle, puis les trois en un lot.

### 599a. Vérifié avant d’écrire

- **Le texte** (arrêté du 24 décembre 2025, relu sur AIDA/INERIS) : contenu en vigueur au 1er janvier 2026 (art. 7) ; conversion au format électronique avant le 31 janvier de l’année suivante jusqu’en 2029, sous trente jours dès 2030 (art. 4) ; utilisations d’avant 2027 sans conversion (art. 4, al. 3) ; sur demande explicite d’un contrôleur avant l’échéance, sous dix jours ouvrables, la date la plus proche (art. 5) ; conservation cinq ans au moins (art. 3) ; annexe I : obligatoire / sous condition / facultatif.
- **L’appli, dans le code et le guide** : le registre (REG27-1A §572, REG27-1B §573, REG27-2 §575 — les colonnes de `MV_PHY_CSV_COLS`, les huit points et le verdict de `_regPoints`/`_regVerdict`, repris mot pour mot dans le dessin de la fenêtre) ; qui saisit un traitement (administrateur et tractoriste, `isTractoriste() || isAdmin()`) ; l’export réservé à l’administrateur ; le temps par parcelle (PAR-1 §198 : la journée partagée entre les parcelles validées, au prorata du barème ; TV-1 §172 : « Temps réel contre barème » ; journées de cave et conduite retirées) ; les heures sup (guide Planning : à la semaine, 8 h à 25 %, puis 50 %) ; les rôles (guide 02) ; les formules (guide 03 : Planning et Pilotage en Domaine seulement) ; le renfort (guide Pilotage : réponse en calendrier, « Choisir moi-même la période »).
- ⚠️ **Écarté** : `mv-shot-phyto-mobile.png` (capture du 06/09, l’ancienne charte sombre) — elle ne montre plus l’appli. La fenêtre « avant l’export » est **dessinée en HTML**, données de démonstration annoncées sous la carte.
- ⚠️ **Corrigé en route sur logiciel-vigne** : « L’application enregistre une parcelle entière, jamais une portion » était faux depuis REG27-1A (§572) ; la pastille « Surface (ha) » devient « Surface traitée (ha) ».

### 599b. Ce qui change

- **Trois pages** sur le gabarit de logiciel-vigne (sa charte, sa barre, son panneau au téléphone, son pied) : fil d’Ariane, sur-titre, `h1`, un **chapô qui répond** (l’obligation ou le besoin, ce que fait Ma Vigne, la formule et le prix), une carte à droite sur ordinateur (les échéances ; un exemple chiffré du partage de la journée, barème fictif annoncé ; qui voit quoi), une bande de quatre faits, un **tableau** (exigence → Ma Vigne ; question → où c’est compté, avec la formule en pastille ; décision → ce que l’équipe voit), les étapes, un encadré franc (« Ce que je ne vous dirai pas », « Ce que Ma Vigne ne fait pas »), les formules concernées avec la mise en route, **cinq questions** et leur `FAQPage` (le texte visible et le JSON-LD sont identiques, vérifié par script), l’essai, « À lire aussi » vers les deux autres.
- **JSON-LD de chaque page** : `WebPage` (sur `SoftwareApplication` Ma Vigne), `BreadcrumbList`, `FAQPage`.
- **Les trois pages partagent le même bloc `<style>`** (la charte de logiciel-vigne, plus les tableaux qui s’empilent au téléphone, la fenêtre dessinée, les étapes, l’exemple chiffré) et le même script (menu, apparition, `?still`).
- **Maillage** : logiciel-vigne — un lien sous l’encadré du registre, une ligne « En détail » sous « Trois lieux », les trois pages dans le pied ; les trois pages — le pied (avec « Présentation ») et « À lire aussi ».
- **`firebase.json`** : trois 301 depuis l’adresse sans `.html`, comme `/logiciel-vigne`.
- **`llms.txt`** : les trois pages dans « Pages principales » ; la ligne Temps de travail dit le partage de la journée et la formule Domaine (la « cadence des quatre dernières semaines » de logiciel-vigne retirée : le guide dit quinze jours pour la carte du jour).
- **Pas de bump** (pages de `public/` hors `SHELL_STATIC`, `firebase.json`, doc). **Le sitemap** : `npm run site` ajoute les trois pages (GEO-1) — testé : ajoutées à `0.8`, `--check` vert ensuite, fichier restauré (dérivé, non livré).

### 599c. Mesuré

- Les trois pages au navigateur (Chrome sans tête, servies depuis `public/`), téléphone 390 px et ordinateur 1 440 px : aucune erreur de page, aucun débordement horizontal (`scrollWidth` = largeur), aucun élément qui sort de l’écran ; les six graisses chargées. Lues sur capture, défauts corrigés : le « 1er » en exposant cassé dans le sur-titre en capitales, la légende de tableau rognée (passée en texte lu seulement), une coche verte devant « Sans Planning ni Pilotage » (retirée), l’espace de « À lire aussi ».
- Balises équilibrées, ancres du menu toutes présentes, aucun caractère hors des polices auto-hébergées, JSON-LD des quatre pages relu par `json.loads`.
- `mv-sitemap --check` : rouge sur les trois pages tant que `npm run site` n’a pas tourné (attendu), vert après. `preflight`, `lint-vocabulaire`, `mv-harnais-subset`, `mv-harnais-icones`, `mv-harnais-demo`, `mv-claude-index --check` : verts.

### 599d. Ce qui reste

- **À faire chez Nico** : `npm run site` **avant le commit** (le `--check` du build et de la CI rougit sans), puis `npm run build` → `firebase deploy --only hosting` ; ouvrir les trois pages au téléphone ; Search Console : renvoyer `sitemap.xml`, demander l’indexation des trois adresses.
- **Lot C** (manifest seul : maskable, `id: "/"`, `#F0EEE9`, bump APP + SW) et **lot D** (`docs/geo-kit.md`) — §598d.
- **À surveiller** : chaque page recopie des tarifs et des fonctions ; un lot qui touche le registre, le planning, les formules ou les prix relit aussi ces trois pages et `llms.txt`.

### 599e. Leçons

- ⚠️ **Une page de vente se relit contre le code, pas contre la page de vente d’avant** : logiciel-vigne disait « jamais une portion » huit jours après que l’appli a appris la surface traitée.
- ★ **Un dessin d’écran vaut mieux qu’une capture périmée** : la fenêtre « avant l’export » reprend les libellés de `registre.js`, et elle ne vieillit pas avec la charte.
- ★ **Le texte visible d’une FAQ et son JSON-LD se comparent par script** : deux copies écrites à la main finissent toujours par diverger.

## 600. ★★ MANIF-1 — L’APPLI INSTALLÉE S’OUVRE SANS ÉCLAIR, SA BARRE D’ÉTAT SUIT LE THÈME, SON ICÔNE N’EST PLUS ROGNÉE (23/11 — APP 11.26, SW 12.17 — `public/manifest.json` · `public/sw.js` · `public/icon-maskable-192.png` (neuve) · `public/icon-maskable-512.png` (neuve) · `index.html` · `src/utils.js` · `src/whats-new.js`)

**La demande.** Le lot C du plan validé le 23/11 (§598d) : le manifest seul, sans la TWA (Play Store à 5 clients). Nico avait dit « oui » à un écran de lancement clair `#F0EEE9`. **En lisant le code, deux choses ont changé la réponse** — dites à Nico avant de rien livrer :

### 600a. Ce que le code a montré

- ⚠️⚠️ **Le manifest d’une appli installée n’est PAS `public/manifest.json`** : `sw.js` intercepte `/manifest.json` et sert le sien (son `start_url` porte le tenant ; voir le commentaire au-dessus du gestionnaire). Le fichier statique ne sert qu’avant l’installation du SW. **Les deux se tiennent à la main, champ par champ** — l’écrire seul dans le statique n’aurait rien changé chez les clients.
- ⚠️⚠️ **Le plan disait « `id: "/"`, l’identité actuelle des applis installées » : c’était FAUX.** Sans `id`, l’identité d’une appli installée est son `start_url` — ici `https://mavigneapp.fr/?tenant=<slug>`, figé à l’installation. `id: "/"` aurait changé l’identité de toutes les applis déjà installées, et Chrome ne les aurait plus mises à jour. **Aucun `id`** : c’est écrit dans `sw.js`, au-dessus du manifest.
- ⚠️ **L’écran de démarrage de l’appli (`#splash-screen`) est NOIR** (`#000`, logo, Cormorant — et le rideau de mise à jour MAJ-2 le reprend). Un lancement Android clair aurait fait, à chaque ouverture, clair → noir → appli claire. Question posée à Nico avec une image (l’icône d’aujourd’hui rognée, fond clair, fond noir, les deux enchaînements) : **« Noir, sans flash »** (23/11).
- **L’icône** : le SW déclarait les icônes transparentes `any maskable`. Android les rognait au cercle — le T en haut à droite et le G en bas à gauche coupés. Le logo est un trait (raisins sans remplissage) : lisible sur fond clair, pas sur noir → icône **sur fond clair**.
- **La barre d’état** : `<meta name="theme-color" content="#0F1319">` en dur — le bleu nuit de l’ancienne charte, au-dessus d’une appli claire ; rien ne la changeait avec le thème.

### 600b. Ce qui change

- **Les deux manifests** (statique et SW) : `background_color` et `theme_color` `#000000` ; `lang: "fr"`, `scope` explicite (la même valeur que celle déduite du `start_url` : rien ne bouge) ; les icônes `any` (les transparentes) **et** deux icônes `maskable` à part, `icon-maskable-192.png` / `-512.png` : fond `#F0EEE9`, logo à 56 % de la largeur (le point opaque le plus éloigné du centre à 0,38 de la taille — la zone sûre est un cercle de 0,40). **Pas d’`id`.**
- **`index.html`** : la balise `theme-color` part **noire** (comme le splash) ; un commentaire renvoie à `_mvBarreEtat`.
- **`utils.js`** — `MV_BARRE` (noir, clair `#F0EEE9`, sombre `#0D0D0C` : les `--bg-app` de `charte.css`, recopiés car une balise meta ne lit pas une variable CSS), `_mvBarreCouleur` (pure), `_mvBarreEtat` (pose la couleur), `_mvBarreSuivre` appelée par `initTheme` : **on regarde au lieu d’appeler** — un observateur sur le `style` de `#splash-screen` (il se cache en six endroits : app.js, tutos.js, boot.js), un sur `data-theme` de `<html>` (posé par `applyTheme` et par app.js §59c), et le changement clair/sombre du téléphone pour « Auto ».
- **`WHATS_NEW` 11.26** : un item `niv 0`, `pour: ['tous']` — l’ouverture sans éclair, la barre au thème, l’icône entière, et que le téléphone peut demander une fois d’accepter la nouvelle icône.
- **Versions** : APP 11.25 → 11.26 (cinq porteurs d’`index.html` : quatre affichages et `boot.js?v=`), SW 12.16 → 12.17 (en-tête, `CACHE_NAME`, deux `console.log`, ligne de journal).

### 600c. Mesuré

- `npm run check` complet (`mv-lanceur --continuer`, 2 à la fois) : **798 commandes, 0 rouge**, 528 s ; `mv-harnais-theme` 7 vertes ; `mv-whatsnew-check` vert ; `WHATS_NEW` exécuté dans Node (11.26, `niv 0`, `tous`) ; l’aiguillage des tutos : **aucun tuto ne touche ce lot**.
- **Dans Chrome sans tête, l’appli construite** (Vite, servie depuis `dist`, SW bloqué, 390 × 844), la balise relevée tous les dixièmes de seconde : téléphone en clair — `#000000` pendant le splash, `#F0EEE9` à l’instant où il se cache (3,2 s) ; téléphone en sombre — `#000000`, puis `#0D0D0C` ; puis le thème choisi dans l’appli : sombre `#0D0D0C`, clair `#F0EEE9`, Auto = le téléphone. Aucune erreur de page.
- Les icônes relues : 512 et 192 px, RVB, fond `#F0EEE9` au coin.

### 600d. Ce qui reste

- **À faire chez Nico** : `npm run build && firebase deploy` (pas `--only hosting` : `index.html` et le SW changent). Sur un Android où l’appli est installée : la rouvrir deux fois (le SW 12.17 prend la main, puis Chrome relit le manifest) ; Chrome met l’appli installée à jour **à son rythme** (au plus une fois par jour au lancement) et **peut demander une fois d’accepter la nouvelle icône**. Une installation neuve a tout de suite l’icône entière et le lancement noir.
- **Play Store (TWA)** : à 5 clients (Nico, 23/11). Au moment de la TWA, l’`id` se tranchera là — le `start_url` porte le tenant.
- **Lot D** : `docs/geo-kit.md` (fiches annuaires B2B, message de demande d’avis).
- **Non touché, vu en route** : l’écran de connexion (`#login-screen`) et l’onboarding gardent leur dégradé sombre `#1A1F2E → #0F1319` de l’ancienne charte ; l’écran « Connexion instable » de `boot.js` aussi. Hors de ce lot.

### 600e. Leçons

- ⚠️⚠️ **Avant de toucher un manifest, chercher qui le SERT** : ici le SW, pas le fichier. Et avant de poser un `id`, lire le `start_url` que voient les applis déjà installées.
- ⚠️ **Un « oui » donné sur une prémisse fausse se redemande** : « l’appli est claire » oubliait le splash noir. Une image, une question, trois options — et la réponse a changé.
- ★ **Une couleur qui dépend de six endroits se règle par observation** : un `MutationObserver` sur l’attribut qui change, plutôt qu’un appel ajouté dans chacun des six.

## 601. ★ GEO-3 — LE KIT DE DIFFUSION : ANNUAIRES DE LOGICIELS ET DEMANDE D’AVIS GOOGLE (23/11 — `docs/geo-kit.md` (neuf) · `scripts/harnais-claude-md.mjs`)

**La demande.** L’étape 5 du plan (§598d), dernier lot du chantier SEO/IA : les textes prêts à copier-coller pour les signaux extérieurs — fiches des annuaires B2B (Appvizer, Capterra, G2 : description courte de 150 caractères, description longue, fonctionnalités, mots-clés) et un message aux clients pour un avis Google qui cite naturellement leurs usages. Nico : « suite » (23/11).

### 601a. Vérifié avant d’écrire

- **Les règles des avis Google** : rien en échange d’un avis ; pas de tri des clients avant de demander (solliciter sélectivement les avis positifs est interdit) ; le lien officiel se prend sur la fiche, « Voir les avis » puis « Recevoir plus d’avis » (aide Google, réponse 16816815).
- ⚠️ **L’éligibilité de la fiche Google** : seules les entreprises qui rencontrent leurs clients en personne y ont droit ; une activité seulement en ligne non (aide Google, réponse 13763036). Le kit ne l’affirme pas pour GUERETTECH : **si** Nico se déplace dans les domaines, fiche en zone desservie, adresse masquée ; sinon, les avis passent par les annuaires.
- **Chaque chiffre et chaque fonction** repris de la page en ligne, de `llms.txt` et des trois pages « cas d’usage » (tarifs du 31/10, décision du 23/11). Les longueurs **comptées par script** : 144 et 90 caractères (FR), 132 (EN), longue FR 2 296.

### 601b. Ce que contient `docs/geo-kit.md`

1. **La fiche d’identité** à recopier à l’identique partout (nom, éditeur, ville, site, contact, SIRET déjà public, déploiement, hébergement, logo transparent) et une phrase d’une ligne.
2. **Les fiches annuaires** : deux descriptions courtes, une longue (avec ce que comprend chaque formule, pour ne pas laisser croire que 29 € ouvrent tout), les fonctionnalités, les champs « prix » (pas de version gratuite : une démo libre), catégorie et public, **une version anglaise** (G2), les visuels (captures PC entières, PC et téléphone ensemble, logo à fond transparent — préférences de Nico).
3. **Les mots-clés**, chacun relié à la page du site qui y répond.
4. **La demande d’avis** : les règles (aucune contrepartie, le même message à tous, jamais d’avis écrit par Nico ni de texte rédigé pour le client), le message WhatsApp/SMS (vouvoiement et tutoiement), l’e-mail, et l’après (répondre à chaque avis, une seule relance, le bon moment). Le message **propose des sujets** (les heures, les parcelles, le registre, la cave) et **demande aussi ce qui manque** — un avis franc, pas un avis dicté.

### 601c. Ce qui reste

- Chez Nico : créer les comptes éditeur des annuaires, la fiche Google si elle est éligible, envoyer le message à **tous** les clients.
- **Garde** : un lot qui change un tarif ou une fonction relit aussi `docs/geo-kit.md` (avec `llms.txt`, le JSON-LD de logiciel-vigne et les trois pages).
- Le chantier SEO/IA est bouclé : GEO-1 (§598), GEO-2 (§599), MANIF-1 (§600), GEO-3 (§601) ; la TWA à 5 clients.

### 601d. Leçon

- ⚠️ **Un kit de demande d’avis se vérifie contre les règles de la plateforme avant d’être écrit** : « demander aux clients contents » est le premier réflexe, et c’est précisément ce que Google interdit.

## 602. ★ GEO-4 — LES ANNUAIRES, CASE PAR CASE : APPVIZER À PART, G2 ET CAPTERRA EN UN SEUL FORMULAIRE (23/11 — `docs/geo-kit.md` · `docs/annuaires/` (neuf : 3 images + 8 captures) · `scripts/harnais-claude-md.mjs`)

**La demande.** Nico : « Fais-moi le tuto simple à 100 % pour remplir mes fiches sur Advisor, Captera et G2 » — Advisor = Appvizer (sa réponse). Le tuto lui-même est dans la conversation ; le lot range dans le kit ce qui manquait pour le suivre.

### 602a. Vérifié avant d’écrire (23/11/2026)

- ⚠️ **G2 possède Capterra, GetApp et Software Advice** (accord du 29/01/2026, vente conclue en février). Le bouton « Get Your Product Listed » de capterra.com/vendors mène à `g2.com/add_product_requests/new` (lu le 23/11) : **un seul formulaire**, Capterra, GetApp et Software Advice en cases à cocher (source secondaire, blastra.io). La connexion demande **LinkedIn ou une adresse e-mail professionnelle** : la Gmail de Nico n’en est pas une → LinkedIn. G2 vérifie en 3 à 5 jours ouvrés, puis la fiche se réclame (1 à 3 jours).
- **Le contenu G2 se remplit en anglais** (documentation G2, « Product Information ») ; les versions locales (capterra.fr) passent par *International Markets*. G2 conseille une description différente par site, sans l’imposer.
- **Appvizer** (centre d’aide) : inscription gratuite sur `appvizer.fr/partenaires/inscription`, accord sous 24 h ; publiée après relecture si titre de 20 à 60 caractères, description d’au moins 500, une fonctionnalité au moins ; **un texte copié d’ailleurs est pénalisé** ; troisième personne, ni superlatif, ni lien, ni téléphone ; l’essai gratuit seulement dans le bouton d’action ; logo 128 × 128 sous 30 Ko, image principale 1366 × 360, au moins six captures du même format, légendes de 216 caractères au plus. Appvizer vend aussi des clics vers le site des éditeurs : rien à payer pour la fiche.
- **Les catégories existent** : Appvizer « Établissement vinicole » (+ Gestion de fermes, Gestion des temps, Planning RH) ; G2 « Vineyard Management » et « Winery Management ».
- **Chaque fait des textes** repris de `llms.txt`, de la FAQ de logiciel-vigne (mise en route : parcellaire PAC/Telepac ou KML, comptes, barème, formation) et du kit ; les longueurs **comptées par script** (titre 58, introduction 291, description 3 063 sans les signes de mise en forme, légendes 118 à 163).

### 602b. Ce qui change dans le kit

1. **§1** : le logo des annuaires est `docs/annuaires/ma-vigne-logo-512.png`, le logo GT **à fond transparent** (préférence de Nico) détouré de sa photo de profil Facebook — lettres olive, lisibles sur fond blanc. `public/icon-512.png` reste l’icône de l’appli : ses lettres jaunes disparaissent sur le blanc des annuaires.
2. **§2.7** : les fichiers de `docs/annuaires/` et les **huit captures** (1600 × 1000, la démo « Domaine des Grandes Vignes », horloge au 27/10/2026 : aucun vrai salarié ni vrai domaine), leurs légendes en français et en anglais, et comment les refaire (`mv-demo-captures.mjs --sortie … --sans-page`, trois écrans PC ajoutés le temps de la prise, sans toucher au script).
3. **§2.8 Appvizer** : bouton d’action, titre, catégories, introduction, description structurée (titres, gras, listes, et « ce que Ma Vigne ne fait pas » : français seulement, ni badgeuse ni géolocalisation, ni comptabilité ni paie), trois points forts, fonctionnalités, éditions.
4. **§2.9 G2 et Capterra** : le formulaire unique, la connexion, chaque case en anglais (dont la présentation de l’éditeur, 261 caractères), les formules et l’essai, les cases Capterra/GetApp/Software Advice, le français par *International Markets*.

### 602c. Ce qui reste

- Chez Nico : remplir G2 (Capterra coché), puis Appvizer, avec le tuto ; vérifier capterra.fr quelques jours après la réclamation de la fiche.
- **Garde** (s’ajoute à celle de §601) : un écran montré dans `docs/annuaires/captures/` qui change → refaire sa capture.

### 602d. Leçon

- ⚠️ **Un annuaire se vérifie le jour où on le remplit** : le kit de GEO-3, écrit le matin même, comptait Capterra et G2 comme deux comptes ; depuis la fusion, Capterra n’a plus de formulaire à lui.

## 603. ★ GEO-5 — LES ANNUAIRES REMPLIS POUR DE VRAI, ET L’ADRESSE contact@mavigneapp.fr (23/11 au soir — `docs/geo-kit.md` · `public/llms.txt` · `public/logiciel-vigne.html` · 3 pages « cas d’usage » · `public/essai.html` · `public/demarrage.html` · `public/mise-en-route.html` · `guide/_layout.html` · `guide/14-depannage.html` · `scripts/contre-epreuves.mjs`)

**La demande.** Nico, perdu dans les formulaires : « il faut que tu fasses ». Fait avec lui dans le navigateur de l’appli Claude (il tapait ses mots de passe et ses codes), puis : « oui » pour consigner le tout et remplacer la Gmail par contact@ « sur le site et dans llms.txt ».

### 603a. Ce qui a été fait le soir du 23/11 (hors dépôt)

- **G2** (Capterra, GetApp, Software Advice cochés) : demande envoyée par Nico, connexion LinkedIn. G2 prévient que l’accès administrateur peut être refusé sans adresse pro → à la validation, compte avec contact@ et nouvelle demande depuis la fiche.
- **Appvizer** : vérifié dans le navigateur — `partenaires/inscription` en **404**, espace éditeur **blanc** (`client-config.js` en 502). Le site vit désormais de bannières, de mentions et de clics payés par les éditeurs. On attend.
- **contact@mavigneapp.fr** : domaine acheté chez OVH le 31/05/2026 ; pas de compte Zimbra offert rattaché → Zimbra Starter payé (3,60 € HT/an). Organisation « Ma Vigne », domaine ajouté en **configuration recommandée** (MX vers Zimbra, SPF `~all` ; A et TXT Firebase/Google intacts, vérifié par DNS public), compte créé (Nico a tapé le mot de passe), **transfert vers la Gmail** avec copie gardée.
- **La Fabrique du Net** : fiche créée et complétée (identité, éditeur, cibles, tarification, 4 cas d’usage) ; secteurs et fonctionnalités laissés vides plutôt que faux. **Gratuit = ni Google ni IA, pas de lien** ; Vitrine 69 € HT/mois, indexation acquise après résiliation — décision de Nico.

### 603b. Ce qui change dans le dépôt

1. **`docs/geo-kit.md`** : §1 e-mail = contact@ ; §2.8 encadré « Appvizer en panne » ; §2.9 l’état de la demande G2 ; **§2.10 La Fabrique du Net** (offres, saisie complète, accroche 90 car., description 1 674 car., présentation éditeur 479 car.).
2. **contact@ remplace la Gmail** sur les pages de vente et d’aide : `llms.txt`, `logiciel-vigne.html` (JSON-LD et liens), les 3 pages « cas d’usage », `essai.html`, `demarrage.html`, `mise-en-route.html` (dont la variable `DEST` des courriels préparés), et les sources du guide (`guide/_layout.html`, `guide/14-depannage.html`). `scripts/contre-epreuves.mjs` suit (sa mutation visait le lien mailto).
3. **Pas touchés, exprès** : l’appli (`index.html`, `src/*`), `firestore.rules`, `storage.rules`, `functions/*`, les harnais — la Gmail y est l’**identité admin** ; les documents juridiques (mentions légales, CGU, confidentialité, DPA) — décision à part. `public/guide.html` et `public/sitemap.xml` sont **dérivés** : Nico les régénère avec `npm run site`.

### 603c. Vérifié

- Remplacement compté fichier par fichier ; plus aucune Gmail dans les pages modifiées. `build-guide --check` à jour après régénération locale ; `mv-sitemap --check` vert après `node scripts/mv-sitemap.mjs` (sitemap remis comme livré) ; `contre-epreuves` et `harnais-parcours-prospect` : **mêmes résultats que la base** (rouges déjà présents, hors liste de contrôle) ; confidentialité verte.

### 603d. Leçon

- ⚠️ **Une adresse e-mail n’est pas qu’un contact** : la Gmail est aussi l’identité admin dans les règles, les fonctions et l’appli. Remplacer « partout » aurait fermé la console GT à Nico. Toujours lister les occurrences et trier : vitrine / juridique / identité.

## 604. ★★★ MOTS-11 — PILOTAGE › CONFORMITÉ ALLÉGÉ SUR PLACE : UNE PHRASE, CINQ CARTES REPLIÉES, LA PROTECTION COMME LES AUTRES (23/11 — APP 11.27, SW 12.18 — `src/pilotage.js` · `src/pilotage.css` · `src/styles.css` · `src/registre.js` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `docs/maquettes/maquette-conformite-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots11.mjs` (neuf) · dix harnais suivis · `scripts/mv-harnais-liste.mjs` · la capture `r-ger-conformite` de la démo du site)

### 604a. D’où ça vient, ce qui a été mesuré avant

- Le quatrième des onglets restés dans le Pilotage (décision du 17/11, §28), après Travaux (§592), L’équipe & le matériel (§593) et Décider (§594). Maquette `maquette-conformite-v1.html` (Avant / Après, téléphone et ordinateur, captures de la démo et du prototype) ; Nico : « Go », avec les trois recommandations — la protection repliée comme les autres ; le registre en résumé, les huit points dans la fenêtre d’export ; les réglages de la protection en pied de carte, pas dans le « i ».
- **L’onglet le plus court (90 mots), mais rien ne disait d’un coup d’œil ce qui est à régler.** Le sous-titre « Conformité — cuivre, IFT et délai de rentrée » oubliait la protection et le registre. La protection (`_pilProtCarte`) était une **grande carte toujours ouverte**, d’un autre dessin que les autres (icône, titre en 22 px, cinq lignes, réglages en ligne) : 1,4 écran au téléphone avant la première carte repliée. Des repères à décoder : « ↑ 2 » sur le cuivre, « — » sur l’IFT sans catalogue, « 0 actif » sur le délai de rentrée, « Conforme » sous chaque barre du cuivre. Le registre ouvert recopiait la fenêtre d’export (218 mots : le verdict, puis les huit points, dont le premier redisait le verdict, puis les délais légaux déjà dans le « i »). « Protection restante » hors du lexique.
- Mots avant le premier grand chiffre : 9 au téléphone, 15 sur ordinateur. Hauteur au téléphone : 1 213 px.

### 604b. Ce qui change

- **Une phrase en haut** (`_pilCfPhrase`, à la place du sous-titre, comme les trois autres onglets) : « **8 parcelles à nu, 2 points à régler** » — le délai de rentrée en cours d’abord (rouge), les parcelles à nu (rouge) ou à nu d’ici 2 jours (orange), les points à régler (orange) ; « Rien à régler » sinon. ★ **Règle ②** : les points sont **la liste de la tuile Conformité d’Aujourd’hui** (`_pilCfmPoints`, COHER-1 §581) — le même nombre aux deux endroits ; la protection et le délai lisent `_pilProtData` et `_cfmDre`. Aucun calcul de plus. Elle se pose après les cartes (`_pilFillContent`).
- **Les cinq cartes arrivent repliées** sous `.pil-tv.pil-cf` (la règle des cartes allégées) : un titre, un chiffre, une pastille.
  - **Protection** (`_pilProtTuile`, `_pilProtTete` ; `_pilProtCarte` part) : « 8 parcelles » et « à nu » (rouge), « 7,02 ha sans protection » dessous ; « à nu d’ici 2 jours » (orange, « sur N parcelles ») ; « protégées » (vert). Le corps garde sa liste et « Et 3 autres » ; **les réglages en pied** (rémanences, mode déduit, pluie) ; « **Ouvrir les traitements** » (règle ① — `_pilTvGo('traitements')` → Phyto › Registre). `prot:1` rejoint les replis par défaut (une clé neuve s’applique sans monter `_PIL_ST_V`, §594).
  - **Cuivre** : la pastille « N au-dessus du plafond » (rouge), « N en vigilance » (orange), « sous le plafond » (vert) ; sous les barres, « Dépassement · » et « Vigilance · » seulement — plus « Conforme » ligne à ligne ; le pied dit « plafond UE 28 kg/ha de cuivre métal sur 7 ans ».
  - **IFT** : sans catalogue, « 3 passages » et « catalogue E-Phy absent » (la mention de COHER-1), une phrase dans le corps ; avec, l’écart en pastille (« N % au-dessus de la référence », « sous la référence ») ; la formule part dans le « i ».
  - **Le registre** : « 10 lignes » et la mention (« SIRET manquant »), ou « prêt pour le contrôle » ; « 3 traitements » dessous.
  - **Délai de rentrée** : « 0 » et « aucune parcelle en délai », « Toutes les parcelles sont accessibles. » ; en cours, « rentrée interdite » et « Ouvrir les traitements ».
- **Le registre en résumé** (`registre.js/_regCarte`, règle ③) : les points **à compléter**, tels quels, puis un compte (« Les 5 autres points : en règle · 2 facultatifs à compléter »), puis « Voir les lignes et exporter 2026 » — la fenêtre (`_regOuvrir`, inchangée) garde les huit points. Sans ligne, le verdict seul. Le paragraphe des délais légaux est dans le « i » (`pil.phyto`, REG27-1B).
- **Les mots** : « Protection des parcelles (fenêtre de traitement) » dans les réglages de l’onglet, « La protection des parcelles » pour le « i » ; `MV_AIDE` : « Conformité se lit d’un coup d’œil » ; le guide (`11-pilotage`) dit la phrase, la carte Protection, le registre en résumé, et la protection « dans l’onglet Conformité ».
- **Les règles mortes** : `.pil-tile2`, `.pil-t2h` et `.pil-prot-big` (la grande carte, PRO-1 §269) n’étaient plus produites — `gabarit1` l’a dit dans la chaîne (« chaque pièce visée par le bloc est produite par le code ») ; retirées de `styles.css`, partout où elles étaient.
- **La démo du site** : la capture `r-ger-conformite` (« Le jour du contrôle ») régénérée — elle montrait la grande carte de la protection ; son texte reste juste.

### 604c. Mesuré après (build, démo)

- Cliquet des mots : **90 → 35 mots** (téléphone et ordinateur) ; hors lexique 1 → 0 ; mots avant le premier grand chiffre 9 → 5 au téléphone, 15 → 0 sur ordinateur. Hauteur au téléphone : **1 213 → 844 px** (un écran).
- Cartes ouvertes : le registre **218 → 57 mots**, le cuivre 137 → 124, l’IFT 63 → 24, le délai de rentrée 24 → 15.
- Cliquets regravés : les mots (`--motif` du lot ; il a aussi pris une baisse trouvée en route, Planning › Personnel sur ordinateur 276 → 275, venue d’un lot d’après MOTS-10) ; le contraste (`mv-harnais-contraste --baseline`) — une paire mesurée de moins dans `styles.css` (1 030 → 1 029, la règle morte retirée) et un écart de moins en sombre. `ux`, `gabarit`, `debord` verts sans regraver.
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : la phrase lit « 8 parcelles à nu, 2 points à régler » ; « Et 3 autres » montre les huit lignes ; « Ouvrir les traitements » ouvre Phyto sur l’onglet Registre.

### 604d. Harnais

`scripts/mv-harnais-mots11.mjs` (21 assertions, 26 contre-épreuves) : l’onglet et sa règle ; la phrase jouée (à nu, bientôt, le délai, « Rien à régler ») et sa source (la liste d’Aujourd’hui, aucun calcul de plus) ; l’en-tête de la protection joué, sa carte, son repli, son bouton ; les pastilles du cuivre, de l’IFT, du registre, du délai ; le registre en résumé joué ; le lexique ; l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `protection` (l’en-tête par `_pilProtTete`, la carte par `_pilProtTuile`), `pro1` (`_pilProtTuile`), `coher1` et `ift1` (la mention du catalogue en pastille), `mots8`, `mots9`, `mots10` (la sous-ligne porte aussi la phrase de Conformité ; le repli de `mots10` lit `ordrepassage:1` suivi d’une autre clé), `reg27b` (le résumé au lieu des huit points), `pilrange4a` (le libellé de la protection dans les réglages), `pil1` (`.pil-prot-big` n’est plus une pièce recalée).

### 604e. Restes, à leur lot

- Non vu à l’écran (la démo ne les a pas) : l’IFT calculé (catalogue chargé), un délai de rentrée en cours, un cuivre au-dessus du plafond — joués par le harnais seulement.
- Les lots suivants du plan (§28) : Cave › Le Millésime (deux lots), Cave › Aujourd’hui, Phyto › Registre, la Réserve, le lot de balayage.

### 604f. Leçons

- ⚠️ **Un onglet court n’est pas un onglet lisible** : 90 mots, le moins de tout le Pilotage, mais le sous-titre ne nommait pas deux des cinq sujets, et la seule carte ouverte était la plus longue. La phrase du haut répond à la question qu’on pose en ouvrant l’onglet.
- ⚠️ **Retirer un dessin, c’est retirer ses règles** : `gabarit1` a trouvé dans la chaîne les trois classes de la grande carte, restées dans le bloc GABARIT-1 et dans deux autres blocs. Après avoir supprimé une fonction qui fabrique du HTML, chercher ses classes dans `styles.css`.
- ⚠️ **Une carte d’un autre dessin se lit comme une autre famille** : la protection, grande et ouverte, paraissait plus importante que le registre ou le délai de rentrée. Même dessin, même repli : c’est la pastille qui dit l’urgence.

## 605. ★★★ MOTS-12 — CAVE › LE MILLÉSIME, PARCELLES ET CUVÉES ALLÉGÉS : UNE PHRASE, UNE LIGNE PAR PARCELLE (24/11 — APP 11.28, SW 12.19 — `src/cave.js` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/08-cave.html` · `docs/maquettes/maquette-millesime-parcelles-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots12.mjs` (neuf) · cinq harnais suivis · `scripts/tutos-couverture.json` · `scripts/mv-harnais-liste.mjs` · la capture `r-chai-millesime` de la démo du site)

### 605a. D’où ça vient, ce qui a été mesuré avant

- Le premier des deux lots du Millésime dans le plan (§28 : « Parcelles et Cuvées, puis Courbes et Les années » — lu comme Courbes et Ensemble, dit à Nico avec la maquette). Maquette `maquette-millesime-parcelles-v1.html` (Avant / Après, téléphone et ordinateur, captures de la démo et du prototype) ; Nico : « Go », avec les quatre recommandations — les quatre chiffres sur une ligne au téléphone ; le détail d’une parcelle replié ; la bande de la Cave inchangée (elle est sur toutes les sections, elle se traitera avec Cave › Aujourd’hui) ; Ensemble et Courbes perdent aussi la phrase d’explication.
- **Parcelles, l’écran le plus chargé de la Cave** : 506 mots au téléphone (522 sur ordinateur), 9 phrases de 15 mots et plus, 4 112 px (4,9 écrans). Le détail de chaque parcelle (`_mlRdtDetail`) était **ouvert d’office** : « 0 % des kilos ont un volume connu. Les 6800 kg restants sont estimés à 48,6–52,3 hL, d’où la fourchette. Il se figera au décuvage. » — 20 mots, six fois. Deux paragraphes de méthode à demeure (« Ce qui se déclare… », 27 mots ; « Le trait vertical… », 17), que les « i » `cave.aoc` et `cave.rdt` disaient déjà. Les filtres à zéro (« Au-dessus du maximum 0 », « Encore sur pied 0 »).
- **La tête, commune aux quatre onglets** : 18 mots avant le premier chiffre (« Le Millésime montre celui de la campagne en cours (2026). Choisir une année la choisit pour toute la Cave. ») ; la case « Surface récoltée » **illisible** — `_pcavK(…,1)` la mettait en avant (`.pcav-k.dark`), `styles.css` avait passé son fond au clair (`--accent-doux`) mais pas son titre ni son unité (crème à 55 %) ; au téléphone, les quatre cases en 2 × 2 (244 px).
- **Cuvées, au téléphone** : la fiche de la première cuvée s’affichait sous la liste alors qu’aucune n’était ouverte, avec un « Toutes les cuvées » qui ramenait à la même page — `.pcav-card.mlc-fiche{display:none}` ne visait que l’ancienne section, pas le `div.mlc-fiche` posé par CAVE-RANGE-3 (§452). Dans la fiche unique (volet Volumes & origine), le nom écrit deux fois (l’en-tête du Chai, puis `.mlc-fh`). L’en-tête d’une cuvée écrivait « 50.0 hL » (`toFixed(1)`). 182 mots, 2 071 px.

### 605b. Ce qui change

- **La phrase de l’onglet** (`_mlPhrase`), à la place des 18 mots, dans `#cave-milnote` juste sous la ligne d’écran (`_caveMillNoteHtml` la rend, `_mlPhrasePose` la repose à chaque dessin du Millésime — un changement d’onglet ne passe pas par la barre). Parcelles : « **8 parcelles récoltées, 3 sans maximum, 6 estimées** » — au-dessus du maximum (rouge), encore sur pied (orange), sans maximum (orange), estimées ; « aucune au-dessus du maximum » seulement quand tous les maximums sont posés. Cuvées : « **3 cuvées, 2 encore en cuve, 1 en élevage** », « 1 volume à mesurer » en orange. ★ Elle **lit** `_mlRendements`, `_mlResteARentrer`, `_pcrbCvLignes` : aucun calcul de plus. Ensemble et Courbes n’en ont pas encore (leur lot). La grammaire de la phrase du Pilotage (`.ml-ph`, 17 px, `b.ko` / `b.or`).
- **La tête** : l’explication part dans un « i » neuf à côté de « Le millésime » (`MV_INFO['cave.millesime']`, qui dit aussi les quatre chiffres) ; plus de case mise en avant ; au téléphone, **les quatre chiffres sur une ligne** (`.ml-tu`, comme la bande de la Cave : 244 → 96 px), leurs petites lignes (« 8 parcelles », « dont 4 500 kg vendus », « 22 barriques ») sur ordinateur seulement.
- **Parcelles** : les deux paragraphes de méthode partent (leurs « i ») ; un filtre vide ne se montre pas (« Toutes » et le filtre choisi, toujours) ; « Maximum non renseigné » → « sans maximum ». ★ **Une parcelle tient en une ligne** (`.mlp-r` > `button.mlp-l` + `div.mlp-d[hidden]`) : la ligne garde ce qui se compare (hL/ha, surface, kilos, la barre face au maximum, estimé ou mesuré) ; toucher ouvre le détail (`_mlParcDet`, `aria-expanded`), l’ouverture est retenue par nom (`_mlParcOuv`) d’un dessin à l’autre. « Toucher pour poser le maximum » (la ligne entière appelait `_mlSetRdtMax`) devient « **Poser le maximum 2026** » / « Changer le maximum » dans le détail, administrateur seulement, avec « Maximum 2026 : 55 hL/ha · Bourgogne » (l’origine quitte la ligne). Un chevron dit que la ligne s’ouvre.
- **Le détail** (`_mlRdtDetail`) : une phrase courte par état — « **Mesuré** : 22,6 hL pour 3 100 kg, soit 137 kg/hL. » ; « **Pas encore mesuré** : 48,6–52,3 hL estimés pour 6 800 kg. Se fige au décuvage. » ; « **29 % des kilos mesurés** ; le reste, … kg, estimé à … hL. … » ; « Se fige au retour du client. » pour le raisin vendu. Les trois écarts de surface restent écrits en entier (rares, à corriger).
- **Cuvées** : la liste seule au téléphone (`.mlc>.mlc-fiche{display:none}`, l’ordinateur garde le côte à côte) ; dans la fiche unique, plus de `.mlc-fh` (le « i » `cave.cuvees` passe sur « De la récolte à la bouteille ») ; « 50 hL » (`_mvF1`) — la correction vaut aussi pour l’en-tête de la fiche au Chai.
- **Les mots** : `MV_AIDE` (« Le millésime » : la phrase, une ligne par parcelle ; « Le rendement maximum » : « dans Le Millésime, vue Parcelles, touchez la parcelle, puis « Poser le maximum » » — l’aide disait encore « La ligne de vie », un écran disparu au RANGE-1 §335) ; `MV_INFO['cave.rdt']` ; le guide (`08-cave`, même correction).

### 605c. Mesuré après (build, démo)

- Cliquet des mots (regravé, motif du lot) — Parcelles : **506 → 174 mots** au téléphone, **522 → 200** sur ordinateur, phrases de 15 mots et plus **9 → 0**, mots avant le premier grand chiffre 18 → 5 ; Cuvées : **182 → 88** au téléphone (la fiche ne s’affiche plus sous la liste), 179 → 156 sur ordinateur, 18 → 6. Ensemble et Courbes, par la tête commune : 199 → 171 et 327 → 299 mots au téléphone, 18 → 0 avant le premier chiffre.
- Hauteur au téléphone : Parcelles **4 112 → 2 203 px** (4,9 → 2,6 écrans), Cuvées 2 071 → 1 114 px ; les quatre chiffres 244 → 96 px, la liste des parcelles commence à 517 px au lieu de 668.
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : une parcelle s’ouvre, se referme, reste ouverte quand on change de filtre ; « Poser le maximum 2026 » est dans son détail ; au téléphone, Cuvées montre la liste seule, toucher une cuvée ouvre sa fiche, « Toutes les cuvées » ramène à la liste.
- La chaîne complète : 802 commandes, 0 rouge. `ux`, `gabarit`, `debord` verts sans regraver.
- La démo du site : la capture `r-chai-millesime` (Le Millésime au téléphone) régénérée — sans les 18 mots, les quatre chiffres sur une ligne.

### 605d. Harnais

`scripts/mv-harnais-mots12.mjs` (24 assertions, 26 contre-épreuves) : la phrase jouée (Parcelles, les cas rouge / orange / tout posé ; Cuvées ; rien sur Ensemble, Courbes, ni au Chai) et sa source ; la tête ; Parcelles (les paragraphes, les filtres, la ligne et son détail, l’ouverture jouée, le bouton du maximum) ; le détail ; Cuvées ; l’aide, le « i », le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `caverange1` (la barre porte la phrase de l’onglet, l’explication est dans le « i » `cave.millesime` ; une contre-épreuve neuve), `tete4b` (idem), `hlha1` (« 6 parcelles » au lieu de « 6 parcelles récoltées »), `range1` (`_mlParcOuv` ; trois filtres au lieu de quatre quand rien n’est sur pied), `rdtmil` (le bouton du détail passe `_escAttr(nom)` ; l’année du plafond se lit dans « Maximum 2026 » et « Poser le maximum 2026 »). `tutos-couverture.json` : `_mlParcDet` exempté (il déplie sur place, comme `_homeDirectTout`) — le compte des gestes sans tuto reste à 793. La chaîne a aussi trouvé un repli de police manquant sur la phrase (`var(--font-ui)` nu, règle de `police`) : corrigé.

### 605e. Restes, à leur lot

- Non vu à l’écran (la démo ne les a pas) : une parcelle au-dessus du maximum, une parcelle encore sur pied, un volume entonné à mesurer — joués par le harnais seulement.
- La bande de la Cave (« ≈ 182 hL en cuve · 43 fûts en vin · 5 à faire · 36 t rentrées ») et sa note restent au-dessus du millésime : « 36 t » y est deux fois. Lot Cave › Aujourd’hui.
- Le second lot du Millésime (Courbes, Ensemble) : leur phrase, la légende des Courbes (170 mots, §580).

### 605f. Leçons

- ⚠️ **Un style qui change le fond doit changer le texte posé dessus** : `.pcav-k.dark` est devenu clair dans `styles.css` (CHARTE), son titre et son unité sont restés crème — la case la plus mise en avant était la seule illisible. Le harnais du contraste n’a pas rougi : le fond est dans `styles.css`, la couleur du titre dans la feuille que `cave.js` pose à l’exécution — deux feuilles.
- ⚠️ **Un sélecteur écrit pour une balise ne suit pas sa remplaçante** : CAVE-RANGE-3 a remplacé `section.pcav-card.mlc-fiche` par `div.mlc-fiche` ; la règle qui cachait la fiche au téléphone visait encore la section. Chercher la règle d’affichage quand on change la balise d’un bloc qui se cache.

## 606. ★★ VITRINE-3 — LA PAGE LOGICIEL-VIGNE RESSERRÉE POUR MENER À L’ESSAI : DEUX SECTIONS EN DOUBLE RETIRÉES, DES ONGLETS AU TÉLÉPHONE, UN ESSAI PAR FORMULE, LA PÉRENNITÉ RÉPONDUE (24/11 — `public/logiciel-vigne.html` · `public/llms.txt` · `public/essai.html` · `public/images/nicolas-gueret.webp` (neuve) · `scripts/mv-harnais-vitrine3.mjs` (neuf) · `scripts/mv-harnais-cuivre7.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **aucun bump** : page du site, scripts et documentation · base `eef4b5a`)

**La demande.** Nico (24/11) colle un cahier des charges issu d’un audit UX et rédactionnel de la page : garder le ton, la charte, aucune dépendance, aucun faux témoignage ; « Voir la démo » dans l’en-tête sur PC ; un sous-titre lisible en cinq secondes ; des onglets cliquables sur le téléphone du haut ; le prix du bandeau qui annonce la mise en route ; retirer « Cinq endroits pour une seule vérité » (la page montrait quatre fois les mêmes écrans) ; un ordre de sections imposé ; la phrase de l’ancien chiffre faux remplacée ; un portrait ; une objection sur la pérennité ; un essai par formule ; l’essai et la mise en route enfin distingués. Reformulé, confirmé (« Oui »).

### 606a. Ce que la lecture du dépôt a changé avant d’écrire (cinq points soumis à Nico, « Oui » à mes propositions)

- ⚠️ **L’adresse « propre » demandée (`/logiciel-vigne`) aurait été une erreur** : `firebase.json` renvoie déjà `/logiciel-vigne` vers `/logiciel-vigne.html` (301), et `mv-sitemap.mjs` exige un canonical en `.html`. Un canonical sans `.html` aurait désigné une adresse qui redirige. **Gardé : `.html` partout** (logo, canonical, `og:url` étaient déjà cohérents). Passer le site en adresses sans `.html` = un lot à part (`firebase.json`, sitemap, `llms.txt`, liens).
- ⚠️ **« La plus choisie » sur Vigneron : invérifiable** avec le nombre de clients d’aujourd’hui — la même faute qu’un faux témoignage. Et le 06/11 Nico voulait orienter vers Domaine. Livré d’abord sur Vigneron (« Avec le registre 2027 ») faute de réponse ; **Nico (24/11) : « j’avais dit de ne pas mettre en avant d’offre, mais s’il faut choisir c’est Domaine »** → **Domaine en avant**, badge « La plus complète » (un fait : tout Vigneron, plus le planning, le pilotage, la cave). Ne mettre aucune carte en avant = retirer la classe `mise`, le badge, et repasser le bouton de Domaine en trait.
- **La liste cible retirait aussi « Quatre écrans, quatre questions »** sans le dire, et ne citait pas « Pour quels domaines » : les deux retirés / gardé à côté de « Qui écrit » (confirmé).
- ⚠️ **« Import intégral du parcellaire » contredisait les décisions du 06/11** (contours sans KML ni Telepac et reprise des données en options payantes, jamais mises en ligne) et **l’annualisation n’existe qu’en Domaine** : écrit « l’import de tout votre parcellaire depuis Telepac ou KML » et « (et de l’annualisation en formule Domaine) ». La FAQ « Je n’ai pas de parcellaire numérique » (création comprise) reste telle quelle : tarifs en ligne (décision du 23/11, §598).
- **L’objection « Et si j’arrête ? »** existait déjà : **fusionnée** dans la nouvelle question. « Infrastructure cloud européenne autonome » aurait été faux (c’est Google Cloud, et l’hébergement des fichiers du site est un réseau mondial) : écrit « vos données sont hébergées en Europe, chez Google Cloud ». La promesse de support en saison : écrite d’abord prudemment, à valider ; **Nico (24/11) : « je réponds dans les 24 h »** → « Et même en vendanges, je vous réponds sous 24 heures. » — la même promesse qu’`essai.html` (« Nicolas vous répond personnellement sous 24 heures »).
- ⚠️ **L’essai « sur un échantillon » contre §503c** (Nico, 31/10 : l’essai est installé en mode définitif, rien à refaire ensuite). Les deux tiennent ensemble : étape 2 « sur vos parcelles, en conditions réelles, sans carte bancaire : un échantillon suffit pour juger » ; étape 3 « rien de ce qui a été posé n’est à refaire. Le forfait unique couvre… ». `essai.html` et `llms.txt` restent vrais.
- ⚠️⚠️ **La phrase des tests demandée (« heures d’équipe, coûts par parcelle, cumul de cuivre sur sept ans — vérifié automatiquement… ») était à moitié fausse** : heures (`releve`, `majoration`) et coûts par parcelle (`temps-vigne`, `revient`) sont joués dans la chaîne ; le cuivre de l’année aussi (`phyux1`) ; **le cumul glissant de sept ans, non** — `_cuParcRollSum` n’était joué par aucun harnais, `_cfmCuivre` n’existait dans la chaîne que remplacé par un bouchon (`coher1`). **Plutôt qu’affaiblir la phrase, le test a été écrit** : `mv-harnais-cuivre7` (ci-dessous). La phrase est vraie dès que ce lot est dans la chaîne.
- Vérifiés pour la réponse sur la pérennité : `dailyFirestoreExport` (2 h) et `weeklyTenantJsonBackup` (malgré son nom, `0 3 * * *` : chaque jour) → « sauvegardées chaque nuit » ; CGU 5.3 (export JSON à tout moment) et l’article de résiliation (cessation d’activité du prestataire : **préavis de trois mois**, données gardées **90 jours**) ; `exportJSON` et les exports CSV/PDF dans Réglages › Documents.

### 606b. Ce qui change

- **En-tête** : « Voir la démo » (trait) à gauche de « Demander un essai », qui passe en bouton plein (le principal de l’en-tête) — dans `.barre-actions`, à partir de 900 px ; **le panneau du téléphone dans le même ordre et les mêmes styles** (démo trait, essai plein). Le haut de page garde « Voir la démo » en plein : il invite d’abord à regarder. Menu : L’application (`#journee`), Registre 2027, Présentation, Questions, Tarifs ; panneau : + « Les modules » (`#lieux`). Le carnet et les trois lieux allument « L’application » (`data-nav`).
- **Haut de page** : le sous-titre court ; « Découvrir Ma Vigne » mène à la journée de juin (« Qui écrit » est descendu). **Quatre onglets** au-dessus du téléphone (`role="tablist"`, boutons `role="tab"` avec `aria-controls`, les écrans en `role="tabpanel"`, les trois cachés en `aria-hidden` + `inert`, un seul arrêt de tabulation) : ils suivent le défilement ; **un appui choisit l’écran, arrête le défilement et rejoue son geste une fois** ; flèches, Début, Fin au clavier ; arriver au clavier sur les onglets fige l’écran affiché ; le bouton sous le téléphone dit « Reprendre le défilement » (repart de l’écran affiché) ; en pause, un onglet change l’écran sans l’animer. Le téléphone n’est plus `aria-hidden` en bloc : seuls la barre d’état, le dock, le doigt et le message le sont.
- ★ **Trouvé en route — le doigt et « Avancement enregistré » ne s’affichaient jamais** : `demo()` jouait l’écran regardé, PUIS remettait les autres à zéro ; Phyto et Cave posent l’opacité du doigt et du message à 0, et Tracteur déplaçait le doigt sur son bouton. Ordre inversé (`reposerSauf` d’abord) : relevé dans Chrome, opacité max 1 pour les deux, captures à l’appui.
- **Bandeau** : « De 29 à 79 € par mois, sans coût par utilisateur (+ mise en route unique). »
- **Sections** : retirées « Cinq endroits pour une seule vérité » (`#fonctions` : le fil, le registre, la cuve — tous montrés ailleurs) et « Quatre écrans, quatre questions » (`#ecrans`), **leur style et leur script avec elles** (≈ 22 ko). Ordre : haut, bandeau, journée de juin, registre 2027, ce qu’un carnet…, trois lieux, qui écrit + pour quels domaines, objections, tarifs, suite.
- **Qui écrit** : la phrase des tests à la place de « Et quand un chiffre est faux… » ; un **portrait rond** (`/images/nicolas-gueret.webp`, affiché en 64 px) sur des initiales « NG » : si la photo manque ou ne charge pas, le script la retire et les initiales restent (jamais d’image cassée). La photo : fournie par Nico le 24/11, recadrée carrée sur le visage (le voisin de droite hors cadre), 512 px, webp, 15 ko. **Retours terrain** : un bloc complet (titre, trois cartes, style prêt) **en commentaire HTML**, avec la règle et le geste pour l’afficher — rien n’est affiché, rien n’est inventé ; pas de balisage `Review` (Google ignore les avis qu’un site publie sur lui-même).
- **Objections** : « Et si vous êtes sous l’eau pendant les vendanges, ou si vous arrêtez ? » remplace « Et si j’arrête ? » ; le JSON-LD porte la même question et **la même réponse au mot près** (le harnais compare).
- **Tarifs** : `id="formules"` (le JSON-LD renvoyait à `#formules`, **ancre absente depuis toujours**) ; un bouton par carte vers `/essai.html?formule=essentiel|vigneron|domaine` ; **Domaine** : bordure, badge « La plus complète », bouton plein.
- **`essai.html` lit `?formule=`** (proposé, « ta propo », Nico 24/11) : `FORMULES` et `cocherFormule()` cochent d’avance le contenu de la carte — Essentiel : travaux, météo ; Vigneron : + tracteur, phyto ; Domaine : + planning, pilotage, cave (les sept modules ; **pas « Pas encore sûr·e »**, que j’avais proposé avant de lire son libellé), la consigne dit « Cochés d’après la formule … — décochez ou ajoutez », les blocs liés aux modules s’ouvrent (`syncConds`). Les cases cochées partent déjà dans la demande (`modules`, `functions/leads.js`) : Nicolas voit de quelle carte vient le prospect, sans toucher aux fonctions. Formule inconnue ou absente : rien de coché. Joué dans Chrome pour les cinq cas.
- **Comment ça se passe** : étapes 2 et 3 (606a). **`llms.txt`** suit : l’annualisation en Domaine, l’échantillon, « sauvegardé chaque nuit », le préavis et les 90 jours.

### 606c. Mesuré

- Hauteur de la page (Chrome sans tête, `?still`) : **375 px 20 773 → 17 855 (−14 %)**, 768 px 15 825 → 13 322, 1 280 px 11 308 → 9 261, **1 440 px 11 681 → 9 487 (−19 %)**. Fichier 132 → 110 ko, 1 327 → 1 127 lignes.
- Aux cinq largeurs (375, 768, 1 100, 1 280, 1 440) : aucune erreur de page, aucun débordement horizontal ; la barre tient à 1 100 px (marque, cinq liens, deux boutons : 988 px). Les onglets joués dans Chrome : défilement seul 0→3, clic sur Phyto → écran 2 figé 5 s, `aria-selected`/`tabindex`/`aria-hidden`/`inert` à jour, flèche droite → Cave (focus suit), Début → Vigne, « Reprendre le défilement » repart, pause puis Cave → l’écran change. Contrastes : onglet 7,7 et 9,3 ; badge 9,3 ; initiales 7,7.
- Le bloc des retours testé décommenté (sur une copie jetable) avec une photo : rendu propre ; la photo transparente laissait voir les initiales → fond opaque sous la photo.
- `mv-harnais-vitrine3` : **33 assertions, 26/26 contre-épreuves** (essai.html compris) ; `mv-harnais-cuivre7` : **8 assertions, 7/7** ; `mv-harnais-demo` 13 + 11/11, `mv-harnais-subset` vert (dette inchangée, 239), `mv-harnais-icones` 27 (un ⚠ glissé dans un commentaire de script avait fait monter la page 1 → 2 : retiré), `mv-sitemap --check` 19 vert · 1 attention (le `lastmod`, refait par `npm run site`).

### 606d. Restes

- **À faire chez Nico** : `npm run site` → `npm run build` → `firebase deploy --only hosting` ; Search Console : demander l’indexation de la page.
- Les trois pages « cas d’usage » (GEO-2) ont l’ancien en-tête (essai en trait, sans démo) : à aligner si Nico le veut.
- Toujours ouverts (§503e) : les titres en formules (« Le logiciel ne se voit pas… ») ; `harnais-vitrine.mjs` et `contre-epreuves.mjs` décrivent la page d’avant VITRINE-1, hors chaîne — `mv-harnais-vitrine3` les remplace pour ce qui compte ; les animations du carnet tournent en boucle sans bouton de pause (le bouton du haut ne règle que le téléphone).
- Déjà mortes avant ce lot, laissées : les classes `.lab`, `.onde`, `.theme` du style de la page.
- Hors chaîne et **déjà rouges sur la base** (vérifié en remettant l’`essai.html` d’origine) : `harnais-parcours-prospect.mjs` (2 rouges sur 58, la pastille des pièces jointes d’`admin-gt.js`) et `harnais-essai-borne.cjs` (s’arrête sur une erreur Node). Pas touchés.

### 606e. Leçons

- ⚠️ **Une phrase de vente qui promet un contrôle se vérifie dans la chaîne, pas dans la mémoire** : « vérifié par des tests » était vrai pour deux calculs sur trois. Le bon geste était d’écrire le test, pas d’enlever le cuivre de la phrase.
- ⚠️ **Un mutant qui remplace la première occurrence d’un texte peut toucher une autre fonction** : `return p && p.statut!=='Arrachee';` existe trois fois dans `pilotage.js` ; la contre-épreuve restait verte. Les mutants de `cuivre7` visent la fonction (`dans(fichier, fonction, a, b)`).
- ⚠️ **Une animation peut être juste et ne jamais se voir** : le doigt et le message du téléphone étaient dessinés, réglés, puis éteints dans la même image par l’écran suivant. Seule la mesure dans le navigateur (l’opacité relevée) l’a montré.
- ★ **Un cahier des charges collé se relit contre les décisions déjà prises** (§503c, 06/11, 23/11) : trois de ses demandes les contredisaient sans le savoir.

## 607. ★★★ MOTS-13 — CAVE › LE MILLÉSIME, ENSEMBLE ET COURBES ALLÉGÉS : UNE PHRASE, LA MÉTHODE DANS LE « i », NEUF DÉFAUTS D’AFFICHAGE (24/11 — APP 11.29, SW 12.20 — `src/cave.js` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/08-cave.html` · `docs/maquettes/maquette-millesime-courbes-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots13.mjs` (neuf) · `crb2`, `range1` suivis · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · la capture `r-chai-millesime` de la démo du site)

### 607a. D’où ça vient, ce qui a été mesuré avant

- Le second lot du Millésime (§605 : « Les années » du plan lu comme Ensemble, dit à Nico, pas contredit). Maquette `maquette-millesime-courbes-v1.html` (Avant / Après, téléphone et ordinateur : Ensemble, le parcours, Densités, Maturités, Températures) ; Nico : « go », avec les trois recommandations — la phrase d’Ensemble et la carte « À surveiller » ensemble ; la méthode des Courbes dans le « i » ; une phrase sur Courbes aussi.
- **Courbes, la page la plus longue de la Cave sur ordinateur** (les quatre graphes ensemble) : 747 mots, 9 phrases de 15 mots et plus, 2 359 px. Sous chaque graphe une **note jaune de méthode** (`.pcrb-note`) : ≈ 150 mots aux densités (le couloir, l’interpolation, le classement, le seuil de vin sec), ≈ 90 aux températures, ≈ 60 aux maturités et à la malo — le « i » `cave.courbes` en disait déjà presque tout. Au téléphone : Densités 299 mots, Maturités 191, Températures 222, Malo 152.
- **Ensemble** : 171 mots au téléphone ; le pied du parcours (47 mots) redisait les barres (« 182 hL fermentent encore, 50 hL sont déjà descendus au chai ») puis la méthode. Ni Ensemble ni Courbes n’avaient de phrase sous les onglets depuis §605.
- **Neuf défauts d’affichage**, vus sur les captures :
  1. **Le parcours débordait au téléphone** (`_mlFluxSvg`) : la plus grande barre allait jusqu’à `W − 2·PAD`, son chiffre se posait dessus (« 266,3 » sur le brun, « hL » coupé) et le « vendu 33,3 hL » sortait du cadre ;
  2. son **étage projeté** (« En bouteille · projection 6667 cols ») était écrit crème sur un rectangle à 28 % d’opacité : presque invisible ;
  3. une fois les barres resserrées, **« En fût »** ne tenait plus dans la sienne ;
  4. les **milliers collés** (« 35950 kg », « 6667 cols ») ;
  5. **la légende des maturités collée en un bloc** (« En Bertrange238 g/L… par jourVieilles Vignes226… ») : `.mvmat-*` vit dans `_caveV2InjectCss`, posée par Le Cuvier et Le Chai — pas par Le Millésime, ni par Aujourd’hui qu’on traverse pour y venir ;
  6. **le graphe des maturités dessiné 28 px plus large que sa boîte** au téléphone : `.pcrb-g` déborde de ses gouttières (`margin:0 −14px; padding:0 14px`), le registre des graphes mesure la largeur PADDING COMPRIS (360) et dessine à 360 dans une boîte de 332 — les derniers points et « Agrandir » coupés, à faire défiler. CRB-2 l’avait corrigé pour le couloir seul (`.crb-g`) ;
  7. **« jours depuis l’encuvage » recouvrait J8 et J12** (`_crbEnvSvg` : l’unité et les graduations sur la même ligne) ;
  8. **« décuvée 26/10 »** dans le serif des titres (`.pcrb-sec`) au milieu des chiffres en Outfit ;
  9. **le choix de la courbe** : quatre gros boutons sur deux lignes au téléphone.

### 607b. Ce qui change

- **La phrase d’Ensemble** : « **2 cuves en fermentation, tout est rentré** » — au-dessus du maximum (rouge), volumes à mesurer et parcelles sur pied (orange), cuves en fermentation ; « tout est rentré » seulement quand rien ne demande un geste ; « Rien à signaler » sinon. ★ **Une liste, deux lecteurs** : ce qu’il y a à surveiller sort de `_mlBlocVeille` dans `_mlVeille(mil,d)` (les éléments, les sur-pied, les cuves en fermentation, `nMes`, `nD`, `rentre`) ; la carte l’écrit, la phrase le compte. La carte « À surveiller » reste, avec ses boutons.
- **La phrase des Courbes** : « **2 cuves en fermentation, 1 décuvée** » — les comptes de la tête (`_mlEtat` rend maintenant `nElev`, `nBtl`, `dec`) ; « décuvée » seulement à côté des cuves qui fermentent ; puis « 3 cuvées en élevage », « en bouteille ».
- **Les notes de méthode quittent l’écran** : densités (il reste l’écart, raccourci : « 2 cuves ne figurent pas ici : pas de date d’encuvage, ou moins de deux relevés de densité »), températures (le manque de relevés), maturités (rien), malo (les cuvées absentes, les tracées). `_crbNoteInterp` part (plus appelée). Le « i » `cave.courbes` reçoit ce qu’il ne disait pas : « appuyez sur un graphe » et la même cuve sur les deux graphes ; le seuil de vin sec selon le degré (12° → 994, 14° → 992) ; la fenêtre de 18 à 30 °C et l’alerte de Ce qui presse ; l’axe de dates des maturités, par parcelle ; la cuvée sans date d’entonnage. L’interpolation reste dite à l’écran : le « ~ » de l’étiquette du jour, et le « i ».
- **Plus court** : le sous-titre des températures (22 → 6 mots), celui des densités ; l’aide des puces (« Touchez-en une seconde pour comparer. », « Une troisième relâche la première. ») ; la légende (« Zone dorée : du minimum au maximum. Pointillé : la médiane. Trait plein, tireté : vos cuves. Bande verte : de 18 à 30 °C. »).
- **Le parcours** : une colonne de 72 px pour les chiffres (`COL`), les barres s’arrêtent avant ; un étage projeté ou plus étroit que 130 px écrit son nom à côté, en foncé ; `_pcrbCvEnt` pour les kilos et les cols. Le pied ne garde que l’état (« La perte totale se lira quand tout sera décuvé. », les cas sans récolte, la perte finale) ; « Les deux premiers étages sont des kilos convertis… » part dans un « i » neuf, `MV_INFO['cave.flux']`.
- **Les défauts** : `renderCaveMillesime` pose `_caveV2InjectCss()` (gardée par son id) ; les slots des maturités et de la malo prennent `crb-g` (sans débord) ; `_crbEnvSvg` : `padB` 32 → 46, graduations à `pT+ih+18`, unité à `c.h−6` ; `.pcrb-sec` en `--font-ui` ; `.mlx-chips.pcrb-sel` sur une ligne qui défile au téléphone.
- **Les mots** : `MV_AIDE` (« Le millésime » : la phrase d’Ensemble, la méthode dans le « i ») ; le guide (`08-cave` : les quatre phrases, le « i » du parcours, la méthode des Courbes dans son « i »). Pas touché : la phrase des maturités « En Bertrange est la plus avancée… » (le graphe et sa légende sont ceux du Cuvier, `cuvier.js/_matLegende`).

### 607c. Mesuré après (build, démo)

- Cliquet des mots (regravé avec `--accepte`) — Courbes : **747 → 284 mots** sur ordinateur (les quatre graphes), phrases de 15 mots et plus **8 → 2** (la légende et l’ordre des maturités) ; **299 → 115** au téléphone (Densités). Ensemble : **171 → 140** au téléphone, 181 → 150 sur ordinateur, 1 → 0 phrase longue. ★ **Hausse voulue, écrite dans la référence** : les mots avant le premier grand chiffre passent de 0 à 6 (Ensemble) et de 0 à 4 (Courbes) — c’est la phrase du haut, comme Parcelles (18 → 5) et Cuvées (18 → 6) au lot d’avant ; objectif ≤ 15. Le relevé de la maquette comptait 9 phrases longues sur Courbes (son propre compteur) ; le cliquet en compte 8.
- Relevé de la maquette, au téléphone : Maturités 191 → 118, Températures 222 → 89, Malo 152 → 91 ; Courbes sur ordinateur 2 359 → 1 824 px ; Densités au téléphone 1 927 → 1 436 px.
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : les deux phrases ; le « i » du parcours s’ouvre (« De la vigne à la bouteille ») ; toucher une seconde cuve change l’aide ; aucun débordement de la page au téléphone (le choix de la courbe débordait de 2 px dans le premier prototype : corrigé avant la maquette).
- La chaîne complète : 808 commandes, 0 rouge. `ux`, `gabarit`, `debord` verts sans regraver.
- La démo du site : `r-chai-millesime` régénérée (la phrase d’Ensemble en haut).

### 607d. Harnais

`scripts/mv-harnais-mots13.mjs` (19 assertions, 26 contre-épreuves) : les deux phrases jouées (les cas rouge, orange, « tout est rentré » refusé quand un volume manque, « Rien à signaler » ; Courbes en fermentation, en élevage, en bouteille) et leur source unique ; le parcours joué à 360 px (barres et « vendu » dans le cadre, étages pâle et étroit en foncé, milliers) ; son pied et son « i » ; les notes de méthode parties et le « i » complété ; les textes courts ; les cinq défauts de style ; l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `crb2` (l’interpolation est dite par le « ~ » de l’étiquette et le « i », plus par une note sous deux graphes), `range1` (la liste « À surveiller » vit dans `_mlVeille`).

### 607e. Restes

- Non vu à l’écran : une parcelle au-dessus du maximum, un volume à mesurer, des parcelles sur pied (Ensemble) ; un millésime tout en élevage (Courbes) — joués par le harnais seulement.
- Le Millésime est fini (quatre onglets). Suivent dans le plan (§28) : Cave › Aujourd’hui (la bande de la Cave, « 36 t » deux fois sur Le Millésime), Phyto › Registre, la Réserve, le lot de balayage.

### 607f. Leçons

- ⚠️ **Une feuille de style posée par un autre écran n’existe pas pour celui qu’on ouvre en premier** : la légende des maturités était juste au Cuvier, collée au Millésime — selon le chemin pris. Un écran pose lui-même toutes les feuilles des pièces qu’il emprunte.
- ⚠️ **Un graphe qui déborde « volontairement » de sa gouttière doit être dessiné à la largeur de sa boîte, pas de son cadre** : le registre mesure le cadre. CRB-2 avait corrigé un graphe sur quatre ; les trois autres gardaient le défaut.

## 608. ★★★ TARIF-1 — LA GRILLE TARIFAIRE REFAITE ET DITE PAREIL PARTOUT : LE PLANNING EN VIGNERON, UNE MISE EN ROUTE UNIQUE À 250 €, LE TÉLÉPHONE ET WHATSAPP, UN MODÈLE EXCEL GRATUIT DU REGISTRE 2027 (25/11 — `src/firebase.js` · `src/admin-gt.js` · `src/gt/console.html` · `public/logiciel-vigne.html` · `public/essai.html` · `public/llms.txt` · `public/registre-phytosanitaire-2027.html` · `public/suivi-temps-travail-vigne.html` · `public/gestion-equipe-viticole.html` · `public/downloads/registre-phyto-2027-mavigneapp.xlsx` (neuf, fabriqué) · `guide/03-formules.html` · `public/guide.html` (regénéré) · `docs/geo-kit.md` · `docs/claude/modules.md` (§26) · `scripts/mv-registre-modele.mjs` (neuf) · `scripts/mv-harnais-tarif1.mjs` (neuf) · `scripts/mv-harnais-vitrine3.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **aucun bump** : deux modules, du site, des scripts et de la documentation ; « sans bruit » (Nico) · base `71a4311`)

### 608a. La demande, et ce que l’avis a changé

- Nico (24/11) colle un cahier des charges en trois parties (accès direct téléphone / WhatsApp ; un modèle Excel gratuit du registre 2027 ; une grille refaite avec une mise en route unique de 250 €) et demande **un avis comparé aux grands du secteur** avant d’écrire. Reformulé, confirmé (« Oui »).
- **Le comparatif (sources publiques, 24/11)** : Ok César, le plus proche (vigne + cave + registre), n’a **aucun frais de mise en place obligatoire** (formation 300 € à distance, 500 € sur place ; reprise des données 300 €) mais 59 € par module pour un utilisateur et 169 € le pack pour cinq ; **ni téléphone ni WhatsApp** sur sa page de tarifs. Baqio : mise en place 150 ou 350 €, import 500 €. Vitisoft : licence de 600 à 2 500 €. Mes Parcelles : mise en service comprise dans l’abonnement de la chambre. Le ministère publie sa notice, son annexe en tableur, les listes des cultures et des stades BBCH, et annonce une appli gratuite début 2027 ; des chambres et des concurrents donnent déjà un modèle Excel. **Conclusions dites à Nico** : 250 € est dans la norme, 490–990 € était haut pour un abonnement sans licence ; le prix mensuel n’est pas le frein ; le téléphone direct est un vrai plus ; le modèle ne se distinguera que par sa justesse ; le suivi des heures est ce qui distingue Ma Vigne (aucun logiciel viticole du comparatif Hackceleration ne le cite) — le mettre à 29 € le bradait.
- ⚠️⚠️ **Ce que le cahier ne voyait pas, trouvé dans le dépôt** :
  1. **les heures et le planning n’étaient séparés que dans le texte** : « Suivi des heures » en Essentiel et « Planning d’équipe » en Vigneron, alors que le relevé d’heures, l’annualisation et la grille vivent tous dans `planning.js`, ouvert en bloc par `_planModule('planning')`. Les séparer = un vrai chantier de code. **Proposé et retenu (« Ok pour les reco »)** : tout le Planning en Vigneron (49 €), Domaine garde Cave, Pilotage et Réserve ;
  2. **les anciens montants vivaient à onze endroits** que le cahier ne citait pas : trois pages « cas d’usage » (avec chacune deux cartes), `llms.txt`, le JSON-LD (offres et FAQ), la console GT (`_AGT_INST`, `_AGT_INSTH`, le libellé « X h incluses », le −50 % d’office), le guide (03), le kit des annuaires (`docs/geo-kit.md`, que Nico recopie dans Capterra et G2), §26 ;
  3. **« compris dans le forfait de mise en route »** pour les contours sans KML contredisait la décision du 06/11 (options payantes, jamais écrites en ligne) — Nico (25/11) : non compris, **60 €/h sur devis**, comme la reprise des anciennes données ;
  4. **« Conforme à l’arrêté »** sous un fichier qu’on distribue est une promesse juridique : écrit « Les colonnes de l’annexe II de l’arrêté du 24 décembre 2025 » ;
  5. **les « 15 colonnes réglementaires »** du cahier : « Horaires » en vaut deux (début, fin), « Substance active » et « Applicateur » ne sont pas dans l’annexe II, la cible et le mode d’application y sont (facultatifs). **L’export de l’appli était déjà juste** (`MV_PHY_CSV_COLS` : les 18 de l’annexe II dans son ordre, puis 8 colonnes en plus) : le modèle le reprend, et les étiquettes de la page qui disaient « dans l’ordre de l’annexe » sont corrigées (16 : les 18 avec dose + unité et latitude + longitude groupées).
- **Les quatre réponses de Nico (25/11)** : une demi-journée de formation comprise dans les 250 €, en visio ou sur place ; contours et anciennes données hors forfait, 60 €/h, devis ; **l’offre de lancement retirée** ; le changement de formule **sans bruit** (aucune annonce). « Deux offres ? » — non, trois : seul le contenu de Vigneron change.
- ★ **CLAUDE.md §1 disait le téléphone « volontairement absent des pages marketing »** : il était déjà dans le pied de `logiciel-vigne` et dans le JSON-LD. Corrigé, avec la demande de Nico.

### 608b. Ce qui change

- **L’appli** : `_planModule` — `planning` passe de `pr >= 3` à `pr >= 2`. Rien d’autre ne lit la formule (`_plan()` n’a pas d’autre lecteur, vérifié) ; aucune règle Firestore ne dépend du palier ; la fiche client ne garde que les écarts à la formule (`featOv`), donc aucun domaine n’a d’override à reprendre. Un client en Vigneron voit le Planning au prochain chargement, sans annonce (Nico).
- **La console** : `_FC_PLANDEF.vigneron.planning = true` ; les libellés de formule (fiche, création de domaine) ; `_AGT_INST` à 250 pour les trois ; `_AGT_INSTH` retiré, la ligne d’installation dit « Mise en route <formule> — demi-journée de formation incluse » ; l’aide des heures dit « Hors forfait : 60 €/h (contours sans KML ni Telepac, reprise des anciennes données, heures en plus) » ; **le geste commercial ne propose plus −50 %** : montant vide (le contrôle « Montant manquant » d’origine refuse un geste vide), libellé « Geste commercial sur … » ; le motif par défaut d’une remise d’abonnement devient « Tarif remisé ». Les factures et remises déjà posées ne bougent pas (données).
- **logiciel-vigne** : la méta, le bandeau (« + 250 € de mise en route unique »), les trois cartes (Vigneron : Planning, matériel, traitements et registre phyto 2027 ; Domaine : Cuvier et Chai, La Réserve, Pilotage ; « Mise en route 250 € une seule fois · demi-journée de formation comprise »), « Une seule fois », « Et c’est tout » (hors forfait, devis), les FAQ parcellaire / temps / prix (écran et JSON-LD), l’étape 3 (« l’annualisation dès la formule Vigneron »), les offres du JSON-LD (contenu de chaque formule, trois forfaits à 250). Le badge « La plus complète » reste seul, sur Domaine (24/11 ; le cahier en voulait deux). **La ligne de vive voix** sous les deux boutons de la fin ; **le téléphone et WhatsApp** dans l’intro des objections. **Le bouton du modèle** juste après « Ce que je ne vous dirai pas », sans formulaire (`download`), et son micro-texte. Les étiquettes des colonnes et la phrase de l’export.
- **Les trois pages « cas d’usage »** : les cartes et la note (250 €, demi-journée) ; suivi-temps-travail : le titre de la section prix (« Les heures dès Vigneron, le temps par parcelle avec Domaine »), quatre étiquettes « Vigneron et Domaine » (heures, heures sup, annualisation, relevé), la FAQ « Quelle formule » (écran et JSON-LD), la méta ; gestion-equipe : la phrase et la méta ; registre-2027 : **le même bouton du modèle** sous « Ce que je ne vous dirai pas », une phrase dans la FAQ « Suis-je obligé d’acheter un logiciel ? », la méta. Les trois : téléphone et WhatsApp dans l’intro des questions.
- **essai.html** : Vigneron coche aussi le planning. **llms.txt** : le tableau, la mise en route, la phrase du temps de travail, l’adresse du modèle, le contact WhatsApp. **guide/03-formules** : Planning RH sur la ligne Vigneron. **geo-kit.md** : six passages (FR et EN).
- **Le modèle Excel** (`scripts/mv-registre-modele.mjs`) : deux onglets. « Registre 2027 » : l’en-tête **lu dans `MV_PHY_CSV_COLS`** (vert : l’annexe II ; beige : ce que l’export ajoute), une ligne d’exemple grisée et marquée « à effacer », une aide par colonne au clic dans la case (validation « sans type » avec message), oui / non imposé pour la conduite biologique (comme l’export), SIRET et AMM en texte (un SIRET en nombre s’affiche en notation scientifique), date `jj/mm/aaaa`, horaires `hh:mm`, GPS à 5 décimales ; en-tête figé. « Mode d’emploi & Ma Vigne » : l’encadré (la page, la démo, le téléphone, en liens), les règles de saisie, le lien du ministère pour les listes officielles, le tableau colonne par colonne (format, quand). Une colonne ajoutée à l’export sans sa consigne fait refuser la fabrique. **Le ZIP est écrit à la main, entrées stockées, date fixe** : sans dépendance, et les mêmes octets sur toute machine — un ZIP compressé par le zlib de Node peut changer d’octets d’une machine à l’autre, ce qui aurait rendu `--verifier` faux.

### 608c. Mesuré

- `mv-harnais-tarif1` : **38 assertions, 22/22 contre-épreuves** — `_planModule` jouée pour les trois formules et comparée à la console, à essai.html, aux cartes des quatre pages, au guide, à llms.txt, au kit ; 250 € partout, aucun 490 / 690 / 990 ni volant d’heures ; l’offre de lancement absente ; le contact direct ; le modèle **rejoué octet pour octet**, son en-tête égal à l’export, ses liens. `mv-harnais-vitrine3` suit (④ ⑧ ⑨) : **33 assertions, 29/29** (trois mutants de plus).
- Preflight : **0 erreur, 29 avertissements — identique à la base** (rejoué sur `71a4311` dans un arbre à part). Console : `gtfix1`, `gtfix3`, `gtui5`, `gt1` verts.
- La chaîne complète (810 commandes, 637 s) : verte, sauf deux attendus du moment, corrigés ensuite — `harnais-claude-md` (le cliquet des sections relevé avant que §608 soit écrite) et `build-guide --check` (guide.html à regénérer après `guide/03-formules.html`).
- Le classeur : ouvert par openpyxl (2 onglets, 26 colonnes, la date et les heures en vraies valeurs, la liste oui / non, 4 liens) et rendu par LibreOffice en PDF (regardé : l’en-tête vert et beige, l’exemple gris, l’encadré, le tableau des colonnes). 38 212 octets.
- Les pages dans Chromium (375 et 1 280 px) : aucune erreur, aucun débordement horizontal ; regardés : le bouton du modèle (deux lignes au téléphone, `white-space:normal`), les cartes, la ligne de vive voix, l’étape 3 ; les trois pages « cas d’usage » à 375 px sans débordement.
- **Pas vérifié** : l’ouverture du classeur dans Excel sous Windows (seulement openpyxl et LibreOffice) — notamment l’aide au clic, que LibreOffice affiche ; le lien WhatsApp sur un vrai téléphone ; les pages aux largeurs intermédiaires (768, 1 100, 1 440).

### 608d. Restes

- **Chez Nico** : `npm run site` → `npm run build` → `firebase deploy --only hosting` ; Search Console : demander l’indexation de logiciel-vigne et de registre-phytosanitaire-2027. Ouvrir le classeur dans son Excel. Recopier les textes du kit (`docs/geo-kit.md`) dans Capterra / G2 / Appvizer si les fiches sont déjà remplies avec l’ancienne grille.
- Les clients déjà en Vigneron voient le Planning sans annonce (choix de Nico) : à lui de leur en dire un mot s’il le souhaite.
- Le modèle suit `MV_PHY_CSV_COLS` ; s’il change, `node scripts/mv-registre-modele.mjs` (le harnais rougit tant que ce n’est pas fait).
- La localisation du registre reste un point GPS (l’export de l’appli aussi) ; la note de la DRAAF BFC dit « n° d’îlot PAC ou coordonnées GPS d’un point ». Une colonne îlot / parcelle / commune (RPG) serait un lot à part, dans l’appli d’abord.

### 608e. Leçons

- ⚠️ **Un tarif écrit à sept endroits n’est cohérent que si un contrôle les relit tous contre l’appli.** Le cahier de Nico en citait trois ; il y en avait onze. Le harnais part de `_planModule` jouée, pas d’une liste recopiée.
- ⚠️ **Un découpage commercial qui sépare deux choses que le code tient ensemble est un chantier de code, pas une phrase** : « les heures en Essentiel, le planning en Vigneron » se lisait bien et ne se branchait pas.
- ★ **Un fichier distribué se fabrique depuis la même source que l’appli** : le modèle lit les colonnes de l’export ; un vigneron qui passe du tableur à Ma Vigne garde les mêmes colonnes, dans le même ordre.
- ⚠️ **Une règle de ce document peut être déjà fausse dans le dépôt** (le téléphone « absent des pages marketing » y était) : la relire contre le fichier avant de l’opposer à une demande.

## 609. ★★★ MOTS-14 — CAVE › AUJOURD’HUI ALLÉGÉ : CHAQUE CHIFFRE À UN SEUL ENDROIT, DEUX COMPTES FAUX DU SOMMAIRE (25/11 — APP 11.30, SW 12.21 — `src/cave.js` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` (regénéré) · `docs/maquettes/maquette-cave-aujourdhui-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots14.mjs` (neuf) · `cavux1` suivi · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · les captures `cave-pc` et `r-chai-accueil` de la démo du site · base `015d5c0`)

### 609a. D’où ça vient, ce qui a été mesuré avant

- Le plan (§28) après Le Millésime : Cave › Aujourd’hui, « la bête de course » du maître de chai (refonte CAVE-UX-1, §494 : trois colonnes sur ordinateur, le sommaire au téléphone — pas touchés). Maquette `maquette-cave-aujourdhui-v1.html` (Avant / Après, téléphone et ordinateur : le haut de l’écran, « Ce qui presse », les quatre semaines, « À surveiller », « Derniers gestes ») ; Nico (25/11) : « go, on suit tes recommandations » — les quatre.
- **445 mots au téléphone, 463 sur ordinateur, 2 phrases de 15 mots et plus, 4 023 px.** La page **redisait ses chiffres** : le sommaire répétait la bande de la Cave (« À faire », « Fûts » — « 5 à faire cette semaine », « 43 fûts en vin » juste au-dessus) ; le détail d’aujourd’hui, dans les quatre semaines, listait une seconde fois les cinq gestes de « Ce qui presse », puis « Les gestes du jour se font depuis « Ce qui presse », en haut de l’écran. » ; « Derniers gestes » répétait « Déjà fait aujourd’hui » (« Relevé de Cuve 3 · 1006 à 23 °C » deux fois). Les deux phrases longues : le verdict suivi de « Puis : 1 cuvée à ouiller · 2 cuvées ont fini leur malo. » (la liste juste dessous) et le pied « Calculé sur 3 cuves suivies et 4 cuvées en élevage, avec le seuil d’ouillage de chaque millésime » (les deux comptes en tête des cartes Cuvier et Chai).
- ★ **Deux nombres faux dans le sommaire.** « **À faire 6** » quand la bande disait 5 : `_AUJ_N.semaine` comptait les lignes de la semaine sauf le démarrage — la fin de fermentation estimée comprise, que la règle CAVEAUJ-1 (et le « i ») dit ne pas être un geste. « **À surveiller 4** » pour deux lignes : `_veil.match(/class="caj-asi/g)` attrapait aussi l’icône `caj-asic` de chaque ligne.

### 609b. Ce qui change

- **Le sommaire** : « À faire » et « Fûts » **sans nombre** (`_aujSommaireHtml` : `null` = pas de `<b>`) ; `_AUJ_N` ne garde que `presse`, `cuves`, `releves`, `veille`. La bande reste la même sur les quatre onglets (§91). « À surveiller » compte des `<li class="caj-asi…">` : 2.
- **« Ce qui presse »** : sous le verdict, `v.why` seul — le Pilotage garde ses pastilles (`v.puis`, MOTS-6) ; le pied `caj-cadre` part (et sa feuille de style), le « i » `cave.auj` monte à côté du titre et reçoit un premier paragraphe (sur quoi porte le calcul, où lire la suite).
- **Le détail d’aujourd’hui** (`_aujDetail`) : « **5 gestes à faire** » et un bouton « Ce qui presse › » (`_aujVers('caj-titre')`) ; la liste ne garde que ce qui n’est pas un geste (`_ML_INFO` : la fin estimée, le démarrage) — pas de liste vide. Un autre jour garde tout son détail.
- **« Derniers gestes »** commence à hier (`_aujRecentsHtml` filtre `e.d!==auj`) ; « Rien d’autre ces dix derniers jours. » quand seul aujourd’hui a des gestes. `_aujRecents` ne change pas : le Pilotage la lit entière (`recents`). ★ **Sur ordinateur, des colonnes d’au moins 120 px** (`repeat(auto-fill,minmax(120px,1fr))`, `overflow-wrap:anywhere`) : les trois colonnes fixes faisaient 72 px à 1024 et 101 px à 1280 ; en commençant à hier, « Ouillage · Gevrey-Chambertin VV ’25 » tombait dans la troisième et sortait de la carte (`test:debord` rouge à 1024). Deux colonnes à 1024 et 1280, trois dès 1366, comme avant.
- **« À surveiller »** : « 8 jours en cuve, 7 prévus. » ; « 1007, −7 par jour, à 1 j près. » — la date est à droite, la densité dans la carte du Cuvier.
- **Pas touché** (recommandation 4, gardée par Nico) : les deux « 36 t » du Millésime — la bande dit la campagne, la tuile « Raisin rentré » le millésime choisi par les puces ; ils ne coïncident que sur le millésime en cours. Ni les tableaux du Cuvier et du Chai, ni « En cave aujourd’hui », ni la fiche du contenant.
- **Les mots** : `MV_AIDE` « Aujourd’hui », le guide (`08-cave`), l’annonce 11.30 (administrateur).

### 609c. Mesuré après (build, démo)

- Cliquet des mots (regravé, baisses seulement) : **445 → 378** mots au téléphone, **463 → 396** sur ordinateur, phrases longues **2 → 0**. Hauteur 4 023 → 3 773 px au téléphone, 3 917 → 3 716 sur ordinateur ; « Ce qui presse » 930 → 855 px, les quatre semaines 746 → 601 px (téléphone).
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : le « i » de « Ce qui presse » ; aujourd’hui dans le calendrier, puis le 29 (détail entier), puis « Ce qui presse › » qui remonte au verdict ; « À faire » et « Fûts » du sommaire mènent à leur partie ; aucun débordement au téléphone.
- Tutos concernés : aucun (le panneau côte à côte rejoué, vert). La démo du site : `cave-pc` et `r-chai-accueil` régénérées (regardées : le sommaire sans les deux nombres, la raison seule).

### 609d. Harnais

`scripts/mv-harnais-mots14.mjs` (24 assertions, 27 contre-épreuves) : le sommaire joué (les deux entrées sans nombre, les quatre autres avec, l’ordre) ; « À surveiller » joué sur le vrai balisage de `_aujVeille` avec la vraie ligne de comptage de `_aujRender` (2, pas 4) ; la raison seule et `v.puis` gardé ; le pied parti, le « i » au titre ; le détail d’un jour joué (aujourd’hui, aujourd’hui sans fin estimée, un autre jour, un jour vide) ; « Derniers gestes » joué (hier d’abord, « Rien d’autre », « Aucun geste »), ses colonnes d’au moins 120 px, et `recents` du Pilotage entière ; les deux lignes courtes jouées ; l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adapté** : `cavux1` ① (« À faire » et « Fûts » sans nombre).

### 609e. Restes

- Le plan (§28) : Phyto › Registre, la Réserve, le lot de balayage (les phrases isolées de Vigne, Tracteur, Réglages, Planning).
- Non vu à l’écran : une macération plus longue que prévu (pas dans la démo du 27/10) — jouée par le harnais seulement.

### 609f. Leçons

- ⚠️ **Un nombre recopié finit par ne plus dire la même chose que l’original** : le sommaire recomptait « à faire » à sa façon et disait 6 sous une bande qui disait 5. Un nombre dit à deux endroits se lit à un seul, ou se lit dans la même fonction.
- ⚠️ **Un défaut de mise en page peut attendre qu’un autre changement le révèle** : les colonnes de 72 px existaient depuis CAVEAUJ-2 ; il a suffi que la liste commence un jour plus tard pour qu’un nom long tombe dans la dernière. Une grille se règle par la largeur minimale de ses colonnes, pas par leur nombre.
- ⚠️ **Compter par une expression sur du HTML compte aussi ce qui lui ressemble** : `class="caj-asi` attrapait `caj-asic`. Compter les éléments (`<li class="caj-asi[ "]`), ou mieux la liste avant le rendu.

## 610. ★★★ MOTS-15 — PHYTO › REGISTRE ALLÉGÉ : UNE PHRASE, UNE ANNÉE PAR BLOC, LA RENTRÉE TANT QU’ELLE SERT ; CONFORMITÉ AU PLAFOND RÉGLÉ (25/11 — APP 11.31, SW 12.22 — `src/tracteur.js` · `src/pilotage.js` · `src/styles.css` · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `guide/11-pilotage.html` · `public/guide.html` (regénéré) · `docs/maquettes/maquette-phyto-registre-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots15.mjs` (neuf) · `phyux1`, `phyto1`, `textea`, `info`, `cuivre7` suivis · `scripts/tutos-couverture.json` · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · `scripts/mv-ux-baseline.json` · la capture `phyto` de la démo du site · base `a334c11`)

### 610a. D’où ça vient, ce qui a été mesuré avant

- Le plan (§28) après Cave › Aujourd’hui. Maquette `maquette-phyto-registre-v1.html` (Avant / Après, téléphone et ordinateur : le haut de l’écran, toute la liste, un traitement ce matin — simulé —, une année dépliée) ; Nico (25/11) : « go » — les cinq recommandations.
- **316 mots au téléphone, 351 sur ordinateur, 2 546 px.** Aucune phrase longue : le poids était la répétition. Quinze traitements à la suite depuis 2020, chacun avec sa ligne verte « **rentrée libre depuis le 12 juin 2020** » (15 lignes) — la réponse à une question que personne ne pose plus ; « **4,2 sur 4 cette année** » redit sur chaque traitement au cuivre de l’année (13 fois), **en vert** : `_phEtatHtml` écrivait le cuivre dans la ligne de la rentrée, qui en prenait la couleur — vert même au-dessus de 4. Rien en haut ne disait si l’on pouvait retourner dans les vignes.
- La fiche (ordinateur) : « **10 Sep** » (`fmtDate`, sans l’année : « 12 Juin » pour 2020 comme pour 2025) et « **Réentrée** » quand la liste dit « rentrée ».
- ★ **Vu en route** : `_cfmCuivre` (Conformité) écrivait `PLAF=28` en dur, et sa phrase « plafond UE 28 kg/ha » — quand le plafond se règle (Bilan cuivre, `_cuPlafond`, et `_cuPlafond7` qui en dérive depuis le commentaire de `reglages.js` : « une seule notion, deux chiffres »). Le Registre suivant le réglage, les deux écrans auraient dit deux plafonds dès qu’on le change.

### 610b. Ce qui change

- **La phrase** (`_phPhrase`, `#ph-phrase` posé dans `index.html`, caché hors du Registre et sur une liste vide) : « **Rentrée libre partout** », ou « **Rentrée interdite** sur 2 parcelles jusqu’à aujourd’hui 16 h 00 » (les parcelles comptées une fois, la fin la plus tardive, `_phQuandFr`). Le cuivre s’y ajoute **seulement près du plafond** : la parcelle la plus chargée sur sept ans (`_cuParcRollSum`, le chiffre de Conformité) dès 87,5 % (le seuil « Vigilance » de `_cuStatus`), orange, rouge au-delà — « cuivre : 26,8 sur 28 kg/ha en sept ans, Clos du Moulin ». Un « i » neuf, `MV_INFO['phyto.registre']`.
- **Une année par bloc** (l’année civile : celle du registre, de l’export et du cumul de cuivre de PHY-UX-1), la plus récente ouverte ; sa ligne : « 2025 · 2 traitements · cuivre 4,2 sur 4 kg/ha » (`_phCuivreAn` : le calcul de `_phCuivreTxt` d’avant, sorti dans `_phCuivreCumul`, sur toutes les parcelles de l’année). Déplier / replier (`_phAnBasc`) garde le choix tant que l’écran est ouvert (`_phAnsOuv`). La ligne d’une année fait 48 px (`--h-row-2`) : une cible au doigt — à 32 px, `test:ux` comptait sept cibles de plus sous 44 px.
- **L’état de la rentrée d’un traitement** (`_phEtatUtile`) : tant qu’elle est interdite, puis **sept jours** après sa fin (`_PH_ETAT_J`) — sans délai, sept jours après le traitement. `_phEtatRentree` rend sa fin (`fin`).
- **Le cuivre d’un traitement** : sa dose seule (« cuivre : 2 kg Cu/ha »), dans son `<span class="ph-cu">`, gris.
- **La fiche** : `_phDateFr` (« 10 sept. 2026 ») ; « Rentrée » (l’étiquette et l’alerte).
- **Conformité** : `PLAF = _cuPlafond7()` ; la phrase dit « plafond UE 28 kg/ha » au plafond européen, « plafond réglé N kg/ha » sinon. Le « i » `pil.cfm.cuivre` le dit.
- **Les mots** : `MV_AIDE` (« Le registre », « délais de rentrée »), le guide (`07-phyto`, `11-pilotage`), l’annonce 11.31 (administrateur, tractoriste).
- **Pas touché** : la ligne d’écran (« 15 traitements »), les pastilles d’un traitement (type, dose, DAR), le Catalogue, la Fertilisation, la fenêtre d’un traitement au téléphone, l’assistant de saisie.

### 610c. Mesuré après (build, démo)

- Cliquet des mots (regravé, baisses seulement) : Phyto › Registre **316 → 80** mots au téléphone, **351 → 115** sur ordinateur. Hauteur 2 546 → 1 139 px au téléphone, 2 382 → 1 180 sur ordinateur. « rentrée libre depuis… » 15 → 0 ; « … sur 4 » 13 → 7 (une par année).
- `test:ux` regravé avec `--accepte` : la page défile désormais de moins de 300 px, la mesure « bandeaux en défilant » du Phyto n’existe plus (la règle du script) ; baisses : actions plus haut que le pouce 4 → 2 (téléphone), textes sous 12 px 16 → 4 (ordinateur). `debord`, `gabarit` verts. Tous les tutos rejoués (téléphone, ordinateur, panneau, miroir) : verts — dont « rentree », qui touche un traitement de la liste.
- La démo du site : `phyto` régénérée (regardée : la phrase, 2026 ouverte, les années repliées).
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : la phrase et son « i » ; 2025 dépliée puis repliée ; un traitement ajouté ce matin (interdite jusqu’à 16 h, dans la phrase et sur sa ligne) et un il y a trois jours (« libre depuis le 25 oct. ») ; le cuivre de Conformité lu au Pilotage (26,8 kg/ha, Clos du Moulin, « Vigilance · 96 % ») ; aucun débordement au téléphone.

### 610d. Harnais

`scripts/mv-harnais-mots15.mjs` (18 assertions, 28 contre-épreuves) : la phrase jouée (libre et cuivre orange ; interdite ; deux interdites — la fin la plus tardive, les parcelles une fois ; le cuivre muet sous 87,5 %, rouge au-delà, au plafond réglé) ; l’état utile joué (interdite, 3 et 8 jours, sans délai 3 et 30 jours) ; **la vraie `renderPhytoTrac` jouée** (2026 ouverte, 2025 repliée et sa ligne, les lignes muettes, la dose sans « cette année », le choix gardé) et `_phAnBasc` jouée ; la fiche ; `_cfmCuivre` jouée à 21 kg/ha ; la feuille, le « i », l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `phyux1` (③ : la dose sur le traitement, le cumul sur l’année par `_phCuivreAn`, la ligne en deux `<span>` ; un mutant de plus : le cuivre reprend la couleur de la rentrée), `phyto1` (la fiche monte avec `_phDateFr` ; « Rentrée »), `textea` (la liste monte avec ses nouvelles aides et la phrase). Et trois suivis vus par la chaîne : `info` (son corpus lit `tracteur.js`, qui pose la pastille `phyto.registre`), `cuivre7` (le mutant « plafond passé à 30 » vise la nouvelle ligne de `_cfmCuivre`), `tutos-couverture.json` (`_phAnBasc` exempté : déplier une année, rien à apprendre).

### 610e. Restes

- Le plan (§28) : la Réserve, puis le lot de balayage (les phrases isolées de Vigne, Tracteur, Réglages, Planning).
- La synthèse cuivre (`reglages.js`, `_renderCuivre`) garde son propre décor et ses chiffres « actuel / 28 » de l’assistant de saisie (`_tratCuBudgetHtml`, `phyto.js`) — elle suit déjà `_cuPlafond7`.

### 610f. Leçons

- ⚠️ **Deux textes dans une même ligne prennent la même couleur** : le cuivre, écrit dans la ligne de la rentrée, était vert même au-dessus de 4. Un état coloré a sa balise à lui.
- ⚠️ **Un plafond réglable écrit en dur à un seul endroit suffit à faire mentir deux écrans** : le commentaire de `reglages.js` l’avait dit pour la vue 7 ans ; Conformité était le cinquième endroit.

## 611. ★★★ MOTS-16 — LA RÉSERVE ALLÉGÉE : LE PARC EN TÊTE DE FÛTS, UNE PHRASE POUR LES INTRANTS, « (LOT SUIVANT) » RETIRÉ (25/11 — APP 11.32, SW 12.23 — `src/reserve.js` · `src/cave.js` · `src/app.js` (le squelette) · `src/utils.js` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/09-reserve.html` · `public/guide.html` (regénéré) · `docs/maquettes/maquette-reserve-v1.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots16.mjs` (neuf) · `intrant1`, `rsv1`, `rsv3`, `rsvux1`, `info` suivis · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · `scripts/mv-ux-baseline.json` · la capture `reserve` de la démo du site · base `d16a52c`)

### 611a. D’où ça vient, ce qui a été mesuré avant

- Le plan (§28) après Phyto › Registre. Maquette `maquette-reserve-v1.html` (Avant / Après, téléphone et ordinateur : Fûts, Intrants, un stock négatif — simulé —, Bilan matière) ; Nico (25/11) : « go » — les quatre recommandations.
- **Fûts : 137 mots, 1 phrase longue, 75 mots avant le premier grand chiffre — le pire écran de l’appli sur ce point.** La pyramide des âges (venue de la Cave, `_caveParcHtml`) était posée AVANT le parc ; et l’écran redisait ses chiffres : 55 deux fois (« 55 barriques » sur la pyramide, le parc), 12 libres trois fois (le parc, la tuile « Fûts libres », la puce « Tous »), 2 fournisseurs deux fois (une tuile, la ligne de la liste), 2 millésimes deux fois (une tuile, les puces).
- **Intrants : 92 mots, 2 phrases longues, 76 mots avant « 13,5 ».** Sur chaque produit phyto, « Consommé à activer. Entrées : 116 kg. Le consommé se calculera depuis le registre une fois les doses structurées **(lot suivant)**, ou passe l’intrant en saisie manuelle. » — un mot de développeur montré à l’utilisateur, et faux depuis IFT-1 (§571) : l’assistant écrit `dose_val` sur chaque traitement ; ce sont les traitements plus anciens (la dose en texte seulement) qui laissent le consommé à activer.
- **Bilan matière : 60 mots, 1 phrase longue** — la mention du contrôle bio (30 mots) sous le tableau.

### 611b. Ce qui change

- **Fûts** (`_rsvFutsHtml`) : le parc d’abord (« 55 fûts au domaine · 43 en vin · 12 libres »), puis les boutons, **puis** la pyramide et la part des anges (`_caveParcHtml` posée là ; `_rsvRenderBody` ne la met plus devant), puis les puces et la liste. **Les trois tuiles partent** (« Fûts libres », « Fournisseurs », « Millésimes »).
- **La pyramide** (`_pcavPyramide`, cave.js) : plus de « 55 barriques », plus de note dessous — la façon de compter l’âge passe dans un « i » neuf, `rsv.pyramide`. **La part des anges vide** : « Aucun ouillage sur douze mois. » et « Saisir », le pourquoi dans son « i » (`cave.anges`, déjà écrit).
- **Intrants** : une phrase (`_rsvIntrantsPhrase`) qui compte les fiches comme elles s’affichent — les stocks négatifs (rouge), les stocks cohérents (vert), les consommés à activer — avec un « i » neuf, `rsv.conso` (le stock, les sources du consommé, ce que veut dire « à activer » et comment le tenir à la main, un stock négatif). Un consommé à activer tient sur une ligne : « **Consommé à activer** · entrées 116 kg ». L’alerte d’un stock négatif garde le chiffre et la cause ; « le bilan ne peut pas fermer » passe dans le « i ».
- **Bilan matière** : la mention du contrôle bio dans un « i » neuf au titre, `rsv.bilan` ; le PDF du bilan la garde en entier (`mvdoc-lim`).
- **Le squelette de chargement** (`_mvSk('reserve')`) : un grand chiffre et sa ligne, plus trois tuiles.
- **Gardé** (recommandation 3) : le mot « à activer » — celui du tableau et du PDF que lit le contrôleur.
- **Les mots** : `MV_AIDE` (le parc en tête, la phrase des Intrants), le guide (`09-reserve`), l’annonce 11.32 (administrateur).

### 611c. Mesuré après (build, démo)

- Cliquet des mots (regravé, baisses seulement) : Fûts **137 → 100** mots, phrases longues **1 → 0**, mots avant le premier grand chiffre **75 → 0** ; Intrants **92 → 56**, **2 → 0**, **76 → 40** ; Bilan matière **60 → 30**, **1 → 0** (téléphone et ordinateur). Hauteur de Fûts au téléphone 1 538 → 1 369 px. Et Phyto › Registre (ordinateur) : 35 → 32 mots avant le premier chiffre — l’effet des lignes d’année à 48 px de MOTS-15, posées après sa gravure.
- `test:ux` regravé avec `--accepte` : Fûts, sur ordinateur, défile de moins de 300 px — la mesure « en défilant » n’existe plus (la règle du script) ; baisses : actions plus haut que le pouce 4 → 3 (Réserve, téléphone), et deux hors du lot, non attribuées (textes sous 12 px, planning et réglages, −1 chacun). `debord`, `gabarit` verts. Le tuto « intrant » rejoué (téléphone, ordinateur, panneau, miroir) : vert.
- Joué dans le navigateur (téléphone, ordinateur), sans erreur de page : les quatre « i » ; le filtre 2026 (6 fûts), « Tout déplier » (2 fournisseurs), « Saisir » de la part des anges (la fenêtre d’opération) ; un stock négatif simulé (la phrase en rouge, l’alerte) ; aucun débordement au téléphone, sur les trois onglets.
- La démo du site : `reserve` régénérée (regardée : le parc en tête, la pyramide sous les boutons).

### 611d. Harnais

`scripts/mv-harnais-mots16.mjs` (15 assertions, 20 contre-épreuves) : **la vraie `_rsvFutsHtml` jouée** (l’ordre — parc, boutons, pyramide, puces, liste — ; plus de tuiles ; le parc vide aussi) ; `_pcavPyramide` et `_pcavAngesCard` jouées ; **la vraie `_rsvIntrantsHtml` jouée** (la phrase et son « i », la ligne courte, plus de « lot suivant » ; un stock négatif : la phrase en rouge, l’alerte courte ; sans intrant, pas de phrase) ; `_rsvAuditHtml` jouée (le « i » au titre, plus de note ; le PDF garde le règlement) ; les trois « i », l’aide, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `intrant1` (la phrase monte avec la liste), `rsv1` (plus de bande de tuiles), `rsv3` (le « i » du bilan au lieu de la note), `rsvux1` (la ligne courte de la part des anges), `info` (son corpus lit `reserve.js`, qui pose `rsv.conso` et `rsv.bilan`).

### 611e. Restes

- Le plan (§28) : le lot de balayage — les phrases isolées de Vigne, Tracteur, Réglages et Planning. Puis le chantier « Moins de texte » est fini.
- Les traitements saisis avant l’IFT n’ont pas `dose_val` : leur consommé reste « à activer ». `registre.js` sait lire la dose du texte (« 8 L/ha ») ; la Réserve ne s’en sert pas — un lot à part (un calcul qui change), si Nico le veut.

### 611f. Leçons

- ⚠️ **Un mot de chantier finit par être lu par l’utilisateur** : « (lot suivant) » était dans une chaîne de l’écran depuis un lot ancien, et ne restait vrai que pour le développeur. Les mots de l’écran ne parlent jamais du code.
- ⚠️ **Le premier grand chiffre dit l’ordre d’un écran** : une carte venue d’un autre module, posée devant, repoussait le parc de 75 mots. Une carte empruntée se pose après ce que l’écran dit de lui-même.

## 612. ★★★ MOTS-17 — LE BALAYAGE : LES PHRASES ISOLÉES DE PLANNING, VIGNE ET TRACTEUR — LE DERNIER LOT DU PLAN « MOINS DE TEXTE » (25/11 — APP 11.33, SW 12.24 — `src/planning-annee.js` · `src/planning-modeles.js` · `src/app.js` (les Stades, l’Accueil) · `src/compteur.js` · `src/tracteur.js` · `src/utils.js` · `src/styles.css` · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `guide/04-vigne.html` · `guide/06-tracteur.html` · `public/guide.html` (regénéré) · `docs/maquettes/maquette-balayage-v2.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-mots17.mjs` (neuf) · `pheno1b`, `feries1`, `info` suivis · `scripts/mv-harnais-liste.mjs` · `scripts/mv-mots-baseline.json` · les captures `r-trac-compteur` et `planning-pc` de la démo du site)

### 612a. D’où ça vient, ce qui a été mesuré avant

- Le plan (§28), après la Réserve : « un lot de balayage pour les six phrases isolées de Vigne, Tracteur, Réglages et Planning » — la liste est dans `maquette-moins-de-texte-v3.html` (« Module par module »). Relevé refait sur le build (25/11) : **Réglages n’en a aucune** (rien au-delà de 11 mots), les six sont là où la v3 les disait.
- **Planning › Année : 308 mots, 3 phrases longues** — le mode d’emploi sous « Le cadre » (44 mots : « Règle une saison avec − et +… »), la règle des fériés (26), la note de « Changer le rythme à partir d’ici » (18) ; et la liste des 9 fériés, dépliée. 4 217 px au téléphone.
- **Vigne › Stades** : « moyennes journalières depuis le 1er mars, base 0 °C · modèle GFV (Parker et al. 2011, 2013) » en tête de « Ce qui vient » ; **en saison** (mars à septembre), 30 mots de seuils en pied (« Seuils publiés : Pinot noir 1 219 et 2 511 °C·j… ») — que le cliquet ne voit pas : sa démo est au 27 octobre, hors saison.
- **Tracteur › Entretien** : « Vidange de pont et boîte, filtres, graissage : ajoutez ce qui se fait à côté de la révision. » (16 mots, sous une carte vide « Autres entretiens · Ajouter ») ; « Intervalle à régler au crayon : la suivante se calculera seule. » (un tracteur sans intervalle).
- Hors plan, mais la seule phrase longue de l’Accueil : « Votre première validation lancera vos compteurs : hectares, jours au domaine, kilomètres de rangs. » (16 mots).
- **La maquette v1 a été refusée** (Nico, 25/11 : « les graphiques sont dégueulasses », des zooms au toucher) : des découpes de captures prises à des fenêtres arbitraires, recompressées, et une image qui en remplaçait une autre de hauteur différente au toucher. **v2** (`maquette-balayage-v2.html`) : chaque bloc capturé entier, à ses bords, en 2x, affiché à sa taille réelle ; avant / après côte à côte ; ce qui s’ouvre au toucher en dessous ; rien ne réagit au toucher des images. Nico : « go maquette v2 » — les sept recommandations.

### 612b. Ce qui change

- **Planning › Année** : sous « Le cadre », « Dimanches travaillés : aucun » seul. Le mode d’emploi passe dans une fiche, `plan.frise`, ouverte par la pastille **« Régler la frise ? »** (`.mv-pq`, au bout de la rangée « Tomber juste · Exporter » de l’administrateur, poussée à droite) ; il dit en plus où se choisit la semaine (« Précédente », « Suivante ») — « plus haut » ne voulait plus rien dire une fois la note partie.
- **Les fériés** (`_planAnneeFeriesBloc`) : la règle dans le « i » de « N fériés portent des heures » — une fiche **vivante** (`_mvInfoSet('plan.feries')`), juste pour l’année affichée (0 h au modèle en 2026 ; « compte quand même pour ses heures prévues » quand la base de l’année est active) ; **la liste se replie**, ouverte pendant un brouillon seulement (le tuto « Travailler un férié » touche un bouton dedans, après « Chômer les N », qui ouvre le brouillon).
- **Le rythme** : la note dans le « i » du titre « Changer le rythme à partir d’ici » (`plan.rythme`, vivante : la date de fin de saison en gras). Le « i » dans un `<summary>` ne replie pas la section (l’écouteur des pastilles fait `preventDefault`).
- **Vigne › Stades** : « Ce qui vient » garde ses chiffres et ses dates ; la méthode et les seuils passent dans le « i » du titre (`phr.dj` : les moyennes, la base 0 °C, le modèle GFV, les seuils — **lus dans `_PHENO_GFV` : le premier à la pleine floraison (BBCH 65), le second à la véraison (81)** —, la prévision). « Températures de la dernière lecture. » reste à l’écran quand c’est le cas : c’est un état.
- **Tracteur › Entretien** : rien de réglé, la carte et sa phrase deviennent **un seul bouton « + Autre entretien »** (`.ep-seul`, pleine largeur comme les autres boutons du Tracteur) ; l’exemple reste dans le champ Nom (« ex. Vidange pont et boîte ») ; au premier entretien réglé, la carte revient, son bouton s’appelle aussi « + Autre entretien ». La phrase de l’intervalle devient la pastille **« intervalle ? »** sur la ligne de la révision, qui **ouvre le crayon** (`openRevEdit`), pour qui peut régler (admin, tractoriste) ; une règle CSS lui garde son allure malgré l’habillage `!important` des boutons de carte du Tracteur.
- **L’Accueil** : « Vos compteurs partent à la première validation. » (9 mots).
- **Les mots** : quatre fiches `MV_INFO` (`plan.frise`, `plan.rythme` et `plan.feries` avec leur repli honnête, `phr.dj`), le guide (Planning, Vigne, Tracteur), l’annonce 11.33 (administrateur).

### 612c. Mesuré après (build, démo)

- Cliquet des mots (regravé, baisses seulement) : Planning › Année **308 → 171** mots, phrases longues **3 → 0** (téléphone et ordinateur), 4 217 → 3 511 px au téléphone ; Vigne › Stades 106 → 94 (téléphone), 132 → 120 (ordinateur) ; Tracteur › Entretien **103 → 78**, **1 → 0** (téléphone), 177 → 152, 1 → 0 (ordinateur) ; Vigne › Accueil 284 → 277, **1 → 0**. Au total : phrases longues 15 → 10 au téléphone, 22 → 17 sur ordinateur.
- `test:ux`, `gabarit`, `debord` : verts, sans regravure. Les tutos concernés (l’année, la régler, la coupe, la semaine, les horaires, les fériés, une semaine sur deux — téléphone, ordinateur, panneau, miroir, côte à côte) : verts.
- Joué dans le navigateur (téléphone, ordinateur), 22 gestes sans erreur de page : « Régler la frise ? » et les trois « i » s’ouvrent et disent leur texte (l’année, la date) ; le « i » du rythme ne replie pas la section ; la liste des fériés est repliée ; « intervalle ? » ouvre le crayon ; « + Autre entretien » ouvre le formulaire. Les Stades **en saison** joués au 10 juin (températures servies par la route) : la carte sans méthode ni seuils, le « i ».
- La démo du site : `r-trac-compteur` (Paul, tractoriste, dont le tracteur de démo n’a pas d’intervalle : la pastille à la place de la phrase) et `planning-pc` régénérées.

### 612d. Harnais

`scripts/mv-harnais-mots17.mjs` (22 assertions, 24 contre-épreuves) : Planning › Année (la note réduite à « Dimanches travaillés », la pastille au bout de la rangée, le rythme dans son « i » avec sa date) ; **la vraie `_planAnneeFeriesBloc` jouée** (le « i », la fiche de 2026 puis celle d’une base active, la liste repliée puis ouverte pendant un brouillon, aucun férié travaillé : ni « i » ni fiche) ; les Stades ; **la vraie `_trEntProgHtml` jouée** (le bouton seul, la carte dès un entretien, l’ouvrier qui ne voit rien, le formulaire et son exemple) ; **la vraie `_revCardHtml` jouée** (la pastille, l’intervalle réglé, le droit de régler) ; l’Accueil, les fiches, le guide, l’annonce, les versions, la maquette, la liste.

**Harnais adaptés** : `pheno1b` (⑤ : les seuils ne sont plus sur la carte), `feries1` (A2 et F1 lisent la règle dans la fiche que reçoit `_mvInfoSet` ; A5 : la liste repliée hors brouillon ; le défaut « base » suit son ancre), `info` (son corpus lit `planning-annee.js`, `planning-modeles.js` et le fichier principal de l’appli, qui posent `plan.frise`, `plan.rythme`, `plan.feries` et `phr.dj`).

### 612e. Restes

- **Le plan « Moins de texte » (§28) est fini.** L’objectif « zéro phrase de 15 mots » ne l’est pas : 10 au téléphone, 17 sur ordinateur, hors plan — Phyto › Fertilisation (4 ; trois tranchées dans la v3 — « Aucun apport » et « + Amendement », la dose réglementaire dans le « i » du plan de fumure, le fractionnement en coche — sans lot), la Cave (Récoltes, Cuves, Cuvées, Bouteilles, Labo, Diagnostic ×2, Courbes ; deux alertes que la v3 gardait), la fiche d’une personne au Planning sur ordinateur (4 sur son seul Résumé, une vingtaine de notes de paie sur ses cinq onglets — « pas mesuré » dans le plan). Proposé à Nico : **MOTS-18** la Fertilisation et la Cave, maquette d’abord ; **MOTS-19** la fiche d’une personne, relevé d’abord.
- **Planning › Année, la présentation** : Nico (25/11) la trouve grossière, trop grosse, pas professionnelle (« un problème que j’ai depuis quelque temps ») — mesuré : 74 boutons dont 42 « − / + » (21 réglages, les jours répétés trois fois), « 1 827 h » écrit trois fois, plus de quatre écrans au téléphone. Recherche faite (Skello, Factorial, Personio, Deputy, Octime, les cycles hospitaliers, les règles de densité de Carbon, Material et NN/g) ; **la refonte est son propre lot, maquette d’abord** (« go maquette planning », 25/11).

### 612f. Leçons

- ⚠️ **Une maquette se juge sur des captures propres** : un bloc pris à ses bords, à sa taille, net — jamais une fenêtre découpée au hasard autour d’un texte, recompressée, réduite. Et **rien ne doit bouger au toucher** d’une image : une bascule avant/après qui change la hauteur se lit comme un zoom raté. Chaque comparaison avant / après se pose côte à côte, une fois pour toutes.
- ⚠️ **Une capture pleine page change la mise en page sur ordinateur** (la hauteur de la fenêtre devient celle de la page : les colonnes collantes se recalent) — un bloc qui tient dans l’écran se capture centré, dans l’écran tel qu’il est ; et les couches fixes ou collantes passent invisibles à leur place, sinon le bandeau se pose sur le bloc.
- ⚠️ **Le cliquet ne voit que la date de sa démo** : 30 mots de seuils, en saison, lui échappaient. Un écran qui change selon la saison se joue aussi à une date de la saison (les températures servies par la route).

## 613. ★★★ ANNEE-2 — PLANNING › ANNÉE REFAITE : UNE VUE DE L’ANNÉE COMME UN PLANNING DE PROJET, LE DÉTAIL DANS UN PANNEAU (26/11 — APP 11.34, SW 12.25 — `src/planning-annee.js` · `src/annee.css` (neuve) · `src/app.js` (son import) · `src/tutos.js` (huit tutos de l’année) · `src/utils.js` (la fiche `plan.frise`) · `src/styles.css` (deux règles retirées) · `src/whats-new.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `public/guide.html` (regénéré) · `docs/maquettes/maquette-planning-annee-refonte-v3.html` (neuve) · `docs/maquettes/LISEZMOI.md` · `scripts/mv-harnais-annee2.mjs` (neuf) · `anneetab`, `frise5`, `feries1`, `debord1`, `mots17` suivis · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/mv-mots-baseline.json` · `scripts/typo-baseline.json` · `scripts/mv-captures.mjs`)

### 613a. D’où ça vient, ce qui a été mesuré avant

- Nico (25/11), sur l’onglet Année : « Je trouve la présentation grossière, c’est mal fait, c’est gros, ça prend de la place, c’est pas joli, c’est pas professionnel » — « un problème que j’ai depuis quelque temps ». Mesuré (démo, « standard », après MOTS-17) : **3 511 px au téléphone (4,2 écrans), 2 170 sur ordinateur, 74 boutons dont 42 « − / + »** (21 réglages : les jours d’une saison, ceux de la semaine choisie, ceux de « Changer le rythme »), « 1 827 h » écrit trois fois (la bande, le grand chiffre de la carte, son sous-titre), une carte par saison, la semaine dépliée sous la frise, les fériés, les jours à part et le cadre empilés dessous.
- Recherche (§612e) : les grands logiciels de planning et de RH — l’écart cumulé à droite du planning (Skello), des périodes (Factorial), des semaines qui alternent (Personio, Octime, les cycles hospitaliers : trop de couleurs rendent un planning illisible), des pas « − / + » réservés aux petits nombres (NN/g), les densités de Carbon et de Material.
- Trois maquettes : la v1 (des cartes allégées) refusée — « pas professionnel, tout en vrac » ; la v2 (une barre d’outils, une seule vue de l’année façon planning de projet, le détail dans un panneau) « beaucoup mieux » ; la v3 (la vue serrée et alignée — deux colonnes de chiffres à droite —, le panneau d’une saison sans « − / + », les détails) « impeccable ». Découpage proposé et validé (« go ») : **ANNEE-2** la vue et le panneau (les réglages d’avant dedans, tels quels), **ANNEE-3** plus de « − / + » (la grille des jours et ses choix, des champs heure et date), **ANNEE-4** le nom des saisons. Les quatre questions de la maquette tranchées par les recommandations : le compte reste dans la bande ; le nom d’une saison sera facultatif (ANNEE-4) ; la semaine B en bandes alternées ; les fériés et les congés sur deux lignes fines.

### 613b. Ce qui change

- **`_planRenderAnnee` réécrit** (le reste du fichier ne bouge pas : `_planAnneeLire`, les gestes, le brouillon) : `_anvCtx` lit une fois tout ce que la vue et le panneau demandent (le compte, la cible, l’écart, le cadre — il était en bas de la carte —, les fériés travaillés, les congés posés, aujourd’hui) ; `_anvOutils`, `_anvVue`, `_anvEtat` écrivent la barre, la vue, la ligne d’état ; le tout dans un seul bloc `.anv` (`#plan-body` est une rangée flexible centrée : deux blocs s’y répartissaient la hauteur).
- **La barre d’outils** : le modèle en bouton (« standard · 4 pers. »), son menu (chaque modèle, combien le suivent ; le choix est refusé pendant un brouillon, comme avant) ; l’année « ‹ 2026 › » (sur ordinateur ; refusée pendant un brouillon) ; « Tomber juste » (le bouton principal ; secondaire quand un brouillon fait d’« Enregistrer » le principal) ; « Annuler » et « Enregistrer » tant qu’un brouillon existe ; « … » : Exporter (CSV), Imprimer le planning de l’année (`_paDoc`), « Régler la frise ? » (la fiche `plan.frise`, réécrite pour la nouvelle vue), Qui suit ce modèle, Préparer l’année d’après. Au téléphone, deux boutons d’action et plus passent sur leur ligne (`:has`).
- **La vue** (`_anvRangs`) : en tête les mois (une initiale au téléphone) ; les heures de chaque semaine face à la ligne des 35 h (au-dessus : l’or de la charte), **chaque semaine un bouton** qui l’ouvre ; une ligne par saison, sa barre posée sur ses morceaux de dates (une semaine à part ou une fermeture au milieu la coupe), les semaines A et B en bandes ; chaque semaine à part, chaque fermeture (hachurée) ; les fériés en points (plein : travaillé, creux : chômé) ; les congés posés de l’équipe du modèle en traits (« 2 » quand ils sont deux) ; aujourd’hui, un trait et sa pastille. **Dès 1 024 px**, un tableau : à gauche le rythme (« L–J 7 h, V 4 h ») et les dates, à droite deux colonnes alignées — par semaine (« 39 h / 32 h » pour A et B) et le total de la période ; le pied de la colonne, en face des heures par semaine, fait le compte de la bande ; **dès 2027 (la base de l’année), la ligne des fériés porte les heures des fériés chômés**, comptés pour leurs heures prévues, et la colonne fait toujours le compte.
- **La ligne d’état** : « Cadre respecté » (ou « à revoir »), « N fériés travaillés au modèle », « N jours à part », « Personne ne suit « … » », « Pas encore enregistré » ; chacune ouvre son panneau. **La légende** ne montre que ce que le modèle contient.
- **Le panneau** `#ovAnvPan` : une fenêtre créée une fois, à la coque commune (`.overlay` > `.modal`, poignée, en-tête, corps, et un pied), ouverte par `openOv` — Échap, le retour et le fond la ferment par `planAnneePanFermer`, qui la vide (ni boutons ni ancres de tuto ne restent dans une fenêtre fermée). Par le bas au téléphone, **à droite dès 768 px** (400 px, sans poignée ; à côté du panneau des tutos en mode côte à côte, `.overlay` étant déjà rangé par COTE-1). Une saison : ses jours (les − / + d’avant, la semaine B), sa prise de poste, sa coupe ; une semaine : ‹ et › en tête, ses jours, son horaire, ses fériés, fermer / rouvrir, « Changer le rythme à partir d’ici » ; les contrôles : le cadre, les dimanches, les fériés (`_planAnneeFeriesBloc`, la liste ouverte) ; « Tomber juste » : ses retouches (« Appliquer » pose et ferme) ; qui suit (`_planAnneeSuivi`) ; les jours à part. **« Annuler » et « Enregistrer » sont au pied du panneau tant qu’un brouillon existe** ; leurs ancres de tuto passent de la barre au pied quand il est ouvert.
- **Un brouillon garde son année** : changée ailleurs (le Mois), l’onglet ne le pose plus sur une autre — « Les modifications de « standard » 2026 ne sont pas enregistrées » : « Revenir en 2026 », « Les abandonner ». **La bande suit le brouillon** à chaque rendu (elle ne bougeait qu’à l’ouverture de l’onglet ; le grand chiffre de la carte le disait, il est parti).
- **Les tutos** : les huit de l’année réécrits — toucher une saison, une semaine (ses heures en tête de la vue), une pastille de la ligne d’état ; « ✕ » pour revenir à l’année ; le modèle dans son menu (`plan.annee.modele.l`). `planAnneeAn` exempté (`tutos-couverture.json` : la flèche de l’année, sur ordinateur, la même année se change depuis Mois et Personnel), `planAnneeModele` n’est plus exempté (« inscrire » l’enseigne).
- **La feuille à part, `src/annee.css`** (importée après `frais.css`) : `styles.css` est à son plafond (1 024 ko, `mv-harnais-typo`) — posé d’abord dedans, le bloc le portait à 1 037 ko et faisait monter six cliquets (`echelle`, `jetons`, `cartes`, `typo`, et `mots6` à `mots8` qui y comptent les règles). Chaque jeton du socle a son repli, les espacements sont sur l’échelle, la carte est la pièce du jeu `.mvcarte-fond` (CHARTE-5) ; tout par jetons (le sable = l’or de la charte à 38 %, le rose de la semaine à part = l’accent à 22 %), clair et sombre. Dans `styles.css`, les règles `.pa-mois` (DEBORD-1) et `.pa-aide` (MOTS-17) retirées avec leur balisage.

### 613c. Mesuré après (build, démo, « standard »)

- **Téléphone : 3 511 → 621 px (0,7 écran) ; 74 → 8 boutons** (plus les 53 zones des semaines, une par semaine, hors de l’ordre de tabulation sauf la semaine choisie) ; **42 → 0 « − / + »** à l’écran ; « 1 827 h » écrit **3 → 1** fois. Ordinateur : 2 170 → 586 px ; « 1 827 h » trois fois (la bande, le pied de la colonne « total », la ligne de l’unique saison : le total d’une colonne).
- Le panneau d’une saison au téléphone : 743 px (ses − / + ; ANNEE-3 le ramène vers 459, maquette v3).
- Cliquet des mots (regravé, baisses seulement) : Planning › Année **171 → 29** mots au téléphone, **171 → 45** sur ordinateur. `test:ux`, `gabarit` : verts sans regravure. `test:debord` : un défaut trouvé et corrigé — le « 35 h » de la ligne pointillée, posé hors de sa boîte de 0 px (et sous les zones des semaines) : il passe dans le titre (« face aux 35 h », téléphone) et dans la colonne « par sem. » (ordinateur).
- `mv-harnais-typo` regravé, la question du découpage posée : `planning-annee.js` 67 → 81 ko (le découpage MODELES-DEC s’était fait à 83) — **ANNEE-3 sortira la vue et le panneau dans leur fichier** ; `tutos.js` 151 → 162 ko (huit tutos réécrits). Le regravage a aussi rattrapé la croissance d’autres lots restée sous 5 % : ★ **`src/app.js` est à 1 021 ko pour un plafond de 1 024**.
- Les tutos concernés (les huit de l’année ; « préparer » vit dans le Mois) : verts au téléphone, sur ordinateur, au panneau, au miroir et côte à côte (1 280, 1 536, 1 920 px : rien dessous).
- Regardé au navigateur (démo, clair et sombre ; 390, 820, 1 024 et 1 366 px) : la vue, les deux menus, la saison, la semaine, les contrôles, « Tomber juste », le brouillon (la barre, le pied, la bande qui suit).

### 613d. Harnais

`scripts/mv-harnais-annee2.mjs` (18 assertions, 12 contre-épreuves), sur les VRAIES fonctions et la vraie grille 2026 de « standard » : le compte (les lignes somment au pied, qui vaut le compte ; en 2027, avec la ligne des fériés) ; une semaine = un bouton, une ancre ; plus aucun « − / + » dans la vue, la barre et la ligne d’état ; un seul bouton principal, avec et sans brouillon ; les ancres d’« Annuler » / « Enregistrer » dans la barre ou au pied ; la légende (« standard » puis une année toute simple) ; la ligne d’état ; le panneau (saison, semaine, contrôles, la coque, vidé fermé) ; la feuille (à droite dès 768 px, le tableau dès 1 024, les animations réduites, aucune couleur en dur) ; la garde de l’année (le rendu, la flèche jouée) ; chaque ancre « plan.annee.* » qu’un tuto touche.

**Harnais adaptés** : `anneetab` (le choix du modèle est dans `_anvOutils`), `frise5` (« Exporter (CSV) » dans le menu « … »), `feries1` (la semaine vit dans `_anvPanSemaine`), `debord1` (⑦ : un jour garde sa ligne dans le panneau, une initiale par mois au téléphone), `mots17` (« Dimanches travaillés » dans les contrôles, « Régler la frise ? » dans le menu, la fiche `plan.frise` réécrite).

### 613e. Restes

- **ANNEE-3** — plus de « − / + » : la grille des jours d’une saison (A et B × lundi à dimanche, le total au bout) et son choix (repos, 4, 7, 7,5, 8, 8,5, une autre durée) ; le même choix pour une semaine, un jour à part, « Changer le rythme » ; la prise de poste et le début d’une saison en champs (le début **un lundi** : la vue coupe les saisons par semaines entières). Tutos concernés à refaire.
- **ANNEE-4** — le nom des saisons (facultatif, enregistré avec le modèle ; dans la vue, le programme indicatif, l’export, « Mon année ») ; « Mon année » aux couleurs de la vue.
- Sur ordinateur, « 1 827 h » trois fois pour un modèle d’une seule saison (le pied d’une colonne d’une ligne) : signalé à Nico, à retirer s’il gêne.
- ★ **Les cliquets de la feuille (`echelle`, `jetons`, `cartes`, `cote1`, le px de `typo`) ne lisent que `styles.css`** : les feuilles à part (`aujourdhui.css`, `pilotage.css`, `frais.css`, `annee.css`) leur échappent. `annee.css` suit leurs règles à la main (`mv-harnais-annee2` tient les replis et l’absence de couleur en dur) ; les brancher sur toutes les feuilles est à faire (les couches fixes d’`annee.css` — le voile et le menu du téléphone — sont, comme celles du Planning, au téléphone seulement).
- Hors lot, vu en route : avant ce lot, changer d’année dans le Mois avec un brouillon d’Année en cours le posait sur l’autre année (la garde le refuse maintenant ; rien n’avait été écrit, « Enregistrer » restant à faire).

### 613f. Leçons

- ⚠️ **`#plan-body` est une rangée flexible centrée** (`flex-wrap`, `align-items:center`) : deux blocs posés dedans se partagent la hauteur de la page — 80 px de vide entre la barre et la vue. Un onglet qui écrit dans `#plan-body` y pose UN bloc, parti du haut.
- ⚠️ **Une étiquette posée sur une ligne de 0 px est « hors de sa boîte »** pour `test:debord`, et des zones de toucher transparentes posées dessus la « recouvrent » : un texte va dans une boîte à lui, hors des zones de toucher.
- ⚠️ **`styles.css` est à son plafond** : une feuille neuve de plus de quelques lignes se pose dans son fichier, importé par l’appli — sinon six cliquets montent d’un coup.
- ⚠️ **Le préflight lit `data-…="an"` comme l’ancien onglet « an » du Pilotage** : une valeur de deux lettres qui ressemble à une clé retirée se nomme autrement (`tan`).
- ⚠️ **L’outil d’écriture change les `\u00e9` d’un texte en caractères** : le code neuf de l’appli s’écrit en `\u` (la règle des chaînes du fichier) — relu et rétabli au script avant le build ; les commentaires gardent leurs accents.
