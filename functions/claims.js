// ════════════════════════════════════════════════════════════════════
// MA VIGNE — claims.js — Lot 5 sécurité (juin 2026) + SEC-1 (juillet 2026)
// Custom claims multi-tenant + création membres + codes d'essai serveur
// À placer dans functions/claims.js puis ajouter dans functions/index.js :
//   Object.assign(exports, require('./claims'));
// Déploiement : firebase deploy --only functions
//
// ════ SEC-1 — VERROU D'ÉCRITURE SERVEUR ════
// Claim `adm:true` = administrateur DU DOMAINE, décidé par le serveur (jamais par
// le client). firestore.rules l'exige pour écrire config / membres / saisons /
// planning_*. Avant SEC-1, le seul claim d'écriture était `ro` : tout ouvrier ou
// tractoriste pouvait écrire ces documents depuis la console du navigateur.
//
// RÈGLE ABSOLUE — POSE DE CLAIMS :
//   setCustomUserClaims() REMPLACE l'intégralité des claims d'un compte. Une seule
//   écriture qui écrase = perte de `plan` / `trial_until` → gating cassé ou bandeau
//   d'essai réapparu chez un client payant. TOUTE écriture de claim passe donc par
//   mergeClaims() / mergeClaimsUid(), JAMAIS par setCustomUserClaims() en direct.
//
// ORDRE DE DÉPLOIEMENT (impératif) :
//   1. firebase deploy --only functions   (pose de `adm` disponible)
//   2. gtBackfillClaims depuis la console (pose `adm` sur les admins existants)
//   3. firebase deploy --only firestore:rules
//   Inverser 2 et 3 = tous les admins perdent l'écriture instantanément.
//
// VOCABULAIRE DES CLAIMS (Firebase plafonne l'ENSEMBLE à 1000 octets → noms courts) :
//   tenant:"slug" · ro:true · gtAdmin:true · demo:true · adm:true · plan · trial_until
//   (SEC-2 ajoutera `mustpwd`.)
// ════════════════════════════════════════════════════════════════════
'use strict';

// ── SEC-2 — MOTS DE PASSE (lot suivant SEC-1) ────────────────────────
//   Avant : `vigne21`, identique sur TOUS les comptes de TOUS les domaines, jamais
//   changé — et le flux « changer mon mot de passe » était cassé côté client depuis
//   toujours (reglages.js lisait auth().window.currentUser → undefined), donc personne
//   n'aurait PU en sortir même en le voulant.
//   Après : mot de passe initial unique et prononçable, généré ici, affiché une seule
//   fois à l'admin, jamais stocké en clair ; claim `mustChangePwd` → remplacement forcé
//   à la première connexion via completeFirstLogin ; resetMemberPassword rend l'admin du
//   domaine autonome pour dépanner son équipe (les saisonniers n'ont pas de vraie boîte
//   mail — leur secours est humain, pas électronique).
//   Invariant : aucun mot de passe en clair ne quitte ce fichier autrement que dans la
//   réponse à l'appelant qui vient de le provoquer. Rien en base, rien dans les logs.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { onSchedule } = require('firebase-functions/v2/scheduler');
// SEC-GT/2 : logger n'etait PAS importe ici (il l'est dans leads.js). Les appels
// ajoutes plus bas auraient leve une ReferenceError a l'execution, invisible a
// node --check comme au deploiement.
const { logger } = require('firebase-functions');
try { admin.initializeApp(); } catch (e) { /* déjà initialisé par index.js */ }

const REGION   = 'europe-west1';
const GT_EMAIL = 'ngdevpro@gmail.com';
const DEMO_EMAIL = 'demo@mavigneapp.fr';
// Bac à sable public : ses membres ne doivent JAMAIS obtenir adm ni le droit d'écrire.
const DEMO_TENANT = 'domaine-dupont';
// Plafond Firebase = 1000 octets pour l'ENSEMBLE des custom claims. On refuse à 900
// pour transformer un futur dépassement en erreur lisible plutôt qu'en auth/claims-too-large.
const CLAIMS_MAX_BYTES = 900;

// ── Anti-abus checkTrialToken : throttle par IP (defense-in-depth, complément d'App Check) ──
const THROTTLE_WINDOW_MS = 15 * 60 * 1000; // 15 min glissantes
const THROTTLE_MAX       = 15;             // tentatives bien formées / IP / fenêtre

// ── Helpers ──────────────────────────────────────────────────────────
// ============================================================================
// SEC-GT/2 — DEUX NOTIONS DISTINCTES : L'IDENTITE ET LE DROIT
// ============================================================================
// _isGtToken  = « c'est bien Nicolas »   -> prouve par le mot de passe.
// _isGtSess   = « il a le droit d'agir » -> prouve par le code a usage unique
//               recu par e-mail, materialise par le claim `gts` (expiration en
//               millisecondes) que SEULE gtVerifyOtp sait poser.
//
// Pourquoi cette separation, et pourquoi la branche e-mail RESTE :
// un mot de passe qui fuit donnait jusqu'ici la totalite des donnees clients,
// lisibles directement par le SDK sans jamais ouvrir l'application. Aucun
// controle cote interface ne pouvait l'empecher. Desormais l'identite ne suffit
// plus a rien : elle ouvre le droit de DEMANDER un code, rien d'autre. Le code
// part sur la boite de Nicolas — un attaquant qui a le mot de passe ne l'a pas.
// Conserver la branche e-mail (avec email_verified, aligne sur firestore.rules)
// evite en prime le scenario ou un claim gtAdmin disparu enfermerait Nicolas
// dehors de son propre panneau.
//
// ⚠️ Le claim vit dans le JETON, mis en cache environ une heure. Consequences :
//   - apres gtVerifyOtp, le client DOIT rafraichir (_fbClaims(true)) ;
//   - a l'expiration, un jeton deja emis reste valide jusqu'a son propre
//     renouvellement. La fenetre reelle est donc `gts` + 1 h au pire. C'est
//     assume : gtEndSession existe pour fermer franchement, et les rules
//     revalident a chaque requete avec le jeton presente.
const GT_OTP_COL      = '_gt_otp';       // collection FERMEE (rules : read,write:if false)
const GT_SESSION_MS   = 8 * 60 * 60 * 1000;  // duree d'une session GT : une journee de travail
const GT_OTP_TTL_MS   = 10 * 60 * 1000;      // validite du code
const GT_OTP_MAX_TRY  = 5;                   // tentatives avant invalidation
const GT_OTP_COOLDOWN = 30 * 1000;           // anti-spam entre deux demandes

// IDENTITE. Ne donne plus aucun droit a elle seule.
function _isGtToken(t) {
  return !!t && (t.gtAdmin === true
                 || (t.email === GT_EMAIL && t.email_verified === true));
}

// DROIT. Identite + session ouverte par code a usage unique.
function _isGtSess(t) {
  return _isGtToken(t) && typeof t.gts === 'number' && t.gts > Date.now();
}

function assertGtAdmin(request) {
  const t = request.auth && request.auth.token;
  if (!_isGtToken(t)) {
    throw new HttpsError('permission-denied', 'R\u00e9serv\u00e9 \u00e0 l\'administrateur GUERETTECH.');
  }
  // Identite bonne, session absente ou expiree : erreur DISTINCTE, pour que le
  // client sache qu'il faut demander un code et non que l'acces est refuse.
  if (!_isGtSess(t)) {
    throw new HttpsError('failed-precondition', 'Session GUERETTECH non ouverte \u2014 code de v\u00e9rification requis.', { needOtp: true });
  }
}

// ── assertTenantAdmin — miroir serveur d'assertGtAdmin (SEC-1) ────────
// Admin DU DOMAINE (claim adm) OU admin GUERETTECH. Renvoie {isGt, tenant, token}.
//
// ⚠️ SEC-2 (réutilisation) : cet assert est réservé aux actions qui touchent le
// domaine ou le compte D'UN AUTRE membre. Une CF qui gère le PROPRE compte de
// l'appelant (ex. completeFirstLogin : changer SON mot de passe) ne doit PAS
// l'appeler — un saisonnier (ro:true) doit pouvoir s'en servir. Changer son mot de
// passe n'est pas une écriture de données : aucune garde de rôle ne s'y applique.
function assertTenantAdmin(request) {
  const t = request.auth && request.auth.token;
  if (!t) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (_isGtSess(t)) {
    return { isGt: true, tenant: (typeof t.tenant === 'string' && t.tenant) ? t.tenant : null, token: t };
  }
  // ⚠️ SEC-2 — ALIGNEMENT SUR isAdmin() DES RULES. firestore.rules définit
  //   isAdmin() = canWrite() && adm,  avec canWrite() qui exclut `ro` ET `demo`.
  // Cet assert ne testait que `adm` → les Cloud Functions étaient PLUS PERMISSIVES que
  // les règles qu'elles servent. Un compte incohérent ro:true + adm:true (posable
  // seulement à la main via gtSetTenantClaims — deriveRo/deriveAdm s'excluent à la pose)
  // franchissait cet assert, puis se faisait refuser par Firestore : deux verrous censés
  // dire la même chose, qui ne la disaient pas. Un seul énoncé, aux deux endroits.
  if (t.ro === true || t.demo === true) {
    throw new HttpsError('permission-denied', 'Compte en lecture seule.');
  }
  if (t.adm !== true) {
    throw new HttpsError('permission-denied', 'Réservé à l\'administrateur du domaine.');
  }
  if (typeof t.tenant !== 'string' || !t.tenant) {
    throw new HttpsError('permission-denied', 'Aucun domaine associé à votre compte (claims manquants ?).');
  }
  return { isGt: false, tenant: t.tenant, token: t };
}

// ro (read-only) = saisonnier OU pilotage, sans aucun rôle d'écriture
function deriveRo(roles) {
  const r = Array.isArray(roles) ? roles : [];
  const noWrite = !r.includes('admin') && !r.includes('ouvrier') && !r.includes('tractoriste');
  return noWrite && (r.includes('saisonnier') || r.includes('pilotage'));
}

// ── deriveAdm — DÉRIVATION UNIQUE du rôle admin (SEC-1) ───────────────
// Un seul point de vérité : toute pose de `adm` passe par ici. deriveRo() garantit
// déjà qu'un porteur du rôle 'admin' n'est jamais ro:true — les deux ne peuvent pas
// être vrais en même temps.
function deriveAdm(roles) {
  const r = Array.isArray(roles) ? roles : [];
  return r.includes('admin');
}

// ── mergeClaimsUid — HELPER UNIQUE DE POSE DE CLAIMS (SEC-1) ──────────
// setCustomUserClaims REMPLACE tout : on lit l'existant et on fusionne.
// Sémantique du patch, valable partout :
//   valeur      → pose/écrase cette clé
//   null        → RETIRE cette clé
//   undefined   → laisse cette clé INCHANGÉE (clé absente du patch = idem)
// N'écrit rien si le résultat est identique à l'existant (idempotence + économie de
// quota Auth). Renvoie {uid, claims, changed}.
async function mergeClaimsUid(uid, patch) {
  const user = await admin.auth().getUser(uid);
  return _mergeInto(user, patch);
}

// Même helper, entrée par e-mail (cas courant).
async function mergeClaims(email, patch) {
  const user = await admin.auth().getUserByEmail(String(email));
  return _mergeInto(user, patch);
}

async function _mergeInto(user, patch) {
  const cur  = user.customClaims || {};
  const next = Object.assign({}, cur);
  const p    = patch || {};
  for (const k of Object.keys(p)) {
    if (p[k] === undefined) continue;
    if (p[k] === null) delete next[k];
    else next[k] = p[k];
  }
  const before = JSON.stringify(cur);
  const after  = JSON.stringify(next);
  if (before === after) return { uid: user.uid, claims: next, changed: false };
  if (Buffer.byteLength(after, 'utf8') > CLAIMS_MAX_BYTES) {
    throw new HttpsError('resource-exhausted',
      'Custom claims trop volumineux (' + Buffer.byteLength(after, 'utf8') + ' o) pour ' + user.email);
  }
  await admin.auth().setCustomUserClaims(user.uid, next);
  return { uid: user.uid, claims: next, changed: true };
}

// Tri-état pour les paramètres booléens des CF de dépannage :
//   true → pose · false → RETIRE · absent/undefined → inchangé
function _tri(v) { return v === undefined ? undefined : (v ? true : null); }

// ── SEC-2 : mot de passe initial PRONONÇABLE ─────────────────────────
// Deux mots + trois chiffres (ex. « cave-rouge-427 »). Fait pour être DIT À VOIX HAUTE
// puis tapé : pas d'accent, pas de casse mixte, rien d'ambigu à l'oral. Vocabulaire du
// métier → mémorable le temps d'aller de l'écran de l'admin au téléphone de l'ouvrier.
//
// Entropie ≈ 19 bits (24 × 24 × 900 = 518 400). VOLONTAIREMENT modeste, et ce n'est pas
// un défaut : ce mot de passe est TRANSITOIRE (mustChangePwd force son remplacement à la
// première connexion) et une attaque en ligne se heurte au throttle natif de Firebase
// Auth. L'ancien modèle — `vigne21`, identique sur tous les comptes de tous les domaines,
// permanent — avait 0 bit d'entropie utile.
//
// crypto.randomInt = CSPRNG. Math.random() serait prévisible, donc inacceptable ici.
const PWD_A = ['cave','vigne','cep','rang','fut','cuve','terre','roche','pierre','sillon',
               'grappe','feuille','sarment','tonneau','pressoir','chai','clos','coteau',
               'muid','cepage','treille','souche','marne','silex'];
const PWD_B = ['rouge','blanc','clair','dore','vieux','haut','franc','tendre','vif','ample',
               'rond','fin','sec','souple','large','calme','pur','net','sain','plein',
               'vert','frais','dense','leger'];

function genPwd() {
  const a = PWD_A[crypto.randomInt(PWD_A.length)];
  const b = PWD_B[crypto.randomInt(PWD_B.length)];
  const n = crypto.randomInt(100, 1000);
  return a + '-' + b + '-' + n;
}

// ── SEC-2 : un administrateur DOIT avoir une adresse de messagerie réelle ──
// Règle métier (décision Nico) : l'admin est le point de secours de toute son équipe —
// personne n'est au-dessus de lui pour le dépanner. Sa seule porte de sortie s'il perd
// son mot de passe est le lien de réinitialisation Firebase, qui exige une vraie boîte.
// Les membres de l'équipe, eux, n'ont pas besoin d'e-mail : leur admin les réinitialise.
//
// Les adresses @mavigne.app ET @mavigneapp.fr sont FICTIVES (deux conventions en usage :
// prenom.slug@mavigne.app pour les premiers domaines, prenom.domaine@mavigneapp.fr pour
// les suivants) —
// aucun mail n'y arrive jamais. Un admin sur une telle adresse est un admin qu'on ne
// pourrait dépanner que depuis la console GT, c'est-à-dire pas du tout côté client.
// La garde est ici, côté serveur : un discours commercial n'est pas un verrou.
const FICTIVE_MAIL_RE = /@(mavigne\.app|mavigneapp\.fr)$/i;
function assertRealEmailForAdmin(email, roles) {
  if (!deriveAdm(roles)) return;
  if (FICTIVE_MAIL_RE.test(String(email || '').trim())) {
    throw new HttpsError('failed-precondition',
      'Un administrateur doit avoir une adresse de messagerie réelle : c\'est son seul moyen de récupérer son accès s\'il perd son mot de passe. Les adresses @mavigne.app et @mavigneapp.fr ne reçoivent aucun message.',
      { reason: 'admin_needs_real_email' });
  }
}

