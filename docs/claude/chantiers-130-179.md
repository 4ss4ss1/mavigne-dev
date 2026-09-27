# Ma Vigne — Chantiers §130 à §179

> Scindé de `CLAUDE.md` le 27/09/2026 (§189). Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence
> « §N » se trouve par `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été
> remonté dans `CLAUDE.md` (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches
> de 50). Au-delà de la dernière tranche, créer le fichier suivant sur le même modèle.

---

## 130. ★★★ CONTRASTE-1 — SOIXANTE-DIX SCRIPTS DE CONTRÔLE, ET AUCUN NE LISAIT UNE COULEUR (14/09 — `scripts/` + `package.json` · APP **inchangé** · SW **inchangé** · base `1ca0bb8`)

**Point de départ** : *« contraste »* — l'entrée P1 qui disait qu'un texte illisible en thème
sombre passerait tous les filets du projet. Elle disait vrai.

### 130a. Ce que le projet savait déjà, et n'appliquait qu'à la vitrine

La mécanique WCAG existait : `harnais-vitrine.mjs` §10c calcule des ratios depuis 2025. **Sur sept
paires écrites à la main.** ★ *Une liste à la main ne couvre que ce qu'on a pensé à y mettre le
jour où on l'a écrite* — c'est le défaut de §124 (l'export qui gardait 8 clés sur 26), transposé
aux couleurs. Ici les paires sont **dérivées** : de la palette pour les familles, du code pour le
reste.

### 130b. Trois sources de paires, aucune liste

1. **Les paires que la palette DÉCLARE par ses noms** : `--tag-X-bg`/`--tag-X-tx` (le projet dit
   lui-même quel texte va sur quel fond) et `--X`/`--X-pale` (la famille des badges). Elles sortent
   des **noms de jetons** : un `--tag-teal-*` ajouté demain est mesuré le jour même.
2. **Les paires que le CODE écrit** : toute déclaration qui pose `color:` *et* `background:` au
   même endroit — règle CSS ou attribut `style=`. 792 mesurables.
3. **Les deux thèmes.** Le sombre redéfinit 40 jetons, et c'est là que sont les trois quarts des
   écarts.

### 130c. ⚠️⚠️⚠️ DEUX ERREURS DE MESURE CORRIGÉES AVANT DE CROIRE LE CHIFFRE

Le premier jet sortait **427 écarts en clair**. Faux, deux fois :

- **Un fond translucide anonyme n'est pas mesurable.** `rgba(255,255,255,.05)` ne dit pas sur quoi
  il repose. En supposant la carte, la console GT — qui a son propre fond sombre — remontait
  massivement dans les pires écarts. On ne compose désormais que les jetons **nommés**
  `--*-pale` / `--*-bg`, dont la palette dit où ils vivent ; le reste est compté « fond inconnu »,
  et **ce compte est affiché**. ★ *Un harnais qui tait sa couverture ment sur ce qu'il prouve* —
  436 paires au fond inconnu et 247 non résolubles sont annoncées à chaque passage.
- **Une règle portée par un thème ne se mesure que dans ce thème.** Sans ça,
  `[data-theme="dark"] .x{color:#F0EFE9;background:#1C1A16}` ressortait à 1,07 « en clair », sur
  une règle que le thème clair n'applique jamais.

Après correction : **91 écarts en clair, 281 en sombre.** Le sombre est trois fois pire, et ce
n'est pas une dispersion de fautes — c'est **une famille**.

### 130d. La famille : les badges du thème sombre

En sombre, **7 des 12 paires `--X` / `--X-pale` sont sous 4,5** : `phyto` 2,92 · `terre` 3,13 ·
`acier` 3,28 · `bleu` 3,28 · `rouge` 3,52 · `vert` 3,84 · `orange` 3,91. Toutes entre 2,9 et 3,9 —
la signature d'une cause unique, pas de sept étourderies : la couleur d'accent est posée en texte
sur son propre fond à 22 % d'opacité au-dessus d'une carte quasi noire.
★ **Le remède est déjà dans la palette** : les variantes `-med` et `-clair` passent
(`vert-med` 5,14 · `acier-med` 4,81 · `vert-clair` 6,37). Le lot suivant est donc un arbitrage de
jetons, pas une reprise de 281 sites.
En clair, 5 familles seulement : `or/pale` 2,23 · `plan-acc/pale` 3,70 · `orange/pale` 4,14 ·
`tag-orange` 4,14 · `tag-sky` 4,27.

### 130e. ★★★ LA CLASSE DE DÉFAUT QUE LE HARNAIS A TROUVÉE LE JOUR OÙ IL A ÉTÉ ÉCRIT

**Un jeton de SURFACE employé comme couleur de TEXTE. 43 fois, dans six modules.**
`--cave` est le fond du chai. En clair il vaut `#14110D` — une encre presque noire — donc
`color:var(--cave)` sur une carte crème donne **18:1**, et personne n'a jamais rien vu. En sombre
le **même jeton** vaut `#100D0A` et la carte `#1C1A16` : **1,12**. Des titres sérif de 20 px, gras,
**invisibles** — dans la Cave, le Pilotage, les Réglages, la Réserve.

⚠️⚠️ **ET LE REMÈDE N'EST PAS UN REMPLACEMENT EN MASSE.** J'ai failli livrer les 43 substitutions
`--cave` → `--texte` : ratio inchangé en clair (18,02 → 17,3), corrigé en sombre (1,12 → 15,08),
et sans danger à l'impression puisque `_mvDocCss` n'écrit **aucun `:root`** — les jetons y tombent
sur leur repli. Le contexte a dit non : **une bonne moitié de ces 43 sont posés sur un fond FIXE**
(`#fff`, `#FDF7EE`, `rgba(240,226,200,.94)`, un badge `--or` qui reste clair en sombre). Là, l'encre
sombre est **juste**, et `--texte` la rendrait blanche sur crème.
★ *Le même symptôme a deux causes opposées selon que le fond suit le thème ou non.* D'où un
cliquet et une liste de travail exacte, pas une correction automatique — c'est la règle de TYPO-1
(§127c) tenue une seconde fois : **un lot mécanique et un lot de goût ne se mélangent pas.**

### 130f. `scripts/mv-harnais-contraste.mjs` — 8 assertions, 4 injections

Cliquets : les familles de jetons (par thème, avec leur ratio mesuré au cran près — une famille qui
repasse au-dessus est annoncée comme un **gain** à regraver), les écarts du code **par fichier et
par thème**, les surfaces employées comme encre, et **la couverture** — car un harnais qui mesure
moins tout en restant vert est la panne la plus silencieuse qu'un contrôle puisse avoir.

⚠️ **Les injections ne s'ancrent plus toutes sur un littéral.** Deux des quatre **ajoutent** du
code. §127e avait montré qu'une injection ancrée meurt au premier lot qui touche son ancre — et
qu'elle meurt en annonçant « RESTE VERT », c'est-à-dire **en accusant le harnais**. Une injection
qui ajoute ne peut pas se périmer. La garde d'injection a d'ailleurs mordu à l'écriture : **1/3
appliqués** au premier essai, deux ancres écrites de mémoire et fausses. *Le contrôle du contrôle
a fonctionné avant le contrôle.*
**Contre-épreuve : 4/4 injectés, 4 assertions rouges — une par classe de défaut.**

### 130g. La note de livraison

**Base : `1ca0bb8`.** Deux fichiers neufs (`mv-harnais-contraste.mjs`, `contraste-baseline.json`),
`package.json`, `CLAUDE.md`, `harnais-claude-md.mjs`, `.mv-base`. **Aucun code applicatif touché :
APP et SW inchangés**, rien à annoncer au journal des nouveautés — ce lot ne change pas un pixel,
il rend les pixels mesurables.

**Ouvert, et dit** : ① les **372 écarts** (91 clair + 281 sombre) contiennent du bruit qu'aucune
lecture statique ne peut lever — `.sdp-check{background:white … color:white}` décrit **deux états**
du même élément, pas une faute. Le cliquet est le produit ; la liste est une **liste de travail à
trier**, pas un verdict. ② Les 436 paires au fond inconnu resteront hors mesure tant qu'on n'aura
pas de rendu réel. ③ Le lot de correction se découpe en deux : **les jetons du thème sombre**
(mécanique, une poignée de valeurs) et **les 43 surfaces-en-encre** (site par site, avec l'œil).
④ Rien de tout cela n'a été regardé dans un navigateur — un harnais qui mesure des couleurs ne
remplace pas un écran allumé en thème sombre.

## 131. ★★★ CONTRASTE-2 — UN JETON, DEUX MÉTIERS : QUATRE FAMILLES DE PASTILLES ILLISIBLES EN SOMBRE (14/09 — `styles.css` + 7 modules + `index.html` + `utils.js` + `sw.js` + `scripts/` · APP 7.22 → 7.23 · SW 7.84 → 7.85 · base `1ca0bb8`, à la suite de §130)

### 131a. ⚠️⚠️⚠️ TROIS ERREURS DE MESURE DANS MON PROPRE HARNAIS, TROUVÉES EN M'EN SERVANT

§130 était livré vert. En m'en servant pour préparer la correction, il s'est révélé faux **trois
fois** — et deux de ces erreurs le rendaient aveugle sans jamais le faire rougir :

1. **Il ne lisait que le PREMIER bloc `:root`.** La palette n'est pas déclarée d'un seul tenant :
   des lots successifs ont ajouté des `:root{}` plus bas dans la feuille, et c'est là que vivent
   `--or-tx`, `--vert-tx`, `--orange-tx`, `--acier-tx`. Ces jetons étaient donc **inconnus**, et
   toute règle qui les emploie tombait dans « non résoluble » — hors mesure, en silence.
2. **Les commentaires.** La feuille EXPLIQUE la cascade des thèmes en prose, et ces explications
   citent `:root`. Un `:root` en commentaire faisait ouvrir le bloc `{` **suivant** — celui du
   thème sombre — et la palette CLAIRE absorbait les valeurs SOMBRES. C'est l'assertion
   « la palette se lit » (elle exige `--texte` différent entre les deux thèmes) qui a rougi. ★ *Elle
   avait été écrite comme une formalité de démarrage ; c'est elle qui a attrapé la panne.*
3. **La fenêtre d'exclusion.** En regardant 90 caractères après le sélecteur, un bloc clair d'une
   seule ligne suivi du bloc sombre à la ligne d'en dessous était pris pour du sombre et exclu.

★★★ **UN HARNAIS QUI NE VOIT PAS UN JETON NE SIGNALE PAS SON ABSENCE : il signale une couverture
plus faible.** Et on ne regarde une couverture que si elle est affichée. C'est pour ça qu'elle
l'est — la ligne « 246 non résolubles » n'est pas décorative, c'est la seule trace qu'un défaut de
lecture laisse derrière lui.

⚠️ **Et une fausse alerte, dite ici pour qu'elle ne resserve pas.** Mon premier contrôle « à la
main » annonçait *7 jetons présents dans la bascule manuelle et absents du mode OS* — dont
`--or-tx`. Faux : ce contrôle-là aussi oubliait les commentaires et ne lisait que le premier bloc
`@media`. Les deux portes sont **synchronisées, 68 = 68**. L'invariant est désormais une assertion
permanente, écrite pour le jour où il cessera d'être vrai.

### 131b. Le défaut, et pourquoi il n'a pas de correction simple

Un badge, c'est `color:var(--X)` sur `background:var(--X-pale)`. En clair, l'accent est sombre et
la pastille pâle : 4,9 à 8,1, rien à redire. En sombre, **le même jeton** sert d'encre sur une
pastille à 22 % d'opacité au-dessus d'une carte quasi noire : `phyto` 2,92 · `terre` 3,13 ·
`bleu` 3,28 · `rouge` 3,52 · `vert` 3,84 · `orange` 3,91 · `acier` 3,28.

**J'ai chiffré les deux remèdes évidents avant d'en écrire un :**

- **Baisser l'alpha de la pastille** : mort. Pour `terre`, `acier`, `bleu`, `phyto`, le seuil de
  4,5 n'est **jamais** atteint, même à alpha 0 — le fond n'est pas le problème.
- **Éclaircir l'accent** : marche pour le badge, **et casse le bouton**. Le même jeton sert de
  **fond plein sous du texte blanc**, et `#fff` sur `--vert` vaut déjà 3,29 ; l'éclaircir
  l'enfonce.

★★★ **UN JETON, DEUX MÉTIERS : IL EN FAUT DEUX.** C'est exactement la forme que
`--tag-X-bg`/`--tag-X-tx` avait déjà, et que `--or-tx`, `--vert-tx`, `--orange-tx`, `--acier-tx`
avaient commencée lot après lot. Ce lot ne l'invente pas : **il la finit.**

### 131c. Ce qui est fait, et ce qui est laissé exprès

Quatre jetons neufs — `--terre-tx`, `--bleu-tx`, `--phyto-tx`, `--rouge-tx` — posés dans les
**trois** portes (clair, bascule manuelle, mode OS). ★ **Leur valeur claire est l'accent actuel, au
héxa près** : `#8A5A38`, `#1A4A7A`, `#5B2D8E`, `#A0291E`. Ce lot **ne déplace pas un pixel en thème
clair**, il ne répare que le sombre. Puis 62 déclarations converties — uniquement celles qui
posaient déjà `color:var(--X)` **et** `background:var(--X-pale)` dans la même déclaration, donc un
périmètre qui se prouve au lieu de se juger.

⚠️ **`vert`, `acier`, `orange`, `or` et `plan-acc` sont laissés en l'état.** Leur `-tx` existe, mais
sa valeur CLAIRE diffère de l'accent (`--vert` `#1E3A12` contre `--vert-tx` `#31601C`, `--or`
`#C2A14D` contre `--or-tx` `#7A5E12`) : les convertir change l'apparence en clair, sur une centaine
de sites, et cela **se regarde**. Même règle qu'en §127c : *un lot mécanique et un lot de goût ne se
mélangent pas.*

**Résultat mesuré** : familles sous 4,5 en sombre **7 → 0**, écarts du code en sombre
**277 → 215**, thème clair **inchangé à 91**.

### 131d. L'injection qui se réparait toute seule

La contre-épreuve est passée à 3 rouges pour 4 défauts. L'injection « thème sombre privé de sa
couleur de texte » remplaçait la **première** occurrence de `--texte:#F0EFE9` — mais le sombre est
déclaré **deux fois**, et la palette fusionne les deux : le second bloc **réparait** la valeur, le
défaut n'entrait pas, et l'épreuve accusait une assertion muette.
★ *Troisième lot d'affilée où le défaut n'est pas dans le harnais mais dans l'injection* (§123g,
§124h, §127e). La leçon se précise : **une injection doit être écrite contre le modèle réel du
code, pas contre l'idée qu'on s'en fait** — ici, « le thème sombre » n'est pas un bloc, c'en est
deux. Corrigée en remplacement global : **4/4, 4 rouges.**

### 131e. La note de livraison

**Base : `1ca0bb8`** — ce lot contient AUSSI §130 (CONTRASTE-1), qui n'avait pas encore été poussé.
`npm run check` joué en entier. APP 7.22 → **7.23**, SW 7.84 → **7.85**, une entrée au journal des
nouveautés (icône `contraste` — la première proposée, `palette`, n'existe pas dans le sprite, et le
harnais des icônes l'a dit avant moi).

**Ouvert, et dit** : ① **aucun rendu navigateur** — quatre familles de pastilles changent de teinte
en sombre, ça se regarde sur un écran, pas dans un tableau de ratios. ② Les **cinq familles
laissées** (`vert`, `acier`, `orange`, `or`, `plan-acc`) sont le lot suivant, et il est de goût.
③ **`#fff` sur un accent plein reste sous 4,5 partout** (`vert` 3,29 · `orange` 3,38 · `rouge` 3,78
· `acier` 4,06) : c'est une famille entière de boutons, jamais mesurée avant aujourd'hui, et
personne ne l'a encore arbitrée. ④ Les 43 surfaces employées comme encre sont intactes. ⑤ Les 215
écarts sombres restants contiennent toujours le bruit des états (`.sdp-check`), non levable sans
rendu.

## 132. ★★★ AVALE-1 — 206 ERREURS QUI DISPARAISSAIENT SANS TRACE ONT MAINTENANT UN NOM (14/09 — 12 modules + `sw.js` + `scripts/` + `package.json` · APP **inchangé** · SW 7.85 → 7.86 · base `1ca0bb8`, à la suite de §130-131)

### 132a. Un compteur qui ne descendait pas

`C14_empty_catch` : **223**, dont **152 dans `app.js`**. Le preflight écrit lui-même ce que ça
coûte, depuis des mois : *« c'est le motif qui a permis au bug `.window.currentUser` de survivre
des mois et aux refus de lecture d'être invisibles »*. Le cliquet descendait d'un cran de temps en
temps, quand un lot passait par là. ★ *Un cliquet empêche de remonter ; il ne fait pas descendre.
Pour descendre, il faut un lot.*

### 132b. ⚠️ CES `catch{}` NE SE VALENT PAS — ET C'EST POURQUOI ON NE LES TRIE PAS

`try{ localStorage.removeItem(…) }catch{}` est du meilleur effort légitime : navigation privée,
quota. Mais dans le même fichier : `try{ renderParcelles() }catch{}` avale un **échec de rendu**,
et `try{ _recalcSurfTotale() }catch{}` avale un **calcul de surface faux**.
Relire 223 emplacements pour décider lequel mérite quel niveau, c'est se tromper quelque part —
et se tromper en silence, puisque rien ne vérifierait le jugement. ★ **On les rend tous
TRAÇABLES, et le tri se fera sur des données** : `window._mvAvalees` dit, en console, où ça avale
et combien de fois. Le premier lot de tri aura des chiffres au lieu d'un avis.

### 132c. Le contexte est extrait, pas inventé

`_mvAvale(e, 'app.js/_recalcSurfTotale')`. La clé est le **nom de la fonction englobante**, lu dans
le code, plus un ordinal quand une fonction en contient plusieurs (`#2`, `#3`). Aucune phrase
rédigée à la main : 206 messages écrits à la main seraient 206 occasions de décrire de travers ce
qu'on n'a pas lu.

### 132d. ★★★ NIVEAU `info`, ET C'EST LE CŒUR DU LOT

`_ERR_SEND_LVL` n'envoie vers Firestore que `critical`, `error`, `warning`. En `info`, la trace
s'écrit **en local seulement**, là où l'écran Admin la lit déjà. Sans ça, ce lot aurait expédié
**206 points d'appel dans le journal du domaine de chaque client** — un bruit que personne n'aurait
trié et qui aurait discrédité le journal entier.
⚠️ **L'assertion tient les deux bouts** : le niveau dans `_mvAvale`, ET l'absence d'`info` dans
`_ERR_SEND_LVL`. Changer l'un des deux suffirait à ouvrir les vannes, et il n'y a aucune raison
qu'un futur lot devine le lien entre ces deux endroits.

⚠️⚠️ **Une trace par emplacement et par session.** `logError` relit et réécrit tout le journal
localStorage à chaque appel : appelé depuis une boucle de rendu, il coûterait plus cher que le
défaut qu'il signale. Le compteur, lui, continue de compter.

### 132e. ⚠️⚠️⚠️ LA PREMIÈRE PASSE A CASSÉ `app.js` — ET C'EST LA BONNE NOUVELLE

La conversion mécanique a produit ceci, dans le script qu'une fenêtre d'impression reçoit :

```
H.push('…<script>setTimeout(function(){try{window.print();}catch(e){ … window._mvAvale(e,'app.js/cuvNames'); }}…')
```

Une apostrophe de contexte posée **au milieu d'une chaîne à apostrophes**. `node --check` l'a dit
immédiatement — *avant* la livraison, ce qui est exactement ce à quoi sert le contrôle de syntaxe
sur les douze modules.
★★★ **UNE SUBSTITUTION DE MASSE DOIT SAVOIR CE QUI EST DU CODE ET CE QUI EST UNE CHAÎNE.** Le
convertisseur masque désormais chaînes, gabarits, interpolations `${}` et commentaires avant de
toucher quoi que ce soit. Résultat : **20 `catch{}` laissés exprès**, tous à l'intérieur de scripts
écrits dans des fenêtres d'impression — un autre document, un autre monde, et du meilleur effort
légitime (`window.print()` qui échoue).

**C14 : 223 → 15.** Les quinze restants sont ces vingt-là moins ceux qu'aucun règle ne comptait,
plus celui de `logError` lui-même — qu'on n'instrumente pas, sous peine de boucle.

### 132f. `scripts/mv-harnais-avale.mjs` — 12 assertions, dont 4 exécutées

Le helper est **extrait du vrai `utils.js` et lancé** : trois avalements donnent deux traces (le
doublon est tu) pendant que le compteur en voit trois ; la trace nomme l'emplacement et garde le
détail ; un avalement sans objet d'erreur ne casse rien.

★ **L'assertion qu'on ne voit pas venir** : *aucun contexte n'est partagé par deux emplacements*
(206 clés pour 206 appels). La clé sert **aussi** de clé de déduplication — deux sites homonymes et
le second ne serait **jamais** journalisé, sans que rien ne le dise. C'est précisément pour ça que
l'ordinal `#2` existe, et l'assertion est ce qui empêche qu'on l'oublie au prochain copier-coller.

**Contre-épreuve : 4/4 injectés, 6 assertions rouges.** Deux des quatre injections **ajoutent** du
code (§127e, §131d) : une injection ancrée sur un littéral meurt au premier lot qui touche ce
littéral, et elle meurt en accusant le harnais.

### 132g. La note de livraison

**Base : `1ca0bb8`** — ce lot contient AUSSI §130 et §131, toujours pas poussés. `npm run check`
joué en entier. **SW 7.85 → 7.86** (des fichiers servis changent), **APP inchangé** et **pas
d'entrée au journal** : en `info`, l'utilisateur ne voit strictement rien — ce lot ne s'adresse
qu'à celui qui dépanne.

### 132h. Un second cliquet sur la même grandeur, tenu à la main

`mv-harnais-echelle.mjs` affirmait que `pilotage.js` contient **exactement 15** `catch{}` vides —
un nombre écrit en dur, à côté du cliquet C14 du preflight qui mesure déjà la même chose. Il a
périmé le jour où la grandeur a bougé (15 → 10). ★ *Un second cliquet sur la même grandeur ne
double pas la protection : il double la maintenance, et c'est le double qu'on oublie.* Il lit
désormais `preflight-baseline.json` au lieu de recopier son chiffre.

**Ouvert, et dit** : ① la valeur du lot n'arrive qu'**après usage** — il faut que l'application
tourne pour que `_mvAvalees` se remplisse, et c'est ce relevé, pas ce lot, qui dira lesquels de ces
206 emplacements avalent vraiment quelque chose. ② Aucun n'a été **requalifié** : tous sont en
`info`, y compris `renderParcelles()` et `_recalcSurfTotale()` qui mériteront sans doute mieux —
c'est le lot de tri, et il attend les données. ③ Aucun rendu navigateur ; le risque est faible
(206 substitutions mécaniques, syntaxe vérifiée sur les douze modules) mais il n'est pas nul.
④ Les 20 `catch{}` des fenêtres d'impression restent muets, volontairement.

## 133. ★★★ CUV-13 — « PRESSURAGE » : L'ÉTAPE S'APPELLE PAR SON NOM, ET LA CUVE PRESSURÉE RESTE RÉCLAMÉE (15/09 — `cave.js` + `utils.js` + `index.html` + `sw.js` + `guide/` + `scripts/` + `package.json` · APP 7.23 → 7.24 · SW 7.86 → 7.87 · base `b3fa09f`)

**Le point de départ, dit par Nico**, sur la capture d'une cuve à 1005 posée à l'étape « Décuvage »
depuis trois jours : *« parfois, chez nous, quand on est au décuvage, on va remettre le jus dans une
autre cuve, surtout quand il reste encore du sucre dedans, afin qu'il finisse la fermentation. Et une
fois que cette fermentation est finie, on la mettra en tonneau. […] Ici il n'est pas possible de
rajouter de relevé de densité puisque décuvée, mais le décuvage ici est en fait un pressurage. Il faut
changer le mot ici. »*

### 133a. La cause : deux gestes, un seul mot

| | Porte | Ce qu'elle fait |
|---|---|---|
| L'**étape** `decuvage` | « Changer l'étape », ou le statut de « Modifier » | pose un passage daté (PARC-1). **Rien d'autre.** |
| Le **fait** `decuvage` | bouton « Décuver → Le Chai » | crée la cuvée, `statut='termine'`, `fa_finie`, densité de mise en fût |

`_vendMesurable = _vendIsActive (MPF, FA) || _vendDecuvee (le fait)`. L'étape n'était **ni l'un ni
l'autre** : la cuve pressée à 1005 perdait « Saisir une mesure », ses champs dans la tournée et toute
relance — au moment exact où le jus finit de fermenter hors du marc. ★ **CUV-11 avait ouvert la porte
au FAIT, pas à l'ÉTAPE** : même mot, deux objets, et la correction n'avait vu que l'un.

### 133b. Le modèle

- **Libellé** « Pressurage », « Press. » dans la frise. ⚠️⚠️ **Clé inchangée** : `statut_hist` porte déjà
  des `decuvage` datés, et les renommer serait une migration pour un libellé. Tout ce qui s'affiche lit
  `_VEND_STAT` / `_VEND_STEPS` — frise, parcours, badge, graphe, légende, toast, cahier imprimé — **sauf
  l'option du formulaire « Modifier »**, écrite dans `index.html`.
- `_vendPressee(c) = statut==='decuvage' && !_vendDecuvee(c) && !_vendEstFusionnee(c)`.
- ★★★ **Question posée à Nico : « acceptée ou réclamée ? » — réponse : « réclamée ».** Donc
  `_vendSuivie += _vendPressee` (tournée, cuves à mesurer, badge) et `_vendMesurable += _vendPressee`.
  Invariant écrit et testé sur 13 formes de cuve : **réclamée ⇒ acceptée**.
- ⚠️⚠️ **Le décuvage reste un FAIT (§118)** : « Modifier » permet de reposer l'étape sur une cuve déjà
  décuvée ; elle n'est pas réclamée pour autant, et reste mesurable comme toute décuvée (§129).
  Une cuve fusionnée ne suit rien.
- ⚠️ `_vendIsActive` **ne bouge pas** : « en fermentation » (filtre, KPI, fin de FA estimée, agenda)
  garde son sens. Même patron que CUV-9 pour `_vendFaEnCours`.
- **Le bouton « Décuver » garde son nom** : c'est lui qui envoie au Chai. Nico a demandé « le mot
  ici » — celui de l'étape. À rouvrir s'il veut « Mettre en fût ».

### 133c. Ce que l'écran dit

- **Détail** : « **Pressurée** : le jus reste suivi. Il garde sa place dans la tournée, et ses relevés
  continuent la même courbe. » La phrase de rattachement (« Modifier » le rattache à la nouvelle cuve)
  ne sort **que si la cuve a un repère de cuverie** : c'est lui que la tournée affiche, et il devient
  faux dès que le jus change de cuve.
- **Tournée** : pastille « pressurée ». **Plan de cuverie** : « pressurée », couleur de cuve suivie.
  **Ligne fermée** : « Pressurage », ou « N j » en rouge sans relevé depuis la veille.
- **Légende de la courbe** : un relevé pris **après** le passage au pressurage explique une remontée par
  le jus de presse. Même règle stricte (`>`) que le décuvage — un relevé du jour même ne dit pas s'il a
  été pris avant ou après le pressoir. Le décuvage, s'il existe, garde la priorité : jamais les deux notes.

### 133d. ★★ Trouvé en route

1. **Le badge de l'onglet et la barre de santé** comptaient `_vendIsActive` pendant que l'alerte « à
   mesurer » lit `_vendSuivie` : une cuve décuvée qui finit au chai était « à mesurer » dans l'alerte,
   absente du badge, sous « Fermentations suivies ». Latent **depuis CUV-9**, et une cuve pressurée
   l'aurait rendu quotidien. `_vendKpiData` lit `_vendSuivie`, fusionnées exclues.
2. ⚠️⚠️⚠️ **UN FILET SE SERAIT ÉTEINT EN SILENCE.** `mv-harnais-cuvdoc` vérifiait qu'un passage hors
   fenêtre n'était **pas** tracé en cherchant `>Décuvage<`. Après le renommage, il ne pouvait plus rien
   trouver, donc plus rien rater. Il lit maintenant le libellé **dans le module testé**, et un libellé
   introuvable est rouge. **Prouvé sur un mutant** (bornes de fenêtre du graphe retirées) : l'assertion
   réancrée rougit, l'ancienne serait restée verte. ★★★ **Règle, déjà vécue en §129e et qui revient :
   un renommage oblige à relire toute assertion d'ABSENCE qui cite l'ancien mot.**
3. `mv-harnais-parcours` **recopiait** `_VEND_STAT` et `_VEND_STEPS` — sa copie disait encore
   « Décuvage ». Les tables sont désormais **extraites** : un harnais qui teste sa propre copie ne teste
   pas le code livré.
4. `mv-harnais-cuv8` : deux contre-épreuves ancrées sur l'ancienne ligne de `_vendMesurable`, réancrées.
   Elles auraient rougi bruyamment — le bon sens de panne. `cuv7` et `agenda` extraient `_vendPressee`.
5. **Textes périmés depuis CUV-11 et CUV-12**, corrigés dans le même lot : l'aide et le guide
   réservaient « Saisir une mesure » au seul cas « elle finira au chai » ; le **guide** disait encore
   « on ne sulfite pas sur du sucre » — un quatrième texte client que CUV-12 n'avait pas vu.
6. **Hors lot, constaté sur la base `b3fa09f`** : `mv-harnais-cuvdoc --contre` porte une contre-épreuve
   sans effet (n° 26, « rabattement sur le bord bas au lieu de la remontée en bloc »). Ce mode n'est pas
   dans `npm run check`, donc rien ne le signale. **Non corrigé ici.**

### 133e. Le harnais

`scripts/mv-harnais-cuv13.mjs` — **43 assertions vertes, 12 contre-épreuves qui mordent**, dans `check`
et `prebuild` (et `npm run test:cuv13`). Il **rend** l'écran — détail, ligne, vignette, pastille, frise,
légende — au lieu de s'arrêter aux prédicats (§129d), et lit `index.html`, l'aide et les deux guides.
★★ **Méthode neuve, à reprendre ailleurs** : chaque contre-épreuve vérifie d'abord que son **ancre est
unique** dans le bloc extrait, puis que son **essai passe sur le code sain**. Sinon elle est rouge, jamais
« détectée ». ★ Trois essais faux attrapés ainsi à l'écriture, **zéro défaut de code** : l'espace
insécable de « Modifier », une vignette sans contenance donc sans couleur, un relevé du jour même de la
presse. Même leçon qu'au bac du 10/09 : *quand une assertion rougit, se demander d'abord qui a tort.*

### 133f. La note de livraison

**Base `b3fa09f`.** **APP 7.23 → 7.24** (deux entrées au journal) · **SW 7.86 → 7.87**. `npm run check`
joué en entier sur la base finale.

**Ouvert, et dit** : ① ⚠️ **toute cuve déjà laissée à l'étape « Décuvage »**, sur tous les domaines,
revient dans la tournée et en « à mesurer » ; « Décuver » ou « Changer l'étape » l'en sort. ② La démo
guidée n'a aucune cuve à cette étape : en ajouter une demande une vendange cohérente (10ter) — non fait.
③ Une cuve pressurée garde sa cuve du parc **occupée** jusqu'au décuvage (`_caveCuveOcc` lit
`statut!=='termine'`) ; « Modifier » la rattache à celle où le jus est parti, ce qui libère l'autre.
④ Aucun rendu navigateur ; `npm run build`, `test:smoke`, `test:e2e` restent côté Nico.

## 134. ★★★ PREP-1 — LE MODE PRÉPARATION GUERETTECH (16/09 — `app.js` · `firebase.js` · `utils.js` · `admin-gt.js` · `reglages.js` · `sw.js`, SW 7.88)

### 134a. La demande, et ce que Nico a décidé

Le client ne devait avoir « qu'à cliquer ». Réponse du 16/09 : **le fichier est inutile** — ce que le
panneau GT écrit part déjà dans son domaine — mais le panneau n'écrit ni la cave, ni le planning, ni les
taux, ni la réserve. Nico : *« non je préfère mettre en place un mode préparation »*.

**Décisions de Nico, à ne pas rouvrir sans lui** : ① les saisies se font **au nom de GUERETTECH** ;
② *« je ne valide aucune tâche »* — les gestes de travail sont donc refusés, pas seulement déconseillés ;
③ le mode sert aussi à **vérifier avant livraison** — en vue administrateur seulement.

★ Pourquoi « faux salarié » avait été dit, puis corrigé : chaque validation écrit `qui` = la personne
connectée (une quinzaine d'endroits), et le Pilotage relit ce nom. Nico avait raison — sans validation,
rien ne s'écrit à son nom. **Le vrai risque était l'appui de trop** : « Début » et « Valider » enregistrent
en un appui, sans confirmation, dès qu'un filtre de tâche est posé.

### 134b. ★★★ Le danger : le serveur ne protège plus d'une erreur de domaine

Pour un membre, `firestore.rules` refuse toute écriture hors de son domaine. **Le jeton GT (claims
`gtAdmin` + `gts`) écrit dans TOUS les `mavigne_*`**, sans contrôle de forme. Or trois choses ne sont pas
rangées par domaine sur l'appareil : **`mavigne_offline_queue`** (vidée par `_flushQueue` dans le domaine
**courant**), **`mavigne_denied_stash`** (renvoyé par `mvStashResend` dans le domaine courant) et
**`mavigne_backup_*`**. Une modification en attente du domaine A partirait dans le domaine B.

**Les quatre règles, tenues dans le code :**
1. **en ligne seulement** (`_mvPrepBoot` refuse hors ligne) ;
2. **la file porte son domaine** : `_queueSave` pose `mavigne_offline_queue_t` ; en préparation,
   `_flushQueue` refuse une file d'un autre domaine **ou sans marque** ; hors préparation, rien ne change ;
3. **aucune copie locale** : `_mvLsKey()` rend `''` en préparation ; à la sortie, `_fbStashVider()` vide le
   coffre **et le nombre écarté est dit** ;
4. **un seul domaine par passage** : l'entrée et la sortie **rechargent** l'application.

### 134c. Entrer, sortir

**Entrer.** Carte client → « Préparer ce domaine — ses écrans, en direct » → `agtPrepOuvrir(slug)`. La
feuille **vérifie** : session GT (refus si fermée), file de CETTE fenêtre (refus si d'un autre domaine),
coffre (refus s'il n'est pas vide), dernière connexion de l'équipe (`_agtConnexions`). Puis
`_agtLogAccessLu` → `_mvPrepPoser` : drapeau `sessionStorage.mv_prep` = `{slug, nom, plan, avant, at}`,
**`mavigne_tenant` = le domaine du client AVANT le rechargement**, rechargement.

Au démarrage : `_fbLoad` → `_loadQueue()` → **`_mvPrepBoot()`**, avant l'écran de connexion. Il attend la
session (`_fbAuthPret`, elle ne vit que dans l'onglet), exige `gtAdmin` + `gts` valides, le réseau,
`_fbTenant() === slug`, et une file vide ou de ce domaine. Sinon : drapeau retiré, domaine d'avant rendu,
retour au panneau avec la raison. Si tout tient : utilisateur **synthétique** `GUERETTECH`, **rôle admin
SEUL**, absent de `MEMBRES`, formule du registre (`_prepPlan`, lue par `window._plan`), puis
**`_mvApresEntree()`** — la fin de `confirmLogin`, **extraite au caractère près** : les deux entrées ne
peuvent plus diverger.

**Dedans.** Bandeau dans l'emplacement du bandeau d'essai (`#mv-trial-bar`, même `body.mv-trial-on`),
construit **par le DOM** : violet, puis orange sous 10 min, puis rouge. **L'écriture s'arrête 2 min avant
la fin de session** (`_MV_LOCKED`, relu par `_mvCheckExpired`), au lieu de laisser le serveur refuser.

**Sortir.** « Quitter » → `_mvPrepQuitter` : s'il reste des modifications, on tente l'envoi, et **on ne
sort pas** tant qu'elles n'ont pas pu partir ; trace « Préparation fermée » ; coffre vidé et compté ;
domaine d'avant rendu ; `mv_prep_retour` + `mv_prep_msg` ; rechargement → `_gtEnterPanel` → message.

### 134d. Refusé ou masqué en préparation

- **Les 10 gestes de validation** : une condition en tête de `_mvValidBlocked()`, le verrou qui existait
  déjà pour la consultation d'une ancienne période. **Hors de ce verrou**, gardés un par un :
  `openRepPonct`/`saveRepPonct`, `openJournalEntry`/`saveJournalEntry`. **Sessions tracteur** : rien à
  ajouter — `openNewSession` refuse qui n'est pas tractoriste, d'où le rôle admin SEUL (et la question
  « Tu prends le tracteur ? » ne se pose pas).
- **Jamais l'écran de conditions** (`_mvTermsCheck`) : GUERETTECH ne signe pas pour le client.
- **« Changer mon mot de passe »** : `confirmChangePwd` agit sur `firebase.auth().currentUser` — ce serait
  le compte GT.
- **« Ma part du chantier »**, **« Ma trace »** (vides pour qui n'est pas de l'équipe), **les nouveautés**,
  la garde multi-onglet, la relecture des rôles dans `MEMBRES`.
- **Réglages › Équipe** : `updateMemberRoles`, `resetMemberPassword`, `updateMemberEmail` partaient
  **sans domaine** — refus `tenant invalide` pour un jeton GT. `_mvPrepTenant` l'ajoute **en préparation
  seulement** : dans le panneau, `TENANT_ID` serait celui de la fenêtre.

**GUERETTECH apparaîtra, et c'est juste**, sur ce qu'il règle : tournée fixée (`par`), appoint GNR (`par`).
⚠️ En cave, une opération **sans intervenant coché** prend le nom connecté : cocher le vrai caviste.

### 134e. ★ Trouvé en route

① **Une vingtaine de lectures directes de `localStorage.mavigne_tenant`**, dont **deux au chargement des
modules** (`_MV_IS_MG`, `_PLAN_IS_MG`) : le domaine doit être posé AVANT le rechargement, sinon un poste
qui a déjà ouvert MG préparerait un autre domaine avec les règles de MG.
② ★★★ **`agtLogAccess` écrit la liste EN MÉMOIRE** (`_agtAccessLog`, chargée par le panneau). Appelée
depuis une préparation, elle aurait **remplacé tout le journal d'accès par une seule ligne**.
`_agtLogAccessLu` relit, complète, plafonne à 100, et **n'écrit rien sur une forme inconnue**.
③ **« Accéder » (`agtAccedeTenant`)** ouvre `?tenant=` dans un **nouvel onglet**. Depuis SEC-GT la session
est limitée à l'onglet (`browserSessionPersistence`) : il arrive sur l'écran de connexion du domaine. Son
commentaire promet l'inverse. Il écrit aussi `mavigne_tenant` pour toute la fenêtre. **Gardé, à trancher.**
④ Le premier essai **bumpait APP** : `mv-whatsnew-check` refuse un bloc APP sans rien à annoncer, et §7 le
disait — *un lot GT n'a rien à annoncer*. **APP inchangé, SW seul.**
⑤ ⚠️⚠️ **`preflight.mjs` est aveugle sur ~220 lignes de `firebase.js`.** Son nettoyeur retire les blocs
`/…/` **avant** les commentaires de ligne ; un « auth/ » suivi d'une étoile écrit dans un commentaire
(vers la ligne 1684) ouvre un **faux bloc** jusqu'au prochain `*/` (vers 1901). **C23 ne voit aucune
déclaration là-dedans.** `_mvPrepTenant` y était : C23 a crié. ★ **La note ajoutée pour expliquer le piège
contenait elle-même la séquence** et a déplacé l'aveuglement sur trois autres fonctions — attrapé au
relancement. `_mvPrepTenant` est déclarée hors zone ; le harnais vérifie qu'elle reste visible, et sa
contre-épreuve réintroduit la séquence. **Nettoyeur non corrigé ici.**

### 134f. Le harnais

`scripts/mv-harnais-prep.mjs` — **75 assertions vertes, 26 contre-épreuves qui mordent**, dans `check` et
`prebuild` (et `npm run test:prep`). Il exécute les **vraies** fonctions extraites (entrée, refus, bandeau,
sortie, file, fonctions d'équipe, journal d'accès), puis lit le câblage dans les sources. Méthode de §133e :
ancre **unique**, essai **vrai sur le code sain**, sinon rouge. ★ Une contre-épreuve est passée inaperçue
au premier tour — elle écrivait un bloc **fermé**, qui ne reproduit pas le piège ⑤. Corrigée pour écrire la
séquence **sans fermeture**, comme dans le fichier.

### 134g. La note de livraison

**Base `11188c7`.** **APP 7.24 inchangé** · **SW 7.87 → 7.88**. Aucune règle, aucune Cloud Function
touchée : `firebase deploy --only hosting` suffit. `npm run check` joué en entier sur l'arbre final.

### 134h. Ouvert, et dit — et le protocole

**Protocole, sur un domaine jetable, fenêtre privée ngdevpro :** ① carte → « Préparer » → la feuille dit la
session et « rien » en attente ; ② ouvrir → bandeau violet (nom, durée), **pas** d'écran de conditions,
modules de sa formule ; ③ saisir une cuve, un contrat, un taux → les retrouver dans la fiche client ;
④ Parcelles, filtre de tâche posé → « Début » puis « Valider » → **refus**, rien au journal ;
⑤ Réglages › Changer mon mot de passe → **refus** ; ⑥ couper le réseau, saisir, « Quitter » → **refus**
tant que rien n'est parti ; ⑦ réseau revenu → « Quitter » → panneau, « Préparation fermée », journal
d'accès : ouverte puis fermée, **anciennes lignes intactes** ; ⑧ se connecter comme le client → ses
données sont là, aucun « GUERETTECH » au journal.

**Ouvert** : ① aucun rendu navigateur côté Claude ; ② « Accéder » / « Préparer » (§134e ③) ; ③ le trou
de C23 (§134e ⑤) ; ④ la vue d'un ouvrier n'est pas couverte ; ⑤ **après la remise**, le client peut
écrire en même temps : écriture du document entier, la dernière gagne (sauf `parcelles`, fusionnées) —
le même risque que deux administrateurs ; la feuille montre la dernière connexion de l'équipe ;
⑥ la session GT (8 h) ne se prolonge pas de l'intérieur : sortir, rouvrir ; ⑦ `INSTALLER-UN-DOMAINE.md`,
hors dépôt, reçoit l'étape « Préparer » de la main de Nico ; ⑧ fermer la fenêtre privée après une
préparation reste la seule garantie que rien du domaine ne demeure dans le navigateur ; ⑨ le journal
d'accès affiche les noms d'icône **en toutes lettres** (« cle » pour « Accéder », « crayon » ici) :
`_agtBuildLog` rend `e.icon` tel quel. Un emoji aurait fait remonter le cliquet d'icônes — non corrigé.

---

## 135. ★★★ RECUP-1 — UNE JOURNÉE ÉCOURTÉE SE RETIRE DU COMPTEUR AU TAUX NORMAL, ET LES HEURES SUP DEVIENNENT DU TEMPS DE RÉCUP MAJORÉ (16/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.24 → **7.25** · SW 7.88 → **7.89**)

> Point de départ, un utilisateur : *« les heures de ces horaires réduits ne sont pas décomptées des heures
> sup »*. Puis Nico, sur la maquette : *« les heures des journées écourtées, quelle qu'en soit la raison,
> retirées de prime abord des heures sup ; les heures sup doivent cependant apparaître »* ; *« il faut
> afficher les temps de récup en majoration (25 % ou 50 %) »* ; *« sur les heures retirées il faut retirer
> au taux normal, pas au taux heures sup »* ; puis « go ».

### 135a. Le constat, mesuré avant la maquette

- `_planSupMonth` valait `Math.max(0, écart)` : **un mois en déficit était écrasé à zéro**. Un horaire réduit
  ne se retirait donc que dans SON mois. Sonde sur les vraies fonctions : +6 h en août puis −3 h en
  septembre → compteur **6 h** ; les deux journées dans le même mois → **3 h**. Le résultat dépendait du
  calendrier.
- Mode payé : 6 h payées et une absence injustifiée le même mois → journée « non payée » **et** solde −7 h.
  L'écran annonçait les deux à la fois.
- Aucun motif possible sur un horaire raccourci, aucune absence « de telle heure à telle heure » : un
  après-midi à la maison ne se disait qu'en raccourcissant la journée.

### 135b. Le cadre légal, recherché, et ce que Nico a tranché

- Accord national agricole du 23/12/1981 (avenant 19 étendu par arrêté du 15/04/2020), art. 10.4 : les heures
  au-delà de 35 h se compensent par du repos (une journée raccourcie en est un), bilan en fin de période,
  salaire acquis si la compensation dépasse ; à titre supplétif, une absence non payée se **retient** et
  ne se récupère pas. Art. 7.3 : **25 %** de la 36e à la 43e heure, **50 %** au-delà.
- Une retenue qui dépasse le temps d'absence est une sanction pécuniaire. Un arrêt maladie ne peut pas
  réduire les heures sup (discrimination liée à la santé).
- ★★ **Nico a tranché, informé** : toute journée écourtée se retire D'ABORD des heures sup, quel qu'en soit
  le motif. ⚠️ **Pour une absence injustifiée, c'est un écart assumé avec la règle supplétive** (retenue
  sur salaire) — à faire confirmer par le comptable de chaque domaine. **Gardés neutres parce que la loi
  l'impose** : arrêt de travail, formation, événement familial, congé sans solde.
- Trois maquettes : v1 (créneau + motif), v2 (récup majorée — elle retirait des heures sup à 25 % d'abord),
  **v3 validée** : le retrait se fait **au taux normal**, 1 h manquée = 1 h de récup en moins. ★ C'est
  aussi la lecture la plus sûre : on retire exactement le temps manqué.

### 135c. Le moteur — une seule boucle, deux lectures

- `PLAN_RECUP_DEBUT='2026-09'` (**constante**, idiome de `PLAN_MAJ_DEBUT`) et `_planRecupActive(m)`. Avant :
  la règle historique **à l'identique**, harnais du retard et du relevé à l'appui.
- `_planJourEcart(plId,m,d,e)` : `plus` (heures au-delà de `_planRefPart`), `moins` (heures manquées), `cpt`
  (`retire` → retenue · `domaine` → à compenser · `indet` → horaire raccourci sans motif, **traité comme le
  domaine** : à défaut de savoir, on ne retient rien sur une paie). Horaires chaleur sans motif = domaine.
- `_planHsupMois(mbr,m)` : le taux se décide **à la semaine (lundi → dimanche)**, même à cheval sur deux mois
  ou deux années ; les heures au-delà de la 43e sont rangées sur les **derniers** jours porteurs d'heures sup,
  puis chaque jour va dans SON mois. ★ **La plus forte seule** (§73b) : un dimanche ou un férié déjà majoré
  ne prend la majoration des heures sup que pour ce qui dépasse son propre taux.
- `_planHsupTiers` (une valeur saisie à la main garde sa part à 50 %, bornée), `_planHsupMajBank` (**même
  aiguillage** que `_planMajBank` : au compteur si les heures se récupèrent, à la paie sinon).
- ★★★ `_planCompteur(mbr,upto)` calcule le compteur **une fois** ; `_planBank` et `_planYearBalance` en
  sont deux lectures. Avant, chacune avait sa boucle : ça tenait tant que la règle était une somme. Elle ne
  l'est plus — ce que le compteur couvre dépend de l'ORDRE des tranches. Chaque mois : ① les heures sup et
  majorations comblent d'abord ce qui reste à compenser ; ② le salarié se retire, non-couvert **retenu** ;
  ③ le domaine se retire, non-couvert **à compenser** ; ④ la récup ; ⑤ les paiements pris sur le compteur.
  Invariant tenu par construction : **solde − à compenser = net**, tant qu'aucune récup ne dépasse.
- Absence partielle : `abs_de`, `abs_a`, `motif_h` **figé à la saisie** (même principe que le retard, §55).
  `_planAbsPartH` retire la coupure là où tombe son heure fixée (`_planCoupureH`), sinon au milieu de la
  journée — ce qui rend exactement la réponse de `_planRetardH` pour un retard (A6 : 5 h, pas 6).
- Motifs : `perso` et `domaine` ajoutés, champ `cpt` sur chacun ; `retard` et `autre` **cachés** (relus,
  plus choisis). ⚠️ `autre` doit rester le DERNIER du tableau : c'est le repli de `_planAbsDef`.

### 135d. Les écrans, et les écarts avec la maquette validée

- Feuille du jour : « Quand » (Toute la journée / Une partie seulement), quatre raccourcis, ruban, sept motifs
  dans l'ordre de la maquette, verdict avant d'enregistrer, motif **obligatoire**. `_planAbsConstruit` est la
  seule construction d'une absence : le verdict la montre, l'enregistrement l'écrit. Le verdict passe par
  `_planSimJour` : le jour est posé dans les entrées, le compteur calculé, puis l'entrée remise.
- Travaillé : un horaire plus court demande « Pourquoi ? » ; `reduit_motif` n'est écrit que si la journée est
  vraiment raccourcie. `planRetardSync` est supprimée avec l'ancienne saisie du retard.
- Fiche › Compteur, à partir de septembre 2026 : trois cartes (`_planRecupCartes`) avant l'existant ; la
  carte violette « Compteur » reste pour les mois d'avant. Tableau mois par mois : colonnes Majoration et
  Heures retirées. Relevé : bloc « Heures supplémentaires », ligne « Ce mois », tableau d'année.
- **Écarts dits à Nico** : « Temps de récup **sans** ce jour » (le compteur est mensuel, pas chronologique) ;
  « acquises » inclut le report du mois précédent, l'explication le dit ; la grille montre le mois entier ;
  la valeur d'une semaine est brute (la retenue se lit au mois) ; la légende « Retard » devient « Absent une
  partie ».

### 135e. Ce que les filets ont trouvé, et qui avait tort

- ★★★ **LA FEUILLE DU JOUR N'AVAIT NI HAUTEUR MAXIMALE NI FOND, depuis le socle du dépôt.** La règle
  `#ovPlanDay .ov-plan-sheet` vise une classe qu'aucun élément ne porte. **Mesuré dans Chromium sur la base
  intacte** : la feuille d'une absence faisait 1 078 px sur un écran de 844 et dépassait par le haut — les
  modes étaient hors d'atteinte. Aucun harnais ne lit une mise en page : seul le rendu réel l'a montré.
  Corrigé par une règle sur `#ovPlanDaySheet` ; mesuré ensuite : 776 px, le corps défile.
- ★★ **Vrai bug du lot, attrapé en relisant** : l'en-tête du tableau d'année du relevé lisait une variable
  posée PLUS BAS dans la fonction (`var`, hoisting) — il écrivait « Heures dues » en septembre. Verrouillé
  (L24) avec sa contre-épreuve.
- Le harnais neuf : **36 rouges au premier passage, tous du harnais** — il remplaçait les objets globaux au
  lieu de les modifier en place (`_planMigrateYears` recopie `window.PLANNING_ENTRIES`). Puis **49 h
  fantômes** : les fériés du modèle de test portaient 7 h « faites », majorées à 100 %. Une contre-épreuve
  était **inopérante** (elle sautait le retour d'un motif neutre sans lui donner de destination).
- ⚠️⚠️ **Une bombe à retardement désamorcée** : `mv-harnais-releve` lisait l'année courante. La feuille
  d'août de Victor, qui prouve la règle d'avant, serait passée sous la nouvelle **le 1er janvier 2027**.
  Horloge figée au 16/09/2026. Sa contre-épreuve n°16 visait l'ancienne ligne « Ce mois ».
- `mv-harnais-retard` extrait ses fonctions : `_planAbsPartiel` ajoutée à sa liste. ESLint : `_rc`
  redéclaré dans le relevé. C24b : deux valeurs de gestionnaire sans `_escAttr`.
- Charte : **le cliquet des rayons compte aussi le repli d'un jeton** (`var(--r-md,12px)` lit « 12px ») —
  rayons hors pas (10/13/15/99 px). `var(--shadow-sm)` sans repli → ombre écrite en dur.
- ⚠️ **Poids** : `planning.js` 420 → 454 ko (+8 %), au-delà des +5 %. Découpage envisagé et écarté : un
  module de plus pour une fonction du Planning, c'est des globaux à exposer et un ordre d'import à tenir.
  Cliquet regravé (`mv-harnais-typo --baseline`), les autres fichiers n'ont bougé que dans leur tolérance.

### 135f. La note de livraison

**Base `8136bd0`** (`.mv-base` posé). **APP 7.24 → 7.25 · SW 7.88 → 7.89.** Hébergement seul :
`firebase deploy --only hosting`. `public/guide.html` **ne se livre pas** : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | créneau d'absence, motif d'un horaire raccourci, compteur en temps de récup, 3 cartes, relevé | — |
| `src/styles.css` | styles de la feuille et du compteur ; la feuille du jour a enfin sa hauteur maximale | ★ SW |
| `src/utils.js` | APP 7.25, 3 nouveautés, aide du Planning | ★ APP |
| `index.html` | version aux 4 emplacements | ★ APP |
| `public/sw.js` | 7.89 | ★ SW |
| `guide/10-planning.html` | motifs, créneau, horaire raccourci, heures sup et récup | — |
| `scripts/mv-harnais-recup.mjs` | neuf : 117 assertions, 10 contre-épreuves | — |
| `scripts/mv-harnais-releve.mjs` · `mv-harnais-retard.mjs` | horloge figée · une dépendance de plus | — |
| `scripts/typo-baseline.json` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` | cliquet regravé · harnais branché · §135 comptée | — |

### 135g. Ouvert, et dit

① **Les non-annualisés** (TESA, saisonniers, extras) : leurs heures sup se décomptent légalement **à la
semaine** ; le compteur reste mensuel pour eux — lot à part. ② **Confirmation comptable** de la règle des
absences injustifiées (§135b). ③ En mode **payé**, l'appli donne les heures par taux, pas de montant.
④ Sur une **sélection** de plusieurs jours, une absence couvre toujours la journée entière. ⑤ Un solde
« à compenser » au 31 décembre ne passe pas sur l'année suivante : chaque année repart de son report de
départ. ⑥ Rendu vérifié dans Chromium (serveur de dev, données injectées, 390 px, clair et sombre, zéro
erreur console) — **pas sur un téléphone réel**, et pas le document imprimé à l'œil.

---

## 136. ★★★ RECUP-2 — POUR LA COMPTA : L'HEURE ET SON TAUX, JAMAIS 1H15 (16/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.25 → **7.26** · SW 7.89 → **7.90**)

> Nico, après RECUP-1 : *« il ne faut pas que les heures soient majorées dans l'appli et sur la paie ; je
> souhaite voir le temps d'heures en récup, le temps à déclarer en compta et le taux à appliquer »*. Puis,
> sur la maquette v4 : *« Non attention : 1h sup en récup égale 1h15, en paie égale 1h15, MAIS pour la paie
> il faut laisser 1h sup car la compta intègre en 1h + 25 % »*. Puis « oui go » sur la v5.

### 136a. Ce que la v4 avait mal compris — et la leçon

La v4 opposait « le domaine récupère » et « le domaine paie » : une heure était **soit** en récup, **soit** à
déclarer. **Faux.** Les deux écritures ont la **même valeur** (1 h 15) ; ce qui change, c'est la façon de
l'écrire : en récup la majoration est dans le temps, pour la compta on donne **l'heure brute et le taux**,
parce que la paie majore elle-même. La v5 affiche donc, pour chaque taux, les trois chiffres demandés.
★ *Une règle formulée « jamais les deux » peut cacher une équivalence : c'est la v4 livrée à Nico qui l'a
montré, pas une relecture.*

### 136b. Le moteur

- `_planHsupMois` range chaque heure sup dans un **seau à son taux effectif** (`buckets`) : le palier 25/50 %,
  ou le taux du dimanche/férié s'il est au moins aussi fort — **une seule fois**. Les heures **prévues** d'un
  dimanche ou d'un férié ne sont pas des heures sup : seule leur majoration compte (`majHs`, §73).
- La majoration des heures sup entre au compteur **dans tous les modes** : le compteur compte en temps de
  récup partout (calculé dans `_planCompteur` ; `_planHsupMajBank`, devenue sans appelant, est supprimée).
  ⚠️ **Les domaines en mode « payé » voient leur compteur changer d'unité à partir de septembre 2026.**
- `_planMajBank` et `_planMajMonth` **ne bougent pas** — le harnais de la majoration reste intact ; le partage
  heures prévues / heures sup vit dans `_planCompteur`.
- `_planCompteur` : des tranches `{mois, taux, nat, h}`. L'acompte du mois (`paye`, heures brutes) se prend
  sur le taux le plus bas d'abord et n'entre jamais au compteur (`payes`). Un paiement **pris au compteur**
  (`paye_bank`) se saisit en **temps de récup** et rend l'heure brute : `brut = v / (1 + taux)` (`payesBank`).
  FIFO : le mois le plus ancien d'abord, le taux le plus bas d'abord dans un mois.
- `_planValeurPourBrut` : le surplus d'un acompte au-delà du mois (heures brutes) retire ce qu'il vaut au
  compteur — 2 h à 25 % = 2 h 30.

### 136c. Les écrans

- `_planComptaLignes` / `_planComptaTable`, sur l'onglet Compteur (carte « Pour la compta ») et sur le relevé.
  **Sans paiement** : chaque ligne dit les deux équivalences (maquette v5). **Avec un paiement** : les lignes se
  séparent en « Payées ce mois », « Au compteur » et « Payées depuis le compteur » — sinon la compta lirait
  les mêmes heures deux fois. ★ La colonne « En récup » **s'additionne au solde** : c'est le test (M4f, M5d, M6c).
- Relevé : à partir de septembre 2026, le bloc « Dimanches et jours fériés travaillés » ne s'imprime plus —
  ils sont dans la table, à leur taux le plus fort. Garder les deux ferait lire leur majoration deux fois.
- **Écarts avec la maquette, dits** : lignes « Report des mois précédents » et « Comble ce qui restait à
  compenser » (un vrai compteur a un passé) ; lignes de paiement (absentes de la maquette) ; « Heures
  manquées (part couverte) » en une ligne quand une retenue existe, pour que la colonne tombe sur le solde.

### 136d. Ce que les filets ont trouvé

- **G7 et H2 du harnais encodaient l'ancienne règle** (mode payé = majoration hors compteur ; `z.maj` =
  majoration au-delà du dimanche). Réécrits pour dire la nouvelle — pas contournés.
- Cinq contre-épreuves visaient du code déplacé : elles suivent. Quatre défauts neufs : déclarer 1 h 15,
  un paiement au compteur rendu en temps de récup, la majoration d'un dimanche prévu comptée au compteur
  en mode payé, une conversion brute sans taux. **14 défauts, 14 détectés.**
- `_planRecupTxt` devenue morte (C15) : retirée, avec son commentaire.
- Rendu Chromium de la carte : clair et sombre, sans et avec paiement, zéro erreur console. ⚠️ Bruit du
  **test** seulement : réinjecter la config rouvre l'écran des conditions, qui masquait la capture.

### 136e. La note de livraison, et ce qui reste ouvert

**Base `2bc2a6d`** (RECUP-1 poussé, vérifié identique au livré, 16 fichiers sur 16). **APP 7.25 → 7.26 ·
SW 7.89 → 7.90** — la 7.25 a pu être servie, on ne la réutilise pas. `firebase deploy --only hosting`.
`public/guide.html` ne se livre pas : `node scripts/build-guide.mjs`.

**Ouvert** : ① le solde du compteur n'est pas traduit en « si tout était payé : X h à +25 % » hors d'un
paiement réel ; ② les tranches d'avant septembre 2026 se déclarent au taux 0 (règle d'alors) ;
③ les non-annualisés (TESA, saisonniers) restent au décompte mensuel ; ④ la règle des absences injustifiées
est toujours à faire confirmer par le comptable ; ⑤ pas de téléphone réel, relevé imprimé non regardé à l'œil.

---

## 137. ★★★ FICHE-1 — LA FICHE D'UN SALARIÉ SE LIT COMME UNE PAIE (17/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.26 → **7.27** · SW 7.90 → **7.91**)

> Nico : *« on revoit toute la mise en page des fiches salariés du planning… tout doit être clair pour le
> salarié, pour la compta, pour la secrétaire »*. Puis, sur la maquette : *« le mec qui prend des congés
> payés… on a l'impression qu'il a raté des heures »* ; *« il faudra ajouter pour la secrétaire la petite
> case demande à être payé, le nombre d'heures souhaitées »* ; puis « go » sur la v3.

### 137a. Le constat, mesuré dans Chromium avant la maquette

L'onglet Compteur empilait **8 cartes sur plus de 3 000 px** ; l'onglet Mois ne listait que les jours
modifiés ; le mot « acompte » désignait tantôt des heures (colonne « Acompte payé »), tantôt des euros ;
payer des heures sup n'était possible **qu'en mode « payé »**, au fond du tableau mois par mois.

### 137b. Ce que la paie fait d'un congé payé — recherché, et tranché par Nico

Congés payés, RTT, congés pour événement familial sont des **absences rémunérées** : elles ne font pas
varier le salaire, elles se mentionnent. Les logiciels de paie comparent heures du contrat et heures
réalisées, et saisissent les absences à part, typées et datées. ★ D'où le modèle retenu : chaque jour se
range en **prévu / fait / absence payée / neutre**, et l'écart d'un jour = fait + payé + neutre − prévu —
il ne garde que les heures sup et ce qui n'est pas payé. **Un congé payé n'est jamais une heure manquée.**

### 137c. Le moteur et les écrans

- `_planPaieMois(mbr,m)` : le mois tel que la paie le lit. La récup et les absences sont couvertes **dans
  l'ordre des dates**, à hauteur de ce que `_planCompteur` a couvert : les totaux sont ceux du compteur.
- `_planPayeMaxCouvert` : le plus d'heures payables **sans découvrir la récup déjà prise ni faire retenir
  une absence** — essais sur le vrai compteur, la saisie remise en place ensuite.
- Fiche : **Résumé** (cadre « Pour la paie » : salaire de base, à payer en plus, à retirer, pour information ;
  carte « Paiement des heures sup » ; où vont les heures sup), **Jours** (tous les jours, semaine par semaine,
  heures sup par taux, alerte au-delà de 48 h), **Compteur** (temps de récup, ce qui a bougé, l'année, report
  replié), **Congés et acomptes**. Le mois se change **sans fermer la fiche** (`planFicheMois`).
- La case **« demande à être payé »** écrit `demande` dans `PLANNING_HSUP[nom][mois]`, avec `paye` (heures
  brutes) et, au-delà du mois, `paye_bank` (RECUP-2). ★ **Quel que soit le mode du domaine** (Nico, « ok »).
- Les anciens identifiants d'onglet (`mois`, `ac`) se relisent : un lien ancien ne tombe pas à vide.

### 137d. Ce que les filets ont trouvé

- **Contraste** (`mv-harnais-contraste`) : quatre paires neuves sous 4,5 — `--bleu` sur `--bleu-pale` (3,28 en
  sombre, remplacé par `--bleu-tx`), le violet de la récup sur son pâle (3,7), l'or du dimanche sur un pâle
  sans variante sombre, et un **jeton de surface employé en couleur de texte** pour un bouton. Le bouton
  reprend le bouton sombre de la feuille du jour.
- Harnais : section **N** de `mv-harnais-recup` (31 assertions) et trois défauts neufs — un congé lu en
  heures manquées, une récup payée même non couverte, un « sans toucher la récup prise » qui l'ignore.
  **196 assertions, 17 défauts, 17 détectés.**
- ⚠️ **Poids** : `planning.js` 454 → 486 ko (+7 %). Découpage envisagé et écarté (même raison qu'en §135e) ;
  cliquet regravé.

### 137e. La note de livraison

**Base `612735b`**. **APP 7.26 → 7.27 · SW 7.90 → 7.91.** `firebase deploy --only hosting`.
`public/guide.html` ne se livre pas : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_planPaieMois`, quatre onglets, case de paiement, mois dans la fiche | — |
| `src/styles.css` | styles `.pf-*` | ★ SW |
| `src/utils.js` | APP 7.27, 3 nouveautés, aide du Planning | ★ APP |
| `index.html` | onglets et flèches de mois de la fiche, version | ★ APP |
| `public/sw.js` | 7.91 | ★ SW |
| `guide/10-planning.html` | la fiche d'un salarié | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `.mv-base` | section N · cliquet · §137 · base | — |

### 137f. Ouvert, et dit

① **Le relevé PDF garde sa mise en page actuelle** : sa refonte (cadre en tête, colonnes Prévu, Fait,
Absence payée, deux pages A4) est le lot suivant, **FICHE-2**. ② La carte annuelle du compteur (plafond,
modulation) reste l'ancienne, sous le tableau de l'année. ③ Pour un mois d'avant septembre 2026, le cadre
renvoie au Compteur : la règle d'alors n'avait ni taux par heure ni absences payées couvertes.
④ Pas vu sur un vrai téléphone.

---

## 138. ★★★ FICHE-2 — LE RELEVÉ SUIT LA FICHE (17/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.27 → **7.28** · SW 7.91 → **7.92**)

> Nico : *« c'est pas ordonné du tout sur le pdf »*, puis « go » sur la maquette v3 et « suite » après FICHE-1.

### 138a. Ce qui change

À partir de **septembre 2026**, `_planExportPDF_` passe la main à `_planReleveFiche_` (mois actif, équipe
non collective) : **deux pages A4**. Page 1 : l'en-tête, le cadre « Pour la paie », puis chaque jour en
colonnes surlignées **Prévu / Fait / Absence payée**, l'écart, les observations, le total de chaque semaine
(heures sup par taux, alerte au-delà de 48 h) et celui du mois. Page 2 : où vont les heures sup et la demande
du salarié, le temps de récup, le détail mois par mois, les contrats de l'année, les congés, le compteur
d'heures, les acomptes, ce qu'il faut savoir, et trois cases : **signature salarié**, **signature employeur**,
**transmis à la compta le**. Les mois d'avant septembre gardent leur relevé.

### 138b. Un seul calcul pour l'écran et le papier — et la preuve

- `_pfSemaines`, `_pfMouvements`, `_pfAnnee`, `_pfPaieDonnees` sortent de `_pfJours`, `_pfCompteur` et `_pfCadre`.
  ★ **L'écran rend le même HTML au caractère près** : instantané des trois onglets pris AVANT la factorisation,
  dans trois scénarios (sans paiement, 8 h, 18 h), comparé APRÈS — neuf égalités.
- `_plRvAnnuHtml` sort du relevé d'avant : les deux relevés impriment le même compteur d'heures, comme ils
  impriment déjà les mêmes `_plRvContratsHtml` et `_plRvCpHtml`.

### 138c. Ce que les filets ont trouvé

- ★★ **`mv-harnais-releve` a refusé la première version** : elle imprimait un tableau de congés simplifié et
  une ligne de plafond, et **perdait les contrats de l'année, leurs coupures, le prorata du plafond, le mode de
  décompte des congés et le compteur d'heures**. Le harnais avait raison : ces blocs sont repris tels quels.
  « Ce qui existait déjà n'a pas bougé » n'est pas une formule.
- `mv-harnais-recup` : six assertions (L19–L24) posaient leurs questions à l'ancien relevé de septembre ; elles
  les posent au nouveau. Section **O** (13 assertions) et deux défauts neufs (le relevé de septembre retombe
  sur l'ancien ; les absences payées disparaissent des colonnes). Un défaut devenu sans objet est retiré, dit.
  **212 assertions, 18 défauts, 18 détectés.**
- Charte : les tailles du document passent par les jetons de l'échelle (le barème compte aussi les chaînes
  CSS du relevé), aucun gris plus pâle que `#78716C`, et une graisse `400` a coûté un rouge au cliquet des
  graisses hors pas — `inherit` à la place.
- La page 2 peut dépasser un A4 quand l'année porte plusieurs contrats : elle **s'allonge** au lieu d'être
  coupée, et son pied suit le contenu.

### 138d. La note de livraison

**À appliquer par-dessus FICHE-1** (base `612735b`, FICHE-1 non encore poussé au moment du lot). Le zip
porte les fichiers cumulés FICHE-1 + FICHE-2 ; `.mv-base` n'y est pas, pour que le garde-fou reste juste
que FICHE-1 soit déjà validé ou non. **APP 7.27 → 7.28 · SW 7.91 → 7.92** — la 7.27 a pu être servie.
`firebase deploy --only hosting`. `public/guide.html` : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | aides `_pf*` partagées, `_planReleveFiche_`, `_plRvAnnuHtml` | — |
| `src/utils.js` | APP 7.28, nouveauté, aide du relevé | ★ APP |
| `index.html` | version | ★ APP |
| `public/sw.js` | 7.92 | ★ SW |
| `guide/10-planning.html` | le relevé en deux pages | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` | sections L et O · §138 | — |

### 138e. Ouvert, et dit

① Relevé vérifié dans Chromium (deux pages de 1 123 px, police de secours) — **pas imprimé sur papier**, et
pas avec les polices du domaine. ② Le relevé mensuel de toute l'équipe (roue crantée) n'a pas changé.

---

## 139. ★★ FICHE-3 — UN NOMBRE D'HEURES PAR TAUX, ET CE QU'IL RESTE À PAYER (17/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.28 → **7.29** · SW 7.92 → **7.93**)

> Nico : *« dans le cadre pour la paie il faut préciser le nombre d'heures à 25 %, à 50 %, de dimanche et de
> jour férié si le salarié demande à être payé […] le décompte des heures sup restantes à payer visible dans le
> compteur, trouve un moyen pour que ça soit lisible, cohérent »*, puis « oui » sur la maquette v4.

### 139a. Ce qui change

- **Demande de paiement cochée** : « À payer en plus » donne toujours **quatre lignes** — heures sup à +25 %,
  à +50 %, heures du dimanche, heures de jour férié (taux du domaine) —, même à zéro, en gris. Les heures
  payées **sur le compteur** (`payesBank`) rejoignent la ligne de leur taux : la compta lit un nombre par taux.
- **Onglet Compteur** : la carte **Heures sup restantes à payer** — le total, son équivalent en récup, le
  décompte (reportées + faites + majorations en récup − payées − prises en récup = restantes) et le détail
  par taux. La carte de paiement l'annonce, le cadre la note pour information, le relevé la reprend page 2.

### 139b. Le choix qui rend ça cohérent

★ **Les restantes ne sont pas un second compteur** : `_pfRestants` relit `_planCompteur(mbr,m).tr`, tranche par
tranche, et rend chaque valeur en heures brutes (valeur ÷ (1 + taux)). Donc **les heures de récup restantes et
les heures restantes à payer sont les mêmes heures**, comptées deux fois — c'est ce que la carte dit, et ce que
Q4 vérifie (valeur des restantes = solde du compteur). « Prises en récup » est le terme qui ferme l'égalité :
il n'a pas de calcul propre, il ne peut pas diverger. `_pfCat` range les natures (hs 25, hs 50, dimanche,
férié, et « taux normal » pour le report, les mois d'avant septembre 2026 et la majoration seule).

### 139c. Ce que les filets ont trouvé

- Section **Q** de `mv-harnais-recup` (11 assertions), dont un report de septembre sur octobre avec 2 h puisées
  au compteur. ⚠️ Première écriture de Q10 : `paye: 5` en octobre — le moteur borne l'acompte aux heures du
  mois, et le harnais mesurait une saisie que l'écran n'écrit jamais. La case écrit `paye: 3, paye_bank: 3`.
  Trois défauts neufs (taux oublié dans les restantes, paiements sur compteur hors de leur ligne, taux à zéro
  tus). **223 assertions, 21 défauts, 21 détectés.**
- ⚠️ **Poids** : `planning.js` 487 → 512 ko sur FICHE-2 + FICHE-3. Cliquet regravé, même raison qu'en §135e.

### 139d. La note de livraison

**Base `0df4750`** (FICHE-1 + FICHE-2 poussés). **APP 7.28 → 7.29 · SW 7.92 → 7.93.**
`firebase deploy --only hosting`. `public/guide.html` : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_pfCat`, `_pfRestants`, `_pfRestantsCarte`, quatre lignes à payer, relevé | — |
| `src/styles.css` | zéros en gris, carte des restantes | ★ SW |
| `src/utils.js` | APP 7.29, nouveauté, aide | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | paiement : un nombre par taux, les restantes | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | section Q · cliquet · §139 · base | — |

---

## 140. ★★ FICHE-4 — PAYER AU-DELÀ DU MOIS (17/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.29 → **7.30** · SW 7.93 → **7.94**)

> Nico : *« si j'ai 50 heures sup encore à rattraper, il faut que je puisse inscrire ces 50 heures sup sur le
> mois en cours. Là, je suis bloqué au nombre d'heures sup qu'il y a sur le mois en cours »*.

### 140a. Ce qui bloquait vraiment — mesuré avant de corriger

**Le moteur savait déjà payer au-delà du mois** (`paye_bank`, RECUP-2) : mesuré avec 50 h de report, 30 h
demandées donnaient bien 18 h du mois + 12 h du compteur. **C'est l'écran qui bornait** : « h sur 18h »,
« Tout le mois » comme plus grand raccourci, et `_planPayeMaxCouvert` qui cherchait jusqu'aux heures du mois
seulement. Au-delà du disponible, la saisie était réduite **sans rien dire**.

### 140b. Ce qui change

- `_planPayeEcrire` : **une seule écriture** d'un paiement (les heures du mois d'abord, le surplus pris au
  compteur à sa valeur), servie à la case ET aux essais. `_planPayeEssais` pose, mesure et remet en place.
- `_planPayeMaxTotal` : les heures du mois + les heures brutes que le compteur garde **une fois la récup et les
  absences du mois servies** (elles passent avant un paiement dans `_planCompteur`). La carte dit « h sur » ce
  total, et propose **Tout le compteur** quand il dépasse le mois. Au-delà, un message dit ce qui est payable.
- ⚠️ **Un report d'avant septembre 2026 n'a pas de taux connu** (report de départ, mois de l'ancienne règle,
  majoration seule). FICHE-3 l'écrivait « au taux normal » : c'était inventer. Il s'écrit désormais
  **« Heures reportées, taux à vérifier »** — la compta le fixe.

### 140c. Les filets

Section **R** de `mv-harnais-recup` (9 assertions : sans report 18 h / 12 h inchangés ; 50 h de report → 59 h
payables, toutes sans découvrir la récup ; 30 h demandées = 18 + 12, cadre et restantes justes ; 80 h demandées
→ 59 h possibles, 21 h introuvables), deux défauts neufs. **232 assertions, 23 défauts, 23 détectés.**

### 140d. La note de livraison

**Base `2a37d69`** (FICHE-3 poussé). **APP 7.29 → 7.30 · SW 7.93 → 7.94.** `firebase deploy --only hosting`.
`public/guide.html` : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_planPayeEcrire`, `_planPayeEssais`, `_planPayeMaxTotal`, carte de paiement, libellé du report | — |
| `src/utils.js` | APP 7.30, nouveauté, aide | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | payer au-delà du mois | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | section R · §140 · base | — |

---

## 141. ★ FICHE-5 — LE DÉTAIL MOIS PAR MOIS SE LIT EN HEURES SUP (17/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · APP 7.30 → **7.31** · SW 7.94 → **7.95**)

> Nico : *« dans le détail mois par mois il faut revoir heure sup ; acquise ; utilisée ; solde. il faut
> qu'apparaisse heure sup du mois ; payées ; récupérées ; solde restant »*.

- **Les colonnes** (onglet Compteur et relevé) : heures sup du mois, payées, récupérées, solde restant.
- ★ **Une seule unité, l'heure sup brute** — celle de la paie et de « Heures sup restantes à payer ». L'ancien
  tableau mêlait des heures (heures sup) et du temps de récup (acquise, utilisée, solde) : aucune ligne ne se
  vérifiait à la main. Désormais chaque ligne fait **solde d'avant + heures sup (+ majoration seule) − payées −
  récupérées = solde restant**, et le solde du mois en cours EST le total des restantes à payer (S3).
- `_planCompteur` retient `soldeBrut` (chaque tranche rendue à son taux). « Récupérées » ferme l'égalité, sans
  second calcul : 2 h de récup sur des heures à 25 % = **1 h 36 récupérées**. Une note le dit sous le tableau,
  avec l'équivalent en temps de récup du solde du mois.
- Filets : section **S** (5 assertions, dont l'égalité sur douze mois avec report de 50 h, paiement sur le
  compteur et un mois suivant), L24 réécrite, un défaut neuf (le solde restant garde la majoration de la récup).
  **237 assertions, 24 défauts, 24 détectés.**
- **Base `4f7ccc8`** (FICHE-4 poussé). **APP 7.30 → 7.31 · SW 7.94 → 7.95.** Fichiers : `src/planning.js`,
  `src/utils.js`, `index.html`, `public/sw.js`, `guide/10-planning.html`, `scripts/mv-harnais-recup.mjs`,
  `scripts/harnais-claude-md.mjs`, `CLAUDE.md`, `.mv-base`. `public/guide.html` : `node scripts/build-guide.mjs`.

---

## 142. ★★★ SEM-1 — LES HEURES SUP SE COMPTENT À LA SEMAINE, ET LE 50 % NE PASSE PLUS DEVANT LE 25 % (17/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/` · `package.json` · `ci.yml` · APP 7.31 → **7.32** · SW 7.95 → **7.96**)

> Nico, trois relevés de septembre 2026 en main (Chloé, Nico, Victor, édités le 17/09) : *« Beaucoup d'erreur. vérifie
> tout, vérifie la loi, propose une maquette »*. Puis sur la v1 : *« les heures écourtées par le domaine restent à
> rattraper (soit dans un compte heures à rattraper soit rattrapées dans les heures sup) ; il faut que les heures sup se
> comptent à la semaine »*. Sur la v2 : *« il est bizarre de voir un nombre d'heures sup à +25 % inférieur à un nombre
> d'heures sup à +50 % »*. Puis « go » sur la v3.

### 142a. L'audit, mesuré avant la maquette

- Les trois relevés ont été **recalculés à partir des jours** par un moteur écrit pour la maquette : 67 égalités, **aucun
  écart** — les additions étaient justes. Les erreurs étaient ailleurs, neuf de calcul ou de données :
  ① les jours à venir comptés « faits » (`_planPaieMois` : `if(!e) x.fait = wh`, sans regarder la date) ; ② le même
  horaire valant deux durées (`_planDayH` sans saisie rendait les heures de l'horaire PAR DÉFAUT — codes D/M/A, 09:00 et
  16:30 en dur — au lieu du modèle : +0h30 le 18, −0h30 le 25, sans aucune saisie, et ces demi-heures entraient dans le
  travail effectif de l'année) ; ③ « Temps de récup » sans solde d'avant ni journées du domaine ; ④ deux unités par ligne
  (3h30 = 2h + 2h15) ; ⑤ « arrêt ou congé sans solde » pour une absence non précisée ; ⑥ 10h30 payées et 5h15 à
  compenser le même mois (`_planPayeMaxCouvert` ignore `dette`) ; ⑦ « 4h à 50 % » avec 36h30 visibles (le lundi 31 août
  hors du papier) ; ⑧ les taux d'une semaine à cheval pouvaient bouger APRÈS la signature (le 50 % se rangeait sur des
  jours du mois suivant) ; ⑨ octobre à décembre portaient déjà un solde.
- **La loi, lue** (accord national du 23/12/1981, version consolidée avenants 12–16 — l'avenant 19 reste à relire) :
  art. 7.1/7.3 heures sup au-delà de la durée normale, **huit premières à 25 %, suivantes à 50 %** ; art. 10.2 repos de
  remplacement 1h15/1h30, droit ouvert à 7h, à prendre dans les deux mois, **mention obligatoire** ; art. 10.4 §3 absence
  non maintenue = retenue à 1/151,67e par rapport à l'horaire programmé ; art. 8.2 10h/jour (50h de dépassement/an),
  art. 5.3 repos hebdomadaire suspendu six fois/an au plus. Code rural R. 713-36 : copie remise avec la paie, **la
  signature ne vaut pas renonciation**, et les absences « en précisant si elles ont été ou non rémunérées ». Code du
  travail D. 3171-12 : cumul annuel des heures sup. Cass. soc. 10/09/2025 n° 23-14.455 : un congé payé compte dans le
  seuil hebdomadaire — **déjà conforme** (`_planDayH`).

### 142b. Ce qui change dans le moteur

- **`_planHsupMois` compte à la semaine** (lundi → dimanche). ① Les heures en plus rattrapent d'abord les heures
  manquées de la MÊME semaine, dans l'ordre des jours ; ce qui reste en plus = ce qui est compté au-delà du **planning
  de la semaine** (pas 35h fixes : sinon chaque semaine haute de l'annualisation deviendrait des heures sup) ; congé
  payé, récup, arrêt, formation, absence non précisée restent neutres. ② Ce qui reste manqué garde sa destination
  (`retire` / `domaine` / `indet`) et part au compteur comme avant — **« à compenser » EST le compte des heures à
  rattraper** : dans la semaine, puis sur les heures sup du compteur au taux normal, sinon en attente, et les prochaines
  heures sup le comblent d'abord (`comble`, inchangé).
- **`PLAN_HS_RANG50=8` remplace `PLAN_HS_SEUIL50=43`** : les huit premières heures sup de la semaine à 25 %, les suivantes
  à 50 % — donc les DERNIÈRES. RECUP-1 disait « la 44e heure travaillée » : juste sur 35h, faux dès que le planning
  dépasse 35h (planning 40h, 47h faites, 7h sup dont quatre déjà à 50 %). ⚠️ Moins généreux qu'avant sur une semaine
  haute : cohérent si l'annualisation est en place — **à faire confirmer par le comptable**, avec le reste du régime.
- **`_planSemainesDuMois(m)` : une semaine appartient au mois où elle finit.** Celle du 28 septembre se compte en octobre,
  d'un bloc, avec ses jours de septembre (`sem.avantMois`). Le majoration d'un férié suit sa semaine (`majDe`).
- **Transition, une seule fois** : le lundi 31 août 2026 a déjà été réglé par août (règle historique). Ses heures
  manquées ne se rattrapent pas en septembre ; ses heures en plus tiennent les premiers rangs de la semaine, puis ce
  qu'août a compté sort de septembre (`deja`, `dejaRetire`).
- **Un dimanche qui rattrape** n'est pas une heure sup : il ne garde que sa majoration (`majHs`, par `jm.h − y.hs`).
- **`_planDayH`** : un jour SANS saisie vaut les heures du MODÈLE à partir de septembre 2026 (`_planRecupActiveAt`) ;
  `_pfPrevT` recale la fin de l'horaire prévu (`_planFinDe`). Les mois d'avant ne bougent pas.
- ★ **Contrat de sortie inchangé** (`plus`, `h25`, `h50`, `retire`, `domaine`, `indet`, `semaines`, `buckets`,
  `majHs`) : `plus`/`moins` d'un jour sont ce qui RESTE après la semaine, le brut est dans `plusBrut`/`moinsBrut`, ce
  que la semaine a rattrapé dans `rattrape`. C'est ce qui a tenu `_planCompteur`, `_planBank` et l'année sans y toucher.

### 142c. Ceux qui lisent le moteur

`_planPaieMois` : `x.ratt` (rattrapé dans la semaine : ni retenu, ni repris sur la récup — `payeType 'sem'`) et `x.att`
(le jour appartient à une semaine qui finit le mois suivant : il attend, `'att'`) ; `P.sem`, `P.att`. `_pfMouvements` ne
liste que la part vraiment reprise sur la récup. Le bas du cadre dit « Heures sup, comptées à la semaine » quand l'écart
du mois n'est plus les heures sup. « Le détail » de l'onglet Compteur dit ce que la semaine a rattrapé et liste les jours
du mois d'avant qu'elle emporte. `_planVerdict` : « Rattrapé par les heures en plus de la semaine » au lieu de « Retiré au
taux normal » quand c'est le cas.

### 142d. Ce que les filets ont trouvé

- `mv-harnais-recup` : **3 rouges sur 237 au premier passage, les trois attendus** (section I, la semaine à cheval) — les
  sections B à S posent heures en plus et heures manquées dans des semaines différentes, sur 35h : l'ancienne et la
  nouvelle règle y disent la même chose. Section I réécrite, section **T** (25 assertions), 2 contre-épreuves recalées, 7
  neuves. **262 assertions, 31 défauts, 31 détectés.** ★ T2 rouge à l'écriture : c'était le TEST (08:00→13:00 fait 5h
  sans coupure, donc 2h écourtées, pas 3).
- **`mv-harnais-semaine` (neuf)** : les jours des trois relevés reposés dans le VRAI moteur rendent la maquette v3 —
  Chloé 21h (11h30/4h/5h30), Nico 10h30 (**5h à 25 %, rien à 50 %**), Victor 3h, 7h d'absence rattrapées, majoration
  seule du dimanche. ★ Premier passage : 49h de trop au compteur — les fériés du jeu de test portaient 7h « faites »
  majorées à 100 % (le piège de §135e, retombé dedans) ; c'était le jeu de données.
- `mv-harnais-retard` ET `mv-harnais-effectif-periode` extraient `_planDayH` : `_planRecupActiveAt` et `PLAN_RECUP_DEBUT`
  (lue dans le module, jamais recopiée) ajoutées. ★ Le second n'est sorti qu'à `npm run check` — « _planRecupActiveAt is
  not defined », un PLANTAGE compté rouge : chercher tous les harnais qui extraient la fonction qu'on touche, pas
  seulement celui du lot (`grep -l _planDayH scripts/`).
- `mv-harnais-icones` : `horloge` n'existe pas dans le sprite — la nouveauté prend `reveil`. `npm run check` vert au
  bout, `npm run build` vert ; **`test:smoke` non lancé** (le Chromium de Playwright-node n'est pas installé dans le bac
  à sable).
- ⚠️ **Faute de procédure, dite** : ma ligne d'écriture de `.mv-base` a vidé le fichier avant de le lire ; les autres
  fichiers du même script étaient écrits. Vérifié fichier par fichier, `.mv-base` réécrit. La leçon de l'état partiel
  (mémoire du projet) vaut aussi pour un script de textes.

### 142e. La note de livraison

**Base `270320f`.** **APP 7.31 → 7.32 · SW 7.95 → 7.96.** `firebase deploy --only hosting`. `public/guide.html` ne se
livre pas : `node scripts/build-guide.mjs`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_planHsupMois` à la semaine, `PLAN_HS_RANG50`, `_planSemainesDuMois`, `_planRecupActiveAt`, `_planDayH`, `_planFinDe`/`_pfPrevT`, `_planPaieMois`, `_pfMouvements`, cadre, détail, verdict, « À savoir » | — |
| `src/utils.js` | APP 7.32, 3 nouveautés, aide du Planning | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | heures sup à la semaine, taux au rang | — |
| `scripts/mv-harnais-recup.mjs` · `mv-harnais-retard.mjs` · `mv-harnais-effectif-periode.mjs` · `mv-harnais-semaine.mjs` (neuf) | sections I et T · une dépendance chacun · les trois relevés | — |
| `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | harnais branché · §142 · base | — |

### 142f. Ouvert, et dit

① **SEM-2, le relevé v3** : absences par cause, compte des heures à rattraper imprimé, relevé PROVISOIRE (jours à venir
non faits, pas de signature), lundi du mois d'avant en gris, mentions légales (droit à repos, R. 713-36, cumul annuel),
alertes 10h/jour et repos hebdomadaire, en-tête, congés sans négatif, plafond arrondi. **Rien de cela n'est dans SEM-1** :
le relevé actuel imprime les nouveaux chiffres dans l'ancienne mise en page, et sa colonne « Écart » reste au jour.
② Une semaine EN COURS est comptée telle qu'elle est saisie (les jours à venir valent leur planning, donc neutres) — la
maquette ne la soldait pas ; écart assumé pour que le verdict de la feuille du jour et le compteur vivent. ③ À trancher
par Nico (onglet Audit de la maquette v3) : absence injustifiée sur la récup d'office ou case signée ; heures à rattraper
prises d'office sur la récup acquise ou non ; paiement quand il reste des heures à rattraper ; report du compte au
31 décembre (l'accord laisse la rémunération acquise en fin de période — comptable). ④ `_planTimingH` lit la coupure avec
`||` : une coupure à 0 redevient 60 min (`_planFinDe` et `_computeEnd` la lisent bien) — non touché, l'effet serait
rétroactif. ⑤ Contingent annuel (220h ; Nico : 210h payées fin septembre) : pas de compteur. ⑥ Rendu non vu sur
téléphone réel ni sur papier.

---

## 143. ★★★ SEM-2 — LE RELEVÉ D'HEURES v3 : PROVISOIRE, ABSENCES PAR CAUSE, COMPTEURS QUI TOMBENT JUSTE (18/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · APP 7.32 → **7.33** · SW 7.96 → **7.97**)

> Nico : « Suite ». Second volet de la maquette v3 (« go » du 17/09) : SEM-1 avait changé le MOTEUR, le papier
> imprimait encore les nouveaux chiffres dans l'ancienne mise en page. ⚠️ `origin/main` était toujours `270320f` :
> SEM-1 n'avait pas été poussé. **Ce lot contient SEM-1 et le remplace** ; sa base reste `270320f`.

### 143a. Ce qui change sur le papier

- **Provisoire en cours de mois.** `_planPaieMois` pose `x.futur` sur un jour SANS saisie et pas encore passé
  (`_pfIsoJour` ≥ `_pfAujIso`), et totalise À PART (`P.futurFait`, `P.futurPrevu`, `P.provisoire`) : **`P.faites` ne
  bouge pas**, l'écran et les harnais lisent comme avant. Le relevé, lui, imprime « Prévues à ce jour / Faites » sans les
  jours à venir, un bandeau « Relevé provisoire, arrêté au … », une semaine entièrement à venir sur UNE ligne, et des
  cases de signature hachurées : il ne se signe pas.
- **Une absence dit sa cause et ce qu'elle devient.** Colonne « Absence » (classe `cab`) : payée · rattrapée dans la
  semaine · reprise sur la récup · rattrapée sur heures sup · à rattraper · non payée · comptée le mois prochain · à
  préciser. Par jour : `x.brutMoins`, `x.surRecup`, `x.surHs`, `x.aRatt` (la part que le compteur a couverte se répartit
  dans l'ordre des dates, comme `rc` depuis FICHE-1). ★ Une absence injustifiée **ne s'appelle plus « Récup »** sous
  « Maintenu » ; la reprise sur la récup se COCHE à la signature (« J'accepte que mon absence du 16… ») — l'écart avec
  l'accord (art. 10.4 §3 : retenue) est ainsi porté par l'accord du salarié. Une absence **sans motif** passe « à
  préciser », en orange, avec « à préciser avant l'envoi à la compta » : le document mensuel doit dire si chaque absence
  est rémunérée ou non (Code rural, R. 713-36 et s.).
- **La semaine se lit en entier.** `_pfJoursAvant` rend les jours du mois d'avant que la première semaine emporte (le
  lundi 31 août), en gris, avec « 2h sup déjà comptées en août » ou « déjà réglé par son mois ». La ligne de semaine dit
  prévu, fait, heures sup et taux, ce que la semaine a rattrapé, ce qui reste ; la dernière, à cheval : « elle finit en
  octobre, elle se compte sur le relevé d'octobre ». Colonne **« Heures sup »** (`x.hs`) au lieu de l'écart du jour ;
  un week-end de repos tient sur une ligne ; `sem.trav` (neuf, moteur) dit les sept jours travaillés.
- **Page 2, une unité par colonne.** Heures sup : Faites · Payées · Gardées · **Repos gagné** (avant : 3h30 = 2h + 2h15).
  **Le compteur part du solde d'avant** et liste tout — heures gardées, majoration seule, absences reprises, heures
  écourtées rattrapées, récup prise, payées sur le compteur — jusqu'au solde. **« Les heures à rattraper »** : reste
  d'avant + écourtées − dans la semaine − sur le compteur − par les heures sup du mois = reste (`c.dette`). Année : total
  « Depuis le 1er janvier » (D. 3171-12), colonne « en repos », **mois à venir vides** (ils répétaient le solde).
- **Mentions et alertes** : droit à repos ouvert dès 7h et délai de deux mois (accord, art. 10.2) ; « sa signature ne vaut
  pas renonciation à ses droits » (R. 713-36) ; bloc « Durées et repos » — plus de `maxJour` dans la journée, semaine
  au-delà de `maxHebdo`, sept jours travaillés, journées de plus de 6h sans coupure ; alerte contingent
  (`PLAN_CONTINGENT_DEF=220`, « à confirmer avec le comptable ») à partir de 200h payées.
- **Petites choses** : `_pfPlanNom` (« planning-35h-(administration) » → « 35h (administration) ») ; contrat sur une
  ligne ; congés sans reste négatif quand le solde de départ n'est pas saisi (`_plRvCpHtml`) ; plafond annuel arrondi à
  l'heure, reste à la demi-heure (`_plRvAnnuHtml`) ; la note du jour entre guillemets ; « d'octobre », pas « de octobre ».

### 143b. Vérifié, pas supposé

- **Le vrai relevé, rendu dans Chromium** (`/home/claude/lot/rendre*.mjs`, jours des trois PDF de départ, polices du
  dépôt) : Chloé, Nico, Victor × édité le 16/09 et le 1er/10 — **page 1 et page 2 tiennent sur un A4 dans les six cas**.
  ★ Premier rendu sans les polices (`/fonts/` ne résout pas en `file://`) : DejaVu, plus large, faisait déborder la page 1
  de Victor de 96 px — c'était le banc, pas le code ; remesuré avec Outfit. Victor débordait ENCORE de 57 px en page 2 :
  « Heures sup restantes à payer » est passé dans la colonne de droite.
- `mv-harnais-recup` : section **O recalée** sur la nouvelle structure (horloge RÉGLABLE — `horloge(2026, 9, 1)` — car le
  relevé n'imprime plus la même chose le 16/09 et le 1er/10), section **U** (24 assertions), 1 contre-épreuve recalée, 5
  neuves. **286 assertions, 36 défauts, 36 détectés.** ★ U1d rouge à l'écriture : `moisFiche` porte des saisies jusqu'au
  24, aucune de ses semaines n'est entièrement à venir — le TEST. `mv-harnais-releve` : 1 rouge, le titre « Détail mois
  par mois » que j'avais renommé — titre gardé. `mv-harnais-icones` : `attention` n'existe pas → `alerte` (deuxième fois
  en deux lots : ★ vérifier l'icône d'une nouveauté dans le sprite AVANT d'écrire l'entrée).
- `mv-harnais-jetons` : `font-weight:400` écrit en chiffres compte « hors des trois pas » (500/600/700) → `normal`.
- **`mv-harnais-typo` : `planning.js` 512 → 546 ko, +6,6 % depuis la base** (SEM-1 + SEM-2 cumulés) — au-dessus du cliquet
  de 5 % par lot. **Regravé** (`scripts/typo-baseline.json` : `planning.js` 546, `utils.js` 583, rien d'autre ne bouge),
  après s'être posé la question : le relevé (`_planReleveFiche_`, son CSS, `_pf*`) ferait un module à lui, `planning`
  reste à 53 % du plafond de 1 024 ko. **Découpage non fait dans ce lot** — il touche l'ordre d'import et les noms
  exposés ; à décider avant que le fichier ne regagne 5 %.

### 143c. La note de livraison

**Base `270320f`. Ce zip CONTIENT SEM-1 et le remplace.** **APP 7.31 → 7.33 · SW 7.95 → 7.97** (règle du doute : le zip
SEM-1 a pu être déployé sans être poussé). `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | SEM-1 | SEM-2 |
|---|---|---|
| `src/planning.js` | moteur à la semaine, taux au rang, jour sans saisie | relevé v3, `_planPaieMois` (futur, parts couvertes), `_pfJoursAvant`, `_pfPlanNom`, congés, plafond |
| `src/utils.js` · `index.html` · `public/sw.js` | 7.32 / 7.96 | **7.33 / 7.97**, 3 nouveautés |
| `guide/10-planning.html` | heures sup à la semaine | le relevé en deux pages, provisoire, à préciser |
| `scripts/mv-harnais-recup.mjs` | sections I, T | section O recalée, section U, horloge réglable |
| `scripts/mv-harnais-retard.mjs` · `mv-harnais-effectif-periode.mjs` · `mv-harnais-semaine.mjs` | une dépendance · neuf | — |
| `package.json` · `ci.yml` · `harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` · `scripts/typo-baseline.json` | §142 | §143 · cliquet de poids regravé |

### 143d. Ouvert, et dit

① **L'ÉCRAN de la fiche n'a pas bougé** : son cadre « Pour la paie » dit encore « Absences payées » et compte les jours à
venir comme faits ; ses onglets Jours et Compteur lisent le nouveau moteur mais pas la nouvelle présentation. Le papier
et l'écran ne disent donc plus tout à fait la même chose — lot suivant (SEM-3), maquette d'abord. ② Les décisions de
l'onglet Audit restent à prendre : reprise d'office sur la récup ou case signée (le papier propose la case, le MOTEUR
reprend toujours d'office) ; heures à rattraper prises d'office sur la récup acquise ; paiement quand il reste des heures
à rattraper (`_planPayeMaxCouvert` ignore toujours `dette`) ; report du compte au 31 décembre. ③ Le compteur annuel
« Modulation » compte encore des heures déjà payées en heures sup. ④ Pas de décompte des suspensions du repos
hebdomadaire sur l'année (six au plus). ⑤ `_planTimingH` et la coupure à 0 (§142f ④). ⑥ Rendu vu dans Chromium, pas sur
papier ni sur téléphone réel ; `test:smoke` non lancé (Playwright-node absent du bac à sable).

---

## 144. ★★★ SEM-3 — L'ÉCRAN DE LA FICHE LIT LA MÊME SOURCE QUE LE RELEVÉ v3 (18/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · APP 7.33 → **7.34** · SW 7.97 → **7.98**)

> Nico : « Suite » → maquette `maquette-fiche-ecran-v1.html` (l'écran d'un téléphone, trois onglets, trois salariés, bâti
> avec le VRAI bloc `.pf-*` extrait de `styles.css`) ; deux questions ; réponse : **« 2 - toujours »** — la carte
> « Heures à rattraper » s'affiche toujours, même à zéro. La question 1 (jours à venir à part dans le cadre) était
> proposée, elle est prise telle quelle. ⚠️ `origin/main` = `270320f` : SEM-1 et SEM-2 ne sont pas poussés, ce lot
> les CONTIENT.

### 144a. Une seule source, deux rendus

SEM-2 avait écrit le cadre v3 DANS `_planReleveFiche_` : le papier disait « Absences, par cause », l'écran disait encore
« Absences payées — Maintenu ». Le principe du projet (relevé et écran, une seule source) était rompu par mon propre lot.
- **`_pfV3(mbr,P,D,A)`** : les absences par cause (`AB`), les étiquettes, le verdict (`{ko,t}`), les lignes « à payer en
  plus / à retirer / pour information », le bas de cadre semaine par semaine, prévues et faites « à ce jour ». Le bloc
  est SORTI du relevé tel quel (coupé-collé par index, pas réécrit) ; le relevé et `_pfCadre` le lisent, chacun avec son
  balisage (`.ab` / `.pf-ab`, `<p class="ko">` / `pf-ko` + icône).
- **`_pfComptesV3(mbr,P,M,V)`** : les deux colonnes qui tombent juste — compteur de récup (`MV`) et heures à rattraper
  (`RA`). Le relevé et `_pfCompteur` les lisent.
- ★ Le filet : les sections O et U du harnais (papier) sont restées vertes pendant tout le déplacement — 1 rouge attendu
  (N22, le cadre de l'écran), puis 2 (S5, l'en-tête du tableau de l'année).

### 144b. Ce qui change à l'écran (à partir de septembre 2026 ; avant : l'écran d'avant, à l'identique — V12)

- **Résumé** : bandeau `pf-prov` « Mois en cours, arrêté au … » et « Prévues à ce jour » tant que le mois court ;
  troisième chiffre « Absences », étiquettes `pf-ab` par cause ; une absence sans motif en orange, « à préciser avant
  l'envoi à la compta » ; « Où vont les heures sup » : Faites · Payées · Gardées · Repos gagné (`pf-cv`).
- **Jours** : titre « Semaine du 31 août au 6 septembre », jours du mois d'avant en `pf-jr pf-hors` (un `div`, pas un
  bouton : on n'ouvre pas la feuille d'un autre mois d'ici) ; étiquettes : heures sup de la semaine et ce qu'août a déjà
  compté, ce que les heures en plus ont rattrapé, ce qui reste (rouge), sept jours travaillés, plus de `maxJour` dans la
  journée, semaine en cours, semaine qui finit le mois suivant ; colonne « Heures sup » (`x.hs`) ; chaque absence dit ce
  qu'elle devient, avec les mots du relevé ; jours à venir `pf-fut`, semaine entièrement à venir repliée sur son en-tête.
  ★ **La note du bas disait « 25 % jusqu'à la 43e heure, 50 % au-delà » depuis SEM-1** — le moteur compte au rang
  depuis deux lots. `grep 43e` ne voit pas `43<sup>e</sup>` : ★ chercher un nombre par le NOMBRE (`grep -n "43"` filtré),
  pas par sa forme typographique. V5 l'épingle (`indexOf('43') === -1`).
- **Compteur** : la phrase « 20h reportées + 2h15 acquises − 22h retirées… » et la carte « Ce qui a bougé » deviennent UNE
  liste, du solde d'avant au solde d'après (`pf-mv` + `li.pf-tot`) ; **carte « Heures à rattraper » toujours affichée** ;
  rappel du droit à repos dès 7h ; année : Faites · Payées · Récupérées · Solde · en repos, ligne « Depuis janvier »,
  mois à venir vides (`pf-vide`) ; alerte contingent. ⚠️ « toujours » vaut aussi pour le PAPIER : le bloc s'imprime
  même à zéro (`if(P.act)`), V7b.

### 144c. Vérifié

- **Le vrai code, rendu** (`/home/claude/lot/rendre-ecran.mjs`) : les trois onglets de Victor avec `src/styles.css`, à
  390 px dans Chromium — aucun débordement horizontal, même allure que la maquette. Icônes absentes du banc (le sprite
  vit dans `index.html`), donc non vues.
- Les six relevés papier remesurés avec le bloc « Heures à rattraper » désormais permanent : **deux pages A4 dans les
  six cas**, mêmes marges qu'en §143b.
- ★ `mv-harnais-jetons`, deux cliquets qui se répondent : `border-radius:var(--r-md,12px)` est compté « rayon en dur qui
  double un pas » (le repli `12px` est lu), et `var(--r-md)` sans repli est « un appel du socle sans repli ». Le bloc
  `.pf-` écrit ses rayons à la main hors des pas (5, 11, 13 px) : `.pf-prov` 11px, `.pf-ab` 6px, comme ses voisins.
- `npm run check` vert, `npx vite build` vert (30 s). ⚠️ `npm run build` relance tout le `check` en prebuild : il dépasse
  la limite de temps du bac à sable, pas celle de la machine de Nico.
- `mv-harnais-recup` : N22 et S5 recalés, section **V** (24 assertions : l'écran ET le papier disent le même bas de
  cadre, la carte toujours là, août inchangé), 2 contre-épreuves recalées, 3 neuves. **310 assertions, 39 défauts, 39
  détectés.** Icônes des nouveautés vérifiées dans le sprite PAR LE SCRIPT avant écriture (leçon de §143b appliquée).

### 144d. La note de livraison

**Base `270320f`. Ce zip CONTIENT SEM-1 et SEM-2 et les remplace.** **APP 7.31 → 7.34 · SW 7.95 → 7.98.**
`node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

Fichiers de SEM-3 : `src/planning.js` (`_pfV3`, `_pfComptesV3`, `_pfCadre`, `_pfOuVont`, `_pfJours`, `_pfCompteur`, relevé
branché dessus) · `src/styles.css` (12 règles `.pf-`) · `src/utils.js` · `index.html` · `public/sw.js` ·
`guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` —
plus ceux de §142e et §143c.

### 144e. Ouvert, et dit

① Les décisions de l'Audit (maquette v3) restent à prendre — le moteur reprend TOUJOURS d'office une absence du salarié
sur la récup, alors que le papier propose une case à signer ; `_planPayeMaxCouvert` ignore toujours `dette`. ② La carte
« La demande du salarié » ne prévient pas quand un paiement laisse des heures à rattraper. ③ L'en-tête de semaine de
l'onglet Jours additionne « faites + absences » brutes : une semaine où le week-end rattrape une absence affiche
« 15h30 + 30h30 sur 39h » — vrai, mais la somme dépasse le prévu ; à reprendre si ça gêne. ④ Découpage de `planning.js`
(§143b) : le fichier a encore grossi. ⑤ Vu dans Chromium, pas sur téléphone réel ; `test:smoke` et `test:e2e` non lancés
(Playwright-node absent du bac à sable) — ★ l'e2e ouvre la fiche : à lancer chez Nico avant de déployer.

## 145. ★★★ BOOT-1 + REPRISE-1 — LE DÉMARRAGE NE RESTE JAMAIS MUET, ET LE RETOUR DE VEILLE VÉRIFIE QUE LE SERVEUR RÉPOND (18/09 — `firebase.js` · `app.js` · `utils.js` · `index.html` · `sw.js` · `guide/01-demarrer.html` · `guide/14-depannage.html` · `scripts/` · `package.json` · `ci.yml` · APP 7.34 → **7.35** · SW 7.98 → **7.99**)

> Le contact technique du second domaine, sur iPhone : *« je rentre une donnée, je sors de l'application et verrouille
> mon téléphone ; si je redémarre l'application, elle freeze sur la page d'accueil sans faire apparaître la sélection du
> profil »*, puis *« lorsque j'enregistre une opération sur un ordi, elle n'est pas prise en compte sur mon téléphone »*.
> Nico : *« je pense qu'il parle de toutes opérations (pas seulement de cave) »* — cette phrase a déplacé le diagnostic
> (145b). Puis « Go » sur le lot 1 + 2 + 3 ; le 4 (fusion au lieu d'écraser) est un lot séparé (145h ①).

### 145a. Ce qui a été LU, pas supposé — dans le SDK, à la version du dépôt

Les paquets ont été téléchargés à la version exacte de `package-lock.json` et lus :
- **App Check 0.8.8** — `loadReCAPTCHAV3Script` pose `script.onload` **et rien d'autre**. Si le script de Google ne se
  charge pas (réseau qui se réveille au déverrouillage), la promesse d'initialisation ne se règle **jamais**, et
  `exchangeTokenPromise` est **partagée** : tout ce qui demande un jeton attend la même promesse morte — appels au
  serveur, connexion, flux Firestore. Seule une relance de la page guérit. `initializeAppCheck` insère le script **de
  façon synchrone** : son échec s'écoute juste après.
- **Functions 0.11.8** — le délai (`opts.timeout`) ne démarre **qu'après** l'obtention des jetons : c'est §52, qui
  n'avait été corrigé que pour `createMemberAccount`. `getLoginRoster` au démarrage restait nu.
- **Auth 1.7.9** — ses requêtes, elles, sont bornées à **30 s** (`NetworkTimeout` créé AVANT l'attente des en-têtes App
  Check) : la connexion ne gèle pas, elle échoue en `auth/network-request-failed`… et l'app répondait « Pas de
  connexion réseau » à quelqu'un qui en avait (ouvert depuis §68h).
- **Firestore 4.7.3** — ★★★ une erreur dans sa file de travail (`AsyncQueue`) la met hors service **pour le reste de la
  page** : tout appel suivant passe par `verifyNotFailed` → `fail()` → **« INTERNAL ASSERTION FAILED: Unexpected
  state »**. Lecture, écriture, écoute : tout échoue, jusqu'au rechargement. `getDocFromCache` passe par la même file :
  **il lève tout de suite** quand elle est morte — un test gratuit, sans réseau. `getDoc` hors ligne rend la **copie du
  téléphone** sans prévenir (`metadata.fromCache`). `disableNetwork`/`enableNetwork` relancent les flux.

### 145b. Ce qui a été lu dans l'app — deux symptômes, un seul moment

- **L'écran de connexion d'origine**, c'est le logo, « Ma Vigne », « Choisissez votre profil » et une zone de tuiles
  **vide** : exactement la « page d'accueil sans sélection du profil ». Les tuiles n'arrivent que quand `_fbLoad` va au
  bout ; **une** attente qui ne se règle pas, et l'écran reste ainsi pour toujours — ni tuile, ni sablier (le sablier
  n'apparaît que si `initLogin` est appelé). ⚠️ `boot.js` ne couvrait pas ce cas : `__MV_BOOTED` est posé **dès
  l'évaluation d'`app.js`**, bien avant `_fbLoad`.
- **Tout le démarrage attendait l'événement `load`** — profils, bouton « Se connecter », gestionnaires d'erreurs. Or
  `load` attend AUSSI le script reCAPTCHA inséré par App Check pendant l'évaluation du module.
- **Au retour de veille, rien ne vérifiait la connexion.** Seuls deux rechargements existaient : iOS après 30 min en
  arrière-plan, et le nouveau service worker après chaque mise en ligne (`controllerchange`) — tous deux **au moment
  précis du retour**, quand le réseau est le moins prêt.
- ★★★ **« Toutes opérations », pas seulement la Cave** (la correction de Nico) : le journal, le tracteur, le phyto, le
  planning sont en temps réel (`FB_REALTIME`). Si eux non plus n'arrivent pas, ce n'est pas `FB_STATIC` — c'est la
  **connexion du téléphone** qui n'a pas survécu, et que l'app ne voyait pas : `_pullKeys` ne lisait jamais
  `fromCache`, le badge disait « Synchronisé », le voyant restait vert (réseau présent + rien en attente), sa fenêtre
  disait « Tout est enregistré ».
- ★★★ **Le signal de la panne était masqué exprès.** Le gestionnaire global cachait « INTERNAL ASSERTION FAILED » avec ce
  commentaire : *« sans perte de données (le pull getDoc réussit) »*. **Le SDK dit le contraire** (145a). Et la trace
  qu'il tentait d'écrire (`fbAppendError`) partait… **par ce même Firestore mort** : elle ne pouvait pas arriver. Le
  journal du domaine ne pouvait donc RIEN montrer de ce défaut — l'absence de trace ne prouvait rien.

### 145c. Le lot

1. **`fbCallFn` borné en entier** (§52 généralisé) : course maison démarrée tout de suite, `opts.timeout` (défaut 70 s)
   **+ 10 s** de marge, rejet `mv/timeout`, minuteur toujours nettoyé.
2. **`_fbLoad` borné pas à pas** (`_mvBorne`, qui rend une valeur sentinelle `_MV_DEPASSE` au lieu de rejeter) : statut
   du domaine 5 s, liste des profils 8 s, lecture des membres 6 s, puis les profils **de l'appareil** (`loadData`). La
   liste qui arrive **après** la borne remplace celle de l'appareil (`_mvRosterTardif`) — **sauf si une tuile est
   touchée** (`_mvTuileTouchee` : `confirmLogin` lit `MEMBRES[loginPendingIdx]`, une liste remplacée sous les doigts
   changerait la personne). Un « absent » lu dans la copie du téléphone n'ouvre **plus** l'installation.
   **Filet final** (`_mvBootGarde`, 15 s) : `_fbLoad` pas au bout ET écran de connexion encore vide → profils de
   l'appareil. Il ne touche pas un écran déjà pris (installation, préparation, accueil public posent `B.fin`).
3. **Démarrage sans attendre `load`** : le corps du gestionnaire est devenu `_mvDemarrer`, lancé par `load` **ou** à 2,5 s,
   une seule fois.
4. **reCAPTCHA en échec** (`_mvAcEcouter`) : sur l'écran de connexion, personne n'a rien saisi → relance automatique
   (`_mvRechargerBorne`, **au plus une toutes les 2 min**, clé `mv_recharge_auto` en `sessionStorage` : jamais de
   boucle). Hors ligne, la relance attend `online`. Une fois entré, jamais sous les doigts.
5. **Connexion honnête** : `auth/network-request-failed` **avec du réseau** → « Le serveur ne répond pas. Relancez
   l'application » + bouton (`_loginErreur`). Même bouton sur « Compte inaccessible » et dans le sablier (4 essais).
   ★ §68h est fermé.
6. **Reprise au retour de veille** (`_mvReprise`, appelée par le bloc « iOS FROZEN STATE » d'`app.js`, APRÈS la relance
   des 30 min et pour toutes les plateformes) : absence ≥ 30 s, session réelle, en ligne → Firestore hors service ?
   (`_mvFsEtat`) → **sonde** du serveur (`getDocFromServer` sur `membres`, 8 s) → sinon **coupe et rouvre** le réseau de
   Firestore → resonde → OK : écoutes mortes réabonnées, relecture de `FB_STATIC` (la Cave, les réglages, les tâches :
   ce qui n'a pas d'écoute), écran repeint (`_mvRendrePageActive`, jamais si l'on tape), « Synchronisé ». Toujours KO :
   voyant « Pas de synchro », incident noté, rien relu.
7. **Firestore hors service** (`_mvFsMort`) : au retour de veille, **relance tout de suite** si aucune fenêtre de saisie
   n'est ouverte et aucun champ actif (`_mvRechargeSure`), bornée comme en 4 ; pendant le travail, jamais — le voyant le
   dit. Le gestionnaire de l'assertion **vérifie** désormais (`_mvFsVerifier`) au lieu de supposer ; une écoute qui lève
   sur une file morte ne boucle plus.
8. **Ce qu'on lit dit d'où ça vient** : `_pullKeys` compte `fromCache` → `_mvSrvPerdu` / `_mvSrvRetrouve` ; un
   « absent » servi par la copie devient `'error'`, jamais `'missing'` — ★ **faille dormante fermée** : `'missing'`
   autorisait `fbPushIfAbsent` à écrire les valeurs par défaut **sans relire**, donc par-dessus un document que le
   téléphone n'avait simplement pas en copie (domaine de référence seulement, seul à semer) ; `fbPushIfAbsent` refuse
   aussi sur sa propre relecture. Seul un instantané **confirmé par le serveur** (`!fromCache && !hasPendingWrites` —
   l'écho d'une écriture locale ne prouve rien) rétablit le voyant ; un instantané de la copie met à jour **sans**
   annoncer « Mis à jour ».
9. **Le voyant** : « Pas de synchro » en orange quand il y a du réseau mais pas de serveur ; sa fenêtre dit « Pas de
   connexion au serveur » et propose « Relancer l'application » (`.mbtn.verte`, `_mvRecharger`). Le badge ne dit plus
   « Synchronisé » ni « ✅ Synchronisé » dans ce cas (comparaison sur la fin du texte : **aucun emoji ajouté**, le
   cliquet des icônes l'a refusé à la première version).
10. ★★ **Le carnet d'incidents de l'appareil** (`_mvIncident`, `localStorage['mavigne_incidents_v1']`, 12 au plus) :
    `demarrage-bloque`, `profils-lents`, `membres-lents`, `load-tardif`, `appcheck-script`, `serveur-injoignable`,
    `firestore-hors-service`, `relance-auto`, `relance-manuelle`. Il part dans le journal du domaine (Admin GT, niveau
    `warning`, catégorie `sync`) à la **première connexion saine**, en **une seule** entrée — `fbAppendError` relit puis
    réécrit tout le journal : deux envois simultanés s'écraseraient. ★ **C'est la mesure qui manquait au diagnostic** :
    le lot ne se contente pas de parer, il dira combien de fois, et où, ça arrive.

### 145d. Arbitrages

- **Relancer seul, ou proposer ?** Seule une relance guérit une page dont App Check ou Firestore est mort. Relance
  **automatique** là où personne n'a rien saisi (écran de connexion ; retour de veille avec Firestore hors service et
  aucune saisie ouverte) ; **proposée** partout ailleurs. Une relance ramène à l'écran de connexion, comme aujourd'hui
  après 30 min — c'est le prix, et il est déjà payé tous les jours.
- **La Cave en temps réel** (proposée au premier diagnostic) **passe après** : la relecture au retour de veille couvre le
  cas signalé (on saisit sur l'ordinateur, on revient au téléphone). Deux écrans ouverts côte à côte restent l'angle mort
  (145h ②). ⚠️ Mettre `cave_elevage`/`cave_vendange` en écoute redessinerait la Cave à chaque écriture d'un autre
  appareil : à regarder contre la tournée du cuvier avant de le faire.
- **Écarté** : passer Firestore en cache mémoire ou en `persistentSingleTabManager` sur iOS. Le gestionnaire
  multi-onglets est un suspect sérieux (bail de primauté rafraîchi toutes les 4 s, minuteurs gelés en arrière-plan) —
  **mais rien ne le mesure encore**. Le carnet dira si `firestore-hors-service` et `serveur-injoignable` sont fréquents.
- **Les durées sont des choix, pas des mesures** : 5 / 8 / 6 / 15 s au démarrage, 2,5 s pour `load`, 30 s d'absence, 8 s
  de sonde, 5 s de relance du flux, 2 min entre deux relances automatiques. À resserrer ou élargir sur pièces.
- ★ **`firebase.js` passe de 117 à 137 ko (+17 %)** : le cliquet de taille de `mv-harnais-typo` a rougi, et il demande
  de se poser la question du découpage. **Posée, et écartée** : le bloc a besoin des internes du module — `db`, l'état
  des écoutes (`_fbDeadKeys`, `_fbSubscribe`), la relecture (`fbPullStatic`), `fbDocRef` — et un module à part devrait
  les exposer sur `window`, ce qui est pire que 20 ko de plus. Référence regravée (`scripts/typo-baseline.json`) ; le
  regravage enregistre aussi `planning.js` 546 → 558 ko, venu de SEM-3 et sous la tolérance.

### 145e. Vérifié

- `scripts/mv-harnais-reprise.mjs` (neuf) — les **vraies** fonctions extraites de `firebase.js` et `app.js`, sous une
  **horloge simulée** : une attente infinie se rejoue en une milliseconde, « l'écran n'est jamais vide après 20 s » se
  vérifie. Un essai qui ne se règle pas en 3 s réelles, ou qui laisse un rejet non attrapé, compte **rouge**.
  **47 assertions, 29 contre-épreuves détectées** (6 sur le câblage d'`app.js`, dont la reprise débranchée et le retour
  à `load` seul). Branché dans `check`, `prebuild` et la CI (`mv-harnais-portes` vert).
- ★ **Le harnais s'est trompé avant le code** : sept rouges au premier passage, tous dans le démarrage — le bac n'avait
  pas de domaine en `localStorage`, `_fbLoad` partait sur l'accueil public. **Le code était juste.** Puis la
  contre-épreuve a PLANTÉ au lieu de rougir : la mutation « appel non borné » laisse le minuteur rejeter dans le vide,
  et Node s'arrête sur un rejet non géré — c'est exactement le défaut de §52. Le harnais compte désormais un rejet non
  attrapé comme un rouge.
- `npm run check` : EXIT 0 · preflight 0 erreur (C14 à sa référence, aucun `catch` vide ; chaque erreur avalée a un nom
  unique pour `mv-harnais-avale`) · `npx vite build` vert · `mv-harnais-prep` vert : `_fbLoad` garde l'ordre file →
  préparation → domaine dans ses 900 premiers caractères.
- ⚠️ **Rien de ceci n'a tourné sur un iPhone.** La panne exacte chez le contact technique reste **à confirmer** : le
  carnet d'incidents est là pour ça. `test:smoke` et `test:e2e` non lancés (Playwright absent du bac à sable) — **l'e2e
  passe par l'écran de connexion : à lancer chez Nico avant de déployer.**

### 145f. La note de livraison

| Fichier | Ce qui change pour l'utilisateur | Bump |
|---|---|---|
| `src/firebase.js` | le démarrage va toujours au bout ; retour de veille vérifié ; voyant et badge honnêtes ; carnet d'incidents | — |
| `src/app.js` | démarrage sans attendre `load` ; relance proposée à la connexion et dans le voyant ; reprise branchée | ★ SW |
| `src/utils.js` | `APP_VERSION`, bloc `WHATS_NEW`, un point de `MV_AIDE` (accueil : le voyant) | ★ APP |
| `index.html` | les 4 affichages de version | ★ APP |
| `public/sw.js` | en-tête, `CACHE_NAME`, 2 `console.log`, ligne de changelog | ★ SW |
| `guide/01-demarrer.html` · `guide/14-depannage.html` | « Pas de synchro », retour de veille, écran de connexion vide | — |
| `scripts/mv-harnais-reprise.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` | le harnais, dans les trois portes | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | `SECTIONS` 177, cette section, base `c0e671a` | — |
| `scripts/typo-baseline.json` | référence de taille regravée (145d) | — |

`node scripts/build-guide.mjs` (le guide généré n'est **pas** livré), puis `npm run check`, puis
`npm run build && firebase deploy --only hosting`.

### 145g. Accompagnement

`MV_AIDE` : un point ajouté à l'Accueil (le voyant, « Pas de synchro », la relance) ; les fiches des modules ne
décrivent ni la synchro ni la connexion — relues, rien à changer. `MV_INFO` : aucune méthode de calcul touchée.
Visite guidée : aucun sélecteur ne bouge. Guide : deux sections. `WHATS_NEW` : trois entrées, sans nom de client.

### 145h. Ouvert, et dit

① ★★★ **Fusionner au lieu d'écraser** (le lot 4 annoncé) — ✅ **fait en §146**. La file hors ligne et les écritures en attente de Firestore
renvoient **le document entier** tel que le téléphone le connaissait ; seules les parcelles sont fusionnées
(`_saveParcellesMerged`). Ce que l'ordinateur a ajouté entre-temps est effacé — la garde anti-perte ne mord qu'au-delà
de la moitié. C'est la vraie protection contre la perte ; ce lot en réduit la fenêtre (retour de veille relu, relance),
il ne la ferme pas. Question à poser au contact technique : l'opération saisie sur l'ordinateur y est-elle **encore**,
page rafraîchie ?
② `cave_elevage` / `cave_vendange` restent en `FB_STATIC` : deux écrans ouverts côte à côte ne se voient pas (145d).
③ Un flux fantôme **pendant** le travail (sans passer par la veille) laisse `setDoc` en attente : l'écran peut rester
sur « Enregistrement… ». Non traité.
④ La navigation du service worker est en réseau d'abord **sans délai** : sur un réseau fantôme, l'`index.html` attend.
Un délai (3–4 s, puis la copie) est simple et sûr — non livré, hors du périmètre validé.
⑤ Chaque mise en ligne force un rechargement au retour dans l'app (`controllerchange`) : au pire moment, et en
redemandant le mot de passe. La piste du bandeau poli (§8) reste la bonne.
⑥ `load-tardif` peut être fréquent sur 4G : si le carnet en déborde, le retirer une fois la mesure faite.
⑦ **Mesurer** : après déploiement, lire dans Admin GT › erreurs du second domaine les entrées « Connexion : N
incidents sur cet appareil ».

### 145i. ★★ L'e2e l'a attrapé — deux défauts du lot, corrigés (SW 8.00 → **8.01**)

Nico a lancé `npm run test:e2e` avant de déployer : **3 échecs** (Login, Action session, Action dock). Reproduit ici, puis
comparé à la base `c0e671a`, qui passe : **le lot était en cause**, pas le test.
① ★★★ **La relance automatique rejouait l'écran sous les doigts.** L'e2e coupe reCAPTCHA exprès (`route.abort`) : le
script échoue, `_mvAcRelance` relançait la page 3 s plus tard — pendant le clic sur la tuile (« element was detached »,
puis le splash de la page neuve interceptait les clics), et les données injectées disparaissaient avec la page. Session
et dock échouaient ensuite, faute de connexion. **Un bloqueur de contenu, ou un réseau qui filtre Google, fait la même
chose à un vrai utilisateur** — et là, relancer ne guérit rien. Correctif : `_mvAcSonde` interroge d'abord l'adresse du
script (`fetch` en `no-cors`, bornée à 5 s ; `connect-src` autorise `www.google.com`) et ne relance que si elle répond ;
sinon une seconde sonde 12 s plus tard, puis un incident `appcheck-bloque`, et plus rien. Le bouton « Relancer
l'application » reste là quand la connexion échoue.
② ★★ **Les données de l'appareil pouvaient écraser une session ouverte.** Le filet final montre des tuiles pendant que
`_fbLoad` attend encore : on peut donc se connecter AVANT qu'il n'arrive au bout. Sa branche « membres trop lents »
appelait alors `loadData()` — la mémoire relue du serveur après la connexion, remplacée par la copie du disque. Trouvé en
déroulant la chronologie de l'e2e, pas par un échec visible. Correctif : `_mvDonneesAppareil` (jamais une fois connecté
ni sous une tuile touchée) partout où `_fbLoad` lisait le disque ; le filet final se tait lui aussi une fois connecté.
- `mv-harnais-reprise` : **49 assertions, 31 contre-épreuves** (+ « adresse bloquée : aucune relance, deux sondes »,
  « connecté avant la fin du démarrage : rien n'est remplacé », « relance sans sonde », « tuile touchée : pas même une
  sonde »). `npm run check` : EXIT 0.
- E2E rejoué ici après correctif : **identique à la base** — tout vert sauf « Action parcelle », qui échoue AUSSI sur la
  base dans ce bac à sable (la météo Open-Meteo y est bloquée par le proxy) et passe chez Nico.
- SW **8.01** : le correctif change les fichiers en cache, et 8.00 a pu être déployé. APP 7.36 inchangé, rien de neuf à
  annoncer.
- ★★ **Leçon : l'e2e se lance dans le bac à sable.** `playwright` 1.61 est dans `node_modules` ; son Chromium attendu
  (build 1228) manque, mais `/opt/pw-browsers` porte un build 1194 : une copie JETABLE de `scripts/e2e-local.mjs` avec
  `executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'` le fait tourner. §144 et
  §145e disaient l'inverse. À faire AVANT de livrer tout lot qui touche le démarrage, la connexion ou la synchro — et
  TOUJOURS contre la base, pour séparer ce qui vient du lot de ce qui vient du bac à sable.

## 146. ★★★ FUSION-1 — UNE ÉCRITURE N'EFFACE PLUS CE QU'UN AUTRE APPAREIL A SAISI (18/09 — `firebase.js` · `utils.js` · `index.html` · `sw.js` · `guide/01-demarrer.html` · `guide/14-depannage.html` · `scripts/` · `package.json` · `ci.yml` · APP 7.35 → **7.36** · SW 7.99 → **8.00**)

> Nico : « suite », après BOOT-1 + REPRISE-1. C'est le lot 4 annoncé en §145h ①. ⚠️ `origin/main` = `c0e671a` : §145
> n'est pas poussé — **ce zip le CONTIENT et le remplace**.

### 146a. Le défaut — trois chemins d'effacement, et un dormant

Chaque document est réécrit EN ENTIER (`setDoc`). Seules les parcelles étaient fusionnées ; partout ailleurs, le
dernier qui écrit gagne, et la garde anti-perte ne mord qu'au-delà de la moitié : une ligne perdue passait. Lus dans le
code, trois chemins :
1. **Une clé sans écoute** (`FB_STATIC` : la Cave, les réglages, les tâches) à la copie en retard. En vendange, la
   tournée du cuvier sur le téléphone effaçait les réceptions saisies au bureau depuis sa dernière relecture.
2. **L'envoi de la file hors ligne** : la valeur entière, en `setDoc` aveugle, APRÈS la relecture de la reconnexion.
3. ★ **Une vieille valeur en file défaisait une écriture plus récente** de la même clé : `fbSave` relance
   `_flushQueue` après chaque succès, et la file renvoyait l'état d'avant.

★★★ **Le dormant, dans les parcelles** — lu, puis prouvé par le harnais : `_saveParcellesMerged` posait
`_baseParcelles = fusion` DANS la transaction, mais la mémoire ne recevait jamais la fusion (l'écho de l'écriture est
ignoré quatre secondes, `_ignoreNext` / `_ignoreBefore`). À l'écriture suivante, une tâche validée sur un autre appareil
se lisait à l'envers : la base disait « Validé », la mémoire « En cours » → « seul cet appareil a bougé » → **« En
cours » réécrit**. L'envoi de la file prenait, lui, la relecture de la reconnexion pour base : même effet. Le « prouvé
par 8 scénarios » du commentaire d'origine ne couvrait pas une DEUXIÈME écriture.

### 146b. La fusion — `_mvFusion(base, local, distant)`

- Ce qui n'a bougé que d'un côté prend ce côté. Deux objets : clé par clé (le planning, la config). Deux listes
  d'enregistrements : élément par élément, reconnus par **`id`** si tous en ont un, sinon **`nom`**, sinon par leur
  **contenu** (forme canonique `_mvCanon` : clés triées, `undefined` retiré — le serveur rend les clés dans SON ordre).
- ★ **Un `id` présent deux fois dans une version** (le journal fabrique ses `id` avec `Date.now()` : deux lignes créées la
  même milliseconde) n'identifie plus rien : ces lignes-là passent par leur contenu, les autres gardent leur `id`. Le
  contenu ne se calcule que pour elles — mesuré : 5 000 lignes en ~100 ms dans Node (×3 à ×5 sur un téléphone).
- **Supprimé d'un côté, intact de l'autre → supprimé. Supprimé d'un côté, MODIFIÉ de l'autre → gardé.** Une même valeur
  changée des deux côtés → celle de cet appareil. Une liste de valeurs simples est une feuille (pas de fusion).
- **Ordre** : celui de cet appareil ; une ligne venue d'ailleurs se place à côté de sa voisine d'origine — en tête pour
  le journal (qui ajoute en tête), en queue pour une liste qui ajoute en queue.
- **Sans base connue** (démarrage hors ligne) : l'**union** — rien de ce que le serveur porte n'est retiré.
- Hors fusion générique (`_MV_FUSION_EXCLUES`) : `parcelles` (leur fusion par nom, gardée), `kml_polygons` (un import
  REMPLACE, c'est voulu), `travaux` (recalculé depuis le journal).

### 146c. Le chemin d'écriture

- `fbSave` → **`_mvSauverFusion`** : une transaction relit le serveur, fusionne avec la base, applique la garde
  anti-perte **au résultat** (mêmes planchers que `_mvBlockDestructive`), écrit. Même coût qu'avant pour les clés gardées
  (une lecture + une écriture) ; une lecture de plus pour les autres. La transaction se rejoue seule si le document
  bouge entre la lecture et l'écriture ; hors ligne elle échoue, et la saisie part en file — comme les parcelles depuis
  le lot #1.
- **La base** (`_fbBases`) : l'état serveur dont la mémoire dérive, noté à chaque relecture (`_pullKeys`) et à chaque
  instantané d'écoute (`_fbSubscribe`) — **jamais** un instantané qui porte des écritures locales en attente
  (`hasPendingWrites` : il contiendrait nos propres modifications non envoyées).
- ★★ **Après l'écriture, la mémoire reçoit le résultat** (`_mvApresFusion`), en gardant ce qui y a été saisi PENDANT
  l'écriture (fusion à trois voies, base = ce qui a été envoyé). Un champ actif (`_mvSaisieEnCours`) : on ne touche à
  rien ET la base ne bouge pas — la prochaine écriture refusionne juste. Le badge dit « Sauvegardé — fusionné avec un
  autre appareil » quand le serveur a apporté quelque chose.
- **La file** : `_offlineBases` (`localStorage['mavigne_offline_queue_base']`) garde la base de la **première** mise en
  file — une deuxième saisie hors ligne s'accumule par-dessus la première. `null` = sans base → union. Quota dépassé →
  les bases sautent, la file reste (union). `_flushQueue` fusionne avec la base de la file ; la mémoire, qui dérive de la
  relecture de la reconnexion, reçoit le résultat.
- **Les parcelles** : `_saveParcellesMerged(local, baseFile)` ne pose plus la base dans la transaction ;
  `_mvParcellesApres` reporte la fusion dans la mémoire, puis pose la base. Leur garde (progression) est inchangée.

### 146d. Arbitrages

- **Modifié contre supprimé → gardé** : une ligne qui revient se voit et se supprime ; une modification perdue ne se voit
  jamais.
- **Une même valeur des deux côtés → cet appareil** (la dernière écriture), au niveau du CHAMP et non plus du document.
- **L'union sans base** peut faire revenir une ligne supprimée pendant un démarrage hors ligne. Même raison.
- **Pas d'écran de conflit** : un badge, pas une fenêtre. À reconsidérer si le carnet ou le terrain montre des
  conflits réels.
- `firebase.js` grossit encore, **137 → 153 ko** (fusion + file) : le cliquet de taille a rougi, référence regravée —
  même réponse qu'en §145d, ce code a besoin de `db`, de la transaction et de l'état des écoutes. Si `firebase.js` doit
  un jour se couper, la fusion (fonctions pures, de `_mvEgal` à `_mvFusionListe`) est le premier morceau détachable.

### 146e. Vérifié

- `scripts/mv-harnais-fusion-docs.mjs` (neuf) : les **vraies** fonctions de `firebase.js` — fusion, transaction,
  `fbSave`, file, envoi, parcelles — sur un faux serveur. **29 assertions, dont 400 tirages au hasard** (lignes ajoutées,
  modifiées, supprimées de part et d'autre : rien ne se perd, rien ne se double) ; **15 contre-épreuves détectées**, dont
  le retour du défaut dormant des parcelles et « l'envoi fusionne avec la relecture de la reconnexion ».
- ★ Deux contre-épreuves ne mordaient pas au premier passage : l'essai « ordre des clés » n'avait AUCUNE ligne commune
  aux clés réordonnées (il passait sans le tri), et une ancre avait bougé avec la réécriture de l'identité. Recalées :
  l'essai porte maintenant la ligne « Liage », supprimée ici, que le serveur rend avec ses clés dans un autre ordre.
- `mv-harnais-reprise` recalé (l'écoute note la base : `_mvBaseNoter` extrait) — toujours 47 / 29. ★ Deux harnais
  d'avant ont suivi le code, sans rien perdre de ce qu'ils prouvent : `mv-harnais-prep` (l'envoi de la file appelle
  la fusion : bouchonnée, une écriture fusionnée compte comme une écriture ; `_mvBaseFile` et `_mvBasesFileEcrire`
  extraits pour de vrai — 75 / 26) et `mv-harnais-auth1` (une clé fusionnée s'écrit par transaction : le bouchon passe
  par le même faux serveur que `setDoc`, avec les mêmes refus — 27 vertes). Sans ça, `npm run check` plantait sur
  `_offlineBases is not defined` : le premier symptôme a été lu comme tel, pas contourné.
- `npm run check` : EXIT 0 · `npx vite build` vert.
- ⚠️ Pas vérifié : un vrai téléphone ; la transaction sur un flux fantôme (§145h ③) — elle passe par les requêtes
  unitaires, pas par le flux d'écoute : **à observer** dans le carnet d'incidents.

### 146f. La note de livraison

**Base `c0e671a`. Ce zip CONTIENT BOOT-1 + REPRISE-1 (§145, avec son correctif §145i) et le remplace. APP 7.34 → 7.36 ·
SW 7.98 → 8.01.**

| Fichier | Ce qui change pour l'utilisateur | Bump |
|---|---|---|
| `src/firebase.js` | §145 + la fusion : plus aucune saisie d'un autre appareil effacée | — |
| `src/app.js` | §145 | ★ SW |
| `src/utils.js` · `index.html` | versions, `WHATS_NEW` 7.35 et 7.36, `MV_AIDE` (Accueil : le voyant ; Journal : la fusion) | ★ APP |
| `public/sw.js` | v7.99 et v8.00 au changelog | ★ SW |
| `guide/01-demarrer.html` · `guide/14-depannage.html` | §145 + « Deux personnes ont saisi en même temps » réécrit | — |
| `scripts/mv-harnais-fusion-docs.mjs` (neuf) · `scripts/mv-harnais-reprise.mjs` (neuf) · `package.json` · `ci.yml` | les deux harnais, dans les trois portes | — |
| `scripts/mv-harnais-prep.mjs` · `scripts/mv-harnais-auth1.mjs` | recalés sur l'écriture fusionnée (146e) | — |
| `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | référence de taille, `SECTIONS` 178, §145 et §146, base | — |

`node scripts/build-guide.mjs`, puis `npm run check`, `npm run test:e2e`, puis
`npm run build && firebase deploy --only hosting`.

### 146g. Accompagnement

`MV_AIDE` : Journal, « une saisie faite hors réseau… se fusionne avec ce que les autres ont saisi entre-temps ». Guide :
« Deux personnes ont saisi en même temps » disait « pour les autres écrans, la dernière écriture l'emporte » — c'était
vrai, ça ne l'est plus ; et la file « se fusionne au retour du réseau ». `WHATS_NEW` 7.36 : deux entrées. Visite guidée
et `MV_INFO` : rien ne bouge.

### 146h. Ouvert, et dit

① La Cave reste sans écoute : deux écrans ouverts côte à côte ne se VOIENT pas avant une relecture — mais ne
s'effacent plus. ② Pas d'écran de conflit (146d). ③ Le journal fabrique ses `id` avec `Date.now()` : des doublons
existent sûrement ; ces lignes passent par leur contenu (une modification concurrente de l'une d'elles garde les deux
versions). Un `id` vraiment unique à la création réglerait ça. ④ La transaction sur un réseau fantôme (146e).
⑤ Mesurer : les badges « fusionné avec un autre appareil » ne laissent pas de trace ; si le terrain en parle, ajouter
une entrée au carnet d'incidents.

## 147. ★★ AVANT-1 — LES HEURES SUP D'AVANT SEPTEMBRE 2026 ONT UN TAUX ESTIMÉ, À TITRE INDICATIF (18/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · harnais — APP 7.36 → **7.37** · SW 8.01 → **8.02**)

> Nico : *« Juste pour savoir, est-ce possible de récupérer les taux des heures sup et les récup d'avant septembre
> dans le planning ? »* Deux voies proposées : ① indicatif, rien ne bouge ; ② bascule au 1er janvier, janvier-août
> recalculés. Réponse : **« 1 »**. Maquette `maquette-avant-septembre-v1.html` (la fiche dans un téléphone et le
> relevé, rendus par le vrai code et un prototype du lot, deux salariés fictifs, avant/après, clair/sombre), puis
> **« go »**.

### 147a. Pourquoi pas la bascule au 1er janvier (voie ②)

`PLAN_RECUP_DEBUT` ne commande pas que les taux. Le reculer changerait des chiffres déjà payés : heures sup comptées à
la semaine au lieu du mois ; compteur en temps majoré (les récup déjà prises « coûteraient » moins d'heures sup) ; un
mois en déficit n'est plus remis à zéro — ses heures manquées reviennent « à rattraper », et les journées raccourcies
d'avant, sans motif, comptent comme décidées par le domaine ; un jour sans saisie vaut le modèle et non son horaire
par défaut, jusque dans le compteur annuel (`_planWorkH`). Le solde de chacun bougerait, dans un sens ou dans l'autre :
c'est la raison même de la bascule au 1er septembre (une paie éditée ne change pas). Le report d'avant Ma Vigne, lui,
n'a aucun jour derrière lui. Voie ② non faite : ce serait une régularisation à caler avec le comptable.

### 147b. La règle de l'estimation

- **`_planEstLecture(mbr,i)`** relit le mois i avec la règle d'aujourd'hui : `PLAN_RECUP_DEBUT` avancé au 1er janvier
  le temps de la lecture, **remis en place dans un `finally`** ; `_planHsupMois` sur les semaines qui finissent en i et
  en i+1 ; chaque jour rangé dans **son** mois — le compteur d'avant comptait au calendrier : les 29 et 30 juin d'une
  semaine qui finit en juillet restent en juin.
- **Un dimanche ou un férié a déjà eu sa majoration à part** (tranche `maj` du compteur, ou la paie en mode payé) :
  l'heure sup ne prend que ce qui lui manque (taux du rang moins taux du jour) ; à zéro, elle est « déjà majorée ».
  Sans ça la compta paierait deux fois la majoration (§73b, la plus forte seule).
- **`_pfEstPile(mbr,i)`** : la pile du mois, du haut — 50 %, 25 %, déjà majorées. Ce que la lecture ne retrouve pas
  (une valeur saisie à la main au-delà des jours, les demi-heures d'un horaire par défaut) compte à 25 %, comme dans
  `_planHsupTiers`.
- **Ce qui est sorti du compteur part du bas, ce qui reste garde le haut** (heures manquées du mois, acompte, récup,
  paiements) : l'ordre de `_planCompteur` depuis septembre. `tire` rend désormais, pour chaque heure payée sur une
  tranche, `mois`, `bas` et `haut` — ses rangs dans la tranche : un paiement pris au compteur se range lui aussi.
- **`_pfSources`** range les heures sans taux par origine : `avant` (estimées), `maj` (« Majoration des dimanches et
  fériés, déjà calculée »), `dep` (« Report d'avant Ma Vigne, taux à vérifier »), `autre` (l'ancien libellé, en filet :
  ne doit pas arriver). `_pfCat` ne bouge pas : la catégorie `normal` sert toujours aux totaux.

### 147c. À l'écran et sur le papier

- Cadre « Pour la paie », écran et relevé : « Heures sup d'avant septembre », avec sous le libellé « Estimation
  d'après les jours saisis : 6h à +25 %, 7h à +50 % ».
- Carte « Heures sup restantes à payer » : la ligne, une ligne d'estimation qui rappelle « En récup, 1h pour 1h, comme
  avant septembre », et un détail replié **« Le calcul, mois par mois »** (« Juillet : 14h restantes sur 16h comptées
  au mois → 12h à +25 %, 2h à +50 % »).
- Relevé, page 2 : la même ligne ; « À savoir » gagne une phrase quand ces heures apparaissent.
- ★ **Écart validé sur maquette** : la ligne unique « Heures reportées, taux à vérifier » (FICHE-4) se sépare en trois.
  La majoration seule a un taux connu — c'est la majoration elle-même — et le report d'avant Ma Vigne garde son « taux
  à vérifier ».

### 147d. Invariants

Rien ne s'écrit : ni compteur, ni saisie, ni paie. La bascule est remise en place même si la lecture plante. En récup,
les heures d'avant septembre gardent leur valeur d'alors (1h pour 1h). L'estimation d'une ligne fait exactement ses
heures, à la minute près.

### 147e. Les filets

`mv-harnais-recup`, section **W** : 13 assertions et 2 contrôles de HTML sain. L'année de la maquette (Jean : 30h
demandées → 17h du mois et 13h du compteur, estimées 6h à 25 % et 7h à 50 % ; restent 18h, 16h et 2h) ; la même avec un
report de 30h, une récup en mars et un dimanche travaillé (9h de report à vérifier ; 49h restantes dont 8h déjà
majorées ; 4h de majoration) ; une valeur saisie à la main au-delà des jours (le surplus à 25 %). Témoin : compteur,
saisies et enregistrements identiques avant et après lecture ; bascule remise. R7 recalée : le report dit son nom.
Contre-épreuves, **8 neuves** : bascule laissée au 1er janvier, pile à l'envers, surplus à 50 %, dimanche majoré deux
fois, paiement sans son mois, report mêlé aux estimées, relevé sans estimation, « À savoir » muet. **331 assertions,
47 défauts, 47 détectés.**

### 147f. La note de livraison

**Base `a578994`. APP 7.36 → 7.37 · SW 8.01 → 8.02.**

| Fichier | Ce qui change pour l'utilisateur | Bump |
|---|---|---|
| `src/planning.js` | l'estimation, les trois lignes, le calcul mois par mois, le relevé | — |
| `src/styles.css` | `.pf-estl`, `.pf-src`, `.pf-est`, `.pf-estd` | ★ SW |
| `src/utils.js` · `index.html` | versions, `WHATS_NEW` 7.37 | ★ APP |
| `public/sw.js` | v8.02 au changelog | ★ SW |
| `guide/10-planning.html` | « La fiche d'un salarié » : le taux estimé, le report, le calcul mois par mois | — |
| `scripts/mv-harnais-recup.mjs` | section W, R7, 8 contre-épreuves | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | `SECTIONS` 179, §147, base | — |

`node scripts/build-guide.mjs`, puis `npm run check`, `npm run test:e2e`, puis
`npm run build && firebase deploy --only hosting`.

### 147g. Accompagnement

Guide : 10-planning, « La fiche d'un salarié ». `WHATS_NEW` 7.37 : deux entrées ; l'entrée d'avant qui parlait du
« taux à vérifier » reste telle quelle (prépendé, jamais remplacé). `MV_AIDE`, visite guidée, `MV_INFO` : rien ne
bouge, aucun ne parlait du « taux à vérifier ».

### 147h. Mesuré

Coût de la lecture, dans Node, sur le cas le plus chargé du harnais (report, récup en mars, dimanche, quatre mois
d'avant septembre au compteur) : fiche (Résumé + Compteur) **13,1 → 13,9 ms**,
relevé **5,6 → 8,2 ms**. Chaque mois lu est gardé le temps d'un appel
(`_pfSources`).

### 147i. Ouvert, et dit

① **C'est une estimation** : la compta tranche, et le régime lui-même (8 h à 25 %, puis 50 %, §142) reste à lui faire
confirmer. ② Voie ② non faite (147a). ③ Rendu vérifié dans Chromium, sur la maquette ; pas vu sur un vrai téléphone
ni sur un relevé imprimé.

## 148. ★★★ FUT-CAP + CUV-14 — LA CONTENANCE D'UN FÛT VIT DANS SON LOT, ET LE VOLUME DÉCUVÉ SE SAISIT (19/09 — `cave.js` · `reserve.js` · `utils.js` · `index.html` · `sw.js` · `guide/08-cave.html` · `guide/09-reserve.html` · `scripts/` · `package.json` · APP 7.37 → **7.38** · SW 8.02 → **8.03**)

> Nico, 18/09 : *« Je dois pouvoir modifier manuellement la contenance d'un fût si nécessaire. Lors du décuvage il faut
> que je puisse indiquer la quantité exacte décuvée. »* Le réglage du domaine existait déjà (roue crantée de la Cave,
> « Contenance d'un fût ») : ce qui manquait, c'est un fût DIFFÉRENT des autres. Question posée : la contenance vit dans
> le lot de La Réserve, ou se choisit au décuvage ? Réponse : **« ta reco »** (le lot). Maquette v1 — cinq onglets, bâtie
> avec le CSS réel extrait en exécutant les fonctions d'injection de `cave.js` et `reserve.js` —, puis **« go (relis les
> fichiers) »**. Deux commits de Nico étaient passés entre-temps (FUSION-1, AVANT-1) : base relue, `c227c18`.

### 148a. Le modèle

- **`l`, en litres, facultatif**, sur `INTRANTS.futs[]` (le lot) et sur `cuvee.tonneaux[]` (le fût en vin). **Absent =
  `CONFIG.cave.fut_l`**. La valeur du domaine ne s'écrit JAMAIS (champ vidé, `delete f.l`) : un lot au format suit le
  domaine si le réglage change. `_mvFutL` (utils) ne lit pas CONFIG — la famille `_mvFut*` reçoit ses données (§20e).
- **Le voyage** : `_mvFutStock` porte `l` ; `_mvFutEntonner` l'emporte dans la cuvée ; `_mvFutEntrer` (mise en bouteille,
  retrait) ne rend un fût qu'à un lot de **même triplet ET même contenance** — sinon un lot neuf. ⚠️ `_mvFutMemeLot` n'a
  PAS bougé : l'assiette des fûts loués (FUT-LOC) s'apparie comme avant.
- **La seule porte** : `_caveTonL(t)` (un fût), `_caveFutsL(cuv)` (le bois, sans les cuves — part des anges),
  `_caveVolL = _caveFutsL + cuves`. Tout `nb × fut_l` est passé par elle : fiche (une ligne par contenance,
  `_caveGroupesL`), sous-titre d'une cuvée mixte, part des anges (litres par millésime), **bilan de campagne** (`_bcData`
  portait **2,28 écrit en dur** et oubliait les cuves), retrait d'un fût, répartition (`« (500 L) »`).
- **Hors format** (`_caveHorsFormat`) : plus de 10 % d'écart avec le domaine. 500 et 114 oui ; 225 et 250 non — une
  barrique de 225 dans un domaine à 228 reste une barrique, proposée comme les autres.

### 148b. Le volume décuvé

- Champ facultatif dans la feuille « Décuver ». **Vide** : proposition sur l'estimation des caisses, volume écrit = les
  contenants remplis, **comme avant**. **Saisi** : `vol_decuve_hl` = la mesure, `vol_decuve_src:'mesure'` (sinon
  `'contenants'`), `vol_decuve_le`. Le seul refus : **plus que la contenance de la cuve** (des litres tapés en hL), et il
  passe AVANT toute écriture. Un champ qui bloque une vanne se contourne par un faux chiffre : rien d'autre ne bloque.
- **La proposition au volume** (`_vendDecPropVol`, pure) : fûts pleins du plus vieux au plus neuf, puis un dernier si le
  reste en remplit la moitié. Lots au format : **l'arrondi d'avant, prouvé litre par litre de 5 à 4000 L**. Un fût hors
  format n'est jamais proposé ; choisi, il reste, et les barriques se recalculent sur le reste.
- **Le bilan** (`_vendDecBilan`, pur) : estimé = mots et tolérance d'avant (0,6 hL) ; mesuré = au litre — « le dernier fût
  attend 10 L » n'est pas une faute, un fût de trop ou plus de 0,6 hL sans contenant restent orange.
- **Après coup** : le détail d'une cuve décuvée porte un bloc « Volume décuvé » qui dit d'où vient le chiffre, et
  « Corriger le volume » (`_vendDvolCorriger`, même refus). `saveVendCuve` rebâtit l'objet : il garde `vol_decuve_src` et
  `vol_decuve_le` (piège n° 9, encore).
- **La contenance d'un lot se corrige depuis la feuille** (`_vendDecCap`, administrateur) : elle s'écrit dans le LOT.

### 148c. ★★ Trouvé en route

1. **« Modifier la cuvée » recopiait `{annee, nb}`** : réenregistrer une cuvée (un nom, la malo) effaçait tonnelier,
   référence et lot des fûts entonnés depuis le parc — retour « lot sans nom » à la mise en bouteille, fût loué sorti de
   l'assiette du loyer. `_cuvTonneauxDe` copie la ligne entière. **Quatrième fois le piège de l'objet rebâti de zéro.**
2. **La même fiche, sur une cuvée en cuve seule**, pré-remplissait six fûts qui n'existaient pas, et refusait
   d'enregistrer sans au moins un fût. Elle s'ouvre vide, et s'enregistre sans fût si la cuvée a une cuve.
3. **« Embouteillée » posé depuis la fiche** ne rendait pas les fûts : ni en vin (cuvée embouteillée ignorée), ni libres.
   `_mvFutLiberer` avant le statut, comme la mise en bouteille. ⚠️ **Le retour arrière (Embouteillée → En élevage) n'est
   pas traité** : les fûts compteraient deux fois. Ouvert.
4. **Un fût fantôme au décuvage « Les deux »** : `nb=(total>0 ? total : (_vendDecNb||1))` posait une barrique quand la cuve
   prenait tout — dans la cuvée et dans le volume décuvé. Le compte simple ne sert plus que parc vide.
5. **« La cuve vient d'être prise » refusait APRÈS l'entonnage** : les fûts étaient sortis du parc (et enregistrés) sans
   cuvée pour les porter. Le contrôle passe avant tout geste.
6. **Retirer un fût choisissait l'ANNÉE** : deux lignes de la même année, la première gagnait. Choix par ligne
   (`_retraitFutIdx`) ; et les boutons de motif ne décochent plus la ligne (`[data-reason]`).
7. ★★★ **Le « + » avalé** — vu sur la maquette v1, dans Chromium : le champ « Volume décuvé » recalcule sur `change`,
   c'est-à-dire au moment précis où le doigt touche un « + » ; reconstruire les boutons à cet instant avale le toucher.
   **Le code existant avait le même défaut** sur « Volume logé » en mixte (`_vendDecCuveVolFin` → `_vendDecZone`). La
   liste se rend une fois, `_vendDecRender` met à jour sur place. **Règle : jamais de reconstruction de boutons au
   `change` d'un champ.**
8. `.mvr-mseg button{font:600 12px/1 inherit}` est **invalide** (`inherit` n'entre pas dans le raccourci) : le navigateur
   ignorait la règle, « Acheté / Loué » sortait en police système depuis FUT-LOC.
9. **Le guide 09 promettait la fusion retirée par FUT-LOC** (« saisir un lot déjà présent ajoute à l'existant »). Réécrit.
10. `_mvFutProposer` et `_retraitFutSetAnnee` devenus sans appelant : retirés (preflight, joignabilité).

### 148d. Écarts avec la maquette, dits

- **« ≈ » remplacé par « environ » / « estimés »** : U+2248 n'est pas dans les polices de l'app (`mv-harnais-subset` :
  `cave.js` 53 → 56 hors subset).
- **Couleurs de texte `--or-tx` / `--terre-tx`**, qui s'inversent en sombre. Premier essai avec `--terre` : écarts de
  contraste en sombre `cave.js` 47 → 49, `reserve.js` 7 → 8 ; revenus à la référence (213).
- **Crayon en 16 px** (échelle des icônes 16/18/20/24/40), pas 12.

### 148e. Le harnais

`scripts/mv-harnais-futcap.mjs` — **54 assertions, 13 contre-épreuves qui mordent**, dans `check` et `prebuild`
(`npm run test:futcap`). Sur les VRAIES fonctions de `cave.js` et `utils.js`, extraites hors chaînes et hors
commentaires : volumes (A), proposition (B), bilan (C), voyage de la contenance (D), fiche cuvée (E), écritures et ordre
des refus (F), La Réserve (G), aide, guides et « Quoi de neuf » (H). ★ Une assertion a rougi à l'écriture sur un
**commentaire** qui citait l'ancien code (`_vendDecNb||1`) : F8 lit le code sans ses commentaires.
Harnais existants ajustés : `intrants`, `rendement`, `vendange-parts` extraient `_caveTonL` et `_caveFutsL` (leur
`_caveVolL` passe par eux) ; `cuv13` bouche `_vendDvolHtml` (le bloc a son propre harnais).

### 148f. La note de livraison, et ce qui reste ouvert

**Base `c227c18`. APP 7.37 → 7.38 · SW 8.02 → 8.03.** `node scripts/build-guide.mjs`, puis `npm run build && firebase
deploy --only hosting`. `npm run check` joué en entier sur la base finale.

★ **Le vrai code, rendu** (`/home/claude/lot/rendre-vrai.mjs`, hors dépôt) : les fonctions EXTRAITES de `cave.js` et
`utils.js`, le CSS réel, dans Chromium à 390 px. Joué : ouverture (5 fûts de 2022 pour 11,6 hL estimés), 11,30 tapé puis
« + » sur le demi-muid **touché aussitôt** — le demi-muid passe à 1, les barriques à 3, « le dernier fût attend 54 L » —,
retour à 5, « Les deux » + Cuve 3, 1130 tapé (l'avertissement sort), bloc Volume, contenants, fiche cuvée : aucune
erreur, aucun débordement. Une retouche en est sortie : le libellé du bloc Volume passait sous le chiffre.
⚠️ Le banc a d'abord échoué sur SA propre extraction (`_escHtml` porte une expression régulière avec des guillemets, que
le compteur d'accolades prenait pour une chaîne) : il la bouche, et c'est dit.

Ouvert, et dit : ① **La Réserve n'a pas été rendue** (champ Contenance, étiquette) — à regarder. ② Embouteillée → En élevage depuis la fiche (148c-3).
③ `_mlOuillages` compte l'ouillage PAR FÛT (moyenne des ouillages saisis, 7 L à défaut) sans la contenance : un
demi-muid s'ouille plus qu'une pièce. ④ Parc vide : le compte simple garde la contenance du domaine (volontaire).
⑤ Le fût n'est toujours pas nominatif : on reste à la maille du lot. ⑥ `npm run build`, `test:smoke`, `test:e2e` non
joués dans le bac à sable.

## 149. ★★ FUT-CAP-2 — CE QUI RESTAIT OUVERT EST RÉGLÉ (19/09 — `cave.js` · `utils.js` · `index.html` · `sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-futcap.mjs` · `scripts/mv-harnais-agenda.mjs` · APP 7.38 → **7.39** · SW 8.03 → **8.04**)

> Nico : *« règle ce qui est ouvert »*. §148 n'était pas poussé (`origin/main` = `c227c18`) : ce lot s'empile dessus, et
> le zip livré CONTIENT les deux.

### 149a. Les ouverts de §148f, un par un

- **② Embouteillée → En élevage depuis la fiche.** `_mvFutDispo` (utils) dit combien de fûts de la cuvée sont encore libres,
  lot par lot, triplet ET contenance — en SIMULANT la prise : deux lignes sur un même lot ne comptent pas deux fois ses
  fûts. S'il en manque (repartis dans une autre cuvée, vendus, retirés), la fiche **refuse, avant toute écriture**, et dit
  combien. Sinon `_mvFutReprendre` les sort du parc (tracés « entonnage », note « remise en élevage ») et la mise en
  bouteille annulée perd ses traces (`nb_bouteilles`, `date_embouteillage`, `bilan_perte`). C'était le seul chemin de
  retour : la mise en bouteille n'a pas d'« annuler ».
- **③ L'ouillage à la contenance.** Un ouillage écrit désormais `vol_par_eq_L` = total ÷ « pièces » (chaque fût à sa
  contenance divisée par celle du domaine, `_copGetEqFuts`) ; `_mlVolParFut` le relit en priorité, `vol_par_fut_L` sinon
  (ouillages d'avant ce lot, justes pour une cuvée en pièces) ; `_mlOuillages` prévoit « pièces × moyenne ». Une cuvée
  toute en pièces : **au litre près comme avant**. ★ Arbitrage : au VOLUME (un demi-muid de 500 L = 2,2 pièces) plutôt
  qu'à la SURFACE de bois (≈ 1,7, plus juste physiquement) — la règle se dit en une phrase, et la moyenne vient des
  ouillages de la cuvée elle-même : elle se recale seule.
- **① La Réserve, rendue** (`/home/claude/lot/rendre-rsv.mjs`, hors dépôt) : `reserve.js` chargé ENTIER dans Chromium, sa
  ligne d'import retirée et six noms bouchés. Étiquette « 500 L » sur le demi-muid, rien sur une pièce ; champ vide et
  « 228 — réglage du domaine » en indication ; 225 écrit, 228 retire la clé, 30 refusé sans rien écrire ; « Acheté /
  Loué » enfin en Outfit. Aucune erreur, aucun débordement.
- **⑥ `test:smoke` joué** — `npx vite build` (29 s) puis `node scripts/smoke.mjs` : démarrage OK, 23/23 globaux, aucune
  exception. ★ Mécanique, à garder : Playwright-node 1.61 cherche `chromium_headless_shell-1228`, le bac à sable n'a que
  le 1194 (`/opt/pw-browsers`) → `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, où `chromium_headless_shell-1228/chrome-headless-shell-linux64/`
  pointe par liens vers `chrome-linux/` du 1194 (et `chrome-headless-shell` vers `headless_shell`). **`test:e2e` non
  joué** : il lui faut les émulateurs Firebase.
- **④ ⑤ et le « ≈ » ne sont pas des ouverts, ce sont des choix, et ils restent** : parc vide = compte simple au format du
  domaine ; le fût reste à la maille du lot (arbitrage de Nico, §20e) ; « environ » plutôt que « ≈ », absent des polices.

### 149b. ★ Trouvé en route

1. **`MV_INFO['cave.auj']` affirmait le contraire du code** : « le volume à compléter est déduit des ouillages passés de
   la cuvée, jamais d'une moyenne par fût ». `_mlVolParFut` EST une moyenne par fût — de la cuvée, sinon du domaine,
   sinon 7 L. Réécrit, avec la contenance. `MV_INFO['cave.rdt']` dit maintenant d'où vient le volume décuvé.
2. **Le SO₂ « par fût » compte un demi-muid comme une pièce** : `nb_total = pastilles × nombre de fûts`, puis
   `so2_total_g`. Une quantité qui part au registre : **non modifiée sans la réponse de Nico** — dans un demi-muid,
   mettez-vous plus de pastilles ? Si oui, le mode « par fût » doit compter en pièces, comme l'ouillage.
3. `mv-harnais-agenda` exécute `_mlOuillages` hors navigateur : `_caveFutL` y lit `window.CONFIG` → `window` bouché, et
   `_caveFutL` / `_caveTonL` / `_caveFutsL` extraits.

### 149c. Le harnais

`mv-harnais-futcap` : **64 assertions, 17 contre-épreuves** — I (reprise : disponibles, même lot compté une fois, aller-retour
à l'identique, demi-muid jamais repris chez les pièces, refus avant écriture), J (ouillage : `vol_par_eq_L` prioritaire,
ancien relu, pièces inchangées, écriture), H5 (les deux fiches « i »), H3 recalé (7.38 : trois entrées, 7.39 : deux).
`mv-harnais-agenda` : 31/31.

### 149d. Ouvert, et dit

① La question du SO₂ « par fût » (149b-2). ② `test:e2e` et un vrai téléphone, chez Nico. ③ Le zip contient §148 ET §149 :
un seul commit suffit, `.mv-base` reste `c227c18`.

## 150. ★★★ NET-1 — UNE RETENUE OU DES HEURES SUP À PAYER, JAMAIS LES DEUX ; LE RELEVÉ COMPTE TOUT LE MOIS (19/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.39 → **7.40** · SW 8.04 → **8.05**)

> Point de départ : le relevé de Victor de septembre (édité le 19/09). Nico : *« je ne comprends pas comment une personne
> absente et devant des heures réussissent à se faire payer des heures sup »*. Les additions du PDF étaient justes ; deux
> défauts de RÈGLE l'expliquaient : ① le samedi 12, absent sans motif, était neutre — il ne consommait pas les heures en
> plus de sa semaine, d'où 3h « sup » sur une semaine de 38h faites pour 42h prévues ; ② le lundi 31 août servait deux
> fois (ses 0h30, comptées en août, rattrapaient encore le 1er septembre — la reprise « E » de SEM-1 ne jouait que s'il
> restait des heures sup). Décisions de Nico, dans l'ordre :
> *« les heures sup se comptent à la semaine. Par contre TOUTES les heures d'absences sont récupérées sur les heures sup.
> À l'impression du relevé, il doit apparaître sur la feuille si le salarié a une retenue sur salaire et de combien d'heures
> ou s'il a des heures sup à se faire payer (mais il est impossible qu'apparaissent les deux sur la feuille) »* ; *« j'envoie
> la feuille en compta la dernière semaine du mois pour être payé au dernier jour du mois, tous les jours doivent apparaître
> sur la feuille en considérant qu'ils sont faits aux heures indiquées »* ; sur maquette, *« toutes absences injustifiées et
> retard est pris sur heures sup d'abord et ensuite retenue sur salaire. Les absences provoquées par le domaine et journées
> écourtées par le domaine doivent se rattraper mais sans retenue »*, *« mettre un compteur heures à rattraper »* ;
> puis *« mais si ! s'il y a des récup à prendre, les heures en moins à cause du domaine se récupèrent dessus dans un
> premier temps »* et *« dans l'appli, il faut retirer absence sans motif »* ; « go ».
> ⚠️ Une lecture fausse en route (maquette v2 : le domaine ne touchait plus la récup acquise), corrigée par Nico : le lot a
> été RECONSTRUIT depuis la base, pas empilé sur le prototype.

### 150a. Les règles, depuis septembre 2026

- **Salarié** (injustifiée, personnel, retard — et l'absence sans motif) : rattrapé dans la semaine, heure pour heure ; puis
  repris sur la récup et les heures sup du mois, au taux normal (1h d'absence = 1h de récup, comme le compteur l'a
  toujours fait : 1h sup à 25 % couvre 1h15) ; le reste est **retenu sur salaire**.
- **Domaine** (absence ou journée écourtée, et journée écourtée SANS motif, comptée domaine comme avant) : pareil, puis
  **heures à rattraper** — jamais de retenue ; les prochaines heures sup les comblent.
- **Le salarié passe d'abord** : quand la récup ne suffit pas aux deux, une heure du domaine ne fait jamais retenir une absence.
- **Le paiement vient après** : le mois ne paie que la VALEUR qui reste une fois les absences, ce qui restait à rattraper,
  les heures du domaine et la récup prise servis. Dans cette limite, rien ne change : l'acompte prend les heures à 25 %
  d'abord (§135). Conséquence voulue : une feuille porte une retenue OU des heures sup à payer — jamais les deux.
- **Sans motif** : `autre` depuis septembre = absence injustifiée (libellé ET calcul). Avant septembre : neutre, inchangé.
- **Tout le mois** : un jour à venir sans saisie compte fait aux heures du planning (le moteur le faisait déjà) ; le
  relevé n'est plus provisoire et se signe ; une ligne dit « les jours à partir du X sont comptés aux heures du planning ».
- Ne se rattrapent pas : congé payé, récup, arrêt, formation, événement familial, congé sans solde.

### 150b. Le moteur

- **`_planCompteur`** (mois actifs) : `bes = dette + retire + domaine + indet + récup` ; `bud = (récup acquise + heures
  sup du mois en valeur) − bes` ; le paiement du mois se prend dans `bud`, taux le plus bas d'abord ; ce qui n'est pas payé
  entre au compteur. Puis `retire` (→ `retenue`), puis `comble` (ce qui restait à rattraper, déplacé APRÈS le salarié — il
  était pris à l'entrée), puis le domaine (`tire`, récup d'abord → `compense` → `dette`), puis la récup prise. Avant
  septembre : le `comble` d'entrée, à l'identique. L'invariant `solde − dette = net` tient (le comble s'annule).
- **`PLAN_NET_DEBUT` + `_planNetAt` + `_planAbsMotifAt(e,m,y)`** : borne FIXE — AVANT-1 déplace `PLAN_RECUP_DEBUT` le
  temps d'une lecture (§147) et les absences sans motif de janvier à août doivent rester neutres. Seuls les lecteurs qui
  datent le jour passent par `_planAbsMotifAt` (`_planJourEcart`, `_planDayStatus`, `_planPaieMois`) : les autres ne lisent
  que les drapeaux, identiques pour `autre` et `injustifie`.
- **`_planHsupMois`, la transition** : un jour d'avant la règle ne rattrape plus rien (`totP` et la consommation l'excluent) ;
  la reprise « E » et `dejaRetire` n'avaient plus rien à reprendre — retirés avec leurs lecteurs (⚰️ relevé, écran, carte récup).
- **`_planPaieMois`** : `x.plan` / `P.planDe` (au lieu de `x.futur` / `P.provisoire`, retirés), `P.payeDem` (la demande ;
  `P.payeMois` est ce qui se paie vraiment). **`_planPayeEcrire`** rend le reste quand les absences plafonnent le mois ;
  **`_planPayeMaxTotal`** lit le paiement effectif. ⚰️ **`_planPayeMaxCouvert`** (« sans toucher la récup prise ») : un
  paiement ne peut plus rien découvrir, son maximum était devenu celui du total — deux boutons pour un même nombre.

### 150c. La feuille et l'écran (une seule source, `_pfV3`)

- Verdict : « Retenue sur salaire : Xh. » ou « Salaire de base maintenu. » — plus d'« à préciser ». « À retirer » : ligne
  **Retenue sur salaire** (« aucune » à zéro), congé sans solde, acompte. « À payer en plus » : les quatre taux quand on paie
  (FICHE-3, inchangé) ; sinon UNE ligne — « Aucune heure sup à payer : elles couvrent les absences » / « Aucune heure sup
  payée : elles vont en récup » / « Pas d'heures sup ce mois-ci » — plus les majorations seules.
- « Pour information » : **Absences du domaine** (rattrapées / sur la récup / à rattraper / le mois prochain), absences du
  salarié (… « retenues »), récup restante, et le compteur **Heures à rattraper**, toujours, même à 0h. Payée, la majoration
  seule n'y est plus répétée ; « gardées en récup : 0h » non plus.
- Relevé : « non payée(s) » → « retenue(s) » ; journée écourtée sans motif → « Écourtée par le domaine » ; la case « J'accepte
  que … sinon retenue » devient une mention sans case (la reprise est d'office) ; la demande dit « il en demandait Xh : les
  absences passent d'abord » ; « À savoir » réécrit ; « (heures prévues) » → « hors heures sup » (et à la compta).
- Mode provisoire RETIRÉ partout : bandeaux, « à ce jour », jours grisés, semaines « à venir », signature hachurée ;
  CSS `.prov`, `.sig.non`, `.j tr.fut`, `.pf-prov`, `.pf-jr.pf-fut`.
- Carte de paiement : raccourcis « Aucune », « Tout le mois » (plafonné), « Tout le compteur » ; note « les absences
  passent d'abord » ; toast « Seulement Xh payables ce mois-ci ».
- **Deux pages A4** : mesurées dans Chromium, polices du dépôt, sur les six relevés de référence (Chloé, Nico, Victor ×
  16/09 et 1er/10) et la maquette de Victor. Gagné pour tenir : l'observation « Xh de rattrapage » sur une ligne (au lieu de
  « Xh rattrapent la semaine »), la majoration seule et « gardées en récup : 0h » non répétées. Plus serrée : Nico, 22 px.

### 150d. Les chiffres de contrôle

Victor (données du relevé, août reconstitué à 28h30 sup / 8h30 récup / 20h) : samedi 12 sans motif = injustifié → retenue
**7h30**, **3h30** à rattraper (le 15), aucune heure sup, sa demande de 3h → 0 payable. En arrêt le 12 : 3h sup absorbées,
ni retenue ni paiement, 3h15 à rattraper. Mois « domaine » (11 et 15 écourtés, rien d'autre) : 5h30 reprises sur 20h de
récup → 14h30, rien à rattraper. Contre-épreuve (présent, 10h sup) : 3h payées à 25 %, aucune retenue.

### 150e. Les harnais

`mv-harnais-recup` : **345 assertions** (X1–X14 : retenue XOR paiement, `_planPayeEcrire` qui rend le reste, maximum payable
réel, domaine sur la récup, salarié d'abord, compteur à rattraper toujours affiché, sans motif septembre/août, 31 août, récup
non couverte sans paiement) ; N, R, U, V relus (18h demandées → 12h payées ; plus de provisoire ; « retenues »).
**51 contre-épreuves** : 9 neuves ou refaites (paiement avant les absences, récup qui ne reprend plus le domaine, domaine
avant le salarié, transition SEM-1 réintroduite, bascule sans motif suivant AVANT-1, « non payées », case à cocher, jours
à venir tus, sans motif neutre) ; ⚰️ deux retirées avec `_planPayeMaxCouvert`, une avec la reprise « E ».
`mv-harnais-semaine` : Nico 5h (son 9, sans motif, est injustifié), Victor 0h, compteurs recalculés à la main (Nico 27h15 :
+ 2h45 de majoration du dimanche 13 qui rattrape sa semaine ; Victor 5h45 retenues, 3h30 à rattraper, rien payé).
`mv-harnais-releve` 96/96 ; jetons : la graisse du petit texte en `normal` (400 comptait hors des trois pas).
`npm run check` vert (préflight C1–C22, tous les harnais, contre-épreuves) ; `vite build` puis **`test:smoke` OK** (démarrage,
23/23 globaux — le Chromium de Playwright-node pointé sur celui du bac à sable). `SECTIONS` 179 → **182** : +§150, et le
rattrapage de §148 et §149, non relevés dans leur lot.

### 150f. Ouvert, et dit

① **Régularisation** : la feuille partie le 24, un jour qui change ensuite n'était pas reporté sur le mois suivant (aucune
trace de ce qui avait été envoyé) — ✅ réglé par **§151 (FIGE-1)**. ② La **majoration du
dimanche** payée reste à côté d'une retenue (ce ne sont pas des heures sup) — question posée à Nico, sans réponse.
③ La compensation d'une semaine sur l'autre, en valeur, est celle d'un temps annualisé : à faire valider par le comptable
avec le régime 25/50 et le report au 31 décembre (§142). ④ Baisses de cliquets non regravées (icônes −18, échelle −3,
C24b 24 → 21, rayons 194 → 193) : à regraver après vérification. ⑤ `test:e2e` et un vrai téléphone, chez Nico : la feuille à imprimer depuis le téléphone, en fin de mois.

## 151. ★★ FIGE-1 — FIGER À L'ENVOI : CE QUI CHANGE ENSUITE PASSE AU MOIS SUIVANT (19/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.40 → **7.41** · SW 8.05 → **8.06**)

> Ouvert ① de §150f. Nico : *« un jour qui change après l'envoi […] bien sûr que si, si je fais des heures sup, ça va
> gonfler mon taux d'heures sup ; s'il y a des absences, ça va diminuer sur le mois d'après »* — juste pour le solde (les
> heures en plus vont au compteur, le domaine aux heures à rattraper). Faux pour deux cas : une retenue née après l'envoi
> tombait sur un mois déjà payé, et une absence qui mangeait des heures sup déjà payées faisait BAISSER après coup le
> paiement du mois (le compteur remettait en stock des heures versées). Puis : *« on fige à l'envoi ce qui a été payé et
> retenu pour le reporter sur le mois suivant. Ajoute juste un bouton pour figer »*. ⚠️ §150 n'est pas poussé
> (`origin/main` = `d099fe5`) : ce lot s'empile dessus, le zip livré contient les deux.

### 151a. Le bouton et l'instantané

Fiche › Résumé › carte **Envoi à la compta** (admin, mois ≥ septembre 2026) : **Figer {mois}** → `planFicheFiger` pose
`PLANNING_HSUP[nom][AAAA-MM].fige = {le, payes:[{taux,nat,brut}], retenue, maj:[{taux,nat,h}]}` (`_planFigeInstantane` :
le paiement du mois par taux, la retenue de la feuille, la majoration seule en mode payé), sauvé comme le reste de
`planning_hsup`. Figé : la carte dit la date, ce qui a été payé et retenu, ce qui a changé depuis, et **Défiger**
(`planFicheDefiger`) ; la carte de paiement devient une ligne sans commandes et `_planFichePayer` refuse ; le relevé écrit
« Transmis à la compta le 24/09/2026 » ; l'en-tête du cadre (écran et papier) dit « Septembre 2026 · figé le 24/09/2026 »
— dans l'en-tête et pas en ligne : la page 1 de Nico n'a que 22 px de marge.

### 151b. Le moteur (`_planCompteur`)

- **Mois figé** : son paiement est un FAIT — repris tel qu'il est parti, taux par taux ; des heures sup défaites après
  l'envoi (une absence qui les rattrape dans la semaine) ont été payées quand même : leur valeur (`trop`) sort du
  compteur d'abord, avant les absences. Sa retenue affichée est celle de l'instantané (`P.nonPayees`), la vive est gardée
  à part (`P.nonPayeesVive`).
- **L'écart** `rep = retenue vive (absences, report reçu, trop et paiement pris au compteur non couverts) − retenue figée`,
  plus, en mode payé, l'écart de la majoration seule (en plus → `repMaj`, payée le mois suivant ; en trop → ajoutée à
  `rep` en valeur). Il passe au mois SUIVANT : `reportRet` (> 0) rejoint les besoins du mois — il attend son paiement
  (`bes`) et se reprend sur la récup et les heures sup APRÈS les absences du mois (`reportRetNC` = retenu) ; `reportRendre`
  (< 0) se rend d'abord sur la retenue du mois (`rendu`), le reste est « à rendre » (`aRendre`, dans « À payer en plus »).
  Chaîne : un mois suivant figé à son tour prend l'écart dans son instantané, et ainsi de suite.
- Sans instantané : rien ne change (`garde` remplace `sup − paye`, même valeur). L'invariant `solde − dette = net` tient
  (les parts couvertes du report et de `trop` entrent dans `T.dues`).

### 151c. Le harnais

`mv-harnais-recup` : **358 assertions** (Y1–Y13 : instantané daté, absence couverte par la récup → rien ne passe, tout payé
puis absent → 7h sur octobre, retenues sans heures sup, reprises par les 9h sup d'octobre avant paiement, arrêt après
l'envoi → 7h rendues, cadre d'octobre et de septembre, défiger, figé sans changement = mêmes chiffres, invariant, date sur
le relevé) ; **56 contre-épreuves** (5 neuves : repaiement selon le compteur, écart gardé sur le mois, report retenu
sans passer par les heures sup, retenue de trop pas rendue, retenue figée recalculée ; 2 ancres recalées).

### 151d. Ouvert, et dit

① Un congé sans solde ajouté après l'envoi n'entre pas dans l'écart (jour neutre, hors compteur). ② Le paiement pris au
compteur (`paye_bank`) d'un mois figé n'est pas dans l'instantané : il ne peut plus changer (paiement bloqué), et ce que
le compteur ne couvre plus passe dans l'écart. ③ Les ouverts ② à ⑤ de §150f restent.

## 152. ★★★ VOL-1 — UNE CUVE CONTIENT CE QU'ON Y A MIS, PAS SA CONTENANCE (19/09 — `cave.js` · `utils.js` · `app.js` · `index.html` · `sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-vol1.mjs` (neuf) · `scripts/mv-harnais-intrants.mjs` · `scripts/mv-harnais-cuv13.mjs` · `package.json` · APP 7.41 → **7.42** · SW 8.06 → **8.07**)

> Nico, capture de la carte « De la récolte à la bouteille » (Le millésime › Les courbes), cuvée Ruchottes :
> Récolte 480 kg · En cuve **5 hL** · Après élevage **2,8 hL** (−44 %). *« Il faut indiquer les kilos récoltés en fonction
> du nombre de caisses (estimation, ici c'est ok), ensuite ce n'est pas la contenance de la cuve qui est à mettre mais le
> nombre d'hectolitres estimé en fonction de la règle de calcul de rendement indiquée, puis ce qui est réellement entonné
> (et non la taille du fût). Vérifie aussi que cette règle s'applique bien partout. »* Il demande aussi l'**assemblage**
> (compléter un fût non rempli avec le jus d'une autre cuve, depuis Le Chai, en touchant le fût) : c'est **ASM-1**, à
> maquetter — sa réponse à la question posée : *« le jus peut venir d'une cuve pas encore décuvée »*. Audit rendu d'abord,
> puis « relis les fichiers et go », « Continuer ». Base `85f0959` (NET-1 + FIGE-1 poussés entre-temps, planning seul).

### 152a. La seule porte — `_vendVolContenu(c, exclId)`

- **Décuvée** : `_vendVolLoge` (mesuré, ou d'après les contenants remplis). **Avant** : les kilos du domaine à la règle du
  Cuvier (`_vendHlKg`, kg/hL — la moyenne de la fourchette de la roue crantée), **moins `_vendSortiesHl`** (les saignées).
  **Sans caisse rattachée** : `{hl:0, src:'aucun'}` — une cuve où l'on n'a rien mis ne contient rien.
- Arrondi au centième : les feuilles recopient ce chiffre dans une case, et la source « saisi » se déduit en comparant la
  case au repère (§71d). `exclId` = la récolte en cours de correction (même règle que `_vendCuvKgDom`).
- `_vendSortiesHl` est l'endroit où ASM-1 retirera le jus prélevé dans une cuve non décuvée.
- ⚠️ `volume_hl` **reste la contenance**, et n'est plus lu que comme telle : jauge (`_cuveCouches`), parc, refus « plus que
  la cuve », fusion, formulaire de la cuve, et le point de départ de la **proposition** de fûts d'une cuve SANS caisse — la
  feuille l'écrit « (contenance de la cuve) », aucun volume n'est enregistré dessus.

### 152b. Partout — les lecteurs qui prenaient la contenance (ou la taille des fûts) pour du vin

| où | lisait | lit |
|---|---|---|
| carte « De la récolte à la bouteille » (Le millésime ; Le Chai › Bouteilles) | En cuve = `cv.volume_hl` ; Après élevage = `_caveVolHl` (fûts pleins) | Récolte kg → En cuve estimé → **Entonné mesuré** (sinon pointillé) → Bouteilles |
| feuille Chaptalisation | contenance pré-remplie | contenu + source déduite (`vop-volsrc`), `vol_src` écrit |
| intervention groupée (tournée) : chaptalisation, SO2, intrants | `_vendIntrVol` = contenance avant décuvage, **sans case pour corriger** | contenu ; sans caisse : `volume_hl` et `kg_sucre` à `null` |
| SO2 du Cuvier | la dose seule — le registre multipliait par la contenance | case « Volume sulfité » + grammes de SO2 (`_vendSo2Calc`) ; `volume_hl` et `vol_src` écrits |
| registre des manipulations (repli des opérations sans volume, colonne volume, total de SO2) | `c.volume_hl` | `_rmVolRepli` : les caisses d'abord (une opération du Cuvier se fait pendant la vinification), le décuvé à défaut, sinon rien |
| tanins, enzymes, bentonite | contenance « dite comme telle » | contenu ; case vide sans caisse ; `volume_hl` à `null` plutôt que 0 |
| saignée | retranchait `volume_hl` (la jauge MONTAIT après une saignée) | `cap_intacte:true` : se retire du contenu ; une saignée d'avant ce lot rend la contenance quand on la corrige ou la supprime |
| carboglace (abaissement estimé) | contenance | contenu |
| liste des cuves décuvées | « `volume_hl` hL → Le Chai » | `_vendVolLoge` (+ « mesurés ») |
| rattacher une récolte (« X hL en place ») | contenance | `_vendDedansTxt` (hors récolte en correction) |
| plan de cuverie (jauge) | logé, ou kilos sans les saignées | `_vendVolContenu` |
| feuille Décuver (estimation) | kilos sans les saignées | `_vendVolContenu` |
| cahier de cuverie | « Volume » = contenance ; total = somme des contenances ; tri « Volume » | « Contenance » + « Volume estimé (N kg) » ou « Décuvé » ; total = contenus ; tri « Contenance » (clé `volume` gardée) |
| Le millésime, millésime d'avant le Cuvier (bilan figé) | `bilan_perte.cuveHl` (contenance) comme décuvé — et le rendement moyen avec | l'entonné figé, sinon les contenants à la mise |
| mise en bouteille (`bilan_perte`) | `{recolteKg, cuveHl, eleveHl}` | `{recolteKg, estHl, entonneHl, entonneSrc, eleveHl}` |
| pied du parcours du millésime | « rien n'est estimé sauf la projection » | les deux premiers étages sont des kilos convertis |

★ **Le plus grave, trouvé en vérifiant « partout »** : la tournée chaptalisait sur la contenance, sans case. Rendu dans
Chromium sur les vraies fonctions, Ruchottes (480 kg, cuve de 5 hL), +1° : **6,0 kg de sucre**, contre **8,4 kg** avant —
40 % de trop, en pleine vendange. Les chaptalisations déjà enregistrées **gardent leurs kilos** (des faits écrits) :
« Quoi de neuf » demande de relire celles de la vendange.

### 152c. La chaîne, dans le détail

- `_caveBilanChaine` : le vivant d'abord (`_caveCuveSource`), le figé en repli — une mesure saisie après la mise se voit,
  une cuve supprimée n'efface pas ce qui était figé. `estHl` **n'est pas arrondi** : arrondi à 3,56, il donnait 475 cols
  face aux 474 des kilos — une perte à l'envers (vu au premier rendu).
- `_caveBtlGraphSvg` : barres = kilos, estimation, entonné **mesuré**, bouteilles. Entonné non mesuré (`vol_decuve_src`
  absent ou `'contenants'`) = trait tireté au sol et « à mesurer », jamais la taille des fûts. L'écart se lit sur la
  dernière barre **dessinée** ; 0 ne s'écrit pas (des kilos à leur estimation, c'est une conversion) ; un gain s'écrit
  « +N % » ; l'échelle suit la plus haute barre.
- `_pcrbChaine` : compte les barres qui se dessinent (≥ 2 pour montrer la carte) ; la note dit d'où vient chaque étape (et
  la règle en kg/hL) ; **« Saisir le volume entonné »** (`.pcrb-act` + `.pcav-act`) ouvre `_vendDvolCorriger` sur la cuve
  décuvée, qui repeint `renderCave()` quand on vient d'ailleurs que du Cuvier.
- « Après élevage » disparaît : c'était `_caveVolHl`, les fûts comptés pleins. Une cuvée embouteillée **sans cuve source**
  (la `cuv0` de la démo) n'a plus qu'une étape : pas de graphe, la phrase « liez la cuvée à sa cuve » reste.

### 152d. Ce qui ne bouge pas, et pourquoi

- **Les volumes du Chai** (en-tête, carte, fiche, Bouteilles « hL élevés » et bouteilles théoriques, « En élevage » du
  millésime, bilan de campagne « au chai ») lisent toujours `_caveVolL` : fûts comptés pleins + cuves. Les corriger demande
  de savoir qu'un fût n'est PAS plein — c'est le « fût en creux » d'ASM-1, qui va avec l'assemblage.
- Les `vol_src:'estime'` écrits avant ce lot désignaient la contenance : le registre les imprime « (estimé) » comme avant.
- `_vendOpDet` (résumé des opérations d'une cuve) ne dit que la dose d'un SO2 ; le registre, lui, dit les grammes.

### 152e. Les harnais

`scripts/mv-harnais-vol1.mjs` — **48 assertions, 19 contre-épreuves**, dans `check` et `prebuild` (`npm run test:vol1`),
sur les VRAIES fonctions de `cave.js` et le socle de graphe d'`utils.js` : A la porte, B la chaîne (le cas Ruchottes),
C le registre, D les écrans et écritures (code lu sans ses commentaires), E l'aide, le guide, « Quoi de neuf », la démo.
★ **Deux contre-épreuves n'ont pas mordu au premier passage — c'étaient les MUTATIONS qui ne recréaient pas le défaut**
(l'une retirait toutes les étiquettes au lieu d'écrire « +0 % » ; l'autre gardait la condition même qu'elle devait
défaire). Corrigées, pas les assertions. Une contre-épreuve se relit comme un test : elle peut être fausse.

Existants : `intrants` — sa §5 gravait « c'est la CONTENANCE qui sert de repère » : **l'ancienne règle, réécrite, pas
contournée** (61/61) ; extraction élargie, deux bouchons de données (réglage du Cuvier, kilos d'une récolte) ; C1 réancré,
C1b/C1c neufs ; ★ C6 mutait la PREMIÈRE occurrence de « (estimé) » — la chaptalisation et le SO2 la portent désormais
avant les intrants : la mutation tombait à côté ; elle les prend toutes (12/12). `cuv13` extrait les deux fonctions neuves
(43/43, contre 12/12).
★ Trouvés morts, **hors chaîne**, laissés : `mv-harnais-rendement` plante sur la base intacte (`_vendRdtMax is not
defined`) ; `mv-harnais-cuvier-correction` (mort depuis §81) grave encore la saignée qui mange la contenance.

### 152f. Rendu

`/home/claude/lot/rendre-vol1.mjs` et `feuille-vol1.mjs` (hors dépôt) : les fonctions EXTRAITES, `styles.css`, le CSS
injecté par `_pcavInjectCss`, les polices du dépôt, dans Chromium. ★ Le même banc sur le code de la base reproduit la
capture de Nico au chiffre près (474 · 5 hL · 373 −44 %) : c'est ce qui prouve que le banc lit le vrai code. Après : 474 ·
474 · Entonné « à mesurer » + bouton ; mesuré 2,5 hL : 333 −30 % ; 320 bouteilles : −4 %. Feuille d'opération : SO2
3,56 hL et 10,7 g pour 3 g/hL, source « estimé » puis « saisi » ; chaptalisation 3,56 hL et 6,0 kg ; saignée : contenance
5 intacte, contenu 3,56 → 3,06 → 3,56 à la suppression ; une saignée d'avant ce lot rend 1 hL de contenance ; cuve sans
caisse : case vide et « saisissez le volume ». Aucune erreur.
⚠️ Vu en passant, **pas touché** : le graphe de la chaîne défile de 34 px sur la largeur de la carte, en 390 comme en
760 px — **à l'identique sur la base**. `_mvGraphW` mesure le `clientWidth` de `.pcrb-g`, padding compris (`margin:0 -14px;
padding:0 14px`) : toutes les cartes des courbes sont concernées.

### 152g. Note de livraison

**Base `85f0959`. APP 7.41 → 7.42 · SW 8.06 → 8.07.** Fichier par fichier :
`src/cave.js` (la porte, les lecteurs du tableau, la chaîne) · `src/utils.js` (version, « Quoi de neuf » 7.42 — trois
entrées —, quatre entrées d'aide, une info des courbes) · `src/app.js` (la cuve décuvée de la démo porte un volume
mesuré) · `index.html` (les quatre affichages de version) · `public/sw.js` (en-tête, changelog, `CACHE_NAME`, les deux
`console.log`) · `guide/08-cave.html` + `public/guide.html` (régénéré par `node scripts/build-guide.mjs`) ·
`scripts/mv-harnais-vol1.mjs` (neuf) · `scripts/mv-harnais-intrants.mjs` · `scripts/mv-harnais-cuv13.mjs` ·
`scripts/harnais-claude-md.mjs` (SECTIONS) · `package.json` (`check`, `prebuild`, `test:vol1`) · `CLAUDE.md` · `.mv-base`.
★ `npm run check` joué **en entier** sur l'état livré (vert) ; `npx vite build` (30 s) puis `test:smoke` — démarrage OK,
23/23 globaux, aucune exception (Playwright 1.61 : `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, liens vers le 1194, §149a) ; `test:e2e`
non joué (émulateurs Firebase).
Puis `npm run build && firebase deploy --only hosting`.

### 152h. Ouvert, et dit

① **ASM-1** : maquette à faire — le fût en creux (le volume entonné mesuré sous la contenance des fûts), « Compléter ce
fût » depuis Le Chai en touchant le fût ; source : une cuvée du Chai **ou une cuve pas encore décuvée** (Nico) — le jus
prélevé sort de son contenu (`_vendSortiesHl`) et doit être **rajouté** au rendement de ses parcelles ; la composition
reste visible. ② Les volumes du Chai (152d) suivront ASM-1. ③ Le défilement de 34 px des graphes des courbes (152f).
④ Les deux harnais morts (152e). ⑤ `test:e2e` et un vrai téléphone, chez Nico.

## 153. ★★★ ASM-1 — LE FÛT ENTAMÉ SE COMPLÈTE DEPUIS LE CHAI · VOL-2 — LE kg/hL DE CHAQUE ÉTAPE (19/09 — `cave.js` · `utils.js` · `index.html` · `sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-asm1.mjs` (neuf) · 4 harnais adaptés · `package.json` · APP 7.42 → **7.43** · SW 8.07 → **8.08**)

> Nico, 19/09 : *« il faut aussi pouvoir faire un assemblage (c'est-à-dire prendre du jus d'une autre cuve pour compléter
> un fût non rempli ; l'idéal est de pouvoir le remplir par le Chai en cliquant sur le fût concerné) »* — à la question
> posée : *« le jus peut venir d'une cuve pas encore décuvée »* — puis, sur la chaîne : *« il serait intéressant
> d'indiquer le kg/hL du rendement sur chaque étape sur le graph »*. Maquette (5 onglets, CSS réel exécuté, graphes de
> la fonction proposée) → « go » → « Continuer ». **VOL-1 (§152) n'est pas poussé : `origin/main` = `85f0959`, ce zip
> contient les deux.**

### 153a. Le fût entamé — `manque_l`, `_caveManqueL`, et le Chai qui compte le vin réel

- Une cuvée garde ce qui MANQUE dans ses fûts : `manque_l` (litres). **Écrit au décuvage** quand le volume est MESURÉ
  (`F − max(0, M − C)` : fûts, mesure, cuves de la cuvée) — 0, écrit, sinon ; **suivi** quand on corrige le volume
  décuvé (`_vendDvolCorriger` reporte l'écart, et enregistre alors le Chai aussi) ; **rendu** par « Compléter le fût ».
- Absent (cuvée décuvée avant ce lot) : `_caveManqueL` le **déduit** de la mesure du décuvage — seulement si la cuvée
  n'a pas de cuve (le volume de sa cuve a pu bouger depuis : on ne devine pas). Sans mesure : 0, les fûts comptent
  pleins comme avant. Plafonné aux fûts.
- ★★ `_caveVolL` = fûts + cuves **− ce qui manque**. C'est la porte « combien de vin » de §20 : carte, fiche, en-tête,
  bouteilles théoriques, « En élevage » du millésime, bilan de campagne suivent sans autre retouche. `_caveFutsL` (le
  BOIS : part des anges, ouillage, pyramide) ne bouge pas. C'était le « ② » de §152h.
- Démo : la cuvée « Vieilles Vignes » (22 fûts de 228 L, 50 hL mesurés depuis VOL-1) montre d'elle-même « 1 fût
  entamé · il attend 16 L ».

### 153b. Compléter le fût — la feuille et ce qu'elle écrit

- **Où** : la carte du Chai (`_asmCarteHtml`, sous la ligne des contenants — le bouton arrête la propagation : toucher
  le fût n'ouvre pas la fiche) et la fiche, section Contenants (le DERNIER lot porte le fût entamé : le manque est
  connu à la maille de la cuvée, §20e). En lecture seule : visible, pas touchable.
- **Sources** (`_asmSources`) : les cuves du Cuvier qui contiennent du vin — **même pas encore décuvées** (Nico) ; ni
  décuvées (même si leur statut dit autre chose), ni terminées, fusionnées, préparées ou vides — puis les cuvées du
  Chai en élevage, ni elle-même ni les embouteillées. Chacune dit ce qu'elle contient et ses appellations (parcelles
  de ses caisses).
- **Litres** : ce qui manque est proposé ; ±5 L et un champ ; refus en mots (`_asmRefus`) : pas de source, pas de
  litres, plus que le fût n'attend, plus que la source n'a. `_asmValider` ne relit PAS le DOM (trois variables).
- **Aperçu** : ce que devient le fût, la composition, la part d'une **autre appellation** ou d'un **autre millésime**
  (en pourcentage — l'appli ne tranche pas ce que la réglementation permet), ce que devient la source.
- **Écrit** : cuvée → `manque_l −= L`, `apports[]` (`{id,date,l,de,de_type,de_id,mil,aoc}`) ; cuve du Cuvier → une
  opération `prelevement` (`volume_hl`, `vers`, `asm_id`) ; cuvée du Chai → sa cuve baisse (la plus pleine), ou, sans
  cuve, l'un de ses fûts devient entamé ; au Chai, une opération `assemblage` (`cuvees_ids:[cuvée complétée]` — le
  registre et le filtre millésime la rattachent au bon vin ; `data.sources`, `volume_hl` : le type `assemblage` des
  Pratiques de cave de `RM_TYPES` l'imprime « depuis Cuve 7 (Gevrey VV 2026) · 0,3 hL réunis »). `_vendFbSave` sur le
  ou les deux magasins.
- **Défaire** : supprimer la ligne du journal (`deleteCaveOp` → `_asmDefaire`, bouton « Défaire ») remet tout — le fût
  redevient entamé, l'apport sort de la composition, le prélèvement quitte sa cuve, la cuve du Chai remonte. Un
  assemblage ne se « modifie » pas (pas de crayon, aux deux journaux). La cuvée où l'on a puisé le voit dans sa fiche.

### 153c. La source du Cuvier : sortie du contenu, gardée au rendement

`_vendSortiesHl` compte saignées **et prélèvements** (le contenu estimé baisse) ; `_vendPrelevHl` les RAJOUTE au
rendement — `_vendVolCuve` (parcelles) et l'étage « décuvé » du parcours du millésime : ses raisins ont produit ce
vin. Le prélèvement a un nom et un détail au Cuvier (`_vendOpLbl`, `_vendOpDet` : « 0,3 hL → Ruchottes 2026 »), n'est
**pas** dans `_VEND_OPS` (il ne se choisit pas dans la feuille), et `openVendOp` refuse de le corriger : il se défait
au Chai.

### 153d. VOL-2 — la chaîne

- **kg/hL sous chaque étape** : les kilos récoltés ÷ les hectolitres de l'étape. En cuve, c'est la règle (135) ;
  entonné, ce que le pressoir a donné (Ruchottes : 192) ; en bouteilles, le bout (200 pour 320 cols). Rien sous
  « Récolte ». Hauteur 168 → 180 px pour la troisième ligne.
- **L'apport** (ASM-1) s'empile en pointillé sur l'entonné (« 333 +40 ») : ni dans le kg/hL, ni dans l'écart
  de l'entonné ; les bouteilles se comparent à TOUT l'entonné, et leur kg/hL se calcule sur la part de la cuvée.
- ★★ **Un id de dégradé par graphe** (`_CAVE_BTL_GID`) — et un id de découpe par fût dessiné (`_ASM_GID`). `mvbgd`
  était fixe : **trouvé sur la maquette** — la vue masquée qui porte le premier `mvbgd` du document emporte les barres
  des autres. Dans l'appli : #mvc-elevage (Chai › Bouteilles) précède #cave-view-mil dans le DOM ; après un passage
  par Bouteilles avec une cuvée embouteillée, les barres de la chaîne de Le millésime › Les courbes disparaissaient.
- `_caveBilanChaine` rend `apportHl` ; la note de la carte dit le kg/hL, et l'apport s'il y en a un.

### 153e. Le vrai code, rendu — et ce qu'il a trouvé

- **Maquette** (hors dépôt, validée) : le défaut du dégradé ci-dessus.
- **Essai de bout en bout** (hors dépôt, `/home/claude/lot/e2e-asm1.mjs`) : l'appli COMPILÉE (`dist/`), Chromium,
  réseau extérieur coupé, un jeu posé en mémoire comme la visite guidée, puis on TOUCHE l'écran : la carte (« 1 fût
  entamé · 250 L sur 280 · il attend 30 L »), la feuille (pas la fiche), la source, −5 L puis +5 L, « Compléter »,
  la carte (2,8 hL, « dont 30 L de Cuve 7 (Gevrey VV 2026) · 11 % », plus de fût entamé), le journal (sans crayon),
  la fenêtre « Défaire », tout revient. Aucune erreur.
  ★ **Il a trouvé ce que la maquette ne pouvait pas voir** : la feuille empruntait les styles du Cuvier (le bouton
  d'enregistrement) — ouverte depuis Le Chai sans passage par Le Cuvier, le bouton sortait brut. `_asmOuvrir` injecte
  maintenant `_vendInjectCss` aussi. Et le champ des litres gardait `width:100%` (`.mvv-tin`, posé après) : style à
  deux classes. **Une maquette qui injecte tout le CSS ne voit pas un style manquant ; l'appli compilée, si.**

### 153f. Les harnais

`scripts/mv-harnais-asm1.mjs` — **48 assertions, 17 contre-épreuves** (check, prebuild, `npm run test:asm1`) : A le
fût entamé, B les sources, C compléter depuis le Cuvier (registre compris, et le rendement à 40,3 hL après un
décuvage à 40), D les refus, E depuis le Chai (cuve, fûts) et le défaire, F défaire, G la chaîne (kg/hL, apport,
dégradé unique), H la carte, I le Cuvier, J décuvage et correction, K les journaux, L l'accompagnement.
★ La contre-épreuve B2 (« une cuve décuvée proposée ») n'a pas mordu : le jeu excluait la cuve par son statut
« terminée » AVANT la garde du décuvage — elle ne testait rien. Le jeu a maintenant une cuve décuvée au statut resté
« MPF » (un parcours corrigé), et une terminée à part. La garde est gardée : défensive, et désormais prouvée.
Adaptés : `vol1` (extraction `_caveManqueL`, la variable du dégradé, une ancre), `futcap` et `vendange-parts`
(extraction — `_caveVolL` appelle `_caveManqueL`, `_vendVolCuve` appelle `_vendPrelevHl`), `intrants` inchangé.

★★ **Le poids : `cave.js` est au plafond.** `mv-harnais-typo` a rougi deux fois : 1 034 ko (> 1 024, le plafond
absolu) et +7 % en un lot (965 → 1 034 ; VOL-1 et ASM-1 livrés ensemble). **Le découpage a été examiné et écarté pour
ce lot** : le bloc ASM-1 vit des internes du Cuvier et du Chai (`_vendSheet`, `_vendVolContenu`, `_caveManqueL`,
`_caveGroupesL`, `_rmMilCuve`… une vingtaine) — un module à part devrait les exposer sur `window` (la même raison qu'en
§145d) ; et déplacer du code existant casse chaque harnais qui l'extrait de `src/cave.js` par son nom. Ce qui a été
fait : les **commentaires AJOUTÉS par VOL-1 et ASM-1 ont été condensés** (38 blocs ramenés à une ligne qui renvoie à
§152/§153, qui gardent le pourquoi ; 11 ko), aucun commentaire d'avant n'a été touché — **1 023 ko**. Référence du
cliquet regravée (`scripts/typo-baseline.json`) ; le regravage enregistre aussi `utils.js` 588 → 605, `planning.js`
558 → 576, `firebase.js` 153 → 155, `reserve.js` 100 → 103, `styles.css` 417 → 418, venus d'autres lots et sous la
tolérance. ⚠️⚠️ **Il reste 1 ko : le prochain lot qui touche `cave.js` commence par le découper** (§153h ⑥).

### 153g. Note de livraison

**Base `85f0959` ; le zip contient VOL-1 (§152) et ce lot. APP 7.41 → 7.42 → 7.43 · SW 8.06 → 8.07 → 8.08.**
Fichier par fichier : `src/cave.js` · `src/utils.js` (version, « Quoi de neuf » 7.43 — trois entrées —, l'aide : une
entrée neuve et la chaîne, l'info des courbes) · `src/app.js` (VOL-1 : la démo) · `index.html` (les quatre versions) ·
`public/sw.js` · `guide/08-cave.html` + `public/guide.html` (régénéré) · `scripts/mv-harnais-asm1.mjs` (neuf) ·
`scripts/mv-harnais-vol1.mjs` · `scripts/mv-harnais-futcap.mjs` · `scripts/mv-harnais-vendange-parts.mjs` ·
`scripts/mv-harnais-intrants.mjs` · `scripts/mv-harnais-cuv13.mjs` · `scripts/harnais-claude-md.mjs` (SECTIONS) ·
`scripts/typo-baseline.json` (poids regravé) · `package.json` · `CLAUDE.md` · `.mv-base`.
`npm run check` joué en entier sur l'état livré ; `npx vite build` puis `test:smoke` ; l'essai de bout en bout ci-dessus ;
`test:e2e` non joué (émulateurs). Puis `npm run build && firebase deploy --only hosting`.

### 153h. Ouvert, et dit

① **Un soutirage qui laisse un fût entamé** (les lies parties) : la case « volume après soutirage » serait le lot
suivant ; aujourd'hui un soutirage ne touche pas `manque_l`. ② Retirer ou ajouter un fût (« Modifier la cuvée »,
retrait) ne recalcule pas le manque — il reste plafonné aux fûts. ③ L'export CSV des opérations du Chai ne propose pas
le type « assemblage » (le registre, oui). ④ Le défilement de 34 px des graphes des courbes (§152f) reste. ⑤ Les deux
harnais morts de §152e restent. ⑥ ★★ **`cave.js` : 1 023 ko sur 1 024** — le prochain lot Cave commence par le
découper. Piste : Le Cuvier (`_vend*`, `_vt*`, `_cuv*`) dans son propre module, sa surface `window` décidée d'avance, et
les harnais qui extraient de `src/cave.js` repointés dans le même lot.

## 154. ★★★ PAIE-1 — « POUR LA COMPTA » : CE QUE LA COMPTA SAISIT, EN GROS ; LA DEMANDE EST UN TOTAL ; LE SALARIÉ D'ABORD, AUSSI DANS LA SEMAINE (19/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.43 → **7.44** · SW 8.08 → **8.09**)

> Nico : *« j'ai l'impression qu'il y a encore des bugs dans planning par rapport aux heures à 25, aux heures à 50, aux
> récupérations, aux absences. Et la façon dont c'est affiché pour la paye, je trouve que c'est pas clair : les infos
> importantes sont marquées en petit, les infos pas importantes un peu trop grosses […] que ça ne demande aucune ressource
> cognitive pour la lecture de ce document »*. Audit, puis maquette `maquette-paie1-pour-la-compta.html` (avant / après
> rendus par le vrai code, quatre cas — Victor, Nico, Chloé et un cas inventé complet —, papier pages 1 et 2, écran, onglet
> Audit), puis « go » : les recommandations sur les quatre points (nom « Pour la compta », taux à 0h retirés, congés en
> jours au planning ; la majoration du dimanche à côté d'une retenue reste ouverte).

### 154a. L'audit, mesuré avant d'écrire

- Les trois relevés de référence (les jours du harnais `semaine`, édités au 19/09) rendus en A4 dans Chromium avec les
  polices du dépôt, puis un **banc de tirages au hasard** hors dépôt : 1 400 mois sur l'ancien code, 1 800 sur le nouveau.
  Invariants : une retenue OU un paiement ; 50 % jamais avant 8h à 25 % ; seaux = heures sup ; payées + gardées = faites ;
  compteur et heures à rattraper qui tombent juste ; absences par cause ; retenue = jours retenus ; restantes = récup
  restante ; récupérées = récup prise + absences (neuf) ; la ligne du mois jamais négative. **Aucune addition fausse** : les
  défauts étaient d'ORDRE et de MODÈLE, pas d'arithmétique.
- ★ Mesuré sur le papier : « Retenue sur salaire » en 9,5 px — le plus petit texte de la feuille — sous trois chiffres de
  17 px (prévues, faites, absences) qui ne s'additionnaient pas : Victor, 145 + 43 ≠ 176, les 12h faites en plus du
  planning n'étaient écrites nulle part.

### 154b. Les défauts trouvés

① **La demande de paiement fondait.** Elle était gardée en deux morceaux : `paye` (le mois, borné aux heures sup) et
`paye_bank` (le reste, converti en temps de récup à la saisie). Quand les heures sup du mois baissaient ensuite — une
absence rattrapée dans sa semaine, ou NET-1 pour Nico —, la part du mois baissait et rien ne passait au compteur. Nico :
30h demandées, 24h30 payées, 27h15 encore au compteur ; test : 30h → 21h, 20h au compteur.
② **Dans la semaine, le domaine passait avant le salarié** : `_planHsupMois` rattrapait dans l'ordre des jours ; la règle
de NET-1 (« une heure du domaine ne fait jamais retenir une absence ») ne jouait qu'au mois. Test : lundi écourté par le
domaine 1h, mardi par le salarié 1h, samedi +1h → 1h retenue.
③ Le relevé de Nico sortait sur **trois pages** (page 2 : 1 179 px pour 1 123).
④ « Récupérées », au détail mois par mois, mêlait la récup prise et les absences reprises : Victor, « 21h45 récupérées »
sans un jour de récup.
⑤ Écran : « Les jours à partir du… » collé au bord du cadre, première lettre coupée (`p.pf-s` sans marge après le pied).
⑥ Carte de paiement : « 0h restent en récup, soit 2h45 de repos » quand tout est payé (la majoration seule comptée dans
`valeurRecup`).

### 154c. Le moteur

- **`_planHsupMois`** : dans la semaine, le rattrapage sert les jours `cpt:'retire'` d'abord, puis les autres, chacun dans
  l'ordre des jours. La consommation des heures en plus reste dans l'ordre des jours : les heures sup et leurs rangs ne
  bougent pas (`_planEstLecture`, qui ne lit que `h25/h50`, est inchangé).
- **`_planCompteur` — la demande est un total.** `paye` = ce qui est demandé, en heures brutes. Le mois paie
  `min(paye, sup)` dans `bud` comme avant ; le reste, `spill = paye − sup`, se prend au compteur APRÈS les absences et la
  récup prise (`tireBrut` : même file que `tire`, converti au taux de la tranche au moment du calcul). `paye_bank` reste
  LU : une saisie d'avant ce lot se relit comme un total (Nico : 10h30 + 19h30 → 30h). Mois figé : `FG.spill`, neuf dans
  l'instantané, est ce que le compteur a payé à l'envoi ; un instantané d'avant ce lot n'en a pas → 0, rien ne bouge ; ce
  que le compteur ne couvre plus après l'envoi (`spillNC`) entre dans `retenueVive`, comme `bankNC`. `r.dem` = tout ce qui
  est demandé ; `P.payeDem` le lit.
- `_planPayeEcrire` écrit le total (`paye = h`, `paye_bank = 0`) et mesure ce qui se paie (`_planPayeEffectif`) ;
  `_planPayeMaxTotal` demande tout et lit. `_planValeurPourBrut` ne sert plus qu'à l'ancien tableau de l'année.
- **Récup prise / absences** : `tire(h, sA | sR)` range ce que chaque consommation prend, en heures brutes (`r.brutAbs`,
  `r.brutRec` ; avant septembre, tout est au taux 0 : récup d'abord, le reste aux heures dues, plus le comble d'entrée).
  `_pfAnnee` rend `recPrise` et `abs` ; leur somme est l'ancienne « récupérées » (harnais Z10, tirages I13).
- `_planHsupTable` (l'écran des mois d'avant septembre, qui liste les douze mois) : pour un mois ≥ septembre 2026, le
  paiement se lit au compteur, sans case — il se règle dans le Résumé.

### 154d. L'affichage — une seule source, `_pfCompta`

- **« Pour la compta »** : une ligne par chose que la compta saisit, toujours dans le même ordre — salaire de base
  (« Retenue de 3h45 » / « Maintenu »), heures sup à payer (une ligne par taux qui a des heures, `span.x`), congés payés
  (jours au planning, dates, heures), arrêt de travail, acompte ; congé sans solde, majorations à payer (mode payé),
  retenue du mois figé à rendre : seulement s'il y en a. « aucun » en gris ; le pourquoi dessous. ★ **Les taux à 0h ne
  s'impriment plus** : FICHE-3 les voulait, Nico a tranché sur la maquette (Q1 réécrit, contre-épreuve inversée).
- **Pour le salarié** : récup restante, heures à rattraper (le chiffre seul, leur origine en petit), heures sup restantes à
  payer (si demande), récup prise, formation, événement familial.
- **La ligne du mois** : prévues = faites + absences − en plus (`enPlus = faites + AB.total + recupNC − prévues`, jamais
  négatif sur 1 800 tirages), puis les heures sup semaine par semaine et les jours comptés au planning.
- Papier : 20 px le salaire de base, 17 px les chiffres, 11 px « aucun », 9,5 px le pourquoi ; deux colonnes (compta
  1,62 fr, salarié 1 fr). Écran : 23 / 20 / 12,5 / 11 px ; le libellé ne se coupe pas, les taux s'empilent à droite.
- Page 2 : « À savoir » en 4 points au lieu de 7 ; la note des heures à rattraper ne garde que ses phrases du mois ; la
  demande n'est plus répétée sous les heures sup (elle est en page 1 et cochée à la signature, avec le DEMANDÉ) ;
  l'acompte seulement s'il y en a ; « Heures sup restantes à payer » : les taux qui ont des heures ; détail de l'année en
  sept colonnes (Récup prise, Absences).
- Carte de paiement : la case montre la demande (`payeDem`) ; « Sur Xh demandées : … » quand moins se paie ; « 0h restent
  en récup » ne s'écrit plus ; la note passe de cinq lignes à trois.
- ★ **Deux choses ne portent plus le même nom** (le piège de §113, trouvé à la relecture) : « Pour la compta » était déjà le
  titre du tableau de RECUP-2 (temps en récup, heures à déclarer, taux — `_planRecupCartes`, visible seulement depuis
  l'écran des mois d'avant septembre, et le bloc du relevé d'avant). Il s'appelle désormais **« À déclarer »** ; la fiche
  d'aide « Pour la compta » et le guide décrivent le cadre du Résumé, et gardent la règle de déclaration (l'heure brute et
  son taux, jamais 1 h 15).

### 154e. Mesuré

- Relevés rendus dans Chromium, polices du dépôt : **deux pages dans les quatre cas** ; page 2 de Nico : 1 179 → 1 000 px
  de contenu ; le cadre de la page 1 prend environ 100 px de moins (Nico : fin du contenu 1 073 → 971 px).
- Septembre, ce qui change (dit à Nico, écrit dans la maquette) : Victor, retenue 5h45 → 3h45, heures à rattraper 3h30 →
  5h30 ; Nico, payées 24h30 → 30h, récup restante 27h15 → 21h45. Chloé et le cas inventé : rien.
- `mv-harnais-recup` : **378 assertions**. 24 réécrites sur le nouveau cadre sans changer un chiffre ; R5 et W1 : la demande
  est un total ; W3b (neuve) : une saisie d'avant ; section **Z** (19) : Z1–Z2 le salarié d'abord, Z3–Z6 la demande en total
  et la saisie d'avant, Z7–Z9 le mois figé, Z10 récup et absences, Z11–Z14 le cadre, écran et papier. **60 contre-épreuves** :
  7 ancres recalées (`tire(…, sA)`), FICHE-3 inversée (« le cadre réimprime les taux à zéro »), FICHE-4 repointée sur
  `spill`, AVANT-1 dédoublée (`tire` et `tireBrut`, W3b pour la première), SEM-3 « l'écran reprend son cadre d'avant » ⚰️
  remplacée par « PAIE-1 · l'écran reprend l'ancien cadre » (la ligne qu'elle mutait ne sert plus qu'aux mois d'avant), 4
  neuves. `mv-harnais-semaine` : 5 chiffres recalés (ceux ci-dessus).
- ★ La section Z était verte au premier passage : ce sont les contre-épreuves qui disent qu'elle mord (1 à 18 rouges
  chacune).

### 154f. La note de livraison

**Base `3cbb7c8`. APP 7.43 → 7.44 · SW 8.08 → 8.09.** `node scripts/build-guide.mjs` (le guide public se régénère, il ne
se livre pas), puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | la demande en total, le salarié d'abord dans la semaine, récup / absences à part, « Pour la compta » (papier et écran), page 2 resserrée, carte de paiement | — |
| `src/styles.css` | le bloc `.pf-cl` / `.pf-sal` du cadre à l'écran | ★ APP · ★ SW |
| `src/utils.js` | APP 7.44, quatre nouveautés, aide du Planning | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | la fiche, le paiement, la semaine, le relevé | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | voir 154e · SECTIONS 186 · base | — |

### 154g. Ouvert, et dit

① La majoration du dimanche payée peut toujours voisiner une retenue (§150f ②), sans réponse. ② Congés payés en jours
au planning : la compta applique sa règle (ouvrables ou ouvrés) — le samedi ouvrable n'est pas compté ici. ③ Vu dans
Chromium (390 px et A4), pas sur téléphone ni sur papier réel ; `test:e2e` à lancer chez Nico (il ouvre la fiche). ④
`_pfCadre` garde, pour les mois d'avant, sa branche `V=P.act?…` devenue inutile (V vaut toujours null après le retour
anticipé) : sans effet, à nettoyer. ⑤ `planning.js` : 576 → 593 ko (+2,9 %), sous le cliquet de 5 % ; le découpage du
relevé en module (§143b) reste à décider avant le prochain gros lot Planning.

## 155. ★★ TIERS-1 — « SCRIPT ERROR. » N'EST PAS UNE ERREUR DE MA VIGNE : PLUS DE TOAST, UNE TRACE QUI DIT D'OÙ ELLE VIENT (19/09 — `app.js` · `sw.js` · `scripts/mv-harnais-tiers.mjs` (neuf) · `package.json` · `scripts/harnais-claude-md.mjs` · APP 7.44 **inchangé** · SW 8.09 → **8.10**)

### 155a. Le signalement, et ce qu'il dit déjà

Admin GT › erreurs, un domaine client, 19/09 à 18 h 04 : `Script error.`, `error` / `runtime`, une occurrence,
**Écrans : —**, **Comptes : —**, **aucun « Détail technique »**. Lu dans le code, chaque tiret parle : `user`
vaut `'—'` sans `currentUser`, `page` vaut `'—'` sans `.page.active` → personne n'était encore entré dans
l'appli (démarrage ou écran de connexion) ; l'écriture a pourtant été acceptée par les rules (`canWrite()`) →
la session Firebase d'un membre était vivante sur l'appareil ; `detail` vide → `e.filename` vide **et**
`e.error` nul.

### 155b. « Script error. » — rejoué, pas supposé

Règle « muted errors » du HTML : une erreur née dans un script d'une **autre adresse**, chargé **sans
laissez-passer** (attribut `crossorigin` + en-tête CORS), arrive au gestionnaire global réduite à
`message = "Script error."`, `filename = ""`, `lineno = colno = 0`, `error = null`. Rejoué dans Chrome 141
(headless, deux serveurs sur deux ports), avec la formule **exacte** du `detail` du gestionnaire :

| Le script qui lève | message | fichier | ligne | `error` | `detail` |
|---|---|---|---|---|---|
| même adresse | `Uncaught TypeError: …` | l'adresse | 1 | objet | rempli |
| autre adresse, sans laissez-passer | `Script error.` | vide | 0 | `null` | **vide** |
| autre adresse, `crossorigin` + CORS | `Uncaught TypeError: …` | l'adresse | 1 | objet | rempli |

Pour Ma Vigne : ① notre code est servi par `mavigneapp.fr` (`/assets/main-….js`, `/boot.js`) → **jamais
effacé** — le rapport du 21/08 (`loginPendingIdx`) arrivait avec fichier et ligne ; ② Leaflet (unpkg) est
chargé avec `crossOrigin='anonymous'` + SRI (`_ensureLeaflet`) → **jamais effacé** ; ③ restent le **script
reCAPTCHA d'App Check** — `loadReCAPTCHAV3Script` (`@firebase/app-check`) insère
`https://www.google.com/recaptcha/api.js` **sans** `crossorigin`, lu dans `node_modules` — et **ce que le
téléphone glisse dans la page** : extension, traducteur, navigateur intégré d'une autre appli. Le CSP n'autorise
aucun autre script tiers (`script-src 'self' 'unsafe-inline'` + unpkg, google, gstatic, recaptcha.net).
⚠️ **Lequel des deux : on ne le sait pas, et aucune relecture du code ne le dira** — le navigateur l'a effacé.

### 155c. Le défaut : un toast anglais que personne ne peut traiter

Le gestionnaire passait tout à `logError` en `error` → toast orange **« ⚠️ Script error. »**, en anglais, ici sur
l'écran de connexion. Même famille que §55 (« un incident réseau n'est pas une panne ») : un message qui alarme
sans rien permettre — ni au vigneron, ni au support.

### 155d. Le correctif (`app.js`, juste avant BOOT-1)

- `_mvErreurMasquee(e)` : `Script error.` (point facultatif, casse libre) **et** ni fichier, ni ligne, ni objet
  `error`. Le même texte AVEC l'un des trois reste une erreur ordinaire.
- `_mvErreurTiers()` : rien à l'écran ; `logError` en `info`, catégorie `tiers` (journal de l'appareil, joint à
  « Signaler un problème ») — **3 par session au plus**, le reste compté dans `window._mvErrTiersN` (le journal
  local garde 50 lignes : un script qui boucle en chasserait les vraies erreurs) ; **la première** part au
  journal du domaine par `fbAppendError` — même patron que l'assertion interne du SDK Firestore.
- `_mvErreurTiersContexte()` : les scripts d'autres adresses présents dans la page (**sans leur requête** : celle
  de reCAPTCHA porte la clé du site ; sans doublon ; 6 au plus, `(+N)` au-delà), le navigateur (160 caractères,
  comme le carnet d'incidents de BOOT-1), appli installée ou navigateur, secondes depuis l'ouverture, onglet
  visible ou non, `APP_VERSION`, rang dans la session. Aucun `try` : l'adresse se lit par expression régulière,
  pas par `new URL` — rien à avaler, rien pour le compteur C14.

★ **Lire la prochaine entrée** : un `chrome-extension://`, `safari-web-extension://` ou `moz-extension://` dans la
liste → une extension. ⚠️ **L'inverse ne vaut pas** : beaucoup d'extensions retirent leur balise `<script>` juste
après l'avoir exécutée — une liste réduite à `google.com` / `gstatic.com` n'innocente pas une extension. La lire
avec la ligne du navigateur : un ordinateur (Windows, Mac) rend l'extension probable — les gestionnaires de mots de
passe injectent justement au moment de la connexion ; `FBAN`, `Instagram`, `GSA`… → le navigateur intégré d'une autre
appli. Une entrée `tiers` isolée, sans autre trace autour : rien à faire, la marquer traitée.

### 155e. Harnais — `scripts/mv-harnais-tiers.mjs` (neuf, dans `check` et `prebuild`)

Le vrai code extrait d'`app.js` (trois fonctions, trois constantes, le gestionnaire entier) et **joué** dans un
contexte `vm` (méthode C20) : **26 assertions** — l'erreur effacée, le rang, la borne locale, l'envoi unique, le
contexte (requête retirée, même adresse exclue, doublon, borne de 6, « aucun », longueur), et l'erreur de notre
code qui arrive comme avant. **`--contre` : 11 défauts réinjectés**, chacun rougit.
★ **La contre-épreuve a démasqué un test faux** : « même texte AVEC un fichier » passait `lineno: 5` — la
condition sur la ligne suffisait à le rattraper, et retirer celle sur le fichier restait vert. Ligne 0, et un
test « AVEC une ligne » à part. Le code était juste ; c'est le test qui ne prouvait rien.
★ **Rejoué dans un vrai Chrome** avec le code extrait : un vrai événement effacé (script d'un autre port, adresse
avec requête) → `info`, `tiers`, l'adresse citée **sans** sa requête ; une erreur de même adresse → `error`,
fichier, ligne, pile.

### 155f. Versions et livraison

`app.js` seul côté appli → **correctif invisible** (§7, cas « identité légale ») : **SW 8.09 → 8.10**,
`APP_VERSION` et `WHATS_NEW` intacts, `index.html` non touché. Base `ebba4de` (`.mv-base`). Déploiement :
`npm run build && firebase deploy`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/app.js` | `_mvErreurMasquee`, `_mvErreurTiersContexte`, `_mvErreurTiers` ; une ligne dans le gestionnaire global | ★ SW |
| `public/sw.js` | 8.10 | ★ SW |
| `scripts/mv-harnais-tiers.mjs` | neuf | — |
| `package.json` | le harnais et sa contre-épreuve dans `check` et `prebuild` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 187 · §155 et §9 · base | — |

### 155g. Ouvert, et dit

① La cause de l'occurrence du 19/09 reste inconnue, et le restera : il faut la suivante, avec son contexte.
② WebKit (iPhone) efface selon la même règle — pas rejoué ici, faute de Safari. ③ `test:e2e` à lancer chez Nico.
④ L'Admin GT dit encore « le niveau info reste local » : vrai pour `logError`, pas pour les deux envois directs
(assertion Firestore, `tiers`) — à reformuler au prochain lot Admin.
⑤ ★★ **Trouvé en marge, le même jour — la preuve de signature s'écrase.** L'occurrence a coïncidé avec la
première ouverture d'un salarié passé admin, qui a dû signer CGU + DPA. Lu dans `acceptTerms` (`claims.js`) : la
preuve s'écrit `_mv_signatures/{slug}` par `set`, UN document par domaine, sans historique → **chaque nouvel admin
remplace la preuve du domaine** (signataire, fonction, empreintes, `user_agent`). Et la porte (`_mvTermsCheck`) le
demande à TOUT admin sans claim `terms` — claim par personne, contrat par domaine —, case « pouvoir d'engager le
domaine » comprise, quel que soit son rôle réel. La preuve d'avant se relit dans les exports natifs quotidiens
(toutes collections, rétention 7 j) et dans le courriel « DPA accepté » de l'époque. **À trancher** : garder
l'historique (jamais `set` sur une preuve) ; qui signe pour le domaine, et ce que voit un admin arrivé après.
→ **Réglé en §156 (SIGN-1)**, sauf « qui signe » (§156g ①).

## 156. ★★★ SIGN-1 — LE CONTRAT EST PAR DOMAINE : UN ADMIN ARRIVÉ APRÈS NE SIGNE PLUS, ET LA PREUVE NE S'ÉCRASE PLUS (19/09 — `functions/claims.js` · `app.js` · `firebase.js` · `sw.js` · `scripts/mv-harnais-signature.mjs` (neuf) · `scripts/mv-signature-restaurer.cjs` (neuf) · `package.json` · `scripts/harnais-claude-md.mjs` · APP 7.44 **inchangé** · SW 8.10 → **8.11**)

### 156a. D'où ça vient

19/09 vers 18 h : courriel « DPA accepté » d'un domaine client, signé par un salarié qu'un admin du domaine venait de
passer admin (il était tractoriste). Nico demandait si l'erreur de §155 venait de là : non (§155). Mais la relecture du
code a trouvé deux défauts, et Nico a dit « oui » au correctif.

### 156b. Les deux défauts

① **La porte fait signer, au nom du domaine, tout admin sans claim.** Le claim `terms` est PAR PERSONNE
(`mergeClaimsUid`), le contrat PAR DOMAINE. Un admin arrivé après la signature n'a pas le claim → `_mvTermsCheck` lui
ouvre le formulaire : raison sociale, SIRET, adresse, nom, fonction, case « pouvoir d'engager le domaine » — quel que
soit son rôle réel.
② **Sa signature écrase celle du domaine.** `acceptTerms` écrivait `_mv_signatures/{slug}` par `set` : UN document par
domaine, sans historique. La preuve d'origine a disparu de la base.

### 156c. Le correctif

- **Serveur** (`acceptTerms`, en transaction) : toute acceptation va dans `_mv_signatures/{slug}/hist/{ref}-{ts_ms}` (la
  réf seule ne suffit pas : 9 000 valeurs par an) ; la preuve en place y est versée si elle n'y est pas (preuves d'avant
  SIGN-1) ; la preuve du domaine n'est remplacée que si elle manque ou porte des versions dépassées — `termsPlan` : **la
  première acceptation des versions en vigueur fait foi**. Courriel GT : « acceptation supplémentaire, preuve du domaine
  inchangée » ou « remplace comme preuve du domaine : réf … du … (qui) ». App Check toujours exigé. **Aucune règle
  touchée** : `hist` est une sous-collection que seul l'Admin SDK écrit et que les rules ne donnent à personne (console
  Firebase pour la lire).
- **Porte** (`_mvTermsCheck`) : sans claim à jour, lecture de la preuve du DOMAINE (`fbLirePreuveDomaine`, bornée 8 s ; les
  rules la laissent lire aux membres du domaine). Si elle couvre les versions en vigueur (`_mvTermsPreuveOk`) → porte
  fermée, rien à signer ; gardée pour la session, pour CE domaine seulement (`slug` comparé). Sinon — pas de preuve,
  versions dépassées, non acceptée, lecture impossible, erreur — le formulaire comme avant : **fail-closed**, `.catch`
  compris (avant, un rejet dans la chaîne laissait la porte fermée en silence).
- **Reçu** (Réglages › CGU & Mentions légales) : sans acceptation personnelle, celui du domaine — versions, date, réf, et
  « Acceptées pour le domaine par <nom> — <fonction> », échappés. « Voir le DPA / les CGU signés » ouvre l'exemplaire du
  domaine (`_mvTermsFillDomaine`, en mémoire ; `_mvTermsOpenDoc` le passe à la page au clic, comme avant).

### 156d. Reverser la preuve écrasée — `scripts/mv-signature-restaurer.cjs`

⚠️ **Délai** : la règle GCS (README_BLAZE) efface `backups/firestore/` à 7 jours → l'export du 19/09 (2 h, AVANT la
signature) disparaît vers le 26/09. **Étape 0 d'abord** : le copier sous `archives/`, hors règle.
Import dans une base **à part** (`restauration`), jamais dans `(default)` : l'export est de toutes les collections, et un
import filtré par collection exige un export filtré.

```
gcloud storage cp --recursive gs://mavigne-a0fd5.firebasestorage.app/backups/firestore/<DATE> gs://mavigne-a0fd5.firebasestorage.app/archives/firestore-<DATE>
gcloud firestore databases create --database=restauration --location=eur3 --project=mavigne-a0fd5
gcloud firestore import gs://mavigne-a0fd5.firebasestorage.app/archives/firestore-<DATE> --database=restauration --project=mavigne-a0fd5
node scripts/mv-signature-restaurer.cjs <slug>            (lecture seule : les deux preuves, et ce qui serait écrit)
node scripts/mv-signature-restaurer.cjs <slug> --ecrire   (transaction, rien d'effacé)
gcloud firestore databases delete --database=restauration --project=mavigne-a0fd5
```

`--ecrire` : les deux preuves dans `hist` (si absentes) ; la preuve du domaine ← la première acceptation des mêmes
versions (`choisirParent`) ; l'autre passe « supplementaire ». Accès : `scripts/serviceAccountKey.json` s'il existe
(comme `restore-from-json.js`), sinon les identifiants par défaut ; firebase-admin du projet, sinon de `functions/`
(12.3 : bases nommées gérées). **Déployer `acceptTerms` d'abord** — l'ancienne réécraserait à la signature suivante.

### 156e. Harnais — `scripts/mv-harnais-signature.mjs` (neuf, dans `check` et `prebuild`)

**30 assertions** sur le vrai code extrait et joué : serveur (plan, historique, courriel, gardes statiques sur le vrai
`acceptTerms`, App Check) ; porte dans un contexte `vm` (claim, preuve à jour, dépassée, non acceptée, lecture rejetée,
lecteur absent, cache d'un autre domaine, cache de ce domaine, GT, non-admin, échappement, reçu personnel inchangé) ;
restauration (choix de la preuve, même identifiant d'historique que le serveur). **`--contre` : 11 défauts**, chacun rougit.
★ **Premier passage : un rouge sur un code juste.** L'extraction d'`acceptTerms` s'arrêtait à l'accolade des OPTIONS de
`onCall({ region… })` : le test ne lisait que l'en-tête. Corrigé (en-tête + corps). Deuxième fois du jour (§155e).
★ **La chaîne a attrapé le code, elle aussi** : le reçu du domaine ajoutait un `<div style="font-size:12px">` → cliquet
typo rouge (px en dur 1952 contre 1951). Remis dans la même ligne, avec un `<br>`.

### 156f. Versions et livraison

`app.js` + `firebase.js` + `claims.js` → **SW 8.10 → 8.11** ; APP 7.44 et `WHATS_NEW` intacts : l'admin qui n'a plus rien
à signer ne voit rien à annoncer (§7). ⚠️ **TIERS-1 (§155, SW 8.10) n'est pas poussé : ce zip le contient et le
remplace.** Base `ebba4de`. Déploiement : `npm run build && firebase deploy` (fonctions comprises), PUIS 156d.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `functions/claims.js` | `termsPlan`, `termsHistId`, `termsLigneAvant` ; `acceptTerms` en transaction, historique, courriel GT | déploiement des fonctions |
| `src/app.js` | porte par domaine, reçu du domaine ; + TIERS-1 | ★ SW |
| `src/firebase.js` | `fbLirePreuveDomaine` | ★ SW (déjà) |
| `public/sw.js` | 8.11 | ★ SW |
| `scripts/mv-harnais-signature.mjs` · `scripts/mv-signature-restaurer.cjs` · `scripts/mv-harnais-tiers.mjs` | neufs | — |
| `package.json` | les harnais et leurs contre-épreuves dans `check` et `prebuild` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 188 · §155-156, §26b corrigé · base | — |

### 156g. Ouvert, et dit

① **Qui signe** : quand la preuve manque ou que les versions changent, la porte s'ouvre pour le premier admin venu ; la case
« pouvoir d'engager le domaine » reste la seule garde, et un admin non habilité reste bloqué sans issue. À trancher avant
la prochaine version des textes. ② La preuve du domaine reste lisible par TOUS ses membres (rules existantes) : SIRET,
adresse, signataire, `email_at_signing`, `user_agent` ; le reçu n'en montre que réf, date, nom et fonction. À resserrer aux
admins si l'on veut (règle + déploiement dans l'ordre §8c). ③ Pas d'écran Admin GT pour l'historique : console Firebase.
④ Pas joué sur l'appli déployée : `test:e2e` chez Nico (le parcours passe par `_mvTermsCheck`).

## 157. ★★ MAJ-1 — LA MISE À JOUR N'INTERROMPT PLUS LA SESSION EN COURS : ELLE ATTEND LE PROCHAIN LANCEMENT (19/09 — `app.js` · `sw.js` · APP 7.44 **inchangé** · SW 8.11 → **8.12** · base `4b93fcc`)

### 157a. Le symptôme, et sa cause exacte

Un déploiement rechargeait l'appli **en cours d'utilisation** chez les clients, sans prévenir — signalé
par Nico (dicté, 19/09). `app.js` forçait tout nouveau SW installé à passer actif immédiatement —
`postMessage({type:'SKIP_WAITING'})` à l'enregistrement (`if(reg.waiting)`) ET sur `updatefound` dès
`state === 'installed'` — ce qui déclenchait `self.skipWaiting()` côté `sw.js`, puis `clients.claim()` à
l'activation, puis `controllerchange` côté `app.js` → `window.location.reload()` sans délai. Le
déclencheur réel en usage réel : le `reg.update()` posé sur `visibilitychange`. Dès qu'un client revenait
au premier plan après avoir mis l'appli en arrière-plan quelques instants, une MAJ fraîchement poussée
s'activait et rechargeait sous ses doigts.

### 157b. Le correctif — rien de nouveau, un forçage en moins

Retiré : `self.skipWaiting()` dans `install()` (`sw.js`), les deux `postMessage({type:'SKIP_WAITING'})`
(`app.js`, enregistrement + `updatefound`), et la branche `SKIP_WAITING` du handler `message` (`sw.js`,
devenue sans émetteur). Rien d'autre ne change : `reg.update()` continue de tourner au chargement et à
chaque retour au premier plan — il télécharge et installe la nouvelle version en tâche de fond, sans
l'activer. Un SW nouvellement installé reste **« waiting »**, comportement natif du navigateur : il ne
prend le relais que lorsque plus aucun client n'est contrôlé par l'ancien SW — donc, en usage réel (une
instance par appareil), au prochain lancement de l'appli, jamais pendant qu'elle tourne. Le
`controllerchange` → `_swReload()` reste en place comme filet de sécurité, mais ne se déclenche plus au
déploiement normal. Correctif invisible : `WHATS_NEW` non touché, `APP_VERSION` inchangée.

### 157c. Ouvert, et dit

① Un onglet resté ouvert pendant qu'un AUTRE onglet du même appareil se ferme peut encore recevoir un
`controllerchange` et donc se recharger — cas multi-onglets, marginal sur l'usage mobile/tablette visé
ici ; non traité par ce lot. ② Trouvé en chemin, non touché : `window._swUpdatePending` et son test
`if(window._swUpdatePending && !document.querySelector('.overlay.open'))` (dans `_mvDemarrer`, autour de
l'ancienne l.9853) forment un mécanisme de rechargement différé jamais achevé — rien ne met jamais ce
flag à `true`, la branche est morte depuis son introduction. Hors périmètre de ce lot ; à trancher
(compléter, ou retirer) au prochain passage sur ce fichier. ③ Aucun harnais dédié : le calendrier
d'activation d'un Service Worker (attente multi-clients) n'est pas testable en fonction pure — à
vérifier chez un client au prochain vrai déploiement.

### 157d. La note de livraison

**Base `4b93fcc`** (relit après-coup : le lot précédent avait déjà poussé SIGN-1/§156 + TIERS-1/§155
pendant la préparation de celui-ci — reclone complet avant d'écrire, rien de l'ancien brouillon collé
par-dessus). Pas d'entrée `WHATS_NEW`, `APP_VERSION` inchangée : correctif invisible, aucun changement
à l'écran (c'est le but).

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/app.js` | retrait des 2 `postMessage(SKIP_WAITING)` (enregistrement + `updatefound`), log au lieu du skip forcé, commentaires mis à jour | — |
| `public/sw.js` | retrait de `self.skipWaiting()` dans `install`, retrait de la branche `SKIP_WAITING` du handler `message`, version | ★ SW |

## 158. ★★ NOTIF-1 — UNE NOTIFICATION PRÉVIENT QUAND LA MISE À JOUR EST PRÊTE (19/09 — `app.js` · `utils.js` · `index.html` · `sw.js` · APP 7.44 → **7.45** · SW 8.12 → **8.13** · base `60d7a85`)

### 158a. Le besoin, en suite directe de MAJ-1 (§157)

MAJ-1 a retiré le rechargement forcé, mais un appareil qui ne ferme jamais l'appli peut désormais rester
longtemps sur une ancienne version sans que personne ne le sache — question posée par Nico après coup
(risque « sauvegarde » : pas de perte de données, mais un correctif de calcul mettrait plus de temps à
atteindre un poste resté ouvert). Sa proposition : un message qui annonce la MAJ sans redémarrer l'appli,
en disant à l'utilisateur qu'il devra fermer et rouvrir pour l'installer.

### 158b. Le choix technique — réutiliser `_swNotify`, pas construire une infra push

Pas de Web Push / FCM : ça demanderait un abonnement serveur par appareil et une Cloud Function
déclenchée au déploiement, pour un besoin que l'infra existante couvre déjà. `_swNotify` (`utils.js`,
déjà utilisée pour gel/DAR/priorités et les rappels tracteur) passe par `reg.showNotification()` — visible
même appli en arrière-plan, sans réabonnement ni permission nouvelle à demander. Suffit d'appeler ce qui
existe déjà au bon endroit : le `statechange` → `installed` posé par MAJ-1.

### 158c. Le garde contre le faux positif

`updatefound` se déclenche aussi au **tout premier** install (pas de mise à jour, juste une première pose
de cache) — notifier « fermez et rouvrez pour installer » à ce moment-là n'aurait aucun sens. Garde :
`navigator.serviceWorker.controller` n'est non nul que s'il y avait déjà un SW actif avant, donc jamais au
premier install. La notification ne part que dans ce cas.

### 158d. ⚠️ TROUVÉ À LA RELECTURE DU BUNDLE — `_swNotify` N'ÉTAIT PAS IMPORTÉ DANS `app.js`

Première écriture : appel `_swNotify(…)` nu dans `app.js`, qui ne l'importe pas (`reglages.js` et
`tracteur.js`, eux, l'importent explicitement). **Rien ne rougissait** : ni `node --check`, ni le
preflight, ni `mv-harnais-globaux` — ce dernier tolère à juste titre le nom, puisque `utils.js` pose
`window._swNotify = _swNotify`, donc la référence libre retombe sur l'objet global et *fonctionne*.
★ **C'est le BUNDLE CONSTRUIT qui l'a dit, pas un harnais** : `npx vite build` puis lecture de
`dist/assets/main-*.js` — l'appel sortait **non minifié** (`_swNotify(…)`, signature d'une globale
externe) tandis que la fonction, elle, était renommée `K` et n'existait plus que via `window._swNotify=K`.
Le jour où un lot retire cette ligne d'exposition — qui a l'air redondante puisque tous les autres
consommateurs importent — l'appel lève un `ReferenceError` **dans un gestionnaire d'événement**, donc
sans rien à l'écran. Corrigé en ajoutant `_swNotify` à la liste d'import de `app.js` ; après rebuild,
l'appel est lié statiquement (`K(…)`, minifié comme le reste) et **zéro référence libre** ne subsiste.
⚠️ La règle générale : *un harnais qui vérifie « ce nom est-il joignable ? » répond oui pour une globale
— il ne dit pas si la liaison est STATIQUE. Seul le bundle le dit.*

### 158e. Ouvert, et dit

① Comme `_swNotify` (branche `reg.showNotification`) ne vérifie pas explicitement la permission avant
d'appeler — déjà le cas pour gel/DAR/tracteur, pas quelque chose que ce lot corrige. ② N'atteint que les
appareils où les notifications sont déjà activées ; les autres restent sur le comportement silencieux de
MAJ-1 (rien ne change pour eux). ③ Le message reste générique (« une mise à jour est prête »), jamais le
contenu réel du `WHATS_NEW` de la version poussée : la page qui tourne encore ne peut pas lire l'intérieur
du nouveau bundle mis en cache, seulement détecter qu'il existe.

### 158f. La note de livraison

**Base `60d7a85`** (MAJ-1/§157 déjà intégré et poussé par Nico entre les deux lots — reclone avant
d'écrire, comme la fois précédente). Feature visible cette fois : entrée `WHATS_NEW` réelle, `APP_VERSION`
bumpée.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/app.js` | import de `_swNotify` ajouté (cf. 158d), notification sur `statechange` → `installed`, gardée par `navigator.serviceWorker.controller` | — |
| `src/utils.js` | `APP_VERSION`, entrée `WHATS_NEW` | ★ APP |
| `index.html` | 4 emplacements de version | ★ APP |
| `public/sw.js` | version | ★ SW |

---

## 159. ★★★ TAUX-1 + DIM-1 — LE TAUX LE PLUS FORT SORT TOUJOURS EN PREMIER ; UNE RETENUE NE VOISINE PLUS UNE MAJORATION DU DIMANCHE ; LE DÉTAIL DE L'ANNÉE SE LIT DANS L'UNITÉ DU COMPTEUR (20/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.45 → **7.46** · SW 8.13 → **8.14** · base `0bb80a5`)

> Nico : *« relis le planning avec les retenues sur salaire, les récup, les heures de dimanche travaillés et la façon dont
> sont tournées les phrases afin que tout soit bien clair. Moi-même j'ai l'impression que ça ne colle pas. Il faut que ça
> soit les heures à 50 % qui servent d'abord à rattraper les heures d'absence, j'ai l'impression que les taux ne sont pas
> appliqués si ce sont des heures de rattrapage. Parfois les heures sup à 50 % sont supérieures aux heures sup à 25 %,
> pourquoi. Sur le PDF la colonne en repos ne veut rien dire, on a dit qu'il faut une colonne heure à récup, la colonne
> absence est vide… enfin vérifie tout »*. Pas de maquette cette fois : les défauts étaient nommés, et les relevés rendus
> avant / après ont servi de maquette. ⚠️ `origin/main` a avancé pendant le lot (`60d7a85` → `0bb80a5`, NOTIF-1, §158) :
> recalé par `git fetch` avant les bumps — la section prévue « §158 » est devenue §159, 7.45/8.13 étaient pris.

### 159a. L'audit, mesuré avant d'écrire

- Banc hors dépôt (`/home/claude/lot/`) bâti sur le chargement de `mv-harnais-semaine` : les trois relevés de référence
  (Chloé, Nico, Victor) rendus par le vrai `_planReleveFiche_`, lus en texte puis en A4 dans Chromium, et dix scénarios
  sur un salarié à 35h (octobre 2026, semaines entières). **Aucune addition fausse.**
- **« Le 50 % dépasse le 25 % »** — deux causes, une seule est un défaut. ① Légitime : une semaine à plus de 16h sup
  (8h à 25 %, le reste à 50 %) ; la semaine du 31 août, dont le lundi d'août tient les premiers rangs (transition, une
  fois). ② Défaut : `tire` prenait la file dans l'ordre d'entrée — dans un mois, le taux le plus BAS d'abord (§135). +12h
  une semaine (8h à 25 %, 4h à 50 %), 7h d'absence injustifiée une AUTRE semaine : il restait 2h24 à 25 % et 4h à 50 %.
- **« Les taux ne sont pas appliqués aux heures de rattrapage »** — ce n'est pas un bug, et la feuille ne le disait pas.
  Dans la MÊME semaine, une heure en plus qui rattrape une heure manquée n'est pas une heure sup (la semaine ne dépasse
  pas son planning, SEM-1) : heure pour heure, et c'est déjà le 50 % qui tombe en premier (12h en plus, 2h manquées → 8h
  à 25 %, 2h à 50 %). D'un mois sur l'autre, le taux JOUE : 3h à rattraper sont comblées par 2h à 50 % (mesuré, AA5).
  ★ Conséquence assumée de « compter à la semaine » : la même absence coûte plus dans la semaine des heures en plus
  (1 pour 1) que dans une autre (en valeur).
- **Dimanche travaillé** : juste. En heures sup, le taux le plus fort une seule fois (seau `50dim`) ; s'il rattrape, il ne
  garde que sa majoration, qui entre au compteur (5h un dimanche + 7h injustifiées la même semaine : 5h rattrapées, 2h30
  de majoration, 2h reprises dessus, reste 0h30).
- **Le détail de l'année** : tout y était converti en heures sup BRUTES (FICHE-5) — 7h d'absence s'imprimaient « 5h36 »,
  une récup de 7h « 4h40 », à côté de deux soldes dans deux unités (« Solde », « en repos »). Illisible, et la colonne
  « Absences » était vide chez quiconque rattrape dans la semaine ou se voit retenir.

### 159b. Le moteur (`_planCompteur`) — un seul ordre

- Première passe : seules les prises EN TEMPS partaient du taux le plus fort, un paiement gardait le 25 % d'abord (§135), et
  l'estimation AVANT-1 restait dans l'ancien sens — dit à Nico comme « ouvert ». Sa réponse : **« non, toujours le taux le plus
  haut sort en 1er »**. Lu sans exception, paiement compris — deux ordres sur une même file auraient demandé une estimation à
  deux bouts, et laissaient de toute façon « 50 % > 25 % » quelque part (dans ce qui reste, ou dans ce qui se paie).
- **`ordre()`** : le mois le plus ancien d'abord (inchangé — NET-1 : la récup acquise passe avant les heures sup du mois), puis
  le taux le plus FORT, puis l'ordre d'entrée. `tire` (absences, report, comble, domaine, récup prise, paiement défait d'un mois
  figé, `paye_bank`) et `tireBrut` (le reste d'une demande) le suivent ; le **paiement du mois** trie ses seaux du plus fort au
  plus bas (`pm`), l'entrée au compteur garde son ordre (25 %, 50 %, dimanche, férié). ⚰️ `tirePaie`, née et morte dans ce lot.
- ★ **Ce que ça change, mesuré** : la VALEUR ne bouge pas (1h d'absence = 1h de récup ; retenue, heures à rattraper, solde en
  temps de récup identiques), mais **pour une même valeur on paie moins d'HEURES, à un taux plus fort** : 12h sup (8h à 25 %, 4h à
  50 %), 7h d'absence, 12h demandées → 6h24 payées (4h à 50 %, 2h24 à 25 %) ; avant 7h12, toutes à 25 %. Même argent. Le mois de
  référence du harnais : au plus 10h30 payables (avant 12h). Un mois figé garde son paiement (c'est un fait, taux par taux).
- Avant septembre 2026 toutes les tranches sont à taux 0 : à égalité l'ordre d'entrée est gardé, rien ne bouge (`releve`,
  `retard`, `semaine` verts sans retouche).
- **AVANT-1 retournée** (`_pfEstPile`) : la pile se range depuis le rang 0 — déjà majorées, 25 %, 50 % ; une tranche se vide
  par ses rangs les plus hauts, donc ce qui est sorti a pris le 50 % d'abord et ce qui RESTE garde les taux les plus bas. Jeu W :
  13h payées estimées 11h à 25 % et 2h à 50 % (avant 6h / 7h) ; 18h restantes, toutes à 25 % (avant 16h / 2h).
- Neufs sur chaque ligne : `valAbs`, `valRec`, `entre`, `bankVal`, `payeCVal` (159c) ; `majPayee`, `majAbsV`, `reportMajFait` (159h).

### 159c. Le détail de l'année — `_pfAnneeTable`, une source pour le papier et l'écran

Colonnes : **Heures sup faites · Heures sup payées** (l'heure faite, ce que la paie saisit) **· Récup gagnée · Récup prise ·
Absences reprises · Récup restante** (temps de récup, majoration comprise) **· Heures à rattraper**. La ligne tombe juste :
restante = celle d'avant + gagnée − prise − absences − payé sur le compteur (la note le dit, avec le chiffre du mois quand
il y en a un). « Solde » en heures brutes et « en repos » disparaissent ; les heures brutes restantes sont dans « Heures sup
restantes à payer », quand il y a une demande. `_pfAnnee` garde ses anciens champs (`recup`, `recPrise`, `abs`, `solde` : Z10
et `_pfRestants` les lisent). « Colonne heure à récup » lu comme la récup restante ; les heures à rattraper ajoutées en plus.
- CSS papier : `.t .rc`, `.t.an` ; ★ `.p2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}` — avec `1fr 1fr`, un tableau
  aux en-têtes `nowrap` élargissait SA colonne et rétrécissait l'autre : la page 2 de Nico passait à trois pages sans
  qu'une ligne de la colonne de droite ait changé. Écran : `.pf-an th`, `.pf-an td.dn` (`styles.css`).

### 159d. Les tournures

« Congé payé *payée* », « Récup *payée* » → *payé*, *prise sur la récup* (écran : « 7h prises sur la récup ») ; « rattrapée sur
heures sup » → « reprise sur la récup » (un seul nom, jour par jour, page 1, compteur, signature : « reprise sur ma
récup ») ; `_pfDeMois` : « Les heures sup d'octobre », « Heures sup d'août gardées » ; « au 1er novembre » ; « 7h d'absence du
salarié à régler » → « non rattrapées dans la semaine » ; « restent 3h45 » → « les 3h45 qui restent sont retenues » ; « au taux
normal » → « heure pour heure » ; « Repos gagné » → « Récup gagnée ». La ligne de semaine : « Les heures en plus rattrapent 7h
d'absence, heure pour heure : ce ne sont pas des heures sup » (★ essayé d'abord sur chaque jour — « de rattrapage, sans
majoration » passait à deux lignes et coûtait 70 px à la page 1 de Victor : retiré). « À savoir » réécrit, plus court
qu'avant malgré deux règles de plus (le 50 % d'abord, le rattrapage n'est pas une heure sup ; « sans motif » retiré).

### 159e. Mesuré, et ce que les filets ont trouvé

- Relevés rendus dans Chromium, polices du dépôt : **deux pages A4 dans les trois cas** ; page 2 de Nico 997 px de contenu,
  comme avant le lot. ★ **Retombé dans le piège de §143b** : `/fonts/fonts.css` ne résout pas en `file://` ; sans Outfit, la
  base elle-même sortait Nico sur trois pages. Banc corrigé (copie locale de `fonts.css`, `document.fonts.ready`, nombre de
  polices chargées imprimé à chaque mesure).
- `mv-harnais-recup` : **404 assertions, 73 contre-épreuves** au bout du lot. Première passe (392) — Q8 recalée (12h restantes : 8h à 25 %, rien à 50 %, 4h le dimanche ; avant
  10h48), L24, O7, S5, U3b recalées ; section **AA** (14) : le 50 % d'abord pour une absence, une récup, un comble ; le 25 %
  d'abord pour un paiement ; le plus ancien mois d'abord ; la ligne de l'année qui tombe juste ; 7h et 7h, plus « 4h40 » et
  « 5h36 » ; en-têtes, « d'octobre », « prise sur la récup », « 1er novembre », la ligne de semaine, le dimanche. ★ AA5 rouge à
  l'écriture : c'était le TEST (08:00 → 12:00 fait 4h, donc 3h écourtées — le piège de T2, §142d, une troisième fois).
  66 contre-épreuves : 6 neuves ; 4 ancres repointées.
- Seconde passe (« toujours », DIM-1) : **28 rouges au premier passage, tous attendus** — chacun recalculé À LA MAIN avant
  d'être recalé (N10–N16, O11, Q1–Q11, R1, W2–W9, X1–X4, Y1, Y5, Y11, AA4), puis 392 verts du premier coup : le calcul à la main
  et le moteur disaient la même chose. Section **AB** (11) : la majoration couvre 2h d'absence et il reste 1h à +50 % à payer ;
  9h d'absence : 6h30 retenues, RIEN à payer ; un dimanche prévu sans absence se paie comme avant ; mode récup inchangé ;
  l'instantané fige la majoration PAYÉE ; figé sans changement = mêmes chiffres ; la majoration née après l'envoi passe au mois
  suivant, où une absence passe d'abord ; **140 mois tirés au hasard** en mode payé (graine fixe) : jamais une retenue à côté
  d'un paiement — heures sup, majoration du mois, majoration reportée —, et le compteur tombe juste.
  ★ AB9 rouge à l'écriture : c'était le TEST (un dimanche en heures sup ajouté après l'envoi couvrait l'absence à la place de la
  majoration — juste, mais pas ce que le test voulait montrer). ★ AB11 : 49 « fautes » d'invariant au premier tirage — toutes
  sur des récup prises compteur vide, hors du domaine de `solde − dette = net` (§135c) : le test borné, zéro faute.
  **72 contre-épreuves** : 7 neuves (dont « la majoration se paie de nouveau sans regarder les absences » : 8 rouges) ; 5
  repointées ; ⚰️ « les heures qui restent prennent les taux les plus bas » — c'était un défaut, c'est la règle ; son inverse le
  remplace. ★ « le cadre réimprime les taux à zéro » était devenue MUETTE (Q1 paie désormais du 50 % : forcer la ligne du 50 %
  ne montrait plus rien) : repointée sur la ligne du 25 %. Une contre-épreuve se relit quand ses données changent.
- `npm run check`, `vite build`, `test:smoke` : voir la note de livraison.

### 159f. La note de livraison

**Base `0bb80a5`. APP 7.45 → 7.46 · SW 8.13 → 8.14.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `ordre()` (un seul ordre, paiement compris), DIM-1 (majoration seule en mode payé, `fige.maj`/`fige.majRep`), `_pfEstPile` retournée, `valAbs`/`valRec`/`entre`/`payeCVal`, `_pfAnneeTable`, `_pfDeMois`, tournures, « À savoir », grille de la page 2 | — |
| `src/styles.css` | `.pf-an th`, `.pf-an td.dn` | ★ APP · ★ SW |
| `src/utils.js` | APP 7.46, quatre nouveautés, aide du Planning | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | l'année, le 50 % d'abord, le rattrapage dans la semaine | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | voir 159e · SECTIONS 191 · base | — |

### 159g. Ouvert, et dit

① « Toujours » a été lu PAIEMENT COMPRIS (159b) : dit à Nico en tête de livraison, avec l'exemple chiffré — à inverser dans
`pm` et `ordre()` s'il ne voulait que les prises en temps. ② DIM-1 : la majoration couvre aussi les heures du DOMAINE et la
récup prise, pas seulement ce qui serait retenu — même file que les heures sup (NET-1) et même effet qu'en mode récup ; dit.
③ Un mois figé AVANT ce lot garde `fige.maj` = la majoration travaillée (elle a été payée : c'est un fait) et n'a pas de
`majRep` (son report affiché est tenu pour payé). ④ Vu dans Chromium (A4 et 390 px), pas sur papier ni sur téléphone.
⑤ `planning.js` : 593 → ~601 ko.

### 159h. DIM-1 — la majoration seule d'un mois payé

- **Le défaut** (ouvert depuis §150f ②) : en mode payé, la majoration d'un dimanche ou d'un férié hors heures sup partait à la
  paie sans regarder les absences — 7h injustifiées, un dimanche de 5h qui en rattrape 5 : 2h retenues ET 5h de majoration à
  payer sur la même feuille.
- **La règle** : c'est un paiement comme un autre. Sa valeur (heures × taux) entre au compteur le temps du calcul, en tranches
  `nat:'maj'`, `aPayer`, `mj:{taux,nat}` — le férié avant le dimanche, APRÈS les heures sup du mois (taux 0 : elles sortent en
  dernier) ; `bud` la compte (`majIn`). Absences du salarié, comble, domaine, récup prise passent ; ce qu'il en reste sort
  aussitôt : `r.majPayee` (heures à leur taux), jamais gardé au compteur. `r.majDim` = la part ABSORBÉE seulement (`majAbsV`) :
  les lecteurs du compteur (`_pfMouvements`, `_pfAnnee`, `_pfComptesV3`) tombent juste sans rien savoir du reste ; `entre` en
  est diminué. Même exemple : aucune retenue, 1h à +50 % à payer.
- **Mois figé** : `fige.maj` = la majoration PAYÉE (avant : travaillée), `fige.majRep` = le report payé. La majoration vive
  au-delà du fait entre au compteur, couvre ce qui a changé, et le reste passe au mois suivant (`suiteMaj` → `repMaj`), où il
  entre à son tour dans la file (`rep:true`) : une absence de novembre passe avant une majoration d'octobre. Payé de trop
  (heures retirées après l'envoi) : sa valeur rejoint `trop`. ⚰️ L'ancien écart `mf` (en trop → retenu au mois suivant sans
  passer par le compteur).
- **L'affichage** : « Majorations à payer » lit `P.majPayee` ; « Xh de majoration ont d'abord couvert les absences », ou
  « aucune — les Xh de majoration […] couvrent d'abord les absences » ; page 2, la phrase du dimanche le dit ; le compteur :
  « Majoration […] gardée pour couvrir les absences ». Mode récup : rien ne change (AB6).

---

## 160. ★★ CLAIR-1 — « POUR LA COMPTA » : TROIS TOTAUX D'HEURES SUP, « AUCUNE RETENUE », ET PLUS DE PHRASE À DÉCHIFFRER (20/09 — `planning.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.46 → **7.47** · SW 8.14 → **8.15** · base `91ec503`)

> Nico, après avoir poussé TAUX-1 + DIM-1 (`91ec503`, identique octet pour octet au lot livré — vérifié avant de repartir) : *« tout
> pour le planning, pour le PDF, il faut que ça soit clair. Le pour la compta, il faut qu'il y ait le total d'heures sup à payer à
> 25 %, le total d'heures sup à payer à 50 %, le total de dimanche et de jours fériés à payer. Il ne faut pas de phrase type nombre
> d'heures sup d'avant le mois estimé. Tu mets la ligne heure sup à 25 % (nbre heure du mois + nombre heure d'avant) ; idem pour la
> ligne heure sup 50 % et idem pour la ligne dimanche et jour férié. Il faut que ça soit clair quand on marque aucune retenue. Idem
> quand est marqué dont heure dimanche déjà majoré : ce n'est pas clair. »* Pas de maquette : la structure était dictée ; le rendu
> Chromium (A4 et 390 px) a servi de maquette, montré à la livraison.

### 160a. Le cadre (`_pfCompta`, une source pour l'écran et le papier)

- **« Heures sup à payer »** : une ligne, trois cases (`.tx3` / `.tb`), **toujours les trois mêmes, dans le même ordre** — *à +25 %*,
  *à +50 %*, *dimanches et fériés* —, le total en gros, un zéro en gris (`.tb.z`). ⚠️ Revient sur PAIE-1 (§154 : « les taux à 0h ne
  s'impriment plus ») : c'était MA recommandation, validée par un « go » ; Nico demande maintenant les trois totaux, explicitement.
  Rien à payer : « aucune », sans cases (X6).
- **D'où viennent les heures**, sous le total : « 12h du mois + 11h d'avant » (les mots de Nico), « d'avant septembre » si tout vient
  du compteur, « du mois » seulement quand une autre case a de l'« avant » (sinon rien : c'est le cas courant). `mo` = le paiement du
  mois (`P.lignes`), `av` = ce qui est pris au compteur à son taux (`payesBank`) **+ l'estimation AVANT-1** (`SP.est.c25/c50`).
- ⚰️ La ligne « Xh heures sup d'avant septembre (estimées : …) ». Le mot « estimé » ne figure plus dans le cadre ; « À savoir »
  (page 2) garde la puce qui dit que ces taux sont relus et que la compta confirme.
- **Dimanches et fériés** : heures sup du dimanche / du férié à leur taux (« 6h le dimanche, à +50 % »), et les **heures de dimanche
  d'avant septembre** (`est.deja`) : « 3h d'avant septembre, sans majoration » — la phrase dessous dit pourquoi (« leur majoration a
  déjà été comptée en récup à l'époque, ces 3h se paient sans majoration »). ★ Elles ne sont PAS mises « à +50 % » : avant septembre
  la majoration d'un dimanche entrait au compteur à part (tranche `maj`) ; la repayer ici la compterait deux fois.
- **Ce qui n'a pas de taux** ne rejoint aucune case : ligne « Autres heures à payer », seulement s'il y en a — report d'avant Ma
  Vigne (« taux à vérifier »), majoration déjà calculée (« à payer sans majoration »), heures reportées.
- La **majoration seule** d'un mois payé (DIM-1) garde sa ligne « Majorations à payer » : ce n'est pas une heure à payer mais une
  prime sur une heure déjà dans le salaire — la fondre dans le total des dimanches ferait payer l'heure deux fois.
- **Salaire de base** : « Maintenu » → **« Aucune retenue »** + « Le salaire de base se paie en entier. » ; avec une retenue :
  « Retenue de 3h45 » + « 3h45 à retirer du salaire de base. » puis le pourquoi.

### 160b. Les heures restantes — `_pfRestLignes`

Page 2 (« Heures sup restantes à payer ») et onglet Compteur : même rangement — l'estimation rejoint la ligne de son taux (« dont 18h
d'avant septembre »), les dimanches d'avant septembre ont leur ligne (« sans majoration — leur majoration est déjà dans la récup »),
majoration déjà calculée et report gardent la leur. En récup, une heure d'avant septembre vaut 1h pour 1h. ★ Les lignes SONT le total
(W10b : Σh = `R.total`, Σv = `R.valeur`). `_pfEstTxt` : « déjà majorées » → « à payer sans majoration (elle est déjà dans la récup) »
(« Le calcul, mois par mois »). ★ **Trouvé en passant, échappé à TAUX-1** : deux notes de la carte des restantes disaient encore « partent
d'abord des heures à 25 % » — le grep de TAUX-1 cherchait « 25 % d'abord », pas « d'abord des heures à 25 % ». Corrigées.

### 160c. Mesuré

- Chromium, polices du dépôt : deux pages A4 (Nico page 1 : 967 → 1 018 px — le cadre prend 51 px ; cas « avant septembre » : 967 /
  1 055). ⚠️ La page 1 est à hauteur fixe (`overflow:hidden`) : le cadre a grossi, la marge d'un mois très chargé a fondu d'autant.
  390 px : les trois cases tiennent (332 px), rien ne déborde.
- `mv-harnais-recup` : **409 assertions** — 13 recalées (aide `bx` : une case, son total, son origine), 5 neuves (W10b–f) ; mes deux
  premières attentes de W10b/c étaient fausses (elles visaient l'état après 70h payées) : c'était le TEST. **78 contre-épreuves** : 6
  neuves, 2 repointées (l'ancien cadre n'existe plus), ⚰️ « le cadre réimprime les taux à zéro (PAIE-1) » — c'était un défaut, c'est
  la demande ; son inverse (« une case à zéro disparaît ») le remplace. ★ Vu seulement par `npm run check` : la série des
  contre-épreuves n'avait pas été relancée après le recalage — trois ancres mortes attendaient. `semaine`, `releve`, `retard` verts sans retouche.

- ★ **Le cliquet de poids a rougi** (`mv-harnais-typo`, règle E : « aucun module n'enfle de plus de 5 % sans regraver ») :
  `planning.js` 576 → 606 ko depuis la dernière gravure (+5,2 %, cumul de NET-1 à CLAIR-1 — personne n'avait regravé). La question
  du découpage a été posée, comme la règle le demande : la fiche et le relevé (`_pf*`, `_planReleveFiche_`, leur CSS papier) pèsent
  ~150 ko et forment un bloc séparable (`planning-fiche.js`) — **un lot à part entière** (ordre d'import, globaux, harnais qui
  évaluent `planning.js` seul), pas un effet de bord de celui-ci. Plafond : 1 024 ko. Regravé (`--baseline`) : seuls des `ko`
  changent (5 fichiers), aucun compte de px — la gravure ne masque aucune régression typographique.

### 160d. La note de livraison

**Base `91ec503`. APP 7.46 → 7.47 · SW 8.14 → 8.15.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_pfCompta` (trois cases, origine, « Autres heures à payer », « Aucune retenue »), `_pfRestLignes`, `_pfEstTxt`, CSS papier `.tx3`/`.tb`, deux notes « 25 % d'abord » | — |
| `src/styles.css` | `.pf-cl-sup`, `.pf-cl-v .tx3`, `.tb` | ★ APP · ★ SW |
| `src/utils.js` | APP 7.47, trois nouveautés, aide du Planning | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | le cadre, les heures d'avant septembre | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | voir 160c · SECTIONS 192 · base | — |
| `scripts/typo-baseline.json` | cliquet de poids regravé (`planning.js` 576 → 606 ko), voir 160c | — |

### 160e. Ouvert, et dit

① L'ancien cadre des mois d'AVANT septembre (`_pfCadre`, « À payer en plus ») n'est pas touché : une paie déjà éditée ne change pas.
② Le relevé collectif (`_planReleve`) n'a pas été relu dans ce lot. ③ Vu dans Chromium, pas sur papier ni sur téléphone. ④ **Découper `planning.js`** (sortir la fiche et le relevé) : à décider par Nico, lot à part (160c).

---

## 161. ★★★ AVANT-2 — À LA BASCULE, LES HEURES SUP D'AVANT SEPTEMBRE ENCORE AU COMPTEUR PRENNENT LEUR MAJORATION (20/09 — `planning.js` · `utils.js` · `index.html` · `sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.47 → **7.48** · SW 8.15 → **8.16** · base `9e5044d`)

> Nico, une capture du détail de l'année à l'appui (août : 27h faites, 27h de récup gagnées, 27h restantes ; septembre : 13h30
> d'absences reprises, 13h30 restantes) : *« encore un problème, les récup gagnées et restantes n'ont pas leurs majorations je
> crois »*. Vérifié : pas un bug — la bascule de septembre (§135c), et AVANT-1 (§147) où, entre ① « indicatif, rien ne bouge » et
> ② « bascule au 1er janvier, tout recalculé », il avait répondu « 1 ». Dit tel quel, avec deux constats : ma légende (TAUX-1) écrivait
> « majoration comprise » sous une ligne à 27h pour 27h — FAUSSE pour ces mois ; et une **asymétrie** que je n'avais pas vue : les
> mêmes heures, PAYÉES, recevaient un taux estimé ; PRISES en récup ou reprises par une absence, elles valaient 1h pour 1h.
> Troisième voie proposée (rien recalculé de janvier à août ; au 1er septembre le stock restant prend sa majoration). Réponse :
> ***« si les heures sup apparaissent encore c'est qu'elles n'ont pas été prise donc elles sont aussi majorées (que ça soit de l'heure
> sup ou de l'heure de dimanche ou férié) »***. `origin/main` = `9e5044d` (« planningtop » : CLAIR-1 poussé à l'identique, vérifié).

### 161a. Le moteur — `revalorise()`, dans `_planCompteur`

- Au **premier mois `act`** de la boucle (septembre 2026), AVANT le budget du paiement (`bud` compte la file) : chaque tranche
  `nat:'hs'`, taux 0, d'un mois d'avant la bascule, pour ce qu'il en RESTE — ses rangs [0, h) : le taux le plus fort est déjà sorti
  (TAUX-1) — est relue par `_pfEstSeg(_pfEstPile(mbr, mois), 0, h)`. Ses heures à 25 % et à 50 % deviennent de **vraies tranches**
  (`taux:25` → h × 1,25 ; `taux:50` → h × 1,5), **au même mois d'origine** (l'ordre « le plus ancien d'abord » est gardé). Le gain
  (`0,25 × c25 + 0,5 × c50`) = `r.revalo`, ajouté à `r.majSup` et à `entre` : `_pfMouvements`, `_planRecupCartes`, le tableau annuel
  du Planning, `_planYearBalance` (l'invariant `solde − dette = net`, AC4) tombent juste sans rien savoir.
- **Ce qui reste à 1 pour 1**, et pourquoi : ① les heures d'un dimanche ou d'un férié DÉJÀ majorées à part (`deja`) — leur majoration
  EST la tranche `maj` du même mois (`PLAN_MAJ_DEBUT='2026-01'`) : « aussi majorées », elles le sont ; les majorer ici les compterait
  deux fois (contre-épreuve) ; ② la tranche `maj` elle-même (c'est déjà du temps de récup) ; ③ le **report d'avant Ma Vigne** (`dep`) :
  aucun jour saisi, rien à relire — « taux à vérifier ». ⚠️ ③ est dit à Nico : sa phrase pourrait le viser aussi.
- **Rien ne bouge de janvier à août** : `_planCompteur(mbr, 7)` rend 27h/27h/aucune revalorisation (AC1) ; relu depuis septembre, août
  garde `sup`, `entre`, `solde` (AC3). Une récup prise en août a entamé le stock à 1 pour 1, à l'époque : seul ce qui RESTE est majoré
  (AC8). Mode payé : même règle (AC9).
- ★ **La capture, rejouée** (AC2) : 27h d'août = 16h à 25 % + 11h à 50 % → +9h30 ; les 13h30 d'absences de septembre partent du 50 % ;
  restent 23h (16h à 25 %, 2h à 50 %) — avant : 13h30.
- AVANT-1 n'estime plus que ce qui reste SANS taux : vu d'un mois d'avant la bascule (tout), ou le `deja` ensuite. Les lecteurs :
  `_pfRestants` compte `av` par catégorie (heures à un vrai taux venues d'un mois d'avant) → « dont 18h d'avant septembre » reste écrit ;
  le cadre CLAIR-1 lit `payesBank` à son taux : « 12h du mois + 11h d'avant », inchangé. ★ Une saisie d'avant PAIE-1 (`paye_bank`, en
  VALEUR) rend moins d'heures : 13h de récup = 10h24 à 25 % (W3b).
- Coût mesuré : 1,3 ms par compteur de septembre (0,4 ms en août) — la relecture des mois d'avant. ★ L'horloge du banc est figée :
  `Date.now()` disait « 0 ms » ; chronométré avec `process.hrtime`.

### 161b. L'affichage

- **Le compteur** (page 2, onglet Compteur, cartes) : « Majoration des heures sup d'avant septembre, restées au compteur +9h30 »,
  première ligne du mois de la bascule ; « Heures sup de septembre gardées » n'en porte plus rien.
- **Le détail de l'année** : les mois d'avant portent un astérisque sur leur récup gagnée (« 27h* ») ; la légende : « * Avant septembre
  2026, le compteur comptait 1h sup = 1h de récup ; les heures encore au compteur ont pris leur majoration en septembre (+9h30, dans
  sa récup gagnée). » La ligne de septembre tombe juste (AC5).
- **« À savoir »** : la puce des heures d'avant septembre s'imprime aussi quand le mois les paie à leur vrai taux, les garde, ou vient
  de les majorer ; elle dit la règle d'avant, la relecture, le 1er septembre, « la compta le confirme ».
- Aide : une fiche « Les heures sup d'avant septembre 2026 ». Guide : deux passages. Deux nouveautés.

### 161c. Mesuré

- `mv-harnais-recup` : **419 assertions** — section W recalée (9 : ce qu'AVANT-1 estimait est devenu réel — chaque chiffre recalculé à la
  main AVANT de sonder : 8h15 de gain, 22h30, 26h45, 65h30 — la sonde a dit pareil), AA6 (3h d'août = 3h45), section **AC** (9), W10g.
  **83 contre-épreuves** : 6 neuves (dont : le dimanche majoré deux fois ; le report majoré à l'aveugle), 1 repointée. ★ Deux étaient
  devenues MUETTES, vues par la série : « un paiement pris au compteur perd son mois » (l'estimation qui lisait ce mois ne sert plus
  qu'au `deja` : W10g fait descendre une saisie d'avant PAIE-1 jusqu'au dimanche de juillet) ; « les heures d'avant ne rejoignent plus
  la case de leur taux » visait `av.c25+=SP.est.c25`, du code MORT depuis ce lot (dans un mois `act` le stock est déjà majoré) —
  ⚰️ la ligne et sa contre-épreuve. `mv-harnais-semaine` : Chloé
  63h07 → **64h** (3h30 d'août, +0h52), Nico 21h45 → **22h15** (2h d'août, +0h30) — ce sont les vrais effets du lot sur les gens du
  domaine. `releve`, `retard` verts sans retouche.

### 161d. La note de livraison

**Base `9e5044d`. APP 7.47 → 7.48 · SW 8.15 → 8.16.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `revalorise()`, `r.revalo`, `_pfRestants` (`av`), `_pfAnneeTable` (astérisque, légende), `_pfComptesV3`/`_pfMouvements`/`_planRecupCartes` (la ligne), la puce « À savoir » | — |
| `src/utils.js` | APP 7.48, deux nouveautés, une fiche d'aide | ★ APP · ★ SW |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` | les heures d'avant septembre | — |
| `scripts/mv-harnais-recup.mjs` · `scripts/mv-harnais-semaine.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | voir 161c · SECTIONS 193 · base | — |

### 161e. Ouvert, et dit

① **Le report d'avant Ma Vigne reste à 1 pour 1** : pas de semaines à relire. S'il doit être majoré, il faut que Nico dise à quel taux
(ou le ressaisir en temps de récup dans Réglages › Équipe). ② **Un septembre déjà figé** : ses paiements et sa retenue sont des faits ;
si la revalorisation aurait évité une retenue, octobre la RENDRA (FIGE-1, « retenue de septembre à rendre ») — juste, mais à savoir
avant d'envoyer. ③ **La récup de chacun monte en septembre** : à dire à l'équipe avant qu'elle le découvre sur sa feuille. ④ Le taux
vient d'une relecture (AVANT-1) : « la compta le confirme » reste écrit. ⑤ Vu dans Chromium, pas sur papier ni sur téléphone.

---

## 162. ★★★ DZ-1 — PILOTAGE › DÉCIDER LU AU PLANNING, JOUR PAR JOUR : LA TOURNÉE DU JOUR, « QUI FAIT QUOI », ET LA CARTE QUI LAISSE DÉFILER (20/09 — `pilotage.js` · `styles.css` · `utils.js` · `index.html` · `sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-pil-coherence.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.48 → **7.49** · SW 8.16 → **8.17** · base `404b52b`)

> Nico : *« dans décider dans pilotage, il faut que par défaut soient configurés l'effectif réel, le nombre d'heures de travail de
> la journée, le temps de pause, et le temps de trajet entre les vignes (revoir aussi le défilement sur téléphone qui ne marche
> pas). Il faut par défaut aussi la tâche qui est indiquée en priorité du moment. Revois toute cette partie afin que ça soit
> ergonomique et intuitif. Je veux un outil puissant. »* Maquette HTML (quatre scénarios, clair/sombre, téléphone/large) validée :
> *« c'est parfait »* — constantes de trajet comprises (§56e : une maquette validée est une décision prise).

### 162a. Mesuré AVANT d'écrire (Chromium, 390 × 844, vrais événements tactiles)

- **Le défilement** : un glissement parti de la carte Leaflet de l'ordre de passage ne bougeait pas la page (405 → 405 px) ; hors
  carte, elle défilait (405 → 640). La carte posait `touch-action:none` (`leaflet-touch-drag` + `leaflet-touch-zoom`) sur 230 px.
  ⚠️ **L'outil de mesure lui-même mentait** : `Input.synthesizeScrollGesture` en `touch` ne défile JAMAIS en headless, même sur une
  page témoin vide ; seul `Input.dispatchTouchEvent` (start / move / end) rejoue un doigt. Et le portail CGU (`#ovTerms`) recouvre
  l'écran en mode test : il interceptait les gestes « hors carte ».
- **La case Trajet sortait de l'écran** : quatre réglages en `repeat(4,1fr)` allaient de x = 41 à **x = 430 sur 390** ; son « + »
  était hors d'atteinte (la garde `overflow-x:clip` de §67 masquait le débordement, elle ne le supprimait pas).
- **L'effectif venait d'une fenêtre passée** (« sous contrat · 12 mai → 11 août » affiché un 20 septembre) ; journée 7 h, pause
  45 min et trajet 5 min par saut étaient **écrits en dur** dans `_opInit` ; deux cartes arrivaient ouvertes (ordre + renfort) ; les
  lignes « Fin de la journée N · reprise le lendemain » s'empilaient sous une parcelle de plusieurs jours.
- **Deux définitions de la journée dans le même onglet** : l'ordre de passage (effectif constant × journée réglée) et « Et si »
  (cadence moyenne sur 28 jours, `c.hPers`).

### 162b. Le modèle — une seule lecture pour les deux cartes (`_dz*`, `pilotage.js`)

- **Le travail** = `_prioItems()` (la priorité du moment) ; sans priorité, le travail qui a le plus d'heures restantes parmi ceux
  dont la fenêtre est ouverte ou s'ouvre dans le mois — et l'écran le dit. Tant que l'utilisateur n'a pas choisi (`tSrc!=='main'`),
  le travail SUIT la priorité à chaque rendu complet.
- **Le jour** (`_dzRefAuto`) = aujourd'hui s'il est travaillé, sinon le prochain jour travaillé DE L'ÉQUIPE ; si la fenêtre du
  travail n'est pas ouverte, son premier jour travaillé (la leçon des quarante vendangeurs, §20b, conservée). ‹ › passent d'un jour
  travaillé à l'autre, jamais avant aujourd'hui.
- **L'équipe** (`_dzBase`, `_dzEquipeJour`) = les affectés à la priorité des travaux cochés, sinon toute l'équipe au champ (bureau
  et fiches « Inactif » exclus). Chaque personne, chaque jour : `_planWorkPersRange(m,dt,dt)` (travail EFFECTIF : congé, récup,
  hors contrat = 0) ; une équipe collective compte `_planEffN` sous `_planSurAnnee` (sinon l'année AFFICHÉE du Planning serait lue).
  Journée d'équipe : n personnes, C heures-personnes, J = la plus longue journée (temps de calendrier). Cache par (nom, jour),
  vidé à chaque rendu complet (`_dzOublier`).
- **La coupure** = `PLAN_PAUSE_MIN` quand la journée fait 6 h ou plus et n'est pas continue (horaire du mois `_timings`, ou saisie
  du jour) : elle allonge la présence, jamais le travail (§ moteur unique, 26/07). L'heure de prise est LUE ; sans horaire au
  planning, l'écran donne la durée de présence seule.
- **Les trajets** (`_dzHop`) = calculés entre chaque parcelle et la suivante, à vol d'oiseau : à pied jusqu'à 300 m à 4 km/h,
  au-delà camion 5 min + 25 km/h, 5 min sans position. Règle du domaine dans `CONFIG.eco.trajet` (défauts `_DZ_H0`), essayée dans
  la feuille Trajets, gardée par l'administrateur (« Garder pour le domaine »).
- **La simulation** (`_dzSimuler`) déroule la tournée jour après jour avec l'équipe du planning de CHAQUE jour (un congé lundi, un
  retour mardi, une fin de CDD comptent). Trajet = temps de calendrier d'équipe ; travail partagé entre C/J personnes équivalentes ;
  surface découpée comme les heures ; garde 400 jours (`bloque`) — « la tournée ne se termine pas » est DIT, pas masqué.
- **La fenêtre** (`_dzVerdict`) : une par travail coché, jamais l'enveloppe (§ fenêtre par tâche, conservé). « Il faudrait N
  personnes de plus » sort de la MÊME simulation relancée avec N de plus (1 à 40) ; « Essayer +N » l'applique.
- **Simulation** : toucher l'équipe, le travail, la coupure, les trajets ou le jour passe l'en-tête en « simulation » ;
  « ↺ Valeurs réelles » revient au planning. Rien de tout cela n'est enregistré ; seule la tournée l'est (inchangé : par travail,
  `CONFIG.ordre_passage_t`, lue par Vigne).

### 162c. L'écran

- **La tournée du jour — jusqu'où ?** (clé `ordrepassage` inchangée) : le jour, les travaux (priorités étoilées, « autres travaux »),
  les quatre réglages **en grille 2 × 2** avec leur source, le résultat (le soir, l'équipe est à… ; 1er jour ; jours pour finir ;
  verdict), la carte, l'ordre de passage (tris, départ, enregistrement, « ⇅ bloc » conservé), la liste **rangée par jour** (un
  en-tête par jour, « reprise : » au lieu de la pile de « Fin de la journée »). Feuilles Équipe et Trajets, carte agrandie.
- **Qui fait quoi** (clé `simulateur` inchangée) remplace « Simulateur — et si ? » : chaque priorité avec son équipe affectée, +/−,
  date de fin et verdict, « Voir la tournée › » ; sans priorité, part égale entre les travaux ouverts. Même jour et même moteur :
  **vérifié, les deux cartes donnent la même date** (priorité Ébourgeonnage : ven. 9 oct. des deux côtés).
- ⚰️ `_pilSimInitData` et son panneau, `_opSimulate`, `_opFenetreHtml`, `_opStepper`, `_opEffNote`, `_opEffAppliquer`,
  `_pilEffTaches`, `_pilFenTaches`, `_pilEffFenetre`, `_pilFenLbl`, `_pilWorkdayDate`, `_opBody`, `_opClearBtn`, et **`_mvProj`**
  dans `utils.js` (avec `window._mvProj` : son seul appelant était `_opFenetreHtml`) — plus d'appelant (grep src/ et scripts/,
  puis la joignabilité du preflight, §25.11, qui en a vu quatre que le grep avait laissés).
- **La carte** : sur pointeur « coarse », `dragging:false` → Leaflet ne pose plus que `leaflet-touch-zoom` = `pan-x pan-y` : un
  doigt fait défiler, deux doigts déplacent et zooment (TouchZoom suit le milieu des doigts). `scrollWheelZoom:false` (la molette
  d'un ordinateur défile la page). « Agrandir » ouvre une carte plein écran, déplaçable au doigt, avec les noms.
- ⚠️ **TROUVÉ AU REJEU : LE DOCK PASSAIT PAR-DESSUS LES FEUILLES.** Les couches vivent dans le corps de la carte (la délégation de
  clics du Pilotage les couvre), donc dans le contexte d'empilement de la page ; `#mv-dock` (fixe, z 90) est hors de ce contexte et
  interceptait « Voir le résultat » malgré un z-index 400. Les couches s'arrêtent désormais au-dessus du dock quand il est affiché
  (`_dzDockH`), comme la barre « en main ».
- **Disposition** : le Renfort arrive REPLIÉ (`collapsed.renfort:1`), `_PIL_ST_V` 3 → 4 pour que les clients installés le voient
  (§ état mémorisé). Libellés du ⚙ et du fil : « La tournée du jour », « Qui fait quoi ». Icône de « Qui fait quoi » : `equipe`.
- Toutes les tailles passent par `--pt-*`, tous les espacements neufs par `--e-*` (cliquet d'échelle), aucune couleur en dur dans
  la feuille ; les deux cartes portent leur pastille `i` (`pil.tournee`, `pil.quifait`). Icônes à 16 (échelle 16/18/20/24/40).
- ⚠️ **Les rayons : le cliquet compte aussi les repli en px.** `border-radius:var(--r-sm,8px)` fait monter « rayons en dur qui
  doublent un pas » (le `8px` du repli) : quarante déclarations l'auraient poussé de 194 à 232. Les jetons du socle sont posés UNE
  fois, avec leur repli, en alias locaux (`--dz-rs/rm/rl/rf` sur `#pil-op-body,#pil-sim-body`) ; les déclarations lisent l'alias.
- Aucun fond de surface employé comme encre (`color:var(--cave)`, `color:var(--bg-card)` retirés : justes dans un thème,
  invisibles dans l'autre) ; `--ink-info` en texte sur `--gris-clair` passait sous 4,5 en clair → `--texte-med`, `--texte`.

### 162d. Mesuré APRÈS (Chromium, 390 × 844, tactile, données injectées : 10 parcelles, 6 fiches dont un contrat de groupe à 6)

- Glissement parti de la carte : **1 179 → 1 404 px** (la page défile) ; `touch-action` de la carte : `pan-x pan-y`. Carte agrandie :
  `touch-action:none` (elle se déplace au doigt), 720 px de haut au-dessus du dock.
- Aucun débordement à 390 px (`scrollWidth` 390, aucun élément au-delà du bord hors bandeaux défilants). Clair et sombre relus.
- Dimanche 20 sept. → **lun. 21 sept., « prochain jour travaillé · aujourd'hui dimanche »** ; équipe de la priorité 2 (Karim en congé
  le 21), 3 ensuite ; le contrat de groupe compte ×6 ; « déborde de 5 jours — il faudrait 2 personnes de plus », « Essayer +2 ».
- Harnais : `mv-harnais-pil-coherence` ⑧ **repointé** (il visait `_pilSimInitData`, retiré) : quatre assertions sur la lecture jour
  par jour et le moteur partagé. `mv-harnais-carte` et `mv-harnais-info` verts sans retouche.
- ★ **Une contre-épreuve devenue MUETTE** : dans `mv-harnais-icones-contre`, « un aide privé appelé mais disparu » mutait
  `_pilEsc(_opTNom(x.nom))` — la puce de tâche de l'ancien ordre de passage, retirée. La mutation ne mordait plus : l'épreuve
  restait VERTE sans rien prouver. Repointée sur la puce de la tournée (`_pilEsc(_opTNom(nom))`), elle rougit de nouveau.
- Rejoué APRÈS le rebasage sur `404b52b` : mêmes chiffres (glissement 1 183 → 1 408 px ; tournée et « Qui fait quoi » : ven. 9 oct.).
  Fenêtre pas encore ouverte (Pioche, du 5 au 30 oct., seule cochée) : « lun. 5 oct. · début de la fenêtre · dans 15 jours », avec
  l'équipe du 5 octobre (11 pers. × 7 h, planning d'octobre).
- Contrôle complet vert : 110 commandes (`mv-harnais-recup --contre` lancé à part, 86 s). `test:smoke` : OK (boot, 23/23 globaux).
  `test:e2e` : tout vert, « Page pilotage » comprise, sauf « Action parcelle » (météo injoignable depuis le bac à sable) — **même rouge
  sur la base `404b52b` seule, sans le lot** : c'est l'environnement. ⚠️ Playwright (node) n'a pas son Chromium ici : lancé avec celui
  de Playwright (python) par un `--import` qui ne fait que passer `executablePath` — rien de livré.

### 162e. La note de livraison

**Base `404b52b`. APP 7.48 → 7.49 · SW 8.16 → 8.17.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/pilotage.js` | moteur `_dz*`, tournée du jour, « Qui fait quoi », carte, feuilles, `_PIL_ST_V` 4, `collapsed.renfort` | — |
| `src/styles.css` | `.pil-dz-*` | ★ APP · ★ SW |
| `src/utils.js` | APP 7.49, cinq nouveautés, fiches `pil.tournee` / `pil.quifait`, aide du Pilotage | ★ APP |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/11-pilotage.html` · `public/guide.html` | Décider, « D'où viennent les valeurs de la tournée » | — |
| `scripts/mv-harnais-pil-coherence.mjs` · `scripts/mv-harnais-icones-contre.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | ⑧ repointé · ancre repointée · SECTIONS 194 · base | — |

⚠️ **Rebasé en cours de lot.** Écrit sur `9e5044d` ; AVANT-2 (§161) a été poussé entre-temps (`404b52b`, APP 7.48, SW 8.16,
SECTIONS 193) avec les mêmes numéros. Repris : 7.49, 8.17, §162, SECTIONS 194, base `404b52b` ; fusion à trois voies, conflits
résolus un par un (nouveautés : les miennes au-dessus ; en-tête du SW : ma ligne au-dessus ; CLAUDE.md : §161 d'AVANT-2 intacte).
Aucun fichier de code en commun. AVANT-2 ne touche aucune des fonctions que lit la tournée (`_planWorkPersRange`, `_planEffN`,
`_planSurAnnee`, `PLAN_PAUSE_MIN`, `_timings`, `_mvEnContratLe`) : vérifié sur son diff de `planning.js`.

### 162f. Ouvert, et dit

① La priorité ne garde pas sa date de diffusion (`CONFIG.tachesPrio` n'en a pas) : l'écran dit « priorité du moment », sans date.
② Le Renfort n'est pas touché (sa journée n'est qu'un ratio `hMax/hJour`, sa capacité vient déjà du planning).
③ Les trajets sont à vol d'oiseau : la route est plus longue. La règle est réglable, pas mesurée sur le terrain.
④ L'heure « sur place 08:00 → 16:00 » n'apparaît que si le planning porte l'horaire du mois (`_timings`) ou une saisie du jour.
⑤ Rejoué dans Chromium (téléphone émulé), pas sur un vrai téléphone. ⑥ « Il faudrait N » cherche de 1 à 40 personnes, par
simulations successives (cache par personne et par jour) : à surveiller sur un très gros domaine.

---

## 163. ★★ CIBLE-1 — LES CARTES ENTOURENT LA PARCELLE COMMENCÉE, SINON LA PROCHAINE À FAIRE ; ET LE DÉPART DE LA TOURNÉE N'EST PLUS LA PREMIÈRE DU JOUR (20/09 — `utils.js` · `app.js` · `pilotage.js` · `styles.css` · `index.html` · `sw.js` · `guide/04-vigne.html` · `guide/11-pilotage.html` · `scripts/mv-harnais-cible.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · APP 7.49 → **7.51** · SW 8.17 → **8.19** · base `107a646`)

> ⚠️ **Ce lot REMPLACE DERN-1**, livré quelques heures plus tôt et jamais poussé (le dépôt était resté sur `107a646`). DERN-1
> faisait respirer la DERNIÈRE PARCELLE VALIDÉE ; Nico, à la livraison : *« non en fait il faut montrer soit celle commencée et non
> finie, soit celle la prochaine à faire (commandé par le module décider) »*. Le mécanisme (anneau, mouvement réduit, période,
> correction du départ) est repris tel quel ; la CIBLE change, et les noms avec elle (`mv-dern-*` → `mv-cible-*`). Les numéros
> sautent 7.50 / 8.18 par la règle du doute : on ne réutilise jamais un numéro qui a pu partir en ligne.
>
> Étude de faisabilité faite sur `9e5044d`, lot écrit sur `107a646` (AVANT-2 et DZ-1 poussés entre-temps), tout relu dessus.
> Pas de maquette : le rendu Chromium (390 px) a servi de maquette, montré à la livraison.

### 163a. Ce que les cartes montrent, et pourquoi ce n'est pas « la dernière validée »

« La dernière validée » dit d'où l'on vient. Sur une carte, ce qu'on cherche est **où aller** : la parcelle en cours, sinon la
suivante. Pour une tâche, dans cet ordre :

1. **COMMENCÉES et pas finies** — « Début » touché, pas encore validé. Il peut y en avoir plusieurs (deux équipes, un oubli de la
   veille) : **chacune a son anneau**, aucune n'est cachée derrière un choix arbitraire.
2. Sinon la **PROCHAINE** : la première de la **tournée enregistrée dans Décider** qui reste à faire — le même « 1 » que la liste
   des parcelles affiche. **Sans tournée enregistrée : rien.** Personne n'a dit par où commencer, la carte n'invente pas un ordre.

Quelle tâche, selon la carte : Parcelles › Carte, la **tâche affichée** (sur « toutes », la **priorité du moment**) ; Carte du
domaine, la priorité du moment ; carte de la tournée, les **travaux cochés**, et sa « prochaine » est le n°1 de la tournée
affichée — celle que la carte numérote, enregistrée ou non.

⚠️ **« Commencée » et « finie » se lisent à l'ÉTAPE EN COURS** pour une tâche à passages ou à niveaux : une parcelle dont P1 est
validé n'est pas finie pour la saison, mais elle l'est pour le passage du moment. C'est exactement la lecture de l'écran Vigne.
Plutôt que de la recopier, `_pvCurDone` et `_pvCurStarted` **passent maintenant par `_mvTacheEtat`** (utils.js), et app.js ne garde
que la réponse qu'il est seul à connaître : quelle étape est en cours (`_pvEtapeCourante` — l'étape affichée pour la tâche
affichée, sinon l'étape où en est le domaine).

### 163b. Trouvé en route : la tournée partait de la PREMIÈRE parcelle du jour, à DEUX endroits

- `_opJournalLast` (pilotage.js) gardait la parcelle de plus grande date avec `if(d>=bestD)`, en parcourant le journal dans l'ordre
  du tableau. Le journal s'écrit par `unshift` (le plus récent en tête) : à date égale, `>=` garde le dernier RENCONTRÉ, donc le
  plus ANCIEN du jour. Rejoué : A 8 h, B 10 h, C 15 h → **A**. Le libellé « Départ : auto — dernière faite : A » mentait, et
  l'ordre au plus proche partait de la parcelle du matin.
- ★ **Le même défaut, une seconde fois** : DZ-1 avait écrit `_dzDernierFait` pour « Qui fait quoi », avec la même boucle. Une copie
  privée d'une règle non centralisée se reproduit ; c'est le premier lot qui aurait dû la centraliser. Les deux appellent désormais
  `_mvDerniereValidee`, et le harnais refuse le retour du motif (`bestD`, `dd>=bd`) dans tout pilotage.js.
- `_mvDerniereValidee` : date du TRAVAIL d'abord, puis **heure de saisie** (l'`id` d'une ligne de journal est `Date.now()` en
  hexadécimal, `-qv` derrière pour la validation depuis la carte — rien à ajouter, rien à migrer), puis rang dans le tableau. Une
  validation **annulée** ensuite ne compte plus : `annulerTache` ajoute une ligne « Annulé », il ne retire pas la « Validé ».

### 163c. L'anneau

- `_mvCibleAnneau(map, g)` : `divIcon` `.mv-cible` (40 px) + `<i class="mv-cible-o">`. On anime l'**enfant**, jamais la racine :
  Leaflet place un marqueur par `transform`. `interactive:false` (le toucher passe à la parcelle), `zIndexOffset:-1000`.
- Feuille : `@keyframes mvCible` 2,4 s, échelle .7 ↔ 1, opacité .95 ↔ .3 — une respiration, pas l'onde bleue de la position
  (`mvMePulse`, 1,8 s). L'or de la carte (`#C9A84C`) en dur : la carte a sa palette, elle ne suit pas le thème.
  `prefers-reduced-motion` : l'anneau reste, fixe.
- Les quatre cartes : `_pCibleMapSync` (Parcelles — relancé par `initMap`, `refreshMapColors` et `renderParcelles`, que l'écoute
  temps réel relance : l'anneau suit un « Début » ou une validation venus d'un autre téléphone) ; `_pilBuildMap` (Carte du
  domaine) ; `_dzLayers` (tournée, page ET « Agrandir ») ; `_opMapSvg` (repli hors ligne, cercle `.mv-cible-svg`).
- ⚠️ Parcelles : le centre est occupé par l'étiquette du nom, dessinée au-dessus des marqueurs. L'anneau déborde derrière elle en
  haut et en bas ; noms masqués, il se voit entier.

### 163d. Mesuré

- `mv-harnais-cible` : **33 assertions** — 22 scénarios EXÉCUTÉS sur les vraies définitions (commencée devant la prochaine, deux
  commencées, n°1 fini, hors tournée, arrachée, tâche désactivée, sans tournée, archive, passages P1/P2, plan raccourci, priorité,
  puis le départ : même jour, antidaté, annulé, `-qv`, garde), 11 contrôles d'appelants et de feuille. **16 contre-épreuves**,
  toutes détectées. Branché dans `check`, `prebuild` et la CI (`mv-harnais-portes` vert), `npm run test:cible`.
- Chromium, bundle construit, Leaflet 1.9.4 servi depuis le paquet npm (même empreinte que la SRI de l'appli), 390 × 844, six
  parcelles à contour et une tournée enregistrée : rien de commencé → l'anneau est sur le **n°1 de la tournée** (0,5 px de son
  étiquette) ; une parcelle passée « En cours » → il la rejoint ; deux → **deux anneaux** ; le n°1 validé et rien en cours → il
  descend sur la suivante de l'ordre ; tournée effacée → plus d'anneau ; mouvement réduit → `animation:none`, l'anneau reste.
  Pilotage › Carte du domaine : un anneau autour du point de la parcelle commencée, sur la priorité du moment. Aucune erreur de page.
- ⚠️ Trouvé en passant la chaîne : `mv-harnais-vigne-tri` extrait `_pvCurDone` / `_pvCurStarted` d'app.js et les exécute dans un bac
  SANS `window` — la délégation les y faisait planter. Le bac monte désormais la vraie `_mvTacheEtat` (pas un bouchon) et le harnais
  du tri reste vert (18 assertions + 22 en contre-épreuve). ★ Un harnais qui lit du code doit suivre le code qu'il lit : déplacer
  une définition, c'est déplacer ses bancs d'essai.
- ★ Le cliquet de poids avait rougi (`styles.css` 421 → 443 ko) : DZ-1 l'avait porté à 442, tout juste sous +5 %, et l'anneau ajoute
  1,1 ko. Découper la feuille : non, elle est à 43 % du plafond. Regravé : seuls des `ko` changent.
- Contrôle complet : les **112 commandes** de `npm run check`, toutes vertes (code retour 0), dont `mv-harnais-recup --contre`
  (83 défauts détectés) et le harnais neuf. ⚠️ Jouées en tranches, dans l'ordre de la chaîne et arrêt au premier rouge : le bac
  coupe une commande à 300 s, la chaîne entière en prend un peu plus. `vite build` : OK. `test:smoke` : OK (démarrage, 23/23
  globaux ; Chromium de Playwright python passé par `executablePath`, rien de livré). `test:e2e` : non joué.

### 163e. La note de livraison

**Base `107a646`. APP 7.49 → 7.51 · SW 8.17 → 8.19.** ⚠️ Ne pas intégrer le zip DERN-1 : celui-ci le contient et le remplace.
`node scripts/build-guide.mjs` (le crochet de commit le fait), puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/utils.js` | `_mvTacheEtat`, `_mvCibleCarte`, `_mvTachePrio`, `_mvDerniereValidee`, `_mvVueActive`, `_mvCibleAnneau` ; APP 7.51, deux nouveautés, aide Parcelles et Pilotage | ★ APP |
| `src/app.js` | `_pCibleMapSync` ; `_pvCurDone`/`_pvCurStarted` passent par `_mvTacheEtat` ; `_pvEtapeCourante` ; `_pOrdPeriodeOK` délègue | ★ SW |
| `src/pilotage.js` | `_opCibles` ; `_opJournalLast` et `_dzDernierFait` lisent la définition unique ; anneaux sur `_dzLayers`, `_opMapSvg`, `_pilBuildMap` | — |
| `src/styles.css` | `.mv-cible`, `.mv-cible-o`, `.mv-cible-svg`, `mvCible`, mouvement réduit | ★ SW |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/04-vigne.html` · `guide/11-pilotage.html` | la carte ; la carte du domaine ; l'anneau et le départ | — |
| `scripts/mv-harnais-cible.mjs` · `package.json` · `.github/workflows/ci.yml` | harnais neuf, branché aux trois portes, `test:cible` | — |
| `scripts/mv-harnais-vigne-tri.mjs` | son bac monte la vraie `_mvTacheEtat` (la délégation l'avait cassé) | — |
| `scripts/typo-baseline.json` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | poids regravé · SECTIONS 195 · §163 · base | — |

### 163f. Ouvert, et dit

① **Sans tournée enregistrée, aucun anneau** tant que rien n'est commencé — c'est le choix, pas un oubli : la carte ne propose pas
un ordre que personne n'a décidé. ② La carte de la tournée et son repli n'ont pas été VUS : dans le bac, sans planning ni équipe,
l'écran dit « Rien à faire pour ce travail ». Leur code est tenu par le harnais. ③ Vu dans Chromium, pas sur un vrai téléphone ni
en plein soleil : si l'anneau est trop discret, deux nombres le règlent (opacité basse .3, durée 2,4 s). ④ Une parcelle sans
contour ni coordonnées n'a pas d'anneau : elle n'est nulle part sur la carte. ⑤ Les deux cartes du Pilotage se redessinent à
l'ouverture, pas en direct. ⑥ Plusieurs parcelles commencées font plusieurs anneaux : à regarder sur un domaine où deux équipes
tournent en parallèle, l'écran peut devenir bavard.

## 164. ★★★ CUV-DEC — LE CUVIER SORT DE `cave.js` : `src/cuvier.js`, ET UNE FRONTIÈRE GARDÉE (21/09 — `src/cave.js` · `src/cuvier.js` (neuf) · `src/app.js` · `public/sw.js` · `scripts/mv-cave-src.mjs` (neuf) · `scripts/mv-harnais-cuvier.mjs` (neuf) · 30 scripts de contrôle suivis · 4 références regravées · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP **7.51 inchangé** · SW 8.19 → **8.20** · base `0ceadc4`)

> Nico, sur une cuvée de village : le Chai dit « Fûts pas pleins — ils attendent » presque tout le vin de la cuvée ; la cuve est
> décuvée, donc « Compléter » ne la propose plus. Diagnostic lu dans le code (§164e) : des fûts **pré-cochés** au décuvage sont
> venus EN PLUS des siens, puis ont été retirés par la croix de « Modifier la cuvée » — qui ne touche pas au manque et ne rend
> pas les fûts à La Réserve. Le correctif touche `cave.js`, à **1 023 ko sur 1 024** ; §153h ⑥ : *« le prochain lot Cave
> commence par le découper »*. Question posée (correctif serré dans le 1,7 ko restant, ou découpage d'abord) : *« découpage
> d'abord »*. Base `0ceadc4`, remesurée avant le paquet. Aucun changement visible : c'est un lot de structure.

### 164a. La coupe

- **Ce qui part** : les familles du Cuvier, par leur nom — `_vend*`, `_VEND_*`, `_vt*`, `_VT_*`, `_vcuv*`, `_vnd*`, `_vm*`,
  `_vmesure*`, `_vst*`, `_vpc*`, `_vp*`, `_vl*`, `_liv*`, `_rec*`, `_mat*`, `openVend*` / `openOvVend*` / `saveVend*` /
  `renderVend*` / `deleteVend*` / `exportVend*`, `switchVendOng`, l'état de la répartition et des ventes en vrac (`_vrep`,
  `_vliv`, `_vlivNom`, `_vrecDateHooked`) et les constantes qu'eux seuls lisent (`VD_BL_CSS`, `MV_TRI_RECOLTES`,
  `MV_TRI_MATURITE`, `MV_APP_MAX`, `MV_CUV_*`, `MV_MAT_*`, `_MAT_CAMP_J`). **674 instructions de premier niveau** partent,
  **658** restent : `cave.js` **535 ko**, `cuvier.js` **494 ko**.
- **Ce qui reste** : le Chai, Le millésime, Aujourd'hui, les documents (registre, bilan, cahier de cuverie), les courbes, le
  comparatif, l'assemblage (`_asm*`), le parc à cuves (`_caveCuve`, `_caveParc`…).
- **Comment** : script de découpe hors dépôt, sur l'arbre syntaxique (`espree` + `eslint-scope`, les dépendances d'ESLint).
  Chaque instruction emporte **les commentaires qui la précèdent et ce qui la suit sur sa ligne** ; un commentaire n'est jamais
  coupé en deux. Les morceaux recomposent la source **à l'octet** (contrôlé avant écriture) ; l'ordre d'origine est gardé des
  deux côtés.
- **Ce qui n'est pas un déplacement pur** — quatre retouches, toutes nommées :
  1. `caveSection` était **lue deux fois** par Le Cuvier (`_vendDvolCorriger`, `_vpcAppliquer`) : elle se lit par
     `_caveSectionAct()` (cave.js). La variable ne quitte jamais son module.
  2. `_vendTab` était **écrit quatre fois** par le Chai (`selectCaveSection`, trois fois dans `_mlGo`) : le Chai appelle
     `_vendOngletCuves()` (cuvier.js).
  3. L'import de `cave.js` perd `_mvBadge`, qu'il n'utilise plus ; `cuvier.js` importe ses sept noms d'`utils.js`.
  4. Un commentaire de `_bcDoc` disait « `_recKg` est déclaré dans CE fichier » : il dit maintenant qu'il passe la frontière.

### 164b. La frontière

- **Deux blocs « LA FRONTIÈRE »**, en fin de chaque fichier : **22 expositions dans `cave.js`** (ce que Le Cuvier lit du Chai :
  `_mvF1`, `_caveV2InjectCss`, `_mlAuj`, `_caveSectionAct`, `MV_CUVDOC_CSS`…), **56 dans `cuvier.js`** (ce que le Chai lit du
  Cuvier : `_vendVolContenu`, `_vendHlKg`, `_recKg`, `_vendDecuvee`, `_vendOngletCuves`…). Les autres noms qui traversent
  étaient déjà posés sur `window` par leur propre fichier (vérifié : aucun n'était posé par un autre module).
- Mesuré sur les fichiers écrits : `cave.js` lit **64 noms** de `cuvier.js`, `cuvier.js` en lit **39** (+ les deux objets) ;
  **aucun au chargement, aucun écrit de l'autre côté**. Seul `DEBUG` est déclaré des deux côtés (une constante par module, §24 n°8).
- **`CAVE_VENDANGE` / `CAVE_ELEVAGE`** : déclarés dans `cave.js`, posés sur `window` à son chargement, **mutés en place par tout
  le monde, jamais réaffectés** (vérifié : aucune réaffectation dans les deux fichiers). `cuvier.js` les lit par `window` — le
  même objet. Une réaffectation future ferait lire à Le Cuvier l'objet d'avant : le harnais l'interdit (C).
- **Chronologie** : `app.js` importe `cuvier.js` **juste après `cave.js`**. Aucun des deux n'exécute de code au chargement hors
  déclarations et `window.X = …` (vérifié instruction par instruction) : rien ne lit l'autre avant le premier geste.
- Le bundle : les noms de la frontière restent des **globales** après Terser (`_vendHlKg(` 5 appels nus, `_caveCuve(` 12,
  `_mvF1(` 59 — exactement les références qui traversent), chacun posé une fois par `window.X=`.

### 164c. Les harnais — une seule porte, et ceux qui ont suivi

- **`scripts/mv-cave-src.mjs`** (neuf) : `CAVE_FICHIERS`, `lireCave()` (les deux textes, dans l'ordre d'app.js — pour extraire
  par nom ou par motif) et `importerCave()` (importe les deux vrais modules ; ★ recopie sur `globalThis` ce que chacun pose sur un
  faux `window` : dans le navigateur `window` EST l'objet global, un harnais qui fabrique un `window` distinct casse le pont —
  c'est le décor qui ment, pas le code). Le jour où la Cave se recoupe, on ajoute UN fichier à la liste.
- **Repointés sur `lireCave()`** (22) : `agenda`, `alignement`, `asm1`, `cave-reglages`, `cuv7`, `cuv8`, `cuv13`, `fusion`,
  `futcap`, `intrants`, `parcours`, `poids-caisse`, `rdtmil`, `reste-a-rentrer`, `tri1`, `tri2`, `tri3`, `vendange-garde`,
  `vendange-parts`, `vol1` — plus `cuvdoc` et `cuvgr3` sur `importerCave()`. `poids-caisse` et `vendange-parts` gardent leur
  argument (une copie donnée à la main) ; sans argument, la Cave entière.
- **Listes écrites en dur, complétées** : `couches`, `jetons`, `toast-honnete`, `icones`, `icones-contre`, `subset`,
  `harnais-demo`. ★ Un harnais à liste fermée ne rougit pas quand un module naît : il l'ignore. `cuvier.js` y serait resté
  invisible — et le cliquet de poids (`typo`) saute un fichier sans référence : il échappait au plafond de 1 024 ko.
- **Assertions recalées** (l'intention gardée, la forme suivie) : vol1 `D15` (la section se lit par `_caveSectionAct()`) ;
  `poids-caisse` « le repli mort sur `window._recKg` a disparu » — l'exposition de la frontière est légitime, le REPLI reste
  interdit, borné au nom exact (`_recKgDom` n'est pas `_recKg`) ; **re-mord vérifié** en réinjectant le repli ; `couches` cherche
  `.vt-hd` dans `cuvier.js` ; `mv-chartes-doc` : `_vendRecoltesDoc` et `_matDoc` vivent dans `cuvier.js`.
- **Contre-épreuves** rejouées : futcap 17/17, asm1 17/17, vol1 19/19, poids-caisse 8/8 (★ sa contre-épreuve relançait l'enfant
  avec la cible en dur : l'enfant n'aurait lu que `cave.js`, planté sur les fonctions du Cuvier, et chaque plantage serait passé
  pour un sabotage « vu » — il ne passe la cible que si on en a donné une), cuv8, cuv13, cuvgr3 6/6 (★ le vrai fichier est rendu
  dans un `finally`).
- **Références regravées, total par total** — la base réelle d'abord, dans un clone intact (`git worktree` sur `0ceadc4`) :
  `preflight-baseline` (C24b : `cave.js` 26 → 20, `cuvier.js` 6 ; `planning.js` 24 → 23, une baisse d'avant ce lot), `mv-icones`
  (26 = 22 + 4), `subset` (53 = 43 + 10), `contraste` (clair 11 = 6 + 5, sombre 47 = 20 + 27, surfaces 4 = 1 + 3), `typo` (`dur`
  et `petit` inchangés au total, `cave.js` 1 023 → 535 ko, `cuvier.js` 494). ★ Les références d'icones (669) et de subset (274)
  étaient **déjà périmées** sur la base (639 et 272 : pilotage et planning avaient baissé sans regravure) — mesuré avant de
  conclure, sinon on aurait attribué au découpage une baisse de 30 emojis qu'il n'a pas faite.
- **`scripts/mv-harnais-cuvier.mjs`** (neuf) : A l'import juste après `cave.js` · B tout nom lu chez l'autre est exposé PAR SON
  fichier, jamais lu au chargement, jamais écrit · C les deux objets partagés jamais réaffectés · D chaque famille chez elle (pas de
  `_vend*` dans `cave.js`, pas de `_cave*` / `_ml*` / `_asm*`… dans `cuvier.js`) · E `const DEBUG` des deux côtés, `cuvier.js`
  n'importe qu'`utils.js` · F rien ne tourne au chargement. **15 assertions, 10 contre-épreuves**, chacune attrapée par SA règle.
  Branché dans `check`, `prebuild` et la CI (`mv-harnais-portes` vert) ; `npm run test:cuvier`. ★ Il dit ce que
  `mv-harnais-globaux` ne peut pas dire : QUI pose le nom, QUAND on le lit, et si on l'ÉCRIT.

### 164d. ★ Trouvé en route : la contre-épreuve de `cuvdoc` ne prouvait rien

Elle écrivait ses copies sabotées **à la racine du dépôt** ; `import './utils.js'` y cassait (`ERR_MODULE_NOT_FOUND`) ; **chaque
enfant plantait**, et un plantage comptait comme un défaut attrapé — « 25 rouges » sans qu'aucune assertion n'ait tourné.
Réparée : les copies vont dans un dossier temporaire, **à côté d'une copie d'`utils.js`**, et un enfant qui plante sans assertion
rouge compte comme **sans effet**. Le défaut 5 (ordre de maturité) visait une ligne réécrite par TRI-1 : réancré sur
`_matTrier(_matClasse(byP, spd), mtri)`. Résultat honnête : **24 défauts attrapés sur 26**. Les deux autres (19 : la légende qui
date les passages ; 26 : le rabattement au bord bas) **restent verts aussi sur la base** — des trous du harnais, masqués par les
plantages, hors de ce lot. `test:cuvdoc` n'est pas dans la chaîne de `check` : il sort rouge, comme avant ce lot, mais pour une
raison vraie. ★ Une contre-épreuve qui compte un plantage comme une prise est la même faute qu'un harnais qui compte un
plantage comme un vert (§6b) : il faut regarder POURQUOI l'enfant a rougi.

### 164e. Le fût « pas plein » — le diagnostic, pour le lot suivant

Lu dans le code, pas dans les données (le bac n'y a pas accès) ; c'est le seul chemin qui donne exactement le message décrit :
1. **« Décuver »** : dès que le volume mesuré est tapé, la proposition coche des fûts, **les plus vieux** — donc **en bas** de la
   liste, que `_mvFutStock` range du plus récent au plus ancien. Les fûts ajoutés à la main avec « + » s'**ajoutent** à la
   proposition. `saveVendDecuvage` écrit `manque_l = F − (M − C)` : le vide des fûts en trop. ⚠️ Et le `change` du champ volume
   REFAIT la proposition (`_vendDecPropose`) : taper ou corriger le volume après avoir choisi ses fûts efface le choix (seuls les
   hors-format sont gardés).
2. **« Modifier la cuvée »** : la croix (`removeCuvTonneau`) retire la ligne ; `saveCuvee` réécrit `tonneaux` **sans toucher
   `manque_l`** (§153h ② l'avait noté ouvert) et **sans rendre les fûts** au parc (`INTRANTS.futs[].qte` ne compte que les fûts
   libres — ils disparaissent de La Réserve). `_caveManqueL` plafonne au bois restant : ce sont les vrais fûts qui « attendent »
   presque tout le vin (`_asmCarteHtml` : « Fûts pas pleins — ils attendent N L »).
3. La cuve est décuvée : `_asmSources` l'exclut. Aucun geste ne permet de dire « mes fûts sont pleins ».
**Réparer les données sans code** : console Firestore, `mavigne_<slug>` › `cave_elevage` › `value.cuvees[n].manque_l` (0, ou les
litres qui manquent vraiment), puis relancer l'appli ; remettre dans La Réserve les fûts disparus. Si c'est « Retirer un fût »
qui a servi : les fûts sont revenus au parc, mais une ligne « Retrait fût » (motif « Vente » par défaut) reste au journal.
**Le correctif proposé** (lot suivant, `cave.js` et `cuvier.js` ont maintenant de la place) : ① « Compléter le fût » gagne une
sortie « Mes fûts sont pleins — corriger ce qui manque » (une correction, pas une opération du registre) ; ② « Modifier la
cuvée » : enlever un fût enlève d'abord son vide et le rend à La Réserve s'il en venait (`lot_id`) ; ③ « Décuver » : un fût
choisi à la main remplace un pré-coché en trop, et corriger le volume ne refait plus la proposition sur un choix déjà fait.

### 164f. Mesuré

- `npm run check` : **la vraie chaîne, jouée en entier sur l'état livré — code retour 0** (292 s, lancée détachée : le bac coupe
  une commande à 300 s). Avant elle, les 114 commandes une par une, sans arrêt au premier rouge : une seule tombait — C26 lisait
  « import(s) » dans un TEXTE du harnais neuf (la règle ne blanchit pas les chaînes) ; libellé réécrit, la règle n'a pas bougé.
- `npx vite build` : OK (l'avertissement « chunk > 800 kB » est connu, non bloquant). `test:smoke` : démarrage OK, 23/23 globaux
  (Playwright 1.61 : `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, liens vers le Chromium 1194 du bac, §149a).
- ★★ **Parcours réel sur l'appli COMPILÉE** (hors dépôt, `/home/claude/lot/parcours-cuvier.mjs`) : Chromium 390 × 844, réseau
  extérieur coupé, mode visite (le login démo court-circuité, le scénario de la visite pose ses données en mémoire), puis
  **41 étapes** : Aujourd'hui, les quatre onglets du Cuvier, une cuve dépliée, relevé, saignée, décuvage, fiche cuve, récolte,
  ventes en vrac, fusion, volume décuvé, les trois documents du Cuvier, les trois `_mlGo`, le Chai et ses onglets, fiche et
  modification de cuvée, retrait de fût, « Compléter » sur chaque cuvée, registre, bilan, Le millésime, réglages, Pilotage,
  Réglages, La Réserve. **Aucune erreur pendant les étapes** ; au chargement, deux messages, les mêmes sur la base (service
  worker bloqué par le test, vibration refusée). ★ **Le même parcours sur le build de la base : DOM identique, écran par écran,
  41 sur 41, deux passes** — une fois retirés l'écran d'accueil animé et le toast, qui changent d'une passe à l'autre même sur la
  base seule. C'est la preuve qu'un lot de structure doit donner : rien n'a bougé à l'écran.
- `test:e2e` : non joué (émulateurs Firebase).

### 164g. La note de livraison

**Base `0ceadc4`. APP 7.51 inchangé · SW 8.19 → 8.20** (`app.js` touché : bump SW seul, `WHATS_NEW` intact — aucun changement
visible, §7). Puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/cave.js` | le Cuvier en moins ; `_caveSectionAct` ; `_vendOngletCuves()` ×4 ; import sans `_mvBadge` ; bloc « LA FRONTIÈRE » (22) ; en-tête | — |
| `src/cuvier.js` (neuf) | Le Cuvier, dans l'ordre d'origine, avec ses commentaires ; `_vendOngletCuves` ; bloc « LA FRONTIÈRE » (56) ; en-tête | — |
| `src/app.js` | `import './cuvier.js'` juste après `cave.js` | ★ SW |
| `public/sw.js` | 8.20 : en-tête, changelog, `CACHE_NAME`, deux `console.log` | ★ SW |
| `scripts/mv-cave-src.mjs` · `scripts/mv-harnais-cuvier.mjs` | neufs | — |
| 30 scripts de contrôle (`scripts/`) | repointés, listes complétées, deux assertions recalées, contre-épreuve de `cuvdoc` réparée | — |
| `scripts/preflight-baseline.json` · `mv-icones-baseline.json` · `subset-baseline.json` · `contraste-baseline.json` · `typo-baseline.json` | regravés, total par total | — |
| `package.json` · `.github/workflows/ci.yml` | `mv-harnais-cuvier` (et `--contre`) aux trois portes ; `test:cuvier` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 196 · §164, §5, §20, en-tête · base | — |

### 164h. Ouvert, et dit

① **Le correctif du fût « pas plein »** (§164e) : le lot suivant, sur cette base. ② Les trous 19 et 26 de la contre-épreuve de
`cuvdoc` (§164d). ③ La frontière est **large** (78 expositions) : c'est la mesure honnête d'un fichier qui n'avait jamais été
pensé en deux ; la resserrer (un module « parc à cuves » partagé, par exemple) serait un lot de structure à part, pas une
urgence. ④ `cave.js` garde les documents du Cuvier qui lisent les deux mondes (cahier de cuverie, comparatif) ; `cuvier.js`
garde le contrôle de maturité. ⑤ `test:e2e` et un vrai téléphone, chez Nico.

## 165. ★★★ CREUX-1 — CE QUI MANQUE DANS LES FÛTS DIT LA VÉRITÉ : « MES FÛTS SONT PLEINS », LE FÛT ENLEVÉ EMPORTE SON VIDE, LE « + » NE DOUBLE PLUS LE BOIS (21/09 — `src/cave.js` · `src/cuvier.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/08-cave.html` · `scripts/mv-harnais-creux.mjs` (neuf) · `scripts/mv-harnais-futcap.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.51 → **7.52** · SW 8.20 → **8.21** · base `81e93f9`)

> Le correctif proposé en §164e, dans l'ordre choisi par Nico (« découpage d'abord », puis « go »). CUV-DEC poussé (`81e93f9`,
> contenu vérifié identique au zip livré) : ce lot est écrit dessus. Pas de maquette : trois gestes sur des écrans existants, et
> le rendu Chromium de l'appli compilée a servi à les regarder (§165e).

### 165a. « Mes fûts sont pleins — corriger ce qui manque » (`cave.js`)

- Une sortie dans la feuille **« Compléter le fût »**, sous le bouton principal (`mvv-act2`, le style de « Corriger le volume »).
  Elle est là même quand **aucune source** n'a de vin — c'était le cas signalé : la cuve décuvée n'est plus proposée.
- `_asmCorriger(cuvId)` : ferme la feuille, ouvre `openPrompt` pré-rempli du manque actuel, dit la contenance du bois et le
  sens de la correction. **0 = les fûts sont pleins** ; refus de plus que le bois, d'un négatif, d'un texte ; virgule acceptée.
  Écrit `manque_l`, enregistre, repeint. **Rien au journal ni au registre** — une correction, comme « Corriger le volume ».
  Lecture seule : ne s'ouvre pas.

### 165b. « Modifier la cuvée » : le fût enlevé emporte son vide, et rentre au parc (`cave.js`)

- `saveCuvee` compare le bois d'avant et d'après : ce qui a été enlevé **retire d'abord le vide** (`manque_l` baisse d'autant,
  jamais sous 0). Le vin ne bouge pas : c'est une correction de contenants, pas une sortie de vin (celle-là, c'est « Retirer un
  fût »). Un manque **déduit** (champ absent, cuvée d'avant ASM-1) n'est pas écrit : il se redéduit seul sur le bois restant.
- `_cuvRendreFuts(avant, apres, note)` : par `lot_id` (posé à l'entonnage), les fûts enlevés **retournent à La Réserve** par
  `_mvFutEntrer` (même triplet et même contenance, sinon un lot neuf), tracés « retiré d'une cuvée ». **Une ligne sans lot n'y
  va pas** (saisie à la main, d'avant le parc : la fiche fabriquerait des fûts). Le toast le dit : « · 5 fûts rendus à La Réserve ».
- **Une cuvée embouteillée** n'a plus ses fûts (ils sont au parc depuis la mise) : ni manque ni retour.

### 165c. « Décuver » : le « + » remplace un fût proposé en trop (`cuvier.js`)

- `_vendDecMain` : les lots **touchés à la main** (`{lot_id: true}`), remis à zéro à l'ouverture et au passage « en cuve ».
- `_vendDecPropose` : un lot choisi **garde son compte, même à zéro** (zéro = « pas ceux-là »), comme les hors-format avant lui ;
  la proposition ne remplit que les lots **non choisis**. `_vendDecPropVol` (pure, prouvée litre par litre) n'a pas bougé :
  seules ses entrées changent.
- `_vendDecAdjLot` : marque le lot ; un **« + »** sur un lot au format retire les fûts **proposés** devenus de trop
  (`_vendDecSansTrop`, pure : du plus neuf au plus vieux — l'inverse de la proposition —, jamais un choix, jamais un hors-format,
  tant que l'excès contient un fût entier). Un **« − »** ne recoche rien ailleurs : le bilan dit ce qui manque, la main choisit où.
- La liste le dit : « Vos fûts choisis à la main restent : les fûts proposés s'ajustent sur le reste. »
- ★ Ce que la base faisait, mesuré sur l'appli compilée (§165e) : **quatre « + » sur le lot du haut donnaient 8 barriques**
  (la proposition, en bas, restait cochée), et **retaper le volume effaçait le choix** — `change` refaisait la proposition sans
  garder que les hors-format. C'est exactement l'enchaînement de la cuvée signalée.

### 165d. Les harnais

- `scripts/mv-harnais-creux.mjs` (neuf) — **30 assertions, 12 contre-épreuves**, sur les VRAIES fonctions de la Cave (par
  `lireCave()`) et d'`utils.js` : A la fonction pure (le cas vécu, l'ordre, le seuil, hors-format, choix intouchables, pureté) ;
  B la feuille geste par geste (★ le cas vécu : C = 5, A = 0, 5 fûts ; le volume retapé ; le « − » ; le hors-format comme avant ;
  un choix sur le lot le plus vieux qui ne grossit pas) ; C la fiche (★ le cas vécu : plus rien ne manque, 5 fûts rentrent tracés
  « retrait » ; 5 → 3 ; ligne sans lot ; embouteillée ; manque déduit ; ligne ajoutée) ; D la sortie (pré-remplie, 0, 30,4 → 30,
  refus, lecture seule, bouton joignable) ; E l'accompagnement. Les déclarations d'état (`var _vendDecMain={};`…) sont extraites
  telles quelles : si l'une disparaît, le bac ne se charge pas. Branché dans `check`, `prebuild` et la CI ; `npm run test:creux`.
- `mv-harnais-futcap` B6 lisait la forme exacte du filtre de la proposition : recalé pour accepter l'exclusion des lots choisis,
  l'exclusion du hors-format reste exigée (64/64, 17 contre-épreuves).

### 165e. Le vrai code, rendu — et touché

Hors dépôt (`/home/claude/lot/parcours-creux.mjs`) : l'appli compilée, Chromium 390 × 844, réseau coupé, la visite (son parc :
Rousseau 2025 ×6 en bas de la liste, Rousseau 2026 ×4 et Damy 2026 ×2 en haut), puis de vrais clics :
- **Décuver** (9,12 hL, 4 fûts) : proposé Rousseau 2025 ×4 ; quatre « + » sur Rousseau 2026 → **2025 : 0, 2026 : 4, « Décuver dans
  4 barriques »**, la phrase des choix affichée ; volume retapé à 11,40 → 2026 : 4 gardés, 2025 : 1. ★ **Le même geste sur le build
  de la base : 8 barriques, puis 2025 : 5 et 2026 : 0 au volume retapé.**
- **Compléter** : la carte « Vieilles Vignes » (1 fût entamé), la sortie, le dialogue pré-rempli à 16 L, 0 → la carte n'a plus de
  fût entamé.
- **Modifier la cuvée** : une cuvée d'essai (2 fûts du lot 2025 + 3 du lot 2026, 456 L de manque) ; la croix sur la ligne 2025,
  Enregistrer → manque 0, une ligne, **le lot 2025 de La Réserve passe de 6 à 8**.
- Aucune erreur du code de l'appli ; au journal, seulement le réseau coupé (Firestore hors ligne, App Check).
- Regardé : la sortie sous « Compléter le fût », la liste de la feuille Décuver avec sa phrase. Rien ne déborde.
- `npm run check` : la vraie chaîne, jouée en entier sur l'état livré — **code retour 0** (325 s, lancée détachée). `vite build`
  OK, `test:smoke` OK (démarrage, 23/23 globaux). `test:e2e` : non joué (émulateurs Firebase).

### 165f. Accompagnement

`guide/08-cave.html` : « Vos fûts restent les vôtres » (nouvelle ligne du Cuvier), la fiche qui rend les fûts, « Mes fûts sont
pleins » sous « Compléter un fût entamé » (et : un fût compté en trop se retire dans « Modifier la cuvée », « Retirer un fût »
sert quand du vin sort). `MV_AIDE` : « Au décuvage », « Modifier une cuvée garde ses fûts », « Un fût entamé se complète ».
« Quoi de neuf » 7.52 : trois entrées, écrites depuis le chai (exécutées en Node par `mv-whatsnew-check`). La démo guidée ne
passe ni par la feuille Décuver ni par « Compléter » : rien à y changer (sa cuvée « Vieilles Vignes » montre le fût entamé et,
désormais, la sortie). `public/guide.html` : régénéré par le crochet de commit, **non livré** (§5, on livre l'entrée).

### 165g. La note de livraison

**Base `81e93f9`. APP 7.51 → 7.52 · SW 8.20 → 8.21.** `node scripts/build-guide.mjs` (le crochet de commit le fait), puis
`npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/cave.js` | `_asmCorriger` et sa sortie dans `_asmOuvrir` ; `saveCuvee` (le vide, le retour au parc, le toast) ; `_cuvRendreFuts` | — |
| `src/cuvier.js` | `_vendDecMain` ; `_vendDecPropose` garde les choix ; `_vendDecAdjLot` + `_vendDecSansTrop` ; la phrase de la liste | — |
| `src/utils.js` | APP 7.52 ; « Quoi de neuf » (trois entrées) ; trois fiches d'aide | ★ APP |
| `index.html` · `public/sw.js` | les quatre versions · 8.21 | ★ APP · ★ SW |
| `guide/08-cave.html` | trois passages | — |
| `scripts/mv-harnais-creux.mjs` · `package.json` · `.github/workflows/ci.yml` | harnais neuf aux trois portes, `test:creux` | — |
| `scripts/mv-harnais-futcap.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | B6 recalé · SECTIONS 197 · §165 · base | — |

### 165h. Ouvert, et dit

① **La cuvée signalée se répare dans l'appli** : Le Chai › sa carte « Fûts pas pleins » › « Mes fûts sont pleins — corriger ce
qui manque » › 0. Les fûts **déjà perdus** de La Réserve (retirés par la croix avant ce lot) ne reviennent pas seuls : on ne sait
plus lesquels — ils se remettent à la main dans leur lot. ② « Retirer un fût » (un événement : du vin sort) ne touche toujours pas
le manque — voulu ; un fût vide compté en trop se retire par la fiche. ③ La sortie n'existe que quand il manque quelque chose : dire
qu'un fût s'est vidé (lies parties au soutirage) reste §153h ①. ④ Les deux trous de la contre-épreuve de `cuvdoc` (§164d).
⑤ `test:e2e` et un vrai téléphone, chez Nico.

## 166. ★★★ TAP-1 — FAIRE DÉFILER NE COCHE PLUS : LA COCHE PARTAIT AU LEVER DU DOIGT, QUEL QU'AIT ÉTÉ SON CHEMIN (22/09 — `src/tracteur.js` · `src/styles.css` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/06-tracteur.html` · `scripts/mv-harnais-tap.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · APP 7.52 → **7.53** · SW 8.21 → **8.22** · base `ae8df34`)

> Nico : « Il faut absolument revoir la façon dont on doit cliquer dans les sessions tracteur. C'est actuellement beaucoup trop
> sensible et rien que défiler ça valide les parcelles… ». Diagnostic rendu avec une seule question — la confirmation avant de
> décocher, recommandée — et la réponse a été « Continuer » : la recommandation est retenue. Pas de maquette : les gestes et
> l'écran ne changent pas, seule leur reconnaissance change, plus une boîte de confirmation qui existait déjà (`openConfirmDel`).

### 166a. Le défaut, lu dans le code — puis rejoué dans Chromium

`renderSDParcelles` posait sur chaque ligne : `touchstart` → minuteur d'appui long ; `touchmove` → **annule l'appui long, et
rien d'autre** ; `touchend` → `preventDefault()` puis `toggleSessionParcelle`. **La coche partait au lever du doigt, quel qu'ait
été son chemin.** Un défilement qui finissait sur une ligne la cochait ; chrono allumé, il fermait la mesure en cours et en
ouvrait une autre. Trois pièges de la même famille :
① toucher pour ARRÊTER une liste lancée comptait comme un appui ;
② après un appui, la liste se redessine et se RÉORDONNE (chrono : tri par distance à la parcelle en cours) : un second appui
   coup sur coup tombait sur la ligne qui venait de glisser sous le doigt ;
③ dans « Voir toutes », un appui de travers sur une parcelle faite la décochait sans rien demander, et effaçait son `dmin` ou
   sa valeur saisie.

Mesuré sur l'appli compilée de la BASE (Chromium 390 × 844, vrais contacts, §166e) : défilement parti d'une ligne → **P04
cochée** ; un coup de doigt vif puis un appui pour arrêter la liste → **deux** parcelles cochées (celle où le glissé est parti,
celle de l'arrêt) ; deux appuis à 180 ms → **P04 et P05** ; chrono allumé, un défilement **démarre la mesure** sur la ligne de
départ, et la liste arrêtée clôt une parcelle et en ouvre une autre.

### 166b. Le modèle : l'appui est le `click` du navigateur, filtré

- Le navigateur ne fabrique jamais de `click` à partir d'un défilement : dès qu'il prend le doigt pour faire défiler, il envoie
  `pointercancel`, et rien derrière. C'est **la même tolérance que tous les autres boutons de l'appli** (des `onclick`) : le
  geste maison sur `touchend` était l'exception, pas la règle.
- `_sdTapVerdict(g, now, dernier)` — pure — filtre encore, dans l'ordre : l'appui long a déjà agi · la liste filait encore
  quand le doigt s'est posé (moins de 120 ms depuis le dernier `scroll` de la feuille) · la feuille a défilé pendant le geste
  (plus de 2 px) ou le navigateur a pris le doigt · glissé de plus de 16 px (la souris, qui clique même après un glissé) ·
  moins de 600 ms depuis le dernier geste de la liste.
- L'appui long (480 ms, doigt immobile) garde son rôle, passé aux événements `pointer*` : doigt et souris ont le même chemin ;
  le bouton droit n'arme rien ; `contextmenu` est retenu.
- `.sdp-row` : `touch-action:manipulation` (le click part sans attendre un éventuel double appui), `user-select:none` et
  `-webkit-touch-callout:none` (ni sélection du nom, ni menu, à l'appui long).
- ⚠️ Le bloc vit entre deux bornes commentées (`// ── TAP-1 : début du bloc` … `// ── TAP-1 : fin du bloc ──`) : le harnais
  l'exécute TEL QUEL. Déplacer une borne casse le harnais — exprès.

★ **Les arbitrages.**
- **Pourquoi pas un geste maison mieux écrit** (`pointerup` + un seuil à nous) : tant que `touch-action` laisse défiler — il le
  faut, les lignes remplissent la liste —, c'est de toute façon le seuil du navigateur qui décide quand un contact devient un
  défilement. Le `click` natif le reprend, gère la liste lancée sur les deux plateformes, et marche au clavier et au lecteur
  d'écran, que l'ancien geste ignorait.
- **Aucune confirmation sur la coche, ni sur l'enchaînement du chrono** : le chemin rapide reste rapide (§22b). La confirmation
  ne porte que sur la décoche, parce qu'elle efface une mesure.
- **600 ms** : un double appui accidentel (cahot, habitude) tombe sous 300 ms ; chercher des yeux la parcelle suivante prend
  plus. **16 px** : au-delà c'est un glissé ; en deçà, un doigt qui tremble dans la cabine. ⚠️ Le prix, et il est voulu : un
  doigt qui glisse de plus de quelques millimètres pendant l'appui ne coche plus rien — il faut retoucher. Mieux vaut un appui à
  refaire qu'une parcelle validée à tort.

### 166c. Décocher demande confirmation (`toggleSessionParcelle`, `_sdDecocher`)

- Parcelle faite touchée → `openConfirmDel('Décocher « X » ?', …, 'Décocher')`, qui dit ce qui sera perdu : le temps mesuré
  (`dmin`), la valeur saisie (`data`), sinon « Elle repassera dans les parcelles restantes. » Le nom passe BRUT : la boîte
  écrit par `textContent` (§22c, pas de double échappement).
- `_sdDecocher(nom)` retrouve la parcelle **par son nom au moment de la confirmation**, jamais par l'index lu à l'appui :
  entre les deux, un autre appareil a pu réécrire la liste (FUSION-1, §146). Déjà décochée ailleurs → rien.
- Sans `openConfirmDel` chargé, la décoche se fait quand même (repli) plutôt qu'un geste mort.
- Le `catch` qui suit la décoche portait l'étiquette `tracteur.js/blink` — le nom de la fonction d'à côté. Il porte
  `tracteur.js/_sdDecocher`, toujours unique (AVALE-1).

### 166d. ★ Trouvé en route : le point d'aide « Changer d'année » vivait dans la fiche TRACTEUR

§112 (PLAN-RECAL) écrit : « `MV_AIDE.planning` reçoit un point « Changer d'année » ». Le code l'avait posé dans
`MV_AIDE.tracteur` : « ? Aide » sur le Tracteur expliquait les onglets d'année et les modèles du Planning, et la fiche Planning
ne l'avait pas. **Règle d'or n°3, encore : une section qui décrit un changement n'est pas une preuve que le changement est
là où elle le dit.** Le texte est repris tel quel, après « La roue crantée » de la fiche Planning ; `_pl2YearTabs` et
`_planRecaleBar` existent toujours.

### 166e. Les contrôles — et l'outil de mesure qui mentait

- `scripts/mv-harnais-tap.mjs` (neuf) — **45 assertions, 11 contre-épreuves**, toutes détectées : A le verdict (11 cas) ; B le
  VRAI bloc exécuté sous des enchaînements d'événements d'un navigateur tactile, au PIRE cas (le modèle envoie un click même
  après une liste arrêtée ou un appui long) ; C la décoche (confirmation, nom retrouvé, repli, coche d'un seul geste, chrono) ;
  D câblage, CSS, aide, guide, « Quoi de neuf ». Contre-épreuve n°1 : l'ANCIEN geste remis mot pour mot → **11 rouges**, dont
  le cas signalé. Branché dans `check`, `prebuild` et la CI ; `npm run test:tap`.
- ★ **La contre-épreuve a trouvé un trou du harnais, pas du code** : retirer la marque de l'appui long ne rougissait rien, parce
  que le click arrivait 120 ms après l'appui long et que le rebond de 600 ms le couvrait. Ajouté : l'appui long tenu 1,5 s, où
  le rebond ne couvre plus. **Deux gardes qui se recouvrent se masquent l'une l'autre : il faut un cas où chacune est seule.**
- ★★★ **Chromium, vrais contacts** (hors dépôt, `/home/claude/lot/parcours-tap.py` : l'appli compilée, 390 × 844, tactile,
  réseau coupé, service worker bloqué, un domaine d'essai de 24 parcelles posé par `applyFbData`). Premier passage : **sur le
  lot, l'appui franc ne cochait plus rien.** Le journal des événements a dit pourquoi : `Input.synthesizeTapGesture` (CDP) ne
  produit **aucun click** dans ce Chromium headless — le bouton « Voir toutes », un `onclick` ordinaire qui marche sur tous les
  téléphones, n'en recevait pas non plus. `Input.dispatchTouchEvent` (ce que fait `page.touchscreen.tap`) produit la vraie
  chaîne : `pointerdown`, `touchstart`, `pointerup`, `touchend`, `mousedown`, `mouseup`, `click`. ⚠️ **Un témoin qui marche
  partout aurait dû être le premier geste** : c'est lui qui a dit que l'outil mentait, pas le code. Et il ne fallait pas livrer
  sur la foi du harnais : il était vert pendant que l'outil de mesure disait « cassé ».

  | Geste (vrais contacts) | Base, sans chrono | Lot, sans chrono | Base, chrono | Lot, chrono |
  |---|---|---|---|---|
  | défilement parti d'une ligne | **P04 cochée** | rien | **mesure démarrée sur P04** | rien |
  | coup de doigt vif, puis appui pour arrêter (élan mesuré : 48 px en 30 ms) | **2 cochées** | rien | **1 close + 1 ouverte** | rien |
  | appui franc | P04 | P04 | P04 en cours | P04 en cours |
  | deux appuis à 180 ms | **P04 + P05** | P04 | P04 en cours | P04 en cours |
  | appui long 0,9 s (aucun bloc) | rien | rien | rien | rien |
  | appui, puis appui long sur une autre (bloc ouvert) | — | — | P04 + P06 | P04 + P06 |
  | doigt qui tremble de 4 / 8 / 12 / 20 px | cochée ×4 | cochée ×3, **pas à 20** | — | — |

  Décoche sur le lot : « Voir toutes », appui sur P01 → la boîte « Décocher « P01 » ? » s'ouvre, P01 reste cochée ; « Décocher »
  → P01 repasse dans les restantes. Regardés : la boîte (lisible, bouton rouge), la ligne en cours et le toast du bloc. Aucune
  erreur de page.
- `npm run check` : **les 118 étapes de la vraie chaîne, jouées une à une et en entier sur l'état livré — 0 rouge,
  338 s cumulées** (par tranches de moins de 300 s : l'outil coupe au-delà ; `scripts/` inchangé pour ça). `test:smoke` :
  **OK** (démarrage, 23/23 globaux ; le Playwright de `node_modules` réclamait le Chromium 1228, pointé vers le 1194 du bac à
  sable, rien de livré). `test:e2e` : non joué (émulateurs Firebase).

### 166f. Accompagnement

`MV_AIDE.tracteur` : « Faire défiler la liste ne coche rien » (défilement, liste arrêtée, double appui, confirmation) ;
« Changer d'année » rendu au Planning (166d). `guide/06-tracteur.html` : deux lignes sous « Conduire une session », et la
question « Je me suis trompé sur le nombre de trous » passe par « Voir toutes » et la confirmation. « Quoi de neuf » 7.53 : trois
entrées écrites depuis la cabine, exécutées en Node par `mv-whatsnew-check`. `MV_INFO` : aucun chiffre ne change de méthode. La
visite guidée ne passe pas par la feuille de session : rien à y changer. `public/guide.html` : régénéré par le crochet de commit,
**non livré** (on livre l'entrée).

### 166g. La note de livraison

**Base `ae8df34`. APP 7.52 → 7.53 · SW 8.21 → 8.22.** `node scripts/build-guide.mjs` (le crochet de commit le fait), puis
`npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/tracteur.js` | le bloc TAP-1 (`_sdTapVerdict`, `_sdArmerLigne`, `_sdArmerDefil`) ; la décoche confirmée ; `_sdDecocher` | — |
| `src/styles.css` | `.sdp-row` : pas de zoom au double appui, ni sélection ni menu à l'appui long | ★ APP · ★ SW |
| `src/utils.js` | APP 7.53 ; « Quoi de neuf » (trois entrées) ; fiche Tracteur ; « Changer d'année » rendu au Planning | ★ APP |
| `index.html` · `public/sw.js` | les quatre versions · 8.22 | ★ APP · ★ SW |
| `guide/06-tracteur.html` | deux lignes et la question des trous | — |
| `scripts/mv-harnais-tap.mjs` · `package.json` · `.github/workflows/ci.yml` | harnais neuf aux trois portes, `test:tap` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 198 · §166 · base | — |

### 166h. Ouvert, et dit

① **Un vrai téléphone dans la cabine** : Chromium headless n'est ni Chrome Android ni Safari iOS ; la tolérance du doigt qui
tremble (12 px acceptés, 20 refusés ici) dépend du téléphone. Si des appuis francs « ne prennent pas » avec des gants, c'est
elle — le premier réglage à revoir est `_SD_GLISSE_PX`, pas le principe. ② Pas d'« Annuler » après une coche : une coche de
travers se reprend par « Voir toutes » et la confirmation. Un toast avec « Annuler » demanderait une primitive neuve dans
`utils.js`. ③ L'appui long (480 ms) reste celui d'avant : un pouce posé immobile sur une ligne, chrono ouvert, ajoute encore
la parcelle au bloc (le toast le dit). ④ Les compteurs du Cuvier (`_vtDown`/`_vtUp`, §109) sont déjà en `pointer*` avec
`pointercancel` : même famille, non touchés, non rejoués ici. ⑤ `test:e2e`, chez Nico.

---

## 167. ★★★ DIMAV-1 — AVANT SEPTEMBRE 2026, LA MAJORATION DU DIMANCHE ET DU FÉRIÉ VA AU COMPTEUR, QUEL QUE SOIT LE MODE (22/09 — `src/planning.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/10-planning.html` · `scripts/mv-harnais-majoration.mjs` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.53 → **7.54** · SW 8.22 → **8.23** · base `f13c3ba`)

> Nico : *« pourquoi dans le planning les heures sup d'avant septembre et les dimanches et jours fériés ne sont pas
> comptés ? »* — expliqué (règle d'avant : écart du mois, 1 pour 1 ; majoration d'avant revalorisée en septembre seulement,
> AVANT-2). Puis : *« c'est parce qu'on rentrait les heures sup et les dimanches manuellement avant septembre ? »* — deux voies
> proposées (ressaisir la grille ; champ manuel par mois). Réponse : ***« Non, le but, c'est juste que tu lises ce qu'il y a
> d'écrit sur le planning de chacun et tu vois très bien si ça tombe un dimanche ou un jour férié. Il faut l'ajouter, il faut
> qu'il y ait une ligne visible du nombre d'heures qui ont été effectuées ces jours-là, mois par mois, et ce que ça ajoute en
> temps de repos réel. Avec la loi des 50 %. »***

### 167a. Le défaut, mesuré

- `_planMajMonth` lisait DÉJÀ la grille jour par jour depuis janvier 2026 (§73). Le trou était en aval : `_planMajBank` =
  `_planHsupPayable() ? 0 : maj`. En mode **payé** (défaut de `CONFIG.hsup_mode`), un mois d'avant `PLAN_RECUP_DEBUT` mettait
  0 au compteur — « la majoration se paie » —, or ces paies (janvier → août) n'ont pas été éditées par Ma Vigne. Elle n'allait
  nulle part, et la colonne « Majoration » du tableau annuel ne s'affichait même pas (`anyMaj` faux).
- Aggravé par AVANT-2 (§161) : `_planEstLecture` range l'heure du dimanche en `deja` (« sa majoration est ailleurs ») et
  `revalorise()` la laisse à 1 pour 1. Un dimanche de juillet de 8h, rien de prévu : **8h** au compteur au lieu de **12h**.

### 167b. Le moteur — `_planMajAuCompteur(m)`

- `!_planHsupPayable() || !_planRecupActive(m)` ; `_planMajBank` le lit. Avant la bascule : au compteur, tranche `maj`, **au
  mois qui l'a produite** (même règle que le mode récup, §73d) — l'invariant `solde − dette = net` tient sans rien toucher.
  Depuis septembre : inchangé (payé → paie, DIM-1 ; récup → compteur).
- Effet de bord voulu : le `deja` d'AVANT-2 dit enfin vrai (la majoration EST dans la tranche `maj` du même mois).
- Taux : ceux du Cadre (`_planMajTaux`, dim 50 / férié 100 par défaut, décision §73). « La loi des 50 % » = le dimanche ;
  le férié garde ses 100 % — ⚠️ dit à Nico, réglable dans Planning › Le cadre s'il le veut à 50.
- ⚠️ **Revient sur AVANT-1 voie ① (« rien ne bouge de janvier à août »)** pour cette seule majoration : le compteur des mois
  d'avant monte. Les paies éditées, elles, ne bougent pas (elles n'ont jamais porté cette majoration).

### 167c. L'affichage

- **Écart au planning · mois par mois** (`_planHsupTable`) : colonne **Dim. et fériés** (heures lues au planning, `hDim +
  hFer`), avant **Majoration** ; titre de cellule « 8h le dimanche — majoration 4h en repos » (« à la paie » depuis septembre
  en mode payé) ; total ; une phrase de note (les deux taux, où va la majoration).
- **Tableau « Dimanches et jours fériés travaillés avant septembre 2026 »** (`_pfAnneeTable` → `AT.df`, ses champs `html`, `entete`, `legende` — `titre` ferait rougir C19, qui le prend pour un champ saisi) : mois (seulement
  ceux qui en ont), heures le dimanche, heures fériées, repos ajouté, total ; légende. Onglet Compteur (sous « L'année ») et
  relevé page 2 (sous le détail de l'année). `_pfAnnee` porte `hDim`, `hFer`, `majDF`, `majCpt`.
- `_planHsupCard` (mois d'avant) et l'ancien relevé : « Majoration → compteur » au lieu de « à porter en paie ».
- Fiche d'aide « Les heures sup d'avant septembre 2026 », puce « À savoir », guide (deux passages), deux nouveautés 7.54.

### 167d. Mesuré

- `mv-harnais-majoration` : **34 assertions** (+5, section 16 : dimanche 2 août, payé → 4h au compteur, 8h lues ; récup
  pareil ; 2025 : rien), **5 contre-épreuves** (la 4ᵉ repointée sur `_planMajAuCompteur`, une neuve : « avant septembre, en mode
  payé, la majoration ne va nulle part »).
- `mv-harnais-recup` : **426 assertions** (+7, section **AD** : juillet payé 4/12/0/12, `0hs:8 0maj:4` ; septembre payé → paie ;
  invariant ; détail de l'année ; le tableau du relevé à la cellule près ; la colonne et son titre ; mode récup inchangé),
  **86 contre-épreuves** (+3 DIMAV-1).
- `releve`, `retard`, `semaine` verts sans retouche. ⚠️ `mv-harnais-retard-contre` était **rouge à la base** (`f13c3ba`) :
  deux motifs périmés — hors `check`, non touché ici, à recaler.

### 167e. La note de livraison

**Base `f13c3ba`. APP 7.53 → 7.54 · SW 8.22 → 8.23.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/planning.js` | `_planMajAuCompteur`, `_planMajBank` ; colonne Dim. et fériés ; `AT.df` (écran, relevé) ; `_pfAnnee` ; carte et ancien relevé ; puce « À savoir » | — |
| `src/utils.js` | APP 7.54, deux nouveautés, fiche d'aide | ★ APP · ★ SW |
| `index.html` · `public/sw.js` | versions | ★ APP · ★ SW |
| `guide/10-planning.html` · `public/guide.html` | la règle d'avant septembre, la colonne | — |
| `scripts/mv-harnais-majoration.mjs` · `scripts/mv-harnais-recup.mjs` · `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | voir 167d · SECTIONS 199 · base | — |

### 167f. Ouvert, et dit

① **La récup de chacun monte** de la majoration des dimanches et fériés de janvier à août : à dire à l'équipe. ② **Un septembre
déjà figé** : sa retenue est un fait ; si ce repos l'aurait évitée, octobre la rendra (FIGE-1). ③ Le férié reste à +100 % (§73) ;
« loi des 50 % » lue comme le dimanche. ④ Un mois d'avant dont les heures sup ont été **saisies à la main** (`sup_override`) :
la colonne lit la grille, la majoration aussi ; si la grille est vide ces jours-là, rien ne s'ajoute — c'est la grille qui fait
foi. ⑤ Vu en Node (harnais DOM), pas dans le navigateur ni sur papier.

## 168. ★★★ SESS-1 — LES SESSIONS TRACTEUR NE PERDENT PLUS RIEN : ROUVRIR NE TUE PLUS LA MESURE, LA PAUSE GARDE SON TEMPS, UNE PARCELLE SE REPREND, UN CHRONO PAR SESSION, UNE BOÎTE NOIRE (22/09 — `src/tracteur.js` · `src/app.js` · `index.html` · `src/styles.css` · `src/utils.js` · `public/sw.js` · `guide/06-tracteur.html` · `scripts/mv-harnais-sessions.mjs` · `scripts/mv-harnais-tap.mjs`)

> Nico, après TAP-1 et une journée de griffage devenue irrécupérable (22/09 : 2h54 mesurées, **17 mesures écartées — 4h07
> non exploitables**, presque rien dans la session) : « Go. Il n'y a rien de compliqué là-dedans. Enlève absolument tous les
> bugs qu'il peut y avoir dans les sessions tracteurs. » Pas de maquette : la seule nouveauté visible est un bouton de plus dans
> la boîte de confirmation existante et un bloc repliable en bas de la feuille — le « refaire une parcelle » promis y est.

### 168a. Ce que la relecture du moteur a trouvé

| # | Défaut | Effet sur le terrain |
|---|---|---|
| ① ★★★ | `_chrRestaurer` passait la fois en cours au jugement COMPLET (`_chrSuspect`), qui répond « bas » pour toute mesure encore jeune (< 40 % du barème) | **fermer puis rouvrir la feuille, ou revenir dans l'appli après une veille, écartait la parcelle « chrono lancé en retard »** — très probablement l'essentiel des 17 écartées du 22/09 (Combe du Bas portait exactement ce motif). Non prouvable a posteriori : aucune trace n'existait |
| ② | `_chrInterrompre` versait le temps au compteur et remettait `t0` à la reprise | le matin d'une parcelle interrompue pour déjeuner n'arrivait jamais dans la parcelle ; « Fin de journée » pendant la pause ne l'écrivait pas du tout |
| ③ | `_chrPose` REMPLAÇAIT l'entrée ; chaque morceau jugé contre le barème de la parcelle entière | refaire une parcelle effaçait son premier temps ; une grande parcelle faite en trois fois voyait chaque morceau écarté |
| ④ | UNE clé `mavigne_chrono_session` pour tout l'appareil | ouvrir une autre session puis la refermer réécrivait la clé : la mesure en cours de la première partait, compteurs compris |
| ⑤ | aucune trace des gestes | rien pour comprendre ni réparer (le 22/09 en est la preuve) |
| ⑥ | `Math.round` sur l'avancement | 99,6 % → 100 % → session « Terminé » avec une petite parcelle à faire |
| ⑦ | `openSessionDetail` appelait `renderSessionProgress()` qui ÉCRIT | regarder une vieille session la faisait repasser « En cours » (date de fin effacée) dès qu'une parcelle avait été plantée depuis ; un « Terminé » posé à la main sautait |
| + | « Modifier » : `avancement\|\|100` | 0 % devenait 100 % (invariant « jamais `\|\|` sur un nombre qui peut valoir 0 ») |
| + | « Modifier » : la date change, pas `saison` | session classée dans la mauvaise saison |
| + | supprimer depuis « Modifier » | ne recalculait pas les trous de plantation (la feuille, si) |
| + | bloc de parcelles sans surface | temps réparti à la surface → 0 minute |
| + | « Voir toutes » | remontrait les parcelles désactivées, cochables |
| + | la parcelle en cours de mesure | désactivable ; la reprise la rend aussi « faite » : sans garde, un appui la décochait |
| + | compteurs du jour | ne repartaient jamais à zéro sans « Fin de journée » (« hors parcelle » comptait la nuit) |
| + | coche sans chrono = chaîne | liste mixte → « feuille » pour FUSION-1 : deux téléphones sur la même session, l'un gagnait tout |

### 168b. Ce qui a changé

- **Une fois se POSE, elle ne remplace pas** (`_chrPoserBloc`). Chaque parcelle du bloc reçoit sa part (à la surface ; parts
  égales si le bloc n'a pas de surface) ; déjà faite, elle l'**ajoute** à `mes` (minutes posées, mesurées ou écartées, toutes
  les fois), `n` compte les fois, `t0` reste le premier début. Le verdict se prend sur le **TOTAL** (`_chrSuspectTotal`). Une
  fois aberrante à elle seule (≥ 12 h, ou > 3× le barème) **ne compte pas** et n'efface pas une mesure juste. `dmin` = `mes`
  quand il est crédible : bilan et Pilotage ne lisent que lui — rien à changer chez eux. Anciennes entrées sans `mes` : `dmin`.
- **La pause garde le temps** : `acc` (temps de la fois avant l'interruption), `t0d` (premier début), `tp` (heure de
  l'interruption). `_chrBlocMs()` = `acc + _chrCourant()` ; minuteur, alerte et compteur « mesuré » l'affichent. Une fois en
  pause se ferme **à l'heure de l'interruption** (`_chrFermerPause`) : fin de journée, nouveau jour, autre session.
- **La reprise ne juge que l'oubli** : à la réouverture, seuls `dur` et `haut` ferment ; « bas » (jeunesse) jamais.
- **Un état par session** : `mavigne_chrono_v2` = `{sid: état}`, l'ancienne clé migrée à la première lecture, ménage
  (`_chrPrune` : session disparue, ou rien d'ouvert depuis 2 jours — et jamais sur une liste de sessions encore vide). Une
  session seulement regardée ne laisse pas d'état (`_chrVierge`). **Un seul chrono à la fois** sur l'appareil :
  commencer ailleurs ferme la mesure restée ouverte (`_chrFermerAilleurs`), toast à l'appui. Supprimer une session oublie son
  chrono (`_chrOublier`). Nouveau jour : compteurs à zéro.
- **Boîte noire** : `s.trace`, dans la session (`_chrTrace`) — `{t, e, p, m, mo, c, x, v, u}` (heure, geste, parcelle(s),
  minutes, motif, cumul, entrée retirée sérialisée, valeur saisie, qui). Bornée **200 gestes / 3 jours** : la session vit dans
  UN document Firestore. Pas de champ `nom` ni `id` dans un geste : FUSION-1 les fusionne par contenu (union), sans collision.
  Lisible par l'administrateur en bas de la feuille (`#sd-hist`, `<details>` replié) ; **« Rétablir »** (`_sdRetablir`)
  remet une parcelle décochée telle qu'elle était, si elle n'a pas été recochée depuis.
- **« Reprendre la mesure »** : chrono allumé, toucher une parcelle faite ouvre la même boîte que TAP-1 avec un second choix
  au-dessus. `openConfirmDel(…, alt)` — `alt = {label, cb}` facultatif, bouton `#ocd-alt` caché sinon, `_execConfirmAlt`
  exposé ; tous les autres appels de l'appli sont inchangés. Pas proposé si le tracteur est en réparation.
- **Regarder ne modifie pas** : `renderSessionProgress({vue:true})` affiche sans écrire. **100 % = plus rien à faire**
  (`reste === 0`), sinon `min(99, floor)`.
- Coches **objets `{nom}`** (`_sdNorm` convertit les anciennes chaînes quand la session est touchée) ; valeur saisie sans
  doublon ; parcelle en cours ni décochable ni désactivable ; « Voir toutes » sans les désactivées ; « Modifier » garde 0 %,
  la saison suit la date ; les deux suppressions recalculent les trous.

### 168c. Mesuré

`mv-harnais-sessions` (neuf) : **31 assertions, 19 contre-épreuves** — les vraies fonctions de `tracteur.js` extraites par nom,
exécutées sous horloge et `localStorage` factices ; chaque défaut ① à ⑦ remis tel qu'il était doit rougir. Branché dans
`check`, `prebuild`, la CI et `npm run test:sessions`. `mv-harnais-tap` : environnement complété (`_chrono`, `_chrTrace`,
`_chrMes`, `_sdNorm`…) — aucune assertion affaiblie, 45/45 et 11 contre-épreuves.

Appli COMPILÉE, base `147c7da` (la production, DIMAV-1 compris) contre lot, Chromium 390 × 844, vrais contacts (`dispatchTouchEvent`), seule
l'horloge avancée :

| Scénario | Base | Lot |
|---|---|---|
| mesure lancée, feuille fermée puis rouverte 10 min après | **écartée « bas »**, mesure arrêtée | toujours en cours ; finie à 71 min → `dmin` 71 |
| 50 min, pause, 40 min | écartée « bas » (40 min seulement) | `dmin` 90 |
| 50 min (écartée seule) puis reprise 40 min | boîte « Décocher ? », pas de reprise | « Reprendre la mesure » → `dmin` 90, `n` 2 |
| une autre session regardée pendant la mesure | mesure perdue | toujours en cours |
| décocher puis « Rétablir » | — | entrée rendue identique (`dmin` 90, `n` 2) |
| erreurs de page | 0 | 0 |

### 168d. Leçons

- ★★★ **Une reprise ne juge que l'OUBLI, jamais la JEUNESSE.** Un contrôle « trop court » n'a de sens qu'à la clôture ; appliqué
  à une mesure encore ouverte, il la tue. Toute fonction appelée à l'ouverture d'un écran doit être relue comme si l'écran
  s'ouvrait cent fois par jour — parce que c'est le cas.
- ★★ **Une mesure se pose, elle ne remplace pas** ; et un verdict se prend sur le tout, jamais sur un morceau.
- ★★ **Un état local se range par l'objet qu'il suit** (la session), jamais « un pour l'appareil ».
- ★ **Regarder n'écrit pas.** Une fonction d'affichage qui persiste finit par réécrire l'histoire.
- ★★ **Trois cliquets de style à connaître avant d'écrire du CSS** (tous trois ont rougi ici) : l'espacement se prend dans
  l'échelle `2 4 8 12 16 20 24 32 40` (`mv-harnais-echelle`) ; un rayon égal à un pas (`8 12 16 999`) compte « en dur » MÊME écrit
  `var(--r-sm,8px)` — le repli est lu — et sans repli, c'est « appel du socle sans repli » qui rougit : hors jeton, seul un rayon
  hors pas passe (10 px, celui des boutons de la boîte de confirmation) ; `var(--acier)` vaut `#4A80C4` en thème sombre — du
  blanc dessus échoue au contraste : fond marine fixe `#2C3E50`.
- ★ **Le résumé de compaction peut retarder sur l'arbre de travail** : branchements CI et `package.json` étaient déjà faits,
  rejoués d'après le résumé → doublons, rattrapés. Avant de rejouer une étape « à faire », regarder l'arbre (`git status`,
  `grep`), pas la liste.

### 168e. Fichiers

| Fichier | Quoi | Rendu |
|---|---|---|
| `src/tracteur.js` | moteur (`_chrPoserBloc`, `acc`/`t0d`/`tp`, `_chrFermerPause`, reprise, un état par session, `_chrFermerAilleurs`, jour), boîte noire + historique + `_sdRetablir`, avancement, coche objet, « Modifier », suppressions | ✓ |
| `src/app.js` · `index.html` | second choix de `openConfirmDel` (`#ocd-alt`), `#sd-hist` ; 4 affichages 7.54 | ✓ |
| `src/styles.css` | `.sd-hist*` | ✓ |
| `src/utils.js` | APP 7.54, « Quoi de neuf » (5), fiche Tracteur (reprendre, historique, mesure aberrante) | ✓ |
| `public/sw.js` · `guide/06-tracteur.html` · `public/guide.html` | 8.23 ; guide recompilé | ✓ |
| `scripts/mv-harnais-sessions.mjs` · `scripts/mv-harnais-tap.mjs` · `package.json` · CI | neuf ; environnement ; branchements | ✓ |
| `scripts/typo-baseline.json` | regravé : `tracteur.js` 159 → 181 ko (question du découpage posée, 168f ⑥) | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 200 · §168 · base `147c7da` | — |

### 168f. Ouvert, et dit

① **La journée du 22/09 ne revient pas avec ce lot** : il empêche, il ne répare pas. Seule piste : la reprise après sinistre
Firestore (PITR), si elle est activée — à vérifier par Nico. ② Le script console `recaler-session.js` (hors dépôt) est passé
en v4 : ce qu'il pose porte `mes` et `n`, et `recal.trace()` lit la boîte noire. Essayé sur l'appli compilée : poser
49 min à la main puis reprendre 20 min dans l'appli donne bien `mes` 69 en 2 fois — mais le TOTAL est rejugé, et 69 min
pour 0,6 ha passent « écartées » (sous 40 % du barème). Une pose à la main n'est donc pas à l'abri du verdict ; c'est
dit en tête du script. ③ Un téléphone
resté sur l'ancienne version réécrit des chaînes : liste de nouveau mixte le temps qu'il se mette à jour. ④ Les compteurs du
bandeau restent « ce téléphone, aujourd'hui » : une fois écartée puis rendue crédible par une reprise reste comptée écartée
au compteur (la session, elle, est juste). ⑤ `test:e2e` et un vrai téléphone, chez Nico : la reprise de la veille, la veille
de l'appli, deux téléphones sur la même session. ⑦ **Lot rebasé** : DIMAV-1 (§167) a été poussé pendant sa
fabrication — renuméroté §167 → §168, APP 7.55, SW 8.24, base `147c7da`. Aucun fichier de code commun (DIMAV-1 :
`src/planning.js`, le guide Planning) ; seuls les compteurs de version, `CLAUDE.md` et les deux blocs « Quoi de neuf »
se croisaient. ⑥ **`tracteur.js` a pris 22 ko** (159 → 181) : `mv-harnais-typo` demande
qu'on se pose la question du découpage. Réponse : le moteur du chrono (≈ 600 lignes, de `_chrNeuf` à `_chrRestaurer`, plus
l'historique) est le candidat naturel à un `src/chrono.js`, frontière gardée sur le modèle de CUV-DEC (§164) — dans un lot
dédié, pas dans celui qui répare des pertes de données. Référence regravée.

---

## 169. ★★ CHAMP-1 + CHAMP-2 — LES HEURES « DANS LES RANGS » : DÉCIDER ET LA CADENCE NE COMPTENT PLUS UN SALARIÉ EN FORMATION (23/09 — `src/planning.js` · `src/pilotage.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-champ.mjs` (neuf) · `scripts/mv-harnais-pil-coherence.mjs` · `scripts/harnais-cadence-escalier.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.55 → **7.57** · SW 8.24 → **8.26** · base `59e2a39`)

> Nico : *« dans pilotage, une personne en formation, en arrêt, en cp, absente ne doit pas être comptée dans l'effectif du jour
> pour l'organisation des travaux »*.

### 169a. Mesuré AVANT d'écrire

- L'effectif du jour de Décider (tournée du jour, « Qui fait quoi », choix du jour, simulation jour par jour) passe par UNE
  fonction : `_dzJourMbr` → `_planWorkPersRange(m,dt,dt)` → `_planRangeH_(…,'work')` → `_planWorkH`.
- `_planWorkH` rend 0 pour un congé, une récup, un arrêt, toute absence non assimilée : **ces quatre cas étaient déjà justes**.
  Mais `mo.assim` (formation, événement familial) rend **la journée prévue** — c'est la loi (L6222-24, L3142), juste pour
  l'annualisation, les durées maximales et la paie. Un salarié au CFA comptait donc dans l'équipe de la tournée.
- La carte « À la vigne aujourd'hui » du cockpit (`_pilData.presences`) testait déjà `e.absent` sans regarder le motif :
  formation comptée absente. Rien à y changer.
- Les autres lecteurs de `_planWorkPersRange` (`_ecoRate` : taux horaire pondéré ; `_pecCadPresence` / `_pecCadHisto` : cadence
  contre barème ; exercice) raisonnent en heures PAYÉES ou TRAVAILLÉES au sens de la loi : **non touchés**. ⚠️ La cadence garde
  donc un biais connu (une formation compte comme présence) — hors du périmètre de CHAMP-1, basculée par CHAMP-2 (169d).

### 169b. Le choix

- Écarté : filtrer dans `pilotage.js` en relisant l'entrée du jour. Il aurait fallu recopier la référence du jour
  (`_planRefH`) pour l'absence partielle — une seconde définition de la journée, exactement ce que DZ-1 avait fermé.
- Retenu : un troisième mode du parcours de plage existant. `_planChampH` = `_planWorkH`, sauf un motif assimilé : 0, ou la
  journée amputée de `_planAbsH` si l'absence est partielle (formation l'après-midi → la matinée compte). Exposé en
  `window._planChampPersRange`. Appelant de CHAMP-1 : `_dzJourMbr` ; la cadence s'y ajoute (169d).
- `_dzMotif` dit pourquoi : « en formation », « en arrêt », « absent · événement familial », « absent » (le reste, dont
  l'absence sans motif lue « injustifiée » depuis NET-1).

### 169c. Vérifié

- `mv-harnais-champ` : les VRAIES fonctions extraites de `planning.js` (C20). 18 scénarios (jour ordinaire, CP, récup, arrêt,
  injustifiée, sans motif, formation, famille, formation partielle, perso partiel, journée modifiée, semaine en `'champ'` 7 h
  contre 21 h en `'work'`, collectif ×6, hors contrat) + 6 appelants. **8 contre-épreuves mordent**, dont le défaut d'origine
  (A7 rougit) et « le travail effectif perd la formation » (la paie serait fausse → A12 rougit).
- `mv-harnais-pil-coherence` ⑧ repointé sur `_planChampPersRange` (il exigeait `_planWorkPersRange`).
- ⚠️ Pas rejoué dans un navigateur : le lot ne change ni un écran ni un geste, seulement qui entre dans le compte.

### 169d. CHAMP-2 — la cadence sur la même lecture

> Nico, à la livraison de CHAMP-1 (qui laissait la cadence ouverte) : *« on la passe sur la même lecture »*. CHAMP-1 n'avait
> pas été poussé : les deux partent ensemble, numéros 7.57 / 8.26 (on ne réutilise pas 7.56 / 8.25, déjà livrées — règle du doute).

- **Trois lecteurs basculent en `'champ'`** : `_planTeamCadence_` (KPI « Cadence équipe », repli de la marge, `_pilEchCadence`
  et son `hPers`), `_pecCadPresence` (écart de cadence, période en cours), `_pecCadHisto` (marche 2, campagne d'avant).
- **Restent sur le travail effectif / payé** : `_ecoRate` (le poids d'un taux horaire = heures PAYÉES) et l'exercice
  (`_pexCalc`, masse salariale). Une formation se paie : la retirer du coût serait faux.
- Effet attendu : la présence baisse les semaines de CFA → l'écart de cadence penche un peu moins vers « barème trop serré ».
  Le biais « cave, atelier, bureau dans la présence » demeure (fiche `pil.cadence`, inchangée sur ce point).
- Harnais : `mv-harnais-champ` exécute `_planTeamCadence_` réelle (semaine lun.→ven. : 7 h sur 1 jour, contre 21 h sur 3 en
  travail effectif) + B7/B8 ; 3 contre-épreuves de plus. `mv-harnais-pil-coherence` ① : stub `_planChampH` et ancre de la
  contre-épreuve « CP compte comme présence » repointés. ⚠️ **`harnais-cadence-escalier.mjs` n'est branché NULLE PART**
  (ni `check`, ni CI) et portait déjà **1 rouge sur la base** (« le KPI écart de cadence annonce la source histo ») : son
  stub est repointé sur `_planChampPersRange` (sinon 9 rouges), le rouge d'origine reste — à examiner, puis brancher ou retirer.

### 169e. Ouvert, et dit

① Une journée de CP d'une demi-journée vaut 0 dans les rangs (comme avant) : le modèle CP n'a pas d'heures de présence.
② La carte « À la vigne aujourd'hui » compte absent toute la journée une absence partielle (inchangé).

## 170. ★★★ TOUR-1 — LE TOUR COMPLET, ET CE QU'IL A TROUVÉ ; LOT 1 : L'AFFICHAGE (23/09 — `src/styles.css` · `src/cuvier.js` · `src/cave.js` · `src/pilotage.js` · `src/reglages.js` · `src/planning.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/harnais-claude-md.mjs` · APP 7.57 → **7.58** · SW 8.26 → **8.27** · base `8014ce2`)

Nico : *« fais un tour complet de l'appli pour vérifier les bugs d'affichage, les boutons morts, les index z, la sensibilité aux
taps »*, puis *« finis le tour d'abord, ne fais aucune livraison »*, puis *« go »*.

### 170a. ★★★ La méthode — un tour qui touche l'écran, et qui ment moins qu'on le croit

Outillage hors dépôt (`/home/claude/tour/`, jetable) : l'appli COMPILÉE servie en local, Chromium 1194 (`/opt/pw-browsers`) en
390 × 844 tactile, réseau Firebase coupé, entrée par `_startDemoVisite` avec `fbLoginDemo` remplacé et 12 parcelles posées par
`applyFbData` (le scénario de visite sème le reste). Quatre passes :
1. **les écrans** : chaque module, chaque onglet et sous-onglet (58), mesurés sur toute leur hauteur — cibles < 32 px,
   débordement, recouvrement (`elementFromPoint` au centre), `onclick` vers une fonction absente ;
2. **les appuis** : chaque bouton appuyé par `touchscreen.tap` (vrais contacts), réaction lue par un `MutationObserver`,
   chaque fenêtre ouverte mesurée à son tour (dessus de tout ? cibles ? débordement ?) ;
3. **le contraste À L'ÉCRAN** : chaque texte visible, sa couleur, le fond réel remonté d'ancêtre en ancêtre, dans les DEUX
   thèmes — ce que `mv-harnais-contraste` (statique, règle par règle) ne peut pas voir : une couleur héritée, un fond posé par
   une autre règle, un `style=""` écrit en JS ;
4. **le bouton retour** : `popstate` rejoué avec chaque type de feuille ouverte.

★★ **Ce que l'outil a mal mesuré, et qu'il a fallu démêler avant d'écrire une ligne :**
- « ? Aide » et la pastille « i » sortaient « trop petits » : ils portent DÉJÀ une zone tactile de 44 px en `::after`. L'outil
  mesurait le dessin. **Une cible se mesure par sa zone d'appui, pas par sa boîte.**
- Les encadrés d'alerte saumon « illisibles en sombre » : faux, le scanner lisait le PREMIER arrêt d'un dégradé.
- Pilotage › Décider › « Agrandir » « à moitié vide » : c'est le repli HORS LIGNE (SVG de hauteur fixe) ; en ligne, Leaflet
  remplit `.lf`. Bac à sable = hors ligne.
- Des appuis « à y = 0 » : un blocage de défilement laissé par la fermeture forcée de l'outil, puis un `scrollIntoView` en
  défilement doux lu trop tôt. Rejoué écran par écran, à la main.
- `color-mix()` rendu par Chromium en `color(srgb …)` : le scanner ne le lisait pas et criait au blanc sur blanc.
**Aucun défaut de ce lot n'a été retenu sur la seule foi de l'outil : chacun a sa capture ou sa cause dans le code.**

### 170b. ★★★ Les causes — trois familles, et deux d'entre elles viennent de lots de nettoyage

1. **TYPO-1 (§127) a laissé deux cartes sans couleur de texte.** `.sc-act{color:#fff}` et `.hv2-trac-val{color:#fff}` sont
   devenus `<div class="mv-t" style="color:inherit">` / `mv-n` : hériter de QUOI ? `.scard-enc` et `.hv2-trac-card` ne
   posaient pas de `color` — le texte remontait à `--texte`, foncé, sur bleu nuit et vert foncé (1,3:1). Couleur posée sur la
   règle qui porte le VRAI fond (le dégradé de `.scard-enc`, ligne ~3058 — c'est celle que lit `mv-harnais-contraste`).
   Le pourcentage sort blanc : l'or d'avant (`.sc-pct`) n'est plus atteignable, le `style="color:inherit"` du HTML passe
   devant toute règle de feuille.
2. **Le balisage valide a cassé la mise en page.** La ligne de cuve (`.mvv-hd`) est un `<button>` : ses morceaux sont des
   `<span>` (§24 : pas de `<div>` dans un bouton). Mais `.mvv-nom`, `.mvv-sub`, `.mvv-mini` n'avaient pas `display:block` :
   ils s'enchaînaient en ligne, se chevauchaient avec `.mvv-rt`, et la barre (hauteur sur un inline) disparaissait. ★ Le
   commentaire de `_pilPhotoHtml` le dit déjà : « des `<span display:block>`, pas des `<div>` ». **La règle a deux moitiés ;
   la ligne de cuve n'en avait appliqué qu'une.**
3. **Des jetons de SURFACE pris comme couleur de TEXTE** (la famille de CONTRASTE-2, §131) : `color:var(--cave)` (fond le plus
   sombre de l'appli) sur 11 titres/chiffres du Pilotage, 2 titres des Réglages, 2 styles du Cuvier → noir sur noir en sombre ;
   `background:#fff` en dur dans 11 règles dont le texte suit le thème → blanc sur blanc en sombre, **y compris l'écran
   d'acceptation des conditions** (`.mvt-fi`, première connexion d'un admin) ; `--bordeaux` appelé 11 fois avec son repli
   `#7A1020` mais **déclaré nulle part** (sauf dans le rapport imprimable, document séparé) → 1,6:1 en sombre.
Plus : la date de `.mod-meta-row` restait en crème (règle d'août écrite quand elle vivait dans la partie SOMBRE de l'en-tête ;
elle est posée sur `--bg-app` depuis) ; les week-ends du Planning en `--gris` (couleur de bordure, 1,4:1) ; l'année active du
Planning en `#524399` en dur ; `.cmp-alert.ok` et `.per-badge` en `#2D5016` en dur ; `.pil-diagwrap` au z-index du dock (90).

### 170c. Les corrections

| Où | Quoi |
|---|---|
| `styles.css` | `.scard-enc{color:#fff}` sur la règle au dégradé ; `.hv2-trac-card{color:#fff}` et fond `color-mix(--vert 78 %, noir)` (identique à l'œil en clair ; en sombre `--vert` vaut `#5A9E3A`, le blanc y lisait 2,9:1 → ~4,9) ; `.mod-header .mod-meta-row .hv2-date{color:var(--texte-doux)!important}` ; week-ends `--texte-doux` à 72 % ; `--bordeaux` déclaré dans le bloc clair ET les deux blocs sombres (`#E8848C`) ; `.mvt-fi` fond `--bg-card` |
| `cuvier.js` | `display:block` sur `.mvv-nom/.mvv-sub/.mvv-mini/.mvv-mini-f` ; `.vt-cv.done` en `color-mix` du thème ; 7 champs → `--bg-card` ; `.mvv-kpi-num` et `.mvv-tab.active` → `--texte` |
| `cave.js` | `.mva-form` (dégradé) et 4 champs → `--bg-card` |
| `pilotage.js` | 11 × `color:var(--cave)` → `--texte` (en clair : `#14110D` → `#1A1A14`, invisible) ; 2 champs inline → `--bg-card` + `--texte` ; `.pil-diagwrap` z 90 → 8905 (sous le plancher modal 9200, au-dessus du dock) |
| `reglages.js` · `index.html` · `planning.js` | 2 titres → `--texte` ; `.cmp-alert.ok`, `.per-badge` → `--tag-green-tx` ; année active → `color-mix(--plan-acc 70 %, --texte)` |

⚠️ Écartés : les 4 emplois de `--cave` et `--bordeaux` d'`app.js` (`_rsCss`, rapport imprimable : document séparé, fond papier) ;
`.mv-dk.on .mv-dk-ic` et `.vt-fb.on` (texte sombre sur fond or/crème fixe : juste dans les deux thèmes) ; `.cmp-alert.warn`
(`#8A4210` en dur, faible en sombre mais changer le jeton éclaircit le clair — à trancher).

### 170d. Mesuré

- Contraste À L'ÉCRAN (scanner du tour, 33 écrans) : **clair 21 → 12 écarts**, aucun sous 2,2:1 ; **sombre 66 → 33**, dont les
  pires (1,6) sont les faux positifs des dégradés (170a). **Aucun écart nouveau** dans les deux thèmes.
- Captures avant / après regardées : session en cours, carte d'accueil, lignes de cuve (clair) ; accueil, Pilotage › L'année,
  tournée, maturités, session (sombre).
- `mv-harnais-contraste` : vert, et il réclame une regravure (12 jetons de surface de moins en texte, 10 écarts de moins en
  sombre) — **non regravée ici**, cf. 170e. `mv-harnais-jetons`, `-theme`, `-couches`, `-echelle`, `-typo`, `-cuvier`, `-cuv7`,
  `-info`, `preflight`, `lint-cliquet` : verts. Chaîne `npm run check` : voir la note de livraison.

### 170e. Regravure du cliquet de contraste

Le harnais dit « progrès, regraver ». La règle (§6c) : regraver après une baisse, **clé par clé**, jamais pour taire un rouge.
Les baisses sont celles de ce lot (170c) ; la regravure est laissée à la prochaine exécution chez Nico
(`node scripts/mv-harnais-contraste.mjs --baseline`) — tant qu'elle n'est pas faite, le cliquet tolère simplement le niveau
d'avant, rien ne peut remonter plus haut que lui.

### 170f. ★★ OUVERT — le lot suivant (trouvé par le tour, pas encore corrigé)

1. **Bouton retour d'Android** — `_mvBack` ne ferme que `.overlay.open`. Rejoué : feuille du Cuvier (`#mvv-ov`), feuille
   « Plus » du dock (`#mv-dock-sheet.show`), feuille « c'est fait » (`.mvds-bg`) → la page change, **la feuille reste
   par-dessus** ; panneau « Ce qu'il manque » (`.pil-diagwrap.show`) → ne se ferme pas. Lus, non rejoués : feuille de tri
   (`#mv-tri-ov`, `_mvTriFermer`), feuilles de Décider (`[data-op=shut]`, `[data-op=fmx]`). Fermetures existantes :
   `_vendSheetClose` (exposée), `_dockPlusClose`, `_mvdsClose` (app.js), `_pilDiagClose` (**à exposer**).
2. **Puce de conducteur du Tracteur** (admin) — une zone VIDE de 16 px (`<span onclick="editCond()">`, son crayon perdu au
   nettoyage des émojis) vit DANS la puce : un appui au MILIEU de « Jean » ouvre la fiche du conducteur au lieu de filtrer
   (l'ajustement tactile du navigateur aimante le doigt vers la cible la plus profonde). Rejoué deux fois. `editCond` n'a pas
   d'autre entrée : il faut un crayon visible, en frère de la puce, pas en enfant.
3. **Icône du bouton « traitement »** (formulaire de session) — `updateTracTraitBtn` fait `ico.textContent=''` dans les deux
   branches : le SVG du carré est effacé au premier appui. Lu, pas vu à l'écran.
4. **Double appui** — aucun `touch-action:manipulation` global (seulement `.sdp-row`) : deux appuis rapides sur un « + »
   peuvent zoomer sous iOS. Idée : une règle sur `button, a, [onclick], [role=button], label, summary, select, input,
   textarea` placée TÔT dans `styles.css` (les `touch-action:none` de `.modal-handle` et `.home-w-drag`, plus bas, gagnent).
5. **Cibles** réellement petites : `.chip/.fchip/.tfchip/.ptfchip` (26–31 px), `.mvcm-chip`, `.mvr-fchip`, `.hv2-voir-tout`
   (15 px), `.pil-souslig .pil-gear2`, croix de « Nouvelle cuvée ». Zone en `::after` (aucune n'en porte), verticale ≤ 5 px
   entre deux rangées de puces (les rangées du Tracteur sont à ~10 px l'une de l'autre).
6. **Démo avec code** — `#demo-banner` (fixe, 9991) recouvre la rangée haute de l'en-tête (roue, synchro, Personnaliser,
   Actualiser) : aucun décalage n'est appliqué. La visite publique n'affiche pas le bandeau.
7. Restent en sombre, mesurés : barres de la carte « Travaux mécaniques » (blanc 60 % sur vert, 2,9) ; `.cmp-alert.warn`.

### 170g. Accompagnement

Guide public : relu sur ce que le lot touche — les 13 passages qui parlent de thème ou de couleur (01, 04, 06, 07, 08, 10,
11, 12) décrivent un code couleur qui ne change pas ; aucun ne décrit la ligne de cuve ni le panneau « Ce qu'il manque » au
pixel. **Rien à changer.** `MV_AIDE` : aucun geste ni onglet ne change — **relue, rien à changer**. `MV_INFO` : aucune méthode de calcul
ne change. `WHATS_NEW` 7.58 : quatre entrées, exécutées par `mv-whatsnew-check`. Visite guidée : aucun sélecteur visé ne bouge.

### 170h. La note de livraison

**Base `8014ce2`. APP 7.57 → 7.58 · SW 8.26 → 8.27.** `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/styles.css` | cartes sombres, date, week-ends, `--bordeaux`, champ de la porte CGU | ★ APP · ★ SW |
| `src/cuvier.js` | ligne de cuve empilée, tournée et champs en sombre | — |
| `src/cave.js` | maturités et mise en bouteille en sombre | — |
| `src/pilotage.js` | textes en sombre, deux champs, panneau au-dessus du dock | — |
| `src/reglages.js` · `src/planning.js` | deux titres ; année active | — |
| `src/utils.js` | APP 7.58 ; « Quoi de neuf » | ★ APP |
| `index.html` · `public/sw.js` | 4 versions, deux pastilles vertes · 8.27 | ★ APP · ★ SW |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 202 · §170 · base | — |

## 171. ★★★ TOUR-2 — LE RETOUR FERME CE QUI EST OUVERT, ET UN APPUI VA OÙ L'ON APPUIE (23/09 — `src/app.js` · `src/utils.js` · `src/cuvier.js` · `src/pilotage.js` · `src/tracteur.js` · `src/styles.css` · `index.html` · `public/sw.js` · `guide/06-tracteur.html` · `scripts/mv-harnais-retour.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.58 → **7.59** · SW 8.27 → **8.28** · base `8014ce2`, s'empile sur §170)

Nico : *« go »* — le lot suivant annoncé en §170f.

### 171a. ★★★ Le retour : une liste de surfaces, chacune avec SA fermeture

`_mvBack` fermait `_mvTopOverlay()` (famille `.overlay`) puis partait sur la page d'accueil du rôle. Six surfaces vivent hors de
cette famille, chacune ouverte par son module. Rejoué avant le lot : feuille du Cuvier / « Plus » / « c'est fait » ouvertes +
retour → **la page changeait et la feuille restait par-dessus** ; « Ce qu'il manque » ne se fermait pas.

- `_MV_SURFACES` (app.js) : sélecteur + fermeture **que le module utilise déjà** — `_vendSheetClose`, `_mvTriFermer`,
  `_pilDiagClose` (désormais exposée), `_mvdsClose`, `_dockPlusClose`, et pour Décider le clic sur son propre bouton
  (`[data-op=shut]`, `[data-op=fmx]`) : `_PIL_OP` garde l'état, le module se re-rend au clic. **Jamais un
  `classList.remove` maison** : la fermeture du module remet aussi son état à zéro (`MV_TRI_ETAT`, `_MVDS_UNDO`…).
- `_mvTopSurface()` : la plus haute à l'écran (z-index), à égalité la dernière dans le DOM — la règle de `_mvTopOverlay`,
  étendue à toutes les familles. Un dialogue (9200+) ouvert sur la feuille du Cuvier (9000) se ferme d'abord.
- ★ **La porte CGU (`.mvt-ov`, 9500) n'est PAS dans la liste** : fail-closed, le retour ne doit jamais la faire tomber.
  Contre-épreuve dédiée.
- ★★ **L'entrée d'historique.** Ces surfaces s'ouvraient sans `pushState` : sur la page d'accueil du rôle, le retour n'avait
  rien à consommer et **quittait l'appli**. Chaque ouverture appelle maintenant `window._mvHistPush()` — une fois : la feuille
  du Cuvier qui remplace une étape par la suivante, le panneau déjà ouvert, la feuille de Décider déjà ouverte n'en reposent
  pas. `_mvCloseable` compte les surfaces ouvertes, pour que l'entrée soit reposée après une fermeture. ⚠️ Comme pour
  `openOv` depuis toujours, une surface fermée par sa croix laisse son entrée : le retour suivant ne ferme rien et ramène à
  l'accueil du rôle. Comportement identique à celui des dialogues, assumé.

### 171b. ★★ La puce de conducteur — une cible invisible dans une cible visible

`<div class="chip" onclick="filtrer"> Jean <span onclick="editCond()" style="padding:12px 8px"></span></div>` : le `<span>` avait
perdu son émoji au nettoyage des icônes, gardé ses 16 px de marge d'appui. **Rejoué : un appui au MILIEU de « Jean » (centre à
9 px de la zone) ouvrait la fiche.** L'ajustement tactile de Chromium aimante le doigt vers la cible la plus profonde sous la
zone de contact. ★ **Deux cibles imbriquées ne se départagent pas au pixel sur un écran tactile : on ne met jamais un bouton
dans un bouton.** Le crayon devient `<button class="chip chip-ed">` **frère**, visible (`crayon` 16). `editCond` n'avait pas
d'autre entrée. Rejoué après : appui au milieu → filtre, aucune fiche ; appui sur le crayon (36 × 30) → la fiche.
Même famille : `updateTracTraitBtn` faisait `ico.textContent=''` dans ses deux branches — le SVG du carré disparaissait au
premier appui. → `_mvSetIcon(ico, on?'valide':'carre', 18)`, rejoué dans les deux sens.

### 171c. Les appuis

- `button, a, [onclick], [role=button], label, summary, select, input, textarea { touch-action:manipulation }`, posée **juste
  après `*{}`** : les `touch-action:none` de `.modal-handle`, `.home-w-drag` et des graphes ont la même force et gagnent par leur
  place (assertion D du harnais). Leaflet pose `none` sur son conteneur, qui l'emporte sur ses descendants.
- Zones en `::after` : `.chip/.fchip/.tfchip/.ptfchip` (−5 / −3 px : les deux rangées de puces du Tracteur sont à ~10 px),
  `.hv2-voir-tout` (−10 / −8), `.pil-gear2` (−8 / −6). « ? Aide » et « i » en avaient déjà une (§170a).
- Démo avec code : `body.mv-demo-on` (posée par `_initLoginDemo`, hauteur mesurée dans `--mv-demo-h`) décale `#app-root` et
  les en-têtes collants, comme `mv-trial-on`. Rejoué : bandeau 50 px, rangée haute de l'en-tête à y = 66, atteinte.

### 171d. Les contrôles

- `scripts/mv-harnais-retour.mjs` (neuf) — **31 assertions, 11 contre-épreuves**, toutes détectées. A : le VRAI `_mvBack` avec
  ses cinq voisins, extrait d'app.js, dans un DOM factice (chaque surface seule, l'ordre des couches, l'égalité, la porte CGU,
  rien d'ouvert) ; B : l'entrée d'historique à chaque ouverture ; C : la puce et l'icône ; D : double appui, zones, bandeau.
  Contre-épreuve n°1 : l'ANCIEN `_mvBack` mot pour mot → 9 rouges. Branché dans `check`, `prebuild`, la CI ; `npm run test:retour`.
- ★ **Deux rouges du premier passage venaient du TEST** : l'ancre `_condList().map(` existe quatre fois dans tracteur.js (le
  harnais lisait un `<select>`) ; et la contre-épreuve « `_mvCloseable` ignore les surfaces » était muette — hors page « hub »,
  `_mvCloseable` rend vrai par la page seule. Le cas est rejoué sur la page « hub », le seul où la surface fait la différence.
- **Rejeu sur l'appli compilée** (Chromium 390 × 844, vrais contacts, `/home/claude/tour/rejeu2.py`) : les quatre surfaces
  ouvertes puis retour → fermées, page inchangée ; dialogue sur feuille → retour 1 ferme le dialogue, retour 2 la feuille ;
  puce / crayon / icône comme en 171b ; aucune erreur de page.

### 171e. Accompagnement

`MV_AIDE.tracteur` : « Toucher le nom d'un conducteur » (filtre ; crayon → fiche). `guide/06-tracteur.html` : même phrase sous la
roue crantée (`public/guide.html` régénéré par le crochet — **non livré**). « Quoi de neuf » 7.59 : trois entrées, exécutées par
`mv-whatsnew-check`. `MV_INFO` : aucun chiffre ne change. Visite guidée : aucun sélecteur visé ne bouge.

### 171f. Ouvert

① Un vrai téléphone Android pour le retour (le rejeu déclenche `popstate`, pas le geste système) et un iPhone pour le double
appui. ② Petites cibles non traitées : `.mvcm-chip` (Chai, 31 px), `.mvr-fchip` (Réserve), mois J/F/M… du Planning (côte à côte,
toute la barre est couverte), croix de « Nouvelle cuvée ». ③ `.cmp-alert.warn` et les barres de la carte « Travaux mécaniques »
en sombre (§170f ⑦). ④ `mv-harnais-contraste --baseline` (§170e), chez Nico.

### 171g. La note de livraison

**Base `8014ce2`, TOUR-1 compris. APP 7.57 → 7.59 · SW 8.26 → 8.28** (7.58 / 8.27 = TOUR-1, livré séparément : si déjà déployé,
7.59 le remplace). `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/app.js` | `_MV_SURFACES`, `_mvTopSurface`, `_mvBack`, `_mvCloseable` ; entrée d'historique à « Plus » et « c'est fait » ; décalage démo | — |
| `src/utils.js` | APP 7.59 ; « Quoi de neuf » ; fiche Tracteur ; entrée d'historique du tri | ★ APP |
| `src/cuvier.js` · `src/pilotage.js` | entrée d'historique (feuille, panneau, Décider) ; `_pilDiagClose` exposée (+ TOUR-1) | — |
| `src/tracteur.js` | crayon du conducteur en bouton frère ; icône « traitement » | — |
| `src/styles.css` | double appui, zones d'appui, crayon, décalage démo (+ TOUR-1) | ★ APP · ★ SW |
| `index.html` · `public/sw.js` | 4 versions · 8.28 | ★ APP · ★ SW |
| `guide/06-tracteur.html` | le crayon du conducteur | — |
| `scripts/mv-harnais-retour.mjs` · `package.json` · `.github/workflows/ci.yml` | harnais neuf aux trois portes, `test:retour` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 203 · §171 · base | — |

## 172. ★★★ TV-1 + TV-2 — LE TEMPS RÉELLEMENT PASSÉ DANS CHAQUE PARCELLE (23/09 — `src/pilotage.js` · `src/app.js` · `src/reglages.js` · `src/utils.js` · `guide/04-vigne.html` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-temps-vigne.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.59 → **7.60** · SW 8.28 → **8.29** · base `96f7f1d`)

### 172a. La demande, et ce qu'elle réglait

*« On n'a toujours pas de moyen pour le calcul du temps de travail vigne. Il faudrait que le moteur calcule le nombre de vignes
validées en une journée pour faire un prorata du temps passé dans chaque parcelle en fonction du nombre d'heures comptées sur le
planning des salariés qui travaillent dans les vignes. »* Puis, sur question : une validation vaut pour **tout le groupe nommé**
(Victor, Shana, Alicia 1 h sur un are = 3 h sur la tâche) ; plusieurs parcelles le même jour se partagent **au prorata de la
surface** — *« 3 parcelles, 1 ha et 2 de 0,5, à 3 pendant 8 h, ça fait 12 h pour 1 ha même si le barème en convient 15 : c'est ce
qui nous dit si le travail est plus rapide ou plus lent que la convention »*.

Ce qui existait : `_ecoEquipeByParc` répartissait déjà 1/N une journée-personne entre les parcelles validées — en **journées**,
pas en heures, et seulement pour pondérer le taux. La cadence (`_pecCadPresence`) compare une présence **globale** à un barème
global : elle ne dit rien d'un travail précis.

### 172b. La règle (`_ecoTempsVigne`)

Par salarié sous contrat sur la période (bureau exclu : `_mvEnContratSurPeriode` **sans** 4e argument — ⚠️ le cliquet ④ de
pil-coherence exige qu'un seul appelant passe `true`), jour par jour de `debut` à `min(fin, aujourd'hui)` :
1. heures du jour = `_planChampPersRange(m, j, j)` (congé, récup, arrêt, absence, formation, famille à 0 — CHAMP-1) **moins** sa
   conduite tracteur du jour, bornée aux heures du jour (`_ecoTracHByParc().condH[nom][iso]`, **ajout pur**) ;
2. elles **s'accumulent** jusqu'au jour où il figure sur une clôture (`qui` ou `membresEquipe`) ;
3. elles se **versent** sur les clôtures de ce jour, au prorata de la surface des parcelles (surfaces toutes nulles : parts égales).

⚠️⚠️ **POURQUOI ACCUMULER.** Une validation marque la FIN d'un travail (§20b : 12 journées-personne sur 247 en portaient une l'hiver,
165 sur 559 au printemps). La règle « le jour même seulement » laissait ~95 % des heures d'hiver sur aucune parcelle. Nico a répondu
à la question « les jours sans validation vont où ? » par la mécanique du groupe, pas par une option : le report sur la clôture
suivante est **une hypothèse de Claude**, écrite dans la fiche, à confirmer à l'usage.
★ **Propriété** : une heure n'est versée qu'une fois. Une validation en trop redistribue, elle ne crée rien. Invariant tenu par le
harnais : **versé + en attente = rangs − conduite**. Ce qui attend (depuis la dernière clôture de la personne) s'affiche sous le
tableau, nom par nom.

**Une clôture** (`_ecoTvEvents`) : entrée « Validé » d'une tâche simple ; pour niveaux/passages, une entrée qui **ajoute** un niveau
ou un passage à la précédente du même couple — les listes sont **cumulatives** (`confirmNiveaux` écrit `_nivSelDone` entier) et le
statut peut rester « En cours » alors que du travail vient d'être clos ; « Annulé » retire la dernière clôture du couple et remet la
liste à zéro. « Domaine » (validation groupée) n'a pas de surface : ignorée. Tri par date puis par `id` (horodatage hex).
**Le barème** d'une clôture (`_ecoTvBar`) : surface × h/ha de la tâche, ou des seuls niveaux/passages nouveaux, ou trous × min —
compté **une fois par clôture**, jamais par personne (contre-épreuve dédiée).

### 172c. L'écran

Économie › Postes & travaux, sous « Coût par travail » : carte **« Temps réel contre barème »** (`_pecCarteTemps`, ne calcule
rien) — Travail · ha · Heures · **h/ha réel** · h/ha barème · Écart (couleurs de la cadence : >15 rouge, >5 orange, <−8 vert).
Ligne de cadre : heures versées, nombre de validations, conduite retirée, heures en attente (3 noms au plus). Écart `—` quand un
couple a un barème sans heure versée (personne du groupe au planning) : pas de « −100 % ». Cache `_ECO_TV`, oublié dans
`_pilExoOublier`, clé `debut|fin`.

### 172d. ~~Limite connue~~ — le validateur compte dans le groupe (RÉGLÉ par TV-2, 172i)

`qui` est toujours dans le groupe (`_jePrefillTeam` : « validateur implicite »). Nico valide souvent pour l'équipe **sans être dans
les rangs** : SES heures du jour vont alors à ces parcelles. Nico : *« il faudra le corriger ça d'ailleurs »*. Le remède est à la
**saisie** (le validateur doit pouvoir se décocher du groupe) — lot à part, pas dans le moteur : le moteur ne peut pas deviner.

### 172e. Accompagnement

Fiche `MV_INFO` **neuve** `pil.eco.temps` (posée sur la carte). `MV_AIDE` Pilotage, ligne Économie : une phrase sur le temps réel.
`guide/11-pilotage.html`, carte Économie : un point (⚠️ `public/guide.html` **non livré** — `node scripts/build-guide.mjs`).
« Quoi de neuf » 7.60 : une entrée (icône `chrono` — `horloge` n'existe pas dans le sprite). Visite guidée : rien ne bouge.

### 172f. Ce qui n'a pas été mesuré

① Aucune donnée réelle : les chiffres de MG ne sont pas lus (pas d'accès). À regarder en premier : la part d'heures **en attente**
— si elle est grosse, des salariés travaillent sans figurer sur les validations. ② Aucun rendu regardé (pas de navigateur lancé
sur la carte). ③ La cadence globale (`_pecCadPresence`) n'est **pas** rebranchée sur ce moteur : deux mesures du temps existent
désormais — à trancher avec Nico (garder la présence globale, ou la remplacer par les heures versées). ④ Pré-existants, rouges
sur la base `96f7f1d` **avant** ce lot, hors `npm run check` : `harnais-cadence-escalier` (« le KPI écart de cadence annonce la
source histo ») et `mv-harnais-audit-pil` (B5, B6).

### 172g. ENG-1 — écrit, puis abandonné

Même journée, demande précédente : « Engagé à ce jour » en euros **sortis** (salaires sous contrat + achats, GNR, réparations,
fûts), via `_pexData` rejoué sur la fenêtre de la période, courbe au jour (`byD`). Écrit dans le bac à sable, puis Nico : *« non
stoppe, je ne pousserai pas »*. **Rien n'est livré, rien n'est dans ce lot.** Ne pas le reprendre de mémoire : si la demande
revient, repartir d'ici et reposer la question du budget (il resterait un barème vigne seule, l'engagé contiendrait cave et bureau).

### 172i. ★★ TV-2 — le validateur peut se décocher (administrateur seulement)

Nico : *« il faut permettre au validateur de se décocher (seulement si admin) »*. Même lot, même version (TV-1 n'était pas poussé).
- **Donnée** : l'entrée garde `qui` (l'auteur — la traçabilité ne bouge pas) et porte **`quiHors:true`** quand l'auteur n'a pas
  travaillé. Les entrées d'avant n'ont pas le champ : l'auteur y compte, comme avant. Aucune règle Firestore ne liste les champs du
  journal (vérifié : `firestore.rules`, `functions/`).
- **Lecteurs** : `_ecoTvEvents`, `_ecoEquipeByParc` (pilotage.js) et `_jivQui` (reglages.js) sautent `qui` si `quiHors`.
- **Panneaux** (`_buildMembresCheckboxes`, 3e argument `moiHors`) : pour un administrateur (`_mvMoiAdmin` = `isAdmin()` + un nom),
  une puce **« Moi (nom) »** en tête, sans `data-nom` (jamais ramassée par `_getSelectedMembres`, jamais touchée par
  `_jePrefillTeam` qui vise `.mbr-chk`). Cochée par défaut, sauf si la tâche est mémorisée « sans moi ». `_mvQuiHors(id)` la lit.
  Cinq chemins d'écriture : `confirmValidation`, `saveJournalEntry`, `confirmNiveaux`, `confirmPassages`, `pQuickValidate`.
  **Groupe vide sans le validateur = refus** (« Personne dans le groupe ») — pour niveaux et passages, le refus est en TÊTE de
  fonction, avant la mutation de `p.taches` (contre-épreuve dédiée).
- **Barre d'équipe** (validation d'un appui) : la puce de l'administrateur devient **« Moi aussi dans les rangs »** (`_pvToggleMoi`,
  exposée) ; décochée, « sans moi » est **mémorisé par tâche** dans `EQUIPE_TACHE.__hors` (clé réservée, comme `__default` ; rien
  n'itère `EQUIPE_TACHE`). « Moi seul » remet le validateur dans les rangs. L'administrateur est retiré de sa propre équipe
  (il est `qui`). La barre affiche « · sans moi ».
- **Moteur, trouvé en écrivant TV-2** : `pQuickValidate` écrit le SEUL passage du jour (`passages:[2]`), les panneaux la liste
  ENTIÈRE (`[1,2]`). Le « précédent » était REMPLACÉ : une liste entière après un appui recomptait le passage 1. Il est désormais
  **réuni** (`P.pass.concat(nPass)`), remis à zéro par « Annulé ».
- **Accompagnement** : `MV_AIDE.parcelles` (« Valider pour l'équipe sans y être »), fiche `pil.eco.temps` (la limite devient la
  règle), « Quoi de neuf » 7.60 (2e entrée), `guide/04-vigne.html` (note sous la règle d'équipe).
- ⚠️ **Non regardé à l'écran** : la puce « Moi » dans les quatre panneaux, la barre d'équipe, le refus.

### 172h. La note de livraison

**Base `96f7f1d`. APP 7.59 → 7.60 · SW 8.28 → 8.29.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/pilotage.js` | `_ecoTempsVigne` + `_ecoTvEvents`/`_ecoTvBar`/`_ecoTvNivs`/`_ecoTvDef` ; `condH` dans `_ecoTracHByParc` ; `_pecCarteTemps` ; `_ECO_TV` oublié ; `quiHors` (TV-2) | — |
| `src/app.js` | TV-2 : puce « Moi », `_mvMoiAdmin`, `_mvQuiHors`, `_eqtHors`/`_eqtSetHors`, `_pvToggleMoi`, `quiHors` aux cinq écritures | — |
| `src/reglages.js` | TV-2 : `_jivQui` saute l'auteur hors des rangs | — |
| `guide/04-vigne.html` | TV-2 : valider pour l'équipe sans y être | — |
| `src/utils.js` | APP 7.60 ; « Quoi de neuf » ; fiche `pil.eco.temps` ; `MV_AIDE` Pilotage | ★ APP |
| `index.html` · `public/sw.js` | 4 versions · 8.29 (en-tête, `CACHE_NAME`, 2 `console.log`) | ★ APP · ★ SW |
| `guide/11-pilotage.html` | le temps réel contre barème | — |
| `scripts/mv-harnais-temps-vigne.mjs` · `package.json` · `.github/workflows/ci.yml` | harnais neuf aux trois portes, `test:temps-vigne` | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 204 · §172 · base | — |

## 173. ★★★ ENG-2 — « ENGAGÉ À CE JOUR » COMPTE LES HEURES PAYÉES, ET LES JOURNÉES DE CAVE SORTENT DE LA VIGNE (24/09 — `src/pilotage.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `scripts/mv-harnais-temps-vigne.mjs` · `scripts/banc/garde-projection.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.60 → **7.61** · SW 8.29 → **8.30** · base `d684d4e`)

### 173a. Le constat de Nico, et pourquoi il avait raison

*« Pour le calcul engagé à ce jour, si on est en avance ou en retard, je n'ai pas l'impression que ça fonctionne. Ça fait une
semaine qu'ils sont en train de dégrafer, à 3 ou à 4, à 17-19 € chargés, 8 h, 5 jours : je ne suis pas sûr que ça fasse 1 400 €. »*
L'écran lisait **1 411 €** pour 2 % d'avancement. Vérifié dans `_pecData` : `T.moF = fH × tx`, heures de **barème** des travaux
**validés** (1 411 ÷ 19,54 ≈ 72 h). Une parcelle dégrafée non validée valait 0 € ; une parcelle validée valait son h/ha même si
l'équipe y avait passé le double. L'engagé suivait l'avancement **par construction** — le commentaire de `_pecData` le disait
déjà pour tracteur/GNR/phyto (« les deux pourcentages sont alors égaux par construction ») ; c'était vrai aussi de la
main-d'œuvre. Le calcul de Nico : 4 × 8 × 5 × 19 ≈ **3 040 €** (à 3 : 2 280 €).

### 173b. La règle

`E.moReel = _ecoTempsVigne().eur` (TV-1, une seule définition de l'heure vigne) : par salarié vigne sous contrat (bureau exclu),
jour par jour du début de la période à aujourd'hui, heures dans les rangs (`_planChampPersRange`) − conduite tracteur du jour
(comptée à part, poste « Conduite tracteur ») − **journée de cave** entière, × `_mvPaieTauxEffAt(m, jour)` (repli : `_ecoRate()`,
compté dans `nSansTaux`). **Validées ou non** : une heure en attente est payée. `engage = moReel + tracF + gnrF + phyF`.
Budget : **inchangé** (barème). `resteE = budget − engage` ; `resteBar = budget − engageBar` (le reste de TRAVAIL).
`projFin = cadAppl ? engage + resteBar×(1+écart) : engage + resteBar` — tant que l'engagé valait le barème du fait, la branche
sans cadence retombait sur le budget ; elle y retombe encore dans ce cas. Repli complet sur l'ancien calcul si la période n'a pas
de dates, n'a pas commencé, ou si le planning n'est pas chargé (`moSrc:'bareme'`).

### 173c. Les journées de cave (`_ecoCaveJours`)

Le planning ne porte **aucune activité** (vérifié : ni poste ni lieu sur une entrée). Nico : *« il n'y a pas de planning cave,
c'est au jour le jour »* ; les opérations de cave sont saisies *« presque toujours avec les noms »*. Un jour où un salarié figure
dans `CAVE_ELEVAGE.operations[].intervenants`, sa journée entière sort de la vigne (l'opération n'a pas de durée).
⚠️ **Jamais `operateur`** : c'est celui qui a SAISI (currentUser) — le repli de `_caveWho` ferait sortir de la vigne chaque jour où
Nico note un soutirage. ⚠️ **Pas les `analyse`** : un prélèvement ne vide pas une journée. ⚠️ **Pas la cuverie des vendanges**
(`CAVE_VENDANGE…mesures_fa[].qui`) : son « qui » vaut par défaut celui qui ouvre la tournée — à trancher avec Nico.
Les heures retirées s'affichent (`hCave`) sous la carte « Temps réel contre barème », et ne sont pas versées aux parcelles.
**Reste compté dans la vigne** : l'atelier et le bureau d'un salarié vigne (rien ne les écrit) — dit dans la fiche.

### 173d. L'écran

KPI « Engagé à ce jour » : fiche neuve `pil.eco.engage` ; sous-ligne « X % du budget pour Y % du travail fait · Z h dans les
rangs ». Poste « Main-d'œuvre vigne » : `fait = moReel` (le total des postes reste l'engagé). Tableaux **Parcelles** et **Coût par
travail**, graphe des tâches, CSV : au barème (`engageBar`), colonnes renommées **« Réalisé »** (et « Reste à faire ») — un mot,
un sens (§113). Courbe « Rythme de dépense » : main-d'œuvre au **jour payé** (`E.tv.byD`), repli journal inchangé. Verdict
« La période démarre » : une phrase de plus, « Déjà X engagés (Y % du budget) pour Z % du travail validé ».
⚠️ **L'écart de cadence n'est PAS touché** (Nico, 23/09) : sa présence ne retire pas les journées de cave. Deux mesures du temps
coexistent donc — la question est au backlog (§28).

### 173e. Harnais

`mv-harnais-temps-vigne` : +16 assertions (I1-I10 exécutées : l'exemple de Nico à 3 040 € sans validation, taux du jour, fiche sans
taux, journée de cave, `operateur` et analyse sans effet, courbe = engagé ; J1-J6 branchements), +6 contre-épreuves (54 / 19).
`banc/garde-projection` : l'ancre du budget projeté suit la formule (`resteBar`) ; son intention — la garde par `cadAppl` — est
inchangée. Pré-existants rouges sur la base, hors `check` : `harnais-cadence-escalier`, `mv-harnais-audit-pil` (B5, B6).

### 173f. Ce qui n'a pas été mesuré

① Aucune donnée réelle : le chiffre de MG après ce lot n'est pas connu. **À regarder** : si l'engagé paraît trop haut, vérifier que
le compte de Nico (chef d'équipe) n'est pas compté comme salarié vigne les jours de bureau — le drapeau « bureau » de la fiche
l'exclut en entier. ② Aucun rendu regardé.

### 173g. La note de livraison

**Base `d684d4e`. APP 7.60 → 7.61 · SW 8.29 → 8.30.** `node scripts/build-guide.mjs`, puis `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/pilotage.js` | `_ecoCaveJours` ; `_ecoTempsVigne` (cave, € au jour, `byD`) ; `_pecData` (`moReel`, `engageBar`, `resteBar`, projection) ; courbe ; KPI ; tableaux « Réalisé » ; verdict | — |
| `src/utils.js` | APP 7.61 ; « Quoi de neuf » ; fiches `pil.eco.engage` (neuve), `pil.eco.temps`, `pil.eco.postes` ; `MV_AIDE` Pilotage | ★ APP |
| `index.html` · `public/sw.js` | 4 versions · 8.30 | ★ APP · ★ SW |
| `guide/11-pilotage.html` | Engagé à ce jour | — |
| `scripts/mv-harnais-temps-vigne.mjs` · `scripts/banc/garde-projection.mjs` | ENG-2 | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 205 · §173 · base | — |

## 174. ★★★ PRES-1 + PDF-1 + SYNC-1 + ESC-1 — UNE SEULE RÈGLE DE PRÉSENCE, ET LES PDF SUPPRIMÉS LE SONT VRAIMENT (26/09 — `src/utils.js` · `src/planning.js` · `src/pilotage.js` · `src/cave.js` · `src/app.js` · `src/admin-gt.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-pres.mjs` (neuf) · `scripts/mv-harnais-effectif-periode.mjs` · `scripts/mv-harnais-asm1.mjs` · `scripts/mv-harnais-pil-coherence.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.61 → **7.62** · SW 8.30 → **8.31** · base `b4104fb`)

### 174a. D'où vient ce lot

Nico a demandé « le tour complet » de ce qui est derrière le login. **Lot 1 = lecture du code, sans navigateur** (le bac à sable
de Claude ne peut pas télécharger Chromium) : fonctions jamais appelées, `onclick` vers une fonction absente, copier-coller
(`jscpd`), ESLint `no-unused-vars`, classes CSS introuvables. Résultat global : **0,34 %** de lignes dupliquées ; les 841
fonctions appelées depuis un attribut `on*=` sont toutes exposées sur `window` ; aucun code inatteignable. **Quatre défauts réels**,
corrigés ici. Le reste (code mort) attend le lot 2 — voir 174f.

### 174b. PRES-1 — une seule règle de présence (décision de Nico, 26/09)

⚠️⚠️ **CETTE DÉCISION REMPLACE LA CONVENTION DU 09/07** (« CDI sans date = présent, le statut n'y figure pas »), écrite dans le
commentaire de `_mvEnContratSurPeriode`. Nico : « une fiche inactive sans date de contrat ne compte pas. Les fiches inactives avec
date de contrat comptent le temps de leur date de contrat. » Puis, sur la question des heures déjà saisies : « oui, mais
logiquement tous les salariés ont des dates de contrat ; s'il n'y en a pas il faut que l'appli prévienne l'admin ».

| Fiche | Compte ? |
|---|---|
| Active sans date | Oui, toujours (inchangé) |
| Active ou Inactive avec dates | Pendant ses dates (inchangé) |
| Inactive sans date | **Non**, sauf les années où elle a des heures dans `PLANNING_ENTRIES` |

★ L'exception des heures protège la paie : sans elle, la grille du mois, les totaux et le relevé envoyé à la compta perdaient des
heures faites. ★ « Sans date » = aucune période, **ou** des périodes sans début ni fin (`_mvSansDateContrat`) ; une fin seule date
la fiche.

**Une seule définition**, dans `utils.js` : `window._mvSansDateContrat(m)` + `window._mvCompteSansDate(m, d0, d1, yDef)`. Branchées sur
les **cinq** lecteurs de « était-il là ? » : `_mvEnContratSurPeriode`, `_mvEnContratLe` (utils) ; `_planCouvre`, `_planJourCouvert`,
`_inContractDay` (planning, via les relais `_planSansDate` / `_planCompteSansDate`, dont le repli n'existe que pour les harnais qui
n'ont pas `utils.js`). ⚠️ `_planInContract` (question 3 : plafond, congés, grille du contrat EN COURS) n'est **pas** touché — cf. le
commentaire au-dessus de `_inContractDay`. ⚠️ Le drapeau `bureau` reste lu par `_mvEnContratSurPeriode` seul, comme avant.

**Le signalement** : constat du diagnostic Pilotage (`_pilDiag`), gravité `'o'`, `cible:'equipe'`, `touche:['effectif','budget']`,
« N fiche(s) sans date de contrat », les quatre premiers noms, bouton vers Réglages › Équipe. Toute fiche, active ou non, bureau
compris : « tous les salariés ont des dates ».

### 174c. PDF-1 — un PDF dont plus rien ne parle quitte le stockage

`fbDeleteAnalyse` (firebase.js) existait et **n'était appelée nulle part**. `cave.js` écrivait `pdf_path` / `storage_path` et ne s'en
resservait jamais : supprimer une opération ou une cuvée, remplacer le PDF d'une analyse, laissait le fichier dans Storage. Place
perdue, et la DPA promet qu'une donnée supprimée l'est. **Méthode** : `_cavePdfRefs()` photographie les chemins cités (opérations +
analyses) AVANT la modification ; `_cavePdfPurge(avant)` supprime APRÈS ceux qui ne sont plus cités. Un PDF partagé (rattachement
groupé) ne part qu'avec la dernière opération qui le cite. Six chemins : `saveCaveOp`, `_attachPdfToOp`, rattachement groupé
(`linkOps`), `deleteCaveOp`, `deleteCuvee`, `deleteCuveeById`. Échec (hors ligne, droits) : `logError` niveau info, le fichier reste —
les règles Storage réservent `delete` à l'admin du tenant.

### 174d. SYNC-1 et ESC-1

**SYNC-1.** `app.js` enveloppe `window.showSyncBadge` pour piloter le **point** de synchro. `app.js` (3 appels) et `cave.js` (8 appels)
importaient la version brute de `utils.js` : la pilule changeait, le point restait figé. Les deux modules ont maintenant un
`showSyncBadge` local qui relaie vers `window.showSyncBadge` (patron de `firebase.js`) ; l'import est retiré. ⚠️ Ne jamais poser
`window.showSyncBadge = showSyncBadge` dans ces modules : récursion.
**ESC-1.** `admin-gt.js`, `agtInsPerTache` : `E(t).replace(/'/g,'&#39;')` dans un `onclick` — le piège de `harnais-escattr` (le
navigateur redécode `&#39;` avant le JS). Remplacé par `_escAttr(t)`. C'était le **seul** cas du code.

### 174e. Harnais

`scripts/mv-harnais-pres.mjs` (neuf, dans `check`, `prebuild`, CI, `npm run test:pres`) : **55 assertions**. A — les cinq lecteurs
exécutés sur les mêmes fiches rendent la même réponse (7 cas chacun). B — la purge exécutée (supprimé, partagé, remplacé, rien ne
change). C — le code lu sans commentaires (six chemins de Cave, constat, imports, `&#39;`). **9 contre-épreuves, 9 rougissent.**
Ajustés : `mv-harnais-effectif-periode` (extrait les relais ; F6 réancrée sur `_planCompteSansDate`), `mv-harnais-asm1` (extrait
`_cavePdfRefs`/`_cavePdfPurge`), `mv-harnais-pil-coherence` (④ extrait la règle unique). Chaîne `check` complète jouée par tranches
dans le bac à sable : verte.

### 174f. Ce qui n'a pas été fait, et pourquoi

① **Code mort, gardé exprès jusqu'au lot 2** (captures d'écran comme filet) : 9 fonctions jamais appelées (`_mvDeniedStashClear`,
`_fbActivateTrial`, `_ecoParcMOh`, `openPilotage`, `_mvPaieSetTaux`, `_rsvAteCol`, `_chronoSummary`, `_mvTriCmp` — testée par
`mv-harnais-tri1`, jamais utilisée —, `_mvSalarieAt`) ; 11 imports inutilisés ; **~397 classes CSS introuvables, ~45 Ko (12 %)** de
`styles.css` (familles `cave-*`, `hv2-*`, `ph-*`, `pl2-*`, `plan-*`, `rb-*`). ② Aucune donnée réelle : combien de fiches MG n'ont pas
de dates n'est pas connu — le constat le dira. ③ Aucun rendu regardé.

### 174g. La note de livraison

**Base `b4104fb`. APP 7.61 → 7.62 · SW 8.30 → 8.31.** `npm run build && firebase deploy --only hosting`.

| Fichier | Ce qui change | Bump ? |
|---|---|---|
| `src/utils.js` | `_mvSansDateContrat`, `_mvCompteSansDate` ; `_mvEnContratSurPeriode`, `_mvEnContratLe` ; APP 7.62 ; « Quoi de neuf » | ★ APP |
| `src/planning.js` | `_planSansDate`, `_planCompteSansDate` ; `_planCouvre`, `_planJourCouvert`, `_inContractDay` | — |
| `src/pilotage.js` | constat « fiche sans date de contrat » | — |
| `src/cave.js` | `_cavePdfRefs`, `_cavePdfPurge` sur six chemins ; `showSyncBadge` local | — |
| `src/app.js` | `showSyncBadge` local, import retiré | ★ APP |
| `src/admin-gt.js` | `_escAttr` dans `agtInsPerTache` | — |
| `index.html` · `public/sw.js` | 4 versions · 8.31 | ★ APP · ★ SW |
| `guide/11-pilotage.html` · `public/guide.html` | « sans date de contrat » dans la liste « à compléter » | — |
| `scripts/mv-harnais-pres.mjs` (neuf) · 3 harnais ajustés · `package.json` · `.github/workflows/ci.yml` | PRES-1 | — |
| `scripts/harnais-claude-md.mjs` · `CLAUDE.md` · `.mv-base` | SECTIONS 206 · §174 · base | — |

## 175. ★★ TOUR-3 — LE TOUR COMPLET, LOT 2 : CHAQUE RÔLE, CHAQUE ÉCRAN, DANS UN VRAI NAVIGATEUR (26/09 — `scripts/mv-tour.mjs` (neuf) · `package.json` · `scripts/harnais-claude-md.mjs` · aucun bump · base `b4104fb`, s'empile sur §174)

### 175a. Pourquoi

Presque tous les harnais lisent le code sans l'afficher (`mv-harnais-alignement` le dit : « il ne mesure AUCUN pixel »). Seuls
`smoke` et `e2e-local` ouvrent un navigateur, avec **un seul compte** (admin), sous Chrome seul. Nico (26/09) : « l'application doit
être parfaite pour le client, ouvrier, admin, pilote, tractoriste — mise en page, juxtaposition, échappement, police ».

### 175b. Ce que fait `npm run tour`

Même principe qu'`e2e-local` (réseau Firebase coupé, données injectées par `applyFbData`, `signIn` seul mocké), port **5198**.
Chromium **et WebKit** (Safari) si installés (`npx playwright install chromium webkit`) × **5 rôles** (admin, pilotage, ouvrier,
tractoriste, saisonnier — un compte chacun dans les données) × **4 écrans** (375, 412, 820, 1280 px) × chaque module du dock ×
chaque onglet `.mvu-tab` visible (8 au plus). Sur chaque écran, un audit exécuté DANS la page, sur ce qui est visible :
- **BUG** : erreur JS · texte cassé (`&amp;`, `&#39;`, `\u00e9`, `undefined`, `NaN`, `[object Object]`, `null`) · balise piégée
  exécutée (un nom de parcelle contient `<img onerror>`) · débordement horizontal · image cassée · id en double · Pilotage proposé
  (ou atteint par `goTo`) sans le rôle.
- **À VOIR** : chevauchement (comparé DANS une même couche : dock, fenêtre ouverte, en-tête collant, page) · texte coupé sans « … »
  · bouton < 32 px · police de secours · élément qui sort de l'écran.
Les données contiennent exprès apostrophes, « & », guillemets, accents, une fiche sans date (le constat PRES-1 doit sortir).
Rapport : `rapports/tour/rapport.html` (constats regroupés, liens vers les captures, matrice du dock par rôle). Code 0 = aucun
BUG, 1 = au moins un BUG, 2 = le tour n'a pas tourné. **Pas dans `check`** : il lui faut un navigateur.

### 175c. Ce qui n'est pas prouvé

⚠️ **Écrit sans pouvoir être lancé** (le bac à sable de Claude ne télécharge pas Chromium) : seule la syntaxe est vérifiée. Le
premier lancement chez Nico dira si les ancres (roster, `.mvu-tab`, `.page.active`, `#mv-dock-inner`) et les délais tiennent ; une
panne au premier lancement est un défaut du script. Les fenêtres (feuilles, formulaires) et la saisie viennent au lot 3, E-Phy au
lot 4. Le code mort de §174f attend les captures de ce lot.

## 176. ★★ TOUR-4 — LE PREMIER TOUR : UNE GARDE POUR LE PILOTAGE, ET UN TOUR QUI NE CRIE PLUS AU LOUP (26/09 — `src/app.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-tour.mjs` · `scripts/mv-harnais-pres.mjs` · `scripts/harnais-claude-md.mjs` · APP 7.62 → **7.63** · SW 8.31 → **8.32** · base `4f7fb23`)

### 176a. Ce que le premier tour a rendu

`npm run tour` a tourné chez Nico du premier coup : **845 écrans**, Chrome + Safari, 5 rôles, 844 s. **4 « bugs »**, **115 « à voir »**.
Matrice du dock conforme : Pilotage proposé à admin et pilotage seulement ; les sept autres modules à tous.

### 176b. Le vrai défaut : SEC-PIL

`goTo('pilotage')` ouvrait le Pilotage pour ouvrier, tractoriste, saisonnier (3 bugs × 2 navigateurs) : le dock le cachait, `goTo` ne
vérifiait rien. **Pas une fuite de données** — les règles Firestore restent la barrière (doc `paie`, taux nominatifs, admin-only :
`firestore.rules`) — mais un écran de direction ne s'ouvre pas sans le rôle. Garde en tête de `goTo`, **même patron que SEC-GT** :
`if(page==='pilotage' && !_canPilotage())` → toast « Accès réservé » + `_landingPage()` (qui ne rend jamais le Pilotage sans le rôle :
pas de boucle). Tenue par `mv-harnais-pres` (56 verts, contre-épreuve n°10).

### 176c. Les faux positifs du tour, et leur correction

- **Erreur JS × 5 (Safari)** : « Viewport argument key interactive-widget not recognized » — Safari ignore une clé que Chrome lit.
  Ajoutée aux messages bénins.
- **Police de secours × 746 écrans** : `document.fonts.check('16px "Cormorant Garamond"')` teste la variante 400 normal, que la page
  n'emploie pas ; les six fichiers Cormorant sont bien là. Le tour teste désormais **la graisse et le style réellement employés**,
  après `document.fonts.ready`.
- **Chevauchements** : la plupart venaient des **tuiles Leaflet** (positionnées hors du cadre, masquées par `overflow:hidden`) et de
  blocs **repliés**. Le tour coupe désormais chaque rectangle par ses ancêtres qui masquent leur débordement (`clip`), ignore ce qui
  est invisible après coupe, et ne regarde pas l'intérieur de `.leaflet-container`.
Le prochain tour dira ce qui reste ; ce qui restera sera à regarder pour de bon.
**2e tour (26/09) : 0 bug, 39 à voir.** Les 8 chevauchements restants étaient des `<b>`/`<span>` qui passent à la ligne (rectangle
englobant sur deux lignes) : le tour compare désormais les boîtes de ligne une à une (`getClientRects`, TOUR-5).

### 176d. Ouvert : les cibles trop petites

66 groupes « bouton trop petit » (< 32 px), tous réels au sens de la mesure. Les plus nets : `.mv-i` 20×20 (bulles d'info, 420 écrans),
`span.m-email-edit` 12×15 (crayon de l'e-mail, Réglages › Équipe), `.hv2-voir-tout` 15 px de haut (« Tout voir → »), `#pil-gear` 25 px
de haut, `.mv-help-btn` 26 px de haut ; les puces de filtre (`.tfchip`, `.ptfchip`, `.chip`) font 26 à 30 px.
**Décision de Nico (26/09) : ON LAISSE** les bulles `.mv-i`, le crayon `.m-email-edit`, « Tout voir » `.hv2-voir-tout`, la roue
`#pil-gear` et les puces `.tfchip` / `.ptfchip` / `.chip` à leur taille. Proposition refusée : agrandir la zone de toucher par un
pseudo-élément transparent. `mv-tour.mjs` ne les signale plus ; les autres petites cibles (`.mv-help-btn`, thème, liens de pied
de page, point de synchro) restent signalées, faute de décision.

### 176e. Note

⚠️ Le `.mv-base` de §174 n'avait pas été commité (fichier qui commence par un point, perdu à la copie) : le dépôt portait encore
`d684d4e`. Sans effet cette fois (la garde ne vérifie qu'un `.mv-base` MODIFIÉ), mais c'est le même piège que `.gitleaksignore`.

## 177. ★ TAILLE-1 — LA TAILLE DE CHAQUE DOCUMENT, FACE À LA LIMITE DE 1 MIO (26/09 — `scripts/mv-taille-docs.mjs` (neuf) · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · aucun bump · base `43e30ec`)

Chaque module est **un** document Firestore (`{ value: … }`, `fbDocRef`), et Firestore refuse tout document au-delà de **1 048 576
octets**. `_mvDocSize` compte des **entrées** (garde anti-écrasement) ; rien ne mesurait des **octets**. Le jour où un module franchit
la limite, ses enregistrements échouent pour tout le domaine.

`npm run taille -- "chemin\mavigne_sauvegarde_<domaine>_<date>.json"` lit une **Sauvegarde complète** (Réglages › Domaine › Documents &
impressions › Données brutes) **sur le poste** — aucune donnée ne sort — et donne, par document, sa taille calculée selon la règle
publiée par Firestore (segments du nom + 1, + 16 ; chaîne + 1 ; nombre 8 ; booléen et null 1 ; clés + 1 ; document + 32), son
pourcentage de la limite, et, avec une **deuxième sauvegarde plus ancienne**, le rythme de croissance et le mois où la limite serait
atteinte. Seuils : ≥ 50 % à surveiller, ≥ 80 % urgent (code 1). Seul le champ `value` est dans la sauvegarde (`fbLireTout`) : un
champ technique voisin n'est pas compté, d'où des seuils prudents. `--test` (dans `check`, `prebuild`, CI) rejoue l'exemple de la
documentation Firestore (`users/jeff/tasks/my_task_id` : nom 44, champs 71, **147 octets**).

## 178. ★★ ARCH-1 — L'ARCHIVE DE CAMPAGNE EST UNE PHOTO DE LA CAMPAGNE, ET LA CLÔTURE NE LA PERD PLUS (26/09 — `src/reglages.js` · `src/utils.js` · `index.html` · `public/sw.js` · `scripts/mv-harnais-arch.mjs` (neuf) · `scripts/mv-harnais-toast-honnete.mjs` · `package.json` · `.github/workflows/ci.yml` · `scripts/harnais-claude-md.mjs` · APP 7.63 → **7.64** · SW 8.32 → **8.33** · base `43e30ec`)

### 178a. Le constat, mesuré

`npm run taille` (§177) sur Marchand-Grillot : `historique` = **192 Ko** (18,8 % de la limite), plus gros document du domaine. Détail
par archive : « Hiver 2025–2026 » 118 Ko / 319 entrées, « Printemps 2026 » 114 Ko / **319 entrées** — les mêmes. Le journal n'est
jamais vidé au changement de campagne (`activateSaison` n'y touche pas) et chaque archive copiait `JOURNAL` entier (moins la météo)
+ `SESSIONS` entier : croissance qui s'accélère, limite Firestore (1 Mio) vers la **4e clôture**. Et le jour venu, `_clotExec`
appelait `saveData('historique')` **sans attendre**, puis `activateSaison` : campagne close, archive refusée, sans un mot.

### 178b. La décision de Nico (26/09)

« Avoir une photo de la campagne par archive, et aussi une archive annuelle qui regroupe toutes les campagnes de l'année — année vigne
ou année fiscale, en fonction de ce que le client a choisi. » Réponse technique retenue : **l'archive annuelle est CALCULÉE à partir
des archives de campagne** (par la date de chaque entrée, dans le cadre `campagne_mois` ou `exercice_mois`), **jamais recopiée** —
sinon la duplication revient. C'est ARCH-2. ARCH-1 fait la photo et la clôture sûre.

### 178c. Ce qui change

- `_arcDeLaCampagne(nom, liste, champDate)` : ne garde que les entrées de LA campagne, par **`_saisonForDate`** (la règle que l'appli
  applique déjà pour filtrer le journal par campagne), sans la météo ; session sans date → son champ `saison`. **Campagne sans dates**
  (`debut`/`fin` absents de `SAISONS`) : on garde tout, comme avant, plutôt qu'un journal vide. ⚠️ Une entrée datée hors de toute
  campagne n'entre dans aucune archive (elle reste dans le journal vivant).
- `_arcSnapshot(saison)` : une seule fabrique pour les deux chemins (`archiveSaisonActive` et `_clotExec`) ; marque `arcV:2` ;
  statistiques calculées sur le journal de la campagne.
- `_arcAlleger(H)` : les archives d'avant (sans `arcV:2`) sont réduites à leur campagne **au prochain enregistrement**, statistiques
  recalculées ; archive d'une campagne absente de `SAISONS` laissée intacte. Pas d'écriture au chargement.
- `_arcEnregistrer(H)` : **vrai seulement si `fbSave` rend `ok:true`**. Refuse hors ligne (la file d'attente n'est pas le serveur),
  au-delà de 1 000 000 octets (règle de taille Firestore, `_arcTaille`), compte verrouillé, protection anti-perte, exception.
  ⚠️ La garde anti-destruction de `historique` compte des **archives** (`_mvDocSize` = longueur du tableau), pas leurs entrées :
  l'allègement ne la déclenche pas.
- `_clotExec` devient `async` : contrôles de saisie d'abord, puis archive, **puis** — seulement si `_arcEnregistrer` a réussi —
  `activateSaison`. Échec : `HISTORIQUE` revient à l'état d'avant, rien n'est clos. Garde `_CLOT_EN_COURS` contre le double appui.
  « Archiver la saison » (Réglages) suit le même chemin ; son message de fin dit « Enregistrement en cours » puis un toast confirme.

### 178d. Harnais

`scripts/mv-harnais-arch.mjs` (dans `check`, `prebuild`, CI, `npm run test:arch`) : **21 assertions** sur les vraies fonctions de
`reglages.js` (+ `_saisonForDate` de `utils.js`), exécutées ; **6 contre-épreuves** (recopie du journal, allègement retiré, file
d'attente crue, envoi hors ligne, activation malgré le refus, double appui). Chaîne `check` complète verte.
`mv-harnais-toast-honnete` affiné : un `showToast` dans les 5 lignes d'un `fbSave` n'est coupable que s'il vient AVANT toute
lecture de `.ok` (le toast d'échec de `_arcEnregistrer` lit `r.ok` d'abord). Vérifié à la main : un toast placé juste après
`fbSave` rougit toujours.

### 178e. Ce qui reste

ARCH-2 : la vue annuelle calculée et le choix du cadre (année vigne / exercice) — partir de l'onglet Archives du Pilotage, déjà rangé
sur l'axe de l'année vigne. Plus tard, si `npm run taille` le demande : un document par année (`COLLECTIONS` est une liste fixe —
sauvegarde, restauration, règles et chargement en dépendent). Estimation après ARCH-1 : ~110 Ko par archive, 3 à 4 ans de marge.

## 179. ★★ ARCH-2 — LE BILAN PAR ANNÉE, CALCULÉ À PARTIR DES ARCHIVES DE CAMPAGNE (26/09 — `src/pilotage.js` · `src/reglages.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/11-pilotage.html` · `public/guide.html` · `scripts/mv-harnais-arch.mjs` · `scripts/preflight-baseline.json` · `scripts/harnais-claude-md.mjs` · APP 7.64 → **7.65** · SW 8.33 → **8.34** · base `43e30ec`, s'empile sur §177-178)

### 179a. La demande, et la maquette

Nico (26/09) : « une archive par campagne, et une archive annuelle qui regroupe toutes les campagnes de l'année — année vigne ou
année fiscale, en fonction de ce que le client a choisi ». Maquette (bloc « Bilan par année » sous la frise des Archives, sélecteur
Année vigne / Exercice comptable, une carte par année) validée telle quelle. Précision de Nico : l'exercice comptable, pour la
plupart des domaines, va du 1er août au 31 juillet — c'est le défaut de `exercice_mois` ; le cas janvier → décembre est rare.

### 179b. Les règles

- **Calculé, jamais recopié** : une seconde copie annuelle ferait revenir la duplication supprimée par ARCH-1.
- **Cadre** : `CONFIG.eco.archive_cadre` = `'vigne'` (défaut) | `'exercice'`, écrit par `_ecoCfgSet` (liste `_ECO_TXT`), changé par
  l'admin seul (`_arcSetCadre`, patron `_pexSetMois`). Bornes lues aux sources uniques : `_mvCampagneBornes` / `_mvCampagneDe`
  (`campagne_mois`) et `_mvExerciceAn` / `_mvExercice` (`exercice_mois`). Les autres rôles voient le cadre, sans bouton.
- **Interventions et sessions** : datées une à une → rangées dans leur année. « Parcelles touchées » exclut le pseudo-lieu
  `Domaine`.
- **Heures** : dans l'archive, `stats.hFaites` et `stats.tachesStats` sont des totaux de campagne SANS date. Campagne dans une seule
  année → tout à cette année. Campagne à cheval (seulement si le cadre ne suit pas les campagnes) → prorata de ses interventions
  datées ; sans intervention, prorata des jours. La carte l'affiche (« dont … h réparties »). Chez MG (vigne et exercice en août),
  jamais.
- **Archives d'avant ARCH-1** (tout le journal dans chacune) : on ne garde que les entrées de SA campagne (`_saisonForDate`) et on
  dédoublonne par `id` (journal et sessions) — campagnes absentes de `SAISONS` comprises.
- L'année en cours a toujours sa carte (« Aucune campagne close cette année »).

### 179c. Harnais et tension signalée

`mv-harnais-arch` étendu : section F, **37 assertions** au total sur les vraies fonctions (`pilotage.js` + axes de `utils.js`),
**10 contre-épreuves** (dédoublonnage, répartition, cadre exercice, droit admin ajoutés). ⚠️ Tension : le guide pose « les Archives
se lisent, ce qui se règle vit dans la roue crantée » ; le sélecteur de cadre, validé sur maquette, vit dans l'onglet. Signalé à
Nico ; à déplacer dans la roue (« Le cadre de votre campagne ») s'il le préfère.
Deux rouges de la chaîne, corrigés : ① **C24b** (preflight) — le bouton de cadre interpolait sa valeur dans `onclick` ; il porte
`data-v` et le gestionnaire la lit (`this.getAttribute('data-v')`). ② **Contraste sombre** — pastille de campagne `--terre` sur
`--or-pale` illisible en sombre ; remplacée par `--texte-med` sur `--bg-card` bordé. Cliquet C24b regravé : `admin-gt.js` 57 → **56**
(gain d'ESC-1, §174, jamais gravé) — `scripts/preflight-baseline.json`.
