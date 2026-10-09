# Ma Vigne — Chantiers §280 à §329

> Ouvert le 08/10/2026 (§280), sur le modèle de `chantiers-230-279.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été remonté dans `CLAUDE.md`
> (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches de 50). Au-delà de la
> dernière tranche, créer le fichier suivant sur le même modèle.

---

## 280. ★★ PLAN-2 — PLANNING « LES GENS » EN LISTE + FICHE (08/10 — `src/planning.js` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-plan2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/PLAN-2.json` · **APP 8.51 → 8.52, SW 9.29 → 9.30**, base `b80419d`, **zip cumulatif avec DS-4 … PLAN-1 non poussés**)

### 280a. Ce qui change

- **La fiche reste celle de l'appli** (`#ovPlanFiche` : `_planFicheRender`, onglets Résumé / Jours / Compteur / Congés et acomptes, mois,
  relevé, ouverture d'un jour). `_plGensDock()` (neuve, appelée à la fin de `_planRenderBody` et de `planSwitchTab`) : sur « Les gens »,
  à partir de 1 024 px, pour un administrateur, elle RANGE la fiche dans `#page-planning` (en gardant sa place d'origine dans
  `_plFicheChez`) et y ouvre la première personne (ou celle déjà ouverte) ; ailleurs, elle la rend à sa place et la ferme.
  `_plGensMarque()` (appelée à la fin de `_planFicheRender`) marque la ligne ouverte. Passer d'un écran large à un étroit relance le tout.
- **CSS**, bloc `★ PLAN-2` … `★ FIN PLAN-2`, par jetons : les cartes de salariés deviennent des lignes de liste (avatar neutre, nom,
  heures, barre, écart ; la personne ouverte en `--accent-doux`) ; en mode rangé, la page passe en grille de deux colonnes (en-tête sur
  toute la largeur), la fiche tient la seconde, collante, son corps défile. L'en-tête de la fiche passe sur fond clair (nom en Cormorant,
  boutons du kit) — au téléphone aussi. Jeton neuf `--l-fiche`.
- Aide (`MV_AIDE.planning`, « Deux onglets ») : la fiche à droite sur ordinateur.

### 280b. Mesuré

- `mv-harnais-plan2` (neuf, branché) : 9 assertions — la vraie `_plGensDock` jouée sur un faux DOM (rangée sur « Les gens » au large,
  première personne ouverte ; rendue à sa place au retour ; rien au téléphone ni sur « Le mois ») — et 7 contre-épreuves.
- Rendu de la vraie appli : « Les gens » liste + fiche, une autre personne, retour au mois (fiche partie), l'Accueil (pas de fiche
  égarée), le sombre, le téléphone (fiche par-dessus, inchangée).

### 280c. Ouvert

Le récapitulatif annuel de l'équipe garde son dessin (titre en capitales, mois en cours en violet) ; les panneaux « Congés / Chaleur sur
une période » et la feuille des heures aussi. Le geste « une case → un panneau » de la v5 n'est pas repris (§279d).

## 281. ★ PLAN-3 — LES FEUILLES DU PLANNING ET LE RÉCAPITULATIF ANNUEL À LA CHARTE (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-plan3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `lots/PLAN-3.json` · **APP 8.52 → 8.53, SW 9.30 → 9.31**, base `b80419d`, **zip cumulatif avec DS-4 … PLAN-2 non poussés**)

### 281a. Ce qui change (habit seulement)

