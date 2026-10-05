// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/gt.js — L'ENTRÉE DE LA PAGE GUERETTECH (gt.html) — GT-1, §249
// ════════════════════════════════════════════════════════════════════════════
// gt.html = l'appli complète + la console GUERETTECH. L'appli des clients (index.html → src/app.js) n'importe plus
// admin-gt.js : son code n'est ni téléchargé ni chargé sur leur téléphone (le précache l'exclut aussi,
// scripts/inject-precache.mjs). Ici, d'abord l'appli entière (toutes ses fonctions globales), PUIS la console qui s'y
// appuie — l'ordre que suivait app.js n'imposait rien d'autre : admin-gt.js ne lit ses dépendances qu'à l'usage.
import './app.js';
import './admin-gt.js';
