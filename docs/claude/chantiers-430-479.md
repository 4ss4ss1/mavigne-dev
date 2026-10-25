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
