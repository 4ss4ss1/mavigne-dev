#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — MOTIFS-1 (§250) : LES MOTIFS, LES HEURES SUP ET LES ACOMPTES NE QUITTENT PLUS L'APPAREIL DE L'ADMIN
     node scripts/mv-harnais-motifs1.mjs            → doit être vert
     node scripts/mv-harnais-motifs1.mjs --contre   → chaque défaut réinjecté doit faire rougir SON contrôle

   Règle de Nico (05/10/2026) : un salarié ne voit pas les motifs d'absence de ses collègues — et son téléphone
   ne les reçoit pas. Ce harnais JOUE le vrai code, sans émulateur ni navigateur :
     S. la règle serveur (functions/planning-vues-calc.js) : ce qu'une journée devient pour un collègue —
        cas écrits à la main, puis 600 journées tirées au hasard (aucun champ hors liste, aucun motif, aucun texte) ;
     D. la fabrique d'un domaine sur un faux Firestore (transaction comprise) et un faux annuaire de comptes :
        vues justes, idempotence, réécriture minimale, RIEN de recréé dans un domaine supprimé, lots de 100 ;
     T. les deux déclencheurs (functions/planning-vues.js), chargés avec un faux require ;
     Q. le rattrapage GUERETTECH (gtPlanningVues, functions/claims.js), extrait et joué ;
     C. le module client (src/planning-vue.js) : qui a la vue complète (= deriveAdm, 32 combinaisons), la composition ;
     K. le bloc de src/firebase.js : clés lues et écoutées, assainissement de la copie du téléphone, réception des vues ;
     G. le VRAI fbSave : un téléphone en vue salarié n'enregistre jamais le planning ;
     W/A/X/R. le câblage (firebase.js, app.js, index.js) et les règles (lecture seule de ce que le moteur vérifie
        pour de bon dans mv-harnais-rules, section P, sur l'émulateur).
   ⚠️ Les sources sont lues SANS leurs commentaires pour les contrôles de texte : un commentaire qui cite le code
      corrigé ne prouve rien (§25).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (p) => fs.readFileSync(path.join(RACINE, p), 'utf8');
const SRC0 = {
  calc: lire('functions/planning-vues-calc.js'), trig: lire('functions/planning-vues.js'), idx: lire('functions/index.js'),
  claims: lire('functions/claims.js'), vue: lire('src/planning-vue.js'), fb: lire('src/firebase.js'), app: lire('src/app.js'),
  rules: lire('firestore.rules'), hr: lire('scripts/mv-harnais-rules.mjs'),
};
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
const sansCom = (t) => t.replace(/^\s*\/\/[^\n]*$/gm, '').replace(/([;{)])[ \t]*\/\/[^\n]*/g, '$1');

/* ── Outils ─────────────────────────────────────────────────────────────── */
function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
function affectation(src, nom) {
  const i = src.indexOf('window.' + nom + ' = '); if (i < 0) throw new Error('AFFECTATION ABSENTE : ' + nom);
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1); }
  throw new Error('accolade non fermée : window.' + nom);
}
function chargerCJS(src, req) {
  const module = { exports: {} };
  vm.runInThisContext('(function (module, exports, require) {\n' + src + '\n})')(module, module.exports, req || ((m) => { throw new Error('require inattendu : ' + m); }));
  return module.exports;
}
function chargerVue(src) {
  return vm.runInThisContext('(function () {\n' + src.replace(/^export\s+/gm, '') +
    '\nreturn { PLAN_CLES_ADMIN, PLAN_CLE_EQUIPE, PLAN_PREFIXE_MOI, planCleMoi, planVueComplete, planComposer, planGarderLesMiens };\n})()');
}
const estObjet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : estObjet(v) ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);
const egal = (a, b) => canon(a) === canon(b);
const copie = (v) => JSON.parse(JSON.stringify(v));

/* ── Données ────────────────────────────────────────────────────────────── */
const ENTREES = {
  Lucas: { 2026: { 9: { 5: { timing: { debut: '08:00', fin: '16:00', continu: false }, comment: 'rdv perso', reduit_motif: 'perso' },
                        23: { type: 'cp', heures: 7 } } } },
  Theo: { 2026: { 9: { 1: { absent: true, motif: 'arret', comment: 'grippe' }, 2: { absent: true, motif: 'arret' },
                       6: { absent: true, motif: 'retard', motif_h: 1, motif_t: '09:00', timing: { debut: '09:00', fin: '16:00' } } } } },
  Jean: { 2026: { 9: { 7: { absent: true, motif: 'formation' }, 8: { absent: true, motif: 'perso', abs_de: '14:00', abs_a: '16:30', comment: 'médecin' },
                       10: { timing: { debut: '08:00', fin: '12:00', continu: true }, remplacement: true, comment: 'échange avec Paul' } } } },
  Sarah: { 2026: { 9: { 9: { type: 'recup' }, 12: { absent: true, motif: 'injustifie', comment: 'pas prévenu' } } } },
  Vendangeurs: { 2026: { 8: { 15: { effectif: 12 } } } },
  Ancien: { 9: { 3: { absent: true, motif: 'sansolde' } } },            // ancienne forme, sans année
};
const ABS = { absent: true, motif: 'autre' };
const ATTENDU = {
  Lucas: { 2026: { 9: { 23: ABS } } },
  Theo: { 2026: { 9: { 1: ABS, 2: ABS } } },
  Jean: { 2026: { 9: { 7: ABS, 10: { timing: { debut: '08:00', fin: '12:00', continu: true }, remplacement: true } } } },
  Sarah: { 2026: { 9: { 9: ABS, 12: ABS } } },
  Vendangeurs: { 2026: { 8: { 15: { effectif: 12 } } } },
  Ancien: { 9: { 3: ABS } },
};
const SENSIBLES = ['arret', 'formation', 'perso', 'injustifie', 'sansolde', 'retard', 'grippe', 'médecin', 'prévenu', 'rdv', 'comment',
  'reduit_motif', 'motif_h', 'motif_t', 'abs_de', 'abs_a', 'heures', 'échange', '"type"'];
