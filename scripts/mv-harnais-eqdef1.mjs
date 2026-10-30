// HARNAIS — EQDEF-1 (§492) : « Équipes du jour » sans « Aucune » — personne hors équipe, tout le monde arrive en Équipe 1.
//   node scripts/mv-harnais-eqdef1.mjs           → doit être vert
//   node scripts/mv-harnais-eqdef1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (30/10, message dicté) : « il faut retirer aucune, parce que ça fait planter la sélection des équipes une fois qu'on est
// sur l'ouvrier… on démarre à partir de équipe 1 ; si on ne change rien, tout le monde est dans l'équipe 1… l'équipe seule, c'est
// l'administrateur qui décidera ». Joue les VRAIES fonctions de la fenêtre, extraites de src/app.js et src/utils.js (commentaires
// retirés) : l'ouverture (openEqJour), les rangées (_mvEqRows), le choix (_mvEqPick), l'enregistrement (saveEqJour et ce qu'il
// appelle), puis la lecture côté salarié (_mvEqDe). Le reste des équipes du jour est tenu par mv-harnais-equipes-jour (§199),
// la cave par mv-harnais-jcave1 (§428), l'équipe imposée au salarié par mv-harnais-eqfixe1 (§490).
// ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { app: lire('src/app.js'), utl: lire('src/utils.js'), idx: lire('index.html'), tutos: lire('src/tutos.js'),
  wn: lire('src/whats-new.js'), guide: lire('guide/04-vigne.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
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

// ── Le monde de la fenêtre : l'administrateur, les fiches, la cave du Planning, la configuration du domaine ──
const JOUR = '2026-10-30';
const FA = ['_mvEquipeProposee', '_mvEqMembres', 'openEqJour', '_mvEqRows', '_mvEqTrn', '_mvEqBrut', '_mvEqPick', '_mvEqEcrire', '_mvEqApres',
  '_mvEqCaveEcrire', 'saveEqJour', 'clearEqJour'];
const FICHES = [{ nom: 'Marie' }, { nom: 'Jean' }, { nom: 'Sophie' }, { nom: 'Paul' }, { nom: 'Hugo', bureau: true }, { nom: 'Lucas' }];
function monde(src, o = {}) {
  const A = nu(src.app), U = nu(src.utl), code = [], manque = [];
  for (const n of FA) { const f = extraire(A, n); if (f) code.push(f); else manque.push(n); }
  // EQDEF-2 (§493) : le lecteur passe par l'enregistrement en place.
  for (const n of ['_mvEqSource', '_mvEqPresents', '_mvEqEnPlace', '_mvEqOrigine', '_mvEqJour', '_mvEqDe']) { const f = extraire(U, n); if (f) code.push(f); else manque.push(n); }
  if (manque.length) return { manque };
  const reg = {};
  ['eqj-rows', 'eqj-date'].forEach(id => { reg[id] = { id, innerHTML: '', textContent: '' }; });
  const ctx = { console, Date, Math, JSON, String, Number, Array, Object, parseInt, TOASTS: [], OUVERTS: [], SAUVES: [], CAVE_ECRITE: [],
    document: { getElementById: id => reg[id] || null },
    CustomEvent: function (n) { this.type = n; }, dispatchEvent: () => true };
  ctx.window = ctx;
  ctx.CONFIG = o.config || {};
  vm.createContext(ctx);
  vm.runInContext(`
    var currentUser = { nom: 'Marie' };
    var MEMBRES = ${JSON.stringify(FICHES)};
    var HORS = ['Lucas'];   // fin de contrat avant aujourd'hui : ni proposé, ni rangé
    var CAVE = ${JSON.stringify(o.cave || {})};
    var TRN = ${JSON.stringify(o.tournees || [])};
    var _EQJ_SEL = {}, _EQJ_TRN = {};
    var MV_EQ_SUITE_DEPUIS = '2026-10-30';
    function _mvMoiAdmin(){ return ${o.salarie ? 'false' : 'true'}; }
    function _mvToday(){ return '${JOUR}'; }
    function _mvISO(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function _escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _escAttr(s){ return _escHtml(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    function openOv(id){ OUVERTS.push(id); }
    function closeOv(){}
    function showToast(m){ TOASTS.push(m); }
    function saveData(k){ SAUVES.push(k); }
    function _mvEqJourRender(){}
    function _pvRenderTeamBar(){}
    window._mvEnContratLe = function(m){ return HORS.indexOf(m.nom) < 0; };
    window._mvCaveJour = function(nom, iso){ return CAVE[nom + '|' + iso] || ''; };
    window._mvCaveEcrire = function(liste, part){ liste.forEach(function(x){ CAVE_ECRITE.push([x.nom, part]); if(part) CAVE[x.nom + '|' + x.iso] = part; else delete CAVE[x.nom + '|' + x.iso]; }); return liste.length; };
    window._mvTourneesLues = function(){ return TRN; };
    ${code.join('\n')}
    window._mvEqJour = _mvEqJour; window._mvEqDe = _mvEqDe; window._mvEqEnPlace = _mvEqEnPlace; window._mvEqOrigine = _mvEqOrigine;
    this.api = {
      ouvrir: function(){ openEqJour(); return document.getElementById('eqj-rows').innerHTML; },
      choisir: function(n, k){ _mvEqPick({ getAttribute: function(a){ return a === 'data-eqj-n' ? n : String(k); } }); return document.getElementById('eqj-rows').innerHTML; },
      tournee: function(k, id){ _mvEqTrn({ value: id, getAttribute: function(){ return String(k); } }); },
      enregistrer: function(){ saveEqJour(); return window.CONFIG.equipes_jour ? window.CONFIG.equipes_jour['${JOUR}'] : undefined; },
      etat: function(){ return JSON.parse(JSON.stringify(_EQJ_SEL)); },
      de: function(n){ return _mvEqDe(n, '${JOUR}'); } };
  `, ctx);
  return { api: ctx.api, ctx };
}

// Dans une rangée, le choix allumé de chacun : { Marie: '1', Paul: 'cave', … } — et les choix proposés.
const allumes = h => Object.fromEntries([...h.matchAll(/class="pchk sel (?:vert|cave)" data-eqj-n="([^"]+)" data-eqj-k="([^"]+)"/g)].map(m => [m[1], m[2]]));
const proposes = (h, n) => [...h.matchAll(new RegExp('data-eqj-n="' + n + '" data-eqj-k="([^"]+)"', 'g'))].map(m => m[1]);
const fenetre = idx => { const i = idx.indexOf('id="ovEqJour"'); return i < 0 ? '' : idx.slice(i, idx.indexOf('id="eqj-rows"', i)); };
const tutoEquipes = tu => { const i = tu.indexOf("{ id: 'equipes',"); return i < 0 ? '' : tu.slice(i, tu.indexOf('\n  { id: ', i + 10)); };

function scenarios(src) {
  const T = [], eq = (n, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); T.push([n + (ok ? '' : ' — obtenu ' + JSON.stringify(a) + ', attendu ' + JSON.stringify(b)), ok]); };
  const ok = (n, c) => T.push([n, !!c]);
  // R1-R4 · un jour où rien n'est encore enregistré
  let W = monde(src);
  if (W.manque) return [['fonctions introuvables : ' + W.manque.join(', '), false]];
  let h = W.api.ouvrir();
  eq('R1 · chacun se voit proposer Équipe 1 à 4 et Cave, et rien d’autre', ['Marie', 'Jean', 'Sophie', 'Paul'].map(n => proposes(h, n).join(',')), Array(4).fill('1,2,3,4,cave'));
  ok('R2 · plus de « Aucune » dans la fenêtre', !/Aucune/.test(h) && !/data-eqj-k="0"/.test(h));
  eq('R3 · à l’ouverture, tout le monde est en Équipe 1 (allumé à l’écran)', allumes(h), { Marie: '1', Jean: '1', Sophie: '1', Paul: '1' });
  eq('R4 · … et dans l’état que l’enregistrement lira', W.api.etat(), { Marie: 1, Jean: 1, Sophie: 1, Paul: 1 });
  ok('R5 · les fiches de bureau et les contrats finis ne sont ni proposés ni rangés', !/data-eqj-n="(Hugo|Lucas)"/.test(h) && !('Hugo' in W.api.etat()) && !('Lucas' in W.api.etat()));
  let E = W.api.enregistrer();
  eq('R6 · enregistré sans rien toucher : une seule équipe, tout le monde ensemble', E, [{ m: ['Marie', 'Jean', 'Sophie', 'Paul'] }]);
  ok('R7 · … la configuration du domaine est enregistrée, et le message le dit', W.ctx.SAUVES.indexOf('config') >= 0 && W.ctx.TOASTS[0] === '1 \u00e9quipe en place \u00e0 partir d\u2019aujourd\u2019hui');   // EQDEF-2 (§493) : jusqu'au prochain réglage
  eq('R8 · côté salarié, personne n’est seul : chacun lit l’équipe de tous', ['Jean', 'Paul'].map(n => W.api.de(n)), [['Marie', 'Jean', 'Sophie', 'Paul'], ['Marie', 'Jean', 'Sophie', 'Paul']]);
  // R9-R12 · l'administrateur met quelqu'un seul : une équipe à lui, la quatrième s'il le faut
  W = monde(src); W.api.ouvrir();
  W.api.choisir('Jean', 2); W.api.choisir('Sophie', 3);
  h = W.api.choisir('Paul', 4);
  eq('R9 · Équipe 4 existe et se choisit', allumes(h).Paul, '4');
  E = W.api.enregistrer();
  eq('R10 · quatre équipes, chacun la sienne', E, [{ m: ['Marie'] }, { m: ['Jean'] }, { m: ['Sophie'] }, { m: ['Paul'] }]);
  eq('R11 · seul, c’est l’administrateur qui l’a voulu : le salarié lit son équipe à lui', W.api.de('Paul'), ['Paul']);
  W = monde(src); W.api.ouvrir();
  W.api.choisir('Jean', 0);
  eq('R12 · un « 0 » (l’ancienne « Aucune ») ne sort personne de son équipe', W.api.etat().Jean, 1);
  // R13-R15 · ce qui était déjà réglé n'est pas écrasé par le défaut
  W = monde(src, { cave: { ['Sophie|' + JOUR]: 'j' } });
  h = W.api.ouvrir();
  eq('R13 · une journée de cave posée au Planning arrive sur « Cave », pas en Équipe 1', allumes(h).Sophie, 'cave');
  E = W.api.enregistrer();
  eq('R14 · … et Sophie reste hors des équipes de la vigne', E, [{ m: ['Marie', 'Jean', 'Paul'] }]);
  W = monde(src, { config: { equipes_jour: { [JOUR]: [{ m: ['Jean', 'Sophie'] }, { m: ['Paul'] }] } } });
  h = W.api.ouvrir();
  eq('R15 · une journée enregistrée avant ce lot : chacun retrouve son équipe, l’oublié arrive en Équipe 1', allumes(h), { Marie: '1', Jean: '1', Sophie: '1', Paul: '2' });   // l'ordre des rangées : celui des fiches
  // R16-R17 · la tournée de chaque équipe suit, Équipe 4 comprise
  W = monde(src, { tournees: [{ id: 't-hiver', nom: 'Hiver' }] });
  h = W.api.ouvrir();
  ok('R16 · dès l’ouverture, la tournée de l’Équipe 1 se choisit', /<span>\u00c9quipe 1<\/span><select data-eqj-k="1"/.test(h) && !/<select data-eqj-k="2"/.test(h));
  W.api.choisir('Paul', 4); W.api.tournee(4, 't-hiver');
  E = W.api.enregistrer();
  eq('R17 · Paul en Équipe 4 avec sa tournée : écrite avec son équipe', E, [{ m: ['Marie', 'Jean', 'Sophie'] }, { m: ['Paul'], t: 't-hiver' }]);
  // R18 · la porte reste fermée à un salarié
  W = monde(src, { salarie: true });
  W.api.ouvrir();
  ok('R18 · un salarié n’ouvre pas la fenêtre et ne range personne', W.ctx.OUVERTS.length === 0 && Object.keys(W.api.etat()).length === 0);
  return T;
}

