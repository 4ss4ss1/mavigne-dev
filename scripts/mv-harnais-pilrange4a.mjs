/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-4a (§446) : « AFFICHER DANS CET ONGLET » NE PROPOSE QUE CE QUI SERT
   Lancer :          node scripts/mv-harnais-pilrange4a.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange4a.mjs --contre

   POURQUOI IL EXISTE
   Audit du rangement (§439) : sur Aujourd'hui, 21 cases, dont 17 sans aucun lecteur depuis le cockpit v2, et deux qui
   réglaient des cartes d'autres onglets (la tension par personne → Équipe, la protection restante → Conformité). Et une
   case relogée par PIL-RANGE-1b (« mat_travaux ») manquait aux défauts : _pilNormalize ne garde que les clés des défauts,
   la case décochée se recochait au chargement. Ce harnais garde une règle générale, sur TOUS les onglets :
   1. une case = un lecteur (_pilShow ou _pilAnyShow hors de la table, ou un autre module) ;
   2. la table et les défauts ont exactement les mêmes clés (ni case purgée, ni défaut orphelin) ;
   et EXÉCUTE _pilNormalize : une case décochée reste décochée. Puis il lit la place des deux cases rangées.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const AUTRES = fs.readdirSync(path.join(RACINE, 'src')).filter((f) => f.endsWith('.js') && f !== 'pilotage.js').map((f) => lire('src/' + f)).join('\n');
const S0 = { pil: lire('src/pilotage.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('absent : ' + debut); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 2); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const P = S.pil;
  const tbl = bloc(P, 'var _PIL_PERSO_DEFS='), dft = bloc(P, 'var _PIL_DEFAULT = ');
  const defs = {}; for (const [, tab, corpsTab] of tbl.matchAll(/\n  (\w+):\[(.*?)\]\],?(?=\n)/g)) defs[tab] = [...corpsTab.matchAll(/\['(\w+)','/g)].map((m) => m[1]);
  const cles = Object.values(defs).flat();
  const show = dft.slice(0, dft.indexOf('\n  },')); const defauts = [...show.matchAll(/\b(\w+):[01]\b/g)].map((m) => m[1]);
  const hors = P.replace(tbl, '').replace(dft, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const sansLecteur = cles.filter((k) => !new RegExp("_pilShow\\('" + k + "'\\)").test(hors) && !new RegExp("_pilAnyShow\\(\\[[^\\]]*'" + k + "'").test(hors) && !AUTRES.includes("'" + k + "'"));
  t('① une case = un lecteur, sur tous les onglets (' + cles.length + ' cases)', cles.length > 15 && sansLecteur.length === 0, 'sans lecteur : ' + sansLecteur.join(', '));
  const purgees = cles.filter((k) => !defauts.includes(k)), orphelins = defauts.filter((k) => !cles.includes(k));
  t('② la table et les défauts ont les mêmes clés (aucune case purgée au chargement, aucun défaut orphelin)', purgees.length === 0 && orphelins.length === 0, 'purgées : ' + purgees.join(', ') + ' · orphelins : ' + orphelins.join(', '));
  const c = {}; vm.createContext(c); vm.runInContext('var _PIL_ST_V=' + ((/var _PIL_ST_V = (\d+);/.exec(P) || [])[1] || '4') + ';\n' + dft + '\n' + corps(P, '_pilCloneDefault') + '\n' + corps(P, '_pilNormalize'), c);
  const n = c._pilNormalize({ show: { mat_travaux: 0, auj_tension: 0, auj_marge: 0 }, v: 4 });
  t('③ une case décochée reste décochée au chargement (« Pour finir les travaux tracteur en cours », la tension)', n && n.show.mat_travaux === 0 && n.show.auj_tension === 0, JSON.stringify(n && { mt: n.show.mat_travaux, at: n.show.auj_tension }));
  t('③ une ancienne clé morte mémorisée disparaît sans bruit', n && !('auj_marge' in n.show));
  t('④ Aujourd’hui ne propose que la vue Cave et ses points dans « À savoir »', JSON.stringify(defs.auj) === JSON.stringify(['auj_cave', 'auj_cave_sv']), JSON.stringify(defs.auj));
  t('④ la tension par personne se règle dans Équipe, et réveille la partie Personnel', (defs.equ || []).includes('auj_tension') && /_pilAnyShow\(\['prs_equipe','prs_presences','prs_capacite','an_frise','auj_tension'\]\)/.test(P));
  t('④ la protection restante se règle dans Conformité, où elle s’affiche', (defs.cfm || []).includes('auj_traiter') && /_pilShow\('auj_traiter'\)/.test(corps(P, '_pilTabCfm')));
  t('⑤ la nouveauté le dit (10.03, niv 1)', /\{ v: '10\.03', d: '[^']*', items: \[\s*\{ niv: 1, pour: \['admin'\], emoji: 'engrenage', titre: 'Pilotage : « Afficher dans cet onglet » ne propose que ce qui sert'/.test(S.utils));
  t('⑥ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange4a.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange4a.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['une case morte revient sur Aujourd’hui', (S) => R(S, 'pil', "  auj:[['auj_cave',", "  auj:[['auj_marge','Marge sur objectif'],['auj_cave',")],
    ['« mat_travaux » quitte les défauts', (S) => R(S, 'pil', "mat_conso:1, mat_travaux:1,", 'mat_conso:1,')],
    ['un défaut sans case', (S) => R(S, 'pil', "    auj_cave:1, auj_cave_sv:1, auj_traiter:1, auj_tension:1,", "    auj_cave:1, auj_cave_sv:1, auj_traiter:1, auj_tension:1, auj_plan:1,")],
    ['la tension revient dans Aujourd’hui', (S) => R(R(S, 'pil', "['auj_tension','La tension par personne'],", ''), 'pil', "  auj:[['auj_cave',", "  auj:[['auj_tension','Tension équipe'],['auj_cave',")],
    ['la tension seule ne réveille plus Personnel', (S) => R(S, 'pil', "'an_frise','auj_tension'])?", "'an_frise'])?")],
    ['la protection quitte Conformité', (S) => R(S, 'pil', "cfm:[['auj_traiter','Protection restante (fenêtre de traitement)'],", 'cfm:[')],
    ['la normalisation garde tout (les clés mortes reviennent)', (S) => R(S, 'pil', "Object.keys(d).forEach(function(k){ o[k]=", "Object.keys(Object.assign({},cur||{},d)).forEach(function(k){ o[k]=")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange4a.mjs'").join("mv-harnais-pilrangeW.mjs'") })],
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
