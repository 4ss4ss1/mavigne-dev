// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS FUSION-1 — UNE ÉCRITURE N'EFFACE PLUS CE QU'UN AUTRE APPAREIL A SAISI (§146)
// ═══════════════════════════════════════════════════════════════════════════
//  Chaque document est réécrit EN ENTIER. Avant FUSION-1, seules les parcelles
//  étaient fusionnées : un téléphone à la copie en retard (Cave sans écoute, flux
//  mort, file hors ligne) effaçait ce que l'ordinateur avait ajouté entre-temps.
//
//  Sur les VRAIES fonctions extraites de src/firebase.js : la fusion à trois
//  voies, la transaction, fbSave, la file hors ligne et son envoi, la fusion des
//  parcelles. Bouchons : le serveur (une table en mémoire), la transaction, la
//  mémoire de l'application (window.JOURNAL, window.CAVE_VENDANGE…), le DOM.
//
//  CE QUE CE HARNAIS PROUVE
//   A. la fusion : un seul côté a bougé → ce côté ; ajouts des deux côtés gardés,
//      à leur place (en tête ou en queue) ; supprimé d'un côté et intact de l'autre
//      → supprimé ; supprimé d'un côté et MODIFIÉ de l'autre → gardé ; deux champs
//      d'une même ligne → fusionnés ; un même champ → cet appareil ; listes sans
//      identifiant (par contenu), valeurs simples (feuille), sans base (union) ;
//      et 400 tirages au hasard où rien ne se perd ;
//   B. l'écriture : la saisie de l'ordinateur reste, la mémoire la reçoit, ce qui
//      est tapé PENDANT l'écriture survit, rien ne bouge sous un champ actif, la
//      garde anti-perte mord sur le résultat ;
//   C. la file : sa base est celle de la première mise en file ; l'envoi fusionne
//      avec elle (pas avec la relecture de la reconnexion) ; sans base, l'union ;
//      une vieille valeur en file ne défait plus une écriture plus récente ;
//   D. les parcelles : la tâche validée ailleurs n'est plus reprise à la
//      deuxième écriture (le défaut dormant), ni par l'envoi de la file ;
//   E. la base ne prend jamais un instantané qui porte des écritures en attente.
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE, l'essai VRAI sur le code
//    sain — sinon ROUGE, jamais « détecté ».
//
//  Usage :  node scripts/mv-harnais-fusion-docs.mjs
//           node scripts/mv-harnais-fusion-docs.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const FB0 = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');

/* ══ EXTRACTION ══ */
function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE de src/firebase.js : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function blocVar(src, nom) {
  const i = src.search(new RegExp('^var ' + nom + '\\s*=', 'm'));
  if (i < 0) throw new Error('VAR ABSENTE de src/firebase.js : ' + nom);
  const fin = src.indexOf(';\n', i);
  const k = src.indexOf('{', i);
  if (k < 0 || k > fin) return src.slice(i, fin + 1);          // une ligne
  let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function affectation(src, nom) {
  const i = src.indexOf('window.' + nom + ' = ');
  if (i < 0) throw new Error('AFFECTATION ABSENTE : window.' + nom);
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1);
  }
  throw new Error('accolade non fermée : window.' + nom);
}
const VARS = ['_MV_FUSION_EXCLUES', '_fbBases', '_offlineBases', '_MV_FILE_BASE_CLE', '_MV_GUARD_FLOORS'];
const FNS = ['_mvDeepEqual', '_mvIsObj', '_mvMerge3', '_mvMergeParcelles', '_mvEgal', '_mvCanon', '_mvFusion',
  '_mvFusionObjet', '_mvIdentite', '_mvClesListes', '_mvFusionListe', '_mvBaseNoter', '_mvBaseDe', '_mvBaseMem',
  '_mvSauverFusion', '_mvApresFusion', '_mvParcellesApres', '_entryHasProg', '_tachesBlockHasProg', '_mvParcProgCount',
  '_mvIntrantsCount', '_mvPaieCount', '_mvDocSize', '_mvBlockDestructive', '_saveParcellesMerged', '_fsNoNestedArrays',
  '_fbClone', 'applyFbData', '_mvBaseFile', '_mvBasesFileEcrire', '_queueSave', '_loadQueue', '_flushQueue', '_retryAsync'];
const bloc = src => VARS.map(n => blocVar(src, n)).join('\n') + '\n' + FNS.map(n => fonction(src, n)).join('\n')
  + '\n' + affectation(src, 'fbSave');

