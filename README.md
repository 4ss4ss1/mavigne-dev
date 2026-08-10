# Ma Vigne — Architecture technique

> Application PWA de gestion viticole · © 2026 Nicolas GUÉRET / GUERETTECH  
> Contact : ngdevpro@gmail.com · SIRET 98214811600022

---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | HTML/CSS/JS ES Modules — Vite/Rollup |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions) |
| Cartographie | Leaflet 1.9.4 |
| Météo | Open-Meteo API (gratuite, sans clé) |
| Hébergement | Firebase Hosting |
| PWA | Service Worker (`public/sw.js`) + manifest |

---

## Structure des fichiers

```
mavigne/
├── index.html              ← HTML + CSS global (zéro JS inline)
├── firestore.rules         ← Règles de sécurité Firestore
├── storage.rules           ← Règles Storage (analyses PDF)
├── firebase.json           ← Config Firebase Hosting + deploy
├── vite.config.js          ← Build Vite/Terser
├── src/
│   ├── utils.js            ← Fonctions pures, constantes, rôles, logError
│   ├── firebase.js         ← SDK Firebase v10, fbSave, queue offline, listeners
│   ├── onboarding.js       ← Assistant premier démarrage (nouveau tenant)
│   ├── admin-gt.js         ← Interface admin GUERETTECH (cross-tenant)
│   ├── cave.js             ← Module Cave élevage + vendange
│   ├── planning.js         ← Module Planning RH
│   ├── reglages.js         ← Module Réglages (membres, tâches, saisons, export)
│   ├── tracteur.js         ← Module Tracteur (sessions, entretien, réparateur)
│   └── app.js              ← Accueil, Parcelles, Journal, Phyto + orchestration
└── public/
    ├── sw.js               ← Service Worker (cache, offline, background sync)
    ├── manifest.json       ← Manifeste PWA
    ├── icon-192.png
    └── icon-512.png
```

---

## Multi-tenant

Chaque domaine client = un slug unique (ex: `marchand-grillot`).  
Toutes les données Firestore sont isolées sous `mavigne_{slug}`.

```
Firestore
├── mavigne_marchand-grillot/   ← tenant client
│   ├── parcelles
│   ├── journal
│   ├── sessions
│   └── ...
├── mavigne_domaine-dupont/     ← tenant démo (read-only)
└── _guerettech/                ← admin GUERETTECH uniquement
```

**Résolution du tenant** : paramètre URL `?tenant=slug` → `localStorage.mavigne_tenant`  
**Isolation** : règles Firestore + côté client (TENANT_ID constant sur toute la session)

---

## Variables d'environnement / constantes

Toutes dans `src/utils.js` :

| Constante | Valeur | Usage |
|---|---|---|
| `GT_ADMIN_EMAIL` | `ngdevpro@gmail.com` | Admin GUERETTECH |
| `APP_VERSION` | `4.26` | Affiché dans Réglages + What's New |
| `DEMO_TENANT` | `domaine-dupont` | Tenant démo |
| `DEMO_FIREBASE_EMAIL` | `demo@mavigneapp.fr` | Compte démo (read-only) |

La config Firebase (`firebaseConfig`) est dans `src/firebase.js`. Les clés Firebase sont intentionnellement publiques — la sécurité repose sur les règles Firestore.

---

## Ordre de chargement des modules

```
utils.js → firebase.js → onboarding.js → admin-gt.js
→ cave.js → planning.js → reglages.js → tracteur.js → app.js
```

Chaque module expose ses fonctions publiques via `window.*` pour les appels `onclick` HTML.

---

## Workflow développement

```bash
# Développement local
npm run dev
# → http://localhost:5173/?tenant=marchand-grillot

# Production
npm run build && firebase deploy

# Règles Firestore uniquement
firebase deploy --only firestore:rules
```

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Tout (Réglages, Phyto, actions destructives) |
| `ouvrier` | Accueil, Parcelles, Journal (lecture/écriture) |
| `tractoriste` | Module Tracteur en écriture |
| `saisonnier` | Accueil, Parcelles, Journal (lecture seule) |

---

## Règles Firestore — points clés

- GT admin (`ngdevpro@gmail.com`) : accès total sur tous les tenants
- Compte démo : lecture seule sur `mavigne_domaine-dupont`
- Utilisateurs normaux : accès en lecture/écriture à leur tenant (authentifiés)
- **Limite** : isolation inter-tenant complète nécessite custom claims Firebase  
  (à implémenter avant d'avoir 3+ clients simultanés)

---

## Sauvegarde des données

- **Cloud Functions** : export Firestore quotidien + backup JSON hebdomadaire (europe-west1)
- **localStorage** : backup versionné 7 jours (`mavigne_backup_YYYY-MM-DD`) dans `saveData()`
- **Queue offline** : modifications hors-ligne stockées, rejouées à la reconnexion avec retry 3× (backoff 1s/2s/4s)

---

## Sécurité

- XSS : `_escHtml()` appliqué sur toutes les données Firestore injectées via `innerHTML`
- Auth : Firebase Authentication (email/password) — aucun hash maison
- Données offline : localStorage (5-10 Mo max, non chiffré)
- Clés Firebase : publiques par conception Firebase — sécurité = règles Firestore
