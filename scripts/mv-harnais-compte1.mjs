/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — COMPTE-1 (§353) : LES PIEDS MARQUÉS CHIFFRENT L'ENTREPLANTATION
   Lancer : node scripts/mv-harnais-compte1.mjs          (le contrôle)
            node scripts/mv-harnais-compte1.mjs --contre  (la contre-épreuve)
   Les règles sont EXÉCUTÉES (bloc borné de src/comptes.js, sans dépendance) ;
   le reste est le câblage : la validation, l'annulation, les lectures des trous
   prévus (fiche, rapport, Pilotage), la tarière préremplie, le réglage de la tâche.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const K0 = fs.readFileSync('src/comptes.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8'), G = fs.readFileSync('src/reglages.js', 'utf8');
const P = fs.readFileSync('src/pilotage.js', 'utf8'), T = fs.readFileSync('src/tracteur.js', 'utf8'), U = fs.readFileSync('src/utils.js', 'utf8');
const H = fs.readFileSync('index.html', 'utf8'), S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── COMPTE-1 : début du bloc exécutable', FIN = '// ── COMPTE-1 : fin du bloc exécutable';
let n = 0;
const charger = K => import('data:text/javascript;base64,' + Buffer.from(K.slice(K.indexOf(DEB), K.indexOf(FIN))
  + '\nexport { _cptMarques, _cptPerces, _cptPrevus, _cptDemande, _cptPiloteTrous, _cptRienAPlanter, _cptChaine, _cptResume, _cptPoser, _cptRemettre, _cptPas };\n// ' + (++n) + '\n', 'utf8').toString('base64'));
