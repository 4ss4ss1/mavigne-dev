# Audit — vitesse, données, ergonomie terrain (AUDIT-PERF)

**Base lue : `c62f429` (« demo ») · APP 8.17 · SW 8.92 — le 04/10/2026.**
Mesuré sur le code du dépôt et dans un vrai Chromium du bac à sable (`@sparticuz/chromium` + `puppeteer-core`, §192b),
sur le **build de production**, écran de téléphone 390 × 844. « Téléphone moyen » = processeur ralenti ×4 (le réglage
mobile de Lighthouse). Rien n'est intégré : ce document est le lot **AUDIT-PERF**, à valider avant tout code — même
méthode que NAV-0 (`audit-ux-navigation.md`).

La demande (04/10) : le niveau de Linear, Notion et Figma — vitesse perçue, robustesse des données, ergonomie terrain
avec un minimum de gestes. La stack citée dans la demande (Node.js, Prisma, JWT) n'est pas celle du dépôt : Ma Vigne,
c'est Firestore (un document par type de données et par domaine), des Cloud Functions Node 22, et les droits posés sur la
connexion Firebase (`adm`, `ro`, `tenant`…). L'audit porte sur la vraie stack ; la question Prisma est au §3.5.

Unités : les tailles de paquet sont celles qu'affiche `vite build` (kB = 1 000 octets) ; les autres sont en Ko (1 024).

---

## 0. L'essentiel

**Deux défauts prouvés, à corriger d'abord — petits, et ils touchent le terrain :**

1. **« Valider » depuis la feuille de validation peut rester bloqué sur la météo.** Réseau qui traîne → la feuille reste
   ouverte, rien n'est écrit, et 30 s plus tard toujours rien. La validation attend Open-Meteo avant d'écrire. Le bouton
   « Valider » de la carte de parcelle (`pQuickValidate`) fait déjà ce qu'il faut : il écrit d'abord, la météo suit.
2. **Sans réseau, on ne peut pas entrer — et l'écran dit « Mot de passe incorrect. ».** Le mot de passe n'a même pas été
   vérifié : c'est App Check qui n'a pas pu obtenir son jeton.

✅ **Les deux sont corrigés au lot VALID-1 + LOGIN-1 (§242, APP 8.18 · SW 8.93).** Le n° 2 ne fait que dire la vérité :
entrer sans réseau reste le lot ENTREE-1.

**Ce qui fait « lent » aujourd'hui, dans l'ordre :**

1. **l'ouverture** : un voile de 3,4 s imposé, le mot de passe à chaque ouverture, et sur un réseau qui traîne, **la zone
   des profils reste vide 18,6 s** alors que le téléphone a la liste des profils en mémoire ;
2. **l'Accueil** : 120 à 130 ms de calcul à chaque affichage sur un téléphone moyen, et chaque validation d'un collègue le
   redessine — jusqu'à 0,6 s d'écran figé sur un gros journal ;
3. **le paquet** : 3,9 Mo de JS lus d'un bloc à chaque ouverture, dont 339 Ko de journal des nouveautés et 254 Ko de
   console GT que personne d'autre que toi n'utilise.

**Ce qui menace la robustesse à moyen terme :** chaque type de données est **un seul document Firestore**, plafonné à
1 Mio. Le journal y arrive vers **6 600 entrées** ; `historique` grossit d'une photo par campagne. Pas urgent chez le
domaine de référence ; à traiter **avant** un domaine de 45 ha.

**Déjà au niveau, à ne pas refaire :** lectures en parallèle (PERF-1), copie locale Firebase sur le téléphone, file hors
ligne, fusion des modifications faites en même temps (FUSION-1), reprise de connexion (REPRISE-1), démarrage borné
(BOOT-1), garde-fous anti-perte, et 151 harnais qui rejouent le vrai code.

