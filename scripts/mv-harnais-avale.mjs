/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — L'ERREUR AVALÉE A UN NOM (lot AVALE-1)
   Lancer : node scripts/mv-harnais-avale.mjs
            node scripts/mv-harnais-avale.mjs --contre

   ══ POURQUOI ══
   223 `catch{}` vides, dont 152 dans app.js. Le preflight les comptait depuis
   des mois (C14) en disant lui-même ce que ça coûte : « c'est le motif qui a
   permis au bug `.window.currentUser` de survivre des mois et aux refus de
   lecture d'être invisibles ». Le compteur descendait d'un cran de temps en
   temps. Il ne descendait pas.

   ══ CE QU'IL TIENT ══
     A. La PREMIÈRE trace d'un emplacement est en `info` — et `info` n'est PAS
        dans `_ERR_SEND_LVL`, donc un hoquet isolé ne part pas vers Firestore.
        Passer ce niveau à `warning` un jour de fatigue enverrait 200 points
        d'appel dans le journal du domaine de chaque client. L'assertion tient
        les deux bouts : le niveau ici, et la liste d'envoi là-bas.
        ★ AVALE-2 (§212) : à partir de la 10e occurrence, `warning` — c'est
        voulu, une panne répétée doit remonter. Mais TOUJOURS `silencieux:true`,
        et `logError` doit honorer ce drapeau : sans lui, un toast jaune
        « erreur avalée dans app.js/… » s'afficherait chez le vigneron. La
        section F EXÉCUTE le vrai `logError` pour le prouver.
     B. Des traces aux seuls PALIERS 1, 10, 100, 1000. `logError` relit et
        réécrit tout le journal localStorage à chaque appel : sans le garde-fou,
        un `catch` dans une boucle de rendu coûterait plus cher que le défaut
        qu'il signale.
     C. ★ CHAQUE APPEL PORTE UN CONTEXTE LITTÉRAL, ET DEUX EMPLACEMENTS NE
        PARTAGENT JAMAIS LE MÊME. C'est tout l'intérêt : la clé est aussi la clé
        de déduplication, donc deux sites homonymes s'effaceraient l'un l'autre
        — le second ne serait jamais journalisé, et personne ne le saurait.
     D. Pas de récursion : `_mvAvale` ne s'appelle pas depuis `logError`.

   ⚠️ §25.2 : injections EN MÉMOIRE, avec garde. Deux d'entre elles AJOUTENT du
      code plutôt que de s'ancrer sur un littéral (§127e, §131d).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');

const FICHIERS = fs.readdirSync(path.join(RACINE, 'src'))
  .filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f);
let SRC = {};
for (const f of FICHIERS) SRC[f] = fs.readFileSync(path.join(RACINE, f), 'utf8');

const INJECTIONS = [
  { nom: 'la première trace passe de info à warning',
    f: 'src/utils.js', de: "level: n >= 10 ? 'warning' : 'info'", vers: "level: 'warning'" },
  { nom: 'le garde-fou des paliers retiré',
    f: 'src/utils.js', de: '  if (!_MV_AVALE_PALIERS[n]) return;', vers: '' },
  { nom: 'le drapeau silencieux retiré de _mvAvale',
    f: 'src/utils.js', de: "silencieux: true, cat: 'avale'", vers: "cat: 'avale'" },
  { nom: 'logError ignore le drapeau silencieux',
    f: 'src/utils.js', de: '  if(opts.silencieux) {', vers: '  if(false) {' },
  { nom: 'un appel sans contexte, ajouté',
    f: 'src/app.js', ajout: '\nfunction _mvInjAvale1(){ try{ null(); }catch(e){ if(window._mvAvale) window._mvAvale(e); } }\n' },
  { nom: 'deux emplacements qui se partagent une clé, ajoutés',
    f: 'src/app.js', ajout: "\nfunction _mvInjAvale2(){ try{ null(); }catch(e){ window._mvAvale(e,'app.js/_mvInjDup'); }\n"
      + "  try{ null(); }catch(e){ window._mvAvale(e,'app.js/_mvInjDup'); } }\n" },
];
let injectes = 0;
if (CONTRE) {
  for (const inj of INJECTIONS) {
    if (inj.ajout) { SRC[inj.f] += inj.ajout; injectes++; continue; }
    if (!SRC[inj.f].includes(inj.de)) {
      console.error('  \x1b[31m!! INJECTION MORTE\x1b[0m — ' + inj.nom + '\n     motif : ' + inj.de);
      continue;
    }
    SRC[inj.f] = SRC[inj.f].replace(inj.de, inj.vers);
    injectes++;
  }
  if (injectes !== INJECTIONS.length) {
    console.error('\n  \x1b[31m✗ GARDE D\'INJECTION : ' + injectes + '/' + INJECTIONS.length
      + ' défauts appliqués — la contre-épreuve ne prouve rien.\x1b[0m\n');
    process.exit(1);
  }
}

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};
const U = SRC['src/utils.js'];

