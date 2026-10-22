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

## 408. REVUE-8 — LA REVUE, LOT 3 (1/2) : RIEN À MESURER N’EST PAS « 100 % » (21/10 — `src/app.js` · `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-kit2.mjs` · **APP 9.68 → 9.69, SW 10.47 → 10.48**, base `203aa81`)

### 408a. La demande
Le lot 3 de la revue complète (§406a, défaut 5) : l’Accueil d’un domaine qui démarre — et la démo — affichait « Avancement 100 % » à côté de « 0 parcelle » et « — ha ». Partie 1 : « — » quand il n’y a rien à mesurer. Partie 2 : une démo garnie, maquette du contenu d’abord.

### 408b. Ce qui est livré
- **L’Accueil** : `getHomeCardData` calculait `totalSurfTaches>0 ? … : 100` — sans surface de travaux, la saison était « faite à 100 % ». Il renvoie désormais `rienAMesurer` et une valeur de 0 (pas 100 : `reglages.js` lit ce nombre, « 0 % accompli » est juste). La tuile « Avancement » affiche « — » ; la carte « Avancement de la saison » affiche « — » et la pastille « À venir » (au lieu de « Terminée » en vert).
- **Le Pilotage** (`_pilData`) : `totalTotal>0 ? … : 100` → `gaugeVide`, valeur 0 ; la jauge des travaux et la tuile « Carte du domaine » disent « — ». Le cockpit reçoit 0 : « Travaux 0 % · 0 h faites sur 0 h » — cohérent ; y écrire « — » demanderait de toucher son compteur animé (`#ck-ph-trav`), laissé.
- Les autres « … : 100 » du code (la part des cuves sans alerte, la couverture du planning…) disent « tout va bien » quand il n’y a rien à surveiller : laissés, ce n’est pas un avancement.

- `mv-harnais-kit2` (KIT-2, §227) cherchait la tuile écrite `pctGlobal+'\u00a0%'` : il attend désormais la forme qui dit « — » quand rien n’est à mesurer (vu par le premier passage de la chaîne : 2 rouges, le contrôle et sa contre-épreuve).

### 408c. Vu
`accueil-ouvrier` (« — Avancement · 0 Parcelles · — ha »), `pilotage` (« Travaux 0 % · 0 h faites sur 0 h »), `accueil`.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 2 rouges (`mv-harnais-kit2` et sa contre-épreuve), puis un passage coupé à la fin d’un message (289 commandes, sans rouge).

### 408d. La leçon
**« Rien » n’est ni 0 % ni 100 %.** Une division par zéro rattrapée par un 100 « par défaut » transforme l’absence de travail en travail fini. Le bon défaut est un état à part, dit tel quel : « — », « À venir ».

## 409. REVUE-9 — LA VISITE DE DÉMO SANS « MISE EN ROUTE » (21/10 — `src/app.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · **APP 9.69 → 9.70, SW 10.48 → 10.49**, base `1a13c3b`)

### 409a. Une correction de la revue
Le défaut 5 de la revue complète (§406a, « la démo est vide ») venait de **l’outil de captures** : il tourne sans réseau. La vraie visite — le lien public `?demo=visite`, qui pose le domaine `domaine-dupont` (firebase.js) — se connecte au compte de démo (`fbLoginDemo`) et charge ses données depuis la base (`_fbLoadAfterAuth`) avant le scénario (`_visiteScenario`, qui place justement les parcelles autour de Gevrey-Chambertin, Brochon et Fixin pour la météo par secteur). Le fichier `public/mavigne_demo_data.json` (8 parcelles) n’est lu par aucun code : une ancienne copie. Écrit à Nico, la maquette de la « démo garnie » suspendue, l’accès à la visite expliqué (le canal `refonte` + `?demo=visite`, dans une fenêtre privée : la visite fait basculer le navigateur sur le domaine de démo).

### 409b. Ce que Nico a vu, ce qu’il a décidé
Sur le canal `refonte`, la visite affichait « Mise en route » sur l’Accueil (le nom du domaine, et d’autres étapes d’installation) : « ce n’est pas abouti ». Décisions : **la carte reste neutre** (une démo garnie se placerait en plaine sans nom), **« Mise en route » est cachée** dans la visite.

### 409c. Ce qui est livré
`renderHomeDemarrage` : quand `currentUser._isVisite`, le bloc « Mise en route » est caché (comme pour un ouvrier). Le vrai Accueil d’un domaine ne change pas. (Premier passage de la chaîne : 1 rouge, le preflight — le `catch(e){}` vide de cette garde ; il appelle `window._mvAvale`, comme tout `catch` du code.) Vu : l’Accueil de la visite (outil de captures) — « Mise en route » absente, « Ma part du chantier » et « Avancement de la saison » à la suite.

### 409d. Ouvert
- Les autres signes d’un domaine « pas fini » dans la visite : le bandeau « N choses à compléter » du Pilotage (`_pilDiag`) relit les données du domaine de démo (un taux horaire absent, un exercice comptable…) — mieux vaut **compléter les données de démo** que cacher le diagnostic, qui est une fonction à montrer. À voir avec Nico sur la visite en ligne.
- Une **copie hors ligne des données de la démo** pour `mv-captures`, pour que les revues voient ce que voit un visiteur.

- **Chaîne** : **471 commandes, 0 rouge** au dernier passage, joué d’un trait après le dernier changement de code. Avant : 1 rouge (le preflight : un `catch` vide), puis un passage coupé à la fin d’un message (315 commandes, sans rouge).

### 409e. La leçon
**Un outil de revue a ses angles morts : les nommer avant de conclure.** Les captures tournent sans réseau ; tout ce qui vient de la base y est absent. Avant d’appeler « vide » un écran, vérifier d’où viennent ses données.

## 410. REVUE-10 — LA REVUE, LOT 4 : LES FINITIONS (21/10 — `index.html` · `src/tracteur.js` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · **APP 9.70 → 9.71, SW 10.49 → 10.50**, base `ffd28aa`)

### 410a. La demande
Le lot 4 de la revue complète (§406a) : 8. les filtres du Tracteur ; 9. Planning › Les gens sur ordinateur ; 10. le liseré doré des fenêtres en sombre ; 11. l’aplat vert « Saison en cours » des Réglages. Et ce qui restait vu au §407 : le titre « Campagne… » des Réglages, toujours en capitales.

### 410b. Ce qui est livré
- **Les `<style>` d’`index.html`** avaient échappé au passage en lettres normales (§407 : la feuille, les règles injectées et les styles écrits sur place, pas ces blocs-là). 5 règles → `text-transform:none`, espacement à 0 : `.cmp-head .t` (le titre « Campagne 1 mars → … » des Réglages), `.arc-lab .y em`, `.arc-kpi .l`, `.arcan-yh em` (les Archives), `.per-badge`. L’écran de lancement (`#sp-sub`) garde ses capitales.
- **Le Tracteur** : le « Conducteur » en pointillés au bout de la rangée des conducteurs n’était pas un libellé mal placé — la revue s’était trompée — mais le **bouton d’ajout** (`openAddConducteur`), un `<div>`. → `<button type="button">` « + Conducteur », `aria-label="Ajouter un conducteur"`.

### 410c. Écartés après vérification
- **9. Planning › Les gens sur ordinateur** : à partir de 1 024 px, la fiche du premier salarié se range d’office à droite de la liste (`_plGensDock`, PLAN-2 §280) ; la capture de la revue était prise avant (celle de `planning-demande`, qui attend, la montre). Pas un défaut.
- **11. L’aplat vert de la frise des Réglages** : chaque période a sa couleur (`_cmpCouleur`) — un type, pas un état ; dans l’outil de captures, la seule période (« Saison en cours », le nom par défaut d’un domaine sans données) tombait sur le vert. Pas un défaut.
- **10. Le liseré doré des fenêtres en sombre** : sa règle n’a pas été trouvée (ni `.modal`, ni ses ombres, ni les règles du thème sombre en tête de la feuille). À identifier sur l’appareil, avec l’inspecteur du navigateur.

### 410d. ⚠️ L’ordre des lots
Un premier jet de ce lot avait été préparé par-dessus REVUE-9, livré mais pas encore poussé : l’emballer aurait mêlé deux lots et déclaré une base fausse (`mv-base` l’aurait refusé chez Nico). Arrêté, dit à Nico ; refait ici sur `ffd28aa`, une fois REVUE-9 poussé.

### 410e. Vu
`tracteur` (« + Conducteur » au bout des filtres), `reglages` (le titre de la campagne).

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement de code.

### 410f. La leçon
**Un balayage n’est complet que s’il connaît tous les endroits où vit la règle.** La feuille, les règles injectées, les attributs `style` — et les blocs `<style>` d’`index.html`, oubliés au premier passage. Lister les sources avant de balayer.

## 411. BACKLOG-1 — LE BACKLOG AUDITÉ ET RANGÉ (21/10 — `CLAUDE.md` (§28) · `docs/claude/backlog-archive-2026-10-21.md` (nouveau) · pas de bump, base `5f2996a`)

### 411a. La demande
Après la revue complète (§406-§410), Nico demande « ce qu’il reste à faire en tout, exactement ». Le §28 comptait 75 rubriques « ce qui reste ouvert », 236 points, jamais repassés depuis l’audit du 16/08 (§44) — certains déjà réglés (exemple : il demandait d’écrire un contrôle du contraste qui existe). Conseil donné : le repasser point par point contre le code, rayer ce qui est fait, rendre une liste courte. Nico : « on suit ton conseil ».

### 411b. La méthode
Les 236 points découpés et triés : 18 déjà marqués faits, 47 vérifications à faire chez Nico, 171 lus un par un. Quinze points vérifiés dans le code le 21/10 : le contrôle du contraste existe ; `.val-toggle` n’a aucun emploi ; `avecBureau` est en place (la masse salariale et les bureaux) ; `toISOString().slice(0,10)` : 14 (64 au 16/08) ; `catch` vides : 20 (193) ; couleurs en dur dans les JS : 4 224 (3 319) ; `mvDate()`/`mvNum()`, le rôle `pil:true`, le contrat « tâcheron » : 0 ; `.pil-cr-note` toujours caché au téléphone ; « Solde cumulé » et « Reste à prendre » coexistent ; le Cuvier dit encore « la colonne reste vide » ; `_pecZeros` encore appelé deux fois ; `mv-harnais-cuvier-correction.mjs` toujours là, hors chaîne ; `demarrage.html` 939 lignes ; 17 points de rupture dans la feuille ; les modules les plus lourds (`utils.js` 979 ko, `app.js` 925, `pilotage.js` 911, `cave.js` 667).

### 411c. Ce qui est livré
- **Le §28 réécrit** : un bloc d’alerte (le contrôle de la doc exige que le §28 s’ouvre sur un ⚠️), puis six paquets, une ligne par point avec son lot d’origine — **1. à vérifier chez Nico** (par module), **2. gestes hors code** (déploiements dans l’ordre, règles Firestore, installation à blanc, données d’août), **3. décisions** (douze questions), **4. petites suites techniques** (dont la dette re-mesurée), **5. chantiers** (le site internet, le déploiement général, la cave, « Pourquoi on le fait », le Pilotage…), **6. commercial et juridique** — et la liste de ce qui est rayé, avec sa raison.
- **L’archive** : le §28 d’avant, mot pour mot, dans `docs/claude/backlog-archive-2026-10-21.md` (896 lignes → 60 dans `CLAUDE.md`).

- **Chaîne** : **471 commandes, 0 rouge**, jouée d’un trait après le dernier changement.

### 411d. La leçon
**Un backlog qu’on ne fait qu’allonger finit par mentir.** Chaque lot y posait ses restes ; personne ne rayait. Repasser la liste contre le code — pas contre la mémoire — est un lot à part entière, à refaire de temps en temps.

## 412. COLLE-1 — « EN DIRECT » AU-DESSUS D’« À SAVOIR », PLUS RIEN SOUS LE BANDEAU (21/10 — `src/cockpit-vue.js` · `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, aide) · `guide/11-pilotage.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-colle1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-auj1.mjs` · `scripts/mv-harnais-auj5.mjs` · `scripts/mv-harnais-auj6.mjs` · **APP 9.71 → 9.72, SW 10.50 → 10.51**, base `57007cc`)

### 412a. La demande
Nico (capture, PC) : « À savoir se cache derrière le bandeau sup, et En direct j’aimerais qu’il soit dans la même colonne que À savoir, en haut (mais dans son emplacement distinct), et qu’il ne soit pas caché non plus par le bandeau. Fais une maquette. » Puis, sur la maquette : « le En direct, il faut qu’il reste de la taille d’une journée calme avec possibilité d’extension s’il y a beaucoup d’infos. »

### 412b. La cause, mesurée dans la vraie appli
Appli construite, démo, 1 518 × 726 (son écran : 1 912 px à 125 %). Après 700 px : le bandeau `.mod-header` occupe 0–118 px — collant à top:0, z-index 80, la règle globale que TETE-2 a donnée au Pilotage le 14/10 ; la barre d’onglets se colle à 0 px (z-index 60) et le fil de portée aussi (34) : dessous ; « À savoir » se colle à 75 px — `colleHaut` (AUJ-6, le 11/10, trois jours avant TETE-2) ne mesure que le fil et les onglets. Au point du titre d’« À savoir », l’élément du dessus est le bandeau. Au passage : `--pil-portee-h` n’est jamais posé sur Aujourd’hui (`_pilStickyH` n’est appelé que par `_pilPortee`) — les onglets se collaient donc à 0 px, sur le fil.