/* ══ BAC DE TEST ══ */
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function _Stock() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
function monter(src, sc) {
  sc = sc || {};
  const E = { appliques: [], badges: [], logs: [], ecritures: 0 };
  const serveur = sc.serveur || {};
  const W = {
    applyFbData: (k, v) => { W[k.toUpperCase()] = v; E.appliques.push(k); },
    logError: o => E.logs.push(o), _mvAvale: () => {}, showToast: () => {},
  };
  const snapDe = v => ({ exists: () => v !== undefined, data: () => ({ value: clone(v) }), metadata: { fromCache: false, hasPendingWrites: false } });
  const S = {
    window: W, localStorage: _Stock(), navigator: { onLine: sc.horsLigne ? false : true }, console, Date, JSON, Math, Promise,
    setTimeout: (f) => { E.minuteurs = (E.minuteurs || 0) + 1; return 0; }, clearTimeout: () => {},
    TENANT_ID: 'dom-test', DEBUG: false, db: {},
    _offlineQueue: {}, _baseParcelles: sc.baseParcelles ? clone(sc.baseParcelles) : null,
    _ignoreNext: {}, _ignoreBefore: {}, _mvDeniedRetried: {}, _onlineRetryTO: null,
    deepClone: clone,
    fbDocRef: k => ({ k }),
    getDoc: ref => Promise.resolve(snapDe(serveur[ref.k])),
    setDoc: (ref, d) => { E.ecritures++; serveur[ref.k] = clone(d.value); return Promise.resolve(); },
    runTransaction: async (db, fn) => {
      const ecr = [];
      const tx = { get: async ref => { if (sc.pendantLecture) { const f = sc.pendantLecture; sc.pendantLecture = null; f(S); } return snapDe(serveur[ref.k]); },
                   set: (ref, d) => { ecr.push([ref.k, clone(d.value)]); } };
      const r = await fn(tx);
      for (const [k, v] of ecr) { serveur[k] = v; E.ecritures++; }
      return r;
    },
    _isDenied: () => false, _mvTokenAlive: async () => true, _mvStashDenied: () => {}, _mvKeyLbl: k => k,
    _showOfflineQueueBadge: () => {}, _mvSoonFlush: () => {},
    showSyncBadge: m => E.badges.push(String(m)),
    _mvSaisieEnCours: () => !!sc.tape,
  };
  vm.createContext(S);
  vm.runInContext(bloc(src), S);
  return { S, W, E, serveur };
}
let vert = 0; const rouges = [];
const pose = (ok, nom) => { if (ok) { vert++; console.log('  ✓ ' + nom); } else { rouges.push(nom); console.log('  ✗ ' + nom); } };
async function jouer(f, src) {
  try { return !!(await f(sc => monter(src, sc))); } catch (e) { return false; }
}
async function essai(nom, f) {
  let ok = false;
  try { ok = !!(await f(sc => monter(FB0, sc))); } catch (e) { console.log('    (plantage : ' + (e && e.message) + ')'); }
  pose(ok, nom);
}
const J = (id, t, extra) => Object.assign({ id: id, date: '2026-09-18', tache: t || 'Taille', qui: 'A' }, extra || {});
const ids = l => l.map(x => x.id).join(',');

