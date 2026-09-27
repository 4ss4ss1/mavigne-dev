# Ma Vigne — Référence des modules

> Scindé de `CLAUDE.md` le 27/09/2026 (§188). Ce fichier décrit **comment chaque module fonctionne
> aujourd'hui** : modèle de données, Cloud Functions, parcelles, journal, campagne, phyto, Admin GT,
> planning, Cave, Pilotage, design, terrain, tarifs, RGPD, aide, guide, démo.
> ⚠️ **Avant de toucher un module, lire SA section ici** — puis chercher les fonctions touchées dans
> les chantiers (`grep -rn "nomDeFonction" CLAUDE.md docs/claude/`), qui racontent les pièges.
> Les numéros de section sont ceux d'origine : « §20b » reste « §20b ». Index : `docs/claude/INDEX.md`.

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
★★ **Et depuis TIERS-1 (§155), « Script error. »** : l'erreur d'un script d'une autre adresse arrive effacée par le
navigateur (ni fichier, ni ligne, ni pile). Pas de toast ; `info` local (3 par session) et UNE entrée par session au
journal du domaine, avec les scripts d'autres adresses présents dans la page — c'est elle qui dira d'où ça vient.

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
★★★ **`_mvPaieCount` compte désormais `taux_serie`** (12/08, §36) : ce n'est plus un dérivé, c'est
**la source de tout coût de main-d'œuvre daté**. `taux_hist`, lui, reste un dérivé et ne compte pas.

★★★ **Le document `paie` — modèle à jour (§36)** :
```
taux[nom]        MIROIR du taux EN VIGUEUR AUJOURD'HUI — pas la dernière ligne
taux_serie[nom]  [{d:'YYYY-MM-DD', v:12.10}] croissante — SOURCE DE VÉRITÉ
taux_hist[nom]   [{d,de,a}] — trace historique, lue UNIQUEMENT pour dériver une
                 série absente. Aucun calcul ne s'en sert.
gnr_appoints[]   {id,d,l,pu,f,par} — appoints de cuve (Tracteur)
```
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
- ★★ **Un onglet unique n'est pas un choix, c'est un décor** (§19a) : quand un rôle n'a accès qu'à
  un seul onglet, `#plan-tabs` est masqué en entier plutôt que d'afficher une barre à une case.
  Le Planning le fait pour l'ouvrier.
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

### ★★★ L’ESSAI EST BORNÉ (14/08 — §40)

**15 jours, reconductibles UNE FOIS, puis lecture seule.** Trois nombres, deux fichiers :

| | `functions/claims.js` | `src/admin-gt.js` |
|---|---|---|
| durée | `TRIAL_DAYS = 15` | `_FC_TRIAL_DAYS = 15` |
| borne | `TRIAL_MAX_RENEW = 1` | `_FC_TRIAL_MAX = 1` |
| alerte | `TRIAL_WARN_D = 3` | seuil `d<=3` dans `_mvTrialBanner()` (`app.js`) |

⚠️ **Ces nombres sont DUPLIQUÉS et c'est assumé** : l’un affiche, l’autre fait respecter. Si l'un
bouge sans l'autre, **l'écran promet ce que le serveur refuse**. `harnais-reconduction.mjs` et
`harnais-bandeau-essai.mjs` comparent les fichiers entre eux et rougissent.

**Qui fait foi, et qui n'est qu'une copie.** Ce qui gèle le client, c'est le claim `trial_until`,
posé sur chaque membre. `_guerettech/tenants.clients[slug].trialExp` en est la **copie** — celle que
`trialWatch` lit, parce qu'elle ne peut pas parcourir les jetons de tous les membres de tous les
domaines chaque nuit. Les deux s'écrivent dans le même geste (`_fcSaveAbo`, `agtInsTrialGo`,
`gtRenewTrial`). **Si un jour l'un part sans l'autre, la veille se trompera de date en silence.**

**⚠️ LA LECTURE SEULE EST CÔTÉ NAVIGATEUR.** `_mvCheckExpired()` pose `window._MV_LOCKED`,
`saveData()` refuse en tête (`app.js:703`). **Aucune règle de `firestore.rules` ne lit
`trial_until`** — la base accepte toujours les écritures d'un domaine expiré. (Le mot « trial » y
apparaît deux fois, dans des commentaires sur `checkTrialToken` : mécanisme sans rapport.) C'est un
frein commercial, pas une serrure. Écrit ici pour que personne ne le découvre autrement.

**Nouvelles clés du registre** : `trialRenewals` (0|1) · `trialRenewedAt` · `trialPrevu` (essai
accordé mais pas encore démarré, cf. §40) · `trialExp`. Marqueurs anti-doublon des mails :
`_guerettech/trial_mails` `{value:{slug:{j3,exp,relance}}}`.

## 14c. ★ L'écran d'accueil public

**Le problème.** `_fbLoad` routait tout visiteur sans tenant vers `showOnboarding()` → un prospect
tombait sur un assistant « Configuration initiale » **qui ne pouvait jamais aboutir**.

**La solution** (`firebase.js` + `onboarding.js`, **aucun bump**) : un écran construit dans l'écran
de connexion **qui existe déjà**, injecté dans `#login-profiles`. **Trois portes** : découvrir le
logiciel · démo guidée · champ « lien d'installation » acceptant **une URL complète ou un slug nu**.

Le logo reste **tapable 5 fois** → panneau GT, **sans avoir à taper `?tenant=`**.

⚠️ Le **vrai** chemin d'installation (`?tenant=slug` + statut `pending`) est **intégralement
préservé**. ★ **Le formulaire d'essai du site fonctionne** : c'est par lui qu'est arrivé le prospect Gironde.

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
Coût mesuré chez le domaine de référence : **≈ 941 heures fantômes**, soit **~28 % de la charge totale**.

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

> ★ **PREP-1 (16/09)** : « Préparer ce domaine », sur la carte client, ouvre ses écrans en direct — **§134**.

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
**l'assistant `_agtIns` était en place et avait servi pour l'installation de le second domaine.**

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
  | le domaine de référence | `marchand-grillot` | `prénom.marchand-grillot@`**`mavigne.app`** |
  | le second domaine | `domaine-chapelle-et-fils` | `prénom.`**`domainechapelle`**`@mavigneapp.fr` |

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
  ⚠️ **le prospect Gironde est en Gironde : 225 L.** Sinon toute sa cave — part des anges, volumes d'ouillage,
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

### Déploiement (✅ FAIT le 11/08)

```
xcopy functions ..\mavigne-sauvegardes\avant-mer\functions\ /E /I /Y
firebase deploy --only functions:submitMiseEnRoute
npm run build && firebase deploy
```

