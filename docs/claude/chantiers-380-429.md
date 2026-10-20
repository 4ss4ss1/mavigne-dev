# Ma Vigne — Chantiers §380 à §429

> Ouvert le 19/10/2026 (§380), sur le modèle de `chantiers-330-379.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.

## 380. CHARTE-5b — LES ENCADRÉS DU PHYTO ET DES RÉGLAGES AU JEU (19/10 — `src/phyto.js` · `src/reglages.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/harnais-claude-md.mjs` · **APP 9.41 → 9.42, SW 10.20 → 10.21**, base `89c7e08`)

### 380a. La demande
La suite proposée après CHARTE-5a (§379), acceptée (« suite ») : les encadrés faits à la main, module par module, en commençant par le Phyto (44) et les Réglages (32), qui en ont le plus après `index.html` et la console GT.

### 380b. Ce qui a été lu avant d’écrire
Les 76 blocs du Phyto et des Réglages que compte la règle F de `mv-harnais-cartes`, classés par leur couleur : 21 colorés et non cliquables (rouge, vert, orange / or / ambre, bleu / acier) — de vrais encadrés ; 25 neutres (gris, fond de module, blanc) — des notes, mais aussi des tuiles et des lignes : à regarder un par un ; 14 aux couleurs calculées par le code (un `${…}` ou un `'+x+'` dans le style) ; 16 autres, souvent cliquables (`cursor:pointer`) : des options ou des cartes, pas des encadrés.

### 380c. Ce qui est livré
- **21 encadrés au jeu** — Phyto 9 (« ✅ Conforme », « ⚠️ Dépassement du plafond », DRAE, insecticide, stade, DRE anticipé…), Réglages 12 (campagne déjà datée, aucune campagne préparée, sauvegarde d’une ancienne version ou incomplète, lignes perdues à l’import…) : `class="mvencadre mvencadre-<ton>"`, le ton lu sur la couleur ; le fond, le filet, la couleur et la taille du texte écrits sur place retirés ; la mise en page gardée (marges, `display`, `flex`, `gap`, alignements, largeur).
- **L’encadré est un bloc de texte** : un encadré d’avant mêle du texte, des `<b>` et des `<br>` — en `display:flex`, chaque morceau serait devenu une case, posée côte à côte. `.mvencadre` est donc un bloc ; il se range en ligne seulement quand une icône est son premier enfant (`.mvencadre:has(> svg)`). Ceux qui étaient déjà en ligne (une icône dans un `<span>`) gardent leur `display:flex` écrit.
- **Plafond des encadrés faits à la main** (`mv-harnais-cartes` F) : 232 → 211.

### 380d. Vu, et pas vu
- **Vu** (`mv-captures`, Réglages et Phyto ; téléphone et ordinateur, clair et sombre) : les écrans intacts. L’encadré vert « La campagne est couverte sans trou ni chevauchement » des Réglages est un `.cmp-alert` à classe, pas un encadré fait à la main : il n’a pas changé (et garde son filet) — pour le lot suivant.
- **Pas vu** : les 21 encadrés eux-mêmes — ils vivent dans la saisie d’un traitement, le détail d’un produit, l’import d’une sauvegarde, la préparation d’une campagne.
- **Chaîne** : **455 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 380e. La leçon
**Changer la boîte change ce qu’il y a dedans.** Un encadré d’avant n’était qu’un bloc de texte ; lui donner la mise en ligne de la pièce neuve aurait éclaté ses phrases. Une pièce qui reçoit du contenu d’avant se règle sur ce contenu, pas sur la maquette.

## 381. CHARTE-5c — LES ENCADRÉS D’ALERTE, PARTOUT AILLEURS (19/10 — `index.html` · `src/planning.js` · `src/app.js` · `src/cave.js` · `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/harnais-claude-md.mjs` · **APP 9.42 → 9.43, SW 10.21 → 10.22**, base `37d1a71`)

### 381a. La demande
La suite proposée après CHARTE-5b (§380), acceptée (« suite ») : les encadrés restants, en commençant par `index.html`, et l’encadré à classe vu dans les Réglages.

### 381b. Ce qui a été lu avant d’écrire
Les encadrés faits à la main hors Phyto, Réglages et console GT, classés par leur couleur comme au §380 : `index.html` 24 colorés (et 26 neutres), Planning 9 (12 neutres, 2 calculés), Accueil 5, Cave 4, Pilotage 1 ; un seul coloré cliquable, écarté. `.cmp-alert` (le bilan de la campagne dans les Réglages : couverte, trou, chevauchement) a son dessin dans le `<style>` d’`index.html` — lu après la feuille — avec des filets et des couleurs écrits en dur ; aucun contrôle ne le cite.

### 381c. Ce qui est livré
- **43 encadrés au jeu** par le même passage qu’au §380 (`class="mvencadre mvencadre-<ton>"`, la mise en page gardée) : les fenêtres de saisie d’`index.html` (erreurs et réussites du mot de passe oublié ou changé, la clé à noter, les mentions des factures, les erreurs d’une session de tracteur…), les récapitulatifs du Planning, la priorité et les « override » de l’Accueil, la lecture seule et les analyses de la Cave, le pied d’une tuile du Pilotage. Certains sont des tuiles colorées (six compteurs du Planning, trois valeurs d’analyse de la Cave) : elles gardent leur contenu, prennent le fond doux de leur ton et perdent leur filet.
- **`.cmp-alert` au jeu** : groupé sous `.mvencadre` et ses tons (`ok` → réussi, `warn` → attention, `bad` → danger), l’icône au ton. Sa mise en page (une icône et un texte en ligne, la marge du haut) **quitte le `<style>` d’`index.html` pour la feuille**, dans le bloc CHARTE-5 : le premier passage de la chaîne avait 1 rouge, `mv-harnais-couches` — « aucune classe n’est déclarée dans deux feuilles » ; laisser la mise en page dans `index.html` et le dessin dans la feuille, c’était déclarer `.cmp-alert` deux fois. `mv-harnais-cartes` le surveille (C) ; sa contre-épreuve A suit le groupement.
- Plafond des encadrés faits à la main : 211 → **168**.

### 381d. Vu, et pas vu
- **Vu** (`mv-captures`, téléphone, clair et sombre) : Réglages › Domaine, « ✓ La campagne est couverte sans trou ni chevauchement » au vert du jeu, sans filet, l’icône verte, le texte à l’encre. L’opération de cave et l’ajout d’un tracteur intacts.
- **Pas vu** : les 43 encadrés passés au jeu — ils apparaissent sur une erreur, une réussite ou un cas précis (mot de passe, facture, session, analyse).
- **Chaîne** : **455 commandes, 0 rouge** au second passage, joué d’un trait après le dernier changement de code ; le premier avait 1 rouge, `mv-harnais-couches` (381c).

### 381e. La leçon
**Le passage à la machine a une fin.** Les encadrés colorés se reconnaissent à leur couleur ; ceux qui restent (168) ne disent pas ce qu’ils sont — une note grise, une tuile, une ligne, une couleur calculée. Ceux-là se tranchent un par un, en les regardant.

## 382. ★★ REC-1 — LES RÉCOLTES RANGÉES : QUATRE CHIFFRES, LE RENDEMENT FACE AU MAXIMUM, LE JOURNAL, LA FICHE (20/10 — `src/cuvier.js` (`renderVendRec` réécrit, `_recDonnees`, `_recParcHtml`, `_recJourHtml`, `_recFicheHtml`, `_recHist`, `_vendAnnees`, `_vendDateLongue`, `_vendVoir`, `_matSetAn`, `_matAnCourant`, `_matTeteHtml`, la fiche des Maturités ; partis : `_vendApportsSvg`, `MV_APP_MAX`, `_vendRendHistHtml`, `_vendRendHistData`, `_vendRendInjectCss`) · `src/cave.js` (`_apportsRangs`, `_apportsPied` retirés) · `src/styles.css` (bloc REC-1) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `index.html` (`ovRecFiche`) · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-rec1.mjs` (neuf) · `scripts/mv-harnais-kit4.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `.mv-base` · `lots/REC-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.43 → 9.44, SW 10.22 → 10.23**, base `e1f6cd2`)

