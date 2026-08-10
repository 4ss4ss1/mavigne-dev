'use strict';

// MA VIGNE — Auto-capture des demandes d'essai (formulaire public)
// ─────────────────────────────────────────────────────────────────
// Cloud Function HTTP appelée par public/essai.html (essai-ma-vigne.html).
// • Aucune écriture client direct en Firestore : tout passe par cette function
//   (admin SDK → contourne les règles). Surface publique = ce seul endpoint.
// • DÉDUPLICATION PAR E-MAIL : docId = SHA-256 de l'e-mail normalisé →
//   une seule fiche par adresse. Les renvois incrémentent un compteur,
//   sans réécrire la fiche ni renvoyer de mail.
// • E-mail de notification via l'extension « Trigger Email » (collection `mail`).
// • Anti-bot : champ honeypot.
//
// Déploiement : firebase deploy --only functions
// Exposition recommandée : rewrite hosting /api/lead (voir firebase.json).

const { onRequest } = require('firebase-functions/v2/https');
const { logger }    = require('firebase-functions');
const admin         = require('firebase-admin');
const crypto        = require('crypto');

if (!admin.apps.length) { try { admin.initializeApp(); } catch (_) {} }

// ── Config ────────────────────────────────────────────────────────
const DEST            = 'ngdevpro@gmail.com';
const LEADS           = 'leads';   // collection des demandes (read = GT only)
const MAIL_COLLECTION = 'mail';    // file de l'extension « Trigger Email »
const ALLOWED_ORIGINS = [
  'https://mavigneapp.fr',
  'https://www.mavigneapp.fr',
  'https://mavigne-a0fd5.web.app',
  'https://mavigne-a0fd5.firebaseapp.com',
  'http://localhost:5173',
];

// ── Helpers ───────────────────────────────────────────────────────
const clip    = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const esc     = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function buildLead(b, req) {
  const modules = Array.isArray(b.modules)
    ? b.modules.slice(0, 12).map(m => clip(m, 80)).filter(Boolean)
    : [];
  return {
    domaine:     clip(b.domaine, 120),
    email:       clip(b.email, 160).toLowerCase(),
    tel:         clip(b.tel, 40),
    region:      clip(b.region, 120),
    ville:       clip(b.ville, 80),
    cp:          clip(b.cp, 10).replace(/\D/g, '').slice(0, 5),
    surface:     clip(b.surface, 20),
    users:       clip(b.users, 20),
    modules,
    commune:     clip(b.commune, 80),
    parcellaire: clip(b.parcellaire, 80),
    nbparc:      clip(b.nbparc, 20),
    perm:        clip(b.perm, 20),
    saiso:       clip(b.saiso, 20),
    engins:      clip(b.engins, 20),
    conduite:    clip(b.conduite, 40),
    cuvees:      clip(b.cuvees, 20),
    message:     clip(b.message, 2000),
    userAgent:   clip(req.headers['user-agent'], 300),
  };
}

// ── Composition de l'e-mail de notification ──────────────────────
function mailSubject(l) { return `🍇 Demande d'essai — ${l.domaine}`; }

function mailText(l) {
  const ln = (lab, val) => val ? `${lab} : ${val}\n` : '';
  let t = "Nouvelle demande d'essai Ma Vigne\n\n";
  t += ln('Domaine', l.domaine);
  t += ln('E-mail', l.email);
  t += ln('Téléphone', l.tel);
  t += ln('Commune', [l.ville, l.cp].filter(Boolean).join(' '));
  t += ln('Région / appellation', l.region);
  t += ln('Surface', l.surface ? l.surface + ' ha' : '');
  t += ln('Utilisateurs', l.users);
  t += '\nModules souhaités :\n';
  t += l.modules.length ? l.modules.map(m => '  - ' + m).join('\n') + '\n' : '  (à définir)\n';
  const parc = [l.commune, l.parcellaire, l.nbparc ? l.nbparc + ' parcelles' : ''].filter(Boolean).join(' · ');
  if (parc) t += `\nParcelles : ${parc}\n`;
  const eq = [l.perm ? l.perm + ' permanents' : '', l.saiso ? 'saisonniers : ' + l.saiso : ''].filter(Boolean).join(' · ');
  if (eq) t += `Équipe : ${eq}\n`;
  if (l.engins)   t += `Matériel : ${l.engins} engins\n`;
  if (l.conduite) t += `Conduite : ${l.conduite}\n`;
  if (l.cuvees)   t += `Cave : ${l.cuvees} cuvées\n`;
  if (l.message)  t += `\nMessage :\n${l.message}\n`;
  t += `\n— Répondez à cet e-mail pour joindre directement ${l.domaine}.`;
  return t;
}

