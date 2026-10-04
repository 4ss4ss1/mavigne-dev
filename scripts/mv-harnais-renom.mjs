// HARNAIS — RENOM-1 (§230) : renommer une tâche du domaine, TOUT son historique suit.
//   node scripts/mv-harnais-renom.mjs           → doit être vert
//   node scripts/mv-harnais-renom.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIS _renTacheCustom, _renTacheErreur et _renameTache (src/reglages.js) sur un domaine factice qui
// porte la tâche dans chacun de ses rangements.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const SRC0 = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function monde(src) {
  const D = 'Dégraffage', N = 'Dégrafage';
  const w = {
    TACHES_CATALOGUE: [{ nom: 'Taille', label: 'Taille' }, { nom: 'Brulage', label: 'Brûlage' }],
    TACHES: [{ nom: 'Taille' }, { nom: D, hha: 28 }, { nom: 'Tirage' }],
    PARCELLES: [
      { nom: 'Clos', taches: { [D]: 'Validé', Taille: 'En cours' }, tachesAll: { 'Hiver 2025': { [D]: 'Validé' }, 'Hiver 2026': { [D]: 'En cours', Taille: 'x' } }, tachesExclues: [D, 'Tirage'] },
      { nom: 'Bras', taches: { Taille: 'Validé' } }],
    JOURNAL: [{ tache: D, parcelle: 'Clos' }, { tache: 'Taille', parcelle: 'Bras' }],
    SAISONS: [{ nom: 'Hiver 2026', taches: ['Taille', D], echeances: { [D]: { d1: '2026-11-01', d2: '2026-11-30' }, Taille: { d1: '', d2: '2027-03-12' } } }],
    TRAVAUX: { [D]: { pct: 40 }, Taille: { pct: 2 } }, SAISON_PASSAGES: { [D]: 2, Relevage: 3 },
    CONFIG: { saison_passages: { [D]: 2 }, objectifs_fin: { [D]: '2026-11-30' }, tachesPrio: { saison: 'Hiver 2026', items: [{ t: D, equipe: ['Alicia'] }, { t: 'Taille' }] },
      equipes_jour: { '2026-10-05': [{ membres: ['Shana'], tache: D }, { membres: ['Victor'], tache: 'Taille' }] } } };
  const ctx = { window: w, Object, Array, String, JSON }; vm.createContext(ctx);
  vm.runInContext(['_renTacheCustom(nom){', '_renTacheErreur(oldN,newN){', '_renameTache(oldN,newN){'].map(s => sansCom(fn(src, 'function ' + s))).join('\n')
    + '\nthis.__f={_renTacheCustom,_renTacheErreur,_renameTache};', ctx);
  return { w, f: ctx.__f, D, N };
}
function suite(src) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let { w, f, D, N } = monde(src);
  T('seule une tâche CRÉÉE PAR LE DOMAINE se renomme (le catalogue, non)', f._renTacheCustom(D) && !f._renTacheCustom('Taille') && /catalogue/.test(f._renTacheErreur('Taille', 'Coupe')));
  T('les noms refusés : vide, déjà pris (casse comprise), nom ou libellé du catalogue, signes interdits',
    !!f._renTacheErreur(D, '  ') && !!f._renTacheErreur(D, 'tirage') && !!f._renTacheErreur(D, 'brûlage') && !!f._renTacheErreur(D, 'Dé.graf') && !!f._renTacheErreur(D, 'a/b') && f._renTacheErreur(D, N) === '');
  f._renameTache(D, N);
  const p = w.PARCELLES[0];
  T('la définition et l\u2019avancement des parcelles (saison en cours et chaque période)',
    w.TACHES[1].nom === N && p.taches[N] === 'Validé' && !(D in p.taches) && p.tachesAll['Hiver 2025'][N] === 'Validé' && p.tachesAll['Hiver 2026'][N] === 'En cours' && !(D in p.tachesAll['Hiver 2026']));
  T('les exclusions, le journal', p.tachesExclues.join() === N + ',Tirage' && w.JOURNAL[0].tache === N && w.JOURNAL[1].tache === 'Taille');
  T('les périodes : leur liste et leurs échéances', w.SAISONS[0].taches.join() === 'Taille,' + N && w.SAISONS[0].echeances[N].d2 === '2026-11-30' && !(D in w.SAISONS[0].echeances));
  T('les caches et réglages : TRAVAUX, passages, objectif de fin', w.TRAVAUX[N].pct === 40 && w.SAISON_PASSAGES[N] === 2 && w.CONFIG.saison_passages[N] === 2 && w.CONFIG.objectifs_fin[N] === '2026-11-30');
  T('la priorité du moment et les équipes du jour', w.CONFIG.tachesPrio.items[0].t === N && w.CONFIG.equipes_jour['2026-10-05'][0].tache === N && w.CONFIG.equipes_jour['2026-10-05'][1].tache === 'Taille');
  T('rien d\u2019autre ne bouge (Taille, Tirage, Relevage)', p.taches.Taille === 'En cours' && w.TRAVAUX.Taille.pct === 2 && w.SAISON_PASSAGES.Relevage === 3 && w.TACHES[0].nom === 'Taille');
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENOM-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['les périodes passées sont oubliées', s => s.replace("if(p.tachesAll&&typeof p.tachesAll==='object') Object.keys(p.tachesAll).forEach(function(k){ mv(p.tachesAll[k]); });", '')],
  ['le journal garde l\u2019ancien nom', s => s.replace("(window.JOURNAL||[]).forEach(function(e){ if(e&&e.tache===oldN) e.tache=newN; });", '')],
  ['les échéances restent sous l\u2019ancien nom', s => s.replace('rl(s.taches); mv(s.echeances);', 'rl(s.taches);')],
  ['une tâche du catalogue se renomme', s => s.replace("if(!_renTacheCustom(oldN)) return", "if(false) return")],
  ['le point passe dans un nom', s => s.replace('if(/[.\\/\\[\\]*`~#$\\\\"\'<>]/.test(n))', 'if(/[\\/\\[\\]*`~#$\\\\"\'<>]/.test(n))')],
];
let rg = 0;
D.forEach(([n, mut]) => {
  const S = mut(SRC0);
  if (S === SRC0) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
