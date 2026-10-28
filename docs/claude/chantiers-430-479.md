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

## 440. ★ PIL-FIX-1 — PILOTAGE : LES JOURS OUVRÉS SE COMPTENT SUR LE PLANNING (MARGE, FIN À LA CADENCE, ÉCHÉANCES) ; LE RETARD NE PERD PLUS UN JOUR (23/10 — `src/pilotage.js` (`_pilPrevuLe` : le férié ; `_pilJourDomaine` : le repli ; `_pilFerieLe`, `_pilJourCalendrier`, `_pilSaisiAuTravail`, `_pilCompteurOuvre`, `_PIL_MUET_J` neufs ; `_pilWdDateObj`, `_pilWdBetween` réécrites) · `src/utils.js` (APP, WHATS_NEW niv 2, `MV_INFO` `pil.marge`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-pilfix1.mjs` (neuf) · `scripts/mv-harnais-direct2.mjs`, `etat1`, `hors1`, `forme1`, `ref1`, `pil-coherence` (bacs à sable complétés) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-FIX-1.json` · **APP 9.97 → 9.98, SW 10.76 → 10.77**, base `3e4590c`)

### 440a. D’où ça vient
Audit du rangement (§439, défaut P6) : `_pilWdBetween` et `_pilWdDateObj` testaient `getDay()` et rien d’autre. Le 11 novembre et le 25 décembre étaient des jours de marge ; les vendredis chômés de l’annualisation aussi — le modèle intégré 2026 (`PLAN_DEF.standard`) ne travaille que deux vendredis sur quatre en novembre et aucun en décembre. Pendant ce temps `_pilJourDomaine` (AUJ-5, §307) savait lire le planning pour l’Effectif. Deux définitions d’« un jour ouvré » dans le même module, et la règle de Nico (10/10) : « il faut toujours se baser sur le planning ». Nico a validé l’ordre des lots le 23/10 (« on suit tes recommandations ») et lancé ce lot (« suite »).

### 440b. Ce qui a été fait
- **Un jour ouvré = un jour où le domaine travaille au planning** : `_pilWdBetween` et `_pilWdDateObj` demandent chaque jour à `_pilJourDomaine` (une personne hors bureau, sous contrat, prévue ou saisie au travail), mémorisé par appel (`_pilCompteurOuvre`). La marge d’Aujourd’hui, la fin à la cadence et les « N j » des Échéances par tâche lisent la même règle que l’Effectif.
- **Le férié** (`_pilPrevuLe`) : il n’est « prévu » que si la personne y est **saisie au travail** — comme l’écran du planning, qui l’affiche « férié » sans saisie (`_planDayStatus`). Le modèle recalé d’une année sur l’autre peut poser des heures sur un férié (le 11 novembre 2027 tombe sur le 2ᵉ jeudi, travaillé en 2026, `_planRecaleMap`) : elles ne font ni une présence ni un jour ouvré. Les fériés viennent de `_feriesY` (fixes et mobiles, la table de l’écran).
- **Les replis** : sans équipe ou sans planning chargé, lundi→vendredi **fériés retirés** (`_pilJourCalendrier`). Un planning **muet** 45 jours de suite (des membres sous contrat, personne de prévu) n’est plus lu comme une fermeture : le compte repasse au calendrier, sinon `_pilWdDateObj` courait 4 000 jours.
- **Le sens « retard »** : `_pilWdBetween` marchait à reculons et comptait [objectif, fin) ; les deux sens comptent maintenant la même chose — les jours travaillés après la date la plus tôt, jusqu’à la plus tardive comprise. Un objectif posé un dimanche (le 15 novembre 2026) et une fin un mardi donnaient 1 jour de retard ; c’est 2. Une fin un dimanche après un objectif le vendredi : à l’heure, plus « 1 jour de retard ».
- `chantier` (fenêtre de chantier) inchangé : 7 j/7 dans `_pilWdDateObj`.
- Textes : `MV_INFO` `pil.marge` (« jours travaillés au planning », plus « lundi à vendredi »), guide 11 (Charge restante, Échéances), `WHATS_NEW` 9.98 en **niv 2** (« À vérifier » : le chiffre lu chaque matin a pu bouger).

### 440c. Harnais
`mv-harnais-pilfix1.mjs` (29 vertes) **exécute** les vraies fonctions (pilotage.js + `_feriesY`/`_mvEasterMD` de planning.js) sur le **vrai modèle 2026** lu dans planning.js : 23 oct → 15 nov = 14 jours, recomptés à part sur le modèle (15 avant) ; 11 novembre, Noël et un vendredi chômé de novembre ne comptent pas ; un férié avec heures au modèle sans saisie non, avec saisie oui, saisi sans heures non, saisi au bureau non ; samedi saisi au travail oui ; replis sans équipe et sans planning (fériés retirés, Noël → jour de l’An = 4) ; symétrie du signe ; retard mardi/dimanche = 2, fin dimanche/objectif vendredi = 0 ; le N-ième jour ; chantier 7 j/7 ; planning muet borné ; branchements de la marge et des échéances ; fiche « i » ; WHATS_NEW niv 2 à la version de l’appli ; liste. 10 contre-épreuves mordent. Six harnais extrayaient `_pilPrevuLe`/`_pilJourDomaine`/`_pilWdBetween` à l’unité : leurs bacs à sable reçoivent les trois aides (et `pil-coherence` le compteur, sans MEMBRES : lundi→vendredi, ce qu’il a toujours supposé) ; tous verts avec leurs contre-épreuves. `pil-coherence --contre` sort 1 sur la base comme après (hors chaîne, inchangé).

### 440d. Ce qui reste
L’ordre de §439e, sans PIL-FIX-1 : PIL-RANGE-1b, PIL-RANGE-2 à 4, CAVE-FIX-1, CAVE-RANGE-1 à 3. Noté en passant : la fenêtre de chantier compte 7 j/7 dans `_pilWdDateObj` mais `_pilWdBetween` l’ignore (asymétrie d’origine, gardée) ; à trancher avec Nico si une vendange tombe dans la marge.

## 441. ★ PIL-RANGE-1b — PILOTAGE : L’ANCIEN AUJOURD’HUI RETIRÉ (41 FONCTIONS) ; LA CARTE DU TRACTEUR RELOGÉE DANS ÉQUIPE & MATÉRIEL › MATÉRIEL (23/10 — `src/pilotage.js` (`_pilTabAuj` : repli = message ; `_pilTabAujAncien` et 19 fonctions retirées ; `_pilTabMat` : la carte du tracteur ; `_PIL_PERSO_DEFS.equ` + `mat_travaux` ; `_pilFillContent` ; titre « Gasoil après les travaux ») · `src/cockpit.js` (`_ckAuj` et 20 aides retirés, les 13 lectures du v2 gardées) · `src/utils.js` (APP, WHATS_NEW niv 1, 9 fiches `MV_INFO` retirées, `pil.trxgnr`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · 27 harnais migrés (`align`, `auj1`, `auj2`, `auj3`, `auj6`, `auj8`, `cave-mil`, `caveauj1`, `chant1`, `dates1`, `direct1`, `etat1`, `etiquettes`, `gnr-mesure`, `gnr2`, `hors1`, `info`, `photo`, `pil-coherence`, `pilfix1`, `pilrange1` (réécrit), `prol1`, `protection`, `ref1`, `sect1`, `spark`, `tension`) · `scripts/mv-harnais-auj4.mjs` (supprimé) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-1B.json` (l’outil de marque n’accepte que des majuscules) · **APP 9.98 → 9.99, SW 10.77 → 10.78**, base `90bd810`)

### 441a. D’où ça vient
Suite de PIL-RANGE-1 (§439c), dans l’ordre validé par Nico. La mesure au point fixe a changé le lot, et l’a arrêté avant toute suppression : (1) **correction de l’audit** — `cockpit.js` n’était pas « jamais atteint » : seul son rendu (`_ckAuj`) et ses aides l’étaient ; l’autre moitié nourrit le cockpit v2 (fil En direct, météo du jour, tracteur du jour, plan, lignes d’« À savoir ») ; (2) **une fonctionnalité invisible** — les cartes du tracteur (GNR-M §213, GNR-2 §256 : travaux tracteur en cours, révision pendant les travaux, cuve après les travaux, ligne « traitement » gardée éteinte le 03/10) ne s’affichaient plus nulle part depuis REF-1 (07/10) ; le nettoyage les aurait supprimées. Question posée en langage simple ; Nico : « A » (les reloger), maquette `maquette-materiel-tracteur-v1.html` (hors dépôt) validée « go ».

### 441b. Ce qui a été fait
- **Retiré** (point fixe sur `pilotage.js` + `cockpit.js`, roots = tous les autres fichiers + `index.html`, commentaires exclus ; contre-vérifié : **zéro référence vivante**) : `_pilTabAujAncien`, `_pilCkAlertes`, `_pilCkBudget`, `_pilCkCave`, `_pilCkEtp`, `_pilCkInaction`, `_pilCkJours`, `_pilCkPres`, `_pilCkPrio`, `_pilCkTension`, `_pilCkTraiter`, `_pilCockpitTimeline`, `_pilMargeSous`, `_pilPhotoSerie`, `_pilSpark{Budget,Cadence,Charge,Dernier,NOk}`, `_pilTuileTension` ; dans `cockpit.js` : `_ckAuj`, `_ckApres`, `_ckBasculeHtml`, `_ckChargeSvg`, `_ckDate`, `_ckEsc`, `_ckFilHtml`, `_ckHa`, `_ckJour`, `_ckMeteoCache`, `_ckPlan{Corps,Dispo,Initiales,Ouvrir,Periode,Svg,Tache}`, `_ckQuand`, `_ckResumeHtml`, `_ckSavoirHtml`, `_ckVue`. `pilotage.js` −32 Ko, `cockpit.js` 54 → 31 Ko.
- **Gardé dans `cockpit.js`** (lu par le v2) : `_ckFilDonnees`, `_ckTracJour`, `_ckMeteoJour`, `_ckPlanEtats`, `_ckPlanDebuts`, `_ckPlanTaches`, `_ckQui`, `_ckEt`, `_ckChargeSerie`, `_ckSvMeteo`, `_ckSvAbsences`, `_ckSvContrats`, `_ckSvRetards`.
- **Repli d’Aujourd’hui** : si le cockpit v2 manque ou lève, un message (« Le tableau de bord n’a pas pu s’afficher. Rechargez la page. »), jamais un écran blanc (AUJ-1), l’erreur avalée.
- **La carte du tracteur relogée** dans `_pilTabMat`, sous les trois panneaux, titre de section « Pour finir les travaux tracteur en cours », case `mat_travaux` dans « Afficher dans cet onglet » ; rien à dire → ni cartes ni titre ; erreur avalée sans perdre les panneaux. Calculs inchangés (`_pilCkTracteur` et les `_pilGm*`). Seul changement : la carte « Cuve GNR » de la projection devient **« Gasoil après les travaux »** (deux « Cuve GNR » l’une sous l’autre sinon). Les machines immobilisées ne reviennent pas ici : elles sont dans « À savoir » du v2.
- **Fiches « i »** : les 9 fiches de l’ancien écran (`pil.plan`, `pil.savoir`, `pil.fil`, `pil.charge`, `pil.marge`, `pil.spark`, `pil.tension`, `pil.inaction`, `pil.prio`) retirées — le cockpit v2 a sa propre table de bulles (`INFO` de `cockpit-vue.js`), c’est elle qu’on lit (`mv-harnais-info` exige que toute fiche soit posée). La bulle de la fin prévue (`INFO.fin`) disait déjà le planning : rien de faux n’était affiché avant PIL-FIX-1.
- Guide 11 (le tracteur, au bon écran), `pil.trxgnr` (titre), WHATS_NEW 9.99 niv 1. Le commentaire de section des cartes devient « Les cartes du tracteur (Équipe & matériel › Matériel) ».

### 441c. Les harnais
28 harnais lisaient l’ancien écran (22 trouvés par les noms de fonctions, 6 de plus par la chaîne : `sect1`, `prol1`, `auj8`, `chant1`, `dates1`, `caveauj1`, qui lisaient le repli de `cockpit.js` ou la fiche `pil.savoir` sur le texte). Règle suivie : **ce qui visait le retiré part, ce qui protège le vivant reste** — jamais un harnais supprimé pour faire vert. `auj4` (la bascule v1, 7 contre-épreuves toutes sur du retiré) est le seul supprimé. `pilrange1` réécrit (19 vertes, 11 contre-épreuves) : il exécute `_pilTabAuj` (v2, repli, erreur) et `_pilTabMat` (cartes, rien à dire, case décochée, erreur), et vérifie les retraits et les lectures gardées. Les autres gardent leurs vrais objets : fil et courbe (`auj1`), « À savoir » par ses quatre bâtisseurs (`auj2`), état des parcelles et débuts d’équipe (`auj3`), photo du jour (`photo`, `auj6` — borne déplacée sur `_friseNorm`), échelle des Archives (`etiquettes`), protection posée par Conformité (`align`, `protection`), carte de détail de la tension (`tension`), cartes du tracteur avec leur nouveau titre et le relogement (`gnr-mesure`, `gnr2` — bloc parti des aides GNR-M), kit SPARK (`spark`), textes portés sur les bulles du v2 (`auj1-3`, `auj8`, `etat1`, `hors1`, `sect1`, `pilfix1`), branchements lus sur le modèle v2 (`sect1`, `prol1`). `pilfix1` : l’assertion de version vise le bloc 9.98 (« APP au moins »), plus « la version de l’appli », qui avance à chaque lot. Contre-épreuves dont l’ancre a disparu avec le code : retirées une par une (outil d’ancres, hors dépôt).

### 441d. Ce qui reste
L’ordre de §439e : PIL-RANGE-2 (portée unique, fin de L’année), PIL-RANGE-3, PIL-RANGE-4 (dont les 17 cases mortes d’« Afficher dans cet onglet » d’Aujourd’hui — plus aucun lecteur depuis ce lot), CAVE-FIX-1, CAVE-RANGE-1 à 3. Dette notée : du CSS de l’ancien Aujourd’hui reste (`.pil-tz-*`, `.pil-tl*`, `.pil-ck-btn`, `.pil-cockpit-card`…) — à purger avec un harnais des classes orphelines.

## 442. ★ PIL-FIX-2 — CINQ CONTRÔLES ROUGES LIVRÉS PAR PIL-FIX-1 ET PIL-RANGE-1B, ET LA FAÇON DE LIRE LA CHAÎNE (23/10 — `index.html` (`boot.js?v=` 9.97 → 9.99) · `src/utils.js` (WHATS_NEW : titre 9.99 sans « & », cibles 8.32 et 8.35) · `public/sw.js` · `scripts/mv-harnais-echelle.mjs` · `scripts/mv-harnais-carte.mjs` · `scripts/banc/garde-projection.mjs` · `scripts/mv-harnais-prio.mjs` · `scripts/mv-harnais-auj1.mjs` · `scripts/tutos-couverture.json` (plafond 813 → 808) · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-FIX-2.json` · **APP 9.99 inchangé, SW 10.78 → 10.79**, base `15987be`)

### 442a. D’où ça vient — une erreur de vérification
Les livraisons de PIL-FIX-1 (§440) et PIL-RANGE-1B (§441) annonçaient « 515 commandes, 0 rouge ». C’était faux. La chaîne était jouée en trois tranches sous `timeout` ; les deux premières, coupées, **n’imprimaient jamais le bilan du lanceur** (les lignes « ✗ node … (code N) » ne sortent qu’à la fin), et seul le bilan de la dernière a été lu. Relu commande par commande puis rejoué sur le dépôt poussé (`15987be`), cinq contrôles étaient rouges :
1. `mv-harnais-tutos` (I) : `index.html` chargeait `boot.js?v=9.97` — les deux montées de version (9.98, 9.99) ne remplaçaient que `v9.97` → `v9.98`, pas `?v=`. **Le seul point qui touche les utilisateurs** (le fichier de démarrage pouvait rester en cache).
2. `mv-harnais-echelle` et 3. `mv-harnais-carte` : « `pil-cockpit-card` / `pil-dec` intact (visé par la visite guidée / C22) » — ces classes sont parties avec l’ancien Aujourd’hui ; aucun sélecteur de la visite ne les vise (src/ relu, C22 vert au preflight).
4. `mv-whatsnew-check` (ANN-1) : le titre 9.99 portait « & » (« Équipe & matériel ») ; les blocs 8.32 et 8.35 visaient `#ck-fil-pan` et `#ck-bascule`, ids du rendu de secours retiré.
5. `banc/garde-projection` : le site « KPI budget accueil » (`_pilCkBudget`) n’existe plus ; le balayage « aucun site projectif non gardé » reste.
Et, trouvés par le coureur (§442c) sur la première chaîne complète de ce lot : `mv-harnais-prio` plantait depuis PIL-RANGE-1B (il extrayait `_pilCkPrio`, la carte « Tâche prioritaire » retirée — oublié de la migration) ; migré : le moteur de la tâche du moment reste testé en entier, la section de la carte et ses deux contre-épreuves partent ; `auj1` suit la nouvelle cible 8.32 (`#ck-fil`). Et une contre-épreuve masquée : `tutos --contre` « un geste nouveau sans tuto » ne mordait que parce que la base était rouge ; le retrait de PIL-RANGE-1B avait fait baisser le compte des gestes sans tuto (813 → 808) sans abaisser le plafond — un geste neuf passait sous le plafond.

### 442b. Ce qui a été fait
`boot.js?v=9.99` ; titre 9.99 « Équipe et matériel » ; cibles 8.32 → `#ck-fil` (le fil En direct du cockpit v2), 8.35 → `#ck-vue-eco` (la bascule du v2) ; les deux noms retirés des listes protégées d’`echelle` et `carte` (avec la raison) ; le site disparu retiré du banc (avec la raison) ; plafond des gestes sans tuto à 808 (le cliquet). SW 10.79 (un fichier servi change), APP inchangé (rien de nouveau à l’écran).

### 442c. La règle qui change — lire le bilan, jamais le deviner
La chaîne est désormais jouée par un **coureur** qui écrit, pour chaque commande de `mv-harnais-liste.mjs` (et le preflight), son **code de sortie** sur une ligne (`/tmp/chaine.jsonl`), en fond, jusqu’au bout ; le bilan se lit sur ces codes. « 0 rouge » ne s’écrit que si toutes les commandes ont un code et que tous valent 0. Une tranche coupée ne prouve rien. À reporter en leçon dans `CLAUDE.md` (§24) : *une chaîne coupée par un délai n’a pas de bilan*. Et à chaque montée de version : remplacer **toutes** les occurrences de l’ancienne version dans `index.html` (`v9.9x` et `?v=9.9x`), ce que `mv-harnais-tutos` (I) vérifie.

### 442d. Ce qui reste
PIL-RANGE-2a (la barre « Vous regardez ») est écrit et mis de côté (correctif sauvegardé hors dépôt) ; il reprend après ce lot, sur la base qui l’intégrera.

## 443. ★ PIL-RANGE-2a — PILOTAGE : LA BARRE « VOUS REGARDEZ » (LA CAMPAGNE · L’ANNÉE VIGNE · L’EXERCICE) REMPLACE LE FIL D’ARIANE ; LE CADRE QUITTE L’ONGLET L’ANNÉE (23/10 — `src/pilotage.js` (`_pilCrumbHtml` réécrite ; `_pilPorteeMode`, `_pilPorteePeriodes`, `_pilPorteePeriode`, `_pilPorteeCampDefaut`, `_pilPorteeChoisir`, `_pilPorteeBornes`, `_pilPorteePopHtml`, `_pilAnAvisHtml` neuves ; `_pilAnCadreHtml` et `_pilAnDfrLong` retirées ; gestes `data-portee`, `data-ptpop`, fermeture hors liste ; gestes `#pil-cr-x/#pil-cr-root` et `data-ancadre` retirés ; styles injectés) · `src/styles.css` (3 règles `.pil-cr` mortes) · `src/utils.js` (APP, WHATS_NEW niv 1, `MV_INFO` `pil.cadres`, `MV_AIDE` « Choisir ce que vous regardez ») · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` (reconstruit) · `scripts/mv-harnais-pilrange2a.mjs` (neuf) · `scripts/mv-harnais-annee.mjs` · `scripts/mv-harnais-carte.mjs` · `scripts/mv-harnais-pil1.mjs` · `scripts/mv-harnais-etats1.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-2A.json` · **APP 9.99 → 10.00, SW 10.79 → 10.80**, base `db6d177`)

### 443a. D’où ça vient
Rangement du Pilotage (§439), maquette `maquette-pilotage-range-v1.html` validée par Nico (« on suit tes recommandations ») : une portée, en haut, lue par tout le module. PIL-RANGE-2 est découpé : **2a** (ce lot) pose la barre et sort le choix du cadre de L’année ; **2b** retirera l’onglet L’année (budget → Économie, renfort → Équipe, migration `an` → `eco`).

### 443b. Ce qui a été fait
- **La barre** (hôte `#pil-crumb`, dans `.pil-portee` collante) : « Vous regardez » · segment [La campagne | L’année vigne | L’exercice] · l’élément (le nom de la campagne, qui ouvre la liste ; ou l’année et ses flèches `data-anrecul`) · ses dates et « Nᵉ jour sur M » (jours du calendrier, comme la maquette) · la fiche `pil.cadres`. **Aucun état nouveau** : `_PIL_SCOPE` (camp, cadre, recul) par ses chemins (`_pilScopeSet`, `_pilCadreSet`, `_pilReculSet`, `data-etpc`).
- **« La campagne » sans campagne choisie** : la période active (`_pilSaison`), sinon celle en cours, sinon la dernière commencée.
- **La liste des campagnes** (`#pil-ptpop`) : la frise du cadre et ses puces (`_pilAnFriseCadre`, le zoom de toujours), calculée à l’ouverture (pas à chaque rendu : `_pilAnnuelData` coûte), fermée par un toucher ailleurs.
- **L’année** perd son bloc de cadre (segment, flèches, frise, titre) : elle garde ses avis (`_pilAnAvisHtml` : exercice à régler, année vigne aux mêmes dates que l’exercice, vendange à cheval sur deux exercices), puis budget et renfort.
- Téléphone : l’étiquette et les dates s’effacent (comme l’ancienne instruction du fil d’Ariane) ; la barre passe à la ligne.
- Fiche `pil.cadres` (titre et premier paragraphe : la barre), guide 11 (la barre ; la phrase des « trois écrans qui gardent leur cadre » conservée), WHATS_NEW 10.00 niv 1 (pastille sur `#pil-crumb`). `_cmpVer` compare par entiers : 10.00 > 9.99.
- Capture au navigateur (vraie feuille injectée `_pilCssV2`, vraies fonctions) : `capture-barre-vous-regardez.png` (hors dépôt).

