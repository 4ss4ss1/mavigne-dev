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