const MEMBRES = [{ nom: 'Lucas', email: 'Lucas@Exemple.fr' }, { nom: 'Theo', email: 'theo@exemple.fr' }, { nom: 'Vendangeurs' },
  { nom: 'Jean', email: 'jean@exemple.fr' }, { nom: 'Doublon', email: ' THEO@exemple.fr ' }];
const COMPTES = { 'lucas@exemple.fr': 'u-lucas', 'theo@exemple.fr': 'u-theo' };

function fauxServeur(docs, comptes) {
  const E = { ecritures: [], lots: [] };
  const snap = (p) => ({ exists: Object.prototype.hasOwnProperty.call(docs, p), data: () => copie(docs[p]) });
  const db = {
    doc: (p) => ({ path: p, get: async () => snap(p) }),
    runTransaction: async (fn) => {
      const ecr = [];
      const tx = { get: async (ref) => snap(ref.path), getAll: async (...refs) => refs.map((r) => snap(r.path)),
                   set: (ref, d) => { ecr.push([ref.path, copie(d)]); } };
      const r = await fn(tx);
      ecr.forEach(([p, d]) => { docs[p] = d; E.ecritures.push(p); });
      return r;
    },
  };
  const auth = { getUsers: async (ids) => {
    E.lots.push(ids.length);
    return { users: ids.map((i) => { const m = String(i.email).toLowerCase(); return comptes[m] ? { email: m, uid: comptes[m] } : null; }).filter(Boolean) };
  } };
  return { db, auth, docs, E };
}

