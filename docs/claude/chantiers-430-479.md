# Ma Vigne — Chantiers §430 à §479

> Ouvert le 22/10/2026 (§430), sur le modèle de `chantiers-380-429.md`. Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence « §N » se trouve par
> `docs/claude/INDEX.md`.

## 430. ★ DIAG-2 — AÉRATION AU SOUTIRAGE, FLEUR À LA DÉGUSTATION : LE DIAGNOSTIC NE LES DIT PLUS « NON SUIVIS » (22/10 — `src/cave.js` (`_COP_DG_SIG`, `_copSoutAir`, `_copSoutAirSync`, `setCopSoutAir`, la remise à zéro et le pré-remplissage de Nouvelle opération, l’enregistrement du soutirage, la ligne du journal) · `index.html` (la bascule « Aération » du soutirage, versions) · `src/diagnostic.js` (`dgnModele` lit `data.air`, l’indice `fleur` par `nez()`, la Méthode) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-diag1.mjs` · `scripts/harnais-claude-md.mjs` · `scripts/tutos-couverture.json` · `docs/claude/modules.md` · `.mv-base` · `lots/DIAG-2.json` · **APP 9.88 → 9.89, SW 10.67 → 10.68**, base `4103949`)

### 430a. D’où ça vient
DIAG-1 (§429) affichait « non suivi (nouveau champ) » pour tout ce que la maquette marquait « nouveau ». Nico : « suite ». Les deux
observations du chai passent en premier, parce qu’elles décident entre Brett et piqûre acétique : l’aération au soutirage et la fleur.

### 430b. Ce qui change
- **Soutirage** (Nouvelle opération) : une bascule « Aération » — « À l’abri de l’air » / « À l’air ». Écrit `data.air` (true / false) ;
  rien de coché n’écrit rien : le diagnostic dit « aération non renseignée », il ne suppose pas. Retoucher la bascule cochée la décoche.
  La ligne du journal dit « À l’air » ou « À l’abri de l’air ».
- **Dégustation** : un neuvième signal, `fleur` (« Fleur en surface »), à côté d’Animal et de Volatile. Rien d’autre ne bouge : le
  journal, la fiche et le Suivi d’élevage lisent les libellés de `_COP_DG_SIG`.
- **Diagnostic** : l’indice « Soutirage à l’air » lit `air` (oui s’il y a un soutirage à l’air depuis la fin de la malo, inconnu si un
  soutirage n’est pas renseigné) ; l’indice « Fleur en surface » passe par `nez(M, 'fleur')`, comme le nez animal ou volatile
  (dégustations des 120 derniers jours). La Méthode marque les deux « Déjà saisi ».
- Sur le domaine fictif du harnais, le Pinot porte maintenant son soutirage à l’air du 10 juin : il redevient « Brett ou fût piqué ? »,
  exactement la maquette. Une contre-épreuve de plus : l’aération n’est plus lue → rouge.

### 430c. Pièges
- La bascule reprend le modèle de « Sur quoi » de la dégustation (`cave-toggle-row`, `cave-toggle-btn`, `cave-toggle-active`) : la
  classe est passée au jeu de boutons commun (CHARTE-3), aucun style écrit à côté.
- ★ **Un geste nouveau sans tuto fait monter le compte** (`mv-harnais-tutos`, règle F : 814 pour 813). La bascule est un choix de
  plus dans un geste qui ne change pas : exemptée avec sa raison dans `scripts/tutos-couverture.json`, comme `_homeDirectTout` et
  `_esDatesNote` — le plafond ne bouge pas.
- `setCopSoutAir` est exposée sur `window` : `cave.js` est un ES module, l’`onclick` d’`index.html` ne la verrait pas sinon.

### 430d. Ce qui reste (DIAG-3)
Analyses neuves au labo (azote assimilable, éthylphénols, acétate d’éthyle, éthanal), force de la solution de SO2 (les mg/L du Chai et la
dose suggérée), température du chai, la mise (oxygène dissous, tests de stabilité), part des anges par cuvée.