// Hash court et non réversible de l'IP appelante (pas d'IP en clair stockée — RGPD).
function ipHash(request) {
  let raw = 'unknown';
  try {
    const rr = request && request.rawRequest;
    if (rr) {
      const xff = rr.headers && (rr.headers['x-forwarded-for'] || rr.headers['X-Forwarded-For']);
      raw = (xff ? String(xff).split(',')[0] : rr.ip) || 'unknown';
    }
  } catch (e) { /* fail-open */ }
  return crypto.createHash('sha256').update(String(raw).trim()).digest('hex').slice(0, 24);
}

// Compteur glissant par IP dans _guerettech/trial_throttle {value:{hash:{count,ts}}}.
// true = tentative autorisée, false = fenêtre saturée. Purge les entrées expirées
// à chaque passage → le doc reste petit. Exécuté côté serveur (admin SDK) → bypass rules.
async function checkAndBumpThrottle(db, key) {
  const ref = db.doc('_guerettech/trial_throttle');
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const map = (snap.exists && snap.data() && typeof snap.data().value === 'object' && snap.data().value) ? snap.data().value : {};
    for (const k of Object.keys(map)) {
      if (!map[k] || (now - map[k].ts) > THROTTLE_WINDOW_MS) delete map[k];
    }
    const e = map[key];
    if (e && (now - e.ts) <= THROTTLE_WINDOW_MS) {
      if (e.count >= THROTTLE_MAX) { tx.set(ref, { value: map }); return false; }
      e.count += 1; e.ts = now;
    } else {
      map[key] = { count: 1, ts: now };
    }
    tx.set(ref, { value: map });
    return true;
  });
}

// ── 1. gtSetTenantClaims — pose manuelle (Admin GT / dépannage) ──────
// data: { email, tenant?, ro?, gtAdmin?, demo?, adm? }
// SEC-1 : passe par mergeClaims → ne détruit plus plan / trial_until.
// Sémantique de chaque booléen : true = pose · false = RETIRE · absent = inchangé.
// tenant : chaîne = pose · null = retire · absent = inchangé.
exports.gtSetTenantClaims = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  assertGtAdmin(request);
  const { email, tenant, ro, gtAdmin, demo, adm } = request.data || {};
  if (!email) throw new HttpsError('invalid-argument', 'email requis.');
  const patch = {
    tenant:  (tenant === undefined ? undefined : (tenant === null ? null : String(tenant))),
    ro:      _tri(ro),
    gtAdmin: _tri(gtAdmin),
    demo:    _tri(demo),
    adm:     _tri(adm),
  };
  try {
    const r = await mergeClaims(email, patch);
    return { ok: true, uid: r.uid, claims: r.claims, changed: r.changed };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/user-not-found') throw new HttpsError('not-found', 'Aucun compte Auth pour ' + email);
    throw new HttpsError('internal', e.message);
  }
});

// ── 2. gtBackfillClaims — migration : pose les claims de TOUS les comptes ──
// Parcourt _guerettech/tenants {slugs:[…]} puis mavigne_<slug>/membres {value:[…]}.
// Idempotent et NON DESTRUCTIF (mergeClaims) — relançable sans risque, y compris par
// SEC-2 qui fera un backfill du même genre. À exécuter AVANT le déploiement des
// nouvelles règles Firestore (sinon les admins perdent l'écriture). data: {} → rapport.
//
// SEC-1 : pose `adm` = deriveAdm(m.roles) sur TOUS les chemins, y compris le compte GT.
// `adm` suit les rôles du doc membres, jamais une exception codée en dur : un compte
// dont on retire le rôle admin perd `adm` au prochain passage (patch adm:null).
exports.gtBackfillClaims = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 300 }, async (request) => {
  assertGtAdmin(request);
  try {
  const db = admin.firestore();
  const report = { updated: [], notFound: [], errors: [] };

  // Comptes spéciaux — fusion, jamais d'écrasement (plan / trial_until / tenant préservés).
  // Le compte démo est verrouillé en lecture seule par DEUX claims indépendants
  // (demo + ro) : les règles refusent l'écriture même si l'un des deux disparaissait.
  for (const [email, patch] of [[GT_EMAIL, { gtAdmin: true }], [DEMO_EMAIL, { demo: true, ro: true, adm: null }]]) {
    try { const r = await mergeClaims(email, patch); report.updated.push(email + ' → ' + JSON.stringify(r.claims)); }
    catch (e) { (e.code === 'auth/user-not-found' ? report.notFound : report.errors).push(email); }
  }

  // Membres de chaque tenant
  const reg = await db.doc('_guerettech/tenants').get();
  const regData = reg.exists ? reg.data() : null;
  // Le doc tenants stocke {slugs:[…]} à la racine (sans enveloppe {value}) — tolérer les deux formats
  const v = regData ? (regData.value !== undefined ? regData.value : regData) : null;
  const slugs = (v && Array.isArray(v.slugs)) ? v.slugs : (Array.isArray(v) ? v : []);
  for (const slug of slugs) {
    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) { report.errors.push('slug invalide: ' + JSON.stringify(slug)); continue; }
    let snap;
    try { snap = await db.doc('mavigne_' + slug + '/membres').get(); }
    catch (e) { report.errors.push(slug + ': ' + e.message); continue; }
    const mData = snap.exists ? snap.data() : null;
    const mVal = mData ? (mData.value !== undefined ? mData.value : mData) : null;
    const membres = Array.isArray(mVal) ? mVal : [];
    // Bac à sable public : ses membres restent en lecture seule, jamais adm.
    const isDemoTenant = (slug === DEMO_TENANT);
    for (const m of membres) {
      if (!m.email) continue;
      if (m.email === DEMO_EMAIL) continue; // déjà traité en compte spécial — ne pas le repasser en membre
      const patch = {
        tenant: slug,
        ro:  (isDemoTenant || deriveRo(m.roles)) ? true : null,
        adm: (!isDemoTenant && deriveAdm(m.roles)) ? true : null,
      };
      if (isDemoTenant) patch.demo = true;
      // Le compte GT cumule gtAdmin + tenant + adm (dérivé de ses rôles comme tout le monde).
      if (m.email === GT_EMAIL) patch.gtAdmin = true;
      try { const r = await mergeClaims(m.email, patch);
            report.updated.push(m.email + ' → ' + JSON.stringify(r.claims) + (r.changed ? '' : ' (inchangé)')); }
      catch (e) {
        if (e instanceof HttpsError) { report.errors.push(slug + ':' + m.email + ':' + e.message); continue; }
        (e.code === 'auth/user-not-found' ? report.notFound : report.errors).push(slug + ':' + m.email);
      }
    }
  }
  return report;
  } catch (e) {
    console.error('[gtBackfillClaims]', e);
    throw new HttpsError('internal', 'gtBackfillClaims: ' + (e.message || String(e)));
  }
});

// ── Plan & essai en vigueur sur un tenant (SEC-1) ─────────────────────
// createMemberAccount ne posait PAS `plan` → le nouveau membre héritait du défaut
// client `_plan() = 'domaine'` et voyait des modules non vendus, jusqu'à ce qu'on
// pense à relancer gtSetTenantPlan à la main. Ce pense-bête disparaît ici.
// Précédence : 1) claims de l'appelant s'il est du même tenant (cas courant : l'admin
// qui ajoute un membre) → plan ET essai exacts ; 2) claims d'un membre existant du
// tenant ; 3) registre de vente _guerettech/tenants.clients[slug] ; 4) 'domaine'
// (identique au défaut client, donc aucun changement de comportement).
async function _tenantPlanTrial(db, tenant, tok) {
  if (tok && tok.tenant === tenant && PLANS.includes(tok.plan)) {
    return { plan: tok.plan, trial_until: (typeof tok.trial_until === 'number' ? tok.trial_until : null) };
  }
  try {
    const snap = await db.doc('mavigne_' + tenant + '/membres').get();
    const mData = snap.exists ? snap.data() : null;
    const mVal = mData ? (mData.value !== undefined ? mData.value : mData) : null;
    const membres = Array.isArray(mVal) ? mVal : [];
    for (const m of membres) {
      if (!m || !m.email) continue;
      try {
        const u = await admin.auth().getUserByEmail(m.email);
        const c = u.customClaims || {};
        if (PLANS.includes(c.plan)) {
          return { plan: c.plan, trial_until: (typeof c.trial_until === 'number' ? c.trial_until : null) };
        }
      } catch (e) { /* compte absent : membre suivant */ }
    }
  } catch (e) { /* doc membres illisible : on retombe sur le registre */ }
  try {
    const reg = await db.doc('_guerettech/tenants').get();
    const r = reg.exists ? (reg.data() || {}) : {};
    const cli = (r.clients && typeof r.clients === 'object') ? r.clients[tenant] : null;
    if (cli && PLANS.includes(cli.plan)) return { plan: cli.plan, trial_until: null };
  } catch (e) { /* registre illisible */ }
  return { plan: 'domaine', trial_until: null };
}

// ── 3. createMemberAccount — création compte Auth + claims atomiques ──
// Remplace createUserWithEmailAndPassword côté client (app secondaire).
// Appelant : GT admin (tenant explicite) OU admin d'un tenant (son claim tenant).
// data: { email, password?, tenant?, roles? } → { uid, email, claims, password, generated }
// SEC-1 : pose `adm` (dérivé des rôles) ET `plan`/`trial_until` (hérités du tenant).
//
// SEC-2 : `password` devient FACULTATIF. Omis → le serveur génère un mot de passe
// prononçable unique (genPwd) et le renvoie à l'appelant, qui l'affiche UNE SEULE FOIS.
// Il n'est jamais stocké en clair : ni Firestore, ni claims, ni logs. Une fois l'écran
// fermé il n'existe plus nulle part — Firebase Auth n'en garde qu'un hash. Le compte
// reçoit `mustChangePwd:true` → première connexion = remplacement (completeFirstLogin).
//
// Pourquoi un CLAIM et pas un champ du doc `membres` : depuis SEC-1, `membres` est
// admin-only en écriture. Un ouvrier ne pourrait donc jamais effacer son propre drapeau
// → bloqué à l'écran de changement À VIE. Le claim n'est modifiable que par le serveur,
// et completeFirstLogin le retire pour le compte de l'appelant lui-même.
exports.createMemberAccount = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const t = request.auth && request.auth.token;
  if (!t) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const isGt = _isGtSess(t);   // SEC-GT/2 : le raccourci GT exige la session
  const { email, tenant, roles } = request.data || {};
  if (!email) throw new HttpsError('invalid-argument', 'email requis.', { authCode: 'auth/invalid-email' });
  // Mot de passe fourni = respecté (compat : rien ne casse pour un appelant existant).
  // Absent = généré ici. Dans les deux cas, mustChangePwd force le changement au 1er login.
  const _given = (request.data && request.data.password) ? String(request.data.password) : '';
  const password  = _given || genPwd();
  const generated = !_given;
  assertRealEmailForAdmin(email, roles);

  // Tenant cible : GT admin → paramètre ; sinon → claim de l'appelant (jamais le paramètre)
  // SEC-1 : créer un compte = agir sur le domaine → réservé à l'admin du domaine (adm) ou à GT.
  let target = null;
  if (isGt) target = tenant || null;
  else if (typeof t.tenant === 'string' && t.ro !== true && t.adm === true) target = t.tenant;
  if (!target) throw new HttpsError('permission-denied', 'Aucun domaine associé à votre compte (claims manquants ?).');
  if (target === DEMO_TENANT && !isGt) throw new HttpsError('permission-denied', 'Domaine de démonstration.');

  try {
    const pt = await _tenantPlanTrial(admin.firestore(), String(target), t);
    const user = await admin.auth().createUser({ email, password });
    const patch = {
      tenant: String(target),
      ro:  deriveRo(roles)  ? true : null,
      adm: deriveAdm(roles) ? true : null,
      plan: pt.plan,
      trial_until: (typeof pt.trial_until === 'number' ? pt.trial_until : null),
      mustChangePwd: true,   // SEC-2 — retiré par completeFirstLogin
    };
    const r = await mergeClaimsUid(user.uid, patch);
    // `password` remonte pour affichage unique côté admin. Jamais journalisé.
    return { uid: user.uid, email, claims: r.claims, password: password, generated: generated };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/email-already-exists')
      throw new HttpsError('already-exists', 'Email déjà utilisé.', { authCode: 'auth/email-already-in-use' });
    if (e.code === 'auth/invalid-password')
      throw new HttpsError('invalid-argument', 'Mot de passe trop faible.', { authCode: 'auth/weak-password' });
    if (e.code === 'auth/invalid-email')
      throw new HttpsError('invalid-argument', 'Email invalide.', { authCode: 'auth/invalid-email' });
    throw new HttpsError('internal', e.message);
  }
});

// ── 4. checkTrialToken — validation serveur des codes d'essai 30j ──────
// Le client n'a plus accès en lecture à _guerettech/demo_tokens.
// Sans auth (écran login). data: { code } → { ok, reason? }
exports.checkTrialToken = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const code = String((request.data && request.data.code) || '').trim().toUpperCase();
  if (!/^ESSAI-[A-Z0-9]{2}-[A-Z0-9]{4}$/.test(code)) return { ok: false, reason: 'invalid' };
  try {
    const db = admin.firestore();
    // Throttle par IP (fail-open : un incident Firestore ne bloque pas un essai légitime)
    const _allowed = await checkAndBumpThrottle(db, ipHash(request)).catch(() => true);
    if (!_allowed) return { ok: false, reason: 'throttled' };
    const snap = await db.doc('_guerettech/demo_tokens').get();
    const tokens = (snap.exists && Array.isArray(snap.data().value)) ? snap.data().value : [];
    const tok = tokens.find((x) => x.code === code && x.actif);
    if (!tok) return { ok: false, reason: 'invalid' };
    if (new Date(tok.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };
    await appendAccessLog(db, code, 'entrée').catch((e) => console.error('[checkTrialToken][log]', e));
    return { ok: true };
  } catch (e) {
    console.error('[checkTrialToken]', e);
    throw new HttpsError('internal', 'checkTrialToken: ' + (e.message || String(e)));
  }
});

// ── 5. logTrialAccess — trace serveur (choix de profil démo, etc.) ─────
// data: { code, action } — le code doit exister et être actif (anti-spam).
exports.logTrialAccess = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const code = String((request.data && request.data.code) || '').trim().toUpperCase();
  const action = String((request.data && request.data.action) || '').slice(0, 60);
  if (!/^ESSAI-[A-Z0-9]{2}-[A-Z0-9]{4}$/.test(code) || !action) return { ok: false };
  const db = admin.firestore();
  const snap = await db.doc('_guerettech/demo_tokens').get();
  const tokens = (snap.exists && Array.isArray(snap.data().value)) ? snap.data().value : [];
  if (!tokens.find((x) => x.code === code && x.actif)) return { ok: false };
  await appendAccessLog(db, code, action);
  return { ok: true };
});