**Ordre recommandé** (détail au §5) : VALID-1 et LOGIN-1 (moins d'une journée à eux deux) → VOILE-1 et PROFILS-1 →
ENTREE-1 (une décision de ta part) → RENDU-1 → TAILLE-2 → PAQUET-1 → TEXTE-A → DONNEES-1 et IDS-1.

---

## 1. Ce qui a été mesuré

| Constat | Chiffre | Où / comment |
|---|---|---|
| Valider depuis la feuille une tâche démarrée un autre jour, Open-Meteo sans réponse | feuille **ouverte**, rien d'écrit à 1, 5, 15 et **30 s** | essai Chromium ; `confirmValidation` attend `fetchMeteoMoyenne` |
| Même geste, réseau coupé net (contre-épreuve) | feuille fermée, entrée écrite en **moins d'1 s** | idem |
| Ouverture à froid sans réseau : les profils | affichés (copie du téléphone) | essai Chromium, branche hors ligne de `_fbLoad` |
| … puis « Se connecter » | **refusé**, message « Mot de passe incorrect. » ; code réel `appCheck/fetch-network-error` | essai Chromium ; `confirmLogin` |
| Contre-épreuve : connexion simulée réussie | l'appli **entre** | idem |
| Ouverture à froid en ligne, Google et Firebase sans réponse | voile retiré à 4,8 s, zone des profils **vide jusqu'à 18,6 s** | essai Chromium ; attentes bornées 5 + 8 + 6 s de `_fbLoad` |
| Voile de démarrage | **3,42 s** après le chargement d'`app.js`, prêt ou pas (2,2 + 0,9 + 0,32 s) | bloc « SPLASH SCREEN » d'`app.js` |
| Démarrage du build de prod, processeur normal | premier affichage **0,47 s**, appli chargée **0,82 s** | Chromium, médiane de 3 |
| Idem, téléphone moyen (×4) | premier affichage **0,83 s**, appli chargée **1,57 s** ; 2,6 s de travail du processeur ; 3 tâches longues (max 193 ms) | idem |
| Éléments dans la page au démarrage | **4 429** — les 12 pages et 95 fenêtres sont là d'emblée | Chromium ; `index.html` = 4 346 balises |
| Paquet JS | **3 902 kB** (gzip 1 163 kB, brotli ≈ 870 kB), un seul fichier | `vite build` |
| … dont journal des nouveautés (`WHATS_NEW`, 300 versions) | **339 Ko** une fois réduit (≈ 9 % du JS) | extrait et réduit avec Terser |
| … dont console GT (`admin-gt.js`) | **254 Ko** (6,7 %) | carte des sources du build |
| … dont SDK Firebase | 446 Ko (11,7 %) | idem |
| Accueil (`goTo('home')`), téléphone moyen | **124 à 132 ms** de calcul ; 182 à 246 ms jusqu'à l'image | Chromium, médiane de 5, journal de 1 000 et de 15 000 entrées |
| Journal (`goTo('journal')`) | 48 à 54 ms de calcul ; **346 à 588 ms** jusqu'à l'image | idem |
| Une validation reçue d'un collègue, sur l'Accueil | **255 ms** d'écran figé (journal 1 000) → **613 ms** (journal 15 000) | idem ; rejoue ce que fait `_fbSubscribe` |
| … dont la copie complète du document reçu | 4 ms → **105 ms** | idem |
| … dont `renderHome` | 115 à 125 ms, quelle que soit la taille | idem |
| … dont `renderParcelles` + `computePStats` | 4 à 7 ms | idem |
| Poids d'une entrée de journal (règle publiée par Firestore) | **≈ 158 octets** → limite de 1 Mio vers **6 600 entrées** | entrées aux champs réels, calcul de `mv-taille-docs.mjs` |
| `historique` le 26/09 (domaine de référence) | 192 Ko, 18,8 % de la limite | §178a |
| Copies complètes des données dans le navigateur | jusqu'à **4** (instantané + 3 copies du jour), plus la copie Firebase | `_mvSnapWrite`, `_MV_BK_MAX`, `persistentLocalCache` |
| Textes sous 12 px | **2 031** endroits (635 écrits en dur + 1 396 par jeton) | `--pt-micro` 11 px ×985, `--pt-lbl` 10,5 px ×221, `--pt-nano` 9,5 px ×190 |
| … dont sous 10 px | **408** | 218 en dur + 190 `--pt-nano` |
| Interrupteur d'équipier `.val-toggle` | 44 × **26 px** | `styles.css` (backlog n° 39) |
| Transitions | 245, dont **57 de 250 ms ou plus** et 19 de 500 ms ou plus | `styles.css`, `index.html`, CSS des modules |
| Points de rupture d'écran | **17**, dont 4 écrits seulement dans le JS (360, 430, 700, 880) | idem |
| `content-visibility` (rendu différé des longues listes) | **0** | idem |

---

## 2. Vitesse — le modèle Linear

Linear tient en une règle : **un geste n'attend jamais le réseau**. L'écran change tout de suite, la synchronisation suit.
Ma Vigne a déjà la mécanique (file hors ligne, copie locale, fusion). Trois endroits la contournent.

### 2.1 « Valider » attend la météo — prouvé

`confirmValidation` (la feuille de validation, ouverte depuis la fiche d'une parcelle) et `saveJournalEntry` (le
formulaire du journal, statut « Validé ») font, dans cet ordre :

1. marquer la tâche « Validé » en mémoire ;
2. **attendre** `fetchMeteoMoyenne` — un appel à Open-Meteo, **sans limite de temps** ;
3. seulement ensuite : écrire l'entrée du journal, enregistrer, fermer la feuille.

L'appel part quand la tâche a été démarrée un jour précédent de la même période (`_findDebutTache`), ou quand la météo du
jour n'est pas encore chargée. Le service worker relaie cet appel, lui aussi sans limite de temps (`fetch(event.request)`
dans sa branche météo).

**Mesuré** : Open-Meteo sans réponse → feuille ouverte, aucune entrée, à 30 s. Réseau coupé net → tout passe en moins
d'une seconde (l'appel échoue vite, la fonction rend `null`). Le pire cas n'est donc pas « pas de réseau » : c'est **le
réseau qui traîne**, le cas courant au fond d'une parcelle.

**Lu dans le code, non provoqué** : si l'ouvrier ferme l'appli pendant l'attente, la validation est perdue — rien n'a encore
été enregistré.

