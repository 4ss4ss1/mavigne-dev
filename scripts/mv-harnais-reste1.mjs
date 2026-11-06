/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RESTE-1 (§535) : LE RESTE À PLANTER — LES TROUS MOINS LES PLANTÉS, D'UNE CAMPAGNE À L'AUTRE
   Lancer : node scripts/mv-harnais-reste1.mjs          (le contrôle)
            node scripts/mv-harnais-reste1.mjs --contre  (chaque défaut reposé doit rougir)
   L'appli ENTIÈRE dans Node (mv-app-node) : la vraie feuille de validation (tapTacheSimple → confirmValidation),
   la vraie clôture (openClotureFlow → _clotExec : photo, nouvelle campagne, bascule), les vrais calculs
   (recalcTravaux, calcHeures, la fiche), la vraie annulation de l'administrateur (annulerTache).
   Domaine fictif : « Les Crais » (30 trous de tarière en novembre 2026, 20 pieds plantés), « Champ Franc »
   (12 marqués, 12 percés), « La Justice » (4 marqués en 2025, jamais percés).
   Contre-épreuve : chaque défaut est posé dans une copie HORS du dépôt (dossier temporaire) et joué dans un
   processus à part — l'appli ne se charge qu'une fois par processus.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const VAR = process.env.MV_RESTE1_VAR || '';
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const DEFAUTS = {
  report: ['src/comptes.js', 'le reste ne passe plus à la campagne suivante', 'var report={ h:H, m:M }', 'H=0; M=0; var report={ h:H, m:M }'],
  statut: ['src/app.js', 'une plantation partielle marque la parcelle « Validé »', "var _cptStA=(_vpTrX&&typeof window._cptStatutApres==='function')?window._cptStatutApres(p,_validTache):'';", "var _cptStA='';"],
  ecrase: ['src/app.js', 'les pieds plantés écrasent de nouveau les trous de la parcelle', 'if(trousVal>0) trous=trousVal;', 'if(trousVal>0){ trous=trousVal; p.plantation_trous=trousVal; delete p.plantation_trous_src; }'],
  cumul: ['src/comptes.js', 'un trou percé ne consomme plus un pied marqué', 'M=Math.max(0,M-np);', ''],
  fait: ['src/app.js', 'l’avancement ne compte que les parcelles validées', 'const _ptd=_plantFaitsTot(parcT);', 'const _ptd=_plantTrousTot(_pv);'],
  annule: ['src/comptes.js', 'une validation annulée ensuite compte encore', "if(typeof window._mvAnnulee==='function'&&window._mvAnnulee(j)) return;", ''],
};