/* ══ LES ESSAIS — chacun rend VRAI sur le code sain ══ */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const ESSAIS = {
  /* A — la fusion */
  unCote: async mk => {
    const F = mk().S._mvFusion, B = [J('a'), J('b')];
    const seulServeur = F(B, clone(B), [J('a'), J('b', 'Rognage')]);
    const seulIci = F(B, [J('a', 'Liage'), J('b')], clone(B));
    return seulServeur[1].tache === 'Rognage' && seulIci[0].tache === 'Liage';
  },
  ajoutsEnTete: async mk => {
    const F = mk().S._mvFusion, B = [J('c2'), J('c1')];
    const r = F(B, [J('l1'), J('c2'), J('c1')], [J('r2'), J('r1'), J('c2'), J('c1')]);
    return ids(r) === 'l1,r2,r1,c2,c1';
  },
  ajoutsEnQueue: async mk => {
    const F = mk().S._mvFusion, B = [J('c1'), J('c2')];
    const r = F(B, [J('c1'), J('c2'), J('l1')], [J('c1'), J('c2'), J('r1')]);
    return ids(r) === 'c1,c2,r1,l1';
  },
  supprimeIntact: async mk => {
    const F = mk().S._mvFusion, B = [J('a'), J('b'), J('c')];
    const r1 = F(B, [J('a'), J('c')], clone(B).concat([J('r')]));            // supprimé ici, intact là-bas
    const r2 = F(B, clone(B).concat([J('l')]), [J('a'), J('b')]);            // supprimé là-bas, intact ici
    return ids(r1) === 'a,c,r' && ids(r2) === 'a,b,l';
  },
  supprimeModifie: async mk => {
    const F = mk().S._mvFusion, B = [J('a'), J('b')];
    const r1 = F(B, [J('a')], [J('a'), J('b', 'Rognage')]);                    // supprimé ici, modifié là-bas
    const r2 = F(B, [J('a'), J('b', 'Liage')], [J('a')]);                      // modifié ici, supprimé là-bas
    return ids(r1) === 'a,b' && r1[1].tache === 'Rognage' && ids(r2) === 'a,b' && r2[1].tache === 'Liage';
  },
  deuxChamps: async mk => {
    const F = mk().S._mvFusion, B = [J('a', 'Taille', { note: '' })];
    const r = F(B, [J('a', 'Taille', { note: 'rang 12' })], [J('a', 'Taille', { qui: 'B' })]);
    return r.length === 1 && r[0].note === 'rang 12' && r[0].qui === 'B';
  },
  memeChamp: async mk => {
    const F = mk().S._mvFusion, B = [J('a', 'Taille')];
    const r = F(B, [J('a', 'Liage')], [J('a', 'Rognage')]);
    return r.length === 1 && r[0].tache === 'Liage';
  },
  imbrique: async mk => {
    const F = mk().S._mvFusion;
    const B = { config: { poids_caisse_kg: 25 }, recoltes: [{ id: 'r1', kg: 100 }],
      cuves_vinif: [{ id: 'A', mesures_fa: [{ id: 'm1', d: 1090 }] }, { id: 'B', mesures_fa: [] }] };
    const L = clone(B); L.cuves_vinif[0].mesures_fa.unshift({ id: 'm2', d: 1080 });            // la tournée, ici
    const R = clone(B); R.recoltes.push({ id: 'r2', kg: 250 }); R.cuves_vinif[1].mesures_fa.push({ id: 'm3', d: 1095 });
    const r = F(B, L, R);
    return ids(r.recoltes) === 'r1,r2' && ids(r.cuves_vinif[0].mesures_fa) === 'm2,m1' && ids(r.cuves_vinif[1].mesures_fa) === 'm3';
  },
  cartes: async mk => {
    const F = mk().S._mvFusion;
    const B = { Victor: { '2026-09-17': { h: 7 } } };
    const L = clone(B); L.Victor['2026-09-18'] = { h: 8 };
    const R = clone(B); R.Victor['2026-09-19'] = { h: 6 }; R.Shana = { '2026-09-18': { h: 7 } };
    const r = F(B, L, R);
    return Object.keys(r.Victor).length === 3 && r.Shana && r.Victor['2026-09-18'].h === 8;
  },
  parContenu: async mk => {
    const F = mk().S._mvFusion;
    const e = (t, q) => ({ date: '2026-09-18', tache: t, qui: q });
    const B = [e('Taille', 'A'), e('Liage', 'B'), e('Rognage', 'C')];
    const L = [e('Ebourgeonnage', 'A'), e('Taille', 'A'), e('Rognage', 'C')];              // + ajout, − Liage
    // Le serveur rend les clés dans SON ordre : la même ligne « Liage », supprimée ici, doit rester reconnue.
    const R = [{ qui: 'D', tache: 'Pioche', date: '2026-09-18' }, e('Taille', 'A'), { qui: 'B', date: '2026-09-18', tache: 'Liage' }, e('Rognage', 'C')];
    const r = F(B, L, R).map(x => x.tache).join(',');
    return r === 'Ebourgeonnage,Pioche,Taille,Rognage';
  },
  idsEnDouble: async mk => {
    const F = mk().S._mvFusion;
    const B = [J('x', 'Taille'), J('x', 'Liage')];                                         // deux lignes, même id
    const r = F(B, B.concat([J('y', 'Rognage')]), [J('z', 'Pioche')].concat(clone(B)));
    return r.length === 4 && r.filter(x => x.id === 'x').length === 2;
  },
  valeursSimples: async mk => {
    const F = mk().S._mvFusion;
    return ids([]) === '' && F(['a', 'b'], ['a', 'b', 'c'], ['a', 'b']).join() === 'a,b,c'
      && F(['a'], ['a', 'l'], ['a', 'r']).join() === 'a,l';
  },
  sansBase: async mk => {
    const F = mk().S._mvFusion;
    const r = F(undefined, [J('a'), J('b'), J('l')], [J('a'), J('r')]);
    const o = F(undefined, { x: 1, y: 2 }, { x: 1, z: 3 });
    return ids(r) === 'a,r,b,l' && o.y === 2 && o.z === 3;       // rien n'est retiré ; r se place après sa voisine
  },
  formes: async mk => {
    const S = mk().S;
    return S._mvEgal({ a: 1, b: undefined }, { a: 1 }) && S._mvEgal({ a: 1, b: 2 }, { b: 2, a: 1 })
      && S._mvCanon({ b: 1, a: { d: 2, c: undefined } }) === S._mvCanon({ a: { d: 2 }, b: 1 });
  },
  hasard: async mk => {
    const F = mk().S._mvFusion;
    const alea = rng(20260918);
    for (let t = 0; t < 400; t++) {
      const n = 3 + Math.floor(alea() * 12);
      const B = []; for (let i = 0; i < n; i++) B.push({ id: 'b' + i, v: 0, w: 0 });
      const L = clone(B), R = clone(B), attendu = {};
      B.forEach(x => { attendu[x.id] = { v: 0, w: 0 }; });
      const pris = new Set();
      for (let k = 0; k < n; k++) {                         // chaque ligne touchée au plus d'UN côté
        if (alea() < 0.45) continue;
        const cote = alea() < 0.5 ? L : R, id = 'b' + k, act = alea();
        pris.add(id);
        const x = cote.find(y => y.id === id);
        if (act < 0.4) { cote.splice(cote.indexOf(x), 1); delete attendu[id]; }
        else { if (cote === L) x.v = 1; else x.w = 1; attendu[id] = { v: x.v, w: x.w }; }
      }
      const nL = Math.floor(alea() * 3), nR = Math.floor(alea() * 3);
      for (let i = 0; i < nL; i++) { const p = Math.floor(alea() * (L.length + 1)); L.splice(p, 0, { id: 'l' + i, v: 1, w: 0 }); attendu['l' + i] = { v: 1, w: 0 }; }
      for (let i = 0; i < nR; i++) { const p = Math.floor(alea() * (R.length + 1)); R.splice(p, 0, { id: 'r' + i, v: 0, w: 1 }); attendu['r' + i] = { v: 0, w: 1 }; }
      const res = F(B, L, R), vu = {};
      for (const x of res) { if (vu[x.id]) return false; vu[x.id] = 1;
        const a = attendu[x.id]; if (!a || a.v !== x.v || a.w !== x.w) return false; }
      if (Object.keys(attendu).some(id => !vu[id])) return false;
    }
    return true;
  },

  /* B — l'écriture */
  ecritureGarde: async mk => {
    const B = { config: {}, recoltes: [{ id: 'r1', kg: 100 }], cuves_vinif: [{ id: 'A', mesures_fa: [] }] };
    const M = mk({ serveur: { cave_vendange: clone(B) } });
    M.S._fbBases.cave_vendange = clone(B);                                  // la copie du téléphone, relue à 7 h
    M.serveur.cave_vendange.recoltes.push({ id: 'r2', kg: 250 });           // l'ordinateur reçoit une vendange
    M.W.CAVE_VENDANGE = clone(B); M.W.CAVE_VENDANGE.cuves_vinif[0].mesures_fa.push({ id: 'm1', d: 1082 });
    const r = await M.W.fbSave('cave_vendange', M.W.CAVE_VENDANGE);
    const s = M.serveur.cave_vendange;
    return r.ok && ids(s.recoltes) === 'r1,r2' && s.cuves_vinif[0].mesures_fa.length === 1
      && ids(M.W.CAVE_VENDANGE.recoltes) === 'r1,r2' && ids(M.S._fbBases.cave_vendange.recoltes) === 'r1,r2'
      && M.E.badges.indexOf('Sauvegardé — fusionné avec un autre appareil') >= 0;
  },
  ecritureSeule: async mk => {
    const M = mk({ serveur: { journal: [J('a')] } });
    M.S._fbBases.journal = [J('a')];
    M.W.JOURNAL = [J('b'), J('a')];
    await M.W.fbSave('journal', M.W.JOURNAL);
    return ids(M.serveur.journal) === 'b,a' && M.E.appliques.length === 0 && M.E.badges.indexOf('Sauvegardé') >= 0;
  },
  pendantEcriture: async mk => {
    const M = mk({ serveur: { journal: [J('a')] } });
    M.S._fbBases.journal = [J('a')];
    M.serveur.journal.unshift(J('r'));                                       // l'ordinateur
    M.W.JOURNAL = [J('b'), J('a')];
    const val = M.W.JOURNAL;
    // pendant que la transaction lit le serveur, on saisit encore une ligne ici
    const orig = M.S.runTransaction;
    M.S.runTransaction = async (db, fn) => { M.W.JOURNAL.unshift(J('x')); return orig(db, fn); };
    await M.W.fbSave('journal', val);
    return ids(M.W.JOURNAL) === 'x,b,r,a' && ids(M.serveur.journal) === 'b,r,a';
  },
  champActif: async mk => {
    const M = mk({ tape: true, serveur: { journal: [J('a')] } });
    M.S._fbBases.journal = [J('a')];
    M.serveur.journal.unshift(J('r'));
    M.W.JOURNAL = [J('b'), J('a')];
    await M.W.fbSave('journal', M.W.JOURNAL);
    const intact = ids(M.W.JOURNAL) === 'b,a' && ids(M.S._fbBases.journal) === 'a';
    M.W.JOURNAL.unshift(J('c'));                                             // on continue, puis on réécrit
    await M.W.fbSave('journal', M.W.JOURNAL);
    return intact && ids(M.serveur.journal) === 'c,b,r,a';
  },
  gardeFusion: async mk => {
    const plein = []; for (let i = 0; i < 10; i++) plein.push(J('j' + i));
    const M = mk({ serveur: { journal: clone(plein) } });
    M.S._fbBases.journal = clone(plein);
    M.W.JOURNAL = [J('j0')];
    const r = await M.W.fbSave('journal', M.W.JOURNAL);
    return r.blocked === true && M.serveur.journal.length === 10;
  },
  exclue: async mk => {
    const M = mk({ serveur: { kml_polygons: [{ name: 'vieux', pts: [] }] } });
    M.S._fbBases.kml_polygons = [{ name: 'vieux', pts: [] }];
    await M.W.fbSave('kml_polygons', [{ name: 'neuf', pts: [] }]);
    return M.serveur.kml_polygons.length === 1 && M.serveur.kml_polygons[0].name === 'neuf';
  },

  /* C — la file */
  filePremiereBase: async mk => {
    const M = mk({ horsLigne: true });
    M.S._fbBases.journal = [J('a')];
    await M.W.fbSave('journal', [J('b'), J('a')]);
    M.S._fbBases.journal = [J('z'), J('a')];                                 // une relecture entre deux saisies
    await M.W.fbSave('journal', [J('c'), J('b'), J('a')]);
    const disque = JSON.parse(M.S.localStorage.getItem('mavigne_offline_queue_base') || '{}');
    return ids(disque.journal || []) === 'a';
  },
  fileEnvoi: async mk => {
    const M = mk({ horsLigne: true, serveur: { journal: [J('a')] } });
    M.S._fbBases.journal = [J('a')];
    M.W.JOURNAL = [J('b'), J('a')];
    await M.W.fbSave('journal', M.W.JOURNAL);                               // au fond de la cave
    M.serveur.journal.unshift(J('r'));                                       // l'ordinateur, pendant ce temps
    M.S.navigator.onLine = true;
    M.W.JOURNAL = clone(M.serveur.journal); M.S._fbBases.journal = clone(M.serveur.journal);   // relecture de la reconnexion
    await M.S._flushQueue();
    return ids(M.serveur.journal) === 'b,r,a' && ids(M.W.JOURNAL) === 'b,r,a'
      && Object.keys(M.S._offlineQueue).length === 0 && !M.S.localStorage.getItem('mavigne_offline_queue_base');
  },
  fileSansBase: async mk => {
    const M = mk({ serveur: { journal: [J('r'), J('a')] } });
    M.S._offlineQueue.journal = [J('b'), J('a'), J('vieux')];
    M.S._offlineBases.journal = null;                                        // démarrage hors ligne : pas de base
    M.S.localStorage.setItem('mavigne_offline_queue', JSON.stringify(M.S._offlineQueue));
    M.S.localStorage.setItem('mavigne_offline_queue_base', JSON.stringify(M.S._offlineBases));
    M.W.JOURNAL = clone(M.serveur.journal);
    await M.S._flushQueue();
    const s = ids(M.serveur.journal);
    return s.indexOf('r') >= 0 && s.indexOf('b') >= 0 && s.indexOf('a') >= 0;
  },
  fileVieille: async mk => {
    const M = mk({ serveur: { journal: [J('a')] } });
    M.S._fbBases.journal = [J('a')];
    M.S._offlineQueue.journal = [J('b'), J('a')];                           // partie en file plus tôt
    M.S._offlineBases.journal = [J('a')];
    M.S.localStorage.setItem('mavigne_offline_queue', JSON.stringify(M.S._offlineQueue));
    M.S.localStorage.setItem('mavigne_offline_queue_base', JSON.stringify(M.S._offlineBases));
    M.W.JOURNAL = [J('c'), J('b'), J('a')];
    await M.W.fbSave('journal', M.W.JOURNAL);                                // réussie, plus récente
    await M.S._flushQueue();                                                 // la file repasse
    return ids(M.serveur.journal) === 'c,b,a';
  },

  /* D — les parcelles */
  parcellesDormant: async mk => {
    const P0 = [{ nom: 'Clos', taches: { Taille: 'En cours', Liage: 'Non démarré', Rognage: 'Non démarré' } }];
    const M = mk({ serveur: { parcelles: clone(P0) }, baseParcelles: P0 });
    M.serveur.parcelles[0].taches.Taille = 'Validé';                         // validée sur l'ordinateur
    M.W.PARCELLES = clone(P0); M.W.PARCELLES[0].taches.Liage = 'Validé';
    await M.W.fbSave('parcelles', M.W.PARCELLES);
    M.W.PARCELLES[0].taches.Rognage = 'En cours';                            // deuxième saisie, ici
    await M.W.fbSave('parcelles', M.W.PARCELLES);
    const t = M.serveur.parcelles[0].taches;
    return t.Taille === 'Validé' && t.Liage === 'Validé' && t.Rognage === 'En cours';
  },
  parcellesFile: async mk => {
    const P0 = [{ nom: 'Clos', taches: { Taille: 'En cours', Liage: 'Non démarré' } }];
    const M = mk({ horsLigne: true, serveur: { parcelles: clone(P0) }, baseParcelles: P0 });
    M.W.PARCELLES = clone(P0); M.W.PARCELLES[0].taches.Liage = 'Validé';
    await M.W.fbSave('parcelles', M.W.PARCELLES);                            // en file, avec sa base
    M.serveur.parcelles[0].taches.Taille = 'Validé';                         // l'ordinateur
    M.S.navigator.onLine = true;
    M.W.PARCELLES = clone(M.serveur.parcelles); M.S._baseParcelles = clone(M.serveur.parcelles);   // relecture
    await M.S._flushQueue();
    const t = M.serveur.parcelles[0].taches;
    return t.Taille === 'Validé' && t.Liage === 'Validé' && M.W.PARCELLES[0].taches.Liage === 'Validé';
  },

  /* E — la base */
  baseEnAttente: async mk => {
    const S = mk().S;
    S._mvBaseNoter('journal', [J('a')], { hasPendingWrites: false });
    S._mvBaseNoter('journal', [J('b'), J('a')], { hasPendingWrites: true });
    S._mvBaseNoter('kml_polygons', [{ name: 'x' }], {});
    return ids(S._fbBases.journal) === 'a' && S._fbBases.kml_polygons === undefined;
  },
  vitesse: async mk => {
    const F = mk().S._mvFusion;
    const B = []; for (let i = 0; i < 5000; i++) B.push({ date: '2026-09-' + (i % 28 + 1), tache: 'T' + (i % 37), qui: 'Q' + (i % 9), n: i });
    const L = [{ date: '2026-09-18', tache: 'Neuve', qui: 'A', n: -1 }].concat(clone(B));
    const R = clone(B); R.push({ date: '2026-09-18', tache: 'Autre', qui: 'B', n: -2 });
    const t0 = Date.now(); const r = F(B, L, R); const ms = Date.now() - t0;
    const Bi = B.map((x, i) => Object.assign({ id: (i % 1000 === 7) ? 'double' : 'j' + i }, x));   // quelques identifiants en double
    const Li = [{ id: 'neuve', tache: 'Neuve' }].concat(clone(Bi)), Ri = clone(Bi).concat([{ id: 'autre', tache: 'Autre' }]);
    const t1 = Date.now(); const ri = F(Bi, Li, Ri); const msi = Date.now() - t1;
    console.log('    (5 000 lignes : ' + ms + ' ms par contenu, ' + msi + ' ms par identifiant, sur cette machine)');
    return r.length === 5002 && ri.length === 5002 && ms < 3000 && msi < 1500;
  },
};

