# Ma Vigne — Chantiers §230 à §279

> Ouvert le 03/10/2026 (§230), sur le modèle de `chantiers-180-229.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été remonté dans `CLAUDE.md`
> (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches de 50). Au-delà de la
> dernière tranche, créer le fichier suivant sur le même modèle.

---

## 230. ★★ RENOM-1 — RENOMMER UNE TÂCHE DU DOMAINE (03/10 — `src/reglages.js` · `index.html` (`#ovRenTache`) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `guide/12-reglages.html` · `public/guide.html` · `scripts/mv-harnais-renom.mjs` (neuf) · **APP 8.09 → 8.10, SW 8.84 → 8.85**, base `1d3a59b`, zip cumulatif)

### 230a. Ce qui change

« Go » de Nico (03/10) sur la décision ouverte au §228b. `_renameTache(old, new)` (reglages.js, sur le modèle de
`_renamePeriode`) migre, en un seul passage, TOUTES les clés d'une tâche : `TACHES[].nom` ; `p.taches[nom]` et
`p.tachesAll[période][nom]` pour chaque période ; `p.tachesExclues` ; `JOURNAL[].tache` ; `SAISONS[].taches` et
`.echeances[nom]` ; `TRAVAUX[nom]` ; `SAISON_PASSAGES` et `CONFIG.saison_passages` ; `CONFIG.tachesPrio.items[].t` ;
`CONFIG.objectifs_fin[nom]` ; `CONFIG.equipes_jour[jour][].tache`. `_renTacheErreur` refuse : une tâche du CATALOGUE (son
nom porte des règles de l'application — Arrachage, Relevage…), un nom vide, de plus de 40 caractères, déjà pris (casse
comprise, noms et libellés du catalogue compris), ou portant un signe dangereux pour une clé Firestore (`. / [ ] * \` ~ # $`…).
L'entrée est dans la fenêtre « Modifier » (le crayon) d'une tâche du domaine — pas une icône de plus sur la ligne : la ligne
est un gabarit, et l'aide `_mvIcon` n'est pas reconnue sûre par le preflight (C24c) ; le corps de la fenêtre, lui, se
construit par concaténation. Sauvegarde : `taches`, `parcelles`, `journal`, `saisons`, `travaux`, `config`. La fenêtre dit de
le faire quand les appareils de l'équipe sont synchronisés (un appareil hors ligne réécrirait l'ancien nom).

### 230b. Mesuré

`mv-harnais-renom.mjs` : **8 assertions** sur les vraies fonctions, un domaine factice qui porte « Dégraffage » dans chacun de
ses rangements ; rien d'autre ne bouge. Contre-épreuve **5/5**.

## 231. ★★ LOTS-1 — LA GARDE DES LOTS FRÈRES (03/10 — `scripts/mv-lots.mjs` (neuf) · `scripts/mv-lot-marque.mjs` (neuf) · `scripts/mv-harnais-lots.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` (ligne 7 de la clôture) · `lots/LOTS-1.json` (première marque), base `1d3a59b`, zip cumulatif)

### 231a. Le problème

§223 : deux zips bâtis sur le même commit, collés l'un après l'autre sans commit entre eux — le second a écrasé le premier.
`mv-base` ne voit rien : il garde la base, et les deux déclaraient la bonne. Ce qui manque, c'est la FRATRIE.

### 231b. La garde

- **La marque** : chaque lot pose `lots/<LOT>.json` (`node scripts/mv-lot-marque.mjs <LOT> --section §NNN [--inclut A,B]`, en
  DERNIER, juste avant le zip) — base, lots contenus (zip cumulatif), empreinte SHA-256 de chaque fichier livré (hors `lots/`).
  Un fichier par lot : un autre lot ne l'écrase jamais.
- **La vérification** : `scripts/mv-lots.mjs`, deuxième commande de `npm run check` (juste après `mv-base`), lit les marques
  PAS ENCORE COMMITÉES (`git status -- lots`). ① Plus d'une marque « de tête » (aucune n'inclut l'autre) : deux lots frères
  collés ensemble — refus, en les nommant. ② La marque de tête ne retrouve plus un de ses fichiers : écrasé (ou retouché à la
  main) — refus, en nommant les fichiers. Aucune marque en attente : rien à dire.
- **Limite dite** : un zip SANS marque (un fil qui ne connaît pas la règle) échappe à ① ; il n'échappe pas à ② s'il écrase
  un fichier d'un lot marqué collé avant lui. CLAUDE.md porte la règle à tous les fils (ligne 7 de la clôture).

### 231c. Mesuré

