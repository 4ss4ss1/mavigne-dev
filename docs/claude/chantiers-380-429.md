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

## 387. ★ CAVEREG-2 — UNE LIGNE PAR RÉGLAGE, CHACUN SA FENÊTRE (20/10 — `src/cuvier.js` (`renderVendParam` réécrit, `_vendReg*` ; partis : `_vendSaveParam`, `_matRegLire`, `_matRegHtml`, `_matRegLigne`) · `src/cave.js` (`renderCaveReglages` réécrit, `_cregLigne`, `_cregGroupe`, `_caveOuilHtml`, `_caveRegOuil`, `_caveSeuilStep`) · `src/styles.css` (bloc CAVEREG-2) · `src/utils.js` · `index.html` (`ovCregEdit`) · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-cavereg2.mjs` (neuf) · `scripts/mv-harnais-matu1.mjs` · `scripts/mv-harnais-liste.mjs` · `.mv-base` · `lots/CAVEREG-2.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.48 → 9.49, SW 10.27 → 10.28**, base `c093715`, avec CAVEREG-1)

### 387a. La demande
Le reste de la maquette de la roue crantée (§386d) : les réglages du Cuvier et du Chai en lignes « libellé · ce qu’il sert · valeur · Modifier », chacun sa fenêtre, et le badge « nouveau » des fourchettes. Nico (20/10) : « suite ».

### 387b. Ce qui est livré
- **Le Cuvier** : Maturité (Fourchette des rouges, Fourchette des blancs — badge « nouveau » —, Sucre pour un degré), Pesée et rendement (Poids d’une caisse, Corriger un poids déjà saisi, Rendement jus, Base du rendement), Vente de raisin (Clients vrac, Livraisons et bons). « Modifier » pour l’administrateur ; les portes d’avant (corriger un poids, gérer les clients, livraisons et bons) restent, avec leurs droits.
- **Un nombre seul** (le poids d’une caisse, le sucre pour un degré) : la fenêtre de saisie commune ; les bornes d’avant (10 à 60 kg, 15 à 20 g/L, au centième), ramenées et dites.
- **La fourchette** (`ovCregEdit`) : en sucre ou en degré (× le sucre pour un degré), la conversion écrite en direct, deux bornes ou aucune (« Vider »), remises dans l’ordre, 120 à 300 g/L, un haut égal au bas refusé — l’erreur reste dans la fenêtre. Enregistrer une couleur garde l’autre.
- **Le rendement jus** : deux bornes, 80 à 200 kg/hL, remises dans l’ordre et dites, l’aperçu (« 100 caisses de 25 kg font… ») en direct. **La base** : deux choix, enregistrés par `_vendSetRdtBase`, la fenêtre se ferme.
- **Le Chai** : Élevage (Alerte d’ouillage — la ligne dit les millésimes qui ont leur seuil ; « Modifier » ouvre les compteurs d’avant dans `ovCregEdit`, que `renderCaveReglages` réécrit à chaque geste — ; Contenance d’un fût, par sa fenêtre d’avant), le parc à cuves tel quel, Outils (le convertisseur SO₂).

### 387c. Les décisions
- **Chaque réglage s’enregistre seul** : « Enregistrer les paramètres » enregistrait les quatre chiffres et la fourchette d’un coup ; une ligne qui ouvre une fenêtre enregistre la sienne. Les règles (bornes, ordre, deux bornes ou aucune) sont reprises mot pour mot.
- **Le réglage de la fourchette quitte le harnais des Maturités** pour `mv-harnais-cavereg2` : son code a quitté le leur.

### 387d. Trouvé en route
- **L’inventaire des tutos ne voit pas un geste passé par une variable** (`onclick="'+geste+'"`) : les sept gestes neufs (`_vendReg`, sa fenêtre, `_caveRegOuil`) n’ont pas fait monter le compte. Ce n’est pas une couverture : à corriger dans l’inventaire, ou à écrire en clair.
- **VD-GARDE** : `_vendRegNombre` écrivait la configuration sans garde de rôle (la garde était dans `_vendReg`, qui l’appelle) ; `mv-harnais-vendange-garde` veut la garde dans chaque écrivain. Posée.
- **Une injection de contre-épreuve vise la PREMIÈRE occurrence** : celle de TOURCUV-1 (« le filtre choisi ne se voit plus ») tombait désormais sur le bouton d’unité de la fenêtre des réglages, écrit à l’identique. Elle vise maintenant le bouton de la Tournée (`onclick="_vtFilt(`).
- **Une contre-épreuve qui fait planter le harnais ne rougit pas proprement** : « enregistrer une couleur efface l’autre » rendait la fourchette des rouges nulle et la vérification lisait `.r.min` — `TypeError`. Lire `(… || {}).min`.

### 387f. CAVEREG-2B — la base recalée (20/10)
- **Ce qui s’est passé** : le zip de CAVEREG-2 a été construit sur `c093715` en portant CAVEREG-1, que Nico n’avait pas encore poussé. Entre-temps, CAVEREG-1 a été poussé seul (`df68385`), puis le zip collé par-dessus et commité (`b15a481`). Au build, `mv-base` a rougi : « le lot déclare la base c093715, mais il a été commité sur df68385 ».
- **Ce qui a été vérifié** : les dix-huit fichiers de `df68385` sont identiques, octet pour octet, à ceux du zip de CAVEREG-1 ; CAVEREG-2 a été bâti exactement sur cet état. Coller CAVEREG-2 n’a donc rien effacé de CAVEREG-1. (La fusion à trois voies, `git merge-file`, crie au conflit sur les lignes que les deux lots changent — les versions, la tête des nouveautés, les consolidations : ce sont les changements voulus de CAVEREG-2, pas des pertes.)
- **Ce que livre CAVEREG-2B** : `.mv-base` sur `b15a481`, ce paragraphe, la consolidation corrigée, sa marque. Aucun fichier de l’appli.
- **La leçon** : un zip qui porte un lot non poussé doit le dire en tête de la note (« à appliquer À LA PLACE de … ») ; si le lot porté est poussé entre-temps, redemander un rejeu sur le nouveau commit plutôt que coller. La garde a fait son travail : elle a arrêté le build avant le déploiement.

## 388. ★ TUTO-8 — UN TUTO POUR LES MATURITÉS (20/10 — `src/tutos.js` (le tuto `maturites`, `_tuJour`, `_tuCave`, `_charger`) · `src/cuvier.js` (cinq étiquettes `data-tuto`) · `index.html` (`cave.cuvier`, versions) · `src/utils.js` · `public/sw.js` · `scripts/tutos-couverture.json` · `scripts/mv-harnais-tuto8.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `.mv-base` · `lots/TUTO-8.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.49 → 9.50, SW 10.28 → 10.29**, base `32c0b5b`)

### 388a. La demande
Le plafond des gestes sans tuto est monté de 813 à 825 pendant le rangement du Cuvier et de la roue crantée (MATU-1 à CAVEREG-2). Nico (20/10) : « suite tuto ».

### 388b. Ce qui est livré
- **Le tuto** `maturites` (TU_TUTOS, tutos.js), pour l’administrateur, sept étapes : aller à la Cave ; « Le Cuvier » ; l’onglet « Maturités » ; « Noter des mesures » (la feuille s’ouvre) ; taper le sucre du premier champ (120 à 290 g/L, l’exemple 214) ; « Enregistrer » (la feuille se ferme, une mesure de plus) ; regarder l’ordre de maturité. Les consignes lisent les vrais libellés à l’écran (`L(…)`) et le nom de la parcelle du premier champ.
- **Les étiquettes** : `cave.cuvier` (index.html), `cuv.maturites`, `mat.noter`, `mat.champ` (le premier champ de la feuille seulement), `mat.ok`, `mat.ordre` (cuvier.js).
- **Une vendange pour le domaine fictif** : `_tuCave` (cinq mesures sur trois parcelles du domaine de la démo, les fourchettes réglées), chargée par `_charger` avec `applyFbData('cave_vendange', …)`. Les dates sont calculées au chargement (`_tuJour`, de six jours à hier).
- **Le compte** : 820 gestes sans tuto (plafond abaissé), 10 couverts.

### 388c. Comment il a été vérifié
- `npm run test:tutos` (mv-tutos-jeu.mjs) dans le bac à sable, Chromium par `MV_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, sur un build fait SANS la chaîne (`node scripts/mv-gt-page.mjs && npx vite build && node scripts/inject-precache.mjs && node scripts/mv-version-json.mjs` — `npm run build` rejoue d’abord tout `npm run check`) : les trois tutos vont au bout au téléphone, sur ordinateur, dans le panneau et au miroir ; le boot.js d’une version précédente est refusé. Celui des maturités : 7/7 étapes, 17 appels retenus par la porte, rien envoyé.
- `mv-harnais-tuto8` : ce que le rejeu ne dit pas — les étiquettes à leur place, ce que le tuto couvre, des dates jamais en dur, le plafond.

### 388d. Ce qui reste ouvert
- Les prochains tutos qui feraient le plus baisser le compte : peser une récolte (`openOvVendRec` et sa fenêtre), ouvrir une cuve en fiche (`_vendBascOuv`), la tournée du Cuvier, la roue crantée (`_caveRegSec`).
- L’inventaire ne voit pas les gestes passés par une variable (§387d) : les fenêtres des réglages ne sont ni comptées ni couvrables tant qu’il ne les lit pas.

## 389. REVUE-1 — LA REVUE À L’ÉCRAN DE CE QUI A CHANGÉ DE DESSIN (20/10 — `scripts/mv-captures.mjs` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/harnais-claude-md.mjs` · **APP 9.50 → 9.51, SW 10.29 → 10.30**, base `f1aa11d`)

### 389a. La demande
Après CHARTE-5c, Nico demande une recommandation en sachant que « l’appli doit être parfaite et professionnelle ». Réponse : d’abord regarder en vrai tout ce qui a changé de dessin (une bonne centaine d’éléments passés au jeu n’avaient jamais été vus à l’écran — les contrôles vérifient le code, pas le rendu), puis finir les 168 encadrés, puis les cases de saisie. Nico : « relis les fichiers et go pour l’étape 1 ».

