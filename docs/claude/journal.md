# Ma Vigne — Journal des consolidations

> Archive de l'en-tête de `CLAUDE.md`. Jusqu'au 27/09/2026, chaque consolidation s'empilait EN TÊTE
> du document, au-dessus de la première règle d'or : 1 190 lignes d'historique à traverser avant
> d'atteindre une consigne (§189). Désormais `CLAUDE.md` ne porte que la DERNIÈRE consolidation ;
> la précédente descend ici, **en tête** (ordre antichronologique).
> ⚠️ Archive : les états « à déployer », les numéros de version et les « points en suspens » cités
> ici étaient vrais le jour où ils ont été écrits. Rien ici ne se lit comme un fait présent —
> `APP_VERSION` (`src/utils.js`), l'en-tête de `public/sw.js` et le §28 de `CLAUDE.md` font foi.

> Dernière consolidation : **9 octobre 2026 (GF-2)** — ★ **LE « ≈ » QUE LES POLICES NE SAVENT PAS DESSINER** (§303). Lot 34, base `9caff41`.
> La CI de Nico a rougi sur GF-1 (§302) : `mv-harnais-subset` — la courbe des sucres étiquetait sa date estimée « ≈ 13/10 », et U+2248 n'est pas dans
> le subset des polices. Remplacé par « vers le 13/10 ». Baseline du subset regravée à la baisse (272 → 271, `pilotage.js` 28 → 27), clé par clé. Aucun
> bump : `cuvier.js` seul. ⚠️ Leçon : le rouge ÉTAIT dans mes journaux ; la chaîne jouée par tranches n'allait jamais jusqu'au résumé du lanceur, et un
> relevé maison terminé par `head -20` l'a coupé. La chaîne se joue jusqu'au bout — en arrière-plan s'il le faut — et SON résumé fait foi (§6b).

> Dernière consolidation : **9 octobre 2026 (GF-1)** — ★★ **LES SUCRES AU LABO PRENNENT LE RELAIS DE LA DENSITÉ** (§302). Lot 33, base `974a495`.
> Demande de Nico (maquette v1 publiée, puis « go ») : en fin de FA, l'analyse labo glucose + fructose (g/L) se note sur le relevé du Cuvier, trace sa
> courbe sous la densité et dit où en est la cuve — en route vers le sec (date dès 3 analyses), ça stagne, ça remonte, sèche au labo (≤ 0,2 g/L). Nico :
> « 2 g/L est un ancien seuil ; le vrai seuil est 0,2 » → le repère de densité suit (−0,8 point). En vérifiant, TROIS défauts : (1) une cuve décuvée
> « finira au chai » ne pouvait JAMAIS être déclarée finie → « Déclarer la FA finie » ; (2) la ligne « Fermentation à finir » du Chai se coupait en colonnes
> (§24, flex) ; (3) corriger un relevé de la tournée effaçait `qui`/`tour`. **APP 8.72 → 8.73, SW 9.50 → 9.51.**
> ⚠️ Leçon : le tirage au hasard de la Cave écrivait ses relevés sous `mesures`, l'appli lit `mesures_fa` — il n'en avait jamais testé un seul. Un tirage se vérifie sur la CLÉ qu'il nourrit.

> Dernière consolidation : **9 octobre 2026 (FORME-1)** — ★★ **LE DOMAINE EN DIRECT AUX FORMES RÉELLES, ET LE TOUCHER QUI N'OUVRAIT RIEN** (§301). Lot 32, base `53a0530`.
> Demande de Nico (maquette v1, puis v2 « plus compacte » validée, puis « go ») : chaque parcelle du plan à la forme de son contour, à la même échelle, compact
> (394 px de haut au lieu de 801 sur 37 parcelles), loupe au survol, fiche au toucher avec la forme en haut. En vérifiant, TROIS défauts : (1) la commune, rangée
> `{nom, lat, lng}`, s'écrivait « [object Object] » et fondait toutes les communes (plan et fiche Parcelles) ; (2) « en cours » lisait tout le journal, la pastille le
> journal du JOUR — parcelle commencée la veille sans équipe, « aucune équipe » écrit à tort → une seule lecture (`_ckPlanDebuts`) ; (3) le plan et Ctrl K appelaient
> `openSelParc` — la feuille des parcelles d'une TÂCHE — avec un nom de parcelle : rien ne s'ouvrait → `openDP`. **APP 8.71 → 8.72, SW 9.49 → 9.50.**
> ⚠️ Leçon : un nom qui « sonne juste » (`openSelParc`, « ouvrir la sélection de parcelle ») n'est pas un contrat — lire ce que la fonction attend avant de l'appeler.

> Dernière consolidation : **9 octobre 2026 (CADRE-1)** — ★★ **LE SOCLE DU COCKPIT VALAIT POUR TOUTE L'APPLI** (§300). Lot 31, base `9e9f030`.
> Quatre retours de Nico après la refonte, chacun REPRODUIT dans un vrai navigateur avant d'être corrigé : (1) `*,*::before,*::after{box-sizing:inherit}`,
> recopiée de la maquette du cockpit (07/10), mettait TOUTE l'appli en content-box — cases colorées du Planning de 72 px dans 67, **27 fenêtres sur 38**
> plus larges que leur cadre → bornée à `.ck2` (0 sur 38 après) ; (2) la barre de sélection (560) passait devant la journée (500) dès que la page ne
> s'anime pas → 450 ; (3) la fiche rangée de « Les gens » restait un `.overlay` : 130 éléments inertes, et le gel suivait sur le module suivant
> (`#page-planning{display:grid}` sans `.active`) → elle devient `.pl2-rangee`. **APP 8.70 → 8.71, SW 9.48 → 9.49.**
> ⚠️ Leçon : rendre aussi en « animations réduites » — l'animation d'entrée de `.page` cachait le défaut de z-index (§24, §300).

