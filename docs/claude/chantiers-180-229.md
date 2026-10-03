# Ma Vigne — Chantiers §180 à §229

> Scindé de `CLAUDE.md` le 27/09/2026 (§189). Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence
> « §N » se trouve par `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été
> remonté dans `CLAUDE.md` (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches
> de 50). Au-delà de la dernière tranche, créer le fichier suivant sur le même modèle.

---

## 180. ★★ STOCK-1 — UNE SAISIE HORS LIGNE NE DISPARAÎT PLUS QUAND LE DISQUE REFUSE (26/09 — `src/firebase.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-stock.mjs` (neuf) · `scripts/mv-harnais-prep.mjs` · `scripts/mv-harnais-fusion-docs.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.65 → **7.66** · SW 8.34 → **8.35** · base `43e30ec`, s'empile sur §177-179)

### 180a. Le défaut, lu dans le code

Point 2 de l'audit « ce qu'il reste à vérifier » (26/09). La file hors ligne vit dans `localStorage` (`mavigne_offline_queue` + ses
bases FUSION-1). `_queueSave` avalait l'échec de `setItem` (`_mvAvale`) : la saisie ne vivait plus qu'en mémoire. Puis `_flushQueue`
commence par `_loadQueue()`, qui **remplaçait** `_offlineQueue` par le disque — ancien ou vide. À la reconnexion, la saisie partait,
sans message, sans même fermer l'appli. Cause typique : quota `localStorage` (~5 Mo par origine) — la file porte des documents
ENTIERS plus leur base ; `historique` seul pèse 192 Ko chez MG. Et l'appli ne demandait jamais `navigator.storage.persist()` :
un téléphone à court de place peut vider le stockage d'un site (Safari efface celui d'un site NON installé après 7 jours sans visite).

### 180b. La correction

