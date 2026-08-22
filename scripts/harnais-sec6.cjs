#!/usr/bin/env node
'use strict';
// ── HARNAIS SEC-6 : HSTS complet + débit borné sur les deux endpoints publics ─
//
// Ce que le lot promet, et que ce harnais mesure :
//   1. firebase.json sert un HSTS complet (max-age 1 an + includeSubDomains + preload).
//   2. Le throttle est appelé sur les DEUX endpoints — compté, pas « au moins une fois ».
//   3. Le honeypot passe TOUJOURS avant le throttle, dans les deux fonctions.
//   4. La limite est lue depuis une constante nommée, jamais écrite en dur.
//   5. La fenêtre est ÉGALE à celle de claims.js (sinon sa purge écrase la nôtre).
//   6. Le compteur est interopérable : les deux implémentations tournent sur le
//      MÊME document sans se détruire, et les clés préfixées ne se mélangent pas.
//   7. ipHashReq lit bien une requête onRequest (le piège rawRequest de claims.js).
//   8. CONTRE-ÉPREUVE VIVANTE : on franchit le seuil pour de vrai, et on mesure —
//      status 200, aucune écriture en base, une trace WARNING côté serveur.
//
// ⚠️ MÉTHODE : on CHARGE le vrai module et on APPELLE les vrais handlers avec un
// Firestore en mémoire. On ne cherche pas un motif de texte : trois contre-épreuves
// d'un lot précédent étaient fausses parce qu'une autre ligne du même fichier
// satisfaisait déjà la phrase cherchée (§53).
// ⚠️ Chemin : __dirname, jamais new URL(...).pathname — sous Windows il rend
// /C:/Users/... que Node repart en C:\C:\Users\... (§53, vécu chez Nico).
// ⚠️ Un CRASH doit être ROUGE : tout est sous try/catch avec process.exitCode.
//
// Mutation pour la contre-épreuve : MV_SEC6_MUT=<nom> (voir harnais-sec6-contre.cjs).

const fs     = require('node:fs');
const os     = require('node:os');
const path   = require('node:path');
const Module = require('node:module');

const RACINE = path.join(__dirname, '..');
const lire   = (rel) => fs.readFileSync(path.join(RACINE, rel), 'utf8');

let ok = 0, ko = 0;
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };
function verifie(nom, cond, detail) {
  if (cond) { ok++; console.log('  ' + c.g('✓') + ' ' + nom); }
  else { ko++; console.log('  ' + c.r('✗') + ' ' + nom + (detail ? c.d('  → ' + detail) : '')); }
}
function decoupe(src, debut, fin, quoi) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('borne de début introuvable pour ' + quoi + ' : ' + debut);
  const j = src.indexOf(fin, i + debut.length);
  if (j < 0) throw new Error('borne de fin introuvable pour ' + quoi + ' : ' + fin);
  return src.slice(i, j + fin.length);
}

// ═══ Firestore en mémoire ════════════════════════════════════════════════════
// Assez pour ce que leads.js fait réellement : un doc unique pour le compteur,
// une collection `leads` indexée par hash, une file `mail` en tableau.
function fauxFirestore() {
  const docs = new Map();      // chemin -> data
  const mails = [];
  const FieldValue = {
    serverTimestamp: () => ({ __ts: true }),
    increment: (n) => ({ __inc: n }),
  };
  const applique = (cible, patch) => {
    const out = Object.assign({}, cible);
    for (const k of Object.keys(patch)) {
      const v = patch[k];
      if (v && v.__inc !== undefined) out[k] = (typeof out[k] === 'number' ? out[k] : 0) + v.__inc;
      else out[k] = v;
    }
    return out;
  };
  const refDe = (chemin) => ({ __path: chemin });
  const db = {
    __docs: docs, __mails: mails,
    doc: (p) => refDe(p),
    collection: (nom) => ({
      doc: (id) => refDe(nom + '/' + id),
      add: async (o) => { mails.push({ col: nom, data: o }); return refDe(nom + '/' + String(mails.length)); },
    }),
    runTransaction: async (fn) => {
      const tx = {
        get: async (ref) => {
          const d = docs.get(ref.__path);
          return { exists: d !== undefined, data: () => d };
        },
        set: (ref, o, opt) => {
          docs.set(ref.__path, (opt && opt.merge) ? applique(docs.get(ref.__path) || {}, o) : applique({}, o));
        },
        update: (ref, o) => { docs.set(ref.__path, applique(docs.get(ref.__path) || {}, o)); },
      };
      return fn(tx);
    },
  };
  return { db, FieldValue, mails, docs };
}