### 382a. La demande
Le rangement du Cuvier continue, onglet par onglet, sur la maquette validée le 19/10 (MATU-1, §366). Ce lot : les Récoltes. Nico (19/10) : « relis les fichiers et suite » — la série CHARTE était passée entre-temps : le nouvel écran s’écrit avec les pièces du jeu, pas avec des classes maison.

### 382b. Ce qui a été lu avant d’écrire
- **L’onglet d’avant ne bornait pas la vendange** : le bandeau, les apports et la liste lisaient TOUTES les récoltes, toutes années confondues (le même défaut que les Maturités d’avant).
- **Le rendement existe déjà, et il est riche** : `_mlRendements` (cave.js, Le millésime › Rendements) suit l’escalier des sources VD-3 (les litres rendus par le client et le volume logé d’abord, l’estimé au ratio ensuite) et le maximum dans l’ordre parcelle › appellation › ancien réglage. La maquette estimait au ratio seul : le refaire aurait donné deux chiffres différents pour la même parcelle.
- **« Encore sur pied » existe déjà** (`_vendResteHtml`) avec SANSREC-1 (« Pas de récolte cette année », la question à l’admin, le hors parcellaire) et deux harnais qui l’exécutent.

### 382c. Ce qui est livré
- **La tête** : la vendange choisie, commune avec les Maturités (`_vendAnnees` réunit les années des maturités et des pesées ; `_matSetAn` redessine l’onglet ouvert), la date — une vendange passée se relit à sa dernière pesée —, « Nouvelle récolte » pour la vendange en cours seulement.
- **Quatre chiffres** (`mvchiffres`) : rentrées sur à récolter (et la jauge de la surface), rendement moyen pondéré par la surface avec l’an passé sur les mêmes parcelles, récolté, en cuve.
- **Les ventes en raisin** : un encadré (`mvencadre`, attention s’il reste un retour client attendu) et « Voir les ventes ».
- **Le rendement par parcelle** : la plus proche de son maximum en tête (l’ordre de `_mlRendements`) ; la barre est le rendement (un trait quand il est mesuré, la fourchette quand il est estimé), le trait du maximum, le rond creux de l’an passé, le pointillé de la moyenne ; au-dessus du maximum, la barre et le chiffre passent au ton danger et un encadré nomme la parcelle. Sur ordinateur, une colonne pour l’an passé.
- **Le journal** : les pesées par jour, la plus récente en tête, avec leurs destinataires, l’éraflage et l’état sanitaire au ton du jeu (80 % et plus : réussi ; 55 à 79 : à surveiller ; dessous : en retard).
- **La fiche** : chiffres, dépassement, « Encore sur pied » et « Voir sa maturité », l’historique des cinq dernières vendanges (le rendement du Millésime pour celles saisies dans l’appli ; celles du fichier des parcelles estimées d’après leurs kilos, en barres pâles, et dites telles), les pesées avec « Modifier », « Ajouter une pesée sur cette parcelle ». À droite sur ordinateur, dans `ovRecFiche` au téléphone. La fiche des Maturités d’une parcelle rentrée porte « Voir sa récolte ».

