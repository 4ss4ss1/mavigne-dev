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

## 235. ★★ PRIO-1 — LA TÂCHE DU MOMENT : UNE SEULE RÈGLE, D'APRÈS LES DATES DE TRAVAUX (04/10 — `src/app.js` · `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW, MV_INFO `pil.prio` + `pil.tournee`, MV_AIDE home + pilotage) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/05-saisons.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-prio.mjs` (neuf) · `scripts/mv-harnais-arrach7.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `lots/PRIO-1.json` · **APP 8.12 → 8.13, SW 8.87 → 8.88**, base `a1286f4`)

**La demande** (Nico, 04/10, deux captures) : « en tâche prioritaire, il y a toujours la taille » — la plus grosse en heures —, dans
le Pilotage comme dans la Vigne, « quoi que je mette en autre tâche prioritaire » ; or certaines tâches ne peuvent se faire qu'une
fois d'autres faites.
**Mesuré dans le code** : trois écrans, trois règles. `_pilCkPrio` lisait `d.prio` = la tâche active aux plus d'heures restantes
(« pôle long ») ; `_mvPartTache` = la plus travaillée sur 15 j par toute l'équipe, sinon la plus avancée, à égalité la première de
la liste ; seuls Parcelles (`_prioItems`) et Décider (`_dzPrios`) lisaient la priorité fixée. Les fenêtres par tâche
(`saison.echeances`) existaient mais ne servaient pas à ce choix. `savePriority` ne redessinait que Parcelles.
**Arbitrage** : j'avais proposé un réglage « se fait après… » par tâche (une chaîne de dépendances) et une chaîne par défaut.
**Écarté par Nico** : l'ordre est DÉJÀ dans les dates de travaux de la campagne, et chaque domaine a le sien — chez lui, les
réparations avant la taille, puis, en période de taille, taille-tirage-brûlage seulement. Quand deux tâches se chevauchent, c'est
l'admin qui décide. Donc ni chaîne en dur, ni réglage neuf : la règle lit ce que l'admin a déjà posé.
**Fait** : moteur pur `_mvPrioRegle(o)` (aucune lecture globale) + collecteur `_mvTacheDuMoment(opt)` (app.js, exposé), rangés à
côté de `_prioItems`. Priorité fixée (période active, tâche pas finie) → `admin` ; une seule tâche pas finie dans ses dates →
`dates` ; plusieurs → `choix`, l'appli ne tranche pas ; aucune → `prochaine` ; une tâche pas finie dont la fin est passée reste en
course, `retard`. Lecteurs : la carte d'Aujourd'hui (`_pilCkPrio`, `id="pil-prio"`, pastille `pil.prio`, bouton
`data-diag="priorite"` → `openPriorityEdit`, admin seul) ; Ma part du chantier (`_mvPartTache(out)` : la priorité de son équipe ;
en `choix`, la tâche où LA PERSONNE a le plus travaillé sur 15 j, plus toute l'équipe ; une ligne dit pourquoi) ; Décider
(`_dzTachesDefaut` : en `choix`, toutes cochées, avec sa note). Le calcul `prio` de `_pilData` est retiré. `_prioRedessine` après
`savePriority`/`clearPriority` : l'Accueil et le Pilotage suivent sans rechargement. Libellé de l'éditeur de période : « Dates de
travaux estimées (elles donnent l'ordre des tâches et la tâche du moment) ». WHATS_NEW 8.13 : un « À vérifier » (niveau 2) pour
l'admin — les dates de chaque tâche —, Ma part du chantier au Journal seul.
**Harnais** `scripts/mv-harnais-prio.mjs` : 36 assertions sur les vraies fonctions branchées entre elles (moteur, collecteur, Ma
part, carte, Décider, `_pilGo`), 14 contre-épreuves qui rougissent toutes. `mv-harnais-arrach7` suivi : le saut de l'arrachage fini
pour l'équipe vit maintenant dans le collecteur, sa contre-épreuve vise la nouvelle ligne.
**Trouvé en route** : le crayon de la pastille priorité de l'Accueil est caché dans les deux branches (`renderHome`) ; l'anneau doré
(`_mvTachePrio`) suit la seule priorité fixée. Laissés tels quels (§28). Pour tenir le plafond du cœur, « La journée du 9 août »
(historique du §28) est descendue dans `docs/claude/journal.md`.
**Pas vérifié** : le rendu à l'œil (carte et bloc, ordinateur et téléphone) ; les dates de travaux réelles du domaine de référence ;
`npm run build`, `test:smoke`, `test:e2e`.

## 236. ★★ ALIGN-1 — LA DÉCISION DU JOUR : QUATRE TUILES BÂTIES PAREIL (04/10 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE pilotage, MV_INFO `pil.prio`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-align.mjs` (neuf) · `scripts/mv-harnais-protection.mjs` · `scripts/mv-harnais-tension.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `lots/ALIGN-1.json` · **APP 8.13 → 8.14, SW 8.88 → 8.89**, base `3b9c695`)

**La demande** (Nico, 04/10, deux captures) : l'Accueil et le Pilotage « mal alignés » — des encarts de même taille, en
regardant ce que font les autres logiciels, « que ce soit parfait ».
**Recherche** : un système de design de tableaux de bord pose l'égalité de hauteur dans une rangée comme obligatoire et borne
les listes intégrées à 5 lignes + « voir plus » ; Grafana donne à chaque panneau une largeur (24 colonnes) ET une hauteur ;
Sigma conseille de construire par rangées d'éléments de même taille. Lecture retenue : la carte a sa taille, le contenu s'y
adapte ; jamais l'inverse.
**Maquette** (canevas Design « Ma Vigne — alignement Accueil et Pilotage » : Accueil ordinateur, Pilotage ordinateur,
Pilotage téléphone) : **validée « c'est parfait »**, avec ses cinq points — météo des secteurs en une carte ; la liste des
parcelles à nu sortie de « Traiter ? » ; bouton de priorité toujours là pour l'admin ; la carte de saison gardée ; deux tailles
de bloc à l'Accueil, un bloc masqué laisse son voisin prendre toute la largeur.
**Fait (lot 1, Pilotage)** : les quatre tuiles (`_pilCkPres`, `_pilCkTraiter`, `_pilCkPrio`, `_pilTuileTension`, neuve) portent
les mêmes étages `pil-tz-big` → `pil-tz-rai` (2 lignes au plus) → `pil-tz-ban` → `pil-tz-pied` (collé en bas). Présents : la
bande nomme les absents, sinon les présents en initiales ; pied → Planning. Traiter : la bande montre la fenêtre sur 24 h, le
pied porte le dépliant des jours. Priorité : en `choix`, les tâches en étiquettes ; « Fixer / Choisir / Changer la priorité »
pour l'admin dans tous les cas. Tension : verdict + la personne la plus chargée. Rangée `.pil-dec2` : `_pilProtCarte`
(5 parcelles, `_PIL_PROT_TOUT` + cible `prot_tout` de `_pilGo`) et `_pilCardTension` devenue le détail (« Les 14 derniers
jours »). Une carte de détail seule prend toute la largeur (`auto-fit`). Téléphone : tuiles par deux.
**Harnais** `scripts/mv-harnais-align.mjs` : 13 vertes (étages dans l'ordre, rangées, CSS qui aligne, tuile tension exécutée),
9 contre-épreuves qui rougissent. Suivis : `mv-harnais-protection` (la carte de la rangée appelle la protection) et
`mv-harnais-tension` (la tuile en haut, le détail dessous) — un harnais qui déménage se suit.
**Pas fait** : l'Accueil en rangées (ALIGN-2, §28). **Pas vérifié** : le rendu à l'œil ; `npm run build`, `test:smoke`,
`test:e2e`. `mv-harnais-audit-pil` (hors liste) : 2 rouges déjà présents sur la base, non touchés.

## 237. ★★ ALIGN-2 — L'ACCUEIL EN RANGÉES (04/10 — `src/app.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE home) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-align2.mjs` (neuf) · `scripts/mv-harnais-kit2.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `lots/ALIGN-2.json` · **APP 8.14 → 8.15, SW 8.89 → 8.90**, base `3b9c695`, zip cumulatif avec ALIGN-1 non poussé)

**La demande** : la deuxième moitié de la maquette validée (§236) — l'Accueil sur ordinateur. Historique : KIT-2 (§227) posait une
grille, un trou sous chaque bloc court ; KIT-5 (§233) des colonnes CSS, plus de trou mais plus rien d'aligné (Nico, 04/10).
**Fait** : `#home-cols` redevient une grille de deux colonnes, en RANGÉES PLEINES (`align-items:stretch`) ; chaque bloc est une
colonne flex, sa carte remplit le bloc (Ma part, saison, tâches, secteurs, 5 jours, tracteur), son pied collé en bas
(`.hmp-rest`, `.hv2-card-pied`, `.cm-wx-pied`). `_homeRangees()` (après `applyHomeLayout`, le glisser-déposer, le rendu des blocs
et la météo par secteur) pose `home-w-seul` sur un bloc resté seul dans sa rangée — voisin masqué (hors mode édition), vide
(`style.display='none'`) ou pleine largeur — qui prend alors la rangée entière. `lay.large` (conservé et purgé par
`getHomeLayout`) + bouton « Pleine largeur » / « Demi-largeur » (`homeWidgetLarge`, ordinateur, mode édition ; cliquable : exclu du
`pointer-events:none`). La météo par secteur quitte « meteo5 » pour son bloc « meteosect » (migration : il prend la place de
« meteo5 » dans un ordre déjà réglé, et son état masqué) et devient UNE carte, une ligne par secteur ; sous deux communes, le bloc
s'efface et l'entrée « Communes » (`#home-cm-bulk`) revient sous la météo 5 jours. Titre « Avancement de la saison » sur ordinateur
seulement (aligne la carte de saison sur ses voisines). Ordre par défaut = les rangées de la maquette.
**Arbitrages** : le symbole ↔ prévu sur le bouton comptait comme un emoji (`mv-harnais-icones`) → le bouton dit « Pleine
largeur » en toutes lettres ; sa bordure passe sur `--gris-clair` (filet retenu, `mv-harnais-jetons`).
**Harnais** `scripts/mv-harnais-align2.mjs` : 16 vertes (`_homeRangees` exécuté sur un faux DOM, migration de `getHomeLayout`
exécutée, CSS, météo par secteur, index.html, boutons du mode édition), 10 contre-épreuves qui rougissent. `mv-harnais-kit2` suivi
(grille en rangées au lieu des colonnes).
**Pas vérifié** : le rendu à l'œil ; le glisser-déposer à la souris dans la grille ; `npm run build`, `test:smoke`, `test:e2e`.

## 238. ★ ALIGN-3 — CORRECTIF : UN BLOC MASQUÉ RESTE MASQUÉ SUR L'ACCUEIL (04/10 — `src/styles.css` · `src/app.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE home) · `index.html` · `public/sw.js` · `scripts/mv-harnais-align2.mjs` · `scripts/harnais-claude-md.mjs` · `lots/ALIGN-3.json` · **APP 8.15 → 8.16, SW 8.90 → 8.91**, base `657cb29`)

**Le signalement** (Nico, 04/10, ALIGN-2 en ligne) : sur l'Accueil, « tu as beau les cacher, ils réapparaissent une fois que c'est
validé » ; l'ordre des encarts semble non respecté ; « on ne voit pas l'icône de l'œil ».
**Cause, mesurée dans le CSS** : ALIGN-2 a posé `#home-cols > .home-w{display:flex;…}` dans le bloc ordinateur. Spécificité (1,1,0) :
elle battait `.home-w.home-w-off{display:none}` (0,2,0). Sur ordinateur, un bloc masqué restait donc affiché hors personnalisation ;
`_homeRangees`, lui, l'excluait des rangées : les blocs « seuls » s'étiraient au mauvais endroit — d'où l'ordre qui paraissait faux.
Au téléphone, rien (la règle n'y existe pas) : le défaut ne se voyait que sur ordinateur, là où aucun harnais ne regarde.
**L'œil** : le bouton affichait un œil sur un bloc visible et le panneau « interdit » sur un bloc masqué ; avec tous les blocs
masqués revenus, Nico ne voyait plus d'œil. Il reste désormais un œil, barré (`.home-w-eye.off::after`) quand le bloc est masqué ;
`title` et `aria-label` disent l'action (« Masquer ce bloc » / « Afficher ce bloc ») ; les boutons d'édition passent au-dessus
du contenu (`z-index:5`).
**Fait** : `#home-cols > .home-w.home-w-off{display:none}` et, en édition, `display:flex;opacity:0.45` — au niveau d'ID.
★ **LEÇON** : une règle de mise en page posée sur un ID (`#home-cols > …{display:…}`) écrase les états cachés de ses enfants posés
en classes ; il faut les redire au même niveau. Aucun harnais ne le voyait : `mv-harnais-align2` le garde maintenant (2 assertions,
2 contre-épreuves de plus).
**Pas vérifié** : le rendu à l'œil sur ordinateur ; `npm run build`, `test:smoke`, `test:e2e`.

## 239. ★★ GESTES-1 — DÉGUSTER, TRAITER, FILTRER : TROIS GESTES DU MAÎTRE DE CHAIS (04/10 — `index.html` · `src/cave.js` · `src/cuvier.js` · `src/reserve.js` · `src/utils.js` · `guide/08-cave.html` · `public/sw.js` · `scripts/mv-harnais-gestes.mjs` (neuf) · APP 8.16 → 8.17 · SW 8.91 → 8.92 · base `5a0d37e`, rejoué sur ALIGN-3)

**La demande** (Nico, 04/10) : en maître de chais, inventorier les manipulations de l'élevage, regarder les logiciels de référence,
proposer ce qui manque côté cave « sans que ce soit trop complexe ». **Hors périmètre, tranché** : rien de réglementaire (DRM, registre
d'entrées-sorties) → §28, entrée 43. Benchmark : vintrace et InnoVint tournent autour des ordres de travaux (et leurs utilisateurs se
plaignent de devoir les écrire) ; Process2Wine, agreo, Isagri côté français. Onze propositions classées ; lot 1 = dégustation, traitement,
filtration. Maquette `maquette-cave-gestes-v1.html` (page HTML sur `styles.css` et le vrai formulaire, règle §225b) → « go avec les recos »,
plus : **pouvoir désigner un fût** quand une anomalie s'y montre ; de base, la dégustation porte sur la cuvée.

### 239a. Les arbitrages

- **Le fût désigné n'est pas nominatif** (§20e reste vrai) : la dégustation garde le LOT de la cuvée (`annee`, `four`, `ref`, `l`) et un
  **repère** libre (numéro à la craie, emplacement). La suite « Retirer le fût » n'apparaît qu'en mode fût.
- **Une dégustation = une cuvée** : `toggleCopCuvee` passe en sélection simple, « Toutes » se masque, `saveCaveOp` refuse sinon.
  « Enregistrer et goûter la suivante » rouvre la feuille sur la cuvée suivante du millésime (`_copDgOuvrirSuivante`), s'arrête à la dernière.
- **Une règle, une source** : l'unité de dose (kg → g/hL, L → mL/hL), l'unité de quantité, le calcul et son affichage viennent du Cuvier
  (`_vendIntrUnite`, `_vendIntrUniteQ`, `_vendIntrQte`, `_vendIntrQteTxt`, `_vendIntrProds`, ajoutés à SA frontière). Aucune copie.
- **La sortie de stock** : `_consoCuvier` (reserve.js) compte aussi les traitements du Chai (`op.data.prod_id`, `op.data.qte`) ; il ne
  rendait plus RIEN sans données de Cuvier (retour anticipé) — corrigé dans le même geste. Libellé : « adjonctions du Cuvier et traitements du Chai ».
- **Le registre** : `traitement` → famille par NATURE (`_rmTraitT` : acidité → famille neuve « Corrections d'acidité », le reste →
  Adjonctions) ; `filtration` → pratiques de cave ; `degustation` → hors registre, comptée en pied (`RM_HORS`).
- **La perte de filtration est notée, elle ne touche pas au volume** de la cuvée : les volumes sont la zone sensible (VOL-1, CREUX-1).
- **La suite d'une dégustation est notée et affichée, pas encore rappelée** : le rappel dans « Ce qui vient » est GESTES-2 (lot réduit,
  §27a : on réduit plutôt que de livrer en deux morceaux une aide fausse).

### 239b. Trouvé en route

- **Entrée 10 du backlog, retrouvée** : la pastille « Village 2026· 12 » vivait à `_copRenderCuvChips`, le point médian écrit `\u00b7` —
  c'est pourquoi le grep du 11/08 sur « · » ne la voyait pas (§25, règle 21 : varier le motif).
- **L'aperçu du soufre comptait 82 fûts écrits en dur** tant qu'aucune cuvée n'était cochée (`_copGetNbFuts()||82`) ; l'enregistrement,
  lui, comptait juste. L'aperçu attend désormais une cuvée.
- **Le harnais neuf a d'abord rougi sur lui-même** : il comptait les handlers du seul `index.html`, alors que six boutons sont
  fabriqués par `cave.js`. Assertion corrigée (deux sources), pas le code.
- **Deux cliquets ont mordu** : cinq `font-weight:400` (hors des trois pas 500/600/700) et cinq `font-size` en px dans les mentions
  neuves → `500` et `var(--pt-micro,11px)`.
- **Rejoué sur une base neuve** : construit sur `657cb29`, le lot a trouvé ALIGN-3 poussé entre-temps (§238, APP 8.16, SW 8.91). Mes
  fichiers que l'amont n'avait pas touchés repris tels quels (vérifié fichier par fichier) ; les autres rejoués sur `5a0d37e` ; section,
  version et SW décalés (§239, 8.17, 8.92). Un numéro déjà servi n'est jamais réutilisé (règle d'or n°1).

## 240. ★★ DEMO-4 — LA DÉMO DU SITE : UN DOMAINE, QUATRE TÉLÉPHONES (04/10 — `public/demo.html` (neuf) · `public/demo/` (61 captures, neuves) · `public/logiciel-vigne.html` · `scripts/mv-harnais-demo.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **aucun bump** : page du site, hors shell · base `8645b31`)

**La demande** (Nico, 03/10) : refaire la démo du site « comme Apple ou Google », que le prospect se dise « c'est cette appli qu'il me
faut ». Maquette publiée, cinq tours de retouches le 04/10 : ouverture « De la parcelle au registre, sans rien ressaisir » (aucune accroche
de saison) ; une première page au code des grands (le produit en vedette, plus de dessin) ; le chef prépare AVANT que Jean ne valide ; un
parcours cave ne montre pas la vigne sans faire le lien ; puis le principe retenu — **un parcours par téléphone** (gérant, ouvrier,
tractoriste, maître de chai), en insistant sur ce que chacun voit. Cave poussée (GESTES-1, §239), puis « go ».

### 240a. Ce qui change

- **`/demo.html`, page neuve du site** : ouverture (le produit en vedette), « Quel téléphone prenez-vous en main ? » (quatre tuiles, deux
  curseurs : surface et permanents), le parcours du rôle choisi, « Un domaine, quatre téléphones » (les quatre barres du bas côte à côte,
  soulignées ; toucher un téléphone change de visite), sept questions à poser à n'importe quel logiciel, la fin en heures sur SON domaine.
  Menu « Chapitres » (26 écrans). Clair et sombre, téléphone et ordinateur, mouvement réduit respecté.
- **Les parcours** : gérant (il prépare, le bureau sait, échéances, renfort, coût — 8 scènes) ; ouvrier (le chef prépare, ce que voit Jean,
  il valide, le bureau sait — 7) ; tractoriste (« Tu prends le tracteur aujourd'hui ? », son chantier, le registre — 6) ; maître de chai
  (ce qui presse, tournée, courbe, dégustation de GESTES-1, le lien aux rangs — 8).
- **Les écrans sont des CAPTURES de la vraie appli** (APP 8.17, domaine `?demo=visite` + `public/mavigne_demo_data.json`, Chromium du bac à
  sable), `public/demo/*.webp`. Chaque rôle est capturé avec SES droits : rôles réels et `mods` d'un vrai membre (`_isDemo` levé, car
  `_mvModOff` ne restreint jamais la démo). Réglages retenus : ouvrier sans Cave ni Tracteur ; tractoriste sans Cave ; maître de chai sans
  Vigne, Tracteur ni Phyto. Barres relevées : gérant Pilotage · Vigne · Tracteur · Phyto · Plus ; ouvrier Vigne · Phyto · Réserve ·
  Planning · Réglages ; tractoriste qui prend le tracteur Tracteur · Phyto · Vigne · Réserve · Plus ; maître de chai Cave · Réserve ·
  Planning · Réglages.
- **Le site y mène** : les cinq « Voir la démo » de `logiciel-vigne.html` → `/demo.html` (« 3 minutes »). Le tour `?demo=visite` reste la
  porte « Ouvrir la vraie appli, librement » en fin de démo.

### 240b. Les arbitrages

- **Captures, pas l'appli dans un cadre** : la maquette annonçait « à l'intégration, ce sera l'application elle-même ». Écarté pour ce
  lot : deux instances de l'appli en iframes (téléphone + ordinateur), le bundle entier avant la première image, l'orchestration des rôles
  par messages — lourd sur le téléphone d'un prospect. Les captures sont les vrais écrans, au pixel ; l'appli vivante reste à un geste.
- **Zéro montant** (décision du 15/08) : la fin compte en heures. Le barème de la démo (127 h à 12 ha et 6 permanents) devient continu :
  validations et tracteur suivent la surface ; pointage (4 min + 1 par permanent) et fins de mois (30 min + 10 par permanent) suivent
  l'équipe. Règles proposées par Claude, acceptées par le « go » ; le harnais tient les 127 h du site.
- **Aucun concurrent nommé** : Process2Wine, agreo et Isagri couvrent aussi vigne, chai et équipe (vérifié le 03/10). Pas de « le seul
  tout-en-un » : des questions que le prospect pose lui-même.
- **`noindex,follow`** : page d'expérience, presque sans texte — `logiciel-vigne` reste la porte d'entrée de Google. Hors sitemap par
  construction (`mv-sitemap` ne réclame que les pages indexables).

### 240c. Mesuré

`mv-harnais-demo.mjs` : **11 assertions** — les 61 images de la table présentes, les 33 écrans cités tous adossés à une image, 29 étapes
sans écran inconnu, 127 h joué sur la VRAIE `lignes()` extraite de la page, zéro montant, polices auto-hébergées, `noindex`, les deux
portes (essai, appli libre), le site qui y mène. Contre-épreuve **10/10**. Les quatre parcours cliqués de bout en bout dans Chromium sur la
page servie (téléphone sombre et clair, ordinateur) : zéro erreur, aucune ressource en échec.

### 240d. Trouvé en route

- **Un caviste à qui l'on ne masque que la Vigne** est arrivé sur le Phyto, toast « Module masqué pour votre profil » (accueil forcé dans le
  bac à sable, pas une vraie connexion) : Phyto passe avant Cave dans sa barre. À vérifier chez Nico.
- **« Tap pour enregistrer l'avancement »** du Tracteur n'a rien ouvert dans le bac à sable : non tranché, peut-être le bac à sable.

### 240e. Ouvert

① **Les captures vieillissent** : à refaire quand un écran montré change ; les scripts de capture du bac à sable ne sont pas versionnés (à
faire : `scripts/mv-demo-captures.mjs`). ② Quelques chapitres libres datent d'APP 8.07 (météo, planning, fiche de Jean, documents, apports,
négoce, réserve, registre phyto, et les deux écrans d'ordinateur du bureau — chiffres identiques). ③ La version « appli vivante dans le
cadre », si Nico la veut un jour. ④ À l'œil chez Nico, sur un vrai iPhone. ⑤ Les deux trouvailles de 240d.

---

## 241. ★★ AUDIT-PERF — VITESSE, DONNÉES, ERGONOMIE TERRAIN : L'AUDIT MESURÉ (04/10 — `audit-perf-ux.md` (neuf, racine) · `CLAUDE.md` · `docs/claude/chantiers-230-279.md` · `docs/claude/journal.md` · `docs/claude/INDEX.md` · `scripts/harnais-claude-md.mjs` · `lots/AUDIT-PERF.json` · **aucun bump** : documentation seule · base `c62f429`)

### 241a. La demande

Nico (04/10) : « auditer et optimiser » Ma Vigne pour atteindre le niveau de Linear, Notion et Figma — vitesse perçue,
données robustes et souples, ergonomie terrain avec un minimum de gestes — avec un plan priorisé et des exemples de code.
Le message citait Node.js, Prisma et JWT : ce n'est pas la stack du dépôt. Reformulé, puis « go » pour un audit sur la
VRAIE stack (Firestore, Cloud Functions, claims). Méthode NAV-0 : un document à la racine, rien d'intégré, à valider lot
par lot.

### 241b. Mesuré — et comment

Chromium du bac à sable (§192b) sur le **build de production**, écran 390 × 844, processeur ralenti ×4 pour le « téléphone
moyen » ; données injectées par `applyFbData` puis connexion simulée (la méthode d'`e2e-local`) ; Google et Firebase coupés,
ou laissés sans réponse, au niveau de la page ; médianes de 5 essais (3 pour le démarrage). Le tableau complet est au §1
de l'audit. L'essentiel :

- **Prouvé** : « Valider » de la feuille de validation (`confirmValidation`, et `saveJournalEntry` au statut « Validé »)
  attend `fetchMeteoMoyenne` — Open-Meteo, sans limite de temps — **avant** d'écrire et de fermer. Météo sans réponse :
  feuille ouverte et rien d'écrit à 30 s. Contre-épreuve, réseau coupé net : tout passe en moins d'une seconde.
  `pQuickValidate` (le bouton de la carte) a déjà le bon patron : écrire d'abord, la météo ensuite.
- **Prouvé** : hors réseau, à froid, les profils s'affichent mais la connexion échoue sur `appCheck/fetch-network-error`,
  et `confirmLogin` affiche « Mot de passe incorrect. ». Contre-épreuve, connexion simulée réussie : l'appli entre.
- **Ouverture** : voile imposé de 3,42 s (2,2 + 0,9 + 0,32 s) ; en ligne avec un réseau sans réponse, zone des profils
  vide jusqu'à 18,6 s — les bornes de `_fbLoad` (5 + 8 + 6 s) passent avant la liste gardée sur le téléphone ; le mot de
  passe à chaque ouverture, session valable ou non.
- **Rendu** : `renderHome` coûte 115 à 125 ms au téléphone moyen, quelle que soit la taille ; une validation reçue sur
  l'Accueil fige l'écran 255 ms (journal de 1 000) puis 613 ms (15 000), dont la copie complète de `_mvBaseNoter`,
  4 → 105 ms ; le Journal met 346 à 588 ms à s'afficher.
- **Données** : une entrée de journal ≈ 158 octets (règle de `mv-taille-docs.mjs`) → limite de 1 Mio vers 6 600 entrées ;
  le journal n'est jamais allégé et porte une entrée météo par jour et par commune ; liens par noms partout.
- **Paquet** : 3 902 kB en un fichier (gzip 1 163, brotli ≈ 870) ; `WHATS_NEW` = 339 Ko réduit (300 versions) ;
  `admin-gt.js` = 6,7 % du JS livré à chaque client.
- **Ergonomie** : 2 031 textes sous 12 px dont 408 sous 10 px (deux tiers par trois jetons : relever trois lignes en touche
  1 396) ; `.val-toggle` à 26 px de haut ; 57 transitions sur 245 d'un quart de seconde ou plus ; 17 points de rupture.

### 241c. Trouvé en route

- **Deux lignes fausses au §4 de CLAUDE.md**, corrigées : la sortie de build est un **module ES** (`<script
  type="module">` dans `dist/index.html`), pas un IIFE ; et « `_fbLoadAfterAuth` enchaîne ~40 `getDoc` séquentiels » est
  faux depuis PERF-1. Un audit qui lit le §4 avant le code le croit : c'est la règle d'or n° 3, appliquée au socle.
- **Trois pièges d'essai, à connaître pour toute mesure navigateur** :
  ① le service worker fait l'appel météo **à la place** de la page — l'interception au niveau de la page ne le voit pas,
  le bac à sable le coupe net, et l'essai « réseau sans réponse » passait au vert pour une mauvaise raison ; il faut
  `setBypassServiceWorker`. ② Un script reCAPTCHA sans réponse **retient l'événement `load`** : `_mvDemarrer` part alors sur
  son filet de 2,5 s, et un essai qui attend `load` expire. ③ Le voile couvre les tuiles pendant ses 3,4 s : un clic aux
  coordonnées tombe sur le logo — attendre son retrait avant tout geste.
- **`pQuickValidate` complète l'objet d'origine** une fois la météo arrivée ; une synchronisation a pu remplacer le tableau
  du journal entre-temps (lu dans le code, à vérifier) — VALID-1 le fait passer par une recherche par id.

### 241d. Arbitrages

- **Rester sur Firestore** (pas de Prisma ni de base SQL) : les défauts tiennent à la forme des données (gros tableaux,
  liens par nom), pas au moteur ; Firestore donne la copie hors ligne, l'écoute en temps réel, des règles prouvées et un
  coût proche de zéro. Prisma n'a pas de connecteur Firestore.
- **Aucun code dans ce lot**, même pour les deux petits défauts : VALID-1 et LOGIN-1 changent ce que voit l'utilisateur, ils
  partent avec leur aide, leur `WHATS_NEW` et leur bump, sur « go » de Nico.
- **Scripts de mesure non versionnés**, comme les captures de DEMO-4 : un lot à part s'il le faut
  (`mv-mesure-perf.mjs`, hors de `npm run check`).
- **ENTREE-1** : recommandation de l'option C (« Rester connecté sur ce téléphone », par appareil), parce que les tuiles
  laissent penser que certains téléphones sont partagés — décision de Nico.

### 241e. Ouvert

→ CLAUDE.md §28 (bloc AUDIT-PERF) ; ce qui n'a pas été mesuré est listé au §6 de l'audit (vrai téléphone, vrai réseau,
vraies tailles de documents, service worker dans la boucle de l'essai météo, Lighthouse).

---

## 242. ★★ VALID-1 + LOGIN-1 — « VALIDER » N'ATTEND PLUS LA MÉTÉO ; SANS RÉSEAU, LA CONNEXION DIT LA VÉRITÉ (04/10 — `src/app.js` · `public/sw.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `guide/01-demarrer.html` · `scripts/mv-harnais-valid1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `docs/claude/modules.md` · `lots/VALID-1.json` · **APP 8.17 → 8.18, SW 8.92 → 8.93**, base `57a48b3`)

### 242a. Les deux défauts — prouvés avant le lot (§241)

① « Valider » de la feuille de validation (`confirmValidation`) et du formulaire du journal (`saveJournalEntry`, statut
« Validé ») attendait `fetchMeteoMoyenne` — un appel à Open-Meteo **sans aucune borne** — avant d'écrire l'entrée et de
fermer. Météo sans réponse : feuille ouverte, rien d'écrit à 30 s. Le pire cas n'était pas « pas de réseau » (l'appel échoue
vite) mais **le réseau qui traîne**. ② Hors réseau, à froid, la connexion échoue d'abord sur App Check
(`appCheck/fetch-network-error`) : ce code n'avait pas de branche dans `confirmLogin` et tombait dans « Mot de passe
incorrect. ».

### 242b. Ce qui change

- **`fetchMeteoMoyenne`** : bornée à `_MV_METEO_DELAI` (6 s) par un `AbortController` ; au-delà, elle rend `null` — l'entrée
  vit sans météo, comme quand Open-Meteo est injoignable.
- **`_mvMeteoApres(id, début, fin)`** (neuve) : la météo après coup. L'entrée est retrouvée **par son id** dans le journal
  du moment — une synchronisation a pu remplacer le tableau entre-temps — puis le journal est enregistré de nouveau ; une
  entrée annulée entre-temps n'est plus là, rien n'est écrit.
- **`confirmValidation`, `saveJournalEntry`** : écrire, enregistrer, fermer, puis `_mvMeteoApres`. Le début de la tâche
  (`_findDebutTache`) est lu **avant** l'écriture, comme avant.
- **`pQuickValidate`** (le bouton « Valider » de la carte) avait déjà le bon ordre ; il passe désormais par `_mvMeteoApres`
  (avant : il complétait l'objet d'origine, perdu si le tableau avait été remplacé — lu dans le code au §241c).
- **`sw.js`, branche météo** : le réseau d'abord, borné à `MET_DELAI` (6 s), puis la copie de moins de 3 h ou l'échec net ;
  une réponse tardive met quand même la copie à jour.
- **`confirmLogin` (LOGIN-1)** : `appCheck/…`, ou un téléphone hors ligne, ne disent plus jamais « Mot de passe
  incorrect ». Hors ligne : « Pas de connexion réseau — réessayez quand le téléphone capte. » En ligne avec App Check en
  échec : « Le serveur ne répond pas. Relancez l'application… » et le bouton pour relancer, comme `auth/network-request-failed`
  depuis BOOT-1. Un vrai mauvais mot de passe dit toujours « Mot de passe incorrect. ».
- **Guide, section 1** : « Se connecter demande du réseau » — c'était vrai avant le lot ; l'écran le dit maintenant, le guide
  aussi.
- **`WHATS_NEW` 8.18** : deux corrections, niveau 0, pour tous.

### 242c. Mesuré

- **`mv-harnais-valid1`** (neuf, dans la liste unique) : **31 assertions** sur les vraies fonctions d'`app.js` branchées entre
  elles, et sur le **vrai `sw.js` chargé tel quel** (son gestionnaire fetch reçoit une requête Open-Meteo : sans réponse ni
  copie → 503 à la borne ; avec une copie récente → la copie). **10/10 contre-épreuves** : l'attente remise dans la feuille,
  puis dans le formulaire ; la borne retirée ; la météo écrite dans le journal d'avant la synchronisation ; une entrée annulée
  réécrite ; l'ancien patron de la carte ; App Check renvoyé au mot de passe ; un autre code hors ligne renvoyé au mot de
  passe ; le message sans consigne ; le service worker sans borne.
- **Rejoué dans Chromium sur le build du lot** (la méthode du §241) : météo sans réponse → feuille **fermée** et entrée
  **écrite** dès 1 s (avant : ouverte et rien à 30 s) ; ouverture à froid hors réseau → « Pas de connexion réseau — réessayez
  quand le téléphone capte. » (avant : « Mot de passe incorrect. ») ; contre-épreuve connexion simulée réussie → l'appli entre.

### 242d. Trouvé en route

- **Une borne qui rejette laisse une promesse rejetée orpheline.** Première écriture du service worker :
  `Promise.race([réseau, délai qui rejette])`. Quand le réseau gagne (le cas courant), le délai rejette 6 s plus tard sans que
  personne l'écoute. Vu parce que la contre-épreuve « sans borne » a fait **planter** le harnais au lieu de le faire rougir.
  La borne **résout** (`null`) et c'est le `.then` qui décide. ★ Patron à reprendre pour toute course à une borne.
- **`docs/claude/modules.md` décrivait encore `_findDebutTache` comme sans borne de période** (« défaut dormant ») : corrigé
  depuis le 16/08 (backlog, entrée 4 rayée). Section remise à jour, avec VALID-1.
- **Deux écritures du journal par validation** quand la météo arrive (l'entrée, puis sa météo) : c'était déjà le cas de
  `pQuickValidate` ; FUSION-1 fusionne la seconde comme la première.

### 242e. Ouvert

① **À regarder chez Nico, sur téléphone** : valider une tâche démarrée un autre jour avec un réseau faible (la fenêtre doit se
fermer tout de suite) ; « Se connecter » en mode avion (le nouveau message). ② **LOGIN-1 dit la vérité, il n'ouvre pas la
porte** : entrer sans réseau reste ENTREE-1 (décision de Nico sur les téléphones partagés). ③ La suite du plan :
`audit-perf-ux.md` §5, puis VOILE-1 et PROFILS-1.

---

## 243. ★★ VOILE-1 + PROFILS-1 — L'OUVERTURE : LE VOILE TANT QUE RIEN N'EST PRÊT, LES TUILES DE L'APPAREIL D'ABORD (04/10 — `src/app.js` · `src/firebase.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-voile1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/VOILE-1.json` · **APP 8.18 → 8.19, SW 8.93 → 8.94**, base `24aa425`)

### 243a. Le constat (§241) et les décisions de Nico

Mesuré dans Chromium avant le lot : un voile de 3,42 s imposé à **chaque** ouverture (2,2 s d'attente fixe, 0,9 s de lueur,
0,32 s de flash), l'appli prête ou non ; sur un réseau qui ne répond pas, la zone des profils **vide jusqu'à 18,6 s**, alors que
le téléphone garde la liste. « go dans l'ordre de tes recos » (04/10), avec ses arbitrages sur la suite du plan : ENTREE-1 =
« on retape le mot de passe sauf s'il est enregistré dans le navigateur » — ⚠️ **lu de travers ici** (j'en avais conclu « la
connexion reste soumise au réseau ») : Nico voulait que le mot de passe retapé ouvre l'appli MÊME SANS RÉSEAU, corrigé au §244 ; PAQUET-1 abandonné (le journal des nouveautés reste dans le
paquet) ; TEXTE-A en maquette ; GT-1 décidé ; le premier appui qui « démarre » une tâche dans la fiche parcelle est voulu.

### 243b. Ce qui change

- **Le voile** (bloc « SPLASH SCREEN » d'`app.js`) : la chorégraphie complète ne se joue qu'à la **première ouverture de
  l'appareil** — elle pose `mavigne_voile_vu` en finissant. Ensuite, le voile s'efface dès que l'écran de connexion montre
  quelque chose (une tuile, le chargement, le code de démo), qu'il a cédé la place, ou que quelqu'un est entré ; jamais avant
  `_MV_VOILE_MIN` (600 ms, pas de clignotement), par un fondu de `_MV_VOILE_FONDU` (250 ms). Le filet de 6 s reste.
- **`window._mvTuilesAppareil`** (neuve, `app.js`) : charge la copie de l'appareil (`loadData`) et dessine les tuiles
  (`_loginRenderTuiles`) — seulement si personne n'est connecté, qu'aucune tuile n'est touchée, que ce n'est ni la visite guidée
  ni le domaine de démo (les mêmes portes qu'`initLogin`, vérifiées par le harnais), et qu'il reste un profil actif.
- **`_fbLoad`** l'appelle **après** le domaine et **avant** ses attentes bornées (statut, profils, lecture directe). La liste du
  serveur remplace les tuiles en arrivant (`_mvMembresServeur`, `_mvProfilsAfficher`), tant que personne n'a touché une tuile.
- **La branche hors ligne de `_fbLoad`** passe par les helpers gardés (`_mvDonneesAppareil`, `_mvProfilsAfficher`) au lieu de
  `loadData()` + `initLogin()` nus : les tuiles pouvant désormais paraître avant l'attente du statut, quelqu'un peut déjà taper
  son mot de passe quand elle arrive — ni la mémoire ni l'écran ne doivent changer sous ses doigts.
- **`_mvDemarrer` part aussi à `DOMContentLoaded`.** Trouvé en mesurant (243d) : `load` attend le script reCAPTCHA, qui ne vient
  pas sur un réseau sans réponse, et le filet de 2,5 s de BOOT-1 devenait un temps mort avant les tuiles. `load` et le filet
  restent ; l'incident `load-tardif` ne se lèvera plus que si la page elle-même tarde à être lue.
- **`WHATS_NEW` 8.19** : « L'appli s'ouvre plus vite », niveau 0, pour tous.

### 243c. Mesuré

- **`mv-harnais-voile1`** (neuf, dans la liste unique) : **21 assertions** — le vrai bloc du voile sur une horloge simulée
  (première ouverture complète et marquée ; ouverture habituelle : rien avant 600 ms, fondu ensuite, le voile reste si rien
  n'est prêt et le filet de 6 s le retire, il part quand quelqu'un entre, pas de lueur ni de flash), la vraie
  `_mvTuilesAppareil` (appareil plein ou vide, profils inactifs, tuile touchée, connecté, visite guidée, domaine de démo, mêmes
  portes qu'`initLogin`), l'ordre réel de `_fbLoad`, la branche hors ligne gardée, le démarrage à `DOMContentLoaded`.
  **10/10 contre-épreuves.**
- **Chromium, build du lot contre build d'avant** (390 × 844) :

  | Ouverture à froid | Voile retiré | Première tuile |
  |---|---|---|
  | réseau sans réponse, habituelle | 4,7 s → **1,8 s** | 18,5 s → **1,0 s** |
  | réseau sans réponse, 1re ouverture de l'appareil | 4,4 s → 4,6 s (voulu) | 18,6 s → **1,1 s** |
  | hors réseau, habituelle | 4,6 s → **1,7 s** | 1,1 s → **0,9 s** |

- **Contre-vérifiés sur le même build** : connexion hors réseau (« Pas de connexion réseau… », VALID-1 intact), connexion
  simulée réussie (l'appli entre), connexion en ligne simulée puis navigation sur un domaine de 15 000 entrées : zéro erreur.

### 243d. Trouvé en route

- **Le temps mort de 2,5 s.** Première mesure après PROFILS-1 : tuile à 3,6 s au lieu de « tout de suite ». La cause n'était pas
  dans `_fbLoad` mais avant lui : `_mvDemarrer` n'était branché que sur `load` (depuis toujours — BOOT-1 n'avait ajouté que le
  filet de 2,5 s), et `load` attend le script reCAPTCHA. ★ **Une mesure qui ne colle pas à la promesse est une piste, pas un
  bruit.**
- **`ouvre.mjs`**, l'essai d'ouverture (voile et première tuile, réseau sans réponse ou hors réseau, première ouverture ou
  habituelle) : non versionné, comme les autres scripts de mesure du bac à sable (§241).

### 243e. Ouvert

① **À regarder chez Nico, sur téléphone** : une ouverture normale (le voile doit partir dès que sa tuile est là) ; la toute
première ouverture d'un téléphone neuf (l'animation complète, une fois). ② **Suite du plan, dans l'ordre** : ENTREE-1 (version
gestionnaire de mots de passe), RENDU-1, TAILLE-2, la maquette TEXTE-A, JOURNAL-1, GT-1.

---

## 244. ★★★ ENTREE-1 — SE CONNECTER SANS RÉSEAU, EN RETAPANT SON MOT DE PASSE (04/10 — `src/app.js` · `src/firebase.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/01-demarrer.html` · `scripts/mv-harnais-entree1.mjs` (neuf) · `scripts/mv-harnais-valid1.mjs` · `scripts/mv-harnais-prep.mjs` · `scripts/mv-harnais-reprise.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/ENTREE-1.json` · **APP 8.19 → 8.20, SW 8.94 → 8.95**, base `24aa425`, **zip cumulatif avec VOILE-1 non poussé**)

### 244a. La demande, et le contresens

L'audit (§241) avait prouvé qu'à froid et sans réseau on ne pouvait pas entrer, même avec le bon mot de passe. Nico,
sur ENTREE-1 : « on retape le mot de passe sauf si enregistré dans le navigateur ». **J'ai lu de travers** : j'en ai conclu
que la connexion restait soumise au réseau, j'ai livré un formulaire pour gestionnaire de mots de passe et je l'ai écrit
comme sa décision. Nico : « non, on a dit qu'on peut se connecter même sans réseau (cave, mauvais signal) » — puis, après
explication, le choix explicite « pouvoir se connecter sans réseau ». Le zip du formulaire est abandonné (jamais poussé) ;
le mot de passe se retape comme d'habitude. ★ **Leçon** : quand une décision tient en une phrase ambiguë, la reformuler en
toutes lettres avant de bâtir — « tu veux dire X ou Y ? » coûte un tour, un contresens en coûte trois.

### 244b. Ce qui change

- **L'empreinte.** Après chaque connexion RÉUSSIE avec réseau — après la garde SEC-2, jamais un mot de passe provisoire —
  `_mvEmpreinteEcrire` garde sur le téléphone (`mavigne_entree_v1_<domaine>`) : l'empreinte PBKDF2-SHA-256 du mot de passe
  (sel aléatoire de 16 octets, `_MV_EMPREINTE_ITER` = 310 000 tours, WebCrypto), le nom, l'uid du compte et les droits utiles
  hors réseau (`_MV_EMPREINTE_DROITS` : sans `gtAdmin`, `gts`, `mustpwd`). Jamais le mot de passe. Une seule empreinte par
  domaine : celle de la dernière personne connectée. La déconnexion volontaire l'efface (poste partagé, SEC-5).
- **La vérification** (`_mvVerifierHorsReseau`) : empreinte présente, au même nom, mot de passe concordant, et session Firebase
  gardée sur le téléphone (`window._fbUtilisateurPret`, borné à 3 s) au même uid. Verdicts : ok · mdp · premiere · autre.
- **Quand elle joue** : un échec de RÉSEAU de la connexion (`auth/network-request-failed`, `appCheck/…`, hors ligne), une
  adresse introuvable faute de serveur, ou un réseau qui traîne — **8 s** (`_MV_ENTREE_LENTE`, `_mvConnexion`), seulement si une
  empreinte existe ; la réponse tardive est ignorée. Sans empreinte, rien ne change.
- **L'entrée** (`_mvEntrerHorsReseau`) : droits restaurés si le jeton ne les donne pas (sinon l'écran des conditions bloquait
  l'admin) ; **Couche 2** — ne sont libérées que les clés que la copie dit avoir reçues du serveur (`CLES`, désormais écrit par
  `_mvSnapPayload` et relu par `loadData` ; une copie d'avant le lot ne libère rien) ; **base de fusion** = la copie telle
  qu'elle est chargée (`window._fbBasesDepuisAppareil` : jamais pour une clé déjà en file, jamais par-dessus une base du
  serveur, jamais le KML) ; puis la même session que l'entrée normale (`_mvSessionPoser`, extraite de `confirmLogin`) et
  `_mvApresEntree`, dont la branche hors ligne dessine maintenant l'écran (`_mvApresChargement`, la suite partagée).
- **Le retour du signal** (gestionnaire `online` de firebase.js) : après une entrée sans réseau, d'abord la file, puis
  `_fbLoadAfterAuth` (lecture, écoute), les droits et la suite d'entrée ; si le serveur ne répond toujours pas, le prochain
  `online` reprend.
- **Les messages** : sans empreinte → « la première connexion sur ce téléphone en demande » ; empreinte d'une autre personne
  ou session d'un autre compte → « seule la dernière personne connectée sur ce téléphone peut entrer » ; sans réseau et
  mauvais mot de passe → « Mot de passe incorrect. » — vrai cette fois, vérifié sur l'empreinte.
- **Guide 01, `WHATS_NEW` 8.20** : « Se connecter sans réseau », avec les trois conditions.

### 244c. Mesuré

- **`mv-harnais-entree1`** (neuf) : **31 assertions** sur les vraies fonctions — l'empreinte réelle (PBKDF2 par le WebCrypto de
  Node : jamais le mot de passe, 16 + 32 octets, droits filtrés ; rien au mot de passe provisoire ni au mauvais mot de passe) ;
  l'entrée sans réseau et ses quatre refus ; la copie d'avant le lot ; le réseau qui traîne (borné, une seule entrée) ; les
  bases ; **la vraie fusion des parcelles** : avec la copie pour base, ma validation ET celle d'un collègue sont gardées — sans
  base, la copie en retard effaçait la taille du collègue ; les branchements. **12/12 contre-épreuves.**
- **`mv-harnais-valid1`**, **`mv-harnais-prep`** et **`mv-harnais-reprise`** ajustés (confirmLogin passe par `_mvConnexion` ; la suite
  d'entrée vit dans `_mvApresChargement` ; le test « réseau » est calculé une fois en tête du catch, `_reseau`) : verts,
  contre-épreuves 10/10, 26/26 et 31/31. Le message garde sa forme d'origine, `_loginRelancer = navigator.onLine;`.
- **Chromium, build du lot, processeur ×4** : connexion avec réseau → empreinte posée, sans le mot de passe, copie marquée
  `CLES` ; **ouverture à froid sans réseau → entrée en 416 ms**, écran dessiné, une validation part en file AVEC la copie pour
  base ; mauvais mot de passe → « Mot de passe incorrect. » ; une autre personne → « seule la dernière personne connectée… ».
  La session gardée par le téléphone est simulée (le bac à sable n'en a pas de vraie). Non-régression : VALID-1, LOGIN-1
  (message sans empreinte), VOILE-1 et PROFILS-1 intacts.

### 244d. Trouvé en route

- **Le défaut que la connexion sans réseau aurait réveillé.** La file prévoyait le « démarrage hors ligne » : sans base,
  l'envoi fait l'union — juste pour une liste. Mais pour les **parcelles**, « sans base » veut dire base = serveur : la copie du
  téléphone gagne alors PARTOUT, y compris sur ce qu'un collègue a validé entre-temps (prouvé par le harnais sur la vraie
  `_mvMergeParcelles`). Inoffensif tant qu'on ne pouvait pas entrer sans réseau ; mortel dès qu'on le peut. D'où la base posée
  depuis la copie à l'entrée.
- **Un commentaire qui citait ce qu'il décrivait.** Le commentaire posé sur la table des documents de saveData contenait le
  texte même que `mv-harnais-achats` cherche pour la lire : le harnais la trouvait… par le commentaire. Réécrit sans la
  citation (§25 : un commentaire n'est jamais une preuve, ni une ancre).
- **La Couche 2 aurait rendu l'entrée inutile** : `_mvKeySeen` n'est posé que par une réponse du serveur — après une entrée
  sans réseau, une validation n'aurait jamais enregistré sa parcelle. D'où `CLES`, qui garde l'esprit du verrou (jamais un
  squelette) au lieu de le lever.

### 244e. Ouvert

① **À regarder chez Nico, sur SON téléphone** — c'est la seule vraie preuve : se connecter une fois avec du réseau, fermer
complètement l'appli, passer en mode avion, la rouvrir, taper son mot de passe → l'appli s'ouvre ; valider une tâche ; couper
le mode avion → la validation part. ② **La vraie session Firebase gardée sur un vrai téléphone** et le retour du signal n'ont
pas pu être joués dans le bac à sable (pas de serveur). ③ Une session révoquée côté serveur (mot de passe changé par
l'administrateur) : au retour du signal, la reconnexion échoue — à observer. ④ Suite du plan : RENDU-1, TAILLE-2, la maquette
TEXTE-A, JOURNAL-1, GT-1.

---

## 245. ★★ RENDU-1 — L'ÉCRAN NE SE FIGE PLUS QUAND UN COLLÈGUE VALIDE (04/10 — `src/firebase.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-rendu1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/RENDU-1.json` · **APP 8.20 → 8.21, SW 8.95 → 8.96**, base `24aa425`, **zip cumulatif avec VOILE-1 et ENTREE-1 non poussés**)

### 245a. Le défaut (mesuré au §241)

Chaque document reçu du serveur redessinait AUSSITÔT l'Accueil, Parcelles et ses statistiques (et la liste du Journal),
que ces pages soient affichées ou non. Une validation d'un collègue écrit trois documents (parcelles, journal, travaux) :
trois vagues de rendus complets, l'écran figé pendant ce temps.

### 245b. Ce qui change

`_mvRendreBientot(key)` (firebase.js) : les clés reçues s'accumulent ; à l'image suivante (`requestAnimationFrame`), SEULE
la page affichée se redessine, une fois, si l'une des clés la concerne (`_MV_RENDU_PAGES` : Accueil ← parcelles, journal,
travaux, sessions ; Parcelles ← parcelles, journal, travaux, avec ses statistiques ; Journal ← les mêmes, la liste seule ;
Tracteur, Phyto, Planning ← leurs documents, comme avant). La clé `'*'` (après la relecture complète du retour réseau) vaut
pour toutes les pages. L'horloge est remise à zéro AVANT le rendu : un rendu en panne est tracé (`_mvAvale`) et n'enraye
pas le suivant. Une page cachée se redessine quand on y va — `goTo` le faisait déjà (home → renderHome, parcelles →
renderParcelles + computePStats, journal → renderJournal). `_fbSubscribe` appelle par `window._mvRendreBientot` : le harnais
REPRISE, qui exécute `_fbSubscribe` sans cette fonction, reste valide. Onglet en arrière-plan : `requestAnimationFrame` attend
le retour, et ne dessine qu'une fois.

### 245c. Mesuré

- **Chromium, processeur ×4, un collègue valide** (trois documents reçus chacun dans sa tâche, comme `onSnapshot` ; avant =
  build d'ENTREE-1 avec l'ancien gestionnaire rejoué tel quel ; après = build du lot) — écran occupé au total :

| Page affichée | Journal | Avant | Après |
|---|---|---|---|
| Accueil | 1 000 | 324 ms | **140 ms** |
| Parcelles | 1 000 | 416 ms | **56 ms** |
| Journal | 1 000 | 673 ms | **90 ms** |
| Accueil | 15 000 | 856 ms | **530 ms** |
| Parcelles | 15 000 | 646 ms | **297 ms** |

- **`mv-harnais-rendu1`** (neuf) : **15 assertions** sur la vraie fonction (horloge d'images simulée) — rien pendant la
  réception, une fois à l'image suivante, aucune page cachée, chaque page avec ses seuls documents, `'*'`, personne de
  connecté, deux images = deux rendus, une panne n'enraye rien, et les deux branchements. **6/6 contre-épreuves.**

### 245d. Ouvert

① **À 15 000 entrées, il reste ~0,3 à 0,4 s** dans la réception elle-même — la copie de la base de fusion (FUSION-1) et la
conversion du document. La copie paresseuse (garder l'instantané, ne le convertir qu'au moment d'écrire) est possible mais
touche le cœur de FUSION-1 : à mesurer et décider à part ; ce volume est à plusieurs années du domaine de référence.
② **L'Accueil lui-même** coûte ~0,1 s à chaque rendu (≈ 30 cartes reconstruites) : l'alléger carte par carte reste à faire.
③ Suite du plan : TAILLE-2, la maquette TEXTE-A, JOURNAL-1, GT-1.

---

## 246. ★★ TAILLE-2 — UN DOCUMENT QUI GROSSIT PRÉVIENT AVANT D'ÊTRE REFUSÉ (04/10 — `src/taille-doc.js` (neuf) · `src/firebase.js` · `scripts/mv-taille-docs.mjs` · `scripts/mv-harnais-taille2.mjs` (neuf) · `scripts/mv-harnais-fusion-docs.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/TAILLE-2.json` · **aucun bump** (firebase.js + un module qu'il importe), base `24aa425`, **zip cumulatif avec VOILE-1, ENTREE-1 et RENDU-1 non poussés**)

### 246a. Le défaut (vérifié dans le code)

Firestore refuse tout document au-delà de 1 Mio. Le refus revenait après trois essais (7 s) ; fbSave mettait la saisie en
file (`_queueSave`), qui la renvoyait SANS FIN — voyant « en attente » pour toujours, aucune cause visible — et chaque saisie
suivante du même document s'y coinçait : pour le journal, toutes les validations du domaine. Rien ne mesurait des octets
(`_mvDocSize` compte des entrées pour la garde anti-écrasement ; seul `historique` avait sa garde, `_ARC_PLAFOND`).
Annoncé de travers en fin du §245 (« une sauvegarde automatique ») et corrigé avant le travail : TAILLE-2 ne sauvegarde rien.

### 246b. Ce qui change

- **Une seule règle** : `src/taille-doc.js`, module PUR (ni window, ni Buffer) — `mvOctetsTexte` (UTF-8 sans tampon),
  `mvOctetsValeur`, `mvOctetsNom`, `mvOctetsDoc`, `MV_LIMITE_DOC`. Importé par `firebase.js` ET par `scripts/mv-taille-docs.mjs`,
  dont l'auto-contrôle `--test` (joué par check) rejoue l'exemple Firestore (147 octets) et compare l'UTF-8 à Node : si la règle
  dérive, check rougit pour le script ET pour l'appli. Aucune copie.
- **Mesuré sur ce qui serait écrit, juste avant l'écriture** : `_mvSauverFusion` (après la fusion), `_saveParcellesMerged`,
  l'écriture directe de fbSave (KML, travaux) et les trois branches de `_flushQueue`. `_mvTailleControle(key, valeur)`.
- **> 90 %** : `logError` warning **silencieux** (`cat:'taille'`) → console GUERETTECH, une fois par jour, par document et par
  téléphone (`mavigne_taille_vu`). Le client ne voit rien. ★ **90 % et non 70 %, décision de Nico (04/10)** : le domaine de
  référence est déjà vers 800 Ko (≈ 78 %) après des actions pour alléger, et la limite y est calculée à ~2 ans — à 70 %,
  l'alerte sonnerait chaque jour pour rien ; à ce rythme (~9 Ko par mois), 90 % arrive dans ~13 mois et laisse ~11 mois.
  Un domaine qui grossit trois fois plus vite aurait encore ~4 mois.
- **> 1 Mio** : rien ne part, rien en file. `_mvTropGros` : la saisie au coffre (`_mvStashDenied` → Réglages › Saisies non
  enregistrées), le voyant « taille maximale atteinte · saisie conservée », un message clair une fois par séance (« prévenez
  GUERETTECH »), une erreur silencieuse à la console GT. La file ne finit plus sur « synchronisé » quand une clé en est sortie
  pour cette raison.
- **Le filet** : le refus de taille du serveur lui-même (`_mvErreurTaille` : `invalid-argument` + « maximum allowed size »)
  suit le même chemin, dans fbSave comme dans la file — et `_retryAsync` ne le réessaie plus (7 s pour rien).

### 246c. Mesuré

- **`mv-harnais-taille2`** (neuf) : **24 assertions** sur la vraie règle et les vrais fbSave, fusion, parcelles et file, sur un
  faux serveur à transactions (montage de `mv-harnais-fusion-docs`) — l'exemple Firestore ; 400 textes UTF-8 contre Node ; un
  petit document ; ★ **vers 800 Ko, aucune alerte** ; l'alerte (silencieuse, une fois par jour, de nouveau le lendemain) ; au-delà (rien envoyé, rien en file, coffre, voyant
  et message, alerte, message une fois) ; un document qui ne dépasse qu'APRÈS fusion ; parcelles ; KML ; la file ; le refus du
  serveur dans fbSave et dans la file, sans nouvel essai ; une panne passagère toujours en file ; une seule règle.
  **12/12 contre-épreuves** (dont : le seuil redescend à 70 %).
- **`mv-harnais-fusion-docs`** : son montage reçoit les fonctions et la règle de TAILLE-2 — 29 vertes, 15/15 contre-épreuves.
- **Le coût de la mesure** (Node) : 2 ms à 1 000 entrées, 8 ms à 15 000 — moins qu'UNE copie JSON du même journal (21 ms),
  et fbSave en fait déjà au moins deux.
- `npm run taille` sur une sauvegarde d'essai : inchangé (même affichage, même calcul).
- **Cliquet de poids regravé** (`mv-harnais-typo --baseline`, `scripts/typo-baseline.json`) : `firebase.js` 164 → 175 Ko (+6,7 %)
  au cumul de QUATRE lots non poussés (VOILE-1, ENTREE-1, RENDU-1, TAILLE-2), chacun sous les 5 %. La question du découpage
  a été posée et tranchée dans le lot même : la règle de taille est sortie dans `taille-doc.js` ; le reste dépend des
  internes de firebase.js (file, coffre, voyant). Seuls les poids changent dans la référence, aucun compte de tailles.

### 246d. Ouvert

① Le vrai remède reste **DONNEES-1** (découper les documents) : TAILLE-2 prévient et rend le blocage lisible, il ne l'empêche
pas. ② Le coffre garde le document ENTIER au moment du refus (STASH-1) : il ne repartira pas tant que le document est trop gros.
③ Suite du plan : la maquette TEXTE-A, JOURNAL-1, GT-1.

---

## 247. ★★★ TEXTE-A — LES PETITS TEXTES RELEVÉS, CHOISIS SUR MAQUETTE (05/10 — `src/styles.css` · `src/tracteur.js` · `index.html` · `src/*.js` (tailles à 12 / 11,5 px → jetons) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/mv-harnais-textea.mjs` (neuf) · `scripts/mv-harnais-typo.mjs` · `scripts/mv-harnais-echelle.mjs` · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/TEXTE-A.json` · **APP 8.21 → 8.22, SW 8.96 → 8.97**, base `3cf9be9`)

### 247a. La maquette, puis la décision

Nico voulait voir avant de choisir (04/10). Maquette publiée (artefact claude.ai) : trois écrans RÉELS de l'appli —
accueil ouvrier, session tracteur, registre phyto — capturés au format téléphone dans Chromium (390 × 844, données fictives),
chacun en trois états basculables au même endroit : **avant**, **jetons** (les trois crans relevés), **plancher** (en plus,
tout texte encore sous 12 px forcé à 12). Comptés à l'écran, textes sous 12 px : accueil 26 → 15 → 0, tracteur 40 → 13 → 0,
registre 51 → 13 → 0 ; sous 10 px : 0 dès les jetons. Constat de la maquette : dès les jetons, la ligne des parcelles du
registre poussait la flèche à la ligne. Décision de Nico : **« jetons »**.

### 247b. Ce qui change

- **Les trois crans** (`:root` de styles.css) : `--pt-micro` 11 → **12**, `--pt-lbl` 10,5 → **11,5**, `--pt-nano` 9,5 → **11**.
  Plus rien sous 11 px par les jetons (1 396 emplois).
- **Les replis gardent les anciennes valeurs, EXPRÈS** : `var(--pt-micro,11px)` etc. ne servent que là où `:root` n'existe pas —
  les fenêtres d'impression que construisent les modules. L'impression n'a pas été jugée sur maquette : elle ne bouge pas.
  **Seule exception : `pilotage.js`** (qui n'imprime rien) — `mv-harnais-echelle` y exige que le repli redise la valeur du
  pas : ses 76 replis passent à 12 / 11,5 / 11.
- **416 tailles déjà écrites à 12 et 11,5 px** (310 + 106 dans src, 84 dans index.html) passent par `var(--pt-micro,12px)` et
  `var(--pt-lbl,11.5px)` : MÊME rendu, à l'écran comme à l'impression (le repli porte leur valeur). Imposé par la règle B du
  harnais typographique (aucune taille égale à un cran écrite en dur), et utile au futur réglage « Taille du texte » (lot B),
  qui les entraînera avec l'échelle.
- **Registre phyto** (`renderPhytoTrac`, tracteur.js) : la ligne parcelles · opérateur · flèche ne passe plus à la ligne (plus de
  `flex-wrap`) ; les noms se raccourcissent par points de suspension, le « +N » reste à part et toujours lisible
  (`_phParcParts` : noms / plus — mis bout à bout, le même texte qu'avant ; l'ancienne `_phParcTxt`, sans autre appelant, est
  retirée : le preflight refuse une fonction sans appelant, §25.11).
- `WHATS_NEW` 8.22, niveau 0. Rien au guide (il ne parle pas des tailles).

### 247c. Mesuré

- **Chromium, build du lot** (mêmes trois écrans) : textes sous 12 px à l'écran — accueil 15, tracteur 13, registre 14 ; **sous
  10 px : 0** partout. Registre : 19 lignes, écart entre la flèche et les parcelles **0,0 px**, aucune ligne qui déborde, « +N »
  visible 19/19, texte à 12 px.
- **`mv-harnais-textea`** (neuf) : **13 assertions** — les crans, aucune redéfinition qui les écraserait, le barème du harnais
  typographique, la vraie `_phParcParts`, la vraie carte `renderPhytoTrac`. **7/7 contre-épreuves.**
- **`mv-harnais-typo`** : barème et injection alignés sur les nouveaux crans ; vert, contre-épreuve 3/4 assertions sur 4 défauts.
  px en dur : 1 932 → **1 432** (−500). Cliquet regravé pour garder ce gain.

### 247e. Trouvé en route

- **Deux harnais portaient l'ancien barème** (`mv-harnais-typo`, `mv-harnais-echelle`) : alignés. Le second exige « chaque
  repli redit la valeur du pas » — j'ai d'abord aligné les ~1 400 replis de TOUS les modules, avant de lire que sa règle ne
  porte que sur `pilotage.js`. Conséquence évitée : les impressions auraient grossi, et le **relevé d'heures** (A4 de hauteur
  fixe, `overflow:hidden`) aurait pu perdre « Fait le… » et les signatures en bas de page. Replis remis partout, sauf
  Pilotage. ★ Leçon : lire la PORTÉE d'une règle de harnais (quels fichiers il lit) avant de l'appliquer à tout le dépôt.
- **Le preflight refuse une fonction sans appelant** (§25.11) : `_phParcTxt`, remplacée par `_phParcParts`, retirée.

### 247d. Ouvert

① **Les tailles écrites en dur sous 12 px** restent (option « plancher » écartée) : badges de type à 10 px, quelques mentions.
② **Lot B, le réglage « Taille du texte »** (Normal · Grand · Très grand, à côté de « Plein soleil ») : backlog 36.
③ **Sans rapport avec la taille, vu sur la maquette** : sur l'accueil à 390 px, quand la météo s'affiche, le bouton « Aide » est
déjà poussé au bord de l'écran. ④ `.val-toggle` à 44 px de haut (cible tactile, prévu au plan) : pas fait, pas montré sur maquette.
⑤ Suite du plan : JOURNAL-1, GT-1.

---

## 248. ★★ JOURNAL-1 — LE JOURNAL NE MET EN PAGE QUE LES JOURS QUI SE VOIENT (05/10 — `src/styles.css` · `src/app.js` (renderJournalList) · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-journal1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/JOURNAL-1.json` · **APP 8.22 → 8.23, SW 8.97 → 8.98**, base `3cf9be9`, **zip cumulatif avec TEXTE-A non poussé**)

### 248a. Le défaut (mesuré au §241)

Le Journal calculait vite (≈ 50 ms) mais mettait 350 à 590 ms à s'afficher : la mise en page des 200 lignes de la première
page (la pagination par 200 existait déjà, avec « Voir plus »). Aucune règle `content-visibility` dans l'appli.

### 248b. Ce qui change

- **`.dgroup{content-visibility:auto}`** : un jour (en-tête + lignes) hors écran n'est ni mis en page ni peint. Essais
  comparés dans Chromium (×4, 200 lignes) : rien 289 ms · contenu des cartes seul 181 · ligne par ligne 169 · **jour par jour
  94** — retenu.
- **La place réservée** : `contain-intrinsic-size:auto` + une hauteur PAR JOUR posée par `renderJournalList`
  (`52 + lignes × 96` px, d'après les hauteurs mesurées : en-tête 16 + 20 + 10, ligne ≈ 90 + 6, rembourrage du bas) — la page
  garde à peu près sa longueur (24 419 → 25 599 px tant que les jours lointains ne sont pas dessinés) et le défilement ne saute
  pas ; `auto` : une fois dessiné, la vraie taille fait foi.
- **La règle CONTIENT le groupe, deux effets compensés** : ① les ombres des cartes (`--shadow-sm`, 8 px de flou) seraient
  coupées au bord du groupe → rembourrage 8 px sur les côtés, 12 px en bas, rendu par des marges négatives ; ② les marges ne
  traversent plus le groupe (16 px sur l'en-tête restent dedans) → la dernière ligne d'un jour perd sa marge (`.dgroup>.jitem:
  last-child`, le rembourrage la remplace), marge basse −8 px (20 px entre deux jours), `:last-of-type` −4 px (20 px avant
  « Voir plus »), `:last-child` 8 px (36 px en fin de liste). **Toutes ces valeurs sont sur l'échelle d'espacement** (`--e-*`) :
  une première version à 10 / 6 / 2 px faisait monter le cliquet de `mv-harnais-echelle` (1 006 > 1 003), refaite.
- `WHATS_NEW` 8.23, niveau 0.

### 248c. Mesuré

- **Chromium, processeur ×4, médiane de 5, avant et après alternés dans la même séance** — `goTo('journal')` jusqu'à l'image :
  journal de 1 000 entrées **336 → 122 ms** (séance calme), **499–534 → 142–145 ms** (séance chargée) ; de 15 000 **349 → 140 ms**,
  **460 → 227 ms** (chargée). Objectif du plan (< 150 ms) tenu à 1 000 entrées ; à 15 000, le reste est le CALCUL (filtrer et
  grouper 15 000 entrées, 47–59 ms) — ce que DONNEES-1 traitera en découpant par campagne.
- **Au pixel près**, mêmes données, mêmes contenus à l'écran (haut, milieu, fin avec « Voir plus ») : haut identique ; milieu à
  1/255, fin à **3/255 au plus** par canal (la queue de l'ombre au-delà de 8 px, invisible). Écarts mesurés : 20 px entre deux
  jours (7 sur 7), 20 px avant « Voir plus », 36 px en fin de liste sans bouton — identiques avant / après.
- **`mv-harnais-journal1`** (neuf) : **10 assertions** qui relisent le CSS RÉEL (`.dgroup`, `.jitem`, `.dhead`, `.j-load-more-btn`,
  `.timeline`, `--shadow-sm`) et refont les comptes (fusion des marges CSS 2.1 §8.3.1) — écarts, place des ombres, valeurs sur
  l'échelle, réserve par jour. **9/9 contre-épreuves**, dont : la marge de la dernière ligne réapparaît ; une valeur hors
  échelle revient.

### 248e. Trouvé en route

- **Le cliquet d'espacement** (`mv-harnais-echelle`) : 10, 6 et 2 px ne sont pas sur l'échelle (2, 4, 8, 12, 16…) — et les
  écarts exacts demandaient un total « impair au pas de 4 » à cause des 6 px de marge des lignes. Solution : retirer la marge de
  la DERNIÈRE ligne d'un jour, que le rembourrage remplace ; tout retombe sur l'échelle.
- **Le preflight C24c** refuse une substitution `${…}` non protégée dans un gabarit HTML : la réserve passe par `Number(…)`.
- ★ Méthode : la comparaison au pixel doit viser le MÊME contenu (aligner sur l'en-tête du jour, pas sur la boîte du groupe,
  dont le bord bouge de 16 px quand la marge de l'en-tête reste dedans) — sinon on compare deux défilements.

### 248d. Ouvert

① `content-visibility` : Safari 18 et plus (sur un iPhone plus ancien, la règle est ignorée — rien ne casse, rien ne gagne).
② Les autres longues listes (registre phyto, sessions tracteur) n'en ont pas besoin aujourd'hui (19 et 12 cartes) ; même
recette le jour où elles grossissent. ③ Suite du plan : GT-1.

---

## 249. ★★★ GT-1 — LA CONSOLE GUERETTECH QUITTE L'APPLI DES CLIENTS (05/10 — `index.html` · `src/app.js` · `src/onboarding.js` · `src/gt.js` (neuf) · `src/gt/connexion.html` et `src/gt/console.html` (neufs, déplacés d'index.html) · `scripts/mv-gt-page.mjs` (neuf) · `scripts/inject-precache.mjs` · `vite.config.js` · `package.json` · `.gitignore` · `firebase.json` · `public/sw.js` · `scripts/preflight.mjs` · `scripts/mv-harnais-regl-module.mjs` · `scripts/mv-harnais-version.mjs` · `scripts/mv-harnais-gt1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/GT-1.json` · **SW 8.98 → 8.99, APP 8.23 inchangé**, base `7aa9ce7`)

### 249a. La décision

Plan §241, lot 13, décidé par Nico le 04/10, reformulé et confirmé (« go ») le 05/10 : la console GUERETTECH (domaines,
abonnements, erreurs — `admin-gt.js`, 385 Ko de source, ≈ 250 Ko compilés) était une page cachée de l'appli des clients :
téléchargée et chargée sur le téléphone de chaque ouvrier, alors qu'elle ne sert qu'à GUERETTECH. Elle sort.

### 249b. Ce qui change

- **Deux pages, un seul `index.html` à maintenir.** `index.html` reste l'appli des clients : `app.js` n'importe plus
  `admin-gt.js` ; le panneau de connexion GUERETTECH et la page de la console (avec le verrou de session et la fenêtre
  « nouveau domaine ») ont quitté le fichier, remplacés par deux repères (`MV-GT:CONNEXION`, `MV-GT:CONSOLE`).
- **`gt.html` est FABRIQUÉE** par `scripts/mv-gt-page.mjs` : `index.html` + `src/gt/connexion.html` + `src/gt/console.html`,
  entrée `src/gt.js` (`app.js` puis `admin-gt.js`), `noindex, nofollow` (la balise robots existante est remplacée), sans
  manifeste d'installation, titre « Ma Vigne · GUERETTECH ». Chaque repère doit apparaître une fois exactement, sinon la
  fabrique refuse. `npm run build` et `npm run dev` la fabriquent avant Vite ; ignorée par git (jamais éditée à la main).
- **Vite construit les deux pages** (`input: { main, gt }`) : le code commun dans un même fichier, la console dans le sien,
  que seule `gt.html` charge.
- **Précache** (`inject-precache`, `precacheSansGT`) : les fichiers que `gt.html` charge et qu'`index.html` ne charge pas
  sont exclus — un téléphone de client ne les télécharge jamais ; la page GT les reçoit à la première visite (le service
  worker met en cache les `/assets/` demandés). Les fichiers chargés à la demande par le code restent précachés.
- **Hébergement** : `/gt.html` sans cache (comme `index.html`) et `X-Robots-Tag: noindex, nofollow`.
- **L'entrée GUERETTECH** : dans l'appli des clients, les cinq appuis sur le logo envoient vers `/gt.html` ; dans `gt.html`,
  le panneau de connexion s'ouvre de lui-même (une fois). `goTo('admin-gt')` dans l'appli des clients renvoie vers
  `/gt.html` (filet). **La préparation d'un domaine (PREP-1) reste dans `gt.html`** : même page, mêmes écrans normaux
  (l'appli entière y est) — aucun passage de session d'une page à l'autre.
- **`agtUpdateEssaiAccess`** (appelée par le parcours de démonstration) reste dans la console : elle n'agissait que sur la liste
  des codes chargée PAR la console — chez un client, elle ne faisait déjà rien ; l'appel, gardé par `if(window…)`, se tait.
- **Contrôles adaptés** : le preflight lit les fragments (`htmlGT()` : C2, C11, C15) ; `mv-harnais-regl-module` cherche le seul
  `goHub` dans la console ; `mv-harnais-version` accepte la fabrique en tête de `npm run build`.

### 249c. Mesuré

- **Build** : `dist/index.html` → le code commun (≈ 3 657 Ko) et sa feuille de style, **rien de la console** (`agtSwitchTab`
  absent du fichier commun) ; `dist/gt.html` → la même chose + le fichier de la console (≈ 260 Ko). Précache : le fichier de
  la console exclu, le reste gardé.
- **Chromium, sur le build** : appli des clients — seulement le code commun, aucune trace de la console (`renderAdminGT`
  indéfinie, pas de balisage GT), 0 erreur ; cinq appuis sur le logo : `/` → `/gt.html` ; `gt.html` — console présente,
  panneau de connexion ouvert seul, `renderAdminGT` et `agtPrepOuvrir` présentes, titre et robots corrects, 0 erreur.
- **`mv-harnais-gt1`** (neuf) : **24 assertions** — la vraie fabrique (contenu, entrée, robots, manifeste, stabilité, REFUS sans
  repère), le vrai précache (console exclue, commun et « à la demande » gardés, rien retiré sans gt.html), le vrai geste des
  cinq appuis (client : renvoi ; gt.html : ouverture seule, une fois), Vite, npm, git, hébergement, preflight. **12/12
  contre-épreuves.**

### 249d. Ouvert

① **À tester chez Nico, sur le vrai serveur** : se connecter sur `mavigneapp.fr/gt.html` (mot de passe + code reçu), ouvrir
la console, préparer un domaine puis « Terminer ». ② **Ouvrir la console avec un faux compte GUERETTECH, sans serveur, fige
la page** — dans le bac à sable seulement, et DÉJÀ avant ce lot (même essai sur `7aa9ce7`) : à regarder à part si cela se
produit aussi hors ligne chez Nico. ③ Le code de connexion GUERETTECH (`confirmGTLogin`, second facteur) reste dans le code
commun (onboarding.js, quelques Ko) — inatteignable depuis l'appli des clients ; le sortir aussi est possible plus tard.
④ Hors `npm run check` et déjà en échec avant ce lot : la contre-épreuve « la fiche Pilotage promet à nouveau qu'on n'y écrit
rien » de `mv-harnais-regl-module --contre`. ⑤ Restent du plan : DONNEES-1 (une vraie sauvegarde), IDS-1, le lot B de TEXTE-A.

## 250. ★★★ MOTIFS-1 — LES MOTIFS D'ABSENCE NE QUITTENT PLUS L'APPAREIL DE L'ADMIN (05/10 — `functions/planning-vues-calc.js` (neuf) · `functions/planning-vues.js` (neuf) · `functions/claims.js` (gtPlanningVues) · `functions/index.js` · `src/planning-vue.js` (neuf) · `src/firebase.js` · `src/app.js` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `firestore.rules` · `scripts/mv-harnais-motifs1.mjs` (neuf) · `scripts/mv-harnais-rules.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `guide/13-donnees.html` · `docs/claude/modules.md` · `.mv-base` · `lots/MOTIFS-1.json` · **APP 8.23 → 8.24, SW 8.99 → 9.00**, base `986a76d`)

### 250a. La demande, et ce qu'elle a découvert

Nico, 05/10 : les salariés doivent voir le planning du mois de leurs collègues (présent / absent), en lecture seule — **sans les
motifs**. Maquette « Planning — vue salarié » faite, puis « go ». En la préparant, un constat mesuré : le planning COMPLET (« arrêt de
travail », « absence injustifiée », commentaires), les heures sup et les acomptes partaient déjà sur le téléphone de CHAQUE membre —
écoute temps réel (`FB_REALTIME`) et copie locale (`_mvSnapPayload`). Les règles le disaient « assumé, l'app en a besoin ». L'écran ne
le montrait pas ; le téléphone le détenait. Nico : « il ne faut pas que les salariés voient les motifs d'absence de leurs collègues »
→ ce lot d'abord, la vue d'équipe ensuite.

### 250b. Ce qui change

- **Serveur.** Deux déclencheurs Firestore — les premiers du projet (base eur3, fonctions europe-west1 : couple supporté par Eventarc) —
  sur `{coll}/planning_entries` et `{coll}/membres`, fabriquent `planning_equipe` (l'équipe sans motif) et `planning_moi_<uid>` (les jours
  complets d'un membre qui a un compte). Règle pure dans `planning-vues-calc.js`, en **liste blanche** : congé, récup, absence d'une
  journée → `{absent:true, motif:'autre'}` ; retard, absence partielle, horaire modifié, chaleur, journée réduite → rien (jour au modèle :
  présent) ; échange / extra → son horaire ; effectif d'une équipe collective → gardé. Une transaction relit le planning ; seules les vues
  qui changent sont réécrites ; **rien n'est recréé** quand les membres ou le planning n'existent plus (gtDeleteTenant efface document par
  document, et chaque effacement réveille un déclencheur). Rattrapage GT : `gtPlanningVues` (claims.js), par domaine ou pour tous.
- **Règles.** `isAdminReadDoc` = `paie` + les trois documents du planning ; un membre lit `planning_equipe` et SA vue
  (`'planning_moi_' + request.auth.uid`), l'admin les lit toutes ; `isVuePlanning` : aucune écriture client des vues (règle 3).
- **Client.** `src/planning-vue.js` (pur) : `planVueComplete` (admin, GUERETTECH, préparation, démo — égal à `deriveAdm` sur les 32
  combinaisons), `planComposer`, `planGarderLesMiens`. `firebase.js` : `_mvClesLues` (relecture ET écoute : les vues à la place des
  trois documents), `_mvPlanRecevoir` (crochet en tête d'`applyFbData` : les vues se COMPOSENT en `planning_entries`, le reste de l'appli
  ne voit aucune différence), `_fbPlanAssainir` (à l'entrée, avec ou sans réseau : la copie ne garde que SES jours, heures sup et acomptes
  vidés, en place, copie locale réécrite par `window._mvSnapSave`, exposé par app.js), et la garde de `fbSave` (un téléphone en vue
  salarié n'enregistre jamais le planning : il écraserait la version complète par la version sans motifs).

### 250c. Les arbitrages

- **Heures sup et acomptes : aucune copie.** « Mon mois » n'en lit aucun — mesuré : 100 fonctions atteintes depuis `_planRenderMon` et
  `_planRenderHeader` (littéraux de chaîne exclus), aucune ne lit `PLANNING_HSUP` ni `PLANNING_ACOMPTES`.
- **Pas un filtre à l'écran** : il laisse les données sur le téléphone. **Pas une dérivation par l'appareil de l'admin** : plusieurs
  admins, file hors ligne, appareil éteint entre deux écritures — la copie divergerait ; et l'appareil ne connaît pas les identifiants
  de comptes. Le serveur seul voit passer chaque écriture.
- **Pas les seuls « effets » du motif (payé, assimilé…)** : « suspend + payé » désigne l'arrêt de travail à coup sûr. L'effet trahit le
  motif — d'où « autre ».
- **`motif:'autre'` plutôt que rien** : depuis NET-1, une absence SANS motif vaut « injustifiée » dans le moteur ; « autre » (non
  précisée) est neutre et ne suggère rien.
- **Les copies de secours locales d'avant le lot restent** : elles protègent d'une copie courante abîmée ; elles partent en trois jours
  d'ouverture (`_MV_BK_MAX`).
- **Les crochets passent par window** : `mv-harnais-taille2` et `mv-harnais-fusion-docs` jouent le vrai `fbSave` / `applyFbData` dans un
  bac à sable qui ignore ces noms — un identifiant importé y aurait levé.

### 250d. Mesuré

- `mv-harnais-motifs1` (neuf) : **49 assertions** — la vraie règle serveur (cas écrits, 600 journées tirées au hasard, liste blanche,
  « absent ⇔ congé, récup ou journée entière » réécrit à part), la fabrique sur un faux Firestore (idempotence, réécriture minimale, rien
  dans un domaine supprimé, lots de 100), les déclencheurs (faux require), le rattrapage GT extrait et joué, le module client, le bloc de
  firebase.js exécuté, le VRAI `fbSave`, le câblage, les règles. **14/14 contre-épreuves.**
- `mv-harnais-rules` : **section P (17 cas)** et **3 contre-épreuves** neuves — 70 cas, 15 contre-épreuves, à jouer sur l'émulateur.

### 250e. Ouvert

Voir §28, « MOTIFS-1 — ce qui reste ouvert » : l'ordre de déploiement, `npm run test:rules`, le lot de la vue d'équipe, les limites.

## 251. ★★ VUE-EQUIPE-1 — L'ÉQUIPE DU MOIS, VUE PAR UN SALARIÉ (05/10 — `src/planning.js` · `index.html` (onglets) · `src/utils.js` (aide, APP, WHATS_NEW) · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-vueeq1.mjs` (neuf) · `scripts/mv-harnais-robustesse-planning.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/VUE-EQUIPE-1.json` · **APP 8.24 → 8.25, SW 9.00 → 9.01**, base `7f013fb`)

### 251a. La demande et la maquette

Nico, 05/10 : les salariés voient le planning du mois en cours, avec les présences et absences de leurs collègues, sans pouvoir rien
modifier — et sans les motifs (le second point a d'abord donné MOTIFS-1, §250). Maquette « Planning — vue salarié » (canevas, trois
écrans), validée par « go ». Décisions portées par la maquette : même un congé s'affiche « Abs » ; une absence d'une partie de la journée
compte « présent » ; ni heures, ni écart, ni congés des autres ; sa ligne en tête ; « Présents » compte les présents parmi les attendus ;
mois en cours seulement ; Mon mois reste l'onglet d'ouverture.

### 251b. Ce qui change

- **Deux onglets pour le salarié** (`.plan-tab-sal` dans `index.html`) : Mon mois (`moi`) et L'équipe (`eqmois`). Les deux onglets de
  l'admin lui restent cachés ; `renderPlanning` montre désormais la barre à tout le monde.
- **La vue** (`_planEqSalHtml`, `_planEqSalKpis`, `_planEqData`) reprend la grille de l'admin (classes `pl2-*`) en `<div>` sans geste :
  aucune case, aucun nom, aucun jour ne réagit ; seules la navigation et la bascule semaine / mois. Pastilles neutres (`pleq-pres`,
  `pleq-abs` — aucune couleur ne porte le motif : la liste des jours, elle, colore par effet de paie, et l'aurait trahi). CSS injecté
  (`_planEqInjectCss`), tailles par jetons uniquement.
- **Un jour se classe par `_pl2Cell`**, la cellule de la grille de l'admin : congé, récup, absence → absent ; heures, chaleur, retard ou
  absence partielle (pl2c-late) → présent ; sans heures au modèle → repos ; hors contrat → « – ». Une seule définition de « ce jour-là ».
- **Le mois en cours, verrouillé** (`_planEqMoisCourant`) ; flèches bornées aux semaines du mois, éteintes sur le mois entier.

### 251c. Trouvé en route

- ★★ **La clé `equipe` était déjà prise** — par une ANCIENNE clé d'onglet, migrée vers `mois` par `_PLAN_TAB_MIGR`. Avec elle, chaque
  rendu (donc chaque donnée reçue) renvoyait le salarié sur Mon mois. Le premier passage du harnais l'a vu (V2) ; rien d'autre ne l'aurait
  vu avant le terrain. ★ **Une clé neuve se cherche aussi dans les tables de migration**, pas seulement dans les clés valides.
- Deux rouges du premier passage venaient du TEST : l'expression qui lisait la ligne « Présents » comptait aussi sa cellule de titre
  (`pl2-totl` commence par `pl2-tot`) — 32 jours en octobre. Corrigé dans le harnais, pas dans le code.

### 251d. Mesuré

- `mv-harnais-vueeq1` (neuf) : **16 contrôles** sur le VRAI planning.js chargé dans Node, horloge au lundi 5 octobre 2026, données d'un
  téléphone de salarié puis données complètes de l'admin (aucun motif à l'écran dans les deux cas) ; **8/8 contre-épreuves**, chacune dans
  un processus à part.
- `mv-harnais-robustesse-planning` : la vue salarié ajoutée aux surfaces du tirage au hasard (24 domaines × 12 mois) — vert.

### 251e. Ouvert

Voir §28, « VUE-EQUIPE-1 — ce qui reste ouvert ».

---

## 252. ★★ IDS-1, LOT 1 — CHAQUE PARCELLE A UN IDENTIFIANT PERMANENT (05/10 — `src/ids.js` (neuf) · `src/app.js` (saveData) · `src/firebase.js` (deux fusions) · `public/sw.js` · `scripts/mv-harnais-ids1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/IDS-1.json` · **SW 9.01 → 9.02, APP 8.25 inchangé**, base `7a6a9ac`)

### 252a. La décision

Plan §241, lot 12 : « renommer une parcelle ou un salarié devient sûr ». Deux chemins proposés à Nico le 05/10 —
A, les vrais identifiants (l'audit) ; B, étendre aux parcelles le renommage des tâches (RENOM-3). L'objection de taille
contre A (≈ 33 octets par entrée) est TOMBÉE avec la vraie mesure du jour (`npm run taille` sur la sauvegarde du 05/10 :
journal 108 Ko, 10,5 % ; le plus gros document, `historique`, 192 Ko, 18,8 % — les « 800 Ko » étaient la taille du FICHIER
de sauvegarde). Nico : « ta reco » → **A, en quatre lots, parcelles d'abord** (le planning, rangé par nom de salarié, est
en chantier dans une autre session : §250, §251).

### 252b. Ce qui change

- **`src/ids.js`** (pur, comme `taille-doc.js`) : `mvPidDe(nom)` — l'identifiant est DÉDUIT DU NOM au moment où il est posé
  (FNV-1a sur deux graines, ≈ 52 bits, `p` + au plus 11 caractères ; espaces autour et forme des accents sans effet) : deux
  téléphones qui le posent en même temps posent le même — aucune course à arbitrer. Une fois posé, il ne bouge plus, même
  si le nom change. `mvIdsParcelles`, `mvCarteParcelles` (nom → pid POSÉ, ou déduit), `mvIdsJournal` (seulement pour une
  parcelle CONNUE ; un pid existant n'est jamais remplacé).
- **Posé au seul passage de toutes les écritures** : `saveData` (parcelles, journal, ou tout) — aucun des écrivains du
  journal n'est repris.
- **Les deux fusions normalisent les TROIS côtés** (serveur, base, appareil) : `_mvSauverFusion` pour le journal,
  `_saveParcellesMerged` pour les parcelles. Sans cela, poser un pid « modifiait » chaque ligne : une entrée SUPPRIMÉE
  ailleurs serait revenue (« modifiée ici, supprimée là-bas : gardée », FUSION-1), et la fusion aurait vu des changements
  partout. Les appels sont gardés par `typeof` : les harnais qui exécutent ces fusions sans le module restent valides.
- **Personne ne lit encore `pid`** : aucun écran ne change. Lot 2 : les écrans retrouvent les liens par pid, par le nom à
  défaut (325 comparaisons, module par module) ; lot 3 : les anciennes entrées des noms disparus ; lot 4 : renommer.

### 252c. Mesuré

- **`mv-harnais-ids1`** (neuf) : **14 assertions** — le vrai module (déterministe, 20 000 noms → 20 000 identifiants, espaces
  et accents, un pid posé jamais remplacé même après un renommage, nom inconnu sans pid, idempotent) et les VRAIES fusions sur
  un faux serveur à transactions : une entrée supprimée ailleurs **ne revient pas** ; une validation faite ailleurs est gardée
  avec le pid ; une entrée et une parcelle écrites par un téléphone pas à jour reçoivent leur pid à la fusion ; le
  branchement de saveData. **7/7 contre-épreuves**, dont : sans la normalisation des trois côtés, l'entrée supprimée revient.
- Taille : ≈ 13 octets par entrée ; chez le domaine de référence (journal 108 Ko), négligeable.

### 252d. Ouvert

① Lot 2 — lire par `pid` (et par le nom à défaut) : les 325 comparaisons de noms, module par module, en commençant par la
Vigne et le journal. ② Lot 3 — les entrées des noms disparus. ③ Lot 4 — le bouton « Renommer » qui ne change que
l'étiquette. ④ Les salariés, après le chantier du planning. ⑤ Sessions tracteur, registre phyto, Chai et Cuvier portent aussi
des noms de parcelles : à intégrer au lot 2 ou à part.

---

## 253. ★★ IDS-1, LOT 2 — LE NOM SUIT L'IDENTIFIANT (05/10 — `src/ids.js` · `src/app.js` (applyFbData, loadData, saveData) · `src/firebase.js` (fusion du journal) · `public/sw.js` · `scripts/mv-harnais-ids1b.mjs` (neuf) · `scripts/mv-harnais-ids1.mjs` · `scripts/typo-baseline.json` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/IDS-1B.json` · **SW 9.02 → 9.03, APP 8.25 inchangé**, base `7a6a9ac`, **zip cumulatif avec le lot 1 (§252) non poussé**)

### 253a. Le chemin retenu

Annoncé : « les écrans retrouvent les parcelles par leur identifiant » — 325 comparaisons de noms, module par module. Trouvé
plus sûr, pour le même résultat : **le nom porté par chaque entrée est tenu à jour d'après son identifiant**. L'identifiant
fait foi ; le nom de l'entrée n'est plus qu'une étiquette recopiée. Aucun des 325 lecteurs n'est touché : le jour où une
parcelle est renommée (lot 4), ses entrées prennent le nouveau nom, et chaque écran — qui compare des noms — retrouve
l'historique. Aujourd'hui sans effet : l'identifiant vient du même nom.

### 253b. Ce qui change

- **`mvNomsParPid(parcelles)`** : identifiant → nom actuel ; un identifiant porté par PLUSIEURS parcelles est écarté (jamais un
  nom deviné). **`mvNomsJournal(journal, carte)`** : chaque entrée dont l'identifiant est connu prend le nom actuel ; sans
  identifiant, ou identifiant inconnu (parcelle disparue), l'entrée garde son nom.
- **Branchés partout où le journal arrive ou part** : `applyFbData` (réception du journal ou des parcelles, en mémoire),
  `loadData` (copie du téléphone), `saveData` (avant l'écriture), et la fusion du journal — **des trois côtés**, comme les
  identifiants au lot 1 : un nom remis à jour n'est pas une modification (sinon une entrée supprimée ailleurs revenait).
- **Filet dans `mvIdsParcelles`** : deux parcelles qui partagent un identifiant (une fiche recopiée) — celle dont le nom le donne
  le garde (sinon la première, dans l'ordre du document), les autres reçoivent celui de leur propre nom. Déterministe.
- **Cliquet de poids regravé** (`typo-baseline.json`) : `firebase.js` 175 → 184 Ko — dont 12 lignes de ce lot ; le reste vient de
  MOTIFS-1 (§250, autre session). Le code d'IDS-1 vit dans `src/ids.js` (pur).

### 253c. Mesuré

- **`mv-harnais-ids1b`** (neuf) : **14 assertions** — sans renommage, rien ne change ; après un renommage, chaque entrée prend le
  nouveau nom (sans identifiant ou identifiant inconnu : inchangée ; idempotent) ; les lecteurs par nom retrouvent tout
  l'historique ; un identifiant partagé n'impose aucun nom ; une fiche recopiée reçoit son propre identifiant ; la VRAIE fusion
  après un renommage : une entrée supprimée ailleurs ne revient pas, une validation faite ailleurs est gardée sous le nouveau
  nom, une entrée écrite plus tard par un téléphone resté hors ligne (ancien nom) prend le nouveau ; les trois branchements.
  **7/7 contre-épreuves.** `mv-harnais-ids1` aligné (montage, branchement de saveData) : 14 vertes, 7/7.

### 253d. Ouvert

① Lot 4 — renommer une parcelle (le bouton, la règle du domaine si besoin, et les autres endroits qui gardent un nom de
parcelle : priorités, objectifs, équipes du jour). ② Les autres registres qui portent des noms de parcelles — sessions
tracteur, registre phyto, Chai et Cuvier, contours KML — recevront le même traitement (identifiant + nom qui suit).
③ Les salariés, après le chantier du planning.

---

## 254. ★★★ IDS-1, LOT 4 — RENOMMER UNE PARCELLE (06/10 — `src/reglages.js` · `src/firebase.js` · `index.html` (ligne + panneau) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `guide/12-reglages.html` · `scripts/mv-harnais-renom-parc.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `audit-perf-ux.md` · `lots/IDS-1D.json` · **APP 8.25 → 8.26, SW 9.03 → 9.04**, base `1a1de45`)

### 254a. La décision

Proposé : l'action dans la fiche de la parcelle, à côté de « Cépage » et « Arracher ». Nico (06/10) : renommer est RARE une
fois le domaine installé — **dans la roue crantée du module**, « chaque module renomme ce qui lui appartient » ; c'est déjà là
que se renomment les tâches. Réglages › Domaine reste à ranger, dans un lot à part (maquette d'abord). Le lot 3 (compléter
les anciennes entrées) n'est plus nécessaire : le nom suit l'identifiant (§253).

### 254b. Ce qui change

- **La ligne « Renommer une parcelle »** — roue crantée de la Vigne › Parcelles & secteurs météo (administrateur : la roue
  l'est) — ouvre `ovRenParcelle` : la parcelle (toutes, arrachées signalées) et le nouveau nom.
- **Refusé** : vide, le même, plus de 60 caractères, un caractère de contrôle, le nom d'une AUTRE parcelle (même arrachée, sans
  souci de casse), l'ancien nom d'une AUTRE parcelle (elle hériterait de son historique). Accepté : changer la seule casse.
- **`_renameParcelle(ancien, nouveau, pid)`** réécrit le nom PARTOUT où il vit — la liste est celle du harnais : la parcelle (par
  son pid ; elle le GARDE) ; le journal ; les sessions tracteur (`parcellesFaites` en texte ou `{nom}`, `parcelles`, `parcelle`) ;
  le registre phyto (`parcelles`, liste ou texte) ; le Chai et le Cuvier (récoltes, analyses, cuves de vinification — saisie libre :
  comparés sans casse ni espaces) ; la fertilisation (`INTRANTS.fertil` : `parcs`, `man`) ; les contours de la carte (`name`, sans
  casse) ; les tournées (`CONFIG.ordre_passage_t`, `CONFIG.ordre_passage`). **Les travaux sont recalculés** (`recalcTravaux`),
  jamais recopiés. **Les archives des campagnes passées gardent le nom de l'époque.** Idempotent (aucun compte deux fois).
- **Une règle du domaine** (`CONFIG.renommages_parcelles` : ancien, nouveau, pid, date, auteur — le modèle de RENOM-3) :
  `_mvAppliquerRenommages` l'applique, après les règles de tâches, à chaque chargement et à chaque registre reçu (`firebase.js`
  passe désormais aussi sessions, phyto, Chai, carte, réserve) — ce qu'un téléphone resté hors ligne a saisi sous l'ancien nom
  est réécrit. Un appareil d'admin enregistre ; un appareil d'ouvrier corrige en mémoire. **Garde-fou** : si une AUTRE parcelle
  (autre pid) a repris l'ancien nom, la règle ne touche plus à rien.
- **Enregistré** : parcelles, journal, travaux, sessions, phyto, Chai, réglages ; la réserve (`saveIntrants`) ; la carte
  (`fbSave('kml_polygons')`, jamais vide).
- `WHATS_NEW` 8.26 (admin), guide 12 (Réglages).

### 254c. Mesuré

- **`mv-harnais-renom-parc`** (neuf) : **28 assertions** sur les vraies fonctions de reglages.js et un domaine fictif qui porte le
  nom dans TOUS les registres — chaque registre réécrit, les autres parcelles intactes, le pid gardé, les archives inchangées,
  la règle posée, les travaux recalculés, tout enregistré ; refus (non-admin, vide, même, autre parcelle, ancien nom d'une
  autre, longueur, contrôle) ; un autre téléphone applique la règle (saisie hors ligne comprise), sans boucle, admin enregistre,
  ouvrier non ; une nouvelle parcelle qui reprend l'ancien nom épargnée ; les règles de tâches intactes ; la casse seule ; le
  formulaire et les branchements. **14/14 contre-épreuves** (un registre oublié rougit).
- `mv-harnais-renom` (tâches) : vert, contre-épreuves 9/9 — le tri de ses règles est resté à l'identique (sa contre-épreuve
  le vise).

### 254d. Ouvert

① **Les salariés** (après le chantier du planning) : comptes de connexion, planning, relevés, profil retenu, empreinte hors
réseau. ② « Renommer » dans les autres roues crantées (tracteurs, activités…) si le besoin se présente. ③ Ranger
Réglages › Domaine (lot à part, maquette d'abord).

---

## 255. ★★ AOC-1 — LES APPELLATIONS DANS LA ROUE CRANTÉE DE LA CAVE : DEUX LIGNES, DEUX FENÊTRES (06/10 — `src/reglages.js` · `src/cave.js` · `src/styles.css` · `index.html` (deux panneaux) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-aoc-cave.mjs` (neuf) · `scripts/mv-harnais-cave-reglages.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `lots/AOC-1.json` · **APP 8.26 → 8.27, SW 9.04 → 9.05**, base `a6ea76f`)

### 255a. La décision

Nico (06/10) : Réglages › Domaine « il faudra le ranger ». Inventaire dans l'appli réelle : la carte « Appellations et
plafonds de rendement » s'accrochait APRÈS la liste des périodes (`_aocRenderCard` → `insertBefore(saisons-list.nextSibling)`),
coupant la gestion des périodes en deux (« + Nouvelle période » venait après elle). Deux options : A, une section à part dans
Domaine ; **B, la roue crantée de la Cave** (où se fixent déjà les plafonds par parcelle) — **choisie**, selon sa règle « chaque
module règle ce qui lui appartient ». Elle renverse CAVE-2 (« un réglage du domaine : on y va, on ne le recopie pas ») sans
copie : une seule carte, à un seul endroit. Sur la première maquette, Nico : « condenser — on ne voit que ça » ; seconde
maquette (deux lignes, deux fenêtres) : « parfait ».

### 255b. Ce qui change

- **Bloc « Le Millésime » de la roue crantée de la Cave** : deux lignes (`_aocResumeHtml`) — « Appellations & plafonds »
  (nombre d'appellations, plafonds du millésime le plus récent) et « Rattachement des parcelles » (rattachées ; celles sans
  appellation en orange ; arrachées non comptées). `renderCaveReglagesCave` appelle `_aocRenderCard`.
- **`ovAocPlafonds`** : le millésime (les millésimes que la Cave connaît + l'année, comme avant), une ligne par appellation —
  parcelles, plafond qu'on touche (`_aocSetMax`), « Poser le plafond » s'il manque, « ··· » (trois points médians : le « ⋯ »
  de la maquette est HORS de la police, `mv-harnais-subset`) qui ouvre Renommer / Supprimer — et
  « + Ajouter une appellation ».
- **`ovAocRattach`** : des filtres qui comptent (toutes, chaque appellation, sans), les parcelles rangées par appellation, celles
  sans appellation EN TÊTE ; « Rattacher » / « Changer » ouvre la liste des AUTRES appellations (+ « Aucune ») ; un choix
  referme la liste (`_aocAttacher` — vu dans Chromium : elle restait ouverte sous la parcelle déplacée).
- **Les actions ne changent pas** (`_aocAjouter`, `_aocRenommer`, `_aocSupprimer`, `_aocSetMax`, `_aocSetParc`) : elles
  appellent toujours `_aocRenderCard`, devenu le point de rafraîchissement des deux lignes et de la fenêtre ouverte.
- **Retirés** : l'accroche dans Réglages › Domaine, `_caveGoAoc` (le renvoi) et toute référence à `#aoc-card` (preflight C11).
- Gabarit `.aoc-*` dans `styles.css` (espacements sur l'échelle ; rayons HORS des pas, 18/14/10 px : le cliquet des rayons
  en dur de `mv-harnais-jetons` compte aussi le repli d'un appel `var(--r-lg,16px)`, et un jeton sans repli est refusé — piège
  rencontré dans ce lot). Couleurs de texte : les jetons « -tx » sur leur fond pâle (`--vert-tx`, `--or-tx`, `--orange-tx`) et le
  choix actif en vert pâle comme les puces de l'appli (`.ochip.active`) — le noir de la maquette écrivait en `--bg-card`, un
  jeton de SURFACE refusé en couleur de texte par `mv-harnais-contraste` (et l'or sur or pâle manquait de contraste).
  Guide 08 et fiche MV_AIDE : le nouvel emplacement.

### 255c. Mesuré

- **Chromium, sur le build** : Réglages › Domaine sans la carte, **2 188 → 1 293 px** (deux écrans et demi → un et demi) ;
  « Le Millésime » : les deux lignes et leurs résumés ; la fenêtre des plafonds s'ouvre (2 lignes, 40 et 55 hL/ha) ; un
  rattachement : « Sans · 1 » → « Sans · 0 », le résumé passe à « 10 parcelles rattachées » ; 0 erreur. Écrans conformes à la
  maquette validée.
- **`mv-harnais-aoc-cave`** (neuf) : **21 assertions** sur les vraies fonctions — résumés, état vide, fenêtre des plafonds
  (millésime, lignes, plafond à poser, « ⋯ », changement de millésime), fenêtre du rattachement (filtres et comptes, sans
  appellation en tête, « Changer » sans l'appellation actuelle, un choix referme la liste, filtre), rafraîchissement après une
  action, et les branchements. **12/12 contre-épreuves.** `mv-harnais-cave-reglages` aligné (44/44).

### 255d. Ouvert

① Les millésimes proposés restent ceux que la Cave connaît, plus l'année : un plafond saisi pour un millésime que la Cave ne
connaît pas n'apparaît pas (comportement d'avant, inchangé). ② IDS-1 — les salariés, après le chantier du planning.

## 256. ★★ GNR-2 — LA CUVE GNR SE LIT DE NOUVEAU SUR TÉLÉPHONE : LE BLOC TRACTEUR A SA GRILLE (06/10 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW) · `index.html` · `public/sw.js` · `scripts/mv-harnais-gnr2.mjs` (neuf) · `scripts/mv-harnais-gnr-mesure.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/GNR-2.json` · **APP 8.27 → 8.28, SW 9.05 → 9.06**, base `e3e719a`)

### 256a. Le signalement, la cause

Nico (06/10, capture de téléphone) : « revois la présentation sur portable (et aussi pc) pour la cuve gnr ». À l'écran : la carte Cuve GNR
d'Aujourd'hui dans la colonne de gauche, la droite vide ; « 920 L après les travaux en cours » sur trois lignes ; « −199 » coupé en « −19 » ;
aucune barre ; « 0625125 L » sous la cascade. **Reproduit à l'identique dans Chromium** sur la base (392 px : carte de 166 px, barre de 0 px,
lignes qui débordent ; « 0625125 » est l'échelle « 0 · 625 · 1 250 L » écrasée dans une colonne de barre réduite à rien).
**Cause, datée par l'historique** : la carte (GNR-M, §213, commit `1a75533`, 03/10) a été dessinée et regardée à 390 px quand `.pil-dec`
donnait une seule colonne au téléphone ; ALIGN-1 (§236, commit `657cb29`, 04/10) a posé « `.pil-dec` par deux sous 600 px » pour les quatre
tuiles du jour. Le bloc tracteur rendait `<div class="pil-dec pil-trx">` : la règle l'a pris aussi. La cascade réservait 104 + 46 px fixes
et deux écarts de 8 : dans 134 px de contenu, plus rien pour la barre. Sur ordinateur, `auto-fit` avec une carte en `grid-column:1/-1`
n'effondre aucune piste vide : la cuve tenait une piste sur quatre (276 px à 1 440 px), trois vides à sa droite.

### 256b. Proposé, validé, ajusté

Proposé à Nico et validé (« oui ») : téléphone et tablette, chaque carte du bloc sur toute la largeur, les quatre tuiles restant par deux ;
ordinateur, la cuve à droite des travaux (deux tiers / un tiers), la révision sous la cuve ; dans la carte, le chiffre en grand, la phrase à
côté, une cascade qui respire.
**Ajusté au rendu** : posée sous la cuve, la révision étirait la carte des travaux à la hauteur des deux cartes de droite — ~300 px vides dans
la carte de gauche à 1 280 px, le défaut même que Nico signalait le 04/10 (« deux grands vides »). Elle passe **dessous, sur toute la
largeur** ; la cuve reste à droite des travaux dans tous les cas. Dit à Nico dans la livraison.

### 256c. Ce qui change

- **`_pilCkTracteur`** : `nCote` compte les cartes qui accompagnent les travaux ; le conteneur devient `pil-trx` (+ `pil-trx-cote1` /
  `pil-trx-cote2` avec les travaux, `pil-trx-paire` pour révision + cuve sans travaux, rien pour une carte seule) ; cartes `pil-trx-rev` et
  `pil-trx-cuve` (les travaux gardent `pil-trx-wide`). Titre de la cuve : `bigN` (« 920 L », `.pil-big`, couleur d'état) et `bigP`
  (« après les travaux en cours » / « sous le seuil », `.pil-trx-vu`) dans `.pil-trx-v` — le patron du Renfort (`.rf2-v`), recopié en
  classes propres plutôt qu'emprunté : une classe partagée est précisément la cause du défaut.
- **`styles.css`** (bloc GNR-M) : `.pil-trx` a sa grille (une colonne, écart 16 px, 12 sous 600 px) ; `@media (min-width:1024px)` : cote1 et
  cote2 en `minmax(0,2fr) minmax(0,1fr)`, travaux en colonne 1 rangée 1, cuve en colonne 2 rangée 1, révision `1/-1` rangée 2, paire en deux
  colonnes. 1 024 px est le seuil « ordinateur » de KIT-2 (l'Accueil en deux colonnes) : aucun point de rupture neuf. Cascade `.pil-trx-cs` :
  `minmax(96px,min(40%,176px)) minmax(0,1fr) 56px` (libellé à 40 % borné, barre élastique, litres sur 56 px). Marge du bloc sur l'échelle
  (`--e-4`) : le 18 px recopié de `.pil-dec` faisait monter le cliquet d'espacement de `mv-harnais-echelle` (1 004 contre 1 003).
- **Rien d'autre ne lit ces classes** (vérifié : ni la visite guidée, ni l'aide, ni le guide) ; `.pil-dec` et sa règle « par deux » restent
  aux quatre tuiles — le contrôle d'ALIGN-1 est inchangé et vert. Guide, `MV_AIDE` et `MV_INFO` relus : ils décrivent le contenu, qui ne change
  pas ; rien à réécrire.

### 256d. Mesuré

- **Chromium** (`@sparticuz/chromium`, §192b) : le VRAI `_pilCkTracteur` exécuté sur un domaine reconstitué d'après la capture (11,85 ha,
  griffage lancé le 22/09, 4 parcelles désactivées, 6,63 ha à faire, 5,01 h/ha × 6 L/h, cuve 1 119 / 1 500, seuil 300), feuille, polices
  et planche d'icônes réelles. Base et lot, 5 largeurs (360, 392, 834, 1 280, 1 440 px) × 4 cas (travaux + cuve ; travaux + révision + cuve
  avec la ligne « conseillé » ; cuve seule sous le seuil ; révision + cuve sans travaux) : 40 rendus mesurés (largeur des cartes, barre,
  libellés et litres coupés, axe qui se chevauche, titre sur une ligne) et regardés ; thème sombre au téléphone.
  · 392 px — base : carte 166 px, barre 0, trois lignes qui débordent, titre sur 3 lignes ; lot : carte 344 px, barre 114 px, rien ne
    déborde, titre sur une ligne. 360 px : barre 95 px, « Après les travaux » entier.
  · 1 440 px — base : cuve 276 px sous des travaux pleine largeur ; lot : travaux 757 px et cuve 379 px côte à côte, même hauteur.
    1 280 px, trois cartes : travaux et cuve (327 px de haut chacune), révision 1 152 px dessous.
- **`mv-harnais-gnr2`** (neuf, branché) : **35 assertions** — le vrai bloc sur 6 combinaisons de cartes (classe, ordre et nom des cartes,
  jamais `.pil-dec`, balises, titre vert ou orange) ; la feuille lue règle par règle avec son `@media` (aucune règle n'ouvre plusieurs
  colonnes au bloc hors de `min-width:1024px`, mise en page ordinateur, barre d'au moins 80 px calculée pour une carte de 280 px — 96 px,
  conforme aux 95 px mesurés). **13/13 contre-épreuves** rougissent, dont « par deux revient sur le téléphone » et « la tablette passe en
  deux colonnes ».
- **`mv-harnais-gnr-mesure`** : ses deux lectures du titre suivent le nouveau balisage (le chiffre puis la phrase, collés) — même sens ;
  52 vertes, 14/14 contre-épreuves.

### 256e. Leçons

- ★★ **Une classe de mise en page partagée fait voyager les règles d'un bloc à l'autre** — consigne portée au §24 (CSS n°16).
- ★★ **Un rendu regardé ne vaut que pour la mise en page du jour où on le regarde.** GNR-M avait été vu à 390 px, juste ; un lot du
  lendemain, dans un autre écran, l'a cassé sans toucher une ligne de la carte, et aucun harnais ne regardait la grille. `mv-harnais-gnr2`
  garde maintenant la règle qui l'aurait vu.
- ★ **Le rendu a corrigé la proposition validée** (la révision sous la cuve) : une proposition en mots ne voit pas les hauteurs.

### 256f. Ouvert

① Le regard de Nico sur ses vraies données, téléphone et ordinateur (§28). ② Libellés longs coupés par des points de suspension (inchangé) ;
tablette en paysage = mise en page de l'ordinateur.

---

## 257. ★★★ IDS-1, SALARIÉS — RENOMMER UN SALARIÉ (07/10 — `src/reglages.js` · `src/app.js` (`_mvRefreshCurrentUserRoles`) · `src/firebase.js` · `index.html` (bouton + panneau) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `guide/12-reglages.html` · `scripts/mv-harnais-renom-membre.mjs` (neuf) · `scripts/mv-harnais-renom-parc.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `lots/IDS-1S.json` · **APP 8.28 → 8.29, SW 9.06 → 9.07**, base `40c3be5`)

### 257a. La décision

Nico (07/10) : « vas-y on fait ça » — après confirmation que l'autre session a fini son chantier du planning (MOTIFS-1,
VUE-EQUIPE-1). Le bouton vit dans la fiche du salarié (Réglages › Équipe), la « maison » de l'équipe, selon sa règle (chaque
module renomme ce qui lui appartient). Le nom n'était pas modifiable jusqu'ici (`em-nom` caché) : rien ne cassait, rien ne
se renommait.

### 257b. Ce qui change

- **Le compte ne change pas** : droits et règles tiennent à l'adresse et à l'uid (claims `tenant`, `adm`, `ro`, `off` ; vues
  `planning_moi_<uid>`), jamais au nom ; même mot de passe.
- **`_renameMembre(ancien, nouveau, adresse)`** réécrit le nom PARTOUT où il vit (la liste est celle du harnais) : la fiche (par
  son adresse) ; le journal (`qui`, `membresEquipe`) ; sessions et entretiens (`conducteur`, `qui`, `par`) ; phyto
  (`conducteur`, `operateur`) ; la liste des conducteurs ; le Chai (opérations : `operateur`, `intervenants` ; analyses :
  `uploaded_by`) ; le Cuvier (`cuves_vinif[].mesures_fa[].qui`) ; `CONFIG.equipes_jour` ; `CONFIG.home_layout` (clé) ;
  `CONFIG.mur_mot.par`. Il **DÉPLACE les clés par nom** du planning (`PLANNING_ENTRIES`, `PLANNING_HSUP`, `PLANNING_ACOMPTES`) et
  de la paie (`taux`, `taux_hist`, `taux_serie` ; appoints GNR : `par`), sans écraser une valeur existante. Inchangés : les
  archives des campagnes, les documents déjà imprimés.
- **Règle du domaine** `CONFIG.renommages_membres` (ancien, nouveau, adresse, date, auteur), appliquée par
  `_mvAppliquerRenommages` après tâches et parcelles, à chaque registre reçu (firebase.js : + membres, entretiens,
  conducteurs, Chai, planning, paie). Garde-fou : un AUTRE salarié (autre adresse) qui a repris l'ancien nom
  n'est jamais renommé. Admin : enregistre tout, la paie par `fbSave('paie')` (jamais sur l'appareil) ; ouvrier : mémoire.
- **Le téléphone du salarié renommé** : `_mvRefreshCurrentUserRoles` (qui le retrouve par l'ADRESSE) pose le nouveau nom sur
  la session et sur l'empreinte de connexion hors réseau (ENTREE-1 comparait les noms : sans cela, hors réseau, sa tuile
  répondait « une autre personne »). Le mot de passe et l'empreinte elle-même ne bougent pas.
- **Refusé** : non-admin, vide, le même, plus de 60 caractères, un caractère de contrôle, le nom d'un autre salarié (sans
  casse), l'ancien nom d'un AUTRE salarié. Accepté : changer la seule casse.
- `mv-harnais-renom-parc` : sa vérification de la liste des registres de firebase.js ne fige plus la chaîne (elle s'allonge).

### 257c. Mesuré

- **`mv-harnais-renom-membre`** (neuf) : sur les vraies fonctions et un domaine fictif qui porte le nom
  dans TOUS les registres — chaque registre réécrit, clés du planning et de la paie déplacées sans perte, archives inchangées,
  règle posée, tout enregistré (paie par son chemin) ; refus ; un autre téléphone applique la règle (saisie hors ligne
  comprise), sans boucle, admin enregistre, ouvrier non ; un nouveau salarié au même nom épargné ; SON téléphone : session et
  empreinte suivent. **28 assertions, 16/16 contre-épreuves.** **Défaut trouvé par le harnais avant livraison** : la sortie rapide de
  `_mvAppliquerRenommages` (« aucune règle de tâche ni de parcelle → rien ») ignorait les règles des salariés — un autre
  téléphone n'aurait jamais appliqué un renommage de salarié. **Et un second, vu dans Chromium sur le build** : l'historique
  des réparations (`REPARATEUR_HIST`) est un OBJET par tracteur, pas une liste — le parcours plantait à mi-chemin (journal et
  sessions renommés, planning non). Il ne porte d'ailleurs aucun nom : retiré ; tous les parcours passent par `arr()` (une
  liste, ou rien) ; le harnais prend la forme réelle et une contre-épreuve le vérifie (16/16).
- **Chromium, sur le build, par le vrai parcours** (fiche du salarié → « Renommer ce salarié » → Renommer) : la fiche renommée,
  ses 29 entrées du journal et sa session suivent, son planning passe sous le nouveau nom (l'ancienne clé disparaît), le
  titre de la fiche suit, la règle est posée ; 0 erreur.

### 257d. Ouvert

① **Le chat** : les conversations privées sont rangées par les deux noms (`_dmDoc(a, b)`), les messages portent `auteur` :
après un renommage, une conversation privée repart à zéro sous le nouveau nom, l'ancienne reste sous l'ancien. À traiter si le
besoin se présente. ② « Renommer » dans la roue crantée du Tracteur (tracteurs, activités) — le lot suivant.

---

## 258. ★★ IDS-1, ACTIVITÉS — RENOMMER UNE ACTIVITÉ ; LES TRACTEURS, DÉJÀ SÛRS (07/10 — `src/reglages.js` · `src/firebase.js` · `index.html` (bouton + panneau) · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `guide/06-tracteur.html` · `scripts/mv-harnais-renom-act.mjs` (neuf) · `scripts/mv-harnais-renom-membre.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `lots/IDS-1T.json` · **APP 8.29 → 8.30, SW 9.07 → 9.08**, base `40c3be5`, **zip cumulatif avec IDS-1S (§257) non poussé**)

### 258a. Ce qui a été trouvé

Nico (07/10) : « Renommer » dans les autres roues crantées (tracteurs, activités). Inventaire : les **tracteurs** se renomment
DÉJÀ dans leur fiche (`saveEditTracteur` : `t.nom` est un champ modifiable) et rien ne garde leur nom — sessions et
entretiens portent `tracteurId`, réparations rangées par `REPARATEUR_HIST[t.id]`, activités par `tracteurDefautId`. Rien à
faire. Les **activités**, elles, sont désignées par leur NOM dans chaque session (`activite`, tracteur.js) ; leur fiche
(`openEditActTrac`) ne permettait pas de le changer (`eat-act-nom` caché).

### 258b. Ce qui change

- **« Renommer cette activité »** dans sa fiche (roue crantée du Tracteur › Activités, admin) → `ovRenActivite`.
- **`_renameActivite`** : ACTIVITES (`nom`) et `SESSIONS[].activite` — le seul endroit qui garde ce nom (les autres usages sont
  des tables de correspondance en mémoire). Une TÂCHE du même nom (« Rognage ») dans le journal n'est jamais touchée.
- **Règle du domaine** `CONFIG.renommages_activites`, appliquée à chaque registre reçu (firebase.js : + `activites`). Une
  activité n'a pas d'identifiant : la règle ne touche à rien tant qu'une activité porte encore l'ancien nom (liste pas encore
  reçue, ou nom repris) ; un appareil d'admin enregistre les sessions corrigées.
- **« Traitement » ne se renomme pas, et aucun nom ne le devient** : le registre phyto crée ses sessions avec
  `activite:'Traitement'` (phyto.js) et le choix des tracteurs de traitement l'attend mot pour mot (tracteur.js, reglages.js).
- Refus : non-admin, vide, le même, plus de 40 caractères, un caractère de contrôle, le nom d'une autre activité (sans casse),
  l'ancien nom d'une autre. Accepté : la seule casse.
- `mv-harnais-renom-membre` : ses deux contre-épreuves qui visaient des chaînes allongées par ce lot sont réalignées (16/16).
- **Cliquet de poids regravé** (`typo-baseline.json`) : `reglages.js` 449 → 476 Ko, cumul de quatre lots sur deux jours (renommer
  une parcelle §254, les appellations §255, renommer un salarié §257, une activité §258), chacun sous les 5 %. Si le fichier
  continue d'enfler, les renommages (parcelles, salariés, activités, règles) pourront sortir dans leur module à eux.

### 258c. Mesuré

- **`mv-harnais-renom-act`** (neuf) : **17 assertions** sur les vraies fonctions — l'activité et ses sessions, les autres
  intactes, la tâche homonyme épargnée, la règle, tout enregistré ; refus (dont « Traitement » dans les deux sens) ; un autre
  téléphone réécrit ses sessions (saisie hors ligne comprise), sans boucle, et ne touche à rien tant que la liste n'est pas
  reçue ; les tracteurs déjà sûrs (nom modifiable, références par identifiant, aucun nom gardé) ; les branchements.
  **9/9 contre-épreuves.**

### 258d. Ouvert

Rien de prévu pour IDS-1. « Renommer » ailleurs (produits, cuves…) si le besoin se présente ; le chat (§257d).

## 259. ★★ MOUV-1 — LE SOCLE DU MOUVEMENT : JETONS, COUCHE D'ANIMATION, COURBES QUI SE DESSINENT, INFOBULLE QUI SUIT (07/10 — `src/styles.css` · `src/utils.js` (`_mvAnim`, kit graphique, APP, WHATS_NEW) · `index.html` · `public/sw.js` — APP 8.30 → 8.31 · SW 9.08 → 9.09 — base `5f9173c`)

### 259a. Pourquoi

Nico (06/10) : un Pilotage « dynamique, professionnel et qui en jette ». Maquette du cockpit « Aujourd'hui » validée en
v2 le 07/10 (« tout est ok ») : bascule Terrain / Économie, « À savoir », domaine en direct par appellation, barre
latérale. Décision : les outils actuels (JS natif, CSS pur) — React et Recharts écartés, mesure à l'appui (+774 Ko
minifiés, +21 % du paquet, et des graphiques d'un second style : l'inverse de COH-1). Plan d'intégration en lots :
MOUV-1, puis AUJ-1 à AUJ-4 ; la barre latérale (COQ-1) et Ctrl K (PAL-1) vont à la refonte de l'interface.
MOUV-1 pose ce dont tous les lots suivants ont besoin, sans changer un seul texte d'écran.

### 259b. Ce qui change

- **Les jetons** (`styles.css`, `:root`, après les graisses de DS-0) : `--mv-d1` 140 ms (réponse à un geste),
  `--mv-d2` 240 ms (petit changement d'état), `--mv-d3` 420 ms (un élément entre ou change de place), `--mv-d4` 900 ms
  (un chiffre ou une barre se remplit) ; courbes `--mv-sortie`, `--mv-glisse`, `--mv-ressort`. Sous « moins
  d'animations », les quatre durées tombent à 1 ms (bloc MOUV-1 en fin de fichier) : un écran qui les emploie s'arrête
  net sans avoir à y penser. Un écran prend ces jetons, jamais une durée en dur.
- **`window._mvAnim`** (`utils.js`, juste après `_mvGraphRepeindre`) : `reduit()`, `tween(dur, fn, ease)`,
  `compter(el, vers, fmt, dur)` (défile depuis la valeur AFFICHÉE, gardée dans `data-v` — un écran redessiné repart de
  ce qu'il montrait ; le dernier appel prend la main), `rouler(el, txt)` (un texte qui roule ; l'élément est une petite
  grille), `noter(els)` / `glisser(places)` (une liste qui change, chacun glisse à sa place), `reflet(el)` (classe
  `.mv-reflet`, un seul passage), `tracer(racine)`, `estMesure(p)`. Aucune ne lève ; toutes acceptent un élément absent.
- **Les courbes mesurées se dessinent** à la PREMIÈRE peinture d'un graphe suivi (`_mvGraphDessine` →
  `_mvAnim.tracer`). « Mesurée » suit la grammaire du kit (`MV_GRAPH_TRAIT`) : trait d'au moins 1,8, plein, sans
  remplissage, coloré. La grille, le prévu (pointillé, même épais : cave.js en a un à 2,6), les seuils, les aires et les
  points ne bougent pas. Le registre `_MV_TRACES` n'oublie jamais, contrairement à `_MV_GRAPHS` que `_mvGraphOublier`
  purge : ni au redimensionnement, ni quand un écran se redessine. Un graphe caché (`offsetParent` nul) ne consomme pas
  son tracé : il se dessinera quand on le verra.
- **L'infobulle suit** (`_mvGraphTouch`) : à la souris au survol, au doigt en glissant (le doigt se pose d'abord sur un
  point). Un trait (`.mvg-guide`) marque le point montré. Au doigt, la cible d'un `pointermove` reste l'élément du
  premier appui : on lit ce qui est SOUS le doigt (`elementFromPoint`). La boîte prend `touch-action:pan-y
  pinch-zoom` : défiler à la verticale et zoomer à deux doigts restent à la page. Montrer et cacher s'écrivent une seule
  fois : `_mvGraphMontre`, `_mvGraphCache`.
- APP 8.31, SW 9.09. WHATS_NEW au niveau 0 (le Journal seul), pour tous.

### 259c. Ce qui ne change pas

- Aucun texte d'écran, aucune donnée : l'aide (`MV_AIDE`), le guide et la démo guidée restent justes tels quels.
- Les graphes sans zone de touche ne changent pas d'un octet côté toucher. Les petites courbes des photos (trait 1,6)
  ne se tracent pas.
- ⚠️ `touch-action` : une boîte de graphe ne se fait plus glisser à l'horizontale au doigt. Aucun graphe suivi ne déborde
  (chacun est dessiné à la largeur de son conteneur, `_mvGraphW`) ; à surveiller si un graphe entre un jour dans une bande
  qui défile de côté.

### 259d. Mesuré

- **`mv-harnais-mouv1`** (neuf) : **24 assertions** sur les vraies fonctions — jetons et « moins d'animations », chiffre
  qui défile et arrive pile, reprise depuis la valeur affichée, dernier appel qui prend la main, tracé limité aux courbes
  mesurées (2 sur 6, dont un pointillé épais écarté), courbe rendue intacte, tracé à la première peinture seulement,
  graphe caché épargné, trait du point montré à l'échelle réelle, souris qui suit et s'éteint, doigt posé puis glissé,
  doigt levé, style de la boîte, version et nouveauté. **10/10 contre-épreuves.**

### 259e. Ouvert

- **AUJ-1** — la vue Terrain d'Aujourd'hui dans un module neuf `src/cockpit.js`, importé juste après `pilotage.js`
  (`pilotage.js` pèse 880 Ko, on découpe à 950). Il réutilise `_pilMargeCalc`, `_pilCockpitTimeline`, `_pilPhotosHtml`,
  les tuiles de la décision du jour, `_mvTacheDuMoment`, `_mvEqJourRender`. Une validation redessine aujourd'hui tout le
  Pilotage (`_prioRedessine` → `renderPilotage()`) : le cockpit aura sa mise à jour ciblée.
- **AUJ-2** « À savoir » ; **AUJ-3** le domaine en direct, par appellation puis par commune (les parcelles n'ont pas de
  champ lieu-dit), moteur de disposition partagé avec la vue 3D de La campagne ; **AUJ-4** la vue Économie, heures et
  euros sur la même période (la campagne).
- **COQ-1** (barre latérale) et **PAL-1** (Ctrl K) : dans la refonte de l'interface, communs à tous les modules.

## 260. ★★★ AUJ-1 — LE COCKPIT D'AUJOURD'HUI, VUE TERRAIN (07/10 — `src/cockpit.js` (neuf) · `src/pilotage.js` (`_pilTabAuj`, « Choisir les indicateurs ») · `src/app.js` (import) · `src/styles.css` · `src/utils.js` (MV_INFO, MV_AIDE, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.31 → 8.32 · SW 9.09 → 9.10 — base `5f9173c`, PAR-DESSUS MOUV-1)

### 260a. Pourquoi, et ce qui a été tranché

Deuxième lot du cockpit validé le 07/10. Exigence de Nico : **garder toutes les infos d'Aujourd'hui**. Le lot ne
retire donc rien : il range les blocs existants et ajoute ce qui manquait pour lire la journée d'un coup d'œil.
- **MOUV-1 (§259) n'était pas encore sur le dépôt** au moment du lot : AUJ-1 est bâti par-dessus et son zip contient
  les deux. Règle du doute : la version monte encore (8.32 / 9.10), puisque 8.31 / 9.09 a pu être déployée.
- **La bascule Terrain / Économie arrive avec AUJ-4**, pas ici : une bascule vers une vue vide serait en production
  une promesse creuse. Les indicateurs économiques d'aujourd'hui (budget, cadence, coût de l'inaction) restent
  visibles dans la vue Terrain jusque-là.
- **`auj_charge` existait déjà** (l'indicateur « Charge restante ») : la courbe prend sa propre clé, `auj_courbe`.

### 260b. Ce qui change

- **`src/cockpit.js`** (neuf, importé juste après `pilotage.js` ; `reserve.js` reste dernier). Il ne lit RIEN de
  l'intérieur de `pilotage.js` : `_pilTabAuj` lui passe ses morceaux tout calculés — la fin prévue et sa frise
  (`_ckHero`), le coût de l'inaction (`_ckInac`), les indicateurs (`kpis`), la décision du jour (`dec`, `det`), les
  alertes, les chantiers (`_mvkAvancement(d.data,_pilRetards())`, le même dessin que La campagne), les photos du jour
  (`_pilPhotoListe()`) et le journal. Un seul moteur par chiffre.
- **La mise en page** : une phrase de résumé, puis deux colonnes dès 1 100 px — à gauche ce qui décide (fin prévue,
  inaction, décision du jour, chantiers, courbe), à droite ce qui arrive (fil En direct, indicateurs, alertes).
- **Le résumé** (`_ckResumeHtml`) : la marge sur l'objectif, les heures à faire, les validations du jour. Ce qu'il
  ne sait pas, il le tait (marge inconnue : rien ; jamais un zéro inventé).
- **La courbe de la charge restante** (`_ckChargeSvg`) : les photos PHOTO-1 (60 jours au plus), aujourd'hui en
  direct à la place de la photo du jour, le pointillé jusqu'à la fin prévue, le trait de l'objectif (étiquette sous
  le bouton « Agrandir » du kit), trois repères de date sous l'axe (première photo, aujourd'hui, fin prévue), une zone
  de touche par photo. Inscrite au kit (`_mvGraphSuivre`) : MOUV-1 la trace à sa première apparition et l'infobulle suit.
  Moins de deux points : l'état vide du kit, jamais une ligne plate.
- **Le fil En direct** (`_ckFilDonnees`, `_ckFilHtml`) : les validations et les débuts de parcelle du jour, du plus
  récent au plus ancien, sans la météo. ⚠️ Une entrée du journal n'a pas de champ d'heure : son identifiant est
  `Date.now()` en base 16 (app.js). On le relit seulement s'il a exactement cette forme ; sinon la ligne n'a pas
  d'heure. Une équipe « a validé » au pluriel, les noms sont échappés.
- **Le direct** : une validation redessine encore tout le Pilotage (`_prioRedessine`), mais le cockpit retient ce
  qu'il montrait — les chiffres du résumé défilent depuis l'ancienne valeur (`_mvAnim.compter`), une ligne neuve du
  fil s'éclaire une fois. Rien n'exige que les téléphones de l'équipe soient à jour.
- **Repli** : si `_ckAuj` manque ou lève, l'ancien ordre s'affiche (`_mvAvale`) — jamais d'écran blanc.
- « Choisir les indicateurs » : `auj_resume`, `auj_chantiers`, `auj_courbe`, `auj_fil`. MV_INFO `pil.fil`,
  `pil.charge` ; un point dans MV_AIDE.pilotage ; un paragraphe dans le guide (§ Aujourd'hui). WHATS_NEW niveau 1,
  pastille sur le fil (`#ck-fil-pan`), pour l'admin.

### 260c. Mesuré

- **`mv-harnais-auj1`** (neuf) : **28 assertions** sur le vrai `cockpit.js` — fil (jour seul, sans météo même dite
  « Validé », ordre par l'heure de l'identifiant, identifiant mal formé sans heure, pluriel, échappement, éclairage
  des seules lignes neuves, état vide), résumé (singulier, retard, pile, silence sur l'inconnu), courbe (photo du
  jour remplacée par le direct, état vide, mesure en trait plein du kit, pointillé et objectif, zones de touche),
  mise en page (tous les blocs d'avant présents, gauche/droite, bulles, après-dessin, masquage), branchement dans
  `_pilTabAuj` et son repli, clés de « Choisir les indicateurs », ordre d'import, jetons seuls dans le style, aide,
  guide, version. **14/14 contre-épreuves.**
- `mv-harnais-mouv1` ajusté : la version courante n'est plus 8.31, sa nouveauté reste au Journal.

### 260d. Ouvert

- **AUJ-2** « À savoir » (météo par secteur et son effet sur les travaux, absences à venir, fins de contrat,
  retards, matériel, cave) — il reprendra les alertes et la carte Cave d'ici.
- **AUJ-3** le domaine en direct par appellation puis par commune ; **AUJ-4** la vue Économie ET la bascule — les
  indicateurs économiques quittent alors la vue Terrain.
- Une validation pourrait ne mettre à jour que le cockpit au lieu de tout le Pilotage : à mesurer avant de le faire.

## 261. ★★ AUJ-2 — « À SAVOIR » : MÉTÉO, ABSENCES, CONTRATS, RETARDS, MATÉRIEL ET CAVE (07/10 — `src/cockpit.js` · `src/pilotage.js` (`_pilEtatEntree`, Cave, retards, « Choisir les indicateurs ») · `src/styles.css` · `src/utils.js` (MV_INFO, MV_AIDE, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.32 → 8.33 · SW 9.10 → 9.11 — base `dd20754`)

### 261a. Pourquoi, et les règles

Nico (07/10) veut un encart « des choses importantes à savoir » : pluie demain sur un secteur, le brûlage qui devra
attendre, untel en CP, en formation. Règles proposées puis validées (« suite ») ; décision : **la météo d'abord au
niveau du domaine, le détail par secteur dans un lot suivant** — le cache par commune (`mavigne_meteocom_cache`) ne
porte que la journée ; les prévisions heure par heure sur 5 jours (`METEO_HOURLY`, chargées par l'Accueil, cache
`mavigne_meteohr_cache`) sont celles du domaine.
- **Météo** : demain et après-demain ; pluie ≥ 2 mm sur le jour (avec la plage horaire) ou vent ≥ 40 km/h ; si un
  brûlage n'est pas fini, la ligne dit qu'il attendra (priorité haute). Sans prévisions : rien, jamais d'invention.
- **Absences** : les 7 jours qui viennent (aujourd'hui est dans la tuile « Présences ») ; la première plage de chaque
  personne (congé, récup, arrêt, absence), avec le motif saisi s'il y en a un, sinon la date de retour.
- **Contrats** : les fins dans les 30 jours (`fin_contrat`), avec le bouton « Simuler un renfort ».
- **Retards** : fenêtre passée (`_mvkRetards`) ET tâche pas finie, avec son pourcentage et « Voir La campagne ».
- **Matériel immobilisé et cave** : les blocs d'avant rangés au bas de l'encart ; « À savoir » masqué, ils reviennent
  à leur place.

### 261b. Ce qui change

- **`_pilEtatEntree(e)`** (pilotage.js, exposé) : l'état d'une journée de planning écrit une seule fois ; `_pilData`
  (présences du jour) et « À savoir » (absences à venir) le lisent. Le texte de la règle est inchangé.
- `_pilTabAuj` passe au cockpit la Cave à part (`_ckCave`, retirée des indicateurs) et les retards (`_pilRetards()`).
- **cockpit.js** : `_ckSvMeteo`, `_ckSvAbsences`, `_ckSvContrats`, `_ckSvRetards` (fonctions pures, testées seules),
  `_ckSavoirHtml` (le plus pressant d'abord, textes échappés), l'encart en tête de la colonne de droite.
- « Choisir les indicateurs » : `auj_savoir`. MV_INFO `pil.savoir` ; MV_AIDE et le guide décrivent l'encart.
  WHATS_NEW niveau 1, pastille sur `#ck-savoir`, pour l'admin.
- ⚠️ **Pas encore fait** : ce qu'une prolongation de contrat ferait gagner sur la fin prévue (le simulateur de renfort
  ne prend pas encore une fin de contrat repoussée) ; le détail météo par secteur ; les traitements (ils ont la tuile
  « Traiter ? »).

### 261c. Mesuré

- **`mv-harnais-auj2`** (neuf) : sources, rendu, branchement, style, aide et version sur les vraies fonctions, avec
  ses contre-épreuves. `mv-harnais-auj1` suit l'appel élargi et la version 8.33.

### 261d. Ouvert

- Détail météo par secteur (appel par commune sur deux jours) ; gain d'une prolongation de contrat ; **AUJ-3** le
  domaine en direct ; **AUJ-4** la vue Économie et la bascule.

## 262. ★★ AUJ-3 — LE DOMAINE EN DIRECT : LES PARCELLES PAR APPELLATION, L'ÉTAT PAR TÂCHE (07/10 — `src/cockpit.js` · `src/pilotage.js` (fenêtres, parcelles, « Choisir les indicateurs ») · `src/styles.css` · `src/utils.js` (MV_INFO, MV_AIDE, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.33 → 8.34 · SW 9.11 → 9.12 — base `dd20754`, PAR-DESSUS AUJ-2)

### 262a. Ce qui a été tranché

- **AUJ-2 n'était pas encore sur le dépôt** : AUJ-3 est bâti par-dessus, son zip contient les deux.
- **Un schéma, pas une carte** : une bande par appellation (de la plus grande à la plus petite), les communes dedans
  (les parcelles n'ont pas de champ lieu-dit), une bande par parcelle dont la largeur suit la surface À LA MÊME
  ÉCHELLE POUR TOUT LE DOMAINE (rangée d'environ un quart du domaine, au moins 1,5 ha ; retour à la ligne au-delà).
- **Toucher une parcelle ouvre sa fiche** (`openSelParc`) : on y valide par le chemin de toujours. Une feuille de
  validation neuve aurait doublé le chemin d'écriture du journal — écarté.
- **L'état vient du journal** : faite = une validation (ou « Terminé ») depuis l'ouverture de la fenêtre de la tâche
  (`taskWindows`, passées par `_pilTabAuj`) ; en cours = un début sans validation après ; en retard = fenêtre passée
  et pas faite ; arrachée = statut de la parcelle. Les tâches à passages ou à niveaux ne sont pas proposées.
- **Équipes du jour** : les initiales sur une parcelle commencée aujourd'hui et pas encore validée.

### 262b. Ce qui change

- `cockpit.js` : `_ckPlanEtats`, `_ckPlanDispo`, `_ckPlanSvg`, `_ckPlanEquipes`, `_ckPlanTaches` (fonctions pures),
  `_ckPlanCorps` (sélecteur de tâche, plan, légende chiffrée), `_ckPlanTache` (change de tâche sans redessiner tout le
  Pilotage), `_ckPlanOuvrir`. Le panneau se place après la décision du jour ; l'avancement de chaque appellation (en
  hectares faits) est écrit dans son en-tête.
- `_pilTabAuj` passe `fenetres` (`_rfCd().taskWindows`) et `parcs`. « Choisir les indicateurs » : `auj_plan`.
  MV_INFO `pil.plan` ; MV_AIDE et le guide décrivent le plan. WHATS_NEW niveau 1, pastille sur `#ck-plan`.

### 262c. Mesuré

- **`mv-harnais-auj3`** (neuf) sur les vraies fonctions, avec ses contre-épreuves ; `mv-harnais-auj2` suit la version.

### 262d. Ouvert

- Le moteur de disposition est prêt pour la vue 3D de La campagne (mêmes bandes, mêmes surfaces) ; la forme des
  contours KML n'y est pas encore. **AUJ-4** : la vue Économie et la bascule.

## 263. ★★ AUJ-4 — LA BASCULE TERRAIN / ÉCONOMIE (07/10 — `src/cockpit.js` · `src/pilotage.js` (`window._pilTabEco`, tuile Budget, « Choisir les indicateurs ») · `src/styles.css` · `src/utils.js` (MV_AIDE, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.34 → 8.35 · SW 9.12 → 9.13 — base `dd20754`, PAR-DESSUS AUJ-2 ET AUJ-3)

### 263a. Ce qui a été tranché

- **AUJ-2 et AUJ-3 n'étaient pas encore sur le dépôt** : AUJ-4 est bâti par-dessus, son zip contient les trois.
- **La vue Économie reprend l'onglet Économie TEL QUEL** (`_pilTabEco`, moteur `_pecData`) : aucun chiffre recalculé
  dans le cockpit, et la période est celle de ce moteur — la règle de Nico (jamais l'exercice comptable en euros face
  à l'année vigne en heures) se tient parce qu'il n'y a qu'un moteur. L'atterrissage, le « dépensé face au fait » et
  les écarts par appellation de la maquette restent à construire DANS ce moteur (onglet Économie, après L'année).
- Le coût de l'inaction et la tuile Budget quittent la vue Terrain pour la vue Économie ; vue Économie masquée
  (`auj_eco`), ils reviennent sur le terrain.

### 263b. Ce qui change

- `cockpit.js` : `_ckBasculeHtml`, `_ckVue` (bascule sans redessiner le Pilotage ; la vue Économie se dessine au
  premier passage, puis à chaque dessin tant qu'on y reste ; les graphes se repeignent à la bonne largeur), deux
  conteneurs `.ck-vue` ; le choix tient le temps de la session.
- `pilotage.js` : `window._pilTabEco` (le contenu de l'onglet, exposé), la tuile Budget capturée à part (`_ckBud`),
  `eco:_pilShow('auj_eco')`. MV_AIDE et le guide décrivent la bascule ; WHATS_NEW niveau 1 sur `#ck-bascule`.

### 263c. Mesuré

- **`mv-harnais-auj4`** (neuf) avec ses contre-épreuves ; `mv-harnais-auj3` suit la version.

### 263d. Ouvert

- Dans le moteur économique (`_pecData`) : l'atterrissage de la campagne, le « dépensé face au fait », le coût à
  l'hectare par appellation — à décider avec Nico lors de la reprise de l'onglet Économie.
- Détail météo par secteur (§261) ; gain d'une prolongation de contrat (§261).

## 264. ★★ SECT-1 — LA MÉTÉO PAR SECTEUR DANS « À SAVOIR » (07/10 — `src/app.js` (`_wxCurrent`, `_wxDeuxJours`, `_wxFromApi`, `_WXCOM_V` 3, `window._wxSecteurs`) · `src/cockpit.js` (`_ckSvMeteo`) · `src/utils.js` (MV_INFO, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.35 → 8.36 · SW 9.13 → 9.14 — base `8b77624`)

### 264a. Pourquoi

Suite convenue d'AUJ-2 (§261) : la météo d'abord au niveau du domaine, puis secteur par secteur. Le relevé par
commune de l'Accueil (`fetchMeteoCommunes`, un appel par commune, dès deux communes) ne portait que la journée.

### 264b. Ce qui change

- **`_wxCurrent`** demande aussi `hourly=precipitation,windspeed_10m` sur `forecast_days=3` — le même appel, pas un
  de plus. **`_wxDeuxJours`** garde les deux jours qui SUIVENT celui du relevé (reconnu par sa date dans la série,
  `timezone=Europe/Paris`, pas par l'horloge du téléphone) ; `_wxFromApi` les range dans `wx.h`. Le reste du relevé
  (température, pictogramme, probabilité du jour) est inchangé.
- **`_WXCOM_V` passe à 3** : un relevé d'avant n'a pas `h` et ne se relit pas — l'Accueil refait ses appels une fois.
- **`window._wxSecteurs()`** : la mémoire (`METEO_PAR_COMMUNE`) d'abord, sinon le cache du même domaine de moins de
  12 h ; jamais d'appel réseau.
- **`_ckSvMeteo`** : secteur par secteur quand il y en a (une ligne par jour : « Pluie annoncée sur Brochon : 6 mm,
  de 8 h à 11 h », ou plusieurs communes avec leurs cumuls ; le vent fort dit où). Si un brûlage n'est pas fini, on
  compte ses parcelles pas encore faites DANS les communes touchées (états du plan d'AUJ-3). Un seul secteur, ou pas
  encore de relevé par commune : les prévisions du domaine, comme avant. Mêmes seuils (2 mm, 40 km/h).

### 264c. Mesuré

- **`mv-harnais-sect1`** (neuf) : l'appel, les deux jours gardés, la version du cache, le lecteur (mémoire, cache du
  même domaine, âge), la règle par secteur et le repli sur le domaine, avec ses contre-épreuves.

### 264d. Ouvert

- Gain d'une prolongation de contrat (§261) ; ajouts au moteur économique (§263).

## 265. ★★ PROL-1 — CE QU'UNE PROLONGATION DE CONTRAT FERAIT GAGNER (07/10 — `src/pilotage.js` (`_pilGainsProlong`, `_pilIsoJ`) · `src/cockpit.js` (`_ckSvContrats`, `_ckProlong`) · `src/utils.js` (MV_INFO, APP, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` — APP 8.36 → 8.37 · SW 9.14 → 9.15 — base `8b77624`, PAR-DESSUS SECT-1)

### 265a. La règle

Promis en AUJ-2 (§261) : un contrat qui finit dans les 30 jours dit ce qu'une prolongation ferait gagner.
- **Même simulateur** que le coût de l'inaction et Décider › Renfort : `_rfPair(d).dec` → `_rfSim`.
- **Prolonger d'un mois = une personne de plus**, des semaines qui suivent la fin du contrat (`_rfWOf(W, fin+1)`)
  jusqu'à un mois après (`fin+30`), **à rendement plein** : elle connaît le travail, `c.rdt = 1` sur une COPIE du
  contexte (le contexte partagé n'est jamais modifié).
- **Le gain se dit dans les mesures du coût de l'inaction** : heures de rattrapage évitées (`induit`, avec les euros au
  taux de l'équipe) et tâches ramenées dans leur fenêtre (`horsDelai`). Aucun gain : la phrase le dit. Pas de taux,
  pas de campagne en cours : la phrase d'avant (« simulez un renfort »).
- SECT-1 n'étant pas encore sur le dépôt, son zip contient les deux lots.

### 265b. Mesuré

- **`mv-harnais-prol1`** (neuf) sur les vraies fonctions, avec ses contre-épreuves ; `mv-harnais-sect1` suit la version.

### 265c. Ouvert

- Les ajouts au moteur économique (§263) ; la barre latérale et Ctrl K (refonte de l'interface).
