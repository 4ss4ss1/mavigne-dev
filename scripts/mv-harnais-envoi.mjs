// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS ENVOI-1 — UNE SAISIE ENREGISTRÉE NE SE PERD PLUS, MÊME RELANCÉE EN ROUTE (§326)
// ═══════════════════════════════════════════════════════════════════════════
//  Vécu le 13/10/2026 (Tracteur, Android, appli 8.85) : réseau affiché, serveur muet. Les parcelles
//  faites au tracteur, marquées enregistrées, avaient disparu après « Relancer l'application ».
//  Le carnet de l'appareil : serveur injoignable ×2, démarrage lent, relance manuelle.
//
//  Sur les VRAIES fonctions extraites de src/firebase.js (fbSave et sa partie serveur, la file, son
//  vidage, la fusion, le coffre, applyFbData). Bouchons : le serveur (une table en mémoire), la
//  transaction (qui peut ATTENDRE sans fin, comme sur un réseau fantôme), l'horloge (avancée à la
//  main), le disque du téléphone (partagé entre deux « pages » : avant et après la relance).
//
//  CE QUE CE HARNAIS PROUVE
//   A. une écriture qui attend le serveur est sur le disque PENDANT l'attente ; la page relancée la
//      reprend en file, l'écran la montre, le vidage l'envoie ;
//   B. au-delà de la borne, fbSave rend « en file », et l'écriture restée en route n'écrit plus ;
//   C. la reprise FUSIONNE avec ce qui attendait déjà en file (rien n'en sort) ;
//   D. après relance, la mémoire = le serveur + la file : l'écran montre ce qui attend, la saisie
//      suivante ne le remplace plus ; parcelles comprises, et la base reste celle du serveur ;
//   E. le vidage ne retire que la valeur envoyée : une saisie arrivée PENDANT l'envoi reste en file ;
//   F. une saisie en file que la garde refuse va au coffre (plus jetée) ;
//   G. le coffre fusionne (une deuxième saisie refusée ne remplace plus la première) ;
//   H. une écriture directe que la garde refuse va au coffre ;
//   I. deux envois de la même clé : l'entrée du disque suit le plus récent ;
//   J. un seul vidage à la fois ;
//   K. hors ligne : la file directement, aucune entrée d'envoi ; après un envoi réussi, rien ne traîne.
//
//  ⚠ Contre-épreuve : chaque ancre doit être UNIQUE et l'essai VRAI sur le code sain — sinon ROUGE.
//  Usage :  node scripts/mv-harnais-envoi.mjs
//           node scripts/mv-harnais-envoi.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { MV_LIMITE_DOC, mvOctetsDoc } from '../src/taille-doc.js';

const CONTRE = process.argv.includes('--contre');
const FB0 = readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');

/* ══ EXTRACTION (même méthode que mv-harnais-fusion-docs) ══ */
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
  if (k < 0 || k > fin) return src.slice(i, fin + 1);
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
const VARS = ['_MV_FUSION_EXCLUES', '_fbBases', '_offlineBases', '_MV_FILE_BASE_CLE', '_MV_GUARD_FLOORS',
  '_mvFileMemSeule', '_mvFileAlerte', '_mvPersistDemande', '_MV_TAILLE_ALERTE', '_mvTropDit', '_MV_STASH_KEY',
  '_MV_PAGE', '_MV_ENVOI_PFX', '_MV_ENVOI_MAX_MS', '_MV_ENVOI_LENT', '_mvEnvoiDernier', '_mvEnvoiN', '_mvFlushP'];
