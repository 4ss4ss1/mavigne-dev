#!/usr/bin/env node
// ── HARNAIS : UN NOM LU DANS UN MODULE EXISTE-T-IL VRAIMENT APRES BUNDLING ? ──
//
//  ★★★ LA PANNE QUI A PAYE CE HARNAIS (remontee du terrain, 21/08/2026).
//  « ReferenceError: Can't find variable: loginPendingIdx » au clic sur
//  « Mot de passe oublie ? ». La variable etait pourtant la, declaree dans
//  app.js, lue dans reglages.js. En dev : parfait. En production : morte.
//
//  CE QUE FAIT ROLLUP, ET QUE PERSONNE NE VOIT.
//  Chaque module ES a son propre scope. Quand reglages.js ecrit
//  `loginPendingIdx` sans l'avoir declare ni importe, Rollup ne va PAS chercher
//  la declaration d'app.js : il classe le nom comme GLOBALE DU NAVIGATEUR. Puis,
//  pour ne pas que la declaration d'app.js masque cette pretendue globale, il
//  RENOMME la declaration. Le bundle livre :
//        let loginPendingIdx$1 = -1;      <- la vraie variable, renommee
//        if (loginPendingIdx < 0) …       <- les lecteurs, restes sur l'ancien nom
//  Les lecteurs cherchent alors un nom qui n'existe nulle part. ReferenceError.
//  ⚠️ Terser n'y est pour rien : `minify:false` donne exactement le meme bundle.
//  ⚠️ Et si la declaration renommee n'a plus AUCUN lecteur, le tree-shaking la
//     supprime : c'est le sort qu'a subi STADES_PHENO, absent des 3 Mo livres.
//
//  LA REGLE, DEJA ECRITE (§ Build n°6) MAIS JAMAIS CONTROLEE :
//     un nom declare dans un module et lu dans un autre DOIT etre joignable par
//     `window.` — sinon il n'existe pas apres le build.
//  Trois l'enfreignaient depuis le commit initial. Aucun filet ne les voyait :
//  le build est vert, `node --check` est vert, le preflight est vert. Seul un
//  utilisateur qui clique s'en apercoit.
//
//  CE QUE FAIT CE HARNAIS.
//  Il ne compte pas des occurrences et il ne construit pas le bundle (36 s) :
//  il rejoue la regle de scope de Rollup, MODULE PAR MODULE. Pour chaque fichier
//  de src/, ESLint (`no-undef`, sourceType module) rend les identifiants LIBRES :
//  ni declares, ni importes, ni parametres. Un nom libre est acceptable a
//  exactement trois conditions :
//     1. c'est une primitive du langage ou du navigateur (document, Promise…) ;
//     2. c'est une globale CDN declaree ici (firebase compat, Leaflet) ;
//     3. quelqu'un, quelque part, ecrit `window.<nom> = …`.
//  Tout le reste est une ReferenceError garantie en production. ROUGE.
//
//  ⚠️ CE QU'IL NE PROUVE PAS. Que `window.<nom> = …` ait DEJA tourne au moment
//  de la lecture. Un nom pose par un module tardif et lu au chargement par un
//  module precoce passe ici au vert et casse en prod. Le harnais controle
//  l'existence, pas la chronologie.
//
//  Contre-epreuve integree : `node scripts/mv-harnais-globaux.mjs --contre`
//  reintroduit les trois defauts d'origine en memoire (les fichiers ne sont pas
//  touches) et exige que le harnais rougisse sur chacun. Un filet qu'on n'a pas
//  vu attraper quelque chose n'est pas un filet.

import { ESLint } from 'eslint';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* ⚠️ chemin portable : jamais new URL().pathname (§53) */
const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const SRC = join(RACINE, 'src');

const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,  b: (s) => `\x1b[1m${s}\x1b[0m`,
  j: (s) => `\x1b[33m${s}\x1b[0m`,
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. Ce qui a le droit d'etre libre sans passer par window
// ═══════════════════════════════════════════════════════════════════════════

/* Primitives du langage : prises sur le globalThis de Node, moins ce qui
   n'existe QUE dans Node. Ainsi Promise, Map, Intl, structuredClone, fetch…
   arrivent tout seuls, et une nouveaute ECMAScript ne fera pas rougir le
   harnais un an apres. */
const NODE_SEUL = new Set([
  'require', 'module', 'exports', '__dirname', '__filename', 'global',
  'process', 'Buffer', 'gc', 'require$$0',
]);
const LANGAGE = new Set(
  Object.getOwnPropertyNames(globalThis).filter((n) => !NODE_SEUL.has(n)),
);

