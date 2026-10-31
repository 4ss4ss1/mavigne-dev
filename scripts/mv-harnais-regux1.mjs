/* ───────────────────────────────────────────────────────
   HARNAIS — REGL-UX-1 (§504) : LES RÉGLAGES — LE DOMAINE EN PREMIÈRE LIGNE, LES LIGNES À 48, PLUS DE TEXTES À 8-9 PX À L'ÉCRAN
   Lancer :          node scripts/mv-harnais-regux1.mjs
   Contre-épreuves : node scripts/mv-harnais-regux1.mjs --contre

   POURQUOI IL EXISTE
   La maquette (maquette-ux-v2, Réglages) : la carte « Ma Vigne · Domaine » prenait 150 px avant le premier réglage, des textes
   à 8 et 9 px. Ce harnais garde : aucun texte à 8, 8,5 ou 9 px dans les quatre fonctions d'ÉCRAN des Réglages (la liste des
   campagnes, la fenêtre de clôture, la conversion des tâches — sa feuille de style et son rendu) ; les documents imprimés
   (journal, mois, registre phyto, vendange) gardent leur barème d'impression ; la carte du domaine en ligne de liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rg: lire('src/reglages.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('introuvable : ' + nom); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
const petit = /font-size:\s*(8|8\.5|9)px/;
function jouer(S) {
  const ecran = ['renderReglages', '_clotOverlayHTML', '_tcvInjectCss', '_tcvRender'];
  t('① aucun texte à 8, 8,5 ou 9 px dans les fonctions d’écran des Réglages', ecran.every((n) => !petit.test(fonction(S.rg, n))));
  t('① les trois passés au jeton nano : la pastille des campagnes, la fenêtre de clôture, l’étiquette de la conversion', (fonction(S.rg, 'renderReglages').match(/font-size:var\(--pt-nano,11px\)/g) || []).length >= 1
    && fonction(S.rg, '_clotOverlayHTML').includes('font-size:var(--pt-nano,11px)') && fonction(S.rg, '_tcvInjectCss').includes('font-size:var(--pt-nano,11px)'));
  t('② les documents imprimés gardent leur barème (journal, mois, registre phyto, vendange)', S.rg.includes('.jiv-k{font-size:9px;') && S.rg.includes('.cover-brand{font-size:9px;') && S.rg.includes('table.reg th{padding:6px 7px;font-size:8px;') && S.rg.includes('.cd-k b{display:block;font-size:8px;'));
  t('③ la carte du domaine devient une ligne de liste : sans le logo, le nom et sa ligne, 64 px au moins', S.css.includes('#page-reglages .dom-badge{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;') && S.css.includes('#page-reglages .db-logo{display:none;}')
    && S.css.includes('#page-reglages .db-nom{margin:0;font-family:inherit;font-size:var(--pt-base,15px);'));
  t('③ les lignes de réglage à 48 px ; la liste joue ce fichier', S.css.includes('#page-reglages .set-row{min-height:48px;}') && S.liste.indexOf("mv-harnais-regux1.mjs'") > 0 && S.liste.indexOf("mv-harnais-regux1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const iC = S0.rg.indexOf('function _clotOverlayHTML('), ancreClot = S0.rg.slice(iC).match(/font-size:var\(--pt-nano,11px\)/)[0];
  const mutants = [
    ['un texte à 9 px revient dans la fenêtre de clôture', (S) => Object.assign({}, S, { rg: S.rg.slice(0, iC) + S.rg.slice(iC).replace(ancreClot, 'font-size:9px') })],
    ['le logo revient en tête de la carte', m('css', '#page-reglages .db-logo{display:none;}', '')],
    ['les lignes perdent leurs 48 px', m('css', '#page-reglages .set-row{min-height:48px;}', '')],
    ['un document imprimé passé au jeton (les deux registres confondus)', m('rg', 'table.reg th{padding:6px 7px;font-size:8px;', 'table.reg th{padding:6px 7px;font-size:var(--pt-nano,11px);')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-regux1.mjs'").join("mv-harnais-reguxZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