### 412c. La maquette
Publiée en page : la vraie feuille (styles.css construite, polices embarquées), deux instantanés de la vraie page (démo, données fictives injectées au niveau du modèle du cockpit : 14 parcelles avec contours, six chantiers d’hiver, une journée calme et une chargée), le bloc proposé au rang où il entre dans la feuille ; bascules Avant / Après, Journée calme / chargée, Clair / Sombre. Mesurée elle-même au Chromium. Deux tours : la colonne (« oui ») ; puis « En direct » à la hauteur d’une journée calme, fondu, « Tout voir (N) » en haut à droite (« oui »).

### 412d. Ce qui est livré
- **styles.css** — bloc ★ COLLE-1, AVANT TETE-2 (qui reste le dernier) : sur ordinateur et tablette (`min-width:760px` et `min-height:600px`), `body #page-pilotage .pil-tabsbar{top:var(--pil-entete-bas)}` ; la colonne de droite bornée à l’écran, qui défile seule, 8 px de marge intérieure compensés au-dehors (l’ombre des cartes, la pastille « Nouveau ») ; plus de liste qui défile dans « À savoir » ; « En direct » plafonné à 186 px (la hauteur mesurée d’une journée calme sur 280 px de large), fondu `::after` quand `.deborde`, sans plafond quand `.ouvert` ; le bouton en haut à droite, 28 px. `flex:none` sur les deux cartes : la colonne est une boîte flexible bornée, la carte coupée y était écrasée à 42 px (vu au rendu de la maquette).
- **cockpit-vue.js** — `RANGS` : « En direct » en tête de la colonne C (large et moyen ; le téléphone inchangé) ; `colleHaut` compte `#page-pilotage .mod-header` ; `filTaille()` (la mesure `scrollHeight > clientHeight + 4`, le bouton, « Tout voir (N) » / « Replier », `aria-expanded`), appelée par `ranger`, par `majFil` (et 520 ms plus tard, les lignes animées posées) et par le geste ; ailleurs (téléphone) le bouton d’avant, « Tout le fil » au-delà de quatre faits ; l’observateur suit aussi le bandeau.
- **pilotage.js** — `_pilEnteteBas()` mesure le bas du bandeau (son `top` calculé plus sa hauteur : la barre de démo ou d’essai comptent) et pose `--pil-entete-bas` ; une page cachée (hauteur 0) ne l’écrase pas. `_pilEnteteSuivre()`, à la fin de `renderPilotage`, branche un ResizeObserver — jamais depuis son propre rappel (`observe()` relance un premier rappel : la boucle).
- **L’aide** (fiche `MV_AIDE` du Pilotage) et **le guide** (`guide/11-pilotage.html`) : « En direct » puis « À savoir », visibles en descendant ; la hauteur d’une journée calme et « Tout voir ». Le guide disait « dessous, le fil En direct » — faux déjà avant ce lot (le fil était à gauche). La bulle `pil.fil` relue : rien à changer. `_mvtSteps` et les tutos : rien ne vise la place d’« En direct ».
- **WHATS_NEW 9.72** (admin).
- **La base** : préparé d’abord sur `5f2996a` et resté inachevé (chaîne non jouée, pas de marque) ; BACKLOG-1 (§411, la doc seule) a pris le numéro entre-temps. Repris sur `57007cc`, renuméroté §412 ; le §28 neuf reçoit ses restes dans ses paquets (à vérifier chez Nico, décisions, petites suites).

### 412e. Les contrôles
`mv-harnais-colle1` (neuf, dans la chaîne) : 27 vérifications — RANGS (trois tailles), `colleHaut`, les appels de `filTaille`, le geste, l’observateur ; `filTaille` EXÉCUTÉE (chargé replié, déplié, calme avec l’arrondi, téléphone avec 7 et 3 faits) ; `_pilEnteteBas` EXÉCUTÉE (posé, décalage de la barre de démo, page cachée), sans `observe()` ; le bloc avant TETE-2, ses règles, ses accolades ; l’aide et le guide ; l’inscription. Contre-épreuve : 21/21 défauts vus. `mv-harnais-tete2` : vert. **Trois contrôles d’autres lots citaient l’ancienne disposition mot pour mot**, trouvés par la chaîne entière : AUJ-1 (la phrase du guide « le fil En direct : en haut, qui est où… »), AUJ-5 C2 (la ligne `moyen` de `RANGS`), AUJ-6 C5 (`colleHaut` sans le bandeau). Même intention, nouvelle phrase : ils suivent, et leurs contre-épreuves rougissent toujours (AUJ-5 9/9, AUJ-6 12/12).

### 412f. Vu
La vraie appli construite (démo, données fictives), 1 518 × 726 : après 700 px, onglets à 118–177 px, colonne collée à 193 px, « En direct » 186 px avec « Tout voir (10) », titre d’« À savoir » à 424 px, visible ; déplié 1 105 px, « Replier », la colonne défile ; replié, 186 px ; calme : 185 px, pas de bouton, « À savoir » à 423 px ; sombre identique ; 1 280 × 800 (deux colonnes) identique ; 390 × 844 : inchangé (le fil à sa place d’avant, les onglets sous le bandeau comme avant). **Remesuré sur `57007cc`, l’appli construite après le dernier changement : les mêmes chiffres.**

- **Chaîne** : **473 commandes, 0 rouge**, jouée d’un trait après le dernier changement. Avant : un passage arrêté sur AUJ-1, un autre sur AUJ-5, puis le reste joué sans s’arrêter n’a montré qu’AUJ-6.

### 412g. La leçon
**Une mesure faite avant un changement de décor ne le connaît pas.** `colleHaut` comptait ce qui collait le 11/10 ; le 14/10, TETE-2 a posé un bandeau collant au-dessus de tout — aucune des deux n’était fausse, leur somme l’était. Mesurer tout ce qui colle au moment où l’on colle, et remesurer quand ça change de taille. **Et un lot n’est pas fini avant que la chaîne entière ait tourné** : le harnais du lot était vert, trois contrôles anciens qui citaient le code mot pour mot ne l’étaient pas.

## 413. ★★ HLHA-1 — LE hL/ha DE CHAQUE CUVÉE, ET LE RENDEMENT PAR APPELLATION : CE QUI SE DÉCLARE (21/10 — `src/cave.js` (`_mlCuvSurf`, `_mlAocRdt`, `_mlAocHtml` neufs ; `_pcrbCvCellules`, `_pcrbCvCelHtml`, `_mlCuvFicheHtml`, `_mlRenderParc`, `_pcavInjectCss`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave, MV_INFO `cave.cuvees` et `cave.aoc` neuve) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-hlha1.mjs` (neuf) · `scripts/mv-harnais-range1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/*` · `.mv-base` · `lots/HLHA-1.json` · **APP 9.72 → 9.73, SW 10.51 → 10.52**, base `825a51e`)

### 413a. La demande, et ce qui a été vérifié
Nico (15/10) : dans Le millésime, « en plus des kilos par hecto, on indique les hectos par hectare ». Reformulé — le hL/ha sous le kg/hL de la fiche d’une cuvée, sur la part du domaine des parcelles de la cuve, au prorata des kilos quand une parcelle est partagée — : « exactement ». Puis : en Bourgogne au moins (« regarde pour le reste de la France »), pour les assurances comme pour tout le monde, on déclare en hL/ha par appellation. Recherche, sources publiques :
- **La déclaration de récolte** (service « Vendanges » des douanes depuis 2025, ex-« Récolte ») se remplit par appellation et par couleur : surface de récolte (ligne 4), volume (ligne 5), rendement constaté = ligne 5 / ligne 4, en hL/ha ; le raisin vendu y figure en volume de vin obtenu (ligne 6) ; une surface non récoltée porte un motif (ligne 22). Lu dans la présentation de l’ODG des Côtes de Bourg (récolte 2024, et sa note « Vendanges » 2025) et les récapitulatifs de revendication des Côtes du Rhône (par appellation et par couleur).
- **Le rendement autorisé s’apprécie sur l’exploitation** : à Bourgueil, le volume autorisé est le rendement moyen à l’hectare de l’exploitation multiplié par sa surface en production (note INAO). Au-delà de 20 % de pieds morts ou manquants, le rendement autorisé d’une parcelle baisse d’autant (Côtes de Bourg).
- **Exceptions** : la Champagne fixe un rendement en kg/ha (8 800 kg/ha pour la vendange 2026) ; les eaux-de-vie (Cognac) comptent en hL d’alcool pur par hectare.
- **Les assurances** (aide de solidarité nationale, annexe 1B) reprennent les rendements des déclarations de récolte, en t/ha ou hL/ha, et retiennent la meilleure des moyennes : trois ans, ou olympique sur cinq.
Proposé à Nico : « Par appellation » en tête de Parcelles, par appellation et par couleur, tout le raisin vendu compris sur toute la surface, comme la déclaration. Réponse : « go » (avec « relis les fichiers » — 65 commits étaient passés depuis la première base, `372df98`).

### 413b. Lu avant d’écrire
- `_mlRendements` (cave.js) donne déjà, par parcelle, tout son raisin sur toute sa surface (VD-3), la fourchette tant que rien n’est mesuré, et le maximum (parcelle › appellation › hérité). REC-1 (§382) en a fait la seule source des Récoltes.
- `_vendSurfParc` (cuvier.js) connaît déjà la surface du domaine sur une parcelle vendue en partie : la surface achetée retirée, `reste-prorata` quand aucune n’est saisie.
- **Pilotage › Économie › Revient a déjà un « Par appellation » avec un hL/ha** (`_pecRevCalc`) : il projette les parcelles pas encore récoltées (leur historique, à défaut la moyenne de l’appellation) pour chiffrer une bouteille. Ce n’est pas le chiffre à déclarer ; les deux se rejoignent quand tout est rentré.
- La couleur d’une parcelle existe (`_parcCoul` : le cépage, ou le choix fait dans les Maturités, MATU-1) ; le maximum d’une appellation par millésime aussi (`_vendAocMax`, réglé dans la roue crantée de la Cave depuis CAVEREG-1).
- Depuis la série CHARTE : un encadré prend `.mvencadre` ; une surface s’écrit par `window._mvHaP` (une parcelle, au centiare) ou `window._mvHaT` (un total, au centième) — KIT-4.

### 413c. Ce qui est livré
- **La fiche d’une cuvée** : `_pcrbCvCellules(…, ha)` pose le hL/ha sous Entonné et Bouteilles, sur le vin de la cuvée seul (l’apport en sort, comme du kg/hL) ; `_pcrbCvCelHtml` l’écrit sous le kg/hL. La surface : `_mlCuvSurf(cuveId, mil)` — la part du domaine de chaque parcelle de la cuve (`_vendRdtParc` → `_vendSurfParc`), au prorata de ses kilos quand elle est partie dans plusieurs cuves ; les kilos du seul millésime (ceux que `_vendSurfParc` met en face) ; `null` si une parcelle n’a pas de surface du domaine connue. La fiche lit la cuve de la chaîne (`ch.cuveId`). « D’où vient la cuvée » écrit la surface comptée (« 0,7500 sur 1,0000 ha » quand elle diffère de la parcelle), le total (les kilos des seules parcelles comptées), un encadré « attention » pour une surface inconnue, un encadré « informer » pour une part estimée au prorata. Les lignes de la liste ne portent pas de hL/ha (elles ne passent pas de surface).
- **La vue Parcelles** : en tête, « Par appellation » (`_mlAocRdt`, `_mlAocHtml`) — une ligne par appellation et par couleur (deux lignes seulement quand l’appellation porte les deux) : surface récoltée, volume et kilos, hL/ha (un chiffre s’il est mesuré, sinon la fourchette), le maximum de l’appellation pour le millésime (à défaut celui que portent toutes ses parcelles, et la ligne le dit), l’état (mesuré, N % mesuré, estimé). Encore sur pied et sans surface : comptés sur la ligne, hors du calcul. « Sans appellation » en dernier, sans maximum, avec le chemin du rattachement. Les cellules sont celles de la liste des parcelles : mêmes colonnes sur ordinateur.
- **L’aide** : MV_AIDE (Le millésime, la chaîne), MV_INFO `cave.cuvees` (un paragraphe) et `cave.aoc` (neuve, sa pastille sur le bloc), guide 08, WHATS_NEW 9.73 (niveau 1, `#ml-tab-parc`). La visite guidée et les tutos ne changent pas : aucun geste neuf.

### 413d. Arbitrages
- **Deux surfaces, deux questions** : la cuvée lit la part du domaine (ce qu’il a mis en cuve) ; l’appellation lit toute la surface, raisin vendu compris (ce que dit la déclaration). Chacune l’écrit dans sa fiche « i ».
- **Le maximum de l’appellation, pas celui des parcelles** : l’arrêté vise l’appellation ; une parcelle au-dessus ne fait pas, à elle seule, un dépassement. La liste des parcelles reste dessous, telle quelle.
- **Une appellation en deux couleurs, un seul maximum** : la donnée n’en porte qu’un par appellation. Deux maximums (rouge et blanc) : déclarer deux appellations, ce que la fiche « i » dit — ou un réglage par couleur, décision au §28.
- **Pas de « ≈ » neuf** (hors du sous-ensemble de la police, `mv-harnais-subset`) : l’état écrit « estimé ».
- **Pas d’unité régionale** (kg/ha en Champagne) : aucun client concerné ; au §28.

