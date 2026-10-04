#!/usr/bin/env node
// ── HARNAIS — DEMO-4 (§240) : LA DÉMO DU SITE, UN DOMAINE, QUATRE TÉLÉPHONES ─────────────────────────────
//   node scripts/mv-harnais-demo.mjs           → doit être vert
//   node scripts/mv-harnais-demo.mjs --contre  → chaque défaut réinjecté doit rougir
// Lit `public/demo.html` (la page), le dossier `public/demo/` (ses captures) et `public/logiciel-vigne.html`
// (qui y mène). Vérifie : chaque image de la table existe, chaque écran cité a son image, les quatre parcours ne
// citent que des écrans existants, la fin compte 127 h à 12 ha et 6 permanents (le chiffre du site, joué sur la
// VRAIE fonction extraite de la page), aucun montant (décision de Nico du 15/08), polices auto-hébergées, page non
// indexée, et les deux portes de sortie (l'essai, l'appli libre). Page du site : jamais dans le shell, aucun bump.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const rd = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = {
  demo: rd('public/demo.html'),
  site: rd('public/logiciel-vigne.html'),
  fichiers: new Set(fs.readdirSync(path.join(R, 'public/demo')))
};
function fnSrc(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), n = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') n++; else if (c === '}') { n--; if (n === 0) break; }
  }
  return src.slice(i, k + 1);
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const D = S.demo;
  T('robots : la page n\u2019est pas indexée (noindex,follow)', D.includes('<meta name="robots" content="noindex,follow">'));
  T('polices auto-hébergées (/fonts/fonts.css), aucune police Google', D.includes('/fonts/fonts.css') && !/fonts\.googleapis|fonts\.gstatic/.test(D));
  T('aucune mention « maquette »', !/maquette/i.test(D));
  T('zéro montant : ni « € » ni « euro »', !/€|\beuros?\b/i.test(D));
  let IMG = {};
  try { IMG = JSON.parse((D.match(/<script id="imgdata" type="application\/json">([\s\S]*?)<\/script>/) || [])[1] || '{}'); } catch (e) { IMG = {}; }
  const cles = Object.keys(IMG);
  T('la table des images est lue (' + cles.length + ' entrées)', cles.length >= 40);
  const manquants = cles.filter(k => { const m = /^\/demo\/([a-z0-9-]+\.webp)$/.exec(IMG[k]); return !m || !S.fichiers.has(m[1]); });
  T('chaque image de la table existe dans public/demo/ (' + manquants.length + ' manquante(s))', manquants.length === 0);
  const cites = new Set();
  for (const re of [/\b(?:img|after|pc):'([a-z0-9-]+)'/g, /IMG\['([a-z0-9-]+)'\]/g, /\['(?:gerant|ouvrier|tractoriste|chai)','([a-z0-9-]+)'/g, /o\('[a-z]+','([a-z0-9-]+)'/g]) {
    for (const m of D.matchAll(re)) cites.add(m[1]);
  }
  const orphelins = [...cites].filter(k => !(k in IMG));
  T('chaque écran cité a son image (' + cites.size + ' cités, ' + orphelins.length + ' sans image)', cites.size >= 25 && orphelins.length === 0);
  const scBloc = (D.match(/const SC = \{([\s\S]*?)\n\};/) || [])[1] || '';
  const ids = new Set([...scBloc.matchAll(/^ {2}'?([a-z_-]+)'?:\{/gm)].map(m => m[1]));
  const paths = (D.match(/const PATHS = \{([\s\S]*?)\n\};/) || [])[1] || '';
  const etapes = [...paths.matchAll(/'([a-z_-]+)'/g)].map(m => m[1]);
  const inconnues = etapes.filter(e => !ids.has(e));
  T('les quatre parcours ne citent que des écrans existants (' + etapes.length + ' étapes, ' + inconnues.length + ' inconnue(s))',
    /gerant:/.test(paths) && /ouvrier:/.test(paths) && /tractoriste:/.test(paths) && /chai:/.test(paths) && etapes.length >= 20 && inconnues.length === 0);
  let tot = NaN;
  try {
    const f = new Function('S', 'HORS_H', fnSrc(D, 'lignes') + '\n' + fnSrc(D, 'totalH') + '\nreturn totalH();');
    tot = f({ ha: 12, eq: 6, hors: false }, 37);
  } catch (e) { tot = NaN; }
  T('la fin compte 127 h à 12 ha et 6 permanents, comme le site (' + tot + ' h)', tot === 127);
  T('le site mène à la démo (/demo.html), plus au tour guidé', S.site.includes('https://mavigneapp.fr/demo.html') && !S.site.includes('?demo=visite'));
  T('la démo garde ses deux portes : l\u2019essai et l\u2019appli libre', D.includes('href="/essai.html"') && D.includes('href="/?demo=visite"'));
  return out;
}
const DEFAUTS = [
  ['page indexée', S => ({ ...S, demo: S.demo.replace('<meta name="robots" content="noindex,follow">', '') })],
  ['police Google', S => ({ ...S, demo: S.demo.replace('</head>', '<link href="https://fonts.googleapis.com/css2?family=Outfit" rel="stylesheet"></head>') })],
  ['le mot « maquette »', S => ({ ...S, demo: S.demo.replace('Rien n\u2019est enregistré.', 'Maquette.') })],
  ['un montant', S => ({ ...S, demo: S.demo.replace('h par an', '€ par an') })],
  ['une capture absente du dossier', S => ({ ...S, fichiers: new Set([...S.fichiers].filter(f => f !== 'r-ouv-liste.webp')) })],
  ['un écran sans image', S => ({ ...S, demo: S.demo.replace("img:'r-ouv-liste'", "img:'r-ouv-inconnu'") })],
  ['un parcours vers un écran inconnu', S => ({ ...S, demo: S.demo.replace("ouvrier:['prep',", "ouvrier:['prep','fantome',") })],
  ['le barème faussé', S => ({ ...S, demo: S.demo.replace("{lab:'Journal et validations', min:5,", "{lab:'Journal et validations', min:6,") })],
  ['le site resté sur le tour guidé', S => ({ ...S, site: S.site.replace('https://mavigneapp.fr/demo.html', 'https://mavigneapp.fr/?demo=visite') })],
  ['la porte de l\u2019essai fermée', S => ({ ...S, demo: S.demo.replace('href="/essai.html"', 'href="#"') })]
];
const diff = (a, b) => a.demo !== b.demo || a.site !== b.site || a.fichiers.size !== b.fichiers.size;
if (!CONTRE) {
  const r = suite(BASE); let ko = 0;
  for (const [n, ok] of r) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + n); if (!ok) ko++; }
  console.log(ko ? `\u2717 harnais démo : ${ko} rouge(s) sur ${r.length}` : `\u2713 harnais démo : ${r.length} vertes`);
  process.exit(ko ? 1 : 0);
} else {
  let ko = 0;
  for (const [nom, mut] of DEFAUTS) {
    const S = mut(BASE);
    if (!diff(S, BASE)) { console.log('  \u2717 défaut non réinjecté (motif introuvable) : ' + nom); ko++; continue; }
    const rouges = suite(S).filter(x => !x[1]).map(x => x[0]);
    if (rouges.length) console.log('  \u2713 ' + nom + ' \u2192 rougit (' + rouges[0] + ')');
    else { console.log('  \u2717 ' + nom + ' \u2192 reste vert'); ko++; }
  }
  console.log(ko ? `\u2717 contre-épreuve démo : ${ko} sur ${DEFAUTS.length}` : `\u2713 contre-épreuve démo : ${DEFAUTS.length}/${DEFAUTS.length}`);
  process.exit(ko ? 1 : 0);
}
