// HARNAIS — NOTIF-3 (§311) : UNE seule notification par jour travaillé, à l'heure de prise de poste du planning.
//   node scripts/mv-harnais-notif3.mjs           → doit être vert
//   node scripts/mv-harnais-notif3.mjs --contre  → chaque défaut réinjecté doit rougir
// A. functions/notif-calc.js EXÉCUTÉ : abonnement (services d'envoi seulement), publication, compte → membre, heure de
//    Paris (été, hiver), et le choix d'un passage : la prise de poste dans [ce quart d'heure, le suivant), jamais deux fois.
// B. functions/notif.js EXÉCUTÉ avec un faux require (Firestore, web-push, secrets factices) : droits, membre lu sur
//    l'adresse VÉRIFIÉE du compte, envoi, « déjà reçu », abonnement retiré sur 410, options des quatre fonctions.
// C. Lu (commentaires retirés) : les notifications à répétition ont disparu de src/, fbSave republie, sw.js affiche.
// D. reglages.js/_mvNotifLignes EXÉCUTÉE : priorité selon l'équipe, tracteur et DAR pour l'admin et le tractoriste seuls.
// E. planning.js/_planPrisesDePoste EXÉCUTÉE sur un planning bouchonné PAR ARGUMENTS : congé, arrêt, hors contrat,
//    dimanche à 0 h → rien ; absence en début de journée → l'heure de retour ; horaire saisi → le sien.
// Les prénoms sont inventés : ce dépôt est public.
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import crypto from 'crypto';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const BASE = { calc: lire('functions/notif-calc.js'), fn: lire('functions/notif.js'), regl: lire('src/reglages.js'), app: lire('src/app.js'),
  fb: lire('src/firebase.js'), trac: lire('src/tracteur.js'), plan: lire('src/planning.js'), sw: lire('public/sw.js'), html: lire('index.html') };

function corps(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } } throw new Error('accolades : ' + debut); }
function calcDe(src) { const m = { exports: {} }; vm.runInNewContext(src, { module: m, exports: m.exports, URL, console }, { filename: 'notif-calc.js' }); return m.exports; }

const P256 = 'B' + 'x'.repeat(86), AUTH = 'a'.repeat(22);
const abo = (h, k) => ({ endpoint: 'https://' + h + '/push/' + k, keys: { p256dh: P256, auth: AUTH } });

