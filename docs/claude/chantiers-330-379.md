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
