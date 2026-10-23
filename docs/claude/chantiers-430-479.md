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

## 435. ★★ CAVEAUJ-2 — CAVE › AUJOURD’HUI : LE CUVIER, LE CHAI ET LES DERNIERS GESTES D’UN COUP D’ŒIL ; L’OUILLAGE AU JOUR OUVRÉ D’AVANT (23/10 — `src/cave.js` (`_mlFerie`, `_mlJourOuvre`, `_mlOuillages` : la date avancée et `du` ; `_mlAgenda` : « avancé du … » ; `_aujDetail` ; `_aujVeille` : plus de « Parc à fûts » ; `_aujRender` : `_aujEtat` dans la colonne de « Ce qui presse », `_aujRecentsHtml` après le calendrier ; pièces neuves `_aujDepuis`, `_aujRel`, `_aujNb`, `_aujSpark`, `_aujCuveLigne`, `_aujOuillageEtat`, `_aujMalo`, `_aujChaiLigne`, `_aujEtat`, `_aujRecents`, `_aujRecentsHtml`, `_aujVoirTout`) · `src/styles.css` (bloc ★★ CAVEAUJ-2) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave, MV_INFO `cave.auj`) · `index.html` · `public/sw.js` · `guide/08-cave.html` + `public/guide.html` (régénéré) · `scripts/mv-harnais-caveauj2.mjs` (neuf) · `scripts/mv-harnais-agenda.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/CAVEAUJ-2.json` · **APP 9.93 → 9.94, SW 10.72 → 10.73**, base `75b35b5`)

### 435a. D’où ça vient
La suite de CAVEAUJ-1 (§434) — la maquette validée le 22/10 montrait aussi « Le Cuvier », « Le Chai » et « Derniers gestes ». Et la
question laissée ouverte, tranchée par Nico (23/10) : « ouillage le jour avant le jour férié ou le vendredi si tombe un dimanche ou samedi ».

### 435b. Ce qui change
- **Le Cuvier** (sous « Ce qui presse », dans la colonne collée) : une ligne par cuve suivie — nom et cuvée, état (Fermentation,
  Macération · J8, Décuvée), courbe de densité à 20 °C (le pointillé marque le vin sec) avec la dernière valeur et la pente, le dernier relevé
  (rouge à deux jours) et sa température, la fin estimée (`_mlProjFA`, « Au labo » pour une cuve suivie par les sucres). Vide : « Le Cuvier
  reprendra avec la prochaine vendange ».
- **Le Chai** : une ligne par cuvée en élevage — fûts et volume, jauge d’ouillage (jours passés face au seuil du millésime, prochain ouillage),
  malo (finie, bloquée, en cours avec le malique et la fin projetée, « après la FA » tant que la cuve qui l’a donnée n’a pas fini, évitée, pas
  d’analyse), soutirage (à faire, fait le …) ; les cuvées qui demandent un geste en tête ; au pied, les fûts libres au magasin et le parc.
- Pendant les vendanges (`_mlPhase()`), le Cuvier passe devant le Chai ; le reste de l’année, derrière.
- **Derniers gestes**, tout en bas : dix jours d’opérations du Chai, de relevés et de décuvages, du plus récent au plus ancien, en trois
  colonnes sur ordinateur ; « Tout voir » au téléphone (`_aujVoirTout`, exempté au compte des tutos : un affichage).
- **L’ouillage au jour ouvré d’avant** : `_mlJourOuvre` recule un samedi ou un dimanche au vendredi, un férié à la veille (un lundi férié,
  au vendredi), avec les fériés du Planning (`window._feriesY`). `_mlOuillages` place l’ouillage ce jour-là (jamais avant aujourd’hui ; un retard
  reste un retard), garde la date d’origine (`du`) et compte le suivant à partir du jour avancé ; l’agenda dit « avancé du dim 1, férié ». La
  bande, le calendrier, le Pilotage et la jauge du Chai lisent tous ces dates.
- « À surveiller » ne redit plus les fûts libres (ils sont au pied du Chai).