### 443c. Harnais
`mv-harnais-pilrange2a.mjs` (24 vertes, 10 contre-épreuves) **exécute** `_pilCrumbHtml` et les fonctions de portée : segment marqué, flèches et dates de l’exercice (84ᵉ jour sur 365 le 23/10) et de l’année vigne (53ᵉ), campagne (39ᵉ jour sur 62), campagne disparue, exercice à régler, campagne par défaut (active, en cours, dernière commencée, choix gardé), écriture du cadre, dates (à venir, terminé, rien sans bornes), et sur le texte : gestes par la portée, liste remplie à l’ouverture et fermée ailleurs, plus de fil d’Ariane ni de cadre dans L’année, aucun état nouveau, styles et téléphone. `annee` (③ : les avis ; les sélecteurs passent par `data-portee` → `_pilCadreSet`) et `carte` (le téléphone efface étiquette et dates) suivent. La première chaîne complète (coureur, §442c) a trouvé six rouges, tous corrigés avant livraison : une variable redéclarée (`_pt` → `_ptV`, linter), un jeton sans repli (`--shadow-md`), la phrase « Pourquoi les deux totaux diffèrent » attendue dans `pil.cadres` (gardée en tête de son paragraphe), `guide.html` à reconstruire (`build-guide`), `pil1` (les règles `.pil-cr` parties) et `etats1` (l’entrée d’aide devient « Choisir ce que vous regardez », réécrite pour la barre). Tutos concernés : aucun ; le **panneau côte à côte** (touché par la barre du haut) **rejoué sur le build** (`npm run test:tutos -- --concernes`) : 1280 × 800, 1536 × 864, 1920 × 1080 — panneau, bouton touchable, anneau visible, rien dessous, aucun envoi au serveur. (Bac à sable : Playwright attendait le navigateur sans tête 1228, seul le 1194 est installé et le téléchargement est bloqué ; un lien vers le 1194 a suffi.) **Chaîne complète par le coureur : 518 commandes, 518 codes à 0, aucun délai.**

### 443d. Ce qui reste
PIL-RANGE-2b (onglet L’année retiré, cartes déplacées, migration), puis 3, 4, CAVE-FIX-1, CAVE-RANGE-1 à 3.

## 444. ★ PIL-RANGE-2b — PILOTAGE : L’ONGLET L’ANNÉE EST RANGÉ (BUDGET ET AVIS → ÉCONOMIE › SYNTHÈSE, RENFORT → ÉQUIPE & MATÉRIEL, « an » → « eco ») (23/10 — `src/pilotage.js` (`_PIL_TABS` sans « an », `_PIL_TAB_MIGR` + `an:'eco'`, `_PIL_VALID_TAB`, `_PIL_LABELS`, `_PIL_PERSO_DEFS` (eco : `an_budget` ; equ : `an_frise`), `avecPerso`, `_pilPhotosIci`, cibles des photos, `_pilFillContent` (Personnel + renfort), `_pilTabEco` (Synthèse + `_pilAnEcoHtml`), `_pilTabAn` → `_pilAnEcoHtml`, `_pilGo('an_cadres')`) · `src/coquille.js` · `src/app.js` (`_MVT_PILTAB`) · `src/cockpit-vue.js` (`choisirOnglet`) · `src/utils.js` (APP, WHATS_NEW niv 1, `MV_AIDE`, deux fiches) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/preflight.mjs` (homonymes de « an ») · `scripts/mv-harnais-pilrange2b.mjs` (neuf) · `scripts/mv-harnais-annee.mjs` · `scripts/mv-harnais-pilrange2a.mjs` · `scripts/mv-harnais-echelle.mjs` · `scripts/mv-harnais-regl-module.mjs` · `scripts/mv-harnais-aide.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-2B.json` · **APP 10.00 → 10.01, SW 10.80 → 10.81**, base `e7b9d8c` ; chaîne par le coureur : 520 commandes, 520 codes à 0)

### 444a. D’où ça vient
Suite du rangement (§439), maquette validée : la barre « Vous regardez » (§443) choisit le cadre, donc L’année n’a plus de raison d’être un onglet. Arbitrage A de Nico (23/10) : L’année supprimée — budget → Économie, renfort → Équipe, cadre → portée.

### 444b. Ce qui a été fait
- **Menu** : sept onglets (Aujourd’hui · La campagne · L’équipe & le matériel · Décider ┃ Économie · Conformité · Archives). Un onglet « an » mémorisé **migre vers Économie** (`_PIL_TAB_MIGR`), comme « cav » avant lui.
- **Économie › Synthèse** s’ouvre sur `_pilAnEcoHtml` : les avis du cadre (`_pilAnAvisHtml` — exercice à régler, année vigne aux mêmes dates, vendange à cheval sur deux exercices), puis le budget de l’année (`_pilPanelAnBudget`, case `an_budget`, désormais dans « Afficher dans cet onglet » d’Économie). Les autres sous-vues ne bougent pas.
- **Équipe & matériel › Personnel** gagne « Le renfort à prévoir » (`_pilPanelAnRenfort`, case `an_frise`).
- **Photos** : elles restent sur La campagne (`_pilPhotosIci`) ; leurs cibles suivent les chiffres (Effectif → equ, Budget → eco, Travaux → avc).
- **« an_cadres »** (point « à compléter » de la vendange à cheval) mène à Économie › Synthèse et fait clignoter les avis, sinon la barre.
- Coquille (repli des onglets), tutos (`_MVT_PILTAB` annee → eco), cockpit (`choisirOnglet` an → eco).
- Aide (« Le budget de l’année et le renfort »), deux fiches qui renvoyaient à « L’année » (frise des 52 semaines, pic), guide 11 (menu, photos, section devenue « Le budget de l’année et le renfort »), `guide.html` reconstruit, WHATS_NEW 10.01 niv 1.
- **Preflight** : la règle « une clé d’onglet retirée n’est plus demandée ailleurs » cherchait `'an'` partout ; elle nomme désormais ses deux homonymes ligne par motif, avec la raison (jalon « Un an au domaine », mode « an » du suivi cuivre) — jamais un fichier entier exempté.

### 444c. Harnais
`mv-harnais-pilrange2b.mjs` (13 vertes, 9 contre-épreuves) **exécute** `_pilAnEcoHtml` (avis puis budget, budget décoché), `_pilLoadTab` avec la vraie migration (« an » → eco, eco et avc restent), `_pilPhotosIci`, et lit le menu, les cases, les cibles des photos, « an_cadres », la coquille, le cockpit, les tutos, l’aide, le guide et la liste. `annee` (③ : L’année rangée), `pilrange2a` (les avis lus dans `_pilAnEcoHtml`) et `echelle` (six clés ; « an » migre) suivent. La chaîne a trouvé deux rouges de plus, corrigés : `regl-module` lisait la liste exacte des onglets valides (« an » en est sorti) ; `aide` (A9) gardait un plancher de huit onglets lus dans le code — l’aide du Pilotage, elle, lit la liste à l’ouverture et dit bien « Sept onglets » ; le plancher passe à sept.

### 444d. Ce qui reste
PIL-RANGE-3 (Travaux 6 → 4 cartes ; Équipe : présence + capacité en une carte), PIL-RANGE-4, CAVE-FIX-1, CAVE-RANGE-1 à 3.

## 445. ★ PIL-RANGE-3 — PILOTAGE : « LA CAMPAGNE » DEVIENT « TRAVAUX » ; LA JAUGE OUVRE « AVANCEMENT PAR TÂCHE » ; « LA CHARGE PAR TÂCHE » (23/10 — `src/pilotage.js` (`_PIL_TABS`, `_PIL_LABELS`, `_pilTabAvc`, `_pilPieData` (titres), `_PIL_PERSO_DEFS.avc`, rendu de la jauge sous `avc_bar`, style injecté) · `src/coquille.js` · `src/app.js` (recherche) · `src/cockpit-vue.js` (tuile Travaux) · `src/utils.js` (APP, WHATS_NEW niv 1, `MV_AIDE`) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-pilrange3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-3.json` · **APP 10.01 → 10.02, SW 10.81 → 10.82**, base `cf3a729` ; chaîne par le coureur : 522 commandes, 522 codes à 0)

### 445a. D’où ça vient — une recommandation corrigée avant le code
Le rangement (§439, maquette) prévoyait « Travaux 6 → 4 cartes » en fusionnant « Charge (donut) » et « Où va le temps », dits « deux dessins de la même répartition », et « Présences du jour » avec « Capacité vs charge ». **Vérifié sur le code avant d’écrire : faux.** Le donut montre la charge par tâche (restante, réalisée, planifiée, au barème) ; « Le temps de l’équipe » montre où passent les heures de présence (vigne, tracteur, autres), le prévu face au réel et l’écart. Présences (qui est là aujourd’hui) et Capacité (l’équipe face au travail des semaines, le pic) répondent aussi à deux questions. Nico, en langage simple : version corrigée validée (« go »).

### 445b. Ce qui a été fait
- **L’onglet s’appelle « Travaux »** (menu, intitulé, repli de la coquille, recherche, tuile du cockpit, aide — qui lit la liste dans le code —, guide). La barre « Vous regardez » garde « La campagne » : c’est ce qu’on regarde, pas l’onglet. Les textes où « la campagne » désigne la saison ne changent pas.
- **La jauge de saison** n’est plus une carte en tête : elle ouvre « Avancement par tâche » (`#pil-gauge` dans le panneau, avant les barres), mêmes chiffres (pourcentage, heures faites, restantes, prévues, tâches finies et en cours), dessinée sous la case `avc_bar` ; sans cadre dans la carte (style injecté). La case « Jauge de saison » quitte « Afficher dans cet onglet ». Six cartes → cinq, rien de perdu.
- **Le donut s’appelle « La charge par tâche »**, avec son mode : restante, réalisée, planifiée (`_pilPieData`) ; le guide dit la différence avec « Le temps de l’équipe ».
- Équipe & matériel : inchangé (Présences et Capacité restent deux cartes).
- WHATS_NEW 10.02 niv 1. Dans `index.html`, la montée de version ne touche que `v…` et `?v=…` : des tracés d’icônes contiennent « 10.01 ».

### 445c. Harnais
`mv-harnais-pilrange3.mjs` (12 vertes, 9 contre-épreuves) **exécute** `_pilTabAvc` (la jauge dans la carte, une seule, absente si la carte est décochée ; donut et temps de l’équipe séparés) et `_pilPieData` dans ses trois modes, et lit le rendu de la jauge, le style, les cases, le nom de l’onglet partout, la barre qui garde « La campagne », l’aide, le guide et la liste.

### 445d. Ce qui reste
PIL-RANGE-4 (Économie : la sous-vue Exercice → portée, 6 → 5 sous-vues ; « Afficher dans cet onglet » d’Aujourd’hui réduit aux cartes du cockpit v2), CAVE-FIX-1, CAVE-RANGE-1 à 3.

## 446. ★ PIL-RANGE-4a — PILOTAGE : « AFFICHER DANS CET ONGLET » NE PROPOSE QUE CE QUI SERT (UNE CASE = UN LECTEUR) ; « mat_travaux » AUX DÉFAUTS (23/10 — `src/pilotage.js` (`_PIL_PERSO_DEFS` : Aujourd’hui à deux cases, `auj_tension` → equ, `auj_traiter` → cfm ; `_PIL_DEFAULT.show` : 17 clés mortes et `avc_gauge` retirées, `mat_travaux` ajoutée ; Personnel réveillé par `auj_tension`) · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `scripts/mv-harnais-pilrange4a.mjs` (neuf) · `scripts/mv-harnais-auj1.mjs` · `scripts/mv-harnais-pilrange2b.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-4A.json` · **APP 10.02 → 10.03, SW 10.82 → 10.83**, base `0b4a078` ; chaîne par le coureur : 524 commandes, 524 codes à 0)

### 446a. D’où ça vient
Défaut P1 de l’audit (§439) : sur Aujourd’hui, 21 cases, dont **17 sans aucun lecteur** depuis le cockpit v2 (`auj_marge`, `auj_charge`, `auj_cadence`, `auj_inaction`, `auj_budget`, `auj_etp`, `auj_jours`, `auj_prio`, `auj_alertes`, `auj_pres`, `auj_resume`, `auj_chantiers`, `auj_courbe`, `auj_fil`, `auj_savoir`, `auj_plan`, `auj_eco`) ; deux réglaient des cartes d’autres onglets (`auj_tension` → la tension par personne, dans Équipe ; `auj_traiter` → la protection restante, dans Conformité). En mesurant la table contre les défauts, un **défaut de PIL-RANGE-1b** : `mat_travaux` manquait à `_PIL_DEFAULT.show` ; or `_pilNormalize` ne garde que les clés des défauts — la case décochée se recochait au chargement (le piège déjà décrit pour `an_frise`). Et sept des cases mortes (`auj_resume`…) n’avaient jamais été aux défauts : elles se recochaient aussi. (Une tentative antérieure de ce lot, trouvée non livrée dans le dossier de travail — réponse relancée —, a été écartée et le lot refait.)

### 446b. Ce qui a été fait
Aujourd’hui ne propose plus que **la vue Cave** et **ses points dans « À savoir »** (les deux clés que le cockpit v2 lit). **La tension par personne** se règle dans Équipe (et réveille seule la partie Personnel), **la protection restante** dans Conformité — là où elles s’affichent, **mêmes clés** : les choix mémorisés restent. Les défauts suivent exactement la table (25 clés de part et d’autre) : les 17 clés mortes et `avc_gauge` (PIL-RANGE-3) partent, `mat_travaux` entre. WHATS_NEW 10.03 niv 1.

### 446c. Harnais
`mv-harnais-pilrange4a.mjs` (9 vertes, 8 contre-épreuves) garde une **règle générale sur tous les onglets** : une case = un lecteur (`_pilShow`/`_pilAnyShow` hors de la table, ou un autre module) ; la table et les défauts ont les mêmes clés ; il **exécute** `_pilNormalize` (une case décochée reste décochée ; une clé morte mémorisée disparaît sans bruit) et lit la place des deux cases rangées. `auj1` suit (plus de case pour les blocs que le v2 ne lit pas) ; `pilrange2b` aussi (la liste qui réveille Personnel gagne `auj_tension`), trouvé par la chaîne.

### 446d. Ce qui reste
PIL-RANGE-4b — la sous-vue « Exercice » d’Économie : **à vérifier avant d’y toucher** (que montre-t-elle de plus que « Le budget de l’année » en tête de la Synthèse ?), puis CAVE-FIX-1, CAVE-RANGE-1 à 3.

## 447. ★ PIL-RANGE-4b — ÉCONOMIE : « LE DÉTAIL DE L’EXERCICE » SUIT LA BARRE « VOUS REGARDEZ » ; SES TROIS RÉGLAGES DANS LA ROUE (23/10 — `src/pilotage.js` (`_pexEx` lit `_pilAnCadre().F` ; `_PEX_AN` et le geste « exy » retirés, plus mémorisés ; `_pexBarreEx` sans puces ; `_pexView` sans réglages ; `_PEC_SUBS` + `_pecDetailLib` ; `_pilParamAnnees` neuve, `_pilParamRender` (style d’Économie + section), geste des fûts dans la roue, `_pexSetMois`/`_pilSetCampMois` repeignent la roue) · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-pilrange4b.mjs` (neuf) · `scripts/mv-harnais-regl-module.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/PIL-RANGE-4B.json` · **APP 10.03 → 10.04, SW 10.83 → 10.84**, base `42393c7` ; chaîne par le coureur : 526 commandes, 526 codes à 0)

### 447a. D’où ça vient — vérifié avant le code
Le rangement prévoyait « Exercice → portée, 6 → 5 sous-vues ». Vérifié : la sous-vue **ne doublait pas** « Le budget de l’année » (un résumé) — elle porte le détail comptable introuvable ailleurs (rythme mois par mois, salaires par personne, achats, dépenses, fiabilité et remarques) et trois réglages (ouverture de l’exercice, ouverture de l’année vigne, compte d’un fût acheté — et non « ce qui est à venir », comme écrit d’abord à Nico : corrigé ici). Le vrai défaut : **son propre choix d’année** (`_PEX_AN`, puces 2026-27 / 2025-26…), indépendant de la barre. Nico : « oui » à la proposition (garder, renommer, suivre la barre, réglages dans la roue).

### 447b. Ce qui a été fait
- `_pexEx` lit la fenêtre de la barre (`_pilAnCadre().F`, la même que « Le budget de l’année » ; exercice ou année vigne, flèches comprises) ; sans cadre lisible, l’exercice en cours. `_PEX_AN` n’existe plus ni en mémoire (`_pecSaveSt`) ni en geste.
- La sous-vue s’appelle **« Le détail de l’exercice »** (ou **« … de l’année vigne »** quand la barre regarde l’année vigne : `_pecDetailLib`) ; sa ligne d’en-tête dit l’année et renvoie à la barre.
- Les trois réglages quittent son bas de page pour la **roue crantée du Pilotage**, section « Les années et les comptes », côte à côte (règle AXE-1), mêmes écrivains ; la roue charge le style d’Économie et écoute le geste des fûts ; elle se repeint après un réglage par le chemin de toujours (`_pilFillContent` → `_pilParamRefresh`, une seule fois).
- Guide (sous-vue renommée, « Le détail » suit la barre, Revient garde son cadre ; la note des réglages pointe la roue), WHATS_NEW 10.04 niv 1.

### 447c. Harnais
`mv-harnais-pilrange4b.mjs` (12 vertes, 8 contre-épreuves) ; `regl-module` suit (le corps de `_pilParamRender` gagne la section), trouvé par la chaîne **exécute** `_pexEx` (fenêtre de la barre, repli), `_pecDetailLib`, `_pexBarreEx` et `_pilParamAnnees`, et lit : plus de mémoire d’année propre, sous-vue sans réglages, nom calculé, roue (style, section, geste des fûts, repeint), nouveauté, guide, liste.

### 447d. Ce qui reste
Le rangement du Pilotage est fait (PIL-RANGE-1 à 4). Restent CAVE-FIX-1 (part des anges annualisée) et CAVE-RANGE-1 à 3.

## 448. ★ CAVE-FIX-1 — LA PART DES ANGES D’UN JEUNE MILLÉSIME SE LIT SUR SA PÉRIODE RÉELLE, AVEC SON ÉQUIVALENT ANNUEL (23/10 — `src/cave.js` (`_pcavAnges` : première entrée en fût par millésime, période, `pctPeriode`, `pctAn` ramené à l’année ; `_pcavAngesCard` : « … % en N mois · soit env. … %/an ») · `src/utils.js` (APP, WHATS_NEW niv 2, `MV_INFO` `cave.anges`) · `index.html` · `public/sw.js` · `scripts/mv-harnais-cavefix1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVE-FIX-1.json` · **APP 10.04 → 10.05, SW 10.84 → 10.85**, base `0ad38fa` ; chaîne par le coureur : 528 commandes, 528 codes à 0)

### 448a. D’où ça vient
Défaut C1 de l’audit du rangement (§439, §6b) : `_pcavAnges` calculait `perdu / (logé + perdu)` sur **douze mois glissants** et l’affichait « %/an » — sans le ramener à l’année. Un millésime entonné il y a trois mois n’a que trois mois d’ouillages dans la fenêtre : le « %/an » sortait environ quatre fois trop bas. Ordre des lots validé par Nico (23/10).

### 448b. Ce qui a été fait
Par millésime, la **période réelle** : de la première entrée en fût de ses cuvées (`date_entonnage`, sinon `date_entree`), à défaut du premier ouillage de la fenêtre, jusqu’à aujourd’hui, dans les douze mois. Le pourcentage **de cette période** (`pctPeriode`, la formule d’origine) et l’**équivalent annuel** linéaire (`pctAn` = × 365 / jours) dès trente jours ; au-delà de 335 jours la période **est** l’année (rien ne change pour un millésime ancien) ; sous trente jours, pas d’extrapolation. La carte de La Réserve › Fûts écrit « 1,7 % en 3 mois · soit env. 6,9 %/an », ou « … % en 14 j » (pas de « ≈ » : `mv-harnais-subset` l’a refusé, il n’est pas dans le jeu de la police). La règle des opérations mixtes (comptées au total, pas ventilées) est gardée. Fiche `cave.anges` : la période réelle et l’équivalent annuel, avec la réserve du bois neuf qui boit davantage au début. WHATS_NEW 10.05 **niv 2** (« À vérifier » : un chiffre bouge pour les jeunes millésimes).

### 448c. Harnais
`mv-harnais-cavefix1.mjs` (10 vertes, 7 contre-épreuves) **exécute** les vraies `_pcavAnges` et `_pcavAngesCard` sur des ouillages datés : millésime ancien (même chiffre qu’avant), entonné il y a 91 jours (période, pourcentage, équivalent ×365/91, texte de la carte), quatorze jours (pas d’extrapolation), sans date (premier ouillage), opération mixte (non ventilée), fiche, nouveauté, liste.

### 448d. Ce qui reste
CAVE-RANGE-1 à 3 (la portée millésime ; la fiche de cuvée unique ; Courbes → Cuvier, Le Millésime à deux onglets).

## 449. ★ CAVE-RANGE-1 — CAVE : UN SEUL MILLÉSIME REGARDÉ, PARTAGÉ PAR LE CHAI ET LE MILLÉSIME (23/10 — `src/cave.js` (`_caveMillFilter` devient LE choix de la Cave ; `_mlMil` retiré ; `_mlMilActif`, `_mlSetMil`, `_caveSetMill` (section Millésime), renvoi « rdtmax », `_mlHead` (la phrase « Tous »), libellé « Millésime regardé ») · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-caverange1.mjs` (neuf) · `scripts/mv-harnais-hlha1.mjs` · `scripts/mv-harnais-range1.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVE-RANGE-1.json` · **APP 10.05 → 10.06, SW 10.85 → 10.86**, base `50e4f1b` ; chaîne par le coureur : 530 commandes, 530 codes à 0)

### 449a. D’où ça vient — vérifié avant le code
Rangement de la Cave (maquette `maquette-cave-rangee-v1.html`, validée par Nico le 23/10 : « une portée, le millésime »). Mesuré dans le code : **deux choix de millésime** — Le Chai (`_caveMillFilter`, « Tous · 2026 · 2025 », pour ses cinq onglets et son en-tête) et Le Millésime (`_mlMil`, ses boutons d’année). On pouvait filtrer le Chai sur 2025 et lire Le Millésime 2026 sans le voir.

### 449b. Ce qui a été fait
**Un seul état**, `_caveMillFilter`, lu par les deux sections : Le Millésime montre l’année choisie ; quand le Chai montre « Tous », il montre celle de la campagne en cours (il parle d’UN millésime) et **le dit** sous ses boutons. Choisir une année au Millésime la choisit pour toute la Cave (`_mlSetMil` → `_caveSetMill`, qui repeint la section à l’écran — Le Millésime et la bande, ou l’onglet du Chai, sa barre et son en-tête). Le renvoi « rendement maximum » écrit le même choix. La barre du Chai s’appelle « Millésime regardé ». Aujourd’hui (toute la cave) et Le Cuvier (la campagne) ne changent pas. Les boutons restent à leur place (sous les onglets du Chai ; en tête du Millésime) : la barre unique en haut de la Cave viendra avec la fiche de cuvée.

### 449c. Harnais
`mv-harnais-caverange1.mjs` (12 vertes, 6 contre-épreuves) **exécute** `_mlMilActif`, `_mlSetMil`, `_caveSetMill` et `_mlHead` : « Tous » → campagne en cours et la phrase ; choisir 2025 au Millésime l’écrit pour toute la Cave et repeint la bonne section ; « Tous » au Chai repeint l’onglet à l’écran et Le Millésime suit ; plus de `_mlMil` ; renvoi, libellé, nouveauté, guide, liste. `hlha1` et `range1` montent le choix partagé dans leurs bacs à sable.

### 449d. Ce qui reste
CAVE-RANGE-2 (la fiche de cuvée unique : Élevage · Volumes & origine · Analyses · Diagnostic, ouverte depuis toute liste ; la barre du millésime en haut de la Cave), CAVE-RANGE-3 (Courbes → Cuvier › Cuves ; Le Millésime à deux onglets).