// ── 6. logVisite — compteur de la démo « visite guidée » (lien public ?demo=visite)
// data: { mode:'visite', vid:'<id anonyme localStorage>' }. Best-effort, non sensible.
// Incrémente connexions + le jour ; un visiteur (vid) jamais vu → uniques++.
exports.logVisite = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const mode = (String((request.data && request.data.mode) || 'visite').replace(/[^a-z0-9_]/gi, '').slice(0, 20)) || 'visite';
  const vid = String((request.data && request.data.vid) || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 60);
  const db = admin.firestore();
  const ref = db.doc('_guerettech/demo_stats');
  const dayKey = new Date().toISOString().slice(0, 10); // AAAA-MM-JJ
  let isNew = false;
  if (vid) {
    const vref = db.doc('_guerettech/demo_stats/visitors/' + vid);
    const vsnap = await vref.get();
    isNew = !vsnap.exists;
    await vref.set({ last: admin.firestore.FieldValue.serverTimestamp(), count: admin.firestore.FieldValue.increment(1) }, { merge: true });
    if (isNew) await vref.set({ first: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  await ref.set({}, { merge: true }); // garantit l'existence du document
  const upd = {};
  upd[mode + '.connexions'] = admin.firestore.FieldValue.increment(1);
  upd[mode + '.last'] = admin.firestore.FieldValue.serverTimestamp();
  upd[mode + '.jours.' + dayKey] = admin.firestore.FieldValue.increment(1);
  if (isNew) upd[mode + '.uniques'] = admin.firestore.FieldValue.increment(1);
  await ref.update(upd);
  return { ok: true, new: isNew };
});

// ── Signalement de problème (support) — accessible CONNECTÉ ou AVANT connexion ──
// data: { desc, snapshot?, tenant?, prelogin? }
// Écrit une entrée dans mavigne_{tenant}/support_reports {value:[…]} (lisible par
// Admin GT via fbAdminRead), ou dans _guerettech/support_reports si le tenant est
// inconnu (rare), puis notifie par e-mail via l'extension « Trigger Email ».
// onCall + App Check : le jeton App Check existe dès le chargement (avant login) ;
// request.auth est absent avant connexion → on retombe sur le tenant fourni par le client.
const SUPPORT_EMAIL   = GT_EMAIL;
const MAIL_COLLECTION  = 'mail';
const REPORT_SLUG_RE   = /^[a-z0-9][a-z0-9-]*$/;
// ⚠️ AUCUN classement ici. Le client (_mvPickReportErrors dans utils.js) trie et
// tronque deja : panne reelle avant message d'ecran, puis fraicheur, puis gravite.
// Une table ERR_RANK vivait AUSSI ici et re-triait sur la seule gravite : elle
// DEFAISAIT silencieusement le classement du client, remettant en tete les toasts
// (« Cuve corrigee · 290 L » en [error]) et renvoyant les vraies pannes en bas de
// mail. Deux copies privees de la meme regle, une seule mise a jour — le cas d'ecole.
// Un vieux client qui enverrait des entrees non triees les verra affichees dans son
// propre ordre : degradation acceptable, et elle se resorbe au prochain chargement.
// Budget d'ecriture du document support_reports. Firestore plafonne un document a
// 1 MiB ; depuis que chaque entree porte son `detail`, la liste grossit plus vite.
// Un document plein ferait echouer ref.set() -> HttpsError -> le signalement serait
// perdu ET le mail jamais envoye : le canal de support entier tomberait en silence.
const REPORT_MAX_BYTES = 700000;
// Age lisible d'un horodatage ISO. Une date ISO seule oblige a compter de tete pour
// savoir si l'entree decrit le probleme signale ou une seance d'il y a deux jours.
function relAge(ts) {
  const t = Date.parse(ts || '');
  if (!t) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s <  90) return 'il y a ' + s + ' s';
  const m = Math.round(s / 60);
  if (m <  90) return 'il y a ' + m + ' min';
  const h = Math.round(m / 60);
  if (h <  36) return 'il y a ' + h + ' h';
  return 'il y a ' + Math.round(h / 24) + ' j';
}

exports.submitReport = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const d = request.data || {};
  const desc = String(d.desc || '').trim().slice(0, 2000);
  if (!desc) throw new HttpsError('invalid-argument', 'Description vide.');

  const tok = (request.auth && request.auth.token) || {};
  // tenant : claim prioritaire (connecté) sinon fourni par le client (avant connexion)
  let tenant = String(tok.tenant || d.tenant || '').toLowerCase().slice(0, 50);
  if (tenant && !REPORT_SLUG_RE.test(tenant)) tenant = '';

  const snap  = (d.snapshot && typeof d.snapshot === 'object') ? d.snapshot : {};
  const roles = Array.isArray(snap.roles)
    ? snap.roles.slice(0, 8).map((r) => String(r).slice(0, 20))
    : [];
  // Erreurs locales jointes au signalement.
  // ⚠️ `detail` porte le message brut du SDK (code Firestore, pile, refus de droits).
  //    Il etait JETE ici : le mail n'affichait que msg + page, donc jamais la CAUSE.
  //    Sans lui, un signalement client n'est pas exploitable — c'est le seul champ
  //    qui distingue « permission-denied » d'un « unavailable » transitoire.
  // Tri par GRAVITE puis par date : le client envoie les plus RECENTES, or cinq
  //    lignes [info] de synchro peuvent enterrer l'unique [error] qui explique la
  //    panne. On remonte donc le pire en tete — c'est ce qu'on lit en premier.
  // On accepte jusqu'a 12 entrees en entree pour rester compatible si le client en
  //    envoie davantage plus tard : aucun redeploiement de fonction ne sera requis.
  const recent = Array.isArray(snap.recentErrors)
    ? snap.recentErrors.slice(0, 12).map((e) => ({
        level:  String((e && e.level)  || '').slice(0, 12),
        cat:    String((e && e.cat)    || '').slice(0, 20),
        msg:    String((e && e.msg)    || '').slice(0, 300),
        detail: String((e && e.detail) || '').slice(0, 400),
        page:   String((e && e.page)   || '').slice(0, 40),
        ts:     String((e && e.ts)     || '').slice(0, 40),
        n:      Math.min(999, Math.max(1, parseInt((e && e.n), 10) || 1)),
        ui:     !!(e && e.ui),
      })).slice(0, 8)
    : [];

  const entry = {
    id:           'rp' + Date.now() + Math.random().toString(36).slice(2, 6),
    ts:           new Date().toISOString(),
    desc:         desc,
    user:         String(snap.user || '—').slice(0, 60),
    roles:        roles,
    page:         String(snap.page || '—').slice(0, 40),
    ua:           String(snap.ua || '').slice(0, 300),
    appVersion:   String(snap.appVersion || '').slice(0, 20),
    recentErrors: recent,
    prelogin:     !(request.auth && request.auth.uid),
    resolved:     false,
  };

  const db = admin.firestore();
  const ref = db.doc(tenant ? ('mavigne_' + tenant + '/support_reports') : '_guerettech/support_reports');
  try {
    const s = await ref.get();
    const data = s.exists ? s.data() : null;
    const list = (data && Array.isArray(data.value)) ? data.value : [];
    list.unshift(entry);
    if (list.length > 100) list.length = 100;
    // Garde de taille : on borne le POIDS, pas seulement le NOMBRE. On retire les
    // signalements les plus anciens jusqu'a repasser sous le budget.
    while (list.length > 1 && JSON.stringify(list).length > REPORT_MAX_BYTES) list.pop();
    await ref.set({ value: list }, { merge: true });
  } catch (e) {
    throw new HttpsError('internal', 'Enregistrement impossible.');
  }

  // Notification e-mail (best-effort : ne fait jamais échouer le signalement)
  try {
    const who = entry.user + (roles.length ? ' (' + roles.join(', ') + ')' : '');
    // Une erreur = 3 lignes : quoi / pourquoi / ou-quand. L'ancien format tenait sur
    // une ligne mais n'imprimait ni le detail (jamais recopie) ni la categorie, et
    // affichait `page` a l'endroit ou on cherche la cause — d'ou les « - — - ».
    const errLines = recent.length
      ? recent.map((e) =>
          '  - [' + (e.level || '?') + ']' + (e.ui ? ' (message d ecran)' : '') + ' ' + (e.msg || '(sans message)') +
          (e.n > 1 ? '   [x' + e.n + ']' : '') +
          (e.detail ? '\n      -> ' + e.detail : '\n      -> (pas de detail transmis)') +
          '\n      ' + (e.cat || '?') + ' | page ' + (e.page || '?') + ' | ' + (e.ts || '?') +
          (relAge(e.ts) ? ' (' + relAge(e.ts) + ')' : '')
        ).join('\n')
      : '  (aucune)';
    // ⚠️ « Gravite max » ignore les messages d'ecran. Un toast est capture sur sa
    //    COULEUR : « Cuve corrigee · 290 L » remontait en [error] alors que c'est une
    //    REUSSITE, et devenait le titre du mail. On prend la premiere vraie panne.
    const firstFault = recent.find((e) => !e.ui);
    const worst = firstFault
      ? ('[' + (firstFault.level || '?') + '] ' + (firstFault.msg || '') +
         (firstFault.n > 1 ? ' [x' + firstFault.n + ']' : '') +
         (relAge(firstFault.ts) ? ' - ' + relAge(firstFault.ts) : ''))
      : (recent.length ? '(aucune panne - uniquement des messages d ecran)' : '(aucune erreur locale)');
    const txt =
      'Nouveau signalement Ma Vigne\n\n' +
      'Domaine : '  + (tenant || '(inconnu - avant connexion)') + '\n' +
      'Membre : '   + who + '\n' +
      'Page : '     + entry.page + '\n' +
      'Appareil : ' + entry.ua + '\n' +
      'Version : '  + entry.appVersion + (entry.prelogin ? ' - AVANT CONNEXION' : '') + '\n' +
      'Gravite max : ' + worst + '\n\n' +
      'Description :\n' + desc + '\n\n' +
      'Erreurs locales (les plus graves en premier) :\n' + errLines + '\n';
    await db.collection(MAIL_COLLECTION).add({
      to: [SUPPORT_EMAIL],
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // relu par mailQueueWatchdog
      message: {
        subject: '[Ma Vigne] Signalement - ' + (tenant || 'avant connexion') + ' - ' + entry.page,
        text: txt,
      },
    });
  } catch (e) {
    // JAMAIS silencieux. Une notification perdue = un client qui attend sans que
    // personne ne le sache. console.error -> severity ERROR -> alerte GCP, canal
    // INDEPENDANT de l'extension e-mail (donc encore vivant quand elle tombe).
    console.error('[submitReport] mise en file e-mail impossible', entry.id, tenant || '(sans tenant)', e);
  }

  return { ok: true };
});

// ── Résolution d'un signalement (GT admin) — flip resolved dans le bon doc ──
// data: { id, tenant? }  (tenant vide = _guerettech/support_reports)
exports.resolveReport = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  assertGtAdmin(request);
  const id = String((request.data && request.data.id) || '').slice(0, 60);
  if (!id) throw new HttpsError('invalid-argument', 'id manquant.');
  let tenant = String((request.data && request.data.tenant) || '').toLowerCase().slice(0, 50);
  if (tenant && !REPORT_SLUG_RE.test(tenant)) throw new HttpsError('invalid-argument', 'tenant invalide.');
  const db = admin.firestore();
  const ref = db.doc(tenant ? ('mavigne_' + tenant + '/support_reports') : '_guerettech/support_reports');
  const s = await ref.get();
  const data = s.exists ? s.data() : null;
  const list = (data && Array.isArray(data.value)) ? data.value : [];
  let found = false;
  for (const r of list) { if (r && r.id === id) { r.resolved = true; found = true; break; } }
  if (found) await ref.set({ value: list }, { merge: true });
  return { ok: true, found: found };
});

// ── Plan & essai 15 jours : helper interne ────────────────────────────
const PLANS = ['essentiel', 'vigneron', 'domaine'];
const DAY_MS = 86400000;

// Pose plan + (optionnel) trial_until sur TOUS les membres d'un tenant, en
// PRÉSERVANT leurs claims existants (tenant, ro, gtAdmin…).
// trialUntil : number → pose ; null → retire (= conversion en payant) ; undefined → inchangé.
async function setTenantPlanTrial(db, tenant, plan, trialUntil) {
  const snap = await db.doc('mavigne_' + tenant + '/membres').get();
  const mData = snap.exists ? snap.data() : null;
  const mVal = mData ? (mData.value !== undefined ? mData.value : mData) : null;
  const membres = Array.isArray(mVal) ? mVal : [];
  const done = [], errs = [];
  for (const m of membres) {
    if (!m || !m.email) continue;
    try {
      // SEC-1 : mergeClaims — plan/essai seuls touchés, tenant/ro/adm/gtAdmin préservés.
      // trialUntil : number → pose · null → retire (conversion en payant) · undefined → inchangé.
      await mergeClaims(m.email, { plan: (plan || undefined), trial_until: trialUntil });
      done.push(m.email);
    } catch (e) { errs.push(m.email + ':' + (e.code || e.message)); }
  }
  return { done, errs, count: membres.length };
}

// ── 7. gtSetTenantPlan — pose/retire plan & essai sur tout un tenant (GT admin) ──
// data: { tenant, plan, trialDays? }
//   trialDays > 0  → essai : trial_until = now + trialDays*24h
//   trialDays === 0 ou null → conversion : retire trial_until (accès payant)
//   trialDays absent → ne touche pas l'essai (change juste le plan)
exports.gtSetTenantPlan = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 120 }, async (request) => {
  assertGtAdmin(request);
  const { tenant, plan, trialDays } = request.data || {};
  if (!tenant || !/^[a-z0-9][a-z0-9-]*$/.test(String(tenant))) throw new HttpsError('invalid-argument', 'tenant invalide.');
  if (plan && !PLANS.includes(plan)) throw new HttpsError('invalid-argument', 'plan invalide (essentiel|vigneron|domaine).');
  let trialUntil;
  if (trialDays === 0 || trialDays === null) trialUntil = null;
  else if (typeof trialDays === 'number' && trialDays > 0) trialUntil = Date.now() + trialDays * DAY_MS;
  try {
    const r = await setTenantPlanTrial(admin.firestore(), String(tenant), plan || null, trialUntil);
    return { ok: true, tenant: String(tenant), plan: plan || null, trialUntil: (trialUntil === undefined ? 'inchangé' : trialUntil), report: r };
  } catch (e) { throw new HttpsError('internal', e.message); }
});


