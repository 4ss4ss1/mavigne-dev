# Ma Vigne — audit « un niveau au-dessus » (25 octobre 2026)

Base lue : dépôt `4ss4ss1/mavigne-dev`, commit `b19f1f3` (« gabarit2 », 25/10), **APP 10.12**.
Tout ce qui est dit « fait » ou « absent » ci-dessous a été vérifié par `grep` dans `src/` — pas dans la doc.
Ce document est hors dépôt, comme les maquettes. Il accompagne `maquette-niveau-au-dessus-v1.html`.

---

## 1. La méthode suivie

1. **Benchmark** : ce que proposent les références du marché français (Isagri, Process2Wine, Smag agreo, MesParcelles, Vitirev), les outils d'aide à la décision reconnus (DeciTrait de l'IFV, stations Sencrop et Weenat), la recherche sur la phénologie, et le réglementaire 2026-2027. Sources en fin de document, avec leur date.
2. **Tour de l'appli réelle** face à cette grille : fait / partiel / manquant, fonction par fonction, dans le code.
3. **Classement des écarts** par impact terrain × effort.
4. **Maquettes** des cinq écarts les plus forts, téléphone et ordinateur.
5. Ensuite : des lots, un par un, maquette → validation → intégration.

---

## 2. Ce que font les références (et ce qu'attendent les chefs de culture)

### Les logiciels du marché
- **Process2Wine** (formule Start Vigne, 50 € HT/mois) : parcellaire, cartographie, **annotations parcellaires géolocalisées**, interventions manuelles et mécaniques, base phyto, tracteurs et outils, salariés, temps passés. Côté chai : apports, cuverie, opérations, intrants, analyses. Ses utilisateurs saluent l'interface mobile ; ses critiques : des morceaux pas toujours synchronisés quand on creuse.
- **Smag agreo Vigne** : **saisie d'observations** (météo, état sanitaire, dégustation), **détection automatique des parcelles travaillées** (GPS), contrôles réglementaires, prévisionnel d'interventions et suivi d'avancement, analyse des temps et coûts de revient, diagnostic HVE.
- **Isagri (Isavigne)** : le leader en France, fort sur le réglementaire et les douanes, maillage de support régional.
- **MesParcelles** (Chambres) : registre phyto, **calcul automatique de l'IFT**, cahiers des charges HVE / Terra Vitis.
- Le marché résume les attentes en quatre piliers : parcellaire technique, cave, conformité, commerce. Et deux tests pratiques pour l'ergonomie : **une saisie de traitement en 5 clics maximum**, utilisable avec des gants et en plein soleil ; et l'**interopérabilité** (station météo, export vers le comptable). Un conseil revient partout : la donnée ne vaut rien sans l'analyse — l'outil doit dire *pourquoi*.

### Les outils d'aide à la décision
- **DeciTrait (IFV, 2020)** : propose un calendrier de traitement et surtout dit **si la vigne est encore protégée**, selon le type de produit, la météo, le **stade phénologique** et l'état sanitaire. Les viticulteurs qui l'ont testé en retiennent d'abord la **visibilité sur les cadences**.
- **Stations Sencrop / Weenat** : fenêtres de pulvérisation à J+3 heure par heure (pluie, température, hygrométrie, vent), alerte lessivage sur l'humectation réelle, capteur de gel (température humide), vent au-dessus de 19 km/h interdit. Weenat propose aussi quatre seuils de confort hydrique selon sol, cépage et stade.

### La phénologie
Le suivi précis des stades (débourrement, floraison, véraison) à l'échelle d'un domaine sert à connaître la **précocité relative des parcelles**, caractériser le millésime et **positionner les opérations** (van Leeuwen, Bordeaux Sciences Agro). Des modèles à sommes de températures prédisent les 26 stades BBCH de la vigne (Molitor 2014) ou floraison et véraison par cépage (modèle GFV, Parker 2011).