function partieA(S, T) {
  const C = calcDe(S.calc);
  T('A1 abonnement : Chrome et iPhone acceptés, http, adresse étrangère ou déguisée et clés fausses refusés',
    !!C.abonnementValide(abo('fcm.googleapis.com', 'x1')) && !!C.abonnementValide(abo('web.push.apple.com', 'x2'))
    && !C.abonnementValide({ endpoint: 'http://fcm.googleapis.com/x', keys: { p256dh: P256, auth: AUTH } })
    && !C.abonnementValide(abo('pirate.example.com', 'x')) && !C.abonnementValide(abo('fcm.googleapis.com.pirate.net', 'x'))
    && !C.abonnementValide({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'court', auth: AUTH } }));
  const pub = { '2026-10-12': { Jean: { h: '07:00', l: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'x'.repeat(300)] } } };
  const v = C.publicationValide(pub);
  T('A2 publication : acceptée, six lignes au plus, 160 caractères au plus ; heure mal écrite, date fausse ou 32 jours refusés',
    !!v && v['2026-10-12'].Jean.l.length === 6 && v['2026-10-12'].Jean.h === '07:00'
    && !C.publicationValide({ '2026-10-12': { Jean: { h: '7:00', l: [] } } }) && !C.publicationValide({ '12/10': { Jean: { h: '07:00' } } })
    && !C.publicationValide(Object.fromEntries(Array.from({ length: 32 }, (_, i) => ['2026-11-' + String(i + 1).padStart(2, '0'), {}]))));
  const eq = [{ nom: 'Jean', email: 'Jean.Dom@Exemple.fr' }, { nom: 'Lucie', email: 'lucie@exemple.fr', statut: 'Inactif' }];
  T('A3 compte → membre par l’adresse vérifiée (sans tenir compte des majuscules) ; fiche inactive ou inconnue : personne',
    (C.membreDuCompte(eq, 'jean.dom@exemple.fr') || {}).nom === 'Jean' && !C.membreDuCompte(eq, 'lucie@exemple.fr') && !C.membreDuCompte(eq, 'x@y.fr'));
  const e1 = C.parisDe(new Date('2026-10-12T05:07:00Z')), e2 = C.parisDe(new Date('2026-11-02T06:14:00Z')), e3 = C.parisDe(new Date('2026-10-25T22:30:00Z'));
  T('A4 heure de Paris ramenée au quart d’heure, été comme hiver (' + e1.iso + ' ' + e1.hhmm + ' · ' + e2.hhmm + ' · ' + e3.iso + ' ' + e3.hhmm + ')',
    e1.iso === '2026-10-12' && e1.min === 420 && e2.iso === '2026-11-02' && e2.hhmm === '07:00' && e3.iso === '2026-10-25' && e3.hhmm === '23:30');
  const pubs = [{ slug: 'dom', jours: { '2026-10-12': { Jean: { h: '07:00', l: ['Priorité : Taille'] }, Lucie: { h: '07:10', l: [] }, Marc: { h: '07:15', l: [] } } } }];
  const abos = [{ id: 'j1', slug: 'dom', nom: 'Jean', abo: {} }, { id: 'l1', slug: 'dom', nom: 'Lucie', abo: {} }, { id: 'm1', slug: 'dom', nom: 'Marc', abo: {} },
    { id: 'j2', slug: 'dom', nom: 'Jean', abo: {}, dernier: '2026-10-12' }, { id: 'a1', slug: 'autre', nom: 'Jean', abo: {} }, { id: 'p1', slug: 'dom', nom: 'Paul', abo: {} }];
  const p7 = C.planDuQuart(pubs, abos, { iso: '2026-10-12', min: 420 }), ids = p7.map(x => x.id).sort().join(',');
  const mj = (p7.find(x => x.id === 'j1') || {}).message || {}, ml = (p7.find(x => x.id === 'l1') || {}).message || {};
  T('A5 à 07:00 : Jean (07:00) et Lucie (07:10) — pas Marc (07:15), ni un téléphone déjà servi, ni un autre domaine, ni un absent (' + ids + ')',
    ids === 'j1,l1' && mj.titre === 'Bonjour Jean' && mj.corps === 'Priorité : Taille' && ml.corps === 'Bonne journée !' && mj.tag === 'mv-matin-2026-10-12');
  const p715 = C.planDuQuart(pubs, abos, { iso: '2026-10-12', min: 435 });
  T('A6 à 07:15 : Marc, et lui seul', p715.map(x => x.id).join(',') === 'm1');
}

