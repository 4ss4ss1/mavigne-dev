# Ma Vigne — Instructions personnalisées

> Document de référence du projet **Ma Vigne** (GUERETTECH). Il est le **porteur de vérité** :
> la mémoire Claude est plafonnée, ce fichier ne l'est pas.
> Dernière consolidation : **16 août 2026** — ⚠️⚠️⚠️ **AUDIT DE DÉRIVE DU DOCUMENT (§44)**.
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
> 3. **Château Garraud : le devis reste à établir** — c'est le sujet commercial n°1 (§28), et il
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

---

## ⚖️ Les cinq règles d'or

**Règle d'or n°1 — la vérité est dans les fichiers réels.**
`/mnt/project` **bouge en cours de session**, peut être **incomplet**, et surtout **peut être en
retard d'un lot entier**. Vécus : `firebase.js` disparu en pleine session · `tracteur.js` purement
absent le 26/07 · le **01/08, tout le dossier était figé à l'état de la veille au soir**, ce qui a
produit **trois affirmations fausses** dans un audit pourtant méthodique · le **03/08, un upload de
Nico était lui-même antérieur au dernier fichier livré** · le **07/08, cinq fichiers étaient
absents à 06:49 puis montés à 06:55, en cours de session** · et le **09/08, l'`admin-gt.js` uploadé
par Nico était PLUS RÉCENT que celui de `/mnt/project`** (il portait son correctif SVG du 06/08 et
un écran de remise d'abonnement inconnu du dossier).
**La fraîcheur se mesure, elle ne se suppose ni dans un sens ni dans l'autre — et un constat
d'absence a une durée de vie de quelques minutes.**

★★★ **DEPUIS LE 10 AOÛT (SOIR) — LE DÉPÔT GITHUB REMPLACE L'UPLOAD POUR LA LECTURE DU CODE.**
Le code vit dans `github.com/4ss4ss1/mavigne-dev` (**public**, cloné en HTTPS anonyme — c'est la
condition qui rend le clone possible sans identifiants). En tête de toute session de travail sur le
code : `git clone https://github.com/4ss4ss1/mavigne-dev.git` (ou `git pull` si déjà cloné dans la
session en cours) dans `/home/claude/mavigne-dev/`, puis lire les fichiers réels de là — jamais
depuis une mémoire de la structure d'une session précédente.
⚠️⚠️ **Le clone NE PERSISTE PAS d'une conversation à l'autre.** Le bac à sable Claude repart à
zéro à chaque nouvelle conversation — seuls `/mnt/user-data/outputs` et les uploads accumulés
survivent DANS une même conversation, jamais entre deux. **Réflexe : si `/home/claude/mavigne-dev`
n'existe pas, cloner avant toute autre chose.** Si le dossier existe déjà dans la session en cours
mais que Nico vient de dire avoir poussé un changement, `git pull` avant de faire confiance au
contenu — **c'est le même principe de fraîcheur que pour `/mnt/project`, sur une mécanique
différente.**
★★★ **VÉCU LE 13 AOÛT — LA FRAÎCHEUR SE RE-MESURE AVANT *CHAQUE LIVRAISON*, PAS UNE FOIS PAR
SESSION.** Clone à **07:33**, quatre lots livrés en **fichiers complets** jusqu'à **20:31**. Entre
les deux, **six commits** poussés par Nico (le chantier CONTRATS, §37). L'intégration a écrasé ce
chantier : **331 lignes** perdues dans `reglages.js`, **216** dans `utils.js`, **171** dans
`planning.js`, **19** dans `app.js` — dont un correctif écrit le matin même.
**Rien dans la session ne le signalait** : le clone était bon *au moment où il a été fait*, les
patchs s'appliquaient sans erreur, tous les contrôles passaient — **sur une base morte**.
- **Un fichier COMPLET livré depuis une base vieille de quelques heures est une bombe à retardement.**
  Un patch qui ne trouve pas son ancre échoue bruyamment ; un fichier complet, lui, écrase en silence.
- **Le réflexe** : `git pull` (ou re-clone) **juste avant** de construire le paquet, puis vérifier que
  `git log -1` porte bien le commit sur lequel on a travaillé. Si ce n'est pas le cas : **rejouer les
  patchs sur la base neuve**, ne jamais livrer les fichiers construits sur l'ancienne.
- **Ne pas se fier au silence de Nico.** Il n'a pas à annoncer chaque push : c'est son dépôt, il y
  travaille. C'est à Claude de re-mesurer.
- **Réparation, si c'est déjà arrivé** : ne PAS fusionner à la main. `git revert` du commit fautif
  (opération exacte, testée avant d'être conseillée : le résultat était identique au caractère près),
  puis rejouer les patchs sur la base restaurée. Les ancres retrouvées **une seule fois chacune**
  prouvent que les deux travaux ne se marchent pas dessus ; celles qui manquent désignent exactement
  les endroits à arbitrer.
- ⚠️ **Corollaire sur les numéros de version** : travailler sur une base périmée fait **réutiliser des
  numéros déjà servis**. Le 13/08, `6.58`, `6.60` et `6.61` ont porté **deux contenus différents**,
  tous deux déployés. Un client passé sur l'un ne prendra **jamais** l'autre. Sauter un numéro ne
  coûte rien ; en réutiliser un fige un client pour toujours.

⚠️ **Le dépôt est PUBLIC** — condition nécessaire au clone anonyme. S'il redevient privé, le clone
échoue avec `fatal: could not read Username for 'https://github.com'` : le dire à Nico plutôt que
de deviner une autre cause. Après un clone/pull, `git log -1` pour dater ce qu'on lit et le
comparer à ce que Nico vient de décrire avoir poussé.

⚠️⚠️⚠️ **CE QUI NE CHANGE PAS : LA LIVRAISON.** Claude n'a **aucun accès en écriture** au dépôt
(pas de token, pas de credentials — et ça doit le rester : ne jamais demander à Nico de coller un
token GitHub dans la conversation). Claude continue de livrer des **fichiers complets patchés** via
`present_files`. **Nico les réintègre à la main** (copier-coller dans l'Explorateur, dans
`mavigne-dev\`), **puis commit + push via GitHub Desktop.** Deux flux distincts : lecture directe
(GitHub, automatique, côté Claude), écriture manuelle (copier-coller + GitHub Desktop, côté Nico).

**Pour le code de l'app** : toujours cloner/lire depuis le dépôt, jamais l'annoncer ni l'attendre
en upload. **Pour tout ce qui ne vit pas dans le dépôt** (ce document tant qu'il n'y est pas
commité, archives légales, captures d'écran) : toujours **annoncer ce qu'on attend**, attendre
l'upload, puis travailler **exclusivement** depuis lui.

Jeu standard de fichiers TOUCHÉS par étape module (repère utile pour la livraison et le commit,
plus pour l'upload) = `index.html` + `styles.css` + `sw.js` + le JS du module ; `utils.js`
seulement si l'étape le touche vraiment ; `app.js` seulement si dock/gating/routage bougent.

⚠️ `/mnt/project` (l'ancien mécanisme d'upload de projet) est **déprécié**, remplacé par le clone
GitHub pour tout ce qui est code — s'il apparaît encore dans un contexte, s'en méfier comme d'un
upload potentiellement périmé, jamais comme source de vérité. Il reste **légitime en lecture
d'exploration** tant qu'aucun patch n'en sort. **Mais toute conclusion tirée de cette lecture doit
être confirmée sur le dépôt (ou un upload) avant d'être écrite ici.**

★★ **Deux mécaniques de session à connaître :**
- **`/mnt/user-data/uploads` ACCUMULE** les fichiers d'un tour à l'autre dans une même
  conversation. Un `cave.js` envoyé trois tours plus tôt y est encore. Utile — et piégeux :
  il peut être **périmé** par rapport à ce qui a été livré depuis.
- **`/mnt/user-data/outputs` PERSISTE** aussi, et contient les **derniers fichiers livrés**.
  C'est une source valide, à condition de le **dire explicitement** et de vérifier que Nico ne les
  a pas retouchés. ★ Vécu les 07/08 et 09/08 : de nombreux lots sont repartis des sorties du lot
  précédent, sans upload, en le disant à chaque fois.
  ⚠️⚠️ **Corollaire vécu le 09/08 : ne jamais RETIRER des sorties un fichier qu'on pourrait devoir
  repatcher.** J'ai supprimé `app.js` des sorties en croyant le lot clos ; le lot suivant en avait
  besoin. Il a fallu le reconstruire depuis l'upload d'origine en rejouant le patch, puis **prouver
  par md5** que le résultat était bien celui livré. Ça a marché parce que le patch était
  déterministe — ce n'est pas toujours le cas.
  ★ **Corollaire inverse, demandé par Nico le 09/08 au soir** : ne pas **re-présenter** à chaque
  livraison les fichiers inchangés. Les laisser dans les sorties, ne présenter que le livrable
  courant.
  ★★★ **Corollaire du 14/08 — NE JAMAIS LIVRER UN FICHIER QU'UN SCRIPT FABRIQUE.**
  `public/guide.html` est produit par `scripts/build-guide.mjs`. Livré à côté de sa source, il a
  coûté **deux allers-retours de CI** — une fois la source manquait, une fois c'est le généré qui
  était revenu en arrière. **On livre l'entrée, on nomme la commande.** Détail : §27d.
  ⚠️ **Et le dossier de sortie est PLAT** : impossible d'y créer `guide/11-pilotage.html`. Tout
  fichier dont le nom de livraison diffère de son nom dans le dépôt doit voir ce renommage
  **annoncé en tête de réponse**, en clair. Sinon il n'est pas intégré, et rien ne le signale.

★ **Le réflexe md5, systématique — pour ce qui n'est PAS dans le dépôt.** Quand un upload est censé
contenir un patch livré plus tôt, comparer son empreinte à celle du fichier de sortie **avant** de
travailler dessus. Vécu cinq fois. **Le md5 sert dans les deux sens : détecter un upload périmé, et
confirmer qu'un lot est bien en place.** ★ **Pour le code du dépôt, `git log -1` + `git pull`
remplacent ce réflexe** : plus besoin de comparer une empreinte, il suffit de relire après un pull.

★ **Nico patche parfois lui-même.** Le 06/08, il a corrigé un défaut réel de mon lot : un SVG en
`width:100%; height:auto` s'étirait à ×5 sur écran large. **Sa version fait foi** — on repart de
son fichier (celui du dépôt, après `git pull`), jamais du dernier livrable de Claude, dès que le
contenu diffère.

⚠️ **Exception explicitement autorisée** : un fichier que Nico accepte de voir régénéré sans upload
(cas du `README.md`, et de ce document). Le dire **avant** de livrer, pas après.
★ **Piste ouverte depuis le 10 août** : committer CE document lui-même dans le dépôt (par exemple
en `CLAUDE.md` à la racine, convention reconnue par les outils Claude) pour qu'il soit, lui aussi,
lisible directement sans upload ni régénération. Tant que ce n'est pas fait, l'exception ci-dessus
et la procédure qui suit restent pleinement en vigueur pour ce document précis.

⚠️⚠️ **MAIS L'EXCEPTION A UNE CONDITION, apprise le 10 août.** Régénérer ce document **de mémoire**
produit une version **en retard**, et une version en retard **affirme des choses fausses avec
l'autorité du porteur de vérité. Vécu** : document reconstitué et daté « 9 août **soir** » alors
que le vrai était daté « 9 août **nuit** » — **tout le chantier de l'assistant d'installation
manquait** (§18b, §18c), la CF `submitMiseEnRoute` figurait encore au backlog **alors qu'elle est
livrée**, et deux affirmations sur l'import KML étaient **fausses depuis ce même chantier**.
La mémoire, elle, contenait le chantier : **je ne l'avais pas relue assez attentivement.**

**Procédure avant toute régénération, dans cet ordre :**
1. **Lire la ligne « Dernière consolidation » du document en contexte** et la comparer aux dates
   citées dans la mémoire. ⚠️ Le document fourni au fil d'une conversation peut être **tronqué** :
   vérifier qu'on voit bien la **dernière section**, pas seulement les premières.
2. **Si le document est plus récent que ce que je sais, ou si je n'en vois pas la fin :
   DEMANDER L'UPLOAD.** Régénérer alors depuis lui, jamais depuis la mémoire seule.
3. Ne régénérer de mémoire que si l'on sait, **et qu'on peut le prouver**, qu'aucun lot n'est
   passé depuis la dernière consolidation.
★ **Et dans tous les cas, l'annoncer AVANT de livrer** — ce qui n'est pas seulement une politesse :
c'est ce qui a permis de repérer l'écart au tour suivant.

★★★ **COROLLAIRE APPRIS LE 11/08 — la règle vaut pour MES PROPRES AFFIRMATIONS.**
Pendant la refonte du Planning, j'ai annoncé comme un fait que la visite guidée casserait
(`openPlanFiche('Jean')` en dur dans `_mvtSteps`). **C'était faux, et je ne l'avais pas mesuré** :
les deux étapes visent `.pl2-board`, qui reste dans l'onglet par défaut, et un overlay indépendant
de l'onglet actif. **Le risque a servi d'argument dans un arbitrage de découpage avant d'être
vérifié.** Un constat que j'énonce n'est pas plus frais qu'un dossier `/mnt/project` : il se mesure.
**Dire « à vérifier » coûte un mot ; dire « ça casse » engage une décision.**

**Règle d'or n°2 — aucun numéro de version dans ce document.**
★ Ce qui reste autorisé : les **numéros de rappel de pièges** (`v5.12` du commentaire Élevage, §7).
Tout le reste est banni, **y compris dans l'historique du §28** — une version écrite ici finit
toujours par être recopiée à la place d'être lue.
Toujours **lire** avant de travailler : `APP_VERSION` dans `src/utils.js`, la version SW dans
l'en-tête de `sw.js` **et** `CACHE_NAME`, les **4 affichages** dans `index.html`.
**Deux séquences indépendantes** (APP et SW) : ne jamais déduire l'une de l'autre.
`package.json` reste figé à `1.0.0`.

**Règle d'or n°3 — VÉRIFIER, NE PAS CROIRE.**
Ce document décrit l'**intention** ; `src/` est la **réalité**. `grep` **avant** d'affirmer qu'une
chose est faite ou en attente — dans les deux sens.

| Ce que le doc disait | Ce que dit le code |
|---|---|
| « le lot DOCK n'est pas dans le code » | **il y est** (rejoué le 04/08) |
| « Vigneron admin : 5 items » | **Vigneron = 4 modules** |
| « Pilotage = 6 onglets » | **7** — Conformité était sorti du document, pas du code |
| la garde `hv2-meteo-card` protège la météo | elle **tuait le repli hors-ligne depuis la mise en service** |
| **`index.html` vit dans `src/`** | **il est à la RACINE** (`vite.config.js` : `root:'.'`) |
| **CSP en `Report-Only`, SEC-3 au backlog** | **elle est en ENFORCE**, et l'était déjà |
| **`mvprint.py` est perdu** | **retrouvé le lendemain matin** |
| « il faut ajouter un retrait de fût » | **`openOvRetraitFut` existait déjà** |
| « la section Import/Export vit dans `reglages.js` » | **elle est en dur dans `index.html`** |
| « il faut un filtre millésime dans le Chai » | **`_caveMillFilter` existe depuis longtemps** |
| « les moteurs `_mvFut*` se lisent sans argument » | **`_mvFutParc(INTRANTS, CAVE_ELEVAGE, curY)`** |
| « la baseline a été regravée le 07/08 » | **elle datait du 26/07** — l'affirmation était fausse |
| ★★ **l'aide contextuelle décrit les écrans** | **elle décrivait ceux d'il y a plusieurs mois** |
| ★★★ **« il n'y a pas d'assistant d'installation »** | **`_agtIns` EXISTAIT et avait servi pour Chapelle** (§18b) |
| ★★ **« l'import KML n'écrit QUE les polygones »** | vrai de l'**onglet KML**, FAUX de l'**assistant** |
| ★★★ **la grille du Pilotage est réglée sur 1 colonne** | elle est réglée sur **2 à 4** — elle ne se remplissait jamais parce que **les 18 tuiles arrivaient ouvertes** |
| ★★ **« il n'existe aucune infobulle dans l'app »** | **exact**, et c'était le problème : zéro `<details>`, zéro popover, dans tout le projet |
| ★★★ **`PIL_TREAT_DAYS` existe** | **je l'ai inventée.** `node --check` ne voit pas un identifiant inconnu : seule l'exécution l'aurait levé |
| ★★ **`A8` du harnais d'audit est un cliquet** | c'était un cliquet **à l'envers** : il rougissait quand on AJOUTAIT un bouton de redirection |

À l'inverse, l'audit trouve régulièrement du **travail déjà fait** encore listé au backlog.

⚠️ **Corollaire vécu le 30/07** : la règle vaut aussi pour le **code neuf**.
⚠️⚠️ **Corollaire vécu le 31/07** : elle vaut aussi pour ce qui est **EN LIGNE**.
⚠️⚠️⚠️ **Corollaire vécu le 01/08** : l'**outillage** aussi peut être en retard.
⚠️⚠️⚠️⚠️ **Corollaire vécu le 03/08** : un **changelog n'est pas une preuve**. Lire la fonction.
⚠️⚠️⚠️⚠️⚠️ **Corollaire vécu le 04/08 matin** : **livrer n'est pas intégrer**.
⚠️⚠️⚠️⚠️⚠️⚠️ **Corollaire vécu le 04/08 soir** : un constat exact **devient faux dans la journée**.
⚠️ **Corollaire vécu le 05/08** : un fichier « perdu » ne l'est **qu'après avoir cherché ailleurs**.
★★ **Corollaire vécu le 06/08 — chercher AVANT de proposer d'ajouter.**
★★★ **Corollaire vécu le 07/08** : **vérifier la SIGNATURE D'ENTRÉE d'une fonction, pas seulement
son contrat de retour.**
★★★ **Corollaire vécu le 09/08 matin — CE QUE L'APP RACONTE D'ELLE-MÊME VIEILLIT AUSSI.**
L'aide contextuelle, le guide public et la visite guidée décrivaient des écrans disparus depuis des
mois. Personne ne les relit, aucun test ne les couvrait, et le client, lui, les lit. **Un audit qui
ne regarde que le code passe à côté de la moitié de ce que le client voit.** D'où le contrôle C22
(§6c) et la règle du §27d.
★★★ **Corollaire vécu le 09/08 soir — UNE NOTE DE MISSION AUSSI PEUT MENTIR.** Le fichier de
mission « réduire le temps d'installation » listait comme « ce qui manque vraiment » deux choses
déjà faites depuis des semaines. **Le premier geste d'une mission est un inventaire, pas un plan.**
★★★ **Corollaire vécu le 11/08 — UN CLIQUET ÉCRIT N'EST PAS UN CLIQUET BRANCHÉ.**
`scripts/lint-vocabulaire.mjs` avait été écrit et poussé le matin même, avec son raisonnement et son
plafond à zéro. **Aucun appelant ne l'exécutait** — ni `npm run lint`, ni `ci.yml`, ni rien. Le mot
banni pouvait revenir sans que quoi que ce soit rougisse. **C'est le cas DOCK appliqué à
l'outillage : livré, jamais intégré.** Réflexe : après avoir écrit un contrôle, `grep` son nom dans
`package.json` et `.github/` **avant** de le considérer comme actif.
★★★ **Corollaire vécu le 11/08 — LA BONNE RÉPONSE EST PARFOIS DE RETIRER UNE ÉCRITURE.**
« Un chrono douteux ne doit pas être comptabilisé » semblait demander un mécanisme : dialogue,
choix, correction. **Il suffisait de ne pas écrire `dmin`** — les deux consommateurs (`_chronoSummary`
et `pilotage.js:4318`) retombaient déjà sur le barème, chacun de son côté. **Avant de construire une
mécanique, vérifier ce que fait déjà le chemin par défaut.**
★★ **Corollaire vécu le 11/08 — UN HELPER DE MODULE N'EST PAS UNE PRIMITIVE.**
Du code écrit pour `app.js` appelait `_openOv(...)` : cette fonction **n'existe que dans
`tracteur.js`**. La primitive d'`app.js` est `openOv`, qui pose la classe `open`, gère le z-index et
empile l'historique — le repli maison posait `show` et **l'écran ne se serait jamais affiché**.
⚠️ Le code existant fait la même chose (`app.js:10143`) et **marche par accident** :
`tracteur.js:2632` expose `window._openOv` et le corps d'`app.js` s'exécute en dernier. **Un appel
qui marche par ordre de chargement n'est pas un appel correct.**
★★ **Corollaire vécu le 11/08 — QUAND UN TEST ROUGIT, SOUPÇONNER LE TEST AVANT LE CODE.**
Trois rouges dans la journée : deux venaient du harnais (`SESSIONS` posé sur `globalThis` au lieu de
`window` ; un `sed` dont le motif n'existait pas dans le fichier), **un seul était un vrai bug**.
Mais ce vrai bug n'aurait été trouvé par rien d'autre. **Écrire des assertions fausses n'est pas du
temps perdu — c'est le prix du seul contrôle qui trouve quelque chose.**

---

**Règle d'or n°4 — un lot n'est pas fini tant que l'aide ne dit pas la vérité.**

> ⚠️⚠️⚠️ **OBLIGATOIRE. AUCUNE EXCEPTION. AUCUN « PLUS TARD ».**

**Toute mise à jour qui change ce que le client voit ou fait doit mettre à jour, DANS LE MÊME LOT,
les supports d'accompagnement qu'elle rend faux.** Ce n'est pas une étape de finition qu'on repousse
au lot suivant : c'est une **condition de clôture**, au même titre que le preflight vert.

| Support | Fichier | Quand il devient faux |
|---|---|---|
| **Fiche `MV_AIDE`** du module touché | `src/utils.js` | dès qu'un écran, un geste ou un onglet change |
| **Fiche `MV_INFO`** du chiffre touché | `src/utils.js` | dès que la MÉTHODE de calcul change, ou qu'un chiffre cesse d'être posé |
| **Section du guide public** | `guide/NN-<section>.html` → `node scripts/build-guide.mjs` | dès qu'une fonctionnalité décrite change |
| **Visite guidée** `_mvtSteps` | `src/app.js` | dès qu'un sélecteur visé bouge |
| **`WHATS_NEW`** | `src/utils.js` | dès que le changement est **visible** par l'utilisateur |
| **Écran qui énumère ce qui reste à faire** | selon | dès qu'on lui apprend à faire une des choses listées |

**Le geste concret, avant de livrer :** ouvrir la fiche `MV_AIDE` du module touché et la **relire à
voix haute contre l'écran neuf**. Si une phrase est devenue fausse, la réécrire *maintenant*. Si
aucune ne l'est, l'écrire dans la réponse — « fiche relue, rien à changer » — pour que ce soit un
constat et non un oubli.

⚠️ **Le preflight ne te sauvera pas.** C22 vérifie que les sélecteurs pointent quelque part, **pas
que les phrases sont vraies**. Une fiche peut être **verte au preflight et entièrement périmée** :
c'est exactement l'état dans lequel les dix fiches se trouvaient le 09/08, après des mois.
**Le contrôle automatique protège de la panne, jamais du mensonge.**

⚠️ **Ce qui rend cette règle nécessaire, c'est qu'elle est facile à contourner sans mentir.** Dire
« les fiches MV_AIDE restent à écrire » en fin de livraison est exact, honnête — et laisse le client
avec une aide fausse. **Vécu deux fois le 11/08** : le lot du chrono tracteur inversé (v5.92) et le
lot du mode du jour (v5.93) ont tous deux été livrés en signalant l'aide comme « ce qui reste ». Les
deux écrans les plus utilisés du module Tracteur ont changé de gestes, et leur fiche décrit encore
les anciens. **C'est la dette que cette règle existe pour empêcher, écrite le jour même où elle a
été contractée.**

**Si le temps manque vraiment**, le lot ne se livre pas en deux morceaux : il se **réduit**. Mieux
vaut un lot plus petit dont l'aide est juste qu'un gros lot dont l'aide ment.

Détail des trois supports et de leur mécanique : **§27a** (la règle longue), **§27b** (`MV_AIDE`),
**§27d** (le guide découpé).

**Règle d'or n°5 — ÉCRIRE À NICO EN LANGAGE SIMPLE.**

> ★★★ **Demandé explicitement par Nico le 14/08.** Vaut pour TOUTE réponse, pas seulement
> pour les tutoriels.

**Nico est vigneron et chef d'équipe avant d'être développeur.** Il connaît son application par
cœur — il l'a conçue — mais il n'a pas à connaître le vocabulaire d'un outillage qu'il ne fait
que subir. Une explication qu'il doit relire deux fois est une explication ratée, même si chaque
mot est exact.

**Les gestes concrets :**

| À la place de | Écrire |
|---|---|
| « le fichier généré diffère de ses sources » | « la page en ligne ne correspond plus au texte que tu as écrit » |
| « bump le SW » | « change le numéro de version dans `sw.js` — sinon les clients gardent l'ancienne version » |
| « l'ancre du patch n'a pas matché » | « je n'ai pas retrouvé le bout de code à modifier » |
| « mémoïsation », « idempotent », « CRLF » | dire ce que ça FAIT, pas comment ça s'appelle |

- **Un terme technique par explication, maximum**, et toujours suivi de ce qu'il veut dire.
- **Toujours dire l'effet AVANT la cause.** « Le guide en ligne montre l'ancien texte » d'abord ;
  « parce que la source n'a pas été recopiée » ensuite.
- **Un tutoriel = une action par étape**, avec le chemin complet du dossier et le texte exact à
  taper. Jamais « place le fichier au bon endroit » : écrire le chemin en entier.
- **Dire ce qu'il doit VOIR quand ça marche.** Une étape sans signe de réussite laisse Nico
  incapable de savoir s'il peut passer à la suivante.
- ⚠️ **Ça ne veut pas dire simplifier le RAISONNEMENT.** Les diagnostics restent complets et les
  désaccords restent francs. C'est le VOCABULAIRE qui se simplifie, jamais le contenu — le prendre
  pour un débutant serait aussi raté que le noyer sous le jargon.

★ **Le test** : est-ce que Nico pourrait exécuter cette réponse sur son téléphone, entre deux
rangs, sans rien rechercher ? Si non, la réécrire.

---

## 🖥️ Environnement de Nico

- ★★★ **Git, depuis le 10 août — via GitHub Desktop.** Dépôt `4ss4ss1/mavigne-dev` (**public** —
  nécessaire au clone anonyme de Claude), cloné dans
  `C:\Users\p4n0m\Desktop\Applications\mavigne-dev\` — ⚠️ **CHEMIN À CONFIRMER PAR NICO** : une
  note de mémoire indique `C:\Users\p4n0m\Documents\GitHub\mavigne-dev` (le défaut de GitHub
  Desktop). **Les deux sont invérifiables depuis le bac à sable** ; le premier qui relit tranche et
  supprime l'autre. (dossier **distinct** de l'ancien `mavigne\`,
  qui peut être supprimé une fois vérifié que tout a bien été copié dedans). Nico édite dans
  `mavigne-dev\`, GitHub Desktop détecte les changements, **Commit + Push** (deux clics, pas de
  ligne de commande). ⚠️ Ça ne change **rien** à `npm run build` / `firebase deploy`, qui restent
  identiques et indépendants de Git — Git sauvegarde le code, il ne le compile ni ne le déploie.
  ⚠️ `node_modules/`, `dist/`, `.env` sont dans `.gitignore` : ne jamais forcer leur ajout.
  ★★★ **Côté Claude — mécanique du clone :**
  ```
  git clone https://github.com/4ss4ss1/mavigne-dev.git
  ```
  dans `/home/claude/` (le clone dans `/mnt/user-data/uploads` échoue : système en lecture seule).
  **Le clone ne survit pas d'une conversation à l'autre** — le refaire à chaque nouvelle session.
  **Dans une même session**, si Nico dit avoir poussé un changement, `git pull` avant de relire.
  Le dépôt étant public, aucune authentification n'est nécessaire — si le clone échoue avec
  `fatal: could not read Username`, c'est que le dépôt est repassé en privé : le dire à Nico.
- **Filet avant chaque lot, complémentaire à Git désormais** : `xcopy src
  ..\mavigne-sauvegardes\avant-XX\src\ /E /I /Y` (**hors** du dossier projet). Filets
  complémentaires : les fichiers uploadés dans la conversation, et surtout l'**historique Firebase
  Hosting** (Console → Hosting → Historique → Restaurer, 1 clic).
  ⚠️ `git checkout HEAD~1` reste peu naturel en ligne de commande → **GitHub Desktop propose
  « Revert this commit » en clic droit sur l'historique**, plus simple. Copier `claims.js` /
  `leads.js` / les rules **avant** tout redéploiement backend reste le bon réflexe, Git ou pas —
  Git protège le code source, pas ce qui est déjà en production.
  ★ L'historique Hosting sert aussi de **preuve** : retrouver la version exacte d'une page juridique
  servie à une date de signature donnée (§26b).
  ⚠️⚠️ **Leçon `mvprint.py`** : **tout outil hors dépôt reçoit sa copie dans
  `..\mavigne-sauvegardes\` le jour de sa création — jamais n'attendre.** S'y ajoutent désormais
  `INSTALLER-UN-DOMAINE.md` et `mkpdf.py` (§18c). ★ **Ces outils hors dépôt restent hors GIT
  aussi** — ils ne sont simplement jamais dans `mavigne-dev\`, aucune ligne de `.gitignore` requise.
- **Invite de commandes `cmd.exe`, pas PowerShell.** `&&` fonctionne ; `;` ne veut rien dire ;
  commentaire = `REM` ; code retour = `%ERRORLEVEL%` ; accents = `chcp 65001` en début de session.
- **Le shell des outils Claude est `sh`** → pas d'expansion `{a,b,c}` : **un `cp` par fichier**.
  ⚠️ Pas non plus de **substitution de processus** `<(…)` : pour un diff, écrire les deux fichiers
  sur disque. ⚠️ Une commande shell contenant des parenthèses non protégées échoue
  (`Syntax error: "(" unexpected`) — passer par Python.
- Poste : `C:\Users\p4n0m\Desktop\Applications\mavigne` (ancien dossier) et
  `C:\Users\p4n0m\Desktop\Applications\mavigne-dev` (dépôt Git, celui qui fait foi désormais).
  Firebase CLI. `winget` absent (installer via `.msi`). **Java 17 (Temurin)** pour les émulateurs.
- **Deux comptes Firebase** : `ngdevpro@gmail.com` = admin GT (`gtAdmin:true`) ·
  `gueret.nicolas@gmail.com` = admin Marchand-Grillot (`adm:true`). Toute procédure GT (backfill,
  `fbAdminRead`, `_fbSetTenantPlan`, assistant d'installation) exige la **fenêtre privée ngdevpro**
  et une session OTP ouverte.

### ★★ La granularité d'une préférence (11/08)

Une objection peut être **juste sur le fond et fausse sur la portée**. « Un mode ouvrier/tractoriste
se tromperait la moitié du temps » était un bon argument — contre un mode **permanent**. Il ne valait
plus rien contre un mode **journalier**, parce que la réalité était : homogène dans la journée,
variable d'un jour à l'autre.

**Avant de rejeter une idée, chercher l'échelle à laquelle elle devient vraie.** Et quand
l'objection repose sur une hypothèse terrain — la forme d'une journée, la distance entre deux
parcelles — **c'est Nico qui a la réponse, pas le raisonnement.** Poser la question au lieu de
déduire : deux fois le 11/08, la réponse a retourné le dessin (parcelles éloignées → 1 tap par
parcelle impossible ; journées homogènes → le mode collant redevient bon).

---


## 💬 Communication

Français **terse**. « **go** » / « **intègre** » / « **suite** » / « **go lot X** » / « **continu** »
= exécution autonome immédiate, sans recap ni check-in. Un **upload des fichiers demandés** vaut go.
Livraison = **fichiers complets** via `present_files`, **jamais** d'instructions de patch manuel.
Workflow : **maquette → validation → intégration**. Questions **uniquement** en cas d'ambiguïté
technique bloquante — mais alors les poser **avec une recommandation**, pour ne pas bloquer.

★ **Préférence explicite pour un langage simple dans les explications.** Phrases courtes, une idée
par phrase, pas de subordonnées empilées, pas de jargon là où un mot courant suffit. Cette
préférence **ne change rien aux livrables techniques** — fichiers complets, versionnage, procédures
de patch restent aussi précis. Elle porte sur la **prose autour** du livrable.
★ **Vécu le 09/08** : quand Nico demande « explique-moi le processus en langage simple, je dois
faire quoi ? », il attend **la suite de gestes concrets**, pas la justification technique. Répondre
par « ce que tu fais une fois » puis « ce que tu fais à chaque fois », et nommer le piège.

★ **Nico corrige directement et attend une cause racine, pas un pansement.** « non t'as pas
compris », « c'est moche », « c'est faux » sont des redirections de portée, pas des reproches.
Les captures annotées sont son canal de retour préféré quand le problème est visuel.
Quand il donne un chiffre du terrain (250 tâches validées de janvier à juillet, 11,76 ha, 485 h/ha,
20 h pour installer Chapelle, 40 vendangeurs sur 10 jours, **14 h de clavier sur les 20**), c'est
une **donnée de calage**.

★★ **Il corrige aussi les MODÈLES, et c'est là qu'il faut l'écouter le plus.** Le 06/08, sur le parc
à fûts : « je n'ai pour l'instant fait que l'inventaire exact des fûts **libres** ». Cette phrase a
invalidé tout un lot déjà maquetté et testé.
★★★ **Le 07/08, QUATRE corrections de modèle en cascade** : le ton, le déclencheur, la méthode,
puis l'axe entier. **Quand Nico décrit sa pratique, ce n'est jamais un détail d'affichage.
Réécrire le modèle plutôt que d'ajuster l'existant.**
★★ **Le 09/08, une correction en une ligne** : « oui et les noms donnés par le domaine étaient
différents des noms du KML (on a d'ailleurs fait un programme) ». Cette phrase a déplacé tout le
lot n°1 : le problème n'était pas de LIRE le fichier — c'était déjà fait — mais d'**aligner les
noms**.

★ **Il arbitre le périmètre.** « le lot 4 on ne le fait pas » · « ne prends pas d'initiative, pose
des questions ». **Quand il demande des questions, il faut d'abord EXPLORER pour les poser
précises**, pas demander à l'aveugle.

Le système de fichiers se réinitialise entre les tours (sauf `/mnt/user-data/outputs` et les
uploads accumulés) → reconstruire l'espace de travail et réappliquer tous les patchs **dans un
seul tour**.

---

## 1. Identité & contexte

- **Nicolas Guéret** — GUERETTECH, entreprise individuelle (régime micro-entrepreneur).
- ★★ **SIRET : 982 148 116 00022** (depuis le 31/07/2026). **SIREN inchangé : 982 148 116.**
  L'ancien établissement **…00014** ne doit plus apparaître nulle part — remplacé en **18
  occurrences sur 10 fichiers** (§26c).
  ⚠️ **Deux SIRET distincts vivent dans l'app** : celui de GUERETTECH (mentions éditeur) et
  **celui du DOMAINE client** (`CONFIG.siret`, exigé sur chaque ligne du registre phyto
  électronique, §17). Ne jamais les confondre.
- **Adresse du siège** : **68 rue Henri Challand, 21700 Nuits-Saint-Georges**.
  ⚠️ « **Challand** » avec un C majuscule — faute vécue dans une fiche client.
- **Téléphone** : **06 99 42 48 59** (`tel:+33699424859`). ⚠️ L'ancien numéro **0622074786
  n'existe plus**. Publié dans les mentions légales et la politique de confidentialité.
  ⚠️ **Volontairement absent du DPA** (document signé) et des pages marketing.
- **Courriel** : `ngdevpro@gmail.com`. **TVA non applicable, art. 293 B du CGI.**
- **Double casquette** : développeur unique de Ma Vigne **et** chef d'équipe viticole en Côte de
  Nuits. Différenciateur commercial n°1.
- ✅ **Statut administratif : RÉGLÉ.** Radiation d'office au 31/12/2025 (CA nul) ; régularisation
  INPI/INSEE aboutie au 31/07/2026 ; **l'Urssaf a confirmé le 03/08/2026 que Nico peut facturer**.
  ⚠️ Rappel de principe : **l'attribution d'un SIRET ne vaut jamais affiliation cotisant**.
- **Produit** : **Ma Vigne** — PWA multi-tenant de gestion viticole, `mavigneapp.fr`.
- **Clients en production** :
  - **Domaine Marchand-Grillot** — 45 parcelles + Chazière « Arrachée », ~11,76 ha, tenant de
    référence/dev. Adresses fictives en **`prenom.marchand-grillot@mavigne.app`**.
  - **SCEA PH Chapelle & Fils** (slug `domaine-chapelle-et-fils`, réf. MV-2026-9024) —
    Alexandre Chapelle (chef de culture, opérationnel), **Simon Chapelle** (gérant, signataire et
    destinataire des factures), ~18 ha, 100 % bio, multi-communes. CGU v1.1 + DPA v1.0 acceptés en
    app le 18/07/2026. ✅ **CONVERTI ET FACTURÉ** le 03/08/2026.
    ⚠️ Adresses fictives en **`prenom.domainechapelle@mavigneapp.fr`** — **ni le slug, ni le même
    domaine de messagerie que MG** (§18b).
- ★★ **Prospect entrant : Château Garraud** (Lalande-de-Pomerol, Gironde) — **premier lead hors
  réseau personnel**, arrivé le 04/08 par le formulaire d'essai du site. 45 ha en conventionnel,
  40 parcelles multi-communes, 12 permanents + saisonniers, 6 machines, 4 cuvées.
  ⚠️ **Barrique bordelaise : 225 L**, pas 228 (§18b).
- ⚠️ **Pas d'auto-onboarding client.** Nico installe lui-même chaque domaine. La série du 09/08
  réduit **son temps**, pas sa présence.
- ⚠️ **Aucun tâcheron** aujourd'hui, ni chez MG ni chez Chapelle (§30f).
- ★★ **Un seul millésime en cave aujourd'hui** — l'app n'est pas assez ancienne. **Conséquence
  majeure : la série MILLÉSIME a pu poser une garde stricte sans aucune migration de données.**

---

## 2. Inventaire fonctionnel — 10 modules

| Module | Contenu |
|---|---|
| **Accueil** | Météo AROME par parcelle, pastille météo mini, avancement global, priorité du jour, derniers travaux, **Ma part du chantier**, ★ **Mise en route** (admin) |
| **Parcelles** | Carte Leaflet, polygones KML, validation des tâches, filtres, fiche parcelle |
| **Journal** | Timeline, filtres (ouvrier/tâche/période), reconstruction 🩹, équipe en une entrée |
| **Tracteur** | Sessions, GNR, entretiens, conducteurs, matériel |
| **Phyto** | Registre, catalogue **E-Phy ANSES**, assistant 3 étapes, budget cuivre 7 ans, **export CSV réglementaire** |
| **Cave** | **TROIS sections** : **Le Chai** (élevage, fûts, part des anges, filtre et seuil par millésime) · **Le Cuvier** (vendange) · **Le millésime** (ce qui vient + la ligne de vie) |
| **La Réserve** | Intrants, achats, inventaires, **parc à fûts avec mouvements**, **bilan matière** |
| **Planning** | Grille équipe, éditeur slide-up, CP, heures sup, **annualisation 1607 h**, PDF MSA, **équipe collective**, **capacité réelle jour par jour** |
| **Pilotage** | **8 entrées, un axe de ZOOM** : Aujourd'hui · ① L'année · ② La campagne · ③ L'équipe & les tâches · ④ Simuler ┃ Cave · Économie · Conformité (+ Outils : Archives, Paramétrage). Portée unique `_PIL_SCOPE`, 4 photos en tête, moteur de diagnostic. **§34** |
| **Réglages** | Domaine (dont **SIRET & bio**), équipe, campagne, tâches, **barème de la convention**, app, ★ **Documents & impressions**, zone dangereuse |

★ **Deux pages transversales** (overlays, pas des modules du dock) : **Ma trace** (`ovMaTrace`) et
**Le domaine cette semaine** (`ovMur`) — cf. §22b.

★★ **Le hub « Documents & impressions »** (`MV_DOCS`, `MV_DOCS_FAM` dans `reglages.js`, ouvert par
`openDocs()` depuis `#regl-export-row` de l'onglet **App**) rassemble **17 documents en 3 familles** :
**Obligatoire** (registre phyto PDF et tableur, synthèse cuivre, relevé mensuel d'heures) ·
**Suivi du domaine** (rapport de saison, bilan de campagne, registre des manipulations, inventaire
des fûts et des intrants, récoltes, suivi d'élevage, carnet d'entretien, réglage Heures & ETP) ·
**Données brutes** (journal, avancement par parcelle, sauvegarde complète, restauration).
★ Un document dont le module est masqué pour l'utilisateur **n'apparaît pas** (`_docsCan`).

**Rôles** : `admin` · `ouvrier` · `tractoriste` · `saisonnier` (lecture seule) · `pilotage`
(lecture étendue, projeté).
★ **Visibilité par membre** (`m.mods`, exclusions uniquement) : `planModule ∧ !_mvModOff`.
**Restriction seulement, jamais élévation.** Réglages est **inaliénable**. C'est de la
**simplification d'interface, pas de la sécurité**.

---

## 3. Positionnement commercial

- Ma Vigne n'est **PAS** AppSheet ni du no-code — c'est une **vraie application métier**.
- Modèle : **installation + personnalisation (forfait)** + **abonnement mensuel par formule**.
  ★ **La grille d'installation est TRANCHÉE** (§26) : indexée sur la formule, avec des heures
  d'accompagnement incluses.
- Pas de paiement en self-service : conversion par **MAILTO** + `_fbSetTenantPlan` en fenêtre privée GT.
- Nico contacte ses clients **personnellement**. Ton direct, chaleureux, concis — jamais corporate.
- LinkedIn : posts #1 à #3 publiés. Cadence **mardi, tous les 14 jours, 11h30 ou 20h**.
  ⚠️ **Prévenir l'employeur avant toute sortie publique.**
- ★ **Le canal passif fonctionne** : le premier lead entrant est arrivé par le formulaire du site.
- ★ **Le barème régional (§30) est ce qui rend une vente hors Bourgogne possible.**
- ★★ **La Cave est le deuxième pilier de l'argumentaire.** Un domaine qui vinifie a le parc à fûts,
  l'agenda des quatre semaines, deux documents imprimables, un cockpit de pilotage, la projection de
  fin de malo sur ses propres analyses, et un modèle qui respecte la séparation des millésimes.
- ★★★ **L'accompagnement est devenu le troisième pilier** (chantier du 09/08 après-midi). Un
  prospect de 45 ha avec 12 salariés n'achète pas seulement des fonctions : il achète la certitude
  que son équipe saura s'en servir. Ce qu'on peut montrer : une **mise en route** qui se coche toute
  seule, une **aide par écran** qui lit la structure réelle de l'application, un **guide public** que
  l'on régénère par une commande, et un **contrôle automatique** qui refuse un build dont
  l'accompagnement a décroché du code.
- ★★★ **Et le quatrième, invisible du client : la RAPIDITÉ D'INSTALLATION** (chantier du 09/08
  soir). Un forfait de 20 h incluses tient économiquement si l'installation en coûte 9. C'est ce qui
  rend le passage à trente clients pensable (§18b, §26).

---

## 4. Stack technique

- **Build** : Vite + Rollup, sortie **IIFE**. `minify:false` en dev ; Terser `toplevel` + `unsafe` en
  prod. Hosting Firebase. ⚠️ `root:'.'`, `publicDir:'public'`, `outDir:'dist'`,
  `rollupOptions.input = { main: './index.html' }`. Assets hashés dans **`dist/assets/`**.
- **Firebase v10 modulaire** + compat `window.firebase` : Firestore (**eur3**), Auth, Storage,
  Cloud Functions (**europe-west1, Node 22**), App Check (**reCAPTCHA v3**).
- **Leaflet 1.9.4** (CDN unpkg, lazy + SRI). **Open-Meteo AROME** (~1,5 km). **Géocodage BAN**
  (`api-adresse.data.gouv.fr`, runtime navigateur, sans clé, France uniquement).
- **Polices** : Cormorant Garamond + Outfit, **auto-hébergées** (`/fonts/fonts.css`).
  ★ Elles se récupèrent aussi en paquets npm `@fontsource/cormorant-garamond` et `@fontsource/outfit`
  — c'est ainsi que sont produits les PDF (§18c).
- **CSS applicatif** : **`src/styles.css`** (asset Vite hashé, précaché). Seul le **splash** reste
  inline dans `index.html`. ⚠️ Modifier `styles.css` = **bump SW**.
  ★ **Beaucoup de CSS est injecté par les modules** (`_caveV2InjectCss`, `_mlInjectCss`,
  `_pcavInjectCss`, `_dmrInjectCss`, `_agtInsCss`, le `@media(max-width:880px)` de `pilotage.js`) :
  **c'est ce qui permet des refontes visuelles sans toucher `styles.css`.**
- **PWA** : `sw.js` + `manifest.json` + précache atomique. En-têtes HTTP + CSP + cache via
  `firebase.json > hosting.headers` (§8b).
- **Tests** : Playwright (Chromium headless) + firebase-admin en devDeps.
  ⚠️ **Le CDN de Playwright n'est PAS joignable depuis le bac à sable Claude** : les contrôles
  visuels passent par un **harnais DOM stubé en Node**, pas par une capture. Voir §6b.
  ★ En revanche **npm et PyPI SONT joignables** — c'est ce qui permet de récupérer les polices et
  d'installer `pypdfium2` pour contrôler un PDF au pixel (§18c). ★★ **Et depuis le 10/08, GitHub
  aussi est joignable** (`github.com`, `raw.githubusercontent.com`, `codeload.github.com` sont dans
  les domaines autorisés) — c'est ce qui permet le clone direct du dépôt (voir Règle d'or n°1).
- **Projet Firebase** : `mavigne-a0fd5`. Deux bases visibles : `(default)` en **eur3** (la vraie) et
  `restore-24` (à ignorer). Coût constaté ≈ 0 €.
- ⚠️ **Chargement à froid lent** : `_fbLoadAfterAuth` enchaîne ~40 `getDoc` séquentiels.
- ★ **Aucune requête Firestore filtrée** — zéro `where(`, `orderBy(`, `limit(` dans l'app **et** les
  Cloud Functions. **Conséquence : aucun index composite, et `firestore.indexes.json` n'a pas lieu
  d'exister.**
- ⚠️⚠️ **Les parcelles n'ont PAS de coordonnées GPS à elles.** Toute la géographie vit dans les
  **polygones KML** (`kml_polygons`). ★ Le résolveur de centroïde par correspondance de nom vit
  dans **`utils.js`** : **`_mvParcGeo` / `_mvKmlCtrs`**.
  ★★ **Conséquence produit : l'application n'a AUCUN import KML côté client.** C'est Nico qui pose
  les contours à l'installation, depuis la console GT. Tout écran qui proposerait au client
  d'importer ses contours l'enverrait dans le vide (§27c).
- ★ `TACHES_CATALOGUE` est une constante **régionale** (`app.js`), Côte de Nuits, 10 000 pieds/ha.
  Depuis le 04/08, `MV_BAREMES` accueille plusieurs jeux régionaux (§30).

---

## 5. Arborescence

> ⚠️⚠️ **`index.html` est à la RACINE, PAS dans `src/`.**
> Un `index.html` déposé dans `src\` **ne casse rien visiblement** : le build prend celui de la
> racine, et le fichier modifié n'a simplement aucun effet. C'est la signature exacte du
> « je déploie et rien ne change ».

```
mavigne/
├── index.html              ← À LA RACINE (shell + overlays + 4 affichages de version)
│                             ⚠️ contient AUSSI la section Réglages › Import / Export
│                                (le bouton du hub Documents est écrit en dur, PAS dans reglages.js)
│                             ★ le formulaire d'opération de cave (#cop-*), rang de millésimes
│                                et champ « acide malique »
│                             ★ et les conteneurs des widgets d'accueil (#home-demarrage, …)
├── guide/                  ← SOURCES DU GUIDE PUBLIC
│   ├── _layout.html        (habillage : en-tête, CSS, sommaire, pied de page)
│   ├── _inter.txt          (le séparateur entre deux sections — ne pas toucher)
│   └── 01-demarrer.html … 15-glossaire.html   (une section par module)
├── src/                    ← ce que Vite compile
│   ├── styles.css          (CSS applicatif, asset Vite hashé)
│   ├── app.js               (routage, dock, journal, parcelles, accueil, gating, restitution,
│   │                        TACHES_CATALOGUE, MV_BAREMES, _normalizeTaches, recalcTravaux,
│   │                        openPrompt / openConfirmDel, visite guidée _mvtSteps,
│   │                        widget Mise en route _dmr*)
│   ├── utils.js            (APP_VERSION, WHATS_NEW, MV_AIDE + assembleurs _mvAide*, logError,
│   │                        helpers, rôles, saisons, _mvNivH, densité, _mvEnContratSurPeriode,
│   │                        équipe collective, _mvParcGeo/_mvKmlCtrs, _mvCampagneDe, MV_DOC,
│   │                        le moteur _mvFut*)
│   ├── firebase.js         (COLLECTIONS, FB_REALTIME/FB_STATIC, _MV_GUARD_FLOORS, pull/listen/save,
│   │                        ★ createAuthAccount — qui accepte un tenant EXPLICITE depuis le 09/08)
│   ├── onboarding.js
│   ├── admin-gt.js         (★★ panneau GT + FICHE CLIENT + ASSISTANT D'INSTALLATION `_agtIns`
│   │                        + création de comptes en lot `_agtLot` — cf. §18)
│   ├── planning.js
│   ├── reglages.js         (+ MV_DOCS / MV_DOCS_FAM : le hub Documents)
│   ├── cave.js             (Chai + Cuvier + Le millésime + registre + bilan de campagne
│   │                        + le moteur MILLÉSIME : _copMil*, _caveSeuilOu, _mlProjMalo)
│   └── tracteur.js · phyto.js · pilotage.js · reserve.js
├── public/                 ← servi tel quel, JAMAIS compilé
│   ├── sw.js · boot.js · manifest.json · icônes · fonts/
│   ├── guide.html          GÉNÉRÉ depuis guide/ — ne plus l'éditer à la main (§27d)
│   ├── demarrage.html · logiciel-vigne.html · essai.html
│   ├── mise-en-route.html  (formulaire d'installation client — noindex, JAMAIS dans sitemap.xml ;
│   │                        ★ ENVOIE désormais ses réponses en base, §27f)
│   ├── cgu.html · dpa.html · confidentialite.html · mentions-legales.html
│   └── robots.txt · sitemap.xml
├── functions/              ← index.js (backups), claims.js, ephy.js,
│                              ★ leads.js (submitLead + submitMiseEnRoute)
├── scripts/                ← inject-precache.mjs (IDEMPOTENT), preflight.mjs (C1→C22),
│                              preflight-baseline.json, build-guide.mjs,
│                              smoke.mjs, e2e-local.mjs, e2e.mjs + e2e-seed.mjs
├── firebase.json · firestore.rules · storage.rules
└── vite.config.js · eslint.config.js · package.json
```

⚠️ **`firestore.indexes.json` N'EXISTE PAS** et ne doit pas être créé.

⚠️ **Récapitulatif du placement** : `index.html` → **racine** · `app.js`, `utils.js`, `styles.css`,
modules JS → **`src\`** · `sw.js`, `boot.js`, pages publiques → **`public\`** · sources du guide →
**`guide\` à la racine** · `claims.js` et `leads.js` → **`functions\`** · `preflight.mjs` et
`build-guide.mjs` → **`scripts\`** · `firebase.json` → **racine**.
Un fichier au mauvais endroit se déploie sans effet et **sans erreur**.

⚠️ **Ne pas confondre `firebase.js` et `firebase.json`.**

★ **Hors dépôt (ni déployé, ni versionné dans `mavigne-dev\`)** : `..\mavigne-sauvegardes\juridique\`
(copies archivées des CGU/DPA signées + empreintes SHA-256, §26b), et `..\mavigne-sauvegardes\` pour
`mvprint.py`, `comparateur-kml-parcelles.html`, ★ `INSTALLER-UN-DOMAINE.md` et `mkpdf.py` (§18c).

**★ Ordre d'import RÉEL dans `app.js`** (revérifié par grep) :
`styles.css → utils → firebase → onboarding → admin-gt → cave → planning → reglages → **tracteur**
→ phyto → pilotage → **reserve**`.
⚠️ **`reserve.js` est importé EN DERNIER**, `phyto.js` **après** `tracteur.js`, et
★ **`cave.js` AVANT `reglages.js`, `pilotage.js` et `reserve.js`** — c'est ce qui permet à ces
trois modules d'appeler les fonctions de la Cave sans repli.
★★ **Corollaire pour l'aide** : `utils.js` étant importé **en premier**, `MV_AIDE` ne peut rien lire
des autres modules **au chargement**. Mais l'aide s'ouvre **sur un clic**, quand tout est chargé :
c'est ce qui rend possible le point d'aide dynamique (§27b).

---

## 6. Build & déploiement

```
npm run build && firebase deploy
```

- ⚠️ **JAMAIS** de second `&& node scripts/inject-precache.mjs` : la 2ᵉ passe sort en `exit(1)` →
  **deploy annulé**. Le script est **idempotent**, il tourne déjà en `postbuild`.
  ★★ **C'est aussi la raison pour laquelle `build-guide.mjs` N'EST PAS dans le build** (§27d) :
  on ne rajoute rien à cette ligne.
- `package.json` reste `"1.0.0"` — ce n'est pas un compteur de release.
- **Préversion** : `npm run deploy:staging` = `firebase hosting:channel:deploy staging --expires 30d`.
  ⚠️ **Isole le frontend seul** : Functions et rules restent globales.
- ✅ **`"site": "mavigne-a0fd5"` est présent** dans `firebase.json`.
- `firestore: deploying indexes` en erreur interne = **transitoire** : relancer, ou
  `--except firestore:indexes`.
- Avertissement Vite `chunk > 800 kB` = **non bloquant**.
- ⚠️ **Jamais d'`import()` dynamique** : l'app repose sur `window.X()` + `onclick` inline.
- **Ordre de déploiement backend NON NÉGOCIABLE** : `functions` → **BACKFILL** (console,
  `{timeout:300000}`) → `hosting` → `rules`. Rules avant backfill = **tous les admins perdent
  l'écriture instantanément**.
- ★ `claims.js` seule : `--only functions`, aucun bump.
- ★★ **Une Cloud Function précise : `--only functions:<nom>`.** À préférer systématiquement —
  `--only functions` redéploie `claims.js`, `index.js` et `ephy.js` sans raison. Utilisé pour
  `submitMiseEnRoute` (§18b).
- ★ `firebase.json` seul : `--only hosting`, **aucun bump**.
- ★ Une page de `public/` seule : `--only hosting`, **aucun bump**.
- ★★ **Le guide public : `node scripts/build-guide.mjs` puis `firebase deploy --only hosting`,
  aucun bump** (§27d).

## 6b. Paliers de test

| Palier | Commande | Couvre |
|---|---|---|
| **0 — preflight** | `npm run check` (auto `prebuild`) | **C1 → C22** : statique + invariants anti-perte **exécutés** |
| **1 — smoke** | `npm run test:smoke` | l'app **boote** sans exception + 23 globals |
| **2 — E2E local (DÉFAUT)** | `npm run test:e2e` | **login DOM réel + 10 pages + interactions** |
| **2bis — E2E émulateurs** | `npm run test:e2e:emu` | + couche Firestore réelle — **BLOQUÉ SDK** |

⚠️ **`smoke.mjs` sert `dist/`** → il teste le **dernier build**, pas les sources.

★ **`e2e-local.mjs` couvre 10 pages** et **six étapes d'interaction** : `saison`, `session`,
`onglets`, ★ `dock` (⚠️ **réduit le viewport à 390×844 avant de tester** — sinon `pc=true` et la
répartition mobile n'est jamais exécutée), et ★ `saisie` (ouvre `#ovPrompt`, vérifie la valeur
**posée en JS**, virgule française).

⚠️ **Piège vécu dans le test lui-même** : nommer une variable de boucle `page` **masque l'objet
`page` de Playwright**.

⚠️⚠️ **Aucun palier ne teste le CONTENU des pages publiques.** Contrôle **humain**, trimestriel.

**Reste irréductiblement manuel** : le test **deux appareils** sur La Réserve, la relecture des
pages juridiques, et l'œil humain sur le rendu.

★★ **Harnais fonctionnel (méthode C20 généralisée) — le réflexe par défaut.**
Pour toute logique de calcul, **extraire les vraies fonctions du fichier livré et les exécuter** sur
des scénarios écrits à la main, avec stubs minimaux.

★★ **Quatre formes de harnais :**
1. **Le harnais MOTEUR** — les fonctions de calcul pures, sur des scénarios chiffrés.
2. **Le harnais DOM** — le VRAI fichier chargé dans un `vm` avec un `document` stubé, puis les
   fonctions de rendu appelées pour de bon. On y vérifie : aucun `undefined`/`NaN` dans le HTML,
   balance `<div>`/`<span>`/`<table>`, **aucun `<div>` dans un `<button>`**, largeurs entre 0 et
   100 %, ★ **aucun double échappement** (`&amp;amp;`), les gardes (non-admin, données vides), et
   ★ **que les valeurs sont posées EN JS et non en attribut HTML**.
   ⚠️ **Le stub `Blob` + `URL.createObjectURL` permet de CAPTURER un document imprimable** sans
   navigateur : c'est ainsi que le registre et le bilan ont été testés (§20f).
3. ★★★ **Le harnais INTÉGRÉ — la forme la plus importante.**
   **On n'invente aucun moteur : on les EXTRAIT du vrai fichier et on les branche.** Un stub écrit
   à la main a sa propre signature et ment sur celle du vrai code.
   Patron : une fonction `corps(nom)` qui découpe par comptage d'accolades (elle doit gérer
   **`function X(`**, **`async function X(`** ET **`window.X = function(`**), puis `vm.runInContext`.
   ★ Prévoir les **dépendances en chaîne** : `_mlChaine` en a six.
   **Une dépendance manquante fait lever, le `catch` de repli l'avale, et l'écran sort vide — on
   croit alors à un bug du code alors que c'est le harnais qui est incomplet.**
4. ★★ **Le harnais BACKEND** (nouveau, 09/08) — un fichier de `functions/` chargé dans un `vm` avec
   un **faux `require`** : `firebase-functions/v2/https` renvoie un `onRequest` qui capture
   `{opts, fn}`, `firebase-admin` un Firestore factice à `runTransaction`, `crypto` un hachage
   lisible. On exécute alors la vraie fonction sur des requêtes complètes : méthodes, gardes,
   leurre anti-bot, fusion, bornage, mail, panne d'écriture. **Aucune ligne du fichier n'est
   réécrite.**

⚠️⚠️ **Quatre règles nées des journées du 07 et du 09/08 :**
- ★ **Un harnais doit compter un PLANTAGE comme rouge.** Sans `try/catch` autour de l'appel testé,
  une exception fait sortir le script en erreur et on lit « muet » là où il faudrait lire « rouge ».
- ★★ **Et le LANCEUR doit lire le code retour.** Vécu le 09/08 : un script qui affichait la dernière
  ligne de chaque harnais montrait « 23 vertes » pour un harnais qui avait explosé avant la fin.
  Le lanceur compte désormais un code retour non nul comme un échec, quoi que dise la sortie.
- ★ **Une contre-épreuve devenue muette n'est pas toujours un trou.** Après avoir rendu une branche
  autonome (`if(!k){cacher();return;}`), désactiver la garde d'avant produit exactement le même
  résultat : c'est de la défense en profondeur, pas un test aveugle. **Se demander pourquoi avant
  de conclure.**
- ★★★ **Le harnais et le preflight ne se remplacent pas.** Le 09/08 au soir, le preflight a vu
  **six fonctions non exposées sur `window`** que les harnais ne pouvaient pas voir (ils appellent
  les fonctions directement, pas par un `onclick`) ; et les harnais ont vu des erreurs de modèle
  que le preflight ignore complètement. **Lancer les deux, toujours.**

Prises réelles de la méthode :
- `eqNote`/`retNote` utilisés avant déclaration ;
- un filtre de retard sur `cd.debut/cd.fin` au lieu de `_saisonForDate()` ;
- le premier frame `requestAnimationFrame` à `ts=0` ;
- l'invariant `mine + them === done` de la série UX-R ;
- la répartition du dock jouée sur **9 profils réels** ;
- **103 scénarios** sur la refonte Économie · **77** sur la vendange-couperet ;
- la série Cave des 06-07/08 : **~770 assertions** ;
- le 09/08 matin : **28** sur l'écart de cadence, **8** sur la visite guidée, **73** sur les fiches
  d'aide, **27** sur le widget Mise en route ;
- ★ le 09/08 soir : **354 assertions sur 9 harnais** pour la série installation, dont un harnais
  backend complet sur la Cloud Function.

⚠️⚠️ **Écrire les assertions à la main expose aussi les erreurs du TEST.**
Sur la seule journée du 09/08, **sept séries d'assertions étaient fausses pour zéro bug** : un oubli
de paire dans un scénario, une `meteo:true` prise pour une trace de travail, de l'arithmétique de
tête, un `_dmrGo` cherché sur le mauvais objet, un test « aucun demi-surrogate » qui appelait
`charCodeAt(0)` sur des émojis astraux (**dont la paire de surrogates est parfaitement légitime**),
★ un ordre figé entre deux distances devenues égales après un correctif, ★ un ancrage de recherche
trop large qui retrouvait le mot cherché dans la ligne « Déjà posé ici », et ★ un motif de grep
qui n'existait nulle part.
**Quand une assertion tombe, se demander D'ABORD laquelle des deux a tort.**

★★ **Mais une assertion fausse révèle souvent un vrai défaut.** Le 09/08, la vérification de
`_dmrGo` a mis au jour que j'avais livré des **libellés client sans accents** (« Vos periodes »,
« Le bareme de vos taches ») dans un widget vu par le vigneron.
★ **Corollaire : relire ses propres textes destinés au client comme on relit du code.** Le style du
fichier peut être « commentaires sans accents » — les chaînes affichées, jamais.

⚠️ Même principe pour `WHATS_NEW` : **exécuter le tableau en Node**, jamais le relire.
⚠️ **Extraire les blocs dans l'ORDRE RÉEL du fichier** (repérer les index avec `str.index`).
⚠️ ★ **Un stub trop généreux ment.** Si le harnais fournit une donnée que le vrai code ne produit
pas, tout passe au vert et l'écran sort vide en production.
★★★ **Et un stub qui IGNORE LES ARGUMENTS ment tout autant** : `_mvFutParc = () => PARC` rend vrai
n'importe quel appel, y compris `_mvFutParc()` nu, qui en production renvoie zéro (§25).
⚠️ ★ **Un stub trop RESTRICTIF ment aussi, dans l'autre sens.** Vécu le 09/08 : le
`querySelector` du harnais DOM ne reconnaissait pas les attributs contenant un chiffre
(`data-pd1`) → un vrai code correct sortait rouge. **Un stub est du code : il se débogue.**
★ **Vérifier qu'un test attrape bien le bug** : réintroduire volontairement le défaut et constater
que le harnais rougit.

---

## 6c. ★★ Preflight v2 — le cliquet anti-régression

### ★ TROIS HARNAIS NEUFS, BRANCHÉS EN CI (15/08, §42)

`.github/workflows/ci.yml`, étape « Harnais — echelle, pastille « i », carte a trois etages » :

| harnais | ce qu'il interdit |
|---|---|
| `mv-harnais-echelle.mjs` | qu'une **taille de texte** soit réinventée hors des onze pas ; qu'un appel perde son **repli** ; qu'un pas soit déclaré sans emploi ou invoqué sans déclaration |
| `mv-harnais-info.mjs` | qu'une **pastille ouvre une fiche vide** ou qu'une fiche reste **orpheline** ; que l'écouteur perde son `stopPropagation` ; qu'une **fiche vivante** échappe à sa déclaration ; qu'un **sous-titre de carte** dépasse la ligne de cadre |
| `mv-harnais-carte.mjs` | que le **chiffre ou son cadre** sortent de l'en-tête (vérifié **en exécutant `_pilTile`**) ; que la **migration d'état** cesse d'atteindre les clients (vérifiée **en l'exécutant** sur un état mémorisé réaliste) ; que le **chrome** regonfle |

⚠️ **Un harnais qui déménage doit rougir.** Quand l'échelle de texte est passée de `_pilCssV2()` à
`styles.css`, `mv-harnais-echelle` est monté à **13 rouges** : c'est exactement son travail. Le
réflexe n'est pas de le contourner, c'est de le **suivre**.

★ **`A8` de `mv-harnais-audit-pil` était un cliquet À L'ENVERS** — il exigeait *exactement* 8 boutons
de redirection, donc rougissait dès qu'on en **ajoutait** un. Converti : **le compte ne descend
jamais**. À vérifier sur tout contrôle écrit avec un `===` : compte-t-il ce qu'on veut interdire, ou
ce qu'on veut encourager ?

`scripts/preflight.mjs` tourne en `prebuild`.
**C'est un outil de développement : jamais déployé → zéro risque client, aucun bump.**

| | Règle | Mode |
|---|---|---|
| C11 | `getElementById('x')` où `x` n'est créé nulle part | cliquet |
| **C12** | **clé de `COLLECTIONS` ni dans `FB_REALTIME` ni dans `FB_STATIC`** | **erreur, tolérance 0** |
| **C13** | **clé écrite par `fbSave`/`saveData` sans plancher `_MV_GUARD_FLOORS`** | **erreur, tolérance 0** |
| C14 | `catch {}` vide | cliquet |
| **C15** | **fonction déclarée sans aucun appelant** | **cliquet** |
| C16 | `confirm`/`alert`/`prompt` natifs | cliquet |
| C17 | module sans `const DEBUG` du tout | avertissement |
| C18 | id dupliqué dans `index.html` | cliquet |
| C19 | champ utilisateur interpolé dans du HTML sans `_esc*` | cliquet |
| **C20** | **invariants anti-perte vérifiés EN LES EXÉCUTANT** | **erreur** |
| **C21** | **`paie` ne doit jamais toucher le disque** | **erreur** |
| ★★ **C22** | **l'accompagnement ne doit pas décrocher du code** | **erreur, tolérance 0** |

**C13 a une liste d'exemptions explicites et commentées** (`GUARD_EXEMPT`) : `travaux`, `reparateur`,
`kml_polygons`, `catalogue`. Pour exempter une clé, **il faut écrire pourquoi**.

**C20 n'analyse pas le code, il l'exécute** : 17 scénarios.

⚠️ **C19 vécu** : des `<b>` bruts dans `MV_AIDE` ont fait rejeter un livrable → format
`[amorce, suite]` en **texte pur**.

⚠️ **C14 — la règle EXACTE de comptage** : `catch\s*\([^)]*\)\s*\{\s*\}`.
★ **Elle attrape donc `catch(_){ }`**, y compris celui d'un logger qui ne peut pas se logger
lui-même. **Correctif : tester `if(window.logError)` au lieu d'envelopper.**
★ **Compter avec la regex du preflight, pas avec un grep artisanal.**
★ Note : un `catch(e){ /* commentaire */ }` **n'est pas compté** par cette regex. C'est acceptable
quand le commentaire explique une reprise volontaire (essayer l'adresse suivante) **et** que
l'échec final est rapporté à l'utilisateur — jamais pour avaler une erreur en silence.

★★★ **C15 — LA RÈGLE QUI MORD LE PLUS SOUVENT. À lire avant tout lot.**

**C15 raisonne FICHIER PAR FICHIER.** Une fonction déclarée `function X(){…}` dans un fichier et
appelée uniquement depuis un AUTRE fichier est comptée comme morte.

Cas vécus :

1. **Le moteur livré en avance sur son écran.** **Ne jamais livrer un moteur sans son appelant.**
2. **La fonction appelée depuis un onclick d'ailleurs** → l'écrire `window.X = function(){…}`
   (`_bcExportChoix`, `_mlProjMalo`, `_pcavGo`, `_dmrGo`, ★ `agtInsRepr`, ★ `agtInsFut`).
   ⚠️ **Effet de bord : un harnais qui extrait par `indexOf('function X(')` cesse de la trouver.**
   Un extracteur doit gérer les trois formes.

★ **Le critère de comptage correct** : compter **toutes** les mentions, point compris, puis retirer
**1 (déclaration) + 2 × nombre d'exports**. ⚠️⚠️ **Ce critère ne vaut PAS pour une expression
`window.X = function`** : il n'y a alors pas de déclaration séparée, et un compteur artisanal
annonce « MORTE » à tort.
**★★ Conclusion : ne pas raisonner sur un compteur maison — LANCER LE VRAI PREFLIGHT.**

★ **Contre-exemple utile** : `_rmExportChoix` est une **déclaration** classique, appelée depuis un
`onclick` écrit dans une chaîne HTML de `cave.js` lui-même. Cette occurrence textuelle suffit à C15.
**La différence entre les deux cas tient à un seul `onclick`, dans le bon fichier ou non.**

★★★ **CE QUE LE PREFLIGHT NE VOIT PAS — LE CONTRÔLE MAISON DES HANDLERS (09/08).**
**Le preflight ne teste que `onclick`.** Or `onblur`, `onchange`, `oninput` et `onsubmit` subissent
**exactement le même sort** après le build IIFE : une fonction locale est invisible depuis un
handler écrit dans du HTML, et **le bouton ne fait rien, en silence**.
Vécu : sur le lot des périodes, le preflight a signalé six `onclick` non exposés — mais
**`agtInsPerDate`, branchée sur `onblur`, n'aurait été signalée par rien**, et les dates de période
ne se seraient jamais enregistrées.
**Contrôle à lancer sur tout fichier qui construit du HTML :**

```python
h = set(re.findall(r'on(?:click|change|blur|input|submit)=\\?"([A-Za-z_$][\w$]*)\s*\(', src))
manquantes = [f for f in h if not re.search(r'window\.' + re.escape(f) + r'\s*=', src)]
```

★ Résultat attendu sur `admin-gt.js` : **une seule** fonction non exposée, `openOv`, qui est une
globale de `app.js`.

### ★★★ C22 — l'accompagnement ne doit pas décrocher du code (09/08)

**Pourquoi il existe.** L'aide contextuelle, la visite guidée et le guide public décrivent des
écrans. Quand un écran bouge, ils mentent — **et en silence** : `document.querySelector()` qui ne
trouve rien renvoie `null`, il **ne lève pas**, donc aucun `catch` de repli ne se déclenche.
Vécu : la clé d'onglet `ecf` a disparu au regroupement du Pilotage ; la visite publique a continué
à la demander pendant des semaines, projecteur posé au hasard, **sur le lien de démo publié**.

**Ce qu'il vérifie**, en tolérance zéro et sans aucune clé de baseline :

- **a.** une clé d'onglet **retirée** (celles de `_PIL_TAB_MIGR`, qui ne sert qu'à migrer l'onglet
  mémorisé) ne doit plus être citée comme littéral hors de `pilotage.js` ;
- **b.** tout `[data-tab="…"]` écrit en dur doit appartenir à `_PIL_VALID_TAB` ;
- **c.** chaque `#id` et `.classe` visé par la visite guidée doit exister dans les sources ;
- **d.** chaque `window.X()` appelée par la visite doit être définie (liste `WIN_NATIF` pour les
  objets du navigateur) ;
- **e.** chaque fiche `MV_AIDE` doit avoir sa page `#page-<clé>`, et chaque page sa fiche
  (liste `AIDE_EXEMPT`, commentée : `admin-gt` et `chat` sont hors périmètre client) ;
- **f.** chaque `ancre` de fiche doit être un `id` réel de `public/guide.html`.

⚠️⚠️ **DÉFAUT DU CONTRÔLE, trouvé par contre-épreuve et corrigé** : le corpus de recherche de (c)
doit **EXCLURE le bloc `_mvtSteps` lui-même**. Sinon un sélecteur écrit là est sa **propre preuve
d'existence**, et le contrôle ne détecte jamais rien. Cinq contre-épreuves ont été rejouées après
correction ; les cinq rougissent.

⚠️⚠️⚠️ **CE QUE C22 NE FAIT PAS, ET NE FERA JAMAIS : juger un texte.** Il vérifie que les
sélecteurs pointent quelque part, pas que la phrase dit la vérité. **Une fiche peut être verte au
preflight et complètement périmée.** La mise à jour éditoriale reste une décision humaine, à
prendre **au moment du lot** (§27a).

**Le cliquet.** La référence vit dans `scripts/preflight-baseline.json`. Plus que la référence →
**ERREUR nommée** ; égal → silence ; moins → **avertissement « regraver »**.
Régénérer : `node scripts/preflight.mjs --baseline`.
⚠️ **Ne jamais regraver pour faire taire une erreur rouge.**
★★ **Le corollaire : après une baisse, il FAUT regraver**, après avoir prouvé **clé par clé** qu'il
n'y a aucune hausse. C'est ce qui distingue une regravure légitime d'un étouffement.
✅ **La baseline a été regravée**, elle est datée du 09/08.
⚠️ **Ne pas regraver depuis une arborescence reconstituée par Claude** : le `package.json` de
`/mnt/project` est celui de **`functions/`**, pas celui de la racine → faux avertissement « build
n'appelle pas inject-precache ». Le retirer de la racine reconstituée.

★ **Niveau de référence à connaître** : sur une arborescence reconstituée saine, le preflight sort
**0 erreur et 11 avertissements**, tous des baisses préexistantes plus le faux positif
`package.json`. **Toute valeur supérieure vient du lot en cours.**

⚠️ **Avant toute livraison, compter les `catch{}` du fichier de base et vérifier que le patché n'en
ajoute pas.** Remplacement type : `window.logError({level:'info', cat:'…'})`.

---

## 7. Versioning — deux séquences indépendantes

**Séquence APP** (visible du client) :
1. `APP_VERSION` dans `src/utils.js` — ⚠️ la forme réelle est **`export const APP_VERSION = '…';`**
2. **4 affichages RÉELS** dans `index.html` (**à la racine**) : footer `·`, `.mod-header-sub`,
   `.ver-tag`, `#wn-version-badge`
   ⚠️ **JAMAIS** les commentaires CSS `(vX.XX)`, ⚠️ **JAMAIS** le `v5.12` du commentaire HTML de
   l'Élevage.

**Séquence SW** (invisible du client) — bumpée à **chaque** modification de `index.html` /
`app.js` / `utils.js` / `styles.css` :
1. en-tête `// MA VIGNE — Service Worker vX.YY`
2. `CACHE_NAME = 'mavigne-vX.YY'`
3. **2 `console.log`**
4. **1 ligne de changelog** en tête de fichier (on **prépend**)

⚠️⚠️ **PIÈGE DU REMPLACEMENT GLOBAL, vécu quatre fois.**
Un `sw.js.replace(ancien, nouveau)` global touche **aussi la ligne de changelog du lot précédent**,
qui décrit un tout autre travail. Symptôme : deux lignes portent le même numéro et l'historique ment.
**Procédure sûre :** remplacer globalement, **puis restaurer la ligne de changelog précédente**,
**puis prépendre** la nouvelle. Vérifier ensuite que l'ancien numéro subsiste **exactement une
fois** dans le fichier — c'est l'assertion qui ferme le piège.

**Ne bumpe RIEN** : modifier seul `pilotage.js` · `planning.js` · `firebase.js` · `reglages.js` ·
`cave.js` · `tracteur.js` · `phyto.js` · `reserve.js` · `admin-gt.js` · `onboarding.js`.
Backend seul non plus. **`firebase.json` non plus.** **`scripts/` non plus.** Les pages statiques
hors `SHELL_STATIC` / `PRECACHE_ASSETS` non plus — ★ **`public/guide.html` et
`public/mise-en-route.html` en font partie**.

★★ **Deux modules JS ensemble ne bumpent pas non plus.**
**Conséquence pratique : des lots VISIBLES du client peuvent s'accumuler sans annonce.**
★★ Vécu trois fois : les lots C et D du 07/08, **l'écart de cadence du 09/08 au matin**
(`pilotage.js` seul), qui changeait un chiffre affiché sans que rien ne le dise, et ★ **toute la
série installation du 09/08 au soir** — cinq lots, `admin-gt.js` + `firebase.js` + backend + une
page publique, **aucun bump**, mais **invisible du client par construction** (tout se passe dans la
console GT).
**Règle retenue et APPLIQUÉE : quand un lot visible part sans bump, le prochain bump l'annonce dans
son `WHATS_NEW`.** Le récap cumulatif (`_whatsNewSince`) fait le reste.
★ **Nuance utile** : un lot GT n'a rien à annoncer au client. Ne pas encombrer `WHATS_NEW` de
travaux qu'aucun vigneron ne verra jamais.

★ **Cas « identité légale »** (SIRET, adresse, téléphone) : `index.html` et `app.js` sont touchés →
**bump SW obligatoire**, mais `utils.js` ne l'est pas → **`APP_VERSION` inchangé**, `WHATS_NEW`
intact. Modèle du **correctif invisible**.
★ **Même cas le 09/08 pour le correctif `ecf`** : il ne touchait que la démo publique, donc
`WHATS_NEW = []` et bump SW seul.

★★ **Règle du doute sur le SW — l'asymétrie tranche toute seule.**
Quand on livre un second lot sans savoir si le précédent a été déployé : **toujours bumper**.
- Réutiliser le numéro N alors que N est déjà en ligne → les clients déjà passés en N **gardent
  l'ancien `index.html` pour toujours**. Grave, silencieux, difficile à diagnostiquer.
- Sauter un numéro → **aucune conséquence**.

**`WHATS_NEW`** (dans `utils.js`, forme réelle **`export const WHATS_NEW = [`**) = journal
**versionné** `[{v, items:[{emoji,titre,desc}]}]` : on **préfixe un bloc**, jamais on ne remplace ;
récap **cumulatif** via `_whatsNewSince`/`_cmpVer` ; sous-lot technique = `items:[]` ; correctif
invisible = `WHATS_NEW = []` et **bump SW seul** ; rédaction **du point de vue de l'utilisateur** —
le problème vécu d'abord, le correctif ensuite.

⚠️⚠️ **Un `WHATS_NEW` n'est PAS une preuve de livraison.** **Lire la fonction.**

★ **Contrôle systématique, à exécuter en Node** : tête du tableau === `APP_VERSION`, ordre
décroissant strict, zéro version en double, zéro backslash visible, zéro **demi-surrogate ISOLÉ**,
puis `_whatsNewSince` joué sur la version précédente (→ 1 bloc), une version ancienne (→ récap
cumulatif), la version courante (→ rien), une version future (→ rien).
★ **Patron d'exécution** : découper le tableau du fichier, remplacer `export const` par `const`,
ajouter `export {WHATS_NEW};`, et l'importer en `data:text/javascript;base64,…`.
⚠️ **Le contrôle des surrogates doit vérifier l'APPARIEMENT**, pas la simple valeur : un émoji hors
BMP est représenté par une **paire** légitime, et `charCodeAt(0)` sur ce caractère renvoie son
premier surrogate. Un test naïf déclare une faute là où il n'y en a pas (vécu le 09/08).

★★ **Un usage de plus :** annoncer **l'assiette d'un chiffre** quand il peut être mal lu.
« la surface travaillée additionne les passages », « le rendement moyen ne porte que sur les
parcelles récoltées », « sans réglage propre, un millésime suit le seuil général ».
**Un chiffre juste mais mal compris vaut un chiffre faux.**

### ⚠️⚠️ Émojis

Dans le **fichier JS livré**, un échappement s'écrit **`\u{1F529}` avec UN SEUL backslash**.
Écrire `\\u{…}` produit du **texte littéral affiché à l'écran**, en silence.
(En Python, il faut une chaîne `r"""…"""` ou un doublement contrôlé. Vérifier par
`frag.count('\\')` sur le fragment écrit, jamais à l'affichage des outils, qui **double** les
backslashes.)
Interdiction **inchangée** : jamais un **demi-surrogate isolé** → `open('w')` **tronque le fichier**.
⚠️ **Sélecteur de variante** `\u{FE0F}` derrière les pictogrammes à forme texte (🗓 ⚙ ⏱ ✏ 🕰 🗃 ↩ 🗑).
⚠️ **Piège d'ancre Python** : dans une chaîne `r'''…'''`, `\"` produit backslash + guillemet.
⚠️ ★ **Dans un PDF, c'est l'inverse du web** : les polices du projet (latin) n'ont **aucun** émoji,
et un caractère absent sort en **carré noir** que l'extraction de texte ne voit pas (§18c).

---

## 8. Service Worker

- Précache **atomique** : `SHELL_STATIC` + `PRECACHE_ASSETS`. Si un seul asset échoue, l'install
  échoue → pas de cache moitié-ancien/moitié-neuf.
- `index.html` en **network-first** ; `/assets/` en cache-first (noms hashés).
- ⚠️ `SHELL_STATIC` ne contient que `icon-192.png`, `icon-512.png`, `logo-gt.png` et `boot.js` :
  **les pages juridiques, le guide et le formulaire de mise en route ne sont pas précachés**. Mais
  l'`index.html` qui embarque les CGU/DPA **en app**, lui, exige le bump.
- Cache tenant séparé (`TENANT_CACHE`), purge des anciens caches à l'`activate`.
- `boot.js` précaché : si `__MV_BOOTED` absent après 10 s → rechargement auto, puis « Réessayer ».
- **Mise à jour actuellement FORCÉE** par trois mécanismes cumulés : `skipWaiting()`,
  `clients.claim()`, et `location.reload()` sur `controllerchange`.
  ⚠️ Le chemin « reload poli » via `_swUpdatePending` est **du code mort**.
- ★ **Piste étudiée (non livrée)** : retirer `skipWaiting()` automatique, afficher un **bandeau** et
  utiliser le `postMessage({type:'SKIP_WAITING'})` **déjà présent**. Niveau 1, par appareil.

## 8b. En-têtes HTTP, CSP & cache

| Portée | En-tête | Valeur |
|---|---|---|
| `**` | Strict-Transport-Security | `max-age=31536000` |
| `**` | Content-Security-Policy | **mode ENFORCE** |
| `**` | X-Content-Type-Options | `nosniff` |
| `**` | Referrer-Policy | `strict-origin-when-cross-origin` |
| `**` | X-Frame-Options | `SAMEORIGIN` |
| `**` | Permissions-Policy | `geolocation=(self), camera=(), microphone=(), payment=()` |
| `/sw.js` | Cache-Control | `no-cache` |
| `@(/\|/index.html)` | Cache-Control | `no-cache` |
| `/assets/**` | Cache-Control | `public, max-age=31536000, immutable` |

★ **Redirection 301** : `/logiciel-vigne` → `/logiciel-vigne.html`.

⚠️⚠️ **La CSP est en ENFORCE, et l'était déjà avant le 01/08. SEC-3 est fait.**
Ce qui reste vrai : la CSP autorise **`'unsafe-inline'` en `script-src`**, obligatoire tant que
l'app repose sur les `onclick` écrits dans le HTML — décision d'architecture **gelée**.
★ **Elle autorise aussi `connect-src` vers `*.cloudfunctions.net` et `*.run.app`** — ce qui suggère
que les formulaires publics appellent les Cloud Functions **en URL absolue**, et non par une
réécriture `/api/…`. ⚠️ À vérifier : `rewrites` est **absent** du `firebase.json` lu (§18b).

★★ **Pourquoi le `Cache-Control` comptait.** Il n'y en avait **aucun** : Firebase applique alors son
défaut (≈ 1 h) **à tout**, y compris `sw.js`. Après un déploiement, un client déjà installé pouvait
rester **jusqu'à une heure sur l'ancien service worker**, **sans aucun signal**.
- `no-cache` ne veut **pas** dire « pas de cache » mais « revalider avant de servir » → 304.
- Il faut **`/` ET `/index.html`** : une requête sur `/` ne correspond pas au motif `/index.html`.
- ⚠️ **`/fonts/` volontairement laissé au défaut** : les polices ne sont pas hashées.

⚠️ **Toute modification de la CSP = bump `sw.js`** (un SW fige sa CSP à son installation).
⚠️ En cas de conflit sur une même clé, Firebase applique le **dernier** bloc qui correspond.

★ **Les documents imprimables chargent `/fonts/fonts.css`** en absolu (§20f) : c'est ce qui donne
Cormorant et Outfit dans un onglet ouvert depuis un Blob. Aucun CDN, aucune requête externe.
★ **Le guide public aussi** : ses sources et son layout n'ont aucune dépendance externe.

---

## 8c. Sécurité — rules, claims, lots SEC

**Claims** (plafond 1000 octets) : `tenant:"slug"` · `ro:true` · `gtAdmin:true` · `demo:true` ·
`adm:true` · `plan` · `trial_until` · `mustpwd` · ★ `gts` (expiration de session GT, SEC-GT/2).

⚠️ **RÈGLE ABSOLUE** : `setCustomUserClaims()` **remplace l'intégralité** des claims. **Toute**
écriture passe par `mergeClaims()` / `mergeClaimsUid()` — `setCustomUserClaims` n'apparaît
qu'**une seule fois** dans tout `claims.js`, dans `_mergeInto`.

**Lots livrés** : **SEC-1** (verrou d'écriture serveur, `adm:true`) · **SEC-2** (mots de passe
individuels, claim `mustpwd`) · **SEC-3** ✅ (CSP en enforce) · **SEC-4** (`storage.rules`) ·
**SEC-5** (logout : purge `LS_KEY` + `mavigne_backup_*`, **file offline préservée**) · ★ **HSTS** ·
⚠️ **SEC-GT/2** (code à usage unique par e-mail, 06/08) — repéré au changelog, **non documenté ici**.

⚠️ **SEC-1 — RÈGLE DE LECTURE : NE JAMAIS RESTREINDRE LES LECTURES.**
`_pullKeys` lit **26 collections en parallèle**. Un refus de lecture = clé non appliquée =
`_mvKeyLoaded[key]` faux = la Couche 2 anti-perte refuse **toutes** les sauvegardes de cette clé.
Symptôme : « je ne peux plus enregistrer », **aucune trace**.

⚠️ **`assertRealEmailForAdmin`** : les adresses factices sont bloquées pour un admin. Un nouveau
claim ne prend effet **qu'après rechargement** (cache de jeton ~1 h).
⚠️⚠️ **Trois choses distinctes sur les adresses fictives** :
1. la **regex de détection** côté serveur couvre `@mavigne.app` **et** `@mavigneapp.fr` ;
2. la **convention réelle d'un domaine** n'est ni l'une ni l'autre par défaut — elle se **déduit**
   des comptes déjà en place (§18b) ;
3. un **administrateur** ne peut pas avoir d'adresse fictive : c'est son seul moyen de récupérer
   son accès. ★ L'écran de création en lot le dit **avant** d'essayer.
⚠️ **Accorder `admin` expose les rémunérations des collègues** (`paie`) — à discuter avant.

**Projeté — rôle `pilotage` (`pil:true`)** : lecture étendue y compris `paie`, **aucune écriture**.
**Deux arbitrages avant** : `paie` complet ou `paie_agg` agrégé ; inscription au registre art. 30.

---

## 9. Sauvegardes, monitoring & ★★ journal des erreurs

- **Export Firestore natif quotidien** (2 h Paris) → `gs://…/backups/firestore/DATE`, rétention 7 j.
- **Backup JSON par tenant quotidien** (3 h), rétention 30 j.
- ⚠️ **Piège IAM** : rôle `datastore.importExportAdmin` requis sur le service account.
- **Alertes log-based GCP** (severity ≥ ERROR) → `ngdevpro@gmail.com`.
- **Filet côté Nico** : `xcopy` + **historique Firebase Hosting** + (depuis le 10/08) **l'historique
  Git du dépôt** `4ss4ss1/mavigne-dev`.

### ★★★ Le journal des erreurs — rebranché le 26/07/2026

**Le plus gros bug silencieux de l'histoire du projet.** `logError` écrivait dans
`_guerettech/errors_…`, réservée au compte GT par les rules → **chaque erreur client était refusée
depuis la mise en service**, et le refus était avalé par un `catch{}` vide.

Le plus frustrant : **`window.fbAppendError` existait déjà**, écrivait au bon endroit
(`mavigne_{slug}/error_log`), était **déjà autorisé** et **déjà lu**.

**Correctif** : `logError` route vers `fbAppendError` pour `critical` + `error` + `warning` ;
`info` reste **strictement local** ; **anti-doublon 10 min** ; **plafond 20 envois par session**.

⚠️ **Limite assumée** : un compte `ro:true` ne peut pas écrire → ses erreurs restent locales.
⚠️ **Leçon générale** : quand un mécanisme « ne remonte rien », vérifier **d'abord qu'il écrit au bon
endroit et que les rules l'autorisent**.
★ **Les exports de documents l'utilisent** ; ★★ **les replis du Pilotage aussi** (`_pcavLog` trace
en `info` chaque moteur de Cave qui lève).
★★★ **Et depuis le 09/08, les chemins de navigation muets aussi.** Quand la visite guidée ne trouve
pas son onglet, elle le **trace** au lieu de ne rien faire. **Un repli muet cache une régression :
c'est la leçon la plus chère du chantier accompagnement.**
★ **Même principe côté GT** : un géocodage de commune indisponible, une lecture de saisons refusée,
une écriture de machines en échec — chacun trace en `info` et **le dit à l'écran**, sans faire
échouer l'installation (§18b).

---

## 10-11. Modèle de données

- Racine : `mavigne_{slug}/…` — **26 collections**, déclarées dans `COLLECTIONS` (`firebase.js`).
- Chaque clé doit appartenir à **`FB_REALTIME`** (12 clés) **ou** à **`FB_STATIC`** (14 clés).
  **12 + 14 = 26 : couverture complète, invariant C12 satisfait**.

| | Clés |
|---|---|
| **FB_REALTIME** | `parcelles` · `journal` · `sessions` · `traitements` · `reparateur` · `reparateur_hist` · `entretiens` · `planning_templates` · `planning_entries` · `planning_acomptes` · `planning_hsup` · `intrants` |
| **FB_STATIC** | `travaux` · `catalogue` · `conducteurs` · `activites` · `membres` · `saisons` · `taches` · `config` · `historique` · `tracteurs_list` · `cave_elevage` · `cave_vendange` · `kml_polygons` · `paie` |

⚠️ **Piège d'audit** : un extracteur naïf trouve **27** clés — la 27ᵉ est le mot `'info'` d'un
**commentaire**. Faux positif rencontré **deux fois**. `COLLECTIONS` est un **tableau**.

★★ **Règle confirmée sur toute la série Cave, la série MILLÉSIME, le chantier accompagnement ET la
série installation : une fonctionnalité nouvelle n'a presque jamais besoin d'une collection
nouvelle.** Le registre des mouvements de fûts est **une clé de plus dans `intrants`**. Le seuil par
millésime est **une clé de plus dans `cave_elevage.config`**. L'acide malique est **un champ de
plus**. ★★ **Et les réponses du formulaire de mise en route sont une clé `mer` de plus dans le
document `leads` du prospect** — aucune collection, **donc aucune règle Firestore à déployer**
(§18b). Le registre, le bilan, les fiches d'aide, le guide et le widget « Mise en route » n'écrivent
**rien du tout**.
**Zéro invariant C12/C13 touché sur l'ensemble.**

- ⚠️ **Tableaux imbriqués INTERDITS dans Firestore** : stocker en `{lat,lng}` et reconvertir en
  `[lat,lng]` dans le wrapper `applyFbData`.
- **Helpers clés** : `showToast` · `refreshMapColors`/`pctColor` · `saveData(keyHint)` ·
  `fbDoc`/`fbSave` · `_escHtml` · `_retryAsync` · `_sessDates` · `_dockBuild`/`_dockSync`/`_goLanding`
  · `_saisonObj`/`_saisonForDate`/`_saisonTaches`/`_switchSaison` ·
  `_plan`/`_trialStatus`/`_canModule`/`_mvTrialBanner`/`_mvCheckExpired` · `openAide`/`_mvInjectHelpBtn`
  · `_mvAideEnum`/`_mvAideNb`/`_mvAideOngletsDom`/`_mvAideSections`/`_mvAideOngletsPil` (§27b)
  · `logError`/`fbAppendError` · `_mvPartCalc`/`_mvTraceData`/`_mvMurData`/`_mvCompTxt` (§22b)
  · `openConfirmDel`/`_execConfirmDel` et `openPrompt`/`_execPrompt` (§22c)
  · `_mvContratFini`/`_mvEnContratLe`/**`_mvEnContratSurPeriode`** (§19)
  · `_mvEstCollectif`/`_mvEffDef`/`_mvPoidsNom` (§19)
  · **`_mvNivH`** (§16b) · **`_mvPiedsHa`/`_mvVigne`/`_mvDensCoef`/`_mvHhaDens`**
  · **`_mvBaremeActif`/`_mvBaremeRef`** (`app.js`)
  · **`_mvParcGeo`/`_mvKmlCtrs`** (`utils.js`)
  · **`_phytoCsvRows`/`_phytoExportCsv`** (§17)
  · **`_mvCampagneDe`** (§11c) · **le moteur `_mvFut*`** (§20e)
  · **`_caveSeuilOu`** · **`_mlProjMalo`/`_mlMesMalo`** (§20h)
  · `_dmrEtapes`/`_dmrConseils`/`window._dmrGo`/`renderHomeDemarrage` (§27c)
  · ★ **`createAuthAccount(email, pwd, {roles, tenant})`** (`firebase.js`) — le `tenant` explicite
    est ce qui permet à GT de créer un compte pour un domaine qui n'est pas le sien (§18b).
- **Persister via `fbSave`**, jamais `fbDoc` directement.
- ⚠️ **En mode GT admin**, `window.CONFIG`/`PARCELLES` sont vides.

**★ Clés de `config` notables** — le doc `config` s'écrit **toujours complet** :
- `mur_mot` = `{txt, par, date}` (admin only) · `mur_visible` = `'equipe'` ou `'admin'`
- `home_layout` / `home_layout_default`
- `cp_mode` · `hsup_dues_debut` · `tachesPrio` · `features.*` · `saison_passages`
- **`vigne` = `{ ec_rang, ec_pied }`** — écartements de plantation (§30)
- **`bareme`** — clé du jeu régional actif (§30), repli `'cote-nuits'`
- **`siret`** et **`bio`** — identité de l'EXPLOITATION (§17 ; Réglages › Domaine)
  ★ **Tous deux peuvent désormais être posés à l'installation**, repris du formulaire (§18b).
- **`domaine_nom`** — le nom affiché (`window.DOMAINE_NOM`)
- `cadre_legal` — durées légales affichées — ⚠️ existe DÉJÀ, ne pas le doubler (§30h)
- `eco.*` — `k_retard`, `trac_etp`, `kg_bouteille`, `h_jour` (whitelist `_ecoCfgSet` —
  **toute nouvelle hypothèse doit y être ajoutée**, sinon rejetée en silence)
- **`cave.fut_l`** (défaut 228 L) · **`cave.futs_vie`** (défaut 5) · **`cave.fut_prix`**
  (**facultatif** — sans lui le plan de renouvellement s'exprime en nombre de fûts, jamais en euros
  inventés). ★ `fut_l` est posable à l'installation ; **ne rien choisir RETIRE la clé** au lieu
  d'écrire 228 en dur, pour que le défaut de l'application continue de s'appliquer (§18b).
- **`ordre_passage_t`** — la tournée PAR TÂCHE (⚠️ l'ancien `ordre_passage` n'était lu par personne)

**★★ Clés de `cave_elevage.config`** :
- `ouillage_alerte_j` — le **seuil général** du domaine (défaut 14)
- ★★ **`ouillage_par_mil`** = `{ '2026':7, '2025':14 }` — **le seuil PAR MILLÉSIME**.
  ⚠️ **Rétro-compatible par construction** : une clé absente retombe sur `ouillage_alerte_j`.
  Bornes **3 à 30 jours**, admin only.
  **Ne JAMAIS lire cette clé directement : passer par `_caveSeuilOu` (§20h).**

**★★ Champs d'une opération d'analyse** (`cave_elevage.operations[].data`) :
`so2_libre` · `so2_total` · `av` · ★★ **`malique`** (g/L) · `fml` ∈ `'none'|'cours'|'ok'` ·
`fml_date` · `pdf_url`.

### Couverture de synchronisation et gardes

**INVARIANT (C12)** : une clé absente des deux listes n'est lue **qu'au boot** → deux appareils
divergent en silence et le dernier `fbSave` écrase l'autre, **sans toast et sans trace**.

- `intrants` → **temps réel** (lisible par tout membre, seule l'*écriture* est admin-only).
- `paie` → **pull seulement** : seul doc admin-only **en lecture** ; un `onSnapshot` posé par un
  non-admin serait refusé et Firestore **détacherait** le listener.

⚠️ Être dans `FB_STATIC` ne met **pas** `paie` dans `_initData` ni dans la snapshot `localStorage` →
**les rémunérations ne descendent jamais sur le disque. Contrôlé par C21.**

**`_MV_GUARD_FLOORS` — 22 planchers** :
```
parcelles 5 · membres 2 · saisons 1 · config 3 · journal 5 · sessions 5
cave_elevage 1 · cave_vendange 1 · tracteurs_list 2 · conducteurs 2 · activites 2
planning_entries 2 · planning_templates 1 · planning_acomptes 1 · planning_hsup 1
traitements 5 · intrants 3 · paie 2 · taches 5 · entretiens 5 · historique 5 · reparateur_hist 2
```
Le garde ne se déclenche que sur une **chute de plus de moitié en une seule écriture**.
**Non gardées volontairement** : `travaux` (dérivé) et `kml_polygons` (REPLACE assumé).
⚠️ Ces gardes protègent le chemin CLIENT (`saveData`/`fbSave`). **Le chemin GT (`fbAdminWrite`) ne
les traverse pas** — c'est voulu (installation, import KML), et c'est pourquoi l'assistant pose ses
propres gardes avant d'écrire (§18b).

⚠️ **`intrants` et `paie` sont des conteneurs à clés fixes** → `Object.keys()` y renvoie une
**constante** → deux compteurs de **contenu** : **`_mvIntrantsCount`** et **`_mvPaieCount`**.
★★★ **`_mvPaieCount` compte désormais `taux_serie`** (12/08, §36) : ce n'est plus un dérivé, c'est
**la source de tout coût de main-d'œuvre daté**. `taux_hist`, lui, reste un dérivé et ne compte pas.

★★★ **Le document `paie` — modèle à jour (§36)** :
```
taux[nom]        MIROIR du taux EN VIGUEUR AUJOURD'HUI — pas la dernière ligne
taux_serie[nom]  [{d:'YYYY-MM-DD', v:12.10}] croissante — SOURCE DE VÉRITÉ
taux_hist[nom]   [{d,de,a}] — trace historique, lue UNIQUEMENT pour dériver une
                 série absente. Aucun calcul ne s'en sert.
gnr_appoints[]   {id,d,l,pu,f,par} — appoints de cuve (Tracteur)
```
★ ⚠️ **`fut_mouv` grossit indéfiniment** : c'est un journal, jamais purgé. Le rendu n'en montre que
**40 lignes** puis un compteur.

---

## 11b. Anti-perte — les trois couches

- **Couche 1 — Planchers `_MV_GUARD_FLOORS`** : refus d'écriture si le compte chute de plus de
  moitié sous le plancher. `_saveParcellesMerged` est transactionnel.
- **Couche 2 — Verrou de chargement** (`app.js`, 12 occurrences) : `_mvKeyLoaded[key]` posé dans
  `applyFbData` ; `saveData` refuse `parcelles`/`membres`/`saisons` tant que la clé n'a pas été lue.
  ★ S'applique à **TOUS LES TENANTS**.
  ⚠️ **Échappatoire `_mvKeySeen`, obligatoire** : sans elle, un domaine dont le doc vaut `[]`
  n'aurait **jamais** pu créer son premier membre. Posée **avant tout filtre**.
  ⚠️ **Le garde-fou était muet** : il traçait via `if(window.DEBUG)` — or **`window.DEBUG` n'est
  défini nulle part**. Remplacé par un `logError` en `warning`.
- **Couche 3 — File offline** + **backup JSON quotidien**, rétention 30 j.
  ⚠️ **La snapshot localStorage a été durcie le 05/08** (écriture groupée 2 s, `_MV_BK_MAX=3`,
  QuotaExceededError tracé) — ⚠️ **`_mvSnapCancel()` doit être appelé AVANT toute purge de
  `LS_KEY`**.

---

## 11c. ★★ L'axe campagne — une source unique de plus

**Du 1ᵉʳ août au 31 juillet, de récolte à récolte.** Une date appartient à la campagne ouverte le
1ᵉʳ août qui la précède.

**`window._mvCampagneDe(iso)` vit dans `utils.js`.** C'est la **source unique**.
**Non-régression prouvée : zéro écart sur 360 dates de 2020 à 2030.**

⚠️⚠️ **CONTRE-EXEMPLE : l'axe campagne n'est PAS le bon axe pour l'âge d'un fût.**
Un fût acheté en 2023 est un fût de **trois vins** en août 2026, et de **quatre** en janvier 2027.
**La convention retenue est `annee_civile − annee_achat`, « neuf » à zéro.**

⚠️⚠️⚠️ **DEUXIÈME CONTRE-EXEMPLE : l'axe campagne n'est pas non plus le bon axe pour le VIN.**
Une campagne contient **deux millésimes**. **Le registre et les manipulations raisonnent en
MILLÉSIME (§20h).**

**Les quatre axes, et ce que chacun décrit :**

| Axe | Décrit | Qui l'utilise |
|---|---|---|
| **Période** (dates libres) | une phase de travail | avancement, charge, `p.taches` |
| **Campagne** (1er août → 31 juillet) | une année de travail | Archives, vigne, protection, part des anges |
| **Millésime** (année civile de vendange) | un vin | récolte, flux, chai, manipulations, ouillage, malo |
| **Année civile** | l'âge d'un contenant | pyramide des fûts, mouvements |

★★ **Leçon générale : avoir une source unique ne dispense pas de se demander si c'est le bon AXE
pour CE calcul-là.**

---

## 12. Navigation & dock

- **Dock bas** unifié, construit par `_dockBuild`/`_dockSync`, atterrissage par `_landingPage`
  (**recalculé dynamiquement**, jamais `home` en dur).

★★ **LA LIGNE EN PLACE** (`app.js`, `_dockBuild`, occurrence unique) :
```js
if(pc || items.length<=5){ main=items; ov=[]; } else { main=items.slice(0,4); ov=items.slice(4); }
```
**Histoire** : le lot du 1er août avait été **perdu** (fichiers livrés, jamais intégrés).
**Rejoué le 4 au matin**, confirmé par trois audits.
⚠️ Les deux changements (`slice(0,3)→slice(0,4)` **et** garde `<=4→<=5`) restent **indissociables**.

★ **Répartition MESURÉE** sur **9 profils réels** :

| Profil | Avant | Après |
|---|---|---|
| Domaine · admin (8 items) | 3 + Plus(5) | **4 + Plus(4)** — Phyto remonte |
| Domaine · ouvrier (7) | 3 + Plus(4) | **4 + Plus(3)** — Cave remonte |
| Domaine · ouvrier, Cave décochée (6) | 3 + Plus(3) | **4 + Plus(2)** |
| **Domaine réduit à 5 modules** | 3 + Plus(2) | **5 cases, aucun bouton « Plus »** |
| Vigneron · admin / ouvrier (4) | 4, aucun Plus | inchangé |
| Essentiel (2) · Ordinateur (≥ 768 px, `pc=true`) | — | inchangé |

⚠️⚠️ **Vigneron = 4 modules** (Vigne, Tracteur, Phyto, Réglages). **12 invariants vérifiés**.
⚠️ **Aucune modification CSS nécessaire** : `.mv-dk` est en `flex:1`.
⚠️ **`_dockDef()` n'est PAS exposée sur `window`.** Ne pas l'appeler depuis un test.

- Le toast de `goTo` distingue le blocage **par formule** du blocage **par membre**.
- **Hub et sidebar : purgés.**
- ★ **Navigation unifiée** : 9 systèmes d'onglets → **1 seul `.mvu-tabs`**.
- ★★ **Un onglet unique n'est pas un choix, c'est un décor** (§19a) : quand un rôle n'a accès qu'à
  un seul onglet, `#plan-tabs` est masqué en entier plutôt que d'afficher une barre à une case.
  Le Planning le fait pour l'ouvrier.
- ★ **En-têtes : les 10 modules partagent `.mod-header`.** `_mvMetaSync()` et `_mvInjectHelpBtn()`
  ne ciblent que `.mod-header .mod-meta-row`.
- ⚠️ **Les onglets doivent rester DANS `.mod-header`**.
- **`.mvu-sub`** = peau des onglets de **second** niveau.
- **Overlays empilés** : `openOv(id)` pose un `z-index` = max des `.overlay.open` + 1 (base 600).
  ★ La feuille de restitution (§22b) vit **hors** de ce système, en `position:fixed` z-index **2400**.

★★ **Le patron des sous-onglets délégués** (`pilotage.js`) — à réutiliser :
un conteneur avec des `<button data-s="…">`, et **un seul écouteur délégué** qui fait
`e.target.closest(…)`. ★ **Pour un second niveau dans le même panneau**, tester le sélecteur le plus
spécifique **AVANT** et faire `e.stopPropagation()`.

★★ **Widgets d'accueil** (`HOME_WIDGETS`, `HOME_NEW_TOP`, `HOME_PINNED`, `applyHomeLayout`) : la
structure de chaque widget vit **dans `index.html`** (`<div class="home-w" data-w="…">`), le JS ne
fait que la remplir et la réordonner. Ajouter un widget = **un bloc dans `index.html` + une entrée
dans les deux tableaux + une fonction de rendu appelée depuis `renderHome`**, sous `try/catch` comme
les autres. ⚠️ `HOME_NEW_TOP` fait un `unshift` : c'est ce qui met un widget neuf **en tête** chez
ceux qui ont déjà personnalisé leur accueil, où la règle générale l'aurait mis en queue, invisible.

---

## 13. Parcelles, carte & KML

- Polygones Leaflet colorés dynamiquement par l'avancement (`refreshMapColors`/`pctColor`).
- ⚠️⚠️ **Les parcelles ne portent PAS de coordonnées.** Toute fonctionnalité géographique passe par
  le **centroïde du polygone homonyme** — résolveur central **`_mvParcGeo` / `_mvKmlCtrs`** dans
  `utils.js`.
- ★★★ **DEUX CHEMINS D'IMPORT KML, À NE PLUS CONFONDRE** (correction du 09/08) :
  1. **L'onglet KML du panneau GT** (`_parseKML`, `agtKmlSave`) — prévisualisation puis écriture de
     `kml_polygons` **seulement**. C'est un **REPLACE assumé**. Il ne crée aucune parcelle.
  2. ★★ **L'assistant d'installation** (`_agtIns`, §18b) — il **CRÉE les parcelles** depuis le même
     fichier, avec leurs surfaces calculées sur le contour, **et** écrit `kml_polygons`.
     **Les deux sortent du MÊME tableau `_agtIns.parc`** : le nom corrigé à l'écran atterrit des
     deux côtés, donc le rattachement par `nom.toLowerCase()` ne peut pas diverger.
  ⚠️ **L'ancienne affirmation « l'import KML n'écrit QUE les polygones » ne vaut que pour le cas 1.**
- ★★ **Renommer une parcelle : la règle s'inverse selon le moment.**
  - **Sur un domaine vivant** : `p.nom` est la clé du journal, des sessions et des traitements →
    on renomme **dans le KML**, jamais dans l'app.
  - **À l'installation** : il n'y a **aucun historique à casser** → on renomme **dans l'écran**,
    avant écriture. C'est même le seul moment où c'est sûr (§18b).
- **Surface totale recalculée** dynamiquement (`_recalcSurfTotale`). ⚠️ 32 sommes encore à la main.
- ★ **`p.arrachee`** sort une parcelle de la surface exploitée.
- **Complantation** (pilotée par les trous, `plantation_trous`) ≠ **Plantation** (tâche
  complémentaire, parcelle neuve).
- ★ **La DENSITÉ de plantation doit devenir une propriété de la PARCELLE** (`ec_rang`/`ec_pied`),
  `CONFIG.vigne` n'étant que le défaut du domaine. À traiter avec « import KML en MERGE » (§28).
- ⚠️ Un futur ré-import devra faire un **MERGE** pour préserver `p.commune`, `p.plantation_trous`,
  `p.entreplantation`, `p.tachesAll`, `p.rendement_hist` et ★ `p.rdt_max`.
- ★★ **Outil hors dépôt : `comparateur-kml-parcelles.html`** (v3, 06/07) — parse un KML, calcule les
  surfaces, classe en cinq groupes, apparie les orphelins par distance d'édition, régénère un KML
  corrigé. ⚠️ **Depuis le 09/08, il ne sert plus À L'INSTALLATION** (l'assistant fait l'alignement),
  mais il reste l'outil du **ré-import sur un domaine vivant**. Sa copie doit vivre dans
  `..\mavigne-sauvegardes\`.

## 13b. Géocodage BAN

`api-adresse.data.gouv.fr`, **runtime navigateur**, sans clé, **France uniquement**.
Précédence météo : centroïde parcelle > commune affectée > domaine.
★ **Le département vient donc du géocodage déjà fait** : zéro question supplémentaire à
l'installation pour connaître la région d'un domaine (§30c).
★★ **À l'installation, un appel PAR COMMUNE DISTINCTE, jamais par parcelle** (§18b) : quarante
parcelles sur trois communes font trois appels. Sans coordonnées, la parcelle garde le **nom** de sa
commune — l'étiquette reste juste, seul le repère de secteur manque.

---

## 14. Cloud Functions (`europe-west1`, Node 22)

- **`claims.js`** — `createMemberAccount` · `updateMemberRoles` · trio SEC-2 · `acceptTerms` ·
  `getLoginRoster` (**renvoie toujours `roles`** — backlog) · `gtLastConnections` ·
  `gtSetTenantPlan` · `gtBackfillClaims` · `onboardTenant` · `deleteTenant` · SEC-GT/2
  (`gtRequestOtp`, `gtVerifyOtp`, `gtEndSession`).
  ⚠️ Contient aussi le **pied de signature** des mails de confirmation (§26c).
  ⚠️ `sha256Url()` va chercher la page juridique **en ligne** au moment de la signature (§26b).
  ★★ **`createMemberAccount` accepte DÉJÀ un appelant GT avec un `tenant` explicite**
  (`if (isGt) target = tenant || null;`) — c'est ce qui a permis de faire la création de comptes en
  lot **sans aucun changement backend** (§18b).
  ★★ **`onboardTenant` accepte en une seule fois** `{slug, email, password?, adminNom?, membres,
  parcelles, saisons, taches, config}` et écrit chaque clé par l'Admin SDK. Le mot de passe est
  facultatif pour un appel GT : il est généré, renvoyé **une fois**, stocké nulle part.
  ⚠️ Gardes : App Check, le slug doit être déclaré **avant** dans `_guerettech/tenants`, et refus si
  `mavigne_<slug>/membres` existe déjà — **l'installation ne se rejoue pas**.
- **`index.js`** — backups. **`ephy.js`** — sync hebdo E-Phy ANSES.
- ★★ **`leads.js`** — `submitLead` (formulaire d'essai) **et `submitMiseEnRoute`** (§18b, §27f).
- Extension **« Trigger Email from Firestore »** (⚠️ Firestore Instance Location = **eur3**).
- **Suppression de tenant** : double verrou, `marchand-grillot` protégé en dur.
- ⚠️ `gtBackfillClaims` ne parcourt **que** les slugs de `_guerettech/tenants`. Appeler **toujours**
  avec `{ timeout: 300000 }`.
  ★ **Son rapport est un OUTIL DE DIAGNOSTIC** : chaque ligne montre les claims finaux et le
  suffixe `(inchangé)`. Le 09/08, il a prouvé en une commande que **les 28 comptes existants avaient
  tous le bon `tenant`** — donc que le défaut de `createAuthAccount` ne s'était jamais déclenché.
- ★ **Lecture d'un doc brut** : `window.fbAdminRead(slug, key)` en fenêtre privée ngdevpro renvoie
  `.value` **sans passer par aucune normalisation** — indispensable pour auditer `taches` (§30d),
  et utilisé par l'assistant pour lire les membres et les saisons d'un domaine existant.
- ⚠️ **Avant `onboardTenant` pour un nouveau client** : enregistrer le slug dans
  `_guerettech/tenants`, sinon le serveur refuse. ★ L'assistant le fait lui-même, en première étape.

## 14b. Formules, essai, gating

- Claims `plan` + `trial_until` → `_plan()`, `_trialStatus()`, `_canModule()`, `_mvTrialBanner()`,
  `_mvCheckExpired()`, `_openEmailModal()`. **Défaut `plan='domaine'`**.
- Fiche client GT, `_FC_GUARD_FLOOR = 0.25`. ⚠️ **Le panneau GT est passé de 8 à 6 onglets le
  06/08** — changement repéré au changelog, **non documenté ici**.
- ⚠️ **Vérifier `trial_until` avant toute promesse commerciale.**

### ★★★ L’ESSAI EST BORNÉ (14/08 — §40)

**15 jours, reconductibles UNE FOIS, puis lecture seule.** Trois nombres, deux fichiers :

| | `functions/claims.js` | `src/admin-gt.js` |
|---|---|---|
| durée | `TRIAL_DAYS = 15` | `_FC_TRIAL_DAYS = 15` |
| borne | `TRIAL_MAX_RENEW = 1` | `_FC_TRIAL_MAX = 1` |
| alerte | `TRIAL_WARN_D = 3` | seuil `d<=3` dans `_mvTrialBanner()` (`app.js`) |

⚠️ **Ces nombres sont DUPLIQUÉS et c'est assumé** : l’un affiche, l’autre fait respecter. Si l'un
bouge sans l'autre, **l'écran promet ce que le serveur refuse**. `harnais-reconduction.mjs` et
`harnais-bandeau-essai.mjs` comparent les fichiers entre eux et rougissent.

**Qui fait foi, et qui n'est qu'une copie.** Ce qui gèle le client, c'est le claim `trial_until`,
posé sur chaque membre. `_guerettech/tenants.clients[slug].trialExp` en est la **copie** — celle que
`trialWatch` lit, parce qu'elle ne peut pas parcourir les jetons de tous les membres de tous les
domaines chaque nuit. Les deux s'écrivent dans le même geste (`_fcSaveAbo`, `agtInsTrialGo`,
`gtRenewTrial`). **Si un jour l'un part sans l'autre, la veille se trompera de date en silence.**

**⚠️ LA LECTURE SEULE EST CÔTÉ NAVIGATEUR.** `_mvCheckExpired()` pose `window._MV_LOCKED`,
`saveData()` refuse en tête (`app.js:703`). **Aucune règle de `firestore.rules` ne lit
`trial_until`** — la base accepte toujours les écritures d'un domaine expiré. (Le mot « trial » y
apparaît deux fois, dans des commentaires sur `checkTrialToken` : mécanisme sans rapport.) C'est un
frein commercial, pas une serrure. Écrit ici pour que personne ne le découvre autrement.

**Nouvelles clés du registre** : `trialRenewals` (0|1) · `trialRenewedAt` · `trialPrevu` (essai
accordé mais pas encore démarré, cf. §40) · `trialExp`. Marqueurs anti-doublon des mails :
`_guerettech/trial_mails` `{value:{slug:{j3,exp,relance}}}`.

## 14c. ★ L'écran d'accueil public

**Le problème.** `_fbLoad` routait tout visiteur sans tenant vers `showOnboarding()` → un prospect
tombait sur un assistant « Configuration initiale » **qui ne pouvait jamais aboutir**.

**La solution** (`firebase.js` + `onboarding.js`, **aucun bump**) : un écran construit dans l'écran
de connexion **qui existe déjà**, injecté dans `#login-profiles`. **Trois portes** : découvrir le
logiciel · démo guidée · champ « lien d'installation » acceptant **une URL complète ou un slug nu**.

Le logo reste **tapable 5 fois** → panneau GT, **sans avoir à taper `?tenant=`**.

⚠️ Le **vrai** chemin d'installation (`?tenant=slug` + statut `pending`) est **intégralement
préservé**. ★ **Le formulaire d'essai du site fonctionne** : c'est par lui qu'est arrivé Garraud.

---

## 15. Journal & travaux

- **Une équipe au travail = une seule entrée** de journal avec tous les noms
  (`JOURNAL.membresEquipe`). ★ C'est cette structure qui rend possible toute la série UX-R et le
  coût par parcelle du Pilotage.
- ⚠️ Les statuts sont stockés **accentués** (`'Validé'` / `'Annulé'`) → correspondance UTF-8
  **exacte** obligatoire.
- ⚠️ Une entrée peut porter `parcelle:'Domaine'` (validation groupée) : **aucune surface**.
- ★ **Une entrée `meteo:true` existe aussi** : le bilan et `_mvPartCalc` les excluent tous les deux.
  ⚠️ **Vécu le 09/08** : une `meteo:true` prise pour une trace de travail dans un test — **une
  entrée de journal n'est pas forcément un travail.**
- Bouton 🩹 = **reconstruction** du journal.
- `travaux` est **dérivé** et régénérable par `recalcTravaux` → volontairement non gardé.
- ★ **`TRAVAUX[tache]` contient l'avancement surfacique** : `pct`, `surf_done`, `surf_total`,
  `h_done`, `h_reste`. ⚠️ **Mais il est lié à la PÉRIODE active, pas à la campagne.**
- ★ **Le statut « En cours »** écrit une entrée avec `date` et `ts_debut` ;
  `_findDebutTache(parcelle, tache)` existe déjà.
  ⚠️⚠️ **DÉFAUT DORMANT** : `_findDebutTache` prend le **minimum sur tout le journal SANS borne de
  période** → à la 2ᵉ campagne d'une même tâche, `fetchMeteoMoyenne` moyennera sur des centaines de
  jours (contre-épreuve : 398 jours au lieu de 2). Dormant chez MG aujourd'hui, pas absent.

---

## 16. ★★ Campagne & périodes — le modèle actuel

**Le modèle « saison par type » est mort.** L'app déduisait les tâches en **lisant le premier mot du
nom de la saison**. Cassé net pour tout domaine nommant ses périodes autrement.

**Modèle actuel — période par dates** : **nom libre**, **date de début**, **date de fin**, et sa
**propre liste explicite de tâches**. Plus aucune interprétation du nom.

- **Helpers dans `utils.js`** : `_saisonObj`, `_saisonForDate`, `_saisonTaches`.
- `getTachesSaison()` lit la **liste explicite** de la période, avec repli legacy.
- **Migration one-shot idempotente** `_migrateSaisonTaches`.
- **Le journal suit la date saisie**, pas la période active.
- **`p.taches` reste épinglé à la période ACTIVE.** La consultation d'une autre période est **lecture
  seule**, via `_tachesFor(p)` + `localStorage` **par utilisateur**.
- ★ **`_renamePeriode()`** migre **toutes** les clés de stockage au renommage.
- `s.echeances` porte les fenêtres agronomiques.
- ★★ **`_saisonForDate` prend la période dont le DÉBUT est le plus tardif** parmi celles qui
  contiennent la date → **les périodes peuvent se chevaucher**, la plus récemment commencée gagne.
  C'est ce qui rend sûr le découpage recopié d'un autre domaine (§18b).

⚠️ **Ne pas confondre PÉRIODE, CAMPAGNE et MILLÉSIME** — les axes du §11c.

### ⚠️⚠️⚠️ Le filtre legacy — il a survécu à sa propre mort

**Le modèle « saison par type » a été déclaré mort le 25/07. Il tournait encore le 03/08.**
`_chargeSaisonData()` utilisait toujours l'ancien filtre. Or la **Vendange** porte `anytime:true`.
Elle entrait donc dans **toutes** les périodes.
Coût mesuré chez Marchand-Grillot : **≈ 941 heures fantômes**, soit **~28 % de la charge totale**.

**Correctif** : `window._saisonTaches(s.nom)` — ⚠️ **la période passée en ARGUMENT, pas la période
consultée**.

⚠️ **La même vulnérabilité dort ailleurs** : `Arrachage`, `Désherbage manuel` et `Effeuillage`
portent aussi `anytime:true`, invisibles parce que leurs heures/ha sont nulles.

### ⚠️⚠️ PÉRIODE CONSULTÉE vs PÉRIODE ACTIVE — le piège qui se réintroduit

- `getSaisonActive().nom` = la période **active** (celle où l'on peut valider)
- `_visuSaison()` = la période **consultée** par cet utilisateur (peut être une archive)

Toute fonction qui croise tâches/parcelles avec le **journal** doit filtrer le journal sur
`_visuSaison()`. Ce piège a été **réintroduit le 30/07 par du code neuf**. Repli retenu :
```js
var vn=(typeof _visuSaison==='function')?_visuSaison():((getSaisonActive()||{}).nom||'');
```
★ **Troisième cas** : une fonction qui reçoit une période **en argument** doit utiliser **cet
argument**, ni l'active ni la consultée.

### ★★ Frise, rétention, archives

**(a) Frise recalée.** Chaque étiquette positionnée par le **même calcul `pc()`** que les segments.
**(b) Rétention 18 mois** (`_CMP_RETENTION_M`). La période **active** et la période **consultée**
ne sont jamais masquées ; le filtrage d'**affichage** ne mute **jamais** `SAISONS`.
**(c) Onglet « Archives »** — axe commun **1er août → 31 juillet**. `_pilCmpSnapshot()` **apparie
par position sur l'axe campagne** (tolérance 75 jours).
★ **C'est l'écran de fin de campagne** : c'est pourquoi le bilan de campagne (§20f) s'y ouvre.

## 16b. ★★ Niveaux sautés — la marque `'Auto'`

Quand un relevage se fait en **un seul passage**, on valide directement le dernier niveau et
`_computeAutoNiv` marque les précédents **`'Auto'`**.

⚠️ **Mais partout où l'on comptait des heures, `'Auto'` comptait comme `'Validé'`.**

**Règle arbitrée par Nico** : un passage sauté **n'a pas eu lieu**, donc il ne compte pas.
Et **N passages réellement faits = les N PREMIERS niveaux du barème**.

**`window._mvNivH(nivs, s)`** (utils.js) est la **source unique** → `{n, done, total, fini}`.
**Mesuré sur les 45 parcelles réelles de MG** : `h_done` 1 092,8 → **564,5 h**.
⚠️ **La surface faite et le pourcentage d'avancement ne bougent pas** : ils se calculent sur le
**statut**, pas sur les heures.

## 16c. ⚠️ Bug d'onboarding corrigé

`obFinalize` créait la saison **sans `debut` ni `fin`** → **tout tenant créé après la refonte
campagne avait une saison invisible**. Désormais `debut: AAAA-01-01`, `fin: AAAA-12-31`.
★ **Une période sans dates est invisible pour toute la chaîne de charge** — c'est aussi pour ça que
l'étape « périodes de travail » du widget Mise en route exige `debut` **et** `fin` (§27c), et que
l'assistant d'installation **refuse d'écrire** une période incomplète (§18b).

---

## 17. Phyto & E-Phy

- Registre + catalogue **E-Phy ANSES** synchronisé chaque semaine. L'ancien catalogue manuel
  « Mes produits » est supplanté mais **encore référencé** dans 5 fichiers. Arbitrage ouvert.
- **DRE dérivée des codes de danger CLP** (24 h / 48 h, arrêté du 4 mai 2017).
- **`dose_val` structuré** (nombre + unité, jamais un parsing de texte libre).
  ⚠️ Bug vécu : une comparaison d'unité **sensible à la casse** faisait disparaître en silence des
  entrées anciennes du calcul de coût.
- **Assistant de traitement en 3 étapes.** FAB visible si `isTractoriste() || isAdmin()`.
- ★ **Budget cuivre** : cumul de cuivre métal sur **7 ans** face au plafond **28 kg/ha** en dur.
  Source unique `_cuParcRollSum`. **Non bloquant.** Visible aussi dans Pilotage › Conformité.
- `traitements` a un plancher de garde (**5**) — le registre phyto est opposable en contrôle.
- ⚠️ Le **pied des rapports PDF phyto** porte la mention éditeur + SIRET GUERETTECH (§26c).

### ★★ Export électronique du registre (CSV)

**Base légale** : règlement d'exécution **(UE) 2023/564** + **arrêté du 24 décembre 2025**.
Contenu obligatoire depuis le **01/01/2026** ; **format électronique lisible par machine exigé au
01/01/2027** — un PDF imprimé n'en est pas un. Le PDF existant reste, le CSV s'y ajoute.

- **`window._phytoCsvRows()`** + **`window._phytoExportCsv()`** (`phyto.js`). Boutons : bas du
  registre (`#phyto-export-row`, **admin**) + ★ le hub **Documents & impressions**, famille
  « Obligatoire », où il est **mis en avant** (`urgent:true`).
- ⚠️ **Une ligne par produit ET par parcelle** : la localisation est exigée pour chaque surface
  traitée.
- **Localisation par coordonnées GPS**, centroïde KML via **`_mvParcGeo`**.
- ⚠️ **« Cible » et « Mode d'application » laissés VIDES délibérément** : facultatifs au texte, et
  les remplir depuis le catalogue reviendrait à déclarer une cible pas forcément visée ce jour-là.
- **Format Excel FR** : séparateur **point-virgule** + **BOM UTF-8** + **décimale à virgule**.
  Dates **JJ/MM/AAAA**, heures **HH:MM**, stade **BBCH**, culture = code OEPP **`VITVI`**.
- ★ **`CONFIG.siret` + `CONFIG.bio`** saisis dans **Réglages › Domaine** — imposés **sur chaque
  ligne**. ★★ **C'est pour ça que le SIRET est l'un des deux conseils du widget Mise en route**
  (§27c) **et l'une des trois valeurs reprises du formulaire à l'installation** (§18b) : sans lui le
  fichier part quand même, mais incomplet.
- Toasts honnêtes : SIRET manquant (orange, le fichier part quand même) · N lignes sans
  coordonnées · succès.

---

## 18. Admin GT — le panneau

- Fiche client (plan + toggles modules + essai temps réel), **dernières connexions clients**,
  vérification KML, bascule de plan, journal des erreurs (`_agtBuildErrors()` lit
  `mavigne_{slug}/error_log`), écran business & leads.
- ★ **`_agtSlugs`** mémorise la liste des domaines installés au chargement du panneau — c'est la
  source à réutiliser, sans nouvel appel réseau.
- Toute action GT exige la **fenêtre privée `ngdevpro`** (5 taps sur le logo) et une **session OTP**
  ouverte (SEC-GT/2).
- ⚠️ En mode GT, `window.CONFIG` / `PARCELLES` sont **vides** → ne jamais y lancer `saveData`.
- ⚠️ `_guerettech/tenants = {slugs:[…]}` à la **racine**, sans enveloppe `{value}` → lecture
  tolérante aux deux formats.
- ⚠️ **Le panneau est passé de 8 à 6 onglets le 06/08** — non documenté, à consigner.
- ⚠️ **`admin-gt.js` seul = AUCUN bump.**

---

## 18b. ★★★ L'ASSISTANT D'INSTALLATION — « 20 h → 9 h » (chantier du 9 août, soir)

> ⚠️⚠️ **CINQ LOTS LIVRÉS, PAS ENCORE DÉPLOYÉS.** Voir « Déploiement » en fin de section.

### Le point de départ, et l'erreur à ne pas refaire

La note de mission affirmait qu'il fallait **écrire** un import KML créant les parcelles et un
mécanisme de création de comptes. **Les deux existaient déjà**, au moins en partie :
**l'assistant `_agtIns` était en place et avait servi pour l'installation de Chapelle.**

★★★ **Leçon : le premier geste d'une mission est un inventaire, pas un plan.** Une note de mission
vieillit exactement comme un document d'instructions.

### Ce que l'assistant faisait déjà

Bouton **« 🌱 Installer un domaine depuis un dossier »** dans le panneau GT → `agtOpenInstall()`.
Il lit les dossiers reçus (`gtLeads`), lit un fichier de parcellaire, **crée les parcelles avec
leurs surfaces** (formule du lacet sur le contour), géocode la commune du domaine, inscrit le slug
dans `_guerettech/tenants`, appelle `onboardTenant` avec parcelles + saison + tâches + admin, écrit
`kml_polygons`, puis affiche le mot de passe **une seule fois**.

### La mesure, avant tout code

**20 h par installation**, décomposées par Nico :

| Poste | Coût | Nature |
|---|---|---|
| Administratif | 2 h | humain |
| Barème | 4 h | **discussion avec le client** |
| Parcelles | 4 h | clavier |
| Comptes salariés | 1 h 30 | clavier |
| Périodes | 1 h 30 | clavier |
| Reprise de données | 2 h | clavier |
| Matériel | 1 h | clavier |
| Cave | 1 h | clavier |
| Accompagnement, allers-retours | 3 h | clavier |

★★ **Les 14 h de clavier se font SEUL.** C'est le seul gisement que du code peut atteindre.
★★ **Et les 4 h de parcelles étaient dépensées MALGRÉ l'assistant** — parce que **les noms du
domaine ne sont pas ceux du fichier**. C'est Nico qui l'a dit en une phrase, et ça a déplacé tout
le lot n°1.

**Cible tenue sur le papier : ~9 h.** ⚠️ **Non mesurée** : elle le sera à la première installation
à blanc (§28).

### Lot 1 — les parcelles (4 h → ~30 min)

- **Nom éditable ligne à ligne** (il ne l'était pas), **zone de collage** de la liste du domaine,
  **appariement automatique** par distance d'édition sur des clés normalisées (accents, casse et
  ponctuation ôtés), seuil **proportionnel à la longueur**, affectation **gloutonne** par distance
  croissante, exclusion mutuelle. Ce qui dépasse le seuil n'est **pas imposé** : il est proposé
  ligne par ligne, du plus proche au plus lointain.
- **Colonne commune** par parcelle + bouton « Toutes à la commune du dossier ».
- ★★★ **`parcelles` et `kml_polygons` sortent du MÊME tableau `_agtIns.parc`** → corriger le nom
  avant écriture fait tomber les deux justes **par construction**.
- ⚠️⚠️ **Deux noms qui ne diffèrent que par un NOMBRE ne s'apparient JAMAIS tout seuls.**
  « Parcelle 8 » n'est pas « Parcelle 7 » : un nombre qui change n'est pas une faute de frappe.
  Les zéros de tête ne comptent pas (« Chaliots 01 » = « Chaliots 1 »). **Trouvé par le harnais.**
- ⚠️ **Le select d'une ligne déjà nommée doit proposer SON propre nom**, sinon on ne voit plus ce
  qui y est posé et corriger un mauvais rapprochement oblige à tout recommencer.
- **Gardes avant écriture** : aucun nom vide, aucun nom en double.
- ⚠️⚠️ **DÉFAUT PRÉEXISTANT CORRIGÉ** : chaque rendu appelait `_agtInsFill`, qui **réécrivait** nom
  du domaine, e-mail et durée d'essai **depuis le dossier**. Retirer une parcelle effaçait donc la
  saisie en cours, **sans un mot**. Correctif : une **photo des champs** (`_agtIns.form`) prise
  avant chaque rendu, remise à `null` au changement de dossier.

### Lot 2 — les comptes de l'équipe (1 h 30 → ~20 min)

- ⚠️⚠️⚠️ **LE DÉFAUT LE PLUS GRAVE DE LA SÉRIE.** `agtSaveAddMembre` appelait
  `window.createAuthAccount(email, pwd, {roles})`, qui envoyait **`tenant: TENANT_ID`** —
  c'est-à-dire `localStorage.mavigne_tenant`, **jamais le slug affiché à l'écran**. Deux issues
  selon la fenêtre : refus net en fenêtre privée vierge, ou **compte créé sur le mauvais domaine**
  pendant que la fiche membre partait chez le bon via `fbAdminWrite(slug, …)`. Le membre apparaît
  dans l'équipe et ne peut pas se connecter : **panne différée, sans trace**.
  **Correctif** : `tenant: (opts && opts.tenant) || TENANT_ID` dans `firebase.js`, et le slug passé
  par le panneau GT. **Le chemin client (Réglages › Équipe) ne passe rien et ne change pas.**
  ✅ **Vérifié par `gtBackfillClaims` : 28 comptes, tous « (inchangé) »** — le défaut existait mais
  ne s'était jamais déclenché.
- **Écran « 👥 Toute l'équipe »** : collage d'une liste (`Prénom`, `Prénom;rôle`,
  `Prénom;adresse;rôle`, tabulations acceptées — un collage depuis un tableur passe), **aperçu
  obligatoire**, création une par une, **liste des identifiants affichée une seule fois**, copiable
  et imprimable.
- **Le mot de passe devient facultatif** aussi dans l'écran unitaire : SEC-2 savait déjà le générer,
  cet écran l'exigeait pour rien.
- ⚠️ **Rôle par défaut : `ouvrier`.** Jamais administrateur — un droit ne s'accorde pas par omission.
- ⚠️ **Admin + adresse fictive = refusé AVANT l'appel**, avec la raison. Le serveur le refuse de
  toute façon ; autant le dire avant d'essayer.
- ⚠️ **En cas d'échec partiel, les fiches des comptes réussis sont écrites quand même** — sinon des
  comptes existeraient sans apparaître dans l'équipe. Si c'est l'écriture qui échoue, l'écran le dit
  en toutes lettres au lieu de l'avaler.
- ★★★ **LA CONVENTION D'ADRESSE N'EST PAS LE SLUG.** Lu dans les comptes réels :

  | Domaine | Slug | Convention réelle |
  |---|---|---|
  | Marchand-Grillot | `marchand-grillot` | `prénom.marchand-grillot@`**`mavigne.app`** |
  | Chapelle | `domaine-chapelle-et-fils` | `prénom.`**`domainechapelle`**`@mavigneapp.fr` |

  Elle se **déduit par majorité des adresses fictives déjà en place** ; sur un domaine neuf, le slug
  sert de départ ; le champ reste modifiable.
- ⚠️ **Sa normalisation garde les tirets et les points.** `_agtLotPart` ≠ `_agtLotKey` : la seconde
  sert à comparer des **prénoms** et mange tout ce qui n'est pas lettre ou chiffre — appliquée à la
  partie d'adresse, elle transformait `domaine-chapelle-et-fils` en `domainechapelleetfils`.

### Lot 3 — les périodes (1 h 30 → ~20 min)

- Par défaut, l'installation posait **une seule campagne du 1ᵉʳ janvier au 31 décembre** portant
  toutes les tâches → tout le pilotage raisonne alors sur l'année d'un bloc.
- ★★ **On ne devine aucun calendrier : on RECOPIE le découpage d'un domaine déjà installé**, dates
  ramenées sur la campagne en cours. Même patron que la convention d'adresse : ce qui existe vaut
  mieux qu'une valeur inventée.
- ⚠️ **Le décalage se calcule sur la DERNIÈRE fin**, pas sur la première : une campagne à cheval
  sur deux années civiles se ferait sinon translater d'un an de trop. **Le 29 février retombe au 28**
  quand l'année d'arrivée n'est pas bissextile.
- ⚠️ **Les tâches que le nouveau domaine ne connaît pas sont écartées et comptées** — un barème
  régional ne porte pas les mêmes travaux.
- **Deux avertissements** : les **tâches qu'aucune période ne réclame** (elles n'apparaîtraient
  nulle part) et les périodes incomplètes.
- **Deux gardes à l'écriture** : nom **et** dates exigés (§16c) ; refus si aucune période ne porte
  de tâche.
- ⚠️ **Les dates se lisent au `onblur`, jamais au `onchange`** (§19, piège du champ date).

### Lot 4 — le formulaire de mise en route arrive en base

- **`submitMiseEnRoute`** (`functions/leads.js`, modèle `submitLead`) : CORS borné, leurre anti-bot,
  champs clippés, `maxInstances: 3`.
- ★★★ **Il écrit dans le MÊME document `leads`**, déjà indexé sur `sha256(e-mail)`, **sous la clé
  `mer`**. Conséquences : **aucune collection nouvelle**, donc **aucune règle Firestore à déployer**
  (`leads` est déjà `read: isGtAdmin` / `write: false`), et **les réponses atterrissent dans le
  dossier que l'assistant d'installation ouvre déjà**. Si la personne n'est jamais passée par le
  formulaire d'essai, le dossier est **créé** ici, avec sa provenance.
- ★ **Le récapitulatif lisible est construit par la PAGE**, pas par le serveur : les soixante
  libellés n'existent qu'à un seul endroit. Le serveur ne le réécrit pas, il le **borne**.
- **La page** envoie sept clés (`dom`, `ctMail`, `recap`, `t`, `r`, `c`, `hp`) et **essaie deux
  adresses** : l'URL complète de la fonction d'abord, `/api/mise-en-route` ensuite.
  ⚠️ **`rewrites` est ABSENT du `firebase.json` lu**, alors qu'`essai.html` poste vers `/api/lead` :
  soit ce fichier est en retard, soit la version en ligne appelle l'URL absolue — ce que suggère la
  CSP. **À vérifier en ligne** ; si un rewrite existe, en ajouter un pour la nouvelle route.
- **En cas d'échec, rien ne se perd** : le texte est affiché **et sélectionné**, avec l'adresse où
  l'envoyer. ★ **Et le succès rappelle que les FICHIERS restent à joindre** — l'envoi ne transporte
  que les réponses, pas le parcellaire.
- **Dans l'assistant** : un bloc **« Ce que le client a répondu »** affiche le récapitulatif, plus un
  bouton qui reprend **le SIRET, les écartements et la période**.
  ⚠️ **Et rien d'autre.** L'IDCC est affiché mais **pas écrit** : rien ne le lit encore dans
  l'application, le poser donnerait l'illusion d'un réglage fait.
- ⚠️ Un SIRET incomplet, un écartement absurde ou une période qui finit avant de commencer **ne sont
  pas repris — et le bouton ne les promet pas**.

### Lot 5 — machines et futaille

- Collage d'une liste : `Nom`, `Nom;modèle`, `Nom;modèle;hydrostatique`, `;traitement` pour un engin
  réservé aux traitements. Écrit dans `tracteurs_list` **après** `onboardTenant`, **seulement si une
  liste existe** — sinon le domaine garde son tracteur unique de démarrage.
- ⚠️⚠️ **LA PREMIÈRE MACHINE DOIT GARDER L'IDENTIFIANT `trac1`.** Toutes les activités du seed y
  renvoient (`tracteurDefautId:'trac1'`) : décaler cet identifiant laisserait chaque activité
  pointer un tracteur inexistant, **en silence**.
- **Volume d'un fût** : 225 L bordelaise · 228 L bourguignonne · 400 L demi-muid · 500 L.
  ⚠️ **Ne rien choisir RETIRE la clé** au lieu d'écrire 228 en dur.
  ⚠️ **Garraud est en Gironde : 225 L.** Sinon toute sa cave — part des anges, volumes d'ouillage,
  capacité — est calculée sur des pièces bourguignonnes.

### Ce que le chantier a appris sur l'outillage

- ★★★ **Le preflight ne contrôle que `onclick`** — `onblur` et `onchange` ont exactement le même
  sort. Contrôle maison de tous les handlers inline (§6c).
- ★★ **`_agtInsNorm()` : UNE seule normalisation des quatre listes** (`parc`, `noms`, `per`, `mach`)
  en tête du rendu. J'avais commencé par semer des `|| []` à chaque lecture — **toujours rouge**,
  parce que d'autres fonctions les parcourent aussi. **Semer des gardes, c'est se garantir d'en
  oublier une.**
- ★★ **Un dry-run doit être SÉQUENTIEL** (§25).
- ★ **L'ORDRE des blocs à l'écran compte** : « Ce que le client a répondu » arrivait **après** les
  parcelles, les périodes et les machines, alors que c'est lui qui les alimente. Déplacé avant —
  **mêmes caractères, ordre différent**, prouvé.
- ★ **La liste « À finir chez ce client » suit désormais ce qui a été posé**, et affiche en vert ce
  qui vient de l'être. Elle réclamait le SIRET, les écartements et les fûts que l'assistant sait
  maintenant écrire : **un écran qui ment sur son propre travail**.
- **354 assertions, 9 harnais, 31 défauts réintroduits et 31 rougissements, preflight 0 erreur.**

### Déploiement (✅ FAIT le 11/08)

```
xcopy functions ..\mavigne-sauvegardes\avant-mer\functions\ /E /I /Y
firebase deploy --only functions:submitMiseEnRoute
npm run build && firebase deploy
```

⚠️ Cibler la fonction **par son nom**. Pas de rules, pas de backfill.
Fichiers : `src/admin-gt.js` · `src/firebase.js` · `functions/leads.js` ·
`public/mise-en-route.html`. **Aucun bump.**
✅ **Déployé le 11/08.** ⚠️⚠️ **Mais aucun de ces cinq lots n’a encore servi de bout en
bout** : l’installation à blanc sur un slug jetable reste à faire, et c’est elle qui transforme
le « 20 h → ~9 h » en mesure. **Un lot déployé mais jamais exécuté n’est pas un lot validé** —
c’est la même famille de piège que « livrer n’est pas intégrer », d’un cran plus loin.
★ **Depuis le 10/08, ces fichiers vivent dans le dépôt GitHub** (§ Règle d'or n°1) : les
récupérer par `git clone`/`git pull` plutôt que par upload avant de vérifier s'ils sont partis.

---

## 18c. ★ La procédure imprimable

**`INSTALLER-UN-DOMAINE.md`** (la source) + **`mkpdf.py`** (le générateur) + le **PDF** —
tous **hors dépôt**, dans `..\mavigne-sauvegardes\` (donc hors Git aussi, cf. « Environnement de
Nico »).

Cinq pages A4, écran par écran, dans l'ordre réel, avec les refus possibles et ce qu'ils veulent
dire, et une annexe « mesurer » : temps estimé contre temps réel, étape par étape.

**Chaîne de production** : polices récupérées en paquets `@fontsource` par npm, converties woff→ttf
par `fontTools`, embarquées par ReportLab. Aucune dépendance externe au rendu.

⚠️⚠️ **LE PIÈGE DU PDF, à retenir** : les polices latines n'ont **ni pictogramme d'avertissement,
ni flèche, ni émoji**. Un caractère absent sort en **carré noir** — et **l'extraction de texte ne le
voit pas**. Le premier contrôle est passé au vert avec un carré bien visible dans l'en-tête.
**Seule la rastérisation des pages l'a attrapé.**
→ Substituer **avant** le rendu, et **regarder les pixels** : `pypdfium2` rend chaque page, on la
relit.
★ Autre correction du même ordre : Cormorant a des **chiffres elzéviriens**, donc le « 1 » d'un
numéro de section se lit « i » — les numéros passent en Outfit, les titres restent en Cormorant.

★ **Contrôle croisé utile** : chaque affirmation vérifiable du document (nom des boutons, ordre des
blocs, libellés des refus, valeurs proposées) a été **testée contre le code**. Dix-huit
vérifications — dont une a rougi sur un motif de recherche que j'avais mal écrit, pas sur le code.

★★ **Et le fait le plus utile du chantier : écrire la procédure a trouvé deux défauts** (l'ordre des
blocs, la liste « à finir » périmée). **Rédiger le mode d'emploi d'un écran est un test.**

---

## 19. Planning RH & annualisation

**Base légale** : convention **IDCC 7024**, **1607 h/an**, modulation **250 h**.
**Mode CP** : `CONFIG.cp_mode` — `ouvrables` (défaut légal, L3141-3) ou `ouvrés`.

**Livré** :
- Grille équipe, éditeur **slide-up**, multi-sélection, « Outils du planning », « Anciens salariés ».
- **Annualisation** : plafond 1607 h **proratisé**, **travail effectif distinct des heures
  rémunérées**, motifs d'absence types.
- **Heures travaillées vs prévues** : vivant à **6 points de rendu**.
- **Solde de départ** d'heures sup + tableau annuel + bloc PDF. **Jours travaillés** sur le relevé
  PDF (exigence MSA).
- **CP multi-périodes / multi-employés.**
- ★ **« Jour de remplacement »** — `Math.max(0, ecart)` empêchait les deux moitiés d'un échange de
  s'annuler → badge bleu, `_planRempH`.
- ★ **« Heures dues »** — `CONFIG.hsup_dues_debut`. **Jamais rétroactif.**
- ★ **`planClearDay()`** — sans confirmation, **au niveau jour seulement**.
- ★ **Multi-sélection corrigée** — `planMultiApply()` écrivait des entrées nues sans la logique
  métier du chemin « Outils ». Correctif : `_planCpDayType` + `_planCpCount` appelés par **les deux**.

### ★ Heures supplémentaires

- **Colonne cumulée « Reste à prendre »** : accumulé − récup prise − heures payées.
- **`planSaveHsupAt` ne plafonne plus au mois** : débordement automatique sur `paye_bank`.
- **PDF mensuel sur UNE page**, tableau annuel jusqu'au **mois courant seulement**.
- ⚠️ **Terminologie ouverte** : l'écran dit « Solde cumulé », le PDF « Reste à prendre ».

### ★★ Capacité réelle — `_capWeekReal`

L'ancienne capacité hebdo multipliait un **effectif** par les heures d'un **modèle « standard »
unique**. Le simulateur de renfort héritait de ce chiffre faux.

**`_capWeekReal(o0, o1)`**, définie **dans `_chargeSaisonData`**, parcourt **jour par jour, salarié
par salarié**. Deux mesures **volontairement séparées** :
- **`_planWorkH`** = **capacité** (un CP compte **0**) ;
- **`_planDayH`** = **socle payé** (un CP compte ses heures rémunérées).

★ **Paramètre année optionnel** : une campagne **à cheval sur deux années** charge le bon modèle
pour chaque moitié. ⚠️ **Repli complet** si `capHPerm` est absent. 27 scénarios exécutés.

★★ **`_planWorkPersRange(mbr, Date, Date)`** — ⚠️ **signature : un membre et DEUX OBJETS Date.**
C'est la source unique de « combien d'heures cette personne a-t-elle été là », partagée par
Économie › Exercice **et** l'écart de cadence (§20b).

### ★★ Les saisonniers ne disparaissent plus de l'historique

Les courbes filtraient sur `statut !== 'Inactif'`. Marquer un contrat terminé effaçait la personne
de **tout l'historique** : le pic d'effectif tombait de **10 à 4**.
**Correctif** : `window._mvEnContratSurPeriode(m, d0, d1)`, appliquée aux **3 sites**.
⚠️ Les écrans « **qui est là aujourd'hui** » sont **volontairement inchangés**.

★★★ **SUITE DU 12/08 — le même piège, un cran plus loin (§33).** Le correctif ci-dessus réglait
la question 2 (« a-t-il travaillé pendant cette période ? ») **tant qu'un salarié n'a qu'un seul
contrat**. Dès qu'il en signe un second, saisir la nouvelle date de début **écrasait la
précédente** : le passé disparaissait quand même, et cette fois **à la saisie**, hors de portée de
tout code de lecture. `m.contrats[]` + `window._mvContrats(m)` corrigent le modèle.
**Trois questions, trois lecteurs, à ne plus jamais confondre :**

| question | qui répond | voit |
|---|---|---|
| est-il là **aujourd'hui** ? | `_mvEnContratLe` | tous les contrats |
| a-t-il travaillé **sur cette période** ? | `_mvEnContratSurPeriode`, `_inContractDay` | tous les contrats |
| combien lui doit-on **sur CE contrat** ? | `_planInContract` (**35 appels**) | **le contrat en cours seul** |

⚠️⚠️ **`_planInContract` NE DOIT PAS être élargi.** Il pilote le plafond des 1607 h, les congés et
toute la grille. Règle de Nico : *un contrat = un compteur ; deux contrats séparés par une coupure
= deux compteurs.* Les fondre fausserait la paie.

### ★★ Équipe collective (COLLECTIF-1)

Un membre peut être une **équipe** : une ligne de planning pour N personnes, effectif modifiable
**jour par jour**. `_mvEstCollectif`/`_mvEffDef`/`_mvPoidsNom` · `_planEffN`/`_planCollH`/
`_planEffApply` · **`_mvPartCalc` pondéré**.
★ **`_headWeek` expose deux mesures** : `head` (pondéré) et **`headPerm`** (permanents seuls).
**Arbitrage figé** : cadence, ordre de passage et journée raisonnent sur les **fiches permanentes**.

★★★ **Le module a été refondu en deux lots — voir §19a.** Tout ce qui suit décrit le calcul, qui
n'a pas bougé ; l'organisation des écrans, elle, a entièrement changé (trois onglets, cinq feuilles
au lieu de neuf, une sélection qui n'est plus un mode).

**⚠️ Pièges du module :**
- **`<input type="date">` avec `onchange`** déclenche à **chaque date structurellement valide** en
  cours de frappe → **`onblur` pour les dates**, `onchange` pour les nombres.
  ★ **Règle réappliquée le 09/08** à l'éditeur de périodes de l'assistant d'installation.
- **iOS `input[type="time"]`** et **tout champ** rempli après `innerHTML` : `.value` **en JS**.
- **Incohérence ouverte** : `_pl2Annual` somme la référence **brute** du modèle, alors que
  `_planSummary.ref` exclut hors-contrat et récups. **Décision de conception d'abord.**
- Le modèle « standard » totalise 1589 h/an contre 1607 → avertissement orange.
- `planning.js` **seul** = **aucun bump**.

---

---

## 19a. ★★★ LA REFONTE DU PLANNING — « il y en a un peu partout »

### Le diagnostic, chiffré avant d'écrire une ligne

Le point de départ n'était pas un bug mais une phrase de Nico : *« il y en a un peu partout, il faut
parfois cliquer sur un membre parfois non, il est assez compliqué de s'y retrouver. »*
L'audit a mis des nombres dessus — et c'est ce qui a rendu la refonte discutable au lieu d'être une
question de goût :

| Constat | Chiffre |
|---|---|
| ★★★ **Feuilles pour un seul module** | **9** — jour, fiche, outils, chaleur, CP, heures multiples, archives, absence multiple (injectée en JS), éditeur de grille |
| ★★★ **Chemins pour poser un congé** | **4** — case → éditeur · sélection → CP · Outils → période · et la fiche, onglet Congés, qui **ne le fait pas** mais *explique le chemin des autres* |
| ★★ **Chemins pour les horaires chaleur** | **3** — preset dans l'éditeur, sélection multiple, Outils |
| ★★ **Salariés affichés deux fois** | grille (nom + h/réf) **puis** cartes de synthèse (nom + h/réf + écart + ETP). Les deux ouvraient la même fiche. |
| ★★★ **Renvois « va ailleurs » écrits en dur** | **8**, dont *« grille Équipe → Sélection multiple → ☀️ CP »* |
| ★★ **Profondeur des réglages annuels** | **3 niveaux** — Planning › Outils › « Modèles, cadre légal & coupure » |

★★★ **LE SIGNAL LE PLUS FORT : l'app écrivait son propre mode d'emploi.** Huit fois, l'interface
expliquait par où passer pour faire quelque chose qu'elle ne faisait pas là où on la lisait.
**Une note qui décrit un chemin est l'aveu que le dessin a raté.** C'est le même défaut que
l'écran « à venir » du Pilotage (§20g) et que la liste « à finir » de l'assistant (§18b), pris par
l'autre bout : là, l'écran mentait sur l'avenir ; ici, il disait vrai — et c'était pire, parce qu'un
mode d'emploi juste n'a aucune raison de disparaître.

### La cause racine

Le module mélangeait **trois métiers qui n'ont ni la même fréquence ni le même acteur** :

| Métier | Fréquence | Qui |
|---|---|---|
| **Tenir** le mois | tous les jours | le chef d'équipe |
| **Suivre** une personne | à la paie | l'administrateur |
| **Régler** le cadre | une fois l'an | le gérant |

Ils vivaient dans **deux onglets et neuf feuilles**, dont un onglet caché derrière un engrenage.
★ **Chercher le métier, pas l'écran.** Le désordre n'était pas dans le nombre de boutons : il était
dans le fait qu'un geste quotidien et un réglage annuel partageaient le même tiroir.

### Lot 1 — la sélection n'est plus un mode, c'est un état

**Le défaut central, et il tenait en une phrase :** toucher une case ouvrait l'éditeur du jour —
**sauf** si le bouton « Sélection multiple » était armé, auquel cas la même case se cochait.
**Deux effets pour un geste identique, et rien à l'écran ne disait lequel s'appliquerait.**

- **`planCellTap` coche, toujours.** Le bouton « Sélection multiple » est supprimé, `_pl2Multi`
  n'existe plus.
- **Trois cochages de plus** : `planColTap` (l'en-tête du jour → toute l'équipe ce jour-là),
  `planRowTap` (le nom → sa ligne sur la vue), `planSelAll` (le coin → toute la vue).
  ⚠️ **Conséquence assumée : le nom n'ouvre plus la fiche.** Une cible, un effet. La fiche s'ouvre
  depuis « Les gens ». C'est le seul point de dépaysement du lot, et il est réversible.
- ★★ **`_pl2SelSync()` ne reconstruit PAS la grille.** Un rerender complet à chaque case touchée
  coûtait le scroll et un clignotement — **sur le geste le plus fréquent du module**. Le sync ne
  touche que les classes (`.pl2-selon`, `.pl2-nameon`, `.pl2-hdon`) via `data-cell` / `data-plrow` /
  `data-col`. **Le coût d'un rendu se paie au rythme du geste, pas au rythme du code.**
- ★★ **La barre ne propose que ce qui s'applique.** `_planSelStats()` compte ce que la sélection
  contient (équipes collectives, jours travaillés, saisies existantes) et `_pl2MbarSync()` construit
  les boutons en conséquence. **Avant, « Effectif » était toujours là et ne servait, sans équipe
  collective cochée, qu'à afficher un message d'erreur : un bouton dont le seul rôle est de dire
  non.**
- ★ **`_planSelResume()`** remplace « 3 jours sélectionnés » par « Jean · 9 → 14 juin · 12 cases ».
  **Ce qu'on relit avant d'appliquer, c'est QUI et QUAND, pas un compte.**

### Lot 1 — une seule feuille, un jour ou trente

`ovPlanMultiH` et `ovPlanMultiAbs` **disparaissent dans `ovPlanDay`**. La feuille se rend en deux
variantes (`_planSheetOneHtml` / `_planSheetManyHtml`) qui partagent leurs blocs
(`_planSheetModes`, `_planSheetTiming`, `_planSheetRemp`, `_planSheetComment`,
`_planSheetAbsSection`).

⚠️⚠️ **Les namespaces `pmh-` et `pma-` sont supprimés — et il faut comprendre pourquoi ils
existaient.** Le commentaire d'origine était juste : `closePlanDayModal()` ne retire que `.open`, le
HTML de l'éditeur **reste dans le DOM**, donc réutiliser `#plan-abs-h` dans une seconde feuille
créait des ids dupliqués. **Le namespace était le bon correctif d'un mauvais dessin.** En fusionnant
les feuilles, la cause disparaît : les identifiants redeviennent uniques.
★ **Une convention de nommage qui existe pour départager deux écrans concurrents est un symptôme.
Supprimer la concurrence vaut mieux que discipliner les noms.**

### Lot 1 — les moteurs, et le bug qu'ils ont révélé

Trois fonctions, **qui ne lisent aucun champ du DOM** — tout arrive en paramètre :

- `_planApplyHeures(keys, {debut, fin, continu, comment, heat, remp, force})`
- `_planApplyAbs(keys, motifId, comment, heuresVal)`
- `_planApplySimple(keys, 'rec'|'heat'|'clr', force)`

★★★ **`force` est le seul paramètre qui compte vraiment.** Il vaut `true` quand le geste porte sur
**une case désignée à la main** : on écrase ce qui s'y trouve. Sans lui — geste groupé — congés,
absences et récupérations sont **préservés**. **On ne détruit pas en lot ce qu'on n'a pas relu.**

⚠️⚠️ **BUG RÉEL, trouvé en unifiant, pas en auditant.** `planMultiApply('rec')` et
`planMultiApply('heat')` faisaient `_eb[d]=e` **sans aucun test sur l'entrée existante** : poser
« Récup » ou « Chaleur » sur une semaine **écrasait les congés déjà posés, en silence**. La feuille
« Heures », elle, les préservait — et l'annonçait dans sa note. **Les deux chemins ne préservaient
pas les mêmes choses parce qu'ils étaient écrits deux fois.**
★★★ **La duplication ne produit pas seulement du code en trop : elle produit des règles métier
différentes pour un même mot.** « Poser une récup » ne voulait pas dire la même chose selon le
bouton emprunté. Aucun test ne pouvait le voir — il n'y avait pas de contradiction *dans* un
chemin, seulement *entre* les deux.

### Lot 2 — trois onglets, un verbe chacun

Même patron que Pilotage › Cave (§20g), **table de migration comprise** :

```js
var _PLAN_TAB_MIGR={planning:'mois',equipe:'mois',tableau:'mois',saisie:'mois',templates:'cadre'};
var _PLAN_VALID_TAB={mois:1,gens:1,cadre:1,moi:1};
```

- **`mois`** — la grille, et rien d'autre. Plus `_planPeriodeBar()` : deux boutons **visibles**
  (« Congés sur une période », « Chaleur sur une période ») pour ce que la grille ne sait pas
  cocher, c'est-à-dire une plage qui déborde la vue affichée.
- **`gens`** — `_pl2Synth()` (une seule fois), le récap annuel, et les anciens salariés en section
  de bas de page. Le mois consulté se change **ici aussi** (`_planGensMois`) : les chiffres de chaque
  carte en dépendent, et renvoyer l'utilisateur dans « Le mois » pour ça serait un aller-retour.
- **`cadre`** — l'ancien onglet caché `templates`, sans son bouton « ← Retour au planning » (un
  onglet n'a pas de retour).

★ **L'ouvrier n'a plus d'onglets du tout** et tombe sur son mois : `renderPlanning` masque
`#plan-tabs` entier. **Un onglet unique n'est pas un choix, c'est un décor.**
⚠️ **L'admin perd « Mon planning », et c'est voulu** : sa ligne est dans la grille comme tout le
monde, sa fiche est dans « Les gens ». L'onglet faisait doublon avec sa propre ligne.

### ⚠️⚠️⚠️ Le défaut de modèle : un réglage du domaine logé dans une fiche individuelle

**Le mode de décompte des congés** (6 jours ouvrables / 5 jours ouvrés) **et la période de
référence** se réglaient depuis **l'onglet Congés de n'importe quel salarié**. L'écran disait bien
« · domaine » en petit sous le titre — mais l'emplacement disait le contraire, et l'emplacement
gagne toujours. **Changer le réglage depuis la fiche de Marie changeait le décompte de toute
l'équipe.**

★★★ **Le test à retenir : la PORTÉE d'un réglage doit se lire dans son EMPLACEMENT, pas dans son
libellé.** Un réglage global posé dans un écran individuel est un piège même quand il est
correctement étiqueté. Les deux réglages sont dans « Le cadre ».

⚠️ **C15 m'a rattrapé au milieu du geste** : j'avais sorti le bloc de la fiche **avant** de l'avoir
posé dans « Le cadre ». Le preflight a signalé `planSetCpMode` et `planSetCpPeriode` **sans aucun
appelant**. Sans lui, deux réglages devenaient **inatteignables en silence**.
★★ **Un déménagement se fait en deux gestes, et le contrôle de joignabilité est exactement ce qui
surveille l'intervalle entre les deux.**

### Le décompte des feuilles

| Étape | Feuilles |
|---|---|
| Avant | **9** |
| Après lot 1 | **7** (`ovPlanMultiH`, `ovPlanMultiAbs` fusionnées) |
| Après lot 2 | **5** (`ovPlanTools`, `ovPlanArchives` supprimées) |

Restent : la feuille du jour, la fiche salarié, les congés, la chaleur, l'éditeur de modèle.
⚠️ **Non fait, alors qu'annoncé** : la fusion de `openPlanCP` (une période) et `openPlanCPSel` (les
cases cochées) — **c'est déjà le même overlay avec deux rendus**, la fusion est à portée.

### Le harnais — 12 scénarios, contre-épreuve comprise

Les moteurs ne lisant aucun champ du DOM, ils s'exécutent **hors navigateur**. Le harnais rejoue
les règles qui avaient divergé : préservation en lot, écrasement en `force`, remplacement limité aux
jours sans heures prévues, congé remplacé **compté**, absence jamais convertie en travail,
effacement possible hors contrat.

★★ **La contre-épreuve a été faite pour de bon** : les trois défauts réintroduits un par un — garde
de préservation retirée, remplacement autorisé sur les jours travaillés, effacement soumis au
contrat. **Le harnais rougit à chaque fois, sur le bon scénario.** Un harnais qu'on n'a pas vu
rougir ne mesure rien.
⚠️ **Le harnais s'est planté avant de mesurer, et il faut savoir le reconnaître** : un
`new Function('ctx','return ' + wrap)` où `wrap` commençait par un saut de ligne — **ASI**, `return;`
puis le corps, et douze rouges qui ne parlaient pas du code testé. **Douze rouges identiques
accusent le harnais, pas le sujet.**

### Ce que la refonte a coûté à l'accompagnement (C22, §27a)

**Huit renvois périmés**, traqués et corrigés **dans le lot, pas après** : trois points de la fiche
`MV_AIDE` du Planning réécrits, deux chemins faux (`Planning › Outils` → `Planning › Le cadre`), la
note d'effectif de `reglages.js`, deux hints du module, et la section `guide/10-planning.html` (les
chemins, plus deux blocs neufs sur les onglets et le geste de cochage).

★ **Écrire la procédure a encore trouvé un défaut** — cette fois dans ma propre prose : j'ai écrit
`<p class="warn">` alors que la classe du guide est `.note.warn`, avec une structure
`<span class="ni">` + `<div>`. **L'encart se serait affiché nu.** Rien ne l'aurait signalé : aucun
palier de test ne lit le guide.

⚠️ **FAUX POINT DUR — à noter parce que je l'ai affirmé avant de le vérifier.** J'avais annoncé que
la visite guidée casserait (`openPlanFiche('Jean')` en dur dans `_mvtSteps`). **Elle ne casse pas** :
ses deux étapes visent `.pl2-board` (qui reste dans l'onglet par défaut) et `openPlanFiche` (toujours
exposée, c'est un overlay indépendant de l'onglet actif).
★★★ **J'ai énoncé un risque comme un fait sans l'avoir mesuré, et il a servi d'argument dans un
arbitrage de découpage.** C'est la Règle d'or n°1 appliquée à mes propres affirmations :
**la fraîcheur d'un constat se mesure, y compris quand le constat est le mien.**

### Les fichiers touchés

`index.html` (racine) · `src/planning.js` · `src/styles.css` · `src/utils.js` · `src/reglages.js` ·
`public/sw.js` · `guide/10-planning.html` + `public/guide.html` régénéré.
**Bump APP + SW aux deux lots** (`index.html` touché). Le guide se déploie en `--only hosting`,
sans bump — c'est une page de `public/`, hors `SHELL_STATIC` (§27d).

---

## 20. Cave — Le Chai & Le Cuvier

- **Le Chai** (namespace `mvc-`) : élevage, fûts, **jauges de part des anges**.
- **Le Cuvier** : vendange. **Cuvées normalisées** (`_cuvKey` + distance de Levenshtein).
  ★ **Repeint aux couleurs de la Cave le 09/08** (c'était le dernier écran sombre ; 7 textes hérités
  étaient illisibles).
  ★★ **La distance de Levenshtein du Cuvier a servi de patron** à l'appariement des noms de
  parcelles (§18b) — **recopiée volontairement dans `admin-gt.js` plutôt que remontée dans
  `utils.js`** : c'est de l'arithmétique de chaînes, pas une règle métier, et la remonter aurait
  coûté un bump SW pour un écran que le client ne voit jamais.
- **Rendements pluriannuels** dans `p.rendement_hist[]`. Millésime = **année civile de la date**.
- ⚠️ **Piège de type vécu** : `renderVendCuves` fait `c.parcelles.map(...)`. Une **chaîne** passée là
  où un tableau était attendu produit un `TypeError` **silencieux**.
- ⚠️ Déséquilibre `<div>` **préexistant** dans `cave.js` : **non-régression, à ne pas chercher à
  corriger au passage**. Le contrôle de balance compare TOUJOURS base → patché.

★★ **`cave.js` est de loin le plus gros module du projet** (~375 ko).
⚠️ **Surveiller sa taille.** Un `cave-doc.js` séparé coûterait un bump APP + SW.

### ⚠️⚠️ Défauts historiques du Cuvier, corrigés en août

**1. Le décuvage marquait tous les fûts « neufs ».** **La pyramide des âges était fausse depuis
toujours.** Corrigé par l'entonnage depuis le parc (§20e).

**2. Le SVG s'étirait sur grand écran.** ★ **Corrigé par Nico lui-même.** **Règle : un SVG à
`viewBox` fixe doit être borné en largeur.** ★★ **Depuis août, préférer CSS pur pour les frises.**

**3. ★★ Une analyse rouverte perdait ses valeurs.** `opData` est reconstruit **en entier** à
l'enregistrement, et le formulaire n'était **jamais pré-rempli** → rouvrir une analyse pour corriger
sa date réécrivait `so2_libre`, `so2_total` et `av` **avec ce qui traînait dans le DOM**.
★ **Leçon générale : dès qu'un formulaire est reconstruit en entier à l'enregistrement, il DOIT être
pré-rempli à l'édition et vidé à la création.**

**4. ★ Le Chai s'ouvrait VIDE au premier accès** (05/08) : `caveTab` initialisé à `'dash'`, un
onglet purgé depuis longtemps → 4 vues masquées, aucune erreur, aucun test. Corrigé en trois gestes
indissociables dont un **filet de tolérance** en tête de `switchCaveOng`.
★★ **Même famille que le bug `ecf` de la visite guidée** : une clé d'écran survit à l'écran.

## 20b. Pilotage

> ⚠️ **REFONDU DEUX FOIS.** **§34** (12/08) a posé l'**axe de zoom**, la portée unique et le moteur
> de diagnostic. **§42** (15/08) a traité ce que §34 n'avait pas touché : la **densité**, la
> **hiérarchie typographique** et le **texte**. Ce qui suit décrit l'état d'arrivée des deux.
>
> ★★★ **LES TROIS RÈGLES DU MODULE, à connaître avant d'y toucher (§42b)** :
> ① ce qui **CADRE** un chiffre reste à l'écran, en une ligne, avec un **filet doré** devant ·
> ② ce qui **EXPLIQUE le calcul** vit dans `MV_INFO`, derrière une pastille « i » ·
> ③ ce qui **DIT QUOI FAIRE** est un **bouton**, jamais un chemin à retenir.
> ⚠️ **Toute carte neuve porte les trois.** Les harnais `mv-harnais-info` et `mv-harnais-carte`
> refusent une carte sans ligne de cadre, une pastille sans fiche, et une fiche sans pastille.
>
> ★★ **La carte a TROIS ÉTAGES, tous dans `.pil-th`** : étiquette (+ pastille + chevron) · LE
> CHIFFRE · la ligne de cadre. **C'est l'unique justification du repli par défaut** — si le chiffre
> ou son cadre tombaient dans le corps, replier cacherait une information.
> ★ **`_pilTile(…, infoCle)` et `_pcavCard(…, infoCle)`** : dernier argument **optionnel**.
> ★ **L'échelle de texte** — onze pas nommés dans `styles.css` (`--pt-*`), **chaque appel avec son
> repli**. Toute nouvelle taille passe par là, ou le cliquet rougit.

- ★★★ **8 entrées** (`_PIL_TABS`), **du large au fin** :
  **Aujourd'hui · ① L'année · ② La campagne · ③ L'équipe & les tâches · ④ Simuler ┃ Cave ·
  Économie · Conformité** (+ ⚙️ Outils `_PIL_TOOLS` : Archives, Paramétrage).
  ★ **`_PIL_ZOOM_FIN = 'sim'`** marque où le zoom s'arrête : un filet est posé après, et les trois
  suivants sont des **écrans de détail**, pas des niveaux. « Aujourd'hui » n'est pas numéroté —
  ce n'est pas un niveau de zoom, c'est le présent.
  ⚠️⚠️ **LES CLÉS N'ONT PAS BOUGÉ** (`avc`, `equ`, `sim`…) : elles sont mémorisées chez les clients,
  citées par `app.js` (les moments de démo cliquent `[data-tab="eco"]` et `[data-tab="equ"]`,
  `app.js:2226`) et vérifiées par C22. **On renomme les libellés, jamais les clés.** Seul `an` est
  neuf. `_PIL_VALID_TAB` accepte donc **10 clés**.
  ★★ **`_PIL_TAB_MIGR` reste la LISTE DES CLÉS MORTES** (`prs`→`equ`, `mat`→`equ`, `ecf`→`eco`) —
  c'est ce qui permet à C22 de détecter qu'un autre fichier en demande encore une (§6c).
  Aucune clé n'y a été ajoutée par la refonte : rien n'a été retiré.
  ★ **`_PIL_TABS` et `_PIL_TOOLS` sont exposés sur `window`** depuis le 09/08, pour que l'aide
  contextuelle liste les onglets en les **lisant** (§27b) — donc `_mvAideOngletsPil` a suivi la
  refonte **toute seule**. Seules les lignes écrites en dur de `MV_AIDE.pilotage` ont dû être
  reprises (« Décider » n'existait plus).

- ★★★ **`_PIL_SCOPE` — LA PORTÉE UNIQUE.** Le module portait **cinq sélecteurs qui s'ignoraient** :
  `_PIL_ETPSEL` (frise), `_PEC_SUB` (économie), `_PEX_AN` (exercice), `_PCAV_MIL` (millésime) et la
  période active. Cliquer une campagne ne bougeait **qu'un panneau** ; les chiffres au-dessus
  restaient sur une autre fenêtre **sans le dire**. `_PIL_SCOPE.camp` remplace `_PIL_ETPSEL`, qui
  n'est plus qu'un **alias en lecture** (`Object.defineProperty`) pour ne rien casser d'externe.
  ⚠️ **Toute nouvelle vue lit `_PIL_SCOPE`. On n'ajoute pas un sixième sélecteur.**
  ★ `_pilScopeVerif(ann)` nettoie une **portée fantôme** : une période supprimée ou renommée
  laisserait l'écran filtrant sur un nom que plus personne ne porte.

- ★★ **Les cartes arrivent REPLIÉES** (`collapsed` tout à 1) et **une seule s'ouvre à la fois** :
  c'est ce qui rend ses 2 à 4 colonnes à `.pil-panels`. ⚠️ **Replier ne cache aucun chiffre.**
  ⚠️⚠️ **Tout changement de défaut de disposition exige un cran de `_PIL_ST_V`** : `_pilSaveState`
  grave l'état complet chez le client, et **le mémorisé gagne sur le défaut**. Sans le cran, un
  client installé ne voit **strictement rien**. La migration passe **après** `_pilNormalize`
  (qui emporterait `v`), et ne repose que `collapsed` — `show`, `pie`, `bar`, `sub` survivent.

- ★★ **Les quatre photos** (`_pilPhotosHtml`) en tête de **tous** les onglets : Travaux · Effectif ·
  Budget · Conformité, à la maille de la portée, chacune menant à l'écran qui la détaille.
  ★ **En frise d'une ligne sous 700 px.** ⚠️ Elles restent **quatre** et **visibles** : on ne
  remplace pas quatre chiffres par un bouton « voir les chiffres » — le harnais l'interdit.
  ⚠️ **L'effectif affiche le PIC, jamais la moyenne** — une moyenne annuelle n'existe aucun jour de
  l'année, et c'est le pic qui décide d'un recrutement.
  ⚠️ **Source absente ⇒ tiret, jamais zéro.** Un tableau de bord qui écrit 0 là où il n'a pas su
  calculer ment.

- ★★★ **`_pilDiag()` — LE MOTEUR DE DIAGNOSTIC.** Il remplace les **29 impasses** (`pil-empty`) qui
  écrivaient « Réglages › Saisons » **sans aucun lien**, et qu'on ne découvrait qu'en ouvrant
  l'onglet qui les contenait. Neuf constats calculés, **aucun écrit en dur**. Trois gravités :
  `'r'` **bloquant** (le chiffre ne se calcule pas) · `'o'` **faussant** (il sort, mais faux —
  le plus dangereux) · `'b'` **améliorable**.
  ⚠️ **Chaque constat dit CE QUE ÇA FAUSSE**, pas seulement ce qui manque : sinon le lecteur juge
  de l'urgence sans les éléments.
  ★ `_pilGo(cible)` ouvre la page + `switchReglTab` + `scrollIntoView` + **clignotement** d'une
  seconde. Les 7 ancres `#set-sec-*` sont vérifiées dans `index.html`.
  ★★ **Les drapeaux des photos tirent du MOTEUR**, pas de tests écrits sur place : un chiffre ne
  peut pas porter un drapeau que la liste ne contient pas.
  ★ `_pilDiagCouverture` **pèse la gravité, pas le nombre** — dix remarques améliorables ne valent
  pas un trou dans le calendrier. Plancher à 35 %.

- ★★★ **LES DEUX CADRES DE L'ANNÉE** (`_pilDeuxCadresHtml`, niveau ①). Un domaine a **deux années**
  et elles ne répondent pas à la même question :
  **l'EXERCICE COMPTABLE** (bilan à bilan) → *« ce que m'a coûté l'année fiscale »* ;
  **l'ANNÉE VIGNE** (après vendange N → fin vendange N+1) → *« ce que m'a coûté un cycle »*.
  Les deux totaux diffèrent, **et c'est normal** : une campagne à cheval sur la clôture est
  partagée entre deux bilans, une campagne entièrement hors de l'exercice n'y apparaît pas du tout.
  ⚠️⚠️ **UN EXERCICE COMPTABLE EST UNE DONNÉE, PAS UN RÉGLAGE.** Voir §34, lot 6.

- ★★ **Un seul moteur de graphe.** `_mvGraphCadre` / `_mvGraphSvg` (utils.js) existait déjà et
  9 des 11 générateurs SVG s'en servaient — le problème n'était pas qu'il manquait, c'est que
  la moitié du reste peignait à côté. ★ **`_PIL_SEM`** pose désormais **7 sens sémantiques**
  (fait · reste · faute · socle · hors · sel · aujourdhui).
  ⚠️ **À DÉPLACER dans `utils.js`** au prochain lot qui bumpe : une palette ne devrait pas vivre
  dans un module. Elle est dans `pilotage.js` pour avoir pu être livrée **sans bump**.
- ★ **Conformité** — cuivre (7 ans vs 28 kg/ha), passages phyto vs référence régionale réglable
  (défaut 12), délai de rentrée avec heure de libération.
- ⚠️ **Compatibilité `app.js`** : la visite guidée référence `.pil-tile[data-pid="traitement"]`,
  `.pil-cockpit-card`, `.pil-dec` — ne pas renommer. ★ **C22 le vérifie désormais mécaniquement.**
- ⚠️ La page est un `<div>` **vide** → hôte dédié `.pil-metahost`.
  ⚠️⚠️ **Ne jamais poser `.mod-header` sur `.pil-mast`** (§21c).
- ★ **Archives** porte deux boutons : « Comparer deux saisons » et « Éditer le bilan de campagne ».

### ★★★ Économie — l'écart de cadence, refait le 09/08 (il était faux d'un facteur 5)

**4 sous-vues** `_PEC_SUBS` : 📈 Synthèse (la carte de verdict `_pecVerdict` vit là) ·
🧭 Postes & travaux · 🍇 Parcelles · 📅 Exercice.

**Le coût de main-d'œuvre n'a JAMAIS dépendu des heures du journal** : c'est
`heures de BARÈME × taux pondéré par l'équipe réelle`. **Le journal dit QUI, jamais COMBIEN
D'HEURES.**

**L'écart de cadence, lui, en dépendait** : `hReel = Σ jh × 7 h` où `jh` ne comptait que les
journées-personne portant une **VALIDATION**. Or une validation couvre plusieurs jours de travail.
**Mesuré chez MG** : 12 journées sur 247 en hiver, 165 sur 559 au printemps.
Écran réel : **hiver −90 %** ; **printemps −52,8 %, fin projetée à 37,4 k€ alors que 79 358 €
étaient déjà engagés et la période 100 % faite** — une projection qui contredit l'engagé sur la même
carte. Et un verdict **VERT** invitant à réduire un barème juste à ~5 % près.

**Correctif 1** : `projFin = engage + resteE*(1+ecart)` — la cadence ne s'applique qu'au **RESTE À
ENGAGER**. À 0 % d'avancement, identique à l'ancien ; à 100 %, elle retombe **exactement** sur
l'engagé, donc elle ne peut plus contredire ce qui est dépensé.

**Correctif 2** : la présence vient du **PLANNING** — `_pecCadPresence()` appelle
`window._planWorkPersRange(mbr, Date, Date)`, **la même source qu'Économie › Exercice** (on ne
redéfinit pas « combien d'heures a-t-on travaillé »), **moins `T.tracH`** déjà agrégée ;
`hBarC = T.fH` = **tout** le travail fait (⚠️ **numérateur global ⇒ dénominateur global**, sinon on
recrée le décalage dans l'autre sens) ; l'ancien garde de couverture sur la **surface** disparaît,
remplacé par un seuil d'**avancement** `_PEC_CAD_AVC = 0.40`.

⚠️ **BIAIS ASSUMÉ ET ÉCRIT À L'ÉCRAN** : une entrée de planning porte des heures, un type cp/récup,
un motif d'absence — **jamais une activité**. Cave, atelier et bureau restent donc dans la présence,
qui est **surévaluée** ; l'indicateur penche vers « barème un peu serré ». **Biais inverse de
l'ancien, et bien plus petit.**

⚠️ **`_pecCadPresence` vérifie que la période a COMMENCÉ** avant de borner sa fin à aujourd'hui —
sans ce test la fenêtre part à l'envers et tout sort à zéro **en silence** (vécu pendant la mesure,
sur une période « Vendanges » débutant le lendemain).

★ **Backlog** : escalier de sources (période en cours ≥ seuil → même période l'an dernier via
`HISTORIQUE` + `_pilCmpSnapshot` → sinon rien) — **marche 2 vide aujourd'hui**.

### ★ Économie — le reste

- Pondéré par l'équipe réelle de chaque parcelle, **le tractoriste à son propre taux**.
- 3 graphes SVG + courbe d'engagement `_pecTimeline` (chaque euro à SA date).
- ⚠️ **Toute nouvelle hypothèse doit être ajoutée à `_ecoCfgSet`**, sinon rejetée en silence.
- ★★ **Le budget d'une tâche est un budget de BARÈME** : surface × h/ha × taux moyen `_ecoRate`.
  1. **`_ecoRate` est une moyenne NON PONDÉRÉE** — backlog : pondérer par les heures.
  2. Quand le budget ne colle pas au réel, **on corrige le BARÈME, jamais le taux**.
- ⚠️ Budget **projeté** neutralisé sous **15 %** d'avancement.
- ⚠️ **Le coût de retard modélisé est affiché SÉPARÉMENT.**
- **Seule convention inventée assumée** : règle **1/N** pour répartir la journée d'un ouvrier entre
  plusieurs parcelles. ⚠️⚠️ **Elle suppose qu'une parcelle se fait dans la journée.**
- ★ **Exercice comptable** (05/08) : fenêtre de **dates** ≠ campagne structurelle ;
  `_planPaidRange` × taux individuel = masse salariale ; ⚠️ **la conduite du tracteur est DÉJÀ dans
  le planning, seul le CARBURANT s'ajoute.**

### ★ Décider — les six bugs
fenêtre comptant les jours passés · trajets ignorés · enveloppe multi-tâches · surface J1 à 0 ·
fin divisée par le pool · **trois définitions de « une journée »**.
★ **`_pilEchelle(cd)`** — échelle horizontale **commune** aux trois graphes, prouvée par exécution.

### ★★ Simulateur « Renfort : combien, et quand »

**Modèle M3, gelé** : socle permanent **donné** ; décision = **profil de renfort par semaine** ;
le non-absorbé **glisse** (+15 %/sem, `CONFIG.eco.k_retard`) ; **rien n'est jamais abandonné** —
★ **sauf les travaux couperet**. ETP tracteur **mesuré**. Classement **parmi ce qui boucle**.
Recherche **gloutonne** `_rfBest` (~250 simulations).

★★ **Vendange-couperet** : drapeau **`t.couperet`** en priorité, repli sur le nom en **égalité
stricte**. Un travail couperet non servi est **PERDU** (heures + %, **jamais des euros de récolte**).
**Tableau des fenêtres** par **dichotomie sur la vraie simulation**. Plafond **`_RF_RMAX_DUR = 150`**.
**Calage mesuré** : 40 vendangeurs **au début** = récolte perdue et ~196 k€ pour rien ; **dans la
fenêtre** = ~48 k€ et ça boucle ; besoin réel **37**. 77 tests.
⚠️ Reste à purger : le calcul de **pic** mort dans `_rfCtx` — ⚠️ `ctx.pic` introuvable sous ce nom.

### ★ Ordre de passage — la carte
Marqueurs dorés numérotés, ligne pleine J1, pointillés ensuite, repli SVG hors ligne.
⚠️⚠️ **Le patch a d'abord échoué en silence** : les parcelles ne stockent pas leurs coordonnées.
★ **05/08 : `CONFIG.ordre_passage_t` (par TÂCHE) arrive enfin sur l'écran de l'équipe** —
**l'ancien `CONFIG.ordre_passage` n'était lu par AUCUN autre fichier : le message « partagé à
l'équipe » était faux depuis le premier jour.**

## 20c. La Réserve

- Intrants, achats, inventaires, **bilan matière** (RE délégué UE 2021/771 art.1).
- Onglet Fûts : accordéon par fournisseur, chips par millésime d'achat, références **scopées par
  fournisseur**, inventaire PDF, fusion des lots identiques **à la création**.
  ⚠️ Éditer un lot pour le rendre identique à un autre ne fusionne **pas**.
- ⚠️ Le test **deux appareils** reste **manuel**.
- ★★ **L'onglet Fûts porte le PARC** : bloc d'état en tête, registre des mouvements en pied,
  bouton « Se séparer de fûts » (§20e).
- ★ **`_rsvEnsureOverlays()` construit tous les overlays en JS.** Suivre ce patron.
- ★ **`window.saveIntrants` est exposé** : `cave.js` en a besoin pour rendre les fûts au parc.
- ★★ **`reserve.js` est le PATRON DE RÉFÉRENCE pour appeler les moteurs `_mvFut*`** :
  `window._mvFutParc(INTRANTS, window.CAVE_ELEVAGE, null)`.
  **Quand un moteur partagé est appelé depuis un nouveau module, aller lire comment l'appelle celui
  qui s'en sert déjà.**

---

## 20d. ★★ LE MILLÉSIME — la 3ᵉ section de la Cave

**Le diagnostic.** La Cave enregistrait très bien **ce qui s'est passé**. Elle ne disait rien de
**ce qui va arriver**, ni de **ce que ça vaut**.

**L'écran.** Troisième onglet de section, conteneur `#cave-view-mil` **à l'intérieur de
`#page-cave`**, deux sous-onglets : **⏭️ Ce qui vient** et **🧬 La ligne de vie**.

⚠️ **Le conteneur doit être DANS `#page-cave`.** Première tentative : l'ancre comptait deux
`</div>` et le bloc est tombé **hors** de la page. **Ne jamais compter les balises fermantes pour
se positionner.**

### « Ce qui vient » — l'agenda des quatre semaines

Tout se déduit de ce qui est **déjà saisi**. **Rien de plus à remplir.**

- **Échéances d'ouillage** : `last_ouillage + seuil`, puis récurrence.
  ★★ **Le seuil est celui du MILLÉSIME de la cuvée** (`_mlSeuil(c)`, §20h).
  ⚠️⚠️ **Il se calcule DANS la boucle, jamais avant** : hors boucle, l'agenda cadençait toute la
  cave au même rythme malgré des seuils différents.
  ⚠️ **La fenêtre vaut `nSem*7−1`** : sur 4 semaines, J+28 est **exclu**.
- **Cuves à mesurer**, **fin de fermentation estimée**, **fermentation qui ralentit**,
  **température haute**, **décuvage possible**.

★★ **DEUX pentes, volontairement distinctes** (`_mlProjFA`) :
- **penteMoy** (3 derniers relevés) → **PROJETTE** la date de fin ;
- **penteRec** (2 derniers relevés) → **DÉTECTE** l'arrêt.

Une moyenne sur 3 points **lisse le décrochage récent**.
★★ **Ce patron a été repris tel quel pour la MALO** (`_mlProjMalo`, §20h).

⚠️ **Une cuve de moins de 3 jours ou de moins de 3 relevés n'est PAS projetable.** On affiche
« démarrage », pas une date. **Même garde pour la malo.**

⚠️⚠️ **LE BUG DU `||` SUR ZÉRO.** `(ordre[a.kind] || 9)` : `'alerte'` vaut **0**, et `0 || 9` rend
**9** → **l'alerte tombait en dernier**. **Correctif : `(ordre[k] != null ? ordre[k] : 9)`.**

⚠️ **Le nom d'une cuvée n'est PAS unique.** Seul l'`id` l'est. `_mlNomCuvee()` ajoute le millésime.

★ **Chaque ligne renvoie vers l'écran qui existe déjà** (`_mlGo`). ⚠️ **`_mlGo` ne change PAS de
page** : il pose `caveSection` et appelle `renderCave()`. **Depuis le Pilotage il faut `goTo('cave')`
d'abord** — d'où le wrapper `_pcavGo`.
★ **09/08 : `_mlGo` ne connaissait pas le kind « soutirage »** — le bouton « Soutirer » du Pilotage
ouvrait le **Cuvier**. Corrigé avec le passage du soutirage à source unique
(`_caveLastSout`/`_caveSoutOps`) ; ★ le toggle « sous tirage » a été **retiré** : *un oui/non ne
décrit pas un geste répété*.

### « La ligne de vie » — le parcours du millésime

Un **flux vertical**, largeur proportionnelle au volume, pertes chiffrées entre les étages,
branche grise pour le raisin vendu. Puis les **rendements par parcelle** face au maximum de
l'appellation, et **l'origine de chaque cuvée**.

⚠️⚠️ **Une perte totale n'a de sens QUE si plus rien n'est en cuve.** **Trois libellés distincts** :
en cuve · en fût · en bouteille.
⚠️ **Les étages de tête à zéro sont retirés.** Un flux qui **grossit** dit l'inverse de la réalité.
★ **`p.rdt_max`** est le **seul ajout de saisie** du lot : posé une fois par parcelle, admin only.

### Fonctions & pièges

⚠️⚠️ **`_mlChaine` renvoie des TOTAUX, pas le détail des récoltes.**
★★ **`_mlChaine(mil)` a SIX dépendances.** **Un harnais qui les oublie fait lever la fonction, le
`catch` avale, et l'écran sort vide — on croit alors à un bug du code.**
⚠️ **CSS injecté par le module** (`_mlInjectCss`, préfixe `mlx-`).
⚠️ **Le filet de `renderCave`** : une valeur de `caveSection` hors des **trois** sections connues
replie sur l'Élevage.

---

## 20e. ★★ LE PARC À FÛTS — le fût comme objet suivi

### Le modèle, corrigé par Nico

⚠️⚠️ **LA RÉSERVE CONTIENT L'INVENTAIRE DES FÛTS LIBRES, PAS UN HISTORIQUE D'ACHATS.**

| | Source | Signification |
|---|---|---|
| `INTRANTS.futs` | La Réserve | fûts **vides et disponibles** |
| `cuvee.tonneaux` (élevage) | Le Chai | fûts **en vin** |
| `cuvee.tonneaux` (embouteillée) | — | **ignoré** : les fûts sont retournés au parc |

**PARC = les deux additionnés.** Ce ne sont pas deux comptabilités à réconcilier : ce sont **deux
états du même fût**.

★★ **Une première version faisait l'inverse** — elle soustrayait, et annonçait **−6 fûts libres**.
**46 assertions étaient vertes. Un modèle faux passe tous les tests qu'on écrit pour lui.**

### ⚠️⚠️⚠️ LA SIGNATURE — le bug du 07/08

```js
_mvFutParc(INTRANTS, CAVE_ELEVAGE, curY)   // ← ELLE PREND SES DONNÉES EN ARGUMENT
```

**Pourquoi** : la famille `_mvFut*` vit dans `utils.js`, importé **en premier**. Elle ne peut pas
compter sur les globales au chargement, donc elle les reçoit.

**Ce qui s'est passé** : le Pilotage appelait `window._mvFutParc()` **nu** → tout tombait à zéro,
sans erreur, sans trace. Nico l'a vu sur une capture : quatre tuiles à zéro.
**Pourquoi 162 assertions ne l'ont pas vu** : le harnais stubait `_mvFutParc = () => PARC`.

★★★ **LES DEUX RÈGLES QUI EN DÉCOULENT :**
1. **Vérifier la SIGNATURE D'ENTRÉE d'une fonction, pas seulement son contrat de retour.**
2. **Ne jamais stuber un moteur partagé : l'extraire du vrai fichier et le brancher**, et
   **vérifier que le test attrape le bug** en le réintroduisant volontairement.

### Le piège de type

⚠️ **`INTRANTS.futs[].annee` est une CHAÎNE** ; **`cuvee.tonneaux[].annee` est un NOMBRE**.
`'2023' !== 2023` : **tout rapprochement naïf renvoie zéro, en silence.**
★★ **Convention retenue dans toute la Cave : normaliser en CHAÎNE via une fonction dédiée
(`_caveMilKey`, `_pcavMilKey`, `_copMil`), et comparer chaîne à chaîne.**

### Les mouvements — `INTRANTS.fut_mouv`

| Sens | Motifs |
|---|---|
| **Entrées** | `achat` 🛒 · `embouteille` 🍾 · `retrait` 🔓 |
| **Sorties** | `entonnage` 🍷 · `vente` 💶 · `retour` ↩️ · `destruction` 🗑️ |

★ **`MV_FUT_SEP` = `['vente','retour','destruction']`** : les **trois seuls motifs** pour se séparer
d'un fût. **L'entonnage n'en est pas un.**

★★ **L'INVARIANT CENTRAL** : **entonner, embouteiller et retirer d'une cuvée ne changent PAS le
nombre de fûts du domaine.** Seuls **acheter** et **se séparer** font varier le parc.

### Les quatre gestes

**1. Entonner** — le décuvage pioche dans le parc, du plus vieux au plus neuf, et **SIGNALE quand il
puise dans le neuf**. ⚠️ **REPLI** : parc vide ou `utils.js` antérieur → **le stepper d'avant
revient**.
**2. Mettre en bouteille** — ⚠️ **le retour se fait AVANT de poser `statut='embouteille'`**.
**3. Retirer des fûts d'une cuvée** — le geste **existait déjà**, avec cinq motifs.
**4. Se séparer de fûts** — sortie définitive, **admin only**, sur les fûts **libres** uniquement.
⚠️ **Distinct de `_rsvDelFut`** : effacer une erreur de saisie n'est pas un mouvement de fûts.

### Ce qui n'a PAS été fait, et pourquoi

⚠️ **Le fût n'est pas nominatif — volontairement.** On reste à la maille du **lot**.
⚠️ **Le rattachement des anciens fûts est maquetté mais NON intégré.**
⚠️ **`CONFIG.cave.fut_prix` est facultatif.** Sans lui, **jamais d'euros inventés**.
★★ **Le parc reste INDÉPENDANT DU MILLÉSIME** — arbitrage explicite de Nico.
⚠️ **La légende de la pyramide mélangeait deux axes.** Un fût peut être **neuf ET libre**.
**Quand une légende énumère, vérifier qu'elle énumère UN seul axe.**
★ **Le VOLUME d'un fût, lui, est désormais réglable dès l'installation** (`CONFIG.cave.fut_l`,
§18b) — 225 L en Gironde, 228 L en Bourgogne.

---

## 20f. ★★ LES DOCUMENTS DE CAVE — registre & bilan

Deux documents imprimables, produits par `cave.js`, qui **n'écrivent rien** : ils lisent.
★★ **Depuis le 09/08 ils suivent la charte `MV_DOC` (utils.js)** : même page, mêmes polices, même
en-tête à filet d'or — et ils **s'impriment** au lieu de télécharger un `.html`.

### Le patron commun — à réutiliser pour tout nouveau document

```js
var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
  + '<title>…</title>'
  + '<link rel="stylesheet" href="/fonts/fonts.css">'      // Cormorant + Outfit, auto-hébergées
  + '<style>body{margin:0;background:#fff}' + XX_CSS + '</style></head>'
  + '<body><div class="xx-doc">' + body + '</div>'
  + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt>'
  + '</body></html>';
var blob = new Blob([html], {type:'text/html'});
var w = window.open(URL.createObjectURL(blob), '_blank');
if(!w) showToast('Autorise les pop-ups pour imprimer', '#B85A1A');
```

⚠️ **`'<scr'+'ipt>'` est obligatoire** : écrire `<script>` en clair dans une chaîne JS ferme le
script de la page hôte.
★ **Ce patron a resservi le 09/08** pour la liste imprimable des identifiants de l'équipe (§18b).

★ **Choix de la période** : si une seule existe → export direct, **sans question**.
**Ne jamais poser une question dont la réponse est unique.**

### Le registre des manipulations œnologiques

**Périmètre — les MANIPULATIONS, pas le suivi.** Ce qu'on **ajoute** au vin ou ce qu'on lui **fait
subir**. L'ouillage, les mesures de densité et les analyses n'en font pas partie. ★ **Mais ils sont
comptés en pied**, jamais passés sous silence.

★ **Un type absent de `RM_TYPES` n'entre PAS au registre** — c'est la liste blanche qui décide.

⚠️⚠️ **DEUXIÈME OCCURRENCE DU BUG `o.cuvees`** : `_rmLignes` testait `(o.cuvees || [])` au lieu de
`cuvees_ids` → **la colonne « contenant » sortait VIDE pour toutes les opérations du Chai**.
★★ **Quand on trouve un champ mal nommé, grepper le fichier entier avant de refermer.**

⚠️ **Limites écrites DANS le document** : « Ce n'est pas une déclaration officielle. Ma Vigne
prépare, l'exploitant déclare. » · doses de SO₂ en cL non converties · le Cuvier n'enregistre pas
d'intervenant · aucun plafond réglementaire affiché.

### Le bilan de campagne

**Recadré par Nico** : ce n'est **pas** une déclaration de récolte. C'est un **état interne de fin
d'année**, informatif.
★★ **C'est un AGRÉGATEUR, il n'invente aucun calcul.**

★★ **Trois choix qui font la justesse du document :**
1. **La surface travaillée additionne les passages.** C'est **l'effort**, pas l'étendue.
2. **Le rendement moyen ne porte que sur les parcelles récoltées.**
3. **`p.arrachee` sort de la surface exploitée.**

⚠️ **Il part du JOURNAL, pas de `TRAVAUX`** (lié à la période active, pas à la campagne).
⚠️ **Ce qu'il ne contient pas, et le dit** : ni heures, ni coûts.

### ⚠️ Ce que l'intégration a appris

1. **La section Import/Export vit dans `index.html`**, pas dans `reglages.js`.
2. **`_bcExportChoix` doit être une expression `window`**, pas une déclaration — C15.
3. **`_mlChaine` n'expose pas `recoltes`.**
4. ★ **Le fichier contient les échappements `\u00e9` EN CLAIR** → une ancre Python doit être une
   **raw string**.
5. **Les globales lues avec repli** : `window.JOURNAL || []`, `window.TRAITEMENTS || []`.

---

## 20g. ★★★ PILOTAGE › CAVE — le cockpit décisionnel

### Le diagnostic

Les six autres onglets ont chacun un **verbe**. **Cave était le seul sans verbe.**
⚠️ **Pire : c'était un FOSSILE.** Ses trois sous-onglets annonçaient comme « à venir » des choses
livrées depuis — dont une note de chantier *« Rien à construire — on réorganise »*, **visible du
client**.
★★ **Leçon : un écran qui annonce « à venir » doit être re-vérifié à chaque livraison de son
domaine.** Chapelle a vu cette note pendant des semaines.
★★★ **C'est le même défaut que l'aide contextuelle et le guide (§27), et que la liste « À finir chez
ce client » de l'assistant d'installation (§18b) : ce que l'app raconte d'elle-même n'est jamais
testé.**

### La refonte — trois sous-onglets, un verbe chacun

Clés `urg` / `mil` / `parc`, avec **table de migration `_PIL_CAV_MIGR`**.

**1. ⏱️ Ce qui presse** — un **verdict** en tête, puis les blocs.
★★ **L'ORDRE suit le calendrier, la PRÉSENCE ne change jamais.**
**Cacher un bloc, c'est le rendre introuvable le jour où il compte.**

**Hiérarchie du verdict** : alerte de fermentation → malo bloquée → cuverie en vendange →
**à soutirer (un GESTE)** → ouillage en retard → dose de SO₂ dans 7 jours → fûts en fin de vie →
« Rien ne presse aujourd'hui ». ★ **Un geste passe devant un rappel de date.**

**2. 🍇 Le millésime** — 4 tuiles, flux benne→bouteille, rendement, comparaison N-1, bandeau
multi-millésimes.
**3. 🛢️ Le parc & le coût** — état, pyramide, part des anges, mouvements.

### ⚠️ Le millésime affiché n'est pas celui de la campagne

Le 7 août, la campagne vient de s'ouvrir mais le vin en cave est celui de l'année précédente →
**l'écran serait blanc tout l'automne**. `_pcavCtx` garde la campagne courante **dès qu'elle a de la
matière** (`_pcavMatiere`), sinon recule d'un cran, **et l'écran le dit**.

### ⚠️ Le domaine vierge

`_pcavMatiere(ch)` : sans ce test, un domaine vierge voyait **quatre tuiles à zéro** au lieu d'une
phrase honnête.

### Le seul calcul neuf de tout le cockpit

**Le volume restant à rentrer** — on applique le rendement moyen déjà constaté aux surfaces non
récoltées. **C'est un ordre de grandeur, et l'écran le dit.**
★ Tout le reste **consomme**. **Consommer, c'est l'inverse de dupliquer.**

### ⚠️ Les champs que j'ai inventés et qui n'existaient pas

`pret_embouteillage` et `pret_decuvage` : **aucun des deux n'existe.**
**« Prêt à décuver » n'est pas un drapeau : c'est `_mlProjFA(cv).etat === 'sec'`.**
★ **« Prêt à embouteiller » N'EXISTE PAS** — le bloc affiche donc un fait vérifiable, la durée
depuis `date_entree`, plutôt qu'un « prêt » que l'app ne sait pas déterminer.

⚠️ **Préfixe : `pcv-` était DÉJÀ PRIS** → `pcav-`.
**Vérifier la collision d'un préfixe AVANT d'écrire une ligne de CSS.**

---

## 20h. ★★★ LA SÉRIE MILLÉSIME — un millésime est une entité à part

### Le modèle, dicté par Nico

> « chaque action correspond au millésime correspondant. Un ouillage des fûts du millésime 2025 est
> différent de celui du 2026 car on ne met pas les vins pour ouiller. »
> « il faut que l'interdiction soit pour toutes les opérations, chaque millésime est une entité à
> part (d'ailleurs ils sont dans des caves séparées). »

**Conséquences, toutes appliquées** : une opération porte sur **un seul millésime** · l'ouillage se
fait avec le vin **de ce millésime** · le **seuil d'alerte** peut différer par millésime · la **part
des anges** se lit millésime par millésime · le **registre** et le **bilan** aussi ·
⚠️ **SAUF l'inventaire des fûts**, qui reste **indépendant de l'année**.

★★ **Le « tout confondu » reste nécessaire, mais PAS au même endroit que la saisie.**

| | « Tous » ? | Où |
|---|---|---|
| **Sélecteur de SAISIE** (formulaire d'opération) | ❌ **jamais** | `#cop-mil-wrap` |
| **Filtre de CONSULTATION** (Chai) | ✅ et c'est le défaut | `_caveMillFilter` |
| **Pilotage** | ✅ par nature | bandeau « En cave en ce moment » |
| **Parc à fûts** | ✅ toujours | inventaire, hors millésime |

**Si « Tous » apparaissait dans le formulaire de saisie, il rouvrirait exactement la porte qu'on
ferme.**

### Ce que chaque lot a apporté

- **Saisie** : rang de millésimes au-dessus des chips de cuvées ; **changer de millésime VIDE la
  sélection** ; « Toutes » devient « Tout le 2026 · 12 fûts » ; ★★ **garde finale avant écriture**
  dans `saveCaveOp` ; ⚠️ **un seul millésime en cave → le rang est masqué**, l'écran est strictement
  identique à avant.
- **Chai** : `ouillage_par_mil` (3–30 j, admin only) ; ★★ **SOURCE UNIQUE `_caveSeuilOu`** — **onze
  sites** lisaient le seuil chacun de leur côté ; rétro-compatible par construction.
  ⚠️⚠️ **Le filtre de consultation EXISTAIT DÉJÀ** — j'en avais écrit un doublon avant de le
  découvrir. **Ce qui manquait vraiment : les CHIFFRES ne suivaient pas le filtre.**
  ⚠️⚠️ **`_caveAlerts()` renvoie `{cuv, daysSince}`, PAS des cuvées** → un filtre posé sur le
  mauvais objet faisait **disparaître toutes les alertes**. Trouvé par une assertion fausse.
- **Pilotage** : part des anges **une ligne par millésime** (★ fenêtre **12 mois glissants**, pas la
  campagne) ; ouillage groupé par millésime ; ⚠️⚠️ **`_mlOuillages` calculait le seuil HORS de la
  boucle** ; ⚠️ **la part des anges était enfermée derrière la disponibilité du parc à fûts**.
- **Documents** : registre et bilan **par millésime** ; une opération non rattachable **sort du
  filtre** plutôt que d'atterrir dans le mauvais document ; ★ **repli complet** sur la campagne.
  **Le bilan assume DEUX AXES, et l'écrit DANS le document.**

### ★★ Le lot MALO — projeter sur des mesures, pas sur une expérience

**Trois corrections de modèle successives** ont mené là, la dernière ayant entraîné la **suppression
complète** d'une première implémentation qui projetait sur la durée des FML passées du domaine :
> « je ne projette pas sur une expérience passée mais sur des valeurs mesurées »

⚠️ **L'acide malique n'était stocké NULLE PART** → ajout du champ `malique` (g/L). **Seul ajout de
saisie de la série**, assumé : la valeur figure sur le bulletin du labo.

**`window._mlProjMalo(c, now)`** — **mêmes deux pentes** que `_mlProjFA`.
Constantes : `_ML_MAL_FIN = 0.10` g/L, `_ML_MAL_PRES = 0.30`.

⚠️⚠️ **Le malique qui REMONTE n'est pas une malo bloquée** : il ne se recrée pas. C'est une erreur
de saisie. Annoncer un blocage enverrait **réchauffer une cuve alors que le problème est dans la
donnée**. Test placé **avant** celui du blocage.
★ **`cuvee.fml_terminee` reste une vérité du vigneron.**

### Bugs préexistants trouvés pendant la série

| Bug | Effet |
|---|---|
| `_mlVolParFut` sur `o.cuvees` | volume d'ouillage proposé calculé sur **tous** les millésimes |
| `_rmLignes` sur `o.cuvees` | colonne « contenant » **vide** dans tout le registre du Chai |
| formulaire d'analyse non pré-rempli | rouvrir une analyse **écrasait ses SO₂ et son AV** |
| `_mvFutParc()` sans arguments | **parc à zéro** dans le Pilotage |
| `_caveAlerts` filtré sur le mauvais objet | **toutes les alertes disparaissaient** sous filtre |
| `_mlOuillages` seuil hors boucle | agenda cadencé au même rythme pour tous |
| `&amp;` passé à `_pcavCard` | titre affiché `Soutirage &amp;amp; malo` |

---

## 21. Design & identité visuelle

- Palette « cave » : `--or`, `--or-pale`, `--terre`, `--cave`, `--cave-2`, `--horizon`, `--vert`,
  plus **9 teintes de tags**.
- Typographie : **Cormorant Garamond** (valeurs clés, titres), **Outfit** (le reste).
  ⚠️ **Cormorant a des chiffres elzéviriens** : dans un document imprimé, le « 1 » d'un numéro se
  lit « i ». Numéros en Outfit, titres en Cormorant (§18c).
- **Transitions** : `@keyframes pageInFwd`/`pageInBack` = **fondu d'opacité pur, aucun `translate`**.
  Pas de swipe (terrain) — **tap uniquement**.
- **Touch targets ≥ 44 px**, `env(safe-area-inset-*)` sur tous les en-têtes, modales, feuilles, toasts.
- **Mode ☀️ Plein soleil** : ✅ **câblé**.
- ★ **Aide contextuelle** : pastille **« ? Aide »** sur les 10 modules, `_mvInjectHelpBtn()`
  (**idempotent**). ⚠️ Contenu **texte pur** uniquement (C19). **Détail complet au §27b.**
- **Pages publiques** : `guide.html` et `demarrage.html` en HTML/CSS/JS **zéro dépendance**.
  ⚠️⚠️ **Ne pas régénérer ces pages par LLM.** ★★ **Le découpage du guide (§27d) respecte cette
  règle : il DÉPLACE des octets, il n'en réécrit aucun — la preuve étant que la sortie du
  générateur était identique octet par octet à l'original avant toute correction.**
  ★ **Même principe appliqué le 09/08 au déplacement d'un bloc dans `admin-gt.js`** : mêmes
  caractères, ordre différent, prouvé par comparaison de la liste triée des caractères.
- ⚠️ **`.note` sur les pages juridiques est réservée aux avertissements destinés au LECTEUR**.

## 21b. ★★ Cadrage — l'en-tête reste figé

**Cause racine** : `@keyframes` animaient un `transform:translateX()` avec
`animation-fill-mode:forwards` → le transform **restait posé en permanence**.
1. les `position:fixed` internes perdaient leur référence de viewport ;
2. le `translateX` initial créait un **débordement horizontal permanent** ;
3. **aucun `position:sticky` ne pouvait fonctionner**.

**Correctif** — keyframes en **fondu d'opacité pur** + bloc **« CADRAGE »** en fin de `styles.css`.
⚠️ **Scope délibéré** : les barres d'onglets de **second niveau** restent **non sticky**.
⚠️ **Piège d'audit** : le commentaire du bloc CADRAGE mentionne encore `translate` — lire le
**corps** des keyframes.

## 21c. ⚠️ Contraste — la cause racine

**UI-4** a rendu `.mod-header` clair pendant que le garde-fou continuait de cibler
`.mod-header .mvu-tab` comme un **contexte sombre** → **crème sur papier, 1,09:1, sur 8 modules**.

**Outil d'audit** : `mv-audit-contraste.js`, à coller dans la console **authentifiée**.
⚠️ **`.mod-header` est CLAIR**, le sombre vit sur `.mod-header-top`. Greffer `.mod-header` sur un
en-tête maison sombre le repeindra en clair → utiliser un **hôte dédié** (modèle `.pil-metahost`).

## 21d. Couleurs, breakpoints & thème saisonnier

- **~3 150 couleurs hex en dur**, dont **~2 300 dans les JS**.
  ★ **Exception assumée** : les couleurs passées à `showToast(msg, couleur)`. Palette de fait :
  **`#C0392B`** refus/accès, **`#B85A1A`** avertissement, **`#3D6B27`** succès.
- **Breakpoints RÉELS** : `560`, `600`, `640`, **`760` ET `768` avec une zone morte de 7 px**,
  `900`, `980`, `1200`. ⚠️ **+ `@media(max-width:880px)` injecté par `pilotage.js`**.
- ★ **Plan retenu pour la zone morte (en attente du go)** : passer l'unique `max-width:760px`
  (styles.css:2078) à **`767.98px`** — **1 ligne CSS, 0 JS**. ⚠️ Le `max-width:760px` de la Réserve
  (~3292) est un **conteneur**.
- ⚠️ **Sous 768 px, le `body` est plafonné à 430 px**.
- **~480 classes CSS orphelines** en analyse statique — ⚠️ **non actionnable tel quel**.

### ★ Thème saisonnier — étude (décision en attente)

`#app-root` porte déjà `data-theme` → un second attribut **`data-saison`** suit le même patron.
**4-5 variables repeignent tout.** Décisions : **mois civil**, jamais le nom de période · les 3
couleurs de toast **ne bougent jamais**.

---

## 22. Terrain, mobile & iOS

- Android est l'appareil quotidien de Nico, mais l'app doit être **complète sur iPhone/iPad et
  desktop**.
- **Tap uniquement**, jamais de swipe : on l'utilise avec des gants, entre deux rangs.
- `env(safe-area-inset-top)` sur **tous** les en-têtes.
- **`font-size` ≥ 16 px sur tous les champs** — en dessous, Safari zoome automatiquement.
  ★ **Règle appliquée aussi aux écrans GT** : les champs de l'assistant d'installation et de la
  création de comptes sont en 16 px (§18b).

### ✅ Les boîtes natives : ZÉRO

⚠️ **`prompt()` / `confirm()` / `alert()` natifs sont BLOQUANTS en PWA iOS** — `prompt()` ne rend
**rien**, et une `alert()` non affichée transforme un refus explicite en **échec silencieux**.

⚠️ **Toute occurrence restante de `alert(`/`confirm(`/`prompt(` est un COMMENTAIRE.** Un grep brut
les compte : **filtrer les lignes en `//` ou `*` avant de conclure.** ★ Le preflight, lui, blanchit
les commentaires — **se fier au preflight, pas au grep**.

**Traduction retenue :** refus → `showToast(msg,'#C0392B')` · champ manquant →
`showToast(msg,'#B85A1A')` **+ focus sur le champ** · succès → `showToast(msg,'#3D6B27')` ·
suppression → `openConfirmDel(...)` (6 paramètres) · saisie → **`openPrompt({...})`** (§22c).

---

## 22b. ★★ RESTITUTION — ce que l'app rend à celui qui la remplit (série UX-R)

**Le diagnostic.** Ma Vigne demandait à un ouvrier de saisir plusieurs fois par jour pendant que dix
modules servaient à **exploiter** ces saisies. **Aucun ne lui était destiné.**

**Le principe.** La gratification ne se fabrique pas, elle se **restitue**.

| Lot | Apport |
|---|---|
| **R1** | La fiche **« c'est fait »** remplace le toast de 2 s après validation |
| **R2** | **« Ma part du chantier »** — widget d'accueil |
| **R3** | **« Ma trace »** (`ovMaTrace`) — la page personnelle de la campagne |
| **R4** | **Le mur du domaine** (`ovMur`) + le **mot du chef de culture** |
| **R5** | **Chantier terminé en plein écran** + **comparaison à l'an dernier** |

### Architecture — une seule définition de chaque chose

- **`_mvPartCalc(tache, nom)`** est la **source unique**. ★ Pondérée par l'effectif des équipes.
- **`_mvdsOpen(o)`** est le **composant unique** de retour après validation, appelé par **4 chemins**.
- **`_mvdsSnap(tache)`** doit être appelé **en tête** d'un chemin de validation.

### ⚠️ Invariants de calcul

1. **`mine + them === done`, toujours.**
2. **Règle 1/N**, la même que le coût par parcelle du Pilotage.
3. **Une parcelle validée sans entrée de journal** reste dans « l'équipe ».
4. **Le mur dédoublonne par `parcelle|tache`.**
5. **La comparaison N-1 se fait par RANG dans la campagne**, jamais par date brute.

### ⚠️ Garde-fous produit — non négociables

- **Zéro badge, zéro point, zéro série.** Le vocabulaire est celui du métier.
- **La surface, pas les heures.** Les heures appartiennent à la paie.
- **Aucun classement entre personnes.** Le mur est **alphabétique**.
- **La rareté fait la valeur** : l'écran plein n'apparaît que cinq à six fois par campagne.
- **Le chemin rapide reste rapide.**
- ★★ **Corollaire pour toute la suite** : **aucune amélioration de la mesure ne doit se payer par
  une saisie nouvelle sur le terrain.**
  ★ **Quatre exceptions assumées, toutes hors du terrain** : `p.rdt_max` (un réglage posé une fois
  par parcelle), **`analyse.malique`** (une valeur recopiée du bulletin de labo), — par
  construction — **rien du tout dans le widget « Mise en route »**, qui ne fait que **lire** (§27c),
  et ★★ **toute la série installation, qui se saisit dans la console GT, jamais chez le client**
  (§18b).
  **Le lot « stock de bouteilles » a été abandonné parce qu'il demandait, lui, une vraie saisie.**

### Réglages & données

- `CONFIG.mur_mot` — écriture **admin only**, contrôlée **dans la fonction elle-même**.
- `CONFIG.mur_visible` = `'equipe'` (défaut) ou `'admin'`.
- **Aucune nouvelle collection, aucun nouveau champ.**
- **`HOME_NEW_TOP`** : liste explicite de widgets insérés en **`unshift`**.

---

## 22c. ★★ `openPrompt` — la primitive de saisie

**Jumelle d'`openConfirmDel`.** Elle existe surtout pour qu'un développement futur n'ait **plus
aucune raison** de réintroduire un `prompt()`.

- **Overlay `#ovPrompt`** dans **`index.html`** (racine). Six ids en dur, préfixe **`mvp-`**.
- **`openPrompt(o)` + `_execPrompt()`** dans `app.js`. Options : `{titre, sub, valeur, unite, icone,
  btnLabel, type:'texte'|'nombre', placeholder, cb}`.
- **Contrat identique à `prompt()`** : `cb` n'est appelé **que** si l'on valide.
- ⚠️ **`el.value` est assigné EN JS**, jamais par un attribut HTML.
- **Garde** : overlay absent → `showToast('Saisie indisponible')` au lieu d'un crash.
- ⚠️ `sub` est posé via **`textContent`** → **ne pas** y passer `_escHtml(...)`.
- ★★ **Deux `openPrompt` peuvent s'enchaîner** — patron de la saisie des écartements (§30) et du
  bilan de campagne. ⚠️ **Toujours prévoir le repli si `openPrompt` manque.**

---

## 23. Sécurité & performance

- **PERF-1** : `_pullKeys` lit les 26 collections **en parallèle**. **PERF-2** : Leaflet **lazy + SRI**.
  **PERF-3** : skeletons (`window._mvSk(kind)`, 8 types → zéro layout shift).
  ★ **PERF-4** : `Cache-Control: immutable` sur `/assets/**`.
- **A11Y-1 / A11Y-2** livrés ; batch complémentaire au backlog. ⚠️ Le manifest par tenant déclare
  `purpose:'any maskable'` sur des icônes qui ne le sont pas.
- ✅ **SEC-3 : la CSP est en enforce.**
- **Cause racine des bugs silencieux : les `catch{}` vides — ~234 mesurés**, dont **~164 dans
  `app.js`**. **C14 empêche désormais d'en ajouter.**
  ★ Comptes de référence sur les fichiers touchés en août : `cave.js` **4** · `utils.js` **10** ·
  `pilotage.js` **16** · `reserve.js` **1** · ★ `admin-gt.js` **7** · `leads.js` **1**.
  **Ces nombres n'ont pas bougé** — chaque repli neuf trace via `_pcavLog` ou `logError`.
- Autres dettes : ~1 186 globals `window` · **6 fichiers JS > 2 000 lignes** · ~51 `setTimeout`
  ≥ 200 ms · 32 sommes de surface à la main.
- **Points sains confirmés** : versions cohérentes, tous les fichiers passent `node --check`, zéro
  demi-surrogate, zéro `<div>` dans `<button>`, zéro id dupliqué, rules exemplaires, **aucun appel
  dynamique** → une purge guidée par grep est **sûre**.

---

## 24. Pièges de build / CSS / HTML / modules ES — checklist

### ★★★ CE QU'AUCUN CONTRÔLE AUTOMATIQUE NE VOIT (ajouté le 15/08, §42h)

**Le preflight, les harnais et la CI ne lisent pas une mise en page.** Trois défauts du chantier
ergonomie n'ont été trouvés qu'en **regardant une capture** :

- ⚠️⚠️ **Dans un conteneur `display:flex`, CHAQUE élément enfant devient un item séparé.** Un `<b>`
  au milieu d'une phrase forme sa propre colonne et coupe le texte en morceaux. **Toute ligne
  susceptible de contenir du HTML doit envelopper son texte dans un `<span>`** (`flex:1;min-width:0`).
  ★ Le piège est **impossible** quand le contenu est échappé (`_pilEsc`) : aucune balise ne survit.
- ⚠️ **Une règle de base à `width:100%` sabote une frise horizontale.** Passer une grille en
  `display:flex` ne suffit pas : il faut **neutraliser la largeur héritée**, sinon le premier
  élément prend tout.
- ⚠️ **Ne JAMAIS extraire du CSS injecté par expression régulière.** Elle casse sur les apostrophes
  échappées et rend une feuille mutilée — on croit alors à un défaut de style.
  ★ **On exécute la fonction** avec un faux `document` et on récupère ce qu'elle pose.

★ **Corollaire de méthode** : après tout lot qui touche la mise en page, **produire un rendu et le
regarder**. Une assertion verte n'a jamais montré un texte coupé en trois.

**Build (JS / Rollup / IIFE)**
1. Toute fonction appelée par un `onclick` injecté doit être exposée sur **`window.*`**.
   ★ Vécu six fois : `selCopMil`, `_caveSeuilMilStep`, `_caveSeuilMilReset`, `_dmrGo`,
   ★ les six fonctions de périodes et ★ les deux de machines (§18b).
   **Symptôme : le bouton ne fait rien, en silence.**
   ⚠️⚠️ **Et le preflight ne regarde QUE `onclick`** : `onblur`, `onchange`, `oninput` ont le même
   sort. **Contrôle maison obligatoire** (§6c).
2. **Apostrophes françaises** dans une string single-quoted → `\'`, `&#39;`, ou **`\u2019`**.
   ★★ **Corollaire** : dans les chaînes destinées au client, **n'utiliser QUE l'apostrophe
   typographique `'`** — elle ne peut pas fermer une chaîne, et elle est correcte typographiquement.
   ★ Et **écrire les ACCENTS** : le style du fichier peut être « commentaires sans accents », les
   textes affichés **jamais**.
3. `font-family` **sans quotes** pour les noms simples.
4. Persister via **`fbSave`**, pas `fbDoc`.
5. **iOS `input[type="time"]` / tout champ posé après `innerHTML`** : `.value` assigné **en JS**.
   ★ Vaut aussi pour un `<textarea>` dont on colle le contenu, et pour un `<select>` dont on veut
   présélectionner une option (§18b).
6. Pas de doublon `let`/`var` ; **TDZ** : `window.X = X` **juste après** `let X`.
7. **Émojis** : `\u{1F529}` avec **un seul** backslash ; `\u{FE0F}` derrière les pictogrammes à
   forme texte. Un **demi-surrogate isolé** **tronque le fichier**.
8. **`const DEBUG` déclaré dans CHAQUE module.** ✅ 11/11.
9. **C15** : une fonction dont les seuls appelants sont ailleurs s'écrit `window.X = function(){…}`.
   ★ **Et ne jamais livrer un moteur sans son appelant.**
   ⚠️ **Effet de bord** : un harnais qui extrait par `indexOf('function X(')` cesse de la trouver.
10. ★ **`requestAnimationFrame`** : le premier `ts` peut valoir **0**.
11. ★ **Une propriété qui traverse plusieurs fonctions doit être vérifiée de bout en bout.**
12. ★ **Une fonction qui reconstruit un objet de zéro perd tout ce qu'elle ne réécrit pas.**
    **Préférer `Object.assign({}, source)` puis n'imposer que ce qui doit l'être.**
    ★ Quatrième occurrence le 09/08 : la config écrite par l'assistant d'installation est un
    `Object.assign` du socle **puis** de ce qui a été repris — aucune des quatre clés d'origine ne
    peut être perdue (§18b).
13. ★★ **`(table[k] || defaut)` est INTERDIT dès que `table` peut valoir 0.** `0 || 9` rend `9`.
14. ★ **Un SVG à `viewBox` fixe doit être borné en largeur.** ★★ **Depuis août, préférer CSS pur.**
15. ★★★ **VÉRIFIER LA SIGNATURE D'ENTRÉE, pas seulement le contrat de retour.**
    **Aller lire comment l'appelle le module qui s'en sert déjà.**
16. ★ **Une entité HTML pré-échappée passée à une fonction qui échappe donne un double
    échappement.** **Passer le texte brut, laisser la fonction échapper.**
17. ★★★ **`document.querySelector()` NE LÈVE PAS : il renvoie `null`.** Un `try/catch` autour ne
    protège de rien, et le repli ne se déclenche jamais. **Tout chemin de navigation doit tester le
    résultat et TRACER quand il ne trouve pas** (`else if(window.logError)`). C'est le bug `ecf`, et
    c'est la raison d'être de C22.
18. ★★ **Deux gardes qui décident la même chose finissent par diverger.** Une branche atteinte
    seulement « parce qu'une garde plus haut l'a filtrée » doit **se protéger elle-même**.
    ★★ **Corollaire inverse, vécu le 09/08** : quand plusieurs fonctions lisent les mêmes listes,
    **une seule normalisation en tête** vaut mieux qu'un `|| []` semé à chaque lecture — on en
    oublie toujours un (`_agtInsNorm`, §18b).
19. ★★ **Un index partagé entre deux listes est un piège.** Vécu : une boucle sur les parcelles
    remettait à vide le champ de la **période** de même rang, que la boucle précédente venait de
    remplir. **Trouvé par le harnais DOM, invisible à la lecture.**

**CSS / HTML**
1. **`display:flex|block` sur `#page-xxx` interdit.**
2. Un **`.modal` doit avoir un parent `.overlay`**.
3. **Balance des `<div>`** ; pour `<p>`, regex **`<p[ >]`**.
   ⚠️ **Comparer TOUJOURS base → patché** : `cave.js` et `sw.js` ont des déséquilibres préexistants.
   **Un écart identique des deux côtés est une non-régression, pas un bug.**
4. ⚠️ **CRITIQUE HTML5 — `<div>` dans `<button>` INVALIDE** : le parser ferme le `button` avant le
   `div` → **rien ne se passe**. Toujours **`<span>`**.
5. ⚠️ Préfixe **`mvs-` PARTAGÉ** → vérifier **token par token**.
6. `#app-content-wrap{flex:1;min-width:0}` requis ≥ 768 px.
7. CSS externalisé → **FOUC** possible en dev, normal.
8. ⚠️⚠️ **`transform` + `animation-fill-mode:forwards`** = piège majeur (§21b).
9. ★ **Nouveau préfixe = vérifier la collision AVANT d'écrire.** Préfixes réservés : **`.mvds-`**,
   **`.hmp-`**, **`.mtr-`**, **`.mur-`**, **`.mvp-`**, **`.rf-`**, **`.mvt-`**, **`.tcv-`**,
   **`.tcfg-`**, **`.acc`**, **`.mlx-`**, **`.mvv-d*`**, **`.mvr-*`**, **`.rm-`**, **`.bc-`**,
   **`.pcv-`** (⚠️ **déjà pris**), **`.pcav-`**, **`.mvc-milrow*`**, **`#cop-mil-*`**,
   **`.dmr-`**, ★ **`.agi-`** (assistant d'installation GT).
10. ★ **Espaces insécables** : les pages juridiques mélangent les formes. **Toujours extraire l'ancre
    du fichier** (`repr()`).
11. ★ **Le dock est en `flex:1`** : ajouter une case ne demande aucune modification CSS.
12. ★ **Un sélecteur de spotlight doit être vérifié dans le DOM réel.** ★★ **C22 le fait maintenant
    au build.**
13. ★★ **Une légende qui énumère doit énumérer UN SEUL AXE.**
14. ★★ **Vérifier un id par TOKEN, jamais par sous-chaîne.** `cop-chip-all` **contient**
    `cop-chip-a` → **borner sur le guillemet fermant**.
15. ★ **Un attribut `data-*` contenant un CHIFFRE** (`data-pd1`) doit être prévu par les sélecteurs
    ET par les stubs de test — vécu le 09/08, un stub trop restrictif faisait rougir du code juste.

---

## 25. Workflow de patch sûr

### ⚠️⚠️ DEUX PIÈGES DE SCRIPT VÉCUS LE 15/08 (§42i)

1. **DEUX « ok » POUR ZÉRO OCTET ÉCRIT.** Un script a affiché « ok » sur ses deux premiers motifs,
   puis l'assert du troisième a levé — et **l'écriture, placée en fin de script, n'a jamais eu
   lieu**. Les « ok » n'annonçaient que la réussite du `str.replace` **en mémoire**.
   ★ **Correctif : écrire après CHAQUE motif, et RELIRE le disque pour confirmer.**
   ```python
   def rep(old, new, quoi):
       s = io.open(P, encoding='utf-8').read()
       assert s.count(old) == 1, 'ANCRE %s : %d' % (quoi, s.count(old))
       io.open(P, 'w', encoding='utf-8').write(s.replace(old, new))
       assert new[:50] in io.open(P, encoding='utf-8').read()   # ← relecture
       print('  ok', quoi)
   ```
2. **UNE CONTRE-ÉPREUVE A LAISSÉ LES FICHIERS ABÎMÉS SUR LE DISQUE.** L'assert « défaut non
   injecté » tombait **après** avoir posé la version abîmée. Repéré en relisant `git status`, **pas
   parce que quelque chose avait rougi.** ★ **On repose la référence AVANT de s'arrêter**, jamais
   dans un bloc final qui peut ne pas s'exécuter.

★ **Et un rappel qui a resservi trois fois** : le fichier mélange des séquences d'échappement
**littérales** (`\u2019`, `\u203A`) et des caractères accentués **réels**. Une ancre en chaîne
Python normale interprète les premières. **`r"""…"""` par défaut**, et extraire l'ancre du fichier
(`repr()`) au moindre doute — une ancre a échoué sur la seule casse de `\u203a` contre `\u203A`.

> **Incident fondateur (`tracSessionId`)** : patcher une copie périmée de `/mnt/project` a réintroduit
> un bug corrigé. **Toujours repartir du DERNIER fichier livré** — désormais, du dépôt GitHub.

> ★★★ **AJOUT DU 12/08 (soir) — TROIS RÈGLES DE TEST, PAYÉES CHER (§34e, §34g).**
>
> **1. LANCER LE PREFLIGHT. Toujours.** `node scripts/preflight.mjs` **avant** chaque livraison.
> Un lot a été livré sans, et la CI a rendu 3 `catch` muets et un `<div>` dans un `<button>`.
> ⚠️ **Un cliquet maison qui ne compte pas la même chose que le filet ne protège de rien** —
> celui-ci comptait `catch{` quand le code écrit `catch(e){}`.
>
> **2. NE PAS DUPLIQUER LE PREFLIGHT DANS UN HARNAIS.** Tentative faite, résultat : un faux positif,
> parce qu'une expression régulière lisait du JS **sans voir les bornes de chaîne**.
> **Le preflight vérifie la mécanique ; les harnais vérifient le SENS.** Un contrôle, une source.
>
> **3. LES COMMENTAIRES NE SONT PAS UNE PREUVE.** ★★★ **Trois fois** dans la même séance, une
> assertion est passée au **vert** parce que le commentaire documentant la correction citait le
> texte corrigé. **Un harnais qui lit ce qu'on raconte au sujet du code ne teste pas le code.**
> Correctif à la racine : la fonction d'extraction retire les commentaires
> (`.replace(/^\s*\/\/.*$/gm,'')`) **pour toutes les assertions**.
>
> ★★ **Quand une assertion rouge tombe : lequel des deux a tort, l'assertion ou le code ?**
> Bilan de la séance : **6 assertions fausses pour 0 bug**, toutes corrigées, aucune contournée.
> ★★★ **Et son symétrique, plus dangereux : une assertion VERTE peut être une panne de lecture.**
> Un découpage d'arguments qui comptait les virgules **dans une chaîne** sautait un site en silence
> et passait au vert **en ne mesurant que 5 sites sur 6**. D'où l'assertion de garde :
> **compter les sites lus**, pas seulement vérifier qu'un motif existe.

1. ★★★ **DEPUIS LE 10 AOÛT : LIRE DEPUIS LE DÉPÔT CLONÉ**, pas depuis une mémoire de session
   précédente. `git clone` (session neuve) ou `git pull` (Nico vient de pousser) AVANT tout
   inventaire. ★ **Faire l'inventaire AVANT de proposer un patch** : sur un changement transverse,
   un `grep -rn` d'exploration **sur le vrai dépôt** donne la liste exacte — c'est plus simple
   qu'avant, puisqu'il n'y a plus de risque de fichier manquant à l'upload.
   ★★ **Une liste de fichiers à PATCHER peut quand même être FAUSSE** si l'inventaire n'a pas été
   fait. Vécu trois fois **avant le passage à Git** : j'ai demandé `reglages.js` pour un bouton qui
   vit en dur dans `index.html` ; j'ai oublié `sw.js` alors que le lot touchait `app.js` ; et ★ j'ai
   failli demander `claims.js` pour un correctif qui tenait en une ligne de `firebase.js`, la Cloud
   Function acceptant **déjà** ce dont j'avais besoin.
   **Vérifier où vit réellement l'écran, ce que le serveur sait déjà faire, et quelles séquences le
   lot bumpe, AVANT de proposer un patch.**
   ⚠️ **Vérifier le nom du fichier avant de patcher** : `firebase.js` ≠ `firebase.json`.
   ★ **Pour ce qui n'est pas dans le dépôt** (ce document tant qu'il n'y est pas commité, archives
   légales, captures) : comparer le md5 de l'upload à celui du dernier fichier livré, dans les
   deux sens.
   ⚠️⚠️ **Ce qui NE change PAS malgré le dépôt** : Claude ne peut toujours pas écrire dans
   `mavigne-dev\` ni pousser. La livraison reste des **fichiers complets** via `present_files`,
   que Nico réintègre à la main puis commit + push via GitHub Desktop. **Le dépôt résout la
   LECTURE, pas l'ÉCRITURE.**
2. **Figer** une copie de travail dans un dossier dédié (`base-<fichier>` pour chaque cible).
   ★ Sur une série de lots enchaînés, numéroter les bases (`base2-`, `base3-`…) : c'est ce qui
   permet un diff **par lot** en plus du diff cumulé.
3. **Patcher en Python** : `str.replace` avec **`assert old in src`** + **`count == 1`**.
   ⚠️⚠️ ★★★ **LE DRY-RUN DOIT ÊTRE SÉQUENTIEL.** Compter tous les motifs sur la source d'origine
   **ne prouve rien** : un remplacement peut **créer** ou **détruire** l'ancre d'un motif suivant.
   Vécu le 09/08 — un garde recopié mot pour mot dans une nouvelle fonction faisait passer une ancre
   de 1 à 2 occurrences, dry-run vert, assert rouge à l'écriture. **Appliquer les motifs l'un après
   l'autre sur une copie, et compter à chaque étape.**
   ⚠️ **Un `assert` qui tombe laisse le fichier INTACT mais la suite du script continue.**
   ★★ **Corollaire** : un `node --check` lancé après un assert tombé valide le fichier **NON
   patché** et affiche « ok ». **Un « syntaxe ok » qui suit un assert rouge ne prouve rien.**
   ★ **Sur un remplacement répété**, écrire un **tableau motif → nombre attendu**.
   ⚠️⚠️ ★ **`.decode('unicode_escape')` interprète AUSSI `\'`** → apostrophe nue qui **ferme la
   chaîne JS**. **Correctif : `\u2019`.**
4. **Valider ESM** : `node --check --input-type=module` en STDIN. `node --check` direct pour le CJS.
   ★ Pour un JSON : `json.loads()` **avant** d'écrire. ★ Pour un script Python généré :
   `ast.parse()`.
5. **Vérifier** balance accolades/parenthèses/`<div>` + **scan des demi-surrogates ISOLÉS**.
   ★ **Contrôle d'intégrité UTF-8 sur les gros documents** : des octets `\xc3` ont déjà été perdus
   en cours d'écriture heredoc (**trois fois**). ★ **Faire ce contrôle APRÈS CHAQUE CHUNK.**
6. **Compter les `catch{}`** base → patché : aucun ajout.
   ★ **Utiliser la regex EXACTE du preflight** : `catch\s*\([^)]*\)\s*\{\s*\}`.
7. **Chercher les références orphelines par token**, jamais par sous-chaîne.
   ★ **Et lister tous les handlers inline** (`onclick|onchange|onblur|oninput|onsubmit`) pour
   vérifier qu'ils sont exposés sur `window` — le preflight ne voit que le premier (§6c).
8. **Exécuter** ce qui doit l'être : harnais moteur, harnais DOM, harnais intégré **et harnais
   backend** (§6b), et `WHATS_NEW` **évalué en Node**.
   ★★ **Et faire la CONTRE-ÉPREUVE** : réintroduire chaque défaut corrigé, vérifier que ça rougit.
   ★ **Le lanceur doit lire le CODE RETOUR** : un harnais qui plante n'est pas un harnais muet.
9. ★ **Diff ciblé contre la base** : compter les lignes modifiées **qui ne contiennent pas le motif**.
   Résultat attendu **0**. ★ **Compter aussi les lignes SUPPRIMÉES.**
   ★★ **Un diff de quelques lignes toutes dans le périmètre vaut mieux qu'un long récit** — c'est le
   contrôle le plus rapide qu'un lot est borné.
   ★ **Pour un DÉPLACEMENT de bloc**, le bon contrôle est différent : même longueur, **et même liste
   triée de caractères**. C'est la preuve qu'aucun octet n'a été réécrit.
10. **Smoke test** puis `npm run test:e2e`.
11. **Gros fichiers** : `create_file` **tronque** → **heredocs `cat >>`** + contrôle après chaque
    chunk. ⚠️ **`create_file` refuse d'écraser un fichier existant.**
12. **Preflight avant deploy — LE VRAI, pas un compteur maison.**
    ★★ **Reconstituer l'arborescence** (`src/`, `scripts/`, `public/`, `guide/`, `functions/`,
    `index.html` à la racine — désormais directement depuis `/home/claude/mavigne-dev/` après
    `git clone`, sans reconstitution manuelle) et lancer `node scripts/preflight.mjs`. C'est le
    seul juge de C11→C22.
    ⚠️ **Si l'arborescence est reconstituée à la main plutôt que clonée** : retirer le
    `package.json` de la racine reconstituée, celui de `/mnt/project` étant celui de `functions/`
    et produisant un faux avertissement.
    ★ **Niveau de référence : 0 erreur, 11 avertissements.**
13. **Livraison** : fichiers **complets** dans `/mnt/user-data/outputs/` via `present_files`.
    ⚠️ **Rappeler le placement** à chaque fois — désormais dans `mavigne-dev\`, pas dans l'ancien
    `mavigne\`.
    ★ Quand un lot en remplace un autre livré plus tôt, **le dire explicitement**.
    ★★ **Ne PAS re-présenter les fichiers inchangés** d'un lot à l'autre (demande de Nico, 09/08) —
    mais **les laisser dans les sorties**.
    ⚠️ **Ne jamais faire `rm -f /mnt/user-data/outputs/*` avant d'avoir recopié ce qu'on garde.**
14. ⚠️ **Pièges d'ancre** : (a) jamais `\u2014` / `\U0001F529` en chaîne *raw* — **SAUF quand le
    fichier contient les échappements EN CLAIR** ; (b) ancres commençant par le caractère collé
    après `">` ; (c) tronquer à la fin de la dernière interpolation utilisateur ; (d) `count == 1`
    sur l'ancre **non échappée** ; (e) ne pas tronquer avant `</div>` quand la string continue ;
    (f) compter les backslashes via `src.count()` ; (g) dans un label Python en apostrophes simples,
    `\\'` casse la chaîne ; (h) ★ **ne jamais supposer un espace insécable** ;
    (i) ★★ **ne jamais supposer qu'un texte est écrit en échappements OU en caractères** ;
    (j) ★★ **ne jamais compter les balises fermantes pour se positionner** ;
    (k) ★★★ **NE JAMAIS RETAPER UNE ANCRE — L'EXTRAIRE PAR `repr()`.**
    **`python3 -c "s=open(f).read(); i=s.index('motif'); print(repr(s[i-2:i+70]))"`** avant d'écrire.
    ★ **Vécu deux fois le 09/08** : une ancre retapée contenant des apostrophes échappées en cascade
    n'a jamais correspondu ; une ancre extraite **trop courte** (deux caractères) n'était pas unique.
    **Extraire une LIGNE ENTIÈRE, bornée par ses retours à la ligne.**
15. **⚠️ Purge de code mort — la méthode complète** :
    - **a.** Vérifier qu'il n'y a **aucun appel dynamique**. Confirmé : **zéro**.
    - **b.** Utiliser le **critère corrigé** (§6c) — ⚠️⚠️ **il ne vaut PAS pour `window.X =
      function`** → lancer le preflight.
    - **c.** **Itérer jusqu'au point fixe.** **d.** Supprimer aussi la ligne d'export.
    - **e.** **Distinguer deux familles de `getElementById` morts.**
    - **f.** ⚠️ **Ne jamais purger le CSS sur la seule foi d'une analyse statique.**
    - **g.** ⚠️ **Vérifier token par token.**
    - **h.** ★ **Une garde peut tuer une fonctionnalité vivante** (`hv2-meteo-card`).
    - **i.** ★★ **Une fonction écrite mais jamais appelée est une erreur de preflight.**
    - **j.** ★★★ **Supprimer un bloc peut emporter une fonction encore appelée.** **C15 ne voit pas
      ce cas** — il détecte les fonctions sans appelant, pas les appels sans définition.
      **Seul le harnais DOM l'attrape.**
16. **Chercher les copies privées d'une logique centralisée.** Deux chemins qui doivent produire le
    même résultat doivent appeler **la même fonction**. Vécus : `planMultiApply` vs « Outils » · la
    liste de tâches de Réglages · le doublon `_saisonForDate` de `tracteur.js` · **`_chargeSaisonData`
    et sa copie du filtre legacy (941 heures fantômes)** · **`pilotage.js` et sa copie du calcul des
    niveaux** · `_arcCampagneDe` · ★★ **les ONZE lecteurs de `ouillage_alerte_j`** ·
    ★★ **les titres de section dupliqués entre le sommaire et le corps du guide** (§27d) ·
    ★ **la lecture des champs du formulaire de mise en route, factorisée en `etatCourant()`** pour
    que la sauvegarde locale et l'envoi lisent la même chose (§27f).
    ★★ **Corollaire : un agrégateur n'est PAS une copie. Consommer, c'est l'inverse de dupliquer.**
    ★★ **Second corollaire, vécu le 09/08** : recopier un ALGORITHME générique (une distance
    d'édition) n'est pas une copie privée d'une règle métier. Le critère est le risque de
    **divergence de sens** : deux définitions de « une journée » divergent, deux implémentations de
    Levenshtein non.
17. **Vérifier ce qu'on cherche avant de conclure à l'absence.**
18. ★ **Un grep brut compte les commentaires.**
19. ★ **Ne jamais croire un changelog.**
20. ★ **Quand une assertion de test tombe, se demander d'abord LAQUELLE DES DEUX a tort.**
    ★★ **Mais toujours regarder POURQUOI elle tombe.**
21. ★ **Un constat d'ABSENCE exige de varier le motif de recherche.**
    ★★ **Et avant de proposer d'AJOUTER une fonctionnalité, chercher si elle existe.**
22. ★ **Avant d'exécuter une entrée de backlog, re-vérifier le constat qui la fonde.**
23. ★★★ **Relire ses propres textes destinés au CLIENT comme du code** : accents, apostrophes
    typographiques, et cohérence avec ce que l'écran fait vraiment.
24. ★★ **Écrire le mode d'emploi de ce qu'on vient de livrer.** C'est un test : l'ordre des blocs
    d'un écran et une liste périmée ont été trouvés en rédigeant, pas en codant (§18c).

---

### ★★ Ce qu'un harnais dit, et ce qu'il ne dit pas (11/08)

★★★ **Écrire les moteurs SANS lecture du DOM est ce qui rend le harnais possible.** Les trois
fonctions d'écriture du Planning (§19a) reçoivent tout en paramètre ; elles s'extraient du fichier
livré et s'exécutent dans Node en quelques lignes. **Une fonction qui lit `document.getElementById`
au milieu de sa règle métier n'est pas testable, et ce n'est pas un détail d'architecture : c'est ce
qui décide si la règle sera vérifiée ou seulement relue.**

⚠️⚠️ **Douze rouges identiques accusent le harnais, pas le sujet.** Le harnais des moteurs a d'abord
donné 12 échecs tous formulés « Cannot read properties of undefined » : un
`new Function('ctx','return ' + wrap)` où `wrap` commençait par un saut de ligne — **ASI**, donc
`return;` puis le corps mort. **Avant de suspecter le code testé, lire le message : douze pannes
identiques sur douze scénarios différents ne décrivent pas douze bugs.**

★ **Extraire par `s.index('function X(')` jusqu'au prochain `\n}\n` embarque la ligne suivante si
c'est un `window.X = X`** — le harnais plantait sur `_planSelKeys is not defined`. L'extraction
doit être nettoyée, ou bornée sur la fonction seule.

★★ **Réexécuter le harnais sur le fichier FINAL, après le lot suivant.** Les moteurs n'avaient pas
bougé sous les onglets du lot 2 — mais c'est une chose qui se vérifie, pas qui se suppose.

### ★★★ La checklist de clôture d'un lot (11/08)

Un lot n'est livrable que quand **les six** sont vraies. Les écrire dans la réponse, pas les penser.

1. **Preflight vert** — `node scripts/preflight.mjs`, 0 erreur. Après une **baisse** de compteur
   (C14, C19…), **regraver** : `--baseline`. Après une **hausse**, corriger, jamais regraver.
2. **Cliquets** — `lint-cliquet.mjs` et `lint-vocabulaire.mjs`. Vérifier qu'ils sont **branchés**.
   ★ **Constaté le 11/08 en les exécutant** : plafond ESLint **déjà à 0, avec 0 erreur** — le
   `for(var i…)` dupliqué d'`app.js` a été corrigé. Le point « passer le plafond à 0 » est clos.
3. **Syntaxe** — `node --check` (CJS) / `--input-type=module --check` (ESM) · accolades CSS
   équilibrées · balance des balises HTML · scan demi-surrogates.
4. **Versions** — bump APP (`APP_VERSION` + **les 4 affichages réels** d'`index.html`) **ET** SW
   (en-tête + `CACHE_NAME` + les 2 `console.log` + une ligne de changelog **prépendée**) dès qu'on
   touche `index.html` / `app.js` / `utils.js` / `styles.css`. Un module JS seul = **aucun bump**.
5. **`WHATS_NEW`** — prépendé, jamais remplacé, rédigé **du point de vue de l'utilisateur** (le
   symptôme vécu, pas la cause technique), **vérifié en l'exécutant en Node**.
6. ⚠️⚠️⚠️ **L'AIDE** — **Règle d'or n°4**. Fiche `MV_AIDE` du module touché relue **contre l'écran
   neuf**, section du guide, `_mvtSteps`, et tout écran qui énumère ce qui reste à faire. Écrire
   « fiche relue, rien à changer » si c'est le cas — pour que ce soit un constat, pas un oubli.

**Et ce qu'on ne peut PAS cocher côté Claude** — le dire explicitement à la livraison :
`npm run build`, `npm run test:smoke`, `npm run test:e2e` (pas de navigateur), et **le déploiement**.

---

## 26. Tarifs, facturation & conversion

| Formule | Mensuel | Annuel (2 mois offerts) | Contenu | Utilisateurs |
|---|---|---|---|---|
| **Essentiel** | 29 € | 290 € | Vigne · Journal · Météo · Réglages · export | ≤ 3 |
| **Vigneron** | 49 € | 490 € | + Tracteur · Registre phyto · catalogue AMM/DAR | ≤ 10 |
| **Domaine** | 79 € | 790 € | + Cave Élevage · Planning RH · Pilotage · La Réserve | illimité |

Options : `OPT-KML`, `OPT-FOR`, `OPT-MIG` (dès 200 €), `OPT-CUSTOM`. Codes abonnement figés
`ABO-{ESS|VIG|DOM}-{M|A}`. Support **par e-mail uniquement**.

### ✅ Installation — la grille est TRANCHÉE

| Formule | Forfait installation HT | Accompagnement inclus |
|---|---|---|
| Essentiel | **490 €** | **10 h** |
| Vigneron | **690 €** | **15 h** |
| Domaine | **990 €** | **20 h** |

- **Au-delà du volant inclus : 60 €/h.**
- Nouveaux codes : **`INST-ESS` / `INST-VIG` / `INST-DOM`**.
- ★ **Le raisonnement** (calage : installation Chapelle = **20 h**) : ce n'est pas la formule qui
  fait le coût, c'est la complexité du client. La grille tient parce qu'elle **BORNE le temps
  inclus**, pas parce qu'elle prédit le coût.
- ★★ **Le widget « Mise en route » (§27c) travaille pour ce forfait** : il transforme une partie de
  l'accompagnement en écran, et il **rend visible ce qui reste à faire** au lieu d'attendre un appel.
- ★★★ **Et la série installation (§18b) le rend soutenable** : un forfait de 20 h incluses n'a de
  sens que si l'installation en coûte 9. **C'est ce qui rend le passage à trente clients pensable.**
  ⚠️ Le chiffre reste **théorique** tant qu'une installation à blanc ne l'a pas mesuré.

**Offre de lancement** : −50 % sur l'installation **+** plan Domaine au tarif Vigneron.
⚠️ **Durée jamais bornée — à trancher**, au plus tard avec le devis Garraud.

**Argument ROI en public** : exprimé en **temps, pas en euros**.
⚠️⚠️⚠️ **TROIS CHIFFRES CONTRADICTOIRES CIRCULAIENT** — démo **111 h**, brochure **215 h/an pour
10 ha**, argumentaire oral **3 à 5 h de bureau par mois** (36 à 60 h/an). **Un prospect qui reçoit
la plaquette et clique la démo voit du simple au double** : ça n'attaque pas le produit, ça attaque
la crédibilité du vendeur.
★ **Depuis le 15/08 (§43), la source unique est `DEMO2_CREDITS`** : **≈ 127 h démontrées**, plus
**37 h hors total** (« retrouver l'info »), soit **164 h** pour qui compte la ligne molle.
★★★ **Et la démo ne dit AUCUN montant** : ni abonnement, ni installation, ni conversion en euros.
Le tarif se dit de vive voix, une fois le besoin établi.
⚠️ **`mvprint.py` (215 h) et l'argumentaire oral ne sont PAS encore alignés** — voir backlog.

**Essai** : **15 jours**, claim `trial_until` + `plan` ; bandeau J-X ; à l'expiration **lecture
seule, données conservées**.

- **Aucun paiement self-service** : **MAILTO** + `_fbSetTenantPlan` (fenêtre privée `ngdevpro`).
- ⚠️ **Toute facture doit porter le SIRET courant** (…00022) et la mention 293 B.
- ⚠️ Les prix de `logiciel-vigne.html` sont écrits `29&nbsp;€`, d'où des greps qui les ratent.

### ★ Mentions de bas de facture

Une facture ne porte **pas** de clause « Bon pour accord ».
- pénalités de retard = **3 × le taux d'intérêt légal**
- indemnité forfaitaire **40 €** (art. L.441-10 et D.441-5 c. com.)
- **pas d'escompte** · renvoi aux CGU · mention **EI** + SIRET

⚠️ **Vérifier que l'exonération 293 B est bien paramétrée** : 100 € de TVA sont apparus dans un
aperçu de modèle.

## 26b. RGPD & documents contractuels

- **Double qualité** : GUERETTECH est **responsable de traitement** pour le site, **sous-traitant
  art. 28** pour les données saisies dans l'app.
- **Signature en app** : `acceptTerms` → `_mv_signatures` (lecture `gtAdmin` uniquement), avec le
  **hash SHA-256** de la page signée.
- **Catégories traitées** : identification, vie professionnelle, connexion/sécurité. **Aucune donnée
  art. 9.**
- ★ **La série UX-R rend visibles des données d'activité individuelle** → `mur_visible`, ni heures ni
  rémunération, aucun classement. **À mentionner au registre art. 30.**
- Versions **DPA 1.0 / CGU 1.1 laissées fixes**.
- ⚠️ **Vécu** : l'e-mail de confirmation peut ne jamais partir alors que l'enregistrement existe.
- ⚠️ **`dpa.html` contient encore deux gabarits** : **arbitrage ouvert**.
- ★★★ **LE DPA SE SIGNE AVANT LA CRÉATION DES COMPTES DES SALARIÉS.** Ce sont leurs données
  personnelles. L'installation du domaine, elle, peut se faire avant. L'écran de création en lot le
  rappelle **en bandeau, sans bloquer** — Nico est seul juge de l'état de la signature, qui peut
  avoir eu lieu sur papier (§18b).

### ★★ Archivage des documents signés — procédure établie

`sha256Url()` va chercher la page **en ligne** au moment de la signature.
**Conséquence** : **l'empreinte des signatures déjà enregistrées ne correspond plus** si la page bouge.

**À chaque modification de `cgu.html` ou `dpa.html`, même éditoriale :**
1. **Archiver la version sortante** sous `..\mavigne-sauvegardes\juridique\`, nommée
   `cgu-vX.Y-signee-AAAA-MM-JJ.html` — **sans y ajouter une ligne**.
2. **Consigner les SHA-256** avant/après dans `EMPREINTES-documents-signes.md`.
3. **Comparer l'empreinte « avant »** aux champs `cgv.hash` / `dpa.hash` de `_mv_signatures`.
4. **Ne jamais déposer ces archives dans `public/`.**
5. **Ne pas incrémenter la version** pour une correction d'identité de l'éditeur.

**Archive constituée le 31/07/2026** : CGU v1.1 et DPA v1.0 tels que signés par SCEA PH Chapelle &
Fils le 18/07/2026.

## 26c. ★★ Changement d'identité légale — la carte des 10 fichiers

| Fichier | Emplacement | Occurrences | Nature |
|---|---|---|---|
| `index.html` | **racine** | 4 | « À propos », CGU + DPA **embarqués en app**, pied du formulaire |
| `app.js` | `src\` | 1 | pied des **rapports PDF phyto** |
| `cgu.html` | `public\` | 3 | tableau Prestataire, `idcard`, DPA embarqué |
| `dpa.html` · `mentions-legales.html` · `confidentialite.html` | `public\` | 2 chacun | tableaux + `idcard` |
| `demarrage.html` · ★ `guide/12-reglages.html` ou le layout | `public\` / `guide\` | 1 chacun | pied de page |
| `claims.js` | `functions\` | 1 | signature du **mail de confirmation** |
| `README.md` | racine | 1 | en-tête du dépôt |

⚠️ **Deux formats coexistent** : `982 148 116 00022` (espacé) et `98214811600022` (compact).
⚠️ **Trois endroits contre-intuitifs** : le **pied des PDF phyto**, les **CGU/DPA embarqués dans
`index.html`**, la **signature du mail de `claims.js`**.
★★ **La mention du guide vit dans une source de `guide/`**, pas dans `public/guide.html` — **et il
faut REGÉNÉRER** après l'avoir changée (§27d).
⚠️ ★ **Les documents de cave et la liste d'identifiants n'y sont PAS** : ils portent le nom du
**domaine client**, pas celui de l'éditeur.

**Versionnage du lot** : `index.html` + `app.js` touchés → **bump SW**, `APP_VERSION` **inchangé**,
`WHATS_NEW = []`.

★ **Le téléphone suit la même logique de carte.** **Toujours faire l'inventaire par `grep -rn`
AVANT d'annoncer la liste des fichiers.**

---

## 27. Communication & LinkedIn

- Posts **#1 à #3 publiés**. Cadence **mardi, tous les 14 jours, 11h30 ou 20h**.
- Hashtags : `#viticulture #vigneron #bourgogne #agritech #cotedor`.
- Démo publique : **`mavigneapp.fr/?demo=visite`**.
- ⚠️ **Pas de prix ni d'offre dans les posts.** Données salariés réelles **jamais** publiques.
- ⚠️ **Prévenir l'employeur avant toute sortie publique.**
- ★ **Bannière LinkedIn** : ⚠️ **le coin bas-gauche est couvert par la vignette de profil**.
  L'URL affichée pointe **`mavigneapp.fr/logiciel-vigne`** — d'où le **redirect 301**.
- **SEO** : `sitemap.xml` (6 URLs — ⚠️ `mise-en-route.html` n'y entre **jamais**), `robots.txt`,
  JSON-LD, `noindex, follow` sur l'app.
- ⚠️⚠️ **Une recherche sur `"mavigneapp.fr"` ne fait remonter aucune page.** **À vérifier dans
  Search Console** — et pourtant le premier lead entrant est arrivé par le site.
- ⚠️ « Ma Vigne » est un nom **saturé**.
- ⚠️ **Le téléphone est désormais public** (obligation LCEN) : prévoir un filtrage des appels.

★ **Angles disponibles et non exploités** :
1. la **série UX-R** — le seul sujet qui parle aux **ouvriers**.
2. le **lot UX-1** — « quinze messages que mon app n'affichait pas sur iPhone ».
3. **les heures fantômes** — « j'ai trouvé 941 heures de travail qui n'existaient pas dans mon
   propre logiciel, puis 528 de plus le lendemain ».
4. **le registre électronique 2027** — « votre registre phyto devra être un fichier lisible par
   machine au 1er janvier 2027 ».
5. ★★ **le parc à fûts** — « je savais combien de barriques j'avais achetées. Je ne savais pas
   combien étaient vides ». 600 à 900 € la pièce, 20 à 25 % du parc renouvelé chaque année.
6. ★★ **« deux pentes valent mieux qu'une »** — comment une moyenne sur trois relevés masquait une
   fermentation arrêtée.
7. ★★★ **« mon logiciel mélangeait deux millésimes »** — *on ne met pas le vin d'une année dans les
   fûts d'une autre, et pourtant mon application le permettait*.
8. ★★ **« quatre tuiles à zéro »** — comment 162 tests verts n'ont pas vu qu'une fonction était
   appelée sans ses arguments.
9. ★★★ **« mon écran de coûts était faux d'un facteur 5 »** — la mesure, les trois scripts, la
   correction. **Publier ses erreurs de calcul inspire plus confiance qu'une liste de
   fonctionnalités.**
10. ★★★ **« l'aide de mon application décrivait une version d'il y a six mois »** — le sujet le plus
    universel de tous : *tout le monde a une documentation qui ment*.
11. ★★★ **« mon logiciel créait des comptes sur le mauvais domaine »** — un identifiant lu au mauvais
    endroit, un compte qui part chez le voisin, une fiche qui part chez le bon client, et personne
    ne s'en aperçoit avant que quelqu'un essaie de se connecter. **Se termine bien** : un backfill a
    prouvé que le défaut ne s'était jamais déclenché.
12. ★★ **« vingt heures pour installer un client, dont quatorze au clavier »** — la mesure d'abord,
    le code ensuite. Le sujet parle à tous les indépendants qui vendent de l'installation.

---

## 27a. ★★★ LA RÈGLE DE L'ACCOMPAGNEMENT — À LIRE AVANT DE CLORE TOUT LOT

> ⚠️⚠️⚠️ **CETTE SECTION EST LA PLUS IMPORTANTE DU DOCUMENT POUR LA SUITE DU PROJET.**

> ★★★ **AJOUT DU 12/08 — CE QUI SUIT LE CODE TOUT SEUL, ET CE QUI NE LE SUIT PAS.**
> La refonte du Pilotage (§34) a renommé et réordonné les huit onglets. Mesure faite :
> · ✅ **`_mvAideOngletsPil` a suivi SEUL** — il lit `window._PIL_TABS` **à l'exécution**.
>   ★★ **C'est le bon patron : une aide qui LIT le code ne peut pas mentir.** À généraliser.
> · ✅ **C22 n'exige rien de plus** : `MV_AIDE` est indexée par **PAGE** (`#page-pilotage`), pas par
>   onglet. Ajouter un onglet n'oblige donc pas à toucher `utils.js`.
> · ❌ **Les lignes écrites EN DUR ont menti** : `MV_AIDE.pilotage` décrivait encore « Décider ».
> · ❌ **Le guide public a menti** : `11-pilotage.html` annonçait les sept anciens onglets en
>   sous-titre. Il n'y a **pas de contrôle mécanique** dessus — §24 et C22 ne jugent aucun texte.
>
> ⚠️ **CONCLUSION** : à chaque renommage d'écran, faire un `grep` du **libellé retiré** dans
> `src/utils.js` (MV_AIDE) **et** dans `guide/`. C'est le seul filet, et il est manuel.

> ★★★ **Depuis le 11/08, cette règle est la RÈGLE D'OR N°4** (en tête de document). Cette
> section en garde le détail et l'histoire ; la règle courte, elle, se lit avant tout lot.

**Trois supports décrivent l'application au client :**

| Support | Où | Qui le voit |
|---|---|---|
| **L'aide contextuelle** (`MV_AIDE`) | pastille « ? Aide » sur chaque module | tous les utilisateurs |
| **Le guide public** (`guide/` → `public/guide.html`) | `mavigneapp.fr/guide.html` | clients **et** prospects |
| **La visite guidée** (`_mvtSteps`) | `?demo=visite` et démo à code | **les prospects**, sur le lien publié |

**Ils avaient décroché de plusieurs mois.** Constaté le 09/08 :
- l'aide du **Pilotage** annonçait « **Six onglets** » en nommant deux onglets qui n'existent plus ;
- l'aide du **Journal** et des **Réglages** renvoyait l'export au mauvais endroit ;
- l'aide de la **Cave** et de **La Réserve** ignorait le parc à fûts, la séparation des millésimes,
  la projection de malo et les deux documents imprimables ;
- le **guide** décrivait un Pilotage à six onglets sans « Décider », une Cave à deux sections, une
  Réserve sans parc, un barème « pratiqué en Côte de Nuits » ;
- la **visite guidée publique** visait un onglet supprimé et posait son projecteur au hasard.

**Pourquoi personne ne l'avait vu :** aucun test ne couvrait ces textes, personne ne les relit — et
le seul qui les lit vraiment, c'est le client.

### ⚠️⚠️⚠️ LA RÈGLE

**Un lot qui change un écran n'est pas fini tant que les trois supports ne disent pas la vérité.
La mise à jour se fait DANS LE MÊME LOT, jamais « plus tard ».**

Concrètement, avant de clore un lot, se poser trois questions :

1. **Est-ce que la fiche `MV_AIDE` du module touché décrit encore la réalité ?** (§27b)
2. **Est-ce que la section du guide correspondante est encore juste ?** Si non → **éditer le fichier
   de `guide/`, régénérer, déployer** (§27d).
3. **Est-ce que la visite guidée pointe encore quelque part ?** Le preflight C22 répond à celle-là
   tout seul, mais **il ne juge que les sélecteurs, pas le texte** de la narration.

★★★ **QUATRIÈME QUESTION, AJOUTÉE LE 09/08 AU SOIR : et l'écran lui-même, que raconte-t-il ?**
Un écran peut mentir sur son propre travail. Vécus :
- l'onglet Cave du Pilotage annonçait « à venir » des choses livrées depuis (§20g) ;
- ★ la liste **« À finir chez ce client »** de l'assistant d'installation réclamait le SIRET, les
  écartements et les fûts **que l'assistant venait d'apprendre à poser** (§18b).
**Un écran qui énumère ce qui reste à faire doit être relu à chaque fois qu'on lui apprend à faire
quelque chose.**

### Ce que le preflight fait — et ce qu'il ne fera jamais

**C22 attrape le mécanique** : un sélecteur mort, une clé d'onglet retirée, une fonction de
navigation disparue, une fiche sans page, une ancre absente du guide. **Il refuse le build.**

**C22 ne lit aucun texte.** Une fiche peut être **verte au preflight et complètement périmée**.

**Donc : le contrôle automatique protège de la panne, jamais du mensonge. Le mensonge, c'est une
décision humaine, au moment du lot.**

★ **Deux mécaniques réduisent la surface de risque** :
- **l'aide LIT la structure au lieu de la DÉCRIRE** — la liste des onglets vient du code (§27b) ;
- **le guide est découpé** — une modification de la Cave touche un fichier de 4 ko, pas 104 (§27d).
★ **Et depuis le 09/08 au soir, une troisième** : la liste « à finir » de l'assistant **se calcule**
au lieu d'être écrite (§18b).

**Mais aucune des trois ne rédige à ta place.**

---

### ★★★ LE TEST DU MODE D'EMPLOI (11/08)

**Un écran qui explique par où passer pour faire quelque chose qu'il ne fait pas là où on le lit
est un écran raté.** Le Planning en comptait **huit** (§19a), dont celui-ci, dans l'onglet Congés
d'une fiche salarié :

> *« Pour poser des congés : grille Équipe → **Sélection multiple** → toucher les jours → ☀️ CP. »*

La phrase était **exacte**. C'est précisément ce qui la rendait dangereuse : une note fausse finit
par sauter aux yeux, une note juste s'installe. Elle a survécu à plusieurs lots.

★★ **La question à se poser en relisant un écran : "est-ce que je décris un chemin ?"** Si oui, deux
issues seulement — **amener l'action ici**, ou **assumer que l'écran ne la fait pas** et ne rien
écrire. Le renvoi vers un autre module reste légitime (le solde initial se règle vraiment dans
Réglages › Équipe) ; le renvoi **à l'intérieur du même module** est un aveu.

⚠️ **Corollaire pour tout lot de refonte : les renvois périmés se traquent PAR GREP.** Chercher les
noms d'écrans supprimés dans `src/*.js`, `index.html`, `MV_AIDE` et `guide/` — huit occurrences
trouvées ainsi, dans quatre fichiers dont deux hors du module refondu (`reglages.js`, `utils.js`).
**Aucun palier de test ne les aurait vues.**

## 27b. ★★ L'aide contextuelle — `MV_AIDE`, et `MV_INFO`

> ★★★ **DEUX QUESTIONS, DEUX FEUILLES (15/08, §42c).**
> **`MV_AIDE`** (pastille « ? Aide », en tête de module) répond à *« qu'est-ce que je peux FAIRE sur
> cet écran ? »* — une fiche par PAGE.
> **`MV_INFO`** (pastille « i », **à côté du chiffre**) répond à *« d'où vient CE chiffre ? »* — une
> fiche par chiffre. **34 fiches** aujourd'hui, toutes dans le Pilotage.
> ⚠️ **Ne jamais poser une fiche `MV_INFO` en tête d'écran** : une notice générale ne répond à
> aucune question précise. Elle vit **contre le nombre qu'elle explique**.
> ⚠️⚠️ **`stopPropagation` sur l'écouteur délégué** : la pastille vit dans un en-tête de tuile qui
> replie la tuile au clic. Sans lui, ouvrir la fiche ferme l'écran qu'on cherche à comprendre.
> ★ **Clés nommées par module puis par écran** : `pil.gnr`, `pil.eco.remarques`. Deux écrans ne
> partagent **jamais** une clé — une fiche vivante remplie par l'un s'afficherait sous l'autre.
> ★ **Les fiches VIVANTES** (`_mvInfoSet`) : le contenu se calcule à l'exécution, mais **la clé
> reste déclarée** dans `MV_INFO` avec un repli honnête. `_mvInfoSet` refuse toute clé non déclarée
> — sans quoi le contrôle statique du harnais serait contournable.
> ★ **Le texte des fiches est ÉCRIT, jamais saisi** : il porte donc son propre `<b>`, contrairement
> à `MV_AIDE` (voir ci-dessous). Aucune donnée utilisateur ne le traverse (C19).
> ⚠️ **Et il s'écrit en FRANÇAIS ACCENTUÉ.** Une première version de six fiches est partie sans
> accents — réflexe de commentaire appliqué à du texte client. Le harnais ne le voit pas ; la
> relecture, si.


**Dix fiches, une par PAGE.** `_mvAideFiche()` lit l'id de `.page.active` → une fiche sans
`#page-<clé>` correspondante est **écrite mais inatteignable** (C22 le vérifie).

**Format d'un point : `[amorce, suite]`, deux chaînes de TEXTE PUR.**
⚠️ Le gras est posé par le **rendu**, jamais par le contenu — une première version portait du `<b>`
dans les chaînes et **C19 l'a refusée, à raison**.

### ★★★ Le point dynamique — l'aide qui lit la structure

**Un point peut aussi être une FONCTION** sans argument qui renvoie `[amorce, suite]`.
Elle est évaluée **à l'OUVERTURE de l'aide**, pas au chargement.

**Pourquoi ça marche** : `utils.js` est importé **en premier**, il ne peut rien lire des autres
modules au démarrage. Mais l'aide s'ouvre **sur un clic**, quand tout est chargé.

**Pourquoi ça compte** : la liste des onglets vient **du code**, plus d'une phrase recopiée qui
vieillit. C'est la réponse structurelle au « Six onglets » du Pilotage.

**Les assembleurs** (`utils.js`) :
- `_mvAideEnum(arr)` → « a, b et c » ; `_mvAideNb(n)` → « Sept ».
- `_mvAideOngletsDom(sel)` → lit les onglets **À L'ÉCRAN**. Légitime parce que **l'aide d'un module
  s'ouvre depuis ce module**. Utilisé par la Cave, La Réserve et Réglages.
- `_mvAideOngletsPil()` → lit **`window._PIL_TABS` / `_PIL_TOOLS`**, exposés par `pilotage.js`.
  ⚠️ **Pas le DOM ici** : la barre du Pilotage **épingle en plus l'outil ouvert**.

⚠️ **Une fonction qui échoue ou ne renvoie rien : le point est simplement OMIS.** Jamais de blanc,
jamais de phrase à moitié écrite — **c'est testé** (73 assertions).

### Ce que chaque fiche doit dire

Le principe : **ce que l'écran fait, ce qui s'y décide, et ce qui piège**. Pas un inventaire de
boutons.

---

## 27c. ★★ Le widget « Mise en route »

**Le problème.** Un domaine qui vient d'être installé n'a **aucun repère** : dix modules, et rien
qui dise par où commencer.

**Où** : `app.js` (rendu, `_dmr*`) + `index.html` (le conteneur `#home-demarrage`).
Widget `demarrage`, **en tête de `HOME_WIDGETS` et de `HOME_NEW_TOP`**, masquable par l'œil.
**CSS injecté** (préfixe `dmr-`) → `styles.css` intact.

⚠️ **ADMIN SEULEMENT.**

### ⚠️ Aucune saisie nouvelle

**Les 7 étapes se cochent en LISANT la base** : nom du domaine · parcelles · contours KML · périodes
de travail · barème des tâches · équipe · première validation.
**Une case à cocher à la main serait une donnée de plus à tenir à jour, donc une donnée fausse.**

⚠️ **Une étape ne propose un geste QUE si l'écran existe côté client.**
**L'application n'a PAS d'import KML** → les étapes « parcelles » et « contours » **CONSTATENT**.

### La disparition — ce qui évite un widget mort

- **Toutes les étapes faites et aucun conseil utile → le bloc s'efface**, pour de bon.
- **Toutes les étapes faites mais un réglage manque → il se réduit à UNE ligne** : le **SIRET** ou
  les **écartements**. ★★ **C'est cette ligne qui absorbe MT-A.**
  ★ **Et depuis le 09/08 au soir, ces deux réglages peuvent déjà être posés à l'installation**
  (§18b) — le conseil ne s'affichera donc que chez les domaines installés avant, ou dont le client
  n'avait pas répondu au formulaire.

⚠️ **La branche « conseil » doit être AUTONOME** (`var k = cons[0]; if(!k){ cacher(); return; }`).

---

## 27d. ★★★ LE GUIDE PUBLIC — SOURCES DÉCOUPÉES & GÉNÉRATEUR

> ⚠️⚠️⚠️ **À REJOUER À CHAQUE MISE À JOUR QUI LE NÉCESSITE. C'est le point n°1 du §27a.**

### Le problème qu'on a résolu

`public/guide.html` faisait **104 ko dans un seul fichier**, 15 sections. Personne ne le relisait.

### La structure

```
mavigne/
├── guide/                        ← LES SOURCES (c'est ici qu'on écrit)
│   ├── _layout.html · _inter.txt
│   └── 01-demarrer.html … 15-glossaire.html
├── scripts/build-guide.mjs       ← LE GÉNÉRATEUR
└── public/guide.html             ← LE RÉSULTAT (ne plus l'éditer à la main)
```

### ★★★ LES TROIS GESTES

```
REM 1. éditer le bon fichier de guide\  (ex. guide\08-cave.html)
REM 2. régénérer
node scripts\build-guide.mjs
REM 3. déployer
firebase deploy --only hosting
```

**AUCUN BUMP.** `guide.html` est une page de `public/` **hors précache**, et `scripts/` n'est jamais
déployé.

### ⚠️⚠️⚠️ LE PIÈGE DU 14/08 — LIVRER LE FICHIER GÉNÉRÉ À CÔTÉ DE SA SOURCE

**Deux allers-retours de CI perdus, sur un lot dont le code était juste.**

J'ai livré **les deux** : la source `guide/11-pilotage.html` **et** le résultat
`public/guide.html`. `/mnt/user-data/outputs` étant **plat**, je ne peux pas y créer de
sous-dossier `guide/` — j'ai donc renommé la source en **`guide-11-pilotage.html`**. Ce nom
n'existe nulle part dans le dépôt.

**Ce qui s'est passé, dans l'ordre :**

| tour | `guide/11-pilotage.html` | `public/guide.html` | `--check` |
|---|---|---|---|
| 1 | ancien (nom inconnu → pas intégré) | **neuf** | ❌ le généré est plus riche que sa source |
| 2 | **neuf** | ancien (restauré) | ❌ la source est plus riche que le généré |

**Le décalage a changé de sens sans jamais disparaître.** Livrer les deux moitiés d'une paire
dérivée, c'est garantir qu'une seule des deux arrive.

★★★ **LA RÈGLE QUI EN SORT : NE JAMAIS LIVRER `public/guide.html`.**
C'est un fichier **dérivé** — il se fabrique, il ne se transporte pas. Claude livre **uniquement**
les sources `guide/NN-*.html` touchées, et Nico lance `node scripts\build-guide.mjs` chez lui.
Une source ne peut pas être confondue avec sa sortie s'il n'y a qu'elle dans le lot.

⚠️ **Corollaire général, au-delà du guide** : dès qu'un fichier est **produit par un script du
dépôt**, il ne se livre pas. On livre l'entrée, on nomme la commande. Vaut aussi pour `dist/`.

⚠️ **Et si un renommage est inévitable** (dossier de sortie plat), l'annoncer **en tête de
livraison, en une phrase visible** — pas dans une cellule de tableau. « Le fichier arrive sous le
nom X, renomme-le en Y et place-le dans Z ». Un nom qui n'existe pas dans le dépôt ne trouve
jamais sa place tout seul.

### ⚠️ LE PIÈGE — modifier une source sans régénérer

**C'est l'ancien guide qui part en ligne, en silence.** D'où le garde-fou :

```
node scripts\build-guide.mjs --check
```

Il n'écrit rien. Il dit « guide.html est a jour » — ou il **sort en erreur**.

### ⚠️⚠️ POURQUOI LE SCRIPT N'EST PAS DANS LE BUILD

**C'est délibéré.** La règle « jamais un second `&& node scripts/…` » (§6) reste intacte.

### Ce que le script fait, et ce qu'il ne fait pas

**Il ASSEMBLE. Il ne rédige rien.** ⚠️ La règle « **ne pas régénérer ces pages par LLM** » est
respectée : le découpage a été **mécanique**. **Preuve exigée et obtenue : le guide régénéré était
identique OCTET PAR OCTET à l'original** avant toute correction éditoriale.

**Seule exception : le sommaire de gauche**, construit depuis la première ligne de chaque section :

```html
<!-- @nav emoji="🍷" titre="Cave" sous="Le Chai, Le Cuvier, Le millésime" -->
<section id="cave">
```

**Pourquoi lui** : c'était la seule chose réellement **dupliquée**.

### Les règles d'écriture d'une source

- ★ **L'ORDRE des sections vient du NUMÉRO du fichier.**
- **Chaque fichier commence par sa ligne `@nav`, puis par `<section id="…">`.**
- **L'`id` de la section est l'ancre du sommaire ET celle des fiches d'aide** (`MV_AIDE[x].ancre`).
  ⚠️ **Le changer casse le bouton « Guide complet » de l'aide — C22 le refuse.**

### Les gardes du script

Il **REFUSE de tourner** et nomme le fichier fautif si : l'en-tête `@nav` manque · deux sections
portent le même `id` · un fichier ne commence pas par `<section id="…">`.
**Il ne produit jamais un guide à moitié cassé.**

⚠️ **Piège de découpage** : le sommaire contient un bloc « **Ailleurs** » **après** les liens de
sections. Le marqueur est borné aux liens **contigus**.

### ⚠️ Ce qui reste à jour, et ce qui ne l'est pas

Corrigé le 09/08 : **Pilotage** · **Cave** · **La Réserve** · **Phyto** · **Saisons** · **Réglages**.

**PAS ENCORE À JOUR** : **Planning** (équipe collective, capacité réelle, heures dues) ·
**Données** (hub Documents, journal des erreurs).
⚠️ **`demarrage.html` (~60 ko) n'a PAS été touché** et mériterait le même découpage.

---

## 27e. ★★ La démo guidée & les supports imprimés

### La visite guidée (`?demo=visite`) — REFAITE LE 15/08 (§43)

⚠️⚠️ **Cette section disait « 14 moments » et « la démo ne connaît aucun des lots d'août ». Les deux
étaient FAUX** au moment où on l'a relue : il y avait 19 moments, Cave et Conformité comprises.
**Une section de CLAUDE.md se vérifie sur le code comme le reste** (règle d'or n°3).

**19 moments, TROIS ACTES**, ≈ 4 min annoncées (mesuré : 3 414 car. de narration ≈ 3,8 min de
lecture + ~1,3 min de navigation — « trois minutes » était une promesse rompue au premier écran) :
- **I — avant que l'équipe arrive (décider)** : météo par secteur · « Traiter ou pas ? » · le cap du jour ;
- **II — la journée s'écrit toute seule** : **l'écran de l'ouvrier** · le ✓ · le journal · la carte ·
  le tracteur (chrono §31) · traitement + E-Phy + Réserve · **le jour du contrôle** · le Chai · le millésime ;
- **III — ce que ça rend** : pointage · fiche de Jean · le verdict · **la date qui ne rentre pas** ·
  coût par parcelle · le renfort · les 22 documents + archives.
★ **Le Cuvier et la Réserve sortent du parcours** et restent dans les 26 chapitres : trois moments
de cave d'affilée cassaient le rythme, et la Réserve se dit en une incise sous le traitement.

★★★ **LES TROIS MOMENTS QUI MANQUAIENT, et pourquoi ce sont eux** :
1. **« Ce que voit Jean »** — l'objection n°1 d'un patron de domaine n'est pas le prix, c'est
   *« mes gars ne s'en serviront pas »*. La visite entière se jouait depuis le fauteuil du chef.
   Le geste est contre-intuitif — **montrer moins** — donc il se retient.
2. **« Le jour du contrôle » avec deux parcelles FERMÉES** — le seul moment où le logiciel
   **rattrape** l'utilisateur au lieu de l'assister. Un écran qui protège vaut trois écrans qui
   font gagner du temps : il répond à une peur, pas à une corvée.
3. **« La date qui ne rentre pas »** — une **date** et des **heures restantes** frappent dix fois
   plus fort qu'un pourcentage d'avancement. Le seul écran qui dit au vigneron quelque chose
   qu'il ne sait pas encore.

### ⚠️⚠️⚠️ `DEMO2_CREDITS` — LA RÈGLE, ÉCRITE APRÈS COUP

> **ON NE FACTURE QUE CE QU'ON A MONTRÉ.** Toute ligne du chiffrage est **démontrée par un moment**.
> Une ligne qu'aucun écran ne démontre est une ligne que le prospect découvre à la caisse — et
> c'est celle qu'il refusera, en emportant le total avec.

**Ce qui n'allait pas** : la plus grosse ligne (`info`, 10 min × 220 j = **37 h**, un tiers du total)
n'était **créditée par aucun moment**. Le compteur du parcours montait à **40 min** (3 clés sur 7),
puis l'addition sortait 111 h de nulle part. C'était aussi **la seule ligne qu'un vigneron peut
refuser en bloc** — et son refus faisait tomber le résultat sous le seuil affiché.

**Table actuelle — 9 lignes, ≈ 127 h, toutes démontrées** : phyto 5 · validations 33 ·
**pointage du soir 37** · fins de mois 18 · saisonniers 8 · **carnet tracteur 10** · cave 6 ·
Réserve 4 · **papiers du contrôle 6**.
★ **`DEMO2_HORS`** porte la ligne molle **hors du total** (+37 h, annoncés à part) : celui qui y
croit arrive à 164 h — proche de la brochure ; celui qui la refuse reste à 127, **et l'argument
tient quand même**.

⚠️ **`min` du tableau ≠ `min` crédité au compteur.** Le tableau compte **par occurrence** (90 min
pour une fin de mois) ; le compteur compte **ce que cette journée-là fait gagner** (100 min au
total sur les 19 moments). `min:0` marque une ligne **démontrée sans rien créditer** — sinon
« aujourd'hui » cesse d'être crédible.

### ★★★ L'addition — ELLE NE COMPTE QU'EN HEURES. AUCUN MONTANT.

Elle est passée par **deux états faux** avant celui-ci :
① `2 200 € − 948 − 990 = **+260 €** la première année` — après quatre minutes de démonstration, la
dernière chose lue était un gain de 260 €. **Une marge plus mince que le scepticisme du lecteur
est un couteau qu'on lui tend**, et une soustraction s'audite au lieu de se ressentir.
② un coût « **par heure rendue** » (7,45 €). Plus solide — mais **toujours un prix**, et un prix
posé sur un écran ne se discute pas, il se compare.

★★★ **DÉCISION DE NICO (15/08) : ZÉRO MONTANT DANS LA DÉMO.** Ni symbole €, ni abonnement, ni
installation, ni taux horaire. Le gain se dit en **heures** et en **journées de bureau**, ligne par
ligne, chacune adossée à un écran qu'on vient de voir. **Le prix appartient à la conversation qui
suit, pas à la démonstration.** Clôture : *« Quinze jours sur vos parcelles, vos surfaces, votre
barème. Vous compterez vous-même. »*
⚠️ **Le harnais interdit mécaniquement tout montant dans `_mvtAddition`** — quatre motifs (€,
79/948/790, 990, le signe −), et la contre-épreuve y rouvre un prix pour vérifier que ça rougit.

### ★★★ CINQ VIGNETTES CORRIGÉES PAR L'ŒIL DE NICO

**144 assertions vertes, et cinq moments faux quand même.** Un harnais vérifie ce qu'on facture et
ce qu'on vise ; **il ne voit pas un projecteur mal posé ni une phrase qui décrit un autre écran.**

- **4/19** — l'ouvrier atterrissait sur l'accueil. Son écran, c'est **la liste de ses parcelles**
  filtrée sur la tâche du jour. `pTacheFilter` se pose **dans ce moment-là** : sans filtre,
  `_pvActions` sort vide et il n'y a aucune coche à montrer.
- **5/19** — la peur n'était pas levée. On ne voyait ni que **l'ouvrier coche lui-même**, ni
  **qu'un oubli se rattrape**. `canWrite()` est vrai pour l'ouvrier comme pour l'admin : **le même
  bouton des deux côtés**. C'est ce qui répond à « et s'il oublie ? », la vraie objection.
- **8/19** — le texte parlait d'un **chrono qu'on ne voit pas** : `_chronoEnabledForSession` exige
  `CONFIG.chrono_mode==='on'` **et** une mesure ouverte, et le scénario n'en ouvre aucune. La liste
  des sessions porte déjà l'argument — les parcelles faites, cochées une par une.
- **13/19** — ⚠️⚠️ **DÉFAUT PRODUIT, PAS DÉFAUT DE DÉMO** : `_pl2Cell` rend **toute** entrée
  `absent:true` par une croix rouge « Absence », **avant même de lire** `motif` / `motif_h`.
  **Un retard d'une heure et une journée entière s'affichent à l'identique.** Backlog.
- **15/19** — la cible était `.pil-dec`, le bloc **sous** le cockpit, qui contient la carte
  « Traiter ? » **déjà éclairée au moment 2** : deux fois la même image (§35e, encore).

★ **La leçon** : sur une démo, **l'assertion la moins chère est un œil**. Le harnais empêche la
régression ; il ne remplace pas le fait de regarder les 19 écrans une fois.

### Les défauts de moteur corrigés

- ⚠️⚠️ **« Passer » promettait un saut et faisait une sortie** : `_mvtSkip` ouvrait le menu, donc
  sauter *un* écran faisait perdre tous les suivants **et l'addition**. Deux boutons distincts
  désormais ; **« Quitter » mène à l'addition**, pas au menu.
- ★★★ **`_mvtQuery` refuse une cible invisible** (`_mvtVisible`). Depuis §42 les cartes du Pilotage
  arrivent **repliées** et `.pil-tbody{display:none}` : `querySelector` trouve l'élément, il mesure
  zéro, `_mvtReposition` rend `r=null` et **les quatre masques couvrent l'écran entier**. Le repli
  ultime ne s'armait que sur `null` : il ne voyait pas ce cas.
  ⚠️ **Aucun moment ne tombait dedans le 15/08** — vérifié : l'onglet Économie ne contient aucun
  `_pilTile`, donc le moment du coût par parcelle se rabattait sur `#pil-content`. **La garde est
  posée avant que le premier n'y tombe**, pas après.
  ⚠️⚠️ **C22 vérifie qu'un sélecteur EXISTE dans les sources, jamais qu'il est VISIBLE au moment
  où la visite le vise.** C'est le trou par lequel le bug du 09/08 était passé, sous une autre forme.
- **L'onglet Économie s'ouvre sur `_PEC_SUB='syn'`** pendant que la narration parlait du coût par
  parcelle. `_mvtPecSub('par')` et `_mvtPilOuvrir('echeances')` **cliquent** (ils ne écrivent pas
  dans l'état) : le handler délégué referme les autres cartes, construit celles qui ont besoin de
  largeur et grave l'état — le contourner, c'est réimplémenter trois règles à côté.
- ★ **`s.wait`** : délai par moment quand la navigation enchaîne plusieurs rendus. 420 ms fixes
  posaient le projecteur sur le DOM d'avant.
- **`window._visiteDrae={}` annulait le délai de rentrée** sur les fiches parcelle, alors que
  `_cfmDre()` (qui lit `TRAITEMENTS` et **ignore cette table**) affichait déjà les mêmes parcelles
  comme fermées dans le Pilotage. **La liste disait le contraire du Pilotage.** Semé sur
  *Les Charmes* et *La Combotte* — un délai actif **ne bloque pas** la validation (badge + liseré
  rouge, rien d'autre) et aucune des deux n'est la première carte : le moment d'action est intact.
- **La bascule ouvrier est réversible** (`_mvtRoleOuvrier`) et le retour est armé **à trois
  endroits** : le moment suivant, `_mvtEnd`, et la fermeture d'un chapitre. Un rôle laissé en place
  ampute les quinze moments suivants.

### ★★★ `mv-harnais-demo` + sa contre-épreuve (branchés en CI)

**144 assertions · 7 contre-épreuves.** Deux règles qu'aucun autre contrôle ne porte :
① toute clé de `DEMO2_CREDITS` est démontrée par un moment · ② aucun `sel` ne vise `.pil-tbody`
ni `#pil-body-*`. Plus : les crédits orphelins, l'existence de chaque jeton de sélecteur, le total,
et le fait que la clôture ne soustraie plus.

⚠️⚠️ **CE QUE LA CONTRE-ÉPREUVE A TROUVÉ, ET QU'AUCUNE RELECTURE N'AURAIT VU** : l'assertion
« ce sélecteur existe dans les sources » **se prouvait toute seule** — elle cherchait la cible dans
`app.js`, c'est-à-dire dans le fichier qui l'écrit. `sansCitations()` retire donc `_mvtSteps` et
`_MVT_CHAPS` du corpus avant de chercher. **C'est le quatrième cas de « stub plus généreux que la
vraie fonction » du mois.**
★ `corps()` ôte les commentaires avant toute assertion : un commentaire qui cite `.pil-tbody` ne
doit pas rougir (§34g).

⚠️⚠️⚠️ **ET UNE FAUTE COMMISE PENDANT CE LOT MÊME, QUI A DONNÉ L'ASSERTION 6** : `_mvtCredits` a été
**appelé avant d'être écrit**. `node --check` est passé — la syntaxe était valable — le preflight
aussi, et la visite aurait planté au premier moment. **Aucun contrôle du dépôt ne voyait un appel
vers une fonction inexistante.** L'assertion 6 vérifie désormais que tout `_mvt*` / `_demo2*`
appelé dans `app.js` a bien son `function …(` — 36 fonctions couvertes.

### ✅ Les supports imprimés — `mvprint.py`

Moteur Python maison (**1 069 lignes**, ReportLab, palette CMYK séparée à la main), **hors du dépôt
déployé (et hors Git)**. Annoncé perdu le 04/08 au soir, **retrouvé le lendemain matin**.
⚠️ **Sa copie doit être maintenue dans `..\mavigne-sauvegardes\`.**

**Caractéristiques** : contrôle qualité automatisé (8 vérifications géométriques par page, contrôle
du texte par `pdfplumber`, contrôle de rendu au pixel par `pypdfium2`), **100 % CMYK**, QR en
**K100 vectoriel**, gabarit Vista 216×303 mm, polices dans `fonts/` et images dans `assets/`
**à côté du script** (`HERE`), maquettes d'écran **redessinées programmatiquement**.

⚠️ **Le ROI s'exprime en heures, pas en euros** (215 h/an pour 10 ha).
★ **Leçon générale** : tout outil hors dépôt reçoit sa copie de sauvegarde **le jour de sa création**.
★★ **`mkpdf.py` (§18c) suit exactement le même patron** — et il a confirmé la leçon la plus
importante de `mvprint.py` : **le contrôle par extraction de texte ne voit pas un carré noir.**

## 27f. ★★ `mise-en-route.html` — le formulaire d'installation client

**Trois cadrages successifs de Nico ont défini l'objet** :
1. pas un devis — une **collecte des données d'installation** ;
2. pas de lignes à remplir au stylo — **du tapable à l'écran** ;
3. **ce qui existe déjà ailleurs s'envoie en PIÈCE JOINTE**, jamais en ressaisie.

**Résultat** : page autonome `public/mise-en-route.html`, **17 questions** presque toutes en
radios/cases, section « pièces à joindre » explicite.

★★★ **DEPUIS LE 09/08, ELLE ENVOIE** (§18b). L'action principale est **« Envoyer mes réponses »** ;
« Copier » et le brouillon mail restent en repli.

- ★ **Les cinq questions de barème (§30c) y étaient DÉJÀ** : écartements (`ecR`/`ecP`), IDCC
  (`idcc`), vendange (`vdPart`), prestataire (`prQuoi`), taille (`taAutre`). **Il n'y avait rien à
  ajouter au questionnaire** — seulement un chemin de retour.
- **Une seule définition de l'état du formulaire** (`etatCourant()`), lue par la sauvegarde locale
  **et** par l'envoi.
- ⚠️ **Pourquoi le mailto ne suffisait pas** : un `mailto` avec corps encodé **triple** en taille
  avec les accents français, et Outlook **tronque en silence vers ~2 000 caractères**.
- `frDate()` : ISO → **JJ/MM/AAAA** ; autosave **localStorage sous try/catch** ; valeurs date/heure
  **posées en JS** (Safari) ; **`noindex, nofollow`** ; **jamais dans `sitemap.xml`**.
- ⚠️ **Le succès rappelle que les FICHIERS restent à joindre** — l'envoi ne transporte que les
  réponses, pas le parcellaire.
- Déploiement : `public\` puis `--only hosting`, **aucun bump**.
- ★★ **Ne pas le confondre avec le widget « Mise en route » (§27c)** : celui-ci est une page
  publique remplie **avant** l'installation ; celui-là est un bloc **dans l'app**, après.

---

## 28. État courant & backlog

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §43 (la visite guidée)

1. ⚠️⚠️⚠️ **ALIGNER LES TROIS CHIFFRES DU ROI.** La démo dit **127 h (+37 hors total)**.
   `mvprint.py` dit **215 h/an pour 10 ha** et l'argumentaire oral **3 à 5 h/mois**. Tant que les
   trois ne disent pas la même chose, la plaquette contredit la démo devant le même prospect.
   **C'est le point n°1, avant le devis Garraud.**
2. ⚠️⚠️ **REGARDER LES 19 MOMENTS EN VRAI.** Le harnais vérifie ce qu'on facture et ce qu'on vise ;
   **il ne voit pas un projecteur mal posé**. En particulier : le moment ouvrier (bascule + retour),
   le dépli des échéances, la sous-vue Parcelles d'Économie, et les deux moments qui enchaînent
   plusieurs rendus (`wait`).
3. ★ **Caler les trois estimations neuves** : pointage 10 min × 220, carnet tracteur 10 min × 60,
   papiers du contrôle 60 min × 6. Elles sont de moi, pas de Nico — lui seul peut les signer,
   comme il a signé les 250 tâches de janvier à juillet.
4. **`lint-cliquet` / ESLint** : jamais joué côté Claude (`node_modules` absent) — **l'échec est
   identique sur la base d'origine**, vérifié.
5. **`test:smoke` / `test:e2e`** : jamais joués côté Claude (Chromium injoignable).

### ⚠️⚠️⚠️ AUDIT DU 16/08 — LIRE §44 AVANT DE TRAVAILLER DANS CE BACKLOG

**Ce backlog a été confronté aux fichiers le 16/08, entrée par entrée.** Résultat : **onze entrées
rayées** (le code les avait déjà réglées), **quatre chiffres corrigés à la hausse**, et **neuf
harnais sur vingt-six qui ne peuvent pas démarrer** — dont six qui portent un chemin de bac à sable
en dur et se lisent donc comme des succès.

**Les trois priorités qui en sortent** :

1. ⚠️⚠️ **`_pl2Cell`** — un retard d'une heure et une journée d'absence s'affichent pareil chez MG
   et Chapelle, tous les jours. **Le défaut le plus visible côté client de tout le backlog.**
2. ⚠️⚠️ **Les six harnais à chemin absolu** (§44c) — une ligne chacun, et neuf filets se remettent
   à protéger quelque chose.
3. ⚠️ **0a-quater** — la masse salariale exclut les bureaux pendant que son commentaire dit
   l'inverse. **`avecBureau` : 0 occurrence.**

⚠️ **L'audit n'a PAS pu vérifier l'état EN LIGNE** (bac à sable sans accès au domaine) : tout ce qui
suit décrit **le dépôt**, pas la production. **Détail, preuves et règles nouvelles : §44.**

### ✅ LA FUSION DE `pilotage.js` EST FAITE (commit `2e002ae`)

**Le commit `banc` avait remplacé `src/pilotage.js` par un fichier d'une autre lignée** — 1 690
lignes changées, 1 164 suppressions : `_mvInfoBtn` 28→0, `MV_INFO` 4→0, `_PIL_ST_V` 4→0,
`_pecFiabCard` 4→0, `_pilTile` passé de 9 à 8 arguments. **Signature d'un fichier restauré depuis
une sauvegarde, pas d'une décision** : `utils.js` gardait ses 11 fiches `MV_INFO` sans pastille où
les poser, et la CI lançait toujours trois harnais devenus rouges.
⚠️ **Les deux lignées ne se recouvraient pas** — `7a509b4` portait l'ergonomie sans
`_PIL_CMP_RECOUV`, `c638402` la cadence sans l'ergonomie : **aucun n'était un sur-ensemble de
l'autre**, il a fallu fusionner à la main. **Fait par Nico.** Vérifié : 9 660 lignes, les six
marqueurs présents, `banc` + `garde-projection` + les trois harnais Pilotage tous verts.
★ **La leçon** : quand un fichier maigrit de 600 lignes entre deux clones, **c'est le nombre de
lignes qu'il faut regarder en premier** — pas le diff, qui noie le signal dans le bruit.

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §42

1. **`npm run lint` et ESLint** — **jamais joués côté Claude de tout le chantier** (`node_modules`
   absent du bac à sable ; l'échec est identique sur la base d'origine, ce n'est donc pas le lot).
2. ⚠️⚠️ **REGARDER Simuler et Cave.** Leurs rendus sont vérifiés par assertion mais **n'ont pas été
   regardés** — budget d'outils épuisé sur le dernier lot. Vu que **trois** défauts du chantier n'ont
   été trouvés que par l'œil (§42h), c'est le point faible du paquet. En particulier **l'étape 2 du
   simulateur**, dont la légende de couleurs a été remaniée.
3. **`test:smoke` et `test:e2e`** — jamais joués côté Claude (CDN Playwright injoignable pour
   l'installation de Chromium ; les mesures de ce chantier passent par le Chromium déjà présent).
4. ★ **La migration `_PIL_ST_V` remet la disposition à neuf UNE fois chez MG et Chapelle** : les
   cartes qu'ils avaient ouvertes ou fermées repartent repliées. C'est annoncé dans le journal des
   nouveautés — vérifier que le message est bien passé avant qu'ils s'en étonnent.

### NOUVEAU AU BACKLOG (issu de §42)

- ⚠️ **Le doublon `_pilDiag` / `_pecZeros`.** Les deux portent un constat voisin sur « pas de taux
  horaire », à **deux endroits de la même page** : le bouton « à compléter » en tête de module, et la
  carte de fiabilité d'Économie. Ils ne disent pas tout à fait la même chose (`N fiches sans taux`
  contre `aucun taux nulle part`), mais le lecteur, lui, voit deux avertissements sur le même sujet.
  **C'est §34 en plus petit.** Fusion = chantier de moteur, pas d'ergonomie.
- **Les cartes sans ligne de cadre.** Toutes les cartes du Pilotage n'en ont pas encore une : celles
  qui ne passaient aucun sous-titre gardent un en-tête à deux étages. C'est visible, et c'est du
  travail d'écriture, pas de code.
- **Le `.pil-cr-note` masqué sur téléphone** : l'instruction « cliquez une campagne pour zoomer »
  disparaît sous 700 px. Un utilisateur qui n'a que son téléphone ne l'apprendra jamais.
  Piste : la dire une fois dans la fiche d'aide du module — ou une pastille « i » sur le fil.
- **Mesurer si les fiches « i » sont ouvertes.** Tout ce chantier parie qu'un vigneron touche la
  pastille quand il en a besoin. **Ce pari n'est pas vérifié.** Si personne ne l'ouvre jamais, c'est
  que le texte manque là où il était, pas qu'il était de trop.

### NOUVEAU AU BACKLOG (issu de §43)

- ⚠️⚠️ **UN RETARD D'UNE HEURE ET UNE ABSENCE D'UNE JOURNÉE S'AFFICHENT PAREIL.** `_pl2Cell` :
  `if(e&&e.absent) return {txt:'✕', cls:'pl2c-abs'}` — la croix rouge tombe **avant** toute lecture
  de `motif` et de `motif_h`. Or le motif `retard` porte `heures:true` : **la donnée est là,
  l'affichage l'écrase.** Trouvé à l'œil sur la démo, **mais c'est le produit** : chez MG et
  Chapelle, un retard saisi ressemble à une journée perdue sur le tableau. Piste : un glyphe
  distinct (⏰ + les heures) quand `motif_h > 0`, et la légende qui suit.
- **Le chrono tracteur n'est jamais visible en démo** (`CONFIG.chrono_mode` à 'off', aucune mesure
  ouverte). Soit on le sème pour en faire un moment — c'est l'argument de précision le plus fort
  du module — soit on l'assume hors parcours. Aujourd'hui : hors parcours.
- ⚠️⚠️⚠️ **NEUF HARNAIS SUR VINGT-SIX NE PROTÈGENT RIEN** — l'entrée disait « deux harnais périmés
  rougissent la CI ». **Les deux existent bien**, mais le constat était faux sur deux points, et
  incomplet sur le reste. Mesuré le 16/08, chaque script lancé un par un :
  · **Ni l'un ni l'autre n'est dans `ci.yml`.** Ils ne rougissent donc **rien du tout** — ils se
    taisent, ce qui est pire.
  · `harnais-bandeau-essai` : **2 rouges sur 15**, dont *« APP_VERSION délibérément inchangé
    (6.13) »* — il fige une version que le dépôt a dépassée de douze crans.
  · `harnais-cadence-escalier` : **1 rouge sur 28** — *« l'alerte >15 % ne crie plus au dérapage sur
    un chiffre d'histoire »*.
  · ★★★ **SIX SCRIPTS PORTENT `/home/claude/mavigne-dev/` EN DUR** : `harnais-bandeau-essai`,
    `harnais-cadence-escalier`, `harnais-claude-md`, `harnais-parcours-prospect`,
    `harnais-reconduction`, `harnais-vitrine`. **Ils ne peuvent démarrer que dans le bac à sable.**
    Chez Nico comme en CI, ils sortent en `ENOENT` — et un script qui ne démarre pas se lit comme un
    succès. **C'est l'entrée 0h (`lint-cliquet`), mais multipliée par six et jamais consignée.**
  · `harnais-vitrine` et `contre-epreuves` : `ENOENT` sur `logiciel-vigne.html` — chemin relatif au
    répertoire courant, pas au dépôt.
  · `harnais-essai-borne.cjs` : `Cannot find module 'firebase-admin'`.
  · `harnais-claude-md` : **1 rouge sur 23** — c'est ce document lui-même qui se déclare périmé.
  → **Correctif type, une ligne par script** : `new URL('../<chemin>', import.meta.url)` au lieu du
  chemin absolu, et `os.tmpdir()` pour les fichiers de contre-épreuve. Détail en **§44c**.

### ⚠️ À FAIRE AVANT DE DÉPLOYER LE CHANTIER §40

1. **Ordre non négociable** :
   `firebase deploy --only functions:gtRenewTrial,functions:trialWatch` **puis**
   `npm run build && firebase deploy`. Pas de rules, pas de backfill.
2. **`test:smoke` et `test:e2e` côté Nico** — jamais joués côté Claude (CDN Playwright injoignable).
3. ✅ **`trialExp` de Marchand-Grillot et Chapelle vérifié** (14/08, Nico) — la première nuit,
   `trialWatch` traite ce qu'elle trouve ; un `trialExp` résiduel chez un converti aurait déclenché
   une relance chez lui.

### ✅ L'OFFRE DE LANCEMENT EST BORNÉE (14/08)

**Réglé.** 15 jours, reconductibles une fois, puis lecture seule — cf. §14b et §40. C'était le point
bloquant du devis Garraud depuis trois sessions. **Reste à trancher : ce qui se passe après J30.**
L'hypothèse en vigueur — la lecture seule dure — n'a jamais été confirmée explicitement.

### NOUVEAU AU BACKLOG (issu de §40)

### ⚠️⚠️ NOUVEAU AU BACKLOG (issu de §43 — 15/08)

- ⚠️⚠️ **Refondre l'export JSON** — ⚠️ **le dénominateur a bougé : 8 clés sur 27**, pas 24
  (`COLLECTIONS`, `firebase.js:232`, compté le 16/08). L'export manque toujours `travaux`,
  `catalogue`, `conducteurs`, `activites`, `tracteurs_list`, `entretiens`, `reparateur`,
  `reparateur_hist`, `cave_elevage`, `cave_vendange`, les cinq clés `planning_*`, `kml_polygons`,
  `intrants` et `paie`. **La liste s'allonge pendant que l'export reste figé** : c'est exactement
  l'argument de la dériver de `COLLECTIONS` au lieu de la maintenir. Détail : **§43f**.
- ⚠️⚠️ **Vérifier la persistance cloud tenant par tenant** — le code est bon, l'existence des
  documents chez chaque client n'est pas prouvée. Procédure : **§43g**.
- ⚠️ **La marge en jours n'est surveillée par aucun test** — bloqué par l'export. **§43f**.
- ⚠️ **Aligner `npm run check` sur le workflow CI** — `mv-harnais-echelle.mjs` n'était lancé que par
  le CI : le rouge n'apparaissait qu'après le push (**§43i**). Vérifier qu'aucun autre harnais du
  workflow ne manque au `check` local.
- **Ajouter la vérification des six clés à la fin de toute mise en route** (§27f).
- **Clôture d'une saison très incomplète** — `Hiver 2025–2026` archivé à 32 %. Empêcher, ou
  signaler ?
- **Rejouer les 6 contre-épreuves de `cadAppl`** — écrites avant les gardes 2 et 3, la redondance
  a pu en rendre certaines aveugles (piège de **§43e**).

- ⚠️ **`trialExp` / `trial_until` peuvent diverger.** Trois chemins les écrivent ensemble
  (`_fcSaveAbo`, `agtInsTrialGo`, `gtRenewTrial`). Un quatrième qui l'oublierait ferait mentir la
  veille **en silence**. Piste : une assertion de cohérence dans `trialWatch`, qui alerte au lieu de
  se taire.
- **Durcir la lecture seule côté serveur** — `firestore.rules` ignore `trial`. Décision commerciale
  avant technique : est-ce un frein ou une serrure ?
- **Mesure d'audience** sur `essai.html` et la démo guidée.
- **Les trois nombres dupliqués** (§14b) — vivre avec, ou générer l'un depuis l'autre.

### ★★★ La journée du 11 août (suite) — la refonte du Planning, deux lots

**Point de départ** : *« je trouve que planning est mal conçu, il y en a un peu partout, il faut
parfois cliquer sur un membre parfois non. »* Diagnostic chiffré, puis maquette validée sur **une
seule question posée à Nico** — le geste le plus fréquent porte-t-il sur une case ou sur plusieurs ?
Réponse : « le geste = ta reco », donc **le tap coche**.

**Lot 1 — le geste unique.** Le mode « Sélection multiple » supprimé, trois cochages ajoutés
(colonne, ligne, vue), barre de sélection contextuelle, **trois feuilles fusionnées en une**, trois
moteurs d'écriture sans DOM. **Un bug réel** : récup et chaleur en lot écrasaient les congés en
silence. **Harnais 12/12 + contre-épreuve.**

**Lot 2 — trois onglets** (`mois` / `gens` / `cadre`) avec table de migration, fin du doublon
grille+synthèses, suppression du menu « Outils » et de la feuille « Anciens salariés », **et un
défaut de modèle** : deux réglages du domaine logés dans la fiche d'un salarié. **C22 fait dans le
lot** — 8 renvois périmés, `MV_AIDE`, `reglages.js`, guide régénéré.

**Détail complet : §19a.** Fichiers : `index.html` · `planning.js` · `styles.css` · `utils.js` ·
`reglages.js` · `sw.js` · `guide/10-planning.html` + `public/guide.html`. **Bump APP + SW aux deux
lots.** ✅ **DÉPLOYÉ** (SW v6.45 et v6.46 lus dans le changelog du dépôt).

⚠️ **`test:smoke` et `test:e2e` n'avaient PAS été passés au moment de la livraison** : Playwright ne
peut pas télécharger Chromium dans le bac à sable. Preflight, les deux cliquets, `node --check`,
build Rollup et le harnais des moteurs étaient verts. **C'est la première fois qu'un lot est parti
avec les deux paliers navigateur non joués côté Claude — Nico les a passés de son côté avant de
déployer.**

### ★★★ La journée du 11 août — audit intégral, puis deux lots Tracteur

**Versions au moment de ces deux lots : APP `5.93` · SW `6.43`.** ⚠️ **Trois versions ont suivi le
même jour** — v6.44 (l'accompagnement rattrape les deux lots), v6.45 et v6.46 (Planning, lots 1 et
2). **État réel du dépôt au commit `636630a` : APP `5.96` · SW `6.46`.**
(À relire dans les fichiers, jamais depuis ici.)

**A. L'AUDIT INTÉGRAL DE L'APP** — preflight vert, 55 376 lignes, 10 analyses statiques.
Ce qui est **sain, vérifié** : handlers inline (20 types d'événements, 0 non exposé) · un seul
`console.log` non gardé et c'est l'émulateur · **contraste 5,56 → 16,73:1, AA passé partout** ·
7 « à venir » tous légitimes · `.pc-validate` à **60×60 px** · verrou Planning propre · 0 TODO.

Ce qui ne l'est pas :

| Constat | Chiffre |
|---|---|
| ★★★ **Tailles de police sous 12 px** | **1 625** — 1 204 en ligne + 421 CSS, soit **la moitié** de l'app, uniformément répartie. Le dock est à **9,5 px**, les doses phyto à **9 px**. « Plein soleil » ne change **que le contraste**. |
| ★★ **Trou responsive 761–767 px** | `max-width:760px` vs `min-width:768px` : le corps reste à 430 px pendant que `.pil-hero` garde sa grille 2 colonnes |
| ★★ **Quatre rendus de date concurrents** | 8 fonctions, dont **2 paires strictement identiques** (`_rmDate`/`_bcDate` dans le même fichier ; `_pOrdDateFr`/`_opDateFr` à l'octet près) |
| ★★ **Aucun formateur de nombre central** | ~330 `toFixed` + 46 `toLocaleString`, `utils.js` n'en expose aucun |
| ★ **Bloc de ré-export de 209 lignes** (`app.js`) | **111 lignes strictement inutiles** (le module expose déjà) + **5 noms morts** de l'ancien catalogue « Mes produits » |
| ★ **Trois conventions d'exposition `window`** | dont la boucle `for..in` de `phyto.js`, **invisible au preflight** — le fichier le reconnaît lui-même en commentaire |
| **333 `onclick` sur `<div>`** | pour 44 `aria-label` — non focusables clavier |

**B. LE CHRONO TRACTEUR INVERSÉ** — v5.92, §31. `tracteur.js` + `index.html` + `styles.css` +
`utils.js` + `sw.js`, **bump APP + SW**. Plus le branchement du **cliquet de vocabulaire**
(`package.json` + `ci.yml`) : il était écrit le matin même et **aucun appelant ne l'exécutait**.
C14 `tracteur.js` **5 → 4**, baseline regravée.

**C. LE MODE DU JOUR** — v5.93, §32. `app.js` + `index.html` + `styles.css` + `utils.js` + `sw.js`,
**bump APP + SW**. Deux `catch{}` vides refusés par C14 puis remplis avec `logError`.

⚠️⚠️⚠️ **DETTE CONTRACTÉE LE JOUR MÊME : les fiches `MV_AIDE` du Tracteur n'ont été mises à jour
pour AUCUN des deux lots.** Les deux écrans les plus utilisés du module ont changé de gestes et leur
aide décrit les anciens. **C'est la violation exacte de la Règle d'or n°4, écrite le même jour.**
→ **Premier point du backlog, avant tout nouveau lot.**

⚠️ **Ni `npm run build`, ni le smoke, ni l'e2e n'avaient été lancés côté Claude** sur ces deux lots
(pas de navigateur dans le bac à sable). ✅ **Ils sont déployés** — SW v6.42 et v6.43 sont dans le
changelog du dépôt, et l'accompagnement les a rattrapés en v6.44.


### ★★★ La journée du 9 août — trois chantiers

**A. LE MATIN — L'ÉCART DE CADENCE D'ÉCONOMIE ÉTAIT FAUX D'UN FACTEUR 5** (§20b)
`pilotage.js` seul, **aucun bump**, 28 assertions, preflight vert.
⚠️ **Livré sans `WHATS_NEW`** alors que le client voyait le changement → **annoncé au bump suivant**.

**B. L'APRÈS-MIDI — LE CHANTIER ACCOMPAGNEMENT, EN QUATRE LOTS** (§27)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **a** | preflight **C22** + correctif du bug `ecf` de la visite guidée | `preflight.mjs` + `app.js` (+ `sw.js`) | **SW seul**, `WHATS_NEW = []` |
| **b** | les **10 fiches `MV_AIDE` refaites** + le point d'aide dynamique | `utils.js` + `pilotage.js` + `index.html` + `sw.js` | **APP + SW** |
| **c** | widget **« Mise en route »** sur l'accueil admin | `app.js` + `index.html` + `utils.js` + `sw.js` | **APP + SW** |
| **d** | **guide découpé + générateur** puis corrections factuelles | `guide/` + `scripts/build-guide.mjs` + `public/guide.html` | **aucun** |

★ Le `WHATS_NEW` du lot **b** annonce **aussi** le correctif de cadence du matin.
✅ **Rayés** : « guide.html dit Côte de Nuits » · **MT-A**.

**C. LE SOIR — LA RÉDUCTION DU TEMPS D'INSTALLATION, EN CINQ LOTS** (§18b)

| Lot | Contenu | Fichiers | Bump |
|---|---|---|---|
| **1** | parcelles : noms alignés + commune par ligne | `admin-gt.js` | **aucun** |
| **2** | comptes de l'équipe en lot + **correctif du tenant** | `admin-gt.js` + `firebase.js` | **aucun** |
| **3** | périodes recopiées d'un domaine installé | `admin-gt.js` | **aucun** |
| **4** | `submitMiseEnRoute` + le formulaire qui envoie + la reprise dans l'assistant | `functions/leads.js` + `public/mise-en-route.html` + `admin-gt.js` | **aucun** |
| **5** | machines collées en liste + volume de fût | `admin-gt.js` | **aucun** |

**Plus** la procédure `INSTALLER-UN-DOMAINE.md` et son PDF (§18c).
**20 h → ~9 h sur le papier**, dont 14 h de clavier ramenées à ~4 h.
✅ **DÉPLOYÉ.** ⚠️ **Mais le gain reste théorique : l'installation à blanc n'a pas été faite.**
Les cinq lots sont en ligne, **aucun n'a encore servi de bout en bout**. Le « ~9 h » est un chiffre
de papier tant qu'un slug jetable n'a pas été monté en entier (§18b, backlog technique n°1).
✅ **Rayé** : CF `submitMiseEnRoute`.

### ★★★ Le 10 août — migration GitHub

Le code source de Ma Vigne vit désormais dans un dépôt **`4ss4ss1/mavigne-dev`**, public, sur
GitHub Desktop côté Nico. **Ceci remplace le workflow d'upload pour la LECTURE du code** (Règle
d'or n°1, « Environnement de Nico »). Pas un chantier fonctionnel — un changement d'outillage, mais
le plus structurel depuis le début du projet : Claude clone/lit directement, Nico livre par
commit+push au lieu d'upload/téléchargement.
★ **Piste ouverte, pas encore faite** : committer ce document lui-même dans le dépôt (en
`CLAUDE.md` à la racine) pour qu'il soit, lui aussi, lisible sans upload à chaque session. Tant que
ce n'est pas fait, la procédure de régénération de la Règle d'or n°1 reste pleinement en vigueur
pour ce document précis.

### ⚠️ Lots encore non documentés ici

Connus par le seul changelog de `sw.js`, **à consigner par Nico** :
- **06/08** : « panneau GUERETTECH : 8 onglets deviennent 6 » · « SEC-GT/2 » (code à usage unique).
- **05/08** : la tournée sur l'écran de l'équipe · l'exercice comptable · les 4 défauts de la
  snapshot localStorage · le Chai qui s'ouvrait vide.
- **09/08 matin** : le soutirage à source unique · le Cuvier repeint · le **hub Documents** ·
  la **charte `MV_DOC`**.

### ✅ Le verrou administratif est levé

**3 août 2026 — l'Urssaf a confirmé que Nico peut facturer.** La première facture définitive est
partie à Simon Chapelle (réf. MV-2026-9024).

### ★★ Le fait commercial : Château Garraud

**Premier prospect arrivé hors réseau**, par le formulaire d'essai du site : **Lalande-de-Pomerol
(Gironde)** — ~45 ha en conventionnel, ~40 parcelles multi-communes, **12 permanents** + saisonniers,
6 machines, 4 cuvées. Profil **Domaine**, et le premier vrai test du travail multi-terroir (§30).

**Séquence de réponse préparée (dans l'ordre)** :
1. ⚠️ **Vérifier que `mise-en-route.html` est bien EN LIGNE** avant d'envoyer le lien — ★ et que la
   nouvelle version, celle qui **envoie**, est déployée (§18b).
2. Envoyer la réponse + le lien du formulaire (§27f).
3. Au retour : **enregistrer le slug `chateau-garraud` dans `_guerettech/tenants` AVANT
   `onboardTenant`** (§14) — ★ l'assistant le fait lui-même en première étape.
4. **DPA signé AVANT la création des 12 comptes salariés.**
5. Devis sur la **nouvelle grille** : Domaine = 990 € / 20 h incluses (−50 % lancement si l'offre est
   maintenue — **à borner**).
6. **Recalibrage du barème = partie du forfait** : densité girondine, jeu `gironde`, et les cinq
   questions du §30c — ★ **dont les réponses seront déjà dans son dossier** s'il a rempli le
   formulaire (§18b).
7. ★★ **Trois arguments neufs** : un château de 45 ha avec 4 cuvées a forcément plusieurs millésimes
   en cave (**la série MILLÉSIME lui parle directement**) ; **12 salariés à faire démarrer**, ce qui
   met l'accompagnement (§27) au cœur de la vente ; et ★ **son installation devrait coûter ~9 h au
   lieu de 28** compte tenu de sa taille — c'est ce qui rend le forfait tenable.
⚠️ **Détails à ne pas oublier pour ce client** : **volume de fût 225 L** · barème girondin ·
40 parcelles sur plusieurs communes · noms de parcelles probablement différents du fichier.

### ★ Livré antérieurement

**7 août soir** — série MILLÉSIME (4 lots) + lot MALO + refonte de l'onglet Cave du Pilotage.
**7 août matin** — Le millésime · parc à fûts · entonnage depuis le parc · registre des
manipulations · bilan de campagne.
**5 août** — `mvprint.py` retrouvé et archivé ; document d'instructions régénéré.
**4 août** — niveaux sautés `_mvNivH` (−528 h chez MG) · plomberie `tcfgSave` + `_normalizeTaches` ·
badge « votre valeur » · densité · barèmes régionaux · **DOCK rejoué** · MÉNAGE · **capacité
réelle** · **grille d'installation tranchée** · Garraud + `mise-en-route.html` · **registre phyto
CSV** · **vendange-couperet**.
**1er au 3 août** — UX-1 · `firebase.json` · e2e +2 étapes · **écran d'accueil public** · téléphone
corrigé · DEMO-3 · heures sup · **saisonniers dans l'historique** · **équipe collective** · refonte
Économie · **carte d'ordre de passage** · Décider ×6 · Renfort ×5 · **vendange fantôme, 941 h**.
**31 juillet** — nouveau SIRET, adresse et téléphone publiés, archivage des CGU/DPA signées.
**30 juillet** — série UX-R1 → R5, zéro nouvelle collection.

### Backlog — commercial & administratif

1. ★★★ **LE DEVIS GARRAUD** — la séquence complète est ci-dessus. ⚠️ **Il ne peut pas partir avant
   le point 2** : le devis chiffre une remise dont la durée n'est pas définie.
2. ⚠️⚠️ **BORNER L'OFFRE DE LANCEMENT** (durée jamais définie) — **bloquant pour le devis Garraud.**
   Une remise « −50 % » sans date de fin sur un document contractuel engage sans limite.
3. **Vérifier les empreintes de `_mv_signatures`** contre les archives du 31/07.
4. **Vérifier l'indexation dans Search Console.**
5. **LinkedIn posts #4 et suivants** — **douze angles prêts** (§27).
6. ★ **Trois questions à poser à Alexandre** : ses écartements commune par commune · le recours
   éventuel à un prestataire · **pourquoi Pliage, Palissage et Entreplantation sont absents de son
   barème** (75 h/ha, soit 1 350 h sur 18 ha, §30d).

### Backlog — technique, par ordre d'effort/effet

★★★ **AUDITÉ LIGNE PAR LIGNE LE 11/08 AU SOIR**, sur le dépôt cloné (commit `636630a`,
APP 5.96 · SW 6.46). **Chaque entrée porte sa preuve mesurée**, fichier et ligne, pas un souvenir.
**Six points rayés · cinq chiffres corrigés · trois qui avaient EMPIRÉ.**

⚠️⚠️ **La leçon de cet audit : un backlog non audité dérive DANS LES DEUX SENS.** Six entrées
décrivaient du travail déjà fait — le document faisait travailler dans le vide. Et trois chiffres
avaient grossi sans que personne le voie : **1 625 → 1 639 sites sous 12 px**, **~2 300 → 2 922
hex**, **~375 → 407 ko pour `cave.js`**. Un backlog écrit une fois est une photo ; **une entrée
non re-mesurée depuis une semaine est une hypothèse, pas un constat.** C'est la règle d'or n°1
appliquée au document lui-même.

★ **AJOUT DU 12/08 — les entrées 0a à 0d sortent du chantier ETP/année/contrats (§33).** Elles
sont neuves, donc **non auditées** : les traiter comme des hypothèses jusqu'à re-mesure.

0a. ✅ ~~**DÉPLOYER — APP 6.06 · SW 6.56**~~ — **RAYÉ LE 16/08, ET C'EST LE PLUS GROS DÉFAUT
   D'ENTRETIEN DE CE DOCUMENT À CE JOUR.** L'entrée est restée en tête de backlog, trois étoiles,
   pendant **dix-neuf versions APP et vingt-trois versions SW**. Le dépôt lu le 16/08 porte tout
   §37, §38, §40, §41, §42 et §43 par-dessus : le paquet décrit ici comme « jamais mis en ligne »
   a été déployé, puis recouvert six fois.
   ★★★ **La leçon est de méthode** : *une entrée « À DÉPLOYER » est la seule du backlog qui se
   périme toute seule.* Elle ne demande pas de travail, elle demande une lecture — et tant qu'on ne
   la relit pas, elle occupe la première place en criant sur un fait faux.
   → **Règle** : toute entrée « à déployer » se relit **en tête de session**, en comparant les
   numéros qu'elle cite à `APP_VERSION` et `CACHE_NAME`. Si elle cite plus bas, elle part.
   Détail en **§44a**.
   ⚠️ **Ce qui reste vrai et qu'il ne faut pas jeter avec** : `npm run build && firebase deploy` —
   ⚠️ **un seul `&&`** : `inject-precache` tourne déjà en postbuild, un second passage sort en 1
   et annule le déploiement. Tant que ce n'est pas fait, les clients lisent encore
   « manque 15,8 ETP » sur une vendange couverte, et **une augmentation de salaire continue de
   rechiffrer les exercices clos**.
   ⚠️⚠️ **`scripts/preflight-baseline.json` fait partie de la livraison du 12/08 nuit** : la
   baseline a été **regravée** sur une diminution réelle (un `catch{}` vide parti avec
   `_paieHistTxt`). Sans elle, le prochain preflight avertit sans raison — et un avertissement
   qu'on apprend à ignorer est un cliquet mort.
0a-bis. ✅ ~~**UNE LIGNE D'`utils.js` EN ATTENTE D'UNE DÉCISION DE DONNÉE**~~ — **FAITE, vérifié
   le 16/08.** `_mvEnContratSurPeriode` (désormais **utils.js l.2936**, plus l.2449) porte
   `if(!P.length) return true;`, précédé du commentaire de convention en dix lignes qui explique
   *pourquoi* le statut n'entre pas dans la réponse. Le blocage de donnée était levé dès le 14/08 —
   Nico a supprimé la fiche `Pilotage` (§39g). **L'entrée décrivait donc un travail fait depuis
   deux jours au moment de la consolidation du 15/08 : elle aurait dû partir avec §39.**
0a-ter. ★★★ **COMPTER LES ETP BUREAU — orientation produit, 14/08.** Nico :
   *« je veux compter aussi les ETP bureaux pour pouvoir budgéter au plus près de la réalité (on
   fera ça sur une prochaine mise à jour) »*. ⚠️ **Ce n'est pas un simple retrait du filtre** :
   `m.bureau` est lu à des endroits qui ne posent pas la même question.
   · **La capacité vignes** (`_headWeek`, courbe d'effectif, simulateur de renfort) doit **rester**
     hors bureau — c'est le sens même du champ, *« non compté dans la capacité de travail des
     vignes »*, et un administratif dans la courbe de taille ferait croire un pic couvert.
   · **Le budget** (masse salariale, coût employeur, ETP payés) doit **les inclure** — un salaire
     est un salaire. **Voir 0a-quater : c'est déjà censé être le cas, et ça ne l'est pas.**
   → Le travail réel est de **séparer les deux questions** : « qui travaille la vigne ? » et
   « qui coûte ? ». Aujourd'hui `_mvEnContratSurPeriode` répond aux deux avec le même filtre.
0a-quater. ★★★ **DÉFAUT MESURÉ LE 14/08 — la masse salariale perd tous les bureaux.**
   `_pexData` (pilotage.js l.6971) filtre avec `_mvEnContratSurPeriode`, dont **la toute première
   ligne** est `if(!m || m.bureau) return false;`. Or le commentaire posé trois lignes au-dessus
   dit : *« Le "bureau" N'EST PAS exclu : c'est un salaire, et on chiffre une masse salariale. »*
   ⚠️⚠️ **Le commentaire décrit l'intention, la ligne fait le contraire.** Sur le tenant de
   référence, Etienne et Chloé sont bureau : leurs salaires **ne figurent pas** dans le total de
   l'exercice. Correctif = un 4ᵉ argument `avecBureau` sur `_mvEnContratSurPeriode`, passé `true`
   **au seul appelant l.6971** — les trois autres (coût MO par parcelle l.5564, cadence l.6064,
   effectif présent planning.js l.881) posent bien la question « qui travaille la vigne ».
   **NON LIVRÉ** : ça change un chiffre d'argent, et Nico a explicitement mis le sujet bureau à la
   *prochaine mise à jour*. À faire au même lot que 0a-ter. Détail en **§39i**.
0b. ✅ **Le CDD de Victor est RESSAISI** (confirmé par Nico le 12/08 au soir).
   ⚠️ **Le même geste reste à faire pour Shana, Alicia et Vic** dès leur resignature (annoncée au
   17/08) : mettre les anciennes dates dans la fiche, enregistrer, puis remettre la nouvelle date de
   début → l'archivage se déclenche seul.
0c. ❌ **ENTRÉE ANNULÉE — c'était un mauvais conseil.** Elle demandait de régler l'ouverture
   d'exercice au 1ᵉʳ octobre « pour que la vendange clôture l'année ». ⚠️⚠️ **Un exercice comptable
   est fixé par le comptable, parfois par le statut : ce n'est pas un réglage d'affichage.**
   La vraie correction est livrée au **lot 6 du §34** : l'écran montre désormais les **deux cadres**
   (exercice comptable / année vigne), dit **pourquoi leurs totaux diffèrent**, et se contente de
   chiffrer — **en jours exacts** — le partage de la vendange quand la clôture la traverse.
   Le décalage reste **proposé**, jamais prescrit. **Ne pas rouvrir cette entrée.**
0c-bis. ★★ **Les filtres cépage / commune du Pilotage** — démontrés dans la maquette v3, **non
   livrés volontairement** (§34i). Ils exigent que le calcul de charge descende à la parcelle.
   ⚠️ **Un filtre qui change la liste sans changer les chiffres est un décor.** Les données existent
   déjà : `p.cepages[]` et `p.commune`. Aucune saisie neuve à demander au client.
0c-ter. ✅ ~~**Déplacer `_PIL_SEM` dans `utils.js`**~~ — **FAIT, vérifié le 16/08.**
   `utils.js:1968` la définit, `utils.js:2345` l'expose, `pilotage.js:15` l'importe, et
   `pilotage.js:9650` porte le commentaire *« n'est plus exposé ici »*.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-frise` cherche encore la palette dans
   `pilotage.js` — **il rougit sur trois assertions à cause de ce déplacement réussi** (§44c).

0d. ★★ **Le pont coût annuel ↔ campagnes** — le gros morceau ouvert par Nico le 12/08, détaillé en
   fin de §33. Coût annuel **par date**, part d'une campagne **par tâche**, et le **reste**
   (vinification, entretien, temps mort) qui n'est lisible **qu'avec un taux de saisie**.
   ⚠️ Le journal ne stocke **pas d'heures** : le croisement passe par les heures payées du jour.
0e. ~~**Deux compteurs de 1607 h**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   `_planAnnuCard` pose une carte compacte par **contrat soldé dans l'année civile**, au-dessus du
   compteur courant : dates, heures faites, plafond proratisé. Borné par `_planSurContrat(ctr,…)`,
   qui contraint `_planInContractCtr` aux dates du contrat passé. **Affichage seul, aucun calcul
   touché** (§19, §33).
0f. ★ **Resserrer la fin de la période *Vendanges*** — elle court au 30/09 alors que le travail
   s'arrête le 06/09. Le pic n'est plus faussé, mais la moyenne « sur la période » reste diluée
   sur trois semaines vides.
0g. ★★★ **`taux_serie` est clé par NOM** — ouvert par §36, **volontairement non fermé**. Renommer un
   salarié dans sa fiche **détache son historique de salaire**. C'est la faiblesse de tout le modèle
   (`MEMBRES`, `PLANNING_ENTRIES`, `taux`, `_mvPoidsNom` — tous clés par nom), mais **ici elle
   chiffre des euros dans un exercice comptable**. ⚠️ **Ne pas bricoler un rattrapage local dans
   `paie`** : ça donnerait un identifiant stable à un seul endroit et une fausse impression de
   sécurité partout ailleurs. Le vrai lot est *un identifiant de fiche membre*, et il touche bien
   plus que la paie. **Chantier à part entière, à chiffrer avant d'être promis.**
0h. ★★ **`scripts/lint-cliquet.mjs` PLANTE** en `MODULE_NOT_FOUND` (constaté le 12/08 au soir en
   l'exécutant, pas en le supposant). **Préexistant**, mais ⚠️ *un linter qui ne démarre pas ne
   protège rien* — et il fait partie des paliers de test (§6b), donc son silence se lit comme un
   succès. Le réparer ou le retirer des paliers : les deux valent mieux que le laisser mort.

1. ★★★ **INSTALLATION À BLANC de bout en bout sur un slug JETABLE — LE SEUL CRITIQUE OUVERT.**
   Elle valide les cinq lots d'un coup et **mesure les temps réels** (tableau prévu dans
   `INSTALLER-UN-DOMAINE.md`). Les lots sont déployés ; **le « 20 h → ~9 h » n'a jamais été vérifié.**
   ⚠️ **Un essai consomme un identifiant** : `onboardTenant` refuse un domaine déjà peuplé. Prendre
   un nom jetable, **jamais `chateau-garraud`**.
2. ✅ ~~**Vérifier si un `rewrite` existe en ligne**~~ — **RAYÉ, vérifié le 16/08.** Les **deux**
   sont dans `firebase.json` : `/api/lead` (l.19) et `/api/mise-en-route` (l.26), sous la clé
   `rewrites` ouverte l.17. Le ZÉRO du 11/08 était juste **à cette date** ; ils ont été ajoutés
   depuis, sans que l'entrée soit relue. ★ `harnais-claude-md` le vérifie déjà à chaque passage.
3. ~~**Fusionner les deux écrans de congés**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   `openPlanCP(fromSel)` est le point d'entrée unique ; `openPlanCPSel` est supprimée, son
   exposition `window` retirée, le bouton de la barre de sélection appelle `openPlanCP(true)`.
   La 5ᵉ feuille est ramenée à 4 (§19a).
4. ✅ ~~**Corriger `_findDebutTache`**~~ — **RAYÉ, vérifié le 16/08.** La fonction est passée en
   `app.js:3572` et **porte désormais ses bornes** : elle résout la période par `_saisonForDate`,
   retombe sur `_mvCampagneDe`, et en dernier recours sur le jour même. Le `reduce` ne s'applique
   plus qu'à `ok`, filtré par `dans(j.date)`. ⚠️ **L'entrée citait `app.js:3116` — un numéro de
   ligne de backlog vieillit encore plus vite qu'un chiffre** (§44b).
5. ✅ ~~**Breakpoint 760 → 767.98**~~ — **RAYÉ, vérifié le 16/08.** `styles.css` porte
   `@media(max-width:767.98px)` ; le trou 761–767 est bouché. La seule occurrence restante de `760`
   est `@media(min-width:768px){ .mvr-body{max-width:760px} }` — **une largeur de corps, pas un
   point de rupture** : ne pas la « corriger », elle est juste. ★ L'entrée attendait un go qui
   n'était plus nécessaire.
6. ★ **Découper `demarrage.html`** sur le modèle du guide — **938 lignes, monolithique** (§27d).
   ✅ La section **Données** est faite : `guide/13-donnees.html` existe (7,5 ko).
7. ~~**Escalier de sources pour la cadence**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67), §41.
   `_pecCadHisto()` remplit la marche 2 : sous le seuil d'avancement, l'écran reprend la **même
   période de la campagne précédente**. `hBar` vient du snapshot (`stats.hFaites`), `hReel` se
   **recalcule** sur `PLANNING_ENTRIES` — clé par année, jamais purgé. **Quatre points d'affichage
   annoncent la source.** Harnais : 28 assertions, 5 contre-épreuves.
8. ✅ ~~**Purger le calcul de pic mort dans `_rfCtx`**~~ — **FAIT, vérifié le 16/08.**
   `pilotage.js:3193` porte le commentaire de purge : *« `pic` était calculé ici et renvoyé dans le
   contexte […] après vérification (`grep '.pic'` = 0 consommateur) »*. ⚠️ **Ne pas confondre avec
   les `pic` VIVANTS** : `_rfWeeks` (l.1387) et `_pilAnnuCtx` (l.8764) en renvoient un, consommé
   l.1841 et l.4427 — ceux-là sont utiles.
   ⚠️ **Effet de bord jamais consigné** : `mv-harnais-portee` exige encore *« le pic est calculé »*
   et **rougit sur quatre assertions à cause de cette purge réussie** (§44c).
9. ~~**Pondérer `_ecoRate` par les heures**~~ — ✅ **FAIT le 14/08** (APP 6.14 · SW 6.67).
   Moyenne pondérée par les heures annuelles du gabarit (`window._planGetRefH` sur 12 mois).
   ★ **Repli sur `h=1` si le planning n'est pas chargé** — résultat identique à l'ancien, donc
   aucune régression possible sur un domaine sans données de planning.
10. ★ **Chip de cuvée `Village 2026· 12`, sans espace avant le point médian.** ⚠️ **Non retrouvé au
    grep le 11/08** — soit corrigé entre-temps, soit le motif de recherche est mauvais.
    **Varier le motif avant de conclure** (règle vécue avec `mvprint.py` et DOCK).
11. ★★ **Import KML en MERGE** sur un domaine vivant — `_parseKML` est en `admin-gt.js:2298`,
    **aucun mode merge**. Avec les **coordonnées écrites dans les parcelles** et **la densité comme
    propriété de la parcelle**. ⚠️ Préserver `p.commune`, `p.plantation_trous`, `p.entreplantation`,
    `p.tachesAll`, `p.rendement_hist`, `p.rdt_max`.
12. ★★ **Le rattachement des anciens fûts à une référence** — maquetté et validé, **non intégré** :
    0 trace dans `reserve.js`.
13. ❌ **ENTRÉE PÉRIMÉE, RÉÉCRITE LE 16/08.** Elle disait « un 14ᵉ moment », après avoir corrigé
    « 15ᵉ » en « 13 ». **La visite en compte DIX-NEUF** depuis §43 (`harnais-demo` : *« 19 moments »*).
    ★★ **Trois chiffres successifs dans la même entrée, tous faux au moment où on la lit** : c'est le
    symptôme, pas l'exception. Ce qui reste vrai : **la cave n'a toujours pas son moment**, et c'est
    le plus vendeur du parcours. **Renuméroter n'est pas le travail — l'ajouter l'est.**
14. ★ **Le Cuvier n'enregistre pas d'intervenant** là où le Chai le fait — **`cave.js:6290` le dit
    à l'écran** (« la colonne reste vide pour celles-ci »). Le défaut est assumé, pas corrigé.
15. ✅ ~~**`.cave-tabs`**~~ — **RAYÉ ENTIÈREMENT, vérifié le 16/08.** Les deux barres mortes sont
    purgées (`index.html:1745` porte le commentaire) **et la règle CSS orpheline est partie aussi** :
    `grep cave-tabs styles.css` = **0**. L'entrée ne gardait qu'un reliquat déjà traité.
16. **`_pl2Annual` (`planning.js:1669`) vs `_planGetRefH` (`l.349`)** — 1 ligne, mais **décision de
    conception d'abord**.
17. **Terminologie heures sup** : « Solde cumulé » (`planning.js:2319`) vs « Reste à prendre »
    (`l.4322`) — **les deux libellés coexistent, vérifié**.
17b. ★ **Le nom d'un salarié, dans la grille, coche sa ligne** et n'ouvre plus sa fiche (§19a).
    Décision assumée — une cible, un effet — mais **à confirmer à l'usage** : c'est le seul point de
    dépaysement de la refonte, et il est réversible en une ligne.
18. **Batch a11y** · résorption des `catch{}` vides — ⚠️ **RE-MESURÉ LE 16/08 : 193, pas 200.**
    **135 sont dans `app.js` à eux seuls** (puis `pilotage.js` 15, `onboarding.js` et
    `tracteur.js` 4, `cave.js` 3). ★ **C'est la seule ligne du backlog qui a BAISSÉ deux audits de
    suite** — 234 → 200 → 193. Le cliquet C14 travaille.
    **La baisse est réelle** (C14 fait son travail) : le cliquet interdit d'en ajouter, il ne purge
    pas l'existant. **Un lot ciblé `app.js` réglerait les trois quarts du sujet.**
19. **Rôle `pilotage` (`pil:true`)** — **0 occurrence, vérifié.** 2 arbitrages préalables.
    Corriger aussi `getLoginRoster` (`functions/claims.js:1360`, renvoie toujours `roles`).
20. **Injection de données pures dans les guides.**
21. **Lot B pluie** — ⚠️ **à re-qualifier : la collecte horaire EXISTE DÉJÀ.** `app.js:3061` remplit
    `window.METEO_HOURLY` avec `precipitation` heure par heure et le met en cache
    (`mavigne_meteohr_cache`). **Ce qui manque n'est pas la donnée, c'est son exploitation.**
    L'historique reste irrécupérable rétroactivement.
22. **DRY surface** — ⚠️ **21 sommes à la main au 16/08** (22 au 11/08, 32 à l'origine).
23. ✅ ~~**UI d'activation d'essai client**~~ — **RAYÉ, vérifié le 16/08.** L'écran existe :
    `admin-gt.js:1299` lit `agt-trial-input`, borne la valeur à `[0, 90]` (l.1301) et l'écrit dans
    `clients[slug]` (l.1310) ; la pastille de récap l'affiche l.2886. **Posé par le chantier §40
    sans que l'entrée soit relue.**
24. ✅ ~~**Fusion de fûts à l'ÉDITION**~~ — **FAIT, vérifié le 16/08.** `_futSameLot(x, four, ref,
    annee)` compare fournisseur + référence + millésime en tolérant casse et espaces ; `_rsvSaveFut`
    cherche le doublon et fait `dup.qte = (parseInt(dup.qte)||0) + qte` au lieu de pousser une
    seconde carte. ⚠️ **Le commentaire que l'entrée citait est TOUJOURS LÀ** — il décrit désormais
    l'intention du code au-dessous, plus un manque. ★★ **Piège de méthode** : *un commentaire qui
    décrit un défaut ne disparaît pas quand le défaut est corrigé.* Ne jamais conclure à l'absence
    en lisant un commentaire ; lire la fonction (règle vécue avec `mvprint.py` et DOCK).
25. ✅ ~~**Ancien catalogue « Mes produits »**~~ — **RAYÉ. 0 occurrence dans tout `src/`.**
    Le backlog annonçait « 5 fichiers à arbitrer » : il n'y a plus rien à arbitrer.
26. ★ **Vérifier les autres tâches `anytime:true`** — **cinq, vérifiées** : Entreplantation,
    Arrachage, Désherbage manuel, Effeuillage, Vendange (`app.js:371`, `1020`, `1023-1026`).
27. ★ **Variantes girondines** — le barème régional **existe** et `app.js:1062` nomme déjà le Médoc,
    le guyot double et les vignes de plus de 20 ans. **Reste la vérification documentaire :
    qu'aucun avenant postérieur à 2021 n'a révisé ces temps** (§30a).
28. ★ **Type de contrat « tâcheron »** (§30f) — **0 occurrence, vérifié.** À prévoir, pas urgent.
29. **Tokeniser les hex des JS** — ⚠️⚠️ **RE-MESURÉ LE 16/08 : 3 319.** ~2 300 → 2 922 → **3 319**,
    soit **+14 % en cinq jours** et +44 % depuis l'origine. **Il grossit à chaque lot** : le classer
    bas ne le fait pas rétrécir, ça ne fait que rendre le lot plus cher quand il arrivera.
30. **Mise à jour SW choisie — niveau 1** (§8). Le socle est là : `updatefound` (`app.js:9083`)
    et `SKIP_WAITING` (`sw.js:1047`).
31. **Lot 8 différé** (Google Play TWA) — jusqu'à **5+ clients actifs**.
32. **Une passe Lighthouse sur `staging`.**
33. ★ **Thème saisonnier** — étude faite, maquette 4 saisons à produire, **décision de Nico** (§21d).
34. ⚠️⚠️ **Surveiller la taille des gros modules** — **RE-MESURÉ LE 16/08, et ce n'est plus
    `cave.js` le sujet** :

    | Fichier | 11/08 | 16/08 | |
    |---|---|---|---|
    | `pilotage.js` | 461 ko | **657 ko** | **+42 % en cinq jours** |
    | `app.js` | 633 ko | 667 ko | +5 % |
    | `cave.js` | 407 ko | 456 ko | +12 % |

    ★★★ **`pilotage.js` a pris 196 ko** — c'est §42 (dix lots d'ergonomie) qui les a posés, et
    personne ne l'a vu passer. **Il est désormais le deuxième fichier de l'app.**
    ⚠️ **La surveillance sans seuil ne surveille rien** : trois audits de suite ont écrit « à
    surveiller » et le chiffre a monté trois fois. → **Poser un plafond dans le preflight** (700 ko ?)
    ou **retirer l'entrée** — les deux valent mieux qu'une veille qui ne déclenche jamais.
35. ✅ ~~**Committer ce document dans le dépôt**~~ — **FAIT.** `CLAUDE.md` est à la racine et se lit
    par `git clone`. C'est ce qui rend cet audit possible sans upload.
36. ★★★ **L'ÉCHELLE TYPOGRAPHIQUE — le plus gros effet client du backlog** (audit du 11/08,
    re-mesuré le 16/08).
    ⚠️ **1 593 sites sous 12 px** (153 dans `index.html` + 419 dans `styles.css` + **1 021 dans les
    JS**) et ⚠️⚠️ **295 sites sous 10 px**. Suite complète : 1 625 → 1 639 → **1 593** sous 12 px,
    mais 257 → 277 → **295** sous 10 px.
    ★★★ **Lire les deux ensemble** : le total baisse pendant que **le plancher s'enfonce**. §42 a
    unifié la typographie du Pilotage sur `--pt-*` — ce qui explique la baisse — mais l'échelle
    posée dans `styles.css` **descend elle-même à `--pt-nano:9.5px` et `--pt-lbl:10.5px`**. La
    variable a rendu le 9,5 px *légitime et réutilisable*. **On a industrialisé le trop petit.**
    → **Le lot A n'est plus un remplacement de valeurs en dur : c'est un relèvement de l'échelle
    elle-même**, `--pt-nano` et `--pt-lbl` en tête. Deux lignes touchent alors 1 021 sites JS.
    ★★ **La vraie surprise est la répartition** : les deux tiers sont **dans les JS**, en HTML
    généré — un lot qui ne toucherait que `styles.css` ne réglerait qu'un quart du problème.
    **Lot A : le plancher.** Les 277 sites sous 10 px remontés à 11 px minimum.
    ⚠️ **Pas une substitution aveugle** : certains 9 px sont des exposants ou des unités collées à
    un chiffre. **Maquette sur trois écrans d'abord** — accueil ouvrier, session tracteur, registre
    phyto — puis intégration au tableau motif → compte attendu.
    **Lot B : le réglage « Taille du texte ».** Les sites de 10 à 11,5 px convertis en variables
    CSS pilotées par un attribut `data-fs` sur `#app-root`, **jumeau exact de `data-hicontrast`**.
    Trois crans : Normal · Grand · Très grand, dans Réglages › Application, sous « Plein soleil ».
    ⚠️ **Ne PAS passer par un `zoom` CSS global** (qui serait une ligne) : il agrandirait aussi la
    carte Leaflet, les overlays `position:fixed` et la largeur du corps bornée à 430 px — le risque
    porterait sur l'écran le plus utilisé.
37. ★★ **`mvDate()` et `mvNum()` dans `utils.js`** — **0 occurrence, vérifié.**
    `mvDate(iso, forme)` : `'jma'` dans les documents et registres (traçabilité), `'court'` dans les
    listes denses, `'long'` dans les titres, **jamais `'court'` là où l'année est ambiguë** (défaut
    actuel de `_vendFrDate`). `mvNum(v, unité)` : décimales imposées par l'unité.
    **Décision de forme AVANT le code.** Supprimer les 2 paires de doublons littéraux.
38. ★ **Purger le bloc de ré-export de `app.js`** — **314 `window.X` comptés**, du
    `window._mvKeyLoaded` de la ligne 51 au `window.exportSaisonPDF` de la ligne 10536.
    111 lignes inutiles + 5 noms morts. **Unifier `phyto.js` sur la même forme et supprimer sa
    boucle `for..in` (`phyto.js:1165`)**, invisible au preflight. Regraver la baseline **après**
    avoir prouvé la baisse.
39. ★ **`.val-toggle` 26 → 44 px de haut** — **vérifié `styles.css:283` : toujours 26 px** (pour
    44 de large). C'est l'interrupteur qu'un ouvrier bascule par équipier, avec des gants.
    **`.fiche-admin-btn` est à 32 px** (`l.483`) ; vérifier aussi `.pc-start` et `.plan-mo-btn`.
40. ★★ **Valeurs par défaut de modules PAR RÔLE à la création d'un membre** : un ouvrier arrive avec
    Cave / Réserve / Planning décochées, un tractoriste avec Vigne / Tracteur / Phyto. **Vérifié :
    `_canModule` (`app.js:3860`, socle en `admin-gt.js:2664`) = formule ∧ masquage manuel, le rôle
    n'entre nulle part.**
    ⚠️ **Gain direct sur Garraud : 12 personnes × 7 arbitrages.** À faire **avant** l'installation.
41. ✅ ~~**44 occurrences de `var(--texte-doux,#8B8175)`**~~ — **RAYÉ, vérifié le 16/08 :
    0 occurrence** dans `src/*.js`, `styles.css` et `index.html`. Le repli fautif à 3,66:1 a
    disparu — **par quel lot, on ne sait pas** : aucun `WHATS_NEW` ne le mentionne. ★ **C'est le
    bon cas de figure quand même** : un défaut parti sans trace vaut mieux qu'un défaut tracé qui
    reste, mais ça rappelle qu'un audit ne se remplace pas par un changelog.
42. ⚠️⚠️ **Points de rupture responsive — QUATORZE, pas neuf** (re-compté le 16/08, `@media` de
    `styles.css` **ET** des JS) : **360, 400, 430, 520, 560, 600, 640, 700, 767.98, 768, 880, 900,
    980, 1200.** Le `760` est devenu `767.98` (entrée 5, ✅).
    ★★★ **Voilà pourquoi les audits précédents disaient neuf** : ils comptaient `styles.css`.
    **Cinq points de rupture — 360, 430, 520, 700, 880 — vivent dans du CSS injecté depuis le JS**,
    posés par §42 et invisibles à tout `grep` sur la feuille de style.
    ⚠️ **C'est le vrai sujet, et il est plus gros que l'entrée ne le disait** : la moitié des règles
    responsive a quitté la feuille de style. Les ramener à trois suppose d'abord de savoir où elles
    sont — et **le preflight ne le sait pas non plus**. **Après** le lot typographique, pas avant.


### ✅ Rayés du backlog

~~Urssaf~~ · ~~facturer Chapelle~~ · ~~clé `"site"`~~ · ~~UX-1~~ · ~~SEC-3 CSP~~ · ~~e2e 10 pages~~
· ~~`firestore.indexes.json`~~ · ~~niveaux `'Auto'`~~ · ~~plomberie des tâches~~ · ~~badge~~ ·
~~densité~~ · ~~barèmes régionaux~~ · ~~lot DOCK~~ · ~~lot 2 des heures prévues~~ · ~~CSS mort
Réserve~~ · ~~gardes mortes~~ · ~~recâbler Plein soleil~~ · ~~grille d'installation~~ ·
~~reconstruire `mvprint.py`~~ · ~~le fût comme objet~~ · ~~l'entonnage depuis le parc~~ ·
~~le registre des manipulations~~ · ~~le bilan de campagne~~ · ~~stock de bouteilles~~ (ABANDONNÉ) ·
~~regraver `preflight-baseline.json`~~ · ~~refonte de l'onglet Cave du Pilotage~~ ·
~~série MILLÉSIME~~ · ~~projection de fin de malo~~ · ~~CAD-1 / durée réelle~~ (**FERMÉ PAR LA
MESURE**) · ~~écart de cadence faux d'un facteur 5~~ · ~~MT-A écartements sur l'accueil admin~~ ·
~~« guide.html dit Côte de Nuits »~~ · ~~aide contextuelle périmée~~ · ~~guide public
monolithique~~ · ★ ~~**CF `submitMiseEnRoute`**~~ · ★ ~~**création de comptes en lot**~~ ·
★ ~~**alignement des noms de parcelles à l'installation**~~ · ★ ~~**accès manuel au code (upload à
chaque session)**~~ — remplacé par le dépôt GitHub le 10/08.

### Backlog juridique & contenu public

- Durées de conservation · sous-traitants à publier (Google Ireland + SMTP) · relecture juriste.
- **Relecture trimestrielle des pages publiques** :
  `grep -i "compléter\|à valider\|à arbitrer\|en cours de\|\[.*\]"` sur `public/*.html` **et
  `guide/*.html`**.
  ★★ **Étendre ce contrôle aux ÉCRANS DE L'APP** : l'onglet Cave du Pilotage a affiché « module à
  venir » à un client payant pendant des semaines.
  **Grepper aussi `à venir|à structurer|à construire|chantier prévu` dans `src/*.js`.**
  ★ Contrôle fait le 09/08 : les occurrences restantes sont toutes **légitimes**.
- Les deux gabarits restants de `dpa.html`.
- ★ **Écrire dans le guide et les CGU que Ma Vigne produit un RELEVÉ D'HEURES, pas un bulletin de
  paie.** ★ **C'est déjà dit dans la fiche d'aide Planning** — reste à le porter dans les documents
  contractuels.
- ★★ **La même borne pour les documents de cave** : le registre des manipulations et le bilan de
  campagne sont des **états internes**. C'est écrit **dans les documents eux-mêmes**.

---

## 29. Synchronisation de la mémoire

- **À la fin de chaque session de livraison** : mettre à jour **ce document** et la **mémoire Claude**.
- ⚠️ La mémoire est **plafonnée à 30 entrées** : avant d'ajouter, **fusionner/compresser** —
  ★ à 30/30, `add` **échoue en silence** : toujours **`replace`**.
  ★ **Vécu deux fois le 09/08** : pour faire de la place à une entrée « accompagnement du client »,
  j'ai **fusionné** les deux entrées « modules ES » ; et pour la série installation, j'ai **fusionné
  le chantier dans l'entrée Admin GT** plutôt que d'écraser une entrée sans rapport.
  **Fusionner deux entrées voisines vaut mieux que raccourcir une entrée utile.**
  ★★ **Vécu le 10/08** : la mémoire était encore à 30/30 pour la migration GitHub — l'entrée
  « BUILD/DÉPLOIEMENT/VERSIONNAGE + PROCESS DE LIVRAISON + PATCH SÛR » a été **remplacée** (pas
  fusionnée) puisque c'est exactement elle qui portait l'ancien process d'upload à mettre à jour.
- ★★★ **Vérifier la FRAÎCHEUR du document avant de le régénérer** (10/08) : comparer sa ligne
  « Dernière consolidation » aux dates de la mémoire, et **exiger l'upload au moindre doute**
  (procédure complète en règle d'or n°1). **Un document régénéré en retard est pire que pas de
  document : il porte des affirmations périmées avec l'autorité du porteur de vérité.**
  ★ **Corollaire** : la mémoire peut contenir un chantier que la régénération oublie. **La lire
  entrée par entrée, en cherchant les chantiers, pas seulement les règles.**
- ★ **Après une session d'audit, mettre à jour le document AVANT tout autre travail.**
- ★ **Quand plusieurs consolidations se suivent le même jour, chacune doit RE-VÉRIFIER les constats
  d'état de la précédente.**
- ★★ **Une session longue à plusieurs lots enchaînés est le pire cas pour la mémoire.**
  ★★★ **Les journées du 07/08 et du 09/08 en sont les exemples extrêmes.** Sans ce document, il ne
  resterait rien de la distinction entre `_mvFut*` (utils.js), `_ml*`/`_rm*`/`_bc*`/`_cop*` (cave.js),
  `_pcav*` (pilotage.js), `_dmr*` (app.js), `_mvAide*` (utils.js) et ★ `_agtIns*`/`_agtLot*`
  (admin-gt.js), ni des raisons de chaque choix, ni surtout de **pourquoi la projection par
  historique a été écrite puis détruite**, de **pourquoi le générateur du guide n'est pas dans le
  build**, et de **pourquoi la convention d'adresse ne se déduit pas du slug**.
- ★★★ **10 août (soir) — MIGRATION GITHUB, le changement le plus structurel depuis le début du
  projet.** Le code vit désormais dans un dépôt (`4ss4ss1/mavigne-dev`, public), cloné par Claude en
  tête de session. **Ça ne supprime pas le besoin de ce document** — le dépôt donne le CODE, pas les
  ARBITRAGES, les LEÇONS ni le BACKLOG, qui n'existent nulle part ailleurs que dans ces pages.
  ★ **Piste ouverte, pas encore faite** : committer ce document lui-même dans le dépôt (en
  `CLAUDE.md` à la racine, convention reconnue par les outils Claude) pour qu'il soit, lui aussi,
  lisible sans upload à chaque session. Tant que ce n'est pas fait, la procédure de régénération
  de la Règle d'or n°1 reste pleinement en vigueur pour CE document précis.
- Rappel des trois règles d'or : **lire depuis le dépôt pour le code, partir des uploads pour le
  reste** · **lire les versions, jamais les supposer** · **vérifier, ne pas croire — dans les deux
  sens, y compris sur du code écrit la semaine dernière, sur ce qui est en ligne depuis des mois,
  sur l'outillage lui-même, sur les changelogs, sur les lots qu'on croit avoir livrés, sur les
  constats d'absence, sur les fonctionnalités qu'on croit devoir ajouter alors qu'elles existent
  déjà, sur les SIGNATURES des fonctions, sur CE QUE L'APPLICATION RACONTE D'ELLE-MÊME, et ★★★ sur
  LA NOTE DE MISSION ELLE-MÊME.**

---

## 30. ★★ MULTI-TERROIR — rendre le barème vrai ailleurs qu'en Côte de Nuits

**État : le socle est LIVRÉ, et son premier client d'essai est arrivé le jour même**
(Château Garraud, Lalande-de-Pomerol). Cette section décrit ce qui existe, ce qui reste, et surtout
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
`saisons`/`anytime`/`conv`. Ouvrir « Pioche » chez Chapelle et enregistrer **sans rien changer** la
faisait passer d'Automne à Printemps, en silence.
★★ **C'est la même famille que le bug du formulaire d'analyse du 07/08 et que la config de
l'assistant d'installation du 09/08** : *une fonction qui reconstruit un objet de zéro perd tout ce
qu'elle ne réécrit pas.* **Le piège s'est présenté quatre fois en trois semaines, dans quatre écrans
différents.**

★ **C'était le prérequis de tout le reste.**

**Audit sur les documents réels** (`fbAdminRead(slug,'taches')` en fenêtre privée donne le doc
**brut** ; `window.TACHES` est déjà normalisé et ne montre rien) :

- **`hha` explicite sur toutes les entrées** sauf Entreplantation. **Aucun repli ne se déclenche.**
- **Marchand-Grillot** : 11 tâches, **565 h/ha = exactement le catalogue**.
- **Chapelle** : 9 tâches, **495 h/ha**. **Pliage, Palissage et Entreplantation absents** — 75 h/ha,
  soit **1 350 heures non budgétées sur 18 ha**. Vendange à **180 h/ha**. **À vérifier avec
  Alexandre.**
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
catalogue change**, contrairement à MG et Chapelle.

★ **Le seed porte aussi les ACTIVITÉS du tracteur**, toutes rattachées à `tracteurDefautId:'trac1'` —
c'est pourquoi la première machine collée à l'installation **doit garder cet identifiant** (§18b).

### 30f. ⚠️⚠️ Le biais 1/N — et pourquoi l'axe « durée réelle » est FERMÉ

**L'app ne mesure pas le temps passé sur une parcelle.**
★ **Ce n'est pas un défaut à corriger — c'est ce qui rend juste la position de Nico** (§30i) : un
barème qu'on ne peut pas vérifier au chronomètre ne peut être qu'une **convention**.

La règle 1/N suppose **qu'une parcelle se fait dans la journée**. Le biais croît avec la taille des
parcelles : faible chez MG (0,26 ha en moyenne), faux en permanence sur des blocs girondins de 2 à
3 ha — ★ **Garraud est exactement ce profil.**

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

### 30k. Ce que ça change pour Marchand-Grillot et Chapelle

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

★ La grille d'installation étant tranchée, le devis Garraud est **écrivable dès le retour de son
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

**Château Garraud est passé par le repli mailto** — ce qui explique sa fiche sans affichage.

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
| **A** hosting | `firebase.json` · `essai.html` · `mise-en-route.html` | `/api/lead` · repli presse-papier · RGPD au point de collecte · effectifs de Garraud retirés |
| **B** functions | `leads.js` | accusé de mise en route au client, **une seule fois** |
| **C** panneau GT | `admin-gt.js` | essai à la remise · fiche honnête · pièces jointes suivies |
| **D** functions | `claims.js` | `gtRenewTrial` + `trialWatch` — l'essai borné |
| **E** câblage | `firebase.js` · `admin-gt.js` | le bouton qui rend `gtRenewTrial` exécutable |
| **F** client | `app.js` · `index.html` · `sw.js` | le bandeau dit ce qui vient après |

### CE QUE CHAQUE LOT A APPRIS

**A — `mise-en-route.html` parlait de Garraud à tout le monde.** « vos 12 permanents », « vos
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
**complet** dès qu'on touche une tuile, un onglet de graphe ou une case. MG et Chapelle avaient donc,
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

- ⚠️⚠️ **`_pl2Cell` : un retard d'une heure et une absence d'une journée s'affichent pareil.**
  `if(e&&e.absent) return {txt:'✕', cls:'pl2c-abs'}` tombe avant toute lecture de `motif_h`.
  **C'est le défaut le plus visible côté client de toute cette liste**, et il touche MG et Chapelle
  tous les jours. → **n°1 fonctionnel.**
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
