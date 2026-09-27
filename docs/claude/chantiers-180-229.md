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