// ══════════════════════════════════════════════════════════════════
// ESSAI BORNÉ — 15 jours, reconductibles UNE FOIS, puis lecture seule
// ══════════════════════════════════════════════════════════════════
// LE PROBLEME QU'ON REGLE : un essai sans borne n'oblige a rien. Personne ne
// rappelle, personne ne decide, et le domaine reste ouvert indefiniment.
//
// LA FORME : 15 jours d'ecriture. A J-3, un mail previent Nicolas — c'est LUI qui
// doit reprendre la main, pas le client qui doit y penser. A l'echeance, le client
// passe en LECTURE SEULE : il garde tout, il voit tout, il n'ecrit plus. Nicolas peut
// reconduire UNE fois, ce qui redonne 15 jours et declenche un mail « appelle-le ».
// Quinze jours apres une expiration jamais reconduite, un mail de relance part CHEZ
// LE CLIENT : le contact n'a pas eu lieu, on le provoque.
//
// ⚠️ CE QUI FAIT FOI, ET CE QUI N'EN EST QU'UNE COPIE
//    Ce qui GELE le client, c'est le claim `trial_until`, pose sur chaque membre.
//    Le registre `_guerettech/tenants.clients[slug].trialExp` en est la COPIE — celle
//    que cette veille lit, parce qu'elle ne peut pas parcourir les jetons de tous les
//    membres de tous les domaines chaque nuit. Les deux s'ecrivent dans le meme geste
//    (ici, _fcSaveAbo, agtInsTrialGo). Si un jour l'un part sans l'autre, la veille
//    se trompera de date en silence : c'est le seul point fragile de ce lot.
//
// ⚠️ LA LECTURE SEULE EST COTE NAVIGATEUR. `window._MV_LOCKED` bloque saveData ;
//    firestore.rules ne connait pas `trial_until`. C'est un frein commercial, pas
//    une serrure. Assume, et ecrit ici pour que personne ne le decouvre autrement.
const TRIAL_DAYS      = 15;                      // duree d'un essai, et d'une reconduction
const TRIAL_MAX_RENEW = 1;                       // « renouvelable une fois » — la borne
const TRIAL_WARN_D    = 3;                       // alerte a Nicolas, J-3 avant l'echeance
const TRIAL_RELANCE_D = 15;                      // relance au client, J+15 apres expiration seche
const TRIAL_MAILS_DOC = '_guerettech/trial_mails';

// ⚠️ esc() vit dans leads.js, PAS ici. L'appeler depuis claims.js passe node --check,
//    passe le chargement du module, et n'echoue qu'A L'EXECUTION — mail avale, alerte
//    jamais recue, et personne pour s'en apercevoir. Un helper local, donc.
function _trialEsc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Anti-doublon : une veille QUOTIDIENNE qui renvoie le meme mail chaque nuit est pire
// que pas de veille du tout — on cesse de les lire. Un marqueur par slug et par
// moment, pose APRES la mise en file.
async function _trialMarks(db) {
  try {
    const s = await db.doc(TRIAL_MAILS_DOC).get();
    const v = s.exists ? (s.data() || {}).value : null;
    return (v && typeof v === 'object') ? v : {};
  } catch (e) { return {}; }
}

// L'adresse du client : le premier membre qui porte le role admin, a defaut le premier
// membre tout court. Meme source que setTenantPlanTrial — un seul endroit ou se tromper.
async function _trialAdminMail(db, slug) {
  try {
    const s = await db.doc('mavigne_' + slug + '/membres').get();
    const d = s.exists ? s.data() : null;
    const v = d ? (d.value !== undefined ? d.value : d) : null;
    const membres = Array.isArray(v) ? v : [];
    const adm = membres.filter((m) => m && m.email && Array.isArray(m.roles) && m.roles.indexOf('admin') >= 0);
    const pick = adm.length ? adm[0] : membres.filter((m) => m && m.email)[0];
    return pick ? { email: String(pick.email), nom: String(pick.nom || '') } : null;
  } catch (e) { return null; }
}

function _trialJours(ms) { return Math.ceil((ms - Date.now()) / DAY_MS); }

// ── Les quatre messages ──────────────────────────────────────────
// Les trois premiers vont a Nicolas : courts, un fait et une action. Le quatrieme part
// chez le client : c'est le seul qui a besoin d'etre ecrit, pas note.
function _trialMailNico(sujet, lignes, slug) {
  const txt = lignes.join('\n') + '\n\nPanneau GUERETTECH → Clients → ' + slug + ' → Abonnement.';
  return {
    subject: sujet,
    text:    txt,
    html:    '<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;color:#14110D;font-size:15px;line-height:1.6">'
             + lignes.map((l) => '<p style="margin:0 0 8px">' + _trialEsc(l) + '</p>').join('')
             + '<p style="font-size:13px;color:#6E6456;margin-top:16px">Panneau GUERETTECH \u2192 Clients \u2192 '
             + _trialEsc(slug) + ' \u2192 Abonnement.</p></div>',
  };
}

function _trialMailRelance(domaine) {
  const t = 'Bonjour,\n\n'
    + 'Votre essai de Ma Vigne s\u2019est termine il y a deux semaines. Votre domaine est toujours '
    + 'la, avec vos parcelles, votre equipe et tout ce que vous y avez saisi : rien n\u2019a ete '
    + 'efface. Vous pouvez toujours tout consulter, simplement plus rien modifier.\n\n'
    + 'Si le moment etait mal choisi, dites-le moi : je peux vous rouvrir l\u2019ecriture le temps '
    + 'qu\u2019il faut. Et si l\u2019outil ne vous a pas convaincu, dites-le moi aussi — savoir ce qui '
    + 'a manque m\u2019est utile.\n\n'
    + 'Repondez simplement a ce message, ou appelez-moi.\n\n'
    + 'Nicolas Gueret\nMa Vigne \u2014 GUERETTECH\n06 99 42 48 59\nmavigneapp.fr';
  return {
    subject: 'Votre domaine sur Ma Vigne \u2014 ' + domaine,
    text:    t,
    html:    '<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;color:#14110D;font-size:15px;line-height:1.6">'
             + '<p>Bonjour,</p>'
             + '<p>Votre essai de Ma Vigne s\u2019est termin\u00e9 il y a deux semaines. Votre domaine est '
             + 'toujours l\u00e0, avec vos parcelles, votre \u00e9quipe et tout ce que vous y avez saisi : '
             + '<strong>rien n\u2019a \u00e9t\u00e9 effac\u00e9</strong>. Vous pouvez toujours tout consulter, simplement '
             + 'plus rien modifier.</p>'
             + '<p>Si le moment \u00e9tait mal choisi, dites-le moi : je peux vous rouvrir l\u2019\u00e9criture le '
             + 'temps qu\u2019il faut. Et si l\u2019outil ne vous a pas convaincu, dites-le moi aussi \u2014 savoir '
             + 'ce qui a manqu\u00e9 m\u2019est utile.</p>'
             + '<p>R\u00e9pondez simplement \u00e0 ce message, ou appelez-moi.</p>'
             + '<p style="margin-top:22px"><strong>Nicolas Gu\u00e9ret</strong><br>'
             + '<span style="color:#6E6456">Ma Vigne \u2014 GUERETTECH</span><br>'
             + '<span style="color:#6E6456">06 99 42 48 59 \u00b7 mavigneapp.fr</span></p></div>',
  };
}

// ── gtRenewTrial — la reconduction, UNE fois, et le mail qui suit ─
// LE GARDE-FOU EST ICI, PAS DANS L'ECRAN. Un bouton grise se contourne ; une regle
// commerciale qui ne vit que dans le rendu n'est pas une regle. gtSetTenantPlan reste
// ouvert a cote : c'est le passe-partout de Nicolas, assume, et pas le chemin normal.
exports.gtRenewTrial = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 120 }, async (request) => {
  assertGtAdmin(request);
  const tenant = String((request.data && request.data.tenant) || '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(tenant)) throw new HttpsError('invalid-argument', 'tenant invalide.');

  const db = admin.firestore();
  const regRef = db.doc('_guerettech/tenants');
  const reg = await regRef.get();
  const data = reg.exists ? (reg.data() || {}) : {};
  const clients = (data.clients && typeof data.clients === 'object') ? data.clients : {};
  const cli = clients[tenant];
  if (!cli) throw new HttpsError('not-found', 'Domaine inconnu au registre.');

  const faites = (typeof cli.trialRenewals === 'number') ? cli.trialRenewals : 0;
  if (faites >= TRIAL_MAX_RENEW) {
    throw new HttpsError('failed-precondition',
      'Essai déjà reconduit une fois. Au-delà, c\u2019est une conversion — ou l\u2019onglet Abonnement, en connaissance de cause.',
      { reason: 'max_renewals', renewals: faites });
  }

  // ⚠️ Le compte repart de MAINTENANT, pas de l'ancienne echeance. Un essai reconduit
  //    trois jours apres son terme donne bien quinze jours pleins : sinon la lenteur
  //    administrative se paie sur le temps du client, ce que ce lot existe pour eviter.
  const until = Date.now() + TRIAL_DAYS * DAY_MS;
  const plan = (PLANS.indexOf(cli.plan) >= 0) ? cli.plan : 'domaine';
  const rep = await setTenantPlanTrial(db, tenant, plan, until);

  const next = Object.assign({}, clients);
  next[tenant] = Object.assign({}, cli, {
    trialDays:     TRIAL_DAYS,
    trialExp:      until,
    trialRenewals: faites + 1,
    trialRenewedAt: new Date().toISOString(),
  });
  delete next[tenant].trialPrevu;
  await regRef.set(Object.assign({}, data, { clients: next }), { merge: true });

  // Le marqueur repart de zero : la nouvelle echeance doit pouvoir re-alerter.
  try {
    const marks = await _trialMarks(db);
    delete marks[tenant];
    await db.doc(TRIAL_MAILS_DOC).set({ value: marks }, { merge: false });
  } catch (e) { logger.warn('[trial] marqueurs non remis à zéro', e); }

  // ★ Le mail demande : « si reconduction, un mail chez moi pour que j'appelle ».
  try {
    const jusqu = new Date(until).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    await db.collection(MAIL_COLLECTION).add({
      to: [GT_EMAIL],
      message: _trialMailNico('\u{1F4DE} Essai reconduit \u2014 ' + tenant + ' : appeler le client', [
        'L\u2019essai de ' + tenant + ' est reconduit pour ' + TRIAL_DAYS + ' jours, jusqu\u2019au ' + jusqu + '.',
        'C\u2019est la reconduction unique : à cette échéance, il n\u2019y en aura pas d\u2019autre par ce chemin.',
        'Appelez le client — c\u2019est le rendez-vous que cette reconduction sert à provoquer.',
        rep && rep.count ? (rep.done.length + ' membre(s) sur ' + rep.count + ' ont reçu le nouveau jeton.') : '',
      ].filter(Boolean), tenant),
    });
  } catch (e) { logger.warn('[trial] mail de reconduction non mis en file', e); }

  logger.info('[trial] ' + tenant + ' reconduit jusqu\u2019au ' + new Date(until).toISOString());
  return { ok: true, tenant: tenant, trialUntil: until, renewals: faites + 1, report: rep };
});

// ── trialWatch — la veille quotidienne ───────────────────────────
// Trois moments, un mail chacun, jamais deux fois. Tourne a 8h05 Paris : Nicolas lit
// ses mails le matin, et une alerte J-3 qui arrive a 3h du matin se noie.
exports.trialWatch = onSchedule(
  {
    schedule:       '5 8 * * *',
    timeZone:       'Europe/Paris',
    region:         REGION,
    memory:         '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    const db = admin.firestore();
    let data;
    try {
      const reg = await db.doc('_guerettech/tenants').get();
      data = reg.exists ? (reg.data() || {}) : {};
    } catch (e) { logger.error('[trialWatch] registre illisible', e); return; }

    const clients = (data.clients && typeof data.clients === 'object') ? data.clients : {};
    const marks = await _trialMarks(db);
    const now = Date.now();
    let poses = 0;

    for (const slug of Object.keys(clients)) {
      const cli = clients[slug] || {};
      const exp = (typeof cli.trialExp === 'number') ? cli.trialExp : 0;
      if (!exp) continue;                                   // pas d'essai en cours : converti, ou jamais arme
      if (cli.status && cli.status !== 'active') continue;  // pas encore installe
      const m = marks[slug] || {};
      const j = _trialJours(exp);

      try {
        // ① J-3 — Nicolas reprend la main pendant que le client ecrit encore.
        if (j <= TRIAL_WARN_D && j > 0 && !m.j3) {
          const reste = (typeof cli.trialRenewals === 'number' ? cli.trialRenewals : 0) < TRIAL_MAX_RENEW;
          await db.collection(MAIL_COLLECTION).add({
            to: [GT_EMAIL],
            message: _trialMailNico('\u23F3 Essai \u2014 ' + slug + ' : J-' + j, [
              'L\u2019essai de ' + slug + ' se termine dans ' + j + ' jour' + (j > 1 ? 's' : '') + '.',
              'Passée cette date, le client bascule en lecture seule : il garde et consulte tout, il n\u2019écrit plus.',
              reste
                ? 'Vous pouvez encore le reconduire une fois (' + TRIAL_DAYS + ' jours de plus), ou convertir.'
                : 'La reconduction unique a déjà été utilisée : la suite, c\u2019est une conversion.',
            ], slug),
          });
          m.j3 = now; poses++;
        }

        // ② L'echeance — le client vient de passer en lecture seule.
        if (j <= 0 && !m.exp) {
          const reste = (typeof cli.trialRenewals === 'number' ? cli.trialRenewals : 0) < TRIAL_MAX_RENEW;
          await db.collection(MAIL_COLLECTION).add({
            to: [GT_EMAIL],
            message: _trialMailNico('\u26D4 Essai termin\u00e9 \u2014 ' + slug, [
              'L\u2019essai de ' + slug + ' est arrivé à échéance : le domaine est en lecture seule.',
              'Rien n\u2019est perdu — toutes ses données sont là, il les consulte normalement.',
              reste
                ? 'Reconduction possible, une seule fois, depuis l\u2019onglet Abonnement.'
                : 'Reconduction déjà utilisée. Sans conversion, une relance partira chez le client dans '
                  + TRIAL_RELANCE_D + ' jours.',
            ], slug),
          });
          m.exp = now; poses++;
        }

        // ③ J+15 sec — le contact n'a pas eu lieu, on le provoque CHEZ LE CLIENT.
        //    Condition exacte demandee : « en cas d'absence de contact entre J15 et J30 ».
        //    Le systeme ne sait pas si un coup de fil a eu lieu ; ce qu'il sait, c'est si
        //    la reconduction a ete faite. C'est ca, la trace du contact.
        const secheresse = (now - exp) / DAY_MS;
        const jamaisReconduit = ((typeof cli.trialRenewals === 'number') ? cli.trialRenewals : 0) === 0;
        if (secheresse >= TRIAL_RELANCE_D && jamaisReconduit && !m.relance) {
          const who = await _trialAdminMail(db, slug);
          if (who) {
            await db.collection(MAIL_COLLECTION).add({
              to:      [who.email],
              replyTo: GT_EMAIL,
              message: _trialMailRelance(cli.nom || slug),
            });
            await db.collection(MAIL_COLLECTION).add({
              to: [GT_EMAIL],
              message: _trialMailNico('\u{1F4EC} Relance envoy\u00e9e \u2014 ' + slug, [
                'Quinze jours de lecture seule sans reconduction : une relance vient de partir chez '
                  + (who.nom || who.email) + ' (' + who.email + ').',
                'Elle dit que ses données sont intactes et propose de rouvrir l\u2019écriture.',
                'S\u2019il répond, c\u2019est le moment de conclure.',
              ], slug),
            });
            m.relance = now; poses += 2;
          } else {
            logger.warn('[trialWatch] ' + slug + ' : aucune adresse admin, relance impossible');
          }
        }
      } catch (e) {
        // ⚠️ Un domaine qui echoue ne doit pas emporter les suivants.
        logger.error('[trialWatch] ' + slug + ' : ' + ((e && e.message) || String(e)));
      }
      marks[slug] = m;
    }

    if (poses) {
      try { await db.doc(TRIAL_MAILS_DOC).set({ value: marks }, { merge: false }); }
      catch (e) { logger.error('[trialWatch] marqueurs non écrits — RISQUE DE DOUBLON DEMAIN', e); }
    }
    logger.info('[trialWatch] ' + Object.keys(clients).length + ' domaine(s) examiné(s), ' + poses + ' mail(s) en file');
  }
);