⚠️ L'essai a contourné le service worker (sinon il fait l'appel à la place de la page, et le bac à sable le coupe net). Avec
lui, le même appel sans limite donne la même attente : attendu, non mesuré.

**Le bon patron existe déjà** : `pQuickValidate` (le bouton « Valider » de la carte de parcelle, le chemin le plus court)
écrit l'entrée, enregistre, puis lance la météo en tâche de fond et complète l'entrée quand elle arrive. Lot **VALID-1**.

### 2.2 L'ouverture

Ce que vit un ouvrier qui ouvre l'appli à froid (le téléphone l'avait fermée) :

1. **le voile** : 2,2 s d'attente fixe, 0,9 s de lueur, 0,32 s de flash — **3,42 s** comptées après le chargement
   d'`app.js`, que l'appli soit prête ou non. Sur un téléphone moyen, il disparaît vers **5 s** ;
2. **les profils** : en ligne, `_fbLoad` attend d'abord le serveur — statut du domaine (borne 5 s), liste des profils par
   Cloud Function après le jeton App Check (borne 8 s), puis lecture directe (borne 6 s) — et ne prend la liste gardée
   sur le téléphone **qu'après**. **Mesuré** sur un réseau qui ne répond pas : voile retiré à 4,8 s, zone des profils vide
   jusqu'à **18,6 s** ;
3. **sa tuile** : l'appareil se souvient du profil, une seule tuile — c'est déjà bien ;
4. **son mot de passe, à chaque ouverture** : `_fbLoad` finit toujours par l'écran de connexion, même quand la session
   Firebase est encore valable (c'est écrit en commentaire de `confirmLogin`) ;
5. **trois attentes de plus** avant de voir ses tâches : l'adresse du profil (`fbGetLoginEmail`, lancée dès la tuile), la
   connexion, le rafraîchissement forcé du jeton (`_mvLoadClaims(true)`) ; puis la lecture des 26 documents — en
   parallèle depuis PERF-1.

**Sans réseau — prouvé** : les profils s'affichent (copie du téléphone), la connexion échoue. L'erreur réelle est
`appCheck/fetch-network-error` ; `confirmLogin` n'a pas de branche pour elle et affiche **« Mot de passe incorrect. »**.
Avec une connexion simulée réussie, l'appli entre : le seul verrou est la connexion réseau. Quand le jeton App Check est
encore valable (environ une heure par défaut), l'erreur devient `auth/network-request-failed` et le message « Pas de
connexion réseau. » — juste, mais l'ouvrier n'entre pas davantage.

Le moteur pour faire mieux est **déjà là** : Firebase garde la session sur l'appareil, sa copie locale sert les lectures hors
ligne, la file envoie les écritures au retour du réseau, et `_mvApresEntree` sait déjà entrer sans réseau (il pose
`_dataReady` directement). Il manque **la porte** : reprendre la session au lieu de redemander le mot de passe, et montrer
les profils de l'appareil tout de suite. Lots **LOGIN-1**, **VOILE-1**, **PROFILS-1**, **ENTREE-1**.

### 2.3 Le rendu

**L'Accueil coûte 120 à 130 ms de calcul** sur un téléphone moyen, quelle que soit la taille du journal : c'est le prix fixe
de `renderHome`. Linear vise moins de 50 ms ; Google juge une interaction « bonne » sous 200 ms, affichage compris.
L'Accueil est au bord.

**Chaque validation d'un collègue fige les téléphones ouverts.** Quand `journal`, `parcelles` ou `travaux` change sur le
serveur, `_fbSubscribe` :

- fait une **copie complète** du document reçu (la base de la fusion, `_mvBaseNoter`) ;
- l'applique (`applyFbData`) et repasse les règles de renommage (`_mvAppliquerRenommages`) ;
- redessine **l'Accueil et Parcelles**, même si une seule des deux est affichée (et le Journal si on y est) ;
- sans rien regrouper : une validation écrit `parcelles`, `journal` et `travaux` → jusqu'à **trois vagues** de rendus.

Mesuré sur l'Accueil : **255 ms** d'écran figé avec 1 000 entrées, **613 ms** avec 15 000. La copie complète passe de 4 à
105 ms ; `renderHome` reste vers 120 ms ; Parcelles coûte peu (4 à 7 ms). À l'heure où toute l'équipe valide, en fin de
journée, c'est une suite de petits gels.

**Le Journal** calcule vite (environ 50 ms) mais met **350 à 590 ms** à s'afficher : c'est la mise en page d'une longue
liste. Aucune règle `content-visibility` dans l'appli, qui laisserait le navigateur ne mettre en page que ce qui se voit.

**Les transitions** : 57 sur 245 durent un quart de seconde ou plus, 19 une demi-seconde ou plus. Linear reste vers
100–150 ms : une animation longue est une attente.

### 2.4 Le paquet

Un seul fichier JS de **3 902 kB** (gzip 1 163 kB, brotli ≈ 870 kB), lu d'un bloc :

| Fichier | Part du JS livré |
|---|---|
| `utils.js` — dont `WHATS_NEW` 339 Ko, `MV_AIDE` 76 Ko, `MV_INFO` 68 Ko | 14,1 % |
| `app.js` | 13,1 % |
| SDK Firebase | 11,7 % |
| `pilotage.js` | 11,6 % |
| `planning.js` | 8,9 % |
| `cave.js` · `cuvier.js` | 8,5 % · 7,9 % |
| `reglages.js` | 7,5 % |
| **`admin-gt.js` (la console GT)** | **6,7 %** |
| `tracteur.js` · `phyto.js` · `reserve.js` · `firebase.js` · `onboarding.js` | 3,0 · 3,0 · 1,8 · 1,5 · 0,6 % |

Le service worker évite de le retélécharger ; le téléphone doit quand même le lire et l'exécuter à chaque ouverture
(≈ 0,46 s de calcul mesuré sur un téléphone moyen). Deux morceaux ne servent presque à personne : **le journal des
nouveautés** (300 versions, dont un client ne lit que les dernières) et **la console GT** (toi seul).

⚠️ **Contrainte gelée** (§6) : pas d'`import()` dynamique — l'appli repose sur `window.X()` et les `onclick` écrits dans le
HTML. Rien dans ce plan ne la remet en cause : le journal des nouveautés peut devenir un fichier de données lu à la
demande, et la console GT une page à part.

### 2.5 Déjà au niveau

- **Lectures en parallèle** au chargement (PERF-1). La ligne de CLAUDE.md §4 qui disait « ~40 lectures une par une » était
  périmée : corrigée dans ce lot.
- **Copie locale Firebase** (`persistentLocalCache`, plusieurs onglets) et **file hors ligne**.
- **Écriture sans attente** : `saveData` écrit en mémoire, rend la main, envoie ensuite — sauf les deux cas du §2.1.
- **Instantané local regroupé** : une écriture toutes les 2 s, et au passage en arrière-plan.
- **Démarrage borné** (BOOT-1) : aucune attente sans limite au boot — seulement des bornes trop longues mises bout à bout.

---

## 3. Données — le modèle Notion

Notion tient en deux règles : **des petites unités** (chaque bloc est un enregistrement), et **des liens par identifiant**
(renommer une page ne casse rien). Ma Vigne fait l'inverse sur les deux points.

### 3.1 Un document par type de données

Chaque module est **un** document Firestore par domaine (`mavigne_<domaine>/<clé>`, `{ value: … }`), **réécrit en
entier** à chaque enregistrement — dans une transaction qui relit le serveur et fusionne (FUSION-1), sauf `kml_polygons` et
`travaux` (écriture directe) et `parcelles` (sa propre fusion). Conséquences :

1. **Le plafond de 1 Mio.** Firestore refuse tout document plus gros (§177). Une entrée de journal réaliste pèse
   ≈ 158 octets : le journal atteint la limite vers **6 600 entrées**. Ce jour-là, plus aucune validation ne s'enregistre,
   pour tout le domaine. Le journal **n'est jamais allégé** (ARCH-1 : « le journal n'est jamais vide au changement de
   campagne »), et il reçoit en plus **une entrée météo par jour et par commune** (`injectMeteoIfNeeded`). Seul
   `historique` a une garde de taille (`_ARC_PLAFOND`) — elle refuse proprement d'archiver, donc **de clore la campagne**,
   le jour où elle mord. `historique` grossit d'une photo par campagne : 192 Ko le 26/09 chez le domaine de référence.
