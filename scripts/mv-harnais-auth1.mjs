// ════════════════════════════════════════════════════════════════════════════
// mv-harnais-auth1.mjs — AUTH-1 : une saisie ne doit JAMAIS etre jetee.
// ════════════════════════════════════════════════════════════════════════════
// Rejoue le VRAI corps de window.fbSave (extrait du fichier livre, pas reecrit)
// sous quatre etats de jeton, et exige a chaque fois que la saisie survive
// quelque part : en file, au coffre, ou ecrite.
//
// Chemin resolu par new URL(..., import.meta.url) — C26 / piege Windows (§55n).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CIBLE = process.argv[2]
  ? path.resolve(process.argv[2])
  : fileURLToPath(new URL('../src/firebase.js', import.meta.url));

const src = fs.readFileSync(CIBLE, 'utf8');

// ── Extraction en ORDRE DE FICHIER (str.index avant slicing) ────────────────
function bloc(debut, fin, depuis) {
  const i = src.indexOf(debut, depuis || 0);
  if (i === -1) throw new Error('ancre introuvable : ' + debut);
  const j = src.indexOf(fin, i);
  if (j === -1) throw new Error('fin introuvable pour : ' + debut);
  return { txt: src.slice(i, j + fin.length), fin: j };
}

const bIsDenied = bloc('function _isDenied(e) {', '}\n');
const bAlive    = bloc('async function _mvTokenAlive() {', '\n}\n', bIsDenied.fin);
const bStash    = bloc("var _MV_STASH_KEY = 'mavigne_denied_stash';", '\n}\n', bAlive.fin);
const bLbl      = bloc('var _MV_KEYLBL = {', '\nfunction _mvKeyLbl(k) { return _MV_KEYLBL[k] || k; }', bStash.fin);
const bSave     = bloc('window.fbSave = async function (key, value) {', '\n};\n', bLbl.fin);