function branchements(src) {
  const T = [], F = fenetre(src.idx), tu = tutoEquipes(src.tutos);
  T.push(['B1 · l’aide de la fenêtre ne parle plus de « Aucune » et dit l’Équipe 1', !!F && !/Aucune/.test(F) && F.includes('Tout le monde arrive en \u00c9quipe 1') && F.includes('une \u00e9quipe \u00e0 lui')]);
  T.push(['B2 · le tuto des équipes : plus de « Aucune », plus de choix « 0 », il enseigne l’équipe à soi', !!tu && !/Aucune/.test(tu.replace(/^\s*\/\/.*$/gm, '')) && !/data-eqj-k="0"/.test(tu)
    && tu.includes("'[data-eqj-n=\"Paul\"][data-eqj-k=\"2\"]'") && tu.includes('Tout le monde arrive en \u00c9quipe 1.') && tu.includes("couvre: ['openEqJour', '_mvEqPick', 'saveEqJour']")]);
  T.push(['B3 · l’aide de la Vigne le dit (quatre au plus, Équipe 1, seul = une équipe à lui)', src.utl.includes('en \u00e9quipes, quatre au plus : <b>elles restent en place les jours suivants</b>') && src.utl.includes('Tout le monde y arrive en \u00c9quipe 1 ; pour mettre quelqu\u2019un seul, il lui donne une \u00e9quipe \u00e0 lui.')]);
  T.push(['B4 · le guide le dit', src.guide.includes('quatre au plus :') && src.guide.includes("tout le monde y arrive en <b>\u00c9quipe 1</b>, et quelqu'un n'est seul que si on lui donne une \u00e9quipe \u00e0 lui")]);
  T.push(['B5 · les nouveautés 10.43 l’annoncent à l’administrateur', /\{ v: '10\.43', d: '2026-10-30', items: \[\n    \{ niv: 0, pour: \['admin'\], emoji: 'equipe', titre: 'Personne hors \u00e9quipe dans les \u00c9quipes du jour'/.test(src.wn)]);
  T.push(['B6 · ce harnais est branché dans la liste des contrôles', src.liste.includes("['node scripts/mv-harnais-eqdef1.mjs'") && src.liste.includes("['node scripts/mv-harnais-eqdef1.mjs --contre'")]);
  return T;
}

const executer = src => { try { return scenarios(src).concat(branchements(src)); } catch (err) { return [['plantage : ' + (err && err.message), false]]; } };

const MUT = [
  ['« Aucune » revient (0 à 3)', 'app', 'var ch=[1,2,3,4].map(function(k){', 'var ch=[0,1,2,3].map(function(k){'],
  ['plus d’Équipe 1 par défaut', 'app', '  _mvEqMembres().forEach(function(m){ if(_EQJ_SEL[m.nom]==null) _EQJ_SEL[m.nom]=1; });', ''],
  ['le défaut écrase l’équipe enregistrée et la cave', 'app', 'if(_EQJ_SEL[m.nom]==null) _EQJ_SEL[m.nom]=1;', '_EQJ_SEL[m.nom]=1;'],
  ['le défaut range aussi le bureau et les contrats finis', 'app', '  _mvEqMembres().forEach(function(m){ if(_EQJ_SEL[m.nom]==null)', '  (MEMBRES||[]).forEach(function(m){ if(_EQJ_SEL[m.nom]==null)'],
  ['un « 0 » retire de nouveau la personne', 'app', '  if(!k) return;   // \u2605 EQDEF-1 (\u00a7492)', '  if(!k){ delete _EQJ_SEL[n]; _mvEqRows(); return; }   // \u2605 EQDEF-1 (\u00a7492)'],
  ['l’aide de la fenêtre reparle de « Aucune »', 'idx', "Tout le monde arrive en \u00c9quipe 1 : touchez l'\u00e9quipe de ceux qui travaillent ailleurs.", "Touchez l'\u00e9quipe de chacun. Quelqu'un laiss\u00e9 sur \u00ab Aucune \u00bb garde ses heures."],
  ['le tuto retombe sur « Aucune »', 'tutos', "'Tout le monde arrive en \u00c9quipe 1. Pour mettre quelqu\u2019un seul, donnez-lui une \u00e9quipe \u00e0 lui.',", "'Une \u00e9quipe par personne. \u00ab Aucune \u00bb garde ses heures pour ses propres validations.',"],
  ['l’aide de la Vigne oublie l’Équipe 1', 'utl', ' Tout le monde y arrive en \u00c9quipe 1 ; pour mettre quelqu\u2019un seul, il lui donne une \u00e9quipe \u00e0 lui.', ''],
  ['le guide oublie l’Équipe 1', 'guide', 'tout le monde y arrive en <b>\u00c9quipe 1</b>', 'tout le monde y arrive'],
  ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-eqdef1.mjs'", "['node scripts/mv-harnais-eqdef1-x.mjs'"],
];

let rouge = 0;
console.log('\n══ HARNAIS PERSONNE HORS ÉQUIPE (EQDEF-1) ══\n');
const R0 = executer(BASE);
for (const [n, v] of R0) { console.log((v ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + n); if (!v) rouge++; }
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVES (chaque défaut doit faire rougir) ──\n');
  for (const [nom, cle, de, vers] of MUT) {
    if (BASE[cle].split(de).length !== 2) { console.log('  \x1b[31m✗\x1b[0m ERREUR D\'INJECTION : ancre introuvable ou multiple — ' + nom); rouge++; continue; }
    const Rm = executer({ ...BASE, [cle]: BASE[cle].replace(de, vers) });
    const n = Rm.filter(r => !r[1]).length;
    if (n > 0) console.log('  \x1b[32m✓\x1b[0m DÉTECTÉ  ' + nom + ' (' + n + ' rouge' + (n > 1 ? 's' : '') + ')');
    else { console.log('  \x1b[31m✗\x1b[0m RESTE VERT  ' + nom); rouge++; }
  }
}
console.log('\n' + (rouge ? '\x1b[31mROUGE\x1b[0m — ' + rouge + ' échec(s)' : '\x1b[32mVERT\x1b[0m') + '  —  ' + R0.length + ' assertions' + (CONTRE ? ', ' + MUT.length + ' contre-épreuves' : '') + '\n');
process.exit(rouge ? 1 : 0);