### 413e. Mesuré
- `mv-harnais-hlha1.mjs` (neuf) : **23 vérifications** sur les vraies fonctions (cave.js et cuvier.js réunis, les formateurs de utils.js ; décor : échappement, droits, icônes, `_caveVolL` jamais atteint) — la fiche (13), le bloc (10) ; **22 contre-épreuves**, toutes rougissent. Une assertion fausse en route : une fourchette dont le bas vaut « 40 » s’écrit sans décimale (`_mvF1`) ; le motif l’exigeait.
- `mv-harnais-range1.mjs` : charge `_mlCuvSurf`, `_mlAocRdt`, `_mlAocHtml` et leurs dépendances (couleur, appellation, formateurs) — sinon le `catch` de la vue Parcelles aurait avalé leur absence — 21 + 19/19.
- Rejoués verts à part : cave-mil, courbes, rdtmil, vol1, info, subset, icones, kit4, cartes, pastilles, boutons, charte, police, echelle, whatsnew-check, version. Chaîne : 475 commandes, 845 s ; deux rouges à la première passe, levés dans le lot — `harnais-claude-md` (le harnais neuf pas encore nommé dans la doc : il l’est au §413) et `build-guide --check` (le guide change : vert après `npm run site`, `public/guide.html` dérivé non livré).
- **Non vérifié** : aucun navigateur, ni ses données (les couleurs de ses parcelles, ses appellations rattachées) ; `test:smoke`, `test:e2e`.

### 413f. Ouvert
§28 : paquet 1 (le regard sur ses données), 3 (un maximum par couleur), 4 (pieds manquants, « au-dessus » sur une fourchette, deux cuves dans une cuvée), 5 (l’unité régionale).

## 414. ★★ VIF-1 — AUJOURD'HUI SE MET À JOUR EN DIRECT ; LES PASTILLES D'ALERTE DE LA BARRE ; TROIS DÉFAUTS D'AUJOURD'HUI (21/10 — `src/pilotage.js` (`window._pilRafraichirVif`, `window._ckSavoirFort`, `_pilStickyH` sur Aujourd'hui) · `src/cockpit-vue.js` (`_ck2Maj`, ligne d'allure) · `src/coquille.js` (`window._railAlertes`, `window._railAlertesMaj`) · `src/cockpit.js` (absences) · `src/app.js` (`_prioRedessine`, `_renderAfterSaison`) · `src/styles.css` (fil de portée) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/11-pilotage.html` · `guide/01-demarrer.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-vif1.mjs` (neuf) — APP 9.73 → 9.74 · SW 10.52 → 10.53 — base `a872e62`)

### 414a. La demande

Nico (21/10), sur le bilan du chantier cockpit : « go » pour les trois points restants — les pastilles d'alerte de la barre
latérale, la mise à jour en direct de la maquette (jamais branchée : `_ck2Maj` n'avait aucun appelant) et les trois défauts
d'Aujourd'hui notés au backlog (§28, paquet 4).

### 414b. Ce qui change

- **En direct.** `_prioRedessine` et `_renderAfterSaison` (les deux chemins qui redessinaient le Pilotage quand les données
  changent) appellent d'abord `window._pilRafraichirVif()` : si Aujourd'hui est à l'écran (`_PIL_TAB === 'auj'`, `#ck-page`
  présent), le modèle est recalculé par les MÊMES fonctions que `_pilTabAuj` (`_pilData`, `_pilMargeCalc`, `_pilCk2Modele`,
  `_pilCk2Eco`) et `_ck2Maj` met à jour ce qui change (`majTout` : la date qui roule, les barres, le fil, le plan, la courbe,
  la vue Économie). Les parcelles qui viennent d'être faites ou commencées ont leur `onde`, retrouvées par leur NOM (le
  plan peut renuméroter ses parcelles). Sinon : le Pilotage se redessine comme avant. Rien n'exige que les téléphones de
  l'équipe soient à jour : l'écran admin reçoit ce que la base lui envoie.
