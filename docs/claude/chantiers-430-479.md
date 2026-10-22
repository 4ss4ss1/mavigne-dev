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
