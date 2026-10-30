// HARNAIS — EQDEF-2 (§493) : les équipes restent en place d'un jour à l'autre ; rien de posé = tout le monde en Équipe 1.
//   node scripts/mv-harnais-eqdef2.mjs           → doit être vert
//   node scripts/mv-harnais-eqdef2.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (30/10, dicté) : « s'il n'y a pas de numérotation demandée, … tout le monde ensemble dans l'équipe 1… tant que la tâche
// n'est pas terminée, on reste sur les deux équipes qui sont sélectionnées. S'il y a une modification…, ça doit être pris en
// compte. Sinon, par défaut, on reste enregistré sur les équipes qui ont été mises en place ». Décidé (« oui ») : un
// enregistrement reste en place jusqu'au prochain ; « Tout le monde en Équipe 1 » écrit [] ; la priorité garde la main sur le
// défaut ; l'histoire d'avant MV_EQ_SUITE_DEPUIS ne bouge pas. Joue les VRAIES fonctions : le lecteur (utils.js) et la saisie
// (app.js), commentaires retirés. La fenêtre est tenue par mv-harnais-eqdef1 (§492), l'équipe de la priorité par
// mv-harnais-eqfixe1 (§490, monde au 29/10), le reste des équipes du jour par mv-harnais-equipes-jour (§199).
// ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { app: lire('src/app.js'), utl: lire('src/utils.js'), idx: lire('index.html'), tutos: lire('src/tutos.js'), wn: lire('src/whats-new.js'),
  pil: lire('src/pilotage.js'), g4: lire('guide/04-vigne.html'), g11: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
const nu = s => s.replace(/^\s*\/\/.*$/gm, '');
function extraire(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}

// ── Le monde : un domaine fictif, ses contrats et sa cave, la configuration, la mémoire du téléphone ──
const FA = ['_mvEqJourMoi', '_mvEqPrioDe', '_mvEqPrioMoi', '_mvEqDefautDe', '_mvEqDefautMoi', '_mvEqImposee', '_mvEqFixeeMot', '_mvEqApplique',
  '_prioItems', '_prioForMember', '_eqtClean', '_mvEquipeProposee', '_eqtKey', '_eqtRecentKey', '_eqtSameTeam', '_eqtPushRecent', '_eqtLoad',
  '_eqtSave', '_eqtHors', '_eqtFor', '_eqtSet', '_pvRenderTeamBar', 'openPTeamJour', '_mvEqEcrire', 'clearEqJour'];