> ★ Consolidation : **9 octobre 2026 (E2E-1)** — ★ **LE TEST DE BOUT EN BOUT SUIT LE BOUTON « DÉMARRER UNE SESSION »** (§299). Lot 30,
> **Nico a poussé la refonte** (`646323e` « Refonte v870 », puis `34813db`) : ce lot part de `34813db`, zip de six fichiers. La CI de Nico (`npm run test:e2e`, qui ne fait PAS partie de
> `npm run check`) échouait à « Action session » : le test cliquait la FAB `#trac-fab`, cachée au large depuis TRAC-3 (§284). Le test clique
> maintenant le geste VISIBLE (`#trac-new-btn` au large, la FAB à l'étroit). Test seulement : aucune version ne bouge (APP 8.70, SW 9.48).
> ⚠️ Leçon : jouer aussi `npm run test:e2e` avant de livrer un lot qui cache ou remplace un bouton — la chaîne ne le fait pas.

> ★ Consolidation : **7 octobre 2026 (IDS-1, activités — zip cumulatif avec IDS-1S non poussé)** — ★★ **RENOMMER UNE ACTIVITÉ** (§258).
> Fiche de l'activité (roue crantée du Tracteur, admin) : `_renameActivite` réécrit ACTIVITES et `SESSIONS[].activite` (le seul endroit qui garde
> ce nom) ; règle `CONFIG.renommages_activites`, ignorée tant qu'une activité porte encore l'ancien nom (pas d'identifiant) ; « Traitement » ne se
> renomme pas et aucun nom ne le devient (phyto.js l'attend). Les TRACTEURS se renommaient déjà dans leur fiche : tout les désigne par `tracteurId`.
> §257 (IDS-1S, non poussé) : renommer un salarié — fiche, tous les registres, clés du planning et de la paie déplacées, téléphone du renommé suit.
> Harnais `mv-harnais-renom-act` (+ `mv-harnais-renom-membre`). Base `40c3be5`. **APP 8.28 → 8.30, SW 9.06 → 9.08.** Précédent : GNR-2 (§256).
> Restent pour IDS-1 : rien de prévu — « Renommer » ailleurs si le besoin se présente ; le chat (conversations privées rangées par noms, §257).
> Consolidations précédentes : `docs/claude/journal.md`.

> ★ Consolidation : **7 octobre 2026 (IDS-1, salariés)** — ★★★ **RENOMMER UN SALARIÉ** (§257), dans sa fiche (Réglages › Équipe, admin).
> Le COMPTE ne change pas (droits = adresse/uid, jamais le nom). `_renameMembre` (reglages.js) réécrit le nom dans TOUS les registres — journal
> (qui, membresEquipe), sessions/entretiens/réparations, phyto (conducteur, operateur), conducteurs, Chai (operateur, intervenants, uploaded_by),
> Cuvier (mesures_fa.qui), équipes du jour, home_layout, mur_mot — et DÉPLACE les clés par nom du planning (entrées, heures sup, acomptes) et de la
> paie (taux, historique, série). Règle `CONFIG.renommages_membres` ; le téléphone du renommé suit (session, empreinte hors réseau). Limite : chat.
> Harnais `mv-harnais-renom-membre` (sortie rapide qui ignorait ces règles ; Chromium : réparations = objet). Base `40c3be5`. **APP 8.29, SW 9.07.**
> Précédent : **6 octobre 2026 (GNR-2)** — ★★ **LA CUVE GNR SE LIT DE NOUVEAU SUR TÉLÉPHONE : LE BLOC TRACTEUR A SA GRILLE** (§256). — archivé dans journal.md.

> ★ Consolidation : **6 octobre 2026 (GNR-2)** — ★★ **LA CUVE GNR SE LIT DE NOUVEAU SUR TÉLÉPHONE : LE BLOC TRACTEUR A SA GRILLE** (§256).
> Capture de Nico (06/10) : la carte Cuve d'Aujourd'hui tassée en demi-colonne (barres à 0 px, « −19 », échelle « 0625125 L », titre sur trois
> lignes, moitié droite vide). Cause : le bloc portait `.pil-dec`, où ALIGN-1 a posé « par deux sous 600 px » pour les quatre tuiles du jour.
> Désormais `.pil-trx` seul : une colonne jusqu'à 1 023 px ; à partir de 1 024 px, travaux 2/3 + cuve 1/3, révision dessous sur toute la largeur
> (`pil-trx-cote1/2`, `pil-trx-paire`, posées par `_pilCkTracteur`). Cascade élastique ; titre « 920 L » + phrase à côté (`.pil-trx-v`).
> Rendu regardé dans Chromium avant/après (5 largeurs, 4 cas, thème sombre). Harnais `mv-harnais-gnr2`. Base `e3e719a`. **APP 8.27 → 8.28, SW 9.05 → 9.06.**
> Précédent : AOC-1, les appellations dans la roue crantée de la Cave (§255) — archivé dans journal.md.

> ★ Consolidation : **6 octobre 2026 (AOC-1)** — ★★ **LES APPELLATIONS QUITTENT RÉGLAGES › DOMAINE POUR LA ROUE CRANTÉE DE LA CAVE** (§255).
> Choix de Nico sur deux maquettes (option B, puis « condenser ») : dans « Le Millésime », DEUX LIGNES qui résument (`_aocResumeHtml`), chacune
> ouvre SA fenêtre — `ovAocPlafonds` (millésime, une ligne par appellation, « ⋯ ») et `ovAocRattach` (filtres, sans appellation en tête,
> « Rattacher »/« Changer »). Actions inchangées (_aocAjouter…_aocSetParc) ; `_aocRenderCard` redessine lignes + fenêtre ouverte. `_caveGoAoc`
> et `#aoc-card` n'existent plus. Réglages › Domaine : 2 188 → 1 293 px. Harnais `mv-harnais-aoc-cave`. Base `a6ea76f`. **APP 8.26 → 8.27, SW 9.04 → 9.05.**
> Précédent : IDS-1 lot 4, renommer une parcelle (§254) — archivé dans journal.md.
> Restent : les salariés (IDS-1, après le planning) ; le reste de Réglages › Domaine est rangé.

> ★ Consolidation : **6 octobre 2026 (IDS-1, lot 4)** — ★★★ **RENOMMER UNE PARCELLE** (§254), dans la roue crantée de la Vigne (décision de Nico).
> « Renommer est rare » : chaque module renomme ce qui lui appartient, dans SA roue crantée (Vigne : tâches, et maintenant parcelles). La parcelle
> garde son `pid` ; `_renameParcelle` (reglages.js) réécrit le nom dans TOUS les registres — journal, sessions (parcellesFaites, parcelles,
> parcelle), phyto, Chai/Cuvier (sans casse), fertilisation (parcs, man), carte (name), tournées — ; travaux recalculés ; archives inchangées.
> Règle `CONFIG.renommages_parcelles` (RENOM-3) appliquée à chaque registre reçu ; ignorée si une AUTRE parcelle a repris l'ancien nom. Harnais
> `mv-harnais-renom-parc` (la liste des registres). Base `1a1de45`. **APP 8.25 → 8.26, SW 9.03 → 9.04.** Précédent : IDS-1 lot 2 (§253) — journal.md.
> Restent pour IDS-1 : les salariés (après le chantier du planning) ; « Renommer » dans les autres roues crantées si besoin.

> ★ Consolidation : **5 octobre 2026 (IDS-1, lot 2 — zip cumulatif avec le lot 1 non poussé)** — ★★ **LE NOM SUIT L'IDENTIFIANT** (§253).
> Lot 1 (§252) : chaque parcelle et chaque entrée du journal reçoivent un `pid` déduit du nom (`src/ids.js`), posé par saveData, normalisé
> des trois côtés dans les fusions. Lot 2 : au lieu de reprendre les 325 comparaisons de noms, le nom porté par une entrée est tenu À JOUR
> d'après son `pid` (`mvNomsParPid`, `mvNomsJournal` — réception, chargement, écriture, fusion) : renommer une parcelle (lot 4) suffira, chaque
> écran retrouvera son historique. Sans effet aujourd'hui. Harnais `mv-harnais-ids1`, `mv-harnais-ids1b`. Base `7a6a9ac`. **SW 9.01 → 9.03, APP 8.25.**
> Précédent : VUE-EQUIPE-1 (§251, autre session) — archivé dans journal.md.
> Taille : ≈ 13 octets par entrée (journal à 108 Ko, 10,5 %, chez le domaine de référence le 05/10 : négligeable).

> ★ Consolidation : **5 octobre 2026 (IDS-1, lot 1)** — ★★ **CHAQUE PARCELLE A UN IDENTIFIANT PERMANENT** (§252), choix de Nico (option A), livré en zip, remplacé avant d'être poussé par le zip cumulatif du lot 2 (§253).
> `src/ids.js` : `mvPidDe(nom)` déduit du nom (deux téléphones posent le même) ; saveData pose `pid` sur les parcelles et les entrées du journal
> d'une parcelle connue ; les deux fusions normalisent les trois côtés. Harnais `mv-harnais-ids1`. SW 9.01 → 9.02.

> ★ Consolidation : **5 octobre 2026 (VUE-EQUIPE-1)** — ★★ **L'ÉQUIPE DU MOIS, VUE PAR UN SALARIÉ** (§251).
> Maquette « Planning — vue salarié » validée : le salarié a deux onglets, **Mon mois** (par défaut, inchangé) et **L'équipe** (clé `eqmois`,
> lecture seule) — présent / absent jour par jour sur le mois EN COURS, jamais le motif (un congé = « Abs »), absence partielle = présent,
> sa ligne en tête, « Présents » = présents parmi les attendus (collectives à part). Un jour se classe par `_pl2Cell`, comme la grille de
> l'admin. ⚠️ Pas la clé `equipe` : ancienne clé migrée vers `mois` (trouvé par le harnais). Harnais `mv-harnais-vueeq1` (16 + 8 contre-épreuves),
> surface ajoutée au tirage au hasard du Planning. Marque `lots/VUE-EQUIPE-1.json`. Base `7f013fb` (MOTIFS-1 poussé). **APP 8.24 → 8.25,
> SW 9.00 → 9.01**. Précédent : MOTIFS-1 (§250), les motifs ne quittent plus l'appareil de l'admin — archivé dans journal.md.

> ★ Consolidation : **5 octobre 2026 (MOTIFS-1)** — ★★★ **LES MOTIFS D'ABSENCE NE QUITTENT PLUS L'APPAREIL DE L'ADMIN** (§250).
> Règle de Nico : un salarié ne voit pas les motifs de ses collègues — et son téléphone ne les reçoit pas. `planning_entries`, `planning_hsup`,
> `planning_acomptes` : lecture admin seule (`isAdminReadDoc`). Le serveur fabrique `planning_equipe` (l'équipe sans motif) et `planning_moi_<uid>`
> (SES jours complets) — déclencheurs `functions/planning-vues.js`, règle pure `planning-vues-calc.js` ; un téléphone de salarié les compose
> (`src/planning-vue.js`, `firebase.js/_mvClesLues`, garde de `fbSave`). Ordre : functions → `gtPlanningVues` → hosting → rules (§28).
> Harnais `mv-harnais-motifs1` (49 + 14 contre-épreuves) et section P de `mv-harnais-rules`. Marque `lots/MOTIFS-1.json`. Base `986a76d`.
> **APP 8.23 → 8.24, SW 8.99 → 9.00**. Précédent : GT-1 (§249), la console GUERETTECH dans gt.html — archivé dans journal.md.

> ★ Consolidation : **5 octobre 2026 (GT-1)** — ★★★ **LA CONSOLE GUERETTECH QUITTE L'APPLI DES CLIENTS** (§249). Elle est à **/gt.html**.
> `index.html` = l'appli des clients, sans `admin-gt.js` ni le balisage GT (repères `MV-GT:CONNEXION` / `MV-GT:CONSOLE`). `gt.html` = la même appli +
> `src/gt/connexion.html` + `src/gt/console.html`, entrée `src/gt.js` (app.js PUIS admin-gt.js) ; FABRIQUÉE par `scripts/mv-gt-page.mjs` à chaque
> `npm run build` / `dev`, jamais éditée, ignorée par git. Précache sans le fichier de la console. Cinq appuis sur le logo (client) → /gt.html.
> Harnais `mv-harnais-gt1`. Marque `lots/GT-1.json`. Base `7aa9ce7` (TEXTE-A et JOURNAL-1 poussés). **SW 8.98 → 8.99, APP 8.23 inchangé** (rien pour les clients).
> Précédent : JOURNAL-1 (§248), le Journal en 0,12 s — archivé dans journal.md.

> ★ Consolidation : **5 octobre 2026 (JOURNAL-1, zip cumulatif avec TEXTE-A non poussé)** — ★★ **LE JOURNAL EN 0,12 S** (§248).
> `.dgroup{content-visibility:auto}` : un jour hors écran n'est ni mis en page ni peint ; place réservée par jour (`52 + lignes × 96` px,
> `auto`). La règle CONTIENT le groupe : ombres (rembourrage 8 / 12 px + marges négatives) et marges qui ne traversent plus (écarts recalculés,
> valeurs sur l'échelle --e-* : 20 entre jours, 20 avant « Voir plus », 36 en fin) — `mv-harnais-journal1` refait les comptes. ×4 : 336 → 122 ms.
> Au pixel : identique (écart max 3/255). Marques `lots/JOURNAL-1.json` (inclut TEXTE-A), `lots/TEXTE-A.json`. Base `3cf9be9`. **APP 8.21 → 8.23, SW 8.96 → 8.98**.
> Précédent : TEXTE-A (§247), les petits textes relevés (« jetons ») — archivé dans journal.md.

> ★ Consolidation : **5 octobre 2026 (TEXTE-A)** — ★★★ **LES PETITS TEXTES RELEVÉS** (§247), choisis par Nico sur maquette.
> Maquette publiée (3 écrans réels, avant / jetons / plancher) → « jetons » : `--pt-micro` 11 → 12, `--pt-lbl` 10,5 → 11,5, `--pt-nano` 9,5 → 11.
> Replis `var(--pt-*, Npx)` d'avant gardés EXPRÈS (impressions non jugées), sauf `pilotage.js` (règle de mv-harnais-echelle). 416 tailles à 12 / 11,5 px
> passent par les jetons (même rendu ; règle « pas de cran en dur »). Registre phyto : la ligne tient (noms raccourcis, « +N » à part).
> Harnais `mv-harnais-textea`. Marque `lots/TEXTE-A.json`. Base `3cf9be9` (les quatre lots du 04/10 poussés). **APP 8.21 → 8.22, SW 8.96 → 8.97**.
> Précédent : TAILLE-2 (§246), la taille avant l'envoi, alerte à 90 % — archivé dans journal.md.

> ★ Consolidation : **4 octobre 2026 (TAILLE-2, zip cumulatif avec VOILE-1, ENTREE-1, RENDU-1 non poussés)** — ★★ **LA TAILLE AVANT L'ENVOI** (§246).
> La règle de taille Firestore vit dans `src/taille-doc.js` (pur, partagé avec `npm run taille`, vérifié par son `--test`). Juste
> avant chaque écriture (fusion, parcelles, écriture directe, file) : > 90 % → alerte silencieuse à la console GT, 1×/jour/doc/téléphone ;
> > 1 Mio → rien ne part, rien en file : coffre + message clair. Refus de taille du serveur : même chemin, sans nouvel essai. Aucun bump
> (firebase.js + module). Harnais `mv-harnais-taille2`. Marques `lots/TAILLE-2.json` (inclut les trois autres) et précédentes. Base `24aa425`.
> **APP 8.18 → 8.21, SW 8.93 → 8.96** (les trois lots d'avant). Précédent : RENDU-1 (§245), l'écran ne se fige plus — archivé dans journal.md.

> ★ Consolidation : **4 octobre 2026 (RENDU-1, zip cumulatif avec VOILE-1 et ENTREE-1 non poussés)** — ★★ **L'ÉCRAN NE SE FIGE PLUS** (§245).
> Un document reçu ne redessine plus l'Accueil ET Parcelles aussitôt : `_mvRendreBientot` (firebase.js) accumule les clés et
> redessine à l'image suivante la SEULE page affichée, une fois (`_MV_RENDU_PAGES`). Chromium ×4, collègue qui valide (3 documents) :
> Accueil 324 → 140 ms, Parcelles 416 → 56, Journal 673 → 90 (journal de 1 000) ; à 15 000 entrées il reste la copie de la base. Harnais
> `mv-harnais-rendu1`. Marques `lots/RENDU-1.json` (inclut VOILE-1, ENTREE-1), `lots/ENTREE-1.json`, `lots/VOILE-1.json`. Base `24aa425`.
> **APP 8.18 → 8.21, SW 8.93 → 8.96** (trois lots). Précédent : ENTREE-1 (§244), se connecter sans réseau — archivé dans journal.md.

> ★ Consolidation : **4 octobre 2026 (ENTREE-1, zip cumulatif avec VOILE-1 non poussé)** — ★★★ **SE CONNECTER SANS RÉSEAU, EN RETAPANT SON MOT DE PASSE** (§244).
> Nico : « on peut se connecter même sans réseau (cave, mauvais signal) » — mal lu d'abord (j'avais conclu « le réseau reste requis »), corrigé.
> Après chaque connexion réussie : empreinte PBKDF2 du mot de passe + uid + droits sur le téléphone (`mavigne_entree_v1_<domaine>`). Sans réseau
> (ou réseau qui traîne > 8 s, ou App Check en échec) : empreinte + session du téléphone = on entre ; clés libérées selon `CLES` de la copie ; la
> copie devient la base de fusion (sinon les parcelles en retard écrasaient un collègue) ; reprise au retour du signal. Harnais `mv-harnais-entree1`.
> Marques `lots/ENTREE-1.json` (inclut VOILE-1) et `lots/VOILE-1.json`. Base `24aa425`. **APP 8.18 → 8.20, SW 8.93 → 8.95** (visible, deux lots).

> ★ Consolidation : **4 octobre 2026 (VOILE-1 + PROFILS-1)** — ★★ **L'OUVERTURE : LE VOILE TANT QUE RIEN N'EST PRÊT, LES TUILES DE L'APPAREIL D'ABORD** (§243).
> Voile : chorégraphie complète à la 1re ouverture de l'appareil seulement (`mavigne_voile_vu`), ensuite effacé dès que l'écran de connexion
> montre quelque chose (≥ 600 ms, fondu 250 ms). Tuiles : `window._mvTuilesAppareil` appelée par `_fbLoad` AVANT ses attentes bornées ; branche
> hors ligne gardée ; `_mvDemarrer` part à DOMContentLoaded (`load` attendait reCAPTCHA). Chromium, réseau sans réponse : tuile 18,5 s → ~1 s
> (voir §243c). Décisions de Nico : ENTREE-1 redéfini (gestionnaire de mots de passe), PAQUET-1 abandonné, TEXTE-A maquette, GT-1 décidé. Harnais
> `mv-harnais-voile1` (neuf). Marque `lots/VOILE-1.json`. Base `24aa425`. **APP 8.18 → 8.19, SW 8.93 → 8.94** (visible).

> ★ Consolidation : **4 octobre 2026 (VALID-1 + LOGIN-1)** — ★★ **« VALIDER » N'ATTEND PLUS LA MÉTÉO ; SANS RÉSEAU, LA CONNEXION DIT LA VÉRITÉ** (§242).
> Les deux défauts prouvés par l'audit (§241), « go » de Nico. `confirmValidation` et `saveJournalEntry` écrivent, enregistrent et ferment
> AVANT tout appel réseau ; `_mvMeteoApres` complète l'entrée ensuite (retrouvée par id ; `pQuickValidate` y passe aussi) ; `fetchMeteoMoyenne`
> et la branche météo du SW bornées à 6 s. `confirmLogin` : `appCheck/…` ou hors ligne → « Pas de connexion réseau », plus « Mot de passe
> incorrect ». Rejoué dans Chromium sur le build : feuille fermée en moins d'1 s, message juste. Harnais `mv-harnais-valid1` (neuf, 31 + 10/10).
> Guide 01 : se connecter demande du réseau. Marque `lots/VALID-1.json`. Base `57a48b3`. **APP 8.17 → 8.18, SW 8.92 → 8.93** (visible).

> ★ Consolidation : **4 octobre 2026 (AUDIT-PERF)** — ★★ **VITESSE, DONNÉES, ERGONOMIE TERRAIN : L'AUDIT MESURÉ** (§241).
> Demande de Nico (04/10) : le niveau de Linear, Notion, Figma. Audit mesuré dans un vrai Chromium (build de prod, téléphone ×4),
> `audit-perf-ux.md` à la racine, rien d'intégré. Deux défauts PROUVÉS : « Valider » de la feuille attend Open-Meteo sans limite avant
> d'écrire (`confirmValidation`, `saveJournalEntry` ; `pQuickValidate` a le bon patron) ; hors réseau on n'entre pas et l'écran dit
> « Mot de passe incorrect. » (`appCheck/fetch-network-error`). Aussi : voile imposé de 3,4 s, profils vides 18,6 s sur un réseau qui
> traîne, gel de 0,6 s par validation reçue, journal plein vers 6 600 entrées. 13 lots proposés. §4 corrigé. Base `c62f429`. **Aucun bump**.

> ★ Consolidation : **4 octobre 2026 (DEMO-4)** — ★★ **LA DÉMO DU SITE : UN DOMAINE, QUATRE TÉLÉPHONES** (§240).
> Demande du 03/10 (« comme Apple ou Google ») → maquette publiée, cinq tours de retouches, « go » le 04/10. `/demo.html`, page neuve du
> site : le produit en vedette, « Quel téléphone prenez-vous en main ? », un parcours par rôle (gérant 8 scènes, ouvrier 7, tractoriste 6,
> maître de chai 8) sur des CAPTURES de la vraie appli prises avec les droits de chaque rôle, « Un domaine, quatre téléphones », sept
> questions sans nommer un concurrent, la fin en heures (127 h à 12 ha et 6 permanents, zéro montant). `logiciel-vigne` y mène ; le tour
> `?demo=visite` reste la porte « librement ». Harnais `mv-harnais-demo` (neuf, 11 + 10/10). Marque `lots/DEMO-4.json`. Base `8645b31`.
> **Aucun bump** (page du site, hors shell). Rappel : `npm run site` → `npm run build` → `firebase deploy --only hosting`.

> ★ Consolidation : **4 octobre 2026 (GESTES-1, avec la note NOTE-DRM non poussée)** — ★★ **DÉGUSTER, TRAITER, FILTRER** (§239).
> Benchmark des logiciels de cave puis maquette `maquette-cave-gestes-v1.html` validée « go avec les recos », plus une demande de Nico :
> désigner UN FÛT quand une anomalie s'y montre (de base, la dégustation porte sur la cuvée). Trois types dans « Nouvelle opération » :
> fût = lot + repère (aucun fût nominatif) ; traitement = produit de La Réserve, unité et quantité lues du Cuvier (frontière), sortie de
> stock par `_consoCuvier` ; registre : famille par nature (`_rmTraitT`, « Corrections d'acidité »), filtration en pratiques, dégustation
> en pied. Au passage : les 82 fûts en dur du soufre, l'espace avant « · » (entrée 10). DRM : backlog, entrée 43. Harnais `mv-harnais-gestes`
> (neuf, 60 + 7/7). Marque `lots/GESTES-1.json`. Base `5a0d37e` (rejoué sur ALIGN-3). **APP 8.16 → 8.17, SW 8.91 → 8.92** (visible).

> ★ Consolidation : **4 octobre 2026 (ALIGN-3)** — ★ **CORRECTIF : UN BLOC MASQUÉ RESTE MASQUÉ SUR L'ACCUEIL** (§238).
> Nico (04/10, après ALIGN-2 en ligne) : les blocs masqués réapparaissaient une fois la personnalisation validée, l'ordre semblait
> bousculé, « on ne voit pas l'œil ». Cause : `#home-cols > .home-w{display:flex}` (un ID) battait `.home-w.home-w-off{display:none}`
> (une classe) — sur ordinateur seulement. L'état masqué est redit au niveau d'ID ; en édition, estompé. L'œil reste un œil, barré
> quand le bloc est masqué (le panneau « interdit » ne se lisait pas comme un œil), titre et `aria-label` disent l'action.
> ★ LEÇON : une règle de mise en page posée sur un ID doit redire les états cachés de ses enfants. Harnais `mv-harnais-align2` (+2, +2).
> Marque `lots/ALIGN-3.json`. Base `657cb29`. **APP 8.15 → 8.16, SW 8.90 → 8.91** (visible).

> ★ Consolidation : **4 octobre 2026 (ALIGN-2, avec ALIGN-1 non poussé)** — ★★ **L'ACCUEIL EN RANGÉES** (§237).
> Suite de la maquette validée « c'est parfait » (§236). KIT-2 (grille) laissait des trous, KIT-5 (colonnes) n'alignait plus rien :
> `#home-cols` redevient une grille, en RANGÉES PLEINES — même hauteur par rangée, carte qui remplit le bloc, pied collé en bas ;
> `_homeRangees` étire un bloc resté seul (voisin masqué, vide ou pleine largeur) ; `lay.large` + bouton « Pleine largeur » (ordinateur,
> mode édition) ; « meteosect » né de « meteo5 » (migration : sa place et son état masqué), secteurs en UNE carte ; ordre par défaut
> de la maquette. Harnais `mv-harnais-align2` (neuf), `mv-harnais-kit2` suivi. Zip CUMULATIF ALIGN-1 + ALIGN-2, marques `lots/ALIGN-1.json`
> et `lots/ALIGN-2.json`. Base `3b9c695`. **APP 8.13 → 8.15, SW 8.88 → 8.90** (visible).

> ★ Consolidation : **4 octobre 2026 (ALIGN-1)** — ★★ **LA DÉCISION DU JOUR : QUATRE TUILES BÂTIES PAREIL** (§236).
> Nico (04/10, capture) : quatre cartes de même hauteur au Pilotage, contenu collé en haut, deux grands vides. Recherche (rangées de
> même hauteur, le contenu s'adapte à la carte) puis maquette (canevas Design, Accueil + Pilotage + téléphone) validée « c'est
> parfait ». Lot 1 = Pilotage : chaque tuile a quatre étages (verdict, raison, bande, pied ; `pil-tz-*`), pied collé en bas ; la
> protection (`_pilProtCarte`) et la tension par personne (`_pilCardTension`) descendent dans `.pil-dec2`, 5 lignes + bouton
> (`prot_tout`) ; tuile `_pilTuileTension` ; bouton de priorité toujours là pour l'admin ; tuiles par deux sur téléphone.
> Harnais `mv-harnais-align` (neuf). Marque `lots/ALIGN-1.json`. Base `3b9c695`. **APP 8.13 → 8.14, SW 8.88 → 8.89** (visible).

> ★ Consolidation : **4 octobre 2026 (PRIO-1)** — ★★ **LA TÂCHE DU MOMENT : UNE SEULE RÈGLE, D'APRÈS LES DATES DE TRAVAUX** (§235).
> Nico (04/10, captures) : la « tâche prioritaire » restait la Taille quoi qu'il fixe — Pilotage = la tâche aux plus d'heures restantes
> (« pôle long »), Ma part du chantier = la plus travaillée sur 15 j sinon la première de la liste ; seuls Parcelles et Décider lisaient
> la priorité fixée. Règle tranchée par Nico : l'ordre vient des dates de travaux de la période (`saison.echeances`, chaque domaine le
> sien) ; priorité fixée d'abord ; une seule tâche dans ses dates → elle ; plusieurs → l'admin choisit, jamais l'appli ; aucune → la
> prochaine. Moteur pur `_mvPrioRegle` + collecteur `_mvTacheDuMoment` (app.js), lus par `_pilCkPrio`, `_mvPartTache`, `_dzTachesDefaut`.
> Harnais `mv-harnais-prio` (neuf, 36 + 14/14). Marque `lots/PRIO-1.json`. Base `a1286f4`. **APP 8.12 → 8.13, SW 8.87 → 8.88** (visible).

> ★ Consolidation : **4 octobre 2026 (ANNEE-1)** — ★★ **PILOTAGE › L'ANNÉE, UN CADRE À LA FOIS** (§234).
> Nico (04/10, capture) : l'onglet ne montrait que le pic des vendanges, affichait cinq chiffres pour un même exercice et posait
> l'exercice en euros face à une année vigne en heures — le cycle FINI le 6/09. Maquette (canevas Design) validée : un seul cadre à
> la fois — exercice comptable OU année vigne (`_mvCampagneBornes`, choix de Nico) — dans `_PIL_SCOPE` (`cadre` mémorisé, `recul`
> NON) ; budget en euros = `_pexData` aux dates du cadre (dépensé / reste prévu / total) ; « Le renfort à prévoir » = photo des
> manques (`_pilAnFenetres`), bouton vers Décider ; photos et fil d'Ariane suivent. Harnais `mv-harnais-annee` (neuf).
> Marque `lots/ANNEE-1.json`. Base `70406bb`. **APP 8.11 → 8.12, SW 8.86 → 8.87** (visible).

> ★ Consolidation : **3 octobre 2026 (RENOM-3 + KIT-5)** — ★★ **L'ADMIN RENOMME, LA RÈGLE S'IMPOSE À TOUS LES APPAREILS ; L'ACCUEIL SANS TROUS** (§232, §233).
> RENOM-3 : un renommage (admin seul) devient une règle `CONFIG.renommages_taches` ({de, vers, quand, par}) que CHAQUE appareil
> applique à chaque chargement et à chaque donnée reçue (`_mvAppliquerRenommages`, firebase.js) — dans l'ordre des dates ;
> l'état le plus avancé gagne (`_renFusion`) ; un appareil d'admin enregistre, les autres corrigent en mémoire. Personne n'a à
> être synchronisé avant (Nico : « c'est l'admin qui prévaut »). KIT-5 : les blocs de l'Accueil dans `#home-cols`, en colonnes
> CSS — plus de trous. Harnais `mv-harnais-renom` (15, 9/9), `mv-harnais-kit2` adapté (11, 7/7). Marque `lots/RENOM-3.json`.
> Base `9a6cf8e`. **APP 8.10 → 8.11, SW 8.85 → 8.86** (visible).

> ★ Consolidation : **3 octobre 2026 (RENOM-1 + LOTS-1)** — ★★ **RENOMMER UNE TÂCHE ; LA GARDE DES LOTS FRÈRES** (§230, §231).
> RENOM-1 : `_renameTache` (reglages.js) migre toutes les clés d'une tâche du domaine (parcelles et chaque période, exclusions,
> journal, périodes et échéances, TRAVAUX, passages, priorité, objectifs, équipes du jour) ; entrée dans la fenêtre « Modifier »
> (`#ovRenTache`) ; les tâches du catalogue ne se renomment pas. LOTS-1 : chaque lot pose sa marque `lots/<LOT>.json`
> (`scripts/mv-lot-marque.mjs`) ; `scripts/mv-lots.mjs`, juste après `mv-base`, refuse deux lots frères en attente de commit et
> un fichier écrasé — **ligne 7 de la clôture de lot**. ★ Zip CUMULATIF : KIT-3 + KIT-4 (non poussés) + RENOM-1 + LOTS-1.
> Harnais `mv-harnais-renom` (8, 5/5) et `mv-harnais-lots` (6, 4/4). Base `1d3a59b`. **APP 8.09 → 8.10, SW 8.84 → 8.85** (visible).

> ★ Consolidation : **3 octobre 2026 (KIT-4)** — ★ **LOT 3c DU KIT (CAVE, CUVIER) ET LES SURFACES DE TOUS LES MODULES** (§229).
> `window._mvHaP` (parcelle, 4 décimales) et `window._mvHaT` (total, 2), toujours à la virgule, dans le Traitement, le Tracteur,
> les Réglages et le Cuvier (17 surfaces écrites à la main, plusieurs au point). Barres de la Cave, de la vendange et du
> Cuvier au kit ; le niveau de cuve en terre (le mesuré). ★ Zip CUMULATIF : il contient KIT-3 (§228), pas encore poussé.
> Harnais `mv-harnais-kit4` (6, contre-épreuve 4/4). Base `1d3a59b`. **APP 8.08 → 8.09, SW 8.83 → 8.84** (visible).

> ★ Consolidation : **3 octobre 2026 (KIT-3)** — ★ **LOT 3b DU KIT : LES BARRES DE LA VIGNE, DU PLANNING ET DU TRACTEUR** (§228).
> Barres fines (6 px) et normales (10 px) en pilule, couleur d'état (fiche rapide de la carte : `cl.fill` ; sessions tracteur :
> vert fini, doré en cours — plus l'orange du retard) ; un seul cercle (168 px). Point 4a : `_pilEchCadence` lit la journée du
> MODÈLE du planning (`_pilJourModele`, capCum) avant la journée réglée (h_jour). Point 4b : « Dégraffage » ne se renomme pas —
> le nom d'une tâche est la clé de tout son historique et Réglages n'a aucun renommage de tâche (seulement des périodes).
> Harnais `mv-harnais-kit3` (7, contre-épreuve 5/5). Base `1d3a59b`. **APP 8.07 → 8.08, SW 8.82 → 8.83** (visible).

> ★ Consolidation : **3 octobre 2026 (KIT-2)** — ★ **L'ACCUEIL ET LES PARCELLES SUR DEUX COLONNES ; LES CHIFFRES DROITS PARTOUT** (§227).
> Sur les captures de Nico (PC, mode normal et Personnaliser) : `#page-home.active` en grille de deux colonnes à partir de
> 1 024 px (les `.home-w` en sont les enfants directs ; le reste et le bloc épinglé en pleine largeur), `_homeDragMove` en
> deux dimensions ; les cartes de parcelle (`.mv-c`, conteneur `#pList`, séparé des bandeaux) aussi sur deux colonnes. Chiffres
> elzéviriens de la Cormorant (« I7% », « I9° ») → `body{font-variant-numeric:lining-nums}` (la sous-police garde `lnum`).
> Tuiles « 17 % » / « 11,85 », barre de saison à l'état. Reconstruit sur `b6d2cd5` : la première livraison (base `c855567`)
> doublait ANN-1b, poussé entre-temps avec les mêmes numéros. Harnais `mv-harnais-kit2` (11, contre-épreuve 6/6).
> Base `b6d2cd5`. **APP 8.06 → 8.07, SW 8.81 → 8.82** (visible).

> ★ Consolidation : **3 octobre 2026 (ANN-1b)** — ★ **LA GRANDE NOUVEAUTÉ QUI MONTRE LE CHEMIN DU JOURNAL** (§225g).
> Demandé par Nico : un dernier Quoi de neuf, **majeur**, pour que tout le monde sache où lire les mises à jour. `WHATS_NEW` 8.06 :
> un item `niv: 3, pour: ['tous']` → la grande fenêtre (la première du système ANN-1 : 8.04 et 8.05 n'avaient aucun niveau 3).
> Base `c855567` (ANN-1 poussé en `bd53451`, KIT-1 en `c855567`). **APP 8.05 → 8.06, SW 8.80 → 8.81**.

> ★ Consolidation : **3 octobre 2026 (KIT-1)** — ★★ **LE KIT GRAPHIQUE COMMUN, LOT 3a : ACCUEIL ET PILOTAGE** (§226).
> Maquette du kit validée (« go », Nico). Une ligne d'avancement commune (`_mvkAvancement`, utils.js) pour l'Accueil et
> Pilotage › La campagne : noms entiers (`tAbr` retiré), couleur d'ÉTAT (fait / cours / retard = fenêtre passée, `_mvkRetards`),
> détail heures ou surface (`_mvkDet`, ex-`_pilBarQte`) ; barre des parcelles à l'état ; « Agrandir » sur chaque graphe suivi
> (`_mvGraphDessine` + `#ovGraph`) ; grands chiffres proportionnels (« I 2 % ») ; 1 200 px sur grand écran (3 pages).
> Harnais `mv-harnais-kit1` (12, contre-épreuve 6/6). Base `bd53451`. **APP 8.04 → 8.05, SW 8.79 → 8.80** (visible).

> ★ Consolidation : **3 octobre 2026 (ANN-1)** — ★★ **LES NOUVEAUTÉS EN QUATRE NIVEAUX : LA FENÊTRE NE S'OUVRE PLUS QUE POUR LES GRANDES** (§225).
> Nico : « le What's New est beaucoup trop présent ». Mesuré : 50 versions annoncées en deux semaines, une fenêtre d'office chez
> tout le monde. Chaque item de `WHATS_NEW` porte désormais `niv` (0 Journal seul · 1 pastille « Nouveau » sur `cible` · 2 ligne
> « À vérifier » sur l'Accueil jusqu'à « Vu » · 3 grande fenêtre, 30 jours, 3 au plus) et `pour` ; le bloc porte `d`. Journal des
> nouveautés dans Réglages › Moi ; l'histoire d'avant 8.04 n'est pas réécrite. Harnais `mv-harnais-annonces` (33, contre-épreuve 9/9),
> règles dans `mv-whatsnew-check`. Construit sur `1a75533`, rejoué sur `ca4caa2` (RENF-2 avait pris 8.03 et §224). Base `ca4caa2`.
> **APP 8.03 → 8.04, SW 8.78 → 8.79**.

> ★ Consolidation : **3 octobre 2026 (RENF-2)** — ★★ **LE RENFORT DIT COMBIEN DE SAISONNIERS, ET QUAND — SANS HEURES SUP** (§224).
> Lot 2 de COH-1, maquette v2 validée par Nico. `_rfCfg` : hMax = hJour (fini les 8 h au lieu de 7). La carte de Décider
> répond d'office en calendrier (`_rfCalendrier` : par travail qui déborde, le moins de monde possible sur SA fenêtre, via
> `_rfMinR` étendu à un profil posé) ; « Et sans renfort ? » (`_rfSansRenfort`, plafond nommé `c.plaf`, 25 % jusqu'à la 43e
> heure, 50 % au-delà) ; TESA / CDD (`c.capS`) ; « Choisir moi-même la période ». Onze fonctions de l'ancienne carte retirées.
> Harnais `mv-harnais-renf2` (17, contre-épreuve 7/7) : le vrai moteur redonne les chiffres de la maquette. Base `1a75533`.
> **APP 8.02 → 8.03, SW 8.77 → 8.78** (visible).

> ★ Consolidation : **3 octobre 2026 (FUSION-1)** — ★★★ **LA SÉRIE §213-§221 RECOLLÉE SOUS COH-1 (§222) — DEUX FILS, UNE MÊME BASE** (§223).
> Le commit `75107ff` avait collé les fichiers COMPLETS de COH-1 (bâti sur `61f4ccd`) par-dessus les neuf lots « densifier le
> Pilotage », bâtis eux aussi sur `61f4ccd` dans une autre conversation : leur code avait disparu d'app.js, pilotage.js, utils.js,
> styles.css et de la doc ; il ne restait que planning.js, reglages.js et leurs harnais (preflight rouge : `_planPrevuPersRange`
> sans appelant). Réparé par une vraie fusion git à trois voies depuis `61f4ccd` (zip TRAIT-CUVE ↔ lot COH-1, 10 fichiers en
> conflit). COH-1 renuméroté §222. ★ `.mv-base` ne voit pas deux lots frères : ils déclarent la même base.
> Base `75107ff`. **APP 8.01 → 8.02, SW 8.76 → 8.77** (visible : COH-1 arrive avec la série).

> ★ Consolidation : **3 octobre 2026 (TRAIT-CUVE)** — ★ **LE TRAITEMENT CONSEILLÉ, CHIFFRÉ DANS LA CUVE ; LE QUOI DE NEUF SPÉCIAL « MA VIGNE PRÉVOIT »** (§221).
> Trois cartes se croisent (protection restante, fenêtre, tracteur) : une ligne « et si » en pointillé, à la CADENCE MESURÉE des
> traitements (4/6/8 rangs : le barème ne le sait pas), **éteinte** (`CONFIG.features.trait_cuve`) jusqu'à l'été, hors du Quoi de neuf.
> Quoi de neuf spécial dicté et relu par Nico en tête de 8.01, intro de section dans le guide Pilotage. **Fin de la série « densifier »** :
> neuf lots (§213-221) dans un seul zip tant que rien n'est poussé — à déployer et à regarder en vrai avant tout lot suivant.
> Harnais `mv-harnais-gnr-mesure` (49 + 11/11). Base `61f4ccd`. **APP 8.00 → 8.01, SW 8.75 → 8.76.**
> ⚠️ Publié en parallèle de COH-1 sur la même base `61f4ccd` ; écrasé par `75107ff`, recollé par FUSION-1 (§223).

> ★ Consolidation : **3 octobre 2026 (COH-1)** — ★★ **UN MÊME CHIFFRE, UN MÊME NOM, UNE MÊME SURFACE SUR TOUS LES ÉCRANS** (§222).
> Premier des trois lots de la demande « une appli homogène » (captures de Nico, §28). L'arrachage découpé compte au Pilotage comme
> sur la liste (`_mvTFaite`, règle commune ; surface faite / concernée quand la tâche n'a pas de barème) ; cartes Leaflet du
> Pilotage confinées sous la barre du bas ; `tNom` = le nom entier et accentué, `tAbr` = la forme courte (seule la carte
> « Avancement par tâche » de l'Accueil) ; surface d'une parcelle à 4 décimales, totaux à 2. Harnais `mv-harnais-coh1`
> (19 assertions, contre-épreuve 12/12). Base `61f4ccd`. **APP 7.92 → 7.93, SW 8.67 → 8.68** (visible).
> ⚠️ Porté par `75107ff`, qui écrasait la série §213-§221 ; COH-1 renuméroté §222 et recollé en APP 8.02 / SW 8.77 (§223).

> ★ Consolidation : **3 octobre 2026 (PLUIE-1)** — ★ **LA PLUIE TOMBÉE DEPUIS LE TRAITEMENT LESSIVE LES CONTACTS** (§220).
> Appel Open-Meteo à part (`_pluieCharger`, 15 jours, cache local 1 h, rien en base) : le jour même ne vaut que ses heures passées,
> un jour manquant est inconnu. Un contact est à nu dès `prot_lessivage_mm` (20) de pluie cumulée après le traitement ; pénétrants et
> systémiques ne se lessivent pas. Huit lots dans un seul zip tant que rien n'est poussé. Harnais `mv-harnais-protection` (32 + 12/12).
> Base `61f4ccd`. **APP 7.99 → 8.00, SW 8.74 → 8.75.**

> ★ Consolidation : **3 octobre 2026 (PHOTO-1)** — ★ **LA PHOTO QUOTIDIENNE DES CHIFFRES DU COCKPIT, ET LES DEUX COURBES QU'ELLE PERMET** (§219).
> `CONFIG.photo` : une ligne {d, reste, cons, avc} par jour, écrite par l'admin au rendu d'Aujourd'hui, période active seulement,
> 60 lignes, jamais réécrite. Charge restante : écart à la première photo de la fenêtre ; Budget : consommé − fait en points ; le
> point du jour en direct, un jour sans ouverture est un trou. Sept lots dans un seul zip tant que rien n'est poussé. Harnais
> `mv-harnais-photo` (15 + 7/7). Base `61f4ccd`. **APP 7.98 → 7.99, SW 8.73 → 8.74.**

> ★ Consolidation : **3 octobre 2026 (PROT-1 + INACTION-1)** — ★★ **LA PROTECTION RESTANTE PAR PARCELLE, LE COÛT DE L'INACTION SUR LE COCKPIT** (§218).
> Rémanences par mode d'action (réglages, défauts sourcés 10 / 12 / 14 j), mode déduit de la substance E-Phy, « ? » quand deviné ;
> pas de lessivage faute de pluie enregistrée (PLUIE-1 au §28). Coût de l'inaction = le « sans renfort » de Décider, sous la marge.
> Fin de la série « densifier » (§213-218), six lots dans un seul zip tant que rien n'est poussé. Harnais `mv-harnais-protection`
> (21 + 8/8). Base `61f4ccd`. **APP 7.97 → 7.98, SW 8.72 → 8.73.**

> ★ Consolidation : **3 octobre 2026 (CARTE-1)** — ★ **LA CARTE DU DOMAINE SE LIT DE CINQ FAÇONS, CHACUNE À SA SOURCE** (§217).
> Avancement (`getPCls`), dernier traitement (registre), cépage (fiche), passages phyto (`_cfmPassages` + `_cfmIftRef`, la règle de
> la Conformité), coût engagé/ha (`_pecData`). Un vide est gris, un zéro a sa couleur. Construit sur GNR-M, SPARK-1, TENS-1 et
> TOUR-RDT, livrés dans le même zip tant qu'ils ne sont pas poussés. Harnais `mv-harnais-carte-vues` (23 + 7/7). Base `61f4ccd`.
> **APP 7.96 → 7.97, SW 8.71 → 8.72.**

> ★ Consolidation : **3 octobre 2026 (TOUR-RDT)** — ★ **LE RENDEMENT DE LA TOURNÉE, SUR LA MÊME SIMULATION** (§216).
> Sous le résultat de Décider : temps de l'équipe sur les parcelles face aux trajets, coût de l'équipe (taux de chacun, part du jour
> occupée), revient/ha, et la même tournée « au plus proche » pour comparer — tout lu sur `_dzSimuler`, aucun second calcul.
> Construit sur GNR-M, SPARK-1 et TENS-1, livrés dans le même zip tant qu'ils ne sont pas poussés. Harnais `mv-harnais-tournee-rdt`
> (20 + 7/7). Base `61f4ccd`. **APP 7.95 → 7.96, SW 8.70 → 8.71.**

> ★ Consolidation : **3 octobre 2026 (TENS-1)** — ★★ **LA TENSION DE L'ÉQUIPE, FACE AU PLANNING PRÉVU, JAMAIS AU CONTRAT** (§215).
> Travail effectif 14 j (`_planWorkPersRange`) face au prévu du modèle (`_planPrevuPersRange`, nouveau mode `'prevu'` de
> `_planRangeH_` : la grille sans la saisie). Semaine la plus chargée face au cadre légal du Planning (`_planLegal`, exposé) :
> au-delà de 44 h à surveiller, de 48 h rouge — le « plafond de deux semaines » de la maquette n'existe pas en droit. Un chiffre
> du bandeau avec sa petite courbe, une carte par personne. Construit sur GNR-M et SPARK-1, livrés dans le même zip tant qu'ils
> ne sont pas poussés. Harnais `mv-harnais-tension` (27 + 8/8). Base `61f4ccd`. **APP 7.94 → 7.95, SW 8.69 → 8.70.**

> ★ Consolidation : **3 octobre 2026 (SPARK-1)** — ★ **LA CADENCE A SA PETITE COURBE, ET LE MOTEUR DE GRAPHE SAIT LES FAIRE** (§214).
> `_mvGraphSpark` (utils.js) : écarts en %, bande commune ±30 %, trou = courbe coupée, jamais une ligne inventée. Seule la Cadence
> a un historique daté (`_planTeamCadence`) : Charge restante et Budget n'en ont pas — question du relevé quotidien posée (§28).
> Construit sur GNR-M (§213), livré dans le même zip tant que GNR-M n'est pas poussé. Harnais `mv-harnais-spark` (19 + 7/7).
> Base `61f4ccd`. **APP 7.93 → 7.94, SW 8.68 → 8.69.**

> ★ Consolidation : **3 octobre 2026 (GNR-M)** — ★★ **LE TRACTEUR SE PROJETTE SUR LES TRAVAUX EN COURS, LA CONSO DE CHAQUE TRACTEUR EST MESURÉE** (§213).
> Règle de Nico : un travail tracteur lancé couvre tout le domaine — c'est déjà la barre d'avancement de la session ; l'amendement
> suit les parcelles de l'apport ; un travail fini sort (on lit le statut). Aujourd'hui › Alertes matériel : travaux en cours (ha,
> heures, litres), révision placée dans ces travaux, cuve après eux. L'équipe & le matériel : conso mesurée (pleins ÷ heures notées).
> ★ Il n'existe aucune heure tracteur au planning. Harnais `mv-harnais-gnr-mesure` (45 assertions, 9/9 contre-épreuves). Base
> `61f4ccd`. **APP 7.92 → 7.93, SW 8.67 → 8.68.**

> ★ Consolidation : **3 octobre 2026 (AVALE-2)** — ★★ **UNE ERREUR AVALÉE QUI SE RÉPÈTE REMONTE AU JOURNAL DU DOMAINE** (§212).
> Issu de l'audit qualité du 02/10 (P3, vérifié avant d'agir). `_mvAvale` écrit aux paliers 1 / 10 / 100 / 1000 : `info` la 1re
> fois (local, inchangé), `warning` dès la 10e (part vers l'Admin GT). Toujours `silencieux:true`, honoré par `logError` : aucun
> toast « erreur avalée dans … » chez le client. Harnais `mv-harnais-avale` étendu (exécute le vrai `logError`). Base `6028b23`.
> **SW 8.66 → 8.67, APP inchangée (7.92)** — invisible du client.

> ★ Consolidation : **2 octobre 2026 (ARRACH-7)** — ★ **L'ARRACHAGE FINI POUR L'ÉQUIPE, LA SUITE AU PRESTATAIRE** (§211).
> Capture de Nico : arrachage à 0 % alors que le démontage (travail de l'équipe) est fait partout et le reste au prestataire.
> Deux lectures : `_arrFraction` (part des étapes faites) → `recalcTravaux` et `getPCls` ; `_arrEquipeFinie` (étapes non
> prestataire faites) → `_mvPartTache` saute l'arrachage, `_mvPartCalc` le lit côté équipe. Base `03a41d2`.
> **Bump APP 7.91 → 7.92, SW 8.65 → 8.66** (visible).

> ★ Consolidation : **2 octobre 2026 (ARRACH-6)** — ★ **L'ARRACHAGE EN UN GESTE** (§210). Nico avait déclaré ses parcelles
> « Arrachées » avant d'en valider le travail ; pour le valider il les remettait en exploitation → les autres travaux revenaient,
> « 50 % », « c'est pas net ». ① La feuille « Arracher » valide aussi le travail (case cochée d'office, `_arrValideAuPassage`) ;
> ② `confirmValidation` d'un arrachage sur une vigne en place propose « Arrachée » (`_arrProposer`, qui pose `_dpCurrentNom`).
> Base `01c6a2e`. **Bump APP 7.90 → 7.91, SW 8.64 → 8.65** (visible).

> ★ Consolidation : **2 octobre 2026 (AVC-ARR)** — ★ **UNE PARCELLE ARRACHÉE NE PORTE PLUS QUE L'ARRACHAGE** (§209).
> Captures de Nico : trois arrachées à « 50 % · 1/2 tâches » quand l'arrachage y était à 0 %. `getPCls` comptait les autres travaux de
> la période sur une arrachée, et la fiche laissait les valider. Règle `_mvArrHors` (app.js) lue par `getPCls`, la fiche (`openDP`)
> et six gestes (`_mvArrRefus`). Posé sur ARRACH-4/5 (`7c29450`). **Bump APP 7.89 → 7.90, SW 8.63 → 8.64** (visible).

> ★ Consolidation : **2 octobre 2026 (ARRACH-5)** — ★★ **L'ARRACHAGE DANS LE PRIX DE LA BOUTEILLE, LA FACTURE UNIQUE** (§208).
> Nico : la facture prestataire « ne puisse pas se noter ailleurs » ; l'arrachage et les travaux de l'année « doivent peser sur le
> prix de la bouteille » ; le bouton Prestataire ne s'allumait pas. ① `_pecRevCouts` : poste `pre` (prestations + tracteur/phyto
> des vignes arrachées, à la surface sur les vignes en place) ; ② `_mvFactureOu` (utils.js) : garde croisée étape ↔ La Réserve sur
> fournisseur + n° de facture, intrant « prestation » refusé ; ③ `.pchk.sel` sans teinte → `sel vert`. Posé sur ARRACH-4 (non
> poussé, base `517eb00`). **Bump APP 7.88 → 7.89, SW 8.62 → 8.63** (visible).

> ★ Consolidation : **2 octobre 2026 (ARRACH-4)** — ★★ **LE BACKLOG DE L'ARRACHAGE SOLDÉ** (§207). Demande de Nico :
> « occupe-toi de ce qui est au backlog ». ① `_ecoPrestaByParc` (journal rejoué : « Annulé » efface, revalidation remplace) →
> poste **Prestations** de la campagne (`_pecData`) et de l'exercice (`_pexData`, atelier vigne, barre mensuelle `pre`), colonne
> **Presta.** du tableau ; ② une parcelle **arrachée qui a coûté** a sa ligne au tableau des parcelles, sans barème ni surface au
> total ; ③ « + Journal » choisit l'étape (`je-etape`, `_arrPose`). Posé sur SEL-1 + ARRACH-3 (poussés : `517eb00`).
> **Bump APP 7.87 → 7.88, SW 8.61 → 8.62** (visible).

> ★ Consolidation : **2 octobre 2026 (ARRACH-3)** — ★★ **L'ARRACHAGE EN ÉTAPES, COMPOSÉ PAR L'ADMIN** (§206).
> Nico : *« l'admin choisit ce qu'il veut mettre dans arrachage »*, une option prestataire par étape, et le moment où la parcelle
> passe « Arrachée ». `CONFIG.arrachage = {etapes:[{id,lbl,presta}], apres}` (feuille `ovArrCfg`) ; sans étape, rien ne change.
> Une entrée de journal par étape (`etape`, `etapeLbl`) ; `_ecoTvEvents` écarte `presta` et clé le couple par étape ; heures par
> étape sous la ligne Arrachage du temps réel (`V.etapes`). Posé sur **SEL-1** (§205, non poussé : le zip contient les deux lots),
> base `cad12b0`. **Bump APP 7.86 → 7.87, SW 8.60 → 8.61** (visible).

> ★ Consolidation : **2 octobre 2026 (SEL-1)** — ★★ **ARRACHAGE, DÉSHERBAGE MANUEL, EFFEUILLAGE : LES PARCELLES SE
> CHOISISSENT PAR CAMPAGNE** (§205). Nico : *« ce n'est pas toutes les parcelles qui sont concernées »*, puis *« l'année prochaine
> ce sera d'autres parcelles »*. Règle unique dans `utils.js` (`_mvTacheConcerne`) : concernée = cochée pour la campagne
> (`p.selCamp[tâche]` = **numéro** de campagne) **ou** saisie au journal pendant la campagne ; `p.tachesExclues` ignoré pour ces
> trois tâches. Feuille `ovSelParc` (admin) depuis la roue crantée › Tâches. Une parcelle arrachée reste saisissable au journal pour
> l'arrachage seul. ⚠️ Écrit d'abord sur `3050f8e`, **rejoué sur FERTI-3** (`cad12b0`, poussé entre-temps) — §205 et non §202.
> **Bump APP 7.85 → 7.86, SW 8.59 → 8.60** (visible).

> ★ Consolidation : **2 octobre 2026 (FERTI-3)** — ★★ **LA SESSION « AMENDEMENT » COCHE LA TÂCHE, SANS DOUBLE COMPTE** (§204).
> Validé par Nico. `saveData('sessions')` → `_ferSyncSessions` (phyto.js) : parcelle faite dans une session « Amendement » →
> tâche « Amendement » validée + UNE entrée de journal `auTracteur:true`, `quiHors` (idempotent par session × parcelle ;
> une annulation n'est pas refaite). Pilotage : `_ecoTvEvents`, le partage par personne et le repli barème écartent
> `auTracteur`. ⚠️ Reste : calendrier vigne (§28). Posé sur **FERTI-1 + FERTI-2** (§202-203, non poussés : le zip les
> contient), sur `3050f8e`. **Bump APP 7.84 → 7.85, SW 8.58 → 8.59** (visible).

> ★ Consolidation : **2 octobre 2026 (FERTI-2)** — ★ **LE COÛT D'UN AMENDEMENT AU PRÉVU, L'ANNÉE DE PLANTATION** (§203).
> Pilotage › Économie › Exercice : un amendement chiffré (`INTRANTS.fertil[].cout`) entre au **prévu** des achats à sa semaine
> prévue et en SORT dès qu'un achat chiffré du même produit, daté après lui, est saisi — jamais compté deux fois (`achP`,
> `totalP=salP+achP`). Fiche fertilisation : `p.plantee` (année de plantation) → cahier et CSV. ⚠️ Toujours ouverts : session →
> tâche (question à Nico, risque de double compte des heures) et calendrier vigne (§28). Posé sur **FERTI-1** (§202, non poussé
> au moment de l'écriture : le zip le contient), lui-même sur `3050f8e`. **Bump APP 7.83 → 7.84, SW 8.57 → 8.58** (visible).

> ★ Consolidation : **2 octobre 2026 (FERTI-1)** — ★★ **L'AMENDEMENT ET LE CAHIER DE FERTILISATION** (§202).
> Dicté par Nico : choisir un amendement, cocher des parcelles, et que sacs, temps tracteur, travail prévu, Pilotage et
> registre se remplissent seuls. Phyto › onglet **Fertilisation** (`phyto.js`, bloc FERTI-1) : assistant en 5 étapes
> conseillées, barème h/ha = (10 000 / écartement) / vitesse / temps utile ; écrit `INTRANTS.fertil` (★ clé ajoutée à
> `_rsvApply`, au garde anti-perte et à LISTES-1), le produit de La Réserve, la tâche « Amendement » (exclusions des
> parcelles non cochées) et l'activité tracteur. Dates d'épandage **LUES**, jamais écrites. Cahier PDF + CSV. ⚠️ Reste
> ouvert : **FERTI-2** (§28). Posé sur **RDT-XLS** (§201, `3050f8e`, APP 7.82 · SW 8.56). **Bump APP 7.82 → 7.83, SW 8.56 → 8.57** (visible).

> ★ Consolidation : **2 octobre 2026 (RDT-XLS)** — ★★ **QUATRE RETOURS DE NICO SUR LES DOCUMENTS DE FIN DE VENDANGE** (§201).
> ① Fichier Excel des parcelles : rendement 0 et fourchette 0 – 0 — le millésime arrivait en chaîne, `_vendVolParc` /
> `_vendSurfParc` le comparaient strictement au NOMBRE de `_vendMillOfDate` ; ② récoltes de la vendange en hL/ha
> (`_mlRendements`, « ~ » = estimé), état sanitaire non noté = « — » ; ③ planning de l'année en cours = équipe sous contrat
> d'aujourd'hui au 31/12, fiches Inactives exclues ; ④ aperçu des documents à la largeur de la feuille (`_mvDocOpen`) et
> réglages du Cuvier stylés sans passer par Le Cuvier. Posé sur **PARC-XLS-2** (§200, `ff00c76`, APP 7.81 · SW 8.55).
> **Bump APP 7.81 → 7.82, SW 8.55 → 8.56** (visible).

> ★ Consolidation : **30 septembre 2026 (PARC-XLS-2)** — ★ **LE FICHIER EXCEL DES PARCELLES AUSSI DANS LA CAVE** (§200).
> Demande de Nico : « mettre ça aussi en cave avec les récoltes ». `_caveRegDocs` range l'entrée `csvParcelles` du catalogue
> juste après « Récoltes de la vendange » — même entrée, même `docsGo(i)`, aucune copie. Guide Cave corrigé au passage (il
> annonçait quatre documents). Posé sur **PAR-1 + ÉQUIPES-1** (§198-199, `aa2baea`, APP 7.80 · SW 8.54).
> **Bump APP 7.80 → 7.81, SW 8.54 → 8.55** (visible).

> ★ Consolidation : **30 septembre 2026 (PAR-1 + ÉQUIPES-1)** — ★★★ **LE TEMPS VIGNE SE PARTAGE PAR JOURNÉE, ET L'ADMIN
> POSE LES ÉQUIPES DU JOUR.** PAR-1 (§198) : un salarié non coché rejoint les parcelles validées ce jour-là, au prorata du barème
> (fin des séries −90 % / +297 % du tableau Parcelles). ÉQUIPES-1 (§199) : « Équipes du jour » sur l'Accueil (admin,
> `CONFIG.equipes_jour`), groupe forcé à la saisie (`_mvEqApplique`, 7 écritures), et un jour d'équipes chaque équipe garde ses
> parcelles. Posé sur **PARC-XLS** (§197, `8905702`, APP 7.79 · SW 8.53). **Bump APP 7.79 → 7.80, SW 8.53 → 8.54.**

> ★ Consolidation : **30 septembre 2026 (PARC-XLS)** — ★★ **LE FICHIER EXCEL DES PARCELLES SE TRIE ET PORTE LE
> RENDEMENT** (§197). Demande de Nico : trier par nom, et par rendement en hL/ha dans les deux sens. `exportCSVParcelles`
> ouvre la feuille de tri commune (`_mvTriOuvrir`) : millésime, puis nom A→Z / Z→A ou rendement fort→faible / faible→fort ;
> colonnes kilos, hL/ha, mesuré/estimé, fourchette — **source unique `_mlRendements`**, aucun calcul neuf. Posé sur ROB-2
> Accueil/Journal (`2ea6440`, SW 8.52). **Bump APP 7.78 → 7.79, SW 8.52 → 8.53** (visible).

> ★ Consolidation : **29 septembre 2026 (ROB-2 Accueil/Journal — ROB-2 TERMINÉ)** — ★★ **LE TIRAGE AU HASARD COUVRE
> DÉSORMAIS TOUS LES MODULES** : Planning, Pilotage, Cave/Cuvier, Tracteur, Réserve, Accueil/Vigne/Journal. Le dernier a trouvé un
> vrai défaut de production : **« NaN h » restantes dans la fiche d'une parcelle** dès que la période portait l'Entreplantation
> (`openDP`), et en relisant l'entrée 26 du backlog, **« NaN h » au total de l'Accueil** dès qu'une tâche « en temps réel » est
> activée (`calcHeures`). Les deux corrigés ; entrées 26, 0h et REV-1 ④ rayées. Posé sur **ARRACH-1** (§196, `c3cccda`, APP 7.78 · SW 8.51 : arracher une parcelle depuis
> sa fiche). **Bump SW 8.51 → 8.52, APP 7.78 inchangé** (invisible).

> ★ Consolidation : **28 septembre 2026 (ROB-2 Réserve)** — ★★ **LE TIRAGE AU HASARD PASSE SUR LA RÉSERVE**
> (`mv-harnais-robustesse-reserve` : onglets, saisies, fiche de chaque lot, parc emprunté par la Cave, 4 documents imprimables).
> Trouvé : un fût nul faisait tomber trois écrans → **LISTES-1 étendu au document INTRANTS** (`_MV_SOUS_LISTES.intrants`).
> ROB-2 reste : **Accueil/Journal** (`app.js`). Cumul non déployé depuis `d42e975` : SCHEMA-1, CTX-1, DMA-1, n°16, ROB-2 Pilotage +
> Cave + Tracteur + Réserve, LISTES-1. **Bump SW 8.49 → 8.50, APP 7.77 inchangé** (invisible).
>
> ★ Consolidation : **28 septembre 2026 (ROB-2 Tracteur)** — ★★ **LE TIRAGE AU HASARD PASSE SUR LE TRACTEUR**
> (`mv-harnais-robustesse-tracteur`, chaque vue pour chaque tracteur, chaque session). Corrigé dans `tracteur.js` : quatre
> « undefined » affichés et un `data-defid="undefined"` que produit toute activité sans tracteur par défaut. `REPARATEUR_HIST`
> est un objet par tracteur : retiré de la liste LISTES-1. Le chargeur partagé gagne `insertAdjacentHTML`.
> Cumul non déployé depuis `d42e975` : SCHEMA-1, CTX-1, DMA-1, n°16, ROB-2 Pilotage + Cave + Tracteur, LISTES-1 (+ sous-listes).
> **Bump SW 8.48 → 8.49, APP 7.77 inchangé** (invisible).
>
> ★ Consolidation : **28 septembre 2026 (ROB-2 Cave/Cuvier)** — ★★ **LE TIRAGE AU HASARD PASSE SUR LA CAVE ET LE
> CUVIER** (`mv-harnais-robustesse-cave`, 11 vues + la fiche de chaque cuvée), sur un chargeur de l'application entière désormais
> partagé (`scripts/mv-app-node.mjs`). Trouvé : une cuvée nulle faisait tomber le Chai → **LISTES-1 étendu** aux listes rangées
> dans `cave_elevage` / `cave_vendange` (`_MV_SOUS_LISTES`) ; trois affichages « undefined / NaN » de `cave.js` corrigés.
> Cumul non déployé depuis `d42e975` : SCHEMA-1, CTX-1, DMA-1, n°16, ROB-2 Pilotage, LISTES-1 (voir `docs/claude/journal.md`).
> **Bump SW 8.47 → 8.48, APP 7.77 inchangé** (invisible).
>
> ★ Consolidation : **28 septembre 2026 (LISTES-1)** — ★★ **UNE LISTE NE PORTE QUE DES FICHES**. `applyFbData` et le
> repli hors ligne (`loadData`) écartent des 14 listes d'objets tout élément nul / texte / nombre / tableau (`_mvListeObjets`,
> trace `LISTES-1` sans contenu) : une parcelle ou un tracteur nul faisait tomber des pages entières. Trouvé par le nouveau
> tirage au hasard du Pilotage (ROB-2, `mv-harnais-robustesse-pilotage`, qui charge **l'application entière** dans Node).
> Même série, sans bump : **SCHEMA-1** (une journée du Planning contrôlée à l'écriture, `_pEntPose`), **CTX-1** (l'année de
> calcul ne fuit plus, `_planSurAnnee`), **DMA-1** (horaires des jours D/M/A propres au modèle, ligne CSV `horaires_dma`),
> n°16 du backlog rayé (déjà corrigé). Tout est dans `docs/claude/modules.md` §19. **Bump SW 8.46 → 8.47, APP 7.77 inchangé**
> (invisible), base `d42e975`.
>
> ★ Consolidation : **28 septembre 2026 (RET-G)** — ★★ **UN SEUL RETOUR CLIENT POUR PLUSIEURS LIVRAISONS (§195)**. Ventes
> en vrac : l'acheteur envoie un total de jus + lie pour des livraisons de jours différents ; on coche celles qu'il couvre, le total
> se répartit au prorata des kilos sur toutes leurs lignes, `retour.grp` les lie (rouvrir/effacer = tout le groupe). En route, deux
> défauts d'avant : le retour d'une récolte d'avant VD-1 était **perdu** à l'enregistrement, et effacer un retour ne recalculait
> pas le rendement de la parcelle. **Bump APP 7.76 → 7.77, SW 8.45 → 8.46**, base `3abe175`. Détail en **§195**.
>
> ★ Consolidation : **28 septembre 2026 (REV-1)** — ★★★ **ÉCONOMIE › REVIENT : RENDEMENT, BOUTEILLES ET COÛT VIGNE
> DU MILLÉSIME, SUR LE CYCLE D'UNE VENDANGE À LA SUIVANTE (§194)**. Nouvelle sous-vue `rev` (`_pecViewRevient`, moteur pur
> `_pecRevCalc`). L'ancienne carte « Prix de revient » divisait le coût de la PÉRIODE par toute la récolte et convertissait à
> 1,3 kg/col (~28 % de bouteilles de moins que la Cave) : elle n'est plus qu'une porte. Escalier du rendement : récolté → moyenne
> de ses millésimes → moyenne de l'appellation → rien, JAMAIS le plafond. ⚠️ **J'avais affirmé qu'un moteur « euros de l'année
> vigne » existait : faux** (le panneau des deux cadres ne compte que des heures) — on rejoue l'engagé daté sur le cycle.
> **Bump APP 7.75 → 7.76, SW 8.44 → 8.45**, base `d42cdbe`. Détail en **§194**.
>
> ★ Consolidation : **27 septembre 2026 (DIM-2 + DIM-3)** — ★★★ **UN DIMANCHE COMPTE EN ENTIER, « POUR LA COMPTA » EN
> CASES 25 / 50 / 100 %, L'ANNÉE EN TROIS FAMILLES, ET UN RÉGLAGE « DIMANCHES ET FÉRIÉS : TOUJOURS DES HEURES SUP » (§193)**.
> Mode payé : la majoration voyage avec l'heure (DIMAV-1 défait). Réglage `CONFIG.dimfer_hs` (défaut inchangé) : en « toujours »,
> même un dimanche prévu au modèle est une heure sup, avant septembre aussi, et le paiement d'un mois d'alors se relit comme un
> total. Mois figé = ce qui est parti (`fige.bank`). ⚠️ Trois hypothèses de paie fausses en route (§193d bis) : **demander, ne pas
> supposer**. **Bump APP 7.74 → 7.75, SW 8.43 → 8.44**, base `3446620`, zip avec MEP-1. Détail en **§193**.

> ★ Consolidation : **27 septembre 2026 (MEP-1)** — ★★ **LE RELEVÉ REPASSE À DEUX PAGES, CHAQUE CHOSE ÉCRITE UNE FOIS
> (§192)**. Page 2 en flux à deux colonnes qui s'équilibre, `.cl` borné au cadre (il défaisait Contrats et Congés), signatures
> d'un seul tenant, Total de la page 1 protégé ; doublons retirés (« dont … dim./férié », dimanche du mois, règle d'avant
> septembre ×3). ★★★ **Un vrai Chromium tourne dans le bac à sable** (`@sparticuz/chromium` + `puppeteer-core`, §192b) : les
> documents imprimables se REGARDENT désormais. **Bump APP 7.73 → 7.74, SW 8.42 → 8.43**, base `3446620`. Détail en **§192**.
>
> ★ Consolidation : **27 septembre 2026 (RELEVE-3)** — ★★★ **LE RELEVÉ D'UN MOIS FIGÉ PLANTAIT (§191)**. Remonté du
> terrain : « Relevé » levait `Cannot read properties of undefined (reading 'length')` sur un mois figé, en mode payé, avec un
> dimanche travaillé hors heures sup — l'instantané de « Figer » garde la majoration **sans ses jours**, et `_pfNatLib` lisait
> `l.jours.length`. Corrigé sans toucher au format en base (`_pfMajJours` relit les jours dans le calcul du mois). ★★ Harnais
> neuf **`mv-harnais-robustesse-planning`** : des mois **tirés au hasard**, saisies abîmées et instantanés d'avant, toutes les
> surfaces du Planning — aucune exception, aucun « undefined »/« NaN » affiché. **Bump APP 7.72 → 7.73, SW 8.41 → 8.42**,
> base `4da4367`. Consigne neuve au §24 (n°20). Détail en **§191**.
>
> ★ Consolidation : **27 septembre 2026 (LISTE-1)** — ★★ **UNE SEULE LISTE DE CONTRÔLES, JOUÉE UNE SEULE FOIS (§190)**.
> `check` et `prebuild` étaient deux copies à la main de la même chaîne de 142 commandes, et la CI en rejouait 70 à la main avant
> que `npm run build` ne relance tout : chaque contrôle de la CI tournait deux fois. Désormais **`scripts/mv-harnais-liste.mjs`**
> (la liste, dans l'ordre exact de l'ancienne chaîne) est jouée par **`scripts/mv-lanceur.mjs`** : `check` = le lanceur,
> `prebuild` = `npm run check`, CI = le lanceur `--continuer` puis `npm run build --ignore-scripts`. **Ajouter un contrôle = une
> ligne dans la liste.** `mv-harnais-portes` garde ce câblage (13 assertions, 12 contre-épreuves). **Aucun bump**, base `a4d7efe`.
> Détail en **§190**.
>
> ★ Consolidation : **27 septembre 2026 (RULES-1 + DOC-1)** — ★★★ **LES RÈGLES FIRESTORE EXÉCUTÉES PAR LE VRAI MOTEUR,
> ET CE DOCUMENT SCINDÉ (§189)**. Aucun script n'exécutait `firestore.rules` : tous le lisaient comme du texte. Harnais neuf
> `mv-harnais-rules` (53 requêtes sur l'émulateur, 12 contre-épreuves, 2 constats), job CI `rules` à part (Java 21 + émulateur).
> ★★ **Joué chez Nico le 27/09 : 53/53 verts, 12/12 contre-épreuves rougissent** (le `.jar` de l'émulateur est bloqué dans le
> bac à sable de Claude : c'est sa machine, puis le job CI `rules`, qui prouvent). Et ce fichier passe de 23 910 à ~2 600 lignes : le cœur ici, le reste dans
> `docs/claude/` (mode d'emploi juste au-dessus). **Aucun bump** (scripts, CI, doc), base `9801910`. Détail en **§189**.
> ⚠️⚠️ **Le push de ce lot avait EFFACÉ §188 (RÉAL-1)**, poussé une heure plus tôt : le zip portait un `CLAUDE.md` et un
> `harnais-claude-md.mjs` complets construits AVANT lui. Code de RÉAL-1 intact ; sa section et sa consolidation sont restaurées
> à l'identique, ce lot devient §189, et une garde neuve relit les titres des 12 derniers commits (§189d).
>
> ★ Consolidation : **27 septembre 2026 (RÉAL-1)** — ★★ **LE « RÉALISÉ » DES TABLEAUX EST CE QUI A ÉTÉ PAYÉ (§188)**.
> Capture de Nico : dégrafage à 100 %, Réalisé 6 494 € = Budget 6 494 €, et juste dessous 374 h réelles. Le « Réalisé » de Coût par
> travail et du tableau des parcelles était le barème du fait — égal au budget par construction. Il vient maintenant des euros que
> `_ecoTempsVigne` verse avec les heures (taux du jour), colonne **Écart** = réalisé − barème du fait. Et le barème d'une parcelle
> **revalidée** (tâche simple) ne se compte plus deux fois (+2 % affiché au lieu de ~+14 %). **APP 7.71 → 7.72 · SW 8.40 → 8.41**,
> base `9801910`. Détail en **§188**.
>
>
> ⚠️ Cette consolidation (RÉAL-1, §188) a été ÉCRASÉE le 27/09 par le push de la scission (§189), construite sur la
> base d'avant elle, puis restaurée ici — voir §189d.
>
> ★ Consolidation (l'avant-dernière avant la scission du document, §189) : **27 septembre 2026 (VER-2)** — l'**e2e de la CI tombait depuis VER-1** (runs #103 à #106) : `/version.json` en
> dev = `index.html` en 200 (repli SPA de Vite) → `r.json()` lève → `_mvAvale` → `console.error` → e2e rouge. Contrôle du content-type.
> Rejoué ici dans un vrai Chromium (`@sparticuz/chromium`, §187). **APP 7.70 → 7.71 · SW 8.39 → 8.40**, base `8268927`. Détail en **§187**.
>
> ★ Précédente : **27 septembre 2026 (DROITS-2 + ACCES-1)** — ★★ **LECTURE SEULE = AUCUN RÔLE D'ÉCRITURE, ET UNE FICHE
> INACTIVE PERD L'ACCÈS (§186)**. `deriveRo`
> ne posait `ro` qu'avec saisonnier ou pilotage : un membre sans rôle écrivait côté serveur. Fermé, sur décision de Nico ; les trois
> copies (claims.js, utils.js, cuvier.js) bougent ensemble. ACCES-1 : claim `off` (fiche Inactive) refusé par `isMyTenant`, sessions
> coupées (`revokeRefreshTokens`). ⚠️ **Fonctions + règles à déployer PUIS `gtBackfillClaims` à relancer.**
> **APP 7.69 → 7.70 · SW 8.38 → 8.39**, base `a7f9a5c`. Détail en **§186**.
>
> ★ Précédente : **27 septembre 2026 (DROITS-1)** — ★★ **LA LECTURE SEULE (§185)**. Le serveur pose `ro` (deriveRo),
> l'appli l'ignorait : elle tentait d'écrire, prenait le refus, coffre + « Enregistrement refusé » en rouge. `_mvLectureSeule` (copie
> de deriveRo, égalité tenue sur 32 combinaisons) : `fbSave` ne tente plus, un message une fois. Et `error_log` refusait les rôles
> `ro` → règle 5. ⚠️ **Règles à déployer.** **APP 7.68 → 7.69 · SW 8.37 → 8.38**, base `aaee21c`. Détail en **§185**.
>
> ★ Précédente : **27 septembre 2026 (VER-1)** — ★★★ **LES VERSIONS PÉRIMÉES (§184)**. Une PWA jamais fermée gardait
> l'ancien code des jours et écrivait avec (MAJ-1 n'impose rien pendant l'utilisation). Plancher AUTOMATIQUE : `MV_FORMAT` (utils.js)
> publié au build dans `/version.json` ; format installé plus bas → écritures en file, écran « Mise à jour obligatoire ». Retour après
> ≥ 4 h sans rien en cours → activation douce (`MV_ACTIVER`). Parc d'appareils (`appareils`, Admin GT). ⚠️ **Règles Firestore à
> déployer.** **APP 7.67 → 7.68 · SW 8.36 → 8.37**, base `d41cde1`. Détail en **§184**.
>
> ★ Précédente : **27 septembre 2026 (TOUR-6)** — `npm run tour:dates` chez Nico : **0 bug** sur 803 écrans aux 9 instants
> pièges (jour, campagne, exercice justes ; aucun « Invalid Date »). Deux chevauchements réels corrigés : frise du cockpit (étiquettes
> sur étages) et échelle des mois des Archives sur téléphone. **APP 7.66 → 7.67 · SW 8.35 → 8.36**, base `36c6263`. Détail en **§183**.
>
> ★ Précédente : **26 septembre 2026 (CMP-NOM, rejoué)** — ★★ **LE REPLI PAR NOM RENDAIT L'HIVER CLOS À 32 % (§182)**.
> Verdict d'Économie « +190,9 % de temps en plus — 2 289 h contre 787 h, mesuré sur Hiver 2025–2026 », alors que l'écart réel est
> de 2 % sur une tâche : le dénominateur amputé de §43, rendu par le **repli par nom** de `_pilCmpSnapshot` après que le chemin par
> dates l'avait écarté. Repli réservé aux archives non datables + achèvement. ⚠️⚠️ **Première livraison ÉCRASANTE** : construite sur
> `43e30ec` et collée APRÈS TAILLE-1/ARCH-1/ARCH-2/STOCK-1/HORLOGE-1, elle a effacé ARCH-2 de `pilotage.js` et §177-§181 d'ici
> (commit `c9dd10e`). Rejouée sur les fichiers d'HORLOGE-1. `src/pilotage.js` : **aucun bump** (APP 7.66 · SW 8.35), base `c9dd10e`.
> Détail en **§182**.
>
> ★ Précédente : **26 septembre 2026 (HORLOGE-1)** — ★ **LES DATES PIÈGES (§181)** : aucun défaut trouvé — `_mvISO`,
> campagne, exercice et semaine ISO justes aux 10 instants pièges (25/10 journée de 25 h, 28/03 heure sautée, 00 h 30, 1er août,
> semaine 53, 29/02). Harnais `mv-harnais-horloge` (check) + `npm run tour:dates` (l'appli entière, horloge figée). Aucun bump.
> Détail en **§181**.
>
> ★ Précédente : **26 septembre 2026 (STOCK-1)** — ★★ **UNE SAISIE HORS LIGNE NE DISPARAÎT PLUS (§180)**. Si
> `localStorage` refusait d'écrire la file (quota), l'erreur était avalée et `_loadQueue` (appelée par `_flushQueue`) remplaçait la
> mémoire par le disque : saisie perdue à la reconnexion. Marques `_mvFileMemSeule` + restauration ; message unique ;
> `navigator.storage.persist()`. **APP 7.65 → 7.66 · SW 8.34 → 8.35**, base `43e30ec` (s'empile sur §177-179). Détail en **§180**.
>
> ★ Précédente : **26 septembre 2026 (ARCH-2)** — ★★ **LE BILAN PAR ANNÉE, CALCULÉ (§179)**. Pilotage › Archives :
> une carte par année (année vigne ou exercice comptable, `CONFIG.eco.archive_cadre`, admin) calculée à partir des archives de
> campagne — jamais recopiée. Dédoublonnage des archives d'avant ARCH-1 ; heures d'une campagne à cheval réparties au prorata de
> ses interventions datées. **APP 7.64 → 7.65 · SW 8.33 → 8.34**, base `43e30ec` (s'empile sur §177-178). Détail en **§179**.
>
> ★ Précédente : **26 septembre 2026 (ARCH-1)** — ★★ **L'ARCHIVE DE CAMPAGNE EST UNE PHOTO DE LA CAMPAGNE (§178)**.
> `npm run taille` (§177) sur MG : `historique` 192 Ko, les deux archives portaient les MÊMES 319 entrées (chaque clôture recopiait
> tout le journal depuis le premier jour) → limite Firestore vers la 4e clôture. Et `_clotExec` activait la nouvelle campagne sans
> attendre l'enregistrement de l'archive. Décision de Nico : une archive par campagne = sa photo ; vue annuelle CALCULÉE (ARCH-2).
> **APP 7.63 → 7.64 · SW 8.32 → 8.33**, base `43e30ec`. Détail en **§178**.
>
> ★ Précédente : **26 septembre 2026 (TOUR-4)** — ★★ **LE PREMIER « npm run tour » (§176)** : 845 écrans, 2 navigateurs,
> 5 rôles. Un vrai défaut : `goTo('pilotage')` ouvrait le Pilotage à l'ouvrier, au tractoriste, au saisonnier → garde **SEC-PIL**
> (patron SEC-GT). Le reste : faux positifs du tour corrigés (tuiles Leaflet, blocs repliés, variante de police jamais demandée,
> avertissement viewport de Safari). **APP 7.62 → 7.63 · SW 8.31 → 8.32**, base `4f7fb23`. Détail en **§176**.
>
> ★ Précédente : **26 septembre 2026 (PRES-1 + PDF-1 + SYNC-1 + ESC-1)** — ★★★ **UNE SEULE RÈGLE DE PRÉSENCE (§174)**.
> Le lot 1 du tour complet (code mort, doublons, lu sans navigateur) a trouvé quatre défauts. ① Deux règles de « était-il là ? » :
> `utils.js` comptait une fiche **Inactive sans date de contrat**, `_planCouvre` l'excluait — la même personne comptée sur un
> écran et pas sur l'autre. Décision de Nico (26/09), qui **remplace la convention du 09/07** : Inactive sans date = ABSENTE,
> sauf les années où elle a des heures au planning ; tout salarié doit avoir des dates, et l'appli le signale (constat Pilotage
> « fiche sans date de contrat »). ② `fbDeleteAnalyse` n'était appelée nulle part : les PDF restaient dans Storage. ③ Le point de
> synchro restait figé (import direct de `showSyncBadge`). ④ Un `&#39;` dans un onclick de l'Admin GT. **APP 7.61 → 7.62 · SW 8.30 →
> 8.31**, base `b4104fb`. Détail en **§174**.
>
> ★ Précédente : **24 septembre 2026 (ENG-2)** — ★★★ **« ENGAGÉ À CE JOUR » COMPTE LES HEURES PAYÉES (§173)**.
> Nico : « une semaine à 3 ou 4 à dégrafer, 17-19 € chargés, 8 h, 5 jours : je ne suis pas sûr que ça fasse 1 400 € ». La
> main-d'œuvre engagée était le BARÈME des travaux VALIDÉS (T.moF) : elle suivait l'avancement par construction. Elle vient
> maintenant de `_ecoTempsVigne` (E.moReel) : heures dans les rangs du planning, salariés vigne, moins la conduite tracteur,
> moins les JOURNÉES DE CAVE (`_ecoCaveJours` : `intervenants` des opérations d'élevage, jamais `operateur`, jamais une
> analyse), × taux chargé DU JOUR — validées ou non. `engageBar` garde l'ancien calcul pour les tableaux par parcelle et par
> tâche (colonnes « Réalisé »). Projection = engagé + reste de travail au barème (`resteBar`). Courbe : main-d'œuvre au jour
> payé. Fiche neuve `pil.eco.engage`. **APP 7.60 → 7.61 · SW 8.29 → 8.30**, base `d684d4e`. Écart de cadence : INCHANGÉ
> (Nico) — il ne retire pas les journées de cave, lui. Détail en **§173**.
>
> ★ Précédente : **23 septembre 2026 (TV-1 + TV-2)** — ★★★ **LE TEMPS RÉELLEMENT PASSÉ DANS CHAQUE PARCELLE (§172)**.
> ★ TV-2, même lot, même 7.60 (TV-1 jamais poussé) : **l'administrateur qui valide peut se décocher du groupe** — puce « Moi »
> des panneaux, « Moi aussi dans les rangs » de la barre d'équipe (mémorisé par tâche, `EQUIPE_TACHE.__hors`) ; l'entrée garde
> `qui` et porte `quiHors:true` ; moteur, `_ecoEquipeByParc` et `_jivQui` sautent l'auteur. Les listes de passages se RÉUNISSENT
> (la validation d'un appui écrit `[2]`, les panneaux `[1,2]`). ⚠️ **QUESTION OUVERTE (§28) : brancher l'écart de cadence sur
> ce moteur ?** Nico : « on laisse comme il est pour le moment ». Harnais : 38 assertions, 13 contre-épreuves.
> Nico : « il faudrait que le moteur calcule le nombre de vignes validées en une journée pour faire un prorata du temps passé
> dans chaque parcelle en fonction du nombre d'heures comptées sur le planning ». Précisé : une validation vaut pour TOUT le
> groupe nommé ; plusieurs parcelles le même jour se partagent au PRORATA DE LA SURFACE. `_ecoTempsVigne` (pilotage.js) : par
> salarié et par jour, heures dans les rangs (`_planChampPersRange`) moins sa conduite tracteur (`condH`, ajout pur à
> `_ecoTracHByParc`), ACCUMULÉES jusqu'à sa prochaine validation (une validation marque une FIN — 12 journées-personne sur 247
> en portaient une l'hiver), puis versées au prorata de la surface. Niveaux/passages : seul le NOUVEAU compte (listes
> cumulatives) ; « Annulé » retire la clôture. Carte « Temps réel contre barème » (Postes & travaux), fiche `pil.eco.temps`.
> Harnais neuf `mv-harnais-temps-vigne` (38 assertions, 13 contre-épreuves, TV-2 compris). **APP 7.59 → 7.60 · SW 8.28 → 8.29**, base
> `96f7f1d`. ⚠️ ENG-1 (« Engagé à ce jour » en euros sortis) : écrit puis ABANDONNÉ à la demande de Nico, jamais livré —
> ne pas le reprendre de mémoire. Détail en **§172**.
>
> ★ Précédente : **23 septembre 2026 (TOUR-2)** — ★★★ **LE RETOUR FERME CE QUI EST OUVERT, ET UN APPUI VA OÙ
> L'ON APPUIE (§171)**. Deuxième lot du tour complet (§170f). `_mvBack` ne connaissait que `.overlay` : six surfaces d'autres
> familles (feuille du Cuvier, tri, « Ce qu'il manque », « c'est fait », « Plus », feuilles de Décider) restaient ouvertes
> pendant que la page changeait. `_MV_SURFACES` + `_mvTopSurface` (app.js) les ferment par LEUR fermeture, la plus haute
> d'abord, la porte CGU jamais ; chaque ouverture pose une entrée d'historique. Le crayon INVISIBLE de la puce de conducteur
> (qui volait l'appui au milieu du nom) devient un bouton frère visible ; icône « traitement » rétablie ; `touch-action:
> manipulation` ; zones d'appui des puces ; décalage sous le bandeau de la démo avec code. Harnais neuf `mv-harnais-retour`
> (31 assertions, 11 contre-épreuves) ; rejoué sur l'appli compilée, vrais contacts. **APP 7.58 → 7.59 · SW 8.27 → 8.28**,
> base `8014ce2` — ⚠️ TOUR-1 (§170) pas poussé : **ce lot le contient**. Détail en **§171**.
>
> ★ Précédente : **23 septembre 2026 (TOUR-1)** — ★★★ **LE TOUR COMPLET DE L'APPLI, ET LE PREMIER LOT QUI EN SORT :
> L'AFFICHAGE (§170)**. Nico : « fais un tour complet de l'appli pour vérifier les bugs d'affichage, les boutons morts, les index z,
> la sensibilité aux taps ». Tour joué sur l'appli compilée (Chromium 390×844 tactile, 58 écrans, ~85 fenêtres, chaque bouton appuyé,
> contraste MESURÉ à l'écran dans les deux thèmes, bouton retour rejoué). Aucun bouton mort. Ce lot corrige l'affichage : deux cartes
> sombres dont le texte avait perdu sa couleur à TYPO-1 (`color:inherit` sans couleur sur la carte), la ligne de cuve du Cuvier
> (des `<span>` sans `display:block`), la date de la barre méta, `--cave` pris comme couleur de TEXTE (noir sur noir en sombre),
> 11 champs à fond blanc en dur, `--bordeaux` jamais déclaré. Écarts de contraste mesurés à l'écran : clair 21 → 12, sombre 66 → 33.
> **APP 7.57 → 7.58 · SW 8.26 → 8.27**, base `8014ce2`. ⚠️ Le bouton retour, les appuis et le bandeau démo restent OUVERTS :
> lot suivant, liste en **§170f**. Détail en **§170**.
>
> ★ Précédente : **23 septembre 2026 (CHAMP-1 + CHAMP-2)** — ★★ **LES HEURES « DANS LES RANGS » : DÉCIDER
> ET LA CADENCE NE COMPTENT PLUS UN SALARIÉ EN FORMATION (§169)**. Nico : « dans pilotage, une personne en formation, en arrêt,
> en cp, absente ne doit pas être comptée dans l'effectif du jour pour l'organisation des travaux », puis, pour la cadence :
> « on la passe sur la même lecture ». Mesuré : congé, récup, arrêt et absence valaient DÉJÀ 0 ; la **formation** et
> l'**événement familial**, non — le travail effectif de la loi les assimile (journée entière). Nouvelle lecture
> `_planChampPersRange` (mode `'champ'` de `_planRangeH_`, `_planChampH`) : Décider (`_dzJourMbr`) ET la cadence
> (`_planTeamCadence_`, `_pecCadPresence`, `_pecCadHisto`). Paie, compteur, taux horaire, exercice : inchangés (`'work'`/`'paid'`).
> Harnais neuf `mv-harnais-champ` (28 assertions, 11 contre-épreuves). **APP 7.55 → 7.57 · SW 8.24 → 8.26** (7.56/8.25 de
> CHAMP-1, livrées seules, jamais poussées : REMPLACÉES), base `59e2a39`. Détail en **§169**.
>
> ★ Précédente : **22 septembre 2026 (SESS-1)** — ★★★ **LES SESSIONS TRACTEUR NE PERDENT PLUS RIEN (§168)**.
> Nico : « Enlève absolument tous les bugs qu'il peut y avoir dans les sessions tracteurs. » Relu, le moteur perdait des
> mesures de quatre façons : ① **rouvrir la session TUAIT la mesure en cours** — la reprise la jugeait « lancée en retard »
> dès qu'elle était jeune (probablement l'essentiel des 17 écartées du 22/09) ; ② la pause oubliait le temps d'avant ; ③ refaire
> une parcelle remplaçait son temps, chaque morceau jugé seul ; ④ un seul chrono pour tout l'appareil. Maintenant une fois se
> POSE (`mes`, `n`, verdict sur le total), la pause garde son temps (`acc`), la reprise ne juge que l'oubli, un état par session
> et un seul chrono à la fois, une **boîte noire** (`s.trace`, 3 jours) lisible en bas de la feuille avec **« Rétablir »**, et
> **« Reprendre la mesure »** dans la boîte de TAP-1. Aussi : 99,6 % ne termine plus une session, la regarder ne la modifie
> plus, « Modifier » garde 0 %. Harnais neuf `mv-harnais-sessions` (31 assertions, 19 contre-épreuves) ; rejoué sur l'appli
> compilée contre la production. **APP 7.54 → 7.55 · SW 8.23 → 8.24**, base `147c7da`. Détail en **§168**.
>
> ★ Précédente : **22 septembre 2026 (DIMAV-1)** — ★★★ **AVANT SEPTEMBRE, LE DIMANCHE ET LE FÉRIÉ TRAVAILLÉS
> DONNENT ENFIN LEUR REPOS (§167)**. Nico : « pourquoi dans le planning les heures sup d'avant septembre et les dimanches et
> jours fériés ne sont pas comptés ? », puis : « lis ce qu'il y a d'écrit sur le planning de chacun […] une ligne visible du
> nombre d'heures qui ont été effectuées ces jours-là, mois par mois, et ce que ça ajoute en temps de repos réel. Avec la loi des
> 50 % ». Mesuré : en mode payé (défaut), un mois d'avant la bascule envoyait la majoration « à la paie » — que Ma Vigne n'éditait
> pas : elle n'allait NULLE PART, et AVANT-2 laissait l'heure du dimanche à 1 pour 1 en la croyant « déjà majorée à part ».
> `_planMajAuCompteur(m)` : avant `PLAN_RECUP_DEBUT`, la majoration entre au compteur le mois où le jour a été travaillé, quel que
> soit le mode. Colonne « Dim. et fériés » dans « Écart au planning · mois par mois » ; tableau « Dimanches et jours fériés
> travaillés avant septembre 2026 » (onglet Compteur, relevé p. 2). **APP 7.53 → 7.54 · SW 8.22 → 8.23**, base `f13c3ba`.
> Détail en **§167**.
>
> ★ Précédente : **22 septembre 2026 (TAP-1)** — ★★★ **FAIRE DÉFILER NE COCHE PLUS UNE PARCELLE (§166)**. Nico :
> « rien que défiler ça valide les parcelles ». Dans une session tracteur, la coche partait au LEVER DU DOIGT, quel qu'ait
> été son chemin (`touchmove` n'annulait que l'appui long). L'appui devient le `click` du navigateur — jamais né d'un
> défilement —, filtré par `_sdTapVerdict` (pure) : liste encore lancée, défilement pendant le geste, glissé de plus de
> 16 px, second appui à moins de 0,6 s. Décocher demande confirmation. ★ Trouvé en route : le point d'aide « Changer
> d'année » (PLAN-RECAL, §112) vivait dans la fiche TRACTEUR. ★★ Et l'outil de mesure a menti : `synthesizeTapGesture` ne
> fait aucun click en headless — rejoué en vrais contacts (`dispatchTouchEvent`) : sur la base, un défilement coche P04 ;
> sur le lot, rien, et l'appui franc coche. Harnais neuf `mv-harnais-tap` (45 assertions, 11 contre-épreuves). **APP 7.52 →
> 7.53 · SW 8.21 → 8.22**, base `ae8df34`. Détail en **§166**.
>
> ★ Précédente : **21 septembre 2026 (CREUX-1)** — ★★★ **CE QUI MANQUE DANS LES FÛTS DIT LA VÉRITÉ (§165)**. Le
> correctif annoncé en §164e, sur la base découpée (`81e93f9`). ① « Compléter le fût » a sa sortie : **« Mes fûts sont pleins —
> corriger ce qui manque »** (`_asmCorriger`, une correction, rien au registre) — c'est elle qui répare la cuvée signalée, dont la
> cuve décuvée ne pouvait plus servir de source. ② « Modifier la cuvée » : un fût enlevé **emporte son vide** et **retourne dans
> La Réserve** s'il en venait (`lot_id`). ③ « Décuver » : un « + » **remplace** un fût proposé en trop (`_vendDecSansTrop`, pure),
> un « − » ne recoche rien, et le volume retapé ne recompte que les fûts proposés (`_vendDecMain`). ★ Rejoué sur l'appli compilée,
> la visite, en touchant l'écran : sur la base, quatre « + » donnaient **8 barriques** et le volume retapé effaçait le choix ; sur
> le lot, **4**, et le choix reste. Harnais neuf `mv-harnais-creux` : 30 assertions, 12 contre-épreuves. **APP 7.51 → 7.52 · SW
> 8.20 → 8.21**, base `81e93f9`. Détail en **§165**.
>
> ★ Précédente : **21 septembre 2026 (CUV-DEC)** — ★★★ **LE CUVIER SORT DE `cave.js` : `src/cuvier.js`, ET UNE
> FRONTIÈRE GARDÉE (§164)**. `cave.js` était à 1 023 ko sur 1 024 ; la règle de §153h ⑥ disait que le prochain lot Cave commençait
> par le découper. Il a fallu le faire tout de suite : Nico venait de signaler un fût « pas plein » qui attend tout le vin de sa
> cuvée (fûts pré-cochés au décuvage en plus des siens, puis retirés par la croix de « Modifier la cuvée » sans toucher au manque
> ni les rendre à La Réserve) — le correctif touche `cave.js`. À la question « correctif serré dans le 1,7 ko restant, ou
> découpage d'abord ? » : *« découpage d'abord »*. 674 instructions de premier niveau passent dans `cuvier.js` (494 ko), 658
> restent (535 ko), chacune avec les commentaires qui la précèdent — recomposition vérifiée à l'octet. Deux états seulement
> traversaient : `_caveSectionAct()` (la section lue par Le Cuvier) et `_vendOngletCuves()` (l'onglet remis par le Chai). 78
> expositions en fin de fichiers. Harnais neuf `mv-harnais-cuvier` (15 assertions, 10 contre-épreuves) ; une seule porte pour
> les harnais, `scripts/mv-cave-src.mjs`. ★ Sur l'appli compilée, 41 écrans joués en visite : **DOM identique à la base, écran
> par écran**. **APP 7.51 inchangé · SW 8.19 → 8.20**, base `0ceadc4`. Détail en **§164**.
>
> ★ Précédente : **20 septembre 2026 (CIBLE-1)** — ★★ **LES CARTES ENTOURENT LA PARCELLE COMMENCÉE, SINON LA PROCHAINE
> À FAIRE — ET LA TOURNÉE PART ENFIN DE LA DERNIÈRE VALIDÉE, PAS DE LA PREMIÈRE DU JOUR (§163)**. Nico : « le point de la dernière
> parcelle validée clignote sur toutes les cartes », puis, la faisabilité rendue : « non en fait il faut montrer soit celle commencée
> et non finie, soit la prochaine à faire (commandé par le module Décider) ». Une définition unique, `_mvCibleCarte` (utils.js) :
> ① les parcelles COMMENCÉES et pas finies — chacune son anneau ; ② sinon la PROCHAINE, le n°1 de la tournée ENREGISTRÉE dans
> Décider. L'état d'une tâche (`_mvTacheEtat`, lu à l'étape en cours) devient la lecture COMMUNE de l'écran Vigne et des cartes.
> ★ Trouvé en route : le départ « dernière faite » de la tournée prenait la PREMIÈRE parcelle validée du jour (`>=` sur la date
> seule, journal rangé du plus récent au plus ancien) — et le défaut existait DEUX fois, la seconde ajoutée par DZ-1 dans « Qui fait
> quoi » (`_dzDernierFait`). Anneau doré qui respire (`.mv-cible-o`, figé en mouvement réduit) sur Parcelles › Carte, Pilotage ›
> Carte du domaine, la tournée du jour (page et « Agrandir ») et son repli hors ligne ; rien sur une archive. Harnais neuf : 33
> assertions, 16 contre-épreuves. **APP 7.49 → 7.51 · SW 8.17 → 8.19** (DERN-1, jamais poussé, est REMPLACÉ par ce lot), base
> `107a646`. Détail en **§163**.
>
> ★ Précédente : **20 septembre 2026 (DZ-1)** — ★★★ **PILOTAGE › DÉCIDER LU AU PLANNING, JOUR PAR JOUR : LA TOURNÉE
> DU JOUR, « QUI FAIT QUOI », ET LA CARTE QUI LAISSE DÉFILER (§162)**. Nico : « par défaut l'effectif réel, le nombre d'heures de
> travail de la journée, le temps de pause, le temps de trajet entre les vignes (revoir aussi le défilement sur téléphone qui ne marche
> pas) […] la tâche qui est indiquée en priorité du moment […] je veux un outil puissant ». Maquette validée (« c'est parfait »). La
> tournée part de la priorité, du prochain jour travaillé, de l'équipe affectée et présente ce jour-là au planning
> (`_planWorkPersRange`, un collectif compte son effectif), de ses heures et de sa coupure ; trajets calculés parcelle à parcelle
> (`_dzHop`, règle du domaine `CONFIG.eco.trajet`) ; fin déroulée jour par jour (`_dzSimuler`). « Qui fait quoi » remplace « Et si »
> sur le même moteur : les deux cartes donnent la même date. Un doigt sur la carte fait défiler la page (mesuré : 405 → 405 px avant,
> 1 179 → 1 404 après). **APP 7.48 → 7.49 · SW 8.16 → 8.17**, base `404b52b`. Détail en **§162**.
>
> ★ Précédente : **20 septembre 2026 (AVANT-2)** — ★★★ **À LA BASCULE, LES HEURES SUP D'AVANT SEPTEMBRE ENCORE AU COMPTEUR
> PRENNENT LEUR MAJORATION (§161)**. Nico, devant le détail de l'année (août : 27h faites, 27h gagnées, 27h restantes) : « les récup
> gagnées et restantes n'ont pas leur majoration je crois », puis, la règle d'AVANT-1 rappelée (voie ① choisie le 17/09 : « rien ne
> bouge ») : **« si les heures sup apparaissent encore c'est qu'elles n'ont pas été prises donc elles sont aussi majorées (que ça soit
> de l'heure sup ou de l'heure de dimanche ou férié) »**. `revalorise()` dans `_planCompteur` : au premier mois de la règle, ce qui
> RESTE de chaque tranche d'avant est relu (`_pfEstPile`) et devient de vraies tranches à 25 % et 50 % ; le gain entre en septembre
> (`r.revalo`, dans `majSup` et `entre`). Rien ne bouge de janvier à août. Restent à 1 pour 1 : un dimanche déjà majoré à part, la
> tranche `maj`, le report d'avant Ma Vigne. **419 assertions, 83 contre-épreuves.** **APP 7.47 → 7.48 · SW 8.15 → 8.16**, base
> `9e5044d`. Détail en **§161**.
>
> ★ Précédente : **20 septembre 2026 (CLAIR-1)** — ★★ **« POUR LA COMPTA » : TROIS TOTAUX D'HEURES SUP, TOUJOURS LES
> MÊMES, ET PLUS DE PHRASE À DÉCHIFFRER (§160)**. Nico, le relevé en main : « il faut qu'il y ait le total d'heures sup à payer à
> 25 %, le total à 50 %, le total de dimanche et de jours fériés […] il ne faut pas de phrase type nombre d'heures sup d'avant le
> mois estimé […] il faut que ça soit clair quand on marque aucune retenue. Idem quand est marqué dont heures dimanche déjà
> majorées : ce n'est pas clair ». Trois cases (à +25 %, à +50 %, dimanches et fériés), chacune avec son total et « Xh du mois +
> Yh d'avant » ; l'estimation d'avant septembre rejoint la case de SON taux ; ce qui n'a pas de taux (report d'avant Ma Vigne)
> garde sa ligne. « Maintenu » → « Aucune retenue ». « déjà majorées » → « à payer sans majoration (elle est déjà dans la
> récup) ». Les heures restantes (page 2, onglet Compteur) rangées de même — `_pfRestLignes`, qui SONT le total. **409
> assertions, 78 contre-épreuves.** **APP 7.46 → 7.47 · SW 8.14 → 8.15**, base `91ec503`. Détail en **§160**.
>
> ★ Précédente : **20 septembre 2026 (TAUX-1 + DIM-1)** — ★★★ **LE TAUX LE PLUS FORT SORT TOUJOURS EN PREMIER ; UNE
> RETENUE NE VOISINE PLUS UNE MAJORATION DU DIMANCHE ; LE DÉTAIL DE L'ANNÉE SE LIT DANS L'UNITÉ DU COMPTEUR (§159)**. Nico,
> relevés en main : « il faut que ça soit les heures à 50 % qui servent d'abord à rattraper les heures d'absence », « parfois
> les heures sup à 50 % sont supérieures aux heures sup à 25 %, pourquoi », « la colonne en repos ne veut rien dire » ; puis,
> sur les deux points ouverts : « trouve la solution, mais ça ne doit pas l'être » et « toujours le taux le plus haut sort en
> 1er ». Audit sur le vrai code : **aucune addition fausse** ; un défaut d'ORDRE, un tableau illisible (7h d'absence imprimées
> « 5h36 »), des tournures. **Un seul ordre pour tout ce qui sort du compteur** — absence, heures à rattraper, récup prise,
> PAIEMENT : le mois le plus ancien, puis le taux le plus fort (`ordre()`) ; l'estimation AVANT-1 retournée dans le même sens.
> **DIM-1** : en mode payé, la majoration seule entre au compteur le temps du calcul, après les heures sup ; absences, heures à
> rattraper et récup prise passent d'abord, le reste se paie ; mois figé : `fige.maj` = ce qui a été PAYÉ, `fige.majRep`.
> `_pfAnneeTable`, une source pour le papier et l'écran. **404 assertions, 73 contre-épreuves** (dont 140 mois tirés au
> hasard : jamais une retenue à côté d'un paiement) ; deux pages A4. **APP 7.45 → 7.46 · SW 8.13 → 8.14**, base `0bb80a5`.
> Détail en **§159**.
>
> ★ Précédente : **19 septembre 2026 (SIGN-1)** — ★★★ **LE CONTRAT EST PAR DOMAINE : UN ADMIN ARRIVÉ APRÈS NE SIGNE
> PLUS, ET LA PREUVE NE S'ÉCRASE PLUS (§156)**. Trouvé en relisant le code après TIERS-1 : un salarié passé admin a dû signer
> CGU + DPA « au nom du domaine » (claim `terms` par personne, contrat par domaine), et `acceptTerms` a REMPLACÉ la preuve
> d'origine (`set`, un document par domaine, sans historique). Serveur : transaction, historique `hist/{ref}-{ts_ms}`, preuve
> du domaine remplacée seulement si absente ou dépassée (`termsPlan`), courriel GT qui le dit. Porte : sans claim, la preuve
> du DOMAINE à jour suffit (`fbLirePreuveDomaine`, lisible par ses membres) ; sinon, et sur toute erreur, le formulaire
> (fail-closed). Reçu : « acceptées pour le domaine par … ». `scripts/mv-signature-restaurer.cjs` reverse la preuve écrasée
> depuis l'export du 19/09 (règle GCS de 7 jours → copier sous `archives/` d'abord). Harnais neuf : 30 assertions, 11
> contre-épreuves ; ★ son premier rouge était le test (extraction arrêtée aux options de `onCall`). **SW 8.10 → 8.11, APP
> 7.44 inchangé**, base `ebba4de` — ⚠️ TIERS-1 (§155) pas poussé : **ce zip le contient**. Détail en **§156**.
>
> ★ Précédente : **19 septembre 2026 (TIERS-1)** — ★★ **« SCRIPT ERROR. » N'EST PAS UNE ERREUR DE MA VIGNE :
> PLUS DE TOAST, UNE TRACE QUI DIT D'OÙ ELLE VIENT (§155)**. Rapport d'un domaine client : « Script error. », niveau
> error, ni écran ni compte, aucun détail technique. ★ Rejoué dans Chrome 141 avec la formule exacte du gestionnaire :
> un script d'une autre adresse chargé sans laissez-passer donne « Script error. », fichier vide, ligne 0, erreur nulle —
> le `detail` sort vide ; notre code (même adresse) et Leaflet (unpkg, crossOrigin + SRI) arrivent entiers. Restent le
> script reCAPTCHA d'App Check (inséré par le SDK sans crossorigin, lu dans `node_modules`) et ce que le téléphone
> injecte (extension, traducteur, navigateur d'une autre appli) — lequel, le navigateur l'a effacé. Le gestionnaire
> global reconnaît l'erreur effacée (`_mvErreurMasquee`) : plus de toast anglais ; `info` local (3 par session, le reste
> compté dans `window._mvErrTiersN`) ; UNE entrée par session au journal du domaine avec les scripts d'autres adresses
> présents (sans leur requête), le navigateur, le mode d'ouverture (`_mvErreurTiersContexte`). ★ La contre-épreuve a
> démasqué un test faux (ligne 5 : la condition sur la ligne cachait l'absence de celle sur le fichier). Harnais neuf :
> 26 assertions, 11 contre-épreuves ; rejoué dans un vrai Chrome. **SW 8.09 → 8.10, APP 7.44 inchangé** (`app.js` seul :
> correctif invisible, §7), base `ebba4de`. Détail en **§155**.
>
> ★ Précédente : **19 septembre 2026 (PAIE-1)** — ★★★ **« POUR LA COMPTA » : CE QUE LA COMPTA SAISIT, EN GROS ;
> LA DEMANDE EST UN TOTAL ; LE SALARIÉ D'ABORD, AUSSI DANS LA SEMAINE (§154)**. Nico : « les infos importantes sont marquées
> en petit […] que ça ne demande aucune ressource cognitive ». Mesuré : « Retenue sur salaire » en 9,5 px sous trois chiffres
> de 17 px qui ne s'additionnaient pas. Cadre « Pour la compta » (`_pfCompta`, papier et écran) : une ligne par chose à
> saisir, le chiffre en gros, « aucun » en gris, le pourquoi dessous ; les taux à 0h ne s'impriment plus. Défauts trouvés :
> ① une demande de paiement FONDAIT quand les heures sup du mois baissaient (30h → 21h, 20h au compteur) — `paye` est
> désormais un total, le reste se prend au compteur au calcul (`spill`, `tireBrut`, `FG.spill`) ; ② dans la semaine, le
> domaine passait avant le salarié (ordre des jours) ; ③ le relevé de Nico sur 3 pages ; ④ « Récupérées » mêlait récup et
> absences (`brutRec` / `brutAbs`). Septembre : Victor 5h45 → 3h45 retenues, Nico 24h30 → 30h payées. Harnais recup :
> 378 assertions, 60 contre-épreuves. **APP 7.43 → 7.44 · SW 8.08 → 8.09**, base `3cbb7c8`. Détail en **§154**.
>
> ★ Précédente : **19 septembre 2026 (ASM-1 + VOL-2)** — ★★★ **LE FÛT ENTAMÉ SE COMPLÈTE DEPUIS LE CHAI,
> ET LA CHAÎNE DIT LE kg/hL DE CHAQUE ÉTAPE (§153)**. Une cuvée garde ce qui manque dans ses fûts (`manque_l` :
> écrit au décuvage mesuré, suivi à la correction, déduit pour les cuvées d'avant) et `_caveVolL` le retire — Le Chai
> compte le vin réel. On touche le fût entamé (carte, fiche) : « Compléter le fût » avec le vin d'une cuve du Cuvier —
> même pas encore décuvée (le prélèvement sort de son contenu, reste à son rendement) — ou d'une cuvée du Chai ; la
> composition est gardée, une ligne « Assemblage » va au journal et au registre, la supprimer défait tout. La chaîne :
> kg/hL sous chaque étape, l'apport en pointillé, et ★ un id de dégradé par graphe (les barres disparaissaient après
> un passage par Bouteilles — trouvé sur la maquette). ★ L'essai de bout en bout sur l'appli compilée a trouvé ce que
> la maquette ne pouvait pas voir (un style du Cuvier absent). Harnais neuf : 48 assertions, 17 contre-épreuves.
> ⚠️⚠️ **`cave.js` est à 1 023 ko sur 1 024 : le prochain lot Cave commence par le découper (§153h ⑥).**
> **APP 7.42 → 7.43 · SW 8.07 → 8.08**, base `85f0959` — **VOL-1 pas poussé, le zip contient les deux**. Détail en **§153**.
>
> ★ Précédente : **19 septembre 2026 (VOL-1)** — ★★★ **UNE CUVE CONTIENT CE QU'ON Y A MIS, PAS SA
> CONTENANCE (§152)**. Nico, sur « De la récolte à la bouteille » : « ce n'est pas la contenance de la cuve qui est à
> mettre mais le nombre d'hectolitres estimé […], puis ce qui est réellement entonné (et non la taille du fût) », et
> « vérifie que cette règle s'applique bien partout ». Une seule porte, `_vendVolContenu` (décuvée : le volume logé ;
> avant : les caisses à la règle du Cuvier, saignées déduites ; sans caisse : rien). Seize lecteurs corrigés, dont ★ la
> tournée qui chaptalisait sur la contenance sans case (Ruchottes, +1° : 8,4 kg de sucre au lieu de 6,0) et le registre
> qui calculait le SO₂ dessus. Chaîne : kilos → estimé → entonné MESURÉ (pointillé + « Saisir le volume entonné » sinon)
> → bouteilles ; « Après élevage » (les fûts comptés pleins) disparaît. Les volumes du Chai attendent ASM-1 (assemblage,
> fût en creux — maquette ; « le jus peut venir d'une cuve pas encore décuvée »). Harnais neuf : 48 assertions, 19
> contre-épreuves. **APP 7.41 → 7.42 · SW 8.06 → 8.07**, base `85f0959`. Détail en **§152**.
>
> ★ Précédente : **19 septembre 2026 (FIGE-1)** — ★★ **FIGER À L'ENVOI : CE QUI CHANGE ENSUITE PASSE AU
> MOIS SUIVANT (§151)**. Nico : « on fige à l'envoi ce qui a été payé et retenu pour le reporter sur le mois suivant.
> Ajoute juste un bouton pour figer ». Bouton **Figer** (fiche › Résumé › Envoi à la compta) → instantané
> `PLANNING_HSUP[nom][mois].fige` ; un mois figé garde son paiement et sa retenue ; l'écart (retenue vive − figée, et la
> majoration seule en mode payé) entre au mois suivant par `_planCompteur` : à retenir (repris d'abord sur la récup et
> les heures sup), à rendre, majoration à payer. Harnais recup : 358 assertions, 56 contre-épreuves. **APP 7.40 → 7.41
> · SW 8.05 → 8.06**, base `d099fe5` — ⚠️ §150 n'est pas poussé : **ce zip contient les deux**. Détail en **§151**.
>
> ★ Précédente : **19 septembre 2026 (NET-1)** — ★★★ **UNE RETENUE OU DES HEURES SUP À PAYER, JAMAIS LES
> DEUX ; LE RELEVÉ COMPTE TOUT LE MOIS (§150)**. Parti de l'audit du relevé de Victor (3h sup payées ET 3h30 retenues).
> Nico : « TOUTES les heures d'absences sont récupérées sur les heures sup » ; « il est impossible qu'apparaissent les deux
> sur la feuille » ; la feuille part à la compta la dernière semaine, « tous les jours doivent apparaître […] faits aux heures
> indiquées ». Puis, sur maquette : le domaine se reprend sur la récup d'abord, puis va aux heures à rattraper, jamais
> retenu ; « retirer absence sans motif » (= injustifiée depuis septembre). Paiement plafonné APRÈS les absences
> (`_planCompteur`), salarié avant domaine, `_planPayeMaxCouvert` retirée, mode provisoire retiré, lundi 31 août qui
> servait deux fois corrigé. Harnais recup : 345 assertions, 51 contre-épreuves ; semaine revu. **APP 7.39 → 7.40 · SW
> 8.04 → 8.05**, base `d099fe5`. Détail en **§150**.
>
> ★ Précédente : **19 septembre 2026 (FUT-CAP-2)** — ★★ **CE QUI RESTAIT OUVERT EN §148 EST RÉGLÉ (§149)**.
> Nico : « règle ce qui est ouvert ». Une cuvée remise d'« Embouteillée » à « En élevage » reprend ses fûts au parc
> (`_mvFutDispo` / `_mvFutReprendre`, triplet ET contenance) ou refuse s'ils n'y sont plus ; l'ouillage à prévoir compte
> chaque fût à sa contenance (`vol_par_eq_L`) ; La Réserve rendue avec le VRAI `reserve.js` ; `MV_INFO` relue (`cave.auj`
> affirmait « jamais d'une moyenne par fût » : c'en est une) ; **`test:smoke` joué pour la première fois dans le bac à
> sable** — démarrage OK, 23/23 globaux. Harnais futcap : 64 assertions, 17 contre-épreuves. **APP 7.38 → 7.39 · SW 8.03
> → 8.04**, base `c227c18` — ⚠️ §148 n'est pas poussé : **ce zip le contient**. Détail en **§149**.
>
> ★ Précédente : **19 septembre 2026 (FUT-CAP + CUV-14)** — ★★★ **LA CONTENANCE D'UN FÛT VIT DANS SON LOT, ET
> LE VOLUME DÉCUVÉ SE SAISIT (§148)**. Nico : « modifier manuellement la contenance d'un fût si nécessaire » et « indiquer
> la quantité exacte décuvée » → contenance dans le LOT (« ta reco »), maquette v1, « go ». `l` (litres) sur
> `INTRANTS.futs[]` et `cuvee.tonneaux[]`, absent = réglage du domaine ; `_caveFutsL` devient la seule porte des volumes
> de fûts (fiche, part des anges, bilan de campagne — 2,28 y était EN DUR —, retrait). Volume décuvé saisi →
> `vol_decuve_hl` + `vol_decuve_src:'mesure'`, corrigeable après coup. ★★ Trouvé en route : « Modifier la cuvée »
> effaçait tonnelier, référence et lot des fûts (quatrième fois le piège de l'objet rebâti), inventait six fûts sur une
> cuvée en cuve, et « Embouteillée » y perdait les fûts ; « Les deux » au décuvage ajoutait un fût fantôme ; « cuve prise »
> refusait APRÈS avoir sorti les fûts du parc. Harnais neuf : 54 assertions, 13 contre-épreuves. **APP 7.37 → 7.38 ·
> SW 8.02 → 8.03**, base `c227c18`. Détail en **§148**.
>
> ★ Précédente : **18 septembre 2026 (AVANT-1)** — ★★ **LES HEURES SUP D'AVANT SEPTEMBRE 2026 ONT UN TAUX
> ESTIMÉ (§147)**. Nico : récupérer les taux et les récup d'avant septembre ? → la voie indicative (« 1 »), maquette,
> « go ». Rien ne bouge au compteur ni aux paies : là où l'appli écrivait « taux à vérifier », elle relit les jours de
> janvier à août avec la règle d'aujourd'hui et donne une estimation à 25 % et 50 % (bascule avancée le temps de la
> lecture, remise en place dans un `finally`). La ligne se sépare en trois : estimées, majoration seule, report d'avant
> Ma Vigne. Harnais recup : 331 assertions, 47 contre-épreuves dont 8 neuves. **APP 7.36 → 7.37 · SW 8.01 → 8.02**,
> base `a578994`. Détail en **§147**.
>
> ★ Précédente : **18 septembre 2026 (FUSION-1)** — ★★★ **UNE ÉCRITURE N'EFFACE PLUS CE QU'UN AUTRE APPAREIL A
> SAISI (§146)**. Chaque document était réécrit en entier : la Cave sans écoute, la file hors ligne et une vieille valeur
> en file effaçaient en silence le travail des autres appareils. Désormais : transaction, fusion à trois voies (par `id`,
> `nom` ou contenu ; modifié contre supprimé → gardé ; sans base → union), mémoire mise à jour, file avec la base de sa
> première mise en file. ★★★ **Défaut dormant des parcelles corrigé** : la base avançait sans la mémoire, et la
> deuxième écriture reprenait une tâche validée ailleurs. Harnais neuf : 29 assertions (400 tirages au hasard), 15
> contre-épreuves. **APP 7.35 → 7.36 · SW 7.99 → 8.00**, puis **SW 8.01** : l'e2e a attrapé deux défauts de §145,
> corrigés (§145i). Base `c0e671a` — ⚠️ §145 non poussé : **ce zip le contient**. Détail en **§146**.
>
> ★ Précédente : **18 septembre 2026 (BOOT-1 + REPRISE-1)** — ★★★ **LE DÉMARRAGE NE RESTE JAMAIS MUET, ET LE
> RETOUR DE VEILLE VÉRIFIE QUE LE SERVEUR RÉPOND (§145)**. Sur iPhone, au second domaine : écran de connexion figé sur le
> logo, sans profil ; saisies de l'ordinateur absentes du téléphone — « toutes opérations », a précisé Nico. ★ Lu dans le
> SDK : App Check charge reCAPTCHA sans gérer l'échec (la page attend POUR TOUJOURS), et une erreur interne met Firestore
> hors service jusqu'au rechargement — **ce que l'app masquait comme bénin**, trace comprise. Attentes du démarrage
> bornées + filet final, démarrage sans attendre `load`, appels bornés en entier, reprise au retour de veille (sonde,
> relance du flux, relecture), voyant « Pas de synchro », carnet d'incidents envoyé au journal du domaine. Harnais neuf,
> horloge simulée : 47 assertions, 29 contre-épreuves. **APP 7.34 → 7.35 · SW 7.98 → 7.99**, base `c0e671a`. Détail en
> **§145**.
>
> ★ Précédente : **18 septembre 2026 (SEM-3)** — ★★★ **L'ÉCRAN DE LA FICHE DIT LA MÊME CHOSE QUE LE RELEVÉ v3
> (§144)** — UNE seule source (`_pfV3`, `_pfComptesV3`), deux rendus. Cadre : absences par cause, « à ce jour » ; Jours :
> à la semaine ; Compteur : du solde d'avant au solde d'après, et la carte « Heures à rattraper » **toujours** là (Nico).
> ★ La note de l'onglet Jours disait encore « 43e heure » depuis SEM-1 : mon grep cherchait `43e`, le code écrit
> `43<sup>e</sup>`. **APP 7.33 → 7.34 · SW 7.97 → 7.98.** ⚠️ `origin/main` toujours `270320f` : **ce lot contient SEM-1
> et SEM-2 et les remplace.** Détail en **§144**.
>
> ★ Précédente : **18 septembre 2026 (SEM-2)** — ★★★ **LE RELEVÉ D'HEURES v3 (§143)**, second volet de la maquette
> validée le 17/09. Édité en cours de mois il est PROVISOIRE (un jour à venir n'est pas un jour fait, il ne se signe
> pas) ; chaque absence dit sa cause et ce qu'elle devient ; la semaine se lit en entier, le lundi du mois d'avant en
> gris ; page 2, une unité par colonne, le compteur part du solde d'avant et tombe juste, le compte des heures à
> rattraper, le cumul depuis janvier, les mentions que les textes demandent. ★ Les jours des trois relevés de départ,
> reposés dans le vrai code et rendus dans Chromium avec les polices du dépôt : **deux pages A4 dans les six cas**.
> **APP 7.32 → 7.33 · SW 7.96 → 7.97.** ⚠️ **SEM-1 n'était pas poussé (`origin/main` = `270320f`) : ce lot le CONTIENT
> et le remplace**, base `270320f`. Détail en **§143**.
>
> ★ Précédente : **17 septembre 2026 (SEM-1)** — ★★★ **LES HEURES SUP SE COMPTENT À LA SEMAINE (§142)**.
> Nico, sur trois relevés de septembre : *« beaucoup d'erreurs »*, puis *« il faut que les heures sup se comptent à la
> semaine »*, *« les heures écourtées par le domaine restent à rattraper »*, *« il est bizarre de voir un nombre d'heures
> sup à +25 % inférieur à +50 % »*, puis « go » sur la maquette v3. `_planHsupMois` : les heures en plus rattrapent
> d'abord les heures manquées de la MÊME semaine ; huit heures sup à 25 %, puis 50 % (le rang, plus la 44e heure
> travaillée) ; une semaine appartient au mois où elle finit ; un jour sans saisie vaut les heures du modèle.
> ★ Contrat de sortie du moteur inchangé : **3 rouges sur 237** au premier passage, les trois attendus.
> **APP 7.31 → 7.32 · SW 7.95 → 7.96**, base `270320f`. ⚠️ Le relevé v3 lui-même (absences par cause, compte des
> heures à rattraper, relevé provisoire, mentions légales) est le lot suivant, **SEM-2**. Détail en **§142**.
>
> ★ Précédente : **17 septembre 2026 (FICHE-5)** — ★ **LE DÉTAIL MOIS PAR MOIS SE LIT EN HEURES SUP (§141)** :
> heures sup du mois, payées, récupérées, solde restant — une seule unité, et chaque ligne se vérifie à la main.
> **APP 7.30 → 7.31 · SW 7.94 → 7.95**, base `4f7ccc8`. Détail en **§141**.
>
> ★ Précédente : **17 septembre 2026 (FICHE-4)** — ★★ **PAYER AU-DELÀ DU MOIS (§140)**. Le moteur savait
> payer sur le compteur ; l'écran bornait tout aux heures du mois. `_planPayeEcrire` écrit un paiement à un seul
> endroit, `_planPayeMaxTotal` dit tout ce qui est payable, « Tout le compteur » le propose ; un report d'avant
> septembre 2026 s'écrit « taux à vérifier ». **APP 7.29 → 7.30 · SW 7.93 → 7.94**, base `2a37d69`. Détail en **§140**.
>
> ★ Précédente : **17 septembre 2026 (FICHE-3)** — ★★ **UN NOMBRE D'HEURES PAR TAUX, ET CE QU'IL RESTE À
> PAYER (§139)**. Demande de paiement : quatre lignes (25 %, 50 %, dimanche, férié), et au Compteur les heures
> sup restantes à payer — le compteur de fin de mois relu tranche par tranche en heures brutes, donc les mêmes
> heures que la récup restante. **APP 7.28 → 7.29 · SW 7.92 → 7.93**, base `0df4750`. Détail en **§139**.
>
> ★ Précédente : **17 septembre 2026 (FICHE-2)** — ★★★ **LE RELEVÉ SUIT LA FICHE (§138)**. À partir de
> septembre 2026, deux pages A4 : cadre « Pour la paie », chaque jour en colonnes Prévu / Fait / Absence payée,
> puis heures sup, récup, détail mois par mois, contrats, congés, compteur d'heures, acomptes et trois cases de
> signature et d'envoi. ★ L'écran et le papier lisent les mêmes aides `_pf*` (instantané avant/après : neuf
> égalités). ★★ `mv-harnais-releve` a refusé une première version qui perdait les contrats de l'année.
> **APP 7.27 → 7.28 · SW 7.91 → 7.92**, par-dessus FICHE-1. Détail en **§138**.
>
> ★ Précédente : **17 septembre 2026 (FICHE-1)** — ★★★ **LA FICHE D'UN SALARIÉ SE LIT COMME UNE
> PAIE (§137)**. Quatre onglets (Résumé, Jours, Compteur, Congés et acomptes), le mois se change sans fermer
> la fiche, cadre « Pour la paie » (salaire de base, à payer en plus, à retirer, pour information), case
> « demande à être payé » quel que soit le mode du domaine. ★ Comme en paie, **un congé payé n'est jamais une
> heure manquée** : `_planPaieMois` range chaque jour en prévu / fait / absence payée / neutre. Le relevé PDF
> suit en **FICHE-2**. **APP 7.26 → 7.27 · SW 7.90 → 7.91**, base `612735b`. Détail en **§137**.
>
> ★ Précédente : **16 septembre 2026 (RECUP-2)** — ★★★ **POUR LA COMPTA : L'HEURE ET SON TAUX,
> JAMAIS 1H15 (§136)**. Nico : *« 1h sup en récup égale 1h15, en paie égale 1h15, MAIS pour la paie il faut
> laisser 1h sup car la compta intègre en 1h + 25 % »*. Le compteur compte en temps de récup **dans tous les
> modes**, chaque tranche garde son taux, ce qui se paie se déclare en heure brute ; une heure sup un dimanche
> va au taux le plus fort, une fois. Carte et relevé « Pour la compta ». ★ Trouvé en route : **la v4 opposait
> récup et paie — c'était une équivalence** ; deux assertions du harnais encodaient l'ancienne règle.
> **APP 7.25 → 7.26 · SW 7.89 → 7.90**, base `2bc2a6d`. Détail en **§136**.
>
> ★ Précédente : **16 septembre 2026 (RECUP-1)** — ★★★ **UNE JOURNÉE ÉCOURTÉE SE RETIRE DU
> COMPTEUR AU TAUX NORMAL, ET LES HEURES SUP DEVIENNENT DU TEMPS DE RÉCUP MAJORÉ (§135)**. Nico : *« retirées
> de prime abord des heures sup »*, *« afficher les temps de récup en majoration (25 % ou 50 %) »*, *« retirer
> au taux normal »*. Une absence peut couvrir **une partie de la journée** (créneau + motif, deux motifs
> neufs) ; à partir de **septembre 2026**, `_planCompteur` calcule le compteur une fois et `_planBank` /
> `_planYearBalance` en sont deux lectures. ★ Trouvé en route : **la feuille du jour n'avait ni hauteur
> maximale ni fond depuis le socle du dépôt** (mesuré dans Chromium sur la base intacte) ; ⚠️⚠️
> `mv-harnais-releve` **aurait rougi le 1er janvier 2027** (année courante lue) — horloge figée.
> **APP 7.24 → 7.25 · SW 7.88 → 7.89**, base `8136bd0`. Détail en **§135**.
>
> ★ Précédente : **16 septembre 2026 (PREP-1)** — ★★★ **LE MODE PRÉPARATION GUERETTECH
> (§134)**. Nico : *« je préfère mettre en place un mode préparation »* — depuis la carte client du panneau,
> GUERETTECH ouvre un domaine **dans ses écrans normaux** pour le préparer avant la remise, **au nom de
> GUERETTECH, sans valider aucune tâche** (décision du 16/09). ⚠️⚠️⚠️ **Le serveur ne protège plus d'une
> erreur de domaine** : le jeton GT écrit partout, et la file d'attente, le coffre et les copies de secours
> ne sont pas rangés par domaine. Quatre règles tiennent le filet dans l'application (en ligne, file
> marquée, aucune copie locale, un rechargement par domaine). ★ Trouvé en route : `agtLogAccess` aurait
> **remplacé tout le journal d'accès** par une ligne s'il était appelé hors du panneau ; « Accéder » ouvre
> un onglet **sans** la session GT ; ⚠️⚠️ **le preflight est aveugle sur ~220 lignes de `firebase.js`**
> (un « auth/ » + étoile dans un commentaire ouvre un faux bloc pour C23). **APP 7.24 inchangé · SW 7.87 →
> 7.88**, base `11188c7`. Détail en **§134**.
>
> ★ Précédente : **15 septembre 2026 (CUV-13)** — ★★★ **L'ÉTAPE « DÉCUVAGE » S'APPELLE
> « PRESSURAGE », ET LA CUVE PRESSURÉE RESTE RÉCLAMÉE (§133)**. Nico : *« le décuvage ici est en fait
> un pressurage »* — à cette étape on presse, et quand il reste du sucre le jus finit sa FA **dans une
> autre cuve** avant la mise en fût. L'étape (clé `decuvage`, posée par « Changer l'étape ») n'était ni
> active ni décuvée : plus de « Saisir une mesure », plus de champ dans la tournée. Libellé changé, **clé
> inchangée** ; `_vendPressee` entre dans `_vendSuivie` — **réponse de Nico : « réclamée »** — donc dans
> `_vendMesurable`. ★ Trouvé en route : le badge de l'onglet comptait `_vendIsActive` quand l'alerte
> « à mesurer » lit `_vendSuivie`. ⚠️⚠️ **Un filet se serait éteint en silence** : `mv-harnais-cuvdoc`
> testait l'**absence** de « >Décuvage< », vert à jamais après le renommage (§133d). **APP 7.23 → 7.24 ·
> SW 7.86 → 7.87**, base `b3fa09f`. ⚠️ §130–§132 (CONTRASTE-1, CONTRASTE-2, AVALE-1) n'avaient pas
> relevé cet en-tête : lire leurs sections. Détail en **§133**.
>
> ★ Précédente : **14 septembre 2026 (CUV-11)** — ★★★ **LA DENSITÉ SE RELÈVE ENCORE UNE
> FOIS LA CUVE DÉCUVÉE (§129)**. Nico : *« il faut pouvoir mesurer encore la densité une fois les
> cuves décuvées. »* Trois portes fermées, et la dernière tenait les deux autres : `renderVendTour`
> décidait l'écran vide sur `_vtActives()` **avant de regarder le filtre**, donc la dernière cuve
> décuvée fermait la tournée entière — **l'état normal du cuvier après vendange, tous les ans**.
> Nouveau prédicat `_vendMesurable` : **pouvoir relever n'est pas devoir relever** ; bouton, ligne,
> écriture et progression couvrent le même ensemble, `_vendSuivie` ne bouge pas, rien ne rouvre.
> ⚠️⚠️ **Une contre-épreuve s'est éteinte en silence** en élargissant le harnais : son ancre
> (`var m=_vtMesJour(c);`) est devenue non unique dans le bloc extrait, `String.replace` a saboté la
> mauvaise fonction. ⚠️⚠️⚠️ **Lot rebasé DEUX FOIS dans la journée** (§127 puis §128 sur les mêmes
> fichiers) — *une livraison qui attend une heure doit être rebasée, pas collée* (§129e).
> **APP 7.20 → 7.21 · SW 7.82 → 7.83**, base `f6ed8e7`. Détail en **§129**.
>
> ★ Précédente : **14 septembre 2026 (NS-1 + BAS-1 + PLUS-1)** — ★★★ **TROIS FAMILLES SE
> PARTAGEAIENT LE PRÉFIXE `.mvt-*` SANS LE SAVOIR (§128)**. Nico : *« revois toutes les polices, tous
> les affichages en z-index pour être sûr que tout s'affiche — j'ai retrouvé des problèmes mais je ne
> sais plus où. »* La suite était verte, `mv-harnais-couches` aussi : il lisait `.mvt-ov` et répondait
> **9500**. Il avait raison, et il se trompait — la classe était déclarée **deux fois**, 9500 dans
> `styles.css` (porte CGU) et **9200** dans la CSS injectée par `utils.js` (feuille de tri). Six
> classes en collision, toutes dans `.mvt-*` : la **porte CGU**, la **feuille de tri** et la
> **tournée du Cuvier**. Mesuré à l'écran : titre de la feuille de tri **noir sur noir**, sous-titre
> en capitales tronqué à une ligne, en-tête de la tournée **mis en ligne** par un `display:flex` qui
> ne lui était pas destiné. ⚠️ Latent : la porte CGU (*fail-closed*) tombait à 9200 **avec
> `opacity:0` et `pointer-events:none`** dès qu'une feuille de tri avait été ouverte.
> ★★★ **ET LE RENOMMAGE A DÉCOUVERT UN SECOND DÉFAUT QUE PERSONNE NE CHERCHAIT** : la feuille de tri
> était à **9200 = le plancher modal**, invisible tant qu'elle portait le nom de la porte, que le
> harnais excluait légitimement. Descendue à 9000. **BAS-1** : la barre « Terminer la tournée »
> (`bottom:0`, z **50**) passait **sous le socle** (`bottom:0`, z **90**) — la garde de 140 px du
> conteneur prouvait qu'elle avait été pensée au-dessus. **PLUS-1** : **66** « ＋ » pleine chasse
> (U+FF0B), absent des **deux** subsets latins donc dessiné par une police système, remplacés par
> U+002B. ★ Deux filets : `mv-harnais-couches` refuse qu'une classe soit déclarée dans deux feuilles ;
> `mv-harnais-subset.mjs` (neuf) lit plages et graisses **dans `fonts.css`** et tient le cliquet.
> **APP 7.19 → 7.20 · SW 7.81 → 7.82**, base `56cd2c8`. Détail en **§128**.
>
> ★ Précédente : **14 septembre 2026 (TYPO-1)** — ★★★ **LE BARÈME `--pt-*` EXISTAIT DEPUIS DS-0 ET
> DEUX MODULES SUR ONZE S'EN SERVAIENT (§127)** : 1 246 tailles converties, **zéro pixel de change**,
> et le prérequis du réglage « taille du texte » enfin posé. **APP inchangé · SW 7.80 → 7.81.**
>
> ★ Précédente : **13 septembre 2026 (AUDIT)** — ★★★ **SIX DÉFAUTS TROUVÉS HORS DES
> HARNAIS (§122)**. Nico : *« vérifie l'intégralité des fichiers, les codes, les calculs, les
> cohérences, les bugs »*. La suite complète était verte, `node --check` aussi, et ESLint rejoué
> avec **`no-undef` activé** n'a rien rendu : ce qui restait demandait de MESURER autre chose.
> ① Le registre commercial vivait dans `_guerettech/tenants`, **lisible sans compte** — une règle
> Firestore protège un DOCUMENT, pas un champ ; il passe dans `_guerettech/clients`, GT-only, et la
> fuite se referme à la première écriture (setDoc sans merge, zéro migration).
> ② **FUS-2** : `toISOString().slice(0,10)` rend la date **UTC** — à Paris, une saisie de 00 h 30
> était datée de la veille, registres réglementaires compris. **78 réécritures** vers
> `_mvISO`/`_mvToday`, promus depuis `_gnrTodayISO` qui était **le seul juste du dépôt**.
> ⚠⚠ **8 exclusions assumées** : les allers-retours jour-époque restent UTC — *une seule horloge
> par fonction*, pas « local partout ».
> ③ Le défaut `marchand-grillot` avait survécu à sa suppression dans les **deux** endroits qui
> tournent avant le login (clé locale, `start_url` du manifest — figé par le navigateur à l'install).
> ④ Le cuivre lissé divisait par les années TRAITÉES : 18 kg sur 7 ans (conforme) sortait
> « Dépassement ». ⑤ Le plafond 28 était en dur à six endroits face à un réglage. ⑥ Les réglages
> de vendange n'avaient aucun garde-fou.
> ★ Deux filets : `mv-sitemap.mjs` et `mv-dates-reelles.mjs`. ★★★ **Les cliquets ont attrapé
> l'auditeur trois fois**, et **deux constats de l'audit étaient faux** — retirés en §122.
> **APP 7.16 → 7.17 · SW 7.76 → 7.77**, base `82f22a4`. Détail en **§122**.
>
> ★ Précédente : **10 septembre 2026 (soir, PIL-FIN)** — ★★★ **LA DATE DE FIN D'AUJOURD'HUI EST CELLE DE LA
> CAMPAGNE (§105)**. Nico : *« je crois que les 32 jours d'avance sont faux »*. Ils l'étaient : « +32 j d'avance, fin le
> 15 févr. » sur Aujourd'hui, du **rouge** fin mars sur La campagne et « 4,9 personnes pour 2,8 » dans le tableau des
> fenêtres, sur les mêmes données. Le cockpit avait **son** moteur (`_pilCapaProj`) : il cumulait l'équipe dès le
> **1er jour de la période** (le « 97 j ouvrés » le prouvait) sur une taille dont la fenêtre ouvre le 26 novembre, sans
> tracteur, sans chevauchement. Mesuré au bac, fonctions réelles : **+51 j ici, 409 h en retard là**. `_pilMargeCalc`
> lit désormais **`_pilFinPlan` = `_rfCtx(d,'reste',{sansTaux})` + `_rfSim`** — le moteur de La campagne — à la
> **capacité normale**, **sans rallongement du retard**, facteur de cadence sur les heures ; fin descendue au jour,
> « vers le » et équipe reconduite au-delà du cadre. `_pilCapaProj` supprimé. Échéances par tâche lit `m.capa.taches`.
> ⚠️ **Deux arbitrages pris et écrits** (§105c) : le rallongement du retard du simulateur faisait finir 644 h le
> **20 juillet** (facteur ×4) ; les 1,3 ETP de tracteur déduits tout l'hiver sur la capture sont une **hypothèse à
> vérifier** (roue › ETP au tracteur). **APP 7.01 → 7.02 · SW 7.60 → 7.61**, base `eb12c01`. Détail en **§105**.
>
> ★ Précédente : **10 septembre 2026 (PIL-COH + PIL-EXO + PIL-DIAG)** — ★★★ **LE PILOTAGE NE SE CONTREDIT
> PLUS (§103), L'EXERCICE EST COUPÉ AU JOUR ET IL N'Y A PLUS QU'UNE LISTE « À COMPLÉTER » (§104)** : un bac qui EXÉCUTE
> les huit onglets a trouvé onze défauts (deux dates de fin, une cadence qui comptait une fiche pour 30 vendangeurs, un
> écart refusé ici et appliqué là, la masse salariale sans le bureau — 0a-quater enfin livré) ; l'Exercice dit engagé /
> prévu / à la clôture et se compare à l'an dernier aux mêmes jours ; `_pecZeros` relit `_pilDiag`. ⚠️⚠️ **Le lot a été
> construit deux fois** : CAVE-6 avait pris 7.00 / 7.59 entre les deux — rejoué sur `d92de47`, puis sur `ae9adbd`. **APP 7.00 → 7.01 ·
> SW 7.59 → 7.60.** Détail en **§103** et **§104**.
>
> ★ Précédente : **10 septembre 2026 (CAVE-6)** — **L'ORDRE DU CUVIER, LE FILTRE DU CHAI,
> ET 482 TAILLES DE TEXTE (§102)**. Trois demandes de Nico en un message. ① Les onglets du Cuvier
> suivent la vendange : **Maturités → Récoltes → Cuves** (clés, handlers et `_vendTab` inchangés).
> ⚠️ **L'onglet d'arrivée reste « Cuves » — question ouverte.** ② Le filtre millésime **existait**
> (le tableau de la Règle d'or n°3 le disait, et il avait raison) : ce qui manquait était sa
> **PORTÉE**. Écrit en tête de `renderCaveCuvees`, il **disparaissait de l'écran en restant posé**
> quand on passait au Journal. Il vit dans **`#mvc-milbar`** sous les onglets et vaut pour les
> trois vues ; le journal lit **`_rmMilCuvees`**, celle du registre imprimé, jamais une seconde
> définition. ⚠️ Une opération non rattachable sort du filtre **et est comptée à l'écran**.
> ③ **482 tailles de texte en dur, 37 valeurs** — la Cave n'était jamais passée à l'échelle du
> projet. **415 remplacements**, plancher de lisibilité à **9,5 px**, les 68 des documents
> imprimables restent en dur (§86). ⚠️⚠️ **La piste évidente était fausse** : les deux fautes de
> contraste à 1,12:1 trouvées sont sur des classes **mortes** — zéro faute sur le vivant.
> ⚠️⚠️⚠️ **Le ménage des 58 classes mortes a été ABANDONNÉ en cours de lot** : mon détecteur a pris
> `.join` et `.toFixed` pour des sélecteurs et supprimé 25 lignes de code — rattrapé par
> `node --check`, base restaurée, patchs rejoués. **APP 6.99 → 7.00 · SW 7.58 → 7.59**, base
> `a5c978c`. Détail en **§102**. **9 septembre 2026 (nuit, NAV-4/5)** — **LA SÉRIE NAV EST CLOSE (§101)** : roue crantée sur
> les **sept** modules (Phyto et Réserve : documents seulement ; le bouton d'export quitte le bas du registre phyto —
> ⚠️ l'audit NAV-0 le disait *dans la barre d'onglets*, c'était faux, il était sous la liste) ; « App » → « Moi », le
> catalogue des documents passe dans **Domaine › Données** ; les en-têtes disent « Cave » et « Réserve » ; « Le Millésime » ;
> « Paramétrage » n'apparaît plus. **APP 6.98 → 6.99 · SW 7.57 → 7.58**, s'empile sur §98–§100 (non commités). De **6
> endroits où l'on règle, 3 mots, 3 portes** à **1 règle, 1 mot, 1 porte**. Détail en **§101**.
>
> ★ Précédente : **9 septembre 2026 (nuit, NAV-3)** — ★★★ **LE PILOTAGE N'A PLUS DE BOUTON « OUTILS » (§100)** :
> Archives est le 8ᵉ onglet, après le filet ; le Paramétrage se rend dans la roue (`_pilParamRender` → `#pil-regl-host`,
> repeint par `_pilFillContent` quand la feuille est ouverte). ⚠️ La clé `'param'` est traitée **hors** de `_PIL_TAB_MIGR`
> (`_PIL_TAB_ROUE`) : C22 lit cette table comme la liste des clés mortes et rougissait sur le `'param'` homonyme du Cuvier. La
> carte « Économie & conformité » de Réglages › Domaine **disparaît** : conso GNR → roue du Tracteur, IFT → roue du Pilotage
> (mêmes écrivains `_ecoCfgSet`). Sept règles CSS `.pil-outils-*` retirées. **APP 6.97 → 6.98 · SW 7.56 → 7.57**, s'empile sur
> §98–§99 (non commités). Détail en **§100**.
>
> ★ Précédente : **9 septembre 2026 (nuit, NAV-2)** — **LE CADRE DU PLANNING EST DANS LA ROUE (§99)** :
> « Le cadre » quitte `#plan-tabs` ; `_planRenderCadre` / `_planRenderGridEditor` écrivent dans `#plan-cadre-host`
> (feuille `#ovReglPlanning`, repli `#plan-body`), `cadre`/`templates` migrent vers `mois`, `planSwitchTab('cadre')` ouvre
> la roue. Les cinq documents du Planning sont dans la roue ; ⚠️ quatre sont des **volets du hub** (`_docsEstVolet`,
> à côté de `docsGo`) — `_mvReglDocGo` ferme la roue, ouvre le hub, puis `docsGo(i)`. **APP 6.96 → 6.97 · SW 7.55 →
> 7.56**, s'empile sur §98 (non commité). Détail en **§99**.
>
> ★ Précédente : **9 septembre 2026 (nuit, NAV)** — ★★★ **NAV-1, LA ROUE CRANTÉE DES MODULES (§98)** :
> un module règle ses affaires **chez lui**. Réglages › Vigne et › Tracteur deviennent la roue crantée de
> leur en-tête (blocs **reparentés** dans `#ovReglVigne` / `#ovReglTracteur`, mêmes id, mêmes écrivains), avec
> les documents du module (`MV_DOCS` filtré, `docsGo(i)`). Réglages : **5 → 3 onglets**, bande de compteurs
> retirée. Le bouton 🏠 quitte les **10 en-têtes de module** — ⚠️ il portait le **voyant de synchro**, ré-ancré
> sur `.mod-header-top`. Titre « Vigne » sur les trois pages. **APP 6.95 → 6.96 · SW 7.54 → 7.55**, base
> `f79891c`. Audit NAV-0 mesuré (6 endroits où l'on règle, 3 mots, 3 portes) et plan NAV-2…6 en **§98**.
>
> ★ Précédente : **9 septembre 2026 (nuit, fin)** — **CAVE-5, LE MÉNAGE (§97)** : les trois blocs
> morts d'`index.html` (la Cave d'avant Le Chai, 52 lignes) retirés avec leurs seuls appelants et six règles
> CSS. **APP 6.94 → 6.95 · SW 7.53 → 7.54**, un item `WHATS_NEW` qui dit qu'il n'y a rien à voir. La série CAVE est close : de **3 modules,
> 13 écrans, 5 barres, 4 homonymes** à **8 écrans, 4 barres, 0 homonyme**. Détail en **§97**.
>
> ★ Précédente : **9 septembre 2026 (nuit)** — ★★★ **L'ONGLET PILOTAGE › CAVE EST RENTRÉ DANS
> LA CAVE (§96)**. **APP 6.93 → 6.94 · SW 7.52 → 7.53.** Lots **CAVE-3 et 4**, empilés sur §94 et §95 (non
> commités, les trois se livrent ensemble). Le bloc de 1 528 lignes est ramené dans `cave.js` ; ce qui
> doublait Aujourd'hui et La ligne de vie est **supprimé**, C15 en guide. Le millésime a **deux onglets**
> (La ligne de vie + tuiles + N-1 · Les courbes), le parc est **en tête de La Réserve › Fûts**, le Pilotage
> garde **une carte et un bouton** et migre `cav → auj`. ⚠️⚠️ Deux pièges de déménagement : un `typeof`
> sur un import qui change de sens en changeant de fichier (la pastille « i » n'aurait jamais rendu), et
> un **export pendant** qui aurait fait tomber la Cave entière au chargement — trouvé par balayage, qui
> a lui-même retiré quatre exports légitimes (`async function`) avant relecture au diff. Détail en **§96**.
>
> ★ Précédente : **9 septembre 2026 (soir)** — ★★★ **UN MOT, UN ÉCRAN : LES ONGLETS DU CUVIER,
> ET UNE SEULE PORTE POUR LES RÉGLAGES DE LA CAVE (§95)**. **APP 6.92 → 6.93 · SW 7.51 → 7.52.** Lot
> **CAVE-2**, empilé sur §94 (non commité). « Cuvier » dans « Le Cuvier » s'appelle **Cuves**, « Analyses »
> (maturités, à la vigne) s'appelle **Maturités** — clés inchangées, libellés seuls, ordre de la vendange.
> ★ **La roue crantée** de l'en-tête ouvre une section `reglages` **sans onglet** : réglages du Cuvier et
> du Chai (mêmes écrivains, autres hôtes), renvoi vers les appellations, documents de la cave lus dans
> `MV_DOCS` par `docsGo(i)` — **aucune copie**. Les anciennes clés `param`/`reglages` **atterrissent sur la
> roue**. ⚠️ Un bouchon de harnais mentait depuis un lot (`_vendTab='param'`) : un bouchon décrit l'état
> du module au jour où on l'écrit. Détail en **§95**.
>
> ★ Précédente : **9 septembre 2026** — ★★★ **LA CAVE S'OUVRE SUR AUJOURD'HUI, ET DEUX
> ÉCRANS DISAIENT LA MÊME CHOSE (§94)**. **APP 6.91 → 6.92 · SW 7.50 → 7.51.** Lot **CAVE-1**, premier
> de cinq, sur la maquette validée le 08/09 (*« c'est parfait »*). Nico : *« c'est un peu le bordel
> dans l'application entre les infos dans pilotage, les infos dans le cuvier, les infos un peu
> partout »*. Mesuré : **3 modules, 13 écrans, 5 barres**, « Le millésime » ×2, « Cuvier » dans
> « Le Cuvier », « Ce qui vient » et « Ce qui presse » sur le **même moteur**, `#cave-kpis` écrit à
> **trois** endroits avec trois sens. ★★★ **La cause** : la Cave rangée par contenant, le Pilotage
> rangé par question, sur les mêmes moteurs — chaque information a deux adresses.
> ★ Une quatrième section **Aujourd'hui**, écran d'arrivée : verdict (hiérarchie du Pilotage + « à
> mesurer »), quatre semaines en trois blocs, « Sans échéance » pour les fûts en fin de vie, chaque
> ligne un bouton. Soutirage, malo bloquée et SO₂ **portés** dans `cave.js` par-dessus `_mlAgenda`
> (inchangé). En-tête et bande écrits **une fois** par `renderCave`, les mêmes sur les quatre onglets.
> ⚠️⚠️ **Le lot a été construit en deux temps, et le second a relu le premier comme le code d'un
> autre** : quatre défauts trouvés (la vue du millésime visible sous Aujourd'hui, un verdict qui
> comptait des lignes, des fûts comptés autrement qu'au Chai, « à mesurer » plus strict que le
> Cuvier), et un harnais qui ne cherchait les pastilles « i » que là où elles avaient
> toujours été. ⚠️ Les copies `_pcavMalo` / `_pcavSoutirages` **restent au Pilotage jusqu'au
> lot ③**. Détail en **§94**.
>
> ★ Précédente : **7 septembre 2026 (nuit)** — ★★★ **LA SURFACE ACHETÉE ÉTAIT SAISIE,
> PERSONNE NE LA LISAIT (§93)**. **APP 6.90 → 6.91 · SW 7.49 → 7.50.** Quatrième version du
> rendement moyen. ⚠️⚠️ **`_vendSurfParc` déduisait DÉJÀ la part du domaine** — surface de la parcelle
> moins les surfaces achetées saisies (`src:'reste'`), en place depuis VD-3. *Trois corrections
> successives ont porté sur la formule sans jamais aller voir ce que la donnée savait déjà.*
> ★ **Avant de changer un calcul, chercher si l'information manquante est déjà quelque part.**
> ★★★ **Deux grandeurs distinctes désormais, et elles doivent le rester** : la ligne d'une parcelle =
> tout son raisin / toute sa surface, ce que l'arrêté plafonne ; la moyenne du domaine = ce qu'il
> rentre / ce qu'il récolte. L'invariant de §92 (« la moyenne est l'agrégat de la liste ») tombe
> **délibérément**. ⚠️ `reste-prorata` (plusieurs destinations sans surface saisie) suppose un
> rendement identique partout : le chiffre sort, marqué « ≈ », et l'écran **compte** les parcelles
> concernées. Détail en **§93**.
>
> ★ Précédente : **7 septembre 2026 (nuit)** — ★★★ **VENDRE SON RAISIN NE FAIT PAS BAISSER
> SON RENDEMENT (§92)**. **APP 6.89 → 6.90 · SW 7.48 → 7.49.** Nico, sur la correction de la veille :
> *« Mais pour le moment rien de décuvé, je ne comprends pas. »* Il avait raison — **§91b était faux
> à son tour**. Le rendement moyen a eu **trois formules** : `hlDecuve/ha` (0 hL/ha), puis
> `(hlDecuve+hlCuve)/ha` (13,7), enfin l'agrégat des mêmes parcelles que la liste (20,3). `hlCuve` ne
> compte que le raisin **logé au domaine** : les 9 370 kg vendus sur 29 t sortaient du numérateur
> **en gardant leur surface au dénominateur**.
> ★ **Et la leçon de méthode** : §91b a corrigé le symptôme visible en gardant la cause — une seconde
> formule pour une seule grandeur. Le chiffre est devenu *vraisemblable*, donc plus dur à contester.
> *Un chiffre faux qui devient plausible est plus dangereux qu'un chiffre faux qui saute aux yeux.*
> Le test : **ce total est-il l'agrégat de ce que l'écran affiche juste à côté ?** Détail en **§92**.
>
> ★ Précédente : **7 septembre 2026 (nuit)** — ★★★ **L'APPELLATION PORTE LE PLAFOND, ET
> « 0 hL/ha » N'ÉTAIT PAS UNE MESURE (§91)**. **APP 6.88 → 6.89 · SW 7.47 → 7.48.** Un arrêté ne vise
> pas une parcelle : `CONFIG.appellations`, déclarées dans Réglages › Domaine, plafond par millésime,
> `p.appellation` pour le rattachement. ⚠️ Ordre **parcelle > appellation > ancien scalaire** — une
> saisie faite à la main n'est jamais défaite par un réglage général.
> ★★★ **Et le rendement moyen affichait « 0 hL/ha »** sous un bandeau disant 162 hL en cuve : il ne
> divisait que le volume décuvé. *Un zéro se croit ; une absence de mesure se comprend.* ⚠️⚠️ Deux
> définitions coexistaient — le bilan de campagne estimait d'après les kilos (~18 hL/ha sur les mêmes
> données). `_mlRdtMoyen` est la seule désormais, et elle rend un statut. Détail en **§91**.
>
> ★ Précédente : **7 septembre 2026 (nuit)** — ★★★ **UN PLAFOND DE RENDEMENT APPARTIENT À
> UN MILLÉSIME (§90)**. **APP 6.87 → 6.88 · SW 7.46 → 7.47.** Lot **RDTMIL-1**, signalé par Nico :
> *« impossible de rentrer des plafonds de rendement pour les millésimes […] il n'y a juste pas
> l'option »*.
> ★★★ **DEUX ÉCRANS S'APPELLENT « LE MILLÉSIME »** — la section de la Cave, où l'on saisit, et
> l'onglet du Pilotage, qui lit. La carte renvoyait *« posez-le depuis Le millésime »* et Nico lisait
> cette phrase **depuis l'écran qui porte ce nom**. *Un chemin incomplet entre deux écrans homonymes
> ne renvoie nulle part : il fait croire à une option absente.* La carte porte désormais le geste.
> ★★★ **ET LE FOND ÉTAIT PIRE** : `p.rdt_max` était un **scalaire**. Le rendement annuel autorisé
> est fixé par arrêté, campagne par campagne — le poser en 2026 réécrivait 2025, en silence, sur un
> écran qui affichait pourtant une année. C'est **§81 vu depuis la vigne**. `p.rdt_max_hist` =
> `[{mil,max}]`. ⚠️⚠️ **AUCUN RATTRAPAGE** : l'ancien scalaire n'est pas recopié dans une campagne
> qu'on ne connaît pas, il devient le repli, **annoncé « hérité »**. *Un chiffre daté d'office se
> croirait.*
> ★ **La corvée est une cause, pas une conséquence** : 45 parcelles × un chiffre dicté par un seul
> arrêté explique à soi seul qu'aucun plafond n'ait jamais été renseigné. Après la première pose, on
> propose de la porter sur celles qui n'en ont **aucun** — nommées d'abord, jamais celles qui en ont
> un.
> ⚠️ **Deux garanties fausses trouvées dans le guide**, dont une l'était déjà avant ce lot : *« le
> Pilotage ne modifie jamais rien »* (`_pexSetMois` écrit depuis des semaines) et *« Le millésime ne
> demande aucune saisie »*. ★ **Nico est TOUJOURS en admin** — règle ajoutée (§90g). Détail en **§90**.
>
> ★ Précédente : **7 septembre 2026 (soir)** — ★★★ **UN COMPARATIF SE LIT EN JOURS, PAS EN
> DATES (§88)**. **APP 6.85 → 6.86 · SW 7.44 → 7.45.** Lot **CUVDOC-3**, demandé par Nico : voir
> *« celles qui partent plus vite, celles qui partent après. Pourquoi ? »*. Le cahier de cuverie
> s'ouvre sur un **comparatif de toutes les cuves**, superposées sur **leur propre jour
> d'encuvage** : sur un calendrier, une cuve entrée le 16 et une autre le 24 n'ont aucun point
> commun. ⚠️ **J0 = `date_entree`, jamais le premier relevé** — deux origines dans un même graphe,
> ce sont deux échelles qui se ressemblent. Une cuve sans date d'encuvage est **écartée**, et le
> document dit combien il en écarte.
> ★★★ **LE CLASSEMENT NE SE FAIT PAS SUR LA VITESSE**, et c'est l'aperçu qui l'a démenti : une cuve
> à deux relevés sortait en tête à 12,8 pts/j devant une cuve suivie dix jours. **Une pente sur
> trois jours n'est pas comparable à une pente sur dix** — le début d'une fermentation en est la
> phase la plus rapide. Le tri se fait sur le **jour où 996 a été RELEVÉ**, jamais interpolé, et la
> colonne pts/j **porte désormais son intervalle**. *Un rapport qui laisse tirer une conclusion
> fausse de ses propres chiffres est pire qu'un rapport qui se tait.*
> ★ Le **sucre relevé à la vigne** avant encuvage rejoint le sucre de départ de cuve — pondéré par
> la surface, borné des deux côtés. ★ Pas de légende : chaque courbe porte son nom au bout, **et
> les noms s'écartent** — deux cuves finissent à la même densité, c'est le cas le plus banal.
> ⚠️ Le comparatif n'existe QUE dans le document ; rien n'est redessiné (§86), le socle est partagé.
> Détail en **§88**.
>
> ★ Précédente : **7 septembre 2026 (suite)** — ★★ **LE PALIER S'EXPLIQUE AUSSI (§87)**.
> **APP 6.84 → 6.85 · SW 7.43 → 7.44.** Lot **CUVDOC-2**, demandé par Nico : *« si c'est possible de
> rajouter sur le graph le moment de changement d'état de la cuve »*. Le lot M3 avait daté les
> **opérations** sur la courbe : une **remontée** s'expliquait. Un **palier**, non — cinq jours à
> 12 °C en macération préfermentaire ressemblent à une fermentation qui traîne. C'est **§81 vu
> depuis le graphe**. Chaque passage de `statut_hist` pose un **trait vertical gris tireté**, nommé
> dans la marge haute, la seule bande qui ne croise rien.
> ★★ **Le changement vit dans `_vendFermSvg`** : l'écran du Cuvier ET le cahier de cuverie le
> reçoivent d'un seul geste — le bénéfice qu'on achète en refusant de redessiner (§86).
> ⚠️⚠️ **Aucun rattrapage inventé** : une cuve d'avant PARC-1 n'a aucun trait, rien n'est déduit de
> `date_entree`. Borné à la fenêtre du graphe, comme les opérations : `X()` colle une date hors
> champ au bord, et un passage collé au bord se lit comme un passage **au** bord.
> ★★★ **Une assertion neuve a rougi, et c'était ELLE qui avait tort** : j'attendais « un seul nom
> écrit », il y en avait deux, et c'était juste. *L'invariant n'est pas un COMPTE, c'est un ÉCART* —
> un test qui fige un nombre observé interdit au code d'avoir raison autrement. Détail en **§87**.
>
> ★ Précédente : **7 septembre 2026** — ★★★ **UN DOCUMENT NE CHARGE PAS LA FEUILLE DE
> STYLE (§86)**. **APP 6.83 → 6.84 · SW 7.42 → 7.43.** Lot **CUVDOC-1**, demandé par Nico : *« dans
> le rapport PDF du cuvier pour les contrôles de densité, j'aimerais que apparaissent aussi les
> graphiques, température, densité »*. Le cahier de cuverie sortait les relevés en **tableau seul**.
> ★★ **AUCUN TRACÉ NEUF** : la courbe du cahier **est** `_vendFermSvg`, celle de l'écran, appelée à
> **640 px** — la largeur utile d'un A4 portrait. *Redessiner la même cinétique pour le papier, ce
> serait deux vérités en puissance sur le même relevé.* Bénéfice inattendu du palier de
> recomposition : au-dessus de 560 px le tracé garde ses **deux axes chiffrés**, densité à gauche,
> degrés à droite — ce que l'écran d'un téléphone ne peut pas offrir.
> ⚠️⚠️⚠️ **LE PIÈGE : UN DOCUMENT S'OUVRE DANS SA FENÊTRE ET NE CHARGE PAS `styles.css`.** C'est la
> frontière de §59, prise par l'autre bout. `MV_GRAPH_COL` peint en `var(--terre)`,
> `var(--orange)`… **sans repli** : les quatre tracés seraient sortis **noirs les uns sur les
> autres**, et **rien ne l'aurait signalé** — le document s'imprime, il est juste illisible. Le CSS
> du cahier pose donc ses propres couleurs, en **valeurs de mode clair TOUJOURS** (une page
> s'imprime sur du papier blanc même quand l'écran est sombre), dont deux prises à **l'encre du
> document** et non à celle de l'écran. Contrastes **calculés** : 4,80 · 4,65 · 6,20 · 5,83.
> ★ **Sous trois densités, pas de courbe** : `_vendFermSvg` y rend l'**état vide de l'ÉCRAN**, qui
> propose un geste à faire. *Un geste ne se propose pas sur du papier.*
> ⚠️⚠️ **ET LE HARNAIS EXISTAIT, VERT, DANS AUCUN PIPELINE** — 46 assertions qui ne tournaient que
> si quelqu'un y pensait. *Un filet qu'on doit se rappeler de tendre n'est pas un filet* (§83, §78).
> Câblé dans `check` et `prebuild`, +14 assertions, +5 contre-épreuves. La plus utile ne teste
> aucune couleur : elle exige que **tout `var(--x)` d'un document soit déclaré par ce document**.
> ⚠️ **`.mv-base` du dépôt était resté sur `ab77457`** après l'intégration de §85 — la garde était
> désarmée. Remise à `494385f`. Détail en **§86**.
>
> ⚠️ **Cet en-tête a décroché du corps du document** : les lots **§82 à §85** (CUV-5, la garde de
> base, CUV-6, UI-Z) ne sont pas dans cette chaîne de « précédentes », alors qu'ils sont bien dans
> le document. Se fier aux sections, pas au résumé.
>
> ★ Précédente : **6 septembre 2026 (soir)** — ★★★ **UN STATUT N'EST PAS UNE DATE
> (§81)**. **APP 6.79 → 6.80 · SW 7.38 → 7.39.** Lot **PARC-1**, demandé par Nico : *« si je suis en
> préfermentaire à froid, à un moment elle va passer en fermentation alcoolique, mais il ne faut pas
> que ça me change le statut entier de la cuve depuis la date de création »*.
> ★★★ **`statut` EST UN SCALAIRE : il dit où en est la cuve, jamais depuis quand.** Rien n'écrivait
> la date d'un passage MPF → FA. Tout ce qui comptait des jours partait donc de `date_entree`, et
> une cuve avait l'air d'être dans son état courant **depuis l'encuvage**. *Un champ qui n'a qu'une
> valeur ne peut pas porter une histoire — il faut lui en donner une.*
> ★ **`statut_hist`** — `[{id,statut,date}]` — s'empile aux **trois** endroits où le statut bouge
> (fiche, décuvage, fusion), et se corrige **ligne à ligne**, même porte que les relevés de CUV-1.
> ⚠️⚠️ **AUCUN RATTRAPAGE INVENTÉ sur les cuves d'avant ce lot** : on ne connaît pas la date de leur
> état courant, et `date_entree` ne la donne pas. La frise écrit **« — »**. *Un tiret se corrige, une
> date fausse se croit.* La contre-épreuve n°10 vérifie précisément qu'on ne retombe pas sur
> `date_entree` en repli.
> ★★ **Un défaut de calcul en prime, jamais signalé** : `_mlProjFA` comptait son garde « démarrage
> < 3 j » depuis l'**encuvage**. Cinq jours de macération à froid passaient pour cinq jours de
> fermentation, et la **projection de fin s'ouvrait sur une cuve qui n'avait pas commencé**.
> `jCuve` garde son sens — l'agenda l'affiche sous le nom « en cuve depuis » — et un `jFA` neuf
> porte le nouveau. *Changer le sens d'une variable sans changer son nom déplace le défaut ailleurs.*
> ⚠️⚠️⚠️ **LE DÉPÔT AVAIT ÉTÉ RÉÉCRIT SOUS MES PIEDS, POUR LA SECONDE FOIS EN UNE JOURNÉE.** Mon
> clone était sur `8ce647b`, disparu du distant. La règle de §80f a servi le jour même où elle a été
> écrite : **`git fetch` avant le premier bump**. Les 18 ancres du patch tenaient toutes, mais **le
> contrat du module avait changé** — mes deux écrivains utilisaient `window.fbSave('cave_vendange')`
> nu, l'idiome d'avant VD-SAVE. *Une ancre qui tient ne prouve pas qu'un contrat tient.*
> ⚠️ **Et le harnais FUS-1 plantait** : `saveVendFusion` appelle désormais `_vendHistPose`, non
> extrait. **Un lot qui change une fonction doit rebrancher le harnais qui la joue.**
> ★ **Trois cliquets ont mordu**, tous les trois avec raison : C24b (un `s[0]` nu dans un slot
> `onclick`), la graisse `400` hors des trois pas, et **le compte d'emojis** (un `⚙` posé dans un
> texte de `WHATS_NEW` — la charte n'écrit pas d'emoji dans une phrase). Détail en **§81**.
>
> ★ Précédente : **6 septembre 2026** — ★★★ **LE HARNAIS A REFUSÉ DE ROUGIR, ET IL AVAIT
> RAISON (§80)**. **APP 6.78 → 6.79 · SW 7.37 → 7.38.** Lot **CUV-4** : Nico demande à voir, au
> Cuvier, *les parcelles qui n'ont pas eu de récoltes enregistrées*. L'écran Récoltes ne savait
> montrer que ce qui **est** rentré ; la question du matin, en pleine vendange, est l'inverse.
> ★★★ **DEUX DÉFAUTS TROUVÉS EN CHEMIN, DANS LA FONCTION QUI RÉPONDAIT DÉJÀ À CETTE QUESTION
> AILLEURS.** `_mlResteARentrer` (Le millésime) ne regardait **pas le statut** : une parcelle
> **ARRACHÉE** était annoncée « encore sur pied ». Et elle exigeait `surface > 0`, ce qui
> **effaçait sans un mot** une parcelle dont la surface n'est pas renseignée. *Une liste qui se
> trompe dans les deux sens à la fois ne se remarque jamais : ce qu'elle ajoute masque ce qu'elle
> retire.* Source unique désormais, lue par les deux écrans.
> ★★ **Et la comparaison portait sur le NOM BRUT.** Le champ parcelle d'une récolte redevient
> **libre** quand aucune parcelle n'est enregistrée : « les grandes vignes » ne rejoignait pas
> « Les Grandes Vignes », et l'écran envoyait quelqu'un vendanger une vigne déjà vide. Nom
> normalisé ; un nom **hors parcellaire** est désormais **annoncé** au lieu de fausser le compte.
> ⚠️⚠️⚠️ **LE POINT DUR EST AILLEURS : UNE CONTRE-ÉPREUVE EST RESTÉE VERTE, ET ELLE AVAIT RAISON.**
> Retirer la ligne qui range les parcelles mesurées avant les autres ne changeait **rien** à
> l'ordre obtenu — dans **aucun** décor, ni à 5 ni à 12 parcelles. Cause : `y.suc - x.suc` voyait un
> `null`, que JavaScript coerce en `0`, et le bon ordre sortait **par accident d'arithmétique**
> pendant que le couple symétrique, lui, répondait sur le **NOM**. ★★★ **Le comparateur se
> contredisait — et un comparateur incohérent n'a AUCUN résultat garanti par la norme : c'est le
> moteur qui décide, et l'équipe est sous JavaScriptCore.** Le rang est calculé **avant** toute
> soustraction (`_vendResteCmp`), et l'assertion porte désormais sur la **cohérence** du
> comparateur — antisymétrie et transitivité sur tous les couples — pas sur l'ordre obtenu.
> *Un ordre juste n'est pas une preuve de comparateur juste.*
> ⚠️⚠️ **ET C27 ÉTAIT AVEUGLE DEPUIS 6.77.** Sa regex n'admettait que des commentaires `//` entre le
> crochet de `WHATS_NEW` et le premier bloc ; le commentaire `/* … */` posé en tête en 6.77 l'a fait
> échouer, et le contrôle est retombé sur son **avertissement** « forme inattendue ». **Un bump sans
> bloc WHATS_NEW serait passé.** Regex élargie, illisibilité promue en **ERREUR** : *« je ne sais pas
> lire » ne doit jamais se lire « tout va bien ».*
> ⚠️ **CE LOT A ÉTÉ LIVRÉ DEUX FOIS** — la première en 6.78 / 7.34, numéros pris entre-temps.
> Voir **§80f**, sur ce qu'un clone du matin ne dit pas.
> ★ **Ce que ce lot NE FAIT PAS, délibérément :** l'onglet Récoltes n'est toujours **pas borné à une
> campagne** — détail en **§80e**. Détail complet en **§80**.
>
> ★ Précédente : **25 août 2026 (soir)** — ★★★ **UN INCIDENT RÉSEAU N'EST PAS UNE
> PANNE (§68)**. **APP 6.68 → 6.69 · SW 7.23 → 7.24.** Signalé par Nico depuis la cave, capture à
> l'appui : **« Promesse rejetée : Firebase: Error (auth/network-request-failed) »** en travers de
> l'écran pendant la saisie d'une analyse avec PDF, sur 4G.
> ★★★ **LE MESSAGE ÉTAIT FAUX SUR LE FOND, ET RIEN N'AVAIT ÉTÉ PERDU.** La 4G a lâché pendant que
> le SDK rafraîchissait le jeton ; `fbSave` a fait **exactement son travail** — 3 tentatives, mise
> en file locale, envoi programmé au retour du réseau — **puis a relancé l'erreur** (`throw e`).
> ⚠️⚠️⚠️ **Et ses 71 sites d'appel l'invoquent TOUS sans `await` et sans `catch`** :
> `if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);`. Le rejet remontait donc au
> gestionnaire global `unhandledrejection`, qui repeignait l'écran d'un code d'erreur **anglais**
> sur une écriture qui n'avait rien perdu. *Un logiciel de registre qui annonce une panne sur une
> écriture réussie apprend à son utilisateur à ne plus le croire.*
> ★★ **Contrat changé : `fbSave` NE REJETTE PLUS JAMAIS, elle rend un état** — `{ok:true}` ·
> `{ok:false,queued:true}` · `{denied:true}` · `{blocked:true}`. **Un seul appelant lisait son
> retour** (`_doFbSave`, dans `saveData`) : il lit désormais l'état, sinon un `.then()` nu afficherait
> **« Enregistré ✓ » en vert sur une écriture partie en file** — le faux positif exact que le
> `throw` servait à éviter. *Supprimer un `throw` déplace une responsabilité, il faut la reposer
> quelque part.*
> ★★ **Deux mensonges de plus, trouvés en chemin.** Le badge annonçait **« Hors ligne »** à
> quelqu'un qui voyait ses **quatre barres** (`_showOfflineQueueBadge` ne consultait jamais
> `navigator.onLine`) ; et le niveau `warning` sortait un toast **« fbSave échoué (3 tentatives):
> cave_elevage »** — du jargon de développeur en travers de l'écran d'un chef de cave. Passé en
> `info` : trace au journal, écran silencieux, **c'est le badge qui parle, en français**.
> ★ **Le guide disait « Pas de réseau : les saisies sont en file »** — devenu faux, puisqu'une
> saisie part aussi en file **avec** du réseau. Corrigé dans `01-demarrer` et `14-depannage` (§27a
> appliquée dans le même lot, pas après).
> ⚠️⚠️ **ET LE HARNAIS NEUF S'EST TROMPÉ DÈS SA PREMIÈRE EXÉCUTION — cinquième occurrence du
> piège §53.** `mv-harnais-reseau.mjs` cherchait `network-request-failed` dans la zone du
> gestionnaire… et le trouvait **dans le commentaire que je venais d'écrire juste au-dessus du
> code**. La contre-épreuve restait **verte sur un fichier saboté** : elle ne prouvait rien.
> Corrigé par un blanchiment des commentaires avant lecture. *Un contrôle qui lit du code ne doit
> jamais lire la prose qui l'accompagne, sinon il valide le commentaire au lieu de l'instruction.*
> **C'est le harnais qui a trouvé sa propre faiblesse — parce qu'il portait sa contre-épreuve.**
> Détail en **§68**.
>
> ★ Précédente : **25 août 2026** — ★★★ **DOUZE PIXELS DE TROP, ET TOUT L'ÉCRAN
> DÉCROCHE (§67)**. **APP 6.67 → 6.68 · SW 7.22 → 7.23.** Deux retours de Nico dans la même
> phrase : « l'écran d'accueil est mal calibré » et « beaucoup de noir écrit sur du sombre dans
> les 3 rectangles en haut de chaque module ».
> ★★★ **LE CHIFFRE DES TROIS CASES ÉTAIT PEINT AVEC UNE COULEUR DE FOND.** `.mvu-kpi-v` portait
> `color:var(--cave)`. **`--cave` est le brun-noir des FONDS, pas une encre.** En mode clair il
> vaut `#14110D`, indiscernable à l'œil de `--texte` `#1A1A14` : *personne ne pouvait voir le
> défaut*. En mode sombre il s'assombrit encore (`#100D0A`) pendant que la carte s'éclaircit
> (`#1C1A16`) — **mesuré 1,12:1**, invisible, sur **sept écrans**. Le libellé juste en dessous
> sortait à 7,82:1, d'où l'effet « une case à moitié vide ». **C'est §21c à l'identique, sur un
> autre composant : le mode clair camoufle toujours ce détournement.**
> ★★ Trois autres du même bloc, non signalées : l'**onglet actif de second niveau** (Chai,
> Millésime, Documents) — 1,12:1 aussi ; et **deux fautes SYMÉTRIQUES**, illisibles en mode
> *clair* cette fois (alerte « sem. > max » du Planning à 1,46:1, case « en cours » du Chai à
> 2,23:1). *Chercher un défaut de contraste dans UN seul thème n'en trouve que la moitié.*
> ⚠️⚠️⚠️ **ET LE CADRAGE : `overflow-x:hidden` BLOQUE LE DÉFILEMENT MAIS N'EMPÊCHE PAS
> L'AGRANDISSEMENT DU VIEWPORT.** Reproduit en machine : **un** élément qui dépasse de **12 px**
> à droite de l'accueil, et le viewport de mise en page grandit **dans les deux sens** —
> `scrollWidth` 360 → **373**, et `#mv-dock` (`position:fixed;bottom:0`) se recale dessus et
> descend de 800 à **827 px**, soit **27 px sous le bord de l'écran**. Les libellés des modules
> sont coupés, la page devient baladable dans les quatre sens. **Un défaut, cinq symptômes** —
> exactement ce que Nico appelait « écran pas fixe ».
> ★★★ **LA RÈGLE QUI DEVAIT PROTÉGER ÉTAIT DÉJÀ LÀ, ET NE PROTÉGEAIT PAS.** `body{overflow-x:hidden}`
> existe depuis toujours. C'est pour ça qu'aucune lecture du CSS ne pouvait trouver : on voit la
> garde, on la coche, on passe. **Correctif : `overflow-x:clip` sur `html` ET `body`** — `clip`
> coupe réellement et, à la différence de `hidden`, **ne crée aucun conteneur de défilement**,
> donc le `sticky` de `.mod-header` et le `fixed` du dock survivent. `hidden` reste en repli.
> ⚠️⚠️ **CE QUI RESTE OUVERT : l'élément qui déborde n'est PAS identifié.** Le HTML statique de
> l'accueil ne dépasse à **aucune** des quatre largeurs testées (360/390/412/430), overflow
> neutralisé. La sonde passée par Nico en console rend `[]` — **mais elle ne prouve rien** : elle
> ne regardait que le **côté droit**, que `#page-home`, **après** le correctif, et très
> probablement en largeur **bureau** (≥768 px, où le layout n'est pas celui du téléphone).
> **La garde neutralise l'effet, pas la cause.** Voir la sonde complète en **§67c**.
> ⚠️ **Et mon harnais de contraste s'est trompé DEUX fois dans la même session** : 71 « défauts »
> dont **42 sur des éléments non rendus** (`getComputedStyle` d'un enfant d'un parent
> `display:none` rend sa propre valeur, pas `none`), puis deux ratios faux parce qu'il **ne
> rechargeait pas la page entre les deux thèmes**. Les chiffres retenus viennent de la lecture
> directe des couleurs calculées. *Troisième session de suite où une assertion ment.*
> Détail en **§67**.
>
> ★ Précédente : **23 août 2026** — ★★★ **LA FEUILLE D'HEURES DISAIT +8H30 LÀ OÙ ELLE
> DEVAIT DIRE −9H (§55)**. **APP 6.46 → 6.47 · SW 7.01 → 7.02** — le lot a commencé à « aucun
> bump » et a fini dans `utils.js` : voir **§55o**, le défaut le plus grave des trois.
> ★★★ **UNE RÉFÉRENCE CALCULÉE SUR LE RÉSULTAT NE MESURE PLUS RIEN** : `_planRempH` définissait la
> référence d'un jour de remplacement par les heures **FAITES**, ce qui force l'écart à zéro
> *dans les deux sens* — arriver à 10 h ne devait rien, faire douze heures ne créditait rien.
> ⚠️⚠️⚠️ **Mais la cause racine n'était pas dans le calcul : `_planApplyAbs` DÉTRUISAIT LA PREUVE.**
> Il reconstruit l'entrée à neuf et n'en gardait que l'horaire, seulement pour le retard : poser une
> absence sur un jour d'échange effaçait le drapeau ET l'horaire, c'est-à-dire la seule trace de ce
> qui était attendu. **L'absence devenait gratuite, et aucun calcul ne peut la rattraper après
> coup** — les 19 et 20 août de Victor **doivent être reposés à la main** (55c, 55l).
> ★★ Et la référence descendait **SOUS ZÉRO** : 0 h 30 retirées d'un jour qui n'y avait rien mis.
> **Un seul jour fabriquait +8 h 30 à partir de rien.**
> ★ **Avant de corriger, tout a été refait** : plafond annuel retrouvé au centième (1607 × 587/1589),
> référence 69 h reconstituée exactement. **Huit chiffres sur neuf étaient justes** — sans ce calcul,
> j'aurais « corrigé » un prorata parfaitement bon.
> ★★ **Trois rouges au harnais du retard, et j'avais tort deux fois sur trois** ; le troisième
> (**J14**) était une **assertion qui gravait le défaut**, verte depuis le 20/08. *Une assertion
> verte n'est pas une preuve de justesse, c'est une preuve de stabilité.*
> ⚠️⚠️ **Et une contre-épreuve est restée verte** — le harnais du relevé écrivait les entrées à la
> main et ne traversait jamais la fonction qu'il prétendait couvrir. **Troisième lot de suite.**
> ★ Polices : **Outfit ne monte qu'à 700**, huit `font-weight:800` étaient des faux gras ·
> `about:blank` empêchait `/fonts` de se résoudre **sous iOS seulement** · `@page{margin:10mm}`
> laissait le navigateur imprimer **« about:blank 1/2 » en pied d'un document de paie**.
> ⚠️⚠️⚠️ **ET J'AI CORRIGÉ LE TROU EN EN CREUSANT UN AUTRE (§55p).** En portant la dette dans
> « heures dues », j'ai laissé l'écart s'afficher sur la référence **NETTE** — celle dont on
> venait justement de retirer les absences. La feuille sortait **« écart = »** sur un mois où il
> manquait 8 h 30, trois lignes au-dessus d'un « heures dues −8h30 ». *Le document se contredisait
> lui-même.* Il y a désormais **deux références** : la **brute** (ce que le planning demandait)
> qu'on AFFICHE, la **nette** qui ne sert qu'au compteur. Et **« 6 jours prévus »** en face de
> 85 h 30 — les 5 jours d'échange n'étaient pas comptés.
> ★★ **Trois allers-retours sur le même écran pour un lot que j'avais déclaré vert à chaque fois.**
> La règle qui en sort : **produire l'artefact et le LIRE** avant de livrer — pas raisonner dessus.
> ★★★ **ET IL RESTAIT UN TROU, TROUVÉ PAR NICO SUR LA FEUILLE CORRIGÉE (§55m)** : la feuille
> montrait les 30 min de retard en « heures dues » et **pas les 8 h de l'absence injustifiée**.
> ⚠️⚠️⚠️ **Elles n'étaient nulle part.** Hors de la fenêtre `hsup_dues_debut`, elles ne passaient
> que par l'écart du mois — et **`_planSupMonth` vaut `Math.max(0, ecart)`, donc tout écart
> négatif est écrasé à zéro.** Elles n'alimentaient ni « reste à prendre », ni le compteur, ni
> aucun cumul : **le mois suivant, plus aucune trace.** Huit heures affichées en gros dans une
> tuile, et qui ne coûtaient rien. ★★ **Et l'écran qui pose le motif promet l'inverse** —
> `sub: 'Heures dues · journée non payée'`. *Le moteur ne tenait pas la promesse de son
> interface* : c'est §53 en plus discret. L'injustifiée sort de la fenêtre, comme le retard.
> ⚠️ **C3/C4 du harnais du retard gardaient ce trou sous le nom « non-régression »** — deuxième
> assertion du lot qui gravait un défaut au lieu de le tenir.
> ★★★ **ET LE HARNAIS, UNE FOIS RÉPARÉ, A TROUVÉ UN DÉFAUT DE PRODUCTION QUE JE NE POUVAIS PAS
> VOIR (§55o).** `_mvJourApres` (`utils.js`) lisait `'…T00:00:00'` en **heure LOCALE** puis
> resérialisait en **UTC** : à Paris, minuit local vaut 22 h ou 23 h **la veille** en UTC, donc
> **+24 h retombait sur le MÊME JOUR**. `_mvContrats` **ne fusionnait plus jamais deux contrats
> contigus** (fin 30/06 → début 01/07), et le relevé d'heures perdait alors son contexte de
> contrat — `_planCtrDuMois` exige UNE période — et **mélangeait les compteurs des deux contrats**.
> ⚠️⚠️⚠️ **Actif chez TOUS les clients, TOUTE l'année.** Le bac à sable de Claude tourne en **UTC** :
> *le seul fuseau au monde où ce code était juste.* Deuxième défaut de suite que seule la machine
> de Nico révèle, après Windows.
> ★★ **Filet neuf : `mv-harnais-fuseau.mjs`** rejoue les fonctions de dates sous **cinq fuseaux**
> et exige un résultat **identique**. La règle est générale : *une fonction de dates dont le
> résultat bouge avec le fuseau mélange deux horloges.* Ajouté à `check` et `prebuild`.
> ★ `mv-harnais-releve.mjs` **ne tournait dans aucune chaîne depuis le 13/08** — ajouté à `check`.
> ⚠️⚠️⚠️ **ET IL A PLANTÉ CHEZ NICO AU PREMIER LANCEMENT, EN BLOQUANT LE DÉPLOIEMENT (§55n).**
> `await import(CIBLE)` : sous Windows `path.resolve()` rend « C:\… » et Node lit « c: » comme un
> **schéma d'URL** — `ERR_UNSUPPORTED_ESM_URL_SCHEME`, mort avant la première assertion. Et comme
> je venais de l'ajouter à **`prebuild`**, `npm run build` ne passait plus. **Troisième occurrence
> du même piège Windows** (§53 : `new URL().pathname`). *Le bac à sable est Linux, la machine de
> Nico est Windows — aucun essai de mon côté ne peut l'attraper.*
> ★★ **Une leçon qui se répète a besoin d'une règle : C26** interdit `import()` d'un chemin brut
> dans `scripts/`. Elle a trouvé **deux autres harnais** avec le même défaut, dormants.
> ⚠️ **Et sa première version se déclenchait sur ses propres commentaires** — quatrième fois qu'un
> contrôle lit les mots que je viens d'écrire (§53). Commentaires blanchis avant lecture.
> Détail en **§55**.
>
> ★ Précédente : **22 août 2026** — ★★★ **LE CLIQUET XSS, ET UN INTERRUPTEUR DÉJÀ
> BASCULÉ (§54)**. Lot **SEC-7**, **APP 6.45 · SW 7.00, aucun bump**. Le lot demandait de
> basculer App Check en enforce : ★★★ **c'était déjà fait — Firestore 100 % de requêtes validées,
> 0 % non validées — et Cloud Functions n'a PAS de bascule dans cette console**, l'exigence se
> déclare fonction par fonction dans le code (`enforceAppCheck: true`, **27 sur 27**). *Une
> consigne qui dit « toggle ON » pour une surface sans toggle est pire qu'une consigne absente.*
> **Quatrième fois qu'une entrée de backlog décrit du travail déjà fait.**
> ★★★ **Et la règle C24, telle qu'écrite, aurait couvert 7 % du risque** : sur 461 puits HTML,
> **32 seulement** reçoivent un gabarit à substitution, et **huit modules sur douze n'utilisent
> aucun `${…}`**. Ancrer le contrôle sur `.innerHTML =` n'aurait jamais regardé `cave.js` ni
> `pilotage.js` — **en se lisant comme un succès**. L'ancre est devenue le **fragment HTML**.
> ★★★ **Le vrai défaut trouvé : `_escHtml` dans un slot `onclick` n'est pas insuffisant, il est
> DÉFAIT** — l'attribut décode `&#39;` *avant* que le JS ne soit compilé. **23 emplacements,
> tous corrigés** ; le plus exposé posait un **nom de parcelle**, saisi par n'importe quel compte
> du domaine. ⚠️ **Et deux de mes contre-épreuves étaient encore fausses**, deux lots de suite.
> ★ Trois contrôles neufs : **C24** (cliquet XSS, 3 volets), **C25** (App Check sur les fonctions
> appelables, zéro toléré), **`harnais-escattr.mjs`** qui *rejoue le décodage du navigateur* au
> lieu de compter. Détail en **§54**.
>
> ★ Précédente : **20 août 2026** — ★★★ **L'IMPORT KML EFFAÇAIT LE PARCELLAIRE (§53)**.
> **APP 6.36 · SW 6.90, aucun bump** (`admin-gt.js` seul). le contact technique envoie un KML d'**une**
> parcelle ; l'onglet aurait écrit ce fichier tel quel et **fait disparaître les autres de la
> carte** — sans avertissement, sans retour possible. ★★★ **Le défaut n'était pas dans le code,
> il était dans l'écran** : un bouton qui remplace là où l'opérateur croit ajouter. L'écran lit
> désormais la base AVANT d'écrire et sépare deux gestes qui n'ont rien à voir.
> ⚠️ **Et deux de mes cinq premières contre-épreuves étaient fausses** — elles cherchaient un
> motif de texte que la même phrase, écrite ailleurs dans le fichier, satisfaisait déjà.
> ⚠️⚠️⚠️ **Le harnais livré vert a planté chez Nico au premier lancement** : `new URL(…).pathname`
> rend `/C:/Users/…` sous Windows, que Node repart en `C:\C:\Users\…`. **Le bac à sable est
> Linux, la machine de Nico est Windows** — aucun de mes essais ne pouvait l'attraper. ★★★ **Et
> la même faute d'assertion s'est reproduite une TROISIÈME fois dans l'heure** : l'`assert` du
> script de correction cherchait `.pathname` dans le fichier et tombait sur le mot écrit dans
> **le commentaire que je venais d'ajouter**.
>
> ★ Précédente : **17 août 2026 (nuit)** — ★★★ **TROIS PANNES CAUSÉES PAR MA PROPRE
> ASSERTION (§51)**. **APP 6.31 · SW 6.85.** « Aucun symbole sans emploi » m'a fait supprimer
> quatre symboles vivants. ★★★ **Un contrôle dont l'action corrective est « supprimer » doit
> être tenu pour suspect.** Passé en avertissement.
>
> ★ Précédente : **17 août 2026 (nuit)** — ★★★ **LE COMPTEUR MENTAIT (§50)**.
> **APP 6.30 · SW 6.84.** Un émoji écrit `\\uD83D\\uDD17` est invisible à un compteur qui lit
> le texte du fichier. ★★★ **Le compte réel n'est pas 169 mais 1358** — tous les chiffres
> annoncés pour DS-1/DS-2/DS-3 sont faux. Le compteur décode désormais avant de compter.
>
> ★ Précédente : **17 août 2026 (soir)** — ★★★ **PILOTAGE NE RÉPONDAIT PLUS (§49)**.
> **APP 6.29 · SW 6.83.** `_opEmo is not defined` en production. ★★★ **Nouveau contrôle C23** :
> tout `_xxx()` appelé doit être déclaré, importé ou exposé — la règle que ni `node --check`
> ni ESLint ne fait, et qui aurait attrapé les deux incidents de la journée.
>
> ★ Précédente : **17 août 2026** — ★★★ **CE QUE LA CI A TROUVÉ (§48)**.
> **APP 6.28 · SW 6.82.** Un seul rouge e2e — `icone inconnue : equipe` — et il en cachait
> trois. ★★★ **Le vrai défaut était dans le harnais : un `continue` qui rendait une
> assertion INCAPABLE d'échouer.** Corrigé, il a trouvé un second symbole manquant que la
> CI n'avait pas atteint (`soleil` — le beau temps rendait un carré pointillé).
>
> ★ Consolidation précédente : **16 août 2026 (soir)** — ★★★ **LA CHARTE D'ÎLOTS, LOT DS-2**
> (**§46**). **APP 6.27 · SW 6.81.** ★★★ **DS-1 A CHANGÉ LES PICTOGRAMMES ET ÇA N'A PAS SUFFI.**
> Quatre jeux d'icônes livrés, trois refusés, et le verdict restait le même. Ce qui faisait
> brouillon n'était pas l'icône, **c'était le CONTENANT** : des blocs empilés séparés par des
> filets, où tout a la même importance visuelle. Quatre briques dans `styles.css` — l'îlot,
> la hiérarchie à **trois** niveaux, le badge, le bouton fantôme. Appliquées à **l'accueil**
> et aux **parcelles** (carte de liste + fiche). ⚠️ **Réglages n'y est PAS encore passé.**
> Détail en **§46**.
>
> ★ Consolidation précédente : **16 août 2026 (après-midi)** — ★★★ **LE JEU D'ICÔNES, LOT DS-1**
> (**§45**, section neuve). **APP 6.26 · SW 6.80.** Parti d'une phrase de Nico : *« je veux que
> l'app fasse le plus professionnel possible »*. **920 pictogrammes** rendus dans l'application
> (et non 1 033 : l'écart tenait au **sélecteur de variante** `U+FE0F`, compté à part par l'outil
> de Nico — `⚠️` est **un** glyphe à l'écran, pas deux). `reglages.js`, module témoin,
> passe de **243 à 0**. ★★★ **TROIS PUITS NE PEUVENT PAS RECEVOIR DE SVG, ET C'EST STRUCTUREL** —
> un `textContent`, un **document imprimé** (qui n'a pas le sprite), une balise **`<option>`**.
> La bonne réponse n'était pas « une icône partout », c'était **trois réponses différentes**.
> Détail et preuves en **§45**.
>
> ★ Consolidation précédente : **16 août 2026 (matin)** — ⚠️⚠️⚠️ **AUDIT DE DÉRIVE DU DOCUMENT (§44)**.
> Le backlog s'ouvrait sur *« 0a. DÉPLOYER — APP 6.06 · SW 6.56, jamais mis en ligne »* alors que le
> dépôt portait **dix-neuf versions APP et vingt-trois versions SW de plus**. **Onze entrées
> décrivaient du travail déjà fait** ; **quatre chiffres avaient grossi** sans que personne le voie ;
> et **neuf harnais sur vingt-six ne peuvent pas démarrer**, dont **six qui portent un chemin de bac
> à sable en dur** — ils se lisent comme des succès. **Détail et preuves en §44.**
> ★★★ **La leçon, et c'est la troisième fois** : *un backlog non re-mesuré dérive DANS LES DEUX
> SENS.* Il fait travailler dans le vide sur ce qui est fait, et il tait ce qui a empiré.
>
> ★ Consolidation précédente : **15 août 2026** — ★★★ **LE CHANTIER ERGONOMIE DU PILOTAGE, DIX LOTS
> EN UNE JOURNÉE** (**§42**, section neuve). Parti de trois phrases de Nico : *« j'ai l'impression
> que ce n'est pas rangé, c'est fouillis, on dépense du temps et de l'énergie à chercher une info ·
> certains textes ne sont peut-être pas utiles à être affichés tout le temps (infobulles ?) ·
> améliore l'ergonomie et l'expérience utilisateur fois 100 »*.
> ★★★ **LA RÈGLE DES TROIS FAMILLES**, écrite dans `utils.js` et appliquée aux huit onglets : ce qui
> **CADRE** un chiffre reste à l'écran en une ligne · ce qui **EXPLIQUE le calcul** passe derrière une
> pastille « i » · ce qui **DIT QUOI FAIRE** devient un bouton. ⚠️ **Ce n'est PAS « cacher le
> texte »** : la moitié de ces phrases est la seule trace écrite d'une convention du domaine, et un
> chiffre sans son cadre ment. **Rien n'a été supprimé — 34 fiches conservent l'intégralité.**
> ★★ **Trois primitives neuves** : `MV_INFO` + `_mvInfoOpen` (la pastille), `_mvInfoSet` (les fiches
> **vivantes**, dont le contenu se calcule mais dont la clé reste déclarée), `_pecFiabCard` (une
> carte, deux écrans). ★ **`_pilTile` et `_pcavCard`** prennent une clé de fiche en dernier argument
> **optionnel** : les 43 appels existants restent valides.
> ★★★ **CE QUE LES CONTRÔLES AUTOMATIQUES NE VOIENT PAS.** Trois défauts de mise en page trouvés
> **uniquement en regardant une capture** : un `<b>` qui devient son propre item flex et coupe une
> phrase en trois · un CSS extrait par expression régulière et rendu mutilé · une carte à
> `width:100%` qui mange la frise. **Aucun preflight ne lit une mise en page.**
> ⚠️⚠️ **ET LA LEÇON LA PLUS COÛTEUSE EST DANS LES HARNAIS, PAS DANS LE CODE.** Sur dix lots,
> **zéro bug livré** — mais **une quinzaine d'assertions fausses**, toutes de la même famille : elles
> cherchaient « au moins une fois » là où il fallait **compter**, une phrase là où il fallait
> **mesurer**, un préfixe qui se laissait satisfaire par un nom plus long. Détail en §42f.
> ★ **Le chantier a aussi mesuré ce qu'il déplaçait, écran par écran, EN L'EXÉCUTANT** : un comptage
> sur le fichier ne distingue pas « à l'écran » de « dans une fiche ». Voir §42g.
> Consolidation précédente : **14 août 2026 (nuit)** — ★★★ **L'ESCALIER DE CADENCE, ET LE FICHIER
> QUI NE TROUVE PAS SA PLACE** (**§41**, section neuve). **APP 6.14 · SW 6.67.** Parti d'un seul mot,
> *« suite »*, sur le backlog technique. **Quatre entrées rayees** (3, 7, 9, 0e) — et **cinq autres
> trouvées déjà mortes** à l'audit préalable (2, 5, 8, 15, 41). C'est le **troisième** audit du même
> genre à trouver des fantômes : un backlog non ré-audité fait travailler dans le vide.
> ★★ **La marche 2 de l'escalier de cadence est enfin câblée** : sous le seuil d'avancement, l'écran
> reprend la **même période de la campagne précédente**. `hBar` vient du snapshot, `hReel` se
> **recalcule** — et **quatre** points d'affichage annoncent la source, parce qu'un chiffre d'histoire
> présenté comme une mesure du moment est exactement la faute de §34.
> ⚠⚠⚠ **Mais la leçon du jour n'est pas dans le code, qui était juste du premier coup.** Elle est
> dans la livraison : j'ai livré `public/guide.html` — **un fichier qu'un script fabrique** — à côté
> de sa source, sous un nom renommé qui n'existe pas dans le dépôt. **Deux allers-retours de CI**,
> le décalage changeant de sens sans disparaître. **On livre l'entrée, on nomme la commande.**
> ★★★ **RÈGLE D'OR N°5 CRÉÉE — ÉCRIRE À NICO EN LANGAGE SIMPLE**, demandée explicitement par lui à
> la fin de cette session. Le vocabulaire se simplifie ; le raisonnement, jamais.
> Mises à jour : règle d'or n°1 et n°4, §27d, §28.
> Consolidation précédente du même jour : **§39 clôturé, APP 6.13 · SW 6.63.** Nico a
> **supprimé la fiche `Pilotage`**, ce qui lève le seul blocage de §39g : la ligne
> `if(!P.length) return true;` est posée. ★ **Sa raison est une orientation produit à retenir** :
> *« je veux compter aussi les ETP bureaux pour pouvoir budgéter au plus près de la réalité »* —
> **prochaine mise à jour**, entrée **0a-ter**. ⚠️ **Et l'audit de ce lot a trouvé mieux** : la
> **masse salariale exclut déjà les bureaux alors que son propre commentaire dit l'inverse**
> (§39i). Un commentaire qui décrit l'intention pendant que la ligne fait le contraire.
> Consolidation précédente du même jour : ★★★ **LE CACHE QUI GÈLE UNE COURBE**
> (**§39**, section neuve). Parti de six mots sur une capture de la frise annuelle : *« pourquoi
> que 3 permanents ? c'est faux par rapport à ce qui est inscrit dans réglage »*. La capture,
> calibrée au pixel, donne **3,005 constant sur 1 309 colonnes** — aucune marche. Les mêmes
> fonctions rejouées sur les mêmes données rendent **4 → 3,857 → 3**. ⚠️⚠️ **Le calcul était juste
> depuis le début** : la clé du memo `_PIL_ANN` était faite de **longueurs** (`MEMBRES.length`,
> `PARCELLES.length`, `TACHES.length`), et aucune longueur ne bouge quand on saisit une date de
> contrat. **Un cache dont la clé ne dérive pas de ses entrées n'est pas un cache, c'est un gel.**
> `pilotage.js` seul, **aucun bump**. Reste ouvert : une ligne d'`utils.js` bloquée non par un doute
> technique mais par **une donnée** — le compte de service `Pilotage`.
> Consolidation précédente du même jour : ★★★ **LES DOCUMENTS, ET UN ÉCRASEMENT** (**§38**,
> section neuve, avec **§37** qui rattrape le chantier CONTRATS resté non consigné). Quatre lots
> livrés sur les documents imprimés : les deux du Cuvier rendus **atteignables** (ils existaient dans
> le code déployé sans qu'aucun bouton n'y mène), l'**état du vignoble**, le **relevé individuel**
> porté au hub avec ses contrats et ses congés, le **carnet d'entretien** ramené à la charte.
> ⚠️⚠️⚠️ **Mais la leçon du jour n'est pas là.** Ces quatre lots ont été écrits sur un clone daté
> de **07:33** et livrés en **fichiers complets** jusqu'à 20:31, pendant que Nico poussait **six
> commits**. L'intégration a **écrasé son chantier** : 331 lignes dans `reglages.js`, 216 dans
> `utils.js`, 171 dans `planning.js`. C'est **son propre contrôle C23, écrit le jour même**, qui a
> sonné l'alarme en CI. Réparé par `git revert`, puis les quatre lots **rejoués** sur la base à jour.
> **APP 6.12 · SW 6.62.** Mises à jour de la règle d'or n°1, §25, §27d, §28.
> Consolidation précédente : **12 août 2026 (nuit)** — ★★★ **LE SALAIRE EST UNE SÉRIE DATÉE**
> (**§36**, section neuve). Parti d'une phrase de Nico : *« il ne faut pas qu'un salaire changé
> aujourd'hui change la mémoire d'un salaire qu'il a eu hier »*. Le diagnostic mesuré sur le code a
> trouvé mieux qu'un manque : **un piège déjà armé**. `taux_hist` existait, était écrit à chaque
> changement, **et n'était lu par AUCUN calcul** — une phrase sous le champ, rien de plus. Les trois
> moteurs de coût lisaient un scalaire **sans date** : augmenter quelqu'un revalorisait tout
> l'historique, jusqu'à un **exercice comptable déjà clos**. Modèle livré : `taux_serie[nom]`,
> **migration à zéro écriture**, **trois gestes** dont un seul fabrique une période.
> **APP 6.06 · SW 6.56.** Mises à jour de §10-11, §28, §30i.
> Consolidation précédente du même jour : ★★★ **LE CHANTIER PILOTAGE** (**§34**, section
> neuve). Parti d'un *« on améliore fois 100 pilotage, pour le moment ça ne convient pas »* et
> d'une capture d'écran. Diagnostic chiffré sur le code réel : **12 moteurs de graphe**,
> **4 palettes** concurrentes, **5 sélecteurs** qui s'ignoraient, **29 impasses** sans lien, et
> **3 endroits** répondant à « combien d'ETP ? ». Cause racine : **les onglets étaient un axe de
> SUJETS alors qu'il fallait un axe de ZOOM.** Maquette cliquable validée, puis **six lots**.
> Le sixième est une **correction de fond sur retour de Nico** : l'écran déclarait l'exercice
> comptable « mal aligné » et poussait à le déplacer — il confondait **une donnée** avec **un
> réglage**. **APP 6.01 · SW 6.51.** Mises à jour de §19, §20b, §25, §27a, §28.
> Consolidation précédente du même jour : ★★★ **LES ETP, L'ANNÉE ET LES CONTRATS** (**§33**,
> section neuve). Parti d'une capture d'écran et d'un « beaucoup de faute ! », l'audit a trouvé
> **quatre bugs d'une même famille** — un indicateur divisé par un dénominateur qui n'est pas le
> sien — dont un qui faisait **dire deux choses contraires au même écran**. Trois lots livrés :
> le pic rebasé sur la semaine + la frise annuelle zoomable, l'**historique des contrats** (une
> perte de données qui était **en cours**), et l'**année calée sur l'exercice comptable** avec
> diagnostic d'alignement de la vendange. **APP 5.99 · SW 6.49.** Mises à jour de §19, §20b, §28.
> ⚠️ **Le diagnostic d'alignement de §33 a été REPRIS le soir même** — sa formulation était
> prescriptive et fausse dans son principe. Voir §34, lot 6.
> Consolidation précédente : **11 août 2026 (nuit)** — ★★★ **L'AUDIT DU BACKLOG, point par point,
> sur le dépôt cloné** (commit `636630a`, **APP 5.96 · SW 6.46**). Les 42 entrées techniques ont été
> re-vérifiées une par une par `grep` sur le code réel : **six rayées**, **cinq chiffres corrigés**,
> **trois qui avaient empiré pendant qu'elles dormaient au backlog**. Détail dans le §28.
> Consolidation précédente du même jour (soir) : la **refonte du Planning** en deux lots (**§19a**,
> section neuve), plus les mises à jour de §12, §19, §25, §27a, §28 et de la règle d'or n°1.
> ★ **Consolidation faite depuis le fichier réel du dépôt, pas de mémoire** : `CLAUDE.md` est
> désormais à la racine de `mavigne-dev`, donc lisible par `git clone` en tête de session. **La
> piste ouverte le 10 août est refermée — l'exception « régénération sans upload » ne concerne plus
> ce document, qui se patche comme n'importe quel fichier du dépôt.**
> Consolidations précédentes : **9 août nuit** (assistant d'installation, cinq lots plus une
> procédure imprimable, après l'écart de cadence le matin et l'accompagnement du client
> l'après-midi) · 9 août soir · 7 août soir (série MILLÉSIME) · 7 août matin
> (série Cave) · 5 août (mvprint retrouvé) · 4 août soir (barème) · 1er août (UX-1) ·
> 31 juillet (identité légale).
> ★ **Note ajoutée le 10 août** (règle d'or n°1 et §29) : une régénération de ce document faite
> de mémoire, sans l'avoir sous les yeux, s'est révélée **en retard d'un chantier entier**.
> La procédure de régénération est désormais écrite noir sur blanc.
> ★★★ **Note ajoutée le 10 août (fin de journée) — ACCÈS DIRECT AU DÉPÔT GITHUB.** Le code
> source vit désormais dans un dépôt **public**, `github.com/4ss4ss1/mavigne-dev`, cloné par
> Claude en tête de session. **Ceci remplace, pour la LECTURE, le workflow d'upload décrit en
> Règle d'or n°1** — Claude n'attend plus un upload pour lire un fichier de l'app. **La LIVRAISON
> ne change pas** : fichiers complets via `present_files`, réintégrés à la main par Nico dans
> `mavigne-dev\`, committés et poussés via **GitHub Desktop**. Détail complet : Règle d'or n°1 et
> « 🖥️ Environnement de Nico › Git ».
>
> ⚠️ **Points en suspens au moment de la consolidation** :
> 1. ✅ **TOUT EST DÉPLOYÉ** — les cinq lots d'installation (§18b), les deux lots Tracteur et la
>    refonte du Planning sont en ligne. Ce qui était marqué « NON DÉPLOYÉ »
>    dans ce document ne l'est plus : les mentions ont été corrigées au §28.
>    ⚠️ **APP 6.01 · SW 6.51 sont LIVRÉS mais PAS ENCORE DÉPLOYÉS** — les trois lots ETP/contrats
>    du matin (§33) **et** les six lots du chantier Pilotage (§34) sont dans le même paquet.
>    ✅ Le CDD perdu de Victor a été **réintroduit par Nico** le 12/08 (2026-03-02 → 2026-07-24).
>    ⚠️⚠️ **Les numéros de ce paragraphe ont été périmés deux fois de suite.** Ne jamais les lire
>    comme un fait : `APP_VERSION` dans `utils.js` et l'en-tête de `sw.js` sont les seules sources.
> 2. ⚠️ **Une installation à blanc** sur un slug jetable reste à faire — **c'est le seul critique
>    encore ouvert.** Elle valide les cinq lots d'un coup et mesure les temps réels (§18b, §28).
> 3. **le prospect Gironde : le devis reste à établir** — c'est le sujet commercial n°1 (§28), et il
>    force à **borner l'offre de lancement** d'abord.
> 4. ✅ **Le plafond ESLint est à 0 avec 0 erreur** — re-vérifié le 12/08 sur les six fichiers du
>    jour. L'entrée « passer le plafond à 0 » est close depuis le 11/08 ; ne pas la rouvrir.
> 5. ✅ **Le chantier CONTRATS (v6.58 → v6.61) et les DOCUMENTS (v6.62) sont désormais consignés**,
>    §37 et §38. Le §37 est une **synthèse établie depuis les changelogs de `sw.js`**, pas depuis une
>    session de travail : le détail fait foi dans `sw.js`, à compléter par Nico si un point manque.
>    ⚠️ **C'est l'absence de ce §37 qui a rendu l'écrasement possible** — un chantier non consigné est
>    un chantier qu'une session suivante ne sait pas qu'elle doit préserver.
> 5b. ⚠️ **Des lots plus anciens restent non documentés ici**, connus par le seul changelog de `sw.js` :
>    « panneau GUERETTECH : 8 onglets deviennent 6 », « SEC-GT/2 », la **tournée sur l'écran de
>    l'équipe », l'**exercice comptable**, les **4 défauts de la snapshot localStorage**, le **Chai
>    qui s'ouvrait vide**, le **soutirage à source unique**, le **Cuvier repeint**, le **hub
>    Documents** et la **charte `MV_DOC`**. **À consigner par Nico.**
> 6. ⚠️ **`rewrites` est absent du `firebase.json` lu** alors qu'`essai.html` poste vers
>    `/api/lead` — à vérifier en ligne (§18b).

---

## Historique descendu du §28 de `CLAUDE.md` (04/10/2026, PRIO-1 — plafond de lignes du cœur)

### ★★★ La journée du 9 août — trois chantiers

**A. LE MATIN — L'ÉCART DE CADENCE D'ÉCONOMIE ÉTAIT FAUX D'UN FACTEUR 5** (§20b)
`pilotage.js` seul, **aucun bump**, 28 assertions, preflight vert.
⚠️ **Livré sans `WHATS_NEW`** alors que le client voyait le changement → **annoncé au bump suivant**.

**B. L'APRÈS-MIDI — LE CHANTIER ACCOMPAGNEMENT, EN QUATRE LOTS** (§27)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **a** | preflight **C22** + correctif du bug `ecf` de la visite guidée | `preflight.mjs` + `app.js` (+ `sw.js`) | **SW seul**, `WHATS_NEW = []` |
| **b** | les **10 fiches `MV_AIDE` refaites** + le point d'aide dynamique | `utils.js` + `pilotage.js` + `index.html` + `sw.js` | **APP + SW** |
| **c** | widget **« Mise en route »** sur l'accueil admin | `app.js` + `index.html` + `utils.js` + `sw.js` | **APP + SW** |
| **d** | **guide découpé + générateur** puis corrections factuelles | `guide/` + `scripts/build-guide.mjs` + `public/guide.html` | **aucun** |

★ Le `WHATS_NEW` du lot **b** annonce **aussi** le correctif de cadence du matin.
✅ **Rayés** : « guide.html dit Côte de Nuits » · **MT-A**.

**C. LE SOIR — LA RÉDUCTION DU TEMPS D'INSTALLATION, EN CINQ LOTS** (§18b)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **1** | parcelles : noms alignés + commune par ligne | `admin-gt.js` | **aucun** |
| **2** | comptes de l'équipe en lot + **correctif du tenant** | `admin-gt.js` + `firebase.js` | **aucun** |
| **3** | périodes recopiées d'un domaine installé | `admin-gt.js` | **aucun** |
| **4** | `submitMiseEnRoute` + le formulaire qui envoie + la reprise dans l'assistant | `functions/leads.js` + `public/mise-en-route.html` + `admin-gt.js` | **aucun** |
| **5** | machines collées en liste + volume de fût | `admin-gt.js` | **aucun** |

**Plus** la procédure `INSTALLER-UN-DOMAINE.md` et son PDF (§18c).
**20 h → ~9 h sur le papier**, dont 14 h de clavier ramenées à ~4 h.
✅ **DÉPLOYÉ.** ⚠️ **Mais le gain reste théorique : l'installation à blanc n'a pas été faite.**
Les cinq lots sont en ligne, **aucun n'a encore servi de bout en bout**. Le « ~9 h » est un chiffre
de papier tant qu'un slug jetable n'a pas été monté en entier (§18b, backlog technique n°1).
✅ **Rayé** : CF `submitMiseEnRoute`.

---

## Historique descendu du §28 de CLAUDE.md (05/10/2026, MOTIFS-1 — plafond du cœur)

> Archive, comme le reste de ce fichier : les versions et états « à faire » cités ici étaient vrais le jour où ils ont été écrits.

### ★★★ La journée du 11 août (suite) — la refonte du Planning, deux lots

**Point de départ** : *« je trouve que planning est mal conçu, il y en a un peu partout, il faut
parfois cliquer sur un membre parfois non. »* Diagnostic chiffré, puis maquette validée sur **une
seule question posée à Nico** — le geste le plus fréquent porte-t-il sur une case ou sur plusieurs ?
Réponse : « le geste = ta reco », donc **le tap coche**.

**Lot 1 — le geste unique.** Le mode « Sélection multiple » supprimé, trois cochages ajoutés
(colonne, ligne, vue), barre de sélection contextuelle, **trois feuilles fusionnées en une**, trois
moteurs d'écriture sans DOM. **Un bug réel** : récup et chaleur en lot écrasaient les congés en
silence. **Harnais 12/12 + contre-épreuve.**

**Lot 2 — trois onglets** (`mois` / `gens` / `cadre`) avec table de migration, fin du doublon
grille+synthèses, suppression du menu « Outils » et de la feuille « Anciens salariés », **et un
défaut de modèle** : deux réglages du domaine logés dans la fiche d'un salarié. **C22 fait dans le
lot** — 8 renvois périmés, `MV_AIDE`, `reglages.js`, guide régénéré.

**Détail complet : §19a.** Fichiers : `index.html` · `planning.js` · `styles.css` · `utils.js` ·
`reglages.js` · `sw.js` · `guide/10-planning.html` + `public/guide.html`. **Bump APP + SW aux deux
lots.** ✅ **DÉPLOYÉ** (SW v6.45 et v6.46 lus dans le changelog du dépôt).

⚠️ **`test:smoke` et `test:e2e` n'avaient PAS été passés au moment de la livraison** : Playwright ne
peut pas télécharger Chromium dans le bac à sable. Preflight, les deux cliquets, `node --check`,
build Rollup et le harnais des moteurs étaient verts. **C'est la première fois qu'un lot est parti
avec les deux paliers navigateur non joués côté Claude — Nico les a passés de son côté avant de
déployer.**

### ★★★ La journée du 11 août — audit intégral, puis deux lots Tracteur

**Versions au moment de ces deux lots : APP `5.93` · SW `6.43`.** ⚠️ **Trois versions ont suivi le
même jour** — v6.44 (l'accompagnement rattrape les deux lots), v6.45 et v6.46 (Planning, lots 1 et
2). **État réel du dépôt au commit `636630a` : APP `5.96` · SW `6.46`.**
(À relire dans les fichiers, jamais depuis ici.)

**A. L'AUDIT INTÉGRAL DE L'APP** — preflight vert, 55 376 lignes, 10 analyses statiques.
Ce qui est **sain, vérifié** : handlers inline (20 types d'événements, 0 non exposé) · un seul
`console.log` non gardé et c'est l'émulateur · **contraste 5,56 → 16,73:1, AA passé partout** ·
7 « à venir » tous légitimes · `.pc-validate` à **60×60 px** · verrou Planning propre · 0 TODO.

Ce qui ne l'est pas :

| Constat | Chiffre |
|---|---|
| ★★★ **Tailles de police sous 12 px** | **1 625** — 1 204 en ligne + 421 CSS, soit **la moitié** de l'app, uniformément répartie. Le dock est à **9,5 px**, les doses phyto à **9 px**. « Plein soleil » ne change **que le contraste**. |
| ★★ **Trou responsive 761–767 px** | `max-width:760px` vs `min-width:768px` : le corps reste à 430 px pendant que `.pil-hero` garde sa grille 2 colonnes |
| ★★ **Quatre rendus de date concurrents** | 8 fonctions, dont **2 paires strictement identiques** (`_rmDate`/`_bcDate` dans le même fichier ; `_pOrdDateFr`/`_opDateFr` à l'octet près) |
| ★★ **Aucun formateur de nombre central** | ~330 `toFixed` + 46 `toLocaleString`, `utils.js` n'en expose aucun |
| ★ **Bloc de ré-export de 209 lignes** (`app.js`) | **111 lignes strictement inutiles** (le module expose déjà) + **5 noms morts** de l'ancien catalogue « Mes produits » |
| ★ **Trois conventions d'exposition `window`** | dont la boucle `for..in` de `phyto.js`, **invisible au preflight** — le fichier le reconnaît lui-même en commentaire |
| **333 `onclick` sur `<div>`** | pour 44 `aria-label` — non focusables clavier |

**B. LE CHRONO TRACTEUR INVERSÉ** — v5.92, §31. `tracteur.js` + `index.html` + `styles.css` +
`utils.js` + `sw.js`, **bump APP + SW**. Plus le branchement du **cliquet de vocabulaire**
(`package.json` + `ci.yml`) : il était écrit le matin même et **aucun appelant ne l'exécutait**.
C14 `tracteur.js` **5 → 4**, baseline regravée.

**C. LE MODE DU JOUR** — v5.93, §32. `app.js` + `index.html` + `styles.css` + `utils.js` + `sw.js`,
**bump APP + SW**. Deux `catch{}` vides refusés par C14 puis remplis avec `logError`.

⚠️⚠️⚠️ **DETTE CONTRACTÉE LE JOUR MÊME : les fiches `MV_AIDE` du Tracteur n'ont été mises à jour
pour AUCUN des deux lots.** Les deux écrans les plus utilisés du module ont changé de gestes et leur
aide décrit les anciens. **C'est la violation exacte de la Règle d'or n°4, écrite le même jour.**
→ **Premier point du backlog, avant tout nouveau lot.**

⚠️ **Ni `npm run build`, ni le smoke, ni l'e2e n'avaient été lancés côté Claude** sur ces deux lots
(pas de navigateur dans le bac à sable). ✅ **Ils sont déployés** — SW v6.42 et v6.43 sont dans le
changelog du dépôt, et l'accompagnement les a rattrapés en v6.44.


> Dernière consolidation : **8 octobre 2026 (PIL-1)** — ★ **LES SEPT ONGLETS DU PILOTAGE À LA CHARTE** (§298). Lot 29, **zip cumulatif DS-4 …
> PIL-1 (§270 à §298), base `b80419d`, non poussés**. La revue de COUL-1 l'avait montré : seul « Aujourd'hui » (`.ck2`) était à la charte.
> Habit seulement, recalé par `#page-pilotage` sur les composants `pil-` (portée et exercice, « à compléter », tuiles `pil-tile` / `pil-photo`,
> titres sans capitales, chiffres en Outfit, segmentés `pil-seg` / `pil-anseg`, badges, jauge en `--ok`, puces et carte de Décider, protection,
> archives) ; aucune règle ne vise `.ck2` (le harnais le vérifie). Harnais neuf `mv-harnais-pil1` (8 + 6). **APP 8.69 → 8.70, SW 9.47 → 9.48.**

> Dernière consolidation : **8 octobre 2026 (COUL-1)** — ★ **DES COULEURS PLUS FRANCHES, UN FOND UN PEU PLUS SOUTENU** (§297). Lot 28,
> **zip cumulatif DS-4 … COUL-1 (§270 à §297), base `b80419d`, non poussés**. Nico : couleurs trop délavées, cartes pas assez détachées du fond
> crème — « un petit peu plus, pas beaucoup ». Jetons seulement : fonds pâles un cran plus soutenus (clair .11 / .15 / .15 / .13, sombre .15 /
> .17), teintes un peu plus franches (toujours ≥ 4,5 sur blanc), fond `#F0EEE9` (et le cockpit, qui recopiait le sien). ⚠️ Mesuré avant de
> livrer : foncer `--gris-clair` (pour marquer les filets) faisait passer 36 paires « texte doux sur gris-clair » sous 4,5, et éclaircir la
> carte sombre 2 paires phyto — les deux sont rendus ; `--ligne` reste branché sur `--gris-clair` (invariant DS-4). Harnais neuf
> `mv-harnais-coul1` (7 + 5). **APP 8.68 → 8.69, SW 9.46 → 9.47.** ⚠️ Revue des onglets du Pilotage : seul « Aujourd'hui » est à la charte —
> les sept autres (L'année, La campagne, L'équipe & le matériel, Décider, Économie, Conformité, Archives) gardent l'ancien dessin : lot à venir.

> Dernière consolidation : **8 octobre 2026 (RG-2)** — ★★★ **FIN DE LA REFONTE UI : RÉGLAGES › ÉQUIPE ET MOI** (§296). Lot 27, **zip
> cumulatif DS-4 … RG-2 (§270 à §296), base `b80419d`, jamais poussés** — Nico les poussera d'un coup sur son mode de test avant le
> déploiement général. Tous les écrans ont pris la charte v2 (maquettes v1 à v10, hors dépôt), habit d'abord, liste + fiche là où un geste
> ouvre une fiche à lire (Parcelles, Planning › Les gens, Sessions, Registre, Catalogue, Chai), jamais là où il ouvre un outil qui fige
> (feuille de session, cuve) ou un formulaire (lot de fûts). RG-2 : membres en lignes dans une carte, rôles au kit (admin à l'accent),
> alertes de contrat vides cachées, zone dangereuse en rouge, « Moi » par deux au large. Harnais neuf `mv-harnais-rg2` (7 + 7).
> **APP 8.67 → 8.68, SW 9.45 → 9.46.** Précédent : RG-1 (§295). Chantier à prévoir : découper `styles.css` (cliquet regravé quatre fois).

> Dernière consolidation : **8 octobre 2026 (RG-1)** — ★ **RÉGLAGES › DOMAINE À LA CHARTE (MAQUETTE V10)** (§295). Lot 26, **zip cumulatif
> avec DS-4 … RSV-3 (§270 à §294) non poussés**. La v10 (hors dépôt) dessine les Réglages depuis l'écran réel ; Nico : « go ». RÈGLE : habit
> seulement — aucun réglage, aucun enregistrement, aucun droit ne bouge. Carte d'identité claire, sections en cartes (`.set-sec > .set-title +
> div`), titres en casse normale, lignes à filet, frise et boutons au kit ; au large, grille sur `#regl-view-domaine:not([style*="none"])` +
> `!important` (`switchReglTab` écrit `display:block` en ligne), « Mon domaine » et « Données » côte à côte. Harnais neuf `mv-harnais-rg1`
> (7 + 7). Base `b80419d`. **APP 8.66 → 8.67, SW 9.44 → 9.45.** Précédent : RSV-3 (§294). Reste RG-2 (Équipe et Moi) : fin de la refonte.

> Dernière consolidation : **8 octobre 2026 (RSV-3)** — ★ **LE BILAN MATIÈRE À LA CHARTE : LA RÉSERVE DE LA V9 EST FINIE** (§294). Lot 25,
> **zip cumulatif avec DS-4 … RSV-2 (§270 à §293) non poussés**. Habit seulement : les règles du bilan vivent dans `styles.css` (bloc ancien
> l. ~4068) ; le bloc RSV-3 les recale par `#page-reserve` — en-tête clair (fin du noir cave), titre en Outfit, tableau du kit en chiffres
> tabulaires, étiquettes au rayon du kit, note du contrôle bio sur fond doux. ⚠️ Le stock négatif passe par `td.mvr-neg` : `.mvr-neg` seul
> perdait contre la couleur des cellules (vu sur capture). Harnais neuf `mv-harnais-rsv3` (6 + 6). Base `b80419d`. **APP 8.65 → 8.66, SW
> 9.43 → 9.44.** Précédent : RSV-2 (§293). Restent les Réglages, maquette d'abord.

> Dernière consolidation : **8 octobre 2026 (RSV-2)** — ★ **LA RÉSERVE › INTRANTS À LA CHARTE (MAQUETTE V9)** (§293). Lot 24, **zip
> cumulatif avec DS-4 … RSV-1 (§270 à §292) non poussés**. Habit seulement : un intrant n'ouvre rien (sa carte porte stock, ouverture,
> achats, consommé, mouvements) — pas de liste + fiche. Cartes neutres, nom et stock en Outfit ; la couleur du stock est écrite EN LIGNE
> (`stCol` : terre ou rouge) : elle est lue par sélecteur d'attribut (`[style*="terre"]` → texte, `[style*="rouge"]` → danger), pas écrasée
> à l'aveugle. Alerte de stock négatif en rouge pâle ; au large, cartes par deux (`.mvr-body:has(> .mvr-pcard)`). Harnais neuf
> `mv-harnais-rsv2` (6 + 6). Base `b80419d`. **APP 8.64 → 8.65, SW 9.42 → 9.43.** Précédent : RSV-1 (§292).

> Dernière consolidation : **8 octobre 2026 (RSV-1)** — ★ **LA RÉSERVE › FÛTS À LA CHARTE (MAQUETTE V9)** (§292). Lot 23, **zip cumulatif
> avec DS-4 … CAVE-4 (§270 à §291) non poussés**. La v9 (hors dépôt) dessine la Réserve depuis l'écran réel (Fûts, Intrants, Bilan matière) ;
> Nico : « go ». RSV-1 = habit : feuille injectée (`_rsvInjectCss`, `mvr-`) et cartes venues du Pilotage (`pcav-`) recalées par
> `#page-reserve` ; parc sur fond clair, bande en trois cases, boutons et filtre au kit, fournisseurs et lots neutres ; au large, fin des
> 760 px (`.mvr-body`) et lots par deux. Un lot s'ouvre toujours dans son FORMULAIRE (`_rsvOpenFut`, admin) : pas de liste + fiche.
> Harnais neuf `mv-harnais-rsv1` (7 + 6). Base `b80419d`. **APP 8.63 → 8.64, SW 9.41 → 9.42.** Précédent : CAVE-4 (§291).

> Dernière consolidation : **8 octobre 2026 (CAVE-4)** — ★ **LE MILLÉSIME À LA CHARTE : LA CAVE DE LA V8 EST FINIE** (§291). Lot 22,
> **zip cumulatif avec DS-4 … CAVE-3 (§270 à §290) non poussés**. Habit seulement : les feuilles injectées du Millésime (`_mlInjectCss` :
> `mlx-` ; `_pcavInjectCss` : `pcav-`) recalées par `#page-cave` — millésime choisi à l'accent (plus de noir et or), tuiles et verdict au fond
> clair avec chiffres en Outfit, étiquettes en casse normale, cartes neutres, dépassement de rendement en rouge pâle, points et jauges par
> les états. Harnais neuf `mv-harnais-cave4` (7 + 6). Base `b80419d`. **APP 8.62 → 8.63, SW 9.40 → 9.41.** Précédent : CAVE-3 (§290).
> Restent la Réserve et les Réglages, maquette d'abord.

> Dernière consolidation : **8 octobre 2026 (CAVE-3)** — ★★ **LE CHAI EN LISTE + FICHE (MAQUETTE V8)** (§290). Lot 21, **zip cumulatif
> avec DS-4 … CAVE-2 (§270 à §289) non poussés**. La fiche d'une cuvée est une fiche d'information à boutons (pas un outil qui fige quelque
> chose en se fermant) : elle passe à droite. `openCuveeDetail(cuvId, dans)` écrit dans `#chai-fiche` avec un conteneur ; au large, liste
> affichée, TOUT appel y va — y compris le rafraîchissement après une opération (lignes 3299 / 3312). `_chaiSel` / `_chaiFicheSync` comme au
> Catalogue. ⚠️ `switchCaveOng` écrit `display:block` en ligne sur la vue : la grille passe par `:not([style*="none"])` + `!important`.
> Harnais neuf `mv-harnais-cave3` (8 + 7). Base `b80419d`. **APP 8.61 → 8.62, SW 9.39 → 9.40.** Précédent : CAVE-2 (§289).

> Dernière consolidation : **8 octobre 2026 (CAVE-2)** — ★ **LE CUVIER À LA CHARTE (MAQUETTE V8)** (§289). Lot 20, **zip cumulatif avec
> DS-4 … CAVE-1 (§270 à §288) non poussés**. Habit seulement : la feuille du Cuvier (classes `mvv-`, injectée) recalée par `#page-cave` —
> cuves en lignes neutres (ouverte cerclée à l'accent), nom en Outfit, tri et filtres au kit (le filtre actif à l'accent, plus de terre),
> alerte « à mesurer » en ambre, « Nouvelle cuve » à l'accent, « Fusionner » en secondaire ; au large, cuves par deux, la cuve ouverte sur
> toute la largeur. ⚠️ Pas de liste + fiche : la cuve s'ouvre EN PLACE, son détail est l'outil de travail (relevés, cinétique, décuvage).
> Harnais neuf `mv-harnais-cave2` (7 + 7). Base `b80419d`. **APP 8.60 → 8.61, SW 9.38 → 9.39.** Précédent : CAVE-1 (§288).

> Dernière consolidation : **8 octobre 2026 (CAVE-1)** — ★ **LA CAVE › AUJOURD'HUI ET SA BANDE (MAQUETTE V8)** (§288). Lot 19,
> **zip cumulatif avec DS-4 … PHYTO-3 (§270 à §287) non poussés**. La v8 (hors dépôt) dessine la Cave depuis l'écran réel (Aujourd'hui,
> Cuvier, Chai, Millésime) ; Nico : « go », même règle que le Phyto (ce que l'appli tient déjà). CAVE-1 = habit : la vue injecte ses feuilles
> (`_aujInjectCss`, `_mlInjectCss`), recalées par `#page-cave` ; bande en quatre cases, « Ce qui presse » en carte (phrase en Outfit, gravité
> en filet et couleur), semaines en cartes ; au large, verdict à gauche sur plusieurs rangées, semaines à droite. Harnais neuf
> `mv-harnais-cave1` (7 + 7). Base `b80419d`. **APP 8.59 → 8.60, SW 9.37 → 9.38.** Précédent : PHYTO-3 (§287). Suivent CAVE-2 à CAVE-4.

> Dernière consolidation : **8 octobre 2026 (PHYTO-3)** — ★ **LA FERTILISATION À LA CHARTE : LE PHYTO DE LA V7 EST FINI** (§287).
> Lot 18, **zip cumulatif avec DS-4 … PHYTO-2 (§270 à §286) non poussés**. L'onglet injecte sa propre feuille (`_ferCss`, classes `fer-*`) :
> le bloc PHYTO-3 la recale sur les jetons par une spécificité plus forte (`:is(#page-phyto,#ovFerti,#ovFerParc)`), sans toucher au calcul
> ni au cahier. Cartes par deux au large, la liste « ce qu'un contrôle va demander » sur toute la largeur (`:has(.fer-cf)`), « Imprimer le
> cahier » à l'accent. `#ph-new-btn` passe par `_phytoFab` : « Saisir un amendement » sur la Fertilisation (admin seul). Harnais neuf
> `mv-harnais-phyto3` (8 + 7). Base `b80419d`. **APP 8.58 → 8.59, SW 9.36 → 9.37.** Précédent : PHYTO-2 (§286).

> Dernière consolidation : **8 octobre 2026 (PHYTO-2)** — ★ **LE CATALOGUE E-PHY EN LISTE + FICHE (MAQUETTE V7)** (§286). Lot 17,
> **zip cumulatif avec DS-4 … PHYTO-1 (§270 à §285) non poussés**. La fiche EST le détail de l'appli : `openEphyDetail(amm, dans)` écrit
> dans `#cat-fiche` quand on lui donne un conteneur, sans ouvrir de fenêtre (statut, délai de rentrée, substance, mentions, usages vigne,
> « donnée indicative ») ; sans conteneur, la fenêtre comme avant. Sur ordinateur, `_catSel` choisit ; `_catFicheSync` suit la liste
> filtrée (garde de type). Recherche, filtres et lignes au kit. Harnais neuf `mv-harnais-phyto2` (9 + 7). Base `b80419d`.
> **APP 8.57 → 8.58, SW 9.35 → 9.36.** Précédent : PHYTO-1 (§285). Reste PHYTO-3 (fertilisation).

> Dernière consolidation : **8 octobre 2026 (PHYTO-1)** — ★★ **LE REGISTRE PHYTO EN LISTE + FICHE (MAQUETTE V7)** (§285). Lot 16,
> **zip cumulatif avec DS-4 … TRAC-3 (§270 à §284) non poussés**. Nico valide la v7 avec une règle : « ce que la loi oblige, comme de base
> dans l'appli » — la fiche (`_phFicheHtml`) ne montre que les mentions déjà tenues (produit, AMM, type, date, dose, parcelles, opérateur,
> réentrée et avant-récolte avec leur fin, ZNT, substance, cible), tait un champ absent, et ouvre le détail existant (`openTraitDetail`).
> Bouton « Saisir un traitement » (droit : admin ou tractoriste). ⚠️ Corrigé au passage : le bouton « Démarrer une session » de TRAC-3 était
> forcé visible au large (`display:inline-flex!important`), même sans le droit. Harnais neuf `mv-harnais-phyto1` (12 + 8). Base `b80419d`.
> **APP 8.56 → 8.57, SW 9.34 → 9.35.** Précédent : TRAC-3 (§284). Restent PHYTO-2 (catalogue) et PHYTO-3 (fertilisation).

> Dernière consolidation : **8 octobre 2026 (TRAC-3)** — ★★ **LE TRACTEUR FINI : HEURES ET GNR, « DÉMARRER », FENÊTRES** (§284). Lot 15,
> **zip cumulatif avec DS-4 … TRAC-2 (§270 à §283) non poussés**. Nico : « finis le Tracteur avant de passer à la suite ». `_trMinutes(s)` :
> le chrono quand il a mesuré la parcelle (`_chrMes` lit `mes` / `dmin` sur `parcellesFaites`, donc synchronisé avec la session), sinon le
> barème (`_sessBaremeMin`) ; GNR = heures × `CONFIG.eco.conso_gnr_lh`, 6 L/h par défaut — la valeur du Pilotage (`_ecoCfg`). Fiche,
> 4ᵉ chiffre de la bande (heures de la saison), bouton « Démarrer une session » sur ordinateur (le flottant se cache), fenêtres du Tracteur au kit.
> Harnais neuf `mv-harnais-trac3` (9 + 8) ; TRAC-1 reçoit les vraies fonctions. Base `b80419d`. **APP 8.55 → 8.56, SW 9.33 → 9.34.**

> Dernière consolidation : **8 octobre 2026 (TRAC-2)** — ★ **L'ENTRETIEN DU TRACTEUR SUR DEUX COLONNES (MAQUETTE V6)** (§283). Lot 14,
> **zip cumulatif avec DS-4 … TRAC-1 (§270 à §282) non poussés**. `_trEntDock()` (appelée à la fin de `renderEntretiens` : changer de machine
> ne repasse pas par `renderTracteur` — vu sur capture, la colonne de gauche restait vide) RANGE le filtre des machines et la carte de la cuve
> dans `#ent-gauche` sur ordinateur et les rend au téléphone. Cartes et boutons à la charte. ⚠️ Les « fiches d'entretien » de l'appli sont des
> CONTRÔLES (plein, huile, filtres, anomalie), pas les fiches chiffrées de la v6 : le résumé « Derniers contrôles » est gardé tel quel.
> Harnais neuf `mv-harnais-trac2` (8 + 6). Base `b80419d`. **APP 8.54 → 8.55, SW 9.32 → 9.33.** Précédent : TRAC-1 (§282).

> Dernière consolidation : **8 octobre 2026 (TRAC-1)** — ★★ **LES SESSIONS DU TRACTEUR EN LISTE + FICHE (MAQUETTE V6)** (§282).
> Lot 13, **zip cumulatif avec DS-4 … PLAN-3 (§270 à §281) non poussés** (Nico poussera tout d'un coup sur son mode de test). La v6
> (hors dépôt) dessine le Tracteur depuis l'écran réel ; Nico : « go », et précise : le GNR se calcule depuis le chrono, avec 6 L/h pour
> qui ne relève pas. Sur ordinateur, toucher une session la CHOISIT : `_trFicheHtml` résume (avancement, surface pondérée, parcelles, note)
> et porte le bouton vers la feuille de travail (`openSessionDetail`). ⚠️ La feuille ne se pose PAS à droite comme la fiche du Planning :
> la fermer fige le chrono (`_chronoFinalizeOnClose`). Heures et GNR ne sont pas dans la fiche : le chrono vit par session, à tracer
> d'abord. Harnais neuf `mv-harnais-trac1` (11 + 8). Base `b80419d`. **APP 8.53 → 8.54, SW 9.31 → 9.32.** Précédent : PLAN-3 (§281).

> Dernière consolidation : **8 octobre 2026 (PLAN-3)** — ★ **LES FEUILLES DU PLANNING ET LE RÉCAP ANNUEL À LA CHARTE** (§281). Lot 12,
> **zip cumulatif avec DS-4 … PLAN-2 (§270 à §280) non poussés** — onze lots en attente : à pousser. Habit seulement : les quatre feuilles
> (`.pl2-sheet` : congés, chaleur, fiche ; `#ovPlanDay` et son `.plan-modal-hdr`) passent à l'en-tête clair, aux champs et boutons du kit
> (principal à l'accent) ; le récap annuel en casse normale, le mois en cours à l'accent — repéré parce que sa barre n'est pas peinte en
> `gris-clair` par `planning.js` (le harnais le garde). Harnais neuf `mv-harnais-plan3` (7 + 6). Base `b80419d`. **APP 8.52 → 8.53, SW
> 9.30 → 9.31.** Précédent : PLAN-2 (§280). Le Planning de la v5 est complet ; restent les autres modules, maquette d'abord.

> Dernière consolidation : **8 octobre 2026 (PLAN-2)** — ★★ **PLANNING « LES GENS » EN LISTE + FICHE** (§280, premier chantier de
> `docs/claude/chantiers-280-329.md`). Lot 11 du plan, **zip cumulatif avec DS-4 … PLAN-1 (§270 à §279) non poussés**. La fiche est celle
> de l'appli (`#ovPlanFiche`) : `_plGensDock()` la RANGE dans la page à droite de la liste sur « Les gens » à partir de 1 024 px, et la
> rend à sa place ailleurs — aucune logique de fiche dupliquée. Lignes de liste, en-tête de fiche clair. Harnais neuf `mv-harnais-plan2`
> (9 + 7), qui joue la vraie fonction sur un faux DOM. Base `b80419d`. **APP 8.51 → 8.52, SW 9.29 → 9.30.** Précédent : PLAN-1 (§279).

> Dernière consolidation : **8 octobre 2026 (PLAN-1)** — ★★ **LE PLANNING « LE MOIS » AU DESSIN DE LA MAQUETTE V5** (§279).
> Lot 10 du plan, **zip cumulatif avec DS-4 … ACC-3 (§270 à §278) non poussés**. La v5 (hors dépôt) dessine le Planning à partir de ce
> que l'écran réel porte ; Nico : « go ». PLAN-1 ne change que l'habit (même balisage, mêmes gestes `planCellTap` / `planColTap` /
> `planRowTap` / `planSelAll`, même barre du bas, mêmes périodes) : outils en une ligne (`#plan-body` en flex qui passe à la ligne),
> chiffres en bande, grille à plat teintée par type. ⚠️ La base des cases passe par `:where()` : avec `:not()` en chaîne, sa
> spécificité (1,5,0) écrasait toutes les teintes de type — vu sur capture en posant des types. Écart assumé : l'appli garde « cocher
> puis agir » (une case comme plusieurs), la maquette ouvrait un panneau pour une case seule. Harnais neuf `mv-harnais-plan1` (12 + 8).
> Base `b80419d`. **APP 8.50 → 8.51, SW 9.28 → 9.29.** Précédent : ACC-3 (§278). Reste : PLAN-2 (« Les gens » en liste + fiche).

> Dernière consolidation : **8 octobre 2026 (ACC-3)** — ★★ **LA MÉTÉO 5 JOURS ET LES DERNIERS TRAVAUX AU DESSIN DE LA MAQUETTE V4** (§278).
> Lot 9 du plan, **zip cumulatif avec DS-4 … ACC-2 (§270 à §277) non poussés** — l'Accueil de la v4 est complet. `renderHomeMeteo5` :
> le jour en tête (maximum, ciel, minimum, risque), cinq colonnes à filet avec une barre de pluie, la note du premier jour au-delà de
> 50 %. ⚠️ La prévision donne une PROBABILITÉ de pluie (`pp`), pas des millimètres : la barre, le chiffre, la note et l'aide disent un
> pourcentage. Derniers travaux : un fil rangé par jour (« Aujourd'hui », « Hier », la date), l'heure lue dans l'identifiant (horodatage
> hexadécimal), les initiales, « qui a validé / a commencé quoi, où ». Vu avec une météo et un journal de test injectés. Harnais neuf
> `mv-harnais-acc3` (10 + 8). Base `b80419d`. **APP 8.49 → 8.50, SW 9.27 → 9.28.** Précédent : ACC-2 (§277).

> Dernière consolidation : **8 octobre 2026 (ACC-2)** — ★★ **LA PRIORITÉ ÉPINGLÉE EN CARTE, L'AVANCEMENT AU CADRE NEUTRE** (§277).
> Lot 8 du plan, **zip cumulatif avec DS-4 … ACC-1 (§270 à §276) non poussés**. `_homePrioCarte()` (appelée en fin de `renderHome`)
> fait du bloc épinglé une carte : la pastille en tête (texte, dépli, crayon inchangés), la tâche du moment avec son pourcentage
> pondéré par la surface, sa barre, et les parcelles dessinées à leur surface (fait, en cours, à faire ; un appui → `openSelParc`) ;
> sans priorité, la saison parcelle par parcelle, sans pourcentage en double. Les chiffres `#home-kpis` et les équipes du jour sont
> RANGÉS dans la carte, pas recréés. « Avancement de la saison » quitte son fond vert. Harnais neuf `mv-harnais-acc2` (10 + 9), qui joue la
> vraie fonction avec et sans priorité. Base `b80419d`. **APP 8.48 → 8.49, SW 9.26 → 9.27.** Précédent : ACC-1 (§276).
> Reste : ACC-3 (météo 5 jours, derniers travaux — à voir avec des données de test qui en portent).

> Dernière consolidation : **8 octobre 2026 (ACC-1)** — ★★ **L'ACCUEIL AU DESSIN DE LA MAQUETTE V4 : GRILLE, CADRE, PERSONNALISER** (§276).
> Lot 7 du plan, **zip cumulatif avec DS-4 … PARC-2 (§270 à §275) non poussés**. La maquette v4 garde les 12 blocs réels et Personnaliser
> (Nico : « ok »). Sur ordinateur, `#home-cols` passe à 12 colonnes : `_homeSpans()` — fonction À PART, appelée après chaque
> `_homeRangees()` dont le texte ne bouge pas (ALIGN-2 l'extrait et vise sa fin) — donne 7 / 5 puis 5 / 7 aux deux blocs d'une rangée.
> Titres de bloc en casse normale, carte du tracteur au cadre neutre, outils de Personnaliser au dessin du kit. Et la projection des
> pistes du cockpit (fin prévue, atterrissage) devient un fin pointillé : Nico avait vu, sur la maquette en sombre, une rangée de blocs
> lourds. Harnais neuf `mv-harnais-acc1` (11 + 8). Base `b80419d`. **APP 8.47 → 8.48, SW 9.25 → 9.26.** Précédent : PARC-2 (§275).
> Reste : ACC-2 (priorité épinglée avec mosaïque, météo, avancement de la saison, derniers travaux redessinés comme la v4).

> Dernière consolidation : **8 octobre 2026 (PARC-2)** — ★★ **LES CARTES DE TRAVAIL DU TÉLÉPHONE AU DESSIN DE LA MAQUETTE V3** (§275).
> Lot 6 du plan, **zip cumulatif avec DS-4, COQ-2, TETE-1, TYPO-2 et PARC-1 (§270 à §274) non poussés**. Sous 1 024 px : quand une tâche
> est choisie, la carte dit l'état de CETTE tâche (`_pCarteTache` : rang, nom, « Réparation, en cours », DRAE, proximité) à la place du
> pourcentage ; ses deux gestes (`_pvActions`, inchangés) passent en bas, en deux grands boutons 1 / 2 (56 px au doigt), un seul en
> pleine largeur quand la parcelle est commencée. Filtres segmentés qui défilent, priorité en bandeau fin, dock sans cadre autour des
> icônes (vu au sombre). Harnais neuf `mv-harnais-parc2` (9 + 9). Base `b80419d`. **APP 8.46 → 8.47, SW 9.24 → 9.25.**
> Précédent : PARC-1 (§274). Restent : l'Accueil en grille, puis le contenu des autres modules.

> Dernière consolidation : **8 octobre 2026 (PARC-1)** — ★★ **LES PARCELLES SUR ORDINATEUR, EN LISTE + FICHE** (§274).
> Lot 5 du plan, **zip cumulatif avec DS-4, COQ-2, TETE-1 et TYPO-2 (§270 à §273) non poussés**. Nico valide la maquette v3 (« go ») :
> les Parcelles restent un ÉCRAN DE TRAVAIL (tâche choisie, tournée, priorité, équipe, « Début » / « Valider » sur chaque parcelle) —
> recopier la v2 (un catalogue) aurait sorti ces gestes de la liste. À partir de 1 024 px : `renderParcelles` dessine une ligne
> (`_pRow`, mêmes gestes par `_pvActions`, classe `pcard-qv` gardée pour la visite guidée) et la fiche de la parcelle choisie
> s'ouvre à droite (`#p-fiche`, `_pFicheHtml` : gestes, état de la tâche, DRAE, avancement, travaux, passages, « Fiche complète » →
> `openDP`). Flèches ↑ ↓ et V, hors champ. Filtres et Liste / Carte en segmentés. Téléphone inchangé (PARC-2). Harnais neuf
> `mv-harnais-parc1` (13 + 12). Base `b80419d`. **APP 8.45 → 8.46, SW 9.23 → 9.24.** Précédent : TYPO-2 (§273).

> Dernière consolidation : **8 octobre 2026 (TYPO-2)** — ★★ **L'ÉCHELLE DE TEXTE DE LA MAQUETTE V2** (§273).
> Lot 4 du plan, **zip cumulatif avec DS-4, COQ-2 et TETE-1 (§270 à §272) non poussés**. Les crans `--pt-*` prennent les valeurs de la
> maquette, calées sur 4 px : `txt` 12,5 → 13, `lbl` 11,5 → 12 (rejoint `micro`), `sm` 17 → 16, `lg` 23 → 24, `xl` 27 → 28, `xxl` 31 → 32.
> Le verrou qui bloquait DS-4 est levé dans le même lot : **508 tailles écrites en dur égales à un cran passent au jeton, au même
> pixel** (`font-size:13px` → `var(--pt-txt,13px)`), et 750 replis suivent la nouvelle valeur. Harnais échelle, TEXTE-A et typo mis
> aux crans décidés ; 0 taille exacte en dur. Rendu avant / après : rien ne bouge de place. Base `b80419d`.
> **APP 8.44 → 8.45, SW 9.22 → 9.23.** Précédent : TETE-1 (§272). Restent : Parcelles (liste + fiche), Accueil (grille), le reste.

> Dernière consolidation : **8 octobre 2026 (TETE-1)** — ★★ **LES EN-TÊTES ET LES ONGLETS AU DESSIN DE LA MAQUETTE V2** (§272).
> Lot 3 du plan, **zip cumulatif avec DS-4 (§270) et COQ-2 (§271) non poussés**. Aucun balisage ne change : un bloc TETE-1, par
> jetons, rhabille les dix `.mod-header` (et l'en-tête propre de la Cave, `.mvc-hdr`), le bandeau `.pil-mast` et la barre d'onglets du
> Pilotage. La bande sombre sous le titre (`.mod-header-top`, dessinée en fond avec le filet « horizon ») disparaît ; icône sans
> boîte ; titres en Outfit ; onglets soulignés, compacts, sans icône ; sous-onglets en filtre segmenté ; capitales espacées retirées.
> Sur ordinateur avec la barre, `#app-content-wrap` devient un panneau posé sur le fond (`overflow:clip`, pour garder le collant).
> ⚠️ Vu sur capture : la première version laissait le titre noir sur la bande sombre — illisible. Harnais neuf `mv-harnais-tete1`
> (12 + 10 contre-épreuves). Base `b80419d`. **APP 8.43 → 8.44, SW 9.21 → 9.22.** Précédent : COQ-2 (§271).
> Restent : TYPO-2, Parcelles (liste + fiche), Accueil (grille), le contenu des autres écrans.

> Dernière consolidation : **8 octobre 2026 (COQ-2)** — ★★ **LA BARRE, LA RECHERCHE ET LE DOCK AU DESSIN DE LA MAQUETTE V2** (§271).
> Lot 2 du plan « l'appli colle à la maquette v2 », **zip cumulatif avec DS-4 (§270) non poussé**. Les règles COQ-1 / PRO-1 restent
> (place, largeurs 244 / 76, box-sizing) ; un bloc COQ-2, par jetons seulement, change l'habit : barre sur le fond neutre, marque en
> tête et domaine dessous, écran ouvert marqué par l'accent seul, bouton de repli (icône de panneau) sur la ligne de la personne,
> touche « [ ». La recherche range en « Aller à » (écrans puis onglets du Pilotage), « Parcelles », « Actions » (journal, thème
> gardé, barre). Dock et feuille « Plus » à plat. Harnais neuf `mv-harnais-coq2` (15 + 11 contre-épreuves) ; COQ-1 et jetons
> recalés (groupes, rayon `--r-xs`, cliquet des rayons redéfini sur les pas de DS-4 et regravé à 234). Base `b80419d`.
> **APP 8.42 → 8.43, SW 9.20 → 9.21.** Précédent : DS-4 (§270). Restent : TYPO-2, TETE-1 (en-têtes et onglets), Parcelles, Accueil.

> Dernière consolidation : **8 octobre 2026 (DS-4)** — ★★ **LA CHARTE DE LA MAQUETTE V2, DANS TOUTE L'APPLI** (§270).
> Nico (08/10) valide la maquette de la coquille v2 (« c'est parfait ») et demande que l'appli y colle exactement ; lot 1 du plan :
> les JETONS. Les noms existants gardent leur nom et prennent les valeurs de la maquette (fonds neutres, arrondis 6/8/12, ombres
> légères, en clair et dans les DEUX blocs sombres) ; les rôles qui n'avaient pas de nom arrivent (accent lie-de-vin, ok / attention /
> danger, survol, hauteurs, plans). Le cockpit est habillé par un bloc à part (renvois de ses couleurs propres, titres en Outfit),
> sans retirer une règle de REF-1. Mesuré : 37 + 39 paires de contraste passées sous 4,5 (texte discret sur fonds gris) → 0, en
> foncant juste assez --texte-doux. ⚠️ L'échelle de texte de la maquette (13/16/24/28/32) est REPORTÉE : 503 tailles en dur
> tomberaient sur les nouveaux crans → lot TYPO-2. Base `b80419d`. **APP 8.41 → 8.42, SW 9.19 → 9.20.** Précédent : PRO-1 (§269).
> Restent : TYPO-2, COQ-2 (barre latérale, Ctrl K, dock au dessin de la v2), TETE-1 (en-têtes et onglets), Parcelles, Accueil.

> Dernière consolidation : **8 octobre 2026 (PRO-1)** — ★★ **LE PILOTAGE AU NIVEAU PRO, SUR ORDINATEUR COMME AU TÉLÉPHONE** (§269).
> Nico (08/10, trois captures) : boutons morts (priorité, agrandir), consommation « pas pro du tout », PC cassé barre ouverte. Causes MESURÉES
> dans Chromium (§269 : rendu de l'appli dans le bac à sable, recette écrite) : la barre faisait 269 px pour 244 réservés (box-sizing), six marges
> négatives doublées par le convertisseur de REF-1 (« --16px »), le modèle du cockpit appelait `_mvTacheDuMoment()` sans rien et lisait un contrat
> qui n'existe pas — le bouchon du harnais REF-1 ÉTAIT le défaut —, un observateur de largeur restait branché après la sortie d'Aujourd'hui.
> Tension par personne → L'équipe & le matériel ; protection restante → Conformité. Harnais `mv-harnais-pro1` (27 + 13 contre-épreuves) ;
> `prio`, `gnr-mesure`, `ref1` remis au vrai contrat. Base `1aeb055`. **APP 8.40 → 8.41, SW 9.18 → 9.19.** Précédent : COQ-1 + PAL-1 (§268).
> ⚠️ Les lots MOUV-1 → COQ-1 (§259 à §268, 07/10) n'étaient pas montés dans cet en-tête : ils sont aux chantiers (`docs/claude/chantiers-230-279.md`).

## Descendu du §28 de CLAUDE.md le 09/10/2026 (CADRE-1, plafond du cœur)

### ★ Livré antérieurement (historique d'août)

**7 août soir** — série MILLÉSIME (4 lots) + lot MALO + refonte de l'onglet Cave du Pilotage.
**7 août matin** — Le millésime · parc à fûts · entonnage depuis le parc · registre des
manipulations · bilan de campagne.
**5 août** — `mvprint.py` retrouvé et archivé ; document d'instructions régénéré.
**4 août** — niveaux sautés `_mvNivH` (−528 h chez MG) · plomberie `tcfgSave` + `_normalizeTaches` ·
badge « votre valeur » · densité · barèmes régionaux · **DOCK rejoué** · MÉNAGE · **capacité
réelle** · **grille d'installation tranchée** · le prospect Gironde + `mise-en-route.html` · **registre phyto
CSV** · **vendange-couperet**.
**1er au 3 août** — UX-1 · `firebase.json` · e2e +2 étapes · **écran d'accueil public** · téléphone
corrigé · DEMO-3 · heures sup · **saisonniers dans l'historique** · **équipe collective** · refonte
Économie · **carte d'ordre de passage** · Décider ×6 · Renfort ×5 · **vendange fantôme, 941 h**.
**31 juillet** — nouveau SIRET, adresse et téléphone publiés, archivage des CGU/DPA signées.
**30 juillet** — série UX-R1 → R5, zéro nouvelle collection.

## Descendu du §28 de CLAUDE.md le 09/10 (GF-1) — plafond du cœur, historique sans consigne

### ★★★ Le 10 août — migration GitHub

Le code source de Ma Vigne vit désormais dans un dépôt **`4ss4ss1/mavigne-dev`**, public, sur
GitHub Desktop côté Nico. **Ceci remplace le workflow d'upload pour la LECTURE du code** (Règle
d'or n°1, « Environnement de Nico »). Pas un chantier fonctionnel — un changement d'outillage, mais
le plus structurel depuis le début du projet : Claude clone/lit directement, Nico livre par
commit+push au lieu d'upload/téléchargement.
★ **Piste ouverte, pas encore faite** : committer ce document lui-même dans le dépôt (en
`CLAUDE.md` à la racine) pour qu'il soit, lui aussi, lisible sans upload à chaque session. Tant que
ce n'est pas fait, la procédure de régénération de la Règle d'or n°1 reste pleinement en vigueur
pour ce document précis.

### ✅ Le verrou administratif est levé

**3 août 2026 — l'Urssaf a confirmé que Nico peut facturer.** La première facture définitive est
partie à le signataire le second domaine (réf. MV-AAAA-NNNN).
