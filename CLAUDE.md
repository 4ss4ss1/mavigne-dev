# Ma Vigne — Instructions personnalisées

> Document de référence du projet **Ma Vigne** (GUERETTECH). Il est le **porteur de vérité** :
> la mémoire Claude est plafonnée, ce fichier ne l'est pas.
> Dernière consolidation : **9 août 2026 (nuit)** — reprise de la consolidation du 9 août soir,
> augmentée de la **troisième** partie de la journée : après l'écart de cadence (matin) et
> l'accompagnement du client (après-midi), la **réduction du temps d'installation** (soir),
> cinq lots plus une procédure imprimable.
> Consolidations précédentes : 9 août soir · 7 août soir (série MILLÉSIME) · 7 août matin
> (série Cave) · 5 août (mvprint retrouvé) · 4 août soir (barème) · 1er août (UX-1) ·
> 31 juillet (identité légale).
> ★ **Note ajoutée le 10 août** (règle d'or n°1 et §29) : une régénération de ce document faite
> de mémoire, sans l'avoir sous les yeux, s'est révélée **en retard d'un chantier entier**.
> La procédure de régénération est désormais écrite noir sur blanc.
> ★★★ **Note ajoutée le 10 août (fin de journée) — ACCÈS DIRECT AU DÉPÔT GITHUB.** Le code
> source vit désormais dans un dépôt **public**, `github.com/4ss4ss1/mavigne-dev`, cloné par
> Claude en tête de session. **Ceci remplace, pour la LECTURE, le workflow d'upload décrit en
> Règle d'or n°1** — Claude n'attend plus un upload pour lire un fichier de l'app. **La LIVRAISON
> ne change pas** : fichiers complets via `present_files`, réintégrés à la main par Nico dans
> `mavigne-dev\`, committés et poussés via **GitHub Desktop**. Détail complet : Règle d'or n°1 et
> « 🖥️ Environnement de Nico › Git ».
>
> ⚠️ **Points en suspens au moment de la consolidation** :
> 1. **Cinq lots livrés et NON DÉPLOYÉS** (§18b) : `admin-gt.js`, `firebase.js`,
>    `functions/leads.js`, `public/mise-en-route.html`.
> 2. **Une installation à blanc** sur un slug jetable reste à faire — elle valide les cinq lots
>    d'un coup et mesure les temps réels (§18b, §28).
> 3. La réponse à Château Garraud reste le sujet commercial n°1 (§28).
> 4. ⚠️ **Des lots restent non documentés ici**, connus par le seul changelog de `sw.js` :
>    « panneau GUERETTECH : 8 onglets deviennent 6 », « SEC-GT/2 », la **tournée sur l'écran de
>    l'équipe », l'**exercice comptable**, les **4 défauts de la snapshot localStorage**, le **Chai
>    qui s'ouvrait vide**, le **soutirage à source unique**, le **Cuvier repeint**, le **hub
>    Documents** et la **charte `MV_DOC`**. **À consigner par Nico.**
> 5. ⚠️ **`rewrites` est absent du `firebase.json` lu** alors qu'`essai.html` poste vers
>    `/api/lead` — à vérifier en ligne (§18b).

---

## ⚖️ Les quatre règles d'or

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
| ★★★ **« il n'y a pas d'assistant d'installation »** | **`_agtIns` EXISTAIT et avait servi pour Chapelle** (§18b) |
| ★★ **« l'import KML n'écrit QUE les polygones »** | vrai de l'**onglet KML**, FAUX de l'**assistant** |

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
| **Section du guide public** | `guide/<section>.md` → `npm run build:guide` | dès qu'une fonctionnalité décrite change |
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

Détail des trois supports et de leur mécanique : **§27a** (la règle longue), **§27b** (`MV_AIDE`),
**§27d** (le guide découpé).

---

## 🖥️ Environnement de Nico

- ★★★ **Git, depuis le 10 août — via GitHub Desktop.** Dépôt `4ss4ss1/mavigne-dev` (**public** —
  nécessaire au clone anonyme de Claude), cloné dans
  `C:\Users\p4n0m\Desktop\Applications\mavigne-dev\` (dossier **distinct** de l'ancien `mavigne\`,
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
  `gueret.nicolas@gmail.com` = admin Marchand-Grillot (`adm:true`). Toute procédure GT (backfill,
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
Livraison = **fichiers complets** via `present_files`, **jamais** d'instructions de patch manuel.
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
20 h pour installer Chapelle, 40 vendangeurs sur 10 jours, **14 h de clavier sur les 20**), c'est
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
  - **Domaine Marchand-Grillot** — 45 parcelles + Chazière « Arrachée », ~11,76 ha, tenant de
    référence/dev. Adresses fictives en **`prenom.marchand-grillot@mavigne.app`**.
  - **SCEA PH Chapelle & Fils** (slug `domaine-chapelle-et-fils`, réf. MV-2026-9024) —
    Alexandre Chapelle (chef de culture, opérationnel), **Simon Chapelle** (gérant, signataire et
    destinataire des factures), ~18 ha, 100 % bio, multi-communes. CGU v1.1 + DPA v1.0 acceptés en
    app le 18/07/2026. ✅ **CONVERTI ET FACTURÉ** le 03/08/2026.
    ⚠️ Adresses fictives en **`prenom.domainechapelle@mavigneapp.fr`** — **ni le slug, ni le même
    domaine de messagerie que MG** (§18b).
- ★★ **Prospect entrant : Château Garraud** (Lalande-de-Pomerol, Gironde) — **premier lead hors
  réseau personnel**, arrivé le 04/08 par le formulaire d'essai du site. 45 ha en conventionnel,
  40 parcelles multi-communes, 12 permanents + saisonniers, 6 machines, 4 cuvées.
  ⚠️ **Barrique bordelaise : 225 L**, pas 228 (§18b).
- ⚠️ **Pas d'auto-onboarding client.** Nico installe lui-même chaque domaine. La série du 09/08
  réduit **son temps**, pas sa présence.
- ⚠️ **Aucun tâcheron** aujourd'hui, ni chez MG ni chez Chapelle (§30f).
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
| **Pilotage** | **7 onglets** : Aujourd'hui, Avancement, **Décider**, Équipe, **Cave**, **Économie**, **Conformité** (+ Outils : Archives, Paramétrage) |
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
│   ├── cave.js             (Chai + Cuvier + Le millésime + registre + bilan de campagne
│   │                        + le moteur MILLÉSIME : _copMil*, _caveSeuilOu, _mlProjMalo)
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
`styles.css → utils → firebase → onboarding → admin-gt → cave → planning → reglages → **tracteur**
→ phyto → pilotage → **reserve**`.
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
| **0 — preflight** | `npm run check` (auto `prebuild`) | **C1 → C22** : statique + invariants anti-perte **exécutés** |
| **1 — smoke** | `npm run test:smoke` | l'app **boote** sans exception + 23 globals |
| **2 — E2E local (DÉFAUT)** | `npm run test:e2e` | **login DOM réel + 10 pages + interactions** |
| **2bis — E2E émulateurs** | `npm run test:e2e:emu` | + couche Firestore réelle — **BLOQUÉ SDK** |

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

**Projeté — rôle `pilotage` (`pil:true`)** : lecture étendue y compris `paie`, **aucune écriture**.
**Deux arbitrages avant** : `paie` complet ou `paie_agg` agrégé ; inscription au registre art. 30.

---

## 9. Sauvegardes, monitoring & ★★ journal des erreurs

- **Export Firestore natif quotidien** (2 h Paris) → `gs://…/backups/firestore/DATE`, rétention 7 j.
- **Backup JSON par tenant quotidien** (3 h), rétention 30 j.
- ⚠️ **Piège IAM** : rôle `datastore.importExportAdmin` requis sur le service account.
- **Alertes log-based GCP** (severity ≥ ERROR) → `ngdevpro@gmail.com`.
- **Filet côté Nico** : `xcopy` + **historique Firebase Hosting** + (depuis le 10/08) **l'historique
  Git du dépôt** `4ss4ss1/mavigne-dev`.

### ★★★ Le journal des erreurs — rebranché le 26/07/2026

**Le plus gros bug silencieux de l'histoire du projet.** `logError` écrivait dans
`_guerettech/errors_…`, réservée au compte GT par les rules → **chaque erreur client était refusée
depuis la mise en service**, et le refus était avalé par un `catch{}` vide.

Le plus frustrant : **`window.fbAppendError` existait déjà**, écrivait au bon endroit
(`mavigne_{slug}/error_log`), était **déjà autorisé** et **déjà lu**.

**Correctif** : `logError` route vers `fbAppendError` pour `critical` + `error` + `warning` ;
`info` reste **strictement local** ; **anti-doublon 10 min** ; **plafond 20 envois par session**.

⚠️ **Limite assumée** : un compte `ro:true` ne peut pas écrire → ses erreurs restent locales.
⚠️ **Leçon générale** : quand un mécanisme « ne remonte rien », vérifier **d'abord qu'il écrit au bon
endroit et que les rules l'autorisent**.
★ **Les exports de documents l'utilisent** ; ★★ **les replis du Pilotage aussi** (`_pcavLog` trace
en `info` chaque moteur de Cave qui lève).
★★★ **Et depuis le 09/08, les chemins de navigation muets aussi.** Quand la visite guidée ne trouve
pas son onglet, elle le **trace** au lieu de ne rien faire. **Un repli muet cache une régression :
c'est la leçon la plus chère du chantier accompagnement.**
★ **Même principe côté GT** : un géocodage de commune indisponible, une lecture de saisons refusée,
une écriture de machines en échec — chacun trace en `info` et **le dit à l'écran**, sans faire
échouer l'installation (§18b).

---

## 10-11. Modèle de données

- Racine : `mavigne_{slug}/…` — **26 collections**, déclarées dans `COLLECTIONS` (`firebase.js`).
- Chaque clé doit appartenir à **`FB_REALTIME`** (12 clés) **ou** à **`FB_STATIC`** (14 clés).
  **12 + 14 = 26 : couverture complète, invariant C12 satisfait**.

| | Clés |
|---|---|
| **FB_REALTIME** | `parcelles` · `journal` · `sessions` · `traitements` · `reparateur` · `reparateur_hist` · `entretiens` · `planning_templates` · `planning_entries` · `planning_acomptes` · `planning_hsup` · `intrants` |
| **FB_STATIC** | `travaux` · `catalogue` · `conducteurs` · `activites` · `membres` · `saisons` · `taches` · `config` · `historique` · `tracteurs_list` · `cave_elevage` · `cave_vendange` · `kml_polygons` · `paie` |

⚠️ **Piège d'audit** : un extracteur naïf trouve **27** clés — la 27ᵉ est le mot `'info'` d'un
**commentaire**. Faux positif rencontré **deux fois**. `COLLECTIONS` est un **tableau**.

★★ **Règle confirmée sur toute la série Cave, la série MILLÉSIME, le chantier accompagnement ET la
série installation : une fonctionnalité nouvelle n'a presque jamais besoin d'une collection
nouvelle.** Le registre des mouvements de fûts est **une clé de plus dans `intrants`**. Le seuil par
millésime est **une clé de plus dans `cave_elevage.config`**. L'acide malique est **un champ de
plus**. ★★ **Et les réponses du formulaire de mise en route sont une clé `mer` de plus dans le
document `leads` du prospect** — aucune collection, **donc aucune règle Firestore à déployer**
(§18b). Le registre, le bilan, les fiches d'aide, le guide et le widget « Mise en route » n'écrivent
**rien du tout**.
**Zéro invariant C12/C13 touché sur l'ensemble.**

- ⚠️ **Tableaux imbriqués INTERDITS dans Firestore** : stocker en `{lat,lng}` et reconvertir en
  `[lat,lng]` dans le wrapper `applyFbData`.
