// HARNAIS — RENOM-1 (§230) + RENOM-3 (§232) : renommer une tâche du domaine, TOUT son historique suit — et l'admin l'impose
// à tous les appareils, sans que personne ait à être synchronisé avant (règles appliquées à chaque donnée reçue).
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
  const rang = (src.match(/function _renRang\(v\)\{[^\n]*\n/) || [''])[0];
  vm.runInContext(rang + ['_renFusion(a,b){', '_renTacheCustom(nom){', '_renTacheErreur(oldN,newN){', '_renameTache(oldN,newN){', '_mvAppliquerRenommages(cle){'].map(s => sansCom(fn(src, 'function ' + s))).join('\n')
    + '\nthis.__f={_renTacheCustom,_renTacheErreur,_renameTache,_mvAppliquerRenommages,_renFusion};', ctx);
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
  // ── RENOM-3 : la règle de l'admin s'impose ──
  const m3 = monde(src), w3 = m3.w, f3 = m3.f, saves = [];
  w3.saveData = k => saves.push(k); w3.isAdmin = () => true;
  w3.PARCELLES[0].taches = { [m3.D]: 'Validé', [m3.N]: 'En cours' };
  w3.TACHES.push({ nom: m3.N });
  w3.CONFIG.renommages_taches = [{ de: 'Tirage', vers: 'Tirage des bois', quand: '2026-10-03T21:00:00Z' }, { de: m3.D, vers: m3.N, quand: '2026-10-03T20:00:00Z' }, { de: 'Tirage des bois', vers: 'Tirage2', quand: '2026-10-03T22:00:00Z' }];
  const n1 = f3._mvAppliquerRenommages('parcelles');
  T('un téléphone resté hors ligne a validé sous l\u2019ancien nom : l\u2019état le PLUS AVANCÉ gagne (Validé)', w3.PARCELLES[0].taches[m3.N] === 'Validé' && !(m3.D in w3.PARCELLES[0].taches));
  T('les règles s\u2019appliquent dans l\u2019ordre des dates : Tirage → Tirage des bois → Tirage2', w3.TACHES.some(t => t.nom === 'Tirage2') && !w3.TACHES.some(t => t.nom === 'Tirage' || t.nom === 'Tirage des bois'));
  T('une définition en double (recréée par un appareil en retard) disparaît, la tâche reste une seule', w3.TACHES.filter(t => t.nom === m3.N).length === 1);
  T('un appareil d\u2019ADMIN enregistre la correction', n1 > 0 && ['taches', 'parcelles', 'journal', 'saisons', 'travaux', 'config'].every(k => saves.includes(k)));
  saves.length = 0;
  T('… et rien de plus à la passe suivante (idempotent : pas de boucle d\u2019écritures)', f3._mvAppliquerRenommages('config') === 0 && saves.length === 0);
  const m4 = monde(src), w4 = m4.w, saves4 = [];
  w4.saveData = k => saves4.push(k); w4.isAdmin = () => false;
  w4.CONFIG.renommages_taches = [{ de: m4.D, vers: m4.N, quand: '2026-10-03T20:00:00Z' }];
  m4.f._mvAppliquerRenommages();
  T('un appareil NON admin corrige en mémoire, sans écrire (ses droits ne couvrent pas tout)', w4.JOURNAL[0].tache === m4.N && saves4.length === 0);
  T('seul un administrateur renomme (saveRenTache) et le renommage devient une règle', /if\(!\(typeof window\.isAdmin==='function'&&window\.isAdmin\(\)\)\)\{ if\(err\) err\.textContent='Seul un administrateur/.test(src) && /cfg\.renommages_taches\.push\(\{ de:oldN, vers:n, quand:new Date\(\)\.toISOString\(\)/.test(src));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENOM-1/3 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['les périodes passées sont oubliées', s => s.replace("if(p.tachesAll&&typeof p.tachesAll==='object') Object.keys(p.tachesAll).forEach(function(k){ mvFus(p.tachesAll[k]); });", '')],
  ['le journal garde l\u2019ancien nom', s => s.replace("(window.JOURNAL||[]).forEach(function(e){ if(e&&e.tache===oldN){ e.tache=newN; nb++; } });", '')],
  ['les échéances restent sous l\u2019ancien nom', s => s.replace('rl(s.taches); mv(s.echeances);', 'rl(s.taches);')],
  ['une tâche du catalogue se renomme', s => s.replace("if(!_renTacheCustom(oldN)) return", "if(false) return")],
  ['le point passe dans un nom', s => s.replace('if(/[.\\/\\[\\]*`~#$\\\\"\'<>]/.test(n))', 'if(/[\\/\\[\\]*`~#$\\\\"\'<>]/.test(n))')],
  ['l\u2019état le moins avancé l\u2019emporte', s => s.replace('o[newN]=own.call(o,newN)?_renFusion(o[newN],o[oldN]):o[oldN];', 'o[newN]=own.call(o,newN)?o[newN]:o[oldN];')],
  ['les règles s\u2019appliquent dans le désordre', s => s.replace("L.sort(function(a,b){ return String((a&&a.quand)||'').localeCompare(String((b&&b.quand)||'')); });", 'L.reverse();')],
  ['un appareil non admin écrit aussi', s => s.replace("if(n>0&&typeof window.isAdmin==='function'&&window.isAdmin()&&typeof window.saveData==='function'){", "if(n>0&&typeof window.saveData==='function'){")],
  ['le renommage dit toujours « il y a eu du changement »', s => s.replace('  return nb;\n}', '  return 1;\n}')],
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
