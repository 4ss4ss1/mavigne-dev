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
