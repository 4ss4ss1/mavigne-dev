/* ───────────────────────────────────────────────────────
   HARNAIS — GABARIT-1 (§455) : UN RÔLE, UN STYLE, DANS TOUT LE PILOTAGE
   Lancer :          node scripts/mv-harnais-gabarit1.mjs
   Contre-épreuves : node scripts/mv-harnais-gabarit1.mjs --contre

   POURQUOI IL EXISTE
   Relevé sur les vrais écrans (25/10) : 63 styles de texte, 19 tailles, deux polices, six graisses, neuf épaisseurs de jauge,
   trois habillages de carte dans le seul Pilotage. Les harnais typo et échelle ne le voyaient pas : ils vérifient qu'une taille
   est un cran du barème, pas que le même RÔLE prend le même cran d'un onglet à l'autre. GABARIT-1 donne un style par rôle,
   lu dans la charte (--t-*, --jauge-h…) par un bloc unique en fin de styles.css. Ce harnais garde les trois choses qui le font
   tenir : les réglages vivent dans la charte, le bloc n'écrit aucune taille ni graisse à lui et reste le dernier mot de la
   feuille, et pilotage.js ne réintroduit pas de graisse au-delà de 600.
   ⚠️ Ce qu'il ne voit pas : une mise en page. Le rendu se regarde (captures du lot, §455).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const sansCom = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
const JETONS = ['--t-police', '--t-verdict', '--t-heros', '--t-chiffre', '--t-titre', '--t-section', '--t-ligne', '--t-texte', '--t-note', '--t-axe', '--jauge-h', '--jauge-fine-h', '--barre-graph-h', '--carte-pad'];
const S0 = {
  charte: lire('src/charte.css'), css: lire('src/styles.css'), pil: lire('src/pilotage.js'),
  prod: fs.readdirSync(path.join(RACINE, 'src')).filter((f) => f.endsWith('.js')).map((f) => lire('src/' + f)).join('\n') + '\n' + lire('index.html'),
  liste: lire('scripts/mv-harnais-liste.mjs')
};
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const ch = sansCom(S.charte);
  const manquants = JETONS.filter((j) => !new RegExp(j.replace(/-/g, '\\-') + '\\s*:').test(ch));
  t('① la charte pose les ' + JETONS.length + ' réglages du gabarit', manquants.length === 0, manquants.join(', '));
  const iT = S.css.indexOf('★★ GABARIT-1 (§455)'), iF = S.css.indexOf('/* ★ FIN GABARIT-1 */');
  t('② le bloc GABARIT-1 existe dans styles.css', iT > 0 && iF > iT);
  const apres = iF > 0 ? sansCom(S.css.slice(iF + '/* ★ FIN GABARIT-1 */'.length)).trim() : 'x';
  t('② et il ferme la feuille : rien ne vient après lui, il garde le dernier mot', apres === '', apres.slice(0, 80));
  const bloc = (iT > 0 && iF > iT) ? sansCom(S.css.slice(iT, iF)) : '';
  const tailles = (bloc.match(/font-size\s*:\s*[^;}]+/g) || []).filter((d) => !/var\(--t-[a-z]+\)/.test(d));
  t('③ le bloc n’écrit aucune taille à lui : chaque taille lit un rôle --t-*', bloc.length > 0 && tailles.length === 0, tailles.slice(0, 4).join(' | '));
  const graisses = (bloc.match(/font-weight\s*:\s*[^;}]+/g) || []).filter((d) => !/:\s*(400|500|600|var\(--fw-(?:reg|med|semi)[^)]*\))\s*(!important)?\s*$/.test(d));
  t('④ les graisses du bloc sont 400, 500 ou 600', bloc.length > 0 && graisses.length === 0, graisses.slice(0, 4).join(' | '));
  const classes = [...new Set((bloc.match(/\.[a-z][\w-]*/g) || []).map((c) => c.slice(1)).filter((c) => c.length >= 4))];
  const orphelines = classes.filter((c) => !new RegExp('(?<![\\w.-])' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(S.prod));
  t('⑤ chaque pièce visée par le bloc (' + classes.length + ' classes) est produite par le code', classes.length > 30 && orphelines.length === 0, orphelines.join(', '));
  const lourdes = (S.pil.match(/font-weight:\s*(?:700|800|900|bold)\b|font-weight=\\?"(?:700|800|900|bold)|font:\s*(?:700|800|900|bold)\s/g) || []);
  t('⑥ pilotage.js ne porte plus de graisse au-delà de 600', lourdes.length === 0, lourdes.length + ' : ' + lourdes.slice(0, 3).join(' | '));
  const PILR = /(#page-pilotage|#ovReglPilotage|#pil-|#ck-|\.pil-|\.pec-|\.pex-|\.pcav-|\.ck-|\.ck2|\.cv-|\.arc-|\.arcan|\.prv-|\.pach-|\.rf-|\.rf2-|\.cmp-)/;
  const hors = sansCom(iT > 0 ? S.css.slice(0, iT) : S.css);
  const fortes = [];
  hors.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, decl) => { const ss = sel.split(',').map((x) => x.trim()).filter(Boolean); if (ss.length && ss.every((x) => PILR.test(x)) && /font-weight:\s*(?:700|800|900|bold)\b/.test(decl)) fortes.push(sel.trim().slice(0, 60)); return m; });
  t('⑥ et les règles du Pilotage dans styles.css non plus', fortes.length === 0, fortes.length + ' : ' + fortes.slice(0, 3).join(' | '));
  t('⑦ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-gabarit1.mjs'") > 0 && S.liste.indexOf("mv-harnais-gabarit1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const fin = '/* ★ FIN GABARIT-1 */';
  const mutants = [
    ['un réglage du gabarit disparaît de la charte', (S) => Object.assign({}, S, { charte: S.charte.replace(/--t-chiffre\s*:/, '--t-chifre:') })],
    ['une taille écrite en dur revient dans le bloc', (S) => Object.assign({}, S, { css: S.css.replace(fin, '#page-pilotage .pil-th-t{font-size:13px!important}\n' + fin) })],
    ['une graisse 700 revient dans le bloc', (S) => Object.assign({}, S, { css: S.css.replace(fin, '#page-pilotage .pil-th-t{font-weight:700!important}\n' + fin) })],
    ['une règle passe après le bloc', (S) => Object.assign({}, S, { css: S.css + '\n.pil-th-t{font-size:var(--pt-micro)}\n' })],
    ['le bloc vise une pièce que plus rien ne produit', (S) => Object.assign({}, S, { css: S.css.replace(fin, '#page-pilotage .pil-piece-morte{font-size:var(--t-note)!important}\n' + fin) })],
    ['pilotage.js reprend une graisse 700', (S) => Object.assign({}, S, { pil: S.pil + "\n  +'.pil-x{font-weight:700}'\n" })],
    ['une règle du Pilotage reprend une graisse 700 dans la feuille', (S) => Object.assign({}, S, { css: S.css.replace('★★ GABARIT-1 (§455)', '*/\n.pil-dz-stp button{font-weight:700}\n/* ★★ GABARIT-1 (§455)') })],
    ['un graphique reprend un texte en 800', (S) => Object.assign({}, S, { pil: S.pil + '\nvar g=\'<text font-weight="800">1</text>\';\n' })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-gabarit1.mjs'").join("mv-harnais-gabaritX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    const S = mut(S0); ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
