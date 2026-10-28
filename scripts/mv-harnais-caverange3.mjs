/* ───────────────────────────────────────────────────────
   HARNAIS — CAVE-RANGE-3 (§452) : LE MILLÉSIME GARDE SES QUATRE ONGLETS ; UNE CUVÉE DU CHAI S'Y OUVRE DANS LA FICHE UNIQUE ;
   LES BOUTEILLES MÈNENT À LA FICHE
   Lancer :          node scripts/mv-harnais-caverange3.mjs
   Contre-épreuves : node scripts/mv-harnais-caverange3.mjs --contre

   POURQUOI IL EXISTE
   La maquette prévoyait Le Millésime à deux onglets. Vérifié avant le code (25/10) : « Cuvées » est le tableau du millésime
   (toutes ses cuvées côte à côte, les embouteillées — que Bouteilles ne menait pas à leur fiche —, le raisin vendu, les récoltes
   sans cuve) et « Courbes » montre les fermentations de n'importe quelle année, quand Le Cuvier ne regarde que la campagne.
   Version validée par Nico (« oui ») : garder les quatre onglets, ouvrir une cuvée du Chai dans la fiche unique (plus de seconde
   fiche), mener les bouteilles à la fiche. Ce harnais lit ces trois points et la fiche écrite DANS son panneau.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), css: lire('src/styles.css'), utils: (lire('src/utils.js') + '\n' + lire('src/whats-new.js')), guide: lire('guide/08-cave.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const C = S.cave, rc = corps(C, '_mlRenderCuv'), oc = corps(C, 'openCuveeDetail');
  t('① Le Millésime garde ses quatre onglets (Ensemble, Parcelles, Cuvées, Courbes)', ['vie', 'parc', 'cuv', 'crb'].every((k) => new RegExp("_mlTab==='" + k + "'|\\['" + k + "',").test(C)));
  t('② une cuvée du Chai s’ouvre dans la fiche unique, dans le panneau du Millésime (volet Volumes)', /if\(sel && sel\.l && sel\.l\.cuvee && sel\.l\.cuvee\.id!=null\)\{/.test(rc) && /openCuveeDetail\(_cid,'ml-fiche','vol'\)/.test(rc) && /id="ml-fiche" data-cuv="/.test(rc));
  t('② la colonne garde sa classe et son « Toutes les cuvées » (téléphone)', /<div class="mlc-fiche"><button type="button" class="mlc-ret" onclick="_mlCuvRetour\(\)">/.test(rc));
  t('② une cuve sans cuvée garde son détail (la fiche du Millésime)', /\(sel\?_mlCuvFicheHtml\(sel\.g,sel\.l\)/.test(rc));
  t('② plus de lien « Fiche complète » dans la seconde fiche (elle ne sert plus aux cuvées du Chai)', !/Fiche compl\\u00e8te de la cuv/.test(C));
  t('③ la fiche écrite dans un panneau cherche ses éléments DANS ce panneau (Chai et Millésime ont chacun le leur)', /bodyEl=_pn\.querySelector\('#cuvf-bd'\);/.test(oc) && /var tEl=dans\?_pn\.querySelector\('#cuvf-t'\)/.test(oc) && !/getElementById\(dans\?'cuvf-/.test(oc));
  t('③ l’en-tête de fiche a le même style dans le panneau du Millésime', S.css.includes(':is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche,#ml-fiche) .trf-hd{') && /#ml-fiche \.catf-bd\{/.test(S.css));
  t('④ une cuvée embouteillée mène à sa fiche (Bouteilles)', /Mis en bouteille'[\s\S]{0,200}onclick="openCuveeDetail\(this\.getAttribute\(\\'data-id\\'\),null,\\'vol\\'\)">Fiche de la cuv/.test(C));
  t('⑤ la nouveauté et le guide le disent ; la liste joue ce fichier', /titre: 'Cave : une cuvée s’ouvre dans sa fiche, depuis Le Millésime et les bouteilles'/.test(S.utils) && /<b>Fiche de la cuvée<\/b>/.test(S.guide) && S.liste.indexOf("mv-harnais-caverange3.mjs'") > 0 && S.liste.indexOf("mv-harnais-caverange3.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['une cuvée du Chai repasse par la seconde fiche', (S) => R(S, 'cave', 'if(sel && sel.l && sel.l.cuvee && sel.l.cuvee.id!=null){', 'if(false){')],
    ['la fiche cherche de nouveau dans toute la page', (S) => R(S, 'cave', "bodyEl=_pn.querySelector('#cuvf-bd');", "bodyEl=document.getElementById('cuvf-bd');")],
    ['les bouteilles ne mènent plus à la fiche', (S) => R(S, 'cave', "onclick=\"openCuveeDetail(this.getAttribute(\\'data-id\\'),null,\\'vol\\')\">Fiche de la cuv", "onclick=\"\">Fiche de la cuv")],
    ['le style de l’en-tête oublie le panneau du Millésime', (S) => Object.assign({}, S, { css: S.css.split(',#chai-fiche,#ml-fiche)').join(',#chai-fiche)') })],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-caverange3.mjs'").join("mv-harnais-caverangeZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
