#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — STOCK-1 : UNE SAISIE HORS LIGNE NE DISPARAÎT PLUS (§180)
   Lancer : node scripts/mv-harnais-stock.mjs
            node scripts/mv-harnais-stock.mjs --contre

   ══ POURQUOI ══
   firebase.js : si localStorage refusait d'écrire la file hors ligne (quota plein,
   stockage désactivé), l'erreur était avalée et la saisie ne vivait plus qu'en
   mémoire ; puis _flushQueue commençait par _loadQueue(), qui REMPLAÇAIT la mémoire
   par le disque. À la reconnexion, la saisie disparaissait sans un mot. Et l'appli
   ne demandait jamais au navigateur de garder son stockage (navigator.storage.persist).

   ══ CE QU'IL TIENT (vraies fonctions de firebase.js, EXÉCUTÉES) ══
     A. Disque normal : rien ne change.
     B. Disque qui refuse : la saisie reste, _loadQueue la garde (base comprise),
        l'utilisateur est prévenu UNE fois, l'incident est journalisé.
     C. Une clé écrite par un autre onglet : le disque fait toujours foi.
     D. Stockage persistant demandé au premier passage hors ligne, une seule fois.
     E. Code lu : la fin de _flushQueue remet les marques à zéro si le disque accepte,
        marque ce qui reste s'il refuse.
   ⚠️ Contre-épreuves en mémoire, garde d'injection. CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const BASE = { fb: fs.readFileSync(path.join(RACINE, 'src/firebase.js'), 'utf8') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };

function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

function monter(S) {
  const noms = ['function _mvBaseFile(', 'function _mvBasesFileEcrire(', 'function _mvFileDisqueKo(', 'function _mvDemanderPersistance(',
                'function _queueSave(', 'function _loadQueue('];
  const parts = noms.map(n => bloc(S.fb, n));
  if (parts.some(x => !x)) throw new Error('extraction impossible (ancre absente)');
  const disque = {}; const E = { plein: false, toasts: [], logs: [], persistAppels: 0, persistedAppels: 0 };
  const localStorage = {
    getItem: k => (k in disque ? disque[k] : null),
    setItem: (k, v) => { if (E.plein && k === 'mavigne_offline_queue') { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } disque[k] = String(v); },
    removeItem: k => { delete disque[k]; },
  };
  const W = { showToast: m => E.toasts.push(m), logError: o => E.logs.push(o), _mvAvale: () => {} };
  const navigator = { storage: {
    persisted: () => { E.persistedAppels++; return Promise.resolve(false); },
    persist: () => { E.persistAppels++; return Promise.resolve(true); } } };
  const code = 'var window=W; var TENANT_ID="t"; var _offlineQueue={}; var _offlineBases={}; var _MV_FILE_BASE_CLE="mavigne_offline_queue_base";'
    + 'var _mvFileMemSeule={}; var _mvFileAlerte=false; var _mvPersistDemande=false; function _showOfflineQueueBadge(){}\n'
    + parts.join('\n')
    + '\nreturn { W:W, queue:_queueSave, load:_loadQueue, q:function(){ return _offlineQueue; }, b:function(){ return _offlineBases; } };';
  const M = new Function('W', 'localStorage', 'navigator', code)(W, localStorage, navigator);
  return Object.assign(M, { E, disque });
}