// ── 8. activateTrial — le client active l'essai 15j sur SON domaine via un code ──
// Authentifié (admin du tenant créé à l'onboarding). data: { code }
// Le code vit dans _guerettech/demo_tokens et peut porter { plan, days, tenant? }.
// Idempotent : si un essai est déjà actif, renvoie le nb de jours restants sans relancer.
exports.activateTrial = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 120 }, async (request) => {
  const t = request.auth && request.auth.token;
  if (!t) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const isGt = (t.gtAdmin === true || t.email === GT_EMAIL);
  const code = String((request.data && request.data.code) || '').trim().toUpperCase();
  const target = isGt ? (request.data && request.data.tenant) : t.tenant;
  if (!target) throw new HttpsError('permission-denied', 'Aucun domaine associé à votre compte.');
  if (!/^ESSAI-[A-Z0-9]{2}-[A-Z0-9]{4}$/.test(code)) throw new HttpsError('invalid-argument', 'Code invalide.', { reason: 'invalid' });

  if (typeof t.trial_until === 'number' && t.trial_until > Date.now()) {
    return { ok: true, already: true, plan: t.plan || 'domaine', daysLeft: Math.ceil((t.trial_until - Date.now()) / DAY_MS) };
  }

  const db = admin.firestore();
  const _allowed = await checkAndBumpThrottle(db, ipHash(request)).catch(() => true);
  if (!_allowed) throw new HttpsError('resource-exhausted', 'Trop de tentatives, réessayez plus tard.', { reason: 'throttled' });

  const snap = await db.doc('_guerettech/demo_tokens').get();
  const tokens = (snap.exists && Array.isArray(snap.data().value)) ? snap.data().value : [];
  const idx = tokens.findIndex((x) => x.code === code && x.actif);
  if (idx < 0) throw new HttpsError('not-found', 'Code inconnu ou déjà utilisé.', { reason: 'invalid' });
  const tok = tokens[idx];
  if (tok.expires_at && new Date(tok.expires_at).getTime() < Date.now()) throw new HttpsError('failed-precondition', 'Code expiré.', { reason: 'expired' });
  if (tok.tenant && tok.tenant !== target) throw new HttpsError('permission-denied', 'Ce code est réservé à un autre domaine.', { reason: 'wrong_tenant' });

  const plan = PLANS.includes(tok.plan) ? tok.plan : 'domaine';
  const days = (typeof tok.days === 'number' && tok.days > 0) ? tok.days : 15;
  const trialUntil = Date.now() + days * DAY_MS;

  const r = await setTenantPlanTrial(db, String(target), plan, trialUntil);

  try {
    tokens[idx] = Object.assign({}, tok, { actif: false, used_by: target, used_at: new Date().toISOString() });
    await db.doc('_guerettech/demo_tokens').set({ value: tokens }, { merge: false });
  } catch (e) { console.error('[activateTrial][token]', e); }
  await appendAccessLog(db, code, 'essai activé · ' + target + ' · ' + plan).catch(() => {});

  return { ok: true, plan: plan, daysLeft: days, members: r.count, trialUntil: trialUntil };
});

// ── 9. updateMemberEmail — change l'e-mail d'un membre (admin domaine payé OU GT) ──
// data: { oldEmail, newEmail, tenant? }
// Autorisé si : GT admin ; OU appelant a un tenant, n'est pas ro, ET PAS en essai
// (pas de trial_until = abonnement actif). Le membre cible doit être du même tenant.
// SEC-1 : cette function N'ÉCRIT AUCUN CLAIM (vérifié) — les claims sont attachés à
// l'uid, pas à l'e-mail, et survivent tels quels à un updateUser({email}). Rien à
// router vers mergeClaims ici : le seul appel Auth est updateUser, pas
// setCustomUserClaims. Garde `adm` ajoutée : changer l'e-mail d'un AUTRE membre est
// une action d'administration du domaine.
exports.updateMemberEmail = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const t = request.auth && request.auth.token;
  if (!t) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const isGt = (t.gtAdmin === true || t.email === GT_EMAIL);
  const { oldEmail, newEmail } = request.data || {};
  const tenantParam = request.data && request.data.tenant;
  if (!oldEmail || !newEmail) throw new HttpsError('invalid-argument', 'oldEmail et newEmail requis.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(newEmail))) throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.', { authCode: 'auth/invalid-email' });

  let tenant = null;
  if (isGt) tenant = tenantParam || null;
  else {
    if (typeof t.tenant !== 'string') throw new HttpsError('permission-denied', 'Aucun domaine associé.');
    if (t.ro === true) throw new HttpsError('permission-denied', 'Compte en lecture seule.');
    if (t.adm !== true) throw new HttpsError('permission-denied', 'Réservé à l\'administrateur du domaine.');
    if (typeof t.trial_until === 'number') throw new HttpsError('failed-precondition', 'Disponible une fois l\'abonnement activé.', { reason: 'trial' });
    tenant = t.tenant;
  }
  if (!tenant) throw new HttpsError('invalid-argument', 'tenant requis.');

  try {
    const targetUser = await admin.auth().getUserByEmail(String(oldEmail));
    const tc = targetUser.customClaims || {};
    if (!isGt && tc.tenant !== tenant) throw new HttpsError('permission-denied', 'Ce membre n\'appartient pas à votre domaine.');
    await admin.auth().updateUser(targetUser.uid, { email: String(newEmail) });
    const db = admin.firestore();
    const ref = db.doc('mavigne_' + tenant + '/membres');
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const data = snap.data();
      const arr = (data.value !== undefined && Array.isArray(data.value)) ? data.value : (Array.isArray(data) ? data : []);
      let changed = false;
      for (const m of arr) { if (m && m.email === oldEmail) { m.email = String(newEmail); changed = true; } }
      if (changed) tx.set(ref, { value: arr });
    });
    return { ok: true, uid: targetUser.uid, email: String(newEmail) };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Cette adresse est déjà utilisée.', { authCode: 'auth/email-already-in-use' });
    if (e.code === 'auth/user-not-found') throw new HttpsError('not-found', 'Membre introuvable (' + oldEmail + ').');
    if (e.code === 'auth/invalid-email') throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.', { authCode: 'auth/invalid-email' });
    throw new HttpsError('internal', e.message);
  }
});

// ── 9bis. updateMemberRoles — repose `adm`/`ro` quand les rôles changent (SEC-1) ──
// data: { email, roles:[…], tenant? } → { ok, uid, claims, changed }
// Appelant : admin du domaine (claim adm) OU GT admin. Le membre cible doit
// appartenir au même domaine que l'appelant (GT peut viser n'importe quel domaine
// via `tenant`).
//
// Pourquoi une CF : le claim `adm` est la clé d'écriture ; le laisser dériver côté
// client reviendrait à laisser le client s'auto-promouvoir. La dérivation est faite
// ICI, par deriveAdm/deriveRo, à partir des rôles transmis — et le doc `membres`
// (admin-only en écriture, cf. firestore.rules) reste la source de vérité affichée.
//
// Appelée par reglages.js à chaque enregistrement de membre : sans elle, promouvoir
// quelqu'un administrateur ne lui donnerait AUCUN droit d'écriture tant que
// gtBackfillClaims n'a pas été relancé à la main.
exports.updateMemberRoles = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const ctx = assertTenantAdmin(request);
  const email = String((request.data && request.data.email) || '').trim();
  const roles = (request.data && request.data.roles);
  if (!email) throw new HttpsError('invalid-argument', 'email requis.');
  if (!Array.isArray(roles)) throw new HttpsError('invalid-argument', 'roles doit être un tableau.');
  if (roles.length > 8) throw new HttpsError('invalid-argument', 'Trop de rôles.');
  // SEC-2 — la promotion au rang d'admin passe aussi par ici : même garde qu'à la création.
  // Sans elle, on contournerait la règle en créant un ouvrier @mavigne.app puis en le promouvant.
  assertRealEmailForAdmin(email, roles);

  const tenant = ctx.isGt ? (String((request.data && request.data.tenant) || ctx.tenant || '')) : ctx.tenant;
  if (!tenant || !/^[a-z0-9][a-z0-9-]*$/.test(tenant)) throw new HttpsError('invalid-argument', 'tenant invalide.');
  if (tenant === DEMO_TENANT && !ctx.isGt) throw new HttpsError('permission-denied', 'Domaine de démonstration.');

  try {
    const user = await admin.auth().getUserByEmail(email);
    const tc = user.customClaims || {};
    // Un admin de domaine ne peut toucher qu'un membre de SON domaine. GT n'a pas
    // cette limite mais ne doit pas déplacer un compte d'un domaine à l'autre par
    // mégarde : si le compte porte déjà un tenant différent, on refuse.
    if (tc.tenant !== undefined && tc.tenant !== tenant) {
      throw new HttpsError('permission-denied', 'Ce membre n\'appartient pas à ce domaine.');
    }
    if (!ctx.isGt && tc.gtAdmin === true) {
      throw new HttpsError('permission-denied', 'Compte GUERETTECH — modification réservée à GUERETTECH.');
    }
    const r = await mergeClaims(email, {
      tenant: tenant,
      ro:  deriveRo(roles)  ? true : null,
      adm: deriveAdm(roles) ? true : null,
    });
    return { ok: true, uid: r.uid, claims: r.claims, changed: r.changed };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/user-not-found') throw new HttpsError('not-found', 'Aucun compte Auth pour ' + email, { reason: 'no_account' });
    throw new HttpsError('internal', e.message);
  }
});

// ── 9b. completeFirstLogin — SEC-2 : l'appelant change SON PROPRE mot de passe ──
//
// ⚠️⚠️ AUCUNE GARDE DE RÔLE — C'EST INTENTIONNEL ET STRUCTURANT.
// Ni assertTenantAdmin, ni assertGtAdmin, ni contrôle de `ro`. Un saisonnier (ro:true)
// DOIT pouvoir s'en servir : changer son propre mot de passe n'est pas une écriture de
// données, c'est un geste de compte. Exiger `adm` ou `!ro` ici enfermerait tout membre
// non-admin dans l'écran de premier login, sans issue, à vie.
// Contrainte notée depuis SEC-1 (en-tête firestore.rules) — c'est ici qu'elle s'applique.
// Ne jamais « durcir » cette function par symétrie avec les autres : ce serait la casser.
//
// Le seul contrôle est celui de l'identité : `request.auth.uid` vient du jeton vérifié
// par Firebase. L'appelant ne peut agir QUE sur son propre compte — aucun paramètre ne
// désigne la cible, il n'y a rien à falsifier.
//
// data: { newPassword } → { ok, claims }
exports.completeFirstLogin = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const pwd = String((request.data && request.data.newPassword) || '');
  if (pwd.length < 8) {
    throw new HttpsError('invalid-argument', 'Le mot de passe doit faire au moins 8 caractères.', { reason: 'too_short' });
  }
  if (pwd.length > 128) throw new HttpsError('invalid-argument', 'Mot de passe trop long.');
  try {
    const user = await admin.auth().getUser(uid);
    // Refus de « changer » pour le même mot de passe : Firebase accepterait sans broncher
    // et le drapeau tomberait sans que rien n'ait changé. On ne connaît pas l'ancien mot
    // de passe (Auth n'en garde qu'un hash) — mais s'il vient de genPwd, il a la forme
    // mot-mot-chiffres. Refuser cette forme empêche de retaper celui de l'admin.
    if (/^[a-z]+-[a-z]+-\d{3}$/.test(pwd)) {
      throw new HttpsError('invalid-argument',
        'Choisissez un mot de passe personnel, différent de celui qui vous a été communiqué.',
        { reason: 'same_as_initial' });
    }
    await admin.auth().updateUser(uid, { password: pwd });
    // Le drapeau tombe APRÈS le changement effectif : si updateUser échoue, l'utilisateur
    // reste sur l'écran de premier login et peut réessayer. Jamais l'inverse.
    const r = await mergeClaimsUid(uid, { mustChangePwd: null });
    console.log('[completeFirstLogin] ok', user.email);
    return { ok: true, claims: r.claims };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/invalid-password')
      throw new HttpsError('invalid-argument', 'Mot de passe trop faible.', { reason: 'weak' });
    throw new HttpsError('internal', e.message);
  }
});

// ── 9c. resetMemberPassword — SEC-2 : l'admin dépanne un membre de SON domaine ──
//
// C'est le remplaçant du « mot de passe oublié » pour l'équipe. Les saisonniers ont des
// adresses fictives @mavigne.app : aucun mail ne leur arrivera jamais. Leur point de
// secours n'est pas une boîte mail, c'est leur chef de culture — qui clique ici.
//
// Le nouveau mot de passe est généré, renvoyé UNE FOIS pour affichage, jamais stocké.
// mustChangePwd est reposé → le membre le remplace à sa connexion suivante, donc l'admin
// ne connaît pas le mot de passe définitif de ses ouvriers. Symétrie avec la création.
//
// data: { email, tenant? } → { ok, email, password }
exports.resetMemberPassword = onCall({ region: REGION, enforceAppCheck: true }, async (request) => {
  const ctx = assertTenantAdmin(request);
  const email = String((request.data && request.data.email) || '').trim();
  if (!email) throw new HttpsError('invalid-argument', 'email requis.');

  const tenant = ctx.isGt ? (String((request.data && request.data.tenant) || ctx.tenant || '')) : ctx.tenant;
  if (!tenant || !/^[a-z0-9][a-z0-9-]*$/.test(tenant)) throw new HttpsError('invalid-argument', 'tenant invalide.');
  if (tenant === DEMO_TENANT && !ctx.isGt) throw new HttpsError('permission-denied', 'Domaine de démonstration.');

  try {
    const user = await admin.auth().getUserByEmail(email);
    const tc = user.customClaims || {};
    // Garde-fous identiques à updateMemberRoles — un admin de domaine ne touche qu'un
    // membre de SON domaine, et personne ne réinitialise le compte GUERETTECH.
    if (tc.tenant !== undefined && tc.tenant !== tenant) {
      throw new HttpsError('permission-denied', 'Ce membre n\'appartient pas à ce domaine.');
    }
    if (!ctx.isGt && tc.gtAdmin === true) {
      throw new HttpsError('permission-denied', 'Compte GUERETTECH — modification réservée à GUERETTECH.');
    }
    const pwd = genPwd();
    await admin.auth().updateUser(user.uid, { password: pwd });
    await mergeClaimsUid(user.uid, { mustChangePwd: true });
    console.log('[resetMemberPassword] ok', email, 'par', (request.auth.token && request.auth.token.email) || '?');
    return { ok: true, email: email, password: pwd };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e.code === 'auth/user-not-found') throw new HttpsError('not-found', 'Aucun compte pour ' + email, { reason: 'no_account' });
    throw new HttpsError('internal', e.message);
  }
});