// ═══ Chargement du vrai module, dépendances Firebase remplacées ══════════════
function chargeLeads(mutation) {
  let src = lire('functions/leads.js');
  if (mutation) src = mutation(src);

  const fichier = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sec6-')), 'leads.js');
  fs.writeFileSync(fichier, src, 'utf8');

  const F = fauxFirestore();
  const journal = [];
  const logger = {
    info:  (...a) => journal.push({ niv: 'info',  txt: a.map(String).join(' ') }),
    warn:  (...a) => journal.push({ niv: 'warn',  txt: a.map(String).join(' ') }),
    error: (...a) => journal.push({ niv: 'error', txt: a.map(String).join(' ') }),
  };
  const admin = { apps: [{}], initializeApp: () => {}, firestore: () => F.db };
  admin.firestore.FieldValue = F.FieldValue;

  const origLoad = Module._load;
  Module._load = function (dem) {
    if (dem === 'firebase-functions/v2/https') return { onRequest: (o, h) => ({ __opts: o, __handler: h }) };
    if (dem === 'firebase-functions')          return { logger };
    if (dem === 'firebase-admin')              return admin;
    return origLoad.apply(this, arguments);
  };
  let mod;
  try { mod = require(fichier); } finally { Module._load = origLoad; }
  return { mod, F, journal, src };
}

// Une requête POST comme Cloud Run la présente derrière Firebase Hosting.
function faussReq(corps, ip) {
  return {
    method: 'POST',
    body: corps,
    ip: '169.254.1.1',                                   // l'IP du proxy, pas celle du client
    headers: { 'x-forwarded-for': (ip || '82.64.10.7') + ', 35.191.0.2', 'user-agent': 'harnais' },
  };
}
function faussRes() {
  const r = { code: 0, corps: null };
  r.status = (n) => { r.code = n; return r; };
  r.json   = (o) => { r.corps = o; return r; };
  r.send   = (o) => { r.corps = o; return r; };
  return r;
}

const MUTATIONS = {
  // Contre-épreuve : le throttle disparaît de submitLead.
  'throttle-absent-lead': (s) => s.replace(
    "    if (!(await debitOk(admin.firestore(), req, 'lead'))) {\n      res.status(200).json({ status: 'created' });\n      return;\n    }", ''),
  // Contre-épreuve : le throttle passe AVANT le honeypot dans la mise en route.
  'ordre-inverse-mer': (s) => {
    const hp = "    if (clip(b.hp, 200)) { res.status(200).json({ status: 'saved' }); return; }";
    const th = "    if (!(await debitOk(admin.firestore(), req, 'mise-en-route'))) {\n      res.status(200).json({ status: 'saved' });\n      return;\n    }";
    return s.replace(hp, '@@HP@@').replace(th, hp).replace('@@HP@@', th);
  },
  // Contre-épreuve : la limite revient en dur dans le corps de la fonction.
  'limite-en-dur': (s) => s.replace('if (e.count >= PUBLIC_THROTTLE_MAX)', 'if (e.count >= 30)'),
  // Contre-épreuve : la fenêtre s'allonge et se fait purger par claims.js.
  'fenetre-divergente': (s) => s.replace('const THROTTLE_WINDOW_MS  = 15 * 60 * 1000;', 'const THROTTLE_WINDOW_MS  = 60 * 60 * 1000;'),
  // Contre-épreuve : on recopie ipHash() de claims.js, qui lit request.rawRequest.
  'iphash-rawrequest': (s) => s.replace(
    "    const h = (req && req.headers) || {};", "    const h = (req && req.rawRequest && req.rawRequest.headers) || {};"),
  // Contre-épreuve : le refus devient visible du client.
  'refus-visible': (s) => s.replace("      res.status(200).json({ status: 'created' });\n      return;\n    }",
                                    "      res.status(429).json({ error: 'too_many' });\n      return;\n    }"),
};