- **Pastilles de la barre** (`_railAlertes`, sources existantes seulement) : Tracteur = engins en réparation
  (`REPARATEUR`, le registre du Pilotage) ; Cave = ce qui presse (verdict « dû » de l'agenda, comme la carte Cave) ; pour
  l'admin, Planning = contrats qui finissent dans les 30 jours, Pilotage = points prioritaires d'« À savoir » (compté par
  `_pilCk2Modele`, donc dès qu'Aujourd'hui se calcule — l'admin y arrive à l'ouverture). Aucune pastille à zéro ; « 9+ »
  au-delà ; une étiquette qui dit ce qu'elle compte. Repeintes à la construction de la barre et par le temps réel.
- **Trois défauts** : « Sophie absent » → « Absence de Sophie » (la fiche ne porte pas le genre) et « Puis absence » ; un
  objectif déjà passé n'a plus de ligne d'allure (elle partait vers la gauche, sur la colonne voisine) ; le fil de portée
  est collé sous le bandeau et les onglets sous les deux (`--pil-portee-h` posé aussi sur Aujourd'hui, à son montage et à
  chaque mise à jour en direct).

### 414c. Mesuré

- **`mv-harnais-vif1`** (neuf) : 13 assertions (pastilles exécutées sur le vrai `coquille.js`, absences sur le vrai
  `cockpit.js`, le reste lu) et 8 contre-épreuves.

### 414d. Ouvert

- À voir chez Nico : la mise à jour en direct pendant qu'un salarié valide (un autre téléphone) ; les pastilles avec ses
  données ; le fil de portée collé sur ses autres onglets du Pilotage (il l'est maintenant partout sur ordinateur) ; la
  tablette.
- Les autres pastilles possibles (Phyto : délai avant récolte, Vigne : ce qui attend une validation) : à décider.

## 415. ★ ETATS-1 — DES ÉTATS FRANCS SUR LES PLANS ; QUATRE FINITIONS DU PILOTAGE (21/10 — `src/styles.css` (jetons `--et-*` du bloc `.ck2`, formes `.mv-fo`, hachures, bloc ETATS-1) · `src/cockpit-vue.js` (motif hachuré, `indiceSeg`) · `src/cockpit.js` (`_ckPlanLire`) · `src/pilotage.js` (`.pil-cr-note`) · `src/utils.js` (APP, WHATS_NEW) · `guide/11-pilotage.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-etats1.mjs` (neuf) — APP 9.74 → 9.75 · SW 10.53 → 10.54 — base `c07f335`)

- **Demande** (Nico, 21/10) : « renforcer la couleur des indications sur les cartes des parcelles […] on a du mal à faire la
  différence entre fait, à faire, arrachée » ; et « ok » pour les finitions proposées.
- **Cause mesurée** (rendu navigateur des cinq états, clair et sombre) : les fonds d'état étaient des teintes « douces »
  (`--ok-doux`, `--presse`, `--survol`, `--danger-doux`), et **« en cours » suivait `--encours`, un GRIS NEUTRE** depuis la
  charte de la refonte (#4F4D48 / #C9C7C1) : en cours, à faire et arrachée se confondaient.
- **Correction** : fait = 46 % de `--ok`, en cours = 48 % de `--attention` (ambre), en retard = 44 % de `--danger`, mêlés au
  fond de carte ; à faire = fond de carte cerné de `--texte-doux` ; arrachée = fond gris (`.ck-hach-f`) sous des hachures
  appuyées. Les mêmes mélanges sur les formes `.mv-fo` (carte de l'Accueil, fiches). Tout par jetons : le thème sombre suit.
- **Finitions** : le choix de la tâche du plan a un fondu au bord quand il défile (`indiceSeg`, AUJ-6) ; `.ck-ch` en
  `border-box` (100 % + 16 px plus sa marge intérieure débordait de 8 px, CADRE-1) ; « cliquez une campagne » : la phrase reste
  HORS de la barre collante au téléphone (choix de CARTE, gardé par `mv-harnais-carte` — l'essai de la remettre l'a fait rougir),
  et le mode d'emploi du zoom est dit dans l'aide du Pilotage (la piste du backlog) ;
  une parcelle « en cours » sans entrée « En cours » (arrachage en étapes) prend la dernière entrée de la tâche dans la
  période pour dire qui y travaille (DIRECT-2 : « Personne d'indiqué »).
- **`mv-harnais-etats1`** (neuf) : 10 assertions, 6 contre-épreuves.
- **Ouvert** : les cartes du Pilotage sans sous-titre (en-tête à deux étages, §42 de l'archive) — un travail d'écriture
  carte par carte, à faire avec la liste ; d'autres pastilles de la barre (Phyto, Vigne) — à décider par Nico.

## 416. ★★ ACCV-1 — LA CARTE DU JOUR DE L’ACCUEIL AU DESSIN DE LA MAQUETTE (21/10 — `src/app.js` (`_homePrioCarte` réécrite, `_homeDreLignes` neuve, `renderHomeDRE`) · `src/styles.css` (bloc ACCV-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/04-vigne.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-accv1.mjs` (neuf) · `scripts/mv-harnais-acc2.mjs` · `scripts/mv-harnais-hors1.mjs` · `scripts/mv-harnais-etats1.mjs` · `scripts/mv-harnais-liste.mjs` — APP 9.75 → 9.76 · SW 10.54 → 10.55 — base `91f5651`)

### 416a. D’où ça vient
Nico (21/10) trouvait l’Accueil Vigne « brouillon, en vrac, pas trié » et voulait le tableau de bord de l’ouvrier : un maximum d’infos sans entrer dans le détail. Maquette `maquette-accueil-vigne-v1.html` (hors dépôt, conversation du 21/10) : sept cartes dans l’ordre des questions du matin — Aujourd’hui, À savoir, Météo, La saison, Ma saison, Au tracteur, En direct ; sur ordinateur la journée à gauche et une colonne à droite comme Pilotage › Aujourd’hui. Réponse : « Go comme la maquette, point par point. Attention, il y a eu des mises à jour, relis les fichiers » (VIF-1, ETATS-1 relus : les couleurs d’état de la mosaïque sont celles d’ETATS-1, plus franches que la maquette, puisque c’est la dernière demande de Nico). Ce lot est le premier point : la carte du jour.

### 416b. Ce qui change
- `_homePrioCarte` rend la carte du jour dans `#home-prio-corps` (mêmes identifiants, même appel en fin de `renderHome`). L’ancienne pastille, `#home-eqj-wrap` et `#home-kpis` restent dans la page (leurs fonctions y écrivent : C11) mais sont cachés par le bloc ACCV-1.
- Tout ce qui vient d’ailleurs est lu SI la fonction existe (`_mvIcon`, `_mvEqDe`, `_mvPartCalc`, `_homeDreLignes`…) : la carte se dessine aussi dans les harnais qui l’extraient seule (ACC-2, FORME-2, HORS-1), et `<svg ` y reste compté par FORME-2.
- La petite victoire : les parcelles validées aujourd’hui et hier pour la tâche, une parcelle comptée une fois par jour, une entrée « Annulé » jamais.
- « En ce moment » : la dernière entrée « En cours » de la tâche, celle de l’équipe de l’utilisateur d’abord ; l’heure vient de `_hvHeure` (l’identifiant du journal). Sans parcelle en cours : « Reste à faire ».
- Les rangs dans les formes : traits verticaux tous les ~3,4 px à l’écran, coupés au contour par les intersections triées deux à deux (une équerre aussi).
- `_homeDreLignes(now)` : la règle du délai de rentrée sortie telle quelle de `renderHomeDRE`, qui la lit (une seule copie, §25.16).
- Plusieurs priorités : la carte montre celle de l’utilisateur (`_prioForMember`), comme les Parcelles.
- Le message de l’administrateur n’a ni auteur ni heure en base : la carte écrit « Le message de l’administrateur ». La maquette montrait « Marie, ce matin à 7 h 40 » — à poser avec l’enregistrement de la priorité (ouvert).

### 416c. Mesuré
- `mv-harnais-accv1` (neuf, branché) : 18 assertions sur les vraies `_homePrioCarte` et `_homeDreLignes` (priorité avec équipe, journal et formes ; délai de rentrée ; administrateur ; sans priorité ; sans rien ; bloc par jetons ; aide, guide, nouveautés) et 8 contre-épreuves.
- ACC-2 (10 + 9/9), HORS-1 (31 + 23), FORME-2 (21 + 11/11), ACC-1, ACC-3, KIT-2, ALIGN-2, Équipes du jour : verts. ACC-2 lit le titre et l’équipe à leur nouvelle place, et sa contre-épreuve « pourcentage en double » vise la branche sans priorité ; HORS-1 lit la légende comptée.
- **La chaîne complète a trouvé onze rouges que les harnais du lot ne voyaient pas, tous levés dans le lot** :
  · sept harnais (ARRIVEE-4, JALONS, PRESENCE-1, PREMIERES-1, RANGBOUT-1, CARTEDOM-1, SAISONIMG-1) lisent la feuille **de leur
  bloc jusqu’à `/* ★ TETE-2 (§329)`** et y refusent tout hexadécimal : le bloc ACCV-1, posé avant TETE-2, y tombait avec le repli
  `var(--ligne,#E7E6E2)`. Le repli s’écrit `var(--ligne,var(--gris-clair))` (`--ligne` est dans `SOCLE_LIBRE` du harnais des
  jetons : son repli n’a pas à redire une valeur). ★ **Leçon : un bloc posé avant TETE-2 entre dans la tranche de ces sept-là** ;
  · le jeu d’icônes (et sa contre-épreuve) : « la graisse du jeu est déclarée une seule fois » — un `stroke-width` posé sur un
  `.mv-ic` dans le bloc, retiré ;
  · ETATS-1 (et sa contre-épreuve) exigeait `APP_VERSION === '9.75'` : un cliquet à l’envers, qui rougit au lot suivant quoi qu’il
  fasse (§6c). Devenu « au moins 9.75 », le bloc 9.75 des nouveautés toujours exigé ; ses 6 contre-épreuves mordent.
  Avant cela, deux rouges de la première passe : les jetons (un `outline:none` de trop ; 125 appels du socle sans repli, qui faisaient
  monter le compte de 85 à 184) et le contraste (le fond de repli des initiales, `--texte-doux` sous du blanc en sombre → `--accent`).
- Vraie appli construite, captures téléphone et ordinateur, clair et sombre (`mv-captures`) : la carte s’affiche ; la démo des captures n’a aucune parcelle — la mosaïque est prouvée par les harnais, pas vue à l’œil. Une seule colonne quand il n’y a aucune parcelle (`hpc-sans-pan`).

### 416d. Ouvert
- **Lot 2** : la grille de la maquette — la journée à gauche, « À savoir » (délai de rentrée, pluie, vent, absences sans motif, présence notée, fin de contrat pour l’admin) et la Météo dans une colonne à droite qui reste visible si elle tient dans l’écran ; au téléphone, l’ordre des questions du matin.
- **Lot 3** : « La saison » (avancement par tâche, en cours puis à venir puis terminé) et « Ma saison » (ma part, ma semaine en hectares, les jalons) ; « Au tracteur » pour le tractoriste et l’admin.
- **Lot 4** : « En direct » (en cours en tête, « Tout voir »), « Personnaliser » sans « ranger » (masquer, afficher ; la carte du jour et « À savoir » toujours affichées ; l’admin propose son choix à l’équipe), états vides et squelettes ; retrait des anciens blocs et de leurs règles (ACC-1, ACC-2, ALIGN-2 à suivre).
- L’auteur et l’heure du message de priorité, à enregistrer avec lui.

## 417. ★★★ ACCV-2 — L’ACCUEIL VIGNE EN SEPT CARTES, AU DESSIN DE LA MAQUETTE : LES LOTS 2 À 4 ENSEMBLE (21/10 — `src/app.js` (`renderHomeSavoir`, `_accSavoirItems`, `renderHomeSaison`, `renderHomeMoi`, `renderHomeTrac`, `renderHomeDirect`, `_accZones`, `_accColle`, `HOME_RETIRES`) · `src/jalons.js` (deux expositions) · `index.html` (cinq cartes, bandeau de Personnaliser) · `src/styles.css` (bloc ACCV-2, après ACCV-1, avant TETE-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/04-vigne.html` · `public/sw.js` · `scripts/mv-harnais-accv2.mjs` (neuf) · `scripts/mv-harnais-acc3.mjs` · `scripts/mv-harnais-chant1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/tutos-couverture.json` — APP 9.76 → 9.77 · SW 10.55 → 10.56 — base `91f5651`, **zip cumulatif avec ACCV-1 non poussé**)

### 417a. D’où ça vient
ACCV-1 (§416) avait fait le premier point de la maquette, la carte du jour. Nico : « suite, et si tu pouvais faire en fait tous les lots en même temps, ça m’arrangerait » — la grille, « À savoir », la météo, « La saison », « Ma saison », « Au tracteur », « En direct » et Personnaliser, d’un coup.

### 417b. Ce qui change
- **Cinq cartes neuves**, des blocs `.home-w.hk` de la page (en queue de `HOME_WIDGETS` : les dispositions enregistrées gardent leur ordre, ALIGN-2 lit encore les six premiers). « Au tracteur » ne s’affiche que chez le tractoriste et l’administrateur ; « Ma saison » se cache en mode préparation (PREP-1).
- **« À savoir »** : le délai de rentrée en cours (la règle de `_homeDreLignes`, la même que la carte du jour), la pluie probable (au moins 50 %) avec ses heures lues dans la prévision horaire, le gel, le vent de journée (au moins 25 km/h) — des jours travaillés seulement (samedi et dimanche ne comptent pas, Nico 10/10). Des faits, jamais une décision (Nico, 11/10). Toujours affichée.
- **« La saison »** : le pourcentage de `getHomeCardData` (la règle d’avant), puis chaque tâche — en cours (ce qui reste en hectares et en parcelles), à venir (la date de début de la campagne, `echeances`), terminée ; rangées par date de début (Nico, 12/10) ; l’arrachage fini pour l’équipe en tête des terminées (ARRACH-9). Jamais d’heures.
- **« Ma saison »** : la part de la saison et les jours (`_mvTraceData`), les kilomètres de rangs (`window._mvJalons`), la part du chantier du moment (`_mvPartTache` + `_mvPartCalc`, la règle de « Ma part du chantier »), la semaine en hectares (une parcelle faite à plusieurs compte au prorata), les deux jalons les plus proches et le dernier gagné.
- **« Au tracteur »** : la dernière session de la personne, le compteur du tracteur et sa révision quand elle approche (50 h), la cuve de GNR (administrateur) ou ses sessions de la saison ; « Démarrer une session » (`_homeTracDemarrer` : le Tracteur, puis `openNewSession`).
- **« En direct »** : ce qui est commencé aujourd’hui et encore en cours (et les sessions du tracteur ouvertes), puis les validations par jour ; « Vous et Jean avez validé » ; la hauteur d’une journée calme et « Tout voir » (la règle de COLLE-1).
- **La grille** (`_accZones`, appelée en fin d’`applyHomeLayout`) : `#home-grille` > `#home-gauche` (la carte du jour, puis `#home-cols` et ses deux colonnes de KIT-2) + `#home-droite`. Au téléphone, les trois conteneurs passent en `display:contents` et l’ordre des cartes suit les questions du matin. La colonne de droite colle sous le bandeau (`--acc-haut`, mesuré) seulement si elle tient dans l’écran (`_accColle`).
- **Les huit blocs remplacés** (avancement, tâches, ma part, ma semaine, travaux mécaniques, raccourcis, délai de rentrée, derniers travaux) gardent leur code et leurs harnais : `HOME_RETIRES` leur pose `home-w-retire`, la feuille les cache. ★ **Choix assumé pour livrer d’un coup** : les retirer, c’était réécrire cinq harnais (ACC-1, ALIGN-2, ACC-3, ARRIVEE-1, ICONES) dans le même lot. C’est ACCV-3.
- **Personnaliser** : l’œil seul (la poignée, la taille et la largeur restent dans le code d’ALIGN-2, cachées) ; « À savoir » ne se masque jamais (`getHomeLayout`).
- La météo du vignoble et celle par secteur restent deux blocs, l’un sous l’autre dans la colonne de droite (la maquette les basculait dans une carte : à faire avec ACCV-3, ALIGN-2 lit leur balisage).

### 417c. Mesuré, et trouvé
- `mv-harnais-accv2` (neuf, branché) : 20 assertions sur les vraies fonctions (une semaine fixe pour le temps, la semaine réelle pour le journal : le harnais ne dépend pas du jour où il tourne) et 7 contre-épreuves. ★ **Il a trouvé un défaut à sa première passe** : une surface écrite « 0,5 » comptait 0 dans « La saison » et dans la semaine (un `parseFloat` nu) — lue maintenant comme `_homeSurf`.
- Le jeu d’icônes refuse toute taille hors 16/18/20/24/40 : les `14` des deux lots passent à 16 (ACCV-1 y échappait par l’alias `ico`, une faille du contrôle à noter).
- `mv-harnais-typo` : `app.js` enfle de plus de 5 % en un lot (907 → 961 ko, ACCV-1 compris) — cran regravé ; le découpage d’`app.js` (une `src/accueil.js`) est au backlog.
- ACC-1, ACC-2, ACC-3 (« En direct » à la place de « Derniers travaux » dans l’aide), ALIGN-2, KIT-2, ARRIVEE-1 et 4, PRÉSENCE-1, ANNONCES, PREP, ARRACHAGE, ÉQUIPES DU JOUR, JALONS, HORS-1, FORME-2, TETE-2, COLLE-1, ETATS-1, jetons, contraste, échelle, charte : verts.
- **La chaîne complète (483 commandes, 861 s) a levé neuf rouges, tous levés dans le lot** : la cible de la nouveauté (`#home-grille` naît du code, la vérification cherche un identifiant écrit dans la page → `#home-savoir`) ; les tutos (deux gestes neufs sans tuto : « Démarrer une session » appelle maintenant `goTo('tracteur');openNewSession()`, des fonctions qui existaient, et « Tout voir » est exempté avec sa raison dans `tutos-couverture.json`) ; CHANT-1 (sa phrase d’aide vivait sous « Avancement par tâche » : elle vit sous « La saison », le harnais suit) ; les jeux communs — ★ **les compteurs, l’étiquette, le bouton et le cadre des cartes passent au jeu (`.mvpas`, `.mvbtn`, `.mvcarte`)** au lieu de se peindre eux-mêmes (boutons, pastilles et cartes « maison » remontaient chacun d’un cran) ; une règle qui neutralisait le fond de `.cm-wx-carte` comptait comme une carte « maison » (le nom porte « carte ») : la carte des secteurs porte aussi `.mv-c`, la règle passe par elle. La carte du jour prend l’arrondi du jeu (8 px).
- Vraie appli construite et capturée (téléphone et ordinateur, clair et sombre, admin et ouvrier) : la grille, les deux colonnes, l’ordre au téléphone, les cartes ; la démo des captures n’a pas de parcelle (« La saison » et « Ma saison » y sont presque vides).

### 417d. Ouvert
- **ACCV-3** : retirer les huit blocs cachés et leur code (`renderHomeCard`, `renderHomeMaSemaine`, `renderHomeRaccourcis`, `renderHomeDRE`, la carte « Avancement par tâche », les travaux mécaniques, les derniers travaux) et faire suivre ACC-1, ALIGN-2, ACC-3, ARRIVEE-1 et ICONES ; une seule carte météo avec la bascule Vignoble / Secteurs.
- « À savoir » : les absences de l’équipe (sans motif) et, pour l’admin, les fins de contrat — `window._ckSvAbsences` lit les entrées du planning, que le téléphone d’un salarié ne reçoit pas (MOTIFS-1) ; « Ta présence est notée » reste sa propre carte en tête.
- L’auteur et l’heure du message de priorité (§416d).
- Découper `app.js` : l’Accueil dans sa propre feuille de code.
## 418. ★★ ACCV-3 — L’ACCUEIL VIGNE NETTOYÉ : LES ANCIENS BLOCS ET LEUR CODE RETIRÉS, L’ŒIL SEUL, UNE CARTE MÉTÉO À BASCULE (21/10 — `src/app.js` (vingt fonctions retirées, `_homeRenderGrips` réécrite, `getHomeLayout`, `renderHomeMeteoCommunes`, `window._homeMeteoVue` neuve, l’alerte gel retirée) · `index.html` (neuf blocs retirés, la carte Météo) · `src/styles.css` (bloc ACCV-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/04-vigne.html` · `public/sw.js` · douze harnais (`acc1`, `align2`, `arrivee1`, `acc3`, `accv1`, `accv2`, `prep`, `coh1`, `kit1`, `kit2`, `icones-contre`, `robustesse-accueil`) · `scripts/tutos-couverture.json` · la référence du preflight — APP 9.77 → 9.78 · SW 10.56 → 10.57 — base `91f5651`, **zip cumulatif avec ACCV-1 et ACCV-2 non poussés**)

### 418a. D’où ça vient
ACCV-2 (§417) avait caché les huit anciens blocs sans les retirer ; §417d en faisait le lot suivant. Nico : « suite ».

### 418b. Ce qui change
- **Retirés de la page** : l’avancement, Ma part du chantier, les heures, les sessions tracteur, les derniers travaux, les raccourcis, Ma semaine, le délai de rentrée, et le bloc « meteosect ». **Retirés du code** : `renderHomeCard` et ses aides (`toggleHomeCard`, `updateHomeDots`, `_homeLoadCardMode`, `_homeCardModeKey`, `showHomeLoader`), `renderHeuresCard`, `renderHomeMaPart`, `renderHomeMaSemaine`, `renderHomeRaccourcis` et `homeShortcut`, `renderHomeDRE`, le fil des derniers travaux et les barres du tracteur dans `renderHome`, `HOME_RETIRES`. `getHomeCardData` reste (« La saison » la lit), `_homeDreLignes` aussi (« À savoir » et la carte du jour).
- **Personnaliser : l’œil seul, dans le code aussi.** `homeWidgetSize`, `homeWidgetLarge`, `homeWidgetMove`, le glisser-déposer (`_homeDndInit`, `_homeDrag*`) et les largeurs 7 / 5 (`_homeSpans`) sont retirés ; `getHomeLayout` purge la taille compacte et la pleine largeur des dispositions enregistrées. La carte du jour et « À savoir » portent une épingle « Toujours affichée ». Le bouton de l’administrateur dit « Proposer ce choix de cartes à toute l’équipe ».
- **Une seule carte Météo** : « Vignoble » (les cinq jours) ou « Secteurs » (la carte des communes d’ALIGN-2), deux boutons « choix » du jeu commun (`.mvbtn-choix`). Moins de deux communes : pas de bascule, la vue « Vignoble », l’entrée « Communes » sous les cinq jours. `_homeMeteoVue` est exempté des tutos (une bascule d’affichage, rien à apprendre).
- Les cinq enregistrements qui redessinaient l’ancienne carte de saison (périodes, recalcul, choix des parcelles, arrachage, exclusion d’une tâche) redessinent « La saison » ; `_prioRedessine` redessine « Ma saison ».
- **L’alerte gel posée au-dessus de l’ancienne carte de saison est retirée** : elle vivait dans le bloc caché depuis 9.77, donc invisible. « À savoir » annonce le gel des jours travaillés sous 0 °C ; l’ancienne alerte prévenait dès 3 °C — le seuil est à trancher par Nico.
- Le guide (la disposition sur ordinateur, « Ma saison » qui mène à « Ma trace », le bouton « Secteurs », « En direct », l’onglet Journal de l’ouvrier) et l’aide (« À vérifier » en haut de l’Accueil, « Secteurs ») suivent ; une nouveauté 9.78 (niveau 0) annonce la carte Météo.

### 418c. Mesuré, et trouvé
- ★★ **Le premier passage coupait chaque fonction jusqu’au premier `\n}\n`** : une fonction qui se ferme en fin de ligne (`toggleHomeCard`, `_homeLoadCardMode`, `_homeCardModeKey`) emportait les suivantes — `getHomeCardData`, `togglePrioPill` et le bloc CONF-4 de `DOMAINE_NOM` étaient partis, l’appli ne démarrait plus dans une quinzaine de harnais (« getHomeCardData is not defined »). Repris depuis l’état d’ACCV-2, chaque fonction coupée par ses accolades ; une comparaison ligne à ligne avec ACCV-2 ne montre plus que les retraits voulus. **Leçon : une fonction se retire par ses accolades, jamais jusqu’au premier `\n}\n` — puis on compare ligne à ligne avec l’état d’avant.**
- Douze harnais visaient les blocs retirés et suivent : ACC-1 (les largeurs 7 / 5), ALIGN-2 (« meteosect », la pleine largeur, l’ordre par défaut, la carte Météo), ARRIVEE-1 (les raccourcis, « Ma trace »), ACC-3 (le fil d’« En direct »), ACCV-1 (« À savoir » lit `_homeDreLignes`), ACCV-2 (plus la bascule jouée sur de faux éléments : 21 assertions, 8 contre-épreuves), PREP (« Ma saison » en préparation), COH-1 et KIT-1 (le Pilotage garde `_mvkAvancement`, « La saison » lit `getHomeCardData`), KIT-2 (le glisser-déposer retiré), les contre-épreuves d’icônes (un autre badge à muter), la robustesse de l’Accueil (un pourcentage chiffré au lieu d’un total d’heures). Chaque contre-épreuve réinjecte son défaut et rougit.
- Le preflight ne trouve que des baisses (champs interpolés sans échappement, C24b, C24c) : la référence est regravée.
- **La chaîne complète (483 commandes, 906 s) a levé deux rouges, deux contre-épreuves qui ne mordaient plus** : les tutos (vingt gestes retirés, le compte des gestes sans tuto tombe de 815 à 813 — le plafond suit, il ne peut que baisser) ; la robustesse de l’Accueil (son défaut réinjecté visait le total d’heures de l’ancienne carte : il vise maintenant le garde-fou d’une tâche sans surface dans « La saison »).
- Vraie appli construite et capturée (téléphone et ordinateur, clair et sombre, admin et ouvrier) : plus aucun ancien bloc ; la carte Météo sans bascule sur la démo, qui n’a qu’une commune. ⚠️ La capture de l’ouvrier montre encore l’onglet Journal : la règle qui le cache (`applyRoles`) n’a pas bougé dans ce lot, l’utilisateur de démo garde sans doute des droits d’administrateur — pas vérifié.

### 418d. Ouvert
- Les absences et les fins de contrat dans « À savoir » ; « Ta présence est notée » encore à part ; l’auteur et l’heure du message de priorité ; le seuil du gel (0 °C ou 3 °C) ; découper `app.js` (l’Accueil à part).
- La feuille garde les règles des blocs retirés (ACC-2, ACC-3, ALIGN-2, KIT-5) : leurs harnais les lisent encore. Les purger demande de lever ces harnais d’abord, jamais sur la foi d’une analyse statique (§25.15f).
- Pas vu à l’écran : la bascule sur un domaine à plusieurs communes ; Personnaliser sur un vrai téléphone.

## 419. ★★ ACCV-4 — L’ACCUEIL DIT VRAI, ET L’ADMINISTRATEUR CORRIGE L’ÉQUIPE D’UNE VALIDATION (21/10 — `src/app.js` (`renderHomeSaison`, `getHomeCardData`, `_homePrioCarte`, `renderHomeDirect`, `renderHomeMoi`, `_mvTraceData`, `_mvPartCalc`, la ligne du Journal ; neuves : `_jFaitPar`, `_jEqCibles`, `_jEqAppliquer`, `_jEqBtn`, `_jEqTrace`, `openJEquipe`, `_jEqBasc`, `saveJEquipe`) · `src/jalons.js` (`_fp`) · `index.html` (la fenêtre `ovJEquipe`) · `src/styles.css` (bloc ACCV-4, après ACCV-2) · `src/tutos.js` (le tuto `jequipe`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/04-vigne.html` · `public/sw.js` · `scripts/mv-harnais-accv4.mjs` (neuf) · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/mv-harnais-liste.mjs` — APP 9.78 → 9.79 · SW 10.57 → 10.58 — base `192196a`)

### 419a. D’où ça vient
Nico (21/10, quatre captures du téléphone) : « beaucoup de fausses infos dans l’accueil de vigne ». Lu dans le code : « La saison » affichait l’arrachage à 0 % (« reste 0,35 ha, 4 parcelles ») pendant que les Parcelles montraient ses quatre parcelles arrachées à 67 % ; « En direct » annonçait deux sessions de tracteur en cours (Intercep et Griffage) quand le Tracteur n’en montrait qu’une. Puis : « il faudra en même temps ajouter la possibilité de modifier ce qu’il y a dans le journal, mais que de la part de l’administrateur… les parcelles validées mardi, c’est moi qui les ai validées, mais c’est pas moi qui les ai faites… j’ai oublié de modifier l’équipe ».

### 419b. Ce qui change
- ★ **Cause commune : ACCV-2 avait recalculé à sa façon au lieu de reprendre les règles de l’appli.** « La saison » et la carte du jour comptent la part faite par la règle commune `_mvTFaite` (COH-1 : un arrachage découpé compte ses étapes). « La saison » prend le pourcentage de chaque tâche et la jauge de la saison dans `calcHeures`, au chiffre près du Pilotage (`_pilData`) ; `getHomeCardData` suit la même règle. « En direct » ne prend que les sessions de la saison (`_sessInSaison`, comme le Tracteur et « Au tracteur »).
- ★ **Qui a travaillé : `_jFaitPar`**, la règle TV-2 en une fonction (l’auteur sauf `quiHors`, plus `membresEquipe`). « Ma saison » (la semaine), « Ma trace » (`_mvTraceData`, `_mvPartCalc`), « En direct » et les jalons (`_fp` dans `jalons.js`, cinq lecteurs) passent par elle ; avant, ils comptaient toujours l’auteur, même décoché à la validation. Les compteurs des jalons peuvent donc baisser chez un administrateur qui validait pour l’équipe depuis TV-2 (23/09) : c’est la correction voulue.
- ★ **Corriger l’équipe d’une validation (administrateur)** : au Journal, un bouton « Équipe » sur chaque entrée de parcelle ouvre « Qui a fait ce travail ? ». On coche qui a vraiment travaillé ; l’auteur peut rester décoché (`quiHors`). « Toute la journée » corrige d’un coup les validations de la même tâche, le même jour, du même auteur, dans le même état. L’auteur, la date, la parcelle, la tâche et l’état ne bougent pas ; l’entrée garde la trace (`eqCorr` : par qui, quand), affichée sous la ligne. Un groupe vide est refusé, comme à la validation. La ligne du Journal dit « Alicia, Victor · validé par Nico » quand l’auteur n’a pas travaillé. Côté serveur rien ne change : la limite à l’administrateur est dans l’appli, comme pour les suppressions.
- Le tuto « Comment faire pour corriger l’équipe d’une validation ? » couvre les trois gestes neufs (`openJEquipe`, `_jEqBasc`, `saveJEquipe`) ; l’aide du Journal, le guide et la nouveauté 9.79 (niveau 1 pour l’administrateur, niveau 0 pour tous sur l’Accueil) le disent.

### 419c. Mesuré, et trouvé
- `scripts/mv-harnais-accv4.mjs` (13 assertions, 8 contre-épreuves) joue la vraie « La saison » sur quatre parcelles arrachées aux deux tiers (67 %, pas 0 % ; avec les chiffres du Pilotage, 42 % pour 120 h prévues et 70 restantes) et les vraies fonctions de correction (le groupe, l’auteur hors du groupe, « Toute la journée », le bouton réservé à l’administrateur).
- TEMPS-VIGNE comptait sept chemins qui posent `quiHors` : la correction du Journal en est un huitième, le harnais suit.
- Deux pièges levés en route : le contrôle d’avant livraison (C24c) ne reconnaissait pas les deux aides de la ligne du Journal comme échappées (une icône et un ternaire hors de `_escHtml`) — elles échappent maintenant tout leur texte d’un bloc ; le titre d’un tuto doit commencer par « Comment faire pour ».
- **La chaîne complète (485 commandes, 863 s) a levé deux rouges, deux contre-épreuves qui visaient l’ancien texte** : la frise des premières fois (RANGBOUT-1 mutait `var eq = [j.qui]` dans `jalons.js`, devenu `var eq = _fp(j)`) ; la robustesse de l’Accueil (son défaut visait le garde-fou de « La saison », qui prend maintenant ses pourcentages dans `calcHeures` : il vise le garde-fou d’une tâche sans surface de `calcHeures`). Les deux harnais, avec leurs contre-épreuves, rejoués verts ensuite ; aucun code de l’appli n’a changé après la chaîne.

### 419d. Ouvert
- Pas vu à l’écran : la fenêtre « Qui a fait ce travail ? » sur le vrai téléphone ; le tuto n’est pas rejoué dans Chromium (`mv-tutos-jeu.mjs` n’est pas dans la chaîne).
- La correction ne touche que le groupe : changer la date, la parcelle, la tâche ou l’état d’une entrée reste à faire (ça touche l’avancement des parcelles).
- Le pourcentage de la saison est celui du Pilotage, en heures : une tâche sans barème (l’arrachage, au temps réel) n’y pèse rien. C’est la règle du Pilotage, pas une erreur de l’Accueil — à revoir avec Nico si elle ne lui convient pas.

## 420. ★ ANTICIPE-1 — LES POINTS À ANTICIPER, EN TÊTE ET D’UN GESTE (21/10 — `src/cockpit-vue.js` (`savoirItems`, `htmlSavoir`, `majResume`, `allerAnticiper` neuve, l’écouteur, la bulle `savoir`, la bulle d’un avatar) · `src/pilotage.js` (`absNoms`, `absListe`, `absTxt`, `presTxt`) · `src/cockpit.js` (`_ckDe` neuve) · `src/styles.css` (bloc ANTICIPE-1, après les lignes d’« À savoir ») · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `guide/11-pilotage.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-anticipe1.mjs` (neuf) · `scripts/mv-harnais-auj5.mjs` · `scripts/mv-harnais-vif1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` — APP 9.79 → 9.80 · SW 10.58 → 10.59 — base `dae7cb7`)

### 420a. La demande
Nico (21/10), capture d’Aujourd’hui au téléphone — la phrase du haut : « … jours de retard, … au-dessus du budget, 2 points à anticiper. » — : « 2 points à anticiper… Lesquels ? ». Claude ne voit pas ses données : la réponse dit ce que le code compte et où ça s’affiche. Reformulé — quand la phrase annonce des points, il veut les voir tout de suite, sans chercher — : « C’est tout à fait ça. Relis les fichiers et go. » (quatre commits relus entre-temps : ACCV-1 à 4).

### 420b. Mesuré dans le code
- La phrase (`majResume`) compte les lignes d’« À savoir » de priorité 1 : une tâche dont la fenêtre est passée sans être finie (`_ckSvRetards`), un contrat qui finit dans les 30 jours (`_ckSvContrats`), la pluie (2 mm et plus) ou le vent (40 km/h et plus) demain ou après-demain sur une commune où une tâche est en cours (`_ckSvMeteo`). Les absences, la météo sans chantier en cours et le matériel sont en priorité 2.
- `_pilCk2Modele` les assemble dans l’ordre des sources (météo, absences, contrats, retards, matériel) et **la vue de la maquette ne triait pas** (`savoirItems`), quand le cockpit de secours trie (`_ckSavoirHtml`). La liste se coupe à cinq lignes (`.ck-sv-l:not(.tout) .ck-sv:nth-child(n+6)`) : les points comptés pouvaient rester sous « Tout voir ». Leur seule marque : la date en gras (`.ck-sv.fort .ck-sv-q` pose `--or-tx`, que `.ck2` rend au texte, DS-4 §270). Au téléphone, « À savoir » vient juste sous la fin prévue (`RANGS.t.petit`).
- Sur la même capture : la tuile Effectif écrivait « absent » derrière chaque prénom (`LIB.absent`), même au féminin — la faute que VIF-1 (§414) n’avait corrigée que dans « À savoir » ; et VIF-1 écrivait « Absence de » devant une voyelle.

### 420c. Ce qui est livré
- **Le tri** : `savoirItems` met les points de priorité 1 en tête, chacun dans son ordre, le reste derrière dans le sien (deux `filter` : stable sans dépendre du moteur). Ils tiennent dans les cinq lignes visibles.
- **La marque** : l’étiquette « À anticiper » (le sens en mot, pas seulement en couleur), un fond ambre (`--attention-doux`), la date et l’étiquette en `--attention-texte`, le bouton de la ligne sur fond de carte. ★ **Vu au rendu, pas avant** : le premier jet posait `--or-pale` — dans `.ck2`, DS-4 (§270) rend l’or au neutre (`--or-pale` = `--survol`), la ligne sortait GRISE ; la couleur d’un état est `--attention`, celle d’ETATS-1 pour « en cours ». Bloc ANTICIPE-1 de la feuille, juste après les lignes d’« À savoir », borné à `.ck2` : le cockpit de secours partage `.ck-sv.fort` et garde ses lignes. Jetons seuls.
- **La phrase touchable** : « N points à anticiper » est un bouton (`data-fn="anticiper"`, nom accessible « N points à anticiper, en tête d’« À savoir » »). `allerAnticiper` : Terrain si l’on était sur Économie ; la liste dépliée au-delà de cinq points ; la première ligne amenée — au téléphone `block:'start'`, sous les barres collantes grâce à `scroll-margin-top: var(--ck-colle)`, sur ordinateur `nearest` dans la colonne de droite — ; le focus posé sans saut ; deux respirations ambre (`hpc-pouls`, l’animation de la carte du jour ; `respire-or` y sortait grise pour la même raison), jamais en animations réduites ; rien à montrer : une trace `logError`, pas un silence (§24, n°17).
- **Les absences** : un motif connu reste derrière le nom, comme avant (« Marion en congé ») ; dès qu’un nom affiché n’en a pas, le mot vient en tête : « Absences : Inès, Sophie » ; un jour de repos, « Repos aujourd’hui · lundi, absences : … » (jamais deux « : » de suite), et la phrase d’avant quand les motifs sont connus ; la légende des avatars et la bulle d’un avatar suivent. « Absence d’Inès », « d’Hugo », « d’Émile » : `_ckDe` élide devant une voyelle (accentuée ou non) et un h ; « de » devant un Y, que l’usage partage (Yann, Yves).
- **L’accompagnement** : la bulle « i » d’« À savoir » (l’ordre, ce qui est compté, la phrase qui y mène), la fiche MV_AIDE du Pilotage, le guide (11), WHATS_NEW 9.80 (niveau 1 sur `#ck-savoir`, admin ; la correction des absences au Journal). La visite guidée ne vise ni la phrase ni la liste. Aucun tuto n’enseigne ce geste, et `mv-harnais-tutos` ne compte que les `onclick` écrits : le bouton passe par l’écouteur de la page.

### 420d. Mesuré
- `mv-harnais-anticipe1` (neuf, dans la chaîne) : 30 assertions — le tri, l’étiquette et la phrase EXÉCUTÉS sur les vraies fonctions ; `allerAnticiper` EXÉCUTÉE sur un faux document (cinq scénarios : depuis Économie, plus de cinq points, sur ordinateur, animations réduites, rien à montrer) ; les lignes de la tuile EXÉCUTÉES (six cas) ; `cockpit.js` EXÉCUTÉ pour l’élision ; la feuille (bornée à `.ck2`, aucun `outline:none` : l’anneau de focus commun), l’aide, le guide, la nouveauté. 20 contre-épreuves, toutes rougissent.
- **Deux contrôles anciens citaient l’ancien texte mot pour mot** (même intention, phrase neuve) : la contre-épreuve de VIF-1 (la ligne « Absence de ») et le lecteur d’AUJ-5, qui attendait « Absence de Ines » (il accepte « Absence d’Ines »). ★ **Et la chaîne a corrigé le dessin** : le premier jet préfixait toute liste (« Absence : Marion en congé ») — REF-1 attend « Marion en congé », et il a raison : un motif connu n’a rien à accorder, le préfixe ne sert qu’aux noms sans motif. AUJ-5 B2 retrouve du même coup sa phrase d’origine. AUJ-1, AUJ-2, AUJ-6, AUJ-7, AUJ-8, COLLE-1, ETATS-1, VIF-1 : verts, contre-épreuves comprises.
- Preflight : 0 erreur, 12 avertissements — les mêmes que sur la base. Chaîne : **487 commandes, 0 rouge (861 s)**, jouée d’un trait après le dernier changement de code (après elle, la doc seule a bougé : `harnais-claude-md` et l’index rejoués verts). La première passe (881 s) avait levé deux rouges, tous deux du lot : `mv-harnais-jetons` (deux `outline:none` : la charte n’en tolère qu’un après l’anneau de focus) et REF-1 (ci-dessus).
- **Rendu regardé** (appli construite, démo, 390 × 844 et 1 366 × 900, clair et sombre, animations réduites ; un contrat ajouté en mémoire pour un point certain, par une copie de `mv-captures.mjs` retirée ensuite) : la phrase soulignée en ambre ; le toucher amène la première ligne sous les barres au téléphone, en bas de la colonne de droite sur PC ; le fond gris du premier jet, ambre ensuite (mesuré au pixel : 241,231,217 en clair, 57,46,29 en sombre).
- Vu hors du lot : `mv-harnais-jetons --contre` échoue déjà sur la base (« un cercle est converti en jeton » ne mord pas ; la contre-épreuve n’est pas dans la chaîne) ; au téléphone, en descendant dans Aujourd’hui, la barre d’onglets passe à moitié sous le bandeau — vu au rendu, pas comparé à la base. Les deux au §28.

### 420e. Ouvert
- À voir chez Nico : la phrase et la liste sur ses données, au téléphone et sur PC ; un jour à plus de cinq points ; le fond ambre en sombre ; l’anneau de focus après le toucher (il paraît dans Chromium sans souris ; au doigt, le navigateur décide).
- « absent » reste au masculin dans Décider (`_dzMotif`) : la même règle à y porter (§28, paquet 4).
- Le cockpit de secours (`cockpit.js/_ckAuj`) trie déjà, sans l’étiquette ni la phrase touchable : il ne sert que si la vue de la maquette échoue.

## 421. ★★ JEQ-1 — QUI A TRAVAILLÉ : SEULEMENT LES PRÉSENTS, ET ON VOIT QUI EST COCHÉ ; LE COMPTEUR DE LA BARRE AU JEU COMMUN (21/10 — `src/app.js` (neuves : `_mvEquipeProposee`, `_mvMembresDate` ; `_mvEqMembres`, `_buildMembresCheckboxes`, `_eqtClean`, `_pvBuildTeamPick`, `openJEquipe`, `_jEqBasc`) · `src/coquille.js` (`PASTILLE_LIB`, `libelle`, `pastille`, `window._railAlertesMaj`) · `src/styles.css` (`.pchk.sel` ; le bloc du compteur de la barre ; la ligne COQ-2 du rouge retirée) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE home, parcelles, journal) · `guide/01-demarrer.html` · `guide/04-vigne.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-jeq1.mjs` (neuf) · `scripts/mv-harnais-vif1.mjs` · `scripts/mv-harnais-pastilles.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` — APP 9.80 → 9.81 · SW 10.59 → 10.60 — base `b208725`)

### 421a. D’où ça vient
Nico (21/10, deux captures sur PC) : au Journal, dans « Qui a fait ce travail ? », « les pastilles ne sont pas colorées, donc c’est très difficile de voir ce qui est sélectionné » et « toutes les personnes qui ont été inscrites sur l’application sont affichées, alors qu’elles ne sont plus sous contrat… pour la date qui a été sélectionnée » ; sur la barre latérale, « le chiffre dans le rond rouge, c’est pas du tout pro, c’est trop présent, on voit que ça, c’est pas aligné ». Reformulé, avec la proposition d’étendre la règle à la validation et aux équipes du jour : « oui ».

### 421b. Ce qui change
- ★ **Les cochés sans couleur : le piège d’ARRACH-5, une deuxième fois.** `.pchk.sel` ne peignait rien sans sa teinte (`vert`, `acre`, `phyt`) ; `openJEquipe` posait `sel` seul et `_jEqBasc` ne basculait que lui. Les cochés prennent `sel vert` (et `aria-pressed`) ; et `.pchk.sel` est désormais peint par défaut, du vert de la feuille de validation : un écran qui oublie sa teinte reste lisible.
- ★ **Tout le monde affiché : un filtre sur deux champs que les fiches n’ont pas.** `openJEquipe` gardait `m.actif!==false&&!m.inactif` — `inactif` n’existe que dans l’appel à `updateMemberRoles` (firebase.js), jamais sur une fiche : personne ne sortait, même « Inactif ». Les autres listes ne retiraient que le statut « Inactif » : un CDD fini restait proposé tant que la fiche n’était pas passée à la main. **Une règle, `_mvEquipeProposee(ds)`** (app.js) : `_mvEnContratLe` (la règle commune ; PRES-1 pour une fiche sans date) ; ce jour ou plus tard, une fiche « Inactive » sort aussi (comme `_pilMembresActifs`) ; un jour passé, le statut d’aujourd’hui ne réécrit pas l’histoire (la doctrine de `_mvEnContratSurPeriode`).
- Elle sert : la correction du Journal (date de l’entrée, puis ceux déjà notés et l’auteur, même hors contrat) ; les quatre feuilles (`vp-`, `niv-`, `pass-`, `je-membres-pick`) à la date de LEUR champ — un changement de date refait la liste et garde les cochés (`_mvMembresDate`, écoute posée une fois par champ) ; la barre « Équipe sur… » et son équipe retenue (`_eqtClean` : sinon un saisonnier parti restait coché sans paraître dans « Changer ») ; les équipes du jour (le bureau toujours à part).
- ★ **Le compteur de la barre au jeu commun (CHARTE-4).** Dessiné pour la barre sombre de COQ-1 : anneau `#100D0A` resté noir sur la barre claire de COQ-2 ; `top:12px` calculé pour des lignes de 42 px, qui en font 32 depuis COQ-2 (4,5 px trop bas, ×1,25 chez Nico) ; calage par la gauche (« 9+ » dépassait) ; le point « en direct » du Pilotage caché dessous ; en sombre, un chiffre blanc sur le `--danger` saumon (2,4:1). Il prend `.mvpas-compteur` (neutre : la règle de CHARTE-4, rouge pour une vraie alerte seulement) ; la feuille ne lui donne que sa place (`margin-left:auto`). Barre repliée : il se cache, un point `.mv-rail-point` (`--accent-texte`) au coin de l’icône le remplace, le nombre passe dans `data-tip` et dans le nom du bouton ; le point « en direct » s’efface devant lui (classe `mv-rail-alerte`). Barre dépliée, le point « en direct » suit le libellé.
- ★ **Le libellé s’accorde.** VIF-1 collait le « s » au bout de la phrase : « 2 point prioritaire à savoirs », « 2 contrat qui finit dans le moiss », « 2 en réparations ». Singulier et pluriel par pastille ; le Pilotage dit « points à anticiper », le mot d’Aujourd’hui (§420).

### 421c. Mesuré, et trouvé
- `mv-harnais-jeq1` (neuf) : 19 assertions, 16/16 contre-épreuves — la règle jouée (les vraies `_mvEnContratLe`, `_mvSansDateContrat`, `_mvCompteSansDate` ; un faux `_mvContrats` qui LIT la fiche) sur huit fiches (CDI sans date, contrat d’hiver, CDD fini actif, CDD fini « Inactif », « Inactive » sans date, arrivée future, bureau, validateur) ; la vraie `openJEquipe` sur un faux DOM ; la vraie feuille à deux dates ; `coquille.js` entier dans un vm (`_railHtml`, `_railAlertesMaj`) ; la feuille de style lue règle par règle.
- ★ **Une contre-épreuve qui ne mordait pas, et pourquoi** : « la bascule ne teinte plus » mutait le PREMIER `el.classList.toggle('vert',on);` du fichier — celui de `_jePrefillTeam`. Le harnais exige maintenant un motif unique (« MOTIF NON UNIQUE » sinon).
- ★ **VIF-1 vérifiait le défaut** : son assertion « au singulier ou au pluriel » exigeait `+ (n > 1 && p !== 'cave' ? 's' : '')` — le code qui fabriquait « savoirs ». Remplacée ; l’accord est joué par JEQ-1.
- `mv-harnais-pastilles` : `mv-rail-badge` rejoint les classes passées au jeu ; pastilles « maison » 91 → 90, `PLAFOND` baissé (sa contre-épreuve « une de plus » ne mordait plus à 91).
- Rendu regardé (Chromium, 1366 px ×1,25, clair et sombre, démo) : barre dépliée, les quatre compteurs centrés à 0,0 px de leur ligne, un bord droit commun (12 px avant la fin de ligne) ; barre repliée, le point centré sur le coin de l’icône ; infobulle « Cave · 12 à faire en cave » ; fenêtre Équipe : cochés verts, les autres blancs, dans les deux thèmes.
- Vu en route, non corrigé : `@keyframes respire` n’existe pas (seul `respire-or`) — le point « en direct » ne respire pas depuis COQ-1 (§28).
- Chaîne : 489 commandes, 852 s, jouée d’un trait (TZ Europe/Paris) après le dernier changement de code ; six rouges, aucun du lot. `build-guide --check` : le guide change, `npm run site` refait la page (on ne livre pas le généré). Trois harnais anciens et leurs contre-épreuves — `mv-harnais-reste-a-rentrer`, `mv-harnais-cuv13`, `mv-harnais-ref1` — rouges AUSSI sur la base `b208725` (rejoués dans un `git worktree`) : la chaîne a tourné à 0 h 23 heure de Paris, le 22 pour Paris, encore le 21 en temps universel. En TZ=UTC, et à midi le 22 simulé (`Date` décalée de 12 h, `node --import`), les trois repassent : une date du jour lue dans deux horloges, fenêtre de minuit à 2 h (§28).

### 421d. Ouvert
- À voir chez Nico : la fenêtre Équipe sur ses vraies données — les saisonniers partis n’y sont plus ; une fiche sans date de fin y reste (PRES-1 : la compléter dans Réglages › Équipe) ; la validation en retard d’un saisonnier parti depuis (changer la date de la feuille fait revenir son nom) ; les compteurs à 125 %.
- Hors du lot, chacun sa règle de « présent » : les intervenants du Cuvier (`_vmIntRender`, statut seul) et le coéquipier du tracteur (`_condList`) ; et deux écritures de « présent aujourd’hui », `_pilMembresActifs` (pilotage.js) et `_mvEquipeProposee` (app.js), même règle (§28).

## 422. ★ BASCULE-1 — LA BASCULE MÉTÉO AU DESSIN DU JEU COMMUN : UN CADRE AUTOUR, DES OPTIONS DEDANS (22/10 — `index.html` (la bascule de la carte Météo ; les cinq affichages) · `src/styles.css` (`.hk-seg`) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-boutons.mjs` (règle F) · `scripts/mv-captures.mjs` (écran `accueil-meteo-bascule`) · `scripts/mv-harnais-jeq1.mjs` (H1) · `scripts/harnais-claude-md.mjs` — APP 9.81 → 9.82 · SW 10.60 → 10.61 — base `4a92394`)

### 422a. La demande
Nico (21/10 au soir), capture de l’Accueil Vigne au téléphone, la carte Météo : « Les touches vignobles et secteurs, il faut les revoir, hein. C’est trop criard là, c’est pas du tout pro. » Reformulé — une petite bascule sobre, au niveau du reste de la refonte ; la cause trouvée ; la pièce du Cuvier proposée, déjà validée en CHARTE-3, donc sans maquette — : « oui, relis les fichiers (il y a eu des maj) et go » (deux commits relus entre-temps : ANTICIPE-1, JEQ-1).

### 422b. Mesuré dans le code
- La carte `meteo5` (ACCV-3, §418) : `<span class="hk-seg" id="home-meteo-vue" role="group">` autour de deux `<button class="mvbtn mvbtn-choix">`. Dans le jeu commun (CHARTE-3, §370), `.mvbtn-choix` est le CADRE d’un groupe d’options (bordure `--ligne-forte`, fond de carte, marge intérieure 2 px) et `.mvbtn-option` le bouton dedans (gris ; teinté sous `aria-pressed="true"` ou `.on`). Posé sur chaque bouton, le cadre faisait deux cadres : la taille du téléphone par défaut (terrain, 48 px, texte 16 px — plus grand que le titre de la carte, 14 px) ; la marge du cadre, écrite après celle de `.mvbtn` à spécificité égale, ramenée à 2 px : le texte au bord ; aucune option marquée, le texte noir du navigateur ; et 4 px d’écart (`.hk-seg`) entre les deux.
- ★ **Pourquoi personne ne l’a vu** : la démo n’a qu’une commune, et `renderHomeMeteoCommunes` cache la bascule sous deux communes — le §418 l’écrit (« pas vu à l’écran »). Il nommait déjà la pièce de travers : « deux boutons « choix » du jeu commun (`.mvbtn-choix`) ».
- Le bon emploi existait : Le Cuvier (`rec-vues`, l’unité de la maturité, `vt-filt`) et la navigation des réglages de la Cave (`creg-nav`) — un `<div class="mvbtn-choix" role="group">` autour de `.mvbtn-option` (compactes au Cuvier).

### 422c. Ce qui est livré
- **La bascule** : le cadre sur le groupe (`<span class="hk-seg mvbtn-choix" …>`), deux `.mvbtn mvbtn-option mvbtn-compact`. `_homeMeteoVue` n’a pas bougé : il posait déjà `aria-pressed`, que la pièce lit. `.hk-seg` ne garde que la place (`margin-left:auto; flex:none`) : plus aucune allure hors du jeu.
- **La garde** : `mv-harnais-boutons`, règle F — `.mvbtn-choix` dans l’attribut `class` d’un `<button>`, dans `index.html` ou un module (guillemets échappés compris), rougit. Deux contre-épreuves (`index.html`, un module) et un témoin (le cadre autour de ses options reste permis). Prouvée rouge sur la base : un `git worktree` de `4a92394` avec le harnais neuf nomme les deux boutons d’ACCV-3.
- **L’outil** : l’écran `accueil-meteo-bascule` de `mv-captures.mjs` affiche la bascule de force, rien d’autre. ⚠️ Le clone portait déjà ce changement, reste d’un tour interrompu, numéroté §421 (pris depuis par JEQ-1) : remis à l’état du dépôt, puis réécrit (§24-25 : un fichier modifié que le tour n’a pas écrit se relit comme un upload).
- **L’accompagnement** : WHATS_NEW 9.82, niveau 0, pour tous. La fiche MV_AIDE de l’Accueil et le guide (04, deux lignes) disent « le bouton « Secteurs » » : toujours vrai, rien à changer — pas de `npm run site`. Aucun tuto ni la visite ne visent la bascule (`_homeMeteoVue` est exempté des tutos depuis ACCV-3).

### 422d. Mesuré
- **Rendu** (appli construite par `mv-gt-page` puis `vite build`, entrée par la démo, bascule forcée visible ; Chromium 131 ; téléphone 390 px ×3 et PC 1 366 px ×1,25 ; clair et sombre ; avant et après) : avant, en-tête 48 px au téléphone (36 sur PC), boutons 70 × 48 px en 16 px, marge 2 px, les deux blancs ; après, un cadre de 161 × 34 px, options de 28 px en 13 px, marge 12 px, « Vignoble » choisie en `--accent-texte` sur `--accent-doux` (rose sur rose en sombre), « Secteurs » en `--texte-med`. L’en-tête de la carte fait 34 px, 20 pour les cartes sans bascule : la hauteur de la pièce compacte dans son cadre, gardée. Captures faites avant le passage de la version : seuls les numéros ont bougé depuis.
- ★ **Un contrôle ancien exigeait la tête du journal** : H1 de `mv-harnais-jeq1` cherchait `export const WHATS_NEW = [` suivi du bloc 9.81 — la nouveauté 9.82 l’a fait rougir, lui et sa contre-épreuve (première passe de la chaîne). Il cherche désormais le bloc 9.81 où qu’il soit, comme ANTICIPE-1 le fait pour la 9.80 ; que le journal s’ouvre sur `APP_VERSION`, c’est C27 (`mv-whatsnew-check`). Même famille que les deux contrôles d’ANTICIPE-1 qui citaient l’ancien texte (§420d) : un harnais de lot vérifie son lot, pas la position qu’il occupait le jour de sa livraison.
- `mv-harnais-boutons` 6/6, contre-épreuves 12/12 ; `mv-harnais-align2` 18/18 et 12/12 (sa fenêtre de 900 caractères tient avec les classes allongées) ; `mv-harnais-accv2` 21 assertions et 8/8.
- Chaîne : **489 commandes, 0 rouge (763 s)**, jouée d’un trait après le dernier changement de code (après elle, la doc seule a bougé : `harnais-claude-md` et l’index rejoués verts). La première passe (762 s) avait levé deux rouges, tous deux du lot : H1 de `mv-harnais-jeq1` et sa contre-épreuve (ci-dessus). Preflight : 0 erreur, 12 avertissements — les mêmes que sur la base.

### 422e. Ouvert
- À voir chez Nico : la bascule sur un domaine à plusieurs communes, au téléphone et sur PC, et le passage d’une vue à l’autre — la teinte suit `aria-pressed`, comme au Cuvier.
- La cible du doigt : l’option compacte fait 28 px, comme au Cuvier. Si elle se révèle juste au champ, la taille bureau (36 px) est la marche suivante, sans rien changer d’autre.

## 423. ★★ TUTO-9 — LES TUTOS SUIVENT CHAQUE CHANGEMENT : LE TUTO DU JOURNAL VA AU BOUT, ET PLUS DE LIVRAISON SANS TUTOS REJOUÉS (22/10 — `src/tutos.js` (`_tuJournal`, `_jeqCorrigee`, `_charger`, le tuto `jequipe`) · `scripts/mv-tutos-jeu.mjs` · `scripts/mv-tutos-empreinte.mjs` (neuf) · `scripts/mv-lot-marque.mjs` · `scripts/mv-harnais-tuto9.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (la ligne de tutos.js) · `src/utils.js` (APP, WHATS_NEW) · `index.html` (versions) · `public/sw.js` · `guide/01-demarrer.html` · `.mv-base` · `lots/TUTO-9.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.82 → 9.83, SW 10.61 → 10.62**, base `123c0c1`)

### 423a. La demande
Nico, sortie de la CI après BASCULE-1 : `npm run test:tutos` rouge — « jequipe » sur ordinateur (« cible introuvable »), au panneau (« Fermer l’entraînement n’a pas prévenu l’appli ») et au miroir (délai dépassé, saut d’étape). « Revois ce bug » et « il faut que les tutos se mettent à jour à chaque changement ». Le lot COTE-1 (panneau côte à côte, validé le même jour) attend derrière.

### 423b. Les causes — quatre, aucune vue avant la CI
- **Le domaine fictif n’avait aucune validation au Journal.** `TU_DONNEES` n’a pas de clé `journal` et `_charger` ne posait que config, membres, saisons, tâches, activités, conducteurs, parcelles (et la vendange de TUTO-8). Le tuto d’ACCV-4 vise le bouton « Équipe » d’une validation : rendu dans Chromium, « Journal vide » au téléphone comme sur ordinateur. Il ne pouvait aller nulle part.
- **Sa zone de choix rendait un élément, pas une liste.** Le moteur parcourt la zone (`_zone`, `_place`, `_verifie`) : `e.forEach is not a function` à l’étape 2, sur tous les écrans. `_zoneEquipe` rend bien une liste ; la zone écrite à la main pour le Journal non.
- **Son étape « Enregistrer » se croyait faite avant d’ouvrir la fenêtre.** « La fenêtre est fermée » est vrai au départ : côté domaine, le miroir voyait l’étape 3 faite à l’étape 1 — exactement le saut d’étape que TUTO-7 (§364) interdit.
- **test:tutos jouait le premier tuto sous le nom d’un autre.** La liste se lisait dans l’appli au premier tuto joué (« equipes », écrit en dur), et ce résultat s’affichait sous `liste[0]` après remplacement de la liste. Tant qu’« equipes » était en tête de `TU_TUTOS`, c’était invisible ; ACCV-4 a mis « jequipe » en tête : au téléphone, « jequipe ✓ 5/5 » était « equipes » (5 étapes ; « jequipe » en a 3), « equipes » était joué deux fois, « jequipe » jamais. Un vert qui ne mesurait rien.
- **Le fond** : ACCV-4 l’avait écrit dans son « Pas vu » — « le tuto n’est pas rejoué dans Chromium (`mv-tutos-jeu.mjs` n’est pas dans la chaîne) ». La règle d’or n°4 disait que test:tutos « rougit » : vrai, mais à la CI, après le push. Une règle sans geste obligatoire ne tient que par la vigilance.

### 423c. Les correctifs
- `_tuJournal()` : trois validations aux dates CALCULÉES (`_tuJour`, comme la vendange) ; la première est celle que le tuto corrige — Paul l’a validée seul, Jean et Sophie ont fait le travail. `_charger` la pose (`applyFbData('journal', …)`).
- La zone du Journal rend une liste ; le harnais lit TOUTES les zones de `TU_TUTOS` et exige une liste (règle générale, pas un pansement).
- L’étape 3 : fenêtre refermée ET une validation corrigée depuis le départ du tuto — `avant` note l’heure (`memo.jeq0`), `_jeqCorrigee` cherche une trace `eqCorr.le` postérieure (la trace que pose `saveJEquipe`). Une correction d’avant le tuto ne compte pas.
- `mv-tutos-jeu.mjs` : la vraie liste est rejouée en entier sur chaque écran, sans refaire ce qui est fait ; chaque ligne porte le tuto JOUÉ ; on COMPTE (un tuto non joué est un rouge, §25) ; un build plus ancien que les sources est refusé (sinon on rejoue les tutos d’avant le changement, et c’est vert) ; le rapport `rapports/tutos.json` dit sur quelles sources les tutos ont été rejoués.
- ★ **La marque d’un lot** (`mv-lot-marque.mjs`, le dernier geste avant le zip) : un lot qui touche l’appli (`src/`, `index.html`, `public/boot.js`, `public/sw.js`, `vite.config.js`) exige le rapport, vert, d’empreinte égale aux sources du moment. Absent, rouge, ou d’autres sources : refus (code 4). Une exception se décide et s’écrit : `--sans-tutos "<raison>"`. L’empreinte (`scripts/mv-tutos-empreinte.mjs`, une seule définition pour le rapport et la marque) lit le contenu, pas la date : un harnais qui rend un fichier à l’identique ne la change pas ; la documentation n’y entre pas.

### 423d. Arbitrages
- **La marque plutôt que la chaîne** : test:tutos demande un build et un navigateur (5 à 6 min) ; le mettre dans `npm run check` rallongerait chaque build de Nico et exigerait Chromium chez lui. La CI le joue déjà ; le trou était côté livraison. La marque est déjà le passage obligé de chaque zip (§231) : c’est là que le geste devient impossible à oublier.
- **« Se mettre à jour tout seul »** : un tuto suit seul ce qui se lit à l’écran (libellés, chemins calculés, étiquettes `data-tuto`). Ce qu’il ne peut pas deviner — une donnée absente du domaine fictif, une étape neuve — se voit désormais AVANT la livraison, au lieu d’après le push.
- Les « 5/5 » d’avant ce lot sur la première ligne du téléphone ne prouvaient rien : à relire avec cette clé si un ancien journal de CI est consulté.

### 423e. Mesures
- `npm run test:tutos` sur le build du lot (Chromium du bac à sable) : **17/17** — téléphone 4/4 (jequipe 3/3 enfin joué), ordinateur 4/4, panneau 4/4, miroir 4/4, vieux boot.js refusé. Avant le lot, sur la base `123c0c1` : ordinateur jequipe 1/3 « cible introuvable », identique à la CI ; après la seule correction du test (avant celle de la zone), le téléphone a montré le vrai défaut : jequipe 2/3, `e.forEach is not a function`.
- `mv-harnais-tuto9` : **27 verts**, contre-épreuves **12/12** (Journal vide, validation déjà faite par Jean, date en dur, zone en élément seul, étape 3 « fenêtre fermée », correction d’avant le tuto, tuto affiché sous un autre nom, plus de compte, build périmé accepté, marque aveugle, rapport d’autres sources accepté, documentation dans l’empreinte). Une contre-épreuve (« build périmé ») ne mordait pas au premier jet : l’assertion cherchait `process.exit(2)`, présent ailleurs dans le fichier — resserrée sur la garde elle-même.
- Chaîne : **491/491 commandes, 794 s**, jouée d’un trait après le dernier changement de code ; deux rouges, levés dans le lot : `mv-harnais-typo` (tutos.js 71 → 75 ko, +5,6 % pour 5 % tolérés ; la question du découpage posée — non : le fichier grossit d’un tuto à la fois, c’est le catalogue ; seule SA ligne de `typo-baseline.json` regravée à la main, pour ne pas absorber la dérive des autres modules) et `build-guide --check` (le guide change : vert après `npm run site`, la page générée remise, on ne livre pas le généré).
- L’inventaire de COTE-1 (lot suivant, validé) : le panneau `.mvtu-panneau` (fixe, 420 px, z-index 100005) et l’anneau (100004, dessous) ; 25 couches fixes à faire suivre (`.overlay`, `.mvv-ov`, `.mvz-ov`, `.pil-scrim`, `.pil-drawer`, `.pil-diagwrap`, `.pil-dz-*`, `.mvds-bg`, `.mv-pal*`, `.ck-agr`, `.trn-*`, `#mv-perime-ov`, `#mv-expired-ov`, `#ovCloture`, barres, toasts, `#trac-fab`/`#phyto-fab`), exemptées : connexion, visite guidée (`.mvt*`), rideau de mise à jour ; la barre latérale via `ouvert()` de coquille.js (règle PRO-1 jugée sur la place qui reste) ; le « + » : `ic-plus` dessine `ellipsis` depuis le premier commit — neuf `_mvIcon('plus')` de boutons d’ajout (cuvier 7, cave 1, comptes 1), `#ic-plus` de la feuille des comptes, trois `emoji: 'plus'` de WHATS_NEW (5.17, 6.33, 7.20), `{ic:plus}` de `guide/05-saisons.html`, l’ancre d’une contre-épreuve de `mv-harnais-tourcuv1`.

### 423f. Ouvert
- À voir chez Nico : le tuto « corriger l’équipe » sur SON Journal, à côté de l’appli (le miroir sur une vraie session : la trace de correction est la même que dans le bac à sable, non vue sur ses données).
- COTE-1 et le « + » : le lot suivant (§28, chantiers).

## 424. ★★ COTE-1 — LE TUTO À CÔTÉ DE L’APPLI, RIEN DESSOUS ; LE « + » DES BOUTONS D’AJOUT (22/10 — `src/tutos.js` (`COTE_*`, `_coteCss`, `_coteRecaler`, `_aCoteDispo`, `_panneau`, `_fermerPanneau`, `_confirmer`, `window._mvTutoCote`) · `src/coquille.js` (`coteTuto`, `ouvert`) · `index.html` (`ic-points`, `ic-ajout`, la feuille des comptes, versions) · `src/app.js` (le menu « Plus ») · `src/tournees.js` · `src/cuvier.js` · `src/cave.js` · `src/comptes.js` · `src/utils.js` (APP, WHATS_NEW, trois anciennes nouveautés) · `public/sw.js` · `guide/01-demarrer.html` · `guide/05-saisons.html` · `scripts/mv-tutos-jeu.mjs` · `scripts/mv-harnais-cote1.mjs` (neuf) · `scripts/mv-harnais-tourcuv1.mjs` · `scripts/mv-harnais-cave2.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `.mv-base` · `lots/COTE-1.json` · `CLAUDE.md` · `docs/claude/*` · **APP 9.83 → 9.84, SW 10.62 → 10.63**, base `bc73fa4`)

### 424a. La demande
Nico (20/10), capture du PC : « la fenêtre est à droite et il y a un bouton à appuyer derrière […] soit on ouvre deux fenêtres côte à côte, enfin je sais pas, c’est toi l’expert en ergonomie ». Proposé : le côte à côte (panneau collé, appli resserrée), le plein écran sous ~1 280 px, « Fenêtre à part » gardée ; écartés : un panneau qui saute d’un côté à l’autre (l’œil le perd), deux fenêtres du navigateur (une page ne retaille pas sa propre fenêtre). Validé (« go »), avec le « + » vu sur la capture (« ··· Mesures »).

### 424b. Mesuré avant d’écrire
- `.mvtu-panneau` : fixe, `right:12px`, 420 px, z-index 100005 ; l’anneau `.mvtu-anneau` à 100004 — dessous. Sur la capture : PC à 125 % (≈ 1 536 px utiles), « Imprimer le contrôle » et « Noter des mesures » au bout de `.mat-tete` (`.mat-tete-g{flex:1 1 auto}`), donc sous le panneau.
- TUTO-2 (§359c) l’avait écrit : retailler l’appli « sans pouvoir regarder chaque écran était un pari ». Le pari se lève en MESURANT : test:tutos ouvre la démo à trois largeurs.
- Les couches fixes : 38 règles `position:fixed` dans la feuille, 15 dans app.js (la visite), 3 cuvier.js, 2 utils.js, 2 reglages.js, 2 pilotage.js, 8 index.html. Celles qui couvrent toute la largeur (ou sont collées à droite, ou centrées à 50 %) doivent suivre ; la barre latérale (à gauche), les bulles et menus posés par le code près de leur cible, non.
- La barre latérale : `ouvert()` (PRO-1) la replie sous 1 200 px ; un redimensionnement la reconstruit (`_dockBuild` → `_railBuild` → `plier(ouvert())`).
- Le « + » : `ic-plus` = Lucide `ellipsis` depuis le premier commit (`6756111`). Neuf `_mvIcon('plus')` de boutons d’ajout (cuvier 7, cave 1, comptes 1) et `#ic-plus` de la feuille des comptes dessinaient trois points ; `_wnIco` aurait affiché le MOT « plus » pour trois anciennes nouveautés si le nom disparaissait sans elles ; `{ic:plus}` titrait « Créer une saison » au guide.

### 424c. Arbitrages
- **Le rembourrage, pas un cadre** : `#app-root{padding-right}` (la barre latérale fait déjà `padding-left`) ; la carte `#app-content-wrap` (flex:1) se resserre. Un `transform` sur un parent aurait ramené toutes les couches fixes d’un coup, mais elles auraient défilé avec la page.
- **Les couches fixes une à une, et un inventaire qui mord** : cinq listes `COTE_*` dans tutos.js (voiles/fenêtres `right`, tiroir `right`, barres `right` + `width:auto`, messages et recherche centrés sur la place de l’appli, boutons ronds décalés), `!important` (des styles en ligne : `#mv-expired-ov`, `#ovCloture`, `#trac-fab`). `mv-harnais-cote1` lit la feuille : toute couche fixe pleine largeur est rangée ou exemptée (9 exemptions écrites : connexion, assistant, console GT, dock du téléphone, visite guidée, rideau de mise à jour). Les couches posées par les modules (`.mvv-ov`, `.mvz-ov`, `.pil-diagwrap`, `#ovCloture`, `.vt-bot`) sont rangées à la main — et test:tutos vérifie au navigateur qu’AUCUNE couche fixe visible ne passe sous le panneau, fenêtre ouverte comprise.
- **La largeur** : `clamp(360px, 28vw, 420px)` — 360 px est le plus petit téléphone courant, que l’appli tient déjà ; à 1 536 px il reste ~1 040 px à l’appli, barre repliée.
- **Le seuil, 1 280 px, en JS et en CSS** (`COTE_MQ`) : sous lui, l’appli garderait moins de ~850 px avec les règles d’un écran large. La feuille du panneau collé ne vaut qu’au-dessus : une fenêtre rétrécie après l’ouverture rend au panneau son ancienne place flottante (cas limite assumé).
- **La barre latérale** : `ouvert()` lit `window._mvTutoCote()` (la largeur prise, 0 sinon) et juge la règle de PRO-1 sur la place qui reste ; le choix fait à la main repart à zéro quand le panneau s’ouvre ou se ferme — pas quand sa largeur varie. `_coteRecaler` prévient par un redimensionnement (la barre, les graphiques, la carte se recalent).
- **Le « + » par le nom** : renommer `ic-plus` en `ic-points` (ce qu’elle dessine) et créer `ic-ajout` — plutôt que corriger les seuls boutons : un futur `_mvIcon('plus')` rougit désormais au harnais des icônes (symbole absent) au lieu de dessiner trois points sans rien dire. Les trois anciennes nouveautés (5.17, 6.33, 7.20) passent à `ajout` : l’icône, pas le texte.

### 424d. Pièges
- Le test cachait le panneau lui-même : pour écarter la visite de la démo, `[id^="mvt"]` (repris de mv-captures) attrapait `#mvtu-panneau` — panneau mesuré à 0 × 0, barre « dépliée à tort », tout rouge. `:not([id^="mvtu"])`.
- Deux assertions fausses, aucun défaut de code : une regex qui ne tolérait pas un commentaire en bout de ligne ; une mesure prise sur `#app-root`, dont la boîte va jusqu’au bord puisqu’il se resserre par son rembourrage — c’est la carte `#app-content-wrap` qui s’arrête au panneau.
- La contre-épreuve « une entrée des listes ne vise plus rien » ne mordait pas : l’entrée se retrouvait dans sa propre déclaration. Le corpus exclut désormais les lignes `var COTE_*`.

### 424e. Mesures
- test:tutos sur le build du lot : **20/20** — les quatre tutos au téléphone, sur ordinateur, au panneau et au miroir, le vieux boot.js refusé, et le côte à côte à 1 280 × 800 (panneau 360 px, appli jusqu’à 912), 1 536 × 864 (420 px, appli jusqu’à 1 108, barre repliée) et 1 920 × 1 080 (420 px, appli jusqu’à 1 492, barre dépliée) : « Noter des mesures » touchable, l’anneau visible dessus, aucune couche fixe sous le panneau avant et après l’ouverture de la fenêtre de saisie, la page qui reprend sa largeur à la fermeture.
- La capture à 1 536 px regardée : le panneau collé à droite sur toute la hauteur, l’appli resserrée, la barre repliée, l’anneau doré autour de « Noter des mesures » au bout de l’en-tête, la fenêtre « Noter des mesures » ouverte au centre de la place de l’appli ; le « + » sur les deux boutons (l’appli et le panneau).
- Chaîne : **493/493 commandes, 788 s**, jouée d’un trait après le dernier changement de code ; trois rouges, levés dans le lot : `build-guide --check` (le guide change : vert après `npm run site`, la page générée remise) et `mv-harnais-cave2` avec sa contre-épreuve — il citait `_mvIcon(\'plus\',16)` du bouton « Nouvelle cuve », ÉCHAPPÉ dans sa chaîne : l’inventaire du « + » cherchait la forme non échappée et l’avait manqué. Le harnais suit (`ajout`), vert, 7/7. ★ Leçon : chercher un nom dans les harnais sous ses deux écritures, `'x'` et `\'x\'`.
- `mv-harnais-cote1` : **24 verts**, contre-épreuves **12/12**. `mv-harnais-tourcuv1 --contre` : 6/6 (son ancre suit `ajout`). `mv-harnais-icones` : vert. `mv-harnais-typo` : coquille.js 20 → 22 ko (+10 %) — la question du découpage posée : non (22 ko) ; seule sa ligne regravée.

### 424f. Ouvert
- À voir chez Nico (§28) : sur SON PC à 125 %, avec ses vraies fenêtres ; « Fenêtre à part » (bloqueur de fenêtres) ; un écran de moins de 1 280 px.
- Non mesuré : les écrans autres que les Maturités pendant un tuto côte à côte (Planning, Tracteur, Pilotage à ~1 040 px de large avec les règles d’un écran large) — le test ne mesure que la page des Maturités ; un tuto neuf sur un autre écran l’ajoutera de fait (le miroir joue sur l’écran du tuto).
