#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — VER-1 : LES VERSIONS PÉRIMÉES (§184)
   Lancer : node scripts/mv-harnais-version.mjs          (+ --contre)

   ══ POURQUOI ══
   MAJ-1 (§157) : aucune mise à jour ne s'impose pendant l'utilisation. Une PWA jamais
   fermée garde donc l'ancien code des jours et ÉCRIT avec — rien ne l'en empêchait.
   Décision de Nico (27/09) : plancher AUTOMATIQUE (il ne règle rien), mise à jour au
   retour d'une longue absence, parc d'appareils visible dans l'Admin GT.

   ══ CE QU'IL TIENT ══
     A. _mvVerifierVersion (app.js, exécutée, fetch simulé) : format serveur plus haut
        → périmé + écran ; égal, plus bas, absent (404), hors ligne → rien ; pas plus
        d'une lecture par minute.
     B. _mvRienEnCours (exécutée) : fenêtre ouverte, champ actif, file non vide → non.
     C. fbNoterAppareil (firebase.js, exécutée) : fusion par clé (merge), version et
        format notés ; jamais en démo ni en préparation.
     D. _agtFicheAppareils (admin-gt.js, exécutée) : « bloquée » si format plus bas,
        version ancienne signalée, noms échappés.
     E. Code lu : fbSave met en file quand périmé ; _flushQueue ne part pas ; sw.js active
        sur MV_ACTIVER et ne met pas /version.json en cache ; le retour ≥ _MV_RETOUR_H h
        n'active que si rien n'est en cours ; build, en-tête sans cache, règle Firestore.
   ⚠️ Contre-épreuves en mémoire, garde d'injection. CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { app: lire('src/app.js'), fb: lire('src/firebase.js'), agt: lire('src/admin-gt.js'), sw: lire('public/sw.js'),
               pkg: lire('package.json'), fbj: lire('firebase.json'), rules: lire('firestore.rules'), utils: lire('src/utils.js') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };
function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  return null;
}
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

function monterVer(S, rep) {
  const f = bloc(S.app, 'async function _mvVerifierVersion(');
  if (!f) throw new Error('extraction _mvVerifierVersion');
  const E = { fetchs: 0, perime: 0, jsonLu: 0 };
  const W = { MV_FORMAT: 1 };
  const navigator = { onLine: rep.horsLigne ? false : true };
  const fetch = async () => {
    E.fetchs++;
    if (rep.statut === 404) return { ok: false };
    if (rep.html) return { ok: true, headers: { get: () => 'text/html' }, json: async () => { E.jsonLu++; throw new SyntaxError("Unexpected token '<'"); } };
    return { ok: true, headers: { get: () => 'application/json' }, json: async () => rep.json };
  };
  const fn = new Function('window', 'navigator', 'fetch', 'var _mvVerDerniere=0; function _mvPasserPerime(j){ window._MV_PERIME=true; E.perime++; } var E=arguments[3];\n'
    + f + '\nreturn _mvVerifierVersion;')(W, navigator, fetch, E);
  return { fn, W, E };
}

