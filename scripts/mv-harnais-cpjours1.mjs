/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CPJOURS-1 (§537) : LES CONGÉS SE DÉCOMPTENT PAR PÉRIODE, JOURS DE REPOS COMPRIS
   Lancer : node scripts/mv-harnais-cpjours1.mjs          (le contrôle)
            node scripts/mv-harnais-cpjours1.mjs --contre  (chaque défaut reposé doit rougir)
   Signalé par Nico le 06/11 : une semaine de congé posée sur un rythme où le mercredi est un jour de repos
   comptait 4 jours. La règle (Cass. soc. 23/02/2000, fiche service-public) : le congé part du premier jour
   où la personne aurait travaillé et compte tous les jours ouvrables — ou ouvrés, selon le réglage du
   domaine — jusqu'à la veille de sa reprise, jours de repos compris, fériés et dimanches jamais.
   Les VRAIES fonctions, extraites de src/planning.js : _planCpCle, _planCpJours, _planCpAjout, _planCpPris,
   _planCpPeriode, _planCpMoisDebut, _planCpMode, _feriesY, _mvEasterMD — jouées sur 2027 (fériés réels).
   Domaine fictif : « Marie » (lundi→jeudi 7 h, vendredi 4 h), « Nico » (deux semaines : A pleine, B avec le
   mercredi de repos), « Paul » (le samedi travaillé), « Sophie » (un modèle avec trois semaines d'août à 0 h).
   Contre-épreuve : chaque défaut est posé dans une copie de planning.js HORS du dépôt et joué dans un
   processus à part ; il doit rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');

// [ce que le défaut casse, l'ancre exacte dans src/planning.js, ce qui la remplace]
const DEFAUTS = {
  repos:     ['les jours de repos ne comptent plus : on revient aux seules cases posées',
              'repos:inC&&!estCp&&!travail&&!ferme&&!saisie(y,m,d)});', 'repos:false});'],
  depart:    ['le congé ne part plus du premier jour travaillé',
              'while(a<=pr.fin&&!info(a).depart)a=lendemain(a);', 'while(false)a=lendemain(a);'],
  fermeture: ['une semaine entièrement à 0 h redevient un repos',
              '      ferme=true;\n', '      ferme=false;\n'],
  dimanche:  ['le dimanche se décompte',
              'if(!I.inC||I.fer||I.dow===0)continue;', 'if(!I.inC||I.fer)continue;'],
  ouvres:    ['en jours ouvrés, le samedi se décompte',
              "if(mode==='ouvres'&&I.dow===6)continue;", ''],
  apercu:    ['l’aperçu de la pose sur une période revient aux cases',
              '  return {cells:cells, marked:marked, count:_planCpAjout(mbr,marked)};',
              '  return {cells:cells, marked:marked, count:_planCpCount(plId,marked,mode)};'],
};

if (CONTRE) {
  console.log('\n── CPJOURS-1 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/planning.js');
  let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++;
    const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-cpjours1-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000,
      env: Object.assign({}, process.env, { MV_CPJOURS1_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

/* ══ EXTRACTION — les fonctions telles qu'elles sont écrites ══ */
const PL = process.env.MV_CPJOURS1_PLANNING ? fs.readFileSync(process.env.MV_CPJOURS1_PLANNING, 'utf8') : lire('src/planning.js');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE de src/planning.js : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); }
  }
  throw new Error('accolades déséquilibrées : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planCpMoisDebut', '_planCpPeriode', '_planCpMode',
  '_planCpCle', '_planCpJours', '_planCpAjout', '_planCpPris'];

/* ══ LE DOMAINE FICTIF ══ */
const AN = 2027;
function modele(jourH, zero) {            // jourH(date) → heures ; zero(date) → vrai si fermeture
  const t = {};
  for (let d = new Date(AN - 1, 0, 1); d.getFullYear() <= AN + 1; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear(), m = d.getMonth(), j = d.getDate(), h = (zero && zero(d)) ? 0 : jourH(d);
    if (h > 0) { ((t[y] = t[y] || {})[m] = t[y][m] || {})[j] = h; }
  }
  return t;
}
const semaine = d => Math.floor((d - new Date(AN, 0, 4)) / (7 * 864e5));       // 0 = semaine du lundi 4 janvier 2027
const MODELES = {
  std:    modele(d => [0, 7, 7, 7, 7, 4, 0][d.getDay()]),
  cycle:  modele(d => (((semaine(d) % 2) + 2) % 2 === 0 ? [0, 7.5, 6.5, 6, 7, 4, 0] : [0, 6.5, 7, 0, 6.5, 4, 0])[d.getDay()]),
  samedi: modele(d => [0, 7, 7, 7, 7, 4, 5][d.getDay()]),
  ferme:  modele(d => [0, 7, 7, 7, 7, 4, 0][d.getDay()], d => d >= new Date(AN, 7, 2) && d <= new Date(AN, 7, 20)),
};
const MEMBRES = [{ nom: 'Marie', pl: 'std' }, { nom: 'Nico', pl: 'cycle' }, { nom: 'Paul', pl: 'samedi' }, { nom: 'Sophie', pl: 'ferme' }];

function bac() {
  const window = { MEMBRES, CONFIG: { cp_mode: 'ouvrables', cp_periode_debut: 5 }, _planSurAnnee: (y, fn) => fn() };
  const ctx = vm.createContext({
    window, PLANNING_ENTRIES: {}, planMonth: 0, _MV_FERIES_CACHE: {},
    _pY: () => AN, _planMigrateYears: () => {}, _planPlId: m => m.pl,
    _planGetTpl: (pl, y) => (MODELES[pl] && MODELES[pl][y]) || {}, _planInContract: () => true,
  });
  vm.runInContext(NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.__f={_planCpJours,_planCpAjout,_planCpPris,_planCpPeriode};', ctx);
  return ctx;
}
const C = bac();
function poser(nom, dates) {               // dates : ['01-11', …] en 2027
  const E = {}; dates.forEach(md => { const [m, d] = md.split('-').map(Number); ((E[AN] = E[AN] || {})[m - 1] = E[AN][m - 1] || {})[d] = { type: 'cp', heures: 0 }; });
  return E;
}
function compte(nom, dates, mode, mois) {
  C.PLANNING_ENTRIES = { [nom]: poser(nom, dates) };
  vm.runInContext('PLANNING_ENTRIES=this.PLANNING_ENTRIES;', C);
  C.window.CONFIG.cp_mode = mode; C.planMonth = mois;
  vm.runInContext('planMonth=this.planMonth;', C);
  return C.__f._planCpPris(nom);
}

let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) {
  if (obtenu === attendu) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + obtenu); }
  else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + obtenu + ' (attendu ' + attendu + ')'); }
}
console.log('\n── CPJOURS-1 — le décompte des congés par période (2027, fériés réels)\n');
const semB = ['01-11', '01-12', '01-14', '01-15'];                   // Nico, semaine B : le mercredi 13 est son repos
vaut('A · Nico, cochés un par un (lun, mar, jeu, ven), 6 jours par semaine', compte('Nico', semB, 'ouvrables', 0), 6);
vaut('A · la même semaine, 5 jours par semaine', compte('Nico', semB, 'ouvres', 0), 5);
vaut('B · posé du lundi au vendredi, mercredi compris (0 h)', compte('Nico', ['01-11', '01-12', '01-13', '01-14', '01-15'], 'ouvrables', 0), 6);
vaut('C · lundi et mardi, reprise le jeudi : le mercredi de repos compte (service-public)', compte('Nico', ['01-11', '01-12'], 'ouvrables', 0), 3);
vaut('C · la même chose en jours ouvrés', compte('Nico', ['01-11', '01-12'], 'ouvres', 0), 3);
vaut('D · posé à partir de son mercredi de repos : le compte part du jeudi', compte('Nico', ['01-13', '01-14', '01-15'], 'ouvrables', 0), 3);
vaut('D · la même chose en jours ouvrés', compte('Nico', ['01-13', '01-14', '01-15'], 'ouvres', 0), 2);
vaut('E · une semaine ordinaire du lundi au vendredi, 6 jours', compte('Marie', ['01-18', '01-19', '01-20', '01-21', '01-22'], 'ouvrables', 0), 6);
vaut('E · la même semaine, 5 jours', compte('Marie', ['01-18', '01-19', '01-20', '01-21', '01-22'], 'ouvres', 0), 5);
vaut('F · un vendredi seul : le samedi qui suit compte (6 jours)', compte('Marie', ['01-22'], 'ouvrables', 0), 2);
vaut('F · le même vendredi en jours ouvrés', compte('Marie', ['01-22'], 'ouvres', 0), 1);
vaut('G · un vendredi seul, samedi travaillé : la reprise est le samedi', compte('Paul', ['01-22'], 'ouvrables', 0), 1);
vaut('H · une semaine de fermeture à 0 h posée en congé compte comme avant', compte('Sophie', ['08-02', '08-03', '08-04', '08-05', '08-06'], 'ouvrables', 7), 6);
vaut('I · un vendredi la veille d’une fermeture non posée : la fermeture n’est pas avalée', compte('Sophie', ['07-30'], 'ouvrables', 7), 2);
vaut('J · Ascension (jeudi) et 8 mai (samedi) fériés dans la semaine : jamais décomptés', compte('Marie', ['05-03', '05-04', '05-05', '05-07'], 'ouvrables', 4), 4);
vaut('K · deux semaines séparées par une semaine travaillée', compte('Marie', ['01-18', '01-19', '01-20', '01-21', '01-22', '02-01', '02-02', '02-03', '02-04', '02-05'], 'ouvrables', 0), 12);
vaut('L · posé sur son seul mercredi de repos : rien à décompter', compte('Nico', ['01-13'], 'ouvrables', 0), 0);
vaut('N · la période de référence coupe (juin 2026 → mai 2027) : le 31 mai seul', compte('Marie', ['05-31', '06-01', '06-02', '06-03', '06-04'], 'ouvrables', 4), 1);
vaut('N · la période suivante (juin 2027 → mai 2028) : du mardi 1er au samedi 5 juin', compte('Marie', ['05-31', '06-01', '06-02', '06-03', '06-04'], 'ouvrables', 5), 5);
// M · l'aperçu d'une pose = le solde après moins le solde avant, par la même fonction
C.PLANNING_ENTRIES = { Marie: poser('Marie', ['01-18', '01-19', '01-20', '01-21', '01-22']) };
vm.runInContext('PLANNING_ENTRIES=this.PLANNING_ENTRIES;', C);
C.window.CONFIG.cp_mode = 'ouvrables'; C.planMonth = 0; vm.runInContext('planMonth=this.planMonth;', C);
const marques = [25, 26, 27, 28, 29].map(d => ({ yr: AN, mi: 0, d }));
const avant = C.__f._planCpPris('Marie'), ajout = C.__f._planCpAjout({ nom: 'Marie' }, marques);
vaut('M · l’aperçu d’une semaine de plus annonce 6 jours', ajout, 6);
vaut('M · et le solde, avant la pose, n’a pas bougé', C.__f._planCpPris('Marie'), avant);
// Le câblage : les deux chemins de pose annoncent ce que la pose ajoute (et plus les cases)
const plan = fonction(PL, '_planCpPlan'), sel = fonction(PL, '_planCpSelBuild');
vaut('câblage · la pose sur une période annonce _planCpAjout', /count:_planCpAjout\(mbr,marked\)/.test(plan) && !/_planCpCount\(/.test(plan), true);
vaut('câblage · la pose depuis la sélection annonce _planCpAjout', /count:_planCpAjout\(mbr,marked\)/.test(sel) && !/_planCpCount\(/.test(sel), true);

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