`mv-harnais-lots.mjs` : **6 assertions** sur le vrai `verdict()`, dont l'incident du 03/10 rejoué (refusé, fichier nommé) et
le zip cumulatif accepté. Contre-épreuve **4/4** (le module muté est réimporté par `pathToFileURL`, C26). La première marque
réelle est celle de ce zip : `lots/LOTS-1.json`, qui inclut KIT-3, KIT-4 et RENOM-1. ★ Le premier essai réel a servi : `git status` montrait le dossier neuf `lots/` d'un seul bloc (`?? lots/`) —
la garde concluait « aucun lot en attente ». Corrigé par `-uall` (fichier par fichier), puis marque reposée.
★ **Un faux pas de Claude, rattrapé avant la livraison** : pendant un contre-essai, un `git checkout -- src/styles.css` a remis la
feuille de style à HEAD — les blocs de KIT-3 et KIT-4 effacés de l'arbre de travail. La marque reposée juste après ne listait
donc plus `styles.css` (non modifié) : la garde ne peut pas voir un fichier perdu AVANT la pose. Rattrapé : la feuille a été
restaurée à l'octet près depuis le zip construit avant le faux pas (vérifié par `cmp`), la marque reposée (27 fichiers), et les
contre-essais refaits sans toucher à git — un fichier retouché, puis un lot frère : les deux refusés, en clair.
★ **Ne jamais restaurer un fichier par git pendant un lot en cours** : le copier, puis le remettre.

### 231d. Ouvert

① À l'œil chez Nico : renommer « Dégraffage » (Réglages › Tâches › crayon) une fois l'équipe synchronisée. ② Le tour à l'œil
de 3b / 3c. ③ Le premier `npm run check` après ce zip doit dire « lot LOTS-1 en attente de commit : ses N fichiers sont ceux
qu'il a livrés » — puis, après le commit, « aucun lot en attente ».

## 232. ★★ RENOM-3 — L'ADMIN RENOMME, LA RÈGLE S'IMPOSE À TOUS LES APPAREILS (03/10 — `src/reglages.js` · `src/firebase.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/12-reglages.html` · `public/guide.html` · `scripts/mv-harnais-renom.mjs` · `lots/RENOM-3.json` · **APP 8.10 → 8.11, SW 8.85 → 8.86**, base `9a6cf8e`)

### 232a. D'où ça vient

RENOM-1 (§230, poussé en 8.10) migrait toutes les clés, avec la consigne « une fois les appareils de l'équipe synchronisés ».
Nico : impossible à demander à une équipe ni à un client (« imagine des équipes de 30 »). Une première réponse — un simple
NOM AFFICHÉ, la clé intacte (« RENOM-2 ») — a été écartée par Nico avant d'être collée : il veut une VRAIE correction
d'orthographe, dans les données, mais imposée par l'admin : *« c'est l'admin qui prévaut ; les autres téléphones, quand ils
synchronisent, reprennent son orthographe, ils ne forcent pas la leur ; avec plusieurs admins, la modification enregistrée
en amont force la nouvelle orthographe partout »*. En cas de conflit d'état : « l'état le plus avancé gagne » (validé par Nico).

### 232b. Ce qui change

- **Le renommage devient une règle** : `saveRenTache` (admin seul — `isAdmin()`, refus écrit sinon) pousse
  `{de, vers, quand, par}` dans `CONFIG.renommages_taches`, applique `_renameTache`, enregistre tout.
- **Chaque appareil applique les règles** — `_mvAppliquerRenommages(cle)` : à chaque chargement (après `_migrateTaskNames`,
  firebase.js) et à CHAQUE donnée reçue (`_fbSubscribe`, clés `config`, `parcelles`, `journal`, `taches`, `saisons`,
  `travaux`). Dans l'ordre des dates : la plus récente l'emporte (A→B puis B→C donne C). Toute trace de l'ancien nom —
  écrite plus tard par un téléphone resté hors ligne comprise — est réécrite. Personne n'a besoin d'être synchronisé avant.
- **Conflit** : `_renFusion` — deux avancements pour la même tâche (ancien nom, nouveau nom) : l'état le plus avancé gagne
  (Validé > En cours > autre), clé par clé pour les niveaux et les passages. Une définition en double dans `TACHES` (recréée
  par un appareil en retard) disparaît.
- **Qui enregistre** : un appareil d'ADMIN enregistre la correction ; les autres corrigent en mémoire (leurs droits d'écriture
  ne couvrent pas `config` ni `taches`), et la renvoient avec leurs propres écritures. `_renameTache` rend le nombre de traces
  corrigées : 0 → rien n'est écrit, donc pas de boucle d'écritures entre appareils.

### 232c. Mesuré