### 382d. Les décisions
- **Aucun calcul neuf** : les deux écrans (Récoltes, Le millésime) affichent les mêmes chiffres parce qu’ils lisent la même fonction.
- **« Encore sur pied » reste la carte d’avant**, sous le rendement. La maquette mêlait les parcelles sur pied à la liste des rendements ; garder la carte gardait SANSREC-1 et ses deux harnais — à revoir avec Nico s’il tient à la liste unique.
- **Partis** : le bandeau de campagne, « Apports par parcelle », la liste « Détail des récoltes », le bloc pluriannuel. Leur contenu vit dans les chiffres, les barres, le journal (une pesée s’ouvre par sa fiche, puis « Modifier ») et l’historique de la fiche.

### 382e. Trouvé en route
- **Retirer un rendu laisse ses aides orphelines** : `_apportsRangs` et `_apportsPied` vivaient dans cave.js, exposées pour le seul `_vendApportsSvg` ; le préflight les a vues. `_recDests`, que seul l’ancien rendu appelait, a un harnais (vendange-parts) : il est rebranché (`_recDestsTxt`) plutôt que retiré.
- **La marge de cuvier.js** : 568 → 580 ko (+2 %), sous les 5 % — l’ancien code retiré a payé la moitié du nouveau.
- **KIT-4 (§229) compte les formateurs de surface** : une surface s’écrit par `window._mvHaP` (une parcelle, au centiare) ou `window._mvHaT` (un total, au centième), et le harnais tient le compte exact par fichier. Le bloc pluriannuel parti emportait le seul `_mvHaT` de cuvier.js ; les chiffres des Récoltes en portent trois, la fiche un `_mvHaP` : le compte passe de 1 à 4, dit dans le harnais. Le premier passage de la chaîne l’a vu (`mv-harnais-kit4` et sa contre-épreuve). ⚠️ Les surfaces des Maturités (MATU-1) s’écrivent encore par `_mvF1(…) + ' ha'` : à passer aux formateurs au prochain lot du Cuvier.