### 435c. Vérifié
`mv-harnais-caveauj2` 19/19 + 10 contre-épreuves ; `mv-harnais-caveauj1`, `cave1`, `cave-auj`, `agenda`, `futcap`, `tete2`, `pastilles`, `cartes`,
`jetons`, `charte`, `echelle`, `icones`, `boutons`, `subset`, `typo` verts ; preflight vert ; guide régénéré. Appli construite et capturée (démo),
PC et téléphone : Le Cuvier (trois cuves), Le Chai (quatre cuvées : Gevrey « prochain ven 30 » — l’échéance du samedi 31 avancée), le calendrier,
Derniers gestes. Chaîne complète (`npm run check`) verte : 507 commandes, 0 rouge ; tutos rejoués sur le build : au bout.

## 436. ★★ CAVEPIL-1 — PILOTAGE › AUJOURD’HUI : LA VUE CAVE (BASCULE TERRAIN · CAVE · ÉCONOMIE) ; UN SIGNE FORT DU DIAGNOSTIC EN TÊTE DE « CE QUI PRESSE » (23/10 — `src/cockpit-vue.js` (squelette : `#ck-vue-cave` entre Terrain et Économie ; `htmlTete` : la bascule à trois positions, le point `ck-b-pt` ; `majResume` : la cave dans la phrase du haut ; `RANGS.c` ; `choisirMode` à trois positions ; pièces neuves `cvCuveSvg`, `cvFut`, `cvVerdict`, `cvPlan`, `cvSemaine`, `cvMil`, `cvFil`, `cvSavoir`, `majCave`, `cvFiltrer`, `cvTip`, `cvCacherTip`, `allerCave` ; `INFO.cv*`) · `src/pilotage.js` (`_pilCk2Cave` neuf, appelé dans `_pilCk2Modele` — les deux montages REF-1 / VIF-1 restent mot pour mot ; `window._pilCaveAller` ; `_PIL_PERSO_DEFS.auj` : « La Cave — la vue de la bascule… » et `auj_cave_sv`) · `src/cave.js` (`_caveSynthese` + `window._caveSynthese` ; `_mlDiagForts` ; `_mlVerdict` : `ctx.diag` en tête ; `_aujRender` le passe) · `src/diagnostic.js` (`window._dgnSynthese`) · `src/styles.css` (bloc ★★ CAVEPIL-1, après CAVEAUJ-2) · `src/charte.css` (`--vin-liq`, `--vin-surf`, `--vin-chai`, `--bulle`, `--bois`, `--bois-pale`, `--inox-corps`, `--inox-reflet`, `--froid`, `--froid-doux`, clair et deux sombres) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Pilotage, MV_INFO `cave.auj`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `guide/08-cave.html` · `scripts/mv-harnais-cavepil1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/CAVEPIL-1.json` · **APP 9.94 → 9.95, SW 10.73 → 10.74**, base `a55f462`)

### 436a. D’où ça vient
Nico (22/10) : « est-ce qu’il est possible de faire la maquette de l’introduction du module cave dans le module de pilotage ? Fais un truc pro ». Mesuré sur le code : depuis CAVE-3 (§96, l’onglet Cave du Pilotage rendu à la Cave), la vue montée d’Aujourd’hui (REF-1) ne montrait **plus rien** de la cave — la petite carte « Cave » du cockpit de secours n’avait pas suivi, et « Choisir les indicateurs » proposait encore « La Cave — ce qui presse », sans effet. Objectif confirmé (« oui ») : voir d’un coup d’œil, depuis l’écran d’arrivée, où en est la cave, **sans refaire l’Aujourd’hui du maître de chai**. Maquette HTML (hors dépôt : `maquette-pilotage-cave.html`, vrais chiffres de la démo au 22/10, quatre situations, téléphone et ordinateur, clair et sombre) ; « go », « il faut que ça soit exactement comme la maquette ».