2. **Chaque petite saisie renvoie tout le document**, et chaque téléphone ouvert le reçoit en entier, puis le recopie
   (§2.3).
3. **Firestore recommande de ne pas écrire un même document plus d'environ une fois par seconde.** Une équipe de 12 qui
   valide en fin de journée écrit toujours le même document `journal` : les transactions se rejouent (elles sont faites
   pour), mais le débit est borné.

**La date réelle dépend du rythme de chaque domaine** : `npm run taille -- ancienne.json recente.json` (§177) la calcule
à partir de deux sauvegardes complètes, sur ton poste, sans que rien ne sorte.

### 3.2 Les liens passent par les noms

- une entrée de journal porte `parcelle`, `tache` et `qui` **en texte** ;
- une parcelle range ses tâches **par nom** (`taches: { Taille: 'Validé' }`) ;
- le planning range les jours **par nom de salarié** ;
- les écrans relient tout par comparaison de noms (`PARCELLES.find(x => x.nom === j.parcelle)`, partout).

D'où RENOM-3 (§232) pour renommer une tâche, et une règle tacite : on ne renomme ni une parcelle ni un salarié. C'est la
première leçon de Notion : **un identifiant qui ne change jamais, le nom n'étant qu'une étiquette**.

### 3.3 Les copies sur le téléphone

L'instantané local (`mavigne_data_v1_<domaine>`) contient **toutes** les données, plus jusqu'à **3 copies du jour**
(`mavigne_backup_<date>`) : 4 copies complètes dans le stockage du navigateur (environ 5 Mo par site), en plus de la copie
Firebase. Avec 5 000 entrées de journal, une copie pèse déjà ≈ 1 Mo. La saturation est gérée (`_mvLsPut` purge les copies
du jour) ; le coût reste : chaque instantané sérialise **tout**, d'un bloc, pendant que l'écran attend.

