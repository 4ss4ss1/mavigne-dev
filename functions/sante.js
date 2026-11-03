'use strict';
// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — functions/sante.js — L'ÉTAT DES TÂCHES PLANIFIÉES — GT-UI-6, §521
// ════════════════════════════════════════════════════════════════════════════
// La console GUERETTECH (écran « Santé du système », carte du Radar) dit si la sauvegarde de la nuit est faite,
// l'export de secours, le catalogue E-Phy, la file des e-mails. Chaque tâche planifiée écrit ici son dernier
// passage : `_guerettech/sante` = { <tâche>: { ok, quand, detail, ... } }. Lu par la console (règle GT existante).
// ⚠️ Noter l'état ne doit JAMAIS faire échouer la tâche : une écriture ratée se dit dans les journaux, et c'est tout.
// ════════════════════════════════════════════════════════════════════════════
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');   // comme ephy.js (le harnais E-Phy bouche ce module sous ce nom)

const SANTE_DOC = '_guerettech/sante';

async function noterSante(nom, etat) {
  try {
    const e = Object.assign({ quand: new Date().toISOString() }, etat || {});
    if (e.detail != null) e.detail = String(e.detail).slice(0, 240);
    await admin.firestore().doc(SANTE_DOC).set({ [nom]: e }, { merge: true });
  } catch (err) {
    logger.warn('[sante] ' + nom + ' : état non écrit — ' + ((err && err.message) || String(err)));
  }
}

module.exports = { noterSante, SANTE_DOC };
