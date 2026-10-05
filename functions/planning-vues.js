'use strict';
// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — MOTIFS-1 (§250) : LES DEUX DÉCLENCHEURS QUI FABRIQUENT LES VUES DU PLANNING
// ════════════════════════════════════════════════════════════════════════════
// La règle vit dans planning-vues-calc.js (pure, jouée par scripts/mv-harnais-motifs1.mjs). Ici, seulement :
//   · planningVuesEntrees : à chaque écriture de mavigne_<slug>/planning_entries (l'admin tient le planning) ;
//   · planningVuesMembres : à chaque écriture de mavigne_<slug>/membres (un compte ajouté, une adresse changée).
// ⚠️ PREMIERS déclencheurs Firestore du projet. Base eur3, fonctions europe-west1 : couple supporté par Eventarc
//    (« eur3 : europe-west1 et europe-west4 »). Au premier déploiement, la CLI peut demander d'activer des API
//    (Eventarc, Pub/Sub) puis réclamer quelques minutes avant un second essai : les droits de l'agent Eventarc se
//    propagent. Relancer la même commande suffit.
// ⚠️ Pas de nouvel essai automatique (retry) : la dérivation est idempotente et la prochaine écriture la refait.
//    Un échec se lit dans les journaux (« [MOTIFS-1] vues non dérivées ») ; un rattrapage complet se lance par
//    gtPlanningVues (claims.js), depuis la console GUERETTECH.
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { /* déjà initialisé par index.js */ }
const { deriverDomaine, TENANT_PREFIX } = require('./planning-vues-calc');

const REGION = 'europe-west1';

async function deriver(event, cle) {
  const coll = (event && event.params) ? event.params.coll : '';
  if (typeof coll !== 'string' || coll.indexOf(TENANT_PREFIX) !== 0) return null;   // _guerettech, ephy, leads… : rien
  try {
    const r = await deriverDomaine(admin.firestore(), admin.auth(), coll);
    logger.info('[MOTIFS-1] ' + coll + ' ← ' + cle, r);
    return r;
  } catch (e) {
    logger.error('[MOTIFS-1] vues non dérivées — ' + coll + ' ← ' + cle, e);
    return null;
  }
}

exports.planningVuesEntrees = onDocumentWritten(
  { document: '{coll}/planning_entries', region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  (event) => deriver(event, 'planning_entries'));

exports.planningVuesMembres = onDocumentWritten(
  { document: '{coll}/membres', region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  (event) => deriver(event, 'membres'));