async function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  const titre = s => { if (!silencieux) console.log('\n' + c.b(s)); };
  try {
    titre('A. La version plancher, lue sur le serveur');
    let M = monterVer(S, { json: { app: '7.70', format: 2 } }); await M.fn();
    t('Format serveur 2, installé 1 → version périmée', M.W._MV_PERIME === true && M.E.perime === 1);
    M = monterVer(S, { json: { app: '7.70', format: 1 } }); await M.fn();
    t('Même format (nouvelle version sans changement de format) → rien', !M.W._MV_PERIME);
    M = monterVer(S, { json: { app: '7.60', format: 0 } }); await M.fn();
    t('Format serveur plus bas ou nul → rien', !M.W._MV_PERIME);
    M = monterVer(S, { statut: 404 }); await M.fn();
    t('Pas de fichier (dev, e2e) → rien', !M.W._MV_PERIME && M.E.fetchs === 1);
    M = monterVer(S, { html: true }); let leve = false; try { await M.fn(); } catch (e) { leve = true; }
    t('Serveur de dev (index.html en 200) → rien, sans lire du JSON ni lever (VER-2, e2e de la CI)', !M.W._MV_PERIME && M.E.jsonLu === 0 && !leve);
    M = monterVer(S, { horsLigne: true, json: { format: 9 } }); await M.fn();
    t('Hors ligne → aucune lecture', M.E.fetchs === 0 && !M.W._MV_PERIME);
    M = monterVer(S, { json: { format: 1 } }); await M.fn(); await M.fn();
    t('Pas plus d\u2019une lecture par minute', M.E.fetchs === 1);

    titre('B. Rien en cours ?');
    const rc = bloc(S.app, 'function _mvRienEnCours(');
    if (!rc) throw new Error('extraction _mvRienEnCours');
    const rien = (o) => new Function('document', 'window', rc + '\nreturn _mvRienEnCours();')(
      { querySelector: () => (o.ov ? {} : null), activeElement: o.champ ? { tagName: 'INPUT' } : { tagName: 'BODY' } },
      { _offlineQueueCount: () => o.file || 0 });
    t('Rien d\u2019ouvert → oui', rien({}) === true);
    t('Une fenêtre ouverte → non', rien({ ov: 1 }) === false);
    t('Un champ actif → non', rien({ champ: 1 }) === false);
    t('Une saisie en file → non', rien({ file: 2 }) === false);

    titre('C. Le parc d\u2019appareils');
    const na = bloc(S.fb, 'window.fbNoterAppareil = async function'), id = bloc(S.fb, 'function _mvIdAppareil(');
    if (!na || !id) throw new Error('extraction fbNoterAppareil');
    const noter = async (tenant, prep) => {
      const appels = []; const ls = {};
      const W = { APP_VERSION: '7.68', MV_FORMAT: 1, _mvPrepOn: () => !!prep, _mvAvale: () => {}, matchMedia: () => ({ matches: true }) };
      const r = await new Function('window', 'navigator', 'localStorage', 'setDoc', 'fbDocRef', 'TENANT_ID', id + '\n' + na.replace('window.fbNoterAppareil = ', 'var F = ') + ';\nreturn F("Nico");')(
        W, { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Safari/537' },
        { getItem: k => ls[k] || null, setItem: (k, v) => { ls[k] = v; } },
        async (ref, data, opt) => { appels.push({ ref, data, opt }); }, k => 'doc:' + k, tenant);
      return { r, appels };
    };
    let N = await noter('marchand-grillot', false);
    const a = N.appels[0], ligne = a && Object.values(a.data.value)[0];
    t('Écrit dans « appareils », fusion par clé (merge)', a && a.ref === 'doc:appareils' && a.opt && a.opt.merge === true && Object.keys(a.data).join() === 'value');
    t('Version, format, système, navigateur, installée', ligne && ligne.v === '7.68' && ligne.f === 1 && ligne.sys === 'Android' && ligne.nav === 'Chrome' && ligne.installe === true && ligne.nom === 'Nico');
    t('Jamais en démo', (await noter('domaine-dupont', false)).appels.length === 0);
    t('Jamais en mode préparation', (await noter('marchand-grillot', true)).appels.length === 0);

    titre('D. La fiche de l\u2019Admin GT');
    const fa = bloc(S.agt, 'function _agtFicheAppareils(');
    if (!fa) throw new Error('extraction _agtFicheAppareils');
    const fiche = new Function('window', '_escHtml', '_agtRelTime', '_agtFicheSec', fa + '\nreturn _agtFicheAppareils;')(
      { APP_VERSION: '7.68', MV_FORMAT: 2 }, s => String(s).replace(/</g, '&lt;'), () => 'hier', (t, c) => '[' + t + ']' + c);
    const h = fiche({ appareils: { a: { nom: 'Victor', v: '7.67', f: 1, ts: '2026-09-26' }, b: { nom: '<b>X</b>', v: '7.68', f: 2, ts: '2026-09-27' } } });
    t('Format plus bas → « bloquée »', /v7\.67 · bloquée/.test(h) || /v7\.67 \\u00b7 bloqu/.test(h) || /v7\.67[^<]*bloqu/.test(h));
    t('Version ancienne signalée (1 appareil)', /1 appareil sur une version ant/.test(h));
    t('Noms échappés', !/<b>X<\/b>/.test(h));

    titre('E. Le câblage (code lu)');
    const fs1 = bloc(sansCom(S.fb), 'window.fbSave = async function') || '';
    t('fbSave : version périmée → file hors ligne, aucune écriture', /if \(window\._MV_PERIME\) \{\s*_queueSave\(key, value, _mvBaseMem\(key\)\);\s*return \{ ok: false, queued: true, perime: true \};/.test(fs1));
    const fl = bloc(sansCom(S.fb), 'async function _flushQueue(') || '';
    t('_flushQueue : ne part pas tant que la version est périmée', /^async function _flushQueue\(\) \{\s*if \(window\._MV_PERIME\) return;/.test(fl));
    const sw = sansCom(S.sw);
    t('sw.js : MV_ACTIVER → skipWaiting (seule activation)', /event\.data\?\.type === 'MV_ACTIVER'\) self\.skipWaiting\(\)/.test(sw) && (sw.match(/skipWaiting\(/g) || []).length === 1);
    t('sw.js : /version.json jamais intercepté', /if \(url\.pathname === '\/version\.json'\) return;/.test(sw));
    const vis = sansCom(S.app);
    t('Retour ≥ _MV_RETOUR_H h ET rien en cours → activation douce', /if\(absent>=_MV_RETOUR_H\*3600000 && _mvRienEnCours\(\)\) _mvActiverMaj\(false\);/.test(vis));
    /* GT-1 (§249) : le build fabrique d'abord gt.html (scripts/mv-gt-page.mjs) ; l'ordre qui compte ici est inchangé —
       version.json APRÈS inject-precache. */
    t('Build : version.json publié après inject-precache', /"build": "node scripts\/mv-gt-page\.mjs && vite build && node scripts\/inject-precache\.mjs && node scripts\/mv-version-json\.mjs"/.test(S.pkg));
    t('Hébergement : /version.json sans cache', /"source": "\/version\.json"[\s\S]{0,120}no-store/.test(S.fbj));
    t('Règles : « appareils » écrit par tout membre, forme { value } + map bornée', /docId == 'appareils'[\s\S]{0,160}shapeOk\(\)[\s\S]{0,80}value is map[\s\S]{0,80}size\(\) <= 200/.test(S.rules));
    t('utils : MV_FORMAT exporté et exposé', /export const MV_FORMAT = \d+;/.test(S.utils) && /window\.MV_FORMAT\s*= MV_FORMAT;/.test(S.utils));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!process.argv.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais VER-1'));
  const r = await jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, a, b) { if (!S[f].includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 50)); return Object.assign({}, S, { [f]: S[f].replace(a, b) }); }
const MUT = [
  ['fbSave écrit malgré une version périmée', S => muter(S, 'fb', "  if (window._MV_PERIME) {\n    _queueSave(key, value, _mvBaseMem(key));", "  if (false) {\n    _queueSave(key, value, _mvBaseMem(key));")],
  ['la file part avec le code périmé', S => muter(S, 'fb', "  if (window._MV_PERIME) return;   // VER-1", "  // VER-1")],
  ['VER-2 : on parse de nouveau une page HTML comme du JSON', S => muter(S, 'app', "    if(!/json/i.test(r.headers.get('content-type')||'')) return;\n", "")],
  ['même format = périmé (bloque chaque déploiement)', S => muter(S, 'app', "if(fmt>0 && fmt>(Number(window.MV_FORMAT)||0))", "if(fmt>0 && fmt>=(Number(window.MV_FORMAT)||0))")],
  ['l\u2019activation au retour ignore ce qui est en cours', S => muter(S, 'app', "if(absent>=_MV_RETOUR_H*3600000 && _mvRienEnCours())", "if(absent>=_MV_RETOUR_H*3600000)")],
  ['le parc écrase au lieu de fusionner', S => muter(S, 'fb', "await setDoc(fbDocRef('appareils'), { value: ligne }, { merge: true });", "await setDoc(fbDocRef('appareils'), { value: ligne });")],
  ['sw.js n\u2019active plus sur demande', S => muter(S, 'sw', "  if (event.data?.type === 'MV_ACTIVER') self.skipWaiting();", "")],
];
console.log(c.b('MA VIGNE — Harnais VER-1 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = await jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
