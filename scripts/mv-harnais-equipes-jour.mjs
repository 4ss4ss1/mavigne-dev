// HARNAIS — ÉQUIPES-1 (§199) : les équipes du jour, posées par l'administrateur depuis l'Accueil.
//   node scripts/mv-harnais-equipes-jour.mjs           → doit être vert
//   node scripts/mv-harnais-equipes-jour.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js et src/utils.js (commentaires retirés).
// Le côté calcul (un jour d'équipes, pas de journée du domaine) est tenu par mv-harnais-temps-vigne (Q1-Q5).
// ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { app: lire('src/app.js'), utl: lire('src/utils.js'), html: lire('index.html') };
const nu = s => s.replace(/^\s*\/\/.*$/gm, '');

function extraire(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}

function monde(src, { admin = false, moi = 'Victor', config = {} } = {}) {
  const A = nu(src.app), U = nu(src.utl);
  const fns = [['_mvEqJour', U], ['_mvEqDe', U], ['_mvEqJourMoi', A], ['_mvEqApplique', A], ['_mvEqEcrire', A], ['saveEqJour', A], ['clearEqJour', A]];
  const code = [], manque = [];
  for (const [n, s] of fns) { const f = extraire(s, n); if (f) code.push(f); else manque.push(n); }
  if (manque.length) return { manque };
  const ctx = { console, Date, Math, String, Array, Object, parseInt, JSON, saves: [], toasts: [], ferme: 0, SEL: {} };
  ctx.window = { CONFIG: config };
  vm.createContext(ctx);
  vm.runInContext(`
    var currentUser = { nom: ${JSON.stringify(moi)} };
    var CONFIG = window.CONFIG;
    var _EQJ_SEL = {};
    function _mvMoiAdmin(){ return ${admin ? 'true' : 'false'}; }
    function _mvToday(){ return '2026-09-30'; }
    function _mvISO(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function saveData(k){ saves.push(k); }
    function _mvEqApres(msg){ ferme++; toasts.push(msg); }
    ${code.join('\n')}
    window._mvEqJour = _mvEqJour; window._mvEqDe = _mvEqDe;
    this.api = { applique: _mvEqApplique, moi: _mvEqJourMoi, ecrire: _mvEqEcrire, save: function(sel){ _EQJ_SEL = sel; saveEqJour(); }, clear: clearEqJour,
                 jour: _mvEqJour, cfg: function(){ return window.CONFIG; } };
  `, ctx);
  return { api: ctx.api, ctx };
}

const EQ = { equipes_jour: { '2026-09-30': [{ m: ['Victor', 'Shana'] }, { m: ['Nico', 'Alicia'] }, { m: [] }], '2026-09-29': [{ m: ['Victor'] }] } };
const clone = o => JSON.parse(JSON.stringify(o));