## 383. ★★ CUVES-1 — UNE CUVE S’OUVRE EN FICHE : À DROITE SUR ORDINATEUR, DANS SA FENÊTRE AU TÉLÉPHONE (20/10 — `src/cuvier.js` (`renderVendCuves` réécrit, `_vendTeteHtml`, `_vendChiffresHtml`, `_vendRempHtml`, `_vendFicheHtml`, `_vendBascOuv`, `_vendLigneHtml`, `_vendCorpsHtml` ; parti : `_vendRemplirSvg`) · `src/cave.js` (`_apTronc`, `_remplirPied` retirés) · `src/styles.css` (bloc CUVES-1) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `index.html` (`ovCuveFiche`) · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-cuves1.mjs` (neuf) · `scripts/mv-harnais-cave2.mjs` · `scripts/mv-harnais-gf.mjs` · `scripts/mv-harnais-liste.mjs` · `.mv-base` · `lots/CUVES-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.44 → 9.45, SW 10.23 → 10.24**, base `2c8d73f`)

### 383a. La demande
Troisième onglet du rangement du Cuvier, sur la maquette du 19/10. La question laissée ouverte en août — une cuve s’ouvre-t-elle sur place dans la liste, ou en fiche ? — Nico la tranche le 20/10 : « comme dans la maquette », en fiche.

### 383b. Ce qui a été lu avant d’écrire
- **Le détail d’une cuve est le cœur de la vinification** : `_vendDetailHtml` porte la frise (PARC-1), la courbe, le labo (GF-1, LABO-1), les relevés et les opérations corrigeables, la fusion, le pressurage (CUV-13), la FML, et tous les boutons. Trois harnais au moins l’exécutent (GF, CUV-13, fusion).
- **La liste a déjà ce que la maquette demande** : les filtres, le tri, la recherche, le plan de cuverie en vignettes (`_vendCellHtml`, chaque cuve à son niveau) — la « vue Remplissage » de la maquette.
- **CAVE-2 et GF lisent l’ancien comportement** : le texte du bouton flottant « + Nouvelle cuve », et le détail lu dans l’écran après l’ouverture d’une cuve.