// ★ CFG-1 (§496) : _mvGardeEcran — la phrase en clair que la garde passe à logError (sans elle, la branche « bloqué » plante ici).
const FNS = ['_mvDeepEqual', '_mvIsObj', '_mvGardeEcran', '_mvMerge3', '_mvMergeParcelles', '_mvEgal', '_mvCanon', '_mvFusion',
  '_mvFusionObjet', '_mvIdentite', '_mvClesListes', '_mvFusionListe', '_mvBaseNoter', '_mvBaseDe', '_mvBaseMem',
  '_mvSauverFusion', '_mvApresFusion', '_mvParcellesApres', '_entryHasProg', '_tachesBlockHasProg', '_mvParcProgCount',
  '_mvIntrantsCount', '_mvPaieCount', '_mvDocSize', '_mvBlockDestructive', '_saveParcellesMerged', '_fsNoNestedArrays',
  '_fbClone', 'applyFbData', '_mvBaseFile', '_mvBasesFileEcrire', '_mvFileDisqueKo', '_mvDemanderPersistance',
  '_queueSave', '_loadQueue', '_flushQueue', '_mvViderFile', '_retryAsync', '_isDenied', '_mvStashDenied',
  '_mvOctets', '_mvTailleControle', '_mvTailleAlerte', '_mvErreurTaille', '_mvTropGros', '_mvBorne',
  '_mvEnvoiCle', '_mvEnvoiNoter', '_mvEnvoiFini', '_mvErrLent', '_mvEnvoiBorne', '_mvFileFusionner',
  '_mvEnvoisRepris', '_mvFileParDessus', '_mvFileBloquee', '_mvFbSaveServeur'];
const code = src => VARS.map(n => blocVar(src, n)).join('\n') + '\n' + FNS.map(n => fonction(src, n)).join('\n')
  + '\n' + affectation(src, 'fbSave');

/* ══ BAC DE TEST ══ */
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const tick = () => new Promise(r => setImmediate(r));
async function ticks(n) { for (let i = 0; i < (n || 6); i++) await tick(); }
// Le disque du téléphone : partagé par les pages (avant / après la relance). length et key() : la reprise les lit.
function Disque() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k),
    key: i => Array.from(m.keys())[i] ?? null, get length() { return m.size; }, cles: () => Array.from(m.keys()),
  };
}
// L'horloge : rien n'avance tout seul. avancer(ms) déclenche les minuteurs échus, dans l'ordre.
function Horloge() {
  let t = 1760000000000, seq = 0; const file = [];
  return {
    now: () => t,
    setTimeout: (f, ms) => { const id = ++seq; file.push({ id, at: t + (ms || 0), f }); return id; },
    clearTimeout: id => { const i = file.findIndex(x => x.id === id); if (i >= 0) file.splice(i, 1); },
    async avancer(ms) {
      const fin = t + ms;
      for (;;) {
        file.sort((a, b) => a.at - b.at || a.id - b.id);
        const x = file[0];
        if (!x || x.at > fin) break;
        file.shift(); t = x.at; x.f(); await ticks(4);
      }
      t = fin; await ticks(4);
    },
  };
}
const enveloppe = v => ({ exists: () => v !== undefined, data: () => ({ value: clone(v) }), metadata: { fromCache: false, hasPendingWrites: false } });
// Une « page » : le code de firebase.js évalué une fois, sur un disque (partagé ou neuf) et une horloge.
function page(src, o) {
  o = o || {};
  const H = o.H || Horloge(), L = o.L || Disque(), serveur = o.serveur || {};
  const E = { ecritures: 0, transactions: 0, logs: [], badges: [], toasts: [] };
  const R = { pendu: !!o.pendu, liberer: [], pendantLecture: null };
  const W = { applyFbData: (k, v) => { W[k.toUpperCase()] = clone(v); }, logError: x => E.logs.push(x), _mvAvale: () => {},
              showToast: m => E.toasts.push(String(m)) };
  const DateH = class extends Date { static now() { return H.now(); } };
  const MathP = Object.create(Math); MathP.random = () => (o.alea != null ? o.alea : 0.5);
  const S = {
    window: W, localStorage: L, navigator: { onLine: !o.horsLigne }, console, JSON, Promise, Error, Object, Array, String, Number,
    Date: DateH, Math: MathP, setTimeout: H.setTimeout, clearTimeout: H.clearTimeout,
    TENANT_ID: o.tenant || 'dom-test', DEBUG: false, db: {}, MV_LIMITE_DOC, mvOctetsDoc,
    _offlineQueue: {}, _baseParcelles: null, _ignoreNext: {}, _ignoreBefore: {}, _mvDeniedRetried: {}, _onlineRetryTO: null,
    deepClone: clone, fbDocRef: k => ({ k }),
    getDoc: ref => Promise.resolve(enveloppe(serveur[ref.k])),
    setDoc: (ref, d) => { E.ecritures++; serveur[ref.k] = clone(d.value); return Promise.resolve(); },
    runTransaction: async (db, fn) => {
      E.transactions++;
      const ecr = [];
      const tx = {
        get: async ref => {
          if (R.pendu) await new Promise(r => R.liberer.push(r));       // réseau fantôme : la lecture attend
          if (R.pendantLecture) { const f = R.pendantLecture; R.pendantLecture = null; f(S); }
          return enveloppe(serveur[ref.k]);
        },
        set: (ref, d) => { ecr.push([ref.k, clone(d.value)]); },
      };
      const r = await fn(tx);
      for (const [k, v] of ecr) { serveur[k] = v; E.ecritures++; }
      return r;
    },
    _mvTokenAlive: async () => true, _mvKeyLbl: k => k, _showOfflineQueueBadge: () => {}, _mvSoonFlush: () => {},
    _mvSaisieEnCours: () => false, showSyncBadge: m => E.badges.push(String(m)),
    _mvNotifPlanifier: undefined,
  };
  vm.createContext(S);
  vm.runInContext(code(src), S);
  const relacher = () => { R.pendu = false; const l = R.liberer.splice(0); l.forEach(f => f()); };
  return { S, W, E, R, H, L, serveur, relacher };
}
const ids = l => (Array.isArray(l) ? l.map(x => x.id).join(',') : '?');
const a = (l, id) => Array.isArray(l) && l.some(x => x && x.id === id);
const envois = L => L.cles().filter(k => k.indexOf('mavigne_envoi:') === 0);
const Sx = (id, extra) => Object.assign({ id: id, date: '2026-10-13', activite: 'Rognage', parcelles: ['Les Cognées'] }, extra || {});