const FU = ['_mvEqSource', '_mvEqPresents', '_mvEqEnPlace', '_mvEqOrigine', '_mvEqJour', '_mvEqDe'];
const FICHES = [{ nom: 'Marie' }, { nom: 'Jean' }, { nom: 'Sophie' }, { nom: 'Paul' }, { nom: 'Lucas' }, { nom: 'Hugo', bureau: true }];
const CONTRATS = { Paul: { fin: '2026-10-31' }, Lucas: { debut: '2026-11-01' } };   // Paul part fin octobre, Lucas arrive le 1er novembre
function monde(src, o = {}) {
  const A = nu(src.app), U = nu(src.utl), code = [], manque = [];
  for (const n of FA) { const f = extraire(A, 'function ' + n + '('); if (f) code.push(f); else manque.push(n); }
  for (const n of FU) { const f = extraire(U, 'function ' + n + '('); if (f) code.push(f); else manque.push(n); }
  const trn = extraire(U, 'window._mvTourneeEquipe = function(nom, iso){'); if (trn) code.push(trn + ';'); else manque.push('_mvTourneeEquipe');
  if (manque.length) return { manque };
  const LS = new Map(), reg = { 'p-team-bar': { innerHTML: '' } };
  const moi = o.moi || 'Jean';
  if (o.memoire) LS.set('mavigne_eqt_default_' + moi, JSON.stringify(o.memoire));
  const ctx = { console, Date, Math, JSON, String, Number, Array, Object, parseInt, TOASTS: [], OUVERTS: [], SAUVES: [],
    localStorage: { getItem: k => (LS.has(k) ? LS.get(k) : null), setItem: (k, v) => LS.set(k, String(v)), removeItem: k => LS.delete(k) },
    document: { getElementById: id => reg[id] || null, querySelectorAll: () => [] } };
  ctx.window = ctx;
  ctx.CONFIG = o.config || {};
  vm.createContext(ctx);
  vm.runInContext(`
    var currentUser = { nom: ${JSON.stringify(moi)} };
    var MEMBRES = ${JSON.stringify(FICHES)};
    var CONTRATS = ${JSON.stringify(CONTRATS)};
    var CAVE = ${JSON.stringify(o.cave || {})};
    var COULEURS_MBR = {}, priorityTask = '', pTacheFilter = 'Taille';
    var EQUIPE_TACHE = {}, EQUIPE_RECENT = [], _eqtLoaded = false;
    var MV_EQ_SUITE_DEPUIS = '2026-10-30';
    var JOUR = ${JSON.stringify(o.jour || '2026-11-02')};
    function _mvMoiAdmin(){ return ${o.admin ? 'true' : 'false'}; }
    function _mvToday(){ return JOUR; }
    function _mvISO(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function saveData(k){ SAUVES.push(k); }
    function _mvEqApres(m){ TOASTS.push(m); }
    function getSaisonActive(){ return { nom: 'Hiver 2026' }; }
    function getTachesSaison(){ return [{ nom: 'Taille' }, { nom: 'Tirage' }]; }
    function canWrite(){ return true; }
    function tNom(t){ return t; }
    function _escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function showToast(m){ TOASTS.push(m); }
    function openOv(id){ OUVERTS.push(id); }
    function openEqJour(){ OUVERTS.push('ovEqJour'); }
    function _pvBuildRecent(){} function _pvBuildTeamPick(){}
    window._mvEnContratLe = function(m, ds){ var c = CONTRATS[m.nom]; if(!c) return true; if(c.debut && ds < c.debut) return false; if(c.fin && ds > c.fin) return false; return true; };
    window._mvCaveJour = function(nom, iso){ return CAVE[nom + '|' + iso] || ''; };
    ${code.join('\n')}
    window._mvEqJour = _mvEqJour; window._mvEqDe = _mvEqDe; window._mvEqEnPlace = _mvEqEnPlace; window._mvEqOrigine = _mvEqOrigine;
    window._mvEqPresents = _mvEqPresents; window.MV_EQ_SUITE_DEPUIS = MV_EQ_SUITE_DEPUIS;
    this.api = { jour: _mvEqJour, origine: _mvEqOrigine, presents: _mvEqPresents, trn: window._mvTourneeEquipe, pour: _eqtFor, applique: _mvEqApplique,
      barre: function(){ _pvRenderTeamBar(); return document.getElementById('p-team-bar').innerHTML; }, appui: function(){ openPTeamJour(); },
      tout1: function(){ clearEqJour(); }, cfg: function(){ return window.CONFIG; }, aujourdhui: function(j){ JOUR = j; } };
  `, ctx);
  return { api: ctx.api, ctx };
}
const PRIO = items => ({ tachesPrio: { saison: 'Hiver 2026', items } });
const EQ = (...t) => t.map(m => (Array.isArray(m) ? { m } : m));

