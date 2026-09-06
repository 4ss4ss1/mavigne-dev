# Ma Vigne — Activation du plan Blaze et backup GCS

> À effectuer le jour où la carte bancaire est disponible.  
> Durée estimée : **30–45 min**.

---

## Étape 1 — Passer au plan Blaze

1. Ouvrir [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionner le projet **mavigne-a0fd5**
3. En bas à gauche : **Spark** → cliquer → **Upgrade to Blaze**
4. Renseigner la CB et confirmer
5. ⚠️ Configurer immédiatement une **alerte budget** : GCP Console → Facturation → Budgets → `50 €/mois` (largement au-dessus des coûts réels, protège contre une anomalie)

Coûts réels attendus sur Ma Vigne (<10 tenants) : **< 1 €/mois**.

---

## Étape 2 — Configurer le bucket GCS pour les backups

Le bucket Firebase Storage existant (`mavigne-a0fd5.firebasestorage.app`) est réutilisé. Deux sous-dossiers seront créés automatiquement :

```
mavigne-a0fd5.firebasestorage.app/
├── backups/
│   ├── firestore/          ← exports natifs quotidiens (binaire)
│   │   └── 2026-06-01/
│   └── tenants/            ← exports JSON hebdomadaires par tenant
│       ├── marchand-grillot/
│       │   └── 2026-06-01.json
│       └── domaine-dupont/
│           └── 2026-06-01.json
```

### Règle de rétention GCS pour les exports Firestore natifs

Les exports natifs (gros volumes) sont purgés automatiquement via une règle de cycle de vie :

1. [GCP Console Storage](https://console.cloud.google.com/storage/browser) → `mavigne-a0fd5.firebasestorage.app`
2. Onglet **Lifecycle** → **Add a rule**
3. Conditions :
   - Object name prefix : `backups/firestore/`
   - Age : `7` jours
4. Action : **Delete**
5. Sauvegarder

Les exports JSON par tenant sont purgés automatiquement par la Cloud Function (30 jours).

---

## Étape 3 — Permissions IAM

Firebase configure automatiquement le compte de service par défaut. Vérifier qu'il a bien les rôles :

1. [GCP Console IAM](https://console.cloud.google.com/iam-admin/iam) → projet `mavigne-a0fd5`
2. Chercher : `firebase-adminsdk-...@mavigne-a0fd5.iam.gserviceaccount.com`
3. Rôles nécessaires (normalement déjà présents) :
   - `Cloud Datastore Import Export Admin`
   - `Storage Admin`

Si manquants → **Edit** → **Add another role** → ajouter les deux.

---

## Étape 4 — Déployer les Cloud Functions

```bash
# Depuis la racine du projet mavigne/
cd functions
npm install
cd ..
firebase deploy --only functions
```

Vérifier dans la console Firebase → **Functions** que les deux fonctions apparaissent :
- `dailyFirestoreExport` — déclencheur : Cloud Scheduler, tous les jours 2h
- `weeklyTenantJsonBackup` — déclencheur : Cloud Scheduler, dimanche 3h

---

## Étape 5 — Tester manuellement

### Test export JSON (recommandé en premier)

Dans [GCP Console Cloud Functions](https://console.cloud.google.com/functions) :
1. Cliquer sur `weeklyTenantJsonBackup`
2. Onglet **Testing** → **Test the function**
3. Payload : `{}` → **Run test**

Vérifier dans Storage → `backups/tenants/marchand-grillot/` qu'un fichier JSON a été créé.

### Test export Firestore natif

Même procédure sur `dailyFirestoreExport`. L'opération prend quelques secondes.  
Vérifier dans Storage → `backups/firestore/DATE/` qu'un dossier a été créé.

---

## Étape 6 — Vérifier les logs

```bash
firebase functions:log --limit 50
```

Ou dans GCP Console → **Cloud Logging** → filtrer `resource.type="cloud_run_revision"`.

---

## Structure finale du projet

```
mavigne/
├── functions/
│   ├── index.js          ← Cloud Functions (backup)
│   ├── package.json
│   └── .gitignore
├── firebase.json         ← mis à jour (bloc "functions" ajouté)
├── src/
│   ├── app.js
│   └── firebase.js
├── public/
│   ├── sw.js             ← v2.77
│   └── manifest.json
└── index.html
```

---

## Restauration d'urgence (en cas de besoin)

### Depuis un export Firestore natif

```bash
gcloud firestore import gs://mavigne-a0fd5.firebasestorage.app/backups/firestore/2026-06-01 \
  --project=mavigne-a0fd5
```

⚠️ **Écrase** les données existantes. À utiliser uniquement en cas de corruption totale.

### Depuis un export JSON tenant

Télécharger le fichier depuis Storage → utiliser la fonction d'import JSON dans Réglages de Ma Vigne (déjà disponible), ou via un script Node.js ponctuel.

---

## Coûts estimés (plan Blaze)

| Service | Usage estimé | Coût/mois |
|---|---|---|
| Cloud Functions | 60 exécutions/mois | < 0,01 € |
| Cloud Scheduler | 2 jobs | 0 € (quota gratuit) |
| GCS stockage | ~50 Mo/mois (< 10 tenants) | < 0,01 € |
| Firestore export | Opération batch quotidienne | < 0,10 € |
| **Total** | | **< 0,20 €/mois** |

Le plan Blaze est pay-as-you-go. Avec l'alerte budget à 50 €, aucun risque de dérive.

---

*GUERETTECH — Ma Vigne v2.77 — Juin 2026*
