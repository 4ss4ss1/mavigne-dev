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