function scenarios(src) {
  const T = [], eq = (n, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); T.push([n + (ok ? '' : ' — obtenu ' + JSON.stringify(a) + ', attendu ' + JSON.stringify(b)), ok]); };
  const ok = (n, c) => T.push([n, !!c]);
  let W = monde(src, { config: {} });
  if (W.manque) return [['fonctions introuvables : ' + W.manque.join(', '), false]];
  let e = W.api.applique({ date: '2026-09-30', qui: 'Victor', equipe: false, membresEquipe: [] });
  eq('E1 · rien de réglé : la validation reste telle quelle', [e.equipe, e.membresEquipe, !!e.eqJour], [false, [], false]);

  W = monde(src, { config: clone(EQ) });
  e = W.api.applique({ date: '2026-09-30', qui: 'Victor', equipe: true, membresEquipe: ['Alicia'], quiHors: true });
  eq('E2 · salarié : son équipe du jour est forcée (Shana), le reste est écrasé', [e.equipe, e.membresEquipe, 'quiHors' in e, e.eqJour], [true, ['Shana'], false, true]);
  eq('E3 · … et _eqtFor lit la même équipe (Shana)', W.api.moi(), ['Shana']);
  W = monde(src, { config: clone(EQ), moi: 'Nico', admin: true });
  e = W.api.applique({ date: '2026-09-30', qui: 'Nico', equipe: false, membresEquipe: [] });
  eq('E4 · admin sans groupe choisi : son équipe du jour (Alicia)', [e.equipe, e.membresEquipe], [true, ['Alicia']]);
  e = W.api.applique({ date: '2026-09-30', qui: 'Nico', equipe: true, membresEquipe: ['Victor'] });
  eq('E5 · admin qui corrige le groupe : sa correction reste', e.membresEquipe, ['Victor']);
  W = monde(src, { config: clone(EQ), moi: 'Victor' });
  e = W.api.applique({ date: '2026-09-29', qui: 'Victor', equipe: true, membresEquipe: ['Shana'] });
  eq('E6 · seul dans son équipe ce jour-là : « seul », aucun membre', [e.equipe, e.membresEquipe], [false, []]);
  e = W.api.applique({ date: '2026-09-28', qui: 'Victor', equipe: true, membresEquipe: ['Shana'] });
  eq('E7 · une date sans équipes : inchangée', e.membresEquipe, ['Shana']);
  W = monde(src, { config: clone(EQ), moi: 'Chloé' });
  e = W.api.applique({ date: '2026-09-30', qui: 'Chloé', equipe: false, membresEquipe: [] });
  eq('E8 · hors de toute équipe : inchangée', [e.equipe, !!e.eqJour], [false, false]);
  eq('E9 · une équipe vide est ignorée à la lecture', W.api.jour('2026-09-30').length, 2);

  // Écriture du réglage
  W = monde(src, { config: { equipes_jour: { '2024-01-01': [{ m: ['X'] }], '2026-09-01': [{ m: ['Y'] }] }, autre: 1 }, moi: 'Nico', admin: true });
  W.api.save({ Victor: 1, Shana: 1, Alicia: 2 });
  const c = W.api.cfg();
  eq('E10 · enregistré en objets {m:[…]} (Firestore refuse les tableaux de tableaux)', c.equipes_jour['2026-09-30'], [{ m: ['Victor', 'Shana'] }, { m: ['Alicia'] }]);
  ok('E11 · une journée de plus de deux ans est retirée, une récente reste', !c.equipes_jour['2024-01-01'] && !!c.equipes_jour['2026-09-01']);
  ok('E12 · le reste de la configuration est intact, et elle est sauvée', c.autre === 1 && W.ctx.saves.indexOf('config') >= 0);
  W.api.clear();
  ok('E13 · « tout le monde ensemble » efface la journée', !W.api.cfg().equipes_jour['2026-09-30']);
  W = monde(src, { config: {}, moi: 'Victor', admin: false });
  W.api.save({ Victor: 1, Shana: 1 });
  ok('E14 · un salarié ne peut pas enregistrer d\'équipes', !W.api.cfg().equipes_jour && W.ctx.saves.length === 0);
  return T;
}

