#!/usr/bin/env node
/**
 * mv-harnais-tiers.mjs — « SCRIPT ERROR. » N'EST PAS UNE ERREUR DE MA VIGNE (TIERS-1, §155).
 *
 * Signalé le 19/09/2026 depuis Admin GT › erreurs : « Script error. », niveau error, ni écran ni compte,
 * AUCUN détail technique. C'est le navigateur qui efface tout quand l'erreur naît dans un script d'une
 * AUTRE adresse chargé sans laissez-passer (règle « muted errors » du HTML) : message « Script error. »,
 * fichier vide, ligne 0, objet erreur nul. Le gestionnaire global en faisait un toast orange, en anglais,
 * que personne ne peut traiter — et le journal n'apprenait rien de plus.
 *
 * CE QUE CE HARNAIS GRAVE — sur le VRAI code, extrait d'app.js et JOUÉ (méthode C20) :
 *   ① l'erreur effacée ne fait plus de toast (info), elle n'avale pas une erreur ordinaire au même texte ;
 *   ② une seule entrée par session part au journal du domaine, 3 traces locales au plus, le reste compté ;
 *   ③ le contexte cite les scripts d'autres adresses — sans leur requête (clé reCAPTCHA), sans le code de
 *      Ma Vigne, sans doublon, 6 au plus — le navigateur, le mode d'ouverture, le délai, la version ;
 *   ④ une erreur de notre code arrive comme avant : erreur, fichier, ligne, pile.
 *
 *   node scripts/mv-harnais-tiers.mjs            les assertions
 *   node scripts/mv-harnais-tiers.mjs --contre   chaque défaut réinjecté dans une copie en mémoire DOIT
 *                                                faire rougir au moins une assertion (leçon §55)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const SRC = fs.readFileSync(path.join(RACINE, 'src/app.js'), 'utf8');

// ⚠️ Blanchir les lignes de commentaire avant de lire (piège §53) : une ancre de contre-épreuve trouvée
//    dans la prose qui explique le correctif prouverait le commentaire, pas l'instruction.
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
const ligne = (re) => { const m = SRC.match(re); return m ? m[0] : null; };

const MORCEAUX = {
  'var _MV_TIERS_MAX': ligne(/^var _MV_TIERS_MAX = \d+;/m),
  'var _MV_TIERS_LOC': ligne(/^var _MV_TIERS_LOC = \d+;/m),
  'var _mvTiersN': ligne(/^var _mvTiersN = 0;/m),
  '_mvErreurMasquee': bloc(SRC, 'function _mvErreurMasquee('),
  '_mvErreurTiersContexte': bloc(SRC, 'function _mvErreurTiersContexte('),
  '_mvErreurTiers': bloc(SRC, 'function _mvErreurTiers('),
  'gestionnaire global « error »': bloc(SRC, "window.addEventListener('error', function(e) {"),
};
const manquants = Object.keys(MORCEAUX).filter((k) => !MORCEAUX[k]);
if (manquants.length) {
  console.log('\n  ✗ introuvable dans src/app.js : ' + manquants.join(', ') + '\n');
  process.exit(1);
}
const CODE = sansCommentaires(Object.values(MORCEAUX).join('\n') + ');');

// ── Le décor : une page de mavigneapp.fr, un iPhone, App Check et une extension ─────────────────────
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) '
  + 'Version/18.6 Mobile/15E148 Safari/604.1';
const S1 = [
  { src: 'https://mavigneapp.fr/boot.js' },
  { src: 'https://mavigneapp.fr/assets/main-AbC123.js' },
  { src: '' },
  { src: 'https://www.google.com/recaptcha/api.js?render=6LcCLE' },
  { src: 'https://www.gstatic.com/recaptcha/releases/abc123/recaptcha__fr.js' },
  { src: 'chrome-extension://abcdefghijklmnop/inject.js' },
  { src: 'https://www.google.com/recaptcha/api.js?render=6LcCLE' },
];
const MUETTE = { message: 'Script error.', filename: '', lineno: 0, colno: 0, error: null };
const NOTRE = {
  message: "Uncaught TypeError: Cannot read properties of null (reading 'x')",
  filename: 'https://mavigneapp.fr/assets/main-AbC123.js', lineno: 2, colno: 1662033,
  error: { stack: "TypeError: Cannot read properties of null (reading 'x')\n    at f (https://mavigneapp.fr/assets/main-AbC123.js:2:1662033)" },
};

function monte(code, scripts, o = {}) {
  const logs = [], envois = [], h = {};
  const ctx = {
    console,
    document: { scripts, visibilityState: o.vis || 'visible' },
    location: { protocol: 'https:', host: 'mavigneapp.fr', href: 'https://mavigneapp.fr/' },
    navigator: { userAgent: o.ua || UA, standalone: o.standalone !== undefined ? o.standalone : true },
    logError: (x) => { const e = Object.assign({ id: 'e' + (logs.length + 1) }, x); logs.push(e); return e; },
  };
  ctx.window = ctx;
  ctx.addEventListener = (t, f) => { h[t] = f; };
  ctx.fbAppendError = (e) => { envois.push(e); return Promise.resolve(); };
  ctx.APP_VERSION = '7.44';
  ctx.matchMedia = () => ({ matches: false });
  ctx.performance = { now: () => 12400 };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'app.js (extrait)' });
  return { ctx, logs, envois, err: (ev) => h.error(Object.assign({}, ev)) };
}

// ── La suite : [ok, libellé, détail] ; un plantage compte ROUGE ─────────────────────────────────────
function suite(code) {
  const R = [];
  const t = (libelle, f) => {
    try { const v = f(); R.push([v === true, libelle, v === true ? '' : String(v)]); }
    catch (e) { R.push([false, libelle, 'plantage : ' + (e && e.message)]); }
  };
  let A;
  t('« Script error. » : trace en info — aucun toast (error/warning/critical en font un)', () => {
    A = monte(code, S1); A.err(MUETTE);
    return A.logs.length === 1 && A.logs[0].level === 'info' || JSON.stringify(A.logs.map((l) => l.level));
  });
  t('catégorie « tiers », message qui commence par « Script error. »', () =>
    A.logs[0].cat === 'tiers' && A.logs[0].msg.indexOf('Script error.') === 0 || A.logs[0].cat + ' | ' + A.logs[0].msg);
  const D = () => A.logs[0].detail;
  t('les scripts d’autres adresses sont cités (reCAPTCHA, gstatic, extension)', () =>
    ['https://www.google.com/recaptcha/api.js', 'https://www.gstatic.com/recaptcha/releases/abc123/recaptcha__fr.js',
      'chrome-extension://abcdefghijklmnop/inject.js'].every((u) => D().includes(u)) || D());
  t('le code de Ma Vigne n’est pas cité (même adresse)', () => !D().includes('mavigneapp.fr') || D());
  t('la requête ne sort pas : pas de clé reCAPTCHA dans le journal', () => !/render=|6LcCLE/.test(D()) || D());
  t('une adresse présente deux fois n’est citée qu’une fois', () =>
    D().split('recaptcha/api.js').length - 1 === 1 || D());
  t('navigateur et mode d’ouverture (appli installée)', () =>
    D().includes('iPhone OS 18_6') && D().includes('ouverture : appli install\u00e9e') || D());
  t('délai depuis l’ouverture, onglet, version, rang dans la session', () =>
    ['depuis 12 s', 'onglet visible', 'Ma Vigne 7.44', '1re fois dans cette session'].every((x) => D().includes(x)) || D());
  t('la première part au journal du domaine, telle quelle', () =>
    A.envois.length === 1 && A.envois[0] === A.logs[0] || A.envois.length);
  t('le compteur de session vaut 1', () => A.ctx._mvErrTiersN === 1 || A.ctx._mvErrTiersN);
  t('cinq de suite : 3 traces locales au plus', () => {
    for (let i = 0; i < 4; i++) A.err(MUETTE);
    return A.logs.length === 3 || A.logs.length;
  });
  t('cinq de suite : UNE entrée au journal du domaine', () => A.envois.length === 1 || A.envois.length);
  t('cinq de suite : le reste est compté (window._mvErrTiersN = 5)', () => A.ctx._mvErrTiersN === 5 || A.ctx._mvErrTiersN);
  t('la deuxième trace dit « 2e fois »', () => A.logs[1].detail.includes('2e fois dans cette session') || A.logs[1].detail);

  let B;
  t('une erreur de NOTRE code reste une erreur (toast), message intact', () => {
    B = monte(code, S1); B.err(NOTRE);
    return B.logs.length === 1 && B.logs[0].level === 'error' && B.logs[0].cat === 'runtime'
      && B.logs[0].msg === NOTRE.message || JSON.stringify(B.logs[0]);
  });
  t('… avec fichier, ligne et pile dans le détail, comme avant', () =>
    B.logs[0].detail.indexOf('https://mavigneapp.fr/assets/main-AbC123.js:2') === 0
      && B.logs[0].detail.includes('at f (') || B.logs[0].detail);
  t('… et le gestionnaire n’écrit rien lui-même au domaine (logError s’en charge)', () => B.envois.length === 0 || B.envois.length);

  const niveau = (ev, o) => { const X = monte(code, S1, o); X.err(ev); return X.logs[0] || {}; };
  // ⚠️ Ligne 0 EXPRÈS : avec une ligne, la condition sur la ligne suffisait à la rattraper et la
  //    contre-épreuve « sans la condition sur le fichier » restait verte — c'est le test qui était faux.
  t('même texte AVEC un fichier (ligne 0) : pas effacée → erreur ordinaire', () =>
    niveau({ message: 'Script error.', filename: 'https://mavigneapp.fr/assets/main-AbC123.js', lineno: 0, error: null }).level === 'error' || 'avalée');
  t('même texte AVEC une ligne (fichier vide) : erreur ordinaire', () =>
    niveau({ message: 'Script error.', filename: '', lineno: 7, error: null }).level === 'error' || 'avalée');
  t('même texte AVEC un objet erreur : erreur ordinaire', () =>
    niveau({ message: 'Script error.', filename: '', lineno: 0, error: new Error('Script error.') }).level === 'error' || 'avalée');
  t('message vide, rien d’autre : comportement d’avant (« Erreur JS non gérée », erreur)', () => {
    const l = niveau({ message: '', filename: '', lineno: 0, error: null });
    return l.level === 'error' && l.msg === 'Erreur JS non g\u00e9r\u00e9e' || JSON.stringify(l);
  });
  t('variante « Script error » sans point, casse libre : reconnue', () =>
    niveau({ message: '  script error ', filename: '', lineno: 0, error: null }).level === 'info' || 'non reconnue');
  t('ouverte dans le navigateur : dit « dans le navigateur »', () =>
    niveau(MUETTE, { standalone: false }).detail.includes('ouverture : dans le navigateur') || 'absent');

  t('9 adresses tierces : 6 citées, « (+3) »', () => {
    const X = monte(code, Array.from({ length: 9 }, (_, i) => ({ src: 'https://cdn' + i + '.exemple.net/x' + i + '.js' })));
    X.err(MUETTE); const d = X.logs[0].detail;
    return d.includes('cdn5.exemple.net') && !d.includes('cdn6.exemple.net') && d.includes('(+3)') || d;
  });
  t('aucun script tiers : « aucun »', () => {
    const X = monte(code, S1.slice(0, 3)); X.err(MUETTE);
    return X.logs[0].detail.includes('autres adresses : aucun') || X.logs[0].detail;
  });
  t('détail borné (adresses longues, navigateur long) : moins de 1 200 caractères', () => {
    const X = monte(code, Array.from({ length: 8 }, (_, i) => ({ src: 'https://t' + i + '.exemple.net/' + 'a'.repeat(300) + '.js' })), { ua: 'U'.repeat(900) });
    X.err(MUETTE); return X.logs[0].detail.length < 1200 || X.logs[0].detail.length;
  });
  return R;
}

// ── Les défauts à réinjecter : chacun DOIT faire rougir la suite ─────────────────────────────────────
const DEFAUTS = [
  ['le gestionnaire ne reconnaît plus l’erreur effacée', 'if(_mvErreurMasquee(e)) { _mvErreurTiers(); return; }', ''],
  ['la trace redevient une erreur (toast)', "level: 'info', cat: 'tiers'", "level: 'error', cat: 'tiers'"],
  ['chaque occurrence part au journal du domaine', '_mvTiersN === 1 && ent', '_mvTiersN >= 1 && ent'],
  ['plus de borne aux traces locales', 'if (_mvTiersN > _MV_TIERS_LOC) return;', ''],
  ['la requête des adresses sort (clé reCAPTCHA)', '([^?#]*)/i.exec', '(.*)/i.exec'],
  ['le code de Ma Vigne est compté comme tiers', '=== ici) continue;', "=== '-') continue;"],
  ['une adresse en double est citée deux fois', 'if (tiers.indexOf(k) >= 0) continue;', ''],
  ['la liste n’est plus bornée', 'if (tiers.length < _MV_TIERS_MAX) tiers.push(k); else reste++;', 'tiers.push(k);'],
  ['un texte identique AVEC fichier est avalé', '!e.error && !e.filename && !e.lineno', '!e.error && !e.lineno'],
  ['un texte identique AVEC objet erreur est avalé', '!!e && !e.error && ', '!!e && '],
  ['un texte identique AVEC une ligne est avalé', '!e.filename && !e.lineno', '!e.filename'],
];

const vert = (s) => '\x1b[32m' + s + '\x1b[0m', rouge = (s) => '\x1b[31m' + s + '\x1b[0m';
if (!CONTRE) {
  console.log('\n  MA VIGNE — harnais TIERS-1 (« Script error. », §155)\n');
  const R = suite(CODE);
  R.forEach(([ok, l, d]) => console.log('    ' + (ok ? vert('✓') : rouge('✗')) + ' ' + l + (ok ? '' : '  \x1b[2m→ ' + d + '\x1b[0m')));
  const ko = R.filter((r) => !r[0]).length;
  console.log('\n  ' + (ko ? rouge(ko + ' rouge(s)') : vert('tout vert')) + ' · ' + R.length + ' assertions\n');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n  MA VIGNE — harnais TIERS-1 — contre-épreuves\n');
  const base = suite(CODE).filter((r) => !r[0]);
  if (base.length) { console.log('    ' + rouge('✗') + ' la suite n’est pas verte sur le code réel : ' + base.map((r) => r[1]).join(' · ')); process.exit(1); }
  let ko = 0;
  DEFAUTS.forEach(([nom, avant, apres]) => {
    const n = CODE.split(avant).length - 1;
    if (n !== 1) { ko++; console.log('    ' + rouge('✗') + ' ' + nom + ' — ancre trouvée ' + n + ' fois (attendu 1)'); return; }
    const r = suite(CODE.replace(avant, apres)).filter((x) => !x[0]);
    if (r.length) console.log('    ' + vert('✓') + ' ' + nom + ' — rougit (' + r.length + ')');
    else { ko++; console.log('    ' + rouge('✗') + ' ' + nom + ' — reste VERTE : la suite ne le voit pas'); }
  });
  console.log('\n  ' + (ko ? rouge(ko + ' contre-épreuve(s) en défaut') : vert('toutes rougissent')) + ' · ' + DEFAUTS.length + ' défauts\n');
  process.exit(ko ? 1 : 0);
}