// ── Bac de test ─────────────────────────────────────────────────────────────
function bac(scenario) {
  const etat = {
    queue: {},           // ce qui part en file
    coffre: {},          // ce qui part au coffre
    ecrit: {},           // ce qui atteint Firestore
    badges: [],
    logs: [],
    tentatives: 0,
  };

  const store = {};      // faux localStorage
  const sandbox = {
    console,
    setTimeout, clearTimeout, Promise, Date, JSON, Error, Object,
    navigator: { onLine: true },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    // ── etat d'auth pilote par le scenario ──
    auth: {
      currentUser: scenario.session
        ? { getIdToken: () => (scenario.refreshOk ? Promise.resolve('jeton') : Promise.reject(new Error('network'))) }
        : null,
    },
    // ── dependances stubbees ──
    TENANT_ID: 'marchand-grillot',
    _ignoreNext: {}, _ignoreBefore: {},
    _offlineQueue: etat.queue,
    _onlineRetryTO: null,
    deepClone: (v) => JSON.parse(JSON.stringify(v)),
    _fbClone: (k, v) => v,
    fbDocRef: (k) => ({ k }),
    applyFbData: () => {},
    getDoc: () => Promise.resolve({ exists: () => false }),
    _saveParcellesMerged: () => Promise.resolve([]),
    _mvBlockDestructive: () => Promise.resolve(false),
    _flushQueue: () => Promise.resolve(),
    _showOfflineQueueBadge: () => {},
    showSyncBadge: (m) => { etat.badges.push(String(m)); },
    _mvSoonFlush: () => {},
    _queueSave: (k, v) => { etat.queue[k] = v; },
    setDoc: () => {
      etat.tentatives++;
      const refuse = scenario.refusJusqua == null || etat.tentatives <= scenario.refusJusqua;
      if (refuse) { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; return Promise.reject(e); }
      etat.ecrit.ok = true;
      return Promise.resolve();
    },
    _retryAsync: async (fn) => fn(),   // le retry interne n'est pas l'objet du test
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.window.logError = (o) => { etat.logs.push(o); };

  vm.createContext(sandbox);
  vm.runInContext(
    [bIsDenied.txt, bAlive.txt, bStash.txt, bLbl.txt,
     'var _mvDeniedRetried = {};', bSave.txt].join('\n'),
    sandbox
  );
  // le coffre reel ecrit dans localStorage : on le relit a la fin
  return { etat, sandbox, store };
}

// ── Assertions ──────────────────────────────────────────────────────────────
let rouges = 0, verts = 0;
function verifie(nom, condition, detail) {
  if (condition) { verts++; console.log('  \u2713 ' + nom); }
  else { rouges++; console.log('  \u2717 ' + nom + (detail ? '  \u2014 ' + detail : '')); }
}
function coffreDe(store) {
  try { return JSON.parse(store['mavigne_denied_stash'] || '{}'); } catch { return {}; }
}

console.log('\n  AUTH-1 \u2014 une saisie n\'est jamais jetee\n  Cible : ' + CIBLE + '\n');

// A. Session perdue (jeton mort) + refus permanent -> DOIT partir en file.
{
  console.log('  A. session perdue, refus permanent');
  const { etat, sandbox, store } = bac({ session: false, refreshOk: false, refusJusqua: null });
  const r = await sandbox.window.fbSave('cave_vendange', { recoltes: [1, 2, 3] });
  verifie('mise en file', !!etat.queue['cave_vendange'], JSON.stringify(Object.keys(etat.queue)));
  verifie('retour queued', r && r.queued === true && r.tokenStale === true, JSON.stringify(r));
  verifie('rien au coffre', Object.keys(coffreDe(store)).length === 0);
  verifie('aucun badge de refus', !etat.badges.some((b) => b.includes('refus')), etat.badges.join(' | '));
}

// B. Jeton illisible (refresh reseau KO) + refus permanent -> file, pas coffre.
{
  console.log('\n  B. rafraichissement impossible, refus permanent');
  const { etat, sandbox, store } = bac({ session: true, refreshOk: false, refusJusqua: null });
  const r = await sandbox.window.fbSave('cave_vendange', { recoltes: [1] });
  verifie('mise en file', !!etat.queue['cave_vendange']);
  verifie('retour tokenStale', r && r.tokenStale === true, JSON.stringify(r));
  verifie('rien au coffre', Object.keys(coffreDe(store)).length === 0);
}

// C. Jeton vivant + refus qui disparait apres rafraichissement -> ECRIT.
{
  console.log('\n  C. jeton rafraichissable, refus seulement au 1er essai');
  const { etat, sandbox, store } = bac({ session: true, refreshOk: true, refusJusqua: 1 });
  const r = await sandbox.window.fbSave('cave_vendange', { recoltes: [1] });
  verifie('ecriture aboutie', etat.ecrit.ok === true, JSON.stringify(r));
  verifie('retour ok', r && r.ok === true, JSON.stringify(r));
  verifie('rien au coffre', Object.keys(coffreDe(store)).length === 0);
  verifie('rien en file', Object.keys(etat.queue).length === 0);
}

// D. Jeton vivant + refus REEL (role) -> coffre, badge francais, PAS de file.
{
  console.log('\n  D. jeton vivant, refus reel et persistant');
  const { etat, sandbox, store } = bac({ session: true, refreshOk: true, refusJusqua: null });
  const r = await sandbox.window.fbSave('cave_vendange', { recoltes: [7] });
  const c = coffreDe(store);
  verifie('saisie au coffre', !!c['cave_vendange'], JSON.stringify(Object.keys(c)));
  verifie('valeur integrale conservee', c['cave_vendange'] && JSON.stringify(c['cave_vendange'].value) === JSON.stringify({ recoltes: [7] }));
  verifie('PAS en file (poison pill)', Object.keys(etat.queue).length === 0);
  verifie('retour denied + stashed', r && r.denied === true && r.stashed === true, JSON.stringify(r));
  const b = etat.badges[etat.badges.length - 1] || '';
  verifie('badge en francais, sans nom de collection', b.includes('Vendanges') && !b.includes('cave_vendange'), b);
  // ⚠️ Cette assertion s'est inversee DEUX FOIS en un jour, et c'est le mecanisme qui
  //    marche : tant que le coffre n'avait pas de porte (§76h), on exigeait que le
  //    badge ne promette RIEN ; depuis STASH-1 (§77) la promesse est tenable, donc
  //    exigee. Ce qui est verrouille ici n'est pas un libelle, c'est l'accord entre
  //    ce que l'ecran promet et ce que l'application permet.
  verifie('le badge annonce la conservation (la porte existe : §77)', b.includes('conserv'), b);
  verifie('la mise de cote part aussi au journal, pas au silence',
    etat.logs.some((l) => l.level === 'warning' && /mise de c/.test(String(l.msg))),
    JSON.stringify(etat.logs.map((l) => l.level + ':' + l.msg)));
  verifie('deux tentatives, pas plus (garde de recursion)', etat.tentatives === 2, 'tentatives=' + etat.tentatives);
}

// ── E. ★ LA PROMESSE DU BADGE A UNE PORTE (§77) ─────────────────────────────
// Sans cette section, l'assertion « le badge annonce la conservation » se contente
// d'un mot. Ce qu'il faut verrouiller, c'est que le mot corresponde a quelque chose.
{
  console.log('\n  E. le coffre est ouvrable depuis l\'application');
  const fbTxt   = fs.readFileSync(CIBLE, 'utf8');
  const reglTxt = fs.readFileSync(
    CIBLE.replace(/firebase\.js$/, 'reglages.js'), 'utf8');

  verifie('cote donnees : lister, renvoyer, abandonner',
    /window\.mvStashList\s*=/.test(fbTxt) && /window\.mvStashResend\s*=/.test(fbTxt) && /window\.mvStashDrop\s*=/.test(fbTxt));
  verifie('le renvoi repasse par fbSave (regles + anti-perte + AUTH-1)',
    /mvStashResend[\s\S]{0,400}window\.fbSave\(/.test(fbTxt));
  verifie('⚠️ l\'entree n\'est retiree QUE si l\'ecriture a abouti',
    /mvStashResend[\s\S]{0,500}r\.ok\)\s*window\.mvStashDrop/.test(fbTxt));
  verifie('rien ne se renvoie tout seul (aucun appel automatique)',
    !/setTimeout[^;]{0,80}mvStashResend|setInterval[^;]{0,80}mvStashResend/.test(fbTxt));

  // ⚠️ Chercher `_reglStashRow();` dans TOUT le fichier ne prouve rien : la fonction
  //    s'appelle elle-meme depuis _reglStashFermer(). Le sabotage « jamais appelee au
  //    rendu » passait au vert. On regarde donc DANS le corps de renderReglages.
  const iRR = reglTxt.indexOf('function renderReglages(){');
  const finRR = reglTxt.indexOf('\nfunction ', iRR + 1);
  const corpsRR = iRR === -1 ? '' : reglTxt.slice(iRR, finRR === -1 ? reglTxt.length : finRR);
  verifie('cote ecran : la ligne existe...', /function _reglStashRow\(\)/.test(reglTxt));
  verifie('...et renderReglages() l\'appelle vraiment', /_reglStashRow\(\);/.test(corpsRR),
    'corps renderReglages = ' + corpsRR.length + ' car.');
  verifie('la ligne ne sort que pour un admin, et que si le coffre est plein',
    /if\(!hote\|\|!n\|\|!isAdmin\(\)\)/.test(reglTxt));
  verifie('⚠️ le renvoi passe par une confirmation qui NOMME l\'ecrasement',
    /_reglStashRenvoyer[\s\S]{0,700}openConfirmDel[\s\S]{0,300}perdues/.test(reglTxt));
}

console.log('\n  ' + verts + ' vert(s) \u00b7 ' + rouges + ' rouge(s)');
if (rouges) { console.log('  \u2717 AUTH-1 \u00c9CHOU\u00c9\n'); process.exit(1); }
console.log('  \u2713 AUTH-1 OK\n');