function fauxServeur(S, secrets) {
  const store = new Map(), envois = [], vapid = [];
  const snap = (p) => ({ exists: store.has(p), id: p.split('/').pop(), data: () => store.get(p) });
  const db = { doc: (p) => ({ get: async () => snap(p), set: async (d, o) => { store.set(p, o && o.merge ? Object.assign({}, store.get(p) || {}, d) : d); }, delete: async () => { store.delete(p); } }),
    collection: (c) => ({ get: async () => ({ docs: [...store.keys()].filter(k => k.startsWith(c + '/') && k.split('/').length === 2).map(snap) }) }) };
  class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  const fakes = {
    'firebase-functions/v2/https': { onCall: (opts, fn) => ({ opts, fn }), HttpsError },
    'firebase-functions/v2/scheduler': { onSchedule: (opts, fn) => ({ opts, fn }) },
    'firebase-functions/params': { defineSecret: (n) => ({ name: n, value: () => secrets[n] }) },
    'firebase-functions': { logger: { info() {}, warn() {}, error() {} } },
    'firebase-admin': { initializeApp() {}, firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'TS' } }) },
    crypto,
    'web-push': { setVapidDetails: (...a) => { vapid.push(a); }, sendNotification: async (a, charge) => {
      envois.push({ endpoint: a.endpoint, charge: JSON.parse(charge) });
      if (a.endpoint.includes('parti')) { const e = new Error('Gone'); e.statusCode = 410; throw e; } } },
    './notif-calc': calcDe(S.calc) };
  const m = { exports: {} };
  vm.runInNewContext(S.fn, { require: (n) => { if (!(n in fakes)) throw new Error('require inattendu : ' + n); return fakes[n]; }, module: m, exports: m.exports, console }, { filename: 'notif.js' });
  return { F: m.exports, store, envois, vapid };
}
async function code(p) { try { await p; return 'ok'; } catch (e) { return e.code || ('plante:' + e.message); } }
async function partieB(S, T) {
  const X = fauxServeur(S, { VAPID_PUBLIQUE: 'CLE-PUB', VAPID_PRIVE: 'CLE-PRIV' }), F = X.F;
  const jeton = (o) => ({ auth: { uid: 'u-' + (o.email || 'x'), token: Object.assign({ tenant: 'dom' }, o) } });
  X.store.set('mavigne_dom/membres', { value: [{ nom: 'Jean', email: 'jean@exemple.fr' }, { nom: 'Lucie', email: 'lucie@exemple.fr' }] });
  const pub = { '2026-10-12': { Jean: { h: '07:00', l: ['Priorité : Taille'] }, Lucie: { h: '07:05', l: [] } } };
  const r1 = await code(F.notifHoraires.fn(Object.assign(jeton({ email: 'jean@exemple.fr' }), { data: { jours: pub } })));
  T('B1 publier sans être administrateur : refusé, rien d’écrit (' + r1 + ')', r1 === 'permission-denied' && !X.store.has('mv_notif_horaires/dom'));
  const r2 = await code(F.notifHoraires.fn(Object.assign(jeton({ email: 'chef@exemple.fr', adm: true }), { data: { jours: pub } })));
  T('B2 l’administrateur publie : le document du domaine porte les 14 jours validés', r2 === 'ok' && !!X.store.get('mv_notif_horaires/dom') && X.store.get('mv_notif_horaires/dom').jours['2026-10-12'].Jean.h === '07:00');
  const r3 = await code(F.notifAbonner.fn(Object.assign(jeton({ email: 'JEAN@exemple.fr' }), { data: { abo: abo('fcm.googleapis.com', 'jean'), email: 'lucie@exemple.fr' } })));
  const a3 = [...X.store.entries()].filter(([k]) => k.startsWith('mv_notif_abos/')).map(([, v]) => v);
  T('B3 un téléphone s’abonne : le membre vient de l’adresse VÉRIFIÉE du compte, jamais de ce que le téléphone envoie', r3 === 'ok' && a3.length === 1 && a3[0].nom === 'Jean' && a3[0].slug === 'dom');
  const r4 = await code(F.notifAbonner.fn(Object.assign(jeton({ email: 'jean@exemple.fr' }), { data: { abo: abo('pirate.example.com', 'z') } })));
  const r5 = await code(F.notifAbonner.fn(Object.assign(jeton({ email: 'inconnu@exemple.fr' }), { data: { abo: abo('fcm.googleapis.com', 'z') } })));
  const r6 = await code(F.notifAbonner.fn(Object.assign(jeton({ email: 'jean@exemple.fr', demo: true }), { data: { abo: abo('fcm.googleapis.com', 'z') } })));
  T('B4 adresse d’envoi étrangère, compte sans fiche, démo : refusés (' + [r4, r5, r6].join(' · ') + ')', r4 === 'invalid-argument' && r5 === 'failed-precondition' && r6 === 'permission-denied');
  const oc = ['notifCle', 'notifAbonner', 'notifHoraires'].every(n => F[n].opts.enforceAppCheck === true && F[n].opts.region === 'europe-west1');
  const sc = F.notifMatin.opts, sec = (sc.secrets || []).map(s => s.name).sort().join(',');
  T('B5 appels protégés par App Check, en europe-west1 ; passage tous les quarts d’heure, heure de Paris, avec les deux secrets',
    oc && sc.schedule === '*/15 4-20 * * *' && sc.timeZone === 'Europe/Paris' && sec === 'VAPID_PRIVE,VAPID_PUBLIQUE');
  T('B6 la clé publique sort de son secret', (await F.notifCle.fn(jeton({ email: 'jean@exemple.fr' }))).cle === 'CLE-PUB');
  await code(F.notifAbonner.fn(Object.assign(jeton({ email: 'lucie@exemple.fr' }), { data: { abo: abo('fcm.googleapis.com', 'parti-lucie') } })));
  await code(F.notifMatin.fn({ scheduleTime: '2026-10-12T05:00:00Z' }));
  const e1 = X.envois.map(e => e.charge.titre).sort().join(',');
  const abos = () => [...X.store.entries()].filter(([k]) => k.startsWith('mv_notif_abos/')).map(([, v]) => v);
  const jean = abos().find(a => a.nom === 'Jean') || {};
  T('B7 à 07:00 : Jean et Lucie partent ; Jean marqué servi ; l’abonnement de Lucie, refusé (410), est retiré (' + e1 + ')',
    e1 === 'Bonjour Jean,Bonjour Lucie' && jean.dernier === '2026-10-12' && !abos().some(a => a.nom === 'Lucie') && X.vapid.length === 1);
  const avant = X.envois.length; await code(F.notifMatin.fn({ scheduleTime: '2026-10-12T05:00:00Z' }));
  T('B8 le même passage rejoué ne renvoie rien', X.envois.length === avant);
}