⚠️ Cibler la fonction **par son nom**. Pas de rules, pas de backfill.
Fichiers : `src/admin-gt.js` · `src/firebase.js` · `functions/leads.js` ·
`public/mise-en-route.html`. **Aucun bump.**
✅ **Déployé le 11/08.** ⚠️⚠️ **Mais aucun de ces cinq lots n’a encore servi de bout en
bout** : l’installation à blanc sur un slug jetable reste à faire, et c’est elle qui transforme
le « 20 h → ~9 h » en mesure. **Un lot déployé mais jamais exécuté n’est pas un lot validé** —
c’est la même famille de piège que « livrer n’est pas intégrer », d’un cran plus loin.
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
- ★★★ **« Jour de remplacement » — IL COMPTE COMME UN JOUR PRÉVU.** Règle métier redite plusieurs
  fois par Nico : *« comme si le planning était déjà prévu comme ça, puisque ça ira en remplacement
  d'un autre moment »*. `Math.max(0, ecart)` empêchait les deux moitiés d'un échange de s'annuler →
  badge bleu, `_planRempH`.
  ⚠️⚠️ **Corrigé le 23/08 (§55b)** : la référence valait `_planDayH` — les heures **FAITES** — donc
  l'écart d'un jour d'échange était **forcé à zéro dans les deux sens**. Elle vaut désormais
  `_planRefH`, l'**ATTENDU**. Sur un jour tenu normalement, attendu == fait : rien ne change. Sur un
  jour manqué ou pris en retard, **l'écart devient négatif**, et c'est le but.
  ⚠️ **`_planRempH(mbr, m, fait)`** : le 3ᵉ argument rend la mesure de **présence** (heures faites),
  pour `_planPresentRef` seulement. Deux questions, deux mesures.
  ★ **`_planRefPart(plId,m,d,e)`** (§55d) est la définition **unique** de ce qu'un jour pèse dans la
  référence : modèle si `pl>0`, horaire posé si jour d'échange, **0** sinon (repos, jour
  supplémentaire, récup). Elle borne la neutralisation d'absence — jamais la dette.
- ★★★ **« Heures dues » — DEUX MOTIFS LES DOIVENT, ET ILS SONT HORS DE LA FENÊTRE.**
  `CONFIG.hsup_dues_debut` borne les motifs **neutres** (arrêt, congé sans solde, absence non
  précisée) : eux sortent seulement de la référence, **jamais rétroactivement**.
  ⚠️⚠️ **Le retard (20/08) puis l'absence injustifiée (23/08, §55m) en ont été SORTIS** : ces deux-là
  doivent leurs heures, réglage posé ou non. Raison identique dans les deux cas — *ce n'est pas une
  politique du domaine, c'est de l'arithmétique*, et **l'écran qui pose le motif l'annonce déjà**
  (`sub: 'Heures dues · journée non payée'`, `_planAbsEffet` → « heures dues »).
  ⚠️⚠️⚠️ **Pourquoi c'était grave, et pas cosmétique** : hors fenêtre, les heures d'une injustifiée
  ne passaient QUE par l'écart du mois, et **`_planSupMonth = Math.max(0, ecart)` écrase tout écart
  négatif à zéro**. Elles n'atteignaient donc ni « reste à prendre », ni le compteur, ni aucun cumul.
  **Elles disparaissaient au changement de mois.**
  ★ Conséquence d'affichage à connaître : les heures dues sont **neutralisées dans la référence**
  avant d'être inscrites au compteur (sinon double peine). **L'écart d'un mois à absence tombe donc
  à zéro** — la dette n'est pas dans l'écart, elle est dans « heures dues » et dans « reste à
  prendre ». C'est voulu : l'écart, écrasé à zéro dès qu'il est négatif, **ne peut rien porter**.
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

★★★ **SUITE DU 12/08 — le même piège, un cran plus loin (§33).** Le correctif ci-dessus réglait
la question 2 (« a-t-il travaillé pendant cette période ? ») **tant qu'un salarié n'a qu'un seul
contrat**. Dès qu'il en signe un second, saisir la nouvelle date de début **écrasait la
précédente** : le passé disparaissait quand même, et cette fois **à la saisie**, hors de portée de
tout code de lecture. `m.contrats[]` + `window._mvContrats(m)` corrigent le modèle.
**Trois questions, trois lecteurs, à ne plus jamais confondre :**

| question | qui répond | voit |
|---|---|---|
| est-il là **aujourd'hui** ? | `_mvEnContratLe` | tous les contrats |
| a-t-il travaillé **sur cette période** ? | `_mvEnContratSurPeriode`, `_inContractDay` | tous les contrats |
| combien lui doit-on **sur CE contrat** ? | `_planInContract` (**35 appels**) | **le contrat en cours seul** |

⚠️⚠️ **`_planInContract` NE DOIT PAS être élargi.** Il pilote le plafond des 1607 h, les congés et
toute la grille. Règle de Nico : *un contrat = un compteur ; deux contrats séparés par une coupure
= deux compteurs.* Les fondre fausserait la paie.

### ★★ Équipe collective (COLLECTIF-1)

Un membre peut être une **équipe** : une ligne de planning pour N personnes, effectif modifiable
**jour par jour**. `_mvEstCollectif`/`_mvEffDef`/`_mvPoidsNom` · `_planEffN`/`_planCollH`/
`_planEffApply` · **`_mvPartCalc` pondéré**.
★ **`_headWeek` expose deux mesures** : `head` (pondéré) et **`headPerm`** (permanents seuls).
**Arbitrage figé** : cadence, ordre de passage et journée raisonnent sur les **fiches permanentes**.

