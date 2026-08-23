#!/usr/bin/env node
// ============================================================================
//  MA VIGNE — Preflight : filet anti-régression pré-livraison
//  Automatise la checklist §24 (pièges) + §25 (workflow de patch sûr).
//  LECTURE SEULE, sauf --baseline (seul mode qui écrit, et seulement le fichier
//  scripts/preflight-baseline.json).
//
//  Usage :
//    node scripts/preflight.mjs [racine] [--strict] [--quiet] [--baseline]
//      [racine]    dossier du repo (défaut : dossier parent de scripts/)
//      --strict    les AVERTISSEMENTS bloquent aussi (exit 1)
//      --quiet     n'affiche que les ERREURS
//      --baseline  regrave scripts/preflight-baseline.json sur l'état courant
//                  (à faire APRÈS avoir nettoyé, jamais pour faire taire une erreur)
//      --only=C24  ne fait tourner que les contrôles nommés (liste séparée par
//                  des virgules). Pour une contre-épreuve qui relance le
//                  preflight en boucle : sans lui, chaque passage paie les 26 s
//                  de C1 (un `node --check` par fichier) et de C20.
//                  ⚠️ Les autres contrôles ne tournent PAS : la ligne de version
//                  affiche « ? » et --baseline est refusé dans ce mode.
//
//  Exit 0 si aucune ERREUR (ou aucune en mode normal), 1 sinon.
//  Branchable en automatique : "prebuild": "node scripts/preflight.mjs"
//  dans package.json → npm run build s'arrête si une erreur est détectée.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- args ------------------------------------------------------------------
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const quiet  = args.includes('--quiet');
const rebase = args.includes('--baseline');
const posArg = args.find(a => !a.startsWith('--'));
const root   = path.resolve(posArg || path.join(__dirname, '..'));

// ---- couleurs --------------------------------------------------------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const C = (n) => useColor ? (s) => `\x1b[${n}m${s}\x1b[0m` : (s) => s;
const red = C('31'), yellow = C('33'), green = C('32'), dim = C('2'), bold = C('1'), cyan = C('36');

// ---- collecte des constats -------------------------------------------------
const findings = [];
const _seen = new Set();
function add(level, file, line, msg) {
  const key = `${level}|${file}|${line}|${msg}`;
  if (_seen.has(key)) return;
  _seen.add(key);
  findings.push({ level, file, line: line || null, msg });
}

// ---- helpers ---------------------------------------------------------------
function read(rel) {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); }
  catch { return null; }
}
function listDir(rel, ext) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => `${rel}/${f}`).sort();
}
function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}
function stripComments(c) {
  return c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}
// Blanchit les commentaires en PRÉSERVANT longueur et sauts de ligne (positions/lignes intactes).
function blankJsComments(c) {
  c = c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  c = c.replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return c;
}
function blankHtmlComments(c) {
  return c.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
}
// Profondeur d'accolades à un index (commentaires + chaînes neutralisés). 0 = top-level.
function braceDepth(content, index) {
  let s = blankJsComments(content.slice(0, index))
    .replace(/`(?:\\.|[^`\\])*`/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/'(?:\\.|[^'\\])*'/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/"(?:\\.|[^"\\])*"/g, m => m.replace(/[^\n]/g, ' '));
  let d = 0;
  for (let i = 0; i < s.length; i++) { const ch = s[i]; if (ch === '{') d++; else if (ch === '}') d--; }
  return d;
}

let appVersion = null, swVersion = null;

// ============================================================================
//  C1 — Syntaxe ESM stricte (node --check). Rollup attrape ce que Node CJS rate.
// ============================================================================
function checkSyntax() {
  const files = [
    ...listDir('src', '.js'),
    ...listDir('functions', '.js'),
    ...listDir('scripts', '.mjs'),
    'public/sw.js', 'public/boot.js',
  ];
  for (const rel of files) {
    const content = read(rel);
    if (content == null) continue;
    const isModule = rel.endsWith('.mjs') || /^\s*(import|export)\b/m.test(content);
    const inputType = isModule ? 'module' : 'commonjs';
    try {
      execFileSync('node', ['--check', `--input-type=${inputType}`],
        { input: content, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      const raw = (e.stderr ? e.stderr.toString() : (e.message || '')).trim();
      const msg = raw.replace(/\[stdin\]/g, rel).split('\n').slice(0, 5).join('\n    ');
      add('ERROR', rel, null, `Syntaxe invalide (mode ${inputType}) :\n    ${msg}`);
    }
  }
}

// ============================================================================
//  C2 — Demi-surrogates isolés (cf. §7 : tronque le fichier à l'écriture).
// ============================================================================
function checkSurrogates() {
  const files = [...listDir('src', '.js'), 'index.html', 'public/sw.js', 'public/manifest.json'];
  for (const rel of files) {
    const c = read(rel);
    if (c == null) continue;
    // (a) échappements source \uXXXX formant un demi-surrogate
    let m;
    const hi = /\\u[dD][89abAB][0-9a-fA-F]{2}/g;
    while ((m = hi.exec(c))) {
      const after = c.slice(m.index + 6, m.index + 12);
      if (!/^\\u[dD][c-fC-F][0-9a-fA-F]{2}/.test(after))
        add('ERROR', rel, lineOf(c, m.index), `Demi-surrogate HAUT isolé "${m[0]}" → risque de troncature du fichier. Utiliser un emoji réel ou \\u{1FXXX}. Cf. §7.`);
    }
    const lo = /\\u[dD][c-fC-F][0-9a-fA-F]{2}/g;
    while ((m = lo.exec(c))) {
      const before = c.slice(Math.max(0, m.index - 6), m.index);
      if (!/\\u[dD][89abAB][0-9a-fA-F]{2}$/.test(before))
        add('ERROR', rel, lineOf(c, m.index), `Demi-surrogate BAS isolé "${m[0]}". Cf. §7.`);
    }
    // (b) surrogates bruts (fichier déjà corrompu)
    for (let i = 0; i < c.length; i++) {
      const code = c.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        const n = c.charCodeAt(i + 1);
        if (!(n >= 0xDC00 && n <= 0xDFFF))
          add('ERROR', rel, lineOf(c, i), 'Surrogate haut brut isolé dans le fichier (corruption). Cf. §7.');
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
        const p = c.charCodeAt(i - 1);
        if (!(p >= 0xD800 && p <= 0xDBFF))
          add('ERROR', rel, lineOf(c, i), 'Surrogate bas brut isolé dans le fichier (corruption). Cf. §7.');
      }
    }
  }
}

// ============================================================================
//  C3 — Balance des <div> dans index.html (cf. §25).
// ============================================================================
function checkDivBalance() {
  const c = read('index.html');
  if (c == null) return;
  const open = (c.match(/<div\b/gi) || []).length;
  const close = (c.match(/<\/div\s*>/gi) || []).length;
  if (open !== close) {
    const d = open - close;
    add('ERROR', 'index.html', null, `Déséquilibre <div> : ${open} ouvrants vs ${close} fermants (écart ${d > 0 ? '+' : ''}${d}). Un overlay niché dans un parent display:none devient invisible. Cf. §24/§25.`);
  }
}

// ============================================================================
//  C4 — <div> dans <button> (cf. §24 : parser ferme le button → clic mort).
// ============================================================================
function checkDivInButton() {
  const c = read('index.html');
  if (c == null) return;
  const re = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let m;
  while ((m = re.exec(c))) {
    if (!/<div\b/i.test(m[1])) continue;
    const innerHandler = /on(?:click|change|input|mousedown|touchstart)\s*=/i.test(m[1]);
    if (innerHandler)
      add('ERROR', 'index.html', lineOf(c, m.index), '<div> AVEC handler à l\'intérieur d\'un <button> → le parser ferme le button avant → clic mort. Utiliser <span>. Cf. §24.');
    else
      add('WARN', 'index.html', lineOf(c, m.index), '<div> dans un <button> → HTML5 invalide (le handler est sur le button donc fonctionne, mais à corriger en <span>). Cf. §24.');
  }
}

// ============================================================================
//  C4bis — <div> dans <button> DANS LES TEMPLATES JS (cf. §24).
//    checkDivInButton ne couvre qu'index.html ; or l'essentiel des boutons sont
//    assemblés par concaténation de chaînes dans src/*.js. On reconstruit le
//    HTML approximatif (littéraux concaténés) en insérant un séparateur \x00 à
//    chaque frontière d'instruction (;) — un <button> ne peut donc pas « sauter »
//    par-dessus le <div> d'une instruction sans rapport (zéro faux positif). On
//    ne juge que les boutons fermés DANS la même expression de concaténation ;
//    les boutons bâtis en plusieurs instructions séparées (h += …) ne sont pas
//    couverts (best-effort, comme le reste du preflight).
// ============================================================================
function flattenJsToHtml(src) {
  let out = '';
  const marks = [];            // {outPos, srcIdx} au début de chaque littéral (outPos croissant)
  const n = src.length;
  let i = 0;
  let gapHasSemi = false;      // une frontière d'instruction depuis le dernier littéral ?
  let first = true;
  function sep() {             // séparateur entre deux littéraux adjacents
    if (first) { gapHasSemi = false; return; }
    out += gapHasSemi ? '\x00' : ' ';   // \x00 = frontière d'instruction ; espace = même expression
    gapHasSemi = false;
  }
  function readStr(q) {
    const s0 = i; i++;
    let buf = '';
    while (i < n) {
      const ch = src[i];
      if (ch === '\\') { buf += (src[i] || '') + (src[i + 1] || ''); i += 2; continue; }
      if (ch === q) { i++; break; }
      buf += ch; i++;
    }
    sep(); marks.push({ outPos: out.length, srcIdx: s0 }); out += buf; first = false;
  }
  function readTpl() {
    const s0 = i; i++;
    sep(); const mp = out.length;
    let buf = '';
    while (i < n) {
      const ch = src[i];
      if (ch === '\\') { buf += (src[i] || '') + (src[i + 1] || ''); i += 2; continue; }
      if (ch === '`') { i++; break; }
      if (ch === '$' && src[i + 1] === '{') {     // expression interpolée = valeur dynamique
        i += 2; let d = 1;
        while (i < n && d > 0) { const c2 = src[i]; if (c2 === '{') d++; else if (c2 === '}') d--; i++; }
        buf += ' '; continue;                     // placeholder neutre (ne casse pas un tag)
      }
      buf += ch; i++;
    }
    marks.push({ outPos: mp, srcIdx: s0 }); out += buf; first = false;
  }
  while (i < n) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (ch === "'" || ch === '"') { readStr(ch); continue; }
    if (ch === '`') { readTpl(); continue; }
    if (ch === ';') gapHasSemi = true;
    i++;
  }
  return { html: out, marks };
}
function checkDivInButtonJs() {
  for (const rel of listDir('src', '.js')) {
    const code = read(rel); if (code == null) continue;
    const { html, marks } = flattenJsToHtml(code);
    const re = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
    let m;
    while ((m = re.exec(html))) {
      const inner = m[1];
      if (inner.indexOf('\x00') !== -1) continue;     // button non fermé dans la même expression → on ne juge pas
      if (!/<div\b/i.test(inner)) continue;
      let best = null;                                 // ligne source = dernier littéral avant le <button>
      for (const mk of marks) { if (mk.outPos <= m.index) best = mk; else break; }
      const ln = best ? lineOf(code, best.srcIdx) : null;
      const innerHandler = /on(?:click|change|input|mousedown|touchstart)\s*=/i.test(inner);
      if (innerHandler)
        add('ERROR', rel, ln, '<div> AVEC handler dans un <button> (template JS) -> clic mort potentiel. Utiliser <span>. Cf. §24.');
      else
        add('WARN', rel, ln, '<div> dans un <button> (template JS) -> HTML5 invalide (le handler est sur le button donc fonctionne, mais a corriger en <span>). Cf. §24.');
    }
  }
}