async function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  const titre = s => { if (!silencieux) console.log('\n' + c.b(s)); };
  try {
    titre('A. Disque normal');
    let M = monter(S);
    M.queue('journal', [{ id: 'a' }], [{ id: 'base' }]);
    t('La saisie est écrite sur le disque', JSON.parse(M.disque.mavigne_offline_queue).journal[0].id === 'a');
    M.load();
    t('… et relue telle quelle', M.q().journal[0].id === 'a' && M.b().journal[0].id === 'base');
    t('Aucun message', M.E.toasts.length === 0);

    titre('B. Le disque refuse (quota plein)');
    M = monter(S); M.E.plein = true;
    M.queue('journal', [{ id: 'saisie' }], [{ id: 'base' }]);
    M.queue('sessions', [{ id: 's1' }], null);
    M.load();
    t('La saisie n\u2019est pas perdue à la relecture', M.q().journal && M.q().journal[0].id === 'saisie');
    t('… sa base non plus', M.b().journal && M.b().journal[0].id === 'base');
    t('… ni la 2e saisie', M.q().sessions && M.q().sessions[0].id === 's1');
    t('L\u2019utilisateur est prévenu, une seule fois', M.E.toasts.length === 1 && /ne fermez pas/.test(M.E.toasts[0]));
    t('L\u2019incident est journalisé (plus avalé)', M.E.logs.filter(l => l.cat === 'stockage' && l.level === 'warning').length === 2);
    M.E.plein = false;
    M.queue('taches', [{ id: 't' }], null);
    t('Le disque revient : tout y est écrit d\u2019un coup', Object.keys(JSON.parse(M.disque.mavigne_offline_queue)).sort().join() === 'journal,sessions,taches');

    titre('C. Un autre onglet a écrit sur le disque');
    M = monter(S); M.E.plein = true;
    M.queue('journal', [{ id: 'moi' }], null);
    M.E.plein = false;
    M.disque.mavigne_offline_queue = JSON.stringify({ planning_entries: { x: 1 } });
    M.load();
    t('Sa clé est reprise du disque', M.q().planning_entries && M.q().planning_entries.x === 1);
    t('… et la mienne, jamais écrite, reste', M.q().journal && M.q().journal[0].id === 'moi');

    titre('D. Stockage persistant');
    M = monter(S);
    M.queue('journal', [], null); M.queue('sessions', [], null);
    await new Promise(r => setTimeout(r, 5));
    t('Demandé au premier passage hors ligne, une seule fois', M.E.persistedAppels === 1 && M.E.persistAppels === 1);
    t('Le résultat est exposé pour le diagnostic', M.W._mvStockagePersistant === true);

    titre('E. La fin de _flushQueue (code lu)');
    const fl = bloc(sansCom(S.fb), 'async function _flushQueue(') || '';
    t('Disque accepté → marques remises à zéro', /localStorage\.setItem\('mavigne_offline_queue', JSON\.stringify\(_offlineQueue\)\);\s*_mvFileMemSeule = \{\};/.test(fl));
    t('Disque refusé → ce qui reste est marqué « mémoire »', /Object\.keys\(_offlineQueue\)\.forEach\(function \(k\) \{ _mvFileDisqueKo\(k, e\); \}\)/.test(fl));
    t('_flushQueue relit toujours par _loadQueue (qui garde la mémoire)', /_loadQueue\(\);/.test(fl));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!CONTRE) {
  console.log(c.b('MA VIGNE — Harnais STOCK-1'));
  const r = await jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, ancre, rempl) {
  if (!S.fb.includes(ancre)) throw new Error('ancre introuvable : ' + ancre.slice(0, 60));
  return { fb: S.fb.replace(ancre, rempl) };
}
const MUT = [
  ['_loadQueue remplace de nouveau la mémoire par le disque', S => muter(S, "    _offlineQueue[k] = memQ[k];\n", "")],
  ['l\u2019échec d\u2019écriture est de nouveau avalé', S => muter(S, "  catch(e){ _mvFileDisqueKo(key, e); }", "  catch(e){ }")],
  ['le stockage persistant n\u2019est plus demandé', S => muter(S, "function _queueSave(key, value, base) {\n  _mvDemanderPersistance();", "function _queueSave(key, value, base) {")],
  ['le message revient à chaque saisie', S => muter(S, "  if (!_mvFileAlerte) {", "  if (true) {")],
  ['la fin de flush oublie de marquer ce qui reste', S => muter(S, "    Object.keys(_offlineQueue).forEach(function (k) { _mvFileDisqueKo(k, e); });", "    if(window._mvAvale) window._mvAvale(e,'x');")],
];
console.log(c.b('MA VIGNE — Harnais STOCK-1 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = await jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