## 450. ★ CAVE-RANGE-2a — CAVE : LA FICHE UNIQUE D’UNE CUVÉE, QUATRE VOLETS (ÉLEVAGE · ANALYSES · VOLUMES & ORIGINE · DIAGNOSTIC) (25/10 — `src/cave.js` (`openCuveeDetail(cuvId,dans,volet)` ; `_CDV`, `_cdvHtml`, `_cdvShow`, `_cdvVolumesHtml`, `_cdvDiagHtml`, `_cdvDiagOuvrir` neuves ; le labo sorti du corps d’Élevage ; `_mlCuvFicheHtml(g,l,o)` : mode « dedans » et lien « Fiche complète ») · `src/diagnostic.js` (`window._dgnVoirCuvee`, geste « fiche », bouton « Fiche de la cuvée ») · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-caverange2a.mjs` (neuf) · `scripts/mv-harnais-cave3.mjs` · `scripts/tutos-couverture.json` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVE-RANGE-2A.json` · **APP 10.06 → 10.07, SW 10.86 → 10.87**, base `e25b7ed` ; chaîne par le coureur : 532 commandes, 532 codes à 0)

### 450a. D’où ça vient — vérifié avant le code
Maquette de la Cave validée (« une cuvée, une fiche »). Mesuré : la **fenêtre du Chai** (`openCuveeDetail`) montrait déjà l’élevage complet et le labo de la cuvée (`_laboCuveeHtml`) ; **Le Millésime › Cuvées** avait sa propre fiche (`_mlCuvFicheHtml` : chaîne des volumes, parcelles, kg/hL, hL/ha) ; **le Diagnostic** (diagnostic.js, son propre écran maître-détail) n’était pas joignable depuis la cuvée. Et sur ordinateur, la fiche du Chai s’ouvre **déjà à droite de la liste** (`_chaiDesk`, `#chai-fiche`, CAVE-3) : l’étape « à côté de la liste » est faite pour le Chai. Proposition en trois étapes ; Nico : « Go » pour la première.

### 450b. Ce qui a été fait
La fenêtre du Chai devient **la fiche** : quatre volets (puces `mvcm-chip`), Élevage ouvert par défaut ou le volet demandé (`openCuveeDetail(id, dans, volet)`). **Élevage** = ce qu’elle montrait, sans le labo ; **Analyses** = `_laboCuveeHtml` (les courbes se repeignent à l’affichage du volet, elles se mesurent à leur largeur) ; **Volumes & origine** = la ligne du Millésime de CETTE cuvée (`_pcrbCvLignes`), dessinée par `_mlCuvFicheHtml` en mode « dedans » (sans « Toutes les cuvées » ni lien vers elle-même) ; **Diagnostic** = la synthèse de `window._dgnSynthese()` pour la cuvée, et « Ouvrir le diagnostic de cette cuvée » (`window._dgnVoirCuvee` : Chai › Diagnostic, la cuvée choisie). Chemins neufs : Le Millésime › Cuvées → « Fiche complète de la cuvée » (volet Volumes) ; le Diagnostic → « Fiche de la cuvée » (volet Diagnostic, par le geste `data-dgn="fiche"`, sans valeur dans un gestionnaire). Rien n’est retiré. Guide (la fiche à quatre volets), WHATS_NEW 10.07 niv 1.

### 450c. Harnais
`mv-harnais-caverange2a.mjs` (13 vertes, 8 contre-épreuves) **exécute** `_cdvHtml` (quatre volets, défaut, volet demandé, le labo dans Analyses et plus dans Élevage), `_cdvVolumesHtml` (la fiche du Millésime « dedans » ; cuvée sans chaîne), `_cdvDiagHtml` (synthèse et chemin ; cuvée non suivie), et lit la signature, les chemins du Millésime et du Diagnostic, le repeint des courbes, la nouveauté, la liste. `cave3` suit la nouvelle signature. La chaîne a trouvé deux gestes neufs sans tuto (`_cdvShow`, `_cdvDiagOuvrir`, 810 > plafond 808) : rangés dans les exemptions de `scripts/tutos-couverture.json`, avec leur raison (un affichage, un chemin — rien ne s’enregistre), plutôt qu’un plafond relevé.

### 450d. Ce qui reste
CAVE-RANGE-2b (le millésime regardé tout en haut de la Cave — la fiche à droite de la liste est déjà là pour le Chai) et CAVE-RANGE-3 (Le Millésime à deux onglets, après avoir vérifié qu’aucune cuvée ne devient introuvable).

## 451. ★ CAVE-RANGE-2b — CAVE : LE MILLÉSIME REGARDÉ, UNE SEULE BARRE SOUS LES SECTIONS (LE CHAI ET LE MILLÉSIME) (25/10 — `src/cave.js` (`_caveMillChipsHtml` : la barre unique, années du Chai et du Millésime, phrase « Tous » au Millésime ; `_caveEnsureMilBar` : hôte `#cave-milbar` sous `#cave-sec-tabs`, l’ancien `#mvc-milbar` retiré ; `_caveMilBarRender` : visible au Chai et au Millésime seulement ; rendu par l’aiguillage des sections ; `_mlHead` sans ses boutons ; `_mlSetMil` et son export retirés ; styles `.mlh-sel`, `.mlh-b` retirés) · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-caverange1.mjs` · `scripts/mv-harnais-range1.mjs` · `scripts/tutos-couverture.json` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVE-RANGE-2B.json` · **APP 10.07 → 10.08, SW 10.87 → 10.88**, base `b42cb1e` ; chaîne par le coureur : 532 commandes, 532 codes à 0)

### 451a. D’où ça vient
Maquette de la Cave validée (« le millésime, une portée en haut ») et §449d / §450d : après CAVE-RANGE-1 (un seul état), le choix restait **affiché à deux endroits** — sous les onglets du Chai (`#mvc-milbar`) et en tête du Millésime (`_mlHead`, `.mlh-sel`).

### 451b. Ce qui a été fait
**Une seule barre « Millésime regardé »**, juste sous les sections de la Cave (`#cave-milbar`), montrée au **Chai** et au **Millésime**, cachée à **Aujourd’hui** (toute la cave) et au **Cuvier** (la campagne). Ses années : celles du Chai et celles du Millésime (récoltes comprises), sans doublon, de la plus récente ; « Tous » avec le compte des cuvées en élevage ; un compteur par année. Règle d’origine gardée : un seul millésime → pas de barre. Au Millésime sur « Tous », la barre dit « il montre celui de la campagne en cours (2026) ». `_mlHead` perd ses boutons et sa phrase ; `_mlSetMil`, son export et les styles `.mlh-sel`/`.mlh-b` partent (le preflight a refusé `_mlSetMil` sans appelant). Guide : la barre unique, avec les phrases d’origine sur le millésime embouteillé et les chiffres du haut. WHATS_NEW 10.08 niv 1 (sans cible : `#cave-milbar` est créé par le code, `whatsnew-check` ne le trouve pas dans les sources).

### 451c. Harnais
`mv-harnais-caverange1.mjs` porte maintenant la barre unique (12 vertes, 6 contre-épreuves) : il **exécute** `_caveMillChipsHtml` (la phrase « Tous » au Millésime, absente sur une année) et `_caveSetMill` (au Millésime : Le Millésime, la bande et la barre repeints), et lit l’hôte sous les sections, la visibilité Chai/Millésime, l’absence de `_mlSetMil`/`.mlh-sel`, le guide. `range1` (B1) : la tête du Millésime n’a plus de boutons d’année. `cave6` : la règle « un seul millésime, pas de barre » tient. La chaîne a trouvé la contre-épreuve « un geste nouveau sans tuto » muette : le retrait de `_mlSetMil` avait fait baisser le compte des gestes sans tuto ; le plafond de `scripts/tutos-couverture.json` suit (cliquet).

### 451d. Ce qui reste
CAVE-RANGE-3 : Le Millésime à deux onglets (Courbes → Cuvier ; Cuvées → la fiche), après avoir vérifié qu’aucune cuvée, embouteillée ou vendue en vrac, ne devient introuvable.

## 452. ★ CAVE-RANGE-3 — CAVE : LE MILLÉSIME GARDE SES QUATRE ONGLETS ; UNE CUVÉE DU CHAI S’Y OUVRE DANS LA FICHE UNIQUE ; LES BOUTEILLES MÈNENT À LA FICHE (25/10 — `src/cave.js` (`_mlRenderCuv` : la fiche unique dans le panneau `#ml-fiche` pour une cuvée du Chai ; `openCuveeDetail` : en panneau, ses éléments cherchés DANS le panneau ; lien « Fiche complète » retiré de `_mlCuvFicheHtml` ; Bouteilles : « Fiche de la cuvée ») · `src/styles.css` (en-tête de fiche aussi pour `#ml-fiche`) · `src/utils.js` (APP, WHATS_NEW niv 1) · `index.html` · `public/sw.js` · `guide/08-cave.html` · `public/guide.html` · `scripts/mv-harnais-caverange3.mjs` (neuf) · `scripts/mv-harnais-caverange2a.mjs` · `scripts/mv-harnais-range1.mjs` · `scripts/mv-harnais-cave3.mjs` · `scripts/mv-harnais-phyto1.mjs` · `scripts/mv-harnais-phyto2.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVE-RANGE-3.json` · **APP 10.08 → 10.09, SW 10.88 → 10.89**, base `d6af8e7` ; chaîne par le coureur : 534 commandes, 534 codes à 0)

### 452a. D’où ça vient — une recommandation corrigée avant le code
La maquette prévoyait Le Millésime à deux onglets (« Cuvées » → la fiche, « Courbes » → Le Cuvier). **Vérifié : faux.** « Cuvées » (`_pcrbCvLignes`) est le **tableau du millésime** : toutes ses cuvées côte à côte avec leur chaîne, les **embouteillées** (que Bouteilles ne menait pas à leur fiche — elles seraient devenues introuvables), le **raisin vendu** (par parcelle, kg, acheteurs) et les **récoltes sans cuve**. « Courbes » (`_pcavVueCourbes`) montre les fermentations du millésime choisi, **n’importe quelle année** ; Le Cuvier ne regarde que la campagne. Nico, en langage simple : version corrigée validée (« oui »).

### 452b. Ce qui a été fait
- **Quatre onglets gardés.**
- **Plus de seconde fiche** : dans Le Millésime › Cuvées, une cuvée du Chai s’ouvre dans **la fiche unique**, dans le panneau du Millésime (`#ml-fiche`, `openCuveeDetail(id,'ml-fiche','vol')`, au tour suivant du rendu), sur « Volumes & origine » ; la colonne garde sa classe `.mlc-fiche` et son « Toutes les cuvées » (téléphone). Une cuve sans cuvée garde son détail (`_mlCuvFicheHtml`). Le lien « Fiche complète » de cette seconde fiche, devenu sans objet, part.
- **La fiche en panneau cherche ses éléments DANS son panneau** (`_pn.querySelector('#cuvf-…')`) : deux panneaux (Chai, Millésime) portent les mêmes identifiants internes ; `getElementById` aurait écrit dans le premier trouvé.
- **L’en-tête de fiche** a le même style dans le panneau du Millésime (les 26 règles `:is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche)` gagnent `#ml-fiche`, et `#ml-fiche .catf-bd`).
- **Bouteilles** : une cuvée embouteillée a « Fiche de la cuvée » (volet Volumes).
- Guide (les chemins de la fiche), WHATS_NEW 10.09 niv 1.

### 452c. Harnais
`mv-harnais-caverange3.mjs` (9 vertes, 5 contre-épreuves) lit les quatre onglets, la fiche unique dans le panneau du Millésime (et le détail gardé pour une cuve sans cuvée), la recherche DANS le panneau, le style, le chemin des bouteilles, la nouveauté, le guide, la liste. Suivent : `caverange2a` (Le Millésime ouvre la fiche unique), `range1` (B5 : la première cuvée ouverte dans la fiche unique quand elle est du Chai ; `setTimeout` dans le bac à sable), `cave3`, `phyto1`, `phyto2` (la liste `:is()` du style partagé). Le panneau de tuto côte à côte (touché par la feuille de style commune) **rejoué sur le build** (`npm run test:tutos -- --concernes`) : 1280 × 800, 1536 × 864, 1920 × 1080, tout va au bout.

### 452d. Ce qui reste
Le rangement de la Cave est fait (CAVE-FIX-1, CAVE-RANGE-1 à 3). Avec celui du Pilotage, le chantier « ranger Pilotage et Cave » du 23/10 est terminé ; les écarts à la maquette sont écrits (§445, §447, §452) : chaque fois, la vérification du code a montré qu’on aurait perdu de l’information.

## 453. ★ CSS-MENAGE-1 — LE STYLE DE L’ANCIEN AUJOURD’HUI ET DU PLAN V1 : 67 RÈGLES SANS PRODUCTEUR RETIRÉES (25/10 — `src/styles.css` (67 règles, 73 sélecteurs ; 7 groupes réécrits sans leur sélecteur mort) · `public/sw.js` · `scripts/mv-harnais-cssmenage1.mjs` (neuf) · `scripts/mv-harnais-align.mjs` · `scripts/mv-harnais-boutons.mjs` · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CSS-MENAGE-1.json` · **APP 10.09 inchangé, SW 10.89 → 10.90**, base `3dfac59` ; chaîne par le coureur : 536 commandes, 536 codes à 0 ; panneau de tuto côte à côte rejoué sur le build, trois tailles)

### 453a. D’où ça vient
Dette notée en §441d : PIL-RANGE-1b a retiré l’ancien Aujourd’hui et le rendu de secours de `cockpit.js`, leur style restait. Proposé à Nico à la fin du rangement ; « suite ».

### 453b. Ce qui a été fait — mesuré avant d’effacer
Recensement des classes définies (feuilles et style injecté des modules) sous les préfixes de l’ancien écran, puis, pour chacune, recherche d’un **producteur** : la classe écrite dans le code ou l’`index.html`, un préfixe concaténé (`'pil-tz-'+`, `'ck-sv-' + x.cat`), un gabarit (`ck-c-${…}`). Les familles `ck-sv-*` (construites par `cockpit-vue.js`), `pil-tz-strip`/`pil-tz-ax`, `pil-tile2`, `ck-zone`… sont **vivantes** et gardées. **33 classes** n’ont plus aucun producteur : `ck-relief`, `ck-village`, `ck-lieu`, `ck-etiq`, `ck-clos`, `ck-zone-f`, `ck-c-aire`, `ck-c-conges`, `ck-c-it`, `ck-e-ecart`, `ck-v-date`, `pil-tz`, `pil-tz-ban`, `pil-tz-big`, `pil-tz-ini`, `pil-tz-pied`, `pil-tz-rai`, `pil-tz-tens`, `pil-tl`, `pil-tl-marge`, `pil-tl-mk`, `pil-tl-obj`, `pil-tl-proj`, `pil-tl-today`, `pil-tl-wrap`, `pil-ck`, `pil-ck-btn`, `pil-ck-row`, `pil-cks`, `pil-cockpit-card`, `pil-dec`, `pil-dec2`, `pil-spark`. Leurs **67 règles** (73 sélecteurs) partent de `styles.css` ; dans 7 groupes, seul le sélecteur mort est retiré (`.pil-cockpit-card,.pil-panel,…` → `.pil-panel,…`). Feuille vérifiée bien formée (accolades équilibrées). Rien ne change à l’écran : APP inchangé, SW 10.90 (un fichier servi change), pas de nouveauté.

### 453c. Harnais
`mv-harnais-cssmenage1.mjs` (4 vertes, 5 contre-épreuves) : aucune règle des feuilles ni du style injecté ne cible plus les 33 classes, et aucun code ne les produit (classe écrite ou gabarit) — si l’une revient, c’est qu’un écran l’utilise : la retirer de sa liste en connaissance de cause. `align` perd son assertion sur la grille de `.pil-dec2` (classe sans producteur depuis §441). La chaîne a trouvé la contre-épreuve « un bouton maison de plus » de `boutons` muette : `.pil-ck-btn` comptait parmi les boutons « maison » ; le plafond passe de 66 à 65 (cliquet).

## 454. ★ AUJ-TETE-1 — PILOTAGE › AUJOURD’HUI : LA BASCULE EN HAUT À DROITE DU CADRE, LA PHRASE SUR TOUTE LA LIGNE, CHAQUE CHIFFRE AVEC SA RÉFÉRENCE ; SOUS LA DATE, LA CAMPAGNE QUE LISENT CES CHIFFRES (25/10 — `src/cockpit-vue.js` (squelette : `#ck-cadre-tete` en tête de `#ck-page` ; `htmlCadreTete`, `htmlBascule` (le point de la Cave dans `.ck-b-lab`), `htmlTete` (la ligne de repère), `refChiffre`, `calerRefs`, `allerFin`, `allerBudget` neuves ; `majResume` réécrite (références, ponctuation collée `.ck-tient`) ; `monter` ; gestes `allerFin`, `allerBudget`, `indicateurs` ; `INFO.resTemps`, `INFO.resBudget` ; `ouvrirInfo` lit les fiches à titre ; `ranger` rejoue `calerRefs`) · `src/pilotage.js` (`_pilCk2Per` neuve, branchée dans `_pilCk2Modele` par `typeof`) · `src/styles.css` (bloc ★★ AUJ-TETE-1, après CAVEPIL-2) · `src/utils.js` (APP, WHATS_NEW 10.10 niv 1, `MV_AIDE` Pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` (reconstruit : la chaîne le contrôle) · `scripts/mv-harnais-autete1.mjs` (neuf) · `scripts/mv-harnais-anticipe1.mjs` · `scripts/mv-harnais-liste.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/AUJ-TETE-1.json` · **APP 10.09 → 10.10, SW 10.90 → 10.91**, base `77158c5`)

### 454a. D’où ça vient
Nico (23/10), sur une capture d’Aujourd’hui : « 45 jours de retard par rapport à quoi ? 5 210 € au-dessus du budget par rapport à quoi ? Depuis quand ? […] Faut que ça reste simple », « que ça prenne la ligne », et la bascule Terrain · Cave · Économie « super mal placée […] en haut à droite du cadre Aujourd’hui ». Lu dans le code avant la maquette : les deux chiffres portaient sur la campagne consultée (`_pilSaison`), projetés à sa fin, pendant que le fil du haut disait « Exercice comptable 2026–2027 — l’année entière » ; le retard comptait les jours entre la fin prévue et l’objectif (`_pilMargeCalc`) ; l’écart au budget valait coût à la fin − budget tous postes (`_pecData` : `projFin`), et sous 40 % du travail fait (`_PEC_CAD_AVC`) ce n’est pas une prévision au rythme de l’équipe : c’est l’écart déjà payé (main-d’œuvre payée face au travail validé) reporté tel quel. Maquette validée (`maquette-aujourdhui-entete.html`, hors dépôt), « go » le 25/10 avec « relis les fichiers, il y a eu des mises à jour » : dix-sept commits entre la maquette et l’intégration (§437 à §453).

### 454b. Trois adaptations à ce qui a changé depuis la maquette
- **La barre « Vous regardez »** (PIL-RANGE-2a, §443) affiche la campagne, ses dates et « Nᵉ jour sur M ». Aujourd’hui **ne la suit pas** : il lit `_pilSaison` (`_VISU_SAISON`, sinon l’active) ; la barre écrit `_PIL_SCOPE.camp` (`_pilScopeSet`), qui ne touche pas `_VISU_SAISON`. La ligne de repère reste donc nécessaire. Elle reprend les mots et le décompte de la barre (`_pilPorteeBornes`, jours du calendrier) : la maquette comptait en jours ouvrés (« jour 15 sur 110 »), et deux décomptes sur le même écran auraient fait douter des deux. Quand la barre montre déjà la même campagne (`meme`), la ligne garde le nom seul dès 701 px ; au téléphone, la barre cache ses dates (`.pil-ptbornes`, 700 px) : la ligne les garde.
- **Le retard en jours travaillés au planning** (PIL-FIX-1, §440) : la bulle le dit (les jours où le domaine ne travaille pas — week-ends, fériés, vendredis chômés — ne comptent pas), plus « du lundi au vendredi » comme la maquette.
- **La ligne du cadre dans la page du cockpit**, pas dans `.pil-souslig`. Celle-ci est posée par le squelette du Pilotage (marges de 24 px, 1 280 px de large), quand le contenu du cockpit est en retrait de `.pil-wrap` + `.ck-page` (24 + 16, 24 ou 32 px selon la largeur) : 32 px d’écart sur la capture de Nico. Dans `#ck-page`, la bascule tombe sur le bord des cartes à toutes les largeurs, sans recopier deux jeux de marges. `.pil-souslig` se masque par `#page-pilotage:has(#ck-cadre-tete)` (`:has` déjà employé pour `#page-pilotage:has(.ck2)`) ; sa roue `#pil-gear` reste, branchée par `_pilBind`, et la nouvelle roue (`data-fn="indicateurs"`) la touche. Écarté : loger la bascule dans `.pil-souslig` — hors de `.ck2`, elle perdait `--seg-ind` et les règles `.ck2 .ck-b-pt`, et le décalage restait.

### 454c. Ce qui a été fait
- **La ligne du cadre** : « Aujourd’hui », la bascule compacte (`--h-ctl`), la roue (`--h-row`). Au téléphone, le nom s’efface et la bascule prend la ligne. Le point de la Cave est accroché au mot (`.ck-b-lab`) : un bouton large d’un tiers de ligne le laissait au coin.
- **La ligne de repère** sous la date : `_pilCk2Per` → `V.per` (`nom`, `bornesHtml` déjà échappé, `pct` seulement dans la campagne, `meme`).
- **La phrase sur toute la ligne** (`max-width` retiré) et, sous chaque chiffre, sa référence (`refChiffre`) : « Fin prévue / Objectif », « Coût à la fin / Budget ». Le trait de la ligne de cadre dit l’état (rouge, vert, neutre) ; le « i » ouvre `INFO.resTemps` ou `INFO.resBudget`, un titre et trois paragraphes (`ouvrirInfo` accepte `{ t, p }` ; les fiches d’une phrase ne changent pas). Sans objectif posé, `VISEE` n’est qu’un repère à 60 jours : la ligne « Objectif » ne s’écrit pas. Le singulier est corrigé (« 1 jours de retard » avant).
- **Les deux chiffres se touchent** : le délai mène au verdict de Terrain (`allerFin`), l’écart à l’atterrissage d’Économie (`allerBudget`), comme les points (ANTICIPE-1) et la cave (CAVEPIL-1).
- **Une référence plus large que son chiffre** (« 6 jours d’avance » sous « Fin prévue 25 février ») déborde dessous (`width:0; min-width:100%`) au lieu de creuser la phrase ; la référence suivante, sur la même ligne, se décale d’autant avec 20 px d’air (`calerRefs`, rejouée par `ranger`).
- **Trouvé à la capture, déjà vrai avant ce lot** : au téléphone, « , et » partait seul en tête de ligne — Chromium coupe après un bouton, même devant une virgule. Chaque bouton garde sa ponctuation (`.ck-tient`, sans retour à la ligne ; le texte du bouton reste libre).
- **Textes** : `MV_AIDE` (la tête ; « Aujourd’hui fait exception » à la barre) ; guide 11 (la tête ; Aujourd’hui parmi « les trois écrans qui gardent leur cadre » — la phrase en annonçait trois et n’en nommait que deux depuis la sortie de L’année ; l’atterrissage, dit toujours « à la cadence mesurée », faux sous 40 %) ; WHATS_NEW 10.10 niv 1, pastille sur `#ck-resume`.