★★★ **Le module a été refondu en deux lots — voir §19a.** Tout ce qui suit décrit le calcul, qui
n'a pas bougé ; l'organisation des écrans, elle, a entièrement changé (trois onglets, cinq feuilles
au lieu de neuf, une sélection qui n'est plus un mode).

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

---

## 19a. ★★★ LA REFONTE DU PLANNING — « il y en a un peu partout »

### Le diagnostic, chiffré avant d'écrire une ligne

Le point de départ n'était pas un bug mais une phrase de Nico : *« il y en a un peu partout, il faut
parfois cliquer sur un membre parfois non, il est assez compliqué de s'y retrouver. »*
L'audit a mis des nombres dessus — et c'est ce qui a rendu la refonte discutable au lieu d'être une
question de goût :

| Constat | Chiffre |
|---|---|
| ★★★ **Feuilles pour un seul module** | **9** — jour, fiche, outils, chaleur, CP, heures multiples, archives, absence multiple (injectée en JS), éditeur de grille |
| ★★★ **Chemins pour poser un congé** | **4** — case → éditeur · sélection → CP · Outils → période · et la fiche, onglet Congés, qui **ne le fait pas** mais *explique le chemin des autres* |
| ★★ **Chemins pour les horaires chaleur** | **3** — preset dans l'éditeur, sélection multiple, Outils |
| ★★ **Salariés affichés deux fois** | grille (nom + h/réf) **puis** cartes de synthèse (nom + h/réf + écart + ETP). Les deux ouvraient la même fiche. |
| ★★★ **Renvois « va ailleurs » écrits en dur** | **8**, dont *« grille Équipe → Sélection multiple → ☀️ CP »* |
| ★★ **Profondeur des réglages annuels** | **3 niveaux** — Planning › Outils › « Modèles, cadre légal & coupure » |

★★★ **LE SIGNAL LE PLUS FORT : l'app écrivait son propre mode d'emploi.** Huit fois, l'interface
expliquait par où passer pour faire quelque chose qu'elle ne faisait pas là où on la lisait.
**Une note qui décrit un chemin est l'aveu que le dessin a raté.** C'est le même défaut que
l'écran « à venir » du Pilotage (§20g) et que la liste « à finir » de l'assistant (§18b), pris par
l'autre bout : là, l'écran mentait sur l'avenir ; ici, il disait vrai — et c'était pire, parce qu'un
mode d'emploi juste n'a aucune raison de disparaître.

### La cause racine

Le module mélangeait **trois métiers qui n'ont ni la même fréquence ni le même acteur** :

| Métier | Fréquence | Qui |
|---|---|---|
| **Tenir** le mois | tous les jours | le chef d'équipe |
| **Suivre** une personne | à la paie | l'administrateur |
| **Régler** le cadre | une fois l'an | le gérant |

Ils vivaient dans **deux onglets et neuf feuilles**, dont un onglet caché derrière un engrenage.
★ **Chercher le métier, pas l'écran.** Le désordre n'était pas dans le nombre de boutons : il était
dans le fait qu'un geste quotidien et un réglage annuel partageaient le même tiroir.

### Lot 1 — la sélection n'est plus un mode, c'est un état

**Le défaut central, et il tenait en une phrase :** toucher une case ouvrait l'éditeur du jour —
**sauf** si le bouton « Sélection multiple » était armé, auquel cas la même case se cochait.
**Deux effets pour un geste identique, et rien à l'écran ne disait lequel s'appliquerait.**

- **`planCellTap` coche, toujours.** Le bouton « Sélection multiple » est supprimé, `_pl2Multi`
  n'existe plus.
- **Trois cochages de plus** : `planColTap` (l'en-tête du jour → toute l'équipe ce jour-là),
  `planRowTap` (le nom → sa ligne sur la vue), `planSelAll` (le coin → toute la vue).
  ⚠️ **Conséquence assumée : le nom n'ouvre plus la fiche.** Une cible, un effet. La fiche s'ouvre
  depuis « Les gens ». C'est le seul point de dépaysement du lot, et il est réversible.
- ★★ **`_pl2SelSync()` ne reconstruit PAS la grille.** Un rerender complet à chaque case touchée
  coûtait le scroll et un clignotement — **sur le geste le plus fréquent du module**. Le sync ne
  touche que les classes (`.pl2-selon`, `.pl2-nameon`, `.pl2-hdon`) via `data-cell` / `data-plrow` /
  `data-col`. **Le coût d'un rendu se paie au rythme du geste, pas au rythme du code.**
- ★★ **La barre ne propose que ce qui s'applique.** `_planSelStats()` compte ce que la sélection
  contient (équipes collectives, jours travaillés, saisies existantes) et `_pl2MbarSync()` construit
  les boutons en conséquence. **Avant, « Effectif » était toujours là et ne servait, sans équipe
  collective cochée, qu'à afficher un message d'erreur : un bouton dont le seul rôle est de dire
  non.**
- ★ **`_planSelResume()`** remplace « 3 jours sélectionnés » par « Jean · 9 → 14 juin · 12 cases ».
  **Ce qu'on relit avant d'appliquer, c'est QUI et QUAND, pas un compte.**

### Lot 1 — une seule feuille, un jour ou trente

`ovPlanMultiH` et `ovPlanMultiAbs` **disparaissent dans `ovPlanDay`**. La feuille se rend en deux
variantes (`_planSheetOneHtml` / `_planSheetManyHtml`) qui partagent leurs blocs
(`_planSheetModes`, `_planSheetTiming`, `_planSheetRemp`, `_planSheetComment`,
`_planSheetAbsSection`).

⚠️⚠️ **Les namespaces `pmh-` et `pma-` sont supprimés — et il faut comprendre pourquoi ils
existaient.** Le commentaire d'origine était juste : `closePlanDayModal()` ne retire que `.open`, le
HTML de l'éditeur **reste dans le DOM**, donc réutiliser `#plan-abs-h` dans une seconde feuille
créait des ids dupliqués. **Le namespace était le bon correctif d'un mauvais dessin.** En fusionnant
les feuilles, la cause disparaît : les identifiants redeviennent uniques.
★ **Une convention de nommage qui existe pour départager deux écrans concurrents est un symptôme.
Supprimer la concurrence vaut mieux que discipliner les noms.**

### Lot 1 — les moteurs, et le bug qu'ils ont révélé

Trois fonctions, **qui ne lisent aucun champ du DOM** — tout arrive en paramètre :

- `_planApplyHeures(keys, {debut, fin, continu, comment, heat, remp, force})`
- `_planApplyAbs(keys, motifId, comment, heuresVal)`
- `_planApplySimple(keys, 'rec'|'heat'|'clr', force)`

★★★ **`force` est le seul paramètre qui compte vraiment.** Il vaut `true` quand le geste porte sur
**une case désignée à la main** : on écrase ce qui s'y trouve. Sans lui — geste groupé — congés,
absences et récupérations sont **préservés**. **On ne détruit pas en lot ce qu'on n'a pas relu.**

⚠️⚠️ **BUG RÉEL, trouvé en unifiant, pas en auditant.** `planMultiApply('rec')` et
`planMultiApply('heat')` faisaient `_eb[d]=e` **sans aucun test sur l'entrée existante** : poser
« Récup » ou « Chaleur » sur une semaine **écrasait les congés déjà posés, en silence**. La feuille
« Heures », elle, les préservait — et l'annonçait dans sa note. **Les deux chemins ne préservaient
pas les mêmes choses parce qu'ils étaient écrits deux fois.**
★★★ **La duplication ne produit pas seulement du code en trop : elle produit des règles métier
différentes pour un même mot.** « Poser une récup » ne voulait pas dire la même chose selon le
bouton emprunté. Aucun test ne pouvait le voir — il n'y avait pas de contradiction *dans* un
chemin, seulement *entre* les deux.

### Lot 2 — trois onglets, un verbe chacun

Même patron que Pilotage › Cave (§20g), **table de migration comprise** :

```js
var _PLAN_TAB_MIGR={planning:'mois',equipe:'mois',tableau:'mois',saisie:'mois',templates:'cadre'};
var _PLAN_VALID_TAB={mois:1,gens:1,cadre:1,moi:1};
```

- **`mois`** — la grille, et rien d'autre. Plus `_planPeriodeBar()` : deux boutons **visibles**
  (« Congés sur une période », « Chaleur sur une période ») pour ce que la grille ne sait pas
  cocher, c'est-à-dire une plage qui déborde la vue affichée.
- **`gens`** — `_pl2Synth()` (une seule fois), le récap annuel, et les anciens salariés en section
  de bas de page. Le mois consulté se change **ici aussi** (`_planGensMois`) : les chiffres de chaque
  carte en dépendent, et renvoyer l'utilisateur dans « Le mois » pour ça serait un aller-retour.
- **`cadre`** — l'ancien onglet caché `templates`, sans son bouton « ← Retour au planning » (un
  onglet n'a pas de retour).

★ **L'ouvrier n'a plus d'onglets du tout** et tombe sur son mois : `renderPlanning` masque
`#plan-tabs` entier. **Un onglet unique n'est pas un choix, c'est un décor.**
⚠️ **L'admin perd « Mon planning », et c'est voulu** : sa ligne est dans la grille comme tout le
monde, sa fiche est dans « Les gens ». L'onglet faisait doublon avec sa propre ligne.

### ⚠️⚠️⚠️ Le défaut de modèle : un réglage du domaine logé dans une fiche individuelle

**Le mode de décompte des congés** (6 jours ouvrables / 5 jours ouvrés) **et la période de
référence** se réglaient depuis **l'onglet Congés de n'importe quel salarié**. L'écran disait bien
« · domaine » en petit sous le titre — mais l'emplacement disait le contraire, et l'emplacement
gagne toujours. **Changer le réglage depuis la fiche de Marie changeait le décompte de toute
l'équipe.**

★★★ **Le test à retenir : la PORTÉE d'un réglage doit se lire dans son EMPLACEMENT, pas dans son
libellé.** Un réglage global posé dans un écran individuel est un piège même quand il est
correctement étiqueté. Les deux réglages sont dans « Le cadre ».

⚠️ **C15 m'a rattrapé au milieu du geste** : j'avais sorti le bloc de la fiche **avant** de l'avoir
posé dans « Le cadre ». Le preflight a signalé `planSetCpMode` et `planSetCpPeriode` **sans aucun
appelant**. Sans lui, deux réglages devenaient **inatteignables en silence**.
★★ **Un déménagement se fait en deux gestes, et le contrôle de joignabilité est exactement ce qui
surveille l'intervalle entre les deux.**

### Le décompte des feuilles

| Étape | Feuilles |
|---|---|
| Avant | **9** |
| Après lot 1 | **7** (`ovPlanMultiH`, `ovPlanMultiAbs` fusionnées) |
| Après lot 2 | **5** (`ovPlanTools`, `ovPlanArchives` supprimées) |

Restent : la feuille du jour, la fiche salarié, les congés, la chaleur, l'éditeur de modèle.
⚠️ **Non fait, alors qu'annoncé** : la fusion de `openPlanCP` (une période) et `openPlanCPSel` (les
cases cochées) — **c'est déjà le même overlay avec deux rendus**, la fusion est à portée.

