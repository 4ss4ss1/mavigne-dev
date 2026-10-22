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