Bloc CSS `★ PLAN-3` … `★ FIN PLAN-3`, par jetons. Les feuilles du Planning partagent `.pl2-sheet` dans un `.overlay` (`#ovPlanCP`,
`#ovPlanChaleur`, `#ovPlanFiche`) ; la journée d'un salarié (`#ovPlanDay`) a son en-tête `.plan-modal-hdr`, qui était violet. Toutes :
en-tête clair (titre en Cormorant, flèches et puces du kit, salarié choisi à l'accent), champs du kit, note `.pl2-note` sur fond doux,
`.pl2-ed-btn` / `.pl2-ed-heat` à l'accent, `.pl2-ed-ghost` en secondaire. Récap annuel (`.plan-card`) : titre en casse normale, barres
neutres, mois en cours à l'accent — repéré par `.plan-bar-fill:not([style*="gris-clair"])`, parce que `planning.js` peint les autres mois
en `var(--gris-clair)` et le mois en cours en `PLAN_ACC2` (le harnais garde cette ligne : si elle change, la règle doit suivre).

### 281b. Mesuré

`mv-harnais-plan3` (neuf, branché) : 7 assertions, 6 contre-épreuves. `mv-harnais-typo` : `styles.css` a dépassé 5 % de croissance depuis le regravage d'ACC-1 (blocs PLAN-1 à PLAN-3) ; découpage de la feuille toujours hors de ce plan, cliquet regravé. Rendu de la vraie appli : les trois feuilles ouvertes et le récap,
avant / après ; la journée, restée violette au premier passage (son en-tête n'est pas un `.pl2-sh-hdr`), corrigée et recapturée.

### 281c. Ouvert

Dans le corps des feuilles, quelques éléments gardent l'orange (pastilles des jours de congé, compte de jours, petites étiquettes « AU »,
« FIN ») et les puces de salarié leur violet : ils sont dessinés par `planning.js` avec des couleurs écrites, à reprendre dans un lot qui
touche le code. « Enregistrer » et « Enreg. → suiv. » sont tous deux à l'accent dans la journée.

## 282. ★★ TRAC-1 — LES SESSIONS DU TRACTEUR EN LISTE + FICHE (MAQUETTE V6) (08/10 — `src/tracteur.js` · `index.html` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-trac1.mjs` (neuf) · `scripts/mv-harnais-kit4.mjs` · `scripts/mv-harnais-liste.mjs` · `lots/TRAC-1.json` · **APP 8.53 → 8.54, SW 9.31 → 9.32**, base `b80419d`, **zip cumulatif avec DS-4 … PLAN-3 non poussés**)

### 282a. D'où ça vient

La maquette v6 (hors dépôt, `maquette-coquille-v6.html`) dessine le Tracteur à partir de l'écran réel (filtres conducteur / activité,
trois chiffres, « Démarrer une session » avec tracteur par défaut, cuve de GNR, machines, révision, fiches d'entretien). Nico : « go » ;
il précise que le GNR se calcule depuis le chrono, avec une valeur de 6 L/h pour qui ne relève pas. TRAC-1 = Sessions ; TRAC-2 = Entretien.

### 282b. Ce qui change

- `index.html` : `<aside class="trf" id="trac-fiche">` après `#sessions-list`.
- `mkScard` : sur ordinateur, `onclick="_trSel(id)"` (et `data-sid`, `aria-selected`) pour toute session ; au téléphone, le geste
  d'avant (`openSessionDetail` pour qui a le droit).
- `_trFicheSync(liste)` après chaque rendu (et sur une liste vide) ; `_trFicheHtml(s)` : activité, conducteur, tracteur, dates, état ;
  avancement, surface faite sur surface utile (parcelles désactivées et arrachées exclues, même calcul que la carte), parcelles,
  note ; bouton « Enregistrer l'avancement » (tractoriste, session en cours) ou « Ouvrir la session » (admin) → `openSessionDetail`.
- ⚠️ **Pourquoi pas la feuille posée à droite, comme la fiche du Planning (§280)** : la feuille de travail est un outil de terrain dont la
  FERMETURE fige le chrono (`closeSessionDetail` → `_chronoFinalizeOnClose`, puis « Passage enregistré ») ; la laisser ouverte à côté de
  la liste changerait le sens de ce geste.
- CSS, bloc `★ TRAC-1` … `★ FIN TRAC-1`, par jetons : chiffres en bande, filtres en segmentés, cartes au cadre neutre (la carte en cours
  cerclée à l'accent ; date, conducteur et surface lisibles — ils étaient écrits clair pour l'ancienne carte sombre), alerte « tracteur
  modifié » en ambre, invite « Tap pour enregistrer » cachée sur ordinateur, bouton flottant à l'accent ; deux colonnes et fiche collante.
- Aide (« Sur un ordinateur »), nouveautés.

### 282c. Mesuré

`mv-harnais-kit4` comptait 7 appels aux formateurs de surface dans `tracteur.js` : la fiche en ajoute 2 (surface faite, surface utile), le compte attendu passe à 9 — vu par la chaîne. `mv-harnais-trac1` (neuf, branché) : 11 assertions — la vraie `_trFicheHtml` sur une fausse session (échappement, surface pondérée
1,5 ha sur 3,5, bouton selon le droit) — et 8 contre-épreuves. Rendu de la vraie appli avec deux sessions de TEST injectées (une en cours,
une terminée) : choix, fiche, sombre, téléphone ; au premier passage, la date et le conducteur de la carte en cours étaient invisibles
(écrits clair pour la carte sombre d'avant) — corrigé.

### 282d. Ouvert

Heures de moteur et GNR dans la fiche : le chrono se garde par session (`_chrLoad` / `_chrSave`), il faut tracer où vit son total avant
d'afficher « heures × 6 L/h ». TRAC-2 : l'Entretien (cuve, machines, révision, fiches) au dessin de la v6.

## 283. ★ TRAC-2 — L'ENTRETIEN DU TRACTEUR SUR DEUX COLONNES (MAQUETTE V6) (08/10 — `src/tracteur.js` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-trac2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/TRAC-2.json` · **APP 8.54 → 8.55, SW 9.32 → 9.33**, base `b80419d`, **zip cumulatif avec DS-4 … TRAC-1 non poussés**)

### 283a. Ce qui change

- `_trEntDock()` (neuve), appelée à la fin de `renderEntretiens` : sur ordinateur, elle crée `#ent-gauche` en tête de
  `#trac-panel-entretiens` et y RANGE le filtre des machines (`#ent-trac-filter`) et la carte de la cuve (la `.ent-resume-card` qui porte
  `openGnrAppoint`, recréée à chaque rendu : l'ancienne est retirée) ; au téléphone, le filtre revient en tête et la colonne disparaît.
  ⚠️ D'abord appelée depuis `renderTracteur` seulement : changer de machine (`selectTracteur`) ne repasse pas par là — la colonne de gauche
  restait vide sur la capture. Déplacée à la fin de `renderEntretiens`, le seul passage commun.
- CSS, bloc `★ TRAC-2` … `★ FIN TRAC-2`, par jetons : machines en segmenté au téléphone, en liste à gauche sur ordinateur (la choisie en
  `--accent-doux`) ; cartes au cadre neutre ; boutons du kit, « Appoint de cuve » et « Nouvelle fiche d'entretien » à l'accent ; carte des
  contrôles bordée de rouge quand une anomalie n'est pas traitée, bandeau d'anomalie en rouge pâle ; deux colonnes, la gauche collante.
- Aide (« Sur un ordinateur », complété), nouveautés.

### 283b. Mesuré

`mv-harnais-robustesse-tracteur` (qui joue `tracteur.js` sur un faux DOM où tout identifiant rend un élément) plantait : la colonne ne se défait plus que si elle est vraiment posée (`g.parentNode===pan`) — vu par la chaîne. `mv-harnais-trac2` (neuf, branché) : 8 assertions — la vraie `_trEntDock` jouée sur un faux DOM (au large, filtre et cuve à gauche, la révision
reste ; au téléphone, rien ; retour à l'étroit) — et 6 contre-épreuves. Rendu de la vraie appli avec deux fiches de contrôle de TEST (une
anomalie non traitée) : une machine, « Tous », sombre, téléphone.

### 283c. Écart avec la maquette

La v6 dessinait des fiches d'entretien chiffrées (vidange, 280 €, à 1 700 h) et un compteur d'heures par machine. Dans l'appli, une « fiche
d'entretien » est un CONTRÔLE (plein, huile, filtre à air, radiateur, pneus, lavage, anomalie), résumé par « Derniers contrôles » : il est gardé
tel quel. Le coût de l'entretien par machine n'existe pas dans les données.

## 284. ★★ TRAC-3 — LE TRACTEUR FINI : HEURES ET GNR, « DÉMARRER UNE SESSION », FENÊTRES (08/10 — `src/tracteur.js` · `index.html` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-trac3.mjs` (neuf) · `scripts/mv-harnais-trac1.mjs` · `scripts/mv-harnais-liste.mjs` · `lots/TRAC-3.json` · **APP 8.55 → 8.56, SW 9.33 → 9.34**, base `b80419d`, **zip cumulatif avec DS-4 … TRAC-2 non poussés**)

### 284a. D'où ça vient

Nico : « finis le Tracteur avant de passer à la suite ». Restait de la v6 : les heures et le GNR d'une session (TRAC-1 les avait laissés,
faute de savoir où vit le total du chrono), « Démarrer une session » comme bouton, et les fenêtres. Nico avait précisé : le GNR se calcule
avec le chrono, et 6 L/h pour qui ne relève pas.

### 284b. Ce qui change

- **Où vivent les minutes** : le chrono de travail (`_chrono`, `_chrSave` / `_chrLoad`) est l'état de la mesure EN COURS, gardé sur
  l'appareil ; les minutes d'une parcelle FINIE sont écrites dans l'entrée de `parcellesFaites` (`mes`, ou `dmin`), donc synchronisées avec
  la session — c'est ce que lit `_chrMes`.
- `_trMinutes(s)` : pour chaque parcelle faite, les minutes du chrono si elles existent, sinon le barème de l'activité (`_sessBaremeMin` :
  h/ha × surface) — la règle que le Pilotage annonce pour le coût du tracteur. `_trConsoLh()` : `CONFIG.eco.conso_gnr_lh`, 6 si elle n'est pas
  réglée — la valeur de `_ecoCfg` (pilotage.js) et de Réglages. `_trHeuresFr` : une décimale, virgule.
- Fiche d'une session : « Heures de moteur » (et d'où elles viennent : au chrono, au barème, ou les deux) et « GNR » (heures × L/h, « valeur
  par défaut » quand la consommation n'est pas réglée).
- Bande : 4ᵉ case « Heures de moteur », le total de la saison par la même fonction (`#trac-stat-h`).
- « Démarrer une session » : bouton `#trac-new-btn` au-dessus de la liste, visible pour qui peut démarrer (même règle que le bouton flottant) ;
  CSS : le bouton au large, le flottant à l'étroit.
- Fenêtres du Tracteur (nouvelle session, feuille de travail, modification, fiches de contrôle, outils) : fond et en-tête clairs, libellés
  en casse normale, champs et sélecteur de conducteur au kit, « Créer la session » et « Enregistrer » à l'accent, plus de bleu acier dans
  le bandeau d'avancement de la feuille.

### 284c. Mesuré

`mv-harnais-trac3` (neuf, branché) : 9 assertions — les vraies `_trMinutes` / `_trConsoLh` sur une fausse session (90 min au chrono + 60 min
au barème = 2,5 h ; 6 L/h par défaut, 8 L/h réglés) — et 8 contre-épreuves. `mv-harnais-trac1` reçoit les vraies fonctions d'heures (la fiche
les appelle). Rendu de la vraie appli avec des minutes de chrono de TEST : bande à 4,9 h, fiche « 3,3 h au chrono, 20 L, 6 L par heure, valeur
par défaut », nouvelle session et feuille de travail au kit, téléphone.

