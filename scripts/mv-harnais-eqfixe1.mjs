// HARNAIS — EQFIXE-1 (§490) : l'équipe posée par l'administrateur s'impose au salarié et se lit à chaque affichage.
//   node scripts/mv-harnais-eqfixe1.mjs           → doit être vert
//   node scripts/mv-harnais-eqfixe1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (30/10) : « un ouvrier sélectionné dans une équipe et sur une tâche prioritaire, lorsqu'il allume son application,
// n'est pas dans l'équipe définie par l'administrateur ; il est bien sur la tâche ». Joue les VRAIES fonctions extraites de
// src/app.js et src/utils.js (commentaires retirés) : la lecture (_eqtFor), la saisie (_mvEqApplique), la barre
// (_pvRenderTeamBar), son appui (openPTeamJour), le panneau de validation (_mvEqUi), la carte de l'Accueil (_homePrioCarte).
// Le côté « équipes du jour » seul reste tenu par mv-harnais-equipes-jour (ÉQUIPES-1, §199).
// ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { app: lire('src/app.js'), utl: lire('src/utils.js'), wn: lire('src/whats-new.js'), guide: lire('guide/04-vigne.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
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
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }

// ── Le monde des Parcelles : un salarié (ou l'admin), la config du domaine, la mémoire du téléphone ──
const FA = ['_mvEqJourMoi', '_mvEqPrioDe', '_mvEqPrioMoi', '_mvEqFixeeMot', '_mvEqApplique', '_mvEqUi', '_mvEqUiTache', '_prioItems', '_prioForMember',
  '_eqtClean', '_mvEquipeProposee', '_eqtKey', '_eqtRecentKey', '_eqtSameTeam', '_eqtPushRecent', '_eqtLoad', '_eqtSave', '_eqtHors', '_eqtFor', '_eqtSet',
  '_pvRenderTeamBar', 'openPTeamJour'];
function monde(src, o = {}) {
  const A = nu(src.app), U = nu(src.utl), code = [], manque = [];
  for (const n of FA) { const f = extraire(A, n); if (f) code.push(f); else manque.push(n); }
  for (const n of ['_mvEqJour', '_mvEqDe']) { const f = extraire(U, n); if (f) code.push(f); else manque.push(n); }
  if (manque.length) return { manque };
  const LS = new Map(), reg = {};
  const el = id => { const e = { id, style: {}, textContent: '', innerHTML: '', value: '', classList: { toggle() {}, add() {}, remove() {} },
    parentNode: { insertBefore: n => { reg[n.id] = n; } } }; reg[id] = e; return e; };
  ['p-team-bar', 'vp-equipe-pick', 'vp-equipe-section', 'vp-equipe-val'].forEach(el);
  const moi = o.moi || 'Victor';
  if (o.memoire) LS.set('mavigne_eqt_default_' + moi, JSON.stringify(o.memoire));
  const ctx = { console, Date, Math, JSON, String, Number, Array, Object, parseInt, TOASTS: [], OUVERTS: [], EQJ: [],
    localStorage: { getItem: k => (LS.has(k) ? LS.get(k) : null), setItem: (k, v) => LS.set(k, String(v)), removeItem: k => LS.delete(k) },
    document: { getElementById: id => reg[id] || null, createElement: () => el('_neuf' + Object.keys(reg).length), querySelectorAll: () => [] } };
  ctx.window = ctx;
  ctx.CONFIG = o.config || {};
  vm.createContext(ctx);
  vm.runInContext(`
    var currentUser = { nom: ${JSON.stringify(moi)} };
    var MEMBRES = ${JSON.stringify(['Victor', 'Shana', 'Alicia', 'Chloé', 'Nico', 'Pauline'].map(nom => ({ nom })))};
    var COULEURS_MBR = {}, priorityTask = '', pTacheFilter = 'Taille';
    var EQUIPE_TACHE = {}, EQUIPE_RECENT = [], _eqtLoaded = false, _pvTeamSel = [], _pvMoiHors = false;
    var _validTache = 'Taille', _nivTache = '', _passTache = '';
    var HORS = ${JSON.stringify(o.horsContrat || [])};
    function _mvMoiAdmin(){ return ${o.admin ? 'true' : 'false'}; }
    function _mvToday(){ return '2026-10-30'; }
    function getSaisonActive(){ return { nom: 'Hiver 2026' }; }
    function getTachesSaison(){ return [{ nom: 'Taille' }, { nom: 'Tirage' }, { nom: 'Réparation' }]; }
    function canWrite(){ return true; }
    function tNom(t){ return t; }
    function _escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function showToast(m){ TOASTS.push(m); }
    function openOv(id){ OUVERTS.push(id); }
    function openEqJour(){ EQJ.push(1); }
    function _pvBuildRecent(){} function _pvBuildTeamPick(){}
    function toggleEquipeMode(){} function toggleNivEquipeMode(){} function togglePassEquipeMode(){} function toggleJEMode(){}
    window._mvEnContratLe = function(m){ return HORS.indexOf(m.nom) < 0; };
    ${code.join('\n')}
    window._mvEqJour = _mvEqJour; window._mvEqDe = _mvEqDe;
    this.api = { pour: _eqtFor, applique: _mvEqApplique,
      barre: function(){ _pvRenderTeamBar(); return document.getElementById('p-team-bar').innerHTML; },
      appui: function(){ openPTeamJour(); },
      panneau: function(p){ _mvEqUi(p); return { note: document.getElementById(p + '-eqj-note'), pick: document.getElementById(p + '-equipe-pick'), val: document.getElementById(p + '-equipe-val') }; },
      tache: function(t){ pTacheFilter = t; _validTache = t; } };
  `, ctx);
  return { api: ctx.api, ctx };
}

