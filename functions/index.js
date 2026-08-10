// MA VIGNE — Cloud Functions v1.0
// Backup automatique Firestore → GCS
// Prérequis : plan Blaze Firebase
// Déploiement : firebase deploy --only functions

'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger }     = require('firebase-functions');
const admin          = require('firebase-admin');
const { Storage }    = require('@google-cloud/storage');
const { v1: firestoreV1 } = require('@google-cloud/firestore');

admin.initializeApp();

// ── Config ────────────────────────────────────────────────────
const PROJECT_ID       = 'mavigne-a0fd5';
const BUCKET           = 'mavigne-a0fd5.firebasestorage.app';
const BACKUP_PREFIX    = 'backups';
const TENANT_PREFIX    = 'mavigne_';
const JSON_RETAIN_DAYS = 30;   // rétention backups JSON par tenant
// Rétention exports Firestore natifs → réglée dans GCS lifecycle (voir README)

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════
// ① Export Firestore natif — quotidien, 2h (Paris)
//    Format binaire Firebase — restauration complète :
//    gcloud firestore import gs://BUCKET/backups/firestore/DATE
//    Rétention : 7 jours via règle GCS lifecycle (voir README)
// ══════════════════════════════════════════════════════════════
exports.dailyFirestoreExport = onSchedule(
  {
    schedule:      '0 2 * * *',
    timeZone:      'Europe/Paris',
    region:        'europe-west1',
    memory:        '256MiB',
    timeoutSeconds: 60,
  },
  async () => {
    const client          = new firestoreV1.FirestoreAdminClient();
    const date            = todayISO();
    const outputUriPrefix = `gs://${BUCKET}/${BACKUP_PREFIX}/firestore/${date}`;

    logger.info(`[Backup] Export Firestore → ${outputUriPrefix}`);

    try {
      const [op] = await client.exportDocuments({
        name:           client.databasePath(PROJECT_ID, '(default)'),
        outputUriPrefix,
        collectionIds:  [],   // vide = toutes les collections
      });
      logger.info('[Backup] Export lancé', { operation: op.name });
    } catch (err) {
      logger.error('[Backup] Échec export Firestore natif', err);
      throw err;   // déclenche le retry automatique Cloud Scheduler
    }
  }
);

// ══════════════════════════════════════════════════════════════
// ② Export JSON par tenant — QUOTIDIEN, 3h (Paris)
//    Format JSON lisible — utile pour support, audit, debug client
//    Découverte automatique des tenants via listCollections()
//    Purge auto des fichiers > JSON_RETAIN_DAYS jours
// ══════════════════════════════════════════════════════════════
exports.weeklyTenantJsonBackup = onSchedule(
  {
    schedule:       '0 3 * * *',   // tous les jours 3h
    timeZone:       'Europe/Paris',
    region:         'europe-west1',
    memory:         '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db      = admin.firestore();
    const storage = new Storage();
    const bucket  = storage.bucket(BUCKET);
    const date    = todayISO();

    // ── Découverte des tenants actifs ──────────────────────────
    const allCols    = await db.listCollections();
    const tenantCols = allCols
      .map(c => c.id)
      .filter(id => id.startsWith(TENANT_PREFIX));

    if (tenantCols.length === 0) {
      logger.warn('[Backup] Aucun tenant trouvé (préfixe : mavigne_)');
      return;
    }
    logger.info(`[Backup] ${tenantCols.length} tenant(s) : ${
      tenantCols.map(c => c.replace(TENANT_PREFIX, '')).join(', ')
    }`);

    // ── Export JSON par tenant ─────────────────────────────────
    let ok = 0;
    for (const colId of tenantCols) {
      const slug = colId.replace(TENANT_PREFIX, '');
      try {
        const snap = await db.collection(colId).get();
        const data = {};
        snap.forEach(doc => { data[doc.id] = doc.data(); });

        const payload  = JSON.stringify(
          { tenant: slug, exported_at: new Date().toISOString(), data },
          null, 2
        );
        const filePath = `${BACKUP_PREFIX}/tenants/${slug}/${date}.json`;

        await bucket.file(filePath).save(payload, {
          contentType: 'application/json',
          metadata: {
            cacheControl: 'no-cache',
            metadata: { mavigne_tenant: slug, backup_date: date },
          },
        });

        logger.info(`[Backup] ${slug} → ${filePath} (${(payload.length / 1024).toFixed(1)} Ko)`);
        ok++;
      } catch (err) {
        logger.error(`[Backup] Erreur tenant "${slug}"`, err);
        // On continue avec les autres tenants
      }
    }

    // ── Purge des JSON > JSON_RETAIN_DAYS jours ───────────────
    const cutoffMs = Date.now() - JSON_RETAIN_DAYS * 86400000;
    try {
      const [files] = await bucket.getFiles({ prefix: `${BACKUP_PREFIX}/tenants/` });
      let purged = 0;
      for (const file of files) {
        const [meta] = await file.getMetadata();
        if (new Date(meta.timeCreated).getTime() < cutoffMs) {
          await file.delete();
          purged++;
        }
      }
      if (purged > 0) {
        logger.info(`[Backup] Purge : ${purged} fichier(s) supprimé(s)`);
      }
    } catch (err) {
      logger.warn('[Backup] Erreur purge (non bloquant)', err);
    }

    logger.info(`[Backup] Terminé — ${ok}/${tenantCols.length} tenant(s) exporté(s)`);
  }
);
Object.assign(exports, require('./claims'));
// Synchro catalogue phyto E-Phy (ANSES)
Object.assign(exports, require('./ephy'));
// Auto-capture des demandes d'essai (formulaire public)
Object.assign(exports, require('./leads'));
