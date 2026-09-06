# Ma Vigne — Migration Vite · Phase 1

**Objectif :** Transformer le projet fichier-unique en projet Vite buildable,
sans toucher une seule ligne de code fonctionnel.

À la fin de cette phase, `npm run dev` lance l'app exactement comme avant,
et `npm run build` produit un dossier `dist/` déployable sur Firebase Hosting.

---

## Structure cible après Phase 1

```
mavigne/                    ← dossier racine du projet
├── package.json
├── vite.config.js
├── .gitignore
├── index.html              ← INCHANGÉ (fichier unique d'origine)
├── public/                 ← fichiers servis tels quels par Vite
│   ├── sw.js               ← INCHANGÉ
│   ├── manifest.json       ← INCHANGÉ
│   ├── icon-192.png        ← INCHANGÉ
│   └── icon-512.png        ← INCHANGÉ
└── node_modules/           ← généré par npm install (ne pas versionner)
```

---

## Étapes

### 1. Prérequis — Node.js installé

Vérifier dans un terminal :
```bash
node --version   # doit afficher v18.x ou supérieur
npm --version    # doit afficher 9.x ou supérieur
```

---

### 2. Créer le dossier projet

```bash
# Dans votre terminal, aller là où vous voulez créer le projet
# (ex : Bureau, Documents, ou un dossier de développement)
mkdir mavigne
cd mavigne
```

---

### 3. Copier les fichiers fournis

Copier dans `mavigne/` :
- `package.json`
- `vite.config.js`
- `.gitignore`

Copier vos fichiers existants :
- `index.html` → à la racine de `mavigne/`

Créer le dossier `public/` et y copier :
- `sw.js`
- `manifest.json`
- `icon-192.png`
- `icon-512.png`

**⚠️ Important :** `sw.js` doit être dans `public/`, pas à la racine.
Vite le copie tel quel à la racine du `dist/` — le Service Worker continuera
à fonctionner exactement comme avant.

---

### 4. Installer les dépendances

```bash
# Dans le dossier mavigne/
npm install
```

Cela crée `node_modules/` (environ 150 Mo — normal, ne pas s'inquiéter).
Durée : 1–3 minutes selon la connexion.

---

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Vite affiche quelque chose comme :
```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Ouvrir http://localhost:5173/ dans Chrome.
**L'app doit s'afficher et fonctionner exactement comme d'habitude.**

Pour tester sur Android : connecter le téléphone au même Wi-Fi
et ouvrir l'URL `Network` affichée dans le terminal.

---

### 6. Tester le build de production

```bash
npm run build
```

Vite génère le dossier `dist/` avec :
```
dist/
├── index.html          ← HTML minifié avec les assets hachés
├── assets/
│   └── index-[hash].js ← JS minifié (tout index.html en un fichier)
├── sw.js               ← copié depuis public/ (inchangé)
├── manifest.json       ← copié depuis public/ (inchangé)
├── icon-192.png
└── icon-512.png
```

Pour prévisualiser le build :
```bash
npm run preview
# Ouvre http://localhost:4173/
```

---

### 7. Vérification finale avant de passer à la Phase 2

Checklist :
- [ ] `npm run dev` → app visible et fonctionnelle sur localhost
- [ ] Login Firebase OK
- [ ] Navigation entre modules OK
- [ ] Carte Leaflet OK
- [ ] `npm run build` → pas d'erreur dans le terminal
- [ ] `npm run preview` → app fonctionnelle sur le build de production

---

## Ce qui N'A PAS changé en Phase 1

- Zéro ligne de code fonctionnel modifiée
- Firebase SDK compat toujours chargé via CDN dans index.html
- Leaflet toujours chargé via CDN dans index.html
- Service Worker identique (sw.js v2.26)
- Aucune syntaxe ES module introduite

---

## Phase 2 (prochaine session)

Extraction de `firebase.js` + `state.js` :
- Migration Firebase SDK compat → SDK modulaire v10 (import ES)
- Réduction du bundle d'environ 40 KB gzip
- Centralisation de `db`, `auth`, `TENANT_ID`, `saveData`, `loadData`

---

*Ma Vigne — GUERETTECH · Nicolas GUERET · ngdevpro@gmail.com*
*Phase 1 générée le 28 mai 2026*