// ── 9d. gtBackfillMustChangePwd — SEC-2 : marquage des comptes EXISTANTS ──
//
// Geste unique. Pose mustChangePwd sur les comptes déjà en place — ceux qui partagent
// tous le même `vigne21` historique.
//
// ⚠️ SIMULATION PAR DÉFAUT. Sans { apply: true }, rien n'est écrit : la function renvoie
// la liste de qui SERAIT touché. C'est volontaire — marquer un domaine en pleine saison
// verte oblige toute une équipe à changer son mot de passe le matin même, dans les rangs,
// sur un téléphone. On regarde avant d'appuyer.
//
// ⚠️ LES ADMINS SONT ÉPARGNÉS (décision Nico). Deux raisons : ils ont une adresse réelle
// donc un lien de secours, et surtout ce sont eux qui dépannent les autres — les bloquer
// à un écran de changement en même temps que leur équipe supprimerait le seul recours.
//
// Volontairement SÉPARÉE de gtBackfillClaims, qui est relancé à chaque nouveau domaine :
// un paramètre qui traîne, et c'est tout le monde qu'on remarque par accident.
//
// data: { tenant?, apply? } → { apply, would, skipped, errors, note? }
exports.gtBackfillMustChangePwd = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 300 }, async (request) => {
  assertGtAdmin(request);
  const only  = String((request.data && request.data.tenant) || '').trim();
  const apply = (request.data && request.data.apply) === true;
  try {
    const db = admin.firestore();
    const report = { apply: apply, would: [], skipped: [], errors: [] };

    const reg = await db.doc('_guerettech/tenants').get();
    const regData = reg.exists ? reg.data() : null;
    const v = regData ? (regData.value !== undefined ? regData.value : regData) : null;
    let slugs = (v && Array.isArray(v.slugs)) ? v.slugs : (Array.isArray(v) ? v : []);
    if (only) slugs = slugs.filter((s) => s === only);
    if (only && !slugs.length) throw new HttpsError('not-found', 'Domaine absent du registre : ' + only);

    for (const slug of slugs) {
      if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) { report.errors.push('slug invalide: ' + JSON.stringify(slug)); continue; }
      if (slug === DEMO_TENANT) { report.skipped.push(slug + ' (démo)'); continue; }
      let snap;
      try { snap = await db.doc('mavigne_' + slug + '/membres').get(); }
      catch (e) { report.errors.push(slug + ': ' + e.message); continue; }
      const mData = snap.exists ? snap.data() : null;
      const mVal = mData ? (mData.value !== undefined ? mData.value : mData) : null;
      const membres = Array.isArray(mVal) ? mVal : [];
      for (const m of membres) {
        if (!m.email) continue;
        if (m.email === DEMO_EMAIL || m.email === GT_EMAIL) { report.skipped.push(m.email + ' (compte spécial)'); continue; }
        if (deriveAdm(m.roles)) { report.skipped.push(slug + ':' + m.email + ' (admin)'); continue; }
        try {
          if (apply) await mergeClaims(m.email, { mustChangePwd: true });
          report.would.push(slug + ':' + m.email);
        } catch (e) {
          (e.code === 'auth/user-not-found' ? report.skipped : report.errors)
            .push(slug + ':' + m.email + (e.code === 'auth/user-not-found' ? ' (pas de compte)' : ': ' + e.message));
        }
      }
    }
    if (!apply) report.note = 'SIMULATION — aucun compte modifié. Relancer avec { apply: true } pour appliquer.';
    return report;
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    console.error('[gtBackfillMustChangePwd]', e);
    throw new HttpsError('internal', 'gtBackfillMustChangePwd: ' + (e.message || String(e)));
  }
});

// ── 10. onboardTenant — création E2E d'un nouveau domaine (appelable SANS auth préalable) ──
// Le prospect ouvre le lien d'invitation (?tenant=slug) et remplit l'assistant.
// data: { slug, email, password, adminNom?, membres, parcelles, saisons, taches, config }
// Sécurité (defense-in-depth) :
//   • App Check obligatoire + throttle par IP.
//   • Le slug doit être déclaré « en attente » par GT dans _guerettech/tenants.clients
//     (ajouté via « Nouveau client ») — pas n'importe quel slug.
//   • One-shot : refus si le tenant est déjà « actif » OU si mavigne_<slug>/membres existe déjà.
// Le PLAN + l'ESSAI proviennent du registre (décision de vente posée par GT) — le prospect
// ne les choisit pas. Le compte admin est créé AVEC les claims {tenant, plan, trial_until?}
// et les docs initiaux sont écrits via l'Admin SDK (bypass des règles, qui exigeraient déjà
// le claim tenant côté client → impossible avant que le compte existe).
exports.onboardTenant = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 120 }, async (request) => {
  const d = request.data || {};
  const slug = String(d.slug || '').trim().toLowerCase();
  const email = String(d.email || '').trim();
  // Mot de passe FACULTATIF pour GUERETTECH uniquement (installation depuis le dossier
  // client) : GT ne connaît pas et ne doit pas choisir le mot de passe du client. Absent →
  // genPwd() + mustChangePwd, exactement comme createMemberAccount. Le mot de passe part
  // dans la réponse pour être affiché UNE fois côté GT, et n'est stocké nulle part.
  // Un appel public sans mot de passe reste refusé : sinon quiconque connaîtrait un slug
  // en attente pourrait créer l'admin ET recevoir ses identifiants.
  const _isGtCall = !!(request.auth && request.auth.token && request.auth.token.gtAdmin === true);
  let password = String(d.password || '');
  let pwdGenere = false;
  if (!password && _isGtCall) { password = genPwd(); pwdGenere = true; }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slug.length > 50) throw new HttpsError('invalid-argument', 'Identifiant de domaine invalide.');
  if (!email || !password) throw new HttpsError('invalid-argument', 'Email et mot de passe requis.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.', { authCode: 'auth/invalid-email' });

  const db = admin.firestore();

  // 1. Throttle par IP (fail-open : un incident Firestore ne bloque pas un onboarding légitime)
  const _allowed = await checkAndBumpThrottle(db, ipHash(request)).catch(() => true);
  if (!_allowed) throw new HttpsError('resource-exhausted', 'Trop de tentatives, réessayez plus tard.', { reason: 'throttled' });

  // 2. Le slug doit être un client « en attente » déclaré par GT
  const regRef = db.doc('_guerettech/tenants');
  const regSnap = await regRef.get();
  const reg = regSnap.exists ? (regSnap.data() || {}) : {};
  const slugs = Array.isArray(reg.slugs) ? reg.slugs.slice() : [];
  const clients = (reg.clients && typeof reg.clients === 'object') ? reg.clients : {};
  const cli = clients[slug];
  if (slugs.indexOf(slug) < 0) throw new HttpsError('not-found', 'Domaine inconnu — demandez un lien d\'invitation à GUERETTECH.', { reason: 'unknown' });
  if (cli && cli.status === 'active') throw new HttpsError('failed-precondition', 'Ce domaine est déjà configuré.', { reason: 'already' });

  // 3. Garde anti-hijack : aucun membre ne doit déjà exister pour ce tenant
  const memSnap = await db.doc('mavigne_' + slug + '/membres').get();
  if (memSnap.exists) {
    const mv = memSnap.data();
    const arr = (mv && mv.value !== undefined && Array.isArray(mv.value)) ? mv.value : (Array.isArray(mv) ? mv : []);
    if (arr.length > 0) throw new HttpsError('failed-precondition', 'Ce domaine est déjà configuré.', { reason: 'already' });
  }

  // 4. Plan & essai : depuis le registre (décision GT). Défaut : domaine, sans essai.
  const plan = (cli && PLANS.includes(cli.plan)) ? cli.plan : 'domaine';
  let trialUntil = null;
  if (cli && typeof cli.trialDays === 'number' && cli.trialDays > 0) trialUntil = Date.now() + cli.trialDays * DAY_MS;

  // 5. Compte admin + claims (reprise si un essai précédent a créé le compte mais a échoué après)
  let uid;
  try {
    const user = await admin.auth().createUser({ email, password });
    uid = user.uid;
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      try { const ex = await admin.auth().getUserByEmail(email); uid = ex.uid; }
      catch (e2) { throw new HttpsError('already-exists', 'Email déjà utilisé.', { authCode: 'auth/email-already-in-use' }); }
    } else if (e.code === 'auth/invalid-password') {
      throw new HttpsError('invalid-argument', 'Mot de passe trop faible (6 caractères minimum).', { authCode: 'auth/weak-password' });
    } else if (e.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.', { authCode: 'auth/invalid-email' });
    } else {
      throw new HttpsError('internal', e.message);
    }
  }
  // SEC-1 : le compte créé à l'onboarding EST l'administrateur du domaine → adm:true.
  // mergeClaimsUid (et non setCustomUserClaims) : si le compte préexistait (reprise
  // après un essai interrompu), ses claims ne sont pas détruits.
  await mergeClaimsUid(uid, {
    tenant: slug,
    adm: true,
    plan: (plan || undefined),
    trial_until: (trialUntil || null),
    // Mot de passe généré côté serveur = transitoire. Le client le remplace à sa première
    // connexion (completeFirstLogin), comme n'importe quel membre créé par son admin.
    mustChangePwd: (pwdGenere ? true : null),
  });

  // 6. Écriture des données initiales (Admin SDK → contourne les règles)
  const wr = async (key, value) => { await db.doc('mavigne_' + slug + '/' + key).set({ value: value }); };
  try {
    if (Array.isArray(d.membres))   await wr('membres', d.membres);
    if (Array.isArray(d.parcelles)) await wr('parcelles', d.parcelles);
    if (Array.isArray(d.saisons))   await wr('saisons', d.saisons);
    if (Array.isArray(d.taches))    await wr('taches', d.taches);
    if (d.config && typeof d.config === 'object') await wr('config', d.config);
  } catch (e) { throw new HttpsError('internal', 'Écriture des données : ' + (e.message || String(e))); }

  // 7. Marquer le client « actif » dans le registre (préserve le reste du doc)
  try {
    const nextClients = Object.assign({}, clients);
    nextClients[slug] = Object.assign({}, cli || {}, { status: 'active', plan: plan, activated_at: new Date().toISOString() });
    if (slugs.indexOf(slug) < 0) slugs.push(slug);
    await regRef.set(Object.assign({}, reg, { slugs: slugs, clients: nextClients }), { merge: true });
  } catch (e) { console.error('[onboardTenant][registre]', e); }

  return {
    ok: true, uid: uid, slug: slug, plan: plan, trialUntil: trialUntil,
    // Renvoyé UNIQUEMENT quand le serveur l'a généré (donc appel GT). À afficher une fois.
    password: (pwdGenere ? password : undefined),
  };
});

// ── 10b. gtLeads — les dossiers d'essai reçus par le formulaire public ────────
// data: { email? }  →  { leads: [ … ] }  (le plus récent d'abord)
//
// La collection `leads` est écrite par submitLead (Admin SDK) et fermée à tout client par
// les règles. Cette function est la SEULE porte de lecture, réservée à GUERETTECH : elle
// permet d'installer un domaine à partir de ce que le client a déjà répondu, au lieu de
// tout retaper depuis un e-mail.
//
// ⚠️ Aucune requête filtrée ni triée côté Firestore : lecture complète puis tri en
// mémoire. Le projet n'a AUCUN index composite et n'en veut aucun ; à l'échelle d'un
// carnet de prospects (quelques dizaines de fiches) la différence est nulle.
exports.gtLeads = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const t = request.auth && request.auth.token;
  if (!t || !_isGtSess(t)) throw new HttpsError('permission-denied', 'Réservé à GUERETTECH (session ouverte).');

  const only = String((request.data && request.data.email) || '').trim().toLowerCase();
  const db = admin.firestore();
  let snap;
  try {
    snap = await db.collection('leads').get();
  } catch (e) {
    throw new HttpsError('internal', 'Lecture des dossiers impossible : ' + (e.message || e));
  }

  const out = [];
  snap.forEach((doc) => {
    const v = doc.data() || {};
    if (only && String(v.email || '').toLowerCase() !== only) return;
    out.push({
      id:          doc.id,
      domaine:     v.domaine || '',
      email:       v.email || '',
      tel:         v.tel || '',
      region:      v.region || '',
      ville:       v.ville || '',
      cp:          v.cp || '',
      surface:     v.surface || '',
      users:       v.users || '',
      modules:     Array.isArray(v.modules) ? v.modules : [],
      commune:     v.commune || '',
      parcellaire: v.parcellaire || '',
      nbparc:      v.nbparc || '',
      perm:        v.perm || '',
      saiso:       v.saiso || '',
      engins:      v.engins || '',
      conduite:    v.conduite || '',
      cuvees:      v.cuvees || '',
      message:     v.message || '',
      attempts:    v.attempts || 1,
      createdAt:   (v.createdAt && typeof v.createdAt.toMillis === 'function') ? v.createdAt.toMillis() : 0,
    });
  });
  out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return { leads: out.slice(0, 200) };
});

// ── 11. gtDeleteTenant — suppression DÉFINITIVE d'un domaine entier (GT admin) ──
// data: { slug, guard }. guard = mot de passe de suppression (vérifié serveur par hash).
// Sécurité (defense-in-depth) :
//   • GT admin obligatoire + throttle par IP (anti-brute-force du mot de passe).
//   • marchand-grillot (production) interdit EN DUR — refus même si l'appel est forcé.
//   • Mot de passe : hash SHA-256 dans _guerettech/config.delete_guard_hash (option B).
//   • Le compte GT (et l'appelant) ne sont jamais supprimés.
// Effet IRRÉVERSIBLE : supprime tous les comptes Auth des membres + tous les docs
//   mavigne_<slug> + retire le slug du registre _guerettech/tenants.
const PROTECTED_TENANTS = ['marchand-grillot'];

