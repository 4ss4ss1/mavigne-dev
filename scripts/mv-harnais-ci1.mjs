// HARNAIS — CI-1 (§514) : LA CI EN SIX JOBS QUI DÉMARRENT ENSEMBLE, AUCUN PRÈS DE SA LIMITE ; LES TUTOS EN PARTIES.
//   node scripts/mv-harnais-ci1.mjs           → doit être vert
//   node scripts/mv-harnais-ci1.mjs --contre  → chaque défaut réinjecté doit rougir
// POURQUOI. Jusqu'au 02/11, un seul job de la CI enchaînait contrôles, build, smoke, tutos, gabarit et expérience d'usage :
//   20 à 22 min de travail pour une limite de 20. GitHub coupait le job à la limite — « annulé », gris, jamais rouge —, à un
//   endroit qui changeait d'un envoi à l'autre : après planux1 (31/10), treize envois sans verdict complet au vert. Ce
//   harnais garde la répartition, que rien d'autre ne voit tant que les durées tiennent :
//   1. le calcul des parties (scripts/mv-tutos-partie.mjs), JOUÉ : chaque tuto dans une partie et une seule, les parties à un
//      tuto près, l'ordre gardé, les vérifications d'ensemble une fois, une option mal formée refusée ;
//   2. le lanceur des tutos (scripts/mv-tutos-jeu.mjs) : l'option lue et vérifiée avant le navigateur, la vraie liste lue
//      dans l'appli puis réduite à la partie AVANT de jouer, l'ensemble sur la dernière partie, aucun rapport partiel ;
//   3. la CI (.github/workflows/ci.yml), découpée au texte : tutos, gabarit et UX hors du job des contrôles ; les tutos en
//      matrice 1..N dont le total suit la matrice ; chaque job qui joue un navigateur a son npm ci, son build
//      (--ignore-scripts) et son Chromium AVANT ; aucun job n'en attend un autre ; chaque job a sa limite.
//   ⚠️ Il ne mesure aucune durée : elles se lisent dans l'onglet Actions, étape par étape (CLAUDE.md §6b, CI-1).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8').replace(/\r\n/g, '\n');
const CONTRE = process.argv.includes('--contre');
const SAIN = { ci: lire('.github/workflows/ci.yml'), jeu: lire('scripts/mv-tutos-jeu.mjs'), partie: lire('scripts/mv-tutos-partie.mjs'),
  liste: lire('scripts/mv-harnais-liste.mjs') };