function partieC(S, T) {
  const src = { regl: sansCom(S.regl), app: sansCom(S.app), trac: sansCom(S.trac), fb: sansCom(S.fb) };
  const tout = Object.values(src).join('\n');
  const restes = ['checkNotifAlerts', 'scheduleNotifCheck', 'notifyPriorityChange', 'checkRepNotifications'].filter(n => tout.includes(n));
  T('C1 plus aucune notification à répétition : ni priorité ni DAR toutes les heures, ni rappel tracteur (' + (restes.join(', ') || 'aucun reste') + ')', !restes.length && !/setInterval\([^)]*3600000/.test(tout));
  T('C2 plus de notification à chaque version (NOTIF-1)', !src.app.includes("_swNotify('Mise à jour"));
  T('C3 fbSave republie après un enregistrement de l’administrateur', src.fb.includes('window._mvNotifPlanifier(key)'));
  T('C4 le démarrage abonne ce téléphone et publie le jour', src.regl.includes('window._mvNotifDemarrage=function') && src.regl.includes('window._mvNotifPlanifier=function')
    && src.app.includes('window._mvNotifDemarrage()'));
  const sw = sansCom(S.sw);
  T('C5 sw.js montre la notification reçue (push, gardée par waitUntil) et rouvre l’appli au toucher',
    sw.includes("self.addEventListener('push'") && sw.includes('event.waitUntil(self.registration.showNotification(') && sw.includes("self.addEventListener('notificationclick'"));
  T('C6 Réglages ne promet plus d’« alertes gel »', !S.html.includes('Alertes gel') && !src.regl.includes('alertes gel'));
}