const nomMut = process.env.MV_SEC6_MUT || '';
if (nomMut && !MUTATIONS[nomMut]) { console.error('mutation inconnue : ' + nomMut); process.exit(2); }
if (nomMut) console.log(c.d('  [mutation active : ' + nomMut + ']'));

const SRC_LEADS  = nomMut ? MUTATIONS[nomMut](lire('functions/leads.js')) : lire('functions/leads.js');
const SRC_CLAIMS = lire('functions/claims.js');

// ★★★ ÉTAT HSTS — RÉSOLU LE 22/08/2026. LIRE AVANT DE TOUCHER À CETTE LIGNE. ★★★
// Ce qui s'est passé : au moment de livrer SEC-6, https://www.mavigneapp.fr rendait
// « le certificat de sécurité ne correspond pas ». Le CNAME www existait chez OVH et
// pointait sur l'apex, mais www n'était PAS déclaré comme domaine personnalisé dans
// Firebase Hosting — aucun certificat ne le couvrait, le serveur répondait avec celui
// de l'apex. Déployer includeSubDomains dans cet état aurait rendu www injoignable UN
// AN pour tout visiteur ayant vu l'apex, sans échappatoire : HSTS retire le lien
// « je comprends les risques » du navigateur.
// Correction appliquée le 22/08/2026, dans cet ordre :
//   1. Firebase Hosting → ajout du domaine personnalisé www.mavigneapp.fr
//   2. OVH → CNAME www remplacé : mavigneapp.fr  →  mavigne-a0fd5.web.app
//   3. certificat émis, vérifié en navigation privée : « la connexion est sécurisée »
//   4. renfort livré dans firebase.json ET drapeau passé à true, même geste.
//
// ⚠️ CONSÉQUENCE PERMANENTE : tout futur sous-nom en .mavigneapp.fr devra avoir son
//    certificat AVANT d'être branché. Sur Firebase c'est automatique ; ailleurs (un
//    serveur de test, un outil tiers), il sera injoignable et non contournable.
//
// ⚠️ « preload » est encore INERTE : le mot-clé seul ne fait rien tant que le domaine
//    n'est pas soumis sur hstspreload.org. C'est cette soumission — et elle seule —
//    qui coûte ~6 mois pour revenir en arrière. Geste séparé, jamais fait à ce jour.
//    Ne pas le confondre avec includeSubDomains, qui lui est actif depuis ce jour.
//
// Revenir à false n'a de sens que si le renfort est retiré de firebase.json dans le
// même geste : le harnais refuse les deux moitiés du changement isolées, dans les
// deux sens. harnais-sec6-contre.cjs lit ce drapeau et adapte ses cas tout seul.
const HSTS_RENFORCE = true;