### 284d. Ouvert

Le temps « hors parcelle » du chrono (`horsMs`) n'est pas compté : il vit dans l'état de mesure de l'appareil, pas sur la session. Les cartes
« tracteur utilisé » de la nouvelle session gardent leur pastille de choix sombre.

## 285. ★★ PHYTO-1 — LE REGISTRE PHYTO EN LISTE + FICHE (MAQUETTE V7) (08/10 — `src/tracteur.js` · `src/phyto.js` · `index.html` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-phyto1.mjs` (neuf) · `scripts/mv-harnais-trac3.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `lots/PHYTO-1.json` · **APP 8.56 → 8.57, SW 9.34 → 9.35**, base `b80419d`, **zip cumulatif avec DS-4 … TRAC-3 non poussés**)

### 285a. D'où ça vient

La maquette v7 (hors dépôt, `maquette-coquille-v7.html`) dessine le Phyto depuis l'écran réel : Registre, Catalogue (E-Phy), Fertilisation.
Nico la valide avec une règle : « on fait ce que la loi oblige de faire, comme de base dans l'appli ». Les ajouts de la maquette (chiffres,
matériel et volume de bouillie, liste « contrôle » inventée) ne passent donc pas dans l'appli ; seul le dessin passe, sur ce que l'appli tient.

### 285b. Ce qui change

- `index.html` : `#ph-new-btn` (« Saisir un traitement » → `openOvTraitement`) et `<aside id="ph-fiche">` autour de `#traitements-list-trac`.
- `renderPhytoTrac` (tracteur.js) : la carte appelle `_phSel(idx)` (sur ordinateur : choisir ; au téléphone : `openTraitDetail`, comme avant),
  `_phFicheSync` après chaque rendu (et sur une liste vide). `_phFicheHtml(i)` lit `_phResolve(t)` et `dreEffectif` comme le détail :
  produit, type, AMM, date, opérateur ; dose ; réentrée et avant-récolte avec leur fin (alerte rouge pendant la réentrée) ; parcelles ; ZNT,
  substance, cible quand elles existent ; un champ absent est tu, jamais inventé ; « Ouvrir le traitement » → `openTraitDetail`.
- `_phytoSyncTabs` (phyto.js) : classe `ph-reg-on` sur la page quand le Registre est affiché, bouton de saisie pour admin ou tractoriste.
- CSS, bloc `★ PHYTO-1` … `★ FIN PHYTO-1`, par jetons : lignes au cadre neutre (la choisie cerclée), alerte DAR en rouge pâle, bouton de saisie,
  bouton flottant à l'accent et caché au large, fenêtre de saisie au kit ; liste + fiche sur le Registre seulement. La fiche partage les règles
  de celle du Tracteur : `#trac-fiche .trf…` devient `:is(#trac-fiche,#ph-fiche) .trf…` dans le bloc TRAC-1 (26 règles).
- ⚠️ **Corrigé au passage (TRAC-3)** : `#page-tracteur .trac-new{ display:inline-flex!important; }` au large écrasait le `display:none` que le JS
  pose pour qui n'a pas le droit de démarrer — un lecteur voyait le bouton. Retiré ; `mv-harnais-trac3` vérifie désormais son absence.

### 285c. Mesuré

