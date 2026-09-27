# Ma Vigne — Journal des consolidations

> Archive de l'en-tête de `CLAUDE.md`. Jusqu'au 27/09/2026, chaque consolidation s'empilait EN TÊTE
> du document, au-dessus de la première règle d'or : 1 190 lignes d'historique à traverser avant
> d'atteindre une consigne (§189). Désormais `CLAUDE.md` ne porte que la DERNIÈRE consolidation ;
> la précédente descend ici, **en tête** (ordre antichronologique).
> ⚠️ Archive : les états « à déployer », les numéros de version et les « points en suspens » cités
> ici étaient vrais le jour où ils ont été écrits. Rien ici ne se lit comme un fait présent —
> `APP_VERSION` (`src/utils.js`), l'en-tête de `public/sw.js` et le §28 de `CLAUDE.md` font foi.

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
