#!/usr/bin/env node
/**
 * mv-harnais-signature.mjs — LE CONTRAT EST PAR DOMAINE (SIGN-1, §156).
 *
 * Vécu le 19/09/2026 : un salarié passé admin a dû signer CGU + DPA « au nom du domaine » pour entrer
 * (le claim `terms` est par personne), et sa signature a REMPLACÉ la preuve d'origine (`set` sur
 * _mv_signatures/{slug}, un document par domaine, sans historique).
 *
 * CE QUE CE HARNAIS GRAVE — sur le VRAI code, extrait et JOUÉ (méthode C20) :
 *   ① serveur (functions/claims.js) : la preuve du domaine n'est remplacée que si elle manque ou porte des
 *      versions dépassées ; l'historique sépare deux acceptations de même réf ; le parent ne s'écrit plus
 *      sans condition ; le courriel GT dit ce qui est arrivé à la preuve ;
 *   ② porte (src/app.js) : sans claim, la preuve du DOMAINE à jour suffit ; sinon, et sur toute erreur, la
 *      porte s'ouvre (fail-closed) ; le cache ne sert pas la preuve d'un autre domaine ; le reçu dit qui a
 *      signé, échappé ;
 *   ③ restauration (scripts/mv-signature-restaurer.cjs) : même identifiant d'historique que le serveur ; la
 *      preuve du domaine redevient la première acceptation des versions en vigueur.
 *
 *   node scripts/mv-harnais-signature.mjs            les assertions
 *   node scripts/mv-harnais-signature.mjs --contre   chaque défaut réinjecté DOIT faire rougir la suite
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (p) => fs.readFileSync(path.join(RACINE, p), 'utf8');
const sansCommentaires = (t) => t.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
function bloc(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  let d = 0, f = -1;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) { f = k; break; } }
  }
  return f < 0 ? null : src.slice(i, f + 1);
}
function extraire(fichier, noms) {
  const src = lire(fichier), out = [], manque = [];
  noms.forEach((n) => {
    const b = n.startsWith('var ') ? (src.match(new RegExp('^' + n.replace(/[$]/g, '\\$') + '[^\\n]*$', 'm')) || [])[0] : bloc(src, 'function ' + n + '(');
    if (b) out.push(b); else manque.push(n);
  });
  if (manque.length) { console.log('\n  ✗ introuvable dans ' + fichier + ' : ' + manque.join(', ') + '\n'); process.exit(1); }
  return sansCommentaires(out.join('\n'));
}
const SRC_CLAIMS = lire('functions/claims.js');
const I_AT = SRC_CLAIMS.indexOf('exports.acceptTerms = onCall(');
const AT = I_AT < 0 ? '' : SRC_CLAIMS.slice(I_AT);
const CODE = {
  serveur: extraire('functions/claims.js', ['termsPlan', 'termsHistId', 'termsLigneAvant']),
  client: extraire('src/app.js', ['var _MVT_CGV', '_mvTermsOk', '_mvTermsPreuveOk', '_mvTermsDomaine', '_mvTermsOuvrir',
    '_mvTermsFillDomaine', '_mvTermsCheck', '_mvReceiptRender']),
  script: extraire('scripts/mv-signature-restaurer.cjs', ['histId', 'choisirParent']),
  // acceptTerms ENTIER, pour les assertions statiques : la ligne d'en-tête (options) + le corps.
  // ⚠️ bloc() depuis « onCall( » s'arrêtait à l'accolade des OPTIONS ({ region… }) : le premier passage
  //    a rougi sur un code juste — c'est le test qui ne lisait que l'en-tête.
  acceptTerms: sansCommentaires(AT ? AT.slice(0, AT.indexOf('\n')) + '\n' + (bloc(AT, 'async (request) => {') || '') : ''),
};
const V = (CODE.client.match(/_MVT_CGV = '([^']+)', _MVT_DPA = '([^']+)'/) || []).slice(1);
if (V.length !== 2) { console.log('\n  ✗ versions _MVT_CGV / _MVT_DPA illisibles\n'); process.exit(1); }
const [CGV, DPA] = V;

const preuve = (o = {}) => Object.assign({
  slug: 'domaine-x', accepted: true, ref: 'MV-2026-4821', ts_ms: Date.UTC(2026, 7, 12, 7, 30),
  signataire: { nom: 'Jeanne Martin', fonction: 'G\u00e9rante' }, email_at_signing: 'j@exemple.fr',
  client: { raison_sociale: 'SCEA X', siret: '12345678901234', adresse: '1 rue des Vignes', cp_ville: '21000 Dijon' },
  docs: { cgv: { version: CGV, hash: 'aa11' }, dpa: { version: DPA, hash: 'bb22' } },
}, o);

function monteServeur(code) { const c = { console }; vm.createContext(c); vm.runInContext(code, c); return c; }
function monteClient(code, o = {}) {
  const els = {
    ovTerms: { style: { display: 'none' } }, 'mvt-form': { style: { display: 'none' } },
    'mvt-done': { style: { display: 'block' } }, 'mvt-receipt': { style: { display: 'none' }, innerHTML: '' },
  };
  const lectures = [];
  const ctx = {
    console, lectures,
    document: { getElementById: (id) => els[id] || null },
    localStorage: { getItem: () => null, setItem: () => {} },
    currentUser: o.cu !== undefined ? o.cu : { nom: 'Paul', _firebaseUser: {} },
    isAdmin: () => o.admin !== false,
    _escHtml: (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _mvTermsFromToken: () => Promise.resolve(o.claim || null),
    _mvTermsClaim: () => o.claim || null,
    _mvTermsPrefill: () => { ctx.prefill = (ctx.prefill || 0) + 1; },
  };
  ctx.window = ctx;
  ctx.TENANT_ID = o.slug || 'domaine-x';
  ctx._mvPrepOn = () => !!o.prep;
  ctx._mvAvale = () => { ctx.avale = (ctx.avale || 0) + 1; };
  if (!o.sansLecteur) ctx.fbLirePreuveDomaine = () => {
    lectures.push(1);
    if (o.lectureRejette) return Promise.reject(new Error('lecture'));
    return Promise.resolve(o.preuve === undefined ? null : o.preuve);
  };
  if (o.cache) ctx._MV_TERMS_DOMAINE = o.cache;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, els };
}
const tic = () => new Promise((r) => setTimeout(r, 0));
async function porte(code, o) { const X = monteClient(code, o); X.ctx._mvTermsCheck(); await tic(); await tic(); await tic(); return X; }

async function suite(C) {
  const R = [];
  const t = async (libelle, f) => {
    try { const v = await f(); R.push([v === true, libelle, v === true ? '' : String(v)]); }
    catch (e) { R.push([false, libelle, 'plantage : ' + (e && e.message)]); }
  };
  // ── ① serveur ──
  const S = monteServeur(C.serveur);
  await t('première acceptation : elle devient la preuve du domaine', () => {
    const p = S.termsPlan(null, CGV, DPA); return p.remplacer === true && p.archiverAncienne === false || JSON.stringify(p); });
  await t('preuve du domaine à jour : GARDÉE, la nouvelle va à l’historique', () => {
    const p = S.termsPlan(preuve(), CGV, DPA); return p.remplacer === false && p.archiverAncienne === true || JSON.stringify(p); });
  await t('preuve de versions dépassées : remplacée, l’ancienne versée à l’historique', () => {
    const p = S.termsPlan(preuve({ docs: { cgv: { version: '0.9' }, dpa: { version: DPA } } }), CGV, DPA);
    return p.remplacer === true && p.archiverAncienne === true || JSON.stringify(p); });
  await t('preuve non acceptée : remplacée', () => S.termsPlan(preuve({ accepted: false }), CGV, DPA).remplacer === true || 'gardée');
  await t('historique : deux acceptations de même réf ne se confondent pas', () =>
    S.termsHistId({ ref: 'MV-2026-1234', ts_ms: 1 }) !== S.termsHistId({ ref: 'MV-2026-1234', ts_ms: 2 }) || 'même identifiant');
  await t('courriel GT : dit « inchangée » ou « remplace », avec la réf d’avant', () => {
    const a = S.termsLigneAvant(preuve(), { remplacer: false }), b = S.termsLigneAvant(preuve(), { remplacer: true });
    return a.includes('inchang\u00e9e') && a.includes('MV-2026-4821') && b.includes('Remplace') && b.includes('Jeanne Martin')
      && S.termsLigneAvant(null, { remplacer: true }) === '' || a + ' | ' + b; });
  await t('acceptTerms : plus de `set` direct sur la preuve du domaine', () =>
    !/db\.doc\('_mv_signatures\/' \+ slug\)\.set\(/.test(C.acceptTerms) || 'set direct présent');
  await t('acceptTerms : le parent ne s’écrit que si termsPlan le dit, en transaction', () =>
    C.acceptTerms.includes('if (plan.remplacer) tx.set(parent, proof);') && C.acceptTerms.includes('db.runTransaction(')
      && C.acceptTerms.includes("parent.collection('hist').doc(termsHistId(proof))") || 'garde absente');
  await t('acceptTerms : App Check toujours exigé', () => /enforceAppCheck: true/.test(C.acceptTerms) || 'absent');

  // ── ② porte ──
  let X;
  await t('claim à jour : porte fermée, aucune lecture', async () => {
    X = await porte(C.client, { claim: { c: CGV, d: DPA } });
    return X.els.ovTerms.style.display === 'none' && X.ctx.lectures.length === 0 || X.els.ovTerms.style.display + ' / ' + X.ctx.lectures.length; });
  await t('pas de claim, preuve du DOMAINE à jour : rien à signer (porte fermée, formulaire jamais montré)', async () => {
    X = await porte(C.client, { preuve: preuve() });
    return X.els.ovTerms.style.display === 'none' && !X.ctx.prefill && X.ctx.lectures.length === 1 || X.els.ovTerms.style.display + ' prefill=' + X.ctx.prefill; });
  await t('… l’exemplaire du domaine est prêt (signataire, réf, empreintes)', () => {
    const f = X.ctx._MV_TERMS_FILL || {};
    return f.sig_nom === 'Jeanne Martin' && f.ref === 'MV-2026-4821' && f.hashDpa === 'bb22' && f.signed === true || JSON.stringify(f); });
  await t('… le reçu dit « acceptées pour le domaine par » qui, et la réf', () => {
    const h = X.els['mvt-receipt'].innerHTML;
    return X.els['mvt-receipt'].style.display === 'block' && h.includes('pour le domaine par Jeanne Martin')
      && h.includes('G\u00e9rante') && h.includes('MV-2026-4821') || h.slice(0, 300); });
  await t('… et propose d’ouvrir l’exemplaire signé', () => X.els['mvt-receipt'].innerHTML.includes('_mvTermsOpenDoc') || 'pas de bouton');
  await t('pas de claim, pas de preuve : la porte s’ouvre (formulaire)', async () => {
    X = await porte(C.client, { preuve: null });
    return X.els.ovTerms.style.display === 'flex' && X.els['mvt-form'].style.display === 'block' || X.els.ovTerms.style.display; });
  await t('pas de claim, preuve de versions dépassées : la porte s’ouvre', async () => {
    X = await porte(C.client, { preuve: preuve({ docs: { cgv: { version: '0.9' }, dpa: { version: DPA } } }) });
    return X.els.ovTerms.style.display === 'flex' || X.els.ovTerms.style.display; });
  await t('pas de claim, preuve non acceptée : la porte s’ouvre', async () => {
    X = await porte(C.client, { preuve: preuve({ accepted: false }) });
    return X.els.ovTerms.style.display === 'flex' || X.els.ovTerms.style.display; });
  await t('lecture qui échoue (rejet) : la porte s’ouvre — fail-closed', async () => {
    X = await porte(C.client, { lectureRejette: true });
    return X.els.ovTerms.style.display === 'flex' && X.ctx.avale >= 1 || X.els.ovTerms.style.display; });
  await t('lecteur absent : la porte s’ouvre', async () => {
    X = await porte(C.client, { sansLecteur: true });
    return X.els.ovTerms.style.display === 'flex' || X.els.ovTerms.style.display; });
  await t('le cache ne sert pas la preuve d’un AUTRE domaine : relue', async () => {
    X = await porte(C.client, { cache: preuve({ slug: 'autre-domaine' }), preuve: null });
    return X.ctx.lectures.length === 1 && X.els.ovTerms.style.display === 'flex' || X.ctx.lectures.length + ' / ' + X.els.ovTerms.style.display; });
  await t('le cache de CE domaine évite une relecture', async () => {
    X = await porte(C.client, { cache: preuve() });
    return X.ctx.lectures.length === 0 && X.els.ovTerms.style.display === 'none' || X.ctx.lectures.length; });
  await t('GUERETTECH (mode préparation) : jamais de porte, aucune lecture', async () => {
    X = await porte(C.client, { prep: true, preuve: null });
    return X.els.ovTerms.style.display === 'none' && X.ctx.lectures.length === 0 || X.els.ovTerms.style.display; });
  await t('non admin : jamais de porte', async () => {
    X = await porte(C.client, { admin: false, preuve: null });
    return X.els.ovTerms.style.display === 'none' || X.els.ovTerms.style.display; });
  await t('reçu : le nom du signataire est échappé', async () => {
    X = await porte(C.client, { preuve: preuve({ signataire: { nom: '<img src=x onerror=alert(1)>', fonction: 'G' } }) });
    const h = X.els['mvt-receipt'].innerHTML; return !h.includes('<img') && h.includes('&lt;img') || h.slice(0, 200); });
  await t('reçu avec claim personnel : inchangé (pas de ligne « pour le domaine »)', async () => {
    X = monteClient(C.client, { claim: { c: CGV, d: DPA, r: 'MV-2026-7777', t: Date.UTC(2026, 6, 1) } }); X.ctx._mvReceiptRender();
    const h = X.els['mvt-receipt'].innerHTML; return h.includes('MV-2026-7777') && !h.includes('pour le domaine') || h.slice(0, 200); });

  // ── ③ restauration ──
  const Z = monteServeur(C.script);
  const vieille = preuve({ ref: 'MV-2026-1111', ts_ms: Date.UTC(2026, 6, 1) });
  const neuve = preuve({ ref: 'MV-2026-9999', ts_ms: Date.UTC(2026, 8, 19, 16, 5), signataire: { nom: 'Paul', fonction: 'Tractoriste' } });
  await t('restauration : la plus ancienne des mêmes versions redevient la preuve du domaine', () => Z.choisirParent(vieille, neuve) === vieille || 'neuve gardée');
  await t('restauration : versions différentes → la preuve actuelle reste', () =>
    Z.choisirParent(preuve({ ref: 'A', ts_ms: 1, docs: { cgv: { version: '0.9' }, dpa: { version: DPA } } }), neuve) === neuve || 'remplacée');
  await t('restauration : rien à reverser → la preuve actuelle reste', () => Z.choisirParent(null, neuve) === neuve || 'changée');
  await t('restauration : une ancienne non acceptée ne revient pas', () => Z.choisirParent(preuve({ accepted: false, ts_ms: 1 }), neuve) === neuve || 'revenue');
  await t('même identifiant d’historique que le serveur (sinon doublons)', () =>
    [vieille, { ref: 'MV-2026-1' }, {}].every((p) => Z.histId(p) === S.termsHistId(p)) || 'divergent');
  return R;
}

const DEFAUTS = [
  ['serveur', 'la preuve du domaine est remplacée à chaque acceptation', 'return { remplacer: !aJour,', 'return { remplacer: true,'],
  ['serveur', 'le test des versions disparaît', '&& cur.docs.cgv.version === cgv && cur.docs.dpa.version === dpa', ''],
  ['serveur', 'l’historique confond deux acceptations de même réf', " + '-' + String((p && p.ts_ms) || 0)", ''],
  ['acceptTerms', 'le parent s’écrit sans condition', 'if (plan.remplacer) tx.set(parent, proof);', 'tx.set(parent, proof);'],
  ['client', 'la porte ignore la preuve du domaine', "if(_mvTermsPreuveOk(p)){ ov.style.display='none'; _mvTermsFillDomaine(p); return; }", ''],
  ['client', 'une preuve de versions dépassées ferme la porte', '&& p.docs.cgv.version===_MVT_CGV && p.docs.dpa.version===_MVT_DPA', ''],
  ['client', 'le cache sert la preuve d’un autre domaine', 'c.slug===window.TENANT_ID', 'true'],
  ['client', 'une erreur laisse la porte fermée (fail-open)', "window._mvAvale(e,'app.js/_mvTermsCheck#2'); _mvTermsOuvrir(ov);", "window._mvAvale(e,'app.js/_mvTermsCheck#2');"],
  ['client', 'le nom du signataire n’est plus échappé', "_escHtml((dom.signataire&&dom.signataire.nom)||'?')", "((dom.signataire&&dom.signataire.nom)||'?')"],
  ['client', 'le reçu ne dit plus qui a signé pour le domaine', "+(dom?('<br>", "+(false?('<br>"],
  ['script', 'la restauration garde toujours la preuve actuelle', '(actuelle.ts_ms || 0)) return ancienne;', '(actuelle.ts_ms || 0)) return actuelle;'],
];

const vert = (s) => '\x1b[32m' + s + '\x1b[0m', rouge = (s) => '\x1b[31m' + s + '\x1b[0m';
if (!CONTRE) {
  console.log('\n  MA VIGNE — harnais SIGN-1 (le contrat est par domaine, §156)\n');
  const R = await suite(CODE);
  R.forEach(([ok, l, d]) => console.log('    ' + (ok ? vert('✓') : rouge('✗')) + ' ' + l + (ok ? '' : '  \x1b[2m→ ' + d + '\x1b[0m')));
  const ko = R.filter((r) => !r[0]).length;
  console.log('\n  ' + (ko ? rouge(ko + ' rouge(s)') : vert('tout vert')) + ' · ' + R.length + ' assertions\n');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n  MA VIGNE — harnais SIGN-1 — contre-épreuves\n');
  const base = (await suite(CODE)).filter((r) => !r[0]);
  if (base.length) { console.log('    ' + rouge('✗') + ' la suite n’est pas verte sur le code réel : ' + base.map((r) => r[1]).join(' · ')); process.exit(1); }
  let ko = 0;
  for (const [cible, nom, avant, apres] of DEFAUTS) {
    const n = CODE[cible].split(avant).length - 1;
    if (n !== 1) { ko++; console.log('    ' + rouge('✗') + ' ' + nom + ' — ancre trouvée ' + n + ' fois (attendu 1)'); continue; }
    const C = Object.assign({}, CODE, { [cible]: CODE[cible].replace(avant, apres) });
    const r = (await suite(C)).filter((x) => !x[0]);
    if (r.length) console.log('    ' + vert('✓') + ' ' + nom + ' — rougit (' + r.length + ')');
    else { ko++; console.log('    ' + rouge('✗') + ' ' + nom + ' — reste VERTE : la suite ne le voit pas'); }
  }
  console.log('\n  ' + (ko ? rouge(ko + ' contre-épreuve(s) en défaut') : vert('toutes rougissent')) + ' · ' + DEFAUTS.length + ' défauts\n');
  process.exit(ko ? 1 : 0);
}