// ═══ 1. HSTS ═════════════════════════════════════════════════════════════════
console.log('\n1. firebase.json — HSTS' + (HSTS_RENFORCE ? ' complet' : ' (renfort EN ATTENTE)'));
{
  // Mutation de contre-épreuve : MV_SEC6_HSTS remplace la valeur servie.
  const fb = JSON.parse(lire('firebase.json'));
  if (process.env.MV_SEC6_HSTS !== undefined) {
    for (const bloc of (fb.hosting.headers || [])) {
      for (const h of (bloc.headers || [])) {
        if (h.key === 'Strict-Transport-Security') h.value = process.env.MV_SEC6_HSTS;
      }
    }
    console.log(c.d('  [HSTS muté : "' + process.env.MV_SEC6_HSTS + '"]'));
  }
  const trouves = [];
  for (const bloc of (fb.hosting.headers || [])) {
    for (const h of (bloc.headers || [])) {
      if (h.key === 'Strict-Transport-Security') trouves.push({ source: bloc.source, value: h.value });
    }
  }
  verifie('un seul en-tête HSTS déclaré', trouves.length === 1, trouves.length + ' trouvé(s)');
  const v = (trouves[0] || {}).value || '';
  const age = /max-age=(\d+)/.exec(v);
  verifie('max-age ≥ 31536000 (un an, exigé pour le préchargement)',
    !!age && Number(age[1]) >= 31536000, v);
  if (HSTS_RENFORCE) {
    verifie('includeSubDomains présent', /includeSubDomains/.test(v), v);
    verifie('preload présent', /preload/.test(v), v);
  } else {
    // Le drapeau dit « en attente » : on vérifie que le renfort n'est PAS parti.
    // Ce sens-là compte autant que l'autre — un firebase.json renforcé alors que le
    // drapeau est resté à false, c'est le déploiement accidentel qu'on veut attraper.
    verifie('renfort absent, conforme au drapeau (www sans certificat)',
      !/includeSubDomains/.test(v) && !/preload/.test(v), v);
    console.log('  \x1b[33m⏳ DETTE OUVERTE\x1b[0m — HSTS non renforcé depuis le 22/08/2026.');
    console.log('     Débloquer : déclarer www.mavigneapp.fr dans Firebase Hosting, attendre');
    console.log('     le certificat, vérifier en navigation privée, puis HSTS_RENFORCE = true.');
  }
  verifie('l\'en-tête porte sur tout le site (source **)', (trouves[0] || {}).source === '**', String((trouves[0] || {}).source));
}