function branchements(src) {
  const T = [], A = nu(src.app), U = nu(src.utl), H = src.html;
  const nW = (A.match(/JOURNAL\.unshift\(_mvEqApplique\(/g) || []).length;
  T.push(['B1 · les sept écritures du journal passent par _mvEqApplique (obtenu ' + nW + ')', nW === 7]);
  for (const [p, f] of [['vp', 'openValidationPanel'], ['niv', 'openNiveauxPanel'], ['pass', 'openPassagesPanel'], ['je', 'openJournalEntry']]) {
    T.push(['B2 · ' + f + ' montre l\'équipe du jour', (extraire(A, f) || '').indexOf("_mvEqUi('" + p + "')") >= 0]);
  }
  T.push(['B3 · l\'Accueil affiche la carte', /_mvEqJourRender\(\)/.test(extraire(A, 'renderHome') || '')]);
  T.push(['B4 · _eqtFor lit l\'équipe du jour d\'abord', /var _dj=_mvEqJourMoi\(\); if\(_dj\) return _eqtClean\(_dj\);/.test(extraire(A, '_eqtFor') || '')]);
  T.push(['B5 · la barre d\'équipe ne se modifie pas un jour d\'équipes', /if\(_mvEqJourMoi\(\)\)\{/.test(extraire(A, 'openPTeamJour') || '')]);
  T.push(['B6 · « sans moi » ne vaut pas un jour où l\'admin est dans une équipe', /if\(_mvEqJourMoi\(\)\) return false;/.test(extraire(A, '_eqtHors') || '')]);
  T.push(['B7 · la carte et le réglage existent dans la page', /id="home-eqj-wrap"/.test(H) && /id="ovEqJour"/.test(H) && /id="eqj-rows"/.test(H)]);
  T.push(['B8 · les gestes du réglage sont exposés', ['openEqJour', 'saveEqJour', 'clearEqJour', '_mvEqPick'].every(n => A.indexOf('window.' + n + ' = ' + n) >= 0)]);
  T.push(['B9 · le lecteur est exposé pour pilotage.js', /window\._mvEqJour = _mvEqJour;/.test(U) && /window\._mvEqDe\s+= _mvEqDe;/.test(U)]);
  T.push(['B10 · le panneau d\'un salarié cache le choix du groupe', /if\(!_mvMoiAdmin\(\)\)\{\s*pick\.style\.display='none';/.test(extraire(A, '_mvEqUi') || '')]);
  return T;
}

const executer = src => scenarios(src).concat(branchements(src));

const MUT = [
  ['le salarié n\'est plus forcé', 'app', "    if(!_mvMoiAdmin()){\n      e.equipe=autres.length>0;", "    if(false){\n      e.equipe=autres.length>0;"],
  ['la correction de l\'admin est écrasée', 'app', "    } else if(!(Array.isArray(e.membresEquipe) && e.membresEquipe.length)){", "    } else {"],
  ['tableaux de tableaux enregistrés', 'app', "return {m:t.slice()};", "return t.slice();"],
  ['les vieilles journées ne sont plus retirées', 'app', "if(k<limIso) delete E[k];", ""],
  ['un salarié peut enregistrer', 'app', "function saveEqJour(){\n  if(!_mvMoiAdmin()) return;", "function saveEqJour(){\n"],
  ['une écriture oublie l\'équipe du jour (passages)', 'app', "JOURNAL.unshift(_mvEqApplique(_jeP));", "JOURNAL.unshift(_jeP);"],
  ['le panneau des niveaux ne montre plus l\'équipe', 'app', "  _mvEqUi('niv');", ""],
  ['une équipe vide est lue', 'utl', "    if(m.length) out.push(m);", "    out.push(m);"],
];

let rouge = 0;
console.log('\n══ HARNAIS ÉQUIPES DU JOUR (ÉQUIPES-1) ══\n');
const R0 = executer(BASE);
for (const [n, v] of R0) { console.log((v ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + n); if (!v) rouge++; }
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVES (chaque défaut doit faire rougir) ──\n');
  for (const [nom, cle, de, vers] of MUT) {
    if (BASE[cle].split(de).length !== 2) { console.log('  \x1b[31m✗\x1b[0m ERREUR D\'INJECTION : ancre introuvable ou multiple — ' + nom); rouge++; continue; }
    let Rm;
    try { Rm = executer({ ...BASE, [cle]: BASE[cle].replace(de, vers) }); } catch (err) { Rm = [['exception : ' + err.message, false]]; }
    const n = Rm.filter(r => !r[1]).length;
    if (n > 0) console.log('  \x1b[32m✓\x1b[0m DÉTECTÉ  ' + nom + ' (' + n + ' rouge' + (n > 1 ? 's' : '') + ')');
    else { console.log('  \x1b[31m✗\x1b[0m RESTE VERT  ' + nom); rouge++; }
  }
}
console.log('\n' + (rouge ? '\x1b[31mROUGE\x1b[0m — ' + rouge + ' échec(s)' : '\x1b[32mVERT\x1b[0m') + '  —  ' + R0.length + ' assertions' + (CONTRE ? ', ' + MUT.length + ' contre-épreuves' : '') + '\n');
process.exit(rouge ? 1 : 0);
