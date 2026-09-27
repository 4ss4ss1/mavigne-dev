# Ma Vigne — Chantiers §30 à §79

> Scindé de `CLAUDE.md` le 27/09/2026 (§189). Le **récit** des chantiers : ce qui a été mesuré,
> envisagé, écarté, et pourquoi le code est comme il est. Consulté à la demande — une référence
> « §N » se trouve par `docs/claude/INDEX.md`.
> ⚠️ Un chantier raconte l'état **du jour où il a été écrit**. Ce qui s'applique à tout lot a été
> remonté dans `CLAUDE.md` (règles d'or, §24, §25, §27a) ; en cas de doute, le code réel fait foi.
> ★ **Règle de rangement** : la section §N va dans le fichier dont la tranche contient N (tranches
> de 50). Au-delà de la dernière tranche, créer le fichier suivant sur le même modèle.

---

## 30. ★★ MULTI-TERROIR — rendre le barème vrai ailleurs qu'en Côte de Nuits

**État : le socle est LIVRÉ, et son premier client d'essai est arrivé le jour même**
(le prospect Gironde, Lalande-de-Pomerol). Cette section décrit ce qui existe, ce qui reste, et surtout
**pourquoi** — les raisonnements valent plus que le code, ils resserviront.

### 30a. Barèmes régionaux — `MV_BAREMES` (livré)

`TACHES_CATALOGUE` portait les heures de la Côte de Nuits comme s'il s'agissait d'une vérité
générale. Hors de Bourgogne, elles sont fausses **d'un facteur 2 à 3** — et fausses en silence.

**Le mécanisme retenu : un barème régional est un CALQUE.** Il ne redéfinit que des **heures**,
jamais la structure des travaux. Ajouter une région = **une entrée dans `MV_BAREMES`**, rien d'autre.

| Clé | Couverture | Source |
|---|---|---|
| `cote-nuits` | le catalogue tel quel (`hha: null`) | Accord du 2 octobre 2023 |
| `gironde` | hors Médoc, guyot simple | Avenant n° 12 du 30 juin 2021, IDCC 9331, art. 89 |

`CONFIG.bareme` · `window._mvBaremeActif()` (repli `'cote-nuits'`) · `window._mvBaremeRef(cat)` →
renvoie **toujours** un objet, avec les drapeaux `_regional` et `_horsBareme`.
**Le catalogue d'origine n'est jamais muté.**

⚠️ **Tous les jeux sont exprimés à 10 000 pieds/ha**, y compris ceux issus de textes qui comptent
aux 1 000 pieds. La densité s'applique **ensuite**.

⚠️ **Un travail que le barème ne prévoit pas reste SANS valeur conseillée** (`_horsBareme`).
**Mieux vaut ne rien dire que dire faux.**

**Valeurs girondines** : Taille 95 · Tirage 60 · Brûlage 20 · Réparation 25 · Pliage 55 ·
Ébourgeonnage [45, 25] · Pioche [50, 30] · Relevage [25, 55, 15]. Cycle couvert **500 h/ha** sur
572,5 au texte — l'écart est le **rognage/estrapage** (72,5 h/ha), mécanisé en Côte de Nuits.

★ **Le résultat qui compte** : à densité égale, Bourgogne **520 h/ha** contre Gironde **572** —
**+10 % seulement**. **La densité explique environ 90 % de l'écart entre les deux régions.**

**Reste à faire** : guyot double, Médoc Graves et Palus, vignes de plus de 20 ans, majorations
(trois fils +10 %, sols argileux +20 %, passage à poussard +10 % la première année).
⚠️ **Vérifier qu'aucun avenant postérieur à 2021 n'a révisé ces temps.**

⚠️ **Un girondin ne choisit pas « le barème Gironde »** : il choisit une combinaison de cinq
réponses. **Elles se posent avec le client, son contrat de tâche sous les yeux.**

### 30b. Densité de plantation (livré)

```
pieds_ha  = 10 000 / (écartement_rang × écartement_pied)
```

⚠️ **Ce n'est pas une convention maison.** L'accord du 2 octobre 2023 le prescrit : *en cas de
densité de plantation différente, les temps de travaux se calculent au prorata du nombre de
pieds/hectare*.

`CONFIG.vigne = {ec_rang, ec_pied}`, saisie par **deux `openPrompt` enchaînés**. Helpers dans
`utils.js` : `MV_DENS_REF` (10 000) · `_mvPiedsHa` · `_mvVigne` · `_mvDensCoef` · `_mvHhaDens`.

⚠️ **Aucun calcul d'heures ne change.** `TACHES[].hha` reste la seule source. La densité **propose**.
⚠️ **Neutre par défaut** : sans écartements renseignés, le coefficient vaut 1 et **rien ne bouge**.

★ **Le marqueur « votre valeur » compare au barème RAMENÉ à la densité.**
★ **La densité doit devenir une propriété de la PARCELLE** (§13, §28).
★★ **Le widget « Mise en route » rappelle les écartements manquants** en une ligne, avec le chiffre
qui parle : *« à 6 000 pieds, il propose un tiers d'heures de trop »* (§27c).
★★★ **Et depuis le 09/08, ils peuvent être posés DÈS L'INSTALLATION**, repris du formulaire de mise
en route — la virgule française est lue, les valeurs absurdes refusées (§18b).

### 30c. Ce qui reste vrai sur l'installation

**Ne jamais demander des heures, demander des faits.** Un h/ha n'est pas une donnée, c'est un
résultat.

Les questions qui restent utiles, dans l'ordre de leur poids :
1. **Vendange manuelle ou machine** — 80 h/ha contre ~3.
   ★ **Arbitrage à faire (avec recommandation)** : ce n'est **pas** un cas de densité, c'est un
   **AUTRE travail**. Recommandation : deux entrées de catalogue distinctes.
2. **Écartements** (déjà exploitables : §30b).
3. **Travaux confiés à un prestataire ?** Courant en Gironde. Sans ce drapeau, la charge, l'ETP et
   le simulateur réclament des salariés qu'on n'embauchera jamais.
4. **Taille dominante** — guyot simple ou double change la ligne du barème girondin.
5. **Code IDCC** du bulletin de paie, pré-rempli à 7024.

★ **Le département vient du géocodage BAN déjà fait** : zéro question supplémentaire (§13b).
★★★ **LES CINQ QUESTIONS SONT DÉJÀ DANS `mise-en-route.html`** — et depuis le 09/08, **leurs
réponses arrivent en base**, dans le dossier que l'assistant d'installation ouvre (§18b, §27f).
**Ce qui reste, ce sont les 4 heures de DISCUSSION** : elles ne s'automatisent pas, elles se
préparent.
⚠️ **Deux de ces cinq réponses seulement sont ÉCRITES** (écartements, et le SIRET qui n'est pas dans
la liste) : **l'IDCC est affiché mais pas posé**, parce que rien ne le lit encore.

★★ **MT-A — RAYÉ le 09/08.** Le rappel des écartements ne va **pas** dans l'onboarding : il vit
dans le widget « Mise en route » de l'accueil admin (§27c), et il peut désormais être évité tout
court si le client a répondu au formulaire.

### 30d. ⚠️⚠️ Ce que `_normalizeTaches` fait vraiment

Le catalogue n'est pas seulement un défaut d'installation. Pour toute tâche dont le **nom** est au
catalogue, `_normalizeTaches` **reconstruisait l'objet champ par champ** à chaque chargement :

| Champ | Comportement | |
|---|---|---|
| `hha`, `niveaux`, `passagesHha`, `saisons` | **replis** si absents | ✔ |
| `type`, `tempsReel`, `complementaire`, `skipRule`, `trous` | **écrasés d'office** | ⚠️ |
| **tout autre champ** | **DÉTRUIT en silence** | ⚠️⚠️ |

**La preuve vivante** : `t.count`, écrit par `tcfgSave`, disparaissait au rechargement suivant.

**Corrigé** : la fonction part de `Object.assign({}, t)` et n'impose que ce qui vient du catalogue.

**Second trou, même famille** : `tcfgSave` reconstruisait l'entrée de zéro sans réécrire
`saisons`/`anytime`/`conv`. Ouvrir « Pioche » chez le second domaine et enregistrer **sans rien changer** la
faisait passer d'Automne à Printemps, en silence.
★★ **C'est la même famille que le bug du formulaire d'analyse du 07/08 et que la config de
l'assistant d'installation du 09/08** : *une fonction qui reconstruit un objet de zéro perd tout ce
qu'elle ne réécrit pas.* **Le piège s'est présenté quatre fois en trois semaines, dans quatre écrans
différents.**

★ **C'était le prérequis de tout le reste.**

**Audit sur les documents réels** (`fbAdminRead(slug,'taches')` en fenêtre privée donne le doc
**brut** ; `window.TACHES` est déjà normalisé et ne montre rien) :

- **`hha` explicite sur toutes les entrées** sauf Entreplantation. **Aucun repli ne se déclenche.**
- **le domaine de référence** : 11 tâches, **565 h/ha = exactement le catalogue**.
- **le second domaine** : 9 tâches, **495 h/ha**. **Pliage, Palissage et Entreplantation absents** — 75 h/ha,
  soit **1 350 heures non budgétées sur 18 ha**. Vendange à **180 h/ha**. **À vérifier avec
  le contact technique.**
- **Les deux** ont Relevage **100** (50/25/25) et Accolage **50** là où le catalogue dit 90 et 45.
- ★ **Les 485 h/ha du commentaire = Ébourgeonnage ×2 + Pioche ×0 + Relevage ×3.** **Le total du
  barème n'est donc pas une constante** — l'invariant est le barème **par passage**.

### 30e. Les quatre sources de barème

| Source | Rôle réel |
|---|---|
| `let TACHES` (app.js) | **le seed réel** d'un nouveau tenant — 11 tâches, **sans `passagesHha`** |
| `TACHES_CATALOGUE` (app.js) | la structure de référence, 16 entrées |
| `OB_TACHES` (onboarding.js) | ⚠️ **n'écrit JAMAIS en base** |
| les documents `taches` | la réalité de chaque domaine |

★ **`obFinalize` envoie `taches: window.TACHES`**, pas `OB_TACHES`. Ses divergences sont **un
mensonge d'écran pendant l'installation, pas une divergence de données**.
★★ **L'assistant d'installation envoie lui aussi `window.TACHES`** — donc un domaine installé par
lui reçoit exactement le même seed (§18b).

⚠️ Un nouveau tenant reçoit un document **sans `passagesHha`** — **ce domaine-là bougera si le
catalogue change**, contrairement à MG et le second domaine.

★ **Le seed porte aussi les ACTIVITÉS du tracteur**, toutes rattachées à `tracteurDefautId:'trac1'` —
c'est pourquoi la première machine collée à l'installation **doit garder cet identifiant** (§18b).

### 30f. ⚠️⚠️ Le biais 1/N — et pourquoi l'axe « durée réelle » est FERMÉ

**L'app ne mesure pas le temps passé sur une parcelle.**
★ **Ce n'est pas un défaut à corriger — c'est ce qui rend juste la position de Nico** (§30i) : un
barème qu'on ne peut pas vérifier au chronomètre ne peut être qu'une **convention**.

La règle 1/N suppose **qu'une parcelle se fait dans la journée**. Le biais croît avec la taille des
parcelles : faible chez MG (0,26 ha en moyenne), faux en permanence sur des blocs girondins de 2 à
3 ha — ★ **le prospect Gironde est exactement ce profil.**

★★★ **L'AXE CAD-1 EST FERMÉ, ET C'EST UN RÉSULTAT — PAS UN ABANDON.**
Trois mesures en lecture seule l'ont tué :
1. le statut « En cours » n'est posé que sur **18,4 %** des validations (46 sur 250) ;
2. dans ces 46, **72,7 % des durées supérieures à 7 jours portent sur des tâches à passages ou
   niveaux** — c'est **l'écart entre deux passages**, pas une durée de chantier ;
3. il reste ~8 chantiers vraiment multi-jours sur 250, et **on ne sait pas distinguer un chantier
   long d'un drapeau oublié**.

**Le signal n'est pas seulement rare, il est ILLISIBLE.** ★ **Mesurer avant de corriger a économisé
un lot entier** — et a fait apparaître un défaut dormant au passage (`_findDebutTache`, §15).

★ **L'exception tâcheron.** Un tâcheron est payé au forfait : son module doit respecter la
convention **quel que soit le temps qu'il y met**. ⚠️ **Aucun tâcheron aujourd'hui.**

### 30g. Le coefficient de domaine — calibrer en bloc

```
  heures réellement présentes au champ   →  _planPresentRef
– heures tracteur                        →  _tractHoursSeason
– autres activités                       →  déjà séparées
÷ heures de barème du travail fait       →  Σ TRAVAUX[t].h_done
= coefficient de domaine
```

« Sur l'hiver, l'équipe a passé 1 240 h au champ pour 1 810 h de barème. Votre barème est 32 % trop
large. Le recaler en bloc ? »

★ **Ce calcul est devenu possible le 04/08** : tant que `h_done` comptait des passages jamais faits
(§16b), le coefficient aurait conseillé de baisser un barème correct — **un mauvais conseil, avec
l'autorité d'une mesure**.
★★ **Et il a failli l'être une seconde fois** : jusqu'au 09/08, l'écart de cadence d'Économie disait
exactement cela, en vert, sur un barème juste (§20b). **Deux fois le même piège, deux causes
différentes : c'est le signe qu'un indicateur de ce genre doit être mesuré avant d'être affiché.**

Trois gardes non négociables : proposition **jamais automatique** · **admin seulement** ·
**écartable définitivement**.

### 30h. Convention collective — plus petit qu'il n'y paraît

Depuis avril 2021, la CCN production agricole et CUMA (**IDCC 7024**) a remplacé environ 140
conventions départementales. Le cadre — 1607 h, modulation 250 h, congés — est **national**.
Ce qui reste local : la **grille de salaires** et les primes d'usage. Or Ma Vigne ne calcule pas la
paie. **Le risque est donc borné.**

★★ **`CONFIG.cadre_legal` EXISTE DÉJÀ** et porte les durées. **Ne pas le doubler.** Ce qui manque
n'est que l'**identification** : `CONFIG.rh = { idcc, convention_libelle }`, plus le **libellé de
convention + IDCC en tête du PDF de relevé**.
⚠️ **C'est exactement pour ça que l'IDCC recueilli par le formulaire n'est PAS écrit** (§18b) :
poser une clé que rien ne lit donnerait l'illusion d'un réglage fait. **Le jour où ce lot existe,
la reprise devient triviale — la donnée est déjà dans le dossier.**

**Règle de non-régression absolue** : les défauts reproduisent exactement le comportement actuel.

⚠️ **À écrire noir sur blanc dans le guide et les CGU : Ma Vigne produit un relevé d'heures, pas un
bulletin de paie.** ★ **C'est déjà dans la fiche d'aide Planning.**
⚠️ Claude n'est pas juriste : faire confirmer par un expert-comptable social avant de vendre hors
Bourgogne.

### 30i. ★★ La position de Nico, figée

**L'application est INFORMATIVE, pas un texte de loi.** Le barème est une **référence datée et
sourcée** ; le vigneron reste libre de ses valeurs. L'accord lui-même le prévoit.

Conséquences déjà appliquées :
- le badge **« ✎ modifié »** est devenu **« votre valeur »** en vert discret, avec **les deux
  chiffres côte à côte** — « Convention : 70 h/ha · chez vous : 100 ».
- chaque barème régional affiche **son texte source et sa date**.
- changer de barème **ne touche aucune donnée du domaine**.

★ **Le modal « Barème de la convention » est le vrai point d'entrée**, pas l'onboarding.

★★ **La même position vaut pour les documents de cave** : ils **présentent**, ils ne certifient pas.
« Ma Vigne prépare, l'exploitant déclare » est écrit **dans les documents eux-mêmes**.
★★★ **Et elle vaut pour la MALO** : Ma Vigne **projette une date à partir des mesures du vigneron**,
elle ne décide pas quand soutirer. Quand les données ne permettent pas de projeter, **elle le dit et
s'arrête**.
**Ne jamais produire une date avec l'autorité d'un calcul quand la donnée ne la porte pas.**
★★★ **Corollaire pour tout indicateur** : *un indicateur bâti sur un signal partiel ment avec
l'autorité d'une mesure.* L'écart de cadence en est l'exemple parfait — il ne disait pas « je ne
sais pas », il disait « vous allez deux fois plus vite que prévu ».
★★★ **Corollaire du 09/08 au soir, pour tout ÉCRAN** : *ne jamais annoncer un réglage qu'on ne pose
pas.* L'IDCC affiché mais non écrit, et la liste « à finir » qui suit ce qui a été fait, viennent
tous deux de là.
★★★ **Corollaire du 12/08 nuit, pour toute TRACE** : *une trace affichée n'est pas une trace lue.*
`taux_hist` était écrit à chaque changement de salaire et rendu en une phrase sous le champ — et
**aucun calcul ne le lisait**. Il ne rassurait pas à côté du problème : **il le masquait**, en
donnant l'apparence d'un historique tenu pendant que les totaux se réécrivaient en silence.
⚠️ **Devant tout champ « historique », « journal » ou « trace », la question n'est pas *existe-t-il ?*
mais *qui le LIT, et pour calculer quoi ?*** Un `grep` du nom de la clé répond en dix secondes.

### 30j. Ce qu'il ne faut PAS faire

- **Pas de déduction de la convention par le département** : c'est l'employeur qui déclare son IDCC.
- **Pas un écran de paramétrage de 40 champs après installation.** Demande explicite de Nico.
- **Pas de saisie nouvelle sur le terrain** : ça contredit toute la série UX-R.
- **Pas de barème régional inventé.** Un jeu se construit sur un texte, avec sa source et sa date.
- ★★ **Pas de document qui prétend certifier.**
- ★★★ **Pas de projection sans mesure.**
- ★★★ **Pas d'écran qui promet ce qui n'existe pas** — ni « module à venir » chez un client payant,
  ni un geste qui mène à un écran inexistant (§27c), ni une liste « à finir » qui réclame ce qu'on
  vient de poser (§18b).
- ★★★ **Pas d'auto-inscription, pas de tunnel, pas de paiement en ligne.** La série installation
  réduit **le temps de Nico**, jamais sa présence.

### 30k. Ce que ça change pour le domaine de référence et le second domaine

**Rien**, tant qu'ils ne touchent à rien : sans écartements et sans changement de barème, le
coefficient vaut 1 et le jeu actif est la Côte de Nuits. **20/20 tâches inchangées.**

Une seule chose bouge visiblement : **les heures de relevage chutent** (−528 h chez MG). **C'est la
correction, pas une régression.**

★ **Même logique pour toute la Cave** : un domaine qui n'a pas rempli son parc à fûts décuve
exactement comme avant · le bilan d'un domaine sans Cuvier affiche « aucune récolte saisie » ·
★★ **un domaine à un seul millésime ne voit ni le rang de saisie, ni les intertitres d'ouillage, ni
le bandeau multi-millésimes** · ★★ **un domaine qui ne règle aucun seuil par millésime garde
exactement l'alerte à 14 jours qu'il avait**.
★★★ **Et pour l'accompagnement** : un domaine entièrement installé **ne voit pas** le widget
« Mise en route » · une fiche d'aide dont le module n'est pas chargé **omet son point dynamique** ·
le guide reste identique tant qu'on ne régénère pas.
★★★ **Et pour l'installation (09/08 soir)** : **aucun de ces cinq lots ne touche un domaine
existant.** Sans liste collée, sans découpage repris, sans machines, sans volume de fût choisi,
l'installation écrit **exactement ce qu'elle écrivait avant**. Le seul changement qui touche un
domaine vivant est le **correctif du tenant** — et il ne fait que rendre juste un appel qui pouvait
partir au mauvais endroit.
**Tout lot doit avoir son repli, et le repli doit être testé.**

### 30l. Portée commerciale

Cette série rend un domaine girondin installable **sans que Nico connaisse la Gironde** — et
★★ **le test grandeur nature est arrivé le jour même de la livraison**. Elle ne supprime pas le
forfait d'installation, **elle le justifie** : une heure de cadrage avec le client et son contrat de
tâche, au lieu de deviner.

★ La grille d'installation étant tranchée, le devis le prospect Gironde est **écrivable dès le retour de son
formulaire** — seule la durée de l'offre de lancement reste à borner.
★★★ **Et depuis le 09/08, le forfait est SOUTENABLE** : 20 h incluses pour une installation qui en
coûte 9 laisse de la marge pour l'imprévu, la formation et les allers-retours. ⚠️ **Chiffre à
confirmer par l'installation à blanc.**

---

*Fin des instructions personnalisées — Ma Vigne / GUERETTECH. Document volontairement sans numéro de
version (Règle d'or n°2).*


## 31. ★★★ LE CHRONO TRACTEUR INVERSÉ (11/08 — v5.92)

**Le geste de mesure a été retourné : la coche EST le chrono.**

### Ce qui n'allait pas

L'ancien chrono demandait **Démarrer → cocher → Arrêter** : trois gestes pour la parcelle, sur le
travail le plus répété de la journée. Sans chrono, cocher coûtait **un** tap. **Le chrono se payait
donc ×3** — ce qui explique qu'il soit resté en opt-in (`CONFIG.chrono_mode`) et peu utilisé.

★★★ **Mais le vrai défaut était ailleurs, et personne ne l'avait vu :** `_chrono` était une
**variable JS que rien ne persistait**. `_chronoFinalizeOnClose()` n'était appelé que depuis
`closeSessionDetail()`. **Un téléphone verrouillé pendant 40 min de rognage — le cas normal dans une
cabine — perdait la mesure en silence.** Aucune alerte, aucune récupération.

### Le modèle

| Geste | Effet |
|---|---|
| **Toucher une parcelle** | la mesure démarre dessus |
| **« J'AI FINI »** | la mesure se ferme, le temps part en **hors parcelle** |
| **Toucher une AUTRE parcelle** | clôture la première, démarre la seconde, **sans compter de déplacement** |
| **Appui long** | ajoute au bloc en cours — temps partagé à la surface |
| **⏸** | interruption en pleine parcelle : la parcelle **reste ouverte** |

C'est le geste qui déclare la situation, parce que **l'app ne peut pas la deviner** : certaines
parcelles sont mitoyennes, d'autres à plusieurs kilomètres, et rien dans les données ne dit laquelle.

### Trois seaux, jamais quatre

**MESURE** (dans les parcelles) · **HORS PARCELLE** (trajets, pause légale, ravitaillement, réglage
— *tout du temps travaillé*) · **PAUSE DÉJEUNER** (non travaillée).

⚠️ **« Pause déjeuner » est JUSTE ici et interdit dans le planning.** Le cliquet
`scripts/lint-vocabulaire.mjs` bannit le mot de `planning.js`, `reglages.js` et `index.html` parce
qu'il désigne en droit un **droit du salarié**. Sur le tracteur, **le tractoriste est seul et choisit
vraiment son moment** — le mot est exact. C'est pourquoi le libellé **vit dans `tracteur.js`**, qui
n'est pas une cible du cliquet : `index.html` reste à zéro, la protection du planning est intacte.

### ★★★ Ce chrono ne justifie PAS la journée de travail

Au retour il reste le **lavage, les niveaux, le plein de GNR** — ils n'y sont pas. Le chrono sert à
**budgéter** les travaux de tracteur et à connaître le temps réellement passé dans les vignes.
**L'écran le dit en toutes lettres, à deux endroits** (sous les compteurs et dans le bilan) : sans
ça, un tractoriste lit le total comme sa journée.

### Chrono douteux = mesure écartée

Au-delà de **3× le barème**, en dessous de **40 %**, ou au-delà de **12 h** : on **n'écrit pas
`dmin`**. La parcelle est cochée **au barème**, sans temps constaté.

★★ **Rien n'a eu besoin d'être codé pour ça.** `_chronoSummary` filtre déjà sur `dmin != null` pour
le « Constaté » et retombe sur `_sessBaremeMin` pour l'« Appliqué » ; `pilotage.js:4318` fait le même
repli, indépendamment. **La bonne réponse était de RETIRER une écriture, pas d'ajouter un mécanisme.**
Un premier dessin proposait un dialogue à trois réponses : c'était de la sur-ingénierie.

⚠️ **Mais l'écart est DIT** — toast, ligne ambre dans la liste, compteur au bilan. Un écart
silencieux serait un indicateur qui ment par omission. **Si un domaine voit ses parcelles écartées
tous les jours, ce n'est pas le tractoriste qui oublie : c'est le `h_ha` de l'activité qui est faux.**
Le compteur d'écarts est le seul moyen de s'en apercevoir.
**Une activité sans `h_ha` n'a pas de barème → aucun écart possible, tout compte.**

### Persistance

`t0` est **ABSOLU**, l'état vit dans `localStorage` (`mavigne_chrono_session`), écrit à chaque geste
plus sur `pagehide` et `visibilitychange`. Le `sid` de session est dans la charge utile : un état
laissé sur une autre session est ignoré.
⚠️ **`closeSessionDetail` n'écrit plus rien** — le bloc en cours est persisté et repris. Écrire à la
fermeture forcerait une mesure à chaque coup d'œil à l'écran.
⚠️ **Le `catch` d'un `localStorage` en échec ne doit pas être vide** : c'est exactement la panne que
ce moteur répare. Il prévient l'utilisateur une fois (`_chrPersistKO`).

### Tri de la liste

**Tournée du chef** (`_mvOrdreFor`) **>** **proximité** au point courant **>** parcelles sans
polygone, groupées sous un séparateur (elles ne disparaissent jamais).
⚠️ **La géographie vient des CENTROÏDES KML** (`_mvParcGeo`), **jamais d'une géolocalisation du
tractoriste** — décision explicite de Nico. Ce sont **les parcelles** qui sont situées, pas l'homme.
La distance s'affiche (`240 m`, `1,2 km`).

---

## 32. ★★★ LE MODE DU JOUR (11/08 — v5.93)

**« Tu prends le tracteur aujourd'hui ? »** — posé à la première ouverture du jour.

### Pourquoi journalier, et pas permanent

Le tracteur se prend **pour la journée entière** : on attelle le matin, on dételle le soir. Mais le
lendemain la même personne peut repartir au terrain. **Un mode permanent se tromperait un jour sur
deux ; une question à chaque ouverture serait redemandée alors qu'elle est tranchée à 8 h.**

★★ **Un premier dessin proposait un mode collant, et l'objection était juste — mais pour la mauvaise
raison.** L'argument « les journées sont mixtes » a été démenti par Nico, qui est chef d'équipe :
elles sont homogènes **dans** la journée et variables **d'un jour à l'autre**. **C'était la
granularité qui clochait, pas le concept.**

### La question porte sur le FAIT, pas sur l'identité

Deux tuiles : **« Oui, je prends le tracteur »** / **« Non, je suis au terrain »**. Pas
« Ouvrier / Tractoriste » : un polyvalent n'a pas à choisir **qui il est** chaque matin, et
« Ouvrier » se lirait comme une rétrogradation.

### Qui reçoit la question

`ouvrier` **ET** `tractoriste` **ET** pas `admin` (il a besoin de tout) **ET** au moins une session
tracteur au statut « En cours ».
⚠️ **Les traitements phyto vivent dans le même tableau `SESSIONS`** (`type:'traitement'`) et ne
déclenchent pas la question.
⚠️ **Pas de filtre sur le conducteur** : celui qui n'a pas encore créé sa session est précisément
celui qui a besoin de l'écran.

### Mémoire

`mavigne_mode_<tenant>_<personne>`, **la date dans la VALEUR et non dans la clé** — la réponse d'hier
expire d'elle-même à minuit, rien à purger. Même patron que `_hcKey` (Plein soleil).

### ⚠️⚠️ Le mode ne touche AUCUN droit

Il **range** le dock et choisit l'atterrissage. Une personne en mode terrain **reste tractoriste** au
sens des rules et des gardes `isTractoriste()`.
**Ne jamais écrire `if (_mvMode()==='tracteur')` comme garde de sécurité : ce n'en est pas une.**
Une notion qui a besoin de cette phrase est fragile — d'où le commentaire en tête du bloc.

**Rien ne disparaît** : ce qui sort des 4 cases du dock passe sous « Plus », qui porte aussi la
**sortie du mode**. Un module introuvable coûte plus cher qu'un module de trop.

### Le trou assumé

Une session passe à « Terminé » à 100 %. **Le lendemain d'un chantier fini, il n'y a plus de session
ouverte → pas de question ce matin-là.** Le tractoriste passe par le dock, crée sa session, et la
question repart le jour suivant. **Ça s'auto-corrige en un jour** — le corriger voudrait dire poser
la question à des gens qui ne prennent pas le tracteur, ce qui est pire.


---

## 33. ★★★ LES ETP, L'ANNÉE ET LES CONTRATS (12/08 — APP v5.99 · SW v6.49)

### Le point de départ

Une capture d'écran de **Pilotage › Charge & ETP** et six mots : *« beaucoup de faute ! calcul
d'etp, etp present… »*. Trois chiffres que Nico ne comprenait pas, et il avait raison sur les
trois :

- **2353 h → 10,5 ETP**
- **Août : 27 ETP requis pour 11,2 présents**
- **Septembre : 6,1 ETP**

Plus une barre de répartition affichant **392 %**.

### Le diagnostic — quatre bugs, une seule famille

Reconstitution faite **depuis les chiffres affichés**, avant de toucher au code :

| grandeur | valeur déduite |
|---|---|
| charge vigne | 2353 h |
| `capRefTotal` (1 ETP sur la période) | ≈ 224 h |
| `capEquipe` (l'équipe sur la période) | ≈ 600 h |
| `capRef` septembre (mois **entier**) | ≈ 176 h |
| `capRef` août (jours **en saison** seulement) | ≈ 47,5 h |

**Les quatre défauts sont la même erreur sous quatre formes : un numérateur divisé par un
dénominateur qui n'est pas le sien.**

**1. `etpReq = chargeOrd / capRef`** — numérateur : les heures qui **tombent dans le mois**.
Dénominateur : la capacité du **mois entier**. Une vendange de quatre jours dans septembre était
divisée par vingt-deux jours → **6,1**. La même intensité en août, tronqué par le début de saison,
donc à dénominateur court → **27**. *Deux dénominateurs sous un seul mot.*

**2. `presAtPeak` = moyenne mensuelle de `head`.** Sur une campagne où l'équipe vaut **42** une
semaine et **2** les autres, la moyenne donne **12** — un chiffre qui **n'existe aucun jour de
l'année**. (Détail réel : août = (1 + 2 + 30,6)/3 = 11,2 ; septembre = (42 + 2 + 2 + 2)/4 = 12.)

**3. `capEquipe` et `capPresent` sans le poids de l'effectif collectif.** `_headWeek` et
`_capWeekReal` appliquaient `*w`, ces deux-là non : **une équipe de 40 vendangeurs comptait pour
une personne.** D'où `capEquipe` ≈ 600 h au lieu de ≈ 2 900.

**4. La barre de répartition saturée.** `_pV = _vig/_prez*100` → **392 %** dans un segment qui se
présente comme une **part**, pendant qu'« Autres » tombait à **0 h** par le `Math.max(0,…)`. Elle
mentait deux fois : une part impossible, et un reste inventé à zéro alors qu'il y a bien de la
cave et des trajets.

### ⚠️⚠️⚠️ LE MÊME ÉCRAN DISAIT DEUX CHOSES CONTRAIRES

C'est le fait le plus important de la journée. Sur **la même capture** :

- la **courbe hebdomadaire** (`need = wh/wcap`, juste depuis toujours) montrait les deux semaines
  de vendange **couvertes** — barres à ~23 et ~38, ligne d'effectif à ~35 et ~42 ;
- la **ligne de synthèse**, deux centimètres plus bas, annonçait **« manque ~15,8 ETP »**.

**Personne ne l'avait vu.** Un écran qui se contredit ne lève aucune alarme : il donne deux
chiffres plausibles, et le lecteur en croit un au hasard. C'est la panne la plus coûteuse du
projet à ce jour, et elle a vécu des mois.

★★★ **La règle qui en sort : quand deux éléments d'un même écran répondent à la même question, il
faut les faire lire la MÊME source, ou en supprimer un.** Ici, `peakReq` a été rebasé sur
`weeks[]` — la maille de la courbe — et le détail mensuel a été **supprimé** plutôt que réparé.

### La preuve par le harnais — reproduire avant de corriger

`mv-harnais-etp.mjs` (hors dépôt) rejoue `_chargeSaisonData` **sur les données réelles du
domaine** : 16 fiches, équipe collective « Vendangeurs » à 40, période *Vendanges* 10/08 → 30/09.
Il retrouve **2352 h** et un **pic mensuel de 27,0** — les chiffres exacts de la capture. **Le
modèle est donc fidèle**, et tout ce qu'il mesure ensuite vaut pour le vrai domaine.

| | avant | après |
|---|---|---|
| pic | 27,0 (mensuel) | **36,6 (hebdo)** |
| effectif au pic | 11,2 (moyenne) | **42,0 (la semaine du pic)** |
| `capEquipe` | ~600 h | **2 887 h** |
| barre de répartition | 392 % | **81 %** |
| alerte | « manque 15,8 ETP » | **couvert** |

★ **Contre-épreuve systématique** : chaque défaut réintroduit un par un fait rougir le harnais.

---

### Lot 1 — le pic à la semaine, et la frise annuelle

`planning.js` + `pilotage.js` + `reglages.js`, **aucun bump** (modules JS seuls).

- `peakReq` / `peakWeek` / `peakMonth` / `peakPres` **rebasés sur `weeks[]`**, avec un garde
  `w.cap > 0` (semaine hors template : `need` n'y veut rien dire).
- `anyShort` compare `need` et `head` **de la même semaine**.
- **Détail mois supprimé** (chip `etp_mois` → `etp_annee`). Non réparable : un mois est trop long
  quand le travail dure quatre jours.
- `*_mbPoids()*` posé sur `capEquipe` et `capPresent`.
- Barre de répartition **plafonnée à 100 %** ; la surcharge est **écrite en clair** (`×3,9`) au
  lieu d'être absorbée.
- Le chiffre moyen porte désormais sa propre mise en garde : *« une moyenne n'est pas un pic »*.

#### ★★★ La frise annuelle — l'union des périodes, PAS une entité de plus

**Le piège évité, et il était réel.** Une fenêtre de tâche par défaut est une **FRACTION du span**
de sa période (`_mvTaskWin`, `planning.js:841`). Étirer un span à douze mois étalerait la taille
sur un tiers d'année. **La solution : appeler `_chargeSaisonData` PÉRIODE PAR PÉRIODE, chacune avec
son propre span, puis recoller les `weeks[]` sur un axe commun.** Chaque tâche reste chez elle.
Zéro migration, zéro prérequis de saisie, `_VISU_SAISON` intact.

Le recollage est légitime parce que `need = wh/wcap` se calcule **sur la même semaine des deux
côtés** : deux périodes produisent des valeurs directement comparables.

- **Barres empilées** : vert = ce que l'équipe absorbe, rouge = le renfort à trouver. *La hauteur
  de rouge EST le nombre à recruter*, lisible sans calcul. L'ancienne barre était coloriée en
  entier — elle disait « ça déborde » sans dire de combien.
- **Ligne pointillée du socle permanent** (`headPerm`, déjà calculé). Sans elle, à 42 au pic,
  l'hiver à 3 rampe en bas, illisible. Avec elle on lit *« au-dessus, c'est du renfort »*.
- **Zones hachurées** = aucune période ne couvre. Un trou n'est pas une absence de travail, c'est
  une absence de période — il ne se dessine **jamais à zéro**, un zéro est une mesure.
- **Clic = ZOOM**, pas surbrillance : l'axe X **et l'axe Y** se recalent, et les **tâches de la
  campagne** remplacent le bandeau. C'est ce qui répond à *« laquelle fait le pic ? »*.
- Chevauchement de périodes signalé (heures comptées deux fois).

---

### Lot 2 — l'historique des contrats

`utils.js` + `planning.js` + `reglages.js` + `index.html` + `sw.js`. **BUMP APP 5.98 → 5.99 et
SW 6.48 → 6.49** (`utils.js` touché).

#### ⚠️⚠️⚠️ La perte était EN COURS, pas passée

Trois salariés devaient resigner **cinq jours plus tard**. Chaque resignature aurait effacé leur
printemps. C'est ce qui a fait passer ce lot devant l'année, plus urgent en apparence.

**Et la perte avait lieu À LA SAISIE.** Nico avait tapé la date du CDI de Victor par-dessus celle
de son CDD ; l'app n'avait rien dit. **Aucun code de lecture ne pouvait rattraper ça** — la donnée
n'existait plus nulle part. Le CDD de Victor **est perdu**, pas caché : il faut le ressaisir.

★ **La leçon, qui dépasse ce lot : quand une donnée disparaît, chercher d'abord si elle a été
écrasée à l'écriture avant d'aller réparer la lecture.**

#### La règle, dictée par Nico

> *« Il y a eu un délai entre la fin du 1er et le début du second. Les contrats auraient été signés
> sans jour de pause entre les 2, ça se serait suivi. Pour les CDD, apprentis et CDI, ils suivent
> le rythme imposé par le planning au moment de l'embauche, il n'y a pas de dû d'un côté ou de
> l'autre. »*

→ **Contrats CONTIGUS (fin + 1 jour = début suivant) = un seul.** **UN jour de coupure = deux
contrats, chacun son compteur de 1607 h.** `_mvJourApres` passe par `Date` : un `+1` sur la chaîne
donnerait `2026-07-32`.

#### Le modèle, et pourquoi pas un tableau à la place du couple

`debut_contrat`/`fin_contrat` **gardent exactement leur sens** : le contrat **en cours**, celui que
lit la paie. `m.contrats[]` ne porte que les **précédents**. Bilan : **3 fonctions changent** au
lieu de 40 sites, migration nulle (tableau absent = vide), et les 37 autres lecteurs continuent de
lire ce qu'ils doivent lire.

#### Le garde-fou, volontairement étroit

Archivage automatique **seulement si** l'ancien contrat est **clos** (il a une date de fin) **et**
que le nouveau début est **strictement postérieur** à cette fin. Corriger une faute de frappe ne
remplit jamais cette condition → **pas de faux contrat passé fabriqué**. Toast à l'archivage, et
la fiche affiche la liste avec un `×` par ligne : *une donnée invisible est une donnée qu'on ne
peut pas croire*.

**Harnais** `mv-harnais-contrats.mjs` : 20 assertions, dont le piège du **31/07 → 01/08**, et une
assertion **structurelle** vérifiant que `_planInContract` ne lit **pas** `_mvContrats`.

---

### Lot 3 — l'année EST l'exercice comptable

`pilotage.js` + `reglages.js`, **aucun bump** — et c'est le point de conception : **`_mvExercice`
est déjà la source unique de « où commence l'année »**. On la consomme, on n'en fabrique pas une
seconde. Toucher `utils.js` aurait été le réflexe, et il aurait été faux.

**La demande de Nico tenait en deux phrases apparemment contradictoires** : *« on fait coïncider
l'année avec le début d'exercice écrit par l'admin »* et *« il faut trouver un moyen d'avoir le
visuel d'une année vigne, de après vendange N jusqu'à fin vendange N+1 »*.

★★★ **La résolution : ce ne sont pas deux années, c'est une année bien posée.** On n'obtient pas le
visuel d'une année vigne en codant une seconde année — **on l'obtient en ouvrant l'exercice au bon
mois.** Le lot ne code donc pas une année vigne : **il mesure si l'exercice en est une, et le dit.**

- `_cmpAnneeExercice()` (reglages.js) — ancrée sur la **période active**, pas sur aujourd'hui :
  consulter Hiver 2025 en août 2026 doit montrer l'exercice qui le **contient**.
- `_cmpFenetre` **n'a pas changé** : elle encadre les périodes telles que saisies pour la frise
  d'édition de Réglages, et doit continuer de tout montrer, débordements compris. Deux écrans,
  deux questions, deux fonctions.
- Le mois d'exercice entre dans la **clé de mémoïsation** — sans lui, changer le réglage laisserait
  la frise sur l'ancien cadre.

#### Le diagnostic d'alignement — trois états

| état | condition | ce que ça veut dire |
|---|---|---|
| 🔴 **coupée** | une borne traverse la fenêtre de vendange | la récolte est **à cheval sur deux exercices** : moitié des heures et du coût d'un côté, moitié de l'autre |
| 🟠 **mal alignée** | vendange dans le premier tiers (`pos < 0,72`) | elle **ouvre** l'année au lieu de la clore : on lit deux moitiés de cycles |
| 🟢 **alignée** | ni coupée, `pos ≥ 0,72` | d'après la vendange précédente à la fin de la suivante |

**État réel du domaine :** exercice au **1ᵉʳ août**, vendange à **7 %** de l'année → 🟠. Au
**1ᵉʳ octobre** : cadre 01/10 → 30/09, vendange à **90 %** → 🟢. Le bandeau propose le réglage en
**un clic** (`_pexSetMois`, qui vérifie le droit admin et **relit après écriture**).

Un quatrième bandeau compte les **périodes hors exercice** : leur travail et leur coût tombent
dans une autre année comptable — *ça se décide, ça ne se découvre pas*.

★ **Pourquoi ce diagnostic existe** : un cadre annuel mal posé **ne produit aucune erreur
visible**. Il donne des chiffres plausibles sur un cycle coupé en deux. **C'est la pire des pannes,
celle qui ne se voit pas** — exactement celle qu'on venait de passer trois heures à débusquer.

#### ⚠️ Limites assumées, imprimées par le harnais à chaque exécution

- L'exercice ouvre au **1ᵉʳ d'un mois**. Une vendange tardive à cheval sur une fin de mois — le
  millésime 2021 est allé en octobre — **reste coupée quel que soit le réglage**.
- Le diagnostic lit les **fenêtres de tâches**, pas le journal. Une vendange réellement plus
  tardive que prévue ne déclenchera rien tant que les dates prévisionnelles ne bougent pas.

---

### ★★ Ce que la journée a appris

★★★ **Un écran qui se contredit ne lève aucune alarme.** Deux chiffres plausibles, et le lecteur
en croit un au hasard. Quand deux éléments d'un même écran répondent à la même question : même
source, ou on en supprime un.

★★★ **Une moyenne sur une fenêtre où la grandeur varie d'un facteur 20 n'est pas un résumé, c'est
une invention.** « 12 présents » n'existait aucun jour de l'année. Toute moyenne affichée doit
porter la fenêtre sur laquelle elle est prise, et céder la vedette au pic.

★★ **Quand une donnée disparaît, chercher d'abord l'écrasement à l'écriture.** On a failli passer
le lot à réparer des lecteurs alors que la perte se produisait à la saisie.

★★ **Un indicateur qui n'a pas de dénominateur naturel n'a pas de sens.** `charge / capRefTotal`
sur une période de cinq semaines ne veut rien dire ; **sur une année**, `charge / 1607` devient le
nombre de permanents à embaucher. Ce n'est pas la formule qui change, c'est la fenêtre.

★★ **La bonne réponse à « ajoute une année » était « n'ajoute rien ».** L'exercice existait déjà,
les deux moteurs de coût aussi. Le réflexe de créer une entité de plus aurait doublé une source de
vérité — le motif exact qui a coûté 941 heures fantômes.

★ **Deux assertions fausses pour zéro bug**, encore : le harnais année cherchait la disparition
**globale** de `_mvExerciceMois`, qui apparaît ailleurs dans le fichier. **Le test était faux, pas
le code.** Corrigé, pas contourné — et le commentaire dit pourquoi.

★ **Un diagnostic reconstitué depuis un écran vaut une mesure, s'il retombe sur les chiffres
affichés.** Le harnais retrouvant `2352 h` et `27,0` a validé le modèle entier avant la première
ligne de correctif.

### Fichiers, versions, état

| fichier | lot | bump ? |
|---|---|---|
| `src/planning.js` | 1 + 2 | — |
| `src/pilotage.js` | 1 + 3 | — |
| `src/reglages.js` | 1 + 2 + 3 | — |
| `src/utils.js` | 2 | **APP 5.98 → 5.99** |
| `index.html` | 2 | 4 affichages |
| `public/sw.js` | 2 | **6.48 → 6.49** |

**Contrôles passés sur les trois lots** : preflight C1→C22 `0/0` · cliquet ESLint `0`, plafond `0`
· cliquet vocabulaire `0` · `node --check` sur les cinq JS · balance accolades/parenthèses
identique à la base · `catch{}` inchangés (C14) · diff ciblé, aucune ligne hors zone ·
**WHATS_NEW vérifié EN L'EXÉCUTANT EN NODE** (4 items, émojis et apostrophes typographiques
corrects).

⚠️ **NON DÉPLOYÉ au moment de l'écriture.** `npm run build && firebase deploy`.

⚠️ **Trois harnais hors dépôt à sauvegarder dans `mavigne-sauvegardes\`** : `mv-harnais-etp.mjs`,
`mv-harnais-contrats.mjs`, `mv-harnais-annee.mjs`.

### ★ Ce que ce chantier a ouvert et n'a pas fermé

**1. Le coût annuel de main-d'œuvre et sa répartition par campagne.** Position de Nico, à retenir
telle quelle : *« après vendange on est en vinification, personne ne travaille encore dans les
vignes mais les permanents continuent d'être payés et ont donc un coût de main d'œuvre »* et
*« deux campagnes peuvent se chevaucher »*. **Les deux moteurs existent déjà** : le budget de
campagne (barème h/ha, attribué aux tâches) et l'exercice (`_planPaidRange` × taux, **toutes** les
heures payées, datées). `pilotage.js:5624` écrit déjà pourquoi on ne peut pas déduire l'un de
l'autre. **Ce qui manque est le pont** : coût annuel **par date** (la vérité), part d'une campagne
**par tâche** (le chevauchement disparaît, une tâche n'appartient qu'à une campagne), et le
**reste** = vinification, entretien, trajets, temps mort.
⚠️ **Le journal ne stocke PAS d'heures** — seulement date + tâche + qui (`_pilTaskReal:656`). Le
croisement passe par les heures payées du jour, réparties sur les tâches où la personne apparaît.
⚠️⚠️ **Ce reste mélangera deux choses** : le vrai travail hors vigne et le travail vigne **non
saisi**. Il n'est lisible qu'accompagné d'un **taux de saisie**. Sans lui : un indicateur bâti sur
un signal partiel, qui ment avec l'autorité d'une mesure.

**2. Deux contrats dans la même année civile → deux compteurs de 1607 h.** L'écran Planning n'en
affiche qu'un, celui du contrat en cours. **Affichage, pas calcul.**

**3. La position de la période *Vendanges*** court jusqu'au 30 septembre alors que le travail
s'arrête le 6. Ça ne fausse plus le pic, mais dilue la moyenne sur trois semaines vides.

---

## 34. ★★★ LE CHANTIER PILOTAGE — SIX LOTS (12/08 soir — APP v6.01 · SW v6.51)

**Point de départ**, mot pour mot : *« on améliore fois 100 pilotage. pour le moment ça ne convient
pas. réfléchi à la meilleure disposition, il faut que tous les graphismes soient cohérents. qu'il y
ait une réelle interaction entre la sélection de l'utilisateur et ce qui est affiché par les chiffres
et les graphiques. il faut un outil pro, rangé, qui fait une photo de l'année (budget, effectif,
travaux), puis une photo de la campagne, puis une photo du personnel, des tâches. des simulations.
on zoom de plus en plus sur le détail après avoir vu une vue d'ensemble. »* Plus une capture d'écran
de l'onglet Avancement.

### 34a. Le diagnostic, mesuré sur le code — pas sur l'impression

| ce que Nico voyait | ce qu'il y avait dessous |
|---|---|
| « les graphismes ne sont pas cohérents » | **12 moteurs de graphe** indépendants (10 SVG + 2 HTML), **4 palettes** concurrentes (`_PIL_PIE_COLORS`, `_PEC_COL`, `_PIL_TASK_COL`, `_PCAV_PHASES`), chacun ses marges et ses axes |
| « pas d'interaction avec la sélection » | **5 sélecteurs isolés**. Cliquer une campagne ne bougeait **qu'un** panneau |
| « ce n'est pas rangé » | 7 onglets = 7 **sujets** à plat. Aucun n'est un niveau de zoom. « Charge & ETP », un tableau de bord de 12 mois, était enfermé dans **une tuile pliable** |
| « ça ne signale pas ce qui manque » | **29 impasses** (`pil-empty`) : du texte disant « Réglages › Saisons » **sans aucun lien**, découvrables seulement en ouvrant l'onglet qui les contient |
| — | **3 endroits** répondaient à « combien d'ETP ? » — la faute exacte que §33 venait de documenter |

★★★ **LA CAUSE RACINE, ET ELLE VAUT AU-DELÀ DU PILOTAGE :** *les onglets étaient un **axe de
sujets** alors que Nico demandait un **axe de zoom**.* Tant que les deux sont confondus, chaque écran
repart de zéro. Ce n'était pas un problème de mise en page.

### 34b. La maquette d'abord — trois versions, validées avant toute ligne de code

Maquette **HTML cliquable** (palette et polices réelles de l'app, données réelles du domaine :
2 353 h, pic 36,6, 42 présents, 2 979 h de présence). Trois itérations, chacune corrigeant une faute
trouvée **dans la maquette elle-même** :

- **v1 → v2** : la ligne d'effectif plongeait à zéro sur un trou ; les sparklines à 4 points
  suggéraient une continuité qui n'existe pas (4 campagnes ne sont pas une courbe → barres).
- **v2 → v3** : trois textes **en dur** (« Rognage », « 3 fiches sans taux », « 40 vendangeurs »)
  s'affichaient sur des campagnes où ils étaient **faux** — la faute même qu'on corrigeait.
- **v3, après ajout des filtres** : le tableau des tâches affichait 764 h pendant que la photo
  disait 572 h. **Le même écran disait deux choses.** Corrigé, puis **vérifié par un test qui
  compare la photo à la somme du tableau : écart 0 h.**

★★ **Leçon de méthode** : corriger un dessin coûte dix minutes, corriger 6 800 lignes coûte la
journée. La maquette a payé trois fois.

### 34c. Ce qui a été refusé, et pourquoi

Nico a ensuite fourni une spécification générique de « module de pilotage pro » (issue d'un autre
assistant). Tri fait **par grep sur le code**, pas sur l'impression : **11 points déjà présents**
(mode sombre, plein soleil, météo AROME, comparaison N-1, le Mur, flotte, DRE, ZNT, export CSV,
notifications, mémoïsation), **5 déjà couverts par la maquette**, et **4 refusés** :

- **Widgets déplaçables/redimensionnables** → c'est « Choisir les indicateurs » en pire.
  ★★ **Un tableau de bord qui doit être configuré pour devenir lisible a une disposition fausse.**
  Et en bout de rang, personne ne redimensionne un widget.
- **Glisser-déposer pour assigner** → retiré volontairement de l'ordre de passage (cassé, et il
  obligeait à tenir le doigt en faisant défiler 45 lignes). **Ne pas le réintroduire.**
- **Filtre par appellation/climat** → le champ **n'existe pas**. Le créer = de la saisie en plus à
  chaque installation. `p.commune` et les secteurs couvrent le besoin.
- **Alertes SMS/e-mail à seuils réglables** → un moteur de règles est un module entier, et chaque
  alerte de trop tue les autres.

⚠️ **L'état sanitaire (risque mildiou/oïdium) reste HORS PÉRIMÈTRE.** « Mildiou » n'existe que comme
**cible** dans le catalogue E-Phy ; il n'y a **aucun modèle de risque**. En faire un vrai suppose les
stades phénologiques par parcelle (saisie neuve), la météo horaire avec humectation, et un modèle
épidémio validé. **Un modèle faux serait pire que rien.** Proposition en attente : afficher la
**pression météo** sans prétendre au risque maladie.

### 34d. Les six lots

Tous en **`pilotage.js` seul**, donc **sans bump**, sauf les lots 5 et 6.

**Lot 1 — le socle graphique.** `_PIL_SEM` (7 sens) + `_pilPolyBreak`. **Deux bugs réels** :
(a) la ligne d'effectif **traversait les trous** en ligne droite — elle affirmait un effectif là où
rien n'avait été mesuré ; (b) `col.alerte` portait **deux sens dans la même image** (renfort à
trouver **et** trait du jour). Harnais : 17 assertions.

**Lot 2 — la portée unique et les quatre photos.** `_PIL_SCOPE`, fil d'Ariane, photos, drapeaux.
⚠️ **Trois signatures supposées et fausses**, trouvées en allant lire : `_pecData()` rend le total
sous `tot` (pas `T`) · `_mvExerciceLabel` n'existe pas · `_pilSetTab` non plus. Harnais : 29.

**Lot 3 — l'axe de zoom.** Réordonnancement, numéros, filet, nouvel onglet `an`, `_pilPanelEtp`
déménagé (**un seul appel dans tout le fichier**, vérifié). ★ `_PIL_SHOW_MIGR` reporte `avc_etp` →
`an_frise` **sur les deux sources d'état** : sans ça, un client ayant décoché « Charge & ETP »
serait arrivé sur un niveau vide avec la case pour le rallumer dans un autre onglet. Harnais : 38.

**Lot 4 — le moteur de diagnostic.** `_pilDiag()` + `_pilGo()`. ⚠️ **Une supposition fausse
rattrapée** : le test portait sur `CONFIG.ecartRang`, un champ inexistant — les écartements vivent
dans `CONFIG.vigne.{ec_rang, ec_pied}`. **Le constat ne se serait jamais déclenché.**
★★ **Un test qui ne peut pas rougir est pire qu'aucun test : il rassure.** Harnais : 39.

**Lot 5 — l'accompagnement et le bump** (APP 6.00 · SW 6.50). `MV_AIDE.pilotage` reprise, guide
`11-pilotage.html` + régénération, **5 items WHATS_NEW**, les 4 emplacements d'`index.html`, les
5 du SW. ★ **`_mvAideOngletsPil` lit `_PIL_TABS` à l'exécution** : la liste s'était mise à jour
toute seule, seules les lignes en dur mentaient.

**Lot 6 — LA CORRECTION DE FOND** (APP 6.01 · SW 6.51). Voir 34f.

### 34e. ★★★ LE PREFLIGHT A ATTRAPÉ CE QUE JE N'AVAIS PAS VU

Le lot 2 a été livré **sans avoir lancé `scripts/preflight.mjs`**. La CI a rendu :
**3 `catch(e){}` muets** (19 contre 16 en référence) et **un `<div>` dans un `<button>`** (§24).

⚠️⚠️ **La cause : mon contrôle maison comptait `catch{` alors que le code écrit `catch(e){}`.
Je mesurais autre chose que ce que mesure le filet.** Un cliquet qui ne compte pas la même chose
que le filet ne protège de rien.

★★ **Et la suite compte plus que la faute.** J'ai voulu redoubler ces deux contrôles dans mon
harnais. La version `catch` passait ; celle du `<div>` a signalé un **faux positif** — mon
expression régulière lisait du JS **sans voir les bornes de chaîne**. J'ai **retiré la section
entière** : le preflight fait ce contrôle correctement, en écrire une seconde version approximative
aurait créé **deux sources pour une question**.

> **RÈGLE, écrite dans les harnais eux-mêmes :**
> `node scripts/preflight.mjs && node mv-harnais-<lot>.mjs src/pilotage.js`
> Le preflight vérifie la **mécanique**. Les harnais vérifient le **sens** — ce que le preflight ne
> peut pas voir. **On ne duplique pas l'un dans l'autre.**

### 34f. ★★★ LOT 6 — UN EXERCICE COMPTABLE EST UNE DONNÉE, PAS UN RÉGLAGE

**Le retour de Nico**, textuel : *« je ne comprends toujours pas pourquoi je réglerais l'ouverture
de l'exercice au 1er octobre. je cherche à savoir ce que me coûte une année fiscale de bilan à
bilan. c'est à toi d'organiser les vues pour que l'utilisateur comprenne bien ce qu'il voit et qu'il
y a une différence entre le coût de la campagne et le coût de l'année fiscale. »*

**Il avait raison.** L'écran issu de §33 déclarait l'exercice « **mal aligné** » en orange —
c'est-à-dire *« votre chiffre est faux, corrigez »* — et allait jusqu'à « **aucune lecture annuelle
n'est fiable tant que c'est le cas** ». Il proposait un bouton pour déplacer la clôture.

⚠️⚠️⚠️ **C'était un mauvais conseil.** Un exercice comptable est fixé par le comptable, parfois par
le statut. **On ne le déplace pas pour qu'un graphique tombe mieux.** L'écran confondait **une
DONNÉE** (le calendrier du bilan) avec **un RÉGLAGE d'affichage**.

**La vraie panne était ailleurs : UN SEUL CADRE POUR DEUX QUESTIONS.**

| | répond à | fixé par |
|---|---|---|
| **Exercice comptable** | « ce que m'a coûté l'**année fiscale** » | le comptable — c'est une donnée |
| **Année vigne** | « ce que m'a coûté un **cycle de production** » | la biologie : après vendange N → fin vendange N+1 |
| **Campagne** | « ce que coûte **ce chantier** » | les périodes du domaine |

**Les trois sont justes. Ils ne donnent pas le même nombre, et c'est NORMAL.** Le rôle de l'écran
est de les **nommer** et de dire ce que chacun répond — **pas d'en déclarer un cassé.**

**Ce qui a été livré :**
- ★ `_pilDeuxCadresHtml` ouvre le niveau ① : les deux cadres côte à côte, le détail campagne par
  campagne avec les étiquettes « **à cheval** » et « **hors exercice** », et l'explication écrite de
  **pourquoi les deux totaux diffèrent**.
- ★ Le coût de l'exercice **vient de `_pecData()`**, qui cadre déjà sur l'exercice comptable.
  ⚠️ **Aucun second calcul** : un second calcul donnerait un second chiffre.
- ★★ **L'alerte orange a disparu.** Une vendange qui « ouvre » l'année n'est **pas un défaut**.
  Il ne reste que le fait utile : quand la borne **traverse** la vendange, `_pilAnnSplitVend` dit
  combien de jours tombent de chaque côté — **en jours comptés exactement, pas en euros proratés**.
  ⚠️ **Une fausse précision sur un chiffre comptable est pire qu'un ordre de grandeur annoncé comme
  tel.** Gravité ramenée de `'o'` à `'b'` : le chiffre est juste, on aide seulement à le lire.
- ★ Le bouton de décalage subsiste, mais **proposé** (« si votre comptable accepte »), plus prescrit.
- ★ Fil d'Ariane et photo Budget **nomment le cadre** : « exercice comptable ».

### 34g. ★★★ LES COMMENTAIRES NE SONT PAS UNE PREUVE

**Trois fois dans la même séance**, une assertion de harnais est passée au **vert** parce que le
**commentaire qui documentait la correction citait le texte corrigé**. Exemples vécus :
`!/n'est fiable tant que/.test(SRC)` — vrai dans le code, faux dans le commentaire d'explication ;
`/Exercice comptable/.test(corps('_pilCrumbHtml'))` — satisfait par le commentaire « *« Exercice
comptable », pas « Exercice »* ».

★★★ **Un harnais qui lit ce qu'on raconte au sujet du code ne teste pas le code.**
**Correctif à la racine** : `corps()` retire les commentaires (`.replace(/^\s*\/\/.*$/gm,'')`)
**pour toutes les assertions**, une bonne fois.

★★ **Autres assertions fausses de la séance, toutes du même genre** — un motif trop naïf sur du JS :
`[^)]*?` qui s'arrête au premier `)` alors que les arguments contiennent des appels · un découpage
d'arguments qui compte les virgules **dans une chaîne** (`'main-d'œuvre, carburant'`) et **saute un
site en silence**, faisant passer l'assertion au vert **en ne mesurant que 5 sites sur 6** ·
`_pilPanelEtp(d)` compté 2 fois parce que la **définition** ressemble à un appel (fait **deux fois**).

> **Quand une assertion rouge tombe, la première question est : lequel des deux a tort,
> l'assertion ou le code ?** Sur cette séance : **6 assertions fausses pour 0 bug**. Toutes
> corrigées, aucune contournée, chacune commentée avec la raison.
>
> **Et son symétrique, plus dangereux :** une assertion **verte** peut être une panne de lecture.
> ★ D'où l'assertion de garde : **compter les sites lus** (« les six appels sont lus, aucun sauté en
> silence »). Un constat d'absence doit être confirmé en variant la méthode (§ règles d'or).

### 34h. Ce que couvre la contre-épreuve

**143 assertions** vertes réparties en 4 harnais (`mv-harnais-frise` 17 · `mv-harnais-portee` 29 ·
`mv-harnais-niveaux` 38 · `mv-harnais-diag` 59). **Chaque lot a subi sa contre-épreuve** :
défauts réintroduits **un par un**, harnais qui doit rougir, référence qui doit rester verte —
**3 + 5 + 6 + 7 + 6 = 27 défauts rejoués**.

⚠️ **Deux contre-épreuves étaient elles-mêmes fausses** et ont été refaites : l'une neutralisait une
branche `else if` qui gardait la couverture ; l'autre coupait trop large et emportait la fin de la
fonction. **Vérifier que le défaut a bien été injecté avant de conclure que le harnais est aveugle.**

### 34i. Reste à faire sur le Pilotage

1. ★★ **Les filtres cépage / commune** — la maquette v3 les démontre et ils changent **réellement**
   les chiffres (Chardonnay : 6 930 h → 1 549 h). ⚠️ **Non livrés volontairement** : ils exigent que
   le calcul de charge descende à la parcelle. **Un filtre qui change la liste sans changer les
   chiffres est un décor** — exactement la faute reprochée au module.
   ★ Les données existent : `p.cepages[]` (jusqu'à 3, complantation gérée) et `p.commune{nom,lat,lng}`.
   ⚠️ Une parcelle complantée compte dans **chacun** de ses cépages : la somme des surfaces dépasse
   celle du domaine. **C'est voulu — une parcelle ne se coupe pas en deux.**
2. ★ **Déplacer `_PIL_SEM` dans `utils.js`** au prochain lot qui bumpe.
3. ★ **La carte du domaine colorée par avancement** (maquette v3, niveau ②) — les parcelles exclues
   par un filtre y sont **grisées, pas retirées** : un domaine qui perd 20 parcelles sans le dire
   est illisible. ⚠️ Les couleurs disent l'**avancement**, jamais un état sanitaire.
4. ★ Purger les palettes désormais mortes et les `pil-empty` restants.

## 35. ★★★ LES CINQ RETOURS DU 12/08 (soir — APP v6.04 · SW v6.54)

Cinq remarques de Nico après une séance d'usage réel sur le Pilotage refondu (§34). **Quatre sur
cinq étaient des bugs**, dont deux constats de diagnostic qui **accusaient les données du domaine
d'une faute que le code commettait lui-même**.

### 35a. Ce qu'il a dit, ce qu'il y avait dessous

| Le retour, mot pour mot | La cause, mesurée sur le code |
|---|---|
| *« où va le temps de l'équipe et le graphe du dessous n'ont rien à faire dans l'année mais ils doivent être dans la campagne »* | `_pilPanelEtp` empilait **quatre blocs de campagne** dans le niveau ①, et s'en excusait par un bandeau |
| *« le chevauchement… nous avons convenu que c'est normal… on compte les tâches et non les périodes »* | Le constat annonçait « les jours communs sont **comptés deux fois** ». **Faux** |
| *« dans simuler ça ne prend pas en compte les effectifs inscrits au contrat »* | `_rfCtx` lisait **toujours** `headPerm` — collectifs exclus |
| *« les 2 graph sont exactement les mêmes donc incompréhensibles »* | `deux` se décidait sur `nSkip>0`, pas sur le contenu |
| *« la tâche inscrite sans barème, a bien un barème d'inscrit »* | Le test portait sur `t.h_ha`, **un champ qui n'existe sur aucune tâche** |

### 35b. ★★★ UN BANDEAU QUI EXPLIQUE POURQUOI UN BLOC EST AU MAUVAIS ENDROIT NE LE DÉPLACE PAS

Le lot 3 de §34 avait fait monter « Charge & ETP » vers le niveau ① — juste pour la frise des
52 semaines, **faux pour les quatre blocs qui la suivaient** (répartition du temps, frise
prévu/réel, courbe par semaine, écart). Le §34 lui-même l'avait senti et avait ajouté `noteCadre` :
*« les blocs ci-dessous détaillent la campagne X »*.

★★ **Une note qui documente une mauvaise place est un aveu, pas une correction.** Elle a survécu
un jour. Scission : `_pilPanelEtp` (niveau ① : frise annuelle + pic) / **`_pilPanelTemps`**
(niveau ② : les quatre blocs, clé `avc_temps`, tuile `temps`). Le bandeau a disparu **avec** eux —
le titre nomme la campagne, il n'y a plus rien à excuser.

★ **Chip « Année » retirée** : elle vidait le panneau qui la contenait. *Une case à cocher qui vide
son propre panneau n'est pas un réglage, c'est une trappe.* Clé `etp_annee` purgée des défauts —
pas de réglage mort.

### 35c. ★★★ DEUX CONSTATS QUI ACCUSAIENT LE DOMAINE D'UNE FAUTE DU CODE

**Le chevauchement.** Vérifié en deux lectures : `_chargeSaisonData` (planning.js) calcule la charge
d'une période sur les tâches de **sa** liste (`s.taches`), **jamais sur ses jours**. Deux périodes
qui partagent des dates ne partagent **aucune heure**. Le constat orange — « le chiffre sort, mais
faux » — poussait donc à **redécouper des périodes justes pour faire taire une alerte fausse**.
Retiré de `_pilDiag`, bannière rouge → note grise sous la frise. ⚠️ **Ne pas le réintroduire sans
avoir d'abord mesuré un double comptage réel.**

**Le barème.** `sansBar` filtrait sur `parseFloat(t.h_ha)`. **`h_ha` n'existe sur aucune tâche** :
il ne vit que sur `TRAVAUX[]` (table calculée) et sur les activités tracteur (`a.h_ha`). Le champ
d'une tâche est **`t.hha`**. Le test rendait donc `undefined` **pour tout le monde** — 100 % des
tâches de la période consultée étaient déclarées « sans barème ». Sur une période à une seule tâche,
ça sort « 1 tâche sans barème » : **plausible, et faux**. Nouveau `_pilTacheHha`, qui lit `t.hha`
et comprend niveaux (somme), passages (`passagesHha[]`) et tarière (pas de h/ha à réclamer).

> ★★★ **C'EST LA TROISIÈME FOIS EN DEUX JOURS.** `CONFIG.ecartRang` (§34d), puis trois signatures
> supposées (§34d lot 2), maintenant `t.h_ha`. **Un champ jamais grepé contre le code qui l'écrit
> est une supposition, pas une lecture.** Et les deux constats faux partageaient le même symptôme :
> ils étaient **plausibles**, donc personne ne les a vérifiés.

### 35d. ★★★ « DÉJÀ ENGAGÉ » N'EST PAS « PERMANENT »

`_rfCtx` lisait toujours `headPerm` — l'effectif permanent, **équipes collectives exclues**.
L'intention de planning.js était explicite et raisonnable : *« on ne raisonne pas un recrutement sur
des vendangeurs »*. **Elle devient fausse dès que l'embauche est FAITE.** 34 vendangeurs déjà sous
contrat du 17 août au 3 septembre n'existaient pas pour le simulateur, qui réclamait « 34 personnes
de renfort à poser » pour une équipe déjà recrutée — **pendant que la frise annuelle, qui lit `head`,
montrait la vendange couverte.** Le même module disait deux choses : la faute exacte de §33 et §34.

★★★ **Ce qui sépare le socle du renfort n'est pas « permanent / saisonnier », c'est « DÉJÀ ENGAGÉ /
ENCORE À DÉCIDER ». Un contrat signé ne se décide plus. Il se subit — et il se compte.**

`_RF_SEL.base` : `'eng'` par défaut (`head`/`capH`/`capPay`), `'perm'` au sélecteur « On part de »
— l'autre question, celle qui sert à **préparer la campagne suivante**. ⚠️ Le champ se traite
**AVANT** le `parseInt` de `window._rfSel` : `'eng'` n'est pas un nombre, le garde `isFinite`
l'avalait en silence. ★ `ctx.baseLbl`/`baseCourt` = **source unique du mot**, lue par les quatre
écrans (graphe, tableau, sélecteur, corps) — six libellés à la main auraient divergé à la première
retouche.

### 35e. ★★ DEUX IMAGES IDENTIQUES SOUS DEUX TITRES DIFFÉRENTS

`deux = ctx.nSkip>0 || …` : dès que la campagne avait commencé, l'écran dessinait **deux fois le
même profil** — mêmes colonnes, même ligne d'effectif ; seuls le voile gris et la légende de l'axe
changeaient. **Le lecteur cherche une différence qui n'existe pas.**

`_rfMemeImage(P,R)` compare ce que l'œil verra : ① du travail a-t-il été fait, ② les semaines
écartées portaient-elles du travail, ③ une fenêtre a-t-elle bougé. Le tri se fait **dans `_rfPair`**
— un seul juge : quand l'image est la même, la paire rend **deux fois le plan** (son sélecteur
couvre toute la campagne) et pose `meme`, que `_rfBody` lit pour **dire pourquoi** il n'y a qu'un
graphe. ⚠️ **Honnêteté sur ce que mesurent ces tests** : ① et ② sont des **sorties anticipées** que
③ attraperait déjà sur les données d'aujourd'hui — elles sont donc éprouvées sur le **contrat** de
la fonction, faute de quoi les retirer ne rougirait nulle part.

### 35f. La contre-épreuve, et les cinq assertions fausses qu'elle a trouvées

**63 assertions vertes**, **14 défauts rejoués, tous rouges** (`mv-harnais-retours.mjs`). La
première passe en a rendu **5 problématiques — 5 assertions fausses, 0 bug** :

| Symptôme | Lequel des deux avait tort |
|---|---|
| « un seul appel à `_pilPanelTemps` » rouge | **l'assertion** : la **définition** ressemble à un appel (§34g, 3ᵉ fois) |
| renommer `pil-g-frise` restait vert | **l'assertion** : `includes()` sur un **préfixe** — `pil-g-friseX` contient `pil-g-frise` |
| réinjecter le constat de chevauchement restait vert | **l'assertion** : motif trop étroit. Remplacé par `!/chevauch/i` |
| injection du barème impossible | **la contre-épreuve** : la chaîne réelle porte `t && ` devant |
| retirer les gardes ① et ② de `_rfMemeImage` restait vert | **les cas de test** : ils étaient déjà attrapés par la garde ③ |

★★ **Deux leçons.** Une assertion **verte** peut être une panne de lecture — c'est le cas 2, et
c'est le plus dangereux. Et **une contre-épreuve qui n'injecte rien ne prouve rien** : le harnais
vérifie que le défaut est bien entré avant de conclure quoi que ce soit (§34h, déjà vécu).

### 35g. Accompagnement — dans le même lot

`MV_AIDE.pilotage` : 2 lignes neuves (« La campagne », « Deux périodes qui se chevauchent »),
« Simuler » réécrit. `guide/11-pilotage.html` : 3 blocs, régénéré. **5 items WHATS_NEW** en tête,
écrits du point de vue de l'utilisateur (le symptôme vécu, pas la cause technique).

⚠️ **`utils.js` touché → BUMP** : APP 6.03 → **6.04** (4 emplacements d'`index.html`), SW 6.53 →
**6.54** (en-tête + `CACHE_NAME` + 2 `console.log` + changelog prepend).

### 35h. Reste à faire

1. Les points 1 à 4 de §34i restent ouverts (filtres cépage/commune, `_PIL_SEM` → `utils.js`,
   carte colorée par avancement, purge des palettes mortes).
2. ★ **Vérifier sur les données réelles** que `_rfMemeImage` ne masque pas un cas utile : la
   pertinence se juge à l'usage, pas au harnais.
3. ★ Le sélecteur « On part de » n'est **pas mémorisé** entre deux ouvertures — volontaire pour
   l'instant (le défaut doit rester « ce qu'on sait »), à revoir si Nico le repose souvent.

---

## 36. ★★★ LE SALAIRE EST UNE SÉRIE DATÉE (12/08 nuit — APP 6.06 · SW 6.56)

> *« Il faut vraiment mettre en place un système dans réglages pour les salaires puisque les
> salariés sont voués à avoir des évolutions de salaire et il ne faut pas qu'un salaire changé
> aujourd'hui change la mémoire d'un salaire qu'il a eu hier, surtout par rapport aux calculs de
> coûts d'exercice. »* — Nico, 12/08

### 36a. Le diagnostic — ce n'était pas un manque, c'était un piège déjà armé

Mesuré sur le code cloné, pas sur l'impression :

`PAIE.taux_hist[nom] = [{d, de, a}]` **existait**. Il était **écrit à chaque changement** par
`_mvPaieSetTaux`. Et :

- il était lu par **une seule fonction**, `_paieHistTxt`, qui en rendait **une phrase** sous le
  champ de la fiche ;
- **aucun calcul ne le lisait** ;
- son `d` était la date du **clic** (`new Date()`), pas la date d'**effet** ;
- `_mvPaieCount` le déclarait *« un dérivé : il ne compte pas »* → **le garde anti-perte l'ignorait**.
  Une écriture qui l'aurait vidé ne déclenchait rien.

Pendant ce temps, les **trois** moteurs de coût appelaient tous `_mvPaieTauxEff(m)` — un scalaire,
**sans date** :

| Lieu | Ce qui était revalorisé rétroactivement |
|---|---|
| `_pexData` (exercice comptable) | `heures payées × taux` mois par mois → **un exercice CLOS changeait de total** |
| `_ecoJhByParc` (coût par parcelle) | la journée-personne de mars payée au taux d'août |
| `_ecoTracHByParc._tauxCond` | idem, **alors que `se.date` était déjà dans le scope** |
| `_ecoRate` (moyenne, budget de saison) | le budget d'une campagne archivée bougeait tout seul |

★★★ **La fiche affichait « Dernier changement : 12,10 → 13,50 €/h le 12/08 » pendant que le total de
l'exercice bougeait en silence.** Voir le corollaire posé en §30i : *une trace affichée n'est pas une
trace lue.* Même famille que l'IDCC affiché mais non écrit (§18b) et que les commentaires pris pour
des preuves (§34g).

### 36b. Les quatre points tranchés par Nico AVANT toute ligne de code

1. **Deux gestes distincts** sur la fiche (augmentation / correction) — **ok**.
2. **`taux_hist` est importé** : *« on part du principe où les salaires indiqués sont ok jusqu'à leur
   date de modification inscrite »* → **`de` vaut JUSQU'À `d`, `a` vaut À PARTIR DE `d`**.
3. **`_ecoRate` se résout au début de la période consultée** — **confirmé**.
4. **L'exercice affiche la suite des taux** — **oui**.

### 36c. Le modèle — calqué sur l'historique des contrats (§33 lot 2)

```
taux_serie[nom] = [{d:'YYYY-MM-DD', v:12.10}, …]   croissante — SOURCE DE VÉRITÉ
taux[nom]       = MIROIR du taux EN VIGUEUR AUJOURD'HUI
```

⚠️⚠️ **Le miroir n'est PAS la dernière ligne, c'est `_paieResolve(S, aujourd'hui)`.** Une
augmentation datée du mois prochain ne doit pas se présenter comme le taux actuel dans la fiche ni
dans le compteur de la carte Économie. C'est testé (harnais §5).

Le miroir est conservé **parce que trois lecteurs indépendants s'en servent** : le champ de la fiche,
le compteur « n / N renseignés » de la carte Économie, et `_mvPaieCount`. Le supprimer aurait
transformé un lot de modèle en refonte de trois écrans.

**★★★ MIGRATION À ZÉRO ÉCRITURE.** Série absente → elle est **dérivée à la lecture** depuis `taux` +
`taux_hist`. Conséquences, toutes voulues :

- un domaine **sans aucun historique** dérive `[{depuis toujours, taux courant}]` → **comportement
  actuel à l'identique**, ligne pour ligne ;
- **rien n'est écrit tant que personne n'ouvre la fiche** — pas de migration à lancer, pas d'ordre
  functions → backfill → hosting à respecter, pas de fenêtre pendant laquelle la base est à moitié
  convertie ;
- la série n'est **matérialisée qu'au premier enregistrement**.

★ **La borne basse est `'0000-01-01'`** — « depuis toujours ». Elle rend l'extrapolation vers
l'arrière **explicite dans la donnée** au lieu d'être une règle cachée dans le lecteur.

**Cache** : `_pSerCache` mémoïse par nom, clé sur la **référence de l'objet `window.PAIE`**.
`applyFbData` remplace l'objet au pull (`window[key.toUpperCase()] = value`) → invalidation gratuite.
`_paieSave` le vide explicitement, parce qu'il **mute en place** et ne changerait pas la référence.

**Divergence miroir / fin d'historique** (import, console, ancienne version) : on **n'écrit pas le
passé pour le faire coller**. On ajoute ce qu'on sait, à la seule date qu'on puisse honnêtement lui
donner — **aujourd'hui**.

### 36d. ★★★ TROIS GESTES, UN SEUL FABRIQUE UNE PÉRIODE

| Geste | Effet |
|---|---|
| valeur changée **+ date d'effet** | **AUGMENTATION** — une ligne de plus |
| valeur changée, **date VIDÉE** | **CORRECTION** — la dernière ligne réécrite sur place |
| **lignes retirées à l'écran** | relecture DOM, elles ont disparu |

★★★ **Le champ de date est PRÉ-REMPLI à aujourd'hui.** Le geste par défaut est le geste sûr ; il faut
**vider le champ à la main** pour écraser une ligne existante. **Le défaut protège, la destruction se
demande.** Sans ce pré-remplissage, l'oubli de la date aurait reproduit exactement le bug qu'on
corrigeait — et silencieusement.

⚠️⚠️ **LE CHAMP VIDE NE SUPPRIME PLUS RIEN.** Pour retirer un taux, on retire ses **lignes**, qui
sont visibles. *Un champ de saisie ne doit pas pouvoir détruire un historique* — c'est mot pour mot
la leçon de §33 lot 2, où la resignature d'un contrat effaçait le précédent.

**Idiome de la liste** : identique aux contrats précédents — chaque ligne porte ses valeurs en
attributs `data-*`, le `×` la retire du **DOM**, et `saveEditMembre` **relit la liste**. Pas d'état
global, pas d'écriture immédiate, et un membre en cours d'édition ne survit pas à une fermeture.
★ Chez un non-admin la liste n'existe pas → `rows` reste `null` → **la série en base est intacte**.

Les deux gestes se **disent** : toast « Augmentation enregistrée — le taux précédent reste sur les
heures déjà travaillées » ou « Taux corrigé sur place — aucune augmentation créée ».

### 36e. Les quatre lecteurs, et la date que chacun avait déjà sous la main

Le point remarquable du lot : **aucun des quatre n'a eu besoin qu'on lui fabrique une date.**

- `_ecoJhByParc` → `dt`, la date du journal, était la variable de boucle ;
- `_ecoTracHByParc._tauxCond` → `se.date`, à trois lignes de l'appel ;
- `_ecoRate` → `_d0R`, le début de la période consultée, déjà calculé ;
- `_pexData` → `mo.d0`, le début du mois.

⚠️ **`_ecoRate` reste une moyenne** — le coût MO d'une parcelle est un **budget de saison**, on ne
sait pas qui fera quelle parcelle (§20b). Ce qui change, c'est la **date à laquelle** on la résout.

**★★★ L'exercice COUPE LE MOIS.** `_pexSegsTaux(nom, d0, d1)` rend les sous-fenêtres sur lesquelles
le taux est **constant** ; `_planPaidRange` est appelé sur chacune. Une augmentation au 15 mars ne
revalorise pas les quinze premiers jours.
⚠️ **Résoudre au mois entier aurait suffi à 95 %, et menti sur les 5 % restants avec l'autorité d'un
total.** Chemin nominal préservé : aucun changement dans le mois → **une seule fenêtre, identique au
mois**, zéro coût.

La colonne « Taux chargé » affiche alors **« 12,10 puis 13,50 »**. ★ Afficher la seule moyenne
pondérée aurait rendu **une valeur que personne n'a jamais signée sur un contrat**.

★★ **Effet de bord vertueux** : `nSansTaux` / `hSansTaux` ne comptent plus l'exercice entier d'une
personne dès qu'elle n'a pas de taux, mais **les seules heures réellement non valorisées**. Quelqu'un
dont le taux ne commence qu'en cours d'exercice n'est plus signalé comme un trou complet.

### 36f. Le harnais — 51 assertions, contre-épreuve comprise

`scripts/mv-harnais-salaires.mjs`. Fonctions **extraites du fichier réel, triées par leur position**
(`str.index` avant découpe), exécutées dans un `vm` à `window` stubbé.

Le test qui compte est le **8** : il **reproduit le bug d'origine** avant de vérifier la correction —
masse figée à 2 400 € sur février-mars, augmentation d'août appliquée, **la masse ne bouge pas**.
Puis une augmentation rétroactive au 16 mars, et la majoration tombe **exactement** sur 16 jours.

**Contre-épreuve — quatre défauts réintroduits, quatre détectés** : taux ignorant la date, correction
fabriquant une période, segment qui ne s'arrête pas la veille, champ vide destructeur.

★★★ **UNE ASSERTION EST TOMBÉE ROUGE, ET C'ÉTAIT ELLE QUI AVAIT TORT.** Elle attendait que le miroir
passe à 13,60 après une augmentation datée du **17/08**, saisie le **12/08**. Or la date n'est pas
arrivée : le miroir **doit** rester à 12,10. La règle de §25 a joué — *quand une assertion échoue,
demander d'abord laquelle des deux est fausse* — et le test a été corrigé, pas le code.
⚠️ **Corollaire de rédaction** : un harnais qui mélange des dates passées et futures **par accident**
teste le calendrier au lieu du modèle. Les cas « futur » ont été isolés dans leur propre bloc.

⚠️ **Piège Python revécu** : le patch du harnais a échoué en silence parce qu'il mélangeait des
caractères Unicode **littéraux** (`⚠`, `—`, tapés directement) et des **séquences `\u2019`** dans une
chaîne Python normale, qui les convertissait. `r"""…"""` obligatoire, et les littéraux se tapent
littéralement. **Deuxième fois que ce piège coûte un aller-retour.**

### 36g. Ce que le preflight a attrapé

**C14** : `catch {} vide : 3 contre 2 en référence`. J'en avais introduit deux (un `try/catch` de
confort dans `_paieAuj`, un autour des toasts) et **retiré un sans le voir** — celui de
`_paieHistTxt`, parti avec la fonction.

Corrigés autrement plutôt que garnis : `_paieAuj` **n'a plus de `try/catch` du tout** (un test de
type suffit, et la valeur rendue est **vérifiée** au lieu d'être supposée) ; le toast **trace**.
Résultat **1 contre 2** → **diminution réelle → baseline REGRAVÉE** (`--baseline`), sinon le prochain
lot hérite d'un avertissement permanent, et *un avertissement qu'on apprend à ignorer est un cliquet
mort*.

### 36h. Accompagnement — dans le même lot (C22, §27a)

**4 items WHATS_NEW** en tête, écrits du **symptôme vécu** : « Augmenter quelqu'un rechiffrait tout
son passé », pas « la résolution du taux est devenue datée ». Fiche `MV_AIDE.reglages` : une ligne
neuve. `guide/12-reglages.html` régénéré.

★★★ **Le guide PROMETTAIT DÉJÀ ce qui n'existait pas** : *« Taux horaire de chaque salarié, avec
historique des évolutions »*. La phrase était **vraie à l'écran et fausse dans les chiffres** —
l'historique existait bel et bien, il n'entrait simplement dans aucun calcul. C'est le même défaut
que le code, écrit en français : **un document d'accompagnement peut mentir en disant la vérité.**

### 36i. Fichiers, versions, état

`src/reglages.js` (modèle + UI + écriture) · `src/pilotage.js` (4 lecteurs + affichage) ·
`src/firebase.js` (garde) · `src/utils.js` (`APP_VERSION` + WHATS_NEW + `MV_AIDE`) ·
`index.html` (4 emplacements) · `public/sw.js` · `guide/12-reglages.html` + `public/guide.html`
régénéré · `scripts/preflight-baseline.json` regravée · `scripts/mv-harnais-salaires.mjs`.

**`utils.js` touché → BUMP : APP 6.05 → 6.06, SW 6.55 → 6.56.** Preflight **0/0**, harnais **51/0**.
⚠️ **Non déployé** — voir backlog 0a, dont c'est le quatrième lot en attente.

### 36j. Ce que ce chantier a ouvert et n'a pas fermé

1. **`taux_serie` est clé par NOM** (backlog 0g). Renommer un salarié détache son historique de
   salaire. Faiblesse partagée par tout le modèle, mais **ici elle chiffre des euros dans un exercice
   comptable**. ⚠️ **Ne pas la rattraper localement dans `paie`** : ça donnerait un identifiant stable
   à un seul endroit et une fausse sécurité partout ailleurs.
2. **Les augmentations passées non enregistrées n'existent nulle part.** À la première ouverture, tout
   le monde démarre sur `[{depuis toujours, taux actuel}]` : la **première augmentation saisie sera la
   première vraie coupure**. Comme le CDD de Victor, ce qui n'a jamais été écrit n'est pas caché — il
   est perdu, et se ressaisit à la main (ancien taux + sa date, puis l'actuel ; l'ordre n'importe pas,
   la série se trie).
3. **Le taux reste un coût employeur unique par personne.** Pas de distinction brut/chargé, pas de
   majoration d'heures supplémentaires dans le coût. La définition unique de §20b tient, et
   `coef_charges` **reste banni**.
---

## 37. ★★★ LE CHANTIER CONTRATS (13/08 — APP 6.08 → 6.11 · SW 6.58 → 6.61)

> ⚠️ **Section rédigée depuis les changelogs de `sw.js`, pas depuis la session de travail.** Le
> détail fait foi dans `public/sw.js` (blocs v6.58 à v6.61). Elle existe parce qu'un chantier non
> consigné ici est un chantier qu'une session suivante **écrase sans le savoir** — c'est exactement
> ce qui s'est produit le soir même (§38).

### 37a. Le trou — quatre mémoires parallèles

La vie contractuelle d'un salarié vivait à **quatre endroits qui ne se parlaient pas** :

| Où | Quoi | Daté ? | Lu ? |
|---|---|---|---|
| `debut_contrat` / `fin_contrat` | le contrat en cours | oui | oui |
| `m.contrats[]` | les contrats précédents | oui | **non, avant 6.58** |
| `renouvellement_date` / `_fin` | une alerte | oui | **`_fin` n'était lu NULLE PART** |
| `PAIE.taux_serie` | le salaire | oui | oui (§36) |

**Deux sur quatre étaient datées ET lues.** Conséquences mesurées : un contrat archivé ne pesait rien
dans les compteurs, prolonger un contrat **écrasait l'ancienne date sans un mot**, et remplir le champ
facultatif « date de renouvellement » **éteignait l'alerte de fin de contrat** — annoncer un
renouvellement pour janvier faisait taire l'application sur un CDD qui se terminait en août.

### 37b. `m.hist[]` devient la source (v6.59)

Trois événements, tous producteurs : `embauche {d,type,fin?}` · `renouvellement {d,fin}` · `fin {d}`.

- **Migration à zéro écriture** : journal absent → dérivé **à la lecture** depuis `contrats[]` + le
  couple. Un domaine qui n'ouvre aucune fiche calcule exactement comme avant.
- **Les anciens champs deviennent des miroirs**, réécrits par `_mvHistMirror()` à l'enregistrement :
  les ~40 points de lecture (paie, 1607 h, congés, MSA, Pilotage) n'ont pas bougé d'une ligne.
  ★ Même patron que `taux[nom]` rétrogradé en miroir de `taux_serie[nom]` (§36).
- ⚠️ **Le modèle reste en DEUX morceaux** : `membres` est lisible par toute l'équipe, `paie` est
  admin-only (`firestore.rules:201-202`). Les contrats vont dans `membres`, les salaires restent dans
  `paie`, **fusion à la lecture**.
- ⚠️⚠️ **Propriété centrale, vérifiée sur 10 formes de fiche : DÉRIVER PUIS REMIROITER EST
  L'IDENTITÉ.** Sans elle, le premier enregistrement d'une fiche réécrirait ses dates en silence. Le
  harnais l'a fait échouer **deux fois** : un contrat archivé **sans type** se voyait inventer un
  `'CDI'` — *un saisonnier serait devenu permanent*. Un type inconnu reste désormais inconnu.
- ★ **Garde anti-perte** : `membres` est un TABLEAU, donc `_mvDocSize` rendait le **nombre de fiches**.
  Vider le journal des huit salariés passait sans un bruit (8 → 8). `_mvMembresCount` compte fiches
  **et** événements.

### 37c. Les fonctions à connaître (utils.js)

| Fonction | Ce qu'elle rend | Piège |
|---|---|---|
| `_mvHist(m)` | le journal normalisé et trié | tri **stable** : deux événements du même jour gardent l'ordre de saisie |
| `_mvPeriodes(m)` | périodes **NON fusionnées**, chacune **avec son type** | c'est ce qu'il faut pour **lister** des contrats |
| `_mvContrats(m)` | périodes **FUSIONNÉES** (contigus = un seul) | bon pour « était-il là ce jour-là », **faux pour lister** |
| `_mvSalarieAt(m, iso)` | « qu'était-il ce jour-là ? » | ne joint **pas** le taux (collection `paie`, admin-only) |
| `_mvAnnualise(m)` | annualisé ou non | **définition unique** — voir 37e |

★★★ **La différence `_mvPeriodes` / `_mvContrats` est un piège actif.** Choisir la mauvaise donne un
document qui a l'air juste : soit deux contrats de types différents fondus en un, soit un contrat
prolongé compté deux fois.

### 37d. La coupure est DESSINÉE (v6.60)

Sept champs disparates deviennent **un bandeau + un historique**. Le rail de la frise est **plein**
pendant un contrat et **pointillé** dans le vide ; le trou porte son propre encart hachuré
(« *coupure de 23 jours — le compteur du précédent est soldé* »).

★★★ **C'est ce trou qui décide si le compteur repart de zéro, et il n'était affiché NULLE PART** :
cause commune des défauts des lots A, B et C1.

- **Chaque geste annonce son effet AVANT validation**, même patron que `_planAbsEffet`. L'encart est
  **calculé** en simulant l'ajout sur `_mvPeriodes`, jamais écrit en dur : *un texte figé finirait par
  mentir le jour où la règle change*.
- **Un événement s'écrit dès qu'il est validé**, pas à l'enregistrement de la fiche : fermer la fiche
  ne perd plus un contrat saisi.
- **La grille horaire est portée par le contrat**, pas par un événement à part — mesure : `_planPlId`
  est affecté **hors boucle** dans 26 fonctions, et les modèles sont déjà datés à l'**année**. Dater
  l'affectation au **jour** aurait mélangé deux granularités sur le même calcul.
- **Supprimés du modèle** : `renouvellement_date`, `renouvellement_fin`.

### 37e. La question ouverte de §36j est TRANCHÉE

`window.MV_HORS_ANNU = ['TESA', 'Saisonnier', 'Extra']` et `window._mvAnnualise(m)`.

⚠️ **La liste énumère ce qu'on RETIRE, pas ce qu'on garde.** Une liste d'inclusion ferait sortir de
l'annualisation tout type absent — un libellé futur, une donnée importée, une faute de frappe — et
ferait donc **disparaître un compteur en silence**. Tout ce qui n'est pas nommé reste annualisé.

`annualise:false` → plafond, modulation, reste et cadence **n'ont aucun sens** : mis à zéro, et la
carte bascule sur un simple comptage (`_planCompteCard`). Une **équipe collective** n'est jamais
annualisée. ⚠️ **Tout écran ou document qui parle de plafond doit lire `_mvAnnualise` d'abord.**

### 37f. C23 — ce qu'un attribut HTML nomme doit vivre sur `window` (v6.61)

**Correctif 6.60** : les neuf fonctions `_emhX` de la fiche membre étaient exposées, **l'ÉTAT ne
l'était pas**. `var _EMH` est une variable de **module** ; `oninput="_EMH.d=this.value"` s'évalue dans
la portée **globale**. Au premier caractère tapé : *« _EMH is not defined »*. 27 références réécrites
en `window._EMH`. **C'est C15 appliqué à une VARIABLE et non à une fonction.**

**Nouveau contrôle C23** (`scripts/preflight.mjs`), avec cliquet. C6 existait déjà mais ne lit que le
**premier** identifiant du gestionnaire, seulement s'il est suivi d'une parenthèse, et écarte tout ce
qui contient un point — `_EMH.d=` cochait les trois cases. **C23 lit le CORPS ENTIER** : appels, accès
propriété, affectations ; exposition **croisée entre fichiers** ; variables déclarées dans le
gestionnaire ignorées ; mots-clés et globaux natifs exclus.

★ **Trouvé dès le premier passage, un défaut ancien et sans rapport** : `let pShowDone` (app.js). La
puce « À faire / Toutes » des parcelles levait une **ReferenceError à chaque clic**, en silence.
**Le bouton ne faisait rien depuis toujours.**

⚠️⚠️ **Un `let` de haut niveau n'est joignable ni via `window`, ni via la portée globale : le bundle
est une IIFE, il n'y a pas de portée globale à atteindre.**

---

## 38. ★★★ LES DOCUMENTS, ET L'ÉCRASEMENT (13-14/08 — APP 6.12 · SW 6.62)

### 38a. ⚠️⚠️⚠️ D'abord l'incident, parce qu'il prime sur le reste

Point de départ anodin : *« ça serait bien un pdf des mesures effectuées aux vendanges, analyse avant
vendange et tous les autres modules »*. Quatre lots ont suivi. **Tous ont été écrits sur un clone de
07:33 et livrés en fichiers complets jusqu'à 20:31**, pendant que Nico poussait six commits (§37).

**Ce qui a été écrasé, mesuré** (lignes présentes chez Nico, absentes après intégration) :
`reglages.js` **331** · `utils.js` **216** · `planning.js` **171** · `sw.js` **139** (son changelog) ·
`app.js` **19** · `index.html` et le guide **19**.

★★★ **C'EST SON PROPRE C23, ÉCRIT LE JOUR MÊME, QUI A SONNÉ.** Le contrôle a retrouvé l'`onclick`
`pShowDone` que **sa propre correction venait de retirer** ; la CI a échoué **avant le build**. Sans
lui, l'écrasement partait en production.

**Réparation** : `git revert` du commit d'intégration — testé avant d'être conseillé, l'état restauré
était **identique au caractère près** — puis les quatre lots **rejoués** sur la base à jour. Les **15
points d'ancrage retrouvés, une seule fois chacun** : preuve mécanique que les deux travaux ne se
marchent pas dessus. Trois adaptations ont été nécessaires, elles sont en 38d.

**Les leçons sont consignées en Règle d'or n°1** (re-mesurer la fraîcheur avant *chaque* livraison,
réutilisation des numéros de version, procédure de réparation).

⚠️ **Deux régressions retrouvées en rejouant, attrapées par mes propres harnais** : une correction
faite directement dans le fichier patché **et non dans le bloc source** est revenue à l'état
défectueux (tri des parcelles sans commune). **Corriger le livrable sans corriger la source du patch,
c'est corriger une fois.**

### 38b. Ce qu'a trouvé la mesure, avant d'écrire une ligne

**Le hub Documents sortait déjà douze PDF.** Deux saisies du Cuvier n'en faisaient partie d'**aucun** :
les analyses de maturité (`CAVE_VENDANGE.analyses`) et les mesures de fermentation
(`cuves_vinif[].mesures_fa`). Vérifié par grep : ni le bilan de campagne, ni le rapport de saison ne
les touchent.

★ **Ce n'est pas un oubli du registre des manipulations.** Son en-tête l'écrit : *« densité, analyses
n'en font pas partie : l'inclure noierait le document »*. Un contrôle regarde l'enrichissement et le
sulfitage ; le vigneron a besoin de ses courbes. **Deux publics → deux documents**, pas une section de
plus dans un registre qui a raison de les refuser.

### 38c. Les quatre lots

**1. Le Cuvier (cave.js).** `_matDoc` — **contrôle de maturité**, paysage : une ligne par parcelle,
une colonne par jour de relèvement, **dans l'ordre de maturité**, vitesse en g/L par jour, trois
moyennes **pondérées par la surface**, parcelles jamais mesurées et déjà rentrées. Au-delà de huit
jours, les huit derniers s'affichent et le document **dit combien manquent**. `_cuvDoc` — **cahier de
cuverie**, portrait : une page par cuve, densité corrigée à 20 °C, sucre restant estimé, avancement,
remontages, pigeages, opérations via `_rmDetail`, cuvée de sortie au décuvage.

⚠️ **`_matSynth` prend un second paramètre `refIso`** pour rejouer une campagne passée. Il a fallu
borner **AUSSI PAR LE HAUT** : `_matJours` rend un écart **négatif** pour une mesure postérieure à la
référence, donc le filtre des 150 jours la laissait passer — la vendange suivante se serait invitée
dans le document de l'année précédente. **La borne ne s'arme que si `refIso` est fourni** : l'écran
est strictement inchangé.

★★★ **ET SURTOUT : CE LOT A ÉTÉ INTÉGRÉ À MOITIÉ.** `cave.js` est parti en production le 13/08 à
15:18 (v6.58) **sans le `reglages.js` du même lot** : deux documents complets, fonctionnels, et
**atteignables par personne**. **C15 grandeur nature, causé par une livraison en morceaux.** Un lot
qui touche deux fichiers s'intègre en une fois ou pas du tout.

**2. L'état du vignoble (reglages.js).** Le vignoble ne sortait qu'en CSV. Une ligne par parcelle :
commune, ha, cépages (complantation signalée), avancement + barre, tâches faites/concernées, tâches
« hors sujet », dernier travail, dernier rendement à l'hectare ; puis répartition par cépage et
arrachées à part.
★ **Sa dernière colonne dit CE QUI MANQUE** : cépage absent, aucune position, aucun contour — comptés
et nommés en fin de page. **C'est la feuille à cocher d'une installation** (40 parcelles chez un
prospect, personne ne relit 40 lignes à l'écran).
- Moteurs **lus**, jamais refaits : `getPCls`, `getTachesSaison`, `_mvParcGeo`, `_mvKmlCtrs`,
  `_dpRendHistRows` (**une ligne d'export** dans `app.js` plutôt qu'une copie du calcul).
- ⚠️ **AUCUNE HEURE, volontairement.** Leur calcul vit dans `openDP` avec les trous de plantation,
  l'entreplantation et les exclusions : le recopier en ferait une **seconde définition**.
- ⚠️ **Le journal porte AUSSI les relevés météo** : sans le filtre `!j.meteo`, la « dernière
  intervention » d'une parcelle aurait pu être une note de pluie. Même filtre que l'export JSON.
- ⚠️ **Une parcelle complantée compte sa surface ENTIÈRE pour chacun de ses cépages** : la colonne
  dépasse alors la surface du domaine, et **le document l'écrit**. Rien ne permet de partager une
  surface rang par rang, et *un partage inventé serait pire qu'un double compte annoncé*.
- L'avancement du domaine est **pondéré par la surface**, et le dit.

**3. Le relevé individuel (planning.js).** ⚠️⚠️ **CE DOCUMENT EXISTAIT DÉJÀ** — lu avant d'écrire :
`planExportPDF` sortait le mois jour par jour, les heures sup, **le compteur d'annualisation** et le
détail mois par mois. Écrire une « fiche salarié » de plus aurait fabriqué **une seconde définition
des mêmes chiffres**. Le lot fait donc deux choses :
- **il rend le document atteignable** — entrée au hub (famille *Obligatoire*) avec un panneau
  salarié + mois, **construit en JS** (injection idempotente dans `#docs-pane`) plutôt qu'écrit dans
  un `index.html` de 268 ko ;
- **il ajoute la vie contractuelle et les congés**. L'en-tête ne nomme que le contrat **du mois**
  (`_ctrTxt`, v6.60) ; le compteur porte sur l'**année**. Entre les deux, rien ne disait combien de
  contrats l'année comptait ni où tombaient les **coupures**.
- ⚠️ Source : **`_mvPeriodes`** (37c), pas `_mvContrats`. Chaque contrat avec **son type**, et les
  coupures **comptées en jours**, avec le vocabulaire de la frise (37d).
- ⚠️ Le pied suit **`_mvAnnualise`** (37e) : écrire « plafond proratisé » sur le relevé d'un TESA
  serait faux depuis la v6.61.
- ⚠️ **`planExportPDF` lit la variable de module `planMonth`.** Le point d'entrée la déplace puis
  **la remet** (`finally`) : éditer un relevé depuis les Documents ne doit pas changer le mois affiché
  au Planning.
- ⚠️ **`_planFmt` formate des HEURES** : `_planFmt(12)` rend « 12h ». Les congés se comptent en
  **jours** — le document imprimait **« 12h j »**, trouvé par le harnais, pas à l'œil. Formateur de
  jours séparé, plus un garde-fou permanent qui échoue sur tout `h j<`.
- **Aucun montant** : c'est un décompte d'heures, pas un bulletin de paie. La donnée `paie` n'est pas
  touchée (C21).

**4. Le carnet d'entretien à la charte (app.js).** Il titrait *« Ma Vigne — Entretien tracteurs »* et
signait *« © 2026 Nicolas GUERET / GUERETTECH »*, là où la charte écrit noir sur blanc que **les
documents portent le nom du DOMAINE, jamais celui de GUERETTECH**. Corrigé. Ses marges étaient **déjà**
14mm 12mm : la largeur utile ne bouge pas, aucune colonne ne se décale.

### 38d. Les trois adaptations imposées par le chantier CONTRATS

En rejouant les lots sur la base à jour, trois choses ont dû changer — et **c'est la partie utile de
l'incident** :
1. le bloc contrats est passé de `_mvContrats` à **`_mvPeriodes`** (chaque contrat garde son type) ;
2. le pied du bloc suit **`_mvAnnualise`** au lieu d'affirmer un plafond ;
3. « en cours » désigne **la période qui couvre aujourd'hui**, et non « sans date de fin » — sinon
   seuls les CDI étaient marqués.

★ **Un patch qui s'applique n'est pas un patch qui a raison.** Les 15 ancres tenaient ; c'est la
**lecture du travail de l'autre** qui a corrigé le sens.

### 38e. ★★ L'audit des chartes — il n'y a pas huit documents en désordre, il y en a deux chartes

Mesuré avant d'écrire, sur les 15 générateurs :

| Famille | Combien | Ce qu'ils partagent |
|---|---|---|
| **`MV_DOC`** (`_mvDocOpen`) | **8** | la primitive commune de `utils.js` |
| **Charte « Cave », non écrite** | **3** | registre des manipulations, bilan de campagne, inventaire des fûts : encre `#14110D`, filet `#8A5A38 → #C2871E → #3D6B27`, Cormorant, marge 14/12 |
| **Vrais retardataires** | **4** | relevé mensuel · registre phyto (paysage **9mm**) · rapport de saison (**margin:0**) · relevé individuel (**10mm**) |

★★★ **La charte « Cave » n'est pas de la négligence : c'est un en-tête PLUS RICHE que celui de
`MV_DOC` (dégradé, radius, titre 30-34px), écrit APRÈS elle, et cohérent entre ses trois documents.
Les aplatir ferait PERDRE en qualité.**

⚠️ **Les quatre retardataires n'ont pas été convertis, et pas par manque de temps** : passer le
registre phyto de 9 à 12 mm **retire 6 mm à un tableau de dix colonnes** déjà serré, et le rapport de
saison est en pleine page. **Ces conversions se valident sur un RENDU, pas sur une relecture de
source.** Les convertir à l'aveugle serait la faute que ce document passe son temps à décrire.

### 38f. Les filets ajoutés

- **`scripts/mv-chartes-doc.mjs`** — recense les 15 générateurs, dit qui suit quelle charte, affiche
  la marge que chacun s'invente, et **échoue si le nombre de documents hors `MV_DOC` augmente**
  (plafond **7**, à ne faire que **descendre**).
  ★ **Sa propre contre-épreuve a trouvé une faille dans le détecteur** : il comptait la **mention** de
  `_mvDocOpen`, or le garde `typeof window._mvDocOpen` cite le nom **sans appeler**. Un document qui
  perdrait son appel en gardant son garde passait pour conforme. Il cherche l'**appel** désormais.
- **`scripts/mv-whatsnew-check.mjs`** — **exécute** le journal au lieu de le relire : tête =
  `APP_VERSION`, ordre décroissant, doublons, backslash rendu littéralement, demi-surrogates
  **appariés** (un emoji hors BMP est une paire légitime), `_whatsNewSince` **joué**.
- **Trois harnais** (`vignoble`, `releve`, `entretien`) sur le patron de `cuvdoc`, chacun avec ses
  contre-épreuves : 11 + 11 + 8 défauts réinjectés, **tous rouges**.
  ⚠️ **`app.js` ne se charge pas dans Node** (il importe le SDK Firebase et `styles.css`) : les
  moteurs y sont **extraits du source réel** par découpe (méthode C20). `planning.js`, `reglages.js`
  et `cave.js`, eux, se chargent entiers derrière un DOM minimal.
- **`.github/workflows/ci.yml`** — actions `v4 → v5` (fin des avertissements Node 20) et trois étapes
  neuves avant le build : **le guide en phase avec ses sources**, le journal + le cliquet des chartes,
  les quatre harnais.

★ **Trou fermé au passage** : `public/guide.html` était **en retard sur ses propres sources**
(`guide/*.html` enrichis sans régénérer). `build-guide.mjs --check` n'était **pas dans la CI** — il
y est maintenant.

### 38g. Fichiers, versions, état

`src/reglages.js` (2 blocs + 4 entrées au hub) · `src/planning.js` (2 blocs + point d'entrée) ·
`src/app.js` (1 export + conversion du carnet) · `src/utils.js` (`APP_VERSION` + WHATS_NEW +
`MV_AIDE` cave/parcelles/planning) · `index.html` (4 emplacements) · `public/sw.js` ·
`guide/04-vigne.html` + `guide/10-planning.html` + `public/guide.html` régénéré ·
`.github/workflows/ci.yml` · 5 scripts neufs. **`cave.js` était déjà intégré (v6.58).**

**APP 6.11 → 6.12, SW 6.61 → 6.62.** Preflight **0/0**, ESLint **0** (plafond 0), vocabulaire vert,
guide en phase, journal vert, cliquet des chartes **8 / 7 / plafond 7**, quatre harnais verts,
**41 contre-épreuves toutes rouges**, build Rollup complet avec vérification du câblage **dans le
bundle minifié**. ⚠️ **Smoke et e2e non joués** : le téléchargement de Chromium est bloqué par la
politique réseau du bac à sable — ils ne tournent qu'en CI.

### 38h. Ce que ce chantier ouvre et ne ferme pas

1. **La charte « Cave » ou `MV_DOC` ?** Décision de design qui appartient à Nico : remonter le hero
   riche dans `utils.js` comme variante (`hero:'riche'`) et y rallier les autres — le plafond du
   cliquet tomberait de **7 à 4** sans rien perdre visuellement — ou aplatir trois documents récents
   vers un en-tête plus pauvre.
2. **Les quatre retardataires attendent un rendu.** Registre phyto (largeur), rapport de saison
   (`margin:0`), relevé mensuel (31 ko), relevé individuel (10mm).
3. **`openSyntheseCuivre` est taggé `fm:'pdf'` au hub alors qu'il ouvre un ÉCRAN**, pas un document.
   À vérifier : l'écran a-t-il un bouton d'impression ?
4. **Le guide et les documents ne se contrôlent pas mutuellement.** Un document peut promettre une
   colonne que le guide ignore, et l'inverse. Aucun filet là-dessus.

---

## 39. ★★★ LE CACHE QUI GÈLE UNE COURBE (14/08 — `pilotage.js` seul, aucun bump)

> **Point de départ** : une capture de la frise annuelle zoomée sur *Hiver 2026-2027* et six mots —
> *« pourquoi que 3 permanents ? c'est faux par rapport à ce qui est inscrit dans réglage »*.

### 39a. La première réponse était à côté, et c'est instructif

Premier réflexe : expliquer les filtres. Réglages liste `MEMBRES` en entier — inactifs, bureau,
équipes collectives, comptes de service — pendant que la ligne noire ne compte que les fiches
**sous contrat ce jour-là, hors bureau**. Tout cela est exact. Et ça n'expliquait rien : Nico avait
raison, le chiffre était faux.

⚠️⚠️ **La faute est dans l'ordre des opérations.** Expliquer pourquoi un écran a *le droit*
d'afficher un chiffre différent de celui qu'on attend, c'est fabriquer une excuse avant d'avoir
mesuré. L'explication était plausible, cohérente, sourcée dans le code — et fausse comme réponse à
la question posée. **Une explication plausible n'est pas un diagnostic.** Elle a coûté un tour.

### 39b. La capture d'écran est une mesure, à condition de la traiter comme telle

Calibration : gradins 0 / 2 / 4 / 6 aux ordonnées **524,5 / 417 / 309,5 / 202** ; séparateurs de
mois aux abscisses **236** (1ᵉʳ oct.), 459,5, 675,5, 899, 1122,5, 1324,5, 1547,5 → **7,205 px par
jour**, constant à 0,3 % près sur six mois. Le trait noir occupe **y = 362-364 sur toute la
largeur**, x = 237 → 1546 : **3,005 constant, aucune marche**. Les seules interruptions (x = 458-461,
674-677, …) sont les séparateurs de mois, **dessinés après la polyligne**.

Les bornes de l'axe se déduisent du code : `mg = max(2, round((d1-d0)*0.04))` n'admet qu'une
solution auto-cohérente — **mg = 7**, donc **période du 01/10/2026 au 31/03/2027**. Recoupement
indépendant par les bandes de tâches : Réparation 1ᵉʳ oct. → 1ᵉʳ déc., Taille 30 nov. → 1ᵉʳ mars,
Tirage 7 déc. → 16 mars. Les trois concordent.

★ **Lire « la ligne a l'air plate » n'est pas un constat.** Extraire 3,005 sur 1 309 colonnes en est
un — et c'est ce qui a permis d'affirmer *avant* de creuser que le défaut n'était pas un arrondi de
semaine partielle.

### 39c. Ce que le calcul rendait vraiment

Table relevée en console sur le domaine réel, colonne `contrats` = sortie de `_mvContrats` :
**16 fiches** — 8 inactives (dont un **compte de service `Pilotage`**, sans dates), 2 bureau
(Etienne, Chloé), 1 collective (`Vendangeurs`, effectif 40), 5 actives.

Les **vraies fonctions extraites du dépôt** — `_mvEnContratSurPeriode` (utils.js), `_inContractDay`,
`_headWeek`, `_headDayMax` (planning.js) — rejouées sur ces données, période 01/10 → 31/03 :

| semaines | `head` | qui |
|---|---|---|
| 01/10 → 11/11 | **4,000** | Nico (sans dates), Victor, Shana, Alicia |
| 12/11 → 18/11 | **3,857** | Shana sort le 17 → 6/7 de semaine |
| 19/11 → 31/03 | **3,000** | — |

`mbrs` retenus : **Nico, Victor, Shana, Alicia**. `Vic` est exclu à raison (contrat clos le 06/09,
avant le début de période). **Le calcul était juste.** L'écran affichait 3 plat.

### 39d. La cause : une clé faite de longueurs

`_pilAnnuelData` (pilotage.js l.1001) mémoïse son résultat dans `_PIL_ANN`. Sa clé portait les
périodes, puis `MEMBRES.length`, `PARCELLES.length`, `TACHES.length` et le mois d'exercice.

⚠️⚠️⚠️ **Aucune de ces longueurs ne bouge quand on saisit une date de contrat.** Ni quand on coche
Bureau, ni quand on change l'effectif d'une équipe collective, ni quand on corrige une surface ou
des heures/ha. La frise reservait le calcul d'avant **jusqu'au prochain F5**, sans rien signaler.
`_PIL_ANN` n'était vidé **qu'au changement de mois d'exercice** (l.8582).

★★★ **UN CACHE DONT LA CLÉ NE DÉRIVE PAS DE SES ENTRÉES N'EST PAS UN CACHE, C'EST UN GEL.** Et il
ment de la pire façon : aucune exception, aucun trou, aucune valeur aberrante — une courbe
parfaitement lisible qui dit le contraire de la base. Même famille que « l'indicateur bâti sur un
signal partiel ment avec l'autorité d'une mesure » (§33), déplacée d'un cran : ici le signal est
complet, c'est **la fraîcheur** qui est partielle.

★ **L'asymétrie était visible dans le fichier lui-même.** `pilotage.js` porte **deux** memos sur la
même donnée : `_PIL_CDV` (l.1190) est **oublié à chaque repeinte** — `_pilCdVueOublier()` est appelé
en trois points, dont `renderPilotage()` — avec ce commentaire : *« un chiffre figé après une saisie
de planning serait un écran qui se contredit lui-même »*. `_PIL_ANN` ne l'est nulle part. La règle
était écrite à dix lignes du défaut.

⚠️ **Et l'oubli par repeinte n'était pas la bonne correction ici** : `_pilAnnuelData` appelle
`_chargeSaisonData` **une fois par période**, c'est précisément pourquoi il est mémoïsé. Le vider à
chaque rendu paierait N calculs de charge par repeinte. **La clé était le bon levier ; elle était
simplement fausse.**

### 39e. Le correctif

La clé dérive maintenant de **tout ce que lit `_chargeSaisonData`**, via trois signatures locales :

| signature | ce qu'elle porte |
|---|---|
| `_annSigM(m)` | nom · `bureau` · `collectif` + effectif · `statut` · **toutes les périodes rendues par `_mvContrats`** |
| `_annSigP(p)` | `statut` · `surface` · nombre d'exclusions de tâches |
| `_annSigT(t)` | nom · `hha` · `type` · `trous` · `anytime` · saisons |

Plus `SAISON_PASSAGES`, `CONFIG.task_windows`, la **liste de tâches** de chaque période (`p.taches`,
absente de l'ancienne clé alors qu'elle décide quelles tâches entrent dans la charge), et le mois
d'exercice déjà présent. Coût : quelques centaines de concaténations par rendu — **trois ordres de
grandeur sous le calcul qu'elles évitent.**

### 39f. Contre-épreuves

| scénario | clé base | clé patchée |
|---|---|---|
| Shana reçoit son contrat 17/08 → 17/11 | **identique** → frise gelée | **change** → recalcul |
| Bureau coché sur une fiche | — | **change** |
| aucune modification | — | **stable** (le memo sert toujours) |

La contre-épreuve sur la base est **rouge**, comme elle doit l'être — un harnais qui ne peut pas
rougir ne prouve rien. Le troisième scénario est le garde-fou inverse : une clé trop volatile aurait
supprimé le memo au lieu de le réparer.

Contrôles : preflight **0 / 0** (APP 6.12 · SW 6.62), `node --check` ESM, cliquet `catch{}`
**83 → 83**, delta d'accolades **0**, cliquet d'interpolation vert, vocabulaire vert, chartes de
document **8 / 7 / plafond 7**, guide en phase, diff ciblé **3 lignes retirées / 41 ajoutées, aucune
hors zone**.

**Aucun bump** — `pilotage.js` seul (§20b). ⚠️ **Livré, non intégré** au moment d'écrire.

### 39g. Ce que ce lot n'a pas fermé — et pourquoi

★★ **`_mvEnContratSurPeriode` contredit la convention du 09/07.** utils.js l.2449 :
`if(!P.length) return m.statut !== 'Inactif';`. La définition posée par Nico ce jour-là, retrouvée
mot pour mot dans l'historique, est *« effectif présent = membres non-bureau dont le contrat est
actif à la date ; **CDI sans date = présent en permanence** »*. **Le statut n'y figure pas.** Une
fiche **sans aucune date** passée en Inactif sort donc aujourd'hui de **toutes** les périodes,
**passées comprises** — ce qui réécrit rétroactivement des campagnes archivées.

Nico l'a redit le 14/08 : *« inactif […] ça veut juste dire que le contrat est terminé et que la
personne est inactive. Ça évite d'avoir à la sélectionner lorsque j'allume l'appli. »* C'est un
**confort de saisie**, pas un fait d'historique.

Correction = **une ligne**, `return true;`. **Elle n'a pas été posée**, et le blocage n'est pas
technique — c'est **une donnée** : la fiche **`Pilotage`** du tenant de référence est Inactive et
sans dates. La ligne en ferait un **CDI permanent** qui compte +1 sur chaque courbe, entre dans la
**masse salariale** (pilotage.js l.6933) et dans le **coût main-d'œuvre par parcelle** (l.5525).
**Aucun marqueur « compte de service » n'existe dans le modèle** — ni champ, ni convention de nom,
ni rôle. Aucune heuristique honnête ne distingue cette fiche d'un vrai CDI sans dates.

→ **TRANCHÉ LE 14/08 — Nico a supprimé la fiche `Pilotage`.** La ligne est posée. ★ Et sa raison
compte plus que le geste : *« je veux compter aussi les ETP bureaux pour pouvoir budgéter au plus
près de la réalité »* — un compte de service aurait pollué ce comptage à venir. La suppression
n'était pas un contournement, c'était une préparation. Suite en **§39i** et backlog **0a-ter**.

⚠️ **Le reste des memos n'a pas été audité.** `_PIL_CDV` et `_PIL_ANN` sont les deux seuls déclarés
sur le motif `var _X=null, _XK=''` ; les deux ont été regardés. **Tout autre cache posé ailleurs sur
une clé qui compte au lieu de décrire porte le même défaut** — à chercher au prochain passage sur
un module qui mémoïse.

### 39h. La règle à retenir

**Une clé de cache est une hypothèse sur ce qui peut changer.** Écrire `MEMBRES.length`, c'est
affirmer *« la seule chose qui peut modifier ce calcul est le nombre de fiches »* — une affirmation
que personne n'a vérifiée et que le code contredisait déjà. **Une clé se dérive de la liste des
lectures de la fonction mémoïsée, pas de ce qui semble suffisant.** Quand la liste est trop longue
pour être tenue à la main, c'est le signe qu'il faut oublier par repeinte plutôt que mémoïser.

### 39i. Suite du 14/08 au soir — la ligne posée, et ce que l'audit a trouvé en chemin

**APP 6.12 → 6.13 · SW 6.62 → 6.63.** `utils.js` (la ligne + `APP_VERSION` + `WHATS_NEW`) ·
`index.html` (4 emplacements) · `public/sw.js` (en-tête + `CACHE_NAME` + 2 `console.log` +
changelog préfixé) · `pilotage.js` (la clé de §39e).

**1. La ligne.** `if(!P.length) return true;`. Harnais **8 cas** joué sur les deux versions de la
fonction, extraites du dépôt :

| cas | patché | base |
|---|---|---|
| CDI sans dates, Actif | présent | présent |
| **CDI sans dates, INACTIF** | **présent** | **absent** |
| bureau sans dates (Actif ou Inactif) | absent | absent |
| CDD hors période | absent | absent |
| CDD dans la période, Inactif | présent | présent |
| contrat ouvert à droite | présent | présent |
| fin sans début, avant la période | absent | absent |

★ **La contre-épreuve est l'assertion sur la liste des divergences** : le harnais échoue si le
nombre de cas où base ≠ patché n'est pas **exactement 1**, et si ce cas n'est pas *« CDI sans
dates, Inactif »*. Un correctif d'une ligne qui changerait un deuxième comportement sortirait rouge.

Contrôles : preflight **0/0**, `mv-whatsnew-check` vert, cliquets vocabulaire et interpolation
verts, chartes 8/7, `node --check` ESM, `utils.js` et `sw.js` **ASCII pur** (convention du fichier),
build Rollup complet — et le câblage **vérifié dans le bundle minifié** : `if(!i.length)return!0;`
pour la ligne, et la clé longue avec `JSON.stringify(window.SAISON_PASSAGES||{})` pour le cache.

⚠️ **Un piège rencontré en écrivant `WHATS_NEW`** : les emoji sont écrits `'\u{1F4C8}'` dans un
fichier **ASCII pur**. Un backslash de trop dans le script de patch produit `'\\u{1F4C8}'`, que JS
rend **littéralement** — la vignette affiche le code source. Invisible à la relecture, visible à
l'exécution. **C'est exactement pourquoi `WHATS_NEW` se vérifie en l'EXÉCUTANT**, jamais en
relisant la source.

**2. Ce que l'audit a trouvé en chemin — la masse salariale perd tous les bureaux.**

`_pexData` (pilotage.js l.6971) construit le total des salaires chargés de l'exercice. Son
commentaire, trois lignes plus haut :

> *« Qui ? Toute personne SOUS CONTRAT sur la fenêtre […] Le "bureau" N'EST PAS exclu : c'est un
> salaire, et on chiffre une masse salariale. »*

Et le filtre juste en dessous appelle `_mvEnContratSurPeriode`, dont **la toute première ligne**
est `if(!m || m.bureau) return false;`.

⚠️⚠️⚠️ **Le commentaire décrit l'intention, la ligne fait le contraire — et personne ne peut le
voir**, parce qu'un total de masse salariale trop bas reste un nombre plausible. Sur le tenant de
référence, deux fiches sont bureau : leurs salaires sont **absents du total de l'exercice**.

★ **La famille du défaut est celle de §39d, déplacée d'un cran** : là c'était une clé qui affirmait
sans vérifier ; ici c'est un commentaire. **Un commentaire est une assertion non testée.** Il vieillit
comme un cache : la fonction appelée change de contrat, le commentaire reste. Le seul filet contre
ça est un harnais qui joue l'assertion du commentaire — il n'en existe aucun sur `_pexData`.

**Correctif préparé, non livré** : 4ᵉ argument `avecBureau` sur `_mvEnContratSurPeriode`, passé
`true` **au seul appelant l.6971**. Les trois autres appelants posent bien la question « qui
travaille la vigne » et doivent rester filtrés — coût main-d'œuvre par parcelle (l.5564), cadence
(l.6064), effectif présent (planning.js l.881). **Reporté au lot ETP bureau (backlog 0a-ter)** : ça
change un chiffre d'argent, et Nico a explicitement placé le sujet à la mise à jour suivante.

**3. La règle produit qui se dégage.** `bureau` répond aujourd'hui à **deux questions
incompatibles** avec un seul drapeau :

| question | qui la pose | bureau doit être… |
|---|---|---|
| **qui travaille la vigne ?** | courbe d'effectif, simulateur de renfort, cadence, coût MO/parcelle | **exclu** |
| **qui coûte ?** | masse salariale, budget, ETP payés | **inclus** |

★★ **Un drapeau qui répond à deux questions finira par mentir à l'une des deux.** C'est déjà fait.
Le lot ETP bureau n'est donc pas « retirer un filtre » mais **séparer les deux questions** — et le
nom du champ, *« non compté dans la capacité de travail des vignes »*, dit déjà laquelle des deux
il était censé servir.


---

## 40. ★★★ LE PARCOURS PROSPECT, DE BOUT EN BOUT (14/08 — APP 6.13 inchangé · SW 6.65 → 6.66)

**Point de départ** : *« refais le chemin du prospect depuis demander un essai »*, puis *« comble
tous les trous, il faut que tout soit parfait pour le prospect »*. Audit d'abord, six lots ensuite.
**14 moments cartographiés** — 7 le prospect seul, 3 Nico seul, 4 ensemble.

### ⚠️⚠️ LE TROU QUI VIDAIT LA CHAÎNE — `/api/lead` N'EXISTAIT PAS

`firebase.json` n'avait **aucun bloc `rewrites`**. `essai.html` postait sur `/api/lead` → 404 →
`catch` → `mailtoFallback()`. Conséquences en cascade, toutes silencieuses :

- **aucun document `leads` écrit** → le dossier de l'assistant d'installation restait vide, et la
  chaîne « 20 h → 9 h » perdait son carburant ;
- **l'accusé de réception au prospect ne partait jamais** — non parce qu'il manquait, mais parce que
  c'est `submitLead` qui l'envoie, et `submitLead` n'était jamais appelée. **`ackText`/`ackHtml`
  existaient depuis toujours dans `leads.js`.**

**le prospect Gironde est passé par le repli mailto** — ce qui explique sa fiche sans affichage.

**Correctif** : `essai.html` essaie **l'URL absolue d'abord**, `/api/lead` en repli — même ordre, et
pour la même raison, que `mise-en-route.html`. Les deux `rewrites` sont posés en plus, mais la page
n'en dépend plus.

★ **La leçon** : *une page qui a un repli ne signale pas sa panne.* Le formulaire « marchait » depuis
des semaines. Chaque envoi partait en mailto, et personne ne pouvait le voir depuis l'app.

★★ **La leçon de méthode** : j'ai d'abord annoncé « l'accusé de réception manque, à écrire ». Faux —
il était là, 60 lignes plus bas dans le fichier que je venais de lire. **Lire jusqu'au bout avant de
conclure qu'une chose manque.** Idem plus tard pour la lecture seule et le chrono, annoncés comme
« à construire » alors qu'ils existaient (`_mvCheckExpired`, `_mvTrialBanner`). **Deux fois la même
faute dans la même session : reconstituer de mémoire au lieu de lire.**

### LES SIX LOTS

| Lot | Fichiers | Ce qu'il ferme |
|---|---|---|
| **A** hosting | `firebase.json` · `essai.html` · `mise-en-route.html` | `/api/lead` · repli presse-papier · RGPD au point de collecte · effectifs de le prospect Gironde retirés |
| **B** functions | `leads.js` | accusé de mise en route au client, **une seule fois** |
| **C** panneau GT | `admin-gt.js` | essai à la remise · fiche honnête · pièces jointes suivies |
| **D** functions | `claims.js` | `gtRenewTrial` + `trialWatch` — l'essai borné |
| **E** câblage | `firebase.js` · `admin-gt.js` | le bouton qui rend `gtRenewTrial` exécutable |
| **F** client | `app.js` · `index.html` · `sw.js` | le bandeau dit ce qui vient après |

### CE QUE CHAQUE LOT A APPRIS

**A — `mise-en-route.html` parlait de le prospect Gironde à tout le monde.** « vos 12 permanents », « vos
6 engins », « vos 4 cuvées », en dur dans la page publique. Le deuxième prospect aurait lu les
effectifs du premier. ★ **Une page publique écrite pour un client nommé devient un incident dès le
deuxième.**

**A — le mailto n'est pas un repli.** `window.location='mailto:'` ne fait **rien** sur un appareil
sans client mail configuré. Le récapitulatif part désormais au **presse-papier d'abord**, la
messagerie ensuite.

**B — l'accusé de mise en route est le seul dont la réponse est incomplète.** Les fichiers ne partent
pas avec le formulaire. L'accusé porte donc trois choses et pas une de plus : *c'est arrivé* · *voici
ce que vous m'avez envoyé* · *voici ce qu'il reste à joindre*. ⚠️ **Envoyé une seule fois par
adresse** (`dejaMer` sorti de la transaction) — sinon le formulaire devient un moyen d'écrire à
l'adresse de son choix.

**C — un bandeau qui explique une contrainte ne la lève pas** (§35b, à nouveau). L'assistant
affichait *« installez le jour où vous envoyez les identifiants »*. Remplacé par un choix — « l'essai
démarre : à la remise / tout de suite », **défaut à la remise** — et un bouton sur l'écran des
identifiants. Un DPA à faire signer ne mange plus des jours d'essai.

**C — l'état intermédiaire créé doit être lisible ailleurs.** Un domaine installé « à la remise » n'a
ni `trial_until` ni `trialDays` : sans branche dédiée, la fiche client l'annonçait **« Abonnement
actif »** — d'un client qui n'a rien signé. D'où `trialPrevu`. ★ **Créer un état, c'est s'engager à
le rendre lisible partout où l'ancien l'était.**

**C — les pièces jointes étaient hors radar.** Le chemin se dédouble après la mise en route : les
**réponses** arrivent par la fonction, les **fichiers** par la boîte mail. Rien ne disait où en était
le second. Deux pastilles sur la carte lead, et une bascule manuelle dans `leads_status` — **le seul
fait de cette fiche qui se coche à la main, et c'est assumé.**

**D — `esc()` n'existe pas dans `claims.js`.** `_trialMailNico` l'appelait. Ça passait `node --check`,
ça passait le **chargement du module**, et ça n'aurait échoué **qu'à l'exécution** — mail avalé par
le `catch`, alerte jamais reçue, personne pour s'en apercevoir. Attrapé par le harnais, pas par les
outils statiques. ★★ **Une fonction utilitaire qui vit dans un fichier voisin ne s'importe pas
toute seule. Le seul filet qui l'attrape est un harnais qui EXÉCUTE.**

**D — le garde-fou est serveur.** `gtRenewTrial` refuse la seconde reconduction avec
`failed-precondition`. Le bouton grisé n'est que l'affichage. `gtSetTenantPlan` reste ouvert à côté :
c'est le passe-partout de Nico, assumé, et pas le chemin normal.

**D — la reconduction repart de MAINTENANT**, pas de l'ancienne échéance. Un essai reconduit trois
jours après son terme donne quinze jours pleins : sinon la lenteur administrative se paie sur le
temps du client, ce que ce lot existe pour éviter.

**E — trois zones à repeindre, pas une de moins.** Après reconduction : l'encart d'état, le champ de
jours, et le bloc de reconduction qui doit se griser. ★ **En oublier une laisse l'écran affirmer
l'ancien état juste à côté du nouveau.**

**F — un décompte sans suite annoncée se lit comme une menace.** Le bandeau affichait « J-4 » et rien
d'autre. Le client ignorait qu'à l'échéance tout reste consultable, et croyait devoir relancer
lui-même. Sous-ligne les trois derniers jours. **Le seuil 3 est le miroir de `TRIAL_WARN_D` : on ne
promet l'alerte que les jours où la veille l'envoie.**

**F — quatre porteurs de version, pas deux.** J'avais bumpé l'en-tête et `CACHE_NAME`, pas les deux
`console.log`. **Le preflight l'a attrapé** (§7). Le cliquet a fait exactement son travail.

### LA VEILLE — `trialWatch`, tous les jours à 8h05 Paris

| Moment | Destinataire | Condition |
|---|---|---|
| J-3 avant échéance | Nico | `!m.j3` |
| échéance (bascule lecture seule) | Nico | `!m.exp` |
| J+15 après expiration | **le client** + copie Nico | `trialRenewals === 0 && !m.relance` |
| reconduction | Nico (« appelle-le ») | événement, hors veille |

★ *« Absence de contact entre J15 et J30 »* est traduit en **`trialRenewals === 0`** : le système ne
sait pas si un coup de fil a eu lieu, mais **la reconduction est la trace du contact**.

⚠️ **8h05 et pas 3h du matin** : une alerte J-3 qui arrive la nuit se noie.
⚠️ **Marqueurs écrits APRÈS mise en file.** Une veille quotidienne qui renvoie le même mail chaque
nuit est pire que pas de veille : on cesse de les lire.
⚠️ **Un domaine qui échoue ne doit pas emporter les suivants** — `try` par slug.

### APRÈS J30 — hypothèse prise, jamais confirmée

**La lecture seule dure.** Ni fermeture, ni bascule payante. C'est déjà le comportement du code et
c'est le choix non destructeur — mais Nico n'a jamais tranché explicitement. ⚠️ **À confirmer.**

### LES HARNAIS — 108 assertions, hors dépôt

`harnais-parcours-prospect.mjs` (58) · `harnais-essai-borne.cjs` (15) · `harnais-reconduction.mjs`
(20) · `harnais-bandeau-essai.mjs` (15). Ils lisent les **fichiers réels** et extraient les fonctions
pour les exécuter : ils rougiront si un lot repart en arrière.

★★ **Deux faux verts attrapés en les écrivant, et c'est la vraie leçon de la session :**

1. **`admin.firestore` n'est pas inscriptible.** `admin.firestore = mock` **échoue en silence** ; le
   harnais tapait la vraie base, la lecture échouait, `trialWatch` sortait en début de fonction — et
   *« aucun mail envoyé »* verdissait. Corrigé par `Object.defineProperty`, **et par une garde qui
   rougit si le registre n'a pas été lu.**
2. **Un harnais qui explose doit compter ROUGE**, pas s'arrêter. `_fcTrialStatusHtml` appelait
   `_fcTrialFmt`, non extrait : le `throw` tuait le processus au milieu des assertions.

★★★ **Un harnais qui verdit sur une panne de montage est pire qu'aucun harnais.** Toujours lui faire
prouver que son décor a été monté.

### CE QUI N'A PAS ÉTÉ FAIT

- **`test:smoke` et `test:e2e` jamais joués** — le CDN Playwright est injoignable du bac à sable.
  Trois écrans client ont changé : bandeau, écran de fin d'essai, panneau GT.
- **La lecture seule reste côté navigateur** (cf. §14b). Aucune règle Firestore ne connaît `trial`.
- **Aucune mesure d'audience** : un prospect qui fait la démo et repart reste invisible.

---

## 41. ★★★ L'ESCALIER DE CADENCE, ET LE FICHIER QUI NE TROUVE PAS SA PLACE (14/08 soir — APP 6.13 → 6.14 · SW 6.66 → 6.67)

**Point de départ** : deux mots, `« suite »`, sur le backlog technique. Quatre entrées traitées.
**La leçon du jour n'est pas dans le code** — il était juste du premier coup. Elle est dans la
livraison, qui a coûté **deux allers-retours de CI** pour un fichier de guide.

### 41a. L'audit d'abord — cinq entrées déjà mortes

Avant d'écrire une ligne, `grep` sur les neuf entrées annoncées. **Cinq étaient déjà faites** :

| # | annoncé au backlog | mesuré sur le code |
|---|---|---|
| 2 | rewrite `/api/mise-en-route` absent | ✅ **présent** dans `firebase.json` |
| 5 | breakpoint 760 px encore là | ✅ **767.98 déjà posé** |
| 8 | pic mort dans `_rfCtx` | ✅ **retiré le 11/08**, commentaire en place |
| 15 | `.cave-tabs` orpheline `styles.css:1447` | ✅ **introuvable** au grep |
| 41 | 44 × `var(--texte-doux,#8B8175)` | ✅ **zéro occurrence de ce motif** |

★ **Un backlog non ré-audité fait travailler sur des fantômes.** C'est le troisième audit du même
genre (11/08, 14/08 matin, ici) et il trouve **toujours** des entrées mortes. Les 15 `#8B8175`
restants dans `cave.js` sont des **usages directs**, pas des replis de variable : sujet différent,
entrée à réécrire plutôt qu'à rayer.

### 41b. L'escalier de cadence — la marche 2 (entrée 7)

Le design était déjà écrit en §20b : *période en cours ≥ seuil → même période l'an dernier via
`HISTORIQUE` + `_pilCmpSnapshot` → sinon rien*. **La marche 2 n'avait jamais été câblée.**

**Ce qui rendait la marche 2 possible sans rien inventer :**

| grandeur | d'où elle vient | pourquoi |
|---|---|---|
| `hBar` | **le snapshot**, `stats.hFaites` | `TRAVAUX` est remis à zéro à la clôture — **seule grandeur non recalculable** |
| `hReel` | **recalculé** sur `PLANNING_ENTRIES` | clé **par année**, jamais purgé ; `_planWorkPersRange` est année-aware |
| `hTrac` | `_ecoTracHByParc({d0,d1})` | la fonction **acceptait déjà une fenêtre de dates**, et `SESSIONS` n'est pas purgé |
| les dates | **`SAISONS`**, pas le snapshot | une période supprimée de `SAISONS` n'est plus datable — on ne devine pas une fenêtre |

★★ **Le seuil de 40 % ne s'applique PAS à la marche 2.** C'est la **représentativité** qui le
justifiait — janvier ne prédit pas juin. Une période **close** est représentative d'elle-même par
construction. Appliquer le seuil à un passé terminé aurait été un copier-coller de garde sans
comprendre ce qu'elle garde.

★★★ **QUATRE POINTS D'AFFICHAGE, PAS UN.** Un chiffre de l'an dernier présenté comme une mesure du
moment, **c'est exactement la faute de §34** — deux choses sous un mot, sur le même écran. Il a
donc fallu reprendre : le **verdict** (titre réécrit, préambule qui nomme la campagne), la **note
du graphe**, le **KPI** « Écart de cadence », et l'**alerte > 15 %** — qui passe de `bad` à `warn`
et change de ton : on ne crie pas au dérapage sur un chiffre d'histoire.

⚠️ **Le verdict devait être réécrit, pas préfixé.** Ses quatre branches sont au présent
(« l'équipe **a passé** », « la cadence **colle** ») et décriraient une période qui n'est pas celle
affichée. Ajouter un bandeau devant une phrase fausse ne la rend pas vraie.

**Le harnais** : 28 assertions, dont une **garde de montage** qui rougit si `_pecCadHisto` n'est
plus trouvée dans le fichier — sans elle, un renommage ferait verdir un harnais vide (§40).
**Cinq contre-épreuves**, chacune rouge sur le bon scénario : garde `hFaites>0` retirée · tracteur
non soustrait · marche 2 inconditionnelle · affichage muet sur la source · fonction renommée.

### 41c. Les trois autres entrées

**Entrée 9 — `_ecoRate` pondéré.** Un temps plein à 12 €/h pesait autant qu'un mi-temps à 14 €/h.
Pondération par les heures annuelles du gabarit. ★ **Repli sur `h=1` si `window._planGetRefH` est
absent** : le résultat redevient alors *exactement* l'ancienne moyenne par tête. Une pondération
dont le cas dégradé est l'ancien comportement ne peut pas régresser.

**Entrée 0e — les compteurs soldés.** Une carte par contrat terminé dans l'année civile, bornée par
`_planSurContrat(ctr, …)`. Le calcul était déjà juste — `_planInContractCtr` refusait déjà le mode
large, précisément pour ne pas mélanger deux compteurs. **C'est l'affichage qui était incomplet.**

**Entrée 3 — fusion des congés.** `openPlanCP(fromSel)`. `_pl2CpFromSel` pilotait déjà le
branchement interne : la fusion **rend explicite** ce qui était implicite, elle ne change rien.

**Entrée 0f — écartée : ce n'est pas du code.** La fin des *Vendanges* au 30/09 est une **donnée
Firestore**, à corriger dans Réglages › Saisons. ★ Une entrée de backlog technique qui n'a pas de
ligne de code à modifier doit être **déplacée**, pas traitée.

### 41d. ⚠️⚠️⚠️ LE FICHIER QUI NE TROUVE PAS SA PLACE — deux CI perdus

**Le code était juste. C'est la livraison qui a échoué, deux fois, en changeant de sens.**

J'ai livré **la source `guide/11-pilotage.html` ET le résultat `public/guide.html`**. Le dossier de
sortie étant **plat**, la source est partie sous le nom **`guide-11-pilotage.html`** — un nom qui
n'existe nulle part dans le dépôt.

| tour | source | généré | `--check` |
|---|---|---|---|
| 1 | ancienne (nom inconnu → non intégrée) | **neuf** | ❌ le généré est plus riche que sa source |
| 2 | **neuve** | ancien (revenu en arrière) | ❌ la source est plus riche que le généré |

★★★ **NE JAMAIS LIVRER UN FICHIER QU'UN SCRIPT FABRIQUE.** On livre l'entrée, on nomme la commande.
Détail et corollaires : §27d et règle d'or n°1.

★★ **Et le renommage s'annonce EN TÊTE DE RÉPONSE, en clair.** Il était dans une cellule de tableau
de placement. Personne ne lit une cellule comme une instruction.

### 41e. ★★★ LA RÈGLE D'OR N°5 — écrire en langage simple

**Demandée explicitement par Nico à la fin de cette session**, après le tutoriel de réparation du
guide. Elle est en tête de document, avec ses gestes concrets et son test.

⚠️ **Ce qui l'a rendue nécessaire est visible dans cette section même** : « le fichier généré
diffère de ses sources » est un diagnostic exact et **inutilisable**. Ce qu'il fallait écrire :
*« la page du guide en ligne ne correspond plus au texte que tu as écrit »*.

**Le vocabulaire se simplifie. Le raisonnement, jamais.** Les diagnostics restent complets, les
désaccords restent francs. Prendre Nico pour un débutant serait aussi raté que le noyer sous le
jargon — il a écrit cette application.

### 41f. Ce qui reste ouvert sur ce lot

- **`test:smoke` et `test:e2e` jamais joués** — le CDN Playwright est injoignable du bac à sable
  (`Failed to download Chrome for Testing`). **Trois écrans changent** : la carte du compteur
  d'heures, la carte « Rythme de dépense », les alertes de l'Économie.
- **La marche 2 n'a jamais tourné sur des données réelles.** Le harnais monte son propre décor.
  Chez MG, `HISTORIQUE` contient « Hiver 2025–2026 » — la première vraie preuve viendra de là.
- ⚠️ **`stats.hFaites` est arrondi à l'entier** par `_calcHistoStats`. Sans effet à cette échelle
  (des centaines d'heures), mais c'est une **perte de précision irréversible** au moment de
  l'archivage : à consigner si un jour un écart de cadence semble décalé de quelques dixièmes.

## 42. ★★★ LE CHANTIER ERGONOMIE DU PILOTAGE — DIX LOTS (15/08)

> ⚠️ **AUCUN NUMÉRO DE VERSION DANS CETTE SECTION, Y COMPRIS DANS SON TITRE.** Les sections §33 à
> §41 en portent — c'est une entorse tolérée à la **règle d'or n°2**, et elle a coûté cher : deux
> assertions de `harnais-claude-md.mjs` étaient figées sur « SW 6.66 » et « APP 6.13 », et ont rougi
> au bump suivant **en accusant le document alors que c'était le contrôle qui était périmé**.
> Corrigées le 15/08 : elles **lisent** les versions dans `utils.js` et `sw.js`.
> **Pour situer ce chantier : dix lots, neuf bumps, en une journée.** Les numéros exacts se lisent
> dans le changelog de `public/sw.js`, qui est leur seule source.

**Point de départ**, mot pour mot : *« Dans pilotage, j'aime beaucoup les informations disponibles.
Mais : j'ai l'impression que ce n'est pas rangé. C'est fouillis, on dépense du temps et de l'énergie
à chercher une info. Certains textes ne sont peut-être pas utiles à être affichés tout le temps
(infobulles ?). Améliore l'ergonomie et l'expérience utilisateur fois 100. »*

⚠️ **Le §34 avait déjà refondu ce module** (l'axe de zoom, la portée unique, le moteur de
diagnostic). Ce chantier-ci ne rejoue pas §34 : il traite ce que §34 n'avait pas touché — **la
densité, la hiérarchie typographique, et le texte**.

### 42a. Le diagnostic, mesuré sur le code

| ce que Nico voyait | ce qu'il y avait dessous |
|---|---|
| « ce n'est pas rangé » | **les 18 tuiles arrivaient OUVERTES**, et une tuile ouverte prend toute la ligne. La grille était réglée sur 2 à 4 colonnes et **ne se remplissait jamais** : le système de mise en page était désactivé par son propre réglage d'usine |
| « on cherche une info » | **28 tailles de texte** écrites à la main, de 8,5 à 40 px. Vingt-huit tailles, ce n'est pas une hiérarchie : c'est son absence. L'œil n'a aucun point d'accroche, alors il lit tout |
| « certains textes… tout le temps » | **≈ 25 000 caractères de prose** affichés en permanence, 217 phrases dans 60 fonctions — neuf pages A4. Et **AUCUN moyen d'en replier une seule** : zéro `<details>`, zéro infobulle, dans tout le projet |
| — | **cinq bandeaux** avant le premier chiffre. Mesuré au navigateur : **728 px sur téléphone**, pour un écran de 844 |

★★★ **LA CAUSE RACINE :** *le module ne distinguait pas **l'answer**, **ce qui la cadre**, et
**comment elle est calculée**.* Les trois avaient le même poids visuel, au même endroit.

### 42b. ★★★ LA RÈGLE DES TROIS FAMILLES

Écrite dans `utils.js`, au-dessus de `MV_INFO`, et appliquée aux huit onglets. **Toute phrase
affichée tombe dans une seule :**

| | quoi | où ça va |
|---|---|---|
| ① | ce qui **CADRE** le chiffre — sa date, sa source, son périmètre | **reste** à l'écran, en UNE ligne, toujours à la même place |
| ② | ce qui **EXPLIQUE le calcul** — méthode, conventions, biais assumés | derrière la pastille **« i »** : ça se lit une fois |
| ③ | ce qui **DIT QUOI FAIRE** | devient un **BOUTON**, pas un chemin à retenir |

⚠️⚠️ **CE N'EST PAS « CACHER LE TEXTE ».** La moitié de ces phrases est la **seule trace écrite**
d'une convention du domaine. Les supprimer serait la faute inverse, et plus grave : **un chiffre
sans son cadre ment** (§34, §41). **Rien n'a été supprimé** — 34 fiches conservent l'intégralité,
pour ≈ 20 000 caractères de méthode rangés.

★ **La signature visuelle de ① : un filet doré de 2 px devant la ligne.** Partout où ce filet
apparaît — carte, verdict, sous-titre —, la phrase qui suit dit **sur quoi le chiffre au-dessus a
été calculé**. C'est le seul élément que rien ne replie jamais.

### 42c. Les primitives créées

- **`MV_INFO` + `_mvInfoOpen(clé)` + `_mvInfoBtn(clé)`** (`utils.js`) et **`#ovInfo`** (`index.html`).
  Un seul écouteur **délégué** sur le document : aucun module n'a rien à brancher.
  ⚠️⚠️ **`stopPropagation` est indispensable** : la pastille vit dans un en-tête de tuile qui replie
  la tuile au clic. Sans lui, ouvrir la fiche **fermerait l'écran qu'on cherche à comprendre**.
  ★ Elle vit **à côté de `MV_AIDE`**, et pour la même raison : c'est ce fichier que la règle
  d'accompagnement (règle d'or n°4) couvre. Une fiche posée ailleurs vieillirait sans relecture.
  ★ `openOv('ovInfo')` : Échap, retour arrière, empilement de z-index et restauration du focus
  viennent gratuitement. **On ne réinvente pas un overlay.**
- **`_mvInfoSet(clé, fiche)` — les fiches VIVANTES.** Certaines explications citent des chiffres du
  moment (« 2 parcelles dépassent de 30 % ») : impossible à écrire d'avance.
  ⚠️ **On n'ouvre pas une porte à du contenu libre** : la clé reste **DÉCLARÉE** dans `MV_INFO` avec
  un repli honnête, et `_mvInfoSet` **refuse toute clé non déclarée** (trace en `'info'`). Le
  contrôle statique du harnais tient donc aussi sur les fiches dynamiques.
- **`_pecFiabCard(Z, R, cleFia, cleRem, okTxt, okSous)`** — **une carte, deux écrans.** Écrite pour
  la Synthèse d'Économie, elle répondait déjà à la question de l'Exercice. La ré-implémenter, c'était
  garantir qu'elles divergeraient. Elle prend ses clés en argument ; le harnais vérifie que les deux
  écrans **n'en partagent aucune** (une fiche vivante remplie par l'un s'afficherait sinon sous la
  pastille de l'autre).
- **`_pilTile(…, infoCle)` et `_pcavCard(…, infoCle)`** — argument **optionnel** en dernière
  position. Les 43 appels existants restent valides tels quels et posent leur pastille au fur et à
  mesure que leur fiche est écrite.

### 42d. La carte à trois étages, et le défaut qui s'inverse

`_pilTile` rend désormais **trois étages, tous dans `.pil-th`** — donc tous visibles carte repliée :
① l'étiquette (+ pastille + chevron) · ② **LE CHIFFRE**, seul sur sa ligne · ③ **la ligne de cadre**.

⚠️ **C'est l'unique justification du repli par défaut.** Si le chiffre ou son cadre tombaient dans le
corps, replier **cacherait** une information. Le harnais l'exige **en exécutant `_pilTile`** et en
cherchant la balise fermante qui correspond vraiment — sa première version découpait la source entre
deux motifs et restait **verte** quand on sortait le chiffre de l'en-tête.

★★★ **`_PIL_ST_V` — LA MIGRATION SANS LAQUELLE LE LOT EST INVISIBLE.** `_pilSaveState` grave l'état
**complet** dès qu'on touche une tuile, un onglet de graphe ou une case. MG et le second domaine avaient donc,
depuis des mois, un `collapsed` tout à zéro dans leur navigateur — et **au chargement, le mémorisé
gagne sur le défaut**. Changer le défaut sans marqueur ne leur aurait **strictement rien fait** :
installer la mise à jour, voir le même écran. C'est le piège déjà vécu avec `avc_etp` / `an_frise`.

- Un numéro de version d'état, monté d'un cran, et `_pilMigrEtat` repose la disposition **une fois**.
- ⚠️ **L'ORDRE COMPTE** : la migration passe **APRÈS** `_pilNormalize`, qui reconstruit l'objet à
  partir des clés connues et emporterait `v` avec lui — la migration se rejouerait sans fin.
- ⚠️ **Seule la DISPOSITION repart du neuf.** `show`, `pie`, `bar`, `sub` sont des choix de contenu :
  ils survivent. Vérifié **en exécutant la migration sur un état mémorisé réaliste**, pas en la
  relisant.
- ★ **Arbitrage tranché par Nico** (option A) : on repose la disposition pour tout le monde, une
  fois. Replier ne cache aucun chiffre, donc le seul « réglage perdu » est un choix qui n'a plus le
  même sens après le lot.

★ **Une seule carte dépliée à la fois**, sur toute la page — c'est ce qui rend ses colonnes à la
grille. ⚠️ Les autres sont fermées **par le même chemin d'état** : rien n'est fermé à l'écran sans
être écrit dans `collapsed`, sinon le rendu suivant rouvre.

### 42e. L'échelle de texte — onze pas nommés

28 valeurs en dur → **11 pas nommés par leur rôle**, 259 appels réécrits.
`hero 40 · xxl 31 · xl 27 · lg 23 · md 20 · sm 17 · base 14 · txt 12,5 · micro 11 · lbl 10,5 · nano 9,5`

- **Aucun déplacement ne dépasse 1 px** — le script s'arrête tout seul si un mouvement l'excède.
  117 occurrences ne bougent pas, 113 de 0,5 px, 29 de 1 px.
- ⚠️⚠️ **CHAQUE APPEL PORTE SON REPLI** : `var(--pt-txt,12.5px)`, jamais `var(--pt-txt)`. Une
  variable inconnue rend la déclaration **invalide** : le navigateur la jette et le texte retombe à
  la taille héritée, **en silence et partout à la fois**. Le repli protège un client dont le
  `styles.css` serait en retard sur le JS. **Vérifié dans un vrai navigateur, avec et sans feuille.**
- ★ L'échelle a d'abord vécu dans `_pilCssV2()` pour être livrée **sans bump**, puis a remonté dans
  `styles.css` au premier lot qui bumpait — avec `_PIL_SEM` (dette §34i soldée).
  ⚠️ **Le harnais du premier lot est alors passé à 13 rouges.** C'est exactement son travail : il
  vérifiait que l'échelle était déclarée dans `_pilCssV2`. **Un déménagement doit faire rougir.**

### 42f. ⚠️⚠️⚠️ LA LEÇON DU CHANTIER : LES ASSERTIONS FAUSSES

**Sur dix lots : zéro bug livré, et une quinzaine d'assertions fausses de ma main.** Toutes de la
même famille — **elles mesuraient autre chose que ce qu'elles annonçaient**. Le catalogue, parce
qu'il se répétera :

| la faute | l'exemple vécu |
|---|---|
| **« au moins une fois » au lieu de compter** | `_mvInfoBtn(cleFia)` cherché une fois : retirer la pastille de la branche « il manque des postes » restait **vert** grâce à la branche « tout va bien » — or c'est dans le cas problématique qu'on en a besoin |
| **idem, sur deux chemins d'appel** | `_pilLoadState` a **deux** chemins (clé utilisateur, clé domaine). La contre-épreuve n'en abîmait qu'un, et deux assertions restaient vertes |
| **piège de préfixe** | `/function _pecZeros/` est satisfait par `_pecZerosX`. Renommer une fonction en lui ajoutant une lettre passait au vert |
| **idem sur un sélecteur CSS** | `/\.pil-souslig\{/` était satisfait par la règle du **bloc mobile**, qui porte le même sélecteur |
| **chercher une phrase dans du texte échappé** | un `!includes` sur `la valeur de la r\u00e9colte` est vrai dès qu'un niveau d'échappement diverge — **donc toujours vert**. Remplacé par une **mesure de longueur**, qui ne peut pas se tromper de niveau |
| **motif trop naïf sur du JS** | `[^)]*` s'arrête au premier `)` de `==='function'?(` — la famille §34g |
| **découper la source au lieu de l'exécuter** | la tranche entre deux motifs englobait les deux cas : sortir le chiffre de l'en-tête restait vert. **On appelle la fonction, on lit le HTML rendu** |
| **lire un commentaire** | la phrase déplacée survivait dans le commentaire qui documente son déplacement (§34g, dans l'autre sens) |

★★★ **ET LE SYMÉTRIQUE, PLUS INSIDIEUX : LE DÉFAUT MAL CONSTRUIT.** Deux contre-épreuves
remplaçaient une phrase courte par une **autre phrase courte** : le bloc ne redevenait pas un pavé,
donc la mesure de longueur avait **raison** de rester verte. **§34h : vérifier que le défaut
reproduit la vraie régression, pas seulement qu'il change quelque chose.** Un défaut qui touche le
mauvais endroit accuse le harnais à tort — vécu aussi avec `capacite:1,`, qui existe dans **deux**
blocs (`collapsed` et `prs_capacite` de `show`) : le remplacement tombait dans le mauvais.

> **Le geste qui en découle, ajouté à toutes les contre-épreuves du chantier :**
> elles impriment désormais **le numéro de la ligne modifiée**. Un défaut qui atterrit ailleurs
> qu'attendu se voit immédiatement, au lieu de faire accuser une assertion correcte.

### 42g. ★★★ MESURER — ET CE QUE LE FICHIER NE PEUT PAS DIRE

**J'ai voulu donner un chiffre global** : « pavés de plus de 150 caractères dans `pilotage.js` »,
52 au départ, 30 à la fin. **Ce chiffre ne veut presque rien dire**, et il fallait le dire : les
paragraphes déplacés sont **toujours des chaînes dans le même fichier**, simplement rendues dans une
feuille au lieu de l'écran. **Un comptage sur le fichier ne peut pas faire la différence.**

★ **Le seul chiffre honnête s'obtient en EXÉCUTANT l'écran**, ancienne et nouvelle version sur le
**même état**, puis en comptant le texte rendu :

| écran | avant | après |
|---|---|---|
| Économie › « Ce qu'il faut regarder » | 1 288 car. | **185** (−86 %) |
| Économie › Exercice, en tête d'écran | 1 828 car. | **341** (−81 %) |
| Sous-titres de cartes d'Économie | 1 185 car. | **272** (−77 %) |
| Le verdict, moyenne des 8 branches | 318 car. | **203** (−36 %) |
| Onglet Équipe & matériel, hauteur (ordinateur) | ~2 080 px | **237 px** replié, 4 colonnes |
| **Jusqu'au premier chiffre (téléphone)** | **728 px** | **442 px** (−39 %) |

⚠️ **Un lot a mesuré une hausse et je l'ai annoncée** : le sous-lot « Équipe & matériel » a fait
**monter** le texte à l'écran de 313 caractères, parce que les lignes de cadre et les textes de
boutons sont plus longs que les phrases de méthode sorties. **La nature du texte avait changé, pas
son volume.** Un chantier qui n'annonce que ses bonnes mesures ne mesure pas, il plaide.

### 42h. ⚠️⚠️ CE QU'AUCUN CONTRÔLE AUTOMATIQUE NE VOIT

**Trois défauts trouvés uniquement en regardant une capture d'écran.** Le preflight, les harnais, la
CI : aucun ne lit une mise en page.

1. **Le `<b>` qui devient son propre item flex.** Dans un conteneur `display:flex`, **chaque élément
   enfant est un item séparé** : le `<b>` du nom de campagne formait sa propre colonne et coupait la
   ligne de cadre en trois morceaux. **Correctif : envelopper le texte dans un `<span>`.**
   ★ Le même piège est **impossible sur les cartes** : `_pilTile` **échappe** son sous-titre, donc
   aucune balise n'y devient un item — et le harnais vérifie que ça reste vrai.
2. **La carte à `width:100%` dans une frise.** En passant les quatre photos en bande horizontale, la
   première occupait presque toute la largeur : la règle de base porte `width:100%`, qu'il fallait
   neutraliser.
3. **Un CSS extrait par expression régulière.** Ma première fumée visuelle d'Économie découpait
   `_pecCss` au regex : elle cassait sur les apostrophes échappées et rendait une feuille **mutilée**
   — la capture montrait du texte nu, et j'aurais pu conclure à un défaut de style.
   ★ **Correctif de méthode, valable partout** : on **exécute** `_pecCss()` avec un faux `document`
   et on récupère ce qu'elle pose vraiment. *Exécuter, ne pas relire* — la même règle que pour
   `WHATS_NEW`, `MV_INFO` et la migration d'état.

### 42i. Les autres pièges du chantier

- ⚠️⚠️ **DEUX « ok » POUR ZÉRO OCTET ÉCRIT.** Un script de patch a affiché « ok cuivre » et
  « ok IFT », puis l'assert du motif suivant a levé — et **l'écriture, placée en fin de script,
  n'a jamais eu lieu**. **Correctif : écrire après CHAQUE motif, et relire le disque pour
  confirmer.** C'est la variante silencieuse du §25.
- ⚠️ **Une contre-épreuve a laissé les fichiers abîmés sur le disque** : l'assert « défaut non
  injecté » tombait **après** avoir posé la version abîmée. Repéré en relisant `git status`, pas
  parce que quelque chose avait rougi. **On repose la référence AVANT de s'arrêter.**
- ⚠️ **J'ai inventé une constante.** `PIL_TREAT_DAYS` n'existait nulle part ; `node --check` ne voit
  pas un identifiant inconnu, seule l'exécution l'aurait levé. L'horizon était en dur dans un
  `slice(0,5)` : il porte maintenant un nom.
- ⚠️ **Un cliquet à l'envers, dans un contrôle EXISTANT.** `A8` de `mv-harnais-audit-pil` vérifiait
  qu'il y a **exactement** 8 boutons de redirection : il rougissait donc dès qu'on en **ajoutait**
  un — c'est-à-dire chaque fois qu'on faisait ce qu'il existe pour encourager. Converti en vrai
  cliquet : **le compte ne doit jamais descendre.**
- ⚠️ **Une ancre de patch a échoué sur une casse** : le fichier écrit `\u203A`, j'avais écrit
  `\u203a`. L'assert a arrêté le script — c'est son travail.
- ★ **`pilotage.js` n'avait AUCUN import** : il lisait tout depuis `window`. Ça marche parce que
  l'ordre de chargement met `utils.js` en premier — et « un appel qui marche par ordre de chargement
  n'est pas un appel correct ». `_PIL_SEM` et `_mvInfoBtn` y arrivent par un **vrai import**.

### 42j. Le chrome — ce qu'on traverse avant le premier chiffre

**Mesuré en montant le VRAI squelette** (`_pilSkeleton` exécuté avec des bouchons) et en le rendant
au navigateur. Sur téléphone : masthead 200 · fil d'Ariane 68 · onglets 59 · photos 259 · titre 52.

- **Le bandeau de titre disparaît.** `<h2 class="pil-h2">` répétait **mot pour mot** l'onglet actif,
  en 26 px, sur deux lignes en mobile. La barre d'onglets le dit déjà, en surbrillance. Le
  sous-titre des libellés longs descend en une **ligne fine** ; « Choisir les indicateurs » y rejoint
  la **roue crantée**. ⚠️ **`#pil-gear` garde son nom** : `_pilBind` le retrouve.
- **Les quatre photos passent en frise** sous 700 px. ⚠️ Elles restent **quatre** et restent
  **visibles** : on ne remplace pas quatre chiffres par un bouton « voir les chiffres ». Le
  harnais porte une assertion pour ce cas précis.
- **L'instruction « cliquez une campagne pour zoomer » quitte la barre COLLANTE** sur téléphone :
  une ligne qu'on apprend une fois n'a pas à occuper chaque écran en permanence. **Sur grand écran
  elle reste** — la place ne manque pas.

★ **C'est ce lot qui a rendu fausse la phrase « conçu pour le grand écran »** de la fiche d'aide et
du guide. Elle était vraie, elle a été **laissée volontairement périmée** pendant tout le chantier,
et **réécrite par le lot qui la périme** — jamais par un lot « de finition ».

### 42k. Ce qui reste ouvert

- ⚠️ **`npm run lint` et ESLint n'ont jamais tourné côté Claude** de tout le chantier :
  `node_modules` est absent du bac à sable, et l'échec est identique sur la base d'origine.
  **À lancer chez Nico avant de pousser.**
- ⚠️ **Les rendus de Simuler et de Cave sont vérifiés par assertion mais n'ont pas été REGARDÉS**
  (budget d'outils épuisé sur ce lot). Vu que trois défauts du chantier n'ont été trouvés que par
  l'œil, **c'est le point faible du paquet** — en particulier l'étape 2 du simulateur, dont la
  légende a été remaniée.
- **Le doublon `_pilDiag` / `_pecZeros`** : les deux portent un constat voisin sur « pas de taux
  horaire », à deux endroits de la même page. C'est §34 en plus petit. **Fusion = chantier de
  moteur, pas d'ergonomie.**
- **Les filtres cépage / commune** (§34i-1) et **la carte colorée par avancement** (§34i-3) restent
  non livrés, pour la raison d'origine : un filtre qui change la liste sans changer les chiffres est
  un décor.

## 43. ★★★ LE CHIFFRE QUI MENT, ET LE BANC QUI MANQUAIT (14-15/08 — `pilotage.js` seul, aucun bump)

**Point de départ** : une capture d'écran et six mots. *« qu'est-ce qu'il se passe ? c'est quoi
cette valeur ??? »* L'accueil affichait **« -202 j de retard »** et **« cadence mesurée ×2,93 »**
sur un domaine de 12,5 ha qui, la veille, affichait **un jour d'avance**.

**La régression venait du lot livré le matin même** — la marche 2 de l'escalier de cadence (§41b).

---

### 43a. ⚠️ LE DIAGNOSTIC S'EST TROMPÉ, ET IL A ÉTÉ ANNONCÉ AVANT D'ÊTRE MESURÉ

**Premier diagnostic livré à Nico (faux)** : *« le rapport présence/barème compte toute la cave
pendant les vendanges, d'où le ×2,93 »*. Cohérent, plausible, **entièrement inventé**. Il reposait
sur une lecture du code et sur zéro donnée.

**Ce que l'export réel a montré, le lendemain** :

| mesuré sur les données de MG | valeur |
|---|---|
| saison active | `Vendanges`, début **2026-08-01** |
| sa position sur l'axe campagne | **0** (l'axe s'ouvre le 1er août) |
| période appariée par `_pilCmpSnapshot` | **`Hiver 2025–2026`** |
| sa position sur l'axe | **61** |
| écart / tolérance | 61 ≤ **75** → accepté |
| **recouvrement réel des deux périodes** | **0 %** |
| dénominateur `stats.hFaites` | **787 h** |
| **achèvement de la période appariée** | **32 %** |

★★★ **Le code appariait un HIVER à une VENDANGE.** Pas la cave : un appariement absurde, plus un
dénominateur amputé. Le ×2,93 = présence de six mois d'hiver ÷ le tiers de travail qui avait été
validé.

★ **La leçon n'est pas « je me suis trompé »** — c'est *« j'ai livré une explication à un client
sans l'avoir mesurée »*. Une hypothèse plausible énoncée sur le ton du constat vaut faux témoignage.
Le mot manquant tenait en trois lettres : **« sans doute »**.

---

### 43b. Pourquoi la tolérance de 75 jours ne protégeait pas

Le commentaire de `_PIL_CMP_TOL` affirmait : *« 75 jours … sans jamais confondre un printemps avec
un hiver (151 jours d'écart sur l'axe) »*. **Exact — et calibré sur cette seule paire.**

L'axe campagne s'ouvre le **1er août**. Une vendange qui démarre ce jour-là est à l'offset **0** ;
un hiver ouvert le 1er octobre est à **61**. La paire vendange/hiver n'a **jamais été vérifiée**.

★★★ **Un garde-fou calibré sur un exemple protège de cet exemple.** Il faut l'éprouver sur toutes
les paires que les données peuvent produire, pas sur celle qu'on avait en tête en l'écrivant.

⚠️ La borne `k ∈ [0,5 ; 3]` n'a pas rattrapé non plus : **2,93 passe à 0,07 près**. Et son propre
commentaire annonçait le cas — *« un facteur hors bornes ne mesure plus une cadence, il mesure un
trou de saisie »*. C'était exactement un trou de saisie, et la borne l'a laissé passer.

---

### 43c. Les trois correctifs

| # | correctif | effet |
|---|---|---|
| 1 | `cadAppl` — **seule la marche 1 pilote une projection** | l'écart historique reste *lu*, il ne multiplie plus ni charge ni budget |
| 2 | `_pilCmpRecouvre` ≥ **50 %** | deux périodes homologues **se recouvrent** ; la distance entre leurs débuts ne suffit pas |
| 3 | `_pilCmpAcheve` ≥ **80 %** | une période archivée incomplète n'est plus une référence |

**Cinq sites de projection gardés** : facteur `k` de la date, budget projeté, ligne de fin du
graphe, sa légende, KPI budget de l'accueil.

⚠️ **Le cinquième avait été oublié le matin.** §41b annonçait « quatre points d'affichage repris
pour annoncer la source » — **les quatre étaient dans l'onglet Économie**. Le verdict et le KPI de
l'**accueil** disaient toujours « cadence mesurée ×2,93 » au présent. **La faute de §34, commise sur
les deux premiers chiffres que voit l'utilisateur.**

★ **Compter les sites ne suffit pas : il faut les situer.** « J'en ai traité quatre » ne dit rien si
les quatre sont sur le même écran.

**Non-régression vérifiée** : `Saison verte 2027` trouve toujours `Printemps 2026` — recouvrement
100 %, achèvement 100 %. *Un correctif qui bloque tout est aussi faux qu'un correctif qui apparie
tout.*

---

### 43d. ★★★ LE BANC DE CHIFFRES — `scripts/banc/`

**La vraie faille n'était pas dans la cadence.** C'était : *rien ne surveille les valeurs
affichées.* Le preflight contrôle la **forme** — sélecteurs, ancres, `catch{}`. L'accueil pouvait
passer de +1 j à -202 j sans qu'une ligne rougisse.

| fichier | rôle |
|---|---|
| `scripts/banc/extrait.mjs` | découpe les **fonctions réelles** de `src/pilotage.js` (équilibre d'accolades, chaînes et commentaires sautés) et les exécute sur un faux `window` |
| `scripts/banc/banc.mjs` | mesures + valeurs figées + règles de bon sens + scénarios |
| `scripts/banc/instantane.json` | données réelles **réduites et anonymisées** (1,6 ko) |
| `scripts/banc/baseline.json` | les chiffres gravés |
| `scripts/banc/garde-projection.mjs` | 18 assertions sur les gardes de projection |
| `scripts/banc/LISEZ-MOI.md` | notice |

Branché sur `npm run check` **et** `prebuild` : il tourne avant chaque build.

    npm run banc                              contrôle
    node scripts/banc/banc.mjs --engraver     re-graver un changement VOULU

**Deux mécanismes, pas un** :
- **valeurs figées** — « ça a changé ». Seules, elles auraient gravé -202 j comme référence.
- **règles de bon sens** — « c'est faux ». Vraies quelles que soient les données.

⚠️ **Aucune règle n'exige qu'un appariement soit trouvé.** Exiger qu'on trouve toujours un homologue,
c'est le travers d'origine : **plutôt rien que n'importe quoi**.

⚠️ **Le banc n'utilise jamais une copie de la fonction qu'il mesure** (§40). Une copie diverge au
premier lot et verdit sur du code mort.

---

### 43e. ★★★ QUATRE CONTRE-ÉPREUVES VERTES À TORT — DEUX GARDES QUI SE MASQUENT

Premier jeu de contre-épreuves sur les correctifs 2 et 3 : **retirer le recouvrement → vert.
Retirer l'achèvement → vert. Neutraliser le seuil → vert.** Le banc semblait ne rien protéger.

**Explication** : les deux gardes rejetaient déjà l'`Hiver` **chacune séparément**. En retirer une
ne changeait pas le résultat. Le banc ne mentait pas — il ne pouvait pas distinguer laquelle
protégeait.

★★★ **Deux gardes redondantes sur le même cas sont chacune non testables.** Il faut un scénario
où **une seule** peut jouer :

| scénario | archive | attendu |
|---|---|---|
| `scenario_garde_recouvrement` | achevée à **100 %**, disjointe | `null` — seul le recouvrement peut rejeter |
| `scenario_garde_achevement` | recouvrante à **100 %**, close à **32 %** | `null` — seul l'achèvement peut rejeter |
| `scenario_temoin_acheve` | recouvrante, close à **95 %** | apparié — la garde ne bloque pas tout |
| `scenario_legitime` | données réelles | `Printemps 2026` |

Après ajout : **8 contre-épreuves, 8 rouges.** Le cas nominal reste sur données réelles ; les
scénarios ciblés sont synthétiques **et assumés comme tels** — ils ne mesurent pas un domaine, ils
prouvent que chaque garde mord.

---

### 43f. ⚠️⚠️ L'EXPORT JSON EST INCOMPLET — À REFAIRE

`src/reglages.js:3078` exporte **8 collections sur les 24** de `COLLECTIONS` (`src/firebase.js:232`).

**Ce que l'export contient** : `parcelles`, `journal` (hors météo), `sessions`, `traitements`,
`membres` *(réduits à `nom`/`roles`/`statut`)*, `saisons`, `taches`, `historique`.

**Ce qui manque — et qui bloque le banc :**

| clé absente | ce qu'on ne peut pas recalculer sans elle |
|---|---|
| `planning_entries` | **la présence** — numérateur de tout écart de cadence |
| `planning_templates` | les heures contractuelles, la capacité |
| `planning_acomptes`, `planning_hsup` | la masse salariale réelle |
| `travaux` | la charge restante, le % d'avancement |
| `config` | `CONFIG.eco`, `objectifs_fin`, `task_windows` — le budget et l'objectif |
| **contrats des membres** | l'effectif au pic, les dates d'entrée/sortie |
| `paie` | les taux horaires — **admin-only** en lecture (`firestore.rules`) |

★★★ **Conséquence directe : le chiffre le plus gros de l'accueil — la marge en jours — n'est
surveillé par personne.** Le banc attrape ce qui a dérapé cette fois-ci, pas la famille entière.

**À faire :**

1. **Refondre `exportJSON`** pour couvrir les 24 clés de `COLLECTIONS`. Ne pas maintenir deux
   listes : **dériver la liste d'export DE `COLLECTIONS`**, sinon toute clé future sera oubliée en
   silence — c'est exactement ce qui s'est produit ici.
2. **Cesser de tronquer `membres`.** La réduction à `{nom, roles, statut}` était une précaution
   RGPD ; elle ampute l'export de tout le modèle contractuel. Remplacer par un **choix explicite à
   l'export** : *« avec les données de paie »* / *« sans »*.
3. **`paie` : jamais dans un export par défaut.** Taux nominatifs. Case à cocher séparée, admin
   uniquement, et mention dans le fichier produit.
4. **Monter la version d'export** — elle est figée à `'4.7'` alors que le format changera.
5. Une fois l'export complet : **étendre le banc** à la marge en jours, la date de fin, le budget
   projeté et l'effectif au pic, puis **graver la référence sur un état connu bon** (par ex. l'état
   du 13/08, qui affichait « +1 j d'avance »).

---

### 43g. ⚠️ VÉRIFIER LA PERSISTANCE CLOUD — TOUS LES CLIENTS

**Côté code, c'est bon** — vérifié le 15/08 :

- `saveData` (`src/app.js:702`) construit bien `planning_templates`, `planning_entries`,
  `planning_acomptes`, `planning_hsup`, `travaux`, `config`, `membres` complets.
- `COLLECTIONS` (`src/firebase.js:232`) les lit toutes au démarrage.
- `FB_REALTIME` (`:272`) inclut les quatre clés de planning.
- `fbSave` écrit **une clé par document**, sans liste blanche restrictive.

⚠️ **Mais du code correct ne prouve pas que les documents existent chez chaque client.** Un domaine
qui n'a jamais ouvert un module n'a pas son document — et personne ne s'en apercevra tant que le
sujet ne devient pas critique.

**Vérification à mener, tenant par tenant** (`marchand-grillot`, `domaine-chapelle-et-fils`, puis
tout nouveau slug à la fin de sa mise en route) :

1. Console Firestore → le doc de chaque tenant → **présence ET non-vacuité** de : `planning_entries`,
   `planning_templates`, `travaux`, `config`, `membres`, `historique`.
2. Pour `config` : vérifier que `CONFIG.eco` et `objectifs_fin` sont **renseignés**, pas seulement
   présents. Un `{}` passe tous les tests d'existence et ne pilote rien.
3. Pour `membres` : vérifier que **les contrats sont là**, pas juste les noms.
4. `paie` : présent ? Sinon les taux ne sont nulle part, et toute l'Économie tourne sur des valeurs
   par défaut **sans le dire**.

★ **À inscrire dans la procédure de mise en route** (§27f) : la dernière étape d'une installation
est de vérifier que les six clés existent et sont peuplées. Une installation « finie » avec un
`config` vide est une installation qui mentira dans trois mois.

★ **Piste** : une vérification automatique côté app — au chargement, si une clé attendue est absente
ou vide, une entrée `logError` de niveau `warning`. Elle remonte dans « Signaler un problème » sans
déranger l'utilisateur.

---

---

### 43i. ★★★ LE FICHIER COMPLET LIVRÉ DEPUIS UN CLONE PÉRIMÉ — 638 LIGNES ÉCRASÉES

**L'incident** : le CI rougit sur `mv-harnais-echelle.mjs`, **2 rouges** — *« 240 tailles en dur »*
et *« les onze pas déclarés sans emploi »*. Mesure immédiate sur les deux commits :

| | `7a509b4` (avant) | `c638402` (mon lot) |
|---|---|---|
| lignes de `pilotage.js` | **9 621** | 8 983 |
| `var(--pt-…)` | **254** | **0** |
| `font-size:NNpx` en dur | 0 | **240** |

★★★ **Le lot d'échelle typographique du 15/08 avait purement disparu.** Et `CLAUDE.md` avec lui :
**6 956 → 6 667 lignes**, la §42 de Nico — *« LE CHANTIER ERGONOMIE DU PILOTAGE — DIX LOTS »* —
**écrasée par une section portant le même numéro**.

**La cause** : le clone datait du **début de la session**. Nico a intégré, puis poussé deux lots
(`harnais`, `demo`) pendant qu'on travaillait. Le `pilotage.js` livré ensuite était un fichier
**complet** bâti sur cette base morte : il n'a pas fusionné, il a **remplacé**.

★★★ **UN FICHIER COMPLET N'EST PAS UN PATCH. Il emporte tout ce qu'il ignore.** Le mode de
livraison du projet — fichiers entiers via `present_files` — est **structurellement destructeur**
dès que la base a bougé. Plus le fichier est gros, plus la perte est silencieuse : ici 638 lignes,
sans un conflit Git, sans un avertissement.

⚠️ **La consigne existait déjà** — *« si Nico dit avoir poussé un changement, `git pull` avant de
faire confiance au contenu »*. Elle attendait que Nico le dise. **Il n'a rien à dire : c'est son
dépôt.** La règle corrigée :

> ★★★ **AVANT TOUTE LIVRAISON D'UN FICHIER COMPLET : `git fetch` et comparer `HEAD` distant au
> commit du clone.** S'ils diffèrent, re-cloner et **réappliquer** les patchs sur la base fraîche.
> Jamais livrer un fichier bâti sur une base dont on n'a pas revérifié l'âge **au moment de la
> livraison** — pas au moment du clone.

**Signes qui auraient dû alerter, et qui étaient sous les yeux :**

1. `applic` était **déjà présent 5 fois** dans la base distante — donc le lot précédent avait été
   intégré, donc **il y avait eu des commits**. Constaté et non interprété.
2. `pilotage.js` faisait **8 917 lignes** au clone et **9 621** en amont. La différence était
   lisible dans n'importe quel `wc -l`.
3. Le harnais `mv-harnais-echelle.mjs` **n'était pas dans mon inventaire des filets** — il est
   apparu au commit `harnais`, postérieur au clone. Son absence était elle-même la preuve.

★ **Trois indices concordants, aucun relevé.** L'inventaire des filets avait été fait *une fois*,
au début, et jamais rafraîchi.

**Réparation** : reprise de `7a509b4`, réapplication des deux correctifs d'appariement (39 lignes),
`CLAUDE.md` restauré et la section renumérotée **§43**. Vérifié après reprise :

| contrôle | résultat |
|---|---|
| `mv-harnais-echelle.mjs` | **25 vertes, 0 rouge** |
| `var(--pt-…)` | **254** rétablis |
| `font-size` en dur | **0** |
| banc de chiffres | vert |
| gardes de projection | 18 vertes |

⚠️ **`mv-harnais-echelle.mjs` n'était lancé que par le CI**, pas par `npm run check`. Le rouge n'a
donc été visible **qu'après le push**. Il est désormais dans `check` et `prebuild` — un filet qui ne
tourne qu'en CI laisse pousser la faute avant de la signaler.

★★★ **Un inventaire des filets se refait à chaque livraison, pas à chaque session.** Et il se lit
depuis le **workflow CI**, pas seulement depuis `package.json` : le CI lançait un harnais que
`npm run check` ignorait.

---

### 43h. Ce qui reste ouvert

- ⚠️ **La marge en jours n'est toujours pas surveillée** — bloqué par 42f.
- **`test:smoke` / `test:e2e` jamais joués** (CDN Playwright injoignable du bac à sable). Trois
  écrans changent : verdict d'accueil, KPI budget, alertes de l'Économie.
- **Après correctif, MG n'a plus aucune période comparable** : l'`Hiver` est disjoint, le
  `Printemps` trop loin. L'écran affiche « Aucune saison comparable archivée ». **C'est le
  comportement juste** — mais à confirmer de visu chez Nico.
- **`Hiver 2025–2026` est archivé à 32 %.** Le correctif l'écarte, il ne le répare pas. Question de
  fond : faut-il **empêcher de clôturer** une saison très incomplète, ou au moins le signaler ?
- ⚠️ **`stats.hFaites` arrondi à l'entier** par `_calcHistoStats` — déjà noté en §41f, toujours vrai.
- **Rejouer les contre-épreuves du 14/08 soir** (les 6 sur `cadAppl`) : elles ont été écrites avant
  les correctifs 2 et 3, la redondance a pu en rendre certaines aveugles. Même piège qu'en 42e.

---

## 44. ★★★ L'AUDIT DE DÉRIVE DU DOCUMENT (16/08 — aucun code touché)

**Point de départ, une phrase de Nico** : *« Que reste-t-il à faire ? Compare ce qui est écrit dans
CLAUDE.md et les fichiers de l'app. »* Pas un chantier — **un contrôle du porteur de vérité
lui-même**. Le dépôt a été cloné, les 7 326 lignes de ce document relues, et **chaque affirmation
vérifiable confrontée au fichier qu'elle décrit**.

**Verdict** : le document décrivait bien l'architecture, les arbitrages et les leçons. **Il décrivait
mal l'état.** Onze entrées de backlog demandaient du travail déjà fait, quatre chiffres avaient
grossi sans que personne le voie, et neuf filets de test sur vingt-six ne peuvent pas démarrer.

> **État lu le 16/08 : APP 6.25 · SW 6.79.** *(À relire dans les fichiers à chaque session, jamais
> depuis ici — c'est précisément la faute que cet audit documente.)*

★★★ **LA LEÇON D'ENSEMBLE, ET C'EST LA TROISIÈME FOIS QU'ELLE S'ÉCRIT.** L'audit du 11/08 la posait
déjà : *« un backlog non audité dérive DANS LES DEUX SENS »*. Elle est restée vraie **cinq jours de
plus**, avec les mêmes symptômes. Ce qui change au 16/08, c'est qu'on peut nommer **pourquoi** : les
consolidations de fin de session écrivent ce que le lot vient de faire, **elles ne relisent pas ce
que les lots précédents ont rendu caduc**. Écrire est un réflexe ; **relire n'en est pas un**.

---

### 44a. L'entrée qui se périme toute seule

La première ligne du backlog technique, trois étoiles, était :

> *0a. ★★★ **DÉPLOYER — APP 6.06 · SW 6.56.** […] Livrés, preflight 0/0, harnais verts, **jamais mis
> en ligne**. […] Tant que ce n'est pas fait, les clients lisent encore « manque 15,8 ETP » sur une
> vendange couverte.*

Le dépôt porte **dix-neuf versions APP et vingt-trois versions SW de plus**. Tout §37, §38, §40,
§41, §42 et §43 s'est déposé par-dessus. Le paquet était déployé depuis longtemps.

★★★ **Ce qui rend cette entrée particulière** : toutes les autres décrivent un travail à faire, qui
reste à faire tant que personne ne le fait. **Celle-là décrit un fait extérieur** — l'état du monde.
Elle ne s'use pas par l'inaction : **elle devient fausse toute seule**, et elle occupe la première
place du backlog en criant sur un fait qui a cessé d'être vrai.

→ **RÈGLE POSÉE** : *toute entrée « à déployer » se relit en tête de session*, en comparant les
numéros qu'elle cite à `APP_VERSION` (`src/utils.js`) et `CACHE_NAME` (`public/sw.js`). Si elle cite
plus bas, elle part — **sans débat, avant de lire le reste du backlog.**

★ **Corollaire** : ne jamais écrire une entrée « à déployer » **sans y inscrire les deux numéros**.
Une entrée qui dit « à déployer » sans dire *quoi* ne peut pas se périmer proprement — elle se
contente de vieillir.

---

### 44b. Onze entrées rayées — le code les avait déjà réglées

Chacune vérifiée dans le fichier, pas dans un changelog.

| # | Entrée | Preuve au 16/08 |
|---|---|---|
| 2 | `rewrite` en ligne | `firebase.json` l.19 **et** l.26 — les deux `/api/` y sont |
| 4 | `_findDebutTache` sans borne | `app.js:3572` résout par `_saisonForDate` / `_mvCampagneDe` |
| 5 | Breakpoint 760 → 767.98 | `@media(max-width:767.98px)` existe, le trou est bouché |
| 8 | `pic` mort dans `_rfCtx` | purgé, commentaire de purge l.3193 |
| 13 | « un 14ᵉ moment de démo » | la visite en compte **19** (`harnais-demo`) |
| 15 | Règle CSS `.cave-tabs` | 0 occurrence dans `styles.css` |
| 23 | UI d'activation d'essai | `agt-trial-input`, `admin-gt.js:1299-1310` |
| 24 | Fusion de fûts à l'édition | `_futSameLot` + `dup.qte += qte` dans `_rsvSaveFut` |
| 41 | `--texte-doux,#8B8175` ×44 | **0** occurrence |
| 0a-bis | `!P.length` | `utils.js:2936` porte `return true;` |
| 0c-ter | `_PIL_SEM` hors module | défini `utils.js:1968`, importé `pilotage.js:15` |

★★ **Trois de ces onze étaient déjà réglées AU MOMENT de la consolidation du 15/08** (0a-bis par
§39g, 5 et 15 par §42). **La consolidation les a recopiées sans les relire** — c'est le mécanisme
exact de la dérive, pris sur le fait.

★★★ **UN NUMÉRO DE LIGNE VIEILLIT PLUS VITE QU'UN CHIFFRE.** Les entrées citaient
`app.js:3116`, `utils.js:2449`, `styles.css:2084`, `reserve.js:324`, `styles.css:1447`,
`admin-gt.js:2704` — **aucun n'était encore juste.** Les fonctions ont bougé de 100 à 500 lignes.
→ **Citer le NOM d'abord, la ligne ensuite et entre parenthèses.** Un `grep` sur `_findDebutTache`
trouve la fonction pour toujours ; un `sed -n '3116p'` ne trouve rien après le prochain lot.

★★ **ET UN COMMENTAIRE QUI DÉCRIT UN DÉFAUT NE PART PAS AVEC LE DÉFAUT.** L'entrée 24 s'appuyait sur
*« `reserve.js:324` porte le commentaire qui décrit exactement ce qui manque »*. Le commentaire est
toujours là — mais il décrit désormais **l'intention du code au-dessous**, pas un manque. Le défaut,
lui, est corrigé. **Ne jamais conclure à l'absence en lisant un commentaire : lire la fonction.**
(Même famille que `mvprint.py` et le lot DOCK : *varier la méthode avant de conclure.*)

---

### 44c. ★★★ Neuf harnais sur vingt-six ne peuvent pas démarrer

**C'est le constat le plus grave de l'audit**, et il n'était nulle part au backlog. Chaque script de
`scripts/` a été lancé un par un, et son **code de sortie réel** relevé.

| Script | État | Cause |
|---|---|---|
| `harnais-bandeau-essai` | **2 rouges / 15** | fige `APP_VERSION` à `6.13` · chemins en dur |
| `harnais-cadence-escalier` | **1 rouge / 28** | règle d'alerte antérieure · chemins en dur |
| `harnais-claude-md` | **1 rouge / 23** | ce document se déclare périmé · chemins en dur |
| `harnais-vitrine` | **ENOENT** | `logiciel-vigne.html` relatif au `cwd` |
| `contre-epreuves` | **ENOENT** | idem |
| `harnais-essai-borne.cjs` | **crash** | `firebase-admin` absent |
| `lint-cliquet` | **crash** | `eslint` absent (entrée 0h, connue) |
| `harnais-parcours-prospect` | vert, mais | chemins en dur |
| `harnais-reconduction` | vert, mais | chemins en dur |

⚠️⚠️⚠️ **SIX SCRIPTS PORTENT `/home/claude/mavigne-dev/` EN DUR.** C'est un chemin de bac à sable :
**chez Nico et en CI, ils sortent en `ENOENT`**. Deux d'entre eux sont verts ici — ils ne le seront
nulle part ailleurs.

✅ **RÉGLÉ LE 31/08 (§74b).** Deux des six s'étaient corrigés entre-temps (`harnais-vitrine`,
`contre-epreuves`, passés à `fileURLToPath(import.meta.url)`) et `harnais-claude-md` aussi : il n'en
restait **quatre**, tous convertis à `new URL('../', import.meta.url)` et **lancés depuis `/tmp`**
avant livraison, comme la règle l'exige.

★★★ **LA LEÇON, ET ELLE EST DÉJÀ ÉCRITE EN 0h POUR `lint-cliquet`** : *un filet qui ne démarre pas
se lit comme un succès.* Ce qui est neuf, c'est **l'échelle** : ce n'était pas un accident isolé,
c'est **un défaut d'origine de six harnais sur six**, tous écrits dans le bac à sable, tous livrés
sans qu'on se demande une seule fois **où ils tourneraient ensuite**.
→ **RÈGLE POSÉE** : *un harnais ne se livre pas avec un chemin absolu.*
`new URL('../src/pilotage.js', import.meta.url)` pour les sources, `os.tmpdir()` pour les fichiers
de contre-épreuve. **Et il se lance une fois depuis un autre répertoire avant d'être livré** —
`cd /tmp && node /chemin/vers/scripts/x.mjs`. Trente secondes, et le défaut saute aux yeux.

★★ **DEUX ROUGES SONT DES CONTRE-ÉPREUVES À L'ENVERS — ILS PROUVENT QUE LE TRAVAIL EST FAIT.**
Ce sont les harnais du 12/08 (§33-§34), joués contre le code du 16/08 :
· `mv-harnais-frise` exige `_PIL_SEM` dans `pilotage.js` → **il rougit parce que 0c-ter est faite.**
· `mv-harnais-portee` exige *« le pic est calculé »* → **il rougit parce que l'entrée 8 est faite.**
· `mv-harnais-niveaux` exige les anciens libellés d'onglets → **il rougit parce que §42 les a
  renommés.**
→ **Un harnais écrit pour un lot devient un frein au lot suivant si personne ne le rebase.** Il ne
teste plus le comportement, il teste **une photo du code**. Avant de le déclarer rouge, se demander
*ce qu'il assertait* : ici, la bonne réponse n'est pas « réparer le code », c'est **réécrire ou
archiver le harnais**.

⚠️ **ÉCART `npm run check` ↔ `ci.yml` — ET IL VA DANS LES DEUX SENS.** §43i notait que
`mv-harnais-echelle` ne tournait qu'en CI. Le contrôle en sens inverse n'avait pas été fait :
· `check` lance `banc` et `garde-projection` — **le CI ne les lance pas.**
· le CI lance onze harnais que `check` ignore.
· **neuf scripts ne sont lancés par personne**, ni `check`, ni `ci.yml`.
→ **Un inventaire des filets se lit dans LES DEUX fichiers, et il compte aussi les orphelins.**
Piste : un contrôle qui liste `scripts/*.mjs` et signale ceux qu'aucun appelant ne nomme.

---

### 44d. Les chiffres qui ont bougé — quatre ont empiré

Toutes les entrées chiffrées du backlog ont été re-mesurées à la commande, jamais recopiées.

| Entrée | 11/08 | **16/08** | |
|---|---|---|---|
| 36 · sites sous **10 px** | 277 | **295** | ⚠️ le plancher s'enfonce |
| 29 · hex dans les JS | 2 922 | **3 319** | ⚠️ +14 % en cinq jours |
| 34 · `pilotage.js` | 461 ko | **657 ko** | ⚠️⚠️ **+42 %** |
| 34 · `cave.js` | 407 ko | **456 ko** | ⚠️ |
| 34 · `app.js` | 633 ko | 667 ko | |
| 42 · points de rupture | « 9 » | **14** | ⚠️ 5 étaient invisibles |
| 36 · sites sous 12 px | 1 639 | 1 593 | ✅ |
| 18 · `catch{}` vides | 200 | 193 | ✅ |
| 22 · sommes de surface | 22 | 21 | ✅ |
| 43f · export JSON | 8 / 24 | 8 / **27** | ⚠️ le dénominateur monte |

★★★ **LE CHIFFRE QUI RACONTE LE MIEUX LE CHANTIER §42.** `pilotage.js` a pris **196 ko en cinq
jours** — c'est le poids des dix lots d'ergonomie. **Personne ne l'a vu passer**, et il est
désormais le deuxième fichier de l'app. L'entrée 34 disait « surveiller `cave.js` » : elle
surveillait le mauvais fichier.

★★★ **ET LE PLUS INSTRUCTIF : LA TYPOGRAPHIE BAISSE ET LE PLANCHER S'ENFONCE EN MÊME TEMPS.**
1 639 → 1 593 sites sous 12 px, mais 277 → **295** sous 10 px. §42 a unifié le Pilotage sur
l'échelle `--pt-*` — d'où la baisse — mais **cette échelle descend elle-même à `--pt-nano:9.5px` et
`--pt-lbl:10.5px`**. La variable a rendu le 9,5 px *légitime, nommé et réutilisable*.
⚠️⚠️ **On a industrialisé le trop petit.** → Le lot A de l'entrée 36 change de nature : ce n'est
plus une chasse aux valeurs en dur, **c'est un relèvement de l'échelle elle-même**. Deux lignes dans
`styles.css` touchent alors les 1 021 sites des JS.

★★ **UNE VEILLE SANS SEUIL N'EST PAS UNE VEILLE.** Trois audits de suite ont écrit « surveiller la
taille de `cave.js` », et le chiffre a monté trois fois. **Écrire « à surveiller » ne surveille
rien.** → Poser un plafond dans le preflight (700 ko ?) **ou retirer l'entrée** : les deux valent
mieux qu'un mot qui ne déclenche jamais.

---

### 44e. Ce que l'audit n'a PAS pu vérifier — et pourquoi c'est écrit ici

★ **Un audit qui ne dit pas ses angles morts se lit comme complet.** Quatre points sont restés hors
de portée depuis le bac à sable :

1. ⚠️⚠️ **L'ÉTAT EN LIGNE.** `mavigneapp.fr` n'est pas joignable depuis le bac à sable (liste de
   domaines autorisés). **Impossible de dire si APP 6.25 · SW 6.79 sont déployés ou seulement
   commités.** Tout ce qui précède décrit **le dépôt**, pas la production.
   → Le seul geste qui tranche : ouvrir la console Firebase Hosting, ou lire `/sw.js` en ligne.
2. ⚠️ **`mvprint.py` N'EST PAS DANS LE DÉPÔT.** Sur les **trois chiffres du roi** que la checklist
   §43 demande d'aligner, **un seul est lisible** : les *127 h* de la démo
   (`harnais-demo.mjs:107`). Les *215 h/an pour 10 ha* et les *3 à 5 h/mois* **n'existent dans aucun
   fichier consultable** — ni `src/`, ni `public/`, ni `scripts/`.
   ★★ **Un chiffre commercial qui ne vit nulle part dans le dépôt ne peut pas être aligné par un
   contrôle automatique** : il ne se compare qu'à la main, et donc il dérive. C'est exactement ce
   qui s'est passé.
3. **La persistance cloud tenant par tenant** (§43g) — se prouve dans la console Firestore.
4. **`test:smoke` et `test:e2e`** — Chromium injoignable ; **toujours jamais joués côté Claude.**

---

### 44f. Ce qui reste ouvert au 16/08 — le backlog après ménage

**Confirmés ouverts, vérifiés un par un dans le code** (numéros de l'entrée d'origine en §28) :

- ~~⚠️⚠️ **`_pl2Cell`**~~ — **FAIT**, vérifié dans le code le 31/08 (§74a). L'audit du 16/08 l'avait
  confirmé ouvert « vérifié dans le code » : il ne l'était pas, ou plus. ★ **La leçon** : *un constat
  d'absence a une durée de vie de quelques minutes* vaut aussi pour un constat de PRÉSENCE de défaut.
- ⚠️⚠️ **0a-quater : la masse salariale perd tous les bureaux.** `_pexData` (`pilotage.js:7683`)
  filtre par `_mvEnContratSurPeriode`, dont la première ligne est `if(!m || m.bureau) return false;`
  — **pendant que le commentaire trois lignes au-dessus dit l'inverse**, mot pour mot :
  *« Le "bureau" N'EST PAS exclu : c'est un salaire »*. **`avecBureau` : 0 occurrence dans tout
  `src/`.** À faire au même lot que 0a-ter.
- ⚠️ **Les six harnais à chemin absolu** (§44c) — **n°1 outillage**, une ligne par script.
- **1** installation à blanc sur slug jetable · **6** `demarrage.html` (938 lignes) · **11** import
  KML en merge (`admin-gt.js:2326`) · **12** rattachement des anciens fûts (0 trace dans
  `reserve.js`) · **14** le Cuvier sans intervenant (`cave.js:6713`) · **16** `_pl2Annual` vs
  `_planGetRefH` · **17** « Solde cumulé » vs « Reste à prendre » (les deux coexistent) ·
  **19** rôle `pil:true` (0 occurrence) · **28** contrat « tâcheron » (0 occurrence) ·
  **37** `mvDate()` / `mvNum()` (0 occurrence) · **38** boucle `for..in` de `phyto.js:1165` ·
  **39** `.val-toggle` toujours à **26 px** (`styles.css:305`) · **40** modules par rôle.
- **Le doublon `_pilDiag` / `_pecZeros`** (§42) — 22 occurrences contre 2, toujours deux
  avertissements sur le même sujet à deux endroits de la même page.
- **`.pil-cr-note{display:none}`** (§42) — l'instruction « cliquez une campagne pour zoomer »
  disparaît toujours sur téléphone.

★★★ **CE QUI CHANGE DANS LA FAÇON DE TENIR CE DOCUMENT** — trois règles nées de cet audit :

1. **Une entrée « à déployer » se relit en tête de session** et porte ses deux numéros (§44a).
2. **Une entrée cite un NOM, la ligne vient après et entre parenthèses** (§44b).
3. **Un harnais ne se livre pas avec un chemin absolu, et se lance une fois depuis `/tmp`** (§44c).

⚠️ **Et la règle qui les précède toutes, redite une troisième fois parce qu'elle n'a pas pris** :
*une entrée de backlog non re-mesurée depuis une semaine est une hypothèse, pas un constat.*
**Écrire est un réflexe ; relire n'en est pas un.** → **Re-mesurer tout le backlog chiffré à chaque
consolidation de fin de journée**, pas seulement à l'audit suivant.

---

## 45. ★★★ LE JEU D'ICÔNES — LOT DS-1 (16/08 — APP 6.25 → 6.26 · SW 6.79 → 6.80)

> Parti d'une seule phrase, après un point d'étape qui posait trois questions de périmètre :
> *« je veux que l'app fasse le plus professionnel possible »*. Réponse retenue : **on va au
> bout**, et on écrit noir sur blanc les trois endroits où aller au bout est **impossible**.

### 45a. La mesure, refaite — et pourquoi elle ne tombait pas sur le même chiffre

La note de cadrage annonçait **1 033** pictogrammes rendus. Le comptage refait avec le
blanchiment de commentaires **de `preflight.mjs`** en trouve **920**.

⚠️ **L'écart n'est pas une erreur, c'est une définition.** En comptant le **sélecteur de variante
`U+FE0F`** comme un caractère de plus, on retombe sur **1 067** — et surtout sur `utils.js = 100`,
`admin-gt.js = 83`, `pilotage.js = 39`, **exactement** les chiffres de la note. L'outil de Nico
comptait `⚠️` pour deux. **À l'écran c'est un glyphe.** Le cliquet du harnais retient donc
**920** au départ, et la définition est écrite dans le fichier du harnais — pour qu'on ne
re-dispute pas ce chiffre dans six mois.

★ **Répartition de départ** : `reglages 243 · app 204 · tracteur 137 · cave 80 · utils 75 ·
admin-gt 72 · pilotage 35 · firebase 31 · phyto 25 · onboarding 15 · planning 2 · reserve 1`.

### 45b. ★★★ TROIS PUITS NE PEUVENT PAS RECEVOIR DE SVG — la vraie découverte du lot

Le cadrage supposait un problème d'affichage. C'est un problème de **destination**.

| Puits | Pourquoi un SVG n'y entre pas | Ce qu'on fait à la place |
|---|---|---|
| **`showToast`** et tout `.textContent` | `m.textContent = msg` — une balise y ressort en texte brut | **On retire le glyphe.** Le bandeau porte déjà une **pastille de couleur** : `✅` devant « Lien envoyé » disait la même chose une deuxième fois |
| **Un document imprimé** | il s'ouvre **dans un autre onglet**, qui n'a pas le sprite : `<use href="#ic-x">` n'y rend **RIEN**, sans la moindre erreur | **`_mvIconInline`**, qui **recopie** la forme — relue dans le sprite du DOM de l'app au moment où le document se fabrique. **Une seule source, pas deux tables qui divergent** |
| **Une balise `<option>`** | elle ne peut structurellement contenir aucun élément | `a.emoji` **reste un emoji en base**, rangé dans `data-emoji`, traduit par `_actIcone` à l'affichage |

⚠️⚠️ **Le deuxième cas est le piège du repli CSS, appliqué aux icônes.** Un document imprimé qui
appelle `_mvIcon` sort avec des cadres vides et **aucun contrôle ne le dit**. C'est une assertion
dédiée du harnais, et une contre-épreuve.

### 45c. La mécanique — même patron que `MV_INFO`

- **Le sprite** : `<svg id="mv-sprite" style="display:none">` + **36 `<symbol id="ic-…">`**, dans
  `index.html`, **avant `#app-root`** — `_mvIconInline` relit ces formes dans le DOM.
- **`_mvIcon(nom, taille)`** (`utils.js`, à côté de `_mvInfoBtn`) → `<svg class="mv-ic"><use
  href="#ic-…"></use></svg>`. ★ **`href` sans `xlink` suffit** : Safari le gère depuis la version 12,
  et un fragment du **même document** ne déclenche **aucune requête** — la CSP en enforce n'a rien
  à filtrer.
- **`_mvSetIcon(el, val, taille)`** pour les éléments dont on posait le `textContent`. Il accepte
  **encore un emoji** : les huit modules non migrés (DS-M) continuent de tourner sans rien changer.
  La bascule se fait sur la **forme** du nom (`/^[a-z][a-z0-9-]*$/`).
- **`.mv-ic`** (`styles.css`) : `stroke:currentColor; fill:none; stroke-width:1.5`.
  ⚠️⚠️ **AUCUNE LARGEUR EN CSS.** `_mvIcon` pose `width`/`height` en **attribut** ; une règle CSS
  de largeur les écraserait (le CSS l'emporte sur un attribut de présentation) et l'argument de
  taille ne servirait plus à rien.
- ⚠️⚠️ **Les `<symbol>` ne portent NI `fill` NI `stroke`.** Ces propriétés sont **héritées** à
  travers le `<use>` : c'est la seule façon de repeindre une forme qui vit dans l'ombre du DOM.
  Une forme qui porte sa couleur ne se repeint plus — ni en mode sombre, ni en plein soleil.
  **Une exception commentée** : le point du panneau d'alerte, qui doit être plein.
- **`TICON`** (miroir de `TEMOJI`) + **`_mvIconTache(nom, taille)`**.
  ⚠️ **Ne pas supprimer `TEMOJI`** : `app.js` (38 fois) et `pilotage.js` (12 fois) le lisent encore.

### 45d. ★★★ CE QU'UN SYMBOLE ABSENT DOIT FAIRE — se voir

Un `<use>` qui vise un `id` inexistant rend **une zone vide**, sans erreur, sans `catch`. C'est
exactement le défaut que §27a décrit pour les sélecteurs de la visite guidée. **Trois filets** :

1. le harnais l'**interdit en CI** ;
2. `_mvIcon` rend un **carré pointillé rouge** au lieu du vide ;
3. l'incident part au **journal des erreurs** (`cat:'icone'`), une fois par nom.

★ Même principe que `_mvInfoOpen` sur une clé inconnue : *s'il arrive quand même, il doit se voir,
pas se taire.*

### 45e. Le module témoin — 243 → 0, en trois passes

1. **82 glyphes retirés** des puits de texte pur (80 lignes).
   ⚠️ **Le premier script mangeait les espaces légitimes** : `'Période '+nom` devenait
   `'Période'+nom`. Attrapé **en relisant le diff**, pas par une assertion. Corrigé, rejoué.
   **Un `re.sub` qui nettoie « les espaces en trop » ne sait pas lesquels sont en trop.**
2. **94 remplacements** vers `_mvIcon`.
   ⚠️ **Piège d'ancre** : mes motifs portaient `\"` là où le fichier a un `"` nu — dans une chaîne
   JS **simple-quotée**, les guillemets doubles ne sont pas échappés. **70 ancres à recaler d'un
   coup.** Les `assert` ont tenu : zéro remplacement à l'aveugle.
3. **35 remplacements** dans les documents imprimés et le sélecteur d'activité.
   ★ **Les titres de section d'un document imprimé ne gagnent pas d'icône** : petites capitales
   espacées, filet dessous — **la typographie fait déjà le travail**, et un pictogramme dans un
   document réglementaire fait bricolage.

### 45f. Ce qui RESTE dans `reglages.js`, et pourquoi c'est écrit

- **`▲ ▼ → ＋`** — ★ **ce n'est pas de l'emoji, c'est de la typographie.** Un triangle collé à un
  pourcentage est un **signe de delta** ; une flèche dans une phrase est de la **ponctuation**.
  Les remplacer serait une faute de mise en page, pas un progrès. **Liste nommée dans le harnais**,
  jamais devinée.
- **Les 18 emojis de `_ACT_EMOJIS`** — ★ **vocabulaire de DONNÉES, jamais affiché tel quel.**
  C'est la valeur enregistrée dans `a.emoji`, que `tracteur.js` rend dans des **`<option>`**.
  `_actIcone` la traduit avant tout rendu à l'écran. **Exemption écrite, avec sa raison** ;
  elle saute le jour où les `<option>` deviennent un sélecteur maison.

⚠️ **Le pont vers `tracteur.js` — une ligne, et elle était obligatoire.** `tracteur.js:2576` lisait
`emojiBtn.textContent.trim()` pour enregistrer l'activité : avec une icône dans le bouton, **il
aurait enregistré une chaîne vide**. Il lit désormais `dataset.emoji` d'abord, `textContent`
ensuite (repli pour l'ancien HTML). ★ **Trouvé en cherchant qui LIT, pas en lisant qui ÉCRIT.**

### 45g. Le harnais — 17 assertions, 6 contre-épreuves

`scripts/mv-harnais-icones.mjs` (+ `-contre.mjs`), **branchés dans `ci.yml` ET dans
`npm run check` / `prebuild`** — *un cliquet écrit n'est pas un cliquet branché*.

| Ce qu'il interdit |
|---|
| qu'un `_mvIcon('x')` vise un `symbol` absent |
| qu'un `symbol` déclaré ne serve nulle part (poids mort dans `index.html`) |
| qu'une forme fige sa couleur (`fill`/`stroke` en dur) |
| qu'un **document imprimé** appelle `_mvIcon` au lieu de `_mvIconInline` |
| qu'un emoji revienne dans `reglages.js` |
| que le compte d'emojis remonte — **module par module**, pas seulement au total |

★★ **Sept assertions EXÉCUTENT les vraies fonctions** dans un DOM minimal bâti sur le vrai sprite :
le `<use>` pointe bien, le repli d'un nom inconnu est **visible** *et* journalisé, `_mvIconInline`
ne contient **aucun `<use>`**, `_mvSetIcon` distingue un nom d'un emoji, et **les 18 emojis
d'activité tombent tous sur une icône réelle** — un seul oubli et l'activité d'un client
s'afficherait en tracteur.

★ **La contre-épreuve exige que le rouge NOMME la faute posée**, pas seulement qu'il y ait un rouge :
§42f a montré qu'une assertion se laisse satisfaire par un rouge d'une autre famille.

★ **Trois symboles ont été SUPPRIMÉS parce que le harnais les a déclarés morts** (`drapeau`,
`enveloppe`, `equipe`) : ils avaient été dessinés pour des libellés de bouton qu'on a finalement
laissés en texte seul. **Le cliquet a fait son travail dès le premier passage.**

### 45h. ★★★ CE QUE SEUL L'ŒIL A VU — et le jeu entièrement redessiné

Le comptage était vert bien avant que le jeu soit présentable. **Rendu en image, à la taille
réelle, à côté de son libellé réel**, six dessins étaient à refaire :

| Icône | Ce qu'elle donnait | Correctif |
|---|---|---|
| `cle` | une **loupe** | cercle à gauche, tige à droite, deux dents |
| `feuille` | un **ballon de rugby** | base ronde, pointe en haut, **queue qui sort** en bas |
| `pioche` | un **parapluie** — deux fois | remplacée par une **bêche**, lisible du premier coup |
| `trou` | un **œil** | supprimée ; l'entreplantation prend « jeune plant » |
| `rang` | un **pont** | convergence seule, sans ligne d'horizon |
| `tariere` | une **arête de poisson**, illisible à 12 px | mèche triangulaire à poignée en T |

★★ **Et la deuxième passe visuelle a été faite À LA TAILLE D'EMPLOI, pas sur une planche à 48 px.**
`bureau` et `carburant` étaient nets en grand et **bouchés à 12-13 px** : détails retirés.
**Un jeu d'icônes se juge à sa plus petite taille d'emploi, jamais à sa plus grande.**

★★★ **PUIS TOUT A ÉTÉ REFAIT — et c'est la vraie leçon du lot.** Verdict de Nico sur la
maquette : *« c'est du truc moche »*, avec une référence précise — les icônes **pleines** du
Meta Quest. **Le jeu au trait était techniquement irréprochable et visuellement amateur.**
Un trait de 1,5 sur une grille de 24, ramené à 12 px, ne fait plus que 0,75 px : il grisaille
au lieu de dessiner. **Les 36 icônes sont repassées en silhouettes pleines**, `fill:currentColor`,
`stroke:none`.

⚠️ **Elles ne sont plus dessinées à la main mais GÉNÉRÉES PAR PRIMITIVES** — `bar()`,
`disc()`, `rr()`, `arcBande()`, `pointeArc()`. Sur 36 icônes, **une épaisseur tenue à la main
ne tient pas** : la première version avait six poids différents sans que ça se voie icône par
icône. Un `bar(x1,y1,x2,y2,3.2)` donne le même trait partout, bouts arrondis compris.

⚠️ **`arcBande` partait à l'envers dès qu'un arc dépassait le demi-tour** : `a1 < a0` avec
`large-arc = 0` dessine l'arc complémentaire. Une ligne de normalisation (`while (a1 <= a0)
a1 += 360`). Ça n'a cassé qu'une icône, `rotation` — **et ça ne se voyait que rendu en image**.

★ **Le piege propre au jeu plein : creuser un trou avec du blanc.** `fill="#fff"` est
impeccable sur la carte claire et **faux partout ailleurs** — bandeau sombre, encart vert,
document imprimé. Les trous passent par **`fill-rule="evenodd"`**. C'est une assertion du
harnais et une contre-épreuve de plus (**7 au total**).

★ **Le repli d'un nom inconnu est POINTILLÉ** : un trait plein se confondrait avec une icône,
un pointillé ne ressemble à rien d'autre qu'à une faute.

★★★ **PUIS LE JEU PLEIN A ÉTÉ REFUSÉ À SON TOUR** — *« ça fait Windows 95, ou vieux
téléphone »*. Et c'était juste : **une masse pleine qui touche les bords de la case, c'est le
dessin des interfaces d'il y a vingt ans.** J'avais compensé le problème de lisibilité à 12 px
en ajoutant de l'encre, alors que la lisibilité à 12 px n'était pas un problème d'encre : c'était
**un problème de taille d'appel**.

★★★ **LE REGISTRE RETENU — TRAIT FIN, BEAUCOUP D'AIR, TRÈS PEU DE DÉTAILS.** Trois règles,
tenues sur les 36 :

| Règle | Pourquoi |
|---|---|
| **zone vivante 5 → 19** sur une grille de 24 | une marge de **cinq**, pas de deux. **L'air autour du dessin est le premier signal**, avant le trait lui-même |
| **quatre chemins maximum**, aucun détail intérieur | pas de vitres, pas de nervures, pas de grille d'aération. **Ce qu'on retire fait le style** |
| **la graisse vit dans `.mv-ic`**, jamais dans les formes | sinon une icône ne suivrait pas un changement de graisse — et ne se repeindrait plus avec le texte |

⚠⚠ **AUCUNE ICÔNE SOUS 14 px, ET C'EST UNE ASSERTION.** À 12 px, un trait de 1,35 sur une
grille de 24 ne fait plus que **0,68 px** : l'icône grisaille au lieu de dessiner. **42 appels
ont été remontés** — j'avais mis des icônes à 10 et 11 px parce qu'il y en avait trop pour
tenir autrement. Le harnais l'interdit désormais (**19 assertions, 8 contre-épreuves**).

★★★ **PUIS LE TRAIT FIN MAISON A ÉTÉ REMPLACÉ PAR LUCIDE — ET C'EST LA BONNE FIN.**
Nico a envoyé un cadrage de design complet dont le point central sur les icônes tenait en une
ligne : *« utilise une seule et unique bibliothèque »*. Il avait raison, et contre mon réflexe :
**36 dessins faits à la main n'atteignent pas la cohérence d'une bibliothèque entretenue**, quel
que soit le soin mis à la règle de construction. Trois jeux maison refusés valent démonstration.

★ **Lucide v1.31, licence ISC**, et le vocabulaire viticole y est en entier : `tractor`, `grape`,
`leaf`, `sprout`, `shovel`, `drill`, `fence`, `test-tube`, `fuel`. **Aucune forme n'est recopiée
de mémoire** : `scripts/build-sprite.mjs` les lit dans le paquet `lucide-static`.

⚠⚠ **`lucide-static` N'EST PAS DANS `package.json`.** Le sprite est **commité** : ni la CI ni un
client n'ont besoin du paquet. Il se réinstalle à la main (`npm i -D lucide-static`) le jour où
la correspondance change. → **pas de `package-lock.json` à toucher, donc pas de risque CI.**

⚠⚠ **NE JAMAIS RETOUCHER UNE FORME DANS `index.html`** : le prochain passage du script l'écrase
**sans bruit**. Deux marques rendent la règle vérifiable et le harnais les exige : `data-lucide`
(la version) sur le sprite, `data-src` (le nom d'origine) sur chaque `<symbol>`.

★ **UNE SEULE GRAISSE, UNE SEULE ÉCHELLE.** `stroke-width:1.75` déclaré une fois dans `.mv-ic`
— le harnais compte les déclarations. Et une échelle **fermée** : `16 / 18 / 20 / 24 / 40`
(en ligne / bouton / ligne de liste / tuile / écran vide). **78 appels ramenés dessus.** Une
valeur hors échelle est un **rouge**, pas un avertissement : sinon l'échelle se délite en six mois.

★ **LA TUILE — `_mvIconTuile(nom, ton)`.** L'icône dans un carré teinté de 34 px. C'est le geste
qui sépare le « fait main » du « pensé » : nue, l'icône flotte devant la ligne ; dans son carré,
elle prend une colonne et la ligne s'aligne. ⚠️ **Sur des LIGNES et des RUBRIQUES seulement** —
dans une pastille en ligne, 34 px écraseraient le texte. Fond en `color-mix` de la teinte, donc
il suit le thème au lieu d'être un gris figé qui vire sale en sombre.

⚠⚠⚠ **DEUX FOIS LE HARNAIS EST DEVENU VERT PAR LE VIDE, LE MÊME JOUR.** En ajoutant `data-src`
aux `<symbol>`, le motif de lecture (`viewBox="0 0 24 24">` en dur) n'a plus rien trouvé :
**0 symbole lu, et la moitié des assertions au vert**. Puis une contre-épreuve a cessé de mordre
parce que sa chaîne cible avait changé de taille. → **Le COMPTE d'objets lus est lui-même une
assertion, placée avant toutes les autres** ; et une contre-épreuve doit échouer si son injection
ne s'applique pas, jamais rester silencieuse.

★★ **CE QUE CES QUATRE PASSES COÛTENT, ET CE QU'ELLES APPRENNENT.** Quatre registres livrés,
trois refusés. Les deux premiers ont été proposés **sans référence visuelle** — j'ai dessiné
contre un adjectif (*« professionnel »*), pas contre une cible. Le tournant a été le mot
*« Meta Quest »*, puis *« Windows 95 »* : **deux références précises valent dix adjectifs.**
→ Sur tout lot visuel, **réclamer une référence avant de dessiner**, et rendre une planche
comparée **aux tailles réelles d'emploi** avant d'intégrer quoi que ce soit.

★★★ **ET LA LEÇON QUI VAUT POUR LE PROCHAIN LOT VISUEL : NE PAS DESSINER CE QUI EXISTE.**
J'ai produit trois jeux d'icônes avant d'installer une bibliothèque. Le premier réflexe
aurait dû être l'inverse. **Ce qui appartient à Ma Vigne, c'est la CORRESPONDANCE**
(`raisin → grape`, `rang → fence`, `tariere → drill`) **et l'intégration** — la primitive,
l'échelle, la tuile, le harnais. Pas les tracés.

### 45i. Accompagnement (règle d'or n°4)

- **Fiche `MV_AIDE` de Réglages relue à voix haute contre l'écran neuf : rien à changer** — elle ne
  décrit aucun écran par son emoji. **C'est un constat, pas un oubli.**
- **Guide public** : une seule phrase mentait — `guide/12-reglages.html` nommait le bouton
  *« ⏱ Chronométrer le temps réel »*. Source corrigée, **`node scripts\build-guide.mjs` rejoué**,
  `--check` vert. ⚠️ **On livre la source, jamais `public/guide.html`.**
- `WHATS_NEW` : **4 items**, rédigés du point de vue de l'utilisateur, **vérifiés en Node**.

### 45j. Ce que ce lot ouvre et ne ferme pas

- **DS-M — les huit autres modules.** `654` pictogrammes restants : `app 194 · tracteur 127 ·
  cave 73 · admin-gt 72 · utils 74 · pilotage 29 · phyto 25 · firebase 25 · onboarding 14 ·
  planning 2 · reserve 1 · reglages 18 (exemptés)`.
- ⚠️ **`index.html` n'a PAS été migré** (hors sprite et bouton d'icône d'activité). Le `🌿` de
  `.ver-tag` et le `📍 Centrer sur mes parcelles` y sont toujours — **et le guide les décrit
  encore justement, pour cette raison même**.
- ⚠️ **Les `<option>` de `tracteur.js`** (lignes 1477, 2119, 2206) : tant qu'elles rendent
  `a.emoji`, la donnée ne peut pas devenir un nom d'icône. **C'est le préalable de DS-M**, pas un
  détail de finition.
- ⚠️ **`MV_AIDE[x].ico`** est un emoji, rendu en tête de chaque fiche d'aide des **dix** modules.
  Il vit dans `utils.js` : c'est un lot DS-M à lui seul, et il se voit sur tous les écrans.
- ⚠️ **Le smoke et l'e2e n'ont PAS tourné** : Playwright ne s'installe pas dans le bac à sable
  (le CDN des navigateurs n'est pas joignable). **Le build passe, le sprite survit au bundle**
  (36 `<symbol>` dans `dist/index.html`), mais **c'est la CI qui donnera le vrai vert**.

---

## 46. ★★★ LA CHARTE D'ÎLOTS — LOT DS-2 (16/08 — APP 6.26 → 6.27 · SW 6.80 → 6.81)

> ★★★ **LA LEÇON DU JOUR, ET ELLE COÛTE CHER : QUATRE JEUX D'ICÔNES N'ONT PAS SUFFI.**
> Trois refusés (*« moche »*, *« Windows 95 »*, *« récupéré sur le net »*), le quatrième pris
> dans une vraie bibliothèque — et le verdict restait *« ça ne fait toujours pas pro »*.
> **Le problème n'a jamais été l'icône. C'était le contenant.**

### 46a. Ce qui faisait « brouillon », nommé

| Le symptôme | La cause |
|---|---|
| l'œil est agressé | des blocs **empilés**, séparés par des **filets**, sans respiration |
| rien n'accroche | **tout a la même importance visuelle** — quatre, cinq niveaux de texte concurrents |
| une liste ne se scanne pas | l'**état** est noyé dans le texte au lieu d'être **calé à droite** |
| « 62 % » et « 100 % » sautent | pas de `tabular-nums` : l'œil rattrape le décalage à **chaque ligne** |

### 46b. Quatre briques, pas trente (`styles.css`)

- **L'îlot `.mv-c`** — un objet métier = une carte. 16 de *padding*, 16 de rayon, une bordure
  d'un cheveu. ★ **On remplace les lignes de séparation par du vide**, pas par d'autres lignes.
- **La hiérarchie** — ⚠️⚠️ **TROIS NIVEAUX, JAMAIS QUATRE.** `.mv-t` (le nom, Cormorant),
  `.mv-n` (le chiffre qui compte, **`tabular-nums`**), `.mv-l` (l'étiquette technique).
  Un quatrième niveau et la hiérarchie ne se lit plus — **c'est exactement ce qui donnait
  l'effet brouillon**.
- **Le badge `.mv-bdg`** — l'état, **toujours à droite**. C'est l'alignement vertical des badges
  qui rend une liste de 46 parcelles scannable.
- **Le bouton fantôme `.mv-gh`** — l'action attend, elle ne crie pas. Couleur au survol
  seulement, rouge **uniquement** pour ce qui détruit.

⚠️ **38 px et non 44 pour `.mv-gh`** : la cible tactile est portée par **la carte entière**.
Un bouton de 44 dans une carte à 16 de padding mange la ligne.

### 46c. ⚠️⚠️ AUCUNE COULEUR D'ÉTAT EN DUR — et c'est vérifié

Un `#EAF5E4` écrit en dur est **juste sur la carte claire et faux partout ailleurs** : mode
sombre, plein soleil, document imprimé. Tous les fonds de badge sont en
**`color-mix(in srgb, var(--ton) 14%, transparent)`** : ils suivent le thème.

★ **`_mvBadge(texte, ton)` — ensemble FERMÉ de quatre tons** : `vert` fait · `ambre` en cours ·
`rouge` bloquant · `neutre` à faire. Un cinquième ton et deux écrans finissent par dire la même
chose de deux couleurs différentes. Un ton inconnu retombe sur `neutre` **et part au journal**.
Le harnais compte les tons déclarés, refuse un ton inconnu à l'appel, et vérifie que
**les 12 briques existent** — une classe absente ne casse rien, elle rend un bloc nu, en silence.

### 46d. Ce qui est passé à la charte

| Écran | Ce qui change |
|---|---|
| **Accueil** (`renderHomeCard`) | le pourcentage devient le **sujet** : héros en Cormorant 46, jauge à côté, contexte en étiquette. Plus de picto de 38 px, plus de coche verte géante |
| **Carte parcelle** (`_pvInner`) | îlot cliquable, nom + cépage, pourcentage tabulaire à droite, jauge, **badge d'état calé à droite**. ★ **Plus une seule icône** : une liste se lit à la typographie |
| **Fiche parcelle** (`openDP`) | trois chiffres en tête (avancement / surface / travaux faits), les travaux en lignes `.mv-tr`, les pictogrammes retirés des libellés |
| **DRAE** | ⚠️ **réglementaire** : badge rouge dans la liste, **encart dédié** dans la fiche avec les heures restantes en gros. **La seule icône de la fiche** — un statut critique doit arrêter l'œil |

### 46e. ⚠️ CE QUI N'EST PAS FAIT

- ~~Les écrans de Réglages~~ → **FAIT (DS-2b, même livraison)** : ligne d'un travail, activité
  tracteur, rubriques de la fiche membre. Les badges maison à couleur écrite en dur
  (`#4A9FC8`, `rgba(61,107,39,…)`) sont passés à `_mvBadge`.
  ★★ **Le cliquet a fait son travail sans qu'on le lui demande** : en retirant les icônes
  décoratives des listes, **`cle`, `euro` et `soleil` se sont retrouvés sans appelant**.
  Retirés de la **correspondance** (`scripts/build-sprite.mjs`), jamais du sprite à la main —
  **36 → 33 symboles**. C'est le bon sens de marche : on supprime la source, on régénère.
- ~~Les trois derniers widgets d'accueil~~ → **FAITS** : mise en route, avancement par tâche,
  carte tracteur. ⚠️ **La carte tracteur garde son fond sombre** (contraste en cabine) : elle
  prend la **hiérarchie** de la charte, pas son fond. ★ **La charte encadre, elle n'uniformise
  pas ce qui a une raison d'être différent.**
- ~~Journal~~ → **FAIT.** Chaque entrée devient un îlot, l'état en badge à droite.
  ⚠️ **La frise verticale de gauche reste** : elle porte la lecture du temps, ce n'est pas de
  la décoration. La pastille `👥` disparaît — « Équipe (Victor + Léa) » le dit déjà en mots —
  et **sa règle CSS part avec elle** : une règle morte finit toujours par être recopiée ailleurs.
- ~~Tracteur~~ → **FAIT. 127 → 35 pictogrammes**, le plus gros morceau du lot. Sessions, parc
  de machines, fiches de contrôle, historique de réparations. Les badges maison (`tpc-badge`,
  `tpc-pill`, `sc-st`) passent à `_mvBadge`.
  ⚠️ **`.scard-enc` garde son fond sombre** : une session en cours se lit **en cabine, au
  soleil**. Hiérarchie oui, fond non.
  ⚠️ **`✱` reste** — signe de renvoi typographique, comme un astérisque de note.
  ★ **Vider une variable n'est pas la supprimer** : `var em=''` laissait une espace en tête de
  titre (« ␣Broyage »). Trois occurrences, invisibles à la relecture, visibles à l'écran.
- ~~Cave~~ → **FAIT. 73 → 17 pictogrammes.** Récoltes, cuves, analyses, clients vrac.
  Les **huit opérations de cuve** perdent leur émoji : huit dessins à retenir, c'était sept de
  trop — « Chaptalisation » ne se confond avec rien.
  ⚠️⚠️ **TROISIÈME FOIS DE LA JOURNÉE, MÊME FAMILLE** : la passe de retrait a **vidé** les deux
  écrans vides (`<div class="mvv-empty-ic"></div>`, un bloc de 34 px de haut, vide). ★ **Un
  écran vide est l'un des trois cas où l'icône RESTE** — elle n'aurait jamais dû partir.
  Après les éléments vides qui gardent leur marge et la variable vidée qui laisse une espace,
  c'est la règle du jour : **une passe de retrait doit lister ce qu'elle NE retire PAS.**
  ⚠️⚠️ **`_mvIcon` posé dans `cave.js` sans être importé.** ESLint n'a rien dit — `no-undef` ne
  couvre pas les globales — et l'écran aurait planté à l'ouverture. ★ **Un appel sans import ne
  se voit qu'à l'usage** : après chaque ajout d'appel dans un module neuf, vérifier l'import.
- **app.js** → **177 → 125.** Messages de connexion, écrans d'attente et de verrou, filtres par
  tâche, avancement par tâche, alerte gel.
  ⚠️⚠️⚠️ **LA FAUTE LA PLUS INSTRUCTIVE DU LOT.** `_mapLabelsVisible ? '🏷 Noms ✓' : '🏷 Noms'` :
  le **`✓` était la SEULE différence entre les deux états**. Ma passe de retrait l'a emporté →
  `? 'Noms' : 'Noms'`. **Le bouton ne disait plus rien, et rien ne plantait.**
  → Nouvelle assertion : **« aucun ternaire ne rend deux fois la même chaîne »**. Elle a trouvé
  **deux autres cas dès sa première exécution**, dont un **antérieur au lot** (`planning.js:425`,
  un faux choix qui laissait croire à un calcul dynamique depuis toujours).
  ★★ **Avant de retirer un glyphe, vérifier qu'il ne porte pas à lui seul une DIFFÉRENCE entre
  deux états.** Un ternaire à branches égales est le signe le plus net d'un retrait de trop.
  ★ `cle` est **revenu au sprite** : il avait été retiré quand plus personne ne l'appelait, et
  l'écran de verrou d'accès le redemande. Le cliquet fonctionne dans les deux sens.
- **utils.js + la météo** → **74 → 66.** Les **onze fiches d'aide** portent un nom du sprite
  dans `ico` ; `wmoEmoji` devient **`wmoIcone`** et rend un **nom**.
  ⚠️ **`wmoEmoji` reste exportée en repli** : un module non migré qui appellerait `wmoIcone`
  afficherait « nuage » en toutes lettres. On ne redirige pas, on double le temps de la bascule.
  ⚠️ **Le champ `emoji:` garde son nom** : il part en cache et dans les instantanés météo du
  journal. ★ **On change ce qu'on y met, pas son nom** — `_mvSetIcon` tranche sur la forme, donc
  le cache d'hier reste lisible.
  ⚠️⚠️ **La correspondance météo vit dans une TABLE (`MV_METEO_IC`), pas dans une cascade de
  `return`.** Des noms rendus en dur par une fonction sont **invisibles au harnais**, qui les a
  déclarés « symboles morts ». ★ **Troisième forme du même défaut aujourd'hui** (après `ic:` dans
  la barre de navigation, puis `ico:` dans les fiches) : **tout nom d'icône doit vivre dans un
  appel littéral ou dans une table déclarée**, jamais dans un `return` en dur.
  ★★ **ET J'AI ANNONCÉ « 74 → 32 » SANS RELIRE LE RELEVÉ** : le compte réel est **66**. Sur ces
  66, **26 sont les émojis du journal des nouveautés** (un par entrée — c'est un journal, pas de
  l'habillage) et **19 sont `TEMOJI`**, encore lu par `pilotage.js`. Il reste donc **21 vrais**.
  → **Vérifier, ne pas croire — y compris ses propres annonces de fin de lot.**
- **Pilotage** → **29 → 6**, et surtout ★★★ **LA DEUXIÈME BIBLIOTHÈQUE D'ICÔNES DISPARAÎT.**
  `_pilIco` embarquait **quinze formes en SVG inline**, avec sa propre épaisseur de trait
  (1,6 contre 1,75). C'est exactement ce que le cadrage de Nico interdisait — et **ça précédait
  le lot**. Il ne reste qu'une correspondance `_PIL_IC` vers le sprite commun. **Sprite : 50.**
  ⚠️ **`_pilTile(id, ico, …)` : le 2ᵉ argument n'était plus lu** depuis que l'en-tête passe par
  `_pilIcoFor(id)`. Il ne transportait que des émojis morts, sur **25 appels**.
  ★ **Un paramètre qu'on ne lit plus finit par mentir.**
  ⚠️ **`.pil-th-ico svg{width:14px}` écrasait la taille posée par `_mvIcon`** — le CSS l'emporte
  sur un attribut de présentation. C'est le piège documenté dans `.mv-ic`, **déjà présent avant
  le lot** : la règle existait, l'endroit où elle était violée n'avait pas été cherché.
  ★ **L'échelle `--pt-*` n'est PAS touchée.** Onze pas, son propre harnais, contre trois niveaux
  pour la charte. Les unifier est un **arbitrage**, pas une conversion → **DS-3**.
- ⚠️⚠️⚠️ **QUATRIÈME FOIS QUE LE MÊME ANGLE MORT MORD LE HARNAIS.** Un nom d'icône rangé dans une
  **table** lui est invisible : `TICON`, `ACT_ICONES`, `ic:` (navigation), `ico:` (fiches),
  `MV_METEO_IC`, puis `_PIL_IC`. À chaque fois il a déclaré morts des symboles vivants — et
  surtout, **les autres n'échappaient au rouge que parce qu'ils servaient aussi ailleurs**.
  → La liste en dur est remplacée par une **règle** : toute table dont le nom finit par
  `IC`/`ICO`/`ICON`/`ICONES` est lue, dans n'importe quel module.
  ★★ **Une liste en dur qu'on rallonge à chaque incident n'est pas un filet, c'est un journal
  des incidents passés.**
- ★★★ **`TEMOJI` EST SUPPRIMÉE.** Elle associait un émoji à chaque travail et était lue
  **14 fois dans `app.js`**, 2 dans `pilotage.js`, 3 dans `reglages.js`. ★ **Partout, l'émoji
  précédait un NOM DE TÂCHE déjà écrit à côté** : il ne disait rien de plus. `TICON` la remplace
  et rend un **nom d'icône**. ⚠️ **Ne pas la réintroduire « juste pour une liste »** — c'est
  comme ça qu'elle était arrivée.
  ★ Dans Pilotage, `x.emos` collait bout à bout les émojis des tâches restantes : « 🌿🌿🍇 ».
  **Trois feuilles quasi identiques ne disent pas QUELLES tâches, seulement COMBIEN** — la ligne
  rend désormais le compte, qui est l'information réelle.
- **Phyto** (25 → 10), **firebase** (25 → 11), **onboarding** (14 → **0**). Bandeau de synchro,
  erreurs de connexion, première installation : des puits de texte pur, où **la couleur disait
  déjà tout**.
- ⚠️⚠️ **LA CONTRE-ÉPREUVE DÉPENDAIT DE L'ORDRE D'EXÉCUTION.** L'épreuve « le compte remonte »
  restait **verte** si la référence du dépôt datait d'avant une baisse : ajouter trois émojis ne
  dépassait pas une référence périmée. Le bac **regrave son propre cliquet avant d'injecter**.
  ★★ **Une contre-épreuve ne doit dépendre que de la faute qu'elle pose** — vérifié en remettant
  volontairement une référence à 999 : les douze mordent toujours.
- **Tracteur** 35 → **7**, **app.js** 119 → **92**. Boutons d'une fiche parcelle, points de
  contrôle, canaux de discussion, pastilles d'état.
  ⚠️⚠️ **EN SUPPRIMANT LE CHAMP `icon` DES SIX POINTS DE CONTRÔLE, J'AI LAISSÉ TROIS LECTURES
  DE CE CHAMP.** Elles auraient rendu **« undefined »** à l'écran, et **ESLint ne dit rien d'un
  champ d'objet absent**. ★★ C'est le revers exact du piège « vider n'est pas supprimer » :
  cette fois j'ai supprimé **la source sans chercher qui la lit**.
  → **Après chaque retrait d'un champ, chercher `\.champ\b` dans tout le module.**
  ⚠️ Même famille, même minute : l'ancre d'un de ces retraits existait **deux fois avec la même
  indentation**. L'`assert count==1` a mordu — c'est exactement ce pour quoi il existe.
- ★ **Restent typographiques, donc conservés** : « ↩ » dans la phrase qui décrit le geste
  (« Tap 1 = commence, ↩ annule ») et « ↑ 24° ↓ 12° » (min/max d'un relevé météo).
- **app.js** 92 → **58.** Bandeau de synchro, bulle d'état, équipe du jour, filtre du journal,
  roue d'attente, parc tracteur en mode GT.
  ⚠️⚠️ **DEUX FILTRES TESTAIENT LA PRÉSENCE D'UN ÉMOJI DANS LE MESSAGE** du bandeau :
  `/Synchronisation|🔄|rétablie|📶|…/.test(msg)`. Les messages n'en ont plus — **le test ne serait
  plus jamais tombé juste, et le bandeau aurait gardé la mauvaise couleur**. Ils testent
  désormais les mots. ★★ **Retirer un émoji d'un message, c'est aussi casser qui le CHERCHE.**
  → Après chaque nettoyage de messages, grepper les `test(` / `indexOf(` / `includes(` sur ces
  mêmes glyphes.
  ★ L'`assert count==1` a **de nouveau mordu** : le champ `icon` des points de contrôle avait
  **encore un lecteur ici** (doublon GT de `tracteur.js`). La règle posée au tour précédent a
  servi au tour suivant.
- **admin-gt** 72 → **7.** La console opérateur passe aux mêmes icônes.
  ⚠️ **Le journal d'accès est écrit en base** : les lignes d'avant ce lot portent un émoji,
  celles d'après un nom. `_agtIco` traduit **à la lecture**. ★ **Un journal qu'on réécrit n'est
  plus un journal.**
  ⚠️⚠️ **TROIS ÉCHECS PARTIELS DE SUITE SUR CE FICHIER**, toujours la même cause : **un script
  qui échoue au milieu n'écrit rien, mais les scripts précédents ont écrit.** L'état réel n'est
  jamais celui qu'on croit. Ici `_agtIco` s'est retrouvé **appelé sans être défini** — invisible
  au lint, invisible au build, visible seulement à l'ouverture de l'écran.
  → **Relire le fichier avant chaque lot d'ancres**, et n'asserter que ce qui manque encore.
  C'est §25 appliqué à soi-même.

### 46h. ★ OÙ EN EST LE CLIQUET, ET CE QUI RESTE VOLONTAIREMENT

**920 → 169 pictogrammes rendus — 82 % de moins.**

| Module | Reste | Nature |
|---|---|---|
| `app` | 58 | dont **14 de semence `ACTIVITES`** (bloquée par les `<option>`) et des légendes `✓ ▶ ○` **typographiques** |
| `utils` | 47 | dont **26 = un émoji par entrée du journal des nouveautés** — c'est sa forme, pas de l'habillage |
| `reglages` | 18 | `_ACT_EMOJIS`, **exemptés et documentés** |
| `firebase` | 11 | messages internes |
| `phyto` | 10 | reliquat d'écrans |
| `tracteur` / `admin-gt` | 7 / 7 | reliquat |
| `pilotage` · `cave` · `planning` · `reserve` | 6 · 2 · 2 · 1 | typographie pour l'essentiel |
| `onboarding` | **0** | |

★ **Le vrai reste visible par un client tourne autour de 40 glyphes, dont une bonne moitié est
légitime** (typographie, données, journal). Le lot a atteint son objet.

---

## 51. ★★★ TROIS PANNES CAUSÉES PAR MA PROPRE ASSERTION (17/08 · 6.31 / 6.85)

> `icone inconnue : euro`. Avant lui : `equipe`, puis `soleil`, puis `cle`.
> **Quatre symboles supprimés, trois carrés pointillés chez le client.**
> Le fautif n'est pas l'oubli : c'est **le contrôle qui m'a dit de les supprimer**.

### 51a. ⚠️⚠️⚠️ « AUCUN SYMBOLE DÉCLARÉ SANS EMPLOI » — UN FILET QUI POUSSE À CASSER

L'assertion ne voyait que les **appels littéraux** `_mvIcon('x')`. Un nom rangé dans une table
et résolu à l'exécution lui était invisible. À chaque rouge, j'ai obéi et supprimé le symbole —
et à chaque fois une table le réclamait.

★★ **Elle optimisait un non-problème** : quelques centaines d'octets de SVG dans un sprite déjà
précaché. Le bénéfice était nul, le coût trois pannes.
→ Elle passe en **AVERTISSEMENT**, et la règle d'usage devient : **on n'enlève un symbole que sur
preuve**, jamais sur ce signal seul.

★★★ **La leçon dépasse les icônes : un contrôle dont l'action corrective est « supprimer » doit
être tenu pour suspect.** Un filet est là pour empêcher de casser, pas pour y inviter.

### 51b. La convention de nom ne suffisait pas non plus

`_PIL_TABS` est une table de **triplets** `['cle','icone','Libelle']` : son nom ne finit pas par
`_IC`, et on ne peut pas lire toutes ses chaînes — la clé et le libellé n'en sont pas.
**Deux fois de suite** un nom y est resté invisible (`equipe`, puis `euro`).

→ Le harnais tient désormais un **registre en dur** des tables à triplets. ★ **C'est assumé :
une liste explicite et fausse se corrige ; un trou silencieux, non.** Toute nouvelle table s'y
ajoute — sinon l'e2e la trouvera, plus tard et plus cher.

### 51c. Ce que trois allers-retours CI auraient dû m'apprendre plus tôt

Trois pushs, trois rouges, trois correctifs d'une ligne. À chaque fois j'ai corrigé **le symptôme
signalé** sans chercher **la même faute ailleurs**. Le scan complet des tables — dix noms vérifiés
en une commande — je ne l'ai fait qu'au troisième tour. ★★ **Devant un défaut trouvé par un
contrôle externe, chercher immédiatement ses frères, avant de re-livrer.**

---

## 50. ★★★ LE COMPTEUR MENTAIT DEPUIS LE PREMIER JOUR (17/08 · 6.30 / 6.84)

> Dix carrés pointillés sur les onglets du Pilotage. Le correctif tient en dix lignes.
> **Ce que l'incident a révélé rend faux tous les chiffres de DS-1, DS-2 et DS-3.**

### 50a. ⚠️⚠️⚠️ UN ÉMOJI ÉCRIT EN ÉCHAPPEMENT EST INVISIBLE AU COMPTEUR

`['auj','\uD83E\uDDED','Aujourd\'hui']` **ne contient aucun caractère pictographique** : ce sont
des lettres ASCII. Le compteur lisait le texte du fichier, donc il mesurait **l'écriture** au lieu
de mesurer **ce que voit l'utilisateur**.

→ Le compteur **décode** désormais `\uXXXX` et `\u{XXXXX}`, paires de substituts comprises, avant
de compter. ★★ **Le compte réel n'est pas 169 mais 1358, et il ne l'a jamais été.** Les
« 920 → 169, 82 % de moins » que j'ai annoncés tout au long de la journée sont **faux**.

⚠️ **Conséquence directe et assumée** : « zéro émoji rendu dans `reglages.js` » était **vrai sur
un comptage aveugle et faux en réalité** — il en reste **115**, tous en échappement.
★ On ne baisse pas une exigence en douce : l'assertion devient un **cliquet** (le compte ne peut
que descendre) au lieu d'une cible fausse, et la raison est écrite dans le harnais.
**Une assertion verte pour une mauvaise raison vaut moins que rien.**

### 50b. La cause immédiate : un script de patch interrompu

Les dix entrées de `_PIL_TABS`/`_PIL_TOOLS` portaient encore des émojis alors que leurs **trois
rendus** étaient déjà passés à `_mvIcon`. Mon script avait échoué sur sa dernière ancre — donc
**n'avait rien écrit** — et j'avais supposé que sa première moitié avait pris.

★★★ **C'est la QUATRIÈME fois dans la journée que ce mécanisme me piège** (`admin-gt` trois fois,
puis ici). La règle existe depuis §25 et je ne l'applique pas :
→ **après tout script de patch, relire le fichier et vérifier CE QUI A REELLEMENT CHANGÉ**, pas
supposer d'après le message de sortie.

### 50c. Ce que ça dit du reste du lot

Aucun défaut fonctionnel supplémentaire n'est démontré : les écrans migrés fonctionnent, la
charte tient, les icônes s'affichent. **Ce qui est faux, c'est la MESURE du travail restant.**
Le vrai reste à traiter est de l'ordre de **1358 pictogrammes**, dont une part importante en
échappements jamais examinés. → à reprendre module par module, avec un compteur qui voit enfin.

---

## 49. ★★★ PILOTAGE NE RÉPONDAIT PLUS — ET LE FILET QUI MANQUAIT (17/08 · 6.29 / 6.83)

> `Promesse rejetée : _opEmo is not defined` — **l'écran entier mort, plus un clic.**
> Chez un client, en production.

### 49a. La faute

J'ai supprimé `_opEmo` en cherchant ses usages sous d'autres formes — `emo+`, `.emos`,
`_opParcTaskEmos` — **mais pas `_opEmo(` lui-même**. Une seule occurrence restait, dans les
puces de tâches de l'ordre de passage.

★★ **Ni `node --check` ni ESLint ne le voient** : la syntaxe est valable, et `no-undef` est
désactivé dans `eslint.config.js` — **à raison**, parce que les modules s'appellent entre eux par
le `window`. Je m'appuyais donc sur un lint pour une vérification qu'il ne fait pas.

### 49b. ★★★ LE CONTRÔLE C23 — la règle qui manquait depuis le début

La convention du projet est claire et **jamais vérifiée** : un identifiant qui commence par `_`
est **privé au module**. On peut donc contrôler exactement ça, sans faux positif :

> tout `_xxx(` appelé doit être **déclaré dans le fichier**, **importé**, ou **exposé sur
> `window`** quelque part dans le corpus.

C23 rejoue la panne du jour et rougit. ★ **Il aurait aussi attrapé `_agtIco` deux heures plus
tôt** — même famille, même journée, passée entre les mailles.

⚠️ Deux faux positifs à sa première exécution, corrigés avant de le brancher :
`var _a=…, _b=…` (seul le premier déclarateur était vu) et les **expositions croisées**
(`window._openOv = _openOv` dans un autre module).
★ **Un contrôle qui crie au loup est un contrôle qu'on désactive.**

### 49c. Deux défauts trouvés dans la même capture

⚠️ **La météo de l'en-tête affichait « nuage » en toutes lettres.** Le champ porte un nom d'icône
depuis 6.82 et était inséré tel quel. Repli sur la forme, comme partout ailleurs — le cache
d'hier reste lisible. ★ **Une bascule de format doit être traitée à CHAQUE point de lecture, pas
seulement au point d'écriture.**

⚠️ **La barre d'onglets de Pilotage était la dernière en émojis** — neuf onglets plus deux
outils, juste au-dessus d'une barre de navigation déjà migrée. C'est de la navigation : elle
passe au sprite.
★ **Les clés (`auj`, `an`, `avc`, `equ`, `sim`, `cav`, `eco`, `cfm`) ne bougent pas** :
mémorisées chez les clients, citées par `app.js`, vérifiées par C22. **On change l'icône, jamais
la clé.**

### 49d. Ce que trois échecs de patch dans la même heure disent

Mes ancres textuelles ont raté **trois fois de suite** sur le même fichier : un `\u2713` échappé
dans la source que je cherchais en clair, un `'</span>'` fermé que le fichier enchaînait en
`</span><span`, un `++` créé par un remplacement. ★★ **Chercher la forme du FICHIER, pas celle
que l'œil imagine** — et quand deux ancres de suite ratent, passer au traitement **par ligne
identifiée par son contenu**, ce que j'aurais dû faire au deuxième échec, pas au troisième.

---

## 48. ★★★ CE QUE LA CI A TROUVÉ, ET QUE LE HARNAIS NE POUVAIT PAS TROUVER
### (17/08 — APP 6.28 · SW 6.82)

> `✖ Page home — [console] [MaVigne Error] INFO [icone] icone inconnue : equipe`
> **Un seul problème sur tout le parcours e2e. Il en cachait trois.**

### 48a. Le filet a fonctionné — et c'est sa justification rétrospective

`_mvIcon` rend un **carré pointillé rouge** et écrit au journal quand un nom est inconnu. Sans
ce repli, `<use href="#ic-equipe">` aurait rendu **un blanc**, l'e2e serait passé vert, et le
défaut serait parti en production. ★ **On avait débattu de l'intérêt d'un repli visible : voilà
la réponse.**

### 48b. ⚠️⚠️⚠️ LE VRAI DÉFAUT ÉTAIT DANS LE HARNAIS — UN CONTRÔLE QUI NE PEUT PAS ÉCHOUER

Son lecteur de tables faisait :

```js
if (!symboles.has(mv[1])) continue;   // « une clé qui n'est pas un nom d'icône »
```

Il **sautait** les noms absents au lieu de les signaler. ★★★ **Par construction, cette assertion
ne pouvait pas rougir.** Elle est restée verte pendant tout le lot pendant que `_PIL_IC`
réclamait `equipe`, retiré du sprite deux heures plus tôt.

→ Il lit désormais la **valeur** de chaque paire `clé:'valeur'` ; un nom absent est un **rouge**.
★ **Dès sa correction il a trouvé un second cas que la CI n'avait pas atteint** : `soleil`
(`MV_METEO_IC`) — **le beau temps rendait un carré pointillé** sur l'accueil.

★★ **C'est la sixième variante du même angle mort en une journée, et la seule qui comptait.**
Les cinq premières étaient des oublis de lecture ; celle-ci était une impossibilité structurelle
de détecter. → **Devant une assertion qui n'a jamais rougi, se demander si elle en est capable.**

### 48c. Les deux dégâts collatéraux, corrigés

⚠️ **`FB_STATIC` finit par « IC »** → douze faux positifs dès la correction. Un harnais qui crie
au loup est un harnais qu'on ignore, donc mort. Le motif exige maintenant un **dernier segment
souligné** (`_IC`/`_ICO`/`_ICON`/`_ICONE`/`_ICONES`), et `TICON` devient **`TACHE_ICO`** pour
suivre la convention. **Une table d'icônes se nomme.**

⚠️ **Pilotage avait DEUX tables en cascade** : `_PIL_TILE_ICO` → `_PIL_IC` → sprite. ★ **Une
table dont les valeurs ne sont pas des noms d'icônes est indistinguable, pour un contrôle
automatique, d'une table dont elles le sont.** L'indirection est supprimée : une seule table,
toutes valeurs = sprite. **Sprite : 53 symboles.**

★ **14ᵉ contre-épreuve** : « une table qui demande un symbole absent ». Elle existe pour que ce
lecteur ne redevienne jamais muet.

### 48d. ⚠️ Le bump n'était pas optionnel

Le lot précédent **était poussé** — la CI a tourné dessus. Réutiliser 6.81 aurait **gelé
l'`index.html` précédent** chez tout client l'ayant déjà pris. **6.28 / 6.82**, sans hésiter.

---

## 47. LES DEUX ÉCHELLES — LOT DS-3 (16/08 — même livraison, APP 6.27 · SW 6.81)

### 47a. ⚠️⚠️ `--pt-*` ÉTAIT DÉJÀ DANS `:root`

Je l'ai appelée « l'échelle de Pilotage » pendant trois tours. **Elle est déclarée dans `:root`,
donc globale : c'est l'échelle de l'APPLICATION**, et ma charte DS-2 l'a ignorée en écrivant six
`font-size` à la main. ★★ **Une échelle qu'on ignore n'en est plus une** — et j'ai failli en
créer une seconde en croyant en réconcilier deux.

La charte s'y range : `.mv-t → --pt-md`, `.mv-n → --pt-lg`, `.mv-hn → --pt-hero`,
`.mv-l → --pt-micro`, `.mv-v → --pt-txt`, `.mv-bdg → --pt-lbl`. **Trois correspondances exactes,
trois à ±1 px.**
⚠️ Le rôle écrit à côté de `--pt-lg` dit « titre serif d'un panneau » : il a été nommé pour
Pilotage, pas pour un chiffre. **La taille est juste, l'étiquette ment** — noté, pas corrigé en
douce.

### 47b. L'échelle d'espacement — `--e-0` à `--e-8`

La feuille portait **vingt valeurs de padding, de 1 à 20 px** : 129 fois 10, 126 fois 8, 88 fois
6, 73 fois 9, 66 fois 11. ★ **Vingt valeurs, ce n'est pas un rythme, c'est vingt décisions prises
une par une** — et c'est ce qui fait « brouillon » avant même qu'on lise le contenu.

⚠️⚠️ **LA FEUILLE N'EST PAS RÉÉCRITE D'UN COUP, ET C'EST DÉLIBÉRÉ.** Remapper 800 déclarations
**sans pouvoir vérifier une seule capture** (Playwright ne s'installe pas ici) serait un pari,
pas un lot. La charte DS-2 s'y range ; le reste est tenu par un **cliquet à 1004** : le nombre de
valeurs hors échelle **ne peut plus monter**, et se résorbe écran par écran.
★ **Transformer une dette en cliquet vaut mieux que la solder à l'aveugle.**

### 47c. ⚠️⚠️⚠️ LE HARNAIS NE COMPILAIT PLUS, ET AFFICHAIT QUAND MÊME UN RÉSULTAT

En ajoutant le cliquet, j'ai déclaré `const enDur` — **un nom déjà pris plus bas dans le même
fichier**. Le module ne compilait plus : **ses 25 assertions ne tournaient plus du tout**, et la
boucle de vérification affichait tout de même une ligne. ★★ **Un harnais qui ne démarre pas est
pire qu'un harnais rouge** : le rouge se voit.
→ C'est la troisième forme du « vert par le vide » de la journée, après le sprite lu à zéro et la
contre-épreuve qui ne mordait pas.

⚠️ Et `--baseline` était lu comme un **nom de fichier** (`process.argv[2]`) : le harnais mourait
sur un `ENOENT`. **Un argument positionnel et un drapeau ne se mélangent pas sans filtre.**
- ~~La personnalisation d'accueil~~ → **VÉRIFIÉ, LE BLOCAGE N'EXISTAIT PAS.** `home_layout` est
  indexé par la **clé du widget** (`data-w="avancement"`), pas par la structure interne : on peut
  refaire l'intérieur d'un widget sans toucher à la donnée. ★ **Je l'avais annoncé comme bloquant
  sans l'avoir lu** — vérifier, ne pas croire, y compris sa propre prudence.
  Sont passés à la charte : **délai de rentrée, ma semaine, derniers travaux, ma part du
  chantier, raccourcis, pastille de priorité**. Restent `demarrage`, `heures`, `tracteur`.
- ~~La barre de navigation~~ → **FAITE.** Les émojis passent au sprite (**35 symboles**,
  `verre` et `plus` ajoutés). ⚠️ **`filter:grayscale(.35)` + `opacity:.62` étaient là pour
  DÉSATURER UN ÉMOJI**, qui garde sa couleur quoi qu'on fasse. Une icône suit `currentColor` :
  l'onglet inactif s'éteint **par la couleur**, pas par un filtre — un filtre grise le trait au
  lieu de l'atténuer, et se voit en mode sombre. ★ **Un contournement survit toujours à la cause
  qu'il contournait** : chaque fois qu'on remplace un émoji, chercher ce qui a été mis en place
  pour compenser ses défauts.
- ⚠️⚠️ **Le harnais ne voyait pas les noms passés par une TABLE** (`{p:'cave', ic:'verre'}`).
  `verre` a été déclaré mort à tort — et surtout, **les autres n'échappaient au rouge que parce
  qu'ils servaient AUSSI ailleurs, par chance**. Corrigé : le harnais lit aussi `ic:'…'`.
  ★ **Un contrôle qui passe pour la mauvaise raison est un contrôle qui ne passe pas.**
- ⚠️ **La pastille de priorité** posait sa couleur en JS (`pillEl.style.background='var(--or-pale)'`,
  trois propriétés). Une couleur écrite en JS **échappe au thème**. Passée en classe.
- **L'échelle d'espacement 4/8 px** réclamée dans le cadrage n'est pas faite : elle touche
  `styles.css` en entier. → **DS-3.**
- **Le smoke et l'e2e n'ont pas tourné** (Playwright ne s'installe pas dans le bac à sable).
  Preflight 0/0 après regravure du cliquet — **13 interpolations non échappées contre 15 en
  référence, une baisse**, due au passage de libellés en `_escHtml`.

### 46g. ⚠️⚠️⚠️ LA RÉGRESSION QUE J'AI CAUSÉE, ET QUE PERSONNE N'AURAIT VUE

En refaisant `#home-stat-content` à la charte, j'ai changé **l'ordre de ses enfants**. Or le
**mode compact** de l'accueil les visait **par leur rang** :

```css
.home-w-compact #home-stat-content>div:first-child{font-size:24px;}
.home-w-compact #home-stat-content>div:nth-child(n+4){display:none;}
```

Après la charte, `:first-child` visait l'en-tête au lieu du chiffre, et `:nth-child(n+4)` ne
visait plus rien. ★★ **Le mode compact est une préférence PAR UTILISATEUR** : elle ne s'ouvre
jamais en développant. Le défaut serait parti en production et se serait manifesté chez la
seule personne qui a compacté sa carte d'accueil.

→ **Règle : aucune règle CSS ne vise un enfant par son rang dans un bloc que la charte remanie.**
Un rang se décale au premier remaniement, une classe non. C'est une assertion du harnais
(`#home-stat-content`, `#dp-taches`, `#home-dre`, `#home-msem`) et une contre-épreuve.

★ Même famille, même jour : `#home-stat-picto` et `#home-stat-chip` sont **vidés** par la charte,
et un élément vide **garde son fond, sa marge et son interligne** — il laisse un trou. `:empty`
les masque. **Vider n'est pas masquer.**

### 46f. ★ Ce que ces deux lots apprennent ensemble

★★★ **On m'a demandé quatre fois de refaire les icônes. La bonne réponse était de refuser la
question et de regarder le contenant.** Le signal aurait dû être le deuxième refus, pas le
quatrième : quand une correction ciblée ne change pas le verdict, **c'est le diagnostic qu'il
faut refaire, pas la correction**.

★ Et l'ordre des lots avait un sens caché : DS-1 était le **prérequis** de DS-2. Sans un jeu
d'icônes cohérent et une échelle de tailles fermée, la charte d'îlots n'aurait fait que
déplacer le désordre.

## 52. ★★★ LE TIMEOUT MAISON SUR LA CRÉATION DE COMPTE (18/08 — `firebase.js` seul, aucun bump)

> **Point de départ** : « La création d'un membre via réglage est longue, j'ai quitté l'App et
> revenu dessus après 5 min, ce n'est toujours pas créé. »

### 52a. Le diagnostic

`saveMembre` (reglages.js) → `window.createAuthAccount` (firebase.js) → Cloud Function
`createMemberAccount`, seul chemin de création depuis SEC-1 (§8c). Rien côté Cloud Function
n'explique plusieurs minutes : pas de boucle non bornée sur le chemin courant (l'appelant porte
déjà `plan` dans ses claims dans le cas normal → `_tenantPlanTrial` répond au 1er test, §14),
aucun e-mail envoyé par cette fonction.

Le blocage est **côté client, avant même l'envoi de la requête** : `createMemberAccount` exige
App Check (`enforceAppCheck:true`), et l'obtention du jeton reCAPTCHA peut rester en attente sur
réseau faible — le quotidien en Côte de Nuits (commentaire « réseau fantôme », firebase.js l.84).
Le timeout par défaut du SDK (70s, course interne à `httpsCallable`) ne couvre **pas** cette
attente : son propre chrono ne démarre qu'une fois la requête effectivement envoyée. D'où une
promesse qui ne se règle jamais, et un bouton « Création… » bloqué sans qu'aucune erreur ne
remonte — le symptôme vécu.

★★★ **Confirmé sur le terrain, pas seulement déduit du code** : 1re tentative bloquée puis
abandonnée ; 2e tentative, même e-mail, immédiate — **aucun** « déjà utilisé ». Preuve que la 1re
tentative n'avait **rien** créé côté Firebase : le blocage a eu lieu avant `createUser`,
cohérent avec un jeton App Check jamais obtenu plutôt qu'une Cloud Function lente à répondre.

### 52b. Le correctif

Une course maison (`Promise.race`) posée **autour de** `window.fbCallFn('createMemberAccount', …)`
dans `createAuthAccount`, hors SDK : elle règle toujours la promesse sous 25 s
(`_CAA_TIMEOUT_MS`), quelle que soit la cause du blocage. Le `catch` déjà en place dans
`saveMembre` (reglages.js) et dans `agtSaveAddMembre`/`agtLotGo` (admin-gt.js) gérait déjà un
message générique — aucune de ces trois fonctions n'a eu besoin d'être touchée : elles reçoivent
maintenant une vraie erreur (`code:'mv/timeout'`) au lieu d'une promesse qui ne se règle jamais,
et réaffichent le bouton normalement. ★ Bénéfice non cherché au départ : `agtLotGo` crée les
comptes **un par un dans une boucle séquentielle** (§18b lot 2) — sans ce correctif, un seul
blocage réseau au milieu d'une création en lot aurait gelé tout le lot, pas seulement un compte.

⚠️ **Le minuteur est nettoyé (`clearTimeout`) dans un `finally`** : sans ça, un appel qui réussit
avant les 25 s laisserait quand même le minuteur s'exécuter plus tard et rejeter dans le vide —
un rejet de promesse non géré, silencieux mais sale. Vérifié en contre-épreuve (52c).

⚠️⚠️ **Ce que ce correctif NE règle PAS** : `httpsCallable` n'expose pas d'`AbortController` —
l'appel Cloud Function continue en arrière-plan même après le timeout côté client. S'il finit
par réussir malgré tout, le compte Auth existe sans que l'app le sache : même risque de compte
orphelin que celui déjà documenté pour l'ancien fallback « app secondaire » (SEC-1, commentaire
juste au-dessus de `createAuthAccount`) — pas nouveau, juste rendu visible plus tôt (avant :
indéfini ; désormais : borné à 25 s au lieu de rester invisible pendant potentiellement des
minutes). Recours identique et déjà vérifié en conditions réelles : réessayer avec le même
e-mail — « déjà utilisé » confirme que la 1re tentative avait fini par passer.

### 52c. Contre-épreuves (Node, hors dépôt)

| scénario simulé | attendu | obtenu |
|---|---|---|
| appel qui ne se règle jamais (App Check bloqué) | rejette sous 25 s, `code:'mv/timeout'` | ✅ |
| appel qui réussit normalement avant 25 s | résultat inchangé, **aucun** rejet tardif après le délai | ✅ |

### 52d. Ce qui reste ouvert

La réconciliation d'un compte Auth orphelin (créé côté serveur après un timeout côté client, sans
fiche `membres` correspondante) reste à faire — **explicitement classée en second par Nico** :
« utile en filet, mais pas ce qui s'est passé cette fois ». Piste pour plus tard : un
`gtBackfillClaims`-like qui liste les comptes Auth du tenant absents de `membres`.

⚠️ **25 s est un choix, pas une mesure** — assez large pour un cold start + le pire cas de
`_tenantPlanTrial` (boucle séquentielle de `getUserByEmail` si l'appelant n'a pas `plan` en
claim), assez court pour rester utilisable. À resserrer ou élargir si l'usage réel le justifie.

## 53. ★★★ L'IMPORT KML EFFAÇAIT LE PARCELLAIRE (20/08 — `admin-gt.js` seul, aucun bump)

> **Point de départ** : « alexandre vient de m'envoyer un kml, il faut rajouter une parcelle […]
> si le kml ne contient que cette parcelle, cela ne risque pas d'effacer les autres ? »

**La question de Nico était la bonne, et la réponse était oui.** Le fichier reçu
(`Projet_de_carte_sans_titre.kml`) porte **un seul** `Placemark` : « Vris Bas », 7 points,
**0,66 ha** au calcul de `_agtGeoArea`, centroïde 47,0857 / 4,8791 — le second domaine, pas le prospect Gironde.

### 53a. Le défaut

`agtKmlSave` faisait `fbAdminWrite(slug,'kml_polygons', _agtKmlPolygons)`. Cette écriture
**remplace la clé entière**. Charger un fichier partiel effaçait donc tous les autres contours
du domaine, en silence, sans que l'écran l'annonce ni qu'un retour arrière soit possible.

★★★ **Le défaut n'était pas dans le code — il faisait exactement ce qui était écrit.** Il était
dans l'écran : un bouton nommé « Enregistrer pour ce domaine » qui **remplace** pendant que
l'opérateur croit **ajouter**. Aucun contrôle automatique ne trouve ce genre de défaut ; il ne
se voit qu'en se demandant ce que la personne devant l'écran croit être en train de faire.

### 53b. Les deux pièges trouvés en lisant le code avant de patcher

⚠️ **`parcelles` et `kml_polygons` sont deux clés séparées, reliées par le seul NOM.**
`initMap` fait `PARCELLES.find(x => x.nom.toLowerCase() === k.name.toLowerCase())`, et
`_pProxPolyOf` la même chose. Écrire le contour seul aurait donné **un polygone gris sans
fiche**, invisible dans tous les autres écrans. Une parcelle ajoutée à moitié est un piège
pire qu'une parcelle absente : elle se voit sur la carte, donc on la croit là.

⚠️⚠️ **`_pProxKmlSrc()` est un tout-ou-rien.** Dès que `kml_polygons` est non vide, il cesse de
lire `KML_DATA`. Or ce jeu en dur n'existe **que** pour `marchand-grillot` (`_MV_IS_MG`,
app.js l.33) : y écrire un fichier d'une parcelle aurait fait disparaître **les 46 contours du
domaine de production**. Garde-fou explicite sur ce seul slug — pour les autres domaines, une
base vide veut simplement dire « premier parcellaire », et l'écriture est légitime. ★ **Le même
avertissement pour tous aurait été faux dans les deux sens** : alarmiste sur un domaine neuf,
et noyé dans le bruit là où il compte.

### 53c. Ce qui a été fait

| | |
|---|---|
| **Deux gestes** | « **Compléter** » (défaut) garde les contours absents du fichier · « **Tout remplacer** » = l'ancien comportement, derrière une case à cocher qui nomme le nombre de contours perdus |
| **Rapprochement** | par `_agtInsKey` — accents, casse et ponctuation ôtés. « LES GRAVIERES. » met à jour « Les Gravières » au lieu de créer un doublon |
| **Aperçu** | ajoutées / mises à jour / conservées / supprimées, comptées **et** listées ligne à ligne avant d'écrire |
| **Fiches** | les fiches `parcelles` manquantes sont créées dans le même geste, surface calculée sur le contour |
| **Relecture** | le plan écrit se calcule sur une **relecture fraîche**, pas sur l'aperçu — le client travaille pendant que l'écran est ouvert |
| **État de la base** | `_agtKmlLu` distingue « base vide » de « lecture ratée ». Une lecture ratée **bloque** l'écriture au lieu de la traiter comme une base vide |

★ `agtKmlSave` ne lit plus le `<select>` du DOM mais l'état `_agtKmlSlug` : `agtRenderBody`
reconstruit tout le corps de l'onglet et **le choix du domaine se perdait à chaque rendu** —
défaut qui existait déjà avant ce lot et que personne n'avait vu.

★ **Échec partiel dit comme tel** : si les contours passent et les fiches sont refusées, le
message est « Contours enregistrés, fiches NON créées » — pas un succès, pas un échec.

### 53d. ⚠️⚠️⚠️ DEUX DE MES CINQ PREMIÈRES CONTRE-ÉPREUVES ÉTAIENT FAUSSES

Le harnais est sorti **46 verts / 2 rouges** — et les deux rouges étaient **mes assertions**,
pas le code. Même famille que §42f, une fois de plus :

- **C2** vérifiait `sortie.length === 3` pour prouver qu'un nom mal accentué est reconnu. Or le
  défaut donne **aussi** 3 : sans normalisation, « Les Gravières » sort des `gardes` *et* rentre
  comme nouveau. **Seul `majs.length` distingue** une mise à jour d'un remplacement silencieux.
- **C5** cherchait le motif `_agtKmlLu !== 'ok'` dans le fichier après l'avoir supprimé de
  `agtKmlSave`. **La même phrase existe dans `_agtKmlEtatHtml`** : la contre-épreuve disait vert
  sur du code dont la garde avait disparu.

★★★ **ET LA MÊME FAUTE S'EST REPRODUITE UNE TROISIÈME FOIS**, dans le script qui corrigeait le
chemin Windows : `assert '.pathname' not in s` — le mot était dans **le commentaire d'explication
que le patch venait d'insérer**. Le script s'est arrêté sur un fichier pourtant juste. ⚠️ Le seul
point positif : *l'assert est tombé AVANT l'écriture*, le fichier est resté intact, et le `sed`
de contrôle a montré la version non patchée — la garde de §27 a joué son rôle. La vérification
porte désormais sur **les lignes de code, commentaires exclus**.

★★★ **La règle** : *une contre-épreuve qui lit du texte ne prouve rien sur du comportement.*
Les six sont maintenant **fonctionnelles** — elles exécutent le code muté et regardent ce qui
est écrit. ★ Et une mutation qui **casse la syntaxe** fait rougir sans rien prouver : le harnais
passe désormais chaque mutant à `node --check` avant de conclure.

### 53e. Le harnais

`scripts/mv-harnais-kml-fusion.mjs` — **50 assertions**, branché dans `check` **et** `prebuild`.
Méthode C20 : les vraies fonctions sont extraites du fichier livré et **exécutées** sur des
stubs de `fbAdminRead`/`fbAdminWrite`.

⚠️ **Aucun chemin de bac à sable en dur** (§44 : six harnais du dépôt en portaient un et se
lisaient comme des succès sans jamais démarrer).

⚠️⚠️⚠️ **ET LA PREMIÈRE VERSION A PLANTÉ CHEZ NICO, LIVRÉE VERTE.** Pour éviter le chemin en dur
j'avais écrit `new URL('../src/admin-gt.js', import.meta.url).pathname`. Sous Windows, cette
propriété rend `/C:/Users/p4n0m/…` — un chemin absolu POSIX que Node repart ensuite en
**`C:\C:\Users\p4n0m\…`**, d'où un `ENOENT` en plein `prebuild`. Corrigé par `fileURLToPath`,
**la convention que `preflight.mjs` et `mv-harnais-carte-parcelle.mjs` suivaient déjà** : je ne
les avais pas regardés avant d'écrire.

★★★ **La leçon est sur le banc d'essai, pas sur le code.** Le bac à sable est Linux, la machine
de Nico est Windows. J'avais bien testé « depuis un autre répertoire » — le test ne pouvait pas
échouer là où je le lançais. **Un harnais vert dans un environnement ne dit rien du seul
environnement qui compte.** Quand une convention existe dans le dépôt, la copier vaut mieux que
de retrouver la bonne réponse seul : elle porte déjà les pannes des autres.

★ Vérification faite après coup sur les 26 scripts : **aucun autre `.pathname`**. Neuf harnais
dépendent en revanche de `process.cwd()` et ne démarrent pas depuis un autre répertoire — sans
effet tant que `npm` fixe le répertoire à la racine, donc **signalé, pas corrigé**.

⚠️ **L'extracteur perdait le mot-clé `async`** en cherchant `lastIndexOf('function')` : les
fonctions asynchrones remontaient sans lui et le harnais **plantait** au lieu de tester. Un
harnais qui plante compte pour rouge — c'est ce qui l'a fait voir.

**Contre-épreuve de la chaîne elle-même** : le défaut d'origine réintroduit → `npm run check`
sort en 1 ; `_agtKmlPlan` supprimée → le harnais sort en 1. Vérifié, pas déduit.

### 53f. Ce qui reste ouvert

- ⚠️ **La vraie liste des contours de le second domaine n'a pas été lue** — je n'ai pas accès à Firestore.
  Les 11 noms des captures sont des noms de test. L'écran affichera le vrai décompte.
- ⚠️ Le harnais `harnais-claude-md.mjs` sort **1 rouge préexistant** (`app.js:703` — `saveData`
  ne refuse plus à cette ligne). Antérieur à ce lot, laissé tel quel.
- Une mise à jour de contour **ne touche pas** la surface saisie dans la fiche. Choix assumé :
  la surface du cadastre et celle du contour dessiné ne sont pas la même chose.
- Le mode « Tout remplacer » ne supprime **aucune fiche** — seul le contour part.
- `smoke` et `e2e` **non joués** (Playwright ne s'installe pas dans le bac à sable).

## 54. ★★★ LE CLIQUET XSS, ET UN INTERRUPTEUR DÉJÀ BASCULÉ (22/08 — lot SEC-7, aucun bump)

> **Point de départ** : le backlog SEC-7, en deux volets — « App Check en enforce » et
> « nouveau contrôle C24, cliquet XSS ».

### 54a. ⚠️⚠️⚠️ Le volet App Check était DÉJÀ FAIT — et il n'a pas d'interrupteur

Le lot affirmait : *« Côté serveur, personne n'exige le jeton. Il faut le faire. »* **Faux.**
Console App Check du 22/08 :

| API | requêtes validées | non validées | état |
|---|---|---|---|
| Cloud Firestore | **100 %** | **0 %** | Appliqué |
| Authentication | 100 % | 0 % | Appliqué |
| Storage | — (aucune requête) | — | Appliqué |
| **Cloud Functions** | — | — | **aucun état : renvoi à la documentation** |

Il n'y avait **rien à basculer et personne à couper** : la mesure d'entrée demandée par le lot
(« s'il y a 5-10 % de requêtes sans jeton, pose-moi la question ») donne **0 %**.

★★★ **Et surtout : Cloud Functions n'a PAS de bascule dans cette console.** L'exigence se
déclare **fonction par fonction, dans le code** — `onCall({ enforceAppCheck: true })`. Une
consigne qui dit « toggle ON » pour une surface qui n'a pas de toggle est pire qu'une consigne
absente : on la coche, on croit avoir agi, et rien n'a bougé.

**C'est la quatrième fois qu'une entrée de backlog décrit du travail déjà accompli** (SEC-3 en
§44, où onze entrées étaient dans ce cas). La règle de §44 se confirme : *un backlog non
re-mesuré fait travailler dans le vide.* **Mesurer AVANT d'agir a été, ici, tout le travail
utile du volet 1.**

### 54b. L'inventaire des surfaces appelables (mesure d'entrée du lot)

**34 fonctions exportées · 29 appelables depuis le client · 27 `onCall` sur 27 portent
`enforceAppCheck: true`.** Les deux restantes sont des `onRequest` (`submitLead`,
`submitMiseEnRoute`, formulaires publics) : App Check ne s'y pose pas par option, et elles sont
déjà tenues par liste blanche CORS + pot de miel + débit par IP (SEC-6).

Chemins Firestore : une **seule** lecture ouverte, `/_guerettech/tenants` avec `allow read: if
true` — la résolution de slug avant authentification. Tout le reste est `isMyTenant` /
`isGtAdmin` / `if false`. C'est justement cette lecture publique que l'enforce Firestore borne.

### 54c. ★★★ CE QUE LA MESURE A CHANGÉ DANS LA RÈGLE C24

Le lot demandait : *« toute interpolation `${…}` dans un littéral affecté à `.innerHTML` »*.
Compté sur le dépôt : **461 puits HTML, dont 32 seulement reçoivent directement un gabarit à
substitution — 7 %.**

| membre droit du puits | nombre | part |
|---|---|---|
| concaténation | 209 | 45 % |
| variable nue construite plus haut | 73 | 16 % |
| autre | 72 | 16 % |
| constante ou vide | 75 | 16 % |
| **gabarit `${}`** | **32** | **7 %** |

★★★ **Et huit modules sur douze n'utilisent AUCUN gabarit** : `admin-gt`, `cave`, `pilotage`,
`planning`, `reserve`, `utils`, `firebase`, `onboarding` ont **zéro** `${…}` (vérifié deux fois,
lexeur et `grep`). Un contrôle ancré sur le point d'affectation n'aurait donc jamais regardé
`cave.js` (74 puits) ni `pilotage.js` (27) — **et se serait lu comme un succès.** C'est
exactement le décor que le lot interdisait.

**L'ancre est donc le FRAGMENT HTML, pas le puits** : partout où une chaîne contient du
balisage, on regarde ce qu'on y insère. 20 453 points d'insertion recensés.

⚠️ **Chiffres du 16/08 tous périmés** : 425 `.innerHTML =` → **448** · 577 `_escHtml` → **668** ·
529 `textContent` → **535**.

### 54d. ★★★ LE VRAI DÉFAUT : `_escHtml` DANS UN SLOT JS EST DÉFAIT, PAS INSUFFISANT

Dans `onclick="f('VALEUR')"`, la chaîne traverse **deux analyseurs à la suite** :
1. l'analyseur HTML lit l'attribut et **décode les entités** ;
2. le moteur JS compile ce qui en sort.

`_escHtml` rend `'` en `&#39;` — protection de l'étape 1, **annulée par l'étape 1 elle-même** :
l'entité ressort en apostrophe nue, qui ferme la chaîne JS. **23 emplacements** (14 motifs
distincts) étaient dans ce cas.

Le plus exposé : `cave.js:7018`, `_escHtml(r.parcelle.nom)`. **Un nom de parcelle est saisi par
n'importe quel compte du domaine.** Une parcelle nommée `'+alert(1)+'` s'exécutait chez qui
ouvrait l'écran de rendement.

⚠️ **Et quelqu'un avait senti le problème sans le comprendre** : `tracteur.js:36` portait
`_escHtml(p.nom)` suivi d'un `.replace` des apostrophes. Ce `.replace` ne trouvait **plus aucune
apostrophe** — `_escHtml` l'avait déjà rendue en `&#39;` avant lui. **L'ordre est tout** :
`_escAttr` double l'antislash et l'apostrophe **d'abord**, traite le HTML **ensuite**.

**Les 23 sont corrigés** (`cave.js` 17 · `admin-gt.js` 3 · `tracteur.js` 2 · `pilotage.js` 1).
`_escAttr` ajouté aux imports de `cave.js`, `admin-gt.js`, `pilotage.js` (il y était déjà dans
`tracteur.js`). ⚠️ **Correction site par site, jamais globale** : à `cave.js:560`, la **même**
valeur alimente un `id="…"` (contexte attribut → `_escHtml` reste juste) **et** un slot JS
(→ `_escAttr`). Un remplacement global aurait cassé l'identifiant.

### 54e. C24 — trois volets, et pourquoi trois

| volet | ce qu'il voit | référence gravée |
|---|---|---|
| **C24a** liste nominative | mauvais échappeur dans un slot JS | **0** (était 14 motifs / 23 sites) |
| **C24b** compteur | slot JS sans `_escAttr` | **166** |
| **C24c** compteur | substitution `${}` non couverte | **332** |

C24a est en **liste nominative** parce que c'est un **défaut**, pas de la dette : chaque cas
porte un nom et aucun nouveau ne peut apparaître. C24b et C24c sont des **compteurs** : la dette
existe, on interdit qu'elle monte.

⚠️ **Ce que C24 ne sait pas voir**, et c'est le revers du piège n°1 : une valeur échappée **en
amont** puis passée par variable lui est invisible. Il ne lit que l'interpolation — règle héritée
de C19. Une contre-épreuve qui teste l'amont est **fausse**, pas le code (ça m'est arrivé, 54g).

### 54f. La liste des aides sûres est DÉDUITE, pas écrite

Une liste écrite à la main vieillit sans que personne s'en aperçoive, et c'est exactement
l'endroit où l'on glisse un nom pour faire taire une alerte. Elle est donc **calculée par point
fixe** : une aide dont *tous* les `return` sont sûrs est elle-même sûre, on recommence jusqu'à
stabilité (6 tours au plus). **139 aides** en sortent. Conséquence voulue : une aide qui cesse
d'échapper sort de l'ensemble toute seule et tous ses appels redeviennent rouges.

⚠️⚠️ **À DIRE FRANCHEMENT : sur le dépôt d'aujourd'hui, le point fixe ne retire AUCUN constat.**
Mesuré dans les deux sens : **332 et 166 avec comme sans**. Les 139 aides vivent toutes dans les
modules écrits en concaténation, aucune n'est appelée depuis une substitution. Il est gardé pour
que la **première** personne qui écrira `${_mvInfoBtn(…)}` dans un gabarit n'ait pas un faux
positif au visage — et deux contre-épreuves croisant `utils.js` et `app.js` prouvent le
mécanisme, faute de pouvoir le prouver sur un site de production.

### 54g. ⚠️ DEUX DE MES CONTRE-ÉPREUVES ÉTAIENT FAUSSES — ENCORE

Même famille qu'en §53, deux lots de suite :

- **Celle de `reglages.js`** modifiait une affectation **en amont** de l'interpolation. C24 ne
  lit que l'interpolation : elle ne *pouvait pas* rougir. L'épreuve testait quelque chose que le
  contrôle ne prétend pas voir.
- **Celle du point fixe** transformait la **définition** d'une aide en gabarit : elle prouvait
  qu'un gabarit neuf est vu, **pas** que l'ensemble se recalcule. Remplacée par une paire
  croisant deux fichiers (`utils.js` cassé → l'appel rougit dans `app.js`).

★★★ **Et une leçon neuve, sur la façon de LIRE un rouge.** Le preflight porte vingt-cinq
contrôles : un rouge de C11 ou de C15 fait sortir `1` tout aussi bien. **Lire le seul code de
sortie aurait rendu vertes des contre-épreuves qui ne prouvent rien** — la faute de §48, une
assertion incapable d'échouer. Le harnais exige donc, **sur la sortie** : le volet attendu, sur
le fichier attendu, au niveau attendu. Et il commence par un **témoin** : la copie intacte doit
sortir verte, sinon tout rouge obtenu ensuite est ininterprétable.

★ **Quatre épreuves sont INVERSES** : elles injectent un motif qui *ressemble* à une faute et
exigent le vert. Un cliquet qui crie au loup est un cliquet qu'on débranche — les faux positifs
se testent aussi.

### 54h. C25 — le jeton App Check ne doit pas se perdre en chemin

Puisque Firebase ne peut pas imposer App Check aux Functions, **rien** n'empêchait d'écrire la
28ᵉ `onCall` sans le jeton : ni `node --check`, ni ESLint, ni le déploiement. C25 est ce filet.

- **`C25_oncall_sans_appcheck`** — liste nominative, **zéro toléré** (aucune dette à absorber,
  contrairement à C24). Référence vide.
- **`C25_surface_http`** — les deux `onRequest` gravées : une troisième porte publique devra
  être un acte conscient.

⚠️ Il ne lit que des options en **objet littéral sur place**. Si elles passent un jour par une
constante partagée, il **le dit en avertissement** au lieu de se taire — une absence non
confirmée se lit comme un succès, et ça a coûté cher deux fois ici.

### 54i. `harnais-escattr.mjs` — on ne compte pas, on rejoue

Un compteur ne prouve pas un comportement. Ce harnais **extrait les vraies `_escHtml` et
`_escAttr` de `src/utils.js`** (aucune recopie), les applique à huit valeurs hostiles, **rejoue
le décodage d'entités du navigateur**, puis vérifie que la chaîne JS reste fermée au bon endroit
et que la fonction appelée reçoit la valeur d'origine intacte.

★★★ **Et il exige que `_escHtml` ÉCHOUE le même test.** Un harnais que les deux échappeurs
passent ne prouverait rien. 15 assertions vertes. Branché sur `npm run check` **et** `prebuild`.

### 54j. `--only=` dans le preflight

Le preflight coûte **26 s** (coût préexistant : C1 lance un `node --check` par fichier, C20
exécute des fonctions). Une contre-épreuve qui le relance dix-neuf fois payait dix-neuf fois ce
prix. `--only=C24,C25` le ramène à 4 s. ⚠️ **Refusé avec `--baseline`** : regraver sur un
passage partiel amputerait la référence des clés non recalculées.

### 54k. Aucun bump — vérifié, pas cru

`cave.js`, `admin-gt.js`, `pilotage.js`, `tracteur.js` : tous dans la liste « zéro bump ». Mais
la règle a été **relue dans le code** plutôt que crue sur parole, parce qu'un correctif de
sécurité qui n'atteint jamais les clients serait un faux succès :

`public/sw.js` sert `index.html` en **NETWORK-FIRST**. Au premier chargement en ligne, le client
reçoit l'`index.html` frais, qui référence les nouveaux fragments hachés ; ceux-ci ne sont pas en
cache, donc téléchargés. **Le correctif arrive sans toucher au service worker.** Seul reliquat :
les anciens fragments restent en cache tant que `CACHE_NAME` ne change pas — coût de disque, pas
de correction manquée.

### 54l. Ce qui reste ouvert

- **C24b = 166 · C24c = 332.** Dette réelle, gravée, qui ne peut plus monter. C24c est dominée
  par des locaux non résolvables (`pct`, `col`, `moisNom`) et par des formateurs non prouvés.
- ⚠️ **`_mvIcon` n'échappe pas son nom d'icône** : le paramètre part cru dans `href="#ic-…"`.
  C'est pour ça que le point fixe le refuse — **le contrôle a raison**. Risque faible (les
  appelants passent des littéraux), mais le correctif tient en un `_escAttr`. **Non fait :
  `utils.js` est hors du périmètre « aucun bump » de ce lot.**
- ⚠️ **`_mvBadge` non plus** : son `ton` va cru dans un `class="…"`. Même situation, même raison.
- `npm run lint` **non joué** (ESLint ne s'installe pas dans le bac à sable) · `smoke` et `e2e`
  non joués (Playwright, idem).

## 55. ★★★ LA FEUILLE D'HEURES DISAIT +8H30 LÀ OÙ ELLE DEVAIT DIRE −9H (23/08 — APP 6.46 → 6.47 · SW 7.01 → 7.02)

> **Point de départ**, en deux temps. D'abord le PDF « Heures — Victor — Août 2026 » :
> *« encore des erreurs dans planning, il faut corriger ça. Corrige aussi les polices et les
> textes et alignements en bas de pages. Le relevé doit être pro : il y a des erreurs de calcul,
> de typo, de police et de taille de police. »*
> Puis, après la première passe : *« on avait dit que les remplacements — et ce n'est pas la
> première fois que je le répète — comptent comme les heures normales, c'est-à-dire comme si le
> planning était déjà prévu comme ça (puisque ça ira en remplacement d'un autre moment), donc
> Victor doit logiquement être en heure négative sur ce planning ! »*

**Livré** : `src/planning.js`, `src/utils.js`, `index.html`, `public/sw.js`, `package.json`,
`scripts/preflight.mjs` (C26), `scripts/mv-harnais-releve.mjs`, `scripts/mv-harnais-retard.mjs`,
`scripts/mv-harnais-fuseau.mjs` (neuf), `scripts/mv-harnais-vignoble.mjs`,
`scripts/mv-harnais-cuvdoc.mjs`.
⚠️ **APP 6.46 → 6.47 · SW 7.01 → 7.02.** Le lot a démarré à « aucun bump » (`planning.js` seul) et
**a fini dans `utils.js`** : la règle de §25 impose alors le double bump. *Un lot qui change de
périmètre change de règle de version — le relire à la fin, pas au début.*

---

### 55a. D'abord refaire les chiffres. La plupart étaient JUSTES.

Avant de corriger quoi que ce soit, la feuille a été **recalculée à la main** contre le modèle
réel — `PLAN_DEF.standard[7] = {24:8.5, 25:8.5, 26:8.5, 27:8.5, 28:5, 31:8.5}`, c'est-à-dire la
**fermeture d'été du domaine : août n'ouvre qu'au 24**.

| Chiffre imprimé | Reconstitution | Verdict |
|---|---|---|
| Faites **77h30** | 8,5+8,5+8+0+5 (17→21) + 34 + 5 + 8,5 | ✓ |
| Référence **69h** | 47,5 (modèle) + 22 (remplacements) − 0,5 (retard neutralisé) | ✓ **arithmétiquement** |
| Écart **+8h30** | 77,5 − 69 | ✓ arithmétiquement |
| Plafond **593h39** | 1607 × 587 / 1589 | ✓ **au centième** |
| Reste **516h09** | 593,65 − 77,5 | ✓ |
| Modulation **4h** | seule la semaine 24→30 dépasse 35 h (39 h) | ✓ |
| Coupure **16 jours** | 31/07 → 17/08 | ✓ |
| CDD **577 jours** | 01/01/2025 → 31/07/2026 | ✓ |
| **9 JOURS** | dix jours portent des heures | ✗ |

★★ **Le plafond annuel a été retrouvé à la minute près en resommant les douze mois du
template** : **1 589 h** planifiées sur l'année, **587 h** sous contrat du 17/08 au 31/12. Sans ce
calcul, j'aurais « corrigé » un prorata parfaitement juste. *Un chiffre qu'on ne sait pas refaire
n'est pas un chiffre faux : c'est un chiffre qu'on n'a pas compris.*

⚠️ Et c'est ce même recalcul qui a rendu la seconde phrase de Nico exploitable : **l'écart de
+8 h 30 venait ENTIÈREMENT du 19**, un jour de fermeture travaillé en retard. Les 17, 18, 21, 24
à 28 et 31 pesaient tous exactement zéro. Sans la décomposition jour par jour, on cherche le
défaut partout.

---

### 55b. ★★★ LA RÈGLE : une référence calculée sur le résultat ne mesure plus rien

```js
// AVANT
h += _planDayH(plId, m, d, e);   // les heures FAITES
```

`_planRempH` définissait la référence d'un jour d'échange par **ce qui y avait été fait**. La
conséquence est mécanique et ne dépend d'aucune donnée : `référence == fait` ⇒ **écart ≡ 0, dans
les deux sens**. Arriver à 10 h sur un jour de remplacement ne devait rien. Y faire douze heures
ne créditait rien. Le commentaire d'origine l'annonçait même comme une intention — *« entrent
dans la référence → écart nul »* — sans voir que la nullité était un **artefact de la formule**,
et non le résultat d'une mesure.

```js
// APRÈS
h += fait ? _planDayH(plId, m, d, e) : _planRefH(plId, m, d, e);   // l'ATTENDU
```

`_planRefH` rend l'horaire posé à la saisie, ou le modèle. Sur un jour d'échange **normal**,
attendu == fait : **zéro régression**. L'écart n'apparaît que quand la journée n'a pas été tenue —
ce qui est précisément ce qu'on lui demande.

★ Le second argument `fait` existe pour `_planPresentRef` (« qui était au champ »), qui est une
mesure de **présence** et non de référence : elle continue de lire les heures faites. *Deux
questions différentes, deux mesures — les fondre aurait recréé §34.*

---

### 55c. ⚠️⚠️⚠️ MAIS LA RÈGLE NE SUFFISAIT PAS : L'ENREGISTREMENT DÉTRUISAIT LA PREUVE

C'est la **cause racine**, et elle n'est pas dans le calcul.

`_planApplyAbs` **reconstruit l'entrée à neuf** — `var e = {absent:true, motif:…}` — et n'en
reprenait que le `timing`, **et seulement pour le retard**. Poser une absence sur un jour
d'échange effaçait donc **l'horaire ET le drapeau `remplacement`** : la seule trace de ce qui
était attendu ce jour-là. L'absence devenait **gratuite**.

Le commentaire en place justifiait pourtant exactement le bon raisonnement, puis s'arrêtait un
cran trop tôt :

> *« Sans lui, un jour supplémentaire perdait sa seule source d'heures. On ne le garde QUE pour
> le retard : les autres motifs effacent bien la journée. »*

C'est vrai d'un jour **au modèle** : le modèle reste et porte la référence. C'est **faux** d'un
jour d'échange, où l'horaire posé *est* la référence.

```js
var _remp = !!(_prev && _prev.remplacement && _plJ <= 0);
if (_prev && _prev.timing && (mo.heures || _remp)) e.timing = _prev.timing;
if (_remp) e.remplacement = true;
```

⚠️ **La condition est le drapeau d'échange, PAS « tout jour à 0 h ».** Un **jour supplémentaire**
(horaire posé, sans échange) ne doit rien : personne ne l'attendait. Lui laisser son horaire ferait
naître une référence de 8 h 30 sur une journée où il n'était pas convoqué, et le réglage « heures
dues » lui réclamerait la journée entière. C'est le harnais du retard, **J16**, qui a tenu cette
distinction quand ma première version l'avait perdue.

★★★ **Conséquence pratique, à ne pas oublier : les entrées des 19 et 20 août chez
le domaine de référence ont été enregistrées AVANT ce correctif. Elles ne portent plus ni horaire ni
drapeau, et AUCUN calcul ne peut les retrouver.** Le moteur est juste, la donnée est perdue :
**il faut reposer ces deux jours à la main** (Annuler l'absence → mode Remplacement 07:00→16:30 →
reposer le retard / l'absence). Tant que ce n'est pas fait, la feuille sort à **+8h**.
Le harnais teste ce cas exprès, sous le nom **`Victor3`**.

---

### 55d. La référence descendait SOUS ZÉRO

`_planAbsLostH` retranchait `_planRefH − _planDayH` **sans jamais regarder si le jour était dans
la référence**. Le 19 : 0 h au modèle, aucun drapeau (détruit, cf. 55c) — donc rien dans la
référence — et pourtant **0 h 30 lui étaient retirées**. Référence à **−0 h 30** pour cette
journée, plus 8 h faites comptées en heures supplémentaires : **un seul jour fabriquait +8 h 30 à
partir de rien.**

Primitive neuve, définition unique :

```js
function _planRefPart(plId, m, d, e){
  if (e && e.type === 'recup') return 0;
  var pl = _planPlanned(plId, m, d);
  if (pl > 0) return pl;                                  // le modèle fait foi
  if (e && e.remplacement) return _planRefH(plId, m, d, e); // l'horaire posé fait foi
  return 0;                                               // repos, jour supplémentaire, extra
}
```

★★ **Et la borne ne vaut QUE pour la neutralisation.** Les deux mesures de `_planAbsLostH` ne
tiennent pas le même registre : `duesOnly=false` **retire de la référence**, `duesOnly=true`
**inscrit une dette au compteur d'heures**. Les borner toutes les deux effaçait la demi-heure due
d'un jour supplémentaire (harnais du retard, **J13**) ; n'en borner aucune gardait le défaut.

```js
var _perdu = Math.max(0, _planRefH(…) - _planDayH(…));
h += duesOnly ? _perdu : Math.min(_perdu, _planRefPart(…));
```

⚠️ La borne corrige aussi un défaut latent jamais vu : un jour à 7 h portant un horaire saisi de
9 h en retirait **9** de la référence.

---

### 55e. Le retard n'était pas compté comme jour travaillé

`_planDayStatus` garde `t:'absent'` pour un retard — c'est la clé des tables de couleur et de
`_PLAN_ST_OFFDAY`. `_planDaysWorked` l'excluait donc : la feuille écrivait **« 77h30 au domaine ·
9 jours »** alors que **dix** jours portaient des heures, dont les 8 h du 19. Le drapeau `retard`,
posé par `_planDayStatus` et lui seul, rouvre la porte ; formation (`assim`) et absence payée
restent hors du compte MSA / TESA, ce qui est leur place.

⚠️ **Le défaut ne touchait pas que le PDF** : `_planDaysWorked` sert aussi le décompte annuel de
jours travaillés (l. 2839).

---

### 55f. Le tableau d'année affirmait sept mois à zéro

Le document est construit **sous `_planSurContrat`** : hors de la période du contrat courant,
`_planSupMonth` / `_planRecupH` / `_planYearBalance` rendent 0. La boucle partait de janvier — elle
imprimait donc **« Janvier 0h · Février 0h · … »** pour **sept mois où Victor a travaillé à temps
plein**, sous le CDD précédent. Et **trois lignes au-dessus**, le même document affirmait *« deux
périodes séparées par une coupure comptent séparément »*.

★★ *Un zéro qui veut dire « pas sous ce contrat » et un zéro qui veut dire « rien fait » ne
peuvent pas partager la même case.* Le tableau démarre au mois du contrat, et une phrase dit
pourquoi : *« Le compteur de ce contrat s'ouvre le 17/08/2026 : les mois antérieurs relèvent du
contrat précédent et sont soldés à part. »*

---

### 55g. ★★ Les polices : Outfit ne monte qu'à 700

`public/fonts/fonts.css` charge Outfit en **300, 400, 500, 600, 700**. La feuille demandait
**`font-weight:800` en huit endroits** — tous les gros chiffres. Chacun était un **faux gras
synthétisé** par le moteur d'impression, épaissi géométriquement, qui bave à l'impression laser.
Plus aucun 800 dans le document.

Deux autres causes, plus sournoises, à « la police n'est pas la bonne » :

1. ⚠️ **Le document naît dans une fenêtre `about:blank`** (`window.open('') + document.write`).
   `/fonts/fonts.css` s'y résout par héritage de l'ouvrant sous Chrome desktop — **pas sous iOS
   Safari**, où la feuille retombait en Times. `<base href="…">` absolue posée.
   *Le défaut se voyait sur l'iPad d'un client et jamais sur le poste de Nico.*
2. ⚠️ **`setTimeout(print, 400)`** partait souvent **avant** l'arrivée d'Outfit : l'aperçu se
   composait en police système. Remplacé par `document.fonts.ready`, avec un filet à 2,5 s.

★ Et le `font-family:monospace` des horaires « 07:00→16:30 » : c'est le monospace **du
navigateur** — Courier sur beaucoup de postes — au milieu d'une page en Outfit. Supprimé au profit
de `font-variant-numeric:tabular-nums`, posé une fois sur `body`.

---

### 55h. ⚠️⚠️ « about:blank 1/2 » en pied d'un document de paie

`@page { size:A4; margin:10mm }` **laissait au navigateur la place d'écrire ses propres en-têtes
et pieds** : l'horodatage, le titre, le numéro de page — et l'URL, c'est-à-dire **`about:blank`**.
C'est ce que Nico voyait en bas de sa feuille de salaire.

`@page { margin:0 }` : il n'y a plus de boîte où les écrire. La marge utile est portée par
`.sheet` (11 mm / 10 mm / 9 mm), au-delà de la zone non imprimable des laser A4 (≈ 5 mm).

★ Et il **n'y avait nulle part où signer** : un filet, puis le mot « Signature salarié »
*dessous* — la ligne passait donc au-dessus du libellé, dans le blanc du bloc précédent. Libellé,
puis **cadre de 21 mm**, précédés de « Fait le … à … ». Le pied porte désormais l'identité du
document (nom · mois · édité le), puisque le navigateur ne la donne plus.

---

### 55i. Le reste, en vrac — et pourquoi ce n'est pas du détail

- **Colonne de gauche vide.** La grille coupait à jour fixe (1-15 / 16-31). Un contrat ouvert le
  **17** laissait la colonne de gauche réduite à son bandeau d'en-tête, et tassait quinze lignes à
  droite sur une demi-page. On coupe sur le **nombre de lignes réellement rendues**.
- **`PLAN_MOIS_C` était à moitié anglais** : `'Jun'`, `'Jul'`. Le bloc congés imprimait
  **« JUN 2026 → MAI 2027 »**. Passé aux abréviations AFNOR NF Z44-001, quatre caractères maximum
  (aucune largeur fixe côté CSS — vérifié sur `.plan-bar-lbl`, `.plan-mo-tab`, `.plan-ref-mo-n`).
- **« du 1 janvier 2025 »** — le premier du mois est un ordinal.
- **« ETP 1.12 »** disait **deux faussetés en huit caractères** : le point décimal sur un document
  français, et le mot. `s.etp` vaut `worked/ref` — un **taux de réalisation**, pas un équivalent
  temps plein. Un salarié à 1,12 ETP n'existe pas ; à 112 % de son prévu, si.
  ⚠️ **Le libellé « ETP » subsiste à l'écran** (`pl2-mc-etp`) : le renommer partout est une décision
  de vocabulaire, pas une correction.
- **« Compteur au Aoû »**, **« (AU AOÛ) »**, **« il y a 0 mois »** pour le mois courant.
- **`-8 j`** au trait d'union à côté de colonnes en `−` (U+2212). `_planFmtE` rend maintenant le
  vrai signe moins ; `_planFmt` est laissé tel quel (200 appelants, gain nul).
- **Un jour de formation s'imprimait en ROUGE SANG.** `LBG`/`LFG` sont indexées sur `t`, et
  `'absent'` recouvre **quatre** choses : injustifiée (rouge, c'est juste), absence **payée**,
  jour **assimilé** (formation, événement familial) et **retard**. L'écran, lui, les montre en
  orange et en bleu. *Un salarié lisait « formation » écrit comme une faute.*
- **Le même total écrit deux fois** : « 77h30 comptées » à 4 cm de « 77h30 au domaine ». Ils ne
  diffèrent que s'il y a formation ou événement familial. La cellule d'heures n'apparaît donc plus
  que dans ce cas, et la place rendue sert au **compte de jours**, qui manquait.
- **Plancher de police à 8,5 px**, corps de tableau à 10 px, notes à 9 px. En dessous, un relevé
  se lit à la loupe.
- **Émojis retirés des titres de section** (⏱ 📅 📄 🌴 💶). Le raisin de l'en-tête reste : c'est la
  marque. ⚠️ §45 avait posé l'emoji comme **réponse structurelle** pour le document imprimé, qui
  n'a pas le sprite — la bonne réponse était en fait **de ne rien mettre du tout**.
- **La référence annonce sur combien de jours elle porte** (« Référence 86h · 5 jours prévus »).
  Ce n'est pas de la décoration : c'est ce qui rend le chiffre **vérifiable** par le lecteur, et ce
  qui aurait évité, en amont, la question « d'où sortent ces 69 h ? ».

---

### 55j. ★★ CE QUE LES HARNAIS ONT TROUVÉ — trois rouges, et j'avais tort une fois sur trois

Le harnais du retard a rougi **trois fois** après le correctif du moteur. La règle de §20 (*« quand
une assertion échoue, demander d'abord quel côté a tort »*) a donné trois réponses différentes :

| Rouge | Qui avait tort | Décision |
|---|---|---|
| **J13** — 0,5 h due au compteur | **moi** : j'avais borné les deux registres | borne retirée sur la dette |
| **J14** — 0,5 h neutralisée dans la référence | **l'assertion** : elle gravait le défaut | assertion inversée, avec sa preuve écrite |
| **J16** — une injustifiée n'hérite pas du timing | **moi** : j'avais généralisé à « tout jour à 0 h » | condition ramenée au drapeau d'échange |

★★★ **J14 mérite d'être relu** : l'assertion exigeait qu'on retire 0,5 h **d'une référence qui ne
contenait pas ce jour**. Elle était verte depuis le lot du 20/08 et **elle décrivait le bug**. Un
harnais écrit après coup grave le comportement observé, pas le comportement voulu — *une assertion
verte n'est pas une preuve de justesse, c'est une preuve de stabilité.*

⚠️⚠️ **Et une contre-épreuve est restée verte** : « l'enregistrement d'une absence reperd le drapeau
d'échange ». Cause : le harnais du relevé **écrit `PLANNING_ENTRIES` à la main** et ne traversait
donc **jamais** `_planApplyAbs` — la fonction dont il prétendait couvrir le défaut. Corrigé par une
section **8d** qui appelle réellement `window._planApplyAbs`. *C'est la même famille que §42f et
§53 : trois lots de suite avec une contre-épreuve sans effet.*

**État final** : préflight C11→C25 vert · harnais du retard **91 assertions** · harnais du relevé
**83 assertions** et **22 contre-épreuves, toutes rouges quand on réinjecte le défaut**.

★ **`mv-harnais-releve.mjs` a été ajouté à `npm run check` et `prebuild`** : il existait depuis le
13/08 (§38) et **ne tournait dans aucune chaîne**. C'est la douzième entrée de la chaîne.

---

### 55k. Le compte final

| | avant | après (jours reposés + 55m) |
|---|---|---|
| Référence | 69h | **77h30** (39 h d'échange, moins les 9 h non tenues) |
| Heures faites | 77h30 | 77h30 |
| Écart au prévu | +8h30 | **=** *(la dette n'est pas là — voir 55m)* |
| **Heures dues** | 0h30 | **−9h** |
| Jours au domaine | 9 | **10** |
| **Reste à prendre** | +8h | **−9h** |

−8 h 30 pour la journée injustifiée, −0 h 30 pour le retard : **chaque faute pénalise une seule
fois**, et les deux dans le **même registre** — celui qui se cumule. C'est le « logiquement
négatif » de Nico, sur la seule ligne qui survit au changement de mois.

---

### 55m. ★★★ ET IL EN MANQUAIT HUIT — le trou que Nico a vu sur la feuille corrigée

> *« Sur la feuille c'est marqué qu'il y a les trente minutes de retard, mais elles sont passées
> où, les huit heures de l'absence injustifiée ? Elles sont dues, donc il faut les compter aussi. »*

**Il avait raison, et c'était pire que ce qu'il décrivait : elles n'étaient nulle part.**

`_planAbsLostH` laissait l'absence injustifiée sous le garde-fou `CONFIG.hsup_dues_debut`, non posé
chez le domaine de référence. Hors fenêtre, ses heures ne passaient donc **que par l'écart du mois**. Or :

```js
function _planSupMonth(mbr,m){ … return Math.max(0, _planSummary(mbr,m).ecart); }
```

★★★ **`Math.max(0, ecart)` écrase tout écart négatif à zéro.** Un écart négatif n'entre jamais dans
`_planYearBalance.plus`, ni dans `_planBank`, ni dans « reste à prendre ». **Il ne porte rien.**
Les huit heures étaient affichées en gros dans une tuile, et **le mois suivant il n'en restait
aucune trace**. Les trente minutes de retard, elles, survivaient — parce que le retard était sorti
de la fenêtre le 20/08.

★★ **Et l'écran qui pose le motif promettait l'inverse, noir sur blanc.**
`PLAN_ABS_MOTIFS` : `{id:'injustifie', sub:'Heures dues · journée non payée'}`, et `_planAbsEffet`
affiche sous le bouton « Plafond inchangé · **heures dues** ». *Le moteur ne tenait pas la promesse
de son interface tant qu'un réglage caché n'était pas posé* — **c'est §53 en plus discret** : un
écran qui annonce un effet que le code ne produit pas.

**Correctif** — l'injustifiée rejoint le retard hors de la fenêtre :

```js
var _du = (mo.heures || mo.id === 'injustifie');   // les deux motifs qui DOIVENT des heures
if (!actif && !_du) continue;
if (duesOnly && !_du) continue;
```

⚠️ **La vanne n'est ouverte que pour ces deux-là.** Arrêt de travail, congé sans solde et absence
non précisée restent sous garde-fou hors fenêtre — sinon un arrêt maladie créerait une dette, ce
que la loi interdit. **C3b, C3c, C3d, C3e** le tiennent, et sont neuves pour ça.

★ **Conséquence d'affichage, à connaître avant de s'en étonner** : les heures dues sont
**neutralisées dans la référence** avant d'être inscrites au compteur — sinon la même heure serait
comptée deux fois. **L'écart d'un mois à absence tombe donc à zéro.** Ce n'est pas une perte
d'information : l'écart ne pouvait de toute façon rien porter (il est écrasé dès qu'il est négatif).
La dette vit désormais dans « heures dues » et dans « reste à prendre », **qui, eux, se cumulent**.
La ligne « Ce mois » affiche maintenant les heures dues, pour qu'un « reste à prendre −9h » ne
tombe plus du ciel.

⚠️⚠️ **C3 et C4 du harnais du retard gardaient ce trou sous le nom « non-régression ».** Deuxième
assertion de ce lot à graver un défaut au lieu de le tenir (la première était J14, 55j). Toutes
deux étaient vertes depuis le 20/08. *Une assertion écrite après coup décrit le comportement
observé ; seule une assertion écrite depuis la règle décrit le comportement voulu.*

⚠️ **Et une quatrième assertion fausse de ma main**, dans le même quart d'heure : `C4b` appelait
`poser()` — qui **remet `ENT` à vide** — puis mesurait, et accusait le code de ce que le décor
faisait. *Le décor d'un harnais est du code comme un autre.*

★ **Rétroactivité assumée.** `hsup_dues_debut` existait pour que rien ne bouge sur une paie déjà
éditée. Sortir l'injustifiée de la fenêtre **change les mois passés** de MG et le second domaine s'ils
portent des absences injustifiées. C'est un arbitrage, pas un oubli : le comportement d'avant
n'était pas une politique choisie, c'était un trou — et l'interface promettait déjà l'autre
comportement à chaque saisie. **À vérifier après déploiement (backlog n°4).**

### 55n. ⚠️⚠️⚠️ LE HARNAIS LIVRÉ VERT A BLOQUÉ LE DÉPLOIEMENT — troisième piège Windows

```
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: … Received protocol 'c:'
C:\Users\p4n0m\Documents\GitHub\mavigne-dev>
```

`mv-harnais-releve.mjs` faisait `await import(CIBLE)` où `CIBLE = path.resolve(…)`. Sous Linux,
`/home/claude/…` passe **par chance** — `import()` tolère un chemin qui ressemble à un chemin
absolu POSIX. Sous Windows, `path.resolve()` rend `C:\Users\…`, et Node lit **« c: » comme un
schéma d'URL**. Le script meurt **avant sa première assertion**.

★★★ **Et je venais de l'ajouter à `prebuild`.** Donc `npm run build && firebase deploy` ne passait
plus du tout. *Un filet de sécurité posé dans le chemin critique doit être éprouvé sur la machine
qui l'exécutera, pas sur celle qui l'écrit.*

**Troisième occurrence du même piège** — §53 : `new URL(…).pathname` rendait `/C:/Users/…`. Le bac
à sable est Linux, la machine de Nico est Windows : **aucun de mes essais ne peut l'attraper**.
La seule forme juste des deux côtés :

```js
import { pathToFileURL } from 'node:url';
await import(pathToFileURL(CIBLE).href);
```

★★ **Une leçon qui se répète trois fois n'a pas besoin d'un rappel, elle a besoin d'une règle.**
**C26** (neuve) interdit `import()` d'un chemin brut dans `scripts/`. Elle accepte : un littéral
de chaîne (`'playwright'`, `'data:…'`), `pathToFileURL(…)`, et toute variable dont le nom contient
`url`/`href`. Elle a trouvé **deux autres harnais dormants** avec le même défaut :
`mv-harnais-vignoble.mjs` et `mv-harnais-cuvdoc.mjs` — ce dernier testait même
`CIBLE.startsWith('/')`, **une hypothèse Unix écrite noir sur blanc**.

⚠️ **Et la première version de C26 rougissait sur ses propres commentaires** : le texte qui
explique la règle contient `await import(CIBLE)`, donc la règle se trouvait elle-même. **Quatrième
fois** qu'un contrôle tombe sur les mots que je viens d'écrire (§53, §54). Corrigé par
`blankJsComments()` — qui existait déjà dans `preflight.mjs`, et que je n'avais pas cherché.

**Contre-épreuves** : `import(CIBLE)` → 1 erreur · `import(path.resolve(x))` → 1 erreur ·
forme corrigée → 0. Vérifiées en réinjectant chaque défaut.

### 55o. ★★★ LE JOUR D'APRÈS TOMBAIT SUR LE MÊME JOUR — actif chez tous les clients

Le harnais du relevé, une fois réparé (55n), a tourné **chez Nico**. Un rouge, en **section 0** —
donc sur du code que ce lot n'avait pas touché :

```
ROUGE  Chloé n'en a qu'UNE (contrats contigus fusionnés)
       → [{"debut":"2026-01-06","fin":"2026-06-30"},{"debut":"2026-07-01","fin":"2026-12-31"}]
```

**Vert chez moi. Rouge chez lui.** La cause, dans `utils.js` :

```js
var t = Date.parse(iso + 'T00:00:00');            // ← lu en heure LOCALE
return new Date(t + 86400000).toISOString()…      // ← resérialisé en UTC
```

★★★ **`'2026-06-30T00:00:00'` sans suffixe de fuseau est lu comme minuit LOCAL.** À Paris, minuit
local vaut **22 h (été) ou 23 h (hiver) la VEILLE en UTC**. Ajouter 24 h donne 22 h le 30 juin →
`toISOString()` rend **`'2026-06-30'`**. **Le jour d'après tombait sur le même jour.**

| fuseau | `_mvJourApres('2026-06-30')` |
|---|---|
| UTC (le bac à sable) | `2026-07-01` ✓ |
| **Europe/Paris** | **`2026-06-30`** ✗ |

**Ce que ça cassait en production** : `_mvContrats` teste la contiguïté par
`c.debut <= _mvJourApres(p.fin)`. Avec un jour de retard, `'2026-07-01' <= '2026-06-30'` est faux :
**deux contrats qui se touchent n'ont plus jamais fusionné.** Et `_planCtrDuMois` n'accepte le
contexte de contrat que s'il trouve **UNE seule** période sur le mois — avec deux, il rend `null`,
et le relevé d'heures est produit **hors de tout contrat**, compteurs des deux contrats mélangés.

⚠️⚠️⚠️ **Actif chez MG, le second domaine et le prospect Gironde, toute l'année** — la France est à UTC+1 ou +2, jamais
à 0. **Le bac à sable de Claude tourne en UTC : c'est le seul fuseau au monde où ce code était
juste.** Aucun essai de mon côté ne pouvait l'attraper.

**Correctif** — tout en UTC, de bout en bout, sans jamais toucher l'horloge locale :

```js
var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
d.setUTCDate(d.getUTCDate() + 1);
return d.toISOString().slice(0, 10);
```

★★ **Le filet : `scripts/mv-harnais-fuseau.mjs`.** Il se relance en fils, **un par fuseau** —
UTC, Europe/Paris, Pacific/Auckland (+13), America/Los_Angeles (−8), Asia/Kolkata (+5:30) — et
compare. La règle qu'il tient est générale et vaut pour tout le code à venir :

> ★ *Une fonction qui manipule des dates-calendrier doit rendre EXACTEMENT le même résultat sous
> n'importe quel fuseau. Si le résultat bouge, la fonction mélange deux horloges.*

Dates d'épreuve choisies sur les charnières : bascules d'heure d'été (28-29 mars, 24-25 octobre),
fins de mois, 28 et 29 février d'une année bissextile, 31 décembre. **17 assertions**, 3
contre-épreuves. **Ajouté à `check` et `prebuild`.**

**Audit de la même famille, mené sur tout le dépôt** : `toISOString()` apparaît **126 fois** dans
`src/` et `functions/`. Un seul site mélangeait les deux horloges — celui-ci. Les autres
`Date.parse(x+'T00:00:00')` calculent des **différences** entre deux dates lues de la même façon :
le décalage s'annule, ils sont immunisés. **Zéro occurrence** de `new Date(y,m,d).toISOString()`.
⚠️ **Mais 64 occurrences de `new Date().toISOString().slice(0,10)`** = « aujourd'hui » en UTC :
**entre minuit et 2 h du matin à Paris, elles désignent la veille.** La forme juste,
**`_mvAujIso()`, existe déjà dans `utils.js`** et n'est utilisée qu'à 7 endroits. Les deux sites
du relevé sont corrigés ici (badge « en cours », date d'édition) ; **les 62 autres sont au
backlog** — c'est un lot à part, avec sa mesure.

### 55p. ⚠️⚠️⚠️ « ÉCART = » SUR UN MOIS OÙ IL MANQUAIT 8 H 30

> *« Les heures sont bien comptées en bas dans les heures dues du mois, sauf qu'elles ne sont pas
> comptées dans écart au prévu. Il faut les mettre aussi dans écart au prévu. »*

**Troisième aller-retour sur la même feuille, et le troisième était de ma main.**

En portant la dette dans « heures dues » (55m), j'ai gardé la **neutralisation** — l'absence sort
de la référence pour ne pas être comptée deux fois. C'est juste **pour le compteur**. Mais j'ai
laissé l'écart *s'afficher* sur cette référence nette. Résultat sur la feuille de Victor :

| ligne | ce qu'elle disait |
|---|---|
| Référence | **77 h** (nette) |
| Écart au prévu | **=** |
| Heures dues | **−8 h 30** |

★★★ **Le document affirmait qu'il avait fait ses heures, trois lignes au-dessus d'un débit de
8 h 30.** Et « Référence 77 h » est faux tout court : le planning en demandait **85 h 30**.

**Correctif : deux références, deux questions.**

```js
var refBrute = ref;            // ce que le PLANNING demandait, absences comprises → AFFICHÉ
ref -= _planAbsNeutH(mbr, m);  // la même, moins les absences déjà portées au débit → COMPTEUR
return { ref, refBrute, worked,
         ecart: worked - ref, ecartBrut: worked - refBrute,
         etp: refBrute > 0 ? worked / refBrute : 0 };
```

`_planSupMonth` continue de lire `ecart` (nette) : **le compteur ne bouge pas**. Les cinq
affichages — écran ET document, pour qu'ils ne se contredisent pas — lisent `ecartBrut`.
★ **Sans absence, `neut` vaut 0 et les deux chiffres sont égaux** : le changement ne se voit que
sur les mois qui portent une absence, ce qui est exactement son objet.

**Et « 6 jours prévus » en face de 85 h 30** — soit 14 h par jour. `_refJ` ne comptait que le
modèle et ignorait les **5 jours d'échange**, qui pèsent pourtant 38 h dans la référence. Il compte
maintenant ce que compte `_planRefPart`, la définition unique : **11 jours prévus**.

**La feuille, produite et relue** (et non plus raisonnée) :

| | avant 55p | après |
|---|---|---|
| Réalisation | 100 % | **90 %** |
| Référence | 77 h · 6 jours | **85 h 30 · 11 jours** |
| Heures faites | 77 h | 77 h |
| **Écart au prévu** | **=** | **−8 h 30** |
| Heures dues | −8 h 30 | −8 h 30 |
| Reste à prendre | −8 h 30 | −8 h 30 |

**L'écart, les heures dues et le reste à prendre disent enfin le même chiffre.**

⚠️ **Le cas inverse a été vérifié en le produisant, pas en le calculant de tête** — c'est pour lui
que la neutralisation existe. Un mois à **94 h 30 faites pour 86 h 30 prévues, avec la même absence** :
écart **+8 h**, heures sup **17 h**, heures dues **−9 h**, reste à prendre **+8 h**. *L'absence n'a
pas rogné les heures sup en plus de son débit* — pas de double peine. Assertions 8a bis du harnais.

★★★ **LA LEÇON, ET ELLE COÛTE TROIS ALLERS-RETOURS.** J'ai raisonné sur ce que la feuille
*devrait* afficher au lieu de **la produire et de la lire**. Le script qui l'a enfin produite
tenait en trente lignes — et il a trouvé les deux défauts en une exécution. ⚠️ Sa **première
version était fausse elle aussi** : elle posait `window.PLANNING_ENTRIES` **avant** l'import, alors
que `planning.js` écrase cet objet au chargement (l. 35). Les cinq jours sortaient « Repos ».
*Même un décor de vérification se vérifie.*
★ **Consigne** : pour tout lot qui touche un document imprimé, **produire le document et lire ses
chiffres** avant de le déclarer vert. Aucun preflight ne lit une mise en page (§42h) — et aucune
assertion ne lit une incohérence entre deux lignes qu'elle ne compare pas.

### 55l. Ce qui reste ouvert

- ⚠️⚠️ **REPOSER LE 19 ET LE 20 AOÛT chez le domaine de référence.** Sans ça, la feuille sort à +8h. Voir
  55c. **C'est la seule action bloquante du lot.**
- ⚠️ **Le même patron de destruction existe ailleurs, non corrigé.** Les trois écrivains de congés
  payés (l. 3610, 3788, 4761) et `_planApplySimple` (récup, chaleur) reconstruisent eux aussi
  l'entrée à neuf : un jour d'échange y perd drapeau et horaire. **L'effet est moins grave** —
  l'écart y reste neutre au lieu de devenir faux — mais c'est le même défaut. Le remède propre est
  **un point de passage unique** « conserver la nature du jour », avec son harnais : un lot à part.
- ⚠️ **Regarder les compteurs de MG et le second domaine après déploiement** (cf. 55m) : une absence
  injustifiée enregistrée avant ce lot descend maintenant « reste à prendre ». C'est la correction
  voulue, mais **il ne faut pas la découvrir en sortant une paie**.
- ⚠️ **Personne n'a regardé la feuille imprimée.** Les 83 assertions tiennent des tailles, des
  graisses, des marges, des bornes. **Aucune ne lit une mise en page** (§42h). Sortir un PDF réel
  avant de l'envoyer à un client — c'est le point faible du paquet.
- **« ETP » à l'écran** (cf. 55i).
- `npm run lint` non joué (ESLint ne s'installe pas dans le bac à sable) · `smoke` et `e2e` non
  joués (Playwright, idem).

---

## 56. ★★★ ACHATS : LE SEUL ENDROIT OÙ L'ON MET LES PRIX — ET LES CONSOMMABLES PAR ATELIER (23/08 — APP 6.47 → 6.48, puis 6.49 → 6.50 · SW 7.02 → 7.03, puis 7.04 → 7.05)

**La demande initiale** : savoir ce que coûtent la cave, la vigne, le tracteur. **Trois questions
posées d'emblée par Nico** : comment trier, comment ne pas compter deux fois, sans rajouter de
temps de saisie ?

### 56a. ⚠️⚠️ CE LOT A ÉTÉ CONSTRUIT DEUX FOIS. LA PREMIÈRE ÉTAIT FAUSSE.

La v1 rangeait les révisions de tracteur dans **un onglet « Dépenses » de La Réserve**. Nico :
*« une révision de tracteur, ça n'a rien à foutre dans réserve »*. Il avait raison, et
**mon argument de sécurité pour l'y mettre était faux** :

```
allow read : isMyTenant(collection) && docId != 'paie'
```

`intrants` est admin-only **en écriture**, mais **lisible par tout membre**. Y mettre un prix ne le
cachait de personne. Je m'appuyais sur un commentaire de `tracteur.js` qui parle du **prix d'achat
du tracteur** — une donnée patrimoniale — et je l'avais transposé au prix d'un filtre à huile.
★ *Un argument juste dans son contexte devient un sophisme ailleurs. Vérifier la règle, pas se
souvenir du commentaire qui la mentionne.*

**Le lot v1 n'était pas déployé** : le bloc `WHATS_NEW` et l'entrée de changelog SW ont été
**RÉÉCRITS, pas empilés**. Empiler aurait raconté aux clients une fonctionnalité qu'ils n'ont
jamais vue, puis son retrait. *Le journal décrit ce qui arrive chez eux, pas l'historique de nos
essais.*

### 56b. L'architecture, telle que Nico l'a décrite

> Un module Achats dans Pilotage où **toutes les lignes de ce qui a été ajouté** remontent
> **sans les prix**, et **où on pourra mettre les prix**.

Ce n'est pas un second formulaire — c'est un écran de **valorisation** :

| Le FAIT | Le PRIX |
|---|---|
| dans son module, tout de suite, par celui qui agit | dans Achats, plus tard, en lot, par l'admin |
| l'intrant à La Réserve, le fût au parc, la machine au réparateur | `achats[].prix`, `futs[].prix`, `reparateur_hist[].eur` |

⚠️ **Mon objection « Pilotage lit, il n'écrit pas » tombe** — mais pas pour rien : elle visait un
**doublon de formulaire**, et ce n'en est pas un. Le prix retourne **dans l'objet acheté**, jamais
dans une table de prix liée par identifiant, qui laisserait des orphelins à la suppression.

★ **« ＋ Achat » OUVRE le formulaire du module, il ne le recopie pas.** Un intrant phyto demande la
catégorie, l'unité, la contenance, la source de consommation et le catalogue E-Phy : le refaire
serait deux formulaires qui divergent au premier lot. `_rsvOpenAchat` et `_rsvOpenFut` étaient déjà
sur `window`.

### 56c. ★★★ TROIS ÉTATS, JAMAIS DEUX

Nico : *« emmené chez le réparateur, donc c'est considéré comme une réparation payante »* — ce qui
fait apparaître le cas de la **garantie**.

| État | Sens |
|---|---|
| `null` | à chiffrer — on ne sait pas encore |
| `0` | **sans frais** — garantie, geste commercial. Une **valeur**, pas un vide |
| `> 0` | chiffré |

⚠️⚠️ Un `if (prix)` confondrait les deux premiers : une réparation sous garantie resterait
**« à chiffrer » à vie**, et le compteur d'en-tête mentirait tous les mois. C'est la distinction
`!= null` vs truthy que le projet applique déjà partout — ici elle vaut un cas d'usage entier, pas
une préférence de style.

### 56d. Le signal existait déjà — je l'avais raté

J'ai proposé un champ neuf sur la fiche d'entretien. Nico : *« il y a déjà emmené chez le
réparateur »*. Le cycle `openReparateur → retourReparateur → REPARATEUR_HIST` **est** le marqueur
d'une intervention payante, avec sa date, sa durée et son motif.

★ **Une fiche d'entretien est une checklist quotidienne** — plein, huile, pression. La faire
remonter aurait noyé l'écran Achats de pleins de gazole. *Avant d'ajouter un signal, chercher celui
qui existe : le métier l'a souvent déjà nommé.*

Deux champs suffisaient : `four` (saisi **au départ** — on sait où on emmène la machine) et le
montant, **jamais demandé au tractoriste** : il rend les clés, il n'a pas la facture.

### 56e. ★★★ UNE MAQUETTE VALIDÉE EST UNE DÉCISION PRISE

> ★★★ **Nico, 23/08** : « si je dis oui pour la maquette, c'est oui pour la maquette, il n'y a pas
> de modification à faire ».

J'avais dévié sur **quatre points** en intégrant la v1, sans le signaler : couleur du seau
(`#B7AE9C` au lieu de `#DED7C9`, « pour que ça se voie mieux »), un bouton retiré, le
hors-périmètre passé de carte à note, l'export PDF oublié. Chacun avait sa petite justification —
et c'est le problème. **Rouvrir un choix validé à l'intégration, c'est décider à la place de Nico
en silence.** La fidélité à la maquette est passée au harnais.

⚠️ **La seule exception se dit** : la maquette montre des émojis, le cliquet des icônes en interdit
l'ajout. On garde la **mise en page et le texte** validés, on rend par le sprite. *Qu'un picto soit
un caractère Unicode ou un SVG est une contrainte du code, pas un choix de design* — c'est ce qui
rend l'exception acceptable au lieu d'arbitraire.

### 56f. Ce que les filets ont attrapé

- **C23 a attrapé la vraie casse du retrait v1** : `_eur2` vivait dans le bloc Dépenses supprimé,
  alors que le prix moyen l'appelle encore. **Écran Intrants blanc au premier rendu** — invisible
  pour `node --check` comme pour ESLint. ★ *Supprimer une fonctionnalité, c'est aussi vérifier ce
  qui s'appuyait dessus sans lui appartenir.*
- **`window.showPage` n'existe pas** (c'est `goTo`) et **`_pilGo` fait `if(!C) return;`** sur une
  cible inconnue : **deux boutons muets**, sans erreur en console. Puis une **troisième** au
  retrait — trois boutons pointaient encore vers l'onglet supprimé. ★ Le harnais couvrait la table
  des cibles mais **pas le second chemin** (`data-pec="rsv" data-v="…"`) : *un filet qui ne couvre
  qu'un des deux chemins laisse passer l'autre.*
- **C15 a attrapé une fonction morte** écrite « pour plus tard ». La brancher était l'intention.
- **Le cliquet d'émojis** a mordu sur la sous-nav d'Économie. Les **cinq** sont passés au sprite,
  pas seulement le nouveau : quatre émojis à côté d'une icône SVG serait pire que tout.
- **Un `font-weight:400`** copié-collé d'un motif voisin antérieur à DS-0.

### 56g. ⚠️⚠️ DEUX CONTRE-ÉPREUVES SONT RESTÉES VERTES

Elles ont révélé **deux vrais trous**, pas des tests ratés :

1. `t('… lu avec != null', /r\.eur!=null/.test(SRC))` testait « il existe **au moins une** lecture
   correcte ». Or il y en a **deux** — `_pexData` et `_pachLignes`. En casser une laissait vert.
   → on **compte**, et on exige qu'aucune lecture truthy ne subsiste.
2. `t('un fût n'entre pas', !/futs.*_ateAdd/.test(SRC))` testait **l'absence d'un motif textuel** :
   injecter `_ateAdd('cave',9)` ne contenait pas « futs » et passait.
   → on liste les appels **réels** et on exige exactement trois entrées.

★ *Une assertion en « absence de motif » ne prouve presque rien : elle passe dès que le défaut
s'écrit autrement. Compter ce qui doit exister vaut mieux qu'interdire une forme d'écriture.*

⚠️ Et une contre-épreuve peut mentir elle-même : la première tentative est ressortie verte parce
que mon découpage de test sur `:` avait tronqué la commande et que **`2>/dev/null` avalait
l'erreur**. Même famille que le no-op silencieux. *Une contre-épreuve verte doit d'abord être
suspectée elle-même.*

### 56h. Deux périmètres, et c'est voulu

**Achats** est un journal d'acquisitions : il liste **tout**, fûts compris.
**Les consommables par atelier** ne comptent que ce qui se rachète chaque année : **les fûts n'y
entrent pas** (`CONFIG.cave.futs_vie` les traite déjà comme durables, et le plan de renouvellement
est leur écran). Deux totaux qui diffèrent, chacun juste dans son périmètre — la carte « ce qui
n'entre pas dans ce total » le dit à l'écran, et une assertion le tient.

### 56i. Ce qui reste ouvert

- ⚠️ **Personne n'a regardé l'écran.** Les 41 + 35 assertions tiennent des euros, des cibles, des
  couleurs. **Aucune ne lit une mise en page.**
- **Chiffrer le plan de renouvellement des fûts** est maintenant possible (`futs[].prix` existe) —
  l'écran Cave l'exprime toujours en nombre de fûts. Non fait.
- **Le doublon de numéro de facture** n'est pas détecté.
- **La location de fûts** n'a plus d'endroit où se noter : elle n'existait que dans la v1, et Nico
  ne l'a jamais demandée. À rouvrir s'il en a l'usage.
- `npm run lint`, `smoke` et `e2e` non joués (ESLint et Playwright ne s'installent pas dans le bac
  à sable).

---

## 57. ★★★ LE SOCLE DE LA CHARTE — LOT DS-0 (23/08 · APP 6.46 · SW 7.01)

> ⚠⚠⚠ **CETTE SECTION A ÉTÉ ÉCRASÉE UNE FOIS, LE JOUR MÊME DE SA CRÉATION.** Écrite en §55 le
> 23/08 à 07h31, elle a disparu quelques heures plus tard : une autre conversation, travaillant en
> parallèle, a pris le numéro 55 pour un autre chantier. **Le code était là, le document ne le
> connaissait plus** — zéro occurrence de `DS-0`, `--r-sm` ou `mv-harnais-jetons` dans tout le
> fichier. C'est exactement le mécanisme qui a produit **cinq entrées de backlog décrivant du
> travail déjà fait**. Restaurée en §57, avec le filet qui manquait (§58).

> **Point de départ** : le cadrage écrit par Nico — huit pas d'espacement, quatre rayons, trois
> ombres, trois graisses, un filet neutre, deux règles globales. Avec, en toutes lettres, l'ordre
> de **re-mesurer avant de commencer**.

### 57a. ⚠️⚠️⚠️ CINQUIÈME FOIS QU'UNE ENTRÉE DÉCRIT DU TRAVAIL DÉJÀ FAIT

Le cadrage demandait `--sp-1..--sp-8` (4/8/12/16/24/32/48/64). **L'échelle d'espacement existe
depuis DS-3** sous le nom `--e-0..--e-8`, déclarée dans `:root`, avec son harnais et son cliquet.
**Six des huit pas demandés y sont au pixel exact** :

| demandé | existe déjà | | demandé | existe déjà |
|---|---|---|---|---|
| `--sp-1:4px` | `--e-1:4px` | | `--sp-5:24px` | `--e-6:24px` |
| `--sp-2:8px` | `--e-2:8px` | | `--sp-6:32px` | `--e-7:32px` |
| `--sp-3:12px` | `--e-3:12px` | | `--sp-7:48px` | **absent** → `--e-9` |
| `--sp-4:16px` | `--e-4:16px` | | `--sp-8:64px` | **absent** → `--e-10` |

Déclarer `--sp-*` aurait fait **deux vérités pour un même pixel** — la faute exacte de §47a
(*« une échelle qu'on ignore n'en est plus une, et j'ai failli en créer une seconde en croyant en
réconcilier deux »*). Seuls les deux pas réellement manquants sont ajoutés, **dans la famille
existante**.

★★★ **Et le vrai défaut de l'espacement n'est pas l'absence d'échelle : c'est qu'elle ne sert
pas.** **19 appels `var(--e-*)` contre 1 682 valeurs** de `padding`/`margin`/`gap` écrites à la
main, dont 1 003 hors échelle. Cinq pas sur neuf (`--e-5`, `--e-7`, `--e-8`, plus les deux neufs)
n'ont **aucun appelant**. Le cadrage cherchait à poser une échelle qui existait ; ce qu'il fallait,
c'est la dépenser. → **DS-1/DS-2 écran par écran, tenu par le cliquet de `mv-harnais-echelle`.**

### 57b. ★★★ LA MESURE DES OMBRES DU 16/08 ÉTAIT FAUSSE — deux fautes superposées

Le cadrage le disait lui-même : *« au 16/08 les 230 usages tombaient TOUS dans le seuil faible, ce
qui veut dire soit que trois pas sont de trop, soit que ma mesure était mauvaise »*. **La mesure
était mauvaise**, et pour deux raisons distinctes :

1. ⚠️ **`0 2px 8px` — le premier `0` n'a pas d'unité.** Une expression qui cherche `\d+px` n'y
   trouve que **deux** longueurs, en déduit qu'il n'y a pas de troisième valeur, et range la
   couche en « flou nul ». **Toute la population passait pour plate.** Il faut **tokeniser** et
   traiter `0` nu comme `0px`.
2. ⚠️ **Les anneaux ne sont pas des ombres.** Sur 177 couches mesurables, **65 ont un flou
   réellement nul** : ce sont des `0 0 0 2px` (anneaux de focus, halos d'état) et des
   `inset 0 1px 0` (filets de brillance). Les compter parmi les élévations est la seconde moitié
   de l'erreur — **exactement la même confusion que `border-radius:50%` pour un rayon**.

**Mesure refaite**, tous fichiers : 239 déclarations `box-shadow`, dont **65 via jeton** et 174
écrites à la main. Les **112 vraies élévations** se répartissent en trois populations nettes :

| flou | nombre | pas |
|---|---|---|
| < 10 px | **57** | `--shadow-sm` (existait, flou max 8) |
| 10 → 39 px | **41** | `--shadow-md` (existait, flou max 28) |
| ≥ 40 px | **14** | `--shadow-lg` — **il manquait** |

Le troisième pas n'était pas de trop : il n'existait pas, et **ses clients sont nommables** —
`.ent-confirm-modal`, `.saison-menu`, `.ov-plan-sheet`, `#mv-dock-sheet`, `.pil-drawer`,
`.pl2-mbar`, `.mvt-card`, `.pil-outils-menu`, `.mvds-sheet`. La famille des surfaces qui flottent
au-dessus de la page.

★ **La leçon, au-delà des ombres** : quand une mesure rend un résultat parfaitement uniforme sur
une population de 230, **ce n'est pas la population qui est uniforme, c'est l'instrument qui est
aveugle**. Un résultat trop propre est un signal, pas une conclusion.

### 57c. ★★★ `#app-root` N'EST PAS L'APPLICATION — et ça change deux décisions

Le cadrage plaçait `font-variant-numeric` sur `#app-root`. **Mesuré sur `index.html` :** le
conteneur est fermé ligne 3197, et `#ovChampValidation`, `#ovMode`, `#ovConfirmDel`, `#ovPrompt`,
`#mv-critical-overlay` sont ses **frères**, pas ses enfants. Les overlays construits en JS sont
posés par `document.body.appendChild` (une douzaine dans `admin-gt.js` seul).

Ancrée sur `#app-root`, la règle laissait **toutes les modales en chiffres proportionnels** :
moitié aligné, moitié pas — **pire que rien**. → posée sur `:root`, comme `--pt-*`, et pour la
raison déjà écrite dans le commentaire de l'échelle : *« les bulles Leaflet et les couches
d'overlay sortent du conteneur de la page »*.

⚠️⚠️ **LE MÊME MUR VAUT POUR LE THÈME SOMBRE, ET CE N'EST PAS TRAITÉ ICI.** `--bg-card`,
`--gris-clair`, `--shadow-*` sont redéfinis **uniquement** dans `#app-root[data-theme="dark"]` et
dans `#app-root:not([data-theme="light"])`. Une modale, qui est dehors, hérite donc des valeurs
**claires**. Déduction statique, **non vérifiée à l'écran** : à regarder sur un téléphone en mode
sombre. Si une modale sort claire, c'est un lot à part. → **backlog.**

### 57d. Ce que `tabular-nums` déplace vraiment — mesuré sur les polices, pas supposé

Le cadrage posait un seuil : *« si c'est imperceptible (<0,5 px), on le garde partout »*.
Playwright ne s'installe pas ici ; la mesure a été faite **sur les `.woff2` réellement servis**
(`public/fonts/`, lus avec `fontTools`) :

- ★ **Outfit ET Cormorant portent la fonction OpenType `tnum`.** La règle n'est donc pas un coup
  d'épée dans l'eau — **et les 67 `tabular-nums` déjà écrits dans le code font bien quelque chose**.
  C'était la première question à trancher : une police sans `tnum` aurait rendu tout le lot vain.
- Outfit, chiffres proportionnels : le « 1 » fait **367**/1000 em, le « 0 » **660**. En tabulaire,
  **590 pour tous**.
- **Écart moyen par chiffre** : `+0,44 px` à 11 px · `+0,50 px` à 12,5 px · `+1,23 px` à 31 px.
  Le seuil de 0,5 px est **tenu au corps de texte, dépassé aux grandes tailles**.
- **Ce qui tranche est l'autre plateau** : le **désalignement supprimé** atteint `3,7 px` par
  chiffre à 12,5 px et `9,1 px` à 31 px. On ajoute un demi-pixel de largeur pour retirer sept
  pixels d'écart entre deux lignes d'un même tableau.

⚠️ **Ce raisonnement reste un proxy.** Aucune capture n'a pu être prise, et **les trois captures
demandées dans le cadrage n'ont pas été fournies** (les images jointes étaient les logos, la
bannière et le QR code). L'accueil, Pilotage › Décider et Planning › Équipe **restent à regarder à
l'œil** — trois défauts du §42 n'ont été trouvés que comme ça.

### 57e. ⚠️⚠️ LE PIÈGE DE LA VARIABLE QUI SE FIGE EN CLAIR

`--ligne` déclaré **uniquement** dans `:root` serait resté **clair en mode sombre**, sans erreur et
sans avertissement.

**La mécanique** : la substitution d'un `var()` écrit **dans** une custom property se résout **sur
l'élément qui la déclare**. `:root{--ligne:var(--gris-clair)}` calcule `--ligne` sur `html`, où
`--gris-clair` vaut la valeur claire, puis **hérite ce littéral** à toute la page. Redéfinir
`--gris-clair` plus bas, sur `#app-root[data-theme="dark"]`, **ne rétroagit pas**.

→ `--ligne` **et** `--shadow-lg` sont redits dans **les deux** blocs sombres, exactement comme
`--shadow-sm` et `--shadow-md` le sont déjà. Vérifié **avec un vrai parseur CSS** (`css-tree`), pas
au `grep` : trois déclarations chacun, une par bloc de thème, zéro erreur de parsing sur les
4 725 lignes.

★ **L'assertion qui en découle vaut mieux que le correctif** : un jeton redit dans **un seul** des
deux blocs sombres fait diverger la bascule manuelle du mode auto de l'OS. Le défaut ne se voit que
chez un client en sombre, qui a basculé d'une certaine façon. Le harnais l'interdit.

### 57f. ⚠️⚠️⚠️ LA RÈGLE DE FOCUS EST MORTE SI ELLE N'EST PAS LA DERNIÈRE

`styles.css` contient **17 `outline:none`**, la plupart sur la règle **de base** d'un champ de
saisie : `.fi`, `.fsel`, `.login-input`, `.ephy-search input`, `.emh-in`, `.j-date-input`,
`.ob-input`, `.plan-ge-input`, `.vend-param-fi`, `.pl2-chal-f input`, `#chat-ta`, `.sbox input`,
`.danger-conf-input`, `.mvt-fi`.

Leur spécificité est **(0,1,0)** — **exactement celle de `:focus-visible`**. À égalité, c'est
l'**ordre de source** qui tranche. Placé n'importe où avant, l'anneau de focus serait **mort sur
tous les champs de saisie de l'application**, sans une erreur et sans un avertissement.

→ Le bloc est en **fin de feuille**, et **c'est une assertion du harnais**, pas une convention :
après la règle de focus, un seul `outline:none` est toléré (celui du couple `*:focus:not(...)`).
Un futur `outline:none` ajouté en queue rougit.

⚠️ **Un survivant assumé** : `.mvr-fi:focus{outline:none}` est en **(0,2,0)** et gagne quand même.
Ce champ garde sa couleur de bordure pour seul signal, y compris au clavier. **Constaté, pas
corrigé** — ça se tranche sur une capture, pas au `grep`.

### 57g. Les autres arbitrages, chacun tranché par un chiffre

- **Rayons.** 674 `border-radius`, **45 valeurs distinctes**. Les quatre pas couvrent les quatre
  plus gros usages : 12 px (95), 8 px (50), 16 px (27), 999 px (8).
- ⚠️ **`border-radius:50%` (130 occurrences) est un CERCLE**, jamais un jeton : une pastille de
  44 px et une de 22 px n'ont aucune valeur en pixels en commun. Le harnais pose un **PLANCHER**
  dessus — le compte ne peut pas **descendre**. C'est le seul cliquet du lot orienté à l'envers,
  et c'est voulu.
- ⚠️ **99 px (10 occurrences) n'est pas fusionné avec 999 px** : même pilule sur un élément bas,
  **pas au-delà de 198 px de haut**. Arbitrage à l'œil, pas substitution mécanique.
- ★ **`--radius-card` était un SECOND nom pour 16 px**, avec ses 10 appels. Il devient
  `var(--r-lg,16px)` : un renvoi, plus une valeur jumelle.
- **Graisses.** 1 971 `font-weight` : 600 (**976**), 700 (**686**), 500 (**156**) = **92 %**.
  ⚠️ **800 existe 78 fois** : ni un pas ni un accident, un **quatrième pas de fait**, jamais
  déclaré. **Pas ajouté en douce** — il part au cliquet. Le trancher demande une capture.
- **Filet neutre.** `1px solid var(--gris-clair)` = **172** (+14 avec repli) contre
  `var(--gris)` = **71**. `--gris-clair` mène de plus du double : il gagne. Le perdant part au
  cliquet, il ne peut plus regagner de terrain.
- ⚠️ **Le nom `--ligne` était déjà pris** dans `_rsCss()` (`app.js`) — mais c'est le `:root` d'un
  **document A4 imprimé**, ouvert dans sa propre fenêtre, qui ne charge jamais `styles.css`. Deux
  documents, aucun conflit. **Exemption écrite avec sa raison** dans le harnais, comme
  `GUARD_EXEMPT`.
- **Le repli partout.** Le socle n'introduit que trois appels, tous avec repli. ⚠️ Mais la base
  compte **4 376 `var()` sans repli** au total, dont **89** dans les familles d'échelle. Les solder
  n'est pas ce lot : ils partent au cliquet.

### 57h. Le harnais — `mv-harnais-jetons.mjs`, 32 assertions, 12 contre-épreuves

Branché dans `npm run check` **et** `prebuild`. Cliquet dans `scripts/mv-jetons-baseline.json` :
`{cercles:80, sansRepli:89, radDur:194, fwHors:152, filetPerdant:74}`.

★ **Le point de conception qui compte** : `controles()` est une **fonction pure du texte de la
feuille**. C'est ce qui rend les contre-épreuves réelles — on mute une copie **en mémoire** et on
rejoue le même jeu d'assertions. Un harnais dont on ne peut pas rejouer les assertions sur une
source abîmée ne prouve rien.

### 57i. ⚠️⚠️ TROIS DE MES CONTRÔLES ÉTAIENT FAUX AU PREMIER LANCEMENT

**Deux rouges au premier tir, et les deux accusaient du code parfaitement sain :**

1. ⚠️ **L'ancre de position cherchait le PREMIER `:focus-visible{` de la feuille.** Il y en a
   **neuf** (`.emh-x`, `.emh-add`, `.emh-rap-b`, `.emh-opt`, `.mv-syncdot`, `.mvt-cta`, `.mv-i`,
   `.rf-f select`, plus la mienne). Le contrôle mesurait « 15 `outline:none` après » et rougissait.
   **L'assertion satisfaite par une autre phrase du fichier — la faute exacte de §53.**
2. ⚠️ **Le contrôle du repli comptait `var(--ligne)` de `_rsCss()`**, le document A4 — qui déclare
   son propre `--ligne` deux lignes plus haut, où un repli est sans objet. Et le préfixe `--ligne`
   attrapait `--ligne-2`, qui n'est pas un jeton du socle. **Corrigé en profondeur** : `sansRepli`
   prend désormais des **paires `[fichier, source]`** (sans le nom du fichier, aucune exemption
   n'est applicable) et un **prédicat**, jamais un préfixe nu.

**Et la onzième contre-épreuve ne mordait pas — troisième fois pour cette famille de faute :**

3. ⚠️⚠️⚠️ La mutation `border-radius:50%` **sans point-virgule** frappait la **première occurrence
   du fichier**, qui est **le commentaire que je venais d'écrire** dix lignes plus haut pour
   expliquer qu'un cercle n'est pas un rayon. `sansCom()` le retirait ensuite : le compte ne
   bougeait pas, la contre-épreuve ne mordait rien, **et elle se lisait comme une mutation
   légitime**. C'est le `.pathname` de §53 à l'identique — *un `assert` qui tombe sur le mot écrit
   dans le commentaire qu'on vient d'ajouter*.

★★★ **Le correctif ferme la FAMILLE, pas le cas** : les contre-épreuves exigent maintenant que la
mutation bouge **le code**, pas seulement le texte. `if (sansCom(muté) === sansCom(origine))` →
rouge nommé. Une mutation qui ne touche que des commentaires ne teste rien, quel que soit le motif.
★ **Le second filet, déjà là, reste indispensable** : il ne suffit pas que « ça rougisse », il faut
que ce soit **l'assertion visée** qui rougisse. Une mutation qui casse autre chose passerait.

### 57j. ★★ LE HARNAIS DU DOCUMENT ÉTAIT DÉBRANCHÉ, ET INCAPABLE DE TOURNER CHEZ NICO

`harnais-claude-md.mjs` sortait **1 rouge depuis des jours**, noté au §54 comme « préexistant ».
Instruit : **c'était le contrôle qui était périmé**, pas le document. L'assertion figeait
`app.js:703` ; la garde `_MV_LOCKED` a glissé en **704** au premier ajout de ligne plus haut.
**Même famille que le cliquet à l'envers `A8`.** → on cherche le **motif** dans la tête de
`saveData`, plus le **rang**. Et les deux numéros de ligne recopiés dans le document (§14b, §28)
sont retirés : c'est la règle d'or n°2 appliquée aux lignes, pas seulement aux versions.

⚠️⚠️ **Plus grave : il portait `/home/claude/mavigne-dev/` EN DUR** — un des six harnais de §44 qui
ne peuvent démarrer que dans le bac à sable. **Il n'était branché nulle part** : ni dans `check`,
ni dans `prebuild`, ni en CI. C'est pour ça qu'un rouge a pu survivre sans que personne le voie.
→ Chemin rendu portable avec **`fileURLToPath`** — ⚠️ **pas** `new URL(...).pathname`, qui rend
`/C:/Users/…` sous Windows et que Node repart en `C:\C:\Users\…` (§53, le harnais livré vert qui a
planté chez Nico au premier lancement). **Le bac à sable est Linux, la machine de Nico est
Windows.**
→ Branché dans **`npm run check`** seulement. ⚠️ **Volontairement absent de `prebuild`** : une
phrase périmée ne doit pas bloquer un déploiement urgent. **C'est la seule divergence entre `check`
et `prebuild`, et elle est délibérée.**
✅ **23 vertes, 0 rouge** — pour la première fois.

### 57k. Ce que le lot ne fait pas, et pourquoi

- **La feuille n'est pas remappée.** Le socle **déclare** ; il ne réécrit pas 674 `border-radius`
  ni 1 682 espacements sans pouvoir regarder une seule capture. Ce serait un pari, pas un lot
  (§47b). La dette part au cliquet et se résorbe écran par écran.
- **Les trois captures n'ont pas été regardées** (non fournies). C'est le seul contrôle qui manque,
  et c'est celui qui a trouvé trois défauts au §42.
- **`font-weight:800` (78 fois)** : quatrième pas ou résidu, non tranché.
- **Les modales en mode sombre** (§57c) : déduction statique, à vérifier à l'écran.
- **`npm run build` non joué** — `vite` n'est pas installé dans le bac à sable. Le `prebuild`
  (tous les harnais) est passé vert ; le CSS a été validé par `css-tree` à la place, **0 erreur de
  parsing**. `smoke` et `e2e` non joués (Playwright, comme toujours).

## 58. ★★★ LE DOCUMENT A PERDU UN CHANTIER ENTIER LE JOUR MÊME (23/08 — `CLAUDE.md` + `scripts/`, aucun bump)

> **Constat de départ** : la règle d'or n°6 venait d'être écrite le matin même — *ce document part
> avec le dernier lot de chaque conversation*. Huit heures plus tard, **le chantier qui l'avait fait
> naître avait disparu du document.**

### 58a. Ce qui s'est passé, à la minute

| heure | commit | ce qui arrive |
|---|---|---|
| 07h18 | `lot3` | Nico intègre DS-0 : `styles.css`, `sw.js`, `utils.js`, `index.html`, deux scripts neufs |
| 07h31 | `claude` | Nico intègre `CLAUDE.md` avec **§55 = LE SOCLE DE LA CHARTE**, la règle d'or n°6 et la note de livraison |
| 08h41 → 15h37 | `planning` … `coutech` | six commits, **deux chantiers complets** (feuille d'heures, consommables par atelier) |
| — | — | **§55 s'appelle désormais « LA FEUILLE D'HEURES »**, un §56 est apparu, et **DS-0 n'existe plus nulle part** |

**Mesuré, pas supposé** : dans le document du dépôt, `DS-0` = **0 occurrence**, `--r-sm` = 0,
`--shadow-lg` = 0, `mv-harnais-jetons` = 0, `LE SOCLE DE LA CHARTE` = 0. Pendant ce temps
`scripts/mv-harnais-jetons.mjs` est bien présent, `--r-sm:8px` est bien dans `styles.css`, et le
harnais tourne dans `npm run check`. **Le code existe, le document l'ignore.**

### 58b. ⚠️⚠️⚠️ LA CAUSE : DEUX CONVERSATIONS QUI PRENNENT LE MÊME NUMÉRO

Rien n'a été « supprimé » volontairement. Une session parallèle a écrit **sa** section à la suite,
a pris le numéro **55** — libre dans la base qu'elle avait sous les yeux — et a réécrit le fichier.
**Le dernier écrit gagne.** Aucun conflit Git n'apparaît : deux commits successifs sur le même
fichier ne s'annoncent pas.

★★★ **La leçon, plus large que ce fichier** : *écrire au bon endroit ne suffit pas si le numéro
qu'on prend peut être pris par un autre.* Le numéro suivant se lit **dans le dépôt frais, au moment
d'écrire** — pas dans la copie clonée en début de session, qui peut avoir des heures.

### 58c. ⚠️ ET LE HARNAIS N'A RIEN VU — parce qu'il ne cherchait pas ça

`harnais-claude-md.mjs` vérifiait *« aucun numéro de section en doublon »*. Il n'y en avait pas :
l'ancienne §55 n'a pas été dupliquée, **elle a été remplacée**. Le contrôle regardait la collision,
pas la disparition. ★ **Un harnais qui vérifie que ce qui est écrit est vrai ne dit rien de ce qui
manque** — c'était déjà écrit noir sur blanc dans la règle d'or n°6, et ça vient d'arriver.

### 58d. Le filet posé — générique, pas taillé pour ce cas

Trois contrôles neufs dans `harnais-claude-md.mjs`, qui attrapent **n'importe quel** chantier livré
et non consigné, pas seulement DS-0 :

1. ★★★ **Tout script de `scripts/` est nommé dans le document.** C'est la meilleure sonde qu'on
   ait : un lot livre presque toujours un harnais, et un harnais que le document ignore signale un
   chantier que le document ignore. ⚠️ **Mesuré à l'entrée : 11 scripts sur 45 sont invisibles au
   document** — DS-0 n'était pas un cas isolé, c'était un symptôme. → **cliquet** : le compte ne
   peut plus monter, et se résorbe quand une section est écrite. `mv-harnais-jetons` sort de la
   liste dès ce lot.
2. **Le nombre de sections ne peut pas baisser.** Une section qui disparaît rougit, même si son
   numéro est réutilisé.
3. **Les sections des trois derniers chantiers sont nommées explicitement.** Un garde-fou nommé
   vaut mieux qu'un compte quand on connaît la cible.

### 58e. ⚠⚠⚠ ET LA CONTRE-ÉPREUVE DU FILET NE MORDAIT PAS — QUATRIÈME FOIS

Le filet posé, il fallait vérifier qu'il attrape bien le scenario du jour : effacer le titre de
§57 et regarder rougir. **Il n'a pas rougi.** L'assertion était écrite
`MD.includes('LE SOCLE DE LA CHARTE')` — et ce texte apparaît **deux fois de plus dans §58a et
§58b**, les paragraphes qui racontent précisément sa disparition. **Le contrôle était satisfait par
le texte qui documente le problème.**

C'est la **quatrième fois** que cette faute exacte revient : l'`assert` sur `.pathname` qui tombait
sur le mot du commentaire (§53), la mutation `border-radius:50%` qui frappait le commentaire
fraîchement écrit (§57i), et maintenant celle-ci.

★★★ **La forme générale de la faute, pour la reconnaître la prochaine fois** : *quand on écrit un
contrôle en même temps que la prose qui l'explique, le contrôle trouve sa cible dans la prose.*
Le remède est le même partout — **chercher la STRUCTURE, pas le texte** : ici un chantier vit dans
un **titre de section**, donc l'assertion est ancrée sur `^## N. …`, ce qu'aucun paragraphe ne peut
imiter par accident.

### 58f. Ce que ça change dans la règle d'or n°6

La règle disait *quand* mettre le document à jour. Il lui manquait *comment ne pas écraser* :
**relire les titres depuis le dépôt frais juste avant d'écrire**, prendre le numéro suivant à ce
moment-là, et **ajouter à la fin plutôt que de régénérer**. Une réécriture massive d'un fichier de
neuf mille lignes emporte silencieusement ce qu'une autre session vient d'y poser.

### 58g. Ce qui n'est pas fait

- ⚠⚠ **QUATRE SCRIPTS SONT DÉSORMAIS NOMMÉS SANS ÊTRE EXPLIQUÉS** : `harnais-sec3`,
  `harnais-uxlogin`, `mv-harnais-effectif-periode`, `mv-harnais-entretien`. Ils passent au vert
  **uniquement parce que ce paragraphe les cite**, dans la liste de ce qui reste à faire. ★ **La
  sonde vérifie qu'un nom apparaît, pas qu'il soit instruit** — le dire vaut mieux que de faire
  semblant. C'est déjà beaucoup : le 23/08, `mv-harnais-jetons` n'apparaissait **nulle part**. Les
  décrire pour de bon demande de les lire, ce que ce lot n'a pas fait : les décrire sans les avoir
  instruits produirait exactement le genre de phrase fausse que la règle d'or n°3 combat.
- **Les six contre-épreuves sont hors sonde par construction** (`*-contre.mjs`). Une contre-épreuve
  n'est pas un chantier : c'est le compagnon d'un harnais qui, lui, doit être documenté. Une fois
  écartées, le seuil tombe à **zéro** — plus un cliquet, une **interdiction**.
- **Aucun bump** : ce lot ne touche que `CLAUDE.md` et `scripts/`, qui ne partent jamais en ligne.

## 59. ★★★ LE THÈME S'ARRÊTAIT À LA PORTE DES FENÊTRES (23/08 — APP 6.48 → 6.49 · SW 7.03 → 7.04)

> **Point de départ** : trois entrées du backlog laissées ouvertes par DS-0 — les trois écrans à
> regarder, les modales en mode sombre, et les scripts nommés sans être expliqués. Les trois sont
> traitées ici. **La deuxième était une déduction de ma part, jamais vérifiée : elle était juste.**

### 59a. Le défaut, prouvé plutôt que supposé

`applyTheme()` posait `data-theme` **sur `#app-root` et rien d'autre**. Or `index.html` ferme
`#app-root` **ligne 3197**, et après cette ligne vivent **13 overlays statiques** —
`#ovChampValidation`, `#ovMode`, `#ovConfirmDel`, `#ovPrompt`, `#mv-critical-overlay`,
`#ovCaveExport`, `#ovRetraitFut`, `#ovWhatsNew`, `#ovPTeam`, `#ovSync`, `#mv-expired-ov`,
`#mv-email-ov`, `#ovTerms` — qui contiennent **37 `class="modal"`**. S'y ajoutent les overlays
posés en JS : **37 `document.body.appendChild`** répartis sur huit modules.

**Mesuré** : **63 variables** sont déclarées dans `:root` puis redéfinies sous `#app-root`. Aucune
n'atteignait les overlays. `.modal{background:var(--bg-card)}` prenait donc la valeur claire
`#FBFAF6` — **une fenêtre blanche en plein mode sombre**, à chaque confirmation, à chaque export,
à chaque acceptation des conditions.

★ **Ce n'était pas un pari** : `applyTheme` a été relue, les frères de `#app-root` comptés dans
`index.html`, les 63 variables relevées avec un vrai parseur CSS, et les 11 sélecteurs hors
`#app-root` qui les consomment listés un par un. C'est cette chaîne-là qui autorise le correctif,
pas l'intuition de départ.

### 59b. Le correctif — deux sélecteurs, pas deux blocs

Chaque bloc sombre porte désormais **`:root` en plus de `#app-root`** :

```
#app-root[data-theme="dark"],:root[data-theme="dark"]{ … }
#app-root:not([data-theme="light"]),:root:not([data-theme="light"]){ … }
```

★ **Aucune déclaration n'est dupliquée** : c'est le même bloc avec deux sélecteurs. Les variables
sont posées sur `<html>` et **héritées par tout le document**, overlays compris. Les règles
`#app-root[data-theme="dark"] .xxx` qui existent ailleurs continuent de fonctionner sans changement.
⚠️ Vérifié avant d'agir : **aucune règle de la feuille ne testait `data-theme` sur `:root`, `html`
ou `body`** — le changement n'a donc pas d'effet de bord CSS.

⚠️ **Il y avait cinq blocs, pas deux.** Les couleurs principales, plus `--or-tx/--vert-tx/--orange-tx`,
`--vin-tx/--acier-tx`, `--sheen` et `--mv-sk-glow`, chacun avec sa paire attribut + `@media`. Les
quatre derniers ont été trouvés **par le harnais**, pas à la lecture — et `--or-tx` et `--vin-tx`
figurent précisément parmi les variables que les overlays consomment.

### 59c. ⚠️ LE PIÈGE : LES DEUX MARQUES DOIVENT RESTER D'ACCORD

`<html>` en sombre et `#app-root` en clair ferait passer **toute l'application** en sombre : aucun
bloc ne remet les variables claires sous `#app-root[data-theme="light"]`, le clair étant le `:root`
par défaut.

Or la **visite guidée** force le thème clair en écrivant directement sur `#app-root`, à deux
endroits d'`app.js`, sans passer par `applyTheme`. Laissées telles quelles, ces deux lignes
auraient laissé la media query de l'OS repasser les overlays en sombre **pendant une démo censée
être claire — la première impression d'un prospect**. Les deux posent désormais l'attribut sur
`<html>` aussi.

### 59d. Le harnais — `mv-harnais-theme.mjs`, 7 assertions, 6 contre-épreuves

Branché dans `npm run check` et `prebuild`. Il vérifie que les blocs de thème emmènent `:root`,
qu'**aucune variable de thème ne reste enfermée** sous `#app-root`, que chaque pose de `data-theme`
sur `#app-root` a la sienne sur `<html>`, que le mode auto retire bien les deux — et, en dernier
contrôle, **que le mur existe toujours** (des `.modal` après la fermeture de `#app-root`), pour ne
pas garder un filet contre un problème disparu.

### 59e. ⚠️⚠️⚠️ TROIS DE MES CONTRÔLES ÉTAIENT FAUX, ET LE TROISIÈME CACHAIT UN TROU RÉEL

1. ⚠️ **Chercher un exemple au lieu de compter les manquants.** Écrit
   `/#app-root\[data-theme="dark"\],:root…/.test()`, le contrôle était vrai dès qu'**un** bloc était
   correct. Il y en a cinq : en casser un laissait l'assertion verte, **satisfaite par les quatre
   autres**. → on compte les fautifs et on exige zéro.
2. ⚠️ **Une assertion illisible passe pour vraie.** La première comparait un total à une moitié et
   affichait « 2/4 » en vert. *Un contrôle qu'on ne peut pas lire ne se relit pas.* → deux compteurs
   séparés, égalité exigée.
3. ★★★ **Et le vrai trou : mon découpage de la feuille n'entrait pas dans les `@media`.** Il
   n'enregistrait un bloc qu'au retour de la profondeur à zéro — un
   `@media(prefers-color-scheme:dark){ #app-root…{…} }` était donc vu comme **un seul bloc** dont le
   sélecteur est `@media(…)`, qui ne contient pas `#app-root` et passait au travers. **La moitié des
   déclarations de thème vit là**, c'est le mode auto de l'OS. Un correctif validé par ce harnais
   aurait couvert la bascule manuelle et laissé le mode automatique cassé.

★ **Ce trou a été trouvé par une contre-épreuve qui ne mordait pas, pas par une relecture.** C'est
la justification entière de la méthode : *une contre-épreuve qui échoue est une information, jamais
une formalité à faire passer au vert.* Une sixième contre-épreuve vise désormais explicitement le
cas « variable enfermée **à l'intérieur** d'un `@media` ».

### 59f. ⚠️ ET `mv-harnais-jetons` FIGEAIT LE SÉLECTEUR — comme on fige un numéro de ligne

Le harnais de DS-0 repérait les trois blocs de thème par une **chaîne exacte** :
`'#app-root[data-theme="dark"]{\n  color-scheme:dark;'`. En ajoutant `:root` au même bloc, les trois
marqueurs sont tombés d'un coup et le harnais a accusé du code parfaitement sain.

★ **Figer un sélecteur, c'est figer un numéro de ligne** : ça se décale au premier changement
légitime. → les blocs se repèrent maintenant par leur **contenu** (`color-scheme`, ce qui les
identifie vraiment), et on remonte à l'accolade ouvrante.

### 59g. Le cliquet des graisses avait pris du mou

Une contre-épreuve de `mv-harnais-jetons` a cessé de mordre : elle ajoutait un `font-weight:800` et
le cliquet, gravé à **152**, absorbait la hausse sans rougir. **Vérifié clé par clé sur le dépôt nu,
sans mes modifications** : le compte réel était descendu à **147** grâce aux lots `planning` et
`coutech`. Regravé à 147, la contre-épreuve mord de nouveau.

★ **Un cliquet avec du mou n'attrape plus les petites hausses.** Une baisse non regravée n'est pas
une marge de confort, c'est **une part du filet qui ne sert plus**.

### 59h. Les trois écrans — ce qui a pu être fait, et ce qui ne peut pas l'être

**Les captures n'ont jamais été fournies, et aucun harnais ne lit une mise en page.** Ce qui est
mesurable l'a été : `tabular-nums` **élargit** les chiffres étroits, le vrai risque n'est donc pas
l'esthétique mais le **débordement**. Relevé des règles à largeur figée dont le nom évoque un
chiffre : **10**, dont **aucune** en `nowrap` ou `overflow:hidden`. Les cinq qui portent vraiment
des chiffres ont été calculées au pire cas, avec les métriques réelles d'Outfit :

| cible | largeur | pire texte | avant | après | tient ? |
|---|---|---|---|---|---|
| `.pl2-dh-num` | 24 px | `31` | 12,8 px | **16,5 px** | oui |
| `.plan-day-num` | 36 px | `31` | 11,5 px | 14,8 px | oui |
| `.htache-pct` · `.htc-pct` | 32 px | `100%` | 27,4 px | 28,3 px | oui |
| `.pil-cmp-val` | 38 px | `-99%` | 25,7 px | 26,2 px | oui |

⚠️⚠️ **CE QUE ÇA NE PROUVE PAS** : rien sur l'alignement perçu, l'équilibre d'une grille, ou une
colonne qui paraît trop lâche. **Trois défauts du §42 n'ont été trouvés qu'à l'œil.** L'accueil,
Pilotage › Décider et Planning › Équipe **restent à regarder** — la mesure réduit le risque de
casse, elle ne remplace pas le coup d'œil.

### 59i. ⚠️ TROIS HARNAIS DORMAIENT — ils passaient au vert sans jamais tourner

Les quatre scripts « nommés sans être expliqués » du backlog ont été lus et lancés. Ils sont tous
**verts**. Mais **trois n'étaient branchés nulle part** — ni dans `check`, ni dans `prebuild`, ni en
CI. Exactement le cas de `harnais-claude-md` (§58) : *un filet qui ne tourne jamais est un filet
qui n'existe pas.* Les trois sont branchés.

| script | ce qu'il prouve | assertions | était branché ? |
|---|---|---|---|
| `harnais-sec3` | `getLoginRoster` ne projette plus d'adresse mail pour un client `v>=2` ; `getLoginEmail` rend l'adresse d'un seul nom, jamais journalisée ; la résolution est lancée au clic et **bornée** ; « mot de passe oublié » n'est plus pré-rempli | 29 | **non** |
| `harnais-uxlogin` | une seule tuile quand l'appareil se souvient, et surtout **l'index d'origine dans `MEMBRES` est conservé** — réindexer un tableau filtré ouvrirait la fiche de quelqu'un d'autre ; mémoire par domaine, écrite au succès seulement | 29 | **non** |
| `mv-harnais-entretien` | le carnet d'entretien passe par `window._mvDocOpen`, porte le nom du **domaine** et plus « GUERETTECH », ses 39 règles CSS propres sont intactes et ce que la charte fournit déjà n'est plus dupliqué | 30 | **non** |
| `mv-harnais-effectif-periode` | sept écrans du Planning partaient de `_planMbrs()`, qui filtre `statut !== 'Inactif'` — un statut posé **à la main en fin de contrat**, qui effaçait donc **rétroactivement des heures réellement faites** | 46 | oui |

★ **Les quatre emploient la même méthode** : ils **exécutent** la vraie fonction extraite du source,
ils ne cherchent pas un motif de texte. C'est la méthode C20, et c'est la bonne.

### 59j. Ce qui n'est pas fait

- **Les trois écrans restent à regarder à l'œil** (§59h). Toujours le seul contrôle qui manque.
- **`font-weight:800`, 78 fois** : quatrième pas de fait ou résidu, toujours au cliquet.
- **Les six contre-épreuves `*-contre.mjs`** ne sont toujours pas branchées. Elles ne sont pas
  faites pour tourner en continu — une contre-épreuve abîme volontairement une source — mais
  **personne ne les lance jamais**, donc personne ne sait si elles mordent encore.
- **`npm run build` non joué** : `vite` n'est pas installé dans le bac à sable. Le `prebuild`
  complet est vert et le CSS a été validé par un parseur, **0 erreur**.

---

## 60. ★★★ LA MÊME FAUTE, DEUX FOIS DANS LA JOURNÉE — ET J'AI EFFACÉ LA SECTION QUI LA RACONTAIT (23/08 — APP 6.49 → 6.50 · SW 7.04 → 7.05)

**La CI a rougi sur six assertions.** Pas le code : le document et les numéros.

### 60a. Ce qui s'est passé

Le lot « Achats » a été construit sur un clone daté du matin. Entre-temps, deux lots étaient partis :
le **socle DS-0** (§57) et le **thème hors `#app-root`** (§59), ce dernier ayant poussé **APP 6.49 /
SW 7.04**. Ma livraison portait 6.48 / 7.03.

Trois dégâts, mesurés après coup :

| | Ce qui a été perdu |
|---|---|
| **Numéros** | APP 6.49 → 6.48 et SW 7.04 → 7.03 : **les versions ont RECULÉ** |
| **Journal** | le bloc `WHATS_NEW` 6.49 et l'entrée de changelog 7.04, effacés |
| **Code** | la pose du thème sur `<html>` dans `applyTheme` — le correctif de §59, annulé |
| **Document** | §57, §58 et §59 emportées par un `s[:index('## 56.')]` |

⚠️⚠️ **La §58 s'appelle « LE DOCUMENT A PERDU UN CHANTIER ENTIER LE JOUR MÊME ».**
Je l'ai effacée en refaisant exactement ce qu'elle décrit. *Une leçon écrite ne protège de rien si
le geste qui la viole peut aussi la supprimer.*

### 60b. Le geste fautif, nommé

```python
a = s.index("## 56. …"); s = s[:a]        # ← tronque TOUT ce qui suit
```

Je voulais remplacer une section ; j'ai coupé la fin du fichier. Le motif de recherche était juste,
**la borne de fin était absente**. Ce n'est pas une faute de frappe : c'est avoir supposé que ma
section était la dernière, sans le vérifier — alors qu'elle ne l'était plus depuis deux lots.

★ **La règle qui manquait** : *ne jamais couper avec une seule borne.* Un remplacement de bloc se
fait entre **deux** bornes assertées, et le nombre de sections se compte **avant et après**.

### 60c. Pourquoi mon contrôle local n'a rien vu

`harnais-claude-md` était vert chez moi — **27 assertions**. En CI il en a **34**. Mon clone datait
d'avant DS-0 : je faisais tourner une version périmée du filet, et j'en tirais une assurance qui
n'existait pas.

★★★ **Un `git pull` en tête de session ne suffit pas : il faut le refaire avant de livrer.**
Un lot long traverse plusieurs lots des autres. *Le filet qu'on exécute doit être celui de la
branche où le code va atterrir, pas celui du matin.*

### 60d. Le correctif, et pourquoi 6.50 et pas 6.49

Les trois sections sont restaurées depuis `HEAD~1`, le bloc `WHATS_NEW` 6.49 et le changelog 7.04
réinsérés à leur place chronologique, la pose du thème sur `<html>` remise dans `applyTheme`.

⚠️ **On ne reprend NI 6.49 NI 7.04.** Ces numéros ont pu être servis : les réutiliser figerait
l'`index.html` correspondant **pour toujours** chez qui l'a déjà pris. → **6.50 / 7.05**.

★ Le bloc `WHATS_NEW` **6.48 est conservé intact**, alors qu'il annonce un onglet Dépenses que ce
lot supprime. Au tour précédent j'avais décidé de le réécrire « puisqu'il n'est pas déployé » —
hypothèse **fausse**, il l'était. La règle du doute vaut ici comme pour le SW : *en cas
d'incertitude, supposer que c'est en ligne.* Le 6.50 **annonce donc le déménagement** au lieu de
faire disparaître l'épisode.

### 60e. Ce que les filets ont prouvé

Cet incident est la meilleure défense des filets qu'on ait eue : **aucun humain n'aurait relu
9 800 lignes de document pour voir que trois sections manquaient.** La CI l'a dit en six lignes.

- `harnais-claude-md` : sections disparues, titres perdus, scripts muets.
- `mv-harnais-theme` : `2 poses sur #app-root, 0 sur <html>` — le correctif §59 annulé, détecté
  sans qu'aucun écran ne soit ouvert.

⚠️ Et ce qu'ils n'ont **pas** vu : la **régression de numéro**. Aucune assertion ne compare
`APP_VERSION` à ce qui existait avant. → **à écrire**, c'est le seul dégât de la journée qu'aucun
filet ne couvre.

### 60f. Les deux harnais de ce lot

- `mv-harnais-achats` — 35 assertions : les trois états d'un prix (`null` / `0` / `>0`), le retour
  du prix dans l'objet, l'absence de formulaire dupliqué, la source `REPARATEUR_HIST`.
- `mv-harnais-ateliers` — 41 assertions : l'invariant de ventilation, les cibles de diagnostic,
  la fidélité à la maquette, le guide confronté au code.

★ **Deux contre-épreuves sont restées vertes** et ont révélé deux vrais trous : une assertion
testait « il existe **au moins une** lecture correcte » là où il y en a deux, et une autre testait
**l'absence d'un motif textuel** — qui passe dès que le défaut s'écrit autrement. *Compter ce qui
doit exister vaut mieux qu'interdire une forme d'écriture.*

---

## 61. ★★★ UNE RÉCOLTE, PLUSIEURS DESTINATAIRES — LOT VD-1 (24/08 — `cave.js` seul · APP 6.63 → 6.64 · SW 7.18 → 7.19 en clôture, cf. §64)

Point de départ, une phrase de Nico : *« parfois pour les ventes en vrac, plusieurs clients sont sur
la même parcelle »*. En Côte de Nuits une parcelle se partage, et sa vendange se répartit entre le
domaine et un ou plusieurs négoces **le même jour**.

**Le modèle ne portait qu'UN destinataire** : `vendu` (booléen) + `client` (un nom) + `nb_caisses`.
Deux acheteurs obligeaient à saisir **deux récoltes** sur la même parcelle à la même date — et
faisaient compter la parcelle deux fois partout où on la compte une fois.

Une récolte porte désormais **`parts[]`**, une ligne par destinataire :

```
part = { dom:true,  caisses, pck }                        → vinifié au domaine
part = { dom:false, client:'…', caisses, pck, surface? }  → vendu en vrac
```

### 61a. ★★★ LE POIDS PAR CAISSE ÉTAIT UN CHIFFRE VIVANT, IL DEVIENT UNE TRACE

`_vendRecPck(r)` **relisait la fiche client à chaque affichage**. Corriger un client de 24 à 26 kg
déplaçait **rétroactivement tous les kilos qu'il avait déjà reçus** — y compris ceux d'un bon déjà
signé, y compris l'historique de rendement de la parcelle. Personne ne l'avait vu parce que
personne n'avait encore changé un poids en cours de campagne.

Nico : *« le poids d'une caisse peut changer d'un jour à l'autre »*. La question devenait
structurelle. **`pck` est désormais FIGÉ dans la part**, écrit à la saisie ; la fiche client ne fait
plus que le **proposer**. ⚠️ La règle générale : *une valeur de référence qu'on relit à l'affichage
n'est pas une donnée, c'est une opinion du moment* — dès qu'elle sert à établir un document, elle
doit être copiée dans l'enregistrement.

### 61b. ⚠️⚠️⚠️ LE VRAI DANGER DU LOT : ENVOYER EN CUVE DES KILOS VENDUS

`_recKg(r)` rend maintenant le **total** de la récolte, parts clients comprises. Or **onze
emplacements** l'utilisaient en pensant « ce qui entre au cuvier ». Sans distinction, une cuve de
21 hL en aurait affiché 30, le rendement de la cuvée aurait été faux, et la part des anges avec.

Cinq lectures sont passées à la **part domaine** (`_recKgDom` / `_recCsDom` / `_recHasDom`) :
`_vendCuvSync`, `_vendCuvStats`, `_vendRecoltesDispo`, `_cuveCouches`, `_caveBilanChaine`. Les
totaux de campagne, eux, sont devenus des **sommes fines** : `kgCuve` additionne les parts domaine,
`kgVendu` les parts clients — là où le code classait la récolte entière d'un côté ou de l'autre.

⚠️ **Le filtre `!r.vendu` ne veut plus rien dire** : une récolte peut être vinifiée **et** vendue.
Tout `r.vendu` restant dans `cave.js` est à relire avec cette question en tête.

### 61c. ★ AUCUN BUMP : le compteur d'origine reste, masqué, et sert de pont

`index.html` n'est pas touché. Le compteur `#vrec-caisses` n'est pas supprimé : il est **masqué et
tenu à jour avec les caisses du domaine**. Tout le code de cuverie qui le lit (`_vendCuvAtt`,
`_vendCuvKeep`, proposition de volume) continue de fonctionner **et lit exactement ce qu'il doit
lire**. Même chose pour l'ancien select client, masqué plutôt que retiré. C'est ce qui permet un lot
de cette taille **sans bump APP ni SW** — `cave.js` seul.

### 61d. La surface, quand un client achète une PARTIE de parcelle

Chaque part peut porter sa `surface` (ha). Vide = **tout le reste** de la parcelle. Plusieurs parts
sans surface se partagent le reste **au prorata des kilos**, et l'écran le dit.
⚠️ **La surface ne s'additionne pas d'un passage à l'autre** : deux récoltes sur la même parcelle le
même millésime, c'est deux fois la même vigne. (Le calcul par parcelle arrive avec VD-3.)

### 61e. Rétrocompatibilité, dans les deux sens

`_vendParts(r)` fabrique la part unique d'une récolte d'avant le lot — **lecture seule, rien n'est
réécrit** tant que la récolte n'est pas rouverte. Et `saveVendRec` continue d'écrire `nb_caisses`
(somme), `vendu` (aucune part domaine) et `client` (rempli **seulement** s'il y a un client unique) :
Pilotage, les documents et les écrans non repris par ce lot les lisent encore.
⚠️ **`client` est vide quand il y a plusieurs acheteurs** — tout lecteur de `r.client` doit être
converti à `_recKgPour(r, nom)` avant de servir de source de vérité.

### 61f. Le filet : `mv-harnais-vendange-parts.mjs`

**44 assertions**, ajouté à `check` et `prebuild`. Il **extrait les fonctions par comptage
d'accolades et les EXÉCUTE** — un contrôle qui lit du texte aurait dit vert sur les deux défauts
ci-dessus. Deux volets :

- **le socle** (25) : récoltes d'avant le lot, récoltes mixtes, poids figé, et les cas limites qui
  font des divisions par zéro ailleurs (récolte vide, part à 0 caisse, `pck` absent) ;
- **l'écran** (19) : l'injection est rejouée sur un **DOM minimal** et le résultat est LU. Trois
  assertions ★ tiennent le pont `#vrec-caisses` — le point le plus risqué du lot.

`--contre` réintroduit les deux défauts du socle : **6 assertions rougissent**. Une contre-épreuve
muette sort en erreur, pas silencieusement verte. Le pont a sa propre contre-épreuve : faire porter
au compteur le **total** au lieu de la part domaine fait rougir les trois ★.

⚠️ **Deux assertions de ce harnais ont été écrites fausses**, et c'est noté dans le fichier plutôt
que corrigé en silence : un `input[type=number]` porte sa valeur avec un **point** (spec HTML, la
locale ne joue qu'à l'affichage), et le reste d'une parcelle **se partage** entre toutes les parts
sans surface — 0,11 ha chacune, pas 0,22. *Quand une assertion tombe, la première question reste :
laquelle des deux a tort ?*

### 61g. La suite du chantier

VD-1 n'est que le socle. **VD-2** (§62) apporte les livraisons, les bons imprimables et le retour du
client ; **VD-3** (§63) le rendement de la parcelle. Les trois lots sont livrés le même jour, dans
`cave.js` seul, sans bump.

Maquettes de référence, validées par Nico avant écriture d'une ligne de code :
`mq-vendange-multiclients-v6.html` — 5 écrans, 6 versions d'itération.

⚠️ **Ce que les trois lots ne font PAS**, et qu'il faut relire avant de croire le chantier fini :

- **`r.vendu` et `r.client` survivent** comme champs dérivés. Ils restent lus par des écrans que ces
  lots n'ont pas repris — notamment le bilan de campagne (`cave.js` ~8590) et l'export CSV. Un
  lecteur de `r.client` voit **vide** quand une récolte a deux acheteurs : `_recKgPour(r, nom)` est
  la bonne porte.
- **`_apportsRangs`** (graphe des apports par parcelle) compte le TOTAL, part vendue comprise, et
  en tire un volume au ratio. C'est juste comme « ce que la parcelle a donné », douteux comme
  volume. À trancher sur capture.
- La **saisie du volume décuvé** n'existe pas en propre : le volume domaine vient de la cuve
  rattachée. Une part domaine sans `cuve_id` reste estimée, sans moyen de la fermer à la main.

---

## 62. ★★★ LE BON DE LIVRAISON, ET LE RETOUR QUI ARRIVE TROIS SEMAINES PLUS TARD — LOT VD-2 (24/08 — `cave.js` seul · bump en clôture, cf. §64)

Suite immédiate de VD-1. Nico : *« il faut pouvoir l'éditer car après les clients nous donnent le
nombre de litres de jus et le nombre de litres de lie qu'ils ont eu »*.

### 62a. ★ L'UNITÉ DU BON N'EST PAS L'APPORT, C'EST LE CHARGEMENT

Un client qui reçoit deux parcelles le même jour ne connaît **qu'une livraison**. `_vendLivs(nom)`
regroupe donc les parts par **client + date**, toutes récoltes confondues. C'est cette livraison
qu'on édite et qu'on imprime — pas la part, pas la récolte.

### 62b. ★★★ DEUX MESURES QUI NE SE MÉLANGENT PAS

Les **kilos** sont mesurés par le domaine, le jour de la vendange. Les **litres** sont mesurés par
le client, après pressurage, des semaines plus tard. La feuille de saisie a donc deux blocs
séparés — *ce qui est parti* / *ce que le client a rendu* — et corriger l'un ne touche jamais
l'autre. Le document dit **qui a mesuré quoi** : *« les volumes sont ceux annoncés par le client,
ils n'engagent pas le domaine »*, en face de *« en cas d'écart, le pont-bascule fait foi »*.

⚠️ **Un bon qui laisserait croire à une pesée serait une promesse que le domaine ne peut pas tenir.**

### 62c. ⚠️⚠️ LE PIÈGE DU PRORATA : UN LITRE QUI N'EXISTE PAS

Quand le client donne **un seul chiffre** pour une livraison à plusieurs parcelles, les litres sont
répartis au prorata des kilos. Un arrondi ligne à ligne fabrique du volume : 555 L sur 200/600 kg
donnent 138,8 + 416,3 = **555,1**. La **dernière ligne reçoit le reste**, pour que la somme retombe
exactement sur ce que le client a annoncé. La répartition est marquée `src:'prorata'`, affichée en
orange, et le document écrit que *le détail par parcelle est une répartition, pas une mesure*.
Une case permet la saisie détaillée quand le client, lui, a détaillé.

### 62d. Ce que le bon ne dit pas

**Aucun prix, aucun montant** — décision de Nico, tenue par une assertion : le corps du document est
scanné pour `€`, `euro`, `prix`, `montant`. La contre-épreuve glisse « 12,50 €/kg » dans une tuile :
l'assertion rougit.

Et **la section « Retour du client » n'existe que s'il y a un retour**. Un tableau vide dirait
« rien n'a été pressé » là où il faut lire « on attend encore » — à la place, un cadre d'attente.
Quand une partie seulement des livraisons a son retour, les totaux disent sur combien de kilos ils
portent : *« ne portent que sur 672 kg des 912 kg livrés »*.

### 62e. Là où ça vit, sans toucher à la barre d'onglets

Le Cuvier a déjà quatre onglets ; un cinquième les aurait écrasés sur 430 px. L'entrée est
**la ligne « kg vendus en raisin » de l'écran Récoltes**, devenue cliquable et qui porte le compte
des **retours attendus** — puis Ventes en vrac → un client → ses livraisons → son bon. Second accès
depuis Réglages du Cuvier. La fiche client gagne une **adresse** (le bon la porte) et une note :
le poids par caisse y est **proposé**, plus imposé, depuis VD-1.

### 62f. Ce que le preflight a attrapé, et qu'aucun essai n'aurait vu

- **`_vliv` nommé dans un `onchange` inline** : l'état n'existe pas sur `window`, la date de
  réception serait partie en `ReferenceError` **silencieux**. Remplacé par `_vendRetDate(v)`.
  *Exporter les fonctions ne suffit pas : l'état aussi doit traverser.*
- **Un glyphe `✓` en dur** — 27ᵉ emoji de `cave.js` là où le cliquet en tolère 26. Remplacé par
  l'icône `check` du sprite.
- **Deux `_mvIcon(...,14)`** : l'échelle est 16/18/20/24/40.
- **`font-weight:400`** dans le CSS du document : les trois pas de la charte sont 500/600/700.

⚠️ Et un **patch Python qui échoue au troisième motif n'écrit rien** — les deux corrections de
taille déjà « faites » avaient été perdues, et le harnais les redisait. *Le dry-run de TOUS les
motifs avant la première écriture n'est pas une précaution de style.*

### 62g. Le filet

`mv-harnais-vendange-parts.mjs` passe de 44 à **73 assertions** : le regroupement par chargement, le
rendement réel kg/hL, le corps des deux documents (produit **et lu**, pas raisonné), et la fonction
de prorata rejouée telle qu'elle est écrite. Trois contre-épreuves : prorata sans reprise du reste
(1 rouge), section retour toujours affichée (2 rouges), prix glissé dans le bon (1 rouge).

---

## 63. ★★★ « 42 hL/HA » QUAND DEUX VOLUMES SUR TROIS MANQUENT — LOT VD-3 (24/08 — `cave.js` seul · bump en clôture, cf. §64)

Nico, à la question de savoir si les litres rendus par les clients devaient remonter dans le
rendement : *« bien sûr que les volumes remontent dans le rendement de la parcelle »*. La suite du
lot n'était pas de brancher un tuyau, c'était de décider **ce qu'un rendement a le droit d'affirmer**.

### 63a. ★★★ L'ESCALIER DES SOURCES

Une parcelle partagée reçoit son volume de trois endroits, et ils ne se valent pas :

| marche | d'où | ce que ça vaut |
|---|---|---|
| **client** | litres rendus après pressurage | mesuré, mais chez lui |
| **cuve** | volume logé au domaine (`cuves_vinif[].volume_hl`) | mesuré, au domaine |
| **estimé** | kilos ÷ ratio 130–140 | une fourchette, jamais un chiffre |

⚠️ **Un volume de cuve qui rassemble plusieurs parcelles est réparti au prorata des kilos** : il est
alors **déduit**, pas mesuré par parcelle, et sort marqué `prorata`.

### 63b. ⚠️⚠️⚠️ CE QUE `_mlRendements` AFFICHAIT

`hlHa = kg / surface / kgHl` — une **estimation au ratio moyen**, présentée comme un chiffre net,
comparée au maximum d'appellation, avec un **« 104 % du maximum »** en dessous. Un dépassement
d'appellation annoncé sur une estimation.

La règle posée : **un hL/ha ne s'affiche comme mesure que si 100 % des kilos de la parcelle ont un
volume connu.** Sinon c'est une **fourchette**, avec un badge `77 % mesuré`, et le pourcentage du
maximum s'écrit **« ≈ 104 % »**. Sur Le Clos du jeu d'essai — cuve connue, un retour reçu, un
attendu — l'écran passe de « 42,9 » à « 42,6–43,4 · 77 % mesuré », et le détail dit lequel des trois
destinataires manque encore. *C'est §33 à l'identique : un indicateur bâti sur un signal partiel
ment avec l'autorité d'une mesure.*

### 63c. Les surfaces, et leurs trois écarts

`_vendSurfParc(nom, millésime)` : chaque destinataire prend sa surface déclarée ; ceux qui n'en ont
pas se partagent **le reste** — au prorata des kilos s'ils sont plusieurs. Trois écarts, aucun
absorbé en silence : **dépassement** de la parcelle, **hectares que personne ne réclame**,
**deux surfaces divergentes** pour un même destinataire (la plus grande est retenue).

⚠️ **La surface ne s'additionne pas d'un passage à l'autre.** Deux récoltes sur la même parcelle le
même millésime, c'est deux fois la même vigne. Une somme naïve diviserait par deux le rendement de
la portion.

### 63d. ★ DEUX DÉNOMINATEURS, ET CHACUN PORTE SON ÉTIQUETTE

Décision de Nico : **`kg_ha` reste rapporté à la parcelle entière** — le domaine travaille toute la
vigne même quand il en vend une part, et c'est ce rapport que `_pecRecolte` lit pour le prix de
revient. Le rendement d'une **portion** vit à côté. Les deux sont justes ; ce qui serait faux, c'est
de ne pas dire lequel on lit : l'écran écrit *« sur la parcelle entière »* et *« sur sa portion »*,
et l'entrée versée porte `kg_ha_base` / `hl_ha_base` **plutôt que de laisser deviner** le prochain
lecteur.

L'entrée `rendement_hist[]` garde tous ses champs actuels et gagne `surface_parcelle_ha`,
`surface_attribuee_ha`, `vol{hl, hl_ha, base, src, kg_couverts, kg_manquants, complet, prorata}` et
`parts[]` par destinataire. **Rien de ce que Pilotage lit ne change de sens.**

### 63e. Un réglage plutôt qu'une devinette

Le client rend **deux** chiffres, jus et lie. Lequel compte pour la déclaration ? Je ne le sais pas,
et le deviner aurait été le pire choix : `config.rdt_base` (`jus` par défaut, ou `total`) se règle
dans le Cuvier. En base « jus + lies », l'écran prévient que **le volume du domaine est un volume
logé, ses lies ne sont comptées nulle part** — la comparaison penche alors contre le domaine.

### 63f. ⚠️ UNE CONTRE-ÉPREUVE EST SORTIE MUETTE, ET C'EST ELLE QUI A APPRIS LE PLUS

Casser le prorata de cuve (`vol × kd/tot` → `vol`) n'a fait rougir **aucune** assertion : le jeu
d'essai n'avait qu'une récolte par cuve, cas où les deux expressions rendent le même nombre. Un
harnais qui **ne peut pas** rougir ne prouve rien. Cinq assertions ajoutées avec une cuve qui
rassemble deux parcelles — la contre-épreuve en fait rougir quatre.

`mv-harnais-vendange-parts.mjs` passe à **110 assertions**. Quatre contre-épreuves : statut toujours
« mesuré » (1 rouge), fourchette ignorant les kilos sans volume (2), surfaces additionnées entre
passages (2), volume de cuve non réparti (4).

⚠️ Et un glyphe `⚠` écrit dans un texte d'interface a fait remonter le compteur d'emojis de
`cave.js` à 27 — deuxième fois dans la journée. Remplacé par l'icône `alerte` du sprite.

---

## 64. ★★★ TROIS LOTS LIVRÉS SANS GUIDE NI JOURNAL — ET LA RÈGLE ÉTAIT DÉJÀ ÉCRITE (24/08 — clôture VD · APP 6.63 → 6.64 · SW 7.18 → 7.19)

Nico, après la livraison de VD-3 : *« j'imagine que tu as tout prévu dans le guide et dans le
claude.md comme stipulé dans les règles ? »*. **Non.** CLAUDE.md était à jour ; le guide, la fiche
d'aide et le journal des nouveautés ne l'étaient pas. Trois lots d'affilée.

### 64a. ⚠️⚠️⚠️ CE QUE LA RÈGLE DISAIT DÉJÀ, MOT POUR MOT

La **règle d'or n°4** est en tête de ce document depuis le 09/08 : *« un lot n'est pas fini tant que
l'aide ne dit pas la vérité — OBLIGATOIRE, AUCUNE EXCEPTION, AUCUN "PLUS TARD" »*, avec le tableau
qui nomme `MV_AIDE`, le guide public et `WHATS_NEW`. Elle porte même la phrase qui décrit exactement
ce qui vient de se passer : *« ce qui rend cette règle nécessaire, c'est qu'elle est facile à
contourner sans mentir »*.

★★★ **Une règle qu'on lit n'est pas une règle qui se déclenche.** Elle avait déjà été enfreinte deux
fois le 11/08 ; elle vient de l'être trois fois de suite. La leçon n'est pas « mieux lire » — c'est
qu'une consigne sans filet mécanique se contourne par simple inattention, surtout en fin de chantier
quand le code est vert et que tout paraît fini.

### 64b. ★★★ ET LE MANQUE EN CACHAIT UN PLUS GRAVE : « AUCUN BUMP » RENDAIT LE LOT INVISIBLE

Les trois lots tenaient dans `cave.js` seul, donc « aucun bump » — vrai pour le cache. **Faux pour
le client.** `WHATS_NEW` vit dans `utils.js` et le récap agrège **jusqu'à `APP_VERSION`** : sans
bump, un chantier entier — la vente à plusieurs, les bons, le rendement mesuré — n'a **aucune
existence** pour l'utilisateur. Il l'aurait découvert en tombant dessus.

**Annoncer, c'est bumper.** La règle « module seul = aucun bump » est une règle de déploiement, pas
une dispense d'annonce. **APP 6.63 → 6.64, SW 7.18 → 7.19**, avec les quatre affichages d'
`index.html` et les quatre points du SW.

### 64c. Le filet : C27

`WHATS_NEW` doit s'ouvrir sur `APP_VERSION`, sinon **ERREUR** au preflight. Le contrôle n'impose pas
d'annoncer quelque chose : il impose de **décider**. Une version purement technique déclare
`{ v:'x.xx', items: [] }` — et c'est alors un choix conscient, pas un oubli. Contre-épreuve : passer
`APP_VERSION` à 6.65 sans toucher au journal fait sortir C27 en rouge.

⚠️ **Ce que C27 ne fait pas** : vérifier que le guide et `MV_AIDE` sont **vrais**. Aucun contrôle ne
sait lire une phrase. Le filet ne couvre que la porte la plus mécanique des six ; les cinq autres
restent tenues par la **liste de clôture** de la règle d'or n°4, à dérouler ligne par ligne dans la
réponse de livraison.

### 64d. Ce qui a été écrit en clôture

- **Guide** — `guide/08-cave.html` : trois sous-sections neuves (vendre en vrac, le bon et le retour
  du client, ce que le rendement affirme), les cartes Récoltes et Réglages du Cuvier reprises, et le
  bon ajouté à la liste des documents. `public/guide.html` régénéré, `--check` vert.
- **`MV_AIDE` cave** — cinq points neufs (répartition, poids du jour, bon, retour, escalier des
  sources) et un sixième sur les deux documents.
- **`WHATS_NEW` v6.64** — cinq entrées, écrites du **symptôme vécu** : « deux négoces obligeaient à
  saisir deux récoltes le même jour », « corriger la fiche déplaçait tous les kilos déjà livrés ».
  Le bloc est **exécuté** par le harnais, pas relu des yeux : cinq items, zéro mot technique.
- **`MV_INFO`** — relu, rien à changer : aucun chiffre de cette famille n'y est décrit.

---

## 65. ★★★ LE BLOC SE MASQUAIT LUI-MÊME À LA DEUXIÈME OUVERTURE (24/08 — `cave.js` · APP 6.64 → 6.65 · SW 7.19 → 7.20)

Nico, capture à l'appui, une heure après la mise en ligne : *« après avoir créé un client pour le
vrac, l'ajout d'une récolte ne me présente plus ce qui avait été mis en place. Nombre de caisse,
client, vente en vrac… »*. L'écran **Nouvelle récolte** n'affichait plus ni la répartition, ni les
caisses, ni la destination : parcelle, date, température, puis plus rien.

### 65a. ★★★ LA CAUSE : LE BLOC ÉTAIT DEVENU SON PROPRE VOISIN

`_vendRepInject` retrouvait le libellé « Nombre de caisses » par
`rowCs.previousElementSibling` — le frère qui précède la ligne des caisses. Et le bloc de
répartition s'insère **juste avant cette même ligne**. Dès la première ouverture, il **devient** ce
frère précédent.

À la **deuxième** ouverture, `_vendRepHide(rowCs.previousElementSibling)` ne visait donc plus le
libellé : il visait **le bloc lui-même**. `display:none`, sans la moindre erreur en console. Le
premier essai marchait — c'est ce qui rend le défaut si facile à livrer.

★★★ **La leçon, générale : une position relative dans le DOM n'est valable qu'AVANT d'avoir inséré
quoi que ce soit dedans.** Un code qui masque par voisinage et qui insère au même endroit se tire
dessus au deuxième passage. La parade n'est pas de mieux viser, c'est de **ne plus re-viser** : ce
qui doit être caché est marqué **une fois** (`data-vd-off`), quand le voisinage est intact ; ensuite
on relit la marque. Et le bloc **réaffirme son affichage** à chaque ouverture — ce qui répare un
écran déjà éteint, sans rien recharger.

### 65b. ⚠️⚠️⚠️ LE HARNAIS AVAIT UN FAUX DOM COMPLAISANT

Le volet « écran » du harnais rejouait l'injection sur un DOM simulé dont `getElementById`
**fabriquait le nœud demandé** s'il ne le trouvait pas — `#vrec-rep` existait donc toujours, quoi
qu'il arrive. Ce faux DOM ne pouvait voir ni un échec d'insertion, ni un bloc masqué. Il ne
connaissait pas non plus les frères : `previousElementSibling` était **posé à la main** par le
harnais, donc toujours juste. **Le défaut était structurellement invisible pour lui.**

Le faux DOM rend maintenant un vrai petit arbre : `getElementById` **parcourt**, le voisinage
**découle** de l'ordre des enfants, `setAttribute` et `querySelectorAll('[data-vd-off]')` existent.
Et le harnais **rouvre l'écran trois fois** — 5 assertions neuves, dont trois ★.

⚠️ Le diagnostic, lui, a été fait sur **jsdom et le vrai `index.html`** (hors dépôt, installé dans
le bac à sable). *Quand un écran ment en production, on ne raisonne pas sur le code : on rejoue le
DOM réel.* C'est ce qui a montré, en trois lignes, « ouverture n°1 VISIBLE / n°2 INVISIBLE ».

### 65c. ⚠️ ET LA PREMIÈRE CONTRE-ÉPREUVE EST SORTIE MUETTE

Réintroduire la visée par voisinage n'a fait rougir **aucune** assertion : la ligne de réparation
`box.style.display=''` rattrapait le défaut derrière. **Trois protections avaient été ajoutées d'un
coup** — la marque, la garde `id!=='vrec-rep'`, la réaffirmation — et il fallait les retirer
**toutes les trois** pour retrouver le code fautif. Une fois fait, 2 assertions rouges, et le
diagnostic jsdom repasse à « n°2 INVISIBLE ».

*Une contre-épreuve qui n'enlève qu'une protection sur trois ne prouve rien : elle mesure la
redondance, pas le filet.*

### 65d. Le bump, et pourquoi

6.64 était **déjà en ligne** : la règle du doute impose de bumper. **APP 6.65 · SW 7.20**, avec un
bloc `WHATS_NEW` **`items: []`** — le correctif ne fait que rendre vrai ce que 6.64 annonçait ; il
n'y a rien de neuf à raconter à l'utilisateur. C27 exige une **décision**, pas une annonce : c'en
est une, et elle est écrite en commentaire au-dessus du bloc.

---

## 66. ★★★ LA VIRGULE ÉTAIT REFUSÉE, ET LE CURSEUR SAUTAIT (24/08 — `cave.js` · APP 6.65 → 6.66 · SW 7.20 → 7.21)

Nico : *« rajoute aussi la possibilité d'écrire la surface en précision 0,00 »*. Derrière cette
phrase, **deux défauts cumulés** qui rendaient le champ inutilisable — et la demande dit
poliment ce que le code faisait mal.

### 66a. ⚠️⚠️⚠️ UN `input type="number"` REFUSE LA VIRGULE, ET LE FAIT EN SILENCE

Sur un clavier français on tape « 0,12 ». Le navigateur juge la valeur invalide et rend
`this.value === ''` — **une chaîne vide, pas la saisie**. Le code recevait donc « rien » et
**effaçait** la surface. Aucun message, aucune trace. Rejoué sur jsdom et le vrai `index.html` :
`après avoir tapé « 0,12 » → this.value vaut ""`.

★ La règle : *un champ décimal destiné à un francophone ne peut pas être un `type="number"`.*
`text` + `inputmode="decimal"` (le pavé numérique sort quand même sur téléphone), et une seule
fonction lit ce qui a été écrit — `_vendLireNb`, virgule ou point, espaces et insécables compris.
Ce qu'on **remet** dans un champ passe par `_vendNbTxt` : virgule française, jamais un point.

### 66b. ★★★ ET LE CHAMP ÉTAIT RECRÉÉ À CHAQUE FRAPPE

`_vendRepSurf` redessinait **toutes** les lignes, y compris celle en cours de saisie : l'`<input>`
était remplacé, donc le curseur perdu **dès le premier caractère**. Même avec un point, taper une
deuxième décimale était impossible.

Désormais, la ligne qu'on remplit ne voit rafraîchir que son **texte de droite** (`#vrp-rs-i`) ; les
**autres** lignes, dont le « reste » vient de changer, se redessinent entièrement.
⚠️ Vécu deux fois dans ce lot : c'est le même défaut de nature que §65 — *du code qui réécrit
l'endroit où il se trouve*.

⚠️ **Ce piège ne se voit qu'en tapant PLUSIEURS caractères.** Une assertion qui n'en tape qu'un
serait verte pour rien. Le harnais tape maintenant `'0'`, `'0,'`, `'0,1'`, `'0,12'`, et vérifie
qu'une **sentinelle** posée dans la ligne éditée survit.

### 66c. Le même piège ailleurs, corrigé dans la foulée

Poids par caisse de la répartition (24,5 kg était refusé), litres de jus et de lie du retour client,
et poids de la **fiche client** — qui portait en plus `min="10" max="60"`, donc interdisait
silencieusement un client à 24,5 kg. Tous en saisie libre, tous relus par `_vendLireNb`.

### 66d. ⚠️ ET C27, MON PROPRE CONTRÔLE, S'ÉTAIT TU

Le commentaire écrit au-dessus du bloc `WHATS_NEW` de la 6.65 — celui qui justifie un `items: []` —
a suffi à faire échouer le motif de C27, qui exigeait le premier bloc **immédiatement** après le
crochet. Résultat : *« WHATS_NEW introuvable ou forme inattendue »*, en simple **avertissement**.
Le contrôle ne surveillait plus rien **tout en se lisant comme un succès**. Il saute maintenant
blancs et commentaires. *Quatrième fois qu'un contrôle est mis en échec par le texte que je viens
d'écrire à côté (§53, §55n).*

### 66e. Trois contre-épreuves, et une assertion à moi qui a rougi à juste titre

Remettre `type="number"` (1 rouge), redessiner la ligne éditée (1 rouge), ignorer la virgule à la
lecture (4 rouges). ⚠️ Et le test d'effacement **mutait l'état partagé** : il vidait la surface
qu'une assertion vérifiait trente lignes plus bas. L'état est désormais rendu comme il a été
trouvé. *Un test qui laisse le terrain sale fait rougir le suivant, pour rien.*

**127 assertions.** Guide, `WHATS_NEW` et bump faits dans le même lot — clôture de la règle d'or n°4.


---

## 67. ★★★ DOUZE PIXELS DE TROP, ET TOUT L'ÉCRAN DÉCROCHE (25/08 — APP 6.67 → 6.68 · SW 7.22 → 7.23)

> ⚠️ **Le lot APP 6.67 / SW 7.22 (La Réserve, jeu d'icônes) n'a PAS de section dans ce document.**
> Constat, pas reproche : la session qui l'a produit ne l'a pas écrite. Son changelog SW est
> détaillé, lui. Ce trou est signalé ici pour qu'une prochaine session ne cherche pas §67 = 6.67.

**Le point de départ, en une phrase de Nico :** *« l'écran d'accueil du module vigne est mal
calibré il peut bouger à droite et a gauche et en bas et en haut. de plus il y a encore beaucoup de
noir ecrit sur du sombre dans les 3 rectangles en haut de chaque module quand on met l'appli en
mode sombre »*. Deux défauts sans rapport apparent — et deux méthodes de diagnostic opposées.

### 67a. Le noir sur sombre — une couleur de fond utilisée comme encre

`.mvu-kpi` est le composant des **trois cases de chiffres** sous l'en-tête. Il vit sur **sept
écrans** : Accueil, Parcelles, Journal, Tracteur, Réglages (statiques dans `index.html`), Planning
et Cave (injectés en JS).

| Sélecteur | Ce qu'il portait | Clair | **Sombre** |
|---|---|---|---|
| `.mvu-kpi-v` (le chiffre) | `color:var(--cave)` | 18,02:1 | **1,12:1** |
| `.mvu-kpi-l` (le libellé) | `color:var(--texte-doux)` | ✅ | 7,82:1 |
| `.mvu-kpi.due .mvu-kpi-v` | `color:#B0304A` | 5,97:1 | **2,79:1** |
| `.mvu-kpi.pl2-kpi-alert .mvu-kpi-l` | `color:#A0291E` | 5,63:1 | **2,18:1** |
| `.mvu-tabs.mvu-sub .mvu-tab.active` | `color:var(--cave)` | 18,02:1 | **1,12:1** |

★★★ **La cause tient en une phrase : `--cave` est le brun-noir des FONDS, pas une encre.** En mode
clair il vaut `#14110D`, **indiscernable à l'œil** de `--texte` (`#1A1A14`) — le défaut ne pouvait
pas être vu, ni par relecture, ni par capture. En mode sombre les deux partent **en sens
contraires** : `--cave` descend à `#100D0A` pendant que `--bg-card` monte à `#1C1A16`. 1,12:1.
C'est **§21c à l'identique**, six jours plus tard, sur un autre composant.

★★ **Le libellé, lui, se lisait très bien** (7,82:1) : c'est ce qui donnait au client l'impression
d'une case « à moitié vide » plutôt que d'une case cassée — et c'est pourquoi le défaut a survécu.

★★★ **Deux fautes SYMÉTRIQUES trouvées en jouant l'AUTRE thème** : la valeur de l'alerte
« sem. > max » du Planning (`#F0A9A0` en dur dans `planning.js`) sort à **1,46:1 en mode CLAIR**, et
la case « en cours » du Chai (`var(--or)` sur `var(--or-pale)`, dans le CSS injecté par `cave.js`) à
**2,23:1 en mode CLAIR**. *Un audit de contraste qui ne joue qu'un seul thème n'en trouve que la
moitié.*

**Correctifs** — encres du projet plutôt que couleurs de surface :
`var(--cave)` → `var(--texte)` (×2) · `#B0304A` et `#A0291E` → `var(--rouge)` · `#F0A9A0` →
`var(--rouge)` · `var(--or)` → **`var(--or-tx)`**, le jeton fait exactement pour ça.
**Après :** pire ratio **6,11:1** en clair et **7,82:1** en sombre sur les 15 cases mesurées.

### 67b. Le cadrage — la garde était là, et ne gardait rien

Symptôme précisé par Nico au deuxième tour : *« de quelques mm mais suffisamment pour cacher le
titre des modules en bas lorsqu'on scroll vers le haut, ça fait donc écran pas fixe. idem sur les
côtés alors que tous les autres modules sont ok »*.

**Reproduit en machine** (Chromium mobile 360×800, `#page-home` active, dock rendu) en injectant
**un** élément à `width:calc(100% + 12px)` :

| | sans l'intrus | **avec 12 px de trop** |
|---|---|---|
| `documentElement.scrollWidth` | 360 | **373** |
| bas de `#mv-dock` | 800 | **827** |
| en-tête collé après 250 px | oui | oui |

★★★ **Le mécanisme.** Un débordement horizontal fait grandir le **viewport de mise en page**, et il
le fait **dans les deux sens**. `#mv-dock` est `position:fixed;bottom:0` : il se cale sur le bas de
ce viewport agrandi, donc **27 px sous le bord réel de l'écran** — les libellés des modules sont
coupés. Et la page, plus grande que l'écran, devient baladable à droite, à gauche, en haut et en
bas. **Un seul défaut produit les cinq symptômes décrits, y compris ceux qui semblaient verticaux.**

⚠️⚠️⚠️ **`body{overflow-x:hidden}` était déjà posé (ligne ~255) — et le dock descendait quand
même.** La propriété bloque le **défilement** ; elle n'empêche pas l'**agrandissement du viewport**.
C'est ce qui rendait le défaut introuvable à la lecture : *on voit la garde, on la coche, on passe
à autre chose*. **Une garde qui existe n'est pas une garde qui garde** — corollaire direct de la
règle d'or n°3, et cousin du cas `lint-vocabulaire` (contrôle écrit, jamais branché).

**Correctif**, dans le bloc CADRAGE en fin de `styles.css`, point **5b** :

```css
html,body{overflow-x:hidden;}
@supports (overflow:clip){ html,body{overflow-x:clip;} }
```

★★ **Pourquoi `clip` et pas `hidden` sur `html`.** `hidden` sur `html` créerait un **conteneur de
défilement**, ce qui **casserait le `position:sticky` de `.mod-header`** (point 1 du même bloc,
péniblement obtenu en §21b) et pourrait déloger le `fixed` du dock. **`overflow:clip` ne crée aucun
conteneur de défilement** : il coupe, point. La ligne `hidden` reste au-dessus comme repli pour les
navigateurs antérieurs à Chrome 90 / Safari 16 / Firefox 81.

**Contre-épreuve jouée sur les fichiers patchés** : intrus +12 px **réintroduit** → `scrollWidth`
360, dock à 800, en-tête toujours collé à 0. Sans la règle, le même intrus rendait 373 et 827.
*Le harnais rougit quand on remet le défaut.*

### 67c. Ce qui reste ouvert — l'élément qui déborde n'est pas nommé

⚠️⚠️ **La garde neutralise l'effet, elle ne supprime pas la cause.** Mesures faites :

- HTML statique de l'accueil, **quatre largeurs** (360 / 390 / 412 / 430 px), `overflow-x` neutralisé
  pour révéler ce qui serait masqué : **zéro élément déborde**, dans les deux sens.
- Idem avec les onze widgets `home-w` **tous dépliés** et du contenu factice recopié du générateur
  (frise météo 5 jours, raccourcis) : **zéro**.
- Sonde passée par Nico dans la console, retour `[]`.

★★★ **Et pourtant on ne peut pas conclure — la sonde était partielle sur quatre points**, ce qui en
fait un cas d'école du corollaire « varier le motif de recherche avant de conclure à l'absence » :

1. elle ne testait que le **bord droit** (`rect.right`), pas le gauche ;
2. elle ne parcourait que `#page-home *` — ni le dock, ni `#mv-trial-bar`, ni les overlays ;
3. elle a tourné **après** le correctif ;
4. et très probablement en largeur **bureau** : au-delà de 768 px le `body` n'est plus plafonné à
   430 px et la mise en page n'est pas celle du téléphone. **Le défaut est mobile ; le mesurer sur
   un écran large ne peut pas le trouver.**

**La sonde complète, à coller une fois, en simulation mobile (~390 px) et connecté :**

```js
(()=>{const h=document.documentElement,b=document.body,
 ox=[h.style.overflowX,b.style.overflowX];h.style.overflowX=b.style.overflowX='visible';
 const bb=b.getBoundingClientRect(),out=[];
 document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();
  if(!r.width&&!r.height)return;const d=Math.max(r.right-bb.right,bb.left-r.left);
  if(d>0.5)out.push([+d.toFixed(1),e.tagName,e.id||e.className]);});
 const res={largeur:h.scrollWidth+' / '+h.clientWidth,coupables:out.sort((x,y)=>y[0]-x[0]).slice(0,10)};
 h.style.overflowX=ox[0];b.style.overflowX=ox[1];return res;})()
```

**Piste non vérifiée à garder** : plusieurs blocs de l'accueil sont des items flex **sans
`min-width:0`** (`.hdre-tit`, `.hmsem-l`, `.hdre-bad`) — un mot long sans espace (nom de parcelle,
nom de membre) ne peut alors pas être rétréci et pousse son conteneur. **Hypothèse, pas constat :
ne pas l'écrire au présent tant qu'elle n'est pas mesurée.**

### 67d. Ce que l'outillage a coûté, encore

⚠️ **Mon harnais de contraste s'est trompé deux fois dans la même session.**

1. **71 « défauts » annoncés, 42 faux.** Le filtre `getComputedStyle(el).display!=='none'` ne
   protège de rien : sur un élément dont un **ancêtre** est `display:none`, `getComputedStyle` rend
   la valeur **propre** de l'élément (`block`), pas `none`. Toutes les modales cachées passaient. Le
   bon filtre est un `getBoundingClientRect()` non nul. **De 71 à 29.**
2. **Deux ratios faux** parce que la boucle sur les deux thèmes **ne rechargeait pas la page** entre
   les deux. Les chiffres retenus dans cette section viennent de la **lecture directe des couleurs
   calculées** par le navigateur, pas du harnais.

★★ La leçon du 23/08 se confirme une fois de plus : **quand une assertion tombe, se demander
d'abord laquelle des deux a tort.** Ici c'était l'assertion, les deux fois — et une seule des deux
erreurs a été trouvée en la relisant ; l'autre l'a été **en mesurant autrement**.

★ **Contrôle possible, non écrit** : aucun harnais du projet ne lit une **couleur** ni une **mise en
page**. Un `mv-harnais-contraste.mjs` qui rend `index.html` sous Chromium, joue les **deux** thèmes
et exige ≥ 4,5:1 sur tout élément à texte direct rendu, attraperait toute cette famille. Il ne
verrait que le statique — ce qui aurait suffi pour **cinq des sept écrans** de ce lot.

### 67e. Livraison

| Fichier | Ce qui change | Bump |
|---|---|---|
| `src/styles.css` | 4 corrections de contraste + garde de cadrage (point 5b) | — |
| `src/planning.js` | valeur d'alerte lisible en mode clair | — |
| `src/cave.js` | case « en cours » du Chai lisible en mode clair | — |
| `src/utils.js` | `APP_VERSION` + bloc `WHATS_NEW` | ★ APP |
| `index.html` | les 4 affichages de version | ★ APP |
| `public/sw.js` | en-tête, `CACHE_NAME`, 2 `console.log`, changelog | ★ SW |

**Pourquoi un bump alors que le lot est presque tout en CSS** : le CSS est un asset Vite **hashé**,
référencé par `index.html`. Sans bump SW, un client dont le service worker sert l'ancien
`index.html` **ne prendra jamais** le nouveau CSS. « Module seul = aucun bump » ne s'applique pas
dès qu'`index.html` ou `utils.js` bougent.

**Mesuré** : 15 cases sur 5 écrans, pire ratio 6,11:1 (clair) / 7,82:1 (sombre) · syntaxe des trois
JS validée (`node --check`) · 3102 accolades CSS équilibrées · **C27 vert** (`WHATS_NEW` ouvre sur
`APP_VERSION`) · les 2 noms d'icônes du journal existent dans le sprite (vérifié contre `index.html`).
**Non vérifié** : le rendu à l'œil sur l'appareil de Nico — *aucun harnais ne lit une mise en page*.
Guide public et fiches `MV_AIDE` relus : ils ne mentionnent le thème que pour dire qu'il existe,
**rien à changer**. `MV_INFO` : aucune méthode de calcul touchée.

---

## 68. ★★★ UN INCIDENT RÉSEAU N'EST PAS UNE PANNE (25/08 soir — APP 6.68 → 6.69 · SW 7.23 → 7.24)

> *Nico, capture à l'appui, depuis la cave : « Problème lors de la saisie d'une analyse et des
> informations et de l'upload du fichier pdf ».*
> Sur la capture : l'écran « Nouvelle opération » du Chai, type **Analyse**, Chambolle 2025 ·
> 6 fûts — et par-dessus, en travers du récapitulatif, un bandeau gris :
> **« Promesse rejetée : Firebase: Error (auth/network-request-failed) »**. En **4G**.

### 68a. Le message était faux sur le fond

`auth/network-request-failed` vient du module **Auth**, pas de Storage ni de Firestore : le SDK
n'a pas pu joindre `securetoken.googleapis.com` pour **rafraîchir le jeton** (il expire à ~1 h).
Firestore et Storage demandent ce jeton avant chaque écriture, donc **l'erreur d'Auth remonte
telle quelle** à travers eux. Au fond d'une cave, sur 4G, c'est un événement **normal** —
et `navigator.onLine` reste `true`, ce qui est précisément ce qui rend le cas piégeux.

**`fbSave` avait fait exactement son travail** : `_retryAsync` 3 tentatives à 1 s, échec,
`_queueSave(key, value)` — la modification est en file dans `localStorage`, elle repartira au
retour du réseau ou au prochain `_flushQueue` (30 s). **Rien n'était perdu.**
**Puis elle relançait l'erreur.**

### 68b. ★★★ Le vrai défaut : 71 appels nus derrière un `throw`

```js
if(window.fbSave) window.fbSave('cave_elevage', CAVE_ELEVAGE);   // × 71
```

**Zéro `await`, zéro `.catch()`, sur les 71 sites** (`cave.js`, `planning.js`, `pilotage.js`,
`reglages.js`, `tracteur.js`, `phyto.js`, `reserve.js`…). Chaque `throw` de `fbSave` devenait donc
une **promesse rejetée non gérée**, captée par le gestionnaire global d'`app.js`, qui la sort en
`logError({level:'error'})` → **toast** `⚠️ Promesse rejetée : …`.

⚠️ **Le `throw` n'était pas une négligence : il était délibéré.** Le commentaire d'origine le dit —
*« On relance quand même l'erreur pour que `saveData` n'affiche pas un faux "enregistré ✓" »*.
Il protégeait contre un mensonge **vert** (« c'est enregistré ») au prix d'un mensonge **rouge**
(« c'est en panne »), sur **71 sites au lieu d'un seul**. *Une garde posée au mauvais étage
protège un appelant et en punit soixante-dix.*

**Reproduit en Node avant de toucher au code** : appelant nu + `throw` → 1 `unhandledRejection`,
et la file contient bien la donnée. Correctif → 0. **Le banc rougissait avant de verdir.**

### 68c. Le contrat, reposé un étage plus bas

`fbSave` **ne rejette plus jamais**. Elle rend un **état** :

| retour | situation |
|---|---|
| `{ ok:true }` | écrit dans Firestore |
| `{ ok:true, local:true }` | démo (`domaine-dupont`) — rien n'est écrit, c'est voulu |
| `{ ok:false, queued:true }` | réseau : mis en file, renvoyé automatiquement |
| `{ ok:false, denied:true }` | refusé par les règles (SEC-1 — **jamais mis en file**, poison pill) |
| `{ ok:false, blocked:true }` | refusé par la garde anti-écrasement (#wipe) |

★★ **Supprimer un `throw` déplace une responsabilité — il faut la reposer quelque part.**
`_doFbSave` (dans `saveData`, `app.js`) était **le seul appelant qui lisait le retour**. Laissé tel quel, son
`.then(function(){ showToast(toastMsg) })` aurait affiché **« Enregistré ✓ » en vert sur une
écriture partie en file** : exactement le faux positif que le `throw` évitait. Il lit désormais
`r.ok` / `r.queued`, et rend *« Enregistré sur l'appareil — envoi dès le retour du réseau »*.
Sur `denied` / `blocked`, il **se tait** : `fbSave` a déjà posé son propre message, deux toastsse contredisant valent moins qu'un seul.

★ **Ceinture et bretelles** : `_fbSaveMuet()` dans `app.js` pour les appels dont on ne lit pas le
résultat, et **filtre réseau dans `unhandledrejection`** — tout message
(`network-request-failed`, `Failed to fetch`, `Load failed`, `the client is offline`…) part en
`info` au journal et s'affiche **par le badge de synchro**, jamais en code d'erreur. Même patron
que l'exemption `INTERNAL ASSERTION FAILED` déjà en place, et **placé avant elle dans l'ordre de
lecture** — un filtre qui passe après le bandeau rouge ne filtre rien.

### 68d. ★★ Deux mensonges de plus, trouvés en chemin

1. **Le badge disait « Hors ligne » à quelqu'un qui voyait ses quatre barres.**
   `_showOfflineQueueBadge` ne consultait **jamais** `navigator.onLine` : il déduisait « hors
   ligne » de la seule présence d'une file. Or une écriture échoue très bien **en ligne**.
   Il distingue désormais **« Hors ligne »** (coupé) et **« Réseau instable »** (du signal, mais
   l'envoi n'aboutit pas), et dit dans les deux cas que **l'envoi est automatique**.
2. **`level:'warning'` sortait `⚠️ fbSave échoué (3 tentatives): cave_elevage`** — un nom de clé
   Firestore et un compteur de tentatives, en travers de l'écran d'un chef de cave. Passé en
   `info` : **trace conservée** au journal local et dans « Signaler un problème », écran
   silencieux. *Le journal est pour moi, le badge est pour lui.*

⚠️ **Vérifié, pas supposé** : `showSyncBadge` décide de la **persistance** du badge sur des
sous-chaînes (`'Hors ligne'`, `'attente'`). Le nouveau message porte « en attente » → il **reste
affiché** tant que la file n'est pas vide, et le message sans file s'efface à 2,5 s.
**Comportement inchangé, par chance et non par construction** — noter la fragilité.

★ **Le login traduisait déjà ce code depuis toujours** — le `catch` de `confirmLogin` rend
*« Pas de connexion réseau. »*. Le projet savait le dire en français **à un seul endroit** : ce lot étend la
traduction au reste de l'application.

### 68e. ⚠️⚠️ Le harnais s'est trompé dès sa première exécution — piège §53, cinquième fois

`mv-harnais-reseau.mjs` (7 règles, chacune doublée d'une contre-épreuve) est sorti **13 vertes,
1 rouge** au premier lancement. Le rouge n'était pas dans le code livré : **c'était la
contre-épreuve du filtre réseau qui restait verte sur un fichier saboté.**

La règle cherchait `network-request-failed` dans la zone du gestionnaire. Elle le trouvait —
**dans le commentaire que je venais d'écrire trois lignes au-dessus du code** :

```js
//    Le SDK Firebase remonte « Firebase: Error (auth/network-request-failed) » quand le
```

Corrigé par `sansCommentaires()` avant lecture, et par une recherche sur la **forme réelle de
l'instruction** (`if (/…/i.test(_rmsg))`) plutôt que sur une sous-chaîne isolée.
★★★ **C'est le harnais qui a trouvé sa propre faiblesse, parce qu'il portait sa contre-épreuve.**
Sans elle, il aurait été livré vert, inutile, et personne ne l'aurait su.
**Règle générale : un contrôle qui lit du code ne doit jamais lire la prose qui l'accompagne,
sinon il valide le commentaire au lieu de l'instruction.**

### 68f. Le compteur C14, tenu sans regraver la référence

La première version ajoutait **4 `catch {}` vides** dans `app.js` (159 contre 155) : le preflight
a rougi. **La tentation était de regraver la base** — c'est exactement ce que le cliquet interdit.
Réécrit à la place : `_fbSaveMuet` sans `try/catch` (une fonction `async` **ne peut pas lever de
façon synchrone**, il suffit de tester l'existence de `window.fbSave`) et `p.catch(_mvIgnoreRejet)`
au lieu de `p.catch(function(){})` — *le motif C14 attrape aussi les `catch` passés en argument*.
Puis un helper **unique** `_mvHushRejet(e)` pour le `preventDefault`, **partagé avec le bloc
`INTERNAL ASSERTION FAILED` déjà présent** : +1 ici, −1 là-bas, **compteur net inchangé à 155**.

### 68g. Le lot

| Fichier | Ce qui change | Bump |
|---|---|---|
| `src/firebase.js` | contrat de `fbSave` (7 sorties, 0 `throw`) · badge honnête · échec réseau en `info` | — |
| `src/app.js` | `saveData` lit l'état · `_fbSaveMuet` · filtre réseau global · `_mvHushRejet` | ★ SW |
| `src/utils.js` | `APP_VERSION` + 2 entrées `WHATS_NEW` | ★ APP |
| `index.html` | les 4 affichages de version | ★ APP |
| `public/sw.js` | en-tête, `CACHE_NAME`, 2 `console.log`, changelog prépendé | ★ SW |
| `guide/01-demarrer.html` · `guide/14-depannage.html` · `public/guide.html` | §27a — « Pas de réseau » devenait faux | — |
| `scripts/mv-harnais-reseau.mjs` (neuf) · `package.json` | 7 règles + 7 contre-épreuves, dans `check` et `prebuild` | — |

**Vérifié** : `npm run check` **EXIT=0** · preflight **0 erreur**, C14 à sa référence exacte (155)
**sans regravage** · `node --check` sur les 4 JS · `WHATS_NEW` **exécuté en Node** (tête =
`APP_VERSION`, ordre décroissant, zéro doublon, zéro backslash visible, zéro demi-surrogate isolé,
**les 2 noms d'icônes existent dans le sprite**) · `v7.23` subsiste **exactement une fois** dans
`sw.js` (le changelog du lot précédent — piège §7) · guide régénéré, `build-guide.mjs --check` vert
· harnais neuf **14 vertes / 0 rouge**, contre-épreuves comprises.
**`MV_AIDE` / `MV_INFO`** : relus, aucune fiche ne décrit la synchro ni une méthode de calcul
touchée — **rien à changer**, et c'est vérifié, pas supposé.

### 68h. ⚠️ Ce qui reste ouvert

- **`showSyncBadge` décide de la persistance sur des sous-chaînes de message.** Ça tient
  aujourd'hui, mais un futur libellé sans le mot « attente » ferait **disparaître un badge qui
  doit rester**. À convertir en paramètre explicite.
- **Les 71 appels nus subsistent** dans les modules. Ils sont désormais inoffensifs *parce que
  `fbSave` ne rejette plus* — c'est-à-dire que la sûreté repose entièrement sur le contrat. C'est
  ce que `mv-harnais-reseau.mjs` garde.
- **`_attachPdfToOp` et `saveCaveOp` ne remettent pas l'upload PDF en file.** Si c'est
  **l'upload Storage** qui échoue (et non l'écriture Firestore), l'opération n'est pas enregistrée
  du tout et l'overlay reste ouvert — comportement correct, mais le PDF, lui, n'a **aucun filet
  hors ligne**. Un PDF choisi hors réseau est perdu au rechargement.
- **C24c `tracteur.js` : 22 contre 23 en référence** — une amélioration non gravée, antérieure à
  ce lot. À regraver lors d'un lot qui touche `tracteur.js`.
- **« Pas de connexion réseau. »** dans le `catch` de `confirmLogin` souffre du même flou que l'ancien
  badge : on peut avoir du réseau et ne pas passer.

---

## 69. ★★★ LA CONTENANCE DE LA CUVE LUE COMME UN VOLUME DE VIN — LOTS RDT-1/2/3 (28/08 — APP 6.69 → 6.70 · SW 7.24 → 7.25)

> *Nico, capture à l'appui : « faut revoir où sont fait et comment sont faits les calculs, les
> rendements sont beaucoup trop eleve !! »*
> Sur la capture, **Pilotage › Cave › Rendement face au plafond**, millésime 2026 :
> 20 Rangs **117,1 hL/ha** · Au Velle **93,6** · Bollery Blanc **89** · Perrières Jeune **74,5**.
> En Côte de Nuits, 117 hL/ha n'existe pas.

### 69a. La première hypothèse était fausse, et c'est l'audit qui l'a dit

J'ai d'abord accusé la **non-idempotence** du volume de cuve (`_vendCuvAtt` proposait
`volume_hl + add`, `saveVendRec` l'écrivait sans condition → rouvrir une récolte rajoutait son
volume). Le harnais reproduisait bien 118,5 hL/ha à la deuxième sauvegarde. **C'était vrai, mais
ce n'était pas la cause.** Livré `scripts/`… non : livré `mv-audit-rendement.js`, un script de
console en lecture seule, avec une colonne **`ratio saisi/attendu`**. Attendu : 2, 3, 4 — le
nombre de sauvegardes. Obtenu : **2,63 · 2,79 · 2,89 · 1,13**. Pas des entiers.

Les volumes saisis, eux, étaient **60 · 30 · 15 · 5 hL**. Des nombres ronds. Les contenances des
cuves du parc : 6000, 3000, 1500, 500 L.

**★★★ RÈGLE : un ratio non entier tue une hypothèse de comptage double.** Un défaut de
répétition produit des multiples entiers ; un défaut d'unité produit un facteur quelconque. Le
chiffre lui-même dit de quelle famille est la panne — encore faut-il le regarder avant de patcher.

### 69b. La cause : un champ, trois lecteurs, trois définitions

`_vcuvPick` (`cave.js`) — on pique une cuve dans le parc :

```js
el=document.getElementById('vcuv-volume');
if(el && !String(el.value||'').trim()) el.value=_mvF1((parseFloat(p.litres)||0)/100)...
```

`p.litres` est étiqueté **« Contenance (en litres) »** dans le formulaire du parc à cuves, et
affiché sur la fiche de cuvée comme « *X hL de contenance — on remplit rarement à ras* ». Le champ se pré-remplit
donc avec la **capacité**, et personne n'a de raison de le corriger : le nombre est juste.

Ensuite, trois lecteurs :

| lecteur | ce qu'il croit lire | conséquence |
|---|---|---|
| `_cuveCouches` (`cap`) — jauge de remplissage | la **contenance** | correct |
| `_vendCuvAtt` — panneau de rattachement | un **cumul de vin estimé** | écrivait `contenance + add` |
| `_vendVolCuve` → `_mlRendements` | le **volume de vin produit** | ★ le rendement |

Reconstruction exacte de la capture, à la décimale :

```
Au vellé (60 hL) : 20 Rangs 45/123 → 22,0   Au Velle 71/123 → 34,6   7 Rangs 7/123 → 3,4
Bollery (30 hL)  : Bollery Blanc 40/58 → 20,7   Comble 18/58 → 9,3
Perrières (15 hL): P. Jeune 15/28 → 8,0   P. Vieille 13/28 → 7,0
```

Les cuves étaient remplies à ~38 %. Le rendement était donc multiplié par **l'inverse du taux de
remplissage**, et le prorata étalait l'erreur sur **toutes les parcelles de la cuve** — une
parcelle correctement saisie était fausse à cause d'une autre.

**Et les quatre cuves étaient en `mpf`.** Il n'y avait pas une goutte de vin. L'escalier de
sources VD-3 acceptait comme *mesure* le volume d'une cuve **en macération**.

### 69c. ★★★ RDT-1 — un volume de vin n'existe qu'après le décuvage

```js
function _vendVolLoge(cv){
  if(!cv||!cv.decuvage) return 0;
  var v=parseFloat(cv.vol_decuve_hl);
  if(isFinite(v)&&v>0) return v;
  var cu=((typeof CAVE_ELEVAGE!=='undefined'&&CAVE_ELEVAGE.cuvees)||[]).find(...);
  return cu?Math.round(_caveVolL(cu)/100*100)/100:0;
}
```

`_vendVolCuve` lit `_vendVolLoge(cv)` au lieu de `cv.volume_hl`. Sans décuvage, `0` → l'escalier
retombe sur l'estimation au ratio, `statut='estime'`, **fourchette**. `_mlChaine` cesse aussi
d'annoncer la contenance sur ses deux étages (« en cuve » = estimation d'après les caisses,
« décuvé » = volume logé).

**Aucune donnée n'est réécrite.** Les chiffres se corrigent à l'affichage.

### 69d. RDT-2 — le volume mesuré, écrit une fois, au seul moment où il existe

`saveVendDecuvage` écrit `c.vol_decuve_hl = _caveVolL(cuvee)/100` — fûts entonnés + cuves
remplies. **Un champ neuf**, jamais `volume_hl` : la jauge de remplissage en a besoin.

Rattrapage en lecture pour les cuves décuvées avant ce lot (le volume se relit sur la cuvée
d'élevage) — donc rien à ressaisir.

⚠️ **Piège n° 9 du document, rencontré à nouveau** : `saveVendCuve` rebâtit `obj` de zéro.
Sans `vol_decuve_hl:existing?...` , modifier une cuve décuvée l'aurait effacé. `recolte_ids`
était déjà perdu de la même façon — préservé au passage.

### 69e. RDT-3 — le champ devient une contenance, et le cumul meurt

`_vendCuvAtt` ne propose plus `contenance + add`. Ce qui est **déjà dedans** se recalcule depuis
les récoltes à chaque affichage (`_vendCuvCsDom(cuveId, exclId)`) — rien ne s'accumule dans un
champ, **donc rien ne peut doubler**. L'exclusion par `exclId` évite de compter la récolte en
cours d'édition.

Au passage : `_vendDecVolHl()` proposait le nombre de barriques d'après la **contenance** — une
cuve à moitié pleine réclamait deux fois trop de fûts. Elle suit maintenant le volume attendu.
Et `_vendCuveFromRecolte` ne pré-remplit plus la contenance avec `kg/140` : une contenance ne se
déduit pas des kilos rentrés.

### 69f. Pilotage disait net là où Le millésime disait une fourchette

Même donnée, deux écrans, **deux niveaux de certitude**. Celui qui affiche le chiffre net gagne
la confiance, et c'est le mauvais. `_pcavRdtTxt` aligne Pilotage sur Le millésime. Au passage :
un **dépassement ne se constate que sur une mesure** (`over` ne compte plus les estimations,
`overEst` les signale « à confirmer »), et la carte dit enfin qu'elle ne montre que les **dix plus
forts** rendements — un tri décroissant tronqué à 10 sans le dire est une sélection déguisée en
panorama.

### 69g. Le harnais, et ce qu'il prouve

`scripts/mv-harnais-rendement.mjs` — **20 assertions vertes**, `--contre` **2 vertes**.
Les deux contre-épreuves (remettre `volume_hl` comme volume de vin ; retirer la garde de
décuvage) ramènent **exactement 117,1 hL/ha** sur 20 Rangs. La capture de Nico est reproduite au
dixième par le harnais : c'est la meilleure preuve qu'on a compris la panne.

### 69h. Ce que valent vraiment les rendements 2026 de le domaine de référence

| parcelle | affiché avant | après |
|---|---|---|
| 20 Rangs | 117,1 | **44,4** |
| Au Velle | 93,6 | **35,5** |
| Bollery Blanc | 89,0 | **31,9** |
| Perrières Jeune | 74,5 | **25,7** |
| Perrières Vieille | 64,1 | **22,2** |
| 7 Rangs | 51,2 | **19,4** |
| Comble | 31,4 | **11,3** |

Ergot, Champitenois et Combe du Bas étaient déjà justes : aucune cuve rattachée, donc estimation
pure. **Le défaut ne touchait que les parcelles bien renseignées** — plus la saisie était
complète, plus le chiffre était faux. Perversité à retenir.

### 69i. Clôture

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | RDT-1/2/3 — 10 motifs, 15 hunks, zéro ligne collatérale | — |
| `src/pilotage.js` | `_pcavRdtTxt`, `over`/`overEst`, note de bas de carte | — |
| `src/utils.js` | `APP_VERSION`, `WHATS_NEW` (3 entrées), `MV_AIDE.cave` (1 révisé + 1 neuf), `MV_INFO.pil.cav.rdt` (2 paragraphes) | ★ APP |
| `index.html` | les 4 affichages de version · libellé « Volume (hl) » → « Contenance (hL) » | ★ APP |
| `public/sw.js` | en-tête, `CACHE_NAME`, **les 2 `console.log`**, changelog prépendé | ★ SW |
| `guide/08-cave.html` · `public/guide.html` | l'escalier des sources + la contenance | — |
| `scripts/mv-harnais-rendement.mjs` (neuf) | 20 règles + 2 contre-épreuves | — |

**Vérifié** : `node --check` sur les 4 JS · équilibre `{}` `()` `[]` à zéro · aucun demi-surrogate ·
**compte de `catch(` inchangé** (cave 13, pilotage 91) · diff ciblé — **aucune ligne modifiée hors
motif** · `WHATS_NEW` **exécuté en Node** (tête = `APP_VERSION`, 160 blocs, 3 items, zéro backslash
visible, les 2 noms d'icônes — `balance`, `cuve` — existent dans le sprite) · guide régénéré,
`build-guide.mjs --check` vert · harnais **20/20** puis **2/2** en contre-épreuve.

### 69i-bis. ★ Le SW porte sa version à QUATRE endroits, pas deux

En-tête, `CACHE_NAME`, **et les deux `console.log`** (`[SW] Ma Vigne vX.XX installé` / `activé`).
J'ai livré les deux premiers et oublié les deux autres ; **c'est le preflight qui l'a dit**, pas
moi. Un numéro de version écrit à quatre endroits est un numéro qu'on désynchronise — le filet
existe précisément parce que la règle ne tient pas dans une tête.

⚠️ **`v7.24` doit subsister exactement UNE fois** après bump : la ligne de changelog du lot
précédent. Zéro occurrence signifierait qu'on a écrasé l'historique ; deux, qu'un porteur de
version a été oublié.

### 69j. ⚠️ Ce qui reste ouvert

- **Ruchottes** : 600 kg annoncés dans une cuve de 5 hL — ça ne rentre pas. Soit le rattachement
  est faux, soit les 24 caisses ne sont pas toutes là. **Aucun correctif de code ne répare une
  saisie fausse** : à vérifier avec Nico.
- **Combe du Bas** : 84 caisses pour 1008 kg, soit **12 kg la caisse** au lieu de 25 — un `pck`
  client, à confirmer.
- **`volume_hl` reste modifiable depuis le panneau de rattachement.** Le champ est maintenant
  correctement étiqueté, mais rien n'empêche d'y écrire autre chose qu'une contenance. Un jour :
  le rendre lecture seule quand la cuve vient du parc.
- **`_vendVolCuve` ne filtre pas `mine` par millésime.** Sans effet aujourd'hui (les cuves de
  vinification sont créées par millésime), dangereux si une cuve venait à être réutilisée d'une
  année sur l'autre avec le même `id`.
- ⚠️ **Un `cat >> CLAUDE.md <<'EOF'` a mangé un caractère accentué** : le `ê` de « Même » est
  sorti en octet brut `0xAA`, le fichier n'était plus valide en UTF-8, et
  `harnais-claude-md.mjs` rougissait **sans dire pourquoi** (l'exception tombait à la lecture).
  **Toujours relire un fichier en Python après un heredoc** : `open(f,'rb').read().decode('utf-8')`.
  Une exception vaut mieux qu'un octet pourri au milieu du document.
- **`mv-audit-rendement.js` n'est pas dans le dépôt** — script de console, livré hors build. À y
  mettre s'il resert.

---

## 70. ★★ CUV-1 — CORRIGER UN RELEVÉ, ET DIRE COMMENT LE FROID A ÉTÉ FAIT (30/08)

**La demande de Nico**, en deux morceaux : pouvoir corriger une mesure déjà validée (la date, la
densité), et pouvoir noter **par quel moyen** un refroidissement a été fait — glace carbonique,
groupe de froid, azote liquide.

### 70a. Ce que le code disait avant d'écrire une ligne

- `saveVendMesure` faisait **toujours** un `push`. `openOvVendMesure(cuveId)` ne connaissait aucun
  id de mesure et **vidait** le formulaire à chaque ouverture. Ni correction, ni suppression.
- ⚠️ **Et surtout : aucune liste des relevés à l'écran.** Seulement le graphe, le dernier chiffre en
  bandeau, et le tableau du document imprimable (`_cuvDoc`). **Le lot ne commençait donc pas par
  poser un crayon, il commençait par ouvrir une porte qui n'existait pas.**
- `saveVendOp` : même chose. `_vendOpsSummary` affichait la dernière opération et « +N autres »,
  **sans aucun moyen d'atteindre ces N autres**.
- `refroidissement` / `rechauffement` existaient dans `_VEND_OPS` mais ne stockaient que `temp_c`,
  la **cible**. Aucun moyen, aucune quantité — donc rien à donner au registre.

### 70b. ★★★ LE VRAI DANGER DU LOT : L'ORDRE DU TABLEAU PRIS POUR L'ORDRE DU TEMPS

`mesures_fa` était lu **partout** comme s'il était rangé : `_vendLastMes` et `_vendStale`
(`m[m.length-1]`), `_vendSparkline` (l'axe des x est l'**index**, pas la date), `_mlProjFA`
(`m.slice(-3)` pour la pente et la projection de fin de FA), `_mlAMesurer`, `_mlAgenda` (l'alerte
température). **Rien ne le rangeait jamais**, et la saisie a toujours accepté n'importe quelle date.

⚠️ **Ce n'est donc pas un défaut introduit par la correction : il était déjà là.** Un seul relevé de
rattrapage — le carnet resté au cuvier, saisi le lendemain — suffisait à faire mentir la jauge, la
courbe, la date de fin estimée et les alertes. **Autoriser la correction d'une date sans trier
aurait transformé un piège rare en piège quotidien.**

Le tri (`_vendTriDate` / `_vendTriMes` / `_vendTriOps`) est appliqué **à l'enregistrement ET à la
lecture**. La lecture n'est pas du zèle : c'est ce qui **répare les tableaux déjà désordonnés** chez
les clients, sans migration ni backfill. `_vendTriMes` pose au passage un `id` aux relevés qui n'en
ont pas — sans id, une ligne n'est pas corrigeable.

★ **Leçon générale, à ressortir avant tout lot d'édition : rendre une donnée MODIFIABLE, c'est
d'abord vérifier que tout ce qui la LIT supporte qu'elle change.** Le travail n'est pas dans le
formulaire, il est chez les lecteurs.

### 70c. ★★ La saignée est la seule opération qui MUTE la cuve

`saveVendOp` retranchait le volume saigné à `c.volume_hl` **à la création**. Corriger une saignée de
6 à 10 hL sans rien faire d'autre aurait donné 34 − 10 = **24 hL** au lieu de 40 − 10 = 30.
Supprimer une saignée aurait laissé les hL dans le trou pour toujours.

**Règle gravée : on REND l'ancien volume avant d'appliquer le nouveau** — à la correction, à la
suppression, **et quand le type change** (une saignée requalifiée en délestage doit rendre ses hL).
★ **Même famille que RDT-1/2/3** : un volume faux dans une cuve, c'est un rendement faux à l'hectare.

### 70d. Le froid, et ce qu'on refuse de chiffrer

Deux tables, parce que réchauffer et refroidir n'ont pas les mêmes moyens :

| `_VEND_FROID` | `_VEND_CHAUD` |
|---|---|
| groupe de froid · échangeur · **glace carbonique** · **azote liquide** · **CO₂ liquide** · eau froide · autre | ceinture chauffante · échangeur · thermoplongeur · remontage à chaud · autre |

`_vendMoyKg` dit lesquels **se pèsent** : les trois en gras, et eux seuls, ouvrent un champ en kg.

★★ **Ce qui n'est PAS chiffré, et pourquoi.** Pour la **carboglace** seule, l'abaissement est
annoncé : ~571 kJ/kg de sublimation contre ~407 kJ par degré et par hL de moût, soit **~1,4 °C par
kg et par hL** — un ordre de grandeur stable, connu du métier, et **présenté comme tel** (« la cuve
n'est pas isolée, le résultat dépend de la répartition »). Pour l'**azote** et le **CO₂ liquide**,
le rendement dépend trop du matériel : **aucun chiffre n'est inventé**, la quantité est simplement
enregistrée. *Un chiffre juste mais mal compris vaut un chiffre faux ; un chiffre douteux, pire.*

**Le moyen et la quantité remontent seuls au registre des manipulations** via `_rmDetail` —
`RM_TYPES` classait déjà `refroidissement` en `pratique`. C'est précisément ce qu'un contrôle
cherche : pas la température visée, mais l'**intrant**.

### 70e. Le harnais

`scripts/mv-harnais-cuvier-correction.mjs` — **38 assertions vertes**, `--contre` **4 vertes**.
Méthode C20 : fonctions extraites de `src/cave.js` et **exécutées**, bouchons minimaux, aucune
formule recopiée. `document.getElementById` rend des nœuds **persistants** — sans cela, la fonction
qui écrit et le test qui relit ne parlent pas du même objet, et le test passe sur du vide.

⚠️ **Deux pièges d'écriture du harnais, tous deux vécus dans la même heure :**
1. `^var NOM\s*=[\s\S]*?;$` **avale tout** quand le point-virgule n'est pas en fin de ligne
   (`var _ML_D20_SEC = 996;  // commentaire`). **Équilibrer les crochets et s'arrêter au premier
   `;` de niveau zéro**, jamais une regex gourmande.
2. Une assertion a rougi sur la densité corrigée : **c'était l'assertion qui était fausse**
   (1010 brut à 26 °C fait 1012 à 20 °C, pas 1013). ★ **Réflexe : demander d'abord si c'est
   l'attente qui se trompe, pas le code.**

Les quatre contre-épreuves (tri retiré · restitution du volume saigné retirée · moyen retiré du
registre · correction repassée en `push`) **rougissent toutes** — dont C2 qui ramène exactement les
24 hL.

### 70f. Clôture

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | tri chronologique · historique des relevés · correction/suppression de relevé et d'opération · moyens de froid · restitution du volume saigné · `_rmDetail` | — |
| `scripts/mv-harnais-cuvier-correction.mjs` (neuf) | 38 règles + 4 contre-épreuves | — |

★★ **AUCUN BUMP — et c'est la règle, pas un oubli.** `cave.js` seul ne bumpe rien. **Mais le lot est
très visible du client** : le prochain bump devra l'annoncer dans son `WHATS_NEW` (§7, « quand un lot
visible part sans bump, le prochain bump l'annonce »).

⚠️ **Le bouton « Supprimer ce relevé » est injecté en JS** dans `#ovVendMesure .modal-body`
(`_vmInjectActions`), sur le patron de `_vendInjectClientField`. **C'est ce qui garde `index.html`
intact, donc le SW aussi.** Le conteneur est retrouvé par `getElementById('vm-actions')` et créé une
seule fois — pas de sélecteur dépendant d'un texte de bouton.

**Vérifié** : `node --check --input-type=module` · `catch(){}` vides **3 → 3** · balance `<div>`
**−2 → −2** (le déséquilibre préexistant de `cave.js` est **préservé**, §20) · handlers
`onclick/onchange/oninput` non exposés : **`closeOv` seul**, la globale d'`app.js` ·
`node scripts/preflight.mjs` **0 erreur**, identique à la base · `npm run check` **36/36** ·
harnais `cuvdoc` 46, `rendement` 20/20, `releve` 96, `vendange-parts` 134, `icones` 28 — tous verts.

⚠️ **Deux cliquets ont mordu pendant le lot, et ils avaient raison :**
- **C24b** : les nouveaux `onclick="openOvVendMesure('…','…')"` posaient des ids dans un slot JS
  **sans `_escAttr`** → 36 contre 32. Corrigé à l'interpolation.
- **Cliquet des graisses** (`mv-harnais-jetons`, 147 → 148) : ma règle CSS **redéclarait** un
  `font-weight:400` déjà présent. ★ **Fusionner le sélecteur dans la règle existante**
  (`.mvv-opslist .u,.mvv-histwrap>summary .u`) plutôt qu'ajouter un pas de plus à l'échelle.

### 70g. ⚠️ Ce qui reste ouvert

- ~~Le guide n'est pas à jour de ce lot.~~ **Fait en 70h**, dans la foulée.
- **`_cuvDoc` n'affiche pas encore le moyen dans le tableau des opérations** — il passe par
  `_rmDetail`, donc il l'a **déjà** ; à vérifier sur un vrai document imprimé avant de conclure.
- **La note de dégustation reste une ligne de texte libre.** Correcte, mais elle ne se cherche pas.
- **`_vendSparkline` indexe toujours par position**, pas par date : deux relevés à trois jours
  d'écart sont dessinés à la même distance que deux relevés du même jour. Sans effet sur la
  justesse depuis le tri, mais la courbe reste **déformée dans le temps**. `_vendFermSvg` (≥ 3
  relevés) est correct, lui.

### 70h. ★★ L'ACCOMPAGNEMENT, ET LE BUMP QU'IL ENTRAÎNE (30/08, même journée)

**Règle n°1 du chapitre accompagnement : un lot qui change un écran met à jour `MV_AIDE`, la source
du guide et `_mvtSteps` DANS LE MÊME LOT.** CUV-1 est parti sans — `cave.js` seul, aucun bump. Le
lot n'était donc **pas fini**, et §70g le disait. Voici la fermeture.

★★ **La conséquence mécanique, qu'il faut voir venir : `MV_AIDE` vit dans `utils.js`.** Toucher
l'accompagnement d'un lot « sans bump » **déclenche le bump** — APP **6.70 → 6.71**, SW
**7.25 → 7.26**. Ce n'est pas un effet de bord regrettable, **c'est l'occasion prévue par §7** :
« quand un lot visible part sans bump, le prochain bump l'annonce ». CUV-1 est donc annoncé dans le
`WHATS_NEW` **6.71**, en quatre entrées, du point de vue du vigneron.

⚠️ **`utils.js` mélange DEUX conventions d'écriture, et l'ancre échoue si on se trompe :**
`WHATS_NEW` est en **échappements** (`\u00e9`), `MV_AIDE` en **caractères littéraux** (`é`).
Mon ancre `MV_AIDE` écrite en `\u…` a rendu **zéro occurrence**. ★ **Extraire l'ancre du fichier
réel avec `repr()`** — la règle existait déjà, elle vient de resservir.

**`_mvtSteps` : rien à changer, et c'est VÉRIFIÉ, pas supposé.** La visite guidée passe par
`#mvc-elevage` (Le Chai) et `#ml-body` / `#cave-view-mil` (Le millésime). **Aucune étape ne cible
l'écran des cuves** — `#mvv-body` n'apparaît dans `app.js` que dans les **squelettes de
chargement**, pas dans la visite. (Le « 15ᵉ moment, Cave » reste au backlog ; ce n'est pas ce lot.)

**Guide** : `guide/08-cave.html` prend deux puces dans la carte Cuvier (corriger un relevé ·
corriger une opération, saignée comprise) et **deux notes** — l'une sur les moyens de refroidissement,
l'autre sur le rangement par date. Puis `node scripts/build-guide.mjs`, **qui n'est pas dans le
pipeline** : sans lui, `public/guide.html` part périmé. `--check` vert, 15 sections.

### 70i. Clôture du lot complet

| fichier | ce qui change | bump |
|---|---|---|
| `src/cave.js` | CUV-1 (§70a–70d) | — |
| `scripts/mv-harnais-cuvier-correction.mjs` (neuf) | 38 règles + 4 contre-épreuves | — |
| `src/utils.js` | `APP_VERSION` · `WHATS_NEW` (bloc 6.71, 4 items) · `MV_AIDE.cave` (3 points neufs) | ★ APP |
| `index.html` | les **4** affichages de version | ★ APP |
| `public/sw.js` | en-tête · `CACHE_NAME` · les **2** `console.log` · changelog prépendé | ★ SW |
| `guide/08-cave.html` · `public/guide.html` | 2 puces + 2 notes, guide régénéré | — |

**Vérifié** : `node --check` sur `cave.js` et `utils.js` · `v7.25` subsiste **exactement 1 fois**
(la ligne de changelog d'avant), `v7.26` **exactement 5** · aucun `6.70` résiduel dans `index.html` ·
`WHATS_NEW` **exécuté en Node** — 161 blocs, tête = `APP_VERSION`, ordre strictement décroissant,
zéro doublon, zéro backslash visible, zéro demi-surrogate isolé, les 3 icônes (`crayon`,
`thermometre`, `cuve`) existent au sprite · `_whatsNewSince` joué sur les **quatre** cas
(précédente → 1 bloc · ancienne → 4 · courante → 0 · future → 0) · `npm run check` **code de sortie
0** · **`npm run build` vert** (37 modules, précache 2 assets) · harnais CUV-1 **38/38** puis
**4/4**.

⚠️ **`npm run test:smoke` et `test:e2e` N'ONT PAS PU TOURNER ICI** : Playwright télécharge son
navigateur depuis `cdn.playwright.dev`, **hors liste blanche du bac à sable** (403 « Host not in
allowlist »). Ce n'est pas un vert, ce n'est pas un rouge — **c'est un contrôle non joué**, à faire
côté Nico. ★ **Le dire vaut mieux que le passer sous silence** : un harnais qu'on n'a pas lancé ne
prouve rien, exactement comme un harnais qui ne peut pas rougir.

★ **Deux dépendances de bac à sable, notées une fois pour toutes** : `npm ci --ignore-scripts` passe
(registry.npmjs.org est autorisé), `vite build` passe, **Playwright non**.

---

## 71. ★★★ INTR-1 — LES ADJONCTIONS DE CUVERIE, ET LE GARDE-FOU QU'IL NE FALLAIT PAS ÉCRIRE (30/08 — APP 6.71 → 6.72 · SW 7.26 → 7.27)

**La demande**, transmise par Nico depuis un client : pouvoir enregistrer des opérations de cuverie
pendant les vinifications — **bentonite, tanins, enzymes** — parce que ce n'était pas présent.

### 71a. La première lecture était fausse, et c'est la leçon d'ouverture

Le premier diagnostic a visé `CAVE_ELEVAGE.operations` et ses cinq types (ouillage, soutirage,
soufre, analyse, autre), en concluant qu'il fallait un tableau `intrants[]` neuf sur la cuve. **Les
deux conclusions étaient fausses**, pour une seule raison : le dépôt cloné datait d'avant le lot
CUV-1. `_VEND_OPS` existait déjà avec huit types, dont `levurage` et `nutriment`.

★★ **Une analyse d'architecture sur un fichier périmé produit une architecture périmée** — et elle
est d'autant plus dangereuse qu'elle est cohérente. Rien dans le raisonnement ne sonnait faux ; seul
le `git pull` l'a arrêté. **Relire les fichiers n'est pas une politesse de début de session, c'est la
condition de validité de tout ce qui suit.**

### 71b. Ce que le code disait avant d'écrire une ligne

- `_VEND_OPS` portait 8 types. Trois entrées à ajouter, pas un tableau.
- `levurage` et `nutriment` portent un **texte libre** (`souche`, `ntype`). C'est précisément
  pourquoi ils ne sortent d'aucun stock : un nom tapé à la main ne se rapproche d'une fiche produit
  qu'à l'orthographe près. Les trois nouveaux prennent donc un `prod_id` de La Réserve.
- `_conso(p)` (reserve.js) dérive les sorties, **ne les stocke jamais** : `registre` (phyto),
  `manual`, `cave_so2`. Un intrant qui « sort du stock » n'écrit donc rien — il se laisse compter.
- La catégorie `oeno` existait déjà, et `_CAT2ATE` la range dans l'atelier Cave. La boucle achat →
  stock → usage → coût d'atelier était **déjà câblée** : il manquait le maillon du milieu.

### 71c. ★★★ LE CŒUR DU LOT : LE GARDE-FOU QU'IL NE FALLAIT PAS ÉCRIRE

Le réflexe, en branchant une sortie sur un stock, est d'écrire :

```js
if(dose > stock){ showToast('Stock insuffisant'); return; }
```

Ce garde-fou refuserait d'enregistrer un tanin **déjà dans la cuve** parce qu'une facture n'est pas
saisie. Il **ferait mentir le suivi pour protéger la comptabilité** — l'inverse exact de la règle
maison « source absente ⇒ tiret, jamais zéro ».

★★ **Vérifié avant de décider** : La Réserve savait déjà accueillir le négatif. `_rsvIntrantsHtml`
filtre `s.known && s.q < 0`, sort un bandeau, passe le chiffre en `--rouge`, colle un badge
**⚠ écart** au lieu de **✓ cohérent**, et le bilan matière imprimé écrit `ecart`. Aucun
`Math.max(0, …)` sur la quantité. **Le geste du lot n'était donc pas d'ajouter quelque chose, c'était
de ne pas écrire une ligne.** La contre-épreuve C10 réintroduit ce garde-fou et vérifie qu'il serait
détecté — un défaut d'omission se garde par une sonde de texte, pas par un test fonctionnel.

### 71d. Le volume porte sa source — RDT-1 rejoué à l'identique

La quantité d'un intrant se calcule sur un volume, et `c.volume_hl` est la **contenance** de la
cuve, pas son contenu. C'est mot pour mot la faute §69. Une dose juste sur un volume faux donne une
quantité fausse, **affichée avec l'aplomb d'un calcul**.

`_vendIntrVol(c)` rend `{hl, src}` : `mesure` si `_vendVolLoge` renvoie un volume décuvé, `estime`
sinon. Un troisième état `saisi` **se déduit** en comparant la case au repère — jamais demandé.
⚠️ **Une source qu'on demande peut être contredite par le chiffre d'à côté ; une source qui se
déduit ne le peut pas.** L'écran écrit « volume estimé », `_rmDetail` imprime « (estimé) ».

### 71e. ⚠️ LE DÉFAUT LATENT QUE CE LOT RÉVEILLE : `cave_so2` NE FILTRE PAS

`_conso` avec `cave_so2` additionne **tout** le SO₂ du chai sans regarder de quel produit il s'agit.
Tant qu'un seul produit œno portait cette source, le raccourci tenait. Avec quatre produits au
catalogue, il aurait attribué **la totalité du soufre à chacun**.

Traité par **contournement, pas par migration** : la nouvelle source `cuvier` filtre sur
`o.prod_id === pid`, et `_rsvNpCatChange` fait partir les nouveaux produits `oeno` en `cuvier` au
lieu de `cave_so2`. Les fiches déjà créées ne bougent pas. ★ **Changer un défaut par le défaut est
un lot à part entière ; changer le défaut par défaut ne coûte rien et n'ouvre aucun backfill.**

### 71f. La troisième cause d'un écart

Un écart sur un produit œno a maintenant **trois** causes, pas deux : facture manquante, consommé
surestimé, **ou volume estimé trop haut**. Sans la troisième nommée, on cherche une facture qui
n'existe pas. `_consoCuvierEstime(pid)` compte les adjonctions concernées et l'alerte les annonce.

### 71g. Livré

| Fichier | Ce qui change |
| --- | --- |
| `src/cave.js` | `_VEND_OPS` +3 · bloc `_vendIntr*` · branche de saisie, d'écriture et de détail · `RM_TYPES` +3 · `_rmDetail` |
| `src/reserve.js` | source `cuvier` · `_consoCuvier` · `_consoCuvierEstime` · `_rsvStockPour` · `_rsvNegEstime` · défaut `oeno` · option du `<select>` |
| `src/utils.js` | APP 6.72 · `WHATS_NEW` préfixé (3 items) · `MV_AIDE` Cave +3 points · `MV_AIDE` Réserve reformulé |
| `index.html` | les 4 emplacements de version |
| `public/sw.js` | v7.27 — entête, `CACHE_NAME`, 2 `console.log` |
| `guide/08-cave.html`, `guide/09-reserve.html` | 5 encadrés · `public/guide.html` régénéré |
| `scripts/mv-harnais-intrants.mjs` | **neuf** — 60 assertions, 10 contre-épreuves. Branché dans `check` et `prebuild`. |
| `scripts/mv-harnais-agenda.mjs` | **neuf** — 31 assertions, 6 contre-épreuves. Couvre `_mlOuillages`, `_mlVolParFut`, `_mlAgenda`. |
| `package.json` | les deux harnais dans `check` et `prebuild` |

`_mvtSteps` **n'a pas bougé, et c'est un choix vérifié** : sa scène Cave parle du Chai et du
millésime, elle n'énumère aucune opération de cuverie. La règle d'accompagnement dit « dire vrai »,
pas « toucher les trois fichiers à chaque fois ».

⚠️ **Non joué de mon côté** : `npm run test:smoke` et `npm run test:e2e` (Playwright indisponible en
bac à sable). `npm run check` passe.

### 71g-bis. ⚠️⚠️ LE LOT A DÛ ÊTRE REBÂTI : UN PUSH A ANNULÉ CUV-1

Entre la livraison et l'intégration, Nico a poussé `dfb88c4 « Update cave.js »` : **56 insertions,
299 suppressions**. Vérifié, pas supposé — le `cave.js` poussé est **identique à une ligne près** au
`cave.js` d'avant CUV-1 (`git show 6732441:src/cave.js`). Tout le lot 70 avait disparu :
`_vendTriDate`, `_vendTriMes`, `_vendTriOps`, `_vendMesHist`, `_vendMesDel`, `_vendOpDel`,
`_VEND_FROID`, `_VEND_CHAUD`, `_vendMoyKg`, `_vmesureEditId`, `_vendOpEditId` — zéro occurrence.

**La cause n'est pas une décision, c'est une copie locale périmée** : la vraie modification tenait en
une ligne, et elle a été faite sur un fichier antérieur au lot précédent.

★★★ **LA RÈGLE QUI EN SORT.** Le dépôt n'est pas une sauvegarde, c'est une **source unique**.
Modifier un fichier livré la veille impose de repartir du fichier du dépôt, jamais d'un exemplaire
gardé sur le poste. Le symptôme est silencieux : le push réussit, rien ne rougit, et ce sont
`WHATS_NEW`, `MV_AIDE` et le guide qui se mettent à **promettre des écrans qui n'existent plus**.
⚠️ Le contrôle qui l'a attrapé n'est aucun harnais : c'est le `git pull` avant réintégration, et la
comparaison du fichier reçu avec les commits antérieurs.

**Ce qui a été fait** : `cave.js` rebâti sur la base CUV-1 (`73a5e47`), le correctif de Nico reporté
dessus, puis les huit motifs INTR-1 réappliqués — leurs blocs **extraits du fichier v1 déjà livré**,
jamais retapés. Le fichier final ne diffère de la v1 que par le correctif ci-dessous.

### 71g-ter. ★★ LE CORRECTIF DE NICO : `futs` N'ÉTAIT DÉCLARÉ NULLE PART

Dans `_mlOuillages`, la boucle poussait `{futs:futs, litres:Math.round(futs*…)}` alors que **`futs`
n'existe pas dans la portée**. Le seul `var futs` du fichier (ligne ~680) est le local d'une autre
fonction.

**Prouvé par exécution**, pas par lecture : la fonction extraite et appelée avec une cuvée ouillable
lève `ReferenceError: futs is not defined`. Elle emportait donc **tout l'agenda du millésime** dès la
première cuvée. ⚠️ **Le défaut est antérieur à CUV-1** — il était déjà dans le `cave.js` de 6.70,
donc **en production chez les deux clients** depuis au moins ce lot.

Le correctif est `var garde=0, futs=_caveNbTonneaux(c);`. Il part avec INTR-1.

⚠️ **Aucun harnais ne couvrait `_mlOuillages`** — vérifié : `grep -l _mlOuillages scripts/*.mjs`
sortait vide. Un `ReferenceError` sur une variable jamais déclarée est exactement ce qu'un harnais
fonctionnel attrape en une assertion, et ce qu'aucune relecture n'attrape : **le code se lit très
bien**. C'est le seul défaut de la série §69–§71 qu'aucune sonde n'aurait pu voir.

★ **Le trou est bouché dans le même lot** : `scripts/mv-harnais-agenda.mjs`, **31 assertions,
6 contre-épreuves**, branché dans `check` et `prebuild`. La C1 réintroduit exactement le défaut du
30/08. Il grave quatre règles de la chaîne d'ouillage :

1. **`futs` et `seuil` se calculent DANS la boucle**, par cuvée. Sortis de la boucle, toute la cave
   prend le compte de fûts et la cadence de la première — et rien ne le signale.
2. Une cuvée qui ne s'ouille pas (inox, béton) n'entre pas à l'agenda ; **un foudre bois, si**. Le
   filtre est `_caveOuille`, jamais `_caveNbTonneaux` — qui n'est juste sur l'inox que par accident.
3. **Jamais ouillée = due aujourd'hui**, marquée `jamais:true`, et **sans retard inventé** : il n'y a
   pas de précédent à comparer.
4. L'ordre d'affichage ne s'écrit **jamais** `(ordre[k]||9)` : `alerte` vaut `0`, et `0||9` rend `9`.
   L'alerte de température passerait sous les ouillages. C'est la règle « `(table[k] || défaut)` est
   interdit quand `table[k]` peut valoir 0 », appliquée à un tri.

### 71h. Ce qui reste ouvert

- **Levurage et nutriment gardent leur texte libre.** Les basculer sur La Réserve fermerait
  entièrement la boucle œno, mais c'est une migration de données : hors périmètre de ce lot.
- **La lecture des rapports d'analyse labo.** Tranché en conversation : route **déterministe**,
  `pdf.js` côté navigateur sur la couche texte du PDF, un gabarit par laboratoire, testable au
  harnais. Pas d'IA, donc pas de sous-traitant à déclarer en Annexe 3 du DPA, pas de transfert hors
  UE, aucun coût, et ça marche hors ligne. Ce qui n'a pas de couche texte retombe sur la saisie
  manuelle — le comportement d'aujourd'hui, donc aucune régression.
  ⚠️⚠️ **Piège de build vérifié** : `inject-precache.mjs` ratisse *tout* `dist/assets` et le précache
  est **atomique**. Un chunk `pdf.js` (~350 ko) partirait dans le précache de chaque client à chaque
  bump, sur la 4G de la cave (§68). **Il faudra l'exclure par motif** et le laisser se mettre en
  cache au premier usage.

## 72. ★★★ CUV-2 + FUS-1 — RETROUVER UNE CUVE, ET EN FUSIONNER PLUSIEURS (31/08 — APP 6.72 → 6.73 · SW 7.27 → 7.28)

Demande de Nico, en deux temps : d'abord « dans le cuvier, j'ai besoin de pouvoir fusionner
plusieurs vins qui sont dans plusieurs cuves différentes », puis, la maquette validée, « peux-tu
aussi améliorer l'affichage du cuvier ? je trouve qu'il est difficile de trouver les cuves ».

Les deux touchent `renderVendCuves`. **Un seul lot** : les séparer aurait imposé de repatcher la
même fonction deux fois.

### 72a. ★★★ LE DIAGNOSTIC, MESURÉ AVANT D'ÊTRE EXPLIQUÉ

Deux causes indépendantes, et la seconde est la pire.

**Tout arrivait ouvert.** Une cuve en fermentation occupait **~726 px** : le graphe
densité/température en fait **232 à lui seul**, et il s'affiche dès le 3ᵉ relevé — donc sur toutes
les cuves au bout de trois jours. La zone de liste d'un téléphone fait **~520 px** : *une* cuve n'y
tenait pas en entier, et douze cuves demandaient **17 hauteurs d'écran**. C'est le défaut du
Pilotage de §34, rejoué sur un autre écran.

⚠️⚠️⚠️ **ET L'ORDRE N'ÉTAIT PAS STABLE.** Le tri se faisait sur `_vendStale`, donc **mesurer une
cuve la renvoyait en bas de la liste**. L'ordre changeait tous les jours : aucune mémoire spatiale
possible. C'est ça, « difficile de trouver les cuves » — pas la longueur, l'instabilité.

**Le tri par défaut devient le repère de cuverie**, lu dans `CONFIG.cave.cuves[].nom` — jamais une
numérotation inventée. C'est ce qui est écrit sur la cuve, dans l'ordre où l'on marche dans la cave.
⚠️ `localeCompare(…, {numeric:true})` est **obligatoire** : sans lui, « Cuve 10 » se range entre
« Cuve 1 » et « Cuve 2 ». Contre-épreuve dans le harnais.
L'urgence ne décide plus de la place : elle est dans le bandeau et la pastille de l'onglet, où elle
était déjà — et où elle se voit mieux.

Le reste : ligne fermée **~68 px**, détail **construit uniquement pour la cuve ouverte**, recherche
dès 6 cuves, 5 filtres comptés, 3 tris, vue liste ou **plan de cuverie** (vignettes avec niveau et
couleur d'état). Le graphe de remplissage par parcelle passe **replié** : il répond à « la récolte de
demain peut-elle partir ? », pas à « où est ma cuve ? ».

### 72b. ★★★ LA FUSION EST PRESQUE GRATUITE, ET VOICI POURQUOI

**Le contenu d'une cuve n'est pas rangé dans la cuve.** Il se déduit des récoltes, via
`recoltes[].cuve_id` — `_vendCuvCsDom` recalcule à chaque appel. **Fusionner, c'est rebrancher les
récoltes.** Kilos, caisses, hL estimés, prorata par parcelle, rendements, parcours du millésime et
bilan de campagne suivent **sans une ligne de calcul en plus**, et rien ne peut compter double.

Les cuves absorbées passent `statut:'termine'` + champ `fusion:{vers,vers_nom,date}`. Ce choix évite
d'inventer un statut neuf, et **les 6 filtres de statut du Cuvier font alors exactement ce qu'il
faut sans être touchés** :

| Filtre | Effet obtenu |
|---|---|
| `_caveCuveOcc` (l. ~186) | `'termine'` → la cuve physique **se libère** |
| `renderVendCuves` | elle sort des actives |
| `_mlChaine` (l. ~8192/94) | plus aucune récolte → **elle n'est même plus dans la liste** |
| `_vendVolLoge` | pas de `decuvage` → rend **0**, zéro double compte |

⚠️ Les absorbées **lâchent leur `cuve_ref`** (`c.cuve_ref=null`) : c'est ce geste, et lui seul, qui
libère la cuve dans le parc.
⚠️ La destination peut être une cuve **libre du parc** : la première cuve choisie devient alors la
porteuse et son `cuve_ref` bascule. **On ne crée jamais d'objet cuve neuf** — il faudrait recopier
mesures et opérations, et une copie se désynchronise.
⚠️ Une cuve qui a absorbé les autres **le dit** dans son détail : les relevés antérieurs à la date
d'assemblage portent sur un autre volume. Le taire ferait lire la courbe comme si rien n'avait changé.
⚠️ Le volume affiché vient des **caisses**, jamais de `volume_hl` (la contenance) — c'est §69 qui se
rejouerait à l'identique. Contre-épreuve dédiée.

**Le registre** reçoit un type `assemblage` (famille *pratique*), posé sur la porteuse, avec les noms
d'origine et le volume marqué `estime`.

⚠️⚠️ **`saveVendCuve` rebâtit son objet de zéro** : `fusion` et `fusion_src` y ont été **re-inclus
explicitement**, sinon rouvrir la fiche d'une cuve fusionnée les effacerait en silence. Piège
récurrent du projet (§53, §71).

### 72c. ⚠️⚠️ TROIS DÉFAUTS QUE LE TRAVAIL A TROUVÉS — ET CE QUI LES A TROUVÉS

**1. Une fonction qui n'existe pas.** `_recKgHl0`, appelée dans un calcul par ailleurs **mort**
(variable `kg` jamais lue). `node --check` **ne voit pas un identifiant inconnu** : seule
l'exécution l'aurait levé, en pleine cave. Trouvée par le **grep systématique des fonctions
appelées** contre celles qui existent. Troisième occurrence de ce piège — le grep doit être un
réflexe après chaque patch, pas une idée.

**2. Une assertion qui ne traversait pas sa garde.** `Z1` prétendait tester
`!_vendEstFusionnee(c)` dans `_vendFusCuves`, alors que `statut!=='termine'` suffisait déjà à
exclure la cuve. **La contre-épreuve est restée VERTE sur un fichier saboté.** C'est la
contre-épreuve, pas le harnais, qui l'a révélé. `Z2` pose le cas que la garde existe réellement pour
attraper : une donnée abîmée, fusionnée mais restée en FA.
★ **La leçon** : un harnais tout vert du premier coup n'est pas une bonne nouvelle, c'est un signal.

**3. Le nouvel écran avait perdu trois informations, en silence.** Le contrôle de joignabilité du
preflight a signalé quatre fonctions sans appelant. Trois portaient une information supprimée sans
que rien ne rougisse ni ne plante : `_vendStepper` (la frise du parcours), `_vendTempCls` (la
couleur de la température — une cuve à 31 °C doit **se voir**, pas seulement s'écrire),
`_vendDegrePot` (le degré potentiel restant). **Rebranchées dans le détail déplié.** Seule
`_vendActRow` était réellement remplacée : supprimée.
★ **La leçon** : refondre un écran, c'est risquer de perdre ce qu'il disait. C15 n'est pas un
contrôle de propreté, c'est un **détecteur de perte de fonctionnalité**.

### 72d. ★★ « RIEN NE DOIT SE CHEVAUCHER » — CE QUI EST TENU, ET CE QUI NE L'EST PAS

Consigne explicite de Nico. `scripts/mv-harnais-alignement.mjs` (43 assertions, 7 contre-épreuves)
vérifie les **quatre règles CSS dont l'absence *cause* un chevauchement** :

1. **`min-width:0`** sur *chaque* conteneur flex portant du texte variable. Sans lui, un flex-item
   refuse de descendre sous la largeur de son contenu : un nom long **pousse ses voisins hors de la
   carte**. Cause n°1 des débordements en flex, et invisible tant qu'on teste avec des noms courts.
2. **Le trio `nowrap` + `overflow:hidden` + `text-overflow:ellipsis`**, les trois ou aucun.
3. **`flex-shrink:0`** sur les colonnes de droite et les pastilles.
4. **Aucune `height` fixe sur un bloc de texte.** Le plan de cuverie utilise `-webkit-line-clamp`,
   pas une hauteur qui trancherait un nom au milieu d'une lettre.

⚠️⚠️ **CE HARNAIS NE MESURE AUCUN PIXEL.** Il n'y a pas de navigateur dans le bac à sable : rien ici
ne prouve qu'un texte tient à l'écran. Il empêche les causes connues, pas le symptôme. **La
relecture à l'œil reste nécessaire et n'est pas remplacée** — le harnais l'écrit lui-même dans sa
sortie.

⚠️ Deux assertions du harnais étaient **fausses** au premier jet : la borne d'extraction coupait
avant la dernière règle (deux sélecteurs déclarés « absents » à tort), et `/width:\d/` matchait
`min-width:0`. **Un contrôle qui coupe sa propre zone de lecture invente des défauts.**

### 72e. Ce qui a été livré

`src/cave.js` · `src/utils.js` · `index.html` · `public/sw.js` · `guide/08-cave.html` (+
`public/guide.html` régénéré) · `package.json` · `scripts/mv-harnais-fusion.mjs` (37 assertions,
8 contre-épreuves) · `scripts/mv-harnais-alignement.mjs` (43 assertions, 7 contre-épreuves), les
deux branchés dans `check` **et** `prebuild`.

`WHATS_NEW` vérifié **en l'exécutant** : 4 entrées en 6.73, 163 blocs conservés, ouverture sur
`APP_VERSION`. `MV_AIDE.cave` : 4 points neufs, et **une phrase devenue fausse corrigée** (« la
liste des relevés s'ouvre sous la courbe » — il faut désormais déplier la cuve d'abord).
`_mvtSteps` relu : la visite guidée ne vise aucun sélecteur `.mvv-*`, **rien à changer**.

⚠️ **Ligne de base regravée**, deux clés, **deux baisses, aucune hausse** :
`C24b_slot_js_nu/src/cave.js` 32 → 26, et `C24c_interpolation_nue/src/tracteur.js` 23 → 22.
**Cette seconde baisse n'est pas de ce lot** : `tracteur.js` est identique au dépôt, elle vient du
commit `bigmaj` qui n'avait pas regravé. Vérifié avant gravure que le cliquet **rougit bien au
dépassement** (sabotage : 26 → 27), et que les deux slots restés nus dans le code neuf étaient des
constantes littérales — **échappés quand même**, plutôt que graver une exception à expliquer.

⚠️ Deux rouges rattrapés en fin de chaîne : quatre `_mvIcon(…, 15)` hors de l'échelle
16/18/20/24/40, et un `font-weight:400` hors des trois pas autorisés (500/600/700).

---

## 73. ★★★ MAJ-1 — LE DIMANCHE ET LE FÉRIÉ TRAVAILLÉS SE MAJORENT (31/08 — APP 6.73 → 6.74 · SW 7.28 → 7.29)

> *« Pour la section planning, il faudrait rajouter les cinquante pour cent du dimanche en calcul
> automatique et les cent pour cent des jours fériés. »* — Nico, 31/08

### 73a. L'état des lieux, mesuré avant d'écrire

`_feriesY()` calculait déjà les fériés année par année (Butcher) et `dow===0` identifiait déjà le
dimanche — mais **uniquement pour le décompte des congés et la couleur des cases**. Aucune
majoration nulle part dans le planning. Le seul `maj_hsup` (25 %) vit dans `pilotage.js` et
n'alimente que la **simulation de coût d'un renfort** : il ne touche ni la feuille d'heures, ni le
compteur, ni la paie.

### 73b. Les trois arbitrages tranchés par Nico AVANT toute ligne de code

| Question | Réponse |
|---|---|
| La majoration compte comment ? | **Les deux, selon `hsup_mode`** |
| Cumul avec les heures sup ? | **La plus forte seule** |
| À partir de quand ? | **Janvier 2026** |

★ Une maquette HTML interactive (taux modifiables, bascule de mode, cas d'août 2026) a précédé
l'intégration — workflow prototype-first, comme pour tout lot qui change un écran.

### 73c. Le modèle

```
CONFIG.majorations = {dim:50, ferie:100}      // reglable, Planning › Le cadre
PLAN_MAJ_DEBUT     = '2026-01'                 // CONSTANTE, pas un reglage
```

**`_planMajMonth(mbr,m)`** rend `{hDim,hFer,majDim,majFer,maj,jours[]}`. Son critère d'inclusion est
**exactement celui de `_planDaysWorked`** (jours MSA) : `_PLAN_ST_OFFDAY[st.t] && !st.retard`
exclut CP, récup, absence et formation ; un **férié chômé** ne porte aucune heure donc s'exclut
seul ; un **retard** majore ce qui reste de la journée. Réutiliser le critère plutôt que d'en
écrire un second est ce qui garantit que « jour travaillé » veuille dire la même chose aux deux
endroits.

★★ **COLLISION FÉRIÉ + DIMANCHE — le taux le plus fort, jamais les deux.** Le **1er novembre 2026
tombe un dimanche** : cas réel de l'année en cours, pas une hypothèse d'école. Le jour est rangé
dans la ligne du **taux retenu** et non dans celle de sa nature, pour que chaque ligne du relevé
reste **homogène en taux** — sans ça, un domaine qui majorerait le dimanche plus fort que le férié
ferait cohabiter deux taux sous un même libellé.

⚠️⚠️ **LES HEURES DE MAJORATION NE SONT PAS DU TRAVAIL EFFECTIF.** Ni plafond 1607 h, ni
modulation, ni durées maximales, ni jours MSA : elles ne passent **jamais** par `_planWorkH` ni par
`_planAnnu`. Gonfler l'annualisation avec des heures que personne n'a passées à la vigne aurait
fait mentir le seul chiffre du module qui ait valeur légale. C'est la même séparation que
`_planDayH` / `_planWorkH` (§19), un cran plus loin.

⚠️ **Les heures listées sont DÉJÀ comptées** dans `s.worked`, dans l'écart du mois, donc dans les
heures sup. Le bloc ne les ajoute pas — il dit à quel taux elles se paient. **Seule `maj`
s'ajoute.** La note du relevé le redit noir sur blanc, sinon un comptable additionne deux fois.

### 73d. Où va la majoration — une seule fonction lit la réponse

**`_planMajBank(mbr,m)`** = `_planHsupPayable() ? 0 : _planMajMonth(mbr,m).maj`. Mode **payé** →
ventilation sur la feuille d'heures, rien au compteur. Modes **récup / clôture** → tranche FIFO du
compteur, ajoutée **au mois qui l'a produite** pour que l'invariant `bank.solde ===
_planYearBalance().net` reste vrai. Sans cette fonction unique, `_planBank` et `_planYearBalance`
auraient chacun leur version de la règle — et deux définitions du même chiffre finissent toujours
par diverger.

⚠️ `PLAN_MAJ_DEBUT` est une **constante et non un réglage** : il n'y a rien à arbitrer par domaine,
et un réglage de plus est un réglage à découvrir. Idiome `'YYYY-MM'` de `_planDuesActive`, où le
tri lexical **est** le tri chronologique.

⚠️ **Un taux à ZÉRO est légitime** (domaine qui ne majore pas) : lecture par `isNaN`, **jamais par
`||`**, qui écraserait 0 par le défaut. Règle générale du projet, appliquée ici parce qu'elle
chiffre des euros.

### 73e. Ce que le harnais a trouvé, et qui avait tort

`scripts/mv-harnais-majoration.mjs` — **29 assertions, 4 contre-épreuves**, fonctions extraites du
fichier réel par équilibrage d'accolades et exécutées dans un `vm`. Réels : le calendrier
(`_mvEasterMD`, `_feriesY`), `_planDayStatus` et toute sa chaîne de motifs, les quatre fonctions
neuves. Stubbés : les entrées du scénario.

★★★ **TROIS ASSERTIONS SONT TOMBÉES ROUGES, ET C'ÉTAIT ELLES QUI AVAIENT TORT.** « CP un dimanche »
sortait à 12 h au lieu de 0. Cause : le scénario posait `modele: () => 8`, donc **8 h planifiées sur
les quatre dimanches de septembre** — le harnais mesurait le mois entier en croyant mesurer une
case. Le code, lui, avait raison : *un dimanche sur lequel le planning porte des heures est un jour
travaillé* (même principe que `_paGrille`). Scénarios corrigés, et un cas **8b** ajouté pour
verrouiller ce comportement au lieu de le laisser implicite.

**Contre-épreuve — quatre défauts réintroduits, quatre détectés** : taux 0 écrasé par `||`, férié et
dimanche cumulés, fenêtre de janvier 2026 supprimée, majoration alimentant le compteur en mode payé.

### 73f. Deux cliquets rattrapés en fin de chaîne

- **DS-1, jeu d'icônes** : `planning 78 → 79`. Une coche verte dans le toast de `planSaveMaj`,
  copiée sur `planSaveLegal`. **Retirée** — pas regravée. Un toast se lit très bien sans.
- **DS-0, graisses** : `148 ≤ 147`. Un `font-weight:800` dans la tuile « Major. + cumul », copié sur
  ses voisines. Ramené à `var(--fw-bold,700)`. La tuile est imperceptiblement moins grasse que les
  trois d'à côté ; **le cliquet ne remonte pas**, et c'est ce qui compte.

★ Les deux fautes ont la même origine : **copier le style du voisin sans vérifier qu'il est dans
l'échelle**. Le voisin a été écrit avant le cliquet.

### 73g. Fichiers, versions, état

`src/planning.js` (4 fonctions neuves + `_planYearBalance` + `_planBank` + carte compteur + tuile
annuelle + bloc PDF + bloc Cadre + `planSaveMaj` + `_planLegInput` doté d'une unité optionnelle) ·
`src/utils.js` (`APP_VERSION` + 3 items `WHATS_NEW` + `MV_AIDE.planning`) · `index.html` (4
emplacements) · `public/sw.js` · `guide/10-planning.html` + `public/guide.html` régénéré ·
`scripts/mv-harnais-majoration.mjs`.

**`utils.js` touché → BUMP : APP 6.73 → 6.74, SW 7.28 → 7.29.** Preflight **0 rouge sur 36**,
harnais **29/0** + 4 contre-épreuves. `WHATS_NEW` vérifié **en l'exécutant** : 3 entrées en 6.74,
164 blocs, aucun doublon de version.

⚠️ **Base re-mesurée avant construction du paquet** : le clone de début de session portait APP 6.72
/ SW 7.27, le `git pull` juste avant les patchs a ramené le commit `maj cave` (APP 6.73 / SW 7.28,
§72). Les numéros annoncés en début de conversation étaient donc **caducs**. C'est exactement le
piège du 13/08 (règle d'or n°1), attrapé cette fois.

### 73h. Ce que ce lot n'a pas fait

**La majoration des heures supplémentaires n'existe toujours pas dans le planning.** Les heures sup
sortent en heures nues, sans taux ; `maj_hsup` (25 %) reste cantonné à la simulation de coût de
Pilotage. « La plus forte seule » ne joue donc **qu'entre dimanche et férié**. Faire porter leur
taux aux heures sup sur la feuille est un lot à part — **il change la paie de tout le monde**, et
il demande d'abord de trancher si le taux est unique ou progressif (25 % puis 50 %).

---

## 74. ★★★ LE BACKLOG DISAIT DEUX CHOSES FAUSSES, ET LES FILETS NE DÉMARRAIENT PAS (31/08 — `planning.js` + `scripts/`, AUCUN BUMP)

### 74a. La priorité n°1 du backlog était déjà faite — et le vrai reste tenait en une ligne

`_pl2Cell` était classé **« le défaut le plus visible côté client de tout le backlog »**, confirmé
ouvert par l'audit du 16/08 *« vérifié un par un dans le code »*. Il ne l'était plus : la lecture du
fichier montre `if(_mc.heures){ … return {txt:_planFmt(_fa),cls:'pl2c-late'} }` **avant** la croix
rouge, avec son commentaire « un retard n'est pas une absence ».

★★ **Mais le reste de l'entrée, lui, était vrai** — et personne ne l'avait vu parce qu'on croyait
l'entrée entièrement ouverte : *« et la légende qui suit »*. La légende du tableau d'équipe listait
sept états, **jamais le retard**. Une case orange sans nom se lit comme un avertissement.

⚠️⚠️ **`styles.css` PORTAIT LA PREUVE DEPUIS LE DÉBUT** : `.pl2-legend i.pl2c-late::after{display:none}`
— une règle qui **ne pouvait jamais s'appliquer**, faute d'entrée de légende à décorer. Le CSS
attendait une légende que personne n'avait écrite. **Une règle morte est un aveu**, au même titre
qu'un `WHATS_NEW` qui promet ce qui n'existe pas (§36h) : chercher les sélecteurs sans cible est un
geste d'audit à part entière, et il est bon marché.

★ **La leçon, symétrique de la règle de détection d'absence** : *un constat d'absence a une durée de
vie de quelques minutes* — **un constat de PRÉSENCE de défaut aussi.** Vérifier avant de corriger,
même quand le document affirme avoir vérifié. Douzième entrée périmée trouvée dans ce backlog.

### 74b. Quatre harnais ne pouvaient pas démarrer ailleurs que dans le bac à sable

Sur les six annoncés en §44c, **deux s'étaient corrigés depuis** et un troisième aussi : il en
restait **quatre** (`harnais-cadence-escalier`, `harnais-reconduction`, `harnais-bandeau-essai`,
`harnais-parcours-prospect`). Tous convertis à `new URL('../', import.meta.url)`, tous **lancés
depuis `/tmp`** avant livraison — le test que la règle prescrit et que personne n'avait joué.

★★★ **ET C'EST CE TEST QUI A TOUT TROUVÉ.** `harnais-bandeau-essai` ne rougissait pas : **il
crashait**, `ReferenceError: _mvIcon is not defined`, **avant sa première assertion**. Le lot DS-1
du 16/08 avait ajouté `_mvIcon` dans `_mvTrialBanner` ; le harnais, écrit le 14/08, ne le stubbait
pas. **Sept vérifications du bandeau d'essai — le parcours prospect — ne protégeaient plus rien
depuis quinze jours**, et la sortie ressemblait à un rouge ordinaire.

### 74c. Deux harnais testaient une photo du code, pas un comportement

- **`harnais-bandeau-essai`, bloc « bump »** : il exigeait `v6.66` quatre fois, l'absence de `v6.65`,
  et `APP_VERSION == '6.13'`. Trois assertions vraies **un seul jour**. Rebasées sur l'invariant
  qu'elles voulaient protéger : *les quatre porteurs du SW disent le même numéro, quel qu'il soit, et
  aucun numéro antérieur ne traîne hors du journal*. L'assertion sur `APP_VERSION` est **supprimée** :
  « délibérément inchangé » n'a de sens que dans son lot d'origine.
  ★ Le bloc valide désormais un vrai bump — il a servi sur le 7.29 du même jour. Contre-épreuve :
  un `console.log` laissé en 7.28 → **deux rouges**, restauré → vert.
- **`harnais-cadence-escalier`** : son unique rouge cherchait `push('warn'` — **une forme de code qui
  n'a jamais été écrite**. Le comportement, lui, existait bien. Rebasé sur ce qui se lit à l'écran :
  quand l'écart vient de l'historique, le conseil dit *« c'est un repère, pas une prévision »* et ne
  cite pas la projection de fin. Contre-épreuve : garde neutralisée → rouge, restaurée → 28 vertes.

★★ **La règle §44c se précise.** *« Se demander ce que le harnais assertait »* ne suffit pas : il faut
distinguer **ce qu'il assertait** (un comportement) de **comment il l'assertait** (une forme de code).
Les deux rouges d'aujourd'hui visaient la forme. Une assertion qui cite un identifiant de niveau
d'alerte, un numéro de version ou une signature d'appel **teste l'écriture du code, pas ce qu'il
fait** — et elle rougira au premier refactor honnête.

### 74d. Fichiers, versions, état

`src/planning.js` (une ligne de légende) · `scripts/harnais-cadence-escalier.mjs` ·
`scripts/harnais-reconduction.mjs` · `scripts/harnais-bandeau-essai.mjs` ·
`scripts/harnais-parcours-prospect.mjs` · `CLAUDE.md`.

**AUCUN BUMP** : `planning.js` seul, et `scripts/` n'est jamais déployé. ⚠️ Le `planning.js` livré
**contient aussi le lot MAJ-1 (§73)** — c'est le même fichier, il remplace celui livré plus tôt dans
la même conversation.

Résultats depuis `/tmp` : bandeau-essai **15/0** (crashait), cadence-escalier **28/0** (1 rouge),
reconduction **20/0**, parcours-prospect **58/0**. Preflight **0 rouge sur 36**.

### 74e. ⚠️⚠️⚠️ UN HARNAIS EST PASSÉ AU ROUGE TOUT SEUL, ET IL BLOQUAIT LE BUILD (02/09)

Contrôle de fraîcheur avant poussée, le lendemain : `npm run check` **sort en 1**. Rouge unique,
`mv-harnais-releve` — *« la période qui couvre aujourd'hui est marquée en cours »*.

**Vérifié rouge sur la base d'origine avant de toucher quoi que ce soit** : `git stash`, relance,
même rouge, `git stash pop`. **Ce n'était pas le lot.** L'assertion écrivait
`(H.match(/cnow/g)||[]).length <= 1` : elle comptait la chaîne `cnow` sur **tout le document,
feuille de style comprise** — or la règle `.cnow{…}` en fait déjà une à elle seule. Le plafond de 1
voulait donc dire **« aucun badge rendu »**, ce qui est vrai onze mois sur douze et faux dès qu'une
période du scénario couvre la date du jour. Les périodes du décor vont du 2 mars au 24 juillet et du
1er septembre au 30 novembre : **le harnais a viré au rouge le 1er septembre 2026, sans qu'une seule
ligne de code ne bouge.** Corrigé : on compte les **badges** `<b class="cnow">`, plafond 1 inchangé.
Contre-épreuve : badge forcé sur les deux périodes → rouge à « 2 badge(s) rendu(s) », restauré → vert.

⚠️⚠️ **`prebuild` joue la même chaîne que `check`** : tant que ce rouge était là, `npm run build`
échouait et **aucun déploiement n'était possible**. Un harnais date-dépendant ne gêne pas seulement
la CI, il ferme la porte.

★★★ **ET J'AI FAILLI NE PAS LE VOIR.** La veille, j'avais conclu « 0 rouge » en filtrant la sortie
sur `grep -cE "rouge\(s\)|✗"`. Ce harnais-ci écrit « 1 ROUGE », sans parenthèses et sans glyphe :
**mon filtre l'a manqué**. C'est §74c retourné contre moi le jour même — *tester une forme au lieu
du résultat*. → **RÈGLE POSÉE** : *un `npm run check` se juge sur son CODE DE SORTIE, jamais sur un
grep de sa sortie.* `npm run check >/dev/null; echo $?`. Un filtre qui rate un rouge se lit comme un
succès, exactement comme un harnais qui ne démarre pas.

★ **Troisième harnais date-dépendant de la journée**, après les deux photos de version de §74c. La
famille est la même : une assertion vraie le jour où on l'écrit. Ici le déclencheur n'est même pas
un lot, c'est **le calendrier**.

`scripts/mv-harnais-releve.mjs` s'ajoute donc au paquet. `npm run check` **exit 0**, `npm run
prebuild` **exit 0**.


---

## 75. ★★★ UN CODE D'ERREUR POUR TROIS CAUSES — LA RÉCOLTE ANNONCÉE ENREGISTRÉE, PERDUE AU RECHARGEMENT (01/09 — `firebase.js` + `cave.js` + `scripts/`, AUCUN BUMP)

### 75a. Le signalement

En pleine vendange, sur le Cuvier de le domaine de référence : bandeau
`🔒 Écriture refusée — cave_vendange (droits insuffisants)`, badge « Synchro partielle », et sur une
quatrième capture, au même horodatage, « Synchronisation temps réel interrompue ». Nico :
**« ce n'est pas la 1ère fois que ça arrive, à la réouverture de l'App les dernières saisies ne sont
pas enregistrées »**. Compte **admin**, App Check sans anomalie côté console Firebase.

### 75b. L'arithmétique des règles disait que c'était impossible

`cave_vendange` passe par la troisième règle de `firestore.rules` :
`isMyTenant(collection) && !isAdminOnlyDoc(docId) && docId != 'config' && canWrite() && shapeOk() && countOk(docId)`.
Pour ce document, `isAdminOnlyDoc` est faux, `countOk` ne le borne pas, `shapeOk` est **toujours**
vrai (`setDoc(ref,{value:…})` n'a qu'une clé). Pour un admin, `canWrite()` est vrai. **Il ne restait
que `isMyTenant`** — donc `request.auth == null` ou un `tenant` absent du jeton. Un `tenant` absent
serait permanent ; le symptôme est intermittent. **Le jeton n'était plus valide au moment de
l'écriture.**

★ **La capture qui tranche est celle des listeners.** Les lectures sont ouvertes à *tout* membre du
domaine, `ro` compris : un refus de rôle ne peut pas les faire tomber. Qu'elles tombent **dans la
même seconde** qu'une écriture refusée ne laisse qu'une explication : côté règles, il n'y a plus
personne. C'est §68 vu par l'autre bout — la même 4G qui n'arrivait pas à rafraîchir le jeton depuis
la cave, sauf qu'ici l'application ne se contentait plus d'afficher un faux message : **elle perdait
le travail.**

### 75c. ★★★ LA LEÇON — `permission-denied` RECOUVRE TROIS CAUSES, DONT DEUX PASSAGÈRES

Firestore rend le **même** code pour :

| cause | nature | ce qu'il faut faire de la saisie |
|---|---|---|
| le rôle ne permet pas cette écriture | **définitive** | ne pas remettre en file (poison pill), mais **garder** |
| le jeton d'authentification n'a pas pu être rafraîchi | **passagère** | **mettre en file**, elle repartira seule |
| le jeton App Check n'a pas été obtenu | **passagère** | **mettre en file** |

La doctrine SEC-1 — *« un refus de droits n'est PAS une panne transitoire »* — ne vaut que pour la
**première ligne**. Appliquée aux trois, elle **jetait** la saisie : `fbSave` retournait
`{denied:true}` sans jamais appeler `_queueSave`, et `_flushQueue` faisait pire encore en
**retirant** la clé de la file. Rien en base, rien sur le téléphone, rien en attente. Au
rechargement, `applyFbData` réécrivait l'état depuis Firestore et la récolte n'avait jamais existé.

> ★★★ **RÈGLE POSÉE : un code d'erreur qui recouvre plusieurs causes ne peut pas servir seul de
> décision.** Il faut aller demander à la source laquelle des causes s'applique — ici,
> `getIdToken(true)`. Une doctrine juste sur un cas devient destructrice appliquée aux trois.

> ★★ **RÈGLE POSÉE : ne jamais jeter une saisie, même sur un refus réel.** Le poison pill interdit la
> file, pas la conservation. `_mvStashDenied` range la valeur dans
> `localStorage['mavigne_denied_stash']` ; rien ne la renvoie tout seul — c'est le but — mais elle
> est là. `window._mvDeniedStash()` la relit, `window._mvDeniedStashClear()` la purge.

### 75d. AUTH-1 — le correctif dans `fbSave` et `_flushQueue`

`_mvTokenAlive()` : `auth.currentUser` absent → passager ; `getIdToken(true)` en échec ou au-delà de
**8 s** → passager. Sinon le jeton est frais, et on **retente une fois** — sans quoi on classerait
« définitif » une écriture que le rafraîchissement vient de rendre possible. `_mvDeniedRetried`
borne la récursion à un tour, purgé après 60 s. Le refus qui survit à un jeton neuf est réel : coffre
+ badge **`Enregistrement refusé — Vendanges · saisie conservée`**. `_MV_KEYLBL` traduit les 25 clés :
le badge ne dit plus `cave_vendange` à un chef de cave.

⚠️ **Piège C14 rencontré** : `_flushQueue().catch(function(){})` est compté comme un `catch {}` vide
par la sonde — le motif `catch\s*\([^)]*\)\s*\{\s*\}` ne distingue pas le `.catch` de promesse du
`try/catch`. Et **blanchir les commentaires avant de compter** rend inutile le
`/* rien à faire */` : il faut du vrai code. D'où `_mvSoonFlush(ms)`, helper avec un vrai
`logError` dedans.

`scripts/mv-harnais-auth1.mjs` — **18 assertions** sur quatre états de jeton (session perdue,
rafraîchissement impossible, refus qui disparaît après rafraîchissement, refus réel), en **rejouant
le corps réel de `fbSave`** extrait du fichier livré. Contre-épreuve : quatre sabotages, quatre
rouges. ⚠️ **Le harnais s'est trompé avant le code** : l'ancre d'extraction oubliait
`var _MV_STASH_KEY`, la constante devenait `undefined`, le coffre écrivait sous une mauvaise clé et
la sonde criait au défaut. *Un harnais rouge accuse d'abord le code — vérifier l'accusateur.*

### 75e. VD-SAVE — le vert partait avant la réponse du serveur

`saveVendRec` mutait `CAVE_VENDANGE`, appelait `fbSave` **sans lire l'état rendu**, puis affichait
« Récolte enregistrée » en vert. Le contrat de §68 existait depuis le 25/08 ; **le Cuvier ne le
lisait nulle part**. Dix-neuf écrivains dans ce cas.

> ★★★ **RÈGLE POSÉE : un message de succès qui ne dépend pas du succès n'est pas un message, c'est
> une décoration.** Le contrat rendu par `fbSave` ne protège personne tant qu'un appelant ne le lit
> pas — écrire le contrat et le brancher sont **deux lots**, pas un.

`_vendFbSave(msg, coul, cles)` : le message de l'appelant n'est affiché que sur `ok`, sinon l'écran
dit l'attente réseau ou le refus. ⚠️ Le toast « Enregistrement… » est **différé de 700 ms** : posé
tout de suite il ferait clignoter deux toasts et vibrer deux fois sur un enregistrement normal ;
absent, un réseau lent laisse l'écran muet ~7 s (trois tentatives) et l'utilisateur ressaisit.

### 75f. VD-GARDE — et surtout : ★★ NE PAS UTILISER `canWrite()` ICI

**Quatorze** écrivains sur dix-neuf ne vérifiaient aucun rôle. Le réflexe est d'y poser `canWrite()`.
**Il aurait été faux** : côté client (`utils.js`) elle vaut `isAdmin() || (ouvrier && !saisonnier)`
et rend **faux pour un tractoriste**, alors que le serveur (`deriveRo`, `functions/claims.js`)
n'impose `ro` qu'aux comptes **sans aucun rôle d'écriture** portant `saisonnier` ou `pilotage`. Poser
`canWrite()` sur la vendange aurait **privé les tractoristes d'un écran qu'ils utilisent**.

> ★★ **RÈGLE POSÉE : une garde d'écran doit refléter la règle du SERVEUR, pas la fonction de rôle la
> plus proche sous la main.** Les deux ne disent pas la même chose, et l'écart se paie en droits
> retirés à quelqu'un qui les avait.

`_vendLectureSeule()` est le miroir exact de `deriveRo`. ⚠️ **Dette assumée : deux copies d'une même
règle, une par machine.** Le jour où `deriveRo` bouge, celle-ci doit bouger avec. C'est pourquoi
`scripts/mv-harnais-vendange-garde.mjs` **lit et exécute les deux fichiers côte à côte** sur les
**31 combinaisons de rôles** et exige le même verdict : une règle dupliquée ne se surveille que par
comparaison des deux sources réelles, jamais par une table recopiée dans le harnais. **14 assertions,
5 contre-épreuves.** Il tient aussi l'invariant statique *« plus aucun `fbSave('cave_vendange')` nu »*
— zéro restant, et chaque appelant de `_vendFbSave` porte une garde de rôle avant l'appel.

⚠️ **Les cinq écrivains déjà gardés le sont par `canWrite()` / `isSaisonnier()`, pas par
`_vendGarde()`.** Deux règles cohabitent donc dans le même écran : les analyses de maturité et les
réglages restent fermés aux tractoristes, les récoltes leur sont ouvertes. **Non harmonisé
volontairement** — ce serait *ouvrir* des droits, pas corriger un défaut, et cela n'a pas été
demandé. À trancher.

### 75g. Ce qui est parti

| fichier | contenu | bump |
|---|---|---|
| `src/firebase.js` | AUTH-1 : `_mvTokenAlive`, `_mvSoonFlush`, `_mvStashDenied`, `_MV_KEYLBL`, reprise de `fbSave` et `_flushQueue` | — |
| `src/cave.js` | VD-SAVE + VD-GARDE : `_vendLectureSeule`, `_vendGarde`, `_vendFbSave`, 19 écrivains rebranchés, 14 gardes | — |
| `scripts/mv-harnais-auth1.mjs` (neuf) | 18 assertions, 4 contre-épreuves | — |
| `scripts/mv-harnais-vendange-garde.mjs` (neuf) | 14 assertions, 5 contre-épreuves | — |
| `scripts/mv-harnais-fusion.mjs` | deux stubs (`_vendGarde`, `_vendFbSave`) — il rejoue `saveVendFusion` | — |
| `package.json` | les deux harnais dans `check` et `prebuild` | — |

**AUCUN BUMP** (règle §36 : `firebase.js` + `cave.js` + `scripts/`). ⚠️ **Mais les messages du Cuvier
ont changé pour le client** — treizième lot visible parti sans annonce : **le prochain bump doit le
dire dans `WHATS_NEW`**, du point de vue de l'utilisateur (« ce que vous saisissez pendant les
vendanges n'est plus perdu quand le réseau lâche »), pas du point de vue du jeton.

⚠️ **Le harnais de fusion a été cassé par ce lot et réparé dans le même lot** : il rejoue
`saveVendFusion` par `new Function`, et la nouvelle garde n'existait pas dans ses stubs —
`ReferenceError` **avant la première assertion**, exactement le motif de §74b. *Ajouter un appel dans
une fonction rejouée par un harnais, c'est modifier ce harnais.*

### 75h. Deux prises annexes

- **`_vendRecordRendement` ne sauvegarde pas lui-même** : il passe par `_vendSaveParcelles()`, qui
  appelle `saveData('parcelles')`. Vérifié — ce n'était pas une seconde fuite.
- **`mv-harnais-releve` était déjà rouge sur le dépôt**, donc `npm run build` bloqué, avant tout lot.
  Diagnostiqué ici le 01/09 et **corrigé indépendamment par Nico le 02/09** (§74). ⚠️ **Sa version est
  meilleure que la mienne** : il a gardé le plafond `<= 1`, là où j'avais écrit `=== 1` — qui aurait
  rougi du 1er décembre au 1er mars, quand aucune période du scénario ne couvre le jour. *En
  réparant une assertion date-dépendante, j'en avais fabriqué une autre.* Ma version est abandonnée.

---

## 76. ★★★ LE CONTRAT ÉTAIT ÉCRIT DEPUIS HUIT JOURS, ET PERSONNE NE LE LISAIT (01/09 — `planning.js` + `cave.js` + `app.js` + `tracteur.js` + `firebase.js`, AUCUN BUMP)

### 76a. Le lot précédent n'avait corrigé qu'un écran sur six

§75 a rendu le Cuvier honnête. L'audit qui a suivi a montré que **le même mensonge courait
partout** : `fbSave` rend un état depuis le 25/08 (§68), `saveData(key,msg)` le lit — mais les
appelants **directs** de `fbSave` le jetaient. **Trente-cinq endroits**, dont **vingt-deux dans le
planning** : congés posés, congés retirés, acomptes, cadre légal, coupure déjeuner, heures au-delà du
planning, import CSV, canicule. Et **dix dans Le Chai** (`cave_elevage`), voisin immédiat de
l'écran corrigé la veille.

> ★★★ **RÈGLE POSÉE : écrire un contrat et le brancher sont DEUX lots, pas un.** Le contrat de §68
> était juste, testé, documenté, gardé par son propre harnais — et il n'a protégé personne pendant
> huit jours partout où l'appelant ne le lisait pas. *Un contrat sans recensement de ses appelants
> est une intention.* Le geste manquant tient en une commande : lister tous les appels, pas
> seulement ceux du fichier qu'on est en train d'ouvrir.

### 76b. ★★ MON PROPRE AUDIT ÉTAIT INCOMPLET — C'EST LE HARNAIS QUI A TROUVÉ LE RESTE

Le premier passage avait recensé **24** sites, en cherchant un `showToast` dans les **quatre** lignes
suivant l'appel. Le harnais, écrit ensuite, en cherche cinq et couvre **dix modules** au lieu de
trois : il en a sorti **onze de plus** — quatre dans le planning (`planSelAction`,
`planSaveCoupure`, `planSetHsupMode`, `planSetDuesDebut`, dont les messages tiennent sur deux lignes)
et **tout Le Chai**, que je n'avais pas regardé en croyant `cave.js` terminé.

> ★★ **RÈGLE POSÉE : un audit à la main fixe une fenêtre arbitraire ; un harnais la fixe aussi, mais
> il la rejoue à chaque build.** Écrire la sonde AVANT de compter, pas après — sinon on corrige
> exactement ce que la sonde ne vérifiera jamais.

★ **Et un défaut a failli être introduit en corrigeant.** `planSetCpPeriode` fait
`if(window.saveData)saveData('config'); else if(window.fbSave)fbSave(...)`. Mettre le message dans la
branche `else` l'aurait **supprimé du cas normal** — `saveData` existe toujours. Le message va donc à
`saveData`, qui lit déjà l'état. Trois fonctions étaient dans ce cas.
⚠️ `saveData` imposait `#3D6B27` en dur : elle prend désormais une **couleur** en troisième argument,
sinon un appelant qui tient à sa teinte (`PLAN_BG`) reprend un `showToast` nu et le défaut revient.

### 76c. Ce qui a été posé

Deux fonctions dans `firebase.js`, **seule implémentation du contrat** :

- **`fbSaveToast(paires, msg, coul)`** — `paires` est un objet `{clé: valeur}`, plusieurs clés pour
  les gestes qui touchent deux documents (décuvage : vendange + élevage). Le message de l'appelant
  n'est affiché que sur `ok` ; sinon l'écran dit l'attente réseau ou le refus. ⚠️ `paires` à `null`
  signifie **rien à écrire** (sélection vide) : le message sort tout de suite — il ne dit pas
  « enregistré », il dit « aucun jour applicable ».
- **`fbToastApres(état, msg, coul)`** — pour les appelants dont le message se **construit après**
  l'écriture (import CSV : le compte des lignes n'est connu qu'ensuite).

`_vendFbSave` (§75) **délègue** désormais à `fbSaveToast` et ne fait plus que choisir les clés :
deux copies d'une règle de message auraient divergé au premier lot qui n'en touche qu'une.
`mv-harnais-vendange-garde` charge donc `firebase.js` **et** `cave.js` et les joue ensemble.

### 76d. Le harnais

`scripts/mv-harnais-toast-honnete.mjs` — **14 assertions, 7 contre-épreuves**. Le contrat est
vérifié **en exécutant** `fbSaveToast` et `fbToastApres` extraits du fichier livré. Mais l'assertion
qui compte est la seconde : ★ **« aucun appel direct à `fbSave` suivi d'un message de succès », sur
dix modules.** C'est elle qui empêche le prochain lot de recréer le défaut dans un écran neuf — le
reste ne protégerait que les appelants déjà convertis.

Les appels **muets** (aucun toast) restent autorisés : ils ne mentent pas, `fbSave` pose déjà son
badge de synchronisation, et AUTH-1 (§75) garde la donnée.

### 76e. Ce qui est parti

| fichier | ce qui change | bump |
|---|---|---|
| `src/firebase.js` | `fbSaveToast` + `fbToastApres` | — |
| `src/planning.js` | 22 sites (congés, acomptes, cadre légal, canicule, CSV, templates) | — |
| `src/cave.js` | Le Chai : 12 sites · `_vendFbSave` délègue | — |
| `src/app.js` | `saveData` prend une couleur · `saveSaisonPassages` | — |
| `src/tracteur.js` | appoint GNR (`fbToastApres` : message construit après) | — |
| `scripts/mv-harnais-toast-honnete.mjs` (neuf) | 14 assertions, 7 contre-épreuves | — |
| `scripts/mv-harnais-vendange-garde.mjs` | joue les deux fichiers ensemble | — |
| `package.json` | le harnais dans `check` et `prebuild` | — |

**AUCUN BUMP** (règle §36). ⚠️ **Mais les messages changent pour le client dans le planning, la cave,
les réglages et le tracteur** — c'est le plus gros lot visible parti sans annonce à ce jour : le
prochain bump doit le dire dans `WHATS_NEW`, du point de vue de l'utilisateur (« un enregistrement
annoncé est un enregistrement fait »), jamais du point de vue du jeton.

`npm run check` **exit 0** — jugé sur le code de sortie, jamais sur un grep de la sortie (§74).

### 76f. ⚠️⚠️ « AUCUN BUMP » ÉTAIT FAUX — ET JE L'AI ÉCRIT TROIS FOIS

`src/app.js` est modifié par ce lot (`saveData` prend une couleur, `saveSaisonPassages`). §7 est
explicite : **la séquence SW est bumpée à chaque modification de `index.html` / `app.js` /
`utils.js` / `styles.css`.** La liste « ne bumpe RIEN » énumère les modules métier — `app.js` n'y
figure pas, et pour cause : il porte `saveData`, que tout le reste appelle.

J'ai annoncé « aucun bump » **trois messages de suite**, en récitant la règle du §36 sans la
confronter à la liste des fichiers que je venais moi-même de toucher.

> ★★★ **RÈGLE POSÉE : la décision de bump se lit sur la liste RÉELLE des fichiers livrés, jamais sur
> la nature annoncée du lot.** « C'est un lot planning » et « ce lot touche `app.js` » sont deux
> phrases différentes, et seule la seconde décide. Le geste : lister les fichiers modifiés
> (`git diff --stat`) **avant** d'écrire la ligne de bump, pas après.

### 76g. Le bump — APP 6.74 → 6.75 · SW 7.29 → 7.30

Trois entrées `WHATS_NEW`, écrites du point de vue du vigneron : la saisie qui ne se perd plus, le
message qui attend la réponse, le refus lisible. Rien sur les jetons — l'utilisateur n'a pas à
connaître le mot.

Ce bump **solde aussi §75**, parti sans annonce la veille : les deux lots sont visibles du client et
tiennent dans les mêmes trois lignes.

⚠️ **Pièges du bump, tous deux rencontrés :**
- `index.html` contient `2.74` **dans un `<path>` du sprite** (`ic-rotation`). Un remplacement global
  `6.74 → 6.75` ne le touche pas, mais un `.74 → .75` l'aurait cassé. Les quatre affichages ont été
  visés **un par un**, avec leur contexte, `count == 1` chacun.
- `sw.js` : procédure sûre appliquée — remplacement global, **restauration de la ligne de changelog
  v7.29**, puis prépend de la ligne v7.30. Vérification de fermeture : **`7.29` subsiste exactement
  une fois** dans le fichier, et `7.30` exactement cinq (en-tête, changelog, `CACHE_NAME`, deux
  `console.log`).

`WHATS_NEW` vérifié **en l'exécutant** (`import` du tableau extrait, pas relecture) : 3 items,
emojis `nuage` / `check` / `cadenas` — les trois existent comme symboles dans le sprite — et aucune
version en double dans le journal.

### 76h. ★★★ LE COFFRE D'AUTH-1 N'AVAIT PAS DE PORTE — ET LE BADGE LE PROMETTAIT QUAND MÊME

`_mvStashDenied` range la valeur refusée dans `localStorage['mavigne_denied_stash']`, et le badge
annonçait **« votre saisie est conservée »**. Elle l'était — dans une clé que **rien, dans toute
l'application, ne montre ni ne relit**. Pour un chef de cave, une donnée accessible seulement par la
console du navigateur est perdue.

> ★★★ **C'était donc un message qui ment — le défaut corrigé trente-cinq fois en §76, réintroduit
> par le lot qui le corrigeait, et sur lequel le harnais AUTH-1 exigeait le mot « conservée ».** Ma
> propre sonde gravait la promesse au lieu de la vérifier : elle testait la présence d'un mot, pas
> l'existence de ce qu'il désigne. *Poser un mécanisme de sauvetage sans porte pour y entrer, c'est
> déplacer la perte, pas l'empêcher.*

**Correctif tenu dans ce lot, minimal et honnête** : le badge dit `Enregistrement refusé —
Vendanges` et **ne promet plus rien**. La mise de côté part au **journal en `warning`**, donc
embarquée dans « Signaler un problème » — le seul chemin de sortie qui existe déjà. Le harnais
exige désormais **l'inverse** : *le badge ne promet pas ce qui n'est pas encore atteignable*, plus
*la mise de côté part au journal, pas au silence*. Le jour où l'écran de reprise existera, c'est
cette assertion qui le rappellera en rougissant.

✅ **Fait dans le même déploiement** — voir §77.

---

## 77. ★★ STASH-1 — LA PORTE DU COFFRE (01/09 — `reglages.js` + `firebase.js` + `utils.js`, dans le bump 6.75)

La ligne **« Saisies non enregistrées »** apparaît dans **Réglages › App**, au-dessus de
« Documents & impressions ». Elle est **injectée par `reglages.js`**, pas écrite dans `index.html` :
`index.html` est précaché par le SW, l'y poser imposerait un bump à chaque retouche d'un écran que
la quasi-totalité des domaines ne verra jamais. Elle ne sort **que si le coffre contient quelque
chose** et **que pour un admin** — le renvoi écrase un document entier, ce n'est pas un geste
d'ouvrier.

Côté données : `mvStashList` · `mvStashCount` · `mvStashDrop` (renoncer) · `mvStashResend`.

> ★★★ **RÈGLE POSÉE : ce qui est rangé n'est pas « la saisie », c'est le DOCUMENT ENTIER au moment
> du refus.** Le renvoyer trois jours plus tard écrase tout ce qui a été fait depuis, ici ou par
> quelqu'un d'autre — le sinistre exact que le verrou de chargement (Couche 2) existe pour empêcher.
> D'où trois règles tenues dans le code, pas seulement dans l'écran : **rien ne se renvoie tout
> seul** ; le renvoi **repasse par `fbSave`**, donc par toutes les protections (règles, anti-perte,
> AUTH-1) — un refus reste un refus ; l'entrée **n'est retirée que sur `{ok:true}`**, sinon la valeur
> disparaîtrait deux fois. La confirmation **nomme l'écrasement** : *« les saisies faites depuis
> seront perdues »*.

### 77a. ★ L'assertion qui s'est inversée deux fois en un jour

Le harnais AUTH-1 exigeait le mot « conservée » (§75) → §76h l'a inversé, faute de porte → §77 le
remet. **C'est le mécanisme qui fonctionne, pas une hésitation.** Ce que la sonde verrouille n'est
pas un libellé : c'est **l'accord entre ce que l'écran promet et ce que l'application permet**. Une
sonde qui teste la présence d'un mot grave la promesse ; celle-ci teste aussi l'existence de ce que
le mot désigne — d'où la section E, qui lit `firebase.js` **et** `reglages.js`.

⚠️ **Un sabotage est passé au vert au premier essai** : « la ligne n'est jamais appelée au rendu »,
parce que `/_reglStashRow\(\);/` trouvait l'appel que la fonction se fait à elle-même depuis
`_reglStashFermer()`. L'assertion extrait désormais **le corps de `renderReglages`** et cherche
dedans. *Une recherche à l'échelle du fichier ne prouve rien sur un appelant précis.* **27
assertions, 6 contre-épreuves** — la sixième n'a rougi qu'après resserrage.

### 77b. Provenance

⚠️ Pendant la session du 01/09, du code portant ce nom est apparu dans l'espace de travail sans
avoir été écrit dans la conversation, citant un « §77 » qui n'existait pas encore. Il a été
**retiré** — on ne livre pas du code dont on ne répond pas — puis le besoin, qui était réel, a été
traité à neuf et vérifié ici. `reglages.js` était resté strictement identique au dépôt entre-temps.


---

## 78. ★★★ LE SEUL FILET QUE JE N'AVAIS JAMAIS JOUÉ EST CELUI QUI A ATTRAPÉ LE DÉFAUT (01/09 — `planning.js` + `cave.js` + `tracteur.js`, aucun bump)

Le lot §76 est parti avec `npm run check` **exit 0**, `npm run prebuild` **exit 0**, 28 harnais
verts, preflight vert. La CI GitHub l'a refusé en quatre secondes :

```
src/planning.js  '_sv' is already defined.  (no-redeclare)
```
⚠️ Le numéro de ligne rendu par la CI est volontairement retiré de cette citation : un numéro
recopié dans ce document se périme au premier lot suivant, et le cliquet du harnais `claude-md` en
plafonne le nombre — il a d'ailleurs refusé cette section tant que le numéro y figurait.

### 78a. Le défaut

`_planCpApplySel` ouvre par `var totJ=0, nMbr=0, prot=0, _sv=_planCtxYear;` — `_sv` y est la
**sauvegarde de l'année de contexte**, un motif présent **quinze fois** dans `planning.js`. J'y ai
ajouté `var _sv = window.fbSaveToast(...)`, écrasant la variable.

⚠️ **À l'exécution, rien ne cassait** : par hoisting il n'existe qu'un seul `_sv` dans la fonction,
et mon écrasement tombait **après** la dernière restauration `_planCtxYear=_sv`. *Le code était
juste par accident de placement.* Trois lignes plus haut, il corrompait l'année de contexte de tout
un calcul de congés. **Et la variable ne servait même à rien** : la valeur rendue n'était pas lue.

> ★★★ **RÈGLE POSÉE : ne jamais introduire un nom de variable court dans un fichier qu'on ne
> connaît pas par cœur sans vérifier qu'il est libre DANS LA FONCTION.** `_sv`, `_p`, `_r`, `_v`
> sont des noms de convention locale : ils sont déjà pris quelque part. Les trois autres emplois que
> j'avais introduits sont renommés **`_mvEtat`** — un préfixe qui n'entre en collision avec rien.

### 78b. ★★★ CE QUI EST VRAIMENT EN CAUSE : UNE ENTRÉE DE BACKLOG QUI DISAIT « IMPOSSIBLE »

Le backlog portait depuis des semaines : *« `lint-cliquet` / ESLint : jamais joué côté Claude
(`node_modules` absent) »*. Je l'ai lue et acceptée à chaque lot.

**Elle était fausse.** `npm install eslint@9 --no-save` installe 309 paquets en 12 secondes —
`registry.npmjs.org` fait partie des domaines ouverts, et c'est écrit dans la configuration réseau.
Personne n'avait essayé.

> ★★★ **RÈGLE POSÉE : une entrée de backlog qui dit qu'une vérification est IMPOSSIBLE est la plus
> dangereuse de toutes.** Une entrée périmée fait perdre du temps ; celle-ci **retire un filet du
> champ de vision** et le fait passer pour une fatalité. Le geste : avant d'accepter un
> « impossible », **essayer une fois** — le coût est de trente secondes, le gain est un filet qui
> reprend du service. *C'est la treizième et la quatorzième entrée périmée de ce backlog, et la
> seule dont la péremption cachait un outil.*

★ **Et le contrôle qui manquait dans MA méthode** : j'ai vérifié ce lot par la syntaxe
(`node --check`), par les harnais, par le preflight, par des contre-épreuves — **jamais par un
analyseur statique de portées**. `node --check` valide la grammaire, pas la sémantique : une
redéclaration est du JavaScript parfaitement valide. **Aucun des vingt-huit harnais ne pouvait voir
ça**, et aucun ne le pourra jamais : ce n'est pas leur métier.

### 78c. Désormais

`npm run lint` est joué **à chaque lot**, au même titre que `npm run check`. Contre-épreuve faite :
la redéclaration remise, le cliquet rougit sur la ligne exacte ; retirée, il repasse à 0.
Vérifié aussi sur le dépôt **sans** mon lot — 0 erreur : le défaut venait bien de moi, pas d'un
plafond hérité.

---

## 79. ★★★ LE PIC RÉCLAMAIT DU RENFORT POUR UNE SEMAINE DÉJÀ FAITE (06/09 — `pilotage.js` + `utils.js` + `scripts/` · APP 6.77 → 6.78 · SW 7.36 → 7.37)

Signalé par Nico, capture à l'appui, quatre jours après le départ de l'équipe de vendange :
*« Faut m'expliquer l'effectif au pic dans le pilotage — les vendangeurs ne seront plus là,
l'effectif est totalement faux. »*

À l'écran, sur l'onglet **Aujourd'hui** :

```
EFFECTIF AU PIC     34,4 / 38,6 pers.
manque 4,1 pers. au pic · l'exercice          ← en orange
```

### 79a. Ce qui n'était PAS faux : l'arithmétique

L'exercice ouvre en août (défaut `exercice_mois = 7`), ancré sur la période active : **1er août 2026
→ 31 juillet 2027**. Le pic est la semaine la plus chargée de cette fenêtre, `_pilPicPortee` la
cherche sur **toutes** les semaines — passées comprises. C'est la vendange, semaine du 29 août.
Le besoin y valait bien 38,6, et 34,4 était bien ce que `head` rendait ce jour-là.

> ★★★ **Le défaut n'était pas dans le calcul, il était dans le fait d'afficher une DÉCISION sur une
> semaine terminée, sur l'écran qui s'appelle « Aujourd'hui ».** Une alerte sur laquelle on ne peut
> rien n'est pas une alerte : c'est du bruit, et elle **use l'orange dont les vraies ont besoin**.
> Même famille que §33 — deux grandeurs justes, un rapprochement faux.

### 79b. Le pic à venir n'est pas le pic de l'année

`_pilPicPortee` calcule désormais **deux balances en une passe** : celle de la fenêtre (passé
compris) et `av`, celle des semaines qui ne sont pas finies.

- **« Aujourd'hui »** et **« Capacité vs charge »** lisent `av` — ce sont les écrans qui proposent
  d'embaucher.
- **« L'année »** garde le pic de la fenêtre : c'est son rôle de raconter l'année, vendange comprise.
  Il porte maintenant la mention **« déjà passé »**.
- Le pic passé ne disparaît pas de la carte Capacité : il descend en pied de carte, daté et nommé
  pour ce qu'il est. *Le retirer ferait mentir la frise de « L'année », qui le montre toujours.*

⚠️ **Une seule définition, comme depuis §33.** Aucun écran ne refait le tri de son côté — ce serait
le sixième sélecteur non recensé, une deuxième fois.

⚠️ La date du jour passe par `_mvAujIso` (heure **locale**), pas `toISOString()` : à l'est de
Greenwich un pic serait déclaré passé la veille de sa semaine. Même piège que les étiquettes de
semaine, §33.

### 79c. ★★★ CE QUI SE COMPARE À `need` N'EST PAS UN COMPTAGE DE TÊTES

`need` = heures de la semaine ÷ capacité d'**un** ETP la même semaine. Son pendant exact est
`capH / cap` — les heures **réellement travaillables** de l'équipe (horaire propre à chacun, entrées
du planning, congés, absences, contrats, effectif collectif). `planning.js` la calcule déjà
(`_capWeekReal`), `_pilAnnuelData` la transporte dans chaque semaine : **on la lit**. Nouvelle
fonction `_pilDispoSem`, seule définition.

**Pourquoi pas `head`** — c'est un prorata de jours de **calendrier**. Une équipe sous contrat du
samedi au mercredi y pèse 5/7, alors que la semaine n'offre du travail que du lundi au vendredi,
dont elle ne couvre que trois. D'où **34,4**, un effectif qui n'a existé **aucun jour** de cette
semaine-là. Un nombre à virgule sur un comptage de personnes se lit comme une erreur, et c'en était
une.

> ★★★ **Pourquoi pas `headMax` non plus — et c'est un REVIREMENT ASSUMÉ dans la journée.** Le plan
> annoncé le matin à Nico proposait `headMax`, « les corps au plus fort de la semaine ». En
> l'implémentant : **c'est un faux négatif**. Une équipe de 40 sous contrat le jeudi et le vendredi
> seulement affiche `headMax = 45` face à un besoin de 38,6 → *« couvert »*, alors qu'elle ne
> délivre que deux cinquièmes des heures. **Un manque qu'on éteint coûte plus cher qu'un manque
> qu'on exagère.** `headMax` reste affiché, mais **sous son propre nom** : les corps dans les rangs,
> le chiffre d'un ordre de passage. Deux questions, deux mots, jamais une seule barre de fraction.

⚠️ **Repli obligatoire** : `capH` peut être `null` (planning.js n'a pas su mesurer la semaine). On
retombe alors sur `head` — jamais sur zéro. Un zéro est une mesure.

### 79d. La fiche « i » annonçait un calcul qui n'existe pas

`MV_INFO['pil.capacite']` écrivait : *« le nécessaire vient du barème h/ha du domaine, appliqué aux
surfaces qui restent à faire »*. Vérifié dans `planning.js` : `h = hha × passages × surface
concernée`, la surface **totale** (parcelles non arrachées, non exclues). Il n'y a aucun filtre sur
le restant. **Le besoin d'une semaine ne baisse donc jamais à mesure que le travail avance** — c'est
écrit maintenant, avec la lecture ETP vs corps et la règle du pic à venir.

> ★ **Une fiche d'accompagnement est du code aux yeux de la règle d'or n°3 : elle se vérifie contre
> le fichier, pas contre le souvenir de ce qu'on a voulu faire.** Celle-ci a vécu un mois.

### 79e. L'année dans l'étiquette

`_pilSemLabO` rendait « semaine du 29 août ». Un exercice traverse **deux années civiles** : la
phrase ne disait pas s'il s'agissait de la vendange qu'on vient de faire ou de celle de l'an
prochain. L'année y est.

### 79f. Le harnais — `mv-harnais-pic-avenir`

Méthode C20 : les vraies fonctions sont extraites du fichier livré et **exécutées** sur un vignoble
d'essai (aucun nom de client, aucune donnée réelle).

★★★ **Le choix qui fait la valeur du harnais : sur la semaine du pic, `head` (34,4), `headMax` (45)
et `capH/cap` (29) valent trois nombres DIFFÉRENTS.** Une assertion ne peut pas passer par hasard —
c'est exactement ce qui manquait au premier contrôle de §53 et de §58.

Quatre cadres joués : l'exercice de Nico, un pic tombant sur la semaine **qui contient** aujourd'hui
(il distingue `o1 < oAuj` de `o0 < oAuj`), un exercice **entièrement derrière** (`av` doit valoir
`null`, pas un objet à zéro), et une semaine **sans `capH`** (le repli).

**18 assertions vertes · 9 contre-épreuves, 9 rouges**, rejouées une par une, chaque mutant passé au
`node --check` avant qu'on regarde sa couleur. Parmi elles : le retour à `head`, le passage à
`headMax`, la perte du filtre des semaines finies, le glissement `o1 → o0`, la disparition du repli.

⚠️ **`mute()` lève si son ancre n'a pas exactement une occurrence**, et une sabotage dont l'ancre a
disparu compte pour **rouge**. Vérifié en supprimant volontairement une ancre : sortie **1**, jamais
un vert silencieux. C'est la faute de §48 et de §53, posée quatre fois — un contrôle satisfait par
le texte qui documente le problème.

Câblé dans `check`, dans `prebuild` et dans une étape **nommée** de la CI, contre-épreuve comprise.

### 79g. Ce qui n'est PAS dans ce lot

- **Le besoin reste calculé sur la surface totale.** Si la fenêtre de vendange paramétrée déborde du
  contrat de l'équipe, l'écart apparaît en sous-effectif sur une semaine pourtant travaillée. C'est
  un réglage de **fenêtre de tâche** (Outils › Paramétrage), pas un défaut d'affichage — mais c'est
  un signal utile, et il ne faut pas le confondre avec celui qu'on vient de corriger.
- **`mv-harnais-audit-pil.mjs` était déjà rouge AVANT ce lot** sur `B6 la cle equ` : il attend une
  clé d'onglet en emoji qui est passée aux vraies icônes. Vérifié en remisant le lot — même rouge.
  Il n'est ni dans `check` ni dans la CI ; **c'est un contrôle périmé qui dort**, à remettre à jour
  ou à retirer. Une entrée de plus pour le backlog, de la famille de §78b.
- **Rien n'a été regardé à l'œil.** La carte Capacité gagne deux lignes et le sous-titre change de
  longueur : c'est un rendu, aucun harnais ne le lit.

> ★★★ **RÈGLE POSÉE : un chiffre juste affiché sur la mauvaise fenêtre de temps est un chiffre
> faux.** Le module savait déjà dire *sur quoi* il comptait (§33, la ligne de cadre). Il ne savait
> pas dire **quand** — et « la semaine du pic » sans « elle est derrière » se lit comme une
> consigne. Le cadre d'un chiffre, c'est sa fenêtre **et** son temps.