// ═══ 2. Le throttle est branché sur les DEUX endpoints — on COMPTE ═══════════
console.log('\n2. leads.js — un appel, et un seul, par endpoint');
{
  const blocMer  = decoupe(SRC_LEADS, 'exports.submitMiseEnRoute = onRequest(', '\n);', 'submitMiseEnRoute');
  const blocLead = decoupe(SRC_LEADS, 'exports.submitLead = onRequest(',        '\n);', 'submitLead');
  const nMer  = (blocMer.match(/await debitOk\(/g)  || []).length;
  const nLead = (blocLead.match(/await debitOk\(/g) || []).length;
  verifie('submitMiseEnRoute appelle le débit exactement 1 fois', nMer === 1, 'compté ' + nMer);
  verifie('submitLead appelle le débit exactement 1 fois',        nLead === 1, 'compté ' + nLead);
  // Le découpage doit avoir isolé DEUX blocs distincts, sinon les comptes ci-dessus
  // porteraient deux fois sur le même texte et seraient tous les deux satisfaits.
  verifie('les deux blocs découpés sont bien distincts', blocMer !== blocLead && !blocMer.includes('exports.submitLead'));

  // ── 3. L'ordre : honeypot d'abord, dans les deux ──────────────────────────
  console.log('\n3. leads.js — le honeypot passe avant le débit');
  for (const [nom, bloc] of [['submitMiseEnRoute', blocMer], ['submitLead', blocLead]]) {
    const iHp = bloc.indexOf('clip(b.hp, 200)');
    const iTh = bloc.indexOf('await debitOk(');
    verifie(nom + ' — honeypot présent',  iHp >= 0);
    verifie(nom + ' — débit présent',     iTh >= 0);
    verifie(nom + ' — honeypot AVANT le débit', iHp >= 0 && iTh >= 0 && iHp < iTh, 'hp@' + iHp + ' débit@' + iTh);
  }
}

// ═══ 4. La limite est une constante nommée ═══════════════════════════════════
console.log('\n4. leads.js — la limite est nommée, pas écrite en dur');
{
  const decl = /const\s+PUBLIC_THROTTLE_MAX\s*=\s*(\d+)\s*;/.exec(SRC_LEADS);
  verifie('PUBLIC_THROTTLE_MAX est déclarée comme constante', !!decl);
  const bloc = decoupe(SRC_LEADS, 'async function bumpPublicThrottle', '\n}\n', 'bumpPublicThrottle');
  verifie('la comparaison de seuil lit la constante', /e\.count\s*>=\s*PUBLIC_THROTTLE_MAX/.test(bloc));
  verifie('aucun nombre en dur dans la comparaison de seuil',
    !/e\.count\s*>=\s*\d/.test(bloc), (/e\.count\s*>=\s*\d+/.exec(bloc) || [''])[0]);
  verifie('la trace serveur cite la constante, pas un nombre recopié',
    /PUBLIC_THROTTLE_MAX/.test(decoupe(SRC_LEADS, 'async function debitOk', '\n}\n', 'debitOk')));
}

// ═══ 5. La fenêtre est celle de claims.js ════════════════════════════════════
console.log('\n5. la fenêtre doit être égale à celle de claims.js');
{
  const wL = /const\s+THROTTLE_WINDOW_MS\s*=\s*([0-9*\s]+);/.exec(SRC_LEADS);
  const wC = /const\s+THROTTLE_WINDOW_MS\s*=\s*([0-9*\s]+);/.exec(SRC_CLAIMS);
  verifie('les deux fichiers déclarent une fenêtre', !!wL && !!wC);
  const ev = (s) => Function('return (' + s + ')')();
  const vL = wL ? ev(wL[1]) : -1, vC = wC ? ev(wC[1]) : -2;
  verifie('fenêtres égales — sinon la purge de claims.js écrase la nôtre',
    vL === vC, 'leads=' + vL + 'ms · claims=' + vC + 'ms');
  const docL = /const\s+THROTTLE_DOC\s*=\s*'([^']+)'/.exec(SRC_LEADS);
  verifie('leads.js vise bien le document _guerettech/trial_throttle',
    !!docL && docL[1] === '_guerettech/trial_throttle', docL ? docL[1] : 'absent');
  verifie('claims.js vise le même document',
    SRC_CLAIMS.includes("db.doc('_guerettech/trial_throttle')"));
}

// ═══ 6. Le compteur tourne pour de vrai ══════════════════════════════════════
console.log('\n6. le compteur — exécution réelle des deux endpoints');
let CHARGE = null;
try {
  CHARGE = chargeLeads(nomMut ? MUTATIONS[nomMut] : null);
} catch (e) {
  verifie('le module leads.js se charge', false, String(e && e.message));
}

const MAX = Number((/const\s+PUBLIC_THROTTLE_MAX\s*=\s*(\d+)/.exec(SRC_LEADS) || [0, 30])[1]);

function lead(i) {
  return { domaine: 'Domaine ' + i, email: 'essai' + i + '@exemple.fr', hp: '' };
}
function mer(i) {
  return { dom: 'Domaine ' + i, ctMail: 'mer' + i + '@exemple.fr', recap: 'réponses', t: {}, r: {}, c: [], hp: '' };
}