### 383c. Ce qui est livré
- **La fiche** : `_vendBascOuv` ouvre ou referme la cuve ; sa fiche (`_vendFicheHtml`) est un en-tête — le nom, « Cuve X », l’étape, la matière et la contenance, la couleur, la croix — puis, pour une cuve à relever, un encadré « Pas de relevé depuis N jours » avec « Noter un relevé », puis `_vendDetailHtml` entier. À droite sur ordinateur, collante ; dans `ovCuveFiche` au téléphone, ses courbes peintes une fois la fenêtre remplie ; sans fenêtre, dans l’écran.
- **La tête** commune aux trois onglets : la vendange choisie (une vendange passée : « Les cuves de 2025 sont décuvées », renvoi au Chai), « Fusionner » (dès deux cuves en cours), « Nouvelle cuve ».
- **Quatre chiffres** : en fermentation (et combien en macération à froid), à relever (nommées), en cuve sur la contenance de la cuverie (avec la jauge), en attente d’encuvage.
- **Sur ordinateur, le plan de cuverie à droite** tant qu’aucune cuve n’est ouverte ; au téléphone, la bascule Liste / Plan reste dans les outils.
- Gardés : le bandeau « à mesurer » (il ouvre la fiche), la recherche, les filtres, le tri, les sections fusionnées et décuvées.

### 383d. Les décisions
- **Le cadre change, pas le contenu** : le détail d’avant devient le corps de la fiche, dans son ordre. La maquette rangeait autrement (chiffres, frise, courbe, relevés, opérations, boutons) ; réordonner `_vendDetailHtml` aurait touché ce que lisent GF, CUV-13 et fusion pour un gain de mise en page.
- **Parti : le graphique « Remplissage des cuves · parcelle par parcelle »**, replié depuis longtemps et doublé par le plan. Ses deux aides de cave.js partent avec lui.
- **Aucun geste neuf** : la fiche se ferme par `_vendBascOuv`, la tête rappelle `openVendFusion` et `openOvVendCuve`, la vendange `_matSetAn`. Le plafond des tutos ne bouge pas.

### 383e. Trouvé en route
- **Deux harnais décrivaient l’ancien geste, pas une règle** : CAVE-2 cherchait le texte du bouton flottant, GF le détail dans l’écran. Adaptés à l’intention (le bouton de la tête ; la fiche dans sa fenêtre au téléphone), leurs contre-épreuves vertes. Leçon : un harnais qui lit la place d’un contenu (« dans mvv-body ») vieillit quand le contenu change de cadre ; lire le contenu là où il est rendu.
- **Les noms en `_cuv` sont au Chai** (`mv-harnais-cuvier`, D2) : les quatre fonctions neuves, d’abord nommées `_cuvTeteHtml`, `_cuvChiffresHtml`, `_cuvRempHtml`, `_cuvFicheHtml`, ont rougi le premier passage de la chaîne ; elles s’appellent `_vendTeteHtml`, `_vendChiffresHtml`, `_vendRempHtml`, `_vendFicheHtml`. Au Cuvier, une fonction commence par `_vend` (ou `_mat`, `_rec` pour ses onglets) ; les classes CSS `cuv-` ne sont pas concernées.
- **Le bac à sable du harnais GF crée tout élément demandé** : c’est la fenêtre qui y reçoit la fiche. Le repli « sans fenêtre, dans l’écran » sert à un index.html ancien encore en cache, le temps du rechargement.

## 384. ★ TOURCUV-1 — LA TOURNÉE DU CUVIER À LA MÊME ENSEIGNE (20/10 — `src/cuvier.js` (`_vtBandeauHtml`, `renderVendTour`, `_vtCss`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-tourcuv1.mjs` (neuf) · `scripts/mv-harnais-cuv7.mjs` · `scripts/mv-harnais-liste.mjs` · `.mv-base` · `lots/TOURCUV-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.45 → 9.46, SW 10.24 → 10.25**, base `3ba6914`)

### 384a. La demande
Le quatrième onglet du rangement du Cuvier, sur la maquette du 19/10 : la Tournée.

### 384b. Ce qui a été lu avant d’écrire
La Tournée faisait déjà tout ce que la maquette demande : la progression, les trois filtres, une carte par cuve avec la température et la densité côte à côte et l’écart au relevé d’avant, les compteurs P et R (l’appui long retire), l’écriture au fil de la frappe (CUV-7, CUV-11), « Terminer la tournée » et son bilan, l’intervention groupée. Ce qui différait : l’habit — un bandeau sombre collé en haut (`--cave`), des boutons faits main, un « + » flottant sans mot.

