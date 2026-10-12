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

## 299. ★ E2E-1 — LE TEST DE BOUT EN BOUT SUIT LE BOUTON « DÉMARRER UNE SESSION » (09/10 — `scripts/e2e-local.mjs` · `lots/E2E-1.json` · aucune version ne bouge ; base `34813db` — Nico a poussé la refonte DS-4 … PIL-1 en `646323e` « Refonte v870 » — **zip de six fichiers**)

### 299a. Ce qui s'est passé

La CI de Nico a joué `npm run test:e2e` sur le zip PIL-1 : 18 étapes vertes, une rouge — « Action session » : `page.click('#trac-fab')`
attendait 8 s un bouton visible. Depuis TRAC-3 (§284), la FAB du Tracteur est cachée au large (`#trac-fab{ display:none!important }` à partir
de 1 024 px) et remplacée par `#trac-new-btn` ; le test tourne en 1 280 × 720. La chaîne (`npm run check`, 339 commandes) ne joue pas ce test :
le défaut n'a été vu que par la CI.

### 299b. Ce qui change

`e2e-local.mjs`, étape « Créer une session » : le test clique le geste VISIBLE — `#trac-new-btn` s'il est affiché (au large : il ouvre
directement la nouvelle session), sinon la FAB (à l'étroit : elle ouvre le choix session / entretien) — et vérifie toujours qu'une fenêtre
s'ouvre. Le message d'échec nomme le bouton cliqué.

### 299c. Mesuré

Joué ici (navigateur de test de version voisine) : « Action session » ✓. Deux autres lignes rougissent ici seulement — « Page home »
(`_pluieCharger`) et « Action parcelle » (« Météo secteur injoignable ») — parce que ce bac à sable n'a pas accès au service météo ; elles sont
vertes dans la CI de Nico, qui a internet. Leçon remontée dans la consolidation : jouer `npm run test:e2e` avant de livrer un lot qui cache ou
remplace un bouton.

## 300. ★★ CADRE-1 — CASES ET FENÊTRES DANS LEUR CADRE, BARRE SOUS LES FENÊTRES, « LES GENS » SANS GEL (09/10 — `src/styles.css` · `src/planning.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cadre1.mjs` (neuf) · `scripts/mv-harnais-plan2.mjs` · `scripts/mv-harnais-plan3.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/CADRE-1.json` · **APP 8.70 → 8.71, SW 9.48 → 9.49**, base `9e9f030`)

### 300a. D'où ça vient

Nico, 09/10, quatre retours avec captures après « Refonte v870 » : la barre noire du Planning par-dessus la fenêtre de la journée ; les cases
colorées qui débordent de leur cadre ; « Les gens » qui fige tout sauf la fiche, et un gel « ailleurs, je ne sais plus où » ; des fenêtres « pas
cadrées », barres horizontale et verticale. Reformulés un par un, validés (« ok », « oui »).

### 300b. Mesuré AVANT de corriger (vraie appli, Chromium du bac à sable, 1920 × 1000)

- **Recette du rendu** (hors dépôt, `/home/claude/chr`) : `@sparticuz/chromium` SANS `--single-process` (contextes perdus) ni `--hide-scrollbars` ;
  service worker bloqué (il recharge la page à son installation) ; jeton simulé avec `terms:{c,d}` (sinon la porte CGU recouvre tout) ; données
  injectées par `applyFbData` (7 salariés, octobre 2026). ⚠️ `elementFromPoint` saute les éléments `inert` : retirer `inert` le temps de la mesure.
- **Cases** : puce `height:100%` de 62 px + 10 px de marge = 72 px dans une case de 67 (3 px au-dessus, 2 au-dessous). `box-sizing` calculé :
  **content-box** sur la case comme sur la puce, contre le socle de l'appli (`*{box-sizing:border-box}`). Cause : `*,*::before,*::after{box-sizing:inherit}`,
  socle de la maquette du cockpit recopié le 07/10 (`1aeb055`) — `<html>` ne pose rien, tout hérite de content-box. Inoffensif DANS `.ck2`, qui pose border-box.
- **Fenêtres** : un robot ouvre tout bouton qui ouvre une fenêtre (37 vues, 60 boutons, 38 fenêtres). **27 plus larges que leur cadre**, de 4 à
  34 px ; coupables : champs `.fi`, listes `.fsel`, zones de texte, boutons `.mbtn` à `width:100%` + marge.
- **Barre** : z-index 560 contre 500 pour une fenêtre ouverte sans `openOv` (`_planSheetOpen`). Invisible d'ordinaire : l'animation d'entrée de
  `.page` (opacité, `forwards`) fait de la page un contexte d'empilement qui tient la barre dessous. Reproduite à l'identique de la capture avec
  `prefers-reduced-motion: reduce` (réglage Windows « Effets d'animation » coupé).
- **Gel** : 130 éléments `inert`, défilement verrouillé, un vrai clic sur une autre ligne sans effet, molette sans effet. Après `goTo('parcelles')` :
  `#page-planning` toujours `display:grid` (règle sans `.active`, §24 CSS n°1) et Parcelles inerte — c'est « l'autre endroit ».

### 300c. Ce qui change, et les arbitrages

- `styles.css` : socle du cockpit borné (`.ck2 *,.ck2 *::before,.ck2 *::after{box-sizing:inherit}`) ; `.pl2-mbar` à 450 ; `body.pl-gens-dock
  #page-planning.active{display:grid…}` ; bloc PLAN-3 : 17 sélecteurs `:is(.overlay,.pl2-rangee)` (même spécificité) ; bloc `★ CADRE-1` :
  `#ovPlanFiche.pl2-rangee:not(.open){display:none!important}`.
- `planning.js` : `_plFicheFenetre(ov, fen)` — rangée, la fiche quitte `.overlay` pour `.pl2-rangee` ; rendue, `.overlay` revient ; `_mvOvSync`
  rappelé, car une classe qui QUITTE `.overlay` n'est plus vue par l'observateur des fenêtres.
- **Retirer la classe plutôt que filtrer les lectures** : une dizaine d'endroits demandent « une fenêtre est-elle ouverte ? » (`.overlay.open` :
  verrou A11Y-2, Échap, retour, mise à jour, `_mvRechargeSure` de firebase.js). Un « rangé » oublié dans une lecture future regèlerait l'appli en
  silence ; une règle de dessin oubliée, elle, se voit à l'écran.
- **Le reste du socle du cockpit n'est PAS défait** (police et interligne de `body`, `button{font:inherit}`, `:focus-visible`, `[hidden]`) : la
  refonte a été dessinée et validée par-dessus. Le défaire demanderait des captures avant / après, écran par écran.

### 300d. Mesuré APRÈS

- Cases : 49 puces, débordement maximal 0 px. Barre : 450 < 500, la fenêtre dessus, animations réduites comprises. « Les gens » : 0 inerte, pas
  de verrou, le clic change la fiche, la molette défile, Échap ne ferme pas la fiche rangée ; après `goTo('parcelles')` : Planning caché, 0 inerte ;
  au retour, deux colonnes ; au téléphone (390 px), la fiche redevient une vraie fenêtre (modale, 127 inertes).
- Robot : **0 fenêtre sur 38** plus large que son cadre (27 avant). Pages : Parcelles 2 → 0 et Réglages 4 → 0 débordements ; Pilotage 4 → 4
  (boutons `.ck-ch` du cockpit, hors du lot). Captures regardées : la semaine du Planning, la journée avec la barre, « Les gens », Réglages.
- `mv-harnais-cadre1` (neuf, branché) : 10 assertions — dont la vraie `_plGensDock` sur un faux DOM et la règle générale « aucune page affichée
  hors de `.active` » — et 8 contre-épreuves. `mv-harnais-plan2` extrait `_plFicheFenetre` et lit `.active` ; `mv-harnais-plan3` suit les sélecteurs.
- `TZ=Europe/Paris npm run check` : **341 commandes, 0 rouge** (1 024 s). Sur la base, `mv-harnais-entree1` avait rougi UNE fois sous la charge
  (navigateur et serveur lancés à côté), vert seul et vert ici : un contrôle sensible au temps, pas un défaut du code.
- **Pas vu** : les barres de Windows (navigateur de test à barres invisibles : le débordement est mesuré, pas regardé). Le « hors écran » du robot
  (35 fenêtres, avant comme après) vient d'une mesure prise pendant l'animation d'entrée des fenêtres : non concluant, ni dans un sens ni dans l'autre.

## 301. ★★ FORME-1 — LE DOMAINE EN DIRECT AUX FORMES RÉELLES, COMPACT, AVEC LOUPE ; LA FORME EN HAUT DES FICHES ; L'ÉQUIPE DE CHAQUE PARCELLE EN COURS ; LE TOUCHER QUI OUVRE ENFIN LA FICHE (09/10)

Lot 32, base `53a0530`. APP 8.71 → 8.72, SW 9.49 → 9.50.

### 301a. La demande, et comment elle s'est précisée
Nico (09/10) : « améliorer le rendu des petites images des parcelles, ce n'est pas assez qualitatif » ; « on est censé voir la forme de la parcelle, et j'ai un
[object Object] » ; « un outil professionnel, pas un outil de démonstration pas fini ». Maquette v1 (vraies formes, même échelle, zones en cadres) → jugée trop
grande ; sa piste : des miniatures, un zoom au survol, et « comment faire au téléphone ? ». Mesure avant de proposer : réduire l'échelle seule ne faisait
descendre le plan que de 801 à 530 px (la place était prise par les cadres, les titres et les lignes de commune). Maquette v2 (une ligne de titre par appellation,
ni cadre ni ligne de commune ; loupe au survol ; toucher → fiche avec la forme ; repli au téléphone) → « ok », puis « go ».

### 301b. Ce qui a été fait
- **`utils.js` — la forme, une seule lecture** (`_mvFormeDe`, `_mvParcContours`, `_mvParcForme`, `_mvFormeSvg`, `_mvParcFormeHtml`) : le contour `kml_polygons`
  ([lat, lng]) passé en mètres, nord en haut, ramené à l'origine ; aire, sens des rangs (longueur du plus petit rectangle — un repère, dit dans l'aide), point le
  plus loin des bords (l'équipe et l'onde s'y posent : une parcelle en équerre a son centre dehors). Gardée en mémoire par contour.
- **`cockpit-vue.js` — le plan** : `preparerParcs` (une fois par chargement), `disposer(W)` à la largeur réelle (1 unité = 1 px) ; appellations en colonnes de
  même largeur, chacune dans la moins haute, la plus grande sur toute la largeur au-delà du tiers des vignes ; une ligne de titre (deux si le nom ne tient pas
  dans sa colonne, nom coupé d'un « … » en dernier recours) ; UNE échelle pour tout le domaine (part fixe de l'écran : 0,07 au large, 0,10 sous 600 px, 0,14 sur
  une colonne sous 420 px) ; carré de surface en pointillé sans contour, et la note qui les nomme ; échelle en mètres et nord sous le plan ; repli au
  téléphone (« Tout le plan ») ; redessin à chaque largeur (`ranger` → `dessinerPlan`) ; gestes délégués à `#ck-carte` (ils survivent au redessin).
  Mesures (domaine reconstitué, 37 parcelles) : 393 px de haut dans la colonne de 453 px d'un écran de 1 280 (801 avec les bandes de REF-1), 601 px au
  téléphone, replié à environ 370.
- **La loupe** (survol, pointeur fin) : la forme en grand avec son échelle, le nom, la surface, l'appellation, la commune, le cépage, l'état et l'équipe. Au doigt,
  pas de loupe : le toucher ouvre la fiche.
- **Les fiches** : `openDP` remplit `#dp-forme` (en haut de la fiche, cachée sans contour) ; `_pFicheHtml` (fiche de droite des Parcelles, ordinateur) montre la
  forme sous le nom. Motifs à préfixe propre (`dpf`, `pfxf`, `cklp`) : deux fiches peuvent coexister.

### 301c. Les trois défauts trouvés en vérifiant
1. **« [object Object] »** — `PARCELLES[].commune` est `{nom, lat, lng}` depuis la météo par secteur ; `_pilCk2Modele` la passait telle quelle, `disposer`
   en faisait la clé de bloc (toutes les communes fondues en une) et l'étiquette ; `_pFicheHtml` en faisait une étiquette. Le modèle passe le NOM ; le plan lit
   les deux formes (`nomCommune`).
2. **La pastille et « en cours » lisaient deux journaux** — l'état : tout le journal depuis l'ouverture de la fenêtre ; l'équipe : le journal du jour (le fil).
   Lecture unique `_ckPlanLire` (cockpit.js) → `_ckPlanEtats` (même sortie qu'avant) et `_ckPlanDebuts` (la ligne « En cours » de chaque parcelle en cours) ;
   `_pilCk2Modele` en tire les équipes, avec le jour du début ; le cadre compte pareil ; une pastille commencée un autre jour passe en clair, la loupe dit
   « commencée jeudi ». Filet dans `charger` : une parcelle en cours sans équipe en reçoit une, « Personne d'indiqué ». Le fil « En direct » reste du jour.
   Le plan de secours (cockpit.js) suit la même règle (`_ckPlanInitiales` remplace `_ckPlanEquipes`).
3. **Le toucher n'ouvrait rien** — `openSelParc(nom)` attend une TÂCHE à sélection (arrachage, désherbage, effeuillage) : appelée avec un nom de parcelle par le
   plan (`ouvrirFeuille`), le plan de secours (`_ckPlanOuvrir`) et Ctrl K (`coquille.js`), elle rendait la main sans rien ouvrir (« Admin requis » hors admin).
   Les trois appellent `openDP`. AUJ-3 et REF-1 avaient écrit « toucher une parcelle ouvre sa fiche (`openSelParc`) » : la doc et les harnais fixaient l'erreur.

### 301d. Les harnais
- **`mv-harnais-forme1.mjs`** (neuf, 25 assertions, 9 contre-épreuves) : moteur des formes exécuté (rectangle de 100 × 20 m, équerre, casse), lecture du journal
  exécutée (début gardé après validation = rouge), `_pilCk2Modele` exécuté (équipe commencée HIER présente, commune en toutes lettres, contour transmis), mise en
  page exécutée (même échelle, rapport 5 pour 1 gardé, aucun recouvrement, une colonne au téléphone), gestes et feuille lus.
- **`mv-harnais-ref1.mjs`** : l'assertion « toucher une parcelle ouvre SA fiche » vise `openDP` ; ses contre-épreuves « équipe qui reste après sa validation »
  (ancrée sur `_ckPlanDebuts`) et « nom de démonstration revenu » (le village mort `const maisons` est parti avec l'ancien dessin) ont changé d'ancre.
- **`mv-harnais-auj3.mjs`** : `openDP` à la place d'`openSelParc` ; l'assertion des équipes lit `_ckPlanDebuts` (chaque parcelle en cours, et seulement elles) ;
  sa contre-épreuve « équipe qui reste après sa validation » rougit grâce à un cas ajouté (commencée puis validée).
- Rendu réel regardé (vrai `cockpit-vue.js`, vraie feuille, police Outfit) : ordinateur clair, sombre en animations réduites (37/37 parcelles visibles), 860 px,
  téléphone tactile 390 px (replié, toucher → `openDP`, aucune loupe), zéro erreur JS.

### 301e. ⚠️ Un nom déjà pris
La première version appelait la lecture des contours `_mvParcGeo` : ce nom existait déjà dans `utils.js` — la POSITION d'une parcelle, lue par la
carte, Phyto, les Réglages et la tournée (`_opGeo`). Le second `window._mvParcGeo =` écrasait le premier sans un mot. Deux harnais l'ont vu (rapport du
vignoble : « ni position » ; robustesse du Pilotage : `NaN` dans Décider), pas la relecture. Renommée `_mvParcContours`. **Avant d'exposer un
`window._mvX`, chercher le nom dans tout `src/`.**

### 301f. Ce qui reste ouvert
Voir §28 (FORME-1). Non fait : la forme dans les lignes de la liste Parcelles (piste de la maquette v3 de PARC-1, §274d) ; la carte de l'Accueil.

## 302. ★★ GF-1 — LES SUCRES AU LABO PRENNENT LE RELAIS DE LA DENSITÉ (09/10 — `src/cuvier.js` · `src/cave.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-gf.mjs` (neuf) · `scripts/mv-harnais-agenda.mjs` · `scripts/mv-harnais-cuv13.mjs` · `scripts/mv-harnais-cuv8.mjs` · `scripts/mv-harnais-robustesse-cave.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/GF-1.json` · **APP 8.72 → 8.73, SW 9.50 → 9.51**, base `974a495`)

### 302a. La demande
Nico, 09/10 (dicté) : des vins encore en cuve parce que le glucose n'a pas fini de descendre « au 0,2 pour considérer sec » ; « ce n'est plus
vraiment des densités qu'on prend, c'est une mesure qu'on envoie au labo — glucose et fructose, en g/L » ; il veut la noter, en voir la courbe et une
tendance « du côté sec ou pas ». Puis : « 2 g/L est un ancien seuil, le vrai seuil est de 0,2 — ce sont les seuils laboratoires. » Maquette
`maquette-sucres-labo-v1.html` publiée (artefact claude.ai : une page sur `styles.css`, écrans rendus par l'appli chargée dans Node, règle §225b),
puis « go » sur les huit recommandations.

### 302b. Le modèle
- **La mesure vit sur le relevé** : `mesures_fa[].gf` (g/L), à la date du PRÉLÈVEMENT — même axe, même porte de correction, même tri que la densité.
  Un relevé peut ne porter que `gf` (CUV-7 filtrait déjà `densite != null` partout où l'on calcule une densité). Densité OU labo : l'un suffit
  (`saveVendMesure`). `_vendGfNum` lit la virgule : « 0,8 » d'une sauvegarde retouchée donnait `parseFloat` = 0, une cuve sèche à tort.
- **Le verdict** `_vendProjGF` (`attente | une | descend | projete | stagne | remonte | seche`) : la mécanique de `_mlProjMalo` — pente des deux
  dernières analyses pour DÉTECTER, des trois dernières pour PROJETER — mais **en proportion** : la fin d'une FA ralentit. Date dès 3 analyses (garde
  de la FA et de la malo), demi-vie (« les sucres baissent de moitié en N jours »), marge 30 %. Seuil `_VEND_GF_SEC` = 0,2 **inclus**. Une hausse de
  plus de 0,1 g/L (`_VEND_GF_BRUIT`) « remonte » et pose la question (pressurage, assemblage, échantillon) — **jamais « bloquée »** : à l'inverse du
  malique, le sucre revient avec la presse (CUV-13).
- **Le rythme** `_vendGfAMesurer`, UNE règle pour la liste (`_vendADue`) et l'agenda (`_mlAMesurer`) : suivie au labo, une cuve réclame une analyse
  au-delà de 4 jours (`_VEND_GF_CAD`), rien quand elle est sèche ; sinon la règle d'une densité par jour.
- **Les écrans** : la ligne de liste porte le chiffre labo EN TÊTE de sa sous-ligne (qui se coupe par la fin au téléphone) et l'état « Labo · baisse /
  stagne / remonte » ou « Sèche au labo » ; la fiche porte `_vendGfBloc` sous la courbe de densité, courbe peinte par `_vendPeindreGraphes`
  (`#mvg-gf-`, largeur vraie du conteneur), échelle logarithmique (autant de place à 4 → 2 qu'à 0,4 → 0,2), seuil en tireté, projection en pointillé
  doré ; « Ce qui vient » (`window._vendGfAgenda`) : `labo` (sèche, à déclarer), `alerte` (stagne, remonte), `fa` (fin estimée), `decuvage` (pressurée
  sèche) — et la densité n'y projette plus une cuve suivie au labo ; le cahier de cuverie prend la colonne « Labo g/L » (« Sucre g/L » devient
  « Sucre est. ») et la courbe des sucres.
- **Le seuil du vin sec** `_VEND_SEC_G` : 2 → 0,2 g/L. Le repère descend d'environ 0,8 point (13° : 993,8 → 993,0). Un seul « sec » dans l'appli.
- **« Déclarer la FA finie »** (`openVendFaFin` / `saveVendFaFin`) : date proposée = celle de l'analyse qui dit sec, sinon aujourd'hui ; écrit
  `fa_finie:true`, `fa_fin_date`, `fa_fin_gf` ; refusée avant le décuvage. Une seule porte par écran : dans le bloc du labo, ou dans la rangée des gestes
  sans analyse. L'entrée `labo` de l'agenda ouvre la feuille.

### 302c. Trouvé en route
1. ★★★ **Une cuve décuvée « elle finira au chai » ne pouvait JAMAIS être déclarée finie** : seule la feuille de décuvage écrit `fa_finie`. La cuve
   restait dans la tournée, « à mesurer » chaque jour, et sa cuvée gardait « attendez avant la malo ou le sulfitage ». Sans le geste, l'écran aurait
   dit « sèche au labo » pendant que la cuvée disait « attendez ».
2. ★★ **La ligne « Fermentation à finir » / « Mise en fût » du Chai se coupait en colonnes** — `.mvc-fa-line` en `display:flex`, chaque `<b>` un
   item (§24). Vu au rendu de la maquette, sur le code d'origine. Le texte passe dans UN `span.mvc-fl-t`.
3. ★★ **Corriger un relevé de la tournée effaçait `qui` et `tour`** : `saveVendMesure` reconstruisait l'objet de zéro (§24 n°12) → `Object.assign`.
4. ★ **Un relevé sur une cuve pressurée enregistrait 2 remontages et 1 pigeage par défaut** : après le pressurage (ou le décuvage), `#vm-chap` est
   masqué et les compteurs partent de 0.
5. ★★★ **Le tirage au hasard de la Cave n'avait jamais posé un relevé de fermentation** : sa fabrique écrivait `mesures:`, l'appli lit
   `mesures_fa`. Corrigé, relevés labo compris (nombre, vide, nul, « 0,8 ») : normal, `--long` (100 domaines) et contre-épreuve verts.
6. **Deux harnais se montent un bac à sable par liste de fonctions** (agenda, CUV-13) : les VRAIES fonctions du labo y entrent (l'extracteur de
   l'agenda apprend la forme `window.X = function(`). CUV-8 recale ses chiffres sur 0,2 g/L (994,1 à 12°, 991,9 à 14°), et sa démonstration
   « l'erreur joue dans l'autre sens » passe de 11° à 10° : à 0,2 g/L, 995,5 n'est plus sec à 11° (0,9 g/L restants).
7. `scripts/mv-harnais-cuvier-correction.mjs` ne démarre plus depuis CUV-DEC (§164) et n'est dans aucune chaîne : silencieux. Noté au §28.

### 302d. Mesuré
`mv-harnais-gf` : **41 vertes** ; contre-épreuve **14/14**, chaque défaut attrapé par SA règle (seuil inclus, 2 g/L, chiffre en tête, rythme de la
liste et de l'agenda, virgule à l'enregistrement et à la lecture, chiffre non écrit, relevé reconstruit, déclaration, densité qui projette, span du
Chai, chapeau, colonne du cahier). Preflight **0 erreur**, les 8 avertissements de la base (un numéro de ligne décalé). Chaîne complète
(`mv-lanceur`, 345 commandes) par tranches, `TZ=Europe/Paris` : **verte**. La maquette a été regardée sous Chromium (téléphone clair et sombre,
ordinateur) ; **l'appli construite, non** : `npm run build`, `test:smoke`, `test:e2e` restent à jouer chez Nico.

### 302e. Ouvert
Voir §28 (GF-1).

## 303. ★ GF-2 — LE « ≈ » QUE LES POLICES NE SAVENT PAS DESSINER (09/10 — `src/cuvier.js` · `scripts/subset-baseline.json` (regravée à la baisse) · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/GF-2.json` · **aucun bump** : module JS seul, base `9caff41`)

### 303a. Le rouge
La CI de Nico sur `9caff41` (GF-1 poussé) : `mv-harnais-subset` en code 1 — « Aucun fichier ne remonte (hors subset) : src/cuvier.js 10→11 ».
La courbe des sucres étiquetait la date estimée « ≈ 13/10 » ; U+2248 n'est pas dans le subset de Cormorant Garamond et d'Outfit (`/fonts/fonts.css`) :
le signe serait sorti dans une police de repli, au milieu du graphe. Remplacé par « vers le 13/10 » — le mot de la phrase sous la courbe — et le seuil
de bascule de l'ancre (`end` près du bord droit) porté de 34 à 44 px pour la longueur du libellé. Le total hors subset passe de 272 à 271 : la baseline
est regravée APRÈS vérification clé par clé — deux baisses (`pilotage.js` 28 → 27, déjà acquise avant ce lot ; le total), aucune hausse.

### 303b. Pourquoi GF-1 a été livré « vert »
Le rouge était dans mes journaux (`[60/345] node scripts/mv-harnais-subset.mjs` … `1 ROUGE(S) sur 8`). La chaîne avait été jouée par tranches de
295 s, aucune n'allait jusqu'au résumé du lanceur, et le relevé des rouges passait par un script maison terminé par `sort -u | head -20` : la ligne
« 60 … » triait après « 144 … » et tombait hors des vingt. ★★ **Règle (au §6b) : la chaîne se joue jusqu'au bout et SON résumé fait foi.** Un relevé
maison des rouges est un compteur maison — exactement ce que §25 n°12 interdit déjà pour le preflight.

### 303c. Mesuré
`mv-harnais-subset` vert après regravure (271 ≤ 271), contre-épreuve verte ; `mv-harnais-gf` 41 vertes. Chaîne complète jouée d'une traite
(`TZ=Europe/Paris`), résumé du lanceur : **345 commandes, 0 rouge (codes retour relevés un à un)**.

## 304. ★ GF-3 — DEUX LIGNES D'AIDE QUI CHEVAUCHAIENT LEUR CHAMP (09/10 — `index.html` · `public/sw.js` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `scripts/harnais-claude-md.mjs` · `lots/GF-3.json` (inclut GF-2, non poussé) · **SW 9.51 → 9.52**, APP inchangé, base `9caff41`)

### 304a. Le défaut, mesuré avant d'être corrigé
Capture de Nico (09/10, 21 h 35) : sous « Sucres au labo (g/L) », la première ligne de l'aide passait sous le champ. Reproduit sous Chromium sur le
VRAI formulaire — le bloc `#ovVendMesure` d'`index.html`, `src/styles.css`, les polices de `@fontsource` — en mesurant les boîtes : l'aide
commençait **6 px dans le champ** (`top` de l'aide − `bottom` du champ = −6). Cause : `margin-top:-6px`, recopié de la ligne d'aide de la densité.
Celle-ci chevauchait déjà son champ de 6 px : la règle `.fi` n'a aucune marge basse (`getComputedStyle` : 0 px), le −6 px suppose une marge qui
n'existe pas. Une seule ligne, elle se voyait moins ; la nôtre, sur deux lignes, s'est vue. Les deux seules occurrences d'`index.html` passent à
`margin-top:6px` : écart mesuré **6 px** sous la densité et sous les sucres (14 px sous la température, inchangé).

### 304b. Pourquoi la maquette ne l'a pas montré
La maquette de GF-1 portait sa propre ligne d'aide, écrite à la main avec `margin-top:6px` ; l'intégration a recopié la ligne voisine
d'`index.html`. Ce que la maquette prouvait (la feuille de style, les fonctions) ne couvrait pas cette ligne-là. ★ **Après tout lot qui touche un
écran, rendre l'écran INTÉGRÉ et le regarder** — pas la maquette : la mise en page est la seule chose qu'aucun harnais ne lit (§24).

### 304c. Mesuré
Chaîne complète rejouée commande par commande (`TZ=Europe/Paris`), codes retour relevés un à un : **345 commandes, 0 rouge — la contre-épreuve lente de mv-harnais-recup rejouée seule (212 s, 90 défauts détectés)**. Rendu de la feuille regardé.

## 305. ★★ BUILD-1 — LE BUILD NE JOUE PLUS LES CONTRÔLES UN PAR UN (09/10 — `scripts/mv-lanceur.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-lanceur.mjs` (neuf) · `scripts/mv-harnais-auth1.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/BUILD-1.json`)

Demande de Nico : « il n'y a pas moyen que le déploiement soit plus rapide […] c'est vraiment long ». Objectif reformulé puis confirmé : raccourcir l'attente
entre `npm run build && firebase deploy` et la mise en ligne, **sans retirer un seul contrôle** ni toucher au brouillage du code en ligne. Mesure d'abord,
pistes chiffrées ensuite ; Nico a retenu : couper les attentes, jouer en parallèle, `--only hosting` (« Continuer »).

### 305a. La mesure, avant tout plan
Chaque commande de la liste chronométrée une par une, dans l'ordre du lanceur (bac à sable : 1 cœur Xeon 2,1 GHz) : **345 commandes = 612 s**. Médiane
0,08 s ; les 295 commandes sous 0,5 s pèsent 32 s à elles toutes ; **10 commandes font 82 % du temps** : `recup --contre` 134-137 s, `icones-contre`
62-65 s, `preflight` 62 s, `auth1` 60 s, `entree1 --contre` 51 s, `robustesse-planning` 22 + 44 s, `robustesse-pilotage` 7 + 33 s, `taille2 --contre`
18 s. **Les contre-épreuves pèsent 411 s (67 %).** Temps réel contre temps de calcul (`time`) : `auth1` = 60,1 s pour 0,05 s de calcul,
`entree1 --contre` = 50,6 s pour 4,9 s ; tous les autres gros contrôles calculent vraiment.

### 305b. Les deux attentes
- **`auth1`** : son travail finit en 0,04 s, puis Node attend. `firebase.js` arme `setTimeout(… delete _mvDeniedRetried[key] …, 60000)` dans le bac à
  sable, avec le VRAI `setTimeout`. → `process.exit(0)` après la ligne verte (la branche rouge sortait déjà). −60 s ; rien de ce qui est testé ne change.
- **`entree1`** : l'attente est VOULUE. `attendre(350)` par scénario, parce que l'empreinte du mot de passe (PBKDF2-SHA-256, 310 000 tours) se calcule
  hors du fil JS : il faut du vrai temps. PBKDF2 mesuré à 48 ms ici, marge ×7. Pas touché : en parallèle, ses ~50 s d'attente n'occupent aucun cœur.
  ⚠️ C'est l'attente que j'avais annoncée à Nico comme « même symptôme qu'auth1, cause à confirmer » : confirmée, et ce n'était PAS la même cause.

### 305c. Le lanceur en parallèle — les arbitrages
- **`jobs` = les cœurs** (`os.availableParallelism()`), `MV_JOBS=N` pour forcer. Un seul cœur, `MV_JOBS=1` ou `--un-par-un` = l'ancien code, tel quel.
- **Sorties dans l'ordre de la liste** : chaque commande est capturée, puis écrite dès que toutes celles d'avant le sont. Le journal de la CI se lit comme
  avant ; la ligne d'en-tête de chaque commande porte sa durée, et le résumé final les 5 plus longues.
- **Les SEULES en tête, pas à leur place** : à leur place, il faudrait d'abord attendre la fin de la plus longue commande en cours (jusqu'à 134 s).
  L'ordre d'exécution ne compte pas : aucune commande de la liste ne lit ce qu'une autre écrit (inventaire des écritures fait script par script).
- **On ne tue jamais** : au premier rouge, plus rien ne démarre et ce qui tourne va au bout — `mv-harnais-cuvgr3` réécrit `src/cave*.js` ou
  `src/utils.js` et ne les rend que dans son `finally`.
- **Reprendre** : `--depuis` pointe la première commande rouge OU pas jouée, dans l'ordre de la liste (une SEULE rouge arrête tout avant la première
  commande ordinaire : pointer le rouge ferait sauter celles d'avant).
- ★ **Les plus longues d'abord** : le lanceur retient la durée de chaque commande (`node_modules/.cache/mv-lanceur-durees.json`, propre au poste,
  jamais commité) et lance d'abord les plus longues au passage suivant (inconnue = en tête). Calcul à 4 cœurs : 174 s dans l'ordre de la liste, 140 s
  ainsi — `recup --contre` est la 169ᵉ. Sans ce fichier (CI, premier build) : l'ordre de la liste.
- ⚠️ **Le parallèle charge le processeur** : un harnais qui attend du VRAI temps (`entree1`, 350 ms pour un calcul de 48 ms) garde sa marge tant que
  `jobs` ne dépasse pas les cœurs. `MV_JOBS` au-dessus des cœurs = à ses risques.

### 305d. Ce que le repérage a trouvé
`mv-harnais-lanceur` lit les appels d'écriture de chaque script de la liste et remonte la variable du chemin sur trois niveaux. À sa première exécution, il
a rougi sur trois scripts : **`vignoble` et `entretien` écrivent vraiment `src/.mv-ko-vgn-N.js` / `src/.mv-ko-ent-N.js`** (comme `releve` et `fuseau`) —
ma relecture à la main les avait classés « temporaires » parce que leur variable s'appelait `tmp` → SEULS. `icones-contre` était une fausse alerte : il
copie DEPUIS le dépôt vers son `mkdtemp` → le repérage lit désormais la destination d'une copie (2ᵉ argument), et les deux côtés d'un renommage.
Bilan : **9 scripts SEULS (13 commandes), 12 ECRIT_HORS_LISTE** (écrivent seulement sous `--baseline`, `--engraver`, ou sans `--check` / `--test`).
★ **Une relecture à la main d'un inventaire de 205 scripts n'est pas un inventaire** : le contrôle a trouvé en une seconde ce que j'avais raté.

### 305e. Le déploiement
Vérifié dans le code de `firebase-tools` (`src/deploy/functions/release/planner.ts`, `prepare.ts`) : une fonction est sautée quand son empreinte
(source empaquetée du dossier + variables d'environnement + secrets) égale celle en ligne et qu'elle n'est pas visée par `--only`. L'empaquetage couvre
TOUT `functions/` : un seul fichier touché → les 37 repartent. Un `firebase deploy` complet charge aussi le code des fonctions pour les analyser, liste
celles en ligne, et republie `firestore.rules` et `storage.rules`. Durée non mesurable d'ici (pas d'accès au compte de Nico).

### 305f. La compilation Vite — mesurée
Bac à sable (1 cœur), même entrée, sortie à part : `mv-gt-page` 0,1 s · **`vite build` 41,4 s** · `inject-precache` et `mv-version-json` 0,0 s.
Sans compression, l'assemblage seul prend 11,0 s : **Terser (2 passes) coûte ~30 s**.

| Variante | Durée | `.js` brut | gzip | noms internes lisibles |
|---|---|---|---|---|
| Terser 2 passes (en place) | 41,4 s | 4 203 099 o | 1 234 504 o | 1 422 |
| Terser 1 passe | 33,2 s | 4 207 931 o (+0,1 %) | 1 239 359 o (+0,4 %) | 1 422 |
| esbuild | 10,9 s | 4 397 755 o (+4,6 %) | 1 275 714 o (+3,3 %, +41 Ko) | 1 422 |
| sans compression | 11,0 s | 6 141 002 o | 1 537 033 o | 4 595 |

Les 1 422 noms qui restent lisibles sont ceux posés sur `window` : aucune compression ne les touche, le brouillage des noms est le même dans les trois
cas. **Rien d'appliqué : décision de Nico.** ⚠️ esbuild n'a pas l'option `reserved` de Terser (`firebase`, `db`, `auth`) : à valider au smoke et à
l'e2e avant de l'adopter.

### 305g. Mesuré
- Chronométrage commande par commande (305a) : 345 commandes, 612 s, un seul rouge, réel à ce moment-là (`mv-harnais-subset`, réglé depuis par GF-3).
- `mv-harnais-lanceur` : 17 vertes ; contre-épreuve 11/11 défauts détectés. `mv-harnais-portes` vert. `auth1` : 27 vertes en 0,05 s.
- Chaîne complète en parallèle, 4 à la fois sur 1 cœur (`TZ=Europe/Paris`, `--continuer`) : **347/347, 0 rouge, 594 s**. Sur un cœur, le parallèle ne
  peut rien gagner : ce passage prouve la justesse, pas la vitesse — et `entree1` est resté vert avec 4 processus sur le même cœur.
- Projection (durées mesurées, partage parfait supposé) : contrôles 552 s une par une → **140 s à 4 cœurs**, plancher `recup --contre` ; + Vite 41 s.
- Chaîne rejouée sur l'état final du zip (marque posée, `.mv-base` armé) : **347/347, 0 rouge, 580 s** (4 à la fois sur 1 cœur).
- ⚠️ **Pas vérifié** : la vitesse sur le PC de Nico (Windows, nombre de cœurs inconnu). La dernière ligne du lanceur la donne, avec les 5 plus longues.

## 306. ★★ ARRACH-8 — LA PARCELLE ARRACHÉE AVANT L'APPLI, DÉCLARÉE APRÈS COUP ; UNE ANNULATION COMMUNE (10/10 — `src/app.js` · `src/utils.js` (définitions communes, APP, WHATS_NEW, aide) · `src/pilotage.js` · `src/styles.css` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach8.mjs` (neuf) · `scripts/mv-harnais-arrach6.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `lots/ARRACH-8.json` · **APP 8.73 → 8.74, SW 9.52 → 9.53**, base `cbfcb8e`)

### 306a. La demande, et ce que le code disait

Capture de Nico (09/10, vue ordinateur) : une parcelle arrachée en janvier 2026, avant que l'appli tourne, donc « Arrachée » dès l'installation, ses tâches
désactivées. Des passages y avaient été saisis ensuite. Pour la redéclarer à sa vraie date avec le module d'arrachage, il l'a remise en exploitation. La fiche de
droite disait alors « À faire » pour les sept tâches, « 0/1 tâche » juste au-dessus, et « Dernier passage » de l'arrachage au 25 sept. malgré deux « Annulé »
du 9 oct. — pendant que la fiche complète disait les tâches désactivées. Objectif reformulé, confirmé (« oui »). Cinq défauts, tous lus dans le code :
1. **`_pFicheHtml`** (PARC-1, §274) remplissait « Travaux de la campagne » avec `getTachesSaison()` brut : ni `_mvExclu` (tâche désactivée, SEL-1) ni `_mvArrHors`
   (AVC-ARR) — que respectent `getPCls` (le « 0/1 ») et `openDP`. Deux lectures sur le même écran.
2. **`_pDernier`** prenait la dernière validation de TOUT le journal : ni les annulations, ni la période consultée (§16 : « toute fonction qui croise tâches et
   journal filtre sur `_visuSaison()` »).
3. **`_mvSelTravaillees`** (SEL-1) ignorait les annulations : un arrachage validé puis annulé gardait la parcelle « travaillée », donc concernée, donc à faire.
4. **`_arrValideAuPassage`** (ARRACH-6) écrivait la validation dans `p.taches` — l'état de la période ACTIVE — même datée de janvier, et cochait la parcelle pour la
   campagne du jour.
5. **`p.dateArrachage`** ne servait qu'à l'affichage. Aucune règle ne la lisait : les passages saisis après elle comptaient, et le temps réel (`_ecoTvEvents`, qui ne
   filtre pas les arrachées, §205a) leur versait des heures.
Et en cherchant où lire une annulation : TROIS définitions existaient déjà — `_mvDerniereValidee` (CIBLE-1 : tout ce qui a été saisi avant l'annulation),
`_ecoTvEvents` (la DERNIÈRE clôture du couple), `_ecoPrestaByParc` (rejeu par étape) — aucune avec les étapes ET la période.

### 306b. Les règles posées

- **`_mvAnnulee(j)`** (utils.js, bloc SEL-1, exposée) : une « Annulé » annule les saisies du couple parcelle × tâche faites AVANT elle, PENDANT la même période ;
  celle d'une étape n'annule que cette étape. « Avant » = l'heure de saisie (l'id hexadécimal, `_mvJHeure`), sinon le jour ; la période = celle où la saisie a
  été FAITE (`_mvJPer`, `_saisonForDate`). C'est ce que remet à zéro `annulerTache` (l'état de la période active) : une validation antidatée de janvier saisie le
  9 octobre est annulée, la taille de l'hiver d'avant ne l'est pas. Index mémorisé comme `_MV_SEL_TRAV` (longueur + ids des bouts). Lue par `_mvSelTravaillees`,
  `_pDernier` et les derniers passages de la fiche.
- **`window._mvApresArrachage(p, j)`** : une saisie de travail (Validé, En cours) d'une AUTRE tâche, datée après `dateArrachage`, est une erreur de saisie. Elle reste
  au journal ; elle ne compte plus au temps réel (marquée `horsArr`, gardée dans `byPair` pour qu'une « Annulé » la trouve, retirée à la fin) ni au dernier passage.
  L'arrachage lui-même reste permis après la date ; une « Annulé » n'est jamais écartée.
- **`_mvArrAvantPeriode(p)`** : arrachée AVANT le début de la période consultée → plus aucun travail dans cette période, même l'arrachage — sauf un arrachage en
  étapes entamé et pas fini (`window._arrEntame`, app.js). Lue par `_mvSelEligible` (donc `_parcConcern`, la sélection, l'avancement) et par `_mvArrHors`, restée
  sur UNE ligne (AVC-ARR, ARRACH-7 et COH-1 la lisent ainsi) ; le filtre de la liste par tâche et le formulaire du journal passent par `_mvArrHors`. Sans date
  d'arrachage (déclarée avant ARRACH-1), rien ne change.
- **La feuille « Arracher »** : `_arrDateAvantPeriode(date)` — date d'avant le début de la période active → pas de case, une phrase le dit ; la garde est AUSSI dans
  `_arrValideAuPassage`. La case suit la date (`onchange` posé par `openDPArrachage`, et `_arrProposer` après la date proposée) ; changer de date dans la période
  garde le choix de l'admin (`_ARRV.avant`).
- **La fiche de droite** : les règles d'`openDP` (désactivée → ligne grisée « Non applicable » ou « Pas choisie », `.pfx-off`) ; bandeau `.pfx-arr` « Arrachée le … »
  (« Plus aucun travail à y faire » / « Seul l'arrachage s'y valide encore ») ; table vide → « Plus aucun travail sur cette parcelle. » ; derniers passages à l'état
  effectif (« Annulé ensuite », « Après l'arrachage »). CSS par jetons, dans le bloc PARC-1.

### 306c. Mesuré

- **`mv-harnais-arrach8`** (neuf, branché, vert + contre) : 49 assertions sur les vraies fonctions (utils, app, moteur du temps réel exécuté), 18/18 contre-épreuves
  qui mordent. **La mesure demandée** (moteur exécuté sans la règle) : une journée de 24 h où la taille est validée sur 0,5 ha et sur 0,087 ha arrachés → 3,56 h
  (15 %) à la parcelle arrachée ; trois jours en attente puis la seule validation fautive → elle ramassait 24 h, la vraie parcelle 16. Le poids réel chez Nico
  dépend de ses saisies : non mesurable d'ici.
- Harnais existants relus et rejoués : `arrach6` (deux ancres de contre-épreuve suivies, 5/5), `avc-arr` 3/3, `arrach7` 5/5, `coh1` 12/12, `selection` 9/9,
  `arrach3` 10/10, `valid1` 10/10, `parc1` 12/12, `cible` 16/16. Nouveautés exécutées (`mv-whatsnew-check`) : bloc 8.74, niveau 2 pour le chiffre qui bouge.
- **Chaîne complète** (`mv-lanceur --continuer`, bac à sable à 1 cœur) : 349/349 commandes en 609 s, UN rouge, attendu — `build-guide --check` :
  `public/guide.html` est dérivé de `guide/` et se régénère par `npm run site` (vérifié : vert après régénération ; le fichier n'est pas livré, §27a).
- **Pas regardé dans un navigateur** : le Chromium de `@sparticuz/chromium` (méthode du §270c) n'est pas dans le bac à sable. Le rendu de la fiche est
  vérifié par le harnais (HTML produit), pas à l'œil.

### 306d. Ouvert

§28 « ARRACH-8 — CE QUI RESTE OUVERT » : le geste chez Nico, l'arrachage du 25/09 resté dans sa période, les trois définitions à faire converger, le « 0/0 ».
⚠️ Leçon : avant d'écrire une règle sur le journal, chercher comment l'appli la lit DÉJÀ — trois copies existaient ; une quatrième aurait reproduit le défaut.

## 307. ★★ AUJ-5 — AUJOURD'HUI REMIS À LA MAQUETTE ; LE PLANNING FAIT FOI ; LE PILOTAGE S'OUVRE SUR AUJOURD'HUI (10/10 — `src/pilotage.js` · `src/cockpit.js` · `src/cockpit-vue.js` · `src/app.js` (`goHub`) · `src/styles.css` (feuille AUJ-5) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-auj5.mjs` (neuf) · `scripts/mv-harnais-auj1.mjs` · `scripts/mv-harnais-auj2.mjs` · `scripts/mv-harnais-forme1.mjs` · `scripts/mv-harnais-pro1.mjs` · `scripts/mv-harnais-ref1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `scripts/typo-baseline.json` · `.mv-base` · `lots/AUJ-5.json` · **APP 8.74 → 8.75, SW 9.53 → 9.54**, base `cd06431`)

### 307a. La demande
Nico (10/10, dictée + capture de la maquette validée) : à l'ouverture, admin → Pilotage › Aujourd'hui, ouvrier et tractoriste → Accueil, ou Parcelles avec la
tâche prioritaire ; « il faut toujours se baser sur le planning » (pas de travail le week-end, donc jamais un retour annoncé un samedi ; un arrêt maladie dit
sa fin) ; la phrase du Budget « ne veut rien dire » ; des polices trop grandes, à uniformiser ; la carte des parcelles qui disparaît parfois au retour sur
Aujourd'hui ; la pastille de présence qui clignote ; la disposition de la maquette, « À savoir » à droite ; la charge restante sans colonnes. Puis, à la
reformulation (« oui ») : « À savoir » reste visible quand on descend, et la météo retrouve ses couleurs.

### 307b. Ce qui a été fait
- **Ouverture** : la règle par rôle existait (`_landingPage` / `_goLanding`). Seul écart : le Pilotage rouvrait sur l'onglet mémorisé (`mavigne_pil_tab_<domaine>`).
  `goHub` (connexion, démo, fin d'installation) appelle `window._pilOuvrirAujourdhui` ; le retour arrière passe par `_goLanding` seul et garde l'onglet du
  moment. Le mode « tracteur » du jour atterrit toujours sur Tracteur (dit à Nico, non contesté).
- **Le planning fait foi** (`pilotage.js`) : `_pilPrevuLe(m, date)` pose la question au planning — `_planPrevuPersRange` (la grille du modèle, contrat compris)
  ou `_planWorkPersRange` (un samedi travaillé compte) ; sans planning, lundi–vendredi. `_pilJourDomaine(date)` : une personne hors bureau prévue suffit.
  Dans `_pilData`, quelqu'un que le planning ne prévoit pas est `repos`, ni présent ni absent (`nVchamp`, `nIndispoChamp`, `jourTravaille`, `nRepos`).
  Un jour chômé, le cockpit montre le PROCHAIN jour travaillé (14 jours au plus) et le dit ; « Présences du jour » dit « pas de travail prévu ». Le brûlage de
  la météo et le besoin d'heures par jour se comptent sur les jours du planning (`V.ouvres`, lu aussi par `estOuvre` dans le cockpit).
- **« À savoir »** (`cockpit.js/_ckSvAbsences(…, travaille)`) : un jour non travaillé ne coupe plus une absence et ne sert jamais de retour ; l'absence est
  suivie jusqu'à sa fin (`_CK_SV.loin`, 62 jours) ; arrêt maladie → « Fin d'arrêt le … » ; le motif (admin) ne cache plus la date (« Formation CACES. De retour
  le ven. 16 oct. ») ; une autre absence qui enchaîne est dite (« Puis en récupération. ») au lieu d'un faux « pas de retour ».
- **Disposition** (`ranger`, feuille AUJ-5) : trois colonnes dès 1 000 px de contenu (1 150 avant), colonnes de côté à 260 et 280 px au moins ; entre 760 et
  1 000, le reste à gauche et « À savoir » à droite. « À savoir » colle en haut et sa liste défile seule ; `#page-pilotage:has(.ck2)` rend le défilement à la page.
- **Polices** : phrase de fin prévue 40 → 28 px (24 au téléphone) ; titres de carte et réponses de la décision 24 → 20 px. La décision passe sur une colonne
  quand SA colonne fait moins de 360 px (requête de conteneur sur `#ck-t-a`, pas sur l'écran).
- **Budget** : « du budget main-d'œuvre dépensé, pour N % du travail fait » (aux deux endroits) ; `majPhotos` ne lève plus sans la tuile (pas de taux horaire).
- **Carte** : `dessinerPlan` réessaie une case sans largeur (30 images) ; l'observateur de taille suit aussi `#ck-carte-in`.
- **Pastille** : le halo existait, éteint pour toute équipe commencée un autre jour (`.ancien`) — en pratique presque jamais visible. Il clignote pour toutes
  les équipes en cours, les jours travaillés au planning (`#ck-calque.vif`) ; fixe en animations réduites (dit à Nico).
- **Charge restante** : plus de zone remplie, une ligne et un point par photo ; l'axe part de la première mesure (deux jours avant, jamais avant la période).
  Chaque photo porte sa période (`p`) ; `_ckChargeSerie(…, per)` écarte celles d'une autre période.
- **Météo** : jetons `--meteo-*` déclarés sur `:root` (un `var()` se résout là où il est déclaré : la charte du cockpit ne les atteint pas) ; soleil or, nuage
  gris, pluie et gel bleus, par morceau d'icône (`m-sol`, `m-rai`, `m-nuage`, `m-eau`, `m-gel`).

### 307c. Trouvé en route
0. **Le lot a d'abord été construit sur `cbfcb8e`.** ARRACH-8 (§306, `cd06431`), poussé ensuite, portait les MÊMES numéros (APP 8.74, SW 9.53) et la
   même section : livrés tels quels, les fichiers complets du premier zip l'auraient effacé de douze fichiers. Rejoué sur `cd06431` (fusion à trois voies
   des changements, conflits résolus à la main : nouveautés, en-tête du service worker, documentation), renuméroté 8.75 / 9.54 / §307. Le premier zip est caduc.
1. **`d.saison` est le NOM de la période** : `_pilCk2Modele` lisait `d.saison.nom` — « Les travaux de la saison » pour tout le monde, la phrase que Nico a lue.
2. **La charte DS-4 (§270) avait rendu la météo grise** : `.ck2{--info:var(--texte-med); --or:var(--encours)}`.
3. **La page du Pilotage était un conteneur de défilement** (`overflow-y:auto` sans hauteur bornée) : la colonne collante de la maquette ne collait jamais
   (mesuré : −155 px après 700 px de défilement).
4. **À la base, à 1 440 px barre ouverte : deux colonnes** (1 138 px de contenu) et « À savoir » à gauche — l'écart décrit par Nico, noté par PRO-1 (§269).
5. **La carte qui disparaît n'a pas été reproduite** sur la base (1 440 px : cinq onglets aller-retour, un autre module, une mise à jour des données).

### 307d. Mesuré
- `mv-harnais-auj5` (neuf) : `_ckSvAbsences` exécuté (congé de deux semaines, retours, arrêt, motif, absence qui enchaîne, planning qui prévoit le samedi) ;
  `_pilData` et `_pilCk2Modele` exécutés dans l'appli entière (`mv-app-node` : samedi chômé, prochain jour travaillé, jours du planning, brûlage, saison,
  ouverture) ; le reste lu. Avec ses contre-épreuves.
- Harnais suivis : `auj1` (filtre de période), `auj2` (le motif puis la date), `forme1` et `ref1` (nouvelles dépendances de `_pilCk2Modele`), `pro1` (plus de zone).
- Rendu Chromium, domaine reconstitué un samedi (6 personnes dont une au bureau, un congé, un arrêt, 13 parcelles sans contour) : à 1 440 px barre ouverte,
  trois colonnes, « À savoir » collé à 16 px après 700 px de défilement, la carte présente après onglets, module et données ; à 390 px, une colonne. Base au
  même écran : deux colonnes. ⚠️ Non vus : la vue Économie (pas de taux horaire), la pastille un jour travaillé.
- Chaîne complète (`TZ=Europe/Paris`, `--continuer`, une à la fois), d'abord sur `cbfcb8e` : 349 commandes, 2 rouges levés — `mv-harnais-typo` (`cockpit.js`
  39 → 41 ko, +5 % : regravé, 41 ko ne justifient aucun découpage) et `build-guide --check`. **Rejouée sur l'état final (base `cd06431`, ARRACH-8 compris) :
  351 commandes, 740 s, 1 rouge attendu** — `build-guide --check` : la page générée se refait par `npm run site`, jamais livrée ; régénérée ici, elle passe.
- Voir §28 (AUJ-5) pour ce qui reste ouvert.

## 308. ★★ AUJ-6 — LES DESSINS D'AUJOURD'HUI NE DISPARAISSENT PLUS ; « À SAVOIR » SOUS LES ONGLETS ; LA CHARGE RESTANTE SANS TRAITS (11/10 — `src/cockpit-vue.js` · `src/cockpit.js` (`_ckChargeSerie`) · `src/pilotage.js` (`_pilPhotoEcrire`, `_pilSparkCharge`) · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-auj6.mjs` (neuf) · `scripts/mv-harnais-auj5.mjs` · `scripts/mv-harnais-auj1.mjs` · `scripts/mv-harnais-pro1.mjs` · `scripts/mv-harnais-photo.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/AUJ-6.json` · **APP 8.75 → 8.76, SW 9.54 → 9.55**, base `373361c`)

### 308a. La demande
Nico (10/10, huit captures) : « À savoir » découpé, et coupé quand on descend ; « Nouveau » mal posé ; « le graphique charge restante est nul, on a dit on arrête avec le visu
de colonne ou de ligne qui montent et descendent, il faut que ce soit propre et pro » ; « les images disparaissent parfois » (plan vide sauf les titres d'appellation, courbe
blanche). « Continu », puis « Continuer » : exécution.

### 308b. Les causes — lues, puis REPRODUITES dans Chromium sur la base (appli entière sous Vite, données injectées par `applyFbData`, connexion simulée)
1. **Les dessins disparus.** `G.c`/`GE.c` (cadres des graphes) et `S.mode` survivaient d'un montage à l'autre. Après un passage par Économie, le montage suivant (une donnée qui
   arrive, un retour sur l'onglet) appelait `majEco` → `majEChart` → `dessinerEChart` dans une boîte neuve encore vide : `TypeError` sur `#ck-e-fait`, avalé
   (`pilotage.js/_pilTabAuj#ck2m`, lu dans le rendu). L'entrée s'arrêtait avant de retirer `ck-entree` (parcelles à opacité 0, titres visibles : la capture) et avant
   `redimCourbe(true)` ; ensuite `redimCourbe(false)` voyait la largeur du montage d'avant et ne dessinait rien. Correctifs : le montage remet à zéro G, GE, `S.mode` et
   `S.filtre` (et revient sur Économie si on y était) ; chaque mise à jour de l'entrée est isolée ; la page se montre avant les compteurs ; une boîte cachée le dit
   (`G.w = 0`), une boîte vide se redessine ; `dessinerCourbe`/`dessinerEChart` ne visent jamais une boîte pas dessinée. La règle générale est au §24 (Build n°22).
2. **« À savoir » sous la barre d'onglets.** `top:var(--ck-colle,16px)` : `--ck-colle` n'était posé nulle part (AUJ-5 avait écrasé les 112 px de REF-1). Mesuré : barre
   jusqu'à 59 px, carte collée à 16. `colleHaut()` (à chaque `ranger`) mesure le fil de portée et la barre d'onglets collants : 75 px, la carte sous la barre.
3. **« Nouveau » coupé.** La pastille déborde de 8 px au-dessus de sa cible (`utils.js` le prévient) et AUJ-5 faisait défiler la CARTE (`overflow:auto`). La carte ne coupe
   plus (colonne flex, `overflow:visible`) ; seule la liste défile. Mesuré : le haut de la pastille est bien la pastille (`elementFromPoint`).
4. **Les traits verticaux.** `_pilPhotoEcrire` part du rendu d'Aujourd'hui, et l'admin y atterrit AVANT `_fbLoadAfterAuth` (`_mvApresEntree` → `goHub`) : la photo notait la
   copie locale incomplète (0 h) et ENREGISTRAIT toute la configuration avant d'avoir lu celle du serveur — `saveData('config')` n'a pas le verrou de chargement, un réglage
   fait sur un autre appareil pouvait être écrasé. Gardes : `_dataReady`, `totalTotal > 0`, reste lisible. À la lecture, `_ckChargeSerie` écarte la photo sans période dès
   qu'on en connaît une, garde une valeur par jour, écarte un 0 suivi d'un reste plus haut ; plus de ronds (ils s'empilaient en « oooo » sur un axe de huit mois). La petite
   courbe (`_pilSparkCharge`) suit les mêmes règles. Arbitrage : écarter les photos sans période plutôt que les deviner — la courbe repart du 10/10.
5. **Trouvé au rendu.** Dans une colonne étroite, la date d'une absence ne rétrécissait jamais (`nowrap`) : le nom tombait sur trois lignes, la date était coupée. La ligne
   passe à la ligne (`.ck2 .ck-sv-h{flex-wrap:wrap}`).

### 308c. Mesuré
- Rendu Chromium (1 440 px, barre latérale ouverte, horloge figée au samedi 10/10), base puis lot : ouverture, défilement de 700 px, Économie puis nouveau montage, montage
  caché puis retour, courbe agrandie, téléphone 390 px. Base : pastille coupée, carte à 16 px sous une barre de 59, courbe en zigzag, puis `ck-entree` resté et courbe absente
  après Économie. Lot : pastille entière, carte à 75 px, parcelles et courbe présentes dans les deux scénarios, courbe tracée sur les seules photos sûres.
- `mv-harnais-auj6` (neuf) : 16 vertes, 12 contre-épreuves sur 12 ; `_ckChargeSerie`, `_pilPhotoEcrire` et `_pilSparkCharge` exécutés, le montage et la mise en page lus.
  Suivis : `auj5` 23 (9/9), `photo` 17 (9/9, + deux scénarios et deux contre-épreuves), `pro1` 27 (13), `auj1` 28 (13, ancre suivie). Preflight : 0 erreur, 8 avertissements (base : idem).
- Chaîne complète (`TZ=Europe/Paris`), rejouée par tranches (la limite d'ici est de 300 s par commande) : **353 commandes, 959 s, 0 rouge** ; `build-guide --check` vert
  après régénération locale de la page (`npm run site`), jamais livrée.
- ⚠️ Non vu : ses données, son écran. Voir §28 (AUJ-6).

## 309. ★★ AUJ-7 — LA VUE ÉCONOMIE D'AUJOURD'HUI SUR LES VRAIS CHIFFRES ; L'ARRACHAGE, TRAVAIL À L'HEURE (11/10 — `src/pilotage.js` (`_ecoTvAvecBareme`, `_ecoTempsVigne`, `_pecData`, `_pilCk2Eco`) · `src/cockpit-vue.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_INFO ×4, MV_AIDE) · `public/fonts/fonts.css` · `public/fonts/espace-fine.woff2` (neuf) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-auj7.mjs` (neuf) · `scripts/mv-harnais-ref2.mjs` · `scripts/mv-harnais-pro1.mjs` · `scripts/mv-harnais-arrach8.mjs` · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/banc/garde-projection.mjs` · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/AUJ-7.json` · **APP 8.76 → 8.77, SW 9.55 → 9.56**, base `b94659b`)

### 309a. La demande
Nico (11/10, capture de la maquette validée) : la vue Économie d'Aujourd'hui doit suivre la maquette, avec une seule police ; l'aire verte du graphe « dépensé face au
fait » et les « 0 € / −0 € » de « Par poste » « ne veulent rien dire » ; « on fait du pro ». Reformulation confirmée (« exact »), avec un ajout : « il y a aussi des
problèmes avec l'arrachage (regarde les textes de conventions si besoin et trouve une solution) ». Une question posée : retirer les heures sans barème de l'écart de
cadence (Nico avait dit le 23/09 de laisser l'écart comme il est, §172f ③). Réponse : « On suit ta recommandation ».

### 309b. Ce que le rendu a montré (Chromium, appli entière sous Vite, domaine reconstitué : 13 parcelles, taux horaires, planning, arrachage en étapes dont un jour mêlé, prestataire, tracteur)
1. **L'atterrissage valait le budget par construction.** REF-2 (§267) additionnait le dépensé et `E.resteE` (budget − engagé) : max(engagé, budget). D'où « Dans le budget »,
   « 0 € » partout, et un coût à l'hectare égal à son prévu. Sur l'essai : 11 500 € affichés, 15 650 € projetés par le moteur (`E.projFin`).
2. **La main-d'œuvre « dépensée » était le barème du fait** (`T.moF`), son atterrissage `T.moF + T.moR` = `T.moB` : écart toujours 0 ou −0 (résidu d'arrondi), et la tuile Budget
   disait « 53 % dépensés pour 54 % faits » par construction (payé réel : 70 %). ENG-2 (§173) avait pourtant mis l'engagé sur les heures payées : l'adaptateur lisait l'ancienne grandeur.
3. **« Cadence de l'équipe » = la journée de référence** : `_pilCk2Eco` rendait `cadence: E.cad.hJour` (7 h), qui écrasait `V.capMoy` — aussi sous la courbe de charge restante (Terrain).
4. **Le graphe** lisait les photos du jour : la part de TOUT le budget (`cons`), quelques jours, un point du jour égal au fait, et une aire « avance » entre deux tracés décalés.
5. **Les polices** : chiffres des tuiles à 32 px (700) au-dessus de la phrase (28 px, 600), lignes à 13 ou 14 px, valeurs en 600 ou 700. Et **U+202F** (l'espace des milliers et
   avant « € », « % », « ha » en français) n'est dans aucune des onze fontes (vérifié avec fontTools) : prise ailleurs, parfois de largeur nulle — « 15099€ » à côté de « 6 820 € »,
   et dans la capture de Nico « 2576€ sur 7980€ ». `mv-harnais-subset` lit les `unicode-range`, qui la déclaraient : il ne pouvait pas le voir.
6. **L'arrachage** : (a) un jour où une étape d'arrachage et une clôture au barème partageaient la liste (PAR-1, prorata du barème), l'arrachage prenait 0 h — la réparation du jour
   ramassait toute la journée, report compris (essai : 14 h d'arrachage au lieu de 29) ; (b) payé dans la main-d'œuvre, absent du budget : il mangeait le reste à engager ;
   (c) dans l'écart de cadence : +41 % au lieu de +31 % ; (d) listé dans « Écart au barème, par tâche » à « 0 h de barème, 0,0 % » ; (e) « Bourgogne Aligoté, 0,00 ha ».

### 309c. Les conventions
L'accord collectif du 2 octobre 2023 relatif au travail à la tâche en viticulture (Côte-d'Or, Doubs, Jura, Nièvre, Haute-Saône, Yonne, Territoire de Belfort) et les accords de
domaines qui le déclinent fixent les **travaux obligatoires** de la tâche (485 h/ha pour un temps plein de 3,31 ha), des options (remplacement des piquets : 10 h/ha, travaux de
cave…) et des **heures en plus**, payées à l'heure. L'arrachage n'y figure pas : **aucun temps de référence à reprendre**. Le catalogue le disait déjà (« temps réel, hors
barème », §205d : pas de barème par défaut). Conséquence retenue : un travail sans barème est un **travail à l'heure** — compté au réel, jamais comparé à un barème.

### 309d. Ce qui change
- **Moteur** (`pilotage.js`) : `_ecoTvAvecBareme(def)` ; dans `_ecoTempsVigne`, chaque clôture porte `hb` (sans barème) ; la journée d'une liste MÊLÉE se partage d'abord à la
  surface entre travaux à l'heure et travaux au barème, puis comme avant (une liste d'un seul genre : identique, au caractère près) ; les euros des travaux à l'heure sont datés au
  jour où les heures ont été faites (`byDHb`, accumulateur daté par personne) ; `barD` = barème clos par jour. Dans `_pecData` : `hbE`/`hbH`, budget et « barème du fait »
  augmentés de `hbE` (son budget est son coût, comme une prestation), poste `hb` « Travaux à l'heure », main-d'œuvre vigne = `moReel − hbE`, écart de cadence sans `hbH`, écart
  d'une parcelle sans ses heures à l'heure, `tvHorsE` sans eux (ils ont leur poste). **La cadence ne s'applique plus qu'au reste de main-d'œuvre** : le reste du tracteur, du GNR
  et du phyto est déjà extrapolé à l'avancement ; le multiplier aussi faisait que l'écart de la campagne n'était pas la somme de ses lignes (47 € d'écart inexpliqué sur l'essai).
- **Photo du cockpit** (`_pilCk2Eco`) : atterrissage = `E.projFin` ; main-d'œuvre payée (poste `mo`), son atterrissage = payé + `T.moR` × cadence ; postes avec une RÉFÉRENCE
  (`proj` : extrapolé ; `cout` : prestations, travaux à l'heure ; `reel` : pas encore de prévu), un poste vide caché ; plus de `cadence` ; `serie` datée (payé en % du budget
  main-d'œuvre, fait au barème ramené à l'avancement), deux courbes qui ne font que monter, le dernier point = les chiffres du jour.
- **Affichage** (`cockpit-vue.js`) : signe posé APRÈS l'arrondi (montants, pourcentages : jamais « −0 ») ; un seul arrondi, à l'euro (tête, phrase, frise, « Par poste ») ; la
  phrase dit sur quoi repose le reste (cadence mesurée, ou barème) ; « Par poste » : écart pour la main-d'œuvre et le total (« au budget » à zéro), « reste N € » pour un poste
  extrapolé, le coût pour un poste au réel, trait de fin sur la seule main-d'œuvre (orange au-delà du budget) ; graphe sans aire, échelle au-delà de 100 % ; tâches comparables
  seulement ; appellation sans hectare cachée, sans travail validé « — ». Fiches « i » réécrites (atterrissage, budget, coût à l'hectare, écart, graphe, postes, appellations, tâches).
- **Polices** : chiffres des tuiles 24 px, lignes 14, total 16, une graisse forte (600) ; `espace-fine.woff2` (664 octets, un glyphe : U+202F, 0,13 cadratin) déclarée pour chacune
  des onze fontes, APRÈS elles (pour ce caractère, c'est elle que le navigateur essaie d'abord) — vaut pour toute l'appli et les documents imprimés.

### 309e. Mesuré
- `mv-harnais-auj7` (neuf) : 24 vertes, 10 contre-épreuves sur 10. Moteur et photo EXÉCUTÉS dans l'appli entière (`mv-app-node`) sur un domaine au jour mêlé ; affichage, feuille
  et polices lus. ⚠️ La première version de A1 ne mordait pas : l'auteure des validations (nommée) et une salariée non nommée donnaient déjà 28 h à l'arrachage la veille ; A1 vise
  désormais l'étape du jour mêlé (« Souches »), seule à prendre 0 h sans la règle.
- Rendu Chromium (1 440 px, barre ouverte), avant / après : 15 099 € projetés, « 2 985 € au-dessus du budget de 12 114 €, au rythme mesuré de l'équipe », main-d'œuvre +2 985 €
  (6 820 € payés sur 9 767 €), tracteur « reste 112 € », prestations 1 450 €, travaux à l'heure 568 € (arrachage 29,3 h), total +2 985 €, cadence 28 h/j, écart +30,5 % ; espaces des
  milliers visibles à toutes les graisses ; aucune erreur hors réseau coupé.
- Remis au nouveau contrat, contre-épreuves comprises : `mv-harnais-ref2` (14 vertes, 7/7 : l'atterrissage EST la fin projetée, la main-d'œuvre est payée, la série datée ;
  deux défauts neufs réinjectés), `mv-harnais-pro1` (27, 13/13 : « Pile dans le budget », le taux arrondi par `tauxH`), `mv-harnais-arrach8` (49, 18/18) et `mv-harnais-temps-vigne` (84,
  30/30) extraient `_ecoTvAvecBareme`, et TV-1 suit la nouvelle forme du partage et de la projection ; `banc/garde-projection` (19) : la fin projetée reste gardée par la
  cadence applicable. ⚠️ Premier passage de la chaîne : 4 rouges, tous de contrat (preflight C26 : `import()` d'un chemin dans le harnais neuf — `pathToFileURL` ; trois
  harnais qui lisaient l'ancienne forme), aucun défaut de l'appli. `mv-harnais-typo` regravé, tailles seules : `cockpit-vue.js` 109 → 116 ko (+6 %, un seul écran sous 120 ko : pas de découpage), `pilotage.js`
  889 → 898, `utils.js` 838 → 851, `styles.css` 694 → 697 ; `app.js` 868 → 873 vient des lots d'avant (fichier non touché ici). Rendu au téléphone (390 px) regardé.
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`, une à la fois), deuxième passage, d'une traite : **355 commandes, 507 s, 0 rouge** — `build-guide --check` vert
  après régénération locale de la page (`npm run site`), jamais livrée.

### 309f. Ouvert
§28 « AUJ-7 — CE QUI RESTE OUVERT ». ⚠️ Leçon : un adaptateur qui « branche le moteur » doit lire la grandeur que l'écran NOMME — `resteE` (l'argent qui reste) n'est pas le
travail qui reste, `moF` (le barème du fait) n'est pas le payé. Les deux erreurs donnaient des écrans propres, cohérents… et vides de sens, par construction.

## 310. ★ NOTIF-2 — PLUS DE MESSAGE ORANGE « PROMESSE REJETÉE : SHOWNOTIFICATION » ; LA GARDE VIT DANS `_swNotify` (11/10 — `src/utils.js` (`_swNotify`, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-notif2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/preflight-baseline.json` (regravée à la baisse) · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/NOTIF-2.json` · **APP 8.77 → 8.78, SW 9.56 → 9.57**, base `717e3a2`)

### 310a. La demande
Nico (11/10) colle un rapport de l'écran d'erreurs : « Promesse rejetée : Failed to execute 'showNotification' on 'ServiceWorkerRegistration': No notification permission has
been granted for this origin. », niveau error, catégorie runtime, 19 occurrences non traitées du 20/09 au 10/10, deux domaines, deux comptes, écrans « — », cave, pilotage,
planning ; la trace jointe vient du canal de prévisualisation `test-refonte`. Diagnostic reformulé, confirmé (« C'est tout à fait ça »), avec une seconde demande (310e).

### 310b. Le diagnostic, mesuré avant d'écrire
- **L'effet** : `logError` niveau `error` → toast orange « ⚠️ Promesse rejetée : … » à l'écran, et une entrée au journal du domaine. Rien d'autre ne casse : le nouveau service
  worker est déjà installé quand la notification est tentée.
- **La cause** : NOTIF-1 (§158) appelle `_swNotify('Mise à jour Ma Vigne', …)` au `statechange → installed`, gardé par `controller` seulement. `_swNotify` passait par
  `reg.showNotification()` sans tester la permission ; sans elle, Chrome REJETTE la promesse, rien ne la rattrapait → `unhandledrejection` → branche générique. Le §158e ① le
  disait (« ne vérifie pas explicitement la permission ») ; il ne disait pas que l'appel de NOTIF-1 était le SEUL sans garde à lui : DAR et priorité (`checkNotifAlerts`,
  `notifyPriorityChange`), test d'activation (`sendTestNotif`, appelé après `granted`) et rappels tracteur (`checkRepNotifications`) testent tous `Notification.permission`.
- **La preuve par les dates** : les identifiants du rapport sont des horodatages (`Date.now()_xxxx`). En heure de Paris : la première le 20/09 à 10 h 06, au lendemain de NOTIF-1
  (`0bb80a5`, poussé le 19/09 à 20 h 56) ; chacune tombe un jour où le changelog de `sw.js` date une version, ou le lendemain matin (01/10, après les quatre versions du 30/09) ;
  quatre le 09/10. Aucune avant.
- Vu en route : iOS Safari hors écran d'accueil n'a pas d'API `Notification` ; l'ancien code y tentait quand même `showNotification` (même rejet).

### 310c. Ce qui change
- `_swNotify` (`utils.js`) : `return` si l'API manque ou si `Notification.permission !== 'granted'` — la garde vit DANS la fonction, pour tous les appelants présents et futurs ;
  `.then(function(reg){ return reg.showNotification(…); })` puis `.catch` → `_mvAvale(e, 'utils.js/_swNotify')` (permission retirée entre la garde et l'envoi) ; le `catch(e){}`
  vide du repli `new Notification` (interdit sur Android) passe en `_mvAvale(e, 'utils.js/_swNotify#new')` : C14 de `utils.js` 2 → 1.
- ⚠️ **Le `return` dans le `.then` est la moitié du correctif** : sans lui, le rejet de `showNotification` n'est pas chaîné et échappe au `.catch` (contre-épreuve 3).
- Là où les notifications sont autorisées, rien ne change ; ailleurs, plus rien ne part — c'était déjà le choix du §158e ②.
- `WHATS_NEW` 8.78 : un item niveau 0, pour tous (le message était visible de tous). Aucun écran ne change : fiche `MV_AIDE` Réglages et `guide/12-reglages.html` relues, rien à
  changer ; visite guidée non concernée.
- `CLAUDE.md` §8 corrigé : il disait la mise à jour « actuellement FORCÉE » (`skipWaiting` + rechargement), faux depuis MAJ-1 (§157) et VER-1 (§184). Deux lignes au lieu de cinq,
  ce qui a aussi fait la place de ce lot sous le plafond du cœur.

### 310d. Mesuré
- `mv-harnais-notif2` (neuf) : `_swNotify` EXTRAITE du vrai fichier et exécutée sur huit appareils (permission jamais donnée, refusée, API absente, accordée, retirée entre la garde
  et l'envoi, sans service worker, constructeur interdit, ni l'un ni l'autre), en comptant les rejets NON GÉRÉS (`process.on('unhandledRejection')`) ; et lu : un seul
  `.showNotification(` et un seul `new Notification(` dans `src/`, ceux de `_swNotify`. **10 vertes, 6 contre-épreuves sur 6.** Rejoué sur la base : 5 rouges, dont A1 qui
  reproduit exactement le rapport (1 envoi, 1 rejet non géré).
- Preflight : 0 erreur ; C14 `utils.js` 2 → 1 → référence regravée, prouvée clé par clé : la seule valeur qui bouge est cette baisse. La référence datait du 03/10 : sept
  modules nés depuis (`cockpit`, `cockpit-vue`, `coquille`, `gt`, `ids`, `planning-vue`, `taille-doc`) y entrent, tous à zéro.
- `WHATS_NEW` exécuté en Node (tête = `APP_VERSION`, 365 blocs en ordre strict, aucun doublon) ; `mv-whatsnew-check` vert.
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`) : **357 commandes, 778 s (une à la fois dans le bac à sable), 0 rouge** — dont `mv-harnais-notif2` et sa contre-épreuve.
- Non vérifié : un vrai téléphone (Android, iPhone) et Chrome de bureau — le harnais imite le refus de Chrome, il ne l'est pas.

### 310e. Ouvert — la demande suivante (NOTIF-3)
Nico : « les notifications, on les reçoit vraiment de façon intempestive. L'idée, c'est d'en avoir une […] le matin à 7 heures ou à 8 heures, en fonction de l'heure à laquelle
on prend le travail […] sur le téléphone ». Inventaire : la priorité saisie est renotifiée toutes les heures tant que l'appli tourne (`scheduleNotifCheck` →
`setInterval(checkNotifAlerts, 3600000)`), chaque traitement à 1–3 jours de son DAR aussi ; « Nouvelle priorité » sur l'appareil même qui l'enregistre ; « Mise à jour » à chaque
version (trente le 08/10) alors que VER-1 met déjà l'appli à jour au retour ; les rappels tracteur ; Réglages promet des « alertes gel » qu'aucun code n'envoie. **Tout part de
l'appli ouverte** : `sw.js` n'a ni `push` ni `notificationclick`, rien ne peut arriver à 7 h appli fermée (le §158b avait écarté l'envoi serveur). Le planning connaît l'heure :
`_planRetardBornes(mbr, m, d).t0` (saisie du jour > code D/M/A > horaire du mois). Proposé, reformulé, réponse « Continuer » : couper les répétitions ; un envoi serveur (Web Push,
fonction planifiée au quart d'heure) à la prise de poste, les seuls jours travaillés ; contenu priorité, retour tracteur, DAR selon le rôle ; les heures publiées par l'appli de
l'admin à chaque enregistrement du planning — le même calcul que l'écran, jamais une seconde source d'horaire côté serveur ; activation une fois par téléphone (iPhone : appli sur
l'écran d'accueil, iOS 16.4 ou plus). À prévoir : la clé privée d'envoi en secret Firebase, jamais dans ce dépôt public ; un planificateur de plus (combien en existent déjà :
à confirmer — au-delà de trois, environ 0,10 $/mois chacun).

## 311. ★★ NOTIF-3 — UNE SEULE NOTIFICATION PAR JOUR TRAVAILLÉ, À L'HEURE DE PRISE DE POSTE, ENVOYÉE PAR LE SERVEUR (11/10 — `functions/notif.js` (neuf) · `functions/notif-calc.js` (neuf) · `functions/index.js` · `functions/package.json` · `functions/package-lock.json` (`web-push`) · `src/reglages.js` · `src/planning.js` (`_planPrisesDePoste`) · `src/firebase.js` (`fbSave`) · `src/app.js` · `src/tracteur.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/12-reglages.html` · `scripts/mv-harnais-notif3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `lots/NOTIF-3.json` · **APP 8.78 → 8.79, SW 9.57 → 9.58**, base `717e3a2`, contient NOTIF-2 (§310), non poussé)

### 311a. La demande
Nico (11/10, dictée) : « les notifications, on les reçoit vraiment de façon intempestive. L'idée, c'est d'en avoir une […] le matin à 8 heures ou à 7 heures, en fonction
de l'heure à laquelle on prend le travail. Il faut qu'au moment où sur le planning il y a une heure de prise de poste, la notification soit envoyée à cette heure-ci sur le
téléphone ». Reformulé (inventaire au §310e), proposé : couper les répétitions ; un envoi serveur à la prise de poste, les seuls jours travaillés ; priorité, tracteur et DAR
selon le rôle ; les heures publiées par l'appli de l'admin. Réponses : « Continuer », puis « suite ».

### 311b. Le dessin, et ce qui a été écarté
- **Envoi serveur obligatoire** : à 7 h l'appli est fermée, et rien dans un navigateur ne réveille une page à heure fixe (les déclencheurs horaires de notification n'ont
  jamais été publiés ; la synchronisation périodique choisit son heure, au mieux une fois par 12 h). Web Push standard (clés VAPID, `web-push` côté fonctions) plutôt que
  Firebase Cloud Messaging : aucun SDK de plus dans l'appli, aucun domaine de plus dans la CSP — `pushManager.subscribe` parle au service d'envoi du navigateur.
- **Le serveur ne recalcule pas le planning.** L'heure de prise de poste a déjà une définition, `_planRetardBornes` (saisie du jour > code D/M/A > horaire du mois), avec
  modèles, contrats et absences dans `planning.js`. La recopier dans `functions/` aurait fait deux sources d'horaire (§24, n° 18). L'appli de l'admin — seule à lire tout le
  planning depuis MOTIFS-1 — publie les heures ET les lignes des 14 jours à venir (`notifHoraires`) : à chaque enregistrement (`fbSave` → `_mvNotifPlanifier`, regroupé à
  20 s ; le planning s'écrit aussi par `fbSave` direct, pas seulement par `saveData`) et à la première ouverture du jour. Le serveur choisit et envoie, rien d'autre.
- **Le membre d'un abonnement** vient de l'adresse VÉRIFIÉE du jeton, cherchée dans `membres` (même lien que planning-vues) — jamais d'un nom envoyé par le téléphone : on
  recevrait sinon l'heure et la priorité d'un collègue.
- **Collections réservées au serveur** (`mv_notif_abos`, `mv_notif_horaires`) : hors du motif `mavigne_*`, aucune règle de `firestore.rules` ne les ouvre, en lecture comme
  en écriture. Aucune règle à toucher, aucune clé dans `COLLECTIONS` (rien de C12/C13 ni de la Couche 2).
- **Adresses d'envoi** limitées aux services des navigateurs (FCM, Mozilla, Apple, Windows) : un abonnement forgé ne fait pas poster le serveur ailleurs.
- **Gardé** : un message même sans rien de particulier (« Bonne journée ! ») — Nico a demandé « en avoir une » chaque matin travaillé.

### 311c. Ce qui change
- `functions/notif-calc.js` (pur) : `abonnementValide`, `publicationValide` (31 jours, 300 noms, 6 lignes de 160 caractères), `membreDuCompte`, `parisDe` (Paris, au quart
  d'heure), `planDuQuart` (prise de poste dans [ce quart d'heure, le suivant) : 07:10 part à 07:00, jamais après ; jamais deux fois le même jour, `dernier`), `message`.
- `functions/notif.js` : `notifCle` (la clé publique sort d'un secret : aucune clé dans ce dépôt public), `notifAbonner`, `notifHoraires` (claim `adm` exigé), `notifMatin`
  (`*/15 4-20 * * *`, Europe/Paris ; 404/410 → abonnement retiré). App Check sur les trois appels.
- `src/reglages.js` : section réécrite — `_mvNotifAbonner` (une fois par jour, ou au toucher), `_mvNotifLignes`, `_mvNotifPublier`, `window._mvNotifPlanifier`,
  `window._mvNotifDemarrage` ; `checkNotifAlerts`, `scheduleNotifCheck`, `notifyPriorityChange` retirées ; iPhone hors écran d'accueil : un message dit comment installer.
- `src/planning.js` : `window._planPrisesDePoste(nbJours)` — rien hors contrat, à 0 h, en congé, en récupération, absent toute la journée ; absent en début de journée : l'heure
  de retour. `src/firebase.js` : `fbSave` appelle `_mvNotifPlanifier` (après le cas démo, avant les droits ; contrat de `mv-harnais-reseau` tenu).
- `src/app.js` : plus de notification à chaque version, `_mvNotifDemarrage` au démarrage, import `_swNotify` retiré. `src/tracteur.js` : `checkRepNotifications` retirée (le
  retour du réparateur est une ligne du matin), import retiré.
- `public/sw.js` : `push` (toujours une notification visible, sous `waitUntil`) et `notificationclick` (remet l'appli devant, ou l'ouvre).
- `index.html` : « Alertes gel, DAR, validations » → « Un message chaque jour travaillé, à la prise de poste » (aucune alerte gel n'a jamais existé). `guide/12-reglages.html` :
  la ligne Notifications dit ce qu'elle fait. `WHATS_NEW` 8.79 : niveau 2, pour tous — chaque téléphone doit activer une fois.
- Fiches `MV_AIDE` Réglages et Tracteur relues : aucune ne parlait des notifications, rien à changer. Visite guidée non concernée.

### 311d. Mesuré
- `mv-harnais-notif3` (neuf) : **27 vertes, 13 contre-épreuves sur 13**. Calcul serveur exécuté (été, hiver, quart d'heure, déjà servi, autre domaine, absent) ; `notif.js`
  exécuté avec un faux `require` (Firestore, web-push, secrets) : droits, membre lu sur l'adresse vérifiée, 410 → retiré, passage rejoué → rien ; `_mvNotifLignes` et
  `_planPrisesDePoste` exécutées sur des bouchons qui LISENT leurs arguments.
- ⚠️ **Trouvé par le harnais** : la première écriture de `_planPrisesDePoste` comparait les heures en texte AVANT de les mettre sur deux chiffres — « 7:00 » < « 09:30 » est
  faux en texte : absent jusqu'à 9 h 30, on recevait son message à 7 h. Corrigé (`hm()` d'abord) ; la contre-épreuve vise la ligne neuve.
- Preflight : 0 erreur, aucun compteur ne bouge. Verts : `mv-harnais-globaux`, `lint-cliquet`, `mv-harnais-reseau`, `mv-harnais-confidentialite`, `mv-whatsnew-check`,
  `mv-harnais-typo`, `lint-vocabulaire`, `mv-harnais-annonces`, `mv-harnais-lanceur`, et `mv-harnais-notif2` (un seul `showNotification` dans `src/`).
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`) : **359 commandes, 777 s, 1 rouge — `mv-lots`, attendu** : la marque de NOTIF-2 voyait ses fichiers changer tant que celle de NOTIF-3 (`--inclut NOTIF-2`) n'était pas posée ; rejoué après la marque : vert. `build-guide --check` vert sur la page régénérée en local (`npm run site`), jamais livrée.
- Non vérifié : un vrai téléphone (Android, iPhone installé), un vrai envoi (les secrets n'existent pas encore), le planificateur réel.

### 311e. Ouvert
§28 « NOTIF-3 — CE QUI RESTE OUVERT ».

### 311f. Le déploiement — les secrets, puis l'ordre
1. Une fois : `npx web-push generate-vapid-keys` (affiche une clé publique et une clé privée), puis depuis `mavigne-dev\` : `firebase functions:secrets:set VAPID_PUBLIQUE`
   (coller la publique) et `firebase functions:secrets:set VAPID_PRIVE` (coller la privée). La CLI peut proposer d'activer Secret Manager : oui. La clé privée ne va JAMAIS
   dans le dépôt ni dans une conversation. Changer la paire plus tard désabonne tous les téléphones.
2. `firebase deploy --only functions:notifCle,functions:notifAbonner,functions:notifHoraires,functions:notifMatin` — AVANT l'appli (sinon les téléphones appellent des
   fonctions absentes ; sans dégât, ils réessaient le lendemain). Un planificateur de plus ; aucune règle, aucun backfill.
3. `npm run site` → `npm run build` → `firebase deploy --only hosting`.
4. Sur chaque téléphone : Réglages › Moi › Notifications → Autoriser → une notification « Notifications activées » confirme. Ensuite : le jour travaillé suivant,
   « Bonjour <prénom> » à la prise de poste ; console › Functions › notifMatin › Journaux : « [NOTIF-3] … : N envoyé(s) ».

## 312. ★★ AUJ-8 — « À SAVOIR » DONNE DES FAITS, PLUS DE VERDICT ; RISQUE DE PLUIE, CUMUL ET VENT SOUS CHAQUE JOUR (11/10 — `src/cockpit.js` (`_ckMeteoJour`, `_ckCommuneDe`, `_ckEnCours`, `_ckEnCoursTxt`, `_ckSvMeteo`, `_ckSavoirHtml`) · `src/pilotage.js` (`_pilCk2Modele`) · `src/cockpit-vue.js` (`htmlSavoir`, `INFO.savoir`, `ICO.vent`) · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_INFO) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-auj8.mjs` (neuf) · `scripts/mv-harnais-auj2.mjs` · `scripts/mv-harnais-auj5.mjs` · `scripts/mv-harnais-sect1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/AUJ-8.json` · **APP 8.79 → 8.80, SW 9.58 → 9.59**, base `2469c5a`)

### 312a. La demande
Nico (11/10, capture de la bande des cinq jours d'« À savoir ») : « enlève la tâche de brûlage ici, ce n'est pas à l'appli de décider si oui ou non il est
possible de faire une tâche. mettre autre chose, propose ». Reformulé, puis trois propositions : le vent ; le risque de pluie (une barre, comme la météo de
l'Accueil) ; rien. Et la même question pour les lignes du dessous (« Le brûlage attendra un temps sec », « Aucun chantier en cours ne craint ce temps ») : les
faits seuls, et ce qui est en cours dans la commune touchée, sans verdict. Réponses : « oui rajoute la probabilité de pluie aussi » ; « non les jours non
travaillés ne doivent pas être grisés » (proposé pour garder ce que portait la barre) ; « Continuer ».

### 312b. Trouvé en route
- La barre ne lisait que la pluie : `brul: chômé ? 0 : (mm >= 2 ? .5 : 1)`. La demi-barre « l'après-midi seulement » s'affichait dès 2 mm dans la journée,
  sans lire l'heure ; le vent n'entrait jamais.
- ★★ **Par secteur, le compte des parcelles de brûlage valait TOUJOURS zéro en production.** La commune d'une parcelle est rangée `{ nom, lat, lng }`
  (FORME-1, §301) et `_ckSvMeteo` la comparait par `String(p.commune)` — « [object Object] ». La ligne disait donc toujours « Aucun chantier en cours ne
  craint ce temps ». `mv-harnais-sect1` passait des communes en texte : vert sur une forme que l'appli n'écrit pas (§24 n° 20).
- En octobre, un brûlage dont la fenêtre ouvre en décembre comptait déjà comme « pas fini » (`pct < 100`, aucune date lue).
- Tout ce qu'il fallait était déjà chargé : `METEO_DAILY.pp` (le risque, le plus haut de la journée), `METEO_HOURLY.wind` et `.precip`. Aucun appel de plus.

### 312c. Le dessin, et ce qui a été écarté
- **La bande** : sous chaque jour, une barre qui se remplit au risque de pluie et son %, le cumul (dès 0,5 mm, une décimale, comme les lignes), le vent le
  plus fort de la journée (vent moyen à 10 m, `windspeed_10m` : les rafales ne sont pas demandées). Cumul et vent viennent de `_ckMeteoJour`, désormais
  exposée : la bande et les lignes disent le MÊME chiffre. Une valeur inconnue reste vide — `_ckMeteoJour` rend `vent: null` quand aucun vent n'est relevé
  (avant : 0). Légende d'un seul axe (§24 CSS n° 13) : « risque de pluie ».
- **Écarté : griser le jour non travaillé** — proposé, refusé par Nico : la bande dit le temps, le planning dit le travail.
- **Les lignes** : titres inchangés (les faits). Dessous, `_ckEnCours` : les tâches du plan (`_ckPlanTaches`), commencées au calendrier de la campagne CE
  jour-là (`_ckPlanDebut` ≤ jour) et pas finies ; leurs parcelles pas encore faites (états du plan) dans les communes touchées — toutes, au niveau du
  domaine. Une parcelle sans commune compte dans le secteur du domaine (`window._domaineCommuneNom`, comme `_communesActives`). Ordre de la campagne,
  trois tâches au plus puis « et N autres tâches ». Rien en cours : aucune phrase — les deux rendus (`htmlSavoir`, `_ckSavoirHtml`) n'écrivent plus de
  `<p>` vide. Rang 1 (le « quand » en or) seulement quand quelque chose est en cours là où ça tombe : un classement, pas un verdict.
- **Écarté** : une tâche sans fenêtre dans la campagne n'est jamais dite « en cours » (rien d'inventé) ; le seuil réglementaire du vent pour traiter
  (3 Beaufort) n'est pas tracé : ce serait encore décider à la place de l'admin.
- **Petit téléphone** (vu dans Chromium) : à 300 px de carte, les vitesses se chevauchaient. « km/h » passe dessous pour les cinq jours à la fois (requête
  de conteneur `ck-met`, 290 px) — jamais pour un seul, sinon les colonnes ne s'alignent plus. À 340, 358 et 420 px, tout tient sur une ligne.

### 312d. Mesuré
- `mv-harnais-auj8` (neuf) : **33 vertes, 17 contre-épreuves sur 17**. `cockpit.js` exécuté (communes en objet, fenêtre pas ouverte, tâche finie, arrachée,
  passages, secteur du domaine, plus de trois tâches, aucun verdict, phrase vide) ; `_pilCk2Modele` dans l'appli entière (`mv-app-node` : même cumul et
  même vent que les lignes, jour par jour ; risque arrondi et borné ; rien d'inventé sans prévision) ; la vraie `htmlSavoir` extraite et exécutée ; textes
  et feuille lus.
- `mv-harnais-auj2`, `mv-harnais-sect1`, `mv-harnais-auj5` : leurs assertions du brûlage réécrites (sect1 garde des communes en texte : les deux formes
  sont couvertes) ; verts, contre-épreuves comprises.
- Preflight : 0 erreur, 8 avertissements, comme la base. `mv-harnais-typo` a vu `cockpit.js` enfler de plus de 5 % (41 → 44 ko) : commentaires
  raccourcis (l'arbitrage vit ici), 43 ko, vert — référence non regravée.
- Chromium (`@sparticuz/chromium`, la vraie `htmlSavoir`, la vraie feuille, les vraies polices), à 300, 340 (sombre), 358 et 420 px : débordement mesuré
  colonne par colonne — aucun.
- Fiche `MV_AIDE` du Pilotage relue : « la météo des cinq jours » reste vrai, rien à changer. Visite guidée : aucun sélecteur de la bande.
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`) : **361 commandes, 719 s (une à la fois : un seul cœur ici), 0 rouge**. Le guide a été
  régénéré pour `build-guide --check`, puis remis : `public/guide.html` ne part pas dans le zip (`npm run site` le refait).
- Non vérifié : les données de Nico, un vrai téléphone.

### 312e. Ouvert
§28 « AUJ-8 — CE QUI RESTE OUVERT ».

## 313. ★ RAIL-1 — LA BARRE LATÉRALE SUIT L'ORDRE DU DOCK, GARDÉE PAR THÈMES ; UN LOGO DESSINÉ POUR 28 PX (11/10 — `src/coquille.js` (`RUB`, `ORDRE_RUB`, `TETE` / `PIED`, `_railRubriques`, `_railHtml`) · `src/styles.css` (bloc RAIL-1) · `public/logo-barre.png` · `public/logo-barre-sombre.png` (neufs) · `public/sw.js` (précache) · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `scripts/mv-harnais-rail1.mjs` (neuf) · `scripts/mv-harnais-coq1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `lots/RAIL-1.json` · **APP 8.80 → 8.81, SW 9.59 → 9.60**, base `14d9d73`)

### 313a. La demande
Nico (11/10, capture de la barre, message dicté) : « l'ordre devrait être d'abord pilotage, après vigne, tracteur, phyto, cave, réserve, ensuite planning, et
après réglage. Vois si tu peux garder l'organisation par thème, terrain, organisation, cave et réserve, et gestion […] mais en mieux. Et si tu peux renforcer
un peu la couleur du logo ». Reformulé, proposition validée (« oui »), maquette rendue (avant / après, clair et sombre, ouverte et repliée), « go ».

### 313b. Trouvé en route
- **Le dock avait DÉJÀ cet ordre** (`_dockDef`, app.js : Pilotage, Vigne, Tracteur, Phyto, Cave, Réserve, Planning, Réglages). La barre le défaisait :
  `_railRubriques` regroupait par rubrique dans l'ordre fixe de `ORDRE_RUB` (Terrain, Organisation, Cave et réserve, Gestion), et le Pilotage, rangé dans
  « Gestion », finissait en bas. Rien à changer côté dock : c'est la barre qui le suit maintenant.
- **Le logo de la barre était `icon-192.png` réduit à 28 px** (`--h-sm`). Ses traits font 4 à 7 px sur 512 : 0,3 px à l'écran. Le lie-de-vin virait au
  rose, et le jaune d'origine (#EBDF52) est à 1,2:1 sur le fond clair (#F0EEE9) — le G et le T disparaissaient. Vu sur la capture de Nico (écran à 125 %).

### 313c. Le dessin, et ce qui a été écarté
- **L'ordre** : le Pilotage en tête, seul, sans titre (`TETE`) ; puis Terrain (Vigne, Tracteur, Phyto), Cave et réserve, Organisation (Planning) ;
  Réglages au pied (`PIED`), dans `.mv-rail-bas`, au-dessus de la personne. « Gestion » disparaît : ses deux entrées sont aux deux bouts. Dans un thème,
  l'ordre reste celui du dock. Un module que `RUB` ne connaît pas rejoint « Organisation » (avant : « Gestion »). Repliée, un trait sépare les thèmes.
- `_railRubriques` rend `{ tete, rub, pied }` au lieu d'une liste : seuls `_railHtml` et `mv-harnais-coq1` la lisaient.
- **Mode tracteur** : le dock met Tracteur, Phyto, Vigne en tête ; la barre garde le Pilotage au-dessus (il n'existe que pour l'admin), et Terrain
  s'ouvre sur ces trois-là. Écart assumé, noté au §28.
- **Le logo** : un dessin à part, `public/logo-barre.png` (clair) et `public/logo-barre-sombre.png`, 112 px (4 fois les 28 px affichés). Fabriqué hors
  dépôt depuis `logo-gt.png` (512 px) : traits de la grappe épaissis de 6 px et lettres de 4 px (dilatation sur un disque), anneau de 5 px vidé autour des
  lettres (la séparation que faisait le noir de l'icône), couleurs reposées. En clair : grappe `#7A2850` (= `--accent`, « la lie-de-vin des grappes du
  logo », DS-4), lettres `#E2BC1C`. En sombre : grappe `#B4467C` (3,8:1 sur #0D0D0C, là où l'accent sombre #8A3560 ne fait que 2,6) et jaune d'origine
  `#F0E040`. Posé en FOND par la feuille, avec les mêmes sélecteurs que les deux blocs sombres (forcé ; automatique sauf clair forcé) : une `<img>` ne
  suit pas le thème, un fond si — et un fond absent ne laisse pas d'icône cassée.
- **L'icône de l'appli (`icon-192.png`) ne change pas** : manifeste, `apple-touch-icon`, notifications.
- **Précache** : les deux dessins rejoignent `SHELL_STATIC`, la barre garde son logo hors réseau. ⚠️ Le précache est atomique : les deux fichiers doivent
  être en ligne avec ce `sw.js` (ils partent dans `public/`, donc dans le même `firebase deploy --only hosting`).
- **Écarté** : le logo à 32 px (non demandé) ; la tuile noire de l'icône (plus qu'« un peu ») ; un SVG retracé (le trait à la main s'y perdait) ;
  une image en data: dans la feuille (des octets illisibles dans `styles.css`, que les harnais qui lisent la feuille auraient dû apprendre à sauter).
- **Accompagnement** : le guide (`01-demarrer.html` : une barre « qui reprend exactement les entrées du bas de l'écran ») et la fiche `MV_AIDE` de
  l'Accueil (« les modules sont dans la barre à gauche ») restent vrais — relus, rien à changer. Visite guidée : aucun sélecteur de la barre.
  `WHATS_NEW` : un item `niv` 0, `pour` tous.

### 313d. Mesuré
- `mv-harnais-rail1` (neuf) : **16 vertes, 9 contre-épreuves sur 9**. Le vrai `_dockDef` d'app.js est exécuté (administrateur, salarié sans
  Pilotage, mode tracteur) et la vraie barre rendue : même ordre que le dock ; un module inconnu rejoint « Organisation ». Les deux PNG sont décodés
  (sans dépendance) : couverture 20 % contre 9 % pour l'icône, lie-de-vin et or proches des couleurs voulues ; le précache est lu. Contre-épreuves :
  le dock réordonné sans la barre, le Pilotage rangé dans un thème, Réglages remonté, Cave après Organisation, un module perdu, l'icône pâle remise,
  le sombre automatique oublié, les dessins hors précache.
- `mv-harnais-coq1` : l'assertion des rubriques suit le nouveau retour (`{ tete, rub, pied }`) ; 8 vertes, 4 contre-épreuves. `coq2` (15), `pro1` (27),
  `tete1` (12) verts sans changement.
- `mv-harnais-typo` : `coquille.js` 16 → 17 ko — +481 octets, +2,9 % ; le cliquet compte des ko arrondis, d'où le « +6 % ». Découpage : non (17 ko,
  une seule responsabilité, comme au §271). Référence regravée pour CETTE seule ligne (une ligne au diff de `scripts/typo-baseline.json`) : un
  `--baseline` complet effaçait aussi la mémoire de sept autres fichiers restés sous les 5 % (cockpit 41 → 43, reglages 476 → 482, utils 851 → 856…).
- Preflight : 0 erreur, 8 avertissements, comme la base. `WHATS_NEW` exécuté en Node : tête 8.81 = `APP_VERSION`, ordre strict, 0 doublon ; le récap
  depuis 8.80 rend un bloc, depuis 8.75 six, depuis 8.81 et 9.00 rien.
- Chromium (`@sparticuz/chromium`, le vrai `coquille.js`, la vraie feuille, les vraies polices, échelle 1,25 comme l'écran de Nico) : ouverte et
  repliée, clair et sombre, zéro erreur JS ; le bon dessin dans les quatre cas de thème (clair forcé sur système sombre, automatique sombre,
  automatique clair, sombre forcé), 28 × 28 px, aucun débordement.
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`) : **363 commandes, 673 s (une à la fois), 0 rouge**. Empreintes des 17 fichiers du lot
  identiques avant et après (aucune commande « seule » n'a laissé de trace). ⚠️ Une première passe, lancée en fin de tour, s'était arrêtée à la
  commande 171 avec le tour : un processus de fond ne survit pas d'un tour à l'autre. Rejouée en entier dans le tour de la livraison.
- Non vérifié : l'écran et les données de Nico ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 313e. Ouvert
§28 « RAIL-1 — CE QUI RESTE OUVERT ».

## 314. ★★ BULLE-1 — CHAQUE « i » OUVRE UNE BULLE COLLÉE À LUI ; CELLE D'AUJOURD'HUI AVAIT PERDU SON STYLE (11/10 — `src/utils.js` (`_mvInfoOpen`, la bulle `_mvBulle*`, l'écouteur, `_mvInfoBtn`, APP, WHATS_NEW, MV_AIDE) · `src/cockpit-vue.js` (`btnI`, `ouvrirInfo`, squelette, Échap) · `src/styles.css` (bloc BULLE-1) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-bulle1.mjs` (neuf) · `scripts/mv-harnais-info.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/BULLE-1.json` · **APP 8.81 → 8.82, SW 9.60 → 9.61**, base `2e8fb78`)

### 314a. Pourquoi
Nico (11/10, dicté) : « le i de information […] ça ouvre un vieux texte en bas, dans pilotage. C'est pas du tout clair, c'est pas du tout net. Ce serait
mieux d'ouvrir une infobulle. Bref, vérifiez aussi dans les autres modules ». Deux mécaniques sous la même phrase :
- **Aujourd'hui** (`cockpit-vue.js`) : ses « i » (`.ck-i`, `data-info`) ouvraient `#ck-pop`, la bulle de la maquette — **zéro règle de style dans tout le
  dépôt** : le convertisseur de REF-1 (§266b) l'avait laissée en route. `hidden` retiré, le `<p>` tombait dans le flux, à la fin de `.ck2` : le « vieux texte
  en bas ». Le `left` / `top` posés par le code ne faisaient rien (position statique). Aucun harnais ne lit un rendu : REF-1 était vert.
- **Partout ailleurs** : `data-mvi` → `_mvInfoOpen` → la feuille `#ovInfo` (§42c) — montée du bas sur un voile au téléphone, fenêtre au centre dès 768 px.
  62 fiches : Pilotage 56, Cave 4, Réglages › Documents 2 (dont une DANS une fenêtre). Vigne, Tracteur, Phyto, Planning, Réserve : aucun « i ».
- Les fiches sont longues : médiane 851 caractères (4 paragraphes), jusqu'à 3 313 (`pil.eco.temps`, 9 §) ; premier paragraphe : médiane 208, au plus 659.
Validé (« go ») : une seule bulle, celle de la maquette, partout ; le premier paragraphe puis « Lire la suite » ; les Nouveautés gardent leur feuille ; pas
de nouvelle maquette (c'est la bulle déjà validée).

### 314b. Comment
- **`_mvBulleOuvrir(ancre, fiche, o)` / `_mvBulleFermer(rendre)`** (utils.js, posées sur `window`) : un seul élément `#mv-bulle`, `position:fixed`, sur le
  « i ». `_mvInfoOpen(cle, ancre, clavier)` lui passe la fiche (vivante d'abord) ; le cockpit lui passe son texte — `ouvrirInfo` tient en quatre lignes.
- **Le moteur est pur, donc exécuté par le harnais** : `_mvBulleCalcul` (dessous ; sinon dessus ; sinon le plus grand côté, hauteur bornée et texte qui
  défile — 12 px de marge, 10 px d'écart, pointe à 16 px au moins des coins), `_mvBulleParagraphes` (plus d'un paragraphe et plus de 480 caractères nus :
  le premier, puis « Lire la suite »), `_mvBulleLargeur` (360 px fiche titrée, 320 phrase, 86 % de l'écran au plus).
- **★★ La fenêtre hôte — A11Y-2.** `_mvInertOutside` rend inerte tout ce qui n'est pas la fenêtre du dessus. Posée sur `<body>`, une bulle ouverte depuis
  une fenêtre serait visible et intouchable, et son clic tomberait sur le voile, qui ferme la fenêtre. Elle se pose donc DANS `closest('.overlay')` (une
  `.overlay` couvre l'écran : les coordonnées fixes restent justes). Ailleurs sur `<body>` — jamais dans un parent transformé, qui deviendrait le repère du
  `fixed`. Dans une couche fixe (tiroir 8910, feuille du Cuvier 9000) : z-index de la couche + 1 ; sinon `--z-tip` (800), au-dessus de la barre (35) et
  du dock (90), sous les dialogues (9200). `mv-harnais-couches` ne la suit pas : ce n'est pas une surface d'accueil.
- **★ Trouvé au banc, pas à la lecture.** Fermée, la bulle dormait sur `<body>` ; une fenêtre ouverte ensuite la marquait `inert` (`data-mv-inert`) ;
  rouverte DANS la fenêtre, elle gardait la marque — « Lire la suite » ne répondait plus. Correctif double : fermée, elle quitte le document ; à
  l'ouverture, une marque A11Y-2 restée sur elle s'efface.
- **L'écouteur** (document, phase de capture) : `[data-mvi]` → la bulle, `stopPropagation` gardé (la tuile se replierait, §42c). Bulle ouverte : un
  toucher dans la bulle y reste ; sur son « i », il la referme ; sur un `[data-bulle]` (les « i » du cockpit, qui ouvrent la bulle eux-mêmes), il la ferme
  et passe — un seul toucher pour changer de « i » ; partout ailleurs, il la ferme ET s'arrête : la carte dessous ne se replie pas, l'onglet ne s'ouvre pas.
  Échap (capture) : `preventDefault`, que `_mvOvKey` respecte — la bulle d'abord, la fenêtre au second ; le cockpit lit `defaultPrevented`, sinon
  « Agrandir » se refermait avec.
- **Elle suit son « i »** : défilement (capture ; pas celui de la bulle) et rotation → même côté, même hauteur ; « i » hors de l'écran → fermée. Une veille
  (400 ms, bulle ouverte seulement) : fenêtre ouverte par-dessus → fermée ; écran redessiné → raccrochée au même « i » (`sig` : `[data-mvi="…"]` ou
  `.ck-i[data-info="…"]`), introuvable ou en double → fermée ; « i » déplacé → suivi.
- Clavier : Entrée ouvre et met le focus dans la bulle (`role=dialog`, nommée par son titre, sinon par le « i ») ; Tab hors de la bulle la ferme ; Échap
  rend le focus au « i ». `aria-expanded` sur le « i », qui prend la couleur du survol tant que sa bulle est ouverte.
- Préfixe : `.mvb-` est déjà pris par la Cave (`.mvb-card`…) → `.mv-bulle-*`, `data-bulle`, `data-bulle-suite`, `--mv-bulle-x`.
- `#ovInfo` reste pour les Nouveautés (`_mvAnnFiche`, `openNouvJournal`), avec `.mvi-bd` / `.mvi-ic`. `#ck-pop`, `infoBtn` et `fermerInfo` quittent le cockpit.
- En passant : « Explication manquante » disait « n'a pas encore ete ecrite », et la pastille s'annonçait « D'ou vient ce chiffre » : accentués.

### 314c. Accompagnement
- `MV_AIDE.pilotage`, « Le petit rond « i » » : « une fiche s'ouvre » → la bulle à côté, « Lire la suite », toucher ailleurs pour la refermer. Cave et
  Réglages : aucune fiche ne décrit le « i » — relues, rien à changer.
- Guide `11-pilotage.html`, même section : même correction. Visite guidée : aucun sélecteur ne vise un « i » — rien à changer. `MV_INFO` : aucune
  méthode de calcul ne change — relu, rien à changer.
- `WHATS_NEW` 8.82 : un item `niv` 0, `pour` tous.
- Place dans le cœur (plafond 2 800) : trois lignes vides sous des titres du §28 (ARRACH-8, GF-1, FORME-1) ; rien n'est rayé.

### 314d. Mesuré
- `mv-harnais-bulle1` (neuf) : **45 vertes, 11 contre-épreuves sur 11** — le « i » renvoyé à la feuille, la bulle toujours sur `<body>`, toujours dessous,
  débordant de l'écran, tout le texte d'un coup, le toucher à côté qui passe à travers, Échap qui ferme la fenêtre, la feuille de la bulle perdue (le
  défaut d'origine), `#ck-pop` remis, l'Échap du cockpit, `data-bulle` oublié. Le moteur est exécuté ; l'écouteur, la feuille et le cockpit sont lus sans
  leurs commentaires.
- `mv-harnais-info` suit la chaîne (le « i » passe par la bulle ; `#ovInfo` reste aux Nouveautés) : 132 vertes. Verts sans changement : jetons 33,
  échelle 29, typo 7, couches 14, contraste 9, TEXTE-A 13, REF-1 18, REF-2 14, PRO-1 27, AUJ-1 28, AUJ-5 23, AUJ-6 16, AUJ-7 24, AUJ-8 33, CADRE-1 10,
  KIT-1 12, KIT-2 11, globaux, icônes, `mv-whatsnew-check` (bloc 8.82).
- Preflight : 0 erreur, 8 avertissements, comme la base. `catch` vides : 1 → 1 (utils.js), 0 → 0 (cockpit-vue.js).
- **Chromium** (`@sparticuz/chromium` ; banc hors dépôt : vraie feuille, vrai `utils.js`, vraies polices, A11Y-2 et le geste du cockpit rejoués) :
  **32 vertes, zéro erreur JS**, à 390 × 844 en clair et 1440 × 900 en clair et en sombre — dessous à 10 px, pointe sous le « i » (± 2 px), au-dessus en
  bas d'écran, « Lire la suite » déplié qui tient dans l'écran et défile, toucher à côté qui ne replie pas la carte, cockpit ↔ pastille en un toucher,
  suivi au défilement puis fermeture hors écran, fenêtre (bulle dedans, non inerte, « Lire la suite » vivant ; voile et Échap : la bulle d'abord), clavier
  (focus entré, puis rendu au « i »). ⚠️ Les deux rouges du premier passage venaient du BANC : le point « sur le voile » tombait sur la bulle dépliée,
  puis le « i » touché la refermait. Le point a changé, pas le code (§25.20 : lequel des deux a tort).
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`) : **365 commandes, 684 s (une à la fois), 1 rouge, attendu** : `build-guide --check` — la page
  `public/guide.html` est FABRIQUÉE et le lot change sa source. `npm run site` joué ici : vert, rien à réécrire au sitemap ; puis la page remise à l'état
  du dépôt (on livre la source, jamais le fabriqué, §27d). Empreintes des 15 fichiers du lot identiques avant et après la chaîne.
- Non vérifié : l'appli entière et les données de Nico (le cockpit n'a été vu qu'à travers son geste rejoué) ; un vrai téléphone ; `npm run build`,
  `test:smoke`, `test:e2e` ; le déploiement.

### 314e. Ouvert
§28 « BULLE-1 — CE QUI RESTE OUVERT ».

## 315. ★ FORME-2 — LA CARTE DE L'ACCUEIL DESSINE CHAQUE PARCELLE À SA FORME ; LE TOUCHER Y OUVRE ENFIN LA FICHE (11/10 — `src/app.js` (`_homeForme`, `_homePrioCarte`) · `src/styles.css` (bloc FORME-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Accueil) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-forme2.mjs` (neuf) · `scripts/mv-harnais-acc2.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/FORME-2.json` · **APP 8.82 → 8.83, SW 9.61 → 9.62**, base `6e06158`)

### 315a. La demande
Nico (11/10) : « Dans Vigne, il faut la forme des parcelles dans l'accueil de la même taille que les carrés actuellement, ça pourrait être bien. » C'est le point laissé
ouvert par FORME-1 (§301f, « la carte de l'Accueil »). Reformulé avant le travail (sa préférence) : la vraie forme à la place de chaque rectangle, sans agrandir la carte,
une seule échelle, chaque forme à la surface de son rectangle, mêmes couleurs, même ordre ; une parcelle sans contour garde son rectangle ; pas de maquette (le dessin est
celui du cockpit, déjà validé), une capture à la livraison. Réponse : « oui ».

### 315b. Ce qui a été fait
- **`_homeForme(f, r)`** (app.js) : le contour lu par `_mvFormeDe` (mètres, nord en haut) et la taille de l'ancien rectangle. Celui-ci faisait `--h-row-2 × √r` de large
  au format 8/5, jamais moins d'un tiers : sa surface valait 5/8 × r en parts de `--h-row-2`², plancher 1/9. La forme garde cette surface et prend les proportions du
  contour : `--fw × --fh = 5/8 × r`, `--fw / --fh = w / h`. Aucun pixel dans le JS : la feuille calcule `calc(var(--h-row-2) * var(--fw))`, le dessin suit son `viewBox`.
- ★ **La taille suit la surface DÉCLARÉE, pas l'aire du contour.** C'est ce que pèse le pourcentage de la carte ; le contour ne donne que les proportions. Écart voulu
  avec le plan du cockpit (FORME-1), qui dessine l'aire du contour : sur l'Accueil, un contour mal tracé ne grossit ni ne rétrécit une parcelle.
- **Sans contour** : le rectangle d'avant, en pointillé (`.hpc-sans`) SEULEMENT quand le domaine a des contours ; un domaine qui n'en a aucun ne change pas (sinon des
  pointillés partout chez un client neuf). Le titre dit « pas de contour enregistré », le mot du cockpit. Un tracé illisible (deux points, `NaN`) ne dessine rien.
- **Le toucher** : `openDP` au lieu d'`openSelParc` (§315c ①).
- **`#home-prio-mos`** : la mosaïque porte un id, la pastille « Nouveau » (niveau 1) s'y pose. `mv-whatsnew-check` exige un `id="…"` LITTÉRAL dans les sources : un
  `c.id='…'` posé en JS n'y compte pas — d'où la mosaïque, et pas `#home-prio-corps`.

### 315c. Trouvé en route
1. **Le toucher ne faisait rien depuis ACC-2 (§277).** `openSelParc(nom)` attend une tâche à sélection (`_mvTacheSel`) : avec un nom de parcelle, elle rendait la main
   (un salarié lisait « Admin requis »). FORME-1 l'avait corrigé dans le cockpit (§301c ③), pas ici. **Et `mv-harnais-acc2` exigeait l'erreur**
   (`onclick="openSelParc(this.dataset.nom)"`) : troisième harnais à figer ce même défaut, après REF-1 et AUJ-3.
2. **« La même taille » n'est pas « la même hauteur de carte ».** Mesuré dans Chromium (vrais fichiers, domaine fabriqué de 38 parcelles dont 36 avec contour, lanières
   de 90 à 320 m sur 12 à 42) : chaque forme a la surface de son rectangle (écart ≤ 0,2 %), mais la mosaïque passe de 145 à 187 px au téléphone (la carte de 411 à 453),
   de 58 à 78 px sur ordinateur (la carte : +5 px, la colonne des chiffres fixe sa hauteur). Une lanière occupe une boîte plus large que sa surface, et chaque rangée
   prend la hauteur de sa forme la plus haute. Dit à Nico, avec le levier (un facteur dans `_homeForme`).
3. Une lanière de 12 m de large devient un trait de 3 à 5 px : c'est sa forme, à cette taille. La prise du doigt reste d'au moins `--e-4` (`min-width`, `min-height`).

### 315d. Les harnais et le rendu
- **`mv-harnais-forme2.mjs`** (neuf, 21 assertions, 11 contre-épreuves) : le VRAI bloc FORME-1 d'utils.js et les VRAIES `_homeForme` / `_homePrioCarte` dans un `vm` —
  proportions (100 × 20 m → 5 pour 1), surface de l'ancien rectangle (≤ 1 %), plancher, deux morceaux, équerre, casse du nom, sans contour (pointillé, titre), contour
  illisible, point `NaN`, échappement, `openDP` sur les sept, ordre, ni `undefined` ni `NaN`, domaine sans contour inchangé, utils.js absent ; la feuille (jetons seuls,
  spécificité, format 8/5 levé, trait d'un pixel), l'aide, le guide, les nouveautés, la liste. Rouge sur l'app.js d'avant (15 échecs).
- **`mv-harnais-acc2.mjs`** : `openDP` exigé, `openSelParc` refusé ; le contexte reçoit `window` (un domaine sans contour) et `_homeForme`.
- **Rendu regardé** (Chromium, vraie feuille, polices Outfit) : téléphone clair et sombre, ordinateur ; zéro erreur JS, aucune forme hors de la carte.
- Non vérifié : les contours de Nico ; un vrai téléphone ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 315e. Ouvert
§28 « FORME-2 — CE QUI RESTE OUVERT ».

## 316. ★ CHANT-1 — LES CHANTIERS SE RANGENT PAR DATE DE DÉBUT ; L'ARRACHAGE FINI POUR L'ÉQUIPE EN TÊTE DES TERMINÉS (12/10 — `src/utils.js` (`_mvOrdreChantiers` neuf, `_mvkAvancement`, APP, WHATS_NEW, MV_AIDE Accueil et Pilotage) · `src/app.js` (`_mvChantiersCtx` neuf) · `src/pilotage.js` (`_pilCk2Modele`) · `src/cockpit-vue.js` (`charger`, `calc`, `suiteFen`, `htmlChantiers`, `majChantiers`) · `src/cockpit.js` (sous-titre du repli) · `src/styles.css` (`.mvk-note`) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-chant1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CHANT-1.json` · **APP 8.83 → 8.84, SW 9.62 → 9.63**, base `a664ba0`)

### 316a. La demande
Nico (12/10, dicté) : les chantiers de la saison « doivent apparaître dans l'ordre de commencement » — celui du 1er septembre avant celui du 15, « peu importe la date de fin » ; une
fois terminés, en bas ; en haut, ceux à faire ou en cours. Reformulé avant le travail (sa préférence), avec ce qui était prévu en plus : « terminé » = 100 %, un chantier en retard reste
en haut, les terminés rangés entre eux par date de début, la même règle à l'Accueil (« Avancement par tâche ») et dans Pilotage › La campagne. Réponse : « C'est tout à fait ça ».
Puis, pour l'arrachage : la part du prestataire ne compte pas pour l'équipe, « elle n'est pas à mettre en avant pour l'équipe », mais l'administrateur doit la voir — « ça doit être
la première des terminées ». Et l'équipe ne doit plus la voir dans les listes de parcelles à faire (§316c ②, lot suivant).

### 316b. Ce qui a été fait
- **`_mvOrdreChantiers(rows, ctx)`** (utils.js, bloc KIT-1, exposée) : trois groupes — 0 à faire ou en cours (en retard compris), 1 fini pour l'équipe (`equipeFinie`, pas à 100 %),
  2 terminé (100 %) ; dans un groupe la date de début, puis l'ordre reçu. Pure : `ctx = { debut, defaut, equipeFinie }`. Sans contexte, les terminés descendent quand même.
- **`_mvChantiersCtx(sa)`** (app.js, à côté de `_mvTacheDuMoment`, exposée) : la période consultée par défaut (celle de `calcHeures` ; le Pilotage passe `_pilSaison()`, celle de
  `_rfCd`). `debut[nom]` = le `start` de la fenêtre de `_chargeSaisonData`, **la date que la ligne du cockpit affiche** : l'ordre ne peut pas contredire la ligne. `defaut` = le début
  de la période. `equipeFinie.Arrachage` = `_arrEquipeFiniePartout()` (ARRACH-7).
- **Les trois listes** : `_mvkAvancement` range par la règle (Accueil, La campagne, et le repli du cockpit) ; `_pilCk2Modele` range ses tâches avant de les construire et pose
  `eqFini`. La signature `_mvkAvancement(rows,retards)` et ses appels ne bougent pas (kit1 et coh1 les lisent au caractère près).
- **L'arrachage fini pour l'équipe** : vert, son vrai pourcentage, « la suite au prestataire » — sous la ligne dans le kit (`.mvk-note`, une ligne à part : la grille de chaque
  ligne garde ses colonnes), dans la fenêtre dans le cockpit (`suiteFen`, au montage comme à la mise à jour). Le plan ne le prend plus comme tâche par défaut.
- Le sous-titre « Dans l'ordre des dates de la campagne » (cockpit et repli) devient « Par date de début, les terminés en bas ».

### 316c. Trouvé en route
1. **Le sous-titre mentait depuis REF-1.** `getTachesSaison` filtre le catalogue `TACHES` dans SON ordre (Réglages) ; ni `calcHeures`, ni le modèle, ni le kit ne triaient.
2. **L'arrachage dans les listes de parcelles.** `_arrStatutTache` laisse « En cours » une parcelle dont l'équipe a fini ses étapes : `_mvTacheEtat` la dit « commencée », le filtre
   « À faire » la garde et le tri de Parcelles la met en tête. ARRACH-7 ne l'avait retirée que de « Ma part du chantier » et du choix de la priorité. Reformulé à Nico, lot suivant.
3. **Les tâches sans barème n'ont pas de fenêtre** : `_chargeSaisonData` ne pousse dans `taskDet` que `h>0`. Leur ligne du cockpit montre `v.debut` (le premier chantier) et
   l'objectif, même avec des échéances. Les dater toucherait `etatVue` (le plan) et « fenêtre passée » : écarté de ce lot, au §28.
4. **Deux lectures des dates** : PRIO-1 lit l'échéance, sinon toute la période ; le cockpit, l'échéance, sinon la fenêtre par défaut (`_MV_TASK_WIN`). L'ordre suit le cockpit.

### 316d. Les harnais
- **`mv-harnais-chant1.mjs`** (neuf, 32 assertions, 13 contre-épreuves) : la VRAIE règle sur l'exemple de Nico, la fin ignorée, les terminés en bas, le retard en haut,
  l'arrachage (fini pour l'équipe, à 100 %, pas fini), l'égalité, sans fenêtre, sans contexte, une entrée qui n'est pas une liste ; le VRAI kit (ordre, vert à 50 %, la mention une
  fois, le retard des autres, sans app.js) ; le VRAI `_mvChantiersCtx` (le début et pas la fin, période consultée, période en argument, période inconnue, l'arrachage, une panne) ; la
  ligne `suiteFen` exécutée ; le branchement du modèle et du cockpit, la feuille, l'aide, le guide, les nouveautés. Aucune écriture dans le dépôt.
- Relus et rejoués : kit1, coh1, auj1, auj5, auj7, auj8, ref1, ref2, forme1, forme2, pro1, prio, arrach7, acc2, whatsnew, typo, jetons, échelle, contraste, info ; preflight
  0 erreur.
- Non vérifié : les données de Nico ; un rendu dans un navigateur ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 316e. Ouvert
§28 « CHANT-1 — CE QUI RESTE OUVERT ».

## 317. ★ ARRACH-9 — L'ARRACHAGE FINI POUR L'ÉQUIPE QUITTE « À FAIRE » ET LES CARTES DE L'ÉQUIPE (12/10 — `src/app.js` (`_arrAuPrestataire`, `_pvAuPresta`, `window._mvAuPrestataire`, `_arrPrestaEnAttente`, `_pvVideTitre` / `_pvVideTexte`, `_pEtatTache` / `_pEtatLib` / `_pEtatBadge`, `renderParcelles`, `_pRow`, `_pCarteTache`, la fiche, `_homePrioCarte`) · `src/utils.js` (`_mvCibleCarte`, APP, WHATS_NEW, MV_AIDE Parcelles) · `src/pilotage.js` (`_dzRowsTache`, l'anneau de la tournée) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach9.mjs` (neuf) · `scripts/mv-harnais-chant1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ARRACH-9.json` · **APP 8.84 → 8.85, SW 9.63 → 9.64**, base `f293f54`)

### 317a. La demande
Nico (12/10, avec CHANT-1) : la part du prestataire ne compte pas pour l'équipe ; une fois ses étapes faites, l'arrachage « ne doit plus apparaître dans les listes des
parcelles à faire ». Vérifié avant de proposer (§316c ②) : `_arrStatutTache` laisse « En cours » la parcelle démontée, `_mvTacheEtat` la dit « commencée », Parcelles la garde
dans « À faire » et la met EN TÊTE. Reformulé avec une recommandation (hors de « À faire » pour tous, visible sous « Toutes » pour valider l'étape du prestataire depuis la
fiche, plus « commencée » sur les cartes, lot à part après le tri) ; réponses : « Continuer », puis « suite » une fois CHANT-1 poussé.

### 317b. Ce qui a été fait
- **`_arrAuPrestataire(p)`** (bloc ARRACH-3) : découpage actif, pas validée en entier, toutes les étapes NON prestataire faites (`_arrEquipeFinie`). Sans étape d'équipe, la
  parcelle est au prestataire d'emblée. `window._mvAuPrestataire(p, T)` la lit pour l'arrachage seulement (utils.js, pilotage.js).
- **Parcelles** : hors de « À faire » (filtre), plus en tête comme « commencée », rangée avec les faites sous « Toutes » ; l'état écrit « fini pour l'équipe, au prestataire »
  (habit de « fait » : `prow-fait`, `pcq-fait`, aucune règle de feuille neuve) ; badge « Au prestataire » dans la fiche ; la puce « Arrachage » rejoint les tâches finies quand
  l'équipe a fini partout ; la liste vide dit « Arrachage fini pour l'équipe — la suite est au prestataire » au lieu de « terminé sur toutes les parcelles » (faux).
- **Les cartes et la tournée** : la carte de l'Accueil la compte faite (vue de l'équipe), l'anneau des cartes (`_mvCibleCarte`) ne la prend ni « commencée » ni « prochaine »,
  la tournée de Décider (`_dzRowsTache`) ne la propose plus, son anneau non plus.
- ★ **Volontairement PAS dans `_mvTacheEtat` ni `_pvCurDone`** : ils décident du bouton du rail (« Fait » + Annuler sur une parcelle finie). Une parcelle au prestataire
  garde « Valider », qui ouvre la fiche (ARRACH-3) : c'est là que l'étape du prestataire se valide.

### 317c. Trouvé en route
1. **CHANT-1 avait figé la TÊTE des nouveautés** (`^export const WHATS_NEW = [\n  { v: '8.84'`) : rouge dès ce lot, qui prépend 8.85. Corrigé : le harnais lit son BLOC.
   Règle pour tout harnais : vérifier le bloc de sa version, jamais sa place en tête.
2. **Deux harnais exécutent la vraie `_homePrioCarte` sans le bloc ARRACH-3** (forme2, acc2) : un appel nu à `_pvAuPresta` y levait (13 et 4 rouges). La lecture ne court
   que pour l'arrachage (`t==='Arrachage'&&…`), ce qui est aussi le sens de la règle ; leurs mondes restent justes.
3. Le plan du cockpit n'avait pas le défaut : `_ckPlanLire` lit le journal, et une étape validée y est « Validé » → « faite ».

### 317d. Les harnais
- **`mv-harnais-arrach9.mjs`** (neuf, 22 assertions, 11 contre-épreuves) : le VRAI bloc ARRACH-3 (démontage fait, rien de fait, validée, sans découpage, tout au prestataire,
  parcelle absente), les VRAIES `_pEtatTache` / `_pEtatLib` / `_pEtatBadge`, la liste vide (arrachage, autre tâche échappée, sans parcelle au prestataire), la VRAIE
  `_mvCibleCarte` (avec et sans la lecture), le branchement de Parcelles, de l'Accueil et de la tournée, le bouton Fait / Annuler intact, l'aide, le guide, les nouveautés.
- Rejoués : arrach3, arrach6, arrach7, arrach8, avc-arr, forme2, acc2, kit1, coh1, chant1, prio, cible, selection, valid1, parc1, parc2, whatsnew, globaux, cliquets ;
  preflight 0 erreur. La chaîne complète : voir la note de livraison.
- Non vérifié : les données de Nico ; un rendu dans un navigateur ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 317e. Ouvert
§28 « ARRACH-9 — CE QUI RESTE OUVERT ».

## 318. ★★★ DIRECT-1 — « DÉBUT » ENREGISTRE L'ÉQUIPE ; « EN DIRECT » DIT QUI EST OÙ, TRACTEUR COMPRIS (12/10 — `src/app.js` · `src/cockpit.js` · `src/cockpit-vue.js` · `src/pilotage.js` · `src/utils.js` (MV_AIDE ×2, MV_INFO, WHATS_NEW) · `src/styles.css` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-direct1.mjs` (neuf) · `scripts/mv-harnais-auj1.mjs` · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · APP 8.85 → **8.86** · SW 9.64 → **9.65** · base `db178db`)

### 318a. D'où ça vient
Nico (12/10, cinq captures, la refonte sur son canal) : « l'équipe est bien programmée mais c'est encore moi d'indiqué dessus. De plus il n'y a personne en direct. Il ne faut
aucun bug. » Pasquier des Chenes, en cours sur la réparation, portait « N » dans le plan et dans « Chantiers d'hiver », alors que le bandeau « Équipe sur Réparation » disait
Victor, Shana, Alicia, Pauline ; « En direct » écrivait « Rien encore aujourd'hui ». Diagnostic posé, reformulé, « Oui » — et : « aujourd'hui j'étais sur le tracteur,
j'aimerais bien que ça apparaisse ». Puis « Continuez ».

### 318b. Les causes, lues dans le code
1. **Les deux « Début » n'écrivaient que leur auteur.** `pQuickStart` (la carte) et `marquerEnCours` (« Démarrer » de la fiche) posaient `{qui, statut:'En cours',
   equipe:false}` ; `pQuickValidate` écrivait le groupe de la barre (`_eqtFor` : l'équipe du jour d'abord, sinon celle de la tâche) et « sans moi » (`_eqtHors`). L'équipe du
   jour ne jouait pas non plus : `_mvEqApplique` ne la donne qu'à ceux qui en font partie, et l'admin n'y était pas.
2. **« En direct » ne lisait que le journal du jour** (`_ckFilDonnees`, voulu au §301 : « le fil reste du jour »). La parcelle avait été commencée un autre jour — sa
   pastille était en clair, la classe `ancien` — et rien n'était validé : panneau vide, équipe dans les rangs.
3. **Le cockpit ignorait « sans moi »** : `_ckQui` (cockpit.js) et le `qui` de `_pilCk2Modele` mettaient l'auteur en tête, `quiHors` ou pas — contrairement à
   `_ecoTempsVigne`, `_ecoEquipeByParc` et `_jivQui` (TV-2, §172).

### 318c. Ce qui a été fait
- **`_mvGroupeTache` / `_mvDebutLigne`** (app.js) : la règle de `pQuickValidate`, appliquée aux deux « Début » avant `_mvEqApplique` (le compte des écritures du journal
  ne bouge pas). `pQuickValidate` n'est pas réécrit : le harnais vérifie la même sortie.
- **`_mvDebutsSuivent`** (app.js), appelé par `_pvApplyTeam` (« Changer ») : les parcelles EN COURS de la tâche que l'auteur a commencées SANS groupe noté (avant ce lot :
  tout début de l'admin) reçoivent l'équipe choisie, « sans moi » compris. Lecture : `_ckPlanDebuts` depuis le début de la période active, plus
  `p.taches[tâche]==='En cours'`. Jamais un groupe déjà écrit, jamais le début d'un autre ; `date` et `ts_debut` intacts ; le toast le dit (« … aussi sur … »).
  ★ Arbitré : PAS de réécriture automatique au chargement — un début fait seul exprès ne se distingue pas d'un début d'avant ce lot.
- **`_ckQui`** (cockpit.js, exposée) : l'équipe d'abord, dans son ordre ; l'auteur ensuite s'il n'y est pas déjà et s'il était dans les rangs. Les fixtures « Hugo et
  Léa » (auteur dans sa propre liste) gardent leur ordre. `_pilCk2Modele` la lit (repli : la même règle) ; les noms s'écrivent « A, B et C » (`_ckEt`, exposée).
- **`_ckTracJour`** (cockpit.js) : pour le jour, depuis `window.SESSIONS` (partagé) — les blocs finis (`trace` « fin » et ses minutes ; « coche », « retabli » ;
  « decoche » retire), la session ouverte ce jour-là (heure de l'identifiant), les traitements (session `type:'traitement'`, heure de fin). En ce moment : le dernier geste
  du jour ouvre un bloc (« debut », « reprise », « ajout », « reprend » avec parcelle) ou une pause (« interrompt », « dejeuner ») ; « fin », « finjour », « ferme »
  ferment ; une session « Terminé » n'est jamais en cours. Sans geste du jour : les `parcellesFaites` dont `t1` tombe ce jour-là. Le chrono de l'appareil n'est pas lu.
- **cockpit-vue.js** : « En ce moment » (les parcelles en cours de `S.equipes` — la lecture des pastilles —, puis le tracteur) au-dessus de « Aujourd'hui » ; les
  événements du tracteur gardent leur place sans tâche du plan (`EV_TRAC`) ; un « i » (`INFO.fil`) ; `majFil` redessine « En ce moment ». Aucun article devant
  l'activité — les noms sont libres (« Labour », « Semis ») : « Nico a fini Les Perrières · Griffage au tracteur, 45 min », « Nico a pris le tracteur », « Nico a traité ».

### 318d. Trouvé en route
1. **`ilYa(null)`** : une ligne sans heure aurait écrit « il y a 489 000 h ». L'ancien fil n'en avait pas (le journal donnait toujours une heure, au pire
   « maintenant ») ; le tracteur peut en avoir une sans heure — elle n'en affiche pas.
2. **Les initiales du fil n'étaient pas échappées** (`EQ[…].ini` posé tel quel dans `htmlEv`) : `esc` ajouté.
3. **`mv-harnais-auj1`** figeait la phrase du guide (« le fil En direct des validations ») : il lit la nouvelle.
4. **`mv-harnais-temps-vigne` H3 comptait les chemins qui posent « sans moi »** (`.quiHors=true` dans app.js) : cinq → sept (« Début » et « Changer »). Suivi.
5. **Le cliquet de taille** (`mv-harnais-typo`, +5 % par lot) : cockpit.js et cockpit-vue.js le passent. Question du découpage posée : la lecture du tracteur est un moteur
   pur du cockpit, comme `_ckPlanLire` ou `_ckSvMeteo` ; un module de plus pour quelques ko coûterait un import et une place dans l'ordre fixe d'app.js. Regravé.

### 318e. Les harnais
- **`mv-harnais-direct1.mjs`** (neuf, 51 assertions, 19 contre-épreuves) : `cockpit.js` entier exécuté (`_ckQui`, `_ckEt`, le fil de secours, `_ckTracJour` sur 16
  scénarios : bloc, pause, reprise, déjeuner, fin de journée, décoche, veille, repli `t1`, traitement, session terminée) ; les VRAIS `pQuickStart`, `marquerEnCours`,
  `_mvEqApplique`, `_mvDebutsSuivent` ; le VRAI `texteTrac` ; le modèle, la feuille, l'aide, le guide, les nouveautés.
- Rejoués : auj1 (mis à jour), auj3, forme1, ref1, ref2, pro1, equipes-jour, chant1, auj5, auj7, auj8, valid1, avc-arr, prep, arrach9, bulle1, info ; la chaîne
  complète rejouée commande par commande (373 ; le lanceur ne tient pas dans un appel ici) : 9 rouges au premier passage — 5 faute d'eslint et
  d'espree (installation coupée), le guide non régénéré (`npm run site`), H3 et le cliquet de taille ci-dessus —, tous verts ensuite.
- Non vérifié : un rendu dans un navigateur ; les données de Nico ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 318f. Ouvert
§28 « DIRECT-1 — CE QUI RESTE OUVERT ».

## 319. ★★ LABO-1 — LES RAPPORTS DU LABO : UNE FICHE PAR ENVOI, CHAQUE CHIFFRE À SA PLACE (12/10 — `src/cave.js` · `src/cuvier.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-labo.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` (poids regravé) · `scripts/harnais-claude-md.mjs` · **bump APP + SW**, base `aad1c16`)

### 319a. La demande
Nico, 12/10 (dicté) : le bulletin porte la date, le n° de l'échantillon, l'appellation, la couleur, le millésime, puis ce que le vigneron a demandé (TAV,
degré probable, glucose + fructose, volatile…). Une date d'envoi concerne plusieurs cuvées : une fiche, et l'appli range chaque chiffre ; ressaisir par
erreur la même date ou le même n° de rapport ne doit rien effacer — « c'est plutôt long et fastidieux ». Reformulé, « oui » ; maquette
`maquette-fiche-labo-v1` (artefact claude.ai, interactive, données fictives, trois scénarios) ; « Ok go » sur les trois recommandations : la date du
PRÉLÈVEMENT ; les deux portes actuelles ouvrent la fiche ; les neuf analyses.

### 319b. Le modèle — pas de collection neuve, chaque ligne dans sa maison (§10-11)
- **Chai** : une ligne = une opération `type:'analyse'` sur UNE cuvée, `op.labo=1`. Champs historiques gardés (`so2_libre`, `so2_total`, `av`, `malique`,
  `fml`) : journal, dernière analyse, courbe du SO₂, `_mlProjMalo`, Pilotage, registre lisent sans changer. Neufs : `tav`, `dp`, `gf`, `at`, `ph`, `lt`
  (les « < »), `rapport`, `ech`, `labo_nom`, `saisie`. `last_analyse` de la cuvée suit.
- **Cuvier** : une ligne = une entrée de `cuve.labo[]` ; son glucose vit sur un relevé de `mesures_fa` (GF-1), relié par `labo_id` / `mes_id` — le relevé
  de densité du même jour s'il n'a pas de glucose, sinon un relevé `labo_cree` (retiré avec la ligne s'il ne porte rien d'autre). Une seule vérité par chiffre.
- Un glucose saisi au Cuvier sans fiche est une ligne (`src:'mes'`) : la fiche du même jour le complète au lieu d'en écrire un second.
- Trois moteurs sans DOM : `_laboLignes` (la lecture unique), `_laboPlan` (la règle), `_laboAppliquer` (l'écriture).

### 319c. La règle « rien ne s'efface »
Un rapport se reconnaît à son n° (toutes dates, toutes cibles), sinon à sa cuvée dans la fiche du jour. Case vide : rien ne bouge (`garde`). Valeur
différente, autre date, autre cible, autre n° d'échantillon, autre malo : un CHOIX, et « Enregistrer » attend qu'il soit fait. Une ancienne analyse commune à
plusieurs cuvées reste en lecture (`lecture:true`) : ses chiffres sont partagés, une ligne neuve s'écrit à côté. Corriger = « Compléter » puis « Prendre » ;
« Retirer » (admin) passe par `openConfirmDel` et PDF-1. « Pas de FML » et la date de fin de malo d'une ancienne analyse survivent à la fusion.

### 319d. Les écrans, et ce qu'ils nourrissent
`#ovLabo` (index.html, rendu dans `#lbo-root`) : la liste par date, la fiche, « Avant d'enregistrer » (la destination de chaque chiffre). Portes : la zone du
Journal (`#mvc-journal-upload`), « Analyse » de Nouvelle opération (`_laboDepuisOp`), et `openOvCaveOp` sur une analyse `labo` — l'ancien formulaire
reconstruit `opData` et effacerait TAV, sucres et n°. Bloc « Au labo » : fiche cuvée (`_laboCuveeHtml`, sans le SO₂ libre qui a sa courbe, la cuve
d'origine comprise) et fiche cuve (`window._laboCuveHtml`, sans le glucose qui a son bloc) ; courbes `#mvg-lbo-` / `#mvg-lbc-` par `_mvGraphSuivre`.
`_vendDpLabo` (le plus ancien degré probable) passe en tête de `_vendDPot` ; `_vendDSecTxt` dit « au labo ». `_cavePdfRefs` voit `cuve.labo[]`.
Valeurs posées en JS après `innerHTML` (§24 n°5). Préfixe CSS `lbo-`, CSS injectée `#mv-labo-css`.

### 319e. Trouvé en route
1. ★★ **L'ancien formulaire, rouvert sur une analyse de fiche, l'aurait écrasée** (famille du défaut n°3 du §20h) : redirigé vers la fiche (contre-épreuve C7).
2. ★ **« SO₂ »** : U+2082 n'est pas dans le subset des polices (§303) — `SO<sub>2</sub>` dans le HTML, « SO2 » dans le texte pur et les étiquettes d'accès.
3. **Le poids de `cave.js`** : 566 → 635 ko (+12 %). Cliquet `mv-harnais-typo` regravé APRÈS vérification clé par clé : trois poids de modules (cave, cuvier,
   utils), aucune autre valeur. La question du découpage est posée au §28.
4. C24b : trois constantes posées dans des `onclick` sans `_escAttr` — échappées. Une graisse 400 (hors des trois pas) remontait le cliquet des jetons : 500.
5. La règle DIRECT-1 a servi : la chaîne meurt avec l'appel (300 s) — jouée par tranches au premier plan, codes retour notés un à un.

### 319f. Mesuré
`mv-harnais-labo` : **30 vertes** ; contre-épreuve **10/10**, chaque défaut par sa règle. Voisins verts : `mv-harnais-gf`, `-cuvier`, `-globaux`,
`-cave-auj`, `-jetons`, `-subset`, `-icones`, `-typo`. Preflight : 0 erreur. Chaîne (`mv-harnais-liste`, 375 commandes) jouée par tranches au premier plan, `TZ=Europe/Paris`, code retour noté pour chacune (règle DIRECT-1) : rouges trouvés et réparés en route — `mv-harnais-cuv8` et `-cuv13` (bacs à sable par liste : `_vendDpLabo` ajouté, garde `typeof window`), `mv-harnais-pres` (garde `typeof CAVE_VENDANGE` dans `_cavePdfRefs`), `build-guide --check` (vert après `node scripts/build-guide.mjs`, `public/guide.html` non livré) ; `mv-harnais-entree1` rouge sous 8 exécutants en parallèle, **vert seul** (31/31, contre-épreuve verte). Les deux gardes, posées en cours de chaîne, n'ajoutent qu'un `typeof` ; les harnais qu'elles touchent ont été rejoués après coup. **Non conclu ici** : `mv-harnais-recup --contre`, coupé deux fois à 300 s par le bac à sable (sa partie jouée : défauts détectés) — Planning, que ce lot ne touche pas ; à confirmer par la CI. Écrans : liste, fiche et vérification produits par l'appli
chargée dans Node, rendus sous Chromium à 430 px avec les polices du projet — aucun débordement mesuré, icônes absentes du rendu (sprite hors Node).
L'appli construite, non : `npm run build`, `test:smoke`, `test:e2e` chez Nico.

### 319g. Ouvert (résumé sur une ligne au §28, plafond du cœur)
1. **À regarder chez Nico, au téléphone et sur PC** : une fiche neuve (deux cuvées, une cuve), la même date ressaisie, un n° de rapport retapé à une autre
   date ; « Au labo » dans la fiche cuvée et dans la fiche cuve. Rendu ici : les trois écrans de la fenêtre, pas l'appli construite.
2. **Le poids de `cave.js`** (566 → 635 ko) : LABO-1 lit une douzaine d'internes du Chai (PDF-1, cuvées, `CAVE_*`) ; le sortir en `src/labo.js` demande
   une frontière comme CUV-DEC (§164) — un lot à part.
3. **L'ancien import « PDF seul »** (`_onCaveAnaFileChange`, `ovCaveAna`) n'a plus de porte : une ligne de fiche peut ne porter qu'un PDF. Gardé parce que
   `mv-harnais-cave-auj` l'exige — purge à décider, harnais compris.
4. **Pas repris** : les champs neufs (TAV, sucres, AT, pH) dans l'export du journal et le Suivi d'élevage imprimé ; un bouton vers la fiche depuis une cuve
   du Cuvier qui n'a encore aucun rapport.

## 320. ★★ ETAT-1 — LE PLAN DU COCKPIT LIT L'ÉTAT DE LA FICHE ; LE JOURNAL NE DIT PLUS QUE QUI (12/10 — `src/cockpit.js` (`_ckPlanStatut` neuf, `_ckPlanLire`, `_ckPlanEtats`, `_ckPlanDebuts`, `_ckPlanPeriode` neuf, `_ckPlanCorps`) · `src/pilotage.js` (`_pilCk2Modele`) · `src/cockpit-vue.js` (`S.presta`, `charger`, `phraseEtat`, `INFO.plan`) · `src/app.js` (`_mvDebutsSuivent`) · `src/utils.js` (APP, WHATS_NEW, MV_INFO `pil.plan`, MV_AIDE Pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-etat1.mjs` (neuf) · `scripts/mv-harnais-auj3.mjs` · `scripts/mv-harnais-forme1.mjs` · `scripts/mv-harnais-ref1.mjs` · `scripts/mv-harnais-auj8.mjs` · `scripts/mv-harnais-sect1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-280-329.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ETAT-1.json` · **APP 8.87 → 8.88, SW 9.66 → 9.67**, base `e937d3a`)

### 320a. D'où ça vient
Nico (12/10, deux captures de la refonte) : « explique pourquoi le pilotage me met une parcelle en entreplantation fait alors que ce n'est pas le cas et il n'y a
jamais eu de tache entreplantation sur cette parcelle pour le moment ». La loupe du plan disait « Entreplantation fait » ; la fiche de la même parcelle,
« Tarière · aucun trou · À faire ». Diagnostic donné (deux causes, vérifiées sur la vraie fonction), reformulé — le plan doit dire exactement ce que dit la fiche —,
« oui », puis « Continuer ».

### 320b. Les causes, lues dans le code
1. **Le plan avait sa propre lecture de l'état** (`_ckPlanLire`, AUJ-3 §262, reprise au §301) : une ligne « Validé » ou « Terminé » au journal = « faite », bornée par
   l'ouverture de la fenêtre de la tâche (`t.debut`, passé par `_pilCk2Modele`). La fiche, la liste des Parcelles et l'avancement des chantiers lisent `getTacheStatut`
   (le statut de la période) : deux définitions d'une même chose, deux écrans qui se contredisaient.
2. **Pas de fenêtre, pas de borne.** `_chargeSaisonData` ne garde que les tâches à `h>0` (noté par CHANT-1) : l'entreplantation sans trou compté pèse 0 h, les travaux
   sans barème aussi. `t.debut` valait `null`, et `if(debutIso && …)` laissait passer tout le journal, toutes saisons.
3. **Sourd aux annulations.** `annulerTache` (↩) écrit une ligne « Annulé » que la lecture ignorait ; `pQuickUndo` (« remis ») n'écrit rien et laisse la ligne
   « Validé ». Mesuré sur la vraie fonction, journaux fabriqués : validée au printemps sans borne → « faite » ; la même avec le début de l'hiver → « à faire » ; validée
   puis annulée → « faite ». Les données de Nico n'ont pas été lues : laquelle des deux causes a joué chez lui est à confirmer (son Journal, puces de la tâche et de la parcelle).

### 320c. Ce qui a été fait
- **`_ckPlanLire`** (cockpit.js) : l'état vient du statut (`o.statut`, sinon `_ckPlanStatut` → `window.getTacheStatut`, repli `p.taches` de la période active) — faite =
  « Validé », en cours = « En cours » ; arrachée = statut de la parcelle, d'abord ; en retard = à faire, fenêtre passée. L'équipe : la dernière ligne « En cours » de la
  période `[debutIso, o.fin]`, le même jour départagé par `ts_debut`, pour une parcelle en cours seulement. Plus de tri du journal : un seul passage.
- **La borne de l'équipe est la PÉRIODE** (`_pilSaison`, la période consultée, comme `getTacheStatut`), plus la fenêtre : une parcelle commencée avant l'ouverture de sa
  fenêtre était « à faire » sur le plan (sa ligne tombait sous la borne) ; elle est en cours, avec son équipe. `_pilCk2Modele` passe `perD` / `perO` ; le plan de
  secours (`_ckPlanCorps`) lit `_ckPlanPeriode`. `_ckPlanDebut` ne sert plus qu'à `_ckEnCours` (« commencée au calendrier »).
- **Arrachage en étapes** : `_arrSyncTache` écrit « En cours » dès une étape faite. La lecture du journal donnait « faite » dès la première étape validée (noté par
  ARRACH-9) ; le statut seul aurait donné « en cours » à une parcelle finie pour l'équipe, avec « Personne d'indiqué ». ★ Arbitré : fini pour l'équipe
  (`window._mvAuPrestataire`, la lecture d'ARRACH-9) = « faite » sur le plan, comme la ligne verte du chantier (CHANT-1) ; le modèle publie `presta`, la loupe dit
  « Arrachage fait pour l'équipe, la suite au prestataire ». Une étape sur trois = en cours.
- **`_mvDebutsSuivent`** (« Changer », DIRECT-1) passe son lecteur : le statut de la période ACTIVE (`p.taches`) — `getTacheStatut` suit la période consultée, et
  « Changer » complète les débuts de la période active.
- `_ckEnCours` (« En cours sur … » d'À savoir) suit sans changer d'appel : une parcelle validée puis annulée y redevient « pas encore faite ».

### 320d. Trouvé en route
1. **Cinq harnais figeaient l'ancienne règle** : auj3 (« faite depuis l'ouverture de la fenêtre », « faite par « Terminé » »), forme1 et ref1 (parcelles sans statut,
   l'état « lu au journal »), auj8 et sect1 (« la faite ne compte pas » : faite par le journal). Leurs parcelles portent désormais le statut de la fiche ; quatre
   contre-épreuves visaient des lignes disparues (`der`, `L.deb`) : réécrites sur la nouvelle lecture (une validation au journal qui repeint la parcelle, une équipe hors
   des parcelles en cours, une arrachée qui suit sa fiche). auj8 A10 garde des parcelles sans statut : « rien de fait » se dit désormais par la fiche, plus par un journal vide.
2. **CLAUDE.md était à 2 799 lignes** (plafond 2 800) : le récit de ROB-2 (terminé le 29/09, 49 lignes) descend dans `journal.md` ; ses deux consignes restent au §28.
3. Le harnais neuf prend un nom de parcelle neutre : aucun nom réel avec sa surface dans un dépôt public.
4. **Le dépôt a bougé pendant le lot.** LABO-1 (une autre conversation, poussé à 18 h 56) avait pris APP 8.87, SW 9.66 et le numéro §319 — ceux d'ETAT-1. Vu au
   contrôle de fraîcheur, juste avant le zip (`git fetch`, règle d'or n°1) : le zip construit sur `aad1c16` retiré des sorties, ETAT-1 rejoué sur `e937d3a` → §320,
   APP 8.88, SW 9.67. Les fichiers que LABO-1 ne touchait pas sont repris tels quels ; les dix partagés (`utils.js`, `index.html`, `sw.js`, la liste, le compteur, la
   base, la documentation) ont reçu les gestes du lot rejoués, puis la chaîne a été rejouée. ★ La consolidation de DIRECT-1 avait été rangée par LABO-1 en FIN de
   `journal.md`, pas en tête : laissée où elle est.

### 320e. Les harnais
- **`mv-harnais-etat1.mjs`** (neuf, 28 assertions, 16 contre-épreuves) : `cockpit.js` entier (état, équipe, bornes, départage, retard, arrachée, prestataire, lecteur en
  option), les VRAIS `getTacheStatut` / `_tachesFor` (période consultée), le VRAI `_mvDebutsSuivent`, le VRAI modèle (`_pilCk2Modele` : la tâche sans fenêtre, l'équipe
  d'avant la fenêtre, `presta`), la VRAIE phrase de la loupe, le VRAI plan de secours ; l'aide, le guide, la nouveauté.
- Mis à jour : auj3, forme1, ref1, auj8, sect1, contre-épreuves comprises. La chaîne complète (les 377 commandes de `mv-harnais-liste.mjs`, LABO-1 compris) jouée
  par tranches au premier plan sur `e937d3a` — un appel de l'outil coupe à 300 s et le bac à sable n'a qu'un cœur : 376 vertes ; `mv-harnais-recup.mjs --contre` coupée
  par la limite de 150 s par commande, sans un rouge (le Planning, que le lot ne touche pas).
- Non vérifié : un rendu dans un navigateur ; les données de Nico ; `npm run build`, `test:smoke`, `test:e2e` ; le déploiement.

### 320f. Ouvert
§28 « ETAT-1 — CE QUI RESTE OUVERT ».

## 321. ★ LABO-2 — LES RAPPORTS DU LABO ONT LEUR ONGLET (12/10 — `src/cave.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-labo.mjs` · `scripts/mv-harnais-cave-reglages.mjs` · `scripts/mv-harnais-etat1.mjs` (G4) · `scripts/harnais-claude-md.mjs` · **bump APP + SW**, base `b2f3ef4` — reconstruit sur ETAT-1 (§320), qui avait pris les mêmes numéros sur la même base)

### 321a. La demande
Nico, 12/10 (dicté), après la réponse « Le Chai › Journal › Rapports du labo » à « comment j'ajoute une fiche ? » : « il ne faut pas le cacher dans un
sous-onglet, il faut le mettre à côté de Cuvées, Bouteilles, Journal. C'est un truc important. » Reformulé (un onglet du Chai, la liste en page, la zone du
Journal retirée, « Analyse » de Nouvelle opération gardé), « oui ».

### 321b. Ce qui change
- `ONGLETS` du Chai : `['cuv','journal','bouteille','labo']`. Bouton `#mvc-tbtn-labo` (icône microscope) posé avant Journal dans index.html ; Bouteilles
  s'insère toujours juste après Cuvées (`_caveEnsureBtlTab`) : l'ordre est Cuvées · Bouteilles · Labo · Journal. Vue `#mvc-view-labo` / `#mvc-body-labo`.
- `renderCaveLabo()` écrit la liste (`_laboVueListe`, sans en-tête de fenêtre). « Saisir un rapport » (`#lbo-saisir`) et chaque date ouvrent la fiche dans
  `#ovLabo` par `openLabo`. La fenêtre ne porte plus que la fiche et la vérification (`_laboRender`) : « Labo » (le retour) la referme ; « Enregistrer » la
  referme et la vide ; la date touchée s'allume au prochain rendu de l'onglet (`_LBO.flash`). `_laboNouveau` / `_laboOuvrirDate` retirés (plus d'appelant).
- Le filtre millésime du Chai s'applique, comme aux trois autres onglets : une ligne du Chai par le millésime de sa cuvée, une ligne du Cuvier par l'année de
  sa cuve (`_laboMil`) ; `_caveSetMill` repeint l'onglet ; la page dit combien de rapports elle écarte (même arbitrage que le journal, CAVE-6).
- La zone « Rapports du labo » du Journal disparaît, avec sa bascule dans `setCaveJFilter` (sinon C11 : un `getElementById` sans élément). Le champ caché
  de l'ancien import « PDF seul » reste (§319g).
- L'annonce 8.87 visait `#mvc-journal-upload` : recalée sur `#lbo-saisir` — une cible qui n'existe plus ne pose sa pastille nulle part. L'annonce 8.88 dit
  le déménagement. MV_AIDE et le guide : « l'onglet Labo », et le filtre millésime « vaut pour les quatre ».

### 321c. Mesuré
`mv-harnais-labo` : **32 vertes** (L22 l'onglet, L26 la fenêtre vidée et la surbrillance, L31 index.html, L32 le filtre) ; contre-épreuve **12/12** (C11
l'onglet retiré de la liste, C12 la surbrillance perdue). `mv-harnais-cave-reglages` apprend la quatrième entrée de `ONGLETS` (règle et contre-épreuve
vertes). Preflight : 0 erreur, 9 avertissements (inchangé). Chaîne (`mv-harnais-liste`, 375 commandes) rejouée sur la base `b2f3ef4` par tranches au premier plan, `TZ=Europe/Paris`, code retour noté pour chacune (règle DIRECT-1). Un rouge réparé en route : **`mv-harnais-etat1` G4** exigeait le bloc 8.88 d'ETAT-1 « en tête » et `APP_VERSION === '8.88'` — vrai jusqu'au lot suivant seulement ; la règle garde ce qui compte (le bloc 8.88 présent, son niveau, son public, APP au moins 8.88), règle et contre-épreuve vertes. `mv-harnais-entree1` rouge sous 8 exécutants en parallèle, **vert seul** (contre-épreuve verte) ; `build-guide --check` vert après régénération locale (`public/guide.html` non livré). **Non conclu ici** : `mv-harnais-recup --contre`, coupé à 300 s par le bac à sable — Planning, que ce lot ne touche pas ; à confirmer par la CI.

### 321d. Ouvert
§28 « LABO-1 et LABO-2 — CE QUI RESTE OUVERT ».