### Le réglementaire qui tombe en 2027
- **Arrêté du 24/12/2025** (JO du 31/12) : contenu du registre phyto = annexe I ; format **électronique lisible par machine** obligatoire pour les traitements **à partir du 1ᵉʳ janvier 2027**, annexe II (SIRET 14 chiffres, AMM 7 chiffres, date JJ/MM/AAAA, dose + unité, localisation RPG ou GPS WGS84, surface traitée, culture en code OEPP, stade BBCH 2 chiffres, bio oui/non, horaires si l'AMM l'exige, rentrée anticipée). Conversion avant le 31 janvier de l'année suivante (30 jours dès 2030). Un contrôleur peut l'exiger sous **10 jours ouvrables**.
- **Arrêté abeilles du 20/11/2021** : la vigne est une culture attractive. Pendant la floraison, tout traitement se fait **dans les 2 h avant le coucher du soleil et les 3 h après** (éphéméride du lieu), sauf dérogations.

---

## 3. La grille : fait / partiel / manquant (vérifié dans le code)

| Capacité attendue | État | Où, dans le code | Note |
|---|---|---|---|
| Parcellaire + carte, contours KML / cadastre | fait | `app.js`, `admin-gt.js` | |
| Travaux validés par parcelle, avancement, tournées, priorité du jour | fait | `app.js`, `tournees.js` | |
| Temps passés, cadence vs barème, heures/ha, coût de revient | fait | `pilotage.js` (32 lectures « h/ha », 61 « cadence ») | REV-1 au backlog |
| Planning équipe, annualisation, relevé d'heures | fait | `planning.js` | |
| Tracteur : sessions, GNR, entretiens | fait | `tracteur.js` | |
| Catalogue E-Phy, DRE, DAR, ZNT, assistant 3 étapes | fait | `app.js`, `phyto.js` | |
| Budget cuivre 7 ans | fait | `pilotage.js` | |
| **Registre phyto électronique 2027** | **fait** | `phyto.js` 900-1110 : annexe II cas A, OEPP `VITVI`, BBCH 2 chiffres, GPS WGS84, bio | 3 compléments possibles, § 4.6 |
| Fenêtre de traitement (sec, vent < 19 km/h, < 25 °C, AROME horaire) | fait | `pilotage.js` 1905-1990 | sans hygrométrie ni heures abeilles |
| Protection restante par parcelle (contact / pénétrant / systémique, lessivage à 20 mm) | fait | `pilotage.js` 4215-4320 | sans effet de la pousse |
| Alerte gel (Tmin < 3 °C sur la prévision) | fait | `app.js` 4602, 6896 | seuil 0 / 3 °C au backlog (§418b) ; pas lié au stade |
| Météo AROME par parcelle, pastille mini | fait | `app.js` | |
| Notifications push | fait | `sw.js` 4897 | |
| Hors-ligne (PWA, Firestore) | fait | `firebase.js`, `sw.js` | |
| Maturités, cuvier, chai, labo PDF | fait | `cuvier.js`, `cave.js` | |
| hL/ha réalisé, rendement AOC max par appellation | fait | `cuvier.js` 6772 | réfaction manquants au backlog (HLHA-1) |
| Comparaison de campagnes (archives) | fait | `pilotage.js` 640-700 | |
| Aide par écran, tutos, guide, « Pourquoi on le fait » | fait | `utils.js`, `tutos.js` | |
| **Stade phénologique par parcelle, suivi dans la saison** | **manquant** | `STADES_PHENO` (`app.js` 588) n'est lu que par la saisie d'un traitement | aucune date de stade, aucune précocité, aucune somme de températures |
| **Observation de terrain** (état sanitaire, ravageur, carence, gel/grêle, manquants) | **manquant** | seule une note libre sur un traitement (`phyto.js` 845) | Agreo et Process2Wine l'ont |
| **Photo géolocalisée** | **manquant** | aucun `<input type="file">` image ; le Storage ne reçoit que des PDF (`firebase.js` 3418) | la géolocalisation existe (`app.js` 7971) |
| **Estimation de récolte avant vendange** | **manquant** | aucun comptage de grappes ni poids moyen | les manquants existent (comptage entreplantation) |
| IFT | partiel | `pilotage.js` 805 : « des passages, pas un IFT » | nécessaire pour HVE et pour se comparer |
| Hygrométrie dans la fenêtre de traitement | manquant | 0 occurrence | AROME la fournit |
| Heures abeilles pendant la floraison | manquant | 0 occurrence | dépend du stade par parcelle |
| Stress hydrique / bilan hydrique | manquant | 0 occurrence | peu prioritaire en Bourgogne ; jour d'un client irriguant |
| Station météo du domaine (Sencrop, Weenat) | manquant | 0 occurrence | plus tard, selon la demande client |
| Imagerie satellite / NDVI | manquant | 0 occurrence | hors périmètre pour l'instant |
| Modèle mildiou / oïdium | **écarté exprès** | `utils.js` 6555 : « un modèle faux serait pire que rien » | position tenable : la protection restante remplit le besoin |