### 454d. Mesures et harnais
`mv-harnais-autete1.mjs` (52 vertes, 22 contre-épreuves) **exécute** `_pilCk2Per` (avec les vraies `_pilPorteeBornes`, `_pilAnnOrd`, `_pilDfr`, `_pilEsc`), `majResume`, `htmlTete`, `htmlCadreTete`, `htmlBascule`, `allerFin`, `allerBudget`, `calerRefs` (sur de fausses boîtes) et `ouvrirInfo` ; il lit le squelette, le montage, les gestes, la feuille (bornée à `.ck2`, jetons, pas d’espacement, 699 et 701 px), l’aide, le guide, la nouveauté exécutée, `sw.js` et la liste. `mv-harnais-anticipe1` suit (section C : le bac à sable reçoit les aides de la référence ; G1, G2 et deux contre-épreuves sur les nouveaux mots) : 30 vertes, 21 contre-épreuves. Captures du vrai écran (build sans la chaîne, `mv-captures --ecrans pilotage`, démo, PC 1 366 px et téléphone 390 px, clair et sombre) : bascule et roue au bord des cartes ; la ligne de repère complète à côté de la barre réglée sur l’exercice ; la référence sous « 2 jours de retard » ; la ponctuation tenue au téléphone. **La taille** : `mv-harnais-typo` a rougi — `cockpit-vue.js` passe de 156 ko (référence gravée à CAVEPIL-1) à 168 ko, plus de 5 % ; ce lot en ajoute 8, dont 3 de commentaires. La question du découpage posée : 168 ko pour une limite de 1 024, une seule vue ; la vue Cave (`cv*`, CAVEPIL-1/2) serait la première à sortir, un chantier à part. Référence regravée (`--baseline`, `scripts/typo-baseline.json`) : elle rattrape aussi les lots d’avant — `cave.js` 717 → 731 ko, `utils.js` 1 011 → 1 015, `diagnostic.js` 158 → 159, `styles.css` 900 → 902 ; `pilotage.js` 938 → 922 et `cockpit.js` 53 → 31 depuis le retrait de l’ancien Aujourd’hui (§441) ; le px en dur de `styles.css` baisse (256 → 254). **Chaîne complète par le coureur : 537 commandes en trois passes** — 158, puis 125 après la référence regravée, puis 254 (la deuxième passe a été coupée par le bac à sable au milieu de `mv-harnais-entree1`, reprise depuis lui) : un seul rouge, `mv-harnais-typo`, traité ci-dessus ; les 537 finissent à 0. **Tutos concernés : aucun** (5 tutos, aucun ne touche ce changement) ; le panneau côte à côte rejoué sur le build (1280 × 800, 1536 × 864, 1920 × 1080) : vert, rien envoyé au serveur.

### 454e. Ce qui reste
- **À voir chez Nico** : l’écart au budget et sa référence sur ses données (la démo n’a pas de taux horaire, donc pas d’économie : seul le harnais l’a vu) ; la ligne de repère quand la barre est sur « La campagne » (le nom seul) ; son PC à 125 %.
- **Noté, hors lot** : sans objectif posé, le verdict de Terrain écrit « Objectif : tout fini le » et le repère à 60 jours ; `r.ecart` retombe en jours du calendrier quand `_pilMargeCalc` ne rend pas de marge (la bulle dit « jours travaillés ») ; le panneau « Choisir les indicateurs » s’ouvre au-dessus de la ligne du cadre (il vit dans `.pil-wrap`, avant le cockpit).

## 455. ★★ GABARIT-1 — PILOTAGE : UN RÔLE, UN STYLE, DANS TOUS LES ONGLETS ; UNE POLICE, TROIS GRAISSES, HUIT TAILLES LUES DANS LA CHARTE, LA JAUGE D’AUJOURD’HUI, UN SEUL HABILLAGE DE CARTE (25/10 — `src/charte.css` (réglages `--t-police`, `--t-verdict`, `--t-heros`, `--t-chiffre`, `--t-titre`, `--t-section`, `--t-ligne`, `--t-texte`, `--t-note`, `--t-axe`, `--jauge-h`, `--jauge-fine-h`, `--barre-graph-h`, `--carte-pad`) · `src/styles.css` (bloc ★★ GABARIT-1 en fin de feuille ; 58 règles du Pilotage : 49 graisses → 600, 10 tailles hors échelle → leur cran) · `src/pilotage.js` (70 graisses 700/800 → 600 : déclarations, styles en ligne, attributs des graphiques, deux raccourcis `font:`) · `src/utils.js` (APP, WHATS_NEW 10.11 niv 1) · `index.html` · `public/sw.js` · `scripts/mv-harnais-gabarit1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-harnais-tete2.mjs` · `scripts/mv-harnais-cadre1.mjs` · `scripts/mv-harnais-autete1.mjs` · `scripts/mv-jetons-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/GABARIT-1.json` · **APP 10.10 → 10.11, SW 10.91 → 10.92**, base `ca843dd`)

### 455a. D’où ça vient
Nico (25/10) : « que les polices soient homogènes sur tous les modules de pilotage, que les barres soient exactement de la même façon […] il ne faut pas qu’il y ait de dépenses cognitives entre chaque onglet ». Objectif reformulé et confirmé (« exact, maquette html »).

### 455b. Mesuré avant la maquette — sur les écrans, pas sur le code
`mv-harnais-typo` et `mv-harnais-echelle` étaient verts, et c’était juste : ils vérifient qu’une taille est un cran du barème `--pt-*`. Aucun ne vérifie que le même **rôle** prend le même cran d’un onglet à l’autre. L’appli construite a été ouverte dans Chromium sur la démo (domaine fictif des tutos posé avant `_startDemoVisite`, horloge fixée à un jeudi, un peu de travail validé pour remplir les jauges), les cartes repliées dépliées pour la mesure, et chaque texte, barre et carte relevés dans les 14 vues et la roue, au téléphone et sur ordinateur. Dans les pièces du Pilotage : **64 styles** de texte (police × taille × graisse, textes et graphiques à part), **19 tailles** (8 à 40 px), **deux polices** (le Cormorant des chiffres de Travaux, d’Économie, d’Équipe, de l’anneau), **six graisses** (400 à 900), **neuf épaisseurs de jauge** (5 à 16 px, cinq arrondis), **trois habillages de carte** (arrondi 8, 12 ou 15, avec ou sans ombre). Exemples : le chiffre d’une carte à 24 px Outfit dans Aujourd’hui, 32 px Cormorant gras dans Travaux et Économie, 25 dans Équipe, 40 pour la jauge ; le % d’une tâche à 16 px très gras dans Aujourd’hui et 13 px dans Travaux, sa barre à 10 px et 6 px ; la pastille « i » dessinée deux fois ; Archives à 8-9 px.

### 455c. La maquette
`maquette-pilotage-gabarit-v1.html` (hors dépôt) : les **vrais écrans** de la démo (instantanés du DOM rendu, feuilles et polices embarquées, 15 vues × téléphone/ordinateur × clair/sombre), le gabarit posé ou retiré d’un geste (touche A), les onglets de l’appli cliquables dans l’écran, et le relevé « après » **mesuré dans la maquette elle-même**. Validée : « Ok, relis et go ». La recommandation suivie : les chiffres en Outfit, comme Aujourd’hui (le Cormorant aurait été un seul réglage).

### 455d. Ce qui a été fait
- **Les réglages dans la charte** : un rôle = un jeton (`--t-*`), chacun sur un cran existant (`--pt-xl` 28, `--pt-lg` 24, `--pt-md` 20, `--pt-sm` 16, `--pt-base` 14, `--pt-txt` 13, `--pt-micro` 12, `--pt-nano` 11), et les épaisseurs (`--jauge-h` 10, `--jauge-fine-h` 6, `--barre-graph-h` 16), `--carte-pad` 20. Changer un rôle se fait là, une fois.
- **Un bloc en fin de `styles.css`** donne son rôle à chaque pièce (97 classes) : chiffres, titres de panneau, étiquettes, lignes (nom, valeur, détail), cadre et notes, tableaux et axes, choix (les sous-vues d’Économie et les bascules des cartes prennent la pièce `.ck-seg` d’Aujourd’hui), jauges (10 px à bout rond ; la frise et la fenêtre du jour en fine), cartes (arrondi 12, filet, sans ombre ; blocs intérieurs à 8), les trois photos de Travaux en bande comme celle d’Aujourd’hui. **Portée** `:is(#page-pilotage, #ovReglPilotage)` : la roue crantée est une feuille hors de la page, elle suit. **`!important`, et le bloc reste le dernier de la feuille** : les styles injectés par les modules arrivent après `styles.css` dans le `<head>` et une partie est écrite en ligne ; sans eux, une moitié des règles perdait (vu à la mesure). La feuille en porte déjà plus de mille ; ici c’est la règle d’une couche, pas un rattrapage au cas par cas.
- **Aujourd’hui ne bouge presque pas** : c’est la référence. Il perd le très gras (900) de ses pourcentages de chantier ; ses textes de graphiques gardent les leurs (`svg text:not(.ck2 *)`).
- **Les graisses à la source**, parce qu’un style ne sait pas « plafonner » une graisse qu’il ne nomme pas : 70 dans `pilotage.js` (dont 11 attributs de graphique et deux `font:` raccourcis), 49 dans les règles de `styles.css` dont **tous** les sélecteurs sont du Pilotage (`#page-pilotage`, `.pil-`, `.pec-`, `.pex-`, `.pcav-`, `.ck-`, `.cv-`, `.arc-`, `.prv-`, `.pach-`, `.rf-`, `.cmp-`…) ; dans ces mêmes règles, 10 tailles hors échelle (9, 10, 10,5, 13,5, 21, 29 px) ramenées à leur cran. Diff contrôlé : aucune ligne retirée qui ne porte une de ces deux déclarations.
- **Écarté** : un normaliseur en JavaScript qui aurait corrigé l’écran après coup (la maquette en avait un, pour la démonstration) — l’intégration corrige les sources.

### 455e. Ce qui a été vérifié
- **Re-mesuré sur l’appli construite, sans aucune couche ajoutée** (ordinateur et téléphone, clair ; sombre aussi capturé) : dans les pièces du Pilotage, **28 styles, une police, trois graisses** (après le dernier passage sur Archives, re-mesuré), **une jauge de 10 px, un arrondi de carte** ; les tailles hors échelle restantes sont l’exposant « er » de la roue (rendu naturel de `<sup>`) et les pièces communes (voir 455f).
- `mv-harnais-gabarit1.mjs` : 9 vertes (les 14 réglages dans la charte ; le bloc existe et ferme la feuille ; aucune taille ni graisse au-delà de 600 écrite à lui ; chaque classe visée a un producteur ; ni `pilotage.js` ni les règles du Pilotage de la feuille ne repassent une graisse au-delà de 600 ; la liste le joue), 9 contre-épreuves qui mordent.
- Captures regardées : Travaux, Économie › Synthèse, Décider, L’équipe en sombre, Aujourd’hui avant/après (identique à l’œil), la roue.
- **Ce que la chaîne a trouvé** (539 commandes, sept rouges au premier passage, tous expliqués) : `jetons` — le repli de `--radius-card` vaut 16 px dans sa table (l’alias historique) : le bloc lit `--r-lg` (12) ; ses graisses passent sur `--fw-reg/med/semi` (0 graisse « hors pas » ajoutée) ; cliquet regravé à la baisse (rayons en dur 219 → 216, déjà vrai sur la base ; graisses hors pas 145 → 141) et le plancher des cercles relevé (106 → 125, déjà vrai sur la base). `couches` — `.arcan` est déclarée dans `index.html` : retirée du bloc (elle était déjà à 12 px sans ombre). `tete2` — « TETE-2 ferme la feuille » : seul le gabarit peut désormais le suivre, et il doit fermer la feuille (TETE-2 garde la main sur tout ce qui le précède). `cadre1` — il coupait les sélecteurs à chaque virgule, donc `:is(#page-pilotage, #ovReglPilotage) …` se lisait « `:is(#page-pilotage` » et passait pour une règle qui affiche la page : il coupe maintenant aux virgules de premier niveau. `autete1` — sa nouveauté et sa ligne de `sw.js` se lisaient à la première place : lues à leur version (10.10, 10.91), elles ne rougiront plus au lot suivant.

### 455f. Ce qui n’a pas été fait, ou pas vérifié
- **Laissé exprès** : les pièces communes à toute l’appli gardent leur style dans le Pilotage — bouton Aide (« ? » en 700), pastille de synchronisation, icône météo de l’en-tête (15 px), titre des feuilles (22 px), `.mvcarte-fond`. Les changer dans le seul Pilotage ferait un en-tête différent des autres modules. La cadence d’Aujourd’hui › Économie (`.ck-ta-b`, 14 px, une échelle à repère) et les fils de 3 à 4 px (`.pil-tgrad`, la météo, `.ck-per-piste`) ne sont pas des jauges.
- **GABARIT-2** : l’épaisseur des barres de graphique, graphique par graphique (27 dessins dans `pilotage.js`, 7 à 17 px, certains superposent prévu et réel exprès — la maquette n’en a uniformisé que les arrondis, l’intégration pas encore) ; le contrôle **au rendu** (mesurer l’appli construite et rougir si un rôle prend deux styles) ; les 18 `font-family:var(--font-titre…)` écrits en ligne dans `pilotage.js`, sans effet sous le bloc.
- **Pas vu** : son téléphone, son PC à 125 %, Safari.

## 456. ★★ GABARIT-2 — PILOTAGE : LES BARRES DES GRAPHIQUES À LA MESURE DE LA CHARTE ; PLUS DE CORMORANT ÉCRIT DANS LE MODULE ; LE GABARIT MESURÉ SUR LE BUILD, EN CI (25/10 — `src/pilotage.js` (`_PIL_GB` neuve ; `_pilFriseSvg`, `_pecTaskSvg`, `_pecEcartSvg` : la barre à `_PIL_GB.h`, le réel à `.h2`, l’arrondi à `.r` ; `_rfCalSvg`, `_pilAnRenfortSvg`, `_pilAnBudgetSvg`, `_pilDemandSvg`, `_pexGraph` : les colonnes à `.rv` ; 19 polices `--font-titre` retirées, dont l’attribut du centre de l’anneau d’Économie) · `src/utils.js` (APP, WHATS_NEW 10.12 niv 0) · `index.html` · `public/sw.js` · `scripts/mv-gabarit-rendu.mjs` (neuf) · `package.json` (`test:gabarit`) · `.github/workflows/ci.yml` (étape après les tutos) · `scripts/mv-harnais-gabarit2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` (§6b, §28) · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/GABARIT-2.json` · **APP 10.11 → 10.12, SW 10.92 → 10.93**, base `57ae3e3`)

### 456a. D’où ça vient
Ce que GABARIT-1 (§455f) laissait au lot suivant, annoncé à Nico avec la livraison : l’épaisseur des barres des graphiques, le contrôle au rendu, les polices Cormorant devenues sans effet. « suite ».

### 456b. Les barres des graphiques
Relevé (maquette, §455b) : 15, 16 et 17 px pour les barres horizontales, 11 px pour le réel, des arrondis de 1,5 à 5. Lu dans le code avant de toucher : **le réel de la frise n’est pas superposé au prévu** (il est dessous, `yR = yC + 30`) ; les colonnes de « Mois par mois », du renfort, de Décider et du détail de l’exercice sont **empilées** (un arrondi plus grand creuserait des encoches entre les segments) ; les lignes laissent la place (`rowH` 46, 34/48, 24/26). D’où `_PIL_GB = { h:16, h2:10, r:4, rv:2 }` : la barre d’un graphique (= `--barre-graph-h`), la barre secondaire (= `--jauge-h`), son arrondi (= `--r-xs`), l’arrondi d’une colonne. **Un attribut SVG ne lit pas `var()`** : la mesure recopie la charte, et `mv-harnais-gabarit2` rougit si les deux divergent. Laissés : les pastilles de légende (11 × 9), les repères de 2 px, la pastille d’étiquette de Décider (15 px, arrondi 7,5) — ce ne sont pas des barres.

### 456c. Le contrôle au rendu — ce qu’avait promis GABARIT-1
`scripts/mv-gabarit-rendu.mjs` refait ce qu’a fait la maquette : l’appli construite, la démo avec le domaine fictif des tutos posé avant `_startDemoVisite`, un peu de travail validé, les 15 vues (Aujourd’hui ×3, Travaux, Équipe, Décider, Économie ×6, Conformité, Archives, la roue) au téléphone et sur ordinateur, les cartes repliées dépliées. Il rougit sur : une seconde police, une graisse hors 400/500/600, une taille hors des huit crans, **un rôle qui prend deux styles** d’une vue à l’autre (8 rôles lus par le chemin de l’élément, le relevé de la maquette), une jauge qui n’a pas 10 px (6 pour une frise), une carte qui n’est pas à 12 px. Hors mesure, exprès : les pièces communes (§455f) et les exposants. Une capture revenue à l’écran de connexion ne compte pas (§371). **Sa contre-épreuve** (`-- --contre`, local) pose cinq défauts à l’écran — ⚠️ avec **deux identifiants** : le bloc du gabarit pèse un identifiant et **deux** classes (`:is()` prend le plus lourd de sa liste), un défaut posé avec un seul identifiant perdait contre lui et la contre-épreuve passait pour muette (vu au premier essai : trois défauts sur cinq ne s’affichaient pas). Branché comme les tutos : `npm run test:gabarit`, étape de la CI après eux (`mv-harnais-portes` accepte les étapes `test:*` ; il est resté vert).

### 456d. Les polices Cormorant écrites dans le module
19 déclarations `font-family:var(--font-titre…)` (feuilles injectées `_pecCss`, `_pilCssV2`, styles en ligne de quatre cartes, et l’attribut du centre de l’anneau d’Économie, aligné sur `var(--font-ui,Outfit)` comme les autres textes de graphique). Toutes à l’écran (`_pecCss` n’est appelée que par l’écran d’Économie et la roue) : sans effet depuis GABARIT-1, elles mentaient sur ce que l’on voit.

### 456e. Ce qui a été vérifié
- `mv-harnais-gabarit2.mjs` : 11 vertes, 11 contre-épreuves (la mesure commune colle à la charte, les trois graphiques à barres la lisent, plus d’arrondi « à part », plus de Cormorant, npm et la CI jouent le contrôle au rendu, qui a sa contre-épreuve).
- `npm run test:gabarit` sur le build du lot : vert (30 vues relevées) ; `-- --contre` : les cinq défauts rougissent.
- Diff de `pilotage.js` borné : chaque ligne retirée porte une hauteur de barre, un arrondi ou une police `--font-titre`.

### 456f. Ce qui n’a pas été vérifié
- Le contrôle au rendu **dans la CI de GitHub** : joué ici avec le Chromium du bac à sable ; la CI installe le sien (`npx playwright install --with-deps chromium`, déjà là pour le smoke et les tutos). À regarder au premier push.
- Son téléphone, son PC à 125 %, Safari.

## 457. ★★ CAVEPIL-3 — PILOTAGE › VUE CAVE : LE CHAI NE DESSINE QUE CE QUI DEMANDE UN GESTE ; LES CUVÉES EN COURS, PUIS À JOUR, SUR UNE RANGÉE CHACUNE ; LE FÛT MARQUÉ GARDE SON ROND (25/10 — `src/cockpit-vue.js` (`cvPlan` réécrite avec `cvCuvee`, `cvGroupe`, `cvPhase`, `cvPl` ; `cvFiltrer` déplie les rangées ; `cvTip` ; le toucher de la rangée ; `S.cvGrp` ; la bulle `cvplan` et le cadre du bloc) · `src/pilotage.js` (`_pilCk2Cave` : `pro`, `proTxt`, `cours`) · `src/cave.js` (`_caveSynthese` : `pro`) · `src/styles.css` (bloc ★★ CAVEPIL-3, entre CAVEPIL-2 et AUJ-TETE-1) · `src/utils.js` (APP, WHATS_NEW 10.13 niv 1, MV_AIDE du Pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` (régénéré) · `docs/claude/modules.md` · `scripts/mv-harnais-cavepil3.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `CLAUDE.md` (consolidation, §28) · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/CAVEPIL-3.json`)

### 457a. D’où ça vient
Nico (25/10, dicté) : « dans Pilotage, Aujourd’hui, Cave, c’est peut-être pas utile de marquer les fûts qui sont à jour […] étant donné qu’ils sont verts, ça prend de la place, je trouve, pour pas grand-chose, à moins qu’il y ait possibilité d’optimiser ça […] fais-moi un truc professionnel ». Le nombre « à jour » de la légende reste. Objectif reformulé et confirmé (« oui »).

### 457b. La maquette — et sa première version, refaite avant d’être montrée
`maquette-pilotage-cave-futs-a-jour.html` (hors dépôt) : la colonne « Aujourd’hui » montée avec la vraie feuille (la charte et les règles du bloc extraites de `styles.css`) et le vrai modèle `V.cave` de la démo, lu dans l’appli construite ; **mesurée identique à l’appli** (1 000 px sur ordinateur, 1 065 px au téléphone, avant GABARIT) — c’est ce qui rend la comparaison honnête. Quatre situations (la démo, un chai d’hiver à 126 fûts, la malo partout, tout à jour), la variante « ranger aussi les En cours » à cocher.
★ **La première version ne tenait pas sa promesse, et c’est la mesure qui l’a dit** : un encadré (icône, titre, ligne d’ouillage, bouton, une pastille par cuvée) prenait plus de place qu’une rangée de huit fûts — 1 051 px pour 1 000 sur la démo, −14 % seulement sur le chai d’hiver. Dit à Nico, refait avant de la montrer : une rangée de la famille des lignes de cuvée, les noms dans la bulle et le dépliage. Ensuite : démo −2 %, chai d’hiver −34 % (−37 % au téléphone), la malo partout −14 % (−40 % avec la variante), tout à jour −53 %. Validée (« parfait »), avec la recommandation : les cuvées en cours aussi.

### 457c. Ce qui a été fait
- **Ce qui demande un geste reste dessiné** : l’alerte (fermentation qui ralentit, malo bloquée, signe fort au Diagnostic) et le à faire gardent un rond par fût. Une malo qui bloque passe en alerte : ranger les « En cours » ne cache aucun problème — c’est l’argument de la recommandation.
- **Deux rangées, de la famille des lignes de cuvée** (mêmes marges, même survol ; 14 px le nom, 12 le reste : le gabarit du §455 n’a rien à reprendre) : « En cours » (le nombre de malos en cours et de fermentations à finir en fûts), puis « À jour » (le prochain ouillage : le plus proche, deux noms au plus, aucun pour une cuvée seule, « N cuvées » au-delà) ; une seule cuvée donne son nom ; « Tout est à jour » seulement quand rien d’autre n’est au Chai. Un filet les sépare de ce qui demande un geste.
- **Le fût marqué garde son rond** : sous la rangée, aligné sur le texte, avec sa cuvée, son signe et sa référence ; il ouvre la cuvée, sa bulle est celle du fût (§437). Déplié, il est dans sa ligne : la liste se cache.
- **Déplier** : la rangée (« Tout voir » / « Replier », le mot du fil « En direct ») ou l’état choisi dans la légende. `cvFiltrer` pose la classe sans redessiner : le dessin ne dépend pas de l’état (le `pose()` de `majCave` ne réécrit le bloc que si le dessin change) ; replier une rangée ouverte par la légende efface ce filtre ; pas de bulle sur une rangée dépliée.
- **Le prochain ouillage vient de l’agenda de la Cave** : `_caveSynthese` calculait déjà `pro[id]` (le premier ouillage de `_mlOuillages` après aujourd’hui, au jour ouvré) sans le passer : il le passe (`pro`). Le Pilotage le met en forme (`proTxt`, « mer. 4 nov. ») et dit la phase d’une cuvée en cours (`cours` : `fa` ou `malo`) — aucun agenda recalculé dans le Pilotage. Sur la démo, le mer. 4 nov. de l’appli est celui que la maquette avait posé à la main (21 oct. + 14 j).
- **Les textes** : la bulle « i », le cadre du bloc (« Chaque cuve, et les fûts qui demandent quelque chose »), la fiche d’aide du Pilotage, la page du guide, les nouveautés (10.13, niv 1).
- **Trouvé à la capture** : au téléphone, « 8 fûts » tombait seul sous « Bourgogne Pinot Noir ’25 · ». Le point est collé au nombre (espaces insécables) : la coupure tombe dans le nom.