### Le harnais — 12 scénarios, contre-épreuve comprise

Les moteurs ne lisant aucun champ du DOM, ils s'exécutent **hors navigateur**. Le harnais rejoue
les règles qui avaient divergé : préservation en lot, écrasement en `force`, remplacement limité aux
jours sans heures prévues, congé remplacé **compté**, absence jamais convertie en travail,
effacement possible hors contrat.

★★ **La contre-épreuve a été faite pour de bon** : les trois défauts réintroduits un par un — garde
de préservation retirée, remplacement autorisé sur les jours travaillés, effacement soumis au
contrat. **Le harnais rougit à chaque fois, sur le bon scénario.** Un harnais qu'on n'a pas vu
rougir ne mesure rien.
⚠️ **Le harnais s'est planté avant de mesurer, et il faut savoir le reconnaître** : un
`new Function('ctx','return ' + wrap)` où `wrap` commençait par un saut de ligne — **ASI**, `return;`
puis le corps, et douze rouges qui ne parlaient pas du code testé. **Douze rouges identiques
accusent le harnais, pas le sujet.**

### Ce que la refonte a coûté à l'accompagnement (C22, §27a)

**Huit renvois périmés**, traqués et corrigés **dans le lot, pas après** : trois points de la fiche
`MV_AIDE` du Planning réécrits, deux chemins faux (`Planning › Outils` → `Planning › Le cadre`), la
note d'effectif de `reglages.js`, deux hints du module, et la section `guide/10-planning.html` (les
chemins, plus deux blocs neufs sur les onglets et le geste de cochage).

★ **Écrire la procédure a encore trouvé un défaut** — cette fois dans ma propre prose : j'ai écrit
`<p class="warn">` alors que la classe du guide est `.note.warn`, avec une structure
`<span class="ni">` + `<div>`. **L'encart se serait affiché nu.** Rien ne l'aurait signalé : aucun
palier de test ne lit le guide.

⚠️ **FAUX POINT DUR — à noter parce que je l'ai affirmé avant de le vérifier.** J'avais annoncé que
la visite guidée casserait (`openPlanFiche('Jean')` en dur dans `_mvtSteps`). **Elle ne casse pas** :
ses deux étapes visent `.pl2-board` (qui reste dans l'onglet par défaut) et `openPlanFiche` (toujours
exposée, c'est un overlay indépendant de l'onglet actif).
★★★ **J'ai énoncé un risque comme un fait sans l'avoir mesuré, et il a servi d'argument dans un
arbitrage de découpage.** C'est la Règle d'or n°1 appliquée à mes propres affirmations :
**la fraîcheur d'un constat se mesure, y compris quand le constat est le mien.**

### Les fichiers touchés

`index.html` (racine) · `src/planning.js` · `src/styles.css` · `src/utils.js` · `src/reglages.js` ·
`public/sw.js` · `guide/10-planning.html` + `public/guide.html` régénéré.
**Bump APP + SW aux deux lots** (`index.html` touché). Le guide se déploie en `--only hosting`,
sans bump — c'est une page de `public/`, hors `SHELL_STATIC` (§27d).

---

## 20. Cave — Le Chai & Le Cuvier

- ★★★ **Deux fichiers depuis CUV-DEC (§164)** : Le Cuvier dans `src/cuvier.js`, le reste dans `src/cave.js`. Un nom lu de
  l'autre côté passe par le bloc « LA FRONTIÈRE » en fin du fichier qui le déclare ; les harnais lisent la Cave par
  `scripts/mv-cave-src.mjs`, jamais par un chemin en dur.
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

> ⚠️ **REFONDU DEUX FOIS.** **§34** (12/08) a posé l'**axe de zoom**, la portée unique et le moteur
> de diagnostic. **§42** (15/08) a traité ce que §34 n'avait pas touché : la **densité**, la
> **hiérarchie typographique** et le **texte**. Ce qui suit décrit l'état d'arrivée des deux.
>
> ★★★ **LES TROIS RÈGLES DU MODULE, à connaître avant d'y toucher (§42b)** :
> ① ce qui **CADRE** un chiffre reste à l'écran, en une ligne, avec un **filet doré** devant ·
> ② ce qui **EXPLIQUE le calcul** vit dans `MV_INFO`, derrière une pastille « i » ·
> ③ ce qui **DIT QUOI FAIRE** est un **bouton**, jamais un chemin à retenir.
> ⚠️ **Toute carte neuve porte les trois.** Les harnais `mv-harnais-info` et `mv-harnais-carte`
> refusent une carte sans ligne de cadre, une pastille sans fiche, et une fiche sans pastille.
>
> ★★ **La carte a TROIS ÉTAGES, tous dans `.pil-th`** : étiquette (+ pastille + chevron) · LE
> CHIFFRE · la ligne de cadre. **C'est l'unique justification du repli par défaut** — si le chiffre
> ou son cadre tombaient dans le corps, replier cacherait une information.
> ★ **`_pilTile(…, infoCle)` et `_pcavCard(…, infoCle)`** : dernier argument **optionnel**.
> ★ **L'échelle de texte** — onze pas nommés dans `styles.css` (`--pt-*`), **chaque appel avec son
> repli**. Toute nouvelle taille passe par là, ou le cliquet rougit.