## 431. ★★ DIAG-3 — QUATRE ANALYSES DE PLUS AU LABO ; LE DIAGNOSTIC LES COMPARE AU SEUIL DE PERCEPTION (22/10 — `src/cave.js` (`LABO_ANA` : `azote`, `ep`, `acet`, `ethanal`) · `src/diagnostic.js` (`dgnModele` lit les quatre clés et l’azote en `nass`, `confLabo`, `evaluer` : confirmation et `contre`, la carte « Analyse contraire », la Méthode) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave — « Les rapports du labo ») · `index.html` (versions) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-diag1.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/DIAG-3.json` · **APP 9.89 → 9.90, SW 10.68 → 10.69**, base `c5606ab`)

### 431a. D’où ça vient
« Pour confirmer » envoyait au labo des analyses que l’appli ne savait pas recevoir : le diagnostic les marquait « non mesurées »
pour toujours. Nico : « suite ». Le labo d’abord, parce que c’est la boucle : demander, saisir dans Labo, le diagnostic relit.

### 431b. Ce qui change
- `LABO_ANA` passe de 9 à 13 lignes, à la fin de la liste : azote assimilable (mg/L), éthylphénols 4-EP + 4-EG (µg/L, la somme),
  acétate d’éthyle (mg/L), éthanal (mg/L). Tout le module Labo les porte sans autre changement : la fiche les propose en puces
  (pas demandées par défaut — elle reprend l’envoi précédent), les lignes et les blocs n’affichent que ce qui est demandé ou mesuré.
  Une cuve du Cuvier les reçoit aussi (l’azote se mesure sur le moût).
- Le diagnostic compare la **dernière mesure** au seuil de perception : éthylphénols 400 µg/L (4-EP : 370 à 620 selon les études),
  acétate d’éthyle 150 mg/L (AWRI : 150 à 200 dans un vin défectueux, 30 à 60 dans un vin normal), éthanal 100 mg/L (AWRI : 100 à 125 ;
  un symposium Unilabo cite 40 à 45 mg/L — le seuil le plus prudent a été retenu pour ne pas crier au loup).
- `evaluer` : une confirmation au-dessus du seuil compte comme un indice principal (+3) et s’affiche parmi les « Principaux » ; une
  mesure en dessous interdit « Signes forts » pour cette cause et s’affiche en « Analyse contraire ». L’azote passe par `nass`
  (150 mg/L, 200 au-delà de 13 % vol probable) — la règle existait, la donnée manquait.

### 431c. Pièges
- Une contre-épreuve de DIAG-2 est devenue muette : avec l’acétate d’éthyle sous le seuil, la piqûre ne peut plus être « Signes
  forts », et l’aération ne changeait plus le titre du Pinot. Le harnais teste maintenant l’indice lui-même (« le soutirage à l’air
  appuie la piqûre »), plus seulement le titre — c’est la leçon du « harnais qui ne voit que le résultat final ».
- La page de test de la maquette lisait une copie de `_laboLignes` d’avant DIAG-3 : le titre ne changeait pas. Toujours ré-extraire
  le vrai lecteur après avoir touché `LABO_ANA`.

### 431d. Ce qui reste
Force de la solution de SO2 (mg/L du Chai, dose suggérée), température du chai, la mise (oxygène dissous, tests de stabilité), part des
anges par cuvée. « Pour confirmer » propose encore une analyse déjà faite : afficher son résultat à la place serait plus juste.

## 432. ★ DIAG-4 — LA FORCE DE LA SOLUTION DE SO2 : LES SULFITAGES DU CHAI EN MG/L ; « POUR CONFIRMER » DIT CE QUI EST DÉJÀ MESURÉ (22/10 — `src/diagnostic.js` (`dgnMglChai`, `dgnModele` : volume moyen des fûts, `dgnReglages` / `dgnEnregistrer` : `solution`, la dose en cL, les Réglages, « Déjà mesuré ») · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave — « Le diagnostic ») · `index.html` (versions) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-diag1.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/DIAG-4.json` · **APP 9.90 → 9.91, SW 10.69 → 10.70**, base `8922537`)

### 432a. D’où ça vient
Le soutirage note le SO2 en cL ou mL par fût, sans la force de la solution : le diagnostic ne pouvait ni calculer le rendement d’un
sulfitage du Chai, ni estimer la dose qui ramène le SO2 actif à l’objectif. Nico : « suite ».

### 432b. Ce qui change
- Les Réglages du diagnostic (admin) portent « Solution de SO2 du Chai » : Non réglée, 5, 6, 8, 10, 18 %. Rangé dans
  `CAVE_ELEVAGE.config.diag.solution`, à côté de l’unité de la volatile et des objectifs.