`preflight` (C24c) comptait deux substitutions `${…}` de plus dans un gabarit de `tracteur.js` (`data-pidx`, `aria-selected`) : réglées : `data-pidx` passe par `Number`, et `aria-selected` sort du gabarit — `_phMarque` le pose après chaque rendu (une version par `_escAttr` faisait planter `mv-harnais-textea`, qui joue `renderPhytoTrac` seule, hors du module ; pour la même raison, l'appel à `_phFicheSync` en fin de rendu porte une garde de type — vu par la chaîne). `mv-harnais-typo` : `tracteur.js` a passé 5 % de croissance depuis le dernier regravage (lots TRAC-1 à PHYTO-1), cliquet regravé. `mv-harnais-phyto1` (neuf, branché) : 12 assertions — la vraie `_phFicheHtml` sur un faux traitement (mentions, échappement, réentrée en cours,
ZNT et cible ; un traitement sans délais ni parcelles ne montre ni alerte ni section inventée) — et 8 contre-épreuves. Rendu de la vraie appli
avec deux traitements de TEST : fiche, autre traitement, fenêtre de saisie, sombre, téléphone.

## 286. ★ PHYTO-2 — LE CATALOGUE E-PHY EN LISTE + FICHE (MAQUETTE V7) (08/10 — `src/tracteur.js` · `index.html` · `src/styles.css` · `src/utils.js` (aide, APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-phyto2.mjs` (neuf) · `scripts/mv-harnais-phyto1.mjs` · `scripts/mv-harnais-liste.mjs` · `lots/PHYTO-2.json` · **APP 8.57 → 8.58, SW 9.35 → 9.36**, base `b80419d`, **zip cumulatif avec DS-4 … PHYTO-1 non poussés**)

### 286a. Ce qui change

- `openEphyDetail(amm, dans)` : second paramètre facultatif. Sans lui, rien ne change (titre, sous-titre, corps dans `#ovEphyDetail`,
  `openOv`). Avec l'id d'un conteneur, le MÊME corps (statut, délai de rentrée selon l'arrêté du 4 mai 2017, substance, autres noms,
  mentions, usages vigne, avertissement « donnée indicative ») s'y écrit sous un en-tête de fiche, et aucune fenêtre ne s'ouvre — la règle
  de Nico tient d'elle-même : la fiche ne montre que ce que l'appli montrait déjà.
- `ephyRender` : la ligne porte `data-amm` et appelle `_catSel` (sur ordinateur : choisir ; au téléphone : la fenêtre) ; en fin de rendu,
  `_catFicheSync(l)` (garde de type) suit la liste filtrée : le produit choisi reste s'il est encore affiché, sinon le premier.
- `index.html` : `<aside id="cat-fiche">` dans `#tab-cat-trac`. CSS, bloc `★ PHYTO-2` … `★ FIN PHYTO-2`, par jetons : recherche au kit, types en
  segmenté, interrupteur « retirés » à l'accent, lignes au cadre neutre (le choisi cerclé), source en petit ; deux colonnes au large. Les
  règles de fiche partagées passent à `:is(#trac-fiche,#ph-fiche,#cat-fiche)`.

### 286b. Mesuré

`mv-harnais-phyto2` (neuf, branché) : 9 assertions — la vraie `openEphyDetail` avec et sans conteneur (dans la fiche : nom échappé, AMM,
statut, usages, avertissement, aucune fenêtre ; sans : la fenêtre comme avant) — et 7 contre-épreuves. Rendu de la vraie appli avec trois
produits E-Phy de TEST (dont un retiré) : fiche, autre produit, sombre, téléphone.

## 287. ★ PHYTO-3 — LA FERTILISATION À LA CHARTE (MAQUETTE V7) (08/10 — `src/styles.css` · `src/phyto.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-phyto3.mjs` (neuf) · `scripts/mv-harnais-phyto1.mjs` · `scripts/mv-harnais-liste.mjs` · `lots/PHYTO-3.json` · **APP 8.58 → 8.59, SW 9.36 → 9.37**, base `b80419d`, **zip cumulatif avec DS-4 … PHYTO-2 non poussés**)

### 287a. Ce qui change (habit seulement)

