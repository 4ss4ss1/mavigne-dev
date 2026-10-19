#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA CHARTE, UN SEUL FICHIER (lot CHARTE-2, §368)
   Lancer :  node scripts/mv-harnais-charte.mjs
             node scripts/mv-harnais-charte.mjs --contre

   ══ POURQUOI ══
   Nico (19/10) veut « un fichier qui régit tout le style ». Les réglages existaient (DS-0 à DS-4) mais
   vivaient à 27 endroits de styles.css, au milieu des règles d'écran : pour changer une couleur sombre,
   il fallait savoir qu'elle était redite trois mille lignes plus bas. CHARTE-2 les a sortis, tels quels,
   dans src/charte.css — 440 réglages, 27 blocs — que styles.css importe en premier. L'équivalence a été
   prouvée au navigateur le jour du lot (8 388 valeurs, 12 contextes, zéro écart). Ce harnais garde la
   règle pour la suite : un réglage posé demain au milieu de styles.css rougit le jour même.

   Ce qu'il interdit :
     A. qu'un réglage (une variable posée sur :root, #app-root ou html) se déclare hors de la charte :
        dans styles.css (à plat ou dans un @media), dans index.html, ou dans un module — sauf un document
        imprimé qui porte son propre :root (exemption écrite ci-dessous, avec sa raison et son compte) ;
     B. qu'autre chose qu'un réglage entre dans la charte : une règle d'écran appartient à styles.css ;
     C. que styles.css cesse de lire la charte EN PREMIER (son premier énoncé : l'import de charte.css),
        ou qu'un module l'importe une seconde fois (deux copies, deux vérités au chargement) ;
     D. que le sombre diverge : chaque réglage redit pour la bascule manuelle (data-theme="dark") l'est à
        l'identique pour le mode automatique du téléphone (prefers-color-scheme: dark, hors data-theme
        "light"), et inversement — sinon le même écran change de couleur selon la façon d'être en sombre ;
     E. qu'une exemption ne serve plus, ou que la lecture ne voie rien (garde de lecture, §25).

   ⚠️ Ce qu'il ne fait pas : regarder un écran. Les règles d'écran restent dans styles.css ; les pièces
      communes (CHARTE-3 et suivants) auront leurs propres contrôles.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const CHARTE = 'src/charte.css', FEUILLE = 'src/styles.css';
const MODULES = fs.readdirSync(path.join(RACINE, 'src')).filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f);
const PAGES = ['index.html', ...fs.readdirSync(path.join(RACINE, 'src', 'gt')).filter(f => f.endsWith('.html')).sort().map(f => 'src/gt/' + f)];
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

/* ══ EXEMPTIONS — un autre DOCUMENT, qui ne charge pas styles.css, a le droit à son :root ═══ */
const EXEMPTIONS = [
  { fichier: 'src/app.js', n: 1,
    raison: 'le relevé d’heures imprimé (_rsCss) : un document A4 ouvert dans sa propre fenêtre, sans la feuille — '
          + 'il pose ses propres couleurs (même exemption que mv-harnais-jetons pour --ligne)' },
  { fichier: 'src/cave.js', n: 2,
    raison: 'les documents imprimés de la Cave (mv-harnais-cuvdoc) : ouverts dans leur propre fenêtre, sans la feuille' }
];   // ★ CHARTE-2B (§369) : le mode plein soleil a rejoint la charte — plus aucune exemption pour index.html

