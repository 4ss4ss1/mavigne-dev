#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — TUTO-1 : LES TUTOS GUIDÉS NE PEUVENT NI MENTIR NI FUIR (§358)
   Lancer : node scripts/mv-harnais-tutos.mjs          (+ --contre)

   ══ POURQUOI ══
   Un tuto se joue sur les vrais écrans avec un domaine fictif. Deux façons de mal
   tourner : qu'une écriture de l'entraînement parte vers le serveur (le client a le
   droit d'écrire chez lui), ou qu'un tuto vise un bouton qui n'existe plus (l'appli
   change presque chaque jour). Ce harnais tient la partie qui se lit dans le code ;
   scripts/mv-tutos-jeu.mjs rejoue chaque tuto dans Chromium sur le build.

   ══ CE QU'IL TIENT ══
     A. La porte de firebase.js : chaque fonction du SDK qui parle au serveur est
        importée sous un nom _sdk*, appelée UNE seule fois (dans sa garde), et sa
        garde commence par _mvTutoPorte. _fbLoad et _fbLoadAfterAuth ne chargent rien
        pendant un entraînement ; fbSave ne tente rien.
     B. Aucun autre fichier de l'appli n'importe ces fonctions du SDK.
     C. boot.js : la mémoire jetable est posée et VÉRIFIÉE avant que __MV_TUTO existe.
     D. app.js : tutos.js est importé, et l'entraînement passe AVANT _fbLoad.
     E. tutos.js : chaque étiquette data-tuto visée existe dans l'appli ; chaque attribut
        visé existe ; chaque fonction de `couvre` existe ; chaque personne visée est dans
        le domaine fictif.
     G. TUTO-2 (§359) : le cache Firestore de l'entraînement reste en mémoire ; la CSP laisse l'appli
        s'afficher dans un cadre d'elle-même (frame-src 'self') ; chaque titre de tuto est une question.
     F. Le compte des gestes sans tuto (fonctions lancées par un clic, un choix ou une
        saisie, moins celles qu'un tuto couvre, moins les exemptés motivés) ne monte
        jamais : scripts/tutos-couverture.json. Il descend à chaque tuto ajouté.
   ⚠️ CHEMINS : fileURLToPath.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m` };

const PORTE = ['getDoc', 'getDocFromServer', 'getDocFromCache', 'getDocs', 'onSnapshot', 'setDoc', 'runTransaction',
  'uploadBytesResumable', 'deleteObject', 'httpsCallable', 'signInWithEmailAndPassword', 'signOut',
  'sendPasswordResetEmail', 'updatePassword', 'reauthenticateWithCredential', 'createUserWithEmailAndPassword'];
// Fichiers de l'appli des clients (gt.js / admin-gt.js : la console GUERETTECH, autre page, hors entraînement).
const HORS_APPLI = new Set(['src/admin-gt.js', 'src/gt.js', 'src/tutos.js']);
const GENERIQUES = new Set(['$', 'if', 'return', 'event.stopPropagation', 'event.preventDefault', 'closeOv', '_openOv', 'openOv',
  'closeModal', 'history.back', 'this.select', 'this.blur', 'location.reload']);

function charger() {
  const F = {};
  const src = fs.readdirSync(path.join(RACINE, 'src')).filter((f) => f.endsWith('.js')).map((f) => 'src/' + f);
  for (const f of src.concat(['index.html', 'public/boot.js', 'scripts/tutos-couverture.json', 'firebase.json'])) F[f] = lire(f);
  return F;
}
// Les attributs du moteur lui-même (boutons de la consigne, de la fin, de l'aide) ne visent pas l'appli.
const MOTEUR = new Set(['data-tuto', 'data-c', 'data-f', 'data-tu']);

function verifie(F) {
  const L = []; let ko = 0;
  const t = (lib, ok) => { L.push((ok ? c.g('  ✓ ') : c.r('  ✗ ')) + lib); if (!ok) ko++; };
  // A. la porte
  const fb = F['src/firebase.js'];
  for (const n of PORTE) {
    const imp = new RegExp('\\b' + n + ' as _sdk' + n[0].toUpperCase() + n.slice(1) + '\\b').test(fb);
    const sdk = '_sdk' + n[0].toUpperCase() + n.slice(1);
    const garde = new RegExp('function ' + n + '\\(\\) \\{ if \\(_mvTutoPorte\\(').test(fb);
    const fois = (fb.match(new RegExp('\\b' + sdk + '\\b', 'g')) || []).length;
    t('A · ' + n + ' passe par la porte (importé en ' + sdk + ', appelé une fois, gardé)', imp && fois === 2 && garde);
  }
  t('A · _fbLoad ne charge rien pendant un entraînement', /window\._fbLoad = async function \(\) \{\n {2}if \(typeof window !== 'undefined' && window\.__MV_TUTO\) return;/.test(fb));
  t('A · _fbLoadAfterAuth non plus', /window\._fbLoadAfterAuth = async function \(\) \{\n {2}if \(typeof window !== 'undefined' && window\.__MV_TUTO\) return;/.test(fb));
  t('A · fbSave ne tente rien pendant un entraînement', fb.includes("if (TENANT_ID === 'domaine-dupont' || (typeof window !== 'undefined' && window.__MV_TUTO)) {"));
  // B. personne d'autre n'importe le SDK serveur
  const fuites = [];
  for (const [f, s] of Object.entries(F)) {
    if (!f.startsWith('src/') || f === 'src/firebase.js' || HORS_APPLI.has(f)) continue;
    for (const m of s.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]firebase\/[a-z-]+['"]/g)) {
      for (const n of PORTE) if (new RegExp('\\b' + n + '\\b').test(m[1])) fuites.push(f + ' : ' + n);
    }
  }
  t('B · aucun autre fichier n\u2019importe le SDK serveur' + (fuites.length ? ' (' + fuites.join(', ') + ')' : ''), fuites.length === 0);
  // C. boot.js
  const bt = F['public/boot.js'];
  const iVerif = bt.indexOf('if (!pose || window.localStorage !== JL || window.sessionStorage !== JS) {'), iPose = bt.indexOf('window.__MV_TUTO = m[1].toLowerCase();');
  t('C · boot.js remplace la mémoire du téléphone ET la mémoire de session', bt.includes("Object.defineProperty(window, 'localStorage'") && bt.includes("Object.defineProperty(window, 'sessionStorage'") && bt.includes("depart = { mavigne_tenant: 'domaine-dupont' }"));
  t('C · __MV_TUTO n\u2019existe qu\u2019APRÈS la vérification des deux mémoires jetables', iVerif > 0 && iPose > iVerif);
  t('C · le drapeau d\u2019entraînement ne s\u2019écrit jamais en mémoire de session (partagée avec le panneau)', !/sessionStorage\.setItem\(\s*['"]mavigne_tuto['"]/.test(bt + F['src/tutos.js']));
  // D. app.js
  const ap = F['src/app.js'];
  const iTu = ap.indexOf('if(window.__MV_TUTO && _mvTutoEntrer())'), iFb = ap.indexOf('window._fbLoad().catch(');
  t('D · app.js importe tutos.js', /import '\.\/tutos\.js';/.test(ap));
  t('D · l\u2019entraînement passe avant le chargement du domaine', iTu > 0 && iFb > iTu);
  // E. tutos.js
  const tu = F['src/tutos.js'];
  const autres = Object.entries(F).filter(([f]) => f !== 'src/tutos.js' && (f.startsWith('src/') || f === 'index.html')).map(([, s]) => s).join('\n');
  const etiquettes = [...new Set([...tu.matchAll(/\[data-tuto="([a-z0-9.-]+)"\]/g)].map((m) => m[1]))];
  t('E · le moteur vise au moins une étiquette', etiquettes.length > 0);
  for (const e of etiquettes) t('E · étiquette « ' + e + ' » présente dans l\u2019appli', autres.includes('data-tuto="' + e + '"') || autres.includes('data-tuto=\\"' + e + '\\"'));
  const attrs = [...new Set([...tu.matchAll(/\[(data-[a-z-]+)="[^"]*"\]/g)].map((m) => m[1]).filter((a) => !MOTEUR.has(a)))];
  for (const a of attrs) t('E · attribut « ' + a + ' » présent dans l\u2019appli', autres.includes(a + '="') || autres.includes(a + '=\\"'));
  const couvre = [...new Set([...tu.matchAll(/couvre:\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([A-Za-z_$][\w$]*)'/g)].map((x) => x[1])))];
  t('E · chaque tuto déclare ce qu\u2019il couvre', couvre.length > 0);
  for (const n of couvre) t('E · fonction enseignée « ' + n + ' » présente', new RegExp('function ' + n.replace('$', '\\$') + '\\s*\\(|window\\.' + n.replace('$', '\\$') + '\\s*=').test(autres));
  const dm = /var TU_DONNEES = (\{.*\});/.exec(tu);
  let membres = [];
  try { membres = JSON.parse(dm[1]).membres.map((m) => m.nom); } catch (e) { membres = []; }
  const visees = [...new Set([...tu.matchAll(/data-eqj-n="([^"]+)"/g)].map((m) => m[1]))];
  t('E · le domaine fictif se lit (' + membres.length + ' personnes)', membres.length > 0);
  for (const n of visees) t('E · « ' + n + ' » est bien dans le domaine fictif', membres.includes(n));
  const ids = [...new Set([...tu.matchAll(/L\('#([a-z0-9-]+)'\)/g)].map((m) => m[1]))];
  for (const i of ids) t('E · libellé lu à l\u2019écran « #' + i + ' » présent', autres.includes('id="' + i + '"') || autres.includes("id=\\\"" + i + "\\\""));
  // G. TUTO-2
  t('G · l\u2019entraînement garde son cache Firestore en mémoire (jamais le cache partagé entre onglets)', fb.includes("if (typeof window !== 'undefined' && window.__MV_TUTO) return initializeFirestore(app, { localCache: memoryLocalCache() });"));
  const csp = (/frame-src[^;"]*/.exec(F['firebase.json']) || [''])[0];
  t('G · la CSP laisse l\u2019appli s\u2019afficher dans son panneau (frame-src \'self\')', csp.includes("'self'"));
  const titres = [...tu.matchAll(/\btitre: '([^']*)'/g)].map((m) => m[1]);
  t('G · ' + titres.length + ' titre(s) de tuto, tous en question « Comment faire pour… ? »', titres.length > 0 && titres.every((x) => x.startsWith('Comment faire pour ') && /\?$/.test(x)));
  // F. le compte des gestes sans tuto
  const gestes = new Set();
  for (const [f, s] of Object.entries(F)) {
    if (!(f.startsWith('src/') || f === 'index.html') || HORS_APPLI.has(f)) continue;
    for (const m of s.matchAll(/on(?:click|change|input|submit|keyup|keydown)\s*=\s*\\?["']\s*([A-Za-z_$][\w$.]*)/g)) {
      const n = m[1].replace(/^window\./, '');
      if (!GENERIQUES.has(n)) gestes.add(n);
    }
  }
  let ref = { plafond: 0, exempts: {} };
  try { ref = JSON.parse(F['scripts/tutos-couverture.json']); } catch (e) { ref = { plafond: -1, exempts: {} }; }
  const sans = [...gestes].filter((n) => !couvre.includes(n) && !Object.prototype.hasOwnProperty.call(ref.exempts || {}, n));
  t('F · gestes sans tuto : ' + sans.length + ' (plafond ' + ref.plafond + ', ' + gestes.size + ' gestes, ' + couvre.length + ' couverts)', ref.plafond >= 0 && sans.length <= ref.plafond);
  return { ko, L, sans: sans.length, plafond: ref.plafond };
}

const F0 = charger();
if (!process.argv.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais TUTO-1 · les tutos guidés'));
  const r = verifie(F0);
  console.log(r.L.join('\n'));
  if (!r.ko && r.sans < r.plafond) console.log(c.dim('\n  Le compte a baissé : abaisser le plafond de scripts/tutos-couverture.json à ' + r.sans + '.'));
  console.log('\n  ' + (r.ko ? c.r(r.ko + ' rouge(s)') : c.g('tout est vert')) + '\n');
  process.exit(r.ko ? 1 : 0);
}
// Contre-épreuves : chaque mutation DOIT rougir.
const MUT = [
  ['setDoc importé en direct', 'src/firebase.js', 'setDoc as _sdkSetDoc', 'setDoc'],
  ['un appel direct au SDK', 'src/firebase.js', 'function setDoc() {', 'function _mvFuite() { return _sdkSetDoc(); }\nfunction setDoc() {'],
  ['_fbLoad qui charge pendant un entraînement', 'src/firebase.js', "window._fbLoad = async function () {\n  if (typeof window !== 'undefined' && window.__MV_TUTO) return;", 'window._fbLoad = async function () {'],
  ['boot.js sans la vérification', 'public/boot.js', 'if (!pose || window.localStorage !== JL || window.sessionStorage !== JS) {', 'if (!pose) {'],
  ['boot.js qui écrit le drapeau en mémoire de session', 'public/boot.js', 'window.__MV_TUTO = m[1].toLowerCase();', "sessionStorage.setItem('mavigne_tuto', m[1]);\n  window.__MV_TUTO = m[1].toLowerCase();"],
  ['l\u2019entraînement dans le cache partagé', 'src/firebase.js', "  if (typeof window !== 'undefined' && window.__MV_TUTO) return initializeFirestore(app, { localCache: memoryLocalCache() });\n", ''],
  ['frame-src sans l\u2019appli', 'firebase.json', "frame-src 'self' https://www.google.com", 'frame-src https://www.google.com'],
  ['un titre qui n\u2019est pas une question', 'src/tutos.js', "titre: 'Comment faire pour noter un plein de GNR", "titre: 'Plein de GNR"],
  ['app.js sans tutos.js', 'src/app.js', "import './tutos.js';", ''],
  ['une étiquette disparue', 'index.html', 'data-tuto="eqj.save" ', ''],
  ['une fonction enseignée renommée', 'src/tutos.js', "couvre: ['openGnrAppoint', 'saveGnrAppoint']", "couvre: ['openGnrAppoint', 'saveGnrAppointX']"],
  ['une personne absente du domaine fictif', 'src/tutos.js', '[data-eqj-n="Paul"][data-eqj-k="2"]', '[data-eqj-n="Pauline"][data-eqj-k="2"]'],
  ['un geste nouveau sans tuto', 'index.html', '<div class="home-prio-pill-row" data-tuto="home.eqj"', '<button onclick="geste_nouveau_sans_tuto()">x</button><div class="home-prio-pill-row" data-tuto="home.eqj"'],
];
console.log(c.b('MA VIGNE — Harnais TUTO-1 · contre-épreuves'));
let bad = 0;
for (const [lib, f, de, vers] of MUT) {
  const F = Object.assign({}, F0);
  if (!F[f].includes(de)) { console.log(c.r('  ✗ ') + lib + ' — motif introuvable (' + f + ')'); bad++; continue; }
  F[f] = F[f].replace(de, vers);
  const r = verifie(F);
  if (r.ko) console.log(c.g('  ✓ ') + lib + ' → rougit');
  else { console.log(c.r('  ✗ ') + lib + ' → reste vert'); bad++; }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