// ── La carte du jour de l'Accueil (le patron de mv-harnais-accv1) : « Votre équipe » chez un salarié ──
function accueil(src, moi) {
  const el = id => ({ id, parentNode: null, className: '', classList: { add() {} }, innerHTML: '' });
  const w = el('w'), kp = el('home-kpis'), eq = el('home-eqj-wrap'), corps = { v: null };
  w.insertBefore = n => { n.parentNode = w; if (n.id === 'home-prio-corps') corps.v = n; };
  const doc = { querySelector: () => w, getElementById: id => (id === 'home-kpis' ? kp : id === 'home-eqj-wrap' ? eq : id === 'home-prio-corps' ? corps.v : null), createElement: () => el('home-prio-corps') };
  const IT = { t: 'Réparation', equipe: ['Lucas', 'Inès'] };
  const corpsF = ['function _homeSurf(p){', 'function _homeHa(x){', 'function _homeForme(f,r){', 'function _homeDreLignes(now){', 'function _homePrioCarte(){'].map(d => fonction(src.app, d)).join('\n');
  const noms = ['document', 'PARCELLES', '_prioItems', '_prioForMember', 'getTacheStatut', 'getPCls', 'tNom', '_escAttr', '_escHtml', '_pvSurfFr', 'window', 'currentUser', '_mvMoiAdmin', '_mvIcon', 'JOURNAL', 'MEMBRES', 'priorityMessage', '_mvToday', '_mvISO', '_mvPartCalc', '_mvPartDate', '_mvPartTache', '_hvHeure', 'fmtDate', '_mvEqBrut', 'dreEffectif'];
  const f = new Function(...noms, corpsF + '\n_homePrioCarte(); return document.getElementById(\'home-prio-corps\');');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const win = { _mvParcForme: () => null, _mvEqJour: () => null, _mvTourneesLues: () => [], _mvPqBtn: () => '', TRAITEMENTS: [], CATALOGUE: [] };
  const c = f(doc, [{ nom: 'Les Crais', surface: '0,5' }], () => [IT], n => (IT.equipe.indexOf(n) >= 0 ? IT : null), () => 'Non démarré', () => ({ pct: 0 }), t => t, esc, esc, s => s, win,
    { nom: moi }, () => false, () => '', [], [{ nom: 'Lucas' }, { nom: 'Inès' }], '', () => '2026-10-30', () => '2026-10-29',
    () => ({ pct: 10, restN: 1, rest: 0.5, fin: null }), () => '', () => null, () => '', s => s, () => [], () => ({ h: 0 }));
  return c ? c.innerHTML : '';
}

