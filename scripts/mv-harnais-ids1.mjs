// HARNAIS — IDS-1, lot 1 (§252) : chaque parcelle et chaque entrée du journal reçoivent un identifiant permanent (pid).
//   node scripts/mv-harnais-ids1.mjs           → doit être vert
//   node scripts/mv-harnais-ids1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI module src/ids.js, et les VRAIS fbSave, _mvSauverFusion et _saveParcellesMerged de firebase.js sur un
// faux serveur à transactions (montage de mv-harnais-taille2) : un identifiant posé ne doit jamais faire revenir une
// entrée supprimée ailleurs, ni écraser une modification faite ailleurs.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as REGLE from '../src/taille-doc.js';

const CONTRE = process.argv.includes('--contre');
const ICI = path.dirname(fileURLToPath(import.meta.url));
const FB0 = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const IDS0 = readFileSync(new URL('../src/ids.js', import.meta.url), 'utf8');
const APP0 = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
async function chargerIds(texte) {
  const f = path.join(ICI, '.mv-ids1-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.mjs');
  writeFileSync(f, texte);
  try { return await import(pathToFileURL(f).href); } finally { unlinkSync(f); }
}
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
  const W = { PARCELLES: sc.parcelles || [], applyFbData: (k, v) => { W[k.toUpperCase()] = v; }, logError: o => E.logs.push(o), _mvAvale: () => {}, showToast: m => E.toasts.push(String(m)) };
  const snapDe = v => ({ exists: () => v !== undefined, data: () => ({ value: clone(v) }), metadata: { fromCache: false, hasPendingWrites: false } });
  const S = {
    window: W, localStorage: _Stock(), navigator: { onLine: true }, console, Date: sc.Date || Date, JSON, Math, Promise,
    setTimeout: f => { setImmediate(f); return 0; }, clearTimeout: () => {}, TENANT_ID: 'dom-test', DEBUG: false, db: {},
    MV_LIMITE_DOC: regle.MV_LIMITE_DOC, mvOctetsDoc: regle.mvOctetsDoc, mvIdsJournal: sc.ids.mvIdsJournal, mvIdsParcelles: sc.ids.mvIdsParcelles, mvCarteParcelles: sc.ids.mvCarteParcelles, mvNomsParPid: sc.ids.mvNomsParPid, mvNomsJournal: sc.ids.mvNomsJournal,
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

const regle = REGLE;
const P0 = () => [{ nom: 'Les Grandes Vignes', taches: { Taille: 'En cours' } }, { nom: 'Clos du Moulin', taches: { Taille: 'Non démarré' } }];
const E = (id, parcelle, statut) => ({ id, date: '2026-10-0' + (id.length % 9 + 1), parcelle, tache: 'Taille', qui: 'Marc', statut: statut || 'Validé' });
async function suite(src, ids, app) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── Le module ──
  const a = ids.mvPidDe('Les Grandes Vignes');
  T('un identifiant déduit du nom : le même partout, toujours', a === ids.mvPidDe('Les Grandes Vignes') && /^p[0-9a-z]{5,11}$/.test(a));
  T('… insensible aux espaces autour et à la forme des accents (É composé ou non)', a === ids.mvPidDe('  Les Grandes Vignes ') && ids.mvPidDe('E\u0301cole') === ids.mvPidDe('\u00C9cole'));
  const vus = new Set(); for (let i = 0; i < 20000; i++) vus.add(ids.mvPidDe('Parcelle ' + i));
  T('… 20 000 noms différents → 20 000 identifiants différents', vus.size === 20000);
  let P = P0(); P[1].pid = 'pdeja'; P[1].nom = 'Clos du Moulin (renommé)';
  const n = ids.mvIdsParcelles(P);
  T('une parcelle sans identifiant en reçoit un ; celle qui en a un le GARDE (même renommée)', n === 1 && P[0].pid === a && P[1].pid === 'pdeja');
  const carte = ids.mvCarteParcelles(P);
  const J = [E('j1', 'Les Grandes Vignes'), E('j2', 'Clos du Moulin (renommé)'), E('j3', 'Parcelle disparue'), Object.assign(E('j4', 'Les Grandes Vignes'), { pid: 'pancien' })];
  ids.mvIdsJournal(J, carte);
  T('une entrée du journal reçoit l’identifiant de SA parcelle (celui qui est posé, pas celui du nom)', J[0].pid === a && J[1].pid === 'pdeja');
  T('… un nom inconnu n’en reçoit pas ; une entrée qui en a un le garde', J[2].pid === undefined && J[3].pid === 'pancien');
  T('… et repasser ne change rien (idempotent)', ids.mvIdsJournal(J, carte) === 0);
  // ── La vraie fusion du journal ──
  const Pm = P0(); ids.mvIdsParcelles(Pm);
  const serveur0 = [E('jx', 'Les Grandes Vignes'), E('jy', 'Clos du Moulin', 'En cours')];
  let M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: [serveur0[1]] } });   // ailleurs : jx SUPPRIMÉE
  M.S._fbBases.journal = clone(serveur0);                                                  // la base de cet appareil : jx et jy
  const local = clone(serveur0); ids.mvIdsJournal(local, ids.mvCarteParcelles(Pm));         // cet appareil n'a fait QUE poser les pid
  let r = await M.W.fbSave('journal', local);
  T('une entrée supprimée ailleurs NE REVIENT PAS parce qu’on lui a posé un identifiant', r.ok && M.serveur.journal.length === 1 && M.serveur.journal[0].id === 'jy');
  T('… et celle qui reste porte son identifiant', M.serveur.journal[0].pid === ids.mvPidDe('Clos du Moulin'));
  const modifie = clone(serveur0); modifie[1].statut = 'Validé';                             // ailleurs : jy validée
  M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: modifie } });
  M.S._fbBases.journal = clone(serveur0);
  r = await M.W.fbSave('journal', clone(local));
  const jy = M.serveur.journal.find(x => x.id === 'jy');
  T('une validation faite ailleurs est gardée, et l’identifiant aussi', jy && jy.statut === 'Validé' && jy.pid === ids.mvPidDe('Clos du Moulin'));
  const ajout = clone(serveur0).concat([E('jz', 'Les Grandes Vignes')]);                    // un téléphone pas à jour ajoute jz, sans pid
  M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: ajout } });
  M.S._fbBases.journal = clone(serveur0);
  r = await M.W.fbSave('journal', clone(local));
  const jz = M.serveur.journal.find(x => x.id === 'jz');
  T('une entrée écrite par un téléphone pas à jour reçoit son identifiant à la fusion', jz && jz.pid === a);
  // ── La vraie fusion des parcelles ──
  const sp = P0(); const spm = clone(sp); spm[0].taches.Taille = 'Validé';                   // ailleurs : la taille validée
  spm.push({ nom: 'Les Chaumes', taches: {} });                                              // … et un téléphone pas à jour ajoute une parcelle
  M = monter(src, regle, { ids, parcelles: Pm, serveur: { parcelles: spm } });
  M.S._baseParcelles = clone(sp);
  const lp = clone(sp); ids.mvIdsParcelles(lp);
  r = await M.W.fbSave('parcelles', lp);
  const g = (M.serveur.parcelles || []).find(x => x.nom === 'Les Grandes Vignes');
  T('parcelles : la validation faite ailleurs et l’identifiant posé ici sont gardés tous les deux', g && g.taches.Taille === 'Validé' && g.pid === a);
  const ch = (M.serveur.parcelles || []).find(x => x.nom === 'Les Chaumes');
  T('… et une parcelle ajoutée par un téléphone pas à jour reçoit son identifiant dès la fusion', ch && ch.pid === ids.mvPidDe('Les Chaumes'));
  // ── Le branchement ──
  const sd = app.slice(app.indexOf('function saveData(keyHint, toastMsg, toastCoul) {'), app.indexOf('const W = _mvValeursMemoire();'));
  T('saveData pose les identifiants avant chaque écriture des parcelles et du journal (aucun écrivain à reprendre)',
    /if\(keyHint==='parcelles'\|\|keyHint==='journal'\|\|!keyHint\)\{\s*try\{ var _idsP=window\.PARCELLES\|\|PARCELLES, _idsJ=window\.JOURNAL\|\|JOURNAL; mvIdsParcelles\(_idsP\); mvIdsJournal\(_idsJ, mvCarteParcelles\(_idsP\)\);/.test(sd));
  return out;
}
async function joue(src, idsTexte, app) { try { return await suite(src, await chargerIds(idsTexte), app); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(FB0, IDS0, APP0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nIDS-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['la fusion du journal ne normalise plus le serveur et la base', { fb: s => s.replace('mvIdsJournal(distant, _carte); mvIdsJournal(base, _carte); mvIdsJournal(local, _carte);', 'mvIdsJournal(local, _carte);') }],
  ['la fusion des parcelles ne normalise plus', { fb: s => s.replace('mvIdsParcelles(remote); mvIdsParcelles(base0); mvIdsParcelles(localValue);', '') }],
  ['l’identifiant dépend du hasard (deux téléphones, deux identifiants)', { ids: s => s.replace("return 'p' + a.toString(36)", "return 'p' + Math.random().toString(36).slice(2, 8) + a.toString(36)") }],
  ['une parcelle déjà identifiée perd son identifiant', { ids: s => s.replace("if (p && typeof p === 'object' && !p.pid && p.nom)", "if (p && typeof p === 'object' && p.nom)") }],
  ['une entrée prend l’identifiant de son NOM, pas celui de sa parcelle', { ids: s => s.replace("carte && carte[e.parcelle]) { e.pid = carte[e.parcelle];", "carte && carte[e.parcelle]) { e.pid = mvPidDe(e.parcelle);") }],
  ['un nom inconnu reçoit quand même un identifiant', { ids: s => s.replace("&& carte && carte[e.parcelle]) {", "&& carte) { carte[e.parcelle] = carte[e.parcelle] || mvPidDe(e.parcelle);") }],
  ['saveData ne pose plus les identifiants', { app: s => s.replace("mvIdsParcelles(_idsP); mvIdsJournal(_idsJ, mvCarteParcelles(_idsP));", "0;") }],
];
let rg = 0;
for (const [n, d] of DEF) {
  const src = d.fb ? d.fb(FB0) : FB0, it = d.ids ? d.ids(IDS0) : IDS0, app = d.app ? d.app(APP0) : APP0;
  if (src === FB0 && it === IDS0 && app === APP0) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = (await joue(src, it, app)).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
