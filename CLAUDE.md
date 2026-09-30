# Ma Vigne — Instructions personnalisées

> Document de référence du projet **Ma Vigne** (GUERETTECH). Il est le **porteur de vérité** :
> la mémoire Claude est plafonnée, ce fichier ne l'est pas.

> Dernière consolidation : **29 septembre 2026 (ROB-2 Accueil/Journal — ROB-2 TERMINÉ)** — ★★ **LE TIRAGE AU HASARD COUVRE
> DÉSORMAIS TOUS LES MODULES** : Planning, Pilotage, Cave/Cuvier, Tracteur, Réserve, Accueil/Vigne/Journal. Le dernier a trouvé un
> vrai défaut de production : **« NaN h » restantes dans la fiche d'une parcelle** dès que la période portait l'Entreplantation
> (`openDP`), et en relisant l'entrée 26 du backlog, **« NaN h » au total de l'Accueil** dès qu'une tâche « en temps réel » est
> activée (`calcHeures`). Les deux corrigés ; entrées 26, 0h et REV-1 ④ rayées. Posé sur **ARRACH-1** (§196, `c3cccda`, APP 7.78 · SW 8.51 : arracher une parcelle depuis
> sa fiche). **Bump SW 8.51 → 8.52, APP 7.78 inchangé** (invisible).
> Consolidations précédentes : `docs/claude/journal.md`.

---

## 🧭 Mode d'emploi — CE FICHIER EST LE CŒUR : IL SE LIT EN ENTIER

> ★★★ **Depuis le 27/09 (§189), la documentation est scindée.** Ce fichier faisait 23 910 lignes, dont
> **1 190 lignes d'historique AVANT la première règle d'or** : les consignes se perdaient dans le récit.
> Il ne garde que ce qui s'applique **à chaque lot**, et il se lit **en entier** en tête de session.

