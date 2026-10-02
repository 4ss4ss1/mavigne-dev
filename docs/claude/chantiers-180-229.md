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