function partieD(S, T) {
  const ctx = { console, Date, Math, JSON, String, Array, Object, isNaN, tNom: (t) => ({ taille: 'Taille', relevage: 'Relevage' })[t] || ('?' + t) };
  ctx.window = ctx;
  ctx.CONFIG = { tachesPrio: { items: [{ t: 'taille', equipe: ['Jean'] }, { t: 'relevage', equipe: [] }] } };
  ctx.priorityMessage = 'On finit le secteur bas';
  ctx.TRACTEURS_LIST = [{ id: 't1', nom: 'T1', modele: 'Fendt' }, { id: 't2', nom: 'T2' }, { id: 't3', nom: 'T3' }];
  ctx.REPARATEUR = { t1: { prevu_retour: '2026-10-13' }, t2: { prevu_retour: '2026-10-12' }, t3: { prevu_retour: '2026-10-01' } };
  ctx.TRAITEMENTS = [{ date: '2026-10-10', produit: 'Cuivre X' }, { date: '2026-10-09', produit: 'Cuivre X' }, { date: '2026-09-01', produit: 'Soufre Y' }];
  ctx.CATALOGUE = [{ nom: 'Cuivre X', dar: 5 }, { nom: 'Soufre Y', dar: 3 }];
  vm.createContext(ctx);
  vm.runInContext([corps(S.regl, 'function _mvNotifJour('), corps(S.regl, 'function _mvNotifLignes(')].join('\n'), ctx, { filename: 'notif3-lignes.js' });
  const o1 = ctx._mvNotifLignes({ nom: 'Jean', roles: ['ouvrier'] }, '2026-10-12');
  T('D1 ouvrier de l’équipe : la priorité qui le concerne et le message, rien du tracteur ni des DAR (' + o1.join(' | ') + ')',
    o1.length === 2 && o1[0] === 'Priorité : Taille · Relevage' && o1[1] === 'On finit le secteur bas');
  const o2 = ctx._mvNotifLignes({ nom: 'Marc', roles: ['ouvrier'] }, '2026-10-12');
  T('D2 hors de l’équipe d’une priorité : seulement les priorités de tous', o2[0] === 'Priorité : Relevage');
  const t1 = ctx._mvNotifLignes({ nom: 'Paul', roles: ['tractoriste'] }, '2026-10-12');
  T('D3 tractoriste : retour demain, aujourd’hui, en retard ; un seul DAR par produit, à 3 jours (' + t1.slice(2).join(' | ') + ')',
    t1.includes('T1 (Fendt) : retour du réparateur prévu demain') && t1.includes('T2 : retour du réparateur prévu aujourd’hui') && t1.includes('T3 : retour du réparateur en retard')
    && t1.filter(x => x.startsWith('DAR ')).join('|') === 'DAR Cuivre X : récolte possible dans 3 j');
  const t2 = ctx._mvNotifLignes({ nom: 'Paul', roles: ['tractoriste'] }, '2026-10-16');
  T('D4 le délai terminé ne s’annonce plus', !t2.some(x => x.startsWith('DAR ')));
}

function partieE(S, T) {
  const ans = [], E = { 'Lucie|9|12': { type: 'cp', heures: 7 }, 'Marc|9|12': { absent: true, motif: 'maladie' }, 'Paul|9|12': { absent: true, abs_de: '07:00', abs_a: '09:30' },
    'Jean|9|13': { timing: { debut: '06:00', fin: '14:00' } } };
  const ctx = { console, Date, Math, parseInt, String };
  Object.assign(ctx, {
    _planMbrs: () => [{ nom: 'Jean' }, { nom: 'Lucie' }, { nom: 'Marc' }, { nom: 'Paul' }, { nom: 'Hors' }],
    _planJourCouvert: (mbr) => mbr.nom !== 'Hors',
    _pEntDay: (nom, m, d) => E[nom + '|' + m + '|' + d] || null,
    _planAbsPartiel: (e) => !!(e && e.abs_de && e.abs_a),
    _planPlId: () => 'standard',
    _planDayH: (plId, m, d, e, Y) => (new Date(Y, m, d).getDay() === 0 ? 0 : (e && e.abs_de ? 5 : 7)),
    _planRetardBornes: (mbr, m, d) => { const e = E[mbr.nom + '|' + m + '|' + d]; return { t0: (e && e.timing && e.timing.debut) || '7:00' }; } });
  ctx.window = ctx; ctx._planSurAnnee = (y, fn) => { ans.push(y); return fn(); };
  vm.createContext(ctx);
  vm.runInContext(corps(S.plan, 'window._planPrisesDePoste=function('), ctx, { filename: 'notif3-postes.js' });
  const o = ctx._planPrisesDePoste(7, '2026-10-12T08:00:00'), j12 = o['2026-10-12'] || {}, j13 = o['2026-10-13'] || {}, j18 = o['2026-10-18'] || {};
  T('E1 lundi : Jean à 07:00, Paul à 09:30 (absent en début de journée) ; ni congé, ni arrêt, ni hors contrat (' + JSON.stringify(j12) + ')',
    JSON.stringify(j12) === '{"Jean":"07:00","Paul":"09:30"}');
  T('E2 mardi : l’horaire saisi du jour fait foi (06:00)', j13.Jean === '06:00');
  T('E3 dimanche à 0 h : personne ; sept jours, l’année posée pour chacun', Object.keys(j18).length === 0 && Object.keys(o).length === 7 && ans.length === 7 && ans.every(y => y === 2026));
}