/* ══ Lecture du CSS : énoncés de premier niveau, @media déroulés d'un cran ═══════════════ */
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function decouper(s, a = 0, b = s.length) {
  const out = []; let i = a;
  while (i < b) {
    if (s.startsWith('/*', i)) { const j = s.indexOf('*/', i + 2); i = j < 0 ? b : j + 2; continue; }
    if (/\s/.test(s[i])) { i++; continue; }
    let j = i, q = null;
    for (; j < b; j++) {
      const c = s[j];
      if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (s.startsWith('/*', j)) { const k = s.indexOf('*/', j + 2); j = (k < 0 ? b : k + 2) - 1; continue; }
      if (c === '{' || c === ';') break;
    }
    if (j >= b || s[j] === ';') { out.push({ type: 'enonce', a: i, b: Math.min(j + 1, b), pre: s.slice(i, j).trim() }); i = j + 1; continue; }
    let k = j, p = 0; q = null;
    for (; k < b; k++) {
      const c = s[k];
      if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (s.startsWith('/*', k)) { const m = s.indexOf('*/', k + 2); k = (m < 0 ? b : m + 2) - 1; continue; }
      if (c === '{') p++;
      else if (c === '}') { p--; if (!p) break; }
    }
    const pre = s.slice(i, j).trim();
    out.push({ type: pre.startsWith('@') ? 'at' : 'regle', a: i, b: k + 1, pre, ca: j + 1, cb: k });
    i = k + 1;
  }
  return out;
}
const RACINE_SEL = /^(?::root|#app-root|html)(?:\[[^\]]*\]|:not\([^)]*\))*$/;
const estRacine = pre => { const l = sansCom(pre).split(',').map(x => x.trim()).filter(Boolean); return l.length > 0 && l.every(x => RACINE_SEL.test(x)); };
const decls = corps => sansCom(corps).split(';').map(x => x.trim()).filter(Boolean);
const queReglages = corps => { const d = decls(corps); return d.length > 0 && d.every(x => x.startsWith('--') || x.startsWith('color-scheme')); };
const poseReglage = corps => decls(corps).some(x => x.startsWith('--'));
/* Toutes les règles, avec leur @media éventuel. */
function regles(s) {
  const out = [];
  for (const e of decouper(s)) {
    if (e.type === 'regle') out.push({ ...e, corps: s.slice(e.ca, e.cb), media: null });
    else if (e.type === 'at' && /^@media/.test(e.pre) && e.cb) {
      for (const x of decouper(s, e.ca, e.cb)) out.push({ ...x, corps: x.type === 'regle' ? s.slice(x.ca, x.cb) : '', media: e.pre });
    } else out.push({ ...e, corps: e.cb ? s.slice(e.ca, e.cb) : '', media: null });
  }
  return out;
}
const ligneDe = (s, i) => s.slice(0, i).split('\n').length;

/* ══ LA VÉRIFICATION ═══════════════════════════════════════════════════════ */
function verifier(SRC) {
  const f = { A: [], B: [], C: [], D: [], E: [] };
  const ch = SRC[CHARTE] || '', st = SRC[FEUILLE] || '';
  let reglages = 0, blocs = 0;
  /* B. la charte : des réglages, rien d'autre */
  for (const e of decouper(ch)) {
    if (e.type === 'regle' && estRacine(e.pre) && queReglages(ch.slice(e.ca, e.cb))) { blocs++; reglages += decls(ch.slice(e.ca, e.cb)).filter(x => x.startsWith('--')).length; continue; }
    if (e.type === 'at' && /^@media/.test(e.pre) && e.cb) {
      for (const x of decouper(ch, e.ca, e.cb)) {
        if (x.type === 'regle' && estRacine(x.pre) && queReglages(ch.slice(x.ca, x.cb))) { blocs++; reglages += decls(ch.slice(x.ca, x.cb)).filter(y => y.startsWith('--')).length; }
        else f.B.push(CHARTE + ':' + ligneDe(ch, x.a) + ' « ' + x.pre.slice(0, 60) + ' » dans ' + e.pre.slice(0, 40));
      }
      continue;
    }
    f.B.push(CHARTE + ':' + ligneDe(ch, e.a) + ' « ' + e.pre.slice(0, 70) + ' »');
  }
  /* A. un réglage hors de la charte — feuille, pages, modules */
  for (const r of regles(st))
    if (r.type === 'regle' && estRacine(r.pre) && poseReglage(r.corps))
      f.A.push(FEUILLE + ':' + ligneDe(st, r.a) + ' « ' + r.pre.slice(0, 50) + ' »' + (r.media ? ' dans ' + r.media.slice(0, 40) : ''));
  const compte = {};
  for (const p of PAGES) {
    const s = SRC[p] || '', vus = [];
    for (const m of s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g))
      for (const r of regles(m[1])) if (r.type === 'regle' && estRacine(r.pre) && poseReglage(r.corps)) vus.push(r.pre.slice(0, 50));
    if (vus.length) { compte[p] = vus.length; if (!EXEMPTIONS.some(x => x.fichier === p)) vus.forEach(v => f.A.push(p + ' : « ' + v + ' » dans un <style>')); }
  }
  for (const mod of MODULES) {
    const n = [...(SRC[mod] || '').matchAll(/:root[^{}\n]{0,80}\{[^{}]{0,200}?--[\w-]+\s*:/g)].length;
    if (n) compte[mod] = n;
  }
  for (const [mod, n] of Object.entries(compte)) {
    const e = EXEMPTIONS.find(x => x.fichier === mod);
    if (!e) { if (!PAGES.includes(mod)) f.A.push(mod + ' : ' + n + ' réglage(s) posé(s) sur la racine dans le CSS d’un module'); }
    else if (n > e.n) f.A.push(mod + ' : ' + n + ' :root à réglages pour ' + e.n + ' exempté(s)');
  }
  for (const e of EXEMPTIONS) if ((compte[e.fichier] || 0) < e.n) f.E.push(e.fichier + ' : ' + (compte[e.fichier] || 0) + ' :root à réglages pour ' + e.n + ' exempté(s) — retirer l’exemption');
  /* C. styles.css lit la charte en premier, une seule fois */
  const premier = decouper(st)[0];
  if (!premier || premier.type !== 'enonce' || !/^@import\s+(?:url\()?\s*['"]\.\/charte\.css['"]\s*\)?$/.test(premier.pre))
    f.C.push(FEUILLE + ' ne commence pas par @import \'./charte.css\' (premier énoncé : « ' + (premier ? premier.pre.slice(0, 50) : 'rien') + ' »)');
  if ((sansCom(st).match(/@import[^;]*charte\.css/g) || []).length > 1) f.C.push(FEUILLE + ' importe la charte plusieurs fois');
  for (const mod of MODULES) if (/import\s+['"][^'"]*charte\.css['"]/.test(SRC[mod] || '')) f.C.push(mod + ' importe la charte : elle arrive déjà par styles.css');
  /* D. le sombre, redit à l'identique */
  const manuel = new Map(), auto = new Map();
  for (const r of regles(ch)) {
    if (r.type !== 'regle') continue;
    const sel = sansCom(r.pre).replace(/\s+/g, '');
    const media = r.media ? r.media.replace(/\s+/g, '') : '';
    const cible = !r.media && sel.includes('[data-theme="dark"]') ? manuel
                : (/prefers-color-scheme:dark/.test(media) && sel.includes(':not([data-theme="light"])')) ? auto : null;
    if (!cible) continue;
    const variante = sel.includes('[data-hicontrast') ? 'plein soleil · ' : '';   // ★ CHARTE-2B : le plein soleil se compare à part
    for (const d of decls(r.corps)) { const k = d.indexOf(':'); cible.set(variante + d.slice(0, k).trim(), d.slice(k + 1).trim()); }
  }
  for (const [k, v] of manuel) if (!auto.has(k)) f.D.push(k + ' : redit pour la bascule manuelle, pas pour le mode automatique');
    else if (auto.get(k) !== v) f.D.push(k + ' : « ' + v + ' » en manuel, « ' + auto.get(k) + ' » en automatique');
  for (const k of auto.keys()) if (!manuel.has(k)) f.D.push(k + ' : redit pour le mode automatique, pas pour la bascule manuelle');
  return { f, reglages, blocs, sombres: manuel.size };
}

/* ══ Verdict ═══════════════════════════════════════════════════════════════ */
const SRC0 = Object.fromEntries([CHARTE, FEUILLE, ...PAGES, ...MODULES].map(x => [x, lire(x)]));
let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};
const liste = a => a.slice(0, 6).join('\n        ') + (a.length > 6 ? '\n        … (+' + (a.length - 6) + ')' : '');

if (!CONTRE) {
  console.log('\n── LA CHARTE, UN SEUL FICHIER — lot CHARTE-2 (§368)\n');
  const { f, reglages, blocs, sombres } = verifier(SRC0);
  t('la lecture voit la charte (' + reglages + ' réglages en ' + blocs + ' blocs, ' + sombres + ' redits en sombre)', reglages >= 400 && blocs >= 20 && sombres >= 80);
  t('aucun réglage déclaré hors de la charte (' + f.A.length + ')', f.A.length === 0, liste(f.A));
  t('la charte ne contient que des réglages (' + f.B.length + ')', f.B.length === 0, liste(f.B));
  t('styles.css lit la charte en premier, une seule fois', f.C.length === 0, liste(f.C));
  t('le sombre est redit à l’identique : bascule manuelle = mode automatique (' + f.D.length + ' écart(s))', f.D.length === 0, liste(f.D));
  t('chaque exemption sert, au compte exact', f.E.length === 0, liste(f.E));
} else {
  console.log('\n── CONTRE-ÉPREUVES — la charte, un seul fichier (CHARTE-2)\n');
  const muter = (fi, fn) => { const S = { ...SRC0 }; const av = S[fi]; S[fi] = fn(av); if (S[fi] === av) throw new Error('défaut non posé : ' + fi); return S; };
  const CAS = [
    ['un réglage revient au milieu de styles.css', 'A', () => muter(FEUILLE, s => s + '\n:root{--zz-a:1px}\n')],
    ['un réglage revient dans un @media de styles.css', 'A', () => muter(FEUILLE, s => s + '\n@media (min-width:1px){ #app-root[data-theme="dark"]{--zz-b:1px} }\n')],
    ['index.html pose un réglage', 'A', () => muter('index.html', s => s.replace('</head>', '<style>:root{--zz-c:1px}</style></head>'))],
    ['une page GT pose un réglage', 'A', () => muter('src/gt/console.html', s => s + '\n<style>:root{--zz-i:1px}</style>\n')],
    ['un module pose un réglage sur la racine', 'A', () => muter('src/reserve.js', s => s + "\nwindow._zz = '<style>:root{--zz-d:1px}</style>';\n")],
    ['une règle d’écran glisse dans la charte', 'B', () => muter(CHARTE, s => s + '\n.zz-e{color:red}\n')],
    ['un réglage de la charte prend une autre propriété', 'B', () => muter(CHARTE, s => s.replace(/:root\{/, ':root{ margin:0;'))],
    ['styles.css ne lit plus la charte en premier', 'C', () => muter(FEUILLE, s => s.replace(/@import\s+'\.\/charte\.css';/, ''))],
    ['un module importe la charte une seconde fois', 'C', () => muter('src/app.js', s => "import './charte.css';\n" + s)],
    ['une couleur sombre changée dans la seule bascule manuelle', 'D', () => muter(CHARTE, s => s.replace('--texte:#EDECE9;', '--texte:#FFFFFF;'))],
    ['un réglage sombre ajouté au seul mode automatique', 'D', () => muter(CHARTE, s => s.replace(/(:root:not\(\[data-theme="light"\]\)\s*\{)/, '$1--zz-f:1px;'))],
    ['le plein soleil sombre perd son pendant automatique', 'D', () => muter(CHARTE, s => s.replace(/@media\(prefers-color-scheme:dark\)\{#app-root:not\(\[data-theme="light"\]\)\[data-hicontrast="1"\][^{]*\{[^}]*\}\}/, ''))],
    ['une exemption ne sert plus', 'E', () => muter('src/cave.js', s => s.replace(/:root\{--bleu:/, ':racine{--bleu:'))]
  ];
  for (const [nom, regle, fab] of CAS) {
    let S; try { S = fab(); } catch (e) { t(nom + ' — ' + e.message, false); continue; }
    t(nom + ' → la règle ' + regle + ' rougit', verifier(S).f[regle].length > 0);
  }
  const temoins = [
    ['un réglage nommé dans un commentaire de styles.css ne compte pas', () => muter(FEUILLE, s => s + '\n/* :root{--zz-g:1px} pour mémoire */\n')],
    ['un réglage local à une pièce (.zz{--x}) reste permis', () => muter(FEUILLE, s => s + '\n.zz-h{--zz-h:1px}\n')]
  ];
  for (const [nom, fab] of temoins) {
    const { f } = verifier(fab()); const total = Object.values(f).reduce((n, a) => n + a.length, 0);
    t('témoin — ' + nom, total === 0, Object.entries(f).filter(([, a]) => a.length).map(([k, a]) => k + ' : ' + a[0]).join(' · '));
  }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
process.exit(ko ? 1 : 0);
