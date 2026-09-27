#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — DROITS-1 : LA LECTURE SEULE, MÊME RÈGLE DANS L'APPLI ET SUR LE SERVEUR (§185)
   Lancer : node scripts/mv-harnais-droits.mjs          (+ --contre)

   ══ POURQUOI ══
   Point 6 de l'audit du 26/09. Le serveur pose le claim `ro` par deriveRo
   (functions/claims.js) et les règles refusent alors toute écriture. L'appli, elle,
   n'avait aucune notion de ce `ro` : elle tentait d'écrire (écran actif, migration
   au chargement), prenait le refus, mettait la valeur au coffre et affichait en rouge
   « Enregistrement refusé ». Et les erreurs d'un rôle en lecture seule n'arrivaient
   jamais à l'Admin GT (error_log refusé par la règle 3).

   ══ CE QU'IL TIENT ══
     A. _mvLectureSeule (utils.js) = deriveRo (claims.js), EXÉCUTÉES toutes deux sur les
        32 combinaisons des cinq rôles.
     B. fbSave : la garde lecture seule précède _ignoreNext (sinon la prochaine mise à
        jour distante serait ignorée), ne tente rien, parle une seule fois.
     C. Règles : error_log accepté de tout membre (pas la démo), liste bornée à 100.
   ⚠️ CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { utils: lire('src/utils.js'), claims: lire('functions/claims.js'), fb: lire('src/firebase.js'), rules: lire('firestore.rules'), regl: lire('src/reglages.js') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };
function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  return null;
}
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const ROLES = ['admin', 'ouvrier', 'tractoriste', 'saisonnier', 'pilotage'];

function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  try {
    if (!silencieux) console.log('\n' + c.b('A. Appli et serveur, même règle'));
    const ls = bloc(S.utils, 'export function _mvLectureSeule(');
    const dr = bloc(S.claims, 'function deriveRo(');
    if (!ls || !dr) throw new Error('extraction impossible');
    const W = {};
    const fLS = new Function('window', ls.replace('export function', 'function') + '\nreturn _mvLectureSeule;')(W);
    const fDR = new Function(dr + '\nreturn deriveRo;')();
    const ecarts = []; let nRo = 0;
    for (let m = 0; m < 32; m++) {
      const roles = ROLES.filter((_, i) => m & (1 << i));
      W.currentUser = { roles };
      const a = fLS(), b = fDR(roles);
      if (a !== b) ecarts.push(roles.join('+') || '(aucun)');
      if (b) nRo++;
    }
    t('32 combinaisons : ' + (ecarts.length ? 'écarts ' + ecarts.join(', ') : 'aucun écart') + ' (' + nRo + ' en lecture seule)', ecarts.length === 0);
    W.currentUser = { roles: ['pilotage'] }; const p = fLS();
    W.currentUser = { roles: ['tractoriste'] }; const tr = fLS();
    t('Pilote seul : lecture seule ; tractoriste seul : écrit (ses sessions)', p === true && tr === false);
    W.currentUser = { roles: [] }; const vide = fLS();
    t('DROITS-2 : aucun rôle → lecture seule, des deux côtés', vide === true && fDR([]) === true && fDR(['bureau']) === true);
    W.currentUser = { roles: [], _isGTAdmin: true };
    t('GUERETTECH n\u2019est jamais bloqué par l\u2019appli (les règles le laissent écrire)', fLS() === false);
    W.currentUser = null;
    t('Pas de session : rien n\u2019est bloqué (aucun enregistrement avant la connexion)', fLS() === false);

    if (!silencieux) console.log('\n' + c.b('B. fbSave ne tente plus'));
    const fs1 = bloc(sansCom(S.fb), 'window.fbSave = async function') || '';
    const iG = fs1.indexOf('if (window._mvLectureSeule && window._mvLectureSeule())'), iI = fs1.indexOf('_ignoreNext[key]   = true;');
    t('La garde existe, AVANT _ignoreNext', iG > 0 && iI > 0 && iG < iI);
    t('Elle ne tente rien et le dit : { ok:false, denied:true, ro:true }', /return \{ ok: false, denied: true, ro: true \};/.test(fs1));
    t('Le message ne sort qu\u2019une fois par session', /if \(!_mvRoDit\) \{\s*_mvRoDit = true;/.test(fs1) && /var _mvRoDit = false;/.test(S.fb));

    if (!silencieux) console.log('\n' + c.b('C. Les erreurs des rôles en lecture seule remontent'));
    t('Règle error_log : tout membre, pas la démo, liste ≤ 100', /docId == 'error_log'\s*&& request\.auth\.token\.get\('demo', false\) != true\s*&& shapeOk\(\)\s*&& request\.resource\.data\.value is list\s*&& request\.resource\.data\.value\.size\(\) <= 100;/.test(S.rules));

    if (!silencieux) console.log('\n' + c.b('D. ACCES-1 — une fiche Inactive n\u2019a plus accès'));
    const dof = bloc(S.claims, 'function deriveOff(');
    if (!dof) throw new Error('deriveOff introuvable');
    const fOff = new Function(dof + '\nreturn deriveOff;')();
    t('deriveOff : Inactif → coupé ; Actif, vide → accès', fOff('Inactif') === true && fOff('Actif') === false && fOff(undefined) === false);
    const rules = sansCom(S.rules), im = bloc(rules, 'function isMyTenant(') || '';
    t('Règles : isMyTenant refuse un compte `off` (lecture ET écriture)', /request\.auth\.token\.get\('off', false\) != true/.test(im));
    const expo = (src, nom) => { const i = src.indexOf('exports.' + nom + ' = onCall('); if (i < 0) return ''; const j = src.indexOf('\nexports.', i + 10); return src.slice(i, j < 0 ? undefined : j); };
    const um = expo(sansCom(S.claims), 'updateMemberRoles');
    t('updateMemberRoles pose `off` (paramètre, sinon le doc membres), jamais pour GUERETTECH', /off: off \? true : null/.test(um) && /request\.data\.inactif/.test(um) && /deriveOff\(fiche\.statut\)/.test(um) && /if \(tc\.gtAdmin === true\) off = false;/.test(um));
    t('… et coupe les sessions au PASSAGE à Inactif (revokeRefreshTokens)', /if \(off && tc\.off !== true\) \{ await admin\.auth\(\)\.revokeRefreshTokens\(r\.uid\);/.test(um));
    t('… sans retirer `tenant` (sinon un autre domaine pourrait rattacher le compte)', /tenant: tenant,\s*ro:/.test(um));
    const bf = expo(sansCom(S.claims), 'gtBackfillClaims');
    t('gtBackfillClaims : `off` selon le statut, sessions coupées', /off: \(!isDemoTenant && m\.email !== GT_EMAIL && deriveOff\(m\.statut\)\) \? true : null/.test(bf) && /revokeRefreshTokens\(r\.uid\)/.test(bf));
    const se = bloc(sansCom(S.regl), 'function saveEditMembre(') || '';
    t('Réglages : changer le STATUT repose les droits, avec `inactif`', /!==_rolesAvant \|\| _statutChange\) && window\._fbUpdateMemberRoles/.test(se) && /window\._fbUpdateMemberRoles\(m\.email, m\.roles, \(m\.statut\|\|'Actif'\)==='Inactif'\)/.test(se));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!process.argv.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais DROITS-1'));
  const r = jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, a, b) { if (!S[f].includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 50)); return Object.assign({}, S, { [f]: S[f].replace(a, b) }); }