### 457d. Ce qui a été vérifié
- `mv-harnais-cavepil3.mjs` : 25 vertes — le vrai `cvPlan` monté dans Node sur un Chai d’exemple —, 14 contre-épreuves qui mordent. Au premier passage, une assertion fausse (le découpage d’une rangée allait jusqu’à la fin du Chai et comptait les fûts de la suivante), corrigée.
- L’appli construite, la démo, ordinateur et téléphone, clair et sombre : les deux rangées (« En cours · Vieilles Vignes ’26 · 22 fûts · 1 fermentation à finir en fûts », « À jour · Bourgogne Pinot Noir ’25 · 8 fûts · Prochain ouillage mer. 4 nov. »), le dépliage par la rangée puis par la légende, aucune erreur. Hauteur du bloc sur la démo (la base `b19f1f3` construite à côté pour la mesure) : 1 002 → 931 px sur ordinateur, 1 067 → 1 002 px au téléphone. Sur la démo, il n’y a qu’une cuvée à jour : le gain grandit avec le chai.
- `npm run test:gabarit` sur le build du lot : vert (15 vérifications) — les deux rangées ne prennent que des tailles et des graisses du gabarit (14 / 12 px, 600 / 400). `npm run test:tutos -- --concernes` : aucun tuto ne touche le lot ; le côte à côte rejoué (3, vert).
- **Ce que la chaîne a trouvé** (deux rouges au premier passage, tous deux justes) : `mv-harnais-icones` — « la graisse du jeu est déclarée une seule fois » : la coche de la rangée redisait l’épaisseur du trait (`stroke-width`), retirée : elle prend le trait commun du jeu ; `build-guide --check` — la page du guide régénérée (`node scripts/build-guide.mjs`), comme les lots CAVEPIL d’avant. À la capture, un faux rouge du test : la pâleur d’une rangée filtrée lue à l’instant du clic (1) au lieu d’après la transition (0,25).
- `npm run check` sur l’état final : **543 commandes, 0 rouge** (jouée en deux morceaux, l’espace de travail ayant coupé le processus : 1 à 192, puis 193 à la fin). La base `b19f1f3` vérifiée comme HEAD (`mv-base`).

### 457e. Ce qui n’a pas été fait, ou pas vérifié
- Son téléphone, son PC à 125 %, Safari ; un vrai chai de domaine (les gains de 457b sont mesurés sur des situations construites).
- **Laissé exprès** : le Cuvier — une cuve décuvée garde son dessin pointillé ; la légende garde ses quatre états et ses chiffres.

## 458. ★★ MAPIED-1 — PLANNING : LA MISE À PIED DISCIPLINAIRE, UN MOTIF D’ABSENCE — CONTRAT SUSPENDU, NI PAYÉE NI RATTRAPÉE, HORS HEURES SUP ET RÉCUP ; SA LIGNE À RETIRER DANS « POUR LA COMPTA » (25/10 — `src/planning.js` (`PLAN_ABS_MOTIFS`, `PLAN_ABS_ORDRE`, `_planAbsEffet`, `PLAN_ABS_COURT`, `PF_NEUTRE_LIB`, `_pfNeutreRetire`, `_pfNeutresRetire`, `_pfNeutresPhrase`, `_pfCompta`, `_pfPaieDonnees`, `_pfV3`, `_pfCadre`, le jour par jour, `_planReleveFiche_`) · `src/utils.js` (fiche d’aide du Planning, WHATS_NEW 10.14) · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-mapied1.mjs` (neuf) · `scripts/mv-harnais-recup.mjs` (L15, contre-épreuve CLAIR-1) · `scripts/mv-harnais-cavepil3.mjs` (assertion 6) · `scripts/mv-harnais-liste.mjs` · APP 10.13 → **10.14** · SW 10.94 → **10.95**)

### 458a. D’où ça vient
Nico (22/10, dicté) : ajouter aux absences du planning une « absence pour motif disciplinaire » — « généralement, c’est une mise à pied » —, des jours « ni payés, ni à rattraper » ; « regarde un peu dans les lois ». Puis (25/10) : « bien regarder au niveau du droit du travail […] pour le rattrapage des heures, s’il y a des heures sup dans le mois, comment ça doit être compté ». Objectif reformulé et confirmé. Corrigé au passage : le contrat n’est pas rompu, il est suspendu (il existe toujours, sans travail ni salaire).

### 458b. Ce que dit le droit (sources citées dans la réponse du 25/10)
- **Accord national agricole du 23/12/1981, art. 10.4** — le texte des taux 25/50 % de SEM-1 : 4.2, une absence non rémunérée n’est pas récupérable, la déduction se valorise sur le temps qui aurait été travaillé, heures sup comprises ; §2, sous annualisation, les heures d’absence se comptent sur l’horaire programmé, 1/151,67 du salaire lissé par heure ; 8.4, la durée maximale annuelle se réduit à due proportion des suspensions.
- **Code du travail, L3121-50** : seules les interruptions COLLECTIVES se récupèrent — jamais une absence individuelle.
- **La mise à pied disciplinaire** : une sanction, qui suspend le contrat ; ce n’est pas du travail effectif (ni congés payés ni ancienneté) ; la retenue suit strictement l’absence. Un règlement intérieur, s’il existe, doit la prévoir avec sa durée maximale (Cass. soc. 26/10/2010). ★ La mise à pied **conservatoire** est un autre cas — repayée, congés compris, sauf licenciement pour faute grave ou lourde : laissée de côté.
- ★ **Cass. soc. 3 juin 2026, n° 24-19.545 (FS-B)** : sous annualisation, un arrêt maladie en période haute réduit le seuil des heures sup de la durée de l’absence évaluée sur la durée hebdomadaire **moyenne**, pas sur les heures programmées. `_planSuspH` retire les heures du planning : non changé ici, décision ouverte (§28).

### 458c. Ce qui a été fait
- **Le motif `miseapied`**, mêmes drapeaux que `sansolde` (suspend, non payé, `cpt:''`, journée entière) — et le calcul n’avait rien à apprendre : `_planJourEcart` rend zéro pour un motif sans `cpt` (ni heure sup créée ni absorbée dans la semaine), `_planSuspH` baisse le plafond annuel, le compteur ne bouge pas. Mesuré sur le vrai moteur : 5 h sup à 25 % avec ou sans les trois jours, même solde de récup, 0 h à rattraper, 0 retenue au compteur.
- **L’affichage, lu aux drapeaux** (`_pfNeutreRetire` : suspend et non payé — l’arrêt, payé, n’en est pas) : une ligne « à retirer » à son nom dans « Pour la compta » (dates, règle), le total de la retenue (`D.nonPayeTotal`), « À retirer » du relevé v3, « non payée(s) » au jour par jour (fiche et relevé), un point de légende en page 2 et l’exception à « jamais les deux » — ces deux-là seulement les mois où il y en a : la page 2 n’a pas de place à perdre.
- ★ **Trouvé en route, corrigé pour les deux motifs** : un mois avec un congé sans solde portait « Aucune retenue — le salaire de base se paie en entier » juste au-dessus de « Congé sans solde : 7h à retirer ». La ligne du salaire de base reste celle des absences du salarié (NET-1) et dit « Aucune autre retenue », puis renvoie à la ligne à retirer. Écarté : tout additionner dans la ligne du salaire de base — la compta saisit chaque nature sur sa propre ligne de paie, et un total « dont » se lit deux fois.
- **Confidentialité** : rien à faire — `vueJour` (functions) ne donne que « absent » aux collègues, `_dzMotif` aussi dans le Pilotage.
- **Les textes** : l’effet sous le motif, la fiche d’aide (un point neuf, trois phrases reprises), le guide (une ligne du tableau, trois passages « jamais ensemble »), les nouveautés 10.14 (niv 1, et niv 0 pour la ligne du salaire de base).

### 458d. Ce qui a été vérifié
- `mv-harnais-mapied1.mjs` : 39 vertes — le vrai `planning.js` dans Node, un octobre à prénom fictif (mise à pied les 6, 7 et 8 ; +2 h le 9, +3 h le 19), comparé au même mois sans elle ; une absence injustifiée du même mois garde exactement sa retenue ; août 2026 (l’ancien cadre) ; le relevé imprimé capturé ; la vue des collègues ; 9 contre-épreuves qui mordent.
- ★ **Ce que la chaîne a trouvé** : `mv-harnais-robustesse-planning` (graine 4, janvier) — un remplacement trop large avait collé `_planFmtD.nonPayeTotal` dans l’ancien cadre : l’ancre `(P.nonPayees+D.sansSolde)` portait les parenthèses de l’appel `_planFmt(…)`. Réparé ; le harnais du lot regarde maintenant ce cadre lui-même (5f, 5g). `mv-harnais-recup` L15 : huit motifs en journée au lieu de sept — l’assertion suit le motif neuf.
- Preflight : 0 erreur, 13 avertissements (13 sur la base).
- `npm run check` (545 commandes, 893 s) : 4 rouges, tous expliqués, levés et rejoués verts — `build-guide --check` (attendu : `public/guide.html` ne part pas dans le lot ; régénéré ici pour vérifier, `--check` vert, puis remis — `npm run site` chez Nico) ; `mv-harnais-recup --contre` (la contre-épreuve CLAIR-1 visait l’ancienne ligne du salaire de base : ancre suivie, 90 défauts détectés) ; `mv-harnais-cavepil3` et sa contre-épreuve (l’assertion 6 voulait le bloc 10.13 EN TÊTE de WHATS_NEW : elle le cherche à sa place — un harnais n’exige pas « en tête », le lot suivant le casse ; celui de ce lot ne le fait pas). Aucun tuto ne touche le lot (`mv-tutos-concernes`).

### 458e. Ce qui n’a pas été fait, ou pas vérifié
- Son téléphone et son PC : la fiche du jour avec le motif, la ligne de la compta, le relevé PDF regardé.
- **Laissé exprès** : la mise à pied conservatoire ; la valeur des suspensions dans le plafond annuel (Cass. 3 juin 2026) ; les absences injustifiées reprises sur la récup (NET-1) face à l’accord (4.2) — décisions, §28.
- **Ouvert, comme le congé sans solde (§151)** : une mise à pied posée après « Figer » n’entre pas dans le report du mois suivant.

## 459. ★★ UX-0 — LE CLIQUET DE L’EXPÉRIENCE D’USAGE : LES DIX PAGES, AU TÉLÉPHONE ET SUR ORDINATEUR, MESURÉES SUR LE BUILD, EN CI (26/10 — `scripts/mv-ux-rendu.mjs` (neuf) · `scripts/mv-ux-baseline.json` (neuf) · `scripts/mv-harnais-ux0.mjs` (neuf) · `package.json` (`test:ux`) · `.github/workflows/ci.yml` (étape après le gabarit) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` (§6b, §28, consolidation) · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/UX-0.json` · **aucun bump**, base `42c2543`)

### 459a. D’où ça vient
Nico (25/10, dicté) : « inspire-toi des plus grands […] Apple, Google, Facebook » pour l’ergonomie et l’expérience ; puis « reprends l’intégralité de toutes les améliorations […] chiffre le travail et le nombre de lots […] l’appli doit correspondre parfaitement aux maquettes ». Livrés hors dépôt : l’audit des fonctions face aux références du marché (`audit-niveau-au-dessus-2026-10-25.md`), l’audit d’expérience d’usage mesuré sur la démo construite (`audit-ux-2026-10-25.md`), le plan en 22 lots (`plan-mise-en-place-2026-10-25.md`), trois maquettes (`maquette-niveau-au-dessus-v1.html`, `maquette-ux-v1.html`, `maquette-ux-v2.html`). Trois décisions le 25/10 (§28). UX-0 ouvre le plan : poser le cliquet avant de faire baisser les chiffres, pour qu’ils ne remontent plus.

### 459b. Ce qui est mesuré, et comment
- **Dix pages** (`home` à `reglages`), au téléphone (390 × 844, tactile) et sur ordinateur (1366 × 900), **dans la page active** — le dock, commun à toutes, reste hors mesure.
- `c24` / `c44` : les cibles visibles (`button`, `a[href]`, `[onclick]`, champs, `[role=button]`, `label[for]`, `summary`) dont le plus petit côté, arrondi, est sous 24 / 44 px. Un lien pris dans une phrase n’est pas une cible (l’exception de WCAG 2.2).
- `t11` / `t12` : les textes visibles sous 11 / 12 px (taille calculée), exposants exclus.
- `chrome` : la pile des bandeaux collés en tête — collés (sticky) ou fixes, au moins la moitié de la largeur, contigus à 24 px près —, au repos ; `chromeDefile`, la même après 900 px de défilement (ou ce que la page permet, 300 px au moins).
- `pouce` : au téléphone, sur les pages de liste, les actions du tiers haut de l’écran moins celles du tiers bas.
- **Neuf gestes** de la maquette v2 : le haut de la session en cours du tracteur (`.scard-enc`), les cibles sous `#trac-fab`, les dates `AAAA-MM-JJ` du registre phyto, Relever / Ouiller / Soutirer sous 44 px, un sommaire collé dans la Cave, une action flottante dans la Réserve, le haut de `.pl2-grid`, le haut du premier `.set-row` des Réglages, le plus petit côté du bouton `pQuickValidate`.

### 459c. Les arbitrages
- **L’horloge** : `page.clock.install({ time })` puis `page.clock.resume()` — posée au mardi 27/10/2026 à 9 h (Paris), puis elle tourne. `setFixedTime` écarté : un `Date.now()` figé bloque tout code qui attend qu’un délai s’écoule. Sans horloge posée, le relevé suivrait le jour de la semaine : la démo se construit autour d’« aujourd’hui ».
- **La marge** : 1 cible, ou 4 px pour une hauteur ; aucune pour les textes, les dates et les oui/non. La police est la même partout (`dist/fonts`), le navigateur non : le bac à sable joue Chromium 141.0.7390.37, la CI celui de Playwright 1.61.
- **Regraver** : refusé dès qu’une mesure monte ; `--accepte "<raison>"` écrit la raison dans `regravures`. Une hausse voulue se décide, elle ne se glisse pas — un sommaire collé qui allonge `chromeDefile`, par exemple (CAVE-UX-1).
- **Une page perdue ou une pièce introuvable rougit** : un harnais qui déménage doit rougir, on le suit (§6c).
- **Hors `npm run check`** (il faut un build et un navigateur), comme le gabarit (§456) ; `mv-harnais-ux0` garde le branchement à chaque check.

### 459d. La référence gravée (26/10, base `42c2543`)
| | téléphone | ordinateur |
|---|---|---|
| cibles sous 24 px | 19 sur 416 | 19 sur 428 |
| cibles sous 44 px | 322 (77 %) | 271 (63 %) |
| textes sous 11 px | 68 sur 1 363 | 64 sur 1 487 |
| textes sous 12 px | 172 (13 %) | 190 (13 %) |
| bandeaux au repos | 178 à 309 px | 187 à 241 px |
| bandeaux en défilant | 178 à 192 px | 178 à 232 px |

Gestes : la session du tracteur à 474 px ; 1 cible sous le « + » ; 15 dates écrites `2026-09-08` ; 5 gestes de la Cave à 28 px ; ni sommaire collé dans la Cave, ni action flottante dans la Réserve ; la grille du Planning à 472 px ; le premier réglage à 385 px ; Valider à 48 px.
⚠️ Ce ne sont pas les chiffres de l’audit (69 % de cibles sous 44 px au téléphone) : l’audit comptait aussi le dock, sans horloge posée. **La référence, c’est ce fichier.**

### 459e. Mesuré
- Trois gravures et deux relevés de comparaison : aucun écart. Le relevé complet prend 89 à 92 s, la contre-épreuve 27 s.
- Contre-épreuve : sept défauts posés à l’écran (les cibles, les textes et le bandeau du Journal, la grille du Planning, le « + » du tracteur, une date au registre, un geste de la Cave) → 7/7 rougissent. ★ Un défaut était muet : un `margin-bottom` sur `.pl2-perbar` ne déplaçait pas la grille ; remplacé par un `padding-bottom` sur `#plan-stats-band`.
- Regravure : refusée sur une hausse sans raison (testé) ; acceptée avec `--accepte`, la raison écrite (testé sur une copie, puis la vraie référence remise) ; `--accepte` sans raison refusé.
- `mv-harnais-ux0` : 14 assertions, 14/14 mutants mordent ; `mv-harnais-lanceur` 23 verts ; `mv-harnais-portes` 13 verts.

### 459f. Trouvé en route
- ★ **La validation rapide a déjà son « Annuler cette validation »** — la feuille de fin (`_mvdsOpen`, `pQuickUndoEntry`). L’audit d’expérience d’usage annonçait zéro « Annuler » dans l’appli : faux pour ce geste. ANNULER-1 part de là, le même patron pour les gestes réversibles qui restent.
- ★ Sur ordinateur, la page commence 9 px sous le haut : la première mesure des bandeaux y lisait 0 — d’où la contiguïté à 24 px.
- ★ La règle F de `mv-harnais-lanceur` ne garde que les scripts **de la liste** : déclarer `mv-ux-rendu.mjs` dans `ECRIT_HORS_LISTE` l’y rendait « périmé ». Le compagnon vérifie à la place que la liste ne le joue jamais.

### 459g. Ce qui reste ouvert
- **Le premier passage en CI** — un autre navigateur : s’il rougit, ce sera d’abord sur les textes (marge zéro). Lire l’écart, puis décider : une marge d’un texte, ou une regravure `--accepte` si l’écart vient du navigateur et non de l’appli. **À confirmer.**
- Le plan continue (§28) : CIBLE-1, puis ANNULER-1.

## 460. ★★ ECART-1 — PILOTAGE › AUJOURD’HUI, VUE ÉCONOMIE : L’ÉCART AU BARÈME SE LIT EN HEURES ; LA TUILE EST LE TOTAL DE LA CARTE, UN TIRET QUAND RIEN N’EST À COMPARER ; BARRES À L’ÉCHELLE JUSQU’À ±50 %, EN POINTE AU-DELÀ (26/10 — `src/pilotage.js` (`_pecData` : `t.reB`, `t.reHb` ; `_pilCk2Eco` : `ecTache` en heures, `hBarTache`, `ecartMoy` = le total, `null` sans rien à comparer) · `src/cockpit-vue.js` (`NFH`, `ecTxt`, `ecCadre`, `hTxt`, `TA_ECH`, `taBarre`, `taClasse`, `taHeures` ; `calc` ; la tuile de `htmlEKpis` ; `htmlTaches` ; `majEco` ; fiches « i » `ecart` et `taches`) · `src/styles.css` (`.ck-ta-v.hors`, à côté des règles de la barre ; `.ck-ta` : 8 px entre la barre et l’écart, la colonne de l’écart à 64 px au téléphone) · `src/utils.js` (APP, WHATS_NEW 10.15 niv 0, MV_AIDE du Pilotage) · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-ecart1.mjs` (neuf) · `scripts/mv-harnais-ref2.mjs` (le contrat) · `scripts/mv-harnais-auj7.mjs` (une ancre) · `scripts/mv-captures.mjs` (écrans `pilotage-eco`, `pilotage-eco-ecart`) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` (consolidation, §28) · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ECART-1.json` · **APP 10.14 → 10.15, SW 10.95 → 10.96**, base `6f02a82`)

### 460a. D’où ça vient
Nico (25/10, capture de la vue Économie d’Aujourd’hui, « Hiver 2026 - 2027 », 46ᵉ jour sur 203) : « il faut corriger aussi cette histoire d’écart au barème ». À l’écran : la tuile « Écart au barème » à **0,0 %** (« heures réelles face au barème ») ; à côté, la carte « Écart au barème, par tâche » : Réparation **+620,4 %** (15 h de barème, 108 h réelles), Dégraffage **+13,1 %** (322 h, 374 h), deux barres de la même longueur. Déjà vu au passage par JCAVE-1 (§428a), laissé aux décisions (§428e). Reformulation confirmée : « oui relis les fichiers il y a eu des maj et go ».

### 460b. Ce que le code faisait — trois défauts sous un même nom
1. **La tuile lisait l’écart de cadence** (`E.cad` : toute la présence du planning, moins le tracteur et les travaux à l’heure, face à tout le barème fait). Il ne se calcule qu’à 40 % du travail de la période validé (`_PEC_CAD_AVC`) ; en dessous, `_pilCk2Eco` envoyait **0** et `pct1` l’écrivait « 0,0 % » — un chiffre qui n’est pas une mesure, sur le même écran qu’une carte qui en est une. (La marche 2 de l’escalier — la même période l’an dernier — y aurait écrit le chiffre d’une autre campagne sans le dire.)
2. **La carte annonçait des heures et calculait en euros** : `ecTache = t.ecE / t.fE` (le réalisé payé sur le barème du fait, RÉAL-1, §188), sous « N h de barème » lues dans `calcHeures` (`h_done`, l’avancement) et « M h réelles » du temps réel — trois calculs pour une ligne. 374 h pour 322 h, c’est +16,1 % ; l’écran écrivait +13,1 % : les heures sont payées au taux de ceux qui les ont faites, le barème au taux de l’équipe de la parcelle.
3. **La barre s’arrêtait à 10 %** (`B = 10` au dessin, `Math.min(10, …)` à la mise à jour) : au-delà, toutes pleines.
★ Et un plantage discret : une tâche qui devient comparable en direct (VIF-1, §414) n’a pas encore sa ligne ; `majEco` levait sur `null`, `_pilRafraichirVif` avalait l’erreur et remontait toute la page.

### 460c. L’arbitrage
- **Une page, une mesure** : la tuile est le **total** de la carte — la somme des heures versées sur la somme des barèmes des mêmes validations, sur les seules lignes comparables. La règle de « Par poste » (AUJ-7, §309 : l’écart de la campagne est la somme de ses lignes).
- **Les heures du temps réel** (TV-1, §172 ; cave retirée, JCAVE-1, §428 ; tracteur retiré), face au barème **des mêmes validations** (`x.bar` ; une revalidation ne le recompte pas, RÉAL-1). `_pecData` le pose sur la tâche (`t.reB`, `t.reHb`) là où il apparie déjà le temps réel aux tâches (`_friseNorm`) : pas de seconde copie de l’appariement dans `_pilCk2Eco`. Ce sont, ligne pour ligne, les chiffres de « Temps réel contre barème » (onglet Économie).
- **Une ligne seulement si les deux côtés existent** : sans heure versée, pas de « −100 % » (la règle de TV-1) ; un travail à l’heure n’a pas de barème en face (AUJ-7).
- **Rien à comparer → `null`** → un tiret, « rien de validé à comparer » ; un zéro mesuré reste « 0,0 % ».
- **La cadence n’est pas touchée** (consigne du 23/09) : elle corrige toujours la projection de l’atterrissage, à partir de 40 %. La fiche « i » de la tuile et le guide le disent. ⚠️ La question de §28 « cadence ou temps réel » n’est tranchée que **pour cet écran**.
- **L’échelle** : ±50 % (`TA_ECH`), proportionnelle ; au-delà, la barre est pleine et **finit en pointe** vers l’extérieur (`clip-path` ; ni rayon ni couleur écrits en dur). Écartés : l’échelle sur le plus grand écart (à +620 %, un +13 % n’est plus qu’un trait) ; la coupure d’axe (deux traits obliques, moins parlante) ; une échelle logarithmique.
- **Les heures au dixième sous 100 h** (`hTxt`) : « 15,4 h de barème, 108 h réelles » redonne le pourcentage ; en entier, « 15 h pour 108 h » ferait attendre +620 % là où l’écran dit +602,6 %.
- **Les nouveautés au niveau 0** (une correction, ANN-1, §225) — le niveau 2 si Nico veut que ses clients la voient sur l’Accueil.

