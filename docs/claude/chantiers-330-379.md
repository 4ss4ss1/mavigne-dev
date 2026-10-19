# Ma Vigne — Chantiers §330 à §379

> Ouvert le 14/10/2026 (§330), sur le modèle de `chantiers-280-329.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été remonté dans `CLAUDE.md`
> (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches de 50). Au-delà de la
> dernière tranche, créer le fichier suivant sur le même modèle.

---
## 330. ★★ TRN-1 — LES TOURNÉES, RÉGLÉES UNE FOIS DANS LA ROUE CRANTÉE DE LA VIGNE (14/10 — `src/tournees.js` (module neuf : `_trnSectionRender`, `_trnOuvrir`, `_trnEcrire`) · `src/reglages.js` (l'import et l'appel de la section) · `src/utils.js` (modèle et lecture, aide, APP 8.98, `MV_FORMAT` 2, WHATS_NEW) · `src/app.js` (barre de Parcelles) · `src/pilotage.js` (Décider) · `src/styles.css` (bloc `★★ TRN-1`) · `index.html` · `public/sw.js` v9.77 · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-trn1.mjs`)

### 330a. D'où ça vient
Nico (14/10, dicté) : choisir simplement dans quel ordre on fait les parcelles — « l'ordre domaine », par exemple ; la tournée
était cachée dans Pilotage › Décider, et ranger les parcelles l'une au-dessus de l'autre (⇅ puis « Insérer ici ») n'était pas
intuitif. Plusieurs tournées (hiver, été, taille, tracteur…), réglées de temps en temps : « une fois faites, on n'y touche plus ».
Puis la règle : « c'est l'administrateur qui fera les tournées et qui décidera de la tournée que l'équipe devra faire. L'équipe
n'a vraiment qu'à se concentrer sur le tap de validation. » Une tournée par équipe : « plus tard ». Maquette interactive publiée
et validée le jour même (« go »).

### 330b. Ce qui a été regardé
Les planificateurs de tournées font en deux temps — un ordre automatique, puis l'ajustement à la main : poignée de glisser et
optimisation en un clic (Maptive), groupes entourés sur la carte dans l'ordre et « placer avant / après » côté chef (Circuit),
tournées montées une fois puis réappliquées (Route4Me, Bambi). En agricole, le chef prépare et l'opérateur confirme en entrant
dans le champ (John Deere Work Planner). Le glisser n'est jamais le seul chemin : WCAG 2.5.7 l'exige ; GitHub a vu un menu
« déplacer » préféré au glisser par une partie de ses utilisateurs ; Atlassian fait de la poignée le bouton de ce menu. Road
Warrior montre le piège : son optimisation efface les retouches à la main — d'où Annuler / Rétablir partout.

### 330c. Le modèle
`CONFIG.tournees = [{ id, nom, taches:[noms], ordre:[pid], date:'AAAA-MM-JJ', par }]`. L'ordre est COMPLET (toutes les parcelles
non arrachées) et rangé par **pid** (IDS-1) : renommer ne touche pas la tournée. Un travail ne suit qu'une tournée ; enregistrer
une tournée qui prend un travail le retire de l'autre, et le message le dit. La lecture garde son API : `_mvOrdreFor(tâche)` rend
toujours des **noms** — Parcelles, la carte, l'anneau, le Tracteur et Décider lisent comme avant. Sans `CONFIG.tournees`, les
tournées d'avant (`ordre_passage_t`, une par tâche) se lisent comme des tournées au nom de leur tâche (`ancienne:true`, jamais
écrite) ; dès que la liste existe, même vide, elle fait seule foi. Une parcelle arrachée ou disparue qui était dans l'ordre est
gardée telle quelle en fin d'ordre — jamais perdue ; une parcelle ajoutée après coup arrive en fin de liste avec « à placer ».