exports.gtDeleteTenant = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 300 }, async (request) => {
  assertGtAdmin(request);
  const t = request.auth.token;
  const slug  = String((request.data && request.data.slug) || '').trim().toLowerCase();
  const guard = String((request.data && request.data.guard) || '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slug.length > 50) throw new HttpsError('invalid-argument', 'Identifiant de domaine invalide.');
  if (PROTECTED_TENANTS.indexOf(slug) >= 0) throw new HttpsError('permission-denied', 'Ce domaine est protégé et ne peut pas être supprimé.', { reason: 'protected' });

  const db = admin.firestore();

  // Anti-brute-force du mot de passe (fail-open : un incident Firestore ne bloque pas une suppression légitime)
  const _allowed = await checkAndBumpThrottle(db, ipHash(request)).catch(() => true);
  if (!_allowed) throw new HttpsError('resource-exhausted', 'Trop de tentatives, réessayez plus tard.', { reason: 'throttled' });

  // Mot de passe de suppression : hash SHA-256 stocké dans _guerettech/config.delete_guard_hash
  const cfgSnap = await db.doc('_guerettech/config').get();
  const cfg = cfgSnap.exists ? (cfgSnap.data() || {}) : {};
  const storedHash = typeof cfg.delete_guard_hash === 'string' ? cfg.delete_guard_hash.trim().toLowerCase() : '';
  if (!/^[a-f0-9]{64}$/.test(storedHash)) {
    throw new HttpsError('failed-precondition', 'Mot de passe de suppression non configuré (poser delete_guard_hash dans _guerettech/config).', { reason: 'no_guard' });
  }
  const given = crypto.createHash('sha256').update(guard).digest('hex');
  const ba = Buffer.from(given, 'hex');
  const bb = Buffer.from(storedHash, 'hex');
  if (ba.length !== bb.length || !crypto.timingSafeEqual(ba, bb)) {
    throw new HttpsError('permission-denied', 'Mot de passe de suppression incorrect.', { reason: 'bad_guard' });
  }

  // 1. Supprimer les comptes Auth des membres (jamais le compte GT ni l'appelant)
  const selfEmail = String(t.email || '').toLowerCase();
  let authDeleted = 0; const authErrors = [];
  try {
    const memSnap = await db.doc('mavigne_' + slug + '/membres').get();
    const mv = memSnap.exists ? memSnap.data() : null;
    const arr = (mv && mv.value !== undefined && Array.isArray(mv.value)) ? mv.value : (Array.isArray(mv) ? mv : []);
    for (const m of arr) {
      const email = (m && m.email) ? String(m.email).trim() : '';
      if (!email) continue;
      const lower = email.toLowerCase();
      if (lower === GT_EMAIL.toLowerCase() || lower === selfEmail) continue;
      try {
        const u = await admin.auth().getUserByEmail(email);
        if (u.customClaims && u.customClaims.gtAdmin === true) continue; // garde : jamais un compte GT
        await admin.auth().deleteUser(u.uid);
        authDeleted++;
      } catch (e) {
        if (e.code === 'auth/user-not-found') continue; // déjà absent
        authErrors.push(email + ':' + (e.code || e.message));
      }
    }
  } catch (e) { console.error('[gtDeleteTenant][auth]', e); }

  // 2. Supprimer tous les documents de la collection mavigne_<slug> (par lots de 400)
  let docsDeleted = 0;
  try {
    const refs = await db.collection('mavigne_' + slug).listDocuments();
    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      const chunk = refs.slice(i, i + 400);
      chunk.forEach((r) => batch.delete(r));
      await batch.commit();
      docsDeleted += chunk.length;
    }
  } catch (e) { throw new HttpsError('internal', 'Suppression des données : ' + (e.message || String(e))); }

  // 3. Retirer le slug du registre _guerettech/tenants (préserve les autres champs du doc)
  try {
    const regRef = db.doc('_guerettech/tenants');
    const regSnap = await regRef.get();
    const reg = regSnap.exists ? (regSnap.data() || {}) : {};
    if (Array.isArray(reg.slugs)) reg.slugs = reg.slugs.filter((s) => s !== slug);
    if (reg.clients && typeof reg.clients === 'object') delete reg.clients[slug];
    await regRef.set(reg);
  } catch (e) { console.error('[gtDeleteTenant][registre]', e); }

  // 4. Purger les entrées d'access_log du domaine + tracer la suppression (best-effort)
  try {
    const logRef = db.doc('_guerettech/access_log');
    const logSnap = await logRef.get();
    let list = (logSnap.exists && Array.isArray(logSnap.data().value)) ? logSnap.data().value : [];
    list = list.filter((a) => a && a.tenant !== slug);
    list.unshift({ id: 'al' + Date.now(), ts: new Date().toISOString(), tenant: 'GT',
      action: 'Domaine supprimé : ' + slug + ' (' + authDeleted + ' compte' + (authDeleted > 1 ? 's' : '') + ', ' + docsDeleted + ' doc' + (docsDeleted > 1 ? 's' : '') + ')', icon: '🗑️' });
    if (list.length > 100) list.length = 100;
    await logRef.set({ value: list });
  } catch (e) { console.error('[gtDeleteTenant][log]', e); }

  return { ok: true, slug: slug, authDeleted: authDeleted, authErrors: authErrors, docsDeleted: docsDeleted };
});

// ── 12. getLoginRoster — liste des profils pour l'écran de connexion (appelable SANS auth) ──
// Un téléphone qui n'a jamais eu de session ne peut pas lire mavigne_<slug>/membres
// (les règles exigent le claim tenant) ; l'écran de login retombait alors sur une liste
// figée (codée en dur côté client) → un membre ajouté ensuite (ex. nouveau saisonnier)
// n'avait pas de tuile. Cette function lit la liste à jour côté serveur (Admin SDK → bypass
// règles) et ne renvoie QUE les champs nécessaires à la tuile : nom, email, rôles, statut,
// couleur. Aucune autre donnée tenant. App Check obligatoire (garde principal contre l'usage
// hors application) ; aucune authentification utilisateur requise (sinon œuf-et-poule).
exports.getLoginRoster = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const slug = String((request.data && request.data.tenant) || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slug.length > 50) {
    throw new HttpsError('invalid-argument', 'tenant invalide.');
  }
  const db = admin.firestore();
  let arr = [];
  try {
    const snap = await db.doc('mavigne_' + slug + '/membres').get();
    if (snap.exists) {
      const mv = snap.data();
      arr = (mv && mv.value !== undefined && Array.isArray(mv.value)) ? mv.value
          : (Array.isArray(mv) ? mv : []);
    }
  } catch (e) {
    console.error('[getLoginRoster]', e);
    throw new HttpsError('internal', 'getLoginRoster: ' + (e.message || String(e)));
  }
  // Projection minimale : uniquement ce dont l'écran de connexion a besoin pour bâtir une tuile.
  const roster = arr
    .filter((m) => m && typeof m === 'object' && m.nom)
    .map((m) => ({
      nom:     String(m.nom),
      email:   m.email ? String(m.email) : '',
      roles:   Array.isArray(m.roles) ? m.roles : [],
      statut:  m.statut || 'Actif',
      couleur: m.couleur ? String(m.couleur) : '',
    }));
  return { roster: roster };
});

// ── 13. gtLastConnections — dernières connexions clients par domaine (GT-only, lecture) ──
//
// Source de vérité = métadonnées Firebase Auth. On privilégie lastRefreshTime (dernier
// rafraîchissement de l'ID token = dernière ACTIVITÉ réelle dans l'app, session persistante
// comprise) et on retombe sur lastSignInTime (dernier login par mot de passe) quand il manque.
// lastSignInTime seul serait trompeur : avec la persistance de session, un membre peut utiliser
// l'app quotidiennement sans retaper son mot de passe pendant des semaines.
// creationTime distingue « compte jamais ouvert » de « aucun compte Auth ».
//
// Lecture seule, réservée GT. Aucune donnée sensible : nom + rôles + horodatages.
// getUsers (batch ≤100 identifiants) → une poignée d'appels pour tous les domaines.
//
// data: { slugs?: [ "marchand-grillot", … ] }   (défaut = registre _guerettech/tenants)
//   → { tenants: { [slug]: { last: iso|null, members: [
//         { nom, roles, couleur, hasAccount, lastActive: iso|null, lastSignIn: iso|null, created: iso|null }
// ============================================================================
// SEC-GT/2 — CODE A USAGE UNIQUE PAR E-MAIL
// ============================================================================
// Pourquoi maison plutot que le MFA natif : le TOTP de Firebase Auth exige la
// mise a niveau vers Identity Platform. Ici l'extension « Trigger Email » est
// deja en place, la boite ngdevpro est deja celle de l'operateur, et le facteur
// obtenu est de meme nature : quelque chose que l'attaquant n'a pas.
//
// OU VIT LE CODE : collection `_gt_otp`, FERMEE aux clients par les rules
// (read, write: if false) — ecrite uniquement par l'Admin SDK, qui les
// contourne. C'est indispensable : un porteur du claim gtAdmin peut tout lire
// dans _guerettech ; y stocker l'empreinte du code laisserait un attaquant la
// forcer hors ligne (un million de combinaisons se testent en une seconde).
// Le meme raisonnement vaut pour `leads` et `_mv_signatures`.
//
// Le code n'est jamais stocke en clair : seule son empreinte salee l'est, et le
// document est detruit des la premiere verification reussie.

function _gtOtpHash(uid, code, salt) {
  return crypto.createHash('sha256').update(uid + ':' + code + ':' + salt).digest('hex');
}

// ── gtRequestOtp — envoie un code a la boite de l'operateur ──────────────────
// Exige l'IDENTITE seulement (sinon poule et oeuf). Idempotent quand une
// session est deja ouverte : aucun mail, aucun code, on le dit et c'est tout.
exports.gtRequestOtp = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 60 }, async (request) => {
  const t = request.auth && request.auth.token;
  const uid = request.auth && request.auth.uid;
  if (!t || !uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (!_isGtToken(t)) throw new HttpsError('permission-denied', 'R\u00e9serv\u00e9 \u00e0 GUERETTECH.');

  if (_isGtSess(t)) return { ok: true, already: true, expires: t.gts };

  const db  = admin.firestore();
  const ref = db.collection(GT_OTP_COL).doc(uid);
  const now = Date.now();

  // Anti-spam : une demande toutes les 30 s au plus. Renvoyer le meme code
  // serait plus confortable, mais rallongerait sa duree de vie utile.
  try {
    const cur = await ref.get();
    if (cur.exists) {
      const d = cur.data() || {};
      if (typeof d.sentAt === 'number' && (now - d.sentAt) < GT_OTP_COOLDOWN) {
        throw new HttpsError('resource-exhausted', 'Un code vient d\'\u00eatre envoy\u00e9 \u2014 patientez quelques secondes.');
      }
    }
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    // Lecture impossible : on continue, l'ecriture qui suit fera autorite.
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const salt = crypto.randomBytes(16).toString('hex');

  try {
    await ref.set({
      hash  : _gtOtpHash(uid, code, salt),
      salt  : salt,
      exp   : now + GT_OTP_TTL_MS,
      tries : 0,
      sentAt: now,
      email : GT_EMAIL
    });
  } catch (e) {
    throw new HttpsError('internal', 'Code non g\u00e9n\u00e9r\u00e9 : ' + (e.message || e));
  }

  // Le code figure AUSSI dans l'objet : lisible depuis la notification du
  // telephone, sans ouvrir le message. La boite est celle de l'operateur.
  const mn = Math.round(GT_OTP_TTL_MS / 60000);
  try {
    await db.collection('mail').add({
      to: [GT_EMAIL],
      message: {
        subject: 'Ma Vigne \u2014 code GUERETTECH : ' + code,
        text:
          'Code de v\u00e9rification : ' + code + '\n\n' +
          'Valable ' + mn + ' minutes, une seule fois.\n\n' +
          'Une session GUERETTECH vient d\'\u00eatre demand\u00e9e. Si ce n\'est pas vous, ' +
          'changez imm\u00e9diatement le mot de passe du compte ' + GT_EMAIL + ' : ' +
          'quelqu\'un le conna\u00eet.\n'
      }
    });
  } catch (e) {
    throw new HttpsError('internal', 'Envoi du code impossible : ' + (e.message || e));
  }

  return { ok: true, sent: true, ttlMs: GT_OTP_TTL_MS };
});

// ── gtVerifyOtp — ouvre la session en posant le claim `gts` ──────────────────
exports.gtVerifyOtp = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 60 }, async (request) => {
  const t = request.auth && request.auth.token;
  const uid = request.auth && request.auth.uid;
  if (!t || !uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (!_isGtToken(t)) throw new HttpsError('permission-denied', 'R\u00e9serv\u00e9 \u00e0 GUERETTECH.');

  const code = String((request.data && request.data.code) || '').replace(/\D/g, '');
  if (code.length !== 6) throw new HttpsError('invalid-argument', 'Code \u00e0 6 chiffres attendu.');

  const db  = admin.firestore();
  const ref = db.collection(GT_OTP_COL).doc(uid);
  const now = Date.now();

  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Aucun code en attente \u2014 demandez-en un nouveau.');
  const d = snap.data() || {};

  if (typeof d.exp !== 'number' || d.exp < now) {
    await ref.delete().catch((e) => { logger.warn('[gtVerifyOtp] purge code expire', e && e.message); });
    throw new HttpsError('deadline-exceeded', 'Code expir\u00e9 \u2014 demandez-en un nouveau.');
  }
  if ((d.tries || 0) >= GT_OTP_MAX_TRY) {
    await ref.delete().catch((e) => { logger.warn('[gtVerifyOtp] purge trop d essais', e && e.message); });
    throw new HttpsError('resource-exhausted', 'Trop de tentatives \u2014 demandez un nouveau code.');
  }

  // Comparaison a duree constante : une comparaison naive de chaines fuit la
  // position du premier caractere faux.
  const attendu = Buffer.from(String(d.hash || ''), 'utf8');
  const fourni  = Buffer.from(_gtOtpHash(uid, code, String(d.salt || '')), 'utf8');
  const bon = attendu.length === fourni.length && crypto.timingSafeEqual(attendu, fourni);

  if (!bon) {
    const reste = GT_OTP_MAX_TRY - ((d.tries || 0) + 1);
    await ref.update({ tries: (d.tries || 0) + 1 }).catch((e) => { logger.warn('[gtVerifyOtp] compteur', e && e.message); });
    throw new HttpsError('permission-denied',
      reste > 0 ? ('Code incorrect \u2014 ' + reste + ' essai' + (reste > 1 ? 's' : '') + ' restant' + (reste > 1 ? 's' : '') + '.')
                : 'Code incorrect \u2014 demandez un nouveau code.');
  }

  const gts = now + GT_SESSION_MS;
  await mergeClaimsUid(uid, { gts });
  await ref.delete().catch((e) => { logger.warn('[gtVerifyOtp] purge apres succes', e && e.message); });
  logger.info('[gtVerifyOtp] session GT ouverte jusqu a ' + new Date(gts).toISOString());

  // ⚠️ Le client doit rafraichir son jeton (getIdToken(true)) : sans cela le
  // claim `gts` n'apparait pas avant l'expiration naturelle, et les rules
  // continuent de refuser.
  return { ok: true, expires: gts, refresh: true };
});

// ── gtEndSession — refermer franchement, sans attendre l'expiration ──────────
exports.gtEndSession = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const t = request.auth && request.auth.token;
  const uid = request.auth && request.auth.uid;
  if (!t || !uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (!_isGtToken(t)) throw new HttpsError('permission-denied', 'R\u00e9serv\u00e9 \u00e0 GUERETTECH.');
  await mergeClaimsUid(uid, { gts: null });
  await admin.firestore().collection(GT_OTP_COL).doc(uid).delete()
    .catch((e) => { logger.warn('[gtEndSession] purge otp', e && e.message); });
  return { ok: true };
});