- ★★★ **8 entrées** (`_PIL_TABS`), **du large au fin** :
  **Aujourd'hui · ① L'année · ② La campagne · ③ L'équipe & les tâches · ④ Simuler ┃ Cave ·
  Économie · Conformité** (+ ⚙️ Outils `_PIL_TOOLS` : Archives, Paramétrage).
  ★ **`_PIL_ZOOM_FIN = 'sim'`** marque où le zoom s'arrête : un filet est posé après, et les trois
  suivants sont des **écrans de détail**, pas des niveaux. « Aujourd'hui » n'est pas numéroté —
  ce n'est pas un niveau de zoom, c'est le présent.
  ⚠️⚠️ **LES CLÉS N'ONT PAS BOUGÉ** (`avc`, `equ`, `sim`…) : elles sont mémorisées chez les clients,
  citées par `app.js` (les moments de démo cliquent `[data-tab="eco"]` et `[data-tab="equ"]`,
  `app.js:2226`) et vérifiées par C22. **On renomme les libellés, jamais les clés.** Seul `an` est
  neuf. `_PIL_VALID_TAB` accepte donc **10 clés**.
  ★★ **`_PIL_TAB_MIGR` reste la LISTE DES CLÉS MORTES** (`prs`→`equ`, `mat`→`equ`, `ecf`→`eco`) —
  c'est ce qui permet à C22 de détecter qu'un autre fichier en demande encore une (§6c).
  Aucune clé n'y a été ajoutée par la refonte : rien n'a été retiré.
  ★ **`_PIL_TABS` et `_PIL_TOOLS` sont exposés sur `window`** depuis le 09/08, pour que l'aide
  contextuelle liste les onglets en les **lisant** (§27b) — donc `_mvAideOngletsPil` a suivi la
  refonte **toute seule**. Seules les lignes écrites en dur de `MV_AIDE.pilotage` ont dû être
  reprises (« Décider » n'existait plus).

- ★★★ **`_PIL_SCOPE` — LA PORTÉE UNIQUE.** Le module portait **cinq sélecteurs qui s'ignoraient** :
  `_PIL_ETPSEL` (frise), `_PEC_SUB` (économie), `_PEX_AN` (exercice), `_PCAV_MIL` (millésime) et la
  période active. Cliquer une campagne ne bougeait **qu'un panneau** ; les chiffres au-dessus
  restaient sur une autre fenêtre **sans le dire**. `_PIL_SCOPE.camp` remplace `_PIL_ETPSEL`, qui
  n'est plus qu'un **alias en lecture** (`Object.defineProperty`) pour ne rien casser d'externe.
  ⚠️ **Toute nouvelle vue lit `_PIL_SCOPE`. On n'ajoute pas un sixième sélecteur.**
  ★ `_pilScopeVerif(ann)` nettoie une **portée fantôme** : une période supprimée ou renommée
  laisserait l'écran filtrant sur un nom que plus personne ne porte.

- ★★ **Les cartes arrivent REPLIÉES** (`collapsed` tout à 1) et **une seule s'ouvre à la fois** :
  c'est ce qui rend ses 2 à 4 colonnes à `.pil-panels`. ⚠️ **Replier ne cache aucun chiffre.**
  ⚠️⚠️ **Tout changement de défaut de disposition exige un cran de `_PIL_ST_V`** : `_pilSaveState`
  grave l'état complet chez le client, et **le mémorisé gagne sur le défaut**. Sans le cran, un
  client installé ne voit **strictement rien**. La migration passe **après** `_pilNormalize`
  (qui emporterait `v`), et ne repose que `collapsed` — `show`, `pie`, `bar`, `sub` survivent.

- ★★ **Les quatre photos** (`_pilPhotosHtml`) en tête de **tous** les onglets : Travaux · Effectif ·
  Budget · Conformité, à la maille de la portée, chacune menant à l'écran qui la détaille.
  ★ **En frise d'une ligne sous 700 px.** ⚠️ Elles restent **quatre** et **visibles** : on ne
  remplace pas quatre chiffres par un bouton « voir les chiffres » — le harnais l'interdit.
  ⚠️ **L'effectif affiche le PIC, jamais la moyenne** — une moyenne annuelle n'existe aucun jour de
  l'année, et c'est le pic qui décide d'un recrutement.
  ⚠️ **Source absente ⇒ tiret, jamais zéro.** Un tableau de bord qui écrit 0 là où il n'a pas su
  calculer ment.

- ★★★ **`_pilDiag()` — LE MOTEUR DE DIAGNOSTIC.** Il remplace les **29 impasses** (`pil-empty`) qui
  écrivaient « Réglages › Saisons » **sans aucun lien**, et qu'on ne découvrait qu'en ouvrant
  l'onglet qui les contenait. Neuf constats calculés, **aucun écrit en dur**. Trois gravités :
  `'r'` **bloquant** (le chiffre ne se calcule pas) · `'o'` **faussant** (il sort, mais faux —
  le plus dangereux) · `'b'` **améliorable**.
  ⚠️ **Chaque constat dit CE QUE ÇA FAUSSE**, pas seulement ce qui manque : sinon le lecteur juge
  de l'urgence sans les éléments.
  ★ `_pilGo(cible)` ouvre la page + `switchReglTab` + `scrollIntoView` + **clignotement** d'une
  seconde. Les 7 ancres `#set-sec-*` sont vérifiées dans `index.html`.
  ★★ **Les drapeaux des photos tirent du MOTEUR**, pas de tests écrits sur place : un chiffre ne
  peut pas porter un drapeau que la liste ne contient pas.
  ★ `_pilDiagCouverture` **pèse la gravité, pas le nombre** — dix remarques améliorables ne valent
  pas un trou dans le calendrier. Plancher à 35 %.

- ★★★ **LES DEUX CADRES DE L'ANNÉE** (`_pilDeuxCadresHtml`, niveau ①). Un domaine a **deux années**
  et elles ne répondent pas à la même question :
  **l'EXERCICE COMPTABLE** (bilan à bilan) → *« ce que m'a coûté l'année fiscale »* ;
  **l'ANNÉE VIGNE** (après vendange N → fin vendange N+1) → *« ce que m'a coûté un cycle »*.
  Les deux totaux diffèrent, **et c'est normal** : une campagne à cheval sur la clôture est
  partagée entre deux bilans, une campagne entièrement hors de l'exercice n'y apparaît pas du tout.
  ⚠️⚠️ **UN EXERCICE COMPTABLE EST UNE DONNÉE, PAS UN RÉGLAGE.** Voir §34, lot 6.

- ★★ **Un seul moteur de graphe.** `_mvGraphCadre` / `_mvGraphSvg` (utils.js) existait déjà et
  9 des 11 générateurs SVG s'en servaient — le problème n'était pas qu'il manquait, c'est que
  la moitié du reste peignait à côté. ★ **`_PIL_SEM`** pose désormais **7 sens sémantiques**
  (fait · reste · faute · socle · hors · sel · aujourdhui).
  ⚠️ **À DÉPLACER dans `utils.js`** au prochain lot qui bumpe : une palette ne devrait pas vivre
  dans un module. Elle est dans `pilotage.js` pour avoir pu être livrée **sans bump**.
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
§18b) — 225 L en Gironde, 228 L en Bourgogne. ★★ **Et chaque LOT peut porter le sien** (`l`, en litres :
demi-muid, feuillette) ; le fût l'emporte en vin et le rapporte au parc — §148.

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
domaine.** le second domaine a vu cette note pendant des semaines.
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

