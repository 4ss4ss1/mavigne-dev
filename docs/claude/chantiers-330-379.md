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
