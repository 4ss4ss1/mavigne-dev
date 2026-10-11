'use strict';
// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — NOTIF-3 (§311) : LA NOTIFICATION DU MATIN, À L'HEURE DE PRISE DE POSTE
// ════════════════════════════════════════════════════════════════════════════
// Le calcul vit dans notif-calc.js (pur, joué par scripts/mv-harnais-notif3.mjs). Ici, quatre fonctions :
//   · notifCle      : la clé publique d'envoi, pour qu'un téléphone s'abonne (aucune clé dans le code : dépôt public) ;
//   · notifAbonner  : un téléphone s'abonne — le membre se déduit de l'adresse VÉRIFIÉE du compte, jamais du client ;
//   · notifHoraires : l'administrateur publie les heures de prise de poste et les messages des 14 jours à venir ;
//   · notifMatin    : tous les quarts d'heure de 4 h à 20 h 45 (Paris), envoie à qui prend son poste.
// Collections réservées au serveur : mv_notif_abos, mv_notif_horaires. Elles ne commencent pas par « mavigne_ » :
// aucune règle de firestore.rules ne les ouvre à un client (lecture comme écriture), rien à y ajouter.
// ⚠️ DEUX SECRETS, posés UNE fois par Nico avant le premier déploiement (procédure : CLAUDE.md §311f) :
//    VAPID_PUBLIQUE et VAPID_PRIVE (npx web-push generate-vapid-keys). Changer la paire désabonne tout le monde.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const webpush = require('web-push');
try { admin.initializeApp(); } catch (e) { /* déjà initialisé par index.js */ }
const C = require('./notif-calc');

const REGION = 'europe-west1';
const VAPID_PUBLIQUE = defineSecret('VAPID_PUBLIQUE');
const VAPID_PRIVE = defineSecret('VAPID_PRIVE');
const ABOS = 'mv_notif_abos';
const HORAIRES = 'mv_notif_horaires';

function domaine(request) {
  const t = request.auth && request.auth.token;
  if (!t) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (typeof t.tenant !== 'string' || !t.tenant || t.demo === true) throw new HttpsError('permission-denied', 'Compte sans domaine.');
  return t.tenant;
}

exports.notifCle = onCall({ region: REGION, enforceAppCheck: true, secrets: [VAPID_PUBLIQUE] }, async (request) => {
  domaine(request);
  return { cle: VAPID_PUBLIQUE.value() };
});

exports.notifAbonner = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const slug = domaine(request);
  const abo = C.abonnementValide(request.data && request.data.abo);
  if (!abo) throw new HttpsError('invalid-argument', 'Abonnement invalide.');
  const db = admin.firestore();
  const m = C.membreDuCompte(C.valeur(await db.doc(C.TENANT_PREFIX + slug + '/membres').get()), request.auth.token.email);
  if (!m) throw new HttpsError('failed-precondition', 'Ce compte n’a pas de fiche dans l’équipe.');
  const id = crypto.createHash('sha256').update(abo.endpoint).digest('hex').slice(0, 40);   // un téléphone = un document
  await db.doc(ABOS + '/' + id).set({ slug, uid: request.auth.uid, nom: m.nom, abo,
    vu: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true, nom: m.nom };
});

exports.notifHoraires = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const slug = domaine(request);
  if (request.auth.token.adm !== true) throw new HttpsError('permission-denied', 'Réservé à l’administrateur du domaine.');
  const jours = C.publicationValide(request.data && request.data.jours);
  if (!jours) throw new HttpsError('invalid-argument', 'Publication invalide.');
  await admin.firestore().doc(HORAIRES + '/' + slug).set({ jours, par: request.auth.uid,
    maj: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, jours: Object.keys(jours).length };
});

exports.notifMatin = onSchedule({ schedule: '*/15 4-20 * * *', timeZone: 'Europe/Paris', region: REGION,
  secrets: [VAPID_PUBLIQUE, VAPID_PRIVE], timeoutSeconds: 120, memory: '256MiB' }, async (event) => {
  const quand = C.parisDe(event && event.scheduleTime ? new Date(event.scheduleTime) : new Date());
  const db = admin.firestore();
  const [hs, as] = await Promise.all([db.collection(HORAIRES).get(), db.collection(ABOS).get()]);
  const plan = C.planDuQuart(hs.docs.map((d) => ({ slug: d.id, jours: (d.data() || {}).jours })),
    as.docs.map((d) => Object.assign({ id: d.id }, d.data())), quand);
  if (!plan.length) return null;
  webpush.setVapidDetails('mailto:ngdevpro@gmail.com', VAPID_PUBLIQUE.value(), VAPID_PRIVE.value());
  let ok = 0, partis = 0;
  for (const p of plan) {
    try {
      await webpush.sendNotification(p.abo, JSON.stringify(p.message), { TTL: 3 * 3600, urgency: 'normal' });
      await db.doc(ABOS + '/' + p.id).set({ dernier: quand.iso }, { merge: true });
      ok++;
    } catch (e) {
      const code = e && e.statusCode;
      if (code === 404 || code === 410) { await db.doc(ABOS + '/' + p.id).delete(); partis++; }   // téléphone désabonné
      else logger.warn('[NOTIF-3] envoi refusé', { slug: p.slug, nom: p.nom, code: code || String(e && e.message) });
    }
  }
  logger.info('[NOTIF-3] ' + quand.iso + ' ' + quand.hhmm + ' : ' + ok + ' envoyé(s) sur ' + plan.length + (partis ? ', ' + partis + ' abonnement(s) retiré(s)' : ''));
  return null;
});
