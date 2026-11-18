/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-2b (§444) : L'ONGLET L'ANNÉE EST RANGÉ
   Lancer :          node scripts/mv-harnais-pilrange2b.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange2b.mjs --contre

   POURQUOI IL EXISTE
   Maquette du rangement validée par Nico (23/10) : la barre « Vous regardez » choisit le cadre (PIL-RANGE-2a), donc
   l'onglet L'année n'a plus lieu d'être. Ses avis et son budget s'ouvrent en tête de la Synthèse d'Économie, son
   renfort dans Équipe & matériel › Personnel, et un onglet « an » mémorisé migre vers Économie. Ce harnais EXÉCUTE
   _pilPhotosIci et _pilLoadTab (le vrai chargeur de l'onglet mémorisé), et lit sur le texte le menu,
   les cases d'affichage, les cibles des photos, la cible « an_cadres », les liens de la coquille, du cockpit et des
   tutos, l'aide et le guide, et la liste des harnais.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), coq: lire('src/coquille.js'), app: lire('src/app.js'), vue: lire('src/cockpit-vue.js'), utils: lire('src/utils.js'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const ligne = (src, re) => { const m = re.exec(src); if (!m) throw new Error('absent : ' + re); return m[0]; };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const P = S.pil;
  // ① avis et budget, dans la Synthèse — MOTS-1 (§582) : plus en tête, dans une des trois tuiles repliées (la règle 5 du §580c).
  //    _pilAnEcoHtml n'existe plus ; la vue pose la tuile si sa case est cochée, et garde les avis seuls sinon.
  const vueS = corps(P, '_pecViewSynthese');
  t('① les avis du cadre s’ouvrent avec le budget de l’année, dans sa tuile', /avis=_pilAnAvisHtml\(\);/.test(vueS) && /\(an\?_pilPanelAnBudget\(avis\):''\)/.test(vueS) && /body=\(avis\|\|''\)\+body\+/.test(corps(P, '_pilPanelAnBudget')));
  t('① case « Le budget de l’année » décochée : les avis seuls', /var an=_pilShow\('an_budget'\);/.test(vueS) && /if\(!an && avis\) H\+=avis;/.test(vueS));
  t('① posés dans la Synthèse, pas dans les autres sous-vues', /else body=_pecViewSynthese\(E,TL\);/.test(corps(P, '_pilTabEco')) && !/_pilAnAvisHtml|_pilPanelAnBudget/.test(corps(P, '_pilTabEco')));
  // ② le renfort dans Personnel
  t('② le renfort dans Équipe & matériel › Personnel, sous sa case an_frise', /_pilAnyShow\(\['prs_equipe','prs_presences','prs_capacite','an_frise'(,'auj_tension')?\]\)/.test(P)   /* PIL-RANGE-4a : la tension réveille aussi Personnel */ && /\(_pilShow\('an_frise'\)\?'<div class="pil-panels">'\+_pilPanelAnRenfort\(\)\+'<\/div>':''\)/.test(P));
  // ③ l'onglet mémorisé
  const mem = { v: null };
  const c2 = { localStorage: { getItem: () => mem.v }, _pilTabKey: () => 'k', _PIL_TAB_ROUE: 'roue' };
  vm.createContext(c2);
  vm.runInContext(ligne(P, /var _PIL_TAB_MIGR = \{[^}]*\};/) + '\n' + ligne(P, /var _PIL_VALID_TAB = \{[^}]*\};/) + '\n' + corps(P, '_pilLoadTab'), c2);
  mem.v = 'an'; const r1 = c2._pilLoadTab(); mem.v = 'eco'; const r2 = c2._pilLoadTab(); mem.v = 'avc'; const r3 = c2._pilLoadTab();
  t('③ un onglet « an » mémorisé s’ouvre sur Économie ; les autres restent', r1 === 'eco' && r2 === 'eco' && r3 === 'avc', [r1, r2, r3].join());
  t('③ « an » n’est plus un onglet valide ni au menu', !/\ban:1\b/.test(ligne(P, /var _PIL_VALID_TAB = \{[^}]*\};/)) && !/\['an',\s*'calendrier'/.test(P) && !/function _pilTabAn\(/.test(P) && !/tab==='an'/.test(P));
  // ④ les photos, les cases, la cible an_cadres
  const c3 = {}; vm.createContext(c3); vm.runInContext(corps(P, '_pilPhotosIci'), c3);
  t('④ les photos restent sur La campagne (plus sur L’année)', c3._pilPhotosIci('avc') === true && c3._pilPhotosIci('an') === false && c3._pilPhotosIci('eco') === false);
  t('④ aucune photo ne mène plus à « an » (Équipe au pic → equ, Budget → eco)', !/_pilPhotoHtml\([^\n]*'an'[,)]/.test(P) && /pBud=_pilPhotoHtml\('Budget',_pilNb\(dep\),[^\n]*,'eco',fB,'budget',/.test(P)   /* PORTEE-1 (§591) : le bandeau lit la campagne — deux tuiles, plus « Travaux » */);
  t('④ les cases : Économie gagne « Le budget de l’année », Équipe « Le renfort à prévoir », plus de liste « an »', /eco:\[\['an_budget',/.test(P) && /\['an_frise','Le renfort \\u00e0 pr\\u00e9voir'\]\],\n  eco:/.test(P) && !/\n  an: \[\['an_budget'/.test(P) && /tab==='eco'\|\|tab==='cfm'\);/.test(P));
  t('④ « an_cadres » mène à Économie › Synthèse, et fait clignoter les avis (ou la barre)', /_PIL_TAB='eco'; _pilSaveTab\('eco'\); _PEC_SUB='syn'/.test(P) && /getElementById\('pil-an-cadres'\)\|\|document\.getElementById\('pil-crumb'\)/.test(P));
  // ⑤ les autres portes
  t('⑤ la coquille ne propose plus L’année ; le cockpit et les tutos y mènent à Économie', !/\['an', 'L’année'\]/.test(S.coq) && /an: 'eco' \}/.test(S.vue));   // DEMO-5 (§500) : _MVT_PILTAB (annee:'eco') est parti avec la visite guidée
  t('⑤ l’aide et le guide disent où sont le budget et le renfort', S.utils.includes("['Le budget de l’année et le renfort', ") && /L'onglet « L'année » est rangé/.test(S.guide) && !/Aujourd'hui · L'année ·/.test(S.guide));
  t('⑥ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange2b.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange2b.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['la migration oublie « an »', (S) => R(S, 'pil', ",an:'eco'};", '};')],
    ['le budget s’affiche même décoché', (S) => R(S, 'pil', "  var an=_pilShow('an_budget');", "  var an=true;")],
    ['les avis se perdent quand le budget est décoché', (S) => R(S, 'pil', "  if(!an && avis) H+=avis;\n", "")],
    ['les avis et le budget sur toutes les sous-vues', (S) => R(S, 'pil', "else body=_pecViewSynthese(E,TL);", "else body=_pecViewSynthese(E,TL);\n  body=_pilAnAvisHtml()+body;")],
    ['le renfort quitte Personnel', (S) => R(S, 'pil', "+(_pilShow('an_frise')?'<div class=\"pil-panels\">'+_pilPanelAnRenfort()+'</div>':'')", "")],
    ['les photos reviennent sur « an »', (S) => R(S, 'pil', "function _pilPhotosIci(tab){ return tab==='avc'; }", "function _pilPhotosIci(tab){ return tab==='an' || tab==='avc' || tab==='eco'; }")],
    ['la photo Budget mène encore à « an »', (S) => R(S, 'pil', "'engag\\u00e9 \\u00b7 budget '+_pilNb(bud)+'\\u00a0\\u20ac','eco',fB,'budget',", "'engag\\u00e9 \\u00b7 budget '+_pilNb(bud)+'\\u00a0\\u20ac','an',fB,'budget',")],   // PORTEE-1 (§591) : l'ancre suit la tuile de la campagne
    ['« an_cadres » cherche encore L’année', (S) => R(S, 'pil', "_PIL_TAB='eco'; _pilSaveTab('eco'); _PEC_SUB='syn'", "_PIL_TAB='an'; _pilSaveTab('an'); _PEC_SUB='syn'")],
    ['le cockpit mène encore à « an »', (S) => R(S, 'vue', "an: 'eco' };", "an: 'an' };")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange2b.mjs'").join("mv-harnais-pilrangeY.mjs'") })],
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