console.log('\n── L\'ERREUR AVALÉE A UN NOM — lot AVALE-1\n');

/* A. le niveau, des deux côtés */
const corpsAvale = (() => {
  const i = U.indexOf('export function _mvAvale');
  if (i < 0) return '';
  let d = 0, j = U.indexOf('{', i);
  for (let x = j; x < U.length; x++) {
    if (U[x] === '{') d++;
    else if (U[x] === '}') { d--; if (!d) return U.slice(i, x + 1); }
  }
  return '';
})();
t('_mvAvale existe et est exposé', corpsAvale.length > 0 && /window\._mvAvale\s*=\s*_mvAvale/.test(U));
t("_mvAvale : 'info' sous 10 occurrences, 'warning' seulement à partir de 10",
  /level:\s*n\s*>=\s*10\s*\?\s*'warning'\s*:\s*'info'/.test(corpsAvale),
  "un 'warning' dès la 1re fois ferait remonter 200 points d'appel dans le journal du domaine");
t("_mvAvale pose toujours silencieux:true", /silencieux:\s*true/.test(corpsAvale),
  "sans lui, un toast « erreur avalée dans … » s'afficherait chez le client");
const lvl = U.match(/_ERR_SEND_LVL\s*=\s*\{([^}]*)\}/);
t("'info' reste hors de _ERR_SEND_LVL (rien ne part vers Firestore)",
  !!lvl && !/\binfo\b/.test(lvl[1]),
  'les deux bouts doivent tenir : le niveau ici, la liste d\'envoi là-bas');

/* B. la déduplication */
t('des traces aux seuls paliers (1, 10, 100, 1000)',
  /_MV_AVALEES\[k\]\s*=\s*\(_MV_AVALEES\[k\]\s*\|\|\s*0\)\s*\+\s*1/.test(corpsAvale)
  && /if\s*\(!_MV_AVALE_PALIERS\[n\]\)\s*return;/.test(corpsAvale)
  && /_MV_AVALE_PALIERS\s*=\s*\{\s*1:\s*1,\s*10:\s*1,\s*100:\s*1,\s*1000:\s*1\s*\}/.test(U),
  'logError réécrit tout le journal localStorage à chaque appel');
t('le compteur reste lisible (window._mvAvalees)', /window\._mvAvalees\s*=\s*_MV_AVALEES/.test(U));