### 384c. Ce qui est livré
- **La tête claire des autres onglets** : « Tournée du mardi 8 septembre » et « Les cuves en macération et en fermentation » sur ordinateur ; « Tournée du jour » et la date au téléphone ; « Qui ? » en bouton du jeu.
- **Une carte collée en haut** (`mvcarte vt-hd`) : la progression (ses identifiants `vt-pf`, `vt-pn`, `vt-pt` restent, `_vtMaj` les remplit), les filtres en options du jeu (un seul choisi, `aria-pressed`), la légende P / R.
- **En bas** : « Terminer la tournée » en bouton principal, son compte dedans ; « Intervention groupée » écrit, en bouton secondaire, à la place du « + ».
- **Le style** : `_vtCss` perd ses boutons faits main et les couleurs du bandeau ; les cartes des cuves et leurs champs ne bougent pas.

### 384d. Les décisions
- **L’habit seulement** : la saisie, ses compteurs, son écriture et son bilan sont couverts par CUV-7 et CUV-11 ; rien de ce qu’ils jouent n’a changé, sauf la date de la tête (`_vendDateLongue`, ajoutée à la liste de CUV-7).
- **Pas de choix de vendange dans la Tournée** : elle ne concerne que les cuves en cours (la maquette ne la montrait pas non plus).

## 385. ★ MINAOC-1 — LE MINIMUM DE MATURITÉ DE L’APPELLATION (20/10 — `src/reglages.js` (`window._aocSetMin`, `_aocPlafondsHtml`) · `src/cuvier.js` (`_matSynth`, `_matMin`, `_matOrdreHtml`, `_matFicheHtml`, `_matMinRp`) · `src/styles.css` (bloc MINAOC-1) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `guide/12-reglages.html` · `public/guide.html` · `scripts/mv-harnais-minaoc1.mjs` (neuf) · `scripts/mv-harnais-matu1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `.mv-base` · `lots/MINAOC-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.46 → 9.47, SW 10.25 → 10.26**, base `8b91a05`)

### 385a. La demande
Le trait rouge de la maquette des Maturités (19/10) : le minimum de l’appellation, reporté de MATU-1 (§366d) parce qu’il se règle avec l’appellation. Ce que dit la réglementation (vérifié pendant la maquette) : Gevrey-Chambertin, richesse minimale 180 g/L en rouge, 189 g/L en premier cru (décret et cahier des charges INAO) ; aucune borne haute réglementaire pour le raisin.

### 385b. Ce qui est livré
- **La donnée** : `sucre_min: { r, b }`, en g/L, sur l’appellation (`CONFIG.appellations`, enregistrée avec la configuration comme le plafond).
- **Le réglage** : Réglages › Appellations & plafonds, « ··· » de l’appellation, « Minimum des rouges » et « Minimum des blancs » (`window._aocSetMin` : la fenêtre de saisie commune, 100 à 300 g/L, à vide la retire, réservé à l’administrateur). La ligne de l’appellation écrit son minimum. Rien n’est posé d’office : un minimum se lit dans l’arrêté.
- **Les Maturités** : un trait rouge sur chaque parcelle rattachée à une appellation qui a un minimum pour sa couleur (l’échelle s’ouvre pour le contenir), la légende, la phrase du haut (« N parcelles sous le minimum de leur appellation »), et dans la fiche la ligne « Minimum · <appellation> » des repères : « atteint le 05/09 », ou ce qu’il manque.

### 385c. Trouvé en route
- **L’appellation d’une parcelle était lue sur son nom.** `_matSynth` appelait `_vendAocDe(nom)` ; la fonction lit le champ `appellation` d’une parcelle. Depuis MATU-1, `e.aoc` était donc toujours vide et l’étiquette d’appellation de la fiche ne sortait jamais. La contre-épreuve du harnais réinjecte l’erreur.
- **Une contre-épreuve qui ne rougit pas dit souvent que le décor est trop pauvre** : « compter à l’envers » donnait le même nombre (une parcelle de chaque côté). Une parcelle de plus au-dessus du minimum, et la contre-épreuve a mordu.