### 460d. Mesuré
- `mv-harnais-ecart1` (neuf) : **26 vertes, 13/13 contre-épreuves**. A, exécuté dans l’appli entière (`mv-app-node`) sur un début d’hiver — réparation et dégraffage validés, taille pas commencée, une étape d’arrachage, quatre taux horaires : avancement 11,9 %, la cadence ne se calcule pas, et la tuile donne le total des lignes ; chaque ligne = l’écart de « Temps réel contre barème » au chiffre près ; l’arrachage a ses heures et pas de ligne ; l’atterrissage reste la fin projetée ; aucune erreur avalée. A’, la vraie `_pilCk2Eco` sur les chiffres de la capture : 374 h pour 322 h = +16,1 % (en euros : +13,1 %), la tuile (108,2 + 374) h sur (15,4 + 322) h, ni « −100 % » ni travail à l’heure, `null` sans rien à comparer. B, les vraies fonctions de la vue, extraites et jouées : le tiret, l’échelle, la pointe, les heures sous la ligne ; la mise à jour et la feuille, lues.
- Remis au nouveau contrat : `mv-harnais-ref2` (15 vertes, 9/9 — trois défauts neufs) ; `mv-harnais-auj7` (24 vertes, 10/10 — l’ancre de « les tâches pas comparables reviennent »). Rejoués sans retouche : `vif1` (13), `ref1` (18), `pilrange1` (19), `temps-vigne` (84), `jcave1` (54), `pro1` (27).
- **Chaîne complète** (`TZ=Europe/Paris`, `--continuer`, une à la fois) : **549 commandes, 0 rouge** — 606 s au premier passage, 609 s au second, sur les sources finales (après la retouche de la feuille trouvée au rendu) ; `build-guide --check` vert après régénération locale de la page (`npm run site`), jamais livrée. Après le build : tutos concernés — aucun tuto, le panneau côte à côte rejoué (3 tailles sur 3) ; `test:gabarit` 15 vérifications, `test:ux` 17, aucune hausse.
- **Rendu** regardé sur l’appli construite, téléphone et ordinateur, clair et sombre. La démo n’a pas d’économie : deux écrans neufs de l’outil de captures. `pilotage-eco` (un taux de repli posé en mémoire, `CONFIG.eco.taux_horaire`, la bascule Économie ouverte) : la tuile « — », « rien de validé à comparer », la carte vide. `pilotage-eco-ecart` (deux lignes posées au montage du cockpit, les chiffres de la capture de Nico) : la tuile à +42,9 %, une barre pleine en pointe (+602,6 %, « 15,4 h de barème, 108 h réelles »), l’autre au sixième de sa moitié (+16,1 %, « 322 h de barème, 374 h réelles »).
- ★ **Trouvé au rendu** : au téléphone, la pointe touchait « +602,6 % » (colonne de 56 px, aucun écart entre les colonnes) → 8 px entre la barre et l’écart, la colonne à 64 px comme sur ordinateur ; recapturé, l’écart est net. **Vu, pas touché** : au téléphone, un nom de tâche long (« Entreplantation » dans la démo) touche le début de la barre — la colonne de 88 px, d’avant ce lot ; « Réparation » et « Dégraffage » tiennent.

### 460e. Trouvé en route
- ★ **Le report des journées sans validation, vu au harnais** : sur le domaine fictif (quatre personnes à 7 h par jour depuis le 14/09, cinq journées de validation), la réparation sort à **+2 592 %** et le dégraffage à +277 % — chaque journée sans validation part sur la prochaine parcelle validée (§428a). La tâche à petit barème s’envole la première. L’outil pour le lire sur de vraies données : « D’où viennent ces heures » (§28).
- ★ La leçon d’AUJ-7 (§309f), une seconde fois : un adaptateur lit la grandeur que l’écran **nomme** — « heures réelles face au barème » se calculait en euros.

### 460f. Ce qui reste ouvert
- **À voir chez Nico** : la vue Économie d’Aujourd’hui sur ses données (la démo n’a pas d’économie) — la tuile égale au total de la carte, la Réparation et le Dégraffage en heures, la pointe, le tiret ; son téléphone et son PC à 125 %, clair et sombre.
- **Les 108 h de Réparation** : ses journées de cave d’octobre sont-elles toutes marquées (§428e) ? Son estimation du 22/10 (33 h, puis deux personnes quelques jours) tomberait vers 75 à 105 h : si elle est juste, c’est le barème de 15 h qui est bas pour ces parcelles. **À confirmer avec lui.**
- « Temps réel contre barème » (onglet Économie) n’a pas de ligne Total ; la tuile d’Aujourd’hui la donne.

## 461. ★★ FERTI-4 — LE CATALOGUE E-PHY GARDE LES MATIÈRES FERTILISANTES VALABLES EN VIGNE (26/10 — `functions/ephy.js` · `functions/ephy-calc.js` (neuf) · `scripts/mv-harnais-ephy-mfsc.mjs` (neuf) · `scripts/fixtures/ephy-mfsc/` (neuf) · `scripts/mv-harnais-liste.mjs` · `.gitignore` (exception pour le jeu d’essai : `*.csv` y est ignoré) · **aucun bump**, base `4e187d9`)

### 461a. D’où ça vient
Nico (26/10, dicté) : « pour l’amendement, pour le E-Phy, j’ai des petits soucis de recherche » — Terrafumur (tapé « terrafumure ») et un « engrais organique 4-10-1 UAB », dont il n’avait que la mention du règlement. Réponse d’abord : les deux sont normés, donc sans AMM et absents d’E-Phy par nature ; « 4-10-1 » est la composition (N, P₂O₅, K₂O en % du poids) ; « conformément au règlement 834/2007 ou 2018/848 » est la mention bio, pas la norme ; Terrafumur s’écrit sans « e » (amendement organique Florentaise, NF U 44-051). Puis objectif reformulé et confirmé (« oui ») : vérifier le catalogue, ensuite maquetter la fiche.

### 461b. La vérification — sur des données réelles, pas sur le code
data.gouv.fr est fermé au bac à sable. Un export E-Phy complet du 24/02/2026 (`decisionamm-intrant-format-csv-20260224-utf8`) vit dans un dépôt public (`a-maurin/phytoDB`) : `functions/ephy.js` y a été rejoué tel quel, modules Firebase et réseau doublés. Mesuré : 925 MFSC autorisées, 364 au catalogue. Les 561 absentes : 122 « toutes cultures » (le type « Traitements généraux » ne porte que ça), 11 qui nomment la vigne autrement (« raisin de cuve », « viticulture »), 41 sans aucune culture, 387 pour d’autres cultures seulement. Pour toutes, la fiche répondait « pas dans E-Phy, s’il est normé, tapez sa norme » : faux, elles ont une AMM.
★ `mfsc_et_mixte_usage` n’a pas de colonne « identifiant usage » : `classify()` le range dans les fichiers PRODUITS, et seul le repli 6 le lisait — au mot « vigne ».
★ Trouvé en route, laissé ouvert : 102 MFSC passent pour « vigne » par le seul nom de catégorie « Arboriculture fruitière et vigne », dont certaines ne visent que des arbres fruitiers (commentaire « pommier, poirier… »). Inchangé ici.
★ La taille : le garde-fou comptait en JSON (909 Ko après deux compactions) ; Firestore compte ~776 Ko pour le même document. Les compactions restent utiles : 1,10 Mo au premier passage, en taille Firestore.
★ E-Phy donne les teneurs déclarées de 439 MFSC sur 925 (l’azote total de 360) : de quoi remplir la composition à la place de l’utilisateur (FERTI-5).

### 461c. Ce qui a été fait
- `functions/ephy-calc.js` (neuf, pur, hors `index.js` comme `planning-vues-calc.js`) : `classeVigne` (v · tc · nc · non), `lireCompo` (totaux N, P₂O₅, K₂O, MO, C ; « dont » et « soluble dans l’eau » ignorés), `tailleFs`.
- `functions/ephy.js`, étape 6bis : chaque MFSC reçoit son rapport à la vigne ; entrent celles qui nomment la vigne (tous statuts, comme avant), puis les « toutes cultures » et « sans culture » **autorisées** ; `vg` et `compo` posés sur les fiches MFSC ; tailles en `tailleFs` ; au-delà de 1 040 000 octets, rien n’est écrit (l’ancien catalogue reste) plutôt qu’un refus de Firestore. Rejoué sur l’export complet : 3 754 → 3 928 entrées, MFSC autorisées 364 → 538, 850 Ko.
- `INCLURE_HORS_VIGNE = false` : les 387 « autres cultures » entreront avec FERTI-5, quand l’appli saura les marquer « Pas la vigne » ; avant, la recherche de l’amendement, celle d’un traitement et l’onglet Catalogue les montreraient comme des produits vigne.
- Harnais `mv-harnais-ephy-mfsc.mjs` sur un extrait réel de 10 AMM (`scripts/fixtures/ephy-mfsc`, lecture CSV sans dépendance : la CI n’installe pas `functions/node_modules`), 21 vertes ; `--contre` pose deux défauts (« toutes cultures » oublié ; les « autres cultures » entrent) : 2/2 attrapés. ★ Premier passage : 1 rouge, et c’était le jeu d’essai (les lignes vigne du PPP coupées par une limite de 40 lignes). Soupçonner le test d’abord.

### 461d. La maquette (hors dépôt, publiée)
`maquette-amendement-v2.html`, l’artefact de la v1 mis à jour : la vraie feuille de l’appli, l’écran « Avant » relevé dans la démo. Étape 1, validée (« c’est parfait ») : statut vigne dans les résultats (Vigne · Toutes cultures · Culture non précisée · Pas la vigne, ce dernier choisissable avec avertissement), « Pas dans E-Phy » réservé aux produits sans AMM, normes en un geste (NF U 44-051, NF U 42-001, fertilisant UE 2019/1009), formule « 4-10-1 » qui remplit N, P, K, teneurs reprises d’E-Phy, « Ce que c’est » qui pose le type nitrates avec sa raison (liste nommée du 7e programme), UAB expliqué.
Étape 2, à valider. Nico (26/10) : « toutes les parcelles qui sont en dessous d’un certain nombre d’hectos par hectare ont été sélectionnées pour l’amendement, pour les renforcer […] et sur cette sélection, nous avons retiré aussi les Bourgognes » ; objectif reformulé et confirmé. Choix par règle : rendement de la vendange (`_mlRendements`, déjà la source du cahier) sous un seuil, sauf des appellations (`p.appellation`), un bouton « Cocher ces N parcelles · X ha » ; une parcelle sans rendement connu reste de côté, nommée. Mesuré : au téléphone, cadre de 390 px comme l’appli, écran « Avant » 2 056 px contre 2 076 (1 %, cause non trouvée).

### 461e. Reste ouvert
- **FERTI-5** : la fiche « Le produit » au dessin de la maquette validée ; `vg` et `compo` lus partout où E-Phy est cherché (fertilisation, traitement, onglet Catalogue) ; puis `INCLURE_HORS_VIGNE = true` dans le même lot ; aide, guide, nouveautés, tutos.
- **FERTI-6** : les parcelles par règle, après validation de la maquette v2.
- La seule catégorie « Arboriculture fruitière et vigne » (102 MFSC) : à trancher.

## 462. ★★ FERTI-5 — LA FICHE « LE PRODUIT » DE L’AMENDEMENT, AU DESSIN DE LA MAQUETTE VALIDÉE (26/10 — `src/phyto.js` · `src/tracteur.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto) · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `functions/ephy.js` · `scripts/mv-harnais-ferti5.mjs` (neuf) · `scripts/mv-harnais-ephy-mfsc.mjs` · `scripts/mv-harnais-liste.mjs` · **bump APP 10.15 → 10.16, SW 10.96 → 10.97**, base `4e187d9`, zip cumulatif avec FERTI-4)

### 462a. D’où ça vient
Maquette v1, étape 1 (§461d) : « Ok, c’est parfait ». Maquette v2, parcelles par règle : « go ». Ce lot pose l’étape 1 ; FERTI-6 posera l’étape 2.

### 462b. Ce qui a été fait
- **La recherche** : chaque résultat porte son statut (`FER_VG`, lu dans `p.vg` posé par la synchro), et « vendu aussi sous … » quand c’est un nom de revente qui a trouvé. Sous la recherche, `_ferEtat` dit ce que l’autorisation du produit choisi permet ; « Pas la vigne » en encadré orange, avec ses cultures (`p.cult`). « Pas dans E-Phy » seulement quand le catalogue est chargé et ne trouve rien, avec « Prendre « … » comme nom du produit » ; catalogue absent (hors connexion) : dit tel quel, plus de faux « pas dans E-Phy ».
- **Les teneurs déclarées** (`p.compo`, FERTI-4) remplacent la saisie seulement si E-Phy en donne ; une teneur retouchée efface la mention « reprise d’E-Phy » (`_ferSet`).
- **Les normes en un geste** (`FER_NORMES`, `_ferNorme`) ; le champ reste libre. Toucher une norme fait du produit un produit normé : AMM et statut retirés.
- **La formule** « 4-10-1 » (`_ferLireNpk`) remplit azote, phosphore, potasse ; deux chiffres laissent la potasse vide ; « NPK 8,5-0-12 + 2 MgO » lit 8,5 · 0 · 12.
- **« Ce que c’est »** (`FER_NAT`, liste nommée du 7e programme) pose le type et dit pourquoi ; « Choisir le type soi-même » ouvre l’ancien choix (`_ferTypMain`). « Chaux, dolomie » ne pose pas de type : `typ:''`, écrit « — » partout (`_ferTypLbl` : liste des apports, cahier imprimé, tableur) — l’ancien repli `FER_TYP.II` l’aurait écrit « Type II ».
- **L’enregistrement** garde `nat` et `vg` sur l’apport.
- **Ailleurs** : « Pas la vigne » dans la recherche d’un traitement (`_phyEphyMeta` porte `vg`, pastille dans `_tratResultRow`) et dans l’onglet Catalogue (« · pas la vigne » / « · toutes cultures » à côté de MFSC).
- **Le serveur** : `INCLURE_HORS_VIGNE = true` ; fiche réduite pour les « autres cultures » (ni usages ni composition en texte ; `cult` = trois cultures au plus). Rejoué sur l’export du 24/02 : 4 315 entrées, 902 Ko en taille Firestore, sous le plafond d’écriture (1 040 000).

### 462c. Mesuré, et vu en route
`mv-harnais-ferti5.mjs` : 34 vertes, contre-épreuve 3/3 (formule qui lit le phosphore à la place de l’azote, compost classé II, statut oublié dans la recherche d’un traitement). `mv-harnais-ephy-mfsc.mjs` : 21 vertes, 2/2, sa contre-épreuve retournée (les « autres cultures » qui resteraient dehors). `mv-harnais-fertil.mjs` : 70 vertes. Preflight : 0 erreur après correction — ★ C24b a vu une interpolation `'+i+'` dans le `onkeydown` neuf d’une ligne de résultat : remplacée par `this.click()`, qui rejoue le `onclick`. Tutos concernés : aucun (5 tutos, aucun ne touche la fiche). Rendu regardé dans l’appli construite, démo, gestes réels joués au clavier et à la souris, catalogue injecté : KTS (encadré « Pas la vigne »), recherche « sv », KITOGREEN YIELD (6 % N repris), l’engrais 4-10-1 (nom pris de la recherche, NF U 42-001, 20 kg N/ha), clair et sombre. Chaîne complète : non jouée en entier dans le bac à sable.
★ Dans l’appli, la ligne choisie prend la teinte de la charte (mauve), pas le vert de la maquette — la ligne « Pas la vigne » aussi : une règle de la charte l’emporte sur `.fer-ri.on.hors`. Le statut reste porté par la pastille et l’encadré. Non corrigé.

### 462d. Reste ouvert
- **FERTI-6** : les parcelles par règle (maquette v2).
- La seule catégorie « Arboriculture fruitière et vigne » (102 MFSC) : à trancher.

## 463. ★ FERTI-6 — CHOISIR LES PARCELLES PAR RÈGLE À L’ÉTAPE 2 DE L’AMENDEMENT (26/10 — `src/phyto.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto) · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `scripts/mv-harnais-ferti6.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · **bump APP 10.16 → 10.17, SW 10.97 → 10.98**, base `4e187d9`, zip cumulatif avec FERTI-5 et FERTI-4)

### 463a. D’où ça vient
Nico (26/10, dicté) : « au domaine, toutes les parcelles qui sont en dessous d’un certain nombre d’hectos par hectare ont été sélectionnées pour l’amendement, pour les renforcer […] et sur cette sélection, nous avons retiré aussi les Bourgognes. Il faudrait qu’il y ait une possibilité de filtre de sélection des parcelles ». Objectif reformulé et confirmé (« oui ») ; maquette v2 (§461d) validée : « go ».

### 463b. Ce qui a été fait
- `_ferRegleCalc(parcs, rdt, seuil, sauf)`, pure : rendement **strictement** sous le seuil (virgule acceptée), sauf les appellations retirées (`p.appellation` sans les espaces) ; sans seuil, seules les appellations jouent ; une parcelle sans rendement connu reste de côté, rendue à part pour être nommée.
- À l’ouverture, une fois : `_fer._mil` = la campagne (`_ferCampDe`), `_fer._rdt` = ses rendements (`_ferRdt` → `_mlRendements`, la source du cahier) ; aucun → la vendange précédente. Pas à chaque frappe : `_mlRendements` parcourt toutes les récoltes.
- Les appellations en pastilles comptées, « Sans appellation » quand une parcelle n’en a pas ; la valeur est lue dans `data-aoc` par le geste — aucune valeur interpolée dans un gestionnaire (C24b).
- Le bouton « Cocher ces N parcelles · X ha » **remplace** la sélection ; Tout cocher, Tout décocher et Zone vulnérable restent, et on ajuste à la main.
- Chaque ligne : l’appellation après le cépage, puis le rendement de la vendange (gras sous le seuil) ou « Rendement 2026 inconnu » — seulement quand au moins un rendement est connu : un domaine sans vendange saisie ne voit pas une colonne de « inconnu ».
- Aide (fiche Phyto), guide (étape « Les parcelles »), nouveautés 10.17.

### 463c. Mesuré
`mv-harnais-ferti6.mjs` : 17 vertes, contre-épreuve 3/3 (« sous » devenu « jusqu’à » ; appellations retirées oubliées ; parcelle sans rendement cochée d’office). ★ Premier passage : 1 rouge, et c’était le contrôle — il cherchait `id="fer-seuil"` en dur, alors que `_ferIn('fer-seuil', …)` le pose. Preflight 0 erreur ; FERTI-5 34 vertes ; fertil 70. Rendu dans l’appli construite (démo, 14 parcelles et leurs rendements injectés, gestes réels) : seuil 35, Bourgogne retirée → « Cocher ces 6 parcelles · 3,98 ha », « Les Jeunes Rois » nommée, 6 cochées dont 1 en ZV — les chiffres de la maquette. Clair et sombre. Tutos concernés : aucun.

### 463d. Reste ouvert
- La seule catégorie « Arboriculture fruitière et vigne » (102 MFSC, §461b) : à trancher.
- La règle ne s’enregistre pas : elle se refait à chaque apport (non demandé).

## 464. ★ FERTI-7 — LA CHAÎNE REVERDIT : UN TUTO POUR L’AMENDEMENT, DEUX LIGNES DE TAILLE REGRAVÉES (26/10 — `src/tutos.js` · `src/phyto.js` · `index.html` · `src/utils.js` (APP, WHATS_NEW) · `public/sw.js` · `scripts/typo-baseline.json` · **bump APP 10.17 → 10.18, SW 10.98 → 10.99**, base `41c3bd9`)

### 464a. D’où ça vient
Nico (26/10) colle la sortie du lanceur : 250 commandes sur 555, arrêt sur `mv-harnais-typo` (« aucun module n’enfle de plus de 5 % en un lot → `src/phyto.js` 147 → 166 ko »). La chaîne s’arrête au premier rouge : la suite a été jouée ici — la chaîne jusqu’à la commande 214, les 58 contrôles qui lisent `phyto.js`, `tracteur.js`, le guide Phyto ou E-Phy, puis aide, charte et gabarit, tous verts — et un second rouge l’attendait : `mv-harnais-tutos`, « gestes sans tuto : 817 (plafond 807) ». Les dix gestes neufs de FERTI-5 et FERTI-6, sans tuto. La règle interdit de relever un plafond après une hausse : la correction est un tuto. Reformulé, « go ».

### 464b. Ce qui a été fait
- **Le tuto `amendement`** (« Comment faire pour saisir un amendement ? », 12 étapes, 2 min, administrateur) : Phyto › Fertilisation ; le bouton « nouveau » ; le nom d’un produit normé (pas d’AMM, donc pas dans E-Phy) ; la norme NF U 42-001 en un geste ; l’exemple d’étiquette ; la formule 4-10-1 (azote, phosphore, potasse remplis) ; la nature (le type nitrates suit) ; l’étape 2 ; « Bourgogne » retirée ; « Cocher ces parcelles ». `couvre` : `switchPhytoTab`, `_phytoFab`, `_ferSet`, `_ferNorme`, `_ferSacTog`, `_ferNpk`, `_ferNat`, `_ferTog`, `_ferSauf`, `_ferRegleGo`.
- ★ **Le bouton « nouveau » a deux formes** : rond (`#phyto-fab`) sous 1 024 px, en texte (`#ph-new-btn`) au-dessus — chacune cachée de l’autre côté. `_q` rend le premier dans le document, pas le visible : l’étape porte un `cible` calculé (`get cible()` → `_tuFerNouveau()`, qui teste `_vis`). Les deux étiquettes (`phy.nouveau`, `phy.nouveau.pc`) sont posées dans `index.html`.
- ★ **Le domaine d’entraînement n’a ni catalogue E-Phy ni vendange** (la porte bloque Firestore ; `TU_DONNEES` n’a ni récoltes ni catalogue) : le tuto enseigne le produit normé, saisi à la main, et la règle par appellation seule. `TU_DONNEES.parcelles` prend `appellation` et `cepage` (trois Bourgognes sur huit) ; la règle coche alors cinq parcelles.
- ★ **La nature est un `<select>`, le moteur tape** (`input` lettre à lettre) : `oninput="_ferNat(this.value)"` à côté du `onchange` — sans danger, `_ferNat` est sans effet de bord en double.
- Étiquettes `data-tuto` dans la fiche : `fer.nom`, `fer.norme` (sur NF U 42-001 seulement), `fer.sac`, `fer.npk`, `fer.nat`, `fer.etape2` (posée par `_ferStep` pour l’étape 2), `fer.aoc` (+ `data-aoc`), `fer.regle`, `fer.plist` ; et `phy.fer` sur l’onglet.
- **Les deux lignes de taille** : `phyto.js` 147 → 166 ko, `tutos.js` 82 → 88 ko, seules leurs lignes regravées dans `typo-baseline.json` (le `--baseline` complet aurait avalé d’autres croissances). La question du découpage, posée : `tutos.js` est le registre des tutos, il grossit d’une entrée par tuto, rien à sortir ; `phyto.js` porte tout le bloc FERTI — à sortir dans un lot à part (backlog), pas dans une correction.
- Nouveauté 10.18 (le tuto).

