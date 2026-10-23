# Ma Vigne — Instructions personnalisées

> Document de référence du projet **Ma Vigne** (GUERETTECH). Il est le **porteur de vérité** :
> la mémoire Claude est plafonnée, ce fichier ne l'est pas.

> Dernière consolidation : **23 octobre 2026 (PIL-RANGE-1b)** — **PILOTAGE : L’ANCIEN AUJOURD’HUI RETIRÉ (41 FONCTIONS) ; LA CARTE DU TRACTEUR RELOGÉE DANS ÉQUIPE & MATÉRIEL › MATÉRIEL** (§441). Base `90bd810` (« pilfix1 »). La mesure au point fixe a corrigé l’audit (`cockpit.js` nourrit encore le v2 pour moitié : seul son rendu `_ckAuj` est mort) et trouvé une fonctionnalité invisible depuis REF-1 : les cartes du tracteur (GNR-M, GNR-2). Nico, en langage simple : « A » — les reloger ; maquette validée « go ». Retirés : `_pilTabAujAncien` + 19 fonctions du Pilotage, `_ckAuj` + 20 aides de `cockpit.js` (zéro référence vivante, contre-vérifié), 9 fiches « i » de l’ancien écran ; repli d’Aujourd’hui = un message. Relogé : `_pilCkTracteur` dans `_pilTabMat` sous la case `mat_travaux`, « Cuve GNR » de la projection renommée « Gasoil après les travaux ». 28 harnais touchés (ce qui visait le retiré part, ce qui protège le vivant reste ; `auj4` seul supprimé, 27 migrés), `pilrange1` réécrit (19 vertes, 11 contre-épreuves). **APP 9.98 → 9.99, SW 10.77 → 10.78**.

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
★ **Vécu le 13/10 — un clone qui PERSISTE peut porter le travail d'un tour interrompu.** Après le `git pull`, `git status --short` :
des fichiers modifiés que ce tour n'a pas écrits ne sont ni le dépôt ni une livraison — ils se relisent ligne à ligne, comme un
upload ; un commentaire y était faux (§324c).
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
l'en-tête de `sw.js` **et** `CACHE_NAME`, les **5 affichages** dans `index.html` (dont `boot.js?v=`).
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
| ★★★ **« Relancer ne perd rien… Firestore garde ses écritures en attente »** (`_mvRechargeSure`, et la fenêtre du voyant) | **une transaction n'entre dans la file de Firestore qu'à son commit** : la saisie qui attendait le serveur disparaissait à la relance — vécu au tracteur (§326) |

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
| **Tutos guidés** `TU_TUTOS` | `src/tutos.js` | dès qu'un geste enseigné change — `npm run test:tutos` le rejoue au build et rougit sinon ; un geste nouveau sans tuto fait monter le compte de `mv-harnais-tutos` (§358). ★ **TUTO-9 (§423) : un tuto se rejoue AVANT de livrer, pas après la CI** — la marque d’un lot qui touche l’appli exige `rapports/tutos.json`, vert, sur ses fichiers ; un tuto neuf apporte ses données au domaine fictif (`_charger`). ★ **TUTO-10 (§425) : seulement les tutos que le lot touche** — `node scripts/mv-tutos-concernes.mjs` (la liste, à recopier dans la note de livraison), `npm run test:tutos -- --concernes` ; un lien manquant trouvé par la CI s’ajoute à la fiche du tuto (`couvre`) ou à l’aiguillage |
| **`WHATS_NEW`** | `src/utils.js` | dès que le changement est **visible** par l'utilisateur — avec son `niv` et son `pour` (§225) |
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
> journal. Un lot n'est pas « fini » quand le code marche : il est fini quand **sept** choses sont
> faites. À dérouler dans l'ordre, et à **dire dans la réponse**, ligne par ligne — « fait » ou
> « relu, rien à changer ». Un silence sur une ligne vaut oubli.
>
> | # | Livrable | Fichier | Le geste |
> |---|---|---|---|
> | 1 | **Le code** | le module | preflight + harnais + contre-épreuve verts |
> | 2 | **Le guide public** | `guide/NN-*.html` puis `node scripts/build-guide.mjs` | relire la section contre l'écran neuf |
> | 3 | **La fiche `MV_AIDE`** du module | `src/utils.js` | idem, à voix haute |
> | 4 | **`MV_INFO`** du chiffre touché | `src/utils.js` | seulement si une méthode de calcul change |
> | 5 | **`WHATS_NEW`** | `src/utils.js` | un bloc en tête (`d`), du point de vue de l'utilisateur, chaque item avec `niv` et `pour` |
> | 6 | **`CLAUDE.md`** | ici | la section du lot, et **ce qui reste ouvert** |
> | 7 | **La marque du lot** | `lots/<LOT>.json` | `node scripts/mv-lot-marque.mjs <LOT> --section §NNN [--inclut A,B]`, en DERNIER, juste avant le zip, qui la contient. ⚠️ Un nom de lot déjà commité est refusé, et un harnais « neuf » se vérifie absent de `scripts/` avant d’être écrit (PRESENCE-1, §344). `scripts/mv-lots.mjs` (en tête de `npm run check`) refuse deux lots frères collés sans commit entre eux, et un lot dont un fichier a été écrasé (§231) ★ **TUTO-9 (§423) : un lot qui touche l’appli (`src/`, `index.html`, `public/boot.js`, `public/sw.js`) passe d’abord par `npm run build` puis `npm run test:tutos`** — ★ TUTO-10 (§425) : `npm run test:tutos -- --concernes` suffit (seulement les tutos que le lot touche ; aucun → rien à rejouer, la marque le dit), et la note de livraison recopie la ligne « Tutos concernés » de `node scripts/mv-tutos-concernes.mjs` (bac à sable : `MV_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, build sans la chaîne : `node scripts/mv-gt-page.mjs && npx vite build && node scripts/inject-precache.mjs && node scripts/mv-version-json.mjs`), APRÈS la dernière retouche de code : la marque refuse un rapport absent, rouge, ou fait sur d’autres sources ; `--sans-tutos "<raison>"` pour une exception décidée |
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

★★ **Tout geste inhabituel demandé à Nico se livre avec son tuto pas à pas** (Nico, 15/10) : Search Console, console
Firebase, le réglage d’un service, une commande qu’il ne tape pas d’habitude — où aller, où cliquer, quoi coller, ce qu’il
doit voir à la fin. « Demander l’indexation » sans le chemin ne suffit pas.

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
  **`C:\Users\p4n0m\Desktop\Dev\mavigne-dev\`** (tranché le 02/10 : les deux chemins notés jusque-là
  étaient faux). (dossier **distinct** de l'ancien `mavigne\`,
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
- Poste : dépôt Git `C:\Users\p4n0m\Desktop\Dev\mavigne-dev` (celui qui fait foi ; l'ancien dossier
  `mavigne\` n'est plus la référence).
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
| **Pilotage** | **8 entrées** (`_PIL_TABS`) : Aujourd'hui (cockpit v2, bascule Terrain · Cave · Économie, §436) · L'année · La campagne · L'équipe & le matériel · Décider ┃ Économie (6 sous-vues) · Conformité · Archives ; roue crantée : Paramétrage. Plus d'onglet Cave (`cav` → `auj`) ni de bouton Outils (NAV-3). Rangement en cours (§439 : portée unique, L'année supprimée, 7 entrées à terme). Portée unique `_PIL_SCOPE`, 4 photos en tête, moteur de diagnostic. **§34** |
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

- **Build** : Vite + Rollup, sortie **module ES en un seul fichier** (`<script type="module">`, vu au build du 04/10, §241 — « IIFE » était faux). `minify:false` en dev ; Terser `toplevel` + `unsafe` en
  prod. Hosting Firebase. ⚠️ `root:'.'`, `publicDir:'public'`, `outDir:'dist'`,
  `rollupOptions.input = { main: './index.html' }`. Assets hashés dans **`dist/assets/`**.
- **Firebase v10 modulaire** + compat `window.firebase` : Firestore (**eur3**), Auth, Storage,
  Cloud Functions (**europe-west1, Node 22**), App Check (**reCAPTCHA v3**).
- **Leaflet 1.9.4** (CDN unpkg, lazy + SRI). **Open-Meteo AROME** (~1,5 km). **Géocodage BAN**
  (`api-adresse.data.gouv.fr`, runtime navigateur, sans clé, France uniquement).
- **Polices** : Cormorant Garamond + Outfit, **auto-hébergées** (`/fonts/fonts.css`).
  ★ Elles se récupèrent aussi en paquets npm `@fontsource/cormorant-garamond` et `@fontsource/outfit`
  — c'est ainsi que sont produits les PDF (§18c).
- **CSS applicatif** : **`src/styles.css`** (asset Vite hashé, précaché). Seul le **splash** reste ★ **Les réglages vivent dans `src/charte.css`** (CHARTE-2, §368), importée en tête de styles.css : le seul fichier à changer pour le look ; la modifier = bump SW, comme la feuille.
  inline dans `index.html`. ⚠️ Modifier `styles.css` = **bump SW**.
  ★ **Beaucoup de CSS est injecté par les modules** (`_caveV2InjectCss`, `_mlInjectCss`,
  `_pcavInjectCss`, `_dmrInjectCss`, `_agtInsCss`, le `@media(max-width:880px)` de `pilotage.js`) :
  **c'est ce qui permet des refontes visuelles sans toucher `styles.css`.** ⚠️ **Direction inverse depuis la série CHARTE (§367-368)** : les réglages vont dans la charte, les pièces communes dans la feuille — plus dans les modules.
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
- ⚠️ **Ouverture à froid lente** — plus à cause des lectures (en parallèle depuis PERF-1) : voile imposé, mot de passe à chaque ouverture, attentes réseau mises bout à bout. Mesures et plan : `audit-perf-ux.md` (§241).
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
├── index.html              ← À LA RACINE (shell + overlays + 5 affichages de version)
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
│   ├── charte.css · styles.css  (la charte : TOUS les réglages, CHARTE-2 — puis le CSS applicatif, qui l’importe en premier ; asset Vite hashé)
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
│   ├── onboarding.js · taille-doc.js (★ TAILLE-2 §246 : la règle de taille Firestore, PURE, partagée avec npm run taille)
│   ├── admin-gt.js         (★★ gt.html SEULEMENT — entrée src/gt.js, GT-1 §249 · panneau GT + FICHE CLIENT + ASSISTANT `_agtIns`
│   │                        + création de comptes en lot `_agtLot` — cf. §18)
│   ├── planning.js
│   ├── reglages.js         (+ MV_DOCS / MV_DOCS_FAM : le hub Documents)
│   ├── tournees.js         (TRN-1 §330 : l'éditeur des tournées et sa section de la roue crantée ; importé par reglages.js)
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
npm run build && firebase deploy --only hosting     ← le zip ne touche que l'appli (le cas courant)
npm run build && firebase deploy                    ← le zip touche aussi functions/ ou les rules
```
- ★★ **BUILD-1 (§305) — la note de livraison donne TOUJOURS la commande exacte.** Vérifié dans le code de l'outil Firebase (`release/planner.ts`) : un
  `firebase deploy` complet saute les fonctions inchangées, mais les analyse et republie les deux fichiers de rules ; et l'empreinte couvre TOUT `functions/` :
  un seul fichier touché refait les 37 (d'où `--only functions:<nom>`).

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
| ★ **TUTOS — les tutos rejoués** | `npm run test:tutos` (après le build) | chaque tuto sur chaque écran (téléphone, ordinateur), au panneau et au miroir ; compte les tutos joués ; refuse un build plus ancien que les sources ; écrit `rapports/tutos.json`, **exigé par la marque d’un lot qui touche l’appli** (TUTO-9, §423). ★ `--concernes` (TUTO-10, §425) : seulement les tutos que le changement touche — la CI, elle, rejoue tout. Hors `npm run check` (il lui faut un build et un navigateur), étape de la CI |
| ★ **RULES — règles Firestore** | `npm run test:rules` | `firestore.rules` **exécutées** sur l'émulateur : 70 requêtes + 15 contre-épreuves (§189, §250). Java 21 requis ; **hors `npm run check`**, job CI `rules` |

★★★ **AJOUTER UN CONTRÔLE = UNE LIGNE DANS `scripts/mv-harnais-liste.mjs`** (LISTE-1, §190), et sa contre-épreuve sur
la ligne suivante. **Rien dans `package.json`, rien dans `ci.yml`** : `check` = `node scripts/mv-lanceur.mjs`, `prebuild` =
`npm run check`, la CI joue le lanceur `--continuer`. `mv-harnais-portes` rougit si une seconde liste revient. Reprendre après
un rouge : `node scripts/mv-lanceur.mjs --depuis <script>` ; un groupe seul : `--groupe <id>` ; voir la liste : `--liste`.
★★★ **BUILD-1 (§305) — LE LANCEUR JOUE EN PARALLÈLE** : autant de commandes que de cœurs, sorties dans l'ordre de la liste ; `--un-par-un` (ou `MV_JOBS=1`) = l'ancien
mode. Deux règles pour tout harnais neuf : **il SORT quand il a fini** (`process.exit`) — un minuteur du code testé le garde sinon en vie (vécu : `auth1`, 60 s à
chaque build) ; **s'il écrit dans le dépôt** (un vrai fichier, ou un temporaire dans `src/` ou `scripts/`), **une ligne dans `SEULS`** (`mv-harnais-liste.mjs`) —
`mv-harnais-lanceur` rougit sinon. Les SEULES passent en tête, une par une ; on ne tue jamais une commande en cours (cuvgr3 rend son fichier dans un `finally`).

★★ **GF-2 (§303) — LA CHAÎNE SE JOUE JUSQU'AU BOUT, ET SON RÉSUMÉ FAIT FOI.** Elle dépasse le temps d'un appel côté Claude : la lancer en
arrière-plan (`nohup env TZ=Europe/Paris node scripts/mv-lanceur.mjs --continuer > /tmp/chaine.log 2>&1 &`) et lire sa dernière ligne. Le 09/10,
trois tranches relues par un script maison (`… | sort -u | head -20`) ont caché un KO de `mv-harnais-subset` : GF-1 est parti « vert », la CI a rougi.
★ **DIRECT-1 (§318) — si l'arrière-plan meurt avec l'appel** (12/10 : `nohup`, puis `setsid`, coupés à la fin de l'appel, `npm ci` compris) : jouer la liste `HARNAIS`
de `mv-harnais-liste.mjs` par tranches au premier plan, en notant le code retour de chaque commande ; un rouge en 0 s accuse d'abord `node_modules`.
★ **DIRECT-2 (§328) — le 14/10, l'arrière-plan a survécu aux appels** (`setsid nohup … &`, suivi par `pgrep` et la fin du journal) : la chaîne d'un trait, 1 038 s. Essayer d'abord ; les tranches si le processus disparaît. Rien de lourd à côté (un seul cœur) : un preflight lancé en parallèle a dépassé les 300 s de l'appel.

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
2. **5 affichages RÉELS** dans `index.html` (**à la racine**) : ★ `boot.js?v=` (TUTO-4, §361), footer `·`, `.mod-header-sub`,
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
**versionné** `[{v, d, items:[{niv, pour, cible?, emoji, titre, desc}]}]` : on **préfixe un bloc**, jamais on ne remplace ;
récap **cumulatif** via `_whatsNewSince`/`_cmpVer` ; sous-lot technique = `items:[]` ; correctif
invisible = `WHATS_NEW = []` et **bump SW seul** ; rédaction **du point de vue de l'utilisateur** —
le problème vécu d'abord, le correctif ensuite.

★★ **ANN-1 (§225) — DÉCIDER LE NIVEAU, ITEM PAR ITEM.** Depuis 8.04 le bloc porte `d:'AAAA-MM-JJ'` et chaque item `niv` +
`pour` (`tous` · `admin` · `salaries` · `tractoriste` · un module) : **0** Journal seul (les corrections) · **1** pastille
« Nouveau » sur `cible` (un `#id` qui existe : une ligne ou un bouton, jamais un onglet — la barre défile et la coupe) · **2**
« À vérifier » sur l'Accueil jusqu'à « Vu » (un chiffre qui bouge, un réglage à contrôler — **rare**, sinon la lassitude revient)
· **3** la grande fenêtre (30 jours, 3 au plus). Titre d'un item classé = texte pur (échappé). `mv-whatsnew-check` refuse un bloc
sans `d`, un item sans `niv`/`pour`, une cible introuvable. Les blocs d'avant 8.04 ne se réécrivent pas.

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
- ★ **Mise à jour : jamais sous les doigts, mais elle ne traîne plus** (MAJ-1 §157, VER-1 §184, MAJ-2 §327). `skipWaiting` ne part que sur `MV_ACTIVER` (le geste : écran obligatoire, barre « Nouvelle version prête », carte de la barre latérale, Réglages › Moi › Mise à jour) ou `MV_ACTIVER_CALME` (moment calme : appli passée en arrière-plan ou retour avant le premier geste, rien en cours — refusé si une autre fenêtre de l'appli est affichée). Plus de seuil de 4 h. `controllerchange` → `_mvMajRecharger` (rideau ouvert ou appli cachée : tout de suite ; sinon un moment calme, 30 s au plus). `_swUpdatePending` reste du code mort.

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

★★★ **MOTIFS-1 (§250) — L'EXCEPTION RAISONNÉE, ET SON ORDRE.** Depuis le 05/10, `planning_entries`, `planning_hsup` et
`planning_acomptes` sont admin-only **en lecture** (`isAdminReadDoc`, avec `paie`). Règle de Nico : un salarié ne voit pas les
motifs de ses collègues — et son téléphone ne les reçoit pas. Sans danger parce que, **dans cet ordre** : (1) le client cesse de
les demander en vue salarié (`firebase.js/_mvClesLues` : il lit `planning_equipe` + `planning_moi_<uid>`, fabriqués par le serveur) ;
(2) la Couche 2 ne garde que parcelles / membres / saisons ; (3) un salarié n'écrit jamais le planning (règle 1 + garde de `fbSave`) ;
(4) la règle se ferme EN DERNIER (functions → `gtPlanningVues` → hosting → rules). **Toute future restriction de lecture suit ce
patron : d'abord le client cesse de lire, ensuite seulement la règle se ferme.** ⚠️ Un rôle `pilotage` sans `admin` est en vue
salarié : le Pilotage lui montre « absent » au lieu de « en arrêt » — cohérent avec `paie`, qui lui est déjà refusée.

⚠️ **`assertRealEmailForAdmin`** : les adresses factices sont bloquées pour un admin. Un nouveau
claim ne prend effet **qu'après rechargement** (cache de jeton ~1 h).
⚠️⚠️ **Trois choses distinctes sur les adresses fictives** :
1. la **regex de détection** côté serveur couvre `@mavigne.app` **et** `@mavigneapp.fr` ;
2. la **convention réelle d'un domaine** n'est ni l'une ni l'autre par défaut — elle se **déduit**
   des comptes déjà en place (§18b) ;
3. un **administrateur** ne peut pas avoir d'adresse fictive : c'est son seul moyen de récupérer
   son accès. ★ L'écran de création en lot le dit **avant** d'essayer.
⚠️ **Accorder `admin` expose les rémunérations des collègues** (`paie`) — à discuter avant.

★★★ **Les règles se prouvent en les EXÉCUTANT (RULES-1, §189).** `mv-harnais-rules` joue 70 requêtes réelles (dont 17 du planning de l'équipe, §250)
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
regarder**. Une assertion verte n'a jamais montré un texte coupé en trois. ★ **L’outil : `node scripts/mv-captures.mjs`** (CAPTURES-1, §371) — l’appli construite, entrée par la démo, les écrans voulus en clair et en sombre, au téléphone et sur ordinateur ; une capture où l’écran de connexion est revenu ne compte pas.
★★★ **Et le regarder AUSSI en « animations réduites »** (`prefers-reduced-motion: reduce`, réglage Windows courant). Jusqu'à MANQUE-1 (§357), le fondu d'entrée de `.page`, en `forwards`, faisait de la page active un contexte d'empilement PERMANENT : la barre du Planning SOUS la fenêtre (CADRE-1, §300), le panneau « Ce qu'il manque » SOUS la barre du bas (TOUR-1 avait monté son z-index sans mesurer : sans effet).
Le fondu n'est plus `forwards` : les deux mondes se rejoignent après 0,24 s. ★ Jamais `forwards`/`both` sur une animation de `.page` ; un z-index se MESURE au navigateur (`elementFromPoint`), il ne se déduit pas.

**Build (JS / Rollup / IIFE)**
1. Toute fonction appelée par un `onclick` injecté doit être exposée sur **`window.*`**.
   ★ Vécu six fois : `selCopMil`, `_caveSeuilMilStep`, `_caveSeuilMilReset`, `_dmrGo`,
   ★ les six fonctions de périodes et ★ les deux de machines (§18b).
   **Symptôme : le bouton ne fait rien, en silence.**
   ⚠️⚠️ **Et le preflight ne regarde QUE `onclick`** : `onblur`, `onchange`, `oninput` ont le même
   sort. **Contrôle maison obligatoire** (§6c).
   ★ **Et son NOM s'écrit en clair** (PERDATE-1, §427) : `onclick="f('…')"`, jamais `onclick="'+fn+'('…` — le preflight (C6),
   le compte des gestes sans tuto (`mv-harnais-tutos`) et l'aiguillage des tutos lisent le nom dans le code ; passé en variable,
   le geste leur devient invisible (vécu : deux gestes perdus, une contre-épreuve passée dessous).
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
21. ★★ **UN MILLÉSIME, UNE ANNÉE, UN IDENTIFIANT TRAVERSENT LES MODULES SOUS DEUX TYPES** (RDT-XLS, §201). `'2026'` vient d'une
    feuille de tri ou d'une clé d'objet, `2026` d'un `parseInt`. Un `===`/`!==` entre les deux est **faux en silence** : le
    fichier Excel sortait 0 hL/ha pendant que les kilos, filtrés avec `String()`, étaient justes. **Comparer `String(a)===String(b)`
    dans la fonction qui filtre**, pas chez l'appelant ; et un harnais qui bouchonne une fonction doit avoir un frère qui
    joue l'appel réel — le défaut vivait dans la couture entre deux harnais verts.
22. ★★ **UN ÉCRAN QUI SE REMONTE (HTML neuf, puis montage) REMET À ZÉRO L'ÉTAT DE SON MODULE** (AUJ-6, §308). Le cockpit gardait les cadres de ses graphes et sa bascule
    d'un montage à l'autre : après Économie, le montage suivant dessinait dans une boîte vide, levait, et l'erreur avalée laissait la page à moitié montée.

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
   ★ **Un identifiant neuf aussi, même dans un préfixe connu** : `es-` sert aux sessions du tracteur ET aux périodes — `es-note`
   existait (C18 l'a pris, PERDATE-1, §427).
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
16. ★★ **Une classe de mise en page PARTAGÉE fait voyager les règles d'un bloc à l'autre** (GNR-2, §256). Le bloc tracteur portait
    `.pil-dec` pour sa grille ; ALIGN-1 y a posé « par deux sous 600 px » pour les quatre tuiles du jour, et la cuve est passée en
    demi-colonne sans qu'aucun harnais le voie. **Un bloc qui n'est pas ce que la classe nomme prend SA classe.** Même famille que
    le `.cl` global (§192c) et le préfixe `mvs-` (n°5).
17. ★★★ **Une règle UNIVERSELLE (`*`, `html`, `body`, `button`) recopiée d'une maquette vaut pour TOUTE l'appli** (CADRE-1, §300).
    Le socle du cockpit posait `*{box-sizing:inherit}` : tout est passé en content-box, 27 fenêtres sur 38 ont débordé. **La borner à la
    racine du composant** (`.ck2 *`). `mv-harnais-cadre1` refuse un `box-sizing:inherit` hors de `.ck2` et une page affichée hors de `.active`.
18. ★★ **Un `.overlay` rangé dans une page n'est plus une fenêtre : il quitte la classe `.overlay`** (`_plFicheFenetre`, §300). Sinon le
    verrou A11Y-2 le prend pour la fenêtre du dessus et rend tout le reste inerte.
19. ★★ **Un `unicode-range` dit ce qu'une fonte PRÉTEND couvrir, pas ce qu'elle dessine** (AUJ-7, §309) : U+202F, l'espace des nombres en français, était dans la
    plage et dans aucune des onze fontes — chaque appareil la prenait ailleurs, parfois de largeur nulle. Un caractère neuf se vérifie DANS la fonte (`fontTools`, `getBestCmap()`).
20. ★★ **Un habillage qui repeint un FOND repeint aussi les ENCRES de tout ce qu'il contient** (TETE-2, §329). TETE-1 a passé le bandeau du Pilotage du brun au blanc et foncé titre, période, vignoble — pas la météo ni l'aide, restées crème : invisibles en clair, justes en sombre. Aucun harnais ne lit une couleur posée par une autre règle : seul le rendu des deux thèmes l'a montré.
21. ★★ **LA CHARTE : UN RÉGLAGE NE SE DÉCLARE QUE DANS `src/charte.css`, UNE POLICE NE S’ÉCRIT QUE PAR SON RÉGLAGE** (CHARTE-1 §367, CHARTE-2 §368). La charte, importée en tête de styles.css, porte tous les réglages — `:root`, `#app-root[data-theme]`, leurs `@media` sombre et animations réduites — et rien d’autre ; le sombre s’y redit DEUX fois à l’identique (bascule manuelle, mode automatique). Partout ailleurs on LIT : `var(--x)` dans la feuille ; hors feuille (modules, index.html, pages GT, boot.js) avec un repli, `var(--font-ui,'Outfit',sans-serif)`, pour les fenêtres sans feuille. Attribut SVG : `font-family="var(--font-ui,Outfit)"` ; toile : `getComputedStyle` (`policeUi`). Un réglage local à une pièce (`.ck2{--x}`) reste dans la feuille. `mv-harnais-charte` et `mv-harnais-police` refusent le reste. Un bouton neuf prend les pièces `.mvbtn` (CHARTE-3, §370) — plus de classe de bouton qui pose son propre fond, sa bordure ou son arrondi (`mv-harnais-boutons`, plafond qui ne peut que baisser) ; préfixe réservé `.mvbtn-` (`.mvb-` est pris). ★ `.mvbtn-choix` est le CADRE d’un groupe d’options, posé une fois autour (`<div class="mvbtn-choix" role="group">`), chaque bouton une `.mvbtn-option` dedans ; posé sur un bouton, il en fait un cadre à part, en taille terrain, sans option marquée — la bascule Météo d’ACCV-3 (BASCULE-1, §422 ; `mv-harnais-boutons`, règle F).

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
4. **Versions** — bump APP (`APP_VERSION` + **les 5 affichages réels** d'`index.html`) **ET** SW
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

### ⚠️ LE BACKLOG, AUDITÉ LE 21/10/2026 (§411) — LIRE CECI D’ABORD
Les 75 rubriques d’avant (236 points, posées du 11/08 au 21/10) ont été confrontées au code et aux décisions de Nico, point par point. Ce qui est fait ou dépassé est rayé (liste en bas) ; le reste est rangé en six paquets, une ligne par point, le lot d’origine entre parenthèses. **Le texte complet d’avant est conservé mot pour mot dans `docs/claude/backlog-archive-2026-10-21.md`** : y chercher le détail d’un point avant de le reprendre. Un point repris et livré se raye ici, avec son numéro de section.

#### 1. À vérifier chez Nico — ce que Claude ne peut pas voir (ses vraies données, un vrai téléphone)
- **Accueil et Vigne** : **la fenêtre « Qui a fait ce travail ? » et les listes d’équipe selon les contrats, la validation en retard d’un saisonnier parti comprise (JEQ-1, §421)** ; **la correction de l’équipe au Journal, et « La saison » avec un arrachage en cours (ACCV-4, §419) ; la carte Météo à bascule sur un domaine à plusieurs communes — redessinée par BASCULE-1 (§422) : le cadre, la vue choisie, le passage de l’une à l’autre —, et Personnaliser à l’œil seul (ACCV-3, §418) ; l’Accueil en sept cartes (ACCV-2, §417) sur ses données — les deux colonnes, la colonne de droite collée, « À savoir » un jour de pluie, « La saison », « Ma saison » et ses jalons, « En direct » ; la carte du jour (ACCV-1, §416) — la mosaïque, ses rangs et ses couleurs, la petite victoire, « En ce moment » avec une équipe du jour, un délai de rentrée en cours** ; l’arrivée de l’ouvrier avec une tournée active (ARRIVEE) ; la pastille « Pourquoi ? » (POURQUOI-1) ; les tournées et leur éditeur (TRN-1/2) ; les parcelles « Toutes tâches » et l’encart (TOURNEE-1) ; le plan d’entreplantation après un signalement (ETAT-1) ; l’arrachage « À faire » / « Toutes » (ARRACH-9) ; la carte de l’Accueil sur SES contours (FORME-1/2) ; les dates des travaux de l’hiver (PRIO-1).
- **Pilotage** : Aujourd’hui — la fenêtre passée (DATES-1), une tâche désactivée sur quelques parcelles (HORS-1), « En direct » (DIRECT-1/2), la bande météo (AUJ-8), Économie et la tuile Budget (AUJ-5/7), « À savoir » (AUJ-6), trois colonnes sur grand écran et la frise 24 h de « Traiter ? » un jour de fenêtre (PRO-1) ; L’année (ANNEE-1) ; les fiches « i » (BULLE-1) ; la cuve GNR et les cartes densifiées (GNR-2, GNR-M) ; l’avancement de l’effeuillage et du désherbage (SEL-1) ; le revient (REV-1). ; **la colonne de droite sur son PC (zoom 125 %)** : en descendant, les onglets restent sous le bandeau, « En direct » puis « À savoir » sous les deux, « Tout voir (N) » et « Replier » un jour chargé, la molette posée sur la colonne ; la tablette (760 à 1 023 px) jamais vue sur un appareil (COLLE-1, §412) ; **les points à anticiper en tête d’« À savoir », surlignés, et la phrase qui y mène — au téléphone, sur PC, un jour à plus de cinq points, en sombre (ANTICIPE-1, §420)**.
- **Cave** : la frise FML et la fiche cuvée (FML-1) ; Le millésime (RANGE-1) ; **le hL/ha des cuvées et le bloc « Par appellation », sur ses données — les couleurs viennent des cépages, une parcelle sans appellation tombe dans « Sans appellation »** (HLHA-1, §413) ; « une parcelle ne sera pas récoltée ? » (SANSREC-1) ; l’onglet Labo (LABO-1/2) ; la tournée du Cuvier (TOURCUV-1).
- **Planning et équipe** : **les journées de cave (JCAVE-1, §428) — au Planning sur son PC et au téléphone : l’en-tête d’un jour coché, « Cave », la fenêtre, la bande au pied des cases ; ses journées de cave d’octobre marquées, la Réparation et le Dégraffage de Pilotage › Aujourd’hui ; la pastille « Cave » des équipes du jour (au téléphone, elle passe à la ligne)** ; la vue équipe sur un téléphone de salarié (VUE-EQUIPE-1) ; **un vrai PDF de la feuille d’heures, regardé** (§55) ; la journée ouverte depuis la barre sur PC (CADRE-1).
- **Partout** : **les deux fenêtres de période sur son PC (PERDATE-1, §427) — un 31/09 tapé dans « Nouvelle période » puis dans « Modifier la période » : la case en rouge, le message, rien d’enregistré ; « temps réel » dans la liste des tâches** ; **les icônes des modules en relief (ETAIN-1, §426) — la barre du bas au téléphone, la feuille « Plus » et « Plus » allumé dans Cave, Réserve, Planning ou Réglages ; la barre latérale dépliée et repliée (touche « [ »), clair et sombre ; l’appui qui enfonce la tuile** ; **le tuto ouvert à côté de l’appli sur son PC à 125 % (COTE-1, §424) — le panneau collé à droite, l’appli resserrée, la barre repliée, une fenêtre ouverte pendant le tuto, puis « Fenêtre à part » ; un écran plus étroit que 1 280 px (plein écran) ; les « + » des boutons d’ajout (Cuvier, Labo, feuille des comptes)** ; les compteurs de la barre sur son PC à 125 % (JEQ-1, §421) ; l’aide de deux ou trois modules (AIDE-1) ; un tuto ouvert depuis un écran éloigné (TUTO-1 à 7) ; « Ce qu’il manque » (MANQUE-1) ; les dix en-têtes (TETE-2) ; la barre latérale sur PC (RAIL-1) ; des parcelles au tracteur quand le serveur ne répond pas (ENVOI-1) ; les notifications sur chaque téléphone (NOTIF-3) ; le comptage des pieds (COMPTE-1) ; le retrait d’une tâche (RETRAIT-1) ; la ligne « À vérifier » des nouveautés (ANN-1) ; l’assistant de fertilisation (FERTI-3) ; les flèches et pièces du dessin commun (CHARTE) ; **le liseré doré des fenêtres en sombre : le nom de sa règle, par l’inspecteur** (REVUE-10, §410).

#### 2. Gestes à faire chez Nico (hors code)
- **Déployer les fonctions serveur dans l’ordre** : celles de MOTIFS-1 (Planning), puis NOTIF-3 avec ses deux secrets (§311f).
- **Jouer les règles Firestore** : `npm run test:rules` (ou le job CI `rules`) — leurs cas récents n’ont jamais tourné côté Claude (MOTIFS-1, JALONS).
- **Avant le premier vrai nouveau client** : l’installation à blanc complète sur un domaine jetable (PREP-1, « le seul critique ouvert ») ; vérifier la persistance cloud domaine par domaine (§43g) ; vérifier que `mise-en-route.html` est en ligne dans sa version qui envoie.
- **Données du domaine de référence** : reposer le 19 et le 20 août (§55) ; redéclarer la parcelle arrachée en janvier avec sa vraie date (ARRACH-8).
- **Mesure** : `npm run taille -- "<vraie sauvegarde>.json"`, puis une seconde plus tard (AUDIT-PERF).
- **Au déploiement général** : suivre le parc d’appareils dans l’Admin GT (format `MV_FORMAT` 3, TRN-2) ; rejouer une fois `npm run test:e2e` (PRO-1).
- **Trois anciens lots connus par le seul `sw.js`** (05/08, 06/08, 09/08) : les consigner, ou décider de les laisser.

#### 3. Décisions à prendre (Nico)
- **Les journées de cave, ce qui reste à trancher** (JCAVE-1, §428e) : l’écart de cadence (tuile « Écart au barème ») ne retire pas la cave — consigne du 23/09 — et affiche 0,0 % tant que moins de 40 % du travail est validé (`_PEC_CAD_AVC`) : un tiret, comme les autres écarts ? L’effectif du jour (Décider, tuile Effectif) sans les personnes en cave toute la journée ? Le « qui » d’une opération du Cuvier (prérempli : pas une preuve de journée) ?
- L’ordre de sortie des heures : le taux le plus élevé d’abord, ou au choix à la demande (DIM-4).
- L’écart de cadence ou le temps réel, pour décider (question ouverte depuis TV-1).
- Les deux réglages des fermentations à caler sur ses cuves (`_VEND_GF_STAGNE`, `_VEND_GF_CAD`), et le repère de densité (GF-1).
- « ETP » à l’écran du Planning, alors que l’imprimé dit « Réalisation N % du prévu » (§55).
- Les cases grises « 7h » du Planning (CADRE-1).
- « Accéder » ou « Préparer » un domaine : une seule porte (PREP-1).
- L’essai : ce qui se passe après J30 ; la lecture seule côté serveur, frein ou serrure (§40, §43).
- La clôture d’une saison très incomplète : l’empêcher ou la signaler (§43).
- Le « Vu » des nouveautés : par appareil (aujourd’hui) ou en base (ANN-1).
- Le chrono du tracteur dans la démo : le semer pour en faire un moment, ou pas (§43).
- La compilation Vite (Terser, deux passes) (BUILD-1) ; le thème saisonnier (maquette 4 saisons).
- « En direct » : une seule ligne dépasse déjà la hauteur d’une journée calme (colonne de 280 px) — elle s’affiche en fondu avec « Tout voir (1) » ; 40 px de plus la feraient tenir (COLLE-1, §412).

- Une appellation dont le maximum diffère en rouge et en blanc : la déclarer deux fois dans Appellations (ce qui marche aujourd’hui), ou un maximum par couleur sur l’appellation (HLHA-1, §413).

#### 4. Petites suites techniques (Claude peut les faire)
- **Périodes** (PERDATE-1, §427f) : les dates de travaux estimées ne contrôlent pas une fin avant le début ; les listes de tâches des deux fenêtres affichent les heures de la Côte de Nuits, sans barème régional ni densité (l’écran du barème, lui, les applique).
- **Planning** : un retard d’une heure et une absence d’une journée s’affichent pareil (`_pl2Cell`) (§43) ; les écrivains de congés reconstruisent l’entrée à neuf (§55) ; « Solde cumulé » et « Reste à prendre » coexistent.
- **Dates** : « aujourd’hui » lu en heure universelle (`toISOString().slice(0,10)`) — 14 endroits, 64 au 16/08 (§55, LARG-1).
- **Règles métier en double** : « présent ce jour-là » — les intervenants du Cuvier (`_vmIntRender`, statut seul) et le coéquipier du tracteur (`_condList`) gardent leur règle, et `_pilMembresActifs` (pilotage.js) récrit celle de `_mvEquipeProposee` (app.js) (JEQ-1, §421) ; trois définitions d’une annulation (ARRACH-8) ; deux de la vendange (SANSREC-1) ; `_pecZeros` encore appelé à côté de `_pilDiag` — à confirmer (§42).
- **Petits écrans** : le point « en direct » de la barre ne respire pas (`@keyframes respire` n’existe pas, vu à JEQ-1) ; « 0/0 tâche » → un tiret (ARRACH-8) ; « Début » d’un arrachage sans étape (SEL-1) ; la note « cliquez une campagne » cachée au téléphone (`.pil-cr-note`) ; les cartes du Pilotage sans ligne de cadre (§42) ; « Personne d’indiqué » sur un arrachage en étapes (DIRECT-2) ; le sélecteur de tâches qui défile sans indice (AUJ-6) ; des boutons `.ck-ch` qui débordent de 8 px (CADRE-1) ; le Cuvier sans intervenant à l’écran (« la colonne reste vide »).
- **Pilotage › Aujourd’hui** : « absent » reste au masculin dans Décider (`_dzMotif`, « absent · événement familial ») — la règle d’ANTICIPE-1 (§420) à y porter ; au téléphone, en descendant, la barre d’onglets passe à moitié sous le bandeau (vu au rendu d’ANTICIPE-1, pas comparé à la base) ; un objectif déjà passé fait déborder la ligne d’objectif de « Charge restante » sur la colonne de gauche (vu dans la démo) ; le fil de portée passe sous le bandeau en descendant, comme depuis TETE-2, et `--pil-portee-h` n’est posé que par `_pilPortee` (COLLE-1, §412).
- **Mise à jour** : après rechargement, l’appli repart de son premier écran (MAJ-2) ; l’annonce d’un jalon ne suit que la feuille de validation (JALONS).
- **Sécurité et essai** : les règles F01 (`_mv_signatures` lisible par une fiche inactive) et F02 (`error_log` non borné pour tous) (RULES-1) ; `trialExp` et `trial_until` qui peuvent diverger (§43) ; la vérification des six clés en fin de mise en route (§27f).
- **Contrôles** : trois harnais rougissent entre minuit et 2 h, heure de Paris — `mv-harnais-reste-a-rentrer`, `mv-harnais-cuv13`, `mv-harnais-ref1` (vus à JEQ-1, §421, sur la base comme sur le lot ; verts en temps universel et à midi) : une date du jour lue dans deux horloges, à trouver ; `mv-harnais-jetons --contre` — « un cercle est converti en jeton » ne mord pas, déjà sur la base, hors chaîne (vu à ANTICIPE-1, §420) ; `mv-harnais-cuvier-correction.mjs` ne démarre plus et n’est dans aucune chaîne (GF-1) ; `mv-harnais-audit-pil` porte deux rouges anciens (ALIGN-1) ; rejouer les six contre-épreuves de `cadAppl` (§43) ; alléger `recup --contre` (BUILD-1) ; la cause du débordement de l’Accueil, jamais nommée (garde `overflow-x:clip`, depuis le 25/08).
- **Dette mesurée le 21/10** : `catch` vides 20 (193 au 16/08) ; couleurs écrites en dur dans les JS 4 224 (3 319 au 16/08 — elle monte) ; modules lourds `utils.js` 979 ko, `app.js` 925, `pilotage.js` 911, `cave.js` 667 ; 17 points de rupture dans la feuille ; 314 ré-exports `window.X` dans `app.js` ; 21 sommes de surface à la main ; `mvDate()` / `mvNum()` toujours absents.

- **Rendement (HLHA-1, §413)** : la réfaction des pieds manquants au-delà de 20 % (le rendement autorisé d’une parcelle baisse d’autant) n’est pas portée ; « Par appellation » compare le meilleur chiffre au maximum, même quand le bas de la fourchette est dessous (la règle des parcelles) ; deux cuves dans une cuvée : la chaîne suit la cuve de `_caveCuveSource`, pas celle de la ligne (RANGE-1) — le hL/ha suit la chaîne, « D’où vient » garde sa cuve.

#### 5. Chantiers
- **« D’où viennent ces heures »** sous chaque tâche du Pilotage — qui, quels jours, ce qui vient de jours d’attente — pour vérifier un chiffre réel sur ses données (proposé le 22/10 avec JCAVE-1, §428).
- **Les dates impossibles, partout** (PERDATE-1, §427f) : 69 autres champs date lisent encore un 31/09 tapé comme une case vide (message faux ou date effacée, selon l’écran — à voir un par un) ; remonter `_perDateLue` dans utils.js et la brancher écran par écran, avec le refus à l’enregistrement.
- **L’Accueil Vigne au dessin de la maquette** (ACCV-1 à ACCV-4, §416 à §419, faits) : corriger aussi la date, la parcelle ou la tâche d’une entrée du Journal (§419d) ; les absences et les fins de contrat dans « À savoir » ; « Ta présence est notée » dans « À savoir » ; l’auteur et l’heure du message de priorité ; le seuil du gel (0 °C ou 3 °C, §418b) ; découper `app.js` (l’Accueil à part) ; purger la feuille des règles des blocs retirés, leurs harnais d’abord (§418d).
- **Le site internet** : refaire la page « logiciel-vigne » depuis la refonte, maquette d’abord.
- **Le déploiement général de la refonte** : le grand panneau « Quoi de neuf » et le livret PDF, maquette d’abord.
- **Cave** : GESTES-2 (la suite d’une dégustation jusqu’au geste qui la solde, validé, non fait) ; la série cave lot 2 (bâtonnage et rappel, méchage, analyses complètes, mise en bouteille enrichie).
- **« Pourquoi on le fait »** : POURQUOI-2 (l’admin réécrit les fiches, saisie échappée) ; les fiches manquantes (Cuvier, mise en bouteille, activités du tracteur).
- **Pilotage** : la revue de l’onglet Économie après L’année (ANNEE-1) ; les lots suivants de la maquette « densifier le Pilotage » (GNR-M) ; la suite du plan `audit-perf-ux.md`.
- **Données et domaines** : l’import KML en fusion sur un domaine vivant ; le rattachement des anciens fûts à une référence (maquetté, validé) ; les modules par défaut selon le rôle ; le rôle « pilotage » (0 occurrence) ; le contrat « tâcheron » (0 occurrence) ; le calendrier d’épandage régional ; les variantes girondines (vérification documentaire).
- **Divers** : découper `demarrage.html` (939 lignes) ; requalifier le lot « pluie » (la collecte horaire existe) ; mesurer l’audience de `essai.html` et de la démo ; mesurer l’ouverture des fiches « i » ; une passe Lighthouse ; Google Play (TWA) à partir de 5 clients.
- **Écarté pour l’instant** : le registre d’entrées-sorties et la DRM (décision de Nico du 04/10 : « je ne veux pas de réglementaire »).

- **Le rendement hors vins tranquilles** : le jour d’un client en Champagne (kg/ha) ou en eaux-de-vie (hL d’alcool pur par hectare), une unité régionale du rendement (HLHA-1, §413).

#### 6. Commercial et juridique
- **Le prospect de Gironde (Château Garraud)** : le devis sur la nouvelle grille (l’offre de lancement est bornée depuis le 14/08) ; le DPA signé avant les comptes salariés ; le slug enregistré avant `onboardTenant` ; le recalibrage du barème (densité girondine) ; trois questions au contact technique.
- **Les chiffres du gain de temps** : aligner les trois (la démo 127 h, la plaquette 215 h/an pour 10 ha, l’oral 3 à 5 h/mois) et faire signer à Nico les trois estimations neuves ; regarder les 19 moments de la visite en vrai.
- **Divers** : vérifier les empreintes de `_mv_signatures` ; l’indexation Search Console ; les posts LinkedIn n° 4 et suivants (douze angles prêts).
- **Juridique** : les durées de conservation ; les sous-traitants à publier (Google Ireland, SMTP) ; une relecture par un juriste ; les deux gabarits restants de `dpa.html` ; la relecture trimestrielle des pages publiques (et des écrans) ; « Ma Vigne produit un relevé d’heures, pas un bulletin de paie » dans le guide et les CGU ; la page de confidentialité doit parler des jalons et du compteur d’ouvertures (JALONS).

#### Rayé le 21/10 — fait ou dépassé
Le 22/10 : le panneau du tuto côte à côte et le « + » des boutons d’ajout (COTE-1, §424).
Les absences d’« À savoir » au masculin (VIF-1, §414 ; l’élision et la tuile Effectif : ANTICIPE-1, §420) ; Le crayon de la priorité de l’Accueil, toujours caché (PRIO-1) : « Modifier » sur la carte du jour (ACCV-1, §416) ; Le contrôle du contraste à écrire (il existe : `mv-harnais-contraste`) ; l’interrupteur `.val-toggle` trop bas (sans emploi) ; la passe d’audit écran par écran promise le 03/10 (faite : la revue complète, §406-§410) ; regarder Simuler et la Cave, et les huit boutons de type (vus à la revue) ; la masse salariale et les bureaux (`avecBureau` est en place) ; la mise à jour du service worker au moment choisi (MAJ-1, MAJ-2) ; les harnais jamais joués sous Windows (la chaîne tourne chez Nico) ; ESLint et un navigateur côté Claude (joués depuis AIDE-1, §365) ; la migration `_PIL_ST_V`, les téléphones à passer en 8.94, `MV_FORMAT` 2 (passés) ; le plan GRATIF et l’alignement (faits) ; la chip de cuvée sans espace (non retrouvée) ; l’entrée « 14ᵉ moment » (périmée) ; l’offre de lancement (bornée). Les décisions consignées (GRATIF-0, ERGO-0, AUDIT-PERF, limites assumées des lots) restent lisibles à l’archive.

### ★ RANGEMENT PILOTAGE & CAVE (23/10, §439) — l’ordre des lots, validé par Nico
Maquettes validées (`maquette-pilotage-range-v1.html`, `maquette-cave-rangee-v1.html`, hors dépôt) et rapport `audit-pilotage-cave-2026-10-23.md`. Arbitrages pris : L’année supprimée (budget → Économie, renfort → Équipe, cadre → portée) ; donut + « où va le temps » fusionnés ; Archives en bout de barre ; fiche de cuvée unique à côté de la liste ; Diagnostic gardé en onglet.
- ~~PIL-RANGE-1b~~ — **fait (§441, 23/10)** : l’ancien Aujourd’hui retiré (41 fonctions ; `cockpit.js` gardé pour ses lectures du v2), la carte du tracteur relogée dans Matériel, 27 harnais migrés, `auj4` supprimé. Reste : purger le CSS de l’ancien écran.
- ~~PIL-FIX-1~~ — **fait (§440, 23/10)** : les jours ouvrés sur le planning, fériés retirés, retard symétrique.
- **PIL-RANGE-2** — portée unique campagne · année vigne · exercice ; L’année retirée (`_PIL_TAB_MIGR` `an` → `eco`) ; aide, guide 11, visite guidée.
- **PIL-RANGE-3** — Travaux 6 → 4 cartes ; Équipe : présence + capacité en une carte, renfort venu de L’année.
- **PIL-RANGE-4** — Économie : Exercice → portée, 6 → 5 sous-vues ; « Afficher dans cet onglet » d’Aujourd’hui réduit aux cartes du cockpit v2 et branché dessus (17 cases sur 21 sont mortes aujourd’hui).
- **CAVE-FIX-1** — part des anges annualisée (`_pcavAnges` : `pctAn` × 365 / jours couverts, ou libellé « sur la période »), `MV_INFO` `cave.anges`.
- **CAVE-RANGE-1 à 3** — portée millésime (remplace `_caveMillFilter` et `_mlMil`) ; fiche de cuvée unique (Élevage · Volumes & origine · Analyses · Diagnostic) ouverte depuis toute liste ; Courbes → Cuvier › Cuves (mode Liste · Courbes), Le Millésime à deux onglets (Ensemble · Parcelles).
- Restent à jouer avant ces lots : le renfort (photo d’Équipe = chiffrage de Décider sur la même semaine), `_pecCadPresence` face aux journées de cave (JCAVE-1), `_mlChaine` à deux cuves.

### ★ CAVEAUJ (22-23/10, §434-435) — Cave › Aujourd’hui : ce qui reste
- **Fait** — CAVEAUJ-1 (§434) et CAVEAUJ-2 (§435) : la maquette validée (`maquette-cave-aujourdhui.html`, v2, hors dépôt) est intégrée en entier ; la question de l’ouillage un dimanche ou un férié est tranchée par Nico (23/10) et appliquée (`_mlJourOuvre`).
- **Dette** — la règle « collée si elle tient dans l’écran » existe en deux copies : `_accColle` (app.js, Accueil) et `_aujColle` (cave.js) ; à remonter dans utils.js en une seule fonction.
- **Hors chantier, à regarder** — le Diagnostic dit « malo non démarrée » pour le Gevrey VV ’25 de la démo alors que Le Chai dit la FML faite (il ne lit pas `fml_terminee`), et le Gevrey y apparaît deux fois.
- **Vu en route, hors lot** — la contre-épreuve de `mv-harnais-jetons` (« un cercle est converti en jeton ») ne mord plus : déjà vrai sur la base `fdacae3`, elle n’est pas dans la chaîne (seul le mode normal y est).
- **À vérifier chez Nico** — Cave › Aujourd’hui sur un vrai téléphone et sur son PC : la colonne « À surveiller » qui suit au défilement, les tableaux du Cuvier et du Chai, un ouillage du week-end rappelé le vendredi.

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
