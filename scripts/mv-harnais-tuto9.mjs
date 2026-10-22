// HARNAIS — TUTO-9 (§423) : le tuto « corriger l'équipe d'une validation » et ce qui garde les tutos à jour.
//   node scripts/mv-harnais-tuto9.mjs           → doit être vert
//   node scripts/mv-harnais-tuto9.mjs --contre  → chaque défaut réinjecté doit rougir
// Le tuto lui-même est rejoué pour de vrai par scripts/mv-tutos-jeu.mjs (npm run test:tutos, après le build). Ici :
//   1. le domaine fictif a un Journal (le tuto vise le bouton « Équipe » d'une validation : sans validation, rien à toucher),
//      joué pour de vrai (_tuJour, _tuJournal) ;
//   2. l'étape « Enregistrer » ne se croit pas faite avant d'ouvrir la fenêtre (_jeqCorrigee jouée pour de vrai) ;
//   3. test:tutos joue chaque tuto sur chaque écran sous son vrai nom, et compte ;
//   4. la marque d'un lot qui touche l'appli exige des tutos rejoués au vert sur ses fichiers (empreinte jouée pour de vrai).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { tutos: fs.readFileSync('src/tutos.js', 'utf8'), app: fs.readFileSync('src/app.js', 'utf8'), html: fs.readFileSync('index.html', 'utf8'),
  jeu: fs.readFileSync('scripts/mv-tutos-jeu.mjs', 'utf8'), marque: fs.readFileSync('scripts/mv-lot-marque.mjs', 'utf8'),
  emp: fs.readFileSync('scripts/mv-tutos-empreinte.mjs', 'utf8') };
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const sansCommentaires = (s) => s.replace(/^\s*\/\/.*$/gm, '');   // §34g : on lit le code, pas ce qu'on en raconte