### 389b. Ce qui est livré
- **Sept écrans de plus dans `mv-captures`** : `accueil-ouvrier` (la démo réduite au rôle ouvrier), `ma-trace` (« Ma trace » de l’ouvrier, `openMaTrace`), `phyto-traitement`, `cave-cuvee` (la première carte du Chai, `.mvc-cuv[data-cuv]`), `tracteur-entretien`, `reglages-documents` (`openDocs`), `mot-de-passe-erreur` (la fenêtre ouverte, l’erreur posée par l’outil : un état mis en scène, pour voir l’encadré).
- **Les rôles remis à chaque écran** : la démo entre avec trois rôles (admin, ouvrier, tractoriste) ; un écran « ouvrier » les réduisait et l’outil gardait la page d’un écran à l’autre — les écrans suivants sortaient « Réservé à l’administrateur ». L’outil relève les rôles de départ et les remet avant chaque écran.
- **Corrigé** : le sélecteur de cuvées de l’export (Cave) marque la cuvée choisie par la classe `.sel`, pas `.on` ; au §377 seul `.on` a rejoint l’état choisi du filtre, la cuvée choisie ne s’y distinguait plus. `.cave-cuvee-chip.sel` rejoint l’état choisi.

### 389c. Vu en vrai (téléphone et ordinateur, clair et sombre)
- **« Ma trace » de l’ouvrier** : les cartes du jeu (fond, filet fin, arrondi 8 px, sans ombre) sous le bandeau du total — justes dans les deux thèmes (CHARTE-5a, `.mtr-card`).
- **La fiche d’une cuvée** : « FML ✓ » au statut « fait » (CHARTE-4a/4c).
- **Les documents des Réglages** : l’encadré « Ce que vous devez pouvoir sortir en contrôle » au ton danger, « Fichier obligatoire au 01/01 » à surveiller, les types d’export (PDF rouge, Excel / CSV vert) et « Choix de la période » neutre (CHARTE-4c, 5b) — lisibles en clair et en sombre.
- **Le mot de passe en erreur** : l’encadré danger, texte à l’encre (CHARTE-5c).
- **L’Entretien du Tracteur** : intact (la barre à choix des machines, les chiffres de la révision, les derniers contrôles).

### 389d. Pas encore vu, et à trancher
- **Pas vu** : la saisie d’un traitement (toucher une ligne du registre ne l’ouvre pas ; il faut trouver le bon geste), la fiche d’un produit (DAR, ZNT), le mur de l’équipe, les demandes d’un salarié au Planning, Pilotage › Décider avec des tâches, une session chronométrée, la Discussion avec un message non lu — la démo ne les porte pas ou l’outil ne sait pas encore les ouvrir.
- **À trancher avec Nico** : l’encadré des documents est rouge parce qu’il l’était — c’est une obligation, pas un danger : « attention » (ambre) serait plus juste ? Au téléphone, les cartes de « Ma trace » semblent toucher les bords de la fenêtre : à regarder chez lui.
- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 389e. La leçon
**Un outil qui garde l’état d’un écran à l’autre fausse les suivants.** Le rôle ouvrier d’un écran faisait mentir les cinq d’après — et sans les regarder, rien ne l’aurait dit. Chaque écran d’une revue repart du même point.

## 390. REVUE-2 — LA REVUE À L’ÉCRAN, DEUXIÈME PASSAGE (20/10 — `src/styles.css` · `src/reglages.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-captures.mjs` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-harnais-pastilles.mjs` · `scripts/mv-harnais-cartes.mjs` · `scripts/mv-jetons-baseline.json` · `scripts/mv-espace-baseline.json` · **APP 9.51 → 9.52, SW 10.30 → 10.31**, base `b367a89`)

### 390a. La demande
Après REVUE-1 (§389), Nico : « oui » — continuer l’étape 1 (voir les écrans restants) et passer en ambre l’encadré « Obligatoire » des documents, « une obligation, pas un danger ». Entre-temps, sa chaîne avait rougi une fois sur le preflight (12 commandes à la fois) ; seul, le preflight passait chez lui (0 erreur), et la chaîne relancée était verte.

### 390b. Ce qui a été vu, et corrigé
- **`mv-captures`** ouvre deux écrans de plus : `phyto-saisie` (`openTraitEdit(0)`, la saisie d’un traitement) et `mur` (`openMur`).
- **Le mur et « Ma trace » au ras de la fenêtre** : leurs cartes sont posées directement dans `.modal`, qui n’a pas de marge de côté (ses autres contenus portent la leur) ; au téléphone, cartes, bandeau et libellés touchaient les bords de l’écran — déjà avant la charte, plus visible depuis que les cartes n’ont plus d’ombre. `#mur-body, #mtr-body` reçoivent une marge de côté au pas de l’échelle (`--e-4`). Revu : cartes et bandeau encadrés, libellés alignés, en clair, en sombre et sur ordinateur.
- **Le mur, resté vert** : « Enregistrer le mot » (`.mur-btn`, vert plein) passe au bouton principal du jeu, sa variante discrète (`.mur-btn.q`) au secondaire ; le choix « toute l’équipe / l’administrateur seul » (`.mur-seg`, le choisi en vert pâle) passe au filtre, le choisi à la couleur d’action. Leurs règles d’avant retirées ; `mv-harnais-boutons` et `mv-harnais-pastilles` les surveillent ; plafond des boutons « maison » 72 → 71.
- **L’encadré d’introduction des documents** : ses couleurs étaient calculées par le code avec une bordure de côté (rouge, or, acier selon la famille) — il n’avait pas été rangé au §380. Il devient `.mvencadre` + une classe : « Obligatoire » → **attention** (ambre, tranché par Nico), « Suivi du domaine » → informer, « Données brutes » → neutre. Plafond des encadrés faits à la main 168 → 167. La pastille « Fichier obligatoire au 01/01 », ambre dans un encadré ambre, reste lisible mais discrète : à regarder.
- Cliquets regravés à la baisse : rayons en dur 227 → 226, graisses hors pas 147 → 145, filet perdant 73 → 71, espacements hors échelle 991 → 990 ; plancher des cercles 107 → 110.

### 390c. Vu sans défaut
La saisie d’un traitement s’ouvre (date, conducteur, dose, stade, heures, délai de rentrée anticipé, mode) : les champs sont à l’unisson ; l’encadré « conforme / dépassement » n’apparaît qu’une fois une dose comparée à celle du produit — pas vu.

### 390d. Le preflight rouge une fois
Chez Nico, chaîne à 12 commandes à la fois : le preflight a rendu le code 1, puis est passé seul (0 erreur, 13 avertissements) et à la relance de toute la chaîne. Vérifié ici : il passe sur le dépôt et sur une copie aux fins de ligne Windows ; aucun contrôle qui tourne avec lui n’écrit dans `src/` ou `scripts/` (ceux qui le font sont dans `SEULS`, joués d’abord, seuls ; les longues contre-épreuves écrivent dans le dossier temporaire du système). Piste la plus probable : il lance environ 450 `node --check`, et un lancement refusé sous la charge est compté comme une faute de syntaxe. Pas reproduit : noté, sans correction. S’il revient, le jouer seul ou lui faire retenter une vérification qui n’a pas pu se lancer.

### 390e. Pas encore vu
Pilotage › Décider avec des tâches, une session chronométrée, la Discussion avec un message non lu, les demandes d’un salarié au Planning, la fiche d’un produit phyto, l’encadré « conforme / dépassement » : il faut que la démo porte ces situations (ou que l’outil les pose), c’est la suite de l’étape 1.

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 390f. La leçon
**Une carte sans ombre montre où elle est posée.** Avec l’ombre, une carte collée au bord de la fenêtre passait pour un choix ; sans elle, le filet qui touche l’écran se voit. Changer le dessin d’une pièce rend visibles des défauts de mise en page qui dormaient — c’est pour cela qu’on regarde.

## 391. ⚠️ CHARGE-1 — LE LANCEUR NE FAIT PLUS PARTIR LES LOURDES ENSEMBLE (20/10 — `scripts/mv-lanceur.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-lanceur.mjs` · doc · **pas de bump** : aucun fichier de l’appli, base `1cf3c05`)

### 391a. Ce que Nico a vu
Après REVUE-2 (§390), sa chaîne à **12 commandes à la fois** : 34 commandes jouées sur 469, **4 rouges** — `lint-cliquet` (code 2), `preflight` (code 1), `mv-harnais-pic-avenir --contre` (**code 134** : Node arrêté net, le plus souvent faute de mémoire), `mv-harnais-icones-contre` (code 1). Relancée avec `MV_JOBS=4` : **0 rouge**. Le preflight avait déjà rougi une fois de la même façon (§390d).

### 391b. La cause
Le lanceur (BUILD-1, §305) joue les commandes autant à la fois que le processeur a de cœurs (12 sur le PC de Nico), **les plus longues d’abord** — un bon ordre pour finir tôt, mais les plus longues sont aussi les plus lourdes : `recup --contre`, le preflight, la contre-épreuve des icônes, les robustesses, ESLint partaient ensemble, et la mémoire du PC n’a pas suivi. Rien dans le code de l’appli ni dans REVUE-2.

### 391c. Ce qui est livré
- **Au plus 6 commandes à la fois par défaut** (`JOBS_MAX`), même sur 12 cœurs ; `MV_JOBS=N` garde la main.
- **Au plus 2 commandes lourdes en même temps** (`MV_LOURDS`, `LOURDS_PAR_DEFAUT`). Une commande est lourde si elle est déclarée dans **`LOURDS`** (`mv-harnais-liste.mjs` : sept commandes, chacune avec sa raison mesurée chez Nico) **ou** si elle a duré plus d’une minute au build d’avant (`SEUIL_LOURD`) — une lourde de demain est prise d’office. Une lourde qui n’a pas de place laisse passer les légères derrière elle ; un ouvrier sans rien à prendre attend qu’une lourde finisse. L’ordre « les plus longues d’abord » et les sorties dans l’ordre de la liste sont gardés ; le lanceur annonce combien de lourdes il a et combien en même temps.
- **`mv-harnais-lanceur`** le prouve en simulation (le moteur joué sur un faux exécutant) : jamais plus de 2 lourdes et 2 atteint ; les légères passent pendant ce temps ; tout est joué, l’écran dans l’ordre ; sans limite, elles partent ensemble ; le plafond par défaut est 6 ; chaque lourde est une commande de la liste, avec sa raison. Trois contre-épreuves de plus (la limite des lourdes retirée, le plafond retiré, une lourde hors de la liste) : **14/14 détectées**.

