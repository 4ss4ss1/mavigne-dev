# Banc de chiffres

Le preflight vérifie la **forme** du code. Le banc vérifie les **valeurs** qu'il
produit sur des données réelles figées.

Né d'un incident : le 14/08/2026, un lot a fait passer l'accueil de « +1 j
d'avance » à « -202 j de retard » sans qu'une seule ligne rougisse — rien ne
surveillait les nombres.

## Lancer

    npm run banc              contrôle
    npm run banc:projection   gardes sur la projection
    npm run check             preflight + les deux (tourne aussi avant build)

Après un changement **voulu** :

    node scripts/banc/banc.mjs --engraver

## ⚠️ Données

`instantane.json` est **réduit et anonymisé** : ni nom de personne, ni montant,
ni taux. Le dépôt est public — n'y committez jamais un export brut.

Le banc détecte qu'un chiffre **bouge** quand le code change. Il n'a pas besoin
de dire la vérité comptable d'un domaine, donc pas besoin de ses données
nominatives.

## Ce qu'il couvre / ce qu'il ne couvre pas

Couvert : appariement des périodes homologues, dénominateur de la cadence
historique, gardes sur la projection.

**Non couvert** : la marge en jours, la date de fin, le budget projeté,
l'effectif au pic. Ces chiffres ont besoin du **planning, des contrats et des
réglages économiques**, absents de l'export actuel. Tant qu'ils manquent, le
chiffre le plus visible de l'application n'est surveillé par personne.