### 436b. Ce qui change
- **La bascule passe à trois vues** : Terrain · **Cave** · Économie (la Cave seulement si le module est ouvert et la vue cochée ; Économie seulement avec un taux, comme avant). Un **point** sur « Cave » quand la cave presse — orange : un geste attendu ; rouge : une alerte (fermentation qui ralentit, malo bloquée, signe fort au Diagnostic). La **phrase du haut** la nomme (« …, et 2 cuves à mesurer en cave. ») ; touchée, elle ouvre la vue (`data-fn="cave"`, `allerCave`). Une **ligne Cave** s’ajoute dans « À savoir » de Terrain (prio 2 : jamais comptée dans les « points à anticiper »), « Voir la cave ».
- **La vue Cave**, au dessin de la maquette : à gauche **Ce qui presse en cave** (le verdict de la Cave **mot pour mot**, sa pastille Prioritaire / À faire / À jour, les gestes des quatre semaines en trois chiffres) et **Le millésime** (la chaîne `_mlChaine` en une barre : vendu en raisin, en cuve, au chai, en bouteille ; le rendement quand tout est décuvé ; liens Le millésime et Coût par bouteille → Économie › Revient) ; au milieu **La cave en direct** (chaque cuve suivie dessinée selon sa matière — inox ou bois —, son niveau d’après les caisses, des bulles quand elle fermente, un flocon en macération ; chaque cuvée avec un rond par fût ; les bouteilles ; couleurs d’état, légende qui filtre, bulle au survol) et **La cave dans la semaine** (les journées de cave du Planning face aux gestes de la Cave ; « Les 2 soutirages et 1 ouillage n’ont pas encore de journée de cave au planning » ; la semaine suivante et les deux d’après) ; à droite, collés, **En direct** (qui est en cave aujourd’hui, puis `_aujRecents`) et **À savoir** en cave.
- **Aucun bouton de geste** : chaque ligne porte `data-cave`, la porte `_pilCaveAller` (Cave › Aujourd’hui, Le Cuvier, Le Chai, la fiche d’une cuvée, le Diagnostic, Le millésime, le Planning, Économie › Revient). C’est la différence avec l’Aujourd’hui du maître de chai — et ce qui évite le doublon que CAVE-3 avait retiré.
- **Une seule définition** (CAVE-3) : la Cave s’expose en lecture (`_caveSynthese` : verdict, agenda, cuves suivies `_vendSuivie`, cuvées avec `_aujOuillageEtat` et `_aujMalo`, bouteilles, `_aujRecents`) ; le Diagnostic aussi (`_dgnSynthese` : `recalc` puis `statutListe`, sur toutes les cuvées, sans dessin). `_pilCk2Cave` ne fait que mettre en forme.
- **Un signe fort du Diagnostic passe en tête du verdict**, dans la Cave comme dans le Pilotage (décision sur maquette) : `_mlVerdict` reçoit `ctx.diag` (`_mlDiagForts` : signes forts, cuvées non mises en bouteille) ; `_aujRender` le passe.
- « Choisir les indicateurs » : `auj_cave` devient « La Cave — la vue de la bascule Terrain / Cave / Économie » (le libellé garde « La Cave », gardé par `mv-harnais-cave-mil`) ; neuf, `auj_cave_sv` « Les points de cave dans « À savoir » ».

### 436c. Écarts avec la maquette (décidés pour rester d’accord avec la Cave)
La pastille et le texte du verdict sont ceux de la Cave (la maquette disait « À faire aujourd’hui ») ; les pastilles sont celles de l’appli (`.mvpas`, coins de 4 px) ; le temps en cave se compte **en jours** (journée 1, demi ½ — `CONFIG.cave_jours`), pas en heures (il faudrait l’intérieur du Planning) ; la Cuve 7 décuvée dont la fermentation finit en fûts est « À mesurer » (l’agenda de la Cave rattache le relevé à la cuve) ; pas de marque « fleur » sur un fût (aucun chemin simple vers la dégustation par fût) ; « environ » au lieu de « ≈ » (hors de la police, `mv-harnais-subset`).

### 436d. Trouvé en route (corrigé)
- `mv-harnais-robustesse-pilotage` : sur des domaines tirés au hasard, `c.tonneaux` (et `c.parcelles`) n’est pas toujours une liste — la première `_caveSynthese` plantait la vue. Lues seulement si ce sont des listes.
- `mv-harnais-ref1` grave mot pour mot les deux montages du cockpit : la vue Cave se calcule DANS `_pilCk2Modele`, les montages restent intacts.
- `mv-harnais-jetons` : l’ombre de la bulle a son repli.
- `mv-harnais-typo` : `cockpit-vue.js` passe de 134 à 156 Ko (+16 %) ; découpage examiné — la vue Cave partage l’état et les briques du cockpit (`S`, `V`, `entete`, `btnI`, `choisirMode`) : la sortir ferait un second module couplé. Référence regravée.
- Démo (non corrigé ici, hors du lot) : le Gevrey-Chambertin VV ’23 mis en bouteille porte sa date dans `date_bouteille` (`src/app.js`, ligne 2315) ; l’appli lit `date_embouteillage` — le Diagnostic le range « en cours ».