### 391d. Mesuré
- **Chaîne** : jouée **en parallèle** ici, avec le nouvel ordonnanceur (`MV_JOBS=4` — le bac à sable n’a qu’un cœur, donc 1 à la fois par défaut — et 2 lourdes au plus, vues tourner ensemble : `recup --contre` et la contre-épreuve des icônes, avec deux légères à côté) : **469 commandes, 0 rouge**, 786 s, après le dernier changement de code.

### 391e. La leçon
**Le meilleur ordre pour le temps n’est pas le meilleur pour la mémoire.** Lancer les longues d’abord finissait plus tôt sur le papier ; sur un vrai PC, ça mettait les plus gourmandes côte à côte. Un ordonnanceur qui ne compte que les cœurs ignore ce qui manque en premier.

## 392. REVUE-3 — LA REVUE À L’ÉCRAN, TROISIÈME PASSAGE : DES SITUATIONS MISES EN PLACE PAR L’OUTIL (20/10 — `scripts/mv-captures.mjs` · `src/phyto.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · **APP 9.52 → 9.53, SW 10.31 → 10.32**, base `4f46429`)

### 392a. La demande
La suite de l’étape 1 (§389-§390) : voir les derniers écrans, en mettant en place les situations qui les font apparaître (une dose qui dépasse, la fiche d’un produit, des tâches à répartir, une session chronométrée, un message non lu, une demande d’un salarié), sans toucher à la démo des visiteurs.

### 392b. Ce qui a été trouvé
- **La démo n’a aucune parcelle** (« 0 parcelles · 0 ha » : l’état d’une installation, les contours étant posés par GUERETTECH). Tout ce qui dépend d’une parcelle y reste vide : la saisie d’un traitement s’arrête à l’étape des parcelles, Décider n’a rien à répartir, une session n’a rien à chronométrer.
- **`applyFbData` ignore toute donnée pendant la visite** (`_visiteScenarioReady` : « scénario figé »). L’outil lève ce gel le temps de poser ses données, puis le remet.
- **La fiche d’un produit** : le catalogue E-Phy se charge du réseau — hors ligne, l’outil ne voit que « Catalogue E-Phy en cours de chargement… ». Écran gardé (`phyto-produit`), à jouer en ligne.

### 392c. Ce qui est livré
- **`mv-captures` pose des données de revue** pour un écran : `phyto-cuivre` pose deux parcelles (« Les Grandes Vignes », « Champ Perdrix »), ouvre l’assistant, choisit la Bouillie bordelaise RSR, Paul, une date, toutes les parcelles, et va jusqu’au récapitulatif — le budget cuivre et son verdict « Conforme » apparaissent.
- **Vu et corrigé dans l’assistant** (tous faits à la main) : la carte du budget cuivre (fond et filet bleutés, titre `#1A4A7A`) → `.mvcarte`, titre à l’encre ; « Tout » (texte or) et « Aucune » → `.mvbtn .mvbtn-secondaire` ; l’information du registre (fond et filet bleus) → `.mvencadre-info`. Revu en clair et en sombre. Plafond des encadrés faits à la main 167 → 165.

### 392d. Reste
- **La carte récapitulative verte** de l’étape 3 (fond et filet verts) et **la barre des étapes** (vert, or, gris) : le jeu n’a pas de pièce « étapes » ; à décider avec les cases de saisie.
- **Décider avec des tâches, une session chronométrée, un message non lu, une demande d’un salarié** : chacun demande ses données de revue (priorités et équipe, une session et ses temps, un fil de discussion, une demande) — au même procédé, un par un.
- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 392e. La leçon
**Une démo vide cache des écrans entiers.** Sans parcelle, la moitié des fenêtres n’affiche que son état vide — et c’est la moitié qu’on n’avait jamais regardée. Une revue a besoin de ses propres données, posées par l’outil, pas de celles qu’on montre aux visiteurs.

## 393. REVUE-4 — LA REVUE À L’ÉCRAN, QUATRIÈME PASSAGE : UNE SESSION CHRONOMÉTRÉE, LA DEMANDE D’UN SALARIÉ (20/10 — `scripts/mv-captures.mjs` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · **APP 9.53 → 9.54, SW 10.32 → 10.33**, base `f5fa3a1`)

### 393a. La demande
La suite de l’étape 1 (§392) : préparer les données de revue des quatre derniers écrans — une session chronométrée, une demande d’un salarié, Décider avec des tâches, un message non lu.

### 393b. Ce qui est livré
- **`session-chrono`** : l’outil pose trois parcelles de revue, met le chrono en marche (`CONFIG.chrono_mode`), marque deux parcelles faites sur la première session de la démo (« Les Grandes Vignes » mesurée 42 min, « Champ Perdrix » à écart `haut` — chrono resté ouvert, 1h35 mesurées), ouvre la session et affiche les parcelles faites (`toggleSDShowDone`).
- **`planning-demande`** : Planning › Les gens, la fiche défilée jusqu’à « Paiement des heures sup » (`.pf-dem`).
- **Corrigé** : la pastille d’écart d’une parcelle de session (`.sdp-tag.ecart`) porte un second rang dans un `<small>` (la mesure sous le motif). Passée au jeu au §374 — une seule ligne insécable, en ligne —, son second rang venait à côté au lieu de dessous et écrasait le nom de la parcelle. Elle passe à la ligne (`flex-wrap`, le `<small>` sur toute la largeur), la moitié de la ligne au plus. Revu en clair et en sombre.

### 393c. Vu juste, et laissé
- **La demande d’heures sup** (PC, clair et sombre) : la carte au jeu, la case « Camille demande à être payée », les « − / + », « Figer octobre » au secondaire.
- **Laissé — dessiné écran par écran (TRAC-3, §284)** : les trois tuiles du chrono (« mesuré dans les parcelles », « hors parcelle », « pause déjeuner »), une couleur par sorte de temps — la règle du jeu (la couleur dit un type) — ; son encadré d’explication ; les lignes « faite » (vert) et « écart » (ambre) ; « Fin de journée » en bleu. À trancher avec Nico s’il veut les ramener au jeu.

### 393d. Reste
Pilotage › Décider avec des tâches (des priorités, une équipe et des heures au planning à poser) et un message non lu (un fil de discussion à poser) — les deux derniers écrans de l’étape 1.

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 393e. La leçon
**Une pièce commune ne connaît pas le contenu qu’on lui donne.** La pastille du jeu est faite pour un mot ; celle d’une session porte deux rangs. Ranger une classe sous une pièce, c’est vérifier qu’elle tient ce qu’on y met — et seule la donnée réelle (ou de revue) le montre.

## 394. CHRONO-1 — LE CHRONO AU DESSIN COMMUN (20/10 — `src/styles.css` · `src/tracteur.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-captures.mjs` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-jetons-baseline.json` · `scripts/mv-espace-baseline.json` · **APP 9.54 → 9.55, SW 10.33 → 10.34**, base `80e96bb`)

### 394a. La demande
Après REVUE-4 (§393), où le chrono avait été laissé tel quel (dessiné écran par écran, TRAC-3), Nico demande un conseil. Réponse : garder le sens des couleurs (une par sorte de temps), mais les prendre dans le jeu commun ; changer ce qui ne dit rien ; garder le grand bloc sombre du chrono en marche. Nico : « oui ».

### 394b. Ce qui est livré
- **La bande des trois temps** (`.chr-strip`, `.chr-st`) : trois tuiles teintées (acier, bleu, terre) → **un bloc de chiffres** du jeu — une carte, trois cases séparées par un filet. Une couleur par sorte de temps, prise dans la palette des types et portée par l’icône (`--chr-ton`) : **vert** (`--tag-green-tx`) dans les parcelles, **gris** hors parcelle, **ambre** la pause. Les deux bleus d’avant (acier, bleu) ne se distinguaient pas au soleil. Chiffres à l’encre, 24 px, chiffres droits.
- **L’explication** (« Ce chrono mesure le temps passé dans les parcelles… ») : fond or et filet → **encadré « informer »** ; son texte est enveloppé dans un `<span>` derrière l’icône (en flex, chaque morceau du texte serait devenu une case, §380). La ligne d’alerte des mesures écartées passe à `--attention-texte`.
- **« Pause déjeuner » et « Fin de journée »** (`.chr-act`, et `.chr-act-fin` en bleu sans raison) → **bouton secondaire** du jeu ; `mv-harnais-boutons` surveille `.chr-act`.
- **Les lignes d’une session** : faite (`--vert-pale`) → `--ok-doux`, le nom à `--ok-texte` ; écart au barème (`--or-pale`) → `--attention-doux` ; désactivée (`--rouge-pale`) → `--danger-doux`.
- **Gardé** : le grand bloc sombre du chrono en marche, son minuteur à 52 px — fait pour être lu d’un coup d’œil dans la vigne ; ses couleurs écrites en dur sont à passer en réglages de la charte, plus tard.
- `mv-captures` : `session-chrono-haut` (le haut de la session, sans défilement). Cliquets regravés à la baisse : rayons en dur 226 → 225, filet perdant 71 → 70, espacements hors échelle 990 → 982.

### 394c. Vu
`session-chrono` et `session-chrono-haut`, téléphone et ordinateur, clair et sombre : la carte des trois temps, l’encadré bleu, les deux boutons, les lignes faite et écart — justes. Les icônes colorées sont discrètes à cette taille : la sorte de temps se lit d’abord par son libellé et son icône.

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 394d. La leçon
**Une couleur qui distingue doit se distinguer.** Le chrono avait raison de colorer ses trois temps ; deux bleus voisins annulaient l’idée. La palette des types existe pour ça : des teintes faites pour ne pas se confondre.

## 395. ⚠️ CHAT-0 — LE MODULE DE DISCUSSION RETIRÉ (20/10 — `src/app.js` · `index.html` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-regl-module.mjs` · `scripts/mv-harnais-larg1.mjs` · `scripts/preflight.mjs` · `scripts/mv-harnais-pastilles.mjs` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-jetons-baseline.json` · `scripts/mv-espace-baseline.json` · **APP 9.55 → 9.56, SW 10.34 → 10.35**, base `9126d03`)