async function controles(K) {
  const M = await charger(K), r = [];
  r.push(['trous prévus : le plus grand des deux (120 marqués, 60 percés → 120)', M._cptPrevus({ trous_marques: 120, plantation_trous: 60, plantation_trous_src: 'tariere' }) === 120]);
  r.push(['trous prévus : plus de trous percés que de pieds marqués → les trous (90 > 80)', M._cptPrevus({ trous_marques: 80, plantation_trous: 90, plantation_trous_src: 'tariere' }) === 90]);
  r.push(['trous prévus : sans rien, zéro ; un compte vide n’est pas zéro', M._cptPrevus({}) === 0 && M._cptMarques({ trous_marques: '' }) === null && M._cptMarques({ trous_marques: 0 }) === 0]);
  r.push(['percés : seulement les trous venus de la tarière', M._cptPerces({ plantation_trous: 40, plantation_trous_src: 'tariere' }) === 40 && M._cptPerces({ plantation_trous: 40 }) === 0]);
  r.push(['le compte se demande sur une tâche simple, jamais à trous, à niveaux ou à passages',
    M._cptDemande({ nom: 'Repérage', demandeCompte: true }) && !M._cptDemande({ nom: 'X', demandeCompte: true, trous: true })
    && !M._cptDemande({ nom: 'R', demandeCompte: true, type: 'niveaux' }) && !M._cptDemande({ nom: 'E', demandeCompte: true, type: 'passages' }) && !M._cptDemande({ nom: 'T' })]);
  r.push(['l’entreplantation est pilotée par les trous, même sans le drapeau', M._cptPiloteTrous({ nom: 'Entreplantation' }) && M._cptPiloteTrous({ nom: 'Autre', trous: true }) && !M._cptPiloteTrous({ nom: 'Taille' })]);
  r.push(['comptée à zéro et sans trou : rien à planter ; avec des trous percés, si', M._cptRienAPlanter({ trous_marques: 0 }) && !M._cptRienAPlanter({ trous_marques: 0, plantation_trous: 12 }) && !M._cptRienAPlanter({})]);
  const J = [{ parcelle: 'Clos', tache: 'Entreplantation', statut: 'Validé', plantation_trous: 118 }, { parcelle: 'Autre', tache: 'Entreplantation', statut: 'Validé', plantation_trous: 5 }];
  const c = M._cptChaine({ nom: 'Clos', trous_marques: 120, plantation_trous: 118 }, J);
  r.push(['la chaîne : marqués, percés, plantés (la validation du journal)', c.marques === 120 && c.perces === 0 && c.plantes === 118 && c.valide === true, JSON.stringify(c)]);
  const R = M._cptResume([{ nom: 'A', trous_marques: 10 }, { nom: 'B', trous_marques: 0 }, { nom: 'C' }, { nom: 'D', trous_marques: 7, statut: 'Arrachee' }]);
  r.push(['le résumé : 10 pieds, 2 comptées sur 3 en place (l’arrachée sort)', R.pieds === 10 && R.comptees === 2 && R.total === 3, JSON.stringify(R)]);
  const p = { nom: 'Clos', trous_marques: 50, trous_marques_par: 'Paul', trous_marques_le: '2026-10-12' };
  const av = M._cptPoser(p, 61, 'Léo', '2026-10-17', true);
  r.push(['poser un compte rend l’ancien, et l’annulation le remet tel quel', p.trous_marques === 61 && p.trous_marques_corr === true && av.n === 50 && (M._cptRemettre(p, av), p.trous_marques === 50 && p.trous_marques_par === 'Paul' && !p.trous_marques_corr)]);
  const q = {}; const av2 = M._cptPoser(q, 3, 'Léo', '2026-10-17', false);
  r.push(['annuler le premier compte d’une parcelle l’efface', av2 === null && (M._cptRemettre(q, av2), q.trous_marques === undefined)]);
  let e = { val: '142', frais: true }; e = M._cptPas(e, 'd', '9');
  r.push(['le pavé : un chiffre tapé sur une valeur préremplie la remplace', e.val === '9' && e.frais === false]);
  let f = { val: '', frais: false }; for (const d of ['1', '2', '3', '4', '5']) f = M._cptPas(f, 'd', d);
  r.push(['le pavé : quatre chiffres au plus, « moins » ne passe pas sous zéro', f.val === '1234' && M._cptPas({ val: '0', frais: false }, 'moins').val === '0' && M._cptPas({ val: '', frais: false }, 'zero').val === '0']);
  return r;
}
function cablage() {
  const pq = A.slice(A.indexOf('function pQuickValidate('), A.indexOf('function pQuickUndoEntry('));
  const cv = A.slice(A.indexOf('function confirmValidation('), A.indexOf('function confirmValidation(') + 6000);
  return [
    ['le module est chargé par app.js', /import '\.\/comptes\.js';/.test(A)],
    ['« Valider » (cartes, carte du domaine) ouvre le pavé avant d’écrire, et reprend par le même chemin', /window\._cptAvantValider\(p,task,function\(n\)\{pQuickValidate\(nom,\{_cpt:n\}\);\}\)\) return;/.test(pq) && /window\._cptAuValider\(p,task,jEntry,_cpt\)/.test(pq)],
    ['« Annuler » remet le compte d’avant', /window\._cptDefaire\(p,JOURNAL\[idx\]\)/.test(A)],
    ['la feuille de la fiche exige le compte (0 compris) et l’écrit', /Indique le nombre de pieds marqués/.test(cv) && /window\._cptAuValider\(p,_validTache,jEntry,_cptVal\)/.test(cv)],
    ['une seule lecture des trous prévus dans app.js (_plantParcTrous), plus aucun champ brut', /function _plantParcTrous\(p\)\{ return \(typeof window\._cptPrevus==='function'\)/.test(A) && !/p\.plantation_trous\|\|0\)>0/.test(A) && !/\(parseInt\(p\.plantation_trous\)\|\|0\):0;/.test(A)],
    ['le Pilotage lit les trous prévus (3 endroits)', (P.match(/_opTrousPrevus\(p\)/g) || []).length - (P.match(/function _opTrousPrevus\(p\)/g) || []).length === 3 && !/parseInt\(p\.plantation_trous\)\|\|0;/.test(P.replace(/function _opTrousPrevus[^\n]*\n/, ''))],
    ['une parcelle comptée à zéro sort des parcelles concernées (liste et règle commune)', /window\._cptHors\(p,nomTache\)/.test(A) && /window\._cptHors\(p, nom\)/.test(U)],
    ['la tarière arrive préremplie avec les pieds marqués', /act\.champCustom\.feedsPlantation&&typeof window\._cptMarques==='function'/.test(T) && /id="ocv-hint"/.test(H)],
    ['« alimente les trous » se coche dès la création de l’activité', /champCustom\.feedsPlantation=true/.test(T) && /id="new-act-champ-feeds"/.test(H) && !/la tâche Plantation/.test(H)],
    ['le réglage « Demander le nombre de pieds marqués » : posé, enregistré, et gardé par l’écran des heures', /id="ehha-cpt"/.test(G) && /t\.demandeCompte=true; else delete t\.demandeCompte;/.test(G) && /if\(_ex\.demandeCompte\) t\.demandeCompte=true;/.test(G)],
    ['la roue crantée ouvre la feuille des comptes sous l’entreplantation', /window\._cptLigneReglages\(\)/.test(G) && /<div class="overlay" id="ovComptes"/.test(H) && /<div class="overlay" id="ovCompte"/.test(H)],
    ['les icônes du pavé existent dans le sprite', /<symbol id="ic-moins"/.test(H) && /<symbol id="ic-effacer"/.test(H)],
    ['aucune couleur en dur dans le style du lot', (() => { const b = S.slice(S.indexOf('/* ★★ COMPTE-1 (§353)'), S.indexOf('/* ★ FIN COMPTE-1 */')); return b.length > 500 && !/#[0-9a-fA-F]{3,6}\b/.test(b) && !/font-size:\s*\d/.test(b); })()],
    ['les textes de la feuille passent par l’échappement', /<b>'\+n\+'<\/b>/.test(K0) && /var n=_e\(p\.nom\)/.test(K0)],
  ];
}
let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── COMPTE-1 — les pieds marqués\n');
  for (const [x, c, d] of await controles(K0)) t(x, c, d);
  for (const [x, c] of cablage()) t(x, c);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── COMPTE-1 — contre-épreuve\n');
const essais = [
  ['le plus petit des deux au lieu du plus grand est vu', K0.replace('return Math.max(_cptMarques(p)||0,', 'return Math.min(_cptMarques(p)||0,'), 'trous prévus : le plus grand'],
  ['le compte demandé sur une tâche à trous est vu', K0.replace("return !!(t&&t.demandeCompte&&!t.trous&&", "return !!(t&&t.demandeCompte&&"), 'le compte se demande'],
  ['une annulation qui oublie l’auteur d’avant est vue', K0.replace("p.trous_marques=avant.n; p.trous_marques_par=avant.par||'';", "p.trous_marques=avant.n;"), 'poser un compte'],
];
let rates = 0;
for (const [x, K, cible] of essais) {
  let vu; try { vu = (await controles(K)).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = true; console.log('      (plantage, donc vu : ' + String(e && e.message).slice(0, 60) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