`mv-harnais-renom.mjs` : **15 assertions** (les 8 de RENOM-1, plus : l'état le plus avancé gagne, l'ordre des dates, la définition
en double, l'admin enregistre, idempotence — 0 à la passe suivante —, un non-admin corrige sans écrire, `saveRenTache` réservé à
l'admin). Contre-épreuve **9/9**.

## 233. ★ KIT-5 — L'ACCUEIL SUR DEUX COLONNES, SANS TROUS (03/10 — `src/app.js` · `src/styles.css` · `guide/04-vigne.html` · `scripts/mv-harnais-kit2.mjs`, même zip que §232)

Nico : « les deux colonnes c'est parfait, mais il y a des trous entre chaque module ». La grille de KIT-2 (§227) donnait à
chaque RANGÉE la hauteur de son bloc le plus haut : un bloc court à côté d'un bloc long laissait un blanc. `applyHomeLayout`
range maintenant les blocs dans leur propre conteneur, `#home-cols`, juste après le bloc épinglé (l'en-tête, les tuiles, les
bandeaux et le bloc épinglé restent hors des colonnes) ; à partir de 1 024 px, `#home-cols` se range en COLONNES CSS équilibrées
(`column-count:2`, `break-inside:avoid` sur chaque bloc) — plus aucun trou. Conséquence dite à Nico : l'ordre se lit de haut
en bas dans la colonne de gauche, puis dans celle de droite. Le glisser-déposer de KIT-2 (le bloc qui contient le centre du
bloc tiré) marche tel quel : il cherche les blocs dans toute la page. `mv-harnais-kit2` adapté (11, contre-épreuve 7/7).

## 234. ★★ ANNEE-1 — PILOTAGE › L'ANNÉE, UN CADRE À LA FOIS (04/10 — `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW, MV_INFO, MV_AIDE) · `src/app.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-annee.mjs` (neuf) · `scripts/mv-harnais-audit-pil.mjs` · `scripts/mv-harnais-pil-coherence.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `lots/ANNEE-1.json` · **APP 8.11 → 8.12, SW 8.86 → 8.87**, base `70406bb`)

**La demande** (Nico, 04/10, capture de son écran) : la partie budget à l'année « mal faite » — elle ne met en avant que le
pic des vendanges (connu de tous, et passé en octobre), affiche plusieurs chiffres pour l'année comptable, et compare
l'exercice en euros à l'année vigne en heures de barème : « ça ne veut strictement rien dire ».
**Mesuré sur sa capture** : pour le seul exercice 2026-2027, 83 k€ engagés, 206 k€ à la clôture, 167 k€ « prévus » (barème ×
taux, vigne seule), 8 523 h de barème, des heures payées — deux « prévus » qui ne comptent pas la même chose. La case « année
vigne » (8 194 h) = Hiver 2025-26 + Printemps 2026 + Vendanges 2026 : le cycle FINI le 6/09, à côté d'un exercice ouvert le
1/08. La tuile Charge & ETP titrait sur le pic passé (25,3) dans un cadre rouge « il en manque ~0 », pendant que le graphe
montrait du renfort à trouver en hiver et au printemps, sans une phrase.
**Maquette** : canevas Design interactif (ordinateur + téléphone), validée « c'est parfait, on go de cette façon ».
**Fait** : un cadre à la fois en tête d'onglet (`_pilAnCadreHtml`, segmenté + flèches + pastille `pil.cadres`) ; la frise du
cadre et ses puces de campagnes (zoom `data-etpc`) ; « Le budget de l'année » = `_pexData` aux dates du cadre (trois chiffres,
barre, mois par mois, postes) ; « Le renfort à prévoir » = `_pilAnFenetres` (lignes) + graphe semaine par semaine, bouton
`data-diag="renfort"` ; les photos Travaux/Effectif/Budget et le fil d'Ariane lisent le cadre.
**Arbitrages** : ① l'année vigne = `_mvCampagneBornes` (Nico, « continuer » sur la question posée) et non « le lendemain des
vendanges » de la maquette — une troisième définition aurait contredit les Archives ; si le mois de campagne = celui de
l'exercice, l'écran le dit avec un bouton vers la roue crantée. ② Le renfort de L'année est une PHOTO (besoin face à
`_pilDispoSem`, semaine par semaine) ; Décider garde la simulation — Nico : les deux sont cohérents. ③ Le recul n'est pas
mémorisé (même motif que la bande d'Économie, §113) ; le cadre l'est. ④ Le trait du graphe = ce que l'équipe peut faire
(`_pilDispoSem`) et non `head` : l'ancien passait au-dessus du vert alors qu'il manquait du monde. ⑤ `an_cadres` quitte les
indicateurs : le cadre est une navigation. ⑥ Retirés, morts sans appelant : `_pilDeuxCadresHtml`, `_pilPanelEtp`,
`_pilFriseAnneeSvg`, `_pilAnneeVigneHtml`, `_pilAnnPartage`, `_pilAnnTaches`.
**Trouvé en route** : la racine du fil d'Ariane lisait `X.debut`/`X.fin` sur `_mvExercice()`, qui rend `d0`/`d1` — elle
affichait « Exercice » tout court depuis des semaines. Le graphe mensuel oubliait les fûts et les prestations (la somme des
mois ≠ le total) ; les amendements prévus n'avaient pas de mois → `byM[k].achP` posé dans `_pexData`.
**Pas vérifié** : le rendu à l'œil (ordinateur, téléphone) ; `npm run build`, `test:smoke`, `test:e2e`.