| Fichier | Contenu | Quand le lire |
|---|---|---|
| `CLAUDE.md` | règles d'or · environnement · communication · socle technique (§1–§8c) · pièges (§24) · workflow de patch (§25) · accompagnement (§27a) · backlog (§28) · mémoire (§29) | **en entier, en tête de session** |
| `docs/claude/modules.md` | comment chaque module fonctionne aujourd'hui (§9–§23, §26–§27f sauf §27a) | **la section du module, AVANT de le toucher** |
| `docs/claude/chantiers-NNN-MMM.md` | le récit des chantiers §30 et suivants : mesures, arbitrages, pièges | à la demande (référence « §N », fonction touchée) |
| `docs/claude/journal.md` | les consolidations précédentes (l'ancien en-tête) | rarement : archive |
| `docs/claude/INDEX.md` | **GÉNÉRÉ** — chaque section → son fichier | pour résoudre un « §N » |

**Les quatre réflexes :**
1. **Une référence « §N »** (ici, dans un commentaire de script, dans un changelog) → `docs/claude/INDEX.md`,
   ou directement `grep -n "^## N\." CLAUDE.md docs/claude/*.md`.
2. **Avant de modifier une fonction, chercher son nom dans toute la doc** :
   `grep -rn "_pilPicPortee" CLAUDE.md docs/claude/`. Le chantier qui l'a écrite raconte ses pièges —
   c'est ce qu'une relecture du code ne redonne jamais.
3. **Où écrire (règle d'or n°6)** : une nouvelle section chantier §N → le fichier `chantiers-*` dont la
   tranche contient N (tranches de 50 ; au-delà de la dernière, créer le suivant sur le même modèle) ·
   une consigne qui vaut pour **tout** lot → **ici** (règle d'or, §24, §25, §27a) · la nouvelle
   consolidation **remplace** celle de l'en-tête, l'ancienne descend **en tête** de `journal.md` ·
   puis `node scripts/mv-claude-index.mjs` (le `--check` de `npm run check` rougit sinon).
4. **Ce fichier a un plafond de lignes** (cliquet dans `harnais-claude-md.mjs`). S'il déborde, on
   descend de l'**historique** vers `docs/claude/`, jamais une **consigne**.

---

## ⚖️ Les six règles d'or

**Règle d'or n°1 — la vérité est dans les fichiers réels.**
`/mnt/project` **bouge en cours de session**, peut être **incomplet**, et surtout **peut être en
retard d'un lot entier**. Vécus : `firebase.js` disparu en pleine session · `tracteur.js` purement
absent le 26/07 · le **01/08, tout le dossier était figé à l'état de la veille au soir**, ce qui a
produit **trois affirmations fausses** dans un audit pourtant méthodique · le **03/08, un upload de
Nico était lui-même antérieur au dernier fichier livré** · le **07/08, cinq fichiers étaient
absents à 06:49 puis montés à 06:55, en cours de session** · et le **09/08, l'`admin-gt.js` uploadé
par Nico était PLUS RÉCENT que celui de `/mnt/project`** (il portait son correctif SVG du 06/08 et
un écran de remise d'abonnement inconnu du dossier).
**La fraîcheur se mesure, elle ne se suppose ni dans un sens ni dans l'autre — et un constat
d'absence a une durée de vie de quelques minutes.**

★★★ **DEPUIS LE 10 AOÛT (SOIR) — LE DÉPÔT GITHUB REMPLACE L'UPLOAD POUR LA LECTURE DU CODE.**
Le code vit dans `github.com/4ss4ss1/mavigne-dev` (**public**, cloné en HTTPS anonyme — c'est la
condition qui rend le clone possible sans identifiants). En tête de toute session de travail sur le
code : `git clone https://github.com/4ss4ss1/mavigne-dev.git` (ou `git pull` si déjà cloné dans la
session en cours) dans `/home/claude/mavigne-dev/`, puis lire les fichiers réels de là — jamais
depuis une mémoire de la structure d'une session précédente.
⚠️⚠️ **Le clone NE PERSISTE PAS d'une conversation à l'autre.** Le bac à sable Claude repart à
zéro à chaque nouvelle conversation — seuls `/mnt/user-data/outputs` et les uploads accumulés
survivent DANS une même conversation, jamais entre deux. **Réflexe : si `/home/claude/mavigne-dev`
n'existe pas, cloner avant toute autre chose.** Si le dossier existe déjà dans la session en cours
mais que Nico vient de dire avoir poussé un changement, `git pull` avant de faire confiance au
contenu — **c'est le même principe de fraîcheur que pour `/mnt/project`, sur une mécanique
différente.**
★★★ **VÉCU LE 13 AOÛT — LA FRAÎCHEUR SE RE-MESURE AVANT *CHAQUE LIVRAISON*, PAS UNE FOIS PAR
SESSION.** Clone à **07:33**, quatre lots livrés en **fichiers complets** jusqu'à **20:31**. Entre
les deux, **six commits** poussés par Nico (le chantier CONTRATS, §37). L'intégration a écrasé ce
chantier : **331 lignes** perdues dans `reglages.js`, **216** dans `utils.js`, **171** dans
`planning.js`, **19** dans `app.js` — dont un correctif écrit le matin même.
**Rien dans la session ne le signalait** : le clone était bon *au moment où il a été fait*, les
patchs s'appliquaient sans erreur, tous les contrôles passaient — **sur une base morte**.
- **Un fichier COMPLET livré depuis une base vieille de quelques heures est une bombe à retardement.**
  Un patch qui ne trouve pas son ancre échoue bruyamment ; un fichier complet, lui, écrase en silence.
- **Le réflexe** : `git pull` (ou re-clone) **juste avant** de construire le paquet, puis vérifier que
  `git log -1` porte bien le commit sur lequel on a travaillé. Si ce n'est pas le cas : **rejouer les
  patchs sur la base neuve**, ne jamais livrer les fichiers construits sur l'ancienne.
- **Ne pas se fier au silence de Nico.** Il n'a pas à annoncer chaque push : c'est son dépôt, il y
  travaille. C'est à Claude de re-mesurer.
- **Réparation, si c'est déjà arrivé** : ne PAS fusionner à la main. `git revert` du commit fautif
  (opération exacte, testée avant d'être conseillée : le résultat était identique au caractère près),
  puis rejouer les patchs sur la base restaurée. Les ancres retrouvées **une seule fois chacune**
  prouvent que les deux travaux ne se marchent pas dessus ; celles qui manquent désignent exactement
  les endroits à arbitrer.
- ⚠️ **Corollaire sur les numéros de version** : travailler sur une base périmée fait **réutiliser des
  numéros déjà servis**. Le 13/08, `6.58`, `6.60` et `6.61` ont porté **deux contenus différents**,
  tous deux déployés. Un client passé sur l'un ne prendra **jamais** l'autre. Sauter un numéro ne
  coûte rien ; en réutiliser un fige un client pour toujours.

⚠️ **Le dépôt est PUBLIC** — condition nécessaire au clone anonyme. S'il redevient privé, le clone
échoue avec `fatal: could not read Username for 'https://github.com'` : le dire à Nico plutôt que
de deviner une autre cause. Après un clone/pull, `git log -1` pour dater ce qu'on lit et le
comparer à ce que Nico vient de décrire avoir poussé.

⚠️⚠️⚠️ **CE QUI NE CHANGE PAS : LA LIVRAISON.** Claude n'a **aucun accès en écriture** au dépôt
(pas de token, pas de credentials — et ça doit le rester : ne jamais demander à Nico de coller un
token GitHub dans la conversation). Claude continue de livrer des **fichiers complets patchés** via
`present_files`. **Nico les réintègre à la main** (copier-coller dans l'Explorateur, dans
`mavigne-dev\`), **puis commit + push via GitHub Desktop.** Deux flux distincts : lecture directe
(GitHub, automatique, côté Claude), écriture manuelle (copier-coller + GitHub Desktop, côté Nico).

**Pour le code de l'app** : toujours cloner/lire depuis le dépôt, jamais l'annoncer ni l'attendre
en upload. **Pour tout ce qui ne vit pas dans le dépôt** (ce document tant qu'il n'y est pas
commité, archives légales, captures d'écran) : toujours **annoncer ce qu'on attend**, attendre
l'upload, puis travailler **exclusivement** depuis lui.

Jeu standard de fichiers TOUCHÉS par étape module (repère utile pour la livraison et le commit,
plus pour l'upload) = `index.html` + `styles.css` + `sw.js` + le JS du module ; `utils.js`
seulement si l'étape le touche vraiment ; `app.js` seulement si dock/gating/routage bougent.

⚠️ `/mnt/project` (l'ancien mécanisme d'upload de projet) est **déprécié**, remplacé par le clone
GitHub pour tout ce qui est code — s'il apparaît encore dans un contexte, s'en méfier comme d'un
upload potentiellement périmé, jamais comme source de vérité. Il reste **légitime en lecture
d'exploration** tant qu'aucun patch n'en sort. **Mais toute conclusion tirée de cette lecture doit
être confirmée sur le dépôt (ou un upload) avant d'être écrite ici.**

★★ **Deux mécaniques de session à connaître :**
- **`/mnt/user-data/uploads` ACCUMULE** les fichiers d'un tour à l'autre dans une même
  conversation. Un `cave.js` envoyé trois tours plus tôt y est encore. Utile — et piégeux :
  il peut être **périmé** par rapport à ce qui a été livré depuis.
- **`/mnt/user-data/outputs` PERSISTE** aussi, et contient les **derniers fichiers livrés**.
  C'est une source valide, à condition de le **dire explicitement** et de vérifier que Nico ne les
  a pas retouchés. ★ Vécu les 07/08 et 09/08 : de nombreux lots sont repartis des sorties du lot
  précédent, sans upload, en le disant à chaque fois.
  ⚠️⚠️ **Corollaire vécu le 09/08 : ne jamais RETIRER des sorties un fichier qu'on pourrait devoir
  repatcher.** J'ai supprimé `app.js` des sorties en croyant le lot clos ; le lot suivant en avait
  besoin. Il a fallu le reconstruire depuis l'upload d'origine en rejouant le patch, puis **prouver
  par md5** que le résultat était bien celui livré. Ça a marché parce que le patch était
  déterministe — ce n'est pas toujours le cas.
  ★ **Corollaire inverse, demandé par Nico le 09/08 au soir** : ne pas **re-présenter** à chaque
  livraison les fichiers inchangés. Les laisser dans les sorties, ne présenter que le livrable
  courant.
  ★★★ **Corollaire du 14/08 — NE JAMAIS LIVRER UN FICHIER QU'UN SCRIPT FABRIQUE.**
  `public/guide.html` est produit par `scripts/build-guide.mjs`. Livré à côté de sa source, il a
  coûté **deux allers-retours de CI** — une fois la source manquait, une fois c'est le généré qui
  était revenu en arrière. **On livre l'entrée, on nomme la commande.** Détail : §27d.
  ⚠️ **Et le dossier de sortie est PLAT** : impossible d'y créer `guide/11-pilotage.html`. Tout
  fichier dont le nom de livraison diffère de son nom dans le dépôt doit voir ce renommage
  **annoncé en tête de réponse**, en clair. Sinon il n'est pas intégré, et rien ne le signale.

★ **Le réflexe md5, systématique — pour ce qui n'est PAS dans le dépôt.** Quand un upload est censé
contenir un patch livré plus tôt, comparer son empreinte à celle du fichier de sortie **avant** de
travailler dessus. Vécu cinq fois. **Le md5 sert dans les deux sens : détecter un upload périmé, et
confirmer qu'un lot est bien en place.** ★ **Pour le code du dépôt, `git log -1` + `git pull`
remplacent ce réflexe** : plus besoin de comparer une empreinte, il suffit de relire après un pull.

★ **Nico patche parfois lui-même.** Le 06/08, il a corrigé un défaut réel de mon lot : un SVG en
`width:100%; height:auto` s'étirait à ×5 sur écran large. **Sa version fait foi** — on repart de
son fichier (celui du dépôt, après `git pull`), jamais du dernier livrable de Claude, dès que le
contenu diffère.

⚠️ **Exception explicitement autorisée** : un fichier que Nico accepte de voir régénéré sans upload
(cas du `README.md`, et de ce document). Le dire **avant** de livrer, pas après.
★ **Piste ouverte depuis le 10 août** : committer CE document lui-même dans le dépôt (par exemple
en `CLAUDE.md` à la racine, convention reconnue par les outils Claude) pour qu'il soit, lui aussi,
lisible directement sans upload ni régénération. Tant que ce n'est pas fait, l'exception ci-dessus
et la procédure qui suit restent pleinement en vigueur pour ce document précis.

⚠️⚠️ **MAIS L'EXCEPTION A UNE CONDITION, apprise le 10 août.** Régénérer ce document **de mémoire**
produit une version **en retard**, et une version en retard **affirme des choses fausses avec
l'autorité du porteur de vérité. Vécu** : document reconstitué et daté « 9 août **soir** » alors
que le vrai était daté « 9 août **nuit** » — **tout le chantier de l'assistant d'installation
manquait** (§18b, §18c), la CF `submitMiseEnRoute` figurait encore au backlog **alors qu'elle est
livrée**, et deux affirmations sur l'import KML étaient **fausses depuis ce même chantier**.
La mémoire, elle, contenait le chantier : **je ne l'avais pas relue assez attentivement.**

**Procédure avant toute régénération, dans cet ordre :**
1. **Lire la ligne « Dernière consolidation » du document en contexte** et la comparer aux dates
   citées dans la mémoire. ⚠️ Le document fourni au fil d'une conversation peut être **tronqué** :
   vérifier qu'on voit bien la **dernière section**, pas seulement les premières.
2. **Si le document est plus récent que ce que je sais, ou si je n'en vois pas la fin :
   DEMANDER L'UPLOAD.** Régénérer alors depuis lui, jamais depuis la mémoire seule.
3. Ne régénérer de mémoire que si l'on sait, **et qu'on peut le prouver**, qu'aucun lot n'est
   passé depuis la dernière consolidation.
★ **Et dans tous les cas, l'annoncer AVANT de livrer** — ce qui n'est pas seulement une politesse :
c'est ce qui a permis de repérer l'écart au tour suivant.

★★★ **COROLLAIRE APPRIS LE 11/08 — la règle vaut pour MES PROPRES AFFIRMATIONS.**
Pendant la refonte du Planning, j'ai annoncé comme un fait que la visite guidée casserait
(`openPlanFiche('Jean')` en dur dans `_mvtSteps`). **C'était faux, et je ne l'avais pas mesuré** :
les deux étapes visent `.pl2-board`, qui reste dans l'onglet par défaut, et un overlay indépendant
de l'onglet actif. **Le risque a servi d'argument dans un arbitrage de découpage avant d'être
vérifié.** Un constat que j'énonce n'est pas plus frais qu'un dossier `/mnt/project` : il se mesure.
**Dire « à vérifier » coûte un mot ; dire « ça casse » engage une décision.**

**Règle d'or n°2 — aucun numéro de version dans ce document.**
★ Ce qui reste autorisé : les **numéros de rappel de pièges** (`v5.12` du commentaire Élevage, §7).
Tout le reste est banni, **y compris dans l'historique du §28** — une version écrite ici finit
toujours par être recopiée à la place d'être lue.
Toujours **lire** avant de travailler : `APP_VERSION` dans `src/utils.js`, la version SW dans
l'en-tête de `sw.js` **et** `CACHE_NAME`, les **4 affichages** dans `index.html`.
**Deux séquences indépendantes** (APP et SW) : ne jamais déduire l'une de l'autre.
`package.json` reste figé à `1.0.0`.

**Règle d'or n°3 — VÉRIFIER, NE PAS CROIRE.**
Ce document décrit l'**intention** ; `src/` est la **réalité**. `grep` **avant** d'affirmer qu'une
chose est faite ou en attente — dans les deux sens.

| Ce que le doc disait | Ce que dit le code |
|---|---|
| « le lot DOCK n'est pas dans le code » | **il y est** (rejoué le 04/08) |
| « Vigneron admin : 5 items » | **Vigneron = 4 modules** |
| « Pilotage = 6 onglets » | **7** — Conformité était sorti du document, pas du code |
| la garde `hv2-meteo-card` protège la météo | elle **tuait le repli hors-ligne depuis la mise en service** |
| **`index.html` vit dans `src/`** | **il est à la RACINE** (`vite.config.js` : `root:'.'`) |
| **CSP en `Report-Only`, SEC-3 au backlog** | **elle est en ENFORCE**, et l'était déjà |
| **`mvprint.py` est perdu** | **retrouvé le lendemain matin** |
| « il faut ajouter un retrait de fût » | **`openOvRetraitFut` existait déjà** |
| « la section Import/Export vit dans `reglages.js` » | **elle est en dur dans `index.html`** |
| « il faut un filtre millésime dans le Chai » | **`_caveMillFilter` existe depuis longtemps** |
| « les moteurs `_mvFut*` se lisent sans argument » | **`_mvFutParc(INTRANTS, CAVE_ELEVAGE, curY)`** |
| « la baseline a été regravée le 07/08 » | **elle datait du 26/07** — l'affirmation était fausse |
| ★★ **l'aide contextuelle décrit les écrans** | **elle décrivait ceux d'il y a plusieurs mois** |
| ★★★ **« il n'y a pas d'assistant d'installation »** | **`_agtIns` EXISTAIT et avait servi pour le second domaine** (§18b) |
| ★★ **« l'import KML n'écrit QUE les polygones »** | vrai de l'**onglet KML**, FAUX de l'**assistant** |
| ★★★ **la grille du Pilotage est réglée sur 1 colonne** | elle est réglée sur **2 à 4** — elle ne se remplissait jamais parce que **les 18 tuiles arrivaient ouvertes** |
| ★★ **« il n'existe aucune infobulle dans l'app »** | **exact**, et c'était le problème : zéro `<details>`, zéro popover, dans tout le projet |
| ★★★ **`PIL_TREAT_DAYS` existe** | **je l'ai inventée.** `node --check` ne voit pas un identifiant inconnu : seule l'exécution l'aurait levé |
| ★★ **`A8` du harnais d'audit est un cliquet** | c'était un cliquet **à l'envers** : il rougissait quand on AJOUTAIT un bouton de redirection |
| ★★★ **« INTERNAL ASSERTION FAILED » est bénin, « le pull getDoc réussit »** (commentaire d'`app.js`) | **le SDK met sa file hors service** : toute lecture, écriture, écoute suivante échoue — et la trace partait par ce même Firestore (§145) |

À l'inverse, l'audit trouve régulièrement du **travail déjà fait** encore listé au backlog.

⚠️ **Corollaire vécu le 30/07** : la règle vaut aussi pour le **code neuf**.
⚠️⚠️ **Corollaire vécu le 31/07** : elle vaut aussi pour ce qui est **EN LIGNE**.
⚠️⚠️⚠️ **Corollaire vécu le 01/08** : l'**outillage** aussi peut être en retard.
⚠️⚠️⚠️⚠️ **Corollaire vécu le 03/08** : un **changelog n'est pas une preuve**. Lire la fonction.
⚠️⚠️⚠️⚠️⚠️ **Corollaire vécu le 04/08 matin** : **livrer n'est pas intégrer**.
⚠️⚠️⚠️⚠️⚠️⚠️ **Corollaire vécu le 04/08 soir** : un constat exact **devient faux dans la journée**.
⚠️ **Corollaire vécu le 05/08** : un fichier « perdu » ne l'est **qu'après avoir cherché ailleurs**.
★★ **Corollaire vécu le 06/08 — chercher AVANT de proposer d'ajouter.**
★★★ **Corollaire vécu le 07/08** : **vérifier la SIGNATURE D'ENTRÉE d'une fonction, pas seulement
son contrat de retour.**
★★★ **Corollaire vécu le 09/08 matin — CE QUE L'APP RACONTE D'ELLE-MÊME VIEILLIT AUSSI.**
L'aide contextuelle, le guide public et la visite guidée décrivaient des écrans disparus depuis des
mois. Personne ne les relit, aucun test ne les couvrait, et le client, lui, les lit. **Un audit qui
ne regarde que le code passe à côté de la moitié de ce que le client voit.** D'où le contrôle C22
(§6c) et la règle du §27d.
★★★ **Corollaire vécu le 09/08 soir — UNE NOTE DE MISSION AUSSI PEUT MENTIR.** Le fichier de
mission « réduire le temps d'installation » listait comme « ce qui manque vraiment » deux choses
déjà faites depuis des semaines. **Le premier geste d'une mission est un inventaire, pas un plan.**
★★★ **Corollaire vécu le 11/08 — UN CLIQUET ÉCRIT N'EST PAS UN CLIQUET BRANCHÉ.**
`scripts/lint-vocabulaire.mjs` avait été écrit et poussé le matin même, avec son raisonnement et son
plafond à zéro. **Aucun appelant ne l'exécutait** — ni `npm run lint`, ni `ci.yml`, ni rien. Le mot
banni pouvait revenir sans que quoi que ce soit rougisse. **C'est le cas DOCK appliqué à
l'outillage : livré, jamais intégré.** Réflexe : après avoir écrit un contrôle, `grep` son nom dans
`package.json` et `.github/` **avant** de le considérer comme actif.
★★★ **Corollaire vécu le 11/08 — LA BONNE RÉPONSE EST PARFOIS DE RETIRER UNE ÉCRITURE.**
« Un chrono douteux ne doit pas être comptabilisé » semblait demander un mécanisme : dialogue,
choix, correction. **Il suffisait de ne pas écrire `dmin`** — les deux consommateurs (`_chronoSummary`
et `pilotage.js:4318`) retombaient déjà sur le barème, chacun de son côté. **Avant de construire une
mécanique, vérifier ce que fait déjà le chemin par défaut.**
★★ **Corollaire vécu le 11/08 — UN HELPER DE MODULE N'EST PAS UNE PRIMITIVE.**
Du code écrit pour `app.js` appelait `_openOv(...)` : cette fonction **n'existe que dans
`tracteur.js`**. La primitive d'`app.js` est `openOv`, qui pose la classe `open`, gère le z-index et
empile l'historique — le repli maison posait `show` et **l'écran ne se serait jamais affiché**.
⚠️ Le code existant fait la même chose (`app.js:10143`) et **marche par accident** :
`tracteur.js:2632` expose `window._openOv` et le corps d'`app.js` s'exécute en dernier. **Un appel
qui marche par ordre de chargement n'est pas un appel correct.**
★★ **Corollaire vécu le 11/08 — QUAND UN TEST ROUGIT, SOUPÇONNER LE TEST AVANT LE CODE.**
Trois rouges dans la journée : deux venaient du harnais (`SESSIONS` posé sur `globalThis` au lieu de
`window` ; un `sed` dont le motif n'existait pas dans le fichier), **un seul était un vrai bug**.
Mais ce vrai bug n'aurait été trouvé par rien d'autre. **Écrire des assertions fausses n'est pas du
temps perdu — c'est le prix du seul contrôle qui trouve quelque chose.**

---

**Règle d'or n°4 — un lot n'est pas fini tant que l'aide ne dit pas la vérité.**

> ⚠️⚠️⚠️ **OBLIGATOIRE. AUCUNE EXCEPTION. AUCUN « PLUS TARD ».**

**Toute mise à jour qui change ce que le client voit ou fait doit mettre à jour, DANS LE MÊME LOT,
les supports d'accompagnement qu'elle rend faux.** Ce n'est pas une étape de finition qu'on repousse
au lot suivant : c'est une **condition de clôture**, au même titre que le preflight vert.

| Support | Fichier | Quand il devient faux |
|---|---|---|
| **Fiche `MV_AIDE`** du module touché | `src/utils.js` | dès qu'un écran, un geste ou un onglet change |
| **Fiche `MV_INFO`** du chiffre touché | `src/utils.js` | dès que la MÉTHODE de calcul change, ou qu'un chiffre cesse d'être posé |
| **Section du guide public** | `guide/NN-<section>.html` → `node scripts/build-guide.mjs` | dès qu'une fonctionnalité décrite change |
| **Visite guidée** `_mvtSteps` | `src/app.js` | dès qu'un sélecteur visé bouge |
| **`WHATS_NEW`** | `src/utils.js` | dès que le changement est **visible** par l'utilisateur |
| **Écran qui énumère ce qui reste à faire** | selon | dès qu'on lui apprend à faire une des choses listées |

**Le geste concret, avant de livrer :** ouvrir la fiche `MV_AIDE` du module touché et la **relire à
voix haute contre l'écran neuf**. Si une phrase est devenue fausse, la réécrire *maintenant*. Si
aucune ne l'est, l'écrire dans la réponse — « fiche relue, rien à changer » — pour que ce soit un
constat et non un oubli.

⚠️ **Le preflight ne te sauvera pas.** C22 vérifie que les sélecteurs pointent quelque part, **pas
que les phrases sont vraies**. Une fiche peut être **verte au preflight et entièrement périmée** :
c'est exactement l'état dans lequel les dix fiches se trouvaient le 09/08, après des mois.
**Le contrôle automatique protège de la panne, jamais du mensonge.**

⚠️ **Ce qui rend cette règle nécessaire, c'est qu'elle est facile à contourner sans mentir.** Dire
« les fiches MV_AIDE restent à écrire » en fin de livraison est exact, honnête — et laisse le client
avec une aide fausse. **Vécu deux fois le 11/08** : le lot du chrono tracteur inversé (v5.92) et le
lot du mode du jour (v5.93) ont tous deux été livrés en signalant l'aide comme « ce qui reste ». Les
deux écrans les plus utilisés du module Tracteur ont changé de gestes, et leur fiche décrit encore
les anciens. **C'est la dette que cette règle existe pour empêcher, écrite le jour même où elle a
été contractée.**

**Si le temps manque vraiment**, le lot ne se livre pas en deux morceaux : il se **réduit**. Mieux
vaut un lot plus petit dont l'aide est juste qu'un gros lot dont l'aide ment.

> ### ⚠️⚠️⚠️ LA CLÔTURE DE LOT — À FAIRE AVANT D'ÉCRIRE « LIVRÉ », SANS EXCEPTION
>
> **Demandé explicitement par Nico le 24/08**, après trois lots d'affilée livrés sans guide ni
> journal. Un lot n'est pas « fini » quand le code marche : il est fini quand **six** choses sont
> faites. À dérouler dans l'ordre, et à **dire dans la réponse**, ligne par ligne — « fait » ou
> « relu, rien à changer ». Un silence sur une ligne vaut oubli.
>
> | # | Livrable | Fichier | Le geste |
> |---|---|---|---|
> | 1 | **Le code** | le module | preflight + harnais + contre-épreuve verts |
> | 2 | **Le guide public** | `guide/NN-*.html` puis `node scripts/build-guide.mjs` | relire la section contre l'écran neuf |
> | 3 | **La fiche `MV_AIDE`** du module | `src/utils.js` | idem, à voix haute |
> | 4 | **`MV_INFO`** du chiffre touché | `src/utils.js` | seulement si une méthode de calcul change |
> | 5 | **`WHATS_NEW`** | `src/utils.js` | un bloc en tête, du point de vue de l'utilisateur |
> | 6 | **`CLAUDE.md`** | ici | la section du lot, et **ce qui reste ouvert** |
>
> ★★ **PUBLIER UNE PAGE DU SITE : `npm run site` AVANT `npm run build`** (29/09). Dès qu'un lot touche
> `guide/*.html` **ou** une page de `public/` (`logiciel-vigne`, `essai`, `demarrage`, mentions…),
> cette commande régénère `guide.html` **et** remet à jour les `<lastmod>` de `sitemap.xml` — sans
> commit intermédiaire. **À rappeler à Nico en fin de livraison, avec la séquence** : `npm run site`
> → `npm run build` → `firebase deploy --only hosting`. ⚠️ **Ne jamais livrer `public/sitemap.xml`**
> (dérivé, comme `guide.html`) : on livre la source, on nomme la commande. Un `lastmod` périmé ment à
> Google (§27d). Après le déploiement : Search Console › Inspection de l'URL › demander l'indexation.
>
> ★★★ **ET LA CONSÉQUENCE QU'ON OUBLIE : ANNONCER, C'EST BUMPER.** `WHATS_NEW` vit dans `utils.js`
> et le récap agrège **jusqu'à `APP_VERSION`**. Donc **tout lot visible par le client force un bump
> APP + SW**, même si le code tenait dans un seul module. « Module seul = aucun bump » est vrai pour
> le cache, **faux pour le client** — c'est une règle de déploiement, pas une dispense d'annonce.
>
> ⚠️ **Une règle écrite ne se déclenche pas toute seule** : elle a été enfreinte trois fois le jour
> même où elle était en tête de ce document. D'où **C27** au preflight — `WHATS_NEW` doit s'ouvrir
> sur `APP_VERSION`, sinon ERREUR. Le contrôle n'impose pas d'annoncer : il impose de **décider**.
> Une version purement technique déclare `items: []`, et c'est un choix, plus un oubli.

Détail des trois supports et de leur mécanique : **§27a** (la règle longue), **§27b** (`MV_AIDE`),
**§27d** (le guide découpé).

**Règle d'or n°5 — ÉCRIRE À NICO EN LANGAGE SIMPLE.**

> ★★★ **Demandé explicitement par Nico le 14/08.** Vaut pour TOUTE réponse, pas seulement
> pour les tutoriels.

**Nico est vigneron et chef d'équipe avant d'être développeur.** Il connaît son application par
cœur — il l'a conçue — mais il n'a pas à connaître le vocabulaire d'un outillage qu'il ne fait
que subir. Une explication qu'il doit relire deux fois est une explication ratée, même si chaque
mot est exact.

**Les gestes concrets :**

| À la place de | Écrire |
|---|---|
| « le fichier généré diffère de ses sources » | « la page en ligne ne correspond plus au texte que tu as écrit » |
| « bump le SW » | « change le numéro de version dans `sw.js` — sinon les clients gardent l'ancienne version » |
| « l'ancre du patch n'a pas matché » | « je n'ai pas retrouvé le bout de code à modifier » |
| « mémoïsation », « idempotent », « CRLF » | dire ce que ça FAIT, pas comment ça s'appelle |

- **Un terme technique par explication, maximum**, et toujours suivi de ce qu'il veut dire.
- **Toujours dire l'effet AVANT la cause.** « Le guide en ligne montre l'ancien texte » d'abord ;
  « parce que la source n'a pas été recopiée » ensuite.
- **Un tutoriel = une action par étape**, avec le chemin complet du dossier et le texte exact à
  taper. Jamais « place le fichier au bon endroit » : écrire le chemin en entier.
- **Dire ce qu'il doit VOIR quand ça marche.** Une étape sans signe de réussite laisse Nico
  incapable de savoir s'il peut passer à la suivante.
- ⚠️ **Ça ne veut pas dire simplifier le RAISONNEMENT.** Les diagnostics restent complets et les
  désaccords restent francs. C'est le VOCABULAIRE qui se simplifie, jamais le contenu — le prendre
  pour un débutant serait aussi raté que le noyer sous le jargon.

★ **Le test** : est-ce que Nico pourrait exécuter cette réponse sur son téléphone, entre deux
rangs, sans rien rechercher ? Si non, la réécrire.

**Règle d'or n°6 — CE DOCUMENT SE MET À JOUR AU DERNIER LOT.**

> ★★★ **Demandé explicitement par Nico le 23/08.**

Ce fichier n'est pas un compte rendu qu'on rédige après coup : c'est **un livrable du lot**, au
même titre que `pilotage.js`. Il part **avec le dernier lot de la conversation**, jamais dans une
session suivante — une session suivante commence par le lire, et lit alors un document qui ignore
ce que la précédente a fait.

- **Le dernier lot d'une conversation inclut ce fichier.** S'il n'y figure pas, le lot n'est pas fini.
- ★ **Depuis la scission (§189), « ce fichier » = la documentation entière** : la consolidation en tête
  d'ici (l'ancienne descend dans `docs/claude/journal.md`), la section chantier dans le bon
  `docs/claude/chantiers-*`, la consigne générale ICI, puis l'index régénéré. Le rangement est dans
  le mode d'emploi, en tête de ce fichier — et `harnais-claude-md.mjs` le fait respecter.
- **Ce qui s'y écrit** : ce que le lot a changé, ce qu'on a mesuré, et surtout **ce qui a été
  découvert en route** — un défaut trouvé, une assertion fausse, un no-op silencieux. Le code
  raconte ce qu'il fait ; ce document raconte **pourquoi il le fait comme ça**, et c'est la seule
  chose qu'une relecture du code ne redonnera jamais.
- ⚠️ **Ce n'est pas un journal exhaustif.** Une section qui recopie le changelog du service worker
  ne sert à rien : le changelog est déjà dans `sw.js`. Ici on écrit **l'arbitrage** — ce qu'on a
  envisagé et écarté, et pour quelle raison.
- ⚠️⚠️ **Un document faux est pire qu'un document absent** : une session suivante le croit. C'est
  la Règle d'or n°3 appliquée à ce fichier lui-même. Ce qui n'a pas été vérifié s'écrit
  « à confirmer », pas au présent de l'indicatif.

**LA NOTE DE LIVRAISON — dire ce qui change, FICHIER PAR FICHIER.**

Une livraison n'est pas une liste de fichiers joints. Nico doit pouvoir décider **quoi remplacer**
sans ouvrir un seul fichier. Chaque lot se termine donc par un tableau :

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/pilotage.js` | ce que ça change **pour l'utilisateur**, en une ligne | — |
| `src/utils.js` | idem | ★ APP |

- **Une ligne par fichier**, écrite du point de vue de l'effet, pas de la mécanique.
- **La colonne bump est obligatoire** — c'est l'erreur la plus coûteuse du projet, et la seule
  qu'on ne rattrape pas : réutiliser un numéro déjà en ligne fige l'ancien `index.html` **pour
  toujours** chez les clients qui l'ont déjà pris.
- **Ce qui a été mesuré** se dit avec son chiffre, jamais « tout est vert » : le code retour de
  `npm run check`, les cliquets avant → après, le nombre d'assertions.
- **Ce qui n'a PAS été vérifié se dit aussi.** Aucun harnais ne lit une mise en page : ce qui
  s'inspecte à l'œil doit être nommé, pour que Nico sache ce qu'il lui reste à regarder.

---

## 🖥️ Environnement de Nico

- ★★★ **Git, depuis le 10 août — via GitHub Desktop.** Dépôt `4ss4ss1/mavigne-dev` (**public** —
  nécessaire au clone anonyme de Claude), cloné dans
  `C:\Users\p4n0m\Desktop\Applications\mavigne-dev\` — ⚠️ **CHEMIN À CONFIRMER PAR NICO** : une
  note de mémoire indique `C:\Users\p4n0m\Documents\GitHub\mavigne-dev` (le défaut de GitHub
  Desktop). **Les deux sont invérifiables depuis le bac à sable** ; le premier qui relit tranche et
  supprime l'autre. (dossier **distinct** de l'ancien `mavigne\`,
  qui peut être supprimé une fois vérifié que tout a bien été copié dedans). Nico édite dans
  `mavigne-dev\`, GitHub Desktop détecte les changements, **Commit + Push** (deux clics, pas de
  ligne de commande). ⚠️ Ça ne change **rien** à `npm run build` / `firebase deploy`, qui restent
  identiques et indépendants de Git — Git sauvegarde le code, il ne le compile ni ne le déploie.
  ⚠️ `node_modules/`, `dist/`, `.env` sont dans `.gitignore` : ne jamais forcer leur ajout.
  ★★★ **Côté Claude — mécanique du clone :**
  ```
  git clone https://github.com/4ss4ss1/mavigne-dev.git
  ```
  dans `/home/claude/` (le clone dans `/mnt/user-data/uploads` échoue : système en lecture seule).
  **Le clone ne survit pas d'une conversation à l'autre** — le refaire à chaque nouvelle session.
  **Dans une même session**, si Nico dit avoir poussé un changement, `git pull` avant de relire.
  Le dépôt étant public, aucune authentification n'est nécessaire — si le clone échoue avec
  `fatal: could not read Username`, c'est que le dépôt est repassé en privé : le dire à Nico.
- **Filet avant chaque lot, complémentaire à Git désormais** : `xcopy src
  ..\mavigne-sauvegardes\avant-XX\src\ /E /I /Y` (**hors** du dossier projet). Filets
  complémentaires : les fichiers uploadés dans la conversation, et surtout l'**historique Firebase
  Hosting** (Console → Hosting → Historique → Restaurer, 1 clic).
  ⚠️ `git checkout HEAD~1` reste peu naturel en ligne de commande → **GitHub Desktop propose
  « Revert this commit » en clic droit sur l'historique**, plus simple. Copier `claims.js` /
  `leads.js` / les rules **avant** tout redéploiement backend reste le bon réflexe, Git ou pas —
  Git protège le code source, pas ce qui est déjà en production.
  ★ L'historique Hosting sert aussi de **preuve** : retrouver la version exacte d'une page juridique
  servie à une date de signature donnée (§26b).
  ⚠️⚠️ **Leçon `mvprint.py`** : **tout outil hors dépôt reçoit sa copie dans
  `..\mavigne-sauvegardes\` le jour de sa création — jamais n'attendre.** S'y ajoutent désormais
  `INSTALLER-UN-DOMAINE.md` et `mkpdf.py` (§18c). ★ **Ces outils hors dépôt restent hors GIT
  aussi** — ils ne sont simplement jamais dans `mavigne-dev\`, aucune ligne de `.gitignore` requise.
- **Invite de commandes `cmd.exe`, pas PowerShell.** `&&` fonctionne ; `;` ne veut rien dire ;
  commentaire = `REM` ; code retour = `%ERRORLEVEL%` ; accents = `chcp 65001` en début de session.
- **Le shell des outils Claude est `sh`** → pas d'expansion `{a,b,c}` : **un `cp` par fichier**.
  ⚠️ Pas non plus de **substitution de processus** `<(…)` : pour un diff, écrire les deux fichiers
  sur disque. ⚠️ Une commande shell contenant des parenthèses non protégées échoue
  (`Syntax error: "(" unexpected`) — passer par Python.
- Poste : `C:\Users\p4n0m\Desktop\Applications\mavigne` (ancien dossier) et
  `C:\Users\p4n0m\Desktop\Applications\mavigne-dev` (dépôt Git, celui qui fait foi désormais).
  Firebase CLI. `winget` absent (installer via `.msi`). **Java 17 (Temurin)** pour les émulateurs.
- **Deux comptes Firebase** : `ngdevpro@gmail.com` = admin GT (`gtAdmin:true`) ·
  `gueret.nicolas@gmail.com` = admin le domaine de référence (`adm:true`). Toute procédure GT (backfill,
  `fbAdminRead`, `_fbSetTenantPlan`, assistant d'installation) exige la **fenêtre privée ngdevpro**
  et une session OTP ouverte.

### ★★ La granularité d'une préférence (11/08)

Une objection peut être **juste sur le fond et fausse sur la portée**. « Un mode ouvrier/tractoriste
se tromperait la moitié du temps » était un bon argument — contre un mode **permanent**. Il ne valait
plus rien contre un mode **journalier**, parce que la réalité était : homogène dans la journée,
variable d'un jour à l'autre.

**Avant de rejeter une idée, chercher l'échelle à laquelle elle devient vraie.** Et quand
l'objection repose sur une hypothèse terrain — la forme d'une journée, la distance entre deux
parcelles — **c'est Nico qui a la réponse, pas le raisonnement.** Poser la question au lieu de
déduire : deux fois le 11/08, la réponse a retourné le dessin (parcelles éloignées → 1 tap par
parcelle impossible ; journées homogènes → le mode collant redevient bon).

---


## 💬 Communication

Français **terse**. « **go** » / « **intègre** » / « **suite** » / « **go lot X** » / « **continu** »
= exécution autonome immédiate, sans recap ni check-in. Un **upload des fichiers demandés** vaut go.
Livraison = **fichiers complets**, **jamais** d'instructions de patch manuel.
★★★ **DEPUIS LE 23/09 — LA LIVRAISON EST UN ZIP QUI REPRODUIT L'ARBORESCENCE DU DÉPÔT.** Demandé par Nico : *« mets tout dans
un fichier zip et dans leurs dossiers respectifs, que je puisse dézipper plus facilement »*. Un seul fichier
`mavigne-<LOT>.zip` présenté par `present_files`, dont chaque entrée porte son **chemin réel dans le dépôt**
(`src/app.js`, `public/sw.js`, `guide/06-tracteur.html`, `scripts/…`, `.github/workflows/ci.yml`, `CLAUDE.md`, `.mv-base`…).
Nico le dézippe **à la racine de `mavigne-dev\`** en acceptant de remplacer : chaque fichier tombe à sa place, plus de
renommage à annoncer, plus de fichier oublié parce que le dossier de sortie était plat.
- **Construire le zip depuis la racine du clone** (`cd mavigne-dev && zip mavigne-X.zip chemin/1 chemin/2 …`), jamais
  depuis `/mnt/user-data/outputs` (plat : les chemins seraient perdus). Vérifier avec `unzip -l` que chaque entrée a son
  dossier avant de présenter.
- **Le contenu du zip = la colonne « Fichier » de la note de livraison**, ni plus ni moins. Toujours sans les fichiers
  fabriqués par un script (`public/guide.html`, `dist/`) : on livre l'entrée, on nomme la commande.
- Le tableau de la note de livraison reste obligatoire (ce qui change, fichier par fichier, et la colonne bump) ; il écrit
  les chemins complets.
- Un zip qui contient un lot précédent non poussé le **dit** en tête de réponse (« ce zip contient aussi TOUR-1 »).
Workflow : **maquette → validation → intégration**. Questions **uniquement** en cas d'ambiguïté
technique bloquante — mais alors les poser **avec une recommandation**, pour ne pas bloquer.

★ **Préférence explicite pour un langage simple dans les explications.** Phrases courtes, une idée
par phrase, pas de subordonnées empilées, pas de jargon là où un mot courant suffit. Cette
préférence **ne change rien aux livrables techniques** — fichiers complets, versionnage, procédures
de patch restent aussi précis. Elle porte sur la **prose autour** du livrable.
★ **Vécu le 09/08** : quand Nico demande « explique-moi le processus en langage simple, je dois
faire quoi ? », il attend **la suite de gestes concrets**, pas la justification technique. Répondre
par « ce que tu fais une fois » puis « ce que tu fais à chaque fois », et nommer le piège.

★ **Nico corrige directement et attend une cause racine, pas un pansement.** « non t'as pas
compris », « c'est moche », « c'est faux » sont des redirections de portée, pas des reproches.
Les captures annotées sont son canal de retour préféré quand le problème est visuel.
Quand il donne un chiffre du terrain (250 tâches validées de janvier à juillet, 11,76 ha, 485 h/ha,
20 h pour installer le second domaine, 40 vendangeurs sur 10 jours, **14 h de clavier sur les 20**), c'est
une **donnée de calage**.

★★ **Il corrige aussi les MODÈLES, et c'est là qu'il faut l'écouter le plus.** Le 06/08, sur le parc
à fûts : « je n'ai pour l'instant fait que l'inventaire exact des fûts **libres** ». Cette phrase a
invalidé tout un lot déjà maquetté et testé.
★★★ **Le 07/08, QUATRE corrections de modèle en cascade** : le ton, le déclencheur, la méthode,
puis l'axe entier. **Quand Nico décrit sa pratique, ce n'est jamais un détail d'affichage.
Réécrire le modèle plutôt que d'ajuster l'existant.**
★★ **Le 09/08, une correction en une ligne** : « oui et les noms donnés par le domaine étaient
différents des noms du KML (on a d'ailleurs fait un programme) ». Cette phrase a déplacé tout le
lot n°1 : le problème n'était pas de LIRE le fichier — c'était déjà fait — mais d'**aligner les
noms**.

★ **Il arbitre le périmètre.** « le lot 4 on ne le fait pas » · « ne prends pas d'initiative, pose
des questions ». **Quand il demande des questions, il faut d'abord EXPLORER pour les poser
précises**, pas demander à l'aveugle.

Le système de fichiers se réinitialise entre les tours (sauf `/mnt/user-data/outputs` et les
uploads accumulés) → reconstruire l'espace de travail et réappliquer tous les patchs **dans un
seul tour**.

---

## 1. Identité & contexte

- **Nicolas Guéret** — GUERETTECH, entreprise individuelle (régime micro-entrepreneur).
- ★★ **SIRET : 982 148 116 00022** (depuis le 31/07/2026). **SIREN inchangé : 982 148 116.**
  L'ancien établissement **…00014** ne doit plus apparaître nulle part — remplacé en **18
  occurrences sur 10 fichiers** (§26c).
  ⚠️ **Deux SIRET distincts vivent dans l'app** : celui de GUERETTECH (mentions éditeur) et
  **celui du DOMAINE client** (`CONFIG.siret`, exigé sur chaque ligne du registre phyto
  électronique, §17). Ne jamais les confondre.
- **Adresse du siège** : **68 rue Henri Challand, 21700 Nuits-Saint-Georges**.
  ⚠️ « **Challand** » avec un C majuscule — faute vécue dans une fiche client.
- **Téléphone** : **06 99 42 48 59** (`tel:+33699424859`). ⚠️ L'ancien numéro **0622074786
  n'existe plus**. Publié dans les mentions légales et la politique de confidentialité.
  ⚠️ **Volontairement absent du DPA** (document signé) et des pages marketing.
- **Courriel** : `ngdevpro@gmail.com`. **TVA non applicable, art. 293 B du CGI.**
- **Double casquette** : développeur unique de Ma Vigne **et** chef d'équipe viticole en Côte de
  Nuits. Différenciateur commercial n°1.
- ✅ **Statut administratif : RÉGLÉ.** Radiation d'office au 31/12/2025 (CA nul) ; régularisation
  INPI/INSEE aboutie au 31/07/2026 ; **l'Urssaf a confirmé le 03/08/2026 que Nico peut facturer**.
  ⚠️ Rappel de principe : **l'attribution d'un SIRET ne vaut jamais affiliation cotisant**.
- **Produit** : **Ma Vigne** — PWA multi-tenant de gestion viticole, `mavigneapp.fr`.
- **Clients en production** :
  - **le domaine de référence** — 45 parcelles + Chazière « Arrachée », ~11,76 ha, tenant de
    référence/dev. Adresses fictives en **`prenom.<slug>@mavigne.app`**.
  - **SCEA PH le second domaine** (slug `domaine-chapelle-et-fils`, réf. MV-AAAA-NNNN) —
    le contact technique le second domaine (chef de culture, opérationnel), **le signataire le second domaine** (gérant, signataire et
    destinataire des factures), ~18 ha, 100 % bio, multi-communes. CGU v1.1 + DPA v1.0 acceptés en
    app le 18/07/2026. ✅ **CONVERTI ET FACTURÉ** le 03/08/2026.
    ⚠️ Adresses fictives en **`prenom.<forme-contractee>@mavigneapp.fr`** — **ni le slug, ni le même
    domaine de messagerie que MG** (§18b).
- ★★ **Prospect entrant : le prospect Gironde** (Lalande-de-Pomerol, Gironde) — **premier lead hors
  réseau personnel**, arrivé le 04/08 par le formulaire d'essai du site. 45 ha en conventionnel,
  40 parcelles multi-communes, 12 permanents + saisonniers, 6 machines, 4 cuvées.
  ⚠️ **Barrique bordelaise : 225 L**, pas 228 (§18b).
- ⚠️ **Pas d'auto-onboarding client.** Nico installe lui-même chaque domaine. La série du 09/08
  réduit **son temps**, pas sa présence.
- ⚠️ **Aucun tâcheron** aujourd'hui, ni chez MG ni chez le second domaine (§30f).
- ★★ **Un seul millésime en cave aujourd'hui** — l'app n'est pas assez ancienne. **Conséquence
  majeure : la série MILLÉSIME a pu poser une garde stricte sans aucune migration de données.**

---

## 2. Inventaire fonctionnel — 10 modules

| Module | Contenu |
|---|---|
| **Accueil** | Météo AROME par parcelle, pastille météo mini, avancement global, priorité du jour, derniers travaux, **Ma part du chantier**, ★ **Mise en route** (admin) |
| **Parcelles** | Carte Leaflet, polygones KML, validation des tâches, filtres, fiche parcelle |
| **Journal** | Timeline, filtres (ouvrier/tâche/période), reconstruction 🩹, équipe en une entrée |
| **Tracteur** | Sessions, GNR, entretiens, conducteurs, matériel |
| **Phyto** | Registre, catalogue **E-Phy ANSES**, assistant 3 étapes, budget cuivre 7 ans, **export CSV réglementaire** |
| **Cave** | **TROIS sections** : **Le Chai** (élevage, fûts, part des anges, filtre et seuil par millésime) · **Le Cuvier** (vendange) · **Le millésime** (ce qui vient + la ligne de vie) |
| **La Réserve** | Intrants, achats, inventaires, **parc à fûts avec mouvements**, **bilan matière** |
| **Planning** | Grille équipe, éditeur slide-up, CP, heures sup, **annualisation 1607 h**, PDF MSA, **équipe collective**, **capacité réelle jour par jour** |
| **Pilotage** | **8 entrées, un axe de ZOOM** : Aujourd'hui · ① L'année · ② La campagne · ③ L'équipe & les tâches · ④ Simuler ┃ Cave · Économie · Conformité (+ Outils : Archives, Paramétrage). Portée unique `_PIL_SCOPE`, 4 photos en tête, moteur de diagnostic. **§34** |
| **Réglages** | Domaine (dont **SIRET & bio**), équipe, campagne, tâches, **barème de la convention**, app, ★ **Documents & impressions**, zone dangereuse |

★ **Deux pages transversales** (overlays, pas des modules du dock) : **Ma trace** (`ovMaTrace`) et
**Le domaine cette semaine** (`ovMur`) — cf. §22b.

★★ **Le hub « Documents & impressions »** (`MV_DOCS`, `MV_DOCS_FAM` dans `reglages.js`, ouvert par
`openDocs()` depuis `#regl-export-row` de l'onglet **App**) rassemble **17 documents en 3 familles** :
**Obligatoire** (registre phyto PDF et tableur, synthèse cuivre, relevé mensuel d'heures) ·
**Suivi du domaine** (rapport de saison, bilan de campagne, registre des manipulations, inventaire
des fûts et des intrants, récoltes, suivi d'élevage, carnet d'entretien, réglage Heures & ETP) ·
**Données brutes** (journal, avancement par parcelle, sauvegarde complète, restauration).
★ Un document dont le module est masqué pour l'utilisateur **n'apparaît pas** (`_docsCan`).

**Rôles** : `admin` · `ouvrier` · `tractoriste` · `saisonnier` (lecture seule) · `pilotage`
(lecture étendue, projeté).
★ **Visibilité par membre** (`m.mods`, exclusions uniquement) : `planModule ∧ !_mvModOff`.
**Restriction seulement, jamais élévation.** Réglages est **inaliénable**. C'est de la
**simplification d'interface, pas de la sécurité**.

---

## 3. Positionnement commercial

- Ma Vigne n'est **PAS** AppSheet ni du no-code — c'est une **vraie application métier**.
- Modèle : **installation + personnalisation (forfait)** + **abonnement mensuel par formule**.
  ★ **La grille d'installation est TRANCHÉE** (§26) : indexée sur la formule, avec des heures
  d'accompagnement incluses.
- Pas de paiement en self-service : conversion par **MAILTO** + `_fbSetTenantPlan` en fenêtre privée GT.
- Nico contacte ses clients **personnellement**. Ton direct, chaleureux, concis — jamais corporate.
- LinkedIn : posts #1 à #3 publiés. Cadence **mardi, tous les 14 jours, 11h30 ou 20h**.
  ⚠️ **Prévenir l'employeur avant toute sortie publique.**
- ★ **Le canal passif fonctionne** : le premier lead entrant est arrivé par le formulaire du site.
- ★ **Le barème régional (§30) est ce qui rend une vente hors Bourgogne possible.**
- ★★ **La Cave est le deuxième pilier de l'argumentaire.** Un domaine qui vinifie a le parc à fûts,
  l'agenda des quatre semaines, deux documents imprimables, un cockpit de pilotage, la projection de
  fin de malo sur ses propres analyses, et un modèle qui respecte la séparation des millésimes.
- ★★★ **L'accompagnement est devenu le troisième pilier** (chantier du 09/08 après-midi). Un
  prospect de 45 ha avec 12 salariés n'achète pas seulement des fonctions : il achète la certitude
  que son équipe saura s'en servir. Ce qu'on peut montrer : une **mise en route** qui se coche toute
  seule, une **aide par écran** qui lit la structure réelle de l'application, un **guide public** que
  l'on régénère par une commande, et un **contrôle automatique** qui refuse un build dont
  l'accompagnement a décroché du code.
- ★★★ **Et le quatrième, invisible du client : la RAPIDITÉ D'INSTALLATION** (chantier du 09/08
  soir). Un forfait de 20 h incluses tient économiquement si l'installation en coûte 9. C'est ce qui
  rend le passage à trente clients pensable (§18b, §26).

---

## 4. Stack technique

- **Build** : Vite + Rollup, sortie **IIFE**. `minify:false` en dev ; Terser `toplevel` + `unsafe` en
  prod. Hosting Firebase. ⚠️ `root:'.'`, `publicDir:'public'`, `outDir:'dist'`,
  `rollupOptions.input = { main: './index.html' }`. Assets hashés dans **`dist/assets/`**.
- **Firebase v10 modulaire** + compat `window.firebase` : Firestore (**eur3**), Auth, Storage,
  Cloud Functions (**europe-west1, Node 22**), App Check (**reCAPTCHA v3**).
- **Leaflet 1.9.4** (CDN unpkg, lazy + SRI). **Open-Meteo AROME** (~1,5 km). **Géocodage BAN**
  (`api-adresse.data.gouv.fr`, runtime navigateur, sans clé, France uniquement).
- **Polices** : Cormorant Garamond + Outfit, **auto-hébergées** (`/fonts/fonts.css`).
  ★ Elles se récupèrent aussi en paquets npm `@fontsource/cormorant-garamond` et `@fontsource/outfit`
  — c'est ainsi que sont produits les PDF (§18c).
- **CSS applicatif** : **`src/styles.css`** (asset Vite hashé, précaché). Seul le **splash** reste
  inline dans `index.html`. ⚠️ Modifier `styles.css` = **bump SW**.
  ★ **Beaucoup de CSS est injecté par les modules** (`_caveV2InjectCss`, `_mlInjectCss`,
  `_pcavInjectCss`, `_dmrInjectCss`, `_agtInsCss`, le `@media(max-width:880px)` de `pilotage.js`) :
  **c'est ce qui permet des refontes visuelles sans toucher `styles.css`.**
- **PWA** : `sw.js` + `manifest.json` + précache atomique. En-têtes HTTP + CSP + cache via
  `firebase.json > hosting.headers` (§8b).
- **Tests** : Playwright (Chromium headless) + firebase-admin en devDeps.
  ⚠️ **Le CDN de Playwright n'est PAS joignable depuis le bac à sable Claude** : les contrôles
  visuels passent par un **harnais DOM stubé en Node**, pas par une capture. Voir §6b.
  ★★★ **Mais un Chromium, si** (§192b) : `@sparticuz/chromium` + `puppeteer-core` depuis npm, dans `/home/claude`. Imprimer
  en PDF, rendre en PNG, **regarder** — et mesurer la hauteur des pages et la largeur des tableaux.
  ★ En revanche **npm et PyPI SONT joignables** — c'est ce qui permet de récupérer les polices et
  d'installer `pypdfium2` pour contrôler un PDF au pixel (§18c). ★★ **Et depuis le 10/08, GitHub
  aussi est joignable** (`github.com`, `raw.githubusercontent.com`, `codeload.github.com` sont dans
  les domaines autorisés) — c'est ce qui permet le clone direct du dépôt (voir Règle d'or n°1).
- **Projet Firebase** : `mavigne-a0fd5`. Deux bases visibles : `(default)` en **eur3** (la vraie) et
  `restore-24` (à ignorer). Coût constaté ≈ 0 €.
- ⚠️ **Chargement à froid lent** : `_fbLoadAfterAuth` enchaîne ~40 `getDoc` séquentiels.
- ★ **Aucune requête Firestore filtrée** — zéro `where(`, `orderBy(`, `limit(` dans l'app **et** les
  Cloud Functions. **Conséquence : aucun index composite, et `firestore.indexes.json` n'a pas lieu
  d'exister.**
- ⚠️⚠️ **Les parcelles n'ont PAS de coordonnées GPS à elles.** Toute la géographie vit dans les
  **polygones KML** (`kml_polygons`). ★ Le résolveur de centroïde par correspondance de nom vit
  dans **`utils.js`** : **`_mvParcGeo` / `_mvKmlCtrs`**.
  ★★ **Conséquence produit : l'application n'a AUCUN import KML côté client.** C'est Nico qui pose
  les contours à l'installation, depuis la console GT. Tout écran qui proposerait au client
  d'importer ses contours l'enverrait dans le vide (§27c).
- ★ `TACHES_CATALOGUE` est une constante **régionale** (`app.js`), Côte de Nuits, 10 000 pieds/ha.
  Depuis le 04/08, `MV_BAREMES` accueille plusieurs jeux régionaux (§30).

---

## 5. Arborescence

> ⚠️⚠️ **`index.html` est à la RACINE, PAS dans `src/`.**
> Un `index.html` déposé dans `src\` **ne casse rien visiblement** : le build prend celui de la
> racine, et le fichier modifié n'a simplement aucun effet. C'est la signature exacte du
> « je déploie et rien ne change ».

```
mavigne/
├── index.html              ← À LA RACINE (shell + overlays + 4 affichages de version)
│                             ⚠️ contient AUSSI la section Réglages › Import / Export
│                                (le bouton du hub Documents est écrit en dur, PAS dans reglages.js)
│                             ★ le formulaire d'opération de cave (#cop-*), rang de millésimes
│                                et champ « acide malique »
│                             ★ et les conteneurs des widgets d'accueil (#home-demarrage, …)
├── guide/                  ← SOURCES DU GUIDE PUBLIC
│   ├── _layout.html        (habillage : en-tête, CSS, sommaire, pied de page)
│   ├── _inter.txt          (le séparateur entre deux sections — ne pas toucher)
│   └── 01-demarrer.html … 15-glossaire.html   (une section par module)
├── src/                    ← ce que Vite compile
│   ├── styles.css          (CSS applicatif, asset Vite hashé)
│   ├── app.js               (routage, dock, journal, parcelles, accueil, gating, restitution,
│   │                        TACHES_CATALOGUE, MV_BAREMES, _normalizeTaches, recalcTravaux,
│   │                        openPrompt / openConfirmDel, visite guidée _mvtSteps,
│   │                        widget Mise en route _dmr*)
│   ├── utils.js            (APP_VERSION, WHATS_NEW, MV_AIDE + assembleurs _mvAide*, logError,
│   │                        helpers, rôles, saisons, _mvNivH, densité, _mvEnContratSurPeriode,
│   │                        équipe collective, _mvParcGeo/_mvKmlCtrs, _mvCampagneDe, MV_DOC,
│   │                        le moteur _mvFut*)
│   ├── firebase.js         (COLLECTIONS, FB_REALTIME/FB_STATIC, _MV_GUARD_FLOORS, pull/listen/save,
│   │                        ★ createAuthAccount — qui accepte un tenant EXPLICITE depuis le 09/08)
│   ├── onboarding.js
│   ├── admin-gt.js         (★★ panneau GT + FICHE CLIENT + ASSISTANT D'INSTALLATION `_agtIns`
│   │                        + création de comptes en lot `_agtLot` — cf. §18)
│   ├── planning.js
│   ├── reglages.js         (+ MV_DOCS / MV_DOCS_FAM : le hub Documents)
│   ├── cave.js             (Chai + Le millésime + Aujourd'hui + registre + bilan de campagne
│   │                        + le moteur MILLÉSIME : _copMil*, _caveSeuilOu, _mlProjMalo)
│   ├── cuvier.js           (★ CUV-DEC, §164 — Le Cuvier : réceptions, cuves, relevés, décuvage,
│   │                        tournée, maturité, ventes en vrac ; la frontière avec cave.js est
│   │                        en fin des DEUX fichiers, gardée par mv-harnais-cuvier)
│   └── tracteur.js · phyto.js · pilotage.js · reserve.js
├── public/                 ← servi tel quel, JAMAIS compilé
│   ├── sw.js · boot.js · manifest.json · icônes · fonts/
│   ├── guide.html          GÉNÉRÉ depuis guide/ — ne plus l'éditer à la main (§27d)
│   ├── demarrage.html · logiciel-vigne.html · essai.html
│   ├── mise-en-route.html  (formulaire d'installation client — noindex, JAMAIS dans sitemap.xml ;
│   │                        ★ ENVOIE désormais ses réponses en base, §27f)
│   ├── cgu.html · dpa.html · confidentialite.html · mentions-legales.html
│   └── robots.txt · sitemap.xml
├── functions/              ← index.js (backups), claims.js, ephy.js,
│                              ★ leads.js (submitLead + submitMiseEnRoute)
├── scripts/                ← inject-precache.mjs (IDEMPOTENT), preflight.mjs (C1→C22),
│                              preflight-baseline.json, build-guide.mjs,
│                              smoke.mjs, e2e-local.mjs, e2e.mjs + e2e-seed.mjs
├── docs/claude/            ← ★ la documentation hors cœur (§189) : modules.md, chantiers-*.md,
│                             journal.md, INDEX.md (GÉNÉRÉ par scripts/mv-claude-index.mjs)
├── firebase.json · firestore.rules · storage.rules
└── vite.config.js · eslint.config.js · package.json
```

⚠️ **`firestore.indexes.json` N'EXISTE PAS** et ne doit pas être créé.

⚠️ **Récapitulatif du placement** : `index.html` → **racine** · `app.js`, `utils.js`, `styles.css`,
modules JS → **`src\`** · `sw.js`, `boot.js`, pages publiques → **`public\`** · sources du guide →
**`guide\` à la racine** · `claims.js` et `leads.js` → **`functions\`** · `preflight.mjs` et
`build-guide.mjs` → **`scripts\`** · `firebase.json` → **racine**.
Un fichier au mauvais endroit se déploie sans effet et **sans erreur**.

⚠️ **Ne pas confondre `firebase.js` et `firebase.json`.**

★ **Hors dépôt (ni déployé, ni versionné dans `mavigne-dev\`)** : `..\mavigne-sauvegardes\juridique\`
(copies archivées des CGU/DPA signées + empreintes SHA-256, §26b), et `..\mavigne-sauvegardes\` pour
`mvprint.py`, `comparateur-kml-parcelles.html`, ★ `INSTALLER-UN-DOMAINE.md` et `mkpdf.py` (§18c).

**★ Ordre d'import RÉEL dans `app.js`** (revérifié par grep) :
`styles.css → utils → firebase → onboarding → admin-gt → cave → **cuvier** → planning → reglages → **tracteur**
→ phyto → pilotage → **reserve**`.
★ **`cuvier.js` JUSTE APRÈS `cave.js`** (§164) : il lit le Chai par `window` au premier geste, jamais au chargement.
⚠️ **`reserve.js` est importé EN DERNIER**, `phyto.js` **après** `tracteur.js`, et
★ **`cave.js` AVANT `reglages.js`, `pilotage.js` et `reserve.js`** — c'est ce qui permet à ces
trois modules d'appeler les fonctions de la Cave sans repli.
★★ **Corollaire pour l'aide** : `utils.js` étant importé **en premier**, `MV_AIDE` ne peut rien lire
des autres modules **au chargement**. Mais l'aide s'ouvre **sur un clic**, quand tout est chargé :
c'est ce qui rend possible le point d'aide dynamique (§27b).

---

## 6. Build & déploiement

```
npm run build && firebase deploy
```

- ⚠️ **JAMAIS** de second `&& node scripts/inject-precache.mjs` : la 2ᵉ passe sort en `exit(1)` →
  **deploy annulé**. Le script est **idempotent**, il tourne déjà en `postbuild`.
  ★★ **C'est aussi la raison pour laquelle `build-guide.mjs` N'EST PAS dans le build** (§27d) :
  on ne rajoute rien à cette ligne.
- `package.json` reste `"1.0.0"` — ce n'est pas un compteur de release.
- **Préversion** : `npm run deploy:staging` = `firebase hosting:channel:deploy staging --expires 30d`.
  ⚠️ **Isole le frontend seul** : Functions et rules restent globales.
- ✅ **`"site": "mavigne-a0fd5"` est présent** dans `firebase.json`.
- `firestore: deploying indexes` en erreur interne = **transitoire** : relancer, ou
  `--except firestore:indexes`.
- Avertissement Vite `chunk > 800 kB` = **non bloquant**.
- ⚠️ **Jamais d'`import()` dynamique** : l'app repose sur `window.X()` + `onclick` inline.
- **Ordre de déploiement backend NON NÉGOCIABLE** : `functions` → **BACKFILL** (console,
  `{timeout:300000}`) → `hosting` → `rules`. Rules avant backfill = **tous les admins perdent
  l'écriture instantanément**.
- ★ `claims.js` seule : `--only functions`, aucun bump.
- ★★ **Une Cloud Function précise : `--only functions:<nom>`.** À préférer systématiquement —
  `--only functions` redéploie `claims.js`, `index.js` et `ephy.js` sans raison. Utilisé pour
  `submitMiseEnRoute` (§18b).
- ★ `firebase.json` seul : `--only hosting`, **aucun bump**.
- ★ Une page de `public/` seule : `--only hosting`, **aucun bump**.
- ★★ **Le guide public : `node scripts/build-guide.mjs` puis `firebase deploy --only hosting`,
  aucun bump** (§27d).

## 6b. Paliers de test

| Palier | Commande | Couvre |
|---|---|---|
| **0 — preflight** | `npm run check` (auto `prebuild`) — ★ joue `scripts/mv-harnais-liste.mjs` (§190) | **C1 → C25** : statique + invariants anti-perte **exécutés** + cliquet XSS (C24) + App Check (C25) |
| **1 — smoke** | `npm run test:smoke` | l'app **boote** sans exception + 23 globals |
| **2 — E2E local (DÉFAUT)** | `npm run test:e2e` | **login DOM réel + 10 pages + interactions** |
| **2bis — E2E émulateurs** | `npm run test:e2e:emu` | + couche Firestore réelle — **BLOQUÉ SDK** |
| ★ **RULES — règles Firestore** | `npm run test:rules` | `firestore.rules` **exécutées** sur l'émulateur : 53 requêtes + 12 contre-épreuves (§189). Java 21 requis ; **hors `npm run check`**, job CI `rules` |

★★★ **AJOUTER UN CONTRÔLE = UNE LIGNE DANS `scripts/mv-harnais-liste.mjs`** (LISTE-1, §190), et sa contre-épreuve sur
la ligne suivante. **Rien dans `package.json`, rien dans `ci.yml`** : `check` = `node scripts/mv-lanceur.mjs`, `prebuild` =
`npm run check`, la CI joue le lanceur `--continuer`. `mv-harnais-portes` rougit si une seconde liste revient. Reprendre après
un rouge : `node scripts/mv-lanceur.mjs --depuis <script>` ; un groupe seul : `--groupe <id>` ; voir la liste : `--liste`.

⚠️ **`smoke.mjs` sert `dist/`** → il teste le **dernier build**, pas les sources.

★ **`e2e-local.mjs` couvre 10 pages** et **six étapes d'interaction** : `saison`, `session`,
`onglets`, ★ `dock` (⚠️ **réduit le viewport à 390×844 avant de tester** — sinon `pc=true` et la
répartition mobile n'est jamais exécutée), et ★ `saisie` (ouvre `#ovPrompt`, vérifie la valeur
**posée en JS**, virgule française).

⚠️ **Piège vécu dans le test lui-même** : nommer une variable de boucle `page` **masque l'objet
`page` de Playwright**.

⚠️⚠️ **Aucun palier ne teste le CONTENU des pages publiques.** Contrôle **humain**, trimestriel.

**Reste irréductiblement manuel** : le test **deux appareils** sur La Réserve, la relecture des
pages juridiques, et l'œil humain sur le rendu.

★★ **Harnais fonctionnel (méthode C20 généralisée) — le réflexe par défaut.**
Pour toute logique de calcul, **extraire les vraies fonctions du fichier livré et les exécuter** sur
des scénarios écrits à la main, avec stubs minimaux.

★★ **Quatre formes de harnais :**
1. **Le harnais MOTEUR** — les fonctions de calcul pures, sur des scénarios chiffrés.
2. **Le harnais DOM** — le VRAI fichier chargé dans un `vm` avec un `document` stubé, puis les
   fonctions de rendu appelées pour de bon. On y vérifie : aucun `undefined`/`NaN` dans le HTML,
   balance `<div>`/`<span>`/`<table>`, **aucun `<div>` dans un `<button>`**, largeurs entre 0 et
   100 %, ★ **aucun double échappement** (`&amp;amp;`), les gardes (non-admin, données vides), et
   ★ **que les valeurs sont posées EN JS et non en attribut HTML**.
   ⚠️ **Le stub `Blob` + `URL.createObjectURL` permet de CAPTURER un document imprimable** sans
   navigateur : c'est ainsi que le registre et le bilan ont été testés (§20f).
3. ★★★ **Le harnais INTÉGRÉ — la forme la plus importante.**
   **On n'invente aucun moteur : on les EXTRAIT du vrai fichier et on les branche.** Un stub écrit
   à la main a sa propre signature et ment sur celle du vrai code.
   Patron : une fonction `corps(nom)` qui découpe par comptage d'accolades (elle doit gérer
   **`function X(`**, **`async function X(`** ET **`window.X = function(`**), puis `vm.runInContext`.
   ★ Prévoir les **dépendances en chaîne** : `_mlChaine` en a six.
   **Une dépendance manquante fait lever, le `catch` de repli l'avale, et l'écran sort vide — on
   croit alors à un bug du code alors que c'est le harnais qui est incomplet.**
4. ★★ **Le harnais BACKEND** (nouveau, 09/08) — un fichier de `functions/` chargé dans un `vm` avec
   un **faux `require`** : `firebase-functions/v2/https` renvoie un `onRequest` qui capture
   `{opts, fn}`, `firebase-admin` un Firestore factice à `runTransaction`, `crypto` un hachage
   lisible. On exécute alors la vraie fonction sur des requêtes complètes : méthodes, gardes,
   leurre anti-bot, fusion, bornage, mail, panne d'écriture. **Aucune ligne du fichier n'est
   réécrite.**

⚠️⚠️ **Quatre règles nées des journées du 07 et du 09/08 :**
- ★ **Un harnais doit compter un PLANTAGE comme rouge.** Sans `try/catch` autour de l'appel testé,
  une exception fait sortir le script en erreur et on lit « muet » là où il faudrait lire « rouge ».
- ★★ **Et le LANCEUR doit lire le code retour.** Vécu le 09/08 : un script qui affichait la dernière
  ligne de chaque harnais montrait « 23 vertes » pour un harnais qui avait explosé avant la fin.
  Le lanceur compte désormais un code retour non nul comme un échec, quoi que dise la sortie.
- ★ **Une contre-épreuve devenue muette n'est pas toujours un trou.** Après avoir rendu une branche
  autonome (`if(!k){cacher();return;}`), désactiver la garde d'avant produit exactement le même
  résultat : c'est de la défense en profondeur, pas un test aveugle. **Se demander pourquoi avant
  de conclure.**
- ★★★ **Le harnais et le preflight ne se remplacent pas.** Le 09/08 au soir, le preflight a vu
  **six fonctions non exposées sur `window`** que les harnais ne pouvaient pas voir (ils appellent
  les fonctions directement, pas par un `onclick`) ; et les harnais ont vu des erreurs de modèle
  que le preflight ignore complètement. **Lancer les deux, toujours.**

Prises réelles de la méthode :
- `eqNote`/`retNote` utilisés avant déclaration ;
- un filtre de retard sur `cd.debut/cd.fin` au lieu de `_saisonForDate()` ;
- le premier frame `requestAnimationFrame` à `ts=0` ;
- l'invariant `mine + them === done` de la série UX-R ;
- la répartition du dock jouée sur **9 profils réels** ;
- **103 scénarios** sur la refonte Économie · **77** sur la vendange-couperet ;
- la série Cave des 06-07/08 : **~770 assertions** ;
- le 09/08 matin : **28** sur l'écart de cadence, **8** sur la visite guidée, **73** sur les fiches
  d'aide, **27** sur le widget Mise en route ;
- ★ le 09/08 soir : **354 assertions sur 9 harnais** pour la série installation, dont un harnais
  backend complet sur la Cloud Function.

⚠️⚠️ **Écrire les assertions à la main expose aussi les erreurs du TEST.**
Sur la seule journée du 09/08, **sept séries d'assertions étaient fausses pour zéro bug** : un oubli
de paire dans un scénario, une `meteo:true` prise pour une trace de travail, de l'arithmétique de
tête, un `_dmrGo` cherché sur le mauvais objet, un test « aucun demi-surrogate » qui appelait
`charCodeAt(0)` sur des émojis astraux (**dont la paire de surrogates est parfaitement légitime**),
★ un ordre figé entre deux distances devenues égales après un correctif, ★ un ancrage de recherche
trop large qui retrouvait le mot cherché dans la ligne « Déjà posé ici », et ★ un motif de grep
qui n'existait nulle part.
**Quand une assertion tombe, se demander D'ABORD laquelle des deux a tort.**

★★ **Mais une assertion fausse révèle souvent un vrai défaut.** Le 09/08, la vérification de
`_dmrGo` a mis au jour que j'avais livré des **libellés client sans accents** (« Vos periodes »,
« Le bareme de vos taches ») dans un widget vu par le vigneron.
★ **Corollaire : relire ses propres textes destinés au client comme on relit du code.** Le style du
fichier peut être « commentaires sans accents » — les chaînes affichées, jamais.

⚠️ Même principe pour `WHATS_NEW` : **exécuter le tableau en Node**, jamais le relire.
⚠️ **Extraire les blocs dans l'ORDRE RÉEL du fichier** (repérer les index avec `str.index`).
⚠️ ★ **Un stub trop généreux ment.** Si le harnais fournit une donnée que le vrai code ne produit
pas, tout passe au vert et l'écran sort vide en production.
★★★ **Et un stub qui IGNORE LES ARGUMENTS ment tout autant** : `_mvFutParc = () => PARC` rend vrai
n'importe quel appel, y compris `_mvFutParc()` nu, qui en production renvoie zéro (§25).
⚠️ ★ **Un stub trop RESTRICTIF ment aussi, dans l'autre sens.** Vécu le 09/08 : le
`querySelector` du harnais DOM ne reconnaissait pas les attributs contenant un chiffre
(`data-pd1`) → un vrai code correct sortait rouge. **Un stub est du code : il se débogue.**
★ **Vérifier qu'un test attrape bien le bug** : réintroduire volontairement le défaut et constater
que le harnais rougit.

---

## 6c. ★★ Preflight v2 — le cliquet anti-régression

### ★ TROIS HARNAIS NEUFS, BRANCHÉS EN CI (15/08, §42)

`.github/workflows/ci.yml`, étape « Harnais — echelle, pastille « i », carte a trois etages » :

| harnais | ce qu'il interdit |
|---|---|
| `mv-harnais-echelle.mjs` | qu'une **taille de texte** soit réinventée hors des onze pas ; qu'un appel perde son **repli** ; qu'un pas soit déclaré sans emploi ou invoqué sans déclaration |
| `mv-harnais-info.mjs` | qu'une **pastille ouvre une fiche vide** ou qu'une fiche reste **orpheline** ; que l'écouteur perde son `stopPropagation` ; qu'une **fiche vivante** échappe à sa déclaration ; qu'un **sous-titre de carte** dépasse la ligne de cadre |
| `mv-harnais-carte.mjs` | que le **chiffre ou son cadre** sortent de l'en-tête (vérifié **en exécutant `_pilTile`**) ; que la **migration d'état** cesse d'atteindre les clients (vérifiée **en l'exécutant** sur un état mémorisé réaliste) ; que le **chrome** regonfle |
| `mv-harnais-reseau.mjs` (25/08, §68) | que `fbSave` **relance une erreur** (le contrat : elle rend un état, jamais un rejet) ou qu'une de ses sorties redevienne un `return;` nu ; que `saveData` cesse de **lire l'état** et reparte sur un `.then()` nu ; que le gestionnaire global perde son **filtre réseau**, ou que ce filtre passe **après** le bandeau rouge ; que le badge cesse de distinguer *coupé* de *instable* ; que l'échec réseau **remonte à l'écran** en `warning` |

⚠️ **`mv-harnais-reseau.mjs` est STATIQUE — et c'est assumé.** `fbSave` ne peut pas être importée
dans un harnais (elle tire tout le SDK Firebase). Mais « ne jamais rejeter » est précisément
l'invariant qu'un lot futur casse **sans le voir**, en ajoutant un `throw` dans un nouveau chemin
d'erreur : une lecture du fichier réel suffit à le tenir. Chacune de ses 7 règles est doublée d'une
**contre-épreuve** qui réinjecte le défaut dans une copie en mémoire et exige que la règle rougisse
— c'est cette contre-épreuve qui a révélé que la règle du filtre réseau **lisait un commentaire**.

⚠️ **Un harnais qui déménage doit rougir.** Quand l'échelle de texte est passée de `_pilCssV2()` à
`styles.css`, `mv-harnais-echelle` est monté à **13 rouges** : c'est exactement son travail. Le
réflexe n'est pas de le contourner, c'est de le **suivre**.

★ **`A8` de `mv-harnais-audit-pil` était un cliquet À L'ENVERS** — il exigeait *exactement* 8 boutons
de redirection, donc rougissait dès qu'on en **ajoutait** un. Converti : **le compte ne descend
jamais**. À vérifier sur tout contrôle écrit avec un `===` : compte-t-il ce qu'on veut interdire, ou
ce qu'on veut encourager ?

`scripts/preflight.mjs` tourne en `prebuild`.
**C'est un outil de développement : jamais déployé → zéro risque client, aucun bump.**

| | Règle | Mode |
|---|---|---|
| C11 | `getElementById('x')` où `x` n'est créé nulle part | cliquet |
| **C12** | **clé de `COLLECTIONS` ni dans `FB_REALTIME` ni dans `FB_STATIC`** | **erreur, tolérance 0** |
| **C13** | **clé écrite par `fbSave`/`saveData` sans plancher `_MV_GUARD_FLOORS`** | **erreur, tolérance 0** |
| C14 | `catch {}` vide | cliquet |
| **C15** | **fonction déclarée sans aucun appelant** | **cliquet** |
| C16 | `confirm`/`alert`/`prompt` natifs | cliquet |
| C17 | module sans `const DEBUG` du tout | avertissement |
| C18 | id dupliqué dans `index.html` | cliquet |
| C19 | champ utilisateur interpolé dans du HTML sans `_esc*` | cliquet |
| **C20** | **invariants anti-perte vérifiés EN LES EXÉCUTANT** | **erreur** |
| **C21** | **`paie` ne doit jamais toucher le disque** | **erreur** |
| ★★ **C22** | **l'accompagnement ne doit pas décrocher du code** | **erreur, tolérance 0** |

**C13 a une liste d'exemptions explicites et commentées** (`GUARD_EXEMPT`) : `travaux`, `reparateur`,
`kml_polygons`, `catalogue`. Pour exempter une clé, **il faut écrire pourquoi**.

**C20 n'analyse pas le code, il l'exécute** : 17 scénarios.

⚠️ **C19 vécu** : des `<b>` bruts dans `MV_AIDE` ont fait rejeter un livrable → format
`[amorce, suite]` en **texte pur**.

⚠️ **C14 — la règle EXACTE de comptage** : `catch\s*\([^)]*\)\s*\{\s*\}`.
★ **Elle attrape donc `catch(_){ }`**, y compris celui d'un logger qui ne peut pas se logger
lui-même. **Correctif : tester `if(window.logError)` au lieu d'envelopper.**
★ **Compter avec la regex du preflight, pas avec un grep artisanal.**
★ Note : un `catch(e){ /* commentaire */ }` **n'est pas compté** par cette regex. C'est acceptable
quand le commentaire explique une reprise volontaire (essayer l'adresse suivante) **et** que
l'échec final est rapporté à l'utilisateur — jamais pour avaler une erreur en silence.

★★★ **C15 — LA RÈGLE QUI MORD LE PLUS SOUVENT. À lire avant tout lot.**

**C15 raisonne FICHIER PAR FICHIER.** Une fonction déclarée `function X(){…}` dans un fichier et
appelée uniquement depuis un AUTRE fichier est comptée comme morte.

Cas vécus :

1. **Le moteur livré en avance sur son écran.** **Ne jamais livrer un moteur sans son appelant.**
2. **La fonction appelée depuis un onclick d'ailleurs** → l'écrire `window.X = function(){…}`
   (`_bcExportChoix`, `_mlProjMalo`, `_pcavGo`, `_dmrGo`, ★ `agtInsRepr`, ★ `agtInsFut`).
   ⚠️ **Effet de bord : un harnais qui extrait par `indexOf('function X(')` cesse de la trouver.**
   Un extracteur doit gérer les trois formes.

★ **Le critère de comptage correct** : compter **toutes** les mentions, point compris, puis retirer
**1 (déclaration) + 2 × nombre d'exports**. ⚠️⚠️ **Ce critère ne vaut PAS pour une expression
`window.X = function`** : il n'y a alors pas de déclaration séparée, et un compteur artisanal
annonce « MORTE » à tort.
**★★ Conclusion : ne pas raisonner sur un compteur maison — LANCER LE VRAI PREFLIGHT.**

★ **Contre-exemple utile** : `_rmExportChoix` est une **déclaration** classique, appelée depuis un
`onclick` écrit dans une chaîne HTML de `cave.js` lui-même. Cette occurrence textuelle suffit à C15.
**La différence entre les deux cas tient à un seul `onclick`, dans le bon fichier ou non.**

★★★ **CE QUE LE PREFLIGHT NE VOIT PAS — LE CONTRÔLE MAISON DES HANDLERS (09/08).**
**Le preflight ne teste que `onclick`.** Or `onblur`, `onchange`, `oninput` et `onsubmit` subissent
**exactement le même sort** après le build IIFE : une fonction locale est invisible depuis un
handler écrit dans du HTML, et **le bouton ne fait rien, en silence**.
Vécu : sur le lot des périodes, le preflight a signalé six `onclick` non exposés — mais
**`agtInsPerDate`, branchée sur `onblur`, n'aurait été signalée par rien**, et les dates de période
ne se seraient jamais enregistrées.
**Contrôle à lancer sur tout fichier qui construit du HTML :**

```python
h = set(re.findall(r'on(?:click|change|blur|input|submit)=\\?"([A-Za-z_$][\w$]*)\s*\(', src))
manquantes = [f for f in h if not re.search(r'window\.' + re.escape(f) + r'\s*=', src)]
```

★ Résultat attendu sur `admin-gt.js` : **une seule** fonction non exposée, `openOv`, qui est une
globale de `app.js`.

### ★★★ C22 — l'accompagnement ne doit pas décrocher du code (09/08)

**Pourquoi il existe.** L'aide contextuelle, la visite guidée et le guide public décrivent des
écrans. Quand un écran bouge, ils mentent — **et en silence** : `document.querySelector()` qui ne
trouve rien renvoie `null`, il **ne lève pas**, donc aucun `catch` de repli ne se déclenche.
Vécu : la clé d'onglet `ecf` a disparu au regroupement du Pilotage ; la visite publique a continué
à la demander pendant des semaines, projecteur posé au hasard, **sur le lien de démo publié**.

**Ce qu'il vérifie**, en tolérance zéro et sans aucune clé de baseline :

- **a.** une clé d'onglet **retirée** (celles de `_PIL_TAB_MIGR`, qui ne sert qu'à migrer l'onglet
  mémorisé) ne doit plus être citée comme littéral hors de `pilotage.js` ;
- **b.** tout `[data-tab="…"]` écrit en dur doit appartenir à `_PIL_VALID_TAB` ;
- **c.** chaque `#id` et `.classe` visé par la visite guidée doit exister dans les sources ;
- **d.** chaque `window.X()` appelée par la visite doit être définie (liste `WIN_NATIF` pour les
  objets du navigateur) ;
- **e.** chaque fiche `MV_AIDE` doit avoir sa page `#page-<clé>`, et chaque page sa fiche
  (liste `AIDE_EXEMPT`, commentée : `admin-gt` et `chat` sont hors périmètre client) ;
- **f.** chaque `ancre` de fiche doit être un `id` réel de `public/guide.html`.

⚠️⚠️ **DÉFAUT DU CONTRÔLE, trouvé par contre-épreuve et corrigé** : le corpus de recherche de (c)
doit **EXCLURE le bloc `_mvtSteps` lui-même**. Sinon un sélecteur écrit là est sa **propre preuve
d'existence**, et le contrôle ne détecte jamais rien. Cinq contre-épreuves ont été rejouées après
correction ; les cinq rougissent.

⚠️⚠️⚠️ **CE QUE C22 NE FAIT PAS, ET NE FERA JAMAIS : juger un texte.** Il vérifie que les
sélecteurs pointent quelque part, pas que la phrase dit la vérité. **Une fiche peut être verte au
preflight et complètement périmée.** La mise à jour éditoriale reste une décision humaine, à
prendre **au moment du lot** (§27a).

**Le cliquet.** La référence vit dans `scripts/preflight-baseline.json`. Plus que la référence →
**ERREUR nommée** ; égal → silence ; moins → **avertissement « regraver »**.
Régénérer : `node scripts/preflight.mjs --baseline`.
⚠️ **Ne jamais regraver pour faire taire une erreur rouge.**
★★ **Le corollaire : après une baisse, il FAUT regraver**, après avoir prouvé **clé par clé** qu'il
n'y a aucune hausse. C'est ce qui distingue une regravure légitime d'un étouffement.
✅ **La baseline a été regravée**, elle est datée du 09/08.
⚠️ **Ne pas regraver depuis une arborescence reconstituée par Claude** : le `package.json` de
`/mnt/project` est celui de **`functions/`**, pas celui de la racine → faux avertissement « build
n'appelle pas inject-precache ». Le retirer de la racine reconstituée.

★ **Niveau de référence à connaître** : sur une arborescence reconstituée saine, le preflight sort
**0 erreur et 11 avertissements**, tous des baisses préexistantes plus le faux positif
`package.json`. **Toute valeur supérieure vient du lot en cours.**

⚠️ **Avant toute livraison, compter les `catch{}` du fichier de base et vérifier que le patché n'en
ajoute pas.** Remplacement type : `window.logError({level:'info', cat:'…'})`.

---

## 7. Versioning — deux séquences indépendantes

**Séquence APP** (visible du client) :
1. `APP_VERSION` dans `src/utils.js` — ⚠️ la forme réelle est **`export const APP_VERSION = '…';`**
2. **4 affichages RÉELS** dans `index.html` (**à la racine**) : footer `·`, `.mod-header-sub`,
   `.ver-tag`, `#wn-version-badge`
   ⚠️ **JAMAIS** les commentaires CSS `(vX.XX)`, ⚠️ **JAMAIS** le `v5.12` du commentaire HTML de
   l'Élevage.

**Séquence SW** (invisible du client) — bumpée à **chaque** modification de `index.html` /
`app.js` / `utils.js` / `styles.css` :
1. en-tête `// MA VIGNE — Service Worker vX.YY`
2. `CACHE_NAME = 'mavigne-vX.YY'`
3. **2 `console.log`**
4. **1 ligne de changelog** en tête de fichier (on **prépend**)

⚠️⚠️ **PIÈGE DU REMPLACEMENT GLOBAL, vécu quatre fois.**
Un `sw.js.replace(ancien, nouveau)` global touche **aussi la ligne de changelog du lot précédent**,
qui décrit un tout autre travail. Symptôme : deux lignes portent le même numéro et l'historique ment.
**Procédure sûre :** remplacer globalement, **puis restaurer la ligne de changelog précédente**,
**puis prépendre** la nouvelle. Vérifier ensuite que l'ancien numéro subsiste **exactement une
fois** dans le fichier — c'est l'assertion qui ferme le piège.

**Ne bumpe RIEN** : modifier seul `pilotage.js` · `planning.js` · `firebase.js` · `reglages.js` ·
`cave.js` · `tracteur.js` · `phyto.js` · `reserve.js` · `admin-gt.js` · `onboarding.js`.
Backend seul non plus. **`firebase.json` non plus.** **`scripts/` non plus.** Les pages statiques
hors `SHELL_STATIC` / `PRECACHE_ASSETS` non plus — ★ **`public/guide.html` et
`public/mise-en-route.html` en font partie**.

★★ **Deux modules JS ensemble ne bumpent pas non plus.**
**Conséquence pratique : des lots VISIBLES du client peuvent s'accumuler sans annonce.**
★★ Vécu trois fois : les lots C et D du 07/08, **l'écart de cadence du 09/08 au matin**
(`pilotage.js` seul), qui changeait un chiffre affiché sans que rien ne le dise, et ★ **toute la
série installation du 09/08 au soir** — cinq lots, `admin-gt.js` + `firebase.js` + backend + une
page publique, **aucun bump**, mais **invisible du client par construction** (tout se passe dans la
console GT).
**Règle retenue et APPLIQUÉE : quand un lot visible part sans bump, le prochain bump l'annonce dans
son `WHATS_NEW`.** Le récap cumulatif (`_whatsNewSince`) fait le reste.
★ **Nuance utile** : un lot GT n'a rien à annoncer au client. Ne pas encombrer `WHATS_NEW` de
travaux qu'aucun vigneron ne verra jamais.

★ **Cas « identité légale »** (SIRET, adresse, téléphone) : `index.html` et `app.js` sont touchés →
**bump SW obligatoire**, mais `utils.js` ne l'est pas → **`APP_VERSION` inchangé**, `WHATS_NEW`
intact. Modèle du **correctif invisible**.
★ **Même cas le 09/08 pour le correctif `ecf`** : il ne touchait que la démo publique, donc
`WHATS_NEW = []` et bump SW seul.

★★ **Règle du doute sur le SW — l'asymétrie tranche toute seule.**
Quand on livre un second lot sans savoir si le précédent a été déployé : **toujours bumper**.
- Réutiliser le numéro N alors que N est déjà en ligne → les clients déjà passés en N **gardent
  l'ancien `index.html` pour toujours**. Grave, silencieux, difficile à diagnostiquer.
- Sauter un numéro → **aucune conséquence**.

**`WHATS_NEW`** (dans `utils.js`, forme réelle **`export const WHATS_NEW = [`**) = journal
**versionné** `[{v, items:[{emoji,titre,desc}]}]` : on **préfixe un bloc**, jamais on ne remplace ;
récap **cumulatif** via `_whatsNewSince`/`_cmpVer` ; sous-lot technique = `items:[]` ; correctif
invisible = `WHATS_NEW = []` et **bump SW seul** ; rédaction **du point de vue de l'utilisateur** —
le problème vécu d'abord, le correctif ensuite.

⚠️⚠️ **Un `WHATS_NEW` n'est PAS une preuve de livraison.** **Lire la fonction.**

★ **Contrôle systématique, à exécuter en Node** : tête du tableau === `APP_VERSION`, ordre
décroissant strict, zéro version en double, zéro backslash visible, zéro **demi-surrogate ISOLÉ**,
puis `_whatsNewSince` joué sur la version précédente (→ 1 bloc), une version ancienne (→ récap
cumulatif), la version courante (→ rien), une version future (→ rien).
★ **Patron d'exécution** : découper le tableau du fichier, remplacer `export const` par `const`,
ajouter `export {WHATS_NEW};`, et l'importer en `data:text/javascript;base64,…`.
⚠️ **Le contrôle des surrogates doit vérifier l'APPARIEMENT**, pas la simple valeur : un émoji hors
BMP est représenté par une **paire** légitime, et `charCodeAt(0)` sur ce caractère renvoie son
premier surrogate. Un test naïf déclare une faute là où il n'y en a pas (vécu le 09/08).

★★ **Un usage de plus :** annoncer **l'assiette d'un chiffre** quand il peut être mal lu.
« la surface travaillée additionne les passages », « le rendement moyen ne porte que sur les
parcelles récoltées », « sans réglage propre, un millésime suit le seuil général ».
**Un chiffre juste mais mal compris vaut un chiffre faux.**

### ⚠️⚠️ Émojis

Dans le **fichier JS livré**, un échappement s'écrit **`\u{1F529}` avec UN SEUL backslash**.
Écrire `\\u{…}` produit du **texte littéral affiché à l'écran**, en silence.
(En Python, il faut une chaîne `r"""…"""` ou un doublement contrôlé. Vérifier par
`frag.count('\\')` sur le fragment écrit, jamais à l'affichage des outils, qui **double** les
backslashes.)
Interdiction **inchangée** : jamais un **demi-surrogate isolé** → `open('w')` **tronque le fichier**.
⚠️ **Sélecteur de variante** `\u{FE0F}` derrière les pictogrammes à forme texte (🗓 ⚙ ⏱ ✏ 🕰 🗃 ↩ 🗑).
⚠️ **Piège d'ancre Python** : dans une chaîne `r'''…'''`, `\"` produit backslash + guillemet.
⚠️ ★ **Dans un PDF, c'est l'inverse du web** : les polices du projet (latin) n'ont **aucun** émoji,
et un caractère absent sort en **carré noir** que l'extraction de texte ne voit pas (§18c).

---

## 8. Service Worker

- Précache **atomique** : `SHELL_STATIC` + `PRECACHE_ASSETS`. Si un seul asset échoue, l'install
  échoue → pas de cache moitié-ancien/moitié-neuf.
- `index.html` en **network-first** ; `/assets/` en cache-first (noms hashés).
- ⚠️ `SHELL_STATIC` ne contient que `icon-192.png`, `icon-512.png`, `logo-gt.png` et `boot.js` :
  **les pages juridiques, le guide et le formulaire de mise en route ne sont pas précachés**. Mais
  l'`index.html` qui embarque les CGU/DPA **en app**, lui, exige le bump.
- Cache tenant séparé (`TENANT_CACHE`), purge des anciens caches à l'`activate`.
- `boot.js` précaché : si `__MV_BOOTED` absent après 10 s → rechargement auto, puis « Réessayer ».
  ⚠️ `__MV_BOOTED` est posé **dès l'évaluation d'`app.js`** : il ne couvre PAS un `_fbLoad` bloqué. C'est
  `_mvBootGarde` (filet à 15 s) et les attentes bornées de `_fbLoad` qui le font (§145).
- **Mise à jour actuellement FORCÉE** par trois mécanismes cumulés : `skipWaiting()`,
  `clients.claim()`, et `location.reload()` sur `controllerchange`.
  ⚠️ Le chemin « reload poli » via `_swUpdatePending` est **du code mort**.
- ★ **Piste étudiée (non livrée)** : retirer `skipWaiting()` automatique, afficher un **bandeau** et
  utiliser le `postMessage({type:'SKIP_WAITING'})` **déjà présent**. Niveau 1, par appareil.

## 8b. En-têtes HTTP, CSP & cache

| Portée | En-tête | Valeur |
|---|---|---|
| `**` | Strict-Transport-Security | `max-age=31536000` |
| `**` | Content-Security-Policy | **mode ENFORCE** |
| `**` | X-Content-Type-Options | `nosniff` |
| `**` | Referrer-Policy | `strict-origin-when-cross-origin` |
| `**` | X-Frame-Options | `SAMEORIGIN` |
| `**` | Permissions-Policy | `geolocation=(self), camera=(), microphone=(), payment=()` |
| `/sw.js` | Cache-Control | `no-cache` |
| `@(/\|/index.html)` | Cache-Control | `no-cache` |
| `/assets/**` | Cache-Control | `public, max-age=31536000, immutable` |

★ **Redirection 301** : `/logiciel-vigne` → `/logiciel-vigne.html`.

⚠️⚠️ **La CSP est en ENFORCE, et l'était déjà avant le 01/08. SEC-3 est fait.**
Ce qui reste vrai : la CSP autorise **`'unsafe-inline'` en `script-src`**, obligatoire tant que
l'app repose sur les `onclick` écrits dans le HTML — décision d'architecture **gelée**.
★ **Elle autorise aussi `connect-src` vers `*.cloudfunctions.net` et `*.run.app`** — ce qui suggère
que les formulaires publics appellent les Cloud Functions **en URL absolue**, et non par une
réécriture `/api/…`. ⚠️ À vérifier : `rewrites` est **absent** du `firebase.json` lu (§18b).

★★ **Pourquoi le `Cache-Control` comptait.** Il n'y en avait **aucun** : Firebase applique alors son
défaut (≈ 1 h) **à tout**, y compris `sw.js`. Après un déploiement, un client déjà installé pouvait
rester **jusqu'à une heure sur l'ancien service worker**, **sans aucun signal**.
- `no-cache` ne veut **pas** dire « pas de cache » mais « revalider avant de servir » → 304.
- Il faut **`/` ET `/index.html`** : une requête sur `/` ne correspond pas au motif `/index.html`.
- ⚠️ **`/fonts/` volontairement laissé au défaut** : les polices ne sont pas hashées.

⚠️ **Toute modification de la CSP = bump `sw.js`** (un SW fige sa CSP à son installation).
⚠️ En cas de conflit sur une même clé, Firebase applique le **dernier** bloc qui correspond.

★ **Les documents imprimables chargent `/fonts/fonts.css`** en absolu (§20f) : c'est ce qui donne
Cormorant et Outfit dans un onglet ouvert depuis un Blob. Aucun CDN, aucune requête externe.
★ **Le guide public aussi** : ses sources et son layout n'ont aucune dépendance externe.

---

## 8c. Sécurité — rules, claims, lots SEC

**Claims** (plafond 1000 octets) : `tenant:"slug"` · `ro:true` · `gtAdmin:true` · `demo:true` ·
`adm:true` · `plan` · `trial_until` · `mustpwd` · ★ `gts` (expiration de session GT, SEC-GT/2).

⚠️ **RÈGLE ABSOLUE** : `setCustomUserClaims()` **remplace l'intégralité** des claims. **Toute**
écriture passe par `mergeClaims()` / `mergeClaimsUid()` — `setCustomUserClaims` n'apparaît
qu'**une seule fois** dans tout `claims.js`, dans `_mergeInto`.

**Lots livrés** : **SEC-1** (verrou d'écriture serveur, `adm:true`) · **SEC-2** (mots de passe
individuels, claim `mustpwd`) · **SEC-3** ✅ (CSP en enforce) · **SEC-4** (`storage.rules`) ·
**SEC-5** (logout : purge `LS_KEY` + `mavigne_backup_*`, **file offline préservée**) · ★ **HSTS** ·
**SEC-7** ✅ (cliquet XSS C24 + App Check C25 ; ⚠️ **le volet « basculer App Check » était déjà
fait avant le lot** — voir §54a) ·
⚠️ **SEC-GT/2** (code à usage unique par e-mail, 06/08) — repéré au changelog, **non documenté ici**.

⚠️ **SEC-1 — RÈGLE DE LECTURE : NE JAMAIS RESTREINDRE LES LECTURES.**
`_pullKeys` lit **26 collections en parallèle**. Un refus de lecture = clé non appliquée =
`_mvKeyLoaded[key]` faux = la Couche 2 anti-perte refuse **toutes** les sauvegardes de cette clé.
Symptôme : « je ne peux plus enregistrer », **aucune trace**.

⚠️ **`assertRealEmailForAdmin`** : les adresses factices sont bloquées pour un admin. Un nouveau
claim ne prend effet **qu'après rechargement** (cache de jeton ~1 h).
⚠️⚠️ **Trois choses distinctes sur les adresses fictives** :
1. la **regex de détection** côté serveur couvre `@mavigne.app` **et** `@mavigneapp.fr` ;
2. la **convention réelle d'un domaine** n'est ni l'une ni l'autre par défaut — elle se **déduit**
   des comptes déjà en place (§18b) ;
3. un **administrateur** ne peut pas avoir d'adresse fictive : c'est son seul moyen de récupérer
   son accès. ★ L'écran de création en lot le dit **avant** d'essayer.
⚠️ **Accorder `admin` expose les rémunérations des collègues** (`paie`) — à discuter avant.

★★★ **Les règles se prouvent en les EXÉCUTANT (RULES-1, §189).** `mv-harnais-rules` joue 53 requêtes réelles
sur l'émulateur (isolement entre domaines, `off`, `ro`, admin-only, `paie`, `config`, démo, session GT, collections
fermées). **Toute modification de `firestore.rules` ajoute son cas ET sa contre-épreuve** — un contrôle qui LIT le
fichier (preflight, `mv-harnais-droits`) voit qu'une ligne existe, jamais ce que le moteur en fait.

**Projeté — rôle `pilotage` (`pil:true`)** : lecture étendue y compris `paie`, **aucune écriture**.
**Deux arbitrages avant** : `paie` complet ou `paie_agg` agrégé ; inscription au registre art. 30.

---

## 24. Pièges de build / CSS / HTML / modules ES — checklist

### ★★★ CE QU'AUCUN CONTRÔLE AUTOMATIQUE NE VOIT (ajouté le 15/08, §42h)

**Le preflight, les harnais et la CI ne lisent pas une mise en page.** Trois défauts du chantier
ergonomie n'ont été trouvés qu'en **regardant une capture** :

- ⚠️⚠️ **Dans un conteneur `display:flex`, CHAQUE élément enfant devient un item séparé.** Un `<b>`
  au milieu d'une phrase forme sa propre colonne et coupe le texte en morceaux. **Toute ligne
  susceptible de contenir du HTML doit envelopper son texte dans un `<span>`** (`flex:1;min-width:0`).
  ★ Le piège est **impossible** quand le contenu est échappé (`_pilEsc`) : aucune balise ne survit.
- ⚠️ **Une règle de base à `width:100%` sabote une frise horizontale.** Passer une grille en
  `display:flex` ne suffit pas : il faut **neutraliser la largeur héritée**, sinon le premier
  élément prend tout.
- ⚠️ **Ne JAMAIS extraire du CSS injecté par expression régulière.** Elle casse sur les apostrophes
  échappées et rend une feuille mutilée — on croit alors à un défaut de style.
  ★ **On exécute la fonction** avec un faux `document` et on récupère ce qu'elle pose.

★ **Corollaire de méthode** : après tout lot qui touche la mise en page, **produire un rendu et le
regarder**. Une assertion verte n'a jamais montré un texte coupé en trois.

**Build (JS / Rollup / IIFE)**
1. Toute fonction appelée par un `onclick` injecté doit être exposée sur **`window.*`**.
   ★ Vécu six fois : `selCopMil`, `_caveSeuilMilStep`, `_caveSeuilMilReset`, `_dmrGo`,
   ★ les six fonctions de périodes et ★ les deux de machines (§18b).
   **Symptôme : le bouton ne fait rien, en silence.**
   ⚠️⚠️ **Et le preflight ne regarde QUE `onclick`** : `onblur`, `onchange`, `oninput` ont le même
   sort. **Contrôle maison obligatoire** (§6c).
2. **Apostrophes françaises** dans une string single-quoted → `\'`, `&#39;`, ou **`\u2019`**.
   ★★ **Corollaire** : dans les chaînes destinées au client, **n'utiliser QUE l'apostrophe
   typographique `'`** — elle ne peut pas fermer une chaîne, et elle est correcte typographiquement.
   ★ Et **écrire les ACCENTS** : le style du fichier peut être « commentaires sans accents », les
   textes affichés **jamais**.
3. `font-family` **sans quotes** pour les noms simples.
4. Persister via **`fbSave`**, pas `fbDoc`.
5. **iOS `input[type="time"]` / tout champ posé après `innerHTML`** : `.value` assigné **en JS**.
   ★ Vaut aussi pour un `<textarea>` dont on colle le contenu, et pour un `<select>` dont on veut
   présélectionner une option (§18b).
6. Pas de doublon `let`/`var` ; **TDZ** : `window.X = X` **juste après** `let X`.
   ★★★ **ET CE N'EST PAS UNE QUESTION DE TDZ : UN NOM LU DANS UN AUTRE MODULE SANS `window`
   N'EXISTE PAS APRÈS LE BUILD.** Rollup donne un scope à chaque module. Un nom nu dans le
   module B n'est **pas** relié à la déclaration du module A : Rollup le classe *globale du
   navigateur*, puis **RENOMME la déclaration de A** pour ne pas la masquer — `loginPendingIdx$1`.
   Les lecteurs restent sur le nom nu. **ReferenceError en production.**
   ⚠️ **Terser n'y est pour rien** : `minify:false` produit exactement le même bundle.
   ⚠️ **Et si la déclaration renommée n'a plus aucun lecteur, le tree-shaking la supprime** :
   `STADES_PHENO` avait purement disparu des 3 Mo livrés — zéro occurrence de « BBCH 07 ».
   ★ **Trois manquements ont vécu depuis le commit initial**, invisibles à tous les filets
   (build vert, `node --check` vert, preflight vert) : `loginPendingIdx` (le lien
   « Mot de passe oublié ? » ne faisait rien — remonté du terrain le 21/08),
   `STADES_PHENO` (le bouton « nouveau traitement » n'ouvrait pas), `db` (chat v8 sur SDK v10).
   ★★ **Le filet : `scripts/mv-harnais-globaux.mjs`** (dans `prebuild` **et** `npm run check`).
   Il rejoue le scope de Rollup **module par module** — ESLint `no-undef`, `sourceType: module` —
   et exige que tout nom libre soit **une primitive du langage, une globale CDN déclarée
   (`firebase`, `L`), ou posé sur `window`**. 6 s, pas de build. `npm run test:globaux` joue les
   contre-épreuves, dont **un défaut inédit injecté dans un module étranger au lot** : un harnais
   écrit après la panne attrape toujours la panne, ça ne prouve rien sur la suivante.
   ⚠ **Ce qu'il ne prouve pas** : la **chronologie**. Un nom posé par un module tardif et lu au
   chargement par un module précoce passe au vert et casse quand même.
   ⚠ **Corollaire de méthode** : la règle existait déjà ici **sans contrôle**. Une règle écrite
   et non instrumentée ne tient que par la vigilance — trois fois, la vigilance a manqué.
7. **Émojis** : `\u{1F529}` avec **un seul** backslash ; `\u{FE0F}` derrière les pictogrammes à
   forme texte. Un **demi-surrogate isolé** **tronque le fichier**.
8. **`const DEBUG` déclaré dans CHAQUE module.** ✅ 11/11.
9. **C15** : une fonction dont les seuls appelants sont ailleurs s'écrit `window.X = function(){…}`.
   ★ **Et ne jamais livrer un moteur sans son appelant.**
   ⚠️ **Effet de bord** : un harnais qui extrait par `indexOf('function X(')` cesse de la trouver.
10. ★ **`requestAnimationFrame`** : le premier `ts` peut valoir **0**.
11. ★ **Une propriété qui traverse plusieurs fonctions doit être vérifiée de bout en bout.**
12. ★ **Une fonction qui reconstruit un objet de zéro perd tout ce qu'elle ne réécrit pas.**
    **Préférer `Object.assign({}, source)` puis n'imposer que ce qui doit l'être.**
    ★ Quatrième occurrence le 09/08 : la config écrite par l'assistant d'installation est un
    `Object.assign` du socle **puis** de ce qui a été repris — aucune des quatre clés d'origine ne
    peut être perdue (§18b).
13. ★★ **`(table[k] || defaut)` est INTERDIT dès que `table` peut valoir 0.** `0 || 9` rend `9`.
14. ★ **Un SVG à `viewBox` fixe doit être borné en largeur.** ★★ **Depuis août, préférer CSS pur.**
15. ★★★ **VÉRIFIER LA SIGNATURE D'ENTRÉE, pas seulement le contrat de retour.**
    **Aller lire comment l'appelle le module qui s'en sert déjà.**
16. ★ **Une entité HTML pré-échappée passée à une fonction qui échappe donne un double
    échappement.** **Passer le texte brut, laisser la fonction échapper.**
17. ★★★ **`document.querySelector()` NE LÈVE PAS : il renvoie `null`.** Un `try/catch` autour ne
    protège de rien, et le repli ne se déclenche jamais. **Tout chemin de navigation doit tester le
    résultat et TRACER quand il ne trouve pas** (`else if(window.logError)`). C'est le bug `ecf`, et
    c'est la raison d'être de C22.
18. ★★ **Deux gardes qui décident la même chose finissent par diverger.** Une branche atteinte
    seulement « parce qu'une garde plus haut l'a filtrée » doit **se protéger elle-même**.
    ★★ **Corollaire inverse, vécu le 09/08** : quand plusieurs fonctions lisent les mêmes listes,
    **une seule normalisation en tête** vaut mieux qu'un `|| []` semé à chaque lecture — on en
    oublie toujours un (`_agtInsNorm`, §18b).
19. ★★ **Un index partagé entre deux listes est un piège.** Vécu : une boucle sur les parcelles
    remettait à vide le champ de la **période** de même rang, que la boucle précédente venait de
    remplir. **Trouvé par le harnais DOM, invisible à la lecture.**
20. ★★★ **UNE DONNÉE ENREGISTRÉE PAR UNE VERSION D'AVANT N'A PAS LA FORME D'AUJOURD'HUI** (RELEVE-3, §191). Un instantané,
    une sauvegarde, une archive ne gardent que les champs choisis le jour où on les écrit. Tout lecteur d'une donnée
    persistée tolère un champ absent (`Array.isArray(x)?x:[]`, jamais `x.length` nu) ; et un harnais qui ne joue que des
    données fabriquées par le code du jour ne le verra jamais — d'où le tirage au hasard de `mv-harnais-robustesse-planning`.

**CSS / HTML**
1. **`display:flex|block` sur `#page-xxx` interdit.**
2. Un **`.modal` doit avoir un parent `.overlay`**.
3. **Balance des `<div>`** ; pour `<p>`, regex **`<p[ >]`**.
   ⚠️ **Comparer TOUJOURS base → patché** : `cave.js` et `sw.js` ont des déséquilibres préexistants.
   **Un écart identique des deux côtés est une non-régression, pas un bug.**
4. ⚠️ **CRITIQUE HTML5 — `<div>` dans `<button>` INVALIDE** : le parser ferme le `button` avant le
   `div` → **rien ne se passe**. Toujours **`<span>`**.
5. ⚠️ Préfixe **`mvs-` PARTAGÉ** → vérifier **token par token**.
6. `#app-content-wrap{flex:1;min-width:0}` requis ≥ 768 px.
7. CSS externalisé → **FOUC** possible en dev, normal.
8. ⚠️⚠️ **`transform` + `animation-fill-mode:forwards`** = piège majeur (§21b).
9. ★ **Nouveau préfixe = vérifier la collision AVANT d'écrire.** Préfixes réservés : **`.mvds-`**,
   **`.hmp-`**, **`.mtr-`**, **`.mur-`**, **`.mvp-`**, **`.rf-`**, **`.mvt-`**, **`.tcv-`**,
   **`.tcfg-`**, **`.acc`**, **`.mlx-`**, **`.mvv-d*`**, **`.mvr-*`**, **`.rm-`**, **`.bc-`**,
   **`.pcv-`** (⚠️ **déjà pris**), **`.pcav-`**, **`.mvc-milrow*`**, **`#cop-mil-*`**,
   **`.dmr-`**, ★ **`.agi-`** (assistant d'installation GT).
10. ★ **Espaces insécables** : les pages juridiques mélangent les formes. **Toujours extraire l'ancre
    du fichier** (`repr()`).
11. ★ **Le dock est en `flex:1`** : ajouter une case ne demande aucune modification CSS.
12. ★ **Un sélecteur de spotlight doit être vérifié dans le DOM réel.** ★★ **C22 le fait maintenant
    au build.**
13. ★★ **Une légende qui énumère doit énumérer UN SEUL AXE.**
14. ★★ **Vérifier un id par TOKEN, jamais par sous-chaîne.** `cop-chip-all` **contient**
    `cop-chip-a` → **borner sur le guillemet fermant**.
15. ★ **Un attribut `data-*` contenant un CHIFFRE** (`data-pd1`) doit être prévu par les sélecteurs
    ET par les stubs de test — vécu le 09/08, un stub trop restrictif faisait rougir du code juste.

---

## 25. Workflow de patch sûr

### ⚠️⚠️ DEUX PIÈGES DE SCRIPT VÉCUS LE 15/08 (§42i)

1. **DEUX « ok » POUR ZÉRO OCTET ÉCRIT.** Un script a affiché « ok » sur ses deux premiers motifs,
   puis l'assert du troisième a levé — et **l'écriture, placée en fin de script, n'a jamais eu
   lieu**. Les « ok » n'annonçaient que la réussite du `str.replace` **en mémoire**.
   ★ **Correctif : écrire après CHAQUE motif, et RELIRE le disque pour confirmer.**
   ```python
   def rep(old, new, quoi):
       s = io.open(P, encoding='utf-8').read()
       assert s.count(old) == 1, 'ANCRE %s : %d' % (quoi, s.count(old))
       io.open(P, 'w', encoding='utf-8').write(s.replace(old, new))
       assert new[:50] in io.open(P, encoding='utf-8').read()   # ← relecture
       print('  ok', quoi)
   ```
2. **UNE CONTRE-ÉPREUVE A LAISSÉ LES FICHIERS ABÎMÉS SUR LE DISQUE.** L'assert « défaut non
   injecté » tombait **après** avoir posé la version abîmée. Repéré en relisant `git status`, **pas
   parce que quelque chose avait rougi.** ★ **On repose la référence AVANT de s'arrêter**, jamais
   dans un bloc final qui peut ne pas s'exécuter.

★ **Et un rappel qui a resservi trois fois** : le fichier mélange des séquences d'échappement
**littérales** (`\u2019`, `\u203A`) et des caractères accentués **réels**. Une ancre en chaîne
Python normale interprète les premières. **`r"""…"""` par défaut**, et extraire l'ancre du fichier
(`repr()`) au moindre doute — une ancre a échoué sur la seule casse de `\u203a` contre `\u203A`.

> **Incident fondateur (`tracSessionId`)** : patcher une copie périmée de `/mnt/project` a réintroduit
> un bug corrigé. **Toujours repartir du DERNIER fichier livré** — désormais, du dépôt GitHub.

> ★★★ **AJOUT DU 12/08 (soir) — TROIS RÈGLES DE TEST, PAYÉES CHER (§34e, §34g).**
>
> **1. LANCER LE PREFLIGHT. Toujours.** `node scripts/preflight.mjs` **avant** chaque livraison.
> Un lot a été livré sans, et la CI a rendu 3 `catch` muets et un `<div>` dans un `<button>`.
> ⚠️ **Un cliquet maison qui ne compte pas la même chose que le filet ne protège de rien** —
> celui-ci comptait `catch{` quand le code écrit `catch(e){}`.
>
> **2. NE PAS DUPLIQUER LE PREFLIGHT DANS UN HARNAIS.** Tentative faite, résultat : un faux positif,
> parce qu'une expression régulière lisait du JS **sans voir les bornes de chaîne**.
> **Le preflight vérifie la mécanique ; les harnais vérifient le SENS.** Un contrôle, une source.
>
> **3. LES COMMENTAIRES NE SONT PAS UNE PREUVE.** ★★★ **Trois fois** dans la même séance, une
> assertion est passée au **vert** parce que le commentaire documentant la correction citait le
> texte corrigé. **Un harnais qui lit ce qu'on raconte au sujet du code ne teste pas le code.**
> Correctif à la racine : la fonction d'extraction retire les commentaires
> (`.replace(/^\s*\/\/.*$/gm,'')`) **pour toutes les assertions**.
>
> ★★ **Quand une assertion rouge tombe : lequel des deux a tort, l'assertion ou le code ?**
> Bilan de la séance : **6 assertions fausses pour 0 bug**, toutes corrigées, aucune contournée.
> ★★★ **Et son symétrique, plus dangereux : une assertion VERTE peut être une panne de lecture.**
> Un découpage d'arguments qui comptait les virgules **dans une chaîne** sautait un site en silence
> et passait au vert **en ne mesurant que 5 sites sur 6**. D'où l'assertion de garde :
> **compter les sites lus**, pas seulement vérifier qu'un motif existe.

1. ★★★ **DEPUIS LE 10 AOÛT : LIRE DEPUIS LE DÉPÔT CLONÉ**, pas depuis une mémoire de session
   précédente. `git clone` (session neuve) ou `git pull` (Nico vient de pousser) AVANT tout
   inventaire. ★ **Faire l'inventaire AVANT de proposer un patch** : sur un changement transverse,
   un `grep -rn` d'exploration **sur le vrai dépôt** donne la liste exacte — c'est plus simple
   qu'avant, puisqu'il n'y a plus de risque de fichier manquant à l'upload.
   ★★ **Une liste de fichiers à PATCHER peut quand même être FAUSSE** si l'inventaire n'a pas été
   fait. Vécu trois fois **avant le passage à Git** : j'ai demandé `reglages.js` pour un bouton qui
   vit en dur dans `index.html` ; j'ai oublié `sw.js` alors que le lot touchait `app.js` ; et ★ j'ai
   failli demander `claims.js` pour un correctif qui tenait en une ligne de `firebase.js`, la Cloud
   Function acceptant **déjà** ce dont j'avais besoin.
   **Vérifier où vit réellement l'écran, ce que le serveur sait déjà faire, et quelles séquences le
   lot bumpe, AVANT de proposer un patch.**
   ⚠️ **Vérifier le nom du fichier avant de patcher** : `firebase.js` ≠ `firebase.json`.
   ★ **Pour ce qui n'est pas dans le dépôt** (ce document tant qu'il n'y est pas commité, archives
   légales, captures) : comparer le md5 de l'upload à celui du dernier fichier livré, dans les
   deux sens.
   ⚠️⚠️ **Ce qui NE change PAS malgré le dépôt** : Claude ne peut toujours pas écrire dans
   `mavigne-dev\` ni pousser. La livraison reste des **fichiers complets** via `present_files`,
   que Nico réintègre à la main puis commit + push via GitHub Desktop. **Le dépôt résout la
   LECTURE, pas l'ÉCRITURE.**
2. **Figer** une copie de travail dans un dossier dédié (`base-<fichier>` pour chaque cible).
   ★ Sur une série de lots enchaînés, numéroter les bases (`base2-`, `base3-`…) : c'est ce qui
   permet un diff **par lot** en plus du diff cumulé.
3. **Patcher en Python** : `str.replace` avec **`assert old in src`** + **`count == 1`**.
   ⚠️⚠️ ★★★ **LE DRY-RUN DOIT ÊTRE SÉQUENTIEL.** Compter tous les motifs sur la source d'origine
   **ne prouve rien** : un remplacement peut **créer** ou **détruire** l'ancre d'un motif suivant.
   Vécu le 09/08 — un garde recopié mot pour mot dans une nouvelle fonction faisait passer une ancre
   de 1 à 2 occurrences, dry-run vert, assert rouge à l'écriture. **Appliquer les motifs l'un après
   l'autre sur une copie, et compter à chaque étape.**
   ⚠️ **Un `assert` qui tombe laisse le fichier INTACT mais la suite du script continue.**
   ★★ **Corollaire** : un `node --check` lancé après un assert tombé valide le fichier **NON
   patché** et affiche « ok ». **Un « syntaxe ok » qui suit un assert rouge ne prouve rien.**
   ★ **Sur un remplacement répété**, écrire un **tableau motif → nombre attendu**.
   ⚠️⚠️ ★ **`.decode('unicode_escape')` interprète AUSSI `\'`** → apostrophe nue qui **ferme la
   chaîne JS**. **Correctif : `\u2019`.**
4. **Valider ESM** : `node --check --input-type=module` en STDIN. `node --check` direct pour le CJS.
   ★ Pour un JSON : `json.loads()` **avant** d'écrire. ★ Pour un script Python généré :
   `ast.parse()`.
5. **Vérifier** balance accolades/parenthèses/`<div>` + **scan des demi-surrogates ISOLÉS**.
   ★ **Contrôle d'intégrité UTF-8 sur les gros documents** : des octets `\xc3` ont déjà été perdus
   en cours d'écriture heredoc (**trois fois**). ★ **Faire ce contrôle APRÈS CHAQUE CHUNK.**
6. **Compter les `catch{}`** base → patché : aucun ajout.
   ★ **Utiliser la regex EXACTE du preflight** : `catch\s*\([^)]*\)\s*\{\s*\}`.
7. **Chercher les références orphelines par token**, jamais par sous-chaîne.
   ★ **Et lister tous les handlers inline** (`onclick|onchange|onblur|oninput|onsubmit`) pour
   vérifier qu'ils sont exposés sur `window` — le preflight ne voit que le premier (§6c).
8. **Exécuter** ce qui doit l'être : harnais moteur, harnais DOM, harnais intégré **et harnais
   backend** (§6b), et `WHATS_NEW` **évalué en Node**.
   ★★ **Et faire la CONTRE-ÉPREUVE** : réintroduire chaque défaut corrigé, vérifier que ça rougit.
   ★ **Le lanceur doit lire le CODE RETOUR** : un harnais qui plante n'est pas un harnais muet.
9. ★ **Diff ciblé contre la base** : compter les lignes modifiées **qui ne contiennent pas le motif**.
   Résultat attendu **0**. ★ **Compter aussi les lignes SUPPRIMÉES.**
   ★★ **Un diff de quelques lignes toutes dans le périmètre vaut mieux qu'un long récit** — c'est le
   contrôle le plus rapide qu'un lot est borné.
   ★ **Pour un DÉPLACEMENT de bloc**, le bon contrôle est différent : même longueur, **et même liste
   triée de caractères**. C'est la preuve qu'aucun octet n'a été réécrit.
10. **Smoke test** puis `npm run test:e2e`.
11. **Gros fichiers** : `create_file` **tronque** → **heredocs `cat >>`** + contrôle après chaque
    chunk. ⚠️ **`create_file` refuse d'écraser un fichier existant.**
12. **Preflight avant deploy — LE VRAI, pas un compteur maison.**
    ★★ **Reconstituer l'arborescence** (`src/`, `scripts/`, `public/`, `guide/`, `functions/`,
    `index.html` à la racine — désormais directement depuis `/home/claude/mavigne-dev/` après
    `git clone`, sans reconstitution manuelle) et lancer `node scripts/preflight.mjs`. C'est le
    seul juge de C11→C25.
    ⚠️ **Si l'arborescence est reconstituée à la main plutôt que clonée** : retirer le
    `package.json` de la racine reconstituée, celui de `/mnt/project` étant celui de `functions/`
    et produisant un faux avertissement.
    ★ **Niveau de référence : 0 erreur, 11 avertissements.**
13. **Livraison** : fichiers **complets** dans `/mnt/user-data/outputs/` via `present_files`.
    ⚠️ **Rappeler le placement** à chaque fois — désormais dans `mavigne-dev\`, pas dans l'ancien
    `mavigne\`.
    ★ Quand un lot en remplace un autre livré plus tôt, **le dire explicitement**.
    ★★ **Ne PAS re-présenter les fichiers inchangés** d'un lot à l'autre (demande de Nico, 09/08) —
    mais **les laisser dans les sorties**.
    ⚠️ **Ne jamais faire `rm -f /mnt/user-data/outputs/*` avant d'avoir recopié ce qu'on garde.**
14. ⚠️ **Pièges d'ancre** : (a) jamais `\u2014` / `\U0001F529` en chaîne *raw* — **SAUF quand le
    fichier contient les échappements EN CLAIR** ; (b) ancres commençant par le caractère collé
    après `">` ; (c) tronquer à la fin de la dernière interpolation utilisateur ; (d) `count == 1`
    sur l'ancre **non échappée** ; (e) ne pas tronquer avant `</div>` quand la string continue ;
    (f) compter les backslashes via `src.count()` ; (g) dans un label Python en apostrophes simples,
    `\\'` casse la chaîne ; (h) ★ **ne jamais supposer un espace insécable** ;
    (i) ★★ **ne jamais supposer qu'un texte est écrit en échappements OU en caractères** ;
    (j) ★★ **ne jamais compter les balises fermantes pour se positionner** ;
    (k) ★★★ **NE JAMAIS RETAPER UNE ANCRE — L'EXTRAIRE PAR `repr()`.**
    **`python3 -c "s=open(f).read(); i=s.index('motif'); print(repr(s[i-2:i+70]))"`** avant d'écrire.
    ★ **Vécu deux fois le 09/08** : une ancre retapée contenant des apostrophes échappées en cascade
    n'a jamais correspondu ; une ancre extraite **trop courte** (deux caractères) n'était pas unique.
    **Extraire une LIGNE ENTIÈRE, bornée par ses retours à la ligne.**
15. **⚠️ Purge de code mort — la méthode complète** :
    - **a.** Vérifier qu'il n'y a **aucun appel dynamique**. Confirmé : **zéro**.
    - **b.** Utiliser le **critère corrigé** (§6c) — ⚠️⚠️ **il ne vaut PAS pour `window.X =
      function`** → lancer le preflight.
    - **c.** **Itérer jusqu'au point fixe.** **d.** Supprimer aussi la ligne d'export.
    - **e.** **Distinguer deux familles de `getElementById` morts.**
    - **f.** ⚠️ **Ne jamais purger le CSS sur la seule foi d'une analyse statique.**
    - **g.** ⚠️ **Vérifier token par token.**
    - **h.** ★ **Une garde peut tuer une fonctionnalité vivante** (`hv2-meteo-card`).
    - **i.** ★★ **Une fonction écrite mais jamais appelée est une erreur de preflight.**
    - **j.** ★★★ **Supprimer un bloc peut emporter une fonction encore appelée.** **C15 ne voit pas
      ce cas** — il détecte les fonctions sans appelant, pas les appels sans définition.
      **Seul le harnais DOM l'attrape.**
16. **Chercher les copies privées d'une logique centralisée.** Deux chemins qui doivent produire le
    même résultat doivent appeler **la même fonction**. Vécus : `planMultiApply` vs « Outils » · la
    liste de tâches de Réglages · le doublon `_saisonForDate` de `tracteur.js` · **`_chargeSaisonData`
    et sa copie du filtre legacy (941 heures fantômes)** · **`pilotage.js` et sa copie du calcul des
    niveaux** · `_arcCampagneDe` · ★★ **les ONZE lecteurs de `ouillage_alerte_j`** ·
    ★★ **les titres de section dupliqués entre le sommaire et le corps du guide** (§27d) ·
    ★ **la lecture des champs du formulaire de mise en route, factorisée en `etatCourant()`** pour
    que la sauvegarde locale et l'envoi lisent la même chose (§27f).
    ★★ **Corollaire : un agrégateur n'est PAS une copie. Consommer, c'est l'inverse de dupliquer.**
    ★★ **Second corollaire, vécu le 09/08** : recopier un ALGORITHME générique (une distance
    d'édition) n'est pas une copie privée d'une règle métier. Le critère est le risque de
    **divergence de sens** : deux définitions de « une journée » divergent, deux implémentations de
    Levenshtein non.
17. **Vérifier ce qu'on cherche avant de conclure à l'absence.**
18. ★ **Un grep brut compte les commentaires.**
19. ★ **Ne jamais croire un changelog.**
20. ★ **Quand une assertion de test tombe, se demander d'abord LAQUELLE DES DEUX a tort.**
    ★★ **Mais toujours regarder POURQUOI elle tombe.**
21. ★ **Un constat d'ABSENCE exige de varier le motif de recherche.**
    ★★ **Et avant de proposer d'AJOUTER une fonctionnalité, chercher si elle existe.**
22. ★ **Avant d'exécuter une entrée de backlog, re-vérifier le constat qui la fonde.**
23. ★★★ **Relire ses propres textes destinés au CLIENT comme du code** : accents, apostrophes
    typographiques, et cohérence avec ce que l'écran fait vraiment.
24. ★★ **Écrire le mode d'emploi de ce qu'on vient de livrer.** C'est un test : l'ordre des blocs
    d'un écran et une liste périmée ont été trouvés en rédigeant, pas en codant (§18c).

---

### ★★ Ce qu'un harnais dit, et ce qu'il ne dit pas (11/08)

★★★ **Écrire les moteurs SANS lecture du DOM est ce qui rend le harnais possible.** Les trois
fonctions d'écriture du Planning (§19a) reçoivent tout en paramètre ; elles s'extraient du fichier
livré et s'exécutent dans Node en quelques lignes. **Une fonction qui lit `document.getElementById`
au milieu de sa règle métier n'est pas testable, et ce n'est pas un détail d'architecture : c'est ce
qui décide si la règle sera vérifiée ou seulement relue.**

⚠️⚠️ **Douze rouges identiques accusent le harnais, pas le sujet.** Le harnais des moteurs a d'abord
donné 12 échecs tous formulés « Cannot read properties of undefined » : un
`new Function('ctx','return ' + wrap)` où `wrap` commençait par un saut de ligne — **ASI**, donc
`return;` puis le corps mort. **Avant de suspecter le code testé, lire le message : douze pannes
identiques sur douze scénarios différents ne décrivent pas douze bugs.**

★ **Extraire par `s.index('function X(')` jusqu'au prochain `\n}\n` embarque la ligne suivante si
c'est un `window.X = X`** — le harnais plantait sur `_planSelKeys is not defined`. L'extraction
doit être nettoyée, ou bornée sur la fonction seule.

★★ **Réexécuter le harnais sur le fichier FINAL, après le lot suivant.** Les moteurs n'avaient pas
bougé sous les onglets du lot 2 — mais c'est une chose qui se vérifie, pas qui se suppose.

### ★★★ La checklist de clôture d'un lot (11/08)

Un lot n'est livrable que quand **les six** sont vraies. Les écrire dans la réponse, pas les penser.

1. **Preflight vert** — `node scripts/preflight.mjs`, 0 erreur. Après une **baisse** de compteur
   (C14, C19…), **regraver** : `--baseline`. Après une **hausse**, corriger, jamais regraver.
2. **Cliquets** — `lint-cliquet.mjs` et `lint-vocabulaire.mjs`. Vérifier qu'ils sont **branchés**.
   ★ **Constaté le 11/08 en les exécutant** : plafond ESLint **déjà à 0, avec 0 erreur** — le
   `for(var i…)` dupliqué d'`app.js` a été corrigé. Le point « passer le plafond à 0 » est clos.
3. **Syntaxe** — `node --check` (CJS) / `--input-type=module --check` (ESM) · accolades CSS
   équilibrées · balance des balises HTML · scan demi-surrogates.
4. **Versions** — bump APP (`APP_VERSION` + **les 4 affichages réels** d'`index.html`) **ET** SW
   (en-tête + `CACHE_NAME` + les 2 `console.log` + une ligne de changelog **prépendée**) dès qu'on
   touche `index.html` / `app.js` / `utils.js` / `styles.css`. Un module JS seul = **aucun bump**.
5. **`WHATS_NEW`** — prépendé, jamais remplacé, rédigé **du point de vue de l'utilisateur** (le
   symptôme vécu, pas la cause technique), **vérifié en l'exécutant en Node**.
   ★★★ **ON NE NOMME JAMAIS UN CLIENT QUI SIGNALE UNE ERREUR.** Ni dans `WHATS_NEW`, ni dans le
   changelog du SW, ni ici — la note s'affiche chez **tous** les domaines, `sw.js` est servi en
   clair sur mavigneapp.fr, et ce dépôt est **public**. Remercier nommément revient à annoncer au
   parc entier qui a eu le problème : un signalement devient une exposition, et le prochain
   signalement n'arrive pas. Écrire « remonté du terrain ». ★ Vécu le 05/09 (GLOB-1) : corrigé
   avant publication, au prix d'un bump supplémentaire.
   ★★★ **ET LA RÈGLE EST PLUS LARGE QUE ÇA : AUCUNE DONNÉE CLIENT DANS CE QUI EST PUBLIé.**
   Le 05/09, en cherchant où un nom de domaine traînait, on a trouvé bien pire dans `app.js`,
   depuis le **tout premier commit** : un roster en dur de **sept personnes nommées avec leur
   adresse e-mail personnelle réelle**, et le **parcellaire complet du domaine de référence** —
   46 parcelles, surface, latitude, longitude. Les deux partaient dans le bundle minifié servi à
   **chaque** domaine client, et vivaient dans un dépôt **public**. Ce n'étaient pas les données
   de l'éditeur : celles de ses collègues et de son employeur.
   ★ **Rien ne le justifiait techniquement.** Le roster arrive de Firestore et écrasait ce seed
   dès le premier pull ; depuis SEC-3 l'adresse de connexion vient du serveur. Le seed n'évitait
   qu'un loader d'une seconde, sur **un** domaine. Retirés en **CONF-1** : `MEMBRES`, `PARCELLES`,
   `COULEURS_MBR` (prénoms de salariés), et deux prénoms réels glissés dans les taux de démo.
   ★★ **Le filet : `scripts/mv-harnais-confidentialite.mjs`**, en CI et dans `prebuild`. Toute
   adresse e-mail littérale dans `src/` ou `public/sw.js` fait échouer le build. **Deux** adresses
   tolérées, celles de l'éditeur, chacune avec sa raison écrite dans le fichier — une exception
   se décide, elle ne se glisse pas. `npm run test:confidentialite` joue les contre-épreuves
   (une adresse de tiers réinjectée dans **chacun** des 13 fichiers surveillés doit rougir).
   ⚠⚠⚠ **CE QUE LE CODE NE PEUT PAS RÉPARER : L'HISTORIQUE GIT GARDE TOUT.** Retirer d'un fichier
   ne retire pas d'un dépôt — `git log -p` rend les adresses. Le harnais protège les prochains
   commits, pas les 176 précédents. Le passé se traite **hors code** : dépôt privé immédiatement,
   puis réécriture d'historique **ou** dépôt neuf en un seul commit propre, puis purge des objets
   inatteignables demandée au support GitHub. ⚠ Et le volet RGPD — information des personnes,
   évaluation d'une notification CNIL sous 72 h — n'est pas une question technique.
   ★★ **CONF-2 (05/09) — pseudonymisation.** Fait dans la foulée : les noms de domaines clients
   ont quitté les **commentaires** de six modules, `firestore.rules` et **ce document**, au profit
   d'étiquettes stables — « le domaine de référence », « le second domaine », « le prospect
   Gironde », « le contact technique », « le signataire ». Les cas de facturation ont perdu leurs
   **montants et numéros de facture** ; la leçon reste, le dossier client disparaît.
   ★ **Le slug `marchand-grillot` RESTE**, et c'est raisonné : il vit dans le code, dans les
   règles Firestore, dans le manifest et dans l'URL `?tenant=`. Le masquer dans la prose
   pendant qu'il est en clair partout ailleurs serait du théâtre. Un slug est un numéro de
   dossier, pas une donnée personnelle.
   ★★★ **CONF-3 (05/09) — LES 46 CONTOURS SONT SORTIS, ET L'ORDRE ETAIT TOUT.** `KML_DATA`
   portait le tracé GPS des vignes du domaine de référence. Il ne pouvait **pas** partir avec
   CONF-1 : pour ce domaine la clé `kml_polygons` était **vide** — les contours n'existaient
   QUE dans le code, et la console GT l'écrivait elle-même en rouge. Les vider au même moment
   que `MEMBRES` et `PARCELLES` = **carte blanche en production, en pleine vendange**.
   ★ **La manœuvre, dans cet ordre exact** : reconstruire un KML à partir du code → prouver
   l'**aller-retour** en rejouant `_parseKML` (46 contours, 301 points, zéro écart, 46 anneaux
   fermés, coordonnées remises en `lng,lat` — l'inversion met les vignes en mer du Nord)
   → importer par la console GT → **regarder la carte** → puis seulement vider le bloc.
   ★★ **Le motif général, à retenir** : une donnée en dur qui est aussi un **repli** ne se
   retire jamais en même temps qu'on découvre qu'elle est en dur. On vérifie d'abord que la
   source de rechange existe **et répond**, à l'écran, avant de couper le repli.
   ★ **Garde-fou posé** : `initMap` journalise en `info` un domaine qui a des parcelles et
   zéro contour. Avant, la carte nue était indiscernable d'un domaine sans KML — un écran
   vide n'est pas un message.
   ★★ **CONF-4 (05/09) — `DOMAINE_NOM` VIDÉ, ET C'ÉTAIT LE DERNIER.** Même famille que le KML :
   un repli affiché avant que Firestore réponde. Vidé **après** vérification que
   `config.domaine_nom` est renseigné en base. Deux chemins le remplacent et le premier suffit :
   l'instantané localStorage le pose avant tout réseau. **Plus aucun nom de client dans `src/`,
   `index.html`, `firestore.rules` ni `public/sw.js`.**
   ★ **Au passage, une coche qui ne pouvait pas être rouge.** Le tableau de bord d'installation
   testait `cfg.domaine_nom || window.DOMAINE_NOM` — la seconde vaut toujours quelque chose, la
   coche « nom du domaine » était donc verte chez un domaine qui n'avait jamais saisi le sien.
   Seule la valeur **en base** compte désormais. ⚠ Conséquence assumée : un client qui n'a pas
   renseigné son nom verra la coche passer au rouge. C'est la vérité, elle était cachée.
   ★★ **Ce qui reste en clair, et pourquoi — liste close** : le slug `marchand-grillot` (numéro
   de dossier, présent dans l'URL, les règles et les chemins Firestore) ; la liste noire de
   `harnais-vitrine.mjs` (pour vérifier qu'un nom n'apparaît pas sur la vitrine, il faut savoir
   lequel chercher — et `scripts/` n'entre pas dans le bundle) ; les deux adresses de l'éditeur
   dans `TOLEREES`. ⚠ `SAISONS`, `ACTIVITES`, `TRACTEURS_LIST` gardent un jeu par défaut spécifique
   au domaine de référence : c'est un défaut de conception (le tenant ne devrait pas fuiter dans
   le code), **pas** une donnée confidentielle — saisons génériques, vocabulaire de métier, « T1
   T2 T3 » sans modèle ni immatriculation. À traiter comme dette, pas comme fuite.
   ⚠ **Reste à traiter** : les noms de domaines clients dans les **commentaires**
   de dix modules, les cas de facturation **nominatifs** d'`admin-gt.js` (montants, numéros de
   facture), et la ligne de `firestore.rules` qui détaille l'effectif d'un domaine. Le contrôle
   mécanique s'arrête où commence la relecture : une adresse a une forme, un nom propre non.
6. ⚠️⚠️⚠️ **L'AIDE** — **Règle d'or n°4**. Fiche `MV_AIDE` du module touché relue **contre l'écran
   neuf**, section du guide, `_mvtSteps`, et tout écran qui énumère ce qui reste à faire. Écrire
   « fiche relue, rien à changer » si c'est le cas — pour que ce soit un constat, pas un oubli.

**Et ce qu'on ne peut PAS cocher côté Claude** — le dire explicitement à la livraison :
`npm run build`, `npm run test:smoke`, `npm run test:e2e` (pas de navigateur), et **le déploiement**.

---

## 27a. ★★★ LA RÈGLE DE L'ACCOMPAGNEMENT — À LIRE AVANT DE CLORE TOUT LOT

> ⚠️⚠️⚠️ **CETTE SECTION EST LA PLUS IMPORTANTE DU DOCUMENT POUR LA SUITE DU PROJET.**

> ★★★ **AJOUT DU 12/08 — CE QUI SUIT LE CODE TOUT SEUL, ET CE QUI NE LE SUIT PAS.**
> La refonte du Pilotage (§34) a renommé et réordonné les huit onglets. Mesure faite :
> · ✅ **`_mvAideOngletsPil` a suivi SEUL** — il lit `window._PIL_TABS` **à l'exécution**.
>   ★★ **C'est le bon patron : une aide qui LIT le code ne peut pas mentir.** À généraliser.
> · ✅ **C22 n'exige rien de plus** : `MV_AIDE` est indexée par **PAGE** (`#page-pilotage`), pas par
>   onglet. Ajouter un onglet n'oblige donc pas à toucher `utils.js`.
> · ❌ **Les lignes écrites EN DUR ont menti** : `MV_AIDE.pilotage` décrivait encore « Décider ».
> · ❌ **Le guide public a menti** : `11-pilotage.html` annonçait les sept anciens onglets en
>   sous-titre. Il n'y a **pas de contrôle mécanique** dessus — §24 et C22 ne jugent aucun texte.
>
> ⚠️ **CONCLUSION** : à chaque renommage d'écran, faire un `grep` du **libellé retiré** dans
> `src/utils.js` (MV_AIDE) **et** dans `guide/`. C'est le seul filet, et il est manuel.

> ★★★ **Depuis le 11/08, cette règle est la RÈGLE D'OR N°4** (en tête de document). Cette
> section en garde le détail et l'histoire ; la règle courte, elle, se lit avant tout lot.

**Trois supports décrivent l'application au client :**

| Support | Où | Qui le voit |
|---|---|---|
| **L'aide contextuelle** (`MV_AIDE`) | pastille « ? Aide » sur chaque module | tous les utilisateurs |
| **Le guide public** (`guide/` → `public/guide.html`) | `mavigneapp.fr/guide.html` | clients **et** prospects |
| **La visite guidée** (`_mvtSteps`) | `?demo=visite` et démo à code | **les prospects**, sur le lien publié |

**Ils avaient décroché de plusieurs mois.** Constaté le 09/08 :
- l'aide du **Pilotage** annonçait « **Six onglets** » en nommant deux onglets qui n'existent plus ;
- l'aide du **Journal** et des **Réglages** renvoyait l'export au mauvais endroit ;
- l'aide de la **Cave** et de **La Réserve** ignorait le parc à fûts, la séparation des millésimes,
  la projection de malo et les deux documents imprimables ;
- le **guide** décrivait un Pilotage à six onglets sans « Décider », une Cave à deux sections, une
  Réserve sans parc, un barème « pratiqué en Côte de Nuits » ;
- la **visite guidée publique** visait un onglet supprimé et posait son projecteur au hasard.

**Pourquoi personne ne l'avait vu :** aucun test ne couvrait ces textes, personne ne les relit — et
le seul qui les lit vraiment, c'est le client.

### ⚠️⚠️⚠️ LA RÈGLE

**Un lot qui change un écran n'est pas fini tant que les trois supports ne disent pas la vérité.
La mise à jour se fait DANS LE MÊME LOT, jamais « plus tard ».**

Concrètement, avant de clore un lot, se poser trois questions :

1. **Est-ce que la fiche `MV_AIDE` du module touché décrit encore la réalité ?** (§27b)
2. **Est-ce que la section du guide correspondante est encore juste ?** Si non → **éditer le fichier
   de `guide/`, régénérer, déployer** (§27d).
3. **Est-ce que la visite guidée pointe encore quelque part ?** Le preflight C22 répond à celle-là
   tout seul, mais **il ne juge que les sélecteurs, pas le texte** de la narration.

★★★ **QUATRIÈME QUESTION, AJOUTÉE LE 09/08 AU SOIR : et l'écran lui-même, que raconte-t-il ?**
Un écran peut mentir sur son propre travail. Vécus :
- l'onglet Cave du Pilotage annonçait « à venir » des choses livrées depuis (§20g) ;
- ★ la liste **« À finir chez ce client »** de l'assistant d'installation réclamait le SIRET, les
  écartements et les fûts **que l'assistant venait d'apprendre à poser** (§18b).
**Un écran qui énumère ce qui reste à faire doit être relu à chaque fois qu'on lui apprend à faire
quelque chose.**

### Ce que le preflight fait — et ce qu'il ne fera jamais

**C22 attrape le mécanique** : un sélecteur mort, une clé d'onglet retirée, une fonction de
navigation disparue, une fiche sans page, une ancre absente du guide. **Il refuse le build.**

**C22 ne lit aucun texte.** Une fiche peut être **verte au preflight et complètement périmée**.

**Donc : le contrôle automatique protège de la panne, jamais du mensonge. Le mensonge, c'est une
décision humaine, au moment du lot.**

★ **Deux mécaniques réduisent la surface de risque** :
- **l'aide LIT la structure au lieu de la DÉCRIRE** — la liste des onglets vient du code (§27b) ;
- **le guide est découpé** — une modification de la Cave touche un fichier de 4 ko, pas 104 (§27d).
★ **Et depuis le 09/08 au soir, une troisième** : la liste « à finir » de l'assistant **se calcule**
au lieu d'être écrite (§18b).

**Mais aucune des trois ne rédige à ta place.**

---

### ★★★ LE TEST DU MODE D'EMPLOI (11/08)

**Un écran qui explique par où passer pour faire quelque chose qu'il ne fait pas là où on le lit
est un écran raté.** Le Planning en comptait **huit** (§19a), dont celui-ci, dans l'onglet Congés
d'une fiche salarié :

> *« Pour poser des congés : grille Équipe → **Sélection multiple** → toucher les jours → ☀️ CP. »*

La phrase était **exacte**. C'est précisément ce qui la rendait dangereuse : une note fausse finit
par sauter aux yeux, une note juste s'installe. Elle a survécu à plusieurs lots.

★★ **La question à se poser en relisant un écran : "est-ce que je décris un chemin ?"** Si oui, deux
issues seulement — **amener l'action ici**, ou **assumer que l'écran ne la fait pas** et ne rien
écrire. Le renvoi vers un autre module reste légitime (le solde initial se règle vraiment dans
Réglages › Équipe) ; le renvoi **à l'intérieur du même module** est un aveu.

⚠️ **Corollaire pour tout lot de refonte : les renvois périmés se traquent PAR GREP.** Chercher les
noms d'écrans supprimés dans `src/*.js`, `index.html`, `MV_AIDE` et `guide/` — huit occurrences
trouvées ainsi, dans quatre fichiers dont deux hors du module refondu (`reglages.js`, `utils.js`).
**Aucun palier de test ne les aurait vues.**

## 28. État courant & backlog

### ⚠️ REV-1 — CE QUI RESTE OUVERT SUR LE REVIENT (§194, posé le 28/09)

1. **À regarder chez Nico, sur les vraies données** : le cycle affiché (sans récolte 2025 saisie, il part un an avant la fin), le
   coût vigne par bouteille, et l'écart avec l'ancien chiffre de la Synthèse (annoncé dans `WHATS_NEW`).
2. **Le prévu de main-d'œuvre ne sait ni le tracteur ni la cave à venir** (`_pecRevPrevuMO`) : il est plutôt haut. Le dire à la
   fiche a suffi pour ce lot ; le soustraire exigerait un planning d'activités qui n'existe pas.
3. **`_pecRevData` est appelé par la Synthèse ET par Revient** : `_ecoTempsVigne` n'a qu'une case de cache, les deux fenêtres
   (période et cycle) se chassent. Coût non mesuré sur un vrai domaine — à regarder si l'onglet rame.
4. ✅ ~~**ROB-2** : ajouter le Revient au tirage au hasard~~ — **fait avec le Pilotage (28/09)** : `mv-harnais-robustesse-pilotage` rend
   Économie › Revient (`rev`) sur les deux axes, à chaque domaine tiré.

### ⚠️ RULES-1 — LE PREMIER RUN RÉEL, PUIS DEUX ÉCARTS À TRANCHER (§189, posé le 27/09)

1. ✅ **Premier run réel, chez Nico le 27/09 : 53/53, 12/12.** Reste à voir le job CI `rules` vert au premier push,
   et que le journal du SDK se tait (`setLogLevel('silent')`, posé après ce run, pas encore rejoué).
2. **F01 — une fiche Inactive lit encore `_mv_signatures/{slug}`** : ce bloc compare le claim `tenant` sans
   regarder `off`. Faible (un reçu CGU, aucune donnée métier), mais contraire à ACCES-1 (§186). Ajouter
   `&& request.auth.token.get('off', false) != true` ? **Décision de Nico.**
3. **F02 — `error_log` n'est borné que pour les `ro`** : la règle 3 (tout membre non-ro) l'accepte sans le plafond
   de 100 de la règle 5. Sans gravité (la limite de 1 Mio de Firestore tient), à aligner ou à assumer.
   Chaque écart fermé : retirer sa ligne de `CONSTATS` dans `mv-harnais-rules.mjs` (le harnais le signale).
4. ✅ **FAIT (LISTE-1, §190) — une liste unique des harnais.** Historique de l'entrée : `check` et `prebuild` sont **deux chaînes identiques de
   142 commandes**, copiées à la main ; et la CI rejoue un sous-ensemble à la main, puis `npm run build` relance
   **tout** via `prebuild` (double exécution). Un manifeste lu par un seul lanceur, `prebuild: "npm run check"`,
   la CI sur le même lanceur. ⚠️ Ne PAS déplacer les scripts en sous-dossiers : les contre-épreuves calculent la
   racine par `join(ICI, '..')`, et les chemins sont écrits dans `ci.yml`, le crochet et des centaines de renvois.

### ⚠️ DIM-4 — L'ORDRE DE SORTIE DES HEURES, CHOIX DU DOMAINE (§193f, posé le 27/09)

Aujourd'hui le taux le plus élevé sort d'abord, partout (paiement, récup, absences). Nico : *« prendre d'abord les heures du taux le
plus élevé ou alors laisser le choix lors de la demande »* — ce n'est pas une généralité, ses clients peuvent faire autrement. La loi
ne règle pas l'ordre ; le choix paiement/repos relève de l'accord collectif ou de l'employeur, jamais du salarié seul. À faire : un
réglage de domaine (défaut : le plus élevé), et le choix de l'employeur au moment de la demande.

### ★ ROB-2 — LE TIRAGE AU HASARD, MODULE PAR MODULE (§191, posé le 27/09)

Seul le Planning passe au tirage au hasard (`mv-harnais-robustesse-planning`). Demande de Nico : *« vérifie partout »*.
✅ **Pilotage fait le 28/09** : `mv-harnais-robustesse-pilotage` charge l'**application entière** dans Node (app.js et ses
modules dans l'ordre réel, sans CSS ni Firebase ; ★ `window` **est** `globalThis`, sinon les noms posés par `window.X =`
et lus nus ailleurs n'existent pas), pose les données par **`applyFbData`** (le vrai chemin — écrire `window.X` laisserait
app.js sur ses copies internes), et rend les 8 onglets + les 6 vues d'Économie × 2 axes sur 12 domaines tirés au hasard
(`--long` : 100). ★ Une erreur **avalée** (`_mvAvale`, niveau info) compte comme un plantage. 4 contre-épreuves.
✅ **LISTES-1 (28/09, SW 8.47)** : le tirage y glisse aussi des éléments nuls DANS les listes. Ils faisaient tomber toute la
page (`_pilData` sur un tracteur nul, **`_parcConcern` d'app.js** sur une parcelle nulle). Corrigé en UN point : **`applyFbData`
et `loadData` écartent des 13 listes d'objets** (`_MV_LISTES_OBJETS`) tout ce qui n'est pas une fiche, avec une trace
`LISTES-1` (clé + types, jamais le contenu). Section C du harnais, et contre-épreuve sur une copie d'app.js (`MV_ROB_APP`).
★ **Une nouvelle liste d'objets = l'ajouter à `_MV_LISTES_OBJETS`.**
✅ **Cave/Cuvier fait le 28/09** : `mv-harnais-robustesse-cave` — 11 vues (Aujourd'hui, Réglages, Millésime ×2, Chai ×3,
Cuvier ×4) + la fiche de chaque cuvée, 12 domaines (`--long` : 100, 1 200 rendus), 5 contre-épreuves. ★ Le chargeur de
l'application entière est **partagé** : `scripts/mv-app-node.mjs` (`chargerApp({remplace})`) — ★ ses doublures (`logError`,
`_mvAvale`…) se posent **APRÈS** le chargement, sinon utils.js les écrase sans bruit. Trouvé et corrigé : une cuvée nulle
faisait tomber le Chai → **LISTES-1 étendu aux listes rangées dans un document** (`_MV_SOUS_LISTES`, SW 8.48) ; trois
« undefined / NaN » d'affichage dans `cave.js` (type d'opération absent ×2, ligne de soufre incomplète, millésime d'une date
illisible). ⚠️ **Tirages essayés et RETIRÉS** : un lot de fûts sans année ou nul, une cuvée sans id — aucun chemin
d'écriture ne les produit ; durcir chaque lecteur contre eux serait du code pour un cas qui n'existe pas.
✅ **Tracteur fait le 28/09** : `mv-harnais-robustesse-tracteur` — Sessions, Entretien, réglages du parc, liste des fiches,
fiche de chaque tracteur (pour CHAQUE tracteur sélectionné), détail et modification de chaque session ; 5 contre-épreuves,
dont deux qui retirent les correctifs eux-mêmes. Corrigé dans `tracteur.js` : « undefined% d'avancement » (session d'avant),
« Tracteur dédié undefined », « date · undefined », type de tracteur absent, et **`data-defid="undefined"` sur toute activité
sans tracteur par défaut — un cas NORMAL en production**. ★ `REPARATEUR_HIST` est un **objet** `{idTracteur:[périodes]}`, pas
une liste : retiré de `_MV_LISTES_OBJETS`, et le générateur du Pilotage le tirait en liste (corrigé). ★ `REPARATEUR[id]=null`
est écrit par la suppression d'un tracteur : le tirage le garde. ⚠️ Retirés du tirage, faute de chemin d'écriture : une
immobilisation sans date de départ (le formulaire l'exige), un pointage de chronomètre dont l'instant n'est pas un nombre.
✅ **Réserve faite le 28/09** : `mv-harnais-robustesse-reserve` — Fûts (millésime courant, tous, 2024), Intrants, Bilan
matière, saisies (achat, inventaire, séparation, nouveau lot), fiche de chaque lot, le parc et le registre qu'emprunte la Cave,
et **4 documents imprimables** (lus par une doublure de `_mvDocOpen` qui garde ce qu'on lui passe). 4 contre-épreuves. Trouvé :
un fût nul faisait tomber les Fûts, le parc de la Cave et le document → **LISTES-1 étendu au document INTRANTS** (SW 8.50).
⚠️ `fut_four`, `fut_ref`, `achat_four` sont des listes de **noms** (textes) : hors du filtre. Retiré du tirage : un intrant sans
catégorie ou sans unité (deux listes déroulantes, jamais vides).
✅ **Accueil/Vigne/Journal faits le 29/09** : `mv-harnais-robustesse-accueil` — Accueil, Vigne (toutes, tâche simple, à
passages, à niveaux), Journal (tous, un ouvrier, une tâche, une parcelle), fiche + panneaux passages/niveaux de chaque
parcelle, le mur, la saisie, l'équipe du jour ; 4 contre-épreuves dont une qui retire le correctif. ★★ **Vrai défaut de
production trouvé** : la fiche d'une parcelle affichait **« NaN h » restantes** dès que la période portait l'Entreplantation
(liste de tâches par défaut) — tâche « à trous » sans barème à l'hectare, `undefined × surface` sur une parcelle sans trous.
Corrigé dans `openDP` (SW 8.52). ★★ **Et un second, trouvé en relisant l'entrée 26 du backlog** : activer une tâche « en temps
réel » du catalogue (Arrachage, Désherbage, Effeuillage, Vendange — **aucun barème `hha`**) affichait **« NaN h » au total de
l'Accueil** (`calcHeures`, branche des tâches simples). `t.hha || 0` comme les branches passages/niveaux. Le tirage de l'Accueil
active désormais ces tâches au hasard (et celui du Pilotage aussi, sans qu'il ait montré le défaut). ⚠️ Retirés du tirage : surface en texte (les deux créateurs
font `parseFloat`), entrée de journal sans date, météo sans `emoji`/`wind` (trois écrivains, toujours complets).
Même patron, un lot par module, dans cet ordre : ~~**Pilotage**~~ · ~~**Cave/Cuvier**~~ ·
~~**Tracteur**~~ · ~~**Réserve**~~ · ~~**Accueil/Journal**~~ (`app.js`). ★ **ROB-2 TERMINÉ le 29/09.** À chaque fois : données abîmées ET formes d'avant de ce que le
module enregistre (instantanés, archives), toutes ses surfaces, rouge sur exception ou « undefined »/« NaN » affiché.

### ⚠️ QUESTION OUVERTE — L'ÉCART DE CADENCE ET LE TEMPS RÉEL (§172f ③, posée le 23/09)

Deux mesures du temps existent depuis TV-1. **L'écart de cadence** (`_pecCadPresence`, Synthèse, verdict, date de fin, facteur
`_pilFacteurK`) compare la **présence globale** du planning (moins le tracteur) au barème de TOUT le travail fait — cave, atelier et
bureau restent dedans (biais écrit à l'écran). **Le temps réel** (`_ecoTempsVigne`) verse les heures aux parcelles **validées** :
il n'a pas ce biais, mais il ne voit que ce qui est validé (le reste est « en attente »).
**La question** : brancher la cadence sur les heures VERSÉES (Σ h versées contre Σ barème des clôtures) ? Nico, 23/09 : *« on laisse
l'écart de cadence comme il est pour le moment »*. **Ne rien changer sans lui.** ★ Depuis ENG-2 (§173), l'engagé retire les journées de cave
et la cadence non : un argument de plus pour la brancher, à lui présenter tel quel. Avant d'en reparler, mesurer chez MG : la part
d'heures « en attente », et l'écart des deux mesures sur une période close.

### ⚠️ PREP-1 — À JOUER SUR UN DOMAINE JETABLE AVANT UN VRAI CLIENT (§134)

1. ⚠️⚠️⚠️ **Le protocole de §134h, en entier, dans la fenêtre privée ngdevpro.** Aucun navigateur côté
   Claude : le harnais prouve la logique, pas l'écran. Point dur : **la feuille, le bandeau, le refus de
   « Début »/« Valider », la sortie, et le journal d'accès relu intact**.
2. **« Accéder » ou « Préparer » : trancher.** Deux portes vers le même domaine, dont une qui n'y fait
   plus entrer (§134e).
3. **Le trou de C23 dans `firebase.js`** : réparer le nettoyeur de commentaires de `preflight.mjs`, puis
   regarder ce que la zone cachait (§134e ⑤).

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §43 (la visite guidée)

1. ⚠️⚠️⚠️ **ALIGNER LES TROIS CHIFFRES DU ROI.** La démo dit **127 h (+37 hors total)**.
   `mvprint.py` dit **215 h/an pour 10 ha** et l'argumentaire oral **3 à 5 h/mois**. Tant que les
   trois ne disent pas la même chose, la plaquette contredit la démo devant le même prospect.
   **C'est le point n°1, avant le devis le prospect Gironde.**
2. ⚠️⚠️ **REGARDER LES 19 MOMENTS EN VRAI.** Le harnais vérifie ce qu'on facture et ce qu'on vise ;
   **il ne voit pas un projecteur mal posé**. En particulier : le moment ouvrier (bascule + retour),
   le dépli des échéances, la sous-vue Parcelles d'Économie, et les deux moments qui enchaînent
   plusieurs rendus (`wait`).
3. ★ **Caler les trois estimations neuves** : pointage 10 min × 220, carnet tracteur 10 min × 60,
   papiers du contrôle 60 min × 6. Elles sont de moi, pas de Nico — lui seul peut les signer,
   comme il a signé les 250 tâches de janvier à juillet.
4. ~~**`lint-cliquet` / ESLint** : jamais joué côté Claude~~ — **RAYÉ le 01/09.**
   ★ **`npm install eslint@9 --no-save` fonctionne dans le bac à sable** (registry.npmjs.org est
   ouvert) : 309 paquets en 12 s, puis `node scripts/lint-cliquet.mjs` tourne normalement.
   L'entrée disait « impossible » là où personne n'avait essayé. **Ce filet est désormais jouable à
   chaque lot, et il doit l'être** — voir §78.
5. **`test:smoke` / `test:e2e`** : jamais joués côté Claude (Chromium injoignable).

### ⚠️ OUVERT DEPUIS LE 25/08 — L'ÉLÉMENT QUI DÉBORDE SUR L'ACCUEIL (§67c)

**La garde `overflow-x:clip` neutralise l'effet ; la cause n'est pas nommée.** Tant qu'elle ne l'est
pas, elle peut réapparaître ailleurs (une page qui n'aurait pas la garde, un document imprimé, un
écran futur). **Le geste** : la sonde complète de §67c, **en simulation mobile (~390 px)**, connecté,
sur l'accueil — pas en largeur bureau, où le layout n'est pas celui du téléphone.
★ Piste à mesurer, **pas un constat** : les items flex de l'accueil sans `min-width:0`
(`.hdre-tit`, `.hmsem-l`, `.hdre-bad`) ne peuvent pas rétrécir sous leur mot le plus long.

### ★ À ÉCRIRE — `mv-harnais-contraste.mjs` (§67d)

Aucun harnais du projet ne lit une couleur. Celui-ci rendrait `index.html` sous Chromium, jouerait
les **deux** thèmes et exigerait ≥ 4,5:1 sur tout élément à texte direct **réellement rendu**.
⚠️ Deux pièges déjà payés : filtrer sur `getBoundingClientRect()` non nul (et **jamais** sur
`getComputedStyle().display`, qui ne voit pas un ancêtre caché), et **recharger la page entre les
deux thèmes**.

### ⚠️⚠️⚠️ AUDIT DU 16/08 — LIRE §44 AVANT DE TRAVAILLER DANS CE BACKLOG

**Ce backlog a été confronté aux fichiers le 16/08, entrée par entrée.** Résultat : **onze entrées
rayées** (le code les avait déjà réglées), **quatre chiffres corrigés à la hausse**, et **neuf
harnais sur vingt-six qui ne peuvent pas démarrer** — dont six qui portent un chemin de bac à sable
en dur et se lisent donc comme des succès.

**Les trois priorités qui en sortent** :

1. ~~⚠️⚠️ **`_pl2Cell`**~~ — **FAIT** (constaté le 31/08, §74a). Le code rendait déjà le retard en
   orange avec ses heures (`pl2c-late`) **avant** la croix rouge. **Douzième entrée périmée** de ce
   backlog. Le reste réel — l'entrée de légende — a été livré le 31/08.
2. ~~⚠️⚠️ **Les six harnais à chemin absolu** (§44c)~~ — **RAYÉ, vérifié le 01/09.** Les huit
   harnais concernés (`bandeau-essai`, `cadence-escalier`, `claude-md`, `parcours-prospect`,
   `reconduction`, `sec3`, `sec7-contre`, `vitrine`) **démarrent tous, code de sortie 0**. Les seules
   occurrences de `/home/claude` qui subsistent sont dans des **commentaires qui documentent le
   piège corrigé** — un `grep` sur le chemin les compte encore et fait mentir cette entrée.
   **Treizième entrée périmée de ce backlog** (§44, §74). ★ *Une entrée de backlog vérifiée par
   `grep` sur une chaîne se périme au moment où quelqu'un écrit un commentaire à son sujet : la
   vérification utile est d'exécuter, pas de chercher.*
3. ⚠️ **0a-quater** — la masse salariale exclut les bureaux pendant que son commentaire dit
   l'inverse. **`avecBureau` : 0 occurrence.**

⚠️ **L'audit n'a PAS pu vérifier l'état EN LIGNE** (bac à sable sans accès au domaine) : tout ce qui
suit décrit **le dépôt**, pas la production. **Détail, preuves et règles nouvelles : §44.**

### ✅ LA FUSION DE `pilotage.js` EST FAITE (commit `2e002ae`)

**Le commit `banc` avait remplacé `src/pilotage.js` par un fichier d'une autre lignée** — 1 690
lignes changées, 1 164 suppressions : `_mvInfoBtn` 28→0, `MV_INFO` 4→0, `_PIL_ST_V` 4→0,
`_pecFiabCard` 4→0, `_pilTile` passé de 9 à 8 arguments. **Signature d'un fichier restauré depuis
une sauvegarde, pas d'une décision** : `utils.js` gardait ses 11 fiches `MV_INFO` sans pastille où
les poser, et la CI lançait toujours trois harnais devenus rouges.
⚠️ **Les deux lignées ne se recouvraient pas** — `7a509b4` portait l'ergonomie sans
`_PIL_CMP_RECOUV`, `c638402` la cadence sans l'ergonomie : **aucun n'était un sur-ensemble de
l'autre**, il a fallu fusionner à la main. **Fait par Nico.** Vérifié : 9 660 lignes, les six
marqueurs présents, `banc` + `garde-projection` + les trois harnais Pilotage tous verts.
★ **La leçon** : quand un fichier maigrit de 600 lignes entre deux clones, **c'est le nombre de
lignes qu'il faut regarder en premier** — pas le diff, qui noie le signal dans le bruit.

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §42

1. **`npm run lint` et ESLint** — **jamais joués côté Claude de tout le chantier** (`node_modules`
   absent du bac à sable ; l'échec est identique sur la base d'origine, ce n'est donc pas le lot).
2. ⚠️⚠️ **REGARDER Simuler et Cave.** Leurs rendus sont vérifiés par assertion mais **n'ont pas été
   regardés** — budget d'outils épuisé sur le dernier lot. Vu que **trois** défauts du chantier n'ont
   été trouvés que par l'œil (§42h), c'est le point faible du paquet. En particulier **l'étape 2 du
   simulateur**, dont la légende de couleurs a été remaniée.
3. **`test:smoke` et `test:e2e`** — jamais joués côté Claude (CDN Playwright injoignable pour
   l'installation de Chromium ; les mesures de ce chantier passent par le Chromium déjà présent).
4. ★ **La migration `_PIL_ST_V` remet la disposition à neuf UNE fois chez MG et le second domaine** : les
   cartes qu'ils avaient ouvertes ou fermées repartent repliées. C'est annoncé dans le journal des
   nouveautés — vérifier que le message est bien passé avant qu'ils s'en étonnent.

### ⚠️⚠️ NOUVEAU AU BACKLOG (issu de §55 — 23/08)

1. ⚠️⚠️⚠️ **REPOSER LE 19 ET LE 20 AOÛT chez le domaine de référence.** Leurs entrées ont été enregistrées
   avant le correctif : plus d'horaire, plus de drapeau d'échange, **et aucun calcul ne peut les
   retrouver**. Tant que ce n'est pas fait, la feuille de Victor sort à **+8h** au lieu de −8h30.
   Geste : *Annuler l'absence → sélection → mode Remplacement 07:00→16:30 → reposer le retard (19) /
   l'absence injustifiée (20)*. **Seule action bloquante du lot.**
2. ⚠️⚠️ **Le même patron de destruction, ailleurs.** Les trois écrivains de congés payés
   (`planning.js` l. 3610, 3788, 4761) et `_planApplySimple` (récup, chaleur) reconstruisent aussi
   l'entrée à neuf : un jour d'échange y perd drapeau et horaire. Effet moins grave (l'écart y reste
   neutre au lieu de devenir faux), **mais c'est le même défaut**. Remède propre : **un point de
   passage unique** « conserver la nature du jour », avec son harnais. Lot à part, pas un ajout.
3. ⚠️⚠️ **`new Date().toISOString().slice(0,10)` — 64 occurrences, « aujourd'hui » en UTC.**
   Entre minuit et 2 h du matin à Paris, elles rendent **la veille** : date de journal, date
   d'édition, comparaison « en cours », échéances. `_mvAujIso()` (la forme juste) existe dans
   `utils.js` depuis toujours et **n'est appelée qu'à 7 endroits**. Lot à part : mesurer d'abord
   lesquelles sont visibles du client, puis convertir — pas un chercher-remplacer.
4. ⚠️⚠️ **Les harnais ne tournent JAMAIS sur Windows côté Claude.** C26 couvre désormais le piège
   `import()`, mais pas les autres (séparateurs de chemin, CRLF, casse des noms de fichiers). ★ La
   seule parade réelle : **Nico lance `npm run check` avant que je déclare un lot vert**. Trois
   plantages Windows en trois lots livrés verts (§53, §55n) — **et un défaut de production que
   seul son fuseau révélait** (§55o). ★ Côté Claude, désormais : lancer aussi
   **`TZ=Europe/Paris npm run check`**, qui est le fuseau réel de tous les clients.
4. ⚠️⚠️ **Sortir un vrai PDF de la feuille d'heures et LE REGARDER.** 83 assertions tiennent les
   tailles, les graisses, les marges et les bornes — **aucune ne lit une mise en page** (§42h).
   C'est le point faible du paquet, avant tout envoi client.
4. ✅ **TRANCHÉ le 23/08 (§55m)** — `CONFIG.hsup_dues_debut` ne commande plus l'absence
   injustifiée : elle doit ses heures comme le retard, réglage ou pas. Le réglage ne borne plus que
   les motifs neutres. ⚠️ **À vérifier après déploiement** : sur les mois passés de MG et le second domaine,
   une injustifiée déjà enregistrée descend maintenant « reste à prendre ». C'est une correction,
   pas une régression — mais **regarder les compteurs avant de sortir une paie**.
5. **« ETP » subsiste à l'écran** (`pl2-mc-etp`) alors que le document imprimé dit désormais
   « Réalisation N % du prévu ». `s.etp` vaut `worked/ref` : un taux, pas un équivalent temps plein.
   Renommer partout = décision de vocabulaire.

### NOUVEAU AU BACKLOG (issu de §42)

- ⚠️ **Le doublon `_pilDiag` / `_pecZeros`.** Les deux portent un constat voisin sur « pas de taux
  horaire », à **deux endroits de la même page** : le bouton « à compléter » en tête de module, et la
  carte de fiabilité d'Économie. Ils ne disent pas tout à fait la même chose (`N fiches sans taux`
  contre `aucun taux nulle part`), mais le lecteur, lui, voit deux avertissements sur le même sujet.
  **C'est §34 en plus petit.** Fusion = chantier de moteur, pas d'ergonomie.
- **Les cartes sans ligne de cadre.** Toutes les cartes du Pilotage n'en ont pas encore une : celles
  qui ne passaient aucun sous-titre gardent un en-tête à deux étages. C'est visible, et c'est du
  travail d'écriture, pas de code.
- **Le `.pil-cr-note` masqué sur téléphone** : l'instruction « cliquez une campagne pour zoomer »
  disparaît sous 700 px. Un utilisateur qui n'a que son téléphone ne l'apprendra jamais.
  Piste : la dire une fois dans la fiche d'aide du module — ou une pastille « i » sur le fil.
- **Mesurer si les fiches « i » sont ouvertes.** Tout ce chantier parie qu'un vigneron touche la
  pastille quand il en a besoin. **Ce pari n'est pas vérifié.** Si personne ne l'ouvre jamais, c'est
  que le texte manque là où il était, pas qu'il était de trop.

### NOUVEAU AU BACKLOG (issu de §43)

- ⚠️⚠️ **UN RETARD D'UNE HEURE ET UNE ABSENCE D'UNE JOURNÉE S'AFFICHENT PAREIL.** `_pl2Cell` :
  `if(e&&e.absent) return {txt:'✕', cls:'pl2c-abs'}` — la croix rouge tombe **avant** toute lecture
  de `motif` et de `motif_h`. Or le motif `retard` porte `heures:true` : **la donnée est là,
  l'affichage l'écrase.** Trouvé à l'œil sur la démo, **mais c'est le produit** : chez MG et
  le second domaine, un retard saisi ressemble à une journée perdue sur le tableau. Piste : un glyphe
  distinct (⏰ + les heures) quand `motif_h > 0`, et la légende qui suit.
- **Le chrono tracteur n'est jamais visible en démo** (`CONFIG.chrono_mode` à 'off', aucune mesure
  ouverte). Soit on le sème pour en faire un moment — c'est l'argument de précision le plus fort
  du module — soit on l'assume hors parcours. Aujourd'hui : hors parcours.
- ⚠️⚠️⚠️ **NEUF HARNAIS SUR VINGT-SIX NE PROTÈGENT RIEN** — l'entrée disait « deux harnais périmés
  rougissent la CI ». **Les deux existent bien**, mais le constat était faux sur deux points, et
  incomplet sur le reste. Mesuré le 16/08, chaque script lancé un par un :
  · **Ni l'un ni l'autre n'est dans `ci.yml`.** Ils ne rougissent donc **rien du tout** — ils se
    taisent, ce qui est pire.
  · `harnais-bandeau-essai` : **2 rouges sur 15**, dont *« APP_VERSION délibérément inchangé
    (6.13) »* — il fige une version que le dépôt a dépassée de douze crans.
  · `harnais-cadence-escalier` : **1 rouge sur 28** — *« l'alerte >15 % ne crie plus au dérapage sur
    un chiffre d'histoire »*.
  · ★★★ **SIX SCRIPTS PORTENT `/home/claude/mavigne-dev/` EN DUR** : `harnais-bandeau-essai`,
    `harnais-cadence-escalier`, `harnais-claude-md`, `harnais-parcours-prospect`,
    `harnais-reconduction`, `harnais-vitrine`. **Ils ne peuvent démarrer que dans le bac à sable.**
    Chez Nico comme en CI, ils sortent en `ENOENT` — et un script qui ne démarre pas se lit comme un
    succès. **C'est l'entrée 0h (`lint-cliquet`), mais multipliée par six et jamais consignée.**
  · `harnais-vitrine` et `contre-epreuves` : `ENOENT` sur `logiciel-vigne.html` — chemin relatif au
    répertoire courant, pas au dépôt.
  · `harnais-essai-borne.cjs` : `Cannot find module 'firebase-admin'`.
  · `harnais-claude-md` : **1 rouge sur 23** — c'est ce document lui-même qui se déclare périmé.
  → **Correctif type, une ligne par script** : `new URL('../<chemin>', import.meta.url)` au lieu du
  chemin absolu, et `os.tmpdir()` pour les fichiers de contre-épreuve. Détail en **§44c**.

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §40

1. **Ordre non négociable** :
   `firebase deploy --only functions:gtRenewTrial,functions:trialWatch` **puis**
   `npm run build && firebase deploy`. Pas de rules, pas de backfill.
2. **`test:smoke` et `test:e2e` côté Nico** — jamais joués côté Claude (CDN Playwright injoignable).
3. ✅ **`trialExp` de le domaine de référence et le second domaine vérifié** (14/08, Nico) — la première nuit,
   `trialWatch` traite ce qu'elle trouve ; un `trialExp` résiduel chez un converti aurait déclenché
   une relance chez lui.

### ✅ L'OFFRE DE LANCEMENT EST BORNÉE (14/08)

**Réglé.** 15 jours, reconductibles une fois, puis lecture seule — cf. §14b et §40. C'était le point
bloquant du devis le prospect Gironde depuis trois sessions. **Reste à trancher : ce qui se passe après J30.**
L'hypothèse en vigueur — la lecture seule dure — n'a jamais été confirmée explicitement.

### NOUVEAU AU BACKLOG (issu de §40)

### ⚠️⚠️ NOUVEAU AU BACKLOG (issu de §43 — 15/08)

- ✅ ~~**Refondre l'export JSON**~~ — **FAIT le 13/09, §124 (SAUV-1).** L'entrée disait
  « 8 clés sur 27 » ; le compte exact était **8 sur 26**, et le vrai défaut n'était pas l'export
  mais la **restauration**, qui réécrivait la fiche membre tronquée par-dessus l'historique des
  contrats. L'export dérive désormais de `COLLECTIONS` — c'était bien l'argument de l'entrée, et
  il était juste. ★ *Une entrée de backlog qui nomme la bonne cause peut quand même sous-estimer
  le dégât : celle-ci parlait d'un fichier incomplet, pas d'une perte de données.*
- ⚠️⚠️ **Vérifier la persistance cloud tenant par tenant** — le code est bon, l'existence des
  documents chez chaque client n'est pas prouvée. Procédure : **§43g**.
- ⚠️ **La marge en jours n'est surveillée par aucun test** — bloqué par l'export. **§43f**.
- ⚠️ **Aligner `npm run check` sur le workflow CI** — `mv-harnais-echelle.mjs` n'était lancé que par
  le CI : le rouge n'apparaissait qu'après le push (**§43i**). Vérifier qu'aucun autre harnais du
  workflow ne manque au `check` local.
- **Ajouter la vérification des six clés à la fin de toute mise en route** (§27f).
- **Clôture d'une saison très incomplète** — `Hiver 2025–2026` archivé à 32 %. Empêcher, ou
  signaler ?
- **Rejouer les 6 contre-épreuves de `cadAppl`** — écrites avant les gardes 2 et 3, la redondance
  a pu en rendre certaines aveugles (piège de **§43e**).

- ⚠️ **`trialExp` / `trial_until` peuvent diverger.** Trois chemins les écrivent ensemble
  (`_fcSaveAbo`, `agtInsTrialGo`, `gtRenewTrial`). Un quatrième qui l'oublierait ferait mentir la
  veille **en silence**. Piste : une assertion de cohérence dans `trialWatch`, qui alerte au lieu de
  se taire.
- **Durcir la lecture seule côté serveur** — `firestore.rules` ignore `trial`. Décision commerciale
  avant technique : est-ce un frein ou une serrure ?
- **Mesure d'audience** sur `essai.html` et la démo guidée.
- **Les trois nombres dupliqués** (§14b) — vivre avec, ou générer l'un depuis l'autre.

### ★★★ La journée du 11 août (suite) — la refonte du Planning, deux lots

**Point de départ** : *« je trouve que planning est mal conçu, il y en a un peu partout, il faut
parfois cliquer sur un membre parfois non. »* Diagnostic chiffré, puis maquette validée sur **une
seule question posée à Nico** — le geste le plus fréquent porte-t-il sur une case ou sur plusieurs ?
Réponse : « le geste = ta reco », donc **le tap coche**.

**Lot 1 — le geste unique.** Le mode « Sélection multiple » supprimé, trois cochages ajoutés
(colonne, ligne, vue), barre de sélection contextuelle, **trois feuilles fusionnées en une**, trois
moteurs d'écriture sans DOM. **Un bug réel** : récup et chaleur en lot écrasaient les congés en
silence. **Harnais 12/12 + contre-épreuve.**

**Lot 2 — trois onglets** (`mois` / `gens` / `cadre`) avec table de migration, fin du doublon
grille+synthèses, suppression du menu « Outils » et de la feuille « Anciens salariés », **et un
défaut de modèle** : deux réglages du domaine logés dans la fiche d'un salarié. **C22 fait dans le
lot** — 8 renvois périmés, `MV_AIDE`, `reglages.js`, guide régénéré.

**Détail complet : §19a.** Fichiers : `index.html` · `planning.js` · `styles.css` · `utils.js` ·
`reglages.js` · `sw.js` · `guide/10-planning.html` + `public/guide.html`. **Bump APP + SW aux deux
lots.** ✅ **DÉPLOYÉ** (SW v6.45 et v6.46 lus dans le changelog du dépôt).

⚠️ **`test:smoke` et `test:e2e` n'avaient PAS été passés au moment de la livraison** : Playwright ne
peut pas télécharger Chromium dans le bac à sable. Preflight, les deux cliquets, `node --check`,
build Rollup et le harnais des moteurs étaient verts. **C'est la première fois qu'un lot est parti
avec les deux paliers navigateur non joués côté Claude — Nico les a passés de son côté avant de
déployer.**

### ★★★ La journée du 11 août — audit intégral, puis deux lots Tracteur

**Versions au moment de ces deux lots : APP `5.93` · SW `6.43`.** ⚠️ **Trois versions ont suivi le
même jour** — v6.44 (l'accompagnement rattrape les deux lots), v6.45 et v6.46 (Planning, lots 1 et
2). **État réel du dépôt au commit `636630a` : APP `5.96` · SW `6.46`.**
(À relire dans les fichiers, jamais depuis ici.)

**A. L'AUDIT INTÉGRAL DE L'APP** — preflight vert, 55 376 lignes, 10 analyses statiques.
Ce qui est **sain, vérifié** : handlers inline (20 types d'événements, 0 non exposé) · un seul
`console.log` non gardé et c'est l'émulateur · **contraste 5,56 → 16,73:1, AA passé partout** ·
7 « à venir » tous légitimes · `.pc-validate` à **60×60 px** · verrou Planning propre · 0 TODO.

Ce qui ne l'est pas :

| Constat | Chiffre |
|---|---|
| ★★★ **Tailles de police sous 12 px** | **1 625** — 1 204 en ligne + 421 CSS, soit **la moitié** de l'app, uniformément répartie. Le dock est à **9,5 px**, les doses phyto à **9 px**. « Plein soleil » ne change **que le contraste**. |
| ★★ **Trou responsive 761–767 px** | `max-width:760px` vs `min-width:768px` : le corps reste à 430 px pendant que `.pil-hero` garde sa grille 2 colonnes |
| ★★ **Quatre rendus de date concurrents** | 8 fonctions, dont **2 paires strictement identiques** (`_rmDate`/`_bcDate` dans le même fichier ; `_pOrdDateFr`/`_opDateFr` à l'octet près) |
| ★★ **Aucun formateur de nombre central** | ~330 `toFixed` + 46 `toLocaleString`, `utils.js` n'en expose aucun |
| ★ **Bloc de ré-export de 209 lignes** (`app.js`) | **111 lignes strictement inutiles** (le module expose déjà) + **5 noms morts** de l'ancien catalogue « Mes produits » |
| ★ **Trois conventions d'exposition `window`** | dont la boucle `for..in` de `phyto.js`, **invisible au preflight** — le fichier le reconnaît lui-même en commentaire |
| **333 `onclick` sur `<div>`** | pour 44 `aria-label` — non focusables clavier |

**B. LE CHRONO TRACTEUR INVERSÉ** — v5.92, §31. `tracteur.js` + `index.html` + `styles.css` +
`utils.js` + `sw.js`, **bump APP + SW**. Plus le branchement du **cliquet de vocabulaire**
(`package.json` + `ci.yml`) : il était écrit le matin même et **aucun appelant ne l'exécutait**.
C14 `tracteur.js` **5 → 4**, baseline regravée.

**C. LE MODE DU JOUR** — v5.93, §32. `app.js` + `index.html` + `styles.css` + `utils.js` + `sw.js`,
**bump APP + SW**. Deux `catch{}` vides refusés par C14 puis remplis avec `logError`.

⚠️⚠️⚠️ **DETTE CONTRACTÉE LE JOUR MÊME : les fiches `MV_AIDE` du Tracteur n'ont été mises à jour
pour AUCUN des deux lots.** Les deux écrans les plus utilisés du module ont changé de gestes et leur
aide décrit les anciens. **C'est la violation exacte de la Règle d'or n°4, écrite le même jour.**
→ **Premier point du backlog, avant tout nouveau lot.**

⚠️ **Ni `npm run build`, ni le smoke, ni l'e2e n'avaient été lancés côté Claude** sur ces deux lots
(pas de navigateur dans le bac à sable). ✅ **Ils sont déployés** — SW v6.42 et v6.43 sont dans le
changelog du dépôt, et l'accompagnement les a rattrapés en v6.44.


### ★★★ La journée du 9 août — trois chantiers

**A. LE MATIN — L'ÉCART DE CADENCE D'ÉCONOMIE ÉTAIT FAUX D'UN FACTEUR 5** (§20b)
`pilotage.js` seul, **aucun bump**, 28 assertions, preflight vert.
⚠️ **Livré sans `WHATS_NEW`** alors que le client voyait le changement → **annoncé au bump suivant**.

**B. L'APRÈS-MIDI — LE CHANTIER ACCOMPAGNEMENT, EN QUATRE LOTS** (§27)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **a** | preflight **C22** + correctif du bug `ecf` de la visite guidée | `preflight.mjs` + `app.js` (+ `sw.js`) | **SW seul**, `WHATS_NEW = []` |
| **b** | les **10 fiches `MV_AIDE` refaites** + le point d'aide dynamique | `utils.js` + `pilotage.js` + `index.html` + `sw.js` | **APP + SW** |
| **c** | widget **« Mise en route »** sur l'accueil admin | `app.js` + `index.html` + `utils.js` + `sw.js` | **APP + SW** |
| **d** | **guide découpé + générateur** puis corrections factuelles | `guide/` + `scripts/build-guide.mjs` + `public/guide.html` | **aucun** |

★ Le `WHATS_NEW` du lot **b** annonce **aussi** le correctif de cadence du matin.
✅ **Rayés** : « guide.html dit Côte de Nuits » · **MT-A**.

**C. LE SOIR — LA RÉDUCTION DU TEMPS D'INSTALLATION, EN CINQ LOTS** (§18b)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **1** | parcelles : noms alignés + commune par ligne | `admin-gt.js` | **aucun** |
| **2** | comptes de l'équipe en lot + **correctif du tenant** | `admin-gt.js` + `firebase.js` | **aucun** |
| **3** | périodes recopiées d'un domaine installé | `admin-gt.js` | **aucun** |
| **4** | `submitMiseEnRoute` + le formulaire qui envoie + la reprise dans l'assistant | `functions/leads.js` + `public/mise-en-route.html` + `admin-gt.js` | **aucun** |
| **5** | machines collées en liste + volume de fût | `admin-gt.js` | **aucun** |

**Plus** la procédure `INSTALLER-UN-DOMAINE.md` et son PDF (§18c).
**20 h → ~9 h sur le papier**, dont 14 h de clavier ramenées à ~4 h.
✅ **DÉPLOYÉ.** ⚠️ **Mais le gain reste théorique : l'installation à blanc n'a pas été faite.**
Les cinq lots sont en ligne, **aucun n'a encore servi de bout en bout**. Le « ~9 h » est un chiffre
de papier tant qu'un slug jetable n'a pas été monté en entier (§18b, backlog technique n°1).
✅ **Rayé** : CF `submitMiseEnRoute`.

### ★★★ Le 10 août — migration GitHub

Le code source de Ma Vigne vit désormais dans un dépôt **`4ss4ss1/mavigne-dev`**, public, sur
GitHub Desktop côté Nico. **Ceci remplace le workflow d'upload pour la LECTURE du code** (Règle
d'or n°1, « Environnement de Nico »). Pas un chantier fonctionnel — un changement d'outillage, mais
le plus structurel depuis le début du projet : Claude clone/lit directement, Nico livre par
commit+push au lieu d'upload/téléchargement.
★ **Piste ouverte, pas encore faite** : committer ce document lui-même dans le dépôt (en
`CLAUDE.md` à la racine) pour qu'il soit, lui aussi, lisible sans upload à chaque session. Tant que
ce n'est pas fait, la procédure de régénération de la Règle d'or n°1 reste pleinement en vigueur
pour ce document précis.

### ⚠️ Lots encore non documentés ici

Connus par le seul changelog de `sw.js`, **à consigner par Nico** :
- **06/08** : « panneau GUERETTECH : 8 onglets deviennent 6 » · « SEC-GT/2 » (code à usage unique).
- **05/08** : la tournée sur l'écran de l'équipe · l'exercice comptable · les 4 défauts de la
  snapshot localStorage · le Chai qui s'ouvrait vide.
- **09/08 matin** : le soutirage à source unique · le Cuvier repeint · le **hub Documents** ·
  la **charte `MV_DOC`**.

### ✅ Le verrou administratif est levé

**3 août 2026 — l'Urssaf a confirmé que Nico peut facturer.** La première facture définitive est
partie à le signataire le second domaine (réf. MV-AAAA-NNNN).

### ★★ Le fait commercial : le prospect Gironde

**Premier prospect arrivé hors réseau**, par le formulaire d'essai du site : **Lalande-de-Pomerol
(Gironde)** — ~45 ha en conventionnel, ~40 parcelles multi-communes, **12 permanents** + saisonniers,
6 machines, 4 cuvées. Profil **Domaine**, et le premier vrai test du travail multi-terroir (§30).

**Séquence de réponse préparée (dans l'ordre)** :
1. ⚠️ **Vérifier que `mise-en-route.html` est bien EN LIGNE** avant d'envoyer le lien — ★ et que la
   nouvelle version, celle qui **envoie**, est déployée (§18b).
2. Envoyer la réponse + le lien du formulaire (§27f).
3. Au retour : **enregistrer le slug `chateau-garraud` dans `_guerettech/tenants` AVANT
   `onboardTenant`** (§14) — ★ l'assistant le fait lui-même en première étape.
4. **DPA signé AVANT la création des 12 comptes salariés.**
5. Devis sur la **nouvelle grille** : Domaine = 990 € / 20 h incluses (−50 % lancement si l'offre est
   maintenue — **à borner**).
6. **Recalibrage du barème = partie du forfait** : densité girondine, jeu `gironde`, et les cinq
   questions du §30c — ★ **dont les réponses seront déjà dans son dossier** s'il a rempli le
   formulaire (§18b).
7. ★★ **Trois arguments neufs** : un château de 45 ha avec 4 cuvées a forcément plusieurs millésimes
   en cave (**la série MILLÉSIME lui parle directement**) ; **12 salariés à faire démarrer**, ce qui
   met l'accompagnement (§27) au cœur de la vente ; et ★ **son installation devrait coûter ~9 h au
   lieu de 28** compte tenu de sa taille — c'est ce qui rend le forfait tenable.
⚠️ **Détails à ne pas oublier pour ce client** : **volume de fût 225 L** · barème girondin ·
40 parcelles sur plusieurs communes · noms de parcelles probablement différents du fichier.

### ★ Livré antérieurement

**7 août soir** — série MILLÉSIME (4 lots) + lot MALO + refonte de l'onglet Cave du Pilotage.
**7 août matin** — Le millésime · parc à fûts · entonnage depuis le parc · registre des
manipulations · bilan de campagne.
**5 août** — `mvprint.py` retrouvé et archivé ; document d'instructions régénéré.
**4 août** — niveaux sautés `_mvNivH` (−528 h chez MG) · plomberie `tcfgSave` + `_normalizeTaches` ·
badge « votre valeur » · densité · barèmes régionaux · **DOCK rejoué** · MÉNAGE · **capacité
réelle** · **grille d'installation tranchée** · le prospect Gironde + `mise-en-route.html` · **registre phyto
CSV** · **vendange-couperet**.
**1er au 3 août** — UX-1 · `firebase.json` · e2e +2 étapes · **écran d'accueil public** · téléphone
corrigé · DEMO-3 · heures sup · **saisonniers dans l'historique** · **équipe collective** · refonte
Économie · **carte d'ordre de passage** · Décider ×6 · Renfort ×5 · **vendange fantôme, 941 h**.
**31 juillet** — nouveau SIRET, adresse et téléphone publiés, archivage des CGU/DPA signées.
**30 juillet** — série UX-R1 → R5, zéro nouvelle collection.

### Backlog — commercial & administratif

1. ★★★ **LE DEVIS GARRAUD** — la séquence complète est ci-dessus. ⚠️ **Il ne peut pas partir avant
   le point 2** : le devis chiffre une remise dont la durée n'est pas définie.
2. ⚠️⚠️ **BORNER L'OFFRE DE LANCEMENT** (durée jamais définie) — **bloquant pour le devis le prospect Gironde.**
   Une remise « −50 % » sans date de fin sur un document contractuel engage sans limite.
3. **Vérifier les empreintes de `_mv_signatures`** contre les archives du 31/07.
4. **Vérifier l'indexation dans Search Console.**
5. **LinkedIn posts #4 et suivants** — **douze angles prêts** (§27).
6. ★ **Trois questions à poser à le contact technique** : ses écartements commune par commune · le recours
   éventuel à un prestataire · **pourquoi Pliage, Palissage et Entreplantation sont absents de son
   barème** (75 h/ha, soit 1 350 h sur 18 ha, §30d).

### Backlog — technique, par ordre d'effort/effet

★★★ **AUDITÉ LIGNE PAR LIGNE LE 11/08 AU SOIR**, sur le dépôt cloné (commit `636630a`,
APP 5.96 · SW 6.46). **Chaque entrée porte sa preuve mesurée**, fichier et ligne, pas un souvenir.
**Six points rayés · cinq chiffres corrigés · trois qui avaient EMPIRÉ.**

⚠️⚠️ **La leçon de cet audit : un backlog non audité dérive DANS LES DEUX SENS.** Six entrées
décrivaient du travail déjà fait — le document faisait travailler dans le vide. Et trois chiffres
avaient grossi sans que personne le voie : **1 625 → 1 639 sites sous 12 px**, **~2 300 → 2 922
hex**, **~375 → 407 ko pour `cave.js`**. Un backlog écrit une fois est une photo ; **une entrée
non re-mesurée depuis une semaine est une hypothèse, pas un constat.** C'est la règle d'or n°1
appliquée au document lui-même.

★ **AJOUT DU 12/08 — les entrées 0a à 0d sortent du chantier ETP/année/contrats (§33).** Elles
sont neuves, donc **non auditées** : les traiter comme des hypothèses jusqu'à re-mesure.

0a. ✅ ~~**DÉPLOYER — APP 6.06 · SW 6.56**~~ — **RAYÉ LE 16/08, ET C'EST LE PLUS GROS DÉFAUT
   D'ENTRETIEN DE CE DOCUMENT À CE JOUR.** L'entrée est restée en tête de backlog, trois étoiles,
   pendant **dix-neuf versions APP et vingt-trois versions SW**. Le dépôt lu le 16/08 porte tout
   §37, §38, §40, §41, §42 et §43 par-dessus : le paquet décrit ici comme « jamais mis en ligne »
   a été déployé, puis recouvert six fois.
   ★★★ **La leçon est de méthode** : *une entrée « À DÉPLOYER » est la seule du backlog qui se
   périme toute seule.* Elle ne demande pas de travail, elle demande une lecture — et tant qu'on ne
   la relit pas, elle occupe la première place en criant sur un fait faux.
   → **Règle** : toute entrée « à déployer » se relit **en tête de session**, en comparant les
   numéros qu'elle cite à `APP_VERSION` et `CACHE_NAME`. Si elle cite plus bas, elle part.
   Détail en **§44a**.
   ⚠️ **Ce qui reste vrai et qu'il ne faut pas jeter avec** : `npm run build && firebase deploy` —
   ⚠️ **un seul `&&`** : `inject-precache` tourne déjà en postbuild, un second passage sort en 1
   et annule le déploiement. Tant que ce n'est pas fait, les clients lisent encore
   « manque 15,8 ETP » sur une vendange couverte, et **une augmentation de salaire continue de
   rechiffrer les exercices clos**.
   ⚠️⚠️ **`scripts/preflight-baseline.json` fait partie de la livraison du 12/08 nuit** : la
   baseline a été **regravée** sur une diminution réelle (un `catch{}` vide parti avec
   `_paieHistTxt`). Sans elle, le prochain preflight avertit sans raison — et un avertissement
   qu'on apprend à ignorer est un cliquet mort.
0a-bis. ✅ ~~**UNE LIGNE D'`utils.js` EN ATTENTE D'UNE DÉCISION DE DONNÉE**~~ — **FAITE, vérifié
   le 16/08.** `_mvEnContratSurPeriode` (désormais **utils.js l.2936**, plus l.2449) porte
   `if(!P.length) return true;`, précédé du commentaire de convention en dix lignes qui explique
   *pourquoi* le statut n'entre pas dans la réponse. Le blocage de donnée était levé dès le 14/08 —
   Nico a supprimé la fiche `Pilotage` (§39g). **L'entrée décrivait donc un travail fait depuis
   deux jours au moment de la consolidation du 15/08 : elle aurait dû partir avec §39.**
0a-ter. ★★★ **COMPTER LES ETP BUREAU — orientation produit, 14/08.** Nico :
   *« je veux compter aussi les ETP bureaux pour pouvoir budgéter au plus près de la réalité (on
   fera ça sur une prochaine mise à jour) »*. ⚠️ **Ce n'est pas un simple retrait du filtre** :
   `m.bureau` est lu à des endroits qui ne posent pas la même question.
   · **La capacité vignes** (`_headWeek`, courbe d'effectif, simulateur de renfort) doit **rester**
     hors bureau — c'est le sens même du champ, *« non compté dans la capacité de travail des
     vignes »*, et un administratif dans la courbe de taille ferait croire un pic couvert.
   · **Le budget** (masse salariale, coût employeur, ETP payés) doit **les inclure** — un salaire
     est un salaire. **Voir 0a-quater : c'est déjà censé être le cas, et ça ne l'est pas.**
   → Le travail réel est de **séparer les deux questions** : « qui travaille la vigne ? » et
   « qui coûte ? ». Aujourd'hui `_mvEnContratSurPeriode` répond aux deux avec le même filtre.
0a-quater. ★★★ **DÉFAUT MESURÉ LE 14/08 — la masse salariale perd tous les bureaux.**
   `_pexData` (pilotage.js l.6971) filtre avec `_mvEnContratSurPeriode`, dont **la toute première
   ligne** est `if(!m || m.bureau) return false;`. Or le commentaire posé trois lignes au-dessus
   dit : *« Le "bureau" N'EST PAS exclu : c'est un salaire, et on chiffre une masse salariale. »*
   ⚠️⚠️ **Le commentaire décrit l'intention, la ligne fait le contraire.** Sur le tenant de
   référence, Etienne et Chloé sont bureau : leurs salaires **ne figurent pas** dans le total de
   l'exercice. Correctif = un 4ᵉ argument `avecBureau` sur `_mvEnContratSurPeriode`, passé `true`
   **au seul appelant l.6971** — les trois autres (coût MO par parcelle l.5564, cadence l.6064,
   effectif présent planning.js l.881) posent bien la question « qui travaille la vigne ».
   **NON LIVRÉ** : ça change un chiffre d'argent, et Nico a explicitement mis le sujet bureau à la
   *prochaine mise à jour*. À faire au même lot que 0a-ter. Détail en **§39i**.
0b. ✅ **Le CDD de Victor est RESSAISI** (confirmé par Nico le 12/08 au soir).
   ⚠️ **Le même geste reste à faire pour Shana, Alicia et Vic** dès leur resignature (annoncée au
   17/08) : mettre les anciennes dates dans la fiche, enregistrer, puis remettre la nouvelle date de
   début → l'archivage se déclenche seul.
0c. ❌ **ENTRÉE ANNULÉE — c'était un mauvais conseil.** Elle demandait de régler l'ouverture
   d'exercice au 1ᵉʳ octobre « pour que la vendange clôture l'année ». ⚠️⚠️ **Un exercice comptable
   est fixé par le comptable, parfois par le statut : ce n'est pas un réglage d'affichage.**
   La vraie correction est livrée au **lot 6 du §34** : l'écran montre désormais les **deux cadres**
   (exercice comptable / année vigne), dit **pourquoi leurs totaux diffèrent**, et se contente de
   chiffrer — **en jours exacts** — le partage de la vendange quand la clôture la traverse.
   Le décalage reste **proposé**, jamais prescrit. **Ne pas rouvrir cette entrée.**
0c-bis. ★★ **Les filtres cépage / commune du Pilotage** — démontrés dans la maquette v3, **non
   livrés volontairement** (§34i). Ils exigent que le calcul de charge descende à la parcelle.
   ⚠️ **Un filtre qui change la liste sans changer les chiffres est un décor.** Les données existent
   déjà : `p.cepages[]` et `p.commune`. Aucune saisie neuve à demander au client.
0c-ter. ✅ ~~**Déplacer `_PIL_SEM` dans `utils.js`**~~ — **FAIT, vérifié le 16/08.**
   `utils.js:1968` la définit, `utils.js:2345` l'expose, `pilotage.js:15` l'importe, et
   `pilotage.js:9650` porte le commentaire *« n'est plus exposé ici »*.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-frise` cherche encore la palette dans
   `pilotage.js` — **il rougit sur trois assertions à cause de ce déplacement réussi** (§44c).

0d. ★★ **Le pont coût annuel ↔ campagnes** — le gros morceau ouvert par Nico le 12/08, détaillé en
   fin de §33. Coût annuel **par date**, part d'une campagne **par tâche**, et le **reste**
   (vinification, entretien, temps mort) qui n'est lisible **qu'avec un taux de saisie**.
   ⚠️ Le journal ne stocke **pas d'heures** : le croisement passe par les heures payées du jour.
0e. ~~**Deux compteurs de 1607 h**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   `_planAnnuCard` pose une carte compacte par **contrat soldé dans l'année civile**, au-dessus du
   compteur courant : dates, heures faites, plafond proratisé. Borné par `_planSurContrat(ctr,…)`,
   qui contraint `_planInContractCtr` aux dates du contrat passé. **Affichage seul, aucun calcul
   touché** (§19, §33).
0f. ★ **Resserrer la fin de la période *Vendanges*** — elle court au 30/09 alors que le travail
   s'arrête le 06/09. Le pic n'est plus faussé, mais la moyenne « sur la période » reste diluée
   sur trois semaines vides.
0g. ★★★ **`taux_serie` est clé par NOM** — ouvert par §36, **volontairement non fermé**. Renommer un
   salarié dans sa fiche **détache son historique de salaire**. C'est la faiblesse de tout le modèle
   (`MEMBRES`, `PLANNING_ENTRIES`, `taux`, `_mvPoidsNom` — tous clés par nom), mais **ici elle
   chiffre des euros dans un exercice comptable**. ⚠️ **Ne pas bricoler un rattrapage local dans
   `paie`** : ça donnerait un identifiant stable à un seul endroit et une fausse impression de
   sécurité partout ailleurs. Le vrai lot est *un identifiant de fiche membre*, et il touche bien
   plus que la paie. **Chantier à part entière, à chiffrer avant d'être promis.**
0h. ✅ **RAYÉ LE 29/09 — `lint-cliquet.mjs` démarre et passe** (« Aucune erreur nouvelle », joué par `npm run check`). Historique :
   ~~**`scripts/lint-cliquet.mjs` PLANTE**~~ en `MODULE_NOT_FOUND` (constaté le 12/08 au soir en
   l'exécutant, pas en le supposant). **Préexistant**, mais ⚠️ *un linter qui ne démarre pas ne
   protège rien* — et il fait partie des paliers de test (§6b), donc son silence se lit comme un
   succès. Le réparer ou le retirer des paliers : les deux valent mieux que le laisser mort.

1. ★★★ **INSTALLATION À BLANC de bout en bout sur un slug JETABLE — LE SEUL CRITIQUE OUVERT.**
   Elle valide les cinq lots d'un coup et **mesure les temps réels** (tableau prévu dans
   `INSTALLER-UN-DOMAINE.md`). Les lots sont déployés ; **le « 20 h → ~9 h » n'a jamais été vérifié.**
   ⚠️ **Un essai consomme un identifiant** : `onboardTenant` refuse un domaine déjà peuplé. Prendre
   un nom jetable, **jamais `chateau-garraud`**.
2. ✅ ~~**Vérifier si un `rewrite` existe en ligne**~~ — **RAYÉ, vérifié le 16/08.** Les **deux**
   sont dans `firebase.json` : `/api/lead` (l.19) et `/api/mise-en-route` (l.26), sous la clé
   `rewrites` ouverte l.17. Le ZÉRO du 11/08 était juste **à cette date** ; ils ont été ajoutés
   depuis, sans que l'entrée soit relue. ★ `harnais-claude-md` le vérifie déjà à chaque passage.
3. ~~**Fusionner les deux écrans de congés**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   `openPlanCP(fromSel)` est le point d'entrée unique ; `openPlanCPSel` est supprimée, son
   exposition `window` retirée, le bouton de la barre de sélection appelle `openPlanCP(true)`.
   La 5ᵉ feuille est ramenée à 4 (§19a).
4. ✅ ~~**Corriger `_findDebutTache`**~~ — **RAYÉ, vérifié le 16/08.** La fonction est passée en
   `app.js:3572` et **porte désormais ses bornes** : elle résout la période par `_saisonForDate`,
   retombe sur `_mvCampagneDe`, et en dernier recours sur le jour même. Le `reduce` ne s'applique
   plus qu'à `ok`, filtré par `dans(j.date)`. ⚠️ **L'entrée citait `app.js:3116` — un numéro de
   ligne de backlog vieillit encore plus vite qu'un chiffre** (§44b).
5. ✅ ~~**Breakpoint 760 → 767.98**~~ — **RAYÉ, vérifié le 16/08.** `styles.css` porte
   `@media(max-width:767.98px)` ; le trou 761–767 est bouché. La seule occurrence restante de `760`
   est `@media(min-width:768px){ .mvr-body{max-width:760px} }` — **une largeur de corps, pas un
   point de rupture** : ne pas la « corriger », elle est juste. ★ L'entrée attendait un go qui
   n'était plus nécessaire.
6. ★ **Découper `demarrage.html`** sur le modèle du guide — **938 lignes, monolithique** (§27d).
   ✅ La section **Données** est faite : `guide/13-donnees.html` existe (7,5 ko).
7. ~~**Escalier de sources pour la cadence**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67), §41.
   `_pecCadHisto()` remplit la marche 2 : sous le seuil d'avancement, l'écran reprend la **même
   période de la campagne précédente**. `hBar` vient du snapshot (`stats.hFaites`), `hReel` se
   **recalcule** sur `PLANNING_ENTRIES` — clé par année, jamais purgé. **Quatre points d'affichage
   annoncent la source.** Harnais : 28 assertions, 5 contre-épreuves.
8. ✅ ~~**Purger le calcul de pic mort dans `_rfCtx`**~~ — **FAIT, vérifié le 16/08.**
   `pilotage.js:3193` porte le commentaire de purge : *« `pic` était calculé ici et renvoyé dans le
   contexte […] après vérification (`grep '.pic'` = 0 consommateur) »*. ⚠️ **Ne pas confondre avec
   les `pic` VIVANTS** : `_rfWeeks` (l.1387) et `_pilAnnuCtx` (l.8764) en renvoient un, consommé
   l.1841 et l.4427 — ceux-là sont utiles.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-portee` exige encore *« le pic est calculé »*
   et **rougit sur quatre assertions à cause de cette purge réussie** (§44c).
9. ~~**Pondérer `_ecoRate` par les heures**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   Moyenne pondérée par les heures annuelles du gabarit (`window._planGetRefH` sur 12 mois).
   ★ **Repli sur `h=1` si le planning n'est pas chargé** — résultat identique à l'ancien, donc
   aucune régression possible sur un domaine sans données de planning.
10. ★ **Chip de cuvée `Village 2026· 12`, sans espace avant le point médian.** ⚠️ **Non retrouvé au
    grep le 11/08** — soit corrigé entre-temps, soit le motif de recherche est mauvais.
    **Varier le motif avant de conclure** (règle vécue avec `mvprint.py` et DOCK).
11. ★★ **Import KML en MERGE** sur un domaine vivant — `_parseKML` est en `admin-gt.js:2298`,
    **aucun mode merge**. Avec les **coordonnées écrites dans les parcelles** et **la densité comme
    propriété de la parcelle**. ⚠️ Préserver `p.commune`, `p.plantation_trous`, `p.entreplantation`,
    `p.tachesAll`, `p.rendement_hist`, `p.rdt_max`.
12. ★★ **Le rattachement des anciens fûts à une référence** — maquetté et validé, **non intégré** :
    0 trace dans `reserve.js`.
13. ❌ **ENTRÉE PÉRIMÉE, RÉÉCRITE LE 16/08.** Elle disait « un 14ᵉ moment », après avoir corrigé
    « 15ᵉ » en « 13 ». **La visite en compte DIX-NEUF** depuis §43 (`harnais-demo` : *« 19 moments »*).
    ★★ **Trois chiffres successifs dans la même entrée, tous faux au moment où on la lit** : c'est le
    symptôme, pas l'exception. Ce qui reste vrai : **la cave n'a toujours pas son moment**, et c'est
    le plus vendeur du parcours. **Renuméroter n'est pas le travail — l'ajouter l'est.**
14. ★ **Le Cuvier n'enregistre pas d'intervenant** là où le Chai le fait — **`cave.js:6290` le dit
    à l'écran** (« la colonne reste vide pour celles-ci »). Le défaut est assumé, pas corrigé.
15. ✅ ~~**`.cave-tabs`**~~ — **RAYÉ ENTIÈREMENT, vérifié le 16/08.** Les deux barres mortes sont
    purgées (`index.html:1745` porte le commentaire) **et la règle CSS orpheline est partie aussi** :
    `grep cave-tabs styles.css` = **0**. L'entrée ne gardait qu'un reliquat déjà traité.
16. ✅ ~~**`_pl2Annual` vs `_planGetRefH`**~~ — **RAYÉ, vérifié le 28/09 : déjà corrigé depuis le socle (`6756111`).**
    `_pl2Annual_` somme `_planSummary(m,mi).ref`, bornée au contrat comme la carte du salarié. Les six lecteurs
    restants de `_planGetRefH` veulent bien le MODÈLE nu (total annuel du modèle, capacité 1 ETP, éditeur de
    modèle, replis de Réglages et de Pilotage) — ce n'est pas la même question.
17. **Terminologie heures sup** : « Solde cumulé » (`planning.js:2319`) vs « Reste à prendre »
    (`l.4322`) — **les deux libellés coexistent, vérifié**.
17b. ★ **Le nom d'un salarié, dans la grille, coche sa ligne** et n'ouvre plus sa fiche (§19a).
    Décision assumée — une cible, un effet — mais **à confirmer à l'usage** : c'est le seul point de
    dépaysement de la refonte, et il est réversible en une ligne.
18. **Batch a11y** · résorption des `catch{}` vides — ⚠️ **RE-MESURÉ LE 16/08 : 193, pas 200.**
    **135 sont dans `app.js` à eux seuls** (puis `pilotage.js` 15, `onboarding.js` et
    `tracteur.js` 4, `cave.js` 3). ★ **C'est la seule ligne du backlog qui a BAISSÉ deux audits de
    suite** — 234 → 200 → 193. Le cliquet C14 travaille.
    **La baisse est réelle** (C14 fait son travail) : le cliquet interdit d'en ajouter, il ne purge
    pas l'existant. **Un lot ciblé `app.js` réglerait les trois quarts du sujet.**
19. **Rôle `pilotage` (`pil:true`)** — **0 occurrence, vérifié.** 2 arbitrages préalables.
    Corriger aussi `getLoginRoster` (`functions/claims.js:1360`, renvoie toujours `roles`).
20. **Injection de données pures dans les guides.**
21. **Lot B pluie** — ⚠️ **à re-qualifier : la collecte horaire EXISTE DÉJÀ.** `app.js:3061` remplit
    `window.METEO_HOURLY` avec `precipitation` heure par heure et le met en cache
    (`mavigne_meteohr_cache`). **Ce qui manque n'est pas la donnée, c'est son exploitation.**
    L'historique reste irrécupérable rétroactivement.
22. **DRY surface** — ⚠️ **21 sommes à la main au 16/08** (22 au 11/08, 32 à l'origine).
23. ✅ ~~**UI d'activation d'essai client**~~ — **RAYÉ, vérifié le 16/08.** L'écran existe :
    `admin-gt.js:1299` lit `agt-trial-input`, borne la valeur à `[0, 90]` (l.1301) et l'écrit dans
    `clients[slug]` (l.1310) ; la pastille de récap l'affiche l.2886. **Posé par le chantier §40
    sans que l'entrée soit relue.**
24. ✅ ~~**Fusion de fûts à l'ÉDITION**~~ — **FAIT, vérifié le 16/08.** `_futSameLot(x, four, ref,
    annee)` compare fournisseur + référence + millésime en tolérant casse et espaces ; `_rsvSaveFut`
    cherche le doublon et fait `dup.qte = (parseInt(dup.qte)||0) + qte` au lieu de pousser une
    seconde carte. ⚠️ **Le commentaire que l'entrée citait est TOUJOURS LÀ** — il décrit désormais
    l'intention du code au-dessous, plus un manque. ★★ **Piège de méthode** : *un commentaire qui
    décrit un défaut ne disparaît pas quand le défaut est corrigé.* Ne jamais conclure à l'absence
    en lisant un commentaire ; lire la fonction (règle vécue avec `mvprint.py` et DOCK).
25. ✅ ~~**Ancien catalogue « Mes produits »**~~ — **RAYÉ. 0 occurrence dans tout `src/`.**
    Le backlog annonçait « 5 fichiers à arbitrer » : il n'y a plus rien à arbitrer.
26. ✅ ~~**Vérifier les autres tâches `anytime:true`**~~ — **re-vérifié le 29/09, et deux défauts en sortaient** : aucune des
    cinq n'a de barème `hha` ; l'Entreplantation faisait « NaN h » dans la fiche parcelle (`openDP`), les quatre « en temps réel »
    faisaient « NaN h » au total de l'Accueil (`calcHeures`). Corrigés (SW 8.52), gardés par `mv-harnais-robustesse-accueil`.
27. ★ **Variantes girondines** — le barème régional **existe** et `app.js:1062` nomme déjà le Médoc,
    le guyot double et les vignes de plus de 20 ans. **Reste la vérification documentaire :
    qu'aucun avenant postérieur à 2021 n'a révisé ces temps** (§30a).
28. ★ **Type de contrat « tâcheron »** (§30f) — **0 occurrence, vérifié.** À prévoir, pas urgent.
29. **Tokeniser les hex des JS** — ⚠️⚠️ **RE-MESURÉ LE 16/08 : 3 319.** ~2 300 → 2 922 → **3 319**,
    soit **+14 % en cinq jours** et +44 % depuis l'origine. **Il grossit à chaque lot** : le classer
    bas ne le fait pas rétrécir, ça ne fait que rendre le lot plus cher quand il arrivera.
30. **Mise à jour SW choisie — niveau 1** (§8). Le socle est là : `updatefound` (`app.js:9083`)
    et `SKIP_WAITING` (`sw.js:1047`).
31. **Lot 8 différé** (Google Play TWA) — jusqu'à **5+ clients actifs**.
32. **Une passe Lighthouse sur `staging`.**
33. ★ **Thème saisonnier** — étude faite, maquette 4 saisons à produire, **décision de Nico** (§21d).
34. ⚠️⚠️ **Surveiller la taille des gros modules** — **RE-MESURÉ LE 16/08, et ce n'est plus
    `cave.js` le sujet** :

    | Fichier | 11/08 | 16/08 | |
    |---|---|---|---|
    | `pilotage.js` | 461 ko | **657 ko** | **+42 % en cinq jours** |
    | `app.js` | 633 ko | 667 ko | +5 % |
    | `cave.js` | 407 ko | 456 ko | +12 % |

    ★★★ **`pilotage.js` a pris 196 ko** — c'est §42 (dix lots d'ergonomie) qui les a posés, et
    personne ne l'a vu passer. **Il est désormais le deuxième fichier de l'app.**
    ⚠️ **La surveillance sans seuil ne surveille rien** : trois audits de suite ont écrit « à
    surveiller » et le chiffre a monté trois fois. → **Poser un plafond dans le preflight** (700 ko ?)
    ou **retirer l'entrée** — les deux valent mieux qu'une veille qui ne déclenche jamais.
35. ✅ ~~**Committer ce document dans le dépôt**~~ — **FAIT.** `CLAUDE.md` est à la racine et se lit
    par `git clone`. C'est ce qui rend cet audit possible sans upload.
36. ★★★ **L'ÉCHELLE TYPOGRAPHIQUE — le plus gros effet client du backlog** (audit du 11/08,
    re-mesuré le 16/08).
    ⚠️ **1 593 sites sous 12 px** (153 dans `index.html` + 419 dans `styles.css` + **1 021 dans les
    JS**) et ⚠️⚠️ **295 sites sous 10 px**. Suite complète : 1 625 → 1 639 → **1 593** sous 12 px,
    mais 257 → 277 → **295** sous 10 px.
    ★★★ **Lire les deux ensemble** : le total baisse pendant que **le plancher s'enfonce**. §42 a
    unifié la typographie du Pilotage sur `--pt-*` — ce qui explique la baisse — mais l'échelle
    posée dans `styles.css` **descend elle-même à `--pt-nano:9.5px` et `--pt-lbl:10.5px`**. La
    variable a rendu le 9,5 px *légitime et réutilisable*. **On a industrialisé le trop petit.**
    → **Le lot A n'est plus un remplacement de valeurs en dur : c'est un relèvement de l'échelle
    elle-même**, `--pt-nano` et `--pt-lbl` en tête. Deux lignes touchent alors 1 021 sites JS.
    ★★ **La vraie surprise est la répartition** : les deux tiers sont **dans les JS**, en HTML
    généré — un lot qui ne toucherait que `styles.css` ne réglerait qu'un quart du problème.
    **Lot A : le plancher.** Les 277 sites sous 10 px remontés à 11 px minimum.
    ⚠️ **Pas une substitution aveugle** : certains 9 px sont des exposants ou des unités collées à
    un chiffre. **Maquette sur trois écrans d'abord** — accueil ouvrier, session tracteur, registre
    phyto — puis intégration au tableau motif → compte attendu.
    **Lot B : le réglage « Taille du texte ».** Les sites de 10 à 11,5 px convertis en variables
    CSS pilotées par un attribut `data-fs` sur `#app-root`, **jumeau exact de `data-hicontrast`**.
    Trois crans : Normal · Grand · Très grand, dans Réglages › Application, sous « Plein soleil ».
    ⚠️ **Ne PAS passer par un `zoom` CSS global** (qui serait une ligne) : il agrandirait aussi la
    carte Leaflet, les overlays `position:fixed` et la largeur du corps bornée à 430 px — le risque
    porterait sur l'écran le plus utilisé.
37. ★★ **`mvDate()` et `mvNum()` dans `utils.js`** — **0 occurrence, vérifié.**
    `mvDate(iso, forme)` : `'jma'` dans les documents et registres (traçabilité), `'court'` dans les
    listes denses, `'long'` dans les titres, **jamais `'court'` là où l'année est ambiguë** (défaut
    actuel de `_vendFrDate`). `mvNum(v, unité)` : décimales imposées par l'unité.
    **Décision de forme AVANT le code.** Supprimer les 2 paires de doublons littéraux.
38. ★ **Purger le bloc de ré-export de `app.js`** — **314 `window.X` comptés**, du
    `window._mvKeyLoaded` de la ligne 51 au `window.exportSaisonPDF` de la ligne 10536.
    111 lignes inutiles + 5 noms morts. **Unifier `phyto.js` sur la même forme et supprimer sa
    boucle `for..in` (`phyto.js:1165`)**, invisible au preflight. Regraver la baseline **après**
    avoir prouvé la baisse.
39. ★ **`.val-toggle` 26 → 44 px de haut** — **vérifié `styles.css:283` : toujours 26 px** (pour
    44 de large). C'est l'interrupteur qu'un ouvrier bascule par équipier, avec des gants.
    **`.fiche-admin-btn` est à 32 px** (`l.483`) ; vérifier aussi `.pc-start` et `.plan-mo-btn`.
40. ★★ **Valeurs par défaut de modules PAR RÔLE à la création d'un membre** : un ouvrier arrive avec
    Cave / Réserve / Planning décochées, un tractoriste avec Vigne / Tracteur / Phyto. **Vérifié :
    `_canModule` (`app.js:3860`, socle en `admin-gt.js:2664`) = formule ∧ masquage manuel, le rôle
    n'entre nulle part.**
    ⚠️ **Gain direct sur le prospect Gironde : 12 personnes × 7 arbitrages.** À faire **avant** l'installation.
41. ✅ ~~**44 occurrences de `var(--texte-doux,#8B8175)`**~~ — **RAYÉ, vérifié le 16/08 :
    0 occurrence** dans `src/*.js`, `styles.css` et `index.html`. Le repli fautif à 3,66:1 a
    disparu — **par quel lot, on ne sait pas** : aucun `WHATS_NEW` ne le mentionne. ★ **C'est le
    bon cas de figure quand même** : un défaut parti sans trace vaut mieux qu'un défaut tracé qui
    reste, mais ça rappelle qu'un audit ne se remplace pas par un changelog.
42. ⚠️⚠️ **Points de rupture responsive — QUATORZE, pas neuf** (re-compté le 16/08, `@media` de
    `styles.css` **ET** des JS) : **360, 400, 430, 520, 560, 600, 640, 700, 767.98, 768, 880, 900,
    980, 1200.** Le `760` est devenu `767.98` (entrée 5, ✅).
    ★★★ **Voilà pourquoi les audits précédents disaient neuf** : ils comptaient `styles.css`.
    **Cinq points de rupture — 360, 430, 520, 700, 880 — vivent dans du CSS injecté depuis le JS**,
    posés par §42 et invisibles à tout `grep` sur la feuille de style.
    ⚠️ **C'est le vrai sujet, et il est plus gros que l'entrée ne le disait** : la moitié des règles
    responsive a quitté la feuille de style. Les ramener à trois suppose d'abord de savoir où elles
    sont — et **le preflight ne le sait pas non plus**. **Après** le lot typographique, pas avant.


### ✅ Rayés du backlog

~~Urssaf~~ · ~~facturer le second domaine~~ · ~~clé `"site"`~~ · ~~UX-1~~ · ~~SEC-3 CSP~~ · ~~e2e 10 pages~~
· ~~`firestore.indexes.json`~~ · ~~niveaux `'Auto'`~~ · ~~plomberie des tâches~~ · ~~badge~~ ·
~~densité~~ · ~~barèmes régionaux~~ · ~~lot DOCK~~ · ~~lot 2 des heures prévues~~ · ~~CSS mort
Réserve~~ · ~~gardes mortes~~ · ~~recâbler Plein soleil~~ · ~~grille d'installation~~ ·
~~reconstruire `mvprint.py`~~ · ~~le fût comme objet~~ · ~~l'entonnage depuis le parc~~ ·
~~le registre des manipulations~~ · ~~le bilan de campagne~~ · ~~stock de bouteilles~~ (ABANDONNÉ) ·
~~regraver `preflight-baseline.json`~~ · ~~refonte de l'onglet Cave du Pilotage~~ ·
~~série MILLÉSIME~~ · ~~projection de fin de malo~~ · ~~CAD-1 / durée réelle~~ (**FERMÉ PAR LA
MESURE**) · ~~écart de cadence faux d'un facteur 5~~ · ~~MT-A écartements sur l'accueil admin~~ ·
~~« guide.html dit Côte de Nuits »~~ · ~~aide contextuelle périmée~~ · ~~guide public
monolithique~~ · ★ ~~**CF `submitMiseEnRoute`**~~ · ★ ~~**création de comptes en lot**~~ ·
★ ~~**alignement des noms de parcelles à l'installation**~~ · ★ ~~**accès manuel au code (upload à
chaque session)**~~ — remplacé par le dépôt GitHub le 10/08.

### Backlog juridique & contenu public

- Durées de conservation · sous-traitants à publier (Google Ireland + SMTP) · relecture juriste.
- **Relecture trimestrielle des pages publiques** :
  `grep -i "compléter\|à valider\|à arbitrer\|en cours de\|\[.*\]"` sur `public/*.html` **et
  `guide/*.html`**.
  ★★ **Étendre ce contrôle aux ÉCRANS DE L'APP** : l'onglet Cave du Pilotage a affiché « module à
  venir » à un client payant pendant des semaines.
  **Grepper aussi `à venir|à structurer|à construire|chantier prévu` dans `src/*.js`.**
  ★ Contrôle fait le 09/08 : les occurrences restantes sont toutes **légitimes**.
- Les deux gabarits restants de `dpa.html`.
- ★ **Écrire dans le guide et les CGU que Ma Vigne produit un RELEVÉ D'HEURES, pas un bulletin de
  paie.** ★ **C'est déjà dit dans la fiche d'aide Planning** — reste à le porter dans les documents
  contractuels.
- ★★ **La même borne pour les documents de cave** : le registre des manipulations et le bilan de
  campagne sont des **états internes**. C'est écrit **dans les documents eux-mêmes**.

---

## 29. Synchronisation de la mémoire

- **À la fin de chaque session de livraison** : mettre à jour **ce document** et la **mémoire Claude**.
- ⚠️ La mémoire est **plafonnée à 30 entrées** : avant d'ajouter, **fusionner/compresser** —
  ★ à 30/30, `add` **échoue en silence** : toujours **`replace`**.
  ★ **Vécu deux fois le 09/08** : pour faire de la place à une entrée « accompagnement du client »,
  j'ai **fusionné** les deux entrées « modules ES » ; et pour la série installation, j'ai **fusionné
  le chantier dans l'entrée Admin GT** plutôt que d'écraser une entrée sans rapport.
  **Fusionner deux entrées voisines vaut mieux que raccourcir une entrée utile.**
  ★★ **Vécu le 10/08** : la mémoire était encore à 30/30 pour la migration GitHub — l'entrée
  « BUILD/DÉPLOIEMENT/VERSIONNAGE + PROCESS DE LIVRAISON + PATCH SÛR » a été **remplacée** (pas
  fusionnée) puisque c'est exactement elle qui portait l'ancien process d'upload à mettre à jour.
- ★★★ **Vérifier la FRAÎCHEUR du document avant de le régénérer** (10/08) : comparer sa ligne
  « Dernière consolidation » aux dates de la mémoire, et **exiger l'upload au moindre doute**
  (procédure complète en règle d'or n°1). **Un document régénéré en retard est pire que pas de
  document : il porte des affirmations périmées avec l'autorité du porteur de vérité.**
  ★ **Corollaire** : la mémoire peut contenir un chantier que la régénération oublie. **La lire
  entrée par entrée, en cherchant les chantiers, pas seulement les règles.**
- ★ **Après une session d'audit, mettre à jour le document AVANT tout autre travail.**
- ★ **Quand plusieurs consolidations se suivent le même jour, chacune doit RE-VÉRIFIER les constats
  d'état de la précédente.**
- ★★ **Une session longue à plusieurs lots enchaînés est le pire cas pour la mémoire.**
  ★★★ **Les journées du 07/08 et du 09/08 en sont les exemples extrêmes.** Sans ce document, il ne
  resterait rien de la distinction entre `_mvFut*` (utils.js), `_ml*`/`_rm*`/`_bc*`/`_cop*` (cave.js),
  `_pcav*` (pilotage.js), `_dmr*` (app.js), `_mvAide*` (utils.js) et ★ `_agtIns*`/`_agtLot*`
  (admin-gt.js), ni des raisons de chaque choix, ni surtout de **pourquoi la projection par
  historique a été écrite puis détruite**, de **pourquoi le générateur du guide n'est pas dans le
  build**, et de **pourquoi la convention d'adresse ne se déduit pas du slug**.
- ★★★ **10 août (soir) — MIGRATION GITHUB, le changement le plus structurel depuis le début du
  projet.** Le code vit désormais dans un dépôt (`4ss4ss1/mavigne-dev`, public), cloné par Claude en
  tête de session. **Ça ne supprime pas le besoin de ce document** — le dépôt donne le CODE, pas les
  ARBITRAGES, les LEÇONS ni le BACKLOG, qui n'existent nulle part ailleurs que dans ces pages.
  ★ **Piste ouverte, pas encore faite** : committer ce document lui-même dans le dépôt (en
  `CLAUDE.md` à la racine, convention reconnue par les outils Claude) pour qu'il soit, lui aussi,
  lisible sans upload à chaque session. Tant que ce n'est pas fait, la procédure de régénération
  de la Règle d'or n°1 reste pleinement en vigueur pour CE document précis.
- Rappel des trois règles d'or : **lire depuis le dépôt pour le code, partir des uploads pour le
  reste** · **lire les versions, jamais les supposer** · **vérifier, ne pas croire — dans les deux
  sens, y compris sur du code écrit la semaine dernière, sur ce qui est en ligne depuis des mois,
  sur l'outillage lui-même, sur les changelogs, sur les lots qu'on croit avoir livrés, sur les
  constats d'absence, sur les fonctionnalités qu'on croit devoir ajouter alors qu'elles existent
  déjà, sur les SIGNATURES des fonctions, sur CE QUE L'APPLICATION RACONTE D'ELLE-MÊME, et ★★★ sur
  LA NOTE DE MISSION ELLE-MÊME.**

---
