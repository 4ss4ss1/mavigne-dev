# Audit UX — navigation, réglages, cohérence

**Base lue : `f79891c` (« guide régénéré (CAVE-1 à 5) ») · APP 6.95 · SW 7.54.**
Mesuré sur le code, pas sur une capture. Rien n'est intégré : ce document et la maquette
`maquette-nav.html` sont le lot **NAV-0**, à valider avant tout code — même méthode que la Cave (§94).

---

## 1. Ce qui a été mesuré

| Constat | Chiffre | Où |
|---|---|---|
| Modules dans le dock (admin) | **8** → 4 visibles + « Plus » (Cave, Réserve, Planning, Réglages) | `_dockDef`, `_dockBuild` |
| Barres d'onglets | **15** (12 dans `index.html`, 3 construites en JS) | `.mvu-tabs` |
| Mécaniques d'onglet différentes | **10** (`switchVigneOng`, `switchTracOnglet`, `switchPhytoTab`, `switchReglTab`, `selectCaveSection`, `switchCaveOng`, `switchVendOng`, `_mlSetTab`, `_rsvTabTo`, `_pilSetTab`, Planning `data-t`) | idem |
| Modules qui mémorisent l'onglet où l'on était | **1** sur 8 (Pilotage, `localStorage`) — la Réserve le garde le temps de la session, les six autres repartent au premier onglet | `_pilSaveTab`, `_rsvTab` |
| **Endroits où l'on règle quelque chose** | **6** : Réglages (5 onglets) · Cave ⚙ · Planning › Le cadre · Pilotage › Outils › Paramétrage · Pilotage « Choisir les indicateurs » · Accueil (appui long) | voir §2.1 |
| **Mots pour dire « réglage »** | **3** : Réglages · Paramétrage · Le cadre | `_PIL_TOOLS`, `#plan-tabs` |
| Portes vers un document imprimé | **3** : Réglages › App › Documents · Cave ⚙ › Documents · **un bouton d'export au bas du registre Phyto** (corrigé au lot NAV-4 : l'audit le situait d'abord dans la barre d'onglets — faux, il est sous la liste, `#phyto-export-row`) | `openDocs`, `docsGo`, `#phyto-export-row` |
| Fiches d'aide qui envoient dans **Réglages › App** pour imprimer | **9** phrases sur 6 modules (Parcelles, Journal, Tracteur, Planning ×2, Cave, Réglages…) | `MV_AIDE` |
| Bouton « maison » dans l'en-tête | **11** pages sur 11 — il double le dock, et sur l'Accueil il renvoie un admin… au Pilotage | `goHub()` |
| Titre d'en-tête ≠ mot du dock | **3** : dock « Vigne » → en-têtes « Accueil / Mes Parcelles / Journal » ; « Cave » → « La Cave » ; « Réserve » → « La Réserve » | `.mod-header-title` |
| Bande de chiffres sur l'écran Réglages | Membres · Tâches · Tracteurs — trois compteurs sur un écran de réglage | `#regl-kpis` |
| Une même donnée, deux écrans de saisie | `CONFIG.eco` s'écrit depuis **Réglages › Domaine › Économie & conformité** *et* **Pilotage › Paramétrage** | `_ecoRenderConfigCard`, `_pilSimEcoCard`, `_pecHypoSet` |
| Aide qui dit faux | « Rien ne se saisit ici : tout est en lecture seule » (fiche Pilotage, point 1) — Achats, Décider, Paramétrage et le mois d'exercice **écrivent** · guide Réglages : « paramètres du simulateur » dans Domaine — ils sont dans Pilotage | `MV_AIDE.pilotage`, `guide/12` |
| Page morte | `#page-chat` (7 Ko), aucun appelant, API Firestore v8 — déjà documenté §51 | `index.html:1507` |

## 2. Les incohérences, une par une

### 2.1 Quatre façons de ranger un réglage — la cause racine
La Cave garde ses réglages **chez elle** (⚙, lot CAVE-2, validé). La Vigne et le Tracteur ont les
leurs **dans un autre module** (Réglages › Vigne, Réglages › Tracteur). Le Planning les met dans **un
onglet du quotidien** (Le cadre). Le Pilotage les cache **derrière un bouton « Outils »** et les
appelle autrement (Paramétrage). Quatre patrons pour une seule question : *où est-ce que ça se règle ?*
C'est la faute de la Cave (§94a), généralisée : chaque module a rangé selon sa propre logique, et
l'utilisateur doit retenir quatre logiques.

### 2.2 Les documents sont rangés sous « App »
Un registre phyto, un relevé d'heures ou un cahier de cuverie ne sont pas des réglages d'application.
Ils vivent pourtant dans **Réglages › App**, à deux tapotements d'un « Plus » sur téléphone, et neuf
phrases d'aide envoient là-bas. `MV_DOCS` porte déjà un champ `mod` par document : l'information
existe, elle n'est pas servie là où on en a besoin.