const PRIO = eq => ({ tachesPrio: { saison: 'Hiver 2026', items: [{ t: 'Taille', equipe: eq }] } });
const FIXEE = qui => '\u00c9quipe fix\u00e9e par l\u2019administrateur\u00a0: ' + qui;

function scenarios(src) {
  const T = [], eq = (n, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); T.push([n + (ok ? '' : ' — obtenu ' + JSON.stringify(a) + ', attendu ' + JSON.stringify(b)), ok]); };
  const ok = (n, c) => T.push([n, !!c]);
  let W = monde(src, { config: PRIO(['Victor', 'Shana']) });
  if (W.manque) return [['fonctions introuvables : ' + W.manque.join(', '), false]];
  eq('P1 · salarié coché sur la priorité : son équipe est celle de l’admin (Shana)', W.api.pour('Taille'), ['Shana']);
  W.ctx.CONFIG = PRIO(['Victor', 'Alicia']);   // le téléphone relit la config (ouverture, retour dans l'appli)
  eq('P2 · l’admin change l’équipe sur la même tâche : elle suit au prochain affichage (le défaut signalé)', W.api.pour('Taille'), ['Alicia']);
  W = monde(src, { config: PRIO(['Victor', 'Alicia']), memoire: { Taille: ['Victor', 'Shana'] } });
  eq('P3 · une ancienne équipe dans la mémoire du téléphone ne passe plus devant', W.api.pour('Taille'), ['Alicia']);
  W = monde(src, { config: Object.assign(PRIO(['Victor', 'Shana']), { equipes_jour: { '2026-10-30': [{ m: ['Victor', 'Pauline'] }] } }) });
  eq('P4 · les Équipes du jour passent devant la priorité', W.api.pour('Taille'), ['Pauline']);
  W = monde(src, { moi: 'Chloé', config: PRIO(['Victor', 'Shana']), memoire: { Taille: [] } });
  eq('P5 · un salarié coché dans aucune équipe garde son choix — pas l’équipe des autres', W.api.pour('Taille'), []);
  let e = W.api.applique({ date: '2026-10-30', qui: 'Chloé', tache: 'Taille', equipe: false, membresEquipe: [] });
  eq('P6 · … et sa validation reste telle quelle', [e.equipe, e.membresEquipe], [false, []]);
  W = monde(src, { moi: 'Nico', admin: true, config: PRIO(['Nico', 'Alicia']), memoire: { Taille: ['Pauline'] } });
  eq('P7 · l’administrateur garde la main : rien ne lui est imposé', W.api.pour('Taille'), ['Pauline']);
  e = W.api.applique({ date: '2026-10-30', qui: 'Nico', tache: 'Taille', equipe: true, membresEquipe: ['Pauline'] });
  eq('P8 · … et sa validation garde son groupe', e.membresEquipe, ['Pauline']);
  W = monde(src, { config: PRIO(['Victor']), memoire: { Taille: ['Shana'] } });
  eq('P9 · coché seul sur la priorité : seul, et c’est imposé (la mémoire ne revient pas)', W.api.pour('Taille'), []);
  W = monde(src, { config: PRIO(['Victor', 'Alicia']) });
  e = W.api.applique({ date: '2026-10-30', qui: 'Victor', tache: 'Taille', equipe: true, membresEquipe: ['Hugo'], quiHors: true });
  eq('P10 · la validation du salarié part avec l’équipe de la priorité', [e.equipe, e.membresEquipe, 'quiHors' in e], [true, ['Alicia'], false]);
  ok('P11 · … sans se dire « équipe du jour »', !e.eqJour);
  e = W.api.applique({ date: '2026-10-30', qui: 'Victor', tache: 'Tirage', equipe: false, membresEquipe: [] });
  eq('P12 · une autre tâche que la priorité : inchangée', [e.equipe, e.membresEquipe], [false, []]);
  // La barre « Équipe sur… » et son appui
  W = monde(src, { config: PRIO(['Victor', 'Alicia']) });
  const h = W.api.barre();
  ok('P13 · la barre dit « Fixée », plus « Changer »', h.includes('>Fix\u00e9e<') && !h.includes('>Changer<'));
  W.api.appui();
  eq('P14 · un appui nomme l’équipe, sans ouvrir le choix', [W.ctx.TOASTS[0], W.ctx.OUVERTS.length], [FIXEE('Victor + Alicia'), 0]);
  W = monde(src, { config: PRIO(['Victor']) });
  W.api.appui();
  eq('P15 · seul sur la priorité : le message le dit', W.ctx.TOASTS[0], FIXEE('personne d\u2019autre que vous'));
  W = monde(src, { moi: 'Chloé', config: PRIO(['Victor', 'Shana']) });
  const h2 = W.api.barre(); W.api.appui();
  ok('P16 · rien d’imposé : « Changer » ouvre le choix, comme avant', h2.includes('>Changer<') && W.ctx.OUVERTS[0] === 'ovPTeam' && !W.ctx.TOASTS.length);
  W = monde(src, { config: { equipes_jour: { '2026-10-30': [{ m: ['Victor', 'Pauline'] }] } } });
  W.api.appui();
  eq('P17 · équipe du jour : l’appui la nomme aussi', W.ctx.TOASTS[0], '\u00c9quipe du jour fix\u00e9e par l\u2019administrateur\u00a0: Victor + Pauline');
  // Le panneau de validation
  W = monde(src, { config: PRIO(['Victor', 'Alicia']) });
  let p = W.api.panneau('vp');
  ok('P18 · le panneau de validation : choix caché, note « fixée », valeur « oui »', p.pick.style.display === 'none' && p.note && p.note.textContent === '\u00c9quipe fix\u00e9e par l\u2019administrateur : Victor + Alicia' && p.val.value === 'oui');
  W.api.tache('Tirage'); p = W.api.panneau('vp');
  ok('P19 · … pas sur une autre tâche', p.pick.style.display === '' && p.note && p.note.style.display === 'none');
  // Les garde-fous
  W = monde(src, { config: { tachesPrio: { saison: 'Été 2026', items: [{ t: 'Taille', equipe: ['Victor', 'Shana'] }] } }, memoire: { Taille: ['Pauline'] } });
  eq('P20 · une priorité posée pour une autre période ne s’impose pas', W.api.pour('Taille'), ['Pauline']);
  W = monde(src, { config: PRIO(['Victor', 'Shana', 'Alicia']), horsContrat: ['Shana'] });
  eq('P21 · un équipier hors contrat ce jour-là sort de l’équipe', W.api.pour('Taille'), ['Alicia']);
  // L'Accueil suit la même règle
  let a1 = '', a2 = '';
  try { a1 = accueil(src, 'Lucas'); a2 = accueil(src, 'Sophie'); } catch (err) { a1 = a2 = 'plantage ' + err.message; }
  ok('A1 · Accueil, salarié coché : « Votre équipe » = l’équipe de la priorité, et c’est dit', a1.includes('Lucas et In\u00e8s') && a1.includes('\u00e9quipe de la priorit\u00e9'));
  ok('A2 · Accueil, salarié coché nulle part : « Toute l’équipe », plus l’équipe des autres', a2.includes('Toute l\u2019\u00e9quipe') && a2.includes('pas d\u2019\u00e9quipe indiqu\u00e9e') && !a2.includes('Lucas et In\u00e8s'));
  return T;
}

