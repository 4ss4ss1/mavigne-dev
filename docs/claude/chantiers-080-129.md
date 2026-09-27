# Ma Vigne — Chantiers §80 à §129

> Scindé de `CLAUDE.md` le 27/09/2026 (§188). Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence
> « §N » se trouve par `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été
> remonté dans `CLAUDE.md` (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches
> de 50). Au-delà de la dernière tranche, créer le fichier suivant sur le même modèle.

---

## 80. ★★★ CUV-4 — « ENCORE SUR PIED », ET UN COMPARATEUR JUSTE PAR ACCIDENT (06/09 — APP 6.78 → 6.79 · SW 7.37 → 7.38)

Demande de Nico, en une ligne : *« dans le cuvier j'aimerais voir les parcelles qui n'ont pas eu de
recoltes enregistrées »*. Le Cuvier ne savait dire que ce qui **est** rentré — pour savoir ce qu'il
restait, il fallait comparer de tête l'écran Récoltes et le parcellaire.

### 80a. Ce qui est livré

Une carte **« Encore sur pied »** en tête de **Cuvier › Récoltes**, présente aussi sur l'écran vide
— c'est là qu'elle sert le plus. Elle liste les parcelles **actives** sans **aucune** récolte saisie
sur la campagne : surface, cépages, **dernière analyse de maturité** et son âge, **la plus mûre en
premier**, puis les jamais mesurées par ordre alphabétique. Un doigt sur une ligne ouvre la nouvelle
récolte **avec la parcelle déjà choisie** (`openOvVendRec(id, presetParc)` — le pré-choix n'existe
que pour une création : sur une modification, la parcelle de la récolte fait foi). Repliée au-delà
de huit parcelles. Quand tout est rentré, elle le dit.

⚠️ **L'unité affichée suit le MODE de la mesure** — %vol pour un degré, g/L pour un sucre — jamais un
réglage d'affichage : *ce qui est montré doit être ce qui a été lu.*

### 80b. ★★★ La fonction qui répondait déjà à cette question ailleurs se trompait dans les deux sens

`_mlResteARentrer` (Le millésime, ligne « Encore sur pied ») filtrait :

```
p && p.nom && !faites[p.nom] && (parseFloat(p.surface)||0) > 0
```

**Aucun contrôle de statut** : une parcelle **arrachée** — une vigne qui n'existe plus — sortait en
« encore sur pied ». Et `surface > 0` **effaçait silencieusement** toute parcelle dont la surface
n'est pas renseignée.

> ★★★ **Une liste qui se trompe dans les deux sens à la fois ne se remarque jamais : ce qu'elle
> ajoute masque ce qu'elle retire.** Le compte paraît plausible, il est faux deux fois.

Les deux écrans lisent désormais **`_vendResteARentrer`**, source unique.

### 80c. ★★ Le nom brut, et le champ qui redevient libre

`faites[r.parcelle] = 1` puis `!faites[p.nom]` : comparaison sur le **nom brut**. Or
`_vendInjectParcelleSelect` **retombe en saisie libre** quand aucune parcelle n'est enregistrée, et
préserve toute valeur hors liste. « les grandes vignes » ne rejoignait donc pas « Les Grandes
Vignes » : **l'écran réclamait une parcelle déjà vendangée**, et envoyait quelqu'un dans une vigne
vide. Comparaison normalisée par `_matNorm` (casse + accents), déjà en service dans le module.

★ **Le miroir a été traité en même temps** : une récolte dont le nom de parcelle **n'existe pas** au
parcellaire ne rentre aucune parcelle de la liste. Elle est **nommée sous la carte** au lieu de
laisser un compte inexplicable. *Un écart qu'on ne peut pas expliquer se lit comme une panne.*

### 80d. ⚠️⚠️⚠️ Le point dur : une contre-épreuve verte qui avait raison

Le harnais porte six contre-épreuves, **une par défaut, jouées séparément** — réintroduire les six
d'un coup et constater « c'est rouge » ne prouve rien. Cinq ont mordu du premier coup. **La sixième
est restée verte**, celle qui retirait la ligne rangeant les parcelles mesurées avant les autres :

```
if((x.suc==null)!==(y.suc==null)) return x.suc==null?1:-1;
```

Premier réflexe : le décor est trop faible. J'ai ajouté une parcelle jamais analysée dont le nom
passe **en tête de l'alphabet** — toujours vert. Décor à douze parcelles, mesurées et non mesurées
entrelacées — **toujours vert**.

★★★ **La ligne n'était pour rien dans l'ordre obtenu.** C'est `y.suc - x.suc` qui faisait le
travail : avec `y.suc` à `null`, JavaScript coerce en `0` et rend `-x.suc`, **négatif**, donc la
mesurée passe devant. Le bon ordre sortait **par accident d'arithmétique**. Mais dans l'autre sens,
`x.suc` valant `null`, le test `x.suc != null` est faux et la fonction répondait sur le **NOM**.

> ★★★ **UN COMPARATEUR QUI SE CONTREDIT N'A AUCUN RÉSULTAT GARANTI.** `Array.prototype.sort` ne
> promet rien si `cmp(a,b)` et `cmp(b,a)` ne sont pas de signes opposés : le résultat dépend de
> l'algorithme du moteur. V8 a déjà changé de tri une fois ; l'application tourne aussi sous
> **JavaScriptCore** sur les iPhone de l'équipe. *Un ordre juste n'est pas une preuve de comparateur
> juste.*

Correctif : **`_vendResteCmp`**, où le rang (mesurée = 0, non mesurée = 1) est calculé **avant**
toute soustraction — qui ne voit plus jamais qu'une paire de nombres. Et surtout, **l'assertion a
changé de cible** : elle ne regarde plus l'ordre obtenu mais la **cohérence** du comparateur —
antisymétrie et transitivité sur tous les couples d'un échantillon mixte. La contre-épreuve mord
alors instantanément, et **elle mord sur A26 pendant que A6, l'ordre, reste verte** : c'est
exactement la démonstration du défaut.

> ★★ **RÈGLE POSÉE : quand une contre-épreuve reste muette, la première hypothèse n'est pas
> « le décor est trop faible » mais « la ligne ne fait rien ».** Trois décors successifs pour
> l'admettre. Une ligne dont on ne peut fabriquer aucune conséquence observable est soit morte, soit
> le symptôme d'une mécanique qui travaille ailleurs — ici, une coercition silencieuse.

★ **Contrôle voisin, réarmé.** `C27` (WHATS_NEW s'ouvre sur APP_VERSION) était **aveugle depuis
6.77** : sa regex n'admettait que des commentaires `//` entre le crochet ouvrant et le premier
`{ v: }`, et le commentaire `/* ⚠ 6.76 n'a jamais été déployé … */` posé en tête l'a fait échouer.
Le contrôle retombait sur un **avertissement** « forme inattendue » — *un bump sans bloc serait
passé*. Regex élargie aux deux formes ; l'illisibilité est désormais une **ERREUR**. **Sixième
occurrence** du piège §53 : un contrôle qui lit du code ne doit jamais pouvoir être éteint par la
prose écrite à côté.

★ **Faux positif §24 supprimé à la source.** Le préflight lisait un `<div>` **dans** un `<button>`
là où il n'y avait qu'un ternaire entre deux balises. Le nom de balise est devenu une **variable** :
un seul élément, dont seul le type change. *Faire taire un contrôle juste en lui donnant raison,
jamais en l'ignorant.*

### 80e. ⚠️ Ce que ce lot ne fait pas — l'onglet Récoltes mélange les campagnes

`CAVE_VENDANGE.recoltes` n'est **filtré nulle part** dans `renderVendRec` : la carte annonce
« Campagne AAAA · N récoltes » et additionne **caisses, tonnes et hL de toutes les années saisies**.
Le libellé prend l'année civile (`new Date().getFullYear()`), pas la campagne — les deux divergent
de **janvier à juillet**. L'export PDF des récoltes a le même périmètre. **Rien n'archive ni ne
purge les récoltes d'une campagne à l'autre.**

La carte « Encore sur pied », elle, **est bornée** à la campagne (année de la date, la règle de
`_mlRecoltesDe` — une seule règle par écran).

⚠️ **Pourquoi ce n'est pas corrigé ici** : nous sommes le 6 septembre, cet écran sert tous les jours
en ce moment. Borner la liste changerait ce que Nico voit en pleine vendange, sans qu'il l'ait
demandé. *Un correctif juste, livré au mauvais moment, est un incident.* Le volet attend un « go » :
liste bornée à la campagne, ligne « N récoltes des campagnes précédentes » avec bascule, et même
périmètre pour le PDF.

### 80f. ★★★ CE LOT A ÉTÉ LIVRÉ DEUX FOIS — un clone du matin ne dit pas qu'il a vieilli

Première livraison : **APP 6.78 · SW 7.34**, lus dans un clone pris en début de session. Vérification
demandée par Nico avant intégration — `git fetch` a répondu :

```
+ 204832d...2bbbdf3  main -> origin/main  (forced update)
```

**Le commit de base n'existait plus.** Le dépôt avait été réécrit dans la matinée (purge
d'historique CONF-1/2/3, nouveau socle propre), et **deux lots** y avaient été poussés depuis :
le distant était à **APP 6.78 · SW 7.37**. Les deux numéros que j'avais posés étaient **pris**, dont
un par un lot déjà déployé.

⚠️ **Le piège le plus fin : `index.html` ressortait « identique au distant ».** Non parce qu'il avait
été poussé, mais parce que le lot d'en face avait fait **exactement le même bump** 6.77 → 6.78. Une
comparaison de contenu disait « à jour » sur un fichier qui n'avait jamais quitté ma machine.

> ★★★ **RÈGLE POSÉE : relire les versions dans les fichiers ne suffit pas — il faut relire les
> fichiers du DISTANT.** `APP_VERSION` lu dans un clone répond « quelle version avais-je ce
> matin ? », pas « quelle version est déployée ? ». Sur un dépôt où quelqu'un pousse le même jour,
> ce sont deux questions différentes. **Un `git fetch` avant le premier bump, pas seulement un clone
> en début de session.**

> ★★ **ET UN FORCE PUSH NE SE RATTRAPE PAS PAR UN `pull`.** Un clone antérieur à la réécriture est
> sur une branche morte : le merge proposé recréerait l'historique purgé. C'est `Fetch` puis
> **`Reset to origin/main`** (hard).

Ce qui a été **rejoué** sur le socle propre : `utils.js`, `index.html`, `sw.js`, `package.json`,
`CLAUDE.md`. Ce qui a été **reporté tel quel**, après vérification octet à octet que leur base
n'avait pas bougé : `cave.js`, `preflight.mjs`, `guide/08-cave.html`. *Vérifier qu'une base est
identique coûte une commande ; supposer qu'elle l'est coûte un lot.*

### 80g. Le filet

**`scripts/mv-harnais-reste-a-rentrer.mjs`** — 26 assertions, dans `check` **et** `prebuild`. Il
**exécute** les fonctions extraites de `cave.js` et `utils.js` (`_escAttr` compris) : aucun motif de
texte, un contrôle qui lit du texte aurait dit vert sur les deux défauts de §80b. Les deux variables
de module (`_vendResteOuv`, seuil de repli) sont **relues dans la source**, pas recopiées : un
harnais qui fige un seuil cesse de décrire l'écran dès qu'on le change. Toutes les dates du décor
sont **relatives à aujourd'hui** — un harnais qui fige une année devient faux le 1er janvier. Un
crash compte **rouge**, et un sabotage dont l'ancre a disparu **échoue bruyamment** au lieu de se
taire.

★ **Deux de mes propres assertions étaient fausses au premier lancement** : l'une cherchait `&#39;`
dans **toute** la page — que le texte visible contient légitimement, `_escHtml` fait son travail —
au lieu des seuls slots `onclick` ; l'autre attendait une surface calculée de tête, fausse de 0,5 ha.
**Corrigées avant de conclure quoi que ce soit sur le code.**

---

## 81. ★★★ PARC-1 — UN STATUT N'EST PAS UNE DATE (06/09 soir — APP 6.79 → 6.80 · SW 7.38 → 7.39)

**La demande de Nico**, dictée : *« Quand je change le statut d'une cuve, il faut que ça mette la
date du changement de statut. Par exemple, si je suis en préfermentaire à froid, à un moment elle va
passer en fermentation alcoolique, mais il ne faut pas que ça me change le statut entier de la cuve
depuis le début de la date de création. Il faut que ça me le change ce statut au moment où je change
le statut. »*

### 81a. ★★★ Le diagnostic : un champ qui n'a qu'une valeur ne peut pas porter une histoire

`cuves_vinif[].statut` est un **scalaire** : `setup | mpf | fa | decuvage | fml | termine`. Il dit
**où en est** la cuve, jamais **depuis quand**. Aucun des trois endroits qui l'écrivent
(`saveVendCuve`, `saveVendDecuvage`, `saveVendFusion`) ne datait le passage.

Conséquence directe : la seule date disponible pour tout ce qui compte des jours était
`date_entree` — la date d'encuvage. Une cuve qui venait de passer de MPF à FA **avait l'air d'être
en fermentation depuis l'encuvage**. C'est exactement ce que Nico décrit.

> ★★★ **Le symptôme n'était pas un calcul faux, c'était une donnée qui n'existait pas.** Aucun
> harnais n'aurait pu l'attraper : il n'y avait rien à vérifier.

### 81b. Le modèle : `statut_hist`

`[{id, statut, date}]`, rangé par date, ids posés à la lecture (`_vendHist`, même anatomie que
`_vendTriMes` de CUV-1). Six fonctions, toutes dans `cave.js` :

| fonction | ce qu'elle rend |
|---|---|
| `_vendHist(c)` | le parcours trié, ids posés |
| `_vendStatIdx(c,st)` | l'index de la **DERNIÈRE** occurrence d'une étape |
| `_vendStatDeb` / `_vendStatFin` | date d'entrée / de sortie de cette occurrence |
| `_vendStatDuree` | jours passés dans l'étape, **`null`** si la date d'entrée est inconnue |
| `_vendHistPose(c,st,date)` | empile **si et seulement si** l'étape change réellement |

⚠️ **`_vendStatIdx` lit la DERNIÈRE occurrence, pas la première.** Un retour en arrière — FA → MPF
pour rattraper une saisie — est possible, et « depuis quand est-elle en FA » doit lire le dernier
passage. Contre-épreuve n°3 dédiée.

⚠️ **`_vendStatDuree` rend `null`, jamais `0`.** *Zéro est un nombre, et un nombre se croit.* C'est
§34 du projet rejoué : une valeur manquante ne doit pas se déguiser en valeur mesurée.
Contre-épreuve n°2.

### 81c. ★★★ Aucun rattrapage inventé, et la contre-épreuve qui le garde

Les cuves créées **avant** ce lot n'ont pas d'historique. On connaît leur statut courant et leur
`date_entree` — mais **`date_entree` n'est pas la date de leur passage**. Une cuve encuvée le 12 et
passée en FA le 16 rendrait « FA depuis le 12 » : la même erreur qu'on vient de corriger, réécrite
en dur dans la migration.

**Décision : rien n'est migré.** La frise affiche **« — »** sous une étape franchie dont la date est
inconnue. C'est une invitation à la poser, pas un trou.

> ★★ *Un tiret se corrige, une date fausse se croit.*

⚠️ La **contre-épreuve n°10** injecte exactement le repli tentant —
`_vendStatDeb(c,s[0]) || c.date_entree` — et le harnais doit rougir. Sans elle, un futur lot
« améliorerait » la frise en rebranchant `date_entree`, et personne ne le verrait.

### 81d. Les deux portes, et une seule vérité

- **La fiche « Modifier »** : dès que le `<select>` de statut change, un champ **« Depuis le »**
  apparaît sous lui, réglé sur aujourd'hui, modifiable. Injecté **depuis `cave.js`**
  (`_vcuvInjectStatDate`, patron de `_vendInjectClientField`) — `index.html` n'est pas touché pour
  la fonctionnalité, seulement pour les quatre affichages de version.
- **Le parcours** : un `<details>` sous la frise, une ligne par passage avec sa durée, un crayon par
  ligne. Le bouton **« Changer l'étape »** du détail ouvre la même feuille.

⚠️ **Une correction n'est qu'un passage dont on rectifie la date** : deux écrans différents auraient
fabriqué deux vérités. `openVendStat(cuveId, histId)` sert les deux cas.

⚠️ **Les bornes sont posées AVANT toute écriture**, dans `saveVendCuve` comme dans `saveVendStat` :
date antérieure à l'encuvage, ou postérieure à aujourd'hui → toast et `return`, **la fiche reste
intacte**. Contre-épreuves n°6 et n°7.

⚠️ **Supprimer une étape efface une date, PAS un fait.** Retirer le dernier passage ne rétrograde
pas la cuve : corriger une faute de frappe ne doit pas remettre une cuve en fermentation.

⚠️ **Le statut suit la dernière étape du parcours**, sinon la frise et le badge se contrediraient.
**Deux exceptions fermes** : une cuve **fusionnée** ou **décuvée** reste `termine` — sa cuvée existe
déjà au Chai, et une correction de date ne doit pas la rouvrir. Contre-épreuve n°9.

### 81e. ★★ Un défaut de calcul trouvé en chemin, jamais signalé

`_mlProjFA` refusait d'ouvrir sa projection tant que `jCuve < 3` — et `jCuve` comptait depuis
l'**encuvage**. Cinq jours de macération préfermentaire à froid, deux jours de fermentation :
l'application croyait la cuve partie depuis sept jours et **annonçait une date de fin sur une
fermentation qui venait de commencer**.

Le garde compte désormais depuis le début de FA quand le parcours le connaît ; sans parcours,
**l'ancien comportement à l'identique**.

⚠️ **`jCuve` n'a PAS changé de sens** : `_mlAgenda` l'affiche sous le nom « en cuve depuis N j ».
Un `jFA` neuf porte le nouveau sens. *Changer le sens d'une variable sans changer son nom ne corrige
pas un défaut, il le déplace dans un écran voisin.* Contre-épreuve n°8.

★ **Le cahier de cuverie** imprime désormais la durée de macération **réellement faite** ; quand
elle n'est pas connue, la durée **prévue** (`mpf.duree_j`), **annoncée comme telle**. *Un document
qui imprime une intention sans le dire la fait passer pour un fait.*

### 81f. ⚠️ Un défaut d'affichage trouvé par accident

`.mvv-histwrap`, `.mvv-hrow` et leurs enfants vivent dans **`_vendEnsureSheetCss`**, appelée par
`_vendSheet` — donc **seulement à la première ouverture d'une feuille**. Or le détail déplié d'une
cuve les utilise depuis CUV-1 : **l'historique des relevés sortait sans style** tant qu'aucune
feuille n'avait été ouverte dans la session. Personne ne l'avait signalé parce qu'on ouvre presque
toujours une feuille avant de déplier une cuve. `renderCaveVendange` appelle maintenant les deux.

### 81g. ⚠️⚠️⚠️ Le dépôt réécrit une seconde fois dans la journée — §80f a servi le jour même

Le clone de la session portait `8ce647b`. `git fetch` a répondu
`+ 8ce647b...ee69077 main -> origin/main (forced update)` : **le commit de base n'existait plus**, et
le distant était passé de **6.74 / 7.29** à **6.79 / 7.38**, avec **CUV-4 sur `cave.js`**.

**Les 18 ancres du patch tenaient toutes.** C'est ce qui rend le piège dangereux : un dry-run vert
sur une base neuve dit que les *emplacements* sont là, **pas que le contrat du module est le même**.
Trois choses avaient changé sous les ancres :

1. **VD-SAVE.** Mes deux écrivains appelaient `window.fbSave('cave_vendange', …)` nu — l'idiome
   d'avant §75. `mv-harnais-vendange-garde` l'a attrapé : *« restant(s) : 2 »*. Passés à
   `_vendFbSave` (le vert ne part que sur `{ok:true}`) et `_vendGarde()` en tête.
2. **Le harnais FUS-1 plantait.** `saveVendFusion` appelle maintenant `_vendHistPose`, qui n'était
   pas dans ses `MORCEAUX`. ★ **Un lot qui change une fonction doit rebrancher le harnais qui la
   joue** — et le harnais l'a dit en plantant, pas en se taisant.
3. **Trois cliquets ont mordu, tous les trois avec raison** : `C24b` (un `s[0]` posé nu dans un slot
   `onclick` — constante littérale, **échappée quand même**, §72e), la graisse `400` hors des trois
   pas 500/600/700, et **le compte d'emojis** (`utils 77→78` : un `⚙` posé en tête d'une phrase de
   `WHATS_NEW`. *La charte n'écrit pas d'emoji dans un texte — elle appelle une icône.*)

> ★★★ **RÈGLE ÉTENDUE : une ancre qui tient ne prouve pas qu'un contrat tient.** Après un
> `forced update`, il ne suffit pas de rejouer le patch et de lire « dry run vert ». Il faut relire
> ce que le module attend de ses écrivains — et **lancer les harnais avant de croire au diff**.

### 81h. Le filet — `scripts/mv-harnais-parcours.mjs`

**161 assertions**, méthode C20 : les vraies fonctions sont **extraites de `cave.js` et exécutées**
(y compris `saveVendCuve` et `saveVendStat` en entier). Aucun motif de texte — un contrôle qui lit
du texte aurait dit vert sur la moitié de ces défauts.

⚠️ **Toutes les dates du décor sont relatives à aujourd'hui** (`jourMoins`, `jourPlus`) : *un harnais
qui fige une année devient faux le 1ᵉʳ janvier* (§80g).

**Dix contre-épreuves, JOUÉES UNE PAR UNE**, chacune sur un seul défaut réintroduit (§80d). Un
sabotage dont l'ancre a disparu, ou qui devient ambigu, **échoue bruyamment** au lieu de se taire.
Les dix mordent.

⚠️ **Deux de mes propres assertions étaient fausses au premier lancement**, et c'est la troisième
session de suite : `/mvv-hrow/` matche aussi `-l`, `-d` et `-u` (8 au lieu de 2), et le toast dit
« **A**ntérieur » avec une majuscule que ma regex n'admettait pas. ★ **Se demander si le contrôle a
tort AVANT d'accuser le code** — la règle existait, elle a resservi.

⚠️ Les rouges d'un sabotage polluaient le rapport final : `ko` était restauré, **pas `dit`**. Un
harnais qui remet son compteur sans remettre son journal ment sur ce qu'il a trouvé.

★ **Le harnais FUS-1 gagne 4 assertions** : la fusion date le passage des absorbées **au jour de la
fusion, pas à aujourd'hui**, et la porteuse n'en reçoit aucune — elle continue sa fermentation.

### 81i. La note de livraison

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | PARC-1 (§81b–81f) — +260 lignes, 8 suppressions | — |
| `scripts/mv-harnais-parcours.mjs` (neuf) | 161 assertions · 10 contre-épreuves | — |
| `scripts/mv-harnais-fusion.mjs` | morceaux PARC-1 + 4 assertions | — |
| `package.json` | branché dans `check` **et** `prebuild` | — |
| `src/utils.js` | `APP_VERSION` · `WHATS_NEW` (bloc 6.80, 3 items) · `MV_AIDE.cave` (4 points) | ★ APP |
| `index.html` | les **4** affichages de version | ★ APP |
| `public/sw.js` | en-tête · `CACHE_NAME` · les **2** `console.log` · changelog prépendé | ★ SW |
| `guide/08-cave.html` · `public/guide.html` | 4 puces, guide régénéré | — |
| `CLAUDE.md` | cette section | — |

**`_mvtSteps` : rien à changer, et c'est VÉRIFIÉ, pas supposé.** Les cibles de la visite guidée ont
été extraites et listées : `#mvc-elevage`, `#page-cave`, `#ml-body`, `#cave-view-mil` — **aucune ne
vise `.mvv-*`**, ni la frise, ni le parcours. Même conclusion qu'en §70h, refaite sur le code
d'aujourd'hui.

### 81j. ⚠️ Ce que ce lot ne fait pas

- **Le parcours n'entre pas au registre des manipulations**, et c'est délibéré : un changement
  d'étape est du **suivi**, pas une manipulation (doctrine `_rmLignes`, déjà posée).
- **Aucune alerte sur une MPF qui dépasse sa durée prévue.** `mpf.duree_j` est maintenant
  comparable au réel — la comparaison n'est pas faite. Candidat backlog.
- **`_vendSparkline` indexe toujours par position, pas par date** (§70g) : le parcours ne change
  rien à cette déformation.
- **Les contrôles Playwright n'ont pas pu tourner** ici : `cdn.playwright.dev` est hors liste
  blanche du bac à sable. *Ce n'est pas un vert, c'est un contrôle non joué* — à faire côté Nico.

---

## 82. ★★★ CUV-5 — CORRIGER UN POIDS DE CAISSE APRÈS COUP · ET UN LOT ÉCRASÉ PAR UN LOT (06/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` · APP 6.80 → 6.81 · SW 7.39 → 7.40)

**La demande de Nico**, en pleine vendange 2026 : les caisses annoncées à **25 kg** et à **12 kg**
pesaient en réalité **20 kg** et **10 kg**. **Quarante-sept récoltes** déjà saisies, les bons pas
encore remis aux clients. *« Il faut faire le changement et que le recalcul se fasse. »*

### 82a. ★★★ CE LOT A D'ABORD ÉTÉ LIVRÉ SUR UNE BASE PÉRIMÉE, ET IL A EFFACÉ PARC-1

**À lire avant tout le reste.** Le clone de session datait du matin. **PARC-1 (§81) a été poussé
entre-temps.** Le lot a été préparé sur `ee69077`, livré en **fichiers complets**, et intégré
par-dessus `dd1110c` : `src/cave.js` a donc **remplacé** la version qui portait PARC-1. Effacés d'un
coup : `_vendHist`, `_vendHistPose`, `_vendParcHist`, `_vendStepper`, `openVendStat`, `saveVendStat`,
`_vendStat*` — **tout le parcours daté d'une cuve**, plus les entrées `WHATS_NEW`, `MV_AIDE`, guide
et changelog SW du même lot.

**Ce n'est pas le CI qui a été lent, c'est lui qui a sauvé le lot** :

```
Error: bloc introuvable : function _vendHist(c){
    at scripts/mv-harnais-fusion.mjs:31
```

`mv-harnais-fusion.mjs`, mis à jour par PARC-1, a survécu (je ne le livrais pas) et **réclamait une
fonction que mon `cave.js` ne contenait plus**. Sans lui, la perte serait partie en production.

> ★★★ **UNE LIVRAISON EN FICHIERS COMPLETS EST UN ÉCRASEMENT, PAS UNE FUSION.** Git ne fusionne
> rien quand on dépose un fichier par-dessus un autre. Sur un dépôt où quelqu'un pousse le même
> jour, l'unité de risque n'est pas la ligne, c'est **le fichier entier**.

> ★★★ **LE `git fetch` DE §80f N'EST PAS UNE PRÉCAUTION DE DÉBUT DE SESSION, C'EST UNE ÉTAPE DE
> LIVRAISON.** Il avait été écrit noir sur blanc au lot précédent — et redit dans la note de
> livraison de celui-ci. **Une règle rappelée deux fois et non exécutée n'est pas une règle, c'est
> un vœu.** Le clone répond « quelle version avais-je ce matin ? », pas « qu'y a-t-il sur le
> distant ? ». Ce sont deux questions différentes dès qu'une deuxième main travaille.

★★ **ET LE PIÈGE DE §80f S'EST REJOUÉ À L'IDENTIQUE** : `index.html` ne figurait **pas** dans le
diff d'intégration. Non parce qu'il était à jour, mais parce que PARC-1 avait fait **exactement le
même bump** 6.79 → 6.80. Un fichier qui « ne bouge pas » n'est pas un fichier innocent : sur un
porteur de version, c'est la signature d'une **collision de numéros**. 6.80 / 7.39 étaient **pris**.

**Réparation** : le lot est **rejoué sur `dd1110c`** — les cinq ancres y tenaient toutes, uniques,
sans collision de nom (`_vpc`, `_vendParcLot`, `openVendPoids` : zéro occurrence préalable) — et
**renuméroté 6.81 / 7.40**. `_vendHist` est de retour (2 occurrences), le bloc `WHATS_NEW` 6.80 de
PARC-1 est **conservé sous** le 6.81, son changelog SW `v7.39` **subsiste exactement une fois**, et
`mv-harnais-parcours.mjs` reste câblé dans `package.json`.

> ★★ **CE QUI CHANGE POUR LES PROCHAINS LOTS.** La note de livraison ne dit plus « fais un
> `git fetch` » : elle donne **le SHA de base**. Si `git rev-parse origin/main` ne rend pas ce SHA,
> **le lot ne s'intègre pas — il se rejoue.** Un contrôle qui dépend de la vigilance de celui qui
> colle les fichiers a déjà échoué une fois aujourd'hui.

### 82b. Ce que le code disait avant d'écrire une ligne

- **La correction unitaire existait déjà** : `openOvVendRec(id)` rouvre une récolte, et chaque ligne
  de la répartition porte son champ **kg/caisse**. Rien à inventer côté saisie.
- **Mais rien pour le faire en bloc**, et surtout : **aucun écran n'affiche le poids d'un apport
  déjà saisi.** Le Cuvier montre des kilos, jamais le poids qui les a faits. Rouvrir 47 récoltes une
  par une, c'est 47 occasions d'en oublier une — et **rien ne dirait laquelle**.
- `pck` est **figé dans la part** depuis VD-1. La règle est bonne (elle protège un bon signé) et il
  ne fallait pas la lever : il fallait **une porte**, pas une brèche.

### 82c. ★★ Le vrai danger du lot : le champ est facile, le RECALCUL ne l'est pas

Les kilos ne vivent pas qu'au Cuvier. `_vendRecordRendement` les **dénormalise dans la parcelle**
(`rendement_hist`), et c'est **là** que le Pilotage lit son prix de revient. Un correcteur qui
n'écrirait que `parts[].pck` laisserait **le Cuvier juste et le Pilotage faux** — l'écart le plus
cher à trouver, parce que les deux écrans ont l'air sains **chacun de son côté**.

> ★★★ **La correction repasse par `_vendRecordRendement` — LA MÊME fonction que l'enregistrement
> d'une récolte, pas une copie du calcul.** L'upsert par `recolte_id` fait le reste.

### 82d. ★★★ DEUX DÉFAUTS TROUVÉS EN CHEMIN, dans les DEUX autres écrans qui écrivent des kilos

**1. `_vendRetSave` ne prévenait pas la parcelle.** L'écran *Livraisons et bons* corrige les caisses
**et le poids** d'un chargement — il écrit `x.part.pck` — et n'appelait **jamais**
`_vendRecordRendement`. Vérification : la fonction n'avait **qu'UN appelant** (`saveVendRec`) alors
que **deux** écrans écrivent des kilos. `rendement_hist` gardait les anciens kg/ha, en silence.

**2. Le bilan de campagne pesait TOUTES les caisses à 25 kg, en dur.**

```js
var kg = (r.nb_caisses||0) * 25;
if(typeof window !== 'undefined' && typeof window._recKg === 'function') kg = window._recKg(r);
```

**`window._recKg` n'a jamais été exporté.** Le garde était donc **toujours faux**, et la seconde
ligne n'a **jamais** été exécutée. Le document ignorait `parts[]` — donc les caisses de 12 kg d'un
négociant, et toute correction de poids.

> ★★★ **UN REPLI DÉFENSIF QUI NE SE REPLIE JAMAIS NE PROTÈGE RIEN : IL CACHE.** Une garde
> `typeof window.X === 'function'` sur une fonction du **même module** n'est pas une précaution,
> c'est un interrupteur laissé sur *off*. **Chercher les `window.X` dont le `window.X = X` n'existe
> pas** — le miroir exact du piège Rollup de §63, et il se lit avec le même grep.

### 82e. La porte — `Réglages du Cuvier ▸ Corriger un poids déjà saisi`

Millésime, puis **les poids réellement en place** avec ce qu'ils pèsent (récoltes, apports, caisses,
tonnes) — **la seule vue de l'application qui les montre**. Poids réel, aperçu **destinataire par
destinataire avant d'appliquer**, deux cases pour faire suivre le poids par défaut et les fiches
client. Le bas de la feuille est isolé (`#vpc-bas`) : réécrire la feuille entière recréerait
`#vpc-nv` et perdrait le curseur au second chiffre — piège récurrent de ce fichier.

⚠️ **Le scan lit `_vpPck()`, jamais `part.pck`.** Une récolte d'avant VD-1 n'a pas de `parts[]` et
son poids vient encore de la fiche client : sans ça, **la seule récolte que le correcteur ne verrait
pas serait la plus ancienne**. Et à l'application, la part de migration est **écrite dans la
récolte** : `_vendParts()` en fabrique une **en lecture**, stockée nulle part. La corriger sans la
poser, c'est corriger un objet jetable — l'écran dit juste, le rechargement dit faux.

### 82f. ★★ 47 corrections ne doivent pas faire 47 écritures

`_vendRecordRendement` appelle `_vendSaveParcelles()` à chaque passage : la rafale aurait déclenché
**47 transactions** sur la collection la plus protégée de l'application. `_vendParcLot(fn)` les
regroupe en une.

> ★★ **LA FORME EST UN ENCADREMENT, PAS UN COUPLE OUVRIR/FERMER.** Il n'y a **pas de `flush` à
> oublier**, et une exception au milieu du lot ne peut pas laisser les écritures de parcelles
> **muettes pour le reste de la session** — c'est le `finally` qui rend la main, pas la bonne
> volonté de l'appelant.

### 82g. Ce que la correction ne touche pas

Les **litres de jus et de lie** rendus par un acheteur : c'est **sa** mesure. La **contenance** des
cuves. Et **un bon déjà imprimé et remis**, qui ne correspondra plus à ce qu'affiche l'application —
dit dans la feuille, dans `MV_AIDE` et dans le guide, parce qu'aucun code ne répare un papier signé.

⚠️ **Limite connue, assumée** : `_vendCuvHl(caisses)` convertit des caisses en hL avec le **poids
par défaut**, pas le `pck` de chaque part (≈ 10 appelants). C'est pourquoi la case « corriger aussi
le poids par défaut » est **cochée d'office** quand le défaut vaut l'ancien poids. Un jour : leur
passer des kilos.

### 82h. Le filet

**`scripts/mv-harnais-poids-caisse.mjs`** — **53 assertions**, dans `check` **et** `prebuild`. Il
**exécute** `_vpcAppliquer` et `_vendRecordRendement` **en entier**, extraits de `cave.js`. Un
compteur d'écritures prouve que la rafale n'en fait qu'**une**. Les deux `var` de module du lot
d'écritures sont **relues dans la source** : le harnais tombe si la déclaration disparaît.

★ **Les cinq sabotages se jouent UN PAR UN**, chacun dans son propre processus. Joués ensemble, deux
défauts se couvrent : le premier fait tomber les assertions du second, et on ne sait plus lequel est
réellement vu. Un sabotage dont l'ancre a disparu **échoue bruyamment**.

★ **Deux de mes propres assertions étaient fausses au premier lancement** : l'une visait `_bcData`
alors que le code de la récolte vit dans **`_bcDoc`** ; l'autre cherchait `window._recKg` dans tout
le fichier — et le **commentaire qui explique le défaut corrigé contient le motif du défaut**. Sans
nettoyage des commentaires, ce contrôle serait rouge à jamais et on finirait par le retirer. *C'est
le contrôle qui s'adapte, pas l'explication qui s'efface.*

### 82i. La note de livraison

**Base : `dd1110c` (PARC-1).** Si `git rev-parse origin/main` ne rend pas ce SHA, **ne pas
intégrer** — redemander un rejeu.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | CUV-5 : `_vendParcLot`, le correcteur (`_vpc*`), la porte dans `renderVendParam` · **fix** `_vendRetSave` · **fix** bilan de campagne. **PARC-1 intact** | — |
| `src/utils.js` | `APP_VERSION` 6.81, `WHATS_NEW` (3 items **au-dessus** du bloc 6.80), `MV_AIDE.cave` (1 point neuf) | ★ APP |
| `index.html` | les 4 affichages de version | ★ APP |
| `public/sw.js` | en-tête, `CACHE_NAME`, **les 2 `console.log`**, changelog prépendé **au-dessus** du v7.39 | ★ SW |
| `guide/08-cave.html` · `public/guide.html` | la correction après coup, et ce qu'elle ne touche pas | — |
| `scripts/mv-harnais-poids-caisse.mjs` (neuf) · `package.json` | 53 assertions + 5 contre-épreuves, câblé à côté de `mv-harnais-parcours.mjs` | — |

**Vérifié** : `node --check` sur les 3 JS · équilibre `{}` `()` `[]` à zéro · aucun demi-surrogate ·
**compte de `catch(` inchangé** (cave 14 → 14) · `_vendHist` toujours présent · `v7.39` subsiste
**exactement une fois** · `npm run check` et `npm run lint` **verts** · harnais **53/53** puis
**5/5** en contre-épreuve · guide régénéré, `build-guide.mjs --check` vert.

---

## 83. ★★ LA GARDE DE BASE — SORTIR §82a DES BONNES INTENTIONS (06/09 — `scripts/` + `package.json`, AUCUN BUMP)

§82a a coûté un lot effacé. La règle — *vérifier le distant avant d'intégrer* — était **déjà écrite
deux fois** : dans CLAUDE.md §80f, et dans la note de livraison du lot lui-même.

> ★★★ **UNE RÈGLE RAPPELÉE DEUX FOIS ET NON EXÉCUTÉE N'EST PAS UNE RÈGLE, C'EST UN VŒU.** Tant
> qu'elle dépend de la vigilance de celui qui colle les fichiers, elle a déjà échoué une fois et
> échouera encore. Il fallait la mettre dans **une commande qui rougit**.

### 83a. Le mécanisme, en trois pièces

1. **Chaque lot livré contient `.mv-base`** à la racine : le SHA du commit sur lequel il a été
   construit, suivi d'un commentaire lisible (`ac6fbb4  # base : … APP 6.81 / SW 7.40`).
2. **`scripts/mv-base.mjs`** exige que ce SHA soit le `HEAD` courant. Il passe **en tête** de
   `check` et de `prebuild` : c'est le premier contrôle joué, avant même le preflight.
3. **Rien à retenir côté intégration.** La séquence est : coller → `npm run check` → commiter.
   Si la base ne correspond pas, `check` s'arrête sur un message qui dit quoi faire.

### 83b. ★★ Il ne s'arme que quand `.mv-base` vient d'être collé

Un contrôle qui comparerait toujours `.mv-base` au `HEAD` serait **rouge à jamais dès le premier
commit** — le SHA de base devenant le parent du HEAD — et on finirait par le retirer.

La condition d'armement est donc que **`.mv-base` lui-même apparaisse comme modifié ou non suivi**
(`git status --porcelain -- .mv-base`). Présence d'un lot frais = contrôle armé ; commit =
désarmement automatique.

> ★★ **UN CONTRÔLE QU'ON DOIT DÉSACTIVER À LA MAIN EST UN CONTRÔLE QU'ON OUBLIE DE RÉACTIVER.**

⚠️ Hors dépôt git, ou git illisible : le script **le dit** (`controle NON joue`) et laisse passer.
Il ne prétend pas avoir vérifié — §82d, un repli qui ne se replie jamais ne protège rien.

### 83c. Ce que la garde NE couvre pas

Elle voit un lot posé sur le mauvais commit. Elle ne voit **pas** un lot dont on ne colle qu'une
partie des fichiers. Ce filet-là existe déjà, et c'est lui qui a sauvé le 06/09 : **les harnais de
`npm run check` réclament des fonctions par leur nom** (`mv-harnais-fusion` a hurlé sur
`_vendHist`). D'où la séquence : la garde d'abord, les harnais juste après, **le commit en
dernier**.

**Contre-épreuves** : 5 dépôts fabriqués, 5 verdicts — bonne base, mauvaise base, déjà commité,
pas de `.mv-base`, hors dépôt git. `node scripts/mv-base.mjs --contre`, **5/5**.

**Base : `ac6fbb4`.**

---

## 84. ★★★ CUV-6 — LES HECTOLITRES SUR DES KILOS, ET CE QUE LE DIAGNOSTIC A APPRIS (06/09 — APP 6.81 → 6.82 · SW 7.40 → 7.41 · base `b7c3351`)

Nico, après CUV-5 : *« la correction ne corrige pas les saisies déjà faites, j'ai des résultats
aberrants — un écart jusqu'à 16 215 kg sur 27 000 en changeant 5 kg sur 1 400 caisses. »*

### 84a. ★★★ NE PAS DEVINER UNE TROISIÈME FOIS — le diagnostic en lecture seule

Deux lots de suite avaient été construits sur une hypothèse. Au lieu d'un troisième, un script
**lecture seule** collé dans la console : poids réellement en place, écart entre les deux sources de
kilos, `nb_caisses` contre somme des apports, apports non figés, cuves, fiches client,
`rendement_hist` périmé. Trente secondes, aucune écriture.

> ★★★ **QUAND DEUX HYPOTHÈSES TIENNENT ET QU'ON N'A PAS LES DONNÉES, LE LIVRABLE N'EST PAS UN
> CORRECTIF, C'EST UN INSTRUMENT DE MESURE.** Il a répondu en un passage à ce que trois lectures du
> code n'avaient pas tranché — et il a démoli au passage la reconstruction que j'avais faite du
> problème.

Ce qu'il a rendu : 38 récoltes, 1 378 caisses. **25 kg : 1 081 caisses, 36 apports, tous figés.**
20 kg : 64. 12 kg : 233. Zéro apport sans poids. Zéro `rendement_hist` périmé.

### 84b. ★★ Le 16 215 se calcule : **1 081 × 15**

Pas 5 kg d'écart : **15**. Soit 25 → **10**. Le correcteur retient d'office le poids **le plus
lourd** à l'ouverture, et `_vpcSetAnc` **ne vidait pas `_vpc.nouveau`**. Un « 10 » tapé pour les
caisses de 12 restait en place quand on revenait sur celles de 25, et l'aperçu annonçait
27 025 → 10 810 kg.

> ★★★ **LE CHIFFRE ÉTAIT JUSTE. C'EST LA QUESTION QUI N'ÉTAIT PLUS CELLE QU'ON POSAIT.** Une valeur
> de remplacement ne veut rien dire hors de ce qu'elle remplace : elle doit être **détruite avec
> son contexte**, jamais survivre à un changement de sélection. Un état partagé entre deux
> sélections successives est un état faux qui a l'air sain.

Corrigé : le poids réel se vide au changement de ligne **et** de millésime, et au-delà de **40 %**
l'écran le signale avant l'appui — dans l'aperçu et dans la confirmation.

### 84c. ★★★ LA VRAIE CAUSE : `_vendCuvHl(caisses)` NE POUVAIT PAS TOMBER JUSTE

```
A · parts[]        : 1 378 caisses → 31 101 kg     ← Cuvier, bons, rendements
B · nb_caisses×20  : 1 378 caisses → 27 560 kg     ← hL des cuves, apports/parcelle, bilan
ÉCART                                    −3 541 kg
```

`_vendCuvHl` multipliait un **nombre de caisses** par **un** poids, celui du réglage. Nico en a
**trois** (25, 20, 12).

> ★★★ **UNE FONCTION QUI PREND DES CAISSES ET REND DES HECTOLITRES SUPPOSE UN POIDS UNIQUE. CE
> N'EST PAS UN BUG DE VALEUR, C'EST UN BUG DE SIGNATURE** : aucun réglage ne pouvait la rendre
> juste. C'était la **seconde source de vérité pour les mêmes kilos** — `_recKg` en donnait une,
> le réglage global une autre — et corriger un poids ne bougeait que la première. Deux écrans
> sains chacun de son côté, un total impossible.

`_vendHlKg(kg)` + `_vendCuvKgDom(id, exclId)` (le jumeau en kilos de `_vendCuvCsDom`). **Dix sites
convertis**, dont deux qui portaient déjà leurs kilos sans les utiliser (`_apportsRangs`). Deux
agrégats gagnent un `kg` à côté de leur `caisses` (`_vendCuvStats`, les couches d'une cuve).

★ **`_vendCuvHl` est SUPPRIMÉE, pas dépréciée.** Une fonction morte qui traîne est une invitation :
le prochain lot pressé la rappellerait. Le harnais exige **zéro déclaration et zéro appelant**.

⚠️ La saisie en cours (`_vendCuvAtt`) n'a pas encore de récolte enregistrée : ses kilos viennent de
la **répartition en train d'être tapée**, qui porte déjà son poids par ligne. Le repli sur le
réglage ne sert qu'avant la première caisse saisie.

### 84d. ★★ Le garde-fou était SOUS les mutations

```js
if(_vpc.defaut && …) CAVE_VENDANGE.config.poids_caisse_kg=nv;   // modifié
if(_vpc.clients)     cl.forEach(c => c.poids_caisse_kg=nv);      // modifié
if(!nRec){ showToast('Aucun apport à ce poids'); return; }       // puis on part sans enregistrer
```

Une exécution stérile salissait la mémoire et repartait ; les changements orphelins partaient dans
le premier enregistrement venu, **depuis n'importe quel écran**.

> ★★★ **UNE SORTIE ANTICIPÉE DOIT LAISSER L'ÉTAT EXACTEMENT COMME ELLE L'A TROUVÉ.** Le garde-fou
> se place **au-dessus** de la première mutation, pas en dessous de la dernière — c'est la seule
> position qui reste vraie le jour où on en ajoute une troisième.

⚠️ Dans les données de Nico, ce défaut **n'a pas tiré** : il avait modifié le réglage à la main
avant la conversation. Il a été trouvé en lisant, pas en observant. Un défaut réel qui n'a pas
encore mordu reste un défaut.

### 84e. Le catch muet

`_vendRecordRendement` avalait tout dans un `catch(e){}` sans une ligne. Il avale toujours — c'est
le contrat, un rendement ne doit jamais faire échouer une récolte — mais il passe par
`window.logError({level:'info',cat:'cuvier'})`. Compte de `catch(` inchangé (14).

### 84f. ★★ Le harnais, et un sabotage qui ne sabotait rien

**71 assertions**, **8 contre-épreuves**, jouées **une par une**.

★★★ **Le premier sabotage n°6 est passé INAPERÇU.** Il rendait `_vendHlKg` équivalente via
`kg/25*poids_defaut` — or le jeu d'essai a justement **25** kg de poids par défaut : le sabotage
était l'**identité**.

> ★★★ **UN SABOTAGE QUI NE SABOTE RIEN FAIT CROIRE AU HARNAIS.** Il doit porter là où le mensonge
> est réel, pas là où il est syntaxiquement visible. Remplacé : la somme des kilos d'une cuve
> refaite en `caisses × 25`, sur une cuve qui **mélange 25 et 12 kg** — l'ancien `_vendCuvHl`, exact.
> Sans la contre-épreuve, ce trou serait resté dans le filet, invisible et rassurant.

### 84g. Ce que Nico doit vérifier après intégration

Les **2 apports à 20 kg (64 caisses)**, saisis après que le réglage soit passé à 20 : peut-être des
caisses de 25. Et **Maison Harbour** et **Lienardt**, restés à 12 en fiche quand Les Orées et
Gautheron sont à 10.

Après les deux passes (1 081 × 25→20, puis 233 × 12→10) : **31 101 → 25 230 kg**.

### 84h. La note de livraison

**Base : `b7c3351`.** Si `git rev-parse origin/main` ne rend pas ce SHA, **rejeu** (§83).

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_vendHlKg` + `_vendCuvKgDom`, 10 sites, `_vendCuvHl` supprimée · garde-fou remonté · poids réel vidé · seuil 40 % · catch bruyant | — |
| `src/utils.js` | `APP_VERSION` 6.82, `WHATS_NEW` (3 items), `MV_AIDE.cave` (2 points) | ★ APP |
| `index.html` · `public/sw.js` | les 4 porteurs · en-tête, `CACHE_NAME`, 2 `console.log`, changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `public/guide.html` | la ligne sélectionnée, les hL sur les kilos | — |
| `scripts/mv-harnais-poids-caisse.mjs` | 53 → **71** assertions, 5 → **8** sabotages | — |
| `.mv-base` | `b7c3351` | — |

---

## 85. ★★★ UI-Z — LE DIALOGUE S'OUVRAIT DERRIÈRE LA FEUILLE (06/09 — APP 6.82 → 6.83 · SW 7.41 → 7.42 · base `ab77457`)

Nico, après CUV-6 : *« lors de la modification d'un poids déjà saisi, une fenêtre s'ouvre pour
valider mais elle doit apparaître derrière la première, et ça n'enregistre pas car je dois cliquer
à côté. »*

### 85a. ★★★ La cause n'est pas un chiffre, c'est un angle mort

```js
function openOv(id){
  var base=600,max=base-1;
  document.querySelectorAll('.overlay.open').forEach(…);   // ← SA PROPRE FAMILLE
  el.style.zIndex=(max+1);
}
```

`openOv` empilait correctement **à l'intérieur de ce qu'il voyait** : les `.overlay`. La feuille du
Cuvier vit dans une autre famille — `.mvv-ov`, z-index **9000**, déclarée dans une **CSS injectée
par `cave.js`**, invisible à tout outil qui ne lit que `styles.css`. Le dialogue sortait à 600, sous
9000 : invisible, injoignable, et le clic « à côté » annulait.

**Onze `openConfirmDel` et quatre `openPrompt` du seul Cuvier** passaient dessous — supprimer une
récolte, une cuve, un relevé, un client, une opération. Et le **tiroir du Pilotage**
(`.pil-drawer`, 9999) portait le même défaut.

> ★★★ **ÉLARGIR LE BALAYAGE À `.mvv-ov` N'AURAIT PAS SUFFI.** La prochaine famille créée
> redeviendrait invisible et le défaut reviendrait sans bruit. Un dialogue modal interrompt **ce
> qu'il y a à l'écran, quoi que ce soit** : il ne se compare pas à ses voisins, il se place
> au-dessus **par construction**. D'où un plancher, pas un balayage.

`MV_Z_MODAL_PLANCHER = 9200` (au-dessus de toute surface d'accueil) et `MV_Z_MODAL_PLAFOND = 9490`.

> ★★ **LE PLAFOND N'EST PAS DÉCORATIF.** Sans lui, une centaine d'overlays empilés finirait par
> passer au-dessus de la **porte CGU** (`.mvt-ov`, 9500), qui est en *fail-closed*. On préfère deux
> dialogues à égalité — l'ordre DOM tranche, comme dans `_mvTopOverlay` — plutôt qu'un consentement
> contournable.

`.pil-scrim` et `.pil-drawer` redescendent à **8900 / 8910**.

### 85b. ★★★ Le harnais, et quatre extracteurs qui mentaient

`scripts/mv-harnais-couches.mjs` lit les z-index de `styles.css`, d'`index.html` **et des CSS
injectées dans les modules**, et vérifie :

```
surface d'accueil  <  PLANCHER  ≤  PLAFOND  <  porte CGU
```

Une « surface d'accueil » est ce par-dessus quoi un dialogue s'ouvre : suffixe `-ov`, `-sheet`,
`-drawer`, `-scrim`, `-modal`, `-panel`. Pas les toasts, pas les bandeaux, pas le splash — eux sont
au-dessus **volontairement**.

★★ **Le premier contrôle disait « toute couche au-dessus du plancher est fautive ». Il a sorti
31 rouges, dont aucun n'était un défaut.**

> ★★★ **UN CONTRÔLE QUI ROUGIT SUR TRENTE ET UN FAUX POSITIFS NE SERA PAS LU : IL SERA DÉSACTIVÉ.**
> Il ne prouvait rien, il criait. La question n'est pas « qu'est-ce qui est haut », c'est
> « qu'est-ce qu'un dialogue doit recouvrir ».

★★★ **Et quatre extracteurs de sélecteur avant le bon**, chacun rendant un résultat **plausible mais
faux** :

1. remonter par voisinage → rendait `#fff` (une couleur) et ratait `.pil-drawer` ;
2. découper en blocs sans retirer les commentaires → le commentaire que je venais d'écrire au-dessus
   de `.pil-scrim` **devenait son sélecteur** ;
3. découper en blocs, commentaires retirés → la regex **se désynchronise au premier `@media`** :
   25 blocs trouvés sur des centaines, et justement pas les quatre qui comptent ;
4. remontée par comptage d'accolades → correct en CSS, mais dans une CSS **injectée** ce qui précède
   la première règle est du JavaScript : `.mvv-ov` sortait `undefined`. Coupe au dernier délimiteur
   de chaîne.

> ★★★ **UN EXTRACTEUR QUI SE TROMPE DE NOM EST PIRE QU'UN EXTRACTEUR ABSENT : IL N'ÉCHOUE PAS, IL
> RÉPOND — et on le croit.** Les quatre versions rendaient une liste d'apparence saine. Seule
> l'exigence de retrouver **nommément** `.mvv-ov`, `.pil-drawer`, `.pil-scrim` et `.mvt-ov` les a
> démasquées : un harnais doit être forcé de nommer ce qu'il prétend surveiller.

**11 assertions**, contre-épreuve : le plancher remis à **600** — sa valeur d'avant l'incident —
fait rougir 4 assertions.

### 85c. Connu, non traité

`.mvtwc` (99999) et `.mvt-ring` / `.mvt-bar` / `.mvt-menu` (100002→100006) dans `app.js` restent
au-dessus du plafond modal. Je ne sais pas si un dialogue s'ouvre jamais par-dessus cette barre
flottante, et **baisser à l'aveugle une couche qu'on ne comprend pas est la façon exacte de casser
un écran**. Le harnais ne les compte pas comme surfaces d'accueil : à trancher le jour où le cas se
présente.

### 85d. La note de livraison

**Base : `ab77457`.** Si `git rev-parse origin/main` ne rend pas ce SHA, **rejeu** (§83).

| fichier | ce qui change | bump |
|---|---|---|
| `src/app.js` | `openOv` : plancher 9200, plafond 9490 | ★ APP |
| `src/styles.css` | `.pil-scrim` 9998 → 8900, `.pil-drawer` 9999 → 8910 | ★ APP |
| `src/utils.js` · `index.html` · `public/sw.js` | 6.83, 1 item, 4 porteurs, changelog | ★ APP · ★ SW |
| `scripts/mv-harnais-couches.mjs` (neuf) · `package.json` | 11 assertions, câblé dans `check` et `prebuild` | — |

## 86. ★★★ CUVDOC-1 — LA COURBE DANS LE CAHIER, ET LE DOCUMENT QUI NE CHARGE PAS LA FEUILLE (07/09 — APP 6.83 → 6.84 · SW 7.42 → 7.43 · base `494385f`)

> **Point de départ**, demandé par Nico : *« dans le rapport PDF du cuvier pour les contrôles de
> densité, j'aimerais que apparaissent aussi les graphiques, température, densité »*. Le **cahier de
> cuverie** (`_cuvDoc`) imprimait les relevés en **tableau seul** — jusqu'à trente lignes de
> chiffres par cuve, où l'allure de la fermentation ne se voyait pas. L'écran, lui, avait la courbe
> depuis le lot M3.

### 86a. Ce qui a été fait — et ce qui n'a surtout pas été fait

⚠️⚠️ **AUCUN TRACÉ NEUF.** La courbe du cahier **est** `_vendFermSvg`, celle de l'écran, appelée
avec la largeur de la page. Écrire un second dessin pour le papier, ce serait **deux vérités en
puissance sur le même relevé** — précisément ce que l'en-tête des documents du Cuvier refuse déjà
pour les calculs (*« le document LIT l'écran, il ne le refait pas »*). La règle vaut aussi pour
**le dessin**, pas seulement pour les chiffres.

★ **Le palier de recomposition sert enfin à quelque chose.** `_mvGraphCadre` masque l'axe des
degrés sous 560 px : deux axes chiffrés ne tiennent pas sur un téléphone. Le document appelle à
**640 px** — `MV_CUVDOC_GRW`, la largeur utile d'un A4 portrait (210 mm − 24 mm de marges = 703 px,
moins les 18 px de `.mvdoc-body` de chaque côté = 667). Sur le papier la place ne manque pas :
**l'axe des températures reste chiffré**, ce que l'écran d'un téléphone ne peut pas offrir.

### 86b. ⚠️⚠️⚠️ LE PIÈGE : UN DOCUMENT NE CHARGE PAS `styles.css`

`_mvDocOpen` produit un **Blob** ouvert dans sa propre fenêtre. Il n'y charge que
`/fonts/fonts.css` et les deux feuilles qu'il compose lui-même. **Aucune variable de thème ne
l'atteint** — c'est la même frontière qu'en **§59**, prise par l'autre bout.

Or `MV_GRAPH_COL` peint en `var(--terre)`, `var(--orange)`, `var(--gris-clair)`… **sans repli**.
Collée telle quelle dans un document, la courbe de densité, celle de température, la grille et les
repères d'opération seraient **tous sortis noirs, les uns sur les autres**. ★★★ **Et rien ne
l'aurait signalé** : le document s'imprime, il est juste illisible. Un défaut qui ne produit ni
erreur ni page blanche ne se découvre qu'en regardant une feuille sortie de l'imprimante.

Le CSS du cahier pose donc ses propres couleurs, dans son `:root` — l'idiome existait déjà, et il
est **exempté nommément** dans `mv-harnais-jetons.mjs` : `_rsCss()` (rapport de saison) déclare
`--ligne` pour la même raison, *« un AUTRE DOCUMENT, qui ne charge pas styles.css »*.

⚠️ **Valeurs de MODE CLAIR, toujours.** Une page s'imprime sur du papier blanc **même quand l'écran
est en sombre**. Reprendre « les couleurs en vigueur » aurait donné du blanc sur blanc.

⚠️ **Deux rôles prennent l'encre du DOCUMENT, pas celle de l'écran** : la grille (`#E4DCCB`, le
filet du pied de page de MV_DOC) et l'or (`#C8A060`, celui des filets du cahier). *Un graphe posé
sur cette feuille doit être de cette feuille.*

★ **Contrastes calculés, pas supposés** — les quatre rôles qui **écrivent** sur blanc : texte
`#7A7263` **4,80** · orange `#B85A1A` **4,65** · vert `#3D6B27` **6,20** · terre `#8A5A38` **5,83**.
Tous au-dessus de 4,5. L'or et la grille **tracent, ils n'écrivent jamais** (charte MV_GRAPH).

★★ **Les SEPT rôles sont déclarés, pas les six utilisés.** Le jour où le tracé de l'écran en prend
un de plus, le papier n'a pas à attendre un lot pour le peindre — et il ne le peindra pas en noir.

### 86c. Sous trois densités, le document se tait

`_vendFermSvg` rend, sous trois relevés, l'**état vide de l'écran** : un encadré à bord tireté qui
**propose un geste à faire**. Un geste ne se propose pas sur du papier, et le tableau juste
en dessous dit déjà qu'il n'y a rien. `_cuvDocGraph` garde donc le seuil et rend `''`.

⚠️ **Le compte porte sur les relevés qui ont une DATE ET UNE DENSITÉ** — le même filtre que le
tracé. Compter `mesures_fa` tout court ferait passer **trois prises de température seule** pour une
cinétique, et ferait ressortir l'état vide sur le papier. C'est la contre-épreuve n°15.

### 86d. ★★ LE HARNAIS EXISTAIT, VERT, ET N'ÉTAIT DANS AUCUN PIPELINE

`scripts/mv-harnais-cuvdoc.mjs` — 46 assertions, 10 contre-épreuves, écrit au lot des deux
documents du Cuvier — n'était **ni dans `check` ni dans `prebuild`**. Il ne tournait que si
quelqu'un pensait à le lancer à la main. ★★★ **Un filet qu'on doit se rappeler de tendre n'est pas
un filet** : c'est exactement la leçon de §83 sur la garde de base, et de §78 sur le seul filet
jamais joué. Il entre dans les deux pipelines, plus une commande `npm run test:cuvdoc` pour les
contre-épreuves, sur le modèle de `test:globaux`.

Ajoutées : **14 assertions** (la courbe existe, c'est bien le tracé de l'écran à 640 px, l'axe des
degrés est chiffré, les deux polylignes, un repère par opération, le seuil du vin sec, la légende,
l'encadré de limite, l'absence de courbe et surtout **l'absence d'état vide** sur une cuve sans
relevé puis sur une cuve à une seule densité) et **5 contre-épreuves**, toutes rouges.

★★★ **L'assertion qui compte** : pour **chaque** document produit, tout `var(--x)` présent dans le
corps doit être **déclaré dans le CSS de ce document**. Elle ne teste pas une couleur en
particulier — elle teste la **frontière** de §86b, et elle vaudra pour le prochain document qui
embarquera un tracé.

⚠️ **Et elle est VIDE sur le contrôle de maturité**, qui n'invoque aucune couleur. Le harnais le
**dit** — « aucune couleur invoquée — RIEN À VÉRIFIER ICI » — au lieu de laisser un vert compter
pour une couverture. *« Rien à vérifier » n'est pas « vérifié »* (§59e).

### 86e. Connu, non traité

`.cd-cuve` porte `mvdoc-avoid` : une cuve tient sur une page **ou** le navigateur passe outre. La
courbe ajoute ~330 px à chaque section ; une cuve à vingt relevés dépassera plus souvent l'A4 et se
coupera. Je ne change pas la règle de coupure dans ce lot : **je ne l'ai pas vue à l'impression**,
et §85c dit ce que vaut un réglage de mise en page décidé à l'aveugle. À trancher sur une feuille
sortie de l'imprimante, pas sur du code.

### 86f. La note de livraison

**Base : `494385f`.** Si `git rev-parse origin/main` ne rend pas ce SHA, **rejeu** (§83).
⚠️ `.mv-base` du dépôt était resté sur `ab77457` après l'intégration de §85 : ce lot le remet à
jour. Un fichier de base périmé désarme la garde au lieu de la tendre.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `MV_CUVDOC_CSS` (`:root` + légende papier), `MV_CUVDOC_GRW`, `_cuvDocGraph`, insertion dans `_cuvDoc`, encadré de limite | — |
| `src/utils.js` | 6.84, 1 item `WHATS_NEW`, `MV_AIDE` cave | ★ APP |
| `index.html` | 4 porteurs de version | ★ APP |
| `public/sw.js` | 7.43 : en-tête, `CACHE_NAME`, 2 `console.log`, changelog | ★ SW |
| `guide/08-cave.html` · `public/guide.html` | la courbe décrite là où le cahier l'est déjà (§27a) | — |
| `scripts/mv-harnais-cuvdoc.mjs` · `package.json` | +14 assertions, +5 contre-épreuves, câblé dans `check`, `prebuild`, `test:cuvdoc` | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 113 → 118 (⚠️ il en réclamait déjà 4 de plus) | — |
| `.mv-base` | `494385f` | — |

## 87. ★★ CUVDOC-2 — LE PALIER S'EXPLIQUE AUSSI (07/09 — APP 6.84 → 6.85 · SW 7.43 → 7.44 · base `494385f`)

> **Point de départ**, demandé par Nico dans la foulée de §86 : *« si c'est possible de rajouter sur
> le graph le moment de changement d'état de la cuve »*.

Le lot M3 avait posé les **opérations datées** sur la courbe, avec cette phrase en en-tête : *« la
seule remontée de la courbe s'explique par une chaptalisation ; sans les repères, personne ne peut
le voir »*. C'était vrai — et incomplet. **Une remontée s'expliquait, un PALIER non.** Cinq jours à
12 °C en macération préfermentaire ressemblent, sur un tracé de densité, à une fermentation qui
traîne. C'est le défaut de §81 vu depuis le graphe : *un statut n'est pas une date*, et une durée
qu'on ne date pas se lit sur la courbe comme un ralentissement.

### 87a. Le tracé

★ Chaque entrée de **`statut_hist`** (PARC-1) pose un **trait vertical gris tireté** sur toute la
hauteur du tracé, **nommé dans la marge haute** — la seule bande où il ne croise ni la courbe, ni la
température, ni les repères d'opération, posés 5 px plus bas. Le vocabulaire est celui de
`_vendStatLbl` : **MPF, FA, Décuvage, FML**, les mêmes mots que la frise et que la ligne « Parcours »
du cahier.

★★ **Le changement vit dans `_vendFermSvg`.** L'**écran** du Cuvier et le **cahier de cuverie** le
reçoivent d'un seul geste, puisque §86 a fait du document un lecteur de l'écran. *Une seule
modification, deux surfaces — c'est le bénéfice qu'on achète en refusant de redessiner.*

⚠️⚠️ **AUCUN RATTRAPAGE INVENTÉ.** Une cuve d'avant PARC-1 n'a pas de `statut_hist` : elle n'a
**aucun trait**. Rien n'est déduit de `date_entree`. *Un tiret se corrige, une date fausse se croit* —
la règle de §81 tient jusque dans le dessin.

⚠️ **Borné à la fenêtre du graphe**, comme les opérations. `X()` **ramène une date hors champ sur le
bord** : un décuvage postérieur au dernier relevé s'y collerait et se lirait comme un décuvage **au**
dernier relevé. Le parcours complet reste imprimé dans la ligne d'identité, trois lignes plus haut.

⚠️ **Deux passages trop proches ne s'écrivent pas l'un sur l'autre** : sous 34 px, le trait reste, le
nom part en légende. La légende, elle, les date **tous** en jours — c'est elle qui garantit que rien
n'est perdu quand la place manque.

### 87b. ★★★ UNE ASSERTION NEUVE A ROUGI, ET C'ÉTAIT ELLE QUI AVAIT TORT

Trois passages en trois jours, et j'avais écrit : *« un seul nom écrit, les autres partent en
légende »*. Le harnais a rendu **deux**. Réflexe de §80 — **demander d'abord lequel a tort, du test
ou du code** : c'était le test. Le curseur `_xEt` ne bouge que sur un nom **écrit**, donc le
troisième passage se mesure au **premier** — 47 px, aucun chevauchement. Le code avait raison
autrement que prévu.

★★★ **L'invariant n'est pas un COMPTE, c'est un ÉCART.** L'assertion lit désormais les abscisses des
libellés et exige que chaque écart tienne le seuil. *Un test qui fige un nombre observé interdit au
code d'avoir raison autrement*, et il rougit au premier changement de largeur — pour rien.

### 87c. La note de livraison

**Base : `494385f`.** ⚠️ **Ce lot REMPLACE la livraison §86** : `cave.js`, `utils.js`, `index.html`,
`sw.js`, le guide, le harnais et `CLAUDE.md` portent **les deux** lots. Si §86 a déjà été commité,
c'est **ce commit** qu'il faut écrire dans `.mv-base`, pas `494385f`.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_vendFermSvg` : traits d'état + libellés ; `_fermLegende(…, ets)` ; CSS `.mvfm-et` écran **et** papier | — |
| `src/utils.js` | 6.85, 1 item `WHATS_NEW`, `MV_AIDE` « Ce que porte la courbe » | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.44 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `public/guide.html` | la lecture de la courbe, écran et document | — |
| `scripts/mv-harnais-cuvdoc.mjs` | +13 assertions, +4 contre-épreuves (19/19 rouges) | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 118 → 119 | — |

## 88. ★★★ CUVDOC-3 — LE COMPARATIF, EN JOURS ET NON EN DATES (07/09 — APP 6.85 → 6.86 · SW 7.44 → 7.45 · base `494385f`)

> **Point de départ**, demandé par Nico : *« je voyais plus un graphique comparatif, avec tous les
> avancements et les densités qui évoluent, mais pas de date du premier septembre au dix septembre —
> plutôt jour zéro, jour un, jour deux. Pour voir celles qui partent plus vite, celles qui partent
> après. Pourquoi ? Est-ce que c'est une densité plus élevée, un taux de sucre ? Pourquoi pas même un
> comparatif avec les relevés faits lors des analyses avant vendange. »*

### 88a. ★★★ CE QUI CHANGE TOUT : L'AXE DES X COMPTE DES JOURS

Sur un calendrier, une cuve encuvée le 16 et une autre le 24 **n'ont aucun point commun** : leurs
courbes se croisent sans se comparer. Alignées sur **leur propre J0**, leurs cinétiques se
superposent, et la question de Nico devient lisible d'un coup d'œil.

⚠️ **J0 = `date_entree`, JAMAIS le premier relevé.** Deux origines différentes dans un même graphe,
ce sont deux échelles qui se ressemblent : une cuve mesurée trois jours après l'encuvage aurait
l'air d'avoir démarré plus bas. Une cuve **sans date d'encuvage est écartée**, et le document
**écrit combien il en écarte, et pourquoi**.

⚠️ Un relevé **antérieur** à l'encuvage est écarté de même. Ce n'est pas une cinétique, c'est une
saisie à corriger — et il ferait mentir la densité de départ. La contre-épreuve n°24 le prouve : le
départ passerait de 1100 à 1080.

### 88b. ★★★ LE CLASSEMENT NE SE FAIT PAS SUR LA VITESSE

Premier jet : trier par pente moyenne décroissante. **L'aperçu l'a démenti tout de suite** — une
cuve avec deux relevés sortait en tête à 12,8 points/jour, devant une cuve suivie dix jours à 10,8.

★★ **Une pente moyenne sur trois jours n'est pas comparable à une pente sur dix.** Le début d'une
fermentation en est la phase la plus rapide : une cuve à peine relevée gagnerait **toujours** le
classement du « qui part le plus vite ». Le tri se fait donc sur le **jour où 996 a été RELEVÉ** —
la seule grandeur qui mesure la même chose sur toutes les cuves. Les cuves qui n'y sont pas encore
ferment la marche, la plus avancée d'abord.

★ La colonne pts/j **reste**, mais elle **porte désormais son intervalle** (`10,8 J1–J10`) : le
chiffre ne peut plus être lu hors du temps sur lequel il a été mesuré. Et l'encadré de limite le dit
en toutes lettres. *Un rapport qui laisse tirer une conclusion fausse de ses propres chiffres est
pire qu'un rapport qui se tait.*

⚠️ **Le jour du vin sec est le jour OBSERVÉ**, jamais interpolé. Quand la cuve n'y est pas, la
colonne rappelle en italique son dernier point (`J3 · 1054`) au lieu d'inventer une projection.

### 88c. Le « pourquoi » : la vigne rejoint la cuve

Le tableau met côte à côte la **densité de départ**, le **sucre de départ**, le **degré potentiel**,
et le **sucre relevé à la vigne** — la dernière analyse d'avant encuvage de chaque parcelle de la
cuve, **pondérée par la surface** (une moyenne simple ferait peser 0,26 ha autant que 1,54 ha : même
règle qu'au contrôle de maturité, contre-épreuve n°22).

⚠️ **Bornée des DEUX côtés** : rien après l'encuvage (ce serait la vendange en cours, déjà rentrée —
contre-épreuve n°23), rien au-delà d'une campagne (ce serait l'an dernier).
⚠️ **La part réelle de chaque parcelle entrée dans la cuve n'est pas connue** : c'est un ordre de
grandeur, et le document l'écrit plutôt que de laisser croire à une mesure.

### 88d. Pas de légende : le nom au bout de la courbe

Une légende de douze cuves oblige à l'aller-retour entre une pastille et un trait. Chaque courbe
porte donc **son nom à son extrémité**, dans sa couleur, relié par un filet.

★ **Et les noms s'écartent.** Deux cuves finissent à la même densité — **le cas le plus banal,
puisqu'elles finissent toutes sèches** — et leurs noms tomberaient l'un sur l'autre. Sans ce
passage, le graphe **ment sur qui est qui** sans que rien ne le signale. Contre-épreuve n°25.

Six rôles de la charte servent de palette (`--terre`, `--vert-med`, `--bleu`, `--orange`,
`--phyto`, `--rouge`), en `var()` et non en hex — le document les déclare dans son `:root`, et
l'assertion de §86b vérifie qu'aucun n'y manque. Au-delà de six cuves, le trait passe en tireté.

### 88e. ⚠️ Ce comparatif n'existe QUE dans le document

§86 interdit de **redessiner** une courbe qui existe ailleurs. Ici il n'y en avait aucune à copier :
**l'écran n'a pas de comparatif**. Ce qui est partagé, c'est le **socle** — `_mvGraphCadre`,
`_mvGraphSvg`, les mêmes gouttières, les mêmes tailles, les mêmes rôles de couleur. Le jour où ce
comparatif monte sur un écran, il appellera `_cmpSvg`, **pas une seconde fonction**.

### 88f. Connu, non traité

`_vendDegrePot()` divise par **16,83 en dur** et ignore le `sucre_par_degre` des réglages, alors que
les écrans de vendange lisent tous la config. Le comparatif utilise donc `_vendSucre(d) / spd`, la
convention majoritaire — mais **deux définitions du degré potentiel coexistent dans le code**. À
unifier dans un lot dédié, pas en passant.

### 88g. La note de livraison

**Base : `494385f`.** ⚠️ **Ce lot REMPLACE les livraisons §86 et §87** : les fichiers portent **les
trois** lots. Si l'un des deux précédents a déjà été commité, c'est **ce commit** qu'il faut écrire
dans `.mv-base`.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_cmpSerie` · `_cmpVigne` · `_cmpSvg` · `_cmpBloc`, appel en tête de `_cuvDoc`, CSS `.cmp-*` papier, encadré de limite | — |
| `src/utils.js` | 6.86, 1 item `WHATS_NEW`, `MV_AIDE` cave | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.45 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `public/guide.html` | le comparatif et sa lecture | — |
| `scripts/mv-harnais-cuvdoc.mjs` | +12 assertions, +6 contre-épreuves (25/25 rouges) | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 119 → 120 | — |

## 89. ★★★ PILCRB-1 — LES COURBES DE LA CAVE, ET L'ÉCARTEMENT QUI SE DÉFAISAIT LUI-MÊME (07/09 — APP 6.86 → 6.87 · SW 7.45 → 7.46 · base `721f3ce`)

> **Point de départ**, demandé par Nico : *« dans pilotage cave je souhaite un module avec
> graphique, par exemple, un graphe avec toutes les densités des cuves ramenées à j=0 et pas à date.
> Le détail des températures, et ceci pour toutes les opérations d'élevage depuis la récolte ou
> analyse avant récolte jusqu'à la mise en bouteille. »*
> Maquette livrée, validée d'un « tout est ok », puis intégrée — avec **deux écarts assumés** que
> l'écriture du code a rendus nécessaires (§89e).

### 89a. ★★★ IL N'Y A PAS UN J0 UNIQUE — ET C'EST LA RÉPONSE À LA DEMANDE

La demande dit « depuis la récolte jusqu'à la mise en bouteille », et se lit comme **un seul axe**.
Elle n'en admet pas un seul. La vigne compte sur le **calendrier** ; la cuve compte depuis
l'**encuvage** ; le fût compte depuis l'**entonnage**. Ce sont trois événements distincts, séparés
de semaines, et la grandeur mesurée change à chaque fois — sucre, puis densité, puis malique.

★★ **Empiler trois origines sur un axe donne une échelle qui RESSEMBLE à une mesure sans en être
une.** L'écran pose donc **quatre blocs**, et chacun **écrit son zéro en toutes lettres à côté de
son titre** (`.pcrb-j0`). Le badge n'est pas décoratif : c'est lui qui empêche de lire deux graphes
sur la même échelle mentale.

### 89b. ⚠️⚠️⚠️ AUCUNE TEMPÉRATURE N'EST ENREGISTRÉE EN ÉLEVAGE

`temp_c` n'existe qu'à **quatre** endroits, tous en amont du décuvage : la température des raisins
au quai (`recoltes[]`), la cible de macération (`cuves_vinif[].mpf`), le relevé de fermentation
(`mesures_fa[]`), la cible d'une thermorégulation de cuverie (`operations[]`, INTR-1).

**Les opérations d'élevage n'en portent aucune** : ni `ouillage`, ni `soutirage`, ni `soufre`, ni
`analyse`. La demande « le détail des températures … jusqu'à la mise en bouteille » **ne peut donc
pas être satisfaite** sans un champ neuf à la saisie du Chai.

★★★ **L'écran le DIT, en clair, là où on le cherche** — dans le pied du bloc élevage, pas dans une
note de bas de page. *Un écran qui laisse chercher un graphe absent coûte plus cher qu'un écran qui
annonce son absence.* Décision prise avec Nico : **on n'ajoute pas le champ dans ce lot**. La
courbe s'arrête au décuvage, et l'écran l'assume.

### 89c. Ce qui est réutilisé, et ce qui est neuf

§86 interdit de **redessiner** une courbe qui existe ailleurs. Appliqué bloc par bloc :

| bloc | tracé | neuf ? |
|---|---|---|
| Maturités | `_cuvMatSvg` → `_vendMatSvg`, celui du Cuvier | non |
| Densités J0 | **`_cmpSvg`**, celui du cahier de cuverie | non — §88e le réservait |
| Températures J0 | `_cmpTempSvg` | **oui** |
| Malo par mois | `_pcrbElevSvg` | **oui** |
| Chaîne des volumes | `_caveBtlGraphSvg`, celui du Chai | non |

★★ **§88e tenait sa promesse** : *« le jour où ce comparatif monte sur un écran, il appellera
`_cmpSvg`, pas une seconde fonction »*. C'est exactement ce qui s'est passé, un lot plus tard.

★ **Les deux tracés neufs le sont pour la même raison** : il n'existait rien à copier.
`_vendFermSvg` trace bien une température, mais d'**une** cuve sur un axe de **dates**.
`_pcavMaloCourbe` trace bien la malo, mais **sans axe de temps** — ses barres sont espacées par
**rang**, si bien que deux analyses à six semaines d'écart et deux à trois jours y dessinent la
**même pente**. Ce n'est pas le même graphe redessiné, c'est l'information que l'autre ne porte pas.

### 89d. ★★★ LE HARNAIS A ROUGI, ET C'ÉTAIT LE CODE DE 6.86 QUI AVAIT TORT

L'assertion « aucun chevauchement entre deux noms » est sortie **rouge sur du code déjà en ligne**.
Réflexe de §80 — demander d'abord lequel a tort, du test ou du code. C'était le **code**.

`_cmpSvg` écartait bien les noms de 11 px, puis **rabattait sur le bord bas** celui qui dépassait :

```js
if(y > pT + ih + 8) y = pT + ih + 8;   // ← défait l'écartement qu'on vient de faire
```

**Mesuré**, trois cuves finissant toutes à 994 : **276,4 / 287,4 / 294,0**. Dernier écart **6,6 px
pour un texte de 10 px** — les lettres se chevauchent.

★★★ **ET LA CAUSE EST GÉNÉRALE, PAS MARGINALE.** La pile pousse vers le **bas** ; or les noms se
tassent en bas **précisément quand toutes les cuves finissent sèches** — c'est-à-dire le cas que
§88d appelle lui-même *« le plus BANAL, puisqu'elles finissent toutes sèches »*. Le plafond était
donc touché **dans le cas nominal**, et le graphe pouvait mentir sur qui est qui, sans rien
signaler. *§88d avait écrit la règle et posé, dans la même fonction, ce qui la défaisait.*

★ **Correction** : `_cmpEcarte(lbl, hMin, yLo, yHi)`, **une seule règle pour les trois tracés**.
Quand la pile déborde, elle **remonte en bloc** au lieu d'être rabattue — tous les écarts sont
préservés. Et quand même la remontée ne suffit pas (plus de noms que de hauteur), les écarts sont
**répartis également** : un tassement régulier se voit, deux noms superposés au hasard non.

⚠️⚠️ **J'AVAIS RECOPIÉ LE DÉFAUT DANS `_cmpTempSvg` AVANT DE LE TROUVER.** C'est l'argument même de
la règle partagée : *une copie propage la faute avant qu'on l'ait trouvée.*

### 89e. Les deux écarts par rapport à la maquette validée

⚠️ **Le bloc maturité reste sur un AXE DE DATES**, pas en « jours avant récolte » comme la maquette
le proposait. Deux obstacles apparus **à l'écriture**, donc postérieurs au « ok » : la date de
récolte d'une parcelle **n'est pas un champ** (elle se déduit des apports), et une parcelle **non
encore vendangée n'a aucun J0**. Le bloc aurait été **vide pendant tout août et la première
quinzaine de septembre** — exactement quand la question « laquelle vendanger d'abord » se pose.
*Un graphe qui se vide au moment où il sert ne sert pas.* Et le tracé existe déjà (§86).

⚠️ **Les séries d'élevage sont la MALO seule**, pas le sélecteur malique / SO₂ / AV de la maquette.
`_mlMesMalo` est la source unique du malique et elle existe ; SO₂ et AV n'ont pas d'équivalent, et
les écrire ici créerait **trois lectures d'`op.data` en parallèle de celle du Chai**. À faire dans
un lot dédié, avec le défaut de §89g réglé d'abord.

★ *Une maquette validée n'est pas exemptée de la règle « vérifier, ne pas croire ».*

### 89f. ⚠️ LES SOUS-ONGLETS AFFICHAIENT LE NOM DE LEUR ICÔNE

Trouvé en posant la quatrième sous-vue. `_pilTabCav` insérait `s[1]` **tel quel** :

```js
'>'+s[1]+' '+_pilEsc(s[2])+'</button>'   // s[1] est un NOM d'icône
```

Les trois boutons de **Pilotage › Cave** affichaient donc, en toutes lettres, **« chrono Ce qui
presse »**, **« raisin Le millésime »**, **« barrique Le parc »**. Les trois icônes existent dans le
sprite : personne n'avait oublié de les dessiner, on avait oublié de les **appeler**.

★ **`_pecSubNav`, la sous-nav voisine du MÊME fichier, fait `_mvIcon(s[1],16)` depuis toujours.** Le
bon geste était à quelques écrans de là. *Un défaut purement visuel ne déclenche aucune erreur, ne
casse aucun test, et survit à tous les passages de préflight : il ne se trouve qu'en regardant.*

### 89g. ⚠️ `av` SORTAIT SOUS UN NOM FAUX — TROUVÉ EN CHEMIN, CORRIGÉ DANS LE LOT

`generateCaveExport()` (`cave.js`) écrit **« Alcool : 0,42 % vol. »** pour le champ `av`, qui est
l'**acidité volatile en g/L** partout ailleurs : le libellé du formulaire (`index.html`), son
placeholder `ex. 0.42`, et les **trois** autres sites qui l'affichent (`_caveJDet`, la carte de
cuvée, le journal). **Un registre de cave qui exporte un chiffre sous un nom faux.**

★ **Confirmé par Nico — « c'est acidité volatile » — donc corrigé dans ce lot** : l'export dit
désormais `Ac. volatile: … g/L`, comme les quatre autres sites. *Le chiffre était juste ; c'est son
nom qui mentait, et un registre de cave se relit des années plus tard.*

★ **Et une seconde, trouvée dans la foulée** : la puce d'analyse écrivait `AV 0,42` **sans unité**,
collée à une puce `Malique 1,80 g/L` qui, elle, porte la sienne. *Deux nombres côte à côte, l'un
unité l'autre non, se lisent sur la même échelle.* Unité ajoutée.

⚠️ **Ce que ce lot NE corrige PAS** : les deux définitions du degré potentiel de §88f
(`_vendDegrePot()` divise par 16,83 en dur, le comparatif lit `sucre_par_degre`). Même famille —
une grandeur, deux vérités — mais c'est un lot dédié, pas un passage.

### 89h. La note de livraison

**Base : `721f3ce`.** ⚠️ `.mv-base` était resté sur `494385f` alors que §86, §87 et §88 sont
commités : la garde de base était **désarmée**. Remise à `721f3ce` dans ce lot.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_cmpEcarte` (partagé), `_cmpSeries` (tri extrait de `_cmpBloc`), `_cmpTempSvg`, pont `_cuvCmp*` + `_cuvMatSvg` | — |
| `src/pilotage.js` | 4ᵉ sous-vue `crb`, `_pcavVueCourbes` et sa famille `_pcrb*`, CSS `.pcrb-*`, pose via `_mvGraphSuivre`, **correctif `_mvIcon` de la sous-nav** | — |
| `src/utils.js` | 6.87, 3 items `WHATS_NEW`, `MV_AIDE` `pil.cav.courbes` (9 §) | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.46 + changelog | ★ APP · ★ SW |
| `guide/11-pilotage.html` · `public/guide.html` | la sous-vue, ses quatre zéros et la limite de température (§27a) | — |
| `scripts/mv-harnais-courbes.mjs` · `package.json` | 44 assertions, 12 contre-épreuves, câblé dans `check`, `prebuild`, `test:courbes` | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 120 → 121 | — |
| `.mv-base` | `721f3ce` | — |

---

## 90. ★★★ RDTMIL-1 — UN PLAFOND DE RENDEMENT APPARTIENT À UN MILLÉSIME, ET DEUX ÉCRANS PORTAIENT LE MÊME NOM (07/09 — APP 6.87 → 6.88 · SW 7.46 → 7.47 · base `4d5fc61`)

> **Point de départ**, signalé par Nico : *« impossible de rentrer des plafonds de rendement pour
> les millésimes »*, puis, capture à l'appui : *« il n'y a juste pas l'option »*.
> Sur la capture : **Pilotage › Cave › Le millésime**, 45 parcelles vendangées, les dix plus forts
> rendements, et sous chaque nom la même mention — **« plafond non renseigné »**, dix fois.

### 90a. ★★★ TROIS DÉFAUTS EMPILÉS, ET LE PLUS VISIBLE ÉTAIT LE MOINS GRAVE

La première réponse a été une piste morte : *« es-tu bien admin ? »*. **Nico est toujours en
admin** — c'est désormais écrit dans les règles de travail (§90g). Une question dont la réponse est
invariablement la même n'est pas un diagnostic, c'est un aller-retour perdu.

Le vrai diagnostic tenait en une observation : **l'écran de la capture n'est pas celui du renvoi.**

| | où | ce qu'il fait |
|---|---|---|
| **« Le millésime » du Pilotage** | `_PCAV_SUBS`, `pilotage.js` | lit, compare — **aucun `onclick`** |
| **« Le millésime » de la Cave** | `cave-sec-millesime`, `index.html` | onglet *La ligne de vie* → la saisie |

La carte disait : *« Posez-le une fois par parcelle **depuis Le millésime** »*. Nico lisait cette
phrase **depuis un écran qui porte exactement ce nom**.
★★★ **UN CHEMIN INCOMPLET ENTRE DEUX ÉCRANS HOMONYMES NE RENVOIE NULLE PART — il fait croire à une
option absente.** Le renvoi n'était pas faux : il était *indiscernable d'une promesse non tenue*.

### 90b. ★★★ LE FOND : `p.rdt_max` ÉTAIT UN SCALAIRE

Le rendement annuel autorisé est fixé **par arrêté, campagne par campagne**. Une parcelle n'a pas
UN plafond, elle en a **un par millésime**. Or le champ n'en portait qu'un : le poser depuis
l'écran d'un millésime **réécrivait 2025 et 2024**, en silence, sur un écran qui affichait pourtant
une année en toutes lettres.

C'est **§81 vu depuis la vigne** : *un champ qui n'a qu'une valeur ne peut pas porter une
histoire.* `p.rdt_max_hist` = `[{mil,max}]`, corrigeable ligne à ligne, même porte que
`statut_hist` et les relevés de CUV-1.

⚠️⚠️ **AUCUN RATTRAPAGE INVENTÉ.** L'ancien scalaire n'est **pas** recopié dans un millésime : on ne
sait pas de quelle campagne il vient. Il devient le **repli**, annoncé **« hérité »** partout où il
sert — écran de la Cave, carte du Pilotage, fiche `MV_INFO`. *Un chiffre daté d'office se croirait ;
un « hérité » se corrige.* Rien à ressaisir, et rien de faux affirmé.

⚠️ **`_vendSetRdtMax` n'écrit JAMAIS `p.rdt_max`.** L'écraser ferait disparaître le repli de **tous
les autres millésimes** en posant celui-ci. La contre-épreuve n°4 vérifie précisément ça.

### 90c. ★ LA CORVÉE EST UNE CAUSE, PAS UNE CONSÉQUENCE

Quarante-cinq parcelles, une saisie chacune, un chiffre identique dicté par un seul arrêté :
**ça explique à soi seul qu'aucun plafond n'ait jamais été renseigné.** Un écran peut être juste et
rester vide parce que le remplir coûte trop cher.

Après la **première** pose, `_mlRdtProposeGroupe` propose de porter la valeur sur les parcelles du
millésime qui n'ont **aucun** plafond.
⚠️⚠️ **Jamais celles qui en ont un, posé OU hérité** : on ne remplace pas en lot une valeur que
quelqu'un a mise. Et la proposition **NOMME** ce qu'elle va toucher (six noms puis « et N autres ») —
*« les autres » ne se vérifie pas avant de dire oui.*
★ Une seule écriture pour tout le lot, via `_vendParcLot` : 45 parcelles ne font pas 45 transactions
sur la collection la plus protégée de l'application.

### 90d. Une seule porte, deux appelants

`_mlSetRdtMax(nom, mil, apres)` — le droit admin, l'écriture et le format vivent **dans la Cave**.
Le Pilotage ne fait que l'appeler.
★★ **`apres` rend la main à l'appelant** : sans lui, poser depuis le Pilotage redessinait la Cave —
l'écran qu'on ne regarde pas. *Un geste partagé doit rendre la main à celui qui l'a déclenché, pas à
celui qui l'a écrit.*
⚠️ **Sans millésime résolu, aucun bouton et aucune saisie** : écrire un plafond « pour rien »
poserait une valeur sur une année que l'écran ne nomme pas. `data-rmil` porte l'année, `_pcavPoseRdt`
la revalide.
★ Le `<button>` du Pilotage **reste une grille** : `.pcav-pl` porte déjà `display:grid`, la règle
`button.pcav-pl` ne fait que retirer l'habillage natif. Redéfinir les colonnes créerait une seconde
vérité qui divergerait du palier mobile situé quarante lignes plus bas.

### 90e. ⚠️⚠️ CE QUE LE LOT A TROUVÉ EN CHEMIN, SANS LE CHERCHER

Le guide affirmait, en tête du Pilotage : *« Il ne modifie jamais rien »*. **C'était déjà faux avant
ce lot** — `_pexSetMois` écrit `CONFIG.eco.exercice_mois` depuis la frise annuelle depuis des
semaines. Et le guide de la Cave annonçait que Le millésime *« ne demande aucune saisie »* alors que
`p.rdt_max` s'y posait depuis §? *Une phrase de garantie vieillit moins bien qu'une phrase de
description : personne ne la relit, parce qu'elle rassure.* Les deux sont corrigées, et le guide dit
maintenant **quels** deux réglages se posent dans le Pilotage et pourquoi (c'est là qu'on voit qu'ils
manquent).

⚠️ **`.mv-base` était resté sur `721f3ce`** alors que §89 est commité (`4d5fc61`) : la garde était
désarmée, **pour la seconde fois en quatre lots** (§86, §89h). Remise à `4d5fc61`.
⚠️ **L'en-tête de `CLAUDE.md` annonçait encore APP 6.86 / SW 7.45** alors que le dépôt était en
6.87 / 7.46. L'en-tête décroche du corps — l'avertissement écrit plus haut dans ce document vaut
toujours : **se fier aux sections, pas au résumé.**

### 90f. Vérifications

`npm run check` **EXIT=0** · `node --check` sur les 4 JS touchés · harnais neuf
`mv-harnais-rdtmil.mjs` **52 vertes / 0 rouge**, **5 contre-épreuves** toutes rouges sur code cassé ·
`v7.46` subsiste **exactement une fois** dans `sw.js` (le changelog du lot précédent — piège §7) ·
les 3 noms d'icônes de `WHATS_NEW` (`balance`, `raisin`, `liste`) **existent dans le sprite**,
vérifié au grep sur `index.html` · guide régénéré, `build-guide.mjs --check` vert.

### 90g. ★ RÈGLE DE TRAVAIL AJOUTÉE

★ **Nico est TOUJOURS en admin.** Ne jamais lui demander de vérifier son rôle, ni proposer
« compte non admin » comme cause d'un symptôme. C'est une piste morte qui coûte un aller-retour à
chaque fois.

### 90h. La note de livraison

**Base : `4d5fc61`.**

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_vendRdtMax` · `_vendSetRdtMax` · `_mlRdtSansMax` · `_mlRdtProposeGroupe` · `_mlSetRdtMax(nom,mil,apres)` · `_mlGo('rdtmax')` · 4 textes de `_mlRenderVie` · 3 exports `window` | — |
| `src/pilotage.js` | `_pcavPoseRdt`, lignes `pcav-pl` en `<button data-rdtmax data-rmil>`, CSS `button.pcav-pl`, délégation `[data-rdtmax]`, **renvoi corrigé**, mention « hérité » | — |
| `src/utils.js` | 6.88, 3 items `WHATS_NEW`, `MV_INFO` `pil.cav.rdt` (+2 §, 1 réécrit), `MV_AIDE` cave (+3 points) | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.47 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `guide/11-pilotage.html` · `public/guide.html` | le plafond par millésime ; **deux garanties fausses retirées** (§90e) | — |
| `scripts/mv-harnais-rdtmil.mjs` (neuf) · `package.json` | 52 assertions + 5 contre-épreuves, câblé dans `check` et `prebuild` | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 121 → 122 | — |
| `.mv-base` | `4d5fc61` | — |

### 90i. ⚠️ Ce qui reste ouvert

- **Le plafond reste posé PARCELLE par parcelle.** L'arrêté, lui, vise une **appellation**. Il
  n'existe **aucun champ `appellation`** sur une parcelle (vérifié : ni dans `_parseKML`, ni dans les
  données de démo). La pose groupée est un contournement honnête, pas la bonne modélisation. Le vrai
  lot serait `p.appellation`, à traiter **avec** « import KML en MERGE » (§28) — sans quoi un
  ré-import l'effacerait.
- **`_mlRendements` écarte toujours en silence** une récolte dont le nom de parcelle n'est pas
  apparié (`if(!p) return;`). Le Cuvier le signale (§80), Le millésime non : une parcelle peut
  manquer du bloc « Rendement par parcelle » sans qu'une ligne le dise.
- **La pose groupée ne propose rien pour un millésime sans récolte** — le bloc entier n'existe pas
  dans ce cas. Un millésime antérieur au suivi du Cuvier (`ch.retro`) reste sans plafond possible.
- **Deux écrans s'appellent toujours « Le millésime ».** Ce lot rend le doublon inoffensif ; il ne le
  supprime pas.

---

## 91. ★★★ RDTAOC-1 — L'APPELLATION PORTE LE PLAFOND, ET « 0 hL/ha » N'ÉTAIT PAS UNE MESURE (07/09 — APP 6.88 → 6.89 · SW 7.47 → 7.48 · base `4d5fc61`)

> **Deux demandes de Nico**, dans le même message : *« fais le par appellation aussi (possibilité de
> fixer les appellations via réglages, domaine) »* et *« tu regarderas le problème dans millésimes,
> les chiffres des hL ne correspondent à rien (162 hL encore en cuve alors qu'à droite ça ne dit pas
> la même chose) »*.

### 91a. ★★★ UN ARRÊTÉ NE VISE PAS UNE PARCELLE

§90 avait posé le plafond **par millésime**, mais toujours **par parcelle** — et §90i le disait déjà :
*la pose groupée est un contournement honnête, pas la bonne modélisation.* 45 saisies pour un seul
chiffre, c'est aussi **45 endroits où il pourra diverger l'an prochain**.

`CONFIG.appellations = [{nom, rdt_max_hist:[{mil,max}]}]`, déclarées dans **Réglages › Domaine**.
Le rattachement est `p.appellation`, **le NOM et pas un identifiant** : il survit en clair à un
ré-import KML, et se relit dans un export sans table de correspondance.

⚠️⚠️ **Comparaison NORMALISÉE** (`_vendAocNorm`, §80) : `Gevrey-Chambertin` et `gevrey-chambertin  `
sont la même appellation. Comparer des noms bruts, c'est très exactement ce qui faisait disparaître
des parcelles sans un mot.

★★★ **L'ORDRE DE RÉSOLUTION EST DÉLIBÉRÉ** — `_vendRdtMax`, source unique :

| rang | source | `src` |
|---|---|---|
| 1 | la parcelle, pour ce millésime | `mil` |
| 2 | son appellation, pour ce millésime | `aoc` |
| 3 | l'ancien scalaire sans année | `herite` |

⚠️ **La parcelle passe AVANT l'appellation.** Un plafond posé à la main est une décision explicite de
quelqu'un ; la faire écraser par un réglage général reviendrait à **défaire une saisie sans le
dire**. Les deux écrans nomment désormais l'appellation d'où vient le chiffre.

★ **Renommer emmène les parcelles.** Sans report du nom sur `p.appellation`, renommer détacherait
toutes ses parcelles d'un coup, en silence : leur plafond passerait à « non renseigné » à l'écran
suivant. **Supprimer dit d'abord combien de parcelles perdront leur rattachement.**

⚠️ `CONFIG.appellations` est un **tableau** : il ne peut pas passer par `_ecoCfgSet`, dont la liste
blanche n'accepte que des nombres. Écriture dédiée, **mutation en place** — remplacer l'objet
`CONFIG` emporterait tout le reste.
⚠️ Habillage **inline**, comme la carte voisine `eco-conf-card`. Les classes `mvc-*` sont posées par
`_caveV2InjectCss` : arriver dans les Réglages **sans avoir ouvert la Cave** aurait rendu la carte
sans style.

### 91b. ★★★ « 0 hL/ha » SOUS UN BANDEAU QUI DIT 162 hL

Ce que Nico voyait, sur un seul écran :

| élément | valeur | d'où |
|---|---|---|
| bandeau | **162 hL en cuve** | `hlCuve` — estimation d'après les kilos |
| KPI « Rendement moyen » | **0 hL/ha** | `hlDecuve / ha` |
| parcelles, 30 px plus bas | **24 à 48 hL/ha** | fourchettes par parcelle |

`hlDecuve` ne compte que les cuves au statut `termine`. **Tant que rien n'est décuvé, il vaut zéro** —
et zéro divisé par 11,8 ha s'affichait `0`, avec l'aplomb d'un fait mesuré.
★★★ **UN ZÉRO SE CROIT ; UNE ABSENCE DE MESURE SE COMPREND.** C'est le même défaut que la fourchette
par parcelle corrigeait déjà en RDT-1, resté en place un étage plus haut.

⚠️⚠️ **Et il y avait DEUX définitions du « rendement moyen »** : le Pilotage divisait le volume
décuvé, le **bilan de campagne** (`_cuvDocCtx`) estimait d'après les kilos — `(kg/ha)/kgHl`, soit
~18 hL/ha sur les mêmes données. *Une grandeur, deux vérités, deux écrans, aucun des deux ne le
disait.* Motif §34i, jamais soldé de ce côté.

`_mlRdtMoyen(ch)` est désormais la seule définition. Elle additionne mesuré et estimé, et rend un
**statut** que les deux surfaces affichent : `≈` tant que tout n'est pas décuvé, « mesuré au
décuvage » quand il n'y a rien à annoncer.
⚠️ **Une seule cuve encore pleine suffit à rendre le total estimé** — même règle que par parcelle :
le volume de vin n'existe qu'au décuvage.
⚠️ Le document imprimé porte la réserve lui aussi : il se relit des années plus tard, **sans l'écran
à côté**.

### 91c. ⚠️ Le cliquet a mordu deux fois, et il avait raison deux fois

- **`catch {}` vide** (+1) : le repli de `_aocMils` avalait l'indisponibilité de la Cave. Une liste
  de millésimes vide ressemble à un domaine neuf. `logError({level:'info'})`.
- **Échelle des icônes** : `_mvIcon('crayon',14)`, `('corbeille',14)`, `('plus',15)` — hors de
  l'échelle 16/18/20/24/40. Ramenés à 16. Référence d'emojis regravée (`--baseline`, −1).

### 91d. Vérifications

`npm run check` **EXIT=0** · preflight **0 erreur / 0 avertissement** · `mv-harnais-rdtmil.mjs`
**80 vertes / 0 rouge**, 5 contre-épreuves rouges sur code cassé · `v7.47` subsiste exactement une
fois dans `sw.js` · icônes `etiquette`, `crayon`, `corbeille`, `plus`, `balance`, `document`
vérifiées au grep dans le sprite · guide régénéré, `--check` vert.

### 91e. La note de livraison

**Base : `4d5fc61`.** ⚠️ Ce lot s'empile sur **RDTMIL-1 (§90) non commité** : les deux se livrent
ensemble, `.mv-base` porte la base commune.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_vendAocNorm/List/De/Max`, `_vendRdtMax` à 3 rangs (+`aoc`), `_mlRdtMoyen`, bilan de campagne relié, 5 exports | — |
| `src/reglages.js` | carte **Appellations** (déclarer, plafond/millésime, renommer, supprimer, rattacher), `_aoc*` | — |
| `src/pilotage.js` | KPI « Rendement moyen » par `_mlRdtMoyen`, mention de l'appellation | — |
| `src/utils.js` | 6.89, 3 items `WHATS_NEW`, `MV_AIDE` cave (+1 point) | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.48 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `guide/12-reglages.html` · `public/guide.html` | l'appellation, l'ordre de priorité, le « ≈ » du rendement moyen | — |
| `scripts/mv-harnais-rdtmil.mjs` | 52 → **80 assertions** (blocs G, H, I) | — |
| `scripts/mv-icones-baseline.json` · `scripts/harnais-claude-md.mjs` | référence regravée · `SECTIONS` 122 → 123 | — |

### 91f. ⚠️ Ce qui reste ouvert

- **Le rattachement se fait parcelle par parcelle**, dans une liste déroulante. Pour 45 parcelles
  c'est long. Un rattachement en lot (« toutes celles dont le nom commence par… ») reste à faire.
- **Aucun contrôle de cohérence** : rien n'empêche de rattacher une parcelle de village à une
  appellation 1er cru. L'application ne connaît pas le cadastre viticole, et **inventer une règle
  qu'elle ne peut pas vérifier serait pire que ne rien dire**.
- **`p.appellation` n'est pas protégé d'un ré-import KML** — même dette que `p.commune` et
  `p.rdt_max` (§28). À traiter dans le lot « import en MERGE », pas avant.
- **Le rendement moyen rapporte le volume du domaine à la surface TOTALE récoltée**, part vendue en
  raisin comprise. Sur une parcelle vendue pour moitié, il sous-estime. Le calcul par parcelle, lui,
  gère les portions : les réconcilier est un lot en soi.
- **`_mlRendements` écarte toujours en silence** une récolte dont le nom de parcelle n'est pas
  apparié (§90i, inchangé).

---

## 92. ★★★ RDTMOY-1 — VENDRE SON RAISIN NE FAIT PAS BAISSER SON RENDEMENT (07/09 — APP 6.89 → 6.90 · SW 7.48 → 7.49 · base `4d5fc61`)

> **Nico, sur la correction de la veille** : *« Mais pour le moment rien de décuvé, je ne comprends
> pas. »* Il avait raison. **§91b était faux à son tour.**

### 92a. ★★★ TROISIÈME VERSION DU MÊME CHIFFRE, ET LA PREMIÈRE JUSTE

| | formule | sur la capture de Nico |
|---|---|---|
| v1 | `hlDecuve / ha` | **0 hL/ha** — rien de décuvé |
| v2 (§91b) | `(hlDecuve + hlCuve) / ha` | **13,7 hL/ha** |
| v3 | agrégat des mêmes parcelles que la liste | **20,3 hL/ha** |

`hlCuve` ne compte que le raisin **logé au domaine** : `_vendCuvKgDom`. Les **9 370 kg vendus sur
29 t** ne passent jamais en cuve. Ils sortaient donc du numérateur **en gardant leur surface au
dénominateur** — un tiers de la vendange manquant, et une moyenne qui contredisait la liste affichée
trente pixels plus bas (24 à 48 hL/ha).

★★★ **LE RENDEMENT D'UNE PARCELLE, C'EST CE QU'ELLE A PRODUIT, PAS CE QUE LE DOMAINE EN A GARDÉ.**
Le calcul **par parcelle** le disait depuis VD-3 : `o.hlHa = (vol.hl + vol.kgKo/kgHl) / s`, tout le
raisin, vendu compris. La moyenne, elle, menait sa vie à côté avec sa propre formule.
⚠️ *Deux calculs pour une seule grandeur finissent toujours par diverger.* Ici, d'un tiers — et
**deux corrections successives n'ont pas suffi** parce que les deux réparaient l'affichage sans
supprimer le second calcul. `_mlRdtMoyen` agrège désormais `_mlRendements` : par construction, la
moyenne tombe dans la fourchette de la liste.

⚠️⚠️ **Une parcelle SANS SURFACE apportait ses kilos au numérateur sans porter de dénominateur** :
elle gonflait le rendement du domaine entier. Écartée des deux côtés — et **comptée à l'écran**
(§80 : on n'écarte pas en silence).
⚠️ Le statut ne vaut `mesure` que si **toutes** les parcelles retenues le sont. Une seule estimation,
et la moyenne est une estimation.
⚠️ `_mlRendements` est rejoué alors que la carte du Pilotage l'appelle déjà. Assumé : un cache aurait
sa propre durée de vie, donc sa propre façon de mentir.

### 92b. ★ CE QUE CE LOT APPREND SUR LA MÉTHODE

§91b a **corrigé un symptôme visible** (« 0 hL/ha ») en gardant la cause (une seconde formule). Le
chiffre est devenu plausible — 13,7 au lieu de 0 — donc **plus difficile à contester**. Sans la
lecture de Nico, il passait.
★ **Un chiffre faux qui devient vraisemblable est plus dangereux qu'un chiffre faux qui saute aux
yeux.** Le test à poser d'emblée : *ce total est-il l'agrégat de ce que l'écran affiche juste à
côté ?* S'il ne l'est pas, il n'a pas à exister.

### 92c. Vérifications

`npm run check` **EXIT=0** · `mv-harnais-rdtmil.mjs` **86 vertes / 0 rouge**, 5 contre-épreuves ·
bloc H rejoue la formule **extraite de la source** sur un domaine calqué sur la capture (11,8 ha,
29 t dont 9 370 kg vendus, rien de décuvé) et vérifie que la moyenne **égale la moyenne pondérée des
hL/ha des parcelles** · `v7.48` subsiste exactement une fois dans `sw.js`.

### 92d. La note de livraison

**Base : `4d5fc61`.** ⚠️ S'empile sur §90 et §91, non commités : les trois se livrent ensemble.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_mlRdtMoyen` réécrit en agrégat, `d.rdtMoyenSs` | — |
| `src/pilotage.js` | KPI : sous-ligne des parcelles écartées | — |
| `src/utils.js` | 6.90, 2 items `WHATS_NEW` | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.49 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `public/guide.html` | l'agrégat, le raisin vendu, les parcelles écartées | — |
| `scripts/mv-harnais-rdtmil.mjs` | bloc H réécrit, 80 → **86 assertions** | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 123 → 124 | — |

### 92e. ⚠️ Ce qui reste ouvert

- **Le dénominateur reste la parcelle ENTIÈRE**, comme dans `_vendRdtParc` (choix assumé et
  documenté là-bas : le domaine travaille toute la vigne). Une parcelle vendue **en partie** compte
  donc sa surface entière — cohérent avec la ligne de la parcelle, mais à savoir.
- **La surface vient de `p.surface`**, pas de la surface réellement récoltée sur le millésime. Une
  parcelle arrachée en cours de campagne ou plantée à moitié fausse le rapport, sans qu'aucun écran
  le dise.
- Les points ouverts de §90i et §91f sont inchangés.

---

## 93. ★★★ RDTMOY-2 — LA SURFACE ACHETÉE ÉTAIT SAISIE, PERSONNE NE LA LISAIT (07/09 — APP 6.90 → 6.91 · SW 7.49 → 7.50 · base `4d5fc61`)

> **Nico** : *« On indique la surface vendue donc il faut se servir de cette info pour le calcul de la
> surface réellement récoltée. Si cette info n'est pas indiquée alors il faudra l'indiquer dans le
> calcul qu'il manque cette info pour un résultat juste. »*

### 93a. ★★★ QUATRIÈME VERSION, ET LA DONNÉE SAVAIT DEPUIS LE DÉBUT

| | formule | |
|---|---|---|
| v1 | `hlDecuve / ha` | 0 hL/ha |
| v2 (§91b) | `(hlDecuve+hlCuve) / ha` | 13,7 |
| v3 (§92) | tout le raisin / toute la surface | 20,3 |
| **v4** | **volume du domaine / surface réellement récoltée** | **le bon** |

⚠️⚠️ **`_vendSurfParc` déduisait DÉJÀ la part du domaine** : surface de la parcelle **moins les
surfaces achetées saisies** sur les portions vendues — c'est le cas `src:'reste'`, en place depuis
VD-3. **Trois corrections successives ont porté sur la formule sans jamais aller voir ce que la
donnée savait déjà.**
★ *Avant de changer un calcul, chercher si l'information manquante est déjà quelque part.* Elle
l'était, à deux fonctions de distance, avec son étiquette (`_vendSurfLbl` : « surface achetée »).

### 93b. ★★★ DEUX GRANDEURS DISTINCTES, ET ELLES DOIVENT LE RESTER

- **La ligne d'une parcelle** = tout son raisin / toute sa surface. C'est ce que **l'arrêté
  plafonne**, quel que soit l'acheteur. Inchangée.
- **La moyenne du domaine** = ce qu'il rentre / ce qu'il récolte. C'est **ce qui remplit sa cave**.

Elles coïncident quand les parcelles vendues rendent comme les autres, et divergent sinon — *ce qui
est une information, pas une incohérence*. §92 avait posé l'invariant « la moyenne est l'agrégat de
la liste » : il tombe ici, **délibérément**, et les deux écrans le disent.

### 93c. ⚠️ CE QUI MANQUE DOIT SE LIRE DANS LE CHIFFRE

`src:'reste-prorata'` = **plusieurs destinations sans surface achetée saisie** : le partage se fait
au prorata des kilos, ce qui **suppose un rendement identique partout**. Hypothèse, pas mesure.
Le chiffre sort quand même — refuser de répondre ne rend service à personne — mais **précédé d'un
« ≈ »**, et l'écran **compte les parcelles concernées** pour qu'on sache où compléter. Le document
imprimé porte la même réserve : il se relit sans l'écran à côté.
⚠️ Une parcelle où le domaine n'a **aucune** surface est écartée, et comptée séparément (§80).
⚠️ Une parcelle **entièrement vendue** (`dp.kg <= 0`) n'est ni comptée ni signalée : le domaine n'y
a rien récolté, ce n'est pas une information manquante.

### 93d. Vérifications

`npm run check` **EXIT=0** · preflight 0/0 · `mv-harnais-rdtmil.mjs` **90 vertes / 0 rouge**, 5
contre-épreuves · le bloc H rejoue la formule extraite de la source sur les cinq cas : surface
achetée déclarée, `reste-prorata`, `aucune`, part mesurée, parcelle 100 % vendue · `v7.49` subsiste
exactement une fois dans `sw.js` · icône `alerte` vérifiée dans le sprite.

### 93e. La note de livraison

**Base : `4d5fc61`.** ⚠️ S'empile sur §90, §91 et §92, non commités : les quatre se livrent ensemble.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | `_mlRdtMoyen` lit `d.surf.lignes` (part domaine) et `d.parts`, `approx`/`sansSurface`, `d.rdtMoyenAx`/`Ha` | — |
| `src/pilotage.js` | KPI : réserve nommée, « sur X ha réellement récoltés » | — |
| `src/utils.js` | 6.91, 2 items `WHATS_NEW` | ★ APP |
| `index.html` · `public/sw.js` | 4 porteurs · 7.50 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `public/guide.html` | les deux rendements, la réserve du prorata | — |
| `scripts/mv-harnais-rdtmil.mjs` | bloc H réécrit, 86 → **90 assertions** | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 124 → 125 | — |

### 93f. ⚠️ Ce qui reste ouvert

- **`_vendSurfParc` signale aussi `conflit` (deux surfaces achetées différentes pour un même
  acheteur), `depasse` (les surfaces achetées excèdent la parcelle) et `orphelin`.** Ces trois
  signaux existent et ne sont **remontés nulle part** dans la moyenne du domaine — un `depasse`
  rendrait pourtant la part du domaine négative, donc nulle, donc la parcelle écartée **sans dire
  pourquoi**.
- **La surface reste `p.surface`**, la surface cadastrale, pas la surface en production. Une parcelle
  arrachée en cours de campagne ou plantée à moitié fausse le rapport (§92e, inchangé).
- Points ouverts de §90i et §91f inchangés.

---

## 94. ★★★ CAVE-1 — LA CAVE S'OUVRE SUR AUJOURD'HUI, ET DEUX ÉCRANS DISAIENT LA MÊME CHOSE (09/09 — APP 6.91 → 6.92 · SW 7.50 → 7.51 · base `4124074`)

> **Point de départ**, Nico : *« j'ai l'impression que c'est un peu le bordel dans l'application
> entre les infos dans pilotage, les infos dans le cuvier, les infos un peu partout. »* Puis, sur la
> maquette : *« c'est parfait »*. C'est la phrase du Planning (§19a), prise par le bout de la Cave.
> Lot **①** d'une série de **cinq**, découpée sur la maquette validée le 08/09 :
> ① Aujourd'hui + bande commune + landing · ② Cuvier/Chai renommés, réglages vers ⚙ ·
> ③ Le millésime fusionné + carte Cave du Pilotage + migration `cav` · ④ La Réserve › Fûts reçoit
> « Le parc » · ⑤ ménage des trois blocs morts d'`index.html`.

### 94a. ★★★ LE DIAGNOSTIC, MESURÉ SUR LE CODE AVANT LA MAQUETTE

| Constat | Chiffre |
|---|---|
| Modules où vit une information de cave | **3** (Cave, Pilotage, Réserve) + Réglages › Domaine |
| Écrans / barres d'onglets | **13 / 5** |
| Même mot, deux écrans | « Le millésime » ×2 (§90i le disait) · **« Cuvier » dans « Le Cuvier »** · « Réglages » ×2 dans la Cave + le module · « Analyses » (maturité) / « Analyse » (labo) |
| Même question, deux écrans | « Ce qui vient » ≈ « Ce qui presse », **même moteur `_mlAgenda`** · « La ligne de vie » ≈ Pilotage › « Le millésime », **mêmes `_mlChaine` / `_mlRendements`** · les fûts à **3** endroits |
| Écrivains de `#cave-kpis` | **3** — `_mvcRenderHeader` (cuvées/fûts/hL/à ouiller, **suivant le filtre du Chai**), `_vendRefreshCockpit` (caisses/t/hL cuvés/en ferment.), `renderCaveMillesime` (fûts sem./à mesurer/en cuve/alertes). Trois bandes, trois sens, un seul en-tête |
| Blocs morts dans `index.html` | **3** (`#cave-view-cuv`, `#cave-view-journal`, `#cave-view-divers`) — jamais affichés, plus lus par aucun JS |

★★★ **La cause en une phrase** : la Cave a été rangée **par contenant** (Cuvier / Chai / Millésime), puis
le Pilotage s'est fabriqué une seconde cave rangée **par question** (ce qui presse / le millésime / le
parc / les courbes). Deux classements sur les mêmes moteurs → chaque information a deux adresses.
*Un mot porté par deux écrans ne renvoie nulle part* (§90a) ; c'est le même défaut, généralisé.

### 94b. Ce que le lot pose

- **`aujourdhui`**, quatrième section, **première dans la barre et écran d'arrivée** (`caveSection`
  par défaut). Verdict en tête, puis les quatre semaines en **trois blocs** (cette semaine, la
  suivante, les deux dernières ensemble), puis **« Sans échéance »**. Chaque ligne est **un** bouton
  vers le geste (`_mlGo`, kinds **`so2`** → opération soufre, **`fut`** → La Réserve › Fûts).
- ★★★ **`_mlAgenda` ne bouge pas** : `mv-harnais-agenda` l'extrait et l'exécute à l'identique. Ce que
  seul le Pilotage savait — **soutirage à faire, malo bloquée, doses de SO₂ programmées** — est
  **porté** dans cave.js (`_mlFinMalo`, `_mlMalo`, `_mlSo2Doses`) et vient **par-dessus**, dans
  `_mlAgendaComplet`. ⚠️ **Les copies du Pilotage (`_pcavMalo`, `_pcavSoutirages`, `_pcavFinMalo`)
  restent en place jusqu'au lot ③**, à l'identique de ce qui est porté. Deux définitions pendant
  deux lots : assumé, daté, et c'est le lot ③ qui les supprime avec l'onglet.
- **`_mlVerdict`** : la hiérarchie du Pilotage (§20g), **plus « N cuves à mesurer » juste après les
  alertes** — la maquette validée l'affiche en tête, et c'est ce que la barre d'état du Cuvier compte
  déjà : **pas de relevé depuis hier ou avant** (`_vendStale >= 1`), pas seulement les « due » à deux
  jours — vu au rendu, le verdict disait 1 quand la ligne du dessous disait 2. Ordre : contrôle (alerte FA, température, **malo bloquée**) › à mesurer › raisin sur pied (en
  vendange) › ouillage › soutirage › SO₂ cette semaine › fûts en fin de vie › « Rien ne presse ».
  ★ Un geste passe devant un rappel de date. ★ Le verdict compte des **cuves**, pas des lignes : une
  cuve qui ralentit ET chauffe en faisait deux.
- ★★ **Les fûts en fin de vie n'ont pas de date** : ils sont listés à part, jamais rangés dans une
  semaine choisie au hasard. *Une échéance inventée se croirait* (§20g, §90b).
- **`_caveHeaderRender` + `_caveKpisRender`**, appelés **une fois** par `renderCave` : titre « La Cave »,
  badge « Campagne N », et **quatre chiffres identiques sur les quatre onglets** — ≈ hL en cuve ·
  fûts en vin · à faire (lignes de la semaine) · t rentrées — avec leur **ligne de cadre**
  (`#cave-kpis-note` : « Millésime 2026 en cuve · 2025 au chai »). C'est la règle des quatre photos
  du Pilotage, appliquée à la Cave. ⚠️ **Conséquence assumée : la bande du Chai ne suit plus son
  filtre millésime** — elle est la photo de la cave entière, le filtre n'agit que sur la liste.
  Le millésime « en cuve » suit la règle de `_pcavCtx` : la campagne ouverte si elle a de la matière,
  sinon le millésime précédent (`_caveMilMatiere`).
- **« Ce qui vient » disparaît du millésime**, et `#ml-tabs-row` avec lui : *un onglet unique n'est pas
  un choix, c'est un décor* (§19a). `_mlSetTab` et `_mlRenderVenir` sont **supprimés** (C15), et
  `_mlEvHtml` est réécrit pour la nouvelle anatomie (icône du sprite, verbe à droite en `<span>`,
  jamais un `<button>` dans un `<button>`).
- **Visite guidée 17 h 15** et **chapitre démo** suivent : `selectCaveSection('aujourdhui')`,
  `sel:['#auj-body','#cave-view-auj','#page-cave']`.

### 94c. ⚠️⚠️ LE LOT A ÉTÉ CONSTRUIT EN DEUX TEMPS, ET LE SECOND A RELU LE PREMIER

La session a été coupée après le patch, avant la livraison. Le bac à sable avait gardé les fichiers
patchés. **Ils ont été relus comme le code d'un autre, diff par diff, avant d'en écrire une ligne de
plus** — règle d'or n°3, appliquée à mon propre travail. Quatre défauts trouvés à cette relecture et au rendu dans un navigateur :

1. **`renderCave` ne masque `#cave-view-mil` qu'après la branche `aujourdhui`** : venir du millésime
   laissait sa vue visible **sous** Aujourd'hui. `renderCaveAujourdhui` la masque lui-même.
2. **Le verdict comptait des lignes** (`n('alerte')+n('malo')`) là où il annonce des cuves.
3. **« Fûts en vin » lisait `parc.occupes`** : `_mvFutEnVin` ne lit que `tonneaux[]`, une cuvée
   d'avant le parc y a zéro fût. La bande compte comme Le Chai (`_caveNbTonneaux`).
4. **Le verdict ne comptait que les cuves « due »** (≥ 2 j sans relevé) quand la ligne de semaine et
   le Cuvier comptent dès hier — « 1 cuve à mesurer » au-dessus de « 2 cuves à mesurer ».

★ Et un troisième par le filet : `mv-harnais-info` ne cherchait les pastilles « i » que dans
`utils.js`, `pilotage.js` et `index.html` — la fiche `cave.auj`, posée depuis `cave.js`, sortait
« orpheline ». **Le corpus inclut désormais `cave.js`.** Un harnais qui ne regarde que là où les
pastilles ont toujours été ne voit pas la première posée ailleurs.

### 94d. Vérifications

`npm run check` **EXIT=0** · preflight **0 / 0** · harnais neuf **`mv-harnais-cave-auj.mjs`** — **46
assertions vertes**, **6 contre-épreuves** (ordre `||9`, soutirage antérieur acquittant, fenêtre SO₂ à
J+28, mesures devant les alertes, fûts datés, cuvée embouteillée suivie) toutes rouges sur code cassé,
câblé dans `check` et `prebuild` · `mv-harnais-agenda` inchangé et vert · `mv-harnais-info` **128**
vertes après extension du corpus · `harnais-demo` 144 vertes + 7/7 contre-épreuves (le point 17 h 15
et le chapitre « Aujourd'hui ») · `node --check` sur les 3 JS · `v7.50` subsiste exactement une fois
dans `sw.js` · les 2 icônes de `WHATS_NEW` (`chrono`, `graphique`) et les 10 de `_AUJ_ICO` existent
dans le sprite · guide régénéré, `--check` vert · `npm run build` EXIT=0 · **`test:smoke` OK** (boot,
23/23 globals, zéro exception) · ★ **l'écran rendu dans un navigateur headless** avec des données
injectées : bande, note de cadre, verdict, trois blocs, 10 boutons, zéro bouton imbriqué, zéro erreur
JS, la vue du millésime bien masquée après un aller-retour.
**Non vérifiable ici** : `test:e2e`, le déploiement.

### 94e. La note de livraison

**Base : `4124074`.** `.mv-base` livré avec le lot (il pointait encore sur `4d5fc61`).

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | section `aujourdhui` · `_mlFinMalo` · `_mlMalo` · `_mlSo2Doses` · `_mlParc` · `_mlPhase` · `_mlAgendaComplet` · `_mlSansDate` · `_mlVerdict` · `_aujRender` · `renderCaveAujourdhui` · `_caveHeaderRender` · `_caveKpisRender` · `_caveMilMatiere` · `_mlEvHtml` réécrit · `_mlGo` (`so2`, `fut`) · 3 écrivains de bande et 3 d'en-tête retirés · `_mlRenderVenir` et `_mlSetTab` supprimés · 6 exports `window` | — |
| `src/app.js` | visite 17 h 15 → Aujourd'hui · `_MVT_CHAPS` chapitre « Aujourd'hui », millésime relibellé « la ligne de vie » | ★ APP |
| `src/utils.js` | 6.92 · 2 items `WHATS_NEW` · `MV_AIDE` cave (+2 points, 2 réécrits) · `MV_INFO` `cave.auj` (5 §) | ★ APP |
| `index.html` · `public/sw.js` | onglet Aujourd'hui en tête, `#cave-view-auj`, `#cave-kpis-note`, `#ml-tabs-row` retiré · 4 porteurs · 7.51 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` | section « Aujourd'hui — ce qui presse », lead, Le millésime relu ; **`public/guide.html` à régénérer (`node scripts\build-guide.mjs`)** | — |
| `scripts/mv-harnais-cave-auj.mjs` (neuf) · `package.json` | 46 + 6 · câblé dans `check` et `prebuild` | — |
| `scripts/mv-harnais-info.mjs` | corpus + `cave.js` | — |
| `scripts/harnais-claude-md.mjs` | `SECTIONS` 125 → 126 | — |
| `.mv-base` | `4124074` | — |

### 94f. ⚠️ Ce qui reste ouvert — et ce que les lots ② à ⑤ doivent tenir

- **Pilotage › Cave existe encore**, avec ses quatre sous-onglets et ses copies de moteurs. Le lot ③ le
  remplace par une carte dans Aujourd'hui (une photo, un bouton) et migre `cav` → `auj` dans
  `_PIL_TAB_MIGR` ; C22 vérifiera qu'aucun fichier ne le demande plus. `_PIL_CAVSUB` (mémorisé chez
  les clients) devient une clé morte à ignorer.
- **Les fiches `pil.cav.*`** suivent leurs cartes au lot ③ (malo, ouillage, rdt, anges, courbes).
- **« Cuvier » dans « Le Cuvier », « Analyses »/« Maturités », les deux « Réglages »** : lot ②.
- **La bande** rend `hlCuve` (estimation d'après les kilos, marquée ≈) : quand une cuve est décuvée le
  volume mesuré ne s'y voit pas — c'est « Au chai » qui le porte. À réévaluer quand Le millésime
  fusionnera (lot ③), pour que la bande et l'écran du dessous disent la même chose.
- Points ouverts de §90i, §91f, §93f inchangés.

---

## 95. ★★★ CAVE-2 — UN MOT, UN ÉCRAN : LES ONGLETS DU CUVIER, ET UNE SEULE PORTE POUR LES RÉGLAGES DE LA CAVE (09/09 — APP 6.92 → 6.93 · SW 7.51 → 7.52 · base `4124074`, s'empile sur §94)

> Lot **②** de la série ouverte en §94 (« Suite », sans autre mot). ⚠️ **S'empile sur §94, non
> commité** : les deux se livrent ensemble, sur la même base.

### 95a. Ce que le lot corrige, mesuré en §94a

- **« Cuvier » dans « Le Cuvier »** — un sous-onglet qui portait le nom de sa section. Il s'appelle
  **Cuves**. **« Analyses »** portait les contrôles de maturité *à la vigne*, pendant que Le Chai a ses
  *analyses labo* : un mot pour deux choses. Il s'appelle **Maturités**. ★ **Les clés ne bougent
  pas** (`rec`, `cuves`, `ana`) : seuls les libellés, et l'ordre suit la vendange — Récoltes, Cuves,
  Maturités. Le chapitre démo « Contrôle de maturité » (`switchVendOng('ana')`) n'a rien à changer.
- **« Réglages » vivait deux fois dans la Cave** — un onglet du Cuvier (`param`), un onglet du Chai
  (`reglages`) — plus le module. Ce qu'on règle une fois l'an n'a rien à faire entre deux onglets du
  quotidien : **une roue crantée dans l'en-tête** (`#cave-hdr-gear`) ouvre une section **`reglages`
  SANS onglet** — la barre ne la montre pas, seule la roue l'ouvre — qui réunit les réglages du
  Cuvier, ceux du Chai, le renvoi vers les appellations, et les documents de la cave.

### 95b. ★★★ AUCUNE COPIE — les écrivains changent d'hôte, pas de définition

- `renderVendParam` écrit dans **`#cave-reg-cuvier`** (au lieu de `#mvv-body`) ; `renderCaveReglages`
  garde **`#mvc-body-reglages`**, dont le `<div>` a **déménagé** d'`#mvc-elevage` vers
  `#cave-view-reg`. Tous les appelants (`_caveSetSeuilMil`, le parc à cuves, `_vendSetRdtBase`,
  `_vpcAppliquer`…) continuent d'appeler les mêmes fonctions. `_vpcAppliquer` teste désormais
  `caveSection==='reglages'` pour savoir quel écran rafraîchir.
- **Les documents** : `_caveRegDocs` lit **`window.MV_DOCS`** (exposé par `reglages.js`, une ligne) et
  garde `mod==='cave'` + le bilan de campagne + l'inventaire des fûts ; chaque ligne appelle
  **`docsGo(i)`** avec l'index réel du catalogue. `cave.js` ne recopie **aucun titre** de document.
  ⚠️ **Décision assumée, contraire à une phrase du guide** (« jamais depuis le Cuvier lui-même : tout
  ce que Ma Vigne sait imprimer se trouve au même endroit ») : la roue est un **raccourci** vers le
  même catalogue, pas une seconde liste. Réglages › App › Documents & impressions reste l'endroit
  qui les a tous, et le guide le dit maintenant en ces termes.
- **Les appellations et leurs plafonds** sont un réglage du **domaine** : `_caveGoAoc` y va
  (`goTo('reglages')` → `switchReglTab('domaine')` → `#aoc-card` éclairé), même geste que `_pilGo`.
- **Tolérance** : `switchVendOng('param')`, `switchCaveOng('reglages')` et `('divers')` **ouvrent la
  roue** au lieu de viser le vide — un client (ou un vieux lien) qui les demande encore atterrit.

### 95c. Ce que le lot a fait sortir

- **Un harnais avait un bouchon d'état périmé.** `mv-harnais-poids-caisse` extrait `_vpcAppliquer` et
  posait `var _vendTab = 'param'` en prélude ; la fonction lit désormais `caveSection` →
  `ReferenceError` dans `prebuild`. Le prélude pose `caveSection='reglages'`. ★ Un bouchon décrit
  l'état du module au moment où le harnais a été écrit : quand le module change d'état, le bouchon
  ment en silence jusqu'à ce qu'une variable manque.
- **Une assertion du lot ① était trop littérale** : elle exigeait la liste exacte des quatre sections
  dans le filet de `renderCave`. Elle exige maintenant qu'`aujourdhui` y soit, en tête, et soit le
  repli — la liste peut s'allonger.
- **Trois textes d'écran** disaient encore « Réglages du Chai » (parc vide, cuve à déclarer) : ils
  disent « la roue crantée de la Cave, bloc Le Chai ». `MV_INFO` `pil.cav.ouillage` aussi.

### 95d. Vérifications

`npm run check` **EXIT=0** · preflight **0 / 0** · harnais neuf **`mv-harnais-cave-reglages.mjs`** —
**39 assertions**, dont 3 **exécutées** (`_caveRegDocs` sur un catalogue fictif : le filtre, l'index
réel, le catalogue absent), **6 contre-épreuves** rouges sur code cassé (tolérance retirée, `reglages`
remis aux ONGLETS, filtre sans bilan, `MV_DOCS` non exposé, la roue redevenue onglet, `renderVendParam`
revenu dans `#mvv-body`) · `mv-harnais-cave-auj` 52/52 · `mv-harnais-poids-caisse` 71 · `harnais-demo`
et contre · `npm run build` EXIT=0 · `WHATS_NEW` 6.93 exécuté (2 items, `engrenage`, `raisin`) ·
`v7.51` une fois dans `sw.js` · ★ **la roue rendue dans un navigateur headless** : les quatre blocs
peuplés, zéro erreur JS. **Non vérifié ici** : `test:e2e`, le déploiement.

### 95e. La note de livraison

**Base : `4124074`**, `.mv-base` inchangé. ⚠️ S'empile sur §94 : les deux lots se livrent ensemble.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | onglets du Cuvier · `switchVendOng`/`switchCaveOng` (tolérances) · section `reglages` · `_caveRegInjectCss` · `_caveOpenReglages` · `_caveGoAoc` · `_caveRegDocs` · `_caveRegDocsHtml` · `renderCaveReglagesCave` · hôte de `renderVendParam` · 3 textes · 3 exports | — |
| `src/reglages.js` | `window.MV_DOCS = MV_DOCS` | — |
| `src/utils.js` | 6.93 · 2 items `WHATS_NEW` · `MV_AIDE` cave (+2 points, 4 réécrits) · `MV_INFO` `pil.cav.ouillage` | ★ APP |
| `index.html` · `public/sw.js` | roue `#cave-hdr-gear` · `#cave-view-reg` (4 hôtes) · onglet et vue Réglages du Chai retirés · 4 porteurs · 7.52 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` | cartes Cuves / Maturités / Réglages, chemins, documents ; **`public/guide.html` à régénérer** | — |
| `scripts/mv-harnais-cave-reglages.mjs` (neuf) · `package.json` | 39 + 6 · câblé dans `check` et `prebuild` | — |
| `scripts/mv-harnais-cave-auj.mjs` · `scripts/mv-harnais-poids-caisse.mjs` · `scripts/harnais-claude-md.mjs` | assertion assouplie · bouchon `caveSection` · `SECTIONS` 126 → 127 | — |

### 95f. ⚠️ Ce qui reste ouvert

- **Lot ③** : Le millésime fusionné (La ligne de vie · Les courbes), la carte Cave du Pilotage,
  `cav → auj` dans `_PIL_TAB_MIGR`, suppression des copies `_pcavMalo`/`_pcavSoutirages`, fiches
  `pil.cav.*` → `cave.*`. **Lot ④** : La Réserve › Fûts reçoit « Le parc ». **Lot ⑤** : les trois blocs
  morts d'`index.html`.
- **`_PIL_CAVSUB` et l'onglet Pilotage › Cave** existent toujours (lot ③).
- Le bouton « Bouteilles » du Chai reste créé dynamiquement par `_caveEnsureBtlTab` après « Cuvées » :
  inchangé, mais c'est un onglet que la barre ne déclare pas en HTML.
- Points ouverts de §94f inchangés.

---

## 96. ★★★ CAVE-3 (+④) — L'ONGLET PILOTAGE › CAVE EST RENTRÉ DANS LA CAVE (09/09 — APP 6.93 → 6.94 · SW 7.52 → 7.53 · base `4124074`, s'empile sur §94 et §95)

> Lots **③ et ④** de la série (« Suite », puis « Go »), livrés ensemble parce que supprimer l'onglet
> obligeait à reloger **le parc** le même jour. ⚠️ **S'empile sur §94 et §95, non commités** : les
> trois se livrent ensemble, sur la même base.

### 96a. Ce que le lot fait, mesuré

- **Le bloc Pilotage › Cave** (lignes 5004 → 6531 de `pilotage.js` : **1 528 lignes, 69 fonctions**)
  est **rentré dans `cave.js`**, ses noms `_pcav*` / `_pcrb*` conservés (privés ; les harnais les
  extraient par leur nom). **Supprimé, pas ramené** — tout ce qui doublait Aujourd'hui et La ligne de
  vie : `_pcavVuePresse`, `_pcavVerdict`, `_pcavMalo`, `_pcavSoutirages`, `_pcavFinMalo`,
  `_pcavDernierSout`, les six blocs « ce qui presse », `_pcavFlux`, `_pcavRdt`, `_pcavRdtTxt`,
  `_pcavBandeau`, `_pcavMils`, `_pcavVueMillesime`, `_pcavPoseRdt`, `_pcavEtat`, `_pcavMouv`,
  `_pcavRow`, `_pcavSub`, `_pcavMaloCourbe`, `_pcavSeuilDe`, `_pcavMilsCave`, `_pilTabCav`,
  `_pilAvertCav`, `_pilDaysSince`. ★ **C15 (fonction morte) a servi de guide** : coupe → preflight →
  coupe, jusqu'à zéro. Puis un balayage « toute `_pcav*` a un appelant » (le harnais le grave).
- **Adaptations** du bloc : `_pcavCtx()` sans le `d` du Pilotage (seuil via `_caveSeuilGlobal`),
  `_pilEsc` → `_escHtml`, `_pilDfr` → `_mlFrC`, `_pilFillContent(_pilData())` → `renderCaveMillesime()`,
  emojis de cartes → sprite (`chrono`, `graphique`, `sablier`).
- **Le millésime a deux onglets** (`#ml-tabs-row` recréé) : **La ligne de vie** = `_mlRenderVie` +
  **`_mlTuiles(ch)` en tête** (surface récoltée, raisin rentré, rendement moyen via `_mlRdtMoyen`, au
  chai) + **`_pcavN1` en pied** ; **Les courbes** = `_pcavVueCourbes(c)` puis `_pcrbPose()` après la
  pose du HTML. ★ `renderCave` **oublie la famille de graphes** (`_mvGraphOublier('#pcrb-g-')`) dès
  qu'on n'est plus sur les courbes — la règle de `_pilAfterFill`, transposée.
- **Le parc** : `window._caveParcHtml()` = part des anges + pyramide, rendu **en tête de La Réserve ›
  Fûts**. ⚠️ **La Réserve portait déjà** l'état du parc (`_rsvParcHtml` : total, en vin, libres, à
  réformer, mouvements de l'année) et le registre des mouvements : `_pcavEtat` et `_pcavMouv` auraient
  été des doubles. Supprimés.
- **Pilotage** : `cav` retiré de `_PIL_TABS`, **`cav:'auj'` dans `_PIL_TAB_MIGR`**, `_PIL_CAVSUB` +
  `_pilLoadCav`/`_pilSaveCav` + les trois handlers de `_pilBindContent` + la branche de `_pilAfterFill`
  retirés. **Carte `Cave` dans Aujourd'hui** (`_pilCkCave`, panneau `auj_cave`, style `.pil-ck-btn`) :
  N à faire cette semaine, le verdict en une ligne, bouton « Ouvrir la Cave » → `selectCaveSection
  ('aujourdhui')`. Elle **lit** `window._mlVerdict` / `_mlAgendaComplet` — une seule définition.
  ★ **L'alerte ouillage de `_pilCkAlertes` est retirée** : seuil global (`d.ouAlerte`) là où la Cave
  applique le seuil de chaque millésime — c'était une seconde définition du retard. Le bloc s'appelle
  « Alertes matériel ».
- **Les fiches suivent leurs cartes** : `pil.cav.anges` → `cave.anges`, `pil.cav.courbes` →
  `cave.courbes`, `pil.cav.rdt` → **`cave.rdt` posée sur « Rendement par parcelle »** de La ligne de vie
  (texte réécrit : plus de « dix plus forts », plus d'homonymie) ; `pil.cav.malo` et `pil.cav.ouillage`
  n'ont plus de carte propre → **leurs paragraphes rejoignent `cave.auj`**, les clés disparaissent.

### 96b. ★★★ CE QUE LA COUPE A FAIT SORTIR

1. **`_pcavCard` testait `typeof _mvInfoBtn==='function'`** — vrai dans `pilotage.js` (importé), **faux
   dans `cave.js`** (pas importé) : la pastille « i » des cartes ramenées n'aurait **jamais rendu**, sans
   erreur. Passé par `window._mvInfoBtn`. ★ *Un `typeof` sur un import est une garde qui change de
   sens quand le code change de fichier.* Le harnais le grave, avec sa contre-épreuve.
2. **Un export pendant** : `window._pcavPoseRdt = _pcavPoseRdt;` avait survécu à la coupe de sa
   fonction → **`ReferenceError` au chargement du module**, donc la Cave entière. Trouvé par un balayage
   « tout `window.X = Y` a son `Y` défini », que le patch aurait dû faire d'emblée. ⚠️ Ce balayage a
   d'abord **retiré quatre exports légitimes** (`saveCaveOp`, `_attachPdfToOp`, `saveCaveAna`,
   `saveRetraitFut` : des `async function`, que mon regex `^function` ne voyait pas) — vus au `git diff`,
   remis à leur place depuis `HEAD`. ★★ *Un outil de nettoyage se relit au diff, jamais à son message
   de succès.*
3. **Trois harnais et un cliquet gravaient l'ancienne géographie** : `mv-harnais-courbes` extrayait la vue
   de `pilotage.js` ; `mv-harnais-rdtmil` exigeait la carte rendement du Pilotage et « la fiche prévient
   de l'homonymie » — l'homonymie n'existe plus ; `mv-harnais-info` cherchait `_pcavCard` et les fiches
   `pil.cav.*` dans le Pilotage ; `mv-harnais-echelle` gravait **huit** clés d'onglet et ne lisait le pas
   `hero` que dans `pilotage.js`. Tous repointés, et chacun dit pourquoi. ★ Le cliquet d'espacement a
   attrapé `padding:6px 10px` sur le bouton neuf : `4px 12px`, dans l'échelle.
4. **Le cliquet d'emojis par module** (26 → 30 sur `cave.js`) : le bloc déplacé en portait quatre. Sprite.

### 96c. ⚠️ Décisions assumées

- **Les noms `_pcav*` restent** dans `cave.js`. Une renommée de quarante fonctions n'aurait rien dit de
  plus et aurait cassé trois harnais d'extraction pour rien. La tête du bloc dit d'où il vient.
- **Le parc n'apporte à la Réserve que ce qu'elle n'avait pas** (anges, pyramide). La note « aucun euro
  n'est affiché » est partie avec `_pcavVueParc` d'origine.
- **`_pilCkAlertes` perd son alerte ouillage** sans remplacement local : la carte Cave du même écran
  porte le verdict, calculé par la Cave.
- **Le chapitre « Les courbes » du guide du Pilotage** est déplacé tel quel dans le guide de la Cave, sous
  Le millésime ; le guide du Pilotage garde un paragraphe « La Cave n'est plus un onglet du Pilotage ».

### 96d. Vérifications

`npm run check` **EXIT=0** · preflight **0 / 0** · harnais neuf **`mv-harnais-cave-mil.mjs`** — **39
assertions** (dont 2 exécutées : `_mlTuiles` sur une chaîne fictive et sans matière ; un balayage
« aucune `_pcav*` sans appelant »), **6 contre-épreuves** rouges sur code cassé (migration retirée, carte
qui recalcule, courbes sans `_pcrbPose`, Réserve sans parc, verdict recopié, pastille hors window) ·
`mv-harnais-cave-auj` 53/53 (deux assertions du lot ① mises à jour : la barre du millésime est revenue
avec deux onglets, `_mlSetTab('venir')` atterrit sur Aujourd'hui) · `courbes`, `rdtmil` (83), `info`,
`echelle` (29) repointés et verts · `npm run build` EXIT=0 · `WHATS_NEW` 6.94 exécuté (2 items, `verre`,
`graphique`) · `v7.52` une fois dans `sw.js` · ★ **rendu navigateur** : Le millésime › Les courbes,
La ligne de vie (tuiles + N-1), la carte Cave du Pilotage, La Réserve › Fûts, zéro erreur JS.
**Non vérifié ici** : `test:e2e`, le déploiement.

### 96e. La note de livraison

**Base : `4124074`**, `.mv-base` inchangé. ⚠️ S'empile sur §94 et §95 : **les trois lots se livrent
ensemble** ; les fichiers livrés sont l'état cumulé.

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | bloc `_pcav*`/`_pcrb*` (40 fonctions), `_mlTuiles`, `_mlSetTab`, `_caveParcHtml`, deux onglets du millésime, oubli des graphes, fiches `cave.*`, pastille via window, 2 exports | — |
| `src/pilotage.js` | −1 528 lignes · onglet `cav` retiré, migration `cav:'auj'`, `_pilCkCave` + `auj_cave`, `_pilCkAlertes` sans ouillage, texte « renouvellement » → La Réserve › Fûts | ★ APP |
| `src/reserve.js` · `src/styles.css` | `_caveParcHtml()` en tête de Fûts · `.pil-ck-btn` | — |
| `src/utils.js` | 6.94 · 2 items `WHATS_NEW` · `MV_AIDE` cave / pilotage (« sept onglets ») / réserve · `MV_INFO` `cave.anges`, `cave.courbes`, `cave.rdt`, `cave.auj` enrichie, `pil.cav.*` retirées | ★ APP |
| `index.html` · `public/sw.js` | `#ml-tabs-row` (vie · crb) · 4 porteurs · 7.53 + changelog | ★ APP · ★ SW |
| `guide/08-cave.html` · `11-pilotage.html` · `09-reserve.html` · `12-reglages.html` | Le millésime à deux onglets + chapitre « Les courbes » déplacé · « La Cave n'est plus un onglet du Pilotage », sept onglets · parc en tête de Fûts · un seul écran ; **`public/guide.html` à régénérer** | — |
| `scripts/mv-harnais-cave-mil.mjs` (neuf) · `package.json` | 39 + 6 · câblé dans `check` et `prebuild` | — |
| `scripts/mv-harnais-cave-auj.mjs` · `mv-harnais-courbes.mjs` · `mv-harnais-rdtmil.mjs` · `mv-harnais-info.mjs` · `mv-harnais-echelle.mjs` · `harnais-claude-md.mjs` | repointés · `SECTIONS` 127 → 128 | — |

### 96f. ⚠️ Ce qui reste ouvert

- **Lot ⑤** : les trois blocs morts d'`index.html` (`#cave-view-cuv`, `#cave-view-journal`,
  `#cave-view-divers`).
- **`_PIL_CAVSUB`** reste une clé `localStorage` chez les clients (`mavigne_pil_cav_*`) que plus rien ne
  lit : inoffensive, jamais nettoyée.
- **`d.ouAlerte`** est encore calculé par `_pilData` sans lecteur.
- Le bouton « Bouteilles » du Chai (§95f) et les points ouverts de §94f inchangés.

---

## 97. CAVE-5 — MÉNAGE : LA CAVE D'AVANT LE CHAI DORMAIT DANS `index.html` (09/09 — APP 6.94 → 6.95 · SW 7.53 → 7.54 · base `4124074`, s'empile sur §94, §95, §96)

> Lot **⑤**, le dernier de la série ouverte en §94. Aucun effet visible ; c'est le point de la maquette
> validée le 08/09 qui disait « trois blocs morts ». ⚠️ **S'empile sur §94–§96, non commités** : les
> quatre lots se livrent ensemble, sur la même base.

### 97a. Ce qui dormait, mesuré (§94a)

- **`#cave-view-cuv`** (avec `#cave-cuv-body` et un FAB « Nouvelle opération »), **`#cave-view-journal`**
  (chips de filtre, zone d'import, `#cave-ana-input`, FAB), **`#cave-view-divers`** (alerte d'ouillage à
  7/14 jours, convertisseur SO₂) : **52 lignes** d'`index.html`, la Cave d'avant Le Chai. **Aucun JS ne
  lisait ces ids** ; `renderCave` les masquait à chaque rendu par la liste `['cuv','journal','divers',…]`.
  `#cave-view-cuv` était même `display:block` en dur — masqué au premier rendu, jamais vu.
- **Ce que le retrait a entraîné, vérifié appelant par appelant** : `setOuillageAlerte` +
  `_caveOuillageRefresh` (seul le bloc `divers` les appelait ; le seuil d'ouillage se règle depuis
  longtemps dans la roue crantée, par millésime) → **supprimés** avec leur export. `setCaveJFilter`,
  `_onCaveAnaFileChange`, `openOvCaveAna`, `openOvCaveOp`, `openOvCaveConvert` **restent** : le Journal du
  Chai a ses propres chips `.mvc-jf` et son propre `#mvc-ana-input`. Six règles CSS (`.cave-fab*`,
  `.cave-jf-btn*`, `.cave-divers-*`) retirées, et deux sélecteurs sortis de la règle de thème.
- Les listes de masquage ne citent plus `cuv`, `journal`, `divers` (4 sites).

### 97b. Vérifications

`npm run check` **EXIT=0** · preflight **0 / 0** · `mv-harnais-cave-auj` **57/57** (+4 : les blocs ne
reviennent pas, les listes sont propres, le couple mort a disparu, **l'import d'analyse PDF vit toujours
par le Journal du Chai**) · `WHATS_NEW` **6.95, un item** (`mv-whatsnew-check` refuse un bloc de tête vide : « depuis 6.94 → le
seul bloc 6.95 » ; l'item dit qu'il n'y a rien à voir) · `v7.53` une fois dans `sw.js` · `npm run build` EXIT=0.

### 97c. La note de livraison

**Base : `4124074`**, `.mv-base` inchangé. Livré dans l'état cumulé §94 → §97.

| fichier | ce qui change | bump |
|---|---|---|
| `index.html` · `public/sw.js` | 3 blocs morts retirés (52 lignes) · 4 porteurs · 7.54 + changelog | ★ APP · ★ SW |
| `src/cave.js` · `src/styles.css` · `src/utils.js` | listes de masquage · `setOuillageAlerte`/`_caveOuillageRefresh` retirés · 6 règles CSS · 6.95, un item `WHATS_NEW` | — |
| `scripts/mv-harnais-cave-auj.mjs` · `scripts/harnais-claude-md.mjs` | +4 assertions · `SECTIONS` 128 → 129 | — |

### 97d. La série CAVE, en une ligne chacune

① Aujourd'hui, écran d'arrivée, bande et en-tête uniques (§94) · ② un mot, un écran, une roue crantée
pour les réglages (§95) · ③+④ l'onglet Pilotage › Cave rentré dans la Cave, le parc à la Réserve (§96) ·
⑤ le ménage (§97). **Mesuré au départ : 3 modules, 13 écrans, 5 barres, 4 homonymes. À l'arrivée : la
Cave et la Réserve, 8 écrans, 4 barres, 0 homonyme** — et une carte dans le Pilotage.

## 98. ★★★ NAV-1 — LA ROUE CRANTÉE DES MODULES : UN MODULE RÈGLE SES AFFAIRES CHEZ LUI (09/09 — APP 6.95 → 6.96 · SW 7.54 → 7.55 · base `f79891c`)

> Lot **①** d'une série ouverte par un audit mesuré (NAV-0 : `audit-ux-navigation.md` + `maquette-nav.html`,
> 8 écrans cliquables, livrés le 09/09). Commande : « améliore la navigation, l'expérience, la cohérence des
> réglages ». Même méthode que la Cave (§94) : **mesurer sur le code, maquetter, puis un lot par règle.**

### 98a. Ce que le code disait (NAV-0)

| Constat | Mesure |
|---|---|
| Endroits où l'on règle quelque chose | **6** — Réglages (5 onglets) · Cave ⚙ · Planning › Le cadre · Pilotage › Outils › Paramétrage · « Choisir les indicateurs » · Accueil (appui long) |
| Mots pour « réglage » | **3** — Réglages · Paramétrage · Le cadre |
| Portes vers un document | **3** — Réglages › App · Cave ⚙ · un bouton d'export **dans la barre d'onglets** du Phyto — plus **9** renvois « Réglages, onglet App » dans `MV_AIDE` |
| Bouton 🏠 (`goHub`) dans l'en-tête | **11 / 11** pages ; sur l'Accueil, il envoie l'admin au Pilotage (`_landingPage`) |
| Titre d'en-tête ≠ mot du dock | **3** — Vigne (Accueil / Mes Parcelles / Journal), Cave, Réserve |
| `CONFIG.eco` | **2** écrans de saisie (Réglages › Domaine et Pilotage › Paramétrage) |
| Aide qui dit faux | fiche Pilotage point 1 (« rien ne se saisit ici ») · guide Réglages (simulateur situé dans Domaine) |

**La cause en une phrase** : quatre patrons pour ranger un réglage — la Cave chez elle (§95), la Vigne et
le Tracteur dans un autre module, le Planning dans un onglet du quotidien, le Pilotage derrière « Outils ».
C'est §94a, généralisé. **Six règles cibles** : ⚙ sur chaque module (réglages + documents) · Réglages =
Domaine · Équipe · Moi · un document se prend dans la roue du module qui le produit · un seul mot,
« Réglages » · une seule sortie par en-tête · l'aide corrigée dans le lot qui touche l'écran.

### 98b. Ce que le lot fait — et ce qu'il a trouvé en le faisant

- **Reparenté, pas recopié.** `#regl-view-vigne` (tâches & barème, plantations, secteurs météo) et
  `#regl-view-tracteur` (parc, activités, chrono) quittent `#page-reglages` pour deux feuilles
  `.overlay > .modal` posées avant `#page-chat` : **mêmes id, mêmes écrivains** (`renderReglages`,
  `renderTracteurSet`, `renderActTracList` n'ont pas bougé d'une ligne). `_mvReglOpen(mod)` (app.js,
  devant `_dockDef`) refuse un non-admin, rappelle `renderReglages()` pour remplir, rend le bloc
  Documents, puis `openOv`. Registre `_MV_REGL` ; la roue est `class="mod-home-btn mv-regl-gear"`,
  visible admin seulement (`_mvReglSync` depuis `applyRoles`).
- **Les documents du module** : `MV_DOCS` filtré par `d.mod`, une ligne `.set-row` par document,
  `docsGo(i)` avec **l'index du catalogue** (contre-épreuve : l'index de la liste filtrée rougit). Les
  quatre documents `mod:''` de la vigne (vignoble, saison, csvJournal, csvParcelles) portent maintenant
  `mod:'vigne'` — ce qui les grise, comme les autres, chez qui la Vigne est masquée. « Tous les
  documents » renvoie au catalogue de Réglages › App, sans argument dans l'`onclick` (C24b a rougi sur
  la première version, qui interpolait `mod`).
- **Réglages 5 → 3** (`switchReglTab` ne connaît que `domaine`, `equipe`, `app`), `mvu-tabs-many`
  retiré, bande `#regl-kpis` retirée avec ses trois écrivains. « App » garde son nom **pour ce lot** :
  le renommage en « Moi » touche neuf textes, il attend NAV-6.
- ⚠️⚠️ **LE BOUTON 🏠 PORTAIT LE VOYANT DE SYNCHRO.** `_syncEnsureDots` insérait le point
  « synchronisé / hors ligne / N en attente » *devant chaque bouton `goHub`*. Retirer les dix boutons sans
  le lire aurait fait disparaître l'indicateur hors-ligne de dix écrans, sans erreur et sans test. Il
  s'ancre désormais en **fin de `.mod-header-top`** — même place visuelle. *Un bouton qu'on retire, on lit
  d'abord qui s'y accroche.* Deux variantes trouvées au passage : le Planning avait un `&#x2302;` texte
  au lieu du SVG (une ancre unique aurait laissé sa maison), et le Pilotage un `#pil-back` à lui — sans
  voyant de synchro, ce qui était déjà une incohérence. Le seul `goHub()` restant dans `index.html` est
  celui du panneau GT ; la fonction reste (login, retour de démo).
- **Titre « Vigne »** sur les trois pages, icône `feuille` sur les trois ; les sous-titres (`#hv2-header-sub`,
  `#p-saison-sub`, `#j-sub`) sont inchangés. Les fiches `MV_AIDE` gardent leur titre par écran.
- **Les renvois suivent** : `_PIL_DIAG_CIBLES` (taches, dens, secteurs → `['home','vigne',id,'_mvReglOpen']`,
  tracteurs → `['tracteur',…]`) via le 4ᵉ élément déjà prévu par §info ; les libellés `ou:` disent « Roue
  crantée de la Vigne › … » ; `_dmrGo('vigne')` (Mise en route) ouvre la roue ; le chapitre de démo
  « Réglages » atterrit sur Domaine et dit où sont les autres.
- **Différé et dit** : conso GNR et IFT de référence restent dans Réglages › Domaine › Économie &
  conformité (NAV-4 les emporte avec Paramétrage). La roue de la Cave reste une **section** (§95), celle
  de la Vigne et du Tracteur une **feuille** : même geste, deux anatomies — à unifier en NAV-6 si la
  feuille tient à l'usage (les blocs de la Vigne ouvrent eux-mêmes des feuilles : `ovTache`, écartements,
  communes — elles s'empilent au-dessus, et reviennent sur la roue à la fermeture).

### 98c. Accompagnement (règle n°4)

`MV_AIDE` : Accueil (+ la roue), Parcelles et Journal (documents → roue), Tracteur (chrono → roue,
carnet → roue, + la roue), Réglages (le premier point dit ce qui reste ; « Onglet Vigne » remplacé par
« Les réglages de la Vigne et du Tracteur ne sont plus ici »). Guide : **04** reçoit le bloc Vigne de 12
(+ un `<h3>` roue), **06** le bloc Tracteur (+ roue), **12** passe à trois onglets et corrige au passage
« paramètres du simulateur » (ils sont dans Pilotage › Paramétrage, pas dans Domaine), **13** nomme les
roues, **05** et **14** : cinq chemins « Réglages › Vigne › … » → « Vigne › {ic:engrenage} › … » ;
`demarrage.html` une ligne. ⚠️ Le caractère ⚙ dans un texte du guide **compte comme un emoji** pour
`mv-harnais-icones` (cliquet par surface) : écrire `{ic:engrenage}`, jamais ⚙. `WHATS_NEW` 6.96 : trois
items (la roue, les documents, Réglages à trois onglets et la sortie unique).

### 98d. Vérifications

`npm run check` **EXIT=0** · preflight **0 erreur** · `mv-harnais-regl-module` **73/73** dont **11
contre-épreuves** (bloc recopié, onglet Vigne revenu, compteurs revenus, maison revenue, voyant sur goHub,
roue ouverte à un ouvrier, index de liste au lieu d'index de catalogue, titre non échappé, cible du
Pilotage dans Réglages, `mod:''` oublié, fiche qui renvoie dans Réglages › App) · `mv-harnais-info`
**130/130** (l'assertion « les sept cibles gardent trois éléments » gravait l'ancien monde : réécrite en
deux — les deux restées dans Réglages, les quatre qui ouvrent une roue) · `WHATS_NEW` exécuté en Node
(6.96, 3 items) · `v7.55` cinq fois dans `sw.js` · guide régénéré (`build-guide --check` vert) ·
`npm run build` EXIT=0.

### 98e. La suite (après validation à l'usage)

**NAV-2** Planning : « Le cadre » quitte `#plan-tabs` pour la roue (`_PLAN_TAB_MIGR.cadre → mois`).
**NAV-3** Pilotage : Paramétrage + « Choisir les indicateurs » → roue ; « Outils » disparaît, Archives = 8ᵉ
onglet après le filet ; IFT et conso GNR quittent Réglages › Domaine ; fiche point 1 réécrite.
**NAV-4** Documents : roue sur Phyto (le bouton CSV quitte `#phyto-tabs-row`) et Réserve ; les
renvois restants (Planning ×2, Cave ×1). **NAV-5** Vocabulaire : « Paramétrage » et « Le cadre » bannis
(`lint-vocabulaire`), « App » → « Moi », titres d'en-tête = mots du dock (« Cave », « Réserve » — à
trancher), casse « Le Millésime », `#page-chat` (§51 — à trancher).

### 98f. La note de livraison

**Base : `f79891c`**, `.mv-base` mis à jour. Fichiers : `index.html` (racine), `src/app.js`,
`src/reglages.js`, `src/pilotage.js`, `src/reserve.js`, `src/utils.js`, `public/sw.js`,
`public/demarrage.html`, `guide/04-vigne.html`, `guide/05-saisons.html`, `guide/06-tracteur.html`,
`guide/12-reglages.html`, `guide/13-donnees.html`, `guide/14-depannage.html`,
`scripts/mv-harnais-regl-module.mjs` (nouveau), `scripts/mv-harnais-info.mjs`,
`scripts/harnais-claude-md.mjs`, `package.json`, `.mv-base`, `CLAUDE.md`. Puis `node scripts/build-guide.mjs`
(régénère `public/guide.html`, non livré), `npm run build && firebase deploy`.

## 99. NAV-2 — LE CADRE DU PLANNING EST DANS LA ROUE CRANTÉE (09/09 — APP 6.96 → 6.97 · SW 7.55 → 7.56 · base `f79891c`, s'empile sur §98)

> Lot **②** de la série ouverte en §98 (« suite », sans autre mot). Même règle : un module règle ses affaires
> chez lui. ⚠️ **S'empile sur §98, non commité** : les deux lots se livrent ensemble, sur la même base.

### 99a. Ce qui bouge

- **« Le cadre » n'est plus un onglet.** La fiche le disait elle-même : *« ce qui se règle une fois par
  an »* — un réglage annuel n'avait pas sa place à côté du mois. Le bouton `data-tab="cadre"` quitte
  `#plan-tabs` (deux onglets admin : Le mois, Les gens ; l'ouvrier n'en a toujours aucun). La roue
  `_mvReglOpen('planning')` est sur l'en-tête, après le badge.
- **Le même code sert la feuille** : `_planRenderCadre` et `_planRenderGridEditor` (l'éditeur de modèle
  de semaine, qui se rend au même endroit) écrivent dans `_planCadreHost()` = `#plan-cadre-host` (dans
  `#ovReglPlanning`) avec **repli sur `#plan-body`** — les treize appelants (`planSavePause`,
  `planSaveCoupure`, `planOpenGridEditor`, `planDeleteTemplate`…) n'ont pas bougé. `_planCadreOpen()`
  (exposé) remet `_planEditing=null` puis rend : la roue s'ouvre toujours sur la liste, jamais sur un
  éditeur laissé ouvert à la fermeture précédente. `_mvReglOpen` branche : `planning → _planCadreOpen`,
  sinon `renderReglages`.
- **Personne ne voit le vide** : `_PLAN_TAB_MIGR.cadre → 'mois'`, `templates → 'mois'` (était `→ 'cadre'`),
  `_PLAN_VALID_TAB` sans `cadre`, `planSwitchTab('cadre')` ouvre la roue. Les deux branches
  `planTab==='cadre'` de l'en-tête et du corps sont retirées (mortes).
- ⚠️ **QUATRE DOCUMENTS DU PLANNING SONT DES VOLETS DU HUB.** `docsGo(i)` pour `mois`, `releve`,
  `annuelNom`, `etp` ne génère rien : il *change de volet* dans `#ovDocs` (`_docsPane`, `_docsReleveOpen`,
  `_docsPlanNomOpen`). Appelé depuis une roue, il aurait changé de volet dans une feuille fermée — rien à
  l'écran, sans erreur. `_mvReglDocGo(i)` (app.js) demande à `_docsEstVolet(act)` — posé dans
  `reglages.js` **à côté de `docsGo`**, là où vit le savoir — et, pour un volet, ferme les roues, `openDocs()`,
  puis `docsGo(i)` 60 ms plus tard ; sinon `docsGo(i)` direct. Toutes les lignes de toutes les roues
  passent par `_mvReglDocGo` (harnais : contre-épreuve sur le court-circuit). `etp` reçoit `mod:'planning'`.
- **Textes** : `planning.js` (« la règle de décompte … dans l'onglet Le cadre » → roue ; « Réglages ›
  Membres » → « Réglages › Équipe », qui est le vrai nom de l'onglet), fiche `MV_AIDE.planning` (« Deux
  onglets » + la roue, coupure, majorations, relevé mensuel), guide **10** (sous-titre, section « Deux
  onglets, et une roue crantée », trois chemins, majorations, relevé individuel, planning de l'année — et
  « l'onglet Modèles », qui n'existait plus depuis la migration `templates → cadre` : un texte mort depuis
  des mois, trouvé en relisant). `WHATS_NEW` 6.97, un item.

### 99b. Vérifications

`npm run check` **EXIT=0** · preflight **0 erreur** · `mv-harnais-regl-module` **98/98** dont **17
contre-épreuves** (+6 : onglet revenu, `_planRenderCadre` sur `#plan-body`, migration perdue,
`_docsEstVolet` qui oublie ETP, `_mvReglDocGo` sans hub pour un volet, lignes qui court-circuitent) ;
`_docsEstVolet` et `_mvReglDocGo` **exécutés** (séquence attendue pour un volet : fermer les trois roues,
ouvrir le hub, `docsGo(1)`) · `WHATS_NEW` exécuté (6.97, 1 item) · `v7.56` cinq fois · guide régénéré ·
`npm run build` EXIT=0. Pas de rendu navigateur (pas de Chromium ici) : à vérifier en admin — la roue du
Planning ouvre le cadre, un modèle de semaine s'édite dans la feuille, « Relevé mensuel » ouvre le hub
sur le bon volet.

### 99c. Reste ouvert

L'éditeur de modèle de semaine se rend dans une feuille de 88 vh : à juger à l'usage sur téléphone. Suite :
**NAV-3** Pilotage (Paramétrage + indicateurs → roue, Archives en onglet, IFT/conso GNR hors de Réglages),
**NAV-4** documents Phyto/Réserve (bouton CSV hors de `#phyto-tabs-row`), **NAV-5** vocabulaire.

### 99d. La note de livraison

**Base : `f79891c`**, `.mv-base` inchangé. Livré dans l'état cumulé §98 → §99 : `index.html`, `src/app.js`,
`src/planning.js`, `src/reglages.js`, `src/utils.js`, `public/sw.js`, `guide/10-planning.html`,
`scripts/mv-harnais-regl-module.mjs`, `scripts/harnais-claude-md.mjs`, `CLAUDE.md` (+ les fichiers de §98
inchangés depuis). Puis `node scripts/build-guide.mjs`, `npm run build && firebase deploy`.

## 100. ★★★ NAV-3 — LE PILOTAGE N'A PLUS DE BOUTON « OUTILS » : ARCHIVES EST UN ONGLET, LE PARAMÉTRAGE EST DANS LA ROUE (09/09 — APP 6.97 → 6.98 · SW 7.56 → 7.57 · base `f79891c`, s'empile sur §98 et §99)

> Lot **③** de la série NAV. ⚠️ **S'empile sur §98–§99, non commités** : les trois lots se livrent ensemble.

### 100a. Ce qui bouge

- **« Outils » cachait deux natures.** *Archives* se lit — c'est un écran de détail comme Économie et
  Conformité : `['arc','carton','Archives']` ferme `_PIL_TABS`, après le filet. *Paramétrage* se règle —
  objectifs de fin, fenêtres des tâches, hypothèses de calcul (`_pilSimEcoCard`) : il se rend dans la
  feuille `#ovReglPilotage` (`_pilParamRender(d)` → `#pil-regl-host`, puis `_pilBindParam(d)` — **mêmes
  écrivains** — puis `_ecoRenderIftCard()`). `_PIL_TOOLS`, le bouton `#pil-outils-btn`, le menu, ses deux
  écouteurs dans `_pilBind` et **sept règles CSS** `.pil-outils-*` : supprimés. La roue est dans
  `pil-mast-right`, rendue **par `_pilHdrHtml` admin seulement** (l'en-tête est re-rendu en JS : `_mvReglSync`
  ne suffirait pas), branchée dans `_pilBind`.
- ⚠️⚠️ **LA CLÉ `'param'` NE PASSE PAS PAR `_PIL_TAB_MIGR`.** Première version : `param:'auj'` dans la table,
  comme `cav`. C22 a rougi… **sur `cave.js`** : le préflight lit `_PIL_TAB_MIGR` comme *la liste des clés
  mortes du Pilotage* et cherche `'param'` dans tous les autres fichiers — or le Cuvier a sa propre clé
  `'param'` (tolérance CAVE-2, `switchVendOng('param')` ouvre la roue de la Cave, gravée par
  `mv-harnais-cave-reglages`). Deux modules, un homonyme, un contrôle mécanique qui ne distingue pas.
  Sortie : `var _PIL_TAB_ROUE='param'`, traité à part — mémorisé → `_pilLoadTab` rouvre sur `auj` ;
  demandé → `_pilSetTab('param')` ouvre la roue et rend `false`. Le harnais grave que `param` n'est **pas**
  dans `_PIL_TAB_MIGR` (contre-épreuve). *Un contrôle qui raisonne sur une table lui donne un second sens :
  l'écrire, c'est le lire deux fois.*
- **La feuille est hors de `#pil-content`** : la délégation de clic du contenu ne la voit pas. `_pilParamOpen`
  pose sur `#pil-regl-host` la seule délégation dont le corps a besoin — les boutons « à compléter »
  (`data-diag`), qui ferment la feuille avant `_pilGo`. Un commit du Paramétrage rappelle `_pilFillContent`,
  qui finit par `_pilParamRefresh(d)` : la feuille ouverte se repeint (le tableau des fenêtres suit).
- **Deux nombres rentrent chez eux.** La carte « Économie & conformité » de Réglages › Domaine commençait par
  « Se renseigne ailleurs » (taux → Équipe, prix GNR → Tracteur, simulation → Paramétrage) avant de garder
  deux inputs. `_ecoRenderConfigCard` est remplacée par `_ecoRenderConsoCard()` (roue du Tracteur,
  `#regl-eco-tracteur` : conso L/h + état du prix du litre, qui se saisit à l'appoint) et
  `_ecoRenderIftCard()` (roue du Pilotage, `#regl-eco-pilotage`, exposée) — **mêmes écrivains**
  `_ecoCfgSet('conso'|'ift')`. `_aocRenderCard` (appellations) s'ancrait sur `#eco-conf-card` : elle suit
  `#saisons-list` directement. `_pilOpenParam` (seul appelant : cette carte) est supprimé.
- **Le raccourci Paramétrage de l'Économie** (`data-pec="param"`) et le texte du graphe vide (« Les fenêtres
  se posent dans… ») ouvrent / nomment la roue. `_mvAideOngletsPil` ne lit plus `_PIL_TOOLS`.
- **La fiche Pilotage disait faux** (§98a) : « Rien ne se saisit ici » devient « Presque tout se lit, quatre
  choses s'écrivent » — prix des achats, ordre de passage, mois d'exercice, et ce que porte la roue. Deux
  fiches « i » (`MV_INFO` : coût à la bouteille, simulateur) et le point « hors période » nomment la roue.
  `WHATS_NEW` : **l'histoire n'est pas réécrite** — les anciens items qui disent « Outils › Paramétrage »
  restent ; le harnais ne contrôle que ce qui suit `var MV_AIDE`. Guide **11** (« La roue crantée — ce qui
  se règle » remplace « Outils du pilotage »), **12** (l'IFT et la conso ne sont plus là), **06** (carte
  Carburant). `WHATS_NEW` 6.98, deux items.
- **Non déplacé, et dit** : « Choisir les indicateurs » (`#pil-gear`) reste **par onglet** — c'est un réglage
  de tuiles, contextuel à l'écran qu'on regarde ; la maquette NAV-0 le mettait dans la roue, le code montre
  que ce serait un sélecteur d'onglet en plus. Il reste où il est.

### 100b. Vérifications

`npm run check` **EXIT=0** · preflight **0 erreur** (après le C22 ci-dessus) · `mv-harnais-regl-module`
**131/131** dont **25 contre-épreuves** (+8 : `param` revenu dans `_PIL_VALID_TAB`, `param` dans
`_PIL_TAB_MIGR`, mémorisé non ramené, feuille non repeinte, carte IFT dans la mauvaise feuille, Carburant
non rendue, fiche qui promet le vide) ; `_ecoRenderIftCard` **exécutée** sur un DOM factice (valeur,
écrivain, icône) · `mv-harnais-rdtmil` **85/85** (l'assertion sur l'ordre des cartes suit
`_ecoRenderConsoCard`) · `mv-harnais-icones` : `TABLES_TRIPLET` sans `_PIL_TOOLS` · `WHATS_NEW` exécuté
(6.98, 2 items) · `v7.57` cinq fois · guide régénéré · `npm run build` EXIT=0. Pas de rendu navigateur :
à vérifier en admin — la barre du Pilotage finit par Archives, la roue ouvre le Paramétrage, une fenêtre
modifiée se voit sans fermer la feuille, l'IFT se saisit dans la roue et Conformité le lit.

### 100c. La note de livraison

**Base : `f79891c`**. Livré dans l'état cumulé §98 → §100 : `index.html`, `src/app.js`, `src/pilotage.js`,
`src/reglages.js`, `src/utils.js`, `src/styles.css`, `public/sw.js`, `guide/06`, `guide/11`, `guide/12`,
`scripts/mv-harnais-regl-module.mjs`, `scripts/mv-harnais-icones.mjs`, `scripts/mv-harnais-rdtmil.mjs`,
`scripts/harnais-claude-md.mjs`, `CLAUDE.md` (+ les fichiers de §98–§99). Suite : **NAV-4** documents Phyto
et Réserve (le bouton CSV quitte `#phyto-tabs-row`), **NAV-5** vocabulaire.

## 101. NAV-4/5 — ROUES PHYTO ET RÉSERVE, ET LE VOCABULAIRE : LA SÉRIE NAV EST CLOSE (09/09 — APP 6.98 → 6.99 · SW 7.57 → 7.58 · base `f79891c`, s'empile sur §98–§100)

> Lots **④ et ⑤** de la série NAV, livrés ensemble (« Suite nav 4 et nav 5 »). ⚠️ **S'empilent sur §98–§100,
> non commités** : les cinq lots se livrent sur la même base.

### 101a. NAV-4 — les deux derniers modules

- **Phyto** : la roue (`_mvReglOpen('phyto')`, admin) ouvre `#ovReglPhyto` — documents seulement : registre PDF,
  registre tableur (CSV 2027), synthèse cuivre, via `MV_DOCS.filter(mod==='phyto')`. Le **bouton violet
  « Exporter le registre »** qui vivait **au bas de la liste du registre** (`#phyto-export-row`, admin, onglet
  Registre) disparaît, avec son bloc dans `_phytoSyncTabs`. ⚠️ **Correction de l'audit NAV-0 (§98a, ligne
  « 3 portes »)** : il disait ce bouton *dans `#phyto-tabs-row`*. Faux — il était sous la liste, dans
  `.content`. La conclusion tient (une porte de plus vers un document, hors règle), la localisation ne tenait
  pas. *Une mesure citée avec un sélecteur doit avoir été lue à ce sélecteur.*
- **Réserve** : l'en-tête est rendu en JS (`renderReserve`) — la roue y est rendue **admin seulement**, comme
  au Pilotage. `#ovReglReserve` : une ligne « Aucun prix ne se saisit ici » (les achats se chiffrent dans
  Pilotage › Économie › Achats — ce que la fiche disait déjà, la roue le redit là où on cherche), puis les
  deux inventaires. `_mvReglOpen` ne rappelle **aucun écrivain** pour ces deux modules.
- La roue est donc sur les **sept modules** (Vigne, Tracteur, Phyto, Cave, Réserve, Planning, Pilotage) ;
  Réglages n'en a pas — c'est lui le transversal.

### 101b. NAV-5 — le vocabulaire

- **« App » → « Moi »** (libellé seul ; la clé `app`, l'id `regl-tbtn-app` et `#regl-view-app` ne bougent pas —
  on renomme, on ne renumérote pas). Le troisième onglet ne porte plus que le personnel : mot de passe,
  thème, plein soleil, notifications, aide, signaler, CGU, déconnexion — plus la zone dangereuse (admin).
- **Documents & impressions passe dans Domaine** (`#set-sec-donnees`, carte « Données », en fin d'onglet).
  `_reglStashRow` s'ancre sur `#regl-export-row` : la ligne « saisies non enregistrées » (admin) déménage
  avec elle — chez les données, c'est mieux. « Tous les documents » depuis une roue va dans Domaine.
  Chemins réécrits : guide **01, 04, 08, 10, 12, 13, 14**, fiches Cave et Réglages, `_mvReglDocsHtml`.
- **Les en-têtes disent le mot du dock** : « Réserve » (`reserve.js`, fiche `MV_AIDE.reserve.titre`),
  « Cave » (`_caveHeaderRender`). **« Le Millésime »** s'écrit comme « Le Cuvier » et « Le Chai »
  (`#cave-sec-millesime`, groupe de la roue, fiche).
- **« Paramétrage » n'apparaît plus à l'écran** : les deux titres de carte deviennent « Fenêtres des
  tâches » (la feuille s'appelle déjà Réglages · Pilotage), le raccourci de l'Économie « Réglages du
  module », la note de la frise « roue crantée ». Le harnais grave l'absence du mot hors commentaires.
  `lint-vocabulaire` n'est pas étendu : il compte ligne par ligne, commentaires compris, et le mot y est
  légitime en histoire — le harnais fait ce travail sur le source sans commentaires.
- **`#page-chat` reste.** Inatteignable (`goTo('chat')` n'est écrit nulle part), rendu honnête en §51 ; le
  retirer ne change rien pour l'utilisateur et ouvre un risque pour rien. Trancher un autre jour, avec
  la même méthode que CAVE-5 (appelant par appelant).

### 101c. Vérifications

`npm run check` **EXIT=0** · preflight **0 erreur** · `mv-harnais-regl-module` **152/152** dont **30
contre-épreuves** (+5 : export revenu sous le registre, onglet redevenu App, documents retournés sous
App, « La Réserve », « Paramétrage » dans un titre) · `WHATS_NEW` exécuté (6.99, 2 items) · `v7.58` cinq
fois · guide régénéré · `npm run build` EXIT=0 · démo, whatsnew, cliquets verts. Pas de rendu navigateur.

### 101d. Le bilan de la série (mesuré en §98a, relu ici)

| | NAV-0 | Après NAV-5 |
|---|---|---|
| Endroits où l'on règle | 6 | **1 règle** : la roue du module ; Réglages = Domaine · Équipe · Moi |
| Mots pour « réglage » | 3 | **1** |
| Portes vers un document | 3 + 9 renvois | **1 règle** : la roue du module ; le catalogue dans Domaine |
| Onglets de Réglages | 5 | **3** |
| Sorties dans l'en-tête | 2 | **1** (le dock) |
| Titres de la Vigne | 3 | **1** |
| Écrans de saisie de `CONFIG.eco` | 2 | **1** (roue du Pilotage ; conso GNR : roue du Tracteur) |
| Onglets du Planning (admin) | 3 | **2** |
| « Outils » du Pilotage | Archives + Paramétrage | **Archives** onglet, Paramétrage → roue |
| Aide qui disait faux | 2 | **0** (fiche Pilotage, guide Réglages, + « onglet Modèles » mort) |

Reste ouvert : la roue de la Cave est une **section**, les six autres une **feuille** — même geste, deux
anatomies (à juger à l'usage) ; « Choisir les indicateurs » reste par onglet (§100a) ; `#page-chat`.

### 101e. La note de livraison

**Base : `f79891c`**. Livré dans l'état cumulé §98 → §101 : `index.html`, `src/app.js`, `src/phyto.js`,
`src/reserve.js`, `src/cave.js`, `src/pilotage.js`, `src/utils.js`, `public/sw.js`, `guide/01, 04, 07, 08, 09,
10, 12, 13, 14`, `scripts/mv-harnais-regl-module.mjs`, `scripts/harnais-claude-md.mjs`, `CLAUDE.md` (+ les
fichiers de §98–§100). Puis `node scripts/build-guide.mjs`, `npm run build && firebase deploy`.

---

## 102. CAVE-6 — L'ORDRE DU CUVIER, LE FILTRE DU CHAI, ET 482 TAILLES DE TEXTE (10/09 — APP 6.99 → 7.00 · SW 7.58 → 7.59 · base `a5c978c`)

**Trois phrases de Nico**, dans le même message : *« dans le cuvier : ordre des modules doit etre
maturité / recolte / cuvier · dans le chai : il faut pouvoir filtrer par millesime · revoir toutes
les polices et bug d'affichage dans la cave »*.

### ① L'ordre du Cuvier — trois boutons qui changent de place

`Récoltes · Cuves · Maturités` → **`Maturités · Récoltes · Cuves`**. L'ordre précédent partait du
milieu ; celui-ci suit le raisin — à la vigne avant de couper, ce qui rentre, ce qui fermente.
**Les clés (`ana`/`rec`/`cuves`), les handlers et `_vendTab` ne bougent pas** : seule la position
des trois boutons change. La boucle d'activation de `_vendRenderTab` a été réordonnée avec eux —
c'est la deuxième liste du même concept, et deux listes qui divergent, c'est le défaut que
`switchCaveOng` documente déjà dix lignes plus haut.

⚠️ **CE QUI N'A PAS ÉTÉ CHANGÉ, ET C'EST UNE QUESTION OUVERTE** : l'onglet d'arrivée reste
**Cuves** (`_vendTab='cuves'`, posé à trois endroits par `_mlGo`). On arrive donc sur le troisième
onglet. Nico n'a parlé que de l'ordre ; changer le point d'arrivée est une décision de produit,
pas une conséquence mécanique. **À trancher.**

### ② Le filtre millésime — il existait, il était au mauvais étage

⚠️⚠️ **PREMIER RÉFLEXE, ET IL A ÉVITÉ UN DOUBLON** : `CLAUDE.md` disait déjà, dans le tableau de la
Règle d'or n°3, *« il faut un filtre millésime dans le Chai » → **`_caveMillFilter` existe depuis
longtemps***. Vérifié : il existait bien, avec `_caveDansFiltre` et `_caveCuvsFiltrees` en source
unique depuis la série MILLÉSIME (§20h). **Écrire un second filtre aurait été la faute exacte que
ce tableau existe pour empêcher.**

★★★ **CE QUI MANQUAIT VRAIMENT : SA PORTÉE.** Les chips étaient écrites **en tête de
`renderCaveCuvees`**, c'est-à-dire dans le corps d'un seul des trois onglets. Conséquence :
passer au **Journal** faisait disparaître le filtre **de l'écran alors qu'il restait posé** — et
le Journal, l'endroit même où l'on demande *« qu'a-t-on fait sur le 2025 »*, n'en avait aucun.
*Un filtre invisible qui continue d'agir est pire qu'un filtre absent.*

- Il vit dans **`#mvc-milbar`**, créé en JS après `#mvc-tabs-row` — **même patron que
  `_caveEnsureBtlTab`**, qui crée déjà l'onglet Bouteilles à cet endroit. `index.html` n'est donc
  pas touché pour ce bloc.
- ★ **`#mvc-milbar:empty{display:none}`** : un domaine à un seul millésime ne voit pas une bande
  vide. L'écran reste celui d'avant, au pixel près.
- Les **trois** vues s'accrochent à `_caveDansFiltre` — cuvées, journal, bouteilles.
- ★★ **Le journal lit `_rmMilCuvees`**, la fonction du **registre imprimé**, et pas une seconde
  définition de « le millésime de cette opération ». Deux définitions divergeraient, et **l'écran
  finirait par contredire le document** qu'il est censé préparer.
- ⚠️⚠️ **Une opération mixte ou orpheline sort du filtre — ET EST COMPTÉE À L'ÉCRAN.** Même
  arbitrage qu'au registre (§20h), mais avec une différence qui compte : un document se relit une
  fois l'an, un écran se consulte tous les jours. *Une ligne qui disparaît sans un mot se lit comme
  une perte de donnée.* La note dit combien, et rappelle qu'elles sont sur « Tous ».
- ★ **La liste des millésimes proposés inclut les cuvées EMBOUTEILLÉES** : un millésime tout en
  bouteille a encore des bouteilles en stock et des opérations au journal. Mais il n'a plus de cuvée
  en élevage, donc **pas de compteur** — *un « 0 » se lirait comme une absence, pas comme un
  compte.* Le compteur garde son sens unique : les cuvées en élevage.
- ⚠️ **La bande `#cave-kpis` n'est PAS filtrée**, et c'est inchangé : elle porte les chiffres de la
  Cave entière, les mêmes sur les quatre sections (§94). La fiche `MV_AIDE` le disait déjà — elle a
  été corrigée sur la portée, pas sur ce point.

### ③ Les polices — le vrai chiffre était 482, et ce n'était pas un problème de contraste

**Mesuré avant d'écrire une ligne** : `cave.js` portait **482 déclarations `font-size` en dur, sur
37 valeurs différentes** — dont du **7,5 px**, du 8 px, du 8,5 px. Le Pilotage est passé aux onze
pas `--pt-*` en août (§42) ; **la Cave ne l'a jamais été.**

⚠️⚠️ **ET LA PISTE ÉVIDENTE ÉTAIT FAUSSE.** J'ai cherché §21c en premier — une couleur de FOND
employée comme encre. Trouvé **deux** occurrences à **1,12:1 en mode sombre** (`.mvv-tab.active`,
`.mvv-kpi`), le chiffre exact de §67. **Les deux sont sur des classes MORTES** : aucun HTML de
l'application ne les pose depuis les lots CAVE-1 à 5. *Un défaut réel, mesuré, reproductible — et
strictement sans effet.* **Zéro faute de contraste sur les classes vivantes de la Cave.**
★ **La leçon** : chercher le défaut qu'on connaît déjà fait trouver ce qu'on cherche, pas ce qui
gêne l'utilisateur. Le compte des classes vivantes aurait dû venir **avant** le calcul des ratios.

**Le remappage** : **415 remplacements** vers `var(--pt-*, <valeur>)`, chaque appel avec son repli.
37 valeurs → 11 pas. **24 tailles remontées à un plancher de lisibilité de 9,5 px** — sous ce pas,
ce n'est plus une taille, c'est un aveu. Les écarts sont ≤ 1 px sur 401 des 415.

⚠️ **LES 68 RESTANTES NE SONT PAS UN OUBLI** : ce sont les trois feuilles de documents imprimables
(`RM_CSS`, `BC_CSS`, `MV_CUVDOC_CSS`). **Un document s'ouvre dans sa fenêtre et ne charge pas
`styles.css`** (§86). Y écrire `var(--pt-txt,12.5px)` fonctionnerait — par le repli — mais
**déclarerait une dépendance qui n'existe pas**. Leurs tailles restent en dur, c'est leur règle.

### ⚠️⚠️⚠️ CE QUI A MAL TOURNÉ — LE MÉNAGE CSS, ABANDONNÉ EN COURS DE LOT

L'audit a trouvé **58 classes CSS déclarées par `cave.js` et posées nulle part** — les vestiges
`mvv-*` et `pcav-*` des lots CAVE-3/4, que le ménage de CAVE-5 n'avait pas ramassés (il visait
`index.html`). J'ai voulu les retirer.

**Mon détecteur a pris `.join`, `.toFixed` et `.getFullYear` pour des sélecteurs CSS.** Ma regex
n'exigeait qu'une ligne de concaténation commençant par `+'` — ce que fait aussi tout le HTML
généré du fichier. **Vingt-cinq lignes de code JS ont été supprimées.**

★★★ **CE QUI L'A ATTRAPÉ : `node --check`, immédiatement après.** Pas une assertion, pas un
harnais — le contrôle de syntaxe le plus bête de la chaîne. *Un lot qui supprime des lignes doit
être suivi d'un contrôle de syntaxe avant tout autre raisonnement.*

★★ **Ce que j'ai fait, et c'est la bonne réponse** : **ne pas réparer à la main**. Base restaurée
depuis la copie figée, les cinq patchs sains rejoués dans l'ordre, `node --check` vert.
**Le ménage est ABANDONNÉ pour ce lot** — c'est du ménage, invisible du client, et un lot plus
petit dont on est sûr vaut mieux qu'un gros lot fragile.

⚠️ **RESTE OUVERT** : les **58 classes mortes** (~7 ko de CSS injecté à chaque affichage de la
Cave) et les deux fautes de contraste qu'elles portent. **À faire dans un lot dédié**, avec la
bonne ancre : ne retenir une ligne que si elle contient une **accolade CSS** et qu'aucun de ses
sélecteurs n'est posé. La liste est reproductible en quelques lignes de Python.

### Ce qui a été mesuré

| Contrôle | Résultat |
|---|---|
| `node scripts/preflight.mjs` | **0 erreur · 0 avertissement** |
| `scripts/mv-harnais-cave6.mjs` (neuf) | **17 vertes, 0 rouge**, 3 contre-épreuves |
| `WHATS_NEW` **exécuté** en Node | tête = `APP_VERSION`, ordre strict, 0 doublon, 0 demi-surrogate **non apparié** |
| cliquet C14 (`catch{}`) | `cave.js` 3 → 3 · `utils.js` 10 → 10 |
| balance `<div>`/`<span>`/`<button>` | écarts base = écarts patché (non-régression) |
| tailles de texte en dur, `cave.js` | **482 → 68** (les 68 = feuilles de documents) |
| diff `cave.js` | 909 lignes, dont **811 de polices** et **98 dans le périmètre des trois patchs, une par une** |
| déplacement de la carte du guide | **même longueur, même liste triée de caractères** — aucun octet réécrit |

⚠️ **Le harnais `mv-harnais-globaux.mjs` N'A PAS ÉTÉ JOUÉ** : `eslint` n'est pas installé dans le
bac à sable. Il est dans `npm run check` côté Nico — c'est lui qui vérifie qu'aucun nom libre neuf
ne manque son `window.` (§24). Les trois fonctions ajoutées (`_caveMilsDuChai`, `_caveEnsureMilBar`,
`_caveMilBarRender`) ne sont appelées **que depuis `cave.js`**, donc hors du piège ; `_caveSetMill`,
seule visée par un `onclick`, était **déjà exposée**.

⚠️ **Et ce qu'aucun contrôle n'a lu : la mise en page.** 415 tailles ont bougé, la plupart de
+0,5 px, quelques-unes de +1,5 px sur des badges étroits. **Aucun harnais ne voit un texte qui
déborde d'une pastille.** À regarder à l'œil sur les quatre sections de la Cave.

### ⚠️⚠️⚠️ POST-SCRIPTUM (10/09, après le push `d92de47`) — LA CI A ROUGI, ET ELLE AVAIT DEUX RAISONS

`mv-harnais-cave-reglages.mjs` (le harnais de CAVE-2) a rougi sur deux assertions, et la CI s'est
arrêtée là : **les 12 contrôles suivants n'ont jamais tourné.** Aucun défaut du lot — mais deux
leçons, et la seconde vaut plus que la première.

**① LE HARNAIS ÉTAIT VERT ET GRAVAIT UN CONTRESENS.** Il figeait `'rec,cuves,ana'` **sous le nom
« ordre de la vendange : Récoltes, Cuves, Maturités »**. Or Récoltes-Cuves-Maturités n'est pas
l'ordre de la vendange : *on contrôle la maturité AVANT de couper.* Le **nom de l'assertion et son
contenu se contredisaient** — et le harnais est resté vert du 09 au 10/09 sans que rien ne le
signale.

★★★ **UN VERT NE PROUVE QUE LA CONFORMITÉ AU CONTENU, JAMAIS LA JUSTESSE DU NOM.** C'est Nico qui
l'a vu à l'œil, en regardant l'écran. Quand on grave une règle sous un nom qui l'explique, **il faut
relire le nom autant que le test** — sinon on fabrique un cliquet qui protège une erreur.
Les deux assertions figent maintenant `'ana,rec,cuves'` ; contre-épreuve jouée : l'ancien ordre
réinjecté dans `_vendRenderTab` **rougit bien** (38/39).

**② MA FAUTE : JE N'AI PAS LANCÉ LA CHAÎNE.** J'avais lancé `preflight.mjs` (vert) puis
`npm run check`, qui **s'est arrêté au troisième maillon** — `mv-harnais-globaux.mjs` exige
`eslint`, absent du bac à sable. J'ai noté « harnais globaux non joué » **et je me suis arrêté là**,
alors que les **40 maillons suivants** ne demandaient rien de particulier. `cave-reglages` est le
33ᵉ : il aurait rougi en trois secondes.

★★★ **RÈGLE : `npm run check` QUI S'ARRÊTE SUR UNE DÉPENDANCE ABSENTE N'EST PAS « JOUÉ ».** Il faut
**sauter le maillon manquant et lancer les autres un par un**. Boucle :
```bash
python3 -c "import json,io;print('\n'.join(x.strip() for x in json.load(io.open('package.json'))['scripts']['check'].split('&&')))" \
  | while read -r c; do eval "$c" >/dev/null 2>&1 && echo "ok  $c" || echo "KO  $c"; done
```
**Chaîne complète rejouée : 42 verts sur 42.** Seuls `mv-harnais-globaux` et `lint-cliquet` restent
non jouables ici — les deux, et **eux seuls**, dépendent d'`eslint`.

**③ ET LE HARNAIS DU LOT N'ÉTAIT BRANCHÉ NULLE PART.** `mv-harnais-cave6.mjs` n'était ni dans
`check`, ni dans `prebuild`, ni dans la CI : **17 assertions que personne n'exécutait.** C'est le
défaut que le workflow dénonce déjà en commentaire (*« AUCUN appelant ne l'executait — ni npm run
lint, ni la CI »*), et je venais de le reproduire. Branché dans `check` **et** `prebuild`, après
`mv-harnais-cave-mil.mjs` — donc joué par la CI au `npm run build`.
★ **Écrire un harnais et ne pas le brancher, c'est écrire un commentaire.**

**Aucun bump** : `scripts/` et `package.json` ne sont ni servis au client ni précachés (vérifié —
`PRECACHE_ASSETS` est rempli au build depuis le bundle Vite, la seule mention de `package.json`
dans `sw.js` est un commentaire). **APP 7.00 · SW 7.59 inchangés.**

⚠️ **RESTE OUVERT — UNE PHRASE FAUSSE DANS LE JOURNAL DES NOUVEAUTÉS.** `src/utils.js`, bloc
**v6.93** (CAVE-2) : *« L'ordre suit la vendange : Récoltes, Cuves, Maturités. »* Même contresens
que le harnais, **visible du client cette fois**. Un utilisateur qui déroule ses nouveautés lit
6.93 puis 7.00 et voit deux « ordres de la vendange » contradictoires. À retirer du bloc 6.93 (le
reste, les renommages Cuves/Maturités, demeure vrai) **dans le prochain lot qui touche `utils.js`**
— pas de cycle de déploiement pour une phrase seule.

## 103. ★★★ PIL-COH — LE PILOTAGE NE SE CONTREDIT PLUS : ONZE DÉFAUTS TROUVÉS EN EXÉCUTANT LES HUIT ONGLETS (10/09 — livré avec §104 : APP 7.00 → 7.01 · SW 7.59 → 7.60 · base `ae9adbd`)

**Point de départ**, mot pour mot : *« En tant qu'analyste et expert en ergonomie, améliore significativement le module
pilotage. Il doit être parfait, avec les bonnes informations, pas d'erreur de calcul et cohérent. »*

### 103a. La méthode — un bac qui rend les écrans, pas un audit qui relit le code

Aucun harnais du projet n'exécutait un ONGLET entier : le banc (§43d) mesure dix fonctions, les harnais C20 en
extraient trois ou quatre. **Le bac de ce lot charge `utils`, `planning`, `reglages`, `tracteur`, `reserve`, `phyto`,
`cave` et `pilotage` pour de vrai** (jsdom, `window = globalThis`, horloge figée), extrait la fermeture de `calcHeures`
depuis `app.js`, pose un domaine SYNTHÉTIQUE (11,8 ha, 12 parcelles, 3 permanents + 1 CDD fini + 1 équipe de vendange de
30 + 2 bureau, 4 périodes, journal, sessions, traitements, paie) et rend les huit onglets à deux dates — le 10/09 en
vendange, le 16/11 en hiver. On lit le TEXTE rendu. ⚠️ **Piège de montage** : `planning.js` remet `window.PLANNING_ENTRIES`
à `{}` en se chargeant — les données se posent APRÈS les modules, comme `applyFbData` le fait dans l'app. Sans ça, la CP
d'Ana n'existait pas et « 4 présents sur 4 » passait pour juste.
★ Le bac n'est pas livré (il vit dans le bac à sable, avec ses 60 Mo de jsdom) ; **ce qu'il a trouvé l'est**, sous forme
d'assertions fonctionnelles dans `scripts/mv-harnais-pil-coherence.mjs`.

### 103b. Les onze défauts, mesurés sur l'écran rendu

| # | ce que l'écran disait | la cause | le correctif |
|---|---|---|---|
| **A** | Aujourd'hui « fin le ven. 11 sept. » · La campagne › Échéances « fin de saison ~mar. 29 sept. » | `_pilPanelEcheances` divisait la charge par la cadence des 4 dernières semaines ; le cockpit lit la capacité planifiée depuis §34 | la carte lit **`_pilMargeCalc`**, le « N j » par tâche passe par `_pilCapaProj` (3ᵉ argument `kPre` : le facteur calculé une fois), et la ligne de cadre nomme la source |
| **B** | « Cadence équipe 26 h/j » sous « 32 personnes dans les rangs » | `_planTeamCadence_` (planning.js) comptait une FICHE = 1 et un CP = présence | × `_planEffN`, `_planWorkH` au lieu de `_planDayH`, rend `hPers` (h par personne-jour) |
| **S** | Simulateur « et si ? » : « 13 j à cet effectif » pour 324 h à 33 — la tournée, juste au-dessus, disait 2 j | `perH = cadH/nMes` : 28 jours de présence divisés par l'effectif d'AUJOURD'HUI | `perH = c.hPers` (mesuré), repli journée réglée |
| **C** | Marge : « cadence pas encore mesurable » · tuile Budget : « cadence +232 % vs barème · fin ≈ 30,3 k€ » — le MÊME écart | la borne [0,5 ; 3] ne vivait que dans `_pilCapaProj`, côté date ; `_pecData` appliquait l'écart aux euros sans borne | **`_PEC_CAD_KMIN/KMAX` dans `_pecData`**, `cad.horsBornes`, `applic=false` dans les deux sens ; `_pilCapaProj` ne porte plus de borne ; la marge écrit « hors bornes : non retenu » |
| **C'** | Verdict histo : « +23 % de temps en plus… la période irait vers 37,1 k€, soit **0 €** au-dessus du budget » | `projFin = budget` quand non appliqué, mais la phrase de projection restait | `_pecNonRetenu(E)` : un écart lu n'écrit plus de projection ; tuile « Écart de cadence » idem |
| **G** | Équipe › « 5/6 présents au champ » · cockpit « 3 sur 4 » | `_pilPanelPresences` comptait le bureau sous le mot « au champ » | mêmes nombres que le cockpit (`presentFiches` / `nVchamp`), liste hors bureau |
| **I** | taux moyen 18,75 €/h en vendange (30 vendangeurs à 16 €) | `_ecoRate` pesait chaque taux par les heures de sa grille sur DOUZE mois, une fiche = 1 — le backlog disait « pondéré par les heures : FAIT », c'était vrai et insuffisant | poids = `_planWorkPersRange` sur la période (contrats, effectif), repli grille × `_mvEffDef` ; cache oublié par `_pilExoOublier` ; 16,65 €/h |
| **J** | photo Travaux « 7 611 h · 3 campagnes dans l'exercice » avec un printemps qui finit le 23 août dans un exercice ouvert le 1er août | une période à cheval comptait en entier | prorata des jours, et l'écran écrit « 1 à cheval, au prorata de ses jours » ; le tableau « Deux façons de compter » garde la ligne entière |
| **R** | « Rythme des 28 derniers jours : 362 € par jour » à dix jours de vendange, fin projetée SOUS le budget pendant que la cadence disait le double | la fenêtre remontait avant le début de période | `winStart = max(t0, …)`, `nDays` affiché (« 16 derniers jours : 633 €/j ») |
| **E** | Exercice : 4 personnes, 129 k€ — Étienne et Chloé absents, pastille « bureau » (l. 7359) jamais rendue | 0a-quater, reporté le 14/08 : `_mvEnContratSurPeriode` écartait le bureau dès sa première ligne, contre son propre commentaire | 4ᵉ argument **`avecBureau`** (utils.js), `true` au seul appelant `_pexData` ; colonne « Au champ » → **« Travaillées »** ; ★ **livré sur décision explicite de Nico** (*« le point E, il faut la pastille bureau »*) — les trois lecteurs de capacité restent hors bureau |
| **K/D** | `_pilOrdDate` en époque locale + `86400000` (le piège du 12/08, en sens inverse) · « 1 tâches » | — | `new Date(2026,0,1+o)` (débordement de jour, robuste au changement d'heure) · pluriel |

★★★ **La leçon** : *neuf de ces onze défauts ne se voient QUE deux onglets à la fois.* Chaque chiffre était défendable
seul ; c'est leur voisinage qui mentait. Un contrôle par fonction ne peut pas le trouver — seul un écran rendu à côté d'un
autre écran rendu le peut. **Le test qui manque au projet est celui-là : deux onglets, mêmes données, mêmes grandeurs.**

### 103c. Ce que le bac a vu et que le lot n'a PAS traité

- **L'Exercice affiche dix mois PLANIFIÉS comme « payés » et « sortis »** : au 10/09, « Dépenses de l'exercice 129 k€ ·
  en cours » agrège deux mois payés et dix mois de grille de planning. `enCours` existe dans `_pexData` et n'est lu que
  pour le mot « en cours ». **Séparer « engagé à ce jour » de « prévu jusqu'à la clôture » change l'écran : maquette
  d'abord.**
- **Le doublon `_pilDiag` / `_pecZeros`** (§42k) — inchangé, maquette d'abord.
- **Le budget de campagne est un barème × taux moyen** : sur une vendange à 80 h/ha barème et 33 personnes, l'écart de
  cadence sort à +232 %. Le bac le dit hors bornes — c'est le comportement voulu — mais c'est le **barème** qu'un
  domaine devra corriger, pas l'écran (§20b, « on corrige le barème, jamais le taux »).
- ⚠️ La contre-épreuve « époque locale » n'est probante que sous un fuseau à changement d'heure : le harnais l'exige
  (`TZ=Europe/Paris node scripts/mv-harnais-pil-coherence.mjs --contre`) et refuse de conclure sous UTC — le bac à sable
  de Claude est le seul endroit du monde où l'ancienne version était juste (§ `_mvJourApres`).

### 103d. Vérifications

`mv-harnais-pil-coherence` **26/26**, contre-épreuves **9/9 rougissent** (sous `TZ=Europe/Paris`). `npm run check` :
preflight **0 erreur · 0 avertissement**, tous les harnais verts jusqu'à `harnais-claude-md` (qui rougissait sur le seul
script non nommé ici — le nouveau harnais, désormais nommé ; `SECTIONS` 133 → 135, CAVE-6 n'ayant pas relevé le sien). `WHATS_NEW` **exécuté** : `7.00`,
5 items, icônes `chrono/equipe/euro/personne/graphique` présentes dans le sprite. `v7.59` cinq fois dans `sw.js`, quatre
`v7.00` dans `index.html`. Guide **11** régénéré (`build-guide` : 15 sections). Fiche `MV_AIDE.pilotage` relue : l'entrée
« cherche sa source dans un ordre » disait « hypothèse de projection » pour l'histo — réécrite (lu, non appliqué).
`MV_INFO` : `pil.cadence` (+1 § borne), `pil.exo.salaires` (titre + bureau), `pil.an.budget` (pondération), `pil.presences`
disait DÉJÀ « hors bureau » — c'est le code qui était faux. **Pas de rendu navigateur** : à regarder en admin — Aujourd'hui
et La campagne donnent la même date de fin ; la marge écrit « hors bornes » quand la tuile Budget le dit ; Exercice montre
la pastille bureau et la colonne Travaillées.

### 103e. La note de livraison

**Base : `ae9adbd`.** ⚠️⚠️ **CE LOT A ÉTÉ CONSTRUIT DEUX FOIS.** Livré une première fois sur `a5c978c` en **7.00 / 7.59** ; entre-temps Nico a intégré CAVE-6 (§102, autre conversation) qui a pris **exactement ces deux numéros**. Le second « go » disait *« revérifie tous les fichiers »* : `git pull` a montré le commit `d92de47`, le lot a été **rejoué sur la base neuve** (les fichiers non touchés par CAVE-6 — `pilotage.js`, `planning.js`, guide 11, banc, `package.json` — repris tels quels, `utils.js` re-patché motif par motif, versions **7.01 / 7.60**). La règle d'or n°1, vécue une fois de plus : *un fichier complet livré depuis une base vieille de quelques heures est une bombe à retardement* — et réutiliser 7.00 aurait figé pour toujours les clients passés sur CAVE-6. `.mv-base` regravé sur `d92de47` (il pointait encore sur `f79891c`).
Livré : `src/pilotage.js`, `src/planning.js`, `src/utils.js`, `index.html`, `public/sw.js`, `.mv-base`, `package.json`
(harnais branché dans `check` et `prebuild`), `scripts/mv-harnais-pil-coherence.mjs`, `scripts/harnais-claude-md.mjs`,
`guide/11-pilotage.html` (puis `node scripts/build-guide.mjs`), `CLAUDE.md`.

## 104. ★★★ PIL-EXO + PIL-DIAG — L'EXERCICE EST COUPÉ AU JOUR, ET UNE SEULE LISTE « À COMPLÉTER » (10/09 — APP 7.00 → 7.01 · SW 7.59 → 7.60 · base `ae9adbd`, livré avec §103)

> Sur la maquette `maquette-pil-exercice.html` (deux écrans, curseur « aujourd'hui », avant/après), validée par
> *« go »*. Les deux choix laissés ouverts ont été tranchés par défaut : **un mois entamé est coupé au jour**, et la
> comparaison N-1 passe par **un 3ᵉ argument de `_pexData`**.

### 104a. PIL-EXO — engagé, prévu, à la clôture

**Le défaut** (§103c) : `_pexData` valorisait les douze mois de l'exercice depuis la grille du planning et l'écran
disait « Dépenses de l'exercice 216 k€ · 10 113 h **payées** · ce qui est **sorti** » un 10 septembre. `enCours`
existait et ne servait qu'au mot « en cours ».

- **`_pexData(ex, noCmp, coupeIso)`** : la coupe vaut aujourd'hui (exercice en cours), la clôture (clos : tout est
  engagé), la veille de l'ouverture (futur : tout est prévu), ou la date passée. Chaque segment de paie
  (`_pexSegsTaux`) est **coupé à la coupe** : la part ≤ coupe est engagée (`byM[].sal`, `salT`, `hPaid`), la part
  après est prévue (`byM[].salP`, `salP`, `hPaidP`). `total` reste l'**engagé** — tous les lecteurs existants
  (photos, cadres, budget de l'année, diagnostic) voient ce qui est réel ; `totalP` et `totalClot` sont neufs.
- ⚠️ **Les faits datés s'arrêtent à `dFin = min(coupe, d1)`** — les trois filtres `iso>ex.d1` sont devenus
  `iso>dFin`, et les fenêtres GNR / tracteur / phyto aussi. Ce n'est pas une coquetterie : c'est ce qui permet de
  rejouer l'an dernier **aux mêmes jours**. Un achat daté après aujourd'hui sort de l'engagé ; la Réserve le compte
  toujours.
- ★ **À date comparable** : `cmpDate = _pexData(exP, true, exP.d0 + (coupe − ex.d0))`. Avant, « +20,8 % » comparait
  dix mois de grille à douze mois payés. L'écran porte les deux : *à date comparable* (sorti contre sorti) et
  *exercice complet, prévu compris* — et dit lequel contient du prévu. ⚠️ Sur le domaine d'essai, +236 % à date
  comparable : l'an dernier n'avait pas d'équipe de vendange en septembre. **Le chiffre est vrai, et il dit ce
  qu'il compare.**
- **L'écran** (`_pexEntete`) : quatre KPI quand `enCoursC` — Engagé à ce jour · Prévu jusqu'à la clôture (fond
  hachuré `.pex-prevu`) · À la clôture, engagé et prévu · Contre N-1 à date comparable — et une ligne de cadre
  (« Au 10 sept. : 19 % de l'exercice est sorti… un mois entamé est coupé au jour »). Exercice clos : l'en-tête
  d'avant, intact. Le tableau des postes gagne **Engagé · Prévu · À la clôture** ; la part et le €/ha se lisent à
  la clôture quand il y a du prévu ; la note sous le tableau dit que carburant, achats et réparations n'ont pas de
  prévu. ⚠️ **Cette note était d'abord tombée DANS le `<table>`** : le navigateur la hissait au-dessus du tableau.
  Vu au bac, dans le texte rendu, pas dans le code.
- **Le graphe** (`_pexGraph`) : le prévu hachuré (`<pattern id="pex-hach">`, trait `_PEC_COL.mo`), le trait
  d'aujourd'hui en `_PIL_SEM.aujourdhui` à la fraction du mois, légende « prévu (grille du planning) ».
- **Les salaires** : colonne **Prévues** (à l'exercice en cours), total idem. **Le cadre « Exercice comptable »**
  de L'année : le chiffre reste l'engagé, la ligne dessous nomme la clôture, prévu compris. **La photo Budget** :
  « engagés sur l'exercice · N k€ à la clôture, prévu compris ».
- Trois dates-helpers UTC de bout en bout (`_pexIsoToMs2`, `_pexIsoPlus`, `_pexJourApres`) — la règle de
  `_mvJourApres`, jamais minuit local relu en UTC ; exécutés au harnais sur le 31 → 01 et le 28 févr. → 1ᵉʳ mars.

### 104b. PIL-DIAG — une seule liste

Le doublon `_pilDiag` / `_pecZeros` (§42k) : deux moteurs, deux vocabulaires (« chose à compléter » / « poste
compté pour zéro »), le même taux horaire manquant nommé de deux façons — et le prix du GNR comme les doses phyto
absents du bandeau.

- **`_pilDiag` gagne les trois postes à zéro**, marqués `zero:true` et `poste:` : *Aucun taux horaire* (gravité
  `r` — remplace la ligne « N fiches sans taux » quand il n'y a aucun taux nulle part, qui reste pour le cas
  partiel), *Prix du GNR inconnu* (`cible:'entretien'`), *Doses phyto non structurées* (`cible:'phyto'`, **cible
  neuve** dans `_PIL_DIAG_CIBLES`) ou *N produits sans prix unitaire* (`cible:'reserve'`).
- **`_pecZeros(E)` ne calcule plus rien** : `_pilDiag()` filtré sur `touche:budget`, puis `zero` ; `Z.nBudget`
  compte tout ce qui touche le budget. **`_pecFiabCard`** écrit « 2 des 4 choses à compléter qui touchent ce
  budget » — mêmes libellés, mêmes boutons `data-diag`. Un constat ne peut plus exister dans une liste sans exister
  dans l'autre.
- ★ **`_pilDiag` est mémoïsé le temps d'un rendu** (`_PIL_DIAGC`, oublié par `_pilExoOublier`) : il est désormais
  lu par le bandeau, les photos, la feuille et la carte d'Économie, et il appelle `_pecData` + `_pexData`.
- **Non touché, et dit** : `_pexZeros` (la carte de fiabilité de l'**Exercice**) garde sa liste — planning chargé,
  taux, GNR, prix des achats — ce sont des manques de l'exercice, pas de la campagne. Fusion possible plus tard,
  même patron.

### 104c. Vérifications

★ **Troisième base.** Entre la maquette et le « go », Nico a poussé `ae9adbd` (« package ») : le harnais
`cave-reglages` relevé (le rouge que ce lot avait signalé sur `d92de47` — voir le post-scriptum de §102), `cave6`
branché dans `check`/`prebuild`. **Rejoué une fois de plus** : fichiers repris du stash, `package.json` et `CLAUDE.md`
refaits sur la version de Nico. *Deux pushs en une heure : la fraîcheur se re-mesure avant CHAQUE livraison, pas une
fois par session.*
Harnais `mv-harnais-pil-coherence` étendu : **42/42**, **12 contre-épreuves** rougissent (+3 : `_pecZeros` qui
reprend sa liste, le prévu qui retombe dans l'engagé, N-1 comparé sur l'exercice entier). Bac aux deux dates
(10/09 vendange, 16/11 hiver) : huit onglets, zéro crash, zéro NaN ; Exercice au 10/09 : engagé 40,6 k€ · prévu
175,8 k€ · clôture 216,4 k€ · « 19 % sorti » ; carte d'Économie « 2 des 4 choses à compléter ». `WHATS_NEW`
exécuté : `7.01`, 7 items (5 de §103 + 2). `MV_INFO` : `pil.exo.postes` (coupe, deux comparaisons),
`pil.eco.fiabilite` (la liste du bandeau) ; `MV_AIDE.pilotage` : « La carte de fiabilité » réécrite, entrée
« Économie › Exercice » ajoutée. Guide 11 : un paragraphe Exercice. **Pas de rendu navigateur** : à regarder en
admin — les quatre KPI de l'Exercice, le hachuré et le trait du jour sur le graphe, la colonne Prévues, la carte
« Ce qu'il faut regarder » avec « N des M ».

### 104d. La note de livraison

**Base : `ae9adbd`.** Livré (état cumulé §103 + §104) : `src/pilotage.js`, `src/planning.js`, `src/utils.js`,
`index.html`, `public/sw.js`, `.mv-base`, `package.json`, `scripts/mv-harnais-pil-coherence.mjs`,
`scripts/harnais-claude-md.mjs`, `scripts/banc/garde-projection.mjs`, `guide/11-pilotage.html` (puis
`node scripts/build-guide.mjs`), `CLAUDE.md`. **Ouvert** : la fusion `_pexZeros` ; le bac (jsdom + domaine
synthétique) qui a trouvé les défauts de §103 vit hors du dépôt — le rapatrier en `scripts/bac/` est le prochain
outil qui manque (§103b : *le test qui manque au projet est celui-là*).

## 105. ★★★ PIL-FIN — LA DATE DE FIN D'AUJOURD'HUI EST CELLE DE LA CAMPAGNE (10/09 soir — APP 7.01 → 7.02 · SW 7.60 → 7.61 · base `eb12c01`)

**Point de départ**, mot pour mot : *« Je crois que les 32 jours d'avance sont faux. Vérifie tous les calculs
nécessaires. »* Trois captures : Aujourd'hui (« +32 j d'avance · fin le lun. 15 févr. · 2 411 h · ≈ 97 j ouvrés d'ici
là »), La campagne › renfort (« aucun renfort en plus » : quatre barres rouges fin mars, 16–18 pers·sem), le tableau
des fenêtres (Taille 2,1 · Tirage 1,5 · Brûlage 1,3 « il faudrait » pour 2,8 « déjà là »).

### 105a. Ce qui était vrai, ce qui était faux

- **L'arithmétique était juste.** `_pilWdBetween(15 févr., 31 mars) = 32`. Et **`97` trahissait le départ** :
  `_pilWdBetween(1 oct., 15 févr.) = 97` (depuis aujourd'hui, 112). Le cockpit projetait depuis `fen.debut` = le
  1er jour de la période, alors que « d'ici là » se lit depuis aujourd'hui.
- **La date était fausse, structurellement.** `_pilCapaProj` cumulait **toute** la capacité (`capH`, planning jour par
  jour) contre **toute** la charge à partir du 1er octobre — huit semaines d'équipe créditées à une taille dont la
  fenêtre ouvre le 26 novembre. Sur le graphe de La campagne, ce sont les semaines **hachurées** de novembre
  (« payés sans travail ouvert ») : Aujourd'hui les comptait comme de la taille faite. Il ne déduisait pas les heures
  tracteur (`_rfCtx` les déduit : d'où 2,8 « déjà là » sous une ligne noire à 4,1) et ignorait que trois fenêtres se
  chevauchent. **Échéances par tâche** faisait pire : chaque tâche projetée seule, avec toute l'équipe, depuis le
  1er octobre.
- ★★★ **La leçon de §103, un onglet plus loin.** §103 avait unifié Aujourd'hui et Échéances sur `_pilMargeCalc` — deux
  écrans, un moteur, **le mauvais**. La campagne, elle, avait le bon (`_rfSim` : fenêtres, partage, tracteur) et disait
  le contraire du cockpit sur les mêmes données. *Une seule date par module* ne suffit pas : il faut **une seule
  simulation par question**, et la question « quand est-ce fini ? » est celle du simulateur.

### 105b. Mesuré au bac (fonctions réelles extraites, domaine synthétique calé sur la capture)

2 411 h · 5 puis 4 personnes à 37,5 h · fermeture 24/12 → 3/1 · Réparation 150 h (1–28 oct.), Taille 1 000 h (26/11 →
3/3), Tirage 700 h (3/12 → 17/3), Brûlage 561 h (10/12 → 17/3) · tracteur 1,3 ETP comme la capture.

| moteur | départ | fin | marge vs 31/03 |
|---|---|---|---|
| `_pilCapaProj` (ancien cockpit) | 1er oct. | **19 janv.** | **+51 j** |
| `_pilCapaProj` depuis la 1re fenêtre | 26 nov. | 29 mars | +2 j |
| `_rfSim` tel quel (La campagne, hMax 8, retard +15 %/sem) | fenêtres | **20 juil.** (644 h restantes le 31/3, facteur ×4) | −79 j |
| `_rfSim` capacité normale, sans rallongement — **PIL-FIN** | fenêtres | **11 mai** (580 h restantes le 31/3) | **−29 j** |
| idem sans tracteur | fenêtres | 22 mars | +7 j |
| idem cadence ×1,2 | fenêtres | 12 avr. | −8 j |

Le profil des rouges du bac (4,9 · 4,1 · 13,2 · 10,9 pers·sem) a la forme de ceux de la capture (~17 · 8 · 16 · 18). Sur
les données réelles, non lues, la fin tombe entre mi-avril et début mai.

### 105c. Le lot — et les deux arbitrages

- **`_pilFinPlan(d)`** (pilotage.js) : `_rfCtx(d,'reste',null,{sansTaux:true,sansSel:true})` puis `_rfSim(C,null)` avec
  `C.c = {hMax: hJour, k: 0}` et `tw[].h × k` (facteur de `_pilFacteurK`, ex-bloc k de `_pilCapaProj`, mêmes lignes
  pour les harnais). Fin = `max(taches[].fin)` ; **descente au jour** par `_pilFinJour` (heures consommées de la
  semaine posées sur `_mvCapReelIn` jour par jour, part du tracteur au prorata) ; au-delà du cadre, `_rfSim.apres`
  (semaines prolongées, ajout pur) et le profil de la dernière semaine décalé de 7 j — la convention de `_rfWkEnd`.
  Rend `taches[]` (fin, libellé de semaine, `dep`, `perdu`, `hors`), `resteFin`, `nDep`, `approx`, `finCamp`.
- **`_pilMargeCalc`** lit `_pilFinPlan` ; `seasonJ` depuis **aujourd'hui** ; repli cadence inchangé (départ borné à la
  fenêtre). **`_pilMargeSous`** : *« Si le planning et les contrats restent tels quels, tout est fini le … Comme La
  campagne sans renfort — chaque travail dans sa fenêtre, tracteur déduit — aux heures normales du planning. »* + la
  cadence, + « Au-delà du 31 mars, l'équipe de la dernière semaine planifiée est reconduite ; il restait ~N h », + « N
  travaux débordent leur fenêtre — voir La campagne ». Pastille **`pil.marge`** (MV_INFO, neuve) à côté de « Marge sur
  votre objectif ».
- **`_pilPanelEcheances`** : chaque ligne lit `m.capa.taches` — « fin ≈ 6–12 mai (après la période) · déborde de
  10 sem. » / « perdu » ; « N j » depuis aujourd'hui ; cadre « même calcul qu'Aujourd'hui — La campagne sans renfort,
  aux heures normales ».
- **`_rfCtx(d,mode,cdIn,opts)`** : `opts.sansTaux` (rate=0 — une date ne coûte rien) et **`opts.sansSel`** — le cockpit lit
  l'équipe **déjà sous contrat**, jamais la sélection en cours de La campagne (`_RF_SEL` : « +3 permanents » posés dans
  le simulateur auraient avancé la date d'Aujourd'hui — trouvé en relisant `_rfCtx`, contre-épreuve posée). **`_rfSim`** : `parSem[].resteTot`
  et `apres[]` (ajouts purs ; `_rfProfilSvg` lit `parSem[i<n]`, inchangé). **`_pilCapaProj` supprimé** (un moteur mort
  est une invitation).
- ⚠️ **Arbitrage 1 — capacité normale, sans rallongement.** Nico : *« la fin prévue à la capacité normale, c'est-à-dire
  celle inscrite dans planning… si je ne touche rien à mon planning et mes embauches aujourd'hui, à quelle date les
  travaux seront terminés »*. Donc `hMax = hJour` (pas les 8 h/j que le simulateur s'autorise). Et **`k = 0`** : le
  rallongement du retard (+15 %/semaine hors fenêtre, `_rfCfg().k`) est juste pour **dimensionner un renfort**, absurde
  pour une **date** — mesuré, 644 h restantes le 31 mars finissaient le **20 juillet**, le facteur ayant atteint ×4.
  Ce sont trois écarts **voulus** avec La campagne (heures sup, rallongement, cadence), tous trois écrits dans
  `pil.marge` et dans le guide. *Les rouges de La campagne restent calculés avec le rallongement* : c'est son rôle.
- ⚠️ **Arbitrage 2 — le tracteur déduit tout l'hiver.** Sur la capture, ~1,3 ETP de tracteur sont retirés de
  décembre à mars (ligne noire 4,1, « déjà là » 2,8). `_rfTracEtp` lit `CONFIG.eco.trac_etp` (roue du Pilotage,
  « ETP au tracteur — laisser vide : mesuré sur les sessions de la période ») ; sur une période sans session, seule
  une valeur **forcée** donne 1,3. Une moyenne annuelle appliquée à l'hiver **surestime** la déduction et recule la date
  — c'est **une hypothèse du domaine**, pas un défaut du code, et c'est écrit ici pour que Nico la vérifie. Le lot ne
  la touche pas.
- **Non touché, et dit** : la charge du simulateur = barème × surface × (1 − % fait) par tâche (`cd.taskWindows`), le
  KPI « Charge restante » = `calcHeures().totalReste` ; identiques sur les tâches simples, ils peuvent différer sur une
  tâche à passages dont chaque passage porte son propre h/ha. La dernière semaine fusionnée (8–13 j) sert de profil
  aux semaines prolongées à 7 j près — la convention de `_rfWkEnd`, la même que La campagne.

### 105d. Vérifications

`mv-harnais-pil-coherence` **57/57** (+15 : ⑭ exécute `_pilMargeCalc → _pilFinPlan → _rfCtx → _rfSim` sur une campagne
de 26 semaines, une personne à 37,5 h, 300 h dont la fenêtre ouvre en semaine 8 : fin **semaine 15** et non 7, fin au
**mer. 20 janv.** au jour près, marge 50, jours ouvrés depuis aujourd'hui, tracteur 0,5 ETP → semaine 23, 1 200 h →
« vers le » + 225 h restantes + semaine 31, fenêtre d'une semaine → même fin (pas de rallongement), sans taux
horaire → date quand même, ×1,5 → semaine 19, hors bornes → 15, sélection « +3 permanents » ignorée). ⚠️ Le module
extrait est mis en cache par source : la sélection se pose **après** l'import (`_setSel`), sinon la contre-épreuve
passait verte. Contre-épreuves **17/17** rougissent (+5 : tâche démarrée au 1er jour de la période, tracteur non
déduit, rallongement du retard, heures sup, cockpit qui lit la simulation). `npm run check` : preflight **0 erreur ·
0 avertissement**, tous harnais verts, `garde-projection` 19/19 (`_pilFacteurK` + `_pilFinPlan` en garde de montage),
`harnais-claude-md` SECTIONS 135 → **137** (le script en réclamait un de plus depuis §104). `WHATS_NEW` **exécuté** : `7.02`, 1 item,
icône `chrono`. `v7.61` cinq fois dans `sw.js`, quatre `v7.02` dans `index.html`. Guide 11 régénéré. `MV_AIDE.pilotage`
relue : « Une seule date de fin » ajoutée ; `MV_INFO` : `pil.marge` neuve (posée), `pil.cadence` et `pil.sim.modele`
relues, rien à changer. **Pas de rendu navigateur** : à regarder en admin — Aujourd'hui doit dire une fin en avril
ou mai avec « vers le », un reste au 31 mars et « 3 travaux débordent leur fenêtre » ; Échéances par tâche doit
porter « déborde de N sem. » ; La campagne inchangée.

### 105e. La note de livraison

**Base : `eb12c01`** (« piotage » — PIL-COH intégré ; `.mv-base` pointait encore sur `ae9adbd`, regravé).

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/pilotage.js` | la date de fin, la marge et les « N j » par tâche viennent du simulateur de La campagne ; « vers le », reste au 31/3, débordements ; pastille « i » | — |
| `src/utils.js` | `APP_VERSION 7.02`, `WHATS_NEW`, `MV_INFO pil.marge`, `MV_AIDE.pilotage` | ★ APP |
| `index.html` | 4 × `v7.02` | ★ APP |
| `public/sw.js` | `v7.61`, changelog | ★ SW |
| `guide/11-pilotage.html` | Aujourd'hui + « D'où vient la date de fin » — puis `node scripts/build-guide.mjs` | — |
| `scripts/mv-harnais-pil-coherence.mjs` | ⑤/⑥ suivent `_pilFacteurK`/`m.capa.taches`, ⑭ exécuté, 4 contre-épreuves | — |
| `scripts/banc/garde-projection.mjs` | garde de montage sur `_pilFacteurK` et `_pilFinPlan` | — |
| `scripts/harnais-claude-md.mjs` | SECTIONS 137 | — |
| `.mv-base` | `eb12c01` | — |
| `CLAUDE.md` | §105 | — |

**Ouvert** : rapatrier le bac de §103 et celui-ci (`bac-marge.mjs`, `bac-fin.mjs`, domaine synthétique) en
`scripts/bac/` ; La campagne et Aujourd'hui divergent encore *par construction* quand la cadence mesurée s'applique
(La campagne au barème) — à trancher un jour dans un seul sens.

## 106. ★★★ FUT-LOC — LE FÛT LOUÉ EXISTE, ET L'EXERCICE LE COMPTE

**Base** `37670f5` (PIL-FIN) · APP 7.02 → **7.03** · SW 7.61 → **7.62** · 10/09/2026

> ⚠️ **Ce lot a d'abord ete livre sur une base perimee (`eb12c01`) et a ECRASE PIL-FIN**
> sur six fichiers : `pilotage.js`, `utils.js`, `sw.js`, `CLAUDE.md`, `harnais-claude-md.mjs`,
> `mv-harnais-pil-coherence.mjs`. Il a servi APP 7.02 / SW 7.61, deja pris par PIL-FIN.
> Il est ici **rejoue par-dessus PIL-FIN**, en 7.03 / 7.62. Voir §107 pour la cause.

### Le défaut de départ : une promesse écrite deux fois, tenue zéro

Deux textes de l'application affirmaient, mot pour mot, que la location de fûts entrait
dans l'exercice comptable :

- `pilotage.js` — la carte « Ce qui n'entre pas dans ce total » : *« la location de fûts,
  elle, entre : c'est un loyer qui revient tous les ans, pas un fût »* ;
- `utils.js` — la fiche d'aide `pil.exo.postes` : *« une location de fûts, elle, entre :
  c'est un loyer annuel »*.

Or `INTRANTS.futs[]` valait `{id, four, ref, annee, qte, date, prix}` : **aucun champ ne
permettait de dire qu'un lot était loué**, et `_pexData` ne lisait pas une seule fois
`INTRANTS.futs` (vérifié : zéro occurrence de `futs` dans le corps de la fonction). Le
domaine pouvait payer un loyer tous les ans sans qu'un euro n'apparaisse nulle part.

⚠️ **La leçon générale.** Un texte d'écran est une spécification que personne ne teste. Ici
il a survécu à plusieurs lots en décrivant un comportement inexistant. Quand une carte
explicative annonce une règle, la règle doit avoir un test — sinon c'est de la
documentation d'intention.

### Le modèle

`mode` sur le lot : `'achat'` (défaut, rétro-compatible — un lot sans `mode` est un achat)
ou `'loc'`.

| mode | champs portés | champs interdits |
|---|---|---|
| `'achat'` | `prix` (total HT du lot), `dfact` (date de facture), `fact` (n°) | `loyer`, `debut`, `fin` |
| `'loc'` | `loyer` (**HT par fût ET par an**), `debut`, `fin` | `prix`, `dfact` |

`_rsvSaveFut` n'écrit **que** les champs du mode retenu et met les autres à vide : laisser
un loyer sur un lot acheté, c'est un chiffre mort qu'un lecteur finirait par croire.

⚠️ **`loyer` est par fût, pas par lot.** Rendre deux fûts en cours de contrat doit faire
baisser le loyer sans qu'on retouche le contrat.

### L'assiette du loyer n'est PAS `qte`

`INTRANTS.futs[].qte` ne compte que les fûts **libres** : dès qu'un fût part en cuvée il
vit dans `CAVE_ELEVAGE` (`_mvFutEnVin`). Facturer sur `qte` seul reviendrait à **ne payer
que les fûts vides**.

`_mvFutAssiette` apparie donc le lot avec les fûts en vin, sur le triplet `four/ref/annee`,
par `_mvFutMemeLot` — la même égalité que partout, jamais une seconde définition.

⚠️⚠️ **Si deux lots partagent le triplet, on ne devine pas** : l'assiette retombe sur les
fûts libres et le lot ressort `ambigu:true`, que l'écran dit. Répartir les fûts en vin
« au prorata » aurait donné un chiffre plausible et faux, avec l'autorité d'une mesure.

### Le prorata

`_mvFutLoyerLot` intègre **jour par jour** sur l'intersection [contrat] ∩ [fenêtre]. La
quantité d'un jour passé est remontée en arrière depuis aujourd'hui : `q(t) = détenu
aujourd'hui − Σ signée des mouvements postérieurs à t`, lus dans `fut_mouv`.

```js
var MV_FUT_DETENTION = {achat:1, vente:-1, retour:-1, destruction:-1};
```

⚠️ **`entonnage` et `embouteille` n'y sont pas** : ils *déplacent* un fût, ils ne
l'ajoutent ni ne le retirent. Les compter ferait tomber le loyer à zéro dès l'entonnage.

⚠️ `_mvFutTracer` date ses entrées **au jour de la saisie**, pas au jour du fait. Un retour
noté trois jours plus tard décale le loyer de trois jours — quelques euros. Écrit ici pour
ne pas être redécouvert.

⚠️ **Le mois se calcule en rejouant le moteur sur la fenêtre du mois**, jamais en divisant
l'année par douze : un contrat qui démarre en septembre ne coûte rien en août.
L'intégration est additive — le harnais le prouve (somme des 12 mois = exercice).

### Le fût acheté : deux valeurs, et pas d'amortissement

`CONFIG.eco.futs_trait` : `'hors'` (**défaut** — aucun chiffre existant ne bouge chez un
domaine qui ne touche à rien) ou `'achat'` (compté en entier à la date de sa facture).

⚠️ **IL N'Y A PAS DE TROISIÈME VALEUR, ET C'EST UNE DÉCISION.** Étaler un fût sur cinq ans,
c'est un amortissement : le travail du bilan, pas celui d'une appli de vigne. Un
amortissement approximatif affiché à côté d'une masse salariale exacte donnerait à
l'ensemble l'autorité d'un compte de résultat qu'il n'est pas. Ne pas le réintroduire sans
rouvrir cette question-là.

⚠️ **La location n'a pas de réglage** : un loyer est une charge de l'année où il est dû.

⚠️⚠️ **`_ecoCfgSet` passait TOUT par `_ecoNum`**, qui rend `0` sur du texte. `futs_trait`
est une **chaîne** : écrite par le chemin numérique, elle valait 0, le lecteur retombait
sur son défaut, et le réglage avait l'air de ne pas prendre — **sans une seule erreur nulle
part**. Une liste blanche `_ECO_TXT` énumère désormais les valeurs autorisées. C'est le
quatrième fichier du lot, apparu à la lecture et non au plan.

### Deux signaux, deux gestes

Un fût **acheté** en fin de vie se **réforme**. Un fût **loué** en fin de contrat se
**rend**. Le même compteur pour les deux donnait un ordre faux.

`_mvFutParc` rend désormais `aReformer` **net des loués**, plus `loc[]`, `locQte`,
`aRendre` et `preavis` (`CONFIG.cave.futs_preavis`, défaut **90 jours** — pas de réglage
d'écran dans ce lot).

⚠️ Le loué **reste dans la pyramide des âges et dans la part des anges** : il travaille
comme les autres. `lignes[].reforme` reste un drapeau d'ÂGE par année, que la pyramide
colore ; seul le NOMBRE à réformer est net de location.

### Trois états, partout

`absent` / `zéro` / `montant` — la même règle que les prix, deux fois enfreinte :

1. `_rsvSaveAchat` écrivait `prix:parseFloat(…)||0`. Un achat sans prix valait **0**, donc
   « sans frais » dans Achats — un état délibérément distinct de « à chiffrer » — et
   n'apparaissait **jamais** dans le filtre des lignes à chiffrer. Le commentaire du modèle
   disait pourtant déjà « ABSENT à la livraison » : **le fichier se contredisait lui-même**.
   `_rsvPrixOuNull` remplace le motif.
2. `_mvFutLoyerLot` lisait `Number(f.loyer)`. `Number(null)` vaut **0** : un contrat sans
   loyer passait pour une location **gratuite**, 0 € facturé et rien dans « à compléter ».
   Trouvé par le harnais, pas à la lecture.

### La fusion silencieuse des lots est retirée

Saisir un réassort identique grossissait le lot existant **sans toucher ni sa date ni son
prix** : la seconde commande était comptée au prix de la première, et datée de son année.
Deux factures = deux lots. `_futSameLot` (reserve.js) n'a plus d'appelant et a été
supprimé — une fonction morte est une invitation ; l'égalité « même lot » vit dans
`_mvFutMemeLot`.

### L'écran Achats

Quatrième source (`futloc`). Le loyer y figure **en lecture seule** : il est connu le jour
de la signature, il vit sur le contrat. `_pachOpen` refuse une ligne `ro` et renvoie vers
La Réserve. Motif : une ligne en lecture seule porte un montant **calculé** ; l'écrire ici
en ferait une saisie qui contredirait le contrat dès le lendemain.

⚠️ **L'écran n'était borné par aucune date** : son « Total chiffré » couvrait tout
l'historique du domaine, posé à côté d'un total d'exercice. Deux nombres voisins qui ne
pouvaient QUE diverger. `_PACH_PER` ('exe' par défaut) le borne — **en sortie de
`_pachLignes` et nulle part ailleurs**, parce que `_pachOpen` relit la même liste et
qu'une ligne filtrée d'un côté mais pas de l'autre rendrait « ligne introuvable » sur un
bouton visible.

### `_pexZeros` mesurait un trou sans le dire au bon endroit

`nRepSansPrix` était calculé et affiché deux fois plus bas, mais **absent de la seule liste
qu'on lit pour savoir quoi compléter**. Ajouté, avec les lots de fûts sans prix et les
contrats sans loyer.

### Ce que les tests ont appris

Quatre assertions ont rougi sur ce lot. **Les quatre avaient tort, pas le code** — trois
épinglaient un littéral de source, une cherchait un mot :

| Harnais | Ce qu'elle épinglait | Ce qu'elle teste maintenant |
|---|---|---|
| `mv-harnais-ateliers` | `var total=salT+gnrT+achT+repT;` (point-virgule compris) | la **présence** de chaque terme |
| `mv-harnais-achats` | la même expression, dans `pilotage.js` | idem |
| `mv-harnais-achats` | la liste exacte des champs de `futs: []` | que le modèle **nomme** ses champs |
| *(la mienne)* | le mot « amorti » dans la source | `_PEX_FUT_TRAIT` à deux valeurs + aucun `futs_vie` dans le moteur |

⚠️ **Un test de source épingle ce qu'il veut prouver, jamais la ligne qui l'entoure.** Et
il ne cherche pas un MOT : « amorti » figure légitimement dans le texte utilisateur qui
explique qu'il n'y a **pas** d'amortissement — le test rougissait sur la phrase qui
documente la décision.

Le cinquième rouge (`⑫ les faits datés s'arrêtent à dFin`) comptait **3** filtres et en a
**4**. Ce nombre-là est un vrai cliquet — un filtre retiré le ferait mordre — donc il est
relevé, jamais assoupli en `>=`.

**Deux fiches d'aide écrites puis retirées** : `rsv.futs.mode` et `rsv.futs.signaux`. La
Réserve n'utilise pas `MV_AIDE` (38 fiches, aucune côté Réserve) — elles n'auraient eu
aucune porte. Le contenu est passé en texte inline dans le formulaire et sur la carte du
parc.

### Fichiers du lot

`src/utils.js`, `src/reserve.js`, `src/pilotage.js`, `src/reglages.js`, `index.html`,
`public/sw.js`, `scripts/mv-harnais-ateliers.mjs`, `scripts/mv-harnais-achats.mjs`,
`scripts/mv-harnais-pil-coherence.mjs`, `CLAUDE.md`.

**Ouvert** : pas de réglage d'écran pour `futs_preavis` (constante à 90 j) ; le guide
`guide/` ne décrit pas encore le champ acheté/loué ; `demarrage.html` non touché.

## 107. ★★★ PORTES — LA CHAÎNE LOCALE ET LA CHAÎNE CI SONT LA MÊME PORTE

**Base** `37670f5` (PIL-FIN) · aucun bump propre (`scripts/`, `package.json`) · 10/09/2026

### Le défaut : deux portes, et personne ne le savait

Le push échouait « pratiquement à chaque fois », sur une porte différente à chaque lot :
`lint-cliquet` (`no-redeclare`), `lint-vocabulaire`, `mv-whatsnew-check`… Corriger l'erreur
du jour ne réglait rien, parce que **l'erreur n'était pas le défaut**.

Mesuré, pas supposé : `.github/workflows/ci.yml` lançait **25** invocations
`node scripts/…`, `npm run check` en lançait **46**, et **quatorze** de la première liste
étaient absentes de la seconde :

```
harnais-demo.mjs · harnais-demo-contre.mjs · lint-cliquet.mjs · lint-vocabulaire.mjs
mv-chartes-doc.mjs · mv-harnais-carte.mjs · mv-harnais-entretien.mjs
mv-harnais-icones-contre.mjs · mv-harnais-vignoble.mjs · mv-whatsnew-check.mjs
mv-harnais-carte-parcelle.mjs --contre · mv-harnais-confidentialite.mjs --contre
mv-harnais-globaux.mjs --contre · mv-harnais-pic-avenir.mjs --contre
```

⚠️ **Le poste ne pouvait pas voir ce que le push allait trouver.** Un lot passait vert en
local *par construction* : la porte locale ne contenait pas la porte du CI. Les quatre
`--contre` manquantes sont le cas le plus dur — ce sont les contre-épreuves, la moitié qui
prouve qu'un harnais mord.

### La correction du jour, et celle qui compte

Les 14 sont ajoutées à `check` **et** à `prebuild` (61 invocations chacune, identiques).
Deux portes rapides passent **en tête**, juste après `mv-base` : un `no-redeclare` doit
coûter dix secondes, pas la chaîne entière.

Mais ajouter 14 lignes ne ferme que le trou du jour. `scripts/mv-harnais-portes.mjs` ferme
le **prochain** : il parse `ci.yml` et `package.json`, et assère

- **CI ⊆ check** — toute étape ajoutée au CI sans pendant local rougit sur le poste ;
- **check ≡ prebuild** — les deux chaînes locales restent jumelles ;
- `lint-cliquet` est bien dans la chaîne locale (la porte qui a fait échouer le plus de
  push).

L'inverse (check ⊄ CI) reste **légitime** : `mv-base`, le banc et `harnais-claude-md` n'ont
de sens qu'en local. La liste `CI_SEUL` est **vide** et toute entrée future s'y justifie en
commentaire — sinon c'est le trou d'hier qui revient sous un autre nom.

⚠️ **Coût mesuré** : la chaîne passe à ~123 s, dont ~50 s pour `mv-harnais-icones-contre`
et ~9 s pour `lint-cliquet`. C'est le prix d'une porte unique. Le CI les payait déjà.

### Le défaut qui a déclenché tout ça

`src/pilotage.js` — `var _pv` dans le bloc `pachper` de la délégation de clic, alors qu'un
`var _pv` existait quatorze lignes plus haut dans le bloc `sub`. Même fonction, même portée.

⚠️ **`const` et non `var` dans cette délégation.** C'est UNE fonction de plusieurs centaines
de lignes où chaque lot ajoute son `if(_pa===…)`. Avec `var`, deux lots qui choisissent le
même nom court se marchent dessus ; avec `const`, chacun reste dans son bloc `{}`. La règle
vaut pour toute nouvelle branche de cette fonction.

### Fichiers

`package.json`, `scripts/mv-harnais-portes.mjs` (nouveau), `scripts/harnais-claude-md.mjs`
(cliquet SECTIONS), `src/pilotage.js`, `CLAUDE.md`.

**Ouvert** : aucun garde ne vérifie que le CI ne *retire* pas une étape ; et `--contre`
n'est pas systématique — plusieurs harnais en ont une que ni le CI ni `check` n'appellent.

### ★★★ CE QUI A VRAIMENT COUTE LE PLUS CHER : UNE LIVRAISON SUR BASE PERIMEE

Le 10/09, deux lots (FUT-LOC puis PORTES) ont ete construits sur `eb12c01`. **PIL-FIN a ete
pousse entre le clone et la livraison.** Les fichiers livres etant COMPLETS, ils ont ecrase
PIL-FIN sur six fichiers, en silence :

```
94555e6  nobug          <- PORTES
fa13dc3  achatcave      <- FUT-LOC
37670f5  pikotagedelia  <- PIL-FIN, POUSSE APRES LE CLONE
eb12c01  piotage        <- la base des deux lots
```

`_pilFacteurK` et `_pilFinPlan` avaient disparu de `pilotage.js`, revenu a `_pilCapaProj`.
La §105 de PIL-FIN avait ete remplacee par une autre §105. APP 7.02 et SW 7.61 etaient
servis DEUX FOIS avec des `index.html` differents. Seul temoin restant : le garde
`scripts/banc/garde-projection.mjs`, qui reclamait des fonctions supprimees.

⚠️⚠️ **AUCUN CLIQUET N'A MORDU, ET IL FAUT COMPRENDRE POURQUOI.**

- `mv-base.mjs` verifie que `.mv-base` est **commite**, pas qu'il est **le dernier**.
  `eb12c01` etait bien HEAD au moment du clone : le garde n'avait rien a dire.
- `harnais-claude-md.mjs` n'a pas vu la section disparaitre parce que **le lot livrait
  `CLAUDE.md` ET son cliquet `SECTIONS` ensemble** : le cliquet a ete regrave en meme temps
  que le contenu baissait. C'est precisement ce que ce document interdit ailleurs — *ne
  jamais regraver pour faire taire un rouge*. Un cliquet livre avec ce qu'il surveille ne
  surveille rien.

⚠️ **La regle qui aurait tout evite est ecrite deux fois ici** : *`git fetch` avant
d'integrer est obligatoire*. Elle ne suffit pas : il faut **re-cloner ou `git pull` juste
avant de PRODUIRE les fichiers finaux**, pas seulement avant de les integrer. Un fichier
complet est une photographie ; livrer une photographie perimee, c'est reverter tout ce qui
a bouge depuis, sans conflit et sans bruit.

**Ce qui manque encore** (ouvert, non fait dans ce lot) : `mv-base.mjs` devrait rougir
quand `git fetch` montre le distant en avance sur `.mv-base` ; et un garde devrait refuser
un lot qui livre `CLAUDE.md` et `harnais-claude-md.mjs` ensemble sans que le nombre de
sections MONTE.


## 108. ★★★ VIG-TRI + VIG-TACHE — LA PARCELLE COMMENCÉE PASSE EN TÊTE, ET CRÉER UNE TÂCHE TIENT DANS UN ÉCRAN

**Base** `cefd52d` · **APP 7.03 → 7.04 · SW 7.62 → 7.63** · 10/09/2026

⚠️ **Le lot a été construit deux fois.** Il l'avait été sur `94555e6` en APP 7.03 / SW 7.62 ; PIL-FIN
(§105) est arrivé entre-temps et a pris ces deux numéros. Rejoué tel quel sur `cefd52d` en **7.04 /
7.63** — `src/app.js` et `src/reglages.js` n'étaient pas touchés par PIL-FIN, seuls les quatre
affichages de version, `WHATS_NEW`, l'en-tête du SW et le cliquet `SECTIONS` ont dû suivre. C'est la
troisième fois (cf. §103) : **un lot qui n'est pas poussé le jour même se rejoue, il ne se recolle
pas.**

Deux demandes de Nico en un message : *« lorsqu'une tâche dans vigne est commencée (marquée début)
il faut mettre la parcelle en haut de la liste »* et *« il faut revoir comment créer une tâche dans
une saison et qui n'appartient pas à une convention, car il faut faire beaucoup de va-et-vient »*.
Les deux étaient des défauts, pas des préférences.

### ① Le tri disait l'inverse de ce qu'on voulait, et ne voyait pas la moitié des tâches

`renderParcelles`, comparateur : `const ordre={'Non démarré':0,'En cours':1}`. **Commencé valait 1,
donc DERNIER.** Le commentaire au-dessus — « Non démarré > En cours » — décrivait fidèlement un tri
que personne ne voulait : il était juste, et c'est la règle qui était fausse.

⚠️ **Et sur une tâche à passages ou à niveaux, l'état ne comptait pas du tout.**
`_tachesFor(p)[tâche]` y rend un **objet** (`{p1:'Commencé', ov:null}`) : `ordre[objet]` vaut
`undefined`, ramené à 0 par `??0` **des deux côtés**. Relevage et Ébourgeonnage n'ont jamais été
triés par leur état, depuis toujours, en silence.

**La règle posée** : la parcelle dont l'étape courante est commencée passe en tête, **au-dessus de
la tournée du domaine ET de la proximité GPS**. Le commentaire de la tournée disait que le GPS
« gagne toujours » : il ne gagne plus. Appuyer sur « Début » est un geste **explicite** sur une
parcelle précise ; la tournée et le GPS sont des rangements automatiques. Le geste gagne, et il ne
dure que le temps du travail — la parcelle quitte la tête à la validation.

★ **L'état se lit par `_pvCurStarted` / `_pvCurDone`**, les fonctions qui décident déjà de
l'affichage des boutons « Début » et « Valider ». Une seconde table d'états aurait fait deux vérités
pour une même question — la faute de §47a. Les trois natures de tâche (simple, passages, niveaux) se
trient désormais pareil, et l'étape courante compte. Ce qui reste à faire passe avant ce qui est
fait, à la place de l'ancienne table.

### ② Une tâche créée hors convention disparaissait au moment où on l'enregistrait

`saveTache()` poussait l'entrée dans `TACHES` **et rien d'autre**. L'écran lit `getTachesSaison()`,
filtré par `s.taches` de la période. Une tâche libre n'appartenant à aucune période **sortait de la
liste à la seconde où on la créait**. Il fallait ensuite Réglages › Campagne › Modifier la période
pour la cocher — puis **rouvrir** la même période pour saisir ses dates, `_esEchTasks` n'étant
construit qu'à l'ouverture. Mesuré : **4 écrans, 2 allers-retours, 1 disparition silencieuse**.

⚠️⚠️ **`tcfgSave()`, lui, posait la tâche dans la période consultée.** Deux chemins pour un même
effet, dont **un seul le faisait** : c'est la forme exacte du défaut, pas son symptôme.

**`_perPoseTache(nom, périodes, dates)` est désormais l'écrivain UNIQUE** de l'appartenance d'une
tâche à une période — et il pose les échéances dans le même passage. `_tcfgApply()` est l'écrivain
unique de l'entrée `TACHES` ; `tcfgSave()` n'est plus qu'un appelant et n'écrit rien en base
lui-même.

**Un seul bouton, `＋ Nouvelle tâche`.** Les deux portes (« selon le barème » / « libre »)
obligeaient à choisir sa source *avant* de savoir si le travail existe dans la convention — c'est au
champ de recherche de répondre. Le panneau : le travail (recherche dans le barème, sinon création du
travail du domaine), ses heures (mêmes contrôles que `_tcfg`), et **les périodes avec leurs dates**,
celle qu'on consulte cochée d'avance. Refus explicite si aucune période n'est cochée — sans elle la
tâche n'apparaît nulle part, et c'était précisément le piège.

⚠️ **Le barème reste consultable depuis ce panneau** (`Voir le barème de la convention et vos
écartements`) : c'est le seul écran où se choisissent le **barème régional** et les **écartements de
plantation**. Supprimer son bouton sans ce lien aurait fermé cette porte — `MV_AIDE` et
`guide/04-vigne.html` la nommaient tous les deux.

★ **Nouvelle branche dans `_tcfgApply`** : un travail hors catalogue n'avait **ni `saisons` ni
`anytime`** (le `else if(c)` ne le couvrait pas). Sans étiquette dans la liste, et introuvable par le
repli `_tachesSaisonLegacy`.

③ `_esBuildEch()` — dans « Modifier la période », cocher une tâche ouvre sa ligne de dates **tout de
suite**. ⚠️ Le rebuild **relit d'abord ce qui est saisi à l'écran** : repartir de `s.echeances`
effacerait les dates tapées à l'instant.

### Le harnais

`scripts/mv-harnais-vigne-tri.mjs` (**18 assertions + 4 contre-épreuves**), branché sur `check`,
`prebuild` **et** la CI — la porte unique de §107. Il exécute le vrai comparateur extrait d'`app.js`
et le vrai `_perPoseTache` extrait de `reglages.js`.

⚠️ **Deux assertions textuelles ont rougi à tort** : elles cherchaient l'ancienne table dans tout
`app.js`, et la section du lot la **cite en commentaire**. Corrigé en testant le comparateur **privé
de ses lignes de commentaire** — un grep brut compte les commentaires (§53a), vécu une fois de plus.

⚠️ Un `catch{}` vide posé sur le `focus()` du champ de recherche a fait monter le cliquet C14. Retiré
plutôt que journalisé : `setSelectionRange` sur un `input[type=text]` ne demande pas de filet, et un
catch vide est une erreur avalée pour rien.

### Fichiers

`src/app.js`, `src/reglages.js`, `index.html`, `src/utils.js` (APP_VERSION, WHATS_NEW, MV_AIDE),
`public/sw.js`, `guide/04-vigne.html` + `public/guide.html` régénéré,
`scripts/mv-harnais-vigne-tri.mjs` (nouveau), `package.json`, `.github/workflows/ci.yml`,
`scripts/harnais-claude-md.mjs` (cliquet SECTIONS), `.mv-base`, `CLAUDE.md`.

Retirés avec leurs appelants : `saveTache`, `openOvTache`, `addTacheFromCatalogue`,
`showOvTacheForm`, `showOvTacheCatalog`, et les cinq lignes d'exposition d'`app.js` qui les nommaient
— **elles étaient déjà mortes** (`typeof` sur des identifiants d'un autre module).

**Ouvert** : sur « Toutes tâches » il n'y a pas de tâche courante, donc pas de remontée — décision
assumée, le bouton « Début » n'y existe pas non plus. `demarrage.html` ne décrit toujours pas la
création d'une tâche. La carte (`refreshMapColors`) ne signale pas la parcelle commencée.

## 109. ★★★ CUV-7 — LA TOURNÉE DU CUVIER, ET LE RELEVÉ QUI N'A PAS DE DENSITÉ (11/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` · APP 7.04 → 7.05 · SW 7.63 → 7.64 · base `82f87ee`)

**Le geste.** Quinze cuves en fermentation, un téléphone tenu d'une main, debout au milieu du
cuvier. L'écran Cuves demandait **par cuve** : ouvrir la feuille, saisir, enregistrer, fermer.
Quinze fois. La **Tournée** est un 4ᵉ onglet qui met les cuves actives l'une sous l'autre, deux
champs chacune, et **enchaîne les champs au clavier** — T° → densité → cuve suivante — sans jamais
refermer le clavier virtuel.

★★ **L'ORDRE DES ONGLETS SUIT TOUJOURS CAVE-6** : Maturités → Récoltes → Cuves → **Tournée**, du
plus amont au plus aval. ⚠ **L'onglet d'arrivée reste `cuves`** : on n'atterrit pas dans un écran
de saisie. La clé neuve est `tour` ; aucune clé existante n'a bougé.

★★★ **LES QUATRE RÈGLES DE L'ÉCRAN, à connaître avant d'y toucher** :
① **Aucun re-rendu pendant la saisie.** Reconstruire la liste à chaque frappe ferait perdre le
focus et refermerait le clavier — le seul défaut qui rendrait l'écran inutilisable sur le terrain.
`_vtIn` ne touche que les classes de la ligne et le HTML des pastilles.
② **Un relevé par cuve et par jour.** `openOvVendMesure` EMPILE un relevé à chaque enregistrement ;
en tournée, corriger une faute de frappe aurait posé un deuxième point sur la même date. `_vtEcrire`
cherche le relevé du jour (`_vtMesJour`) et le MET À JOUR — quel que soit l'écran qui l'a écrit.
③ **Jamais un vide sur une valeur.** Un champ laissé vide veut dire « je n'ai pas saisi », pas
« efface ». `_vtEcrire` n'impose que ce que la tournée porte (`densite`, `temp_c`, compteurs, `qui`) —
la `note` écrite ailleurs survit. C'est l'invariant « `Object.assign` puis imposer », appliqué à un
objet existant plutôt qu'à un objet reconstruit.
④ **Une écriture, différée de 1,2 s.** `_vendFbSave` réécrit **tout** le document `cave_vendange` :
une écriture par frappe, c'est des centaines de documents complets par tournée. `_vtPlan` réarme une
minuterie, `_vtEcrire` écrit une fois. Message vide (§68) : un succès ne dit rien, un échec parle.

⚠⚠⚠ **LE DURCISSEMENT INDISSOCIABLE — `_vendLastD`.** La tournée permet un relevé qui ne porte
**qu'une température ou qu'un compteur de pigeages** : `densite` y est absente. Quatre consommateurs
lisaient `_vendLastMes` et calculaient dessus. Trouvés en relisant, avant écriture :
- `_vendFaPct(_vendMesD20(last))` à **3 endroits** (ligne, cellule du plan, sélecteur de fusion) →
  une cuve suivie depuis trois semaines affichait **0 %** parce qu'on avait pigé le matin ;
- `_vendSparkline` ne filtrait pas → `Math.min` avalait un `null` comme 0 et **écrasait la courbe**
  (`_vendFermSvg`, lui, filtrait déjà : le filtre existait, à un seul des deux endroits) ;
- la tuile « densité à 20 °C » du détail affichait **NaN** ;
- `_mlProjFA` prenait `m[m.length-1]` et rendait `attente` sur une cuve pleine d'historique.
★ **`_vendLastD(c)` = le dernier relevé QUI PORTE UNE DENSITÉ.** Règle générale :
**`_vendLastMes` pour DATER, `_vendLastD` pour CALCULER.**

★ **L'intervention groupée** (bouton flottant → feuille) écrit **une opération par cuve retenue**,
chacune sur **`_vendIntrVol(c)`** — son volume propre, avec sa source (`mesure` / `estime`).
⚠⚠ **Jamais un volume commun** : c'est exactement la faute de RDT-1, une dose juste sur un volume
faux donne une quantité fausse affichée avec l'aplomb d'un calcul. Chaque opération reste
corrigible depuis sa cuve, comme si elle avait été saisie à la main.

★ **L'intervenant** (`qui[]` sur le relevé) comble le manque n° 9 du backlog : Le Cuvier ne
l'enregistrait nulle part. Il se choisit une fois pour toute la tournée.

★★ **Harnais `scripts/mv-harnais-cuv7.mjs`** — 20 assertions sur les **vraies** fonctions extraites
de `cave.js`, dont **3 contre-preuves** (empilement, vide écrasant, `_vendLastD` dégradé en
`_vendLastMes`) qui doivent rougir. ⚠ **Les dates du jeu d'essai sont RELATIVES à aujourd'hui** :
écrites en dur, elles ont collisionné avec la date du jour et fait rougir un code juste — le test
était faux, pas le code (7ᵉ fois).

⚠ **Décision d'accompagnement prise au lot, pas différée** : `MV_AIDE.cave` portait « les trois
onglets » — corrigé, plus 5 entrées neuves ; `guide/08-cave.html` a sa carte Tournée. **La visite
guidée n'a rien à corriger** : ses deux moments Cave portent sur « Aujourd'hui » et Le Chai, et la
phrase « Le Cuvier et la vendange cuve par cuve vous attendent dans les écrans » reste vraie.

⚠ **`cave.js` passe de 855 ko à 896 ko.** Le seuil de §20 est franchi de plus belle : le prochain
lot du Cuvier doit poser la question d'un `cave-tournee.js` séparé (coût : un bump APP + SW).

---

## 110. ★★★ CUVGR-3 — L'INFOBULLE TACTILE VIT DANS LE SOCLE, ET L'ÉCHAPPEMENT DES GRAPHES N'EXISTAIT PAS (11/09 — APP 7.05 → 7.06 · SW 7.65 → 7.66 · base `d2efe12`)

### 110a. Le geste

Un graphe rend une **image** : sur un téléphone, la valeur exacte d'un point n'est lisible nulle
part — il faut descendre dans la liste des relevés. Un appui sur la courbe ouvre une étiquette.

★ **UN GRAPHE S'Y INSCRIT SEUL.** `_mvGraphTouch` et `_mvGraphHit` vivent dans `utils.js` ; un
graphe s'inscrit en émettant des `<rect class="mvg-hit" data-tt="…">`, et `_mvGraphDessine` câble le
reste **après chaque peinture** (l'écouteur une seule fois sur la boîte, qui survit à `innerHTML` ;
l'infobulle recréée, puisque les enfants viennent d'être effacés). *Les quatorze graphes qui n'en
émettent pas ne changent pas d'un octet* — c'est ce qui rend un lot de socle sûr.

★ **Une colonne de touche par relevé, bord à bord.** Viser un point de 3 px au doigt est
impossible ; viser la bande verticale qui le contient ne demande rien. Un creux entre deux colonnes,
c'est un doigt qui tombe dans le vide — le harnais compte les creux.
⚠ **Émises EN DERNIER** : un `<rect>` posé avant la courbe serait recouvert et n'attraperait plus
rien.
⚠ Les coordonnées sont en unités de `viewBox` ; la boîte peut être plus étroite. L'infobulle
applique le rapport `clientWidth / viewBox.width`, sinon elle se pose à côté du point sur un écran
qui a rétréci.
⚠ `sansTouche` pour le **cahier de cuverie** : rien d'invisible sur du papier.

### 110b. ⚠⚠ CE QUE ÇA NE FAIT PAS, ET C'EST UNE DÉCISION

Le `<svg>` garde `role="img"` et son `aria-label`. Les zones sont **`aria-hidden`** : elles n'entrent
pas dans l'arbre d'accessibilité. Rendre chaque point focalisable ajouterait vingt arrêts de
tabulation par graphe et quinze graphes par écran — *un lecteur d'écran y perdrait plus qu'il n'y
gagnerait.* L'`aria-label` porte déjà le résumé ; la **liste des relevés** sous le graphe reste la
source accessible, et le guide le dit. À rouvrir si un utilisateur au clavier le demande.

### 110c. ★★★ TROUVÉ EN CHEMIN, ANTÉRIEUR AU LOT : UN GARDE QUI NE GARDAIT RIEN

`_mvGraphSvg` échappait son `aria-label` ainsi :
`var e = (typeof window._escHtml === 'function') ? window._escHtml : function(x){ return String(x); };`

★★★ **`window._escHtml` n'est assigné NULLE PART dans l'application.** Six endroits le lisent
derrière ce `typeof`, tous retombent sur `String(x)`. L'`aria-label` d'un graphe n'a donc **jamais**
été échappé — alors que le commentaire d'à côté affirme *« l'echappement est fait ici »*. Une cuve
nommée `Cuve "Haute"` refermait l'attribut.

*Un garde qui ne garde rien est pire qu'une absence de garde : il se lit comme une protection, et
personne ne revient vérifier.* Même famille que le 29 de §109 (CUVGR-1, non intégré) et que l'aide
des Courbes : **un commentaire qui décrit une intention, pas le code.** Le socle porte désormais son
propre `_mvEsc` — il ne dépend plus d'un global optionnel pour être correct.

Le défaut est sorti parce que `data-tt` porte du HTML **avec des guillemets** : le premier
`class="t"` refermait l'attribut et coupait l'infobulle en deux. Sept assertions rouges, **une seule
cause**.

### 110d. Vérifications

`mv-harnais-cuvgr3.mjs` (neuf) — **31 assertions vertes, 6 contre-épreuves rouges** (zones émises
avant la courbe, colonnes disjointes, zones dans l'arbre d'accessibilité, papier avec zones,
infobulle non échappée, guillemet non échappé dans `_mvEsc`) · `mv-harnais-cuvdoc`,
`mv-harnais-cuv7`, `mv-harnais-courbes`, `mv-harnais-agenda`, `mv-harnais-cave-auj`,
`mv-harnais-parcours`, `mv-harnais-releve`, `mv-harnais-cave6`, `mv-harnais-echelle`, `preflight`
verts · `WHATS_NEW` 7.06 **exécuté** · `v7.66` 5 fois dans `sw.js` · guide régénéré.

⚠ Une contre-épreuve a été **jetée parce qu'elle ne mordait pas** : redéléguer `_mvEsc` à
`window._escHtml` ne casse rien, puisque le global n'existe pas et que le repli reste le bon.
*Un sabotage qui laisse le harnais vert n'est pas un harnais qui échoue — c'est un sabotage mal
choisi.* Remplacé par le guillemet non échappé, qui mord.

### 110e. ⚠⚠⚠ CUVGR-1 ET CUVGR-2 N'ONT JAMAIS ÉTÉ INTÉGRÉS

Deux sessions ont travaillé sur la base `82f87ee` le même jour. **CUV-7** (la tournée) a été
commité et a pris §109, APP 7.05 et SW 7.64. Le lot **CUVGR-1 + CUVGR-2 + CUVGR-2b** (seuil de
température réglable et borné à la FA, chute journalière, champ `moment`, pente sur 24 h, seuil de
ralentissement réglable) revendiquait **les mêmes numéros** et n'est **pas** dans le dépôt.

Trois conflits à résoudre avant de le rejouer sur `d2efe12` :
1. **`_vendLastD` vs `_vendLastMes`.** CUV-7 pose la règle *« `_vendLastMes` pour DATER,
   `_vendLastD` pour CALCULER »*. `_vendAlerteTemp` lit une **température** : depuis la tournée, un
   relevé peut ne porter qu'une densité → il lui faut un `_vendLastT`, sinon l'alerte se tait sur
   une cuve chaude relevée le matin.
2. **`_mlProjFA`** a été modifié par CUV-7 (`_vendLastD`) et par CUVGR-2 (la pente sur 24 h). À
   fusionner, pas à remplacer.
3. ★★★ **Contradiction de fond.** CUV-7 règle ② : *« un relevé par cuve et par jour »*,
   `_vtEcrire` met à jour `_vtMesJour`. CUVGR-2 rend **deux** relevés par jour légitimes (matin /
   soir). En l'état, **la tournée du soir écraserait le relevé du matin.** `_vtMesJour` devrait
   devenir « le relevé du jour ET du moment courant ».

Le lot non intégré est conservé tel quel ; il ne doit pas être collé sans ces trois corrections.

---

## 111. ★★★ CRB-2 — LE COULOIR REMPLACE LA SUPERPOSITION, SUR L'ÉCRAN SEULEMENT (11/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` + `ci.yml` · APP 7.06 → 7.07 · SW 7.66 → 7.67 · base `708ead1`)

### 111a. Le geste, et la phrase qui l'a déclenché

> « Le graphique dans les courbes de la cave est illisible, et pour les densités et pour les
> températures. »

**Le chiffre derrière la phrase.** `_cmpSvg` pose chaque nom de cuve **au bout de sa courbe**, ce
qui exige `padR:92`. Sur une carte de 336 px (téléphone de 390), il restait **220 px** pour tracer —
et quinze traits s'y croisaient. Le couloir n'a **aucun nom à écrire** : `padR:16`, **278 px de
tracé, +26 %**, et un seul trait à suivre.

★★★ **LA DÉCISION DE FOND : ON NE RÉSUME PAS, ON HIÉRARCHISE.** Une moyenne des quinze cuves aurait
perdu la cuve qui décroche — or c'est exactement celle qu'on cherche. Le couloir garde **les deux
extrêmes et la médiane** (donc toute la dispersion), et la cuve qu'on interroge se pose **par-dessus**.
La question réelle n'est jamais « à quoi ressemblent mes quinze cuves » : c'est *« où en est
celle-là par rapport aux autres »*.

### 111b. ⚠️⚠️ POURQUOI UN SECOND DESSIN DE LA MÊME DONNÉE, ALORS QUE §86 L'INTERDIT

La règle interdit de **redessiner** une courbe qui existe ailleurs. Ce n'est pas le même dessin :
`_cmpSvg` **superpose** quinze traits nommés, `_crbEnvSvg` les **résume** en un couloir. Et les deux
surfaces n'ont ni la même place ni le même geste — A4 a 92 px de marge et aucun doigt ; 336 px n'a
ni l'un ni l'autre.

★ **Le critère généralisable** : deux tracés de la même donnée sont légitimes quand ils répondent à
**deux questions différentes** sur **deux supports** qui n'ont pas les mêmes contraintes. Ils ne le
sont pas quand ils répondent à la même question deux fois — c'est ce que §86 visait.

### 111c. Ce que le lot a changé

| | avant | après |
|---|---|---|
| tracé, sur 336 px de carte | 220 px | **278 px** |
| courbes à l'écran | 15 nommées | **couloir + médiane + 1 ou 2 cuves** |
| gouttière de droite | 92 px | **16 px** |
| débord horizontal | 34 px, à chaque ouverture | **aucun** (`.pcrb-g.crb-g`) |
| pastille du tableau | une des 6 couleurs de `MV_CMP_COL` | **grise**, sauf les cuves tracées |
| lire une valeur | descendre dans le tableau | **appui sur le graphe** (socle CUVGR-3) |
| cahier de cuverie | 1 tracé (densités) | **2 tracés** (densités **et températures**) |

★★ **LA SÉLECTION EST PARTAGÉE PAR LES DEUX GRAPHES**, et c'est le vrai apport ergonomique : le
palier de densité et la macération qui l'explique se lisent sur **la même cuve**, sans rien
retoucher. La barre de pastilles est **répétée** sur les deux cartes (le graphe des températures est
sous la ligne de flottaison) mais reflète **un seul état**, `_CRB_SEL` — renvoyer l'utilisateur vers
une barre qu'il ne voit plus, ce serait écrire un mode d'emploi au lieu de dessiner (§27a).

⚠️ **DEUX CUVES AU MAXIMUM, ET C'EST LA RAISON D'ÊTRE DU LOT.** À trois, on retombe sur le problème
qu'on vient de résoudre. La troisième relâche la première : jamais un refus, jamais un blocage.

### 111d. ★★★ LE SEUL ARBITRAGE DE MODÈLE : L'INTERPOLATION

Une enveloppe demande une valeur **par cuve et par jour**. Personne ne relève quinze cuves tous les
jours : sans rien, la médiane sauterait d'un jour à l'autre selon **qui** a été mesuré, pas selon ce
qui se passe en cuve.

**Retenu** : interpolation linéaire **entre deux relevés RÉELS de la même cuve**, et rien d'autre.
Jamais avant le premier, jamais après le dernier — ce serait extrapoler, c'est-à-dire inventer.
Densité et température sont **continues**, et l'écart entre deux relevés est d'un à deux jours : ce
n'est pas du même ordre qu'une date d'encuvage devinée (§88a).

⚠️ **CE QUE ÇA COÛTE EST ÉCRIT À L'ÉCRAN**, pas seulement en commentaire. L'étiquette porte **les
deux comptes** — cuves dans le couloir, cuves réellement relevées ce jour-là — et marque d'un `~`
toute valeur estimée. *Un chiffre calculé qui se présente comme un chiffre mesuré est un mensonge
poli.*

⚠️ **`jCoupe` — le couloir s'arrête sous trois cuves.** Au-delà, min = médiane = max : un couloir
plat ferait croire à une convergence alors qu'il ne reste qu'une cuve. Un trait vertical gris dit
**où** il s'arrête — un tracé qui s'interrompt sans raison se lit comme une panne.

### 111e. ⚠️ LES BORNES SONT FIXES, ET ÉLARGIES SI LA DONNÉE SORT

`990–1100` en densité, `10–35 °C` en température : deux captures d'un millésime à l'autre se
comparent alors à l'œil, là où un axe ajusté fait paraître énorme un écart de deux points.

★ **Défaut trouvé par le harnais, pas à la lecture** : l'élargissement descendait bien le cadre
(8 °C → plancher à 6) **mais pas la graduation**, dont le premier trait restait à 10. La courbe
plongeait sous la dernière ligne chiffrée, dans une zone sans repère. **L'élargissement s'arrondit
désormais au pas de graduation.** *Un cadre élargi qui ne dit pas jusqu'où il descend ne vaut pas
mieux qu'un cadre qui coupe.*

### 111f. ★★★ TROIS DÉFAUTS ANTÉRIEURS, TROUVÉS EN CHEMIN

**1. Un cliquet À L'ENVERS dans `mv-harnais-cuvgr3`.** `T('★ un seul graphe appelle _mvGraphHit',
nHit === 1)` rougissait dès qu'on **ajoutait** une infobulle à un second graphe — exactement le
geste qu'il devrait encourager. C'est le cas `A8` de `mv-harnais-audit-pil`, une seconde fois.
Converti en **plancher** (`nHit >= 2`). ⚠️ **Tout contrôle écrit avec un `===` est suspect : compte-t-il
ce qu'on veut interdire, ou ce qu'on veut encourager ?**

**2. Une pastille qui désignait une courbe disparue.** Le commentaire de `_PCRB_COL` exigeait la
palette de `_cmpSvg`, *« sinon la pastille ne désigne pas la courbe qu'elle prétend désigner »* — et
il avait raison **avant** ce lot. Depuis le couloir, l'écran ne trace plus quinze couleurs : une
pastille colorée désignerait une courbe qui n'existe plus. Grise par défaut, colorée par le CSS sur
`tr[data-on]`. *Un commentaire juste devient faux sans qu'une ligne de son code bouge.*

**3. ★★★ `_cmpTempSvg` N'AVAIT PLUS AUCUN APPELANT — ET LE PREFLIGHT NE LE VOYAIT PAS.** Le tracé
des températures n'était appelé que par l'écran ; le cahier imprimé ne l'a **jamais** porté. Passer
l'écran au couloir l'a rendu mort — mais `window._cuvCmpTempSvg = _cmpTempSvg;` le maintient
vivant aux yeux de C15. **Une fonction morte derrière un export vivant est invisible au filet.**
★ **Arbitré par Nico : on le met sur le papier.** `_cmpTempBlocDoc(S)` l'imprime sous le comparatif
des densités. Sur A4 la place existe, et le cahier donnait déjà « T° moy · max » en colonne **sans
jamais montrer la courbe qui l'explique**. ⚠️ Le bloc **entier** disparaît si le tracé est vide :
un titre suivi d'un blanc, sur du papier, se lit comme une panne d'impression.

### 111g. ⚠️ CE QUE LE PAPIER GARDE, ET POURQUOI

**`_cmpSvg` n'a pas bougé d'un octet.** `_cuvDoc` continue d'imprimer les quinze courbes nommées :
A4 a la place, et il n'y a **pas de doigt** pour choisir une cuve sur du papier. Un couloir sans
sélecteur ne répondrait à aucune question — il montrerait la dispersion sans jamais dire de qui on
parle. **C'est le même raisonnement que §111b, pris par l'autre bout.**

### 111h. Vérifications

`mv-harnais-crb2.mjs` (neuf, branché dans **`check` ET `prebuild`** — `mv-harnais-portes` exige que
les deux portes lancent exactement la même chose — et en CI avec sa contre-épreuve) : **66
assertions vertes, 10/10 contre-épreuves rouges**. `npm run check` complet vert. Guide régénéré.
`WHATS_NEW` 7.07 **exécuté**. `v7.67` 4 fois dans `sw.js`, `v7.66` exactement une fois (la ligne de
changelog du lot précédent, préservée).

⚠️⚠️ **QUATRE FOIS, C'EST L'ASSERTION QUI AVAIT TORT, PAS LE CODE.**
· `jCoupe` : j'avais écrit 8 en comptant de tête, il reste trois cuves à J9.
· une contre-épreuve sur la borne haute **restait verte** : retirer la garde ne change rien, la
boucle épuise ses points et rend `null` toute seule — c'est de la **défense en profondeur**, pas un
test aveugle. Sabotage remplacé par un qui mord.
· une seconde contre-épreuve **rejouait le code intact** au lieu de le casser : ce n'était pas un
sabotage, c'était une répétition de l'assertion.
· une ancre `s[i:i+22]` mordait sur l'indentation de la ligne suivante et a écrit l'ouverture du
`<table>` **deux fois**. Piège (k) de §25, huitième occurrence : **extraire une LIGNE ENTIÈRE**.

★ **Et une faute relevée en me relisant, pas par un filet** : `<b>température s</b>`, dans un texte
**client** du journal des nouveautés. §25-23, encore.

⚠️ **Un cliquet a mordu pour de bon** : ma bordure de pastille était en `1px solid var(--gris)`,
**le perdant de l'arbitrage du filet** (`mv-harnais-jetons`). Passée en `--gris-clair`.

⚠️ **Deux baisses de cliquet sont ANTÉRIEURES au lot** — mesuré sur `HEAD` en worktree, mêmes
chiffres : `rayons en dur 194 → 193` et `graisses hors pas 147 → 146`. **À regraver**, pas par ce lot.

### 111i. ⚠️⚠️ CE QUI N'A PAS ÉTÉ MESURÉ

**Aucun rendu n'a été regardé.** Ni Chromium ni Playwright dans le bac à sable. Restent à voir à
l'œil, et c'est le point faible du paquet (§42h) :
1. **le couloir doré en mode SOMBRE** — `var(--or)` à 20 % d'opacité sur `--blanc` sombre n'a jamais
   été vu ; le fond de carte change de sens entre les deux thèmes ;
2. **la bande de pastilles** sur un vrai téléphone : quinze chips, débordement, cible au doigt ;
3. **l'infobulle sur les colonnes de bord** — la pose se borne au cadre, mais ça se regarde ;
4. **le cahier de cuverie imprimé**, qui porte maintenant deux graphes sur la même page : c'est le
   seul endroit où une pagination peut casser, et aucun harnais ne lit une mise en page.

---

## 112. ★★★ PLAN-RECAL — UN MODÈLE DE PLANNING EST UN CALENDRIER, PAS UNE SEMAINE TYPE (11/09 — `planning.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` + `ci.yml` · APP 7.08 → 7.09 · SW 7.68 → 7.69 · base `a1d0001`)

**Le signalement, en une phrase** : *« dans le planning de Chloé les jours de travail sont tous
décalés d'une journée (elle commence à travailler le mardi pour finir le samedi, au lieu de
commencer le lundi pour finir le vendredi), dans les réglages du planning tout est pourtant ok. »*

### 112a. La cause, et pourquoi elle a tenu si longtemps

`PLANNING_TEMPLATES[année][modèle][mois][NUMÉRO DU JOUR] = heures`. **Le jour de la semaine
n'apparaît nulle part.** Un modèle n'est pas un rythme hebdomadaire : c'est le **calendrier d'une
année précise**. `PLAN_DEF.standard` et `PLAN_DEF.nico` sont calés sur **2026** (nouveau :
`PLAN_DEF_AN`).

`_planGetTpl` y retombait **en silence** dès que l'année affichée n'avait aucun modèle enregistré —
et le double repli `|| PLAN_DEF.standard` frappait aussi un salarié dont le modèle maison manquait
à l'année.

| `standard` lu sur | Di | Lu | Ma | Me | Je | Ve | Sa |
|---|---|---|---|---|---|---|---|
| **2026** (son année) | 0 | **45** | 46 | 46 | 46 | **39** | 1 |
| **2027** | 1 | **0** | 45 | 46 | 46 | 46 | **39** |

⚠️⚠️⚠️ **ET AUCUN TOTAL NE BOUGEAIT.** `_planGetRefH` somme le mois sans regarder les jours de
semaine : **223 jours, 1 589 h, avant comme après**. Le contrôle par les totaux ne POUVAIT PAS voir
ce défaut — c'est très exactement pourquoi « dans les réglages tout est pourtant ok ». Et la liste
des modèles affiche toujours `standard` et `nico` quelle que soit l'année : rien n'indiquait qu'il
en manquait un.

★★★ **LA LEÇON GÉNÉRALE, LA PLUS RÉUTILISABLE DU LOT : un invariant de SOMME ne surveille pas une
PERMUTATION.** Tout contrôle qui additionne est aveugle à l'ordre — et l'ordre est ce qui fait un
planning. À se demander devant tout cliquet chiffré : *qu'est-ce qu'il laisserait passer sans
changer de valeur ?*

### 112b. ⚠️⚠️⚠️ LE GUIDE ET LE DOCUMENT IMPRIMÉ DÉCRIVAIENT LE DÉFAUT AU LIEU DE LE CORRIGER

Trouvé en appliquant la règle d'or n°4. `_paDoc` portait déjà ceci, et `guide/10-planning.html` le
répétait **au public** :

> « Le document est construit sur le modèle intégré, dont les jours sont calés sur un autre
> calendrier : les jours de semaine ne tombent pas aux mêmes dates. »

**C'était exact.** Une session précédente avait donc diagnostiqué le bug, l'avait écrit noir sur
blanc dans **deux supports client** — et l'avait classé comme une *limite du document imprimé* au
lieu de remonter à `_planGetTpl`, où il vivait pour **tout le module**. Pendant ce temps la grille
de l'application affichait la même erreur **sans rien dire du tout**.

★★★ **À RETENIR : une limitation qu'on documente au lieu de la corriger devient invisible.** Le
texte rassure celui qui l'écrit (« c'est dit »), il ne rassure personne d'autre, et il **fige** le
défaut : plus rien ne le signale comme anomalie. **Quand on s'apprête à écrire « attention, X est
faux », se demander d'abord pourquoi X est faux.** Même famille que le test du mode d'emploi
(§27a) et que l'écran « à venir » du Pilotage (§20g), un cran plus grave : ici le texte était juste.

### 112c. La règle, arbitrée par Nico — NE RIEN INVENTER

Le recalage transporte chaque jour à **même jour de semaine et même rang dans le mois** (le 3ᵉ mardi
de mars reste le 3ᵉ mardi de mars — sans le rang, la semaine de vendange remonterait en début de mois).

⚠️⚠️ **Ce n'est PAS une translation** : un mois a cinq jeudis une année et quatre la suivante.
**Mesuré, `standard` 2026 → 2027 : 7 jours et 52,5 h sans place** (1 589 h → 1 536,5 h).

Deux règles étaient possibles, les deux ont été chiffrées avant d'écrire une ligne :
**A** recaler puis compléter avec l'horaire habituel du jour (le total se conserve, mais l'application
pose des heures que personne n'a décidées) · **B** recaler seulement et **afficher ce qui manque**.
★ **Nico a tranché B le 11/09.** Raison qui vaut au-delà de ce lot : **un planning se signe**. Une
heure inventée dans un prévisionnel remonte ensuite dans la référence, l'écart, les heures dues et
le relevé MSA — et personne ne saura qu'elle vient de l'application.

### 112d. Ce qui a été écrit

| Fonction | Rôle |
|---|---|
| `PLAN_DEF_AN` | l'année de calage des modèles intégrés — **2026** |
| `_planRecaleMap(m,anSrc,anDst)` | correspondance d'un mois, par jour de semaine **et** rang |
| `_planRecale(grille,anSrc,anDst)` | rend `{g, perdus:[{m,d,h}], vides:[{m,d}]}` — identité si `anSrc===anDst` |
| `_planTplDef(plId,yr)` | le modèle intégré recalé, **mémorisé** (`_planGetTpl` est appelé ~30× par rendu) |
| `_planTplDefInfo(plId,yr)` | le même, avec ce qu'il a coûté |
| ★ `_planRecaleEtat(yr,ids)` | **source unique** du constat — le bandeau ET le document imprimé la lisent |
| `_planRecaleBar()` | le bandeau, sous les onglets d'année de « Le mois », admin seulement |

⚠️ **`planUpdateDay` repartait de `PLAN_DEF` BRUT** : toucher **une seule case** de janvier 2027
recopiait le janvier **2026** entier dans la base. Le glissement passait du code aux données, et il
n'en ressortait plus. C'était le piège le plus coûteux du lot, et c'est celui qu'on déclenche en
essayant de corriger à la main.
★ La garde `PLAN_DEF[id] ? … : null` est **conservée volontairement** : sans elle, `_planTplDef`
retombant sur `standard`, un modèle maison aurait hérité du mois de `standard` au premier chiffre saisi.

⚠️ **Un modèle ENREGISTRÉ pour l'année n'est jamais touché** — c'est la donnée du client, posée pour
cette année-là. Le recalage ne concerne que le repli.

### 112e. `scripts/mv-harnais-recalage.mjs` — 33 assertions, 7 contre-épreuves, branché en CI

Les moteurs ne lisent aucun champ du DOM : ils s'**extraient du vrai fichier** et s'exécutent dans
Node. Les commentaires sont retirés avant toute assertion (§34g).
Ce qu'il tient : l'**identité** 2026→2026 (même référence) · le jour de semaine et le **rang**
conservés sur 300+ jours · l'égalité `cible + perdus = source`, jour de semaine par jour de semaine ·
`heures sortantes = heures perdues` · les places à pourvoir déclarées et réellement vides ·
`_timings` (clé par mois) recopié tel quel contre `_timings_jour` (clé par jour) recalé · la
mémorisation · et **deux cliquets de mesure** : 7 jours, 52,5 h.
Statique : `_planGetTpl` ne sert plus `PLAN_DEF` brut · `planUpdateDay` non plus · le bandeau est
branché · le document imprimé lit `_planRecaleEtat` et **ne dit plus** que les jours tombent faux.

⚠️ **Un harnais existant a cessé de démarrer** : `mv-harnais-effectif-periode` extrait `_planGetTpl`,
qui appelle désormais `_planTplDef` — `ReferenceError`, script mort. **Dépendances en chaîne**, le
piège documenté au §6b, rencontré pour de bon. Chaîne ajoutée à ses `NOMS`.

### 112f. Ce que le lot a coûté ailleurs

- **Deux rouges du harnais des icônes**, tous deux justes : `_mvIcon('info',15)` hors de l'échelle
  16/18/20/24/40, et **un emoji rendu de plus** dans `utils.js` (un `⚠️` glissé dans un texte de
  `WHATS_NEW` — réflexe de commentaire appliqué à du texte client, §6b).
- **Le piège de l'espace insécable** (§24, CSS/HTML 10) : l'ancre du guide contenait `calendrier\xa0:`.
  Retapée, elle n'a jamais correspondu ; **extraite par `repr()`, elle a correspondu du premier coup.**
- `guide/10-planning.html` réécrit et régénéré ; `MV_AIDE.planning` reçoit un point « Changer d'année ».

### 112g. ⚠️ CE QUI N'A PAS ÉTÉ MESURÉ

1. **Aucun rendu n'a été regardé** — le bandeau n'a jamais été vu, ni en clair ni en sombre, ni sur
   un téléphone. Il est en `display:flex` avec une icône et un `<span>` : le piège du §24 est évité
   par construction, mais ça se regarde (§42h).
2. **`npm run build`, `test:smoke` et `test:e2e`** : pas de navigateur dans le bac à sable.
3. ⚠️⚠️ **L'ampleur chez le client n'est pas établie.** Avec 2027 affiché et aucun modèle enregistré,
   le mécanisme ne fait aucune différence entre les personnes : **toute l'équipe glisse**, pas la
   seule Chloé. À confirmer d'un coup d'œil sur une autre ligne.
4. ⚠️⚠️⚠️ **Les chiffres déjà lus sur une année neuve étaient faux** : écart du jour, heures dues,
   jours de remplacement, capacité réelle (`_capWeekReal` lit `_planGetTpl('standard', année)`),
   relevé MSA. **Les totaux mensuels et le plafond 1 607 h, eux, n'ont jamais bougé** — ils sont la
   seule chose que ce défaut ne touchait pas.

## 113. ★★★ ECO-NOM — DEUX CARTES D'ARGENT PORTAIENT PRESQUE LE MÊME NOM (12/09 — `pilotage.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` · APP 7.09 → 7.10 · SW 7.69 → 7.70 · base `0573c9d`)

**Le signalement, en une phrase** : *« les achats et dépense GNR n'apparaissent pas dans où part
l'argent ; si Postes et travaux ne concerne que la saison en cours, il faut alors le même tableau
dans Synthèse pour les dépenses engagées dans l'année fiscale. »*

### 113a. Ce qui était vrai, ce qui ne l'était pas

| Le constat | Vérifié ? | Pourquoi |
|---|---|---|
| Les **achats** manquent à « Où part l'argent » | **oui** — et par construction | `_pecData` (pilotage.js) ne construit que **quatre** postes : main-d'œuvre vigne, conduite tracteur, carburant GNR, produits phyto. C'est un **barème** — surface × h/ha × taux — qui ne porte **aucune date**. Un achat en porte une. On ne peut pas découper l'un pour obtenir l'autre : c'était **déjà écrit** en tête du moteur d'exercice. |
| Le **GNR** manque à « Où part l'argent » | **non** | La ligne `k:'gnr'` est **toujours rendue** dans le tableau ; seul le **donut** filtre les postes à 0 (`items = postes.filter(p => p.budget > 0)`). Elle vaut 0 € dans trois cas : aucun plein daté dans la **saison consultée** (`_ecoGnrReel` sans fenêtre → appartenance par `_saisonForDate`), pleins cochés **sans litres** (comptés à part, `nSansLitres`), ou repli modèle **sans prix du GNR** réglé. |
| Il faut le tableau de l'année fiscale | **il existait déjà** | **Économie › Exercice**, carte « Où est parti l'argent » (`_pexPostes`) : salaires, carburant GNR, achats d'intrants, réparations, plus location de fûts et fûts achetés quand ils existent — colonnes Engagé / Prévu / À la clôture / Part / €/ha / vs N-1. **Économie › Achats** est déjà borné à l'exercice (`_PACH_PER='exe'`). |

⚠️⚠️ **LE VRAI DÉFAUT N'ÉTAIT PAS UN CALCUL, C'ÉTAIT UN NOM.** Deux cartes du même onglet
s'appelaient à **un mot près** pareil :

- campagne → **« Où part l'argent »** (`_pecViewPostes`)
- exercice → **« Où est parti l'argent »** (`_pexPostes`)

Un présent et un passé pour distinguer un barème sans date d'une fenêtre de dates : personne ne lit
ça. C'est **exactement** la faute des §94/§95 — *un mot, un écran* — en plus petit, et restée en
place pendant que la série CAVE la corrigeait ailleurs.

### 113b. Ce que le lot fait, et ce qu'il ne fait pas

1. La carte de la campagne s'appelle **« Le coût de la campagne »**. Elle dit ce qu'elle **est**.
2. Une **ligne de cadre** (`pec-vcadre`) sous le tableau dit ce qu'elle **n'est pas** : les achats,
   les réparations et les fûts n'y sont pas — *ils portent une date, ce budget n'en porte aucune*.
3. Un bouton **« Voir les dépenses de l'exercice »** (`data-pec="sub" data-v="exe"`) ouvre la porte.
   Le chemin n'est **pas** écrit en toutes lettres dans un paragraphe : le harnais `mv-harnais-info`
   l'interdit depuis le lot du verdict, et il a raison.
4. Le bouton de la Synthèse (« Voir où part l'argent ») suit le nouveau nom.
5. La fiche `pil.eco.postes` prend son titre et **deux paragraphes de périmètre** en tête.

**⚠️ CE QUE LE LOT NE FAIT PAS, ET C'EST DÉLIBÉRÉ** — Nico avait validé « laisser *Où part l'argent*
à l'exercice ». Le titre de l'exercice **ne bouge pas** : « est parti » est un **passé**, et c'est
très exactement ce que cette carte mesure — de l'argent **sorti**, à sa date. Renommer les deux
aurait coûté une seconde fiche, un second passage dans le guide et une seconde ligne de changelog
pour **zéro** gain de clarté. **La collision se lève d'un seul côté.** Écart assumé, dit ici plutôt
que passé sous silence.

### 113c. Le sous-titre n'était pas l'endroit

Premier réflexe : écrire « les achats n'y sont pas » dans le `pec-cs` de la carte. **Rouge du
harnais** — *« aucun sous-titre de carte ne dépasse la ligne de cadre »*, plafond 95 caractères hors
balises. La règle est juste : un sous-titre est une **ligne de cadre**, pas un mode d'emploi ; on le
relit à chaque ouverture au lieu d'une fois. Le texte est donc parti en `pec-vcadre`, sous le
tableau, là où vivent déjà les mêmes mises au point de l'exercice.

### 113d. Reste ouvert — la bande « L'exercice en cours » sur Synthèse

La demande initiale portait sur la **Synthèse**. Une maquette est livrée à part (`maquette-eco-synthese-exercice.html`) :
une bande compacte — total engagé de l'exercice, puis salaires / GNR / achats / réparations, et le
lien. Elle **lit `_pexData()`** : aucun second moteur, aucun second total. Elle n'est pas intégrée —
maquette, validation, intégration, dans cet ordre (§42h).

### 113e. ⚠️ CE QUI N'A PAS ÉTÉ MESURÉ

1. **Aucun rendu n'a été regardé.** Ni clair, ni sombre, ni téléphone. La ligne de cadre est un
   `display:flex` avec un `<span>` — le piège du §24 est évité par construction, mais ça se regarde.
2. **`npm run build`, `test:smoke`, `test:e2e`** : pas de navigateur dans le bac à sable.
3. ⚠️ **Le zéro du GNR chez Nico n'est pas établi.** Les trois causes possibles sont listées en
   113a ; laquelle joue se lit sur la ligne « Base de calcul » du tableau — « L relevés » ou
   « L ESTIMÉS ». Non vérifié faute d'accès aux données.

## 114. ★★★ ECO-EXO — « L'EXERCICE EN COURS » SE POSE SOUS LE BUDGET DE CAMPAGNE (12/09 — `pilotage.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` · APP 7.10 → 7.11 · SW 7.70 → 7.71 · base `0573c9d`, s'empile sur §113)

Renommer la carte (§113) a levé la **confusion**. Ça n'a pas répondu à la **question** : *« combien
est sorti cette année »* n'avait toujours aucune réponse sans changer d'onglet. Une bande
**L'exercice en cours** se pose donc sur Économie › Synthèse, **juste sous le budget de campagne** —
position arbitrée par Nico sur maquette, contre « en bas de la Synthèse ». Les deux périmètres se
lisent l'un après l'autre, chacun nommé, la ligne de cadre de la bande disant en quoi ils diffèrent.

### 114a. Ce qu'elle ne fait pas

⚠️ **Elle ne calcule rien.** Elle appelle `_pexData`, le moteur qui alimente déjà l'onglet Exercice.
Un second calcul du même total, ce sont **deux vérités qui finissent par diverger** — la faute de
§47a, en plus discret parce que les deux chiffres ne sont jamais côte à côte.

⚠️⚠️ **Elle ne suit pas `_PEX_AN`.** L'onglet Exercice se parque sur l'année consultée, et cette
mémoire **survit au rechargement** (`_pecSaveSt`). Une bande titrée « en cours » qui afficherait
2024 parce qu'on l'a consulté la veille serait un mensonge silencieux. Elle passe
`_mvExercice()` **explicitement**, jamais `_pexEx()`.

⚠️ **`noCmp = true`.** Sans lui, `_pexData` relance le moteur sur l'exercice précédent **puis** une
troisième fois « à date comparable » : trois passes, à chaque rendu de l'écran, pour un écart que la
bande n'affiche pas.

### 114b. Aucune classe neuve — et ce que ça a révélé

La bande n'utilise que des classes existantes. La couleur vit dans la **légende** (`.pec-lg em`,
stylée) et pas dans les étiquettes des chiffres.

⚠️ **Trouvé au passage, non corrigé** : `.pec-k .l em` **n'a aucune règle CSS**. `_pexAxeNature`
pose pourtant un `<em style="background:…">` dans chaque étiquette de KPI — un `em` inline, sans
contenu ni dimension : **le carré de couleur y est invisible**. Ce n'est pas le sujet de ce lot ; il
est noté ici pour ne pas être redécouvert.

### 114c. La fiche est réutilisée, pas dupliquée

La pastille de la bande ouvre **`pil.exo.postes`** — la fiche des postes de l'exercice, qui dit déjà
exactement ce qu'il faut (quatre postes toujours présents, la conduite déjà dans les salaires, la
coupe au jour). Écrire une seconde fiche pour le même contenu, c'est deux textes qui vieillissent
séparément.

### 114d. ⚠️ CE QUI N'A PAS ÉTÉ MESURÉ

1. **Aucun rendu n'a été regardé** — ni clair, ni sombre, ni téléphone. Deux `pec-k` dans une grille
   `minmax(196px,1fr)` : à 430 px ils passent l'un sous l'autre, c'est voulu, mais ça se regarde.
2. **Le coût du second appel à `_pexData`** au rendu de la Synthèse n'est pas chronométré. Une passe
   parcourt planning, sessions, intrants et réparations sur douze mois. Si l'onglet devient lent
   chez un gros domaine, c'est le premier endroit à instrumenter — un cache mémoïsé par exercice
   serait la réponse, pas la suppression de la bande.
3. **`npm run build`, `test:smoke`, `test:e2e`** : pas de navigateur dans le bac à sable.

## 115. ★★★ CUV-8 — LE SEUIL DU VIN SEC APPARTIENT À LA CUVE, PAS À L'APPLICATION (12/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` · APP 7.11 → 7.12 · SW 7.71 → 7.72 · base `710f4b9`)

> ⚠️⚠️⚠️ **SECTION CORRIGÉE LE 12/09 AU SOIR — LE MODÈLE DÉCRIT PLUS BAS EST FAUX POUR CE
> DOMAINE, ET IL EST EN PRODUCTION.** Lire §117 avant de s'appuyer sur quoi que ce soit d'ici.
>
> · **Ce qui reste vrai** : la pente de **1,1 point de densité par degré potentiel**. C'est
>   l'éthanol qui allège, ça se transporte d'une région à l'autre.
> · **Ce qui saute** : **l'ancrage**. Il vient de la table IFV Occitanie, faite sur des **vins doux
>   du Languedoc**. Il pose la cuve sèche à **992,7** pour un moût à 14°. Chez Marchand-Grillot,
>   moûts à **13,5–14°**, une cuve est sèche lue à **997–998**. **Quatre à cinq points d'écart.**
> · **Conséquence en production** : les cuves qui ont fini — Clos de la cabotte, Creot, Bollery
>   rouge, Gevrey Village — restent **« pas encore »** dans le comparatif du Pilotage › Cave, et
>   `_vendFaEnCours` les déclare **en fermentation** alors qu'elles ont fini **en cuve**.
> · ⚠️ **Et surtout : le seuil ne doit PAS être un verdict.** Nico, 12/09 : *« il n'y a pas de
>   seuil. C'est fini plus ou moins en fonction de l'état de ce qu'il y a dans la cuve et de ce
>   qu'on goûte. »* **Le décuvage se décide à la dégustation, jamais sur un chiffre.**

**Le point de départ, dit par Nico** : *« il y a une cuve qu'on a décuvée, qui était encore à 997.
Du coup, dans l'appli, elle marque encore non fini. »* Puis, sans qu'on le lui souffle : *« je pense
qu'en fonction des régions et du taux d'alcool, les densités pour dire qu'une cuve est sèche
doivent être différentes. Vérifie tout ça. »* **Il avait raison, et le défaut était plus profond que
le nombre affiché.**

### Ce que disait l'application, en trois nombres différents

| Endroit | Seuil |
|---|---|
| `_ML_D20_SEC` (`cave.js`) — ligne « vin sec » du cahier, colonne Vin sec, état `sec` | **996** |
| tag « FA finie » de la tournée, et `jours=(dl-995)/pente` dans `_mlProjFA` | **995** |
| `_vendFaPct` : 100 % d'avancement | **990** |

**Trois nombres pour la même idée, sur le même écran.** Et un quatrième défaut, invisible :
`_vendSucre(d20) = 2,564 × d20 − 2581,5` est la formule du **moût**, appliquée à une cuve qui
fermente. Elle annonce **0 g/L dès 1007** : la puce « reste ~0° potentiels » d'une cuve à 997
mentait, et la colonne « Sucre g/L » du cahier de cuverie aussi.

### Ce que dit l'œnologie — sources vérifiées

- **La fin de FA est une ANALYSE, pas une densité** : sucres réducteurs **sous 2 g/L**
  (Tec & Doc, *Le Vin*, ch. 4).
- **La masse volumique des vins secs va de 0,990 à 0,996** et « dépend de la teneur en alcool et de
  la valeur de l'extrait sec » (même ouvrage, ch. 2). **Une fourchette, pas un nombre.**
- Véron (cours d'œnologie) : FA terminée quand la densité est **sous 995/992**. Là encore un
  intervalle.
- **Table IFV Occitanie « mutage des vins doux »**, lue à l'envers : à densité donnée, le sucre
  restant dépend du **degré potentiel du moût avant FA**. Ses zéros s'alignent sur une droite :
  **densité à sucre nul = 1007,18 − 1,101 × DP** (vérifié sur les dix colonnes, 11° → 20°).

### ⚠️⚠️ LA PENTE DE LA TABLE N'A PAS ÉTÉ REPRISE — ET C'EST UN HARNAIS QUI L'A DIT

La table donne aussi une pente : **2,59 g/L par point de densité**. Elle est vraie **là où la table
a été faite** (0,990–1,040) et **fausse dès qu'on l'étire jusqu'au moût** : prolongée à 1092, elle
annonce **257 g/L** là où le moût en porte **218**. Le premier jet l'a reprise telle quelle, et
`mv-harnais-cuvdoc` a rougi immédiatement — il attendait 218 sur un moût à 1092.

La pente retenue sort d'un **bilan de matière**, exacte aux deux bouts : un gramme de sucre qui part
enlève son propre poids (1/2,564 point) **et** celui de l'alcool qu'il fabrique (1,101/spd point) →
`spd / (spd/2,564 + 1,101)` = **2,196 g/L par point** avec le réglage par défaut.
★ **Elle suit le réglage « sucre par degré » de la cave** : le changer sans changer la pente ferait
mentir les deux écrans qui l'affichent.

★★★ **LEÇON GÉNÉRALE : UNE TABLE PROFESSIONNELLE EST UN AJUSTEMENT LOCAL.** On lui emprunte le point
qu'elle a mesuré (ici le zéro), jamais la droite entière. Le harnais du cahier de cuverie a servi de
**garde-fou physique** — il n'avait pas été écrit pour ça.

### Le modèle retenu

```
densité à sucre nul   dz = 1007,18 − 1,101 × DP
sucre restant         S(d) = max(0, pente × (d − dz))
seuil « vin sec »     dSec = dz + 2 / pente          (2 g/L)
```
Résultat : **12° → 994,9 · 13° → 993,8 · 14° → 992,7 · 15° → 991,6.**

### ⚠️⚠️ LE DEGRÉ POTENTIEL N'EST JAMAIS INVENTÉ

Trois sources, dans cet ordre, et rien d'autre :
1. **le premier relevé de la cuve, s'il est encore un moût (≥ 1050)** — sous ce seuil, la
   fermentation est partie et le degré serait sous-évalué ;
2. à défaut, **les contrôles de maturité des parcelles de la cuve** (`_cmpVigne`) ;
3. à défaut, **rien** : la cuve retombe sur le seuil général (996) et **l'écran écrit « seuil
   général » à côté du chiffre**.

Une chaptalisation **datée** ajoute ses degrés dans les trois cas.
★ `_cmpVigne` est appelé **par `typeof`** : un harnais qui éprouve un seuil n'a pas à monter toute
la chaîne des maturités.

### Ce qui a changé à l'écran

- **La courbe d'une cuve** porte SON seuil, écrit à la décimale.
- **Les deux comparatifs** (cahier de cuverie, couloir CRB-2) dessinent une **BANDE** min–max dès
  que les cuves affichées n'ont pas le même seuil. ★ **Un trait unique pour quinze cuves de degrés
  différents dessinait une ligne d'arrivée qui n'existe pas.** Quand les seuils coïncident, la bande
  se referme sur le trait d'avant — aucune régression visuelle.
- **`_vendFaPct` prend la cuve** : l'avancement va du **départ réellement lu** au seuil de la cuve.
  Entre 1085 et 990 pour tout le monde, une cuve partie à 1060 affichait **26 % le jour de son
  encuvage**.
- **La puce du détail** dit désormais des **g/L de sucre**, pas des degrés potentiels calculés faux.
- `_vendDegrePot` est **supprimée** — une fonction morte est une invitation.

### Le harnais

`scripts/mv-harnais-cuv8.mjs` — **30 assertions vertes, 7 contre-épreuves qui mordent**, sur les
vraies fonctions extraites. Seul `_vendCfg` est bouchonné (c'est une donnée, pas une règle). Il est
dans `npm run check` et dans `prebuild`, contre-épreuve comprise.

### ⚠️ UN HARNAIS ÉTAIT MORT DEPUIS §81, ET PERSONNE NE L'A VU

`scripts/mv-harnais-cuvier-correction.mjs` plante en `ReferenceError: _vendStatDeb is not defined`
**sur la base pristine `710f4b9`** — constaté en le rejouant avant d'y toucher. PARC-1 (§81) a
appris à `_mlProjFA` à lire le parcours daté sans que la liste d'extraction suive. **Il n'est pas
dans `npm run check`** (vérifié : zéro occurrence dans `package.json`), donc rien ne rougissait.
Il a été **laissé en l'état** par ce lot : le réparer demande aussi de reprendre ses décors, c'est
un lot à lui seul. ★ **Règle : un harnais hors de la chaîne n'est pas un harnais, c'est un fichier.**

## 116. ★★★ CUV-9 — LA FERMENTATION CONTINUE APRÈS LE DÉCUVAGE (12/09 — livré avec §115, même bump)

> ⚠️⚠️ **SECTION CORRIGÉE LE 12/09 AU SOIR.** La pratique décrite ici existe, **mais ce n'est pas
> celle de ce domaine** : chez Marchand-Grillot **la FA finit EN CUVE**, et le décuvage vient
> après. `_vendFaEnCours`, tel qu'il est livré, se déclenche donc sur des cuves **qui ont fini** —
> parce qu'il compare une densité à un seuil importé (§117).
>
> ★★★ **DEUX ERREURS DE LECTURE À NE PAS REFAIRE**, toutes deux commises le 12/09 sur une capture
> du comparatif, toutes deux corrigées par Nico :
> 1. **« Les cuves à 1002–1027 sont des séries abandonnées »** — **faux**. Elles **fermentent
>    encore, en cuve, aujourd'hui**. « Pas encore » y est juste. Un écran qui dit vrai n'est pas un
>    écran en panne.
> 2. **« 1027 au J11 avec 7 pts/jour, donc sèche vers J16 »** — **faux par construction**. La
>    cinétique n'est **pas une droite** : plate au départ, elle accélère, puis **ralentit en fin**.
>    ⚠️ **Ça condamne aussi `_mlProjFA`**, qui projette sur la moyenne des trois derniers relevés
>    — précisément au moment où la pente s'écrase. À reprendre (§117).
>
> **La règle sous-jacente** : la fin de FA doit devenir un **fait constaté** — une analyse de sucres
> réducteurs, ou une déclaration du vigneron — sur le patron de `fml_terminee` au Chai
> (*« s'il déclare la malo finie, elle est finie, même sans mesure »*). Pas un calcul.

**Décuver avant la fin de la FA est une pratique documentée, pas un accident.** On écoule tôt pour
arrêter l'extraction du marc, et la fermentation se termine **en phase liquide** dans le contenant
d'arrivée (Wikipédia « Décuvage » ; IFV, *Clés d'élaboration des vins rouges fruités* : décuvage
précoce + fin de FA en phase liquide à 18–20 °C ; un cours de vinification chiffre le décuvage à
1010 plutôt qu'à 999 quand les tanins sont verts).

**Ce que faisait l'application** : `saveVendDecuvage` posait `statut='termine'`, le parcours se
fermait, et avec lui tout le suivi. Plus de bouton « Saisir une mesure », la cuve sortait de la
tournée et de la liste à mesurer, et le comparatif la laissait **« pas encore » sèche pour
toujours**. C'est exactement ce que Nico voyait sur sa cuve à 997.

### Le modèle — ce qui continue, et ce qui ne bouge pas

⚠️⚠️ **LE STATUT NE CHANGE PAS.** La cuve est décuvée, son parcours est **clos** (§81) : corriger une
date ne doit pas la rouvrir alors que la cuvée existe déjà au Chai. **Ce qui continue, c'est la
SÉRIE de densités — la même, jamais une seconde.** Aucune entité neuve, aucun champ neuf : quatre
prédicats lus sur ce qui est déjà là.

```
_vendDecuvee(c)    décuvage.date posée
_vendFaEnCours(c)  décuvée, non fusionnée, dernière d20 > son seuil
_vendJourSec(c)    le PREMIER relevé passé sous le seuil — jamais interpolé, null sinon
_vendSuivie(c)     _vendIsActive(c) || _vendFaEnCours(c)
```

⚠️ **Une cuve FUSIONNÉE ne suit rien** : son vin est ailleurs, sous un autre nom. C'est une
contre-épreuve du harnais.

### Ce que ça change à l'écran

- La ligne porte **« Décuvée · FA »** en rouge, et `_vendADue` prime désormais sur `statut==='termine'`
  pour la couleur : **« décuvée » ne doit plus primer sur « à mesurer ».**
- Le détail explique la situation, avec la dernière densité, les g/L restants, le seuil **et d'où il
  vient** — puis rappelle que **seule une analyse de sucres réducteurs tranche**.
- **Le bouton « Saisir une mesure » revient.** La tournée la garde (`_vtActives` passe par
  `_vendSuivie`), avec un tag « décuvée » ; `_mlAMesurer` aussi.
  ★ **C'est là que le relevé compte le plus : plus de marc, plus de chapeau, rien dans le cuvier ne
  rappelle qu'il faut aller voir.**
- La section **Décuvées** s'ouvre d'office quand l'une d'elles fermente, compte celles qui sont
  concernées, et date les autres (« sèche le … »).
- ★★ **AU CHAI** : la cuvée née du décuvage affiche **« Fermentation non finie »**. Elle n'a pas de
  densité à elle — `_caveCuveSource` remonte à la cuve par `decuvage.cuvee_id`. **Rien n'est
  recopié, rien ne peut diverger.** C'est là qu'on décide de la suite.
  ⚠️ **CORRIGÉ LE 14/09/2026 — la formulation précédente était fausse** (« c'est là qu'on décide de
  sulfiter, et on ne sulfite pas sur du sucre »). En **rouge de garde**, on entonne **sans SO₂**
  précisément pour enchaîner sur la **malo en fût** ; le soufre ne vient qu'**après**, une fois la
  malo finie et vérifiée par analyse. La question à l'entonnage n'est donc pas « sulfiter ou pas »,
  c'est **« la FA est-elle finie »**. Les deux gestes attendent la même réponse, pour deux raisons
  distinctes : **lancer une malo sur du sucre** = risque de **piqûre lactique** (bactéries lactiques
  sur sucre résiduel) ; **sulfiter sur du sucre** = le SO₂ se combine, le libre s'effondre, réveil
  tardif. Signalé par un œnologue en relecture d'un post LinkedIn tiré de cette section — l'erreur
  était partie d'ici et avait déjà atteint trois textes clients (lot **CUV-12**).

### Ce qui reste ouvert

1. **Aucun champ « degré potentiel » saisissable.** Volontaire : les trois sources couvrent les cas
   réels et un champ de plus se serait rempli une fois puis oublié. À rouvrir si un client vinifie
   sans jamais relever le moût.
2. **Le seuil général (996) n'est pas réglable** dans la roue crantée de la Cave. Le rendre réglable
   demanderait un écran ; le calcul par cuve rend le repli rare.
3. **`npm run build`, `test:smoke`, `test:e2e`** : pas de navigateur dans le bac à sable — les trois
   restent à jouer côté Nico.

## 117. ★★★ LA ZONE DE 996 — CE QU'ON GARDE, ET CE QUE LE LABO DOIT TRANCHER (12/09 soir — aucun code touché · base `fc45fb9`)

**Décision de Nico, 12/09 au soir** : *« la zone de 996 est quand même une zone indicatrice de cuves
sèches, donc à approfondir une fois qu'on aura les résultats du labo, pour voir les degrés qui
restent dans les vins en fonction du sucre et des degrés potentiels des moûts. »*

**On garde donc la zone de 996 comme REPÈRE. Jamais comme verdict.** Elle se dessine sur un graphe,
elle s'écrit « repère », et elle ne déclenche rien : ni « FA finie », ni « pas encore », ni une
entrée dans la tournée.

### Ce qu'on sait du domaine, et qui doit primer sur toute table

| Fait | Valeur |
|---|---|
| Degré potentiel des moûts (Gevrey, 2026) | **13,5 – 14°** |
| Densité lue quand la cuve est sèche | **997 – 998** |
| Ce qui décide du décuvage | **la dégustation et l'état de la cuve** — aucun chiffre |
| Où finit la FA | **en cuve**, le décuvage vient après |

⚠️ **PRÉCISÉ LE 15/09/2026 (CUV-13)** — *« parfois, chez nous, quand on est au décuvage, on va remettre
le jus dans une autre cuve, surtout quand il reste encore du sucre dedans, afin qu'il finisse la
fermentation. Et une fois que cette fermentation est finie, on la mettra en tonneau. »* La FA finit en
cuve **le plus souvent, pas toujours** : pressé avec du sucre, le jus la termine dans une autre cuve,
puis part en fût. L'étape du parcours s'appelle désormais « Pressurage » et la cuve reste réclamée (§133).

### ⚠️ LA CONTRADICTION, ET ELLE N'EST PAS TRANCHÉE

Le bilan de matière dit qu'à **997 sur un moût à 13,5–14°**, il reste du sucre. Nico goûte sec.
**Trois causes possibles, aucune écartée :**

1. **La lecture est haute.** CO₂ dissous d'un vin jeune, jus trouble sur lies, étalonnage du
   densimètre. Les trois tirent dans le même sens, de quelques points.
2. **L'extrait sec décale la densité à sucre nul.** Un pinot de Gevrey sur lies n'a pas l'extrait
   d'un vin doux du Languedoc, et c'est de là que vient l'ancrage actuel.
3. **Il reste réellement quelques grammes**, consommés après entonnage.

### CE QU'IL FAUT MESURER POUR FERMER LA QUESTION

⚠️ **Une seule cuve ne suffit pas : ce qu'on cherche est une RELATION, pas un point.** Sur plusieurs
cuves, au même moment :

- **sucres réducteurs** (labo) — le seul verdict ;
- **densité relevée** et **température** au moment du prélèvement ;
- **degré potentiel du moût avant FA**, chaptalisation comprise ;
- **degré acquis** du vin.

De quoi tracer, pour CE domaine, le vrai lien entre densité lue et sucre restant. **Ensuite
seulement** : caler la zone sur les lectures du domaine, garder la pente de 1,1 pt/degré pour
l'écart entre cuves, et laisser le fait constaté écrire « sèche ».

### ⚠️⚠️ LE RELARGAGE DE PRESSE — LA VALEUR QUI MANQUE

**Au décuvage on presse** pour extraire les jus restés dans les raisins, et le pressurage
**relargue du sucre** : la densité de la masse remonte par rapport au vin de goutte.
★ **La valeur qui compte pour la suite est celle de la MISE EN FÛT**, goutte et presse assemblées.
✅ **FAIT** (commit `42af518`, APP 7.21) : champ **facultatif « Densité à la mise en fût »** avec sa
température sur la feuille « Décuver », lu par `_vendDecD20`, affiché sur la cuvée au Chai
(« goutte et presse assemblées »). Il ne rejoint **jamais** la courbe du Cuvier : ce n'est pas un
relevé de cuve. ⚠️ Cette section a affirmé « elle n'existe nulle part » **après** que le champ eut
été livré — vérifier le code avant de citer un manque.

### Le lot à venir, quand la zone sera calée

1. **La fin de FA devient un fait constaté** — analyse de sucres réducteurs saisie, ou déclaration
   datée, sur le patron de `fml_terminee`. La densité s'affiche, elle n'arbitre plus.
2. **Le repère se cale sur le domaine** : un réglage de la Cave porte la densité de cuve sèche
   observée ; la pente de 1,1 pt/degré ne sert plus qu'à écarter les cuves entre elles.
3. **Densité de mise en fût** au décuvage, et **densité** ajoutée au formulaire d'analyse du Chai —
   pas d'écran neuf, pas de seconde série.
4. **`_mlProjFA` à reprendre** : une projection linéaire sur une cinétique qui ralentit annonce une
   fin trop proche, systématiquement.

⚠️ **Tant que ce lot n'est pas passé, `_vendFaEnCours` se trompe sur les cuves décuvées sèches à
997–998.** C'est le prix de l'intégration de §115/§116 avant correction — assumé, et daté ici.

## 118. ★★★ CUV-10 — LE DÉCUVAGE EST UN FAIT, LE SEUIL REDEVIENT UN REPÈRE (12/09 soir — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` · APP 7.12 → 7.13 · SW 7.72 → 7.73 · base `fc45fb9`)

**La capture du 12/09.** Douze cuves dans le comparatif du Pilotage › Cave. Une seule porte une
date ; les onze autres disent **« pas encore »**. Nico : *« ici plusieurs cuvées sont décuvées, une
seule apparaît terminée. »* Clos de la cabotte, Creot, Bollery rouge et Gevrey Village **ont fini,
en cuve, marc sorti** — et l'écran les annonçait inachevées.

### La cause racine, et elle n'est pas dans le calcul

`_vendFaEnCours` et la colonne « Vin sec » **comparaient une densité à un repère calculé**. Or
personne ici ne décide sur un chiffre. Nico, 12/09 :

> *« Il n'y a pas de seuil. Le seuil, c'est fini, c'est fini plus ou moins en fonction de l'état de
> ce qu'il y a dans la cuve et de ce qu'on goûte. »*

★★★ **Sortir le marc, c'est avoir constaté que c'était fini.** Le décuvage **est** le fait. Un
calcul ne peut pas le contredire, et n'a pas à le confirmer.

### Le modèle

| Avant | Après |
|---|---|
| `_vendFaEnCours` = décuvée ET dernière densité > seuil | `_vendFaEnCours` = décuvée ET `decuvage.fa_finie === false` |
| colonne « Vin sec » : `jSec` ou « pas encore · J14 à 997 » | colonne « Fin de FA » : la **date du décuvage**, sinon « J12 · repère », sinon « en cours · J14 à 997 » |
| le seuil arme la tournée, le badge, la colonne | **le repère n'arme plus rien** |

**La feuille de décuvage pose la question une fois** : « Terminée en cuve » (coché d'avance — c'est
le cas courant ici) ou « Elle finira au chai ». Deux chips, pas un interrupteur : un interrupteur se
lit comme un réglage, deux chips comme une question.

⚠️⚠️ **AUCUN BACKFILL — règle PARC-1 (§81).** Une cuve décuvée avant ce lot n'a pas de `fa_finie`.
Elle n'est donc **ni** « en FA » **ni** « déclarée finie » : l'écran écrit « décuvée le … », ce qui
est vrai, puis **« l'état de la fermentation n'a pas été noté à ce moment-là : l'écran ne le devine
pas »**. Trois états, pas deux — et le troisième se dit.

★ **« pas encore » devient « en cours ».** Une cuve qui fermente n'est **pas en retard** sur quelque
chose. Le mot portait un jugement que la donnée ne justifiait pas.

### ★★ LA DENSITÉ DE MISE EN FÛT — LA VALEUR QUI MANQUAIT

Nico, 12/09 : *« dans tous les cas il y a un petit relargage pendant la presse, on presse les moûts
au décuvage pour extraire les jus qui restent dans les raisins. Cette valeur sera à indiquer au
moment de mettre en fût. »*

Champ facultatif dans la feuille de décuvage : densité + température, **goutte et presse
assemblées**. Ramenée à 20 °C comme tout relevé, affichée sur la cuvée au Chai.

⚠️ **ELLE NE REJOINT PAS `mesures_fa`.** Ce n'est pas un relevé de cuve : c'est le point de fermeture
de la cuve et d'ouverture de la cuvée. L'y verser ferait **remonter la courbe de fermentation sans
qu'aucune chaptalisation ne l'explique** — le piège de §20, et le harnais le garde.

### Ce que le repère devient

Il se dessine sur les courbes, et **le détail de la cuve dit enfin où il est et d'où il vient** :
« Repère de densité : 993,8 (moût à 13°) · courbe passée dessous le 16/09. Un repère de lecture, pas
un verdict : la fin de fermentation se constate à la dégustation. »
Le tag de la tournée passe de **« FA finie »** à **« sous le repère »**.

⚠️ **Sa valeur reste fausse pour ce domaine** — cuves sèches à 997-998 au densimètre, calcul plus
bas. C'est §117, et ça se cale au labo. **Mais ça ne bloque plus rien** : le repère n'arbitre plus.

### ★★★ CE QUE CETTE SÉRIE A COÛTÉ, ET LA LEÇON

Trois lots pour un même sujet, dont **deux faux** :
- **§115** a importé l'ancrage d'une table IFV faite sur des **vins doux du Languedoc** ;
- **§116** a bâti un prédicat sur cet ancrage, et l'a mis en production ;
- **§118** retire le calcul du chemin de décision.

★★★ **LA LEÇON : QUAND UNE RÈGLE MÉTIER PEUT ÊTRE UN FAIT SAISI, ELLE NE DOIT PAS ÊTRE UN CALCUL.**
Le calcul importe une hypothèse étrangère au domaine ; le fait saisi vient de celui qui goûte.
Le même patron existait déjà à trois mètres — `fml_terminee` au Chai : *« s'il déclare la malo
finie, elle est finie, même sans mesure »*. **Il fallait le lire avant d'écrire une formule.**

★★ **Corollaire de méthode** : j'ai construit §115/§116 sur **une** phrase de Nico (« une cuve
décuvée encore à 997 ») sans lui demander **ce que fait le domaine**. Trois questions au départ —
où finit la FA, qui décide du décuvage, quelle densité pour une cuve sèche chez vous — auraient
évité les deux lots. §Communication le dit déjà : *« quand Nico décrit sa pratique, ce n'est jamais
un détail d'affichage. »* Encore faut-il la lui demander.

### Le harnais

`scripts/mv-harnais-cuv8.mjs` — **40 assertions vertes, 10 contre-épreuves qui mordent**. Les trois
qui comptent : à **densité identique**, une cuve déclarée finie et une cuve déclarée à finir ne sont
pas dans le même état ; une cuve décuvée **avant** le lot n'est devinée dans aucun des deux ; et la
densité de mise en fût **ne rejoint pas** la série de la cuve.

### Ce qui reste ouvert

1. **La valeur du repère** — §117, à caler sur des sucres réducteurs.
2. **`_mlProjFA`** projette encore en droite sur une cinétique qui ralentit (§116).
3. **Pas de reprise a posteriori** de l'état de FA sur les cuves déjà décuvées. Volontaire : ce
   serait un backfill inventé. Si le besoin vient, ce sera un geste explicite du vigneron.
4. **`npm run build`, `test:smoke`, `test:e2e`** : pas de navigateur dans le bac à sable.

## 119. ★★★ TRI-1 — L'ORDRE DES LIGNES DEVIENT UNE QUESTION, ET LE RENDEMENT REDEVIENT CELUI D'UNE PARCELLE (12/09 soir — `utils.js` + `cave.js` + `reglages.js` + `index.html` + `sw.js` + `scripts/` · APP 7.13 → 7.14 · SW 7.73 → 7.74 · base `43a95ab`)

### Le point de départ

Nico, 12/09 : *« il faut pouvoir faire un tri dans les options d'impression (par exemple récolte
de vendange) par nom, taille, ou rendement. »*

L'audit du catalogue a montré que **six documents sur onze sortaient dans l'ordre du tableau
SOURCE** : l'ordre de saisie des récoltes, l'ordre de `PARCELLES`, l'ordre de `INTRANTS.produits`.
Ce n'est pas un ordre, c'est l'absence d'ordre — sur le papier, personne ne peut y chercher une
ligne. Les cinq autres avaient un ordre **choisi et justifié** (tournée par commune pour l'état du
vignoble, cuivre décroissant pour la synthèse, ordre de maturité pour le contrôle, chronologie
pour les deux registres réglementaires) : ceux-là ne se remplacent pas, ils s'offrent en option.

### ★★★ CE QUE L'AUDIT A TROUVÉ EN CHEMIN — TROIS DÉFAUTS, UNE SEULE FAMILLE

La demande portait sur l'ordre. Le code du document des récoltes portait trois erreurs de
**périmètre** : un chiffre juste, posé sur le mauvais ensemble.

**1. Le document ignorait le millésime.** `exportVendRecoltesPdf` prenait `CAVE_VENDANGE.recoltes`
**en entier** — la collection est cumulative, elle porte toutes les vendanges — et se titrait
`'Récoltes ' + new Date().getFullYear()`. À la vendange 2027, une feuille intitulée « Récoltes
2027 » aurait listé 2026, avec le bon titre et les mauvaises lignes. Personne ne l'avait vu parce
que l'application n'a encore vécu qu'une seule vendange.

**2. Le rendement d'un apport n'existe pas.** La colonne calculait `_recKg(r) / _vendParcSurf(r.parcelle)` :
les kilos **d'une benne** sur la surface de **toute la parcelle**. Trois bennes sur La Justice
affichaient donc trois **tiers** de rendement, chacun présenté comme un rendement, chacun sous un
en-tête qui disait « Rendement ». Et c'est ce défaut-là qui rendait la demande initiale piégeuse :
*trier par rendement* aurait classé des fractions.

**3. Les deux destinations coupaient le rendement en deux.** Le document a deux sections, cuvier et
vrac. Une parcelle qui part aux deux — cas courant — aurait vu **chaque moitié** annoncée comme son
rendement, dans sa section.

★★ **La règle qui en sort, et qui vaut au-delà de ce document : LE RENDEMENT APPARTIENT À LA
PARCELLE ET AU MILLÉSIME, JAMAIS À LA LIGNE.** `_vendRecRdt(parcelle, millésime)` est le seul
endroit qui le calcule, et il lit **toujours** toutes les récoltes du millésime — jamais la liste
de la section en cours de rendu. Un rendement dont le dénominateur et le numérateur ne couvrent
pas le même ensemble est un rapport, pas un rendement. C'est §Économie qui le disait déjà pour la
cadence : *« le dénominateur doit couvrir le même périmètre que le numérateur »*, et c'est la
deuxième fois que le même défaut se paie.

### MV_TRI — la primitive, à côté de MV_DOC

`utils.js`, juste après `MV_DOC`, parce que le tri appartient à la **grammaire du document** et non
à un module : `cave.js`, `reglages.js`, `reserve.js` et `phyto.js` en auront tous besoin.

Elle **ne trie rien**. Le document seul sait ce que valent ses lignes. Elle pose la question,
retient la réponse et rend la phrase à imprimer :

| Fonction | Ce qu'elle fait |
|---|---|
| `_mvTriOuvrir(o)` | la feuille : année, groupement, clé, sens. Rend `false` s'il n'y a rien à demander |
| `_mvTriPhrase(o,c)` | la phrase de l'en-tête — « rendement — le plus fort d'abord » |
| `_mvTriLu(memo,def)` | le choix de la dernière fois, complété par les défauts du document |
| `_mvTriCmp(c,val,bris)` | un comparateur : le sens s'applique **une fois**, pas dans chaque document |

⚠️ **Une clé peut n'avoir de sens que dans un groupement** (`grp:['apport']`). Elle est alors
montrée **barrée**, jamais retirée : une option qui disparaît laisse croire qu'elle n'existe pas.
Et changer de groupement **lâche** une clé devenue sans objet plutôt que de trier sur du vide.

⚠️ **L'ANNÉE N'EST PAS MÉMORISÉE, et c'est délibéré.** Retenir « 2025 » ferait sortir l'an prochain
un document de l'an dernier — exactement le défaut n° 1 que ce lot corrige, réintroduit par la
mémoire. La clé, le sens et le groupement, eux, sont des habitudes : ils se retiennent.

⚠️ **`localStorage`, PAS `CONFIG`.** C'est une préférence d'affichage de la personne qui tient le
téléphone, pas une règle du domaine : le tri choisi par le chef de culture n'a pas à changer le
document du salarié. Stockage refusé (navigation privée) → `MV_TRI_MEMO_KO` et **la feuille cesse
de promettre qu'elle retient**, plutôt que de le promettre en vain.

⚠️ **Le document DOIT écrire l'ordre dans son en-tête.** Deux tirages du même document, triés
différemment, se ressemblent sans l'être. Une feuille posée sur un bureau doit dire comment elle
est rangée.

⚠️ `_mvTriValider` ouvre le document dans un `setTimeout(…, 80)` — **le même délai qu'`openPrompt`**,
pas un chiffre neuf. Le `window.open` de `_mvDocOpen` dépend de l'activation utilisateur ; changer
ce délai, c'est risquer un bloqueur de pop-up sur un chemin qui marche en production.

### Le document des récoltes

Un tri par clé de **parcelle** (nom, surface, rendement) range les **parcelles** ; à l'intérieur de
chacune, les apports gardent l'ordre du calendrier. Deux bennes de la même parcelle portent la même
valeur sur ces clés : les trier l'une contre l'autre ferait dépendre le résultat de la stabilité du
tri du navigateur. Un tri par **date** ou par **kilos** range les lignes une à une — et n'est offert
qu'en mode apport.

Le mode « une ligne par parcelle » agrège les apports du millésime. **L'état moyen y est pondéré par
les kilos** : une benne de 30 kg ne pèse pas autant qu'une de 2 000 dans l'état sanitaire d'une
parcelle.

Le pied de tableau ne totalise **que ce qui s'additionne** — un rendement moyen ne se somme pas, la
case reste vide plutôt que fausse — et son `colspan` de queue se **calcule** : un nombre écrit à la
main devient faux au premier ajout de colonne (il l'était déjà, à 9 pour 4 colonnes restantes).

Une parcelle **sans surface enregistrée** laisse la case vide et le document **la nomme**. Rien
n'est estimé : un rendement sans dénominateur n'est pas un petit rendement.

⚠️ **Repli** : si `_mvTriOuvrir` manque (`utils.js` en retard chez un client), le document sort quand
même — millésime le plus récent, ordre de saisie, soit exactement le comportement d'avant le lot.
Un document vaut mieux qu'un toast.

### Ce qui a bougé ailleurs

- `MV_DOCS` (`reglages.js`) : `ask:'Millésime, puis tri'` et `ov:true` — le hub se ferme avant la
  feuille, comme pour les quatre autres documents qui posent une question.
- `mv-chartes-doc.mjs` : le producteur s'appelle désormais `_vendRecoltesDoc`. **Une fonction
  renommée sans mettre à jour ce script fausse le compte** — le script le dit lui-même.
- `MV_AIDE` : la Cave annonçait **quatre** documents et en listait quatre. Sa roue crantée en sort
  **sept** (les cinq du module, plus le bilan de campagne et l'inventaire des fûts, qui parlent
  d'elle). Le texte traînait depuis CAVE-2 ; il est corrigé au passage, avec le tri.

### Le harnais

`scripts/mv-harnais-tri1.mjs` — **42 vertes, 5 contre-épreuves qui mordent**. Les fonctions sont
**extraites de `cave.js` et `utils.js`**, dans l'ordre réel du fichier, et jouées sur un jeu de
récoltes construit pour porter les trois défauts : une parcelle en trois bennes, une parcelle
cuvier + vrac, deux millésimes dans la même collection.

★ **Une assertion a rougi à tort, et c'est le TEST qui avait tort** : l'état moyen pondéré et la
moyenne simple tombaient tous deux sur 90 avec le jeu d'essai initial. Une assertion qui ne peut
pas distinguer ne prouve rien — les états ont été écartés (96 / 90 / 60) pour que 84 ≠ 82.
C'est la huitième fois que la question *« lequel des deux a tort, le test ou le code ? »* fait
gagner du temps.

### Ce qui reste ouvert — les dix autres documents

L'audit est fait, le mécanisme est là ; il reste à le brancher. Par ordre d'urgence réelle :

1. **Inventaire des intrants** (`_rsvExportPdf`) — `INTRANTS.produits.forEach`, ordre brut. Clés :
   nom, catégorie, stock, cohérence.
2. **Avancement par parcelle** (`exportCSVParcelles`) — `window.PARCELLES.map`, ordre brut. Clés :
   nom, surface, statut, avancement.
3. **Journal des travaux** (`exportCSVJournal`) — ordre brut du journal. Clés : date, parcelle,
   tâche, ouvrier.
4. **État du vignoble** (`_vgnDoc`) — le plus riche : `_vgnLignes()` porte déjà nom, commune,
   surface, cépage, avancement, dernier travail, dernier rendement. Défaut à garder : la tournée.
5. **Synthèse cuivre**, **contrôle de maturité**, **cahier de cuverie**, **suivi d'élevage**,
   **inventaire des fûts** — ordre actuel justifié, le tri s'y ajoute en option.
6. **Registre phyto (PDF et CSV)** et **registre des manipulations** — chronologiques par nature.
   **Ne pas y toucher** : un registre se lit dans l'ordre où les choses se sont passées.

⚠️ Le rendement de l'**état du vignoble** (`rendCell`, dernier `rendement_hist`) et celui d'ici sont
deux chemins vers la même grandeur. Ils n'ont pas été confrontés. **À vérifier avant de brancher le
tri par rendement sur ce document-là** — §Économie : deux définitions d'un même chiffre finissent
toujours par diverger.

7. **`npm run build`, `check`, `test:smoke`, `test:e2e`** : pas de navigateur ni de dépendances dans
   le bac à sable. Syntaxe vérifiée (`node --check`), `WHATS_NEW` vérifié **en l'exécutant**,
   `mv-chartes-doc` et `mv-harnais-tri1` verts.

## 120. ★★★ TRI-2 — LE VIGNOBLE ET LE MAGASIN SE RANGENT, ET LES DEUX RENDEMENTS SONT RÉCONCILIÉS (12/09 soir — `utils.js` + `reglages.js` + `reserve.js` + `index.html` + `sw.js` + `scripts/` · APP 7.14 → 7.15 · SW 7.74 → 7.75 · base `43a95ab`, s'empile sur §119)

### Ce que le lot branche

`MV_TRI` existait depuis §119 mais ne servait qu'un document. Trois de plus, dans l'ordre
d'urgence que §119 avait publié :

| Document | Avant | Maintenant |
|---|---|---|
| **État du vignoble** | tournée, sans choix | tournée *(défaut)*, parcelle, surface, avancement, rendement, dernier travail |
| **Inventaire des intrants** | ordre brut de `INTRANTS.produits` | nom *(défaut)*, catégorie, stock, cohérence |
| **Journal des travaux** (CSV) | ordre brut du journal | date, puis parcelle, puis tâche — **sans question** |
| **Avancement par parcelle** (CSV) | ordre brut de `PARCELLES` | parcelle A → Z — **sans question** |

★ **Pourquoi les CSV ne posent PAS de question.** Un tableur retrie en un clic : une feuille de
tri avant un téléchargement serait de la friction pour rien. Mais l'ordre de saisie n'était pas
un ordre — **deux exports du même jour pouvaient sortir différemment**, et comparer deux fichiers
devenait illisible. Un ordre stable ne se demande pas, il se pose. Même raisonnement pour le
**parc de fûts** du bilan matière : il n'a qu'un ordre qui vaille — fournisseur, millésime récent
en tête, référence — et c'est déjà celui de l'inventaire des fûts. *Deux documents qui parlent
des mêmes objets ne doivent pas les ranger différemment.*

### ★★★ LA RÈGLE QUI SORT DE CE LOT : UNE ABSENCE N'EST PAS UNE PETITE VALEUR

Une parcelle sans rendement connu n'est pas la moins productive. Une surface non renseignée n'est
pas une petite surface. Un stock « à activer » n'est pas un stock de zéro : sa valeur est
**inconnue**, pas nulle. Un tri naïf (`(x||0)`) les range tous en tête d'un ordre croissant, où
ils se lisent comme des zéros mesurés.

**Elles partent donc en fin de liste DANS LES DEUX SENS**, avec le nom pour départager. Une
absence ne se retourne pas quand on retourne le tri — c'est la même règle que celle déjà posée
dans `_vgnLignes` pour les communes vides, et c'est le cousin direct de l'invariant `(table[k] ||
default)` interdit quand `table[k]` peut valoir 0.

### Le défaut ne bouge pas, et il ne se recalcule pas

`_vgnLignes()` rend déjà la tournée. `_vgnTrier` ne la **recalcule pas** : sur la clé `tournee`
elle rend **la liste elle-même**, le même objet. Un tri « équivalent » réécrit à la main aurait
placé « Sans commune » ailleurs — la règle des communes vides vit dans `_vgnLignes`, pas dans le
comparateur. Le harnais l'exige par identité d'objet (`===`), pas par égalité de contenu.

### ★★ « Dernier rendement connu » ne compare pas la même année

C'est le dernier de **chaque** parcelle : toutes n'ont pas été vendangées la même année. Trier
cette colonne classe donc des millésimes différents les uns contre les autres. Le classement
reste utile — *quelles parcelles ont produit le plus, la dernière fois qu'on les a vendangées* —
mais il ne doit pas se faire passer pour une campagne. **Le document nomme désormais les
millésimes comparés sous le tableau** dès qu'il y en a plusieurs, et la feuille de tri le dit
avant d'éditer.

★ C'est la même faute que §119 défaisait d'un cran plus bas : là, un rendement d'apport se faisait
passer pour un rendement de parcelle ; ici, un rendement de 2024 se ferait passer pour un
rendement de 2026. **Un classement rend comparables des choses qui ne le sont pas** — c'est ce
qu'il fait de mieux, et c'est exactement ce dont il faut se méfier.

### ★ La question laissée ouverte par §119 est tranchée : les deux rendements SONT le même

§119 se terminait sur : *« `rendCell` et `_vendRecRdt` sont deux chemins vers la même grandeur.
Ils n'ont pas été confrontés. »* C'est fait, et **ils concordent par construction** :

| | `_vendRecRdt` (cave.js) | `_dpRendHistRows` (app.js) |
|---|---|---|
| Numérateur | `Σ _recKg(r)` sur les récoltes du millésime | `Σ e.kg`, et `e.kg = _recKg(rec)` à l'écriture |
| Dénominateur | `_vendParcSurf(nom)` = `parseFloat(p.surface)` | `parseFloat(p.surface)` |
| Agrégation | somme puis division | somme puis division puis arrondi |
| Base déclarée | parcelle entière | `kg_ha_base:'parcelle_entiere'` |

Même numérateur, même dénominateur, même ordre des opérations. La **seule** différence est la
source : `_vendRecRdt` lit les récoltes vivantes, `_dpRendHistRows` lit la dénormalisation posée
sur la parcelle par `_vendRecordRendement`. Ils ne peuvent diverger que si la dénormalisation est
**périmée** — et ce risque-là porte déjà son garde-fou depuis CUV-6, qui a rendu son `catch` muet
bavard.

⚠️ Le harnais fige cette concordance : trois parcelles, deux millésimes, une parcelle partagée
cuvier/vrac, et une contre-épreuve qui remplace le dénominateur par la **surface attribuée** —
elle mord. Si un futur lot fait glisser l'un des deux chemins vers `surface_attribuee_ha`, ça
rougit le jour même au lieu de se découvrir sur une facture.

### Le harnais

`scripts/mv-harnais-tri2.mjs` — **40 vertes, 6 contre-épreuves qui mordent**. Fonctions extraites
de `reglages.js`, `reserve.js`, `cave.js` et `app.js`. Les deux CSV sont éprouvés **par leur
sortie** : le fichier est capté par un `dlFile` bouchonné, puis relu ligne à ligne — et le même
jeu passé **à l'envers** doit produire un fichier identique au bit près.

### Ce qui reste ouvert

1. **Synthèse cuivre** — ordre Cu décroissant, justifié ; le tri s'y ajoutera en option (nom,
   surface, nombre d'applications). Pas urgent : son ordre actuel est déjà le bon par défaut.
2. **Contrôle de maturité, cahier de cuverie, suivi d'élevage, inventaire des fûts** — même cas.
3. **Registre phyto (PDF et CSV), registre des manipulations** — chronologiques par nature.
   **Ne pas y toucher.**
4. **Le rapport de saison et le relevé mensuel** restent hors charte MV_DOC (`document.write`) :
   les convertir change la largeur utile et demande un rendu, pas une relecture de source.
5. **`npm run build`, `test:smoke`, `test:e2e`** : pas de navigateur dans le bac à sable.
   `npm run check` joué en entier, au vert.

## 121. TRI-3 — LES DEUX DERNIERS PROMPTS D'ANNÉE DEVIENNENT DES FEUILLES, ET LA FAMILLE SE REFERME (12/09 soir — `cave.js` + `reglages.js` + `utils.js` + `index.html` + `sw.js` + `scripts/` · APP 7.15 → 7.16 · SW 7.75 → 7.76 · base `43a95ab`, s'empile sur §119 et §120)

### Une feuille de plus ne doit pas être une question de plus

Le contrôle de maturité et le cahier de cuverie posaient déjà leur année dans un `openPrompt`.
Ajouter une feuille de tri **par-dessus** aurait fait deux questions à la suite pour un seul
document — une régression déguisée en fonctionnalité. MV_TRI sait poser l'année (`annees`), et
n'affiche la rangée que s'il y en a plusieurs : le prompt disparaît, le geste ne s'allonge pas,
et le tri vient en plus.

| Document | Défaut *(inchangé)* | Clés ajoutées |
|---|---|---|
| **Contrôle de maturité** | maturité décroissante | parcelle, surface, vitesse, dernier relèvement |
| **Cahier de cuverie** | encuvage croissant | cuve, volume, cuvaison |

Sur la clé par défaut, `_matTrier` et `_cuvTrier` rendent **la liste reçue, le même objet**. Le
harnais l'exige par identité (`===`), comme `_vgnTrier` en §120 : un comparateur « équivalent »
réécrit à la main ajouterait un départage par nom que le document n'avait pas, et deux tirages
identiques cesseraient de l'être.

★ **Un en-tête qui survit au tri est un en-tête qui ment.** Le tableau de maturité s'intitulait
« Ordre de maturité » quel que soit le classement. Il ne le dit plus que quand c'en est un.

### ★★★ CE QUI N'AURA PAS DE TRI, ET POURQUOI — la famille est close

Trois documents restaient sur la liste de §120. Aucun ne recevra de feuille, et **chacun pour une
raison différente de « pas le temps »** :

1. **Le suivi d'élevage a déjà son écran.** `ovCaveExport` filtre par cuvées, par types
   d'opération, par plage de dates, et offre déjà le groupement par cuvée ou par date. Une
   seconde feuille serait un doublon **moins riche** que ce qui existe.
2. **L'inventaire des fûts est structuré par fournisseur.** Son ordre n'est pas un rangement,
   c'est son **plan** : sections par fournisseur avec sous-totaux, puis répartition par millésime.
   Trier autrement ne range pas le document, il le refait.
3. **La synthèse cuivre n'est pas un document.** ⚠️ **L'audit de §119 s'est trompé** : il l'a
   listée avec ses clés de tri (« nom · surface · nb applications ») comme si elle s'imprimait.
   `openSyntheseCuivre` ouvre un **écran**. Le tableau cuivre ne sort sur papier que comme
   **section du registre phyto** — chronologique, réglementaire, à ne pas toucher. Il n'y avait
   rien à trier là, et l'audit initial le comptait quand même.

★ **Ce que ça dit de l'audit** : il a été fait sur les noms du catalogue et le code des
générateurs, pas sur ce que chaque entrée **ouvre réellement**. Onze lignes, une fausse. C'est
peu, mais une entrée de catalogue n'est pas un document : la prochaine fois, suivre le `case` du
`docsGo` jusqu'au bout avant d'écrire une ligne dans un tableau d'audit.

### Le compte final

**Cinq documents posent leur ordre** — état du vignoble, inventaire des intrants, récoltes de la
vendange, contrôle de maturité, cahier de cuverie. **Deux exports CSV** ont un ordre stable sans
question. **Deux registres** restent chronologiques par nature. **Trois documents** gardent
l'ordre qui est leur structure. Reste hors sujet : le rapport de saison et le relevé mensuel,
toujours hors charte MV_DOC (`document.write`) — leur conversion change la largeur utile et
demande un rendu, pas une relecture de source.

### Le harnais

`scripts/mv-harnais-tri3.mjs` — **34 vertes, 6 contre-épreuves**. En plus des deux moteurs, il
éprouve la **structure** : que les `openPrompt` ont disparu, que les cinq entrées de catalogue
annoncent leur question et ferment le hub (`ov:true`), et que les trois documents laissés de côté
le sont bien — l'élevage garde son overlay, les fûts leur `_futsBySupplier`, le cuivre son écran.

★★ **Le piège des commentaires a mordu, pour la cinquième fois recensée** (§53, §57i, §58, la
contre-épreuve de `harnais-claude-md`, et ici). L'assertion « plus d'`openPrompt` » sortait rouge
sur un code parfaitement correct : le **commentaire** de `_matExportChoix` cite `openPrompt` pour
raconter sa disparition. Un grep brut compte les commentaires. On cherche désormais un **appel**
(`/openPrompt\s*\(/`) dans un source **décommenté**, et une contre-épreuve garde la trace du
piège. *Le test avait tort, pas le code* — huitième fois que la question fait gagner du temps.


---

## 122. ★★★ AUDIT — SIX DÉFAUTS TROUVÉS HORS DES HARNAIS, ET DEUX FILETS DE PLUS (13/09 — `admin-gt.js` + `firebase.js` + `app.js` + `cave.js` + `reglages.js` + `phyto.js` + `utils.js` + 5 modules + `sw.js` + `index.html` + `firestore.rules` + backend + 2 pages publiques — **APP 7.16 → 7.17 · SW 7.76 → 7.77**, base `82f22a4`)

Nico : *« vérifie l'intégralité des fichiers, les codes, les calculs, les cohérences, les bugs »*.
La suite complète passait au vert, `node --check` aussi, et ESLint rejoué avec **`no-undef` activé**
(que la config du projet désactive) plus quinze règles de plus n'a rendu **aucune erreur réelle**.
★★ **Ce qui reste après ça ne se trouve pas en relisant : il faut MESURER autre chose.** Les six
défauts viennent de six sondes qu'aucun harnais ne portait.

### ① Le registre commercial vivait dans un document lisible par la terre entière

`firestore.rules` : `match /_guerettech/tenants { allow read: if true; }`, justifié par un
commentaire disant *« Ne contient que {slugs:[…]} : aucune donnée sensible »*. **Le commentaire
était vrai le jour où il a été écrit** — puis `admin-gt.js` a mis `clients[slug]` = {plan,
trialDays, status, created_at, trialExp} dans **le même document**. Sans compte, n'importe qui
lisait le fichier clients complet.
★★★ **Une règle Firestore ne sait pas filtrer par champ : elle protège un DOCUMENT.** Poser une
donnée sensible à côté d'une donnée publique, c'est la publier. La séparation doit être physique.
→ `_guerettech/tenants` ne porte plus que `slugs` + `statuts` (les deux seuls usages **pré-auth** :
unicité du slug à l'onboarding, routage `_fbTenantStatus`). Le commercial passe dans
`_guerettech/clients`, GT-only. Deux helpers, `_agtReadClients` / `_agtWriteClients`, branchés sur
les **sept** sites.
★ **Aucun script de migration** : `fbAdminWriteGT` fait un `setDoc` SANS merge, donc la première
écriture GT réécrit `tenants` sans le champ `clients` — la fuite se referme d'elle-même. Repli
legacy en lecture le temps que ça arrive, des deux côtés (`_agtReadClients` et `_fbTenantStatus`).

### ② FUS-2 — une saisie de minuit et demie était datée de la veille

**117 `toISOString()` dans `src/`, dont 23 qui écrivaient une date en base.**
`new Date().toISOString().slice(0,10)` rend la date **UTC** : à Paris, entre minuit et 2 h (été) ou
1 h (hiver), c'est la veille. Pesée de caisses en vendange, ajout de SO₂ en fin de nuit, ligne de
journal, traitement — **deux de ces registres sont réglementaires, et la cave se travaille la nuit.**
★★★ **Le bon patron était DÉJÀ dans le dépôt** : `_gnrTodayISO` (tracteur.js) construisait la date
en local, seul contre 117. *Quand un projet contient déjà la bonne réponse à un endroit, le lot
n'invente pas — il PROMEUT.* → `_mvISO(d)` / `_mvToday()` dans `utils.js`, **78 réécritures**,
`_gnrTodayISO` et `_today` (reserve.js) deviennent des délégués.
⚠⚠ **HUIT EXCLUSIONS ASSUMÉES, et c'est le cœur du lot** : `_mvJourApres`, `_mvFutIso`, `_cmpSeuil`,
`_cmpEchelle`, `_cmpISO`, `_arcISO`, `_pexIsoPlus` sont des allers-retours **jour-époque**, UTC de
bout en bout — et le RESTER est précisément ce qui les rend justes sous tous les fuseaux
(`mv-harnais-fuseau`). **La règle n'est pas « local partout », c'est « une seule horloge par
fonction ».** Un balayage qui ne connaît pas cette nuance casse des fonctions correctes.
★ **Deux prises en passant** : une date imprimée découpée à la main (`slice(8,10)` sur l'ISO UTC,
cave.js) que le motif avait ratée — *un balayage se vérifie par ce qui RESTE, pas par ce qu'il a
pris* ; et **`addDays` (tracteur.js) mélangeait deux horloges**, exactement la faute de
`_mvJourApres` : `new Date(iso)` lit minuit UTC, `getDate()/setDate()` écrivent en local.
Côté serveur, `dayKey` (claims.js) passe à l'heure de **Paris** : la console GT relit ces clés avec
la date locale de l'opérateur.

### ③ Le défaut `marchand-grillot` avait survécu à sa propre suppression, en deux endroits

`firebase.js:170` acte la décision (*« #10 : plus de defaut 'marchand-grillot' code en dur »*).
Elle avait été appliquée là, **pas dans les deux endroits qui tournent AVANT que le tenant existe** :
- `app.js` — `LS_KEY` était un `const` de module, évalué au chargement donc avant login. Premier
  passage d'un nouveau client : sa sauvegarde hors ligne s'écrivait dans le seau du domaine de
  référence, devenait orpheline au reload, et son `logout()` ne la purgeait jamais. → `_mvLsKey()`,
  relue à chaque appel, qui rend `''` quand le tenant est inconnu : **sans tenant, on n'écrit rien
  plutôt que d'écrire ailleurs.**
- `sw.js` — le manifest dynamique retombait sur `marchand-grillot` quand le cache tenant est vide,
  **c'est-à-dire au 1ᵉʳ install** ; le commentaire le disait lui-même. Le raccourci PWA du nouveau
  client était donc épinglé sur `?tenant=marchand-grillot`, et `?tenant=` est en priorité absolue.
  Les règles Firestore l'empêchaient de VOIR quoi que ce soit — aucune fuite — mais son icône
  ouvrait une app morte, et **le navigateur fige le `start_url` à l'install : ça ne se répare pas
  tout seul.** → `start_url` neutre quand le tenant est inconnu.
★ **La leçon de méthode** : une suppression de défaut se vérifie par un `grep` sur TOUS les
fichiers, pas sur celui qu'on avait ouvert. Les défauts survivent là où on ne regardait pas.

### ④ Le cuivre lissé sur 7 ans criait au loup

`_cuParcRolling` ne divisait que par les années **où l'on avait traité** (`if(v>0)vals.push(v)`).
Banc d'essai sur les vraies fonctions :

| scénario | avant | après |
|---|---|---|
| 4 kg en 2020, rien 5 ans, 4 kg en 2026 | 4,00 → **Vigilance** | 1,14 sur 7 ans → Conforme |
| 6 kg une année sur deux (18/28, conforme) | 6,00 → **Dépassement** | 3,60 sur 5 ans → Vigilance |
| 4 kg, premier cuivre du registre | 4,00 → Vigilance | 4,00 **sur 1 année** → Vigilance |

★★★ **Le diviseur juste n'était ni 7 ni les années traitées : c'est les années COUVERTES PAR LE
REGISTRE.** Une année sans cuivre à l'intérieur de la période suivie est un vrai zéro, elle compte ;
les années d'avant la première trace sont **inconnues**, pas nulles — diviser par 7 un domaine qui
a deux ans d'historique mentirait dans l'autre sens.
★ **Le troisième cas ne bouge pas, et c'est correct** : 4 kg sur une seule année, c'est le plafond
annuel. Ce qui change, c'est que l'écran **dit sur combien d'années il divise** (`_cuParcRollN`) —
*« 1,71 kg/ha/an » ne se lit pas sans son assiette.* C'est §7 vu depuis un indicateur réglementaire.
⚠ Le défaut n'allait que dans un sens : fausse alerte, jamais fausse tranquillité. **Ce n'est pas
une excuse** — un indicateur réglementaire qui crie au loup s'apprend à être ignoré.

### ⑤ Le plafond 28 était en dur pendant que le plafond annuel était réglable

`_cuPlafond()` est réglable (défaut 4), mais le budget 7 ans était écrit **28** à six endroits
(`phyto.js`, `reglages.js` ×3, `app.js` ×3). Changer le réglage faisait suivre la vue annuelle et
pas celle des sept ans. → `_cuPlafond7()` = `_cuPlafond()*7`, exposé sur `window`.
⚠ **Un seul 28 reste, et c'est voulu** : le rappel de la règle UE elle-même sous le champ de
réglage. Un texte qui énonce le règlement n'est pas un calcul.

### ⑥ Les réglages de vendange n'avaient aucun garde-fou

`_vendSaveParam` lisait `.value` sec. **Les `min`/`max` des champs sont des attributs HTML : sans
soumission de formulaire, ils ne bloquent rien.** Or `ratio_min`/`ratio_max` alimentent `_mlKgHl`,
donc `_mlRdtMoyen`, donc le rendement hL/ha — un indicateur réglementaire.
★ **Et l'ordre compte** : le ratio est en kg/hL, donc le ratio MAXIMUM donne le volume MINIMUM.
Intervertir les deux champs est une confusion naturelle, et elle retournait **toutes** les
fourchettes de l'app (« 15,4–14,3 »). → valeurs bornées, ratios remis dans l'ordre, **et le toast
le dit** : on ne corrige pas une saisie en silence.

### Deux filets de plus

| script | ce qu'il interdit |
|---|---|
| `scripts/mv-sitemap.mjs` | qu'un `<lastmod>` soit antérieur au dernier commit de sa page (**les six l'étaient**) ; qu'une page publique indexable ne soit ni dans le sitemap ni dans une liste d'exclusions **motivées** ; qu'un `<loc>` s'écarte de son `canonical`. Branché dans `check` et `prebuild`. Sans `--check`, il réécrit les dates depuis git. |
| `scripts/mv-dates-reelles.mjs` | pas un harnais : le module qui **extrait `_mvISO`/`_mvToday` du vrai `utils.js`** pour les six harnais intégrés qui les exécutent désormais. |

★★★ **SIX HARNAIS INTÉGRÉS ONT CASSÉ D'UN COUP** sur `_mvToday is not defined` (`cuv7`,
`reste-a-rentrer`, `fusion`, `cuvdoc`, `entretien`, `tri2`) — **et c'est exactement leur travail** :
ils exécutent du vrai code, et ce code a gagné une dépendance. ⚠⚠ **Le trou n'a PAS été comblé
par six bouchons écrits à la main.** Un bouchon a sa propre signature : il suffirait que `_mvISO`
reparte en UTC pour que les six restent verts sur un code faux. Le module extrait les fonctions
réelles, comme le fait déjà le harnais fuseau.

### ⚠⚠⚠ §122b — LE FILET NEUF A BLOQUÉ LE DÉPLOIEMENT LE JOUR MÊME

Premier passage de CI après intégration : **les six pages rouges**, `Process completed with exit
code 1`. Et comme `mv-sitemap.mjs` tourne aussi en `prebuild`, **le build ne passait plus**.

★★★ **LA CAUSE N'EST PAS LE SEUIL, C'EST LA MESURE.** `actions/checkout@v5` clone en
**profondeur 1**. Dans un clone superficiel, `git log -1 --format=%ad -- <fichier>` ne connaît
qu'un seul commit : il rend **la date de HEAD pour tous les fichiers**. Le contrôle comparait donc
chaque `lastmod` à la date du jour — il ne pouvait que rougir, à chaque passage, pour toujours.
Reproduit à l'identique par `git clone --depth 1` avant d'écrire une ligne de correctif.

★★ **UN CONTRÔLE DOIT MESURER SON ENVIRONNEMENT AVANT DE JUGER.** `git rev-parse
--is-shallow-repository` : en clone superficiel, la règle de fraîcheur se met en **veille** avec une
ATTENTION qui nomme le remède, et le régénérateur **refuse d'écrire** plutôt que de graver des dates
fausses dans le sitemap. *Un filet qui rougit toujours ne dit plus rien — il apprend juste à être
ignoré, et il emporte le déploiement avec lui.*

★★ **ET LA SÉVÉRITÉ ÉTAIT FAUSSE AUSSI, indépendamment.** Le sitemap se régénère **après** le
commit des pages : il est normalement en retard de quelques jours, et exiger zéro imposait une danse
à deux commits pour chaque retouche d'une page publique. Le défaut trouvé, lui, était de **40 à 70
jours**. → `SEUIL_JOURS = 30` : au-delà rouge, en deçà ATTENTION. Les règles **structurelles** (page
citée mais absente, page indexable orpheline, `canonical` ≠ `loc`) restent bloquantes en toutes
circonstances : elles ne dépendent pas de git.

★ `.github/workflows/ci.yml` : **`fetch-depth: 0`** sur les deux `checkout`, pour que la règle
serve vraiment en CI au lieu de dormir.

⚠ **La leçon, et elle vaut pour tous les filets à venir** : un contrôle neuf se rejoue **dans les
conditions de la CI**, pas seulement dans le bac à sable. Ici, un `git clone --depth 1` de trente
secondes aurait tout dit avant la livraison. C'est le pendant de §6b (« vérifier qu'un test attrape
bien le bug ») : il faut aussi vérifier **qu'il ne l'invente pas**.

### ⚠⚠⚠ Ce que ce lot dit de la méthode d'audit elle-même

- **Deux constats de l'audit étaient FAUX, et ils ont été retirés.** `_vendDegrePot` (16,83 en dur)
  avait déjà disparu entre deux `git pull`. Et « aucune mention HT/TTC sur la page tarifs » était
  une **erreur de grep** : la page porte la bonne mention, en meilleure forme (*« TVA non
  applicable, article 293 B du CGI — les montants affichés sont ceux que vous payez »*). Seules les
  CGU ne la portaient pas → article 3.1 aligné sur les mentions légales.
  *Un audit se vérifie comme du code, et il se corrige devant témoin.*
- ★★ **LE PATCH A ÉTÉ REJOUÉ SUR BASE NEUVE, DEUX FOIS** (`43a95ab` puis `82f22a4`) : diff → depôt
  propre → `git pull` → `git apply`. **Un patch qui s'applique ne prouve que les lignes de
  contexte** : le re-balayage des motifs a suivi, et il a trouvé une étiquette « Plafond UE 28 »
  laissée à côté d'une jauge devenue dérivée.
- ★★★ **LES CLIQUETS ONT ATTRAPÉ L'AUDITEUR TROIS FOIS** : preflight (un `catch {}` vide écrit dans
  `_mvLsKey`, 156 contre 155), `mv-harnais-jetons` (un `font-weight:400` hors des trois pas),
  `mv-harnais-icones` (deux noms d'icônes **inventés** dans le `WHATS_NEW` — `horloge` et `reglage`
  n'existent pas, `reveil` et `curseurs` si). *Celui qui pose les filets s'y prend aussi, et c'est
  la preuve qu'ils valent quelque chose.*


## 123. ★★★ AXE-1 — UNE CAMPAGNE EST BORNÉE PAR SA VENDANGE, ET TROIS DOCUMENTS NE DISAIENT PAS SUR QUOI ILS PORTAIENT (13/09 — `utils.js` + `cave.js` + `pilotage.js` + `phyto.js` + `reglages.js` + `app.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` · APP 7.17 → 7.18 · SW 7.77 → 7.78 · base `25d7fa9`)

**Point de départ**, mot pour mot : *« vérifie rapidement si je peux faire une impression de tous ce
qui a été fait sur l'année vigne (c'est a dire de octobre année N à septembre année N+1) […] vérifie
aussi pour une année fiscale. Vérifie que l'appli soit bien bornée avec les année et campagne
annuelle afin qu'il n'y ait pas de doublon et que tout soit cohérent. »*

**La réponse courte était non, trois fois.** L'axe campagne était **1er août → 31 juillet en dur** ;
aucun document ne listait les interventions sur une fenêtre choisie ; et le registre phyto imprimé
n'était borné par rien.

### 123a. ★★★ CE N'EST PAS UN RÉGLAGE DE MOIS, C'EST UN RÉGLAGE DE CAMPAGNE

**La correction de Nico, en cours de lot** : *« c'est pas un réglage a octobre c'est un réglage de
campagne »*. Le premier jet nommait le bloc « Ouverture de l'année vigne », vantait le 1er octobre
dans le `WHATS_NEW`, la fiche `MV_INFO`, l'aide et le guide — **il prescrivait un mois**.

★★★ **Une campagne est un cycle de production. Ce qui la borne est la VENDANGE ; le mois n'en est
que la traduction en calendrier.** Le bloc s'appelle « Le cadre de votre campagne », et
`_pilCampVend(md)` cadre la vendange **sur la campagne candidate** pour dire ce que ce cadre en
fait : elle l'**ouvre**, elle la **clôt**, ou la borne la **coupe en deux**. Le mois proposé est
`ann.align.moisIdeal` — *celui qui suit la fin des vendanges du domaine, lu dans ses propres dates*.
⚠️ **L'information existait déjà** (§34, `_pilAnnuelData`) et le premier jet ne l'avait pas lue :
c'est **§93 encore une fois** — *avant d'écrire une valeur, chercher si la donnée est déjà quelque
part*.

⚠️⚠️ **Ne pas confondre avec `ann.align`, qui mesure la même chose contre l'EXERCICE.** §34 a
tranché : un exercice comptable est une **donnée** du comptable, on constate seulement où la
vendange tombe dedans — *on ne le déplace pas pour qu'un graphique tombe mieux*. Une campagne, elle,
n'appartient qu'au domaine : **rien d'extérieur n'impose qu'elle coupe sa propre récolte en deux**,
et là on peut le dire franchement. **Deux cadres, deux régimes de parole. Ne pas rouvrir §34-0c.**

### 123b. L'axe devient un réglage — et les copies en dur tombent

- **`utils.js`** : `MV_CAMP_MOIS_DEF = 7`, `_mvCampagneMois()` (lit `CONFIG.eco.campagne_mois`),
  `_mvCampagneDe()` réécrite, et **`_mvCampagneBornes(c)` — source unique des bornes**, qui rend
  `{d0,d1,court,lbl,civil}`. `new Date(c+1, md, 0)` donne la fin quel que soit le mois, `md=0`
  (campagne civile) compris.
- ⚠️ **Quatre copies en dur** retirées : `_bcBornes` (cave), l'offset d'appariement, la frise
  `_arcLigne`, l'échelle `_pilTabArc` (pilotage) → `_arcBornes()`.
- ⚠️⚠️ **Cinq replis étaient figés à 8** (`_mlCampagne`, `_pcavCampagne`, `_rmCampagne`,
  `_bcCampagne`, `_arcCampagneDe`). *Un repli figé pendant que l'app est réglée ailleurs rend un
  millésime faux **deux mois par an**, sans rien afficher.* Ils lisent le même réglage
  (`_mvCampMoisRepli` / `_arcCampMois`).
- ★ **Trois écrans RÉCITAIENT l'axe** au lieu de le lire (intro des Archives, en-tête du bilan,
  légende du comparatif). *Un écran qui récite un réglage qu'il n'a pas lu est pire qu'un écran
  muet : il fait croire que le réglage a raté.*
- **Défaut inchangé à août** : non-régression prouvée sur **396 dates de 2020 à 2030, zéro écart**.

### 123c. `_mvFenetresAnnee` — le mot « campagne » avait trois sens

L'axe des Archives, l'« année vigne » du Pilotage (construite sur les **périodes**), et — dans
l'export phyto — la **période de travail consultée**, proposée sous l'étiquette « Campagne
consultée ». *Un vigneron qui sortait deux registres « de la campagne » obtenait deux périmètres.*
Une liste unique, chaque fenêtre porte son nom (campagne · exercice comptable · période de travail ·
tout), lue par les documents. ★ Quand deux cadres tombent aux **mêmes dates**, la liste **le dit**
au lieu de masquer une ligne.

### 123d. ★★★ LE REGISTRE PHYTO PDF N'ÉTAIT BORNÉ PAR RIEN

`[...window.TRAITEMENTS]`, **tout l'historique**, sous un titre « Campagne `${annee}` » où `annee`
valait **le nom de la période active** (« Printemps 2026 »). L'attestation à signer certifiait
*« pour la campagne Printemps 2026 »*. ⚠️⚠️ **Et le CSV du même registre était correctement borné
depuis des semaines** : deux exports du même document, deux périmètres, dont un réglementaire.
Le PDF passe par le même panneau, et les **six** endroits où il s'annonce disent ses vraies dates.
Les traitements sans date sont écartés **et comptés**.

### 123e. Le journal des interventions

Entre le bilan de campagne (un **résumé** par tâche) et le CSV du journal (**tout**, sans bornes), il
manquait la **liste** sur une fenêtre choisie. Trois sections datées : vigne · tracteur · phyto.
★★ **Trois compteurs nommés, jamais leur somme** — un rognage peut figurer en session tracteur ET en
travail validé. Et la **surface cumulée additionne les passages** (§7 : annoncer l'assiette d'un
chiffre), à côté du nombre de parcelles touchées qui, lui, ne les compte qu'une fois.

### 123f. Ce que les filets ont attrapé — l'auteur du lot compris

- **7 `catch{}` vides** (C14), **2 slots C24b**, **1 interpolation C24c**, et
  **`_mvFenetreParCle`** écrite sans appelant → supprimée (§25.11), pas branchée pour la forme.
- ⚠️⚠️ **UN CONTRÔLE FAIT TAIRE, PAS SATISFAIT** : en passant la clé par une variable dans
  `_phytoExportChoix`, le compteur C24b est **descendu de 9 à 8** — la détection était masquée et
  la clé **toujours pas échappée**. *Un cliquet qui baisse mérite le même examen qu'un cliquet qui
  monte.*
- ⚠️ **Un `node --check` vert après un assert tombé** : le sw.js validé était le fichier **non
  patché** (§25.3, revécu).
- **Deux assertions fausses pour zéro bug** : `mv-harnais-regl-module` figeait « **quatre** choses
  s'écrivent » (un lot qui en **ajoute** une la faisait rougir), et `mv-harnais-info` ne lisait pas
  `reglages.js` — **le catalogue des documents y vit** et y pose ses pastilles. Assouplies sur le
  nombre, étendues sur la couverture ; **jamais contournées**.
- **Le banc a PLANTÉ**, il n'a pas rougi : `extrait.mjs` ne connaissait pas les deux dépendances
  neuves d'`_arcCampagneDe`. *Un banc qui plante dit au moins qu'il ne sait plus lire ; le pire
  serait qu'il verdisse sur du vide* — c'est ce que sa garde de montage protège (10 → 12).

### 123g. `scripts/mv-harnais-axe.mjs` — 33 assertions, 7 défauts réinjectés

Branché dans `check` et `prebuild`, contre-épreuve comprise. Il **exécute** le moteur (396 dates,
bissextiles, campagne civile) et lit le code **sans ses commentaires** (§34g).
★★★ **La contre-épreuve injecte les défauts EN MÉMOIRE, jamais sur disque** (§25.2 : une
contre-épreuve avait laissé les fichiers abîmés). **Et elle porte une garde d'injection** : elle
compte les défauts **réellement** appliqués.
⚠️⚠️ **Elle a servi tout de suite** : deux injections d'abord **mortes** (une regex qui ne matchait
pas) *ressemblaient trait pour trait à un harnais aveugle* ; puis, une fois vivantes, elles ont
révélé **deux assertions trop faibles** — l'une comptait les bornes en dur en tolérant le repli
(supprimer l'appel à la source unique ne la bougeait pas), l'autre testait `/moisIdeal/` (un
littéral posé devant la laissait verte). Renforcées. **7/7 injectés, 9 assertions rougissent.**

### 123g bis. ★★★ `scripts/mv-banc-documents.mjs` — ET LE DEFAUT QU'IL A TROUVÉ APRÈS LA LIVRAISON

★★★ **Le lot avait livré trois documents — deux neufs — sans qu'une seule ligne de leur code
n'ait jamais été EXÉCUTÉE.** `node --check` vert, 33 assertions vertes, preflight vert : *aucun de
ces filets ne construit un document*. `_jivData`, `_jivDoc`, `_pilCampVend` étaient **lus**, pas
lancés. ⚠️ **Un document faux ne plante pas : il s'imprime.**

**Ce que le banc a trouvé en une seule exécution — dans du code déjà livré :**

⚠️⚠️⚠️ **`_pilCampVend` déduisait la campagne candidate de l'AXE EN VIGUEUR, puis la bornait avec le
mois CANDIDAT.** Dès que les deux diffèrent — *c'est-à-dire dès qu'on déroule le sélecteur, l'usage
même de l'écran* — la vendange tombait hors des bornes, `pos` montait à **1,107**, et `clot`
(`pos>=0.72`) passait à vrai. **L'écran annonçait qu'une vendange CLÔTURAIT la campagne qu'elle
OUVRE**, et le bouton de calage disparaissait — exactement l'inverse de ce que le lot venait de
corriger. La campagne candidate se déduit désormais de `md` seul : *la réponse à « si j'ouvre en
&lt;md&gt;, où tombe ma récolte ? » ne peut pas dépendre du réglage actuel.*

**Ce que le banc vérifie** (34 assertions) : le filtre mord **aux deux bords** (30/09 dedans, 01/10
dehors) ; l'équipe compte ses membres et pas seulement `qui` ; une parcelle absente du parcellaire
vaut **0 et jamais NaN** ; la surface additionne les passages **quand le compte de parcelles ne le
fait pas** ; et sur le document construit — aucun `undefined` / `NaN` / `[object Object]` / `null` /
`\uXXXX` **n'atteint la page**, les balises s'équilibrent, un nom hostile est échappé, chaque section
pose ses intertitres dans l'ordre.

⚠️⚠️ **CINQ ASSERTIONS FAUSSES POUR ZÉRO BUG, dans ce seul banc** : le montage tronqué avant
`var _JIV_MOIS` (défaut du banc, pas du code) ; `/<tr>/` qui ne comptait pas `<tr class="jiv-mo">`
(4 contre 7 sur un HTML sain — *les `<td>` à 18/18 étaient le signe que c'était le compteur*) ;
« septembre 2026 » cherché dans le texte entier alors que **le libellé de couverture le contient
déjà** ; une liste d'intertitres à plat supposée croissante alors que **chaque section repart** ;
et deux injections mortes.

★★★ **ET UN FAUX VERT DE CONTRE-ÉPREUVE, LE PLUS INSTRUCTIF DU LOT.** L'injection d'origine visait
`if(!_borne) return !!iso;` — *une ligne qui n'existe pas*. Elle était morte depuis le début. La
contre-épreuve passait quand même, parce que sa condition était « au moins un rouge » **et que les
rouges venaient des assertions fausses, pas du défaut**. Elle n'a été démasquée qu'en mettant le
banc au vert. ⚠️ **Une contre-épreuve dont la condition est « il reste des rouges » ne prouve rien
tant que le banc n'est pas vert par ailleurs.** Garde d'injection posée (5/5 injectés, 11 rouges),
comme sur `mv-harnais-axe`.

### 123h. La note de livraison

**Base : `25d7fa9`** (⚠️ deux commits de Nico — `584975e`, `25d7fa9` — sont arrivés entre la lecture
d'audit et la construction : la fraîcheur **re-mesurée avant le paquet**, comme le veut la règle
d'or n°1, a évité de livrer sur une base morte). Livré : `src/utils.js`, `src/cave.js`,
`src/pilotage.js`, `src/phyto.js`, `src/reglages.js`, `src/app.js`, `index.html`, `public/sw.js`,
`guide/07-phyto.html`, `guide/11-pilotage.html`, `guide/13-donnees.html` (puis
`node scripts/build-guide.mjs`), `scripts/mv-harnais-axe.mjs`, `scripts/mv-harnais-info.mjs`,
`scripts/mv-harnais-regl-module.mjs`, `scripts/banc/extrait.mjs`, `scripts/banc/banc.mjs`,
`scripts/banc/baseline.json`, `scripts/preflight-baseline.json`, `package.json`, `CLAUDE.md`.

**Ouvert, et dit** : ① **aucun rendu navigateur** — à regarder en admin : le bloc « Le cadre de votre
campagne » et sa ligne de vendange, le panneau du journal des interventions, le registre phyto avec
ses dates. ② `_pexZeros` reste à fusionner (§104b). ③ **Le Pilotage n'imprime toujours rien** :
l'écran Économie › Exercice n'a aucun export — le journal des interventions le contourne, il ne le
remplace pas.

## 124. ★★★ SAUV-1 — « SAUVEGARDE COMPLÈTE » EN GARDAIT HUIT SUR VINGT-SIX, ET LA RESTAURATION DÉTRUISAIT CE QU'ELLE N'AVAIT PAS SAUVEGARDÉ (13/09 soir — `firebase.js` + `reglages.js` + `app.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` · APP 7.18 → 7.19 · SW 7.78 → 7.79 · base `ee724dc`)

**Point de départ**, mot pour mot : *« il faut gérer en priorité l'export JSON ! »*, puis, une fois
les arbitrages posés : *« le json doit avoir absolument toutes les données du tenant et la
restauration doit être parfaite comme si aucun problème »*.

### 124a. La mesure, avant toute ligne

Le hub Documents annonçait **« Sauvegarde complète — toutes les données du domaine dans un seul
fichier. À garder au chaud. »** `exportJSON` écrivait **8 clés sur 26** : `parcelles`, `journal`
(filtré `!j.meteo`), `sessions`, `traitements`, `membres` (tronqué), `saisons`, `taches`,
`historique`. Dehors : les **quatre** collections du planning, les **deux** de la cave, `intrants`,
`travaux`, `catalogue`, `conducteurs`, `activites`, `tracteurs_list`, `entretiens`, `reparateur`,
`reparateur_hist`, `kml_polygons`, `config`, `paie`.

⚠️ **Le filet réel n'était pas là** : §9 tient l'export Firestore natif (2 h, 7 j) et un backup JSON
par tenant (3 h, 30 j). Ce n'était donc pas une bombe à retardement — **c'était un écran qui ment**,
et un geste de restauration plus dangereux que ne rien faire.

### 124b. ⚠️⚠️⚠️ LE VRAI DÉFAUT : LA RESTAURATION DÉTRUISAIT L'HISTORIQUE DES CONTRATS

L'export gardait `membres:MEMBRES.map(m=>({nom,roles,statut}))`. `importJSON` faisait
`window.MEMBRES = data.membres` **puis `saveData('membres')`**. Une restauration écrasait donc en
base les **`m.hist[]`** — source de vérité des contrats depuis §37, et de tout coût de
main-d'œuvre daté — les e-mails, les couleurs et le drapeau `bureau`.
★★★ **Le seul geste de l'application capable de ce dégât-là était celui qu'on déclenche quand tout
va déjà mal.** Une sauvegarde partielle est une gêne ; une *restauration* partielle qui réécrit
par-dessus est une perte.

### 124c. La cause racine, et la règle qui en sort

Une **seconde liste de clés**, écrite à la main à côté de `COLLECTIONS`. Elle s'est périmée à chaque
lot qui ajoutait une collection — et **en silence** : rien ne rougissait, le fichier sortait quand
même.
★★★ **UN FICHIER QUI S'APPELLE « SAUVEGARDE COMPLÈTE » SE DÉRIVE DE LA LISTE DES COLLECTIONS,
JAMAIS D'UNE LISTE PARALLÈLE.** `window.MV_COLLECTIONS = COLLECTIONS.slice()`, et le harnais
interdit qu'un littéral de clés réapparaisse dans `exportJSON`.

### 124d. ⚠️⚠️ ON LIT FIRESTORE, PAS LA MÉMOIRE — deux raisons, pas une

- La mémoire est **partielle** : une clé dont le pull a échoué n'y est pas, et `paie` n'y descend
  jamais chez un non-admin. *Une sauvegarde faite sur un état partiel est pire qu'une absence de
  sauvegarde : elle rassure.*
- La mémoire est **transformée** : `applyFbData` reconstruit `kml_polygons` en `[lat,lng]`,
  `_normalizeTaches` normalise, `cave_*` est fusionné avec ses valeurs par défaut. Un aller-retour
  doit rendre le document **tel qu'il est stocké**, pas tel que l'application l'avait interprété.

`fbLireTout()` lit les 26 documents en parallèle (le SDK multiplexe, cf. PERF-1), **chacun avec son
catch** — un refus sur une clé ne doit pas annuler les vingt-cinq autres — et distingue trois
états : lu · jamais créé · en erreur. ★ **Un document qui existe sans champ `value` n'est pas une
donnée** : le compter présent ferait écrire `undefined` à la restauration.

### 124e. ⚠️⚠️⚠️ ET ON N'ÉCRIT PAS PAR `fbSave` — deux raisons, pas une

- **`parcelles` y part en fusion 3-way** (`_saveParcellesMerged`). *Une restauration qui fusionne
  garde ce qu'on voulait justement effacer : ce n'est plus une restauration, c'est un mélange.*
- **La garde anti-écrasement** (`_mvBlockDestructive`) refuse toute écriture qui divise une
  collection par deux. C'est exactement ce qu'une restauration légitime peut avoir à faire.

`fbRestaurerTout()` écrit en `setDoc` direct, **séquentiellement** (en cas de coupure, le rapport
dit où l'on s'est arrêté), puis applique en mémoire **par `applyFbData`** — le chemin du pull, avec
sa reconversion KML et ses cascades : les réécrire ici, c'est se donner un second comportement à
maintenir.
★★★ **La contrepartie de passer outre la garde est un écran, pas un silence.** La garde protège
d'un *accident*, et un accident ne s'annonce pas. Le volet lit l'état actuel, le met en regard du
fichier avec **le même compteur que la garde** (`window._mvTailleDoc` = `_mvDocSize`), et nomme
ligne par ligne : ce qui est remplacé (`avant → après`, rouge quand ça baisse), ce qui **rétrécit**
en tout, et ce à quoi on ne touche pas parce que le fichier ne le contient pas.

### 124f. Trois pièges que le lot a dû fermer

- ⚠️⚠️ **`_baseParcelles` doit suivre.** C'est l'état serveur de référence du merge 3-way. Laissée
  sur l'état d'AVANT, la première écriture de parcelle **ferait remonter ce que la restauration
  vient d'effacer** — et personne ne comprendrait pourquoi.
- ⚠️⚠️ **La snapshot hors ligne porte encore l'état d'avant.** `window._mvPurgerSnapshot()`
  (app.js) l'efface — ★ en appelant `_mvSnapCancel()` **avant**, sinon un flush en attente la
  réécrit juste après, comme le dit déjà la note posée au-dessus de la fonction. Puis
  `location.reload()` : une restauration parfaite repart d'un démarrage propre.
- ★★ **Un fichier ancien porte les parcelles SANS l'avancement qui en découle.** `travaux` se
  déduit des parcelles et l'ancien format ne le sauvegardait pas : restaurer les parcelles seules
  laisserait des pourcentages calculés sur les parcelles d'avant, **sur l'écran d'accueil, sans
  rien pour le signaler**. `recalcAllTravaux()` est rappelée et le résultat écrit — `travaux` est
  volontairement hors de la garde (collection dérivée), `fbSave` suffit.

### 124g. Ce que le preflight a attrapé — l'auteur du lot compris

Quatre erreurs au premier passage : **deux `catch{}` vides** (app.js 157 contre 155, reglages.js 3
contre 1), **un `console.log` de sw.js resté en v7.78** alors que l'en-tête disait 7.79 (le contrôle
de cohérence de version lit *les quatre* endroits), et ★ **`recalcAllTravaux` déclarée sans
appelant** — je venais de supprimer son unique appel avec l'ancien `importJSON`. *Le filet n'a pas
seulement signalé du code mort : il a mis le doigt sur le cas du fichier ancien, que je n'avais pas
vu.*

### 124h. `scripts/mv-harnais-sauvegarde.mjs` — 38 assertions, 6 injections

Branché dans `check` et `prebuild`, contre-épreuve comprise. Il **exécute** `_mvSauvLire` extrait du
vrai `reglages.js` (format 2, format ancien, fichier quelconque) et lit le code sans ses
commentaires (§34g). Les injections sont **en mémoire, jamais sur disque** (§25.2), avec garde
d'injection : **6/6 appliqués, 7 assertions rougissent**.

⚠️⚠️ **UNE INJECTION NE TOUCHAIT PAS L'ASSERTION QU'ELLE CROYAIT TESTER.** « la restauration
repasse par `fbSave` » remplaçait la ligne d'écriture — qui vit dans `_mvRestaurerUne`, pas dans
`fbRestaurerTout`. Mon assertion ne lisait que le corps de la seconde : elle serait **restée verte**
pendant que la première réécrivait par `fbSave`. C'est §123g à nouveau, dans le lot suivant. Les
deux corps sont désormais couverts.

★★★ **L'assertion qui ne se périmera pas** : *les 26 collections ont toutes un nom en clair*
(`MV_SAUV_NOMS`). Une collection ajoutée demain sans libellé ferait afficher
« `planning_hsup` : 0 → 41 » à un vigneron. C'est la règle d'or n°5 transformée en filet.

### 124i. Une prise en passant

`_docsPane` portait la liste de ses volets **écrite à la main** —
`['docs-pane-mois','docs-pane-etp','docs-pane-releve']` — et elle avait **déjà un trou** :
`docs-pane-plannom` (§NAV) n'y figurait pas, donc une fois ouvert il restait visible **sous** le
volet suivant. Elle balaie maintenant les volets réellement présents dans `#docs-pane`. *Même
maladie que la liste de clés de l'export, dans le même fichier, à trois cents lignes d'écart.*

### 124j. La note de livraison

**Base : `ee724dc`.** Livré : `src/firebase.js`, `src/reglages.js`, `src/app.js`, `src/utils.js`,
`index.html`, `public/sw.js`, `guide/13-donnees.html` (puis `node scripts/build-guide.mjs`),
`scripts/mv-harnais-sauvegarde.mjs`, `scripts/harnais-claude-md.mjs`, `package.json`, `CLAUDE.md`.
`npm run check` joué **en entier**, ESLint installé dans le bac à sable (`npm install eslint@9
--no-save`, cf. §28) pour que `lint-cliquet` et `mv-harnais-globaux` tournent vraiment.

**Ouvert, et dit** : ① **aucun rendu navigateur** — le volet de comparaison est du HTML neuf, à
regarder en admin, thème clair et sombre, et sur téléphone. ② **Le poids du fichier n'a pas été
mesuré sur un vrai domaine** : avec les contours KML et le planning, il peut passer de quelques
centaines de ko à plusieurs Mo — l'indentation a été retirée pour cette raison, mais la mesure
reste à faire chez MG. ③ **La restauration n'a jamais été jouée de bout en bout** : à essayer sur
un slug jetable, jamais sur un tenant vivant. ④ `npm run build`, `test:smoke`, `test:e2e` : pas de
navigateur dans le bac à sable. ⑤ ★ Le fichier contient les **taux horaires** : c'est la décision
de Nico (« absolument toutes les données »), le guide le dit, mais aucune protection ne l'entoure
côté disque du client.

## 125. ★★★ VIS-1 — LA VISITE SE JOUE EN VINIFICATION, ET LE CADRAGE NE SE CACHE PLUS SOUS LES BARRES (13/09 — `app.js` + `sw.js` + `scripts/` · APP **inchangé** · SW 7.79 → **7.80** · base `8579128`, **réintégré sur `7db7097` après l’écrasement de §126**)

**Demande de Nico** : *« revoir l'intégralité de la visite démo, on est en vinification, les
vendanges sont terminées, insiste sur ce côté-là, et fais en sorte que ce soit lisible aussi sur
téléphone — les cadrages sont parfois cachés. »*

### ⚠️⚠️⚠️ LA NARRATION RACONTAIT LE PRINTEMPS, LES DONNÉES RACONTAIENT LA VENDANGE

Les 19 moments parlaient d'ébourgeonnage, de pression mildiou et de broyage d'inter-rang.
Pendant ce temps `_visiteScenario()` semait **quatre apports de vendange sur cinq jours et deux
cuves en fermentation**, dont une à 1006 le jour même. **Les deux écrans étaient dans la même
démo.** Un harnais ne voit pas ça : il vérifie qu'un sélecteur existe, pas qu'une phrase parle du
mois qu'on est.

★ **La règle qui en sort** : *une démo qui met en scène une journée type a une DATE. Elle se
relit à chaque changement de saison, comme on relit un prix après une hausse.*

### Les cinq défauts de données, trouvés en relisant le seed

1. **Trois parcelles qui n'existent pas.** Les apports portaient `Le Clos`, `Aux Combottes`,
   `En Champs` ; le domaine de démo a Clos du Moulin, La Combotte, Champ de la Croix… Le rendement
   écrit par parcelle (`_vendRecordRendement`, croisement **par nom**) ne retombait sur rien, et
   « encore sur pied » annonçait un domaine à peine vendangé.
2. **Des volumes qu'un vigneron lit comme faux en trois secondes.** 48 caisses de 25 kg sur 1,2 ha
   = **9 hL/ha**, et la cuve qui les recevait était déclarée à **21 hL pour 15 réels**. Tout est
   recalculé caisses → kg → hL → hL/ha au ratio du réglage : **34 à 42 hL/ha**, huit parcelles
   rentrées, une vendue au négoce.
3. **`statut:'macera'` n'existe pas.** `_VEND_STAT` connaît setup / mpf / fa / decuvage / fml /
   termine. La cuve était donc **inactive** : absente de la tournée, sans habillage d'état. Le bon
   statut de la macération pré-fermentaire est `'mpf'`.
4. **Un DAR de 28 jours posé la veille d'une récolte vieille de cinq jours.** Le registre se
   contredisait lui-même — et c'est *l'écran du contrôle* que la visite met en avant. Les passages
   reculent avant la vendange, plus aucun délai de rentrée n'est actif, `window._visiteDrae={}`
   **redevient juste** (il était faux pour la raison inverse en août, cf. §27e).
5. **La saison active était « Printemps 2026 — mars à juillet ».** En septembre, la démo pilotait
   une campagne close depuis deux mois, le lendemain du lot AXE-1 qui dit qu'une campagne est
   bornée par sa vendange. La période active devient **« Après-vendange 2026-2027 »**, tâches
   `Palissage / Tirage / Taille` — et **la taille donne enfin sa matière à l'écran des échéances**.

### ★★★ LE NOM D'UNE FEUILLE DE STYLE EST UNE RESSOURCE PARTAGÉE

`_mvtBuild()` posait `<style id="mvt-css">`. `_vtCss()` — **la tournée du cuvier, dans `cave.js`** —
commence par `if(document.getElementById('mvt-css')) return;`. Or `_mvtBuild()` est appelé par
`_mvtWelcome()`, donc **dès l'écran d'accueil de la démo** : à partir de là, et pour toute la
session, **la tournée se rendait sans son habillage**. Les deux feuilles sont valides, les deux
modules sont corrects : **c'est le NOM qui collisionne**, et aucun contrôle du dépôt ne regardait
les identifiants de `<style>`. La visite prend `mvt-visite-css`, et l'assertion 8 du harnais
interdit désormais qu'un module réclame l'identifiant d'un autre.

### ★★★ LE CADRAGE : DEUX BARRES MANGENT L'ÉCRAN, ET PERSONNE NE LES MESURAIT

Le projecteur visait un rectangle et le centrait avec `scrollIntoView({block:'center'})` — c'est-à-dire
**au milieu de l'écran ENTIER**. Or, sur un téléphone :
- en haut, **l'en-tête du module est `sticky`** (§21b) et couvre 90 à 140 px ;
- en bas, **la narration est posée par-dessus le dock**, et sa hauteur **change à chaque moment**
  puisqu'elle porte le texte — jusqu'à **plus de 200 px** pour le plus long des 19 (232 caractères).

Ce qui restait entre les deux n'était calculé nulle part. Une carte un peu haute, ou la dernière
d'une page, se retrouvait **sous la barre** : le halo entourait quelque chose qu'on ne voyait pas.
Le défaut est **intermittent** — il dépend de la hauteur de la cible, de sa place dans la page et
de la longueur du texte — donc il se corrige mal « à l'œil ».

**Trois corrections, et l'ordre est la plus importante** :
1. ★★★ **La narration s'écrit AVANT le défilement.** Avant, on faisait défiler puis on écrivait la
   barre : **la hauteur mesurée était celle du moment précédent.**
2. **`_mvtBande()`** mesure l'en-tête de la page active (plus le bandeau d'essai s'il est là) et la
   barre de narration (ou celle des chapitres), et rend la bande utile. Garde-fou : si les deux
   barres prenaient plus que l'écran, on rend une bande minimale — c'est exactement le cas où
   l'ancien code masquait tout.
3. **`_mvtScrollDans()`** centre dans la bande, pas dans l'écran ; et pour **une cible plus haute
   que la bande, il cale son HAUT** : un rectangle de 600 px dans une bande de 400 ne se centre
   pas, il se lit par le haut. **`_mvtReposition()`** rogne enfin le halo au bord de la bande.

★ **Textes plafonnés** : `tx` ≤ 160 caractères, `hyp` ≤ 110. Narration totale **3 451 caractères
sur 20 moments**, contre **4 232 sur 19** — mesurés dans le fichier, pas lus dans le document
(§27e en annonçait 3 414 : **encore une dérive de doc**, cf. §44).

### Les 20 moments, trois actes

- **I — 7 h, la journée commence au cuvier** : Cave › Aujourd'hui · **la tournée** (geste : compter
  un pigeage) · **la courbe de la cuve 3 à 1006** · météo par secteur · le cap du jour.
- **II — la trace s'écrit toute seule** : l'écran de Jean · le ✓ · le journal · **les apports et le
  rendement face au plafond** · **le raisin vendu et le bon de livraison** · le tracteur · la
  Réserve (SO2 déduit, fûts neufs) · le registre vu du contrôle · le Chai.
- **III — ce que ça rend** : les vendangeurs · le pointage · la fiche · **la date qui ne rentre
  pas** · le coût par parcelle · **la campagne fermée par la vendange** + les 22 documents.

★ **Sortent du parcours et restent dans les 26 chapitres** : la carte du domaine (elle ne dit rien
de la saison), le verdict du cockpit (doublon avec les échéances), le simulateur de renfort
(troisième écran de Pilotage d'affilée). ★ **Entre dans le parcours** : le Cuvier — trois moments,
et c'est la saison qui les justifie.

⚠️ **Le chiffrage n'a pas bougé** : 9 lignes, 127 h, +37 h hors total. Les neuf clés restent
démontrées une par une — **la contre-épreuve d'août est passée telle quelle**, ses sept mutations
citant des chaînes qui existent toujours. *Vérifié avant de la « réparer »* : on annonçait qu'elle
casserait, elle ne cassait pas.

### Ce que les harnais gagnent

`mv-harnais-demo` : **170 assertions** (163 + 7). Deux familles neuves —
**⑧ l'identifiant de feuille de style** (la visite ne réclame plus `mvt-css`, aucun autre module ne
réclame `mvt-visite-css`) et **⑨ le cadrage** (plus de `scrollIntoView` dans le moteur, narration
écrite avant le défilement, halo borné par `_mvtBande()`). Contre-épreuve : **10/10**.

⚠️ `mv-harnais-cave-auj` exigeait *« la visite guidée (17 h 15) atterrit sur Aujourd'hui »* avec le
littéral `selectCaveSection('aujourdhui')`. **L'heure n'est pas l'invariant, l'écran l'est** : la
Cave est passée du 15ᵉ moment d'un soir de printemps au **premier écran de la journée**, et la
navigation passe par `_mvtGoCave`. L'assertion accepte les deux formes et ne cite plus d'heure.

⚠️ **Un émoji de plus dans `app.js` sort rouge** : le cliquet DS-1 interdit toute remontée du compte
par surface (79 → 80). Une activité neuve prend un **nom d'icône** (`emoji:'raisin'`) — `_actIcone`
laisse passer les deux.

### Versionnage — pourquoi APP ne bouge pas

⚠️ **Lu après coup** : ce lot a été collé sur SAUV-1 (§124), qui venait de prendre **APP 7.19 et
SW 7.79**. Le numéro de SW livré ici était donc **déjà pris** — le lot est reposé en **7.80**, et
APP reste celui de SAUV-1. Le raisonnement ci-dessous ne change pas : la visite n’est pas visible
d’un client. Ce qui change, c’est qu’**un numéro n’appartient pas au lot qui l’a écrit, il
appartient au dépôt au moment du collage** (§126).

`app.js` est touché, donc **bump SW obligatoire**. Mais **rien de ce lot n'est visible d'un client** :
la visite est un écran de prospect, servi sur un bac à sable. C'est le cas « correctif invisible »
de §7 (modèle : le correctif `ecf` du 09/08) — **`APP_VERSION` inchangé, `WHATS_NEW` intact, SW
seul bumpé**. ⚠️ Un bloc `WHATS_NEW` vide en tête **ne passe pas** `mv-whatsnew-check` : l'assertion
« depuis N-1 → le seul bloc N » filtre les blocs sans item. Le journal ne prend donc **aucun** bloc.


## 126. ★★★ UN LOT COLLÉ SUR UN AUTRE A EFFACÉ UNE SECTION ENTIÈRE, ET TROIS FILETS N'ONT RIEN VU (13/09 nuit — `mv-base.mjs` + `app.js` + `sw.js` + `CLAUDE.md` + `scripts/` · SW 7.79 → 7.80 · base `7db7097`)

**Ce qui s'est passé, dans l'ordre.** SAUV-1 (§124) est poussé en `7f52302` : APP 7.18 → 7.19,
SW 7.78 → 7.79, un script neuf `mv-harnais-sauvegarde.mjs`, et cinq endroits touchés dans
`CLAUDE.md`. VIS-1 (§125), **construit sur `8579128`** — le commit d'AVANT — est collé par-dessus
en fichiers complets et commité en `7db7097`. Coller un fichier complet par-dessus un commit plus
récent n'est pas une fusion : **c'est un écrasement.** Ont disparu :

- **`CLAUDE.md` §124 SAUV-1** — la section entière, plus quatre autres retouches du même lot ;
- **`app.js` : `window._mvPurgerSnapshot`** — la fonction qui purge la snapshot hors ligne après
  une restauration ;
- **`public/sw.js` : l'entrée de changelog 7.79**, remplacée par une autre portant **le même
  numéro** ;
- **`harnais-claude-md.mjs`** : le commentaire du compteur, réécrit.

### ⚠️⚠️⚠️ POURQUOI LES TROIS FILETS SONT RESTÉS VERTS

1. **La garde de base ne s'arme pas en CI.** `mv-base.mjs` exigeait que `.mv-base` soit **modifié
   ou non suivi** pour se déclencher — la présence d'un lot frais. Une fois commité, il se désarme.
   Or **la CI ne voit jamais un arbre sale** : elle lisait donc toujours « rien à vérifier ».
   Le contrôle écrit pour ce cas précis était **aveugle exactement là où le cas se produit.**
2. **Le compteur de sections comparait un NOMBRE.** SAUV-1 ajoutait §124, VIS-1 ajoutait §124 :
   155 + 1 des deux côtés. `156 ≥ 156`, vert. **Un compteur ne voit pas une substitution** — il
   faudrait comparer les TITRES, et personne ne l'avait remarqué parce que jusqu'ici deux lots
   n'avaient jamais réutilisé le même numéro.
3. **La fonction perdue était appelée sous garde.** `reglages.js` fait
   `if(typeof window._mvPurgerSnapshot==='function')`, et `mv-harnais-sauvegarde.mjs` vérifie que
   **l'APPEL** existe, pas la définition. Une garde défensive rend une disparition silencieuse :
   la restauration marchait, elle laissait juste la snapshot périmée derrière elle.

★★★ **Ce qui a fini par rougir** : *« tout script de `scripts/` est nommé dans le document »*.
`mv-harnais-sauvegarde` n'apparaissait plus nulle part dans `CLAUDE.md` — **parce que la section
qui le nommait avait été effacée**. La sonde la plus indirecte des trois est la seule qui ait
parlé. C'est la deuxième fois qu'elle attrape un chantier perdu (§58).

### La correction — une fusion à trois voies, pas un choix

Les quatre fichiers sont refaits par `git merge-file` : **base** = `8579128` (la base déclarée par
le lot), **notre** = `7db7097` (l'état poussé), **leur** = `7f52302` (le commit écrasé). Trois
hunks se recollent seuls ; les trois conflits sont ceux où les deux lots écrivaient au même
endroit — le numéro de SW, le compteur de sections, la section §124. **On ne choisit pas un
gagnant : les deux lots existent.** SAUV-1 garde §124 et SW 7.79 ; VIS-1 devient §125 et
**SW 7.80**.

⚠️ **Un numéro de version n'appartient pas au lot qui l'écrit, il appartient au dépôt au moment du
collage.** VIS-1 avait écrit 7.79 en toute bonne foi : c'était libre sur sa base. C'est la règle du
doute de §7, vue de l'autre côté — **au moindre écart, on bumpe.**

### Le filet qui manquait

`mv-base.mjs` s'arme désormais **aussi après le commit** : si le dernier commit **touche
`.mv-base`**, alors `.mv-base` doit valoir **`HEAD~1`**. C'est la même règle qu'en local — un lot
se colle sur sa base — lue après coup au lieu d'avant, donc **exécutable en CI**. Elle se désarme
toute seule au commit suivant (qui ne touche pas `.mv-base`), sinon elle serait rouge à jamais et
on finirait par la retirer. La CI clone déjà en `fetch-depth: 0`, donc `HEAD~1` est lisible ; sans
parent, le contrôle **le dit** et laisse passer. **Contre-épreuve : 7/7**, dont les deux cas neufs
— un lot commité sur sa base (vert) et un lot commité sur un autre commit (rouge).

★ **Ce que ça ne couvre toujours pas** : un lot poussé sans `.mv-base` à jour. La sonde des scripts
et l'œil restent les derniers filets — et c'est l'œil qui a lu la sortie de CI ce soir.

## 127. ★★★ TYPO-1 — LE BARÈME EXISTAIT DEPUIS DS-0 ET DEUX MODULES SUR ONZE S'EN SERVAIENT (14/09 — `src/*.js` + `index.html` + `src/styles.css` + `scripts/` + `package.json` · APP **inchangé** · SW 7.80 → **7.81** · base `eea1df4`)

**Point de départ** : *« on se fait P1 »* — la tranche de dette mesurée en §123 bis, dont l'entrée
« l'échelle typographique ».

### 127a. ⚠️ LA MESURE A CORRIGÉ MA PROPRE FORMULATION

J'avais écrit, la veille : *« 1 475 sites sous 12 px, le trop-petit est industrialisé »*. Le compte
était juste mais **le diagnostic était faux** — et le regex qui l'avait produit était faux aussi :
sa classe de caractères excluait `)`, donc **il sautait purement et simplement toute déclaration
écrite en `var(--pt-x,Npx)`**. Il n'avait vu aucun jeton. Le vrai état :

| | px en dur | jetons |
|---|---|---|
| `pilotage.js` | **0** | 229 |
| `cave.js` | 68 | 501 |
| `admin-gt.js` | 473 | **0** |
| `index.html` | 408 | **0** |
| `reglages.js` | 327 | **0** |
| `app.js` | 299 | **0** |
| `planning.js` | 278 | **0** |
| `styles.css` | 1 018 | 15 |

**82 % des tailles en dur, et 764 jetons concentrés dans trois fichiers.** Le sujet n'était pas
« le texte est trop petit » : c'était **un barème posé par DS-0, appliqué dans deux modules, puis
abandonné**. ★ *Un chiffre juste peut porter une conclusion fausse. Ce qui a changé la conclusion,
c'est la ventilation par fichier — pas le total.*

### 127b. ★★★ CE N'EST PAS UN SUJET DE PROPRETÉ, C'EST CE QUI BLOQUE LE RÉGLAGE « TAILLE DU TEXTE »

Le cran d'accessibilité (lot B du backlog) se pose **en une ligne dans `:root`**. Mais tant que
82 % des tailles sont écrites en dur, ce réglage ne déplacerait que 18 % de l'écran —
**c'est pire que pas de réglage du tout** : l'utilisateur croit avoir agrandi, et la moitié de
l'interface ne bouge pas. La conversion n'est donc pas du rangement, c'est **le prérequis de la
fonctionnalité**.

### 127c. La règle de conversion : aucun arrondi, donc aucun risque

**1 246 sites convertis, zéro pixel de changement.** Seules les valeurs **exactement égales** à un
cran ont été touchées : 11 → `--pt-micro` (671), 14 → `--pt-base` (162), 12.5 → `--pt-txt` (135),
10.5 → `--pt-lbl` (89), 9.5 → `--pt-nano` (77), plus 17/20/23/27/31/40 (112).
Les **1 966 restants** — 12, 13, 10, 9, 11.5, 15, 16, 22, 18, 13.5 — demandent un arbitrage à l'œil
(13 → 12.5 ou 14 ?) et attendent leur lot. ★ *Un lot mécanique et un lot de goût ne se mélangent
pas : le premier se prouve, le second se regarde.*

### 127d. ⚠️⚠️ LE REPLI EST OBLIGATOIRE — `var(--pt-micro,11px)`, jamais nu

**Dix modules sur douze construisent des fenêtres d'impression**, et `:root` n'y existe pas. Un
`var(--pt-micro)` nu n'y résout rien : la déclaration devient invalide et la taille retombe à
l'héritage — sur un registre phytosanitaire opposable en contrôle.
C'est exactement la famille de `_mvIcon` vs `_mvIconInline` (règle F du harnais des icônes) : *un
document imprimé ne vit pas dans le document de l'application.*
★ **La convention existait déjà** : les 755 jetons de `cave.js`, `pilotage.js`, `reserve.js` et
`utils.js` portaient **tous** leur repli, et les 9 sans repli étaient tous dans `styles.css`, où
`:root` s'applique toujours. Le lot n'a pas inventé la règle, il l'a **relevée dans le code
existant et transformée en assertion**.

### 127e. `scripts/mv-harnais-typo.mjs` — l'assertion qui garde l'acquis

Un cliquet seul ne suffisait pas : il autorise d'écrire `font-size:11px` ici pendant qu'on en
convertit un ailleurs, à somme nulle. L'assertion forte est donc :
★★★ **AUCUNE TAILLE ÉGALE À UN CRAN NE PEUT ÊTRE ÉCRITE EN DUR.** Un `font-size:14px` écrit demain
rougit le jour même, sans attendre un audit.
Le reste : le barème est **vérifié** dans `:root` (onze crans, aux bonnes valeurs) au lieu d'être
supposé ; le repli est exigé dans `src/*.js` ; le px en dur et le trop-petit sont à cliquet
**par fichier** ; et un **plafond de poids de module** (1 024 ko, +5 % par lot sans regraver)
remplace enfin l'entrée « à surveiller » du backlog — *une veille qui a écrit trois fois « à
surveiller » pendant que `cave.js` doublait n'est pas une veille.*
**Contre-épreuve : 4/4 injectés, 5 assertions rougissent.**

### 127f. Le résultat, en une ligne

Sous 12 px, **1 223 sites sur 1 872 obéissent maintenant à `:root`** — contre 386 avant. Le
trop-petit n'a pas diminué d'un pixel : **il est devenu pilotable depuis un seul endroit.**

### 127g. La note de livraison

**Base : `eea1df4`** (`.mv-base` posé, cf. §126). `npm run check` joué en entier, ESLint installé
dans le bac à sable. **SW 7.80 → 7.81** parce que des fichiers servis changent ; **APP inchangé**
parce qu'aucun pixel ne bouge — donc **pas d'entrée au journal des nouveautés** : il n'y a rien à
annoncer à un utilisateur.

**Ouvert, et dit** : ① **aucun rendu navigateur** — la conversion est prouvée sans arrondi, mais
1 246 substitutions dans onze fichiers se regardent au moins sur trois écrans, dont un document
imprimé (c'est là que le repli se vérifie pour de vrai). ② Les **1 966 tailles restantes** sont le
lot suivant, et il est de goût. ③ Le **harnais de contraste** (`mv-harnais-contraste.mjs`) n'existe
toujours pas : aucun contrôle du projet ne lit une couleur. ④ Le reste de P1 — 223 `catch{}` vides
dont 155 dans `app.js`, 159 slots JS nus et 330 interpolations nues, 58 classes mortes dans le CSS
de la Cave, 3 937 hex en dur — est intact.

## 128. ★★★ NS-1 + BAS-1 + PLUS-1 — UN PRÉFIXE, UNE FAMILLE (14/09 — `utils.js` + `cave.js` + `index.html` + `styles.css` + 4 modules + `sw.js` + `guide/` + `scripts/` + `package.json` · APP 7.19 → 7.20 · SW 7.81 → 7.82 · base `56cd2c8`)

**Point de départ** : *« revois toutes les polices, tous les affichages en z-index pour être sûr que
tout s'affiche — j'ai retrouvé des problèmes mais je ne sais plus où. »*

### 128a. ★★★ LE HARNAIS RÉPONDAIT 9500, ET IL Y AVAIT DEUX RÉPONSES

`mv-harnais-couches` était vert. Sa ligne clé :

```js
const porte = TOUTES.filter(c => c.sel === '.mvt-ov').map(c => c.z).sort((a,b)=>b-a)[0];
```

**Prendre le maximum, c'est choisir au hasard entre deux vérités contradictoires.** `.mvt-ov` valait
**9500** dans `styles.css` (la porte CGU) et **9200** dans la CSS injectée par `utils.js` (la feuille
de tri, §119–121). Le harnais lisait la plus haute et concluait que l'ordre tenait.

Un détecteur écrit pour l'occasion — 29 feuilles lues (`styles.css`, les `<style>` d'`index.html`, les
28 CSS injectées), blocs `@media` retirés — a rendu **6 collisions, toutes dans `.mvt-*`, zéro
ailleurs** :

| classe | porte CGU (`styles.css`) | feuille de tri (`utils.js`) | tournée (`cave.js`) |
|---|---|---|---|
| `.mvt-ov` | z 9500 · `display:none` · centré | z **9200** · `display:flex` · bas · `opacity:0` | — |
| `.mvt-hd` | fond **cave sombre** + `::after` filet or + padding | flex / align / gap | sticky z 40 |
| `.mvt-t` | — | Cormorant 600, **sans couleur** | Cormorant 700, `#F5EBD6` |
| `.mvt-sub` | uppercase · nowrap · ellipsis | taille + couleur | — |
| `.mvt-row`, `.mvt-fld` | ✓ | ✓ | ✓ |

**Ce que ça donnait à l'écran**, la CSS injectée gagnant sur la feuille liée :
① le `.mvt-hd` de la porte posait son dégradé noir sous le titre de la feuille de tri, dont le
`.mvt-t` n'a pas de couleur — **noir sur noir**, à chaque ouverture ;
② le `.mvt-sub` de la porte imposait `uppercase` + `nowrap` + `ellipsis` à la ligne d'explication ;
③ le `padding:22px` de la porte décollait la feuille du bas de l'écran, qu'elle est dessinée pour
toucher ;
④ **et dans l'autre sens** : le `display:flex; align-items:center; gap:13px` de la porte s'appliquait
à l'en-tête de la **tournée du Cuvier**, dont les trois enfants (date, jauge, filtres) doivent
s'empiler. Ils passaient **côte à côte**. Celui-là est inconditionnel : `styles.css` est toujours
chargée.

⚠️ **Et un effet latent, plus grave** : `_mvTermsCheck` ouvre la porte par `ov.style.display='flex'`,
ce qui ne recouvre **ni** `opacity:0` **ni** `pointer-events:none`. Dès qu'une feuille de tri avait
été ouverte dans la session, un consentement *fail-closed* se serait rendu **transparent et
traversable**, à 9200 au lieu de 9500 — sous le plafond modal de §85. Le gating tourne au boot,
avant toute feuille : ça n'a pas mordu. Ça n'a pas mordu **encore**.

### 128b. ★★★ LE RENOMMAGE A DÉCOUVERT UN DÉFAUT QUE PERSONNE NE CHERCHAIT

Trois familles, trois préfixes : porte CGU **`.mvt-*`** (elle garde le sien : `styles.css` +
`index.html`), feuille de tri **`.mvz-*`** (40 occurrences, `utils.js` seul), tournée du Cuvier
**`.vt-*`** (193 occurrences + `class="mvt"`, `.mvt{}` et l'animation `mvtBump`, `cave.js` seul —
le préfixe suit le nom des fonctions, `_vtCss`, `_VT_BUF`). La visite guidée (`app.js`) garde
`.mvt-*` : elle ne partage aucune classe avec les autres, et le filet le vérifie désormais.

★★★ **La minute d'après, le harnais est passé au rouge** : `.mvz-ov` = **9200**, soit exactement
`MV_Z_MODAL_PLANCHER`. La feuille de tri était **au niveau des dialogues qu'elle ouvre elle-même**
depuis TRI-1, et le contrôle ne la voyait pas parce qu'elle s'appelait `.mvt-ov` — un nom que le
harnais excluait explicitement, la porte CGU étant légitimement au-dessus du plafond.
Descendue à **9000**, avec `.mvv-ov`.

> ★★★ **UN DÉFAUT PEUT SE CACHER DERRIÈRE LE NOM D'UN AUTRE.** Ce n'est pas le z-index qui était
> illisible, c'est l'homonymie qui rendait le z-index illisible. Renommer n'était pas du rangement :
> c'est le geste qui a rendu la mesure possible.

### 128c. ★★ BAS-1 — la barre de la tournée passait sous le socle

`.vt-bot` : `position:fixed; bottom:0; z-index:50`. `#mv-dock` : `position:fixed; bottom:0;
z-index:90`. Chaînes d'ancêtres reconstruites depuis `index.html` : les deux sont enfants directs de
`#app-root`, **aucun ancêtre ne crée de contexte d'empilement**. Le socle est en `display:flex` pour
tout utilisateur connecté non-GT. **« Terminer la tournée » et l'intervention groupée étaient
recouverts.**

★ **La preuve de l'intention était dans le code** : `.vt{padding:0 0 140px}` — or la barre fait 83 px
et le socle 64. On ne réserve 140 px que si l'on croit les empiler. La convention du projet le dit
aussi : `.pl2-mbar` est à `bottom:calc(64px + safe-area)`, `.pl2-abar` à 76 px. `.vt-bot` passe à
`bottom:calc(64px + env(safe-area-inset-bottom,0px))`, `z-index:93` (au-dessus du socle, **sous** la
feuille du socle à 95), le `safe-area` quitte son `padding` — il est déjà dans le décalage — et la
garde monte à **150 px** (64 + 22 + 50 + 11 = 147).

### 128d. ★★ PLUS-1 — un signe qu'aucune des deux polices ne sait dessiner

**66 occurrences de `＋` U+FF0B**, le plus **pleine chasse**, sur les boutons d'ajout. Le subset latin
de `fonts.css` s'arrête à U+00FF plus quelques plages nommées : ni Cormorant ni Outfit ne le
contiennent. Il était donc dessiné par une **police système** — chasse pleine, ligne de base
étrangère, et **carré vide** sur un poste sans police CJK. Remplacé par **U+002B**, qui est dans le
subset et qui est la paire typographique du **U+2212** que les mêmes boutons utilisent déjà.

⚠️ **Le harnais des icônes ne pouvait pas le voir, et ce n'est pas un trou.** Il répond à « est-ce un
pictogramme ? ». U+FF0B n'en est pas un — il était même **nommé dans sa liste `TYPO`**, « ce qui
n'est pas une icône et reste ». C'était vrai. Ce qui était faux, c'est qu'un signe typographique se
compose avec la police du projet. ★ *Deux questions différentes demandent deux filets différents ;
élargir le premier l'aurait rendu faux sur son propre sujet.*

### 128e. Les deux filets

**`mv-harnais-couches.mjs`** — ★★★ *aucune classe n'est déclarée dans deux feuilles* (+ la porte CGU
n'est déclarée qu'une fois). ⚠️⚠️ **Deux faux départs, et les deux ont menti comme les quatre
extracteurs de §85b.** ① Lire un module ENTIER ramasse le CSS des **documents imprimés**, qui vit
dans une autre fenêtre : six faux rouges (`.sbox`, `.section`, `.foot`, `.muted`, `.cover`,
`.mc-val`) — deux documents peuvent appeler `.foot` chacun de son côté, ils ne partagent aucune
cascade. On ne lit donc, pour un module, que le CSS d'un `<style>` **posé dans le `document`** :
fenêtre `createElement('style')` → `appendChild`. ② Le découpage en littéraux a pris l'apostrophe de
« qu'elle » — dans un commentaire que je venais d'écrire — pour une ouverture de chaîne : la fenêtre
entière disparaissait. Les commentaires sont blanchis **avant** découpage. ★ **L'auto-contrôle a
attrapé les deux** : le harnais doit retrouver **nommément** `.mvt-ov` dans `styles.css`, `.mvz-ov`
dans `utils.js` et `.vt-hd` dans `cave.js`. Contre-épreuve : plancher à 600 → 4 rouges sur 14.

**`scripts/mv-harnais-subset.mjs`** (neuf) — plages `unicode-range` et graisses `@font-face` **lues
dans `fonts.css`**, jamais écrites en dur, avec trois auto-contrôles (11 fontes, graisse max 700,
209 plages ; le subset couvre é à ç ù œ « » € ’ — … ; **il ne couvre PAS U+FF0B**, sinon le harnais
ne prouverait rien). Une **interdiction nommée** (zéro U+FF0B) et deux **cliquets par fichier** :
**274** caractères hors subset (₂ ≈ ᵉ ʳ ⊘ ⋯ ≥ ≤ Σ ⠿ ① ② ③, plus des plages de regex et des
sentinelles qui ne sont pas rendues) et **72 fausses graisses** au-dessus de 700.
★ *Les déclarer « tolérés » un par un aurait menti sur ce qu'on a mesuré ; un compte qui ne peut que
descendre dit la vérité et rend la dette visible.* Contre-épreuve : 4 rouges sur 8.

### 128f. La note de livraison

**Base : `56cd2c8`.** `npm run check` joué en entier.

| fichier | ce qui change | bump |
|---|---|---|
| `src/utils.js` | feuille de tri `.mvt-*` → `.mvz-*` (40), z 9200 → 9000, `＋`, APP 7.20, `WHATS_NEW` 3 items | ★ APP |
| `src/cave.js` | tournée `.mvt-*` → `.vt-*` (193 + `mvt`/`mvtBump`), `.vt-bot` au-dessus du socle, garde 150 px, `＋` | — |
| `index.html` · `src/styles.css` | `＋`, 4 porteurs de version | ★ APP |
| `pilotage` · `reglages` · `reserve` · `tracteur` | `＋` | — |
| `guide/` (4) · `public/demarrage.html` · `public/guide.html` | `＋` | — |
| `public/sw.js` | 7.82, changelog | ★ SW |
| `scripts/mv-harnais-couches.mjs` · `mv-harnais-icones.mjs` · `mv-harnais-subset.mjs` (neuf) · `subset-baseline.json` · `package.json` | 2 filets, U+FF0B retiré de `TYPO`, câblage `check` + `prebuild` | — |

**Ouvert, et dit** : ① **aucun rendu navigateur** — la feuille de tri, l'en-tête de la tournée et sa
barre basse se regardent sur un téléphone, c'est là que se voit le décalage de 64 px. ② Le `＋` de
deux commandes **icône seule** (`#trac-fab`, la pastille `.tcv-act` de Réglages) gagnerait le sprite
`ic-plus` plutôt qu'un `+` : c'est un lot de **goût**, il ne se mélange pas à une substitution
mécanique (§127c). ③ Le **catalogue propre au domaine** n'a plus d'écran : `renderCatalogueTrac()`
vise `#catalogue-list-trac`, absent d'`index.html` depuis la bascule E-Phy, et sort en `if(!el)return`
à chaque `renderPhyto()` — la donnée est chargée, synchronisée, sauvegardée, restaurée, et jamais
affichée. **À trancher** : suppression assumée, ou régression. ④ Les 274 hors subset et les 72
fausses graisses sont désormais mesurés ; le lot qui les traite est un lot de goût, comme les 1 966
tailles de §127c. ⑤ **`harnais-demo.mjs` garde une assertion devenue partiellement caduque** : elle
vérifie que la visite ne réclame plus l'identifiant `mvt-css` — or `cave.js` ne le porte plus non
plus (il est devenu `vt-css`). L'assertion reste verte et garde encore quelque chose (une visite qui
reprend un identifiant générique est un signe), mais **son commentaire décrit un monde qui n'existe
plus**. Non touchée dans ce lot : on ne réécrit pas un couple assertion / contre-épreuve vert pour
une raison cosmétique. À reformuler au prochain passage sur la démo.

### 128g. ★★ CE QUE LE PREFLIGHT A ATTRAPÉ, ET QUE LE RENOMMAGE AVAIT CASSÉ

Suite verte, sauf **deux erreurs de preflight** : la **visite guidée** (`app.js`, §125) pointe
`#mvt-list` et `.mvt-cnt` — deux sélecteurs qui vivent **dans la tournée du Cuvier**, pas dans la
visite. Le renommage les avait laissés en arrière, et le projecteur se serait posé au hasard, sans
une erreur. Recâblés sur `#vt-list` / `.vt-cnt`.

> ★★★ **UN SÉLECTEUR QUI TRAVERSE UN MODULE SE CASSE AU RENOMMAGE DE L'AUTRE, EN SILENCE.** C'est le
> pendant exact de la collision qu'on venait de fermer : le préfixe partagé faisait se marcher dessus
> deux familles qui s'ignoraient ; le sélecteur traversant fait dépendre une famille d'une autre sans
> que rien ne le déclare. Le contrôle qui l'a vu (« ce sélecteur ne vise rien dans les sources »)
> existait déjà — il a suffi qu'il tourne.

## 129. ★★★ CUV-11 — LA DENSITÉ SE RELÈVE ENCORE UNE FOIS LA CUVE DÉCUVÉE, ET LA TOURNÉE NE SE FERME PLUS QUAND LE CUVIER SE VIDE (14/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `scripts/` · APP 7.20 → 7.21 · SW 7.82 → 7.83 · base `f6ed8e7`)

**Le point de départ, dit par Nico** : *« il faut pouvoir mesurer encore la densité une fois les
cuves décuvées. »* Une phrase, **trois portes fermées** — et la dernière tenait les deux autres.

### 129a. ★★★ POUVOIR RELEVER N'EST PAS DEVOIR RELEVER

`_vendSuivie` dit qui l'application **RÉCLAME** : la tournée, l'agenda, le badge « à mesurer ». Il
n'a jamais eu à dire qui elle **ACCEPTE**. Les deux étaient confondus, et le cas courant était le
plus fermé : depuis §118 la feuille de décuvage coche « terminée en cuve » d'avance, donc
`_vendFaEnCours` est faux, donc plus **aucune** porte — ni bouton dans le détail, ni champ dans la
tournée. Une cuve décuvée **avant** §118 n'a pas de `fa_finie` du tout : même résultat.

```
_vendMesurable(c)  = !fusionnée && (_vendIsActive(c) || _vendDecuvee(c))
_vtMesurables()    = ce que l'écriture couvre
_vtBase()          = ce que la progression compte  (= _vtVisibles ∩ mesurable)
```

⚠️⚠️ **CE PRÉDICAT N'ARME RIEN.** Il ouvre une porte, il ne pose aucune relance. Une cuve déclarée
finie au décuvage ne revient **pas** dans la tournée réclamée (`_vtActives` est inchangé), et un
relevé ne rouvre aucune fermentation : **le décuvage est un FAIT (§118), un chiffre ne le
contredit pas.** ⚠️ Une cuve **fusionnée** reste dehors : son vin est ailleurs, sous un autre nom.

### 129b. ★★★ LA PORTE QUI TENAIT LES DEUX AUTRES — ET ELLE ÉTAIT EN AMONT

Le premier temps du lot avait ouvert la ligne (`_vtRowHtml` sur `_vendMesurable` et non
`_vendIsActive` — CUV-9 avait fait entrer les cuves décuvées dans la tournée pendant que leur ligne
se rendait **sans aucun champ**, le tag « décuvée » s'affichant au-dessus de rien), l'écriture
(`_vtEcrire` sur `_vtMesurables`) et le bouton du détail. **Trois fonctions vertes derrière une
porte fermée** : `renderVendTour` décidait l'écran vide sur `_vtActives()` **avant de regarder le
filtre**. Dès la dernière cuve décuvée : pas de liste → pas de chip « Toutes » → aucune porte.

★★★ **Et ce n'est pas un cas limite : c'est l'état NORMAL du cuvier après la vendange.** Toutes les
cuves finissent décuvées. Le défaut s'installait chaque année, exactement au moment où le relevé
compte le plus — plus de marc, plus de chapeau, **rien dans le cuvier ne rappelle qu'il faut aller
voir**.

| | Avant | Après |
|---|---|---|
| écran vide | `!_vtActives().length` | `!_vtMesurables().length` |
| vue d'ouverture | toujours « En cours » | « Toutes » si rien ne fermente et qu'il reste à relever (`_vtFiltDef`, décidé **au chargement** — à chaque rendu, un clic sur « En cours » serait annulé aussitôt) |
| filtre vide | un blanc | la phrase qui dit où sont les cuves, et le bouton qui y va |
| progression et bilan | `_vtActives()` | `_vtBase()` |

⚠️ **Arbitrage assumé** : sous « Toutes », la barre et le bilan comptent aussi les décuvées. Sous
« En cours » et « Reste à faire » c'est **exactement** `_vtActives()`, donc aucune régression. La
règle tient en une ligne : **la tournée compte ce qu'elle montre.** Sur `_vtActives`, une tournée
faite entièrement sur des décuvées annonçait *« 0 relevé »* après trois densités écrites.

### 129c. Ce que ça change ailleurs

- **Au Chai** : `_caveFaLineHtml` affiche le **dernier relevé de la cuve source** (`_caveCuveSource`
  par `decuvage.cuvee_id`). Aucune densité propre à la cuvée, rien de recopié, rien qui puisse
  diverger (§116). C'est là qu'on décide de la suite : **ni malo ni sulfitage sur du sucre** — voir
  la correction du 14/09/2026 en §116, la formulation « on ne sulfite pas sur du sucre » seule était
  fausse.
- **La légende de la courbe** : tant qu'elle s'arrêtait au décuvage, une chaptalisation était la
  **seule** remontée possible, et l'écran l'écrivait. Un relevé postérieur porte sur la **masse
  assemblée, goutte et presse** : le pressurage relargue du sucre, la courbe remonte sans qu'on ait
  ajouté un gramme. Le taire ferait chercher une chaptalisation qui n'existe pas.
- **Le tag « décuvée »** de la tournée passe de `_vendFaEnCours` à `_vendDecuvee` : il décrit un
  fait, pas une réponse cochée.
- **La section Décuvées** montre le dernier point relevé après le décuvage — sinon il faut déplier
  chaque cuve pour savoir laquelle a été suivie.

### 129d. ⚠️⚠️ LE HARNAIS NE VOYAIT PAS L'IMPASSE, ET UNE CONTRE-ÉPREUVE S'EST ÉTEINTE EN SILENCE

`mv-harnais-cuv7` n'éprouvait que des **prédicats**. Trois d'entre eux étaient justes chacun de son
côté pendant que l'écran était mort au milieu. ★ **Un harnais qui s'arrête aux prédicats ne voit
pas une porte fermée : il faut RENDRE l'écran.** `renderVendTour`, `_vtLoad`, `_vtBandeauHtml`,
`_vtMaj`, `_vtVisibles`, `_vtBase` et `_vtFiltDef` sont désormais extraits, sur un décor DOM
minimal (un nœud pour tout `getElementById`) — il ne prétend pas être un navigateur.

⚠️⚠️ **ET C'EST EN FAISANT ÇA QU'UNE CONTRE-ÉPREUVE EST MORTE.** Le sabotage « empilement au lieu de
mise à jour » visait `var m=_vtMesJour(c);`, **présent dans deux fonctions** dès que `_vtLoad` entre
dans le bloc extrait. `String.replace` ne remplace que la **première occurrence** : la
contre-épreuve saccageait `_vtLoad` et laissait `_vtEcrire` intact — **verte sans rien prouver**.
★★★ **Règle : une ancre de contre-épreuve doit être unique DANS LE BLOC EXTRAIT, pas dans la
fonction qu'on croit viser.** Élargir un harnais peut en éteindre une partie, sans une ligne rouge.

**Compte** : `mv-harnais-cuv7` **44 assertions vertes**, 5 contre-épreuves qui mordent (dont deux
neuves : la ligne qui reprend `_vendIsActive`, l'écriture qui reste sur `_vtActives` pendant que
l'affichage s'élargit). `mv-harnais-cuv8` **50 vertes · 13 contre-épreuves**, avec le bloc 7d
(les trois décuvées — finie, à finir, muette — sont toutes mesurables ; un relevé à 1020 pris après
le décuvage ne rouvre pas la fermentation).

### 129e. ⚠️⚠️⚠️ CE LOT A ÉTÉ REBASÉ DEUX FOIS EN UNE JOURNÉE, ET C'EST LA LEÇON DE §126 QUI A SERVI

Construit sur `eea1df4`, il a vu passer **TYPO-1 (§127)** puis **NS-1 + BAS-1 + PLUS-1 (§128)** sur
**les mêmes fichiers** avant d'être livré. Les deux fois : `git diff` mis de côté, base récupérée,
patch réappliqué en **fusion trois voies**, chaîne rejouée.

★ **La seconde fois a fait quatre conflits, et ils étaient tous du même genre** : §128 renomme le
préfixe `.mvt-*` en `.vt-*`. Résolus en gardant **ma logique et son préfixe** — puis vérifié classe
par classe que chacune existe encore dans le CSS (`vt-vide`, `vt-tag`, `mvv-act2`, `mvc-fa-line`…).
⚠️ **Un piège s'est glissé là** : la classe racine `mvt` n'a **pas** de tiret, donc un
remplacement `mvt-` → `vt-` la laisse intacte. Elle est sortie au grep, pas au harnais — aucun
contrôle du projet ne lit une classe CSS émise depuis JS.
⚠️⚠️ **Et le harnais cherchait `/mvt-d-/`** : sur la nouvelle base il aurait été **vert en ne
trouvant jamais le champ**, puisqu'il teste une absence par la négative dans un cas et une présence
dans l'autre. Réancré sur `vt-d-`.

★★★ **La règle de §82a tient toujours, et elle vaut dans les deux sens** : des fichiers complets
préparés sur une base et collés sur une autre écrasent ce qui est passé entre les deux. **Une
livraison qui attend une heure doit être rebasée, pas collée.**

### 129f. La note de livraison

**Base `f6ed8e7`.** **APP 7.20 → 7.21** (deux entrées au journal : c'est visible) · **SW 7.82 →
7.83**. `npm run check` joué en entier sur la base finale.

**Ouvert, et dit** : ① **aucun rendu navigateur** — le décor DOM du harnais prouve la logique de
l'écran, pas son apparence ; la vue « Toutes » sur douze cuves se regarde sur téléphone, d'autant
que §128 vient de reprendre l'en-tête et le bas de cet écran-là. ② `npm run build`, `test:smoke`,
`test:e2e` restent côté Nico. ③ **`_mlProjFA` n'est toujours pas repris** (§117-4) : une projection
linéaire sur une cinétique qui ralentit annonce une fin trop proche, systématiquement — et elle
porte maintenant aussi sur des cuves décuvées. ④ La **zone de 996** attend toujours les résultats du
labo pour être calée sur ce domaine (§117).