- L'onglet Fertilisation dessine avec sa propre feuille, injectée à l'exécution (`_ferCss`, classes `fer-*`, rayon 16 px, vert, violet
  phyto, orange). Le bloc CSS `★ PHYTO-3` … `★ FIN PHYTO-3` la recale sur les jetons par une spécificité plus forte —
  `:is(#page-phyto,#ovFerti,#ovFerParc) .fer-…` l'emporte sur `.fer-…`, même injecté après — : cartes au cadre neutre, encadrés
  (information sur fond doux, alerte en ambre, rouge pâle), puces (zone vulnérable à l'accent), segmenté, jauges, coches, liens à l'accent.
  Sur ordinateur, les cartes vont par deux, la carte qui porte la liste du contrôle (`:has(.fer-cf)`) prend toute la largeur ;
  « Imprimer le cahier » (`_ferExportPdf`) à l'accent.
- `#ph-new-btn` appelle `_phytoFab` (qui ouvre l'amendement sur la Fertilisation, le traitement ailleurs) ; `_phytoSyncTabs` le relabellise
  et le montre selon le droit : amendement pour l'admin (comme `openOvFerti`), traitement pour l'admin ou le tractoriste, rien au Catalogue.

### 287b. Mesuré

`mv-harnais-phyto3` (neuf, branché) : 8 assertions — la vraie ligne de `_phytoSyncTabs` jouée pour chaque onglet et chaque droit — et 7
contre-épreuves. Rendu de la vraie appli : la Fertilisation (sans apport : les données de test n'en ont pas), la fenêtre d'amendement, sombre,
téléphone. « Ce qu'un contrôle va demander » existait déjà dans l'appli (zone vulnérable, rendement, analyse de sol, fractionnement, plan
prévisionnel) : la maquette v7 le reprenait sans le savoir.

## 288. ★ CAVE-1 — LA CAVE › AUJOURD'HUI ET SA BANDE (MAQUETTE V8) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cave1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/CAVE-1.json` · **APP 8.59 → 8.60, SW 9.37 → 9.38**, base `b80419d`, **zip cumulatif avec DS-4 … PHYTO-2 non poussés**)

### 288a. D'où ça vient

La maquette v8 (hors dépôt, `maquette-coquille-v8.html`) dessine la Cave depuis l'écran réel : la bande (hL en cuve, fûts en vin, à faire,
rentrées), « Ce qui presse » et les quatre semaines (calculés depuis ce qui est saisi), le Cuvier (maturités, récoltes, cuves, tournée), le
Chai (cuvées, bouteilles, journal), le Millésime (ligne de vie face à N-1, courbes). Nico : « go », avec la règle du Phyto. Plan : CAVE-1
(Aujourd'hui et bande), CAVE-2 (Cuvier), CAVE-3 (Chai), CAVE-4 (Millésime).

### 288b. Ce qui change (habit seulement)

`renderCaveAujourdhui` → `_aujRender` dessine un verdict (`.auj-hero` + `due` / `warn` / `ok`) et l'agenda en semaines (`.mlx-wk`, `.mlx-ev`),
avec des feuilles injectées à l'exécution (`_aujInjectCss`, `_mlInjectCss`). Bloc CSS `★ CAVE-1` … `★ FIN CAVE-1`, par jetons, plus spécifique
(`#page-cave`) : bande en quatre cases fines ; verdict en carte au cadre neutre, phrase en Outfit (une phrase, pas un nom d'objet : pas de
Cormorant), gravité en filet intérieur et en couleur ; note de calcul au filet neutre ; semaines en cartes, « en cours » en pastille
`--accent-doux`, évènement dû ou à surveiller par les états, bouton d'action au kit ; au large, grille 7 / 5 : le verdict à gauche sur quatre
rangées, les semaines (ou « rien ne vient ») à droite, le reste sur toute la largeur.

### 288c. Mesuré

`mv-harnais-cave1` (neuf, branché) : 7 assertions (dont la présence des classes recalées dans `cave.js`) et 7 contre-épreuves. Rendu de la vraie
appli : Aujourd'hui en clair, en sombre, au téléphone. ⚠️ Les données de test n'ont ni cuve ni cuvée : l'agenda rempli n'a pas été vu à l'écran.

## 289. ★ CAVE-2 — LE CUVIER À LA CHARTE (MAQUETTE V8) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cave2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/CAVE-2.json` · **APP 8.60 → 8.61, SW 9.38 → 9.39**, base `b80419d`, **zip cumulatif avec DS-4 … CAVE-1 non poussés**)

### 289a. Ce qui change (habit seulement)

Le Cuvier (`cuvier.js`, `renderVendCuves` → `_vendCorpsHtml`) dessine avec sa propre feuille, injectée (`mvv-`). Bloc CSS `★ CAVE-2` …
`★ FIN CAVE-2`, par jetons, recalé par `#page-cave` : lignes de cuve au cadre neutre, la cuve ouverte (`.mvv-row.open`) cerclée à l'accent,
nom en Outfit (une ligne de liste, pas un titre de fiche), sous-ligne en doux ; tri (`.mvv-seg > button.on`) en segmenté, filtres
(`.mvv-fils > button.on`) à l'accent au lieu de la terre ; alerte « cuves à mesurer » en ambre avec filet, ses puces au contour ambre ;
« Nouvelle cuve » à l'accent, « Fusionner des cuves » en secondaire (son style écrit en ligne est écrasé) ; repli « remplissage » et cases
du plan au cadre neutre. Au large, `#mvv-corps` en deux colonnes : les cuves vont par deux, la cuve ouverte prend toute la largeur.

### 289b. Pourquoi pas la liste + fiche de la maquette

La cuve s'ouvre en place (`_vendBascOuv`) et son détail est un outil de travail — relevés de densité, cinétique, décuvage — comme la feuille
d'une session du Tracteur (§282b) : le poser dans une colonne à part changerait l'usage. La « Tournée » (sous-onglet existant) garde son dessin.

### 289c. Mesuré

`mv-harnais-cave2` (neuf, branché) : 7 assertions (dont la présence des classes recalées dans `cuvier.js`) et 7 contre-épreuves. Rendu de la
vraie appli avec trois cuves de TEST en fermentation : liste par deux, alerte « à mesurer », sombre, téléphone.

## 290. ★★ CAVE-3 — LE CHAI EN LISTE + FICHE (MAQUETTE V8) (08/10 — `src/cave.js` · `index.html` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-cave3.mjs` (neuf) · `scripts/mv-harnais-phyto1.mjs` · `scripts/mv-harnais-phyto2.mjs` · `scripts/mv-harnais-liste.mjs` · `lots/CAVE-3.json` · **APP 8.61 → 8.62, SW 9.39 → 9.40**, base `b80419d`, **zip cumulatif avec DS-4 … CAVE-2 non poussés**)

### 290a. Le choix

Avant de choisir, on a lu ce qu'ouvre une cuvée : `openCuveeDetail` remplit `#ovCuveeDetail` d'une fiche d'information à boutons (ouillage,
dernière analyse, dernier soutirage, opérations, modifier, supprimer) — rien qui se fige en fermant, contrairement à la feuille d'une session
(§282b) ou au détail d'une cuve (§289b). Elle passe donc à droite, comme au Catalogue (§286).

### 290b. Ce qui change

- `openCuveeDetail(cuvId, dans)` : avec l'id d'un conteneur, l'en-tête (titre, contenants) et le corps s'y écrivent, et la fenêtre ne s'ouvre
  pas. Au large, quand la liste des cuvées est affichée (`#mvc-view-cuv` visible) et que la fiche existe, un appel SANS conteneur y est
  redirigé : le rafraîchissement après une opération (`openCuveeDetail(id)` en fin d'enregistrement, lignes ~3299 et ~3312) ne rouvre pas la
  fenêtre par-dessus.
- `_caveCuvCardHtml` : la carte porte `data-cuv` et appelle `_chaiSel` ; `renderCaveCuvees` finit par `_chaiFicheSync` (garde de type) sur la
  liste filtrée. `index.html` : `<aside id="chai-fiche">` dans `#mvc-view-cuv`.
- CSS, bloc `★ CAVE-3` … `★ FIN CAVE-3`, par jetons : cartes au cadre neutre (la choisie cerclée), alerte d'ouillage en ambre, « Ouiller les … » et
  « Nouvelle cuvée » à l'accent ; au large, deux colonnes. ⚠️ `switchCaveOng` écrit `display:block` en ligne : la grille passe par
  `#mvc-view-cuv:not([style*="none"]){ display:grid!important }` — vu sur capture, la fiche ne s'affichait pas. Règles de fiche partagées :
  `:is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche)` (harnais PHYTO-1 et PHYTO-2 suivis).

### 290c. Mesuré

`mv-harnais-cave3` (neuf, branché) : 8 assertions — les vraies `_chaiSel` / `_chaiFicheSync` (fiche au large, fenêtre au téléphone, liste filtrée)
et les trois aiguillages d'`openCuveeDetail` — et 7 contre-épreuves. Rendu de la vraie appli avec deux cuvées de TEST : fiche à droite, autre
cuvée sans fenêtre, sombre, téléphone.

## 291. ★ CAVE-4 — LE MILLÉSIME À LA CHARTE (MAQUETTE V8) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cave4.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/CAVE-4.json` · **APP 8.62 → 8.63, SW 9.40 → 9.41**, base `b80419d`, **zip cumulatif avec DS-4 … CAVE-3 non poussés**)

### 291a. Ce qui change (habit seulement)

`renderCaveMillesime` dessine avec deux feuilles injectées : `_mlInjectCss` (`mlx-` : choix du millésime, flux, rendements, organisation,
reste à rentrer, points d'évènement) et `_pcavInjectCss` (`pcav-` : verdict, cartes, tuiles face à N-1, venues du Pilotage au lot CAVE-3 §96).
Bloc CSS `★ CAVE-4` … `★ FIN CAVE-4`, par jetons, recalé par `#page-cave` : choix du millésime au kit, le choisi en `--accent-doux` (au lieu du
noir cave et de l'or) ; étiquettes de section et de tuile en casse normale ; cartes au cadre neutre ; tuiles au fond clair, la tuile mise en
avant (`.dark`) en accent doux ; chiffres et verdict en Outfit (des chiffres, pas des noms) ; rendement au-delà du plafond en rouge pâle, sa
jauge en `--danger`, les autres en `--ok` ; points d'évènement et pastilles par les états.

### 291b. Mesuré

`mv-harnais-couches` (« aucune classe déclarée dans deux feuilles ») lisait `.mlx-rd` et `.mlx-org`, placées après une virgule dans un `:is(…)`, comme déclarées nues dans `styles.css` en plus de `cave.js` : la règle est réécrite en sélecteurs entiers (`#page-cave .mlx-rd, …`), même spécificité — vu par la chaîne. `mv-harnais-cave4` (neuf, branché) : 7 assertions (dont la présence des classes recalées dans `cave.js`) et 6 contre-épreuves. Rendu de la vraie
appli : le Millésime vide (les données de test n'en ont pas), sombre, téléphone. Les tuiles remplies restent à voir avec de vraies données.

## 292. ★ RSV-1 — LA RÉSERVE › FÛTS À LA CHARTE (MAQUETTE V9) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rsv1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/RSV-1.json` · **APP 8.63 → 8.64, SW 9.41 → 9.42**, base `b80419d`, **zip cumulatif avec DS-4 … CAVE-4 non poussés**)

### 292a. D'où ça vient

La maquette v9 (hors dépôt, `maquette-coquille-v9.html`) dessine la Réserve depuis l'écran réel : Fûts (part des anges, parc, lots par
fournisseur), Intrants (achats, inventaire d'ouverture, sorties dérivées), Bilan matière (contrôle bio, UE 2021/771). Nico : « go ».
Plan : RSV-1 (Fûts), RSV-2 (Intrants), RSV-3 (Bilan matière).

### 292b. Ce qui change (habit seulement)

`_rsvFutsHtml` dessine avec la feuille injectée `mvr-` et les cartes du Pilotage `pcav-` (part des anges, pyramide des âges). Bloc CSS
`★ RSV-1` … `★ FIN RSV-1`, par jetons, recalé par `#page-reserve` : carte du parc sur fond clair (au lieu du dégradé noir cave), chiffre en
Outfit, signaux « à réformer » en ambre et « à rendre » en neutre ; trois chiffres en bande ; « Ajouter des fûts » à l'accent, « Inventaire
PDF » et « Se séparer de fûts » au kit ; filtre du millésime au kit, le choisi en `--accent-doux` (plus de terre) ; fournisseurs et lots au
cadre neutre, nom du fournisseur en Outfit, badges neutres ; titres des cartes `pcav-` en casse normale. Au large, `.mvr-body` (760 px au
milieu de l'écran, règle ancienne de `styles.css`) prend la largeur, et les lots d'un fournisseur vont par deux.

### 292c. Pourquoi pas la liste + fiche de la maquette

Toucher un lot ouvre son FORMULAIRE (`_rsvOpenFut` → `#ovRsvFut`, admin seul) : c'est une saisie, pas une fiche à lire. L'histoire d'un lot
dessinée dans la v9 n'est pas affichée ainsi dans l'appli (les mouvements de fûts vivent dans `fut_mouv`) : elle n'est pas inventée ici.

### 292d. Mesuré

`mv-harnais-rsv1` (neuf, branché) : 7 assertions (dont la présence des classes recalées dans `reserve.js` et de la règle des 760 px qu'on lève)
et 6 contre-épreuves. Rendu de la vraie appli avec trois lots de TEST chez deux fournisseurs : pleine largeur, sombre, téléphone.

## 293. ★ RSV-2 — LA RÉSERVE › INTRANTS À LA CHARTE (MAQUETTE V9) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rsv2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/RSV-2.json` · **APP 8.64 → 8.65, SW 9.42 → 9.43**, base `b80419d`, **zip cumulatif avec DS-4 … RSV-1 non poussés**)

### 293a. Le choix

Lu avant de choisir : `_rsvIntrantsHtml` ne rend aucun geste sur la carte d'un intrant (seulement « + Achat », « Inventaire d'ouverture » et
l'édition du consommé manuel) — la carte porte déjà tout. Pas de liste + fiche : l'habit, et les cartes par deux au large.

### 293b. Ce qui change (habit seulement)

Bloc CSS `★ RSV-2` … `★ FIN RSV-2`, par jetons, recalé par `#page-reserve` : cartes au cadre neutre ; nom en Outfit ; étiquette de catégorie au
rayon du kit (ses couleurs de catégorie gardées) ; stock en Outfit. La couleur du stock est écrite en ligne par le rendu (`stCol` : `var(--terre)`
ou `var(--rouge)` si négatif) : elle est lue par attribut — `[style*="terre"]` → `--texte`, `[style*="rouge"]` → `--danger` — pour garder le
signal du négatif. Alerte de stock négatif en rouge pâle avec filet, « consommé à activer » sur fond doux, bouton d'édition du consommé au kit.
Au large, `#mvr-body` passe en deux colonnes quand il porte des cartes d'intrant (`:has(> .mvr-pcard)`), le reste sur toute la largeur.

### 293c. Mesuré

`mv-harnais-rsv2` (neuf, branché) : 6 assertions (dont la couleur du stock écrite en ligne par `reserve.js`, que les règles lisent) et 6
contre-épreuves. Rendu de la vraie appli avec trois intrants de TEST (dont un stock négatif) : cartes par deux, alerte, sombre, téléphone.

## 294. ★ RSV-3 — LE BILAN MATIÈRE À LA CHARTE (MAQUETTE V9) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rsv3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/RSV-3.json` · **APP 8.65 → 8.66, SW 9.43 → 9.44**, base `b80419d`, **zip cumulatif avec DS-4 … RSV-2 non poussés**)

### 294a. Ce qui change (habit seulement)

`_rsvAuditHtml` rend un en-tête, un tableau (ouverture, achats, consommé, stock, cohérence) et la note du contrôle bio (règlement délégué
UE 2021/771) ; leurs règles vivent dans `styles.css` (bloc ancien, l. ~4068 : en-tête `--cave`, titre en Cormorant crème, titres de colonne
terre). Bloc CSS `★ RSV-3` … `★ FIN RSV-3`, par jetons, recalé par `#page-reserve` : en-tête en carte claire au filet du kit, titre en Outfit,
sous-titre doux ; tableau au filet du kit, titres de colonne doux et sans fond, chiffres tabulaires, première colonne en texte ; étiquettes de
catégorie au rayon du kit (œno en accent doux, phyto en ambre) ; « à activer » en doux ; note sur fond doux.

### 294b. Mesuré

`mv-harnais-rsv3` (neuf, branché) : 6 assertions (dont la présence des classes recalées dans `reserve.js`) et 6 contre-épreuves. Rendu de la
vraie appli avec trois intrants de TEST : ⚠️ au premier passage, le stock négatif n'était plus rouge — `#page-reserve .mvr-neg` (1,1,0)
perdait contre `#page-reserve .mvr-exp-tbl td` (1,1,1) ; passé en `td.mvr-neg`. Sombre et téléphone vus.

## 295. ★ RG-1 — RÉGLAGES › DOMAINE À LA CHARTE (MAQUETTE V10) (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rg1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `lots/RG-1.json` · **APP 8.66 → 8.67, SW 9.44 → 9.45**, base `b80419d`, **zip cumulatif avec DS-4 … RSV-3 non poussés**)

### 295a. D'où ça vient

La maquette v10 (hors dépôt, `maquette-coquille-v10.html`) dessine les Réglages depuis l'écran réel : Domaine (identité, nom, invitation,
campagne et périodes, documents), Équipe (membres et rôles), Moi (compte, thème, plein soleil, notifications, aide, zone dangereuse). Nico :
« go ». Règle posée d'avance : les Réglages touchent aux comptes et à la configuration — on ne change que l'habit. Plan : RG-1 (Domaine),
RG-2 (Équipe et Moi).

### 295b. Ce qui change (habit seulement)

Bloc CSS `★ RG-1` … `★ FIN RG-1`, par jetons, recalé par `#page-reglages` (les règles anciennes vivent dans `styles.css`, l. ~818) : carte
d'identité (`.dom-badge`) sur fond clair au lieu du vert plein, nom en Cormorant (le nom du domaine), sous-titre doux ; titres de section en
casse normale ; le conteneur des lignes de chaque section (`.set-sec > .set-title + div`) en carte au cadre neutre, lignes (`.set-row`) à filet
et survol, pastilles d'icône neutres ; segments de la frise de campagne aux coins du kit (leurs couleurs de saison gardées) ; « Nouvelle
période » et « Clôturer la campagne » au kit. Au large, `#regl-view-domaine` en grille de deux colonnes (`:not([style*="none"])` +
`!important`, car `switchReglTab` écrit `display:block` en ligne) : identité, puis « Mon domaine » et « Données » côte à côte (`order`), puis la
campagne sur toute la largeur.

### 295c. Mesuré

`mv-harnais-typo` : `styles.css` a passé 5 % de croissance depuis le regravage de PLAN-3 (blocs TRAC-1 à RG-1) ; découpage de la feuille toujours hors de ce plan, cliquet regravé. `mv-harnais-rg1` (neuf, branché) : 7 assertions (dont les identifiants des sections dans `index.html` et l'écriture en ligne de `switchReglTab`,
sur lesquels s'appuient les règles) et 7 contre-épreuves. Rendu de la vraie appli : Domaine en clair, sombre, téléphone.

## 296. ★★★ RG-2 — RÉGLAGES › ÉQUIPE ET MOI À LA CHARTE : FIN DE LA REFONTE UI (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rg2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/RG-2.json` · **APP 8.67 → 8.68, SW 9.45 → 9.46**, base `b80419d`, **zip cumulatif DS-4 … RG-2 non poussés**)

### 296a. Ce qui change (habit seulement)

Bloc CSS `★ RG-2` … `★ FIN RG-2`, par jetons, recalé par `#page-reglages` : `#membres-list` en carte, chaque `.membre-card` en ligne à filet
(plus de carte ombrée par membre), avatar neutre (au lieu de la couleur écrite en ligne), nom en Outfit, rôles (`.m-role-badge`) au kit en
casse normale, l'admin (`.rb-admin`) en `--accent-doux`, statut doux, crayon de l'e-mail à l'accent ; « Ajouter un membre » à l'accent ;
`#contrats-alertes:empty` caché — la règle de carte de RG-1 (`.set-sec > .set-title + div`) en faisait un trait vide sous le titre, vu sur
capture. « Moi » : la zone dangereuse (`.set-sec-danger`) en carte bordée de `--danger`, sans le filet gauche ancien ; au large, sections par
deux (`#regl-view-app:not([style*="none"])` + `!important`, comme RG-1).

### 296b. Mesuré

`mv-harnais-rg2` (neuf, branché) : 7 assertions et 7 contre-épreuves. Rendu de la vraie appli : Équipe et Moi en clair, sombre, téléphone (les
rôles restent visibles au téléphone, comme promis à la v10).

### 296c. Bilan de la refonte (DS-4 → RG-2, §270 à §296)

Vingt-sept lots sur la base `b80419d`, chacun livré en zip cumulatif, chaîne complète verte à chaque fois (de 289 à 335 commandes). Méthode
tenue d'un bout à l'autre : relevé de l'écran réel → maquette (v1 à v10, hors dépôt) → validation de Nico → intégration ; habit par jetons et
par blocs CSS bornés (`★ X` … `★ FIN X`), recalant les feuilles injectées par une spécificité plus forte plutôt qu'en les réécrivant ; un
harnais par lot qui vérifie aussi la présence des classes recalées dans le code ; règle de Nico pour le Phyto, la Cave, la Réserve et les
Réglages : ne montrer que ce que l'appli tient déjà. Restent ouverts : découper `styles.css` (cliquet des tailles regravé à PLAN-3, PHYTO-1
pour `tracteur.js`, RG-1), les couleurs écrites en ligne dans le corps de certaines fenêtres (Planning, Tracteur), et la vérification à l'écran
avec de vraies données (agenda de la Cave, millésime rempli, apports de fertilisation).

## 297. ★ COUL-1 — DES COULEURS PLUS FRANCHES, UN FOND UN PEU PLUS SOUTENU (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-coul1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/COUL-1.json` · **APP 8.68 → 8.69, SW 9.46 → 9.47**, base `b80419d`, **zip cumulatif DS-4 … COUL-1 non poussés**)

### 297a. La demande

Nico, après la refonte : les teintes « pas assez percutantes, ça fait triste » — un peu plus intenses, pas beaucoup ; et un peu plus de
contraste entre le fond crème et les encarts blancs, en restant subtil. Reformulé, confirmé (« Exact »), avec en plus : vérifier que tous les
onglets du Pilotage sont au thème.

### 297b. Ce qui change (jetons seulement)

- Clair : `--bg-app` `#F5F5F3` → `#F0EEE9` (et la copie du cockpit, `.ck2`, qui avait `#F2EFE7`) ; `--bg-doux` `#F7F5F1` ; fonds pâles
  `--accent-doux` .07 → .11, `--ok-doux` .10 → .15, `--attention-doux` .10 → .15, `--danger-doux` .09 → .13 ; teintes `--ok` `#237A47`,
  `--attention` `#A15C00`, `--danger` `#C2381B` (toutes ≥ 4,5 sur blanc) ; `--survol`, `--presse`, `--piste` un cran ; `--ligne-forte` `#CDCAC2`.
- Sombre (les deux blocs) : fonds pâles .15 / .17, teintes un peu plus vives, `--ligne-forte` `#3E3D39`, `--piste` .12.

### 297c. Ce qui a été essayé et rendu, mesures à l'appui

Une copie jetable du contrôle de contraste a écrit la liste complète des paires sous 4,5, avant / après : foncer `--gris-clair` (pour marquer
les filets) faisait tomber 36 paires « `--texte-doux` sur `--gris-clair` » à 4,27 (clair) / 4,15 (sombre) — `--gris-clair` sert aussi de FOND ;
éclaircir `--bg-card` en sombre faisait tomber 2 paires `--phyto-med` / `--phyto-pale` à 4,5. Les deux sont rendus. Donner à `--ligne` sa propre
valeur aurait cassé l'invariant de DS-4 (`mv-harnais-jetons` : « --ligne dérive de --gris-clair ») : rendu aussi. Le détachement des cartes vient
donc du fond, pas des filets.

### 297d. Mesuré

`mv-harnais-coul1` (neuf, branché) : 7 assertions (dont les rapports de contraste calculés des nouvelles teintes et du texte doux sur le nouveau
fond) et 5 contre-épreuves ; `mv-harnais-contraste` et `mv-harnais-jetons` verts sans regravage. Avant / après capturés en clair et en sombre
(Accueil, Planning aux cases teintées, Registre phyto).

### 297e. Revue des onglets du Pilotage (demandée avec le lot)

Les huit onglets passés en revue, en clair et en sombre : seul « Aujourd'hui » (cockpit, lots REF / AUJ / DS-4) est à la charte. « L'année »,
« La campagne », « L'équipe & le matériel », « Décider », « Économie », « Conformité » et « Archives » gardent l'ancien dessin (tuiles à titres en
capitales et pastilles dorées, segmentés noir et or, chiffres en Cormorant, jauges brunes), comme la barre « Exercice comptable » en tête du
module. À reprendre dans un lot dédié, habit seulement.

## 298. ★ PIL-1 — LES SEPT ONGLETS DU PILOTAGE HORS « AUJOURD'HUI » À LA CHARTE (08/10 — `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-pil1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `lots/PIL-1.json` · **APP 8.69 → 8.70, SW 9.47 → 9.48**, base `b80419d`, **zip cumulatif DS-4 … PIL-1 non poussés**)

### 298a. D'où ça vient

Revue demandée avec COUL-1 (§297e) : « L'année », « La campagne », « L'équipe & le matériel », « Décider », « Économie », « Conformité », « Archives » et
la barre de portée gardaient l'ancien dessin. Nico : « go ».

### 298b. Ce qui change (habit seulement)

Bloc CSS `★ PIL-1` … `★ FIN PIL-1`, par jetons, recalé par `#page-pilotage` (les règles anciennes vivent dans `styles.css` et l'injection de
`pilotage.js`) : portée — l'exercice comptable (`.pil-cr.root`, noir et or) en `--accent-doux`, les autres miettes au kit, « choses à
compléter » (`.pil-diagbtn`) en couleur d'état ; tuiles `pil-tile` (et `pil-photo` des cadres de l'année) au cadre neutre, l'ouverte à l'accent,
titres `pil-th-t` / `pil-t2h .t` / `pil-panel-t` sans capitales, pastilles d'icône neutres (plus d'or pâle), chiffres en Outfit (`pil-th-stat b`,
`pil-gauge-pct`, `pil-prot-big`, le jour de Décider), en-têtes de section `pil-sec-h` en Outfit ; segmentés `pil-seg` / `pil-anseg` au kit (le
choisi en carte au lieu du noir et or) ; badge d'exercice `pil-anbadge` en casse normale ; jauge d'avancement en `--ok` plein (fin du dégradé
brun → vert) ; Décider : puces à l'accent, carte du jour et chiffres au kit, verdicts en couleurs d'état ; archives : libellés sans capitales.
Aucune règle ne vise `.ck2` ni une classe `ck-` : le cockpit reste tel que REF / AUJ / DS-4 l'ont fait.

### 298c. Mesuré

`mv-harnais-pil1` (neuf, branché) : 8 assertions (dont « rien ne vise le cockpit ») et 6 contre-épreuves ; contraste et couches verts. Rendu de la
vraie appli : les sept onglets en clair, L'année et Décider en sombre. Trois passes : la première a laissé les tuiles du haut de L'année (elles
vivent dans `.pil-photos`, hors de `#pil-content`), la jauge, Décider, la protection et les archives — retrouvés par leur texte et recalés.