Ce tableau montre une chose : le socle est **déjà au niveau des références** sur la traçabilité, le temps, l'économie et le réglementaire 2027. Ce qui manque n'est pas une fonction de plus : c'est **l'œil du chef de culture** — ce qu'il voit dans les rangs (observations, photos) et où en est la vigne (phénologie) — et la **prévision de ce qui arrive** (récolte).

---

## 4. Les écarts qui comptent, classés (impact terrain × effort)

### 4.1 Observations de terrain, avec photo géolocalisée — impact fort, effort moyen
Ce que c'est : depuis une parcelle (ou depuis l'Accueil de l'ouvrier), « Signaler » : mildiou, oïdium, botrytis, ravageur, carence, gel, grêle, manquants, palissage, autre ; une intensité (faible / moyen / fort) ; une photo (appareil photo, compressée) ; le point GPS ; une note. Trois taps, une photo.
Ce que ça change : la carte montre des points chauds ; « À savoir » dit « 3 observations oïdium cette semaine sur le Clos » ; la fiche parcelle garde l'historique ; le registre peut mentionner une apparition d'organisme nuisible (exigence du registre de production végétale).
Ce qu'il faut : un nouveau type d'entrée Firestore (`observations`), la compression d'image côté client (canvas, ≈ 200 ko), Storage image, une couche Leaflet, une ligne dans « À savoir ». Lot **OBS-1**.

### 4.2 Phénologie par parcelle — impact fort, effort moyen (débloque quatre choses)
Ce que c'est : l'admin ou le chef note le stade atteint par parcelle (ou par cépage, avec report sur ses parcelles) : débourrement, 2 feuilles, 6-8 feuilles, boutons séparés, floraison, nouaison, fermeture, véraison, maturité. Un calendrier par parcelle et une **carte de précocité** (de la plus précoce à la plus tardive).
La prévision : modèle GFV (Parker et al. 2011, 2013) — somme des moyennes journalières depuis le 1ᵉʳ mars, base 0 °C ; seuils lus le 25/10 : Pinot noir 1 219 (floraison) et 2 511 (véraison), Chardonnay 1 217 et 2 541 °C·j (détail et sources dans `plan-mise-en-place-2026-10-25.md`, § 6). L'appli affiche « pleine floraison vers le 4 juin, à une semaine près » et se recale quand le stade est saisi.
Ce que ça débloque :
1. **le registre** : le stade BBCH du jour se propose tout seul, plus de saisie au traitement ;
2. **la protection restante** : pendant la grande pousse (débourrement → fermeture de grappe), les feuilles nouvelles ne sont pas couvertes : la durée d'un contact se raccourcit (coefficient réglé par l'admin, défaut à caler) — c'est le principe de DeciTrait ;
3. **les abeilles** : une parcelle en floraison voit sa fenêtre de traitement limitée au créneau 2 h avant / 3 h après le coucher du soleil ;
4. **le gel** : l'alerte ne vaut que pour les parcelles débourrées, et dit lesquelles.
Lots **PHENO-1** (saisie, carte, somme), puis **PHENO-2** (les quatre branchements).

### 4.3 Estimation de récolte avant vendange — impact fort, effort moyen
Ce que c'est : par parcelle, autour de la fermeture de grappe puis à la véraison, un comptage « grappes par pied » sur quelques pieds, un poids moyen de grappe par cépage (réglage, affiné à la récolte), les pieds présents (densité × surface, moins les manquants déjà comptés).
Le chiffre : kg = pieds présents × grappes/pied × poids moyen ; hL ≈ kg × rendement de pressurage (réglage, ~0,70 L/kg en rouge, à caler sur les vendanges passées).
Ce que ça change : hL prévus par cuvée **face au rendement AOC maximum** et **face à la capacité de la cuverie** (les cuves existent), nombre de vendangeurs-jours, et après la récolte, l'écart prévu / réel qui recale le poids moyen pour l'année suivante. Lot **RECOLTE-1**.