### 436e. Vérifié
`mv-harnais-cavepil1` 26/26 + 12 contre-épreuves ; `mv-harnais-robustesse-pilotage` 12/12 (après la correction des listes) ; `mv-harnais-ref1`, `mv-harnais-cave-mil`, `mv-harnais-jetons`, `mv-harnais-typo` verts après correction ; preflight vert. Chaîne complète (`npm run check`, 509 commandes) verte. Deux rouges en route, corrigés : `mv-harnais-ref1` (le modèle, calculé dans `_pilCk2Modele`, appelait `_pilCk2Cave` hors du bac à sable du harnais → `typeof`) et une contre-épreuve d’`mv-harnais-anticipe1` (la phrase d’ANTICIPE-1 gardée mot pour mot, la cave ajoutée après). Appli construite et capturée sur la démo (ordinateur 1440 et téléphone 390, clair et sombre) : la bascule Terrain · Cave · Économie avec son point, la phrase « 4 jours de retard, 1 point à anticiper, et 2 cuves à mesurer en cave. », la ligne Cave dans « À savoir » ; la vue Cave — « 2 cuves à mesurer aujourd’hui. », 3 cuves, 43 fûts, 4 points à savoir, 12 gestes —, aucun débordement ; la bulle au survol, la légende qui filtre, la phrase du haut et « Ouvrir la cuvée » (Cave › Le Chai) jouent ; aucune erreur hors du réseau coupé du bac à sable. Corrigé au vu des captures : la contenance d’une cuve se lisait dans `volume_hl` — le volume logé, chaque cuve paraissait pleine — ; elle vient du nom de la cuve (« inox 120 hL »), sinon du volume ; un point doublé après une date abrégée (« le 4 oct.. ») ; le Diagnostic comptait la cuvée mise en bouteille mal datée de la démo et disait « aucune analyse » avec « dernière analyse le … » ; une semaine sans journée de cave disait « 0 jour ». Tutos : aucun concerné ; le panneau côte à côte rejoué (1280, 1536, 1920), vert.

### 436f. Reste
La marque « fleur » par fût (la dégustation par fût de DIAG-2 n’est pas lue par la vue) ; les heures de cave (au lieu des jours) si Nico les veut ; la date de mise en bouteille de la démo (`date_bouteille` → `date_embouteillage`).

## 437. ★★ CAVEPIL-2 — PILOTAGE › VUE CAVE : LA FLEUR, LE PIQUÉ ET L’OXYDÉ SUR LE FÛT GOÛTÉ (23/10 — `src/cave.js` (`_caveSignesFuts` neuf, `_CAVE_SG`, `_CAVE_SG_ORDRE` ; `_caveSynthese` : `signes`) · `src/pilotage.js` (`_pilCk2Cave` : `futsD`, `sgRes`, `sgCv`, la ligne « Dégustation » de la bulle) · `src/cockpit-vue.js` (`CV_SG`, `cvSgSvg`, `cvFut(sg)`, `cvSgIcone`, `cvSgRes`, `CV_FUTS`, `cvTip` : la bulle d’un fût ; légende ; `INFO.cvplan`) · `src/styles.css` (bloc ★★ CAVEPIL-2) · `src/charte.css` (`--sg-fleur`, `--sg-fleur-trait`, `--sg-fleur-coeur`, `--sg-marque`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-cavepil2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/CAVEPIL-2.json` · **APP 9.95 → 9.96, SW 10.74 → 10.75**, base `4bb3ff0`)

### 437a. D’où ça vient
Reste de CAVEPIL-1 (§436f) : la marque « fleur » sur un fût. Nico (23/10) : « l’idée de la fleur sur le fût, c’est pas trop mal » ; puis : « lorsque j’ai entonné, je mets le fournisseur, l’année et la référence du fût. Donc on peut mettre le sigle fleur ou piqué ou oxydé sur un fût ». Objectif confirmé (« c’est exactement ça »), maquette HTML (hors dépôt : `maquette-pilotage-cave-signes.html`), « go ». Au passage, sur les heures de cave : « non » — la cave se compte en journée ou en demi-journée ; la demi-journée retire les heures prévues au planning sur ce matin ou cet après-midi : c’est déjà la règle (`_planCaveH`, JCAVE-1 §428 : de la prise à la coupure, de la coupure à la fin ; la moitié du jour quand le planning n’a pas de coupure).

