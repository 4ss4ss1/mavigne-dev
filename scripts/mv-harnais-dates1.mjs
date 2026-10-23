// HARNAIS — DATES-1 (§323) : les dates de travaux d'une période valent pour TOUTES ses tâches, heures au barème ou pas.
// PIL-RANGE-1b (§441) : le rendu de secours de cockpit.js et les fiches MV_INFO de l'ancien écran sont retirés ; ce qui passait par lui
//   se lit désormais sur le modèle du cockpit v2 (_pilCk2Modele) et sur sa bulle (INFO de cockpit-vue.js).
//   node scripts/mv-harnais-dates1.mjs           → doit être vert
//   node scripts/mv-harnais-dates1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (13/10, trois captures) : « Les dates de réglages ne se mettent pas à jour lors d'un changement dans réglage ». Dans
// Pilotage › Aujourd'hui, l'Entreplantation (réglée du 01/11 au 15/12) et l'Arrachage (du 10/09 au 10/10) affichaient « du 10 sept.
// au 31 mars », et l'ordre les mettait en tête. Reformulé avant le travail, réponse : « oui ».
// Exécute l'APPLICATION ENTIÈRE (scripts/mv-app-node.mjs) avec les VRAIS planning.js, utils.js, app.js et pilotage.js :
//   A. _chargeSaisonData : taskDates (toutes les tâches, la même règle que les fenêtres) ; taskWindows et la charge inchangés ;
//   B. les lecteurs : _mvChantiersCtx (l'ordre), _mvkRetards (le retard), _pilCk2Modele (lignes, ordre, début de la campagne,
//      À savoir), _pilRetards (l'arrachage fini pour l'équipe), la mémoire de L'année (_pilAnnuelData) ;
//   C. lu : le cockpit de secours, la nouveauté ; aucune erreur avalée.
// Aucune écriture dans le dépôt : les sources (et leurs défauts réinjectés) passent par des copies dans le dossier temporaire.
import fs from 'fs'; import os from 'os'; import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pla: lire('src/planning.js'), uti: lire('src/utils.js'), app: lire('src/app.js'), pil: lire('src/pilotage.js') };
const FICH = { pla: 'planning.js', uti: 'utils.js', app: 'app.js', pil: 'pilotage.js' };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');

// ── Le monde : la saison d'hiver de la capture de Nico, trois tâches au barème, trois sans ──
const PER = 'Hiver 2026 - 2027';
function modele(an) {
  const t = { _timings: {} };
  for (let m = 0; m < 12; m++) {
    t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new Date(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; }
  }
  return t;
}
const TACHES = [{ nom: 'Taille', hha: 50 }, { nom: 'Reparation', hha: 20 }, { nom: 'Tirage', hha: 30 }, { nom: 'Arrachage', hha: 0, anytime: true },
  { nom: 'Entreplantation', hha: 0, trous: true }, { nom: 'Desherbage manuel', hha: 0, anytime: true }];
const ECH = () => ({ Taille: { d1: '2026-11-30', d2: '2027-02-28' }, Reparation: { d1: '2026-10-01', d2: '2026-11-30' }, Tirage: { d1: '2026-12-07', d2: '2027-03-15' },
  Arrachage: { d1: '2026-09-10', d2: '2026-10-10' }, Entreplantation: { d1: '2026-11-01', d2: '2026-12-15' } });   // le désherbage n'a pas de dates
const MB = ['Nico', 'Victor', 'Shana'].map(n => ({ nom: n, statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['ouvrier'] }));
const PARCS = ['Clos A', 'Clos B'].map(n => ({ nom: n, surface: 1, statut: 'Actif', appellation: 'Bourgogne', commune: 'Gevrey-Chambertin', taches: {} }));