### 464c. Mesuré
`npm run test:tutos -- --concernes` (tous concernés : le domaine d’entraînement a changé) : 6 tutos × téléphone, ordinateur et panneau côte à côte, tous au bout — `amendement` 12/12 en 36 s partout. `mv-harnais-tutos` : vert, 807 sans tuto pour un plafond de 807, 27 couverts (17 avant). `mv-harnais-typo` vert après les deux regravures. FERTI-5 34, FERTI-6 17, fertil 70 ; preflight 0 erreur. Chaîne complète : non rejouée en entier dans le bac à sable (lente ici) — à rejouer chez Nico.

### 464d. Reste ouvert
- Sortir la fertilisation de `phyto.js` (backlog).
- La seule catégorie « Arboriculture fruitière et vigne » (102 MFSC, §461b) : à trancher.

## 465. FERTI-7B — LE BOUTON DE SAISIE DE PHYTO D’UN SEUL TENANT ; LA CHAÎNE COMPLÈTE VERTE (26/10 — `index.html` · `src/utils.js` (APP, WHATS_NEW technique) · `public/sw.js` · **bump APP 10.18 → 10.19, SW 10.99 → 11.00**, base `b178b05`)

### 465a. D’où ça vient
Nico (26/10) colle la sortie du lanceur après FERTI-7 : 283 commandes sur 555, arrêt sur `mv-harnais-phyto1` et `mv-harnais-phyto1 --contre`. L’assertion « la page a la colonne de fiche et le bouton de saisie ; l’onglet Registre pose la classe et montre le bouton à qui peut saisir » lit `id="ph-new-btn" onclick="_phytoFab()"` d’un seul tenant ; FERTI-7 (§464) avait posé `data-tuto="phy.nouveau.pc"` entre les deux. `mv-harnais-phyto3` lit la même chaîne (assertion « le bouton passe par _phytoFab ») et s’en sert d’ancre pour sa contre-épreuve « le bouton ouvre toujours un traitement » : le rouge suivant.

### 465b. Ce qui a été fait
- `index.html` : `data-tuto="phy.nouveau.pc"` après `onclick="_phytoFab()"`. Les deux contrôles redeviennent verts sans être touchés.
- ★ Pourquoi pas les contrôles : ils tiennent le contrat de la page, et `phyto3` pose un défaut sur cette chaîne exacte ; les assouplir aurait obligé à réécrire sa contre-épreuve. L’ordre des attributs ne coûte rien.
- Version technique (`index.html` touché ⇒ bump) : APP 10.19 avec `items: []`, SW 11.00 (la bascule 9.99 → 10.00 fait jurisprudence).
- Checklist de clôture (§ « La checklist de clôture d’un lot ») : une ligne — un lot qui touche `index.html`, `utils.js` ou `tutos.js` se vérifie par la chaîne complète.

### 465c. Mesuré
`phyto1`, `phyto3` et leurs contre-épreuves verts ; `mv-harnais-tutos` vert ; `mv-whatsnew-check` vert ; preflight 0 erreur. **Chaîne complète rejouée ici : 555 commandes, 0 rouge** (856 s, une à la fois — le bac à sable n’a qu’un cœur). Tutos concernés : aucun ; rejoués, rapport vert.

### 465d. La leçon
Après FERTI-7, seuls les contrôles du module (tutos, typo, FERTI-5/6, fertil) avaient été rejoués : les 58 contrôles ciblés du §464 dataient d’avant le lot, et `phyto1`/`phyto3` lisent `index.html`, pas `phyto.js` — le filtre « qui lit phyto.js » ne pouvait pas les trouver. Un rouge de plus chez Nico. D’où la ligne de la checklist.

## 466. ★★ FERTI-8 — « VOS PRODUITS » DANS LA RECHERCHE DE L’AMENDEMENT ; LES TENEURS DE CHAQUE CAMPAGNE ; LA CHAUX SANS TYPE (26/10 — `src/phyto.js` · `src/tutos.js` · `src/utils.js` (APP, WHATS_NEW, MV_AIDE phyto) · `index.html` · `public/sw.js` · `guide/07-phyto.html` · `scripts/mv-harnais-ferti8.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/tutos-couverture.json` (plafond 807 → 806) · **bump APP 10.19 → 10.20, SW 11.00 → 11.01**, base `e064e23`)

### 466a. D’où ça vient
Nico (26/10), après la mise en ligne de FERTI-5 à 7B : « Terrafumur et 4-10-1 ne sont pas dans chercher dans e-phy ». Normal pour E-Phy — sans AMM, jamais —, mais le vrai manque était derrière : tout retaper à chaque apport. Objectif reformulé (« Exact »), avec sa réserve : « attention, les produits peuvent changer quelque peu de concentration en fonction des années et des analyses menées sur eux (vérifie dans les archives) ». Maquette v3 (« Vos produits », l’artefact des v1 et v2 mis à jour), validée : « Go ».

### 466b. Les archives, vérifiées
Les archives de campagne (ARCH-1, `_arcSnapshot`, Pilotage › Archives) photographient parcelles, journal, sessions, tâches et travaux — **pas La Réserve**. Les amendements restent dans `INTRANTS.fertil`, campagne après campagne, et chaque apport garde SES teneurs (`prod.N`…`prod.CN`) et sa date (`cree`) : l’historique des teneurs d’un même produit, année par année, existait déjà. C’est lui que « Vos produits » lit.
★ Vu en vérifiant : `_ferSave` écrivait `typ:P.typ||'II'` — un apport « Chaux, dolomie » (FERTI-5, `typ:''`) s’enregistrait en type II, et `_ferTypLbl` ne recevait jamais le vide. Corrigé : `typ:(P.nat==='chaux'?'':(P.typ||'II'))`.

### 466c. Ce qui a été fait
- `_ferVosCalc(list, n)`, pure : apports groupés par nom (`_phyNorm` : « TERRAFUMUR » et « Terrafumur » sont un seul produit) ; versions = teneurs distinctes (N, P, K, MO, C/N), la plus récente d’abord ; filtre sur le nom ou la norme ; le produit le plus récemment utilisé en tête.
- La recherche devient « Chercher un produit » : vos produits (cinq au plus) au-dessus, puis E-Phy ; « Pas dans E-Phy » et « catalogue pas chargé » seulement si rien des deux côtés.
- `_ferPickVos` remplit la fiche comme au dernier apport (nom, norme ou AMM et son statut vigne, fournisseur, nature et type, mention bio, dose, sac, prix et son unité) avec les teneurs de la version la plus récente, datées (`srcVos`) ; `_ferVer` reprend celles d’une autre campagne. Une teneur retouchée, une formule tapée ou un produit E-Phy effacent la reprise ; les nouvelles teneurs partent avec le nouvel apport, les anciennes restent dans l’historique.
- ★ `_ferDfr` existait déjà (même rôle) : le doublon écrit d’abord a cassé la syntaxe — retiré. Chercher avant d’ajouter, toujours.
- Tuto `produit-repris` (« Comment faire pour reprendre un produit déjà utilisé ? », 7 étapes : onglet, bouton « nouveau », « terra », Terrafumur sous « Vos produits », les teneurs de l’autre campagne, la date des teneurs). `couvre` : `_ferSearch`, `_ferPickVos`, `_ferVer` — le compte des gestes sans tuto reste sous son plafond. Le domaine d’entraînement charge `intrants` (`_tuIntrants` : deux apports de Terrafumur, 2024 et 2025, aux teneurs différentes) par `applyFbData('intrants', …)`, comme le Cuvier et le journal.
- Aide (fiche Phyto), guide (étape « Le produit »), nouveautés 10.20.

### 466d. Mesuré
`mv-harnais-ferti8.mjs` : 13 vertes ; contre-épreuve 3/3 (le plus ancien apport pris pour le dernier ; le phosphore oublié dans les teneurs ; la chaux de nouveau en type II). ★ Premier passage : le harnais extrayait `_phyNorm` sur une seule ligne — or elle en compte plusieurs : exception, et une contre-épreuve « verte » qui ne prouvait rien. Extraite en entier, la base est verte et la contre-épreuve vraie. FERTI-5 34, FERTI-6 17, fertil 70, phyto1 et phyto3, tutos et typo verts ; preflight 0 erreur. Rendu regardé dans l’appli construite (gestes réels, clair et sombre) : « terra » → Terrafumur sous « Vos produits », fiche remplie, teneurs 2025-2026 puis 2024-2025 au geste, datées. Tutos : 7 × téléphone, ordinateur et panneau côte à côte, tous au bout (`produit-repris` 7/7). Chaîne complète, rejouée jusqu’au bout avant la livraison, en quatre reprises : les commandes 1 à 170 ; puis `harnais-claude-md` (rouge tant que le nouveau contrôle n’était pas nommé dans le document — vert une fois la documentation écrite) ; puis `build-guide --check` (rouge tant que `public/guide.html` n’est pas refait — `npm run site` le refait ; page dérivée, non livrée, comme `sitemap.xml`) ; puis ★ `mv-harnais-tutos --contre` : le compte des gestes sans tuto avait baissé à 806, le plafond restait à 807, et la contre-épreuve « un geste nouveau sans tuto » ne rougissait plus faute de marge nulle — plafond abaissé à 806 (le harnais le demande lui-même), 24/24 ; enfin les 300 dernières commandes : 0 rouge.

### 466e. Reste ouvert
- Sortir la fertilisation de `phyto.js` (backlog) — plus pressant à chaque lot.
- La seule catégorie « Arboriculture fruitière et vigne » (102 MFSC, §461b) : à trancher.

## 467. ★★ UX-1 — LE CLIQUET MESURE LA ZONE D’APPUI, PAS LA BOÎTE : UX-0 AVAIT REFAIT L’ERREUR DE §175 (26/10 — `scripts/mv-ux-rendu.mjs` (`ZONE_INIT` / `window.__mvZone`, posé par `addInitScript` ; `MESURE` et les gestes de la Cave et de Valider par la zone ; les textes à 0 px hors du compte ; `--motif` ; un huitième défaut en contre-épreuve) · `scripts/mv-ux-baseline.json` (regravée, motif écrit) · `scripts/mv-harnais-ux0.mjs` (assertions ⑦ et ⑨, trois mutants) · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` (consolidation, §6b, §28) · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/UX-1.json` · **aucun bump**, base `6b893b0`)

### 467a. D’où ça vient
« suite » : le lot suivant du plan (§28), CIBLE-1 — agrandir les cibles et relever les textes. Deux choses trouvées en le préparant, avant d’écrire une ligne : **le nom CIBLE-1 est pris** (§163, ce que les cartes montrent) ; et **la mesure d’UX-0 était fausse**.

### 467b. L’erreur, et la leçon qu’elle refaisait
UX-0 mesurait chaque cible par `getBoundingClientRect()` : la boîte du dessin. Or l’appli porte déjà, sur ses petites pièces, une zone d’appui transparente en pseudo-élément — `.ck-i::after` (inset −13 px : 18 + 26 = 44), `.mv-i::after` (−12 : 44), `.mv-help-btn::after` (−9/−6), la pastille de synchronisation dans l’en-tête (−6), les puces `.chip` / `.fchip` / `.tfchip` / `.ptfchip` (−5/−3), et les boutons de la Cave. Un appui sur le pseudo-élément va à l’élément. **« Une cible se mesure par sa zone d’appui, pas par sa boîte »** : c’était déjà écrit au §175, quand un premier outil avait compté l’Aide et la pastille « i » comme trop petites. UX-0 a refait la même erreur, et l’audit d’expérience d’usage du 25/10 (hors dépôt) avec lui : les « 12 bulles « i » sous 24 px » et les « Relever, Ouiller, Soutirer à 28 px » étaient des boîtes, pas des cibles.

### 467c. La mesure corrigée
- `window.__mvZone(e)` : la boîte, plus ce qui déborde d’un `::before` / `::after` en position absolue (insets négatifs seulement), **si** l’élément est positionné (sinon l’inset se lirait sur un autre bloc), si le pseudo-élément reçoit les appuis (`pointer-events`, `display`, `visibility`) et si l’élément ne rogne pas lui-même. La zone est ensuite coupée aux bords des ancêtres qui rognent (`overflow`), **sans jamais rogner la boîte** : une puce sortie d’un ruban qui défile reste une cible, on y arrive en défilant.
- Posé une fois par page, avant ses scripts (`addInitScript`) : `MESURE`, le compte des gestes de la Cave et le côté du bouton Valider lisent la même fonction.
- Les textes à **0 px** sortent du compte : c’est un libellé caché (le « Aide » de l’en-tête au téléphone), pas un petit texte.
- `--motif "<texte>"` : une regravure dit pourquoi — ici, une mesure corrigée n’est pas une baisse de l’appli.
- **Un texte de jeu**, comme une cible : la première regravure sur `e064e23` a été refusée — « planning › ordinateur › t12 : 12 → 13 » — alors que le relevé d’avant, sur la même appli, voyait 12. Un texte qui paraît ou non selon l’instant du relevé ; la marge des textes passe de 0 à 1.
- ⚠️ Ce que la mesure ne fait pas : une zone dessinée par une largeur explicite (au lieu d’insets négatifs), ou un chevauchement entre deux zones voisines.

### 467d. Mesuré
- Sur la base `4e187d9`, puis de nouveau sur `e064e23` (après FERTI-4 à FERTI-7B) et sur `6b893b0` (après FERTI-8) — mêmes chiffres, sans changer l’appli : **45 baisses, aucune hausse** — téléphone 19 → **5** cibles sous 24 px, 322 → **297** sous 44 (71 %), 68 → **58** textes sous 11 px ; ordinateur 19 → 5, 271 → 232 (54 %) ; gestes de la Cave sous 44 px : 5 → **0**. Regravée avec son motif.
- Les 5 cibles qui restent sous 24 px, partout : deux tuiles de la mosaïque de l’Accueil (`.hpc-p`, 37 × 23), « Pourquoi ? » (`.mv-pq`, 20 de haut), le crayon de la priorité (`#priority-edit-btn`, 16 × 23), les champs de recherche de Parcelles et du Journal (`#pSearch`, `#jSearch` : 16 de haut dans une boîte de 42 qui, elle, n’est pas la cible).
- Contre-épreuve : **8/8** — le huitième défaut retire la zone des « i » du Pilotage, qui repassent de 0 à 12 cibles sous 24 px : la preuve que la zone est lue. Le défaut de la Cave a dû perdre sa propre zone (un clone rogné) pour mordre encore.
- `mv-harnais-ux0` : 16 assertions, 17/17 mutants (dont « remesure la boîte », « ne pose plus le relevé de zone », « recompte les textes à 0 px »).

### 467e. Ce que ça change au plan
- **CIBLE-1 n’existe plus sous ce nom.** Ce qui reste certain devient **LISIBLE-1** : plus aucun texte sous 11 px (58 au téléphone — les initiales du Journal à 7 px, « 173h / 152h » du Planning à 9, l’échelle de la campagne des Réglages à 8-9, les étiquettes du Phyto, de la Réserve et de la priorité à 10), et les 5 cibles ci-dessus.
- **Les puces, les bulles « i », la roue du Pilotage** : décision de Nico du 26/09 (« on laisse », §176d). Le plan du 25/10 la contredisait sur une mesure fausse : à reconfirmer avec lui avant d’y toucher. Les boutons « discrets » et secondaires (28 px, sans zone), les onglets (40 px) et `.mvbtn-option` (43 px de large) n’ont jamais été tranchés.
- **CAVE-UX-1** : les gestes ont déjà 44 px de zone ; il lui reste le sommaire collé et l’accent mis sur le geste principal.

### 467f. Ce qui reste ouvert
- Le premier passage en CI de la mesure corrigée (un autre Chromium). **À confirmer.**
- **Décidé par Nico le 26/10 (« ok »)** : la décision du 26/09 tient pour les puces, les bulles « i » et la roue ; LISIBLE-1 ajoute une zone de 44 px aux boutons « discrets » et secondaires (dessin inchangé) et passe `.mvbtn-option` à 44 px de large ; les onglets attendent TETE-3.

## 468. ★★ MAQ-1 — LES MAQUETTES DU PLAN ENTRENT DANS LE DÉPÔT (27/10 — `docs/maquettes/` (neuf : trois maquettes HTML, le plan, deux audits, LISEZMOI) · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `scripts/harnais-claude-md.mjs` · `.mv-base` · `lots/MAQ-1.json` · aucun bump, base `5623d3b`)

### 468a. D’où ça vient
Nico, le 27/10, refusant de reprendre dans une nouvelle conversation : « à chaque fois que je recommence une nouvelle conversation, les maquettes ne sont pas respectées ». Les maquettes du plan (25-26/10) vivaient hors dépôt, dans les fichiers d’une conversation : une session neuve ne les avait pas.

### 468b. Ce qui change
`docs/maquettes/` : `maquette-niveau-au-dessus-v1.html`, `maquette-ux-v1.html`, `maquette-ux-v2.html`, `plan-mise-en-place-2026-10-25.md`, `audit-ux-2026-10-25.md`, `audit-niveau-au-dessus-2026-10-25.md`, et un LISEZMOI : **un lot qui touche un écran dessiné l’ouvre et s’y compare avant d’être livré** ; les corrections faites depuis y sont dites (zone d’appui, §467 ; décision du 26/09, §176d). §28 le rappelle.

### 468c. Ce qui reste ouvert
- `wn-coupe1-en-cours.patch` (hors dépôt) : la coupe de WHATS_NEW est écrite et ses onze lecteurs nommés suivent ; la chaîne a trouvé d’autres harnais qui vérifient leur annonce dans `utils.js` sans nommer WHATS_NEW (`revient`, `vol1`, `asm1`, `creux`, au moins) — à finir, section §469.
- `lisible1-en-attente.patch` (hors dépôt) : après la coupe — APP 10.22, SW 11.03, §470.

## 469. ★★ WN-COUPE-1 — LE JOURNAL WHATS_NEW SORT DE `utils.js` ; SOIXANTE-DEUX CONTRÔLES LISAIENT LEUR ANNONCE DANS `utils.js` (27/10 — `src/whats-new.js` (neuf) · `src/utils.js` (import et réexport, APP 10.21) · `index.html` · `public/sw.js` (SW 11.02) · 63 contrôles de `scripts/` (liste en 469b) · `scripts/mv-harnais-wncoupe1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-icones-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/WN-COUPE-1.json` · base `bdc9522`)

### 469a. D’où ça vient
LISIBLE-1 butait sur `mv-harnais-typo` : `src/utils.js` pesait 1 048 995 octets (1024,4 ko, le plafond : « au-delà, on découpe ») et son annonce en ajoutait 685. Nico (27/10) : « A », la coupe d’abord. Un patch l’avait écrite la veille, hors dépôt (§468c) ; la chaîne avait alors trouvé quatre contrôles qui cherchaient leur annonce dans `utils.js` sans nommer WHATS_NEW (`revient`, `vol1`, `asm1`, `creux`), « liste incomplète ». Repris ce jour sur la base de MAQ-1 : la partie code du patch s’applique telle quelle ; sa partie documentation était périmée (elle se numérotait §468, pris par MAQ-1, et recopiait `docs/maquettes/`).

### 469b. Ce qui change
- `src/whats-new.js` porte le tableau, même format, la version 10.21 en tête (`items: []`). `utils.js` : `import { WHATS_NEW } from './whats-new.js'; export { WHATS_NEW };` — le code de l’appli ne voit rien. **Le déplacement est exact** : le bloc d’avant (537 338 octets) et le corps du fichier neuf, ligne 10.21 retirée, sont identiques au caractère près ; hors du bloc, `utils.js` ne change que de la version et des deux lignes d’import. `utils.js` : 500 748 octets (489 ko).
- **Les lecteurs du journal** — la méthode : jouer, sur la coupe, les 271 commandes de la chaîne dont le script lit `utils.js` ; 92 rougissent. Rejouées sur la base : toutes vertes sauf `accv2` (469d). La coupe est donc la seule cause, et la liste est complète pour ce qui lit `utils.js`.
  - 9 suivis par le patch : `preflight` (C27), `mv-whatsnew-check`, `annonces`, `autete1`, `forme2`, `futcap`, `pilfix1`, `police` (ses deux exemptions dans `whats-new.js`), `icones` (le module compté ; cliquet regravé 639 → 623, rien n’a monté).
  - 51 lisent `utils.js` puis le journal, bout à bout, dans leur objet de sources : `acc2`, `accv1`, `accv2`, `accv4`, `aide`, `anticipe1`, `arrach9`, `asm1`, `auj1`, `auj2`, `auj3`, `auj8`, `cavefix1`, `cavepil3`, `caverange1`, `caverange2a`, `caverange3`, `cavereg1`, `cavereg2`, `chant1`, `creux`, `cuves1`, `direct1`, `direct2`, `ecart1`, `etat1`, `etats1`, `hors1`, `jeq1`, `manque1`, `matu1`, `minaoc1`, `mouv1`, `parc1`, `pilrange4a`, `pilrange4b`, `prol1`, `rec1`, `ref1`, `ref2`, `retrait1`, `revient`, `sansrec1`, `sect1`, `sessions`, `tap`, `tourcuv1`, `trac1`, `tuto8`, `vif1`, `vol1`.
  - ⚠️ 2 lisent le journal **à part** (`wn`) : `dates1` et `tournee1` réécrivent `utils.js` dans un dossier et rechargent l’appli entière (`mv-app-node`) — recollé, le journal y aurait été déclaré deux fois (`import` puis `export const`), et l’appli ne se chargeait plus.
  - `icones-contre` : son bac copie aussi `whats-new.js` (sans lui, `icones` plantait avant la première épreuve — « étendre un contrôle, c’est étendre son bac »).
- `mv-harnais-wncoupe1` garde la coupe : le tableau déclaré une fois, dans `whats-new.js` ; `utils.js` le réexporte et garde 64 ko de marge ; le journal s’ouvre sur l’APP ; `mv-whatsnew-check` et le preflight lisent le fichier ; la liste le joue.
- ★ **La règle, écrite en règle d’or n°4** : une annonce se vérifie dans `src/whats-new.js`. Un contrôle neuf qui la chercherait dans `utils.js` rougirait d’emblée.
- La regravure de la référence UX que portait le patch est retirée : rien ne change à l’écran ; LISIBLE-1 remesure (§470).

### 469c. Mesuré
- Les 91 commandes rouges (hors `recup --contre`, joué à part) rejouées sur la coupe corrigée : vertes, sauf `harnais-claude-md` avant cette section. `accv2` et sa contre-épreuve (8/8) verts à trois heures du jour (Paris, Honolulu, Tokyo).
- `mv-harnais-wncoupe1` : 6 assertions, 6/6 mutants. Chaîne complète : voir la note de livraison.