### 2.3 Un bouton d'export au bas du registre
*(Corrigé au lot NAV-4 : cette section situait le bouton dans `#phyto-tabs-row` — il est en réalité sous la
liste du registre, `#phyto-export-row`, pleine largeur, violet, admin.)* C'est une troisième porte vers un
document, hors de la règle « un document se prend dans la roue du module » — la conclusion tient, la
localisation ne tenait pas.

### 2.4 Deux sorties dans chaque en-tête
Le dock est le seul moyen de changer de module — sauf le bouton 🏠, présent sur les 11 pages, qui fait
la même chose que le premier onglet du dock. Sur l'Accueil de la Vigne, il ne fait rien pour un
ouvrier et **envoie l'admin au Pilotage** (`_landingPage`). Un bouton qui ne fait pas la même chose
selon qui le presse n'est pas un bouton, c'est un piège.

### 2.5 Le titre change quand on change d'onglet — dans un seul module
Vigne : trois pages (`page-home`, `page-parcelles`, `page-journal`), trois en-têtes, trois copies de
la même barre, trois titres (« Accueil », « Mes Parcelles », « Journal »). Partout ailleurs, le titre
est le module et l'onglet dit où l'on est.

### 2.6 Trois mots pour une chose, et deux écrans pour une donnée
« Réglages », « Paramétrage », « Le cadre » — trois portes, trois vocabulaires. Et `CONFIG.eco` a deux
écrivains à deux endroits ; le premier (Réglages › Domaine) a même une rubrique « Se renseigne
ailleurs » qui renvoie vers le second. *Un écran qui commence par dire « ce n'est pas ici » n'a pas de
raison d'exister.*

### 2.7 Réglages : cinq onglets qui défilent, et trois compteurs qui ne servent à rien
`mvu-tabs-many` sur 390 px = la barre défile. Le cinquième onglet (App) est le seul que voient les
non-admins : ils ouvrent « Réglages » et trouvent un écran sans onglet, mêlant mot de passe, thème,
documents du domaine et « Réinitialiser l'application ». Les trois KPI en tête (Membres · Tâches ·
Tracteurs) sont de la décoration : rien ne se décide à partir d'eux.

## 3. Le modèle cible — six règles

1. **Un module règle ses affaires chez lui.** Chaque en-tête porte une roue crantée ⚙ (le patron
   CAVE-2, généralisé). Elle ouvre une feuille : les réglages **du module**, puis ses **documents**.
   Réglages › Vigne, Réglages › Tracteur, Planning › Le cadre, Pilotage › Outils › Paramétrage,
   « Choisir les indicateurs » : tout part dans la roue de son module.
2. **Réglages ne garde que ce qui n'appartient à aucun module** : **Domaine** (identité, campagne,
   appellations, SIRET & bio, données & sauvegarde) · **Équipe** (membres, accès, contrats) · **Moi**
   (mot de passe, thème, notifications, aide, CGU, déconnexion). Cinq onglets → trois. Bande KPI supprimée.
3. **Un document se prend dans la roue du module qui le produit.** Même catalogue `MV_DOCS`,
   filtré par `mod`. Le hub complet reste dans Réglages › Domaine › « Données & sauvegarde » et au
   pied de chaque roue (« Tous les documents »). Le bouton CSV quitte la barre d'onglets du Phyto.
4. **Un seul mot : Réglages.** « Paramétrage » et « Le cadre » disparaissent des barres (le lint de
   vocabulaire les bannit). L'en-tête porte le mot du dock : Vigne, Cave, Réserve — pas trois titres.
5. **Une seule sortie par en-tête.** Le 🏠 disparaît des 11 pages ; le dock est la seule navigation
   entre modules. L'en-tête garde ⚙ à droite et « ? Aide » dans la ligne de méta.
6. **L'aide dit vrai** : la fiche Pilotage cesse de promettre qu'on n'y écrit rien ; le guide
   Réglages cesse de situer le simulateur dans Domaine. Corrigé dans le lot qui touche l'écran, jamais après.

**Ce qui ne bouge pas** : l'ordre du dock (4 + Plus), le mode tracteur, les onglets de la Cave
(série CAVE validée), les onglets du Pilotage (§34), la visite guidée dans son principe.

## 4. Avant / après

| | Avant | Après |
|---|---|---|
| Endroits où l'on règle | 6 | **1 règle** (⚙ du module) + Réglages transversal |
| Mots pour « réglage » | 3 | **1** |
| Portes vers un document | 3 + 9 renvois textuels | **1 règle** (⚙ du module) |
| Onglets de Réglages | 5 (défilent) | **3** |
| Boutons de sortie dans l'en-tête | 2 (🏠 + dock) | **1** (dock) |
| Titres d'en-tête pour la Vigne | 3 | **1** |
| Écrans de saisie de `CONFIG.eco` | 2 | **1** (Pilotage ⚙) |
| Onglets du Planning admin | 3 (dont un de réglage) | **2** |
| Bouton « Outils » du Pilotage | Archives + Paramétrage | **Archives** devient un onglet après le filet ; Paramétrage → ⚙ |
| Bande KPI de Réglages | 3 chiffres | 0 |

