# NAV-1 → NAV-5 (état cumulé, série close) · APP 6.99 · SW 7.58 · base `f79891c`

Déposer chaque fichier au même chemin dans `mavigne-dev\` — `index.html` et `.mv-base` à la **racine**, pas dans `src\`.
Ce paquet **remplace** `nav-1-3` (même base, cinq lots empilés, §98 → §101).

| Lot | Ce qui change |
|---|---|
| **NAV-1 (§98)** | roue ⚙ sur Vigne (×3) et Tracteur ; Réglages 5 → 3 onglets ; 🏠 retiré des 10 en-têtes (voyant de synchro ré-ancré) |
| **NAV-2 (§99)** | « Le cadre » du Planning dans sa roue ; 5 documents, dont 4 volets du hub |
| **NAV-3 (§100)** | plus de bouton « Outils » au Pilotage : Archives = onglet, Paramétrage dans la roue ; conso GNR → roue Tracteur, IFT → roue Pilotage |
| **NAV-4 (§101a)** | roues Phyto (registre PDF/CSV, cuivre — le bouton violet sous le registre disparaît) et Réserve (inventaires) |
| **NAV-5 (§101b)** | « App » → « Moi » ; Documents & impressions dans Domaine › Données ; en-têtes « Cave », « Réserve » ; « Le Millésime » ; « Paramétrage » purgé |

Fichiers NAV-4/5 : `index.html`, `src/app.js`, `src/phyto.js`, `src/reserve.js`, `src/cave.js`, `src/pilotage.js`, `src/utils.js`, `public/sw.js`, `guide/01, 04, 07, 08, 09, 10, 12, 13, 14`, `scripts/mv-harnais-regl-module.mjs` (152 assertions, 30 contre-épreuves), `scripts/harnais-claude-md.mjs` (133), `CLAUDE.md` (§101 + correction de l'audit).

Puis : `node scripts/build-guide.mjs` → `npm run check` → `npm run build && firebase deploy`.

Vérifié ici : `npm run check` EXIT=0 · `npm run build` EXIT=0 · harnais 152/152 · démo, whatsnew, cliquets verts.
**Non vérifié** : rendu navigateur (pas de Chromium). À regarder en admin : les sept roues s'ouvrent ; Réglages montre Domaine · Équipe · Moi, avec « Documents & impressions » en bas de Domaine ; le registre phyto n'a plus de bouton violet ; les en-têtes disent « Cave » et « Réserve ».
Non déplacé, et dit : « Choisir les indicateurs » (par onglet du Pilotage) ; `#page-chat` (à trancher un autre jour, méthode CAVE-5).