### 437b. Ce qui change
- Dans « La cave en direct », le rond du fût goûté porte, dans son coin, le signe de sa **dernière dégustation** : **fleur** (pétales), **piqué** (triangle), **oxydé** (disque à moitié plein) — la forme les distingue, pas seulement la couleur. Les ronds suivent l’ordre des lignes d’entonnage.
- `_caveSignesFuts` (cave.js, pure) : la dégustation désigne le fût par la clé de `_copDgFutKey` (année, tonnelier, référence) ; chaque ligne garde le signe de SA dernière dégustation, et une plus récente qui ne le note plus l’efface ; « Volatile » → piqué, « Oxydatif » → oxydé, « Fleur en surface » → fleur ; plusieurs signes : le plus grave sur le rond (piqué, oxydé, fleur), tous dans la bulle ; une ligne de plusieurs fûts sous la même référence porte le signe sur **un seul rond**, la bulle donne le repère noté ; une dégustation de toute la cuvée donne un **signe de cuvée** (sur la ligne, jamais sur un rond).
- Au survol d’un fût : sa référence, ses signes, la date et qui a goûté (`[data-fut]` passe avant la bulle de la cuvée). Sous les fûts, une ligne liste les signes et les références (le téléphone n’a pas de survol). La légende « Signes de la dernière dégustation » ne paraît que s’il y en a un.
- Le signe ne change pas la couleur de l’état : elle reste celle de la Cave (une cuvée avec un fût oxydé peut rester « À jour »).
- Une cuvée d’avant les lignes d’entonnage (`nb_tonneaux` seul) garde ses ronds sans signe : `_pilCk2Cave` ne dessine fût par fût que si les lignes donnent le compte exact.

### 437c. Vérifié
`mv-harnais-cavepil2` 18/18 + 9 contre-épreuves ; `mv-harnais-cavepil1` reste vert (26 + 12). Chaîne complète (`npm run check`) verte : les commandes 1 à 205 puis, la chaîne coupée par le bac à sable, reprise par `--depuis mv-harnais-recup.mjs` jusqu’au bout (441 commandes, 0 rouge), sur les mêmes sources. Appli construite et capturée sur la démo (ordinateur et téléphone) avec des dégustations posées par l’outil de capture (rien d’enregistré) : le Gevrey-Chambertin VV ’25 porte la fleur sur T25-013 et T25-015 et le piqué sur un fût du lot FF23 (« 3e fût du rang »), le Bourgogne Pinot Noir ’25 R24-104 oxydé ; la ligne des signes, la légende et la bulle d’un fût jouent (un fût non goûté du lot FF23 dit « aucun à la dernière dégustation ») ; aucun débordement, aucune erreur hors du réseau coupé. Tutos : aucun concerné ; le panneau côte à côte avait rougi (« l’anneau doré n’est pas visible ») pendant que la chaîne tournait en parallèle — rejoué à vide, vert aux trois tailles.

### 437d. Reste
`date_bouteille` de la démo (`src/app.js` l. 2315 → `date_embouteillage`).

## 438. ★ CAVEAUJ-3 — CAVE › AUJOURD’HUI : UN BOUTON FIN PAR GESTE, À DROITE DU NOM ; L’ALERTE ET LE RELEVÉ DÛ NE FONT PLUS QU’UN « RELEVER » (23/10 — `src/cave.js` (`_AUJ_GESTE` neuf, `_aujLigne` ; `_aujRender` : les deux boutons du bas ; `_aujRecentsHtml` : « Tout voir ») · `src/styles.css` (bloc ★★ CAVEAUJ-1 : la ligne `.caj-l` en zones, `.caj-lc`, `.caj-acts`, `.caj-b` et sa zone de toucher, `.caj-l.plus`, `.caj-ctas`, `.caj-ctan`) · `src/utils.js` (APP, WHATS_NEW, MV_AIDE Cave) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-caveauj3.mjs` (neuf) · `scripts/mv-harnais-cave-auj.mjs` · `scripts/mv-harnais-caveauj1.mjs` · `scripts/mv-harnais-caveauj2.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVEAUJ-3.json` · **APP 9.96 → 9.97, SW 10.75 → 10.76**, base `85b2d19`)