function mailHtml(l) {
  const row = (lab, val) => val
    ? `<tr><td style="padding:4px 14px 4px 0;color:#6E6456;white-space:nowrap">${esc(lab)}</td><td style="padding:4px 0;font-weight:600">${esc(val)}</td></tr>`
    : '';
  const mods = l.modules.length
    ? l.modules.map(m => `<li>${esc(m)}</li>`).join('')
    : '<li>à définir</li>';
  const parc = [l.commune, l.parcellaire, l.nbparc ? l.nbparc + ' parcelles' : ''].filter(Boolean).join(' · ');
  const eq   = [l.perm ? l.perm + ' permanents' : '', l.saiso ? 'saisonniers : ' + l.saiso : ''].filter(Boolean).join(' · ');
  let extra = '';
  extra += row('Parcelles', parc);
  extra += row('Équipe', eq);
  if (l.engins)   extra += row('Matériel', l.engins + ' engins');
  if (l.conduite) extra += row('Conduite', l.conduite);
  if (l.cuvees)   extra += row('Cave', l.cuvees + ' cuvées');
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;color:#14110D">
  <h2 style="font-size:18px;margin:0 0 12px;font-weight:600">Nouvelle demande d'essai Ma Vigne</h2>
  <table style="font-size:14px;border-collapse:collapse">
    ${row('Domaine', l.domaine)}${row('E-mail', l.email)}${row('Téléphone', l.tel)}${row('Commune', [l.ville, l.cp].filter(Boolean).join(' '))}${row('Région', l.region)}${row('Surface', l.surface ? l.surface + ' ha' : '')}${row('Utilisateurs', l.users)}${extra}
  </table>
  <p style="font-size:14px;margin:14px 0 4px;color:#6E6456">Modules souhaités</p>
  <ul style="font-size:14px;margin:0 0 12px;padding-left:20px">${mods}</ul>
  ${l.message ? `<p style="font-size:14px;margin:14px 0 4px;color:#6E6456">Message</p><p style="font-size:14px;white-space:pre-wrap;margin:0;padding:10px 12px;background:#F7F4EC;border-radius:8px">${esc(l.message)}</p>` : ''}
  <p style="font-size:13px;color:#6E6456;margin-top:18px">Répondez à cet e-mail pour joindre directement ${esc(l.domaine)}.</p>
</div>`;
}

// ── Accusé de réception envoyé au client ─────────────────────────
// Écrit à la première personne : c'est Nicolas qui répondra, pas un robot. Le rôle de ce
// message est de dire trois choses et pas une de plus — c'est bien arrivé, voici ce qui
// va se passer, voici sous combien de temps. Aucun prix, aucun argumentaire : la demande
// d'essai n'est pas le moment de vendre.
function ackText(l) {
  return "Bonjour,\n\n"
    + "J'ai bien re\u00e7u votre demande d'essai pour " + l.domaine + ".\n\n"
    + "Je vous r\u00e9ponds personnellement sous 24 heures, avec les quelques \u00e9l\u00e9ments dont "
    + "j'ai besoin pour pr\u00e9parer votre domaine. L'objectif est que le jour o\u00f9 vous ouvrez "
    + "l'application, elle contienne d\u00e9j\u00e0 vos parcelles et votre \u00e9quipe \u2014 pas une "
    + "d\u00e9monstration.\n\n"
    + "Vous pouvez r\u00e9pondre directement \u00e0 ce message.\n\n"
    + "\u00c0 tr\u00e8s vite,\n\n"
    + "Nicolas Gu\u00e9ret\n"
    + "Ma Vigne \u2014 GUERETTECH\n"
    + "06 99 42 48 59\n"
    + "mavigneapp.fr";
}

function ackHtml(l) {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;color:#14110D;font-size:15px;line-height:1.6">
  <p>Bonjour,</p>
  <p>J\u2019ai bien re\u00e7u votre demande d\u2019essai pour <strong>${esc(l.domaine)}</strong>.</p>
  <p>Je vous r\u00e9ponds personnellement sous 24 heures, avec les quelques \u00e9l\u00e9ments dont j\u2019ai besoin
     pour pr\u00e9parer votre domaine. L\u2019objectif est que le jour o\u00f9 vous ouvrez l\u2019application, elle
     contienne d\u00e9j\u00e0 vos parcelles et votre \u00e9quipe \u2014 pas une d\u00e9monstration.</p>
  <p>Vous pouvez r\u00e9pondre directement \u00e0 ce message.</p>
  <p style="margin-top:22px">\u00c0 tr\u00e8s vite,<br>
     <strong>Nicolas Gu\u00e9ret</strong><br>
     <span style="color:#6E6456">Ma Vigne \u2014 GUERETTECH</span><br>
     <span style="color:#6E6456">06 99 42 48 59 \u00b7 mavigneapp.fr</span></p>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// MISE EN ROUTE — les reponses d'installation, en base
// ══════════════════════════════════════════════════════════════════
// public/mise-en-route.html pose 17 questions et rendait ses reponses en
// COPIER-COLLER, ou en brouillon d'e-mail VIDE : un mailto avec corps triple de
// volume une fois les accents encodes, et Outlook le tronque sans prevenir. Il
// fallait donc recopier a la main dans l'assistant d'installation.
//
// OU CA S'ECRIT, ET POURQUOI PAS AILLEURS : dans le document `leads` DEJA indexe
// sur sha256(e-mail), sous la cle `mer`. Aucune collection nouvelle, donc aucune
// regle a deployer — `leads` est deja en read:isGtAdmin / write:false — et les
// reponses atterrissent dans le dossier que l'assistant d'installation ouvre.
// Si la personne n'est jamais passee par le formulaire d'essai, le dossier est
// cree ici, avec sa source.
const MER_MAX_CH = 60;     // nombre de champs retenus, par famille
const MER_MAX_L  = 600;    // longueur d'une reponse
const MER_MAX_R  = 20000;  // longueur du recapitulatif

// Le texte du recapitulatif est construit par la PAGE, pas ici : les 60 libelles
// n'existent qu'a un seul endroit. Le serveur ne le reecrit pas, il le borne.
function buildMer(b) {
  const t = {}, r = {};
  const src = (b && typeof b.t === 'object' && b.t) ? b.t : {};
  const rad = (b && typeof b.r === 'object' && b.r) ? b.r : {};
  Object.keys(src).slice(0, MER_MAX_CH).forEach((k) => {
    const v = clip(src[k], MER_MAX_L);
    if (v) t[clip(k, 40)] = v;
  });
  Object.keys(rad).slice(0, MER_MAX_CH).forEach((k) => {
    const v = clip(rad[k], MER_MAX_L);
    if (v) r[clip(k, 40)] = v;
  });
  const c = Array.isArray(b.c) ? b.c.slice(0, MER_MAX_CH).map((x) => clip(x, 120)).filter(Boolean) : [];
  return { t, r, c, recap: clip(b.recap, MER_MAX_R) };
}

exports.submitMiseEnRoute = onRequest(
  {
    region:         'europe-west1',
    memory:         '256MiB',
    timeoutSeconds: 30,
    maxInstances:   3,
    cors:           ALLOWED_ORIGINS,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

    const b = (req.body && typeof req.body === 'object') ? req.body : {};
    if (clip(b.hp, 200)) { res.status(200).json({ status: 'saved' }); return; }

    const domaine = clip(b.dom, 120);
    const email   = clip(b.ctMail, 160).toLowerCase();
    if (!domaine)        { res.status(400).json({ error: 'missing_domaine' }); return; }
    if (!emailOk(email)) { res.status(400).json({ error: 'invalid_email' });  return; }

    const mer  = buildMer(b);
    mer.userAgent = clip(req.headers['user-agent'], 300);
    const hash = crypto.createHash('sha256').update(email).digest('hex');
    const db   = admin.firestore();
    const ref  = db.collection(LEADS).doc(hash);

    let connu = false;
    try {
      connu = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const base = {
          mer:      Object.assign({}, mer, { at: admin.firestore.FieldValue.serverTimestamp() }),
          merCount: admin.firestore.FieldValue.increment(1),
        };
        if (snap.exists) { tx.set(ref, base, { merge: true }); return true; }
        // Personne d'inconnu : la mise en route peut arriver sans demande d'essai
        // prealable (lien envoye de la main a la main). On ouvre le dossier.
        tx.set(ref, Object.assign({
          domaine:   domaine,
          email:     email,
          source:    'mise-en-route',
          attempts:  0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, base));
        return false;
      });
    } catch (err) {
      logger.error('[MER] Échec écriture Firestore', err);
      res.status(500).json({ error: 'server_error' });
      return;
    }

    // ⚠️ Le mail ne conditionne PAS la reponse : les reponses sont en base, et c'est
    //    ce qui compte. Un envoi rate ne doit pas pousser le client a tout recommencer.
    try {
      await db.collection(MAIL_COLLECTION).add({
        to:      [DEST],
        replyTo: email,
        message: {
          subject: '\u{1F527} Mise en route \u2014 ' + domaine,
          text:    'Réponses de mise en route\n\n' + (mer.recap || '(récapitulatif vide)')
                   + '\n\n— ' + domaine + ' <' + email + '>'
                   + (connu ? '\n(dossier déjà connu)' : '\n(nouveau dossier)'),
          html:    '<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;color:#14110D">'
                   + '<h2 style="font-size:18px;margin:0 0 4px;font-weight:600">Mise en route \u2014 ' + esc(domaine) + '</h2>'
                   + '<p style="font-size:13px;color:#6E6456;margin:0 0 14px">' + esc(email)
                   + (connu ? ' \u00b7 dossier d\u00e9j\u00e0 connu' : ' \u00b7 nouveau dossier') + '</p>'
                   + '<pre style="font-size:13px;white-space:pre-wrap;margin:0;padding:12px 14px;'
                   + 'background:#F7F4EC;border-radius:8px;font-family:inherit">' + esc(mer.recap) + '</pre>'
                   + '<p style="font-size:13px;color:#6E6456;margin-top:16px">Les r\u00e9ponses sont dans le dossier, '
                   + 'reprises telles quelles par l\u2019assistant d\u2019installation.</p></div>',
        },
      });
    } catch (err) {
      logger.warn('[MER] Réponses enregistrées mais e-mail non mis en file', err);
    }

    logger.info(`[MER] Mise en route — ${domaine} <${email}>` + (connu ? ' (dossier connu)' : ' (nouveau)'));
    res.status(200).json({ status: 'saved' });
  }
);

// ── Function HTTP ─────────────────────────────────────────────────
exports.submitLead = onRequest(
  {
    region:         'europe-west1',
    memory:         '256MiB',
    timeoutSeconds: 30,
    maxInstances:   3,            // garde-fou coût/abus
    cors:           ALLOWED_ORIGINS,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

    const b = (req.body && typeof req.body === 'object') ? req.body : {};

    // Honeypot : rempli uniquement par les bots → on simule un succès.
    if (clip(b.hp, 200)) { res.status(200).json({ status: 'created' }); return; }

    const lead = buildLead(b, req);
    if (!lead.domaine)        { res.status(400).json({ error: 'missing_domaine' }); return; }
    if (!emailOk(lead.email)) { res.status(400).json({ error: 'invalid_email' });  return; }

    const hash = crypto.createHash('sha256').update(lead.email).digest('hex');
    const db   = admin.firestore();
    const ref  = db.collection(LEADS).doc(hash);

    let created = false;
    try {
      created = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) {
          tx.update(ref, {
            attempts:      admin.firestore.FieldValue.increment(1),
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return false;
        }
        tx.set(ref, Object.assign({
          attempts:  1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, lead));
        return true;
      });
    } catch (err) {
      logger.error('[Lead] Échec écriture Firestore', err);
      res.status(500).json({ error: 'server_error' });
      return;
    }

    if (!created) {
      logger.info(`[Lead] Doublon ignoré — ${lead.email}`);
      res.status(200).json({ status: 'duplicate' });
      return;
    }

    // Notification e-mail via l'extension « Trigger Email ».
    try {
      await db.collection(MAIL_COLLECTION).add({
        to:      [DEST],
        replyTo: lead.email,
        message: {
          subject: mailSubject(lead),
          text:    mailText(lead),
          html:    mailHtml(lead),
        },
      });
    } catch (err) {
      // Le lead EST enregistré : on ne fait pas échouer la requête.
      logger.warn('[Lead] Lead sauvegardé mais e-mail non mis en file', err);
    }

    // ── Accusé de réception AU CLIENT ────────────────────────────
    // Sans lui, la personne qui vient d'envoyer le formulaire ne reçoit rien du tout et
    // ne sait pas si son message est parti. Envoyé une seule fois : on n'arrive ici que
    // sur un lead réellement créé (les renvois sortent plus haut sur `duplicate`).
    // Un échec d'envoi ne doit jamais faire échouer la demande — elle est déjà en base.
    try {
      await db.collection(MAIL_COLLECTION).add({
        to:      [lead.email],
        replyTo: DEST,
        message: {
          subject: 'Votre demande d\u2019essai Ma Vigne',
          text:    ackText(lead),
          html:    ackHtml(lead),
        },
      });
    } catch (err) {
      logger.warn('[Lead] Accusé de réception non mis en file', err);
    }

    logger.info(`[Lead] Nouveau lead — ${lead.domaine} <${lead.email}>`);
    res.status(200).json({ status: 'created' });
  }
);