/* ══ LES ESSAIS — chacun rend VRAI sur le code sain ══ */
const ESSAIS = {
  // A — relancer pendant un envoi qui attend : rien n'est perdu
  relance: async src => {
    const L = Disque(), serveur = { sessions: [Sx('s0')] };
    const P1 = page(src, { L, serveur, pendu: true, alea: 0.11 });
    P1.S._fbBases.sessions = [Sx('s0')];
    P1.S.window.fbSave('sessions', [Sx('s0'), Sx('s1')]);            // la saisie part… et attend
    await ticks();
    const e = envois(L);
    if (e.length !== 1) return false;
    const o = JSON.parse(L.getItem(e[0]));
    if (!a(o.v, 's1') || ids(o.b) !== 's0') return false;            // sur le disque, avec sa base
    // La page meurt (relance). La nouvelle page, même disque :
    const P2 = page(src, { L, serveur, alea: 0.22 });
    P2.S._loadQueue();
    if (!a(P2.S._offlineQueue.sessions, 's1')) return false;          // reprise en file
    if (envois(L).length !== 0) return false;                         // l'entrée s'efface (la file la porte)
    P2.S.applyFbData('sessions', clone(serveur.sessions));           // la relecture du serveur (sans s1)
    if (!a(P2.W.SESSIONS, 's1')) return false;                        // l'écran la montre
    await P2.S._flushQueue();
    return a(serveur.sessions, 's1') && !('sessions' in P2.S._offlineQueue);
  },
  // B — la borne : 20 s sans réponse → en file ; l'écriture restée en route n'écrit plus
  borne: async src => {
    const serveur = { sessions: [Sx('s0')] };
    const P = page(src, { serveur, pendu: true });
    P.S._fbBases.sessions = [Sx('s0')];
    let fini = null; P.S.window.fbSave('sessions', [Sx('s0'), Sx('s1')]).then(r => { fini = r; });
    await P.H.avancer(19000);
    if (fini !== null || P.S._offlineQueue.sessions) return false;  // avant la borne : l'envoi attend
    await P.H.avancer(2000);
    if (!fini || fini.queued !== true) return false;                  // après : « en file »
    if (!a(P.S._offlineQueue.sessions, 's1')) return false;
    if (envois(P.L).length !== 0) return false;
    P.relacher(); await ticks(10);                                    // le réseau revient
    return P.E.ecritures === 0 && !a(serveur.sessions, 's1');         // l'écriture en route n'a rien écrit
  },
  // C — la reprise fusionne avec ce qui attendait déjà
  repriseFusion: async src => {
    const L = Disque(), serveur = { sessions: [Sx('s0')] };
    const P1 = page(src, { L, serveur, pendu: true, alea: 0.11 });
    P1.S._queueSave('sessions', [Sx('s0'), Sx('X')], [Sx('s0')]);    // déjà en file (un échec plus tôt)
    P1.S._fbBases.sessions = [Sx('s0')];
    P1.S.window.fbSave('sessions', [Sx('s0'), Sx('Y')]);              // en route, sans X (mémoire relue)
    await ticks();
    const P2 = page(src, { L, serveur, alea: 0.22 });
    P2.S._loadQueue();
    const q = P2.S._offlineQueue.sessions;
    return a(q, 'X') && a(q, 'Y') && a(q, 's0');
  },
  // D — la mémoire = le serveur + la file ; la saisie suivante ne remplace plus ce qui attend
  fileVisible: async src => {
    const serveur = { sessions: [Sx('s0')] };
    const P = page(src, { serveur });
    P.S._queueSave('sessions', [Sx('s0'), Sx('X')], [Sx('s0')]);
    P.S.applyFbData('sessions', [Sx('s0')]);                          // relecture après relance (sans X)
    if (!a(P.W.SESSIONS, 'X')) return false;
    P.S.navigator.onLine = false;
    await P.S.window.fbSave('sessions', P.W.SESSIONS.concat([Sx('Z')]));
    const q = P.S._offlineQueue.sessions;
    return a(q, 'X') && a(q, 'Z');
  },
  parcellesVisibles: async src => {
    const P = page(src, {});
    const srv = [{ nom: 'Les Cognées', taches: { Rognage: 'Non démarré' } }, { nom: 'Champ', taches: {} }];
    const ici = [{ nom: 'Les Cognées', taches: { Rognage: 'Validé' } }, { nom: 'Champ', taches: {} }];
    P.S._queueSave('parcelles', clone(ici), clone(srv));
    P.S.applyFbData('parcelles', clone(srv));
    const vu = (P.W.PARCELLES || []).find(p => p.nom === 'Les Cognées');
    return !!vu && vu.taches.Rognage === 'Validé' && P.S._baseParcelles[0].taches.Rognage === 'Non démarré';
  },
  // E — le vidage ne retire que ce qu'il a envoyé
  videPendant: async src => {
    const serveur = { sessions: [Sx('s0')] };
    const P = page(src, { serveur });
    P.S._queueSave('sessions', [Sx('s0'), Sx('A')], [Sx('s0')]);
    P.R.pendantLecture = S => { S._queueSave('sessions', [Sx('s0'), Sx('A'), Sx('B')], [Sx('s0')]); };
    await P.S._flushQueue();
    return a(serveur.sessions, 'A') && a(P.S._offlineQueue.sessions, 'B')
      && a(JSON.parse(P.L.getItem('mavigne_offline_queue')).sessions, 'B');
  },
  // F — la garde du vidage : au coffre, plus jetée
  gardeVidage: async src => {
    const plein = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => Sx(id));
    const serveur = { sessions: clone(plein) };
    const P = page(src, { serveur });
    // un téléphone à la mémoire vide a mis en file DEUX vraies saisies, sur une base qui portait tout
    P.S._queueSave('sessions', [Sx('n1'), Sx('n2')], clone(plein));
    await P.S._flushQueue();
    const coffre = JSON.parse(P.L.getItem('mavigne_denied_stash') || '{}');
    return !!coffre.sessions && a(coffre.sessions.value, 'n1') && a(coffre.sessions.value, 'n2')
      && !('sessions' in P.S._offlineQueue) && ids(serveur.sessions) === 'a,b,c,d,e,f';
  },
  // G — le coffre fusionne
  coffreFusion: async src => {
    const P = page(src, {});
    P.S._mvStashDenied('journal', [Sx('j1')]);
    P.S._mvStashDenied('journal', [Sx('j2')]);
    const c = JSON.parse(P.L.getItem('mavigne_denied_stash')).journal.value;
    return a(c, 'j1') && a(c, 'j2');
  },
  // H — une écriture directe que la garde refuse : au coffre
  gardeDirecte: async src => {
    const plein = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => Sx(id));
    const serveur = { sessions: clone(plein) };
    const P = page(src, { serveur });
    P.S._fbBases.sessions = clone(plein);
    const r = await P.S.window.fbSave('sessions', [Sx('n1')]);
    const coffre = JSON.parse(P.L.getItem('mavigne_denied_stash') || '{}');
    return r.blocked === true && !!coffre.sessions && a(coffre.sessions.value, 'n1') && envois(P.L).length === 0;
  },
  // I — deux envois de la même clé : l'entrée du disque suit le plus récent
  deuxEnvois: async src => {
    const L = Disque(), serveur = { sessions: [Sx('s0')] };
    const P1 = page(src, { L, serveur, pendu: true, alea: 0.11 });
    P1.S._fbBases.sessions = [Sx('s0')];
    P1.S.window.fbSave('sessions', [Sx('s0'), Sx('v1')]);
    await P1.H.avancer(5000);
    P1.S.window.fbSave('sessions', [Sx('s0'), Sx('v1'), Sx('v2')]);
    await P1.H.avancer(16000);                                        // la borne du 1er tombe, pas celle du 2e
    if (!a(P1.S._offlineQueue.sessions, 'v1')) return false;
    const e = envois(L);
    if (e.length !== 1 || !a(JSON.parse(L.getItem(e[0])).v, 'v2')) return false;
    const P2 = page(src, { L, serveur, alea: 0.22 });                 // la page meurt ici
    P2.S._loadQueue();
    return a(P2.S._offlineQueue.sessions, 'v2') && a(P2.S._offlineQueue.sessions, 'v1');
  },
  // J — un seul vidage à la fois
  unVidage: async src => {
    const serveur = { sessions: [Sx('s0')] };
    const P = page(src, { serveur, pendu: true });
    P.S._queueSave('sessions', [Sx('s0'), Sx('A')], [Sx('s0')]);
    const v1 = P.S._flushQueue(), v2 = P.S._flushQueue();
    await ticks();
    P.relacher();
    await Promise.all([v1, v2]);
    return P.E.transactions === 1 && a(serveur.sessions, 'A');
  },
  // K — hors ligne : la file, aucune entrée d'envoi ; en ligne et réussi : rien ne traîne
  propre: async src => {
    const serveur = { sessions: [Sx('s0')] };
    const P = page(src, { serveur, horsLigne: true });
    await P.S.window.fbSave('sessions', [Sx('s0'), Sx('h')]);
    if (envois(P.L).length !== 0 || !a(P.S._offlineQueue.sessions, 'h')) return false;
    const Q = page(src, { serveur });
    Q.S._fbBases.sessions = [Sx('s0')];
    const r = await Q.S.window.fbSave('sessions', [Sx('s0'), Sx('ok')]);
    return r.ok === true && a(serveur.sessions, 'ok') && envois(Q.L).length === 0;
  },
};