### 3.4 La synchronisation

« Tout lire, puis écouter » est un bon schéma, et PERF-1 l'a rendu parallèle. Les deux goulots sont ailleurs : la
**taille** des documents (§3.1) et le **coût par changement reçu** (§2.3). Ni Node.js ni les Cloud Functions ne sont sur
le chemin d'une saisie ou d'un affichage.

### 3.5 Et Prisma, une base SQL ?

**Recommandation : rester sur Firestore, et changer la forme des données.** Ce que Firestore donne aujourd'hui et qu'il
faudrait reconstruire : la copie hors ligne et la file d'attente, l'écoute en temps réel, des règles d'accès prouvées
(53 requêtes rejouées, RULES-1), l'isolement des domaines, un coût proche de zéro, et les 164 Ko de mécanique anti-perte de
`firebase.js`. Les défauts relevés ici tiennent à la **forme** (de gros tableaux, des liens par nom), pas au moteur : une
base SQL avec la même forme aurait les mêmes, et Prisma n'a pas de connecteur Firestore. Les lots DONNEES-1 et IDS-1
appliquent les leçons de Notion **dans** Firestore.

---

## 4. Ergonomie terrain

### 4.1 Le texte

**2 031 endroits** écrivent un texte sous 12 px, **408** sous 10 px. Les deux tiers passent par trois jetons : `--pt-micro`
(11 px, 985 emplois), `--pt-lbl` (10,5 px, 221), `--pt-nano` (9,5 px, 190). C'est la bonne nouvelle : **relever trois
lignes de `styles.css` touche 1 396 endroits**. Le backlog le dit déjà (entrée 36) : le plancher d'abord, sur une maquette
de trois écrans (accueil ouvrier, session tracteur, registre phyto), puis un réglage « Taille du texte » jumeau de
« Plein soleil ».

### 4.2 Le parcours qui compte : valider

Compté dans le code, pas chronométré au doigt :

