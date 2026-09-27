#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RULES-1 : LES RÈGLES FIRESTORE, EXÉCUTÉES PAR LE VRAI MOTEUR (§189)
   Lancer : npm run test:rules        (démarre l'émulateur, joue, puis --contre)
   À la main, émulateur déjà lancé :
            FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/mv-harnais-rules.mjs [--contre]

   ══ POURQUOI ══
   Jusqu'ici, AUCUN script n'exécutait `firestore.rules`. `mv-harnais-droits`,
   `mv-harnais-version`, `harnais-claude-md` le LISENT comme du texte : ils voient
   qu'une ligne existe, jamais ce que le moteur en fait. Or une règle Firestore se
   trompe en silence — un refus de lecture est avalé par `_pullKeys` (§8c), et une
   autorisation de trop ne se voit que le jour où quelqu'un s'en sert.
   L'isolement entre domaines (un membre de A ne lit JAMAIS B) est la promesse la plus
   grave du produit : elle se prouve ici, requête par requête, contre le moteur réel
   (`@firebase/rules-unit-testing` sur l'émulateur Firestore).

   ══ CE QU'IL TIENT ══
     A. Isolement : A ne lit ni n'écrit B (racine, sous-collection), fiche Inactive
        (`off`) dehors, sans claim `tenant` dehors, anonyme dehors, hors `mavigne_*` dehors.
     B. Rôles : `ro` lit sans écrire (sauf `error_log` borné et `appareils`), docs
        admin-only, `paie` illisible hors admin, `config` limité à home_layout/gnr pour
        un non-admin, forme `{ value }`, plafond de liste, `adm` + `ro` ≠ admin.
     C. Démo : lit domaine-dupont (sauf paie), n'écrit jamais, même avec un `tenant`.
     D. GUERETTECH : l'identité seule ne suffit pas (claim `gts` exigé et non expiré).
     E. Collections fermées : _gt_otp, leads, mail, _mv_signatures, ephy, registre public.
     F. Constats : écarts connus, AFFICHÉS mais non bloquants (décision de Nico en attente).

   ⚠️ LA CONTRE-ÉPREUVE REJOUE LE MOTEUR SUR DES RÈGLES FAUTIVES. Chaque faute est
     posée sur une COPIE EN MÉMOIRE du fichier (ancre trouvée EXACTEMENT une fois, sinon
     rouge : une ancre introuvable prouverait n'importe quoi), rechargée dans l'émulateur
     sur une base vidée, et le cas qui la vise doit rougir — LUI, nommément. Témoin
     d'abord : les règles intactes doivent sortir vertes dans le même dispositif.
   ⚠️ Rien ici ne touche la prod : projet `demo-mv-rules` (un id `demo-*` n'atteint jamais un vrai projet).
   ⚠️ CHEMINS : fileURLToPath (§53).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';

/* ⚠️ SILENCE DU SDK — vécu au premier run réel (27/09, chez Nico) : chaque refus ATTENDU faisait
   écrire au SDK Firestore un bloc « PERMISSION_DENIED … false for 'create' @ L206 … » — des
   centaines de lignes pour 53 cas verts, où un vrai rouge se serait noyé. Le harnais ne lit PAS
   ces journaux : un refus se juge sur l'exception (jouerUn), et toute AUTRE exception fait
   planter en code 2. Faire taire le journal ne masque donc rien de ce que le harnais mesure. */
setLogLevel('silent');

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = fs.readFileSync(path.join(RACINE, 'firestore.rules'), 'utf8');
const c = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`,
            dim: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };

const HOTE = process.env.FIRESTORE_EMULATOR_HOST;
if (!HOTE) {
  console.error(c.r('\n✗ Émulateur Firestore introuvable (FIRESTORE_EMULATOR_HOST absent).'));
  console.error('  → npm run test:rules   (démarre l\'émulateur puis lance ce harnais)');
  console.error('  ⚠️ Il faut Java 21 sur le poste (l\'émulateur Firestore est un .jar).\n');
  process.exit(1);
}
const [host, portTxt] = HOTE.split(':');
const port = Number(portTxt);

/* ── Identités ─────────────────────────────────────────────────────────── */
const H = 3600e3;
const ID = {
  adminA:   ['u-adm-a',  { tenant: 'a', adm: true }],
  ouvrierA: ['u-ouv-a',  { tenant: 'a' }],
  roA:      ['u-ro-a',   { tenant: 'a', ro: true }],
  roAdmA:   ['u-roadm-a',{ tenant: 'a', ro: true, adm: true }],
  offA:     ['u-off-a',  { tenant: 'a', adm: true, off: true }],
  adminB:   ['u-adm-b',  { tenant: 'b', adm: true }],
  sansTen:  ['u-sans',   {}],
  demo:     ['u-demo',   { demo: true }],
  demoTen:  ['u-demo2',  { demo: true, tenant: 'domaine-dupont', adm: true }],
  gtSans:   ['u-gt1',    { email: 'ngdevpro@gmail.com', email_verified: true }],
  gtNonVer: ['u-gt2',    { email: 'ngdevpro@gmail.com', email_verified: false, gts: 0 }], // gts posé à l'appel
  gtOk:     ['u-gt3',    { email: 'ngdevpro@gmail.com', email_verified: true, gts: 0 }],
  gtExp:    ['u-gt4',    { gtAdmin: true, gts: 0 }],
  gtClaim:  ['u-gt5',    { gtAdmin: true, gts: 0 }],
};

/* ── Données de départ (écrites règles désactivées) ────────────────────── */
const SEED = {
  'mavigne_a/journal':            { value: [{ id: 1 }] },
  'mavigne_a/paie':               { value: { taux: { X: 15 } } },
  'mavigne_a/membres':            { value: [{ nom: 'X' }] },
  'mavigne_a/config':             { value: { home_layout: ['a'], gnr: { l: 100 }, cp_mode: 'ouvrables' } },
  'mavigne_a/journal/sous/x':     { value: 1 },
  'mavigne_b/journal':            { value: [{ id: 2 }] },
  'mavigne_b/journal/sous/x':     { value: 1 },
  'mavigne_domaine-dupont/journal': { value: [] },
  'mavigne_domaine-dupont/paie':  { value: {} },
  '_guerettech/clients':          { clients: {} },
  '_guerettech/tenants':          { slugs: ['a', 'b'] },
  '_gt_otp/x':                    { h: 'x' },
  'leads/x':                      { email: 'x' },
  'mail/x':                       { to: 'x' },
  'ephy/vigne':                   { value: [] },
  '_mv_signatures/a':             { cgu: true },
  'foo/bar':                      { value: 1 },
};

/* ── Les cas ───────────────────────────────────────────────────────────────
   [id, section, libellé, identité | null (anonyme), op, chemin, données?, attendu]
   op : 'get' | 'set' ; attendu : true = autorisé, false = refusé. */
const liste = n => Array.from({ length: n }, (_, i) => i);
const CAS = [
  // A. Isolement
  ['A01','A','un membre de A lit son domaine',                    'ouvrierA','get','mavigne_a/journal',null,true],
  ['A02','A','★ un membre de A ne lit PAS le domaine B',          'ouvrierA','get','mavigne_b/journal',null,false],
  ['A03','A','★ un admin de A n\'écrit PAS dans B',               'adminA','set','mavigne_b/journal',{ value: [] },false],
  ['A04','A','★ un admin de B ne lit PAS la paie de A',           'adminB','get','mavigne_a/paie',null,false],
  ['A05','A','★ A ne lit PAS une sous-collection de B',           'ouvrierA','get','mavigne_b/journal/sous/x',null,false],
  ['A06','A','A lit une sous-collection de A',                    'ouvrierA','get','mavigne_a/journal/sous/x',null,true],
  ['A07','A','★ fiche Inactive (off) : plus de lecture',          'offA','get','mavigne_a/journal',null,false],
  ['A08','A','★ fiche Inactive (off) : plus d\'écriture',         'offA','set','mavigne_a/journal',{ value: [] },false],
  ['A09','A','compte sans claim tenant : refusé',                 'sansTen','get','mavigne_a/journal',null,false],
  ['A10','A','anonyme : refusé',                                  null,'get','mavigne_a/journal',null,false],
  ['A11','A','collection hors mavigne_* : refusée à un membre',   'adminA','get','foo/bar',null,false],
  ['A12','A','un membre non-ro écrit le métier courant',          'ouvrierA','set','mavigne_a/journal',{ value: [{ id: 3 }] },true],
  // B. Rôles
  ['B01','B','ro lit son domaine',                                'roA','get','mavigne_a/journal',null,true],
  ['B02','B','★ ro n\'écrit pas le métier courant',               'roA','set','mavigne_a/journal',{ value: [] },false],
  ['B03','B','ro ajoute au journal d\'erreurs (≤ 100)',           'roA','set','mavigne_a/error_log',{ value: liste(100) },true],
  ['B04','B','★ ro : journal d\'erreurs de 101 lignes refusé',    'roA','set','mavigne_a/error_log',{ value: liste(101) },false],
  ['B05','B','ro note son appareil (appareils)',                  'roA','set','mavigne_a/appareils',{ value: { d1: { v: '1' } } },true],
  ['B06','B','★ un ouvrier n\'écrit pas membres',                 'ouvrierA','set','mavigne_a/membres',{ value: [] },false],
  ['B07','B','l\'admin écrit membres',                            'adminA','set','mavigne_a/membres',{ value: [{ nom: 'Y' }] },true],
  ['B08','B','★ un ouvrier n\'écrit pas planning_entries',        'ouvrierA','set','mavigne_a/planning_entries',{ value: [] },false],
  ['B09','B','★ un ouvrier ne lit pas paie',                      'ouvrierA','get','mavigne_a/paie',null,false],
  ['B10','B','l\'admin lit paie',                                 'adminA','get','mavigne_a/paie',null,true],
  ['B11','B','un ouvrier change home_layout seul (config)',       'ouvrierA','set','mavigne_a/config',
     { value: { home_layout: ['b'], gnr: { l: 100 }, cp_mode: 'ouvrables' } },true],
  ['B12','B','★ un ouvrier ne change pas cp_mode (config)',       'ouvrierA','set','mavigne_a/config',
     { value: { home_layout: ['a'], gnr: { l: 100 }, cp_mode: 'ouvres' } },false],
  ['B13','B','l\'admin change cp_mode (config)',                  'adminA','set','mavigne_a/config',
     { value: { home_layout: ['a'], gnr: { l: 100 }, cp_mode: 'ouvres' } },true],
  ['B14','B','★ forme : un champ hors { value } est refusé',      'adminA','set','mavigne_a/journal',{ value: [], x: 1 },false],
  ['B15','B','★ plafond : 3 001 parcelles refusées',              'adminA','set','mavigne_a/parcelles',{ value: liste(3001) },false],
  ['B16','B','3 000 parcelles acceptées',                         'adminA','set','mavigne_a/parcelles',{ value: liste(3000) },true],
  ['B17','B','★ adm + ro n\'est pas admin (membres refusé)',      'roAdmA','set','mavigne_a/membres',{ value: [] },false],
  // C. Démo
  ['C01','C','la démo lit domaine-dupont',                        'demo','get','mavigne_domaine-dupont/journal',null,true],
  ['C02','C','★ la démo ne lit pas la paie de domaine-dupont',    'demo','get','mavigne_domaine-dupont/paie',null,false],
  ['C03','C','★ la démo ne lit pas un domaine client',            'demo','get','mavigne_a/journal',null,false],
  ['C04','C','★ la démo n\'écrit pas, même avec un tenant + adm', 'demoTen','set','mavigne_domaine-dupont/journal',{ value: [] },false],
  ['C05','C','★ la démo n\'écrit pas le journal d\'erreurs',      'demoTen','set','mavigne_domaine-dupont/error_log',{ value: [] },false],
  // D. GUERETTECH
  ['D01','D','★ e-mail GT vérifié SANS session (gts) : refusé',   'gtSans','get','mavigne_a/journal',null,false],
  ['D02','D','e-mail GT vérifié + session ouverte : lit A',       'gtOk','get','mavigne_a/paie',null,true],
  ['D03','D','★ e-mail GT NON vérifié + session : refusé',        'gtNonVer','get','mavigne_a/journal',null,false],
  ['D04','D','★ session GT expirée : refusée',                    'gtExp','get','mavigne_a/journal',null,false],
  ['D05','D','claim gtAdmin + session : lit _guerettech/clients', 'gtClaim','get','_guerettech/clients',null,true],
  ['D06','D','★ un admin de domaine ne lit pas _guerettech',      'adminA','get','_guerettech/clients',null,false],
  // E. Collections fermées ou publiques
  ['E01','E','★ _gt_otp fermé même à GT en session',              'gtClaim','get','_gt_otp/x',null,false],
  ['E02','E','registre des slugs lisible sans compte',            null,'get','_guerettech/tenants',null,true],
  ['E03','E','★ registre des slugs : un admin n\'y écrit pas',    'adminA','set','_guerettech/tenants',{ slugs: [] },false],
  ['E04','E','★ leads : un membre ne lit pas',                    'adminA','get','leads/x',null,false],
  ['E05','E','leads : GT en session lit',                         'gtClaim','get','leads/x',null,true],
  ['E06','E','★ leads : GT n\'écrit pas',                         'gtClaim','set','leads/y',{ email: 'y' },false],
  ['E07','E','★ mail : fermé à GT',                               'gtClaim','get','mail/x',null,false],
  ['E08','E','ephy lisible par tout compte',                      'ouvrierA','get','ephy/vigne',null,true],
  ['E09','E','★ ephy : anonyme refusé',                           null,'get','ephy/vigne',null,false],
  ['E10','E','★ ephy : aucune écriture client',                   'adminA','set','ephy/vigne',{ value: [] },false],
  ['E11','E','_mv_signatures : A lit sa preuve',                  'ouvrierA','get','_mv_signatures/a',null,true],
  ['E12','E','★ _mv_signatures : B ne lit pas celle de A',        'adminB','get','_mv_signatures/a',null,false],
  ['E13','E','★ _mv_signatures : A ne réécrit pas sa preuve',     'adminA','set','_mv_signatures/a',{ cgu: false },false],
];

/* F. CONSTATS — écarts connus entre une intention documentée et la règle réelle.
   Ils ne font PAS rougir (la règle est déployée ainsi, la corriger est une décision) ;
   ils s'affichent en jaune. Si un jour le comportement change, le harnais le dit :
   « constat fermé » → retirer la ligne. Un constat qu'on laisse vivre sans le dire
   devient une règle par défaut. */
const CONSTATS = [
  ['F01', 'fiche Inactive (off) lit encore _mv_signatures de son domaine — ACCES-1 (§186) ne couvre que les mavigne_*',
   'offA', 'get', '_mv_signatures/a', null, /* comportement ACTUEL */ true],
  ['F02', 'un membre non-ro écrit un journal d\'erreurs de 101 lignes — la règle 3 (métier courant) l\'accepte sans le plafond de 100 de la règle 5',
   'ouvrierA', 'set', 'mavigne_a/error_log', { value: liste(101) }, true],
];

/* ── Moteur ────────────────────────────────────────────────────────────── */
/* ⚠️ UN SEUL projectId pour toutes les passes. firebase.json porte `singleProjectMode` :
   l'émulateur refuse (ou signale) un second projet. Chaque passe RECHARGE donc les règles
   sur le même projet et repart d'une base vidée — les passes sont séquentielles. */
const PROJET = 'demo-mv-rules';
async function preparer(rules) {
  const env = await initializeTestEnvironment({ projectId: PROJET, firestore: { rules, host, port } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const [p, d] of Object.entries(SEED)) await db.doc(p).set(d);
  });
  return env;
}
function contexte(env, qui) {
  if (!qui) return env.unauthenticatedContext();
  const [uid, tok] = ID[qui];
  const t = { ...tok };
  if ('gts' in t) t.gts = qui === 'gtExp' ? Date.now() - H : Date.now() + H;
  return env.authenticatedContext(uid, t);
}
async function jouerUn(env, qui, op, chemin, data) {
  const db = contexte(env, qui).firestore();
  const ref = db.doc(chemin);
  try { op === 'get' ? await ref.get() : await ref.set(data); return true; }
  catch (e) {
    if (e && (e.code === 'permission-denied' || /PERMISSION_DENIED|permission/i.test(String(e.message)))) return false;
    throw e;   // ⚠️ une autre erreur (émulateur tombé, chemin invalide) n'est PAS un refus : on ne la compte pas comme tel
  }
}
/* Chaque cas d'écriture repart des données de départ : un set accepté plus haut
   (B11 change home_layout) ne doit pas modifier le point de départ de B12. */
async function jouer(env, silencieux) {
  const res = {};
  let section = '';
  const TITRES = { A: 'A. Isolement entre domaines', B: 'B. Rôles', C: 'C. Démo',
                   D: 'D. GUERETTECH — identité + session', E: 'E. Collections fermées ou publiques' };
  for (const [id, sec, lib, qui, op, chemin, data, attendu] of CAS) {
    if (!silencieux && sec !== section) { section = sec; console.log('\n' + c.b(TITRES[sec])); }
    if (op === 'set') await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      for (const [p, d] of Object.entries(SEED)) await db.doc(p).set(d);
    });
    const obtenu = await jouerUn(env, qui, op, chemin, data);
    const ok = obtenu === attendu;
    res[id] = ok;
    if (!silencieux) console.log('  ' + (ok ? c.g('✓') : c.r('✗')) + ' ' + c.dim(id) + ' ' + lib +
      (ok ? '' : c.r(`  (attendu ${attendu ? 'autorisé' : 'refusé'}, obtenu ${obtenu ? 'autorisé' : 'refusé'})`)));
  }
  return res;
}
async function constats(env) {
  console.log('\n' + c.b('F. Constats (non bloquants)'));
  for (const [id, lib, qui, op, chemin, data, actuel] of CONSTATS) {
    if (op === 'set') await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      for (const [p, d] of Object.entries(SEED)) await db.doc(p).set(d);
    });
    const obtenu = await jouerUn(env, qui, op, chemin, data);
    if (obtenu === actuel) console.log('  ' + c.y('⚠') + ' ' + c.dim(id) + ' ' + lib);
    else console.log('  ' + c.g('★') + ' ' + c.dim(id) + ' constat FERMÉ — la règle a changé : retirer cette ligne de CONSTATS');
  }
}

/* ── Contre-épreuves : [nom, ancre, remplacement, cas qui DOIT rougir] ── */
const MUT = [
  ['isolement : on retire la comparaison de collection',
   "\n             && col == 'mavigne_' + request.auth.token.get('tenant', '');", '\n             ;', ['A02', 'A03', 'A05']],
  ['ACCES-1 : on retire le refus de la fiche Inactive',
   "\n             && request.auth.token.get('off', false) != true       // ACCES-1 (§186) : fiche Inactive = plus d'accès", '', ['A07', 'A08']],
  ['canWrite : on oublie ro',
   "\n             && request.auth.token.get('ro', false) != true\n             && request.auth.token.get('demo', false) != true;",
   "\n             && request.auth.token.get('demo', false) != true;", ['B02', 'B17']],
  ['canWrite : on oublie la démo',
   "\n             && request.auth.token.get('ro', false) != true\n             && request.auth.token.get('demo', false) != true;",
   "\n             && request.auth.token.get('ro', false) != true;", ['C04']],
  ['isAdminOnlyDoc : membres sort de la liste',
   "return d in ['membres', 'saisons',", "return d in ['saisons',", ['B06']],
  ['paie : la lecture n\'exige plus l\'admin',
   "\n      allow read: if isMyTenant(collection) && docId != 'paie';\n", "\n      allow read: if isMyTenant(collection);\n", ['B09']],
  ['SEC-GT/2 : l\'identité suffit (gts oublié)',
   "\n             && request.auth.token.get('gts', 0) > request.time.toMillis();", ';', ['D01']],
  ['shapeOk : n\'importe quelle forme passe',
   "return request.resource.data.keys().hasOnly(['value']);", 'return true;', ['B14']],
  ['config : cp_mode rejoint les préférences non-admin',
   ".affectedKeys().hasOnly(['home_layout', 'gnr']);", ".affectedKeys().hasOnly(['home_layout', 'gnr', 'cp_mode']);", ['B12']],
  ['error_log : le plafond passe à 1 000',
   "&& request.resource.data.value.size() <= 100;", "&& request.resource.data.value.size() <= 1000;", ['B04']],
  ['_gt_otp : ouvert à GT',
   "Meme raisonnement que `leads` et `_mv_signatures`.\n      allow read, write: if false;",
   "Meme raisonnement que `leads` et `_mv_signatures`.\n      allow read, write: if isGtAdmin();", ['E01']],
  ['countOk : plus de plafond de liste',
   "request.resource.data.value.size() <= (d == 'parcelles' ? 3000 : 500)", 'true', ['B15']],
];

/* ── Principal ─────────────────────────────────────────────────────────── */
const CONTRE = process.argv.includes('--contre');
let code = 0;
try {
  if (!CONTRE) {
    console.log(c.b('MA VIGNE — Harnais RULES-1 · firestore.rules sur l\'émulateur') + c.dim(`  (${HOTE})`));
    const env = await preparer(RULES);
    const res = await jouer(env, false);
    await constats(env);
    await env.cleanup();
    const ko = Object.values(res).filter(v => !v).length;
    console.log('\n' + (ko ? c.r(`✗ ${ko} rouge(s) sur ${CAS.length}`) : c.g(`✓ ${CAS.length} vertes, 0 rouge`)));
    code = ko ? 1 : 0;
  } else {
    console.log(c.b('MA VIGNE — Harnais RULES-1 · contre-épreuves') + c.dim(`  (${HOTE})`));
    // Témoin : le même dispositif, règles intactes, doit sortir vert.
    const t = await preparer(RULES);
    const rt = await jouer(t, true); await t.cleanup();
    const kot = Object.entries(rt).filter(([, v]) => !v).map(([k]) => k);
    console.log('  ' + (kot.length ? c.r('✗ témoin ROUGE : ' + kot.join(', ')) : c.g('✓ témoin vert (règles intactes)')));
    let bad = kot.length ? 1 : 0;
    for (let i = 0; i < MUT.length; i++) {
      const [nom, ancre, rempl, doivent] = MUT[i];
      const n = RULES.split(ancre).length - 1;
      if (n !== 1) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — ancre trouvée ${n} fois (attendu 1) : la contre-épreuve ne prouve rien`); continue; }
      const env = await preparer(RULES.replace(ancre, rempl));
      const r = await jouer(env, true); await env.cleanup();
      const manquent = doivent.filter(id => r[id] !== false);
      if (manquent.length) { bad++; console.log('  ' + c.r('✗') + ` ${nom} — reste VERT sur ${manquent.join(', ')}`); }
      else console.log('  ' + c.g('✓') + ` ${nom} ${c.dim('→ rouge sur ' + doivent.join(', '))}`);
    }
    console.log('\n  ' + (MUT.length - (bad - (kot.length ? 1 : 0))) + '/' + MUT.length + ' contre-épreuves rougissent' +
      (kot.length ? c.r(' — mais le témoin est rouge') : ''));
    code = bad ? 1 : 0;
  }
} catch (e) {
  console.error(c.r('\n✗ Le harnais a planté (ce n\'est PAS un résultat) : ') + (e && e.stack || e));
  code = 2;
}
process.exit(code);
