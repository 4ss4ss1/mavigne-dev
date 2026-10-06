// HARNAIS — IDS-1, lot 2 (§253) : le nom porté par chaque entrée du journal SUIT l'identifiant de sa parcelle.
//   node scripts/mv-harnais-ids1b.mjs           → doit être vert
//   node scripts/mv-harnais-ids1b.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI module src/ids.js et la VRAIE fusion du journal (fbSave → _mvSauverFusion) sur un faux serveur à
// transactions (montage de mv-harnais-ids1) : après un renommage, chaque entrée — y compris celle d'un téléphone resté hors
// ligne — prend le nouveau nom, et les écrans, qui comparent des noms, retrouvent l'historique sans avoir été touchés.
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
  const f = path.join(ICI, '.mv-ids1b-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.mjs');
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
const E = (id, parcelle, pid, statut) => ({ id, date: '2026-10-0' + (id.length % 9 + 1), parcelle, pid, tache: 'Taille', qui: 'Marc', statut: statut || 'Validé' });
async function suite(src, ids, app) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  const pa = ids.mvPidDe('Les Grandes Vignes'), pc = ids.mvPidDe('Clos du Moulin');
  // ── Le module ──
  let P = [{ nom: 'Les Grandes Vignes', pid: pa }, { nom: 'Clos du Moulin', pid: pc }];
  let J = [E('j1', 'Les Grandes Vignes', pa), E('j2', 'Clos du Moulin', pc), E('j3', 'Vieille parcelle', undefined), E('j4', 'Ancienne', 'pinconnu')];
  T('aujourd’hui (aucun renommage) : rien ne change', ids.mvNomsJournal(J, ids.mvNomsParPid(P)) === 0 && J[0].parcelle === 'Les Grandes Vignes');
  P[0].nom = 'Grandes Vignes';                                                          // la parcelle est renommée : son identifiant reste
  ids.mvNomsJournal(J, ids.mvNomsParPid(P));
  T('après un renommage, chaque entrée de la parcelle prend son NOUVEAU nom', J[0].parcelle === 'Grandes Vignes' && J[1].parcelle === 'Clos du Moulin');
  T('… une entrée sans identifiant, ou d’une parcelle disparue, garde son nom', J[2].parcelle === 'Vieille parcelle' && J[3].parcelle === 'Ancienne');
  T('… et repasser ne change rien (idempotent)', ids.mvNomsJournal(J, ids.mvNomsParPid(P)) === 0);
  T('les écrans, qui comparent des noms, retrouvent tout l’historique de la parcelle renommée',
    J.filter(j => j.parcelle === P[0].nom).length === 1 && J.filter(j => j.parcelle === 'Les Grandes Vignes').length === 0);
  const D = [{ nom: 'A', pid: 'pX' }, { nom: 'B', pid: 'pX' }];
  T('un identifiant porté par deux parcelles n’impose jamais un nom (aucune entrée renommée au hasard)', !('pX' in ids.mvNomsParPid(D)));
  const C = [{ nom: 'Clos du Moulin', pid: pc }, { nom: 'Clos du Moulin bas', pid: pc }];   // une fiche recopiée avec son identifiant
  ids.mvIdsParcelles(C);
  T('une fiche recopiée avec l’identifiant d’une autre en reçoit un à elle ; l’originale garde le sien', C[0].pid === pc && C[1].pid === ids.mvPidDe('Clos du Moulin bas'));
  // ── La vraie fusion, après un renommage sur cet appareil ──
  const Pm = [{ nom: 'Grandes Vignes', pid: pa }, { nom: 'Clos du Moulin', pid: pc }];   // cet appareil connaît le nouveau nom
  const base = [E('jx', 'Les Grandes Vignes', pa), E('jy', 'Les Grandes Vignes', pa, 'En cours')];
  const local = JSON.parse(JSON.stringify(base)); ids.mvNomsJournal(local, ids.mvNomsParPid(Pm));
  let M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: [base[1]] } });   // ailleurs : jx SUPPRIMÉE
  M.S._fbBases.journal = JSON.parse(JSON.stringify(base));
  let r = await M.W.fbSave('journal', JSON.parse(JSON.stringify(local)));
  T('une entrée supprimée ailleurs ne revient pas parce que son nom a été remis à jour', r.ok && M.serveur.journal.length === 1 && M.serveur.journal[0].id === 'jy');
  T('… et celle qui reste porte le nouveau nom', M.serveur.journal[0].parcelle === 'Grandes Vignes');
  const modifie = JSON.parse(JSON.stringify(base)); modifie[1].statut = 'Validé';           // ailleurs : jy validée (sous l'ancien nom)
  M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: modifie } });
  M.S._fbBases.journal = JSON.parse(JSON.stringify(base));
  await M.W.fbSave('journal', JSON.parse(JSON.stringify(local)));
  const jy = M.serveur.journal.find(x => x.id === 'jy');
  T('une validation faite ailleurs est gardée, sous le nouveau nom', jy && jy.statut === 'Validé' && jy.parcelle === 'Grandes Vignes');
  const horsLigne = JSON.parse(JSON.stringify(base)).concat([E('jz', 'Les Grandes Vignes', pa)]);   // un téléphone resté hors ligne écrit sous l'ANCIEN nom
  M = monter(src, regle, { ids, parcelles: Pm, serveur: { journal: horsLigne } });
  M.S._fbBases.journal = JSON.parse(JSON.stringify(base));
  await M.W.fbSave('journal', JSON.parse(JSON.stringify(local)));
  const jz = M.serveur.journal.find(x => x.id === 'jz');
  T('une entrée écrite plus tard par un téléphone resté hors ligne prend le nouveau nom à la fusion', jz && jz.parcelle === 'Grandes Vignes');
  // ── Les branchements ──
  const af = app.slice(app.indexOf('function applyFbData(key, value) {'), app.indexOf('var _tracRelevant = {sessions:1'));
  T('à chaque réception du journal ou des parcelles, les noms suivent (applyFbData)', /if\(key==='journal'\|\|key==='parcelles'\)\{ try\{ mvNomsJournal\(window\.JOURNAL\|\|JOURNAL, mvNomsParPid\(window\.PARCELLES\|\|PARCELLES\)\);/.test(af));
  T('… au chargement de la copie du téléphone (loadData)', /mvNomsJournal\(JOURNAL, mvNomsParPid\(PARCELLES\)\);/.test(app));
  T('… et avant chaque écriture (saveData)', /mvNomsJournal\(_idsJ, mvNomsParPid\(_idsP\)\);/.test(app));
  return out;
}
async function joue(src, idsTexte, app) { try { return await suite(src, await chargerIds(idsTexte), app); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(FB0, IDS0, APP0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nIDS-1 lot 2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['la fusion ne fait plus suivre les noms des trois côtés', { fb: s => s.replace('mvNomsJournal(distant, _noms); mvNomsJournal(base, _noms); mvNomsJournal(local, _noms);', 'mvNomsJournal(local, _noms);') }],
  ['un identifiant partagé impose quand même un nom', { ids: s => s.replace('Object.keys(vu).forEach(function (k) { if (vu[k] > 1) delete c[k]; });', '') }],
  ['une entrée sans identifiant est renommée quand même', { ids: s => s.replace("if (e && typeof e === 'object' && e.pid && nomsParPid && nomsParPid[e.pid] && e.parcelle !== nomsParPid[e.pid])", "if (e && typeof e === 'object' && nomsParPid && (nomsParPid[e.pid] || Object.values(nomsParPid)[0]) && e.parcelle !== (nomsParPid[e.pid] || Object.values(nomsParPid)[0]))") }],
  ['une fiche recopiée garde l’identifiant de l’autre', { ids: s => s.replace("if (neuf && neuf !== pid && !par[neuf]) { p.pid = neuf; par[neuf] = [p]; n++; }", '') }],
  ['la réception ne fait plus suivre les noms', { app: s => s.replace("if(key==='journal'||key==='parcelles'){ try{ mvNomsJournal(window.JOURNAL||JOURNAL, mvNomsParPid(window.PARCELLES||PARCELLES)); }", "if(false){ try{ }") }],
  ['le chargement ne fait plus suivre les noms', { app: s => s.replace("try{ mvNomsJournal(JOURNAL, mvNomsParPid(PARCELLES)); }catch(e){ if(window._mvAvale) window._mvAvale(e,'app.js/loadData#noms'); }", '') }],
  ['l’écriture ne fait plus suivre les noms', { app: s => s.replace(' mvNomsJournal(_idsJ, mvNomsParPid(_idsP));', '') }],
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