/* ── Tirage au hasard (journées abîmées comprises) ─────────────────────── */
let graine = 20261005;
const alea = () => (graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648;
const un = (t) => t[Math.floor(alea() * t.length)];
function jourAuHasard(i) {
  const e = {};
  const champ = (k, valeurs) => { if (alea() < 0.45) e[k] = un(valeurs); };
  champ('absent', [true, false, 'oui']); champ('type', ['cp', 'recup', 'autre', undefined]);
  champ('motif', ['arret', 'perso', 'retard', 'formation', 'injustifie', 'SECRET-motif-' + i]);
  champ('comment', ['SECRET commentaire ' + i]); champ('motif_h', [0, 1.5, -2, 'x']); champ('motif_t', ['09:30', '', 'SECRET']);
  champ('abs_de', ['14:00', '', 7]); champ('abs_a', ['16:30', '']); champ('remplacement', [true, false]); champ('extra', [true]);
  champ('effectif', [0, 3, 'x', 999]); champ('heures', [7, 'SECRET']); champ('reduit_motif', ['perso']); champ('canicule', [true]);
  champ('champ_inconnu', ['SECRET inconnu']); champ('note_medicale', ['SECRET note']);
  if (alea() < 0.5) e.timing = un([{ debut: '08:00', fin: '16:00', continu: alea() < 0.5 }, { debut: '07:00', fin: '15:00', SECRET: 'x' }, 'SECRET', { debut: 8 }]);
  if (!Object.keys(e).length) e.absent = true;
  return e;
}

/* ── La suite (sources éventuellement fautives, pour la contre-épreuve) ── */
async function suite(SRC) {
  const res = [];
  const T = async (id, lib, fn) => { let ok = false; try { ok = !!(await fn()); } catch (e) { ok = false; } res.push([id, lib, ok]); };
  let calc = null, vue = null;
  try { calc = chargerCJS(SRC.calc); } catch (e) { calc = null; }
  try { vue = chargerVue(SRC.vue); } catch (e) { vue = null; }

  // S. La règle serveur
  await T('S1', 'une journée vue par un collègue : congé, récup, arrêt, formation, injustifiée → « absent » ; retard, absence d’une partie de journée, horaire modifié → rien ; échange → son horaire ; effectif gardé ; ancienne forme sans année comprise',
    () => egal(calc.vueEquipe(copie(ENTREES)), ATTENDU));
  await T('S2', 'la vue de l’équipe ne contient AUCUN motif, commentaire, heure de retard, créneau d’absence ni type de jour',
    () => { const j = JSON.stringify(calc.vueEquipe(copie(ENTREES))); return SENSIBLES.every((m) => j.indexOf(m) < 0); });
  const tirages = Array.from({ length: 600 }, (_, i) => jourAuHasard(i));
  await T('S3', '600 journées tirées au hasard : seuls absent / motif « autre » / horaire (début, fin, continu) / échange / extra / effectif sortent — jamais un texte',
    () => tirages.every((e) => {
      const o = calc.vueJour(copie(e)); if (o === null) return true;
      const cles = Object.keys(o);
      if (!cles.every((k) => ['absent', 'motif', 'timing', 'remplacement', 'extra', 'effectif'].includes(k))) return false;
      if ('motif' in o && o.motif !== 'autre') return false;
      if ('timing' in o && !Object.keys(o.timing).every((k) => ['debut', 'fin', 'continu'].includes(k))) return false;
      return JSON.stringify(o).indexOf('SECRET') < 0;
    }));
  await T('S4', '… et « absent » pour un collègue ⇔ congé, récup ou absence d’une journée entière (règle réécrite à part, 600 journées)',
    () => tirages.every((e) => {
      const partiel = typeof e.abs_de === 'string' && e.abs_de !== '' && typeof e.abs_a === 'string' && e.abs_a !== '';
      const retard = e.motif === 'retard' || (typeof e.motif_h === 'number' && e.motif_h > 0) || (typeof e.motif_t === 'string' && e.motif_t !== '');
      const attendu = e.type === 'cp' || e.type === 'recup' || (e.type !== 'cp' && e.type !== 'recup' && e.absent === true && !partiel && !retard);
      const o = calc.vueJour(copie(e));
      return !!(o && o.absent === true) === attendu;
    }));
  await T('S5', 'un champ inconnu (ajouté demain au planning) ne sort pas : liste blanche',
    () => calc.vueJour({ absent: true, motif: 'arret', note_medicale: 'x' }).note_medicale === undefined
      && egal(calc.vueJour({ absent: true, motif: 'arret', note_medicale: 'x' }), ABS));

  // D. La fabrique d'un domaine
  const docs = { 'mavigne_dom/membres': { value: copie(MEMBRES) }, 'mavigne_dom/planning_entries': { value: copie(ENTREES) } };
  const S = fauxServeur(docs, COMPTES);
  let r1 = null;
  try { r1 = await calc.deriverDomaine(S.db, S.auth, 'mavigne_dom'); } catch (e) { r1 = null; }
  await T('D1', 'premier passage : la vue de l’équipe + une vue par personne qui a un compte (adresse en majuscules retrouvée ; équipe collective, sans-compte et doublon écartés)',
    () => r1 && r1.ecrits === 3 && r1.personnes === 2 && r1.sansCompte === 1);
  await T('D2', 'la vue personnelle porte les jours COMPLETS de son titulaire — et rien des autres',
    () => egal(docs['mavigne_dom/planning_moi_u-lucas'].value, { nom: 'Lucas', entries: ENTREES.Lucas })
      && egal(docs['mavigne_dom/planning_moi_u-theo'].value, { nom: 'Theo', entries: ENTREES.Theo })
      && JSON.stringify(docs['mavigne_dom/planning_moi_u-lucas'].value).indexOf('grippe') < 0);
  await T('D3', 'la vue de l’équipe écrite = la règle S (aucun motif)', () => egal(docs['mavigne_dom/planning_equipe'].value, ATTENDU));
  await T('D4', 'idempotent (0 écriture) ; un commentaire changé ne réécrit QUE la vue de son titulaire ; une absence retirée réécrit l’équipe et son titulaire',
    async () => {
      const a = await calc.deriverDomaine(S.db, S.auth, 'mavigne_dom');
      docs['mavigne_dom/planning_entries'].value.Lucas['2026']['9']['5'].comment = 'autre chose';
      const n0 = S.E.ecritures.length; const b = await calc.deriverDomaine(S.db, S.auth, 'mavigne_dom'); const ecritsB = S.E.ecritures.slice(n0);
      delete docs['mavigne_dom/planning_entries'].value.Theo['2026']['9']['2'];
      const d = await calc.deriverDomaine(S.db, S.auth, 'mavigne_dom');
      return a.ecrits === 0 && b.ecrits === 1 && ecritsB.join() === 'mavigne_dom/planning_moi_u-lucas' && d.ecrits === 2;
    });
  await T('D5', 'domaine supprimé (plus de membres) ou sans planning, collection hors domaine : RIEN n’est écrit',
    async () => {
      const A = fauxServeur({ 'mavigne_x/planning_entries': { value: copie(ENTREES) } }, COMPTES);
      const ra = await calc.deriverDomaine(A.db, A.auth, 'mavigne_x');
      const B = fauxServeur({ 'mavigne_y/membres': { value: copie(MEMBRES) } }, COMPTES);
      const rb = await calc.deriverDomaine(B.db, B.auth, 'mavigne_y');
      const rc = await calc.deriverDomaine(B.db, B.auth, 'leads');
      return !!(ra.ignore && rb.ignore && rc.ignore) && A.E.ecritures.length === 0 && B.E.ecritures.length === 0;
    });
  await T('D6', '230 comptes : l’annuaire est consulté par lots de 100 au plus',
    async () => {
      const m = Array.from({ length: 230 }, (_, i) => ({ nom: 'P' + i, email: 'p' + i + '@ex.fr' }));
      const cpt = {}; m.forEach((x, i) => { cpt[x.email] = 'u' + i; });
      const Z = fauxServeur({ 'mavigne_z/membres': { value: m }, 'mavigne_z/planning_entries': { value: {} } }, cpt);
      const r = await calc.deriverDomaine(Z.db, Z.auth, 'mavigne_z');
      return Z.E.lots.join() === '100,100,30' && r.personnes === 230;
    });

  // T. Les déclencheurs
  const appels = [], journal = { info: 0, error: 0 }, cap = [];
  const stub = { TENANT_PREFIX: 'mavigne_', deriverDomaine: async (db, auth, coll) => { appels.push([db, auth, coll]); if (coll === 'mavigne_boum') throw new Error('panne'); return { ecrits: 1 }; } };
  let trig = null;
  try {
    trig = chargerCJS(SRC.trig, (m) => {
      if (m === 'firebase-functions/v2/firestore') return { onDocumentWritten: (opts, fn) => { cap.push({ opts, fn }); return { opts, fn }; } };
      if (m === 'firebase-functions') return { logger: { info: () => { journal.info++; }, error: () => { journal.error++; } } };
      if (m === 'firebase-admin') return { initializeApp: () => {}, firestore: () => 'DB', auth: () => 'AUTH' };
      if (m === './planning-vues-calc') return stub;
      throw new Error('require inattendu : ' + m);
    });
  } catch (e) { trig = null; }
  const H = (nom) => trig && trig[nom] && trig[nom].fn;
  await T('T1', 'deux déclencheurs : planning_entries et membres, de n’importe quel domaine',
    () => trig.planningVuesEntrees.opts.document === '{coll}/planning_entries' && trig.planningVuesMembres.opts.document === '{coll}/membres');
  await T('T2', 'région europe-west1 (la base est eur3 : couple supporté par Eventarc)',
    () => trig.planningVuesEntrees.opts.region === 'europe-west1' && trig.planningVuesMembres.opts.region === 'europe-west1');
  await T('T3', 'un déclencheur fabrique les vues du domaine qui l’a réveillé', async () => {
    await H('planningVuesEntrees')({ params: { coll: 'mavigne_dom' } }); await H('planningVuesMembres')({ params: { coll: 'mavigne_dom' } });
    return appels.length === 2 && appels.every((a) => a[0] === 'DB' && a[1] === 'AUTH' && a[2] === 'mavigne_dom');
  });
  await T('T4', 'une collection hors domaine (leads, _guerettech…) ne déclenche rien', async () => {
    const n = appels.length; await H('planningVuesEntrees')({ params: { coll: 'leads' } }); return appels.length === n;
  });
  await T('T5', 'une panne est journalisée en erreur, sans relance en boucle', async () => {
    const e0 = journal.error; const r = await H('planningVuesEntrees')({ params: { coll: 'mavigne_boum' } }); return r === null && journal.error === e0 + 1;
  });

  // Q. Le rattrapage GUERETTECH
  class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  let gt = null;
  try {
    const i = SRC.claims.indexOf('exports.gtPlanningVues = onCall('), f = SRC.claims.indexOf('\n});', i);
    const Q = fauxServeur({ '_guerettech/tenants': { slugs: ['dom', 'vide', 'BAD SLUG'] }, 'mavigne_dom/membres': { value: copie(MEMBRES) },
                            'mavigne_dom/planning_entries': { value: copie(ENTREES) } }, COMPTES);
    const ctx = { exports: {}, onCall: (opts, fn) => ({ opts, fn }), REGION: 'europe-west1', HttpsError, console: { error: () => {} },
                  assertGtAdmin: (req) => { if (!req.gt) throw new HttpsError('permission-denied', 'refus GT'); },
                  admin: { firestore: () => Q.db, auth: () => Q.auth }, require: (m) => (m === './planning-vues-calc' ? calc : null) };
    vm.createContext(ctx); vm.runInContext(SRC.claims.slice(i, f + 4), ctx); gt = ctx.exports.gtPlanningVues;
  } catch (e) { gt = null; }
  await T('Q1', 'gtPlanningVues refuse tout appelant sans session GUERETTECH',
    async () => { try { await gt.fn({ data: {} }); return false; } catch (e) { return e.code === 'permission-denied'; } });
  await T('Q2', 'gtPlanningVues fabrique les vues de chaque domaine du registre et dit ce qu’il a fait, ignoré, refusé', async () => {
    const r = await gt.fn({ gt: true, data: {} });
    return r.faits.join() === 'dom : 3 vue(s) écrite(s), 2 personne(s) avec compte, 1 sans compte'
      && r.ignores.join() === 'vide : aucune liste de membres' && r.erreurs.length === 1;
  });
  await T('Q3', 'gtPlanningVues : un domaine inconnu est refusé (not-found) ; App Check exigé, 300 s', async () => {
    let code = ''; try { await gt.fn({ gt: true, data: { tenant: 'nope' } }); } catch (e) { code = e.code; }
    return code === 'not-found' && gt.opts.enforceAppCheck === true && gt.opts.timeoutSeconds === 300;
  });
  await T('X1', 'index.js exporte les déclencheurs, jamais la règle pure (qui n’est pas une fonction à déployer)',
    () => /require\('\.\/planning-vues'\)/.test(sansCom(SRC.idx)) && !/planning-vues-calc/.test(sansCom(SRC.idx)));

  // C. Le module client
  await T('C1', 'vue complète : admin, GUERETTECH, préparation, démo ; vue salarié : ouvrier, tractoriste, saisonnier, pilotage, sans session', () =>
    vue.planVueComplete({ roles: ['admin'] }) && vue.planVueComplete({ roles: ['ouvrier', 'admin'] }) && vue.planVueComplete({ _isGTAdmin: true, roles: [] })
    && vue.planVueComplete({ _isDemo: true }) && vue.planVueComplete({ roles: [] }, true)
    && !vue.planVueComplete({ roles: ['ouvrier'] }) && !vue.planVueComplete({ roles: ['tractoriste'] }) && !vue.planVueComplete({ roles: ['saisonnier'] })
    && !vue.planVueComplete({ roles: ['pilotage'] }) && !vue.planVueComplete(null) && !vue.planVueComplete({}));
  await T('C2', '32 combinaisons de rôles : vue complète ⇔ deriveAdm (le claim adm que lisent les règles)', () => {
    const deriveAdm = vm.runInThisContext('(' + fonction(SRC.claims, 'deriveAdm') + ')');
    const R = ['admin', 'ouvrier', 'tractoriste', 'saisonnier', 'pilotage'];
    for (let k = 0; k < 32; k++) { const roles = R.filter((_, i) => k & (1 << i)); if (vue.planVueComplete({ roles }) !== deriveAdm(roles)) return false; }
    return true;
  });
  const EQ = calc ? calc.vueEquipe(copie(ENTREES)) : {};
  await T('C3', 'composition : l’équipe sans motif, et à son nom SES jours complets', () => {
    const o = vue.planComposer(copie(EQ), { nom: 'Lucas', entries: copie(ENTREES.Lucas) });
    return egal(o.Lucas, ENTREES.Lucas) && egal(o.Theo, ATTENDU.Theo) && Object.keys(o).length === Object.keys(ATTENDU).length;
  });
  await T('C4', 'vue personnelle pas encore reçue : ses jours actuels restent ; vue personnelle illisible : rien plutôt qu’une erreur', () =>
    egal(vue.planComposer(copie(EQ), undefined, copie(ENTREES.Lucas), 'Lucas').Lucas, ENTREES.Lucas)
    && egal(vue.planComposer(null, { nom: 'Lucas', entries: [] }), { Lucas: {} }));
  await T('C5', 'avant la première réponse du serveur : on ne garde que les jours de la personne connectée',
    () => egal(vue.planGarderLesMiens(copie(ENTREES), 'Lucas'), { Lucas: ENTREES.Lucas }) && egal(vue.planGarderLesMiens(copie(ENTREES), ''), {}));

  // K. Le bloc de firebase.js, exécuté
  function monter(sc) {
    const E = { appliques: [], snaps: 0, rendus: [], logs: [] };
    const W = { currentUser: sc.cu, PLANNING_ENTRIES: sc.entries || {}, PLANNING_HSUP: sc.hsup || {}, PLANNING_ACOMPTES: sc.acomptes || {},
      applyFbData: (k, v) => { E.appliques.push([k, v]); if (k === 'planning_entries') { Object.keys(W.PLANNING_ENTRIES).forEach((x) => { delete W.PLANNING_ENTRIES[x]; }); Object.assign(W.PLANNING_ENTRIES, v); } },
      _mvSnapSave: () => { E.snaps++; }, _mvPrepOn: () => !!sc.prep, logError: (o) => { E.logs.push(o); } };
    const ctx = { window: W, auth: { currentUser: sc.uid === null ? null : { uid: sc.uid || 'u-lucas' } }, TENANT_ID: 'dom-test',
      PLAN_CLES_ADMIN: vue.PLAN_CLES_ADMIN, PLAN_CLE_EQUIPE: vue.PLAN_CLE_EQUIPE, planCleMoi: vue.planCleMoi, planVueComplete: vue.planVueComplete,
      planComposer: vue.planComposer, planGarderLesMiens: vue.planGarderLesMiens, _mvRendreBientot: (k) => { E.rendus.push(k); },
      _mvPlanEq: undefined, _mvPlanMoi: undefined, _mvPlanSession: null, _mvPlanManqueDit: false };
    vm.createContext(ctx);
    vm.runInContext(['_mvPlanComplete', '_mvPlanCleMoi', '_mvClesLues', '_mvPlanApresLecture'].map((n) => fonction(SRC.fb, n)).join('\n') + '\n'
      + ['_mvPlanVueSalarie', '_mvPlanRecevoir', '_fbPlanAssainir'].map((n) => affectation(SRC.fb, n)).join('\n'), ctx);
    return { W, E, ctx };
  }
  const LISTE = ['parcelles', 'planning_templates', 'planning_entries', 'planning_acomptes', 'planning_hsup', 'journal'];
  const OUV = { nom: 'Lucas', roles: ['ouvrier'] }, ADM = { nom: 'Nico', roles: ['admin', 'ouvrier'] };
  await T('K1', 'vue salarié : les trois documents de l’admin ne sont ni lus ni écoutés — à leur place, la vue de l’équipe et SA vue', () => {
    const M = monter({ cu: OUV }); return M.ctx._mvClesLues(LISTE).join() === 'parcelles,planning_templates,journal,planning_equipe,planning_moi_u-lucas';
  });
  await T('K2', 'sans compte ouvert, pas de vue personnelle demandée ; chez l’admin, la liste ne change pas', () =>
    monter({ cu: OUV, uid: null }).ctx._mvClesLues(LISTE).join() === 'parcelles,planning_templates,journal,planning_equipe'
    && monter({ cu: ADM }).ctx._mvClesLues(LISTE).join() === LISTE.join());
  await T('K3', 'assainissement : la copie du téléphone ne garde que SES jours, heures sup et acomptes vidés, EN PLACE, copie locale réécrite — une fois par personne', () => {
    const ent = copie(ENTREES), hs = { Theo: { '2026-10': { paye: 2 } } }, ac = { Theo: { '2026-10': [{ montant: 100 }] } };
    const M = monter({ cu: OUV, entries: ent, hsup: hs, acomptes: ac }); M.W._fbPlanAssainir(); M.W._fbPlanAssainir();
    return M.W.PLANNING_ENTRIES === ent && Object.keys(ent).join() === 'Lucas' && egal(ent.Lucas, ENTREES.Lucas)
      && M.W.PLANNING_HSUP === hs && !Object.keys(hs).length && M.W.PLANNING_ACOMPTES === ac && !Object.keys(ac).length && M.E.snaps === 1;
  });
  await T('K4', 'chez l’admin (et en préparation GUERETTECH), rien n’est retiré', () => {
    const ent = copie(ENTREES), hs = { Theo: {} };
    const M = monter({ cu: ADM, entries: ent, hsup: hs }); M.W._fbPlanAssainir();
    const P = monter({ cu: { nom: 'GT', roles: [] }, prep: true, entries: copie(ENTREES) }); P.W._fbPlanAssainir();
    return Object.keys(ent).length === 6 && Object.keys(hs).length === 1 && M.E.snaps === 0 && Object.keys(P.W.PLANNING_ENTRIES).length === 6;
  });
  await T('K5', 'réception : une autre clé, ou la vue personnelle d’un AUTRE compte, n’est pas prise', () => {
    const M = monter({ cu: OUV }); return M.W._mvPlanRecevoir('journal', []) === false && M.W._mvPlanRecevoir('planning_moi_u-theo', { nom: 'Theo', entries: {} }) === false && !M.E.appliques.length;
  });
  await T('K6', 'réception : l’équipe d’abord (SES jours actuels restent), puis SA vue (ses jours complets) — composées en planning_entries, page redessinée', () => {
    const M = monter({ cu: OUV, entries: copie(ENTREES) }); M.W._fbPlanAssainir();
    const r1 = M.W._mvPlanRecevoir('planning_equipe', copie(EQ));
    const ok1 = r1 === true && egal(M.W.PLANNING_ENTRIES.Lucas, ENTREES.Lucas) && egal(M.W.PLANNING_ENTRIES.Theo, ATTENDU.Theo);
    const FULL2 = { 2026: { 9: { 30: { absent: true, motif: 'formation' } } } };
    M.W._mvPlanRecevoir('planning_moi_u-lucas', { nom: 'Lucas', entries: copie(FULL2) });
    return ok1 && egal(M.W.PLANNING_ENTRIES.Lucas, FULL2) && egal(M.W.PLANNING_ENTRIES.Theo, ATTENDU.Theo)
      && JSON.stringify(M.W.PLANNING_ENTRIES.Theo).indexOf('arret') < 0 && M.E.rendus.includes('planning_entries') && M.E.appliques.every((a) => a[0] === 'planning_entries');
  });
  await T('K7', 'chez l’admin, une vue reçue par erreur ne touche à rien', () => {
    const M = monter({ cu: ADM, entries: copie(ENTREES) }); return M.W._mvPlanRecevoir('planning_equipe', copie(EQ)) === true && !M.E.appliques.length && Object.keys(M.W.PLANNING_ENTRIES).length === 6;
  });
  await T('K8', 'garde : en vue salarié (et sans session) les trois documents de l’admin sont « à ne pas écrire » ; chez l’admin non ; le journal jamais', () => {
    const S1 = monter({ cu: OUV }).W, A1 = monter({ cu: ADM }).W, N1 = monter({ cu: null }).W;
    return ['planning_entries', 'planning_hsup', 'planning_acomptes'].every((k) => S1._mvPlanVueSalarie(k) && !A1._mvPlanVueSalarie(k) && N1._mvPlanVueSalarie(k))
      && !S1._mvPlanVueSalarie('journal');
  });
  await T('K9', 'une vue personnelle absente du serveur se signale UNE fois (journal → console GT)', () => {
    const M = monter({ cu: OUV }); M.ctx._mvPlanApresLecture({ 'planning_moi_u-lucas': 'missing' }); M.ctx._mvPlanApresLecture({ 'planning_moi_u-lucas': 'missing' });
    return M.E.logs.length === 1 && M.E.logs[0].cat === 'planning';
  });

  // G. Le VRAI fbSave
  function monterSave(salarie) {
    const E = { file: [] };
    const W = { _mvLectureSeule: () => false, logError: () => {},
                _mvPlanVueSalarie: (k) => salarie && ['planning_entries', 'planning_hsup', 'planning_acomptes'].includes(k) };
    const ctx = { window: W, TENANT_ID: 'dom-test', navigator: { onLine: false }, _ignoreNext: {}, _ignoreBefore: {}, _mvRoDit: false,
                  showSyncBadge: () => {}, _queueSave: (k) => { E.file.push(k); }, _mvBaseMem: () => undefined, Date };
    vm.createContext(ctx); vm.runInContext(affectation(SRC.fb, 'fbSave'), ctx);
    return { W, E, ctx };
  }
  await T('G1', 'vue salarié : fbSave(planning_entries) n’envoie rien, ne met rien en file, ne bloque pas la prochaine mise à jour reçue', async () => {
    const M = monterSave(true); const r = await M.W.fbSave('planning_entries', {});
    return r && r.ok === false && r.vue === true && !M.E.file.length && !('planning_entries' in M.ctx._ignoreNext);
  });
  await T('G2', 'vue salarié : idem pour planning_hsup', async () => { const M = monterSave(true); const r = await M.W.fbSave('planning_hsup', {}); return r && r.vue === true && !M.E.file.length; });
  await T('G3', 'vue salarié : le reste s’enregistre comme avant (le journal passe la garde)', async () => { const M = monterSave(true); const r = await M.W.fbSave('journal', []); return r && r.queued === true && M.E.file.join() === 'journal'; });
  await T('G4', 'chez l’admin : le planning s’enregistre comme avant', async () => { const M = monterSave(false); const r = await M.W.fbSave('planning_entries', {}); return r && r.queued === true && M.E.file.join() === 'planning_entries'; });

  // W. Câblage de firebase.js — A. app.js
  const FB = sansCom(SRC.fb);
  await T('W1', 'firebase.js importe la règle cliente (src/planning-vue.js) — aucune copie', () => /from '\.\/planning-vue\.js'/.test(FB) && !/function planVueComplete/.test(FB));
  await T('W2', 'fbListen écoute _mvClesLues(FB_REALTIME), jamais FB_REALTIME nu', () => { const b = fonction(FB, 'fbListen'); return /_mvClesLues\(FB_REALTIME\)\.forEach/.test(b) && !/[^(]FB_REALTIME\.forEach/.test(b); });
  await T('W3', 'fbPullAll lit _mvClesLues(COLLECTIONS) et signale une vue personnelle absente', () => { const b = fonction(FB, 'fbPullAll'); return /_pullKeys\(_mvClesLues\(COLLECTIONS\)/.test(b) && /_mvPlanApresLecture\(st\)/.test(b); });
  await T('W4', 'applyFbData prend les vues AVANT tout ; la garde de fbSave vient après la lecture seule, avant toute marque d’écriture', () => {
    const a = fonction(FB, 'applyFbData'), s = affectation(FB, 'fbSave');
    const iG = s.indexOf('window._mvPlanVueSalarie(key)'), iRo = s.indexOf('ro: true'), iIg = s.indexOf('_ignoreNext[key]');
    return a.indexOf('_mvPlanRecevoir(key, value)') > 0 && a.indexOf('_mvPlanRecevoir(key, value)') < a.indexOf('_baseParcelles') && iG > iRo && iG < iIg && iRo > 0;
  });
  await T('W5', '_fbLoadAfterAuth assainit la copie AVANT la première lecture', () => {
    const i = FB.indexOf('window._fbLoadAfterAuth = async function'), b = FB.slice(i, FB.indexOf('\n};', i));
    return b.indexOf('_fbPlanAssainir()') > 0 && b.indexOf('_fbPlanAssainir()') < b.indexOf('await fbPullAll()');
  });
  const AP = sansCom(SRC.app);
  await T('A1', 'app.js donne à firebase.js de quoi réécrire la copie du téléphone', () => /\nwindow\._mvSnapSave = _mvSnapSave;/.test(AP));
  await T('A2', 'entrée dans l’appli (avec ou sans réseau) : assainir AVANT le premier dessin et la première lecture', () => {
    const b = fonction(AP, '_mvApresEntree'); return b.indexOf('_fbPlanAssainir()') > 0 && b.indexOf('_fbPlanAssainir()') < b.indexOf('_fbLoadAfterAuth') && b.indexOf('_fbPlanAssainir()') < b.indexOf('goHub()');
  });

  // R. Les règles (texte) — le moteur, lui, les joue dans mv-harnais-rules (section P)
  const RU = sansCom(SRC.rules);
  await T('R1', 'règles : lus par l’admin seul = paie + planning_entries + planning_hsup + planning_acomptes',
    () => /function isAdminReadDoc\(d\) \{\s*return d in \['paie', 'planning_entries', 'planning_hsup', 'planning_acomptes'\];\s*\}/.test(RU));
  await T('R2', 'règles : la lecture d’un membre exclut ces documents et les vues personnelles (racine ET sous-collections) ; l’ancienne forme a disparu', () =>
    RU.split("allow read: if isMyTenant(collection) && !isAdminReadDoc(docId) && !docId.matches('planning_moi_.*');").length - 1 === 2
    && !/isMyTenant\(collection\) && docId != 'paie'/.test(RU));
  await T('R3', 'règles : SA vue personnelle (ou l’admin) ; les vues ne s’écrivent pas depuis un téléphone (règle 3)', () =>
    /docId\.matches\('planning_moi_\.\*'\)\s*&& \(docId == 'planning_moi_' \+ request\.auth\.uid \|\| isAdmin\(\)\)/.test(RU)
    && /&& !isAdminOnlyDoc\(docId\) && docId != 'config'\s*&& !isVuePlanning\(docId\)/.test(RU)
    && /function isVuePlanning\(d\) \{\s*return d == 'planning_equipe' \|\| d\.matches\('planning_moi_\.\*'\);/.test(RU));
  await T('R4', 'mv-harnais-rules (émulateur) porte les 17 cas P et les 3 contre-épreuves MOTIFS-1', () =>
    Array.from({ length: 17 }, (_, i) => "['P" + String(i + 1).padStart(2, '0') + "','P',").every((k) => SRC.hr.includes(k)) && (SRC.hr.match(/\['MOTIFS-1 : /g) || []).length === 3);
  return res;
}

/* ── Contre-épreuves : [nom, source, ancre, remplacement, contrôles qui DOIVENT rougir] ── */
const MUT = [
  ['serveur : le vrai motif sort vers les collègues', 'calc', "if (!partiel && !retard) out = { absent: true, motif: 'autre' };", 'if (!partiel && !retard) out = { absent: true, motif: e.motif };', ['S2', 'S3']],
  ['serveur : plus de liste blanche (la journée sort entière)', 'calc', 'function vueJour(e) {\n  if (!estObjet(e)) return null;\n', 'function vueJour(e) {\n  if (!estObjet(e)) return null;\n  return Object.assign({}, e);\n', ['S1', 'S3', 'S5']],
  ['serveur : les vues renaissent dans un domaine supprimé', 'calc', "if (!Array.isArray(mbr)) return { ignore: 'aucune liste de membres' };", "if (false) return { ignore: 'aucune liste de membres' };", ['D5']],
  ['serveur : la vue personnelle porte TOUT le planning', 'calc', 'const v = { nom: c.nom, entries: estObjet(entries[c.nom]) ? entries[c.nom] : {} };', 'const v = { nom: c.nom, entries: entries };', ['D2']],
  ['déclencheur : une autre région', 'trig', "const REGION = 'europe-west1';", "const REGION = 'us-central1';", ['T2']],
  ['déclencheur : n’importe quelle collection réveille la fabrique', 'trig', "if (typeof coll !== 'string' || coll.indexOf(TENANT_PREFIX) !== 0) return null;", "if (typeof coll !== 'string') return null;", ['T4']],
  ['rattrapage : plus de vérification GUERETTECH', 'claims', "  assertGtAdmin(request);\n  const only = String((request.data && request.data.tenant) || '').trim();\n  try {\n    const db = admin.firestore();\n    const { deriverDomaine }",
   "  const only = String((request.data && request.data.tenant) || '').trim();\n  try {\n    const db = admin.firestore();\n    const { deriverDomaine }", ['Q1']],
  ['client : tout le monde a la vue complète', 'vue', "return r.indexOf('admin') >= 0;", 'return true;', ['C1', 'C2', 'K1']],
  ['client : la composition oublie SA vue personnelle', 'vue', 'out[moi.nom] = estObjet(moi.entries) ? moi.entries : {};', 'out[moi.nom] = out[moi.nom];', ['C3']],
  ['firebase.js : la garde de fbSave saute', 'fb', 'if (window._mvPlanVueSalarie && window._mvPlanVueSalarie(key)) {', 'if (false) {', ['G1', 'G2']],
  ['firebase.js : l’écoute revient aux trois documents de l’admin', 'fb', '_mvClesLues(FB_REALTIME).forEach(function (key) { _fbSubscribe(key); });', 'FB_REALTIME.forEach(function (key) { _fbSubscribe(key); });', ['W2']],
  ['firebase.js : l’assainissement oublie les heures sup', 'fb', '[window.PLANNING_HSUP, window.PLANNING_ACOMPTES].forEach(', '[window.PLANNING_ACOMPTES].forEach(', ['K3']],
  ['app.js : l’entrée n’assainit plus', 'app', '    if(window._fbPlanAssainir) window._fbPlanAssainir();', '    ;', ['A2']],
  ['règles : les trois documents redeviennent lisibles par tous', 'rules', "return d in ['paie', 'planning_entries', 'planning_hsup', 'planning_acomptes'];", "return d in ['paie'];", ['R1']],
];

/* ── Principal ─────────────────────────────────────────────────────────── */
let code = 0;
try {
  if (!CONTRE) {
    console.log(c.b('MA VIGNE — Harnais MOTIFS-1 · les motifs restent chez l’admin'));
    const res = await suite(SRC0);
    res.forEach(([id, lib, ok]) => console.log('  ' + (ok ? c.g('✓') : c.r('✗')) + ' ' + c.dim(id) + ' ' + lib));
    const ko = res.filter((r) => !r[2]).length;
    console.log('\n' + (ko ? c.r(`✗ ${ko} rouge(s) sur ${res.length}`) : c.g(`✓ ${res.length} vertes, 0 rouge`)));
    code = ko ? 1 : 0;
  } else {
    console.log(c.b('MA VIGNE — Harnais MOTIFS-1 · contre-épreuves'));
    const t = await suite(SRC0), kot = t.filter((r) => !r[2]).map((r) => r[0]);
    console.log('  ' + (kot.length ? c.r('✗ témoin ROUGE : ' + kot.join(', ')) : c.g('✓ témoin vert (sources intactes)')));
    let bad = kot.length ? 1 : 0;
    for (const [nom, cle, ancre, rempl, doivent] of MUT) {
      const n = SRC0[cle].split(ancre).length - 1;
      if (n !== 1) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — ancre trouvée ${n} fois (attendu 1) : la contre-épreuve ne prouve rien`); continue; }
      const r = await suite(Object.assign({}, SRC0, { [cle]: SRC0[cle].replace(ancre, rempl) }));
      const restent = doivent.filter((id) => (r.find((x) => x[0] === id) || [0, 0, true])[2]);
      if (restent.length) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — reste VERT sur ${restent.join(', ')}`); }
      else console.log('  ' + c.g('✓') + ` ${nom} ${c.dim('→ rouge sur ' + doivent.join(', '))}`);
    }
    console.log('\n  ' + (MUT.length - (bad - (kot.length ? 1 : 0))) + '/' + MUT.length + ' contre-épreuves rougissent' + (kot.length ? c.r(' — mais le témoin est rouge') : ''));
    code = bad ? 1 : 0;
  }
} catch (e) {
  console.error(c.r('\n✗ Le harnais a planté (ce n’est PAS un résultat) : ') + (e && e.stack || e));
  code = 2;
}
process.exit(code);