async function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  const tu = sansCommentaires(S.tutos);
  /* ══ 1. LE JOURNAL DU DOMAINE FICTIF ══ */
  let donnees = null;
  try { const i = tu.indexOf('var TU_DONNEES = '); donnees = JSON.parse(tu.slice(i + 17, tu.indexOf('\n', i)).replace(/;\s*$/, '')); } catch (e) { donnees = null; }
  t('le domaine fictif se lit', !!donnees);
  t('_charger pose le Journal du domaine fictif', /applyFbData\('journal', _tuJournal\(\)\)/.test(fn(tu, '_charger')));
  let J = [];
  try {
    const ctx = { Date };
    vm.createContext(ctx);
    vm.runInContext(fn(tu, '_tuJour') + '\n' + fn(tu, '_tuJournal') + '\nthis.J = _tuJournal();', ctx);
    J = Array.isArray(ctx.J) ? ctx.J : [];
  } catch (e) { t('_tuJournal se joue', false, e.message); }
  t('au moins une validation', J.length >= 1, String(J.length));
  const noms = (k) => ((donnees && donnees[k]) || []).map((x) => x.nom);
  const auj = new Date(), iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const il7 = new Date(auj); il7.setDate(il7.getDate() - 7);
  t('chaque entrée : validée, une parcelle, une tâche et une personne du domaine fictif',
    J.length && J.every((e) => e.statut === 'Validé' && noms('parcelles').includes(e.parcelle) && noms('taches').includes(e.tache) && noms('membres').includes(e.qui)),
    JSON.stringify(J.map((e) => [e.statut, e.parcelle, e.tache, e.qui])));
  t('des dates CALCULÉES : les sept derniers jours, jamais une date en dur qui vieillit', J.length && J.every((e) => e.date >= iso(il7) && e.date <= iso(auj)), J.map((e) => e.date).join(','));
  const p = J[0] || {};
  t('la première validation est celle à corriger : ni Jean ni Sophie dedans', p.qui && !['Jean', 'Sophie'].includes(p.qui) && !(p.membresEquipe || []).some((n) => n === 'Jean' || n === 'Sophie'), JSON.stringify(p));
  t('le bouton visé existe sur la vraie ligne du Journal, et « Enregistrer » dans la vraie fenêtre',
    /data-tuto="journal\.equipe"/.test(fn(S.app, '_jEqBtn')) && /data-tuto="journal\.equipe\.ok"[^>]*onclick="saveJEquipe\(\)"/.test(S.html));
  /* ══ 2. L'ÉTAPE « ENREGISTRER » ══ */
  const i0 = tu.indexOf("{ id: 'jequipe'"), bloc = i0 < 0 ? '' : tu.slice(i0, tu.indexOf('\n    ] }', i0));
  t('le tuto note l’heure de son départ', /avant: function \(m\) \{ m\.jeq0 = new Date\(\)\.toISOString\(\); \}/.test(bloc));
  t('l’étape 3 exige la correction posée, pas seulement la fenêtre fermée', /fait: function \(memo\) \{ return !_ouvert\('ovJEquipe'\) && _jeqCorrigee\(memo\); \}/.test(bloc));
  try {
    const ctx = { window: { JOURNAL: J.map((e) => Object.assign({}, e)) }, String };
    vm.createContext(ctx);
    vm.runInContext(fn(tu, '_jeqCorrigee'), ctx);
    const t0 = '2026-10-22T08:00:00.000Z';
    const avant = vm.runInContext('_jeqCorrigee({ jeq0: "' + t0 + '" })', ctx);
    ctx.window.JOURNAL[0].eqCorr = { par: 'Marie', le: '2026-10-22T07:59:00.000Z' };
    const ancienne = vm.runInContext('_jeqCorrigee({ jeq0: "' + t0 + '" })', ctx);
    ctx.window.JOURNAL[0].eqCorr = { par: 'Marie', le: '2026-10-22T08:00:05.000Z' };
    const apres = vm.runInContext('_jeqCorrigee({ jeq0: "' + t0 + '" })', ctx), sans = vm.runInContext('_jeqCorrigee({})', ctx);
    t('au départ, rien n’est corrigé : l’étape 3 n’est pas faite (plus de saut d’étape)', avant === false, String(avant));
    t('une correction d’AVANT le tuto ne compte pas', ancienne === false, String(ancienne));
    t('une correction posée pendant le tuto fait l’étape', apres === true, String(apres));
    t('sans heure de départ, jamais faite', sans === false, String(sans));
  } catch (e) { t('_jeqCorrigee se joue', false, e.message); }
  // TUTO-9 : la zone d'un choix est une LISTE (le moteur la parcourt : _place, _verifie). Celle du Journal rendait un élément
  //   seul : « e.forEach is not a function » à l'étape 2, sur tous les écrans. Règle pour TOUS les tutos.
  const debut = tu.indexOf('var TU_TUTOS = ['), fin = tu.indexOf('\n];', debut), tous = debut < 0 ? '' : tu.slice(debut, fin);
  const zones = [...tous.matchAll(/zone: (function \(\w*\) \{[^\n]*?\}|_\w+),/g)].map((m) => m[1]);
  t('chaque zone de choix rend une liste (' + zones.length + ' zones lues)', zones.length >= 3 && zones.every((z) => /^_zone\w+$/.test(z) ? /return \[|return nom \?/.test(fn(tu, z)) : /return [^;]*\[/.test(z)), zones.join(' | '));
  /* ══ 3. TEST:TUTOS JOUE TOUT, SOUS LE BON NOM ══ */
  const jeu = sansCommentaires(S.jeu);
  t('chaque ligne porte le tuto JOUÉ', jeu.includes("const lib = ecran.nom + ' · ' + id + ' · '") && !jeu.includes("ecran.nom + ' · ' + liste[i]"));
  t('la vraie liste est rejouée en entier, sans refaire ce qui est fait', /if \(faits\.has\(id\)\) continue;/.test(jeu) && /a = liste; i = -1;/.test(jeu));
  t('on compte : un tuto non joué est un rouge', /joues\[ecran\.nom\] !== liste\.length\) \{ rouges\+\+;/.test(jeu));
  t('un build plus ancien que les sources est refusé', /sourcesPlusRecentes\('\.', join\(DIR, 'version\.json'\)\)/.test(jeu) && /if \(vieux\.length\) \{ console\.error\([^\n]*process\.exit\(2\); \}/.test(jeu));
  t('le rapport dit sur quelles sources les tutos ont été rejoués', /writeFileSync\('rapports\/tutos\.json'/.test(jeu) && /empreinte = empreinteSources\('\.'\)/.test(jeu));
  /* ══ 4. LA MARQUE D'UN LOT ══ */
  const mq = sansCommentaires(S.marque);
  t('la marque regarde si le lot touche l’appli', /if \(toucheAppli\(Object\.keys\(fichiers\)\)\)/.test(mq));
  t('sans rapport, rapport d’autres sources, ou rapport rouge : refus', (mq.match(/process\.exit\(4\)/g) || []).length === 4   /* TUTO-10 (§425) : + « le rapport ne couvre pas ce que le lot touche » */ && /rap\.empreinte !== emp/.test(mq) && /!rap\.ok/.test(mq));
  t('l’exception se décide et s’écrit dans la marque', /opt\('--sans-tutos'\)/.test(mq) && /tutos = \{ saute: raison \}/.test(mq) && /date: new Date\(\)\.toISOString\(\)\.slice\(0, 10\), tutos, fichiers/.test(mq));
  try {
    const M = await import('data:text/javascript;base64,' + Buffer.from(S.emp).toString('base64'));
    t('un lot de code touche l’appli', M.toucheAppli(['docs/claude/x.md', 'src/tutos.js']) === true && M.toucheAppli(['index.html']) === true && M.toucheAppli(['public/sw.js']) === true);
    t('un lot de documentation seule ne la touche pas', M.toucheAppli(['CLAUDE.md', 'docs/claude/INDEX.md', 'guide/01-demarrer.html', 'scripts/x.mjs']) === false);
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tuto9-'));
    try {
      fs.mkdirSync(path.join(d, 'src')); fs.writeFileSync(path.join(d, 'index.html'), '<p>a</p>'); fs.writeFileSync(path.join(d, 'src', 'a.js'), 'var a = 1;');
      fs.writeFileSync(path.join(d, 'CLAUDE.md'), 'doc');
      const e1 = M.empreinteSources(d);
      fs.writeFileSync(path.join(d, 'CLAUDE.md'), 'doc changée');
      const e2 = M.empreinteSources(d);
      fs.writeFileSync(path.join(d, 'src', 'a.js'), 'var a = 2;');
      const e3 = M.empreinteSources(d);
      t('l’empreinte change avec une source de l’appli, pas avec la documentation', e1 === e2 && e2 !== e3, [e1.slice(0, 8), e2.slice(0, 8), e3.slice(0, 8)].join(' '));
      fs.mkdirSync(path.join(d, 'dist')); fs.writeFileSync(path.join(d, 'dist', 'version.json'), '{}');
      const passe = new Date(Date.now() - 60000); fs.utimesSync(path.join(d, 'dist', 'version.json'), passe, passe);
      t('une source modifiée après le build est vue', M.sourcesPlusRecentes(d, path.join(d, 'dist', 'version.json')).length >= 1);
      t('sans build, le refus est dit', M.sourcesPlusRecentes(d, path.join(d, 'absent.json')).length === 1);
    } finally { fs.rmSync(d, { recursive: true, force: true }); }
  } catch (e) { t('l’empreinte se joue', false, e.message); }
  return L;
}

const DEFAUTS = [
  ['le domaine fictif retrouve un Journal vide', (S) => ({ ...S, tutos: S.tutos.replace("  if (typeof window.applyFbData === 'function') { try { window.applyFbData('journal', _tuJournal()); } catch (e) { _avale(e, '_charger#journal'); } }   // TUTO-9\n", '') })],
  ['la validation à corriger est déjà faite par Jean', (S) => ({ ...S, tutos: S.tutos.replace("v(1, -1, 'Les Charmes', 'Relevage', 'Paul', [])", "v(1, -1, 'Les Charmes', 'Relevage', 'Jean', [])") })],
  ['une date écrite en dur revient', (S) => ({ ...S, tutos: S.tutos.replace("v(3, -2, 'Vieilles Vignes'", "v(3, -400, 'Vieilles Vignes'") })],
  ['la zone du Journal redevient un élément seul', (S) => ({ ...S, tutos: S.tutos.replace("zone: function () { var z = _q('#jeq-pick'); return z ? [z] : []; },", "zone: function () { return _q('#jeq-pick'); },") })],
  ['l’étape 3 redevient « fenêtre fermée »', (S) => ({ ...S, tutos: S.tutos.replace("fait: function (memo) { return !_ouvert('ovJEquipe') && _jeqCorrigee(memo); },", "fait: function () { return !_ouvert('ovJEquipe'); },") })],
  ['une correction d’avant le tuto compte', (S) => ({ ...S, tutos: S.tutos.replace("String(x.eqCorr.le || '') >= t0", "String(x.eqCorr.le || '') !== ''") })],
  ['test:tutos affiche de nouveau un tuto sous le nom d’un autre', (S) => ({ ...S, jeu: S.jeu.replace("const lib = ecran.nom + ' · ' + id + ' · '", "const lib = ecran.nom + ' · ' + liste[i] + ' · '") })],
  ['plus de compte des tutos joués', (S) => ({ ...S, jeu: S.jeu.replace('if (joues[ecran.nom] !== liste.length) { rouges++;', 'if (false) {') })],
  ['un build périmé passe', (S) => ({ ...S, jeu: S.jeu.replace("if (vieux.length) { console.error(", "if (false) { console.error(") })],
  ['la marque ne regarde plus les tutos', (S) => ({ ...S, marque: S.marque.replace('if (toucheAppli(Object.keys(fichiers))) {', 'if (false) {') })],
  ['la marque accepte un rapport d’autres sources', (S) => ({ ...S, marque: S.marque.replace('if (rap.empreinte !== emp) {', 'if (false) {') })],
  ['la documentation entre dans l’empreinte', (S) => ({ ...S, emp: S.emp.replace("export const SOURCES = ['index.html', 'vite.config.js', 'src', 'public/boot.js', 'public/sw.js'];", "export const SOURCES = ['index.html', 'vite.config.js', 'src', 'public/boot.js', 'public/sw.js', 'CLAUDE.md'];") })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = await jouer(SAIN);
  console.log('\nTUTO-9 — le tuto du Journal va au bout, et les tutos suivent chaque changement');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  let mordus = 0;
  console.log('\nTUTO-9 — contre-épreuves');
  for (const [nom, f] of DEFAUTS) {
    const S = f(SAIN);
    const injecte = Object.keys(S).some((k) => S[k] !== SAIN[k]);
    const ko = injecte ? (await jouer(S)).filter((x) => !x.ok).length : 0;
    const ok = injecte && ko > 0;
    if (ok) mordus++;
    console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + nom + (injecte ? (ok ? c.d('  (' + ko + ' rouge(s))') : c.r('  → rien n’a rougi')) : c.r('  → défaut non injecté (ancre introuvable)')));
  }
  console.log('\n  ' + mordus + '/' + DEFAUTS.length + ' contre-épreuves mordent\n');
  process.exit(mordus === DEFAUTS.length ? 0 : 1);
}
