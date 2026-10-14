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
