# Ma Vigne — Phase 4 · Firebase Hosting

## Ce que tu vas faire

Déployer le build Vite sur Firebase Hosting (ton propre projet `mavigne-a0fd5`).
Résultat : l'app sera disponible sur `https://mavigne-a0fd5.web.app`
et tu pourras supprimer Netlify.

---

## Étape 1 — Copier les fichiers de config

Copier dans le dossier `mavigne/` (à la racine, pas dans `src/`) :
- `firebase.json`
- `.firebaserc`

---

## Étape 2 — Installer Firebase CLI

Dans ton terminal (cmd), tape :

```
npm install -g firebase-tools
```

Durée : 1-2 minutes. Si tu vois une erreur de permissions, tape :

```
npm install -g firebase-tools --force
```

Vérifier l'installation :
```
firebase --version
```

Doit afficher quelque chose comme `13.x.x`.

---

## Étape 3 — Se connecter à Firebase

```
firebase login
```

Ça ouvre une fenêtre de navigateur → connecte-toi avec ton compte Google
(celui qui a accès au projet `mavigne-a0fd5`).

---

## Étape 4 — Builder l'app

Dans le dossier `mavigne/` :

```
npm run build
```

Vite génère le dossier `dist/` avec tout le code compilé et optimisé.

---

## Étape 5 — Déployer

```
firebase deploy
```

Tu verras quelque chose comme :
```
=== Deploying to 'mavigne-a0fd5'...

i  deploying hosting
i  hosting[mavigne-a0fd5]: beginning deploy...
✔  hosting[mavigne-a0fd5]: file upload complete
✔  Deploy complete!

Hosting URL: https://mavigne-a0fd5.web.app
```

---

## Étape 6 — Tester

Ouvre `https://mavigne-a0fd5.web.app/?tenant=marchand-grillot`

Vérifie :
- [ ] Login OK
- [ ] Données à jour (pas le 15 mai)
- [ ] Journal, Parcelles, Tracteur OK
- [ ] PWA installable (bouton "Installer" dans Chrome)

---

## Étape 7 — Mettre à jour le lien d'invitation

Dans Réglages → le lien d'invitation pointera vers `mavigne-a0fd5.web.app`
au lieu de Netlify. Partage ce lien aux membres de l'équipe.

---

## Étape 8 — Supprimer Netlify (optionnel)

Une fois que tout fonctionne sur Firebase Hosting :
1. Informe les membres de l'équipe du nouveau lien
2. Supprime l'app Netlify depuis ton dashboard Netlify
3. Supprime la collection `mavigne` dans Firestore
   (Firestore Console → `mavigne` → ⋮ → Supprimer la collection)

---

## Déploiements futurs

À chaque modification de l'app, simplement :

```
npm run build && firebase deploy
```

---

## Domaine personnalisé (optionnel, futur)

Firebase Hosting permet d'ajouter un domaine personnalisé gratuit :
Firebase Console → Hosting → Ajouter un domaine personnalisé
→ ex: `app.mavigne.fr` ou `mavigne.guerettech.fr`

---

*Ma Vigne — GUERETTECH · Nicolas GUERET · ngdevpro@gmail.com*