if (CHARGE) {
  const { mod, F, journal } = CHARGE;
  verifie('les deux handlers sont exportés',
    !!(mod.submitLead && mod.submitLead.__handler && mod.submitMiseEnRoute && mod.submitMiseEnRoute.__handler));

  // ── 7. ipHashReq lit une requête onRequest ────────────────────────────────
  console.log('\n7. la clé d\'IP — le piège rawRequest');
  (async () => {
    const res1 = faussRes();
    await mod.submitLead.__handler(faussReq(lead(1), '1.2.3.4'), res1);
    const cles = Object.keys((F.docs.get('_guerettech/trial_throttle') || {}).value || {});
    verifie('une clé est bien posée dans le compteur', cles.length === 1, JSON.stringify(cles));
    verifie('la clé est préfixée (compteurs distincts de ceux de claims.js)',
      cles.length === 1 && cles[0].startsWith('pub:'), String(cles[0]));

    const res2 = faussRes();
    await mod.submitLead.__handler(faussReq(lead(2), '5.6.7.8'), res2);
    const cles2 = Object.keys((F.docs.get('_guerettech/trial_throttle') || {}).value || {});
    verifie('deux IP différentes = deux clés différentes (pas un compteur planétaire)',
      cles2.length === 2, JSON.stringify(cles2));

    // ── 8. CONTRE-ÉPREUVE VIVANTE : franchir le seuil ───────────────────────
    console.log('\n8. franchissement réel du seuil (limite lue : ' + MAX + ')');
    const F2 = chargeLeads(nomMut ? MUTATIONS[nomMut] : null);
    const m2 = F2.mod, doc2 = F2.F, jr2 = F2.journal;
    const IP = '90.90.90.90';
    let dernier = null, statuts = [];
    // Les deux endpoints partagent le compteur : on alterne, donc MAX tentatives
    // au total et non MAX chacun.
    for (let i = 1; i <= MAX; i++) {
      const r = faussRes();
      if (i % 2) await m2.submitLead.__handler(faussReq(lead(100 + i), IP), r);
      else       await m2.submitMiseEnRoute.__handler(faussReq(mer(100 + i), IP), r);
      statuts.push(r.code);
    }
    verifie('les ' + MAX + ' premières tentatives passent (aucune n\'est refusée)',
      statuts.every((s) => s === 200), 'statuts distincts : ' + [...new Set(statuts)].join(','));
    const fichesAvant = [...doc2.docs.keys()].filter((k) => k.startsWith('leads/')).length;
    const mailsAvant  = doc2.mails.length;
    const warnAvant   = jr2.filter((l) => l.niv === 'warn' && /D.bit/.test(l.txt)).length;

    const r31 = faussRes();
    await m2.submitLead.__handler(faussReq(lead(999), IP), r31);
    dernier = r31;
    const fichesApres = [...doc2.docs.keys()].filter((k) => k.startsWith('leads/')).length;
    const mailsApres  = doc2.mails.length;
    const warnApres   = jr2.filter((l) => l.niv === 'warn' && /D.bit/.test(l.txt)).length;

    verifie('tentative n°' + (MAX + 1) + ' — le client reçoit 200', dernier.code === 200, 'reçu ' + dernier.code);
    verifie('tentative n°' + (MAX + 1) + ' — le corps est celui du succès, aucune alerte au prospect',
      !!dernier.corps && dernier.corps.status === 'created' && !dernier.corps.error, JSON.stringify(dernier.corps));
    verifie('tentative n°' + (MAX + 1) + ' — AUCUNE fiche écrite en base',
      fichesApres === fichesAvant, fichesAvant + ' → ' + fichesApres);
    verifie('tentative n°' + (MAX + 1) + ' — AUCUN e-mail mis en file',
      mailsApres === mailsAvant, mailsAvant + ' → ' + mailsApres);
    verifie('tentative n°' + (MAX + 1) + ' — une trace serveur, et une seule',
      warnApres === warnAvant + 1, warnAvant + ' → ' + warnApres);
    const trace = jr2.filter((l) => /D.bit/.test(l.txt)).pop();
    verifie('la trace est en WARNING, pas en ERROR (les alertes GCP partent à ERROR)',
      !!trace && trace.niv === 'warn', trace ? trace.niv : 'aucune trace');

    // ── 9. Le honeypot ne consomme pas de quota ─────────────────────────────
    console.log('\n9. le honeypot ne consomme pas le quota de l\'IP');
    const F3 = chargeLeads(nomMut ? MUTATIONS[nomMut] : null);
    const IP3 = '77.77.77.77';
    for (let i = 0; i < 5; i++) {
      const r = faussRes();
      await F3.mod.submitLead.__handler(faussReq(Object.assign(lead(i), { hp: 'bot' }), IP3), r);
    }
    const m3 = (F3.F.docs.get('_guerettech/trial_throttle') || {}).value || {};
    verifie('5 envois de bot n\'ont posé aucun compteur',
      Object.keys(m3).length === 0, JSON.stringify(Object.keys(m3)));

    // ── 10. Interopérabilité avec claims.js sur le MÊME document ────────────
    console.log('\n10. les deux implémentations partagent le document sans se détruire');
    const F4 = chargeLeads(nomMut ? MUTATIONS[nomMut] : null);
    // La vraie checkAndBumpThrottle de claims.js, extraite et exécutée telle quelle.
    const blocC = decoupe(SRC_CLAIMS, 'async function checkAndBumpThrottle(db, key) {', '\n}\n', 'checkAndBumpThrottle');
    const wC = Function('return (' + /const\s+THROTTLE_WINDOW_MS\s*=\s*([0-9*\s]+);/.exec(SRC_CLAIMS)[1] + ')')();
    const mC = Number(/const\s+THROTTLE_MAX\s*=\s*(\d+)/.exec(SRC_CLAIMS)[1]);
    const claimsThrottle = new Function('THROTTLE_WINDOW_MS', 'THROTTLE_MAX',
      blocC + '\nreturn checkAndBumpThrottle;')(wC, mC);

    const IP4 = '88.88.88.88';
    const r4 = faussRes();
    await F4.mod.submitLead.__handler(faussReq(lead(500), IP4), r4);   // pose une clé pub:
    const avantC = Object.keys((F4.F.docs.get('_guerettech/trial_throttle') || {}).value || {});
    const passe = await claimsThrottle(F4.F.db, 'clenue0123456789abcdef01');
    const apresC = Object.keys((F4.F.docs.get('_guerettech/trial_throttle') || {}).value || {});
    verifie('claims.js autorise sa propre tentative', passe === true);
    verifie('claims.js n\'a pas détruit la clé publique',
      apresC.filter((k) => k.startsWith('pub:')).length === avantC.filter((k) => k.startsWith('pub:')).length,
      JSON.stringify(apresC));
    verifie('les deux clés cohabitent dans le même document',
      apresC.length === 2 && apresC.some((k) => k.startsWith('pub:')) && apresC.some((k) => !k.startsWith('pub:')),
      JSON.stringify(apresC));
    // Et le sens inverse : saturer le compteur public ne doit pas bloquer claims.js.
    const F5 = chargeLeads(nomMut ? MUTATIONS[nomMut] : null);
    const IP5 = '99.99.99.99';
    for (let i = 0; i <= MAX; i++) {
      const r = faussRes();
      await F5.mod.submitLead.__handler(faussReq(lead(600 + i), IP5), r);
    }
    const memeCle = 'pub:' + require('node:crypto').createHash('sha256').update(IP5).digest('hex').slice(0, 24);
    const cle5 = Object.keys((F5.F.docs.get('_guerettech/trial_throttle') || {}).value || {})[0];
    verifie('la clé publique est bien le hash préfixé de l\'IP client (pas celle du proxy)',
      cle5 === memeCle, cle5 + ' vs ' + memeCle);
    const passeC5 = await claimsThrottle(F5.F.db, memeCle.slice(4));
    verifie('un compteur public saturé ne ferme PAS l\'activation d\'essai de la même IP',
      passeC5 === true);

    console.log('\n' + (ko === 0 ? c.g(`✓ SEC-6 : ${ok} vérifications, 0 rouge`)
                                 : c.r(`✗ SEC-6 : ${ko} rouge(s) sur ${ok + ko}`)));
    process.exit(ko === 0 ? 0 : 1);
  })().catch((e) => {
    console.log('\n' + c.r('✗ SEC-6 : CRASH — ' + (e && e.stack ? e.stack : e)));
    process.exit(1);
  });
} else {
  console.log('\n' + c.r(`✗ SEC-6 : ${ko} rouge(s) sur ${ok + ko} — module non chargé`));
  process.exit(1);
}