- `dgnMglChai(dose, unité, volume)` : mL de solution × force ÷ 100 = grammes de SO2 ; ÷ le volume moyen d’un fût de la cuvée (champ `l`
  des lots, pondéré par le nombre de fûts ; 228 L à défaut) = mg/L. 6 cL d’une solution à 10 % dans un fût de 228 L = 26,3 mg/L.
- Conséquences, sans rien toucher d’autre : le journal du diagnostic dit « environ … mg/L de SO2 ajoutés », le rendement de chaque
  sulfitage se calcule, et « Points d’attention » peut estimer la dose (« 74 mg/L … 42 % de l’ajout se retrouve en SO2 libre » sur le
  Pinot fictif, les chiffres de la maquette). La dose en cL suit la force réglée (10 % à défaut, et le texte le dit).
- **Rien n’est écrit dans les opérations** : la conversion se fait à la lecture. Changer la force recalcule tout l’historique.
- « Pour confirmer › Au laboratoire » ajoute « Déjà mesuré : 620 µg/L le 18 oct., au-dessus du seuil… » quand l’analyse existe.

### 432c. Pièges
- Une seule force pour tout le Chai : c’est l’hypothèse la plus simple et la plus fréquente. Un domaine qui change de solution en cours
  d’année verra ses anciens sulfitages recalculés avec la nouvelle force — à revoir s’il le demande (une force par soutirage).
- Les méchages (pastilles) restent sans mg/L : la part du SO2 brûlé qui passe dans le vin n’est pas connue.

### 432d. Ce qui reste
Température du chai, la mise (oxygène dissous, tests de stabilité), part des anges par cuvée.

## 433. ★★ DIAG-5 — TEMPÉRATURE DU CHAI, MESURES DE LA MISE, PART DES ANGES : LE DIAGNOSTIC N’A PLUS DE « NOUVEAU CHAMP » (22/10 — `src/cave.js` (`_copNouvData`, `_copNouvPrefill`, `_copNouvLignes` : la température ; la remise à zéro de Nouvelle opération ; la mise en bouteille : trois champs et leur enregistrement) · `index.html` (le champ « Température du chai », versions) · `src/diagnostic.js` (`dgnModele` : `temp`, `o2`, `tart`, `prot`, part des anges ; `analyser` : `tempChai` et le frein « Chai » ; indices `temp`, `o2`, `tart_ko`, `prot_ko` ; le risque « Dépôts » ; la Comparaison ; la fiche du vin fini ; la Méthode) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-diag1.mjs` · `scripts/harnais-claude-md.mjs` · `docs/claude/modules.md` · `.mv-base` · `lots/DIAG-5.json` · **APP 9.91 → 9.92, SW 10.70 → 10.71**, base `6910115`)

### 433a. D’où ça vient
Les trois derniers « nouveau champ » de la maquette : la température du chai (frein de la malo), les mesures de la mise (protection en
bouteille, dépôts) et la part des anges par cuvée (mesure grisée de la Comparaison). Nico : « suite ».

### 433b. Ce qui change
- **Dégustation** : « Température du chai » (°C, facultatif) → `data.temp_chai` ; le journal dit « Chai à 14 °C ». La dégustation est le
  geste qu’on fait au chai : pas de nouveau type d’opération, pas de geste nouveau (un champ lu à l’enregistrement).
- **Mise en bouteille** : oxygène dissous (mg/L) et tests de stabilité tartrique et protéique (Non fait / Stable / Instable), facultatifs,
  dans la même rangée que « Bouteilles réelles » → `c.mise_o2`, `c.mise_tart`, `c.mise_prot`.
- **Diagnostic** : la dernière température des 30 jours entre dans les freins de la malo (favorable de 18 à 22 °C, défavorable sous
  16 °C) et dans l’indice « Chai à moins de 16 °C » ; « Au chai » dit où la noter. À la mise : `o2` au-delà de 1 mg/L (repère de
  l’oxygène total visé), `tart_ko`, `prot_ko` — le risque « Dépôts et troubles » a désormais deux indices principaux.
- **Part des anges** : la somme des volumes ouillés (`vol_total_L`, le premier ouillage exclu) ramenée à l’année, sur le volume des
  fûts de la cuvée (nombre × contenance) ; au moins deux mois d’ouillages. Elle allume la mesure de la Comparaison et s’affiche dans
  la fiche (bloc Fûts).