★★★ **DEUXIÈME OCCURRENCE, 25/08 — LA MÊME CAUSE, UN AUTRE COMPOSANT (§67).** `.mvu-kpi-v` (le
chiffre des trois cases, sept écrans) et `.mvu-tabs.mvu-sub .mvu-tab.active` (l'onglet actif de
second niveau) portaient `color:var(--cave)`. **`--cave` est une couleur de FOND.** En mode clair
elle est indiscernable de `--texte` ; en mode sombre elle part dans l'autre sens que le fond de
carte → **1,12:1**. **La règle générale, à appliquer avant d'écrire une couleur de texte : si le
nom de la variable désigne une SURFACE (`--cave`, `--bg-*`, `--*-pale`), elle ne peut pas être une
encre.** Les encres du projet sont `--texte`, `--texte-med`, `--texte-doux`, et les trois jetons
faits pour ça : `--or-tx`, `--vert-tx`, `--orange-tx` (§ bloc « badges de statut »).
⚠️ **Et l'inverse existe** : une encre CLAIRE écrite en dur (`#F0A9A0`, `#E8D294`) est invisible en
mode **clair**. *Un audit de contraste qui ne joue qu'un seul thème n'en trouve que la moitié.*

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
- ★ **Le raisonnement** (calage : installation le second domaine = **20 h**) : ce n'est pas la formule qui
  fait le coût, c'est la complexité du client. La grille tient parce qu'elle **BORNE le temps
  inclus**, pas parce qu'elle prédit le coût.
- ★★ **Le widget « Mise en route » (§27c) travaille pour ce forfait** : il transforme une partie de
  l'accompagnement en écran, et il **rend visible ce qui reste à faire** au lieu d'attendre un appel.
- ★★★ **Et la série installation (§18b) le rend soutenable** : un forfait de 20 h incluses n'a de
  sens que si l'installation en coûte 9. **C'est ce qui rend le passage à trente clients pensable.**
  ⚠️ Le chiffre reste **théorique** tant qu'une installation à blanc ne l'a pas mesuré.

**Offre de lancement** : −50 % sur l'installation **+** plan Domaine au tarif Vigneron.
⚠️ **Durée jamais bornée — à trancher**, au plus tard avec le devis le prospect Gironde.