### 469d. Vu en route — `accv2` rougissait sur la base, selon l’heure
`renderHomeSavoir` lit `_accSavoirItems(new Date())` — l’heure réelle — et le contrôle comparait son compte à des lignes calculées au vendredi 23/10, 11 h 50. Passé 14 h le 27/10 (le vent du mardi après-midi), les deux comptes divergeaient : vert à 7 h, rouge à 18 h ; et chaque jour suivant, toute la journée — de quoi arrêter un `npm run build` du soir. Corrigé dans le contrôle, pas dans l’appli : le monde prend un paramètre `Date` (`horlogeFigee`), et seul le monde de la carte le demande ; les autres gardent la semaine réelle que le journal exige.

### 469e. Ce qui reste ouvert
- LISIBLE-1 sur cette base (§470).
- La hausse du Pilotage sur ordinateur (39 → 42 cibles sous 44 px), qui dépend de l’heure réelle (§468d du patch d’origine, non retrouvée) : **à suivre** au relevé de LISIBLE-1.

## 470. ★★ LISIBLE-1 — LES TEXTES ET LES CIBLES COMME LA MAQUETTE : 11 px PARTOUT, 12 AU TÉLÉPHONE ; LES INITIALES DU JOURNAL DANS UN ROND DE 28, DEUX AU PLUS PUIS « +N » (27/10 — `src/charte.css` · `src/styles.css` · `src/app.js` (`_jAvas`) · `index.html` · `src/reserve.js` · `src/tracteur.js` · `src/utils.js` (APP 10.22) · `src/whats-new.js` · `public/sw.js` (SW 11.03) · `scripts/mv-harnais-lisible1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-gabarit-rendu.mjs` · `scripts/mv-harnais-textea.mjs` · `scripts/mv-ux-baseline.json` (regravée) · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/LISIBLE-1.json` (inclut WN-COUPE-1) · base `bdc9522`)

### 470a. D’où ça vient
Le lot que le plan du 25/10 appelait CIBLE-1, ramené par UX-1 (§467) à ce qui était vraiment trop petit. Un patch l’avait écrit le 27/10 au matin, hors dépôt, bloqué par le plafond d’`utils.js` (§469). **Comparé à sa maquette avant d’être intégré** (`docs/maquettes/maquette-ux-v1.html`, partie 3 « Les cibles et les textes » — la règle de MAQ-1, §468), il s’en écartait sur trois points que la décision de Nico du 26/10 ne couvre pas : les initiales du Journal dans un rond de 20, sans « +N » (maquette : 28, deux ronds au plus) ; la ligne d’heures du Planning à 11 px (maquette : 12, tronquée) ; aucun plancher de 12 px au téléphone (maquette : « 11 px partout, 12 au téléphone »). Le reste de l’écart (boutons discrets à 36 px, puces, bulles « i », roue) est tranché le 26/10. Nico (27/10) : « Comme la maquette ».

### 470b. Ce qui change
- **Le plancher de texte** : `src/charte.css` — `@media (max-width:767.98px){ :root{ --pt-nano:12px; } }` (la bascule de l’appli : 768 px = ordinateur). Seul le plus petit cran monte, et tout ce qui le lit suit. Les textes que le patch relevait à 11 px passent par ce jeton : `.oava`, `.pv-team-lbl`, `.mv-syncdot .mvs-cnt`, `.cmp-scale` (et son `em`), « Priorité du moment », `.mvr-u`, l’étiquette du registre du tracteur.
- **Les initiales du Journal** : `.java` 28 × 28, bordé, 11 px (12 au téléphone), graisse 600 ; `.java-grp` les fait se chevaucher (−8 px) ; `.java-plus` sur l’acier. `_jAvas(r, col)` (app.js) : ceux qui ont fait le travail quand un autre a validé (`_jFaitPar`), sinon l’auteur puis l’équipe, chacun une fois ; deux ronds au plus, puis « +N » ; `aria-hidden` (les noms sont écrits juste après).
- **La ligne d’heures du Planning** (`.pl2-name-s`, « 173h / 152h ») : 12 px, sur une ligne, tronquée.
- Du patch, tels quels : les cinq cibles sous 24 px (tuiles de l’Accueil et « Pourquoi ? » à 24 px, crayon de la priorité 24 × 24 avec une zone de 44, champs de recherche à la hauteur de leur boîte) ; la zone de 44 px (`::after` centré) des boutons « discrets » et secondaires, dessin inchangé ; les 7 jours de la Cave à 44 px.
- **Le gabarit du Pilotage** compte un style par rôle **et par écran** : l’en-tête de colonne, 11 px sur ordinateur et 12 au téléphone, le faisait rougir — pour une règle voulue. Sa contre-épreuve mord toujours (5/5).
- **TEXTE-A** (`mv-harnais-textea`) refusait toute seconde définition des petits crans : le plancher du téléphone est désormais la seule permise, mot pour mot (il ne fait que monter) ; un second plancher plus bas rougit (contre-épreuve neuve). Trouvé par la chaîne complète, seul rouge de ses 561 commandes.
- Annonce 10.22, niveau 0, pour tous.

### 470c. Mesuré
- `test:ux` (build du lot, horloge au 27/10, 9 h) : **téléphone** 162 → **0** texte sous 12 px, 58 → 0 sous 11, 5 → 0 cible sous 24, 297 → 245 sous 44 ; **ordinateur** 64 → 0 sous 11, 5 → 0 sous 24, 232 → 211 sous 44, 191 textes sous 12 (13 % ; l’objectif du plan ne vise que le téléphone). Le plancher en un jeton a suffi : relevé détaillé, plus aucune valeur écrite en dur sous 12 px à la largeur du téléphone.
- Référence regravée, 38 baisses, **deux hausses écrites** : Journal sur ordinateur 22 → 33 textes sous 12 px (23 ronds d’initiales à 11 px au lieu de 14 à 7 : voulu) ; Pilotage sur ordinateur 39 → 42 cibles sous 44 px (470e).
- `mv-harnais-lisible1` : 14 assertions (dont `_jAvas` exécutée : un auteur → 1 rond ; une équipe de quatre → 2 ronds et « +2 » ; un doublon compté une fois ; validé par un autre → ceux qui ont fait), 14/14 mutants. Gabarit 15/15, contre-épreuve 5/5. Tutos : aucun concerné ; le panneau côte à côte rejoué.

### 470d. Fiches et guide
`MV_AIDE` (Journal, Planning, Réglages) et le guide relus : aucune phrase ne décrit la taille des initiales ni de la ligne d’heures — rien à changer.

### 470e. Ce qui reste ouvert
- **La hausse du Pilotage sur ordinateur** (39 → 42 cibles sous 44 px) : revue le 27/10, absente d’un relevé fini à 18 h 42, présente au suivant (18 h 49) sans rien changer. Cause non trouvée ; tant qu’elle ne l’est pas, la référence porte 42.
- **À vérifier chez Nico** : le Journal sur son téléphone et son PC à 125 % (une équipe de trois et plus, le « +N »), la ligne d’heures du Planning sur un écran étroit, l’échelle de la campagne dans Réglages, en clair et en sombre.
- Les onglets (40 px) avec TETE-3 ; le prochain lot du plan : ANNULER-1.

## 471. ★★ ANNULER-1 — ANNULER PLUTÔT QUE CONFIRMER : UN SEUL TOAST « ANNULER » POUR TOUTE L’APPLI, ET CHAQUE ANNULER REMET L’ÉTAT D’AVANT TEL QUEL (28/10 — `src/utils.js` (`showToastAnnuler`, `_mvAnnCacher`, `MV_ANNULER_MS`, APP 10.23) · `src/app.js` (`_pvToast` délègue, `pQuickUndo`, `_pvRemettre`) · `src/reserve.js` (`_rsvDelFut`) · `src/planning.js` (`planSelAction`, `_planInstantane`, `_planRemettre`) · `src/styles.css` · `index.html` · `src/whats-new.js` · `public/sw.js` (SW 11.04) · `guide/04-vigne.html` · `guide/10-planning.html` · `scripts/mv-harnais-annuler1.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ANNULER-1.json` · base `dfb5f87`)

### 471a. D’où ça vient
Le troisième lot du plan du 25/10 (« suite »), dessiné dans `docs/maquettes/maquette-ux-v1.html`, partie 4 : « Êtes-vous sûr ? » se valide par réflexe ; pour ce qui se répare, l’action part tout de suite et un toast « Annuler » reste six secondes, une barre qui s’épuise, « Annuler » à 40 px — Annuler écrit l’inverse. La maquette le dit elle-même : l’inventaire est « à vérifier une par une au premier lot ».

### 471b. L’inventaire, vérifié dans le code — il corrige le plan
- **Valider avait déjà son Annuler** : `_pvToast` (#pv-toast, 4,5 s) après une validation rapide, et la feuille « parcelle finie » a le sien. L’audit comptait « 0 toast avec Annuler » : faux, comme sa mesure des cibles (§467).
- **28 fenêtres `openConfirmDel`, pas 46**, réparties sur 8 fichiers ; **aucune au Planning**.
- **« Dévalider »**, c’est le bouton « Fait » de la carte (`pQuickUndo`) : un toast sans retour.
- **« Retirer un fût »** : le lot de fûts de la Réserve (`_rsvDelFut`, une fenêtre). **« Retirer un intrant »** : aucune fenêtre de ce genre dans la Réserve — rien d’inventé ; à reprendre au tri d’ANNULER-2.
- **« Déplacer ou effacer une journée »** : le Planning n’a pas de geste « déplacer » ; « Effacer » (avec « Récup » et « Chaleur », la barre de sélection) s’appliquait **sans confirmation et sans retour** — le cas le plus utile des cinq.

### 471c. Ce qui change
- **Un composant** : `showToastAnnuler(msg, inverse)` (utils.js) sur le toast que Parcelles portait déjà — mêmes identifiants, que lisent les tutos et le panneau côte à côte. Six secondes (`MV_ANNULER_MS`), la barre (`#pv-toast.mv-ann::after`, rien d’animé si l’on réduit les animations), « Annuler » à 40 px, `role="status"`. Un nouveau toast remplace l’ancien ; Annuler n’appelle l’inverse qu’une fois. Sans inverse : 2,2 s, sans bouton. Posé à la hauteur de l’autre toast, au-dessus du dock (il restait à 22 px du bas).
- **Valider** : `_pvToast` délègue — son Annuler passe à six secondes, avec la barre.
- **Dévalider** (« Fait ») : `pQuickUndo` garde une copie de la tâche AVANT le geste ; Annuler (`_pvRemettre`) la remet telle quelle — un passage d’une tâche à étapes compris — et l’enregistre. Le journal n’avait pas bougé, il ne bouge pas.
- **Un lot de fûts** : plus de fenêtre ; retiré tout de suite, Annuler le remet à sa place avec son identifiant (les fûts de la Cave qui le citent le retrouvent) ; un second Annuler, ou le lot revenu d’ailleurs, ne le double pas.
- **Planning, Effacer / Récup / Chaleur** : `_planInstantane` photographie chaque jour touché AVANT (le mois et le seau de l’année gardés — on peut naviguer pendant les six secondes ; un jour vide noté vide) ; le geste est enregistré sans second toast (un échec d’envoi parle toujours) ; Annuler (`_planRemettre`) remet chaque jour, retire ce que le geste a posé, et l’enregistre.
- Annonce 10.23, niveau 0, pour tous.

### 471d. Mesuré
- `mv-harnais-annuler1` : 11 assertions sur les vraies fonctions extraites (le toast, Dévalider simple et à étapes, le lot de fûts, Effacer et Récup), **12/12 mutants**. Sa contre-épreuve vérifie d’abord que la base est verte : un premier passage, sur une base qui plantait, « mordait » 12/12 pour rien.
- Construit : le panneau côte à côte rejoué (vert) ; `test:ux` 17/17 vert, aucune hausse.
- Chaîne complète : 563 commandes en 811 s, **trois rouges**, corrigés et rejoués verts : le preflight (`_pvHideToast` n’avait plus d’appelant — retirée) ; la contre-épreuve de PRES-1, qui s’accroche au texte de l’import d’`utils.js` dans `app.js` (les noms neufs vont en fin de liste, l’ancre reste intacte) ; `build-guide --check`, attendu — le guide a changé et `public/guide.html` est dérivé : `npm run site` le remet en phase (vérifié, puis rendu tel quel : il ne se livre pas).

### 471e. Fiches et guide
`guide/04-vigne.html` (Annuler : six secondes, et après « Fait ») et `guide/10-planning.html` (Effacer, Récup, Chaleur : Annuler) mis à jour. `MV_AIDE` relue : aucune phrase ne décrit ces fenêtres ni ce délai — rien à changer.

### 471f. Ce qui reste ouvert
- **ANNULER-2** : le tri des 28 `openConfirmDel` — réversible → Annuler (retirer une cuve du parc, une cuve d’une cuvée, une tâche d’une période…) ; irréversible → une fenêtre qui nomme la conséquence ; tout le domaine → taper le nom. Jamais « Oui / Non ».
- **À vérifier chez Nico** : le toast « Annuler » au téléphone, au-dessus du dock, sur Parcelles, la Réserve et le Planning ; la barre ; un Annuler après « Fait ».

## 472. ★★ ANNULER-2 — LE TRI DES FENÊTRES DE CONFIRMATION : HUIT GESTES DE PLUS EN « ANNULER », CHAQUE FENÊTRE QUI RESTE NOMME SON GESTE, LA ZONE DE DANGER DEMANDE LE NOM (28/10 — `src/cuvier.js` (`_vendMesDel`, `_vendStatDel` ; 4 boutons) · `src/tracteur.js` (`delRepHist`, `deleteFiche`, `deleteCond` ; 2 boutons) · `src/reglages.js` (`deleteActivite`, la tâche d’une période, la zone de danger ; 1 bouton) · `src/cave.js` (`_cavePkDel`, `_caveAffRetirer` ; 3 boutons) · `src/phyto.js` (2 boutons) · `src/admin-gt.js` (1 bouton) · `src/app.js` (`checkDangerConf`) · `src/utils.js` (APP 10.24) · `index.html` · `src/whats-new.js` · `public/sw.js` (SW 11.05) · `scripts/mv-harnais-annuler2.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/ANNULER-2.json` · base `ebb4d83`)

### 472a. D’où ça vient
Le lot suivant du plan (« suite ») : la règle de `docs/maquettes/maquette-ux-v1.html`, partie 4 — réversible et fréquent → « Annuler » ; irréversible → une fenêtre qui nomme la conséquence ; tout le domaine → taper le nom ; jamais « Oui / Non ». L’inventaire d’ANNULER-1 (§471b) : 28 appels à `openConfirmDel`. Relu un par un pour ce lot, avec les appels par le relais du Tracteur : 31.

### 472b. Le tri, appel par appel
- **→ « Annuler » (8 gestes, plus de fenêtre)** : un relevé du Cuvier, une étape du parcours d’une cuve, une ligne de l’historique des réparations, une fiche d’entretien (la fenêtre disait « irréversible » : faux, la fiche se remet), un conducteur, une activité du Tracteur, une cuve libre retirée du parc, une cuve retirée d’une cuvée — et une tâche retirée d’UNE période (elle reste sur les autres). Chaque fois : une copie prise avant, le retrait tout de suite, l’enregistrement sans second toast, et Annuler qui remet l’élément à sa place — une seule fois, même si un autre appareil l’a déjà remis.
- **→ une fenêtre dont le bouton dit ce qu’il fait** : « Supprimer ce traitement » et « Retirer cet apport » (le registre, opposable : la maquette le garde en fenêtre) ; « Supprimer la cuvée et ses opérations » ; « Supprimer l’opération » (un assemblage gardait déjà « Défaire » — ASM-1 le vérifie) ; « Retirer le rapport » ; « Supprimer la récolte » ; « Supprimer la cuve et ses mesures » ; « Supprimer la [opération du Cuvier] » ; « Supprimer « client » » ; « Supprimer [tracteur] et ses fiches » ; « Supprimer « AOC » » ; « Supprimer le code ». Les autres nommaient déjà leur geste (« Renvoyer », « Abandonner », « Reconstruire (n) », « Corriger », « Appliquer », « Décocher », « Supprimer la tâche »).
- ★ **Un défaut trouvé au tri** : « Retour de [tracteur] ? » — archiver une réparation finie — portait le bouton par défaut, **« Supprimer » en rouge**. Il dit maintenant « Marquer le retour », en vert.
- **→ taper le nom** : la zone de danger demandait « SUPPRIMER » ou « ARCHIVER » ; supprimer une saison, une tâche du domaine ou un snapshot demande maintenant leur nom, et écraser un snapshot aussi (archiver garde son mot : rien n’est perdu). La comparaison ignore accents, majuscules et espaces doubles (`checkDangerConf`) : « apres-vendange 2026 » ouvre « Après-vendange 2026 ».

### 472c. Mesuré
- `mv-harnais-annuler2` : 12 assertions — chaque appel qui reste lu **dans ses arguments** (24 appels : un bouton nommé chacun, le relais du Tracteur passe le sien) ; six des huit gestes JOUÉS sur les vraies fonctions (retrait, Annuler, second Annuler sans doublon, la place) ; la zone de danger exécutée. **11/11 mutants**, base verte exigée d’abord.
- ⚠️ **L’analyseur d’arguments se trompait sur un commentaire** : un `// … l’application` dans la fonction passée en troisième argument ouvrait une « chaîne » — il lisait 3 arguments au lieu de 6. Il saute désormais les commentaires ; les treize boutons modifiés ont été relus avec lui, argument par argument.
- Chaîne, tutos et relevé UX : voir la note de livraison.

### 472d. Fiches et guide
Guide et `MV_AIDE` relus : aucune phrase ne décrit ces fenêtres ni le mot à taper — rien à changer.

### 472e. Ce qui reste ouvert
- Deux des huit gestes (le conducteur, la cuve du parc) et la tâche d’une période sont gardés par lecture, pas exécutés.
- **À vérifier chez Nico** : un relevé du Cuvier supprimé puis remis ; « Marquer le retour » d’un tracteur ; la suppression d’une saison qui demande son nom.

## 473. ★★ TETE-3A — L’EN-TÊTE QUI SE REPLIE AU TÉLÉPHONE : EN DESCENDANT, UNE LIGNE ; SOUS LA MAIN SEULEMENT (28/10 — `src/app.js` (`_mvRepliMaj`, `_mvRepliArme`, trois écouteurs) · `src/styles.css` · `guide/01-demarrer.html` · `scripts/mv-ux-rendu.mjs` (la molette avant de défiler) · `src/utils.js` (APP 10.25) · `index.html` · `src/whats-new.js` · `public/sw.js` (SW 11.06) · `scripts/mv-harnais-tete3a.mjs` (neuf) · `scripts/mv-harnais-liste.mjs` · `scripts/mv-ux-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `docs/claude/journal.md` · `docs/claude/chantiers-430-479.md` · `docs/claude/INDEX.md` · `.mv-base` · `lots/TETE-3A.json` · base `f1cc6fa`)

### 473a. D’où ça vient
Le lot suivant du plan (« suite ») : TETE-3, « l’en-tête qui se replie, sur tous les modules », dessiné dans `docs/maquettes/maquette-ux-v1.html`, partie 1 — au repos une bande et un segment (104 px) ; en défilant une seule ligne de 56 px ; la campagne et la date descendues dans la ligne de cadre de la première carte ; sur ordinateur, la bande du module et la bande campagne fusionnées ; le Pilotage garde « Vous regardez ». Le plan le dit « gros » et demande l’essai sur l’iPhone de Nico avant le déploiement général. **Découpé en trois, l’arrivée restant la maquette** : TETE-3A (ce lot) le repli au défilement, au téléphone — le gain d’usage le plus fort, et l’objectif « en défilant ≤ 56 px » de UX-0 ; TETE-3B le repos à 104 px (la bande campagne/date dans la première carte de chaque module, les onglets en segment) ; TETE-3C l’ordinateur, le Pilotage, la Réserve.

### 473b. L’inventaire
Les huit modules à `.mod-header` (Vigne : Accueil, Parcelles, Journal ; Tracteur, Phyto, Réglages, Planning, Cave) ont la MÊME structure : `.mod-header-top` (icône, titre, sous-titre, actions), `.mod-meta-row` (la bande campagne/date), `.mvu-tabs` (les onglets) ; l’en-tête est déjà collant (`position:sticky`). Mesuré par `test:ux` avant le lot : 178 px de bandeaux au repos ET en défilant, partout au téléphone (Réserve 192, Pilotage 309 / 191).

### 473c. Ce qui change
- **Le repli** (`_mvRepliMaj`, app.js) : au téléphone (sous 768 px), un défilement vers le bas passé 72 px ajoute `mv-replie` au `body` ; remonter de quelques pixels, revenir en haut (sous 24 px) ou toucher la ligne (hors boutons) l’enlève. L’écoute du défilement est passive et cadencée par `requestAnimationFrame`.
- ★ **Sous la main seulement** : le repli ne s’arme que si une molette ou un doigt a bougé dans les 900 ms (`_mvRepliArme`, sur `wheel` et `touchmove`). Un défilement programmé — un tuto qui fait venir sa cible, un test, `scrollIntoView` — ne cache donc jamais l’onglet qu’il va viser.
- **La ligne repliée** (styles.css, au téléphone) : la bande campagne/date et les onglets cachés, l’icône du module aussi ; le titre à la taille de base, le sous-titre sur la même ligne, tronqué, précédé d’un « · » ; les actions restent (« + Ajouter », la roue). Environ 56 px.
- **`test:ux`** envoie une molette avant de faire défiler : sans elle, sa mesure « en défilant » n’aurait jamais vu l’en-tête replié (son défilement est programmé).
- Le Pilotage et la Réserve (sans `.mod-header`) et l’ordinateur ne changent pas : TETE-3C.

### 473d. Mesuré
- `mv-harnais-tete3a` : 10 assertions — `_mvRepliMaj` JOUÉE sur une horloge et un défilement posés (un défilement programmé ne replie pas ; un petit geste sous 72 px non plus ; la main vers le bas, passé 72 px, replie ; remonter déplie ; le haut déplie sans geste ; l’ordinateur jamais), la règle CSS, l’appui, la molette de `test:ux` ; **7/7 mutants**.
- `test:ux` (référence regravée, 7 baisses, aucune hausse) : **en défilant, au téléphone, 178 → 64 px** (Réglages) à 76 px — Accueil, Parcelles, Cave, Planning, et la Réserve (192 → 76 : elle a un `.mod-header`) ; le Pilotage reste à 191 (TETE-3C). L’objectif de 56 px n’est pas atteint au pixel : la ligne garde ses boutons de 44 px et, sur les pages à « + Ajouter », le bouton d’action. Premier relevé : **rien n’avait bougé** — le défilement programmé de `test:ux` d’un seul saut, avec une seule molette, laissait passer la fenêtre de 900 ms sur les pages lourdes ; il défile maintenant en six pas, une molette à chaque pas, comme une main.
- Tutos et chaîne : voir la note de livraison.

### 473e. Fiches et guide
`guide/01-demarrer.html` : une phrase (au téléphone, en descendant, l’en-tête se range ; il revient en remontant, en haut, ou d’un appui). `MV_AIDE` relue : aucune fiche ne décrit l’en-tête.

### 473f. Ce qui reste ouvert
- **TETE-3B** et **TETE-3C** (473a).
- **À vérifier chez Nico, sur son iPhone en PWA** (le plan le demande) : le repli en descendant dans le Journal et Parcelles, le retour en remontant et d’un appui ; l’en-tête qui ne saute pas au rebond du haut de page.