### 330d. Les écrans
**Roue crantée de la Vigne › Tournées** (admin) : la liste, « Sans tournée : … », « Nouvelle tournée ». **L'éditeur** (plein écran,
posé sur `<body>`) : nom, « L'équipe la suit pour » (tâches de la saison, catalogue, activités du tracteur), la liste (poignée à
glisser à la souris ou au doigt, sans appui long ; toucher une ligne ouvre le menu premier / monter / descendre / dernier /
placer après ; Alt ↑ ↓), « Ranger automatiquement » (au plus proche en partant de la n° 1, par commune, ordre du domaine, grandes
d'abord, inverser — avec les kilomètres), recherche, Annuler / Rétablir (Ctrl Z, Ctrl Maj Z, Ctrl S), la carte aux contours KML
avec numéros et trajet, « Tracer sur la carte ». Téléphone : Liste / Carte. **Parcelles** : la barre porte « Tournée « nom » » ;
l'admin a « Modifier » ; l'ouvrier n'a plus « Tri normal », et une préférence posée avant sur son téléphone ne l'en sort plus
(`_pOrdOff`). **Décider** : plus d'« Enregistrer la tournée » ; une ligne « Tournée « … » · réglée le … » et « Modifier la tournée » ;
les tris restent un essai à l'écran. `_opSaveOrder`, `_opClearOrder`, `_opDirty` supprimées (plus aucun appelant).

### 330e. Compatibilité et format
`_trnEcrire` réécrit aussi `CONFIG.ordre_passage_t` (noms, par tâche) : Décider le lit, un appareil pas encore à jour aussi.
`MV_FORMAT` passe à **2** (nouvelle structure en base, règle VER-1) : un appareil resté en 8.97 arrête d'écrire jusqu'à sa mise à
jour. Un événement `mv-tournees` redessine Parcelles et Décider s'ils sont à l'écran ; chez l'équipe, la tournée arrive à la
prochaine ouverture (config lue au démarrage).

### 330f. Pièges
- `index.html` portait **cinq** « 8.97 » : le cinquième était une coordonnée SVG (`8.973`). La montée de version cherche `v8.97`.
- Le guide écrit deux-points et guillemets avec des espaces insécables : les ancres du patch tolèrent les deux espaces.
- `mv-harnais-liste.mjs` cite chaque harnais deux fois (normal, `--contre`) : l'insertion se fait sur le bloc, pas sur une ligne.
- L'éditeur a d'abord été écrit en bloc à la fin de `reglages.js` : +13 % d'un coup, refusé par le cliquet de poids des
  modules (`mv-harnais-typo`, +5 % par lot). Un écran entier = un module : `src/tournees.js`, importé par `reglages.js`.
- Le même cliquet a ensuite rougi sur `styles.css` (705 → 747 ko, +6 %). Question posée, comme il le demande : découper la
  feuille ? Non — le bloc `★★ TRN-1` est une section de la feuille unique (le modèle du projet, un bloc par lot), et la feuille
  reste loin du plafond de 1 024 ko. Cliquet regravé (`--baseline`) dans ce lot, `scripts/typo-baseline.json` livré avec.
- Le glisser mesure la hauteur réelle de la ligne : une hauteur supposée décalerait l'insertion d'un thème à l'autre.

### 330g. Mesuré
`scripts/mv-harnais-trn1.mjs` : 12 vérifications sur les fonctions réelles, 6 contre-épreuves rouges. La maquette (même logique de
glisser, de menu et de tracé) a été jouée dans Chromium au doigt et à la souris ; l'éditeur intégré reste à regarder chez Nico.

## 331. ★★ TRN-2 — UNE TOURNÉE PAR ÉQUIPE, ET LA TOURNÉE AVANT LA PROXIMITÉ (14/10 — `src/utils.js` (`_mvTourneeEquipe`, `_mvOrdreMoi`, `_mvTourneeNoms`, `_mvOrdreRangs(…, moi)`, l'anneau, aide, APP 8.99, `MV_FORMAT` 3, WHATS_NEW) · `src/app.js` (Parcelles : `_pOrdLire`, `_pOrdTitre`, `_pProxBloque` ; Équipes du jour : `_mvEqRows`, `_mvEqTrn`, `_mvEqBrut`, `_mvEqEcrire`) · `src/styles.css` · `index.html` · `public/sw.js` v9.78 · `guide/04-vigne.html` · `scripts/mv-harnais-trn2.mjs`)

### 331a. D'où ça vient
Les deux points laissés ouverts par TRN-1 (§330). Nico (14/10) : « il faut les fermer, point. » Reformulé, validé (« oui ») :
une tournée par équipe dans « Équipes du jour », par défaut celle du travail, chaque salarié voyant ses parcelles dans l'ordre de
son équipe ; et la tournée passe devant le tri « par proximité » — l'équipe perd ce bouton quand un travail suit une tournée,
l'administrateur le garde.

### 331b. Le modèle
Les équipes vivent au jour (ÉQUIPES-1) : la tournée s'y range, `CONFIG.equipes_jour[jour][i] = { m:[noms], t:'<id>' }`, `t`
absent = celle du travail. `_mvTourneeEquipe(nom, jour)` la retrouve ; `_mvOrdreMoi(tâche)` la sert à la PERSONNE CONNECTÉE
(sinon la tournée du travail, et une tournée supprimée depuis retombe sur celle du travail). Elle vaut pour toute la journée de
l'équipe, quel que soit le travail affiché. `_mvOrdreFor` ne change pas : Décider et le Tracteur gardent la tournée du travail.
`MV_FORMAT` passe à 3 (nouveau champ en base, règle VER-1) — un appareil en retard qui réécrirait les équipes ne peut plus
effacer `t`.

### 331c. Les écrans
**Équipes du jour** (admin, Accueil) : sous les noms, « La tournée de chaque équipe », un choix par équipe formée (« Celle du
travail » ou une tournée), relu à la réouverture par `_mvEqBrut` (même filtre et même ordre que `_mvEqJour`, sinon les numéros
d'équipe se décalent). **Parcelles** : liste, numéros, barre (« Tournée « Sud » · votre équipe »), carte et anneau suivent la
tournée de l'équipe ; « Modifier » ouvre la tournée affichée. **Proximité** : `_pProxBloque()` — ouvrier ET travail suivi par une
tournée — retire la barre et ignore un tri déjà actif ; calculé une fois avant le tri (`_proxOK`), jamais dans le comparateur.

### 331d. Mesuré
`scripts/mv-harnais-trn2.mjs` : 14 vérifications sur les fonctions réelles (utils.js et app.js), 5 contre-épreuves rouges. TRN-1
et TOURNEE-1 restent verts (12 + 6 ; 19 + 15).


## 332. ★★ SANSREC-1 — « PAS DE RÉCOLTE CETTE ANNÉE » : UNE PARCELLE EN PLACE QU'ON NE VENDANGE PAS SORT D'« ENCORE SUR PIED », DU MILLÉSIME ET DU REVIENT (14/10 — `src/utils.js` (bloc SANSREC-1 : `_mvEstVendange`, `_mvVendangePers`, `_mvSansRecolte` ; APP, WHATS_NEW, MV_AIDE Cave, Parcelles et Pilotage, MV_INFO `pil.eco.revient` et `pil.eco.revrdt`) · `src/cuvier.js` (`_vendResteARentrer` → `sans`, `vend` ; `_vendResteHtml` ; le style) · `src/app.js` (la feuille en mode récolte : `openRecParc`, `_mvRecSave`, `_mvStatutPer`, `_mvRecHa`, `_SELP_INTRO.rec`, `_mvSelListe`, `_mvSelRows`, `_mvSelPick`, `saveSelParc`) · `src/pilotage.js` (`_pecRevReport`, `_pecRevData`, `_pecRevCalc`, `_pecViewRevient`, `_PEC_REV_SRC`, `_pecCss`) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-sansrec1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/SANSREC-1.json` · **APP 8.99 → 9.00, SW 9.78 → 9.79**, base `8336681`)

### 332a. La demande
Nico (14/10) : une parcelle « en vue de l'arrachage lors des vendanges », rendue impropre à la récolte avant, apparaît « dans les stats en tant que parcelle en attente d'être vendangée » — « comment faire (sans toucher au code) ». Réponse lue dans le code : seule « Arracher cette parcelle… » l'en sort ; la Vendange désactivée (RETRAIT-1) ne joue que côté Vigne. Puis « et avec code ? » : reformulé (sa préférence), « oui » ; maquette sur une toile Design (Récoltes avant, la feuille, Récoltes après, Revient), « Continuer ».

### 332b. Ce qui existait
- « Encore sur pied » (`_vendResteARentrer`, CUV-4) : toute parcelle active sans récolte saisie dans l'année ; seul le statut `Arrachee` l'en sortait. Le millésime (`_mlResteARentrer`), Pilotage › Cave (`c.reste`) et le Revient (`complet` de `_pecRevCycle`) lisent ces lignes.
- Le Revient (`_pecRevData`) : une parcelle non récoltée prend la moyenne de ses millésimes (escalier REV-1) — des bouteilles qui n'existeront pas — et garde l'état « probable ».
- RETRAIT-1 (§325) : la Vendange désactivée sur une parcelle pour une période (`p.horsPer`) était lue par l'avancement, le planning et L'année — pas par la Cave.

### 332c. La règle (utils.js, bloc SANSREC-1, juste après le bloc RETRAIT-1)
- `_mvVendangePers(mil)` : la tâche de vendange (`_mvEstVendange` : `t.couperet`, sinon « Vendange(s) » à l'égalité stricte sur `_mvNormTache`) et les périodes de l'année civile `mil` qui la portent dans leur liste.
- `_mvSansRecolte(p, mil, V)` : en place, et concernée par la vendange dans AUCUNE de ces périodes (`_mvConcernePer`). Une récolte saisie l'emporte : c'est le lecteur qui le vérifie (`faites` passe avant, dans `_vendResteARentrer`). Sans période qui porte la vendange cette année-là, rien n'est sans récolte.
- Aucun champ neuf, aucune collection : le fait est celui de RETRAIT-1. L'an prochain, la période de vendange est une autre : tout repart à récolter.

### 332d. Ce qui a été fait
- **Le Cuvier** : `_vendResteARentrer` rend aussi `sans` (triée) et `vend` ; la carte nomme les sans-récolte (« Pas de récolte cette année : … · Modifier », trois noms au plus, sinon leur nombre), propose à l'admin « Une parcelle ne sera pas récoltée ? » (`#mvv-reste-q`, cible de la nouveauté) tant qu'il n'y en a aucune et qu'une période porte la vendange ; « Tout est rentré » compte les parcelles à récolter.
- **La feuille** : celle de RETRAIT-1 en mode `rec` (`openRecParc(mil)`) — « Récolte 2026 », les parcelles encore sur pied (cochées) et les sans-récolte (décochées, « pas de récolte »), surface à la française, total « n à récolter sur N · k sans récolte, x ha ». Une vendange commencée (`_mvStatutPer` : `p.taches` pour la période active, `p.tachesAll` sinon) reste cochée. `_mvRecSave` écrit période par période (`_mvHorsPose` / `_mvPerRemet`), recalcule, sauve, redessine la Cave ; garde admin dans `saveSelParc`.
- **Le Revient** : `_pecRevData` lit la liste du Cuvier (une seule source) ; `_pecRevReport` reporte le coût du cycle des sans-récolte, poste par poste, à la surface sur les autres vignes en place (ARRACH-5, sans changer de poste) ; `_pecRevCalc` les range en `x` (ni hL ni bouteille, hors `T.n` : le « constaté » ne les attend plus ; surface dans `T.ha` et `T.haX`) ; la vue le dit (cadre, sous-ligne du rendement, note, pastille, « coût réparti »).
- Aide : MV_AIDE Cave, Parcelles, Pilotage ; MV_INFO `pil.eco.revient` et `pil.eco.revrdt` ; guide 08, 04, 11 ; WHATS_NEW 9.00 (niv 1 admin sur `#mvv-reste-q`, niv 0 pour le Revient).

### 332e. Arbitrages
- **Le fait de RETRAIT-1 plutôt qu'un drapeau « non récoltée » par millésime** : un drapeau neuf aurait dû rester d'accord avec la Vendange de la période (deux vérités). Le prix : relier la période au millésime (`_mvVendangePers`), et exiger la désactivation sur CHAQUE période de l'année qui porte la vendange.
- **Une entrée en pied de carte et la feuille commune** (maquette validée) plutôt qu'un bouton par ligne : plusieurs parcelles d'un coup (une grêle), même composant que RETRAIT-1.
- **Le coût d'une vigne non récoltée pèse sur les autres**, à la surface et poste par poste : elle ne donne pas de vin, le domaine en porte la charge (ARRACH-5). La note dit « sur les autres vignes » (la maquette disait « récoltées », faux pendant la vendange).

### 332f. Trouvé en route
1. ★ **Le contraste a vu la pastille** : la famille `tag-orange` (texte sur fond) fait 4,14 en clair ; `mv-harnais-contraste` a rougi (pilotage.js : 4 → 5 écarts). Encre `--orange-tx` sur `--tag-orange-bg` : retour à 90. La maquette (brun) n'avait pas de variante sombre.
2. `_pvSurfFr` écrit quatre décimales (« 0,4200 ») ; la feuille de SEL-1 et RETRAIT-1 écrit la surface brute (« 0.42 »). Le mode récolte arrondit à deux décimales (`_mvRecHa`) ; les autres modes sont inchangés.
3. Le bouton « Enregistrer » d'`ovSelParc` n'a que la classe `mbtn` : aucune couleur dans la feuille de style (le gris du navigateur). Vu, non touché.
4. Le chevron d'« Encore sur pied » est `ic-chevron` (vers le bas) tourné de 90° une fois ouvert : il pointe à gauche. Vu, non touché.
5. Deux définitions de « la vendange » : `_mvEstVendange` (utils.js) et `_rfEstCouperet` (pilotage.js), même règle. À faire converger avec les harnais qui isolent la seconde.
6. `CLAUDE.md` était à 2 798 lignes sur 2 800 : deux renvois ✅ déjà racontés dans le journal (la fusion de `pilotage.js`, les journées du 11 août) ont quitté le cœur pour faire place au §28.

### 332g. Mesuré
- `mv-harnais-sansrec1.mjs` (neuf) : **31 vérifications** sur les vraies fonctions réunies dans un seul contexte (règle, Cuvier, feuille, Revient, câblage), **12 contre-épreuves**, toutes rougissent.
- Voisins rejoués : `reste-a-rentrer` 26 + 6/6, `retrait1` 33 + 14/14, `selection` 31 + 9/9, `revient` 26 + 10/10, `hors1` 31, `cuvier` 15, `arrach8` 49, `dates1` 21, `jetons` 33, `echelle` 29, `info` 132, `typo` 7, `contraste` 9 (après la correction ①), `globaux` vert, `mv-whatsnew-check` vert ; preflight 0 erreur, 9 avertissements (comme la base).
- **La chaîne complète** (`mv-lanceur --continuer`, guide régénéré le temps de la jouer puis remis) : **399 commandes, 0 rouge**, 1 100 s sur un seul cœur.
- **Non vérifié** : aucun navigateur, ni ses données ; le rendu des quatre écrans au téléphone et sur PC ; `test:smoke`, `test:e2e`.

### 332h. Ouvert
§28 « SANSREC-1 — CE QUI RESTE OUVERT ».

## 333. ★ BRUIT-1 — LE E2E LOCAL TOMBAIT SUR « STOCKAGE PERSISTANT REFUSÉ » : UN BRUIT D'ENVIRONNEMENT, PAS UNE ERREUR DE RENDU (14/10 — `scripts/e2e-local.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/BRUIT-1.json` · aucun bump, base `379e4b9`)

### 333a. Le constat
La CI de SANSREC-1 (§332) : `npm run test:e2e` rouge, « ✖ Action dock (1) », un seul message : `[MaVigne Error] INFO [stockage] Stockage persistant refusé par le navigateur`. Toutes les autres étapes vertes.

### 333b. La cause (lue dans le code, pas rejouée)
- Le e2e local coupe le réseau Firebase : une écriture du parcours échoue et part en file après trois tentatives (`fbSave`, attentes 1 s, 2 s, 4 s).
- La première mise en file demande la persistance du stockage (STOCK-1, 26/09, `_mvDemanderPersistance`) ; Chromium sans tête la refuse (ni installée, ni usage). Le refus est journalisé au niveau INFO par `logError`, qui écrit en `console.error`.
- Le e2e retient tout `console.error` hors `BENIGN` et l'impute à l'étape EN COURS : le refus arrive plusieurs secondes après l'écriture et tombe où il tombe, ici le dock. Un message d'environnement, comme `Quota` ou `ServiceWorker` déjà dans la liste.
- SANSREC-1 n'ajoute aucune écriture au parcours : son seul `saveData` (`_mvRecSave`) est derrière « Enregistrer » de la feuille de récolte (`git show 379e4b9 -- src/`).

### 333c. Ce qui a été fait
`/Stockage persistant refus/i` rejoint `BENIGN`, la raison en commentaire. L'appli ne change pas : l'entrée INFO reste au journal, elle sert au diagnostic (`window._mvStockagePersistant`). Les listes de `smoke.mjs`, `e2e.mjs` et `mv-tour.mjs` sont inchangées.

### 333d. Mesuré, non vérifié
- Syntaxe du script ; contrôles de la doc (`harnais-claude-md`, index) verts ; garde des lots verte.
- **Non vérifié** : le e2e lui-même (pas de navigateur Playwright ici ; l'historique de la CI illisible, l'API GitHub refusant les lectures pour limite de débit) ; pourquoi le refus n'était jamais tombé dans le parcours avant — probablement le temps, puisqu'il arrive plusieurs secondes après l'écriture. La prochaine CI le confirmera.
## 334. ★ LARG-1 — SUR ORDINATEUR, TOUS LES MODULES À LA MÊME LARGEUR : 1 200 PX CENTRÉS, COMME LE PILOTAGE ET LA VIGNE (14/10 — `src/styles.css` (la règle de largeur ; la barre d'onglets de la Réserve) · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-larg1.mjs` (neuf) · `scripts/mv-harnais-kit1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/LARG-1.json` · **APP 9.00 → 9.01, SW 9.79 → 9.80**, base `710c664`)

### 334a. D'où ça vient
Nico (14/10, trois captures du PC : Pilotage, Vigne, Tracteur) : « sur ordi les écrans de pilotage et de vigne ne sont pas à la même largeur que les autres écrans. il faut qu'ils soient tous comme pilotage et vigne ». Reformulé en trois phrases (sa préférence), le Planning signalé comme seul point à trancher ; réponse : « oui (fais une maquette pour planning) », puis « Continuer ». Maquette du Planning et trois choix — A borné comme les autres, B « Le mois » seul, C pleine largeur : « A ».
Rebâti le 15/10 sur `710c664` : BRUIT-1 (§333, un script du e2e et la doc, aucun bump), poussé entre-temps sur la même base `379e4b9`, avait pris le numéro 333. Le code du lot est inchangé ; la section devient §334, la consolidation de BRUIT-1 descend dans le journal.

### 334b. La cause, lue puis mesurée
- `styles.css`, KIT-1 (§226) : « La largeur sur grand écran : une seule, 1 200 px (Accueil, Parcelles, Pilotage — les autres modules aux lots 3b/3c) ». KIT-3 (§228) et KIT-4 (§229) ont repris les barres et les surfaces, jamais la largeur. RSV-1 a même ouvert la Réserve à toute la largeur « comme les autres modules » : deux décisions contraires, que Nico tranche.
- Rendu de la vraie appli (méthode §270c : serveur Vite du dépôt, réseau externe coupé, données injectées par `applyFbData`, connexion DOM réelle, seul `signInWithEmailAndPassword` simulé ; Chromium de §192b sans `--single-process` ni `--hide-scrollbars`), fenêtre de 1 536 px — sa largeur probable d'après ses captures : zone de contenu 1 284 px ; Accueil, Parcelles et Pilotage à 1 200 px centrés, titre à x = 357 ; Journal, Tracteur, Phyto, Cave, Réserve, Planning et Réglages à 1 282 px, titre à x = 316. Les 41 px de ses captures.
- Le Journal manquait aussi : onglet de la Vigne, il élargissait la Vigne au passage d'Accueil à Journal.

### 334c. Ce qui change
- La règle porte dix pages (`#page-home,#page-parcelles,#page-journal,#page-pilotage,#page-tracteur,#page-phyto,#page-cave,#page-reserve,#page-planning,#page-reglages`), même seuil (fenêtre ≥ 1 200 px), même jeton `--page-max`. Sous ~1 450 px de fenêtre (barre ouverte), la zone fait moins de 1 200 px : rien ne bouge.
- Trouvé en route : la barre d'onglets de la Réserve (`.mvr-tabs`, 760 px centrés à partir de 768 px, voulus quand le corps l'était aussi) n'avait pas suivi RSV-1 : dans la page bornée, « Fûts » partait à x = 506 contre 286 ailleurs. `#page-reserve .mvr-tabs{ max-width:none; }` rejoint `.mvr-body` dans le bloc ≥ 1 024 px de RSV-1 ; la tablette garde ses 760 px, corps et onglets ensemble.
- Le Planning, après sa maquette : quatre planches (« Le mois » et « Les gens », aujourd'hui puis la règle injectée, à 1 536 et 1 920 px), captures de la vraie appli posées sur une toile Design. Sur « Les gens », la fiche rangée (440 px, PLAN-2 §280) garde sa largeur, la liste prend le reste : 744 px.

### 334d. Mesuré
- Même rendu, sur le code final, à 1 536 et 1 920 px : les dix pages font 1 200 px, marges égales (42 / 42 puis 234 / 234), titre à x = 357 puis 549, premier onglet au bord de la page (celui du Pilotage à + 24 px, `.pil-tabsbar`, avant comme après) ; aucun débordement horizontal, aucune erreur JS. À 1 280 px (rendu de la première étape, Planning encore exempté), rien ne change : pages à 1 026 px. Thème sombre regardé à 1 536 (six modules).
- Planning, « Les gens » : avant, liste 826 px et fiche 440 px à 1 536, 1 210 et 440 à 1 920 ; après, liste 744 px et fiche 440 aux deux largeurs — les chiffres de la maquette.
- `mv-harnais-larg1` (neuf, branché) : 10 vérifications — chaque page de `index.html` bornée par LA règle ou exemptée avec sa raison (`EXEMPTES` : `chat` seul ; le Planning y a été jusqu'à la décision), pas de page fantôme, aucune largeur ni marge latérale reposée sur une page dans la feuille, un module ou `index.html` (mesuré : LA règle est la seule à en poser), les onglets de la Réserve dans le bloc ≥ 1 024 px de son corps — et 15 contre-épreuves qui mordent, dont « le Planning ressort de la règle » et « une règle plus loin recolle le Planning à gauche ». Une faute du harnais avant le vert : une contre-épreuve ancrée sur `'use strict';`, absent de `cave.js` (« motif absent », pas un défaut du code).
- `mv-harnais-kit1` lisait la liste à trois pages mot pour mot (assertion et contre-épreuve) : il garde ses trois pages dans la règle, `mv-harnais-larg1` garde le reste ; 12 vertes, 6/6. Sans cette retouche, la chaîne rougissait.
- Preflight : 0 erreur, 9 avertissements — les mêmes 9 que sur la base `379e4b9` (mesurés sur une copie de la base).
- Chaîne `npm run check` : sur le lot rebâti (`710c664`), 401 commandes, **0 rouge**, 749 s, d’un trait (un cœur, `setsid nohup`), jouée vers 7 h à Paris. Une première passe, sur la base `379e4b9` vers 1 h 10 du matin à Paris — encore la veille en heure universelle —, avait donné 401 commandes et **5 rouges**, tous hors lot (§334f) : `mv-harnais-cuv13` (et sa contre-épreuve) et `mv-harnais-reste-a-rentrer` rougissent dès que la date locale diffère de la date universelle, sur le lot comme sur la base — reproduit le 15/10 vers 6 h 40 sous les fuseaux de Los Angeles et d'Honolulu, verts sous Paris, UTC, New York et Tokyo, dont la date était alors celle d'UTC ; `mv-harnais-ref1` (et sa contre-épreuve, « la fin prévue, l'objectif et la marge viennent de _pilMargeCalc ») vert rejoué seul, lot et base, non reproduit. Avant elle, la première étape (Planning encore exempté) : 401 commandes, 0 rouge, 772 s.

### 334e. Arbitrages
- **A plutôt que B** (« Le mois » borné, « Les gens » en pleine largeur) : B aurait fait changer la largeur d'un onglet à l'autre du Planning — le défaut même que Nico signalait. La liste garde 744 px : le nom, la barre et les heures y tiennent (captures).
- **Une liste d'identifiants plutôt que `.page`** : la règle reste lisible page par page (le `#page-chat` mort s'en exempte sans `:not()`), et c'est le harnais, pas le sélecteur, qui force une page neuve à choisir.
- **La maquette du Planning est faite de captures de la vraie appli**, pas d'un dessin : seule la largeur change, et une capture ne peut pas mentir sur une largeur.
- **Rien n'est purgé** (§25.15) : `.page{max-width:none}` du vieux bloc « RESPONSIVE SIDEBAR » reste, sans effet face aux identifiants.

### 334f. Trouvé en route, hors lot : la date du jour en heure universelle
- **Un vrai défaut de l'appli, en ligne** : `cuvier.js`, `_vendSince(s)` fait `new Date(s).getTime()` sur « AAAA-MM-JJ », qui se lit à minuit en heure UNIVERSELLE, puis compte les jours jusqu'à `Date.now()`. Dès que la date locale diffère de la date universelle — à Paris, de minuit à 2 h l'été, à 1 h l'hiver —, le compte est faux d'un jour : une cuve relevée la veille n'est pas « à mesurer » (`_vendStale` = 0), un relevé du jour compte −1. `_vendAujId`, dans le même fichier, est lui en heure locale. `mv-harnais-cuv13`, dont le décor est en heure locale (juste), est celui qui l'a vu. Correctif probable : lire la date en local, ou comparer des identifiants de jour — pas fait ici, hors lot ; décision de Nico.
- **Un défaut de contrôle** : le décor de `mv-harnais-reste-a-rentrer` date en UTC (`iso = ms => new Date(ms).toISOString().slice(0, 10)`), l'appli compte en heure locale, à raison — A9, « âge de la dernière analyse », sort −1 au lieu de 0 dans la même fenêtre.
- `mv-harnais-ref1` : un rouge à 1 h 10, non reproduit (ci-dessus). Même famille probable, pas prouvée.

### 334g. Ouvert
§28 « LARG-1 — CE QUI RESTE OUVERT ».

## 335. ★★ RANGE-1 — LE MILLÉSIME RANGÉ : UNE TÊTE ET QUATRE VUES, LA CHAÎNE DE CHAQUE CUVÉE (15/10 — `src/cave.js` (la tête `_mlHead`, `_mlEtat` ; Ensemble `_mlRenderVie`, `_mlBlocFlux`, `_mlBlocCuvees`, `_mlBlocVeille`, `_mlBlocReperes` ; Parcelles `_mlRenderParc` ; Cuvées `_mlRenderCuv`, `_mlCuvFicheHtml`, `_mlCuvInfo` ; la chaîne ex-CHAINE-1 `_pcrbCvLignes`, `_pcrbCvCellules`, `_pcrbCvCelHtml` et leurs aides ; `_pcavVueCourbes` en grille ; `renderCaveMillesime`, `_mlSetTab`, `_mlSetCuv`, `_mlCuvRetour`, `_mlSetParcF`, `_pcrbSetVue` ; `_pcrbChaine`, `_PCRB_CH`, `_mlOrigine` retirés ; `_pcavInjectCss`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave, MV_INFO `cave.cuvees` neuf) · `index.html` (`#ml-head`, quatre onglets) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-range1.mjs` (neuf) · `scripts/mv-harnais-cave-mil.mjs` · `scripts/mv-harnais-robustesse-cave.mjs` · `scripts/mv-harnais-vol1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/RANGE-1.json` · **APP 9.01 → 9.02, SW 9.80 → 9.81**, base `04baf84`)

### 335a. La demande
Nico (15/10) : dans Le millésime, « je n'ai qu'une seule parcelle de la récolte à la bouteille » — d'où CHAINE-1 (une ligne par cuvée), livré sur `379e4b9`. Puis : « l'idéal serait de ranger à la perfection cet onglet millésime, tout est les uns au-dessus des autres… nous sommes une application pro, regarde ce qu'il se fait de mieux et propose ». Reformulé, « exact » ; recherche (vintrace, InnoVint, règles des tableaux de bord, petits multiples) ; maquette (toile Design : ordinateur, téléphone, à jouer), « parfait ». Entre-temps BRUIT-1 (§333) et LARG-1 (§334) avaient pris les numéros de CHAINE-1 : **CHAINE-1 n'est pas appliqué, ce lot l'absorbe**.

### 335b. Ce qui n'allait pas (lu dans le code de la 9.01)
- Deux onglets, chacun une seule colonne : La ligne de vie empilait les pastilles, les tuiles, le parcours, « encore sur pied », le rendement par parcelle, l'origine des cuvées et N-1 ; Les courbes, un texte puis cinq cartes. Sur ordinateur, tout s'étirait sur 1 200 px sans ordre d'importance.
- La carte « De la récolte à la bouteille » ne montrait qu'UNE cuvée, prise dans tous les millésimes, jamais une cuve pas encore décuvée (§335 reprend CHAINE-1).
- « D'où vient chaque cuvée » et la chaîne disaient deux moitiés de la même chose, à deux endroits.

### 335c. La règle
- **Une tête commune** (`#ml-head`, rendue à chaque vue) : « Le millésime », l'année, son état (`_mlEtat` : En cours s'il reste une cuve à décuver, sinon En élevage, sinon En bouteille ; les vendanges du … au … ; N cuves décuvées sur M), le choix de l'année (`_mlSetMil`, pour toutes les vues) et `_mlTuiles` inchangées.
- **Quatre vues** (`_mlTab` : vie, parc, cuv, crb ; `_mlSetTab('venir')` va toujours à Aujourd'hui) :
  - **Ensemble** — À surveiller (volume entonné à mesurer → Saisir, parcelle au-dessus du maximum, encore sur pied, cuves en fermentation), le parcours `_mlFluxSvg`, les cuvées en une ligne chacune, les repères (récoltes, décuvages, mises, aujourd'hui) et la carte face à N-1 (`_pcavN1`). Au téléphone : À surveiller d'abord ; à partir de 1 024 px, deux colonnes.
  - **Parcelles** — `_mlRendements`, trié du plus haut au plus bas ; filtres Toutes / Au-dessus du maximum / Vendues / Encore sur pied ; mêmes textes qu'avant (fourchette tant que rien n'est mesuré, « ≈ » sur le pourcentage, maximum hérité nommé, plafond du millésime nommé) ; en tableau à partir de 1 024 px.
  - **Cuvées** — la liste (`_pcrbCvLignes` : une ligne par cuve du millésime, puis le Chai sans cuve, la récolte sans cuve, le raisin vendu ; quatre points par étape) et la fiche : les quatre étapes (`_pcrbCvCellules`, zone 96 px), d'où vient la cuvée (kilos domaine de sa cuve), ses dates, ses contenants, Saisir le volume entonné (droit d'écriture) et Ouvrir au Chai / au Cuvier. Au téléphone, la liste ouvre la fiche ; sur ordinateur, côte à côte.
  - **Courbes** — les quatre cartes (`_pcrbMat`, `_pcrbDens`, `_pcrbTemp`, `_pcrbElev`) en grille de deux à partir de 1 024 px ; au téléphone, une à la fois (pastilles, `_pcrbVue`). Elles lisent les cuves en cours : sur une autre année, la vue le dit.
- La chaîne garde les règles de CHAINE-1 : mêmes étapes que le Chai (`_caveBilanChaine`, ou ses briques pour une cuve sans cuvée), entonné compté seulement mesuré, apport à part, étape absente en pointillé, barres en px.

### 335d. Ce qui a été fait
- `cave.js` : les vues ci-dessus ; `_pcrbChaine` (une seule cuvée), `_PCRB_CH` et sa pose, `_mlOrigine` (plus d'appelant) retirés ; la clé de la carte des maturités est `matu` (« mat » est une clé retirée du Pilotage : le préflight la relève) ; CSS par jetons dans `_pcavInjectCss`.
- `index.html` : `#ml-head` au-dessus de la barre ; quatre onglets (Ensemble, Parcelles, Cuvées, Courbes), sans icône sous 600 px.
- Aide : MV_AIDE « Le millésime » et « La chaîne De la récolte à la bouteille » réécrits ; MV_INFO `cave.cuvees` (neuf) reçoit le texte de la chaîne, retiré de `cave.courbes` ; guide 08 ; WHATS_NEW 9.02 (niv 1, admin et cave, sur `#ml-tab-cuv`). La visite guidée ne change pas.

### 335e. Arbitrages
- **Une tête et quatre vues plutôt que deux colonnes plus courtes** : le chiffre qui compte en haut, le détail un cran plus loin (règles des tableaux de bord ; InnoVint adapte la fiche d'un lot à son étape).
- **Les tuiles d'avant** plutôt que cinq chiffres neufs : `_mlTuiles` et son harnais restent.
- **Rien de neuf n'est calculé** : chaque bloc relit une fonction existante ; « À surveiller » ne fait que ramener ce que les autres savent.
- **Le découpage de `cave.js`** : 636 → 667 ko, sous le cliquet des 5 % (commentaires resserrés, règles de pastilles fusionnées). Le prochain gros lot de la Cave devra d'abord poser la question d'un module à part pour le millésime.

### 335f. Mesuré
- `mv-harnais-range1.mjs` (neuf) : **21 vérifications** sur les vraies fonctions (cave.js + cuvier.js réunis, bouchons nommés : tuiles, rendements, sur pied, cartes des courbes) — la chaîne (ex-CHAINE-1), la tête, À surveiller, les repères, Parcelles, Cuvées, la fiche, les Courbes, l'échappement, le millésime vide, le câblage ; **19 contre-épreuves**, toutes rougissent.
- Réécrits : `cave-mil` 41/41 (les tuiles passent dans la tête, `_mlSetTab` à quatre vues, deux assertions neuves) ; `robustesse-cave` 17 (Parcelles et Cuvées dans le parcours) ; `vol1` D14 relit la fiche — 48 + 19/19.
- Rejoués verts : `asm1` 48 + 17/17, `cave-auj` 51, `rdtmil` 85, `courbes` 44, `crb2` 66 (+ contre), `cave4` 7 + 6/6, `axe` 33, `echelle` 29, `couches` 14, `contraste` 9, `jetons` 33 (le repli de `--shadow-sm`), `typo` 7, `info` 132, `globaux`, `version` 28 + 7/7, `mv-version-json --test` (9.02), `mv-whatsnew-check`, `larg1` 10, `kit1` 12, `sansrec1` 31, `trn2` ; preflight : 0 erreur, les avertissements de la base.
- **Lanceur complet** (`mv-lanceur`, relancé après le premier essai de Nico) : vert de bout en bout. Il a trouvé trois fautes, corrigées dans ce lot : `_ML_MOIS` déclaré une seconde fois (cliquet ESLint, `no-redeclare` — la table de « Ce qui vient » est la même, reprise) ; la flèche « ← » du retour à la liste comptée comme une icône (`mv-harnais-icones`, cave 22 → 23 — remplacée par `_mvIcon('gauche')`) ; un « ≈ » hors du sous-ensemble de la police (`mv-harnais-subset`, cave 43 → 44 — « À surveiller » dit « mesurés » ou « estimés »). `build-guide --check` ne passe qu'après `npm run site` : le guide change, et `public/guide.html` (dérivé) n'est pas livré.
- **Non vérifié** : aucun navigateur ; `test:smoke`, `test:e2e`.

### 335g. Ouvert
§28 « RANGE-1 — CE QUI RESTE OUVERT ».

## 336. ★★ POURQUOI-1 — « POURQUOI ON LE FAIT » : UNE PASTILLE OUVRE LA FICHE DE CHAQUE TÂCHE, LÀ OÙ LE GESTE A LIEU (15/10 — `src/utils.js` (`MV_POURQUOI`, `MV_SAVIEZ`, `MV_PQ_ALIAS`, `_mvPqSlug`, `_mvPqResout`, `_mvPqCle`, `_mvPqBtn`, l'enregistrement `pqt.<slug>` dans `MV_INFO` ; APP, WHATS_NEW, MV_AIDE Parcelles, Tracteur et Cave) · `src/app.js` (la barre « Priorité du moment », `openValidationPanel`) · `src/tracteur.js` (`openSessionDetail`) · `src/cave.js` (`selCaveOpType`) · `index.html` (`#vp-pq`, `#sd-pq`, `#cop-pq`, les quatre versions) · `src/styles.css` (`.mv-pq`) · `public/sw.js` · `guide/04-vigne.html`, `guide/06-tracteur.html`, `guide/08-cave.html` · `scripts/mv-harnais-pourquoi.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/POURQUOI-1.json` · **APP 9.02 → 9.03, SW 9.81 → 9.82**, base `372df98` ; porte aussi les décisions des maquettes, GRATIF-0 au §28)

### 336a. La demande
Les maquettes ERGO-0 et GRATIF (03 → 15/10, bloc GRATIF-0 du §28). Nico, 15/10 : « les petites informations de pourquoi on fait telle tâche ou telle tâche, c'est hyper important : ça aide tout le monde à ouvrir un petit peu l'appli, à valider ce qu'ils sont en train de faire, à discuter entre eux » — puis « go ». Premier lot de l'intégration, choisi pour cette raison.

### 336b. Ce qui est fait
- **Le catalogue** `MV_POURQUOI` : 37 fiches `{d, n, q, p, v}` — 17 de la vigne (les tâches de `TACHES_CATALOGUE`, plus le relevage et le dégraffage), 6 du tracteur, 5 du cuvier, 9 du chai — et `MV_SAVIEZ`, six faits pour la vigne et six pour la cave, choisis selon le jour. Écrits pour tous les domaines clients : rien de propre à une région.
- **La résolution** `_mvPqResout(libellé, contexte)` : sans accents ni espaces, un alias par contexte (« traitement » : la vigne au tracteur, le vin en cave), un pluriel toléré. Un libellé sans fiche ne pose rien : pas de pastille morte.
- **La bulle** : les fiches entrent dans `MV_INFO` sous `pqt.<slug>` au chargement ; la pastille porte `data-mvi`, donc l'écouteur délégué et la bulle des fiches « i » font le reste (BULLE-1). Quatre paragraphes : Quand, Pourquoi, Pour le vin, Le saviez-tu.
- **Les points de pose** : dans les Parcelles, la barre « Priorité du moment » quand elle est verrouillée, sinon la rangée des tâches à côté de la tâche choisie (l'admin) — `_mvPqBtn(pTacheFilter,'vigne')` ; la feuille de validation (`#vp-pq`), la fiche d'une session tracteur (`#sd-pq`), « Nouvelle opération » de la cave au choix du type (`#cop-pq`).
- **Le style** `.mv-pq` : la taille de la pastille « i » (décision du 26/09, §176d), des couleurs par jetons.
- ⚠️ **Rebâti sur `372df98`** : le lot était écrit sur `2c16613`, où RANGE-1 laissait deux rouges à `npm run check` (`_ML_MOIS` déclarée deux fois, un « ← » hors sprite). Corrigés ici d'abord, puis par la reprise de RANGE-1 poussée entre-temps : la correction de ce lot a été retirée, celle de la reprise gardée.

### 336c. Ce qui a été vérifié
- `scripts/mv-harnais-pourquoi.mjs` : 21 assertions (le catalogue exécuté ; la couverture du catalogue des tâches, des types d'opération du Chai et des activités du tracteur ; aucun HTML dans les textes ; la forme des clés ; les points de pose ; le style) et 3 contre-épreuves (une fiche retirée, du HTML glissé, l'alias de cave retiré).
- `mv-harnais-info` (132/0) et `mv-harnais-bulle1` (45/0) restent verts. ⚠️ L'attribut `data-mvi` de la pastille se construit en deux morceaux : écrit en dur avec une clé calculée, le contrôle statique de mv-harnais-info l'aurait pris pour une fiche manquante.
- Preflight : 0 erreur. ⚠️ Vécu : le service worker porte sa version à **quatre** endroits — l'en-tête, `CACHE_NAME` et deux `console.log` ; le preflight a rougi sur les deux derniers.
- `npm run check` : voir la note de livraison.

### 336d. Ce qui n'a pas été vérifié
- Aucun rendu dans un navigateur avec les données d'un vrai domaine : c'est le premier point du §28.

## 337. ★★ ARRIVEE-1 — CHEZ L’OUVRIER, LA VIGNE A DEUX ONGLETS : ACCUEIL ET PARCELLES (15/10 — `src/app.js` (`_mvJournalOuvert` neuf ; `applyRoles`, `goTo`, `switchVigneOng`, `renderHomeRaccourcis`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` (`#home-trv-tout`, `#home-msem-journal`, `#home-msem-trace`, les quatre versions) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrivee1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ARRIVEE-1.json` · **APP 9.03 → 9.04, SW 9.82 → 9.83**, base `372df98`, cumulatif avec POURQUOI-1)

### 337a. La demande
Maquette ERGO-0, décisions de Nico : l’ouvrier dont l’équipe porte la priorité arrive sur les Parcelles, déjà réglées (vérifié : `_goLanding` lit `_prioForMember`) ; « si oui enlève le valider de l’accueil », « enlève noter au journal » (13/10) ; « l’ouvrier n’a même pas à accéder au journal » (14/10). Deuxième lot de l’intégration ; l’arrivée sur Parcelles resserrée devient ARRIVEE-2.

### 337b. Ce qui est fait
- **Une seule question** : `_mvJournalOuvert()` — vraie pour l’admin et le pilotage, fausse pour l’ouvrier, le tractoriste et le saisonnier. Lue sur les rôles du membre, comme `canSeePilotage`.
- **Les onglets et les liens** (`applyRoles`) : les deux onglets « Journal » (`#vng-ong-journal`, `#vng-ong-journal-p`) et « Tout voir » des derniers travaux sont cachés chez l’ouvrier ; dans « Ma semaine », « Journal › » laisse la place à « Ma trace › ».
- **La navigation** : `goTo('journal')` et `switchVigneOng('journal')` mènent aux Parcelles chez l’ouvrier — un lien du fil des derniers travaux, la recherche Ctrl K, une adresse.
- **Les raccourcis de l’Accueil** : ni « + Journal » ni « Valider » chez l’ouvrier ; « Ma trace » reste, et « Session » pour le tractoriste.
- **L’aide, le guide, le Quoi de neuf** : un point « Chez un ouvrier » dans la fiche de l’Accueil, une carte dans le guide de la Vigne, une nouveauté pour l’admin et l’ouvrier.

### 337c. Ce qui a été vérifié
- `scripts/mv-harnais-arrivee1.mjs` : 11 assertions — `_mvJournalOuvert` EXÉCUTÉE sur huit jeux de rôles, puis ses usages — et 3 contre-épreuves (le tractoriste qui retrouve le Journal, la garde de `goTo` retirée, « Valider » revenu à l’Accueil).
- **Au navigateur** (Chromium, au téléphone) : compte ouvrier — onglets Journal et « Tout voir » cachés, « Ma trace › » sous « Ma semaine », un seul raccourci « Ma trace », `goTo('journal')` ouvre les Parcelles ; compte admin — tout est là, `goTo('journal')` ouvre le Journal.
- `npm run check` : voir la note de livraison.

### 337d. Ce qui n’a pas été vérifié
- Un vrai compte ouvrier sur un vrai téléphone (§28).

## 338. ★★ ARRIVEE-2 — L’ARRIVÉE DE L’OUVRIER SUR SA PRIORITÉ, RESSERRÉE : PREMIER « VALIDER » DE 800 À 605 PX (15/10 — `src/app.js` (`renderParcelles` : la classe `p-arrivee`, le bandeau ; `_pProchaineMarque` neuf ; `computePStats`) · `src/styles.css` (le bloc ARRIVEE-2, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Parcelles) · `index.html` (`#pf-n-c`, `#pf-n-e`, `#pf-n-a`, les quatre versions) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrivee2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ARRIVEE-2.json` · **APP 9.04 → 9.05, SW 9.83 → 9.84**, base `303c66a`)

### 338a. La demande
Maquette ERGO-0, écran 1 : « le premier Valider est à 886 px du haut… après dix rangées » ; « la priorité est dite une fois » ; « les trois tuiles de chiffres quittent cet écran » ; « la parcelle suivante est marquée Prochaine ». « Suite » de Nico (15/10) après ARRIVEE-1.

### 338b. Mesuré avant de toucher
Au navigateur, 375 × 667, ouvrier de l’équipe prioritaire, sans tournée : en-tête 178 px, tuiles 79, état 32, Liste/Carte 32, bandeau de priorité 60, recherche 42, « Trier par proximité » 32, barre « Priorité du moment » 93, niveau 52, équipe 57 ; premier « Valider » à **800 px**.

### 338c. Ce qui est fait — seulement quand la priorité est verrouillée (`_prioLocked` : ouvrier, pas l’admin)
- **La classe `p-arrivee`** sur `#page-parcelles`, posée par `renderParcelles` : tout le resserrement passe par elle, l’admin ne voit rien changer.
- **La priorité dite une fois** : le bandeau garde le message de l’admin (`priorityMessage`) et s’efface sans message ; la barre « Priorité du moment » des filtres porte la tâche.
- **Les tuiles** s’effacent ; leurs nombres passent sur les filtres d’état (`#pf-n-c`, `#pf-n-e`, `#pf-n-a`, remplis par `computePStats`).
- **L’état et Liste/Carte sur une ligne** : les deux étaient déjà `inline-flex` (TETE-1) ; il manquait une largeur qui compte leurs marges.
- **« Prochaine »** (`_pProchaineMarque`) : la première parcelle à valider dans l’ordre affiché, sur la ligne du nom (la carte ne grandit pas). ⚠️ Appelée avant `_pFicheSync`, jamais en fin de `renderParcelles` : `mv-harnais-cible` tient cette fin.

### 338d. Ce qui a été vérifié
- `scripts/mv-harnais-arrivee2.mjs` : 8 assertions et 3 contre-épreuves (le bandeau qui répète la priorité, « Prochaine » posée en fin de fonction, les tuiles effacées pour tous). `mv-harnais-cible` reste vert.
- **Au navigateur** : ouvrier — classe posée, tuiles cachées, une seule « Prochaine », premier « Valider » à **605 px** ; admin — rien ne change (tuiles visibles, aucune marque).

### 338e. Ce qui reste
- ARRIVEE-3 (§28) : le niveau et l’équipe dans la barre, le tri dans « Filtres ».

## 339. ★★ ARRIVEE-3 — LA PROCHAINE PARCELLE TIENT DANS LE PREMIER ÉCRAN : PREMIER « VALIDER » DE 800 À 530 PX (15/10 — `src/styles.css` (le bloc ARRIVEE-3, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Parcelles) · `index.html` (les quatre versions) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrivee2.mjs` (étendu) · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-330-379.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ARRIVEE-3.json` · **APP 9.05 → 9.06, SW 9.84 → 9.85**, base `303c66a`, cumulatif avec ARRIVEE-2)

### 339a. La demande
Finir l’écran 1 de la maquette ERGO-0 (« un seul bandeau, avec le niveau, l’équipe et la tournée ») pour que le premier « Valider » soit dans le premier écran. « Suite » de Nico (15/10). Après ARRIVEE-2, il restait à 605 px, sous le dock (vers 600 px) d’un écran de 375 × 667.

### 339b. Ce qui est fait — que du style, à l’arrivée seulement (`#page-parcelles.p-arrivee`)
- **Le niveau et l’équipe sur une ligne** : `#p-subsel-wrap` et `#p-team-bar` passent en `inline-block` (60 % et 40 %). Le niveau perd son intitulé (« N1 N2 N3 » se lisent seuls) ; l’équipe se lit à ses pastilles d’initiales, « Changer » ouvre les noms (`openPTeamJour`, inchangé).
- **Une tâche sans niveau** (`_pvRenderSubsel` vide le conteneur) : `:empty + #p-team-bar` rend la ligne entière à l’équipe, noms compris.
- **Les cibles gardent leurs 44 px** (décision du 03/10 : pas de changement de taille des boutons).
- Pourquoi du style plutôt que de déplacer les nœuds : `renderParcelles` réécrit `#p-tache-filter-row` à chaque rendu ; un nœud déplacé dedans y serait détruit, et `_pvRenderSubsel` / `_pvRenderTeamBar` ne le retrouveraient plus.

### 339c. Ce qui a été vérifié
- `scripts/mv-harnais-arrivee2.mjs`, étendu : 11 assertions, 4 contre-épreuves (dont « le niveau remis sur sa propre ligne »).
- **Au navigateur**, ouvrier de l’équipe prioritaire, 375 × 667 : premier « Valider » à **530 px**, la carte « Prochaine » entière au-dessus du dock.

### 339d. Ce qui reste (§28)
- La mesure avec une tournée active ; le bouton « Filtres » de la maquette, à décider.

## 340. ★★ JALONS-1 — LE CALCUL DES JALONS ET LEUR MÉMOIRE : UN DOCUMENT PAR PERSONNE, QU’ELLE SEULE LIT ET ÉCRIT (15/10 — `src/jalons.js` (neuf : `MV_JALONS_SERIES`, `_mvJalonsCompteurs`, `_mvJalonsAtteints`, `_mvJalonsFusion`, `_mvJalonsOuverture`, `_mvJalonsSync`) · `src/firebase.js` (`fbLireJalons`, `fbEcrireJalons`, `_mvJalonsCle`, `_mvJalonsPermis`) · `src/app.js` (l’import, l’accroche dans `_mvApresChargement`) · `firestore.rules` (lecture générale, GUERETTECH et sous-collections sans les jalons ; lecture par la personne ; règle 3 sans les jalons ; règle 6 neuve) · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-jalons.mjs` (neuf) · `scripts/mv-harnais-rules.mjs` (cas B18 à B25) · `scripts/mv-harnais-motifs1.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/JALONS-1.json` · **APP 9.06 → 9.07, SW 9.85 → 9.86**, base `5552168`)

### 340a. La demande
Le plan de l’intégration (bloc GRATIF-0 du §28) : JALONS-1, « le calcul des jalons et le document `jalons_<uid>`, avec ses règles Firestore et le harnais qui les vérifie ». « Suite » de Nico (15/10). Décisions qui le cadrent : pas de classement, de vitesse ni de quantité épandue ; un jalon gagné reste gagné ; le document est lu et écrit par la personne seule, sans l’admin, lecture seule comprise ; une ouverture au plus par demi-journée.

### 340b. Ce qui est fait
- **Le calcul** (`_mvJalonsCompteurs`, bloc exécutable sans `window`) : validations (les siennes et celles de son équipe, sans doublon, sans « Annulé »), km de rangs et pieds (surface × écartements du domaine, `_mvVigne`, part de chacun quand on est à plusieurs), premier hectare par tâche, sessions finies du conducteur, km enjambés, trous de tarière (le champ « Trous » des parcelles cochées), hectares d’engrais et de semis, ouillages, soutirages et dégustations où il est noté (et l’ancien « opérateur »), années depuis le début du contrat, ouvertures.
- **Les séries** (`MV_JALONS_SERIES`) : les paliers de Nico — tarière 1 à 10 000 en neuf paliers, ouvertures et validations 1 à 1 000, engrais et semis 1 à 500 ha, ouillages 1 à 250, soutirages 1 à 50, sessions 1 à 250…
- **La mémoire** : `jalons_<uid>` = `{ value: { v, ouv: { n, dern }, gagnes: { "val.10": "2026-10-15", … } } }`, écrit en fusion (`setDoc merge`) et seulement si quelque chose change. Jamais en démo ni en mode préparation. Hors `COLLECTIONS` : ni écoute, ni copie partagée.
- **Les règles** : la personne lit et écrit SES jalons (règle 6, lecture seule comprise) ; la lecture générale, GUERETTECH et les sous-collections les excluent ; la règle 3 ne les écrit pas pour un autre.
- **Le Quoi de neuf** le dit : chacun a ses jalons, que lui seul voit ; ils s’afficheront dans une prochaine version.

### 340c. Ce qui a été vérifié
- `scripts/mv-harnais-jalons.mjs` : 23 assertions (le calcul joué sur un petit domaine inventé, la fusion, les ouvertures, le document, les règles écrites) et 4 contre-épreuves.
- **Au navigateur**, compte ouvrier, lecture et écriture simulées : l’ouverture comptée, un ancien jalon gardé avec sa date, les nouveaux datés.
- `mv-harnais-motifs1` suit la ligne de lecture qui porte maintenant l’exclusion des jalons.

### 340d. Ce qui n’a pas été vérifié
- Les règles sur le moteur réel : cas B18 à B25, dans la CI ou par `npm run test:rules` (§28).

### 340e. Laissé pour plus tard
- La page de confidentialité : Nico (15/10), « ne rajoute rien dans la confidentialité, on fera la mise à jour à un autre moment » (§28).

## 341. ★★ JALONS-2 — LES JALONS S’AFFICHENT : « NOUVEAU JALON » APRÈS UNE VALIDATION, « MES JALONS » DANS « MA TRACE » (15/10 — `src/jalons.js` (`MV_JALONS_PHRASES`, `_mvJalNb`, `_mvJalonLibelle`, `_mvJalonsProchains`, `_mvJalDateFr` dans le bloc exécutable ; `_mvJalonsAnnonce`, `_mvJalonsSection`) · `src/app.js` (`confirmValidation`, `renderMaTrace`) · `src/styles.css` (le bloc JALONS-2, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` · `public/sw.js` · `guide/04-vigne.html` (carte « Vos jalons ») · `scripts/mv-harnais-jalons.mjs` (étendu) · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/JALONS-2.json` · **APP 9.07 → 9.08, SW 9.86 → 9.87**, base `5552168`, cumulatif avec JALONS-1)

### 341a. La demande
Le plan GRATIF : JALONS-2, l’affichage. « Suite » de Nico (15/10). Constat avant d’écrire : la feuille d’après validation (`_mvdsOpen`) fait déjà la « petite victoire » (le domaine avance de x %, la parcelle suivante) et la fête rare (« Chantier terminé ») — il manquait le jalon.

### 341b. Ce qui est fait
- **Les mots** : un titre et une phrase par palier de chaque série (`MV_JALONS_PHRASES`, `_mvJalonLibelle`), sobres ; nombres à l’espace insécable de la police (`_mvJalNb`), ni « œ » ni « … » (le sous-ensemble de la police embarquée).
- **L’annonce** : `confirmValidation` relance `_mvJalonsSync` (il n’écrit que si quelque chose change) ; s’il y a du nouveau, `_mvJalonsAnnonce` pose « Nouveau jalon » sous le titre de la feuille (`.mvds-s`, ou `.mvds-fin-s` pour « Chantier terminé »). Plus de trois d’un coup : une seule ligne qui renvoie à « Ma trace ». Sans feuille ouverte : un message. ⚠️ Tout en `textContent` : un nom de tâche ne passe jamais par `innerHTML`.
- **« Mes jalons »** dans « Ma trace » (`_mvJalonsSection`) : combien, les trois derniers avec leur date, les trois prochains avec une barre (du plus proche au plus lointain, `_mvJalonsProchains`).

### 341c. Ce qui a été vérifié
- `scripts/mv-harnais-jalons.mjs`, étendu : 32 assertions et 5 contre-épreuves (dont « un palier sans phrase »).
- **Au navigateur**, compte ouvrier, lecture et écriture simulées : à la connexion, « Première ouverture » et « Un an au domaine » ; dans la vraie feuille d’après validation, « Nouveau jalon · Première validation » sous « Champ Franc, c’est fait », et cinq d’un coup en une ligne ; « Mes jalons » dans « Ma trace ».
- ⚠️ Vécu : un repli de jeton doit redire la valeur du pas — `--r-md` vaut 8 px, `--r-lg` 12 px (`mv-harnais-jetons`).

### 341d. Ce qui reste (§28)
- L’annonce après une validation en lot ou une entrée de journal ; le reste du plan GRATIF.

## 342. ★★ JALONS-2B — CORRECTIF DES JALONS : UNE LECTURE REFUSÉE OU IMPOSSIBLE N’EST PAS « AUCUN JALON » (16/10 — `src/firebase.js` (`fbLireJalons` rend `{ ok, value }`) · `src/jalons.js` (`_mvJalonsSync` : arrêt sur lecture refusée, écriture de la seule différence) · `src/utils.js` (APP, WHATS_NEW technique) · `index.html` · `public/sw.js` · `scripts/mv-harnais-jalons.mjs` (la synchronisation jouée en entier) · `scripts/mv-whatsnew-check.mjs` (une version purement technique) · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/JALONS-2B.json` · **APP 9.08 → 9.09, SW 9.87 → 9.88**, base `5552168`, cumulatif avec JALONS-2 et JALONS-1)

### 342a. La question de Nico
« En ce moment, toutes les nouvelles mises à jour, je les mets sur Firebase Channel refonte pour tester, et je ferai le vrai déploiement général une fois que tout ça sera fini. Est-ce que ça pose un problème ? » — Réponse : oui pour les règles. Un canal de prévisualisation ne porte que l’hébergement ; la base Firestore et ses règles sont celles de la production, communes à tous les canaux.

### 342b. Le défaut trouvé en répondant
`fbLireJalons` rendait `null` pour un document absent ET pour une lecture refusée (règles `jalons_` absentes de la production, donc dans « refonte ») ou impossible (hors réseau, rien en cache). `_mvJalonsSync` partait alors de zéro : tout jalon repassait pour nouveau à chaque validation (« 5 nouveaux jalons » à répétition), et l’écriture en fusion de la table entière réécrivait les dates d’origine au retour du réseau.

### 342c. Ce qui est fait
- `fbLireJalons` : `{ ok:true, value }` (value `null` si le document n’existe pas, lu pour de vrai) ; `{ ok:false }` pour un refus, une erreur, la démo ou le mode préparation.
- `_mvJalonsSync` : `ok:false` → rien d’annoncé, rien d’écrit. L’écriture n’envoie que les jalons nouveaux (`gagnes` limité à la différence) — et rien du tout quand il n’y en a pas : ⚠️ **en fusion (`setDoc … { merge: true }`), une table vide REMPLACE la table entière**.
- `mv-whatsnew-check` accepte une version purement technique (`items: []`), comme le prévoit la règle de WHATS_NEW ; 9.09 en est une.

### 342d. Ce qui a été vérifié
- `scripts/mv-harnais-jalons.mjs` : 37 assertions — dont `_mvJalonsSync` joué en entier avec un faux `window` : lecture refusée, document absent, date déjà posée, même demi-journée — et 8 contre-épreuves (dont la lecture refusée prise pour « aucun jalon », la table entière renvoyée, la table vide envoyée).
- ⚠️ Vécu dans le harnais : un `import()` d’une adresse `data:` identique renvoie le module déjà chargé (avec l’ancien faux `window`) — chaque essai porte sa marque ; et une contre-épreuve qui plante ne compte plus pour « vue ».

## 343. ★★ COEQ-1 — LE COÉQUIPIER, CHOISI AVEC L’ACTIVITÉ DU TRACTEUR (16/10 — `src/tracteur.js` (`_mvActCoeq`, `_sessCoeqRender`, `pickCoeq` ; `openNewSession`, `onSessionActChange`, `pickCond`, `saveSession`, `openSessionDetail`) · `src/reglages.js` (`openEditActTrac`, `saveEditActTrac`, le badge « À deux ») · `src/jalons.js` (le coéquipier compte) · `index.html` (`#s-coeq-wrap`, `#s-coeq-pick`, `#eat-coeq`, les versions) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Tracteur) · `public/sw.js` · `guide/06-tracteur.html` · `scripts/mv-harnais-coeq1.mjs` (neuf) · `scripts/mv-harnais-jalons.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/COEQ-1.json` · **APP 9.09 → 9.10, SW 9.88 → 9.89**, base `d29f619`)

### 343a. La demande
Nico, 15/10 : « Pour le coéquipier de la tarière, mets dans CLAUDE.md de le mettre en place au moment de la sélection de l’activité sur le tracteur. Idem pour l’ensemencement et l’engrais » (backlog n°44). « Suite » le 16/10.

### 343b. Ce qui est fait
- **Le réglage** : `_mvActCoeq(act)` — `act.coequipier === true` ou `false` si l’admin a décidé ; sinon d’office pour tarière, ensemencement, semis, engrais (sans accents ni majuscules). Aucune donnée réécrite : les domaines existants l’ont sans migration.
- **La nouvelle session** : sous « Conducteur », une zone « Coéquipier » (`#s-coeq-wrap`), affichée seulement pour une activité à deux ; « Personne » d’office, puis les membres actifs sauf le conducteur ; elle suit l’ouverture, le changement d’activité et le changement de conducteur.
- **L’enregistrement** : `coequipier` n’est posé que s’il porte un nom (⚠️ Firestore refuse `undefined`).
- **La fiche** : « 12 juin · Marc et Léo ».
- **L’éditeur d’activité** : la case « Se fait à deux » (`#eat-coeq`), lue et écrite ; la liste des activités montre le badge « À deux ».
- **Les jalons** : le coéquipier compte ses trous de tarière et ses hectares de semis et d’engrais ; les sessions et les km enjambés restent au conducteur.

### 343c. Ce qui a été vérifié
- `scripts/mv-harnais-coeq1.mjs` : 11 assertions (`_mvActCoeq` exécutée sur des activités inventées, puis le câblage) et 3 contre-épreuves. `mv-harnais-jalons` : le coéquipier compte ses trous. `mv-harnais-sessions`, `mv-harnais-fusion-docs` et `mv-harnais-champ` restent verts.
- **Au navigateur** : le rognage sans zone ; la tarière avec « Personne, Léo, … » (ni le conducteur, ni un membre inactif) ; la session enregistrée porte `coequipier: "Léo"` ; la fiche affiche « 12 Juin · Nico E2E et Léo ».

### 343d. Ce qui reste
- Les présents du Cuvier (remontages, pigeages) : avec PRESENCE-1, la présence notée (§28, bloc GRATIF-0).
- Changer le coéquipier d’une session déjà commencée : pas prévu ici.

## 344. ★★ PRESENCE-1 — « TA PRÉSENCE EST NOTÉE » : LES OPÉRATIONS DU CHAI OÙ L’ADMIN A COCHÉ LA PERSONNE, SUR SON ACCUEIL (16/10 — `src/jalons.js` (`_mvCaveNotees`, `_mvCaveTypeLib`, `_mvCaveQuand` dans le bloc exécutable ; `_mvCaveNoteRender`, `_mvCaveNoteVu`, `_mvJalEnc`) · `src/utils.js` (`_mvPqTexte` ; APP, WHATS_NEW, MV_AIDE Accueil et Cave) · `src/app.js` (`renderHome`) · `index.html` (`#home-cave-note`, la phrase sous `#cop-int-wrap`, les versions) · `src/styles.css` (le bloc CAVE-1, avant TETE-2) · `public/sw.js` · `guide/04-vigne.html`, `guide/08-cave.html` · `scripts/mv-harnais-presence1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-lot-marque.mjs` (refuse un nom déjà pris) · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/PRESENCE-1.json` · **APP 9.10 → 9.11, SW 9.89 → 9.90**, base `d29f619`, cumulatif avec COEQ-1)

### 344a. La demande
Nico, 15/10 : « les ouvriers qui ont été sélectionnés pour les travaux de cave […] soient aussi gratifiés de leur action et qu’ils en aient connaissance, comme quoi l’admin a bien noté leur présence » ; puis « le saviez-tu aussi pour la cave […] indiquer le pourquoi » (maquette GRATIF, partie cave). « Suite » le 16/10.

### 344b. Ce qui est fait
- **Le choix** (`_mvCaveNotees`, exécutable) : les opérations du Chai où la personne est intervenante (ou l’ancien « opérateur »), saisies par quelqu’un d’autre (on ne se signale pas à soi-même), des trois derniers jours, les plus récentes d’abord, deux au plus.
- **La carte** en tête de l’Accueil de la Vigne : « Nico vous a noté sur l’ouillage d’hier, au Chai : Clos Bas 2025, En Champs 2025 — avec Jean-Noël », puis « Pourquoi ? » tiré de la fiche du geste (`_mvPqTexte`). « Vu » la range sur ce téléphone (localStorage, une commodité).
- **Le Chai** : sous les intervenants, une phrase dit à l’admin que les cochés le verront.
- Les jalons du Chai (ouillages, soutirages, dégustations) comptaient déjà ces intervenants (JALONS-1).

### 344c. Ce qui a été vérifié
- `scripts/mv-harnais-presence1.mjs` : 16 assertions (le choix joué sur un Chai inventé — par un autre, trois jours, ni demain, ni soi-même, l’ancienne forme — les mots, la carte, « Vu », le câblage) et 3 contre-épreuves.
- **Au navigateur**, compte ouvrier : une carte (l’ouillage d’hier ; ni le soutirage d’il y a onze jours, ni la dégustation qu’il a saisie), le pourquoi de l’ouillage, et « Vu » qui la range au vrai clic.
- ⚠️ **Vécu : « Vu » ne faisait rien au clic.** L’identifiant était mis entre guillemets dans le code de l’attribut, puis passé au repli d’échappement — qui EFFAÇAIT les guillemets (`_escHtml` n’est pas exposé sur `window`) : `_mvCaveNoteVu(op1)`, une erreur muette. Désormais l’identifiant passe par `data-id`, et le repli `_mvJalEnc` encode au lieu d’effacer (aussi dans « Mes jalons »). Le harnais le tient.

- ⚠️ **Vécu : une collision de noms.** Le lot s’appelait d’abord CAVE-1 — nom déjà pris par le lot du §288 (la Cave › Aujourd’hui). Son harnais `mv-harnais-cave1.mjs` a été écrasé par le nouveau, et sa marque `lots/CAVE-1.json` aussi ; le contrôle du câblage (`mv-harnais-portes`, « aucune commande en double ») l’a vu. Les deux fichiers sont remis tels qu’au dépôt ; le lot devient PRESENCE-1 et son harnais `mv-harnais-presence1.mjs`. **`mv-lot-marque.mjs` refuse désormais un nom de lot déjà commité** (`git cat-file -e HEAD:lots/<LOT>.json`).

### 344d. Ce qui reste
- Les présents du Cuvier : les remontages et pigeages sont des compteurs sur les mesures de fermentation, sans personne ; à ajouter au formulaire de mesure.

## 345. ★★ PREMIERES-1 — « VOS PREMIÈRES FOIS » : LA FRISE DU PARCOURS AU DOMAINE, SUR LES VRAIES DATES (16/10 — `src/jalons.js` (`_mvPremieresFois` dans le bloc exécutable ; `_mvPremieresSection`) · `src/app.js` (`renderMaTrace`) · `src/styles.css` (le bloc PREMIERES-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-premieres1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/PREMIERES-1.json` · **APP 9.11 → 9.12, SW 9.90 → 9.91**, base `d29f619`, cumulatif avec PRESENCE-1 et COEQ-1)

### 345a. La demande
Nico, 15/10 : « on garde juste les premières fois […] je crois que logiquement, elles sont déjà dans les compteurs, étant donné qu’on a mis un à chaque compteur […] Donc oui, on développe bien sûr les premières fois » (maquette GRATIF, « Ton parcours au domaine »). « Suite » le 16/10.

### 345b. Ce qui est fait
- **Le calcul** (`_mvPremieresFois`, exécutable, sans `window`) : les premières fois **recalculées sur les données**, avec leurs vraies dates — les jalons de JALONS-1 ne sont datés que depuis le 15/10, jour où l’appli a commencé à les remarquer. Arrivée (début du contrat), première validation (la tâche par son nom affiché, la parcelle), première taille, première vendange, première plantation (ou entreplantation), premier hectare et premier kilomètre de rangs (le jour où le cumul de SA part passe le cap — à plusieurs, chacun sa part), première session au volant (comme conducteur), premier trou de tarière (conducteur ou coéquipier, « avec » l’autre), premiers ouillage, soutirage, dégustation où il est noté, un an au domaine. Une validation défaite (« Annulé ») n’est pas une première fois.
- **Ce qui vient** : la première vendange, la première taille, l’anniversaire avec sa date.
- **La frise** dans « Ma trace », au-dessus de « Mes jalons » : un point par première fois, celles qui viennent en pointillé.

### 345c. Ce qui a été vérifié
- `scripts/mv-harnais-premieres1.mjs` : 17 assertions (la frise jouée sur un domaine inventé) et 3 contre-épreuves (l’« Annulé » compté, la part de chacun oubliée, la frise en désordre).
- **Au navigateur**, compte ouvrier : « Arrivée au domaine 01/03/2025 · Un an au domaine 01/03/2026 · Première validation 16/03/2026 · Ébourgeonnage, Clos Bas · Premier hectare · Premier ouillage 24/05/2026 », puis « Première vendange au domaine — à venir », « Première taille — à venir ».

## 346. ★★ PRESENCE-2 — « QUI ÉTAIT LÀ » AU CUVIER : LA PRÉSENCE NOTÉE AU TRAVAIL DU CHAPEAU (16/10 — `src/cuvier.js` (`_vmIntRender` ; `openOvVendMesure`, `saveVendMesure`) · `src/jalons.js` (`_mvCuvierNotees`, `_mvChapeauLib` dans le bloc exécutable ; la carte de l’Accueil ; la frise) · `index.html` (`#vm-int-pick`, la phrase, les versions) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-presence2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/PRESENCE-2.json` · **APP 9.12 → 9.13, SW 9.91 → 9.92**, base `d29f619`, cumulatif avec PREMIERES-1, PRESENCE-1 et COEQ-1)

### 346a. La demande
Nico, 15/10 : « les ouvriers sélectionnés pour les travaux de cave, pour l’ouillage, le soutirage, enfin un petit peu tout ce qui se fait en cave » soient « gratifiés de leur action et qu’ils en aient connaissance ». PRESENCE-1 couvrait le Chai ; restait le Cuvier, en pleine vinification à cette date. « Suite » le 16/10.

### 346b. Ce qui est fait
- **Le relevé d’une cuve** (`ovVendMesure`) : sous les remontages et les pigeages, « Qui était là » — les membres actifs, plusieurs possibles ; un ancien coché reste visible à la correction. Le bloc disparaît avec le chapeau (après le pressurage), comme avant.
- **L’enregistrement** : `intervenants` et `par` (qui les a notés) seulement s’il y a des noms ; sinon ils sont retirés (jamais de tableau vide, jamais `undefined`). Le relevé repart de l’existant (§24 n°12) : `qui` et `tour` de la tournée restent. ⚠️ **Corrigé par PRESENCE-2B (§348)** : le champ est désormais `qui`, celui de la tournée — `intervenants` était un doublon.
- **La carte « Ta présence est notée »** mêle le Chai et le Cuvier, deux au plus : « Nico vous a noté sur 2 remontages et 1 pigeage d’hier, au Cuvier : Cuve 4 », puis le pourquoi du remontage (ou du pigeage, s’il n’y a que des pigeages). Seulement les relevés notés par un autre, avec du travail de chapeau, des trois derniers jours.
- **La frise** : le premier remontage et le premier pigeage où la personne était là, avec la cuve.

### 346c. Ce qui a été vérifié
- `scripts/mv-harnais-presence2.mjs` : 11 assertions (les relevés joués sur des cuves inventées, la frise, le relevé, la carte) et 3 contre-épreuves.
- Les harnais du Cuvier inscrits restent verts (cuv7, cuv8, cuv13, cuvdoc, cuvgr3, cuvier). `mv-harnais-cuvier-correction` rougit déjà sur la base (il cherche `_vendTriDate` dans cave.js) et n’est pas dans la liste des contrôles.
- **Au navigateur** : le relevé de la Cuve 4 propose les membres ; enregistré avec l’ouvrier coché : `intervenants: ["Ouvrier E2E"]`, `par: "Nico E2E"` ; vue par l’ouvrier, la carte « … 2 remontages et 1 pigeage d’hier, au Cuvier : Cuve 4 », avec le pourquoi du remontage.

## 347. ★ FETES-1 — « ANNONCER MES JALONS » SE COUPE (16/10 — `src/jalons.js` (`_mvFetesCle`, `_mvFetesOn`, `_mvFetesPeindre`, `toggleFetes` ; `_mvJalonsAnnonce`) · `src/app.js` (l’état peint au démarrage) · `src/reglages.js` (`switchReglTab`) · `index.html` (`#regl-fetes-row`, les versions) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-fetes1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/FETES-1.json` · **APP 9.13 → 9.14, SW 9.92 → 9.93**, base `d29f619`, cumulatif avec PRESENCE-2, PREMIERES-1, PRESENCE-1 et COEQ-1)

### 347a. La demande
Décision de Nico (maquette GRATIF, 15/10) : « Fête rare (parcelle bouclée, jalon atteint) — se coupe dans Réglages › Moi » ; et Wharton (Mollick & Rothbard) : un jeu choisi motive, un jeu imposé démotive. « Suite » le 16/10.

### 347b. Ce qui est fait
- **La seule fête qui soit à moi** est la ligne « Nouveau jalon » d’après validation (JALONS-2) ; la feuille « Chantier terminé » (DONE-1) est un bilan, sans animation : elle reste.
- **Le réglage** : Réglages › Moi › Mon compte, « Annoncer mes jalons » (activé d’office), sous « Changer mon mot de passe » — l’onglet s’affiche « Moi » (son identifiant est `app`, `#regl-view-app`). Rangé sur CE téléphone (localStorage, `mv_fetes_<domaine>_<personne>`), comme « Plein soleil ».
- **Coupé** : `_mvJalonsAnnonce` se tait (rien d’inséré, pas de message). Les jalons se comptent quand même et restent dans « Ma trace ».

### 347c. Ce qui a été vérifié
- `scripts/mv-harnais-fetes1.mjs` : 8 assertions (`_mvFetesOn` et `toggleFetes` exécutées avec un faux localStorage ; la ligne ; l’état peint) et 2 contre-épreuves.
- **Au navigateur** : la ligne « Activé » → un clic → « Coupé » ; feuille d’après validation ouverte : aucune ligne « Nouveau jalon » ; rallumé : la ligne revient.

## 348. ★ PRESENCE-2B — « QUI » : UN SEUL CHAMP POUR QUI ÉTAIT LÀ AU CUVIER, CELUI DE LA TOURNÉE (16/10 — `src/cuvier.js` (`openOvVendMesure`, `saveVendMesure`, `_vtEcrire`) · `src/jalons.js` (`_mvCuvierNotees`, la frise, la carte) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-presence2.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/PRESENCE-2B.json` · **APP 9.14 → 9.15, SW 9.93 → 9.94**, base `d29f619`, cumulatif avec FETES-1 à COEQ-1)

### 348a. Le défaut, trouvé en préparant « du rang à la bouteille »
La tournée du Cuvier (§24, CUV-7) écrit déjà qui était là dans le relevé : `m.qui = _VT_WHO.slice()` et `m.tour = true` (`_vtEcrire`), et la relit pour se préremplir. PRESENCE-2 (§346) avait ouvert un second champ, `intervenants`, pour la même chose — deux vérités sur le même relevé, et les relevés de la tournée restaient hors de « Ta présence est notée ».

### 348b. Ce qui est fait
- **Le relevé** écrit `qui` (préremplie depuis `qui`, ou l’ancien `intervenants`), avec `par` ; l’ancien champ est retiré à l’enregistrement.
- **La tournée** note `par` : la personne connectée qui l’a faite — elle ne se signale pas à elle-même.
- **La carte et la frise** lisent `qui` (l’ancien champ relu, pour un essai fait dans « refonte » avant ce lot) ; un relevé de tournée se dit « … au Cuvier (la tournée) ».

### 348c. Ce qui a été vérifié
- `scripts/mv-harnais-presence2.mjs` : 13 assertions — dont `qui` qui fait foi, l’ancien champ relu, sa propre tournée exclue, la tournée qui note `par` — et 4 contre-épreuves (dont « l’ancien champ seul lu, la tournée oubliée »). Les harnais du Cuvier restent verts.
- ⚠️ Leçon : avant d’ajouter un champ, chercher si un écran voisin n’écrit pas déjà la même chose (ici la tournée).
- ⚠️ **Vu par la liste complète** : `mv-harnais-gf` (G27, « corriger un relevé de la tournée garde qui l’a pris », §24 n°12) a rougi — sans le bloc du chapeau à l’écran, l’enregistrement effaçait `qui`. Désormais `qui` n’est touché que si le choix était sous les yeux (`_vmChoix`) ; une contre-épreuve le tient dans `mv-harnais-presence2`.

## 349. ★★ RANGBOUT-1 — DU RANG À LA BOUTEILLE : « LES VINS DE VOTRE TRAVAIL » (16/10 — `src/jalons.js` (`_mvRangBouteille` dans le bloc exécutable ; `_mvRangBouteilleSection`) · `src/app.js` (`renderMaTrace`) · `src/styles.css` (le bloc RANGBOUT-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-rangbout1.mjs` (neuf) · `scripts/mv-harnais-premieres1.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/RANGBOUT-1.json` · **APP 9.15 → 9.16, SW 9.94 → 9.95**, base `d29f619`, cumulatif avec PRESENCE-2B à COEQ-1)

### 349a. La demande
Maquette GRATIF validée par Nico (15/10) : « Du rang à la bouteille (millésime des parcelles travaillées) ». « Suite » le 16/10.

### 349b. Ce qui est fait
- **La chaîne** (`_mvRangBouteille`, exécutable, sans `window`) : celle que la Cave construit déjà pour un millésime (`_pcrbCvLignes`, cave.js) — la récolte d’une parcelle (`recoltes[].parcelle`, `cuve_id`) → la cuve (`cuves_vinif`) → la cuvée du décuvage (`decuvage.cuvee_id`, `CAVE_ELEVAGE.cuvees`). Le vin est la cuvée (« en élevage », « en bouteille » si `statut === 'embouteille'`), ou la cuve tant qu’elle n’est pas décuvée (« en cuve »).
- **Le millésime d’un travail** : l’année de la vendange qui suit — novembre et décembre comptent pour le millésime suivant (la taille). Seules les validations de la personne (la sienne ou à plusieurs), pas les « Annulé ».
- **La section** dans « Ma trace », entre « Vos premières fois » et « Mes jalons » : les deux derniers millésimes qui ont du vin, chaque vin, ses parcelles et ce que la personne y a fait.

### 349c. Ce qui a été vérifié
- `scripts/mv-harnais-rangbout1.mjs` : 10 assertions et 3 contre-épreuves (la taille de décembre au mauvais millésime, l’« Annulé » compté, la cuvée du décuvage oubliée). `mv-harnais-premieres1` accepte la nouvelle section entre la frise et « Mes jalons ».
- **Au navigateur**, compte ouvrier : « Millésime 2025 · Clos Bas 2025 — en élevage · Clos Bas · taille, relevage, vendange ».
- ⚠️ Pas de jeton `--vin` dans la charte : la bordure prend `--cave`.

## 350. ★★ CARTEDOM-1 — « LA CARTE DE VOTRE SAISON » : LES PARCELLES COLORÉES SELON LES PASSAGES (16/10 — `src/jalons.js` (`_mvCarteDomaine`, `_mvCarteNiveau`, `_mvCarteSvgPoints` dans le bloc exécutable ; `_mvCarteDomaineSection`) · `src/app.js` (`renderMaTrace`) · `src/styles.css` (le bloc CARTEDOM-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-cartedom1.mjs` (neuf) · `scripts/mv-harnais-premieres1.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/CARTEDOM-1.json` · **APP 9.16 → 9.17, SW 9.95 → 9.96**, base `d29f619`, cumulatif avec RANGBOUT-1 à COEQ-1)

### 350a. La demande
Maquette GRATIF validée par Nico (15/10) : « Carte du domaine (parcelles colorées selon passages) ». « Suite » le 16/10.

### 350b. Ce qui est fait
- **Les passages** (`_mvCarteDomaine`, exécutable) : les validations de la personne (seule ou à plusieurs) par parcelle depuis le début de la saison active (`SAISONS`, sinon un an), sans doublon (parcelle, tâche, jour, passage) ni « Annulé » ; la casse du nom ne compte pas.
- **Le dessin** : les contours de la carte des Parcelles (`KML_POLYGONS_DYNAMIC`, sinon `KML_DATA`) projetés en SVG (`_mvCarteSvgPoints`, équirectangulaire au centre, nord en haut, 1 000 de large) — sans fond de carte, donc hors réseau. Quatre teintes par classes (`cd-n0` à `cd-n3` : aucun, 1, 2 à 3, 4 et plus), aucune couleur dans le JavaScript ; une infobulle par parcelle (« Clos Bas — 4 passages »).
- **La section** dans « Ma trace », après « Les vins de votre travail » : « 2 parcelles sur 4 depuis le 16/03/2026 », la carte, la légende.

### 350c. Ce qui a été vérifié
- `scripts/mv-harnais-cartedom1.mjs` : 9 assertions et 3 contre-épreuves (un passage d’avant la saison, un doublon, le nord en bas).
- **Au navigateur**, compte ouvrier, quatre contours : Clos Bas en teinte forte (4 passages), En Champs pâle (1, à deux), les deux autres en gris.

## 351. ★★ SAISONIMG-1 — « MA SAISON EN IMAGES » : SIX CARTES ET UN PDF (16/10 — `src/jalons.js` (`_mvSaisonImages` dans le bloc exécutable ; `_mvSaisonDonnees`, `_mvSaisonCartesHtml`, `openSaisonImages`, `_mvSaisonFermer`, `_mvSaisonPdf`) · `src/app.js` (`renderMaTrace` : le bouton) · `index.html` (`#ovSaisonImg`, les versions) · `src/styles.css` (le bloc SAISONIMG-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-saisonimg1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/SAISONIMG-1.json` · **APP 9.17 → 9.18, SW 9.96 → 9.97**, base `d29f619`, cumulatif avec CARTEDOM-1 à COEQ-1)

### 351a. La demande
Maquette GRATIF validée par Nico (15/10) : « Saison en images (style Spotify Wrapped, 6 cartes, PDF) » ; Spotify Wrapped : « peu de chiffres personnels, racontés comme une histoire ». « Go » le 16/10 — le dernier morceau du plan.

### 351b. Ce qui est fait
- **Les six cartes** (`_mvSaisonImages`, exécutable), sur la saison active (son début ; sa fin ou aujourd’hui) : 1. Votre saison (sa part en ha, ses jours, ses km de rangs, ses pieds) ; 2. Votre parcelle de cœur (la plus parcourue, ses passages, les autres) ; 3. Vos gestes (les trois premiers par hectares) ; 4. Au volant et au chai (sessions, trous de tarière — coéquipier compris —, ouillages, soutirages, dégustations, remontages et pigeages ; sinon « la vigne avant tout ») ; 5. Vos premières fois et vos jalons DE la saison ; 6. Du rang à la bouteille, puis « Merci pour cette saison ». Toujours six cartes, même vides.
- **L’écran** : « Ma trace » › « Ma saison en images », une fenêtre (`#ovSaisonImg`) où les cartes se font défiler du doigt (une par écran).
- **Le PDF** : « Enregistrer en PDF » ouvre le document imprimable de l’appli (`_mvDocOpen`, deux cartes par ligne) ; le navigateur propose « Enregistrer en PDF ».

### 351c. Ce qui a été vérifié
- `scripts/mv-harnais-saisonimg1.mjs` : 13 assertions et 3 contre-épreuves (un travail d’avant la saison, la part de chacun oubliée, une carte qui manque).
- ⚠️ **Vu par la liste complète** : `mv-harnais-typo` — une taille égale à un cran écrite en dur dans le CSS du PDF (11 px = `--pt-nano`) et un px de plus dans styles.css (le grand chiffre) ; passés aux jetons (`var(--pt-nano,11px)`, `var(--pt-hero,40px)`).
- **Au navigateur**, compte ouvrier : le bouton de « Ma trace » ouvre six cartes (« 4,9 ha, de vignes, votre part · 5 jours au domaine », « Clos Bas · 4 passages », « Relevage · 1,6 ha »…) ; « Enregistrer en PDF » ouvre « Ma saison en images — Domaine de la Combe ».

## 352. ★ TACHEPER-1 — UNE TÂCHE COCHÉE EN MODIFIANT UNE PÉRIODE ENTRE DANS LE DOMAINE (17/10 — `src/reglages.js` (`_perAssureTaches`, `saveSaison`, `saveEditSaison`) · `src/app.js` (`_perReparerTaches`, appelée par `_migrateTachesSaison`) · `scripts/mv-harnais-tacheper1.mjs` (neuf) · livré dans le zip COMPTE-1, base `c05f624`)

### 352a. D’où ça vient
Remonté du terrain (16/10) : une Entreplantation ajoutée à la période d’automne d’un domaine client « n’apparaît nulle part ». La liste à cocher d’une période propose toute la convention (`_nsRefTaches`), même les tâches que le domaine n’a pas. La création d’une période ajoutait la tâche manquante à `TACHES` ; la modification enregistrait la coche et s’arrêtait. Tous les écrans lisent `getTachesSaison()` = `TACHES` filtré par `s.taches` : la tâche cochée était filtrée partout. Chez ce domaine, l’Entreplantation était absente des tâches (relevé au §30d). C’est le miroir du défaut VIG-TACHE (§108 : une tâche du domaine absente de la période).

### 352b. Ce qui a été fait, et pourquoi comme ça
- **Un écrivain unique**, `_perAssureTaches(noms)` : création et modification passent par lui ; il n’ajoute que des tâches de la convention (une tâche du domaine supprimée ne doit pas revenir : on ne sait pas ce qu’elle était) et rend la liste ajoutée.
- **La réparation des données déjà touchées**, à l’ouverture, sur un appareil **admin** seulement (`isAdmin` + `canWrite`, clés `taches` et `saisons` chargées) : `TACHES` s’écrit d’un seul endroit et les autres téléphones la reçoivent — aucun n’a à être à jour (contrainte multi-appareils du 03/10). Additive, sans effet la deuxième fois.
- **Le message « U0001F4C5 Saison mise à jour »** : `\\U0001F4C5` n’est pas un échappement JavaScript, le message affichait le texte. Il dit désormais « Période mise à jour » (et combien de tâches entrent au domaine).

### 352c. Ce qui a été vérifié
- `scripts/mv-harnais-tacheper1.mjs` : 10 assertions (dont `_perAssureTaches` exécutée) et 3 contre-épreuves (la modification qui oublie le domaine, une tâche hors convention créée, une réparation qui écrirait depuis tous les téléphones).

## 353. ★★ COMPTE-1 — LES PIEDS MARQUÉS CHIFFRENT L’ENTREPLANTATION, AVANT LA TARIÈRE (17/10 — `src/comptes.js` (neuf : règles exécutables `_cptPrevus`, `_cptDemande`, `_cptChaine`, `_cptResume`, `_cptPoser`, `_cptPas` ; le pavé `_cptOuvrir` ; la feuille `openComptes`) · `src/app.js` (`_plantParcTrous`, `_parcConcern`, `pQuickValidate`, `pQuickUndoEntry`, `openValidationPanel`, `confirmValidation`, la fiche, le rapport) · `src/utils.js` (`_mvTacheConcerne`, APP, WHATS_NEW, MV_AIDE Parcelles, Tracteur, Réglages) · `src/reglages.js` (la ligne sous l’entreplantation, le réglage au crayon, `_tcfgApply`) · `src/pilotage.js` (`_opTrousPrevus`) · `src/tracteur.js` (tarière préremplie, case à la création) · `index.html` (`#ovCompte`, `#ovComptes`, deux icônes, versions) · `src/styles.css` (le bloc COMPTE-1, en fin de fichier) · `public/sw.js` · `guide/04-vigne.html` · `guide/06-tracteur.html` · `scripts/mv-harnais-compte1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-robustesse-accueil.mjs` (ancre) · `scripts/harnais-claude-md.mjs` (SECTIONS) · **APP 9.18 → 9.19, SW 9.97 → 9.98**, base `c05f624`, cumulatif avec TACHEPER-1)

### 353a. D’où ça vient
Nico (16/10) : « beaucoup de domaines marquent leurs trous avant de les faire à la tarière ; il faudrait pouvoir marquer l’info des comptes dans l’appli ». Jusque-là les trous n’entraient qu’après coup (séance Tarière, validation) et l’entreplantation pesait 0 h. Maquette publiée et validée le jour même (« go ») ; choix de Nico : le compte est saisi **par les deux** — celui qui marque, en validant ; l’admin, sur une feuille de toutes les parcelles.

### 353b. Les arbitrages
- **Trous prévus = le plus grand des deux** (pieds marqués, trous de la parcelle) : une tarière à moitié passée ne fait pas baisser la charge, et plus de trous percés que de pieds marqués l’emporte. Écarté : « la tarière remplace le repérage » (une séance partielle aurait fait fondre le prévu).
- **Une seule lecture** : `_plantParcTrous` (app.js) appelle `_cptPrevus` ; sept lectures du champ brut `plantation_trous` ont été rebranchées (fiche ×2, rapport ×2, Pilotage ×3). Au passage, la colonne « trous » du rapport par parcelle affichait le texte d’un appel d’icône (`'+_mvIcon('pousse',16)+'`) : elle affiche le nombre.
- **Le réglage sur la tâche** (`t.demandeCompte`), au crayon (`openEditHha`), qui sert aussi aux tâches du domaine — `openTacheCfg` refuse une tâche hors convention. ⚠️ `_tcfgApply` reconstruit la tâche de zéro : sans la ligne neuve, rouvrir l’écran des heures aurait effacé le réglage (invariant « une fonction qui reconstruit un objet perd ce qu’elle ne réécrit pas »).
- **Le pavé avant l’écriture** : `pQuickValidate` (cartes et carte du domaine) demande à `_cptAvantValider` s’il faut le pavé, puis reprend par le même chemin avec le nombre ; « Annuler » (`pQuickUndoEntry`) remet le compte d’avant, gardé sur l’entrée du journal (`trous_marques_avant`). Une parcelle comptée se valide d’un appui et écrit ses pieds au journal (le temps réalisé du Pilotage le lit).
- **Comptée à zéro** sort de l’entreplantation par les deux règles communes (`_parcConcern`, `_mvTacheConcerne`), pas par un filtre d’écran.
- **Tarière** : la valeur arrive préremplie et sélectionnée (taper remplace) ; la case « alimente les trous » existe dès la création (avant : seulement en modifiant) et ne parle plus de « tâche Plantation ».

### 353c. Ce qui a été vérifié
- `scripts/mv-harnais-compte1.mjs` : 27 assertions (13 sur les règles exécutées, 14 de câblage) et 3 contre-épreuves (le plus petit au lieu du plus grand, le compte demandé sur une tâche à trous, une annulation qui oublie l’auteur). ⚠️ Trois assertions étaient fausses à la première écriture (un compte qui incluait la définition, deux motifs trop stricts) : le code avait raison.
- Preflight : la première version interpolait le HTML du lien de l’admin rendu par une fonction du module — C24c a compté +1. Le bouton se construit désormais dans la fiche avec `_escAttr` et `_escHtml`.
- **La liste complète (431 contrôles)** a trouvé quatre vrais rouges, tous dus au lot : l’espacement hors échelle (+13 : le bloc réécrit sur 2·4·8·12·16·20·24·32·40), les jetons sans repli et le filet `--gris` (+14 et +6 : replis posés, filets en `--gris-clair`), le bloc CSS posé APRÈS TETE-2 (qui doit rester en fin de feuille : le bloc COMPTE-1 passe juste avant), et trois contre-épreuves (SEL-1, RETRAIT-1, Accueil) dont l’ancre était une ligne touchée. ★ Pour SEL-1 et RETRAIT-1, c’est le CODE qui a bougé, pas le harnais : la règle `_cptHors` passe en première ligne de `_mvTacheConcerne` et laisse leurs lignes intactes ; l’ancre de l’Accueil suit `_plantParcTrous`.
- ⚠️ **Dans ce bac à sable, `npm run check` lancé d’un bloc s’arrête au 6ᵉ contrôle sans message** (deux fois) ; le même contrôle seul est vert. Les 431 ont été joués par tranches, en parallèle, et les six plus longs seuls (preflight, trois robustesses, icônes, récupération). Rien de tel n’est connu chez Nico ni en CI : à confirmer à son prochain `npm run check`.
- **Construit** (`vite build`, après `node scripts/mv-gt-page.mjs` qui fabrique `gt.html`, ignoré par git) : le paquet porte le module.
- ⚠️ **Non vu au navigateur dans l’appli** : la mise en page du pavé et de la feuille (vus dans la maquette seulement).

## 354. COMPTE-2 — UNE ENTREPLANTATION VALIDÉE PAR LE JOURNAL ÉCRIT SES PIEDS (17/10 — `src/app.js` (`saveJournalEntry`) · `scripts/mv-harnais-compte1.mjs` (une assertion, deux contre-épreuves de câblage) · pas de bump, base `c988bf5`)

### 354a. D’où ça vient
Le « à confirmer » laissé par COMPTE-1 (§353) : deux chemins ne demandaient pas le compte. Vérifié dans le code : la validation en lot n’existe pas dans la Vigne (les cartes, la carte du domaine et la fiche passent par `pQuickValidate` et `confirmValidation`). Reste l’entrée de journal tapée à la main : une entreplantation validée par là n’écrivait pas ses pieds, et le Pilotage (`ev.trous||p.plantation_trous`) retombait sur les seuls trous de tarière — 0 h sans tarière.

### 354b. Ce qui a été fait
- `saveJournalEntry` appelle `_cptAuValider(p, tâche, entrée, null)` pour une validation (hors étape d’arrachage) : pour une tâche à trous, l’entrée porte les trous prévus de la parcelle s’ils existent ; pour une tâche qui demande le compte, rien (le compte se saisit dans la feuille). Le même chemin que « Valider », pas une copie.
- **Pas d’annonce, pas de bump** : le chemin est rare (une saisie de l’admin au Journal) et le seul fichier de l’appli touché est un module JS.

### 354c. Ce qui a été vérifié
- `scripts/mv-harnais-compte1.mjs` : 28 assertions ; contre-épreuves 5 sur 5 (les trois des règles, et deux de câblage qui mutent `app.js` : le Journal qui oublie les pieds, « Annuler » qui ne remet plus le compte).

## 355. ★ ARRIVEE-4 — LE BOUTON « FILTRES » À L’ARRIVÉE DE L’OUVRIER (17/10 — `src/app.js` (`_pFxEtat`, `_pFxActifs`, `_pFxBadge`, `_pFxRender`, `openPFiltres`, `_pFxAfficher`, `_pFxOrdre`, `_pFxRemettre` ; `renderParcelles` : la pastille) · `index.html` (`.p-srow`, `#p-fx-btn`, le bouton Carte, `#ovPFiltres`, les versions) · `src/styles.css` (le bloc ARRIVEE-4, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Parcelles) · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrivee4.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/ARRIVEE-4.json` · **APP 9.19 → 9.20, SW 9.98 → 9.99**, base `3abce32`)

### 355a. La demande
La maquette ERGO-0 (§28) proposait un bouton « Filtres » ; Nico a voulu le voir (17/10) : trois captures posées dans la vraie page (aujourd’hui, proposé, la feuille ouverte). Réponse : « Oui, go ».

### 355b. Ce qui est fait — à l’arrivée seulement (`#page-parcelles.p-arrivee`, ouvrier sur sa priorité)
- **Une ligne** : la recherche (qui se rétrécit), « Filtres » (icône curseurs, une pastille quand un filtre s’écarte du départ) et un bouton Carte. Hors arrivée, la ligne s’efface (`display:contents`) et les deux boutons sont cachés : l’admin garde ses rangées.
- **Rangés** : la rangée Toutes/Finies/En cours/Arrachées, « Trier par proximité », et Liste/Carte — sauf sur la carte, pour pouvoir revenir (`.tabs2:not(:has(#tbc.active))`).
- **La feuille** (`#ovPFiltres`) : Afficher — À faire (le départ : `pFilter` « toutes » sans `pShowDone`), Toutes (`pShowDone`), Finies, En cours, Arrachées avec leurs nombres ; Ordre — par proximité ou normal (`pToggleProximite`), ou, quand la tournée de l’admin s’applique, « Tournée du domaine » seule et sans choix (TRN-2 : la proximité reste cachée ; `_pOrdOff` est réservé à l’admin) ; « Tout remettre » et « Voir N parcelles ». Rien de neuf derrière : les mêmes leviers qu’avant. La tâche prioritaire reste (on ne remet pas `pTacheFilter` à « toutes », contrairement aux puces d’état).
- Les valeurs des puces passent par `data-v` (C24b).

### 355c. Ce qui a été vérifié
- `scripts/mv-harnais-arrivee4.mjs` : 10 assertions (les états et la pastille exécutés, la priorité gardée, la tournée qui garde la main, la ligne, la feuille, le CSS) et 3 contre-épreuves ; ARRIVEE-1 et ARRIVEE-2 restent verts.
- **Au navigateur** (375 × 667, ouvrier sur sa priorité) : la ligne recherche + Filtres + Carte, les trois rangées cachées, premier « Valider » à 448 px (530 avant) ; la feuille : « À faire » choisi, proximité / normal, « Voir 2 parcelles » ; « Toutes » → pastille « 1 », la priorité reste ; « Tout remettre » → pastille effacée ; sur la carte, Liste/Carte revient.
- ⚠️ **Vu par la liste complète** : `mv-harnais-contraste` — la puce choisie prenait la surface (`--bg-card`) comme couleur de texte, et la pastille (texte normal sur or plein) tombait en thème sombre. Désormais : puce et pastille en or pâle avec `--or-tx`, « Voir N parcelles » à l’accent de la charte (`--accent`, `--sur-accent` ; `--btn-pri` n’existe que dans le cockpit, vu à l’écran) — lisibles en clair comme en sombre.
- ⚠️ L’environnement avait été remis à zéro : dépôt recloné, outils du navigateur réinstallés, script de mesure récupéré depuis la transcription.

## 356. ★★ FML-1 — PAS DE « FINI » AVANT LA MALO : LE CUVIER LIT LA MALO DE LA CUVÉE AU CHAI (17/10 — `src/cuvier.js` (`_vendPassLbl`, `_vendFmlPassee`, `_vendFmlFin`, `_vendFmlVin`, `_vendFmlLigne` ; `_vendStepper`, `_vendParcLigne`, `_vendParcHist` ; le graphe de fermentation, marge haute et bulle ; la feuille de décuvage : `_vendDecFmlHtml`, `_vendDecFmlSet`, `saveVendDecuvage` ; les gardes de `saveVendCuve` et `saveVendStat` ; le CSS de la frise ; la frontière) · `src/cave.js` (`_caveFmlEtat`, `_cuvToggle`, `openOvCavee`, `saveCuvee`, `_caveAnaLineHtml`, la fiche détail, `_mlMalo`, `renderCaveVendange`, `_fermLegende`, le cahier de cuverie ; la frontière) · `index.html` (`#cuv-fml-sans`, l’option « Terminé », les versions) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-fml1.mjs` (neuf) · `scripts/mv-harnais-parcours.mjs` · `scripts/mv-harnais-cuv13.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` (SECTIONS) · `scripts/typo-baseline.json` (la ligne de `cave.js`) · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/FML-1.json` · **APP 9.20 → 9.21, SW 9.99 → 10.00**, base `b4d84bb`)

### 356a. La demande
Capture de Nico (17/10), Cave › Le Cuvier, « Pasquier des Chênes » : la frise SETUP · MPF 02/09 · FA 07/09 · PRESS. 15/09 · FML — · FINI 25/09, et « Terminé depuis le 25/09 ». Nico : « tu ne peux pas indiquer que la cuvée est terminée si la FML n’est pas faite » ; la malo se fait au fût ou en cuve ; vérifier si des vignerons embouteillent avant la fin de la FML. **Vérifié, sources citées dans la conversation** : en Bourgogne c’est une règle d’appellation — les cahiers des charges du Chambertin et de l’AOC Bourgogne ont un article « Fermentation malo-lactique » : au plus 0,4 g/L d’acide malique au conditionnement des rouges ; bloquer la malo d’un rouge reste marginal (vins bus vite) et risqué (malo en bouteille). Ajouts de Nico à la reformulation : « on fait aussi du blanc » (la malo évitée exprès), et « la malo peut être bloquée sur des cuvées de rouge, ce qui nécessite l’intervention du domaine ». Libellé proposé et gardé sans objection : **« Pas de malo (voulu) »** — dans l’appli, « bloquée » désigne déjà la malo ARRÊTÉE (`_mlProjMalo`).

### 356b. La cause
`saveVendDecuvage` pose `statut:'termine'` le jour du décuvage — juste : la cuve est vide, libre au parc, hors tournée. Mais `_vendStepper` colorie par POSITION (`i<cur` ⇒ franchie) : l’étape FML, qu’aucun geste du Cuvier ne pose, sortait « franchie, date inconnue » (le tiret de PARC-1, §81) et « Fini » prenait la date du décuvage. Le Chai savait la vérité (`decuvage.cuvee_id` → la cuvée, `_caveFmlEtat`, `_mlProjMalo`, `_mlFinMalo`) ; `cuvier.js` ne la lisait jamais. L’étape FML est dans `_VEND_STEPS` depuis le premier commit et aucune décision écrite ne disait de la sauter : un oubli, pas un choix. Deux autres portes menaient à « Terminé » sans malo : le menu Statut de « Modifier » (« Terminé — prêt pour élevage ») et « Changer l’étape ».
★ **La leçon** : une frise qui colorie par rang déclare franchie toute étape qu’elle dépasse — y compris celle que personne n’a jamais posée. Une étape se lit sur ce qui la prouve, pas sur sa place.

### 356c. Ce qui est fait
- **La clé ne bouge pas** : `statut` reste `'termine'` au décuvage (occupation du parc, tournée, §118). Seul ce que l’écran en dit change — le patron de CUV-13 (§133).
- **`_vendFmlVin(c)`** (null hors `'termine'`) lit la malo du vin aux règles du Chai (§24 n°18) : `fusion` · `finie` (déclarée `ok` par `_caveFmlEtat`, ou malique sous `_ML_MAL_FIN` par `_mlProjMalo`) · `sans` · `bouteille` (embouteillée sans malo déclarée) · `bloquee` · `cours` (déclarée, ou mesurée) · `attente` · `inconnu` (cuvée introuvable, ou « Terminé » à la main sans étape FML). `deb` = l’étape FML posée au Cuvier (malo en cuve), sinon le décuvage. Le Chai se lit par `typeof` : un bac à sable sans lui rend `inconnu`, pas une panne.
- **`_vendFmlFin`** : la date de fin est la plus ANCIENNE des preuves — l’analyse « Terminée » (`_mlFinMalo`), le bouton daté de la fiche, le premier malique resté sous le seuil.
- **La frise** : FML `cur` (`cur alerte` si la malo est bloquée) tant qu’elle n’est pas faite ; « Fini » `cur` à la date de fin ; `done sans` et « sans » pour une malo évitée ; une cuve fusionnée n’a plus d’étape en cours. **La phrase** (`_vendFmlLigne`) : « FML depuis le … · au Chai, malo pas encore déclarée », « … malo en cours au Chai, fin estimée vers le … », « … malo bloquée : l’acide malique ne descend plus (x g/L) — à contrôler » (les mots de l’agenda) ; « Fini le … · malo finie au Chai / pas de malo, choix du domaine / malo faite en cuve ».
- **Le nom des passages** (`_vendPassLbl`) : « Décuvée », « Fusionnée », « Terminé » (à la main) — parcours, graphe, légende (`_fermLegende`), cahier de cuverie.
- **Le Chai** : `cuvee.fml_sans` + `fml_sans_date`, troisième bouton de la fiche (`#cuv-fml-sans`) ; `_caveFmlEtat` rend `'sans'`, sauf analyse POSTÉRIEURE qui dit la malo partie (la plus récente gagne, comme « Terminée ») ; étiquette « Pas de malo » (`.mvc-tag-fmlno`). ★ `_mlMalo` saute ces cuvées : leur malique reste plat, et la projection criait « malo bloquée — à contrôler » sur un vin qui fait ce qu’on lui demande.
- **Le décuvage** : « Et la malo ? » — « Elle se fera au chai » d’office, « Déjà finie en cuve » à cocher (la cuvée naît `fml_terminee:true`, datée du jour). Jamais « finie » d’office : un « Fini » faux est le défaut retiré.
- **Les gardes** : `saveVendCuve` et `saveVendStat` refusent « Terminé » sans l’étape FML (`_vendFmlPassee`), avant toute écriture ; corriger la date d’un « Terminé » déjà là reste permis ; une cuve décuvée ou fusionnée est close (§81). L’option devient « Terminé — malo faite en cuve ».
- **Hors demande, vu sur la capture** : la légende sous la courbe sortait en vrac (textes collés, sans traits de couleur) — `.mvfm-lg` et `.mvfm-ets` vivent dans `_caveV2InjectCss`, que l’entrée du Cuvier n’appelait pas. `renderCaveVendange` l’appelle désormais : même défaut, même remède que `_vendEnsureSheetCss` juste au-dessus.

### 356d. Ce qui a été vérifié
- `scripts/mv-harnais-fml1.mjs` : 68 vérifications sur les vraies fonctions (frise et phrase par état du Chai, dates de fin, « Pas de malo », les autres formes de cuve terminée, noms des passages, gardes exécutées, `_mlMalo`, feuille de décuvage, frontière, écran, aide, guide) et 15 contre-épreuves. Deux ne mordaient pas au premier jet — une seule preuve dans la scène, une fusion jugée sur « Fini » seul — : renforcées.
- `mv-harnais-parcours` et `mv-harnais-cuv13` extraient les nouvelles fonctions (ReferenceError sinon) ; la contre-épreuve PARC-1 n°10 garde sa ligne mot pour mot (`var d=(i<=cur)?_vendStatDeb(c,s[0]):null;`).
- **La liste complète, deux passes.** ① À l’heure de Paris, vers 0 h 15 (435 commandes) : sept rouges, tous expliqués. `mv-harnais-jetons` — le bouton neuf recopiait le `1px solid var(--gris)` de ses voisins, le filet perdant (74 → 75) : passé à `var(--ligne,#E7E6E2)`. `mv-harnais-typo` — `cave.js` au-delà des 5 % (356e). `mv-harnais-cuv13` et `--contre`, `mv-harnais-ref1` et `--contre`, `mv-harnais-reste-a-rentrer` — la fenêtre de minuit à 2 h (§334f) : **rouges aussi sur la base** à la même heure (worktree de `b4d84bb`), verts sur le lot en UTC. ② En UTC (l’heure de la CI), après les deux correctifs : **435 commandes, 0 rouge** (665 s). Preflight : 0 erreur, 11 avertissements. `public/guide.html` régénéré pour la passe seulement, non livré.
- Rien vu au navigateur.

### 356e. Arbitrage — la taille de `cave.js`
`mv-harnais-typo` refuse qu’un module enfle de plus de 5 % sans regravure. La base était à 667,4 ko pour un seuil de 667,5 (référence 636, non regravée depuis RANGE-1, §335e) : le lot ajoute 2,5 ko (fiche « Pas de malo », `_caveFmlEtat`, `_mlMalo`, la légende, le cahier) et franchit le seuil. Question posée : découper `cave.js` dans ce lot ? Non — un découpage est un lot de structure (frontière, `mv-cave-src`, harnais), pas un supplément de 2,5 ko. **Regravé pour la seule ligne `src/cave.js` (636 → 670 ko)**, à la main et pas par `--baseline`, qui aurait regravé la taille de tous les modules. La question revient à Nico, avec une recommandation : sortir le labo dans `src/labo.js` (un bloc d’environ 66 ko d’un seul tenant, en fin de fichier — déjà au §28, LABO-1) ; l’autre candidat est un module du millésime (§335e). `cuvier.js` : 548 ko pour un seuil de 557.

### 356f. Ce qui reste (→ §28)
À regarder chez Nico ; une malo finie mais jamais déclarée reste « pas encore déclarée » jusqu’à sa déclaration ; le parcours du Cuvier reste celui du rouge (pressurage après la FA) — un parcours propre au blanc serait un autre lot.

## 357. ★★ MANQUE-1 — « CE QU’IL MANQUE » LISIBLE JUSQU’EN BAS, ET DES ALERTES VRAIES (18/10 — `src/styles.css` (le fondu de `.page`) · `src/pilotage.js` (`_ecoPhytoByParc` : `nLignes` ; `_pilDiag` : le constat phyto, les barèmes en trois familles, le constat « aucun pied compté » ; `_pilGo` : la cible interne `comptes` ; `.pil-diagsheet` : marge basse) · `src/app.js` (`window._parcConcern`) · `src/comptes.js` (`_cptRafraichir` redessine le Pilotage) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Pilotage, MV_INFO `pil.eco.fiabilite`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-manque1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/MANQUE-1.json` · **APP 9.21 → 9.22, SW 10.00 → 10.01**, base `7ff8a7d`)

### 357a. La demande
Capture de Nico (18/10), Pilotage › « 2 choses à compléter » › « Ce qu’il manque », en hiver : « En bas c’est coupé » ; « 1 alerte difficile à enlever car il n’y a pas de barème en h/ha (vérifie), donc me renvoyer à réglage pour apporter une correction n’est pas utile, trouve un autre moyen » ; « pour l’entretien le traitement phyto tout est ok, je ne comprends donc pas la phrase ». Diagnostic rendu d’abord, reformulé, puis « go ».

### 357b. Mesuré AVANT (vraie appli, serveur Vite du clone, Chromium du bac à sable, 390 × 844, hors dépôt : `/home/claude/mesure/mesure_diag.mjs`)
- Données injectées par `applyFbData` (période « Hiver 2026 - 2027 » avec Taille, Tirage, Brûlage, Entreplantation, Arrachage ; un seul traitement, de juillet), connexion par le vrai écran (auth simulée, recette de l’E2E local), clic réel sur `#pil-diagbtn`, feuille défilée jusqu’en bas.
- **Animations normales** : `elementFromPoint` au bas de l’écran rend la barre (`#mv-dock`) ; le dernier bouton de la feuille (y 755–790) est SOUS la barre (771–844), impossible à toucher — la capture de Nico, à l’identique. `.page.active` : `animation-fill-mode: forwards`.
- **Animations réduites** (`reducedMotion:'reduce'`) : la même feuille passe DEVANT la barre, son dernier bouton se touche. Les deux mondes divergeaient.
- Les deux constats de la capture sortent aussi : « Doses phyto non structurées » et « 2 tâches sans barème h/ha » (Entreplantation, Arrachage).

### 357c. Les trois causes
1. **Le bas coupé.** Le fondu d’entrée (`pageInFwd`/`pageInBack`) était `forwards`. Il finit sur `opacity:1`, la valeur par défaut — invisible à l’œil —, mais une animation qui reste en vigueur agit comme un `will-change:opacity` : la page active devient un contexte d’empilement PERMANENT. `#pil-diagwrap` (z 8905) vit DANS la page ; `#mv-dock` (z 90) est hors d’elle : la page entière se peint au rang 0, la barre au-dessus. Le z-index ne pouvait rien. Reproduit d’abord sur une page minimale (barre devant avec `forwards`, feuille devant sans), puis sur la vraie appli (357b).
   ★ **TOUR-1 (§170) n’avait jamais marché** : il passait `.pil-diagwrap` de 90 à 8905 et annonçait « il passe désormais devant » — sans mesure (son « Mesuré » ne cite que des captures de contraste). CADRE-1 (§300) avait mesuré la même cause sur la barre du Planning et l’avait contournée (barre à 450) ; le chantier de Décider l’avait contournée aussi (`_dzDockH` : les couches s’arrêtent au-dessus de la barre). Trois rencontres, trois contournements, la cause laissée en place.
2. **« Sans barème » pour des tâches qui n’en ont pas.** `_pilTacheHha` rendait 0 pour l’Arrachage (`tempsReel` : catalogue « hors barème », roue crantée « pas d’h/ha conventionnel », seule une estimation facultative existe) et pour l’Entreplantation sans trous prévus (`trous` : aucun champ h/ha — « Pas d’h/ha à la surface »). Le bouton menait à la roue crantée, où il n’y a rien à corriger pour la seconde, et une estimation inventée pour la première. L’aide de l’appli disait pourtant déjà « une tâche sans barème à l’hectare — arrachage, désherbage manuel, entreplantation… ne prévoit pas d’heures ».
3. **Le phyto d’hiver.** `_pecData` → `_ecoPhytoByParc()` filtre sur la période consultée ; en hiver, aucune ligne au registre ; `anyDose` reste faux et le constat disait « Aucun traitement ne porte de dose structurée : les produits comptent pour zéro » — un zéro JUSTE présenté comme un trou, chez tous les domaines, tout l’hiver.

### 357d. Ce qui est fait, et les arbitrages
- **Le fondu sans `forwards`** (`styles.css`, deux règles) : la page n’est un contexte que pendant ses 0,24 s ; après, chacun retrouve son z-index — le dessin des animations réduites, pour tous. ★ **Inventaire avant de toucher une règle qui vaut pour toutes les pages** : règles `position:fixed|sticky` à z > 90 (CSS de `styles.css` et CSS injecté par les modules) : 45, dont celles posées DANS une page — `.pl2-abar`/`.pl2-mbar` (450, posées au-dessus de la barre, sous les fenêtres à 500 : CADRE-1 les a déjà calées pour ce monde-là), `.vt-bot` (93, « au-dessus du socle » d’après son propre commentaire), `.pil-dz-pk` (95, au-dessus de la barre), `.pil-dz-shw`/`.pil-dz-fm` (400, bas calé sur `_dzDockH`), `.pil-scrim`/`.pil-drawer` (8900/8910, « sous le plancher modal »), `#pil-diagwrap` ; aucune ne chevauche la barre sans le vouloir ; aucun z-index négatif ; `mix-blend-mode` nulle part. Les fenêtres (`.overlay`, `openOv`) vivent hors des pages : inchangées.
- **Envisagés et écartés** : sortir le panneau de la page (sa délégation de clics est posée sur la page — le piège décrit dans `_pilBind` —, et le thème le vise sous `#page-pilotage`) ; arrêter le panneau au-dessus de la barre comme Décider (un contournement de plus, la cause restait). La règle CSS est la cause, une fois pour toutes.
- **Les barèmes en trois familles** (`_pilDiag`) : au temps passé (`t.tempsReel`) → plus de constat (une estimation saisie compte toujours, via `_pilTacheHha`) ; pilotée par les pieds (`t.trous` / Entreplantation) → constat propre « Entreplantation : aucun pied compté », bouton « Saisir les comptes » (cible interne `comptes` → `openComptes`, COMPTE-1 §353), silencieux quand `_parcConcern` ne rend plus aucune parcelle (désactivée partout, ou toutes comptées à zéro sans trou) ; les autres → la roue crantée, comme avant. `_parcConcern` est EXPOSÉ par `app.js` plutôt que recopié (§25.16 : la même réponse que la charge). Le texte dit comment se défaire de l’alerte quand il n’y a rien à planter : « Une parcelle sans pied à remplacer se compte à zéro ».
- **Le retour** : `_cptRafraichir` (comptes.js) redessine le Pilotage quand il est la page affichée — sans quoi « N choses à compléter » gardait l’entreplantation jusqu’au passage suivant (mesuré : 6 → 5 à l’enregistrement).
- **Le phyto** : `_ecoPhytoByParc` compte ses lignes dans la fenêtre (`nLignes`, ajout pur) ; le constat devient « Traitements sans dose chiffrée » et ne parle que si `nLignes>0 && !anyDose` — la règle validée par Nico, rien de plus (un traitement non dosé au milieu de traitements dosés reste hors constat, comme avant : §28).
- **La feuille** : marge basse `calc(34px + env(safe-area-inset-bottom,0px))` — le panneau descend désormais jusqu’au bas de l’écran (`viewport-fit=cover`), le dernier bouton doit rester au-dessus du trait d’accueil d’un iPhone.
- **L’accompagnement** : MV_AIDE Pilotage (le bouton « à compléter » : ce qu’il ne réclame plus et pourquoi ; « entreplantation sans pieds comptés ni trous percés »), MV_INFO `pil.eco.fiabilite` (dose chiffrée ; une période sans traitement n’a rien à compléter), guide `11-pilotage.html` (la liste du bouton), WHATS_NEW 9.22 (trois corrections, niveau 0, pour l’administrateur). Visite guidée : aucun sélecteur touché.

### 357e. Ce qui a été vérifié
- **APRÈS, au navigateur, même recette** : animations normales ET réduites — le bas de l’écran rend le panneau, le dernier bouton se touche ; plus de constat phyto (hiver, aucune ligne) ; plus de « sans barème » pour l’arrachage ; « Entreplantation : aucun pied compté » avec « Saisir les comptes › » ; clic réel → `#ovComptes` ouvert (3 parcelles), panneau fermé ; un compte de 14 enregistré → « 6 choses à compléter » devient « 5 ». Captures regardées (avant, après).
- `scripts/mv-harnais-manque1.mjs` : 29 vérifications — le moteur des constats EXÉCUTÉ dans l’appli entière (`mv-app-node`, avec `app.js` et `comptes.js` du lot) sur sept domaines (hiver vide, un compte posé, tout à zéro, une vraie tâche simple sans heures, une estimation d’arrachage, un traitement d’octobre sans dose puis dosé), la feuille rendue, la porte `comptes`, `_cptRafraichir` exécutée, la règle du fondu, l’aide, la fiche, le guide, la nouveauté — et 13 contre-épreuves, toutes rouges. ★ Une garde contre le vert vide : le constat phyto dépend de `_pecData`, avalé par un `try` ; A0 exige que le coût se calcule, sinon « aucun constat phyto » serait vrai pour une mauvaise raison.
- `mv-harnais-audit-pil` : 4 rouges, **identiques sur la base** (`git stash`) — il n’est plus dans la liste du lanceur ; hors lot.
- **La liste complète** (`mv-lanceur --continuer`, à l’heure de Paris) : **437 commandes, 772 s, deux rouges, tous deux expliqués**. ① `build-guide --check` : `public/guide.html` en retard sur `guide/11-pilotage.html` — vert après `node scripts/build-guide.mjs` ici ; le fichier généré n’est PAS livré (`npm run site` chez Nico). ② `mv-harnais-typo` : `src/utils.js` 902 → 948 ko, au-delà des 5 % (seuil 947) — le bloc WHATS_NEW et les phrases d’aide du lot (+2 ko) sur une référence jamais regravée depuis. Preflight : 0 erreur, 11 avertissements.

### 357f. Arbitrage — la taille de `utils.js`
Regravé pour la seule ligne `src/utils.js` (902 → 948 ko) de `scripts/typo-baseline.json`, à la main et pas par `--baseline` (qui regraverait tous les modules) — le patron de `cave.js` au §356e. La croissance vient d’ailleurs que du lot : `WHATS_NEW` compte 409 blocs et grossit à chaque lot visible. Recommandation, à trancher par Nico : sortir `WHATS_NEW` de `utils.js` dans un module à lui (lot de structure : `_whatsNewSince`, `mv-whatsnew-check`, l’ordre d’import).

### 357g. Ce qui reste (→ §28)
À regarder sur un vrai téléphone (le trait d’accueil, les deux thèmes) ; le fondu sans `forwards` vaut pour toutes les pages, à confirmer à l’usage ; un traitement non dosé parmi des traitements dosés reste hors constat. **Vu en passant, hors lot** : dans la feuille des comptes (COMPTE-1), le bouton « Un de plus » montre trois points — `_mvIcon('plus')` dessine les points de suspension du menu « Plus » (`ic-plus`, `data-src="ellipsis"`) ; même pictogramme sur « Saisir un rapport » (labo) et sur le bouton d’intervention groupée du Cuvier. À trancher : un vrai « + ».

## 358. ★★★ TUTO-1 — LES TUTOS GUIDÉS, JOUÉS SUR LES VRAIS ÉCRANS AVEC UN DOMAINE FICTIF (18/10 — `src/tutos.js` (neuf) · `public/boot.js` · `src/firebase.js` · `src/app.js` · `src/tracteur.js` · `src/utils.js` (aide, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-tutos.mjs` (neuf) · `scripts/mv-tutos-jeu.mjs` (neuf) · `scripts/tutos-couverture.json` (neuf) · `scripts/mv-harnais-liste.mjs` · `package.json` · `.github/workflows/ci.yml` · `guide/01-demarrer.html` · `CLAUDE.md` · `docs/claude/*`)

### 358a. La demande
08/10 : des tutoriels façon jeu — l’appli montre où toucher, c’est l’humain qui touche — sur un logiciel de démonstration et non sur le domaine du client, pour se passer de l’aide écrite et d’un humain ; puis « chaque action possible de l’application doit être tutorisée ». Une maquette jouable a été publiée le 08/10 (deux tutos, le catalogue « Je veux… »). 18/10 : « on fait le tuto interactif, il faut que ça se mette à jour automatiquement à chaque changement qui le nécessite », et un fichier dédié aux tutos. Reformulation confirmée par Nico avant le travail : ce qui suit l’appli tout seul (libellés, chemin, écran réel), ce qui ne le peut pas (une étape nouvelle) et qui doit bloquer la mise en ligne.

### 358b. Ce qui a été mesuré avant d’écrire
- **819 gestes** côté client (fonctions lancées par onclick/onchange/oninput…, hors Admin GT), contre **766 le 08/10** : +53 en dix jours. Écrire des tutos à la main sans garde-fou, c’était écrire des tutos faux dans le mois.
- Le moteur de la visite (`_mvt*`) : **0 ligne changée** depuis le 08/10 (20 moments, 3 missions où le visiteur touche lui-même).
- Les écritures du SDK vivent toutes dans `firebase.js` (**15 appels**) ; `localStorage` en compte **103** dans dix fichiers.
- `fbCallFn` agit sur le domaine du **jeton** — celui du client —, pas sur `TENANT_ID` : une fonction serveur appelée pendant un entraînement aurait agi sur le vrai domaine.
- La session Firebase est commune à tous les onglets : se connecter au compte démo (le chemin de la visite) aurait remplacé la session du client.
- `currentUser` est une variable de module d’`app.js` (`let`) : un autre module ne peut pas l’écrire.

### 358c. Arbitrages
- **Les vrais écrans plutôt qu’une copie.** La maquette du 08/10 redessinait l’écran Tracteur : TRAC-1/2 l’avaient rendue fausse dix jours plus tard. Un tuto joué sur l’écran réel n’a pas de copie à tenir.
- **Un bac à sable sans serveur plutôt que le compte démo.** Ni lecture ni écriture ; le domaine vaut `domaine-dupont`, ce qui hérite des gardes de démo existantes (fbSave local, pas d’appareil noté, pas de jalons) et met les règles Firestore en dernier verrou (le jeton du client ne vaut pas pour ce domaine).
- **La porte par renommage des imports** (`setDoc as _sdkSetDoc`, seize fonctions) : les appels existants passent par la garde sans être touchés un par un, lectures comprises — rien du vrai domaine n’entre, rien n’en sort.
- **La mémoire jetable dans `boot.js`** (script classique, avant tout module), par `Object.defineProperty(window, 'localStorage')`, VÉRIFIÉE : sans elle, pas d’entraînement. Seul le thème la traverse.
- **Ce qui suit tout seul** : les libellés lus à l’écran (`L(sel)`), le chemin vers un module calculé depuis le dock, la barre ou « Plus », « Touchez » / « Cliquez » selon l’appareil. **Ce qui ne peut pas** (une étape nouvelle) est attrapé au build par `npm run test:tutos`.
- **Une étape réussit sur un état de l’écran** (`fait`), jamais sur un clic.
- **« Montre-moi » est aussi le mode automatique du build** : le même code joue le geste pour la personne bloquée et pour la CI.
- **Le compte des gestes sans tuto en cliquet** (813) : un geste nouveau sans tuto rougit ; une exemption se motive dans `tutos-couverture.json`.
- **Deux tutos (admin) seulement** : le socle d’abord. Le lot s’est réduit plutôt que livrer des tutos qu’aucun test ne rejoue.

### 358d. Pièges trouvés en route
- Le jeu de démo (`mavigne_demo_data.json`, export de juin) portait `conducteurs` et `activites` en chaînes : LISTES-1 les écartait (« éléments illisibles »). Passés en `{nom}` dans `TU_DONNEES`.
- « Montre-moi » tapait avec `+=` : un champ nombre efface « 1. », la valeur devenait « 24 », et le tuto du GNR restait bloqué à l’étape du prix. Corrigé : le préfixe entier à chaque frappe.
- Le harnais comptait `_sdkGetDoc` dans `_sdkGetDocs` (sous-chaîne) et prenait les attributs du moteur (`data-c`) pour des cibles : frontière de mot, liste des attributs du moteur.
- `_mvNotifPublier` (reglages.js) appelle une fonction serveur au démarrage d’un admin : la porte la retient, l’appli l’avale et le note en console — attendu, déclaré bénin dans `mv-tutos-jeu.mjs`.
- Les deux `console.log` de `sw.js` portaient encore v10.01 : le preflight l’a vu (C7).
- Vus sur les captures : le doigt passait SOUS la consigne quand il montrait « Continuer » (z-index 100014 < 100015) → 100017 ; en thème clair, « Continuer » sortait blanc : `--btn-pri` n’atteint pas une couche posée sur `body` → repli `var(--btn-pri, var(--vert-med))` / `var(--btn-pri-tx, var(--blanc))`, lisible dans les deux thèmes.

### 358e. Mesures
- `npm run test:tutos` (build final du lot, Chromium du bac à sable via `MV_CHROMIUM`) : téléphone — équipes ✓ 5/5 étapes en 15,6 s, GNR ✓ 7/7 en 21,1 s ; ordinateur — équipes ✓ 15,5 s, GNR ✓ 21,0 s ; **0 requête** vers Firestore, le stockage ou les fonctions ; la porte retient 3 appels par parcours.
- `mv-harnais-tutos` : vert ; contre-épreuves **9/9**.
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 599 s, une seule rouge** — `mv-harnais-contraste` (thème sombre, `src/tutos.js` 0 → 1 écart : le repli `#fff` du bouton principal). Corrigé (repli `var(--blanc)`), puis rejoués : contraste et sa contre-épreuve, `mv-harnais-tutos` et sa contre-épreuve (9/9), `lint-cliquet`, `mv-harnais-typo`, preflight — tous à 0. Le premier passage (avant correctifs) avait 21 rouges : 4 adresses e-mail du jeu de démo (confidentialité), huit harnais qui exécutent des fonctions de `firebase.js` hors du module (`_MV_TUTO` inconnu chez eux → les gardes lisent `window.__MV_TUTO`), le plafond de `CLAUDE.md` (2 803 > 2 800), le §28 ouvert sur un bloc non conforme, une cible de pastille en classe au lieu d’un #id.
- Captures du vrai écran (390 × 844, clair et sombre) : le cadre et le doigt sur la pastille, sur « Équipe 1 » de Jean, sur le champ des litres puis sur « Continuer » ; la consigne en haut quand la cible est basse ; le bandeau « Entraînement ».

### 358f. Ce qui n’a pas été vérifié
Le clavier d’un vrai téléphone pendant une saisie (la consigne passe en haut quand `visualViewport` rétrécit) ; les deux thèmes à l’œil ; la pastille « Nouveau » sur le bouton Aide.

### 358g. Ce qui reste (→ §28)
L’inventaire des 819 gestes en objectifs (≈ 230 tutos estimés au 08/10, à recompter) et un tuto par objectif, module par module ; les tutos de l’ouvrier et du tractoriste (utilisateur fictif au rôle du tuto) ; des données fictives élargies (cave, planning, journal) ; les options à trancher par Nico : lecture à voix haute, parcours de démarrage par rôle, « Me montrer » depuis les nouveautés, envoi d’un tuto à un salarié.

### 358h. Rangement de CLAUDE.md (plafond de 2 800 lignes)
Le cœur était à son plafond ; le lot y ajoute une ligne de consigne (règle d’or n°4 : les tutos) et une ligne au §28. Descendu ici, parce que c’est de l’histoire et plus une consigne — le point 2 d’« ARRIVEE-1 à ARRIVEE-3 — ce qui reste ouvert », fait depuis :

> 2. **Le bouton « Filtres » est fait : ARRIVEE-4 (§355), 17/10** — ce qui suit est la note d’origine. ~~Pas fait~~ (le tri — tournée, proximité, normal — dans un seul bouton) : l’objectif
>    mesuré est atteint sans lui ; à décider après l’avoir vu.

## 359. ★★ TUTO-2 — LE TUTO À CÔTÉ DE L’APPLI SUR ORDINATEUR, DES TITRES EN QUESTIONS, L’ENTRAÎNEMENT HORS DU CACHE PARTAGÉ (18/10 — `src/tutos.js` · `public/boot.js` · `src/firebase.js` · `firebase.json` (CSP) · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/01-demarrer.html` · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-tutos-jeu.mjs` · `scripts/mv-tutos-inventaire.mjs` (neuf) · `CLAUDE.md` · `docs/claude/*`)

### 359a. La demande
Après l’inventaire publié (818 gestes, 354 groupes), Nico : sur ordinateur, ouvrir le tuto « par-dessus ou à côté » de l’appli, pour faire le geste pour de vrai sur sa propre session en même temps ; et des titres qui répondent à une question, « comment faire pour », plutôt qu’un mot. Reformulation confirmée avant le travail, avec un verrou ajouté : l’entraînement hors du cache Firestore partagé. TUTO-1 était déjà poussé et déployé (`f82a0da`, empreintes identiques au livrable).

### 359b. Mesuré avant d’écrire
- CSP : `frame-ancestors 'self'` et `X-Frame-Options: SAMEORIGIN` laissaient l’appli s’afficher dans un cadre d’elle-même, mais `frame-src` ne listait que Google et Firebase : le panneau aurait été **bloqué en ligne**, et aucun test local ne l’aurait vu (le serveur de test n’envoie pas la CSP) → `frame-src 'self'`, et le harnais le tient.
- Firestore : `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. Le seul appel non gardé (`disableNetwork`/`enableNetwork`, `_mvReprise`) s’arrête sur `_isDemo` : en TUTO-1 l’entraînement n’ouvrait probablement jamais ce cache (non mesurable ici, faute de serveur). Avec le panneau, deux fenêtres tournent à coup sûr : `memoryLocalCache` pendant l’entraînement, pour une garantie plutôt qu’une probabilité.
- La mémoire de session (`sessionStorage`) d’un cadre est celle de la fenêtre qui l’ouvre : le drapeau de TUTO-1 (`mavigne_tuto` en mémoire de session) aurait fait redémarrer **l’appli du client** en entraînement à son rechargement suivant.

### 359c. Arbitrages
- **Un cadre de l’appli plutôt qu’une copie** : le panneau montre le vrai écran, au format téléphone (le cadre fait 420 px) ; la consigne parle donc de « en bas de l’écran » du panneau — c’est la même appli que sur le téléphone de l’équipe.
- **Un panneau qui se déplace plutôt qu’une appli qu’on retaille** : retailler toute l’appli pour lui faire de la place, sans pouvoir regarder chaque écran, était un pari ; le panneau passe « de l’autre côté » ou part dans « Fenêtre à part ».
- **Le drapeau dans l’adresse seule**, et les deux mémoires remplacées : rien de l’entraînement ne touche la mémoire de la fenêtre qui l’ouvre ; le retour du plein écran est lu par `boot.js` avant le remplacement (`window.__MV_TUTO_RETOUR`).
- **Sans mémoire jetable, pas d’entraînement** : en plein écran, retour à l’appli ; dans un cadre, `window.stop()` et un message — l’appli ne doit jamais démarrer sur la vraie session dans le panneau.
- **Titres en questions tenus par le harnais**, pas par une consigne seule.
- **L’inventaire est fabriqué** (`dist/tutos-inventaire.json`) : on livre le script, on nomme la commande (§24, `guide.html`).

### 359d. Pièges
- Le premier lancement de la capture du panneau ne montrait rien : le bloc « Me montrer comment faire » ne liste que les tutos permis au rôle et à l’écran — sans session, aucun. Pas un défaut de l’appli : la capture a posé un utilisateur admin.

### 359e. Mesures
- `npm run test:tutos` (build du lot) : téléphone — équipes ✓ 16,0 s, GNR ✓ 21,1 s ; ordinateur — ✓ 15,8 s, ✓ 21,2 s ; **panneau (cadre dans une page de l’appli)** — équipes ✓ 16,1 s, GNR ✓ 21,6 s, mémoire de la page qui l’ouvre intacte (session 0, locale 0), « Fermer l’entraînement » transmis ; 0 requête vers le serveur.
- `mv-harnais-tutos` : vert ; contre-épreuves **13/13** (dont : drapeau en mémoire de session, entraînement dans le cache partagé, `frame-src` sans l’appli, titre qui n’est pas une question).
- Capture (1 366 × 820) : le panneau à droite, sa barre (« De l’autre côté », « Fenêtre à part », croix), le tuto qui s’y joue (cadre doré sur la pastille, « Cliquez »).
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (784 s).

### 359f. Ce qui n’a pas été vérifié
Le panneau à côté d’une VRAIE session (le bac à sable n’en a pas) ; « Fenêtre à part » dans un vrai navigateur (bloqueur de fenêtres) ; la CSP réelle (seulement lue dans `firebase.json`).

### 359g. Ce qui reste (→ §28)
Trier l’inventaire module par module en écrivant les tutos, chaque titre en question — d’abord la Vigne ; l’utilisateur fictif au rôle du tuto (ouvrier, tractoriste) ; données fictives élargies ; gestes serveur à trancher (dernier écran ou réponse simulée).

## 360. ★★ TUTO-3 — LE MIROIR : LE TUTO OUVERT À CÔTÉ DE L’APPLI SUIT LES GESTES FAITS SUR LE VRAI DOMAINE (18/10 — `src/tutos.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/01-demarrer.html` · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-tutos-jeu.mjs` · `CLAUDE.md` · `docs/claude/*`)

### 360a. La demande
Après TUTO-2 : « De l’autre côté » dérègle l’affichage ; et surtout, ce que la personne fait sur son domaine, la fenêtre du tuto ne le suit pas — il faut faire le geste deux fois. Nico : garder la fenêtre ; la personne choisit de faire le geste dans la fenêtre ou sur son domaine ; un mode miroir entre les deux ; et pouvoir tout faire dans la fenêtre seule. Reformulation confirmée (« C’est parti »), avec le sens unique et l’anneau doré proposés.

### 360b. Arbitrages
- **Un seul sens, du domaine vers la fenêtre.** L’inverse ferait écrire l’entraînement sur le vrai domaine : la garantie de TUTO-1 tomberait. Tenu par le harnais : la fenêtre ne dit que `etape`, `fini`, `fermer` ; elle n’écoute que `miroir` ; aucun clic du moteur hors de « Montre-moi ».
- **La même vérification que le tuto**, évaluée par l’appli sur SON écran : les étapes sont déjà écrites en « l’écran a vraiment changé » (fenêtre ouverte, onglet actif, cuve montée). Pas de pistage des clics.
- **`reel` pour les étapes à valeurs fictives** : « Jean et Sophie dans l’Équipe 1 » n’existe pas chez le client → au moins une personne placée ; « la pastille dit Jean » → la pastille a changé depuis l’ouverture (`memo.eqj0`). `txtReel` ajoute « Sur votre domaine : … » à la consigne de la fenêtre.
- **Rattrapage** : l’appli regarde jusqu’à deux étapes d’avance ; la fenêtre joue les étapes en retard (une saisie facultative laissée vide est passée).
- **Une saisie se suit quand elle est posée** : valeur stable 1,5 s ou champ quitté — sinon « 8 » partirait avant « 800 ». Le nombre tapé est repris dans la fenêtre.
- **L’anneau doré, sans voile, sur le vrai bouton**, caché dès que l’étape est faite chez le client ; aucune étape « regarder » n’est suivie : la fenêtre attend « Continuer ».
- **« Fenêtre à part » garde le miroir** (la fenêtre ouverte reçoit les messages) ; **« De l’autre côté » retiré**.

### 360c. Mesures
- `npm run test:tutos` : **8/8** — téléphone, ordinateur, panneau (mémoire de l’appli intacte), et le miroir : (1) une page qui répond `miroir` à chaque étape mène la fenêtre au bout sans autre geste, et le « 1 200 L » tapé « sur le domaine » arrive (cuve fictive 1 850 L) ; (2) l’appli jouée en vrai : chaque étape faite est vue faite par la vérification du miroir (équipes 4/4, GNR 6/6, hors « regarder »).
- Parcours de bout en bout (Chromium, 1 366 × 860) : l’appli (domaine fictif, entraînement GNR) ouvre le panneau depuis « Me montrer comment faire » ; les gestes sont faits CHEZ ELLE ; le panneau suit 1 → 7 (une étape de retard pendant la saisie, le temps qu’elle soit posée), cuve du panneau à 1 450 L (les 800 L tapés chez elle) ; il s’arrête sur « regarder » en attendant « Terminer ».
- `mv-harnais-tutos` : vert ; contre-épreuves **16/16**.
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (869 s).

### 360d. Ce qui n’a pas été vérifié
Le miroir à côté d’une VRAIE session (le bac à sable n’en a pas) ; « Fenêtre à part » avec un vrai bloqueur de fenêtres.

### 360e. Ce qui reste (→ §28)
Chaque nouvelle étape à valeurs fictives : son `reel` et son `txtReel`, sinon la fenêtre ne peut pas la suivre (elle reste faisable dans la fenêtre). Le reste comme au §359g.

## 361. ★★ TUTO-4 — LE MIROIR NE SUIVAIT PAS CHEZ NICO : UN boot.js D’UNE VERSION PRÉCÉDENTE, GARDÉ EN CACHE (18/10 — `public/boot.js` · `public/sw.js` · `firebase.json` · `index.html` · `src/tutos.js` · `src/app.js` · `src/utils.js` (APP, WHATS_NEW) · `guide/01-demarrer.html` · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-tutos-jeu.mjs` · `CLAUDE.md` · `docs/claude/*`)

### 361a. Le constat
TUTO-3 en ligne (9.25, vérifié par Nico) : sa capture montre la vraie fenêtre « Équipes du jour » ouverte à gauche, et le panneau resté à « Étape 1 sur 5 ». Mes tests passaient : le côté « domaine » y était l’appli en entraînement, sans service worker ni vraie session.

### 361b. La recherche
- Reproduit avec un VRAI clic de souris sur la pastille, dans la fenêtre de l’appli (1 900 × 950) : la fenêtre s’ouvre, le panneau passe à l’étape 2, l’anneau suit. Le miroir marche ; la différence est ailleurs.
- `sw.js` : les pages en réseau d’abord (le panneau reçoit donc un `index.html` frais) ; mais `boot.js` est dans `SHELL_STATIC`, précaché par `cache.addAll` à l’installation — qui peut lire le cache du navigateur — puis servi par la branche « statics : cache-first » jusqu’à la version suivante.
- `firebase.json` : aucun `Cache-Control` pour `/boot.js` (Firebase Hosting garde alors une heure par défaut). Trois mises en ligne le même après-midi : le service worker de la 9.25 a pu précacher le `boot.js` de TUTO-1.
- Or c’est le `boot.js` de TUTO-2 qui pose `__MV_TUTO_CADRE` : sans lui, le panneau ne parle pas à l’appli et n’écoute rien. Le même défaut expliquerait « De l’autre côté fait planter les fenêtres » (TUTO-2) : sans `_cadre()`, « Quitter » chargeait l’appli DANS le panneau.
- Risque associé : le `boot.js` de TUTO-1 écrit `mavigne_tuto` dans la mémoire de session — partagée avec l’onglet de l’appli, qui pouvait redémarrer en entraînement et y revenir à chaque sortie (l’effacement avait quitté `_sortir` avec TUTO-2).

### 361c. Le correctif
- **`boot.js` toujours frais** : `boot.js?v=<APP_VERSION>` dans `index.html` (une adresse neuve à chaque version : ni le cache du navigateur ni celui de l’ancien service worker ne la connaissent — la bascule tient même avant l’activation du nouveau), `no-cache` dans `firebase.json`, réseau d’abord (`cache: 'no-store'`) dans `sw.js`, copie gardée pour le hors-ligne.
- **Rien sans le bon `boot.js`** : marque `__MV_BOOT_TUTO_V = 4` ; `tutos.js` la vérifie dès son chargement quand l’adresse porte `?tuto=` ; absente ou autre → `__MV_TUTO_BLOQUE`, et `app.js` n’ouvre NI l’entraînement NI l’appli (avec un `boot.js` d’avant les tutos, c’est la vraie session qui se serait ouverte dans le panneau) ; « Une mise à jour à finir : fermez tous les onglets Ma Vigne, puis rouvrez ».
- **`_sortir` efface de nouveau `mavigne_tuto`** de la mémoire de session (sans effet avec un `boot.js` frais, qui la remplace).
- **Le miroir renvoyé à chaque tour** (300 ms), même « rien de fait » : un message perdu pendant un chargement n’est plus une étape perdue, et c’est un signe de vie — le panneau affiche « Je suis vos gestes sur votre domaine », ou « Votre appli ne répond pas » au bout de 4 s. Une ligne `[Tuto miroir]` dans la console à chaque étape vue faite.

### 361d. Mesures
- `npm run test:tutos` : **9/9** — les 8 d’avant, plus un `boot.js` d’une version précédente servi au panneau : bloqué, message affiché, ni entraînement ni appli, mémoire de session de la page intacte.
- Vrai clic dans la fenêtre de l’appli (Chromium, 1 900 × 950) : avant — panneau étape 1, « Je suis vos gestes sur votre domaine », anneau visible ; après — la fenêtre des équipes ouverte, panneau étape 2.
- `mv-harnais-tutos` : vert ; contre-épreuves **21/21** (dont : `boot.js?v=` d’une autre version, `no-cache` retiré, branche réseau d’abord retirée, marque changée, `app.js` qui démarre quand même).
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (753 s).

### 361e. Ce qui n’a pas été vérifié
La bascule réelle du service worker chez un client (installation de v10.05 par-dessus v10.04) : le bac à sable bloque le service worker. Ce qui la rend sûre sans elle : l’adresse versionnée de `boot.js`.

## 362. ★★ TUTO-5 — LE PANNEAU DU TUTO LIT LUI-MÊME L’APPLI ET DÉMARRE LÀ OÙ L’ON EST (18/10 — `src/tutos.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/01-demarrer.html` · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-tutos-jeu.mjs` · `CLAUDE.md` · `docs/claude/*`)

### 362a. La demande
Après TUTO-4 : « Votre appli ne répond pas » s’affichait dans le panneau alors que l’appli allait bien ; et le suivi accrochait quand l’appli était déjà sur le bon onglet — « il faudrait bloquer le suivi une fois qu’on est sur l’onglet dédié, ou trouver une autre façon de faire ». Proposé et confirmé : le panneau lit lui-même l’appli ; il démarre là où l’on est ; une fois l’onglet dédié atteint, il ne suit plus que les gestes de l’écran.

### 362b. Arbitrages
- **Lire plutôt qu’écouter.** TUTO-4 faisait dépendre le panneau d’envois réguliers de l’appli : un arrêt, même bref (onglet en arrière-plan, minuterie freinée, cycle de vie de l’écouteur), devenait « ne répond pas ». Le panneau et l’appli sont le même site : le panneau appelle des fonctions de l’appli en LECTURE SEULE (`_mvTutoMiroirFait`, `_mvTutoAvant`, `_mvTutoValeur`) et `_mvTutoAnneau` pour l’anneau. Plus d’écouteur côté appli (sauf « fermer »), plus de veilleur, plus de message d’absence : s’il ne lit pas l’appli, le panneau ne suit pas, c’est tout.
- **L’anneau à la demande** : redemandé à chaque lecture, il s’efface seul au bout d’1,2 s sans demande — aucun lien de vie à tenir.
- **Démarrer là où l’on est** : `_alignerDepart` joue, avant la première consigne, les étapes de CHEMIN déjà faites dans l’appli (`aller`, et les étapes marquées `chemin: true`, comme l’onglet Entretien) ; plus de rattrapage en rafale à l’écran. Le chemin n’est jamais repris ensuite : changer d’onglet dans l’appli ne fait plus rien au panneau.
- **Le sens unique reste tenu par le harnais** : la fenêtre n’appelle que ces quatre fonctions, ne touche jamais le document de l’appli, ne lui dit que « fermer » ; le moteur ne clique que dans « Montre-moi » et dans l’alignement du départ — sur SA page.

### 362c. Mesures
- `npm run test:tutos` : **9/9** — dont le miroir par lecture (une « appli » qui se laisse lire mène le panneau au bout ; 1 200 L repris ; l’anneau demandé) et le départ aligné (chemin du GNR déjà fait : le panneau commence à l’étape 3).
- Vrais clics (Chromium, 1 900 × 950) : la vraie pastille → le panneau passe à l’étape 2, anneau visible ; l’appli déjà sur Tracteur › Entretien à l’ouverture → le panneau commence à « La cuve est à 650 litres sur 2 000. Cliquez « Appoint de cuve » ».
- `mv-harnais-tutos` : vert ; contre-épreuves **22/22**.
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (775 s).

### 362d. Ce qui n’a pas été vérifié
Chez un vrai client connecté (le bac à sable n’a pas de session) ; la « Fenêtre à part » avec un vrai bloqueur de fenêtres.

## 363. ★ TUTO-6 — LE TUTO À CÔTÉ DE L’APPLI SUIT EN UNE DEMI-SECONDE (18/10 — `src/tutos.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-tutos.mjs` · `CLAUDE.md` · `docs/claude/*`)

### 363a. La demande
Après TUTO-5 : « Ça manque de fluidité. Sinon, c’est vraiment très bien. »

### 363b. Mesuré avant d’écrire
Vrai clic sur la vraie pastille (Chromium, 1 900 × 950) : « Fait sur votre domaine » affiché à **618 ms**, étape suivante prête à **2 915 ms**. Les 2,3 s d’écart : le doigt animé qui rejoue le geste (740 ms de trajet + 330 ms d’appui) et la pause de réussite (1 200 ms). En enchaînant chez soi, le panneau perdait ~3 s par étape.

### 363c. Arbitrages
- **En miroir, plus de doigt animé** : le geste est déjà fait sur le domaine ; `_jouerVite` le refait ici d’un coup (clic, choix, valeur posée), pause de réussite 0,3 s, étapes d’avance enchaînées (relance à 80 ms). « Montre-moi » garde son doigt : là, montrer est le but.
- **Lecture plus vive** : toutes les 150 ms (au lieu de 300), une seule lecture pour un changement d’écran (au lieu de deux), lecture dès 250 ms après la consigne (au lieu de 700) ; une saisie compte au champ quitté ou après 0,8 s sans frappe (au lieu de 1,5 s).
- **Panneau seul** : pause 0,8 s (saisie 0,7 s, « Passer » 0,5 s) au lieu de 1,2 s.
- **Ouverture** : « Préparation de l’entraînement… » jusqu’à la première consigne (lue dans le cadre : `etape` et `depart` posés).

### 363d. Piège trouvé en route
La lecture de l’appli pouvait partir AVANT l’alignement du départ (`E.aligne` n’était posé que dans `_alignerDepart`, 300 ms après le démarrage) : les deux jouaient le chemin, le panneau commençait à l’étape 4 au lieu de 3. Plus rare avec l’ancienne cadence, possible quand même. `test:tutos` l’a vu (départ aligné) ; corrigé : `E.aligne` posé au démarrage dans un cadre, et aucune lecture avant la première consigne (`E.debut`).

### 363e. Mesures
- Vrai clic : « Fait sur votre domaine » à **145 ms**, étape suivante prête à **477 ms** (au lieu de 2 915).
- « Préparation de l’entraînement… » : affiché à l’ouverture, effacé à ~1,65 s, quand la première consigne est prête.
- `npm run test:tutos` : **9/9** (parcours seuls ~10 % plus courts : équipes 14,0 s au lieu de 15,8).
- `mv-harnais-tutos` : vert ; contre-épreuves **23/23** (dont : le miroir qui rejoue le doigt animé).
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (829 s).

## 364. ★★ TUTO-7 — LE TUTO DES ÉQUIPES NE SAUTE PLUS D’ÉTAPE (19/10 — `src/tutos.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-tutos-jeu.mjs` · `CLAUDE.md` · `docs/claude/*`)

### 364a. Le constat
Nico, avant de lancer le déploiement de tous les tutos : à l’entraînement « mettre les ouvriers dans une équipe », le panneau passe parfois de l’étape 2 à l’étape 4 ; « ça plante, vérifie le code ».

### 364b. Ce que le code faisait
- **Une même vérification pour deux étapes.** Les étapes 2 (« Jean et Sophie dans l’Équipe 1 ») et 3 (« Paul dans l’Équipe 2 ») avaient le même `reel` : « la fenêtre est ouverte chez le client et quelqu’un y a une équipe ». Un seul choix chez le client les validait toutes les deux ; la lecture d’avance (jusqu’à deux étapes) faisait jouer l’étape 3 aussitôt : 2 → 4.
- **Le geste d’un coup sans verrou** (TUTO-6) : la lecture repasse toutes les 150 ms ; tant que l’écran n’avait pas changé, le même geste se rejouait — la pastille re-cliquée rouvrait la fenêtre et effaçait les choix.
- **Une référence lue trop tôt** : la pastille « d’avant » était lue au premier regard du panneau, parfois avant d’être dessinée ; tout texte ensuite passait pour un enregistrement.
- **Le prix du GNR** comptait même tapé avant les litres : les litres pouvaient être sautés.

### 364c. Le correctif
- Plus de `reel` sur les deux choix : sur le vrai domaine, les personnes du domaine fictif n’existent pas, les choix ne se distinguent pas. Le panneau suit quand le client ENREGISTRE, et rejoue alors les choix dans l’ordre. La consigne dit « choisissez l’équipe de chacun, puis enregistrez ».
- L’enregistrement : la pastille « d’avant » est lue pendant que la fenêtre est ouverte chez le client (dès l’ouverture, étape 1, puis à chaque lecture fenêtre ouverte).
- Un geste d’un coup par étape (`E.joue`, remis à zéro à chaque consigne).
- Le prix du GNR n’est vu fait qu’avec les litres posés.

### 364d. Mesures
- **Le défaut d’abord reproduit** : la garde neuve de `test:tutos` (aucune étape plus loin annoncée faite avant son tour) a rougi sur le code d’avant — « étape 3 vue faite côté domaine alors que le panneau était à l’étape 2 ».
- Après : `npm run test:tutos` **9/9**, avec les deux gardes neuves (aucun saut, aucun geste rejoué : `vites` ≤ étapes).
- Vrais clics dans l’appli (Chromium) : pastille → panneau à l’étape 2 ; un choix, puis un deuxième → le panneau RESTE à l’étape 2 ; « Enregistrer » → le panneau passe par 2 → 3 → 4 → 5.
- `mv-harnais-tutos` : vert ; contre-épreuves **24/24** (dont : le geste d’un coup sans verrou).
- `node scripts/mv-lanceur.mjs --continuer` : **439/439 commandes, 0 rouge** (871 s).

### 364e. La règle qui en sort (→ §27g)
Deux étapes ne partagent jamais la même vérification côté domaine. Une étape à valeurs fictives qu’on ne peut pas distinguer chez le client n’a pas de `reel` : elle se rattrape à l’étape suivante.

## 365. ★★ AIDE-1 — LA FENÊTRE « ? AIDE » SE LIT : PLUS DE CODE À L’ÉCRAN, L’ICÔNE DESSINÉE, LE PILOTAGE QUI DIT VRAI (19/10 — `src/utils.js` (`openAide`, `_mvAideTexte` neuve, `_mvAideOngletsPil`, fiches Pilotage et Cave, APP, WHATS_NEW) · `src/styles.css` (`.mva-hd-ic` retirée) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-aide.mjs` (neuf) · `scripts/mv-harnais-tutos.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/AIDE-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.29 → 9.30, SW 10.08 → 10.09**, base `97ed506`)

### 365a. La demande
18/10, Nico : « il y a un souci dans l’écran d’aide de pilotage », sans capture. Exploré avant de demander : quatre défauts listés (le mot « graphique » à la place de l’icône, du code dans le texte, « Huit onglets » contre « les sept onglets », « le dernier ouvert revient »), confirmés par Nico (« c’est exactement ça »), avec la proposition : la cause pour toutes les fiches, les deux phrases, un contrôle qui bloque la mise en ligne.
Le lot a d’abord été monté sur `f82a0da` (TUTO-1). Nico a poussé TUTO-2 à TUTO-7 entre-temps ; à sa consigne (« relis les fichiers et les mises à jour et go »), tout a été réappliqué sur `97ed506` : ancres relues, versions relues (9.29 / 10.08), section renumérotée (TUTO-2 avait pris le §359).

### 365b. Ce qui a été mesuré avant d’écrire
- **Au navigateur** (Chromium du bac à sable, `/opt/pw-browsers/chromium-1194`, parcours de `e2e-local.mjs` : données injectées, connexion DOM réelle, réseau Firebase coupé) — aide du Pilotage, 390 × 844 et 1366 × 900, clair et sombre : en-tête « graphique », 105 bouts de code visibles, « Huit onglets » et « les sept onglets », « le dernier ouvert revient ».
- **Rendu rejoué en Node sur les dix fiches** : 215 bouts de code visibles — Pilotage 105, Cave 64 (dont un `<sub>`), Parcelles 30, Accueil 8, Tracteur 4, Réserve 4 ; le nom de l’icône écrit en clair dans les onze (défaut compris).
- **Âge** : `_escHtml(a.ico)` et `_escHtml(p[1] || '')` sont dans le plus vieil état du dépôt (06/09) ; le Pilotage portait alors 24 balises, 52 le 18/10.
- `openAide` est le seul lecteur de `MV_AIDE`. Les nouveautés (`a.it.desc`) s’injectent SANS échappement : leurs `<sub>` s’affichent bien, rien à y changer.
- Aucun harnais ne rendait l’aide : C22 vérifie qu’une fiche a sa page ; les « 73 assertions » du 09/08 (§27b) ne sont plus dans `scripts/`.
- `goHub` (app.js) appelle `_pilOuvrirAujourdhui` depuis AUJ-5 (§307) ; `renderPilotage` relit ensuite l’onglet mémorisé : « s’ouvre sur Aujourd’hui, garde l’onglet où vous étiez » est la phrase vraie.

### 365c. Arbitrages
- **Le gras rendu plutôt que retiré.** §27b disait « le gras est posé par le rendu, jamais par le contenu » ; les fiches avaient pris l’habitude de `MV_INFO`, qui porte son `<b>`. Retirer 107 gras aurait aplati des pavés de 2 000 caractères où le gras est le seul repère. Le texte est écrit, jamais saisi : `_mvAideTexte` échappe tout, puis rend `<b>`/`</b>` — appariés, jamais imbriqués, refermés en fin de ligne (un gras ouvert déborderait sur les lignes suivantes : le navigateur reconstruit les éléments de mise en forme restés ouverts). Nico a confirmé « vrai gras ».
- **Une seule balise permise, et aucun caractère neuf.** `<sub>2</sub>` → « SO2 » en chiffres ordinaires. Le premier montage avait écrit `SO\u2082`, comme ailleurs dans `utils.js` et `cave.js` : `mv-harnais-subset` a rougi — U+2082 est hors du sous-ensemble des polices, la dette est gelée à 271 caractères et « ne remonte pas ». `&amp;` → `&`.
- **L’icône dans la tuile `.mvi-ic`** de la fiche « Nouveau » plutôt qu’une classe neuve : une seule charte pour les deux feuilles ; `.mva-hd-ic` (taillée pour un émoji) n’avait plus d’élément et sort de `styles.css`.
- **Le nombre d’onglets n’est dit qu’une fois, par le code** (`_mvAideOngletsPil`) ; « Le « i » est partout » ne compte plus. La phrase d’ouverture suit AUJ-5, et `mv-harnais-aide` la lie à `goHub` : si goHub cesse de rouvrir Aujourd’hui, le build rougit et l’aide se réécrit.
- **Le guide dans le même lot** (règle d’or n°4) : « Les sept onglets suivent désormais » → « Tous les onglets suivent » ; Archives au sous-titre (huit onglets dans `_PIL_TABS`). `public/guide.html` n’est pas livré : `npm run site` le refait.
- **Pas de relecture de fond des fiches** : le lot est la panne d’affichage et les deux phrases fausses, ce que Nico a confirmé (→ §365g).
- `WHATS_NEW` 9.30 : une correction, niveau 0 (Journal), pour tous — l’aide de chaque module est lue par tout le monde.

### 365d. Pièges trouvés en route
- L’ancre « L’équipe &amp; le matériel » portait une espace fine insécable réelle (U+202F), que `repr()` affiche `\u202f` : retapée avec un antislash, elle n’existait pas. « Extraire l’ancre, ne jamais la retaper » vaut aussi pour la lecture d’un `repr`.
- La première capture montrait l’écran des conditions : `_mvApplyTrialGating` le rouvre pendant la navigation (le piège de l’E2E) — refermé juste avant d’ouvrir l’aide.
- Joué sur les fichiers d’avant, le harnais plantait au montage (`_mvAideTexte` absente) : un plantage ne prouve pas qu’on voit le défaut. Avec la fonction facultative au montage, il rougit sur 11 points — exactement ce que voyait Nico.
- Une contre-épreuve dont l’ancre se perd n’a rien posé : elle compte MUETTE (le modèle de MANQUE-1 la comptait « rougit »).
- **`boot.js?v=<APP_VERSION>` est un 5ᵉ affichage de version depuis TUTO-4 (§361)**, que §7 ne disait pas (« 4 affichages », quatre fois dans CLAUDE.md : corrigé). Et la contre-épreuve de `mv-harnais-tutos` écrivait `boot.js?v=9.29` en dur : chaque bump d’APP la faisait tomber en « motif introuvable » — elle lit désormais `APP_VERSION`.
- CLAUDE.md disait « `test:smoke` / `test:e2e` : jamais joués côté Claude (Chromium injoignable) » : faux à moitié — un Chromium est dans le bac à sable (révision 1194), mais Playwright du dépôt cherche la 1228 : seul `mv-tutos-jeu.mjs` sait prendre `MV_CHROMIUM`.

### 365e. Mesures
- `mv-harnais-aide` : 28 vertes ; contre-épreuves 17/17 ; sur les fichiers d’avant le lot : 11 rouges sur 20.
- `mv-harnais-tutos` : vert, contre-épreuves 24/24 (dont « boot.js à l’adresse d’une autre version », version lue).
- Captures après (même parcours) : en-tête « Pilotage » avec son icône, 0 code visible, 100 gras, « Huit onglets », plus « sept » ni « dernier ouvert » — téléphone et ordinateur, clair et sombre.
- `mv-harnais-subset` : vert, dette inchangée (271) ; `preflight` : 0 erreur ; `mv-whatsnew-check` vert.
- **La chaîne complète** (`mv-lanceur --continuer`, sur `97ed506` + le lot) : **441 commandes, 0 rouge, 741 s**. Le premier montage (sur `f82a0da`) en avait laissé deux rouges : `mv-harnais-subset` (le `SO\u2082`, → « SO2 ») et `build-guide --check` (la page dérivée pas refaite — vert après `node scripts/build-guide.mjs`, page rendue ensuite à son état poussé : `npm run site` la refait chez Nico).
- **Build** (sans `prebuild`, la chaîne venait de passer) : `dist/version.json` 9.30. **`test:smoke`** : OK. **`test:tutos`** (`MV_CHROMIUM`) : les deux tutos au téléphone, à l’ordinateur, en panneau et en miroir, et le refus d’un vieux `boot.js` — tout vert. **`test:e2e`** : connexion et dix pages passent ; trois erreurs, toutes « Failed to fetch » vers la météo (`_pluieCharger`, météo du secteur) : `api.open-meteo.com` est injoignable depuis le bac à sable (adresse non résolue : `curl` sort en code 6, vérifié), code hors du lot.
- Pour jouer `smoke` et `e2e` ici : `PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb`, où `chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell` est un lien vers le `headless_shell` de la révision 1194 (plus les deux fichiers témoins `INSTALLATION_COMPLETE` et `DEPENDENCIES_VALIDATED`).

### 365f. Ce qui n’a pas été vérifié
Un vrai téléphone (Chromium du bac à sable seulement) ; à l’œil, les fiches autres que le Pilotage (le harnais les rend toutes, la capture ne montre que le Pilotage).

### 365g. Ce qui reste (→ §28)
La relecture de fond des dix fiches contre leurs écrans — la fiche du Pilotage se lit par endroits comme un journal des changements et son premier point fait ~2 000 caractères ; `test:smoke` et `test:e2e` qui liraient `MV_CHROMIUM` (aujourd’hui : le lien de §365e) ; vus en passant : le chevron de « Tous les tutos », l’espace simple avant « ; ».

### 365h. Rangement de CLAUDE.md (plafond de 2 800 lignes)
Le cœur était à son plafond (2 800). Les points 4 et 5 du backlog technique (six lignes) deviennent deux lignes justes ; voici les six d’origine, descendus ici parce que le premier est de l’histoire (rayé le 01/09, raconté au §78) et que le second était faux :

> 4. ~~**`lint-cliquet` / ESLint** : jamais joué côté Claude~~ — **RAYÉ le 01/09.**
>    ★ **`npm install eslint@9 --no-save` fonctionne dans le bac à sable** (registry.npmjs.org est
>    ouvert) : 309 paquets en 12 s, puis `node scripts/lint-cliquet.mjs` tourne normalement.
>    L'entrée disait « impossible » là où personne n'avait essayé. **Ce filet est désormais jouable à
>    chaque lot, et il doit l'être** — voir §78.
> 5. **`test:smoke` / `test:e2e`** : jamais joués côté Claude (Chromium injoignable).

## 366. ★★ MATU-1 — LES MATURITÉS RANGÉES : UN ÉCRAN, LA VENDANGE CHOISIE, LA FOURCHETTE PAR COULEUR (19/10 — `src/cuvier.js` (`renderVendAna` réécrit, `_matSynth` borné, `_vendMatSvg`, la fiche, la saisie en série, la fenêtre des couleurs, `renderVendParam`, `_vendSaveParam`, expositions) · `src/cave.js` (`_cuvMatSvg` : les bandes ; `_mvQ` retiré) · `src/styles.css` (bloc MATU-1) · `src/utils.js` (MV_INFO `cave.maturite`, MV_AIDE Cave, APP, WHATS_NEW) · `index.html` (trois fenêtres) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-matu1.mjs` (neuf) · `scripts/mv-harnais-info.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/tutos-couverture.json` · `.mv-base` · `lots/MATU-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.30 → 9.31, SW 10.09 → 10.10**, base `4f9cf13`)

### 366a. La demande
18/10, Nico : l’onglet Maturités du Cuvier est « tout étalé, un peu chantier, pas pro ». Maquette d’abord : une toile Design jouable (téléphone et ordinateur, clair et sombre, données fictives du Domaine des Grandes Vignes au 08/09/2026), contrôlée par un script sur 343 états. Validée le 19/10, « telle quelle » ; le rangement s’étend ensuite à tout le Cuvier et à la roue crantée, lot par lot. Ce lot-ci : les Maturités seules.

### 366b. Ce qui a été lu avant d’écrire
- **Les années se mêlaient.** La courbe et les cartes de l’ancien onglet lisaient TOUTES les analyses (`byP` sans filtre) ; seule la synthèse se bornait, par une fenêtre de 150 jours. À la deuxième vendange, 2025 et 2026 se seraient superposés sur le même axe ; l’hiver, la fenêtre des 150 jours laissait même entrer l’automne d’avant dans « l’année en cours ».
- **La saisie repartait de zéro.** Un formulaire par mesure : choisir la parcelle, taper, enregistrer, recommencer — douze fois pour une tournée de réfractomètre.
- **`mat_objectif` était lu (la ligne d’objectif des courbes) mais aucun écran ne permettait de le poser.**
- Degré potentiel et estimation alcoolique affichaient le même chiffre deux fois.

### 366c. Ce qui est livré
- **La tête** : la vendange choisie (liste native : sur téléphone, le sélecteur du système), la date — une vendange passée se relit à sa dernière mesure, comme le document imprimé —, « Noter des mesures », et « Imprimer le contrôle » sur ordinateur seulement.
- **La synthèse** : trois tuiles (Domaine, Rouges, Blancs) qui filtrent tout l’écran, la fenêtre de fraîcheur (7 jours, 14 jours, toute la vendange), et le « i » : une fiche vivante (`_mvInfoSet('cave.maturite')`) qui redit la moyenne sans pondération et ce qui n’est pas compté. La fiche fixe de MV_INFO reste le repli.
- **L’ordre de maturité** : une ligne par parcelle sur une échelle commune ; la bande verte est la fourchette de SA couleur, le trait pointillé la moyenne ; « hors moyenne » au-delà de la fenêtre ; jamais mesurées et déjà rentrées repliées (`_matVoirTout` devient `{ jamais, rent }`) ; la phrase du haut dit combien sont dans leur fourchette et l’écart que mélangerait une même benne.
- **Les courbes** : celles de la vendange choisie et du filtre choisi, sans les parcelles rentrées, avec les bandes ; la légende est une liste qui ouvre la fiche.
- **La fiche** : dernière mesure, vitesse, rang, repères (position dans la fourchette, depuis quand), courbe à la couleur du vin, mesures avec la corbeille, « Noter une mesure sur cette parcelle ». À droite sur ordinateur (à la place des courbes, collante), dans une fenêtre au téléphone (`ovMatFiche`).
- **La saisie en série** (`ovMatSaisie`) : la date, l’unité du réfractomètre, toutes les parcelles sur pied dans l’ordre de maturité (celle de la fiche en tête) ; on remplit celles qu’on a mesurées, un seul enregistrement, une seule sauvegarde. Hors des plages plausibles (120–290 g/L, 7–17,5 %vol) : signalé « à vérifier », pas refusé.
- **La couleur des parcelles** que le cépage ne tranche pas : une fenêtre (`ovMatCouleurs`) au lieu des boutons en bas de carte.
- **La fourchette** : roue crantée › Le Cuvier › Maturité, une par couleur, en g/L (`config.mat_four = { r:{min,max}|null, b:… }`). `_matRegLire` : deux bornes ou aucune, remises dans l’ordre, bornées à 120–300, un haut égal au bas refusé — rien ne s’enregistre tant que c’est faux. Le millésime (`_cuvMatSvg`) trace les mêmes bandes.

### 366d. Les décisions
- **Le minimum de l’appellation (le trait rouge de la maquette) n’est pas dans ce lot.** Il se règle avec l’appellation (Gevrey-Chambertin : 180 g/L en rouge au cahier des charges), donc avec le lot de la roue crantée ; le poser ici aurait affiché un repère que personne ne peut régler.
- **La fourchette est un réglage du domaine, pas une norme.** Aucune borne haute réglementaire n’existe pour le raisin ; le seul plafond porte sur le vin enrichi. D’où « Laisser vide : pas de bande », et aucune valeur par défaut posée en silence (les valeurs de la maquette ne sont que l’exemple grisé des champs).
- **Le calcul ne change pas** : `_matSynth` reste la source ; seul son troisième argument (la vendange) est neuf.

### 366e. Trouvé en route
- **`mv-harnais-info` ne lisait que cave.js.** Écrit avant CUV-DEC (§164) ; toute bulle posée au Cuvier passait pour orpheline. Il lit maintenant cave.js + cuvier.js.
- **C24b** : deux valeurs posées dans des `onclick` sans `_escAttr`. Le nom de parcelle passe désormais par `data-nom` et `this.dataset.nom` ; du coup `_mvQ` (cave.js) n’avait plus d’appelant : retiré, avec son exposition.
- **Les replis des jetons** : `mv-harnais-jetons` exige un repli sur chaque jeton du socle et compte les replis manquants des anciens (`--pt-*`, `--e-*`) : 288 posés dans le bloc MATU-1, aucun nu.
- Un `catch` vide (le focus de la feuille) : il trace maintenant.
- **Où poser un bloc de style.** En fin de feuille, il passe après TETE-2, qui doit rester le dernier (`mv-harnais-tete2`). Juste avant TETE-2, il fait rougir sept harnais (JALONS-2, PRESENCE-1, PREMIERES-1, RANGBOUT-1, CARTEDOM-1, SAISONIMG-1, ARRIVEE-4) : chacun découpe la feuille de son bloc jusqu’à `/* ★ TETE-2 (§329)` et y refuse toute couleur en dur — or les replis des jetons (`--ligne`, les ombres) en portent. Posé juste après `★ FIN CAVE-2`, il ne traverse aucun découpage connu (vérifié en relevant tous les couples `indexOf(A), indexOf(B)` des scripts).
- **La marque d’un lot fige ses fichiers** : retoucher styles.css après `mv-lot-marque` rougit `mv-lots` (« ne retrouve plus 1 de ses 18 fichiers »). La marque se pose en dernier.

### 366f. Deux décisions à revoir
- **`typo-baseline.json` regravé** : cuvier.js 531 → 568 ko, styles.css 747 → 787 ko. Le style a d’abord été écrit injecté dans cuvier.js (587 ko) ; sorti dans styles.css, cuvier.js reste à +7 %. Les trois onglets suivants du Cuvier le feront encore grossir : la question d’un module à part (les vues du Cuvier, ou les Maturités seules) se pose AVANT le lot Récoltes.
- **Le plafond des gestes sans tuto relevé de 813 à 820** (`tutos-couverture.json`) : sept gestes neufs (la vue, la vendange, la fiche, la feuille, sa saisie, son unité, sa date, la fenêtre des couleurs ; deux anciens retirés). Un tuto « Noter des mesures » en couvrirait l’essentiel.

### 366g. La leçon
**Un harnais qui lit un fichier par son nom vieillit avec le découpage.** `mv-harnais-info` lisait « la Cave » dans cave.js depuis avant CUV-DEC : il n’a jamais vu une bulle du Cuvier. Quand un module se scinde, chercher les harnais qui le lisent par son nom.

## 367. ★★ CHARTE-1 — LA POLICE PASSE PAR LA CHARTE : UNE LIGNE POUR CHANGER DE POLICE (19/10 — `src/styles.css` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `public/boot.js` · `src/gt/console.html` · `src/gt/connexion.html` · `src/admin-gt.js` · `src/app.js` · `src/cave.js` · `src/cockpit-vue.js` (`policeUi`, `POL_PL`) · `src/cuvier.js` · `src/onboarding.js` · `src/phyto.js` · `src/pilotage.js` · `src/planning.js` · `src/reglages.js` · `src/reserve.js` · `src/tracteur.js` · `src/tutos.js` (`_PF`) · `scripts/mv-harnais-police.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **APP 9.31 → 9.32, SW 10.10 → 10.11**, base `d741866`)

### 367a. La demande
19/10, Nico : « chaque fois que j’essaie de changer le style des modules — la police, la mise en page, la déco — on doit tout changer module par module et c’est très long » ; il veut un fichier qui régit tout le style, pour alléger les modules et n’avoir qu’un fichier à changer à la prochaine refonte. Objectif reformulé puis confirmé (« oui ») : changer le look de toute l’appli en touchant un seul fichier.

### 367b. Le constat, mesuré avant d’écrire
- **Le fichier existe déjà en grande partie** : 229 réglages en tête de `styles.css` (couleurs, polices, tailles, espacements, arrondis, ombres, clair et sombre). DS-4 (§270) l’a prouvé : tout ce qui les lisait a suivi d’un coup.
- **Mais l’appli le contourne** : la police écrite à la main 765 fois, contre 94 par le réglage ; ~4 400 couleurs à la main dans les modules (backlog n°29) ; 4 283 attributs `style=` (~280 ko, modules + index.html) ; 28 fonctions qui fabriquent leur feuille dans les modules (~240 ko) — un choix ancien, voulu pour éviter de bumper le SW (§4), qui a éparpillé la charte ; des réglages redéfinis à une quinzaine d’endroits de la feuille ; 3 397 classes, dont une soixantaine de sortes de cartes, plus de 70 de boutons, plus de 90 de pastilles. Les jetons changent les couleurs et les tailles, jamais la forme d’une carte.
- **Le plan annoncé** : trois étages — un seul fichier de charte, une boîte de pièces communes, les écrans passés un par un sans rien changer à l’œil, chacun avec un cliquet. Premier lot : la police.
- ⚠️ **Premier chiffre annoncé faux** : 684. Le comptage s’arrêtait au premier guillemet et ignorait `font:`, les attributs SVG et `&#39;`. L’inventaire complet en donne **765** : 719 `font-family`, 32 raccourcis `font:`, 10 attributs SVG, 4 `var(--sans,…)`. Corrigé devant Nico avant la livraison.

### 367c. Ce qui est livré
- **styles.css** : 325 polices → `var(--font-ui)` / `var(--font-titre)`, sans repli — le réglage est dans le même fichier, comme pour les 94 appels d’avant (tous dans la feuille).
- **Hors feuille** (13 modules, index.html, les deux pages GT, boot.js) : 440 polices → `var(--font-ui,<la liste d’avant>)`. Le repli est la liste EXACTE d’avant, dans sa forme d’échappement (`\'`, `&#39;`, nu) : une fenêtre sans feuille — impression ouverte depuis un Blob, écran de démarrage, boot.js — rend exactement comme avant.
- **`--sans`** : déclaré nulle part, appelé quatre fois (`.aoc-*`), il tombait toujours sur son repli — un second nom pour la même chose, la faute de `--bordeaux` (TOUR-1). → `var(--font-ui)`.
- **Les attributs SVG** (`pilotage.js`, 10) : `font-family="var(--font-ui,Outfit)"`. Un `var()` dans un attribut de présentation : vérifié au Chromium 153 du bac à sable (police résolue au réglage, repli quand il manque) ; Firefox et WebKit le gèrent aussi (W3C svgwg #1031, novembre 2025 — Chromium ne le refuse que pour les longueurs) ; c’est le mécanisme des `fill="var(--texte)"` déjà en place.
- **Une toile ne lit pas les variables CSS** : `cockpit-vue.js/policeUi()` lit `--font-ui` par `getComputedStyle` au premier dessin ; `POL_PL` devient trois accesseurs — les quatre appels de `largeurTx` n’ont pas changé. Repli : la police d’avant, si la feuille n’est pas encore là (exemption écrite).
- **`tutos.js/_PF`** : la police du tuto lit le réglage, avec son repli (le panneau peut s’ouvrir dans une fenêtre à côté).
- **`mv-harnais-police`** — A : aucune police en toutes lettres hors réglage, repli ou exemption ; B : un repli ne ment pas sur son rôle ; C : hors feuille, chaque `var(--font-*)` porte son repli ; D : le réglage, une fois, dans la feuille ; E : la première police de chaque réglage a ses `@font-face` dans `public/fonts/fonts.css` ; F : `--sans` ne revient pas ; G : chaque exemption sert, au compte exact. 13 contre-épreuves, 3 témoins (un commentaire, un repli au bon rôle, une famille générique ne rougissent pas).

### 367d. Les décisions
- **Le repli dans les modules, pas dans la feuille.** Savoir, site par site, quelle chaîne part dans une fenêtre sans feuille est impossible à 440 sites ; le repli partout coûte ~8 ko, se tromper coûte une impression en Times. Même règle que les `--pt-*` (`mv-harnais-typo` C).
- **Le repli ne suit pas un changement de police, et c’est voulu.** Si Nico change `--font-ui`, l’appli suit ; les impressions gardent Outfit jusqu’au lot qui leur passera la charte (§28). Le harnais garde le RÔLE du repli (Cormorant jamais derrière `--font-ui`), pas son nom — sinon changer de police redemanderait 440 retouches.
- **La police de secours change, et c’est la seule différence possible à l’écran.** `'Outfit',sans-serif` devient la chaîne du réglage (`Outfit,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`). Seuls les caractères hors de l’`unicode-range` de `fonts.css` (→, ✓, ★…) changent de police de secours : Segoe UI sur PC, SF sur iPhone, au lieu d’Arial ou Helvetica dans certains écrans — la police que les en-têtes et la barre latérale leur donnaient déjà. Android : Roboto des deux côtés.
- **Hors périmètre** : le site public (`guide/`, pages de `public/`) et les PDF (`mkpdf.py`, polices fontsource) ne chargent pas `styles.css`. Les trois polices de code (`'Courier New'`, `monospace`) restent : `--font-code` changerait leur dessin.
- **E est le piège exact de la demande** : « je change la police dans le réglage, et chaque téléphone en prend une autre sans rien dire » — la police n’a pas ses fichiers. Une famille générique (`system-ui`…) n’en demande pas.

### 367e. Mesuré
- **Chaîne complète** (`node scripts/mv-lanceur.mjs --continuer`) : **445 commandes, 0 rouge**. `mv-harnais-police` : 8 vertes ; ses 13 contre-épreuves rougissent toutes, ses 3 témoins restent verts.
- **Base → lot, fichier par fichier** : syntaxe juste (15 JS lus en module, `sw.js`, `boot.js`) ; `catch{}` vides inchangés ; accolades et `<div>` à l’équilibre d’avant ; diff ciblé : **0 ligne hors du motif « police »**, sauf les 3 lignes de `policeUi`.
- **Poids** : `styles.css` 805 583 → 803 240 octets ; modules, index.html, pages GT et boot.js : +8 027 octets en tout (les replis) — loin de la tolérance de `mv-harnais-typo` (+5 % par lot).
- **Chromium 153** : `var()` résolu dans un attribut SVG `font-family` et dans un raccourci `font:` ; le repli est pris quand le réglage manque.
- **Trois cliquets en baisse, identiques sur la base** (donc d’un lot précédent) : C24b 6 → 3, icônes −5, contraste sombre −6. Non regravés ici.
- ⚠️ **PAS FAIT : les captures avant/après de la vraie appli.** Le montage (Chromium sans tête, serveur Vite, données d’e2e-local, connexion simulée) n’a jamais atteint l’écran des profils : « Nico E2E » n’apparaît pas à l’écran de connexion — trois essais, cause non trouvée. `npm run test:e2e` chez Nico dira si c’est le montage ou l’étape de connexion d’e2e-local. Le rendu reste à regarder chez lui (§28).

### 367f. Trouvé en route
- **§24, l’item 19 était coupé en deux** : l’item 20 (TETE-2) s’était glissé entre sa première ligne et sa suite. Recollé, sans changer un mot.
- **Le cœur était à 2 799 lignes sur 2 800** : les deux lignes de consigne neuves (§24 n°21, §28) ont été payées par une ligne blanche de mise en forme (sous « L’offre de lancement est bornée »), aucune consigne déplacée. Le prochain lot devra descendre de l’historique.

### 367g. La leçon
**Un réglage qui existe n’est pas un réglage qui sert.** `--font-ui` existait depuis DS-4 (08/10) : 94 appels contre 765 polices écrites à la main, et aucun harnais ne regardait les polices. DS-3 l’avait déjà écrit pour l’espacement (« 19 appels contre 1 682 valeurs ») : ce que le contrôle ne compte pas ne se résorbe pas. **Un jeton se pose avec son cliquet, dans le même lot** — c’est la règle que la série CHARTE applique pièce par pièce.
