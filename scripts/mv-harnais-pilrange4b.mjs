/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-4b (§447) : « LE DÉTAIL DE L'EXERCICE » SUIT LA BARRE ; SES RÉGLAGES DANS LA ROUE
   Lancer :          node scripts/mv-harnais-pilrange4b.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange4b.mjs --contre

   POURQUOI IL EXISTE
   Vérifié avant le code (23/10) : la sous-vue Exercice ne doublait pas « Le budget de l'année » — elle porte le détail
   (rythme mois par mois, salaires, achats, dépenses, fiabilité) et trois réglages — mais elle gardait son propre choix
   d'année (_PEX_AN) : la barre pouvait dire 2026-27 et le détail 2025-26. Validé par Nico (« oui ») : la garder, la
   renommer, lui faire suivre la barre, ranger ses réglages dans la roue. Ce harnais EXÉCUTE _pexEx (la fenêtre de la
   barre), _pecDetailLib, _pexBarreEx et _pilParamAnnees, et lit le reste sur le texte.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), utils: (lire('src/utils.js') + '\n' + lire('src/whats-new.js')), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const P = S.pil;
  const F26 = { an: 2026, lbl: 'Exercice 2026-27', court: '2026-27', d0: '2026-08-01', d1: '2027-07-31' }, COUR = { an: 2026, lbl: 'en cours' };
  const c = { _PIL_SCOPE: { cadre: 'exo' }, cadre: { F: F26 }, window: { _mvExercice: () => COUR }, _pilEsc: (x) => String(x) };
  c._pilAnCadre = () => c.cadre;
  vm.createContext(c); // MOTS-2 (§583) : _pexBarreEx rend l'en-tête de la sous-vue (l'exercice et ses dates, puis une phrase) — il lui faut ses aides.
  vm.runInContext(['_pexEx', '_pecDetailLib', '_pexBarreEx', '_pecEnteteVue', '_pecIsoToMs', '_pecJourCourt', '_pecMoisCourt', '_ecoEur'].map((n) => corps(P, n)).join('\n'), c);
  t('① le détail lit la fenêtre de la barre (_pilAnCadre().F), pas son propre choix', c._pexEx() === F26);
  c.cadre = null; t('① sans cadre lisible : l’exercice en cours', c._pexEx() === COUR);
  t('② son nom dit ce qu’il montre : exercice ou année vigne, selon la barre', c._pecDetailLib() === 'Le d\u00e9tail de l\u2019exercice' && (c._PIL_SCOPE.cadre = 'vig', c._pecDetailLib() === 'Le d\u00e9tail de l\u2019ann\u00e9e vigne'));
  c._PIL_SCOPE.cadre = 'exo';
  const b = c._pexBarreEx({ ex: F26, enCours: true, enCoursC: true, total: 370, totalClot: 1000 });
  t('② plus de puces d’année : la ligne dit l’année et ses dates, puis une phrase ; plus de mode d’emploi à demeure (MOTS-2)', !/data-pec="exy"/.test(b) && /<b>Exercice 2026-27<\/b> · 1 août → 31 juil\.<\/span>/.test(b) && /<b>370 €<\/b> sortis : <b>37 %<\/b> de l’exercice\./.test(b.replace(/[\u202f\u00a0]/g, ' ')) && !/Vous regardez/.test(b));
  c._PIL_SCOPE.cadre = 'vig'; t('② … et « Année vigne » quand la barre regarde l’année vigne', /<b>Année vigne 2026-27<\/b>/.test(c._pexBarreEx({ ex: F26, total: 5, totalClot: 5 })) && /de l’année|sortis\./.test(c._pexBarreEx({ ex: F26, enCoursC: true, total: 5, totalClot: 10 })));
  t('③ plus aucune mémoire d’année propre (_PEX_AN, « exy »)', !/_PEX_AN|'exy'/.test(P.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')));
  t('③ la sous-vue ne porte plus les réglages ; la barre des sous-vues prend le nom calculé', !/_pexMoisChoix\(\)|_pilCampMoisChoix\(\)|_pexFutChoix\(\)/.test(corps(P, '_pexView')) && /if\(s\[0\]==='exe'\) lib=_pecDetailLib\(\);/.test(corps(P, '_pecSubNav')));
  const r = { window: { _mvAvale: () => {} }, _pexMoisChoix: () => '<i>EXO</i>', _pilCampMoisChoix: () => '<i>VIG</i>', _pexFutChoix: () => '<i>FUT</i>' };
  vm.createContext(r); vm.runInContext(corps(P, '_pilParamAnnees'), r);
  t('④ la roue range les trois réglages côte à côte, sous « Les années et les comptes »', /Les ann\\u00e9es et les comptes|Les années et les comptes/.test(r._pilParamAnnees()) && /<i>EXO<\/i><i>VIG<\/i><i>FUT<\/i>/.test(r._pilParamAnnees()));
  t('④ la roue charge le style d’Économie et ajoute la section', /_pecCss\(\);[\s\S]{0,200}host\.innerHTML=_pilParamBody\(d\)\+_pilParamAnnees\(\);/.test(corps(P, '_pilParamRender')));
  t('④ le compte des fûts se règle dans la roue (le geste est écouté là)', /closest\('\[data-pec="futtr"\]'\)[\s\S]{0,160}_pexSetFutTrait/.test(P));
  t('④ changer un réglage repeint aussi la roue ouverte (par _pilFillContent → _pilParamRefresh, une seule fois)', /_pilParamRefresh\(d\);/.test(corps(P, '_pilFillContent')) && /_pilFillContent\(_pilData\(\)\);/.test(corps(P, '_pexSetMois')) && /_pilFillContent\(_pilData\(\)\);/.test(corps(P, '_pilSetCampMois')) && !/_pilParamRefresh\(/.test(corps(P, '_pexSetMois') + corps(P, '_pilSetCampMois')));
  t('⑤ la nouveauté et le guide le disent', /titre: 'Économie : « Le détail de l’exercice » suit la barre du haut'/.test(S.utils) && /<b>Le détail de l'exercice<\/b> — le coût d'un bilan à l'autre, dont la ligne « Vous regardez » choisit l'année/.test(S.guide));
  t('⑥ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange4b.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange4b.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['le mode d’emploi revient sous l’exercice', (S) => R(S, 'pil', "'</b> · '+_pilEsc(dates)+'</span></div>',", "'</b> · '+_pilEsc(dates)+' · se choisit dans la barre « Vous regardez »</span></div>',")],
    ['le détail ignore la barre', (S) => R(S, 'pil', '  if(C && C.F) return C.F;\n', '')],
    ['les puces d’année reviennent', (S) => R(S, 'pil', "'</b> · '+_pilEsc(dates)+'</span></div>',", "'</b> · '+_pilEsc(dates)+'</span><button data-pec=\"exy\" data-v=\"2025\">2025-26</button></div>',")],
    ['le nom ne suit plus le cadre', (S) => R(S, 'pil', "if(s[0]==='exe') lib=_pecDetailLib();", '')],
    ['la roue perd les réglages', (S) => R(S, 'pil', 'host.innerHTML=_pilParamBody(d)+_pilParamAnnees();', 'host.innerHTML=_pilParamBody(d);')],
    ['un réglage manque dans la roue', (S) => R(S, 'pil', 'h=_pexMoisChoix()+_pilCampMoisChoix()+_pexFutChoix();', 'h=_pexMoisChoix()+_pexFutChoix();')],
    ['le geste des fûts n’est plus écouté dans la roue', (S) => R(S, 'pil', "var fu=e.target.closest('[data-pec=\"futtr\"]');", 'var fu=null;')],
    ['la roue n’est plus repeinte par le remplissage', (S) => R(S, 'pil', '_pilParamRefresh(d);', '/* repeint retiré */')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange4b.mjs'").join("mv-harnais-pilrangeV.mjs'") })],
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