### 385d. Ce qui reste ouvert
- Le chemin vers le réglage passe par « ··· » ; la maquette le mettait dans la roue crantée de la Cave (section Appellations) : il y viendra avec le lot de la roue crantée.
- Le premier cru (189 g/L à Gevrey) suppose une appellation « premier cru » déclarée à part : c’est déjà ainsi que le plafond se règle.

## 386. ★ CAVEREG-1 — LA ROUE CRANTÉE DE LA CAVE EN QUATRE SECTIONS (20/10 — `index.html` (`#cave-reg-body`) · `src/cave.js` (`_caveRegSec`, `renderCaveReglagesCave`) · `src/reglages.js` (`_aocResumeHtml`) · `src/styles.css` (bloc CAVEREG-1) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-cavereg1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `.mv-base` · `lots/CAVEREG-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.47 → 9.48, SW 10.26 → 10.27**, base `c093715`)

### 386a. La demande
La page « Réglages et documents de la cave » de la maquette du 19/10 : quatre sections (Le Cuvier, Le Chai, Appellations, Documents), une navigation à gauche sur ordinateur et en haut au téléphone, une ligne par réglage, le minimum de chaque appellation.

### 386b. Ce qui a été lu avant d’écrire
La page existait déjà en quatre blocs empilés (CAVE-2, AOC-1, PARC-XLS-2) : `cave-reg-cuvier` (les réglages du Cuvier, `renderVendParam`), `mvc-body-reglages` (le Chai, `renderCaveReglages`), `cave-reg-mil` (« Le Millésime » : les deux lignes des appellations), `cave-reg-docs` (les documents, déjà en lignes, `docsGo`). Les réglages du Cuvier et du Chai sont des champs (le poids d’une caisse, le rendement jus, la base, le sucre par degré, l’alerte d’ouillage en compteur) et non des lignes qui ouvrent une fenêtre — la plupart de ces fenêtres n’existent pas.

### 386c. Ce qui est livré
- **La navigation** : quatre options du jeu (`mvbtn-choix`, `role="tab"`, `data-creg`), en haut au téléphone, en colonne collante à gauche à partir de 1 024 px ; une section à la fois (`hidden`). `_caveRegSec` bascule ; la section choisie reste choisie d’une ouverture à l’autre de la page.
- **« Appellations »** (l’ancien « Le Millésime ») : les deux lignes d’avant (Appellations & plafonds, Rattachement), puis une ligne par appellation — son maximum du millésime et son minimum de maturité, « Rouges » et « Blancs » pour poser les minimums (`_aocSetMin`, MINAOC-1). C’est le chemin que la maquette donnait au minimum ; « ··· » de la fenêtre des plafonds reste.
- **Les quatre hôtes gardent leur nom** : leurs rendus et leurs harnais (CAVE-2, réglages, AOC-CAVE, MINAOC-1) ne bougent pas.

### 386d. Ce qui n’est pas fait, et pourquoi
- **Les lignes « libellé · valeur · Modifier » pour le Cuvier et le Chai.** La maquette annonçait des fenêtres « inchangées » ; elles n’existent pas pour le poids d’une caisse, le rendement jus, la base du rendement, le sucre par degré, l’alerte d’ouillage (des champs et un compteur dans la page). Les écrire est un lot à part, à décider avec Nico.
- **Le badge « nouveau » des fourchettes** : avec les lignes.

### 386e. Trouvé en route
- **`mv-harnais-regl-module` (NAV-1) comptait les « Le Millésime » d’index.html** : deux, l’onglet de la Cave et le bloc de la roue crantée. Le bloc s’appelle « Appellations » : le compte passe à un, l’intention (la majuscule, comme « Le Cuvier ») reste vérifiée.