function scenarios(src) {
  const T = [], eq = (n, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); T.push([n + (ok ? '' : ' — obtenu ' + JSON.stringify(a) + ', attendu ' + JSON.stringify(b)), ok]); };
  const ok = (n, c) => T.push([n, !!c]);
  // L · le lecteur : l'enregistrement en place
  const J = { '2026-10-20': EQ(['Marie', 'Jean']), '2026-10-29': EQ(['Marie'], ['Jean']), '2026-10-30': EQ(['Marie', 'Jean'], { m: ['Sophie', 'Paul'], t: 't2' }),
    '2026-11-03': EQ(['Marie', 'Sophie'], ['Jean', 'Lucas']), '2026-11-05': [] };
  let W = monde(src, { config: { equipes_jour: J }, cave: { 'Sophie|2026-11-02': 'j', 'Jean|2026-11-03': 'j' } });   // Jean en cave le jour même d'un enregistrement : il y reste (L4)
  if (W.manque) return [['fonctions introuvables : ' + W.manque.join(', '), false]];
  eq('L1 · un enregistrement reste en place les jours suivants (ajusté : Paul parti, Lucas arrivé en Équipe 1, Sophie en cave ce jour-là)', W.api.jour('2026-11-02'), [['Marie', 'Jean', 'Lucas']]);
  eq('L2 · … le 31/10, les équipes gardées sont entières : Paul y est encore (dernier jour), Lucas pas encore', W.api.jour('2026-10-31'), [['Marie', 'Jean'], ['Sophie', 'Paul']]);
  eq('L3 · … et le lecteur dit d’où viennent les équipes', W.api.origine('2026-11-02'), { src: 'suite', d: '2026-10-30' });
  eq('L4 · un nouvel enregistrement prend le relais ; le jour même, il fait foi tel qu’enregistré (Jean, en cave ce jour-là, y reste)', [W.api.jour('2026-11-03'), W.api.jour('2026-11-04')], [[['Marie', 'Sophie'], ['Jean', 'Lucas']], [['Marie', 'Sophie'], ['Jean', 'Lucas']]]);
  eq('L5 · « Tout le monde en Équipe 1 » ([]) arrête les équipes, et se garde lui aussi', [W.api.jour('2026-11-05'), W.api.jour('2026-11-09'), W.api.origine('2026-11-09')], [null, null, { src: 'defaut', d: '2026-11-05' }]);
  eq('L6 · avant la règle, un jour ne lit que SON enregistrement (l’histoire ne bouge pas)', [W.api.jour('2026-10-21'), W.api.jour('2026-10-29'), W.api.origine('2026-10-21')], [null, [['Marie'], ['Jean']], { src: '', d: '' }]);
  eq('L7 · un enregistrement d’avant la règle ne se garde pas au-delà', monde(src, { config: { equipes_jour: { '2026-10-29': EQ(['Marie'], ['Jean']) } } }).api.jour('2026-10-31'), null);
  eq('L8 · la tournée d’une équipe gardée suit (Parcelles dans l’ordre de l’équipe)', [W.api.trn('Sophie', '2026-10-31'), W.api.trn('Marie', '2026-10-31')], ['t2', '']);
  eq('L9 · qui compte un jour donné : sous contrat, hors bureau, hors cave', [W.api.presents('2026-11-02'), W.api.presents('2026-10-30')], [['Marie', 'Jean', 'Lucas'], ['Marie', 'Jean', 'Sophie', 'Paul']]);
  // S · la saisie : l'équipe imposée au salarié, proposée à l'administrateur
  W = monde(src, { moi: 'Jean' });
  eq('S1 · rien de posé, pas de priorité : Jean est en Équipe 1 avec tous les présents', W.api.pour('Taille'), ['Marie', 'Sophie', 'Lucas']);
  ok('S2 · … et la barre le dit « Fixée » : le salarié ne la change pas', /Fix\u00e9e/.test(W.api.barre()) && !/Moi seul/.test(W.api.barre()));
  W.api.appui();
  ok('S3 · l’appui sur la barre explique au lieu d’ouvrir le choix', W.ctx.OUVERTS.length === 0 && /^\u00c9quipe 1, tout le monde\u00a0: Jean \+ Marie \+ Sophie \+ Lucas$/.test(W.ctx.TOASTS[0] || ''));
  let e = W.api.applique({ date: '2026-11-02', qui: 'Jean', tache: 'Taille', equipe: false, membresEquipe: [] });
  eq('S4 · la validation part avec toute l’Équipe 1 — sans la marque des équipes posées', [e.equipe, e.membresEquipe, !!e.eqJour], [true, ['Marie', 'Sophie', 'Lucas'], false]);
  W = monde(src, { moi: 'Sophie', config: PRIO([{ t: 'Taille', equipe: ['Jean', 'Marie'] }]) });
  eq('S5 · la priorité garde la main : qui n’y est pas coché est avec le reste, sans l’équipe de la priorité', W.api.pour('Tirage'), ['Lucas']);
  W = monde(src, { moi: 'Jean', config: PRIO([{ t: 'Taille', equipe: ['Jean', 'Marie'] }]) });
  eq('S6 · coché sur la Taille, Jean garde son équipe de la priorité même sur un autre travail', W.api.pour('Tirage'), ['Marie']);
  W = monde(src, { moi: 'Marie', admin: true });
  eq('S7 · l’administrateur se voit PROPOSER l’Équipe 1 tant qu’il n’a rien choisi pour ce travail', W.api.pour('Taille'), ['Jean', 'Sophie', 'Lucas']);
  W = monde(src, { moi: 'Marie', admin: true, memoire: { Taille: [] } });
  eq('S8 · … son choix pour ce travail l’emporte (ici « Moi seul »)', W.api.pour('Taille'), []);
  W = monde(src, { moi: 'Jean', config: { equipes_jour: { '2026-10-30': EQ(['Marie', 'Sophie'], ['Jean', 'Paul']) } } });
  eq('S9 · les équipes posées le 30/10 s’imposent encore le 2/11 (Paul parti, Lucas arrivé dans l’Équipe 1)', W.api.pour('Taille'), []);
  ok('S10 · … Jean seul dans son équipe gardée : c’est l’administrateur qui l’a voulu, la barre dit « Moi seul » et « Fixée »', /Moi seul/.test(W.api.barre()) && /Fix\u00e9e/.test(W.api.barre()));
  W = monde(src, { moi: 'Jean', jour: '2026-10-29' });
  eq('S11 · avant la règle (29/10), rien de posé = l’ancienne règle : la mémoire du téléphone, « Moi seul »', W.api.pour('Taille'), []);
  W = monde(src, { moi: 'Marie', admin: true, config: { equipes_jour: { '2026-10-30': EQ(['Marie'], ['Jean', 'Sophie']) } } });
  W.api.tout1();
  ok('S12 · « Tout le monde en Équipe 1 » écrit [] pour aujourd’hui, et le message le dit', Array.isArray(W.api.cfg().equipes_jour['2026-11-02']) && W.api.cfg().equipes_jour['2026-11-02'].length === 0
    && W.ctx.TOASTS[0] === 'Tout le monde en \u00c9quipe\u00a01 \u00e0 partir d\u2019aujourd\u2019hui');
  eq('S13 · … et le lendemain, plus d’équipes posées : l’Équipe 1 pour tous', [W.api.jour('2026-11-03'), W.api.origine('2026-11-03').src], [null, 'defaut']);
  return T;
}

