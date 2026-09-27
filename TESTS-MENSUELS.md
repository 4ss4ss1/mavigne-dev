# Ma Vigne — Tests mensuels

À faire **une fois par mois**, et après tout gros lot. Compter environ **1 h 30**, dont une bonne partie à laisser tourner.
Toutes les commandes se tapent dans l'invite de commandes Windows, depuis le dossier du projet :

```
cd C:\Users\p4n0m\Desktop\Dev\mavigne-dev
```

Les rapports vont dans `rapports\`, qui est exclu de git. Ne jamais le pousser : il décrit les points faibles de l'appli.

---

## 0. Préparer (5 min)

1. Lancer **Docker Desktop** et attendre *Engine running*.
2. Fermer tout `npm run dev` resté ouvert. En cas d'erreur `EPERM` sur `esbuild.exe` :
   ```
   taskkill /f /im esbuild.exe
   taskkill /f /im node.exe
   ```
3. Récupérer le dépôt à jour et réinstaller :
   ```
   git pull
   npm ci
   mkdir rapports
   ```

---

## 1. La chaîne de contrôle (≈ 10 min)

```
npm run check
```

**Attendu : tout vert.** C'est la base : environ 140 harnais et leurs contre-épreuves. Un seul rouge et on s'arrête là :
copier la sortie et la donner à Claude.

---

## 2. Les dépendances (5 min)

```
npm audit --omit=dev
cd functions && npm audit --omit=dev && cd ..
```

**Attendu : `found 0 vulnerabilities`** des deux côtés. Les failles des outils de développement (vite, firebase-admin) sont
déjà triées et ne partent pas en prod.

Analyse plus large, avec Trivy (dépendances, secrets, configuration) :

```
docker run --rm -v trivy-cache:/root/.cache -v "%cd%":/src aquasec/trivy fs --timeout 20m --no-progress --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --skip-dirs /src/node_modules --skip-dirs /src/functions/node_modules --skip-dirs /src/dist --skip-dirs /src/.git --skip-dirs /src/.firebase --skip-dirs /src/rapports /src > rapports\trivy.txt 2>&1
```

**Attendu : 0 ligne `HIGH` ou `CRITICAL`.** Un nouveau nom dans `functions/package-lock.json` est prioritaire, parce que ce code
tourne en prod.

---

## 3. Les secrets (2 min)

```
docker run --rm -v "%cd%":/repo zricethezav/gitleaks git /repo -v > rapports\gitleaks.txt 2>&1
```

**Attendu : `no leaks found`.** Les deux clés publiques (Firebase web `AIza…`, reCAPTCHA `6Lcf…`) sont déjà déclarées dans
`.gitleaksignore`. Tout autre secret trouvé : **le révoquer chez le fournisseur**, le supprimer du code ne suffit pas.

---

## 4. Le code (5 min)

Seulement ce qui part en prod :

```
docker run --rm -v "%cd%":/src semgrep/semgrep semgrep scan --config auto src functions public guide > rapports\semgrep.txt 2>&1
```

**Attendu : rien de neuf** par rapport au mois précédent. Pour une alerte `innerHTML`, une seule question : ce texte peut-il venir
d'une saisie sans passer par l'échappement ? Si non, c'est un faux positif.

---

## 5. Le site en ligne (10 min)

**En-têtes de sécurité** (ZAP, mode passif, sans danger pour la prod) :

```
docker run --rm -v "%cd%\rapports":/zap/wrk:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://mavigneapp.fr -r zap.html
```

**Attendu : aucun `FAIL`.** Les `WARN` connus : `unsafe-inline` des scripts (chantier au backlog), intégrité Google Fonts (impossible),
COEP/CORP (volontairement absents).

**Qualité et vitesse** (Lighthouse, Chrome installé) :

```
npx lighthouse https://mavigneapp.fr/logiciel-vigne.html --output html --output-path rapports\lighthouse-vitrine.html --view
```

**Attendu : SEO et accessibilité ≥ 90.** Noter la performance pour suivre l'évolution d'un mois sur l'autre.

**Extérieur** (dans un navigateur, sans rien installer) : **internet.nl**, test *site web* et test *e-mail* sur `mavigneapp.fr`.
Surveiller surtout SPF, DKIM et DMARC.

---

## 6. Derrière le login, dans un vrai navigateur (≈ 30 min, à laisser tourner)

La première fois seulement : `npx playwright install chromium webkit`

```
npm run build
npm run test:smoke
npm run test:e2e
npm run tour
npm run tour:dates
```

**Attendu :**
- **smoke** et **e2e** : verts.
- **tour** : `0 bug`, sur ~845 écrans, Chrome et Safari, 5 rôles, 4 tailles d'écran. Ouvrir `rapports\tour\rapport.html`.
  Les « à voir » restants sont les petites cibles sans décision : un **nouveau** chevauchement ou texte coupé est à regarder.
- **tour:dates** : `0 bug`, sur ~800 écrans, à 9 instants pièges (changement d'heure, minuit, 1er août, 31 décembre…).
- La matrice du dock : Pilotage proposé **seulement** à l'admin et au rôle pilotage.

Les règles Firestore (contre-épreuves de sécurité) :

```
npm run test:sec7
```

---

## 7. Les données du vrai domaine (10 min)

1. Dans Ma Vigne, en admin : **Réglages › Domaine › Documents & impressions › Données brutes › Sauvegarde complète**.
   Le fichier ne doit **pas** finir par `_INCOMPLETE`.
2. Mesurer la taille des documents, en donnant la sauvegarde du jour **et** celle du mois dernier :
   ```
   npm run taille -- "C:\Users\p4n0m\Downloads\sauvegarde_du_jour.json" "C:\Users\p4n0m\Downloads\sauvegarde_du_mois_dernier.json"
   ```
   **Attendu : tout en blanc (< 50 %).** Jaune (≥ 50 %) : à surveiller. Rouge (≥ 80 %) : **urgent**, prévenir Claude. Noter le
   rythme de croissance et le mois de limite projeté pour `historique` et `journal`.
3. **Garder la sauvegarde** dans un dossier sûr, hors du dossier du projet. Elle contient des données personnelles.

---

## 8. Ce que disent les consoles (10 min)

**Admin GT › fiche de chaque domaine :**
- **Appareils** : aucun en rouge (« bloquée »). Un appareil en ambre depuis plus de deux semaines : demander à la personne de
  fermer et rouvrir l'appli.
- **Incidents** : lire les erreurs du mois. C'est le meilleur détecteur de bugs qui existe. Chercher en particulier `stockage`
  (file hors ligne refusée), `droits` et `critical`.

**Réglages › Équipe de chaque domaine :**
- Chaque personne partie est en **Inactif**.
- Chaque personne qui saisit a **admin, ouvrier ou tractoriste** (sinon elle est en lecture seule).
- **Pilotage › à compléter** : aucune « fiche sans date de contrat ».

---

## 9. Relevé

| Mois | check | audit | Trivy | Gitleaks | Semgrep | ZAP | tour | tour:dates | sec7 | Taille max | Appareils bloqués | Incidents | Remarques |
|------|-------|-------|-------|----------|---------|-----|------|------------|------|------------|-------------------|-----------|-----------|
|      |       |       |       |          |         |     |      |            |      |            |                   |           |           |

---

## À faire aussi, une fois par trimestre

- **Restaurer une sauvegarde** sur le canal staging (`restore-from-json.js`) et vérifier qu'un domaine revient complet. Une sauvegarde
  jamais restaurée n'est qu'une supposition.
- **Deux appareils et une coupure réseau** : téléphone en mode avion, une saisie ; ordinateur en ligne, une autre sur la même parcelle ;
  fermer puis rouvrir l'appli hors ligne (la saisie doit être là) ; réseau revenu, point de synchro vert ; les **deux** saisies
  présentes partout.
- **Console Firebase / Google Cloud** : App Check en mode *appliqué* (Firestore, Storage, Functions), alerte de budget active, clés
  restreintes (référents HTTP sur la clé `AIza…`, domaines de la clé reCAPTCHA).
- **Licences** des dépendances vendues avec l'appli :
  ```
  npx license-checker --production --summary
  ```
  Aucune GPL ni AGPL attendue.
- **Liens cassés** de la vitrine et du guide :
  ```
  npx linkinator https://mavigneapp.fr/logiciel-vigne.html --recurse > rapports\liens.txt
  ```