// ★ L'appli se recharge DANS LE MÊME PROCESSUS (une fois par contre-épreuve) : ce qu'un chargement d'avant a posé sur window resterait
//   visible et ferait passer pour exposée une fonction que le défaut a retirée (vécu : cette contre-épreuve restait muette).
const LUS = ['_arrEquipeFiniePartout', '_pilAnnuelData', '_mvChantiersCtx', '_mvkRetards', '_pilCk2Modele', '_pilData', '_chargeSaisonData', 'getSaisonActive'];
async function monde(S) {
  for (const n of LUS) delete globalThis[n];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-dates1-')), remplace = {};
  for (const k of Object.keys(FICH)) { const f = path.join(tmp, FICH[k]); fs.writeFileSync(f, S[k]); remplace[FICH[k]] = f; }
  let A;
  try { A = await chargerApp({ remplace }); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  const { G, poser, setAuj, JOURNAL_ERR } = A;
  setAuj([2026, 9, 13]);   // mardi 13 octobre 2026, le jour de la capture
  poser({ membres: MB, planning_templates: { 2026: { standard: modele(2026) }, 2027: { standard: modele(2027) } }, planning_entries: {},
    taches: TACHES, saisons: [{ nom: PER, active: true, debut: '2026-09-10', fin: '2027-03-31', taches: TACHES.map(t => t.nom), echeances: ECH() }],
    parcelles: PARCS, config: { domaine_nom: 'Test' } });
  return { G, JOURNAL_ERR };
}

async function suite(S) {
  const out = []; const T = (n, f) => { let c = false; try { c = !!f(); } catch (e) { c = false; n += ' — PLANTE : ' + e.message; } out.push([n, c]); };
  let W;
  try { W = await monde(S); } catch (e) { T('le monde se monte (' + e.message + ')', false); return out; }
  const { G, JOURNAL_ERR } = W;
  const e0 = JOURNAL_ERR.length;
  const sa = () => ((typeof G.getSaisonActive === 'function') && G.getSaisonActive()) || (G.SAISONS || []).find(s => s && s.nom === PER);
  const cdOf = () => G._chargeSaisonData(sa());
  const par = (L, n) => (L || []).find(w => w && w.nom === n);
  let cd = null; try { cd = cdOf(); } catch (e) { cd = null; }
  // ── A. le calcul des dates (planning.js) ──
  T('A1 taskDates porte TOUTES les tâches de la période, heures au barème ou pas', () => cd && Array.isArray(cd.taskDates)
    && cd.taskDates.map(w => w.nom).sort().join(',') === TACHES.map(t => t.nom).sort().join(','));
  T('A2 taskWindows ne garde que les tâches au barème (Réparation, Taille, Tirage) : l\u2019étalement des heures ne bouge pas', () =>
    cd.taskWindows.map(w => w.nom).sort().join(',') === 'Reparation,Taille,Tirage');
  T('A3 une tâche au barème reprend SA fenêtre (le même objet)', () => ['Reparation', 'Taille', 'Tirage'].every(n => par(cd.taskDates, n) && par(cd.taskDates, n) === par(cd.taskWindows, n)));
  T('A4 l\u2019arrachage prend les dates réglées : du 10/09 au 10/10, sans heure', () => { const w = par(cd.taskDates, 'Arrachage');
    return w && w.start === '2026-09-10' && w.end === '2026-10-10' && w.custom === true && w.h === 0; });
  T('A5 l\u2019entreplantation sans trou compté aussi : du 01/11 au 15/12', () => { const w = par(cd.taskDates, 'Entreplantation');
    return w && w.start === '2026-11-01' && w.end === '2026-12-15' && w.custom === true && w.h === 0; });
  T('A6 une tâche sans barème ni dates : la fenêtre par défaut (ici toute la période)', () => { const w = par(cd.taskDates, 'Desherbage manuel');
    return w && w.start === '2026-09-10' && w.end === '2027-03-31' && w.custom === false && w.h === 0; });
  T('A7 aucune heure inventée : la charge = la somme des tâches au barème, les autres à 0 h', () => {
    const s = cd.taskWindows.reduce((a, w) => a + w.h, 0);
    return cd.charge > 0 && Math.abs(cd.charge - s) < 1e-9 && cd.tasks.length === 3 && cd.taskDates.filter(w => cd.taskWindows.indexOf(w) < 0).every(w => w.h === 0); });
  T('A8 des dates hors de la période : la fenêtre par défaut, et le calcul le sait (horsPeriode)', () => {
    const s = sa(), e = s.echeances.Entreplantation; s.echeances.Entreplantation = { d1: '2027-05-01', d2: '2027-05-30' };
    try { const w = par(cdOf().taskDates, 'Entreplantation'); return w && w.horsPeriode === true && w.custom === false && w.start === '2026-09-10'; }
    finally { s.echeances.Entreplantation = e; } });
  // ── B. les lecteurs ──
  let C = null; try { C = G._mvChantiersCtx(sa()); } catch (e) { C = null; }
  T('B1 l\u2019ordre (_mvChantiersCtx) lit les dates des tâches sans barème : l\u2019arrachage au 10/09, l\u2019entreplantation au 01/11', () =>
    C && C.debut.Arrachage === '2026-09-10' && C.debut.Entreplantation === '2026-11-01' && C.debut.Reparation === '2026-10-01' && C.defaut === '2026-09-10');
  T('B2 le retard (_mvkRetards) : l\u2019arrachage, dont les dates sont passées le 13/10 ; ni l\u2019entreplantation ni la réparation', () => {
    const r = G._mvkRetards(cd); return r.Arrachage === true && !r.Entreplantation && !r.Reparation && !r.Taille && !r.Tirage && !r['Desherbage manuel']; });
  T('B3 un calcul d\u2019avant ce lot (sans taskDates) ne plante pas : repli sur les fenêtres', () => { const r = G._mvkRetards({ taskWindows: cd.taskWindows }); return !!r && !r.Arrachage; });
  let V = null; try { V = G._pilCk2Modele(G._pilData(), { obj: new Date(2027, 2, 31) }); } catch (e) { T('B4 le modèle du cockpit se calcule (' + e.message + ')', false); }
  const tv = n => ((V && V.taches) || []).find(t => t.cle === n);
  if (V) {
    T('B4 la ligne de l\u2019arrachage dit ses dates, du 10/09 au 10/10 (plus le premier chantier et l\u2019objectif)', () => { const t = tv('Arrachage'); return t && t.debut === '2026-09-10' && t.fin === '2026-10-10'; });
    T('B5 … l\u2019entreplantation, du 01/11 au 15/12 ; la réparation garde les siennes', () => { const t = tv('Entreplantation'), r = tv('Reparation');
      return t && t.debut === '2026-11-01' && t.fin === '2026-12-15' && r && r.debut === '2026-10-01' && r.fin === '2026-11-30'; });
    T('B6 l\u2019ordre suit les dates : arrachage, réparation, entreplantation, taille, tirage', () => { const o = V.taches.map(t => t.cle), i = n => o.indexOf(n);
      return ['Arrachage', 'Reparation', 'Entreplantation', 'Taille', 'Tirage'].every(n => i(n) >= 0)
        && i('Arrachage') < i('Reparation') && i('Reparation') < i('Entreplantation') && i('Entreplantation') < i('Taille') && i('Taille') < i('Tirage'); });
    T('B7 le début de la campagne (courbe, frise) reste celui des tâches au barème : le 01/10, pas le 10/09 de l\u2019arrachage', () => V.debut === '2026-10-01');
    T('B8 À savoir dit l\u2019arrachage en retard (fenêtre passée), pas l\u2019entreplantation', () => { const r = (V.savoir || []).filter(x => x && x.cat === 'retard');
      return r.some(x => x.titre === 'Arrachage en retard') && !r.some(x => /Entreplantation/.test(x.titre)); });
  }
  const arr0 = G._arrEquipeFiniePartout;
  T('B9 l\u2019arrachage fini pour l\u2019équipe (la suite au prestataire) n\u2019est pas « en retard » dans À savoir', () => {
    if (typeof arr0 !== 'function') return false;
    G._arrEquipeFiniePartout = () => true;
    try { const V2 = G._pilCk2Modele(G._pilData(), { obj: new Date(2027, 2, 31) }); return Array.isArray(V2.savoir) && !V2.savoir.some(x => x && x.cat === 'retard' && x.titre === 'Arrachage en retard'); }
    finally { G._arrEquipeFiniePartout = arr0; } });
  T('B10 la mémoire de L\u2019année suit un changement des dates de travaux, sans recharger', () => {
    const a1 = G._pilAnnuelData(), a2 = G._pilAnnuelData(); if (!a1 || a1 !== a2) return false;   // la mémoire sert toujours (même clé)
    const s = sa(), e = s.echeances.Taille.d2; s.echeances.Taille.d2 = '2027-01-31';
    try { const a3 = G._pilAnnuelData(), p = a3 && (a3.pers || []).find(x => x && x.nom === PER), w = p && p.cd && par(p.cd.taskWindows, 'Taille');
      return a3 !== a1 && !!w && w.end === '2027-01-31'; }
    finally { s.echeances.Taille.d2 = e; } });
  // ── C. lu ──
  const P = sansCom(S.pil);
  T('C2 la nouveauté l\u2019annonce (bloc 8.91)', () => { const U = S.uti, i = U.indexOf("{ v: '8.91', d: '2026-10-13', items: ["), j = U.indexOf("{ v: '8.90'", i);
    return i > 0 && j > i && U.slice(i, j).includes('Les dates de travaux valent aussi pour les tâches sans barème') && U.slice(i, j).includes('sans recharger'); });
  const av = JOURNAL_ERR.slice(e0).filter(x => /planning|pilotage|cockpit|_mvChantiersCtx|_mvkRetards/.test(String((x && x.msg) || '')));
  T('C3 aucune erreur avalée en route' + (av.length ? ' (' + String(av[0].msg).slice(0, 120) + ')' : ''), () => av.length === 0);
  return out;
}

let ok = 0, ko = 0;
(await suite(SRC0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nDATES-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
// Une ancre absente fait PLANTER le script (rouge) : une contre-épreuve qui ne trouve pas son défaut ne prouve rien.
const sub = (k, a, b) => { const S = Object.assign({}, SRC0); if (!S[k].includes(a)) throw new Error('contre-épreuve sans ancre : ' + a.slice(0, 70)); S[k] = S[k].split(a).join(b); return S; };
const CONTRES = [
  ['planning.js : les dates des seules tâches au barème (taskDates = taskWindows)', () => sub('pla', 'var taskDates=taskAll.map(function(tk){ var k=taskDet.indexOf(tk); return k>=0?taskWindows[k]:_fenTache(tk); });', 'var taskDates=taskWindows;')],
  ['planning.js : taskDates n\u2019est pas rendu (les lecteurs retombent sur les fenêtres)', () => sub('pla', 'taskDates:taskDates,', '')],
  ['planning.js : des heures inventées (les tâches sans barème entrent dans la charge)', () => sub('pla', 'if(h>0){ charge+=h; taskDet.push(tk); }', 'charge+=h; taskDet.push(tk);')],
  ['planning.js : les dates réglées ne valent que pour les tâches au barème', () => sub('pla', 'var e=_ech[t.nom], hors=false;', 'var e=(t.h>0?_ech[t.nom]:null), hors=false;')],
  ['utils.js : le retard ne lit que les fenêtres des tâches au barème', () => sub('uti', 'W=cd?(Array.isArray(cd.taskDates)?cd.taskDates:cd.taskWindows):null;', 'W=cd?cd.taskWindows:null;')],
  ['app.js : l\u2019ordre ne lit que les fenêtres des tâches au barème', () => sub('app', '((cd&&(Array.isArray(cd.taskDates)?cd.taskDates:cd.taskWindows))||[])', '((cd&&cd.taskWindows)||[])')],
  ['pilotage.js : les lignes du cockpit ne lisent que les fenêtres', () => sub('pil', 'fen=(Array.isArray(cd.taskDates)?cd.taskDates:cd.taskWindows)||[], retards=_pilRetards();', 'fen=cd.taskWindows||[], retards=_pilRetards();')],
  ['pilotage.js : le début de la campagne prend aussi les tâches sans barème', () => sub('pil', 'if(w&&w.ws!=null&&w.h!==0) debH.push(oIso(w.ws));', 'if(w&&w.ws!=null) debH.push(oIso(w.ws));')],
  ['pilotage.js : l\u2019arrachage fini pour l\u2019équipe redevient « en retard »', () => sub('pil', "if(r.Arrachage&&typeof window._arrEquipeFiniePartout==='function'&&window._arrEquipeFiniePartout()) delete r.Arrachage;", '')],
  ['app.js : _arrEquipeFiniePartout n\u2019est plus exposée', () => sub('app', 'window._arrEquipeFiniePartout=_arrEquipeFiniePartout;', '')],
  ['pilotage.js : la mémoire de L\u2019année ignore les dates de travaux', () => sub('pil', "+'|'+JSON.stringify(p.echeances||{});", ';')],
];
let mord = 0, muet = 0;
for (const [n, mk] of CONTRES) {
  const S = mk(); let rouge = false;
  try { rouge = (await suite(S)).some(([, c]) => !c); } catch (e) { rouge = true; }
  if (rouge) { mord++; console.log('  \u2713 contre-épreuve rouge : ' + n); } else { muet++; console.log('  \u2717 contre-épreuve MUETTE : ' + n); }
}
console.log(`\nDATES-1 contre-épreuves : ${mord}/${CONTRES.length} mordent`);
process.exit(muet ? 1 : 0);