### 395a. La demande
La revue à l’écran (étape 1) a ouvert la page de la discussion (`goTo('chat')`, appelé directement par l’outil) : toujours sombre, même en mode clair, 38 couleurs écrites en dur. Vérifié ensuite : **aucun bouton ne l’ouvre** depuis la suppression de la barre de navigation (v4.28) — un commentaire d’`app.js` le disait (« #page-chat n’a AUCUN appelant ») ; ses utilisateurs ne la voyaient donc pas. Nico : un ancien module du tout début, « WhatsApp, les messages, les appels sont bien plus simples » — **retirer**.

### 395b. Une exception voulue à §51
§51 : on ne supprime pas du code inatteignable, on le rend honnête. Ici le retrait est **décidé par Nico** : le module n’a plus d’usage prévu, son API Firestore v8 ne marchait plus (le commentaire l’expliquait), et le garder obligeait à le restyler. L’exception est écrite ici, avec sa raison.

### 395c. Ce qui est retiré
- **`index.html`** : la page `#page-chat` (56 lignes : la barre des canaux, les fils privés, la zone de saisie).
- **`app.js`** : le bloc « MODULE CHAT » (19 noms de premier niveau : `_chatCanal`, `_chatDMTarget`, `_chatUnsub`, `_chatDMUnsub`, `CHAT_CANAUX`, `_chatHorsService`, `_chatDoc`, `_dmDoc`, `chatInit`, `chatLoad`, `chatUpdateTopbar`, `chatRenderMsgs`, `_chatEscapeHtml`, `chatSwitch`, `chatOpenDM`, `chatAutoResize`, `chatHandleKey`, `chatCheckNavDot`, `chatRender`, et `chatSend`), l’aiguillage `if(page==='chat')chatRender();`, les cinq exports `window.chat*`. Vérifié avant : aucun autre module n’appelle ces noms ; `index.html` ne les appelait que depuis la page retirée.
- **`styles.css`** : 43 règles du chat (`#page-chat`, `.chat-*`, `#chat-*`) et cinq sélecteurs du chat retirés de groupes mêlés (les champs de saisie, les fonds de fenêtres, l’ajout d’un membre, le compteur du jeu de pastilles). ⚠️ Première passe refaite : le découpage prenait les commentaires qui précèdent une règle pour une partie de sa liste de sélecteurs et en recollait les lignes ; la seconde masque les commentaires avant de lire (628 ouvertures, 628 fermetures).
- **Les messages déjà en base** ne sont pas touchés : seul le module quitte l’appli.

### 395d. Les contrôles ajustés
- `mv-harnais-regl-module` se servait de `id="page-chat"` comme borne dans `index.html` (trois vérifications d’ordre) : la borne devient `id="ovHubAide"`, qui suivait la page.
- `mv-harnais-larg1` : la page du chat était sa seule page exemptée de la règle de largeur ; la liste est vide, la contre-épreuve « une page exemptée entre dans la règle » n’a plus de sujet (retirée, commentée).
- `preflight` (C22) : l’exemption d’aide `chat` retirée. `mv-harnais-pastilles` : `chat-canal-badge` retiré de ses classes.
- **Vus par le premier passage de la chaîne (2 rouges, deux contre-épreuves)** : `mv-harnais-globaux --contre` réintroduisait le défaut du chat v8 dans `_chatDoc` (« motif introuvable — contre-épreuve inopérante ») → réécrite : elle ajoute une fonction d’essai qui lit une poignée Firestore nue `db` ; `mv-harnais-tutos --contre` (« un geste nouveau sans tuto → reste vert ») : les quatre gestes du chat partis, le compte était à 815 sous un plafond de 820 → plafond abaissé à 815 (`scripts/tutos-couverture.json`). Puis `mv-harnais-tuto8` (TUTO-8, §388) : il voulait le plafond **égal** à 820 — devenu « 820 au plus » (il ne remonte pas), sa contre-épreuve remonte le chiffre quel qu’il soit.
- Cliquets : boutons « maison » 71 → 70 ; **cercles 110 → 106** (les avatars et pastilles du chat, partis avec lui — un plancher qui baisse parce que ses sujets ont disparu, pas parce qu’un cercle est devenu carré) ; rayons en dur 225 → 221 ; espacements hors échelle 982 → 969.

- **Chaîne** : **469 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 2 rouges (globaux, tutos), puis un passage coupé à la fin d’un message (289 commandes, sans rouge), puis 1 rouge (`mv-harnais-tuto8`).

### 395e. La leçon
**Un code sans appelant coûte quand même.** Inatteignable, il ne gênait personne à l’écran — mais il pesait dans chaque revue, chaque contrôle de style, chaque inventaire de la charte. Le garder « honnête » avait un sens tant qu’on pouvait le rebrancher ; quand son propriétaire n’en veut plus, le retirer est la mesure honnête.

## 396. CHARTE-5d — ÉTAPE 2 : LES NOTES GRISES À L’ENCADRÉ NEUTRE (20/10 — `index.html` · `src/phyto.js` · `src/reglages.js` · `src/planning.js` · `src/pilotage.js` · `src/cave.js` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/mv-jetons-baseline.json` · **APP 9.56 → 9.57, SW 10.35 → 10.36**, base `e93f854`)

### 396a. La demande et le tri
L’étape 2 de la recommandation (§389a) : les 165 encadrés faits à la main restants (`mv-harnais-cartes` F). Inventaire : **83 neutres** (fond gris ou blanc), **50 de la console GT**, **19 aux couleurs calculées par le code**, **12 zones sombres** (connexion, mentions légales, bandeaux), **1 teinté**. Parmi les neutres, tri proposé d’après leur style et leur texte : **60 notes**, 10 tuiles (un chiffre en grand), 7 cartes, 7 lignes cliquables. Une planche des 165 était prévue ; leurs textes, souvent calculés par le code, la rendaient illisible — le tri par règle (le jeu validé) a été préféré, les décisions réelles gardées pour Nico (la console GT, les zones sombres).

### 396b. Ce qui est livré
- **51 notes grises rendues à l’encadré neutre** (`.mvencadre`, fond `--survol`) : Phyto 17 (assistant, catalogue, détail d’un traitement, export), `index.html` 17 (les fenêtres : mot de passe, compte, saisies), Réglages 9 (chrono, membres, cuivre, documents), Planning 5 (récapitulatifs, congés, la feuille d’une journée), Pilotage 2, Cave 1. Leur fond, leur filet, leur arrondi, leur couleur et leur taille écrits sur place sont retirés, leur mise en page gardée — comme aux §380-§381. Écartées par le passage : celles aux couleurs calculées et les cliquables.
- **Gardées à part, avec leur raison** :
  - le **rapport de saison** (`exportRapportSaison`) : il s’ouvre dans une fenêtre à part (`window.open` + `document.write`), sans la feuille de l’appli — une classe n’y vaut rien ; son style écrit sur place reste ;
  - les **trois notes d’app.js** (la tournée, « Trié par proximité », la fiche « Parcelle arrachée ») : leurs textes portent des couleurs écrites sur place (gris doux, rouge) que `mv-harnais-contraste` ne sait plus rapporter au fond une fois celui-ci donné par une classe — l’écart en thème sombre montait de 7 à 8. Trois essais pour isoler la cause ; app.js est rendu à l’état poussé, à reprendre en ôtant d’abord ces couleurs.
- Plafond des encadrés faits à la main **165 → 114** ; filet perdant 70 → 68.

### 396c. Reste de l’étape 2
- **Deux décisions pour Nico** : la console GT (50) — la soigner, ou l’écarter de la règle, par écrit ; les zones sombres (12) — garder (connexion, mentions légales : sombres exprès ?) ou ramener au jeu.
- **Par la règle** : les 10 tuiles (→ bloc de chiffres), les 7 cartes (→ carte), les 7 lignes cliquables (→ carte cliquable, un vrai bouton), les 19 couleurs calculées (→ un ton par classe, cas par cas), les 3 notes d’app.js.
- **Pas vu à l’écran dans ce lot** : les 51 notes (même passage que §380-§381, revu alors).

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 396d. La leçon
**Un contrôle de contraste statique lit le fond là où il est écrit.** Quand le fond passe dans une classe, un texte coloré sur place perd son fond aux yeux du contrôle : il faut ôter la couleur du texte en même temps que celle du fond — ou garder les deux.

## 397. ZONES-1 — LES ZONES SOMBRES TRANCHÉES (20/10 — `src/styles.css` · `src/charte.css` · `src/reglages.js` · `src/cave.js` · `src/phyto.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/mv-jetons-baseline.json` · **APP 9.57 → 9.58, SW 10.36 → 10.37**, base `573d675`)

### 397a. La demande
Après CHARTE-5d (§396), deux décisions restaient pour Nico : les 12 zones sombres et la console GT. Il demande des maquettes (« maquette pour zone sombre, gt maquette ») : canvas Design « Ma Vigne — zones sombres et console GT (à trancher) », deux planches, l’aujourd’hui redessiné d’après les vraies valeurs face à la proposition. Les douze zones sombres sont de trois sortes : des **bandeaux** voulus (un chiffre clé sur fond « cave »), des **encadrés écrits pour un fond sombre** (blanc à 5 % : invisibles en clair) et les **tuiles de la fiche d’une cuvée** (un filet blanc à 7 % : invisible en clair). Propositions : garder les bandeaux et les unifier ; les deux autres au jeu ; la console GT au jeu commun avec un bandeau en tête. Nico : **« go »**.

### 397b. Ce qui est livré
- **La pièce bandeau** (`.mvbandeau`, dans le bloc CHARTE-5) : `linear-gradient(160deg, --cave-2, --cave 78%)`, encre `--sur-bandeau` (crème, nouveau dans la charte avec `--sur-bandeau-doux`), arrondi 8 px, sans ombre ni filet ; toujours sombre, dans les deux thèmes. Y passent : « Ma trace » (`.mtr-hero` — arrondi 18 px et ombre retirés, son libellé `.mtr-k` sans capitales ni espacement), « Le domaine » du mur (`.mur-tot`, arrondi 18 px retiré), le bilan du domaine (Réglages › cuivre, `_renderCuivre` : dégradé, encre et filet écrits sur place → la classe). La ligne de couleur en tête de « Ma trace » et du mur est gardée.
- **La fiche d’une cuvée** (`openCuveeDetail`) : trois tuiles (fond de carte, filet blanc à 7 %, libellés en capitales) → **un bloc de chiffres** à deux colonnes, le soutirage sur toute la ligne (« pour ne pas laisser un demi-trou », disait le code) ; `.mvchiffres-2` garde deux colonnes sur ordinateur, ses filets suivent. Libellés en `.mvchiffres-l`, sans capitales.
- **Cinq encadrés écrits pour le sombre** → **encadré neutre** : `index.html` (le compte sans adresse e-mail ; dans les mentions légales, la réversibilité, la force majeure, l’identité de GUERETTECH), `phyto.js` (une ligne de l’assistant).
- Plafond des encadrés faits à la main **114 → 105** ; replis manquants 87 → 85.

### 397c. Vu
`ma-trace`, `mur`, `cave-cuvee` (téléphone, clair et sombre) : les bandeaux au même arrondi, le libellé de « Ma trace » sans capitales ; la fiche d’une cuvée en une carte à filets (ouillage | analyse, puis le soutirage). Pas vu : le bilan du domaine (l’outil ne trouve pas encore son écran) et les encadrés des mentions légales (plus bas dans la fenêtre).

### 397d. La console GT — le lot suivant
Validée « au jeu commun ». Pas dans ce lot : sa garde (`_agtGuard`, le jeton `gtAdmin`) empêche l’outil de captures de l’ouvrir dans la démo, et la console porte des centaines de couleurs écrites sur place (blanc translucide, violet) — la passer au jeu sans la voir serait travailler à l’aveugle. D’abord : apprendre à l’outil à l’ouvrir (un jeton de revue), puis la passer au jeu, vue écran par écran.

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 397e. La leçon
**Un fond pensé pour le sombre disparaît en clair.** Du blanc à 5 % fait un cadre sur un fond noir et rien sur un fond blanc : un dessin qui ne marche que dans un thème n’est pas un dessin de la charte.

## 398. CHARTE-5e — ÉTAPE 2, SUITE : TUILES, LIGNES CLIQUABLES, PETITES CARTES (20/10 — `src/styles.css` · `src/app.js` · `src/phyto.js` · `src/planning.js` · `src/reglages.js` · `src/cave.js` · `src/tracteur.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/mv-jetons-baseline.json` · **APP 9.58 → 9.59, SW 10.37 → 10.38**, base `8fea966`)

### 398a. La console GUERETTECH : hors charte, décision de Nico
Validée « au jeu commun » au §397, la console s’est révélée une application à part (`gt.html`, depuis GT-1 §249), fermée par une vraie connexion Firebase, et chargée de 1 363 couleurs écrites en dur. Trois voies proposées (un mode revue limité à l’ordinateur de l’outil de captures ; des captures de Nico ; le faire sans voir et vérifier sur le canal `refonte`). Nico : **« on ne touche pas au gt admin »**. La console reste telle quelle — son code, sa connexion, son thème violet. `mv-harnais-cartes` F ne compte plus `src/admin-gt.js` (ses 50 encadrés ne pèsent plus sur le plafond). L’écran `console-gt` essayé dans `mv-captures` n’est pas livré.

### 398b. Ce qui est livré
- **`.mvcarte-fond`** (bloc CHARTE-5) : le dessin de la carte seul — fond, filet, arrondi, sans ombre — groupé avec `.mvcarte`, mais **sans** sa mise en page (`.mvcarte` est une colonne en flex avec 16 px de marge : posée sur une rangée d’avant en flex, elle l’aurait mise en colonne).
- **19 blocs faits à la main au jeu**, chacun relu sur sa ligne :
  - **9 tuiles** → `.mvcarte-fond`, leur mise en page et leur marge gardées : la tournée (Accueil), le produit choisi (Phyto), quatre récapitulatifs du Planning (travail effectif, jours travaillés, mois restants…) et une tuile du Planning, deux cartes des Réglages ;
  - **2 cartes d’analyse de la Cave** (l’évolution du SO₂, les analyses de la cuvée : filet blanc à 7 %, invisible en clair) → `.mvcarte-fond` ;
  - **3 lignes cliquables** → `.mvcarte-fond .mvcarte-clic` (survol, appui, focus du jeu) : un traitement du Tracteur, une commune des Réglages, le choix de la complantation (`index.html`) ;
  - **5 petites cartes d’aide** → encadré neutre : le cuivre métal par kg/ha (deux, Phyto), le cépage et la commune cachés du formulaire d’une parcelle, une rangée d’`index.html`.
- Plafond des encadrés faits à la main **105 → 36** (dont 50 de la console sortis) ; filet perdant 68 → 67.

### 398c. Vu, et pas vu
`planning-demande` (ordinateur), `cave-cuvee`, `phyto-saisie` (téléphone), clair et sombre : intacts. Les blocs passés au jeu n’y paraissent pas tous (une cuvée sans analyse, un produit sans cuivre).

### 398d. Reste de l’étape 2 (36)
19 couleurs calculées par le code (un ton par classe, cas par cas), 10 notes dont le style est coupé sur plusieurs morceaux de chaîne (à reprendre à la main), les 3 notes d’`app.js` (ôter d’abord leurs couleurs de texte, §396), 2 lignes cliquables introuvables au passage (le choix d’une saison du rapport, une ligne des documents), la zone de dépôt d’un rapport PDF (en pointillés, une pièce à elle), une ligne de l’accueil d’installation (couleur calculée), le rapport de saison (document à part).

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 398e. La leçon
**Une pièce porte un dessin et une mise en page ; on n’en veut parfois que la moitié.** `.mvcarte` range son contenu en colonne : juste pour une carte neuve, faux pour une rangée d’avant. Séparer le dessin (`.mvcarte-fond`) de la mise en page laisse passer au jeu sans rien casser.

## 399. CHARTE-5f — ÉTAPE 2 : LES ÉTATS CALCULÉS PAR LE CODE (20/10 — `src/phyto.js` · `src/planning.js` · `src/reglages.js` · `src/app.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cartes.mjs` · `scripts/mv-captures.mjs` · **APP 9.59 → 9.60, SW 10.38 → 10.39**, base `eb96ea2`)

### 399a. La demande
La suite de l’étape 2 (§398) : les 19 encadrés dont le code calcule la couleur — des états que l’utilisateur doit lire d’un coup d’œil. Relus un par un (l’attribut de style entier) : deux sortes, des **tons** (une couleur selon une condition) et des **choix** (une ligne ou une pastille qu’on touche, teintée quand elle est choisie).

### 399b. Ce qui est livré
- **Les tons** → `.mvencadre` et un ton choisi par la condition, sans couleur écrite :
  - fiche d’un produit : DAR (ambre s’il y en a un, sinon vert), DRAE (pareil), ZNT (rouge au-delà de 5 m, sinon neutre) ;
  - détail d’un traitement : DAR restant (rouge, sinon vert), délai de rentrée (neutre s’il ne s’applique pas, ambre s’il court, sinon vert) ;
  - Planning : l’alerte des heures sup à payer (danger, sinon neutre).
- **Les choix** → l’état par une classe, plus par des couleurs : `on` et `aria-pressed` :
  - lignes : le produit trouvé et la parcelle (assistant phyto), la période (Réglages, tournées), le niveau et le passage (Accueil) → `.mvcarte-fond .mvcarte-clic` (choisie : le filet d’action) ;
  - pastilles : le conducteur, « conventionnel / agriculture biologique » (assistant), la parcelle (édition d’un traitement) → `.mvpas-filtre` (choisie : la couleur d’action). Le vert sombre « bio » (`#1A3A1A`, `#40C080`) et le bleu acier du conducteur disparaissent.
- **Vu en plus** : les deux « Continuer » de l’assistant (bleu acier, gris quand désactivés) étaient repeints par le code à chaque parcelle cochée (`_tratRenderParcList`). → `.mvbtn .mvbtn-principal` ; l’état passe par l’attribut `disabled` seul.
- `mv-captures` : `phyto-cuivre-1` et `phyto-cuivre-2` (l’assistant aux étapes 1 et 2).
- Plafond des encadrés faits à la main **36 → 21**.

### 399c. Vu
`phyto-cuivre-1`, `phyto-cuivre-2` (téléphone, clair et sombre) : les parcelles choisies au filet lie-de-vin, « Continuer » à la couleur d’action, l’alerte DRAE à l’ambre. Pas vu : la fiche d’un produit (le catalogue E-Phy se charge du réseau), l’alerte du Planning et les lignes de l’Accueil (la démo ne les porte pas).

### 399d. Restent (4 calculés, et le reste de l’étape 2)
La vente au Cuvier (`bg` et `bd` calculés plus haut), une ligne du Planning (`rowBg`, `rowBd`), une ligne du Pilotage (à bordure de côté de 3 px : à reprendre), les chiffres du bilan du cuivre (dans le bandeau sombre, leur blanc translucide y est juste). Puis les 10 notes au style coupé, les 3 notes d’`app.js`, et les cas à part (§398d).

- **Chaîne** : **469 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 399e. La leçon
**Un état se dit par une classe ; la couleur reste à la feuille.** Écrit `'+(sel?'var(--acier)':'var(--bg-card)')+'`, un état ne suit ni la charte ni le mode sombre — et `aria-pressed` manquait partout : une lecture d’écran ne savait pas ce qui était choisi.

## 400. CHARTE-6a — ÉTAPE 3 : LE JEU DES CASES DE SAISIE (20/10 — `src/styles.css` · `src/charte.css` · `src/phyto.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-champs.mjs` (nouveau) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-espace-baseline.json` · **APP 9.60 → 9.61, SW 10.39 → 10.40**, base `34c82a3`)

### 400a. La demande
L’étape 3 de la recommandation (§389a) : les cases de saisie. Inventaire (hors console GT) : 431 champs (115 nombres, 111 textes, 71 dates…), 61 listes, 11 zones de texte ; 16 hauteurs, 13 arrondis, 14 tailles de texte, 20 fonds ; 62 champs stylés sur place. La famille principale, `.fi` et `.fsel` (175), est grise pleine, sans bord : sur une carte blanche, son contour se devine. Maquette Design « Ma Vigne — le jeu des cases de saisie (CHARTE-6) » (quatre planches : les pièces et leurs états, une vraie fenêtre au téléphone, le sombre, l’aujourd’hui) ; Nico : **« go »**.

### 400b. Ce qui est livré
- **La charte** : `--champ-filet` (#85827C en clair, 3,8 pour 1 sur le blanc ; #77736B dans les deux blocs sombres, 3,6 pour 1 — la règle d’accessibilité des bords de commandes, 3 pour 1) et `--h-champ` (48 px).
- **Le bloc CHARTE-6** (après CHARTE-5, fermé par `/* ★ FIN CHARTE-6 */`) : `.mvchamp, .fi, .fsel` — fond de carte, filet `--champ-filet`, arrondi 8 px, 48 px de haut et 16 px de texte au téléphone (Safari zoome sous 16 px), 36 px et 14 px au bureau (comme les boutons) ; la zone de texte deux fois plus haute ; survol (filet à l’encre), **focus** (filet à la couleur d’action — le halo est l’anneau de focus commun, que le jeu n’éteint pas), **erreur** (`aria-invalid="true"`, filet rouge), **désactivé** (fond de survol, texte doux). `.mvchamp-l, .fl` : l’étiquette — encre, demi-gras, sans capitales, 14 px (13 au bureau).
- **Retirés** : le dessin de `.fi` et `.fsel` (fond gris, filet transparent à 2 px, arrondi 10 px), leurs focus colorés (vert, phyto, acier), les règles à part des fenêtres du Tracteur pour `.fi`, `.fsel` et `.fl` ; le dessin de `.fl` (capitales grises de 11 px). La règle anti-zoom de Safari (16 px) est gardée.
- **La saisie d’un traitement** : ses étiquettes étaient dessinées par un style écrit dans une variable (`var L='…text-transform:uppercase…'`) → `.mvchamp-l`. ⚠️ Un dernier emploi de `L` (« Parcelles traitées ») a échappé au premier passage : la capture l’a attrapé (« L is not defined ») avant toute livraison.
- **Nouveau contrôle `mv-harnais-champs`** : A le bloc et ses états, B aucune couleur en dur, C le filet dans la charte (clair et sombres), D `.fi`/`.fsel` dessinés par le jeu seul (hors la règle anti-zoom), E 16 px au téléphone, F les champs stylés sur place ne remontent pas (≤ 60) ; 6/6 contre-épreuves. Inscrit à la chaîne (471 commandes).
- Deux corrections en route, d’après `mv-harnais-jetons` : pas d’`outline:none` dans le jeu (« 1 seul outline:none toléré » — l’anneau commun n’est jamais éteint), et le repli de `--ligne`.

### 400c. Vu
`phyto-saisie` (téléphone clair et sombre, ordinateur), `tracteur-entretien`, `mot-de-passe-erreur` : champs blancs au contour net, étiquettes en lettres normales, le sombre lisible, l’ordinateur compact.

### 400d. Reste de l’étape 3
Les autres familles de champs (`.mvr-fi` de la Réserve, `.mvv-tin`, `.emh-in`, `.mvt-fi`, `.plan-ge-input`…), les 60 champs stylés sur place, les étiquettes faites à la main ailleurs (comme celle de la saisie d’un traitement), les cases à cocher et l’interrupteur. Les écrans de connexion et d’installation gardent leurs champs sombres (comme les bandeaux, §397).

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 400e. La leçon
**Supprimer une variable, c’est chercher tous ses emplois — même concaténés.** `'+L+'` et `'+L+';margin-bottom:0'` ne s’écrivent pas pareil ; le second a échappé au remplacement. La capture, qui ouvre vraiment la fenêtre, l’a vu là où la syntaxe ne voyait rien.

## 401. CHARTE-6b — ÉTAPE 3, SUITE : LES AUTRES FAMILLES DE CHAMPS (20/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-champs.mjs` · `scripts/mv-captures.mjs` · `scripts/mv-jetons-baseline.json` · `scripts/mv-espace-baseline.json` · `scripts/contraste-baseline.json` · **APP 9.61 → 9.62, SW 10.40 → 10.41**, base `add87b7`)

### 401a. La demande
La suite de l’étape 3 (§400) : les autres familles de champs. Relevé (hors console GT) : `.mvr-fi` (Réserve, 39), `.mvv-tin` (Cuvier, 47 — sans règle propre), `.emh-in` (7), `.tcfg-in` (8 — sans règle), `.mvt-fi` (6), `.plan-ge-input` (1), `.pl2r-tin` (2), `.j-date-input` (2), `.mat-an` (le grand chiffre transparent du Cuvier, voulu), `.danger-conf-input` (la confirmation d’une suppression, rouge exprès), `.vend-param-fi` (aucun emploi).

### 401b. Ce qui est livré
- **Au jeu** (`.mvchamp`, `.fi`, `.fsel` et leurs états) : `.mvr-fi`, `.emh-in`, `.mvt-fi`, `.plan-ge-input` (sa largeur de 70 px gardée), `.pl2r-tin` — fond (`--bg-app`, `--gris-clair`), filets (brun translucide, gris clair à 1,5 ou 2 px), arrondis (10 à 13 px), marges, tailles et couleurs retirés ; leurs focus colorés (`--terre`, `--or` et son ombre dorée) et le texte indicatif beige de la visite guidée aussi. Les zones de texte de ces familles prennent la hauteur double du jeu.
- **Dessin seul** — `.mvchamp-fond` (dans le bloc) : le filtre de dates du Journal (`.j-date-input`) garde sa taille compacte (marge, texte : la règle anti-zoom de Safari le remonte à 16 px sur iPhone) et prend le fond, le filet, l’arrondi et la couleur du jeu, et ses états.
- **Les étiquettes** `.mvt-fl` (capitales or espacées) et `.mvr-fl` (terre) → l’étiquette du jeu.
- **Cocher et choisir** : `input[type="checkbox"], input[type="radio"]` prennent `accent-color: var(--accent)` ; cinq cases qui avaient leur couleur (les types d’export de la Cave en cuivre, deux de la visite guidée en or et en vert, la case du Planning en terre, une option en vert) aussi. Gardée : la case des CGU de l’installation (écran sombre, comme ses champs).
- `mv-harnais-champs` : D suit la liste des familles passées au jeu (`JEU`) ; pour le dessin seul (`FOND`), la marge et la taille restent permises. 6/6 contre-épreuves. `mv-captures` : `reserve-achat` (le formulaire d’achat de la Réserve).
- Cliquets regravés à la baisse : rayons en dur 221 → 220, espacements hors échelle, contraste.

### 401c. Vu
`reserve-achat` (téléphone clair et sombre, ordinateur) : champs blancs au contour net, étiquettes en lettres normales, la liste d’intrants, la date, les champs côte à côte. `reserve`, `planning-gens`, `reglages` : intacts. **Vu aussi, à reprendre** : dans la Réserve, le bouton principal (« Enregistrer l’achat ») et le sélecteur « Par unités / Directe / Les deux » restent en terre — les boutons de la Réserve (`.mvr-btn`) ne sont pas au jeu de boutons.

### 401d. Reste de l’étape 3
`.mvv-tin`, `.tcfg-in`, `.mvc-pk-in` (sans règle propre : leur dessin vient du style écrit sur place ou d’un parent, à voir écran par écran), les 60 champs stylés sur place, les étiquettes faites à la main, l’interrupteur ; et les boutons de la Réserve.

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 401e. La leçon
**Un champ compact n’a pas à devenir grand pour être au jeu.** Le filtre de dates du Journal vit dans une barre étroite ; lui imposer 48 px aurait cassé la barre. Le dessin seul (`.mvchamp-fond`) lui donne l’apparence commune sans toucher à sa taille — comme `.mvcarte-fond` pour les cartes (§398).

## 402. RSV-BTN — LES BOUTONS DE LA RÉSERVE AU JEU (20/10 — `src/styles.css` · `src/reserve.js` · `src/phyto.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-harnais-rsv1.mjs` · `scripts/contraste-baseline.json` · `scripts/mv-jetons-baseline.json` · `scripts/mv-espace-baseline.json` · **APP 9.62 → 9.63, SW 10.41 → 10.42**, base `d12061c`)

### 402a. La demande
Vu au §401 (le formulaire d’achat de la Réserve) : le bouton principal « Enregistrer l’achat » et le sélecteur « Par unités / Directe / Les deux » restaient couleur terre. Les boutons de la Réserve n’étaient au jeu que sur la page (`#page-reserve …`), pas dans ses fenêtres.

### 402b. Ce qui est livré
- **Au jeu de boutons** (bloc CHARTE-3) : `.mvr-btn` (les listes de base, actif, désactivé ; sa mise en page `flex:1; min-width:130px` gardée), `.mvr-btn-p` et `.mvr-btn-g` (le doré, en dégradé) → **principal** ; `.mvr-btn-o` → **secondaire** ; `.mvr-btn-dgr` (le dégradé rouge que reserve.js posait pour une sortie « destruction ») → **danger** ; `.mvr-mini` (les petits boutons des listes, fond terre pâle) → **secondaire**, `.mvr-mini-d` → **danger** ; `.mvr-fstepb` (les « − / + » du nombre de fûts) → **bouton icône** du jeu (secondaire).
- **Le sélecteur** `.mvr-segb.on` : le choix fait prend la couleur d’action (plus le terre). Le sélecteur reste un contrôle segmenté à lui, comme celui du Tracteur (§378).
- **Retirés** : le dessin des règles d’avant (fond terre et son ombre, dégradé doré, filet brun translucide, arrondis 9 et 12 px…) ; les règles à part de `#page-reserve` (`.mvr-btn-p`, `:is(.mvr-btn-o,.mvr-mini)`, `.mvr-mini-d`, `.mvr-fstepb`) ; les dessins injectés par reserve.js (`.mvr-fstepb` et ses états, `.mvr-btn-dgr`) — `mv-harnais-couches` refuse une classe déclarée dans deux feuilles ; `.mvr-btn-g` retiré d’une règle groupée qui le recolorait (`#241A10`) ; la marge écrite sur place des trois boutons « Tout cocher / Tout décocher / Zone vulnérable » de la fertilisation (Phyto).
- `mv-harnais-rsv1` (RSV-1, §292) vérifiait « Ajouter des fûts » à l’accent par la règle à part `#page-reserve .mvr-btn-p` : il le vérifie désormais dans la liste du principal du jeu de boutons, et sa contre-épreuve retire `.mvr-btn-p` de cette liste (vu par le premier passage de la chaîne : 2 rouges, le contrôle et sa contre-épreuve).
- `mv-harnais-boutons` surveille les six classes ; plafond des boutons « maison » **70 → 66**. La couverture du contraste baisse (979 → 972 paires mesurées : les paires terre sur terre pâle ont disparu avec leurs couleurs) — regravée, comme les jetons (rayons en dur) et l’échelle.

### 402c. Vu
`reserve-achat` (téléphone clair et sombre) : « Enregistrer l’achat » à la couleur d’action, « Annuler » secondaire, « Par unités » choisi à la couleur d’action. `reserve` : intacte.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 2 rouges (`mv-harnais-rsv1` et sa contre-épreuve), puis un passage coupé à la fin d’un message (389 commandes, sans rouge).

### 402d. La leçon
**Une règle rangée sous `#page-…` ne suit pas la fenêtre qu’on ouvre de la page.** Les fenêtres vivent hors de la page dans le document : le jeu posé « pour la Réserve » ne valait que sur son écran. Une pièce commune se pose sans portée.

## 403. CHARTE-6c — ÉTAPE 3 : LES CHAMPS DU CUVIER (20/10 — `src/styles.css` · `src/cuvier.js` · `src/cave.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-champs.mjs` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-harnais-rsv1.mjs` · `scripts/mv-captures.mjs` · `scripts/contraste-baseline.json` · **APP 9.63 → 9.64, SW 10.42 → 10.43**, base `c131f4a`)

### 403a. La demande
La suite de l’étape 3 (§401) : les champs « sans règle propre » — `.mvv-tin` (Cuvier, 47), `.tcfg-in` (tournées, 8), `.mvc-pk-in` (Cave, 3). Leur dessin n’était pas dans styles.css : il vivait dans la feuille que cuvier.js injecte à l’ouverture d’une fiche (`_vendEnsureSheetCss`, gabarit sur plusieurs lignes), dans celle de cave.js (chaînes concaténées), et dans le `<style>` d’`index.html`.

### 403b. Ce qui est livré
- **Au jeu des cases de saisie** : `.mvv-tin` et `.mvc-pk-in` (filet brun translucide, arrondi 11 px, focus terre et son ombre) ; `.tcfg-in` en **dessin seul** (`.mvchamp-fond` : ses 74 px de large, son texte centré gardés) ; les étiquettes `.mvv-flbl` (capitales grises) et `.mvc-pk-lbl` (pareil) → l’étiquette du jeu.
- **Les feuilles injectées** : leurs règles de ces classes retirées (`mv-harnais-couches` refuse une classe déclarée dans deux feuilles) ; leur mise en page reprise dans styles.css, après le bloc CHARTE-6, sur l’échelle d’espacement (14 px → 12, 6 px → 8 : `mv-harnais-echelle` voyait trois valeurs hors échelle de plus, qui n’étaient pas comptées dans les feuilles injectées).
- **Vu, et corrigé** : la fiche « Nouveau client » (`openVendClient`) montrait un « Enregistrer » nu, au dessin du navigateur. Son dessin (`.mvv-save` : dégradé doré, texte brun) n’était posé que par `_vendInjectCss`, appelée au rendu du Cuvier — une fiche ouverte sans lui restait nue. → **au jeu de boutons** (principal ; `.mvv-save.ghost2` → secondaire) ; ses deux règles injectées retirées ; `mv-harnais-boutons` le surveille.
- **La police** : le jeu pose `font-family: var(--font-ui)` dans ses champs (les champs du Cuvier tombaient sur la police du système une fois leur règle injectée retirée).
- `mv-harnais-rsv1` (ajusté au §402) cherchait la liste du principal **finissant** par `.mvr-btn-g{` : `.mvv-save` l’allonge — il accepte désormais une liste qui continue (vu par le premier passage de la chaîne : 2 rouges, le contrôle et sa contre-épreuve).
- `mv-harnais-champs` : trois familles de plus (`JEU`), `.tcfg-in` en dessin seul (`FOND`). `mv-captures` : `cuvier-client` (passe par « Le Cuvier », puis ouvre la fiche, comme le ferait l’utilisateur). La couverture du contraste regravée (972 → 968 paires mesurées : celles des règles retirées).

### 403c. Vu
`cuvier-client` (téléphone clair et sombre, ordinateur) : champs blancs au contour net, titres en lettres normales, la police de l’appli, « Enregistrer » à la couleur d’action sur toute la largeur.

### 403d. Reste de l’étape 3
Les 60 champs stylés sur place ; les étiquettes faites à la main ailleurs ; l’interrupteur ; `.danger-conf-input` (rouge exprès) et `.mat-an` (le grand chiffre du Cuvier) restent à eux.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 2 rouges (`mv-harnais-rsv1` et sa contre-épreuve), puis un passage coupé à la fin d’un message (423 commandes, sans rouge).

### 403e. La leçon
**Une feuille injectée ne vaut que si son injecteur a tourné.** Le bouton du Cuvier n’avait de dessin qu’après le rendu d’un écran précis ; ouvert par un autre chemin, il était nu. Une pièce commune dans la feuille de l’appli vaut partout, tout le temps.

## 404. CHARTE-6d — ÉTAPE 3 : LES CHAMPS STYLÉS SUR PLACE (20/10 — `src/styles.css` · `src/phyto.js` · `src/planning.js` · `src/reglages.js` · `src/tracteur.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-champs.mjs` · `scripts/contraste-baseline.json` · `scripts/mv-jetons-baseline.json` · **APP 9.64 → 9.65, SW 10.43 → 10.44**, base `88dac78`)

### 404a. La demande
La suite de l’étape 3 (§403) : les champs dont le dessin est écrit dans l’attribut `style`. Relevé (hors console GT) : 63 — `index.html` 22, Phyto 14, Planning 12, Réglages 11, app.js 2, installation 1, Tracteur 1 ; 15 nombres, 12 textes, 8 cases à cocher, 8 dates, 7 listes, 7 zones de texte, 5 heures, 1 e-mail ; 32 en pleine largeur.

### 404b. Ce qui est livré
- **43 champs → `.mvchamp`** (ou leur `.fi` gardé) : fond, filet, arrondi, marge intérieure, taille et police du texte, couleur, `outline`, hauteur retirés de l’attribut ; largeur, `flex`, marges, alignement du texte, `resize`, graisse gardés.
- **5 petits champs** (largeur sous 120 px : le cuivre métal, la dilution, des chiffres du Planning et des Réglages) → **`.mvchamp .mvchamp-compact`** (nouveau, dans le bloc : 36 px partout, marge de 8 px, 14 px de texte) ; leur largeur reste écrite là où ils sont.
- **`.mvchamp-recherche`** (nouveau) : le champ de recherche de l’assistant phyto a une loupe posée à gauche ; la passe lui avait retiré sa marge de 34 px — vu à la capture (la loupe recouvrait le texte), rendu par la pièce.
- **7 cases à cocher** : leur couleur écrite sur place (vert, bleu, violet du Phyto) retirée — l’`accent-color` commun (§401) s’applique ; leur taille reste. La case d’export d’un tracteur garde la couleur du tracteur (calculée : une couleur qui dit lequel).
- **La règle anti-zoom de Safari** (16 px sur iPhone) couvre désormais `.mvchamp` et `.mvchamp-compact`.
- **Laissés (8)** : le champ de l’installation et un chiffre du bilan du cuivre (sombres exprès), le grand code centré, deux champs d’app.js (dont un à l’or translucide — app.js fait monter le contraste en sombre dès qu’on touche ses couleurs, §396), la case d’un tracteur (calculée), deux champs d’`index.html` que la passe n’a pas trouvés sur leur ligne.
- `mv-harnais-champs` F : les cases à cocher et boutons ronds sortent du compte (leur largeur et leur hauteur sont leur taille, pas un dessin) ; plafond **60 → 7**. Couverture du contraste regravée (968 → 932 paires mesurées : celles des couleurs retirées des attributs) ; filets perdants 67 → 64.

### 404c. ⚠️ Un premier passage refait
L’expression de la passe ne consommait pas le guillemet fermant du style : chaque champ ressortait avec `style="…""`. JavaScript l’acceptait (un guillemet de trop dans une chaîne), mais `vite build` a refusé l’HTML d’`index.html` (« missing-whitespace-between-attributes »), et la capture suivante montrait encore l’ancienne construction. Les cinq fichiers ont été repris de leur copie d’avant, la passe rejouée avec le guillemet ; un contrôle a vérifié qu’aucun guillemet doublé ne restait.

### 404d. Vu
`phyto-cuivre-1` (téléphone clair et sombre, ordinateur : le cuivre métal en petit champ, la recherche et sa loupe), `tracteur-ajout` (nom et modèle), `reglages-documents` : justes.

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 404e. La leçon
**La construction est un contrôle.** Le code passait la syntaxe ; l’HTML qu’il fabriquait ne passait pas `vite build`. Après une passe sur des balises, on construit avant de regarder — sinon la capture montre l’ancienne version.

## 405. CHARTE-6e — ÉTAPE 3 : L’INTERRUPTEUR, LES DERNIÈRES ÉTIQUETTES (21/10 — `src/styles.css` · `src/phyto.js` · `src/reglages.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-phyto2.mjs` · **APP 9.65 → 9.66, SW 10.44 → 10.45**, base `11d5d70`)

### 405a. La demande
La fin de l’étape 3 (§404) : l’interrupteur de la maquette CHARTE-6 (piste, activé à la couleur d’action) et les étiquettes de champ faites à la main.

### 405b. Ce qui est livré
- **L’interrupteur** : relevé (hors console GT) — `.ephy-tgl .sw` (« Masquer les retirés », catalogue phyto : piste gris clair, activé en violet `#9B70D4` ; une règle `#page-phyto .ephy-tgl.on .sw{…!important}` ne mettait l’accent que sur la page) et `.pil-sw` (les affichages du Pilotage : piste grise, activé en vert). Les autres « bascules » de l’appli (`.cave-toggle-btn`…) sont des contrôles segmentés, pas des interrupteurs. → Dans le bloc CHARTE-6 : la piste prend `--champ-filet` (le contour des champs, 3,8 pour 1 : l’interrupteur éteint se voit), l’activé `--accent` ; le rond reste blanc. Couleurs d’avant et règle à part retirées.
- **Les étiquettes faites à la main** : un élément (`div`, `span`, `label`, `p`) en capitales, suivi d’un champ dans les 170 caractères (hors cases à cocher) → `.mvchamp-l` (taille, graisse, police, couleur, espacement, capitales retirés de l’attribut ; affichage et marges gardés) : 9 — Phyto 4, Réglages 4 (dont l’export des documents), `index.html` 1. Les en-têtes de section en capitales (« Ajouter un produit », « Vos produits récents ») ne sont pas des étiquettes de champ : laissés.

- `mv-harnais-phyto2` (PHYTO-2, §286) : sa contre-épreuve « une couleur écrite en dur dans le bloc » visait la règle retirée de l’interrupteur — elle vise maintenant la ligne choisie du catalogue, dans le même bloc (vu par le premier passage de la chaîne : 1 rouge).

### 405c. Vu
`phyto-produit` (le catalogue, clair et sombre : l’interrupteur activé à la couleur d’action), `phyto-cuivre-1` : justes.

### 405d. L’étape 3 est close
Le jeu des cases de saisie est posé (§400) ; les familles de champs y sont (§400-§403), les champs stylés sur place ramenés de 60 à 7 (§404), les cases à cocher et l’interrupteur à la couleur d’action. Restent à part, par décision : les champs des écrans de connexion et d’installation (sombres exprès), le grand chiffre du Cuvier, la confirmation d’une suppression (rouge exprès), la console GT. **Suite proposée** : le tour complet de l’appli en captures, écran par écran, clair et sombre, pour clore la série CHARTE sur une vérification d’ensemble.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 1 rouge (`mv-harnais-phyto2 --contre`).

### 405e. La leçon
**Une règle « pour la page » oublie les fenêtres et les autres pages.** L’interrupteur du catalogue n’était à l’accent que sous `#page-phyto` — comme les boutons de la Réserve (§402). La pièce commune, sans portée, met fin à ces exceptions.

## 406. REVUE-6 — LA REVUE COMPLÈTE, LOT 1 (21/10 — `src/utils.js` · `src/tracteur.js` · `src/cave.js` · `src/styles.css` · `index.html` · `public/sw.js` · **APP 9.66 → 9.67, SW 10.45 → 10.46**, base `7658866`)

### 406a. La revue
Nico : « fais le travail comme un expert informatique, expert en ergonomie et en expérience utilisateur, copie les meilleurs du secteur logiciel ». Tous les écrans que `mv-captures` sait ouvrir (35) × téléphone et ordinateur × clair et sombre : 140 captures, lues sur des planches puis agrandies aux endroits suspects. Grille : les 10 heuristiques de Nielsen (gravité 0-4), WCAG 2.2 AA (contraste mesuré sur la capture), Apple HIG / Material 3, et ce que font Linear, Stripe, GitHub, GOV.UK. Verdict : la base est saine et cohérente (le jeu commun tient partout) ; ce qui reste touche le terrain (hors réseau, lecture des chiffres), les actions dangereuses et la première impression.
- **Majeurs (3)** : 1. « Mode hors ligne » recouvre l’en-tête ; 2. « Supprimer cette session » est le bouton le plus visible de la fiche ; 3. des chiffres en police à empattements (le « 0 » des tuiles des Parcelles ressemble à un « O ») ; 4. le texte doré de la priorité du jour (≈ 3,5:1 mesuré sur la capture, seuil 4,5) ; 5. la démo vide et l’Accueil qui se contredit (« Avancement 100 % » à côté de 0 parcelle, 0 ha).
- **Mineurs (2)** : 6. des capitales et abréviations restantes (« FINIES / EN COURS / ARRACH. », « PART DES ANGES », « CAMPAGNE… », « MILLÉSIME », « MES JALONS ») ; 7. « Ouiller les 1 aujourd’hui » ; 8. les filtres du Tracteur (un crayon après chaque conducteur, le libellé « Conducteur » après la rangée) ; 9. Planning › Les gens sur ordinateur (un tiers de liste, le reste vide sans invitation).
- **Cosmétiques (1)** : 10. un liseré doré en haut des fenêtres, en sombre seulement ; 11. l’aplat vert « Saison en cours » des Réglages.
- **Faux défauts écartés** : la date « mm/dd/yyyy » (langue du navigateur de l’outil) ; le badge hors ligne lui-même (l’outil tourne sans réseau) — seul son chevauchement est un défaut.
- **Plan** : lot 1 (1, 2, 4, 7, 10), lot 2 (3, 6), lot 3 (5 : « — » au lieu de 100 %, puis une démo garnie, maquette d’abord), lot 4 (8, 9, 11).

### 406b. Ce qui est livré (lot 1)
- **1. Le badge hors ligne** (`showSyncBadge`) : il restait affiché tant que durait la coupure, posé au centre de l’en-tête (titre et un bouton cachés). Il s’annonce puis s’efface après 4 s, comme les autres messages ; l’état reste dit par le voyant de l’en-tête (`_syncSetState`, qui passe à « hors ligne » sans réseau). Les messages de chargement restent affichés jusqu’au suivant.
- **2. La zone de danger** : nouvelle pièce `.mvbtn-danger-discret` (après le bloc CHARTE-4 : fond transparent, texte et contour rouges ; au survol, le rouge doux ; `[data-confirm="1"]` → rouge plein). Le détail d’une session : « Admin » (capitales rouges de 10 px) → « Zone de danger » (l’étiquette du jeu, au rouge du texte), le bouton `.mbtn-del` plein → `.mbtn .mvbtn-danger-discret` ; tracteur.js ne repeint plus le bouton à la confirmation (la feuille le fait par `data-confirm`).
- **4. Le doré du texte de priorité** : `.home-prio-pill.home-prio-on .home-prio-pill-txt` repassait au doré clair (`--or`, ≈ 2,5:1 sur le blanc) par-dessus le correctif du tour du contraste → `--or-tx` (#7A5E12, ≈ 6:1 ; #E8D294 en sombre).
- **7. L’accord** : « Ouiller la cuvée aujourd’hui » pour une cuvée, « Ouiller les N cuvées aujourd’hui » au-delà.
- **10. Le liseré doré des fenêtres en sombre** : sa source n’a pas été retrouvée (ni `.modal`, ni ses ombres) — reporté.

### 406c. Vu
`tracteur-session-detail` (clair et sombre : la zone de danger, le bouton en contour), `accueil` (la priorité au doré du texte), `cave-chai` (« Ouiller la cuvée aujourd’hui »).

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 406d. La leçon
**Un correctif peut être défait par une règle plus précise.** Le tour du contraste avait mis la priorité au doré du texte ; une règle de l’état « activé », plus forte, la remettait au doré clair. Seule la mesure sur l’écran rendu l’a montré.

## 407. REVUE-7 — LA REVUE, LOT 2 : LA LECTURE (21/10 — `src/styles.css` · `index.html` · `src/app.js` · `src/cave.js` · `src/cuvier.js` · `src/jalons.js` · `src/phyto.js` · `src/pilotage.js` · `src/planning.js` · `src/reglages.js` · `src/reserve.js` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-jetons.mjs` · `scripts/mv-harnais-rsv3.mjs` · **APP 9.67 → 9.68, SW 10.46 → 10.47**, base `1c8952b`)

### 407a. La demande
Le lot 2 de la revue complète (§406a) : 3. des chiffres difficiles à lire (le « 0 » des tuiles des Parcelles ressemble à un « o ») ; 6. des capitales et abréviations restantes.

### 407b. Les chiffres : la cause
`body{font-variant-numeric:lining-nums}` existait. Mais `font-variant-numeric` est **une seule propriété** : toute règle qui pose `tabular-nums` seul la remplace entière, et retire `lining-nums` — Cormorant Garamond retombe alors sur ses chiffres **elzéviriens** (le « 0 » à hauteur de « o »). 153 déclarations le faisaient (feuille 109 ; JS 44 : Cave, Pilotage, Planning, Phyto…), dont celle de `:root`. Les fichiers woff2 de l’appli gardent les fonctions `lnum` et `tnum` (lues avec fontTools : `zero.lf`, `zero.tf`) → chaque déclaration redit `lining-nums` devant ; `:root{ font-variant-numeric:lining-nums tabular-nums; }`. Cormorant garde son allure, ses chiffres sont à pleine hauteur et alignés — c’est ce que font Stripe et Linear pour leurs chiffres, sans changer de police.

### 407c. Les capitales
- **La feuille** : 87 règles en `text-transform:uppercase` → `none`, leur `letter-spacing` (fait pour les capitales) à 0. Gardées (10) : la connexion (`.login-*`), l’installation (`.ob-*`), la console GT (`.agt-*`), la marque (`.hv2-brand`, `.ph-domain`), la confirmation d’une suppression (`.danger-conf-lbl`).
- **Les règles injectées par le JS** (chaînes et gabarits de CSS) : 120 — Cave 32, Cuvier 20, Réglages 18, app.js 16, Pilotage 14, Planning 12, Réserve 5…
- **Les styles écrits sur place** : 78 — Phyto 27, Planning 20, Réglages 10, `index.html` 13…
- **L’abréviation** : la tuile des Parcelles « Arrach. » → « Arrachées ». (Les abréviations des étiquettes de graphiques, `utils.js`, restent : place comptée.)
- Reste vu : la barre de campagne des Réglages, en capitales dans son texte même.

### 407d. Les contrôles
`mv-harnais-jetons` : sa vérification « les chiffres sont tabulaires, posés sur :root » attend désormais `lining-nums tabular-nums`, sa contre-épreuve aussi. Sa contre-épreuve « on retire --r-md de :root » attendait une assertion « vaut 12px » : `--r-md` vaut 8 px depuis la série CHARTE — réparée (cette contre-épreuve n’est pas jouée par la chaîne : elle était rouge sans que personne le voie).

`mv-harnais-rsv3` (RSV-3) cherchait la règle du tableau d’export de la Réserve avec `font-variant-numeric:tabular-nums;` : il attend désormais `lining-nums tabular-nums` (vu par le premier passage de la chaîne : 2 rouges, le contrôle et sa contre-épreuve).

### 407e. Vu
`parcelles` (les tuiles « 0 Finies / En cours / Arrachées »), `ma-trace` (« 0,00 ha » à pleine hauteur), `cave-chai` (« Millésime »), `phyto-cuivre-1` (« Ajouter un produit », « Vos produits récents »), et `accueil`, `cave`, `pilotage`, `planning`, `reglages`, `reserve`, `tracteur` (téléphone, clair) : intacts, lettres normales.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 2 rouges (`mv-harnais-rsv3` et sa contre-épreuve).

### 407f. La leçon
**Une propriété qui regroupe plusieurs réglages se remplace entière.** Poser `tabular-nums` « en plus » efface `lining-nums` — on croit ajouter, on retire. Pour `font-variant-numeric` comme pour `font`, `background` ou `border`, on redit tout ce qu’on veut garder.