//       ] } } }
exports.gtLastConnections = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 60 }, async (request) => {
  assertGtAdmin(request);
  const db = admin.firestore();
  const iso = (v) => { try { return v ? new Date(v).toISOString() : null; } catch (e) { return null; } };

  // 1) Résoudre la liste des slugs (paramètre, sinon registre _guerettech/tenants).
  let slugs = Array.isArray(request.data && request.data.slugs) ? request.data.slugs : null;
  if (!slugs) {
    try {
      const gt = await db.doc('_guerettech/tenants').get();
      const d = gt.exists ? gt.data() : {};
      slugs = Array.isArray(d.slugs) ? d.slugs
            : (d.value && Array.isArray(d.value.slugs) ? d.value.slugs : []);
    } catch (e) { slugs = []; }
  }
  slugs = slugs
    .map((s) => String(s || '').trim().toLowerCase())
    .filter((s) => /^[a-z0-9][a-z0-9-]*$/.test(s) && s.length <= 50);
  if (slugs.indexOf('marchand-grillot') < 0) slugs.unshift('marchand-grillot');
  slugs = slugs.filter((s, i) => slugs.indexOf(s) === i);

  // 2) Lire les membres de chaque domaine (Admin SDK → contourne les règles).
  const perTenant = {};   // slug -> [ {nom,roles,couleur,email} ]
  const emailSet = {};    // email (minuscule) -> true
  for (const slug of slugs) {
    let arr = [];
    try {
      const snap = await db.doc('mavigne_' + slug + '/membres').get();
      if (snap.exists) {
        const mv = snap.data();
        arr = (mv && Array.isArray(mv.value)) ? mv.value : (Array.isArray(mv) ? mv : []);
      }
    } catch (e) { arr = []; }
    const list = arr
      .filter((m) => m && typeof m === 'object' && m.nom)
      .map((m) => ({
        nom:     String(m.nom),
        roles:   Array.isArray(m.roles) ? m.roles : [],
        couleur: m.couleur ? String(m.couleur) : '',
        email:   m.email ? String(m.email).trim().toLowerCase() : '',
      }));
    perTenant[slug] = list;
    list.forEach((m) => { if (m.email) emailSet[m.email] = true; });
  }

  // 3) Résoudre les comptes Auth en un minimum d'appels (getUsers, ≤100 ids/appel).
  const emails = Object.keys(emailSet);
  const authByEmail = {};   // email -> { lastActive, lastSignIn, created }
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({ email: e }));
    let res;
    try { res = await admin.auth().getUsers(chunk); }
    catch (e) { res = { users: [] }; }
    (res.users || []).forEach((u) => {
      const key = u.email ? u.email.toLowerCase() : '';
      if (!key) return;
      const md = u.metadata || {};
      const refresh = iso(md.lastRefreshTime);
      const signin  = iso(md.lastSignInTime);
      authByEmail[key] = { lastActive: refresh || signin || null, lastSignIn: signin, created: iso(md.creationTime) };
    });
  }

  // 4) Assembler par domaine + calculer le max (dernière connexion du domaine).
  const out = {};
  for (const slug of slugs) {
    const members = perTenant[slug].map((m) => {
      const a = m.email ? authByEmail[m.email] : null;
      return {
        nom: m.nom, roles: m.roles, couleur: m.couleur,
        hasAccount: !!a,
        lastActive: a ? a.lastActive : null,
        lastSignIn: a ? a.lastSignIn : null,
        created:    a ? a.created : null,
      };
    });
    let last = null;
    members.forEach((m) => {
      if (m.lastActive && (!last || new Date(m.lastActive) > new Date(last))) last = m.lastActive;
    });
    out[slug] = { last: last, members: members };
  }

  return { tenants: out };
});

// ── 10. acceptTerms — SEC-DPA : acceptation CGV + DPA à la 1ère ouverture ──
//
// L'administrateur du domaine confirme, au nom du domaine, les Conditions Générales ET
// l'Accord de traitement des données (art. 28 RGPD). L'acceptation forme le contrat de
// sous-traitance : rien n'est envoyé au client à signer, le consentement est capté dans
// l'app, journalisé côté serveur, et la preuve sort du tenant.
//
// ⚠️ La preuve vit dans _mv_signatures/{slug}, écrite ICI par l'Admin SDK (contourne les
// rules). firestore.rules refuse toute écriture client sur cette collection (write:if false)
// → le signataire, qui EST l'admin, ne peut ni réécrire ni effacer sa propre preuve.
//
// Ancrage sur l'UID (request.auth.uid), jamais sur l'e-mail : les ouvriers passent d'une
// adresse générique d'essai à leur vraie adresse, la preuve ne bouge pas.
//
// Le hash SHA-256 est recalculé SERVEUR sur le document RÉELLEMENT servi (fetch du fichier
// hébergé) : c'est lui qui atteste QUELLE version du texte a été acceptée. Un hash fourni
// par le client ne prouverait rien.
//
// data: { cgvVersion, dpaVersion, nom, fonction, client:{raison_sociale,siret,adresse,cp_ville} }
//   → { ok, ref, at, hashCgv, hashDpa, cgvVersion, dpaVersion }
const TERMS_CGV_CUR  = '1.1';
const TERMS_DPA_CUR  = '1.0';
const TERMS_BASE_URL = 'https://mavigneapp.fr';

async function sha256Url(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new HttpsError('unavailable', 'Document indisponible (' + res.status + ') : ' + url);
  const buf = Buffer.from(await res.arrayBuffer());
  return crypto.createHash('sha256').update(buf).digest('hex');
}

exports.acceptTerms = onCall({ region: REGION, enforceAppCheck: true, timeoutSeconds: 30 }, async (request) => {
  const ctx = assertTenantAdmin(request);            // admin du domaine OU GT
  const uid = request.auth.uid;
  const tok = request.auth.token || {};
  const slug = ctx.tenant;
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new HttpsError('failed-precondition', 'Aucun domaine associé à votre compte.');
  }
  if (slug === DEMO_TENANT && !ctx.isGt) {
    throw new HttpsError('permission-denied', 'Domaine de démonstration.');
  }
  const d = request.data || {};
  // Les versions demandées doivent être les versions courantes servies : on n'enregistre
  // jamais l'acceptation d'un texte plus ancien que celui réellement affiché.
  if (String(d.cgvVersion || '') !== TERMS_CGV_CUR || String(d.dpaVersion || '') !== TERMS_DPA_CUR) {
    throw new HttpsError('failed-precondition', 'Version des documents obsolète — rechargez la page.', { reason: 'stale_version' });
  }
  const client = (d.client && typeof d.client === 'object') ? d.client : {};
  const rs    = String(client.raison_sociale || '').trim().slice(0, 200);
  const siret = String(client.siret || '').replace(/\D/g, '').slice(0, 14);
  const adr   = String(client.adresse || '').trim().slice(0, 300);
  const cpv   = String(client.cp_ville || '').trim().slice(0, 120);
  const fct   = String(d.fonction || '').trim().slice(0, 120);
  if (!rs)  throw new HttpsError('invalid-argument', 'Raison sociale requise.', { reason: 'no_rs' });
  if (siret.length !== 14) throw new HttpsError('invalid-argument', 'SIRET à 14 chiffres requis.', { reason: 'bad_siret' });
  if (!adr) throw new HttpsError('invalid-argument', 'Adresse du siège requise.', { reason: 'no_adr' });
  if (!fct) throw new HttpsError('invalid-argument', 'Fonction du signataire requise.', { reason: 'no_fct' });

  // Empreintes des documents réellement servis (atteste la version exacte du texte accepté).
  let hashCgv, hashDpa;
  try {
    hashCgv = await sha256Url(TERMS_BASE_URL + '/cgu.html');
    hashDpa = await sha256Url(TERMS_BASE_URL + '/dpa.html');
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError('unavailable', 'Impossible de vérifier les documents : ' + (e.message || e));
  }

  const db  = admin.firestore();
  const at  = Date.now();
  const ref = 'MV-' + new Date(at).getFullYear() + '-' + crypto.randomInt(1000, 10000);
  const email = String(tok.email || '');
  const nom   = String(d.nom || tok.name || '').trim().slice(0, 120);

  const proof = {
    slug: slug,
    accepted: true,
    ref: ref,
    ts: admin.firestore.FieldValue.serverTimestamp(),
    ts_ms: at,
    uid: uid,
    email_at_signing: email,
    signataire: { nom: nom, fonction: fct },
    client: { raison_sociale: rs, siret: siret, adresse: adr, cp_ville: cpv },
    docs: {
      cgv: { version: TERMS_CGV_CUR, hash: hashCgv },
      dpa: { version: TERMS_DPA_CUR, hash: hashDpa },
    },
    ip_hash: ipHash(request),
    user_agent: String((request.rawRequest && request.rawRequest.headers && request.rawRequest.headers['user-agent']) || '').slice(0, 300),
  };

  try {
    // Preuve HORS tenant, écriture Admin SDK (bypass rules). set = un doc par slug.
    await db.doc('_mv_signatures/' + slug).set(proof);
  } catch (e) {
    throw new HttpsError('internal', 'Enregistrement de la preuve impossible : ' + (e.message || e));
  }

  // Claim d'accès léger (~55 o) : versions acceptées + réf + horodatage. Le gating client
  // le lit ; il n'est visible qu'après rafraîchissement du jeton (fait côté client).
  try {
    await mergeClaimsUid(uid, { terms: { c: TERMS_CGV_CUR, d: TERMS_DPA_CUR, r: ref, t: at } });
  } catch (e) {
    // La preuve est déjà écrite ; un échec de claim ne doit pas perdre l'acceptation.
    console.error('[acceptTerms] claim', e);
  }

  // Reçu par e-mail au signataire (extension Trigger Email → collection mail, Admin SDK).
  if (email && !FICTIVE_MAIL_RE.test(email)) {
    try {
      const dt = new Date(at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
      await db.collection('mail').add({
        to: [email],
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // relu par mailQueueWatchdog
        message: {
          subject: 'Ma Vigne — reçu d\'acceptation (CGU + DPA) · ' + rs,
          text:
            'Bonjour,\n\n'
            + 'Votre acceptation des conditions de Ma Vigne a bien été enregistrée.\n\n'
            + 'Domaine : ' + rs + ' (SIRET ' + siret + ')\n'
            + 'Signataire : ' + (nom || email) + (fct ? (' — ' + fct) : '') + '\n'
            + 'Date : ' + dt + ' (heure de Paris)\n'
            + 'Référence : ' + ref + '\n\n'
            + 'Documents acceptés :\n'
            + '  - CGU v' + TERMS_CGV_CUR + ' — empreinte SHA-256 : ' + hashCgv + '\n'
            + '  - DPA v' + TERMS_DPA_CUR + ' — empreinte SHA-256 : ' + hashDpa + '\n\n'
            + 'Ces empreintes attestent la version exacte des textes acceptés. Vous pouvez les\n'
            + 'consulter à tout moment : https://mavigneapp.fr/cgu.html et https://mavigneapp.fr/dpa.html\n\n'
            + 'GUERETTECH — Nicolas GUÉRET · SIRET 982 148 116 00022 · ngdevpro@gmail.com\n',
        },
      });
    } catch (e) { console.error('[acceptTerms] mail', e); }
  }

  // Copie de suivi à GUERETTECH (preuve côté Prestataire + signal commercial de conversion).
  try {
    await db.collection('mail').add({
      to: [GT_EMAIL],
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // relu par mailQueueWatchdog
      message: {
        subject: 'Ma Vigne — DPA accepté · ' + slug,
        text: 'Domaine ' + slug + ' — ' + rs + ' (SIRET ' + siret + ')\n'
          + 'Signataire : ' + (nom || email) + (fct ? (' — ' + fct) : '') + '\n'
          + 'Réf : ' + ref + ' · le ' + new Date(at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) + '\n'
          + 'CGU v' + TERMS_CGV_CUR + ' / DPA v' + TERMS_DPA_CUR + '\n',
      },
    });
  } catch (e) { console.error('[acceptTerms] copie GT non mise en file', slug, e); }

  console.log('[acceptTerms] ok', slug, ref, email);
  return { ok: true, ref: ref, at: at, hashCgv: hashCgv, hashDpa: hashDpa, cgvVersion: TERMS_CGV_CUR, dpaVersion: TERMS_DPA_CUR };
});


// Format identique à fbLogDemoAccess / agtLogAccess — cap 100 entrées.
async function appendAccessLog(db, code, action) {
  const ref = db.doc('_guerettech/access_log');
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const list = (snap.exists && Array.isArray(snap.data().value)) ? snap.data().value : [];
    list.unshift({ id: 'al' + Date.now(), ts: new Date().toISOString(),
                   tenant: 'essai:' + code, action: 'Essai ' + code + ' — ' + action, icon: '🎫' });
    if (list.length > 100) list.length = 100;
    tx.set(ref, { value: list });
  });
}

// ════════════════════════════════════════════════════════════════════
// SURVEILLANCE DE LA FILE E-MAIL (« Trigger Email ») — 26/07/2026
// ════════════════════════════════════════════════════════════════════
// INCIDENT FONDATEUR : plus AUCUN e-mail ne partait — ni signalement de support,
// ni reçu de signature CGU/DPA, ni lead du site. Les documents étaient pourtant
// bien écrits dans `mail` par ce fichier : c'est l'extension qui ne les traitait
// plus (Eventarc -> Cloud Run refusé en HTTP 403, permission `run.routes.invoke`
// manquante sur le service ext-firestore-send-email-processQueue).
// Aucun code n'a échoué, donc rien n'a été signalé : côté application, envoyer un
// e-mail se réduit à écrire un document, et une délégation muette est
// indistinguable d'un succès. Même famille que logError qui écrivait dans une
// collection interdite, ou que les catch{} vides.
//
// Ce chien de garde ferme le trou : il relit la file une fois par heure et écrit
// en console.error si des documents restent non remis. Le canal d'alerte GCP
// (severity >= ERROR -> ngdevpro@gmail.com) est INDÉPENDANT de l'extension : il
// reste donc vivant précisément quand elle tombe.
//
// LECTURE D'UN DOCUMENT `mail` :
//   aucun champ `delivery`        -> l'extension ne l'a jamais vu (trigger cassé)
//   delivery.state === 'ERROR'    -> SMTP refusé (souvent mot de passe
//                                    d'application Gmail révoqué)
//   delivery.state === 'SUCCESS'  -> remis au serveur sortant
const MAIL_STUCK_MIN  = 15;   // au-delà, un document non remis est anormal
const MAIL_SCAN_LIMIT = 300;  // la file est petite ; plafond de sécurité

exports.mailQueueWatchdog = onSchedule(
  {
    schedule:       '7 * * * *',   // toutes les heures, à hh:07
    timeZone:       'Europe/Paris',
    region:         REGION,
    memory:         '256MiB',
    timeoutSeconds: 60,
  },
  async () => {
    const db = admin.firestore();
    const cutoff = Date.now() - MAIL_STUCK_MIN * 60000;
    let snap;
    try {
      snap = await db.collection(MAIL_COLLECTION).limit(MAIL_SCAN_LIMIT).get();
    } catch (e) {
      console.error('[mailQueueWatchdog] lecture de la file impossible', e);
      return;
    }

    const stuck  = [];  // écrits depuis la pose de createdAt, non remis ou en erreur
    const legacy = [];  // antérieurs au suivi : non remis, âge inconnu
    snap.forEach((doc) => {
      const d   = doc.data() || {};
      const del = d.delivery || null;
      const st  = (del && del.state) ? String(del.state) : '';
      if (st === 'SUCCESS') return;
      const it = {
        id:    doc.id,
        state: st || '(aucun champ delivery)',
        to:    Array.isArray(d.to) ? d.to.join(',') : String(d.to || ''),
      };
      const ms = (d.createdAt && typeof d.createdAt.toMillis === 'function') ? d.createdAt.toMillis() : 0;
      if (!ms) { legacy.push(it); return; }
      if (ms < cutoff) stuck.push(it);
    });

    if (stuck.length) {
      console.error('[mailQueueWatchdog] file e-mail bloquée : ' + stuck.length
        + ' document(s) non remis depuis plus de ' + MAIL_STUCK_MIN + ' min'
        + (legacy.length ? ' (+ ' + legacy.length + ' antérieur(s) au suivi)' : '')
        + ' - vérifier l\'extension Trigger Email (droits run.invoke, SMTP).',
        stuck.slice(0, 10));
      return;
    }
    if (legacy.length) {
      console.warn('[mailQueueWatchdog] ' + legacy.length
        + ' document(s) e-mail non remis antérieurs au suivi - à rejouer ou à supprimer.',
        legacy.slice(0, 10));
    }
  }
);