**Argument ROI en public** : exprimé en **temps, pas en euros**.
⚠️⚠️⚠️ **TROIS CHIFFRES CONTRADICTOIRES CIRCULAIENT** — démo **111 h**, brochure **215 h/an pour
10 ha**, argumentaire oral **3 à 5 h de bureau par mois** (36 à 60 h/an). **Un prospect qui reçoit
la plaquette et clique la démo voit du simple au double** : ça n'attaque pas le produit, ça attaque
la crédibilité du vendeur.
★ **Depuis le 15/08 (§43), la source unique est `DEMO2_CREDITS`** : **≈ 127 h démontrées**, plus
**37 h hors total** (« retrouver l'info »), soit **164 h** pour qui compte la ligne molle.
★★★ **Et la démo ne dit AUCUN montant** : ni abonnement, ni installation, ni conversion en euros.
Le tarif se dit de vive voix, une fois le besoin établi.
⚠️ **`mvprint.py` (215 h) et l'argumentaire oral ne sont PAS encore alignés** — voir backlog.

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
- **Signature en app** : `acceptTerms` → `_mv_signatures` (lecture : GT **et les membres du domaine** — rules relues le 19/09, §156 ; écriture : la seule Cloud Function), avec le
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

**Archive constituée le 31/07/2026** : CGU v1.1 et DPA v1.0 tels que signés par SCEA PH le second domaine &
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

## 27b. ★★ L'aide contextuelle — `MV_AIDE`, et `MV_INFO`

> ★★★ **DEUX QUESTIONS, DEUX FEUILLES (15/08, §42c).**
> **`MV_AIDE`** (pastille « ? Aide », en tête de module) répond à *« qu'est-ce que je peux FAIRE sur
> cet écran ? »* — une fiche par PAGE.
> **`MV_INFO`** (pastille « i », **à côté du chiffre**) répond à *« d'où vient CE chiffre ? »* — une
> fiche par chiffre. **34 fiches** aujourd'hui, toutes dans le Pilotage.
> ⚠️ **Ne jamais poser une fiche `MV_INFO` en tête d'écran** : une notice générale ne répond à
> aucune question précise. Elle vit **contre le nombre qu'elle explique**.
> ⚠️⚠️ **`stopPropagation` sur l'écouteur délégué** : la pastille vit dans un en-tête de tuile qui
> replie la tuile au clic. Sans lui, ouvrir la fiche ferme l'écran qu'on cherche à comprendre.
> ★ **Clés nommées par module puis par écran** : `pil.gnr`, `pil.eco.remarques`. Deux écrans ne
> partagent **jamais** une clé — une fiche vivante remplie par l'un s'afficherait sous l'autre.
> ★ **Les fiches VIVANTES** (`_mvInfoSet`) : le contenu se calcule à l'exécution, mais **la clé
> reste déclarée** dans `MV_INFO` avec un repli honnête. `_mvInfoSet` refuse toute clé non déclarée
> — sans quoi le contrôle statique du harnais serait contournable.
> ★ **Le texte des fiches est ÉCRIT, jamais saisi** : il porte donc son propre `<b>`, contrairement
> à `MV_AIDE` (voir ci-dessous). Aucune donnée utilisateur ne le traverse (C19).
> ⚠️ **Et il s'écrit en FRANÇAIS ACCENTUÉ.** Une première version de six fiches est partie sans
> accents — réflexe de commentaire appliqué à du texte client. Le harnais ne le voit pas ; la
> relecture, si.


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

### ⚠️⚠️⚠️ LE PIÈGE DU 14/08 — LIVRER LE FICHIER GÉNÉRÉ À CÔTÉ DE SA SOURCE

**Deux allers-retours de CI perdus, sur un lot dont le code était juste.**

J'ai livré **les deux** : la source `guide/11-pilotage.html` **et** le résultat
`public/guide.html`. `/mnt/user-data/outputs` étant **plat**, je ne peux pas y créer de
sous-dossier `guide/` — j'ai donc renommé la source en **`guide-11-pilotage.html`**. Ce nom
n'existe nulle part dans le dépôt.

**Ce qui s'est passé, dans l'ordre :**

| tour | `guide/11-pilotage.html` | `public/guide.html` | `--check` |
|---|---|---|---|
| 1 | ancien (nom inconnu → pas intégré) | **neuf** | ❌ le généré est plus riche que sa source |
| 2 | **neuf** | ancien (restauré) | ❌ la source est plus riche que le généré |

**Le décalage a changé de sens sans jamais disparaître.** Livrer les deux moitiés d'une paire
dérivée, c'est garantir qu'une seule des deux arrive.

★★★ **LA RÈGLE QUI EN SORT : NE JAMAIS LIVRER `public/guide.html`.**
C'est un fichier **dérivé** — il se fabrique, il ne se transporte pas. Claude livre **uniquement**
les sources `guide/NN-*.html` touchées, et Nico lance `node scripts\build-guide.mjs` chez lui.
Une source ne peut pas être confondue avec sa sortie s'il n'y a qu'elle dans le lot.

⚠️ **Corollaire général, au-delà du guide** : dès qu'un fichier est **produit par un script du
dépôt**, il ne se livre pas. On livre l'entrée, on nomme la commande. Vaut aussi pour `dist/`.

⚠️ **Et si un renommage est inévitable** (dossier de sortie plat), l'annoncer **en tête de
livraison, en une phrase visible** — pas dans une cellule de tableau. « Le fichier arrive sous le
nom X, renomme-le en Y et place-le dans Z ». Un nom qui n'existe pas dans le dépôt ne trouve
jamais sa place tout seul.

### ⚠️ LE PIÈGE — modifier une source sans régénérer

**C'est l'ancien guide qui part en ligne, en silence.** D'où le garde-fou :

```
node scripts\build-guide.mjs --check
```

Il n'écrit rien. Il dit « guide.html est a jour » — ou il **sort en erreur**.

★★★ **09/09 — LE CONTRÔLE ÉTAIT PARTOUT, MAIS TOUJOURS APRÈS LE COMMIT.**
`build-guide.mjs --check` tourne dans **`npm run check`**, dans **`prebuild`** (donc `npm run build`)
et dans la **CI**. Les trois arrivent *après* le `git push` quand on intègre puis pousse depuis
GitHub Desktop : la CI rougit à chaque lot qui touche `guide/` — cinq fois de suite pendant la série
NAV, qui a modifié **douze** sources. Le défaut n'est ni dans le script ni dans la règle : c'est un
**geste manuel placé après le geste qui le rend nécessaire**.

**Le crochet `scripts/hooks/pre-commit`** le remet avant. Si le commit touche `guide/*.html`, il
lance `build-guide.mjs` et **ajoute `public/guide.html` au commit** ; sinon il ne fait rien. Il
s'installe une fois, dans le dépôt :

```
git config core.hooksPath scripts/hooks
```

⚠️ Il ne **remplace** aucun contrôle — `--check` reste dans `check`, `prebuild` et la CI ; il évite
seulement d'y arriver rouge. ⚠️ Il ne touche **que** le guide : aucun autre crochet, rien d'ajouté à
la ligne de build (§6). Si `node` est introuvable, il **arrête le commit** avec la commande à taper
plutôt que de laisser passer en silence — un garde-fou qui échoue discrètement est pire qu'aucun.
Sous Linux, le fichier doit être exécutable (`git update-index --chmod=+x scripts/hooks/pre-commit`).
La règle « **ne jamais livrer `public/guide.html`** » ci-dessus **ne change pas** : Claude livre les
sources, le crochet fabrique le généré chez Nico.

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

## 27e. ★★ La démo guidée & les supports imprimés

### La visite guidée (`?demo=visite`) — REFAITE LE 15/08 (§43), PUIS LE 13/09 (§124)

⚠️ **CE QUI SUIT DÉCRIT LA VERSION D'AOÛT — 19 moments, parcours de printemps.
Elle a été remplacée le 13/09 par 20 moments de vinification (§125).** Ce qui reste
vrai : les trois actes, la règle `DEMO2_CREDITS`, l'addition sans montant, et la
leçon des cinq vignettes. Ce qui a changé : la journée commence au cuvier, le
Cuvier entre dans le parcours, le moteur mesure sa bande utile avant de cadrer.

### La visite guidée d'août (historique)

⚠️⚠️ **Cette section disait « 14 moments » et « la démo ne connaît aucun des lots d'août ». Les deux
étaient FAUX** au moment où on l'a relue : il y avait 19 moments, Cave et Conformité comprises.
**Une section de CLAUDE.md se vérifie sur le code comme le reste** (règle d'or n°3).

**19 moments, TROIS ACTES**, ≈ 4 min annoncées (mesuré : 3 414 car. de narration ≈ 3,8 min de
lecture + ~1,3 min de navigation — « trois minutes » était une promesse rompue au premier écran) :
- **I — avant que l'équipe arrive (décider)** : météo par secteur · « Traiter ou pas ? » · le cap du jour ;
- **II — la journée s'écrit toute seule** : **l'écran de l'ouvrier** · le ✓ · le journal · la carte ·
  le tracteur (chrono §31) · traitement + E-Phy + Réserve · **le jour du contrôle** · le Chai · le millésime ;
- **III — ce que ça rend** : pointage · fiche de Jean · le verdict · **la date qui ne rentre pas** ·
  coût par parcelle · le renfort · les 22 documents + archives.
★ **Le Cuvier et la Réserve sortent du parcours** et restent dans les 26 chapitres : trois moments
de cave d'affilée cassaient le rythme, et la Réserve se dit en une incise sous le traitement.

★★★ **LES TROIS MOMENTS QUI MANQUAIENT, et pourquoi ce sont eux** :
1. **« Ce que voit Jean »** — l'objection n°1 d'un patron de domaine n'est pas le prix, c'est
   *« mes gars ne s'en serviront pas »*. La visite entière se jouait depuis le fauteuil du chef.
   Le geste est contre-intuitif — **montrer moins** — donc il se retient.
2. **« Le jour du contrôle » avec deux parcelles FERMÉES** — le seul moment où le logiciel
   **rattrape** l'utilisateur au lieu de l'assister. Un écran qui protège vaut trois écrans qui
   font gagner du temps : il répond à une peur, pas à une corvée.
3. **« La date qui ne rentre pas »** — une **date** et des **heures restantes** frappent dix fois
   plus fort qu'un pourcentage d'avancement. Le seul écran qui dit au vigneron quelque chose
   qu'il ne sait pas encore.

### ⚠️⚠️⚠️ `DEMO2_CREDITS` — LA RÈGLE, ÉCRITE APRÈS COUP

> **ON NE FACTURE QUE CE QU'ON A MONTRÉ.** Toute ligne du chiffrage est **démontrée par un moment**.
> Une ligne qu'aucun écran ne démontre est une ligne que le prospect découvre à la caisse — et
> c'est celle qu'il refusera, en emportant le total avec.

**Ce qui n'allait pas** : la plus grosse ligne (`info`, 10 min × 220 j = **37 h**, un tiers du total)
n'était **créditée par aucun moment**. Le compteur du parcours montait à **40 min** (3 clés sur 7),
puis l'addition sortait 111 h de nulle part. C'était aussi **la seule ligne qu'un vigneron peut
refuser en bloc** — et son refus faisait tomber le résultat sous le seuil affiché.

**Table actuelle — 9 lignes, ≈ 127 h, toutes démontrées** : phyto 5 · validations 33 ·
**pointage du soir 37** · fins de mois 18 · saisonniers 8 · **carnet tracteur 10** · cave 6 ·
Réserve 4 · **papiers du contrôle 6**.
★ **`DEMO2_HORS`** porte la ligne molle **hors du total** (+37 h, annoncés à part) : celui qui y
croit arrive à 164 h — proche de la brochure ; celui qui la refuse reste à 127, **et l'argument
tient quand même**.

⚠️ **`min` du tableau ≠ `min` crédité au compteur.** Le tableau compte **par occurrence** (90 min
pour une fin de mois) ; le compteur compte **ce que cette journée-là fait gagner** (100 min au
total sur les 19 moments). `min:0` marque une ligne **démontrée sans rien créditer** — sinon
« aujourd'hui » cesse d'être crédible.

### ★★★ L'addition — ELLE NE COMPTE QU'EN HEURES. AUCUN MONTANT.

Elle est passée par **deux états faux** avant celui-ci :
① `2 200 € − 948 − 990 = **+260 €** la première année` — après quatre minutes de démonstration, la
dernière chose lue était un gain de 260 €. **Une marge plus mince que le scepticisme du lecteur
est un couteau qu'on lui tend**, et une soustraction s'audite au lieu de se ressentir.
② un coût « **par heure rendue** » (7,45 €). Plus solide — mais **toujours un prix**, et un prix
posé sur un écran ne se discute pas, il se compare.

★★★ **DÉCISION DE NICO (15/08) : ZÉRO MONTANT DANS LA DÉMO.** Ni symbole €, ni abonnement, ni
installation, ni taux horaire. Le gain se dit en **heures** et en **journées de bureau**, ligne par
ligne, chacune adossée à un écran qu'on vient de voir. **Le prix appartient à la conversation qui
suit, pas à la démonstration.** Clôture : *« Quinze jours sur vos parcelles, vos surfaces, votre
barème. Vous compterez vous-même. »*
⚠️ **Le harnais interdit mécaniquement tout montant dans `_mvtAddition`** — quatre motifs (€,
79/948/790, 990, le signe −), et la contre-épreuve y rouvre un prix pour vérifier que ça rougit.

### ★★★ CINQ VIGNETTES CORRIGÉES PAR L'ŒIL DE NICO

**144 assertions vertes, et cinq moments faux quand même.** Un harnais vérifie ce qu'on facture et
ce qu'on vise ; **il ne voit pas un projecteur mal posé ni une phrase qui décrit un autre écran.**

- **4/19** — l'ouvrier atterrissait sur l'accueil. Son écran, c'est **la liste de ses parcelles**
  filtrée sur la tâche du jour. `pTacheFilter` se pose **dans ce moment-là** : sans filtre,
  `_pvActions` sort vide et il n'y a aucune coche à montrer.
- **5/19** — la peur n'était pas levée. On ne voyait ni que **l'ouvrier coche lui-même**, ni
  **qu'un oubli se rattrape**. `canWrite()` est vrai pour l'ouvrier comme pour l'admin : **le même
  bouton des deux côtés**. C'est ce qui répond à « et s'il oublie ? », la vraie objection.
- **8/19** — le texte parlait d'un **chrono qu'on ne voit pas** : `_chronoEnabledForSession` exige
  `CONFIG.chrono_mode==='on'` **et** une mesure ouverte, et le scénario n'en ouvre aucune. La liste
  des sessions porte déjà l'argument — les parcelles faites, cochées une par une.
- **13/19** — ⚠️⚠️ **DÉFAUT PRODUIT, PAS DÉFAUT DE DÉMO** : `_pl2Cell` rend **toute** entrée
  `absent:true` par une croix rouge « Absence », **avant même de lire** `motif` / `motif_h`.
  **Un retard d'une heure et une journée entière s'affichent à l'identique.** Backlog.
- **15/19** — la cible était `.pil-dec`, le bloc **sous** le cockpit, qui contient la carte
  « Traiter ? » **déjà éclairée au moment 2** : deux fois la même image (§35e, encore).

★ **La leçon** : sur une démo, **l'assertion la moins chère est un œil**. Le harnais empêche la
régression ; il ne remplace pas le fait de regarder les 19 écrans une fois.

### Les défauts de moteur corrigés

- ⚠️⚠️ **« Passer » promettait un saut et faisait une sortie** : `_mvtSkip` ouvrait le menu, donc
  sauter *un* écran faisait perdre tous les suivants **et l'addition**. Deux boutons distincts
  désormais ; **« Quitter » mène à l'addition**, pas au menu.
- ★★★ **`_mvtQuery` refuse une cible invisible** (`_mvtVisible`). Depuis §42 les cartes du Pilotage
  arrivent **repliées** et `.pil-tbody{display:none}` : `querySelector` trouve l'élément, il mesure
  zéro, `_mvtReposition` rend `r=null` et **les quatre masques couvrent l'écran entier**. Le repli
  ultime ne s'armait que sur `null` : il ne voyait pas ce cas.
  ⚠️ **Aucun moment ne tombait dedans le 15/08** — vérifié : l'onglet Économie ne contient aucun
  `_pilTile`, donc le moment du coût par parcelle se rabattait sur `#pil-content`. **La garde est
  posée avant que le premier n'y tombe**, pas après.
  ⚠️⚠️ **C22 vérifie qu'un sélecteur EXISTE dans les sources, jamais qu'il est VISIBLE au moment
  où la visite le vise.** C'est le trou par lequel le bug du 09/08 était passé, sous une autre forme.
- **L'onglet Économie s'ouvre sur `_PEC_SUB='syn'`** pendant que la narration parlait du coût par
  parcelle. `_mvtPecSub('par')` et `_mvtPilOuvrir('echeances')` **cliquent** (ils ne écrivent pas
  dans l'état) : le handler délégué referme les autres cartes, construit celles qui ont besoin de
  largeur et grave l'état — le contourner, c'est réimplémenter trois règles à côté.
- ★ **`s.wait`** : délai par moment quand la navigation enchaîne plusieurs rendus. 420 ms fixes
  posaient le projecteur sur le DOM d'avant.
- **`window._visiteDrae={}` annulait le délai de rentrée** sur les fiches parcelle, alors que
  `_cfmDre()` (qui lit `TRAITEMENTS` et **ignore cette table**) affichait déjà les mêmes parcelles
  comme fermées dans le Pilotage. **La liste disait le contraire du Pilotage.** Semé sur
  *Les Charmes* et *La Combotte* — un délai actif **ne bloque pas** la validation (badge + liseré
  rouge, rien d'autre) et aucune des deux n'est la première carte : le moment d'action est intact.
- **La bascule ouvrier est réversible** (`_mvtRoleOuvrier`) et le retour est armé **à trois
  endroits** : le moment suivant, `_mvtEnd`, et la fermeture d'un chapitre. Un rôle laissé en place
  ampute les quinze moments suivants.

### ★★★ `mv-harnais-demo` + sa contre-épreuve (branchés en CI)

**144 assertions · 7 contre-épreuves.** Deux règles qu'aucun autre contrôle ne porte :
① toute clé de `DEMO2_CREDITS` est démontrée par un moment · ② aucun `sel` ne vise `.pil-tbody`
ni `#pil-body-*`. Plus : les crédits orphelins, l'existence de chaque jeton de sélecteur, le total,
et le fait que la clôture ne soustraie plus.

⚠️⚠️ **CE QUE LA CONTRE-ÉPREUVE A TROUVÉ, ET QU'AUCUNE RELECTURE N'AURAIT VU** : l'assertion
« ce sélecteur existe dans les sources » **se prouvait toute seule** — elle cherchait la cible dans
`app.js`, c'est-à-dire dans le fichier qui l'écrit. `sansCitations()` retire donc `_mvtSteps` et
`_MVT_CHAPS` du corpus avant de chercher. **C'est le quatrième cas de « stub plus généreux que la
vraie fonction » du mois.**
★ `corps()` ôte les commentaires avant toute assertion : un commentaire qui cite `.pil-tbody` ne
doit pas rougir (§34g).

⚠️⚠️⚠️ **ET UNE FAUTE COMMISE PENDANT CE LOT MÊME, QUI A DONNÉ L'ASSERTION 6** : `_mvtCredits` a été
**appelé avant d'être écrit**. `node --check` est passé — la syntaxe était valable — le preflight
aussi, et la visite aurait planté au premier moment. **Aucun contrôle du dépôt ne voyait un appel
vers une fonction inexistante.** L'assertion 6 vérifie désormais que tout `_mvt*` / `_demo2*`
appelé dans `app.js` a bien son `function …(` — 36 fonctions couvertes.

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