const sansComYml = (s) => s.replace(/^\s*#.*$/gm, '');   // on lit ce qui s'exécute, pas ce qu'on en raconte
const sansComJs = (s) => s.replace(/^\s*\/\/.*$/gm, '');  // idem (§34g)

// Les jobs de ci.yml, découpés au texte : une clé à deux espaces sous « jobs: » ouvre un job, jusqu'à la suivante.
function jobs(ci) {
  const i = ci.search(/^jobs:\s*$/m);
  if (i < 0) return {};
  const corps = ci.slice(i), tetes = [...corps.matchAll(/^ {2}([A-Za-z0-9_-]+):\s*$/gm)], J = {};
  tetes.forEach((m, k) => { J[m[1]] = corps.slice(m.index, k + 1 < tetes.length ? tetes[k + 1].index : corps.length); });
  return J;
}

async function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });

  /* ══ 1. LE CALCUL DES PARTIES, JOUÉ ══ */
  let M = null;
  try { M = await import('data:text/javascript;base64,' + Buffer.from(S.partie).toString('base64')); }
  catch (e) { t('scripts/mv-tutos-partie.mjs se charge', false, e.message); }
  if (M) {
    const L8 = ['jequipe', 'equipes', 'cave', 'gnr', 'amendement', 'produit-repris', 'maturites', 'stade'];   // la liste du 02/11
    const sans = M.partie(['node', 'scripts/mv-tutos-jeu.mjs']);
    t('sans --part : une seule partie, toute la liste, dans l’ordre (1/1, comme avant)',
      sans.k === 1 && sans.n === 1 && !sans.erreur && JSON.stringify(M.maPartie(L8, sans)) === JSON.stringify(L8) && M.derniere(sans) === true, JSON.stringify(sans));
    const p12 = M.partie(['--part', '1/2']), p22 = M.partie(['--concernes', '--part', '2/2']);
    t('--part 1/2 et --part 2/2 se lisent, où que soit l’option', p12.k === 1 && p12.n === 2 && p22.k === 2 && p22.n === 2, JSON.stringify([p12, p22]));
    t('8 tutos sur deux machines : un sur deux chacune, dans l’ordre, l’ensemble sur la seconde',
      JSON.stringify(M.maPartie(L8, p12)) === JSON.stringify(['jequipe', 'cave', 'amendement', 'maturites'])
      && JSON.stringify(M.maPartie(L8, p22)) === JSON.stringify(['equipes', 'gnr', 'produit-repris', 'stade'])
      && M.derniere(p12) === false && M.derniere(p22) === true, JSON.stringify([M.maPartie(L8, p12), M.maPartie(L8, p22)]));
    const fautes = [];
    for (let n = 1; n <= 5; n++) for (let len = 0; len <= 13; len++) {
      const liste = Array.from({ length: len }, (_, i) => 't' + i);
      const parts = Array.from({ length: n }, (_, k) => M.maPartie(liste, { k: k + 1, n }));
      const tous = parts.flat(), tailles = parts.map((p) => p.length);
      if (tous.length !== len || new Set(tous).size !== len || !liste.every((x) => tous.includes(x))) fautes.push(n + ' machine(s), ' + len + ' tuto(s) : ' + JSON.stringify(parts));
      else if (Math.max(...tailles) - Math.min(...tailles) > 1) fautes.push(n + ' machine(s), ' + len + ' tuto(s) : déséquilibré ' + JSON.stringify(tailles));
      else if (parts.some((p) => p.some((x, i) => i > 0 && liste.indexOf(p[i - 1]) > liste.indexOf(x)))) fautes.push(n + ' machine(s), ' + len + ' tuto(s) : ordre perdu');
      const dernieres = Array.from({ length: n }, (_, k) => M.derniere({ k: k + 1, n })).filter(Boolean).length;
      if (dernieres !== 1) fautes.push(n + ' machine(s) : ' + dernieres + ' dernière(s) partie(s)');
    }
    t('de 1 à 5 machines, de 0 à 13 tutos : chaque tuto dans une partie et une seule, à un tuto près, l’ordre gardé, une seule dernière partie',
      fautes.length === 0, fautes.slice(0, 3).join(' · '));
    const mauvais = ['0/2', '3/2', '2', '1/0', 'a/b', '', '-1/2', '1/2/3', '1 /2'];
    const passes = mauvais.filter((v) => !M.partie(['--part', v]).erreur);
    t('une option mal formée est refusée (' + (mauvais.length + 1) + ' formes, dont l’option sans valeur)', passes.length === 0 && !!M.partie(['--part']).erreur,
      'acceptée(s) : ' + passes.map((v) => '« ' + v + ' »').join(', '));
  }

  /* ══ 2. LE LANCEUR DES TUTOS ══ */
  const jeu = sansComJs(S.jeu);
  t('le lanceur lit --part par scripts/mv-tutos-partie.mjs',
    /import \{ partie, maPartie, derniere \} from '\.\/mv-tutos-partie\.mjs';/.test(jeu) && /const PART = partie\(process\.argv\);/.test(jeu));
  const iErr = jeu.indexOf('if (PART.erreur) {'), iNav = jeu.indexOf('chromium.launch(');
  t('une option mal formée arrête tout (code 2), avant le moindre navigateur', /if \(PART\.erreur\) \{[^\n]*process\.exit\(2\); \}/.test(jeu) && iErr > 0 && iNav > iErr);
  const iLire = jeu.indexOf('if (!liste) liste = await lireListe(navigateur, base);'), iPart = jeu.indexOf('liste = maPartie(liste, PART);');
  t('la vraie liste se lit dans l’appli AVANT de jouer (_mvTutoListe), puis se réduit à la partie',
    iLire > 0 && iPart > iLire && /l = await page\.evaluate\(\(\) => window\._mvTutoListe\(\)\);/.test(jeu), 'lecture à ' + iLire + ', partie à ' + iPart);
  const iEcrans = jeu.indexOf('for (const ecran of ECRANS) {'), iCadre = jeu.indexOf('await jouerCadre(navigateur, base, liste[i])'),
    iMiroir = jeu.indexOf('await jouerMiroir(navigateur, base, liste[i])');
  t('… avant chaque boucle de jeu : les écrans, le panneau, le miroir', iPart > 0 && iEcrans > iPart && iCadre > iPart && iMiroir > iPart,
    [iPart, iEcrans, iCadre, iMiroir].join(' · '));
  const iDer = jeu.indexOf('if (derniere(PART)) {'), iFin = jeu.indexOf('await navigateur.close(); srv.close();');
  const appels = (re) => [...jeu.matchAll(re)].map((m) => m.index);
  const cote = appels(/await jouerCote\(/g), boot = appels(/await jouerVieuxBoot\(/g);
  t('le côte à côte et le vieux boot.js : une fois, sur la dernière partie',
    iDer > iMiroir && cote.length === 1 && boot.length === 1 && cote[0] > iDer && boot[0] > iDer && cote[0] < iFin && boot[0] < iFin, JSON.stringify({ iDer, cote, boot, iFin }));
  t('une partie n’écrit pas rapports/tutos.json (la marque d’un lot le croirait complet)',
    /if \(PART\.n > 1\) console\.log\([^\n]*\);\n\s*else \{\n\s*try \{ mkdirSync\('rapports'/.test(jeu));

  /* ══ 3. LA CI ══ */
  const ci = sansComYml(S.ci), J = jobs(ci), ids = Object.keys(J);
  const ou = (cmd) => ids.filter((id) => J[id].includes(cmd));
  const fois = (cmd) => (ci.match(new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g')) || []).length;
  t('la CI se découpe en jobs : contrôles, tutos, mesures', !!J.controles && !!J.tutos && !!J.mesures, ids.join(', '));
  t('le job des contrôles ne joue ni les tutos, ni le gabarit, ni l’expérience d’usage', !!J.controles && !/test:tutos|test:gabarit|test:ux/.test(J.controles));
  t('le smoke reste dans le job des contrôles', ou('run: npm run test:smoke').join() === 'controles', ou('run: npm run test:smoke').join());
  t('les tutos : une seule étape, dans le job « tutos »', fois('run: npm run test:tutos') === 1 && ou('run: npm run test:tutos').join() === 'tutos', ou('run: npm run test:tutos').join());
  const tut = J.tutos || '';
  const mm = /^\s*part:\s*\[([^\]]*)\]\s*$/m.exec(tut);
  const parts = mm ? mm[1].split(',').map((x) => x.trim()).filter(Boolean).map(Number) : [];
  t('… en matrice 1..N, au moins deux machines (' + parts.join(', ') + ')', /^\s*matrix:\s*$/m.test(tut) && parts.length >= 2 && parts.every((x, i) => x === i + 1),
    mm ? mm[0].trim() : 'pas de « part: [...] » dans le job');
  t('… une partie rouge n’arrête pas les autres (fail-fast: false)', /^\s*fail-fast:\s*false\b/m.test(tut));
  t('… chaque machine joue SA partie, sur un total qui suit la matrice (strategy.job-total)',
    /run: npm run test:tutos -- --part \$\{\{ matrix\.part \}\}\/\$\{\{ strategy\.job-total \}\}\s*$/m.test(tut));
  t('le gabarit puis l’expérience d’usage : une fois chacun, dans le job « mesures »',
    fois('run: npm run test:gabarit') === 1 && fois('run: npm run test:ux') === 1 && ou('run: npm run test:gabarit').join() === 'mesures'
    && ou('run: npm run test:ux').join() === 'mesures' && J.mesures.indexOf('run: npm run test:gabarit') < J.mesures.indexOf('run: npm run test:ux'));
  const manques = [];
  for (const cmd of ['test:smoke', 'test:tutos', 'test:gabarit', 'test:ux']) for (const id of ou('run: npm run ' + cmd)) {
    const b = J[id], iT = b.indexOf('run: npm run ' + cmd);
    for (const avant of ['run: npm ci', 'run: npm run build --ignore-scripts', 'run: npx playwright install --with-deps chromium']) {
      const i = b.indexOf(avant);
      if (i < 0 || i > iT) manques.push(id + ' › ' + cmd + ' sans « ' + avant + ' » avant');
    }
  }
  t('chaque job qui joue un navigateur a son npm ci, son build (--ignore-scripts) et son Chromium, avant', manques.length === 0, manques.join(' · '));
  const attente = ids.filter((id) => /^ {4}needs:/m.test(J[id]));
  t('aucun job n’en attend un autre (needs) : tout démarre ensemble', attente.length === 0, attente.join(', '));
  const sansLimite = ids.filter((id) => !/^ {4}timeout-minutes:\s*\d+\s*$/m.test(J[id]));
  t('chaque job a sa limite (timeout-minutes)', sansLimite.length === 0, sansLimite.join(', '));

  /* ══ 4. BRANCHÉ ══ */
  t('la liste joue ce harnais et sa contre-épreuve', S.liste.includes("['node scripts/mv-harnais-ci1.mjs']") && S.liste.includes("['node scripts/mv-harnais-ci1.mjs --contre']"));
  return L;
}

// Un défaut posé dans UN job : on coupe le texte à l'en-tête du job, et on remplace la première occurrence qui suit.
const dansJob = (job, de, vers) => (S) => {
  const i = S.ci.indexOf('\n  ' + job + ':\n');
  if (i < 0) return S;
  const a = S.ci.slice(0, i), b = S.ci.slice(i);
  return b.includes(de) ? { ...S, ci: a + b.replace(de, vers) } : S;
};
const m = (k, de, vers) => (S) => (S[k].includes(de) ? { ...S, [k]: S[k].replace(de, vers) } : S);
const DEFAUTS = [
  ['les tutos reviennent dans le job des contrôles', m('ci', '        run: npm run test:smoke\n', '        run: npm run test:smoke\n\n      - name: Tutos\n        run: npm run test:tutos\n')],
  ['le gabarit revient dans le job des contrôles', m('ci', '        run: npm run test:smoke\n', '        run: npm run test:smoke\n\n      - name: Gabarit\n        run: npm run test:gabarit\n')],
  ['la matrice perd sa seconde machine', m('ci', 'part: [1, 2]', 'part: [1]')],
  ['une machine en double', m('ci', 'part: [1, 2]', 'part: [1, 1]')],
  ['le total écrit à la main, et faux', m('ci', '/${{ strategy.job-total }}', '/3')],
  ['une partie rouge arrête l’autre', m('ci', 'fail-fast: false', 'fail-fast: true')],
  ['les tutos attendent les contrôles', m('ci', '\n  tutos:\n    name:', '\n  tutos:\n    needs: controles\n    name:')],
  ['le job des mesures perd son build', dansJob('mesures', '      - name: Build\n        run: npm run build --ignore-scripts\n', '')],
  ['les tutos perdent leur Chromium', dansJob('tutos', '        run: npx playwright install --with-deps chromium\n', '        run: echo rien\n')],
  ['le build des tutos relance toute la liste (prebuild)', dansJob('tutos', 'run: npm run build --ignore-scripts', 'run: npm run build')],
  ['le job des mesures perd sa limite', dansJob('mesures', '    timeout-minutes: 15\n', '')],
  ['le calcul des parties oublie des rangs', m('partie', 'i % p.n === p.k - 1', 'i % p.n === p.k')],
  ['une partie au-delà du total est acceptée', m('partie', 'Number(m[1]) > Number(m[2])', 'false')],
  ['deux « dernières » parties', m('partie', 'p.k === p.n', 'p.k >= p.n - 1')],
  ['une option mal formée ne s’arrête plus', m('jeu', 'if (PART.erreur) {', 'if (false) {')],
  ['la liste n’est plus lue dans l’appli', m('jeu', 'if (!liste) liste = await lireListe(navigateur, base);', "if (!liste) liste = ['equipes'];")],
  ['la liste n’est plus réduite à la partie', m('jeu', 'liste = maPartie(liste, PART);', 'liste = liste.slice();')],
  ['l’ensemble se joue sur chaque partie', m('jeu', 'if (derniere(PART)) {', 'if (true) {')],
  //   (deux lignes commencent par « if (PART.n > 1) console.log( » : l'ancre vise celle du rapport, pas celle qui annonce la partie)
  ['une partie écrit le rapport', m('jeu', "if (PART.n > 1) console.log(c.dim('  partie ' + PART.k + '/' + PART.n + ' : pas de rapport", "if (false) console.log(c.dim('  partie ' + PART.k + '/' + PART.n + ' : pas de rapport")],
  ['la liste ne joue plus ce harnais', m('liste', "['node scripts/mv-harnais-ci1.mjs']", "['node scripts/mv-harnais-ciY.mjs']")],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  let L = [];
  try { L = await jouer(SAIN); } catch (e) { L.push({ nom: 'plantage : ' + (e && e.stack || e), ok: false, detail: '' }); }
  console.log('\nCI-1 — la CI en six jobs qui démarrent ensemble ; les tutos en parties, un par un');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  let mordus = 0;
  console.log('\nCI-1 — contre-épreuves');
  for (const [nom, f] of DEFAUTS) {
    const S = f(SAIN);
    const injecte = Object.keys(S).some((k) => S[k] !== SAIN[k]);
    let ko = 0;
    if (injecte) { try { ko = (await jouer(S)).filter((x) => !x.ok).length; } catch (e) { ko = 1; } }
    const ok = injecte && ko > 0;
    if (ok) mordus++;
    console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + nom + (injecte ? (ok ? c.d('  (' + ko + ' rouge(s))') : c.r('  → rien n’a rougi')) : c.r('  → défaut non injecté (ancre introuvable)')));
  }
  console.log('\n  ' + mordus + '/' + DEFAUTS.length + ' contre-épreuves mordent\n');
  process.exit(mordus === DEFAUTS.length ? 0 : 1);
}