if (!CONTRE) {
  console.log('\n── A · la fusion ──');
  await essai('un seul côté a bougé : ce côté', ESSAIS.unCote);
  await essai('★★★ ajouts des deux côtés, en tête (journal) : tous gardés, à leur place', ESSAIS.ajoutsEnTete);
  await essai('★ ajouts des deux côtés, en queue : tous gardés', ESSAIS.ajoutsEnQueue);
  await essai('★★ supprimé d’un côté, intact de l’autre : supprimé', ESSAIS.supprimeIntact);
  await essai('★★★ supprimé d’un côté, MODIFIÉ de l’autre : gardé (rien ne disparaît en silence)', ESSAIS.supprimeModifie);
  await essai('★★ deux champs d’une même ligne : fusionnés', ESSAIS.deuxChamps);
  await essai('un même champ des deux côtés : celui de cet appareil', ESSAIS.memeChamp);
  await essai('★★★ imbriqué (vendange : réception ici, tournée là-bas)', ESSAIS.imbrique);
  await essai('★ cartes (planning : jours et salariés)', ESSAIS.cartes);
  await essai('★★ lignes sans identifiant : par contenu, ordre des clés indifférent', ESSAIS.parContenu);
  await essai('★ identifiants en double : par contenu, rien ne fusionne deux lignes', ESSAIS.idsEnDouble);
  await essai('valeurs simples : une feuille (un seul côté → ce côté ; les deux → cet appareil)', ESSAIS.valeursSimples);
  await essai('★★ sans base (démarrage hors ligne) : l’union, rien n’est retiré', ESSAIS.sansBase);
  await essai('`undefined` et l’ordre des clés ne créent pas de faux conflit', ESSAIS.formes);
  await essai('★★★ 400 tirages au hasard : rien ne se perd, rien ne se double', ESSAIS.hasard);
  console.log('\n── B · l’écriture ──');
  await essai('★★★ la réception de l’ordinateur reste, la tournée du téléphone aussi, la mémoire suit', ESSAIS.ecritureGarde);
  await essai('seul cet appareil a bougé : écrit tel quel, mémoire intacte', ESSAIS.ecritureSeule);
  await essai('★★★ ce qui est saisi PENDANT l’écriture survit', ESSAIS.pendantEcriture);
  await essai('★★ champ actif : rien ne bouge sous les doigts, et l’écriture suivante refusionne juste', ESSAIS.champActif);
  await essai('★★ la garde anti-perte mord sur le résultat fusionné', ESSAIS.gardeFusion);
  await essai('KML : un import remplace (hors fusion, inchangé)', ESSAIS.exclue);
  console.log('\n── C · la file hors ligne ──');
  await essai('★★ la base gardée est celle de la PREMIÈRE mise en file', ESSAIS.filePremiereBase);
  await essai('★★★ l’envoi fusionne avec la base de la file : ce que l’ordinateur a saisi reste', ESSAIS.fileEnvoi);
  await essai('★★ sans base : l’union — rien de ce que le serveur porte n’est retiré', ESSAIS.fileSansBase);
  await essai('★★ une vieille valeur en file ne défait plus une écriture plus récente', ESSAIS.fileVieille);
  console.log('\n── D · les parcelles ──');
  await essai('★★★ la tâche validée ailleurs n’est plus reprise à l’écriture suivante (défaut dormant)', ESSAIS.parcellesDormant);
  await essai('★★ ni par l’envoi de la file', ESSAIS.parcellesFile);
  console.log('\n── E · la base ──');
  await essai('★★ jamais un instantané qui porte des écritures en attente ; jamais une clé hors fusion', ESSAIS.baseEnAttente);
  await essai('5 000 lignes par contenu : en temps raisonnable', ESSAIS.vitesse);
}