- **Helpers clés** : `showToast` · `refreshMapColors`/`pctColor` · `saveData(keyHint)` ·
  `fbDoc`/`fbSave` · `_escHtml` · `_retryAsync` · `_sessDates` · `_dockBuild`/`_dockSync`/`_goLanding`
  · `_saisonObj`/`_saisonForDate`/`_saisonTaches`/`_switchSaison` ·
  `_plan`/`_trialStatus`/`_canModule`/`_mvTrialBanner`/`_mvCheckExpired` · `openAide`/`_mvInjectHelpBtn`
  · `_mvAideEnum`/`_mvAideNb`/`_mvAideOngletsDom`/`_mvAideSections`/`_mvAideOngletsPil` (§27b)
  · `logError`/`fbAppendError` · `_mvPartCalc`/`_mvTraceData`/`_mvMurData`/`_mvCompTxt` (§22b)
  · `openConfirmDel`/`_execConfirmDel` et `openPrompt`/`_execPrompt` (§22c)
  · `_mvContratFini`/`_mvEnContratLe`/**`_mvEnContratSurPeriode`** (§19)
  · `_mvEstCollectif`/`_mvEffDef`/`_mvPoidsNom` (§19)
  · **`_mvNivH`** (§16b) · **`_mvPiedsHa`/`_mvVigne`/`_mvDensCoef`/`_mvHhaDens`**
  · **`_mvBaremeActif`/`_mvBaremeRef`** (`app.js`)
  · **`_mvParcGeo`/`_mvKmlCtrs`** (`utils.js`)
  · **`_phytoCsvRows`/`_phytoExportCsv`** (§17)
  · **`_mvCampagneDe`** (§11c) · **le moteur `_mvFut*`** (§20e)
  · **`_caveSeuilOu`** · **`_mlProjMalo`/`_mlMesMalo`** (§20h)
  · `_dmrEtapes`/`_dmrConseils`/`window._dmrGo`/`renderHomeDemarrage` (§27c)
  · ★ **`createAuthAccount(email, pwd, {roles, tenant})`** (`firebase.js`) — le `tenant` explicite
    est ce qui permet à GT de créer un compte pour un domaine qui n'est pas le sien (§18b).
- **Persister via `fbSave`**, jamais `fbDoc` directement.
- ⚠️ **En mode GT admin**, `window.CONFIG`/`PARCELLES` sont vides.

**★ Clés de `config` notables** — le doc `config` s'écrit **toujours complet** :
- `mur_mot` = `{txt, par, date}` (admin only) · `mur_visible` = `'equipe'` ou `'admin'`
- `home_layout` / `home_layout_default`
- `cp_mode` · `hsup_dues_debut` · `tachesPrio` · `features.*` · `saison_passages`
- **`vigne` = `{ ec_rang, ec_pied }`** — écartements de plantation (§30)
- **`bareme`** — clé du jeu régional actif (§30), repli `'cote-nuits'`
- **`siret`** et **`bio`** — identité de l'EXPLOITATION (§17 ; Réglages › Domaine)
  ★ **Tous deux peuvent désormais être posés à l'installation**, repris du formulaire (§18b).
- **`domaine_nom`** — le nom affiché (`window.DOMAINE_NOM`)
- `cadre_legal` — durées légales affichées — ⚠️ existe DÉJÀ, ne pas le doubler (§30h)
- `eco.*` — `k_retard`, `trac_etp`, `kg_bouteille`, `h_jour` (whitelist `_ecoCfgSet` —
  **toute nouvelle hypothèse doit y être ajoutée**, sinon rejetée en silence)
- **`cave.fut_l`** (défaut 228 L) · **`cave.futs_vie`** (défaut 5) · **`cave.fut_prix`**
  (**facultatif** — sans lui le plan de renouvellement s'exprime en nombre de fûts, jamais en euros
  inventés). ★ `fut_l` est posable à l'installation ; **ne rien choisir RETIRE la clé** au lieu
  d'écrire 228 en dur, pour que le défaut de l'application continue de s'appliquer (§18b).
- **`ordre_passage_t`** — la tournée PAR TÂCHE (⚠️ l'ancien `ordre_passage` n'était lu par personne)

**★★ Clés de `cave_elevage.config`** :
- `ouillage_alerte_j` — le **seuil général** du domaine (défaut 14)
- ★★ **`ouillage_par_mil`** = `{ '2026':7, '2025':14 }` — **le seuil PAR MILLÉSIME**.
  ⚠️ **Rétro-compatible par construction** : une clé absente retombe sur `ouillage_alerte_j`.
  Bornes **3 à 30 jours**, admin only.
  **Ne JAMAIS lire cette clé directement : passer par `_caveSeuilOu` (§20h).**

**★★ Champs d'une opération d'analyse** (`cave_elevage.operations[].data`) :
`so2_libre` · `so2_total` · `av` · ★★ **`malique`** (g/L) · `fml` ∈ `'none'|'cours'|'ok'` ·
`fml_date` · `pdf_url`.

### Couverture de synchronisation et gardes

**INVARIANT (C12)** : une clé absente des deux listes n'est lue **qu'au boot** → deux appareils
divergent en silence et le dernier `fbSave` écrase l'autre, **sans toast et sans trace**.

- `intrants` → **temps réel** (lisible par tout membre, seule l'*écriture* est admin-only).
- `paie` → **pull seulement** : seul doc admin-only **en lecture** ; un `onSnapshot` posé par un
  non-admin serait refusé et Firestore **détacherait** le listener.

⚠️ Être dans `FB_STATIC` ne met **pas** `paie` dans `_initData` ni dans la snapshot `localStorage` →
**les rémunérations ne descendent jamais sur le disque. Contrôlé par C21.**

**`_MV_GUARD_FLOORS` — 22 planchers** :
```
parcelles 5 · membres 2 · saisons 1 · config 3 · journal 5 · sessions 5
cave_elevage 1 · cave_vendange 1 · tracteurs_list 2 · conducteurs 2 · activites 2
planning_entries 2 · planning_templates 1 · planning_acomptes 1 · planning_hsup 1
traitements 5 · intrants 3 · paie 2 · taches 5 · entretiens 5 · historique 5 · reparateur_hist 2
```
Le garde ne se déclenche que sur une **chute de plus de moitié en une seule écriture**.
**Non gardées volontairement** : `travaux` (dérivé) et `kml_polygons` (REPLACE assumé).
⚠️ Ces gardes protègent le chemin CLIENT (`saveData`/`fbSave`). **Le chemin GT (`fbAdminWrite`) ne
les traverse pas** — c'est voulu (installation, import KML), et c'est pourquoi l'assistant pose ses
propres gardes avant d'écrire (§18b).

⚠️ **`intrants` et `paie` sont des conteneurs à clés fixes** → `Object.keys()` y renvoie une
**constante** → deux compteurs de **contenu** : **`_mvIntrantsCount`** et **`_mvPaieCount`**.
★ ⚠️ **`fut_mouv` grossit indéfiniment** : c'est un journal, jamais purgé. Le rendu n'en montre que
**40 lignes** puis un compteur.

---

## 11b. Anti-perte — les trois couches

- **Couche 1 — Planchers `_MV_GUARD_FLOORS`** : refus d'écriture si le compte chute de plus de
  moitié sous le plancher. `_saveParcellesMerged` est transactionnel.
- **Couche 2 — Verrou de chargement** (`app.js`, 12 occurrences) : `_mvKeyLoaded[key]` posé dans
  `applyFbData` ; `saveData` refuse `parcelles`/`membres`/`saisons` tant que la clé n'a pas été lue.
  ★ S'applique à **TOUS LES TENANTS**.
  ⚠️ **Échappatoire `_mvKeySeen`, obligatoire** : sans elle, un domaine dont le doc vaut `[]`
  n'aurait **jamais** pu créer son premier membre. Posée **avant tout filtre**.
  ⚠️ **Le garde-fou était muet** : il traçait via `if(window.DEBUG)` — or **`window.DEBUG` n'est
  défini nulle part**. Remplacé par un `logError` en `warning`.
- **Couche 3 — File offline** + **backup JSON quotidien**, rétention 30 j.
  ⚠️ **La snapshot localStorage a été durcie le 05/08** (écriture groupée 2 s, `_MV_BK_MAX=3`,
  QuotaExceededError tracé) — ⚠️ **`_mvSnapCancel()` doit être appelé AVANT toute purge de
  `LS_KEY`**.

---

## 11c. ★★ L'axe campagne — une source unique de plus

**Du 1ᵉʳ août au 31 juillet, de récolte à récolte.** Une date appartient à la campagne ouverte le
1ᵉʳ août qui la précède.

**`window._mvCampagneDe(iso)` vit dans `utils.js`.** C'est la **source unique**.
**Non-régression prouvée : zéro écart sur 360 dates de 2020 à 2030.**

⚠️⚠️ **CONTRE-EXEMPLE : l'axe campagne n'est PAS le bon axe pour l'âge d'un fût.**
Un fût acheté en 2023 est un fût de **trois vins** en août 2026, et de **quatre** en janvier 2027.
**La convention retenue est `annee_civile − annee_achat`, « neuf » à zéro.**

⚠️⚠️⚠️ **DEUXIÈME CONTRE-EXEMPLE : l'axe campagne n'est pas non plus le bon axe pour le VIN.**
Une campagne contient **deux millésimes**. **Le registre et les manipulations raisonnent en
MILLÉSIME (§20h).**

**Les quatre axes, et ce que chacun décrit :**

| Axe | Décrit | Qui l'utilise |
|---|---|---|
| **Période** (dates libres) | une phase de travail | avancement, charge, `p.taches` |
| **Campagne** (1er août → 31 juillet) | une année de travail | Archives, vigne, protection, part des anges |
| **Millésime** (année civile de vendange) | un vin | récolte, flux, chai, manipulations, ouillage, malo |
| **Année civile** | l'âge d'un contenant | pyramide des fûts, mouvements |

★★ **Leçon générale : avoir une source unique ne dispense pas de se demander si c'est le bon AXE
pour CE calcul-là.**

---

## 12. Navigation & dock

- **Dock bas** unifié, construit par `_dockBuild`/`_dockSync`, atterrissage par `_landingPage`
  (**recalculé dynamiquement**, jamais `home` en dur).

★★ **LA LIGNE EN PLACE** (`app.js`, `_dockBuild`, occurrence unique) :
```js
if(pc || items.length<=5){ main=items; ov=[]; } else { main=items.slice(0,4); ov=items.slice(4); }
```
**Histoire** : le lot du 1er août avait été **perdu** (fichiers livrés, jamais intégrés).
**Rejoué le 4 au matin**, confirmé par trois audits.
⚠️ Les deux changements (`slice(0,3)→slice(0,4)` **et** garde `<=4→<=5`) restent **indissociables**.

★ **Répartition MESURÉE** sur **9 profils réels** :

| Profil | Avant | Après |
|---|---|---|
| Domaine · admin (8 items) | 3 + Plus(5) | **4 + Plus(4)** — Phyto remonte |
| Domaine · ouvrier (7) | 3 + Plus(4) | **4 + Plus(3)** — Cave remonte |
| Domaine · ouvrier, Cave décochée (6) | 3 + Plus(3) | **4 + Plus(2)** |
| **Domaine réduit à 5 modules** | 3 + Plus(2) | **5 cases, aucun bouton « Plus »** |
| Vigneron · admin / ouvrier (4) | 4, aucun Plus | inchangé |
| Essentiel (2) · Ordinateur (≥ 768 px, `pc=true`) | — | inchangé |

⚠️⚠️ **Vigneron = 4 modules** (Vigne, Tracteur, Phyto, Réglages). **12 invariants vérifiés**.
⚠️ **Aucune modification CSS nécessaire** : `.mv-dk` est en `flex:1`.
⚠️ **`_dockDef()` n'est PAS exposée sur `window`.** Ne pas l'appeler depuis un test.

- Le toast de `goTo` distingue le blocage **par formule** du blocage **par membre**.
- **Hub et sidebar : purgés.**
- ★ **Navigation unifiée** : 9 systèmes d'onglets → **1 seul `.mvu-tabs`**.
- ★ **En-têtes : les 10 modules partagent `.mod-header`.** `_mvMetaSync()` et `_mvInjectHelpBtn()`
  ne ciblent que `.mod-header .mod-meta-row`.
- ⚠️ **Les onglets doivent rester DANS `.mod-header`**.
- **`.mvu-sub`** = peau des onglets de **second** niveau.
- **Overlays empilés** : `openOv(id)` pose un `z-index` = max des `.overlay.open` + 1 (base 600).
  ★ La feuille de restitution (§22b) vit **hors** de ce système, en `position:fixed` z-index **2400**.

★★ **Le patron des sous-onglets délégués** (`pilotage.js`) — à réutiliser :
un conteneur avec des `<button data-s="…">`, et **un seul écouteur délégué** qui fait
`e.target.closest(…)`. ★ **Pour un second niveau dans le même panneau**, tester le sélecteur le plus
spécifique **AVANT** et faire `e.stopPropagation()`.

★★ **Widgets d'accueil** (`HOME_WIDGETS`, `HOME_NEW_TOP`, `HOME_PINNED`, `applyHomeLayout`) : la
structure de chaque widget vit **dans `index.html`** (`<div class="home-w" data-w="…">`), le JS ne
fait que la remplir et la réordonner. Ajouter un widget = **un bloc dans `index.html` + une entrée
dans les deux tableaux + une fonction de rendu appelée depuis `renderHome`**, sous `try/catch` comme
les autres. ⚠️ `HOME_NEW_TOP` fait un `unshift` : c'est ce qui met un widget neuf **en tête** chez
ceux qui ont déjà personnalisé leur accueil, où la règle générale l'aurait mis en queue, invisible.

---

## 13. Parcelles, carte & KML

- Polygones Leaflet colorés dynamiquement par l'avancement (`refreshMapColors`/`pctColor`).
- ⚠️⚠️ **Les parcelles ne portent PAS de coordonnées.** Toute fonctionnalité géographique passe par
  le **centroïde du polygone homonyme** — résolveur central **`_mvParcGeo` / `_mvKmlCtrs`** dans
  `utils.js`.
- ★★★ **DEUX CHEMINS D'IMPORT KML, À NE PLUS CONFONDRE** (correction du 09/08) :
  1. **L'onglet KML du panneau GT** (`_parseKML`, `agtKmlSave`) — prévisualisation puis écriture de
     `kml_polygons` **seulement**. C'est un **REPLACE assumé**. Il ne crée aucune parcelle.
  2. ★★ **L'assistant d'installation** (`_agtIns`, §18b) — il **CRÉE les parcelles** depuis le même
     fichier, avec leurs surfaces calculées sur le contour, **et** écrit `kml_polygons`.
     **Les deux sortent du MÊME tableau `_agtIns.parc`** : le nom corrigé à l'écran atterrit des
     deux côtés, donc le rattachement par `nom.toLowerCase()` ne peut pas diverger.
  ⚠️ **L'ancienne affirmation « l'import KML n'écrit QUE les polygones » ne vaut que pour le cas 1.**
- ★★ **Renommer une parcelle : la règle s'inverse selon le moment.**
  - **Sur un domaine vivant** : `p.nom` est la clé du journal, des sessions et des traitements →
    on renomme **dans le KML**, jamais dans l'app.
  - **À l'installation** : il n'y a **aucun historique à casser** → on renomme **dans l'écran**,
    avant écriture. C'est même le seul moment où c'est sûr (§18b).
- **Surface totale recalculée** dynamiquement (`_recalcSurfTotale`). ⚠️ 32 sommes encore à la main.
- ★ **`p.arrachee`** sort une parcelle de la surface exploitée.
- **Complantation** (pilotée par les trous, `plantation_trous`) ≠ **Plantation** (tâche
  complémentaire, parcelle neuve).
- ★ **La DENSITÉ de plantation doit devenir une propriété de la PARCELLE** (`ec_rang`/`ec_pied`),
  `CONFIG.vigne` n'étant que le défaut du domaine. À traiter avec « import KML en MERGE » (§28).
- ⚠️ Un futur ré-import devra faire un **MERGE** pour préserver `p.commune`, `p.plantation_trous`,
  `p.entreplantation`, `p.tachesAll`, `p.rendement_hist` et ★ `p.rdt_max`.
- ★★ **Outil hors dépôt : `comparateur-kml-parcelles.html`** (v3, 06/07) — parse un KML, calcule les
  surfaces, classe en cinq groupes, apparie les orphelins par distance d'édition, régénère un KML
  corrigé. ⚠️ **Depuis le 09/08, il ne sert plus À L'INSTALLATION** (l'assistant fait l'alignement),
  mais il reste l'outil du **ré-import sur un domaine vivant**. Sa copie doit vivre dans
  `..\mavigne-sauvegardes\`.

## 13b. Géocodage BAN

`api-adresse.data.gouv.fr`, **runtime navigateur**, sans clé, **France uniquement**.
Précédence météo : centroïde parcelle > commune affectée > domaine.
★ **Le département vient donc du géocodage déjà fait** : zéro question supplémentaire à
l'installation pour connaître la région d'un domaine (§30c).
★★ **À l'installation, un appel PAR COMMUNE DISTINCTE, jamais par parcelle** (§18b) : quarante
parcelles sur trois communes font trois appels. Sans coordonnées, la parcelle garde le **nom** de sa
commune — l'étiquette reste juste, seul le repère de secteur manque.

---

## 14. Cloud Functions (`europe-west1`, Node 22)

- **`claims.js`** — `createMemberAccount` · `updateMemberRoles` · trio SEC-2 · `acceptTerms` ·
  `getLoginRoster` (**renvoie toujours `roles`** — backlog) · `gtLastConnections` ·
  `gtSetTenantPlan` · `gtBackfillClaims` · `onboardTenant` · `deleteTenant` · SEC-GT/2
  (`gtRequestOtp`, `gtVerifyOtp`, `gtEndSession`).
  ⚠️ Contient aussi le **pied de signature** des mails de confirmation (§26c).
  ⚠️ `sha256Url()` va chercher la page juridique **en ligne** au moment de la signature (§26b).
  ★★ **`createMemberAccount` accepte DÉJÀ un appelant GT avec un `tenant` explicite**
  (`if (isGt) target = tenant || null;`) — c'est ce qui a permis de faire la création de comptes en
  lot **sans aucun changement backend** (§18b).
  ★★ **`onboardTenant` accepte en une seule fois** `{slug, email, password?, adminNom?, membres,
  parcelles, saisons, taches, config}` et écrit chaque clé par l'Admin SDK. Le mot de passe est
  facultatif pour un appel GT : il est généré, renvoyé **une fois**, stocké nulle part.
  ⚠️ Gardes : App Check, le slug doit être déclaré **avant** dans `_guerettech/tenants`, et refus si
  `mavigne_<slug>/membres` existe déjà — **l'installation ne se rejoue pas**.
- **`index.js`** — backups. **`ephy.js`** — sync hebdo E-Phy ANSES.
- ★★ **`leads.js`** — `submitLead` (formulaire d'essai) **et `submitMiseEnRoute`** (§18b, §27f).
- Extension **« Trigger Email from Firestore »** (⚠️ Firestore Instance Location = **eur3**).
- **Suppression de tenant** : double verrou, `marchand-grillot` protégé en dur.
- ⚠️ `gtBackfillClaims` ne parcourt **que** les slugs de `_guerettech/tenants`. Appeler **toujours**
  avec `{ timeout: 300000 }`.
  ★ **Son rapport est un OUTIL DE DIAGNOSTIC** : chaque ligne montre les claims finaux et le
  suffixe `(inchangé)`. Le 09/08, il a prouvé en une commande que **les 28 comptes existants avaient
  tous le bon `tenant`** — donc que le défaut de `createAuthAccount` ne s'était jamais déclenché.
- ★ **Lecture d'un doc brut** : `window.fbAdminRead(slug, key)` en fenêtre privée ngdevpro renvoie
  `.value` **sans passer par aucune normalisation** — indispensable pour auditer `taches` (§30d),
  et utilisé par l'assistant pour lire les membres et les saisons d'un domaine existant.
- ⚠️ **Avant `onboardTenant` pour un nouveau client** : enregistrer le slug dans
  `_guerettech/tenants`, sinon le serveur refuse. ★ L'assistant le fait lui-même, en première étape.

## 14b. Formules, essai, gating

- Claims `plan` + `trial_until` → `_plan()`, `_trialStatus()`, `_canModule()`, `_mvTrialBanner()`,
  `_mvCheckExpired()`, `_openEmailModal()`. **Défaut `plan='domaine'`**.
- Fiche client GT, `_FC_GUARD_FLOOR = 0.25`. ⚠️ **Le panneau GT est passé de 8 à 6 onglets le
  06/08** — changement repéré au changelog, **non documenté ici**.
- ⚠️ **Vérifier `trial_until` avant toute promesse commerciale.**

## 14c. ★ L'écran d'accueil public

**Le problème.** `_fbLoad` routait tout visiteur sans tenant vers `showOnboarding()` → un prospect
tombait sur un assistant « Configuration initiale » **qui ne pouvait jamais aboutir**.

**La solution** (`firebase.js` + `onboarding.js`, **aucun bump**) : un écran construit dans l'écran
de connexion **qui existe déjà**, injecté dans `#login-profiles`. **Trois portes** : découvrir le
logiciel · démo guidée · champ « lien d'installation » acceptant **une URL complète ou un slug nu**.

Le logo reste **tapable 5 fois** → panneau GT, **sans avoir à taper `?tenant=`**.

⚠️ Le **vrai** chemin d'installation (`?tenant=slug` + statut `pending`) est **intégralement
préservé**. ★ **Le formulaire d'essai du site fonctionne** : c'est par lui qu'est arrivé Garraud.

---

## 15. Journal & travaux

- **Une équipe au travail = une seule entrée** de journal avec tous les noms
  (`JOURNAL.membresEquipe`). ★ C'est cette structure qui rend possible toute la série UX-R et le
  coût par parcelle du Pilotage.
- ⚠️ Les statuts sont stockés **accentués** (`'Validé'` / `'Annulé'`) → correspondance UTF-8
  **exacte** obligatoire.
- ⚠️ Une entrée peut porter `parcelle:'Domaine'` (validation groupée) : **aucune surface**.
- ★ **Une entrée `meteo:true` existe aussi** : le bilan et `_mvPartCalc` les excluent tous les deux.
  ⚠️ **Vécu le 09/08** : une `meteo:true` prise pour une trace de travail dans un test — **une
  entrée de journal n'est pas forcément un travail.**
- Bouton 🩹 = **reconstruction** du journal.
- `travaux` est **dérivé** et régénérable par `recalcTravaux` → volontairement non gardé.
- ★ **`TRAVAUX[tache]` contient l'avancement surfacique** : `pct`, `surf_done`, `surf_total`,
  `h_done`, `h_reste`. ⚠️ **Mais il est lié à la PÉRIODE active, pas à la campagne.**
- ★ **Le statut « En cours »** écrit une entrée avec `date` et `ts_debut` ;
  `_findDebutTache(parcelle, tache)` existe déjà.
  ⚠️⚠️ **DÉFAUT DORMANT** : `_findDebutTache` prend le **minimum sur tout le journal SANS borne de
  période** → à la 2ᵉ campagne d'une même tâche, `fetchMeteoMoyenne` moyennera sur des centaines de
  jours (contre-épreuve : 398 jours au lieu de 2). Dormant chez MG aujourd'hui, pas absent.

---

## 16. ★★ Campagne & périodes — le modèle actuel

**Le modèle « saison par type » est mort.** L'app déduisait les tâches en **lisant le premier mot du
nom de la saison**. Cassé net pour tout domaine nommant ses périodes autrement.

**Modèle actuel — période par dates** : **nom libre**, **date de début**, **date de fin**, et sa
**propre liste explicite de tâches**. Plus aucune interprétation du nom.

- **Helpers dans `utils.js`** : `_saisonObj`, `_saisonForDate`, `_saisonTaches`.
- `getTachesSaison()` lit la **liste explicite** de la période, avec repli legacy.
- **Migration one-shot idempotente** `_migrateSaisonTaches`.
- **Le journal suit la date saisie**, pas la période active.
- **`p.taches` reste épinglé à la période ACTIVE.** La consultation d'une autre période est **lecture
  seule**, via `_tachesFor(p)` + `localStorage` **par utilisateur**.
- ★ **`_renamePeriode()`** migre **toutes** les clés de stockage au renommage.
- `s.echeances` porte les fenêtres agronomiques.
- ★★ **`_saisonForDate` prend la période dont le DÉBUT est le plus tardif** parmi celles qui
  contiennent la date → **les périodes peuvent se chevaucher**, la plus récemment commencée gagne.
  C'est ce qui rend sûr le découpage recopié d'un autre domaine (§18b).

⚠️ **Ne pas confondre PÉRIODE, CAMPAGNE et MILLÉSIME** — les axes du §11c.

### ⚠️⚠️⚠️ Le filtre legacy — il a survécu à sa propre mort

**Le modèle « saison par type » a été déclaré mort le 25/07. Il tournait encore le 03/08.**
`_chargeSaisonData()` utilisait toujours l'ancien filtre. Or la **Vendange** porte `anytime:true`.
Elle entrait donc dans **toutes** les périodes.
Coût mesuré chez Marchand-Grillot : **≈ 941 heures fantômes**, soit **~28 % de la charge totale**.

**Correctif** : `window._saisonTaches(s.nom)` — ⚠️ **la période passée en ARGUMENT, pas la période
consultée**.

⚠️ **La même vulnérabilité dort ailleurs** : `Arrachage`, `Désherbage manuel` et `Effeuillage`
portent aussi `anytime:true`, invisibles parce que leurs heures/ha sont nulles.

### ⚠️⚠️ PÉRIODE CONSULTÉE vs PÉRIODE ACTIVE — le piège qui se réintroduit

- `getSaisonActive().nom` = la période **active** (celle où l'on peut valider)
- `_visuSaison()` = la période **consultée** par cet utilisateur (peut être une archive)

Toute fonction qui croise tâches/parcelles avec le **journal** doit filtrer le journal sur
`_visuSaison()`. Ce piège a été **réintroduit le 30/07 par du code neuf**. Repli retenu :
```js
var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
```
★ **Troisième cas** : une fonction qui reçoit une période **en argument** doit utiliser **cet
argument**, ni l'active ni la consultée.

### ★★ Frise, rétention, archives

**(a) Frise recalée.** Chaque étiquette positionnée par le **même calcul `pc()`** que les segments.
**(b) Rétention 18 mois** (`_CMP_RETENTION_M`). La période **active** et la période **consultée**
ne sont jamais masquées ; le filtrage d'**affichage** ne mute **jamais** `SAISONS`.
**(c) Onglet « Archives »** — axe commun **1er août → 31 juillet**. `_pilCmpSnapshot()` **apparie
par position sur l'axe campagne** (tolérance 75 jours).
★ **C'est l'écran de fin de campagne** : c'est pourquoi le bilan de campagne (§20f) s'y ouvre.

## 16b. ★★ Niveaux sautés — la marque `'Auto'`

Quand un relevage se fait en **un seul passage**, on valide directement le dernier niveau et
`_computeAutoNiv` marque les précédents **`'Auto'`**.

⚠️ **Mais partout où l'on comptait des heures, `'Auto'` comptait comme `'Validé'`.**

**Règle arbitrée par Nico** : un passage sauté **n'a pas eu lieu**, donc il ne compte pas.
Et **N passages réellement faits = les N PREMIERS niveaux du barème**.

**`window._mvNivH(nivs, s)`** (utils.js) est la **source unique** → `{n, done, total, fini}`.
**Mesuré sur les 45 parcelles réelles de MG** : `h_done` 1 092,8 → **564,5 h**.
⚠️ **La surface faite et le pourcentage d'avancement ne bougent pas** : ils se calculent sur le
**statut**, pas sur les heures.

## 16c. ⚠️ Bug d'onboarding corrigé

`obFinalize` créait la saison **sans `debut` ni `fin`** → **tout tenant créé après la refonte
campagne avait une saison invisible**. Désormais `debut: AAAA-01-01`, `fin: AAAA-12-31`.
★ **Une période sans dates est invisible pour toute la chaîne de charge** — c'est aussi pour ça que
l'étape « périodes de travail » du widget Mise en route exige `debut` **et** `fin` (§27c), et que
l'assistant d'installation **refuse d'écrire** une période incomplète (§18b).

---

## 17. Phyto & E-Phy

- Registre + catalogue **E-Phy ANSES** synchronisé chaque semaine. L'ancien catalogue manuel
  « Mes produits » est supplanté mais **encore référencé** dans 5 fichiers. Arbitrage ouvert.
- **DRE dérivée des codes de danger CLP** (24 h / 48 h, arrêté du 4 mai 2017).
- **`dose_val` structuré** (nombre + unité, jamais un parsing de texte libre).
  ⚠️ Bug vécu : une comparaison d'unité **sensible à la casse** faisait disparaître en silence des
  entrées anciennes du calcul de coût.
- **Assistant de traitement en 3 étapes.** FAB visible si `isTractoriste() || isAdmin()`.
- ★ **Budget cuivre** : cumul de cuivre métal sur **7 ans** face au plafond **28 kg/ha** en dur.
  Source unique `_cuParcRollSum`. **Non bloquant.** Visible aussi dans Pilotage › Conformité.
- `traitements` a un plancher de garde (**5**) — le registre phyto est opposable en contrôle.
- ⚠️ Le **pied des rapports PDF phyto** porte la mention éditeur + SIRET GUERETTECH (§26c).

### ★★ Export électronique du registre (CSV)

**Base légale** : règlement d'exécution **(UE) 2023/564** + **arrêté du 24 décembre 2025**.
Contenu obligatoire depuis le **01/01/2026** ; **format électronique lisible par machine exigé au
01/01/2027** — un PDF imprimé n'en est pas un. Le PDF existant reste, le CSV s'y ajoute.

- **`window._phytoCsvRows()`** + **`window._phytoExportCsv()`** (`phyto.js`). Boutons : bas du
  registre (`#phyto-export-row`, **admin**) + ★ le hub **Documents & impressions**, famille
  « Obligatoire », où il est **mis en avant** (`urgent:true`).
- ⚠️ **Une ligne par produit ET par parcelle** : la localisation est exigée pour chaque surface
  traitée.
- **Localisation par coordonnées GPS**, centroïde KML via **`_mvParcGeo`**.
- ⚠️ **« Cible » et « Mode d'application » laissés VIDES délibérément** : facultatifs au texte, et
  les remplir depuis le catalogue reviendrait à déclarer une cible pas forcément visée ce jour-là.
- **Format Excel FR** : séparateur **point-virgule** + **BOM UTF-8** + **décimale à virgule**.
  Dates **JJ/MM/AAAA**, heures **HH:MM**, stade **BBCH**, culture = code OEPP **`VITVI`**.
- ★ **`CONFIG.siret` + `CONFIG.bio`** saisis dans **Réglages › Domaine** — imposés **sur chaque
  ligne**. ★★ **C'est pour ça que le SIRET est l'un des deux conseils du widget Mise en route**
  (§27c) **et l'une des trois valeurs reprises du formulaire à l'installation** (§18b) : sans lui le
  fichier part quand même, mais incomplet.
- Toasts honnêtes : SIRET manquant (orange, le fichier part quand même) · N lignes sans
  coordonnées · succès.

---

## 18. Admin GT — le panneau

- Fiche client (plan + toggles modules + essai temps réel), **dernières connexions clients**,
  vérification KML, bascule de plan, journal des erreurs (`_agtBuildErrors()` lit
  `mavigne_{slug}/error_log`), écran business & leads.
- ★ **`_agtSlugs`** mémorise la liste des domaines installés au chargement du panneau — c'est la
  source à réutiliser, sans nouvel appel réseau.
- Toute action GT exige la **fenêtre privée `ngdevpro`** (5 taps sur le logo) et une **session OTP**
  ouverte (SEC-GT/2).
- ⚠️ En mode GT, `window.CONFIG` / `PARCELLES` sont **vides** → ne jamais y lancer `saveData`.
- ⚠️ `_guerettech/tenants = {slugs:[…]}` à la **racine**, sans enveloppe `{value}` → lecture
  tolérante aux deux formats.
- ⚠️ **Le panneau est passé de 8 à 6 onglets le 06/08** — non documenté, à consigner.
- ⚠️ **`admin-gt.js` seul = AUCUN bump.**

---

## 18b. ★★★ L'ASSISTANT D'INSTALLATION — « 20 h → 9 h » (chantier du 9 août, soir)

> ⚠️⚠️ **CINQ LOTS LIVRÉS, PAS ENCORE DÉPLOYÉS.** Voir « Déploiement » en fin de section.

### Le point de départ, et l'erreur à ne pas refaire

La note de mission affirmait qu'il fallait **écrire** un import KML créant les parcelles et un
mécanisme de création de comptes. **Les deux existaient déjà**, au moins en partie :
**l'assistant `_agtIns` était en place et avait servi pour l'installation de Chapelle.**

★★★ **Leçon : le premier geste d'une mission est un inventaire, pas un plan.** Une note de mission
vieillit exactement comme un document d'instructions.

### Ce que l'assistant faisait déjà

Bouton **« 🌱 Installer un domaine depuis un dossier »** dans le panneau GT → `agtOpenInstall()`.
Il lit les dossiers reçus (`gtLeads`), lit un fichier de parcellaire, **crée les parcelles avec
leurs surfaces** (formule du lacet sur le contour), géocode la commune du domaine, inscrit le slug
dans `_guerettech/tenants`, appelle `onboardTenant` avec parcelles + saison + tâches + admin, écrit
`kml_polygons`, puis affiche le mot de passe **une seule fois**.

### La mesure, avant tout code

**20 h par installation**, décomposées par Nico :

| Poste | Coût | Nature |
|---|---|---|
| Administratif | 2 h | humain |
| Barème | 4 h | **discussion avec le client** |
| Parcelles | 4 h | clavier |
| Comptes salariés | 1 h 30 | clavier |
| Périodes | 1 h 30 | clavier |
| Reprise de données | 2 h | clavier |
| Matériel | 1 h | clavier |
| Cave | 1 h | clavier |
| Accompagnement, allers-retours | 3 h | clavier |

★★ **Les 14 h de clavier se font SEUL.** C'est le seul gisement que du code peut atteindre.
★★ **Et les 4 h de parcelles étaient dépensées MALGRÉ l'assistant** — parce que **les noms du
domaine ne sont pas ceux du fichier**. C'est Nico qui l'a dit en une phrase, et ça a déplacé tout
le lot n°1.

**Cible tenue sur le papier : ~9 h.** ⚠️ **Non mesurée** : elle le sera à la première installation
à blanc (§28).

### Lot 1 — les parcelles (4 h → ~30 min)

- **Nom éditable ligne à ligne** (il ne l'était pas), **zone de collage** de la liste du domaine,
  **appariement automatique** par distance d'édition sur des clés normalisées (accents, casse et
  ponctuation ôtés), seuil **proportionnel à la longueur**, affectation **gloutonne** par distance
  croissante, exclusion mutuelle. Ce qui dépasse le seuil n'est **pas imposé** : il est proposé
  ligne par ligne, du plus proche au plus lointain.
- **Colonne commune** par parcelle + bouton « Toutes à la commune du dossier ».
- ★★★ **`parcelles` et `kml_polygons` sortent du MÊME tableau `_agtIns.parc`** → corriger le nom
  avant écriture fait tomber les deux justes **par construction**.
- ⚠️⚠️ **Deux noms qui ne diffèrent que par un NOMBRE ne s'apparient JAMAIS tout seuls.**
  « Parcelle 8 » n'est pas « Parcelle 7 » : un nombre qui change n'est pas une faute de frappe.
  Les zéros de tête ne comptent pas (« Chaliots 01 » = « Chaliots 1 »). **Trouvé par le harnais.**
- ⚠️ **Le select d'une ligne déjà nommée doit proposer SON propre nom**, sinon on ne voit plus ce
  qui y est posé et corriger un mauvais rapprochement oblige à tout recommencer.
- **Gardes avant écriture** : aucun nom vide, aucun nom en double.
- ⚠️⚠️ **DÉFAUT PRÉEXISTANT CORRIGÉ** : chaque rendu appelait `_agtInsFill`, qui **réécrivait** nom
  du domaine, e-mail et durée d'essai **depuis le dossier**. Retirer une parcelle effaçait donc la
  saisie en cours, **sans un mot**. Correctif : une **photo des champs** (`_agtIns.form`) prise
  avant chaque rendu, remise à `null` au changement de dossier.

### Lot 2 — les comptes de l'équipe (1 h 30 → ~20 min)

- ⚠️⚠️⚠️ **LE DÉFAUT LE PLUS GRAVE DE LA SÉRIE.** `agtSaveAddMembre` appelait
  `window.createAuthAccount(email, pwd, {roles})`, qui envoyait **`tenant: TENANT_ID`** —
  c'est-à-dire `localStorage.mavigne_tenant`, **jamais le slug affiché à l'écran**. Deux issues
  selon la fenêtre : refus net en fenêtre privée vierge, ou **compte créé sur le mauvais domaine**
  pendant que la fiche membre partait chez le bon via `fbAdminWrite(slug, …)`. Le membre apparaît
  dans l'équipe et ne peut pas se connecter : **panne différée, sans trace**.
  **Correctif** : `tenant: (opts && opts.tenant) || TENANT_ID` dans `firebase.js`, et le slug passé
  par le panneau GT. **Le chemin client (Réglages › Équipe) ne passe rien et ne change pas.**
  ✅ **Vérifié par `gtBackfillClaims` : 28 comptes, tous « (inchangé) »** — le défaut existait mais
  ne s'était jamais déclenché.
- **Écran « 👥 Toute l'équipe »** : collage d'une liste (`Prénom`, `Prénom;rôle`,
  `Prénom;adresse;rôle`, tabulations acceptées — un collage depuis un tableur passe), **aperçu
  obligatoire**, création une par une, **liste des identifiants affichée une seule fois**, copiable
  et imprimable.
- **Le mot de passe devient facultatif** aussi dans l'écran unitaire : SEC-2 savait déjà le générer,
  cet écran l'exigeait pour rien.
- ⚠️ **Rôle par défaut : `ouvrier`.** Jamais administrateur — un droit ne s'accorde pas par omission.
- ⚠️ **Admin + adresse fictive = refusé AVANT l'appel**, avec la raison. Le serveur le refuse de
  toute façon ; autant le dire avant d'essayer.
- ⚠️ **En cas d'échec partiel, les fiches des comptes réussis sont écrites quand même** — sinon des
  comptes existeraient sans apparaître dans l'équipe. Si c'est l'écriture qui échoue, l'écran le dit
  en toutes lettres au lieu de l'avaler.
- ★★★ **LA CONVENTION D'ADRESSE N'EST PAS LE SLUG.** Lu dans les comptes réels :

  | Domaine | Slug | Convention réelle |
  |---|---|---|
  | Marchand-Grillot | `marchand-grillot` | `prénom.marchand-grillot@`**`mavigne.app`** |
  | Chapelle | `domaine-chapelle-et-fils` | `prénom.`**`domainechapelle`**`@mavigneapp.fr` |

  Elle se **déduit par majorité des adresses fictives déjà en place** ; sur un domaine neuf, le slug
  sert de départ ; le champ reste modifiable.
- ⚠️ **Sa normalisation garde les tirets et les points.** `_agtLotPart` ≠ `_agtLotKey` : la seconde
  sert à comparer des **prénoms** et mange tout ce qui n'est pas lettre ou chiffre — appliquée à la
  partie d'adresse, elle transformait `domaine-chapelle-et-fils` en `domainechapelleetfils`.

### Lot 3 — les périodes (1 h 30 → ~20 min)

- Par défaut, l'installation posait **une seule campagne du 1ᵉʳ janvier au 31 décembre** portant
  toutes les tâches → tout le pilotage raisonne alors sur l'année d'un bloc.
- ★★ **On ne devine aucun calendrier : on RECOPIE le découpage d'un domaine déjà installé**, dates
  ramenées sur la campagne en cours. Même patron que la convention d'adresse : ce qui existe vaut
  mieux qu'une valeur inventée.
- ⚠️ **Le décalage se calcule sur la DERNIÈRE fin**, pas sur la première : une campagne à cheval
  sur deux années civiles se ferait sinon translater d'un an de trop. **Le 29 février retombe au 28**
  quand l'année d'arrivée n'est pas bissextile.
- ⚠️ **Les tâches que le nouveau domaine ne connaît pas sont écartées et comptées** — un barème
  régional ne porte pas les mêmes travaux.
- **Deux avertissements** : les **tâches qu'aucune période ne réclame** (elles n'apparaîtraient
  nulle part) et les périodes incomplètes.
- **Deux gardes à l'écriture** : nom **et** dates exigés (§16c) ; refus si aucune période ne porte
  de tâche.
- ⚠️ **Les dates se lisent au `onblur`, jamais au `onchange`** (§19, piège du champ date).

### Lot 4 — le formulaire de mise en route arrive en base

- **`submitMiseEnRoute`** (`functions/leads.js`, modèle `submitLead`) : CORS borné, leurre anti-bot,
  champs clippés, `maxInstances: 3`.
- ★★★ **Il écrit dans le MÊME document `leads`**, déjà indexé sur `sha256(e-mail)`, **sous la clé
  `mer`**. Conséquences : **aucune collection nouvelle**, donc **aucune règle Firestore à déployer**
  (`leads` est déjà `read: isGtAdmin` / `write: false`), et **les réponses atterrissent dans le
  dossier que l'assistant d'installation ouvre déjà**. Si la personne n'est jamais passée par le
  formulaire d'essai, le dossier est **créé** ici, avec sa provenance.
- ★ **Le récapitulatif lisible est construit par la PAGE**, pas par le serveur : les soixante
  libellés n'existent qu'à un seul endroit. Le serveur ne le réécrit pas, il le **borne**.
- **La page** envoie sept clés (`dom`, `ctMail`, `recap`, `t`, `r`, `c`, `hp`) et **essaie deux
  adresses** : l'URL complète de la fonction d'abord, `/api/mise-en-route` ensuite.
  ⚠️ **`rewrites` est ABSENT du `firebase.json` lu**, alors qu'`essai.html` poste vers `/api/lead` :
  soit ce fichier est en retard, soit la version en ligne appelle l'URL absolue — ce que suggère la
  CSP. **À vérifier en ligne** ; si un rewrite existe, en ajouter un pour la nouvelle route.
- **En cas d'échec, rien ne se perd** : le texte est affiché **et sélectionné**, avec l'adresse où
  l'envoyer. ★ **Et le succès rappelle que les FICHIERS restent à joindre** — l'envoi ne transporte
  que les réponses, pas le parcellaire.
- **Dans l'assistant** : un bloc **« Ce que le client a répondu »** affiche le récapitulatif, plus un
  bouton qui reprend **le SIRET, les écartements et la période**.
  ⚠️ **Et rien d'autre.** L'IDCC est affiché mais **pas écrit** : rien ne le lit encore dans
  l'application, le poser donnerait l'illusion d'un réglage fait.
- ⚠️ Un SIRET incomplet, un écartement absurde ou une période qui finit avant de commencer **ne sont
  pas repris — et le bouton ne les promet pas**.

### Lot 5 — machines et futaille

- Collage d'une liste : `Nom`, `Nom;modèle`, `Nom;modèle;hydrostatique`, `;traitement` pour un engin
  réservé aux traitements. Écrit dans `tracteurs_list` **après** `onboardTenant`, **seulement si une
  liste existe** — sinon le domaine garde son tracteur unique de démarrage.
- ⚠️⚠️ **LA PREMIÈRE MACHINE DOIT GARDER L'IDENTIFIANT `trac1`.** Toutes les activités du seed y
  renvoient (`tracteurDefautId:'trac1'`) : décaler cet identifiant laisserait chaque activité
  pointer un tracteur inexistant, **en silence**.
- **Volume d'un fût** : 225 L bordelaise · 228 L bourguignonne · 400 L demi-muid · 500 L.
  ⚠️ **Ne rien choisir RETIRE la clé** au lieu d'écrire 228 en dur.
  ⚠️ **Garraud est en Gironde : 225 L.** Sinon toute sa cave — part des anges, volumes d'ouillage,
  capacité — est calculée sur des pièces bourguignonnes.

### Ce que le chantier a appris sur l'outillage

- ★★★ **Le preflight ne contrôle que `onclick`** — `onblur` et `onchange` ont exactement le même
  sort. Contrôle maison de tous les handlers inline (§6c).
- ★★ **`_agtInsNorm()` : UNE seule normalisation des quatre listes** (`parc`, `noms`, `per`, `mach`)
  en tête du rendu. J'avais commencé par semer des `|| []` à chaque lecture — **toujours rouge**,
  parce que d'autres fonctions les parcourent aussi. **Semer des gardes, c'est se garantir d'en
  oublier une.**
- ★★ **Un dry-run doit être SÉQUENTIEL** (§25).
- ★ **L'ORDRE des blocs à l'écran compte** : « Ce que le client a répondu » arrivait **après** les
  parcelles, les périodes et les machines, alors que c'est lui qui les alimente. Déplacé avant —
  **mêmes caractères, ordre différent**, prouvé.
- ★ **La liste « À finir chez ce client » suit désormais ce qui a été posé**, et affiche en vert ce
  qui vient de l'être. Elle réclamait le SIRET, les écartements et les fûts que l'assistant sait
  maintenant écrire : **un écran qui ment sur son propre travail**.
- **354 assertions, 9 harnais, 31 défauts réintroduits et 31 rougissements, preflight 0 erreur.**

### Déploiement (⚠️ EN ATTENTE)

```
xcopy functions ..\mavigne-sauvegardes\avant-mer\functions\ /E /I /Y
firebase deploy --only functions:submitMiseEnRoute
npm run build && firebase deploy
```

⚠️ Cibler la fonction **par son nom**. Pas de rules, pas de backfill.
Fichiers : `src/admin-gt.js` · `src/firebase.js` · `functions/leads.js` ·
`public/mise-en-route.html`. **Aucun bump.**
★ **Depuis le 10/08, ces fichiers vivent dans le dépôt GitHub** (§ Règle d'or n°1) : les
récupérer par `git clone`/`git pull` plutôt que par upload avant de vérifier s'ils sont partis.

---

## 18c. ★ La procédure imprimable

**`INSTALLER-UN-DOMAINE.md`** (la source) + **`mkpdf.py`** (le générateur) + le **PDF** —
tous **hors dépôt**, dans `..\mavigne-sauvegardes\` (donc hors Git aussi, cf. « Environnement de
Nico »).

Cinq pages A4, écran par écran, dans l'ordre réel, avec les refus possibles et ce qu'ils veulent
dire, et une annexe « mesurer » : temps estimé contre temps réel, étape par étape.

**Chaîne de production** : polices récupérées en paquets `@fontsource` par npm, converties woff→ttf
par `fontTools`, embarquées par ReportLab. Aucune dépendance externe au rendu.

⚠️⚠️ **LE PIÈGE DU PDF, à retenir** : les polices latines n'ont **ni pictogramme d'avertissement,
ni flèche, ni émoji**. Un caractère absent sort en **carré noir** — et **l'extraction de texte ne le
voit pas**. Le premier contrôle est passé au vert avec un carré bien visible dans l'en-tête.
**Seule la rastérisation des pages l'a attrapé.**
→ Substituer **avant** le rendu, et **regarder les pixels** : `pypdfium2` rend chaque page, on la
relit.
★ Autre correction du même ordre : Cormorant a des **chiffres elzéviriens**, donc le « 1 » d'un
numéro de section se lit « i » — les numéros passent en Outfit, les titres restent en Cormorant.

★ **Contrôle croisé utile** : chaque affirmation vérifiable du document (nom des boutons, ordre des
blocs, libellés des refus, valeurs proposées) a été **testée contre le code**. Dix-huit
vérifications — dont une a rougi sur un motif de recherche que j'avais mal écrit, pas sur le code.

★★ **Et le fait le plus utile du chantier : écrire la procédure a trouvé deux défauts** (l'ordre des
blocs, la liste « à finir » périmée). **Rédiger le mode d'emploi d'un écran est un test.**

---

## 19. Planning RH & annualisation

**Base légale** : convention **IDCC 7024**, **1607 h/an**, modulation **250 h**.
**Mode CP** : `CONFIG.cp_mode` — `ouvrables` (défaut légal, L3141-3) ou `ouvrés`.

**Livré** :
- Grille équipe, éditeur **slide-up**, multi-sélection, « Outils du planning », « Anciens salariés ».
- **Annualisation** : plafond 1607 h **proratisé**, **travail effectif distinct des heures
  rémunérées**, motifs d'absence types.
- **Heures travaillées vs prévues** : vivant à **6 points de rendu**.
- **Solde de départ** d'heures sup + tableau annuel + bloc PDF. **Jours travaillés** sur le relevé
  PDF (exigence MSA).
- **CP multi-périodes / multi-employés.**
- ★ **« Jour de remplacement »** — `Math.max(0, ecart)` empêchait les deux moitiés d'un échange de
  s'annuler → badge bleu, `_planRempH`.
- ★ **« Heures dues »** — `CONFIG.hsup_dues_debut`. **Jamais rétroactif.**
- ★ **`planClearDay()`** — sans confirmation, **au niveau jour seulement**.
- ★ **Multi-sélection corrigée** — `planMultiApply()` écrivait des entrées nues sans la logique
  métier du chemin « Outils ». Correctif : `_planCpDayType` + `_planCpCount` appelés par **les deux**.

### ★ Heures supplémentaires

- **Colonne cumulée « Reste à prendre »** : accumulé − récup prise − heures payées.
- **`planSaveHsupAt` ne plafonne plus au mois** : débordement automatique sur `paye_bank`.
- **PDF mensuel sur UNE page**, tableau annuel jusqu'au **mois courant seulement**.
- ⚠️ **Terminologie ouverte** : l'écran dit « Solde cumulé », le PDF « Reste à prendre ».

### ★★ Capacité réelle — `_capWeekReal`

L'ancienne capacité hebdo multipliait un **effectif** par les heures d'un **modèle « standard »
unique**. Le simulateur de renfort héritait de ce chiffre faux.

**`_capWeekReal(o0, o1)`**, définie **dans `_chargeSaisonData`**, parcourt **jour par jour, salarié
par salarié**. Deux mesures **volontairement séparées** :
- **`_planWorkH`** = **capacité** (un CP compte **0**) ;
- **`_planDayH`** = **socle payé** (un CP compte ses heures rémunérées).

★ **Paramètre année optionnel** : une campagne **à cheval sur deux années** charge le bon modèle
pour chaque moitié. ⚠️ **Repli complet** si `capHPerm` est absent. 27 scénarios exécutés.

★★ **`_planWorkPersRange(mbr, Date, Date)`** — ⚠️ **signature : un membre et DEUX OBJETS Date.**
C'est la source unique de « combien d'heures cette personne a-t-elle été là », partagée par
Économie › Exercice **et** l'écart de cadence (§20b).

### ★★ Les saisonniers ne disparaissent plus de l'historique

Les courbes filtraient sur `statut !== 'Inactif'`. Marquer un contrat terminé effaçait la personne
de **tout l'historique** : le pic d'effectif tombait de **10 à 4**.
**Correctif** : `window._mvEnContratSurPeriode(m, d0, d1)`, appliquée aux **3 sites**.
⚠️ Les écrans « **qui est là aujourd'hui** » sont **volontairement inchangés**.

### ★★ Équipe collective (COLLECTIF-1)

Un membre peut être une **équipe** : une ligne de planning pour N personnes, effectif modifiable
**jour par jour**. `_mvEstCollectif`/`_mvEffDef`/`_mvPoidsNom` · `_planEffN`/`_planCollH`/
`_planEffApply` · **`_mvPartCalc` pondéré**.
★ **`_headWeek` expose deux mesures** : `head` (pondéré) et **`headPerm`** (permanents seuls).
**Arbitrage figé** : cadence, ordre de passage et journée raisonnent sur les **fiches permanentes**.

**⚠️ Pièges du module :**
- **`<input type="date">` avec `onchange`** déclenche à **chaque date structurellement valide** en
  cours de frappe → **`onblur` pour les dates**, `onchange` pour les nombres.
  ★ **Règle réappliquée le 09/08** à l'éditeur de périodes de l'assistant d'installation.
- **iOS `input[type="time"]`** et **tout champ** rempli après `innerHTML` : `.value` **en JS**.
- **Incohérence ouverte** : `_pl2Annual` somme la référence **brute** du modèle, alors que
  `_planSummary.ref` exclut hors-contrat et récups. **Décision de conception d'abord.**
- Le modèle « standard » totalise 1589 h/an contre 1607 → avertissement orange.
- `planning.js` **seul** = **aucun bump**.

---

## 20. Cave — Le Chai & Le Cuvier

- **Le Chai** (namespace `mvc-`) : élevage, fûts, **jauges de part des anges**.
- **Le Cuvier** : vendange. **Cuvées normalisées** (`_cuvKey` + distance de Levenshtein).
  ★ **Repeint aux couleurs de la Cave le 09/08** (c'était le dernier écran sombre ; 7 textes hérités
  étaient illisibles).
  ★★ **La distance de Levenshtein du Cuvier a servi de patron** à l'appariement des noms de
  parcelles (§18b) — **recopiée volontairement dans `admin-gt.js` plutôt que remontée dans
  `utils.js`** : c'est de l'arithmétique de chaînes, pas une règle métier, et la remonter aurait
  coûté un bump SW pour un écran que le client ne voit jamais.
- **Rendements pluriannuels** dans `p.rendement_hist[]`. Millésime = **année civile de la date**.
- ⚠️ **Piège de type vécu** : `renderVendCuves` fait `c.parcelles.map(...)`. Une **chaîne** passée là
  où un tableau était attendu produit un `TypeError` **silencieux**.
- ⚠️ Déséquilibre `<div>` **préexistant** dans `cave.js` : **non-régression, à ne pas chercher à
  corriger au passage**. Le contrôle de balance compare TOUJOURS base → patché.

★★ **`cave.js` est de loin le plus gros module du projet** (~375 ko).
⚠️ **Surveiller sa taille.** Un `cave-doc.js` séparé coûterait un bump APP + SW.

### ⚠️⚠️ Défauts historiques du Cuvier, corrigés en août

**1. Le décuvage marquait tous les fûts « neufs ».** **La pyramide des âges était fausse depuis
toujours.** Corrigé par l'entonnage depuis le parc (§20e).

**2. Le SVG s'étirait sur grand écran.** ★ **Corrigé par Nico lui-même.** **Règle : un SVG à
`viewBox` fixe doit être borné en largeur.** ★★ **Depuis août, préférer CSS pur pour les frises.**

**3. ★★ Une analyse rouverte perdait ses valeurs.** `opData` est reconstruit **en entier** à
l'enregistrement, et le formulaire n'était **jamais pré-rempli** → rouvrir une analyse pour corriger
sa date réécrivait `so2_libre`, `so2_total` et `av` **avec ce qui traînait dans le DOM**.
★ **Leçon générale : dès qu'un formulaire est reconstruit en entier à l'enregistrement, il DOIT être
pré-rempli à l'édition et vidé à la création.**

**4. ★ Le Chai s'ouvrait VIDE au premier accès** (05/08) : `caveTab` initialisé à `'dash'`, un
onglet purgé depuis longtemps → 4 vues masquées, aucune erreur, aucun test. Corrigé en trois gestes
indissociables dont un **filet de tolérance** en tête de `switchCaveOng`.
★★ **Même famille que le bug `ecf` de la visite guidée** : une clé d'écran survit à l'écran.

## 20b. Pilotage

- ★★ **7 onglets** (`_PIL_TABS`) : **Aujourd'hui · Avancement · Décider · Équipe · Cave ·
  Économie · Conformité** (+ ⚙️ Outils `_PIL_TOOLS` : Archives, Paramétrage).
  ⚠️ **Conformité** (clé `cfm`) était sorti du **document**, pas du code. `_PIL_TAB_MIGR` migre les
  onglets mémorisés (`prs`→`equ`, `mat`→`equ`, `ecf`→`eco`) ; `_PIL_VALID_TAB` accepte 9 clés.
  ★★ **`_PIL_TAB_MIGR` est la LISTE DES CLÉS MORTES** — c'est ce qui permet à C22 de détecter
  qu'un autre fichier en demande encore une (§6c).
  ★ **`_PIL_TABS` et `_PIL_TOOLS` sont exposés sur `window`** depuis le 09/08, pour que l'aide
  contextuelle liste les onglets en les **lisant** (§27b).
- ★ **Conformité** — cuivre (7 ans vs 28 kg/ha), passages phyto vs référence régionale réglable
  (défaut 12), délai de rentrée avec heure de libération.
- ⚠️ **Compatibilité `app.js`** : la visite guidée référence `.pil-tile[data-pid="traitement"]`,
  `.pil-cockpit-card`, `.pil-dec` — ne pas renommer. ★ **C22 le vérifie désormais mécaniquement.**
- ⚠️ La page est un `<div>` **vide** → hôte dédié `.pil-metahost`.
  ⚠️⚠️ **Ne jamais poser `.mod-header` sur `.pil-mast`** (§21c).
- ★ **Archives** porte deux boutons : « Comparer deux saisons » et « Éditer le bilan de campagne ».

### ★★★ Économie — l'écart de cadence, refait le 09/08 (il était faux d'un facteur 5)

**4 sous-vues** `_PEC_SUBS` : 📈 Synthèse (la carte de verdict `_pecVerdict` vit là) ·
🧭 Postes & travaux · 🍇 Parcelles · 📅 Exercice.

**Le coût de main-d'œuvre n'a JAMAIS dépendu des heures du journal** : c'est
`heures de BARÈME × taux pondéré par l'équipe réelle`. **Le journal dit QUI, jamais COMBIEN
D'HEURES.**

**L'écart de cadence, lui, en dépendait** : `hReel = Σ jh × 7 h` où `jh` ne comptait que les
journées-personne portant une **VALIDATION**. Or une validation couvre plusieurs jours de travail.
**Mesuré chez MG** : 12 journées sur 247 en hiver, 165 sur 559 au printemps.
Écran réel : **hiver −90 %** ; **printemps −52,8 %, fin projetée à 37,4 k€ alors que 79 358 €
étaient déjà engagés et la période 100 % faite** — une projection qui contredit l'engagé sur la même
carte. Et un verdict **VERT** invitant à réduire un barème juste à ~5 % près.

**Correctif 1** : `projFin = engage + resteE*(1+ecart)` — la cadence ne s'applique qu'au **RESTE À
ENGAGER**. À 0 % d'avancement, identique à l'ancien ; à 100 %, elle retombe **exactement** sur
l'engagé, donc elle ne peut plus contredire ce qui est dépensé.

**Correctif 2** : la présence vient du **PLANNING** — `_pecCadPresence()` appelle
`window._planWorkPersRange(mbr, Date, Date)`, **la même source qu'Économie › Exercice** (on ne
redéfinit pas « combien d'heures a-t-on travaillé »), **moins `T.tracH`** déjà agrégée ;
`hBarC = T.fH` = **tout** le travail fait (⚠️ **numérateur global ⇒ dénominateur global**, sinon on
recrée le décalage dans l'autre sens) ; l'ancien garde de couverture sur la **surface** disparaît,
remplacé par un seuil d'**avancement** `_PEC_CAD_AVC = 0.40`.

⚠️ **BIAIS ASSUMÉ ET ÉCRIT À L'ÉCRAN** : une entrée de planning porte des heures, un type cp/récup,
un motif d'absence — **jamais une activité**. Cave, atelier et bureau restent donc dans la présence,
qui est **surévaluée** ; l'indicateur penche vers « barème un peu serré ». **Biais inverse de
l'ancien, et bien plus petit.**

⚠️ **`_pecCadPresence` vérifie que la période a COMMENCÉ** avant de borner sa fin à aujourd'hui —
sans ce test la fenêtre part à l'envers et tout sort à zéro **en silence** (vécu pendant la mesure,
sur une période « Vendanges » débutant le lendemain).

★ **Backlog** : escalier de sources (période en cours ≥ seuil → même période l'an dernier via
`HISTORIQUE` + `_pilCmpSnapshot` → sinon rien) — **marche 2 vide aujourd'hui**.

### ★ Économie — le reste

- Pondéré par l'équipe réelle de chaque parcelle, **le tractoriste à son propre taux**.
- 3 graphes SVG + courbe d'engagement `_pecTimeline` (chaque euro à SA date).
- ⚠️ **Toute nouvelle hypothèse doit être ajoutée à `_ecoCfgSet`**, sinon rejetée en silence.
- ★★ **Le budget d'une tâche est un budget de BARÈME** : surface × h/ha × taux moyen `_ecoRate`.
  1. **`_ecoRate` est une moyenne NON PONDÉRÉE** — backlog : pondérer par les heures.
  2. Quand le budget ne colle pas au réel, **on corrige le BARÈME, jamais le taux**.
- ⚠️ Budget **projeté** neutralisé sous **15 %** d'avancement.
- ⚠️ **Le coût de retard modélisé est affiché SÉPARÉMENT.**
- **Seule convention inventée assumée** : règle **1/N** pour répartir la journée d'un ouvrier entre
  plusieurs parcelles. ⚠️⚠️ **Elle suppose qu'une parcelle se fait dans la journée.**
- ★ **Exercice comptable** (05/08) : fenêtre de **dates** ≠ campagne structurelle ;
  `_planPaidRange` × taux individuel = masse salariale ; ⚠️ **la conduite du tracteur est DÉJÀ dans
  le planning, seul le CARBURANT s'ajoute.**

### ★ Décider — les six bugs
fenêtre comptant les jours passés · trajets ignorés · enveloppe multi-tâches · surface J1 à 0 ·
fin divisée par le pool · **trois définitions de « une journée »**.
★ **`_pilEchelle(cd)`** — échelle horizontale **commune** aux trois graphes, prouvée par exécution.

### ★★ Simulateur « Renfort : combien, et quand »

**Modèle M3, gelé** : socle permanent **donné** ; décision = **profil de renfort par semaine** ;
le non-absorbé **glisse** (+15 %/sem, `CONFIG.eco.k_retard`) ; **rien n'est jamais abandonné** —
★ **sauf les travaux couperet**. ETP tracteur **mesuré**. Classement **parmi ce qui boucle**.
Recherche **gloutonne** `_rfBest` (~250 simulations).

★★ **Vendange-couperet** : drapeau **`t.couperet`** en priorité, repli sur le nom en **égalité
stricte**. Un travail couperet non servi est **PERDU** (heures + %, **jamais des euros de récolte**).
**Tableau des fenêtres** par **dichotomie sur la vraie simulation**. Plafond **`_RF_RMAX_DUR = 150`**.
**Calage mesuré** : 40 vendangeurs **au début** = récolte perdue et ~196 k€ pour rien ; **dans la
fenêtre** = ~48 k€ et ça boucle ; besoin réel **37**. 77 tests.
⚠️ Reste à purger : le calcul de **pic** mort dans `_rfCtx` — ⚠️ `ctx.pic` introuvable sous ce nom.

### ★ Ordre de passage — la carte
Marqueurs dorés numérotés, ligne pleine J1, pointillés ensuite, repli SVG hors ligne.
⚠️⚠️ **Le patch a d'abord échoué en silence** : les parcelles ne stockent pas leurs coordonnées.
★ **05/08 : `CONFIG.ordre_passage_t` (par TÂCHE) arrive enfin sur l'écran de l'équipe** —
**l'ancien `CONFIG.ordre_passage` n'était lu par AUCUN autre fichier : le message « partagé à
l'équipe » était faux depuis le premier jour.**

## 20c. La Réserve

- Intrants, achats, inventaires, **bilan matière** (RE délégué UE 2021/771 art.1).
- Onglet Fûts : accordéon par fournisseur, chips par millésime d'achat, références **scopées par
  fournisseur**, inventaire PDF, fusion des lots identiques **à la création**.
  ⚠️ Éditer un lot pour le rendre identique à un autre ne fusionne **pas**.
- ⚠️ Le test **deux appareils** reste **manuel**.
- ★★ **L'onglet Fûts porte le PARC** : bloc d'état en tête, registre des mouvements en pied,
  bouton « Se séparer de fûts » (§20e).
- ★ **`_rsvEnsureOverlays()` construit tous les overlays en JS.** Suivre ce patron.
- ★ **`window.saveIntrants` est exposé** : `cave.js` en a besoin pour rendre les fûts au parc.
- ★★ **`reserve.js` est le PATRON DE RÉFÉRENCE pour appeler les moteurs `_mvFut*`** :
  `window._mvFutParc(INTRANTS, window.CAVE_ELEVAGE, null)`.
  **Quand un moteur partagé est appelé depuis un nouveau module, aller lire comment l'appelle celui
  qui s'en sert déjà.**

---

## 20d. ★★ LE MILLÉSIME — la 3ᵉ section de la Cave

**Le diagnostic.** La Cave enregistrait très bien **ce qui s'est passé**. Elle ne disait rien de
**ce qui va arriver**, ni de **ce que ça vaut**.

**L'écran.** Troisième onglet de section, conteneur `#cave-view-mil` **à l'intérieur de
`#page-cave`**, deux sous-onglets : **⏭️ Ce qui vient** et **🧬 La ligne de vie**.

⚠️ **Le conteneur doit être DANS `#page-cave`.** Première tentative : l'ancre comptait deux
`</div>` et le bloc est tombé **hors** de la page. **Ne jamais compter les balises fermantes pour
se positionner.**

### « Ce qui vient » — l'agenda des quatre semaines

Tout se déduit de ce qui est **déjà saisi**. **Rien de plus à remplir.**

- **Échéances d'ouillage** : `last_ouillage + seuil`, puis récurrence.
  ★★ **Le seuil est celui du MILLÉSIME de la cuvée** (`_mlSeuil(c)`, §20h).
  ⚠️⚠️ **Il se calcule DANS la boucle, jamais avant** : hors boucle, l'agenda cadençait toute la
  cave au même rythme malgré des seuils différents.
  ⚠️ **La fenêtre vaut `nSem*7−1`** : sur 4 semaines, J+28 est **exclu**.
- **Cuves à mesurer**, **fin de fermentation estimée**, **fermentation qui ralentit**,
  **température haute**, **décuvage possible**.

★★ **DEUX pentes, volontairement distinctes** (`_mlProjFA`) :
- **penteMoy** (3 derniers relevés) → **PROJETTE** la date de fin ;
- **penteRec** (2 derniers relevés) → **DÉTECTE** l'arrêt.

Une moyenne sur 3 points **lisse le décrochage récent**.
★★ **Ce patron a été repris tel quel pour la MALO** (`_mlProjMalo`, §20h).

⚠️ **Une cuve de moins de 3 jours ou de moins de 3 relevés n'est PAS projetable.** On affiche
« démarrage », pas une date. **Même garde pour la malo.**

⚠️⚠️ **LE BUG DU `||` SUR ZÉRO.** `(ordre[a.kind] || 9)` : `'alerte'` vaut **0**, et `0 || 9` rend
**9** → **l'alerte tombait en dernier**. **Correctif : `(ordre[k] != null ? ordre[k] : 9)`.**

⚠️ **Le nom d'une cuvée n'est PAS unique.** Seul l'`id` l'est. `_mlNomCuvee()` ajoute le millésime.

★ **Chaque ligne renvoie vers l'écran qui existe déjà** (`_mlGo`). ⚠️ **`_mlGo` ne change PAS de
page** : il pose `caveSection` et appelle `renderCave()`. **Depuis le Pilotage il faut `goTo('cave')`
d'abord** — d'où le wrapper `_pcavGo`.
★ **09/08 : `_mlGo` ne connaissait pas le kind « soutirage »** — le bouton « Soutirer » du Pilotage
ouvrait le **Cuvier**. Corrigé avec le passage du soutirage à source unique
(`_caveLastSout`/`_caveSoutOps`) ; ★ le toggle « sous tirage » a été **retiré** : *un oui/non ne
décrit pas un geste répété*.

### « La ligne de vie » — le parcours du millésime

Un **flux vertical**, largeur proportionnelle au volume, pertes chiffrées entre les étages,
branche grise pour le raisin vendu. Puis les **rendements par parcelle** face au maximum de
l'appellation, et **l'origine de chaque cuvée**.

⚠️⚠️ **Une perte totale n'a de sens QUE si plus rien n'est en cuve.** **Trois libellés distincts** :
en cuve · en fût · en bouteille.
⚠️ **Les étages de tête à zéro sont retirés.** Un flux qui **grossit** dit l'inverse de la réalité.
★ **`p.rdt_max`** est le **seul ajout de saisie** du lot : posé une fois par parcelle, admin only.

### Fonctions & pièges

⚠️⚠️ **`_mlChaine` renvoie des TOTAUX, pas le détail des récoltes.**
★★ **`_mlChaine(mil)` a SIX dépendances.** **Un harnais qui les oublie fait lever la fonction, le
`catch` avale, et l'écran sort vide — on croit alors à un bug du code.**
⚠️ **CSS injecté par le module** (`_mlInjectCss`, préfixe `mlx-`).
⚠️ **Le filet de `renderCave`** : une valeur de `caveSection` hors des **trois** sections connues
replie sur l'Élevage.

---

## 20e. ★★ LE PARC À FÛTS — le fût comme objet suivi

### Le modèle, corrigé par Nico

⚠️⚠️ **LA RÉSERVE CONTIENT L'INVENTAIRE DES FÛTS LIBRES, PAS UN HISTORIQUE D'ACHATS.**

| | Source | Signification |
|---|---|---|
| `INTRANTS.futs` | La Réserve | fûts **vides et disponibles** |
| `cuvee.tonneaux` (élevage) | Le Chai | fûts **en vin** |
| `cuvee.tonneaux` (embouteillée) | — | **ignoré** : les fûts sont retournés au parc |

**PARC = les deux additionnés.** Ce ne sont pas deux comptabilités à réconcilier : ce sont **deux
états du même fût**.

★★ **Une première version faisait l'inverse** — elle soustrayait, et annonçait **−6 fûts libres**.
**46 assertions étaient vertes. Un modèle faux passe tous les tests qu'on écrit pour lui.**

### ⚠️⚠️⚠️ LA SIGNATURE — le bug du 07/08

```js
_mvFutParc(INTRANTS, CAVE_ELEVAGE, curY)   // ← ELLE PREND SES DONNÉES EN ARGUMENT
```

**Pourquoi** : la famille `_mvFut*` vit dans `utils.js`, importé **en premier**. Elle ne peut pas
compter sur les globales au chargement, donc elle les reçoit.

**Ce qui s'est passé** : le Pilotage appelait `window._mvFutParc()` **nu** → tout tombait à zéro,
sans erreur, sans trace. Nico l'a vu sur une capture : quatre tuiles à zéro.
**Pourquoi 162 assertions ne l'ont pas vu** : le harnais stubait `_mvFutParc = () => PARC`.

★★★ **LES DEUX RÈGLES QUI EN DÉCOULENT :**
1. **Vérifier la SIGNATURE D'ENTRÉE d'une fonction, pas seulement son contrat de retour.**
2. **Ne jamais stuber un moteur partagé : l'extraire du vrai fichier et le brancher**, et
   **vérifier que le test attrape le bug** en le réintroduisant volontairement.

### Le piège de type

⚠️ **`INTRANTS.futs[].annee` est une CHAÎNE** ; **`cuvee.tonneaux[].annee` est un NOMBRE**.
`'2023' !== 2023` : **tout rapprochement naïf renvoie zéro, en silence.**
★★ **Convention retenue dans toute la Cave : normaliser en CHAÎNE via une fonction dédiée
(`_caveMilKey`, `_pcavMilKey`, `_copMil`), et comparer chaîne à chaîne.**

### Les mouvements — `INTRANTS.fut_mouv`

| Sens | Motifs |
|---|---|
| **Entrées** | `achat` 🛒 · `embouteille` 🍾 · `retrait` 🔓 |
| **Sorties** | `entonnage` 🍷 · `vente` 💶 · `retour` ↩️ · `destruction` 🗑️ |

★ **`MV_FUT_SEP` = `['vente','retour','destruction']`** : les **trois seuls motifs** pour se séparer
d'un fût. **L'entonnage n'en est pas un.**

★★ **L'INVARIANT CENTRAL** : **entonner, embouteiller et retirer d'une cuvée ne changent PAS le
nombre de fûts du domaine.** Seuls **acheter** et **se séparer** font varier le parc.

### Les quatre gestes

**1. Entonner** — le décuvage pioche dans le parc, du plus vieux au plus neuf, et **SIGNALE quand il
puise dans le neuf**. ⚠️ **REPLI** : parc vide ou `utils.js` antérieur → **le stepper d'avant
revient**.
**2. Mettre en bouteille** — ⚠️ **le retour se fait AVANT de poser `statut='embouteille'`**.
**3. Retirer des fûts d'une cuvée** — le geste **existait déjà**, avec cinq motifs.
**4. Se séparer de fûts** — sortie définitive, **admin only**, sur les fûts **libres** uniquement.
⚠️ **Distinct de `_rsvDelFut`** : effacer une erreur de saisie n'est pas un mouvement de fûts.

### Ce qui n'a PAS été fait, et pourquoi

⚠️ **Le fût n'est pas nominatif — volontairement.** On reste à la maille du **lot**.
⚠️ **Le rattachement des anciens fûts est maquetté mais NON intégré.**
⚠️ **`CONFIG.cave.fut_prix` est facultatif.** Sans lui, **jamais d'euros inventés**.
★★ **Le parc reste INDÉPENDANT DU MILLÉSIME** — arbitrage explicite de Nico.
⚠️ **La légende de la pyramide mélangeait deux axes.** Un fût peut être **neuf ET libre**.
**Quand une légende énumère, vérifier qu'elle énumère UN seul axe.**
★ **Le VOLUME d'un fût, lui, est désormais réglable dès l'installation** (`CONFIG.cave.fut_l`,
§18b) — 225 L en Gironde, 228 L en Bourgogne.

---

## 20f. ★★ LES DOCUMENTS DE CAVE — registre & bilan

Deux documents imprimables, produits par `cave.js`, qui **n'écrivent rien** : ils lisent.
★★ **Depuis le 09/08 ils suivent la charte `MV_DOC` (utils.js)** : même page, mêmes polices, même
en-tête à filet d'or — et ils **s'impriment** au lieu de télécharger un `.html`.

### Le patron commun — à réutiliser pour tout nouveau document

```js
var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
  + '<title>…</title>'
  + '<link rel="stylesheet" href="/fonts/fonts.css">'      // Cormorant + Outfit, auto-hébergées
  + '<style>body{margin:0;background:#fff}' + XX_CSS + '</style></head>'
  + '<body><div class="xx-doc">' + body + '</div>'
  + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
  + '</body></html>';
var blob = new Blob([html], {type:'text/html'});
var w = window.open(URL.createObjectURL(blob), '_blank');
if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
```

⚠️ **`'<scr'+'ipt>'` est obligatoire** : écrire `<script>` en clair dans une chaîne JS ferme le
script de la page hôte.
★ **Ce patron a resservi le 09/08** pour la liste imprimable des identifiants de l'équipe (§18b).

★ **Choix de la période** : si une seule existe → export direct, **sans question**.
**Ne jamais poser une question dont la réponse est unique.**

### Le registre des manipulations œnologiques

**Périmètre — les MANIPULATIONS, pas le suivi.** Ce qu'on **ajoute** au vin ou ce qu'on lui **fait
subir**. L'ouillage, les mesures de densité et les analyses n'en font pas partie. ★ **Mais ils sont
comptés en pied**, jamais passés sous silence.

★ **Un type absent de `RM_TYPES` n'entre PAS au registre** — c'est la liste blanche qui décide.

⚠️⚠️ **DEUXIÈME OCCURRENCE DU BUG `o.cuvees`** : `_rmLignes` testait `(o.cuvees || [])` au lieu de
`cuvees_ids` → **la colonne « contenant » sortait VIDE pour toutes les opérations du Chai**.
★★ **Quand on trouve un champ mal nommé, grepper le fichier entier avant de refermer.**

⚠️ **Limites écrites DANS le document** : « Ce n'est pas une déclaration officielle. Ma Vigne
prépare, l'exploitant déclare. » · doses de SO₂ en cL non converties · le Cuvier n'enregistre pas
d'intervenant · aucun plafond réglementaire affiché.

### Le bilan de campagne

**Recadré par Nico** : ce n'est **pas** une déclaration de récolte. C'est un **état interne de fin
d'année**, informatif.
★★ **C'est un AGRÉGATEUR, il n'invente aucun calcul.**

★★ **Trois choix qui font la justesse du document :**
1. **La surface travaillée additionne les passages.** C'est **l'effort**, pas l'étendue.
2. **Le rendement moyen ne porte que sur les parcelles récoltées.**
3. **`p.arrachee` sort de la surface exploitée.**

⚠️ **Il part du JOURNAL, pas de `TRAVAUX`** (lié à la période active, pas à la campagne).
⚠️ **Ce qu'il ne contient pas, et le dit** : ni heures, ni coûts.

### ⚠️ Ce que l'intégration a appris

1. **La section Import/Export vit dans `index.html`**, pas dans `reglages.js`.
2. **`_bcExportChoix` doit être une expression `window`**, pas une déclaration — C15.
3. **`_mlChaine` n'expose pas `recoltes`.**
4. ★ **Le fichier contient les échappements `\u00e9` EN CLAIR** → une ancre Python doit être une
   **raw string**.
5. **Les globales lues avec repli** : `window.JOURNAL || []`, `window.TRAITEMENTS || []`.

---

## 20g. ★★★ PILOTAGE › CAVE — le cockpit décisionnel

### Le diagnostic

Les six autres onglets ont chacun un **verbe**. **Cave était le seul sans verbe.**
⚠️ **Pire : c'était un FOSSILE.** Ses trois sous-onglets annonçaient comme « à venir » des choses
livrées depuis — dont une note de chantier *« Rien à construire — on réorganise »*, **visible du
client**.
★★ **Leçon : un écran qui annonce « à venir » doit être re-vérifié à chaque livraison de son
domaine.** Chapelle a vu cette note pendant des semaines.
★★★ **C'est le même défaut que l'aide contextuelle et le guide (§27), et que la liste « À finir chez
ce client » de l'assistant d'installation (§18b) : ce que l'app raconte d'elle-même n'est jamais
testé.**

### La refonte — trois sous-onglets, un verbe chacun

Clés `urg` / `mil` / `parc`, avec **table de migration `_PIL_CAV_MIGR`**.

**1. ⏱️ Ce qui presse** — un **verdict** en tête, puis les blocs.
★★ **L'ORDRE suit le calendrier, la PRÉSENCE ne change jamais.**
**Cacher un bloc, c'est le rendre introuvable le jour où il compte.**

**Hiérarchie du verdict** : alerte de fermentation → malo bloquée → cuverie en vendange →
**à soutirer (un GESTE)** → ouillage en retard → dose de SO₂ dans 7 jours → fûts en fin de vie →
« Rien ne presse aujourd'hui ». ★ **Un geste passe devant un rappel de date.**

**2. 🍇 Le millésime** — 4 tuiles, flux benne→bouteille, rendement, comparaison N-1, bandeau
multi-millésimes.
**3. 🛢️ Le parc & le coût** — état, pyramide, part des anges, mouvements.

### ⚠️ Le millésime affiché n'est pas celui de la campagne

Le 7 août, la campagne vient de s'ouvrir mais le vin en cave est celui de l'année précédente →
**l'écran serait blanc tout l'automne**. `_pcavCtx` garde la campagne courante **dès qu'elle a de la
matière** (`_pcavMatiere`), sinon recule d'un cran, **et l'écran le dit**.

### ⚠️ Le domaine vierge

`_pcavMatiere(ch)` : sans ce test, un domaine vierge voyait **quatre tuiles à zéro** au lieu d'une
phrase honnête.

### Le seul calcul neuf de tout le cockpit

**Le volume restant à rentrer** — on applique le rendement moyen déjà constaté aux surfaces non
récoltées. **C'est un ordre de grandeur, et l'écran le dit.**
★ Tout le reste **consomme**. **Consommer, c'est l'inverse de dupliquer.**

### ⚠️ Les champs que j'ai inventés et qui n'existaient pas

`pret_embouteillage` et `pret_decuvage` : **aucun des deux n'existe.**
**« Prêt à décuver » n'est pas un drapeau : c'est `_mlProjFA(cv).etat === 'sec'`.**
★ **« Prêt à embouteiller » N'EXISTE PAS** — le bloc affiche donc un fait vérifiable, la durée
depuis `date_entree`, plutôt qu'un « prêt » que l'app ne sait pas déterminer.

⚠️ **Préfixe : `pcv-` était DÉJÀ PRIS** → `pcav-`.
**Vérifier la collision d'un préfixe AVANT d'écrire une ligne de CSS.**

---

## 20h. ★★★ LA SÉRIE MILLÉSIME — un millésime est une entité à part

### Le modèle, dicté par Nico

> « chaque action correspond au millésime correspondant. Un ouillage des fûts du millésime 2025 est
> différent de celui du 2026 car on ne met pas les vins pour ouiller. »
> « il faut que l'interdiction soit pour toutes les opérations, chaque millésime est une entité à
> part (d'ailleurs ils sont dans des caves séparées). »

**Conséquences, toutes appliquées** : une opération porte sur **un seul millésime** · l'ouillage se
fait avec le vin **de ce millésime** · le **seuil d'alerte** peut différer par millésime · la **part
des anges** se lit millésime par millésime · le **registre** et le **bilan** aussi ·
⚠️ **SAUF l'inventaire des fûts**, qui reste **indépendant de l'année**.

★★ **Le « tout confondu » reste nécessaire, mais PAS au même endroit que la saisie.**

| | « Tous » ? | Où |
|---|---|---|
| **Sélecteur de SAISIE** (formulaire d'opération) | ❌ **jamais** | `#cop-mil-wrap` |
| **Filtre de CONSULTATION** (Chai) | ✅ et c'est le défaut | `_caveMillFilter` |
| **Pilotage** | ✅ par nature | bandeau « En cave en ce moment » |
| **Parc à fûts** | ✅ toujours | inventaire, hors millésime |

**Si « Tous » apparaissait dans le formulaire de saisie, il rouvrirait exactement la porte qu'on
ferme.**

### Ce que chaque lot a apporté

- **Saisie** : rang de millésimes au-dessus des chips de cuvées ; **changer de millésime VIDE la
  sélection** ; « Toutes » devient « Tout le 2026 · 12 fûts » ; ★★ **garde finale avant écriture**
  dans `saveCaveOp` ; ⚠️ **un seul millésime en cave → le rang est masqué**, l'écran est strictement
  identique à avant.
- **Chai** : `ouillage_par_mil` (3–30 j, admin only) ; ★★ **SOURCE UNIQUE `_caveSeuilOu`** — **onze
  sites** lisaient le seuil chacun de leur côté ; rétro-compatible par construction.
  ⚠️⚠️ **Le filtre de consultation EXISTAIT DÉJÀ** — j'en avais écrit un doublon avant de le
  découvrir. **Ce qui manquait vraiment : les CHIFFRES ne suivaient pas le filtre.**
  ⚠️⚠️ **`_caveAlerts()` renvoie `{cuv, daysSince}`, PAS des cuvées** → un filtre posé sur le
  mauvais objet faisait **disparaître toutes les alertes**. Trouvé par une assertion fausse.
- **Pilotage** : part des anges **une ligne par millésime** (★ fenêtre **12 mois glissants**, pas la
  campagne) ; ouillage groupé par millésime ; ⚠️⚠️ **`_mlOuillages` calculait le seuil HORS de la
  boucle** ; ⚠️ **la part des anges était enfermée derrière la disponibilité du parc à fûts**.
- **Documents** : registre et bilan **par millésime** ; une opération non rattachable **sort du
  filtre** plutôt que d'atterrir dans le mauvais document ; ★ **repli complet** sur la campagne.
  **Le bilan assume DEUX AXES, et l'écrit DANS le document.**

### ★★ Le lot MALO — projeter sur des mesures, pas sur une expérience

**Trois corrections de modèle successives** ont mené là, la dernière ayant entraîné la **suppression
complète** d'une première implémentation qui projetait sur la durée des FML passées du domaine :
> « je ne projette pas sur une expérience passée mais sur des valeurs mesurées »

⚠️ **L'acide malique n'était stocké NULLE PART** → ajout du champ `malique` (g/L). **Seul ajout de
saisie de la série**, assumé : la valeur figure sur le bulletin du labo.

**`window._mlProjMalo(c, now)`** — **mêmes deux pentes** que `_mlProjFA`.
Constantes : `_ML_MAL_FIN = 0.10` g/L, `_ML_MAL_PRES = 0.30`.

⚠️⚠️ **Le malique qui REMONTE n'est pas une malo bloquée** : il ne se recrée pas. C'est une erreur
de saisie. Annoncer un blocage enverrait **réchauffer une cuve alors que le problème est dans la
donnée**. Test placé **avant** celui du blocage.
★ **`cuvee.fml_terminee` reste une vérité du vigneron.**

### Bugs préexistants trouvés pendant la série

| Bug | Effet |
|---|---|
| `_mlVolParFut` sur `o.cuvees` | volume d'ouillage proposé calculé sur **tous** les millésimes |
| `_rmLignes` sur `o.cuvees` | colonne « contenant » **vide** dans tout le registre du Chai |
| formulaire d'analyse non pré-rempli | rouvrir une analyse **écrasait ses SO₂ et son AV** |
| `_mvFutParc()` sans arguments | **parc à zéro** dans le Pilotage |
| `_caveAlerts` filtré sur le mauvais objet | **toutes les alertes disparaissaient** sous filtre |
| `_mlOuillages` seuil hors boucle | agenda cadencé au même rythme pour tous |
| `&amp;` passé à `_pcavCard` | titre affiché `Soutirage &amp;amp; malo` |

---

## 21. Design & identité visuelle

- Palette « cave » : `--or`, `--or-pale`, `--terre`, `--cave`, `--cave-2`, `--horizon`, `--vert`,
  plus **9 teintes de tags**.
- Typographie : **Cormorant Garamond** (valeurs clés, titres), **Outfit** (le reste).
  ⚠️ **Cormorant a des chiffres elzéviriens** : dans un document imprimé, le « 1 » d'un numéro se
  lit « i ». Numéros en Outfit, titres en Cormorant (§18c).
- **Transitions** : `@keyframes pageInFwd`/`pageInBack` = **fondu d'opacité pur, aucun `translate`**.
  Pas de swipe (terrain) — **tap uniquement**.
- **Touch targets ≥ 44 px**, `env(safe-area-inset-*)` sur tous les en-têtes, modales, feuilles, toasts.
- **Mode ☀️ Plein soleil** : ✅ **câblé**.
- ★ **Aide contextuelle** : pastille **« ? Aide »** sur les 10 modules, `_mvInjectHelpBtn()`
  (**idempotent**). ⚠️ Contenu **texte pur** uniquement (C19). **Détail complet au §27b.**
- **Pages publiques** : `guide.html` et `demarrage.html` en HTML/CSS/JS **zéro dépendance**.
  ⚠️⚠️ **Ne pas régénérer ces pages par LLM.** ★★ **Le découpage du guide (§27d) respecte cette
  règle : il DÉPLACE des octets, il n'en réécrit aucun — la preuve étant que la sortie du
  générateur était identique octet par octet à l'original avant toute correction.**
  ★ **Même principe appliqué le 09/08 au déplacement d'un bloc dans `admin-gt.js`** : mêmes
  caractères, ordre différent, prouvé par comparaison de la liste triée des caractères.
- ⚠️ **`.note` sur les pages juridiques est réservée aux avertissements destinés au LECTEUR**.

## 21b. ★★ Cadrage — l'en-tête reste figé

**Cause racine** : `@keyframes` animaient un `transform:translateX()` avec
`animation-fill-mode:forwards` → le transform **restait posé en permanence**.
1. les `position:fixed` internes perdaient leur référence de viewport ;
2. le `translateX` initial créait un **débordement horizontal permanent** ;
3. **aucun `position:sticky` ne pouvait fonctionner**.

**Correctif** — keyframes en **fondu d'opacité pur** + bloc **« CADRAGE »** en fin de `styles.css`.
⚠️ **Scope délibéré** : les barres d'onglets de **second niveau** restent **non sticky**.
⚠️ **Piège d'audit** : le commentaire du bloc CADRAGE mentionne encore `translate` — lire le
**corps** des keyframes.

## 21c. ⚠️ Contraste — la cause racine

**UI-4** a rendu `.mod-header` clair pendant que le garde-fou continuait de cibler
`.mod-header .mvu-tab` comme un **contexte sombre** → **crème sur papier, 1,09:1, sur 8 modules**.

**Outil d'audit** : `mv-audit-contraste.js`, à coller dans la console **authentifiée**.
⚠️ **`.mod-header` est CLAIR**, le sombre vit sur `.mod-header-top`. Greffer `.mod-header` sur un
en-tête maison sombre le repeindra en clair → utiliser un **hôte dédié** (modèle `.pil-metahost`).

## 21d. Couleurs, breakpoints & thème saisonnier

- **~3 150 couleurs hex en dur**, dont **~2 300 dans les JS**.
  ★ **Exception assumée** : les couleurs passées à `showToast(msg, couleur)`. Palette de fait :
  **`#C0392B`** refus/accès, **`#B85A1A`** avertissement, **`#3D6B27`** succès.
- **Breakpoints RÉELS** : `560`, `600`, `640`, **`760` ET `768` avec une zone morte de 7 px**,
  `900`, `980`, `1200`. ⚠️ **+ `@media(max-width:880px)` injecté par `pilotage.js`**.
- ★ **Plan retenu pour la zone morte (en attente du go)** : passer l'unique `max-width:760px`
  (styles.css:2078) à **`767.98px`** — **1 ligne CSS, 0 JS**. ⚠️ Le `max-width:760px` de la Réserve
  (~3292) est un **conteneur**.
- ⚠️ **Sous 768 px, le `body` est plafonné à 430 px**.
- **~480 classes CSS orphelines** en analyse statique — ⚠️ **non actionnable tel quel**.

### ★ Thème saisonnier — étude (décision en attente)

`#app-root` porte déjà `data-theme` → un second attribut **`data-saison`** suit le même patron.
**4-5 variables repeignent tout.** Décisions : **mois civil**, jamais le nom de période · les 3
couleurs de toast **ne bougent jamais**.

---

## 22. Terrain, mobile & iOS

- Android est l'appareil quotidien de Nico, mais l'app doit être **complète sur iPhone/iPad et
  desktop**.
- **Tap uniquement**, jamais de swipe : on l'utilise avec des gants, entre deux rangs.
- `env(safe-area-inset-top)` sur **tous** les en-têtes.
- **`font-size` ≥ 16 px sur tous les champs** — en dessous, Safari zoome automatiquement.
  ★ **Règle appliquée aussi aux écrans GT** : les champs de l'assistant d'installation et de la
  création de comptes sont en 16 px (§18b).

### ✅ Les boîtes natives : ZÉRO

⚠️ **`prompt()` / `confirm()` / `alert()` natifs sont BLOQUANTS en PWA iOS** — `prompt()` ne rend
**rien**, et une `alert()` non affichée transforme un refus explicite en **échec silencieux**.

⚠️ **Toute occurrence restante de `alert(`/`confirm(`/`prompt(` est un COMMENTAIRE.** Un grep brut
les compte : **filtrer les lignes en `//` ou `*` avant de conclure.** ★ Le preflight, lui, blanchit
les commentaires — **se fier au preflight, pas au grep**.

**Traduction retenue :** refus → `showToast(msg,'#C0392B')` · champ manquant →
`showToast(msg,'#B85A1A')` **+ focus sur le champ** · succès → `showToast(msg,'#3D6B27')` ·
suppression → `openConfirmDel(...)` (6 paramètres) · saisie → **`openPrompt({...})`** (§22c).

---

## 22b. ★★ RESTITUTION — ce que l'app rend à celui qui la remplit (série UX-R)

**Le diagnostic.** Ma Vigne demandait à un ouvrier de saisir plusieurs fois par jour pendant que dix
modules servaient à **exploiter** ces saisies. **Aucun ne lui était destiné.**

**Le principe.** La gratification ne se fabrique pas, elle se **restitue**.

| Lot | Apport |
|---|---|
| **R1** | La fiche **« c'est fait »** remplace le toast de 2 s après validation |
| **R2** | **« Ma part du chantier »** — widget d'accueil |
| **R3** | **« Ma trace »** (`ovMaTrace`) — la page personnelle de la campagne |
| **R4** | **Le mur du domaine** (`ovMur`) + le **mot du chef de culture** |
| **R5** | **Chantier terminé en plein écran** + **comparaison à l'an dernier** |

### Architecture — une seule définition de chaque chose

- **`_mvPartCalc(tache, nom)`** est la **source unique**. ★ Pondérée par l'effectif des équipes.
- **`_mvdsOpen(o)`** est le **composant unique** de retour après validation, appelé par **4 chemins**.
- **`_mvdsSnap(tache)`** doit être appelé **en tête** d'un chemin de validation.

### ⚠️ Invariants de calcul

1. **`mine + them === done`, toujours.**
2. **Règle 1/N**, la même que le coût par parcelle du Pilotage.
3. **Une parcelle validée sans entrée de journal** reste dans « l'équipe ».
4. **Le mur dédoublonne par `parcelle|tache`.**
5. **La comparaison N-1 se fait par RANG dans la campagne**, jamais par date brute.

### ⚠️ Garde-fous produit — non négociables

- **Zéro badge, zéro point, zéro série.** Le vocabulaire est celui du métier.
- **La surface, pas les heures.** Les heures appartiennent à la paie.
- **Aucun classement entre personnes.** Le mur est **alphabétique**.
- **La rareté fait la valeur** : l'écran plein n'apparaît que cinq à six fois par campagne.
- **Le chemin rapide reste rapide.**
- ★★ **Corollaire pour toute la suite** : **aucune amélioration de la mesure ne doit se payer par
  une saisie nouvelle sur le terrain.**
  ★ **Quatre exceptions assumées, toutes hors du terrain** : `p.rdt_max` (un réglage posé une fois
  par parcelle), **`analyse.malique`** (une valeur recopiée du bulletin de labo), — par
  construction — **rien du tout dans le widget « Mise en route »**, qui ne fait que **lire** (§27c),
  et ★★ **toute la série installation, qui se saisit dans la console GT, jamais chez le client**
  (§18b).
  **Le lot « stock de bouteilles » a été abandonné parce qu'il demandait, lui, une vraie saisie.**

### Réglages & données

- `CONFIG.mur_mot` — écriture **admin only**, contrôlée **dans la fonction elle-même**.
- `CONFIG.mur_visible` = `'equipe'` (défaut) ou `'admin'`.
- **Aucune nouvelle collection, aucun nouveau champ.**
- **`HOME_NEW_TOP`** : liste explicite de widgets insérés en **`unshift`**.

---

## 22c. ★★ `openPrompt` — la primitive de saisie

**Jumelle d'`openConfirmDel`.** Elle existe surtout pour qu'un développement futur n'ait **plus
aucune raison** de réintroduire un `prompt()`.

- **Overlay `#ovPrompt`** dans **`index.html`** (racine). Six ids en dur, préfixe **`mvp-`**.
- **`openPrompt(o)` + `_execPrompt()`** dans `app.js`. Options : `{titre, sub, valeur, unite, icone,
  btnLabel, type:'texte'|'nombre', placeholder, cb}`.
- **Contrat identique à `prompt()`** : `cb` n'est appelé **que** si l'on valide.
- ⚠️ **`el.value` est assigné EN JS**, jamais par un attribut HTML.
- **Garde** : overlay absent → `showToast('Saisie indisponible')` au lieu d'un crash.
- ⚠️ `sub` est posé via **`textContent`** → **ne pas** y passer `_escHtml(...)`.
- ★★ **Deux `openPrompt` peuvent s'enchaîner** — patron de la saisie des écartements (§30) et du
  bilan de campagne. ⚠️ **Toujours prévoir le repli si `openPrompt` manque.**

---

## 23. Sécurité & performance

- **PERF-1** : `_pullKeys` lit les 26 collections **en parallèle**. **PERF-2** : Leaflet **lazy + SRI**.
  **PERF-3** : skeletons (`window._mvSk(kind)`, 8 types → zéro layout shift).
  ★ **PERF-4** : `Cache-Control: immutable` sur `/assets/**`.
- **A11Y-1 / A11Y-2** livrés ; batch complémentaire au backlog. ⚠️ Le manifest par tenant déclare
  `purpose:'any maskable'` sur des icônes qui ne le sont pas.
- ✅ **SEC-3 : la CSP est en enforce.**
- **Cause racine des bugs silencieux : les `catch{}` vides — ~234 mesurés**, dont **~164 dans
  `app.js`**. **C14 empêche désormais d'en ajouter.**
  ★ Comptes de référence sur les fichiers touchés en août : `cave.js` **4** · `utils.js` **10** ·
  `pilotage.js` **16** · `reserve.js` **1** · ★ `admin-gt.js` **7** · `leads.js` **1**.
  **Ces nombres n'ont pas bougé** — chaque repli neuf trace via `_pcavLog` ou `logError`.
- Autres dettes : ~1 186 globals `window` · **6 fichiers JS > 2 000 lignes** · ~51 `setTimeout`
  ≥ 200 ms · 32 sommes de surface à la main.
- **Points sains confirmés** : versions cohérentes, tous les fichiers passent `node --check`, zéro
  demi-surrogate, zéro `<div>` dans `<button>`, zéro id dupliqué, rules exemplaires, **aucun appel
  dynamique** → une purge guidée par grep est **sûre**.

---

## 24. Pièges de build / CSS / HTML / modules ES — checklist

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

> **Incident fondateur (`tracSessionId`)** : patcher une copie périmée de `/mnt/project` a réintroduit
> un bug corrigé. **Toujours repartir du DERNIER fichier livré** — désormais, du dépôt GitHub.

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
    seul juge de C11→C22.
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

### ★★★ La checklist de clôture d'un lot (11/08)

Un lot n'est livrable que quand **les six** sont vraies. Les écrire dans la réponse, pas les penser.

1. **Preflight vert** — `node scripts/preflight.mjs`, 0 erreur. Après une **baisse** de compteur
   (C14, C19…), **regraver** : `--baseline`. Après une **hausse**, corriger, jamais regraver.
2. **Cliquets** — `lint-cliquet.mjs` et `lint-vocabulaire.mjs`. Vérifier qu'ils sont **branchés**.
3. **Syntaxe** — `node --check` (CJS) / `--input-type=module --check` (ESM) · accolades CSS
   équilibrées · balance des balises HTML · scan demi-surrogates.
4. **Versions** — bump APP (`APP_VERSION` + **les 4 affichages réels** d'`index.html`) **ET** SW
   (en-tête + `CACHE_NAME` + les 2 `console.log` + une ligne de changelog **prépendée**) dès qu'on
   touche `index.html` / `app.js` / `utils.js` / `styles.css`. Un module JS seul = **aucun bump**.
5. **`WHATS_NEW`** — prépendé, jamais remplacé, rédigé **du point de vue de l'utilisateur** (le
   symptôme vécu, pas la cause technique), **vérifié en l'exécutant en Node**.
6. ⚠️⚠️⚠️ **L'AIDE** — **Règle d'or n°4**. Fiche `MV_AIDE` du module touché relue **contre l'écran
   neuf**, section du guide, `_mvtSteps`, et tout écran qui énumère ce qui reste à faire. Écrire
   « fiche relue, rien à changer » si c'est le cas — pour que ce soit un constat, pas un oubli.

**Et ce qu'on ne peut PAS cocher côté Claude** — le dire explicitement à la livraison :
`npm run build`, `npm run test:smoke`, `npm run test:e2e` (pas de navigateur), et **le déploiement**.

---

## 26. Tarifs, facturation & conversion

| Formule | Mensuel | Annuel (2 mois offerts) | Contenu | Utilisateurs |
|---|---|---|---|---|
| **Essentiel** | 29 € | 290 € | Vigne · Journal · Météo · Réglages · export | ≤ 3 |
| **Vigneron** | 49 € | 490 € | + Tracteur · Registre phyto · catalogue AMM/DAR | ≤ 10 |
| **Domaine** | 79 € | 790 € | + Cave Élevage · Planning RH · Pilotage · La Réserve | illimité |

Options : `OPT-KML`, `OPT-FOR`, `OPT-MIG` (dès 200 €), `OPT-CUSTOM`. Codes abonnement figés
`ABO-{ESS|VIG|DOM}-{M|A}`. Support **par e-mail uniquement**.

### ✅ Installation — la grille est TRANCHÉE

| Formule | Forfait installation HT | Accompagnement inclus |
|---|---|---|
| Essentiel | **490 €** | **10 h** |
| Vigneron | **690 €** | **15 h** |
| Domaine | **990 €** | **20 h** |

- **Au-delà du volant inclus : 60 €/h.**
- Nouveaux codes : **`INST-ESS` / `INST-VIG` / `INST-DOM`**.
- ★ **Le raisonnement** (calage : installation Chapelle = **20 h**) : ce n'est pas la formule qui
  fait le coût, c'est la complexité du client. La grille tient parce qu'elle **BORNE le temps
  inclus**, pas parce qu'elle prédit le coût.
- ★★ **Le widget « Mise en route » (§27c) travaille pour ce forfait** : il transforme une partie de
  l'accompagnement en écran, et il **rend visible ce qui reste à faire** au lieu d'attendre un appel.
- ★★★ **Et la série installation (§18b) le rend soutenable** : un forfait de 20 h incluses n'a de
  sens que si l'installation en coûte 9. **C'est ce qui rend le passage à trente clients pensable.**
  ⚠️ Le chiffre reste **théorique** tant qu'une installation à blanc ne l'a pas mesuré.

**Offre de lancement** : −50 % sur l'installation **+** plan Domaine au tarif Vigneron.
⚠️ **Durée jamais bornée — à trancher**, au plus tard avec le devis Garraud.

**Argument ROI en public** : exprimé en **temps, pas en euros** — « 3 à 5 heures de bureau par
mois ». En brochure : **215 h/an** pour 10 ha.

**Essai** : **15 jours**, claim `trial_until` + `plan` ; bandeau J-X ; à l'expiration **lecture
seule, données conservées**.

- **Aucun paiement self-service** : **MAILTO** + `_fbSetTenantPlan` (fenêtre privée `ngdevpro`).
- ⚠️ **Toute facture doit porter le SIRET courant** (…00022) et la mention 293 B.
- ⚠️ Les prix de `logiciel-vigne.html` sont écrits `29&nbsp;€`, d'où des greps qui les ratent.

### ★ Mentions de bas de facture

Une facture ne porte **pas** de clause « Bon pour accord ».
- pénalités de retard = **3 × le taux d'intérêt légal**
- indemnité forfaitaire **40 €** (art. L.441-10 et D.441-5 c. com.)
- **pas d'escompte** · renvoi aux CGU · mention **EI** + SIRET

⚠️ **Vérifier que l'exonération 293 B est bien paramétrée** : 100 € de TVA sont apparus dans un
aperçu de modèle.

## 26b. RGPD & documents contractuels

- **Double qualité** : GUERETTECH est **responsable de traitement** pour le site, **sous-traitant
  art. 28** pour les données saisies dans l'app.
- **Signature en app** : `acceptTerms` → `_mv_signatures` (lecture `gtAdmin` uniquement), avec le
  **hash SHA-256** de la page signée.
- **Catégories traitées** : identification, vie professionnelle, connexion/sécurité. **Aucune donnée
  art. 9.**
- ★ **La série UX-R rend visibles des données d'activité individuelle** → `mur_visible`, ni heures ni
  rémunération, aucun classement. **À mentionner au registre art. 30.**
- Versions **DPA 1.0 / CGU 1.1 laissées fixes**.
- ⚠️ **Vécu** : l'e-mail de confirmation peut ne jamais partir alors que l'enregistrement existe.
- ⚠️ **`dpa.html` contient encore deux gabarits** : **arbitrage ouvert**.
- ★★★ **LE DPA SE SIGNE AVANT LA CRÉATION DES COMPTES DES SALARIÉS.** Ce sont leurs données
  personnelles. L'installation du domaine, elle, peut se faire avant. L'écran de création en lot le
  rappelle **en bandeau, sans bloquer** — Nico est seul juge de l'état de la signature, qui peut
  avoir eu lieu sur papier (§18b).

### ★★ Archivage des documents signés — procédure établie

`sha256Url()` va chercher la page **en ligne** au moment de la signature.
**Conséquence** : **l'empreinte des signatures déjà enregistrées ne correspond plus** si la page bouge.

**À chaque modification de `cgu.html` ou `dpa.html`, même éditoriale :**
1. **Archiver la version sortante** sous `..\mavigne-sauvegardes\juridique\`, nommée
   `cgu-vX.Y-signee-AAAA-MM-JJ.html` — **sans y ajouter une ligne**.
2. **Consigner les SHA-256** avant/après dans `EMPREINTES-documents-signes.md`.
3. **Comparer l'empreinte « avant »** aux champs `cgv.hash` / `dpa.hash` de `_mv_signatures`.
4. **Ne jamais déposer ces archives dans `public/`.**
5. **Ne pas incrémenter la version** pour une correction d'identité de l'éditeur.

**Archive constituée le 31/07/2026** : CGU v1.1 et DPA v1.0 tels que signés par SCEA PH Chapelle &
Fils le 18/07/2026.

## 26c. ★★ Changement d'identité légale — la carte des 10 fichiers

| Fichier | Emplacement | Occurrences | Nature |
|---|---|---|---|
| `index.html` | **racine** | 4 | « À propos », CGU + DPA **embarqués en app**, pied du formulaire |
| `app.js` | `src\` | 1 | pied des **rapports PDF phyto** |
| `cgu.html` | `public\` | 3 | tableau Prestataire, `idcard`, DPA embarqué |
| `dpa.html` · `mentions-legales.html` · `confidentialite.html` | `public\` | 2 chacun | tableaux + `idcard` |
| `demarrage.html` · ★ `guide/12-reglages.html` ou le layout | `public\` / `guide\` | 1 chacun | pied de page |
| `claims.js` | `functions\` | 1 | signature du **mail de confirmation** |
| `README.md` | racine | 1 | en-tête du dépôt |

⚠️ **Deux formats coexistent** : `982 148 116 00022` (espacé) et `98214811600022` (compact).
⚠️ **Trois endroits contre-intuitifs** : le **pied des PDF phyto**, les **CGU/DPA embarqués dans
`index.html`**, la **signature du mail de `claims.js`**.
★★ **La mention du guide vit dans une source de `guide/`**, pas dans `public/guide.html` — **et il
faut REGÉNÉRER** après l'avoir changée (§27d).
⚠️ ★ **Les documents de cave et la liste d'identifiants n'y sont PAS** : ils portent le nom du
**domaine client**, pas celui de l'éditeur.

**Versionnage du lot** : `index.html` + `app.js` touchés → **bump SW**, `APP_VERSION` **inchangé**,
`WHATS_NEW = []`.

★ **Le téléphone suit la même logique de carte.** **Toujours faire l'inventaire par `grep -rn`
AVANT d'annoncer la liste des fichiers.**

---

## 27. Communication & LinkedIn

- Posts **#1 à #3 publiés**. Cadence **mardi, tous les 14 jours, 11h30 ou 20h**.
- Hashtags : `#viticulture #vigneron #bourgogne #agritech #cotedor`.
- Démo publique : **`mavigneapp.fr/?demo=visite`**.
- ⚠️ **Pas de prix ni d'offre dans les posts.** Données salariés réelles **jamais** publiques.
- ⚠️ **Prévenir l'employeur avant toute sortie publique.**
- ★ **Bannière LinkedIn** : ⚠️ **le coin bas-gauche est couvert par la vignette de profil**.
  L'URL affichée pointe **`mavigneapp.fr/logiciel-vigne`** — d'où le **redirect 301**.
- **SEO** : `sitemap.xml` (6 URLs — ⚠️ `mise-en-route.html` n'y entre **jamais**), `robots.txt`,
  JSON-LD, `noindex, follow` sur l'app.
- ⚠️⚠️ **Une recherche sur `"mavigneapp.fr"` ne fait remonter aucune page.** **À vérifier dans
  Search Console** — et pourtant le premier lead entrant est arrivé par le site.
- ⚠️ « Ma Vigne » est un nom **saturé**.
- ⚠️ **Le téléphone est désormais public** (obligation LCEN) : prévoir un filtrage des appels.

★ **Angles disponibles et non exploités** :
1. la **série UX-R** — le seul sujet qui parle aux **ouvriers**.
2. le **lot UX-1** — « quinze messages que mon app n'affichait pas sur iPhone ».
3. **les heures fantômes** — « j'ai trouvé 941 heures de travail qui n'existaient pas dans mon
   propre logiciel, puis 528 de plus le lendemain ».
4. **le registre électronique 2027** — « votre registre phyto devra être un fichier lisible par
   machine au 1er janvier 2027 ».
5. ★★ **le parc à fûts** — « je savais combien de barriques j'avais achetées. Je ne savais pas
   combien étaient vides ». 600 à 900 € la pièce, 20 à 25 % du parc renouvelé chaque année.
6. ★★ **« deux pentes valent mieux qu'une »** — comment une moyenne sur trois relevés masquait une
   fermentation arrêtée.
7. ★★★ **« mon logiciel mélangeait deux millésimes »** — *on ne met pas le vin d'une année dans les
   fûts d'une autre, et pourtant mon application le permettait*.
8. ★★ **« quatre tuiles à zéro »** — comment 162 tests verts n'ont pas vu qu'une fonction était
   appelée sans ses arguments.
9. ★★★ **« mon écran de coûts était faux d'un facteur 5 »** — la mesure, les trois scripts, la
   correction. **Publier ses erreurs de calcul inspire plus confiance qu'une liste de
   fonctionnalités.**
10. ★★★ **« l'aide de mon application décrivait une version d'il y a six mois »** — le sujet le plus
    universel de tous : *tout le monde a une documentation qui ment*.
11. ★★★ **« mon logiciel créait des comptes sur le mauvais domaine »** — un identifiant lu au mauvais
    endroit, un compte qui part chez le voisin, une fiche qui part chez le bon client, et personne
    ne s'en aperçoit avant que quelqu'un essaie de se connecter. **Se termine bien** : un backfill a
    prouvé que le défaut ne s'était jamais déclenché.
12. ★★ **« vingt heures pour installer un client, dont quatorze au clavier »** — la mesure d'abord,
    le code ensuite. Le sujet parle à tous les indépendants qui vendent de l'installation.

---

## 27a. ★★★ LA RÈGLE DE L'ACCOMPAGNEMENT — À LIRE AVANT DE CLORE TOUT LOT

> ⚠️⚠️⚠️ **CETTE SECTION EST LA PLUS IMPORTANTE DU DOCUMENT POUR LA SUITE DU PROJET.**

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

## 27b. ★★ L'aide contextuelle — `MV_AIDE`

**Dix fiches, une par PAGE.** `_mvAideFiche()` lit l'id de `.page.active` → une fiche sans
`#page-<clé>` correspondante est **écrite mais inatteignable** (C22 le vérifie).

**Format d'un point : `[amorce, suite]`, deux chaînes de TEXTE PUR.**
⚠️ Le gras est posé par le **rendu**, jamais par le contenu — une première version portait du `<b>`
dans les chaînes et **C19 l'a refusée, à raison**.

### ★★★ Le point dynamique — l'aide qui lit la structure

**Un point peut aussi être une FONCTION** sans argument qui renvoie `[amorce, suite]`.
Elle est évaluée **à l'OUVERTURE de l'aide**, pas au chargement.

**Pourquoi ça marche** : `utils.js` est importé **en premier**, il ne peut rien lire des autres
modules au démarrage. Mais l'aide s'ouvre **sur un clic**, quand tout est chargé.

**Pourquoi ça compte** : la liste des onglets vient **du code**, plus d'une phrase recopiée qui
vieillit. C'est la réponse structurelle au « Six onglets » du Pilotage.

**Les assembleurs** (`utils.js`) :
- `_mvAideEnum(arr)` → « a, b et c » ; `_mvAideNb(n)` → « Sept ».
- `_mvAideOngletsDom(sel)` → lit les onglets **À L'ÉCRAN**. Légitime parce que **l'aide d'un module
  s'ouvre depuis ce module**. Utilisé par la Cave, La Réserve et Réglages.
- `_mvAideOngletsPil()` → lit **`window._PIL_TABS` / `_PIL_TOOLS`**, exposés par `pilotage.js`.
  ⚠️ **Pas le DOM ici** : la barre du Pilotage **épingle en plus l'outil ouvert**.

⚠️ **Une fonction qui échoue ou ne renvoie rien : le point est simplement OMIS.** Jamais de blanc,
jamais de phrase à moitié écrite — **c'est testé** (73 assertions).

### Ce que chaque fiche doit dire

Le principe : **ce que l'écran fait, ce qui s'y décide, et ce qui piège**. Pas un inventaire de
boutons.

---

## 27c. ★★ Le widget « Mise en route »

**Le problème.** Un domaine qui vient d'être installé n'a **aucun repère** : dix modules, et rien
qui dise par où commencer.

**Où** : `app.js` (rendu, `_dmr*`) + `index.html` (le conteneur `#home-demarrage`).
Widget `demarrage`, **en tête de `HOME_WIDGETS` et de `HOME_NEW_TOP`**, masquable par l'œil.
**CSS injecté** (préfixe `dmr-`) → `styles.css` intact.

⚠️ **ADMIN SEULEMENT.**

### ⚠️ Aucune saisie nouvelle

**Les 7 étapes se cochent en LISANT la base** : nom du domaine · parcelles · contours KML · périodes
de travail · barème des tâches · équipe · première validation.
**Une case à cocher à la main serait une donnée de plus à tenir à jour, donc une donnée fausse.**

⚠️ **Une étape ne propose un geste QUE si l'écran existe côté client.**
**L'application n'a PAS d'import KML** → les étapes « parcelles » et « contours » **CONSTATENT**.

### La disparition — ce qui évite un widget mort

- **Toutes les étapes faites et aucun conseil utile → le bloc s'efface**, pour de bon.
- **Toutes les étapes faites mais un réglage manque → il se réduit à UNE ligne** : le **SIRET** ou
  les **écartements**. ★★ **C'est cette ligne qui absorbe MT-A.**
  ★ **Et depuis le 09/08 au soir, ces deux réglages peuvent déjà être posés à l'installation**
  (§18b) — le conseil ne s'affichera donc que chez les domaines installés avant, ou dont le client
  n'avait pas répondu au formulaire.

⚠️ **La branche « conseil » doit être AUTONOME** (`var k = cons[0]; if(!k){ cacher(); return; }`).

---

## 27d. ★★★ LE GUIDE PUBLIC — SOURCES DÉCOUPÉES & GÉNÉRATEUR

> ⚠️⚠️⚠️ **À REJOUER À CHAQUE MISE À JOUR QUI LE NÉCESSITE. C'est le point n°1 du §27a.**

### Le problème qu'on a résolu

`public/guide.html` faisait **104 ko dans un seul fichier**, 15 sections. Personne ne le relisait.

### La structure

```
mavigne/
├── guide/                        ← LES SOURCES (c'est ici qu'on écrit)
│   ├── _layout.html · _inter.txt
│   └── 01-demarrer.html … 15-glossaire.html
├── scripts/build-guide.mjs       ← LE GÉNÉRATEUR
└── public/guide.html             ← LE RÉSULTAT (ne plus l'éditer à la main)
```

### ★★★ LES TROIS GESTES

```
REM 1. éditer le bon fichier de guide\  (ex. guide\08-cave.html)
REM 2. régénérer
node scripts\build-guide.mjs
REM 3. déployer
firebase deploy --only hosting
```

**AUCUN BUMP.** `guide.html` est une page de `public/` **hors précache**, et `scripts/` n'est jamais
déployé.

### ⚠️ LE PIÈGE — modifier une source sans régénérer

**C'est l'ancien guide qui part en ligne, en silence.** D'où le garde-fou :

```
node scripts\build-guide.mjs --check
```

Il n'écrit rien. Il dit « guide.html est a jour » — ou il **sort en erreur**.

### ⚠️⚠️ POURQUOI LE SCRIPT N'EST PAS DANS LE BUILD

**C'est délibéré.** La règle « jamais un second `&& node scripts/…` » (§6) reste intacte.

### Ce que le script fait, et ce qu'il ne fait pas

**Il ASSEMBLE. Il ne rédige rien.** ⚠️ La règle « **ne pas régénérer ces pages par LLM** » est
respectée : le découpage a été **mécanique**. **Preuve exigée et obtenue : le guide régénéré était
identique OCTET PAR OCTET à l'original** avant toute correction éditoriale.

**Seule exception : le sommaire de gauche**, construit depuis la première ligne de chaque section :

```html
<!-- @nav emoji="🍷" titre="Cave" sous="Le Chai, Le Cuvier, Le millésime" -->
<section id="cave">
```

**Pourquoi lui** : c'était la seule chose réellement **dupliquée**.

### Les règles d'écriture d'une source

- ★ **L'ORDRE des sections vient du NUMÉRO du fichier.**
- **Chaque fichier commence par sa ligne `@nav`, puis par `<section id="…">`.**
- **L'`id` de la section est l'ancre du sommaire ET celle des fiches d'aide** (`MV_AIDE[x].ancre`).
  ⚠️ **Le changer casse le bouton « Guide complet » de l'aide — C22 le refuse.**

### Les gardes du script

Il **REFUSE de tourner** et nomme le fichier fautif si : l'en-tête `@nav` manque · deux sections
portent le même `id` · un fichier ne commence pas par `<section id="…">`.
**Il ne produit jamais un guide à moitié cassé.**

⚠️ **Piège de découpage** : le sommaire contient un bloc « **Ailleurs** » **après** les liens de
sections. Le marqueur est borné aux liens **contigus**.

### ⚠️ Ce qui reste à jour, et ce qui ne l'est pas

Corrigé le 09/08 : **Pilotage** · **Cave** · **La Réserve** · **Phyto** · **Saisons** · **Réglages**.

**PAS ENCORE À JOUR** : **Planning** (équipe collective, capacité réelle, heures dues) ·
**Données** (hub Documents, journal des erreurs).
⚠️ **`demarrage.html` (~60 ko) n'a PAS été touché** et mériterait le même découpage.

---

## 27e. ★ La démo guidée & les supports imprimés

### La visite guidée (`?demo=visite`)

**14 moments** : météo → priorité du jour → validation → journal → registre phyto → Réserve → Chai →
Cuvier → planning → récap salaire → décision Pilotage → **coût réel par parcelle** → simulateur
Renfort → **addition**.

⚠️⚠️ **BUG CORRIGÉ LE 09/08 — cas d'école.** Les moments 12 visaient
`#pil-tabs [data-tab="ecf"]`, clé disparue au regroupement des onglets.
**`querySelector` renvoie `null` sans lever** → le `catch` de repli **ne s'est jamais déclenché** →
projecteur au hasard, **sur le lien de démo publié**.
**Correctif** : la bonne clé, **plus un filet** `else if(window.logError)`. **Et C22 pour que ça ne
puisse plus arriver.**

⚠️ **`DEMO2_CREDITS` est la source unique de tous les chiffres de ROI**, **toujours exécutée en Node
avant livraison**. Campagne = **12 mois, d'une récolte à la suivante**.
★ **Calage Nico** : **250 tâches validées de janvier à juillet** → 5 min × 400 tâches/an.

⚠️ **Trois bugs vécus, tous silencieux** : spotlights vides · simulateur vide (saisons sans
`debut`/`fin`) · Cuvier vide (`c.parcelles.map is not a function`).
**Leçon : quand un écran de démo reste vide, extraire et exécuter la vraie fonction de rendu.**

★★ **La démo ne connaît AUCUN des lots d'août.** **Un 15ᵉ moment « la cave qui vous dit ce qui
arrive » serait le plus vendeur du parcours** — backlog.

### ✅ Les supports imprimés — `mvprint.py`

Moteur Python maison (**1 069 lignes**, ReportLab, palette CMYK séparée à la main), **hors du dépôt
déployé (et hors Git)**. Annoncé perdu le 04/08 au soir, **retrouvé le lendemain matin**.
⚠️ **Sa copie doit être maintenue dans `..\mavigne-sauvegardes\`.**

**Caractéristiques** : contrôle qualité automatisé (8 vérifications géométriques par page, contrôle
du texte par `pdfplumber`, contrôle de rendu au pixel par `pypdfium2`), **100 % CMYK**, QR en
**K100 vectoriel**, gabarit Vista 216×303 mm, polices dans `fonts/` et images dans `assets/`
**à côté du script** (`HERE`), maquettes d'écran **redessinées programmatiquement**.

⚠️ **Le ROI s'exprime en heures, pas en euros** (215 h/an pour 10 ha).
★ **Leçon générale** : tout outil hors dépôt reçoit sa copie de sauvegarde **le jour de sa création**.
★★ **`mkpdf.py` (§18c) suit exactement le même patron** — et il a confirmé la leçon la plus
importante de `mvprint.py` : **le contrôle par extraction de texte ne voit pas un carré noir.**

## 27f. ★★ `mise-en-route.html` — le formulaire d'installation client

**Trois cadrages successifs de Nico ont défini l'objet** :
1. pas un devis — une **collecte des données d'installation** ;
2. pas de lignes à remplir au stylo — **du tapable à l'écran** ;
3. **ce qui existe déjà ailleurs s'envoie en PIÈCE JOINTE**, jamais en ressaisie.

**Résultat** : page autonome `public/mise-en-route.html`, **17 questions** presque toutes en
radios/cases, section « pièces à joindre » explicite.

★★★ **DEPUIS LE 09/08, ELLE ENVOIE** (§18b). L'action principale est **« Envoyer mes réponses »** ;
« Copier » et le brouillon mail restent en repli.

- ★ **Les cinq questions de barème (§30c) y étaient DÉJÀ** : écartements (`ecR`/`ecP`), IDCC
  (`idcc`), vendange (`vdPart`), prestataire (`prQuoi`), taille (`taAutre`). **Il n'y avait rien à
  ajouter au questionnaire** — seulement un chemin de retour.
- **Une seule définition de l'état du formulaire** (`etatCourant()`), lue par la sauvegarde locale
  **et** par l'envoi.
- ⚠️ **Pourquoi le mailto ne suffisait pas** : un `mailto` avec corps encodé **triple** en taille
  avec les accents français, et Outlook **tronque en silence vers ~2 000 caractères**.
- `frDate()` : ISO → **JJ/MM/AAAA** ; autosave **localStorage sous try/catch** ; valeurs date/heure
  **posées en JS** (Safari) ; **`noindex, nofollow`** ; **jamais dans `sitemap.xml`**.
- ⚠️ **Le succès rappelle que les FICHIERS restent à joindre** — l'envoi ne transporte que les
  réponses, pas le parcellaire.
- Déploiement : `public\` puis `--only hosting`, **aucun bump**.
- ★★ **Ne pas le confondre avec le widget « Mise en route » (§27c)** : celui-ci est une page
  publique remplie **avant** l'installation ; celui-là est un bloc **dans l'app**, après.

---

## 28. État courant & backlog

### ★★★ La journée du 11 août — audit intégral, puis deux lots Tracteur

**Versions à ce jour : APP `5.93` · SW `6.43`.** (À relire dans les fichiers, jamais depuis ici.)

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

⚠️ **Ni `npm run build`, ni le smoke, ni l'e2e n'ont été lancés** sur ces deux lots (pas de
navigateur côté Claude). **Et ils ne sont pas déployés.**


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
⚠️⚠️ **RIEN N'EST DÉPLOYÉ.** Voir la fin du §18b.
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
partie à Simon Chapelle (réf. MV-2026-9024).

### ★★ Le fait commercial : Château Garraud

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
réelle** · **grille d'installation tranchée** · Garraud + `mise-en-route.html` · **registre phyto
CSV** · **vendange-couperet**.
**1er au 3 août** — UX-1 · `firebase.json` · e2e +2 étapes · **écran d'accueil public** · téléphone
corrigé · DEMO-3 · heures sup · **saisonniers dans l'historique** · **équipe collective** · refonte
Économie · **carte d'ordre de passage** · Décider ×6 · Renfort ×5 · **vendange fantôme, 941 h**.
**31 juillet** — nouveau SIRET, adresse et téléphone publiés, archivage des CGU/DPA signées.
**30 juillet** — série UX-R1 → R5, zéro nouvelle collection.

### Backlog — commercial & administratif

1. ★★★ **RÉPONDRE À GARRAUD** — la séquence complète est ci-dessus.
2. ⚠️ **Borner l'offre de lancement** (durée jamais définie).
3. **Vérifier les empreintes de `_mv_signatures`** contre les archives du 31/07.
4. **Vérifier l'indexation dans Search Console.**
5. **LinkedIn posts #4 et suivants** — **douze angles prêts** (§27).
6. ★ **Trois questions à poser à Alexandre** : ses écartements commune par commune · le recours
   éventuel à un prestataire · **pourquoi Pliage, Palissage et Entreplantation sont absents de son
   barème** (75 h/ha, soit 1 350 h sur 18 ha, §30d).

### Backlog — technique, par ordre d'effort/effet

0. ⚠️⚠️⚠️ **LES FICHES `MV_AIDE` DU TRACTEUR** — dette du 11/08, **Règle d'or n°4**. Le chrono
   inversé (§31) et le mode du jour (§32) ont changé les gestes ; l'aide décrit les anciens.
   **Avant tout autre lot.** Vérifier au passage la section Tracteur du guide et `_mvtSteps`.
0b. ★★★ **`npm run build && npm run test:smoke && npm run test:e2e`** sur v5.93/v6.43, **puis
    déployer**. L'e2e tourne en 390×844 et l'écran de session a changé de structure.
1. ★★★ **DÉPLOYER LES CINQ LOTS D'INSTALLATION** (§18b, fin de section).
2. ★★★ **INSTALLATION À BLANC de bout en bout sur un slug JETABLE.** Elle valide les cinq lots d'un
   coup et **mesure les temps réels** (tableau prévu dans `INSTALLER-UN-DOMAINE.md`).
   ⚠️ **Un essai consomme un identifiant** : `onboardTenant` refuse un domaine déjà peuplé. Prendre
   un nom jetable, **jamais `chateau-garraud`**.
3. ★★ **Vérifier si un `rewrite` existe en ligne** (`/api/lead`) : absent du `firebase.json` lu.
   Si oui, en ajouter un pour `/api/mise-en-route`.
4. ★ **Corriger `_findDebutTache`** — borne de période, 2 lignes, `app.js` → bump SW (§15).
5. ★ **Breakpoint 760 → 767.98** — plan validé, 1 ligne CSS, 0 JS, **en attente du go** (§21d).
6. ★★ **Guide : mettre à jour les sections Planning et Données**, et **découper `demarrage.html`**
   sur le même modèle (§27d).
7. ★ **Escalier de sources pour la cadence** (§20b) — marche 2 vide aujourd'hui.
8. **Purger le calcul de pic mort dans `_rfCtx`** — ⚠️ `ctx.pic` introuvable : **vérifier le nom**.
9. **Pondérer `_ecoRate` par les heures**, pas par tête.
10. ★ **Détail cosmétique** : le libellé des chips de cuvées affiche `Village 2026· 12`, **sans
    espace avant le point médian**. 1 caractère.
11. ★★ **Import KML en MERGE** sur un domaine vivant, avec les **coordonnées écrites dans les
    parcelles**, et **la densité comme propriété de la parcelle**. ⚠️ Préserver `p.commune`,
    `p.plantation_trous`, `p.entreplantation`, `p.tachesAll`, `p.rendement_hist`, `p.rdt_max`.
12. ★★ **Le rattachement des anciens fûts à une référence** — maquetté et validé, **non intégré**.
13. ★★ **Un 15ᵉ moment de démo sur la cave** — le plus vendeur du parcours.
14. ★ **Le Cuvier n'enregistre pas d'intervenant** là où le Chai le fait.
15. **`.cave-tabs`** (classe, 1 règle CSS / 0 usage).
16. **`_pl2Annual` vs `_planGetRefH`** — 1 ligne, mais **décision de conception d'abord**.
17. **Terminologie heures sup** : « Solde cumulé » vs « Reste à prendre ».
18. **Batch a11y** · résorption des ~234 `catch{}` vides.
19. **Rôle `pilotage` (`pil:true`)** — 2 arbitrages préalables. Corriger aussi `getLoginRoster`.
20. **Injection de données pures dans les guides.**
21. **Lot B pluie** — précipitation **horaire**, irrécupérable rétroactivement.
22. **DRY surface** — 32 sommes à la main.
23. **UI d'activation d'essai client.**
24. **Fusion de fûts à l'ÉDITION** (La Réserve).
25. **Ancien catalogue « Mes produits »** — 5 fichiers : arbitrer.
26. ★ **Vérifier les autres tâches `anytime:true`**.
27. ★ **Variantes girondines** — guyot double, Médoc Graves et Palus, majorations ; **vérifier
    qu'aucun avenant postérieur à 2021 n'a révisé ces temps** (§30a).
28. ★ **Type de contrat « tâcheron »** (§30f) — à prévoir, pas urgent.
29. **Tokeniser les ~2 300 hex des JS.**
30. **Mise à jour SW choisie — niveau 1** (§8).
31. **Lot 8 différé** (Google Play TWA) — jusqu'à **5+ clients actifs**.
32. **Une passe Lighthouse sur `staging`.**
33. ★ **Thème saisonnier** — étude faite, maquette 4 saisons à produire, **décision de Nico** (§21d).
34. ⚠️ **Surveiller la taille de `cave.js`** (~375 ko).
35. ★ **Committer ce document dans le dépôt** (`CLAUDE.md` à la racine) pour qu'il soit lisible
    directement depuis GitHub, comme le code (§29, Règle d'or n°1).
36. ★★★ **L'ÉCHELLE TYPOGRAPHIQUE — le plus gros effet client du backlog** (audit du 11/08).
    **Lot A : le plancher.** 257 sites sous 10 px remontés à 11 px minimum.
    ⚠️ **Pas une substitution aveugle** : certains 9 px sont des exposants ou des unités collées à
    un chiffre. **Maquette sur trois écrans d'abord** — accueil ouvrier, session tracteur, registre
    phyto — puis intégration au tableau motif → compte attendu.
    **Lot B : le réglage « Taille du texte ».** 1 368 sites de 10 à 11,5 px convertis en variables
    CSS pilotées par un attribut `data-fs` sur `#app-root`, **jumeau exact de `data-hicontrast`**.
    Trois crans : Normal · Grand · Très grand, dans Réglages › Application, sous « Plein soleil ».
    ⚠️ **Ne PAS passer par un `zoom` CSS global** (qui serait une ligne) : il agrandirait aussi la
    carte Leaflet, les overlays `position:fixed` et la largeur du corps bornée à 430 px — le risque
    porterait sur l'écran le plus utilisé.
37. ★★ **`mvDate()` et `mvNum()` dans `utils.js`** — une seule date, un seul nombre.
    `mvDate(iso, forme)` : `'jma'` dans les documents et registres (traçabilité), `'court'` dans les
    listes denses, `'long'` dans les titres, **jamais `'court'` là où l'année est ambiguë** (défaut
    actuel de `_vendFrDate`). `mvNum(v, unité)` : décimales imposées par l'unité.
    **Décision de forme AVANT le code.** Supprimer les 2 paires de doublons littéraux.
38. ★ **Purger le bloc de ré-export de `app.js`** (l. ~9074–9287) : 111 lignes inutiles + 5 noms
    morts. Réécrire les 89 restantes en `window.X = X;` littéral, **unifier `phyto.js` sur la même
    forme** et supprimer sa boucle `for..in`. Regraver la baseline **après** avoir prouvé la baisse.
39. ★ **`.val-toggle` 26 → 44 px de haut** — c'est l'interrupteur qu'un ouvrier bascule par équipier,
    avec des gants. Vérifier aussi `.pc-start` (34), `.plan-mo-btn` (34), `.fiche-admin-btn` (32).
40. ★★ **Valeurs par défaut de modules PAR RÔLE à la création d'un membre** : un ouvrier arrive avec
    Cave / Réserve / Planning décochées, un tractoriste avec Vigne / Tracteur / Phyto. Aujourd'hui
    `_canModule` = formule ∧ masquage manuel, **le rôle n'entre nulle part**.
    ⚠️ **Gain direct sur Garraud : 12 personnes × 7 arbitrages.** À faire **avant** l'installation.
41. **44 occurrences de `var(--texte-doux,#8B8175)`** — le repli est à **3,66:1**, sous AA. Il ne
    sert jamais (la variable est toujours définie) mais il est faux. → `#5F5F5F`.
42. **Six points de rupture responsive** (560, 600, 640, 760, 768, 900, 980, 1200) — les ramener à
    trois. **Après** le lot typographique, pas avant.

### ✅ Rayés du backlog

~~Urssaf~~ · ~~facturer Chapelle~~ · ~~clé `"site"`~~ · ~~UX-1~~ · ~~SEC-3 CSP~~ · ~~e2e 10 pages~~
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

## 30. ★★ MULTI-TERROIR — rendre le barème vrai ailleurs qu'en Côte de Nuits

**État : le socle est LIVRÉ, et son premier client d'essai est arrivé le jour même**
(Château Garraud, Lalande-de-Pomerol). Cette section décrit ce qui existe, ce qui reste, et surtout
**pourquoi** — les raisonnements valent plus que le code, ils resserviront.

### 30a. Barèmes régionaux — `MV_BAREMES` (livré)

`TACHES_CATALOGUE` portait les heures de la Côte de Nuits comme s'il s'agissait d'une vérité
générale. Hors de Bourgogne, elles sont fausses **d'un facteur 2 à 3** — et fausses en silence.

**Le mécanisme retenu : un barème régional est un CALQUE.** Il ne redéfinit que des **heures**,
jamais la structure des travaux. Ajouter une région = **une entrée dans `MV_BAREMES`**, rien d'autre.

| Clé | Couverture | Source |
|---|---|---|
| `cote-nuits` | le catalogue tel quel (`hha: null`) | Accord du 2 octobre 2023 |
| `gironde` | hors Médoc, guyot simple | Avenant n° 12 du 30 juin 2021, IDCC 9331, art. 89 |

`CONFIG.bareme` · `window._mvBaremeActif()` (repli `'cote-nuits'`) · `window._mvBaremeRef(cat)` →
renvoie **toujours** un objet, avec les drapeaux `_regional` et `_horsBareme`.
**Le catalogue d'origine n'est jamais muté.**

⚠️ **Tous les jeux sont exprimés à 10 000 pieds/ha**, y compris ceux issus de textes qui comptent
aux 1 000 pieds. La densité s'applique **ensuite**.

⚠️ **Un travail que le barème ne prévoit pas reste SANS valeur conseillée** (`_horsBareme`).
**Mieux vaut ne rien dire que dire faux.**

**Valeurs girondines** : Taille 95 · Tirage 60 · Brûlage 20 · Réparation 25 · Pliage 55 ·
Ébourgeonnage [45, 25] · Pioche [50, 30] · Relevage [25, 55, 15]. Cycle couvert **500 h/ha** sur
572,5 au texte — l'écart est le **rognage/estrapage** (72,5 h/ha), mécanisé en Côte de Nuits.

★ **Le résultat qui compte** : à densité égale, Bourgogne **520 h/ha** contre Gironde **572** —
**+10 % seulement**. **La densité explique environ 90 % de l'écart entre les deux régions.**

**Reste à faire** : guyot double, Médoc Graves et Palus, vignes de plus de 20 ans, majorations
(trois fils +10 %, sols argileux +20 %, passage à poussard +10 % la première année).
⚠️ **Vérifier qu'aucun avenant postérieur à 2021 n'a révisé ces temps.**

⚠️ **Un girondin ne choisit pas « le barème Gironde »** : il choisit une combinaison de cinq
réponses. **Elles se posent avec le client, son contrat de tâche sous les yeux.**

### 30b. Densité de plantation (livré)

```
pieds_ha  = 10 000 / (écartement_rang × écartement_pied)
```

⚠️ **Ce n'est pas une convention maison.** L'accord du 2 octobre 2023 le prescrit : *en cas de
densité de plantation différente, les temps de travaux se calculent au prorata du nombre de
pieds/hectare*.

`CONFIG.vigne = {ec_rang, ec_pied}`, saisie par **deux `openPrompt` enchaînés**. Helpers dans
`utils.js` : `MV_DENS_REF` (10 000) · `_mvPiedsHa` · `_mvVigne` · `_mvDensCoef` · `_mvHhaDens`.

⚠️ **Aucun calcul d'heures ne change.** `TACHES[].hha` reste la seule source. La densité **propose**.
⚠️ **Neutre par défaut** : sans écartements renseignés, le coefficient vaut 1 et **rien ne bouge**.

★ **Le marqueur « votre valeur » compare au barème RAMENÉ à la densité.**
★ **La densité doit devenir une propriété de la PARCELLE** (§13, §28).
★★ **Le widget « Mise en route » rappelle les écartements manquants** en une ligne, avec le chiffre
qui parle : *« à 6 000 pieds, il propose un tiers d'heures de trop »* (§27c).
★★★ **Et depuis le 09/08, ils peuvent être posés DÈS L'INSTALLATION**, repris du formulaire de mise
en route — la virgule française est lue, les valeurs absurdes refusées (§18b).

### 30c. Ce qui reste vrai sur l'installation

**Ne jamais demander des heures, demander des faits.** Un h/ha n'est pas une donnée, c'est un
résultat.

Les questions qui restent utiles, dans l'ordre de leur poids :
1. **Vendange manuelle ou machine** — 80 h/ha contre ~3.
   ★ **Arbitrage à faire (avec recommandation)** : ce n'est **pas** un cas de densité, c'est un
   **AUTRE travail**. Recommandation : deux entrées de catalogue distinctes.
2. **Écartements** (déjà exploitables : §30b).
3. **Travaux confiés à un prestataire ?** Courant en Gironde. Sans ce drapeau, la charge, l'ETP et
   le simulateur réclament des salariés qu'on n'embauchera jamais.
4. **Taille dominante** — guyot simple ou double change la ligne du barème girondin.
5. **Code IDCC** du bulletin de paie, pré-rempli à 7024.

★ **Le département vient du géocodage BAN déjà fait** : zéro question supplémentaire (§13b).
★★★ **LES CINQ QUESTIONS SONT DÉJÀ DANS `mise-en-route.html`** — et depuis le 09/08, **leurs
réponses arrivent en base**, dans le dossier que l'assistant d'installation ouvre (§18b, §27f).
**Ce qui reste, ce sont les 4 heures de DISCUSSION** : elles ne s'automatisent pas, elles se
préparent.
⚠️ **Deux de ces cinq réponses seulement sont ÉCRITES** (écartements, et le SIRET qui n'est pas dans
la liste) : **l'IDCC est affiché mais pas posé**, parce que rien ne le lit encore.

★★ **MT-A — RAYÉ le 09/08.** Le rappel des écartements ne va **pas** dans l'onboarding : il vit
dans le widget « Mise en route » de l'accueil admin (§27c), et il peut désormais être évité tout
court si le client a répondu au formulaire.

### 30d. ⚠️⚠️ Ce que `_normalizeTaches` fait vraiment

Le catalogue n'est pas seulement un défaut d'installation. Pour toute tâche dont le **nom** est au
catalogue, `_normalizeTaches` **reconstruisait l'objet champ par champ** à chaque chargement :

| Champ | Comportement | |
|---|---|---|
| `hha`, `niveaux`, `passagesHha`, `saisons` | **replis** si absents | ✔ |
| `type`, `tempsReel`, `complementaire`, `skipRule`, `trous` | **écrasés d'office** | ⚠️ |
| **tout autre champ** | **DÉTRUIT en silence** | ⚠️⚠️ |

**La preuve vivante** : `t.count`, écrit par `tcfgSave`, disparaissait au rechargement suivant.

**Corrigé** : la fonction part de `Object.assign({}, t)` et n'impose que ce qui vient du catalogue.

**Second trou, même famille** : `tcfgSave` reconstruisait l'entrée de zéro sans réécrire
`saisons`/`anytime`/`conv`. Ouvrir « Pioche » chez Chapelle et enregistrer **sans rien changer** la
faisait passer d'Automne à Printemps, en silence.
★★ **C'est la même famille que le bug du formulaire d'analyse du 07/08 et que la config de
l'assistant d'installation du 09/08** : *une fonction qui reconstruit un objet de zéro perd tout ce
qu'elle ne réécrit pas.* **Le piège s'est présenté quatre fois en trois semaines, dans quatre écrans
différents.**

★ **C'était le prérequis de tout le reste.**

**Audit sur les documents réels** (`fbAdminRead(slug,'taches')` en fenêtre privée donne le doc
**brut** ; `window.TACHES` est déjà normalisé et ne montre rien) :

- **`hha` explicite sur toutes les entrées** sauf Entreplantation. **Aucun repli ne se déclenche.**
- **Marchand-Grillot** : 11 tâches, **565 h/ha = exactement le catalogue**.
- **Chapelle** : 9 tâches, **495 h/ha**. **Pliage, Palissage et Entreplantation absents** — 75 h/ha,
  soit **1 350 heures non budgétées sur 18 ha**. Vendange à **180 h/ha**. **À vérifier avec
  Alexandre.**
- **Les deux** ont Relevage **100** (50/25/25) et Accolage **50** là où le catalogue dit 90 et 45.
- ★ **Les 485 h/ha du commentaire = Ébourgeonnage ×2 + Pioche ×0 + Relevage ×3.** **Le total du
  barème n'est donc pas une constante** — l'invariant est le barème **par passage**.

### 30e. Les quatre sources de barème

| Source | Rôle réel |
|---|---|
| `let TACHES` (app.js) | **le seed réel** d'un nouveau tenant — 11 tâches, **sans `passagesHha`** |
| `TACHES_CATALOGUE` (app.js) | la structure de référence, 16 entrées |
| `OB_TACHES` (onboarding.js) | ⚠️ **n'écrit JAMAIS en base** |
| les documents `taches` | la réalité de chaque domaine |

★ **`obFinalize` envoie `taches: window.TACHES`**, pas `OB_TACHES`. Ses divergences sont **un
mensonge d'écran pendant l'installation, pas une divergence de données**.
★★ **L'assistant d'installation envoie lui aussi `window.TACHES`** — donc un domaine installé par
lui reçoit exactement le même seed (§18b).

⚠️ Un nouveau tenant reçoit un document **sans `passagesHha`** — **ce domaine-là bougera si le
catalogue change**, contrairement à MG et Chapelle.

★ **Le seed porte aussi les ACTIVITÉS du tracteur**, toutes rattachées à `tracteurDefautId:'trac1'` —
c'est pourquoi la première machine collée à l'installation **doit garder cet identifiant** (§18b).

### 30f. ⚠️⚠️ Le biais 1/N — et pourquoi l'axe « durée réelle » est FERMÉ

**L'app ne mesure pas le temps passé sur une parcelle.**
★ **Ce n'est pas un défaut à corriger — c'est ce qui rend juste la position de Nico** (§30i) : un
barème qu'on ne peut pas vérifier au chronomètre ne peut être qu'une **convention**.

La règle 1/N suppose **qu'une parcelle se fait dans la journée**. Le biais croît avec la taille des
parcelles : faible chez MG (0,26 ha en moyenne), faux en permanence sur des blocs girondins de 2 à
3 ha — ★ **Garraud est exactement ce profil.**

★★★ **L'AXE CAD-1 EST FERMÉ, ET C'EST UN RÉSULTAT — PAS UN ABANDON.**
Trois mesures en lecture seule l'ont tué :
1. le statut « En cours » n'est posé que sur **18,4 %** des validations (46 sur 250) ;
2. dans ces 46, **72,7 % des durées supérieures à 7 jours portent sur des tâches à passages ou
   niveaux** — c'est **l'écart entre deux passages**, pas une durée de chantier ;
3. il reste ~8 chantiers vraiment multi-jours sur 250, et **on ne sait pas distinguer un chantier
   long d'un drapeau oublié**.

**Le signal n'est pas seulement rare, il est ILLISIBLE.** ★ **Mesurer avant de corriger a économisé
un lot entier** — et a fait apparaître un défaut dormant au passage (`_findDebutTache`, §15).

★ **L'exception tâcheron.** Un tâcheron est payé au forfait : son module doit respecter la
convention **quel que soit le temps qu'il y met**. ⚠️ **Aucun tâcheron aujourd'hui.**

### 30g. Le coefficient de domaine — calibrer en bloc

```
  heures réellement présentes au champ   →  _planPresentRef
– heures tracteur                        →  _tractHoursSeason
– autres activités                       →  déjà séparées
÷ heures de barème du travail fait       →  Σ TRAVAUX[t].h_done
= coefficient de domaine
```

« Sur l'hiver, l'équipe a passé 1 240 h au champ pour 1 810 h de barème. Votre barème est 32 % trop
large. Le recaler en bloc ? »

★ **Ce calcul est devenu possible le 04/08** : tant que `h_done` comptait des passages jamais faits
(§16b), le coefficient aurait conseillé de baisser un barème correct — **un mauvais conseil, avec
l'autorité d'une mesure**.
★★ **Et il a failli l'être une seconde fois** : jusqu'au 09/08, l'écart de cadence d'Économie disait
exactement cela, en vert, sur un barème juste (§20b). **Deux fois le même piège, deux causes
différentes : c'est le signe qu'un indicateur de ce genre doit être mesuré avant d'être affiché.**

Trois gardes non négociables : proposition **jamais automatique** · **admin seulement** ·
**écartable définitivement**.

### 30h. Convention collective — plus petit qu'il n'y paraît

Depuis avril 2021, la CCN production agricole et CUMA (**IDCC 7024**) a remplacé environ 140
conventions départementales. Le cadre — 1607 h, modulation 250 h, congés — est **national**.
Ce qui reste local : la **grille de salaires** et les primes d'usage. Or Ma Vigne ne calcule pas la
paie. **Le risque est donc borné.**

★★ **`CONFIG.cadre_legal` EXISTE DÉJÀ** et porte les durées. **Ne pas le doubler.** Ce qui manque
n'est que l'**identification** : `CONFIG.rh = { idcc, convention_libelle }`, plus le **libellé de
convention + IDCC en tête du PDF de relevé**.
⚠️ **C'est exactement pour ça que l'IDCC recueilli par le formulaire n'est PAS écrit** (§18b) :
poser une clé que rien ne lit donnerait l'illusion d'un réglage fait. **Le jour où ce lot existe,
la reprise devient triviale — la donnée est déjà dans le dossier.**

**Règle de non-régression absolue** : les défauts reproduisent exactement le comportement actuel.

⚠️ **À écrire noir sur blanc dans le guide et les CGU : Ma Vigne produit un relevé d'heures, pas un
bulletin de paie.** ★ **C'est déjà dans la fiche d'aide Planning.**
⚠️ Claude n'est pas juriste : faire confirmer par un expert-comptable social avant de vendre hors
Bourgogne.

### 30i. ★★ La position de Nico, figée

**L'application est INFORMATIVE, pas un texte de loi.** Le barème est une **référence datée et
sourcée** ; le vigneron reste libre de ses valeurs. L'accord lui-même le prévoit.

Conséquences déjà appliquées :
- le badge **« ✎ modifié »** est devenu **« votre valeur »** en vert discret, avec **les deux
  chiffres côte à côte** — « Convention : 70 h/ha · chez vous : 100 ».
- chaque barème régional affiche **son texte source et sa date**.
- changer de barème **ne touche aucune donnée du domaine**.

★ **Le modal « Barème de la convention » est le vrai point d'entrée**, pas l'onboarding.

★★ **La même position vaut pour les documents de cave** : ils **présentent**, ils ne certifient pas.
« Ma Vigne prépare, l'exploitant déclare » est écrit **dans les documents eux-mêmes**.
★★★ **Et elle vaut pour la MALO** : Ma Vigne **projette une date à partir des mesures du vigneron**,
elle ne décide pas quand soutirer. Quand les données ne permettent pas de projeter, **elle le dit et
s'arrête**.
**Ne jamais produire une date avec l'autorité d'un calcul quand la donnée ne la porte pas.**
★★★ **Corollaire pour tout indicateur** : *un indicateur bâti sur un signal partiel ment avec
l'autorité d'une mesure.* L'écart de cadence en est l'exemple parfait — il ne disait pas « je ne
sais pas », il disait « vous allez deux fois plus vite que prévu ».
★★★ **Corollaire du 09/08 au soir, pour tout ÉCRAN** : *ne jamais annoncer un réglage qu'on ne pose
pas.* L'IDCC affiché mais non écrit, et la liste « à finir » qui suit ce qui a été fait, viennent
tous deux de là.

### 30j. Ce qu'il ne faut PAS faire

- **Pas de déduction de la convention par le département** : c'est l'employeur qui déclare son IDCC.
- **Pas un écran de paramétrage de 40 champs après installation.** Demande explicite de Nico.
- **Pas de saisie nouvelle sur le terrain** : ça contredit toute la série UX-R.
- **Pas de barème régional inventé.** Un jeu se construit sur un texte, avec sa source et sa date.
- ★★ **Pas de document qui prétend certifier.**
- ★★★ **Pas de projection sans mesure.**
- ★★★ **Pas d'écran qui promet ce qui n'existe pas** — ni « module à venir » chez un client payant,
  ni un geste qui mène à un écran inexistant (§27c), ni une liste « à finir » qui réclame ce qu'on
  vient de poser (§18b).
- ★★★ **Pas d'auto-inscription, pas de tunnel, pas de paiement en ligne.** La série installation
  réduit **le temps de Nico**, jamais sa présence.

### 30k. Ce que ça change pour Marchand-Grillot et Chapelle

**Rien**, tant qu'ils ne touchent à rien : sans écartements et sans changement de barème, le
coefficient vaut 1 et le jeu actif est la Côte de Nuits. **20/20 tâches inchangées.**

Une seule chose bouge visiblement : **les heures de relevage chutent** (−528 h chez MG). **C'est la
correction, pas une régression.**

★ **Même logique pour toute la Cave** : un domaine qui n'a pas rempli son parc à fûts décuve
exactement comme avant · le bilan d'un domaine sans Cuvier affiche « aucune récolte saisie » ·
★★ **un domaine à un seul millésime ne voit ni le rang de saisie, ni les intertitres d'ouillage, ni
le bandeau multi-millésimes** · ★★ **un domaine qui ne règle aucun seuil par millésime garde
exactement l'alerte à 14 jours qu'il avait**.
★★★ **Et pour l'accompagnement** : un domaine entièrement installé **ne voit pas** le widget
« Mise en route » · une fiche d'aide dont le module n'est pas chargé **omet son point dynamique** ·
le guide reste identique tant qu'on ne régénère pas.
★★★ **Et pour l'installation (09/08 soir)** : **aucun de ces cinq lots ne touche un domaine
existant.** Sans liste collée, sans découpage repris, sans machines, sans volume de fût choisi,
l'installation écrit **exactement ce qu'elle écrivait avant**. Le seul changement qui touche un
domaine vivant est le **correctif du tenant** — et il ne fait que rendre juste un appel qui pouvait
partir au mauvais endroit.
**Tout lot doit avoir son repli, et le repli doit être testé.**

### 30l. Portée commerciale

Cette série rend un domaine girondin installable **sans que Nico connaisse la Gironde** — et
★★ **le test grandeur nature est arrivé le jour même de la livraison**. Elle ne supprime pas le
forfait d'installation, **elle le justifie** : une heure de cadrage avec le client et son contrat de
tâche, au lieu de deviner.

★ La grille d'installation étant tranchée, le devis Garraud est **écrivable dès le retour de son
formulaire** — seule la durée de l'offre de lancement reste à borner.
★★★ **Et depuis le 09/08, le forfait est SOUTENABLE** : 20 h incluses pour une installation qui en
coûte 9 laisse de la marge pour l'imprévu, la formation et les allers-retours. ⚠️ **Chiffre à
confirmer par l'installation à blanc.**

---

*Fin des instructions personnalisées — Ma Vigne / GUERETTECH. Document volontairement sans numéro de
version (Règle d'or n°2).*


## 31. ★★★ LE CHRONO TRACTEUR INVERSÉ (11/08 — v5.92)

**Le geste de mesure a été retourné : la coche EST le chrono.**

### Ce qui n'allait pas

L'ancien chrono demandait **Démarrer → cocher → Arrêter** : trois gestes pour la parcelle, sur le
travail le plus répété de la journée. Sans chrono, cocher coûtait **un** tap. **Le chrono se payait
donc ×3** — ce qui explique qu'il soit resté en opt-in (`CONFIG.chrono_mode`) et peu utilisé.

★★★ **Mais le vrai défaut était ailleurs, et personne ne l'avait vu :** `_chrono` était une
**variable JS que rien ne persistait**. `_chronoFinalizeOnClose()` n'était appelé que depuis
`closeSessionDetail()`. **Un téléphone verrouillé pendant 40 min de rognage — le cas normal dans une
cabine — perdait la mesure en silence.** Aucune alerte, aucune récupération.

### Le modèle

| Geste | Effet |
|---|---|
| **Toucher une parcelle** | la mesure démarre dessus |
| **« J'AI FINI »** | la mesure se ferme, le temps part en **hors parcelle** |
| **Toucher une AUTRE parcelle** | clôture la première, démarre la seconde, **sans compter de déplacement** |
| **Appui long** | ajoute au bloc en cours — temps partagé à la surface |
| **⏸** | interruption en pleine parcelle : la parcelle **reste ouverte** |

C'est le geste qui déclare la situation, parce que **l'app ne peut pas la deviner** : certaines
parcelles sont mitoyennes, d'autres à plusieurs kilomètres, et rien dans les données ne dit laquelle.

### Trois seaux, jamais quatre

**MESURE** (dans les parcelles) · **HORS PARCELLE** (trajets, pause légale, ravitaillement, réglage
— *tout du temps travaillé*) · **PAUSE DÉJEUNER** (non travaillée).

⚠️ **« Pause déjeuner » est JUSTE ici et interdit dans le planning.** Le cliquet
`scripts/lint-vocabulaire.mjs` bannit le mot de `planning.js`, `reglages.js` et `index.html` parce
qu'il désigne en droit un **droit du salarié**. Sur le tracteur, **le tractoriste est seul et choisit
vraiment son moment** — le mot est exact. C'est pourquoi le libellé **vit dans `tracteur.js`**, qui
n'est pas une cible du cliquet : `index.html` reste à zéro, la protection du planning est intacte.

### ★★★ Ce chrono ne justifie PAS la journée de travail

Au retour il reste le **lavage, les niveaux, le plein de GNR** — ils n'y sont pas. Le chrono sert à
**budgéter** les travaux de tracteur et à connaître le temps réellement passé dans les vignes.
**L'écran le dit en toutes lettres, à deux endroits** (sous les compteurs et dans le bilan) : sans
ça, un tractoriste lit le total comme sa journée.

### Chrono douteux = mesure écartée

Au-delà de **3× le barème**, en dessous de **40 %**, ou au-delà de **12 h** : on **n'écrit pas
`dmin`**. La parcelle est cochée **au barème**, sans temps constaté.

★★ **Rien n'a eu besoin d'être codé pour ça.** `_chronoSummary` filtre déjà sur `dmin != null` pour
le « Constaté » et retombe sur `_sessBaremeMin` pour l'« Appliqué » ; `pilotage.js:4318` fait le même
repli, indépendamment. **La bonne réponse était de RETIRER une écriture, pas d'ajouter un mécanisme.**
Un premier dessin proposait un dialogue à trois réponses : c'était de la sur-ingénierie.

⚠️ **Mais l'écart est DIT** — toast, ligne ambre dans la liste, compteur au bilan. Un écart
silencieux serait un indicateur qui ment par omission. **Si un domaine voit ses parcelles écartées
tous les jours, ce n'est pas le tractoriste qui oublie : c'est le `h_ha` de l'activité qui est faux.**
Le compteur d'écarts est le seul moyen de s'en apercevoir.
**Une activité sans `h_ha` n'a pas de barème → aucun écart possible, tout compte.**

### Persistance

`t0` est **ABSOLU**, l'état vit dans `localStorage` (`mavigne_chrono_session`), écrit à chaque geste
plus sur `pagehide` et `visibilitychange`. Le `sid` de session est dans la charge utile : un état
laissé sur une autre session est ignoré.
⚠️ **`closeSessionDetail` n'écrit plus rien** — le bloc en cours est persisté et repris. Écrire à la
fermeture forcerait une mesure à chaque coup d'œil à l'écran.
⚠️ **Le `catch` d'un `localStorage` en échec ne doit pas être vide** : c'est exactement la panne que
ce moteur répare. Il prévient l'utilisateur une fois (`_chrPersistKO`).

### Tri de la liste

**Tournée du chef** (`_mvOrdreFor`) **>** **proximité** au point courant **>** parcelles sans
polygone, groupées sous un séparateur (elles ne disparaissent jamais).
⚠️ **La géographie vient des CENTROÏDES KML** (`_mvParcGeo`), **jamais d'une géolocalisation du
tractoriste** — décision explicite de Nico. Ce sont **les parcelles** qui sont situées, pas l'homme.
La distance s'affiche (`240 m`, `1,2 km`).

---

## 32. ★★★ LE MODE DU JOUR (11/08 — v5.93)

**« Tu prends le tracteur aujourd'hui ? »** — posé à la première ouverture du jour.

### Pourquoi journalier, et pas permanent

Le tracteur se prend **pour la journée entière** : on attelle le matin, on dételle le soir. Mais le
lendemain la même personne peut repartir au terrain. **Un mode permanent se tromperait un jour sur
deux ; une question à chaque ouverture serait redemandée alors qu'elle est tranchée à 8 h.**

★★ **Un premier dessin proposait un mode collant, et l'objection était juste — mais pour la mauvaise
raison.** L'argument « les journées sont mixtes » a été démenti par Nico, qui est chef d'équipe :
elles sont homogènes **dans** la journée et variables **d'un jour à l'autre**. **C'était la
granularité qui clochait, pas le concept.**

### La question porte sur le FAIT, pas sur l'identité

Deux tuiles : **« Oui, je prends le tracteur »** / **« Non, je suis au terrain »**. Pas
« Ouvrier / Tractoriste » : un polyvalent n'a pas à choisir **qui il est** chaque matin, et
« Ouvrier » se lirait comme une rétrogradation.

### Qui reçoit la question

`ouvrier` **ET** `tractoriste` **ET** pas `admin` (il a besoin de tout) **ET** au moins une session
tracteur au statut « En cours ».
⚠️ **Les traitements phyto vivent dans le même tableau `SESSIONS`** (`type:'traitement'`) et ne
déclenchent pas la question.
⚠️ **Pas de filtre sur le conducteur** : celui qui n'a pas encore créé sa session est précisément
celui qui a besoin de l'écran.

### Mémoire

`mavigne_mode_<tenant>_<personne>`, **la date dans la VALEUR et non dans la clé** — la réponse d'hier
expire d'elle-même à minuit, rien à purger. Même patron que `_hcKey` (Plein soleil).

### ⚠️⚠️ Le mode ne touche AUCUN droit

Il **range** le dock et choisit l'atterrissage. Une personne en mode terrain **reste tractoriste** au
sens des rules et des gardes `isTractoriste()`.
**Ne jamais écrire `if (_mvMode()==='tracteur')` comme garde de sécurité : ce n'en est pas une.**
Une notion qui a besoin de cette phrase est fragile — d'où le commentaire en tête du bloc.

**Rien ne disparaît** : ce qui sort des 4 cases du dock passe sous « Plus », qui porte aussi la
**sortie du mode**. Un module introuvable coûte plus cher qu'un module de trop.

### Le trou assumé

Une session passe à « Terminé » à 100 %. **Le lendemain d'un chantier fini, il n'y a plus de session
ouverte → pas de question ce matin-là.** Le tractoriste passe par le dock, crée sa session, et la
question repart le jour suivant. **Ça s'auto-corrige en un jour** — le corriger voudrait dire poser
la question à des gens qui ne prennent pas le tracteur, ce qui est pire.

---