- `_mvFileMemSeule` : clés dont l'écriture disque a échoué. `_queueSave` : succès → marque retirée ; échec → `_mvFileDisqueKo`
  (marque + `logError` `warning` cat `stockage` + UN toast « Stockage du téléphone plein — la saisie est gardée, mais ne fermez pas
  l'appli avant le retour du réseau »).
- `_loadQueue` : relit le disque comme avant (**le disque fait foi** : un autre onglet a pu y écrire — PREP-1), puis remet par-dessus
  la valeur de MÉMOIRE (et sa base) des seules clés marquées.
- Fin de `_flushQueue` : disque accepté → marques remises à zéro ; refusé → tout ce qui reste est marqué.
- `_mvDemanderPersistance` : `navigator.storage.persisted()` puis `persist()`, une fois, au premier passage hors ligne et au démarrage
  d'une appli installée (`display-mode: standalone`) ; résultat dans `window._mvStockagePersistant` (true / false / null = API absente).
  Pas au démarrage d'un onglet : Firefox afficherait une demande d'autorisation à froid.
- ⚠️ Une saisie gardée en mémoire seulement ne survit pas à la fermeture de l'appli : c'est ce que dit le message. La vraie
  parade au quota serait une file en IndexedDB — non faite, à décider si `logError` montre des `stockage` en production.

### 180c. Harnais

`scripts/mv-harnais-stock.mjs` (check, prebuild, CI, `npm run test:stock`) : **16 assertions** sur les vraies fonctions de
`firebase.js`, exécutées avec un `localStorage` à quota simulé et un `navigator.storage` factice ; **5 contre-épreuves**.
Ajustés : `mv-harnais-prep` et `mv-harnais-fusion-docs` extraient `_queueSave` / `_loadQueue` — ils extraient désormais aussi
`_mvFileDisqueKo`, `_mvDemanderPersistance` et les trois variables de STOCK-1 (75 et 29 verts, contre-épreuves inchangées).

## 181. ★ HORLOGE-1 — L'APPLI AUX DATES PIÈGES : RIEN À CORRIGER, DEUX FILETS POSÉS (26/09 — `scripts/mv-harnais-horloge.mjs` (neuf) · `scripts/mv-tour.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · aucun bump · base `43e30ec`)

Point 3 de l'audit du 26/09. **Lecture du code** : les 98 calculs en millisecondes (`86400000`, `864e5`) passent soit par `Date.UTC`
/ getters UTC de bout en bout, soit par `Math.round` sur des écarts (robuste à une journée de 23 h ou 25 h) ; les `Math.floor` restants
mesurent des durées écoulées ou partent de midi (`renderHomeMaSemaine` : `j.date+'T12:00:00'`). Les `toISOString().slice(0,10)` ne
sérialisent que des dates construites en UTC. `_mvISO` lit les getters LOCAUX. **Aucun défaut trouvé** — l'essentiel avait été
soldé le 23/08 (`mv-harnais-fuseau`, `_mvJourApres`).

**Filet 1 — `scripts/mv-harnais-horloge.mjs`** (check, prebuild, CI, `npm run test:horloge`) : se relance en fils par fuseau.
A. Sous Europe/Paris, horloge FIGÉE (Date remplacée) à 10 instants — 27/09 00 h 30 (l'UTC est encore le 26), 25/10 01 h 30, 02 h 30
(l'heure qui se répète) et 23 h 30 (journée de 25 h), 31/07 23 h 59 et 01/08 00 h 05 (campagne ET exercice), 31/12/2026 23 h 59,
01/01/2027 00 h 05, 28/03/2027 03 h 30 (après l'heure sautée), 29/02/2028 : `_mvISO(new Date())`, `_mvAujIso()`, `_mvCampagneDe`,
`_mvExercice().an`. B. `_planIsoWeek` contre une semaine ISO de référence (UTC), **chaque jour de 2024 à 2030**, sous Paris,
Martinique, Nouméa, UTC ; 31/12/2026 = **S53**. 14 assertions, 3 contre-épreuves (`_mvISO` en `toISOString`, semaine en `floor`,
campagne décalée d'un mois).

**Filet 2 — `npm run tour:dates`** (`mv-tour.mjs --dates`, pas dans check : navigateur) : Chromium réglé sur `Europe/Paris`,
`page.clock.setFixedTime` à 9 de ces instants, rôles admin et ouvrier, écrans 375 et 1280 px, tous les modules et onglets. En plus de
l'audit habituel (« Invalid Date » ajouté aux textes cassés) : `_mvToday()`, `_mvCampagneDe` et `_mvExercice` comparés à la date
locale attendue. Le tour normal règle lui aussi le fuseau sur Paris (`timezoneId`), pour mesurer l'appli comme la vivent les
domaines, quel que soit le poste.

⚠️ Non couvert : un domaine hors de France métropolitaine à l'ouest de Greenwich (DOM, UTC−4) — les `new Date('AAAA-MM-JJ')`
suivis de getters locaux y reculeraient d'un jour. Aucun client concerné à ce jour.

## 182. ★★ CMP-NOM — LE REPLI PAR NOM RENDAIT L'HIVER CLOS À 32 % (26/09 — `src/pilotage.js` · `scripts/banc/banc.mjs` · `scripts/banc/baseline.json` · `scripts/harnais-claude-md.mjs` · APP **7.66** et SW **8.35** inchangés · base `c9dd10e`)

### 182a. Le constat

Capture de Nico, Économie › Synthèse : *« ↩ Le travail prend plus de temps que le barème — mesuré sur la campagne précédente.
+190,9 % … 2 289,2 h de présence contre 787 h prévues … mesuré sur Hiver 2025–2026 — cette période en est à 12 % sur 40 % »*.
Nico : *« incompréhensible, pour l'instant l'écart est de 2 % sur une tâche »* (carte « Temps réel contre barème », TV-1).

### 182b. La cause, reproduite

787 h = `stats.hFaites` de `Hiver 2025–2026`, archivé à **32 %** — le dénominateur amputé de §43a (×2,93 alors, ×2,909 ici).
§43c avait posé la garde d'achèvement (`_pilCmpAcheve` ≥ 80 %) **dans le chemin par dates** de `_pilCmpSnapshot`. Période active
`Hiver 2026 - 2027` : le chemin par dates rejette bien l'hiver 2025, ne trouve rien, et tombe dans le **repli par nom** — écrit pour
les archives dont la période a été supprimée de `SAISONS` — qui apparie par radical (« Hiver ») et année, **sans aucune garde**.
Reproduit sur `scripts/banc/instantane.json`, active = `Hiver 2026 - 2027` : base → `Hiver 2025–2026` (32 %) ; lot → `null`.
⚠️ Le banc ne pouvait pas le voir : ses scénarios s'appelaient `Vend` / `VendPrec` (sans année, radicaux différents) et l'active réelle
de l'instantané est `Vendanges` — le repli n'y jouait jamais.

### 182c. Le correctif

Dans le repli : ① une archive **datable** (sa période existe dans `SAISONS`) a déjà été jugée par le chemin par dates → sautée (si
l'active a un `debut`) ; ② `_pilCmpAcheve` ≥ 80 % s'applique aussi. Effet : `_pecCadHisto` rend `null`, le verdict passe en « Le budget
tient, la cadence reste à mesurer », et `_pilCmpHtml` affiche « Aucune saison comparable archivée » (déjà jugé juste en §43h).
Verdict « cadence à mesurer » : si `E.tv.taches` n'est pas vide, une phrase et un bouton **« Temps réel par travail ›»** (Postes & travaux).

### 182d. Banc

5 scénarios → 9 : `scenario_hiver_par_nom` (données réelles, active = l'hiver : `null`), `scenario_garde_datable` (datée, disjointe,
100 %, même radical : `null` — **seule** la garde datable peut la rejeter ; sans lui, l'achèvement la masque sur le cas réel, vérifié
en contre-épreuve : leçon 43e), `scenario_nom_sans_dates` (95 %, période absente : appariée), `scenario_nom_sans_dates_incomplet`
(32 % : `null`). Contre-épreuves : retirer ① → 1 rouge ; retirer ② → 1 rouge ; base → 3 rouges.

### 182e. ⚠️⚠️⚠️ L'ÉCRASEMENT — la règle d'or n°1 enfreinte par Claude

La première livraison (zip `cmp-nom`) a été construite sur `43e30ec` à 19 h 43. Entre-temps, une autre conversation avait livré
TAILLE-1 (§177), ARCH-1 (§178), ARCH-2 (§179), STOCK-1 (§180), HORLOGE-1 (§181), tous collés avant elle, puis poussés avec elle dans
`c9dd10e`. Cinq fichiers communs : `pilotage.js` (**ARCH-2 effacé** : `_arcAnnees`, `_arcBlocAnnuel`, `_arcSetCadre` — `mv-harnais-arch`
plantait), `CLAUDE.md` (§177-§181 effacés, **même numéro §177** réutilisé), `harnais-claude-md.mjs` (`SECTIONS` 213 → 209), et les
deux fichiers du banc (non touchés par l'autre lot : sans perte). Vu par `harnais-claude-md` : « 4 scripts muets » — les harnais des
lots effacés n'étaient plus nommés.
**Le réflexe manqué** : `git pull` juste avant de construire le zip, demandé une heure après la livraison. Il n'a pas été fait.
**La réparation** : les zips des cinq lots redéposés par Nico ; `horloge-1.zip` est cumulatif, ses fichiers correspondent au dépôt
à l'octet partout **sauf** aux quatre écrasés. Rejoué sur eux : `pilotage.js` = HORLOGE-1 + 16 lignes ajoutées, 0 retirée ;
`CLAUDE.md` = HORLOGE-1 + cet en-tête + §182 ; `SECTIONS` 213 → 214.
★ **Ce que ça confirme** : deux conversations Claude ouvertes en parallèle sur le même dépôt, c'est la situation du 13/08. Chacune
croit sa base à jour. Seul un pull juste avant le paquet le vérifie.

### 182f. Accompagnement

Fiche `pil.cadence` et `MV_AIDE` Pilotage relues : « la même période de la campagne précédente, si elle est archivée » — toujours
vrai, rien à changer. Guide : rien. Pas de « Quoi de neuf » (module seul, pas de bump).

### 182g. Ouvert

- Question de §43h toujours ouverte : empêcher (ou signaler) la clôture d'une période très incomplète.
- Pré-existants rouges, hors `check` : `harnais-cadence-escalier`, `mv-harnais-audit-pil` (B5, B6).
- Non regardé à l'écran.

## 183. ★ TOUR-6 — LES DATES PIÈGES PASSENT, DEUX CHEVAUCHEMENTS CORRIGÉS (27/09 — `src/pilotage.js` · `src/reglages.js` · `src/styles.css` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-etiquettes.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.66 → **7.67** · SW 8.35 → **8.36** · base `36c6263`, après CMP-NOM §182)

**`npm run tour:dates` chez Nico (27/09)** : Chromium, heure de Paris, 9 instants pièges × admin et ouvrier × 375 et 1280 px :
**803 écrans, 0 bug** — aucun mauvais jour, campagne ou exercice, aucun « Invalid Date ». 38 « à voir » : 33 petites cibles (sans
décision) et **5 chevauchements, les deux mêmes partout** — donc réels (TOUR-5 avait éliminé les faux des éléments en ligne) :
- **Frise du cockpit** (Pilotage › Aujourd'hui, `_pilCockpitTimeline`) : « AUJ. » sur « OBJECTIF » (17 écrans, 375 ET 1280 px) —
  deux repères proches, trois étiquettes à la même hauteur. Désormais chaque étiquette monte d'un étage (classes `cap.n1`, `cap.n2`)
  si elle est à moins de `_PIL_TL_ECART` (0,22 de la frise) de la dernière posée à son étage ; la frise s'écarte (`pil-tl.n1/n2` : 48 et 64 px écrits en jetons avec repli, `calc(var(--e-8,40px) + var(--e-2,8px))`, pour ne pas faire monter le cliquet d'espacement de `mv-harnais-echelle`).
- **Échelle des mois des Archives** (`_cmpEchelle`, reglages.js) à 375 px : « août 26 » (étiquette de tête, alignée à gauche, plus
  large) sur « sept ». En écran étroit (`@media (max-width:520px)`, classe `imp`), une étiquette sur deux se cache — parité calée
  sur JANVIER pour garder l'année, et le mois qui suit l'étiquette de tête toujours caché. Visible sur téléphone : août 26 · nov ·
  janv 27 · mars · mai · juil.

`scripts/mv-harnais-etiquettes.mjs` (check, prebuild, CI, `npm run test:etiquettes`) : 10 assertions sur les vraies fonctions
(étages de la frise dans quatre configurations, masquage de l'échelle, CSS présents), 3 contre-épreuves.

⚠️ Rejoué sur `36c6263` : la première version de ce lot (construite sur `43e30ec` + §177-181 locaux) ignorait CMP-NOM (§182,
`_pilCmpSnapshot`), poussé entre-temps — la coller aurait effacé son repli par nom. Seule la frise de `_pilCockpitTimeline` touche
`pilotage.js` ; les autres fichiers n'avaient que les écarts de TOUR-6.

## 184. ★★★ VER-1 — UNE VERSION PÉRIMÉE N'ÉCRIT PLUS, LE PARC SE VOIT (27/09 — `src/utils.js` · `src/app.js` · `src/firebase.js` · `src/admin-gt.js` · `public/sw.js` · `index.html` · `firebase.json` · `firestore.rules` · `guide/01-demarrer.html` · `public/guide.html` · `scripts/mv-version-json.mjs` (neuf) · `scripts/mv-harnais-version.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.67 → **7.68** · SW 8.36 → **8.37** · base `d41cde1`)

### 184a. Le trou

Point 5 de l'audit du 26/09. MAJ-1 (§157) : le nouveau SW attend le prochain lancement complet, rien ne s'impose pendant
l'utilisation (choix voulu). Mais une PWA qu'on ne ferme jamais garde l'ancien code des jours, et **écrit avec** : aucune version
minimale nulle part (ni appli, ni règles), et les écritures ne portent pas de version. Pire cas : un appareil d'avant FUSION-1
(§146) réécrit des documents entiers sans fusion. Moins grave mais réel : une v < 7.64 qui clôture refait l'archive lourde et
n'attend pas l'enregistrement (ARCH-1).

### 184b. Les décisions de Nico (27/09)

« Il faut que ça soit automatique, je ne peux pas remonter le plancher manuellement à chaque mise à jour où il y a un changement de
format de donnée » ; la mise à jour au retour : « parfait » ; le parc d'appareils : « parfait ».

### 184c. Ce qui est en place

1. **Plancher automatique.** `export const MV_FORMAT = 1` (utils.js, exposé `window.MV_FORMAT`). `npm run build` lance
   `scripts/mv-version-json.mjs`, qui écrit `dist/version.json` `{ app, format, build }` lus dans utils.js ; servi `no-store`
   (firebase.json), jamais intercepté par le SW. `_mvVerifierVersion` (app.js) le relit 8 s après le chargement, toutes les 30 min
   et à chaque retour au premier plan (au plus une fois par minute ; 404 en dev/e2e = rien). **Format serveur > format installé** →
   `window._MV_PERIME = true` : `fbSave` met en file au lieu d'écrire (`{ok:false, queued:true, perime:true}`), `_flushQueue` ne
   part pas, écran « Mise à jour obligatoire » (`#mv-perime-ov`, créé à la volée) dont le bouton active la version en attente.
   Un déploiement SANS changement de format ne bloque personne.
   ⚠️⚠️ **RÈGLE DE LOT** : tout lot qui change la FORME de ce qui est écrit en base (structure, champ renommé ou détourné) monte
   `MV_FORMAT` de 1. Pas pour un écran ou un calcul. C'est le seul geste manuel, et il est à Claude, dans le lot — pas à Nico.
   ⚠️ Ne protège que les appareils ≥ 7.68 : une version plus ancienne ne lit pas `version.json`. Pour elles, restent la
   notification NOTIF-1 et le retour (point 2) une fois qu'elles auront pris la 7.68.
2. **Mise à jour au retour.** Revenue au premier plan après ≥ `_MV_RETOUR_H` (4) heures, si `_mvRienEnCours()` (aucune
   `.overlay.open`, aucun champ actif, file vide) → `_mvActiverMaj(false)` : `reg.update()` puis `MV_ACTIVER` à la version en
   attente ; le filet `controllerchange` existant recharge. `sw.js` : `MV_ACTIVER` → `self.skipWaiting()`, **seule** activation du
   SW ; rien d'autre ne l'envoie. L'esprit de MAJ-1 tient : jamais pendant l'utilisation.
3. **Parc d'appareils.** `fbNoterAppareil(nom)` (firebase.js), après `_fbLoadAfterAuth` dans `_mvApresEntree` : identifiant
   d'appareil stable (`mavigne_appareil_id`), `{nom, v, f, sys, nav, installe, ts}` écrit par `setDoc(..., {merge:true})` dans
   `mavigne_{slug}/appareils` — fusion par clé, pas d'écrasement entre appareils. Jamais en démo ni en préparation. **Règle
   Firestore n° 4** : tout membre du domaine, lecture seule comprise (pas la démo), forme `{value}` et map ≤ 200 entrées. Admin GT,
   fiche du domaine : section « Appareils » (12 plus récents), version ancienne en ambre, **« bloquée »** en rouge si format plus bas.

### 184d. Harnais et déploiement

`scripts/mv-harnais-version.mjs` (check, prebuild, CI, `npm run test:version`) : 26 assertions sur les vraies fonctions
(`_mvVerifierVersion` avec fetch simulé, `_mvRienEnCours`, `fbNoterAppareil`, `_agtFicheAppareils`) et le câblage ; 6
contre-épreuves. `mv-version-json.mjs --test` dans check. **Déploiement** : `firebase deploy --only hosting,firestore:rules`
(la règle `appareils` est neuve ; sans elle, l'écriture du parc est refusée — sans autre effet, le refus est avalé).

## 185. ★★ DROITS-1 — LA LECTURE SEULE, MÊME RÈGLE DANS L'APPLI ET SUR LE SERVEUR (27/09 — `src/utils.js` · `src/firebase.js` · `firestore.rules` · `index.html` · `public/sw.js` · `scripts/mv-harnais-droits.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.68 → **7.69** · SW 8.37 → **8.38** · base `aaee21c`)

Point 6 de l'audit du 26/09 (droits d'écriture par rôle). **Lu dans le code** :
- Le serveur pose le claim `ro` par `deriveRo` (claims.js) : aucun rôle d'écriture (admin, ouvrier, tractoriste) ET saisonnier ou
  pilotage. Les règles refusent alors TOUT document métier (`canWrite()` des règles).
- L'appli n'avait pas cette notion : `canWrite()` (utils.js) règle l'AFFICHAGE et diffère volontairement (tractoriste seul : pas de
  `canWrite`, mais il écrit ses sessions). `saveData` / `fbSave` n'avaient aucune garde : un écran resté actif ou une migration au
  chargement (`_migrateTachesSaison` écrit `parcelles` sans condition de rôle) tentait l'écriture → refus → `_mvStashDenied` (coffre)
  + badge rouge « Enregistrement refusé — … · saisie conservée » + `warning`. Rien de perdu (STASH-1), mais un faux drame.
- `error_log` relevait de la règle 3 (membres NON-ro) : `fbAppendError` avalait le refus — **aucune erreur d'un saisonnier ou d'un
  pilote n'est jamais arrivée à l'Admin GT**.

**Correction.** `_mvLectureSeule()` (utils.js, `window._mvLectureSeule`) : copie exacte de `deriveRo`. `fbSave` : garde **avant**
`_ignoreNext` (sinon la prochaine mise à jour distante de la clé serait ignorée) → aucune tentative, `{ok:false, denied:true, ro:true}`,
toast « Votre rôle est en lecture seule — rien n'est enregistré » une fois par session (`_mvRoDit`), `logError` `info` cat `droits`.
**Règle 5** : `error_log` écrit par tout membre (pas la démo), liste ≤ 100.

**Harnais** `scripts/mv-harnais-droits.mjs` (check, prebuild, CI, `npm run test:droits`) : `_mvLectureSeule` et `deriveRo` exécutées
sur les **32 combinaisons** des cinq rôles (aucun écart, 7 en lecture seule), position de la garde, message unique, règle 5 ;
3 contre-épreuves. **Déploiement** : `firebase deploy --only hosting,firestore:rules`.

⚠️ **Ouvert, décision de Nico** : un membre SANS AUCUN rôle (`roles: []`) n'est pas `ro` pour le serveur (`deriveRo` exige saisonnier
ou pilotage) — il peut écrire les documents métier. L'appli ne lui montre aucun bouton (`canWrite` faux), mais les règles le laissent
passer. Rendre `ro` tout membre sans rôle d'écriture fermerait la porte (changement de `deriveRo`, déploiement des fonctions,
jetons rafraîchis à la connexion suivante).

## 186. ★★ DROITS-2 + ACCES-1 — LECTURE SEULE = AUCUN RÔLE D'ÉCRITURE, ET UNE FICHE INACTIVE PERD L'ACCÈS (27/09 — `functions/claims.js` · `firestore.rules` · `src/utils.js` · `src/cuvier.js` · `src/firebase.js` · `src/reglages.js` · `guide/02-roles.html` · `public/guide.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-droits.mjs` · `scripts/mv-harnais-vendange-garde.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.69 → **7.70** · SW 8.38 → **8.39** · base `a7f9a5c`)

Point ouvert de §185, décision de Nico (27/09) : « oui » — fermer la porte. **Avant** : `deriveRo` = aucun rôle d'écriture **ET**
(saisonnier **ou** pilotage). Un membre sans aucun rôle (`roles: []`, ou des rôles inconnus comme `bureau`) n'était pas `ro` : les
règles le laissaient écrire journal, parcelles… (l'appli ne lui montrait aucun bouton). **Désormais** : `ro` = aucun de admin,
ouvrier, tractoriste. Les **trois copies** bougent ensemble et restent tenues égales : `deriveRo` (claims.js), `_mvLectureSeule`
(utils.js, `mv-harnais-droits` : 32 combinaisons, aucun rôle compris) et `_vendLectureSeule` (cuvier.js, `mv-harnais-vendange-garde`
— son cas « aucun rôle » était hors modèle, il y entre). Côté appli, sans session → rien n'est bloqué ; **le compte GUERETTECH
(`_isGTAdmin`) n'est jamais bloqué** (les règles le laissent écrire par `isGtAdmin()`, quels que soient ses rôles dans un domaine).

⚠️⚠️ **Déploiement en deux temps.** Le claim `ro` n'est recalculé qu'à la création d'un compte, à un changement de rôles
(`updateMemberRoles`) ou par **`gtBackfillClaims`** (pas de bouton : console du navigateur, session GT,
`await window.fbCallFn('gtBackfillClaims', {})` → rapport `updated / notFound / errors`). Donc : ① vérifier dans Réglages › Équipe
de chaque domaine que toute personne qui saisit a admin, ouvrier ou tractoriste — **le backfill rendra lecture seule tout le reste** ;
② `firebase deploy --only functions,hosting,firestore:rules` ; ③ lancer `gtBackfillClaims`. Les jetons se rafraîchissent à la connexion suivante
(ou dans l'heure).

**ACCES-1 (même lot, question de Nico du 27/09).** Sa pratique pour un départ : fiche en Inactif, rôles retirés ; au retour, Actif et
rôle rendu. **Lu dans le code** : la tuile disparaît (`initLogin`) et `getLoginEmail` ne répond plus pour un Inactif — mais **une
session déjà ouverte restait active** (le jeton porte `tenant`, rien ne la coupait) : l'ancien salarié lisait tout le domaine, et
avant DROITS-2 il pouvait même écrire (rôles `[]` ⇒ pas `ro`). Correction :
- `deriveOff(statut)` (claims.js) ; claim **`off`** posé par `updateMemberRoles` (paramètre `inactif` transmis par Réglages ; à défaut,
  lu dans le doc `membres`) et par `gtBackfillClaims` ; jamais pour GUERETTECH ni la démo. **`tenant` est GARDÉ** : le retirer
  laisserait un admin d'un AUTRE domaine rattacher ce compte au sien (`updateMemberRoles` accepte un compte sans tenant).
- Au PASSAGE à Inactif : `revokeRefreshTokens` — le jeton en cours meurt à son expiration (≤ 1 h), la session tombe.
- **Règles** : `isMyTenant` exige `off != true` → plus de lecture ni d'écriture.
- Réglages (`saveEditMembre`) : un changement de STATUT repose les droits (avant : seulement un changement de rôles) ; toasts
  « Accès retiré à … — ses sessions ouvertes se ferment dans l'heure » / « Accès rétabli pour … ».
- Retour : fiche Actif + rôle → `off` retombe, accès à la connexion suivante. Conseil donné : ajouter une NOUVELLE période de contrat,
  ne pas déplacer les anciennes dates (présence et heures du passé). Guide 02-roles mis à jour.
`mv-harnais-droits` : section D, 16 assertions au total, 7 contre-épreuves.

## 187. ★ VER-2 — L'E2E DE LA CI TOMBAIT DEPUIS VER-1 (27/09 — `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-version.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.70 → **7.71** · SW 8.39 → **8.40** · base `8268927`)

**Constat (captures de Nico, 27/09)** : CI rouge sur les runs #103 (majauto = VER-1) à #106 ; #102 (archives) vert. Job « contrôles »
vert ; job **e2e** rouge à l'étape « E2E local (données injectées) », annotation « Process completed with exit code 1 ». Les journaux
de GitHub demandent une connexion ; l'API était limitée (403, IP partagée).
**Rejoué ici** : Playwright piloté sur le Chromium du paquet npm `@sparticuz/chromium` (le téléchargement Playwright est bloqué dans le
bac à sable, npm ne l'est pas) — `chromium.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', ...] })` sur une copie
de `e2e-local.mjs`. Sortie : `✖ Page tracteur — [MaVigne Error] INFO [avale] erreur avalée dans app.js/_mvVerifierVersion —
SyntaxError: Unexpected token '<'`. **Cause** : en dev, `/version.json` n'existe pas ; Vite répond `index.html` en **200** (repli
SPA) ; `r.ok` passait, `r.json()` levait, `_mvAvale` → `logError` → `console.error`, que l'e2e compte comme une erreur.
**Correction** : `_mvVerifierVersion` ne parse que si le `content-type` contient `json`. Harnais `mv-harnais-version` : cas « serveur
de dev » (27 verts, 7 contre-épreuves). Après correction, l'e2e rejoué ici est **OK** (la seule autre alerte, « Météo secteur
injoignable », vient du bac à sable qui bloque `api.open-meteo.com` — joignable en CI, où #102 était vert avec le même code).
★ **Outil gagné** : Claude peut désormais lancer `e2e-local`, `smoke` et `mv-tour` dans son bac à sable (Chromium de
`@sparticuz/chromium`) — les lots navigateur n'ont plus à être écrits à l'aveugle.

---

## 188. ★★ RÉAL-1 — LE « RÉALISÉ » DES TABLEAUX EST CE QUI A ÉTÉ PAYÉ, ET UNE REVALIDATION NE DOUBLE PLUS LE BARÈME (27/09 — `src/pilotage.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · APP 7.71 → **7.72** · SW 8.40 → **8.41** · base `9801910`)

**Constat (capture de Nico, 27/09)** : Économie › Postes & travaux, « Coût par travail » : Dégraffage 329,4 h · 100 % · **Réalisé
6 494 € · Reste 0 € · Budget 6 494 €** ; dessous, « Temps réel contre barème » : 374,3 h versées, 31,8 h/ha réel contre 31,2 au
barème, **+2 %**. Nico : *« entre le budget et le réalisé il y a une différence (la preuve en est juste en bas). Il faut que le réalisé
se mette en haut aussi et que nous voyons une différence de budget. Ça sert à ça un outil de pilotage. »*

**Cause ①** : ENG-2 (§173d) avait laissé les colonnes « Réalisé » au barème (`t.fE`, `r.moF`, `engageBar`) — barème du fait = budget
du fait, égalité par construction. **Cause ②, trouvée en lisant la capture** : 11,76 ha des deux côtés, mais 329,4 h de barème au
budget (28 h/ha) contre 31,2 h/ha dans la carte temps — **52 validations** pour une quarantaine de parcelles : `_ecoTempsVigne`
comptait `_ecoTvBar` **à chaque** « Validé » d'une tâche simple, revalidations comprises. Le barème gonflé masquait l'écart (+2 %
au lieu de 374,3 / 329,4 ≈ **+14 %**). ⚠️ Inférence tirée des chiffres de la capture, **non vérifiée sur les données de MG** (pas
d'accès) : à confirmer en rouvrant l'écran après déploiement — h/ha barème de la carte temps ≈ 28.

**Moteur (`_ecoTempsVigne`)** : `accE` suit `acc` — les euros de chaque heure (taux du jour, repli taux moyen) sont versés avec elle
au prorata de la surface → `pairs[k].eur`, `taches[].eur`, `parcs[nom].eur`, `eAff`, `eAtt` (invariant tenu : versé + attente =
`eur`). **`_ecoTvEvents`** : un « Validé » simple sur un couple déjà validé **dans la période** (pas d'« Annulé » entre) porte
`dup:true` → clôture (les heures y vont) mais barème 0. Borné à `dt>=d0` : la même tâche revient chaque campagne.

**`_pecData`** : `t.reE` (euros versés au travail, rapprochés par `_friseNorm`), `t.ecE = reE − fE` ; `r.moRe`, `r.engRe = moRe +
tracteur + GNR + phyto`, `r.ecE = moRe − moF` ; `E.engRe`, `E.ecRe`, `E.reAttE/H` (payé, en attente d'une validation), `E.reHorsE`
(versé à un travail absent de la liste de la période). Repli sans planning (`reOk:false`) : réalisé = barème, écart `—`.
**Inchangés** : `engage`, `engageBar`, `resteBar`, la projection, le KPI, l'écart de cadence (§28 reste ouvert).

**Écran** : Coût par travail — Travail · Heures · Fait · **Réalisé** (+ heures versées) · **Écart** (€ et % du barème du fait, couleurs
de la carte temps : >15 rouge, >5 orange, <−8 vert) · Reste · Budget · €/ha · Part ; ligne Total ; cadre : définitions + montant en
attente. Graphe : barre pleine = réalisé, débord au-delà du budget en rouge, trait = barème du fait, droite = écart. Parcelles : MO
et Réalisé payés, colonne Écart, tris mémorisés `moF`/`engage` redirigés ; CSV : + `Ecart EUR`, `MO bareme du fait EUR`, `Heures realisees`.

**Accompagnement** : fiches `pil.eco.travaux` (réécrite : budget / réalisé / écart / attente), `pil.eco.parcelles` (MO payée, Écart),
`pil.eco.temps` (revalidation). `guide/11-pilotage.html` + `public/guide.html` régénéré. « Quoi de neuf » 7.72 (2 entrées).
`pil.eco.engage`, `pil.eco.postes` relues : rien à changer. Visite guidée : rien ne bouge.

**Harnais** `mv-harnais-temps-vigne` : R1-R10 exécutés (euros par couple/travail/parcelle au taux du jour, attente en euros,
invariant, revalidation une fois, Validé-Annulé-Validé, validation d'une période passée), J5 réécrit, J7-J11 branchements ;
+5 contre-épreuves (69 assertions / 24).

**Rendu regardé** (Chromium `@sparticuz/chromium`, appli en dev, données injectées, planning et taux forcés) : Coût par travail
(barre réalisée, débord rouge, trait du barème du fait, colonne Écart, Total, cadre « en attente »), Temps réel contre barème (même
écart, barème une fois malgré une double validation), Parcelle par parcelle (MO, Réalisé, Écart, pied). Thème sombre et téléphone :
non regardés. **`npm run check` vert.** Cliquet TYPO-1 « aucun module n'enfle de plus de 5 % » : `pilotage.js` était déjà à
+4,7 % depuis la dernière gravure (721 → 755 ko sur la base), ce lot ajoute 8,6 ko → **regravé** (`--baseline`, seules les
colonnes ko bougent). ⚠️ La question du découpage de `pilotage.js` (764 ko) reste posée.
**Non mesuré** : aucune donnée réelle (MG).

---

## 189. ★★★ RULES-1 + DOC-1 — LES RÈGLES FIRESTORE EXÉCUTÉES PAR LE VRAI MOTEUR, ET CE DOCUMENT SCINDÉ (27/09 — `scripts/mv-harnais-rules.mjs` (neuf) · `scripts/mv-claude-index.mjs` (neuf) · `scripts/harnais-claude-md.mjs` · `package.json` · `package-lock.json` · `.github/workflows/ci.yml` · `CLAUDE.md` · `docs/claude/` (neuf) · **aucun bump**, base `9801910`)

### 189a. Le point de départ — une liste générique, vérifiée sur le dépôt

Nico soumet une liste de pistes d'amélioration écrite depuis l'arborescence, pas depuis le code. Confrontée au dépôt :
- **écarté — ranger `scripts/` en sous-dossiers** : 138 fichiers (pas 80) ; les contre-épreuves calculent la racine
  par `join(ICI, '..')`, les chemins sont écrits dans `package.json`, `ci.yml`, le crochet `pre-commit` et des
  centaines de renvois ici. Beaucoup de remue-ménage, aucun défaut évité ;
- **écarté — TypeScript / `@ts-check` / Zod** : les harnais exécutent déjà les vraies fonctions ; Zod alourdirait le
  bundle client (côté Cloud Functions, `leads.js` n'a pas été relu : à confirmer si le sujet revient) ;
- **déjà fait — conflits hors ligne et indicateur de synchro** : fusion à trois voies (FUSION-1, §146, pas du
  « dernier qui écrit gagne »), file hors ligne (STOCK-1, §180), point de synchro (SYNC-1, §174), retour de veille
  (REPRISE-1, §145) ;
- **déjà fait — CI parallèle** : deux jobs existaient ;
- **retenu, pas fait** : une liste unique des harnais (`check` = `prebuild`, double exécution en CI) → §28 ;
- **retenus et faits** : les règles Firestore exécutées (RULES-1) et la taille de ce document (DOC-1).

### 189b. RULES-1 — ce que le moteur fait des règles, requête par requête

**Constat.** Aucun script n'exécutait `firestore.rules`. `mv-harnais-droits`, `mv-harnais-version` et
`harnais-claude-md` le LISENT : ils voient qu'une ligne existe, jamais ce que le moteur en fait. Or une règle se
trompe en silence — un refus de lecture est avalé par `_pullKeys` (§8c), une autorisation de trop ne se voit que
le jour où quelqu'un s'en sert. L'isolement entre domaines est la promesse la plus grave du produit.

**Le harnais** `scripts/mv-harnais-rules.mjs` : `@firebase/rules-unit-testing` sur l'émulateur Firestore, les VRAIES
règles chargées, des jetons fabriqués pour chaque rôle, des données de départ écrites règles désactivées et remises
avant chaque écriture (un `set` accepté plus haut ne fausse pas le cas suivant). **53 cas** en cinq familles :
A. isolement (A ne lit ni n'écrit B, racine et sous-collection ; `off` dehors ; sans `tenant`, anonyme, hors
`mavigne_*` dehors) · B. rôles (`ro` lit sans écrire sauf `error_log` borné et `appareils` ; admin-only ; `paie` ;
`config` limité à `home_layout`/`gnr` ; forme `{ value }` ; plafond de 3 000 parcelles ; `adm`+`ro` ≠ admin) ·
C. démo (lit domaine-dupont sauf `paie`, n'écrit jamais, même avec `tenant`+`adm`) · D. GUERETTECH (l'identité
seule ne suffit pas : `gts` exigé, non expiré ; e-mail non vérifié refusé) · E. collections fermées ou publiques
(`_gt_otp`, `leads`, `mail`, `ephy`, `_mv_signatures`, registre des slugs).

**`--contre`** : témoin d'abord (règles intactes, même dispositif, doit sortir vert), puis **12 fautes** posées une
à une sur une copie en mémoire (ancre trouvée EXACTEMENT une fois, sinon rouge), rechargées dans l'émulateur, et le
cas qui les vise doit rougir, nommément : comparaison de collection retirée, `off` oublié, `ro` oublié dans
`canWrite`, démo oubliée, `membres` sorti des admin-only, `paie` lisible, `gts` oublié, `shapeOk` neutralisé,
`cp_mode` ouvert aux non-admins, plafond d'`error_log` relevé, `_gt_otp` ouvert, `countOk` neutralisé.
★ Une erreur qui n'est PAS un refus de permission (émulateur tombé, chemin invalide) fait planter le harnais en
code 2 : elle n'est jamais comptée comme un refus — sinon un émulateur absent ferait passer tous les cas « refusé ».

**Constats (F), affichés en jaune, non bloquants** — la règle est déployée ainsi, la changer est une décision :
F01 une fiche Inactive lit encore `_mv_signatures/{slug}` (ce bloc ne regarde pas `off`) ; F02 un membre non-ro
écrit un `error_log` de plus de 100 lignes (la règle 3 l'accepte sans le plafond de la règle 5). Si le comportement
change, le harnais dit « constat FERMÉ » : retirer la ligne. → §28.

**Arbitrages.**
- `@firebase/rules-unit-testing` **3.0.4, épinglé** — pas la 5.x, qui exige `firebase` ^12 alors que l'appli est
  en ^10 : conflit de dépendance de pair. Seule dépendance ajoutée (dev).
- `firebase-tools` **n'est pas** une devDependency (~780 paquets imposés à chaque `npm ci`, CI comprise) : le script
  l'appelle par `npx -y firebase-tools@14.27.0`, version épinglée.
- **Un seul `projectId`** (`demo-mv-rules`) pour toutes les passes : `firebase.json` porte `singleProjectMode`.
  Chaque passe recharge les règles et vide la base. Un id `demo-*` n'atteint jamais un vrai projet.
- **Hors `npm run check`** : il faut Java et l'émulateur. **Job CI `rules`** à part (Java 21 temurin,
  `actions/setup-java` épinglé par SHA comme les autres actions : `de7274f…`, tag v6.0.1, relevé par `git ls-remote`).

⚠️⚠️⚠️ **CE QUI N'A PAS ÉTÉ VÉRIFIÉ.** Le harnais n'a **jamais** tourné contre le vrai moteur côté Claude :
`storage.googleapis.com` est hors de la liste réseau du bac à sable, le `.jar` de l'émulateur ne se télécharge pas.
Vérifié : syntaxe (`node --check`), types de l'API (lus dans le `index.d.ts` installé), plomberie complète sous un
moteur factice (témoin, 12 ancres trouvées une fois chacune, codes de sortie, message clair sans émulateur).
**Le premier run du job `rules` est la première vraie preuve.** Un rouge peut être une faille OU une attente fausse
du harnais — c'est la famille de §42f : lire le cas avant de toucher aux règles.
★★ **JOUÉ LE 27/09 CHEZ NICO** (`npm run test:rules`, Windows, émulateur `v1.19.8`) : **53 vertes, 0 rouge**, témoin
vert, **12/12 contre-épreuves rougissent**, F01 et F02 affichés. `npm run build` vert avant (check complet + Vite).
Seul défaut : le SDK journalisait un bloc « PERMISSION_DENIED … » à chaque refus ATTENDU — des centaines de lignes
où un vrai rouge se serait noyé. `setLogLevel('silent')` en tête du harnais : il ne lit pas ces journaux (un refus
se juge sur l'exception, toute autre exception plante en code 2), les faire taire ne masque rien de ce qu'il mesure.
⚠️ Ce silence n'a pas été rejoué contre l'émulateur : au prochain `npm run test:rules`, vérifier que le bruit a
disparu (s'il reste, c'est que le SDK compat charge une autre instance du journal — sans effet sur le résultat).

### 189c. DOC-1 — le cœur se lit en entier, le reste se consulte

**Mesuré le 27/09** : ce fichier faisait **23 910 lignes**. Les 1 190 premières étaient des consolidations
empilées, AVANT la règle d'or n°1 ; les chantiers §30–§187 en faisaient 17 700. Une session qui « lit CLAUDE.md »
lisait surtout du récit, et les consignes s'y perdaient — c'est la raison donnée par Nico.

**La scission** (sections déplacées **à l'identique** : numéros, titres, contenu) :

| Fichier | Contenu | Lignes |
|---|---|---|
| `CLAUDE.md` | mode d'emploi (neuf) · dernière consolidation · règles d'or · environnement · communication · §1–§8c · §24 · §25 · §27a · §28 · §29 | ~2 600 |
| `docs/claude/modules.md` | §9–§23 · §26–§27f sauf §27a | ~2 490 |
| `docs/claude/chantiers-030-079.md` … `chantiers-180-229.md` | §30 → §189, par tranches de 50 | ~17 800 |
| `docs/claude/journal.md` | l'ancien en-tête (consolidations jusqu'à VER-2) | ~1 200 |
| `docs/claude/INDEX.md` | GÉNÉRÉ par `scripts/mv-claude-index.mjs` (`--check` dans `npm run check`) | — |

**Seuls textes modifiés** : le mode d'emploi (neuf), la consolidation, la règle d'or n°6 (où écrire), §5
(`docs/claude/`), §6b (palier RULES), §8c (les règles se prouvent en les exécutant), §28 (entrée RULES-1).

**`harnais-claude-md.mjs` lit désormais l'ensemble** (CLAUDE.md + `docs/claude/*.md`) : toutes ses assertions
d'avant tiennent sur le tout. **Assertions neuves** : le cœur porte bien ses sections obligatoires (et ne peut pas
les perdre en les « rangeant ») · le mode d'emploi précède la règle d'or n°1 · une seule consolidation en tête ·
chaque chantier est dans le fichier de sa tranche · plafond de lignes du cœur (cliquet) · l'index est à jour.
**Mesuré** : `harnais-claude-md` passe de 36 à **62 assertions**, vertes. Ses nouvelles assertions ont été
contre-éprouvées à la main, une faute à la fois, sur les vrais fichiers : §25 renommé dans le cœur, une
« ★ Précédente » ajoutée, un §60 posé dans la mauvaise tranche, 300 lignes ajoutées au cœur. **Les quatre ont
rougi**, puis tout est revenu au vert après restauration. Fidélité de la scission : chaque section d'origine se
retrouve **caractère pour caractère** dans les nouveaux fichiers, sauf les cinq sections modifiées volontairement
(règles d'or, §5, §6b, §8c, §28) ; l'ancien en-tête est intact dans `journal.md`.
`npm run check` : **142 commandes, 0 rouge**, jouées une à une (la chaîne entière dépasse le délai d'une commande
du bac à sable). Cliquet ESLint : 0 erreur, plafond 0.
★ Les renvois « CLAUDE.md §82a » dans les commentaires des scripts restent justes : l'index les résout.
⚠️ **Rangement à respecter à chaque lot** : il est écrit dans le mode d'emploi, en tête de `CLAUDE.md`.

### 189d. ⚠️⚠️⚠️ L'ÉCRASEMENT DE RÉAL-1 — et la garde qui manquait

**Ce qui s'est passé (27/09).** Ce lot a été construit et livré sur `9801910`, frais au moment de la livraison. Pendant ce
temps, RÉAL-1 (§188, `1cd9e4b`, 12 h 08) a été poussé depuis une autre conversation : il ajoutait sa section §188 et sa
consolidation à `CLAUDE.md`, et relevait `SECTIONS` à 220. Le zip de ce lot a ensuite été décompressé PAR-DESSUS (`3bc79d1`,
« rearchi ») : `CLAUDE.md` et `harnais-claude-md.mjs` complets, construits avant RÉAL-1, ont remplacé les siens.
**Le code de RÉAL-1 n'a pas été touché** (`pilotage.js`, `utils.js`, `index.html`, `sw.js`, guide, harnais `temps-vigne` :
aucun fichier commun). **Sa documentation, si** : section et consolidation effacées, et ce lot avait pris le même numéro.

**Pourquoi rien n'a rougi.** `SECTIONS` : 220 des deux côtés (chaque lot ajoutait UNE section) — la faute exacte de §126.
« Aucun numéro en doublon » ne voit pas un remplacement. La liste de titres protégés ne connaît que quatre chantiers.
Découvert par Claude en re-mesurant la fraîcheur avant de livrer un correctif (règle d'or n°1) : le dépôt avait bougé,
et le diff de `CLAUDE.md` dans `1cd9e4b` montrait 54 lignes que la tête ne contenait plus.

**Réparation.** Repartie de la tête (`3bc79d1`) : la section RÉAL-1 et sa consolidation reprises **caractère pour caractère**
de `1cd9e4b` (vérifié) — la section en §188 dans `chantiers-180-229.md`, la consolidation en tête de `journal.md`. Ce lot est
renuméroté **§189** (RÉAL-1 était premier). `SECTIONS` → 221.

**La garde neuve** (`harnais-claude-md.mjs`, bloc 4) : les titres « ## N. … » des **12 derniers commits** (CLAUDE.md, puis
`docs/claude/` une fois la scission faite) doivent tous exister encore, mot pour mot. Un renommage volontaire se déclare
dans `RENOMMES` (l'ancien titre de ce lot y est, §188 → §189). **Contre-épreuve jouée** : la section RÉAL-1 retirée →
« disparu depuis 5e2fca5 : ## 188. RÉAL-1… », rouge ; restaurée → vert. Sur `3bc79d1` tel que poussé, elle aurait rougi.

★★ **La leçon côté livraison** : un zip qui porte des fichiers de DOCUMENTATION complets (`CLAUDE.md`, `docs/claude/*`,
`harnais-claude-md.mjs`) écrase tout lot poussé après sa base, exactement comme un fichier de code complet (règle d'or n°1).
Deux lots préparés dans deux conversations le même jour doivent s'intégrer **l'un après l'autre, le second reconstruit sur
le premier** — jamais décompressés tous les deux sur la même base.

---

## 190. ★★ LISTE-1 — UNE SEULE LISTE DE CONTRÔLES, JOUÉE UNE SEULE FOIS (27/09 — `scripts/mv-harnais-liste.mjs` (neuf) · `scripts/mv-lanceur.mjs` (neuf) · `scripts/mv-harnais-portes.mjs` (réécrit) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · **aucun bump**, base `a4d7efe`)

### 190a. Le constat

Proposé au §28 par RULES-1 (§189a), lancé par Nico. **Mesuré sur `a4d7efe`** : `check` et `prebuild` étaient deux chaînes
**identiques** de 143 commandes, recopiées à la main dans `package.json` ; `ci.yml` rejouait **70** de ces commandes en 34
étapes nommées, puis `npm run build` relançait **les 143** via `prebuild` — chaque contrôle de la CI tournait **deux fois**.
Trois listes pour une seule porte : `mv-harnais-portes` n'existait que pour les empêcher de diverger, parce qu'elles avaient
déjà divergé (46 contre 25, dont 14 que le poste ne lançait jamais).

### 190b. Ce qui est fait

- **`scripts/mv-harnais-liste.mjs`** — LA liste : `HARNAIS = [[commande, groupe?], …]` dans l'ordre d'exécution, et
  `GROUPES` : les raisons d'être. **Même suite, même ordre** que l'ancienne chaîne `check` (vérifié : 143 = 143, comparaison
  exacte avec `git show HEAD:package.json`), plus une ligne : `mv-harnais-portes --contre`. Les **34 commentaires** que
  `ci.yml` portait au-dessus de ses étapes sont repris **mot pour mot** dans `GROUPES` (générés depuis le fichier, pas
  réécrits) : 70 commandes y sont rattachées. Certains parlent de l'ancienne CI — l'en-tête le dit ; ils sont gardés parce
  qu'ils disent POURQUOI le contrôle existe.
  Une commande = `node scripts/x.mjs` + au plus un drapeau : pas de `&&`, pas de tube, une liste relisible ligne à ligne.
- **`scripts/mv-lanceur.mjs`** — joue la liste, chaque commande dans son propre processus (`process.execPath` : le même Node
  que npm, sous Windows aussi), sortie telle quelle. Par défaut : **premier rouge, arrêt, code 1** — la chaîne `&&` d'avant,
  avec la commande de reprise affichée (`--depuis`). `--continuer` : tout, puis le résumé des rouges avec la raison d'être de
  leur groupe. `--groupe a,b`, `--liste`. Chemin rouge testé sur une liste factice (arrêt, reprise affichée, `--continuer`,
  codes de sortie).
- **`package.json`** : `check` = `node scripts/mv-lanceur.mjs` · `prebuild` = `npm run check`.
- **`ci.yml`** : les 34 étapes deviennent **une** (`node scripts/mv-lanceur.mjs --continuer`), et le build devient
  **`npm run build --ignore-scripts`** — npm saute alors les hooks `pre`/`post` mais joue `build` lui-même (vérifié sur npm 10,
  celui de Node 22 en CI : `prebuild` sauté, `build` joué). Sans ce drapeau, `prebuild` relancerait tout.
  ⚠️ `build` n'a PAS été dédoublé en `build:seul` : C9 (preflight) et VER-1 lisent `scripts.build` et y exigent
  `inject-precache` une seule fois puis `mv-version-json` — `--ignore-scripts` évite une seconde copie de la commande.
- **`mv-harnais-portes.mjs`** réécrit : il gardait trois listes jumelles, il garde désormais le **câblage** —
  A. `check` = le lanceur, `prebuild` = `npm run check`, aucun script de `package.json` ne recopie une chaîne (≥ 5
  invocations) · B. la liste est saine (forme, fichiers présents, aucun doublon, groupes cités et utilisés, cliquet ESLint
  présent, le lanceur ne se lance pas) · C. la CI lance le lanceur une fois avec `--continuer`, rien hors de la liste
  (`CI_SEUL` vide), et construit avec `--ignore-scripts`. **13 assertions, 12 contre-épreuves**, dans la liste.

### 190c. Ce qui change à l'usage

**Ajouter un contrôle = UNE ligne dans `mv-harnais-liste.mjs`** (+ sa contre-épreuve). Plus rien à recopier dans
`package.json` ni dans `ci.yml` — c'est la consigne posée au §6b du cœur. Côté CI, on perd les 34 étapes nommées de
GitHub ; le résumé final du lanceur les remplace (chaque rouge avec sa raison d'être). Durée de la CI : un passage au
lieu de deux.

### 190d. Mesuré / pas vérifié

`npm run check` (désormais le lanceur) : **144 commandes, 0 rouge, 375 s** dans le bac à sable. `mv-harnais-portes` :
13 vertes, 12/12 contre-épreuves. `harnais-claude-md` : 63 vertes. ESLint : 0. Pas vérifié : **le job CI `controles` sous sa
nouvelle forme** (premier push) — en particulier que `npm run build --ignore-scripts` se comporte sur le runner comme
sur npm 10 ici.


## 191. ★★★ RELEVE-3 — LE RELEVÉ D'UN MOIS FIGÉ PLANTAIT, ET UN HARNAIS QUI TIRE LES DONNÉES AU HASARD (27/09 — `src/planning.js` · `scripts/mv-harnais-robustesse-planning.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `src/utils.js` · `index.html` · `public/sw.js` · **bump APP + SW**, base `4da4367`)

### 191a. Le constat

Remonté du terrain, capture à l'appui : bouton « Relevé » de la fiche d'un salarié, septembre 2026 figé le 25/09 →
`Uncaught TypeError: Cannot read properties of undefined (reading 'length')`. L'écran de la fiche, lui, s'affichait.
**Les 96 contrôles du relevé et ceux de la récup étaient verts.**

**La cause**, retrouvée en rejouant le vrai `planning.js` dans Node sur des mois tirés au hasard (graine 11, octobre figé) :
`_planFigeInstantane` range la majoration du dimanche sous la forme `{taux, nat, h}` — **sans ses jours**. Un mois figé, en
mode payé, reprend cette liste telle quelle (`P.majSeule = P.fige.maj`). Le relevé papier écrit « Dimanche 13 » et appelle
`_pfNatLib`, qui lisait `l.jours.length`. L'écran ne plantait pas parce qu'il ne nomme jamais le jour (`x.nat` seulement).
Trois conditions à réunir : mois figé · mode `paye` · dimanche ou férié travaillé **hors** heures sup (majoration seule —
ici des heures qui rattrapaient une absence de la semaine).

### 191b. Ce qui est fait

- **`_pfNatLib`** tolère une majoration sans jours : « Dimanche », « Jour férié » (générique) au lieu de lever.
- **`_pfMajJours(L, vif)`** (neuf) : pour un mois figé, relit les jours dans le calcul vivant du mois (`hm.majHs`, même taux,
  même nature). Le relevé du 25/09 dit donc bien « Dimanche 13 », **sans défiger**.
- **Arbitrage : l'instantané ne change PAS de forme.** Y ajouter `jours` aurait été plus simple pour les mois à venir, mais
  n'aurait rien réparé des instantanés déjà en base, et changeait un format persisté que `_planCompteur` relit (FIGE-1,
  DIM-1). Relire au lieu de réécrire : zéro migration, et les instantanés d'avant sont couverts par construction.
- **`mv-harnais-robustesse-planning.mjs`** (neuf, dans la liste + sa contre-épreuve) :
  A. le cas du terrain à la main, sous trois formes d'instantané (celle du jour, celle du 25/09 sans jours, une date seule),
  plus le libellé appelé directement sans jours (défense en profondeur) ;
  B. **24 domaines tirés au hasard** (graine fixe : un rouge se rejoue) × 12 mois × quatre dates du jour, saisies réalistes
  ET abîmées (motifs inconnus, horaires vides, `motif_h` négatif ou texte, mois figés sous cinq formes d'avant), et **chaque
  surface du Planning** : grille, tableau, synthèse, annuel, onglet Équipe, hors contrat, 4 onglets de la fiche (salarié et
  équipe collective), feuille d'un jour, trois relevés. Rouge sur une exception, une erreur journalisée, ou un
  « undefined », « NaN », « [object Object] », « Infinity » dans ce qui s'affiche. `--long` : 200 tirages.

### 191c. Ce qu'on a appris

★★★ **Un harnais qui ne joue que des données écrites par le code du jour ne voit jamais une donnée d'avant.** Tous les
scénarios du relevé passaient par `_planFigeInstantane` *actuel*, puis relisaient aussitôt : le trou n'était pas dans le
code du jour, il était entre deux structures (ce que l'instantané garde / ce que le relevé lit). **Consigne posée au §24
(build, n°20).** Le tirage au hasard l'a trouvé en 40 domaines, sans qu'on sache quoi chercher.
★ **Un tirage « sale » vient parfois du test.** Premier passage : un « NaN j » de congés restants — il venait d'un
`cp_initial_j: 'x'` injecté par le harnais, que Réglages ne peut pas écrire (`parseFloat(...)||0`). Retiré du générateur.
★ **Contre-épreuve muette, puis comprise.** Remettre l'ancien `_pfNatLib` seul restait vert : la relecture des jours le
protège. Ce n'est pas un trou (§6b) — mais le libellé doit tenir seul, d'où l'assertion A11 qui l'appelle sans jours.

### 191d. Mesuré / pas vérifié

Base : section A **6 rouges** (le plantage exact). Corrigé : **25 vertes**, **4/4 contre-épreuves** rougissent (l'ancien
libellé, la relecture des jours retirée, un plantage inédit dans l'onglet Congés, un « NaN » dans le relevé). `--long` : 200
tirages verts (122 s). Section B ≈ 17 s dans la liste. `mv-harnais-portes` : 13 vertes, 12/12.
**Pas vérifié** : le rendu papier à l'œil (aucun navigateur ici) — ouvrir le relevé de septembre et regarder la ligne
« Dimanche 13 » de la page 2 (« Les heures sup de septembre »).
**Hors périmètre, dit à Nico** : seul le Planning est passé au tirage au hasard. Même méthode à appliquer module par module
(Pilotage, Cave, Tracteur, Réserve) — un lot par module.

## 192. ★★ MEP-1 — LE RELEVÉ REPASSE À DEUX PAGES, CHAQUE CHOSE ÉCRITE UNE FOIS (27/09 — `src/planning.js` · `scripts/mv-harnais-robustesse-planning.mjs` · `scripts/mv-harnais-recup.mjs` · `src/utils.js` · `index.html` · `public/sw.js` · **bump APP + SW**, base `3446620`)

### 192a. Le constat

Nico, relevé de septembre imprimé après RELEVE-3 (§191) : *« corrige doublon et mise en page »*. Le PDF faisait **trois pages**
(la légende des dimanches, les signatures et le pied en page 3), le tableau de l'année **mordait sur la colonne de droite**
(« 0h » et « Récup restante » par-dessus « Heures sup restantes à payer »), les blocs Contrats et Congés étaient décalés.

### 192b. ★★★ L'OUTIL QUI MANQUAIT : UN VRAI NAVIGATEUR DANS LE BAC À SABLE

§4 disait « le CDN de Playwright n'est pas joignable : aucun contrôle visuel ». **C'est vrai de Playwright, pas de Chromium.**
Le paquet npm **`@sparticuz/chromium`** embarque un Chromium compressé DANS son archive npm (registre autorisé) ; avec
`puppeteer-core`, il démarre ici. Recette (dans `/home/claude`, jamais dans le dépôt) : `npm i @sparticuz/chromium@131
puppeteer-core@23`, `executablePath: await chromium.executablePath()`, `args: chromium.args`. Un petit serveur HTTP local sur
`public/` donne les vraies polices (`/fonts/fonts.css`, le `<base href>` du relevé pointe sur l'origine). `page.pdf()` puis
`pypdfium2` → PNG → on REGARDE. Le relevé a été généré par le vrai `planning.js` chargé dans Node (patron des harnais), avec
un mois proche du cas du terrain. **C'est ainsi que les défauts ci-dessous ont été vus — et mesurés** (hauteur de chaque
`.pg`, largeur de chaque tableau contre sa colonne). ★ À réutiliser pour tout document imprimable et tout écran.

### 192c. Mise en page — quatre causes

1. **`.cl` global.** PAIE-1 avait nommé `.cl` les lignes du cadre « Pour la compta » (`display:grid; 30mm 1fr`, bordure) ;
   `_plRvContratsHtml` et `_plRvCpHtml` utilisaient déjà `.crow .cl` pour leurs libellés : la règle de PAIE-1 les mettait en
   grille. Bornée à `.cpt .cl`. **Même famille que le préfixe `mvs-` partagé (§24 CSS n°5) : un nom court se réutilise.**
2. **Deux colonnes figées** (`grid`). La gauche portait compteur, rattrapage, année, dimanches : 968 px contre ~740 à droite.
   Désormais **un flux `column-count:2`** : blocs `.bk` (et `.ctr`, `.soldean`, `.lim`) en `break-inside:avoid`, « À savoir »
   sécable entre ses points. Le navigateur équilibre, quelles que soient les données. Ordre de lecture inchangé.
3. **Signature orpheline** : « Fait le », signatures et mention regroupées dans `.fin` (`break-inside:avoid`).
4. **Page 1 — le Total pouvait sortir de la page, coupé sans rien dire** (`.pg` est à hauteur fixe, `overflow:hidden`).
   Trouvé en testant une absence partielle « décidée par le domaine » : son libellé insécable écrasait « Observations » à trois
   mots par ligne. `.j td.cab:not(.n)` passe à la ligne (min 30 mm). ⚠️ **Rien ne garantit la page 1 pour tout salarié** : un
   mois très chargé en observations peut encore déborder — à surveiller, voir 192f.

### 192d. Doublons retirés — et l'arbitrage

- **« dont … dim./férié » sous chaque mois** (CLAIR-2, modification de Nico le matin même, `f2c1d97`) = la colonne « Repos
  ajouté » du tableau des dimanches juste dessous, au chiffre près. Et c'est sa ligne insécable qui élargissait la colonne.
  **Arbitrage : on garde le tableau (heures ET repos, par mois), on retire le « dont »** — écran et papier. La légende de
  l'année renvoie au tableau qui suit, avec le total (+73h45). **Dit à Nico, réversible s'il préfère l'inverse.**
- **« Dimanche 13 : … hors heures sup » en page 2** : en mode payé, « Majorations à payer » (page 1) et la ligne du jour le
  portent. Gardé en mode récup (la page 1 n'a pas de ligne « à payer »).
- **La règle « avant septembre » écrite trois fois** : sur le papier seulement (`c.bref` de `_pfAnneeTable`), la légende ne
  redit plus la majoration reçue en septembre ni le payé sur le compteur (lignes du tableau « compteur ») ; la légende des
  dimanches ne redit plus « déjà dans la récup gagnée » ; « À savoir » ne garde que la relecture du taux et « la compta le
  confirme ». ⚠️ Une première réécriture avait dit « à confirmer avec la compta » : **le sens changeait**, rétabli.
- La conversion « 1h à 25 % = 1h15 » (deux fois), le « — » d'un contrat sans terme, les mois à venir vides.

### 192e. Mesuré / pas vérifié

Rendu réel : **3 pages → 2**, aucun tableau plus large que sa colonne, page 1 : Total visible. `mv-harnais-robustesse-planning` :
**30 vertes** (section C neuve, statique : les quatre causes et le doublon du dimanche), **7/7 contre-épreuves**.
`mv-harnais-recup` : 426 (AC6 recalée sur la légende brève — elle exigeait la phrase retirée). Contrôle complet : voir la note
de livraison. **Pas vérifié** : ton PDF réel — la page 2 de l'exemple est **pleine à quelques pixels** ; un salarié plus
chargé peut repasser à 3 pages (le flux garantit alors qu'aucun bloc ni signature n'est coupé, pas le nombre de pages).

### 192f. Ce qui reste ouvert

- Les pages imprimables ne sont mesurées par **aucun contrôle automatique** : le navigateur de 192b n'est pas dans la liste
  (paquet de 60 Mo, hors `package.json`). Piste : un harnais « hauteur de page » dans la CI, où Chromium est installable.
- ROB-2 (§28) : le tirage au hasard, module par module.

## 193. ★★★ DIM-2 — UN DIMANCHE COMPTE EN ENTIER, « POUR LA COMPTA » EN CASES 25 / 50 / 100 %, L'ANNÉE EN TROIS FAMILLES (27/09 — `src/planning.js` · `src/styles.css` · `src/utils.js` (MV_AIDE, WHATS_NEW) · `guide/10-planning.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/mv-harnais-majoration.mjs` · `scripts/mv-harnais-robustesse-planning.mjs` · **bump APP + SW**, base `3446620` — le zip porte aussi MEP-1, non poussé)

### 193a. D'où ça vient

Nico, devant son relevé de septembre : *« explique-moi heures sup à payer et majoration à payer, on parle de dimanche, d'un côté
5h30 et de l'autre 1h »*, puis *« ces feuilles ne sont pas claires pour moi »*. Le fond, obtenu en quatre échanges :
- **La compta saisit** : *salaire de base + nombre d'heures à 25 % + à 50 % + à 100 %* (100 % = payées double, un férié). Aucune case
  « majoration seule », aucune case « taux normal ».
- **Un dimanche** : *« 4h de dimanche = 6h de récup, ou payé 4h sup de dimanche à 50 % ; en cas de rattrapage, je fais quand même
  4h de dimanche, 6h de récup, et je rattrape 1h sur ces 6h »*. Le code découpait ce dimanche : 1h « de rattrapage » (majoration
  seule, 0h30) + 3h sup — même valeur (5h), mais une ligne qu'aucune case ne reçoit.
- **Un dimanche PRÉVU au planning** (le modèle de Nico en porte un sur deux, d'avril à juillet) : *« je mettais le nombre d'heures
  à 50 % — que la majoration en fait, mais je le spécifiais à l'envoi »*. La majoration seule est donc légitime, dans la case de
  son taux, avec une mention.
- **Avant septembre** : *« les dimanches et fériés, je les faisais obligatoirement payer sur le mois »* ; *« j'indiquais 30h sup à
  25 % »* ; *« ce n'est pas une généralité »* → souplesse : l'ordre de sortie est un choix du domaine (193f).
- **Législation** (vérifiée, travail-emploi.gouv.fr et fiches paie) : paiement ou repos se décide par accord collectif, à défaut par
  l'employeur (CSE non opposé) ; le salarié ne choisit pas les modalités ; **aucune règle d'ordre d'imputation entre taux**.

### 193b. Ce qui est fait — le calcul

1. **`_planHsupMois`** : un jour de dimanche/férié (`y.jm`) n'entre plus dans le pot des heures en plus qui rattrapent la semaine
   (`totP`) et n'en consomme rien (`conso=0`) : il est entièrement heure sup, à son taux. L'absence non rattrapée passe au compteur
   (1h = 1h), comme toute absence. La majoration seule (`majHs`) ne naît plus que d'un dimanche PRÉVU. Depuis septembre seulement.
2. **Mode payé, avant septembre — DIMAV-1 défait** : `_planMajAuCompteur(m) = !_planHsupPayable()`. La majoration ne s'ajoute plus en
   repos à part ; `_planEstLecture` range le « déjà majoré » par nature (`dim`, `fer`), `_pfEstPile` (mode payé) empile
   25 % → 50 % → dimanche → férié (le haut sort d'abord, TAUX-1), et `revalorise` donne au dimanche/férié encore au compteur son taux
   à la bascule. **Mode récup : inchangé** (la majoration y est un vrai repos, §73d).

### 193c. Ce qui est fait — l'affichage

- **`_pfCompta`** : la ligne « Heures à payer » = une case par taux (25, 50, 100 toujours ; un autre taux s'ajoute s'il existe).
  Chaque case : heures sup du mois + heures prises au compteur **avec leur mois d'origine** ; la majoration seule à part (`<em>`,
  « + 1h majoration seule (dimanche 11) »). Contrôle en bas : « Heures sup : a + b + c = total, à la demande du salarié ; la
  majoration seule n'est pas une heure sup… à préciser à l'envoi ». Plus de « Majorations à payer » ni d'« Autres heures » :
  ce qui n'a vraiment pas de taux (report d'avant Ma Vigne, repos de majoration en mode récup, dimanche d'avant septembre « déjà
  majoré » en mode récup) va sous **« À vérifier »**.
- **Mois figé = ce qui est parti** : cases depuis `fige.payes`, heures du compteur depuis **`fige.bank`** (nouveau champ de
  l'instantané : taux, nature, mois, heures) ; un instantané plus ancien n'a que `spill` → « Xh prises sur le compteur à l'envoi du
  JJ/MM, sans détail de taux », sous « À vérifier ». Même règle dans le tableau de l'année.
- **`_pfAnnee` / `_pfAnneeTable`** : trois familles, *faites / payées* — heures sup de semaine (avant septembre : relues, part
  dimanche/férié retirée), dimanches, fériés (toutes les heures de ces jours ; payées = parties dans leur case, majoration seule
  comprise) —, puis la récup et les heures à rattraper. Écran (`pf-scroll`) et papier (en tête de page 2, pleine largeur).
  Le tableau « Dimanches et fériés d'avant septembre » ne reste qu'en mode récup.
- **Relevé** : la page 1 s'allonge au lieu de couper (`.pg1{height:auto}`) — **défaut préexistant** : le relevé de septembre d'un
  salarié réel perdait ses derniers jours ET la ligne Total ; « Page 1 sur 2 » (faux dès qu'un mois déborde) devient « Le mois,
  jour par jour » / « Le compteur et l'année » ; « À savoir » dit l'exception du dimanche et perd le point « avant septembre »
  (redit par la légende). Rendu réel (Chromium, §192b) sur les 7 salariés actifs : 2 feuilles, 3 pour le mois le plus chargé.

### 193d. ★★★ Mesuré sur la sauvegarde réelle du domaine de référence — et ce qu'il faut savoir

Avant/après (script hors dépôt, vrai `planning.js`, rubrique `paie` NON lue) : un salarié passe de **51h45 à 0h** de récup fin
septembre, un autre de 38h à 27h45 ; trois ne bougent pas. Cause : DIMAV-1 avait ajouté en repos la majoration de dimanches **déjà
payés dans le mois**. Conséquence : sur les 24h30 prises au compteur à l'envoi du 25/09, **12h36 n'ont plus d'heures derrière** ;
le mois étant figé, elles passent « à retenir » sur octobre (FIGE-1). **Décision de Nico (27/09) : on laisse la reprise en
octobre.** ⚠️ Autre salarié : son absence restante de septembre passe de 20h30 à 24h (figé, l'écart va sur octobre).
★ **Leçon** : *« je les payais dans le mois »* ne se déduit d'aucune donnée — les paiements d'avant septembre n'ont pas de nature.
Deux lectures possibles (les « payées » comprenaient ou non la majoration seule) donnaient **0h** ou **≈ 91h40** de récup : seule la
question à Nico a tranché. Une règle métier sur l'historique se vérifie auprès de celui qui l'a vécu, jamais par le calcul seul.
★ **Erreur de Claude, reconnue** : il avait affirmé que la sauvegarde ne contenait pas les salaires ; elle contient `paie`.

### 193d bis. DIM-2 bis, retiré — puis DIM-3 : le réglage « toujours des heures sup »

Nico, sur l'aperçu livré : *« où sont passées toutes les heures de dimanche et de jour férié ? »* (avril–juillet : « faites »,
rien en face). Claude a d'abord supposé qu'elles étaient **payées dans le mois comme majoration seule** et l'a affiché (DIM-2 bis).
**Faux** : *« avant, je comptais mes heures de dimanche et de férié DANS les heures sup, je ne les ajoutais pas ; je dois encore
pouvoir les décompter »*, et *« il n'y a rien à coder en dur depuis mon planning, ce n'est pas une généralité »*.
La cause réelle : le modèle de planning de ce salarié porte des dimanches (10h un sur deux, avril–juillet) **sans saisie** ; la règle
générale « dimanche prévu = journée normale + majoration seule » les excluait des heures sup. La règle n'était pas codée d'après ce
planning — elle s'y appliquait à tort, faute de réglage.

**DIM-3** : `CONFIG.dimfer_hs` — `'planning'` (défaut, inchangé pour les autres domaines) ou `'toujours'` (roue crantée du Planning,
bloc « Dimanches et jours fériés travaillés », `planSetDimFer`). En « toujours » :
- depuis septembre, `_planHsupMois` : toutes les heures travaillées d'un dimanche/férié sont « en plus » (`bp = jm.h`), un dimanche
  prévu non travaillé ne manque pas (`bm = 0`) → heures sup à leur taux, jamais de majoration seule ;
- avant septembre, `_planSupCalc` (règle du mois) : dimanches et fériés sortent de l'écart du mois (`_planDfMois` : prévu, fait),
  puis toutes leurs heures faites s'ajoutent aux heures sup ;
- **avant septembre, le paiement saisi se relit comme un total** (`_planCompteur`, `bankAv`) : l'ancien partage « du mois / au
  compteur » suivait des heures sup qui ne comptaient pas les dimanches prévus ; avec eux, les heures du mois passent d'abord,
  taux le plus fort en tête (la pile, `_pfEstPile`). Sans cette relecture, les paiements d'avril–juillet vidaient janvier.
Mesuré (sauvegarde réelle, réglage « toujours » simulé) : la récup fin septembre du salarié concerné est **109h45** (en ligne : 51h45 ;
avec DIM-2 seul : 0h) ; ses 24h30 prises au compteur le 25/09 sont couvertes — **plus rien à retenir en octobre pour lui**. Deux
autres salariés gardent un petit écart couvert à tort à l'envoi (0h45 et 4h20) : la majoration de dimanche en repos qui les
couvrait (DIMAV-1) n'existe plus en mode payé → à retenir sur octobre. Les trois autres ne bougent pas.
⚠️ **À signaler à la compta** : les paiements d'avant septembre étaient déclarés « à 25 % » ; la relecture fait sortir d'abord les
heures de dimanche (+50 %) et de férié (+100 %) de chaque mois. L'écart de majoration éventuel se règle avec la compta, pas par
l'application.
★ **Leçons** : (1) une information retirée d'un calcul (DIMAV-1) peut disparaître d'un écran — relire chaque tableau qui la
montrait ; (2) **ne jamais supposer une pratique de paie** : trois hypothèses successives de Claude étaient fausses, chaque fois
la question à Nico a tranché ; (3) une règle générale qui se trompe sur un client appelle un **réglage**, pas une exception.

### 193e. Mesuré / pas vérifié

`mv-harnais-recup` : **428** vertes, **87/87** défauts détectés (onze contre-épreuves réancrées, deux neuves : le dimanche qui
rattrape de nouveau, « À savoir » sans l'exception). `mv-harnais-semaine` vert (trois septembres réels recalés sur DIM-2, valeurs
vérifiées à la main). `mv-harnais-majoration` 34. `mv-harnais-robustesse-planning` : 31 vertes, 8/8 contre-épreuves (scénario A
passé en dimanche PRÉVU, A12 : un mois figé montre ce qui est parti). Contrôle complet : voir la note de livraison.
**Pas vérifié** : le rendu à l'écran de la fiche (le tableau à douze colonnes défile dans `pf-scroll` : à regarder sur téléphone).

### 193f. Ce qui reste ouvert

- **DIM-4 — l'ordre de sortie, choix du domaine** (Nico : *« prendre d'abord le taux le plus élevé, ou laisser le choix lors de la demande »*).
  Aujourd'hui : le plus élevé d'abord, partout. À faire : un réglage (défaut : le plus élevé), et éventuellement le choix de
  l'employeur au moment de la demande — la loi ne donne pas ce choix au salarié.
- Le tableau « compteur de récup » d'un mois figé reste le calcul vivant (« Payées sur le compteur, 11h54 à déclarer » alors que
  24h30 sont parties) : le report sur le mois suivant est dit par la carte « Envoi à la compta ». À clarifier sur le papier.

## 194. ★★★ REV-1 — ÉCONOMIE › REVIENT : RENDEMENT, BOUTEILLES ET COÛT VIGNE DU MILLÉSIME (28/09 — `src/pilotage.js` · `src/reglages.js` · `src/utils.js` (MV_INFO ×4, MV_AIDE, WHATS_NEW) · `guide/11-pilotage.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-revient.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-cave-mil.mjs` · **bump APP + SW**, base `d42cdbe`)

> Nico : *« que penses-tu de mettre les rendements et bouteilles probables dans Économie, avec un calcul de coût de revient
> probable (mais on n'a que le coût vigne) ; il faut que l'expérience soit simple, bien rangée »*. Proposition → maquette
> `maquette-eco-revient-v1.html` (trois états de vendange, réglages vivants) → *« go avec les recommandations »*.

### 194a. L'inventaire : la chose existait, fausse de trois façons

Économie › Synthèse portait déjà une carte « Prix de revient » (coût/ha, /kg, /bouteille). Trois défauts, **mesurés dans le code** :
① `_pecData` cadre sur la **période consultée** : zoomé sur « Vendanges », dix jours de coût divisés par toute la récolte — la
faute corrigée le 12/08 sur « Deux façons de compter », jamais corrigée ici ; ② `_pecKgB` = **1,3 kg/col** quand la Cave compte au
kg/hL du Cuvier (`_mlKgHl`, 135 kg/hL ≈ 1,01 kg/col) : **~28 % de bouteilles en moins**. Son commentaire disait « 1,3 kg/col ≈
130 kg pour 1 hL » — faux (130 kg/hL = 0,98 kg/col) ; ③ avant vendange, `_pecRecolte` prenait la récolte de l'an passé avec les
coûts de cette année.

### 194b. ⚠️ Une affirmation fausse, la mienne

J'ai écrit à Nico, en proposant le lot, que le moteur de l'année vigne « existait déjà (celui de Deux façons de compter) ».
**Faux** : `_pilDeuxCadresHtml` ne compte que des **heures de barème** pour le cycle ; les euros de sa cellule sont ceux de
l'exercice. **Aucun moteur ne chiffrait un cycle en euros.** Repéré en écrivant le code, dit à Nico dans la réponse suivante.
**C'est le corollaire du 11/08 : un constat que j'énonce se mesure comme les autres.**

### 194c. L'arbitrage : rejouer l'engagé sur les dates du cycle

Écartés : faire tourner `_pecData` pour chaque campagne du cycle en substituant `window._visuSaison` (les défs de tâches et les
validations suivent la saison visualisée : un calcul faux en silence) ; `_pexData` sur la fenêtre (masse salariale de TOUT le
domaine, cave et bureau compris — ce n'est plus un coût vigne). **Retenu** : les quatre moteurs DATÉS de l'engagé —
`_ecoTempsVigne` (qui prend désormais une fenêtre `win`, même patron que `_ecoTracHByParc(win)`), `_ecoTracHByParc`,
`_ecoGnrReel`, `_ecoPhytoByParc` — rejoués sur le cycle, + la main-d'œuvre **prévue** au planning jusqu'à la fin de vendange
quand elle est à venir (`_pecRevPrevuMO`, même population que TV-1). ⚠️ `guard<400` de `_ecoTempsVigne` passé à **800** : un
cycle peut dépasser 400 jours, et la boucle se serait tronquée **sans rien dire**.

**Le cycle** (`_pecRevCycle`) : début = lendemain de la dernière récolte M-1, sinon un an avant la fin (`src0:'an'`, dit à
l'écran) ; fin = dernière récolte si tout est rentré ou millésime passé, sinon la fin de vendange des fenêtres de tâches
(`_pilAnnuelData().vend`), sinon aujourd'hui. **La récolte datée est le seul signal sûr d'une fin de vendange.**

### 194d. Les règles du calcul (`_pecRevCalc`, PUR)

- **Escalier du rendement** : récolté (`_mlRendements`, la source de la Cave) → moyenne de ses millésimes connus (jusqu'à trois ;
  Cave, sinon `rendement_hist`) → moyenne constatée cette année dans l'appellation → rien. **Jamais le plafond.**
- Une parcelle **sans estimation** sort des bouteilles ET du coût (sinon son coût gonfle le prix des autres).
- **Raisin vendu** : hL/ha sur la parcelle entière (réglementaire, comme la Cave), bouteilles = part du domaine, coût au prorata
  des kilos (`_pecRevRec`). VD-3 disait « le domaine travaille toute la vigne » : vrai pour le rendement, pas pour le prix d'une
  bouteille qui n'emporte pas le raisin vendu.
- **Conversion unique** : hL × (1 − pertes) × 133,3. Pertes = part des anges **mesurée** sur le dernier millésime entièrement
  embouteillé (`_pecRevPertesMes`, écartée hors [0 ; 40 %]), sinon le réglage `CONFIG.eco.pertes_elevage` (5 %).
- **Par appellation** (`_vendAocDe`, sinon `p.appellation`) : Σ coût ÷ Σ bouteilles.
- `CONFIG.eco.autres_charges` (facultatif, 0 = aucun) → **coût complet indicatif**, jamais présenté comme un calcul comptable.

### 194e. L'écran

Sous-vue `rev` entre Parcelles et Achats (`_PEC_SUBS`, état mémorisé accepté). Quatre cartes : le millésime (puces des années qui
ont une récolte, cadre du cycle, trois chiffres « probable / constaté / projeté ») · par appellation (ligne qui se déplie en
parcelles **sans re-rendu**, source de chaque rendement) · du raisin à la bouteille · le coût par poste + « pas compté ici ».
La Synthèse garde une porte (première cellule de « Prix de revient ») et les coûts qui ne dépendent pas de la récolte.
`_pilAvertEco` a une branche `rev` (cadre propre). `_pilOuvrirCave(sec)` prend une section (défaut Aujourd'hui).
Téléphone : Surface et Plafond cachés sous 640 px, « € / col » — sans ça, le prix sortait de l'écran.

### 194f. Ce que les contrôles ont trouvé en route

Six rouges au premier `npm run check`, aucun ne venait du calcul : un emoji neuf (`_PEC_HYPO` accepte désormais `ic:` → `_mvIcon`),
un « ⚠️ » dans une fiche, ①②③ hors du subset des polices, une ombre sans repli, des pastilles orange/bleu sous 4,5 de contraste
(→ `--tag-amber-*`, `--tag-blue-*`), une clé MV_INFO à trois niveaux (`pil.eco.rev.rdt` → `pil.eco.revrdt`). Et **une
collision d'ancre** : `_pecRevPrevuMO` recopiait mot pour mot `Number(window._mvPaieTauxEffAt(m,d))||0`, ancre de mutation de
`mv-harnais-temps-vigne --contre` — devenue double, la contre-épreuve refusait de tourner. **Écrire du code neuf peut désarmer
un harnais existant sans toucher à ce qu'il teste.** `mv-harnais-cave-mil` lisait le texte exact de `_pilOuvrirCave` : assertion
réécrite sur le défaut.

`mv-harnais-revient` : **26 assertions** (escalier, conversion, vendu, appellation, états, part du domaine, cycle, câblage, aide),
**10 contre-épreuves sur 10**. D3 était vert sur code abîmé tant que l'essai n'avait pas de raisin vendu : corrigé.
Rendu regardé dans Chromium (bureau, téléphone, sombre) sur données d'essai — **pas sur les vraies** (§28, REV-1).

---

## 195. ★★ RET-G — UN SEUL RETOUR CLIENT POUR PLUSIEURS LIVRAISONS (28/09 — `src/cuvier.js` · `src/utils.js` (MV_AIDE, WHATS_NEW) · `guide/08-cave.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-vendange-parts.mjs` · `scripts/mv-harnais-revient.mjs` · **bump APP + SW**, base `3abe175`)

### 195a. D'où ça vient

Nico, capture de la fiche d'un acheteur (deux livraisons « retour attendu », 29/08 et 28/08) : *« ici le client m'envoie un récap
en jus de la totalité, donc il faut que je puisse mettre sur la totalité de ce qui a été récolté. Donne la possibilité de joindre
plusieurs récoltes même si le jour est différent pour un même client. »* VD-2 (§62a) avait posé l'unité = le **chargement**
(client + date) : un retour ne pouvait couvrir qu'un jour.

### 195b. Ce qui est fait

- **Un bouton dans les livraisons du client** (dès deux livraisons) : *Un seul retour pour plusieurs livraisons* → une feuille de
  cases (`openVendRetGroupe`) — cochées d'office : celles qui attendent leur retour. Puis la feuille de saisie **habituelle**, sur
  toutes les lignes des livraisons cochées (`_vendRetOpen(ci, lis)`), la date à côté de la parcelle.
- **La répartition est celle de VD-2**, `_vendRetProrata`, rejouée sur toutes les lignes : la dernière reçoit le reste, aucun litre
  inventé. La case « détaillé ligne par ligne » reste possible.
- **`retour.grp`** sur chaque part couverte. C'est ce qui fait qu'une livraison groupée **se rouvre avec tout son groupe**
  (`_vendGrpLis`), que cocher l'une coche les autres, et que « Effacer » efface le groupe. ⚠️ Arbitrage : on ne découpe jamais un
  total déjà réparti — rouvrir une seule livraison laisserait les autres porter la répartition d'un total qui n'est plus le bon.
- **Un millésime par retour** (refus en toast) : `_vendLivs` ne filtre pas l'année (voir 195d).
- L'écriture est sortie dans **`_vendRetEcrit`** (pure, testable), appelée par `_vendRetSave`. Le bon et le récap écrivent, quand
  un groupe est présent, que *le client a donné un volume global pour plusieurs livraisons, réparti au prorata des kilos*.
- Rien ne change pour le rendement : `_vendVolPart` lit toujours `part.retour`, marqué `prorata`.

### 195c. ★★ Deux défauts trouvés en chemin

1. **Le retour d'une récolte d'avant VD-1 était perdu.** `_vendParts(r)` fabrique une part NEUVE à chaque appel pour une récolte
   sans `parts[]`. `_vendRetSave` faisait `rec.parts=_vendParts(rec)` : il rangeait une part neuve et laissait le retour (et la
   correction de caisses) sur l'ancienne. Corrigé : `rec.parts=[x.part]`. Contre-épreuve dédiée.
2. **Effacer un retour ne prévenait pas la parcelle** — le même défaut que CUV-5 (§82d) sur `_vendRetSave`, resté sur
   `_vendRetClear` : `rendement_hist` gardait le volume effacé. Il repasse désormais par `_vendRecordRendement` dans `_vendParcLot`.

### 195d. Mesuré, et ce qui reste ouvert

- `mv-harnais-vendange-parts.mjs` : **149 assertions** vertes ; trois contre-épreuves neuves (groupe rouvert seul, `grp` non écrit,
  part de migration refabriquée) — la contre-épreuve rougit sur chacune (12 rouges au total).
- ⚠️ **`mv-harnais-revient.mjs` (G7) exigeait que `WHATS_NEW` S'OUVRE sur 7.76** : le bump suivant, n'importe lequel, le
  rougissait. Il cherche maintenant le bloc 7.76, où qu'il soit. *Un harnais de lot vérifie que son annonce existe, pas qu'elle
  reste la dernière.*
- ⚠️ **Collision évitée** : REV-1 (§194) a été poussé pendant ce lot avec APP 7.76 / SW 8.45 — les numéros que ce lot avait pris.
  Re-mesuré avant livraison (`git fetch`), patchs rejoués sur `3abe175`, numéros relevés à 7.77 / 8.46.
- **Non vérifié à l'œil** : la feuille de cases et la saisie groupée sur téléphone (aucun navigateur lancé pour ce lot).
- ⚠️ **Ouvert** : `_vendLivs(nom)` ne filtre pas le millésime — le « Récap de campagne » d'un client suivi deux ans mêle les deux
  campagnes (en-tête « Millésime » pris sur la première ligne). À trancher avec Nico : un sélecteur d'année dans la fiche client.


## 196. ★★ ARRACH-1 — ARRACHER UNE PARCELLE DEPUIS SA FICHE, RÉSERVÉ À L'ADMIN (29/09 — `src/app.js` · `src/utils.js` (WHATS_NEW) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `public/guide.html` · `scripts/mv-harnais-arrachage.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 7.77 → 7.78, SW 8.50 → 8.51**)

### 196a. D'où ça vient

Nico : *« On arrache des vignes, comment le noter sur l'appli ? »* Inventaire sur le dépôt : `statut:'Arrachee'` (sans accent) était lu
partout (surfaces, avancement, planning, registre phyto, filtre « Arrachées ») mais **aucun écran ne le posait** — seule la console
GT (`admin-gt.js`) ou Firestore à la main. ⚠️ Le guide (`guide/04-vigne.html`) disait pourtant « passez son statut à Arrachée dans
sa fiche » : il décrivait un bouton qui n'existait pas. Nico a tranché : **arracher = admin seulement** ; le reste de la proposition
(date, motif, note, jamais de suppression, remise en exploitation) est validé.

### 196b. Ce qui est fait

- **`_dpFillArrach(p)`**, appelée par `openDP` : bouton « Arracher cette parcelle… » si `isAdmin()` **et** saison consultée = saison
  active (`_mvOnActiveSaison`). Sur une parcelle arrachée : carte d'information (date, motif, note) pour tous ; « Remettre en
  exploitation » (deux appuis) pour l'admin seul.
- **`openDPArrachage` / `saveArrachage`** : feuille `ovArrachage` (date ≤ aujourd'hui, motif parmi cinq, note ≤ 300 caractères),
  avertissement s'il reste des travaux « En cours » sur la parcelle. Garde `isAdmin()` **dans la fonction d'écriture**, pas seulement
  dans l'affichage du bouton.
- **On ne supprime JAMAIS la parcelle** : `p.nom` est la clé du journal, des sessions et des traitements. On pose `statut:'Arrachee'`,
  `dateArrachage`, `motifArrachage`, `noteArrachage`, `arracheePar` et **`statutAvantArrachage`** (pour la remise en exploitation).
- **`remettreParcelleEnExploitation`** : rétablit le statut d'avant (ou `Active`) et **purge** les cinq champs.
- Après écriture : `recalcTravaux` sur toutes les tâches, `saveData('parcelles')` (qui recalcule `SURF_TOTALE`), `renderParcelles`,
  `computePStats`, `renderHomeCard`, fiche rouverte.
- « Arrachée » s'écrit avec l'accent dans le sous-titre de la fiche (`dp-sub` affichait `Arrachee`).

### 196c. Mesuré

- `mv-harnais-arrachage.mjs` : **21 assertions** vertes, exécutées sur les **vraies fonctions** extraites de `app.js` (commentaires
  retirés) ; **neuf contre-épreuves** (garde admin retirée sur l'écriture, bouton offert à tous, statut avec accent, date future
  acceptée, parcelle supprimée, pas de sauvegarde, remise sans purge, motif non échappé, remise ouverte aux non-admins) — toutes rougissent.
- ⚠️ Deux cliquets du projet ont rougi **à cause de ce lot** et ont été corrigés, pas contournés : `mv-harnais-typo` (des `font-size`
  en px écrits en dur → variables `--pt-*`) et `mv-harnais-contraste` (texte blanc sur `--rouge` illisible en thème sombre →
  `--rouge-pale` + `--rouge-tx`). *Un bouton rouge se construit avec les jetons du thème, pas avec `white` sur `--rouge`.*
- ⚠️ Le contrôle de cohérence des portes exige de **nommer chaque script de `scripts/` dans la doc** : d'où ce paragraphe.
- **Non vérifié à l'œil** : aucun navigateur lancé (Chromium non installable dans le bac à sable de rédaction) — la feuille et la
  fiche sur téléphone, les deux thèmes. `npm run test:e2e` non joué.
- **Ouvert** : les traitements et le journal d'une parcelle arrachée restent intacts (voulu) ; aucune règle Firestore ne distingue
  encore « admin » pour cette écriture côté serveur — la restriction est portée par l'interface et par `isAdmin()`, comme pour le
  cépage (`saveDPCepage`).

## 197. ★★ PARC-XLS — LE FICHIER EXCEL DES PARCELLES SE TRIE, ET PORTE LE RENDEMENT EN hL/ha (30/09 — `src/reglages.js` · `src/utils.js` (MV_AIDE, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/12-reglages.html` · `guide/13-donnees.html` · `scripts/mv-harnais-parc-xls.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.78 → 7.79, SW 8.52 → 8.53**, base `2ea6440`)

### 197a. D'où ça vient

Nico : *« Il faut pouvoir faire l'excel des parcelles, possibilité de trier par nom, du + au - et du - au + pour les rendements
en HL/Ha. »* Inventaire : le fichier existait (« Avancement par parcelle », `exportCSVParcelles`, Données brutes), figé A → Z
depuis TRI-2 (§120, « un ordre stable, posé sans question »), et **sans aucun rendement**. §119 l'avait listé parmi les
documents à brancher sur la feuille de tri ; ce lot le fait.

### 197b. Ce qui est fait

- `exportCSVParcelles(c)` : **sans argument**, ouvre `_mvTriOuvrir` (millésimes = `_vendRecAnnees`, clés `nom` et `rendement`,
  mémo `csvParcelles`) ; la feuille rappelle la fonction avec le choix. **Sans feuille** (utils.js en retard) : A → Z sur le
  millésime le plus récent. **Sans aucune récolte** : seule la clé `nom`, aucune colonne de rendement.
- Colonnes neuves : `Kilos <mil>`, `Rendement <mil> (hL/ha)`, `… : mesuré ou estimé`, `Fourchette <mil> (hL/ha)`.
- ★ **Source unique : `_mlRendements(mil)`** — le hL/ha de l'écran Le millésime et de la carte du Pilotage. Rien n'est recalculé
  dans `reglages.js`. La colonne porte `hlHa` (la meilleure valeur, celle qui trie) ; §63b oblige à dire à côté qu'un chiffre
  `partiel` / `estime` n'est pas une mesure, d'où les deux colonnes de fiabilité.
- ⚠️ **Absence en fin dans les deux sens** (même règle que `_vgnTrier`) : cases vides, pas des zéros.
- Tout tient **dans la fonction** : `mv-harnais-tri2` l'extrait seule (`bloc`) et l'appelle sans feuille — une table de clés ou un
  helper à côté l'aurait cassé.
- Hub : ligne renommée « Parcelles — fichier Excel », `ask:'Millésime, puis tri'`, `ov:true` (le hub se ferme sous la feuille,
  comme l'état du vignoble et les récoltes).

### 197c. Mesuré

- `mv-harnais-parc-xls.mjs` : **27 vertes** (feuille, deux sens par nom, deux sens par rendement, absence en fin, colonnes,
  mesuré/partiel/estimé, millésime changé, trois replis) dont **4 contre-épreuves** qui rougissent (absence comptée zéro, sens
  ignoré, estimation écrite « mesuré », feuille court-circuitée). `mv-harnais-tri2` reste vert (40).
- ⚠️ Une assertion a rougi, et **c'était le test** : sans récolte, un choix « rendement, décroissant » retombe sur le nom **en
  gardant le sens** (Z → A) — exactement ce que `_mvTriOuvrir` affiche quand il retombe sur la première clé valable.
- **Non vérifié à l'œil** : la feuille sur téléphone, l'ouverture du fichier dans Excel FR (point-virgule + BOM, inchangés).

### 197d. Ouvert

- `_mlRendements` écarte toujours en silence une récolte dont le nom de parcelle n'est pas apparié (§90i) : la parcelle sort
  alors **sans rendement** dans le fichier, sans ligne qui le dise.
- Le plafond d'appellation (`o.max`) n'est pas dans le fichier : non demandé. À ajouter si Nico veut comparer au plafond dans
  son tableur.

## 198. ★★★ PAR-1 — LA JOURNÉE SE PARTAGE ENTRE TOUTES LES PARCELLES VALIDÉES CE JOUR-LÀ, AU PRORATA DU BARÈME (30/09 — `src/pilotage.js` · `src/utils.js` (MV_INFO ×2, WHATS_NEW) · `guide/11-pilotage.html` · `index.html` · `public/sw.js` · `scripts/mv-harnais-temps-vigne.mjs` · **bump commun avec ÉQUIPES-1 (§199) : APP 7.79 → 7.80, SW 8.53 → 8.54**, base `8905702`)

### 198a. Le constat

Capture d'Économie › Parcelles (dégrafage, 12 % fait partout) : le total tenait (7 133 € payés pour 6 353 € au barème, +12 %),
mais les écarts allaient **par séries identiques au dixième** — −90,2 % sur neuf petites parcelles (7 à 17 € de dégrafage chacune),
+297,4 % sur sept autres, ±49 %, +32 %, +83 %. Un même pourcentage sur une série = une validation commune.
Cause lue dans `_ecoTempsVigne` : les heures d'un salarié n'allaient qu'aux validations où il était **nommé** (`qui` ou
`membresEquipe`). Nico valide souvent pour l'équipe : groupe non coché → seules SES heures allaient aux parcelles du jour, celles de
l'équipe s'accumulaient jusqu'à sa prochaine validation nommée, qui ramassait tout.

### 198b. L'arbitrage

Premier jet de Claude : griser les parcelles « validées en lot ». **Refusé net par Nico** : *« si je valide quatre parcelles
aujourd'hui, les quatre on les étale sur la journée au prorata du barème… bien sûr qu'on veut afficher les écarts »*.
★ La règle demandée au §172a était déjà une règle de JOURNÉE (« le nombre de vignes validées en une journée ») ; le report par
personne nommée était la lecture de Claude, pas celle de Nico.
Règle retenue, par salarié et par jour :
1. **nommé** sur des validations du jour → ses heures (et son report) vont à ces validations (règle du groupe, TV-1 — deux équipes
   cochées le même jour gardent chacune leurs parcelles) ;
2. **pas nommé**, mais le domaine a validé ce jour-là → ses heures vont à **toutes** les validations du jour (`evJour`) ;
3. **décoché** ce jour-là (`quiHors`, relevé par `e.hors`), ou **aucune** validation ce jour-là → report, comme avant.
Partage au prorata du **barème** de la clôture (`e.b`, calculé une fois par `_ecoTvBar`) au lieu de la surface : identique pour un
même travail, juste pour des travaux mêlés. Une revalidation (`dup`, barème 0) ne prend rien à côté d'une vraie clôture ; seule ce
jour-là, repli surface (les heures ne se perdent jamais).
⚠️ **Limite assumée** : quelqu'un qui passe plusieurs jours seul sur une parcelle non finie, pendant que d'autres valident, voit ses
jours partir sur les parcelles des autres. C'est la contrepartie de la règle de Nico ; à revoir s'il le signale.
Le tableau Parcelles, Coût par travail, Temps réel contre barème et le Revient lisent le même moteur : tous suivent.

### 198c. Mesuré

`mv-harnais-temps-vigne` : **79 assertions, 28 contre-épreuves** (avant : 69 / 24), toutes les anciennes vertes sans retouche.
Neuves : P1-P3 (équipe non cochée, veille reportée sur la journée validée), P4-P5 (taille + relevage le même jour : 15/40 et 25/40),
P6-P7 (deux équipes cochées), P8-P10 (revalidation du même jour, invariant). Contre-épreuves : prorata surface, journée du domaine
retirée, décoché dans la journée, revalidation qui prend sa part ; « la validation vaut pour le seul validateur » ne rougissait plus
(le pool couvrait l'oubli) — c'est P6 qui la tient désormais.
**Non mesuré** : aucune donnée réelle (pas d'accès), aucun rendu regardé. Signe attendu chez Nico : les séries −90 % / +297 %
disparaissent, le total MO du tableau ne bouge presque pas (seules les heures en attente peuvent baisser).

## 199. ★★★ ÉQUIPES-1 — LES ÉQUIPES DU JOUR, POSÉES PAR L'ADMIN DEPUIS L'ACCUEIL (30/09 — `src/app.js` · `src/utils.js` (lecteur, MV_AIDE, MV_INFO, WHATS_NEW) · `src/pilotage.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-equipes-jour.mjs` (neuf) · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 7.79 → 7.80, SW 8.53 → 8.54**, base `8905702` + PAR-1)

### 199a. D'où ça vient

La limite de PAR-1 (§198b) : quelqu'un seul plusieurs jours sur une parcelle pendant que d'autres valident voyait ses jours partir
sur leurs parcelles. Deux pistes écartées par Nico : **« Démarrer » obligatoire** (*« je ne veux pas qu'ils aient à appuyer sur
démarrer… il faut juste qu'ils aient à valider »*) ; **équipes fixes dans Réglages** (*« les équipes changent souvent »*). Retenu :
*« un réglage rapide, équipe du jour, depuis l'accueil… si j'indique rien, on continue comme maintenant ; si j'indique des
équipes, on force »*. Découvert en route : la « barre d'équipe de la tâche » (`_eqtFor`) existait, mais **par téléphone**
(localStorage), choisie par chacun, modifiable — rien que l'admin puisse imposer.

### 199b. Ce qui est fait

- **Donnée** : `CONFIG.equipes_jour = { 'AAAA-MM-JJ': [ {m:[noms]}, … ] }` — des objets, pas des tableaux de tableaux (Firestore les
  refuse ; `_fsNoNestedArrays` les aurait convertis en objets indexés illisibles par le lecteur). `config` est admin-only en
  écriture (firestore.rules, inchangé) et lisible par tous les membres. Deux ans gardés (le coût relit le cycle du millésime).
- **Lecteur partagé** (`utils.js`) : `_mvEqJour(iso)`, `_mvEqDe(nom, iso)`, sur `window` pour `pilotage.js`. Équipe vide ignorée.
- **Accueil** : ligne « Équipes du jour » sous la priorité (dans le bloc `priorite`, pour ne pas créer de nouveau bloc de
  disposition), `_mvEqJourRender`. Admin : touche → `ovEqJour`, chaque salarié (hors bureau) sur Aucune / Équipe 1-3.
  Salarié : voit **sa** seule équipe, lecture seule.
- **Saisie** : `_mvEqApplique(e)` sur les **sept** `JOURNAL.unshift` (panneau, journal, niveaux, passages, appui, Démarrer ×2).
  Salarié dans une équipe : groupe **forcé** (et `quiHors` retiré). Admin : son équipe si aucun groupe choisi, sa correction sinon.
  `_mvEqUi(prefix)` dans les quatre panneaux : salarié → choix du groupe caché, note « Équipe du jour » ; admin → pré-coché.
  `_eqtFor` lit l'équipe du jour d'abord (appui rapide, journal) ; `_eqtHors` faux un jour où l'admin est dans une équipe ;
  `openPTeamJour` refuse au salarié, renvoie l'admin sur le réglage du jour.
- **Calcul** (`_ecoTvEvents`, `_ecoTempsVigne`) : un jour d'équipes, **pas de journée du domaine** (`eqJour[d]`) ; une validation
  sans groupe (hors réseau, ou d'avant la saisie forcée) prend l'équipe du jour de son auteur ; un groupe écrit l'emporte.

### 199c. Mesuré

`mv-harnais-equipes-jour` (neuf, aux portes via `mv-harnais-liste`) : **27 assertions, 8 contre-épreuves** — fonctions réelles
exécutées (forçage salarié, correction admin, seul dans son équipe, date sans équipes, écriture en objets, purge, effacement,
salarié qui ne peut pas enregistrer) et branchements (sept écritures, quatre panneaux, Accueil, barre, gestes exposés).
`mv-harnais-temps-vigne` : **84 assertions, 30 contre-épreuves** (Q1-Q5 : Alicia seule garde ses jours, validation sans groupe,
groupe écrit). **Non vérifié** : aucun rendu regardé (la ligne de l'Accueil, le panneau sur téléphone, les deux thèmes), aucune
donnée réelle. ⚠️ Un téléphone qui n'a pas encore reçu le réglage écrit sans groupe forcé : c'est le calcul qui rattrape.
**Ouvert** : `_ecoEquipeByParc` (taux pondéré de la parcelle) lit toujours le seul groupe écrit ; plus de trois équipes : non prévu.

## 200. ★ PARC-XLS-2 — LE FICHIER EXCEL DES PARCELLES AUSSI DANS LA ROUE DE LA CAVE (30/09 — `src/cave.js` · `src/utils.js` (MV_AIDE cave, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `guide/04-vigne.html` · `scripts/mv-harnais-parc-xls.mjs` · **bump APP 7.80 → 7.81, SW 8.54 → 8.55**, base `aa2baea`)

### 200a. D'où ça vient

Nico, juste après PARC-XLS (§197) : *« il faut mettre ça aussi en cave avec les récoltes »*. Lu comme : le fichier Excel des
parcelles (tri par nom / par rendement hL/ha) doit être proposé dans la roue de la Cave, à côté des « Récoltes de la vendange ».
⚠️ Lecture à confirmer par Nico : si la demande visait plutôt un tri en hL/ha **dans le PDF des récoltes** (qui trie déjà par
rendement, mais en kg/ha), c'est un autre lot.

### 200b. Ce qui est fait

- `_caveRegDocs` (cave.js) prend l'entrée `csvParcelles` du catalogue et la range **juste après `recoltes`** ; sans `recoltes`
  dans le catalogue, en fin de liste. **Même entrée, même index, même `docsGo(i)`** : aucun second document, aucune copie du
  titre (le harnais `mv-harnais-cave-reglages` interdit de recopier un titre dans cave.js). `mod` reste `vigne` : un domaine sans
  module Vigne voit la ligne grisée, comme toute ligne hors formule.
- Icône `liste` ajoutée à `_CREG_DOC_ICO`.
- ⚠️ Trouvé en route : la note du guide Cave annonçait **« Quatre documents »** dans la roue alors que MV_AIDE en comptait sept.
  Réécrite avec la liste réelle (huit avec le fichier), règle d'or n°4.

### 200c. Mesuré

- `mv-harnais-parc-xls.mjs` : **34 vertes** (+5 : position après les récoltes, même index, journal resté dans la Vigne, repli en
  fin de liste, catalogue sans fichier = liste d'avant) ; **6 contre-épreuves** (+2 : fichier poussé en fin de liste, filtre de la
  Cave inchangé). `mv-harnais-cave-reglages` : 39/39 et 45/45 en `--contre`, inchangés.
- **Non vérifié à l'œil** : la roue de la Cave sur téléphone.

## 201. ★★ RDT-XLS — QUATRE RETOURS DE FIN DE VENDANGE : LE hL/ha À ZÉRO, LES RÉCOLTES EN hL/ha, LES ABSENTS DU PLANNING, LES APERÇUS ÉCRASÉS (02/10 — `src/cuvier.js` · `src/planning.js` · `src/utils.js` (`_mvDocOpen`, MV_AIDE ×2, WHATS_NEW) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `guide/10-planning.html` · `scripts/mv-harnais-vendange-parts.mjs` · `scripts/mv-harnais-tri1.mjs` · `scripts/mv-harnais-effectif-periode.mjs` · **bump APP 7.81 → 7.82, SW 8.55 → 8.56**, base `ff00c76`)

### 201a. D'où ça vient

Quatre captures de Nico, une phrase chacune : les inactifs sont encore sur le planning imprimé (« si je l'imprime
aujourd'hui je veux qu'apparaissent les personnes prévues en contrat ») ; les rendements sont à mettre en hL/ha ; il reste des
problèmes d'affichage ; des colonnes sont à 0 alors que l'information existe.

### 201b. Le hL/ha à zéro — un nombre comparé strictement à une chaîne

- `exportCSVParcelles` (PARC-XLS, §197) passe le millésime **en chaîne** (`'2026'`, tiré de `_vendRecAnnees`). `_mlRendements`
  filtre les récoltes avec `String(...)===String(mil)` → les **kilos** sortaient justes. Mais il appelle ensuite
  `_vendRdtParc(nom, mil)`, dont `_vendVolParc` et `_vendSurfParc` testaient `_vendMillOfDate(r.date)!==mil` — un **nombre**
  contre une chaîne : toutes les récoltes écartées, `kg=0`, `kgKo=0`, `hlHa=0`, statut `aucune` (affiché « estimé ») et
  fourchette « 0 – 0 ».
- ⚠️ **Pourquoi aucun filet ne l'a vu** : `mv-harnais-parc-xls` remplace `_mlRendements` par un bouchon ; `mv-harnais-vendange-parts`
  appelait `_vendRdtParc` avec `2026` en nombre, comme Le millésime. **Deux harnais verts, chacun sur sa moitié du chemin** —
  personne ne jouait l'appel réel du fichier Excel jusqu'au bout.
- Correctif **à la source**, pas chez l'appelant : les deux comparaisons passent en `String(...)!==String(mil)`. Tout appelant
  (Excel, Le millésime, Pilotage › Revient, bilan) obtient le même résultat, quel que soit le type qu'il passe.
- `mv-harnais-vendange-parts` : +3 assertions (chaîne = nombre, kilos non nuls, même surface) ; contre-épreuve 7 qui remet la
  comparaison stricte → **les trois rougissent avec exactement le symptôme de la capture (0 kg)**.

### 201c. Les récoltes de la vendange en hL/ha

- `_vendRecHlObj(nom, mil)` lit `_mlRendements` (une fois par document : cache `_VREC_HL` remis à zéro par `_vendRecoltesDoc`) ;
  `_vendRecRdtTri` sert le tri « Rendement ». Colonne `hL/ha` (et `hL/ha parcelle` en vue par apport), « ~ » devant un
  chiffre non mesuré (§63b). **Sans `_mlRendements`** (cave.js en retard, harnais) : repli intégral sur le kg/ha d'avant —
  jamais un tableau qui mélange les deux unités.
- ⚠️ **« ≈ » refusé par `mv-harnais-subset`** : le caractère n'est pas dans le sous-ensemble de police — il serait sorti dans une
  police de repli. Remplacé par « ~ ».
- `_vendRecRdt` (kg/ha) **reste** : `mv-harnais-tri1`/`tri2` le comparent à `rendement_hist`, et c'est encore le chiffre de la
  fiche parcelle.
- **État sanitaire** : le curseur reste à 0 quand on ne le touche pas. « 0 % » se lisait comme une vendange pourrie ; c'est une
  absence de note. Affiché « — », et la moyenne par parcelle ne pèse que les bennes notées (`kgEt`). Mesure faite sur la capture
  de Nico : une seule parcelle notée (15 %). **Ce n'était pas « une colonne à 0 alors qu'on a l'info » : l'info n'a pas été saisie.**
- `mv-harnais-tri1` : +4 (tri hL/ha, ordre différent du kg/ha sur le même jeu, état non noté hors moyenne).

### 201d. Le planning de l'année : la date d'édition décide des noms

- `_paGroupes(yr, auj)` : **année en cours** → `_planMbrsPer(auj, 31/12)` sans les fiches `Inactif` ; **année passée** → toute
  l'équipe (la règle d'avant, voulue pour tirer le planning 2025 avec ceux qui sont partis) ; **année à venir** → inchangé.
  L'en-tête écrit « Équipe sous contrat au JJ/MM/AAAA » quand le filtre joue : deux tirages de 2026 ne nomment pas les mêmes gens.
- ⚠️ Le harnais `effectif-periode` affirmait l'**inverse** (E1 : « les sept anciens figurent sur le document 2026 »). C'était la
  décision d'un lot antérieur, pas une erreur : **la demande de Nico la remplace**, E1 est réécrit (5 assertions, date passée en
  argument) avec la contre-épreuve F8.
- ⚠️ **Ce qui reste nommé** : une fiche **Active sans date de contrat** (règle PRES-1). Cas probable de « Vendangeurs » sur la
  capture. Le guide le dit ; la réponse est de poser des dates, pas de deviner.

### 201e. Les aperçus écrasés, et la roue de la Cave sans style

- `_mvDocOpen` ouvrait chaque document avec `width=device-width` : un A4 paysage tenait sur ~410 px, d'où « LUND… » coupés dans
  le planning et un tableau des récoltes qui débordait sous un en-tête resté à la largeur de l'écran. La feuille **imprimée**
  était juste. La fenêtre prend maintenant la largeur utile de la page (1060 px paysage, 760 portrait ; `body` à 273 mm / 186 mm
  en `@media screen` seulement) : le téléphone montre la page entière, `@page` régit toujours l'impression.
- `renderVendParam` (réglages du Cuvier dans la roue de la Cave) n'injectait pas son CSS : ouvert depuis Aujourd'hui sans
  passer par Le Cuvier, le bloc sortait brut. Il appelle `_vendInjectCss` + `_vendEnsureSheetCss` lui-même — **même patron que
  `renderCaveReglages` pour le Chai**, qui avait déjà la garde (et le commentaire qui expliquait pourquoi).

### 201f. Mesuré

- `vendange-parts` 152 vertes (+3), contre-épreuve concluante ; `tri1` 46 (+4) ; `effectif-periode` 51 (+5, F8 rougit bien).
- `npm run check` : voir la note de livraison (le guide a été régénéré localement pour que la chaîne passe — `public/guide.html`
  et `public/sitemap.xml` ne sont **pas** livrés : `npm run site`).
- **Non vérifié à l'œil** : l'aperçu des documents sur téléphone (zoom initial), la roue de la Cave ouverte à froid.

### 201g. Ouvert

- Un **contrôle croisé** manque : jouer l'appel réel `exportCSVParcelles → _mlRendements → _vendRdtParc` sans bouchon. Le défaut
  de §201b vivait exactement dans la couture entre deux harnais.
- Les autres documents ouverts hors `_mvDocOpen` (s'il en reste) gardent `device-width` — non inventoriés.

## 202. ★★ FERTI-1 — L'AMENDEMENT ET LE CAHIER DE FERTILISATION (02/10 — `src/phyto.js` · `index.html` · `src/reserve.js` · `src/firebase.js` · `src/app.js` · `src/reglages.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto) · `public/sw.js` · `guide/07-phyto.html` · `scripts/mv-harnais-fertil.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 7.82 → 7.83, SW 8.56 → 8.57**, base `3050f8e`)

**La demande** (dictée, 02/10) : le fournisseur d'amendements passe ; on sème au tracteur, semoir arrière, sur CERTAINES
parcelles. Dose conseillée en t/ha + poids du sac → sacs par parcelle ; coût ; travail prévu et temps de travaux ;
Pilotage et budget à jour ; étapes conseillées, jamais obligatoires. Deux maquettes validées (v2 : ajout du cahier
d'enregistrement de la fertilisation, cohérence E-Phy, « que l'admin n'ait pas à chercher partout »).

**Ce que le code a dit avant d'écrire (inventaire)** :
- Il n'existait **aucun calcul de temps tracteur depuis la vitesse** — seulement le barème h/ha saisi à la main par
  activité (`a.h_ha`, Réglages › Activités tracteur). Nico s'en souvenait autrement : le calcul neuf ÉCRIT dans ce barème.
- Le catalogue E-Phy synchronisé contient déjà la famille **MFSC** (`functions/ephy.js`) : la recherche se fait dedans,
  filtrée `type==='MFSC'`. Un produit normé (NF U 44-051…) n'y est pas : saisie libre avec sa norme.
- Une tâche s'applique à **toutes** les parcelles sauf `p.tachesExclues` (`_parcConcern`). Créer « Amendement » =
  exclure les non-cochées ; un apport suivant ne fait qu'INCLURE (jamais ré-exclure ce qu'un apport précédent a inclus).
- **Aucun lien activité tracteur → tâche.** D'où l'arbitrage central :

**L'arbitrage : le registre LIT ses dates.** `_ferFaits()` : pour chaque apport et chaque parcelle, la première
validation postérieure à la création de l'apport — session `activite==='Amendement'` (heure `t1` de la parcelle,
sinon date de la session), puis journal `tache==='Amendement'` validé ; une date posée par l'admin (`op.man`) gagne.
Une validation ne sert qu'à UN apport (le plus ancien qui l'attend). Écarté : écrire la date depuis `tracteur.js`
(hook dans un module de 3 200 lignes, double source) — §3 « vérifier le chemin par défaut avant de construire ».

**Données** : `INTRANTS.fertil` (aucune collection, aucune règle à déployer ; `intrants` est déjà admin-only en écriture).
⚠️⚠️ La clé a été ajoutée **le même lot** à `_rsvApply` (sinon `[]` au rechargement puis écrasement — le piège
`fut_mouv`), à `_mvIntrantsCount` (garde anti-perte) et à `_MV_SOUS_LISTES` (LISTES-1). Champs parcelle neufs, posés
depuis l'onglet (fiche ZV / îlot / sol) : `p.zv`, `p.ilot`, `p.sol` — absents = tiret, jamais deviné.

**Réglementaire, sourcé** (plaquette DRAAF BFC 7e programme, oct. 2024 ; arrêtés de bassin RM 2026-214/215 du
30/07/2026, corrigés le 27/08) : contenu du CEP par apport (date, superficie, nature, teneur N, quantité N) + îlot,
sol, culture, rendement ; campagne 01/09 – 31/08 ; conservation 5 campagnes ; type II par défaut ; analyse de sol au-delà
de 3 ha en ZV (MO pour la vigne) ; fractionnement de l'azote minéral au-delà de 60 kg N/ha ; type 0 interdit 15/12 – 15/01.
**Non fait, faute de lecture certaine** : le calendrier vigne par type (grille en couleurs), le calcul de dose GREN.

**Harnais** `mv-harnais-fertil.mjs` (42 assertions, dont 6 contre-épreuves) : extrait le bloc FERTI-1 de `phyto.js`.
**Ce que les contrôles ont dit en route** (premier passage du lanceur, 4 familles de rouges, toutes traitées) :
- `mv-harnais-achats` épinglait la LISTE EXACTE du garde anti-perte (`['produits','achats','inventaires','futs']`) : il
  rougissait à la première clé réelle ajoutée. Réécrit pour prouver ce qu'il voulait prouver — toute clé comptée existe au
  modèle. Et `_rsvApply` n'est lu que sur ses **700 premiers caractères** : un commentaire posé AVANT `var d={…}` le faisait
  sortir de la fenêtre → les 9 clés « jamais relues ». Commentaire déplacé après la ligne.
- Compteur d'émojis (phyto 10 → 18) : les coches `\u2713` sont devenues `_mvIcon('check',16)`, les ★/⚠/→ des commentaires du
  bloc des caractères simples. Un `confirm()` natif de repli retiré (preflight §22).
- Barème typographique : les tailles du cahier imprimé passent par `var(--pt-nano/lbl,…)`.
- `mv-harnais-robustesse-reserve --contre` posait son défaut sur la ligne LISTES-1 recopiée À L'IDENTIQUE
  (`intrants:[…,'fut_mouv']};`) : « ancre introuvable » dès l'ajout de `fertil`. Ancre mise à jour, et `fertil` ajouté au
  tirage au hasard du même harnais (un élément nul dans `fertil` est désormais éprouvé).
- `build-guide --check` rougit tant que `public/guide.html` n'est pas refabriqué : normal, il n'est PAS livré
  (`npm run site` le refait). Vérifié ici : refabriqué, il passe.
- Contraste (CONTRASTE-1, 0 → 3 en clair, 1 → 7 en sombre) : l'orange, le rouge et le violet sur leur fond pâle passent
  sous 4,5. Les pastilles et encadrés d'alerte gardent leur fond pâle, prennent l'encre du texte et un filet de leur
  couleur. Les coches pleines (blanc sur vert) deviennent vert sur vert pâle : `--blanc` en couleur de texte est un jeton
  de SURFACE, refusé par le même harnais.
- ⚠️ **`phyto.js` 91 → 150 ko** (+65 %, seuil +5 %). Question du découpage posée : un module à part (`fertil.js`) aurait
  demandé un nouveau point d'entrée et sa déclaration dans les listes de modules de plusieurs harnais, pour un onglet DU
  Phyto qui partage sa recherche E-Phy (`_phyNorm`, `_phyEphy`). Gardé dans `phyto.js` ; **seule la ligne `ko` de
  `phyto.js`** regravée dans `typo-baseline.json` (le `--baseline` complet aurait aussi avalé la croissance non regravée
  de neuf autres modules — rendu à l'identique). Si le bloc grossit encore au FERTI-2 : le sortir.

**Reste ouvert** : FERTI-2 (§28).

## 203. ★ FERTI-2 — LE COÛT D'UN AMENDEMENT AU PRÉVU, L'ANNÉE DE PLANTATION (02/10 — `src/pilotage.js` · `src/phyto.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto, MV_INFO de l'exercice) · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-fertil.mjs` · `scripts/mv-harnais-pil-coherence.mjs` · **bump APP 7.83 → 7.84, SW 8.57 → 8.58**, base FERTI-1 sur `3050f8e`)

**Le prévu des achats.** `_pexData` (Économie › Exercice) ne connaissait que deux natures : l'ENGAGÉ daté et le PRÉVU des
salaires (grille). Un amendement chiffré est une troisième chose : une dépense ANNONCÉE. Bloc « 3 bis » : `achP` = somme
des `op.cout > 0` dont la date prévue (`op.sem`, sinon `op.cree`) tombe dans l'exercice, **seulement si `enCoursC`**
(un exercice clos n'a plus de prévu ; un exercice futur n'en avait déjà pas pour les salaires — même règle). Un apport
sort du prévu dès qu'un achat **chiffré** (`prix > 0`) du même `prodId`, daté entre sa création et la coupe, existe.
Arbitrages : un achat SANS prix ne retire rien (sinon la dépense disparaîtrait des deux colonnes) ; un achat d'AVANT
l'apport ne retire rien (c'est une autre livraison). Écarté : soustraire le montant facturé du prévu (facture partielle)
— l'apport n'a pas de notion de livraisons multiples ; une facture = l'apport est réglé.
`totalP=salP+achP`, ligne Achats `eurP`, phrase « pas de colonne prévu » réécrite (écran, MV_INFO, MV_AIDE, guide).
⚠️ `mv-harnais-pil-coherence` épinglait `var totalP=salP, …` (⑫) : mis à jour, l'intention (clôture = engagé + prévu) tient.
`byM[]` (le graphe mois par mois) ne porte PAS ce prévu : le hachuré reste celui des salaires — à décider si Nico le veut.

**L'année de plantation** : aucun champ n'existait (§202). `p.plantee` (entier, 1850 → année en cours, sinon refus),
posé depuis la fiche fertilisation de la parcelle ; cahier PDF et colonne CSV « Annee de plantation ».

**Harnais** : `mv-harnais-fertil` 42 → 54 assertions (bloc du prévu extrait de `pilotage.js`, 7 cas + 1 contre-épreuve).
**Reste ouvert** : FERTI-3 (§28).

## 204. ★★ FERTI-3 — LA SESSION « AMENDEMENT » COCHE LA TÂCHE, SANS DOUBLE COMPTE (02/10 — `src/phyto.js` · `src/app.js` (`saveData`) · `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto + tracteur, MV_INFO temps vigne ×2) · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `scripts/mv-harnais-fertil.mjs` · **bump APP 7.84 → 7.85, SW 8.58 → 8.59**)

**La décision de Nico** : « la session coche la tâche, marquée faite au tracteur, pour que le Pilotage ne recompte pas ».

**Pourquoi le marquage est indispensable, mesuré avant d'écrire** : le Pilotage compte les heures depuis le JOURNAL à
trois endroits — `_ecoTvEvents` (PAR-1 : la journée de chacun se partage entre TOUTES les validations du jour), le
partage par personne (coût par parcelle des personnes nommées) et le repli « barème daté ». Une validation ordinaire
écrite par la session aurait (1) attiré une part des heures de l'équipe du jour sur la parcelle semée, (2) recompté au
barème un travail dont le temps est déjà celui de la session (`_ecoTracHByParc`). D'où `auTracteur:true`, écarté aux
trois endroits ; `quiHors:true` en plus (convention TV-2 : le validateur hors des rangs ne compte pas), pour tout
lecteur futur qui ignorerait `auTracteur`. Les lecteurs de DATES (frise, dernière validation) la gardent : c'est vrai.

**Le point d'accroche** : `tracteur.js` sauve les sessions par ~20 chemins (`saveData('sessions')`). Plutôt que vingt
appels, une réconciliation au seul passage obligé, dans `saveData` (app.js), garde de réentrance `_ferSyncEnCours`.
`_ferSyncSessions` est idempotente : une entrée `auTracteur` existe pour (session, parcelle) → rien ; tâche déjà validée
à la main → rien ; parcelle exclue, arrachée, saison consultée non active, tâche absente → rien. ★ Elle ne DÉFAIT rien :
une validation annulée depuis la parcelle n'est pas refaite. Le registre (`_ferFaits`) ignore la copie journal.
Écarté : écrire `p.taches` sans entrée de journal — validation sans trace, ignorée de la frise et de la reconstruction.

**Harnais** `mv-harnais-fertil` 54 → 70 (cas FERTI-3, épinglages Pilotage/app, 2 contre-épreuves).

## 205. ★★ SEL-1 — ARRACHAGE, DÉSHERBAGE MANUEL, EFFEUILLAGE : LES PARCELLES SE CHOISISSENT PAR CAMPAGNE (02/10 — `src/utils.js` · `src/app.js` · `src/pilotage.js` · `src/planning.js` · `src/reglages.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-selection.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.85 → 7.86, SW 8.59 → 8.60**, base `cad12b0`)

### 205a. D'où ça vient

Nico arrache quelques parcelles : *« le temps des travaux doit être compté aussi dans la vigne »*. Inventaire : la tâche
**Arrachage** existait (catalogue, temps réel, sans barème) ; le moteur du temps réel (`_ecoTvEvents`, §172) ne filtre PAS les
parcelles arrachées. Deux défauts : ① dès « Arrachée », la parcelle disparaissait de la saisie du journal (`openJournalEntry`) — les
journées de ramassage attendaient au planning et se versaient sur la prochaine clôture **d'une autre parcelle** ; ② activée sur une
période, la tâche concernait **toutes** les parcelles (avancement « 2/45 », « à faire » partout). Le seul outil, la tâche
désactivée par parcelle (`p.tachesExclues`), marche à l'envers (tout concerné tant qu'on n'exclut pas) et il est **permanent**.
Nico : *« il faudrait pouvoir faire une sélection simple »*, puis *« l'arrachage ne concerne que la saison en cours, l'année
prochaine ce sera d'autres parcelles »*, et *« aussi pour l'effeuillage et le désherbage manuel »*.
★ « Saison » dans sa bouche = l'**année** : axe **campagne** (§11c), pas période — un arrachage déborde de l'automne sur l'hiver.

### 205b. La règle (`utils.js`, bloc SEL-1)

- `MV_TACHES_SEL = ['Arrachage','Desherbage','Effeuillage']` (noms du catalogue ; `_normalizeTaches` garde `t.nom = cat.nom`).
- **Concernée pour la campagne C** = `p.selCamp[tâche] === C` **ou** une entrée « Validé » / « En cours » de cette tâche sur
  cette parcelle datée dans C (`_mvSelTravaillees`, mémoire courte dont la clé suit la longueur et les deux bouts du journal).
- ★ **Pourquoi le journal compte** : le temps réel verse déjà les heures sur toute validation ; l'avancement doit voir la même
  chose. Et c'est ce qui garde intactes les validations d'avant ce lot **sans migration** : une effeuilleuse déjà validée compte.
- ★ **On stocke le NUMÉRO de campagne**, pas un booléen : la sélection tombe d'elle-même à la campagne suivante, sans remise à zéro
  ni tâche planifiée (contre-épreuve dédiée).
- **Campagne de référence** (`_mvCampRef`) : celle du jour sur la période active ; celle du **début** de la période consultée en
  archive.
- `p.tachesExclues` est **ignoré** pour ces trois tâches ; toutes les autres gardent l'ancienne règle, mot pour mot.
- **Une parcelle arrachée n'est éligible qu'à l'arrachage** (`_mvSelEligible`) : `_parcConcern('Arrachage')` la garde (sans elle
  l'avancement de l'arrachage ne verrait jamais les parcelles finies), les deux autres l'écartent.

### 205c. Ce qui a été branché

- Lecteurs passés par la règle : `getPCls`, filtre tâche de Parcelles, fiche (`openDP` : heures restantes, ligne grisée
  « Pas choisie pour cette campagne », bouton réservé à l'admin pour ces tâches), `toggleExcluTache` (pose `selCamp` au lieu
  d'exclure), `_parcConcern` (donc `recalcTravaux`, l'Accueil, le planning de passage), `_mvCibleCarte`, `_opApplic` et la
  signature de cache des parcelles (Pilotage), `surfFn` (Planning), l'état du vignoble (`reglages.js`).
- **Feuille `ovSelParc`** (statique dans `index.html`, `openOv`/`closeOv` → le retour Android est géré) : puces `.pchk` par
  commune quand il y en a deux, recherche, total d'hectares ; une parcelle déjà travaillée est cochée d'office et ne se décoche pas.
  Garde `isAdmin()` **dans** `saveSelParc`, pas seulement à l'ouverture. Ouverte par la ligne du travail dans la roue crantée ›
  Tâches (`selHtml`, `_mvSelResume`).
- **Journal** : les parcelles arrachées concernées par l'arrachage s'ajoutent en bas (`<optgroup>` « Arrachées — arrachage
  seulement ») ; `saveJournalEntry` refuse toute autre tâche sur une arrachée.

### 205d. La vérification des chiffres d'Internet (dans la conversation)

Le tableau collé par Nico est arrivé coupé (seule la ligne « Dépalissage complet » : 35–50 h/ha en vigne étroite, 15–25 h/ha en
vigne large). **Pas de source trouvée pour ces valeurs.** Sourcé : référentiels des Chambres d'agriculture du Val de Loire —
arrachage complet 112 h + 400 € de prestation par ha (Sancerre, palissage 4 fils), 90 h (Pays de la Loire 2023, 3 fils).
Le rapport ≈ 2 étroite/large tient parce que le temps suit la **longueur de rangs**, pas le nombre de pieds — alors que
`_mvHhaDens` ajuste au nombre de pieds. ⚠️ Piège de mot : « dépalissage » = aussi l'enlèvement des bois de taille (le tirage) ;
le « dépalissage 5 h » de la brochure Pays de la Loire, c'est ça. **Conclusion retenue : aucun barème par défaut**, les vrais
temps viendront du temps réel.

### 205e. Mesuré

- `mv-harnais-selection.mjs` : **31 assertions** sur les vraies fonctions extraites de `utils.js` et `app.js` ; **9 contre-épreuves**
  (booléen au lieu du numéro de campagne, journal ignoré, `tachesExclues` relu, arrachée éligible à tout, campagne du jour en
  archive, « Annulé » compté, garde admin retirée de l'écriture, mémoire du journal figée, parcelle travaillée décochable) — toutes
  rougissent.
- **Non vérifié à l'œil** : aucun navigateur lancé — la feuille sur téléphone, les deux thèmes, la ligne de Réglages.
- Accompagnement : `MV_AIDE` Parcelles (deux points), guide `04-vigne.html` (deux encarts), `WHATS_NEW` 7.86. `MV_INFO` : aucune
  fiche ne décrit la méthode de l'avancement — rien à changer. Visite guidée : aucun sélecteur touché.

## 206. ★★ ARRACH-3 — L'ARRACHAGE EN ÉTAPES, COMPOSÉ PAR L'ADMIN (02/10 — `src/app.js` · `src/pilotage.js` · `src/reglages.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach3.mjs` (neuf) · `scripts/mv-harnais-equipes-jour.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 7.86 → 7.87, SW 8.60 → 8.61**, posé sur SEL-1 non poussé, base `cad12b0`)

### 206a. La demande

Proposé : trois étapes fixes. Nico a élargi : *« l'admin choisit ce qu'il veut mettre dans arrachage »*, *« est-ce qu'il la passe
arrachée à ce moment-là ou une fois que les trois étapes sont faites »*, *« on peut peut-être aussi mettre l'option prestataire »*.
Chez lui : démontage et souches par l'équipe, ramassage par un prestataire — *« c'est l'exemple, pas à prendre en généralité »*.

### 206b. Pourquoi PAS le type « niveaux »

Le type `niveaux` est câblé pour le Relevage (`_relNivState`, niveaux numérotés, niveaux « Auto ») et `_normalizeTaches` IMPOSE
le `type` du catalogue à chaque chargement : un `type:'niveaux'` posé par le domaine sur Arrachage serait effacé. L'arrachage en
étapes vit donc à côté : `CONFIG.arrachage` (réglage), `p.arrEtapes = {c, f}` (état, numéro de campagne comme SEL-1), une entrée de
journal par étape. La tâche du catalogue ne change pas : un domaine qui ne découpe pas ne voit **aucune** différence.

### 206c. Ce qui a été écrit

- **Réglage** (`openArrCfg` / `saveArrCfg`, feuille `ovArrCfg`, admin) : cinq étapes proposées + étape libre, ordre par flèches,
  puce « Prestataire », choix « Proposer “Arrachée” après… » (une étape, ou toutes). Lien sur la ligne Arrachage de la roue
  crantée › Tâches (`_arrResume`). Tout décocher supprime `CONFIG.arrachage`.
- **Fiche parcelle** : une puce par étape (`_arrRowHtml`) ; toucher → `ovArrEtape` (date ≤ aujourd'hui ; prestataire : nom et
  montant, optionnels). Valider écrit `{tache:'Arrachage', etape, etapeLbl, presta?, prestaNom?, prestaMontant?}` par l'unique
  `_arrJournal` (passe par `_mvEqApplique` : **huit** écritures du journal, harnais ÉQUIPES-1 mis à jour). `p.taches['Arrachage']`
  suit (Non démarré / En cours / Validé), jamais sur une période consultée en archive. L'admin annule une étape (entrée
  « Annulé » portant la même étape).
- **Passage « Arrachée »** : à l'étape choisie (ou à la dernière), **admin seul**, `openDPArrachage()` s'ouvre avec la date de
  l'étape — proposé, jamais imposé.
- **Temps réel** (`_ecoTvEvents`) : `!j.presta` écarte l'étape prestataire (patron `auTracteur`, FERTI-3) ; la clé du couple
  porte l'étape (une annulation ne vise qu'elle ; deux étapes ne sont pas une revalidation RÉAL-1). `_ecoTempsVigne` rend
  `V.etapes` (heures, euros, surface, h/ha par étape, ordre du réglage) ; `_pecCarteTemps` les affiche sous la ligne Arrachage.
- `pQuickValidate` et `tapTacheSimple` renvoient vers la fiche quand l'arrachage est découpé. Le journal affiche l'étape et le
  prestataire à côté de la tâche.

### 206d. Mesuré

- `mv-harnais-arrach3.mjs` : **26 assertions** sur les vraies fonctions (`app.js` bloc ARRACH-3, `pilotage.js` `_ecoTvEvents`) ;
  **10 contre-épreuves** toutes rouges (prestataire qui absorbe les heures, annulation qui vise le dernier arrachage, proposition à
  chaque étape, proposition à un salarié, tâche validée dès la 1re étape, état qui survit à la campagne, garde admin de
  l'annulation, date future, montant oublié, statut écrit en archive).
- **Non vérifié à l'œil** : aucun navigateur lancé.
- Accompagnement : `WHATS_NEW` 7.87, `MV_AIDE` Parcelles, `MV_INFO` `pil.eco.temps` (deux phrases : prestataire, lignes par étape),
  guide `04-vigne.html` (un encart). Visite guidée : aucun sélecteur touché.

## 207. ★★ ARRACH-4 — LE BACKLOG DE L'ARRACHAGE : PRESTATIONS AU PILOTAGE, ARRACHÉE AU TABLEAU, ÉTAPE AU JOURNAL (02/10 — `src/pilotage.js` · `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach4.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.87 → 7.88, SW 8.61 → 8.62**, posé sur SEL-1 + ARRACH-3, base `517eb00`)

### 207a. La demande

Nico : *« occupe-toi de ce qui est au backlog (formulaire, montant prestation, économie par parcelle) »* — les trois points
ouverts au §206.

### 207b. Les prestations (`_ecoPrestaByParc`, pilotage.js)

- **Source : le journal**, entrées portant une `etape`, rejouées dans l'ordre (date, puis id hexadécimal) par couple parcelle ×
  tâche × étape : « Annulé » efface, une revalidation **remplace** (jamais deux factures pour une étape), une revalidation par
  l'équipe (sans `presta`) efface la prestation. Posée à la **date de l'étape**, sur **sa parcelle**. Un montant absent n'est
  pas zéro : `nSansPrix`, dit dans le détail du poste.
- **Campagne (`_pecData`)** : `prestF` par ligne, `T.prestF` ; dans `engage`, `engageBar`, `budget` (pas de prévu : le budget
  d'une prestation est ce qu'elle a coûté, pas d'extrapolation à l'avancement) ; poste `pre` ajouté **seulement s'il existe** ;
  courbe d'engagement (`T.byDatePresta`) ; colonne **Presta.** du tableau des parcelles et du CSV.
- **Exercice (`_pexData`)** : bloc 4c, `preT` dans `total`, atelier **vigne** (invariant « somme des ateliers » tenu), barre
  mensuelle `pre` — et la somme d'échelle du graphique (le piège écrit au-dessus de `maxV`).

### 207c. L'arrachée au tableau des parcelles (`_pecData`)

Une parcelle arrachée entre si elle a **coûté sur la période** (heures versées par le temps réel, tracteur, phyto ou prestation).
`arr:true` : **aucun barème** (les travaux de la saison ne s'appliquent plus), **surface hors total** (`T.nArr`, les €/ha du
domaine restent ceux des vignes en place), pas de carburant « à la surface » dans le repli de la clé GNR. Pastille « arrachée »,
« Fait » à « — ». Le Revient (`_pecRevData`) l'écarte toujours (backlog 5).

### 207d. Le formulaire du journal (app.js)

`je-etape-wrap` (index.html) s'affiche pour l'Arrachage découpé (`_jeEtapeMaj`, appelé à l'ouverture et au changement de
tâche) ; une étape prestataire montre nom et montant. `saveJournalEntry` écrit `etape`/`etapeLbl`/`presta…` et pose l'état par
`_arrPose` — partagé avec `saveArrEtape` (fiche). Aucune écriture neuve du journal : toujours huit `JOURNAL.unshift(_mvEqApplique(`.

### 207e. Mesuré

- `mv-harnais-arrach4.mjs` : **19 assertions** (la vraie `_ecoPrestaByParc`, les vrais gestes du formulaire, le câblage de
  `_pecData` / `_pexData` lu dans le source) ; **8 contre-épreuves** toutes rouges. `_pecData` et `_pexData` eux-mêmes tournent au
  harnais de robustesse du Pilotage.
- **Non vérifié à l'œil** : aucun navigateur lancé.
- Accompagnement : `WHATS_NEW` 7.88, `MV_INFO` (`pil.eco.postes`, `pil.eco.parcelles`, `pil.exo.postes`), guide, note de la
  feuille d'étape.

## 208. ★★ ARRACH-5 — L'ARRACHAGE DANS LE PRIX DE LA BOUTEILLE, LA FACTURE DE PRESTATAIRE UNIQUE, LE BOUTON QUI S'ALLUME (02/10 — `src/pilotage.js` · `src/utils.js` · `src/app.js` · `src/reserve.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach5.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.88 → 7.89, SW 8.62 → 8.63**, posé sur ARRACH-4 non poussé, base `517eb00`)

### 208a. La demande

Nico : *« il faut que la facture prestataire ne puisse pas se noter ailleurs »* ; *« le coût d'arrachage et des travaux effectués
sur l'année comptable (ou vigne) en cours doit peser sur le prix de la bouteille »* ; *« le bouton prestataire ne s'allume pas en
vert »*.

### 208b. Le bouton (app.js, `_arrCfgRows`)

`.pchk.sel` n'a aucune règle CSS : la teinte vient de la seconde classe (`.pchk.sel.vert`, `.acre`, `.phyt`, styles.css ~882).
La puce posait `sel` seul → `sel vert`. ★ Leçon : toute puce `.pchk` cochée porte DEUX classes.

### 208c. La facture unique (`_mvFactureOu`, `_mvNomPrestation`, utils.js)

- Les deux endroits qui portent une facture de fournisseur avec son n° : l'étape d'arrachage (journal : `prestaNom`,
  `prestaFact`, nouveau champ sur la fiche et au formulaire) et les achats de La Réserve (`four`, `fact`). **Garde croisée** :
  chacun refuse une facture (n° normalisé : casse, espaces, points, tirets, barres ; fournisseur comparé s'il est connu des deux
  côtés) déjà connue de l'autre. Une étape annulée ne bloque pas.
- La Réserve refuse aussi un intrant (neuf ou existant) dont le nom dit prestation / main-d'œuvre / arrachage.
- **Limites écrites** : sans n° de facture, rien ne prouve le doublon ; les réparations du tracteur et les fûts n'ont pas de n° de
  facture et ne sont pas gardés (ce ne sont pas des prestations d'arrachage).

### 208d. Le revient (`_pecRevCouts`, poste `pre`)

- **Ce qui y était déjà** : la main-d'œuvre d'arrachage — `TV.eur` entier est réparti sur les vignes en place (la part d'une
  arrachée change de clé, elle ne sort pas du total).
- **Ce qui manquait** : le tracteur et le phyto posés sur une parcelle arrachée (absente de `parc`) et toute prestation. Une
  prestation sur une vigne en place lui revient ; ce qu'a coûté une vigne arrachée se répartit **à la surface** sur les vignes en
  place (elle ne donne pas de vin, le domaine en porte la charge). `POST` gagne `pre` (sommé au coût, D3 du harnais revient
  toujours valide), barre de répartition « Arrachage & prestations », note sous les chiffres quand une arrachée a coûté.
- Fenêtre : le **cycle du millésime** (année vigne, d'une vendange à la suivante), comme le reste du revient.

### 208e. Mesuré

- `mv-harnais-arrach5.mjs` : **15 assertions** (vraies `_mvFactureOu`, `_mvNomPrestation`, `_pecRevCouts` sur des sources de coûts
  connues) ; **6 contre-épreuves** toutes rouges.
- **Non vérifié à l'œil** : aucun navigateur lancé.
- Accompagnement : `WHATS_NEW` 7.89, `MV_INFO` (`pil.eco.revient`, `pil.exo.postes`), guide, note de la feuille d'étape.

## 209. ★ AVC-ARR — UNE PARCELLE ARRACHÉE NE PORTE PLUS QUE L'ARRACHAGE (02/10 — `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-avc-arr.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.89 → 7.90, SW 8.63 → 8.64**, base `7c29450`)

### 209a. Le constat

Nico, deux captures après déploiement d'ARRACH-4/5 : *« il y avait des bugs avant sur l'avancement des tâches »*. Écran Parcelles :
Bras, Charreux, Marchais Petite (arrachées) à **50 % · 1/2 tâches** ; carte de l'Accueil : arrachage **0 %**, « il reste 3
parcelles » (0,27 ha). Les deux disent vrai à leur façon : `getPCls` comptait **deux** travaux sur une arrachée (l'arrachage +
un autre travail de la période, validé sur elle), l'Accueil ne compte que l'arrachage. Le défaut est le premier : une vigne
arrachée n'a plus d'autre travail. Et la fiche (`openDP`) laissait valider ou démarrer ces autres travaux — le journal les
refusait déjà (SEL-1), pas la fiche.
⚠️ Non vérifiable d'ici : QUEL autre travail était validé sur ces parcelles (aucun accès aux données). Le 0 % de l'arrachage est
juste : sur ces trois parcelles, aucune validation d'arrachage — déclarer « Arrachée » n'est pas valider le travail.

### 209b. La règle

`_mvArrHors(p, nom)` = parcelle arrachée et travail ≠ Arrachage. Lue par `getPCls` (pourcentage et « n/N tâches »), la fiche
(`openDP` : liste et heures restantes), et `_mvArrRefus` dans six gestes : `marquerEnCours`, `openValidationPanel`,
`openNiveauxPanel`, `openPassagesPanel`, `tapTacheSimple`, `pQuickValidate`. Les validations déjà posées restent en base,
simplement plus comptées ni montrées.

### 209c. Mesuré

`mv-harnais-avc-arr.mjs` : **11 assertions** (la vraie `getPCls`, la vraie règle, les six gestes et la fiche lus dans le source),
**3 contre-épreuves** rouges. Non vérifié à l'œil.

## 210. ★ ARRACH-6 — L'ARRACHAGE EN UN GESTE, DANS UN SENS COMME DANS L'AUTRE (02/10 — `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach6.mjs` (neuf) · `scripts/mv-harnais-arrach3.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 7.90 → 7.91, SW 8.64 → 8.65**, base `01c6a2e`)

### 210a. Le constat

Nico, après AVC-ARR : *« quand je fais valider sur une parcelle, je l'avais déjà passée arrachée, donc je la remets en
exploitation […] ça m'ouvre le listing des tâches possibles […] ça me marque 50 % […] c'est pas net »*. Le chemin naturel
(valider l'arrachage, puis déclarer) n'était pas le sien : il déclare d'abord. Déclarer « Arrachée » (ARRACH-1) n'écrivait aucune
validation ; pour en poser une il ressortait la parcelle — et AVC-ARR ne s'applique plus à une vigne « en place ».

### 210b. Ce qui change

- **Déclarer valide le travail** : `openDPArrachage` remplit `#arr-valide-row` (`_arrValideRowMaj`) — case « Valider aussi le
  travail d'arrachage », **cochée d'office**, montrée seulement si l'Arrachage est dans la période et pas déjà validé ; en
  arrachage par étapes, un renvoi aux étapes de la fiche. `saveArrachage` appelle `_arrValideAuPassage(p,date)` **avant**
  `_arrApres` : une entrée de journal « Arrachage Validé » à la date d'arrachage (par `_arrJournal`, donc `_mvEqApplique` — toujours
  huit écritures), parcelle choisie pour la campagne si elle ne l'était pas (SEL-1), `p.taches.Arrachage = 'Validé'`. La case ne
  sert qu'une fois.
- **Valider propose de déclarer** : `confirmValidation` d'un Arrachage sur une vigne en place, par un admin → `_arrProposer`
  (au lieu du bilan de chantier). `_arrProposer` pose `_dpCurrentNom` : `openDPArrachage` lit la fiche courante, et depuis la
  liste des parcelles elle aurait visé la dernière fiche ouverte. `saveArrEtape` passe aussi par lui.
- Contre-épreuve « proposé à un salarié » d'ARRACH-3 mise à jour : la garde admin vit maintenant à deux endroits.

### 210c. Pour les parcelles de Nico

Celles remises en exploitation : valider l'arrachage → l'appli propose « Arrachée » → confirmer. Celles restées arrachées : leur
fiche ne montre que l'arrachage (AVC-ARR) → le valider là.

### 210d. Mesuré

`mv-harnais-arrach6.mjs` : **13 assertions**, **5 contre-épreuves** rouges. Non vérifié à l'œil (pas de navigateur dans le bac à
sable : `npx playwright install` refusé par le réseau).

## 211. ★ ARRACH-7 — L'ARRACHAGE FINI POUR L'ÉQUIPE, LA SUITE AU PRESTATAIRE (02/10 — `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `scripts/mv-harnais-arrach7.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 7.91 → 7.92, SW 8.65 → 8.66**, base `03a41d2`)

### 211a. Le constat

Capture de l'Accueil : « Ma part du chantier » — Arrach. **0 %**, « il reste 4 parcelles ». Nico : le démontage (le travail de
l'équipe) est fait partout, le reste dépend du prestataire ; *« ça devrait être marqué presque 50 % »*, et *« pour l'équipe, dans
leur tête elle est arrachée […] qu'on puisse passer à un autre chantier »*. Le statut de l'arrachage découpé était binaire
(Validé seulement à la dernière étape) et `_mvPartTache` gardait l'arrachage tant que son % < 100.

### 211b. Deux lectures (bloc ARRACH-3)

- `_arrFraction(p)` — étapes faites / étapes (1 si validé d'un bloc). **Domaine** : `recalcTravaux('Arrachage')` (nouvelle
  branche, surface × part) et `getPCls` (le % de la carte ajoute la part ; « n/N tâches » reste entier).
- `_arrEquipeFinie(p)` — toutes les étapes **non prestataire** faites (vrai si validé d'un bloc ; faux sans découpage).
  `_arrEquipeFiniePartout()` — toutes les parcelles concernées, au moins une. **Équipe** : `_mvPartTache` saute l'arrachage
  (dans le choix par activité ET dans le repli), `_mvPartCalc` compte « fait » côté équipe. Fiche : « fini pour l'équipe, la
  suite au prestataire ».
- ⚠️ « Presque 50 % » suppose deux étapes (démontage + une étape prestataire) ; à trois étapes, c'est 33 %. Et l'équipe n'est
  « finie » que si les étapes du prestataire sont bien marquées **Prestataire** dans le réglage.

### 211c. Mesuré

`mv-harnais-arrach7.mjs` : **10 assertions** (vraies `_arrFraction`, `_arrEquipeFinie`, `getPCls`, `_mvPartTache`,
`_mvPartCalc`), **5 contre-épreuves** rouges. Non vérifié à l'œil.

## 212. ★★ AVALE-2 — UNE ERREUR AVALÉE QUI SE RÉPÈTE REMONTE AU JOURNAL DU DOMAINE (03/10 — `src/utils.js` · `public/sw.js` · `scripts/mv-harnais-avale.mjs` · **SW 8.66 → 8.67, APP inchangée (7.92)**, base `6028b23`)

### 212a. D'où ça vient — un audit relu avant d'agir

Audit qualité de `src/` (02/10, fait hors de cette session, base `cad12b0`), point P3 : *« 281 erreurs avalées, signalées une
seule fois par session, en niveau info »*. Constat **juste**, et même plus grave que l'audit ne le disait : `info` n'est pas
dans `_ERR_SEND_LVL` (§132d), donc une erreur avalée **ne quittait jamais le téléphone**. Mille échecs du même bouton = une
ligne locale, que seul « Signaler un problème » pouvait faire remonter, noyée parmi les `info`.
★★★ **La correction proposée par l'audit était fausse** : passer à `level:'warning'` dès la 10e. `logError` peint un toast
jaune pour tout `warning` — le client aurait vu « ⚠️ erreur avalée dans app.js/_recalcSurfTotale ». L'audit le soupçonnait
(*« logError n'a pas été lu en entier : à mesurer »*) ; mesuré, c'était le cas. **Lire la fonction appelée avant d'en changer
l'argument** (règle d'or n°3, corollaire du 07/08).
Autres points du même audit, vérifiés le même jour et **non traités ici** : P2 (div cliquables au clavier) surestimé — 97 des
374 `div onclick` sont des `event.stopPropagation()` de panneaux, pas des boutons, et le délégué proposé les aurait rendus
tabulables ; P4 (ETP) faux pour l'essentiel — le rapport de saison lit déjà `_planSeasonHours` quand les champs sont vides, et
pré-remplir les champs aurait FIGÉ le chiffre du Planning en saisie manuelle au premier « Enregistrer » (et l'audit lisait
`ref` au lieu de `refBrute`) ; P6 — son code visait un `data-parc` et une fonction de carte unitaire qui n'existent pas.
P1 et P7 redisaient les entrées 36 et 34 du backlog.

### 212b. Ce qui change

- `_mvAvale` écrit aux **paliers 1, 10, 100, 1000** (`_MV_AVALE_PALIERS`), jamais entre : le coût de `logError` (relecture +
  réécriture du journal localStorage) reste borné à **4 écritures par emplacement et par session**. Le compteur
  `window._mvAvalees` compte toujours tout.
- Niveau : `info` au 1er palier (**inchangé** : un hoquet reste local, §132d tient), `warning` à partir de 10 → part vers
  `error_log` du domaine (Admin GT) et passe devant les `info` dans « Signaler un problème ». Le message porte la récurrence :
  `erreur avalée dans app.js/x (×10 cette session)` — le dédoublonnage de `_errShouldSend` (clé `cat|msg`) laisse donc passer
  chaque palier.
- `logError({silencieux:true})` : journalise et envoie selon le niveau, **ne peint rien**. Seul `_mvAvale` le pose.

### 212c. Mesuré

`mv-harnais-avale.mjs` : **23 assertions** (12 avant). Nouveau : 1 000 avalements → 4 traces `info,warning,warning,warning`,
toutes silencieuses, messages ×10/×100/×1000 ; **section F : le VRAI `logError` exécuté** (extrait du source avec
`_errShouldSend` et `_ERR_SEND_LVL`, doublures pour l'écran) — un `warning` silencieux ne peint aucun toast **et** part vers
`fbAppendError`, une `info` ne part pas, un `warning` ordinaire (témoin) peint toujours son toast. Contre-épreuve **6/6
injectés, 14 rouges** ; l'injection « `logError` ignore `silencieux` » seule rougit F.
★ **Piège rencontré** : l'assertion D (`logError` n'appelle pas `_mvAvale`) cherche le nom dans le corps. Mon commentaire dans
`logError` le citait → rouge. Reformulé. *Un test par recherche de texte lit aussi les commentaires.*

### 212d. Ouvert

① La valeur arrive **à l'usage** : c'est le journal GT qui dira, dans quelques jours, quels emplacements produisent des
« ×10 ». C'est le lot de tri que §132 attendait. ② Les 17 `catch` encore vides (pilotage 10) ne sont pas touchés. ③ Aucun
rendu navigateur (le changement ne peint rien, par construction).

## 213. ★★ GNR-M — LE TRACTEUR SE PROJETTE SUR LES TRAVAUX EN COURS, LA CONSO DE CHAQUE TRACTEUR EST MESURÉE (03/10 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE pilotage, MV_INFO ×4) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-gnr-mesure.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.92 → 7.93, SW 8.67 → 8.68**, base `61f4ccd`)

### 213a. D'où ça vient

Série « densifier le Pilotage » (maquette validée le 03/10, `maquette-pilotage-densite.html`, trois versions). Premier lot de
six : GNR-M. Les autres (SPARK, TENS, TOUR, CARTE, PROT + INACTION) sont au §28.
**Trois corrections de modèle en route — c'est elles qui font le lot :**
1. ★★★ **Il n'existe aucune heure tracteur « au planning ».** La maquette v2 projetait la cuve sur « les heures du planning × la
   conso » : une entrée de planning porte des heures **par personne**, jamais une activité ni une machine, et le simulateur ne
   mesure qu'un ETP tracteur global. Dit par Claude, vérifié dans le code, **avant** Nico.
2. ★★★ **La règle de Nico** : *« quand un travail est mis en place il faut que tout le domaine soit fait (que tu peux avoir par
   rapport aux parcelles déjà validées) — exception pour amendement où nous sélectionnons les parcelles avant »*. Cette règle
   **existait déjà** dans le code : c'est le calcul de la barre d'avancement d'une session (`renderSessionProgress`). Une seule
   définition du « reste » : non arrachées, hors `parcellesSkip`, moins `parcellesFaites`.
3. ★★ *« une fois le travail sur le domaine terminé tu retires la ligne »* : on lit le **statut** (« Terminé », posé seul à la
   dernière parcelle ou à la main), et on écarte aussi tout travail sans reste. ⚠️ On ne recalcule JAMAIS le reste des vieilles
   sessions contre les parcelles d'aujourd'hui : une parcelle plantée depuis les ferait revenir (le piège §168 ⑦).

### 213b. Ce qui change

- **Aujourd'hui › Alertes matériel** (`_pilCkAlertes` → `_pilCkTracteur`) : la liste ne garde que les machines immobilisées ;
  la révision et la cuve deviennent des cartes. Sans carte ni immobilisation, la phrase de calme reste — jamais à côté d'une
  carte qui dit le contraire.
  - **Travaux tracteur en cours** : une ligne par session « En cours » de la campagne (`_sessInSaison`), reste en ha sur
    l'échelle du domaine, heures = reste × barème h/ha de l'activité, litres = heures × conso du tracteur (session, sinon
    tracteur par défaut). Sans barème : tiret, jamais zéro. Session sans parcelle cochée depuis plus de 21 jours : signalée,
    toujours comptée (règle de Nico).
  - **Amendement** : la session « Amendement » n'est JAMAIS un périmètre (elle affiche tout le domaine) ; on lit les apports
    (`INTRANTS.fertil`) de la campagne, leurs parcelles en attente dans `_ferFaits`. L'apport compte dès sa création ; la
    session ouverte ne sert qu'à savoir quel tracteur le fait. Nom de l'activité recopié dans `_PIL_GM_FER`, **épinglé** au
    `FER_ACT` de `phyto.js` par le harnais (pas de nouvel export dans un module de 150 ko).
  - **Révision** (`_pilGmRevision`) : les travaux du tracteur bout à bout, dans l'ordre de lancement ; le trait tombe dans le
    travail pendant lequel la révision est atteinte. Priorité : dépassée, puis atteinte dans les travaux, puis la plus proche
    (au-delà de 120 h et hors travaux : pas de carte, comme l'ancienne alerte). Repère en jours = rythme mesuré (heures notées
    sur 28 jours ÷ jours ouvrés), dit comme un repère.
  - **Cuve** : cascade niveau − litres de chaque travail → ce qu'il restera, face au seuil. Échelle : de zéro à un peu au-dessus
    du niveau (ou du seuil), arrondie — ★ la capacité écrasait tout (410 L sur 1 500 = un quart de barre, un travail de 5 L =
    un trait), **vu à l'œil sur une capture**, aucun harnais ne l'aurait dit.
- **L'équipe & le matériel › Consommation mesurée** (`_pilPanelConso`, clé `mat_conso`) : par tracteur, Σ litres des pleins ÷
  Σ heures notées entre eux (`_pilGmConso`). Le plein n°2 rembourse ce qui a brûlé depuis le n°1 : jours APRÈS le plein
  précédent, jusqu'au jour du plein INCLUS (un plein n'a pas d'heure — l'ambiguïté ne joue qu'aux deux bouts). Premier plein =
  départ. Deux pleins le même jour = un. Intervalle sans heure = écarté et compté ; plein sans litres = compté à part. Heures =
  `dmin` (chrono) sinon surface × barème — la règle de `_ecoTracHByParc`. Il faut 2 intervalles et 10 h, sinon repli sur le
  réglage `conso_gnr_lh`, et l'écran le dit.

### 213c. Mesuré

`mv-harnais-gnr-mesure.mjs` (neuf, branché dans la liste) : **45 assertions**, bloc extrait du vrai `pilotage.js` avec ses
helpers réels (`_pilTile`, `_ecoCfg`…), horloge figée. **9 contre-épreuves, 9 rougissent** (désactivées recomptées, statut
ignoré, session Amendement périmètre, jour du plein recompté, moyenne non pondérée, apport recompté, travail fini maintenu,
apport d'une autre campagne, arrachées comptées). Rendu regardé en vrai (Chrome, CSS réel, 1 100 px et 390 px).

### 213d. Leçons

- ★★★ **Une règle métier dictée existe souvent déjà dans le code, sous un autre nom.** « Tout le domaine doit être fait » =
  `renderSessionProgress`. La reprendre telle quelle évite deux définitions du « reste » qui divergeraient.
- ★★ **Une échelle « vraie » peut être illisible.** La capacité de cuve était la référence la plus juste et la moins utile :
  l'échelle commune se choisit pour l'écart qu'on veut lire, et se dit (l'axe porte ses bornes, la capacité est écrite).
- ★ **Un numéro de section se lit dans l'index, pas dans la conversation** : ce lot s'est d'abord appelé « §206 » — déjà pris
  par ARRACH-3. Rattrapé avant livraison.

### 213e. Ouvert

① **À l'œil chez Nico** : les cartes sur son téléphone, avec ses vraies sessions et ses vrais pleins — en particulier la part
chronométrée et des intervalles écartés. ② La conso est celle du **tracteur**, pas du travail (pulvé et griffage au même L/h). ③ Le
**traitement conseillé** en pointillé dans la cuve (maquette v3) n'est pas fait : il demande de relier la carte « Traiter ? » à
une activité de pulvérisation. ④ Heures restantes au barème ; le rythme chronométré de chaque session pourrait les affiner.

## 214. ★ SPARK-1 — LA CADENCE A SA PETITE COURBE, ET LE MOTEUR DE GRAPHE SAIT LES FAIRE (03/10 — `src/utils.js` (`_mvGraphSpark`, APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.spark`) · `src/pilotage.js` · `src/styles.css` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-spark.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.93 → 7.94, SW 8.68 → 8.69**, base `61f4ccd` + GNR-M non poussé)

### 214a. Ce qui était demandé, et ce que les données permettent

Deuxième lot de la série « densifier le Pilotage » (maquette v2) : une petite courbe de 14 jours à côté de **quatre** chiffres
du bandeau, en écart à leur référence, même bande ±30 %. **Inventaire avant d'écrire — un seul des quatre a un historique daté :**
- **Cadence équipe** : oui. `_planTeamCadence(deb, fin)` (planning.js) mesure n'importe quelle fenêtre — c'est déjà la source du KPI.
- **Charge restante** : **non.** `calcHeures` ne connaît que l'état du jour ; reconstruire le reste d'il y a dix jours demanderait
  de rejouer les validations au barème, c'est-à-dire une **seconde définition** du « fait » à côté de celle de `calcHeures`
  (étapes, sélections SEL-1, densité…). Elles divergeraient.
- **Budget consommé** : **non.** `_pecData()` calcule un état, pas une série ; l'avancement d'il y a dix jours n'existe nulle part.
- **Tension** : c'est le lot TENS.
- **Colonnes de la tâche prioritaire** : **écartées.** Le temps réel (`_ecoTvEvents`, PAR-1) verse les heures **à la validation** :
  un jour de validation ramasse les jours d'avant. Des colonnes par jour montreraient des pics là où il n'y a eu qu'une saisie.
Le moteur le dit lui-même : *« un graphe non alimenté ne trace JAMAIS une ligne plate ni un zéro »*. Le lot est donc réduit à la
cadence, et la question d'un **relevé quotidien** est posée à Nico (§28).

### 214b. Ce qui change

- `window._mvGraphSpark(vals, o)` (utils.js, après `_mvGraphSvg`) : la petite courbe sur le moteur commun (`_mvGraphCadre` +
  `_mvGraphSvg`, couleurs `MV_GRAPH_COL`). Des **écarts en %**, jamais des valeurs brutes ; bande `MV_SPARK_BANDE` = ±30 %, le
  point se colle au bord ; `null` = trou qui **coupe** la courbe ; moins de deux mesures = `''` ; vert si favorable ou à moins de
  3 %, orange sinon ; référence en pointillé `prevu` au milieu ; aucun texte dans le SVG.
- `_pilSparkCadence(m)` : 14 points, chacun = cadence des **7 jours** qui finissent ce jour-là, comparée à `m.cadH` (4 semaines,
  le chiffre affiché). Cadence estimée (pas de planning) : rien. La ligne de cadre ajoute « 7 derniers jours : −9 % ».

### 214c. Mesuré

`mv-harnais-spark.mjs` : **19 assertions** (primitive extraite AVEC son moteur ; `_planTeamCadence` doublé avec SA signature et
ses appels enregistrés : fenêtres de 7 jours, dernière = aujourd'hui) ; **7 contre-épreuves, 7 rougissent**. Rendu regardé (Chrome,
CSS réel) : à −9 % sur une bande de ±30 % la courbe est presque plate — c'est le prix d'une bande commune, et c'est voulu.

### 214d. Ouvert

① **Le relevé quotidien** (question à Nico, §28) : sans lui, Charge restante et Budget n'auront jamais de courbe. ② La bande
±30 % est peut-être trop large pour la cadence — à juger sur les vraies données, sans casser l'échelle commune.

## 215. ★★ TENS-1 — LA TENSION DE L'ÉQUIPE, FACE AU PLANNING PRÉVU, JAMAIS AU CONTRAT (03/10 — `src/planning.js` · `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.tension` + `pil.spark`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-tension.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.94 → 7.95, SW 8.69 → 8.70**, base `61f4ccd` + GNR-M + SPARK-1 non poussés)

### 215a. Le modèle, corrigé dès la maquette

La proposition d'origine comparait les heures faites aux **heures du contrat** : faux en annualisation, où une semaine haute est
**prévue**. La maquette v2 a remplacé le contrat par le **planning prévu** ; Nico a validé. Restait à trouver ce « prévu » dans le
code : c'est la **grille du modèle** (`_planDayH(plId, m, d, null, yr)` — la journée SANS la saisie), et le « fait » est le
**travail effectif** (`_planWorkH`, saisie comprise : la base licite des durées maximales). Aucune fonction du planning ne rendait le
prévu sur une fenêtre : `_planRangeH_` reçoit un 4e mode, `'prevu'`, et `_planPrevuPersRange` est exposé. Le cadre légal existait
(`_planLegal`, réglable par convention, déjà appliqué semaine par semaine dans la fiche du salarié) : exposé tel quel.
★ **Le « plafond de deux semaines » de la maquette (2 × 48 h) n'existe pas en droit** : le maximum est **par semaine**. Le lot lit la
semaine la plus chargée des deux dernières (lundi-dimanche, la courante jusqu'à aujourd'hui) avec **les repères de la fiche** :
au-delà de la moyenne (44 h) = à surveiller, au-delà du maximum (48 h) = rouge.

### 215b. Ce qui change

- `_pilTensData(d)` (mémorisée sur `d` le temps d'un rendu) : par personne (ni bureau, ni collective), fait et prévu sur 14 jours,
  écart, semaines ; **au seuil** = +10 % au prévu (`_PIL_TENS_SEUIL`) ou semaine > moyenne ; rouge = semaine > maximum. Sans prévu,
  l'écart est `null` (tiret), jamais 0 %. La série de la petite courbe = l'écart de l'équipe sur 7 jours glissants.
- Bandeau : **Tension équipe** (clé `auj_tension`), avec sa petite courbe (`_mvGraphSpark`, haut = défavorable).
- La décision du jour : **Tension de l'équipe**, une ligne par personne, barre du fait et trait du prévu sur une échelle commune,
  semaine chargée écrite sous le nom, bouton **Planning ›** (nouvelle cible `planning` de `_PIL_DIAG_CIBLES`).

### 215c. Mesuré

`mv-harnais-tension.mjs` : **27 assertions** (vrai `_planRangeH_` extrait, voisins doublés et appels enregistrés : `'prevu'` passe
`e = null` ; bloc TENS extrait, planning écrit à la main sous horloge figée) ; **8 contre-épreuves, 8 rougissent**. ★ Deux erreurs
du **harnais**, aucune du code : une assertion de tête qui oubliait un jour de Léa dans la fenêtre (le code avait raison), puis une
contre-épreuve devenue **muette** une fois l'assertion corrigée — Victor passait le seuil par l'écart ET par la semaine, retirer
l'une des deux règles ne changeait rien. Un cas « au seuil par l'écart seul » (Marc) l'a rendue utile. Rendu regardé (390 px).

### 215d. Ouvert

① **À l'œil chez Nico** : ses vraies personnes, et la saison où la modulation est haute — c'est là qu'on verra si +10 % est le bon
seuil. ② Le planning ne dit pas l'activité : cave et atelier comptent dans le fait.

## 216. ★ TOUR-RDT — LE RENDEMENT DE LA TOURNÉE, SUR LA MÊME SIMULATION (03/10 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.dzrdt`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-tournee-rdt.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.95 → 7.96, SW 8.70 → 8.71**, base `61f4ccd` + GNR-M, SPARK-1, TENS-1 non poussés)

### 216a. Ce qui existait déjà

La tournée du jour (Décider) simulait déjà tout ce qu'il fallait : `_dzSimuler` pose, jour après jour, le travail
(personnes-heures ÷ effectif) et les trajets (`_dzHop`, temps de **calendrier** de l'équipe : tout le monde se déplace) dans
la journée de chaque jour (`used` sur `J`). Le résultat affichait le premier jour (surface, travail, trajets). Rien ne disait
la part du temps perdue en route sur toute la tournée, ni ce que coûtait l'ordre choisi. ★ **Aucun second calcul** : le rendement
lit `C.sim` ; la comparaison relance la même `_dzSimuler` sur l'ordre du tri « Au plus proche » (`_opNNNames`), déjà proposé.

### 216b. Ce qui change

- `_dzCoutJour(d, ctx)` : Σ heures × effectif × taux à la date (`_mvPaieTauxEffAt`) ; taux moyen (`_ecoRate`) pour qui n'en a
  pas et pour les personnes sans nom (renfort `ctx.R`, équipe anonyme `ctx.anon`) ; aucun taux lisible → `null`, jamais 0.
- `_dzRdtSim` : temps utile = (used − trajets) ÷ used ; trajets répartis à pied / en camion / estimés sans GPS ; coût = coût du jour
  × **part du jour occupée** (le dernier jour, l'équipe passe à autre chose) ; revient/ha = coût ÷ surface.
- `_dzRendementHtml` sous le résultat : barre (vert parcelles, terre à pied, orange camion, hachuré sans GPS), trois chiffres,
  tableau « Ordre actuel / Au plus proche » (meilleur en gras, sans couleur), bouton « Prendre l'ordre au plus proche » (même
  `data-op="sort"` que le tri, admin seulement) ; ordre déjà le plus proche : une phrase.

### 216c. Mesuré

`mv-harnais-tournee-rdt.mjs` : **20 assertions**, attendus posés à la main sans relire la simulation (utile = 10,5 h ÷ (10,5 h +
trajets) ; coût = taux × heures × part du jour) ; **7 contre-épreuves, 7 rougissent**. Rendu regardé (390 px). Une assertion
écrite avec un « ou » de repli (deux formules acceptées faute d'avoir compté les jours) a été réécrite : une assertion qui accepte
deux réponses n'en vérifie aucune.

### 216d. Ouvert

① Le revient/ha est la **main-d'œuvre du travail coché** seule (ni carburant ni produits) — c'est dit dans la fiche. ② La
comparaison ne propose que « au plus proche » ; « par commune » pourrait suivre si Nico le juge utile.
③ ⚠️ **`pilotage.js` 800 → 846 ko** sur les quatre lots de la série (GNR-M, SPARK-1, TENS-1, TOUR-RDT), chacun sous 5 % mais
le cliquet de taille mesure depuis le dernier push : rouge au contrôle complet. **Seule la ligne `ko` de `pilotage.js`** est
regravée dans `typo-baseline.json` (pas `--baseline` complet, qui avalerait la croissance des autres modules — leçon §202).
Question du découpage posée : la série « densifier » pourrait vivre dans un module à part si CARTE et PROT ajoutent encore.

## 217. ★ CARTE-1 — LA CARTE DU DOMAINE SE LIT DE CINQ FAÇONS, CHACUNE À SA SOURCE (03/10 — `src/pilotage.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.carte`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-carte-vues.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.96 → 7.97, SW 8.71 → 8.72**, base `61f4ccd` + GNR-M, SPARK-1, TENS-1, TOUR-RDT non poussés)

### 217a. Le principe

La carte Leaflet de La campagne (`_pilBuildMap`) ne savait peindre qu'une chose : l'avancement (`getPCls`). Cinq vues, et
**aucune ne recalcule** : avancement = `getPCls` ; dernier traitement = la date la plus récente du **registre** (`TRAITEMENTS`, toutes
campagnes — la protection ne s'arrête pas au changement de campagne) ; cépage = `p.cepage` (comparé sans accents ni casse) ;
passages = `_cfmPassages()` + `_cfmIftRef()`, **la règle de la Conformité** (une session = un passage ; des passages, pas un IFT) ;
coût = `engHa` des lignes de `_pecData()`, la vue Parcelles de l'Économie (arrachées hors de l'échelle).
**Un vide est gris, un zéro a sa couleur** : zéro passage est une mesure ; une parcelle absente du tableau de l'Économie, non.

### 217b. Ce qui change

`_PIL_LENT` (vue courante, en mémoire), `_pilLentPrep()` (ce que la vue lit, **une fois par rendu**, partagé par la tuile et la
carte via `_PIL_LENT_PREP`), `_pilLentCol(p, o)` (couleur + texte du popup), `_pilLentBtns()` (cinq boutons, `aria-pressed`),
`_pilLentLeg(o)` (légende propre à la vue, « sans donnée » toujours dite). Contours KML, épingles et regroupements par commune
passent tous par `_pilLentCol`. La tuile gagne sa fiche « i » (`pil.carte`).

### 217c. Mesuré

`mv-harnais-carte-vues.mjs` : **23 assertions**, vraies sources de la Conformité extraites ; **7 contre-épreuves, 7 rougissent**.
★ **Vu à l'œil, pas par un harnais** : la légende des cépages affichait le cépage d'une vigne **arrachée** (le registre des cépages
partait de toutes les parcelles). Corrigé, épinglé par une assertion et une contre-épreuve.

★★ **Le contrôle complet a rendu quatre rouges que les harnais du lot ne voyaient pas**, tous dans le code neuf, tous corrigés :
ESLint `no-redeclare` (un `var lc` repris pour le barycentre d'un polygone) ; C19 du preflight (`o.ref` — `ref` est un nom de champ
surveillé, même porteur d'un nombre : renommé `refIft`) ; le jeton `--shadow-sm` sans repli ; et deux caractères hors du sous-ensemble
de police (`\u0300`/`\u036f` d'une normalisation recopiée : `_friseNorm` existait, une seule normalisation désormais). **Un harnais
vert sur le sens ne dispense jamais du contrôle complet** — et un bloc recopié d'un autre module amène ses propres cliquets.
⚠️ Le rendu Leaflet (polygones repeints, bulles) n'a pas été regardé dans un navigateur : les boutons et la légende seulement.

### 217d. Ouvert

① La vue choisie n'est pas mémorisée d'une session à l'autre (elle revient sur l'avancement) — à mémoriser si Nico le souhaite.
② Sur téléphone, les cinq boutons défilent : la vue active peut sortir de l'écran.

## 218. ★★ PROT-1 + INACTION-1 — LA PROTECTION RESTANTE PAR PARCELLE, LE COÛT DE L'INACTION SUR LE COCKPIT (03/10 — `src/pilotage.js` · `src/reglages.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.prot` + `pil.inaction`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-protection.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.97 → 7.98, SW 8.72 → 8.73**, base `61f4ccd` + les cinq lots précédents non poussés)

### 218a. Les valeurs, vérifiées avant d'écrire

Nico : *« Go sur tes reco »*, après vérification dans les textes (étiquettes Nufarm/Adama/Syngenta/Corteva, IFV, Chambres
d'agriculture, guides bio) : **contact 10 j** (étiquette cuivre : couverture tous les 8-10 j selon climat, lessivage et pousse ;
sans pluie ni pousse on peut attendre 25 j), **pénétrant 12 j** (cymoxanil seul 5-6 j mais en cadence 10-12 avec son cuivre ;
mandipropamid 12-14 j), **systémique 14 j** (phosphonates, méfénoxam, Zorvec : 14 j, à resserrer à 10-12 sous pression ; IFV Nîmes :
21 j possibles sur oïdium). **Lessivage : 20 mm cumulés pour un CONTACT seulement** (la moitié part dans les 5 premiers mm) ; un
pénétrant ou un systémique est à l'abri 1 à 2 h après l'application. Ma première proposition disait contact 7 j : trop court.

### 218b. Ce qui change, et ce qui est écarté

- **Réglages › Pilotage › Conformité** : trois champs `prot_contact_j / prot_penetrant_j / prot_systemique_j` (`CONFIG.conformite`,
  groupe `'prot'` de `_ecoCfgSet`, clé vérifiée). Vides = défauts 10 / 12 / 14.
- **Mode d'action** (`_pilProtType`) : déduit de la **substance active** (`p.sub`, E-Phy), sinon du nom, par trois listes de
  mots ; rien de connu → **contact**, la rémanence la plus courte, et `deduit:true` (un « ? » à l'écran). Un mélange protège
  comme son produit **le plus rémanent** (c'est ainsi que les étiquettes des mélanges cuivre + cymoxanil sont cadencées).
- **Protection restante** (`_pilProtData`, `_pilProtHtml`) dans la carte « Traiter ? » : par parcelle active, le dernier
  traitement du registre, reste = rémanence − jours ; « jamais traitée » en tête, puis à nu, puis les plus proches ; chiffre : N à
  nu, ha sans protection, N à nu d'ici 2 jours.
- ⚠️ **ÉCARTÉ, et dit à la fiche : le lessivage et la pousse.** L'appli n'enregistre **pas la pluie tombée** : le relevé météo
  quotidien du journal (`meteo:true`) porte température, vent, ciel — pas les millimètres — et les prévisions horaires ne remontent
  que 24 h. Un réglage « 20 mm » sans donnée de pluie serait un réglage sans effet : non posé. Lot **PLUIE-1** au §28.
- **Coût de l'inaction** (`_pilCkInaction`, clé `auj_inaction`) sous la marge : `_rfSim` du contexte de `_rfPair` avec un **profil
  vide** — exactement ce que la carte renfort de Décider affiche déjà en « sans renfort » ; `induit` × `ctx.rate`, le `k_retard`
  écrit à côté, bouton vers Décider (cible interne `renfort` de `_pilGo`). Campagne finie, sans taux ou qui boucle : rien, ou
  « Rien à rattraper ».

### 218c. Mesuré

`mv-harnais-protection.mjs` : **21 assertions** (bloc extrait, horloge figée ; le VRAI `_ecoCfgSet` de reglages.js exécuté ;
`_rfSim` doublé avec sa signature) ; **8 contre-épreuves, 8 rougissent**. Une assertion fausse (une espace fine dans « 4 922 € »
rendue par `toLocaleString`), le code avait raison. Rendu regardé (390 px).
★ **Le contrôle complet a rendu trois cliquets rouges**, corrigés : un `≈` hors du sous-ensemble de police (→ « env. »), un
`font-weight:400` et un rayon de 12 px (un pas) dans le CSS neuf, et trois tailles en px en dur copiées de la ligne IFT des réglages
(→ jetons `--pt-*`). Même leçon qu'au §217 : copier une ligne voisine, c'est copier sa dette.

### 218d. Ouvert

① **PLUIE-1** : enregistrer la pluie du jour (Open-Meteo `daily.precipitation_sum`, `past_days`) dans le relevé météo du journal,
puis appliquer le lessivage (contact : 20 mm cumulés, moitié à 5 mm). ② Rémanence **par produit** (le catalogue local) pour les
cas où la substance ne suffit pas. ③ La pousse n'est pas mesurée : un stade phénologique pourrait la remplacer.

## 219. ★ PHOTO-1 — LA PHOTO QUOTIDIENNE DES CHIFFRES DU COCKPIT, ET LES DEUX COURBES QU'ELLE PERMET (03/10 — `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.spark`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-photo.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **APP 7.98 → 7.99, SW 8.73 → 8.74**, base `61f4ccd` + six lots non poussés)

### 219a. La décision

§214a : la Charge restante et le Budget n'avaient aucun historique daté. Question posée, Nico : *« Go sur tes reco »* — une photo
par jour, dans la configuration du domaine (déjà écrite par l'admin : aucune règle Firestore nouvelle), 60 lignes, rien de
rétroactif. `CONFIG` est chargé en entier (`window.CONFIG = value`) et `_fbClone` ne neutralise que les tableaux imbriqués : un
tableau d'objets `{d, reste, cons, avc}` passe.

### 219b. Ce qui change

- `_pilPhotoEcrire(d)` au rendu d'Aujourd'hui : **admin**, **période active** (`_pilSaison().nom === getSaisonActive().nom` — une
  archive consultée ne photographie rien), **une fois par jour** (jamais réécrite : le chiffre du matin fait foi), lignes futures ou
  sans date écartées, tri, 60 au plus, `saveData('config')` (le verrou de chargement anti-perte est le sien). ★ « Regarder n'écrit
  pas » (§168) reste la règle ; ici l'écriture est le BUT, décidé, borné à un geste par jour.
- `_pilSparkCharge(d)` : écart % à la **première photo de la fenêtre** (descendre = favorable) ; `_pilSparkBudget(E)` : **consommé −
  fait, en points** (zéro = le budget suit le travail). Dans les deux, le point du jour est la **valeur en direct**, photo ou pas ;
  un jour sans ouverture est un trou. Sur `_mvGraphSpark` (§214), rien sous deux points.

### 219c. Mesuré

`mv-harnais-photo.mjs` : **15 assertions** (vrai `_pilSaison` extrait, `saveData` compté) ; **7 contre-épreuves, 7 rougissent**. Une
assertion fausse (le compte des lignes gardées sur 81), le code avait raison.

### 219d. Ouvert

① La courbe n'existera qu'après deux ouvertures d'Aujourd'hui par un admin : à regarder chez Nico dans quelques jours. ② La
référence de la charge est « il y a 14 jours », pas la trajectoire du plan — celle-ci n'existe pas sous forme datée.

## 220. ★ PLUIE-1 — LA PLUIE TOMBÉE DEPUIS LE TRAITEMENT LESSIVE LES CONTACTS (03/10 — `src/app.js` · `src/pilotage.js` · `src/reglages.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE, MV_INFO `pil.prot`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-protection.mjs` (étendu) · **APP 7.99 → 8.00, SW 8.74 → 8.75**, base `61f4ccd` + sept lots non poussés)

### 220a. Le choix : lire la pluie, pas la stocker

§218b l'avait écarté faute de donnée. Trois voies : ① ajouter `past_days` à l'appel météo principal — **non** : ce code lit
`daily[0]` comme « aujourd'hui » (probabilité de pluie, gel), un décalage de 15 jours casserait l'accueil ; ② écrire les mm dans le
relevé météo quotidien du journal — une donnée de plus en base, écrite le matin alors que la journée n'est pas finie ; ③ **un appel
Open-Meteo à part** (`_pluieCharger`, app.js : `daily=precipitation_sum&hourly=precipitation&past_days=15&forecast_days=1`),
rien en base, cache local d'une heure. Retenu : ③. Quinze jours suffisent — au-delà, la rémanence la plus longue (14 j) est déjà
passée. ★ **Le jour même ne vaut que ses heures passées** (`_pluieLire`) : la somme quotidienne d'Open-Meteo contient la prévision
du soir ; sans heures, le jour est **inconnu**, pas prévu.

### 220b. Ce qui change

- `_pilProtPluie(date, pl, auj)` : Σ mm des jours **après** le jour du traitement jusqu'à aujourd'hui ; un jour manquant → `null`
  (inconnu), jamais zéro. Un **contact** avec reste > 0 et pluie ≥ `prot_lessivage_mm` (réglage, 20 par défaut, 4e champ de la
  carte Conformité) passe `lessive`, reste 0, et la ligne dit « lessivée · 28,5 mm ». Pénétrants et systémiques : pas de lessivage
  (à l'abri 1-2 h après, §218a). La carte demande la pluie une fois par heure (`_pilPluieDemander`) et se repeint quand elle arrive ;
  sans relevé : « pluie inconnue, les jours seuls ».

### 220c. Mesuré

`mv-harnais-protection.mjs` étendu : **32 assertions** (`_pluieLire` extraite d'app.js sur une réponse Open-Meteo écrite à la main ;
F lessivée à 28,5 mm, G à 7 mm encore protégée, pénétrant non lessivé, jour manquant → inconnu, seuil réglé à 30 mm) ; **12
contre-épreuves, 12 rougissent** (dont : le jour du traitement compté, un jour manquant compté zéro, le jour même pris en prévision
entière). Deux assertions fausses (deux jours de pluie oubliés dans l'attendu ; une ancre déplacée), le code avait raison.

### 220d. Ouvert

① **Aucun navigateur** : l'appel réel à Open-Meteo et le repeint de la carte à l'arrivée de la pluie sont à regarder chez Nico.
② La « moitié dans les 5 premiers mm » n'est pas modélisée : seuil unique. ③ L'heure du traitement face à une pluie dans les 2 h.

## 221. ★ TRAIT-CUVE — LE TRAITEMENT CONSEILLÉ, CHIFFRÉ DANS LA CUVE ; LE QUOI DE NEUF SPÉCIAL « MA VIGNE PRÉVOIT » (03/10 — `src/pilotage.js` · `src/utils.js` (APP, WHATS_NEW spécial, MV_INFO `pil.trxgnr`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` (intro de section) · `scripts/mv-harnais-gnr-mesure.mjs` (étendu) · **APP 8.00 → 8.01, SW 8.75 → 8.76**, base `61f4ccd` + huit lots non poussés)

### 221a. Le croisement

Trois cartes se lisent ensemble : la **protection restante** (des parcelles à nu, ou qui le seront d'ici deux jours — §218, §220),
la **fenêtre de traitement** (un créneau dans les cinq jours — `_pilTreatDays`) et le **tracteur** (`_pilGmTravaux` : domaine, conso
par tracteur). `_pilGmTraitementOption` n'existe que si les trois disent oui : alors la cuve reçoit « − Traitement (conseillé) » en
pointillé et « Avec ce traitement », au barème h/ha de l'**activité de pulvérisation** — trouvée par son nom (« trait », « pulv »)
ou par son tracteur `traitementOnly`. Déjà une session de ce travail en cours → elle est dans les travaux, pas de pointillé. Pas
d'activité, pas de barème, pas de fenêtre, rien à nu : rien. ★ **Une ligne « et si » reste en pointillé et hors des totaux** :
elle sert à commander le plein, pas à compter.
★★ **Correction de Nico (dictée, 03/10)** : *« ça dépend si les traitements se font sur 4 rangs, 6 rangs, 8 rangs, la façon dont le
tracteur avance »*. Un barème h/ha ne le sait pas. `_pilGmHhaMesure(activité)` prend d'abord la **cadence mesurée** sur la campagne —
minutes chronométrées ÷ hectares chronométrés des sessions de l'activité (une parcelle sans `dmin` ne compte pas), au moins 0,5 ha —
qui porte la vraie façon de faire du domaine ; le barème est le repli, et le cadre dit lequel des deux parle.
★★ **Interrupteur éteint** : `CONFIG.features.trait_cuve === true` seulement. Nico veut laisser l'équipe s'approprier le nouveau
Pilotage une quinzaine de jours et garder cette ligne pour l'été. Le code est là, testé, et le Quoi de neuf 8.01 **n'en parle pas**.

### 221b. Le Quoi de neuf spécial

Demandé par Nico (dicté) : un bloc de tête qui dit que **cette version est spéciale**, que le Pilotage a été repensé pour tirer le
meilleur des prévisions possibles, que la puissance de calcul le permet, que tout est dans le guide, qu'il faudra un temps de prise
en main, qu'il peut rester des erreurs à remonter, et qu'il reste à disposition — signé Nico, GUERETTECH. Relu par Nico : « une
quinzaine de jours » de prise en main, « d'autres surprises plus tard », et **rien sur la cuve** (gardé pour l'été). Seul item de 8.01
(`_whatsNewSince` donne ensuite le récap cumulatif des neuf blocs à qui vient de 7.92). Le guide reçoit une **intro de section**
Pilotage, « Octobre 2026 — le Pilotage prévoit », qui dit où trouver chaque nouveauté.

### 221c. Mesuré

`mv-harnais-gnr-mesure.mjs` étendu : **52 assertions** (option présente : domaine × cadence MESURÉE 1,33 h/ha × 6 L/h, fenêtre et
source écrites ; repli barème sous 0,5 ha chronométré ; absente sans parcelle à nu, sans fenêtre, si le traitement est déjà lancé, ou
interrupteur éteint) ; **14 contre-épreuves, 14 rougissent** (dont « la cadence mesurée est ignorée », « une parcelle sans chrono
compte », « l'interrupteur ne retient plus rien »).
★ **Le contrôle complet a rattrapé deux choses** : les quatre affichages de version d'`index.html` et le bump SW n'avaient PAS été
posés — le script de patch s'était arrêté sur une ancre fausse AVANT ces lignes, et ses « ok » précédents ne couvraient que ce qui
précédait (le piège du §25, deux « ok » pour zéro octet) ; et `utils.js` 692 → 728 ko sur les neuf lots (seule sa ligne `ko`
regravée dans `typo-baseline.json`, comme pour `pilotage.js` au §216).

### 221d. Ouvert

① Allumer `CONFIG.features.trait_cuve` à l'été, avec son Quoi de neuf (texte prêt au §221b d'origine, à redire). ② Fin de la série : les neuf
lots §213-221 sont dans un seul zip tant que `61f4ccd` reste la base — **à déployer et à regarder en vrai avant tout lot suivant.**

## 222. ★★ COH-1 — UN MÊME CHIFFRE, UN MÊME NOM, UNE MÊME SURFACE SUR TOUS LES ÉCRANS (03/10 — `src/app.js` · `src/pilotage.js` · `src/utils.js` · `src/styles.css` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-coh1.mjs` (neuf) · `scripts/mv-harnais-arrachage.mjs` · `scripts/mv-harnais-arrach3.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **publié en APP 7.93 / SW 8.68 dans `75107ff`, recollé en APP 8.02 / SW 8.77** — voir §223, base `61f4ccd`)

### 222a. D'où ça vient

Cinq captures de Nico (03/10) : « Avancement par tâche » du Pilotage à `Arrach. 0 % · 0/0 h` pendant que la liste montrait les
mêmes parcelles à 50-75 % ; la carte du domaine qui recouvre la barre du bas sur PC ; « Reparation », « Brulage » sur les puces
de Parcelles et « Répar. » au Pilotage ; « 0,087 · 0,1144 · 11,50 · 12 ha » ; « Champitenois Petite…. » ; « 50 % · 0/1 tâches ».
Plus deux demandes de fond (graphiques homogènes, renfort sans heures sup) découpées en lots 2 et 3 (§28). Ce lot-ci est le
lot 1, sans maquette : il ne change aucune mise en page, il rend les chiffres et les mots cohérents.

### 222b. Ce qui change

- **L'arrachage, une seule règle.** `_mvTFaite(p, nom)` (app.js, juste avant `calcHeures`) : 1 si validée ; arrachage découpé →
  `_arrFraction(p)` (ARRACH-7) ; 0 sinon. La branche « tâche simple » de `calcHeures` ne connaissait que « Validé » — et
  réécrivait `TRAVAUX[nom]` derrière `recalcTravaux`, si bien que le chiffre gagnant dépendait de l'ordre d'affichage. Les
  lignes rendues portent `surf_done` / `surf_total` (branche simple et entreplantation sans trous).
- **Sans barème, en surface.** `_pilBarQte(t)` (Pilotage) et `_qte(t)` (carte de l'Accueil) : heures si `h_total > 0`, sinon
  surface faite / concernée, sinon un tiret. Plus de « 0/0 h ».
- **Le compte suit le pourcentage.** `getPCls` rend `part` (la part d'arrachage, en plus) ; `_pvNbFait` / `_pvCompte` écrivent
  « 0,5/1 tâche », « 1,5/2 tâches ». `nbDone` reste entier (le harnais ARRACH-7 le lit).
- **Les cartes du Pilotage restent chez elles.** `.pil-map` et `.pil-dz-map,.pil-dz-svg` : `position:relative; z-index:0` —
  le remède de `#map-container` (Parcelles), jamais appliqué ici. Les panneaux Leaflet (jusqu'à 1000) passaient au-dessus de
  `#mv-dock` (90). `.pil-dz-fm` (carte agrandie, fixe à 400) n'en avait pas besoin.
- **Un seul nom.** `utils.js` : `TLIB` + `tLib(nom)` (clé → nom entier accentué ; une tâche du domaine garde son nom),
  `tNom` = `tLib` (le défaut, partout), `tAbr` = `TABREV` puis `tLib` (forme courte, seulement la colonne de 72 px de la carte
  de l'Accueil). `TABREV` : « Ébourg. ». Passent par `tNom` : puces de filtre, puces des cartes de parcelle, liste des travaux
  de la fiche, menu des tâches, ligne du journal (qui lisait `TABREV` en direct — retiré, avec son import).
- **Les surfaces.** `_pvSurfFr` : 4 décimales (le centiare). Les 11 sites `p.surface+' ha'` d'app.js (feuilles d'arrachage,
  commentaire, réparation, bulles et fiche rapide de la carte) et l'en-tête de la fiche passent par elle. Carte du domaine :
  total au centième (« 11,85 ha », plus `_pilNum` → « 12 »).
- **Petits défauts.** « …. » (le point ajouté derrière la liste tronquée) ; « 0,0 ETP tracteur » masqué sous 0,05 ETP ; le
  texte de la journée de référence (voir 222d).

### 222c. Mesuré

`mv-harnais-coh1.mjs` : **19 assertions** sur les vraies fonctions (bloc ARRACH-3 + `_mvTFaite` + `calcHeures` + `getPCls`,
`_pvSurfFr` / `_pvCompte` / `_qte`, `_pilBarQte`, `tNom` / `tAbr`) et sur le texte (CSS, puces, journal, « … », ETP, h_jour).
Contre-épreuve **12/12**. `mv-harnais-arrachage` et `mv-harnais-arrach3` exécutent les feuilles d'arrachage : ils ont reçu la
vraie `_pvSurfFr` (extraite), verts, contre-épreuves vertes. Chaîne complète : **186 commandes vertes** (preflight : 0 erreur,
3 avertissements préexistants de cave.js).
★ **Pièges d'environnement** : un processus lancé en tâche de fond meurt à la fin de l'appel d'outil — le `npm ci` d'un tour
précédent avait laissé un `node_modules` incomplet (eslint absent : `lint-cliquet` rouge pour rien), et le lanceur complet
(> 5 min) ne peut pas tourner en une fois. Fait : `npm ci` relancé au premier plan, puis la liste jouée en lots parallèles
(`xargs -P`), chaque commande avec son code de sortie.

### 222d. Une erreur de Claude, rattrapée avant le code

Dans la conversation, Claude avait annoncé que le réglage « Journée de référence » (7 h) ne servait plus à rien et serait
retiré. **Faux** : il est le repli de `_pilEchCadence` (Échéances par tâche) quand le planning ne mesure aucune présence sur
28 jours. La recherche `grep "hJour"` respectait la casse et ne voyait pas `_pecHJour`. Rattrapé en lisant
`mv-harnais-pil-coherence` (qui l'extrait) ; dit à Nico. Le réglage reste ; seul son texte change (« repli des échéances »).
★ **Chercher le nom exact de la fonction, ou sans casse, avant d'affirmer qu'elle n'a pas de lecteur.**

### 222e. Ouvert

① Aucun rendu navigateur : à regarder chez Nico — la carte du domaine sous la barre sur PC, les noms entiers dans la colonne
de 126 px du Pilotage (coupés par des points de suspension au-delà), les surfaces à 4 décimales sur la liste. ② Les lots 2 et
3, la passe d'audit, « Dégraffage », le repli de 7 h : §28, bloc COH-1.

## 223. ★★★ FUSION-1 — LA SÉRIE §213-§221 RECOLLÉE SOUS COH-1 (03/10 — les fichiers des deux lots · `scripts/preflight-baseline.json` (regravé) · `.mv-base` · **APP 8.01 → 8.02, SW 8.76 → 8.77**, base `75107ff`)

### 223a. Ce qui s'est passé

Deux conversations ont livré en parallèle sur la même base `61f4ccd` : la série « densifier le Pilotage » (§213-§221, neuf
lots, zip cumulatif TRAIT-CUVE, APP 8.01 / SW 8.76) et COH-1 (APP 7.93 / SW 8.68). Les deux zips ont été collés, COH-1 en
dernier, puis poussés en `75107ff`. Les fichiers COMPLETS de COH-1 — `app.js`, `pilotage.js`, `utils.js`, `styles.css`,
`index.html`, `sw.js`, `CLAUDE.md`, la doc, la liste des harnais — ont écrasé ceux de la série. Il restait d'elle
`planning.js`, `reglages.js`, `typo-baseline.json` et sept harnais, qui échouaient tous. Symptôme visible : le preflight
rouge sur `_planPrevuPersRange`, la moitié de TENS-1 restée dans `planning.js` sans sa moitié appelante (`pilotage.js`). La
construction était bloquée (`prebuild`) : rien n'est parti en production.
★ **`mv-base` ne pouvait rien voir** : les deux zips déclaraient la même base, et c'était vrai. Il garde la base, pas la
fratrie (§28, bloc COH-1, point 8).

### 223b. La réparation

Fusion git à trois voies depuis la base commune : branche `autre` = `61f4ccd` + zip TRAIT-CUVE, branche `coh1` = `61f4ccd` +
lot COH-1, `git merge`. Dix fichiers en conflit, résolus à la main :
- `src/pilotage.js` (1) : `_pilPanelCarte` — le corps de CARTE-1 (vues, légende) et la surface au centième de COH-1.
- `src/utils.js` (2) : `APP_VERSION` 8.02 ; `WHATS_NEW` — COH-1 passe en 8.02, au-dessus de 8.01…7.93 de la série. Le bloc
  8.02 s'est retrouvé sans sa fermeture `] },` (git avait rangé la fermeture dans la partie commune) : `node --check` l'a vu.
- `index.html` (4), `public/sw.js` (4) : v8.02 / v8.77 ; l'historique du SW de la série gardé, une ligne de fusion en tête.
- `scripts/harnais-claude-md.mjs` : `SECTIONS` 242 → 244 (§222, §223).
- `CLAUDE.md` : en-tête neuf ; au §28, les deux blocs (COH-1 puis la série). `journal.md` : les en-têtes TRAIT-CUVE et COH-1
  descendent, annotés. `chantiers-180-229.md` : la série garde §213-§221, COH-1 devient §222. `INDEX.md` régénéré.
- Fusionnés sans conflit : `app.js`, `styles.css`, `mv-harnais-liste.mjs`, `guide/11-pilotage.html` (`public/guide.html`
  régénéré).
Le zip se pose sur `75107ff` (`.mv-base`). Vérifié : `planning.js`, `reglages.js`, `typo-baseline.json` et les sept harnais
sont identiques dans `75107ff`, dans le zip TRAIT-CUVE et dans la fusion.

### 223c. Mesuré

Sur `75107ff` : les sept harnais de la série **rouges** (« les scénarios s'exécutent sans planter »), preflight **1 erreur**.
Après fusion : les sept **verts**, `mv-harnais-coh1` vert (19, contre-épreuve 12/12), preflight **0 erreur**. La référence du
preflight est regravée : COH-1 avait fait baisser deux compteurs (champs non échappés 13 → 9, substitutions nues 139 → 125),
le cliquet garde ce gain. Chaîne complète jouée sur une copie de `75107ff` + les fichiers du zip, comme chez Nico.

### 223d. Ouvert

① Une garde contre les lots frères (§28, bloc COH-1, point 8). ② Règle de travail : un seul fil livre des fichiers complets à
la fois, ou un push entre deux lots. ③ Le lot 2 de COH-1 (le renfort sans heures sup, maquette v2 validée) se construit sur
cette fusion.

## 224. ★★ RENF-2 — LE RENFORT DIT COMBIEN DE SAISONNIERS, ET QUAND — SANS HEURES SUP (03/10 — `src/pilotage.js` · `src/planning.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_INFO pil.sim.* ×5, MV_AIDE pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-renf2.mjs` (neuf) · `scripts/mv-harnais-info.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **APP 8.02 → 8.03, SW 8.77 → 8.78**, base `1a75533`)

### 224a. D'où ça vient

Nico, 03/10 : *« dans Décider, renfort, combien, quand, je ne comprends pas pourquoi apparaissent des heures sup — il faut
indiquer combien de saisonniers il faut à une période donnée pour justement éviter que l'équipe ait à faire des heures
sup »*. Vérifié : `_rfSim` plafonnait la capacité à `capNorm × hMax/hJour` = ×8/7 — chacun travaillait une heure de plus par
jour avant que le simulateur réclame du monde, et le coût portait une part « Heures sup ». La capacité, elle, lisait déjà
le planning jour par jour (`_capDayReal`, CP et récup à 0 ; `w.cap` = le modèle standard, `_cap1`). Nico : les heures à
compter sont celles du planning (annualisé : ~28-29 h l'hiver, 39 h l'été) ; ses saisonniers sont surtout des TESA, qui
suivent l'horaire de l'équipe. Maquettes v1 puis v2 (ajout de « Et sans renfort ? », demandé par Nico), v2 validée.

### 224b. Ce qui change

- **Plus d'heure sup cachée** : `_rfCfg` → `hMax: 7` (= `hJour`), `hCdd: 35`. Toute simulation compte le planning, rien de
  plus — y compris `_pilCkInaction` (coût de l'inaction de l'écran du matin), dont le chiffre peut monter. Une heure sup
  n'existe que si un scénario la nomme : `c.plaf` (plafond hebdomadaire par personne, proratisé sur la semaine entamée par
  `capRatio`, posé par `_rfCtx`).
- **Les heures d'un saisonnier** : `c.capS(i)` — TESA = `W[i].cap` (le modèle de la semaine), CDD = `c.hCdd × capRatio`,
  0 une semaine fermée. `_rfSim` les paie (`capRenf`) et les fait travailler à `c.rdt`.
- **Le calendrier** (`_rfCalendrier`) : tant qu'un travail déborde, le plus tôt à échoir est servi en premier ; sur SA
  fenêtre (`_rfWOf(ws)` → `lim`), `_rfMinR(…, base)` cherche le plus petit nombre CONSTANT qui le fait tenir, en plus du
  profil déjà posé, semaines fermées exclues. `_rfPeriodes` regroupe les semaines de même effectif ; une fermeture coupe.
- **« Et sans renfort ? »** (`_rfSansRenfort`) : l'équipe seule au plafond choisi (défaut `_rfPlafDef` = la semaine la plus
  longue du modèle, `window._planSemaineMax`, neuf dans planning.js ; boutons 43 et 48 h), ses heures sup comptées comme le
  relevé (25 % jusqu'à la 43e heure, 50 % au-delà, au taux de l'équipe), le retard qui reste ; puis l'équipe sans heures
  sup ; puis le plafond minimal qui ferait tout tenir.
- **La carte** (`_rfBody`, `_rfCalSvg` au socle MV_GRAPH, `_pilPanelRenfort`) : verdict, calendrier, comparatif, semaine par
  semaine, une ligne d'hypothèses (`rf-lim`) + TESA / CDD, « Choisir moi-même la période » (`_rfMinR` en rectangle).
  Gestes : `window._rfContrat`, `_rfPlaf`, `_rfChoix` — les valeurs passent par `data-*`, jamais dans le gestionnaire (C24b).
- **Retirées** (plus d'appelant) : `_rfBesoin`, `_rfBesoinC`, `_rfBest`, `_rfStrategies`, `_rfProfilSvg`, `_rfCoutSvg`,
  `_rfRetardHtml`, `_rfBesoinHtml`, `_rfTable`, `_rfROpts`, `_rfSelHtml`, `window._rfSel`, `_rfSelAutre`, `_rfAppliquer`.
  La fiche `pil.sim.fenetres` (le tableau d'avant) est retirée ; les cinq autres `pil.sim.*` sont réécrites et posées sur
  les nouvelles sections.

### 224c. Mesuré

`mv-harnais-renf2.mjs` : **17 assertions** sur les vraies fonctions, scénario de la maquette — le moteur redonne EXACTEMENT
ses chiffres : 2 saisonniers en deux périodes (Noël), 968 h en TESA, 1 190 h en CDD, 0 h sup ; sans renfort ni heures sup,
la taille +12 semaines ; à 39 h, 550 h sup à 25 %, 13 416 € et la taille encore +7 ; à 48 h, 696 h à 25 % + 237 h à 50 %,
23 907 € ; plafond minimal 46 h ; « 4 janv. – 26 mars » : 3 saisonniers. Contre-épreuve **7/7**. `mv-harnais-info` adapté :
« les cinq sections du renfort portent leur fiche », nouvelles phrases témoins, nouvelle légende. Chaîne complète verte.
★ **Piège** : la première contre-épreuve laissait deux défauts verts (le simulateur qui oublie `capS`, `_rfMinR` qui
ignore le profil posé) — le scénario n'avait qu'un bloc et vérifiait les heures hors du simulateur. Deux assertions
ajoutées, sur `capRenf` et sur `_rfMinR` appelé directement.

### 224d. Ouvert

① À l'œil chez Nico, sur ses données (§28, bloc COH-1, point 10). ② `c.hCdd` est en dur (35 h). ③ La journée de
référence (7 h) reste le repli des échéances (§28, point 6).

## 225. ★★ ANN-1 — LES NOUVEAUTÉS EN QUATRE NIVEAUX (03/10 — `src/utils.js` (APP, WHATS_NEW 8.03, bloc ANN-1, MV_AIDE Accueil et Réglages) · `index.html` · `src/styles.css` · `public/sw.js` · `guide/01-demarrer.html` · `guide/12-reglages.html` · `guide/14-depannage.html` · `scripts/mv-harnais-annonces.mjs` (neuf) · `scripts/mv-whatsnew-check.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **APP 8.03 → 8.04, SW 8.78 → 8.79**, base `ca4caa2`)

### 225a. La demande, et ce qui a été mesuré avant d'agir

Nico, 03/10 (dicté) : prévenir différemment une petite correction, une correction importante et une nouveauté à connaître —
« le What's New est beaucoup trop présent parfois ». Mesuré sur le dépôt : du 19/09 au 02/10, **50 versions annoncées et 109
nouveautés** d'environ 330 caractères ; septembre seul, **104 versions et 247 changements**. La fenêtre s'ouvrait d'office chez
tout le monde (aucun tri par rôle), ne se relisait nulle part, et ses deux boutons faisaient la même chose. Les sources lues
(NN/g, Google Play, Atlassian, Apple, Linear, études d'habituation de BYU : l'attention baisse dès la 2e ou 3e exposition à un
message qui se ressemble) disent la même chose : graduer, et réserver l'interruption aux grandes nouvelles.

### 225b. La maquette refusée

Une maquette « canvas » (cinq écrans redessinés à la main) a été jugée **mal faite** : illisible sur téléphone, un dessin qui
imitait l'appli au lieu de partir de sa feuille de style, un bandeau « À vérifier » trop lourd (un bloc ambre et un gros bouton
en tête d'Accueil, l'inverse du but). Nico a validé sur la description textuelle. ★ **Une maquette Ma Vigne est UNE page HTML
construite sur `styles.css`** — pas un canvas d'outil, pas un redessin. Le bandeau est devenu une ligne.

### 225c. Le modèle

`niv` 0–3, `pour`, `cible` (niveau 1), `d` sur le bloc ; la règle est au §7 de `CLAUDE.md`. La **base** se pose une fois par
personne (dernière version vue, sinon la version installée : aucun récapitulatif à la première installation) ; « Vu » et la base
vivent en localStorage, clé domaine + personne (`mavigne_ann_*`). Niveau 3 : 30 jours entre deux fenêtres, 3 au plus, 60 jours
d'âge au plus, vues dès l'ouverture. Niveau 2 : la plus récente non vue (« 1 sur N »), 90 jours. Niveau 1 : la pastille est
reposée par un `MutationObserver` (les écrans se redessinent sans cesse), branché seulement s'il y a une pastille à poser et
débranché ensuite ; le premier usage de la cible vaut « vu » ; 15 jours. Le Journal et la fiche d'un item vivent dans la feuille
des « i » (`#ovInfo`) : mois, niveaux, corrections repliées, « Versions précédentes » pour l'histoire d'avant 8.04.

### 225d. Contraintes rencontrées en route

- `mv-harnais-prep` exige `if (_mvPrepOn()) return;` **avant** le premier `localStorage` de `checkWhatsNew` : gardé mot pour mot.
- C15 : `_whatsNewSince` serait devenu une fonction morte ; il compte désormais « et N autres changements » sous la fenêtre.
- C19 / C24 : les titres classés passent par `_escHtml` ; les boutons portent des `data-ann-*` lus par un écouteur délégué (le
  patron des `data-mvi`), aucun `onclick` construit avec une valeur.
- `mv-harnais-icones` a rougi sur une icône en 14 px : l'échelle du jeu est 16/18/20/24/40.
- ★ **Rejoué sur une base neuve.** Construit sur `1a75533`, le lot a été rejoué sur `ca4caa2` : RENF-2 avait pris 8.03 / 8.78
  et le numéro de section précédent pendant qu'il se construisait. Le `git fetch` d'avant livraison l'a vu (règle d'or n°1) ; les
  patchs, écrits pour être rejoués, sont repassés sans conflit, numéros relevés (APP 8.04, SW 8.79, §225).
- Le harnais a d'abord rougi sur « l'observateur se débranche » : il lisait l'observateur d'un autre scénario. Le test avait tort.

### 225e. Mesuré

Preflight **0 erreur** (1 avertissement préexistant, `cave.js`). `mv-harnais-annonces` **33 verts, contre-épreuve 9/9** (filtre
« pour », base, « Vu », âge, cadence de 30 jours, trois au plus, garde PREP, échappement, pastille qui bloquerait l'écran visé).
`mv-whatsnew-check` étendu ; contre-épreuve faite sur une copie (bloc sans `d`, cible inexistante → rouge).
Chaîne complète (`mv-harnais-liste`, 202 commandes) jouée par tranches, `TZ=Europe/Paris` : **verte**, après une correction en
route — `mv-harnais-jetons` comptait six rayons du bloc qui doublaient un pas du socle (8/12/16/999 px, **repli de `var()` compris**) :
ramenés à 10 et 20 px. `harnais-claude-md` : `SECTIONS` 244 → 256 (+§225, et 11 crans que le script réclamait déjà sur `1a75533`).

### 225f. Ouvert

Voir §28, bloc ANN-1 : le rendu à regarder sur téléphone, « Vu » par appareil, le niveau 2 « à l'endroit du geste ».

### 225g. 8.06 — la grande nouveauté qui montre le chemin (03/10, base `c855567`, APP 8.05 → 8.06, SW 8.80 → 8.81)

Nico, après la livraison : « un dernier What's New pour prévenir tout le monde de regarder dans Réglages › Moi › Journal des
nouveautés — un What's New majeur ». Un bloc 8.06 à un item `niv: 3, pour: ['tous']`. C'est la PREMIÈRE grande fenêtre du
système (8.04 : niveaux 2 et 1 ; 8.05, KIT-1 : trois niveaux 0) : aucune fenêtre n'a pu armer les 30 jours avant elle. Une
première installation ne la voit pas (base = version installée) — voulu : le Journal est alors déjà sous ses yeux.

## 226. ★★ KIT-1 — LE KIT GRAPHIQUE COMMUN, LOT 3a : ACCUEIL ET PILOTAGE (03/10 — `src/utils.js` · `src/app.js` · `src/pilotage.js` · `src/styles.css` · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-kit1.mjs` (neuf) · `scripts/mv-harnais-coh1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · **APP 8.04 → 8.05, SW 8.79 → 8.80**, base `bd53451`)

### 226a. D'où ça vient

Demande de Nico (03/10, COH-1) : égaliser les graphiques, « une appli homogène et agréable », et les cartes qui débordent sur
PC. Recommandation retenue avant la maquette : pas d'option petit / grand, un kit + « Agrandir ». Maquette
`maquette-kit-graphique-v1.html` (Accueil, La campagne, planche du kit), « go » de Nico sur les recommandations : la couleur
dit l'état, plus de nom abrégé, deux colonnes à partir de 1 024 px, déploiement en trois lots. Inventaire au moment du lot :
28 familles de barres et de jauges dans `styles.css`, 38 fonctions de dessin (24 appels au socle `_mvGraphSvg`), des cercles en
quatre tailles (viewBox 100, 168, 184, 200).

### 226b. Ce qui change

- **Une ligne d'avancement** (`utils.js`) : `_mvkLigne` (nom · barre fine · % · détail), `_mvkAvancement(rows, retards)` (les
  lignes de `calcHeures`, sous-lignes N1… / P1… des niveaux et passages), `_mvkEtat` (fait si 100 %, retard si la fenêtre est
  passée, sinon cours — JAMAIS au pourcentage), `_mvkDet` (heures, sinon surface faite / concernée, sinon tiret — l'ex-`_pilBarQte`
  de COH-1, retirée), `_mvkRetards(cd)` (les `taskWindows` de `_chargeSaisonData` dont la fin EXCLUSIVE `we` est passée).
  `renderHeuresCard` (Accueil) et `_pilRenderBar` (Pilotage) appellent le même dessin — ordre de la saison, plus le tri par %.
- **Plus de forme courte** : `tAbr` retiré (utils, import d'app.js). `tNom` = le nom entier partout.
- **La barre des cartes de parcelle** : `getPCls().fill` dit l'état (vert fini, doré sinon) ; `col` (la carte) garde le dégradé.
- **« Agrandir »** : `_mvGraphDessine` pose un bouton `.mvk-agr` dans le dessin de chaque graphe suivi (`_mvGraphSuivre`, refus
  par `opts.agrandir === false`) ; un écouteur délégué appelle `_mvGraphAgrandir(i)`, qui ouvre `#ovGraph` (index.html, par
  `openOv` : Échap, retour arrière, empilement) et redessine `build(w)` à la largeur de la feuille. Titre = l'`aria-label` du SVG.
  Concerne aussi la Cave et le Cuvier (mêmes graphes suivis).
- **Grands chiffres** : `font-variant-numeric: lining-nums proportional-nums` sur les classes de grands chiffres en Cormorant —
  en chasse fixe (`tabular-nums`), le « 1 » prenait la largeur d'un « 0 » : « 12 % » se lisait « I 2 % ». La chasse fixe reste
  aux colonnes (`.mvk-ligne .pct`).
- **Largeur** : `--page-max: 1200px` ; `#page-home`, `#page-parcelles`, `#page-pilotage` centrées à 1 200 px au-delà de 1 200 px
  (avant : `max-width:none`, 1 900 px sur un grand écran) ; `.pil-wrap` 1 280 → 1 200.

### 226c. Mesuré

`mv-harnais-kit1.mjs` : **12 assertions** — les vraies fonctions du kit exécutées (états, détail, noms entiers, sous-lignes,
retards à la fin exclusive, bouton posé et refusé par `_mvGraphDessine`), le reste lu dans les sources. Contre-épreuve **6/6**.
`mv-harnais-coh1` adapté (le formateur commun, plus de `tAbr`) : 19 vertes, 12/12. Chaîne complète verte.

### 226d. Le vrai périmètre de 3a, dit à Nico

L'**Accueil sur deux colonnes** n'est PAS dans ce lot : ses blocs se composent et se déplacent (`applyHomeLayout`, mode
« Personnaliser ») ; une grille posée sans voir l'écran aurait pu casser le glisser-déposer. Il faut une capture du mode
Personnaliser sur PC avant. Les Parcelles sur deux colonnes, même raison (bandeaux et barres d'équipe mêlés aux cartes).

### 226e. Ouvert

① 3b (Vigne hors Accueil, Planning, Tracteur) et 3c (Cave, Cuvier, La Réserve) : barres, cercles (une taille), cadre commun.
② L'Accueil et les Parcelles sur deux colonnes, sur capture. ③ À l'œil chez Nico : la ligne d'avancement au téléphone (deux
étages sous 480 px), le bouton « Agrandir » sur chaque graphe (y compris Cave et Cuvier), la largeur à 1 200 px.

## 227. ★ KIT-2 — L'ACCUEIL ET LES PARCELLES SUR DEUX COLONNES ; LES CHIFFRES DROITS PARTOUT (03/10 — `src/app.js` · `src/styles.css` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE home) · `index.html` · `public/sw.js` · `guide/04-vigne.html` · `public/guide.html` · `scripts/mv-harnais-kit2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `scripts/typo-baseline.json` · **APP 8.06 → 8.07, SW 8.81 → 8.82**, base `b6d2cd5`)

### 227a. D'où ça vient

KIT-1 (§226d) avait laissé l'Accueil et les Parcelles sur une colonne, faute d'avoir vu l'écran. Nico a envoyé deux
captures de l'Accueil sur PC (mode normal, mode Personnaliser). Lu dans le code : `applyHomeLayout` ré-appende chaque
`.home-w` dans `#page-home` — les blocs sont les enfants DIRECTS de la page, mêlés à l'en-tête, aux onglets, aux tuiles, aux
bandeaux, au pied administrateur ; et `_homeDragMove` ne regardait que la hauteur (le voisin de GAUCHE de la rangée gagnait).
Pour les Parcelles, la capture demandée s'est révélée inutile : les cartes (`.mv-c`) vivent dans leur propre conteneur
`#pList`, frère — et non parent — des bandeaux (priorité, recherche, proximité, tournée, filtres, barre d'équipe).
★ **Reconstruit une fois** : la première livraison de KIT-2 (base `c855567`, APP 8.06) est arrivée pendant qu'un autre fil
poussait ANN-1b (§225g) sur la même base, avec les mêmes numéros. Elle n'a pas été collée ; `mv-base` l'aurait refusée
(HEAD `b6d2cd5`). Le lot est refait sur `b6d2cd5`, en 8.07 / 8.82.

### 227b. Ce qui change

- **Accueil** : `@media (min-width:1024px)` — `#page-home.active` en grille de deux colonnes (le `.active` est obligatoire :
  `.page` est en `display:none` hors de la page courante) ; `#page-home > *` pleine largeur, `.home-w` une colonne,
  `.home-w-pinned` pleine largeur. `_homeDragMove` suit le doigt en x et y et cherche le bloc qui CONTIENT le centre du bloc
  tiré (moitié haute → avant, basse → après) ; en une colonne, la règle d'avant ; dans l'allée, rien.
- **Parcelles** : `#pList` en grille de deux colonnes ; ce qui n'est pas une carte (`:not(.mv-c)`, le message vide) en pleine
  largeur. Les bandeaux, au-dessus, ne sont pas dans la grille.
- **Chiffres elzéviriens** (« I7% », « I9° » sur les captures) : la Cormorant servie (`public/fonts`, sous-police latin) dessine
  par défaut des chiffres elzéviriens (« one » haut de 386 unités, « seven » qui descend à −275). fontTools : la sous-police
  garde `lnum` (one.lf, seven.lf, 634 de haut) et `tnum` (one.tf, alignés à chasse fixe — le trou de « I 2 % »).
  `body{font-variant-numeric:lining-nums}` les active partout par héritage. ⚠️ Une régénération des sous-polices doit garder `lnum`.
- **Tuiles** « 17 % » et « 11,85 » ; surface de la carte de saison au centième ; **barre de saison** et « travail le plus
  avancé » à l'état (doré en cours, vert fini — avant : orange sous 40 %).

### 227c. Mesuré

`mv-harnais-kit2.mjs` : **11 assertions**, dont le VRAI `_homeDragMove` exécuté sur une page factice en deux colonnes puis en
une. Contre-épreuve **6/6** (la première version laissait vert « la surface reprend son point » : le motif vérifié existait aussi
dans le rapport de saison ; l'assertion vise désormais la ligne de la tuile). Cliquet typo regravé si la croissance cumulée de
`styles.css` (plusieurs lots depuis la référence) dépasse 5 % — ce lot n'y ajoute qu'environ 2 ko. Chaîne complète verte.

### 227d. Ouvert

① À l'œil chez Nico : deux blocs de hauteurs inégales côte à côte laissent un blanc (l'ordre se règle en mode Personnaliser) ;
le glisser-déposer d'une colonne à l'autre ; la liste des parcelles sur deux colonnes ; les chiffres droits. ② 3b et 3c du kit.
③ Deux fils livrent encore en parallèle (annonces / kit) : un seul à la fois, ou un push entre deux lots.