- La Méthode n’a plus aucune ligne « Nouveau champ ».

### 433c. Pièges
- Une seule température par dégustation, pas de relevé continu : le diagnostic prend la dernière des 30 jours et dit sa date.
- La part des anges compte ce qu’on a remis dans les fûts : un ouillage sans volume noté ne compte pas, la part serait sous-estimée.

### 433d. Ce qui reste
Rien de la maquette. À suivre selon l’usage : une force de solution par soutirage, un relevé de température dédié s’il en faut un.

## 434. ★★ CAVEAUJ-1 — CAVE › AUJOURD’HUI AU DESSIN DE LA MAQUETTE VALIDÉE ; LA MACÉRATION N’EST PLUS UNE FERMENTATION QUI RALENTIT (22/10 — `src/cave.js` (`_mlProjFA` : l’état `mpf` ; `_mlVerdict` : le mot suit le contenant, « leur malo », « Puis : … » ; `_mlGestes` ; `_caveKpisRender` ; `_aujRender` refait et ses pièces `_aujRaison`, `_aujMeta`, `_aujGrouper`, `_aujLigne`, `_aujFaits`, `_aujEquipe`, `_aujProchain`, `_aujMaceration`, `_aujVeille`, `_aujMarques`, `_aujResume`, `_aujDetail`, `_aujCal`, `_aujJourSel`, `_aujColle` ; `_mlEvHtml` retirée ; `_aujInjectCss` et `_mlInjectCss` débarrassées de l’ancien écran) · `src/pilotage.js` (`_pilCkCave` : des gestes) · `src/coquille.js` (le compteur de la barre : des gestes) · `src/styles.css` (bloc CAVE-1 réduit à la bande ; bloc ★★ CAVEAUJ-1) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave, MV_INFO `cave.auj`) · `index.html` (versions) · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-caveauj1.mjs` (neuf) · `scripts/mv-harnais-cave1.mjs` · `scripts/mv-harnais-cave-auj.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/CAVEAUJ-1.json` · **APP 9.92 → 9.93, SW 10.71 → 10.72**, base `fdacae3`)

### 434a. D’où ça vient
Nico (22/10) : « dans la cave, dans aujourd’hui […] faut quelque chose de plus pro […] une bête de course ». Objectif confirmé (« oui ») : le
vrai tableau de bord du maître de chai, au niveau de la refonte (Pilotage, Accueil Vigne), rapide à lire et rapide à agir. Mesuré sur l’appli
construite (domaine de démo) : sur PC, « Ce qui presse » seul à gauche au-dessus d’un grand vide ; la liste répétait la même cuve (Cuve 5 deux
fois) et la même cuvée (Fixin trois fois), les ouillages revenaient semaine après semaine ; textes doublés (« 3 fûts · ~21 L · 3 fûts »,
« Fin de fermentation · fin de fermentation estimée ») ; au téléphone, le premier geste arrivait vers le bas de l’écran. Maquette HTML (publiée,
hors dépôt), v1 : « j’aime beaucoup » — mais la colonne fixe de droite cachait le calendrier en bas de page ; v2 : seule « À surveiller » reste
fixe, et seulement si elle tient. « go ».

### 434b. Ce qui change
- **« Ce qui presse »** : le verdict (pastille Prioritaire / À faire / À jour), pourquoi, puis ce qui suit (« Puis : … », trois au plus).
  **Une ligne par contenant** — les gestes d’une même cuve (ou cuvée) réunis, contrôle et dû en tête — et un bouton du jeu commun par geste
  (`_mlGo`, inchangé). « Déjà fait aujourd’hui » (opérations du Chai, relevés et décuvages du Cuvier datés du jour), « En cave aujourd’hui »
  (`CONFIG.cave_jours`, lien Planning pour l’administrateur), « Faire la tournée » (la tournée du Cuvier) et « Nouvelle opération ». Quand tout
  est fait, le prochain geste est dit.
- **« À surveiller »** (à droite sur ordinateur, après « Ce qui presse » au téléphone) : macération plus longue que prévu, fin de
  fermentation dans les trois jours, fûts en fin de vie (`_mlSansDate`) sinon fûts libres. **Collée seulement si elle tient dans l’écran**
  (`_aujColle`, la règle de `_accColle`), et jamais au-delà de `.caj-zone` : le calendrier est rendu hors de la zone.