// ============================================================================
//  C5 — Cohérence des versions (cf. §7).
//    (a) 4 affichages index.html == APP_VERSION
//    (b) version SW interne cohérente (header / CACHE_NAME / console.log)
//    NB : APP_VERSION et SW sont 2 séquences INDÉPENDANTES → jamais comparées.
// ============================================================================
function checkVersions() {
  const utils = read('src/utils.js');
  const html = read('index.html');
  const sw = read('public/sw.js');

  if (utils) {
    const m = utils.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (m) appVersion = m[1];
    else add('WARN', 'src/utils.js', null, 'APP_VERSION introuvable.');
  }

  if (html && appVersion) {
    const anchors = [
      ['footer',                  /Ma Vigne\s*·\s*v([0-9][0-9.]*)/],
      ['.mod-header-sub',         /class=["']mod-header-sub["'][^>]*>\s*Ma Vigne\s*v([0-9][0-9.]*)/],
      ['.ver-tag',                /class=["']ver-tag["'][^>]*>\s*Ma Vigne\s*v([0-9][0-9.]*)/],
      ['#wn-version-badge',       /id=["']wn-version-badge["'][^>]*>\s*v([0-9][0-9.]*)/],
    ];
    for (const [name, re] of anchors) {
      const m = html.match(re);
      if (!m) { add('WARN', 'index.html', null, `Affichage version "${name}" introuvable (pattern non reconnu — vérifier manuellement).`); continue; }
      if (m[1] !== appVersion)
        add('ERROR', 'index.html', lineOf(html, m.index), `Version "${name}" = v${m[1]} ≠ APP_VERSION v${appVersion}. Cf. §7.`);
    }
  }

  if (sw) {
    const header = sw.match(/Service Worker\s+v([0-9][0-9.]*)/);
    const cache = sw.match(/CACHE_NAME\s*=\s*['"]mavigne-v([0-9][0-9.]*)['"]/);
    const logs = [...sw.matchAll(/\[SW\][^'"]*Ma Vigne\s+v([0-9][0-9.]*)/g)].map(x => x[1]);
    const all = [];
    if (header) all.push(['en-tête', header[1]]); else add('WARN', 'public/sw.js', null, 'En-tête "Service Worker vX.XX" introuvable.');
    if (cache) all.push(['CACHE_NAME', cache[1]]); else add('WARN', 'public/sw.js', null, 'CACHE_NAME mavigne-vX.XX introuvable.');
    logs.forEach((v, i) => all.push([`console.log #${i + 1}`, v]));
    swVersion = (cache && cache[1]) || (header && header[1]) || null;
    if (all.length) {
      const [refLabel, ref] = all[0];
      for (const [label, v] of all)
        if (v !== ref)
          add('ERROR', 'public/sw.js', null, `Version SW incohérente : ${label} = v${v} ≠ ${refLabel} v${ref}. header / CACHE_NAME / les 2 console.log doivent coïncider. Cf. §7.`);
    }
  }
}

// ============================================================================
//  C6 — onclick → window.* (cf. §24 : fonction non exposée = clic mort).
//        Heuristique → AVERTISSEMENT.
//        ⚠️ Ne lit que le PREMIER identifiant, et seulement suivi d'une
//        parenthèse. Le corps entier du gestionnaire, c'est C23.
// ============================================================================
const JS_KW = new Set(['if', 'for', 'while', 'switch', 'return', 'function', 'var', 'let',
  'const', 'new', 'typeof', 'void', 'delete', 'do', 'else', 'try', 'catch', 'throw', 'await',
  'async', 'yield', 'this', 'true', 'false', 'null', 'undefined', 'in', 'of', 'instanceof',
  'class', 'super', 'event']);

function checkOnclickWindow() {
  const allJs = listDir('src', '.js');
  const exposed = new Set();
  for (const rel of allJs) {
    const raw = read(rel); if (!raw) continue;
    const c = blankJsComments(raw);
    let m;
    const r1 = /window\.([a-zA-Z_$][\w$]*)\s*=(?!=)/g;
    while ((m = r1.exec(c))) exposed.add(m[1]);
    const r2 = /window\[\s*['"]([a-zA-Z_$][\w$]*)['"]\s*\]\s*=(?!=)/g;
    while ((m = r2.exec(c))) exposed.add(m[1]);
    const r3 = /Object\.assign\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g;
    while ((m = r3.exec(c))) for (const km of m[1].matchAll(/([a-zA-Z_$][\w$]*)\s*[:,}]/g)) exposed.add(km[1]);
  }

  const rawHtml = read('index.html');
  const targets = [['index.html', rawHtml ? blankHtmlComments(rawHtml) : null]];
  for (const rel of allJs) { const raw = read(rel); targets.push([rel, raw ? blankJsComments(raw) : null]); }
  const handler = /on(?:click|change|input|submit|keydown|keyup|mousedown|touchstart)\s*=\s*\\?["'`]\s*([a-zA-Z_$][\w$.]*)\s*\(/g;
  for (const [rel, c] of targets) {
    if (!c) continue;
    let m;
    while ((m = handler.exec(c))) {
      let name = m[1];
      if (name.startsWith('window.')) continue;
      if (name.includes('.')) continue;          // méthode d'objet : hors périmètre
      if (JS_KW.has(name)) continue;             // code inline (if/return…)
      if (exposed.has(name)) continue;           // OK
      add('WARN', rel, lineOf(c, m.index), `onclick → "${name}(…)" appelé mais "window.${name}" introuvable → clic mort si injecté dynamiquement. Cf. §24.`);
    }
  }
}

// ============================================================================
//  C7 — const DEBUG manquant (cf. §24 : ReferenceError silencieux).
// ============================================================================
function checkDebug() {
  for (const rel of listDir('src', '.js')) {
    const raw = read(rel); if (!raw) continue;
    const code = stripComments(raw);
    if (!/\bDEBUG\b/.test(code)) continue;
    if (!/\b(const|let|var)\s+DEBUG\b/.test(code))
      add('ERROR', rel, null, 'Utilise DEBUG sans le déclarer → ReferenceError silencieux qui tue les fonctions du module (incident tracteur.js). Déclarer en tête : const DEBUG = location.hostname === \'localhost\' || location.hostname === \'127.0.0.1\'; Cf. §24.');
  }
}

// ============================================================================
//  C8 — TDZ : window.X = X AVANT let/const X (cf. §24 bug login).
//        Heuristique → AVERTISSEMENT.
// ============================================================================
function checkTDZ() {
  for (const rel of listDir('src', '.js')) {
    const raw = read(rel); if (!raw) continue;
    const c = blankJsComments(raw);
    const re = /window\.([a-zA-Z_$][\w$]*)\s*=\s*\1\b/g;
    let m;
    while ((m = re.exec(c))) {
      if (braceDepth(c, m.index) !== 0) continue;   // dans une fonction/bloc → exécuté après init → pas de TDZ
      const name = m[1];
      const dm = c.match(new RegExp(`\\b(?:let|const)\\s+${name}\\b`));
      if (dm && c.indexOf(dm[0]) > m.index)
        add('WARN', rel, lineOf(c, m.index), `window.${name} = ${name} au top-level AVANT sa déclaration let/const → TDZ ReferenceError (cf. bug login §24). Exposer sur window APRÈS le let.`);
    }
  }
}

// ============================================================================
//  C9 — package.json : build idempotent (cf. §6).
// ============================================================================
function checkBuild() {
  const pkg = read('package.json'); if (!pkg) return;
  let json;
  try { json = JSON.parse(pkg); }
  catch (e) { add('ERROR', 'package.json', null, `JSON invalide : ${e.message}`); return; }
  const build = (json.scripts && json.scripts.build) || '';
  const n = (build.match(/inject-precache/g) || []).length;
  if (n === 0) add('WARN', 'package.json', null, 'Le script build n\'appelle pas inject-precache.mjs → précache non injecté ?');
  if (n > 1) add('ERROR', 'package.json', null, `inject-precache.mjs appelé ${n}× dans build → 2e passage = exit(1) = deploy annulé (script idempotent). N'en garder qu'UN. Cf. §6.`);
}

// ============================================================================
//  C10 — display:flex|block sur #page-… en CSS statique (cf. §24).
// ============================================================================
function checkPageDisplay() {
  const c = read('index.html'); if (!c) return;
  // CSS applicatif : blocs <style> restants d'index.html (splash) + feuille externalisée src/styles.css
  const ext = read('src/styles.css') || '';
  const styles = [...c.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(x => x[1]).join('\n') + '\n' + ext;
  const re = /(^|[\s,}])#page-[\w-]+\s*\{[^}]*?display\s*:\s*(flex|block|grid|inline-block)\b/gi;
  let m;
  while ((m = re.exec(styles)))
    add('WARN', 'index.html', null, `CSS statique "display:${m[2]}" sur un sélecteur #page-… NU → écrase .page{display:none} par spécificité (le module reste affiché). Cf. §24.`);
}

// ============================================================================
//  BASELINE — cliquet anti-régression (C11, C14, C15, C16, C18, C19, C23, C24, C25)
// ----------------------------------------------------------------------------
//  Ces sept règles décrivent une dette qui EXISTE DÉJÀ : les passer en erreur
//  sèche casserait le build dès le premier jour. Le cliquet règle ça : la
//  référence est figée dans scripts/preflight-baseline.json, on INTERDIT tout
//  ajout et on TOLÈRE l'existant. La référence ne peut que descendre — quand
//  elle descend, le preflight le dit et invite à la regraver.
//
//    plus que la référence  → ERREUR (nommée : on sait exactement ce qui est neuf)
//    égal à la référence    → une ligne de synthèse, rien de plus
//    moins que la référence → ATTENTION « regraver la référence »
//
//  Regraver :  node scripts/preflight.mjs --baseline
//  Fichier absent → les cliquets sont neutralisés (jamais de blocage surprise).
// ============================================================================
const BASELINE_REL = 'scripts/preflight-baseline.json';
let baseline = null, baselineMissing = false;
try { baseline = JSON.parse(fs.readFileSync(path.join(root, BASELINE_REL), 'utf8')); }
catch { baselineMissing = true; }
const nextBaseline = {};

// Liste nominative : la référence est un tableau de noms stables (pas de numéros
// de ligne, qui bougent au moindre patch).
function ratchetList(key, file, found, label, fix) {
  (nextBaseline[key] ||= {})[file] = found.slice().sort();
  // En mode --baseline, la référence est réécrite en fin d'exécution : comparer à
  // l'ancienne n'aurait aucun sens et afficherait des « regraver » déjà périmés.
  if (!baseline || rebase) return;
  const ref = (baseline[key] && baseline[key][file]) || [];
  const added = found.filter(x => !ref.includes(x));
  const gone  = ref.filter(x => !found.includes(x));
  for (const x of added) add('ERROR', file, null, `${label} : « ${x} » est NOUVEAU (absent de la référence). ${fix}`);
  if (!added.length && gone.length)
    add('WARN', file, null, `${label} : ${gone.length} de moins qu'en référence (${gone.join(', ')}) — regraver : node scripts/preflight.mjs --baseline`);
}
// Compteur : pas d'identifiant stable à accrocher, on surveille le nombre.
function ratchetCount(key, file, found, label, fix) {
  (nextBaseline[key] ||= {})[file] = found;
  if (!baseline || rebase) return;
  const ref = (baseline[key] && baseline[key][file]) || 0;
  if (found > ref) add('ERROR', file, null, `${label} : ${found} contre ${ref} en référence → ${found - ref} de plus. ${fix}`);
  else if (found < ref) add('WARN', file, null, `${label} : ${found} contre ${ref} en référence — regraver : node scripts/preflight.mjs --baseline`);
}

// ============================================================================
//  C11 — getElementById('x') où x n'est créé NULLE PART → no-op silencieux.
//        C'est ce bug exact qui a fait vivre le double en-tête de la Cave
//        « depuis toujours » : le masquage visait une CLASSE avec getElementById.
// ============================================================================
function checkDeadIds() {
  const srcs = listDir('src', '.js');
  const html = read('index.html') || '';
  const allJs = srcs.map(f => read(f) || '').join('\n');
  const corpus = allJs + '\n' + html;
  // Un id peut être créé ailleurs qu'en id="…" : passé en argument d'un helper
  // (_gnrField('gnr-cap', …)), concaténé, etc. On compte donc TOUTES les mentions du
  // jeton dans le corpus et on ne retient que celles qui n'existent QUE dans des
  // getElementById — là, personne ne le crée jamais.
  // Index construit en UNE passe : une regex par identifiant sur 3,5 Mo coûtait ~5 s.
  const tokAll = new Map(), tokGebi = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const t of corpus.match(/(?<![\w-])[A-Za-z_$][\w$-]*(?![\w-])/g) || []) bump(tokAll, t);
  for (const m of allJs.matchAll(/getElementById\(\s*['"]([\w-]+)['"]/g)) bump(tokGebi, m[1]);
  for (const rel of srcs) {
    const c = blankJsComments(read(rel) || '');
    const dead = [];
    for (const m of c.matchAll(/getElementById\(\s*['"]([\w-]+)['"]\s*\)/g)) {
      const id = m[1];
      if ((tokAll.get(id) || 0) - (tokGebi.get(id) || 0) <= 0 && !dead.includes(id)) dead.push(id);
    }
    ratchetList('C11_dead_ids', rel, dead, 'getElementById sur un id qui n\'existe nulle part (no-op muet)',
      'Supprimer l\'appel, ou créer l\'élément. Cf. §24.');
  }
}

// ============================================================================
//  C12 — Couverture de synchronisation : toute clé de COLLECTIONS doit être
//        dans FB_REALTIME ou FB_STATIC. Sinon la clé n'est lue QU'AU BOOT :
//        ni listener, ni pull-to-refresh → deux appareils divergent en silence
//        et le dernier fbSave écrase l'autre. (Vécu : `intrants` et `paie`.)
//        Tolérance ZÉRO — cette règle est au vert, elle doit y rester.
// ============================================================================
function checkSyncCoverage() {
  const raw = read('src/firebase.js'); if (!raw) return;
  const c = blankJsComments(raw);
  const pick = (re) => { const m = c.match(re); return m ? [...m[1].matchAll(/'([\w_]+)'/g)].map(x => x[1]) : null; };
  const COL = pick(/const COLLECTIONS\s*=\s*\[([\s\S]*?)\];/);
  const RT  = pick(/var FB_REALTIME\s*=\s*\[([\s\S]*?)\];/);
  const ST  = pick(/var FB_STATIC\s*=\s*\[([\s\S]*?)\];/);
  if (!COL || !RT || !ST) {
    add('WARN', 'src/firebase.js', null, 'C12 : COLLECTIONS / FB_REALTIME / FB_STATIC introuvables — le contrôle de couverture de synchronisation n\'a pas pu tourner.');
    return;
  }
  for (const k of COL) {
    if (!RT.includes(k) && !ST.includes(k))
      add('ERROR', 'src/firebase.js', null, `Collection « ${k} » dans COLLECTIONS mais NI dans FB_REALTIME NI dans FB_STATIC → lue au boot seulement : aucun listener, aucun pull-to-refresh. Deux appareils divergent sans le dire et le dernier enregistrement écrase l'autre.`);
  }
  for (const k of RT) if (ST.includes(k))
    add('ERROR', 'src/firebase.js', null, `Collection « ${k} » à la fois dans FB_REALTIME et FB_STATIC → double application concurrente.`);
  for (const k of RT.concat(ST)) if (!COL.includes(k))
    add('WARN', 'src/firebase.js', null, `Collection « ${k} » écoutée/rafraîchie mais absente de COLLECTIONS → jamais lue au boot.`);
}

// ============================================================================
//  C13 — Garde anti-écrasement : toute clé écrite par fbSave/saveData doit avoir
//        un plancher dans _MV_GUARD_FLOORS, ou figurer dans les exemptions
//        ci-dessous — explicitement, pour forcer la décision à chaque ajout.
// ============================================================================
const GUARD_EXEMPT = {
  travaux:      'dérivé, régénérable par recalcTravaux — le garder produirait des faux positifs',
  reparateur:   'état transitoire (tracteurs chez le réparateur) : se vide légitimement dès que tout est rentré',
  kml_polygons: 'l\'import KML est un REPLACE assumé — un garde bloquerait tout parcellaire réimporté plus petit',
  catalogue:    'catalogue phyto local, supplanté par E-Phy',
};
function checkGuardCoverage() {
  const raw = read('src/firebase.js'); if (!raw) return;
  const m = blankJsComments(raw).match(/var _MV_GUARD_FLOORS\s*=\s*\{([\s\S]*?)\};/);
  if (!m) { add('WARN', 'src/firebase.js', null, 'C13 : _MV_GUARD_FLOORS introuvable — contrôle des gardes non effectué.'); return; }
  const floors = [...m[1].matchAll(/([\w_]+)\s*:/g)].map(x => x[1]);
  const written = new Map();
  for (const rel of listDir('src', '.js')) {
    const c = blankJsComments(read(rel) || '');
    for (const re of [/fbSave\(\s*['"]([\w_]+)['"]/g, /_?saveData\(\s*['"]([\w_]+)['"]/g])
      for (const x of c.matchAll(re)) if (!written.has(x[1])) written.set(x[1], rel);
  }
  for (const [key, rel] of written) {
    if (floors.includes(key)) continue;
    if (Object.prototype.hasOwnProperty.call(GUARD_EXEMPT, key)) continue;
    add('ERROR', 'src/firebase.js', null, `Collection « ${key} » est écrite (${rel}) mais n'a pas de plancher dans _MV_GUARD_FLOORS → aucune protection contre un écrasement par un état vide. Ajouter un plancher, ou l'exempter explicitement dans GUARD_EXEMPT (preflight) en disant pourquoi.`);
  }
  for (const key of Object.keys(GUARD_EXEMPT)) if (floors.includes(key))
    add('WARN', 'src/firebase.js', null, `« ${key} » est à la fois exemptée (GUARD_EXEMPT) et gardée (_MV_GUARD_FLOORS) — retirer l'exemption.`);
}

// ============================================================================
//  C14 — catch {} totalement vide : l'erreur disparaît sans laisser de trace.
//        C'est le motif qui a permis au bug `.window.currentUser` de survivre
//        des mois et aux refus de lecture d'être invisibles.
// ============================================================================
function checkEmptyCatch() {
  for (const rel of listDir('src', '.js')) {
    const c = blankJsComments(read(rel) || '');
    const n = (c.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
    ratchetCount('C14_empty_catch', rel, n, 'catch {} vide (erreur avalée sans trace)',
      'Un catch doit au minimum appeler window.logError({level:\'info\', …}).');
  }
}

// ============================================================================
//  C15 — Fonction déclarée que personne n'appelle (ni JS, ni onclick, ni HTML).
// ============================================================================
function checkDeadFunctions() {
  const srcs = listDir('src', '.js');
  const corpus = srcs.map(f => read(f) || '').join('\n') + '\n' + (read('index.html') || '');
  // Deux pièges, tous deux rencontrés en vrai :
  //
  //  1. Une fonction exportée par `window.f = f` a TOUJOURS au moins deux mentions
  //     (sa déclaration + l'export) : un seuil à 1 la déclare donc vivante à tort.
  //     C'est l'angle mort qui avait laissé passer 24 fonctions mortes sur 46.
  //  2. Le pattern d'appel cross-module du projet est `window.f()` — avec un point.
  //     Un comptage qui exclut les accès membre rate donc TOUS les appels réels et
  //     déclare morte la moitié du code. (Mesuré : 55 faux positifs.)
  //
  //  D'où : on compte TOUTES les mentions, point compris, puis on retire la
  //  déclaration et les lignes d'export (2 mentions chacune : `window.f` et `f`).
  const tok = new Map();
  for (const t of corpus.match(/(?<![\w$])[A-Za-z_$][\w$]*(?![\w$])/g) || [])
    tok.set(t, (tok.get(t) || 0) + 1);
  const esc = (x) => x.replace(/\$/g, '\\$');
  for (const rel of srcs) {
    const c = blankJsComments(read(rel) || '');
    const dead = [];
    for (const m of c.matchAll(/^\s*(?:window\.)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) {
      const n = m[1];
      const exp = (corpus.match(new RegExp('window\\.' + esc(n) + '\\s*=\\s*' + esc(n) + '\\b', 'g')) || []).length;
      if ((tok.get(n) || 0) - 1 - 2 * exp <= 0 && !dead.includes(n)) dead.push(n);
    }
    ratchetList('C15_dead_fns', rel, dead, 'Fonction déclarée sans aucun appelant',
      'La supprimer (analyse de joignabilité §25.11) ou la brancher.');
  }
}

// ============================================================================
//  C16 — confirm() / alert() / prompt() natifs : prompt() est PUREMENT ET
//        SIMPLEMENT bloqué en PWA standalone iOS, confirm() peut ne pas
//        s'afficher — la fonction échoue alors en silence (cf. §22).
// ============================================================================
function checkNativeDialogs() {
  for (const rel of listDir('src', '.js')) {
    const c = blankJsComments(read(rel) || '');
    let n = 0;
    for (const kind of ['confirm', 'alert', 'prompt'])
      n += (c.match(new RegExp('(?<![\\w.$])' + kind + '\\s*\\(', 'g')) || []).length;
    ratchetCount('C16_native_dialogs', rel, n, 'Dialogue natif confirm/alert/prompt',
      'Passer par openConfirmDel / showToast / une saisie en overlay. Cf. §22.');
  }
}

// ============================================================================
//  C17 — Module sans `const DEBUG` du tout : piège dormant. Le premier
//        `if(DEBUG)` qu'on y écrira lèvera un ReferenceError qui tuera
//        silencieusement le reste du module (incident tracteur.js, §24).
//        C7 ne voit que les modules qui UTILISENT DEBUG sans le déclarer.
// ============================================================================
function checkDebugDeclared() {
  for (const rel of listDir('src', '.js')) {
    const c = stripComments(read(rel) || '');
    if (/\b(const|let|var)\s+DEBUG\b/.test(c)) continue;
    add('WARN', rel, null, 'Aucun `const DEBUG` dans ce module → le premier if(DEBUG) ajouté lèvera un ReferenceError silencieux. Déclarer en tête : const DEBUG = location.hostname === \'localhost\' || location.hostname === \'127.0.0.1\';');
  }
}

// ============================================================================
//  C18 — id dupliqué dans index.html : getElementById ne rend que le premier,
//        donc un rendu peut écrire dans le mauvais élément (cf. ocd-title/ocd-sub,
//        partagés entre la modale de détail cuvée et celle de confirmation).
// ============================================================================
function checkDuplicateIds() {
  const c = read('index.html'); if (!c) return;
  const seen = new Map();
  for (const m of blankHtmlComments(c).matchAll(/\sid="([^"]+)"/g))
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id).sort();
  ratchetList('C18_dup_ids', 'index.html', dup, 'id dupliqué',
    'getElementById ne renvoie que le premier → le second est inatteignable.');
}

// ============================================================================
//  C19 — Champ saisi par un utilisateur interpolé dans du HTML sans _escHtml /
//        _escAttr / _pilEsc. Vecteur réel : stored-XSS intra-tenant à privilège
//        asymétrique (un tractoriste saisit une anomalie → exécutée quand
//        l'ADMIN imprime l'export PDF). Cf. §8b.
// ============================================================================
const XSS_FIELDS = ['nom', 'modele', 'anomalie', 'motif', 'activite', 'conducteur', 'produit',
  'fournisseur', 'client', 'libelle', 'titre', 'commentaire', 'note', 'remarque',
  'observation', 'substance', 'cuvee', 'ref'];
function checkUnescaped() {
  const grp = '(?:' + XSS_FIELDS.join('|') + ')';
  const reTpl = new RegExp('\\$\\{\\s*([A-Za-z_$][\\w$.\\[\\]]{0,50}?\\.' + grp + ')\\s*\\}', 'g');
  const reCat = new RegExp('[\'"]\\s*\\+\\s*([A-Za-z_$][\\w$.\\[\\]]{0,50}?\\.' + grp + ')\\s*\\+\\s*[\'"]', 'g');
  for (const rel of listDir('src', '.js')) {
    const c = blankJsComments(read(rel) || '');
    let n = 0;
    for (const re of [reTpl, reCat]) {
      re.lastIndex = 0;
      for (const m of c.matchAll(re)) {
        if (/_esc|_pilEsc/.test(m[1])) continue;
        // On ne retient que ce qui atterrit vraiment dans du HTML : un textContent
        // ou un showToast n'est pas un sink (vérifié : ils passent par textContent).
        const around = c.slice(Math.max(0, m.index - 260), m.index + 160);
        if (!/<\w|innerHTML|document\.write|insertAdjacentHTML/.test(around)) continue;
        n++;
      }
    }
    ratchetCount('C19_unescaped', rel, n, 'Champ utilisateur interpolé dans du HTML sans échappement',
      'Passer par _escHtml (contenu) ou _escAttr (attribut) À L\'INTERPOLATION. Cf. §8b.');
  }
}

// ============================================================================
//  C20 — INVARIANTS ANTI-PERTE, VÉRIFIÉS EN LES EXÉCUTANT
// ----------------------------------------------------------------------------
//  Les règles précédentes lisent le code. Celle-ci l'EXÉCUTE : elle extrait les
//  fonctions du garde anti-écrasement de src/firebase.js, les fait tourner sur
//  des scénarios réels et vérifie qu'elles décident correctement.
//
//  Pourquoi : ces contrôles ont attrapé de vrais défauts pendant les livraisons
//  (un compteur qui mesurait la structure au lieu du contenu, donc un garde
//  inopérant), et ils étaient jusqu'ici jetés à la fin de chaque session. Ici,
//  ils tournent à chaque build.
//
//  Deux principes que chaque scénario contrôle :
//    • un effacement massif en UNE écriture doit être BLOQUÉ ;
//    • une suppression faite à la main, un élément à la fois, doit PASSER.
//  Le second compte autant que le premier : un garde qui crie au loup est un
//  garde qu'on finit par désactiver.
// ============================================================================
function checkGuardBehaviour() {
  const raw = read('src/firebase.js');
  if (!raw) return;
  const F = 'src/firebase.js';
  const grab = (name) => {
    const i = raw.indexOf('function ' + name + '(');
    if (i < 0) return null;
    const j = raw.indexOf('\n}', i);
    return j < 0 ? null : raw.slice(i, j + 2);
  };
  const floorsSrc = (raw.match(/var _MV_GUARD_FLOORS\s*=\s*\{[\s\S]*?\};/) || [])[0];
  const sizeSrc   = (raw.match(/function _mvDocSize\(key, val\) \{[\s\S]*?\n\}/) || [])[0];
  if (!floorsSrc || !sizeSrc) {
    add('WARN', F, null, 'C20 : _MV_GUARD_FLOORS ou _mvDocSize introuvables — les invariants anti-perte n\'ont pas pu être vérifiés.');
    return;
  }

  let FLOORS, docSize;
  try {
    FLOORS = new Function(floorsSrc + '\nreturn _MV_GUARD_FLOORS;')();
    const helpers = ['_mvIntrantsCount', '_mvPaieCount'].map(grab).filter(Boolean).join('\n');
    docSize = new Function(
      helpers + '\nfunction _mvParcProgCount(v){ return Array.isArray(v) ? v.length : 0; }\n' +
      sizeSrc + '\nreturn _mvDocSize;')();
  } catch (e) {
    add('WARN', F, null, 'C20 : le garde anti-écrasement n\'a pas pu être évalué (' + e.message + ') — contrôle ignoré.');
    return;
  }

  // Reproduction exacte de la décision de _mvBlockDestructive.
  const bloque = (key, avant, apres) =>
    Object.prototype.hasOwnProperty.call(FLOORS, key) && avant >= FLOORS[key] && apres < avant * 0.5;

  const VIDE = { produits: [], achats: [], inventaires: [], futs: [], fut_four: [], fut_ref: [], achat_four: [] };
  const PLEIN = { produits: [1, 2, 3], achats: [1, 1, 1, 1], inventaires: [1], futs: [1, 1, 1, 1, 1],
                  fut_four: ['a', 'b'], fut_ref: ['x'], achat_four: ['z'] };

  const cas = [
    // — les compteurs mesurent-ils le CONTENU ? —
    ['intrants vide compte 0 (un conteneur à clés fixes en rendrait 7)', () => docSize('intrants', VIDE) === 0],
    ['intrants plein compte ses éléments, listes de mémorisation exclues', () => docSize('intrants', PLEIN) === 13],
    ['paie compte les taux et les appoints, pas l\'historique',
      () => docSize('paie', { taux: { a: 1, b: 2, c: 3 }, taux_hist: { a: [1, 2, 3, 4] }, gnr_appoints: [1, 2] }) === 5],
    ['une collection en tableau reste mesurée par sa longueur', () => docSize('traitements', [1, 1, 1, 1, 1]) === 5],

    // — un effacement massif est-il bloqué ? —
    ['registre phyto vidé d\'un coup (40 → 0) : bloqué', () => bloque('traitements', 40, 0)],
    ['La Réserve écrasée (20 → 2) : bloqué', () => bloque('intrants', 20, 2)],
    ['rémunérations écrasées (6 → 1) : bloqué', () => bloque('paie', 6, 1)],
    ['catalogue de tâches vidé (11 → 0) : bloqué', () => bloque('taches', 11, 0)],
    ['parcelles écrasées (46 → 0) : bloqué', () => bloque('parcelles', 46, 0)],
    ['membres écrasés (8 → 0) : bloqué', () => bloque('membres', 8, 0)],

    // — une suppression légitime passe-t-elle ? —
    ['un traitement supprimé à la main (40 → 39) : passe', () => !bloque('traitements', 40, 39)],
    ['un fût retiré (20 → 19) : passe', () => !bloque('intrants', 20, 19)],
    ['un taux horaire retiré (4 → 3) : passe', () => !bloque('paie', 4, 3)],
    ['une tâche supprimée (11 → 10) : passe', () => !bloque('taches', 11, 10)],
    ['un domaine qui démarre (2 → 1) : passe, sous le plancher', () => !bloque('intrants', 2, 1)],

    // — les collections volontairement non gardées le restent-elles ? —
    ['travaux reste non gardé (dérivé, régénérable)', () => !Object.prototype.hasOwnProperty.call(FLOORS, 'travaux')],
    ['kml_polygons reste non gardé (l\'import est un REPLACE assumé)', () => !Object.prototype.hasOwnProperty.call(FLOORS, 'kml_polygons')],
  ];

  for (const [label, fn] of cas) {
    let pass = false;
    try { pass = !!fn(); } catch (e) { pass = false; }
    if (!pass) add('ERROR', F, null, `Garde anti-perte : « ${label} » ne se vérifie plus. Un scénario d'effacement n'est plus couvert, ou le garde bloque désormais une suppression légitime.`);
  }
}

// ============================================================================
//  C21 — La donnée de paie ne doit jamais toucher le disque de l'appareil.
//        C'est ce que le DPA promet au client, et c'est vérifiable.
// ============================================================================
function checkPaiePrivacy() {
  const fb = read('src/firebase.js'), app = read('src/app.js');
  if (!fb || !app) return;
  const initBlock = (fb.match(/var _initData = \{([\s\S]*?)\};/) || [])[1];
  if (initBlock && /\bpaie\s*:/.test(initBlock))
    add('ERROR', 'src/firebase.js', null, 'La collection `paie` figure dans _initData : les rémunérations seraient poussées comme des données par défaut. Elle doit en rester absente.');
  const wBlock = (app.match(/const W = \{([\s\S]*?)\n  \};/) || [])[1];
  if (wBlock && /\bpaie\s*:/.test(wBlock))
    add('ERROR', 'src/app.js', null, 'La collection `paie` figure dans la table de saveData : les rémunérations descendraient dans le localStorage de l\'appareil. Elle doit y rester absente (§11).');
  const rt = (blankJsComments(fb).match(/var FB_REALTIME\s*=\s*\[([\s\S]*?)\];/) || [])[1] || '';
  if (/'paie'/.test(rt))
    add('WARN', 'src/firebase.js', null, '`paie` est passée en temps réel : son document est admin-only en LECTURE, donc onSnapshot sera refusé pour tout non-admin et le listener se détachera. La laisser dans FB_STATIC.');
}

// ============================================================================
//  C23 — UN AIDE PRIVE APPELE MAIS PAS DECLARE
//  ─────────────────────────────────────────────────────────────────────────
//  ⚠️⚠️⚠️ VECU LE 17/08, EN PRODUCTION : `_opEmo is not defined` a casse TOUT
//  l'ecran Pilotage (promesse rejetee, plus un clic possible). J'avais supprime
//  la fonction en cherchant ses usages sous d'autres formes, sans chercher
//  `_opEmo(` lui-meme. Meme famille deux heures plus tot avec `_agtIco`.
//
//  ★★ NI `node --check` NI ESLINT NE VOIENT CA : la syntaxe est valable, et
//  `no-undef` est desactive dans eslint.config.js — a raison, parce que les
//  modules s'appellent entre eux par le `window`. Mais la CONVENTION du projet
//  est claire : un identifiant qui commence par `_` est PRIVE AU MODULE.
//  On peut donc verifier exactement ca, sans faux positifs :
//     tout `_xxx(` appele doit etre declare dans le meme fichier, ou importe,
//     ou explicitement pris sur `window.`.
//  ★ C'est la regle qui manquait, et elle aurait attrape les deux incidents.
function checkHelpersOrphelins() {
  const CORPUS_JS = listDir('src', '.js').map(x => read(x) || '').join('\n');
  for (const f of listDir('src', '.js')) {
    const brut = read(f); if (!brut) continue;
    const src = stripComments(brut);
    /* Declare dans le fichier : function _x, var/let/const _x =, ou _x = function */
    const declares = new Set();
    for (const re of [/function\s+(_[A-Za-z0-9_$]+)/g,
                      /(?:var|let|const)\s+(_[A-Za-z0-9_$]+)\s*=/g,
                      /,\s*(_[A-Za-z0-9_$]+)\s*=/g,   /* 2e declarateur : var _a=..,_b=.. */
                      /(_[A-Za-z0-9_$]+)\s*=\s*(?:function|\()/g,
                      /window\.(_[A-Za-z0-9_$]+)/g]) {
      let m; while ((m = re.exec(src))) declares.add(m[1]);
    }
    /* ⚠️ Un aide expose par un AUTRE module (`window._openOv = _openOv`) est
       legitimement appelable ici. On lit donc les expositions de tout le
       corpus — sinon on crie au loup sur des appels parfaitement valides. */
    let me; const reW = /window\.(_[A-Za-z0-9_$]+)\s*=/g;
    while ((me = reW.exec(CORPUS_JS))) declares.add(me[1]);
    /* Importe depuis un autre module */
    const imp = src.match(/import\s*\{([\s\S]*?)\}\s*from/g) || [];
    for (const bloc of imp)
      for (const n of bloc.match(/_[A-Za-z0-9_$]+/g) || []) declares.add(n);
    /* Appele */
    const appels = new Set();
    let m2; const reA = /(?<![.\w$])(_[A-Za-z0-9_$]+)\s*\(/g;
    while ((m2 = reA.exec(src))) appels.add(m2[1]);
    const orphelins = [...appels].filter(n => !declares.has(n));
    for (const n of orphelins)
      add('ERROR', f, null, 'C23 : `' + n + '()` est appele mais n\'est declare ni ici, '
        + 'ni dans un import, ni sur window. Un appel a une fonction disparue casse '
        + 'l\'ecran entier, et ni node --check ni ESLint ne le voient.');
  }
}

//  C22 — L'ACCOMPAGNEMENT NE DOIT PAS DECROCHER DU CODE
//        L'aide contextuelle (MV_AIDE) et la visite guidee (_mvtSteps) decrivent
//        des ecrans. Quand un ecran bouge, elles mentent — et en SILENCE :
//        document.querySelector() qui ne trouve rien rend null, il ne leve pas,
//        donc le catch de repli ne se declenche jamais.
//        Vecu : la cle d'onglet `ecf` a disparu au regroupement du Pilotage ;
//        la visite publique a continue a la demander, spotlight pose au hasard,
//        sur le lien de demo mis en ligne.
//        Ce controle ne juge AUCUN texte — il ne verifie que des faits
//        mecaniques : une cle existe, un selecteur existe, une ancre existe.
// ============================================================================

// Pages sans fiche d'aide, volontairement : elles ne sont pas destinees au client.
// Pour en exempter une de plus, il faut ecrire POURQUOI.
const AIDE_EXEMPT = {
  'admin-gt': 'panneau GUERETTECH — hors perimetre client',
  'chat':     'ecran interne, pas un module du dock',
};
// window.X y designe un objet du navigateur, pas une fonction de l'app.
const WIN_NATIF = new Set(['scrollTo', 'open', 'location', 'setTimeout', 'addEventListener', 'document', 'print', 'innerWidth']);

function checkAideEtVisite() {
  const app = read('src/app.js'), ut = read('src/utils.js'), pil = read('src/pilotage.js');
  const idx = read('index.html');
  const jsFiles = listDir('src', '.js');
  const corpus = jsFiles.map(f => read(f) || '').join('\n') + '\n' + (idx || '');

  // ── a) Une cle d'onglet RETIREE ne doit plus etre demandee ailleurs. ──
  //    _PIL_TAB_MIGR est la liste des cles mortes : elle ne sert qu'a migrer
  //    l'onglet memorise d'un client. Les citer ailleurs, c'est viser le vide.
  if (pil) {
    const migr = (blankJsComments(pil).match(/var _PIL_TAB_MIGR\s*=\s*\{([^}]*)\}/) || [])[1];
    const mortes = migr ? [...migr.matchAll(/(\w+)\s*:/g)].map(m => m[1]) : [];
    for (const f of jsFiles) {
      if (f === 'src/pilotage.js') continue;
      const c = read(f); if (!c) continue;
      const blanked = blankJsComments(c);
      for (const k of mortes) {
        for (const m of blanked.matchAll(new RegExp(`['"]${k}['"]`, 'g'))) {
          add('ERROR', f, lineOf(c, m.index),
            `Onglet du Pilotage : la cle « ${k} » a ete RETIREE (elle ne figure plus que dans _PIL_TAB_MIGR, qui la migre). Ce fichier la demande encore — querySelector rendra null sans lever, et le repli ne se declenchera jamais.`);
        }
      }
    }
  }

  // ── b) Tout selecteur d'onglet ecrit en dur doit designer un onglet reel. ──
  if (pil) {
    const valid = (blankJsComments(pil).match(/var _PIL_VALID_TAB\s*=\s*\{([^}]*)\}/) || [])[1] || '';
    const okKeys = new Set([...valid.matchAll(/(\w+)\s*:/g)].map(m => m[1]));
    if (okKeys.size) {
      for (const f of jsFiles.concat(['index.html'])) {
        if (f === 'src/pilotage.js') continue;
        const c = read(f); if (!c) continue;
        const blanked = f.endsWith('.html') ? blankHtmlComments(c) : blankJsComments(c);
        for (const m of blanked.matchAll(/#pil-tabs\s*\[data-tab=["']([a-z]+)["']/g)) {
          if (!okKeys.has(m[1]))
            add('ERROR', f, lineOf(c, m.index),
              `Selecteur d'onglet du Pilotage inconnu : « ${m[1]} » n'est pas dans _PIL_VALID_TAB.`);
        }
      }
    }
  }

  // ── c) et d) La visite guidee vise des ecrans qui doivent exister. ──
  if (app) {
    const i0 = app.indexOf('var _mvtSteps = [');
    if (i0 < 0) {
      add('WARN', 'src/app.js', null, 'C22 : _mvtSteps introuvable — les selecteurs de la visite guidee n\'ont pas pu etre verifies.');
    } else {
      const j0 = app.indexOf('\n];', i0);
      const blk = app.slice(i0, j0 < 0 ? app.length : j0);
      const base = lineOf(app, i0);

      // ⚠ Le corpus de recherche EXCLUT le bloc lui-meme : sinon un selecteur
      //   ecrit dans _mvtSteps serait sa propre preuve d'existence, et ce
      //   controle ne detecterait jamais rien. Defaut trouve par contre-epreuve.
      const appHorsVisite = app.slice(0, i0) + app.slice(j0 < 0 ? app.length : j0);
      const corpusSel = jsFiles.map(f => f === 'src/app.js' ? appHorsVisite : (read(f) || '')).join('\n') + '\n' + (idx || '');

      // c) chaque #id et .classe cite doit exister quelque part dans les sources
      const sels = new Set();
      for (const m of blk.matchAll(/(?:clickSel|sel)\s*:\s*(\[[^\]]*\]|'[^']*')/g))
        for (const s of m[1].matchAll(/'([^']*)'/g)) sels.add(s[1]);
      for (const s of sels) {
        for (const t of s.matchAll(/[#.]([A-Za-z][\w-]*)/g)) {
          const tok = t[1];
          if (!new RegExp(`(?<![\\w-])${tok}(?![\\w-])`).test(corpusSel))
            add('ERROR', 'src/app.js', base,
              `Visite guidee : le selecteur « ${s} » vise « ${tok} », qui n'existe nulle part dans les sources. Le spotlight se posera au hasard, sans une erreur.`);
        }
      }

      // d) chaque fonction de navigation appelee doit etre definie
      for (const m of blk.matchAll(/window\.(\w+)/g)) {
        const fn = m[1];
        if (WIN_NATIF.has(fn)) continue;
        if (!new RegExp(`(?:window\\.${fn}\\s*=|function\\s+${fn}\\b|var\\s+${fn}\\b)`).test(corpus))
          add('ERROR', 'src/app.js', lineOf(app, i0 + m.index),
            `Visite guidee : window.${fn}() n'est definie nulle part. L'etape ne naviguera pas, et rien ne le signalera.`);
      }
    }
  }

  // ── e) Chaque fiche d'aide doit etre atteignable, chaque page doit en avoir une. ──
  //    _mvAideFiche() lit l'id de la page active : une fiche sans page #page-<cle>
  //    est ecrite mais ne s'ouvrira jamais.
  if (ut && idx) {
    const i1 = ut.indexOf('var MV_AIDE = {');
    if (i1 < 0) {
      add('WARN', 'src/utils.js', null, 'C22 : MV_AIDE introuvable — la couverture de l\'aide n\'a pas pu etre verifiee.');
    } else {
      const j1 = ut.indexOf('\nvar MV_AIDE_DEFAUT', i1);
      const ab = ut.slice(i1, j1 < 0 ? ut.length : j1);
      const marks = [...ab.matchAll(/^  ([a-z][\w-]*):\s*\{/gm)];
      const fiches = marks.map(m => m[1]);
      const pages = new Set([...idx.matchAll(/id="page-([a-z0-9-]+)"/g)].map(m => m[1]));
      const guide = read('public/guide.html');
      const ancres = guide ? new Set([...guide.matchAll(/id="([^"]+)"/g)].map(m => m[1])) : null;

      for (let n = 0; n < marks.length; n++) {
        const k = marks[n][1];
        const seg = ab.slice(marks[n].index, n + 1 < marks.length ? marks[n + 1].index : ab.length);
        const ligne = lineOf(ut, i1 + marks[n].index);
        if (!pages.has(k))
          add('ERROR', 'src/utils.js', ligne,
            `Fiche d'aide « ${k} » sans page correspondante (#page-${k}) : _mvAideFiche() lit l'id de la page active, cette fiche est donc inatteignable.`);
        const anc = (seg.match(/ancre:\s*'([^']*)'/) || [])[1];
        if (ancres && anc && !ancres.has(anc))
          add('ERROR', 'src/utils.js', ligne,
            `Fiche « ${k} » : l'ancre « #${anc} » n'existe pas dans public/guide.html — le bouton « Guide complet » ouvrira la page en haut, pas au bon endroit.`);
      }
      for (const p of pages) {
        if (fiches.includes(p) || AIDE_EXEMPT[p]) continue;
        add('WARN', 'src/utils.js', null,
          `La page #page-${p} n'a pas de fiche dans MV_AIDE : son bouton « ? Aide » renverra au guide general. Ajouter la fiche, ou inscrire la page dans AIDE_EXEMPT avec sa raison.`);
      }
    }
  }
}

// ============================================================================
//  Exécution + rapport
// ============================================================================
// ============================================================================
//  C23 — TOUT CE QU'UN ATTRIBUT HTML NOMME DOIT ETRE JOIGNABLE DEPUIS window
//        C6 ne regarde que le PREMIER identifiant du gestionnaire, et seulement
//        s'il est suivi d'une parenthese — il ecarte meme explicitement tout ce
//        qui contient un point. C23 lit le CORPS ENTIER.
//
//        Vecu le 13/08, fiche membre refondue : les neuf fonctions _emhX etaient
//        exposees, l'ETAT ne l'etait pas.
//            var _EMH = {...};                     // portee du MODULE
//            oninput="_EMH.d=this.value;_emhEff()" // portee GLOBALE
//        Un `var` de haut niveau d'un module ES n'est PAS sur window. Au premier
//        caractere tape : « _EMH is not defined ». C6 n'a rien vu — `_EMH.d`
//        contient un point, et n'est pas suivi d'une parenthese.
//        ⚠️ Exporter les FONCTIONS ne suffit pas : il faut exporter tout ce
//        qu'un attribut nomme, variables d'etat comprises.
//
//        Le controle ne juge rien d'autre qu'un fait mecanique : cet identifiant
//        est-il assigne a window quelque part, oui ou non.
// ============================================================================
const C23_GLOB = new Set(['window', 'document', 'console', 'Math', 'JSON', 'Object', 'Array',
  'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Promise', 'Map', 'Set', 'Error',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'localStorage', 'sessionStorage', 'navigator', 'location', 'history', 'alert', 'confirm', 'prompt']);

function checkHandlerScope() {
  const allJs = listDir('src', '.js');
  // Ce qui est joignable : l'union de ce que TOUS les fichiers assignent a
  // window. Un gestionnaire de reglages.js peut nommer une fonction exposee par
  // app.js — ne regarder qu'un fichier fabriquerait de faux positifs.
  const exposed = new Set();
  for (const rel of allJs) {
    const raw = read(rel); if (!raw) continue;
    const c = blankJsComments(raw);
    let m;
    const r1 = /window\.([a-zA-Z_$][\w$]*)\s*=(?!=)/g;
    while ((m = r1.exec(c))) exposed.add(m[1]);
    const r2 = /window\[\s*['"]([a-zA-Z_$][\w$]*)['"]\s*\]\s*=(?!=)/g;
    while ((m = r2.exec(c))) exposed.add(m[1]);
    const r3 = /Object\.assign\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g;
    while ((m = r3.exec(c))) for (const km of m[1].matchAll(/([a-zA-Z_$][\w$]*)\s*[:,}]/g)) exposed.add(km[1]);
    // Une fonction declaree dans index.html vit deja dans la portee globale.
  }
  const rawHtml = read('index.html');
  if (rawHtml) {
    const h = blankHtmlComments(rawHtml);
    for (const m of h.matchAll(/<script(?![^>]*\btype\s*=\s*["']module)[^>]*>([\s\S]*?)<\/script>/gi))
      for (const fm of m[1].matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)) exposed.add(fm[1]);
  }

  const targets = [['index.html', rawHtml ? blankHtmlComments(rawHtml) : null]];
  for (const rel of allJs) { const raw = read(rel); targets.push([rel, raw ? blankJsComments(raw) : null]); }
  // Le corps du gestionnaire s'arrete au premier guillemet non echappe : c'est
  // aussi la ou une concatenation JS coupe la chaine, donc on ne lit jamais que
  // du code litteral, jamais un morceau reconstruit.
  const HANDLER = /on(?:click|change|input|submit|blur|focus|keydown|keyup|mousedown|touchstart)\s*=\s*\\?["'`]([^"'`\\]*(?:\\.[^"'`\\]*)*)/g;
  // Identifiant EN POSITION D'USAGE : suivi d'un appel ou d'un acces propriete.
  // Le caractere qui precede exclut les proprietes (a.b) et l'interieur des
  // chaines ('texte'), qui ne sont pas des references a resoudre.
  const IDENT = /(^|[^.\w$'"`])([a-zA-Z_$][\w$]*)\s*(?=\(|\.|\s*=(?!=))/g;
  for (const [rel, c] of targets) {
    if (!c) continue;
    const orphans = new Set();
    let m;
    while ((m = HANDLER.exec(c))) {
      const body = m[1];
      // Variables declarees DANS le gestionnaire : elles s'y resolvent seules.
      const local = new Set([...body.matchAll(/\b(?:var|let|const)\s+([a-zA-Z_$][\w$]*)/g)].map(x => x[1]));
      let im;
      const rx = new RegExp(IDENT.source, 'g');
      while ((im = rx.exec(body))) {
        const id = im[2];
        if (JS_KW.has(id) || C23_GLOB.has(id) || local.has(id) || exposed.has(id)) continue;
        orphans.add(id);
      }
    }
    ratchetList('C23_handler_scope', rel, [...orphans],
      'Identifiant nomme dans un gestionnaire inline mais absent de window (ReferenceError au clic ou a la frappe)',
      'L\'exposer : window.X = X. Exporter les fonctions ne suffit pas — l\'etat aussi doit traverser.');
  }
}

// ============================================================================
//  C24 — LE HTML CONSTRUIT A LA MAIN (cliquet XSS, lot SEC-7)
// ----------------------------------------------------------------------------
//  C19 surveille DIX-HUIT noms de champs (nom, modele, anomalie...). C24 ne
//  part pas d'une liste de noms : il part du HTML. Toute valeur posee dans un
//  fragment de balisage est examinee, quel que soit son nom.
//
//  ⚠️ CE QUE LA MESURE A CHANGE DANS LA REGLE. Le lot demandait « toute
//  interpolation ${…} dans un litteral affecte a .innerHTML ». Compte fait sur
//  le depot : 461 puits HTML, dont SEULEMENT 32 recoivent directement un
//  gabarit a substitution (7 %). 209 recoivent une concatenation, 73 une
//  variable nue construite plus haut, et huit modules sur douze n'utilisent
//  AUCUN gabarit (admin-gt, cave, pilotage, planning, reserve, utils,
//  firebase, onboarding : 0 substitution). Un controle ancre sur le point
//  d'affectation aurait donc regarde 7 % du risque en se lisant comme un
//  succes. L'ancre est donc le FRAGMENT HTML, pas le puits : partout ou une
//  chaine contient du balisage, on regarde ce qu'on y insere.
//
//  Trois volets, du plus grave au plus diffus :
//    a) le MAUVAIS echappeur dans un slot JS  — liste nominative (defaut)
//    b) un slot JS sans aucun echappement     — compteur (dette)
//    c) une substitution ${…} non couverte    — compteur (dette)
//
//  ★★★ POURQUOI (a) EST UN DEFAUT ET PAS DE LA DETTE. Dans
//  onclick="fn('VALEUR')", le navigateur DECODE les entites HTML AVANT de
//  compiler le JavaScript. _escHtml rend l'apostrophe en &#39; ; l'attribut la
//  redonne telle quelle au moteur JS, qui y voit une apostrophe fermante.
//  L'echappement n'est pas insuffisant, il est DEFAIT. C'est precisement pour
//  ce cas que _escAttr existe (double l'antislash AVANT de traiter le HTML).
// ============================================================================

// --- lexeur minimal : rend un MASQUE de meme longueur ou commentaires,
//     contenus de chaines, de gabarits et de regex sont blanchis (positions et
//     lignes intactes), plus la liste des substitutions ${…}.
//     Verifie : les 12 masques repassent `node --check --input-type=module`.
const RE_PREV_REGEX = /[({[,;:=!&|?+\-*%~^<>]$/;
const RE_KW_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|case|do|else|yield|await)$/;
function lexJs(src) {
  const n = src.length, mask = src.split(''), subs = [];
  const blank = (i) => { if (i < n && src[i] !== '\n') mask[i] = ' '; };
  let i = 0, prev = '';
  const tplStack = [], subStack = [];
  const pushPrev = (ch) => { prev = (prev + ch).slice(-12); };
  function eatTplText() {
    while (i < n) {
      if (src[i] === '\\') { blank(i); blank(i + 1); i += 2; continue; }
      if (src[i] === '`') { i++; return 'close'; }
      if (src[i] === '$' && src[i + 1] === '{') { subStack.push({ start: i + 2, braces: 0 }); i += 2; return 'sub'; }
      blank(i); i++;
    }
    return 'eof';
  }
  while (i < n) {
    const c = src[i], c2 = src[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && src[i] !== '\n') { blank(i); i++; } continue; }
    if (c === '/' && c2 === '*') {
      blank(i); blank(i + 1); i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { blank(i); i++; }
      if (i < n) { blank(i); blank(i + 1); i += 2; }
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { blank(i); blank(i + 1); i += 2; continue; }
        if (src[i] === '\n') break;
        blank(i); i++;
      }
      if (i < n) i++;
      pushPrev(q); continue;
    }
    if (c === '`') { tplStack.push(i); i++; if (eatTplText() === 'close') tplStack.pop(); pushPrev('`'); continue; }
    if (c === '{') { if (subStack.length) subStack[subStack.length - 1].braces++; pushPrev(c); i++; continue; }
    if (c === '}') {
      const cur = subStack[subStack.length - 1];
      if (cur && cur.braces === 0) {
        subs.push({ start: cur.start, end: i });
        subStack.pop(); i++;
        if (eatTplText() === 'close') tplStack.pop();
        pushPrev('}'); continue;
      }
      if (cur) cur.braces--;
      pushPrev(c); i++; continue;
    }
    if (c === '/' && (prev === '' || RE_PREV_REGEX.test(prev) || RE_KW_REGEX.test(prev))) {
      i++;
      let inClass = false;
      while (i < n) {
        if (src[i] === '\\') { blank(i); blank(i + 1); i += 2; continue; }
        if (src[i] === '[') { inClass = true; blank(i); i++; continue; }
        if (src[i] === ']') { inClass = false; blank(i); i++; continue; }
        if (src[i] === '/' && !inClass) { i++; break; }
        if (src[i] === '\n') break;
        blank(i); i++;
      }
      while (i < n && /[a-z]/.test(src[i])) i++;
      pushPrev('/'); continue;
    }
    if (!/\s/.test(c)) pushPrev(c);
    i++;
  }
  return { mask: mask.join(''), subs };
}

// --- ou atterrit la valeur ? On rejoue le balisage deja ecrit AVANT elle.
//     'text' | 'attr' (entre guillemets) | 'attr-nu' | 'js' (chaine JS dans un
//     on*) | 'onattr' | 'tag'.
function htmlCtx(t) {
  let st = 'text', quote = '', attr = '', jsq = '';
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (st === 'text') { if (c === '<') { st = 'tag'; attr = ''; } continue; }
    if (st === 'tag') {
      if (c === '>') { st = 'text'; continue; }
      if (c === '=') {
        const mm = /([A-Za-z_:][\w:.-]*)\s*$/.exec(t.slice(0, i));
        attr = mm ? mm[1].toLowerCase() : '';
        let j = i + 1; while (j < t.length && /\s/.test(t[j])) j++;
        if (t[j] === '"' || t[j] === "'") { quote = t[j]; st = 'attr'; i = j; }
        else { quote = ''; st = 'attr'; i = j - 1; }
      }
      continue;
    }
    if (st === 'attr') {
      if (quote && c === quote) { st = 'tag'; jsq = ''; continue; }
      if (!quote && /[\s>]/.test(c)) { st = c === '>' ? 'text' : 'tag'; continue; }
      if (/^on[a-z]+$/.test(attr)) {
        if (jsq) { if (c === jsq && t[i - 1] !== '\\') jsq = ''; }
        else if (c === "'" || c === '"') jsq = c;
      }
    }
  }
  if (st === 'attr' && /^on[a-z]+$/.test(attr)) return { kind: jsq ? 'js' : 'onattr', attr };
  if (st === 'attr') return { kind: quote ? 'attr' : 'attr-nu', attr };
  return { kind: st === 'tag' ? 'tag' : 'text', attr };
}

// --- classificateur d'expression -------------------------------------------
//  Recursif, JAMAIS de regex sur une structure imbriquee : `[^)]*` s'arreterait
//  a la premiere parenthese fermante de f(g(x)) ou de (typeof x==='function'?…)
//  (piege n°3 du lot). Le decoupage se fait sur le MASQUE, a profondeur zero.
const C24_ESC = new Set(['_escHtml', '_escAttr', '_pilEsc', '_docsEsc']);
const C24_NUM_FNS = new Set(['Number', 'parseInt', 'parseFloat', 'Math.round', 'Math.max', 'Math.min',
  'Math.abs', 'Math.floor', 'Math.ceil', 'Math.sqrt', 'Math.pow']);
const C24_NUM_METH = new Set(['toFixed', 'length', 'indexOf', 'lastIndexOf', 'charCodeAt',
  'getTime', 'getFullYear', 'getMonth', 'getDate', 'getDay', 'getHours', 'getMinutes', 'size']);
const C24_PASS_RECV = new Set(['join', 'filter', 'slice', 'sort', 'reverse', 'concat', 'flat']);
const C24_PASS_CB = new Set(['map', 'flatMap']);
const C24_NUMERIC_ONLY = /^[\s\d.+\-*/%()<>=!&|?:]*$/;

function c24SplitTop(m, from, to, sep) {
  const parts = []; let p = 0, b = 0, a = 0, st = from;
  for (let i = from; i < to; i++) {
    const c = m[i];
    if (c === '(') p++; else if (c === ')') p--;
    else if (c === '[') b++; else if (c === ']') b--;
    else if (c === '{') a++; else if (c === '}') a--;
    else if (p === 0 && b === 0 && a === 0) {
      const w = sep(m, i);
      if (w) { parts.push([st, i]); st = i + w; i += w - 1; }
    }
  }
  parts.push([st, to]);
  return parts;
}
function c24Trim(m, s, e) {
  while (s < e && /\s/.test(m[s])) s++;
  while (e > s && /\s/.test(m[e - 1])) e--;
  return [s, e];
}
function c24StripParens(m, s, e) {
  for (;;) {
    [s, e] = c24Trim(m, s, e);
    if (m[s] !== '(' || m[e - 1] !== ')') return [s, e];
    let d = 0, ok = true;
    for (let i = s; i < e; i++) {
      if (m[i] === '(') d++;
      else if (m[i] === ')') { d--; if (d === 0 && i < e - 1) { ok = false; break; } }
    }
    if (!ok) return [s, e];
    s++; e--;
  }
}
// Le ? de premier niveau et le : qui lui repond (en sautant les ternaires imbriques).
function c24Ternary(m, s, e) {
  let p = 0, b = 0, a = 0, q = -1;
  for (let i = s; i < e; i++) {
    const c = m[i];
    if (c === '(') p++; else if (c === ')') p--;
    else if (c === '[') b++; else if (c === ']') b--;
    else if (c === '{') a++; else if (c === '}') a--;
    else if (p === 0 && b === 0 && a === 0 && c === '?' && m[i + 1] !== '.' && m[i + 1] !== '?') { q = i; break; }
  }
  if (q < 0) return null;
  let lvl = 0; p = b = a = 0;
  for (let i = q + 1; i < e; i++) {
    const c = m[i];
    if (c === '(') p++; else if (c === ')') p--;
    else if (c === '[') b++; else if (c === ']') b--;
    else if (c === '{') a++; else if (c === '}') a--;
    else if (p === 0 && b === 0 && a === 0) {
      if (c === '?' && m[i + 1] !== '.' && m[i + 1] !== '?') lvl++;
      else if (c === ':') { if (lvl === 0) return [q, i]; lvl--; }
    }
  }
  return null;
}
const c24IsOr = (m, i) => ((m[i] === '|' && m[i + 1] === '|') || (m[i] === '?' && m[i + 1] === '?')) ? 2 : 0;
const c24IsAnd = (m, i) => (m[i] === '&' && m[i + 1] === '&') ? 2 : 0;
const c24IsPlus = (m, i) => (m[i] === '+' && m[i + 1] !== '+' && !'+=!<>'.includes(m[i - 1] || '')) ? 1 : 0;
const c24IsComma = (m, i) => m[i] === ',' ? 1 : 0;

// Corps d'une callback `x => EXPR` (bornes de EXPR).
function c24ArrowBody(m, s, e) {
  const ar = m.slice(s, e).indexOf('=>');
  return ar < 0 ? [s, e] : c24Trim(m, s + ar + 2, e);
}

/**
 * @returns {null|string} null si la valeur est sûre, sinon le motif fautif.
 * `safeFns` : noms d'aides dont le rendu est deja prouve sûr (voir c24SafeFns).
 */
function c24Unsafe(raw, m, s, e, safeFns, depth) {
  depth = depth || 0;
  if (depth > 10) return null;                       // garde-fou : on ne crie pas sur un cas tordu
  [s, e] = c24StripParens(m, s, e);
  if (s >= e) return null;
  const txt = raw.slice(s, e).trim();
  const mm = m.slice(s, e).trim();
  if (!txt) return null;

  // 1. litteral seul, du debut a la fin
  if (/^['"`]/.test(mm)) {
    const q = mm[0]; let d = 0, single = true;
    for (let i = s; i < e; i++) if (m[i] === q) { d++; if (d === 2 && i < e - 1) { single = false; break; } }
    if (single && d === 2 && !(q === '`' && raw.slice(s, e).includes('${'))) return null;
  }
  if (/^(true|false|null|undefined)$/.test(txt)) return null;
  if (C24_NUMERIC_ONLY.test(mm)) return null;        // arithmetique pure : aucun identifiant

  // 2. ternaire : seules les DEUX BRANCHES portent la valeur (piege n°2 du lot).
  //    La condition ne s'affiche pas — la juger produirait un faux positif sur
  //    ${x ? _escHtml(a) : ''}, ou `x` n'atteint jamais l'ecran.
  const t = c24Ternary(m, s, e);
  if (t) return c24Unsafe(raw, m, t[0] + 1, t[1], safeFns, depth + 1)
           || c24Unsafe(raw, m, t[1] + 1, e, safeFns, depth + 1);

  // 3. || et ?? : les deux cotes peuvent etre rendus
  let parts = c24SplitTop(m, s, e, c24IsOr);
  if (parts.length > 1) {
    for (const [ps, pe] of parts) { const r = c24Unsafe(raw, m, ps, pe, safeFns, depth + 1); if (r) return r; }
    return null;
  }
  // 4. && : seule la partie DROITE est rendue
  parts = c24SplitTop(m, s, e, c24IsAnd);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    return c24Unsafe(raw, m, last[0], last[1], safeFns, depth + 1);
  }
  // 5. concatenation : tous les morceaux
  parts = c24SplitTop(m, s, e, c24IsPlus);
  if (parts.length > 1) {
    for (const [ps, pe] of parts) { const r = c24Unsafe(raw, m, ps, pe, safeFns, depth + 1); if (r) return r; }
    return null;
  }
  // 6. appel
  if (mm.endsWith(')')) {
    let d = 0, open = -1;
    for (let i = e - 1; i >= s; i--) {
      if (m[i] === ')') d++;
      else if (m[i] === '(') { d--; if (d === 0) { open = i; break; } }
    }
    if (open > s) {
      const callee = raw.slice(s, open).trim();
      const base = callee.replace(/^.*?([A-Za-z_$][\w$]*)$/, '$1');
      if (C24_ESC.has(base) || C24_NUM_FNS.has(callee) || C24_NUM_FNS.has(base)
          || safeFns.has(base) || safeFns.has(callee)) return null;
      const dot = callee.lastIndexOf('.');
      if (dot > 0) {
        const meth = callee.slice(dot + 1).trim();
        if (C24_NUM_METH.has(meth)) return null;
        if (C24_PASS_RECV.has(meth)) return c24Unsafe(raw, m, s, s + dot, safeFns, depth + 1);
        if (C24_PASS_CB.has(meth)) {
          const args = c24SplitTop(m, open + 1, e - 1, c24IsComma);
          if (!args.length) return null;
          const [bs, be] = c24ArrowBody(m, args[0][0], args[0][1]);
          return c24Unsafe(raw, m, bs, be, safeFns, depth + 1);
        }
      }
      return 'appel non prouve : ' + callee.replace(/\s+/g, '') + '()';
    }
  }
  // 7. indexation : on juge le receveur
  if (mm.endsWith(']')) {
    let d = 0, open = -1;
    for (let i = e - 1; i >= s; i--) { if (m[i] === ']') d++; else if (m[i] === '[') { d--; if (d === 0) { open = i; break; } } }
    if (open > s) return c24Unsafe(raw, m, s, open, safeFns, depth + 1);
  }
  // 8. identifiant / acces membre
  const last = txt.split('.').pop().trim();
  if (C24_NUM_METH.has(last)) return null;
  if (safeFns.has(txt) || safeFns.has(txt.split('.')[0])) return null;
  if (/^[A-Za-z_$][\w$.]*$/.test(txt)) return 'valeur nue : ' + txt;
  return 'non reconnu : ' + txt.replace(/\s+/g, ' ').slice(0, 50);
}

// --- LES AIDES DEJA PROUVEES SÛRES, DEDUITES — PAS ECRITES A LA MAIN --------
//  Piege n°1 du lot : « une variable deja echappee en amont et reutilisee →
//  faux positif, a declarer ». Une liste ecrite a la main derive : elle vieillit
//  sans que personne s'en apercoive, et elle est exactement l'endroit ou l'on
//  glisse un nom pour faire taire une alerte. Elle est donc CALCULEE : une aide
//  dont TOUS les `return` sont sûrs est elle-meme sûre, et on recommence
//  jusqu'a ce que l'ensemble ne bouge plus (point fixe, 6 tours au plus).
//  Consequence voulue : une aide qui cesse d'echapper sort de l'ensemble toute
//  seule, et tous ses appels redeviennent rouges.
function c24SafeFns(corpus) {
  const bodies = new Map();
  for (const { rel, src, mask } of corpus) {
    const re = /(?:^|\n)\s*(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    for (const mt of mask.matchAll(re)) {
      const name = mt[1];
      let i = mask.indexOf('{', mt.index + mt[0].length);
      if (i < 0) continue;
      let d = 0, j = i;
      for (; j < mask.length; j++) { if (mask[j] === '{') d++; else if (mask[j] === '}') { d--; if (!d) break; } }
      if (bodies.has(name)) { bodies.set(name, null); continue; }   // homonyme : on ne tranche pas
      bodies.set(name, { rel, src, mask, s: i, e: j });
    }
  }
  const safe = new Set();
  for (let tour = 0; tour < 6; tour++) {
    let grew = false;
    for (const [name, b] of bodies) {
      if (!b || safe.has(name)) continue;
      let ok = true, seen = 0;
      for (const rt of b.mask.slice(b.s, b.e).matchAll(/\breturn\b/g)) {
        const s0 = b.s + rt.index + 6;
        let p = 0, k = s0;
        for (; k < b.e; k++) {
          const c = b.mask[k];
          if (c === '(') p++; else if (c === ')') { if (!p) break; p--; }
          else if (c === '[') p++; else if (c === ']') { if (!p) break; p--; }
          else if (c === '{') p++; else if (c === '}') { if (!p) break; p--; }
          else if (c === ';' && !p) break;
        }
        if (k <= s0) continue;                       // `return;` nu
        seen++;
        if (c24Unsafe(b.src, b.mask, s0, k, safe, 0)) { ok = false; break; }
      }
      if (ok && seen) { safe.add(name); grew = true; }
    }
    if (!grew) break;
  }
  return safe;
}

// --- les fragments HTML d'un fichier et les valeurs qu'on y insere ----------
const C24_HTML = /<\s*\/?[a-zA-Z][\w-]*(?:[\s/>]|$)/;
function c24Points(src, mask, subs) {
  const pts = [];
  const litSpans = [];
  let i = 0;
  while (i < mask.length) {
    const c = mask[i];
    if (c === "'" || c === '"') {
      let j = i + 1; while (j < mask.length && mask[j] !== c) j++;
      litSpans.push({ q: c, s: i, e: j }); i = j + 1; continue;
    }
    if (c === '`') {
      let j = i + 1, d = 0;
      while (j < mask.length) {
        if (mask[j] === '$' && mask[j + 1] === '{') { d++; j += 2; continue; }
        if (mask[j] === '}' && d > 0) { d--; j++; continue; }
        if (mask[j] === '`' && d === 0) break;
        j++;
      }
      litSpans.push({ q: '`', s: i, e: j }); i = j + 1; continue;
    }
    i++;
  }
  // ---- gabarits
  for (const L of litSpans) {
    if (L.q !== '`') continue;
    const mine = subs.filter(x => x.start > L.s && x.end < L.e).sort((a, b) => a.start - b.start);
    let stat = '', p = L.s + 1;
    for (const x of mine) { stat += src.slice(p, x.start - 2); p = x.end + 1; }
    stat += src.slice(p, L.e);
    if (!C24_HTML.test(stat)) continue;
    let before = ''; p = L.s + 1;
    for (const x of mine) {
      before += src.slice(p, x.start - 2);
      const k = htmlCtx(before);
      // un gabarit imbrique est juge par SES propres substitutions, pas en bloc
      if (!mask.slice(x.start, x.end).includes('`'))
        pts.push({ s: x.start, e: x.end, kind: k.kind, attr: k.attr, via: 'gabarit' });
      before += '\u0001'; p = x.end + 1;
    }
  }
  // ---- concatenations : le fragment est la chaine, les valeurs sont les
  //      operandes non litteraux du + de premier niveau qui l'entoure.
  const done = new Set();
  for (const L of litSpans) {
    if (L.q === '`' || !C24_HTML.test(src.slice(L.s + 1, L.e))) continue;
    const [bs, be] = c24Bounds(mask, L.s);
    const key = bs + ':' + be;
    if (done.has(key)) continue;
    done.add(key);
    let before = '';
    for (const [os, oe] of c24SplitTop(mask, bs, be, c24IsPlus)) {
      const mt = mask.slice(os, oe).trim();
      if (!mt) continue;
      if (/^['"]/.test(mt) && mt.slice(-1) === mt[0] && mt.length > 1) {
        before += src.slice(os, oe).trim().slice(1, -1); continue;
      }
      const k = htmlCtx(before);
      pts.push({ s: os, e: oe, kind: k.kind, attr: k.attr, via: 'concat' });
      before += '\u0001';
    }
  }
  return pts;
}
// Bornes de la chaine de + qui entoure l'index i (sur le masque).
function c24Bounds(mask, i) {
  let s = i, p = 0, b = 0, a = 0;
  for (; s > 0; s--) {
    const c = mask[s - 1];
    if (c === ')') p++; else if (c === '(') { if (!p) break; p--; }
    else if (c === ']') b++; else if (c === '[') { if (!b) break; b--; }
    else if (c === '}') a++; else if (c === '{') { if (!a) break; a--; }
    else if (';,:?'.includes(c) && !p && !b && !a) break;
    else if (c === '=' && !p && !b && !a && !/[=!<>]/.test(mask[s - 2] || '')) break;
    else if (/[A-Za-z]/.test(c) && !p && !b && !a && /\b(return|case|typeof|new|do|else)$/.test(mask.slice(Math.max(0, s - 9), s))) break;
  }
  let e = i; p = b = a = 0;
  for (; e < mask.length; e++) {
    const c = mask[e];
    if (c === '(') p++; else if (c === ')') { if (!p) break; p--; }
    else if (c === '[') b++; else if (c === ']') { if (!b) break; b--; }
    else if (c === '{') a++; else if (c === '}') { if (!a) break; a--; }
    else if (';,:'.includes(c) && !p && !b && !a) break;
  }
  return [s, e];
}

function checkXssRatchet() {
  const rels = listDir('src', '.js');
  const corpus = [];
  for (const rel of rels) {
    const src = read(rel);
    if (src == null) continue;
    corpus.push({ rel, src, ...lexJs(src) });
  }
  if (!corpus.length) { add('WARN', 'src', null, 'C24 : aucun module lu — le cliquet XSS n\'a pas pu tourner.'); return; }
  const safeFns = c24SafeFns(corpus);

  for (const { rel, src, mask, subs } of corpus) {
    const pts = c24Points(src, mask, subs);
    const mauvais = [], nus = [];
    let sub = 0;
    for (const pt of pts) {
      const raw = src.slice(pt.s, pt.e).trim();
      if (!raw) continue;
      const ligne = lineOf(src, pt.s);
      if (pt.kind === 'js') {
        // (a) le mauvais echappeur : _escHtml rend &#39;, que l'attribut redonne
        //     au moteur JS en apostrophe. Seul _escAttr tient dans ce slot.
        if (/\b(_escHtml|_pilEsc|_docsEsc)\s*\(/.test(raw) && !/\b_escAttr\s*\(/.test(raw)) {
          const nom = raw.replace(/\s+/g, '').slice(0, 46);
          if (!mauvais.includes(nom)) mauvais.push(nom);
          continue;
        }
        // (b) aucun echappement du tout
        if (!/\b_escAttr\s*\(/.test(raw) && c24Unsafe(src, mask, pt.s, pt.e, safeFns, 0)) nus.push(ligne);
        continue;
      }
      if (pt.kind === 'attr-nu') { nus.push(ligne); continue; }   // attribut sans guillemets
      if (pt.kind !== 'text' && pt.kind !== 'attr') continue;
      if (pt.via !== 'gabarit') continue;                          // (c) : les gabarits
      if (c24Unsafe(src, mask, pt.s, pt.e, safeFns, 0)) sub++;
    }
    ratchetList('C24a_mauvais_escapeur', rel, mauvais,
      'C24a — _escHtml dans un slot JS de gestionnaire (onclick="f(\'…\')") : l\'attribut DECODE &#39; avant que le JS ne soit compile, l\'echappement est DEFAIT',
      'Remplacer par _escAttr. C\'est un defaut, pas de la dette.');
    ratchetCount('C24b_slot_js_nu', rel, nus.length,
      'C24b — valeur posee dans un slot JS de gestionnaire sans _escAttr',
      'Passer par _escAttr A L\'INTERPOLATION, ou poser un data-* et lire la valeur dans le gestionnaire.');
    ratchetCount('C24c_interpolation_nue', rel, sub,
      'C24c — substitution ${…} dans un gabarit HTML sans _escHtml / _escAttr / Number() ni constante locale',
      'Envelopper l\'interpolation. Une aide qui echappe deja est reconnue toute seule (point fixe).');
  }
}


// ============================================================================
//  C25 — LE JETON APP CHECK NE DOIT PAS SE PERDRE EN CHEMIN (lot SEC-7)
// ----------------------------------------------------------------------------
//  ★★★ POURQUOI CE CONTROLE EXISTE, ET CE QU'IL NE FAIT PAS.
//  Le lot demandait de « basculer App Check en enforce ». Mesure faite en
//  console le 22/08 : c'etait DEJA fait, et sans casse — Cloud Firestore
//  100 % de requetes validees / 0 % non validees, Authentication idem,
//  Storage applique. Il n'y avait rien a basculer.
//
//  ⚠️ ET SURTOUT : Cloud Functions n'a PAS d'interrupteur dans cette console.
//  La console renvoie a la documentation, parce que l'exigence se declare
//  fonction par fonction, dans le code : `onCall({ enforceAppCheck: true })`.
//  Un toggle qu'on croit avoir bascule et qui n'existe pas est pire que pas de
//  toggle du tout. Inventaire du 22/08 : 27 fonctions appelables sur 27 le
//  portent.
//
//  Le risque restant n'est donc pas l'etat du jour, c'est la VINGT-HUITIEME.
//  Rien, aujourd'hui, n'empeche d'ecrire une `onCall` sans le jeton : ni
//  node --check, ni ESLint, ni le deploiement. C25 est ce filet.
//
//  ⚠️ Cliquet a ZERO tolere, contrairement a C24 : il n'y a aucune dette a
//  absorber. La reference est vide, et elle doit le rester.
//
//  ⚠️⚠️ CE QU'IL NE SAIT PAS FAIRE. Il ne lit que des options ecrites en OBJET
//  LITTERAL sur place. Si un jour les options passent par une constante
//  partagee (`onCall(OPTS_GT, …)`), il ne peut plus trancher — il le DIT en
//  avertissement au lieu de se taire. Une absence non confirmee se lit comme un
//  succes, et c'est deux fois que ca coute cher dans ce projet.
// ============================================================================
function checkAppCheckFns() {
  const fichiers = [...listDir('functions', '.js'), ...listDir('functions', '.cjs')]
    .filter(f => !/package(-lock)?\.json$/.test(f));
  if (!fichiers.length) {
    add('WARN', 'functions', null, 'C25 : aucun fichier de fonction lu — l\'exigence App Check n\'a pas pu etre verifiee.');
    return;
  }
  for (const rel of fichiers) {
    const src = read(rel);
    if (src == null) continue;
    const { mask } = lexJs(src);                 // le meme lexeur que C24
    const sansJeton = [], surfaceHttp = [];

    for (const m of mask.matchAll(/exports\.([A-Za-z_$][\w$]*)\s*=\s*(onCall|onRequest)\s*\(/g)) {
      const nom = m[1], type = m[2];
      let i = m.index + m[0].length;
      while (i < mask.length && /\s/.test(mask[i])) i++;

      if (type === 'onRequest') {
        // Une surface HTTP publique ne se protege pas par une option : elle se
        // DECIDE. On la nomme, pour qu'une troisieme porte soit un acte conscient
        // et non un effet de bord. Les deux existantes (formulaires publics) ont
        // liste blanche CORS + pot de miel + debit par IP (SEC-6).
        surfaceHttp.push(nom);
        continue;
      }
      if (mask[i] !== '{') {
        // pas d'objet d'options du tout : la callback est le 1er argument, ou
        // les options viennent d'ailleurs. Dans les deux cas, on ne peut pas
        // affirmer que le jeton est exige.
        const suite = src.slice(i, i + 40).replace(/\s+/g, ' ').trim();
        if (/^(async\b|function\b|\()/.test(suite)) sansJeton.push(nom);
        else add('WARN', rel, lineOf(src, m.index),
          `C25 : les options de « ${nom} » ne sont pas un objet litteral (« ${suite.slice(0, 24)}… ») — l'exigence App Check n'a PAS pu etre verifiee ici. La verifier a la main, ou remettre les options sur place.`);
        continue;
      }
      // bornes de l'objet d'options
      let d = 0, j = i;
      for (; j < mask.length; j++) { if (mask[j] === '{') d++; else if (mask[j] === '}') { d--; if (!d) break; } }
      const opts = src.slice(i, j + 1);
      if (!/enforceAppCheck\s*:\s*true\b/.test(opts)) sansJeton.push(nom);
    }

    ratchetList('C25_oncall_sans_appcheck', rel, sansJeton,
      'C25 — fonction appelable depuis le client SANS enforceAppCheck:true (la console Firebase ne peut pas l\'imposer : ca se declare ici)',
      'Ajouter enforceAppCheck: true aux options du onCall. Zero tolere : il n\'y a aucune dette a absorber sur ce point.');
    ratchetList('C25_surface_http', rel, surfaceHttp,
      'C25 — nouvelle surface HTTP publique (onRequest) : elle est joignable sans authentification NI App Check',
      'Si elle est voulue, la graver dans la reference. Verifier d\'abord liste blanche CORS, pot de miel et debit par IP (SEC-6).');
  }
}

// ---- sequence d'execution -------------------------------------------------
//  Nommee, pour que --only=C24 ne fasse tourner QUE ce controle. Sans ce
//  selecteur, une contre-epreuve qui relance le preflight treize fois paie
//  treize fois les 26 s des vingt-trois autres regles — dont C1, qui lance un
//  `node --check` par fichier. Le filtre ne sert PAS a masquer un rouge : il
//  n'existe qu'en ligne de commande et le mode par defaut reste complet.

// ═══════════════════════════════════════════════════════════════════════════
//  C26 — UN CHEMIN N'EST PAS UNE URL (le piège Windows, troisième occurrence)
// ═══════════════════════════════════════════════════════════════════════════
//  `await import(x)` attend une URL. Sous Linux, un chemin absolu « /home/… »
//  passe par chance ; sous Windows, `path.resolve()` rend « C:\… » et Node lit
//  « c: » comme un SCHÉMA — ERR_UNSUPPORTED_ESM_URL_SCHEME. Le harnais plante
//  AVANT sa première assertion, et il ne plante que chez Nico.
//  ★★★ Le bac à sable est Linux, la machine de Nico est Windows : AUCUN essai
//  côté Claude ne peut attraper ça. C'est arrivé le 20/08 (§53, `new URL().pathname`)
//  puis le 23/08 (§55n, `await import(CIBLE)`) — et la seconde fois, le harnais
//  fautif venait d'être ajouté à `prebuild`, donc il bloquait le DÉPLOIEMENT.
//  Une leçon qui se répète a besoin d'une règle, pas d'un rappel.
//  Formes acceptées : pathToFileURL(...), une chaîne 'data:…' / 'file:…', un nom
//  de module nu ('playwright'), ou une variable dont le nom dit l'URL (url, href).
function checkImportUrl() {
  const fichiers = [...listDir('scripts', '.mjs'), ...listDir('scripts', '.cjs'),
                    ...listDir('scripts/banc', '.mjs')];
  let n = 0;
  for (const rel of fichiers) {
    const brut = read(rel);
    if (!brut) continue;
    // ⚠️⚠️ COMMENTAIRES BLANCHIS D'ABORD. Sans ça, la règle se déclenche sur le
    //   commentaire qui l'explique — c'est exactement la faute de §53, quatrième
    //   occurrence : un contrôle qui lit ses propres mots se croit efficace.
    //   blankJsComments préserve longueurs et sauts de ligne : les numéros tiennent.
    const src = blankJsComments(brut);
    const re = /(^|[^.\w$])import\s*\(\s*([^)]{0,90})/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const arg = m[2].trim();
      if (!arg) continue;
      // Un littéral de chaîne est toujours accepté : 'playwright', 'data:…', 'node:fs'.
      // Personne n'écrit un chemin Windows en dur dans un import().
      if (/^['"`]/.test(arg)) continue;
      // pathToFileURL(…) est la forme correcte ; toute variable qui se nomme url/href
      // porte déjà une URL (mv-harnais-icones fabrique une data: dans `url`).
      if (/pathToFileURL|url|href/i.test(arg)) continue;
      n++;
      add('ERROR', rel, lineOf(src, m.index + m[1].length),
        'C26 : import(' + arg.slice(0, 34) + '…) recoit un CHEMIN, pas une URL. Sous Windows '
        + 'path.resolve() rend « C:\\… » et Node lit « c: » comme un schema : '
        + 'ERR_UNSUPPORTED_ESM_URL_SCHEME, le script meurt avant sa premiere assertion. '
        + 'Ecrire : import(pathToFileURL(chemin).href).');
    }
  }
  if (n === 0) add('INFO', 'scripts', null, 'C26 : aucun import() de chemin brut.');
}

const SEQUENCE = [
  ['C1',  checkSyntax],        ['C2',  checkSurrogates],   ['C3',  checkDivBalance],
  ['C4',  checkDivInButton],   ['C4b', checkDivInButtonJs],['C5',  checkVersions],
  ['C6',  checkOnclickWindow], ['C7',  checkDebug],        ['C8',  checkTDZ],
  ['C9',  checkBuild],         ['C10', checkPageDisplay],  ['C11', checkDeadIds],
  ['C12', checkSyncCoverage],  ['C13', checkGuardCoverage],['C14', checkEmptyCatch],
  ['C15', checkDeadFunctions], ['C16', checkNativeDialogs],['C17', checkDebugDeclared],
  ['C18', checkDuplicateIds],  ['C19', checkUnescaped],    ['C20', checkGuardBehaviour],
  ['C21', checkPaiePrivacy],   ['C22', checkAideEtVisite], ['C23', checkHelpersOrphelins],
  ['C23b', checkHandlerScope], ['C24', checkXssRatchet], ['C25', checkAppCheckFns],
  ['C26', checkImportUrl],
];
const onlyArg = args.find(a => a.startsWith('--only='));
const onlySet = onlyArg ? new Set(onlyArg.slice(7).split(',').map(x => x.trim()).filter(Boolean)) : null;
// ⚠️ Le cliquet compare a la reference : si on ne fait tourner qu'une partie
//   des regles, les autres cles ne sont PAS recalculees. Regraver la reference
//   dans ce mode l'amputerait. On l'interdit plutot que de la laisser mentir.
if (onlySet && rebase) {
  console.error('  --only et --baseline sont incompatibles : regraver la reference exige un passage COMPLET.');
  process.exit(2);
}
for (const [nom, fn] of SEQUENCE) {
  if (onlySet && !onlySet.has(nom) && !onlySet.has(nom.replace(/b$/, ''))) continue;
  fn();
}

// ---- baseline : regravure explicite, ou signalement si absente ---------------
if (rebase) {
  const out = { _note: 'Reference du cliquet anti-regression du preflight (C11/C14/C15/C16/C18/C19/C23/C24/C25). Regraver : node scripts/preflight.mjs --baseline. Elle ne doit que DESCENDRE.', generated: new Date().toISOString().slice(0, 10), ...nextBaseline };
  fs.writeFileSync(path.join(root, BASELINE_REL), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log('');
  console.log('  ' + green('✓ Référence regravée : ' + BASELINE_REL));
} else if (baselineMissing) {
  add('WARN', BASELINE_REL, null, 'Référence du cliquet absente → C11/C14/C15/C16/C18/C19/C23/C24/C25 ne bloquent rien pour l\'instant. La créer une fois : node scripts/preflight.mjs --baseline');
}

console.log('');
console.log(bold(cyan('  MA VIGNE — Preflight') + dim('  (filet anti-régression, lecture seule)')));
console.log(dim('  Racine : ' + root));
console.log(dim('  Version app : ') + (appVersion ? bold('v' + appVersion) : red('?')) +
  dim('   ·   Version SW : ') + (swVersion ? bold('v' + swVersion) : red('?')));
console.log('');

const errors = findings.filter(f => f.level === 'ERROR');
const warns = findings.filter(f => f.level === 'WARN');
const shown = quiet ? errors : findings;

if (shown.length) {
  const byFile = {};
  for (const f of shown) (byFile[f.file] ||= []).push(f);
  const order = { ERROR: 0, WARN: 1 };
  for (const file of Object.keys(byFile).sort()) {
    console.log(bold('  ' + file));
    const items = byFile[file].sort((a, b) => (order[a.level] - order[b.level]) || ((a.line || 0) - (b.line || 0)));
    for (const f of items) {
      const tag = f.level === 'ERROR' ? red('ERREUR') : yellow('ATTENTION');
      const loc = f.line ? dim(`L${f.line}`) + ' ' : '';
      console.log(`    ${tag}  ${loc}${f.msg}`);
    }
    console.log('');
  }
}

const fail = errors.length > 0 || (strict && warns.length > 0);
const summary =
  (errors.length ? red(`${errors.length} erreur(s)`) : green('0 erreur')) + dim(' · ') +
  (warns.length ? yellow(`${warns.length} avertissement(s)`) : green('0 avertissement'));
console.log('  ' + summary);

if (fail) {
  console.log('  ' + red('✗ Preflight ÉCHOUÉ' + (strict ? ' (mode strict)' : '') + ' — livraison à corriger.'));
  process.exit(1);
} else if (warns.length) {
  console.log('  ' + yellow('⚠ Preflight OK (avertissements non bloquants).'));
  process.exit(0);
} else {
  console.log('  ' + green('✓ Tout est bon.'));
  process.exit(0);
}