/* C. contexte littéral, et unique */
const RX_APPEL = /_mvAvale\s*\(\s*([A-Za-z_$][\w$]*)\s*(?:,\s*('([^']*)')\s*)?\)/g;
let sansCtx = [], cles = new Map(), total = 0;
for (const f of FICHIERS) {
  RX_APPEL.lastIndex = 0;
  let m;
  while ((m = RX_APPEL.exec(SRC[f]))) {
    /* la définition elle-même n'est pas un appel */
    if (/function\s+_mvAvale/.test(SRC[f].slice(Math.max(0, m.index - 40), m.index))) continue;
    total++;
    if (!m[3]) { sansCtx.push(f + ' (' + m[1] + ')'); continue; }
    cles.set(m[3], (cles.get(m[3]) || 0) + 1);
  }
}
t('les ' + total + ' appels portent tous un contexte littéral',
  sansCtx.length === 0, sansCtx.slice(0, 5).join(' · '));
const doublons = [...cles.entries()].filter(([, n]) => n > 1).map(([k, n]) => k + ' ×' + n);
t('aucun contexte n\'est partagé par deux emplacements (' + cles.size + ' clés)',
  doublons.length === 0,
  doublons.slice(0, 6).join(' · ') + '\n        la clé sert AUSSI à dédupliquer : deux homonymes et le second ne se journalise jamais');

/* D. pas de récursion */
const corpsLog = (() => {
  const i = U.indexOf('export function logError');
  if (i < 0) return '';
  let d = 0, j = U.indexOf('{', i);
  for (let x = j; x < U.length; x++) {
    if (U[x] === '{') d++;
    else if (U[x] === '}') { d--; if (!d) return U.slice(i, x + 1); }
  }
  return '';
})();
t('logError n\'appelle pas _mvAvale (pas de boucle)', !/_mvAvale/.test(corpsLog));

/* E. EXÉCUTION — on lance vraiment le helper extrait du vrai utils.js */
const banc = `
let appels = [];
function logError(o){ appels.push(o); }
${corpsAvale.replace('export function', 'function')}
export { _mvAvale, appels, _MV_AVALEES };
var _MV_AVALEES = {};
`;
let M = null;
try {
  M = await import('data:text/javascript;base64,' + Buffer.from(
    'var _MV_AVALEES = {};\nvar _MV_AVALE_PALIERS = { 1: 1, 10: 1, 100: 1, 1000: 1 };\nlet appels = [];\nfunction logError(o){ appels.push(o); }\n'
    + corpsAvale.replace('export function', 'function')
    + '\nexport { _mvAvale, appels, _MV_AVALEES };\n', 'utf8').toString('base64'));
} catch (e) {
  console.log('  \x1b[31m✗\x1b[0m le helper ne se monte pas\n      → ' + e.message);
  ko++;
}
if (M) {
  M._mvAvale(new Error('boum'), 'x.js/f');
  M._mvAvale(new Error('boum'), 'x.js/f');
  M._mvAvale(new Error('boum'), 'x.js/g');
  t('exécuté : trois avalements, deux traces (le doublon est tu)', M.appels.length === 2,
    'traces : ' + M.appels.length);
  t('exécuté : le compteur, lui, voit les trois', M._MV_AVALEES['x.js/f'] === 2 && M._MV_AVALEES['x.js/g'] === 1,
    JSON.stringify(M._MV_AVALEES));
  t('exécuté : la trace nomme l\'emplacement et garde le détail',
    /x\.js\/f/.test(M.appels[0].msg) && /boum/.test(M.appels[0].detail) && M.appels[0].cat === 'avale');
  M._mvAvale(undefined, 'x.js/h');
  t('exécuté : un avalement sans objet d\'erreur ne casse rien', M.appels.length === 3);
  t('exécuté : la 1re trace est en info et silencieuse',
    M.appels[0].level === 'info' && M.appels[0].silencieux === true, JSON.stringify(M.appels[0]));
  /* une panne répétée : 1000 fois le même emplacement */
  M.appels.length = 0;
  for (let i = 0; i < 1000; i++) M._mvAvale(new Error('panne'), 'x.js/p');
  const niv = M.appels.map(a => a.level).join(',');
  t('exécuté : 1000 avalements, 4 traces (paliers 1/10/100/1000)', M.appels.length === 4,
    'traces : ' + M.appels.length);
  t('exécuté : info, puis warning dès la 10e', niv === 'info,warning,warning,warning', niv);
  t('exécuté : le message dit la récurrence (×10, ×100, ×1000)',
    /×10 /.test(M.appels[1].msg) && /×100 /.test(M.appels[2].msg) && /×1000 /.test(M.appels[3].msg),
    M.appels.map(a => a.msg).join(' | '));
  t('exécuté : toutes silencieuses', M.appels.every(a => a.silencieux === true));
  t('exécuté : le compteur voit les 1000', M._MV_AVALEES['x.js/p'] === 1000);
}

/* F. EXÉCUTION DE logError — le drapeau silencieux est-il vraiment honoré ?
      Un warning ordinaire peint un toast ; un warning silencieux ne doit rien
      peindre mais doit PARTIR vers le journal du domaine (fbAppendError). */
const corpsSend = (() => {
  const i = U.indexOf('function _errShouldSend');
  if (i < 0) return '';
  let d = 0, j = U.indexOf('{', i);
  for (let x = j; x < U.length; x++) {
    if (U[x] === '{') d++;
    else if (U[x] === '}') { d--; if (!d) return U.slice(i, x + 1); }
  }
  return '';
})();
const lvlDecl = (U.match(/var _ERR_SEND_LVL\s*=\s*\{[^}]*\};/) || [''])[0];
let L = null;
try {
  L = await import('data:text/javascript;base64,' + Buffer.from(
    'var toasts = [], envois = [], overlays = [];\n'
    + 'var _mem = {};\n'
    + 'globalThis.localStorage = { getItem(k){ return _mem[k] || null; }, setItem(k,v){ _mem[k] = v; } };\n'
    + 'globalThis.window = { fbAppendError(e){ envois.push(e); } };\n'
    + "var _ERR_KEY = 'k', _ERR_MAX = 50, _ERR_SENT = {}, _ERR_SENT_N = 0, _ERR_SENT_MAX = 50, _ERR_DEDUP_MS = 60000;\n"
    + lvlDecl + '\n'
    + 'var _mvSuppressToastCapture = false;\n'
    + "function _errCurrentPage(){ return 'p'; }\n"
    + 'function showToast(m){ toasts.push(m); }\n'
    + 'function _showCriticalOverlay(e){ overlays.push(e); }\n'
    + corpsSend + '\n'
    + corpsLog.replace('export function', 'function')
    + '\nexport { logError, toasts, envois };\n', 'utf8').toString('base64'));
} catch (e) {
  console.log('  \x1b[31m✗\x1b[0m logError ne se monte pas\n      → ' + e.message);
  ko++;
}
if (L) {
  L.logError({ level: 'warning', silencieux: true, cat: 'avale', msg: 'erreur avalée dans x.js/p (×10 cette session)' });
  t('exécuté : un warning silencieux ne peint aucun toast', L.toasts.length === 0, 'toasts : ' + JSON.stringify(L.toasts));
  t('exécuté : un warning silencieux part bien vers le journal du domaine', L.envois.length === 1,
    'envois : ' + L.envois.length);
  L.logError({ level: 'info', silencieux: true, cat: 'avale', msg: 'erreur avalée dans x.js/q' });
  t('exécuté : une info ne part pas vers le journal du domaine', L.envois.length === 1);
  const avantTemoin = L.toasts.length;
  L.logError({ level: 'warning', cat: 'sync', msg: 'témoin' });
  t('exécuté : témoin — un warning ordinaire peint toujours son toast', L.toasts.length === avantTemoin + 1,
    'toasts : ' + JSON.stringify(L.toasts));
}

console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges'
  + (CONTRE ? '  (contre-épreuve : ' + injectes + '/' + INJECTIONS.length + ' défauts injectés)' : '') + '\n');

if (CONTRE) {
  if (ko === 0) {
    console.error('  \x1b[31m✗ CONTRE-ÉPREUVE : tout est vert avec ' + injectes
      + ' défauts en place — le harnais ne mord pas.\x1b[0m\n');
    process.exit(1);
  }
  console.log('  \x1b[32m✓ contre-épreuve : ' + ko + ' assertions rougissent sur '
    + injectes + ' défauts.\x1b[0m\n');
  process.exit(0);
}
process.exit(ko ? 1 : 0);