- **« Les quatre semaines »** en calendrier 4 × 7 : chaque jour porte ses gestes (texte court sur ordinateur, points au téléphone) et les fins
  de FA estimées (rond creux) ; une colonne résume la semaine (gestes, fûts et litres par `_mlResumeSem`), une liste la remplace au téléphone ;
  un appui sur un jour montre son détail sous la grille (`_aujJourSel`, exempté au compte des tutos : un affichage).
- **La bande** dit « à faire cette semaine » et compte des gestes (`_mlGestes`) ; la carte Cave du Pilotage et le compteur de la barre aussi.

### 434c. Trouvé en route (corrigé)
- **Fausse alerte en tête** : `_mlProjFA` lisait une cuve en macération (`statut 'mpf'`) comme une fermentation qui ralentit (densité stable) —
  la démo affichait « 1 cuve demande un contrôle » pour Cuve 5, le Pilotage aussi. Elle rend désormais `{etat:'mpf'}` : ni alerte ni projection.
- `_mlVerdict` : « 2 cuvées ont fini **sa** malo » → « **leur** malo » ; « 1 **cuve** demande un contrôle » pour une malo bloquée (une cuvée) →
  « 1 **cuvée** » ; la seconde ligne (« Et … ») devient « pourquoi. Puis : … ».
- La bande comptait la fin de fermentation estimée comme une chose à faire (7 → 5 sur la démo, avec la fausse alerte).
- Le preflight a refusé `_mlResumeSem` sans appelant (son seul appelant était l’ancien écran) : les semaines du calendrier la lisent.
- La chaîne, au premier passage : des icônes en 14 px (l’échelle est 16/18/20/24/40) → 16 ; une pastille (`caj-pill`) et une « tuile » (`caj-tile`)
  maison faisaient remonter les plafonds de `mv-harnais-pastilles` et `mv-harnais-cartes` → `.mvpas .mvpas-statut`, `.mvcarte`, `caj-ico` ;
  le filet `--ligne`, jeton du socle, prend son repli (`mv-harnais-jetons`) ; le bloc, posé d’abord après TETE-2 — qui doit fermer la feuille
  (`mv-harnais-tete2`) —, puis juste avant lui, où sept harnais (Arrivée, Carte du domaine, Jalons, Premières fois, Présence, Rangement des
  bouteilles, Saison en image) lisent « leur » style jusqu’à TETE-2 et y trouvaient le repli `#E7E6E2`, est rangé juste après CAVE-1 ;
  « ₂ » et « ≈ », hors de la police (`mv-harnais-subset` : aucun fichier ne remonte), ne sont plus ajoutés — la légende dit « Doser », la marque
  « Fin estimée », la raison d’une dose reprend `_ML_LBL.so2` ; le guide est régénéré (`build-guide --check`) ; `mv-harnais-typo` : la feuille
  passait 5 % au-dessus de sa gravure (831 → 877 Kio, cumul des lots ; +11 Ko ici) — découpage examiné, la feuille reste unique, référence
  regravée (`scripts/typo-baseline.json`).
- Le compteur de la Cave dans la barre latérale (`coquille.js`) comptait aussi la fin de FA estimée : il dit désormais 5, comme la bande.

### 434d. Vérifié
`mv-harnais-caveauj1` 21/21 + 10 contre-épreuves ; chaîne complète (`npm run check`) verte ; `mv-harnais-cave1` 4/4 + 5/5 ; `mv-harnais-cave-auj` 51/51 + contre ; `mv-harnais-agenda` vert ;
preflight vert ; ESLint propre. Appli construite et capturée (démo) : PC et téléphone, verdict « 2 cuves à mesurer — Pas de relevé depuis hier
ou avant. Puis : 1 cuvée à ouiller · 2 cuvées ont fini leur malo. », quatre lignes, bande 5. La maquette v2 avait été contrôlée au défilement sur
cinq tailles d’écran (aucun chevauchement de la colonne sur le calendrier) ; la règle est tenue au code par le harnais (point 6).

### 434e. Reste
CAVEAUJ-2 : « Le Cuvier » et « Le Chai » en un coup d’œil, « Derniers gestes » (§28). À trancher : l’ouillage dû un dimanche ou un férié.