let vert = 0; const rouges = [];
const pose = (ok, nom) => { if (ok) { vert++; console.log('  ✓ ' + nom); } else { rouges.push(nom); console.log('  ✗ ' + nom); } };
async function jouer(f, src) { try { return !!(await f(src)); } catch (e) { return false; } }
async function essai(nom, f) {
  let ok = false;
  try { ok = !!(await f(FB0)); } catch (e) { console.log('    (plantage : ' + (e && e.message) + ')'); }
  pose(ok, nom);
}

console.log('MA VIGNE — Harnais ENVOI-1 (§326)');
if (!CONTRE) {
  console.log('\n── A · relancer pendant un envoi qui attend ──');
  await essai('★★★ la saisie est sur le disque pendant l’attente ; la page relancée la reprend, la montre, l’envoie', ESSAIS.relance);
  console.log('\n── B · la borne ──');
  await essai('★★★ 20 s sans réponse : « en file » ; l’écriture restée en route n’écrit plus', ESSAIS.borne);
  console.log('\n── C · la reprise ──');
  await essai('★★★ la reprise fusionne avec ce qui attendait déjà en file', ESSAIS.repriseFusion);
  console.log('\n── D · la file reste visible ──');
  await essai('★★★ après relance, l’écran montre ce qui attend ; la saisie suivante ne le remplace plus', ESSAIS.fileVisible);
  await essai('★★ parcelles : la tâche en attente se voit ; la base reste celle du serveur', ESSAIS.parcellesVisibles);
  console.log('\n── E · le vidage ──');
  await essai('★★★ une saisie mise en file pendant l’envoi reste en file', ESSAIS.videPendant);
  console.log('\n── F, G, H · le coffre ──');
  await essai('★★★ la garde du vidage met au coffre au lieu de jeter', ESSAIS.gardeVidage);
  await essai('★★ le coffre fusionne : la deuxième saisie refusée ne remplace plus la première', ESSAIS.coffreFusion);
  await essai('★★ une écriture directe refusée par la garde va au coffre', ESSAIS.gardeDirecte);
  console.log('\n── I, J, K · la tenue ──');
  await essai('★★★ deux envois de la même clé : l’entrée du disque suit le plus récent', ESSAIS.deuxEnvois);
  await essai('★★ un seul vidage à la fois', ESSAIS.unVidage);
  await essai('★ hors ligne : la file seule ; un envoi réussi ne laisse rien sur le disque', ESSAIS.propre);
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
  await mord('★★★ fbSave ne note plus la saisie avant de partir (le défaut du 13/10)',
    '  var _envoi = _mvEnvoiNoter(key, value, _mvBaseMem(key));', '  var _envoi = 0;', ESSAIS.relance);
  await mord('★★★ le démarrage ne reprend plus les envois interrompus',
    "  _mvEnvoisRepris();   // ★★★ ENVOI-1 (§326)", '  // (retiré)', ESSAIS.relance);
  await mord('★★★ la reprise remplace ce qui attendait au lieu de fusionner',
    '    else _offlineQueue[key] = _mvFusion(b, value, q);', '    else _offlineQueue[key] = value;', ESSAIS.repriseFusion);
  await mord('★★ plus de borne : l’envoi attend sans fin',
    'var _MV_ENVOI_MAX_MS = 20000;', 'var _MV_ENVOI_MAX_MS = 2000000000;', ESSAIS.borne);
  await mord('★★★ l’écriture restée en route écrit quand même après la borne',
    "    if (jeton && jeton.annule) throw _mvErrLent();   // ★ ENVOI-1 : la réponse arrive après la borne", '    if (false) throw 0;   // (retiré)', ESSAIS.borne);
  await mord('★★★ la relecture du serveur ignore de nouveau la file',
    '  value = _mvFileParDessus(key, value);', '', ESSAIS.fileVisible);
  await mord('★★ parcelles : la file ne passe plus par-dessus',
    "    if (key === 'parcelles') return (Array.isArray(q) && Array.isArray(value)) ? _mvMergeParcelles(Array.isArray(b) ? b : value, deepClone(q), value) : value;",
    "    if (key === 'parcelles') return value;", ESSAIS.parcellesVisibles);
  await mord('★★★ le vidage efface la clé sans regarder ce qui est arrivé pendant l’envoi',
    '      if (_offlineQueue[key] === _envoye) { delete _offlineQueue[key]; delete _offlineBases[key]; }',
    '      if (true) { delete _offlineQueue[key]; delete _offlineBases[key]; }', ESSAIS.videPendant);
  await mord('★★★ la garde du vidage jette de nouveau la saisie',
    "function _mvFileBloquee(key, value, detail) {\n  _mvStashDenied(key, value);", "function _mvFileBloquee(key, value, detail) {", ESSAIS.gardeVidage);
  await mord('★★ le coffre remplace de nouveau la saisie précédente',
    "        else if (key !== 'kml_polygons') v = _mvFusion(undefined, value, st[key].value);", '        else v = value;', ESSAIS.coffreFusion);
  await mord('★★ l’écriture directe refusée n’est plus gardée',
    "        if (window.logError) window.logError(Object.assign({ level:'critical', cat:'guard', msg:'fbSave ' + key + ' BLOQUE (anti-ecrasement)', detail:'cur=' + _fRes.curN + ' new=' + _fRes.newN }, _mvGardeEcran(key)));\n        _mvStashDenied(key, value);",
    "        if (window.logError) window.logError(Object.assign({ level:'critical', cat:'guard', msg:'fbSave ' + key + ' BLOQUE (anti-ecrasement)', detail:'cur=' + _fRes.curN + ' new=' + _fRes.newN }, _mvGardeEcran(key)));", ESSAIS.gardeDirecte);   // ancre suivie de CFG-1 (§496)
  await mord('★★★ un envoi plus ancien efface l’entrée du plus récent',
    '  if (_mvEnvoiDernier[key] !== n) return;\n', '', ESSAIS.deuxEnvois);
  await mord('★★ deux vidages à la fois',
    '  if (_mvFlushP) return _mvFlushP;\n', '', ESSAIS.unVidage);
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
process.exit(0);