function branchements(src) {
  const T = [], A = nu(src.app);
  T.push(['B1 · plus de recopie unique par session (_prioSeedEquipe et son verrou ont disparu du code)', !/_prioSeedEquipe|_prioEqSeeded/.test(A)]);
  const f = extraire(A, '_eqtFor') || '', i1 = f.indexOf('_mvEqJourMoi()'), i2 = f.indexOf('_mvEqPrioMoi(task)'), i3 = f.indexOf('EQUIPE_TACHE[task]');
  T.push(['B2 · _eqtFor : l’équipe du jour, puis celle de la priorité, puis la mémoire du téléphone', i1 >= 0 && i2 > i1 && i3 > i2]);
  T.push(['B3 · l’aide de la Vigne le dit (arrivée, deux gestes)', src.utl.includes('Chez un salarié, l’équipe posée par l’administrateur') && src.utl.includes('Fixée\u00a0» : un appui la nomme')]);
  T.push(['B4 · le guide le dit (priorité, bandeau)', src.guide.includes('un salarié coché la retrouve sur ses parcelles et ne peut pas la changer') && src.guide.includes("s'impose : le bandeau dit <b>« Fixée »</b>")]);
  T.push(['B5 · les nouveautés 10.41 l’annoncent', /\{ v: '10\.41', d: '2026-10-30', items: \[/.test(src.wn) && src.wn.includes("titre: 'L’équipe de la priorité, dès l’ouverture'")]);
  T.push(['B6 · ce harnais est branché dans la liste des contrôles', src.liste.includes("['node scripts/mv-harnais-eqfixe1.mjs'],") && src.liste.includes("['node scripts/mv-harnais-eqfixe1.mjs --contre'],")]);
  return T;
}

const executer = src => { try { return scenarios(src).concat(branchements(src)); } catch (err) { return [['plantage : ' + (err && err.message), false]]; } };

const MUT = [
  ['la mémoire du téléphone repasse devant la priorité', 'app', 'var _dp=_mvEqPrioMoi(task); if(_dp) return _eqtClean(_dp);', 'var _dp=null;'],
  ['l’administrateur se voit imposer l’équipe', 'app', 'if(!me || _mvMoiAdmin()) return null;\n    var T=_mvEqPrioDe(me, task);', 'if(!me) return null;\n    var T=_mvEqPrioDe(me, task);'],
  ['l’équipe des autres est donnée d’office', 'app', 'it.equipe.indexOf(String(nom))>=0) return it.equipe.slice();', 'true) return it.equipe.slice();'],
  ['seul sur la priorité = rien d’imposé', 'app', "    var T=_mvEqPrioDe(me, task);\n    return T ? T.filter(function(n){ return n!==me; }) : null;", "    var T=_mvEqPrioDe(me, task);\n    var A2=T?T.filter(function(n){ return n!==me; }):null; return (A2&&A2.length)?A2:null;"],
  ['la validation oublie l’équipe de la priorité', 'app', 'T=_mvEqPrioDe(e.qui, e.tache);', 'T=null;'],
  ['la validation se dit « équipe du jour »', 'app', 'delete e.quiHors; if(duJour) e.eqJour=true;', 'delete e.quiHors; e.eqJour=true;'],
  ['« Changer » revient sur une équipe imposée', 'app', "(_fixe?'Fix\\u00e9e':'Changer')", "'Changer'"],
  ['l’appui rouvre le choix', 'app', "var _dp=_mvEqPrioMoi(pTacheFilter); if(_dp){ showToast(_mvEqFixeeMot(_dp,false),'#7A4F2E'); return; }", ''],
  ['le panneau ignore la priorité', 'app', 'if(!T && me && !_mvMoiAdmin()) T=_mvEqPrioDe(me, _mvEqUiTache(prefix));', ''],
  ['l’Accueil montre l’équipe des autres', 'app', 'it.equipe.indexOf(me)>=0)?it.equipe:null', 'it.equipe.length)?it.equipe:null'],
  ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-eqfixe1.mjs'],", ''],
];

let rouge = 0;
console.log('\n══ HARNAIS L’ÉQUIPE POSÉE PAR L’ADMIN (EQFIXE-1) ══\n');
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
