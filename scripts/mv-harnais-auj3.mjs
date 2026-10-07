// HARNAIS — AUJ-3 (§262) : le domaine en direct (plan par appellation, état par tâche).
//   node scripts/mv-harnais-auj3.mjs           → doit être vert
//   node scripts/mv-harnais-auj3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
function monde(S) {
  const ouverts = [];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvInfoBtn = k => '<button data-info="' + k + '">i</button>';
  ctx.openSelParc = n => ouverts.push(n);
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  return { W: ctx, ouverts };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const { W, ouverts } = monde(S);
  const parcs = [
    { nom: 'Clos Prieur 1', surface: 0.33, appellation: 'Gevrey-Chambertin 1er cru', commune: 'Gevrey-Chambertin' },
    { nom: 'Les Crais 1', surface: 0.41, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin' },
    { nom: 'Les Crais 2', surface: 0.38, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin' },
    { nom: 'Les Charmes', surface: 0.36, appellation: 'Côte de Nuits-Villages', commune: 'Brochon' },
    { nom: 'La Justice 6', surface: 0.30, appellation: 'Gevrey-Chambertin', commune: 'Gevrey-Chambertin', statut: 'Arrachée' },
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
  T('faite depuis l\u2019ouverture de la fenêtre (une validation de novembre ne compte pas pour la saison)', e1['Les Crais 1'] === 'faite' && W._ckPlanEtats(parcs, J.slice(0, 1), 'Taille', '2026-12-01', false)['Les Crais 1'] === 'afaire');
  T('en cours, faite par « Terminé », la tâche d\u2019à côté ignorée', e1['Les Crais 2'] === 'cours' && e1['Les Charmes'] === 'faite' && e1['Clos Prieur 1'] === 'afaire');
  T('arrachée reste arrachée, même avec une validation', e1['La Justice 6'] === 'arr');
  T('fenêtre passée : ce qui n\u2019est pas fait est en retard', W._ckPlanEtats(parcs, J, 'Taille', '2026-12-01', true)['Clos Prieur 1'] === 'retard');
  const D = W._ckPlanDispo(parcs);
  T('une bande par appellation, de la plus grande à la plus petite ; sans surface, pas de bande', D.bandes.length === 3 && D.bandes[0].nom === 'Gevrey-Chambertin' && !D.bandes.some(b => b.nom === 'Bourgogne'));
  const w = n => { for (const b of D.bandes) for (const s of b.strips) if (s.p.nom === n) return s.w; };
  T('la largeur suit la surface, à la même échelle d\u2019une appellation à l\u2019autre', Math.abs(w('Les Crais 1') / w('Les Charmes') - 0.41 / 0.36) < 0.001 && Math.abs(w('Clos Prieur 1') / w('Les Crais 2') - 0.33 / 0.38) < 0.001);
  const big = []; for (let i = 0; i < 40; i++) big.push({ nom: 'P' + i, surface: 0.3, appellation: 'A', commune: 'C' });
  const D2 = W._ckPlanDispo(big), ys = new Set(D2.bandes[0].strips.map(s => s.y)), maxX = Math.max(...D2.bandes[0].strips.map(s => s.x + s.w));
  T('un grand domaine passe à la ligne et ne déborde jamais', ys.size > 1 && maxX <= 1000 - 16 + 0.01);
  const svg = W._ckPlanSvg(D, e1, { 'Les Crais 2': 'HL' }, 'Taille');
  T('chaque parcelle porte la couleur de son état ; l\u2019en-tête dit les hectares en production et leur avancement (l\u2019arrachée exclue)',
    svg.includes('class="ck-pl-p et-faite"') && svg.includes('class="ck-pl-p et-cours"') && svg.includes('class="ck-pl-p et-arr"') && svg.includes('Taille : 52\u202f%') && svg.includes('>0,79\u202fha</tspan>'));
  T('l\u2019équipe du jour est marquée, la commune écrite, le nom échappé', svg.includes('>HL</text>') && svg.includes('>Brochon</text>')
    && !W._ckPlanSvg(W._ckPlanDispo([{ nom: '<b>x', surface: 1, appellation: 'A' }]), {}, {}, 'T').includes('<b>x'));
  W._ckPlanOuvrir({ getAttribute: () => 'Les Crais 2' });
  T('toucher une parcelle ouvre sa fiche, par le chemin de toujours', ouverts[0] === 'Les Crais 2' && svg.includes('onclick="_ckPlanOuvrir(this)"') && svg.includes('data-p="Les Crais 2"'));
  T('les équipes : commencé aujourd\u2019hui et pas validé', JSON.stringify(W._ckPlanEquipes(J.filter(e => e.parcelle !== 'Les Charmes'), '2027-01-12')) === '{"Les Crais 2":"HL"}');
  T('ni passages ni niveaux dans le choix de la tâche', W._ckPlanTaches([{ nom: 'Taille' }, { nom: 'Rognage', type: 'passages' }, { nom: 'Liage', type: 'niveaux' }, { nom: 'Relevage' }, { nom: 'Pioche' }]).map(t => t.nom).join() === 'Taille');
  T('pas de surface : l\u2019état vide, jamais un plan faux', W._ckPlanDispo([{ nom: 'x', surface: 0 }]) === null);
  const P = S.pil;
  T('_pilTabAuj passe les fenêtres des tâches et les parcelles, et le plan se masque',
    P.includes("fenetres:((typeof _rfCd==='function'&&_rfCd())||{}).taskWindows||[], parcs:(window.PARCELLES||[])") && P.includes("plan:_pilShow('auj_plan')") && P.includes("['auj_plan','Le domaine en direct']"));
  // REF-1 (§266) : la feuille de cet ancien cockpit est remplacée par celle de la maquette validée, passée à la charte.
  T('l\u2019ancienne feuille a laissé la place à celle de la maquette (REF-1)', S.css.includes('★★★ REF-1 (§266) — LE COCKPIT D\'AUJOURD\'HUI : LA FEUILLE DE LA MAQUETTE VALIDÉE') && !S.css.includes('AUJ-3 (§262) — LE DOMAINE EN DIRECT'));
  T('aide, bulle, guide et nouveauté (8.34, pastille sur le plan)', /'pil\.plan': \{ t: 'Le domaine en direct'/.test(S.uti) && S.guide.includes('<b>domaine en direct</b>')
    && /\{ v: '8\.34', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-plan'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['les validations d\u2019avant la fenêtre comptées', 'ck', "if(debutIso && String(e.date || '') < debutIso) return;", ''],
    ['un début qui efface une validation', 'ck', "else if(e.statut === 'En cours' && der[e.parcelle] !== 'faite') der[e.parcelle] = 'cours';", "else if(e.statut === 'En cours') der[e.parcelle] = 'cours';"],
    ['une arrachée repeinte par une validation', 'ck', "Object.keys(etat).forEach(function(n){ if(etat[n] !== 'arr') etat[n] =", "Object.keys(etat).forEach(function(n){ etat[n] ="],
    ['chaque appellation à sa propre échelle', 'ck', "var w = Math.max(10, Number(p.surface) * k);", "var w = Math.max(10, Number(p.surface) / A.ha * L);"],
    ['un plan qui déborde au lieu de passer à la ligne', 'ck', "if(x + w > _CK_PL.m + L + 0.01 && x > _CK_PL.m){ x = _CK_PL.m; y += _CK_PL.h + 30; }", ""],
    ['un nom non échappé', 'ck', "' data-p=\"' + _ckEsc(n) + '\"", "' data-p=\"' + n + '\""],
    ['les passages proposés au choix', 'ck', "!(t.type === 'niveaux' || t.type === 'passages' ||", "!("],
    ['une équipe qui reste après sa validation', 'ck', "if(e.statut === 'Validé') { delete r[e.parcelle]; return; }", ""],
    ['les fenêtres oubliées par _pilTabAuj', 'pil', "fenetres:((typeof _rfCd==='function'&&_rfCd())||{}).taskWindows||[], ", ""],
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
