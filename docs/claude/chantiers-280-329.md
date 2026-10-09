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