### 4.4 Fenêtre de traitement v2 — impact fort, effort faible
Ajouter à ce qui existe : l'hygrométrie (AROME) dans la règle du créneau ; le cumul de pluie **prévu** après le créneau face au seuil de lessivage ; et surtout la lecture croisée **« parcelles à nu × créneau »** : « 6 parcelles à nu, 4 encore couvertes 2 jours, créneau sec mardi 6 h-11 h ». Avec PHENO-2, le créneau du soir pour les parcelles en floraison. Lot **FENETRE-2**.

### 4.5 IFT réel — impact moyen, effort faible
IFT d'un traitement = (dose appliquée ÷ dose homologuée de l'usage) × (surface traitée ÷ surface du domaine). Le catalogue porte la dose homologuée (`dose`), le traitement porte la dose appliquée (`dose_val`), la surface est connue. IFT par parcelle, par campagne, biocontrôle à part, face à la référence régionale déjà posée dans Conformité (`_cfmIftRef`). Lot **IFT-1**.

### 4.6 Registre 2027 : trois compléments — impact moyen, effort faible
Le code le dit lui-même (`phyto.js` 907-921) : (a) pas de **surface traitée partielle** (quelques rangs) ; (b) **cible** et **mode d'application** vides ; (c) la **rentrée anticipée** (moment, lieu, motif, mesures) n'est pas enregistrable. Trois champs facultatifs dans la saisie, préremplis depuis le catalogue mais modifiables, et le registre devient complet au sens de l'annexe II. Lot **REG27-1**.

### 4.7 Plus tard, selon les clients
Station météo du domaine (API Sencrop / Weenat) ; bilan hydrique ; unité régionale du rendement (déjà au backlog) ; export des écritures vers le comptable.

---

## 5. Les calculs à ajouter ou à revoir

| Calcul | Formule | Entrées déjà dans l'appli | À régler par l'admin |
|---|---|---|---|
| Somme de températures | Σ jour max(0, (Tmin + Tmax)/2) depuis le 1ᵉʳ mars (base 0 °C, fixée par le modèle) | archive Open-Meteo, puis prévision 16 j, puis moyenne des dix dernières années | — |
| Prévision de stade | date où la somme atteint le seuil du cépage (GFV) | cépage par parcelle | seuils publiés (Pinot noir, Chardonnay) ; les autres cépages appris sur le domaine, ou saisis |
| Protection restante en pousse | durée contact × coefficient si stade entre débourrement et fermeture | mode du produit, date, pluie | coefficient (défaut à caler) |
| Créneau abeilles | coucher du soleil (lat/long, formule NOAA) − 2 h → + 3 h, parcelles en floraison | GPS parcelle, stade | — |
| Gel ciblé | Tmin prévue < seuil **et** stade ≥ débourrement | prévision, stade | seuil 0 / 3 °C (déjà prévu, §418b) |
| Récolte prévue | pieds présents × grappes/pied × poids moyen ; hL = kg × L/kg | pieds/ha des écartements du domaine (Réglages › Vigne), surface, manquants, cuves, AOC max | poids moyen par cépage, L/kg |
| IFT | Σ (dose appliquée ÷ dose homologuée) × (surface traitée ÷ surface domaine) | catalogue, traitements | surface de référence (domaine ou parcelle) |

À revoir en route (déjà au backlog, à ne pas oublier) : la réfaction des manquants au-delà de 20 % (HLHA-1), le hL/ha quand une cuvée a deux cuves, « aujourd'hui » lu en heure universelle (64 endroits).

---

## 6. L'ordre des lots proposé