- **depuis la carte de parcelle** : un appui sur « Valider » (`pQuickValidate`), avec annulation possible. C'est le bon
  geste, conforme à ta règle du 30/09 (l'ouvrier n'a qu'à valider) ;
- **depuis la fiche de la parcelle** : le premier appui sur une tâche simple la **démarre** (`tapTacheSimple` → « En
  cours », enregistré), le deuxième ouvre la feuille de validation, le troisième valide — et c'est cette feuille qui attend
  la météo (§2.1) ;
- **à l'ouverture à froid**, avant tout ça : le voile (≈ 5 s sur un téléphone moyen), la tuile, le mot de passe,
  « Se connecter », les attentes réseau.

⚠️ **Question pour toi** : sur la fiche de la parcelle, le premier appui « démarre ». Est-ce voulu ? (Le démarrage nourrit
la durée réelle de la tâche.) Rien n'est proposé tant que tu n'as pas tranché.

### 4.3 Les cibles et la réponse au toucher

- `.val-toggle`, l'interrupteur qu'un ouvrier bascule par équipier, avec des gants : **26 px** de haut, pour 44 recommandés
  (backlog entrée 39).
- `touch-action: manipulation` (pas d'attente du double appui) : 9 endroits seulement.
- `:focus-visible` : 20 ; `aria-label` : 157 ; `prefers-reduced-motion` : 17. L'accessibilité existe par endroits, sans
  règle d'ensemble.

### 4.4 Un message doit dire la vérité

« Mot de passe incorrect. » quand le réseau manque, c'est le pire message possible : l'ouvrier retape, se croit fautif,
appelle son responsable. Même famille que le « Pas de connexion réseau » qui mentait avant BOOT-1 (§68h). Lot LOGIN-1.

### 4.5 Déjà bien

Une seule tuile quand l'appareil se souvient · « Plein soleil » · le dock à 4 cases + « Plus » · une seule primitive
d'onglets (`.mvu-tab`) · l'aide par écran qui lit le code · le kit graphique commun (KIT-1 à 4) · l'Accueil et le
Pilotage en rangées (ALIGN-1 à 3) · la validation en un appui depuis la carte, avec annulation.

---

## 5. Le plan

Efforts **estimés**, en journées de lot (code + harnais + aide relue). Chaque lot suit la méthode habituelle : maquette quand
un écran change, harnais et contre-épreuve, Règle d'or n° 4.

| Ordre | Lot | Ce que ça change pour l'utilisateur | Effort | Risque | Décision |
|---|---|---|---|---|---|
| 1 | **VALID-1** ✅ fait (§242) | « Valider » ne bloque plus jamais : la feuille se ferme tout de suite, la météo complète l'entrée ensuite | ½ j | faible | — |
| 2 | **LOGIN-1** ✅ fait (§242) | sans réseau, l'écran dit « pas de réseau », plus « mot de passe incorrect » | ¼ j | nul | — |
| 3 | **VOILE-1** ✅ fait (§243) | l'appli s'ouvre 2 à 3 s plus tôt | ¼ j | nul | décidé : chorégraphie complète à la 1re ouverture seulement |
| 4 | **PROFILS-1** ✅ fait (§243) | la tuile apparaît tout de suite, même sur un réseau qui traîne | ½ j | faible | — |
| 5 | **ENTREE-1** ✅ fait (§244) | décision du 04/10 : le mot de passe se retape comme d'habitude, et **ouvre l'appli même sans réseau** (empreinte gardée sur le téléphone, dernière personne connectée) | 1 à 2 j | moyen (sécurité) | tranché |
| 6 | **RENDU-1** ✅ fait (§245) | plus de gel quand un collègue valide : seule la page affichée se redessine, une fois (Accueil allégé : à faire) | 1 à 2 j | moyen | — |
| 7 | **TAILLE-2** ✅ fait (§246) | un document qui grossit prévient **avant** d'être refusé (alerte GT à 90 % — décision de Nico —, refus clair et saisie au coffre au-delà) | ½ j | nul | — |
| 8 | ~~**PAQUET-1**~~ — abandonné | décision du 04/10 : le journal des nouveautés reste dans le paquet, comme aujourd'hui | — | — | tranché |
| 9 | **TEXTE-A** | lisible au soleil et avec des gants (backlog 36 et 39) | 1 à 2 j | faible | **maquette d'abord** (demandée le 04/10) |
| 10 | **JOURNAL-1** | le Journal s'affiche en moins de 150 ms | ½ j | faible | — |
| 11 | **DONNEES-1** | plus aucun document près de la limite, à 45 ha comme à 12 | 3 à 5 j | **élevé** | oui, après `npm run taille` |
| 12 | **IDS-1** | renommer une parcelle ou un salarié devient sûr | 3 à 5 j | élevé | oui |
| 13 | **GT-1** | la console GT quitte le téléphone des clients | 1 j | moyen | **décidé le 04/10** (à caler avec PREP-1) |

### 5.1 Les premiers lots, en détail

**VALID-1 — écrire d'abord, la météo ensuite.** Le patron de `pQuickValidate`, appliqué à `confirmValidation` et
`saveJournalEntry`, et un appel météo borné :

```js
// fetchMeteoMoyenne : jamais plus de 6 s. Au-delà, l'entrée vit sans météo.
async function fetchMeteoMoyenne(dateDebut, dateFin){
  var ctl = (typeof AbortController === 'function') ? new AbortController() : null;
  var t = ctl ? setTimeout(function(){ ctl.abort(); }, 6000) : 0;
  try{
    // … le corps d'aujourd'hui, avec : var r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
  }catch(e){ return null; }
  finally{ if(t) clearTimeout(t); }
}

// confirmValidation : l'entrée est écrite et la feuille fermée AVANT tout appel réseau
JOURNAL.unshift(_mvEqApplique(jEntry));
recalcTravaux(_validTache);
injectMeteoIfNeeded(date);
saveData('parcelles'); saveData('journal'); saveData('travaux');
document.getElementById('ovValidation').classList.remove('open');
renderParcelles(); computePStats();
_mvMeteoApres(jEntry.id, _findDebutTache(_validParcelle, _validTache, date) || date, date);

// La météo arrive (ou pas) : on complète l'entrée et on enregistre de nouveau.
// On la retrouve par son id : entre-temps, une synchronisation a pu remplacer le tableau du journal.
function _mvMeteoApres(id, d0, d1){
  fetchMeteoMoyenne(d0, d1).then(function(m){
    if(!m) return;
    var e = (window.JOURNAL || []).find(function(x){ return x && x.id === id; });
    if(e){ e.meteo_snapshot = m; saveData('journal'); }
  }).catch(function(err){ if(window._mvAvale) window._mvAvale(err, 'app.js/_mvMeteoApres'); });
}
```

Même borne dans la branche météo de `sw.js` (le réseau d'abord, mais pas plus de 6 s avant de servir la copie). Et
`pQuickValidate` gagne à passer par `_mvMeteoApres` : il complète aujourd'hui l'objet d'origine, qu'une synchronisation a
pu remplacer entre-temps (lu dans le code, à vérifier). Harnais : le geste avec une météo qui ne répond jamais ferme la
feuille et écrit l'entrée ; contre-épreuve en remettant l'`await`.

**LOGIN-1 — le vrai message.** Dans le `catch` de `confirmLogin`, avant le « Mot de passe incorrect » par défaut :

```js
} else if (!navigator.onLine || /^appCheck\//.test(e.code || '')) {
  // App Check n'a pas pu obtenir son jeton : le mot de passe n'a même pas été vérifié.
  _loginErr = navigator.onLine ? 'Le serveur ne répond pas. Relancez l\u2019application, puis réessayez.'
                               : 'Pas de connexion réseau \u2014 la connexion en demande.';
  _loginRelancer = navigator.onLine;
}
```

Harnais : chaque code d'erreur de connexion donne son message ; contre-épreuve sur `appCheck/fetch-network-error`.

**VOILE-1 — le voile tant que rien n'est prêt, pas plus.** Le voile s'efface dès que l'écran de connexion (ou l'Accueil) est
prêt, avec un fondu de 250 ms et un minimum de 600 ms pour ne pas clignoter. La chorégraphie complète (lueur, flash) reste
pour la **première ouverture** de l'appareil. Le filet de 6 s reste. Gain attendu : 2 à 3 s par ouverture.

**PROFILS-1 — la tuile de l'appareil d'abord.** Quand le téléphone garde une liste de profils, l'afficher **avant** les
attentes réseau de `_fbLoad` ; la liste du serveur la remplace en arrivant (`_mvRosterTardif` sait déjà le faire).
Aujourd'hui : 18,6 s de zone vide sur un réseau qui traîne. Attention à la règle de `_mvDonneesAppareil` (jamais une fois
quelqu'un connecté ou une tuile touchée) : elle reste vraie.

**ENTREE-1 — rouvrir, c'est être dedans.** Une décision d'abord, parce que les tuiles laissent penser que certains téléphones
sont **partagés** :

| Option | À l'ouverture | Hors réseau | Téléphone partagé |
|---|---|---|---|
| A. Reprise de session | directement l'Accueil si la session de l'appareil correspond au profil mémorisé | ✅ | ❌ le suivant entre sous le nom du précédent |
| B. Reprise + code à 4 chiffres | la tuile, puis 4 chiffres vérifiés **sur l'appareil** | ✅ | ✅ chacun son code |
| C. Réglage par appareil « Rester connecté sur ce téléphone » | A si coché, l'écran actuel sinon | ✅ si coché | ✅ on ne coche pas |

**Recommandation : C**, proposé coché pour un salarié sur son propre téléphone, décoché pour un administrateur. La reprise
doit garder la garde SEC-2 du premier mot de passe, `_mvSessArm`, et la purge SEC-5 à la déconnexion. Squelette :

```js
// Fin de _fbLoad, AVANT initLogin : la session de l'appareil correspond-elle au profil mémorisé ?
async function _mvRepriseSession(){
  if (!_mvRepriseAutorisee()) return false;              // le réglage de l'appareil (option C)
  var u = await _mvAuthPret();                           // onAuthStateChanged, borné à 3 s
  if (!u || !u.email) return false;
  var memo = _loginMemLire().trim().toLowerCase();
  var m = (window.MEMBRES || []).find(function(x){
    return x && x.statut !== 'Inactif' && x.email
      && String(x.email).toLowerCase() === String(u.email).toLowerCase()
      && String(x.nom).trim().toLowerCase() === memo;
  });
  if (!m || (window._mvMustChangePwd && window._mvMustChangePwd())) return false;
  m._firebaseUser = u; currentUser = m; window.currentUser = m;
  _mvSessArm(u.uid);
  document.getElementById('login-screen').style.display = 'none';
  _mvApresEntree();                                      // sait déjà entrer sans réseau
  return true;
}
```

⚠️ À vérifier avant le code : que la copie de l'appareil porte bien l'adresse des membres (SEC-3 l'a retirée de la liste
publique des profils), et ce que rend `_mvMustChangePwd()` hors réseau avec un jeton expiré.

### 5.2 Les lots suivants, en bref

**RENDU-1 — ne redessiner que l'écran visible, une fois par image.** Dans `_fbSubscribe`, remplacer les appels directs par
une demande regroupée :

```js
var _mvSale = {}, _mvSaleRaf = 0;
function _mvRendreBientot(cle){
  _mvSale[cle] = true;
  if (_mvSaleRaf) return;
  _mvSaleRaf = requestAnimationFrame(function(){
    var c = _mvSale; _mvSale = {}; _mvSaleRaf = 0;
    var pid = ((document.querySelector('.page.active') || {}).id) || '';
    var vigne = c.parcelles || c.journal || c.travaux;
    if (vigne && pid === 'page-home') window.renderHome();
    if (vigne && pid === 'page-parcelles') { window.renderParcelles(); window.computePStats(); }
    if (c.journal && pid === 'page-journal' && window.renderJournalList) window.renderJournalList();
    // … les autres pages, une ligne chacune, comme aujourd'hui
  });
}
```

Une validation reçue = un seul rendu, de la seule page affichée ; une page cachée se redessine quand on y va (`goTo` le
fait déjà). Ensuite, à mesurer : la copie complète de `_mvBaseNoter` (105 ms à 15 000 entrées) — si `applyFbData` ne
modifie jamais la valeur reçue, elle peut servir de base telle quelle. **À vérifier** avant d'y toucher : c'est le cœur de
FUSION-1. Enfin, alléger `renderHome` (le prix fixe de 120 ms), carte par carte, avec la mesure Chromium pour juge.

**TAILLE-2 — prévenir avant de refuser.** Dans `fbSave`, avant l'envoi : une estimation de la taille (la règle de
`mv-taille-docs.mjs`), un `warning` journalisé au-delà de 90 % (70 % au départ ; 90 % décidé par Nico le 04/10, le domaine de
référence étant déjà vers 800 Ko), il remonte à l'Admin GT (AVALE-2), et au-delà de 1 Mio un
refus clair à l'écran, au lieu d'un échec Firestore incompris.

**PAQUET-1 — le journal des nouveautés hors du paquet.** Garder dans `utils.js` les blocs récents — jusqu'à la plus vieille
version encore en usage dans le parc d'appareils (VER-1 tient cette liste) — et verser le reste dans
`public/nouveautes.json`, lu à la demande par le Journal des nouveautés et par un récapitulatif plus ancien. C27 reste vrai
(le tableau s'ouvre sur `APP_VERSION`). À caler avec ANN-1 (niveaux, cibles) et `mv-whatsnew-check`.

**TEXTE-A — le plancher.** `--pt-nano` 9,5 → 11 px, `--pt-lbl` 10,5 → 11,5, `--pt-micro` 11 → 12 : trois lignes,
1 396 endroits. Puis les 635 tailles en dur, au tableau motif → compte attendu. Avec `.val-toggle` à 44 px de haut.
Maquette d'abord (backlog 36).

**JOURNAL-1 — ne mettre en page que ce qui se voit.** `content-visibility: auto` sur les lignes du journal et des longues
listes, avec une hauteur réservée ; ou un affichage par lots de 100 avec « Voir plus ». Mesuré avant/après dans Chromium.

**DONNEES-1 — un document par campagne.** Le journal vivant ne garde que la campagne en cours (et ce qui n'est rattaché à
aucune) ; chaque campagne close part dans son propre document, écrit une fois, lu à la demande par l'historique et le
comparatif — dans la ligne de ta décision du 03/10 (par défaut, l'année vigne en cours). Même chose pour `historique` :
une photo, un document. La météo quotidienne peut quitter le journal pour son propre document. Contraintes à tenir : C12
(toute clé dans `FB_REALTIME` ou `FB_STATIC`) et C13 (plancher anti-écrasement) pour des clés à nom variable ; et l'ordre
de CONF-3 : copier, prouver l'aller-retour, regarder l'écran, **puis** retirer — jamais l'inverse.

**IDS-1 — des identifiants à côté des noms.** Chaque parcelle, tâche et membre reçoit un `id` qui ne change jamais ; les
nouvelles entrées portent `pid`, `tid`, `mid` **en plus** des noms ; les lecteurs préfèrent l'id et retombent sur le nom ;
une fois tout le parc passé, renommer revient à changer une étiquette. Long, mais chaque étape se livre seule, sans rien
casser.

**GT-1 — la console GT à part.** Sortir `admin-gt.js` dans une page à elle (`gt.html`, sa propre entrée Vite) : 254 Ko de
moins chez chaque client, et une surface d'attaque en moins sur leur téléphone. À arbitrer avec PREP-1 (le mode
préparation entre dans les écrans normaux).

---

## 6. Ce qui n'a pas été mesuré

- **Un vrai téléphone** : le « téléphone moyen » est un processeur ralenti ×4 dans Chromium, pas un Android d'entrée de
  gamme ni un iPhone (Safari se comporte autrement, surtout pour le stockage).
- **Un vrai réseau** : rien sur 4G. Les attentes de l'ouverture sont lues dans le code ; seuls les cas « pas de réseau »
  et « réseau sans réponse » ont été joués.
- **Les vraies tailles de documents** : estimées sur des entrées aux champs réels. `npm run taille` sur deux sauvegardes
  complètes donne les vraies, et le mois de la limite.
- **L'essai météo avec le service worker** dans la boucle (contourné, §2.1).
- **La perte d'une validation si l'appli est fermée pendant l'attente** : lue dans le code, non provoquée.
- **Lighthouse** n'a pas été lancé (backlog entrée 32).
- **Les gestes du §4.2** : comptés dans le code, pas au doigt.

## 7. Méthode, pour rejouer

- **Paquet** : `npx vite build --sourcemap --outDir <dossier hors du dépôt>`, puis la carte des sources répartie par
  fichier ; `WHATS_NEW`, `MV_AIDE` et `MV_INFO` extraits d'`utils.js` par son arbre syntaxique, puis réduits par Terser.
- **Navigateur** : `npm i @sparticuz/chromium@131 puppeteer-core@23` dans `/home/claude`, jamais dans le dépôt ; le build
  servi par un petit serveur local ; Google et Firebase coupés (ou laissés sans réponse) au niveau de la page ;
  `Emulation.setCPUThrottlingRate` à 4 ; `setBypassServiceWorker` pour l'essai météo.
- **Données** : injectées par `applyFbData`, puis connexion simulée — la méthode d'`e2e-local.mjs` ; un domaine fictif de
  40 parcelles et 22 personnes, un journal de 1 000 puis 15 000 entrées aux champs réels (12 % de météo).
- **Temps** : médiane de 5 essais (3 pour le démarrage). « Calcul » = le JavaScript seul ; « jusqu'à l'image » = jusqu'à
  l'image suivante, mise en page comprise.
- Les scripts de mesure ne sont pas versionnés (comme les captures de DEMO-4). Les verser au dépôt
  (`scripts/mv-mesure-perf.mjs`, hors de `npm run check`) serait un lot à part.
