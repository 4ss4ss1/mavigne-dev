/* ───────────────────────────────────────────────────────
   HARNAIS — CAVE-RANGE-2a (§450) : LA FICHE UNIQUE D'UNE CUVÉE, QUATRE VOLETS
   Lancer :          node scripts/mv-harnais-caverange2a.mjs
   Contre-épreuves : node scripts/mv-harnais-caverange2a.mjs --contre

   POURQUOI IL EXISTE
   Vérifié avant le code (25/10) : une cuvée avait deux fiches (la fenêtre du Chai : élevage et labo ; la fiche du
   Millésime : volumes, parcelles, hL/ha) et un diagnostic invisible depuis elle. Validé par Nico (« Go ») : la fenêtre du
   Chai devient LA fiche, quatre volets — Élevage, Analyses, Volumes & origine, Diagnostic —, ouverte aussi depuis
   Le Millésime et le Diagnostic ; rien n'est retiré. Ce harnais EXÉCUTE _cdvHtml, _cdvVolumesHtml, _cdvDiagHtml et la
   fiche du Millésime en mode « dedans », et lit les chemins sur le texte.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), dgn: lire('src/diagnostic.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function monter(S, o) {
  const ligne = { cle: 'L1', nom: 'Gevrey VV', cuvee: { id: 'c1' } };
  const c = { window: { _dgnSynthese: () => o.syn || [{ id: 'c1', txt: 'Volatile qui monte', nAna: 3, mise: false }], _mvAvale: () => {} }, String, Number,
    _escHtml: (x) => String(x), _pcavInjectCss: () => {}, _pcrbCvLignes: () => ({ groupes: [{ lignes: o.lignes || [ligne] }] }),
    _mlCuvFicheHtml: (g, l, opt) => '<i>FICHE-MIL ' + l.nom + (opt && opt.sansRetour ? ' DEDANS' : '') + '</i>' };
  vm.createContext(c);
  const cdv = /var _CDV=\[[^\n]*\];/.exec(S.cave); if (!cdv) throw new Error('_CDV absent');
  vm.runInContext(cdv[0] + '\n' + ['_cdvHtml', '_cdvVolumesHtml', '_cdvDiagHtml'].map((n) => corps(S.cave, n)).join('\n'), c);
  return c;
}
function jouer(S) {
  const c = monter(S, {});
  const h = c._cdvHtml({ id: 'c1', millesime: 2025 }, '<i>ELEVAGE</i>', '<i>LABO</i>', undefined);
  t('① quatre volets : Élevage, Analyses, Volumes & origine, Diagnostic', /data-k="elev"[^>]*>\\u00c9levage|data-k="elev"[^>]*>Élevage/.test(h) && /data-k="ana"[^>]*>Analyses/.test(h) && /data-k="vol"[^>]*>Volumes & origine/.test(h) && /data-k="dgn"[^>]*>Diagnostic/.test(h));
  t('① par défaut Élevage ouvert, les trois autres cachés', /data-k="elev">/.test(h.replace(/<div class="cdv-sec" data-k="elev">/, 'data-k="elev">')) && (h.match(/class="cdv-sec" data-k="\w+" hidden>/g) || []).length === 3 && /<i>ELEVAGE<\/i>/.test(h));
  t('① le labo vit dans Analyses (plus dans Élevage)', /data-k="ana" hidden><i>LABO<\/i>/.test(h) && /<div class="cdv-sec" data-k="elev"><i>ELEVAGE<\/i><\/div>/.test(h));
  const hv = c._cdvHtml({ id: 'c1', millesime: 2025 }, 'E', 'A', 'vol');
  t('② ouverte sur un volet demandé (Volumes & origine depuis Le Millésime)', /<div class="cdv-sec" data-k="vol">/.test(hv) && /data-k="elev" hidden>/.test(hv));
  t('② Volumes & origine = la fiche du Millésime de CETTE cuvée, sans son bouton retour', /FICHE-MIL Gevrey VV DEDANS/.test(hv));
  const c2 = monter(S, { lignes: [{ cle: 'L2', nom: 'Autre', cuvee: { id: 'zz' } }] });
  t('② une cuvée sans chaîne au Millésime le dit, sans planter', /pas encore de cha/.test(c2._cdvVolumesHtml({ id: 'c1', millesime: 2025 })));
  t('③ Diagnostic : la synthèse de la cuvée et le chemin vers son détail', /Volatile qui monte/.test(h) && /3 analyses lues/.test(h) && /data-id="c1" onclick="_cdvDiagOuvrir\(this\.getAttribute\('data-id'\)\)"/.test(h));
  const c3 = monter(S, { syn: [] });
  t('③ une cuvée que le diagnostic ne suit pas le dit', /ne suit pas cette cuv/.test(c3._cdvDiagHtml({ id: 'c1' })));
  t('④ la fenêtre du Chai écrit la fiche à volets, et accepte le volet à ouvrir', /function openCuveeDetail\(cuvId,dans,volet\)\{/.test(S.cave) && /bodyEl\.innerHTML=_cdvHtml\(cuv, html, _anaH, volet\);/.test(S.cave) && !/html\+=_laboCuveeHtml\(cuv\);/.test(S.cave));
  t('④ Le Millésime ouvre la fiche unique d’une cuvée du Chai (volet Volumes) — CAVE-RANGE-3', /openCuveeDetail\(_cid,'ml-fiche','vol'\)/.test(S.cave));
  t('④ le Diagnostic mène à la fiche (volet Diagnostic), et la fiche à son diagnostic', /case 'fiche': if \(typeof window\.openCuveeDetail === 'function'\) window\.openCuveeDetail\(v, null, 'dgn'\); return;/.test(S.dgn) && /data-dgn="fiche" data-v="' \+ esc\(S\.cuv\)/.test(S.dgn) && /window\._dgnVoirCuvee = function \(id\)/.test(S.dgn));
  t('⑤ changer de volet repeint les courbes du labo (elles se mesurent à l’affichage)', /if\(k==='ana' && window\._mvGraphRepeindre\)/.test(corps(S.cave, '_cdvShow')));
  t('⑥ la nouveauté le dit, et la liste joue ce fichier', /titre: 'Cave : une seule fiche par cuvée'/.test(S.utils) && S.liste.indexOf("mv-harnais-caverange2a.mjs'") > 0 && S.liste.indexOf("mv-harnais-caverange2a.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['le labo revient dans Élevage', (S) => R(S, 'cave', "var secs={elev:elevH, ana:", "var secs={elev:elevH+(anaH||''), ana:")],
    ['un volet manque', (S) => R(S, 'cave', ",['dgn','Diagnostic']];", '];')],
    ['le volet demandé est ignoré', (S) => R(S, 'cave', "var on=(_CDV.some(function(v){ return v[0]===volet; }))?volet:'elev';", "var on='elev';")],
    ['la fiche du Millésime garde son retour dedans', (S) => R(S, 'cave', 'return _mlCuvFicheHtml(g0, l0, {sansRetour:true});', 'return _mlCuvFicheHtml(g0, l0);')],
    ['le diagnostic ne mène plus à son détail', (S) => R(S, 'cave', "onclick=\"_cdvDiagOuvrir(this.getAttribute(\\'data-id\\'))\"", 'onclick=""')],
    ['le Diagnostic ne mène plus à la fiche', (S) => R(S, 'dgn', "case 'fiche': if (typeof window.openCuveeDetail === 'function') window.openCuveeDetail(v, null, 'dgn'); return;", "case 'fiche': return;")],
    ['les courbes ne se repeignent plus', (S) => R(S, 'cave', "  if(k==='ana' && window._mvGraphRepeindre){ try{ window._mvGraphRepeindre(); }", "  if(false){ try{ window._mvGraphRepeindre(); }")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-caverange2a.mjs'").join("mv-harnais-caverangeY.mjs'") })],
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
