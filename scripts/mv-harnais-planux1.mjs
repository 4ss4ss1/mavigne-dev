/* ───────────────────────────────────────────────────────
   HARNAIS — PLAN-UX-1 (§501) : LE PLANNING — LA GRILLE D'ABORD, LES ACTIONS RARES DANS « … » (docs/maquettes/maquette-ux-v2.html)
   Lancer :          node scripts/mv-harnais-planux1.mjs
   Contre-épreuves : node scripts/mv-harnais-planux1.mjs --contre

   POURQUOI IL EXISTE
   « Congés sur une période » et « Chaleur sur une période » passaient au-dessus de la grille (elle commençait vers 520 px),
   l'année prenait trois cartes. Ce harnais JOUE _pl2YearTabs et _pl2PlusVa (extraites de planning.js) : « ‹ 2026 › » et ses
   bornes, l'année vide dite ; chaque ligne du menu ferme le menu et ouvre SON geste (congés, chaleur, l'année suivante, « Les
   gens ») ou dit comment faire (les journées de cave se notent sur les cases cochées) ; il garde la barre des périodes retirée.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pl: lire('src/planning.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, annee, liste, data) {
  const faits = []; const cls = new Set(['pl2-plus-ouvert']);
  const ctx = { planYear: annee, isAdmin: () => true, _planYearList: () => liste, _planYearHasData: (y) => data.indexOf(y) >= 0,
    openPlanCP: () => faits.push('cp'), openPlanChaleur: () => faits.push('chaleur'), planAddYear: () => faits.push('annee'), planSwitchTab: (t) => faits.push('tab:' + t),
    window: { showToast: () => faits.push('toast') }, showToast: () => faits.push('toast'), document: { body: { classList: { toggle: (c, o) => { if (o) cls.add(c); else cls.delete(c); } } } } };
  vm.createContext(ctx); vm.runInContext(['function _pl2YearTabs(', 'function _pl2Plus(', 'function _pl2PlusVa('].map((d) => fonction(S.pl, d)).join('\n') + '\nthis.an=_pl2YearTabs; this.va=_pl2PlusVa;', ctx);
  return { ctx, faits, cls };
}
function jouer(S) {
  const A = monde(S, 2026, [2027, 2025, 2026], [2025, 2026]); const h = A.ctx.an();
  t('① « ‹ 2026 › » : la précédente et la suivante dans l’ordre, lues dans data-y', h.includes('data-y="2025" onclick="planSetYear(+this.dataset.y)"') && h.includes('<b class="pl2-an-v">2026</b>') && h.includes('data-y="2027" onclick="planSetYear(+this.dataset.y)"') && !h.includes('disabled'));
  const B = monde(S, 2027, [2026, 2027], [2026]); const hb = B.ctx.an();
  t('① à la dernière année, « › » désactivé ; l’année sans donnée dit « vide »', /class="pl2-an-b" disabled data-y=""[^>]*aria-label="Année suivante"/.test(hb) && hb.includes('2027<small>vide</small>'));
  ['cp', 'chaleur', 'annee', 'releves', 'cave'].forEach((k) => A.ctx.va(k));
  t('② chaque ligne ferme le menu et ouvre son geste : congés, chaleur, l’année suivante, « Les gens » (et dit où est le relevé) ; la cave dit comment faire', A.faits.join() === 'cp,chaleur,annee,tab:gens,toast,toast' && !A.cls.has('pl2-plus-ouvert'));
  t('③ la barre des périodes a quitté le dessus de la grille ; le menu « … » est dans la barre de la semaine (admin)', !S.pl.includes('function _planPeriodeBar(') && S.pl.includes("body.innerHTML=_pl2YearTabs()+_planRecaleBar()+_pl2Toolbar()+_pl2Board()+_pl2HorsContrat();")
    && S.pl.includes("+(isAdmin()?'<button type=\"button\" class=\"pl2-plus-b\" onclick=\"_pl2Plus(true)\"") && ['cp', 'chaleur', 'cave', 'annee', 'releves'].every((k) => S.pl.includes("['" + k + "',")));
  t('④ le menu : une feuille au téléphone, sous le bouton sur ordinateur ; les noms du mois à 12 au téléphone ; les cibles de l’année à 44', S.css.includes('body.pl2-plus-ouvert .pl2-plus{display:block;position:absolute;') && S.css.includes('body.pl2-plus-ouvert #page-planning .pl2-plus{position:fixed;')
    && S.css.includes('#page-planning .pl2-mo .pl2-name-n{font-size:var(--pt-micro,12px);}') && S.css.includes('.pl2-an-b{min-width:44px;min-height:44px;'));
  t('⑤ exposées ; la liste joue ce fichier et sa contre-épreuve', S.pl.includes('window._pl2Plus=_pl2Plus; window._pl2PlusVa=_pl2PlusVa;') && S.liste.indexOf("mv-harnais-planux1.mjs'") > 0 && S.liste.indexOf("mv-harnais-planux1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['les années hors d’ordre', m('pl', 'var list=_planYearList().slice().sort(function(a,b){return a-b;}), i=list.indexOf(planYear);', 'var list=_planYearList().slice(), i=list.indexOf(planYear);')],
    ['l’année vide ne se dit plus', m('pl', "+(_planYearHasData(planYear)?'':'<small>vide</small>')", '')],
    ['le menu reste ouvert', m('pl', 'function _pl2PlusVa(k){\n  _pl2Plus(false);', 'function _pl2PlusVa(k){')],
    ['« Les gens » ne s’ouvre plus', m('pl', "else if(k==='releves'){ planSwitchTab('gens');", "else if(k==='releves'){")],
    ['la barre des périodes revient au-dessus de la grille', m('pl', "_pl2Toolbar()+_pl2Board()+_pl2HorsContrat();", "_pl2Toolbar()+'<div class=\"pl2-perbar\"></div>'+_pl2Board()+_pl2HorsContrat();")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-planux1.mjs'").join("mv-harnais-planuxZ.mjs'") })],
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