## 5. Découpage en lots (après validation de la maquette)

| Lot | Contenu | Fichiers | Bump | Risque |
|---|---|---|---|---|
| **NAV-1 · Socle** | Composant ⚙ générique (`_mvReglOpen(mod)` : feuille, sections déclarées dans un registre `MV_REGL[mod]`, bloc Documents via `MV_DOCS.filter(mod)`) · 🏠 retiré des 11 en-têtes · en-tête Vigne unique (« Vigne », un seul `.mod-header` pour les trois pages) · bande KPI de Réglages retirée | `index.html`, `app.js`, `utils.js`, `styles.css`, `sw.js` | APP · SW | Faible : rien ne bouge de place, on pose la porte |
| **NAV-2 · Vigne + Tracteur** | Les panneaux `#regl-view-vigne` et `#regl-view-tracteur` sont **reparentés** dans la roue de leur module (mêmes `id`, `reglages.js` continue d'écrire dedans) · Réglages 5 → 3 onglets (Domaine · Équipe · Moi) · conso GNR → Tracteur ⚙ | `index.html`, `reglages.js`, `utils.js`, `sw.js` | APP · SW | Moyen : `_mvtSteps` et la démo visent `#regl-view-*` → C22 |
| **NAV-3 · Planning** | « Le cadre » sort de `#plan-tabs` et devient la roue du Planning · `_PLAN_TAB_MIGR.cadre → 'mois'` · barre à 2 onglets (l'ouvrier n'en a toujours aucun) | `planning.js`, `index.html`, `utils.js`, `sw.js` | APP · SW | Faible |
| **NAV-4 · Pilotage** | Paramétrage + « Choisir les indicateurs » → roue · « Outils » disparaît, **Archives** devient le 8ᵉ onglet après le filet · `_PIL_TAB_MIGR.param → 'auj'` · IFT de référence quitte Réglages › Domaine · fiche `MV_AIDE.pilotage` point 1 réécrit | `pilotage.js`, `reglages.js`, `utils.js`, `sw.js` | APP · SW | Moyen : `_pilBindContent`, harnais `echelle` (grave 8 clés) |
| **NAV-5 · Documents** | Bloc Documents dans chaque roue · les 6 `mod:''` de `MV_DOCS` reçoivent leur module (vigne ×4, planning, domaine) · bouton CSV hors de `#phyto-tabs-row` · Réglages › App › Documents → Réglages › Domaine › Données & sauvegarde · les 9 renvois « Réglages, onglet App » réécrits · guide (04, 06, 07, 08, 10, 11, 12, 13) | `reglages.js`, `phyto.js`, `index.html`, `utils.js`, `guide/*`, `sw.js` | APP · SW | Faible, mais **12 textes à relire à voix haute** |
| **NAV-6 · Vocabulaire** | « Paramétrage » et « Le cadre » bannis (`lint-vocabulaire`) · titres d'en-tête = mots du dock · casse « Le Millésime » alignée sur « Le Cuvier / Le Chai » (à trancher) · `#page-chat` retiré (§51 dit « on ne supprime pas » — à trancher aussi) | `index.html`, `cave.js`, `reserve.js`, `scripts/`, `sw.js` | APP · SW | Faible |

Chaque lot : preflight + harnais + contre-épreuves, guide, `MV_AIDE`, `WHATS_NEW`, `_mvtSteps`,
section `CLAUDE.md` — la clôture en six lignes, sans exception (règle d'or n°4).

## 6. Ce que je n'ai pas vérifié
- Le rendu réel des écrans (aucun navigateur lancé sur l'app : l'inventaire vient du DOM d'`index.html`,
  des fonctions de rendu et des fiches `MV_AIDE`, qui sont tenues à jour par la règle n°4).
- Le comportement du bouton 🏠 sur mobile n'a pas été testé ; sa cible (`_landingPage`) est lue dans le code.
- La visite guidée et la démo : les sélecteurs qu'elles visent dans Réglages seront listés au lot NAV-2, pas avant.

## 7. À trancher sur la maquette
1. La roue crantée sur **tous** les modules, y compris Phyto et Réserve (documents seulement) — ou seulement là où il y a un réglage ?
2. Titre d'en-tête = mot du dock (« Cave », « Réserve ») ou article conservé (« La Cave », « La Réserve ») ?
3. « Moi » ou « App » pour le troisième onglet de Réglages ?
4. Archives : onglet après le filet, ou bouton seul à droite de la barre ?
5. `#page-chat` : on le retire, ou §51 tient toujours ?