const MUT = [
  ['l\u2019appli oublie que le tractoriste écrit', S => muter(S, 'utils', "  return r.indexOf('admin') < 0 && r.indexOf('ouvrier') < 0 && r.indexOf('tractoriste') < 0;", "  return r.indexOf('admin') < 0 && r.indexOf('ouvrier') < 0;")],
  ['la garde passe après _ignoreNext', S => {
    const g = S.fb.slice(S.fb.indexOf('  if (window._mvLectureSeule && window._mvLectureSeule()) {'), S.fb.indexOf("    return { ok: false, denied: true, ro: true };\n  }\n") + "    return { ok: false, denied: true, ro: true };\n  }\n".length);
    if (!g) throw new Error('garde introuvable');
    const sansG = S.fb.replace(g, '');
    return muter({ fb: sansG }, 'fb', "  _ignoreBefore[key] = Date.now() + 4000;\n", "  _ignoreBefore[key] = Date.now() + 4000;\n" + g) && Object.assign({}, S, { fb: sansG.replace("  _ignoreBefore[key] = Date.now() + 4000;\n", "  _ignoreBefore[key] = Date.now() + 4000;\n" + g) });
  }],
  ['le serveur laisse de nouveau écrire un membre sans rôle', S => muter(S, 'claims', "  return !r.includes('admin') && !r.includes('ouvrier') && !r.includes('tractoriste');", "  return !r.includes('admin') && !r.includes('ouvrier') && !r.includes('tractoriste') && r.length > 0;")],
  ['ACCES-1 : les règles oublient `off`', S => muter(S, 'rules', "             && request.auth.token.get('off', false) != true       // ACCES-1 (§186) : fiche Inactive = plus d'accès\n", "")],
  ['ACCES-1 : plus de coupure des sessions', S => muter(S, 'claims', "    if (off && tc.off !== true) { await admin.auth().revokeRefreshTokens(r.uid); coupe = true; }", "")],
  ['ACCES-1 : Réglages ignore le changement de statut', S => muter(S, 'regl', "(m.roles.slice().sort().join(',')!==_rolesAvant || _statutChange)", "(m.roles.slice().sort().join(',')!==_rolesAvant)")],
  ['la règle error_log disparaît', S => muter(S, 'rules', "                   && docId == 'error_log'", "                   && docId == 'error_log_x'")],
];
console.log(c.b('MA VIGNE — Harnais DROITS-1 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