### 438a. D’où ça vient
Nico (23/10, capture de son téléphone, Cave › Aujourd’hui à 08:31) : « Les boutons ici sont beaucoup trop grossiers, c’est une application professionnelle, tu es expert en ergonomie et expérience utilisateur ». Objectif reformulé puis confirmé (« parfait »). Vu dans le code : au téléphone, le jeu commun met tout bouton en taille terrain (48 px, CHARTE-3 §370) et `#page-cave .caj-acts .mvbtn{ flex:1 1 0; }` l’étirait sur toute la largeur — treize gestes, treize gros boutons empilés ; et la ligne « Petite Chapelle + Perrières » portait deux « Relever » qui ne faisaient pas la même chose : celui de l’alerte (`_mlGo('alerte')`) ouvrait seulement l’onglet Cuves du Cuvier, celui du relevé dû ouvrait la fenêtre du relevé. Maquette avant/après sur un canevas de conception (hors dépôt : https://claude.ai/artifact/AJGCvHfRvUvMw9hvVN3vDJ), faite de **vrais rendus de l’appli construite**, pas de dessins : les quatre lignes de la capture, rendues avec le code d’avant, reproduisent la capture jusqu’à la coupure de ligne — la preuve que la méthode est juste —, puis avec le code d’après ; la carte de la démo au téléphone (clair, sombre) et sur ordinateur. « Ok […] go ».

### 438b. Ce qui change
- **Un bouton par geste réel.** `_AUJ_GESTE = {alerte:'mesure'}` : une alerte de cuve (fermentation qui ralentit, température haute, sucres du labo qui stagnent ou remontent) se contrôle par un relevé, et la fenêtre du relevé (`openOvVendMesure`) porte aussi les sucres du labo (`vm-gf`, GF-1). `_aujLigne` dédoublonne les gestes d’une ligne sur ce geste réel : alerte + relevé dû → un seul « Relever », qui ouvre la fenêtre du relevé ; une alerte seule aussi (avant : l’onglet Cuves seulement). Toutes les raisons restent affichées. `_mlGo('alerte')` n’est pas touché : ses autres appelants gardent leur conduite.
- **Taille compacte du jeu commun** (`mvbtn-compact`, 28 px, 13 px) au lieu de la taille terrain, jamais étirée. La ligne passe en **zones de grille** (`grid-template-areas`, `.caj-lc{ display:contents; }`) : au téléphone, le geste est sur la ligne du nom (premier rang de 28 px au moins, nom centré), le détail et les raisons passent dessous sur toute la largeur — un détail long (« Vieilles Vignes 2026 · décuvée, FA en fût ») ne se coupe plus sous le bouton ; sur ordinateur, le geste se centre sur le nom et le détail, et la hauteur des lignes ne bouge pas (87 px sur la démo).
- **Plusieurs gestes** (`.caj-l.plus`) : au téléphone, la rangée de boutons passe sous les raisons, à droite (le nom n’est pas écrasé) ; sur ordinateur, à droite du nom, côte à côte.
- **La zone de toucher** : `.caj-b::before` déborde de 8 px au-delà du filet en haut et en bas, de 4 px sur les côtés — 44 px de haut pour un bouton de 28. Deux boutons voisins se partagent l’écart, sans zone morte ni chevauchement.
- **Le bas de la carte** : « Faire la tournée » et « Nouvelle opération » en taille bureau (36 px) ; au téléphone, chacun prend sa ligne quand ils ne tiennent pas côte à côte. « · 2 cuves » est recollé au libellé (l’écart de 8 px du bouton, moins 4). « Tout voir » des derniers gestes passe en compact, comme celui de l’Accueil (`hk-plus`).
- **Mesuré** (démo, téléphone 390 px) : une ligne à un geste passe de 148 à 96 px, la ligne à deux gestes de 168 à 151 px, les deux boutons du bas de 48 à 36 px ; les quatre lignes de la capture de Nico, de 683 à 474 px.

### 438c. Vérifié
`mv-harnais-caveauj3` 17/17 + 12 contre-épreuves. Restent verts après mise à jour de leur motif de bouton (la classe porte maintenant `mvbtn-compact`) : `mv-harnais-cave-auj` 57/57, `mv-harnais-caveauj1` 21 + 10, `mv-harnais-caveauj2` 19 + 10 ; `mv-harnais-cavepil1` (26 + 12) et `mv-harnais-cavepil2` (18 + 9) verts. Appli construite et capturée (démo ; et les quatre lignes de la capture de Nico injectées dans la vraie carte, à 411 px) : avant, la capture est reproduite à l’identique ; après, un seul « Relever » sur Petite Chapelle + Perrières, qui appelle `_mlGo('mesure','…')` ; clair et sombre, téléphone et ordinateur, aucun débordement. Zone de toucher mesurée au navigateur (`elementFromPoint`, téléphone 390 px) : 6 px au-dessus et 7 px au-dessous du bouton tombent sur lui, 10 px non ; entre « Ouiller » et « Soutirer », la moitié gauche de l’écart va à l’un, la moitié droite à l’autre.

### 438d. Reste
- Vu, pas touché : « Dernier relevé il y a 9 j » porte un point bleu (le type du geste, celui de la légende du calendrier) et un texte rouge (le retard) — deux codes de couleur sur une même ligne. À trancher avec Nico.
- La règle « une action de ligne est compacte et à droite » vaut pour les autres listes de l’appli qui empilent des boutons de terrain : à inventorier écran par écran, si Nico le veut.

## 439. ★ PIL-RANGE-1 — PILOTAGE › AUJOURD’HUI : LE COCKPIT D’ABORD, L’ANCIEN ORDRE N’EST PLUS CALCULÉ POUR RIEN (23/10 — `src/pilotage.js` (`_pilTabAuj` réécrite en deux temps, `_pilTabAujAncien` neuve, corps inchangé) · `scripts/mv-harnais-pilrange1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-1.json` · **APP 9.97 et SW 10.76 inchangés** (module JS seul, rien de visible), base `cff51e0`)

### 439a. D’où ça vient
Nico (23/10, dicté) : « Il faut absolument ranger le module pilotage et ranger le module cave. Il faut que ça soit parfait, intuitif, que les informations coulent de source et qu’il n’y ait pas d’erreur dans les calculs. Revérifie l’intégralité de ces modules. Fais de la proposition via maquette HTML. » Objectif reformulé et confirmé (« go »), puis deux maquettes validées le même jour (`maquette-pilotage-range-v1.html`, `maquette-cave-rangee-v1.html`, hors dépôt) avec les arbitrages : Pilotage — L’année supprimée (budget → Économie, renfort → Équipe, cadre → portée), donut + « où va le temps » fusionnés, Archives en bout de barre ; Cave — fiche de cuvée unique ouverte à côté de la liste, Diagnostic gardé en onglet. Rapport : `audit-pilotage-cave-2026-10-23.md` (hors dépôt).

L’audit a mesuré, avant de toucher au code, que **trois générations d’Aujourd’hui coexistaient** : les tuiles d’avant (`_pilTabAuj` construisait TOUT leur HTML — marge, inaction, KPIs, décision du jour, alertes — à chaque affichage), `cockpit.js` (AUJ-1, 54 ko, jamais atteint puisque `cockpit-vue.js` est toujours importé), et `cockpit-vue.js` (REF-1, ce que l’admin voit). Le `return window._ck2Squelette()` arrivait APRÈS la construction : tout était calculé, puis jeté, sur l’écran d’arrivée de l’admin.

### 439b. Ce qui a été fait
`_pilTabAuj(d)` ne fait plus que : la marge (`_pilMargeCalc`), la photo du jour (`_pilPhotoEcrire`, PHOTO-1), puis **le cockpit v2 d’abord** (`_pilCk2Modele`, `_pilCk2Eco`, montage différé, `return _ck2Squelette()`). L’ancien ordre vit dans `_pilTabAujAncien(d,m)` — corps strictement inchangé, `m` reçu — et n’est **atteint que si `cockpit-vue.js` manque ou lève** (l’écran ne reste jamais blanc, règle AUJ-1). Rien ne change à l’écran : même squelette, même modèle, même montage.

### 439c. Pourquoi si petit — le lot mesuré avant d’être écrit
Retirer l’ancien ordre pour de bon n’est pas dix lignes : **15 fonctions** perdraient leur dernier appelant (`_pilCkAlertes`, `_pilCkBudget`, `_pilCkCave`, `_pilCkEtp`, `_pilCkInaction`, `_pilCkJours`, `_pilCkPres`, `_pilCkPrio`, `_pilCkTension`, `_pilCkTraiter`, `_pilCockpitTimeline`, `_pilMargeSous`, `_pilSparkCadence`, `_pilSparkCharge`, `_pilTuileTension`, puis ce qu’elles sont seules à appeler, jusqu’au point fixe de C15), **14 harnais** les extraient par leur nom (`tension`, `align`, `protection`, `spark`, `info`, `etiquettes`, `prio`, `gnr2`, `gnr-mesure`, `auj1`, `auj6`, `photo`, `cave-mil`, `pil-coherence`), **22 harnais** lisent `src/cockpit.js`, et les fiches « i » des cartes retirées deviendraient orphelines. C’est **PIL-RANGE-1b**, un lot à part : les fonctions, `cockpit.js` (sortie d’`app.js`, bump SW) et la migration de leurs harnais, ensemble.

### 439d. Harnais
`mv-harnais-pilrange1.mjs` (17 vertes) **exécute** `_pilTabAuj` dans un bac à sable où chaque bâtisseur compte ses appels : v2 présent → squelette v2, modèle bâti une fois, aucun bâtisseur de l’ancien ordre appelé, `_ckAuj` jamais appelé ; photo et marge une fois ; v2 absent → `_pilTabAujAncien` prend le relais avec la même marge (au moins six bâtisseurs, `_ckAuj` rend) ; v2 et secours absents → l’ancien HTML lui-même ; v2 qui lève → repli, erreur avalée par `_mvAvale`, jamais vide ; `_pilTabAuj` ne contient plus aucun `_pilCk*` ni tuile ; la liste le joue. Un plantage du montage compte rouge. 5 contre-épreuves mordent (ancien ordre remis devant, repli retiré, photo non écrite, marge recalculée, liste qui ne le joue plus). Preflight identique base → patché (0 erreur, 13 avertissements). Les 14 harnais de l’ancien ordre et les 8 `auj*` restent verts : ils testent des fonctions encore en place.

### 439e. Ce qui reste (l’ordre des lots, validé par Nico le 23/10)
1. **PIL-RANGE-1b** — l’ancien ordre et `cockpit.js` retirés, leurs harnais migrés (ci-dessus).
2. **PIL-FIX-1** — la marge en jours : `_pilWdBetween`/`_pilWdDateObj` comptent lundi→vendredi du calendrier, **fériés compris, planning ignoré** (prouvé par `audit-marge-jours.mjs`, hors dépôt : 23 oct → 15 nov = 15 jours, le 11 novembre travaillé), alors que `_pilJourDomaine` sait lire le planning et `_feriesY` les fériés. Règle de Nico (10/10) : le planning. Visible → `MV_INFO` `pil.marge`, `WHATS_NEW` niv 2, bump APP + SW.
3. **PIL-RANGE-2** — la portée unique (campagne · année vigne · exercice) et la fin de L’année (migration `_PIL_TAB_MIGR` `an` → `eco`), aide, guide 11, visite guidée.
4. **PIL-RANGE-3** — Travaux (6 → 4 cartes), Équipe (présence + capacité en une carte, renfort venu de L’année).
5. **PIL-RANGE-4** — Économie (Exercice → portée, 6 → 5 sous-vues) ; « Afficher dans cet onglet » d’Aujourd’hui réduit aux cartes qui existent (17 cases sur 21 ne font rien aujourd’hui : le cockpit v2 ne lit que `auj_cave` et `auj_cave_sv`), branché sur `cockpit-vue.js`.
6. **CAVE-FIX-1** — la part des anges : `pctAn` est écrit « %/an » sans être annualisé (`cave.js` l. ≈ 6898 et 7091 ; un millésime entonné depuis trois mois affiche un taux quatre fois trop bas).
7. **CAVE-RANGE-1 à 3** — la portée millésime ; la fiche de cuvée unique (Chai › Cuvées ; Millésime › Cuvées la rejoint) ; Courbes → Cuvier › Cuves (mode Liste · Courbes), Le Millésime à deux onglets.

Dette notée : `mv-harnais-rendement.mjs` est orphelin (cherche `_vendCfg` dans `cave.js`, elle vit dans `cuvier.js` depuis CUV-DEC ; hors chaîne) ; `mv-harnais-audit-pil` porte quatre rouges anciens, pas deux ; `_PIL_VALID_TAB` garde `cav` alors que `_PIL_TAB_MIGR` le migre.