/* Le DOM. Liste explicite et volontairement close : un nom de plus ici doit
   etre un choix, pas un glissement. Ajouter au besoin — c'est cinq secondes,
   et ca vaut mieux qu'une liste ouverte qui n'attrape plus rien. */
const NAVIGATEUR = new Set([
  'window', 'document', 'location', 'history', 'navigator', 'screen', 'self',
  'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'isSecureContext',
  'IDBKeyRange', 'IDBTransaction', 'IDBCursor', 'IDBDatabase', 'IDBRequest',
  'IDBObjectStore', 'IDBIndex',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
  'getComputedStyle', 'matchMedia', 'alert', 'confirm', 'prompt', 'open',
  'Notification', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'DOMParser', 'XMLSerializer', 'XMLHttpRequest', 'FileReader', 'FileList',
  'Image', 'Audio', 'HTMLElement', 'Element', 'Node', 'NodeList', 'DocumentFragment',
  'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'TouchEvent', 'PointerEvent',
  'StorageEvent', 'DragEvent', 'DataTransfer', 'ClipboardItem',
  'Range', 'Selection', 'CanvasRenderingContext2D', 'SVGElement',
  'BroadcastChannel', 'ServiceWorkerRegistration', 'PushManager',
  'scrollTo', 'scrollBy', 'getSelection', 'print', 'visualViewport',
]);

/* Globales apportees par un <script> du index.html, hors bundle. Toute
   nouvelle entree ici est une dependance CDN de plus : ca se decide. */
const CDN = new Set([
  'firebase', // SDK compat charge par index.html (auth du login) — cf. onboarding.js §en-tete
  'L',        // Leaflet, injecte a la demande par _leafletCharger()
]);

const TOLERES = new Set([...LANGAGE, ...NAVIGATEUR, ...CDN]);

// ═══════════════════════════════════════════════════════════════════════════
// 2. Tous les noms reellement poses sur window, quelle que soit la forme
// ═══════════════════════════════════════════════════════════════════════════

const MODULES = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
const SOURCES = new Map(MODULES.map((f) => [f, readFileSync(join(SRC, f), 'utf8')]));

/* Extrait les cles de premier niveau d'un objet litteral `nom = { … }`.
   Comptage d'accolades, pas d'expression reguliere sur le corps : une valeur
   qui contient `}` (une fonction flechee, un template) ne doit pas couper. */
function clesObjet(txt, nomObjet) {
  const re = new RegExp(`(?:var|let|const)\\s+${nomObjet}\\s*=\\s*\\{`);
  const m = re.exec(txt);
  if (!m) return null;
  let i = txt.indexOf('{', m.index), prof = 0, fin = -1;
  for (let k = i; k < txt.length; k++) {
    if (txt[k] === '{') prof++;
    else if (txt[k] === '}') { prof--; if (!prof) { fin = k; break; } }
  }
  if (fin < 0) return null;
  const corps = txt.slice(i + 1, fin);
  const cles = [];
  let p = 0;
  for (let k = 0; k < corps.length; k++) {
    const ch = corps[k];
    if (ch === '{' || ch === '(' || ch === '[') p++;
    else if (ch === '}' || ch === ')' || ch === ']') p--;
    else if (p === 0) {
      const reste = corps.slice(k);
      const mk = /^([A-Za-z_$][\w$]*)\s*:/.exec(reste);
      if (mk && (k === 0 || /[,\s]/.test(corps[k - 1]))) { cles.push(mk[1]); k += mk[0].length - 1; }
    }
  }
  return cles;
}

/* Tous les noms poses sur window par un jeu de sources donne. Recalcule a
   chaque contre-epreuve : retirer un `window.X = X` fait partie du defaut. */
