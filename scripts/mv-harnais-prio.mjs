// HARNAIS — PRIO-1 (§235) : la tâche du moment, une seule règle, d'après les dates de travaux.
//   node scripts/mv-harnais-prio.mjs           → doit être vert
//   node scripts/mv-harnais-prio.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js (_mvPrioRegle, _mvTacheDuMoment, _prioDefaultTask,
// _mvPartTache) et de src/pilotage.js (_pilCkPrio, _dzTachesDefaut, _pilGo), BRANCHÉES les unes sur les
// autres : la carte et Décider appellent le vrai collecteur, qui appelle le vrai moteur. Aucun moteur inventé.
// Nico (04/10) : l'ordre vient des dates de travaux de la période ; plusieurs tâches en même temps → l'admin
// choisit, jamais l'appli ; les heures ne décident jamais (la Taille n'est pas prioritaire parce qu'elle est longue).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const APP = lire('src/app.js'), PIL = lire('src/pilotage.js'), UTI = lire('src/utils.js');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  if (src.indexOf(sig, i + 1) >= 0) throw new Error('en double : ' + sig);
  return src.slice(i, src.indexOf('\n}\n', i) + 3);
}
const ligne = (src, re) => { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; };
const iGo = PIL.indexOf('window._pilGo = function(cible){');
const BASE = {
  regle: sansCom(fn(APP, 'function _mvPrioRegle(o){')),
  moment: sansCom(fn(APP, 'function _mvTacheDuMoment(opt){')),
  defaut: sansCom(fn(APP, 'function _prioDefaultTask(its){')),
  part: sansCom(fn(APP, 'function _mvPartTache(out){')),
  save: sansCom(fn(APP, 'function savePriority(){')),
  clear: sansCom(fn(APP, 'function clearPriority(){')),
  prioJour: sansCom(fn(PIL, 'function _pilPrioDuJour(d){')),   // PRO-1 (§269) : la carte et le cockpit lisent la tâche du moment par elle
  carte: sansCom(fn(PIL, 'function _pilCkPrio(d){')),
  dz: sansCom(fn(PIL, 'function _dzTachesDefaut(){')),
  go: sansCom(PIL.slice(iGo, PIL.indexOf('\n};\n', iGo) + 4)),
  aux: ligne(PIL, /function _pilFmtD\(iso\)\{[^\n]*\n/) + ligne(PIL, /function _dzPrioItems\(\)\{[^\n]*\n/) + ligne(PIL, /function _dzPrios\(\)\{[^\n]*\n/),
};
// Une période d'hiver comme celle du domaine de référence : réparations avant la taille, puis taille-tirage-brûlage.
const SA = { nom: 'Hiver 2026 - 2027', debut: '2026-09-07', fin: '2027-03-31', echeances: {
  'Réparation': { d1: '2026-09-07', d2: '2026-11-30' }, 'Taille': { d1: '2026-12-01', d2: '2027-03-15' },
  'Tirage': { d1: '2026-12-08', d2: '2027-03-25' }, 'Brûlage': { d1: '2026-12-08', d2: '2027-03-25' } } };
const T4 = ['Réparation', 'Taille', 'Tirage', 'Brûlage'];
const tc = (nom, fini, d1, d2, x) => Object.assign({ nom, fini: !!fini, debut: d1, fin: d2 }, x || {});
const TA = fin => [tc('Réparation', fin.has('Réparation'), '2026-09-07', '2026-11-30'),
  tc('Taille', fin.has('Taille'), '2026-12-01', '2027-03-15', { h_reste: 805 }),
  tc('Tirage', fin.has('Tirage'), '2026-12-08', '2027-03-25'), tc('Brûlage', fin.has('Brûlage'), '2026-12-08', '2027-03-25')];
function monde(B, o) {
  o = o || {};
  const ctx = { console, Math, String, Number, Array, Object, JSON, Date, parseInt, parseFloat, isFinite,
    TRAVAUX: o.travaux || {}, JOURNAL: o.journal || [], currentUser: { nom: 'Nico' }, SAISONS: [SA], _PIL_OP_DATA: o.dz || null,
    getSaisonActive: () => SA, getTachesSaison: () => (o.taches || T4).map(n => ({ nom: n })), _visuSaison: () => SA.nom,
    _prioItems: () => (o.prios || []), _arrEquipeFiniePartout: () => !!o.arrFini,
    _mvAujIso: () => o.auj || '2026-10-04', _mvISO: d => d.toISOString().slice(0, 10),
    _pilSaison: () => SA, isAdmin: () => o.adm !== false, openPriorityEdit: () => { ctx.__ouvert = true; },
    _mvInfoBtn: k => '<span class="mvi" data-k="' + k + '"></span>', _pilIco: () => '<svg></svg>',
    _pilEsc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _pilTnom: s => s, _pilNum: n => String(Math.round(Number(n) || 0)), _pilPctColor: () => '#3D6B27' };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([B.regle, B.moment, B.defaut, B.part, B.prioJour, B.carte, B.dz, B.aux, B.go].join('\n'), ctx);
  return ctx;
}
const sansDivDansBouton = h => { let i = 0; while ((i = h.indexOf('<button', i)) >= 0) { const j = h.indexOf('</button>', i); if (j < 0 || h.slice(i, j).indexOf('<div') >= 0) return false; i = j; } return true; };
const propre = h => !/undefined|NaN/.test(h) && (h.match(/<div[ >]/g) || []).length === (h.match(/<\/div>/g) || []).length && sansDivDansBouton(h);
function suite(B) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const R0 = (taches, prios, auj) => monde(B)._mvPrioRegle({ taches, prios, auj });
  const vide = new Set();
  // ── Le moteur ──
  let r = R0(TA(vide), [], '2026-10-04');
  T('4 oct. : seule la Réparation est dans ses dates → c’est elle, même si la Taille a 805 h', r.mode === 'dates' && r.taches.join() === 'Réparation');
  r = R0(TA(vide), [{ t: 'Taille', equipe: [] }], '2026-10-04');
  T('la priorité fixée passe devant les dates', r.mode === 'admin' && r.taches.join() === 'Taille');
  r = R0(TA(new Set(['Taille'])), [{ t: 'Taille', equipe: [] }], '2026-10-04');
  T('une priorité terminée ne compte plus', r.mode === 'dates' && r.taches.join() === 'Réparation');
  r = R0(TA(new Set(['Réparation'])), [], '2026-12-10');
  T('10 déc. : Taille, Tirage, Brûlage en même temps → l’appli ne choisit pas', r.mode === 'choix' && r.taches.join() === 'Taille,Tirage,Brûlage');
  r = R0(TA(vide), [], '2026-12-10');
  T('une Réparation pas finie après sa date reste dans la course, en retard', r.mode === 'choix' && r.taches[0] === 'Réparation' && r.retard['Réparation'] === 1);
  r = R0(TA(new Set(['Taille', 'Tirage', 'Brûlage'])), [], '2026-12-10');
  T('en retard et seule : c’est elle, marquée en retard', r.mode === 'dates' && r.taches.join() === 'Réparation' && r.retard['Réparation'] === 1);
  r = R0(TA(new Set(['Réparation'])), [], '2026-12-03');
  T('3 déc. : la Taille seule dans ses dates', r.mode === 'dates' && r.taches.join() === 'Taille');
  r = R0(TA(vide), [], '2026-09-01');
  T('avant toute date : la prochaine, par date de début', r.mode === 'prochaine' && r.taches.join() === 'Réparation');
  r = R0(TA(new Set(T4)), [], '2026-12-10');
  T('tout fini : aucune', r.mode === 'aucune' && r.taches.length === 0);
  // ── Le collecteur ──
  let c = monde(B, { auj: '2026-10-04', travaux: { 'Réparation': { pct: 40 } } });
  r = c._mvTacheDuMoment();
  T('collecteur : lit les dates de la période active (saison.echeances)', r && r.mode === 'dates' && r.taches.join() === 'Réparation' && r.dates['Taille'].debut === '2026-12-01');
  c = monde(B, { auj: '2026-10-04', taches: T4.concat('Arrachage'), travaux: { 'Arrachage': { pct: 50 } } });
  r = c._mvTacheDuMoment();
  T('une tâche sans dates à elle court sur toute la période : elle chevauche', r && r.mode === 'choix' && r.taches.indexOf('Arrachage') >= 0 && r.dates['Arrachage'].debut === SA.debut);
  c = monde(B, { auj: '2026-10-04', taches: T4.concat('Arrachage'), travaux: { 'Arrachage': { pct: 50 } }, arrFini: true });
  r = c._mvTacheDuMoment();
  T('l’arrachage fini pour l’équipe ne dispute rien (ARRACH-7)', r && r.mode === 'dates' && r.taches.join() === 'Réparation');
  c = monde(B, { auj: '2026-10-04', prios: [{ t: 'Taille', equipe: [] }] });
  r = c._mvTacheDuMoment({ saison: { nom: 'Printemps 2027', debut: '2027-04-01', fin: '2027-06-30' } });
  T('la priorité fixée ne vaut que pour la période active', r && r.mode !== 'admin');
  c = monde(B, { auj: '2026-10-04' });
  r = c._mvTacheDuMoment({ fini: n => n === 'Réparation' });
  T('la lecture « finie » de l’écran appelant est respectée', r && r.mode === 'prochaine' && r.taches.join() === 'Taille');
  // ── Ma part du chantier ──
  const auj = new Date().toISOString().slice(0, 10);
  const J = (tache, qui, eq) => ({ tache, date: auj, parcelle: 'P', statut: 'Validé', qui, membresEquipe: eq || [] });
  c = monde(B, { auj: '2026-12-10', prios: [{ t: 'Taille', equipe: ['Victor'] }, { t: 'Réparation', equipe: ['Nico'] }] });
  T('Ma part : la priorité de SON équipe', c._mvPartTache() === 'Réparation');
  c = monde(B, { auj: '2026-12-10', travaux: { 'Réparation': { pct: 100 } }, journal: [J('Taille', 'Victor'), J('Taille', 'Victor'), J('Taille', 'Victor'), J('Tirage', 'Nico'), J('Tirage', 'Nico')] });
  const o = {};
  T('Ma part, plusieurs tâches sans priorité : là où LA PERSONNE a le plus travaillé', c._mvPartTache(o) === 'Tirage' && o.M && o.M.mode === 'choix');
  c = monde(B, { auj: '2026-12-10', travaux: { 'Réparation': { pct: 100 } }, journal: [J('Brûlage', 'Victor', ['Nico', 'Shana']), J('Brûlage', 'Victor', ['Nico']), J('Tirage', 'Nico')] });
  T('Ma part : une journée en équipe compte pour chacun de l’équipe', c._mvPartTache() === 'Brûlage');
  c = monde(B, { auj: '2026-12-10', travaux: { 'Réparation': { pct: 100 } } });
  T('Ma part : rien travaillé → la première par date', c._mvPartTache() === 'Taille');
  // ── La carte d'Aujourd'hui ──
  const D = pr => ({ data: [{ nom: 'Réparation', pct: pr == null ? 100 : pr, h_reste: pr == null ? 0 : 120 }, { nom: 'Taille', pct: 0, h_reste: 805 }, { nom: 'Tirage', pct: 0, h_reste: 575 }, { nom: 'Brûlage', pct: 0, h_reste: 460 }] });
  c = monde(B, { auj: '2026-12-10' });
  let h = c._pilCkPrio(D());
  T('carte, 10 déc. : « À choisir », les trois tâches, et le bouton pour l’admin', /À choisir/.test(h) && /Taille/.test(h) && /Tirage/.test(h) && /Brûlage/.test(h) && /data-diag="priorite"/.test(h));
  T('carte : la cible de la pastille « Nouveau » et la pastille « i »', /id="pil-prio"/.test(h) && /data-k="pil\.prio"/.test(h));
  T('carte : plus jamais « pôle long »', !/pôle long/.test(h) && !/pôle long|p\\u00f4le long/.test(B.carte));
  T('carte : HTML propre (ni undefined, ni NaN, div équilibrés, pas de div dans un bouton)', propre(h));
  c = monde(B, { auj: '2026-12-10', adm: false });
  h = c._pilCkPrio(D());
  T('carte, non-admin : pas de bouton, l’administrateur fixe la priorité', !/data-diag="priorite"/.test(h) && /administrateur fixe la priorit/.test(h));
  c = monde(B, { auj: '2026-12-03' });
  h = c._pilCkPrio(D());
  T('carte, 3 déc. : la Taille, « seule tâche dans ses dates », jusqu’au 15 mars', /pil-big">Taille</.test(h) && /seule tâche dans ses dates/.test(h) && /15 mars/.test(h) && propre(h));
  c = monde(B, { auj: '2026-10-04' });
  h = c._pilCkPrio(D(40));
  T('carte, 4 oct. : la Réparation (120 h), pas la Taille (805 h) — les heures ne décident pas', /pil-big">Réparation</.test(h));
  c = monde(B, { auj: '2026-12-10', prios: [{ t: 'Réparation', equipe: ['Nico', 'Alicia'] }] });
  h = c._pilCkPrio(D(40));
  T('carte, priorité fixée : son nom, son équipe, « Changer la priorité »', /pil-big">Réparation</.test(h) && /fixée par l’administrateur/.test(h) && /Nico, Alicia/.test(h) && /Changer la priorit/.test(h) && propre(h));
  c = monde(B, { auj: '2026-09-01' });
  h = c._pilCkPrio(D(0));
  T('carte, avant toute date : la prochaine, avec sa date', /pil-big">Réparation</.test(h) && /prochaine dès le 7 sept\./.test(h));
  c = monde(B, { auj: '2026-12-10' });
  h = c._pilCkPrio({ data: [{ nom: 'Taille', pct: 100, h_reste: 0 }] });
  T('carte, tout fini : aucune tâche en cours', /aucune tâche en cours/.test(h) && propre(h));
  // ── Décider ──
  const DZ = tots => { const tasks = Object.keys(tots).map(n => ({ nom: n, tot: tots[n] })); const byNom = {}; tasks.forEach(x => { byNom[x.nom] = x; }); return { tasks, byNom }; };
  c = monde(B, { auj: '2026-12-10', dz: DZ({ 'Réparation': 0, 'Taille': 800, 'Tirage': 575, 'Brûlage': 460 }) });
  let df = c._dzTachesDefaut();
  T('Décider, chevauchement : toutes cochées, source « choix »', df.src === 'choix' && df.t.join() === 'Taille,Tirage,Brûlage');
  c = monde(B, { auj: '2026-12-03', dz: DZ({ 'Réparation': 0, 'Taille': 800, 'Tirage': 575, 'Brûlage': 460 }) });
  df = c._dzTachesDefaut();
  T('Décider, une seule dans ses dates : elle', df.src === 'dates' && df.t.join() === 'Taille');
  c = monde(B, { auj: '2026-10-04', dz: DZ({ 'Réparation': 50, 'Taille': 805, 'Tirage': 575, 'Brûlage': 460 }) });
  df = c._dzTachesDefaut();
  T('Décider, 4 oct. : la Réparation, pas la tâche aux plus d’heures', df.t.join() === 'Réparation');
  c = monde(B, { auj: '2026-12-10', prios: [{ t: 'Brûlage', equipe: [] }], dz: DZ({ 'Réparation': 0, 'Taille': 800, 'Tirage': 575, 'Brûlage': 460 }) });
  df = c._dzTachesDefaut();
  T('Décider, priorité fixée : elle d’abord', df.src === 'prio' && df.t.join() === 'Brûlage');
  // ── Les branchements ──
  c = monde(B, {});
  try { c._pilGo('priorite'); } catch (e) { c.__ouvert = 'plantage'; }
  T('le bouton de la carte ouvre l’éditeur de priorité (_pilGo « priorite »)', c.__ouvert === true);
  T('fixer ou effacer la priorité redessine l’Accueil et le Pilotage', /_prioRedessine\(\)/.test(B.save) && /_prioRedessine\(\)/.test(B.clear));
  T('le calcul « plus d’heures restantes » a quitté _pilData', !/prio\.h_reste/.test(sansCom(PIL)) && !/\bprio:prio\b/.test(PIL));
  T('la fiche « i » de la carte existe (MV_INFO pil.prio)', /'pil\.prio':\s*\{\s*t:/.test(UTI));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nPRIO-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['l’appli tranche un chevauchement à la place de l’admin', B => ({ ...B, regle: B.regle.replace("if(enCours.length>1){ R.mode='choix'; R.taches=R.enCours.slice(); return R; }", "if(enCours.length>1){ R.mode='dates'; R.taches=[enCours[0].nom]; return R; }") })],
  ['une priorité terminée compte encore', B => ({ ...B, regle: B.regle.replace('return it&&it.t&&vivantes[it.t];', 'return it&&it.t;') })],
  ['une tâche en retard sort de la course', B => ({ ...B, regle: B.regle.replace('if(t.fin&&auj&&t.fin<auj)retard[t.nom]=1;', 'if(t.fin&&auj&&t.fin<auj)return false;') })],
  ['la priorité fixée ne passe plus devant', B => ({ ...B, regle: B.regle.replace('if(items.length){', 'if(false&&items.length){') })],
  ['les heures décident de nouveau (pôle long)', B => ({ ...B, carte: B.carte.replace('var n=M.taches[0],', 'var n=data.filter(function(x){ return (x.pct||0)<100; }).sort(function(a,b){ return (b.h_reste||0)-(a.h_reste||0); })[0].nom,') })],
  ['Ma part ignore la priorité de son équipe', B => ({ ...B, part: B.part.replace("if(M.mode==='admin')return _prioDefaultTask(M.items);", '') })],
  ['Ma part compte le travail de toute l’équipe', B => ({ ...B, part: B.part.replace('if(j.qui!==me&&(j.membresEquipe||[]).indexOf(me)<0)return;', '') })],
  ['le bouton « Choisir » n’est plus réservé à l’admin', B => ({ ...B, carte: B.carte.replace("var adm=(typeof window.isAdmin==='function')&&window.isAdmin();", 'var adm=true;') })],
  ['Décider retombe sur le travail aux plus d’heures', B => ({ ...B, dz: B.dz.replace("if(ok.length&&M.mode!=='admin')", 'if(false)') })],
  ['le bouton de la carte ne mène plus nulle part', B => ({ ...B, go: B.go.replace("cible==='priorite'", "cible==='priorite-x'") })],
  ['fixer la priorité ne redessine plus le Pilotage', B => ({ ...B, save: B.save.replace('_prioRedessine();', '') })],
  ['une tâche sans dates ne chevauche plus', B => ({ ...B, moment: B.moment.replace("debut:e.d1||(sa&&sa.debut)||'', fin:e.d2||(sa&&sa.fin)||''", "debut:e.d1||'9999-12-31', fin:e.d2||''") })],
  ['l’arrachage fini pour l’équipe dispute encore', B => ({ ...B, moment: B.moment.replace("var arrFini=function(n){ return n==='Arrachage'&&typeof _arrEquipeFiniePartout==='function'&&_arrEquipeFiniePartout(); };", 'var arrFini=function(n){ return false; };') })],
  ['la priorité fixée vaut pour toutes les périodes', B => ({ ...B, moment: B.moment.replace("(sa&&act&&sa.nom===act.nom&&typeof _prioItems==='function')", "(typeof _prioItems==='function')") })],
];
let rg = 0;
DEF.forEach(([n, f]) => {
  const B2 = f(BASE);
  if (Object.keys(BASE).every(k => B2[k] === BASE[k])) { console.log('  ⚠ non injecté : ' + n); return; }
  const res = joue(B2); const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