function branchements(src) {
  const T = [], F = (() => { const i = src.idx.indexOf('id="ovEqJour"'); return i < 0 ? '' : src.idx.slice(i, src.idx.indexOf('<!-- ══', i)); })();
  const tu = (() => { const i = src.tutos.indexOf("{ id: 'equipes',"); return i < 0 ? '' : src.tutos.slice(i, src.tutos.indexOf('\n  { id: ', i + 10)); })();
  T.push(['B1 · la fenêtre : « Enregistrer », « Tout le monde en Équipe 1 », et l’aide dit que les équipes restent', F.includes('onclick="saveEqJour()">Enregistrer</button>')
    && F.includes('onclick="clearEqJour()">Tout le monde en \u00c9quipe 1</button>') && F.includes('Les \u00e9quipes restent en place les jours suivants') && !/Demain, rien n'est r\u00e9gl\u00e9/.test(F)]);
  T.push(['B2 · le tuto des équipes ne dit plus « jusqu’à ce soir »', !!tu && !/jusqu\u2019\u00e0 ce soir/.test(tu) && tu.includes('restent en place les jours suivants') && !/Demain, rien n\u2019est r\u00e9gl\u00e9/.test(tu)]);
  T.push(['B3 · l’aide de l’Accueil et l’explication du calcul le disent', src.utl.includes('<b>elles restent en place les jours suivants</b>') && !src.utl.includes('Le lendemain, tout repart \u00e0 z\u00e9ro')
    && src.utl.includes('Rien de pos\u00e9 : tout le monde est en \u00c9quipe 1, et les validations portent toute l\\u2019\u00e9quipe')]);
  T.push(['B4 · les guides le disent (Vigne, Pilotage)', src.g4.includes('<b>restent en place les jours suivants</b>') && src.g4.includes('« Tout le monde en \u00c9quipe 1 »') && src.g11.includes('elles restent en place d\'un jour \u00e0 l\'autre')]);
  T.push(['B5 · les nouveautés 10.44 l’annoncent, à l’administrateur et aux salariés', /\{ v: '10\.44', d: '2026-10-30', items: \[\n    \{ niv: 0, pour: \['admin'\], emoji: 'equipe', titre: 'Les \u00e9quipes restent en place d\u2019un jour \u00e0 l\u2019autre'/.test(src.wn) && src.wn.includes("pour: ['salaries'], emoji: 'equipe', titre: 'Votre \u00e9quipe est toujours indiqu\u00e9e'")]);
  T.push(['B6 · le format des données monte à 4 (un téléphone d’avant ne verrait pas les équipes gardées)', /export const MV_FORMAT = 4;/.test(src.utl) && src.utl.includes('4 = EQDEF-2 (\u00a7493, 30/10)')]);
  T.push(['B7 · le temps réel du Pilotage lit les équipes POSÉES (du jour ou gardées) — pas l’Équipe 1 par défaut', src.pil.includes("var EQd=(typeof window._mvEqJour==='function') ? window._mvEqJour(dt) : null;") && !/_mvEqDefautDe|_mvEqPresents/.test(src.pil)]);
  T.push(['B8 · ce harnais est branché dans la liste des contrôles', src.liste.includes("['node scripts/mv-harnais-eqdef2.mjs'") && src.liste.includes("['node scripts/mv-harnais-eqdef2.mjs --contre'")]);
  return T;
}

const executer = src => { try { return scenarios(src).concat(branchements(src)); } catch (err) { return [['plantage : ' + (err && err.message), false]]; } };

const MUT = [
  ['les équipes ne se gardent plus', 'utl', '  return best ? { d:best, L:E[best] } : null;', '  return null;'],
  ['un enregistrement d’avant la règle se garde (l’histoire réécrite)', 'utl', 'if(k>=MV_EQ_SUITE_DEPUIS && k<iso && k>best', 'if(k<iso && k>best'],
  ['l’arrivant n’entre pas dans l’Équipe 1', 'utl', '    if(reste.length) out[0].m=out[0].m.concat(reste);', ''],
  ['le jour même est ajusté aussi', 'utl', 'if(out.length && S.d!==iso && iso>=MV_EQ_SUITE_DEPUIS){', 'if(out.length && iso>=MV_EQ_SUITE_DEPUIS){'],
  ['la tournée d’une équipe gardée se perd', 'utl', '  var P = _mvEqEnPlace(iso);', "  var P = (function(){ var L=((window.CONFIG||{}).equipes_jour||{})[String(iso||'').slice(0,10)]; return Array.isArray(L)?{ eq:L.map(function(t){ return { m:(t.m||[]).map(String), t:t.t||'' }; }) }:null; })();"],
  ['« Tout le monde en Équipe 1 » s’efface au lieu de se garder', 'app', '  else if(Array.isArray(teams)) E[iso]=[];', ''],
  ['l’Équipe 1 n’est plus imposée au salarié', 'app', 'var _dd=_mvEqDefautMoi(); if(_dd) return _eqtClean(_dd);', ''],
  ['l’Équipe 1 englobe l’équipe de la priorité', 'app', '  var T=P.filter(function(n){ return !prio[n]; });', '  var T=P.slice();'],
  ['le coché de la priorité perd son équipe sur un autre travail', 'app', '  if(sienne) return sienne.filter(', '  if(false) return sienne.filter('],
  ['le choix de l’administrateur est écrasé par l’Équipe 1', 'app', 'if(_mvMoiAdmin()&&EQUIPE_TACHE[task]===undefined){', 'if(_mvMoiAdmin()){'],
  ['l’Équipe 1 se marque comme une équipe posée', 'app', 'delete e.quiHors; if(duJour) e.eqJour=true;', 'delete e.quiHors; e.eqJour=true;'],
  ['l’aide de la fenêtre reparle du soir', 'idx', '« Tout le monde en \u00c9quipe 1 » remet tout le monde ensemble.', "Demain, rien n'est r\u00e9gl\u00e9 : tout le monde travaille ensemble, comme d'habitude."],
  ['le format ne monte pas', 'utl', 'export const MV_FORMAT = 4;', 'export const MV_FORMAT = 3;'],
  ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-eqdef2.mjs'", "['node scripts/mv-harnais-eqdef2-x.mjs'"],
];

let rouge = 0;
console.log('\n══ HARNAIS ÉQUIPES GARDÉES, ÉQUIPE 1 PAR DÉFAUT (EQDEF-2) ══\n');
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