function collecterWindow(sources) {
  const noms = new Set(), dynamiques = [];
  for (const [f, txt] of sources) {
    // window.NOM = …   (jamais window.NOM == / ===)
    for (const m of txt.matchAll(/window\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?!=)/g)) noms.add(m[1]);
    // window['NOM'] = …
    for (const m of txt.matchAll(/window\s*\[\s*(['"])([^'"]+)\1\s*\]\s*=(?!=)/g)) noms.add(m[2]);
    // for (var k in OBJ) { window[k] = OBJ[k] }   — exposition en bloc
    for (const m of txt.matchAll(/window\s*\[\s*([A-Za-z_$][\w$]*)\s*\]\s*=\s*([A-Za-z_$][\w$]*)\s*\[\s*\1\s*\]/g)) {
      const cles = clesObjet(txt, m[2]);
      if (cles) cles.forEach((k) => noms.add(k));
      else dynamiques.push(`${f} — bloc window[k]=${m[2]}[k] NON RESOLU`);
    }
    // toute autre forme dynamique : signalee, jamais devinee
    for (const m of txt.matchAll(/window\s*\[\s*([^\]]+?)\s*\]\s*=(?!=)/g)) {
      const arg = m[1].trim();
      if (/^['"]/.test(arg) || /^[A-Za-z_$][\w$]*$/.test(arg)) continue;
      dynamiques.push(`${f} — window[${arg}] = … (non analysable)`);
    }
  }
  return { noms, dynamiques };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Les identifiants LIBRES, module par module — le scope de Rollup
// ═══════════════════════════════════════════════════════════════════════════

const eslint = new ESLint({
  cwd: RACINE,
  overrideConfigFile: true,
  overrideConfig: [{
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: {} },
    rules: { 'no-undef': 'error' },
  }],
});

/* Cache par TEXTE : une contre-epreuve ne modifie qu'un ou deux modules, les
   dix autres n'ont aucune raison d'etre relus. */
const CACHE = new Map();
async function libresDe(mod, txt) {
  const cle = mod + '\u0000' + txt.length + '\u0000' + txt.charCodeAt(txt.length >> 1) + '\u0000' + txt.slice(0, 64);
  if (CACHE.has(cle)) return CACHE.get(cle);
  const res = await eslint.lintText(txt, { filePath: join(SRC, mod) });
  const s = new Set();
  for (const m of res[0].messages) {
    const n = /'([^']+)' is not defined/.exec(m.message);
    if (n) s.add(n[1]);
  }
  CACHE.set(cle, s);
  return s;
}

/* Ou un nom est-il declare ? Sert a nommer le coupable dans le rapport. */
function declarePar(sources, nom) {
  const re = new RegExp(`^\\s*(?:export\\s+)?(?:var|let|const|function|async function|class)\\s+${nom}\\b`, 'm');
  for (const [f, txt] of sources) if (re.test(txt)) return f;
  return null;
}

/* LE VERDICT. Un nom libre est acceptable a trois conditions seulement. */
async function controle(sources) {
  const { noms: surWindow, dynamiques } = collecterWindow(sources);
  const fautes = [];
  for (const [mod, txt] of sources) {
    for (const nom of await libresDe(mod, txt)) {
      if (TOLERES.has(nom) || surWindow.has(nom)) continue;
      fautes.push({ mod, nom, source: declarePar(sources, nom) });
    }
  }
  return { fautes, surWindow, dynamiques };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Passe normale
// ═══════════════════════════════════════════════════════════════════════════

const CONTRE = process.argv.includes('--contre');

if (!CONTRE) {
  console.log(c.b('\n── HARNAIS GLOBAUX — un nom lu existe-t-il apres bundling ? ──\n'));
  const { fautes, surWindow, dynamiques } = await controle(SOURCES);
  console.log(c.d(`  ${MODULES.length} modules · ${surWindow.size} noms poses sur window · ${TOLERES.size} primitives tolerees`));

  if (dynamiques.length) {
    console.log(c.j(`\n  ⚠ ${dynamiques.length} exposition(s) hors de portee du harnais :`));
    for (const d of dynamiques) console.log(c.d('    · ' + d));
    console.log(c.d('    (un nom pose UNIQUEMENT par ce chemin sortira rouge — poser un window.X = X explicite)'));
  }

  if (!fautes.length) {
    console.log(c.g('\n  ✓ aucun nom libre injoignable — le bundle ne perdra personne\n'));
    process.exit(0);
  }

  console.log(c.r(`\n  ✗ ${fautes.length} nom(s) libre(s) injoignable(s) — ReferenceError garantie en production\n`));
  for (const f of fautes) {
    console.log(c.r(`    · ${f.nom}`) + c.d(`  — lu dans ${f.mod}, ${f.source ? 'declare dans ' + f.source : 'declare nulle part'}`));
  }
  const ex = fautes[0].nom;
  console.log(c.d(`\n    Remede : \`window.${ex} = …\` a la declaration, ET lire \`window.${ex}\` cote lecteur.`));
  console.log(c.d('    Poser le window sans corriger le lecteur suffit a faire marcher le code,'));
  console.log(c.d('    mais laisse un nom nu de plus : le harnais l\'accepte, la relecture non.\n'));
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Contre-epreuves — le filet attrape-t-il ce qu'il pretend attraper ?
// ═══════════════════════════════════════════════════════════════════════════

/* Chaque cas REJOUE l'etat du 21/08 : le lecteur nu ET l'absence de window.
   Casser le seul lecteur ne prouverait rien — avec le window en place, un nom
   nu se resout tres bien a l'execution. C'est la CONJONCTION qui tue. */
function copie() { return new Map(SOURCES); }
function edite(src, mod, f) { const t = src.get(mod); const n = f(t); src.set(mod, n); return n !== t; }

const CAS = [
  {
    nom: 'loginPendingIdx',
    quoi: 'la panne du 21/08 — `let` de module + lecteurs nus',
    casse(s) {
      let ok = true;
      for (const m of ['app.js', 'reglages.js']) ok = edite(s, m, (t) => t.replace(/window\.loginPendingIdx/g, 'loginPendingIdx')) && ok;
      // la ligne de declaration redevient un `let` de module (colonne 0)
      ok = edite(s, 'app.js', (t) => t.replace('\nloginPendingIdx = -1;', '\nlet loginPendingIdx = -1;')) && ok;
      return ok;
    },
  },
  {
    nom: 'STADES_PHENO',
    quoi: 'le bouton « nouveau traitement » — window retire, lecteurs nus',
    casse(s) {
      let ok = edite(s, 'app.js', (t) => t.replace('window.STADES_PHENO = STADES_PHENO;\n', ''));
      ok = edite(s, 'phyto.js', (t) => t.replace(/window\.STADES_PHENO/g, 'STADES_PHENO')) && ok;
      return ok;
    },
  },
  {
    nom: 'db',
    quoi: 'le chat v8 — poignee Firestore encapsulee dans firebase.js',
    casse(s) {
      return edite(s, 'app.js', (t) => t.replace(
        /function _chatDoc\(canal\)\{\n  return _chatHorsService\('canal ' \+ canal\);\n\}/,
        "function _chatDoc(canal){\n  return db.collection('mavigne').doc('chat_canal_' + canal);\n}",
      ));
    },
  },
  {
    /* ⚠️ CE CAS-LA N'EST PAS UN DES TROIS. Un harnais ecrit APRES la panne
       attrape toujours la panne : ca ne prouve rien sur la suivante. On injecte
       donc un defaut INEDIT, dans un module qui n'a rien a voir. */
    nom: '_mvTemoinJamaisDeclare',
    quoi: 'un defaut inedit, dans un module etranger au lot',
    casse(s) {
      return edite(s, 'tracteur.js', (t) => t.replace(
        'const DEBUG', 'function _mvTemoinHarnais(){ return _mvTemoinJamaisDeclare; }\nconst DEBUG',
      ));
    },
  },
];

console.log(c.b('\n── CONTRE-EPREUVES — le filet attrape-t-il vraiment ? ──\n'));
let ok = 0, ko = 0;
const t = (n, vrai, det) => {
  if (vrai) { ok++; console.log('  ' + c.g('✓') + ' ' + n); }
  else { ko++; console.log('  ' + c.r('✗ ' + n) + (det ? c.d('  ' + det) : '')); }
};

const depart = await controle(SOURCES);
t('depart vert : aucun nom libre injoignable dans les sources livrees',
  depart.fautes.length === 0, depart.fautes.map((f) => `${f.nom} (${f.mod})`).join(' · '));

for (const cas of CAS) {
  const s = copie();
  if (!cas.casse(s)) { t(`[${cas.nom}] le defaut a pu etre reintroduit`, false, 'motif introuvable — contre-epreuve inoperante'); continue; }
  const { fautes } = await controle(s);
  t(`[${cas.nom}] ${cas.quoi} → rouge`, fautes.some((f) => f.nom === cas.nom),
    fautes.length ? 'rouge sur ' + fautes.map((f) => f.nom).join(', ') + ' mais pas sur lui' : 'reste vert');
}

/* Contre-epreuve INVERSE : un nom nu mais bel et bien pose sur window ne doit
   PAS rougir. Un harnais qui crie a chaque appel inter-module legitime finit
   desactive, et c'est alors comme s'il n'existait pas. */
{
  const s = copie();
  edite(s, 'phyto.js', (t2) => t2.replace(/window\.STADES_PHENO/g, 'STADES_PHENO'));  // window laisse en place dans app.js
  const { fautes } = await controle(s);
  t('un nom nu mais expose sur window reste vert (pas de faux positif)',
    !fautes.some((f) => f.nom === 'STADES_PHENO'), 'rouge a tort');
}

console.log(`\n  ${ok} vert(s) · ${ko} rouge(s)\n`);
process.exit(ko ? 1 : 0);