| Lot | Contenu | Fichiers probables | Bump |
|---|---|---|---|
| **OBS-1** | observation + photo + GPS, couche carte, ligne « À savoir », fiche parcelle | `app.js`, `firebase.js`, `storage.rules`, `firestore.rules`, `index.html`, `styles.css`, `utils.js` (aide, What's New) | APP + SW |
| **PHENO-1** | stades par parcelle, carte de précocité, somme de températures, prévision | `app.js` ou nouveau `pheno.js`, `pilotage.js`, `reglages.js`, `utils.js` | APP + SW |
| **PHENO-2** | BBCH auto au registre, pousse → protection, abeilles → fenêtre, gel ciblé | `phyto.js`, `pilotage.js`, `app.js` | APP + SW |
| **RECOLTE-1** | comptage grappes, poids moyen, hL prévus vs AOC vs cuverie | `cuvier.js`, `reglages.js`, `pilotage.js` | APP + SW |
| **FENETRE-2** | hygro, lessivage prévu, parcelles à nu × créneau | `pilotage.js`, `utils.js` | APP + SW |
| **IFT-1** | IFT réel, par parcelle et campagne, Conformité | `pilotage.js`, `phyto.js` | APP + SW |
| **REG27-1** | surface partielle, cible, mode, rentrée anticipée | `phyto.js`, `index.html` | APP + SW |

Chaque lot suit la règle d'or n°4 : aide, guide, tuto, What's New dans le même lot. OBS-1 et PHENO-1 sont indépendants ; PHENO-2 attend PHENO-1 ; FENETRE-2 gagne à passer après PHENO-2.

Recommandation d'ordre : **PHENO-1 → OBS-1 → PHENO-2 → FENETRE-2 → RECOLTE-1 → IFT-1 → REG27-1**. La phénologie d'abord parce qu'elle sert quatre fois ; les observations ensuite parce que c'est ce qui manque le plus aux yeux d'un chef de culture qui compare avec Agreo.

---

## 7. Ce que je n'ai pas vérifié

- **L'ergonomie mesurée** : je n'ai pas compté les clics d'un geste réel (valider une tâche, saisir un traitement). Le harnais des tutos rejoue les gestes mais ne compte pas les taps. Proposition : un « budget de clics » mesuré par Playwright sur les cinq gestes du quotidien, avec un plafond qui rougit (comme le gabarit).
- **Le rendu** : aucun écran de la démo n'a été ouvert dans ce tour ; les constats viennent du code.
- **Les tarifs et fiches des concurrents** : pages marketing, certaines anciennes (plaquette agreo de 2019, Process2Wine via un distributeur). À prendre comme ordre de grandeur.
- **Les seuils du modèle GFV** : lus le 25/10 (plan, § 6) ; Gamay (floraison) et Aligoté restent introuvables en accès libre.

---

## 8. Sources

- Logiciels.pro, « Comparateur logiciels pour l'exploitation de vignoble », 2026 — les quatre piliers, le test des 5 clics, l'interopérabilité, le panorama (Isagri, Process2Wine, Smag, E-Viti, Vitirev).
- Fiche Process2Wine distribuée par le groupe Perret (formules Start Vigne / Chai, 50 et 75 € HT/mois).
- Avis Process2Wine sur Capterra (4,4/5, 5 avis).
- Plaquette Smag « agreo Vigne » (2019) : observations, détection automatique des parcelles, coûts de revient.
- Dépliant MesParcelles (Chambre d'agriculture, 2023) : IFT automatique, HVE / Terra Vitis.
- Davy A. et al., « DeciTrait : un OAD pour la protection de la vigne », *Innovations Agronomiques* 79, 2020 (HAL INRAE) ; témoignages Chambre d'agriculture du Tarn, 2021.
- Réussir Vigne, « Stations météorologiques connectées : comment s'équiper » et « Bien choisir sa station météo connectée » ; Pleinchamp, « Sencrop entrevoit les fenêtres de pulvérisation à J+3 » (2023) et « L'anémomètre connecté » (vent 19 km/h).
- Van Leeuwen C. et al., « Phénologie : suivez l'horloge interne de la vigne » (Bordeaux Sciences Agro) ; Molitor D. et al., *AJEV* 2014 (modèle degrés-jours des 26 stades BBCH) ; Parker A. et al. 2011 (modèle GFV).
- Arrêté du 24 décembre 2025 relatif à la tenue des registres d'utilisation des produits phytopharmaceutiques (JO n° 306 du 31/12/2025), annexes I et II — via AIDA/Ineris.
- Règlements d'exécution (UE) 2023/564 et 2025/2203 (report au 1ᵉʳ janvier 2027).
- Arrêté du 20 novembre 2021 (protection des abeilles) ; notes DRAAF Grand-Est 2024 et Chambres d'agriculture ; Réussir Vigne, « Conciliez traitements dans les vignes et abeilles ».
- Vinetur, « Les responsables de vignoble déploient l'IA pour protéger les raisins des fortes chaleurs » (juillet 2026) : alertes chaleur localisées, stress hydrique.
