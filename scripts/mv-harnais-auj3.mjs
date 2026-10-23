// HARNAIS — AUJ-3 (§262) : le domaine en direct (plan par appellation, état par tâche).
// PIL-RANGE-1b (§441) : le rendu de secours de cockpit.js (_ckAuj et ses aides) est retiré avec l'ancien Aujourd'hui ; ce harnais ne garde
//   que ce qui vit encore et nourrit le cockpit v2. Les bulles « i » qu'on lit sont celles de cockpit-vue.js (INFO), plus MV_INFO pil.*.
//   Le plan v1 (_ckPlanDispo, _ckPlanSvg, _ckPlanOuvrir) part ; restent l'état des parcelles, les débuts d'équipe et le choix de la tâche.
//   node scripts/mv-harnais-auj3.mjs           → doit être vert
//   node scripts/mv-harnais-auj3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { vue: L('src/cockpit-vue.js'), ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
function monde(S) {
  const ouverts = [];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvInfoBtn = k => '<button data-info="' + k + '">i</button>';
  ctx.openDP = n => ouverts.push(n);   // FORME-1 (§301) : la fiche de la parcelle
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  return { W: ctx, ouverts };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const { W, ouverts } = monde(S);
  const parcs = [
    { nom: 'Clos Prieur 1', surface: 0.33, appellation: 'Gevrey-Chambertin 1er cru', commune: 'Gevrey-Chambertin' },
    { nom: 'Les Crais 1', surface: 0.41, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', taches: { Taille: 'Validé' } },
    { nom: 'Les Crais 2', surface: 0.38, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', taches: { Taille: 'En cours' } },
    { nom: 'Les Charmes', surface: 0.36, appellation: 'Côte de Nuits-Villages', commune: 'Brochon', taches: { Taille: 'Validé' } },   // ETAT-1 (§320) : l’état vient de la fiche
    { nom: 'La Justice 6', surface: 0.30, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', statut: 'Arrachée', taches: { Taille: 'Validé' } },
    { nom: 'Sans surface', surface: 0, appellation: 'Bourgogne' },
  ];
  const J = [
    { date: '2026-11-20', parcelle: 'Les Crais 1', tache: 'Taille', statut: 'Validé' },
    { date: '2027-01-05', parcelle: 'Les Crais 1', tache: 'Taille', statut: 'Validé' },
    { date: '2027-01-12', parcelle: 'Les Crais 2', tache: 'Taille', statut: 'En cours', qui: 'Hugo', membresEquipe: ['Hugo', 'Léa'] },
    { date: '2027-01-10', parcelle: 'Clos Prieur 1', tache: 'Tirage', statut: 'Validé' },
    { date: '2027-01-08', parcelle: 'Les Charmes', tache: 'Taille', statut: 'Terminé' },
    { date: '2027-01-12', parcelle: 'La Justice 6', tache: 'Taille', statut: 'Validé' },
    { date: '2027-01-12', parcelle: 'Les Charmes', tache: 'Taille', statut: 'En cours', qui: 'Inès' },   // un début après la validation : elle reste faite
    { date: '2027-01-12', parcelle: 'Les Crais 1', tache: 'Taille', statut: 'En cours', qui: 'Jean' },
    { date: '2027-01-12', parcelle: 'Les Crais 1', tache: 'Taille', statut: 'Validé', qui: 'Jean' },   // commencée puis validée : plus d'équipe dessus
  ];
  const e1 = W._ckPlanEtats(parcs, J, 'Taille', '2026-12-01', false);
  T('ETAT-1 (§320) : l\u2019état vient de la fiche, pas du journal — sans statut, une validation au journal ne fait rien ; validée sur la fiche, faite même sans ligne au journal', e1['Les Crais 1'] === 'faite'
    && W._ckPlanEtats(parcs.map(p => Object.assign({}, p, { taches: {} })), J, 'Taille', '2026-12-01', false)['Les Crais 1'] === 'afaire' && W._ckPlanEtats(parcs, [], 'Taille', '2026-12-01', false)['Les Crais 1'] === 'faite');
  T('en cours, faite, la tâche d\u2019à côté ignorée (statuts de la fiche)', e1['Les Crais 2'] === 'cours' && e1['Les Charmes'] === 'faite' && e1['Clos Prieur 1'] === 'afaire');
  T('arrachée reste arrachée, même avec une validation', e1['La Justice 6'] === 'arr');
  T('fenêtre passée : ce qui n\u2019est pas fait est en retard', W._ckPlanEtats(parcs, J, 'Taille', '2026-12-01', true)['Clos Prieur 1'] === 'retard');
  T('les équipes : chaque parcelle en cours a la ligne qui l\u2019a commencée, même un autre jour, et seulement elles (FORME-1, §301)', (() => { const et = W._ckPlanEtats(parcs, J, 'Taille', '2026-12-01', false), d = W._ckPlanDebuts(parcs, J, 'Taille', '2026-12-01'); const c = Object.keys(et).filter(n => et[n] === 'cours').sort().join(); return c.length > 0 && Object.keys(d).sort().join() === c && Object.values(d).every(e => e.statut === 'En cours')
    && Object.keys(W._ckPlanDebuts([{ nom: 'X', taches: { Taille: 'Validé' } }], [{ date: '2026-12-05', parcelle: 'X', tache: 'Taille', qui: 'H', statut: 'En cours' }, { date: '2026-12-06', parcelle: 'X', tache: 'Taille', qui: 'H', statut: 'Validé' }], 'Taille', '2026-12-01')).length === 0; })());
  T('ni passages ni niveaux dans le choix de la tâche', W._ckPlanTaches([{ nom: 'Taille' }, { nom: 'Rognage', type: 'passages' }, { nom: 'Liage', type: 'niveaux' }, { nom: 'Relevage' }, { nom: 'Pioche' }]).map(t => t.nom).join() === 'Taille');
  // REF-1 (§266) : la feuille de cet ancien cockpit est remplacée par celle de la maquette validée, passée à la charte.
  T('l\u2019ancienne feuille a laissé la place à celle de la maquette (REF-1)', S.css.includes('★★★ REF-1 (§266) — LE COCKPIT D\'AUJOURD\'HUI : LA FEUILLE DE LA MAQUETTE VALIDÉE') && !S.css.includes('AUJ-3 (§262) — LE DOMAINE EN DIRECT'));
  T('aide, bulle, guide et nouveauté (8.34, pastille sur le plan)', /\n  plan: '/.test(S.vue) && S.guide.includes('<b>domaine en direct</b>')
    && /\{ v: '8\.34', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-plan'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['ETAT-1 : l\u2019état ne lit plus la fiche', 'ck', "var s = lire(p, tache);", "var s = '';"],
    ['ETAT-1 : une validation au journal repeint la parcelle (le défaut signalé)', 'ck', "  (journal || []).forEach(function(e){\n    if(!e || e.tache !== tache || e.statut !== 'En cours'", "  (journal || []).forEach(function(e){ if(e && e.tache === tache && e.statut === 'Validé' && etat[e.parcelle] && etat[e.parcelle] !== 'arr') etat[e.parcelle] = 'faite'; });\n  (journal || []).forEach(function(e){\n    if(!e || e.tache !== tache || e.statut !== 'En cours'"],
    ['une arrachée repeinte par son statut', 'ck', "if(/arrach/i.test(String(p.statut || ''))){ etat[p.nom] = 'arr'; return; }", ""],
    ['les passages proposés au choix', 'ck', "!(t.type === 'niveaux' || t.type === 'passages' ||", "!("],
    ['une équipe qui reste après sa validation', 'ck', "if(!e || e.tache !== tache || e.statut !== 'En cours' || etat[e.parcelle] !== 'cours') return;", "if(!e || e.tache !== tache || e.statut !== 'En cours') return;"],   // ETAT-1 (§320) : l'équipe des seules parcelles en cours
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