async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const [lib, f] of [['A', () => partieA(S, T)], ['B', () => partieB(S, T)], ['C', () => partieC(S, T)], ['D', () => partieD(S, T)], ['E', () => partieE(S, T)]]) {
    try { await f(); } catch (e) { T(lib + ' a planté : ' + e.message, false); }
  }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('contre-épreuve introuvable ou multiple : ' + a.slice(0, 60)); return s.replace(a, b); };
if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert  ' : '  ROUGE ') + n); });
  console.log(ko ? `NOTIF-3 : ${ko} ROUGE(S) sur ${res.length}` : `NOTIF-3 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['le quart d’heure suivant est servi trop tôt', S => ({ ...S, calc: remp(S.calc, 'if (m < quand.min || m >= quand.min + PAS_MIN) return;', 'if (m < quand.min || m > quand.min + PAS_MIN) return;') })],
    ['un téléphone déjà servi l’est encore', S => ({ ...S, calc: remp(S.calc, '    if (a.dernier === quand.iso) return;\n', '') })],
    ['n’importe quelle adresse d’envoi passe', S => ({ ...S, calc: remp(S.calc, "!HOTES.some((re) => re.test(u.hostname))", 'false') })],
    ['un salarié publie les horaires', S => ({ ...S, fn: remp(S.fn, "  if (request.auth.token.adm !== true) throw new HttpsError('permission-denied', 'Réservé à l’administrateur du domaine.');\n", '') })],
    ['le membre vient de ce que le téléphone envoie', S => ({ ...S, fn: remp(S.fn, 'request.auth.token.email);', '(request.data && request.data.email));') })],
    ['un abonnement refusé (410) reste', S => ({ ...S, fn: remp(S.fn, "await db.doc(ABOS + '/' + p.id).delete(); partis++;", 'partis++;') })],
    ['la priorité revient toutes les heures', S => ({ ...S, regl: S.regl + '\nfunction checkNotifAlerts(){}\nsetInterval(checkNotifAlerts,3600000);\n' })],
    ['la notification à chaque version revient', S => ({ ...S, app: S.app + "\n_swNotify('Mise à jour Ma Vigne',{});\n" })],
    ['fbSave ne republie plus', S => ({ ...S, fb: remp(S.fb, 'window._mvNotifPlanifier(key)', 'void 0') })],
    ['sw.js n’attend plus l’affichage', S => ({ ...S, sw: remp(S.sw, 'event.waitUntil(self.registration.showNotification(', '(self.registration.showNotification(') })],
    ['tracteur et DAR pour tout le monde', S => ({ ...S, regl: remp(S.regl, "  if(R.indexOf('admin')<0&&R.indexOf('tractoriste')<0) return l.slice(0,6);\n", '') })],
    ['un jour de congé reçoit son message', S => ({ ...S, plan: remp(S.plan, "        if(e&&(e.type==='cp'||e.type==='recup')) return;\n", '') })],
    ['l’absence en début de journée est ignorée', S => ({ ...S, plan: remp(S.plan, '&&de<=t0&&t0<fa) t0=fa;', '&&false) t0=fa;') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `NOTIF-3 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `NOTIF-3 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