if (CONTRE) {
  console.log('\n── RESTE-1 — contre-épreuve (un processus par défaut)\n');
  let tenues = 0, total = 0;
  for (const [cle, [f, quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++;
    const src = lire(f), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-reste1-')), fp = path.join(tmp, path.basename(f));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 180000,
      env: Object.assign({}, process.env, { MV_RESTE1_VAR: cle, MV_RESTE1_FICHIER: path.basename(f) + '=' + fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').trim().split('\n').pop();
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

// app.js : une copie hors du dépôt, où la personne connectée est posée (currentUser est une variable de CE module —
// window.currentUser du chargeur ne l'atteint pas, et une validation lit currentUser.nom).
const remplace = {}, TMPA = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-reste1-app-'));
let appSrc = lire('src/app.js');
if (process.env.MV_RESTE1_FICHIER) {
  const [k, v] = process.env.MV_RESTE1_FICHIER.split('=');
  if (k === 'app.js') appSrc = fs.readFileSync(v, 'utf8'); else remplace[k] = v;
}
const ANCRE_U = 'let currentUser=null;';
if (appSrc.split(ANCRE_U).length !== 2) { console.log('   ROUGE  app.js : « ' + ANCRE_U + ' » introuvable'); process.exit(1); }
fs.writeFileSync(path.join(TMPA, 'app.js'), appSrc.replace(ANCRE_U, "let currentUser={ nom:'Nico', roles:['admin'], statut:'Actif' };   /* harnais RESTE-1 */"));
remplace['app.js'] = path.join(TMPA, 'app.js');
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const A = await chargerApp({ remplace });
fs.rmSync(TMPA, { recursive: true, force: true });
const { G, poser, setAuj, JOURNAL_ERR } = A;
// Une horloge qui avance d'une seconde à chaque Date.now() : sinon deux saisies du même instant portent le même id,
// et une annulation ne se range plus APRÈS la validation qu'elle vise.
let tick = 0; const now0 = G.Date.now.bind(G.Date); G.Date.now = () => now0() + (++tick) * 1000;
let ok = 0, ko = 0; const rouges = [];
const t = (x, c, d) => {
  if (c) { ok++; if (!VAR) console.log('  \x1b[32m✓\x1b[0m ' + x); }
  else { ko++; rouges.push(x); if (!VAR) console.log('  \x1b[31m✗\x1b[0m ' + x + (d !== undefined ? '\n      → ' + String(d).slice(0, 300) : '')); }
};
const essai = (x, f, d) => {
  let v; try { v = f(); } catch (e) { t(x + ' — plantage : ' + String(e && e.message).slice(0, 100), false); return; }
  let det; if (!v) { try { det = typeof d === 'function' ? d() : d; } catch (e) { det = String(e); } }
  t(x, !!v, det);
};
const el = id => G.document.getElementById(id);
const P = nom => (G.PARCELLES || []).find(p => p && p.nom === nom);
async function valider(nom, n, date) {
  G.tapTacheSimple(nom, 'Entreplantation', null);
  el('vp-trous').value = (n === null || n === undefined) ? '' : String(n);
  el('vp-date').value = date; el('vp-equipe-val').value = 'non';
  await G.confirmValidation();
}

if (!VAR) console.log('\n── RESTE-1 — le reste à planter, d’une campagne à l’autre\n');
for (const f of ['tapTacheSimple', 'confirmValidation', 'openClotureFlow', '_clotExec', 'annulerTache', 'openDP', '_switchSaison', 'recalcTravaux', '_cptReste'])
  if (typeof G[f] !== 'function') t('0 la fonction ' + f + ' est posée sur window', false);

setAuj([2026, 10, 6]);   // vendredi 6 novembre 2026
const S1 = { id: 's1', activite: 'Tarière', date: '2026-11-02', parcellesFaites: [{ nom: 'Les Crais', data: { Trous: 30 } }, { nom: 'Champ Franc', data: { Trous: 12 } }] };
poser({
  config: { domaine_nom: 'Domaine fictif', plantation_min_trou: 3 },
  taches: [{ nom: 'Entreplantation', anytime: true, trous: true }, { nom: 'Taille', hha: 70 }],
  saisons: [{ nom: 'Hiver 2026 - 2027', active: true, debut: '2026-10-01', fin: '2027-03-31', taches: ['Entreplantation', 'Taille'] }],
  activites: [{ nom: 'Tarière', emoji: 'tariere', champCustom: { label: 'Trous', type: 'nombre', feedsPlantation: true } }],
  parcelles: [
    { nom: 'Les Crais', surface: 1.2, statut: 'Actif', taches: { Entreplantation: 'En cours' } },
    { nom: 'Champ Franc', surface: 0.8, statut: 'Actif', taches: {}, trous_marques: 12, trous_marques_le: '2026-10-15', trous_marques_par: 'Léo' },
    { nom: 'La Justice', surface: 0.5, statut: 'Actif', taches: {}, trous_marques: 4, trous_marques_le: '2025-09-20', trous_marques_par: 'Léo' },
  ],
  sessions: [S1],
  journal: [],
});
const crais = P('Les Crais');

essai('A1 30 trous percés à la tarière : 30 à planter', () => G._cptReste(crais) === 30 && G._plantParcTrous(crais) === 30, () => G._cptReste(crais) + ' / ' + G._plantParcTrous(crais));
essai('A2 12 pieds marqués puis 12 trous percés : 12 à planter, pas 24', () => G._cptReste(P('Champ Franc')) === 12, () => G._cptReste(P('Champ Franc')));
essai('A3 4 marqués en 2025, jamais percés : 4 reportés — et pas encore compté cette campagne', () => G._cptReste(P('La Justice')) === 4 && G._cptMarques(P('La Justice')) === null && G._cptChaine(P('La Justice')).report === 4, () => JSON.stringify(G._cptChaine(P('La Justice'))));
let pref = null; try { G.tapTacheSimple('Les Crais', 'Entreplantation', null); pref = el('vp-trous').value; } catch (e) { pref = 'plantage : ' + e.message; }
t('A4 la feuille de validation arrive préremplie avec ce qui reste (30)', String(pref) === '30', pref);

try { await valider('Les Crais', 20, '2026-11-06'); } catch (e) { t('A5 la validation passe — plantage : ' + String(e && e.message).slice(0, 100), false); }
const j0 = (G.JOURNAL || [])[0] || {};
t('A5 20 plantés sur 30 : la parcelle reste « En cours »', crais.taches.Entreplantation === 'En cours', crais.taches.Entreplantation);
t('A6 les 20 pieds vont au journal…', j0.parcelle === 'Les Crais' && j0.plantation_trous === 20 && j0.statut === 'Valid\u00e9', JSON.stringify(j0).slice(0, 200));
t('A7 …et n’écrasent plus les trous de la parcelle', crais.plantation_trous !== 20, crais.plantation_trous);
essai('A8 il en reste 10', () => G._cptReste(crais) === 10, () => G._cptReste(crais));
essai('A9 l’avancement : 46 trous prévus (30 + 12 + 4), 20 faits, la parcelle encore en cours', () => { G.recalcTravaux('Entreplantation'); const w = G.TRAVAUX.Entreplantation || {}; return w.trous_total === 46 && w.trous_done === 20; }, () => JSON.stringify(G.TRAVAUX.Entreplantation));
essai('A10 « La saison » (calcHeures) compte pareil', () => { G.calcHeures(); const w = G.TRAVAUX.Entreplantation || {}; return w.trous_total === 46 && w.trous_done === 20 && w.pct === 43; }, () => JSON.stringify(G.TRAVAUX.Entreplantation));
essai('A11 la fiche de la parcelle dit les chiffres et ce qui reste', () => { G.openDP('Les Crais'); const h = el('dp-taches').innerHTML; return /30 percés/.test(h) && /20 plantés/.test(h) && /reste 10 à planter/.test(h) && !/NaN|undefined/.test(h + el('dp-hreste').innerHTML); }, () => el('dp-taches').innerHTML.slice(0, 500));

// ── La clôture ───────────────────────────────────────────────────────────────
G.fbSave = async () => ({ ok: true });
const cap = [], ce = G.document.createElement;
G.document.createElement = function () { const e = ce.apply(this, arguments); cap.push(e); return e; };
try { G.openClotureFlow(); } catch (e) { t('B0 l’écran de clôture s’ouvre — plantage : ' + e.message, false); }
G.document.createElement = ce;
const ecr = cap.map(e => e.innerHTML || '').join('\n');
t('B1 l’écran de clôture dit combien de pieds restent à planter (26)', /26 pieds encore à planter/.test(ecr), (ecr.match(/[^>]{0,40}encore[^<]{0,60}/) || [''])[0] || 'ligne absente');
el('clot-name').value = 'Hiver 2027 - 2028'; el('clot-deb').value = '2027-10-01'; el('clot-fin').value = '2028-03-31';
try { await G._clotExec(); } catch (e) { t('B2 la clôture passe — plantage : ' + e.message, false); }
const act = (G.getSaisonActive() || {}).nom;
t('B2 la nouvelle campagne est active', act === 'Hiver 2027 - 2028', act);
t('B3 l’avancement de l’ancienne est rangé sous son nom, la nouvelle démarre vierge', ((crais.tachesAll || {})['Hiver 2026 - 2027'] || {}).Entreplantation === 'En cours' && !crais.taches.Entreplantation, JSON.stringify({ t: crais.taches, a: crais.tachesAll }).slice(0, 200));

// ── Un an plus tard ──────────────────────────────────────────────────────────
setAuj([2027, 10, 10]);   // 10 novembre 2027
essai('C1 un an plus tard, les 10 restent à planter : rien n’est reparti de zéro', () => G._cptReste(crais) === 10 && G._plantParcTrous(crais) === 10 && G._cptChaine(crais).report === 10, () => JSON.stringify(G._cptChaine(crais)));
essai('C2 La Justice : ses 4 marqués de 2025 sont toujours à planter', () => G._cptReste(P('La Justice')) === 4, () => G._cptReste(P('La Justice')));
poser({ sessions: [S1, { id: 's2', activite: 'Tarière', date: '2027-11-08', parcellesFaites: [{ nom: 'Les Crais', data: { Trous: 5 } }] }] });
essai('C3 5 trous de plus : 15 à planter — les nouveaux s’ajoutent au reste', () => G._cptReste(crais) === 15, () => G._cptReste(crais));
crais.taches.Entreplantation = 'En cours';
try { await valider('Les Crais', null, '2027-11-10'); } catch (e) { t('C4 la validation passe — plantage : ' + e.message, false); }
const j1 = (G.JOURNAL || [])[0] || {};
essai('C4 « Valider » sans nombre plante tout ce qui reste (15) : la parcelle est validée', () => j1.plantation_trous === 15 && crais.taches.Entreplantation === 'Valid\u00e9' && G._cptReste(crais) === 0, () => JSON.stringify({ n: j1.plantation_trous, st: crais.taches.Entreplantation, r: G._cptReste(crais) }));
try { G.annulerTache('Les Crais', 'Entreplantation'); } catch (e) { t('C5 l’annulation passe — plantage : ' + e.message, false); }
essai('C5 annulée par l’administrateur : les 15 reviennent à planter', () => G._cptReste(crais) === 15, () => G._cptReste(crais));
essai('C6 la période d’avant, consultée : 30 prévus (20 plantés + 10 restés à sa fin)', () => {
  G._switchSaison('Hiver 2026 - 2027', true); const v = G._plantParcTrous(crais), r = G._cptResteA(crais);
  G._switchSaison('Hiver 2027 - 2028', true); return v === 30 && r === 10;
}, () => { G._switchSaison('Hiver 2026 - 2027', true); const s = G._plantParcTrous(crais) + ' / ' + G._cptResteA(crais); G._switchSaison('Hiver 2027 - 2028', true); return s; });
t('C7 aucune erreur avalée dans les comptes', !JOURNAL_ERR.some(e => /comptes\.js|_cpt/.test(String(e && e.msg))), JOURNAL_ERR.map(e => e.msg).join(' | ').slice(0, 300));

// ── Ce qui ne se joue pas ici : lu dans les fichiers (commentaires retirés) ──
const PIL = sansCom(lire('src/pilotage.js')), APP = sansCom(lire('src/app.js')), REG = sansCom(lire('src/reglages.js'));
t('D1 Pilotage : le reste à planter (parcelle validée ou en cours), et les pieds de chaque validation', /window\._plantParcReste\(p\)/.test(PIL) && /window\._cptPlantesEntree\(p,ev\.jid\)/.test(PIL) && !/ev\.trous\|\|p\.plantation_trous/.test(PIL));
t('D2 Pilotage : une entreplantation plantée en plusieurs fois garde le barème de chaque fois (RÉAL-1)', /dup=!!P\.val&&!\(window\.TACHES\|\|\[\]\)\.some\(function\(t\)\{ return t&&t\.nom===j\.tache&&t\.trous; \}\);/.test(PIL));
t('D3 la reconstruction depuis le journal laisse « En cours » une parcelle plantée en partie', /window\._cptResteA\(p\)>0\) return;[^\n]*\n\s*plan\.push\(\{nom:nom,tache:tache,type:'simple'\}\);/.test(APP));
t('D4 le document du vignoble dit ce qui reste à planter', /trous: \(typeof window\._cptReste === 'function'\) \? window\._cptReste\(p\)/.test(REG) && /l\.trous \+ ' \\u00e0 planter<\/i>'/.test(REG));

if (VAR) { console.log('rouges : ' + (rouges.join(' · ') || 'aucun')); process.exit(ko ? 1 : 0); }
console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