/* ══ CONTRE-ÉPREUVE ═══════════════════════════════════════════════════════ */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = async (titre, ancre, remplace, f) => {
    const n = FB0.split(ancre).length - 1;
    if (n !== 1) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
    if (!(await jouer(f, FB0))) { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → ESSAI FAUX SUR LE CODE SAIN'); return; }
    if (!(await jouer(f, FB0.replace(ancre, remplace)))) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };
  await mord('★★★ plus de fusion : le dernier qui écrit gagne', 
    'var fusion = (distant === undefined) ? local : _mvFusion(base, local, distant);', 'var fusion = local;', ESSAIS.ecritureGarde);
  await mord('★★ une suppression ailleurs n’est plus suivie', 
    'if (a(mL, k)) return !(a(mB, k) && _mvEgal(mL[k], mB[k]));', 'if (a(mL, k)) return true;', ESSAIS.supprimeIntact);
  await mord('★★★ une ligne modifiée ailleurs disparaît avec la suppression d’ici', 
    'if (a(mR, k)) return !(a(mB, k) && _mvEgal(mR[k], mB[k]));', 'if (a(mR, k)) return !a(mB, k);', ESSAIS.supprimeModifie);
  await mord('★ une ligne venue d’ailleurs part en queue au lieu de sa place', 
    '    var pos = -1;\n', '    var pos = ordre.length;\n', ESSAIS.ajoutsEnTete);
  await mord('★★ plus d’identifiant : deux versions d’une même ligne', 
    "  var champs = ['id', 'nom'];", '  var champs = [];', ESSAIS.deuxChamps);
  await mord('★★ l’ordre des clés redevient un conflit (contenu non canonique)', 
    "  return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort()", "  return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; })", ESSAIS.parContenu);
  await mord('★★★ la file garde la DERNIÈRE base au lieu de la première', 
    'if (!Object.prototype.hasOwnProperty.call(_offlineBases, key)) _offlineBases[key] = (base === undefined) ? null : base;',
    '_offlineBases[key] = (base === undefined) ? null : base;', ESSAIS.filePremiereBase);
  await mord('★★★ l’envoi fusionne avec la relecture de la reconnexion (efface l’ordinateur)', 
    'var _fq = await _mvSauverFusion(key, _offlineQueue[key], _mvBaseFile(key));', 'var _fq = await _mvSauverFusion(key, _offlineQueue[key], _mvBaseDe(key));', ESSAIS.fileEnvoi);
  await mord('★★ la mémoire se réécrit sous un champ actif', 
    "  if (_mvSaisieEnCours()) return 'differe';\n  var courant = window[key.toUpperCase()];", '  var courant = window[key.toUpperCase()];', ESSAIS.champActif);
  await mord('★★★ ce qui est saisi pendant l’écriture est écrasé par le résultat', 
    'var rebase = (courant === undefined) ? fusion : _mvFusion(baseMem, courant, fusion);', 'var rebase = fusion;', ESSAIS.pendantEcriture);
  await mord('★★★ parcelles : la base avance SANS la mémoire (le défaut dormant revient)', 
    "      if (_mvParcellesApres(_pRes, _pL0) !== 'rien') _msgOk = 'Sauvegardé — fusionné avec un autre appareil';",
    '      _baseParcelles = deepClone(_pRes);', ESSAIS.parcellesDormant);
  await mord('★★ la file des parcelles oublie sa base', 
    'var _pq = await _saveParcellesMerged(_offlineQueue[key], _mvBaseFile(key));', 'var _pq = await _saveParcellesMerged(_offlineQueue[key]);', ESSAIS.parcellesFile);
  await mord('★★ la base prend un instantané en attente d’écriture', 
    'if (_MV_FUSION_EXCLUES[key] || value === undefined || (md && md.hasPendingWrites)) return false;',
    'if (_MV_FUSION_EXCLUES[key] || value === undefined) return false;', ESSAIS.baseEnAttente);
  await mord('★★ la garde anti-perte ne voit plus le résultat fusionné', 
    'if (curN >= _MV_GUARD_FLOORS[key] && newN < curN * 0.5) return { bloque: true, curN: curN, newN: newN };', '', ESSAIS.gardeFusion);
  await mord('★ sans base, cet appareil l’emporte en bloc (au lieu de l’union)', 
    "  if (!champ) return L;\n  var cles", "  if (!champ || !B) return L;\n  var cles", ESSAIS.sansBase);
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
process.exit(0);
