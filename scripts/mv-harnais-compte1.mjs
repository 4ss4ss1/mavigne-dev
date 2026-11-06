/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COMPTE-1 (§353) : LES PIEDS MARQUÉS CHIFFRENT L'ENTREPLANTATION
             RESTE-1 (§535) : LE RESTE À PLANTER — LES TROUS MOINS LES PLANTÉS, D'UNE CAMPAGNE À L'AUTRE
   Lancer : node scripts/mv-harnais-compte1.mjs          (le contrôle)
            node scripts/mv-harnais-compte1.mjs --contre  (la contre-épreuve)
   Les règles sont EXÉCUTÉES (bloc borné de src/comptes.js, sans dépendance : l'axe de la campagne est passé en
   argument) ; le reste est le câblage : la validation, l'annulation, les lectures des trous prévus, du reste et des
   plantés (fiche, rapport, Pilotage), la tarière préremplie, le réglage de la tâche.
   Le parcours entier (valider en partie, clôturer, un an plus tard) se joue dans l'appli : mv-harnais-reste1.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const K0 = fs.readFileSync('src/comptes.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), G = fs.readFileSync('src/reglages.js', 'utf8');
const P = fs.readFileSync('src/pilotage.js', 'utf8'), T = fs.readFileSync('src/tracteur.js', 'utf8'), U = fs.readFileSync('src/utils.js', 'utf8');
const H = fs.readFileSync('index.html', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── COMPTE-1 : début du bloc exécutable', FIN = '// ── COMPTE-1 : fin du bloc exécutable';
let n = 0;
const charger = K => import('data:text/javascript;base64,' + Buffer.from(K.slice(K.indexOf(DEB), K.indexOf(FIN))
  + '\nexport { _cptN, _cptDemande, _cptPiloteTrous, _cptComptes, _cptCompteCamp, _cptBilan, _cptPoser, _cptRemettre, _cptPas };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
// L'axe de la campagne, au 1er août ; une date vide = le jour du test (6 novembre 2026).
const camp = d => { const s = String(d || '2026-11-06').split('-').map(Number); return s[1] >= 8 ? s[0] : s[0] - 1; };
async function controles(K) {
  const M = await charger(K), r = [];
  const B = (p, ev, j) => M._cptBilan(p, ev, camp, j || '2027-07-31');
  const Pe = (d, x, id) => ({ d, k: 'perce', n: x, id }), Pl = (d, x, id) => ({ d, k: 'plante', n: x, id });
  // COMPTE-1, dans une campagne : le plus grand des deux
  r.push(['une campagne : 120 marqués, 60 percés → 120 à planter', B({ trous_marques: 120, trous_marques_le: '2026-10-12' }, [Pe('2026-12-01', 60)]).reste === 120]);
  r.push(['une campagne : 90 percés sur 80 marqués → 90', B({ trous_marques: 80, trous_marques_le: '2026-10-12' }, [Pe('2026-12-01', 90)]).reste === 90]);
  r.push(['sans rien, zéro ; un compte vide n’est pas un compte, zéro en est un', B({}, []).reste === 0 && M._cptComptes({ trous_marques: '' }).length === 0 && M._cptComptes({ trous_marques: 0 }).length === 1]);
  // RESTE-1 — l'exemple de Nico : 3 trous, 2 plantés → 1 ; l'an prochain +5 → 6 ; 6 plantés → 0
  const ev3 = [Pe('2026-11-02', 3), Pl('2027-04-10', 2, 'a')];
  const b1 = B({}, ev3);
  r.push(['3 trous, 2 plantés : il en reste 1', b1.reste === 1 && b1.trous === 1, JSON.stringify(b1)]);
  const b2 = B({}, ev3.concat([Pe('2027-11-05', 5)]), '2027-12-31');
  r.push(['l’an prochain, 5 trous de plus : 6 à planter, dont 1 reporté', b2.reste === 6 && b2.parCamp[2027].report.h === 1, JSON.stringify(b2.parCamp)]);
  r.push(['6 plantés : plus rien', B({}, ev3.concat([Pe('2027-11-05', 5), Pl('2028-04-02', 6, 'b')]), '2028-07-31').reste === 0]);
  // Le repérage d'automne, la tarière d'hiver : une campagne, pas de double compte
  r.push(['marqués en octobre, percés en janvier : 3, pas 6', B({ trous_marques: 3, trous_marques_le: '2026-10-05' }, [Pe('2027-01-15', 3)]).reste === 3]);
  r.push(['marqués en juillet, percés en août (campagne suivante) : 3, pas 6', B({ trous_marques: 3, trous_marques_le: '2026-07-20' }, [Pe('2026-08-20', 3)], '2026-09-30').reste === 3]);
  r.push(['un compte corrigé après la tarière ne rajoute rien (3 marqués, 3 percés, 2 plantés → 1)', B({ trous_marques: 3, trous_marques_le: '2027-01-20', trous_marques_corr: true }, [Pe('2026-12-01', 3), Pl('2027-04-10', 2)]).reste === 1]);
  const b5 = B({}, [Pl('2027-04-10', 8)]);
  r.push(['planter sans trou connu (trou fait à la main) : rien ne reste, jamais sous zéro', b5.reste === 0 && b5.trous === 0 && b5.marques === 0 && b5.plantes[0].n === 8, JSON.stringify(b5)]);
  const b6 = B({ trous_marques: 10, trous_marques_le: '2026-10-01' }, [Pe('2026-12-01', 4), Pl('2027-04-01', null, 'x')]);
  r.push(['une validation sans nombre plante tout ce qui restait (10)', b6.reste === 0 && b6.plantes[0].n === 10, JSON.stringify(b6.plantes)]);
  r.push(['à la fin d’une période passée, ce qui vient après ne compte pas', B({}, ev3, '2027-03-31').reste === 3]);
  const ph = { trous_marques: 5, trous_marques_le: '2026-10-01', trous_marques_hist: [{ n: 3, le: '2025-09-10', par: 'Léo' }] };
  r.push(['le compte d’une campagne : celui de cette campagne, jamais un autre', M._cptCompteCamp(ph, 2026, camp) === 5 && M._cptCompteCamp(ph, 2025, camp) === 3 && M._cptCompteCamp(ph, 2027, camp) === null]);
  r.push(['des marqués d’une campagne passée, jamais percés, passent à la suivante (3 + 5)', B(ph, [], '2026-12-31').reste === 8]);
  // Poser un compte : dans une autre campagne, l'ancien part à l'historique ; Annuler remet tout
  const p = { nom: 'Clos', trous_marques: 50, trous_marques_par: 'Paul', trous_marques_le: '2025-10-12' };
  const av = M._cptPoser(p, 61, 'Léo', '2026-10-17', false, camp);
  const archive = Array.isArray(p.trous_marques_hist) && p.trous_marques_hist.length === 1 && p.trous_marques_hist[0].n === 50 && p.trous_marques === 61 && av.arch === true;
  M._cptRemettre(p, av);
  r.push(['un compte d’une autre campagne part à l’historique, et Annuler remet tout', archive && p.trous_marques === 50 && p.trous_marques_par === 'Paul' && p.trous_marques_hist === undefined]);
  const q = { nom: 'Clos', trous_marques: 50, trous_marques_par: 'Paul', trous_marques_le: '2026-10-12' };
  const av2 = M._cptPoser(q, 61, 'Léo', '2026-10-17', true, camp);
  r.push(['poser un compte de la même campagne le remplace ; l’annulation le remet tel quel', q.trous_marques === 61 && q.trous_marques_corr === true && !q.trous_marques_hist && av2.n === 50 && (M._cptRemettre(q, av2), q.trous_marques === 50 && q.trous_marques_par === 'Paul' && !q.trous_marques_corr)]);
  const z = {}; const av3 = M._cptPoser(z, 3, 'Léo', '2026-10-17', false, camp);
  r.push(['annuler le premier compte d’une parcelle l’efface', av3 === null && (M._cptRemettre(z, av3), z.trous_marques === undefined)]);
  r.push(['le compte se demande sur une tâche simple, jamais à trous, à niveaux ou à passages',
    M._cptDemande({ nom: 'Repérage', demandeCompte: true }) && !M._cptDemande({ nom: 'X', demandeCompte: true, trous: true })
    && !M._cptDemande({ nom: 'R', demandeCompte: true, type: 'niveaux' }) && !M._cptDemande({ nom: 'E', demandeCompte: true, type: 'passages' }) && !M._cptDemande({ nom: 'T' })]);
  r.push(['l’entreplantation est pilotée par les trous, même sans le drapeau', M._cptPiloteTrous({ nom: 'Entreplantation' }) && M._cptPiloteTrous({ nom: 'Autre', trous: true }) && !M._cptPiloteTrous({ nom: 'Taille' })]);
  let e = { val: '142', frais: true }; e = M._cptPas(e, 'd', '9');
  r.push(['le pavé : un chiffre tapé sur une valeur préremplie la remplace', e.val === '9' && e.frais === false]);
  let f = { val: '', frais: false }; for (const d of ['1', '2', '3', '4', '5']) f = M._cptPas(f, 'd', d);
  r.push(['le pavé : quatre chiffres au plus, « moins » ne passe pas sous zéro', f.val === '1234' && M._cptPas({ val: '0', frais: false }, 'moins').val === '0' && M._cptPas({ val: '', frais: false }, 'zero').val === '0']);
  return r;
}
function cablage(A) {
  const pq = A.slice(A.indexOf('function pQuickValidate('), A.indexOf('function pQuickUndoEntry('));
  const cv = A.slice(A.indexOf('async function confirmValidation('), A.indexOf('async function confirmValidation(') + 8000);
  return [
    ['le module est chargé par app.js', /import '\.\/comptes\.js';/.test(A)],
    ['« Valider » (cartes, carte du domaine) ouvre le pavé avant d’écrire, reprend par le même chemin, et garde « En cours » s’il reste à planter', /window\._cptAvantValider\(p,task,function\(n\)\{pQuickValidate\(nom,\{_cpt:n\}\);\}\)\) return;/.test(pq) && /window\._cptAuValider\(p,task,jEntry,_cpt\)/.test(pq) && /window\._cptStatutApres\(p,task\)/.test(pq)],
    ['« Annuler » remet le compte d’avant', /window\._cptDefaire\(p,JOURNAL\[idx\]\)/.test(A)],
    ['la feuille de la fiche : le compte du repérage exigé, les pieds plantés au journal seulement, « En cours » s’il en reste', /Indique le nombre de pieds marqués/.test(cv) && /window\._cptAuValider\(p,_validTache,jEntry,_cptVal\)/.test(cv) && !/p\.plantation_trous=trousVal/.test(cv) && /window\._cptStatutApres\(p,_validTache\)/.test(cv)],
    ['une seule lecture des trous prévus (_plantParcTrous) ; les plantés de la période pour l’avancement (calcHeures, recalcTravaux)', /function _plantParcTrous\(p\)\{ return \(typeof window\._cptPrevus==='function'\)/.test(A) && /const _ptd=_plantFaitsTot\(parcT\);/.test(A) && /var _rtd=_plantFaitsTot\(parcActives\);/.test(A) && !/p\.plantation_trous\|\|0\)>0/.test(A) && !/\(parseInt\(p\.plantation_trous\)\|\|0\):0;/.test(A)],
    ['le Pilotage lit les trous prévus, le reste à planter, et les pieds de chaque validation — plus le total brut de la tarière', (P.match(/_opTrousPrevus\(p\)/g) || []).length - (P.match(/function _opTrousPrevus\(p\)/g) || []).length === 3 && /window\._plantParcReste\(p\)/.test(P) && /window\._cptPlantesEntree\(p,ev\.jid\)/.test(P) && !/ev\.trous\|\|p\.plantation_trous/.test(P)],
    ['une parcelle comptée à zéro sort des parcelles concernées (liste et règle commune)', /window\._cptHors\(p,nomTache\)/.test(A) && /window\._cptHors\(p, nom\)/.test(U)],
    ['la tarière arrive préremplie avec les pieds marqués qui restent à percer', /act\.champCustom\.feedsPlantation&&typeof window\._cptMarques==='function'/.test(T) && /window\._cptAPercer\(_pM\)/.test(T) && /id="ocv-hint"/.test(H)],
    ['« alimente les trous » se coche dès la création de l’activité', /champCustom\.feedsPlantation=true/.test(T) && /id="new-act-champ-feeds"/.test(H) && !/la tâche Plantation/.test(H)],
    ['le réglage « Demander le nombre de pieds marqués » : posé, enregistré, et gardé par l’écran des heures', /id="ehha-cpt"/.test(G) && /t\.demandeCompte=true; else delete t\.demandeCompte;/.test(G) && /if\(_ex\.demandeCompte\) t\.demandeCompte=true;/.test(G)],
    ['la roue crantée ouvre la feuille des comptes sous l’entreplantation', /window\._cptLigneReglages\(\)/.test(G) && /<div class="overlay" id="ovComptes"/.test(H) && /<div class="overlay" id="ovCompte"/.test(H)],
    ['les icônes du pavé existent dans le sprite', /<symbol id="ic-moins"/.test(H) && /<symbol id="ic-effacer"/.test(H)],
    ['aucune couleur en dur dans le style du lot', (() => { const b = S.slice(S.indexOf('/* ★★ COMPTE-1 (§353)'), S.indexOf('/* ★ FIN COMPTE-1 */')); return b.length > 500 && !/#[0-9a-fA-F]{3,6}\b/.test(b) && !/font-size:\s*\d/.test(b); })()],
    ['les textes de la feuille passent par l’échappement', /<b>'\+n\+'<\/b>/.test(K0) && /var n=_e\(p\.nom\)/.test(K0)],
    // COMPTE-2 (§354) : le Journal tapé à la main écrit les pieds de l'entreplantation (le temps réalisé du Pilotage).
    ['l’entrée de journal écrit les pieds d’une entreplantation validée', (() => { const sj = A.slice(A.indexOf('async function saveJournalEntry('), A.indexOf('async function saveJournalEntry(') + 5000); return /if\(statut==='Validé'&&!_jeEt&&_jeP&&typeof window\._cptAuValider==='function'\) window\._cptAuValider\(_jeP,tache,jEntry,null\);\n  JOURNAL\.unshift/.test(sj); })()],
    // RESTE-1 (§535) : une session de tarière qui change fait relire les comptes.
    ['un changement de session (tarière) fait relire les comptes', /function _recalcPlantationTrous\(\)\{\n[^\n]*_cptInvalider/.test(A)],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── COMPTE-1 / RESTE-1 — les pieds marqués, le reste à planter\n');
  for (const [x, c, d] of await controles(K0)) t(x, c, d);
  for (const [x, c] of cablage(A)) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COMPTE-1 / RESTE-1 — contre-épreuve\n');
const essais = [
  ['un trou percé qui ne consomme plus un pied marqué est vu', K0.replace('M=Math.max(0,M-np);', ''), 'une campagne : 120 marqués'],
  ['un reste qui ne passe plus à la campagne suivante est vu', K0.replace('var report={ h:H, m:M }', 'H=0; M=0; var report={ h:H, m:M }'), 'l’an prochain, 5 trous de plus'],
  ['planter sous zéro est vu', K0.replace('M=Math.max(0,M-(q-H)); H=0;', 'M=M-(q-H); H=0;'), 'planter sans trou connu'],
  ['un compte d’une autre campagne écrasé au lieu d’être gardé est vu', K0.replace("if(avant&&typeof campDe==='function'&&String(campDe(avant.le))!==String(campDe(date||''))){", 'if(false){'), 'un compte d’une autre campagne'],
  ['le compte demandé sur une tâche à trous est vu', K0.replace("return !!(t&&t.demandeCompte&&!t.trous&&", "return !!(t&&t.demandeCompte&&"), 'le compte se demande'],
  ['une annulation qui oublie l’auteur d’avant est vue', K0.replace("p.trous_marques=avant.n; p.trous_marques_par=avant.par||'';", "p.trous_marques=avant.n;"), 'poser un compte de la même campagne'],
];
let rates = 0;
for (const [x, K, cible] of essais) {
  if (K === K0) { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — défaut non posé (ancre absente)'); continue; }
  let vu; try { vu = (await controles(K)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = true; console.log('      (plantage, donc vu : ' + String(e && e.message).slice(0, 60) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
// Contre-épreuves du câblage : le code d'app.js muté, l'assertion visée doit rougir.
const essaisA = [
  ['un Journal qui oublie les pieds de l’entreplantation est vu', A.replace("if(statut==='Validé'&&!_jeEt&&_jeP&&typeof window._cptAuValider==='function') window._cptAuValider(_jeP,tache,jEntry,null);", ''), 'l’entrée de journal écrit'],
  ['« Annuler » qui ne remet plus le compte est vu', A.replace('if(typeof window._cptDefaire===\'function\') window._cptDefaire(p,JOURNAL[idx]); ', ''), '« Annuler » remet'],
  ['une plantation partielle marquée « Validé » par la feuille de la fiche est vue', A.replace("var _cptStA=(_vpTrX&&typeof window._cptStatutApres==='function')?window._cptStatutApres(p,_validTache):'';", "var _cptStA='';"), 'la feuille de la fiche'],
];
for (const [x, AM, cible] of essaisA) {
  const vu = AM !== A && cablage(AM).some(([y, c]) => y.startsWith(cible) && !c);
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
const total = essais.length + essaisA.length;
console.log(`\n  ${total - rates} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(rates ? 1 : 0);
