// HARNAIS — TAILLE-2 (§246) : un document qui grossit prévient AVANT d'être refusé, et un refus ne coince plus la file.
//   node scripts/mv-harnais-taille2.mjs           → doit être vert
//   node scripts/mv-harnais-taille2.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE règle (src/taille-doc.js) et les VRAIS fbSave, _mvSauverFusion, _saveParcellesMerged, _flushQueue de
// firebase.js sur un faux serveur (transactions comprises) — même montage que mv-harnais-fusion-docs.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as REGLE from '../src/taille-doc.js';

const CONTRE = process.argv.includes('--contre');
const FB0 = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const SCRIPT0 = readFileSync(new URL('./mv-taille-docs.mjs', import.meta.url), 'utf8');
const REGLE0 = readFileSync(new URL('../src/taille-doc.js', import.meta.url), 'utf8');

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
function blocVar(src, nom) {
  const i = src.search(new RegExp('^var ' + nom + '\\s*=', 'm')); if (i < 0) throw new Error('VAR ABSENTE : ' + nom);
  const fin = src.indexOf(';\n', i), k = src.indexOf('{', i);
  if (k < 0 || k > fin) return src.slice(i, fin + 1);
  let d = 0; for (let j = k; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
const VARS = ['_MV_FUSION_EXCLUES', '_fbBases', '_offlineBases', '_MV_FILE_BASE_CLE', '_MV_GUARD_FLOORS', '_mvFileMemSeule', '_mvFileAlerte',
  '_mvPersistDemande', '_MV_TAILLE_ALERTE', '_mvTropDit'];
const FNS = ['_mvDeepEqual', '_mvIsObj', '_mvMerge3', '_mvMergeParcelles', '_mvEgal', '_mvCanon', '_mvFusion', '_mvFusionObjet', '_mvIdentite',
  '_mvClesListes', '_mvFusionListe', '_mvBaseNoter', '_mvBaseDe', '_mvBaseMem', '_mvSauverFusion', '_mvApresFusion', '_mvParcellesApres',
  '_entryHasProg', '_tachesBlockHasProg', '_mvParcProgCount', '_mvIntrantsCount', '_mvPaieCount', '_mvDocSize', '_mvBlockDestructive',
  '_saveParcellesMerged', '_fsNoNestedArrays', '_fbClone', 'applyFbData', '_mvBaseFile', '_mvBasesFileEcrire', '_mvFileDisqueKo',
  '_mvDemanderPersistance', '_queueSave', '_loadQueue', '_flushQueue', '_retryAsync',
  '_mvOctets', '_mvTailleControle', '_mvTailleAlerte', '_mvErreurTaille', '_mvTropGros'];
const bloc = src => VARS.map(n => blocVar(src, n)).join('\n') + '\n' + FNS.map(n => fonction(src, n)).join('\n') + '\n' + affectation(src, 'fbSave');
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function _Stock() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
function monter(src, regle, sc) {
  sc = sc || {};
  const E = { badges: [], logs: [], toasts: [], coffre: [], ecritures: 0 }, serveur = sc.serveur || {};
  const W = { applyFbData: (k, v) => { W[k.toUpperCase()] = v; }, logError: o => E.logs.push(o), _mvAvale: () => {}, showToast: m => E.toasts.push(String(m)) };
  const snapDe = v => ({ exists: () => v !== undefined, data: () => ({ value: clone(v) }), metadata: { fromCache: false, hasPendingWrites: false } });
  const S = {
    window: W, localStorage: _Stock(), navigator: { onLine: true }, console, Date: sc.Date || Date, JSON, Math, Promise,
    setTimeout: f => { setImmediate(f); return 0; }, clearTimeout: () => {}, TENANT_ID: 'dom-test', DEBUG: false, db: {},
    MV_LIMITE_DOC: regle.MV_LIMITE_DOC, mvOctetsDoc: regle.mvOctetsDoc,
    _offlineQueue: {}, _baseParcelles: null, _ignoreNext: {}, _ignoreBefore: {}, _mvDeniedRetried: {}, _onlineRetryTO: null,
    deepClone: clone, fbDocRef: k => ({ k }), getDoc: ref => Promise.resolve(snapDe(serveur[ref.k])),
    setDoc: (ref, d) => { if (sc.refusServeur) return Promise.reject(sc.refusServeur); E.ecritures++; serveur[ref.k] = clone(d.value); return Promise.resolve(); },
    runTransaction: async (db, fn) => {
      if (sc.refusServeur) throw sc.refusServeur;
      const ecr = [], tx = { get: async ref => snapDe(serveur[ref.k]), set: (ref, d) => { ecr.push([ref.k, clone(d.value)]); } };
      const r = await fn(tx); for (const [k, v] of ecr) { serveur[k] = v; E.ecritures++; } return r;
    },
    _isDenied: () => false, _mvTokenAlive: async () => true, _mvStashDenied: (k, v) => E.coffre.push(k), _mvKeyLbl: k => ({ journal: 'Journal', parcelles: 'Parcelles' }[k] || k),
    _showOfflineQueueBadge: () => {}, _mvSoonFlush: () => {}, showSyncBadge: m => E.badges.push(String(m)), _mvSaisieEnCours: () => false,
  };
  vm.createContext(S); vm.runInContext(bloc(src), S);
  return { S, W, E, serveur };
}
// Des entrées de journal aux champs réels (~160 octets chacune).
const J = n => Array.from({ length: n }, (_, i) => ({ id: 'j' + i, date: '2026-09-' + String(1 + i % 28).padStart(2, '0'), tache: 'Taille', parcelle: 'Les Grandes Vignes', qui: 'Victor', duree: 7.5, note: 'rang ' + i, statut: 'Validé' }));
const octetsJournal = (regle, v) => regle.mvOctetsDoc(['mavigne_dom-test', 'journal'], { value: v });
async function suite(src, regle, script, regleSrc) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── La règle ──
  T('règle Firestore : l’exemple de la documentation (44 / 71 / 147 octets)',
    regle.mvOctetsNom(['users', 'jeff', 'tasks', 'my_task_id']) === 44 && regle.mvOctetsDoc(['users', 'jeff', 'tasks', 'my_task_id'], { type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' }) === 147);
  let s = 7, alea = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648, utf8 = true;
  const pool = ['a', 'é', 'ç', '·', '€', '\u{1F347}', '\u{1F69C}', 'Z', ' ', '\uD800', '\uDFFF', 'ß', '中'];
  for (let i = 0; i < 400 && utf8; i++) { let t = ''; const L = Math.floor(alea() * 40); for (let j = 0; j < L; j++) t += pool[Math.floor(alea() * pool.length)]; utf8 = regle.mvOctetsTexte(t) === Buffer.byteLength(t, 'utf8'); }
  T('octets UTF-8 comptés sans tampon = ce que dit Node (400 textes : accents, emoji, moitiés de paire)', utf8);
  // Les volumes du test
  let n80 = 1; while (octetsJournal(regle, J(n80)) < 0.78 * regle.MV_LIMITE_DOC) n80 += 100;
  let n90 = n80; while (octetsJournal(regle, J(n90)) < 0.93 * regle.MV_LIMITE_DOC) n90 += 100;
  let nTrop = n90; while (octetsJournal(regle, J(nTrop)) <= regle.MV_LIMITE_DOC) nTrop += 200;
  // ── Sous le seuil ──
  let M = monter(src, regle); let r = await M.W.fbSave('journal', J(200));
  T('petit document : écrit, aucune alerte', r.ok && M.E.ecritures === 1 && !M.E.logs.some(l => l.cat === 'taille'));
  M = monter(src, regle); r = await M.W.fbSave('journal', J(n80));
  T('vers 800 Ko (≈ 78 %, le domaine de référence aujourd’hui) : écrit, AUCUNE alerte (seuil à 90 %, décision de Nico)',
    r.ok && M.E.ecritures === 1 && !M.E.logs.some(l => l.cat === 'taille') && octetsJournal(regle, J(n80)) < 0.9 * regle.MV_LIMITE_DOC);
  // ── Entre 90 % et la limite ──
  M = monter(src, regle); r = await M.W.fbSave('journal', J(n90));
  const al = M.E.logs.filter(l => l.cat === 'taille');
  T('au-delà de 90 % : écrit quand même', r.ok && M.E.ecritures === 1);
  T('… une alerte remonte à GUERETTECH, en avertissement, SANS rien afficher au client', al.length === 1 && al[0].level === 'warning' && al[0].silencieux === true && /% de la limite/.test(al[0].msg) && M.E.toasts.length === 0);
  await M.W.fbSave('journal', J(n90 + 1));
  T('… une seule fois par jour, par document et par téléphone', M.E.logs.filter(l => l.cat === 'taille').length === 1);
  const vu = JSON.parse(M.S.localStorage.getItem('mavigne_taille_vu')); vu['dom-test|journal'] = '2000-01-01'; M.S.localStorage.setItem('mavigne_taille_vu', JSON.stringify(vu));
  await M.W.fbSave('journal', J(n90 + 2));
  T('… et de nouveau le lendemain', M.E.logs.filter(l => l.cat === 'taille').length === 2);
  // ── Au-delà de la limite ──
  M = monter(src, regle); r = await M.W.fbSave('journal', J(nTrop));
  T('au-delà de la limite : RIEN n’est envoyé', r.ok === false && r.trop === true && M.E.ecritures === 0 && M.serveur.journal === undefined);
  T('… rien ne reste en file (plus de renvoi sans fin)', Object.keys(M.S._offlineQueue).length === 0);
  T('… la saisie va au coffre des saisies non enregistrées', M.E.coffre.indexOf('journal') >= 0);
  T('… le voyant et l’écran disent la vraie raison, et où est la saisie', /taille maximale atteinte/.test(M.E.badges.join('|')) && M.E.toasts.length === 1 && /Saisies non enregistr/.test(M.E.toasts[0]) && /GUERETTECH/.test(M.E.toasts[0]));
  T('… une alerte remonte à GUERETTECH (erreur, silencieuse)', M.E.logs.some(l => l.cat === 'taille' && l.level === 'error' && l.silencieux === true));
  await M.W.fbSave('journal', J(nTrop + 1));
  T('… le message n’est montré qu’une fois par séance', M.E.toasts.length === 1);
  // ── Trop gros seulement APRÈS la fusion (ce que le serveur porte s'ajoute) ──
  M = monter(src, regle, { serveur: { journal: J(nTrop).map(e => Object.assign({}, e, { id: 'srv' + e.id })) } });
  r = await M.W.fbSave('journal', J(300));
  T('local léger, mais fusionné avec le serveur il dépasse : rien n’est envoyé', r.trop === true && M.E.ecritures === 0);
  // ── Parcelles, et un document écrit sans fusion ──
  const grosses = Array.from({ length: 300 }, (_, i) => ({ nom: 'P' + i, taches: { Taille: 'Validé' }, note: 'x'.repeat(4000) }));
  M = monter(src, regle); r = await M.W.fbSave('parcelles', grosses);
  T('parcelles au-delà de la limite : rien n’est envoyé, la saisie va au coffre', r.trop === true && M.E.ecritures === 0 && M.E.coffre.indexOf('parcelles') >= 0);
  M = monter(src, regle); r = await M.W.fbSave('kml_polygons', [{ name: 'gros', pts: 'y'.repeat(1100000) }]);
  T('KML (écrit sans fusion) au-delà de la limite : rien n’est envoyé', r.trop === true && M.E.ecritures === 0);
  // ── La file ──
  M = monter(src, regle); M.S._offlineQueue.journal = J(nTrop); M.S._offlineBases.journal = null;
  await M.S._flushQueue();
  T('file : un document trop gros en file en sort, au coffre, sans rien envoyer', !M.S._offlineQueue.journal && M.E.coffre.indexOf('journal') >= 0 && M.E.ecritures === 0);
  T('… et le voyant ne dit pas « synchronisé »', !/synchronisée/.test(M.E.badges[M.E.badges.length - 1]) && /taille maximale/.test(M.E.badges[M.E.badges.length - 1]));
  // ── Le filet : le refus de taille du serveur lui-même ──
  const refus = { code: 'invalid-argument', message: "Document 'x' cannot be written because its size (1,100,000 bytes) exceeds the maximum allowed size of 1,048,576 bytes." };
  M = monter(src, regle, { refusServeur: refus }); r = await M.W.fbSave('journal', J(50));
  T('refus de taille du serveur : au coffre, jamais en file', r.trop === true && Object.keys(M.S._offlineQueue).length === 0 && M.E.coffre.indexOf('journal') >= 0);
  M = monter(src, regle, { refusServeur: refus }); M.S._offlineQueue.journal = J(50); M.S._offlineBases.journal = null; await M.S._flushQueue();
  T('… pareil quand c’est la file qui envoie', !M.S._offlineQueue.journal && M.E.coffre.indexOf('journal') >= 0);
  T('… et sans les 7 s de nouveaux essais (un refus de taille ne se réessaie pas)', /_isDenied\(e\) \|\| _mvErreurTaille\(e\)\) throw e;/.test(src));
  M = monter(src, regle, { refusServeur: { code: 'unavailable', message: 'réseau' } }); r = await M.W.fbSave('journal', J(50));
  T('une panne passagère, elle, part toujours en file (inchangé)', r.queued === true && M.S._offlineQueue.journal && M.E.coffre.length === 0);
  // ── Une seule règle ──
  T('le script npm run taille joue la MÊME règle (importée de src/taille-doc.js, aucune copie)',
    /from '\.\.\/src\/taille-doc\.js'/.test(script) && !/function tailleValeur\s*\(/.test(script) && /from '\.\/taille-doc\.js'/.test(src) && /export function mvOctetsDoc/.test(regleSrc));
  return out;
}
async function joue(src, regle, script, regleSrc) { try { return await suite(src, regle, script, regleSrc); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(FB0, REGLE, SCRIPT0, REGLE0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nTAILLE-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const regleFausse = Object.assign({}, REGLE, { mvOctetsTexte: t => Buffer.byteLength(String(t), 'utf8') + (/[\u{10000}-\u{10FFFF}]/u.test(String(t)) ? 2 : 0) });
const DEF = [
  ['la limite n’est plus vérifiée avant la fusion', { fb: s => s.replace('if (_oct > MV_LIMITE_DOC) return { trop: true, octets: _oct };', '') }],
  ['l’alerte des 90 % s’affiche au client', { fb: s => s.replace("logError({ level:'warning', cat:'taille', silencieux:true,", "logError({ level:'warning', cat:'taille',") }],
  ['le seuil redescend à 70 % (l’alerte sonnerait tous les jours à 800 Ko)', { fb: s => s.replace('var _MV_TAILLE_ALERTE = 0.90;', 'var _MV_TAILLE_ALERTE = 0.70;') }],
  ['l’alerte des 90 % part à chaque envoi', { fb: s => s.replace('if (vu[k] === jour) return;', '') }],
  ['un document trop gros repart en file', { fb: s => s.replace('if (_fRes && _fRes.trop) return _mvTropGros(key, value, _fRes.octets);', 'if (_fRes && _fRes.trop) { _queueSave(key, value, _mvBaseMem(key)); return { ok:false, queued:true }; }') }],
  ['la saisie trop grosse n’est plus mise au coffre', { fb: s => s.replace('function _mvTropGros(key, value, o) {\n  _mvStashDenied(key, value);', 'function _mvTropGros(key, value, o) {') }],
  ['la file trop grosse annonce « synchronisé »', { fb: s => s.replace('  if (_tropN) {\n', '  if (false) {\n') }],
  ['le refus de taille du serveur n’est plus reconnu', { fb: s => s.replace("return !!(e && e.code === 'invalid-argument' &&", "return !!(false && e.code === 'invalid-argument' &&") }],
  ['un refus de taille est réessayé (7 s)', { fb: s => s.replace('if(i === retries || _isDenied(e) || _mvErreurTaille(e)) throw e;', 'if(i === retries || _isDenied(e)) throw e;') }],
  ['les parcelles ne sont plus mesurées', { fb: s => s.replace("if (_octP > MV_LIMITE_DOC) return { __mvTrop: true, octets: _octP };", '') }],
  ['le script garde sa propre règle', { script: s => s.replace("import { MV_LIMITE_DOC as LIMITE", "function tailleValeur(v) { return 0; }\nimport { MV_LIMITE_DOC as LIMITE") }],
  ['l’octet UTF-8 est mal compté pour les emoji', { regle: true }],
];
let rg = 0;
for (const [n, d] of DEF) {
  const src = d.fb ? d.fb(FB0) : FB0, script = d.script ? d.script(SCRIPT0) : SCRIPT0, regle = d.regle ? regleFausse : REGLE;
  if (src === FB0 && script === SCRIPT0 && regle === REGLE) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = (await joue(src, regle, script, REGLE0)).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
