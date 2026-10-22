// HARNAIS — TUTO-10 (§425) : l'aiguillage — quels tutos un changement concerne, et ce qui ne rejoue que ceux-là.
//   node scripts/mv-harnais-tuto10.mjs           → doit être vert
//   node scripts/mv-harnais-tuto10.mjs --contre  → chaque défaut réinjecté doit rougir
// L'aiguillage (scripts/mv-tutos-concernes.mjs) est JOUÉ sur les vrais fichiers du dépôt (« avant ») et sur des copies
// changées à la main (« après ») : une fonction enseignée, un bouton visé, le moteur, le domaine d'entraînement, le dock,
// une feuille de styles, un commentaire, une fonction sans rapport. Puis : test:tutos --concernes ne rejoue que la liste, et
// la marque d'un lot exige que le rapport la couvre.
import fs from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(f, 'utf8');
const SAIN = { aig: lire('scripts/mv-tutos-concernes.mjs'), jeu: lire('scripts/mv-tutos-jeu.mjs'), marque: lire('scripts/mv-lot-marque.mjs') };
const VRAI = {};
['src/tutos.js', 'src/app.js', 'src/cuvier.js', 'src/coquille.js', 'src/styles.css', 'index.html', 'public/boot.js'].forEach((f) => { VRAI[f] = lire(f); });
const sansCommentaires = (s) => s.replace(/^\s*\/\/.*$/gm, '');
// Une copie « après » : on remplace UNE fois une ancre du vrai fichier (sinon le scénario ne prouve rien : rouge).
function apres(f, ancre, neuf) {
  const s = VRAI[f];
  if (s.split(ancre).length !== 2) throw new Error('ancre introuvable ou multiple dans ' + f + ' : ' + ancre.slice(0, 40));
  return s.replace(ancre, neuf);
}
const SCENARIOS = [
  ['rien changé : rien à rejouer', {}, (r) => !r.tous && !r.cote && r.ids.length === 0],
  ['une fonction enseignée change (openJEquipe) : son tuto seul', { 'src/app.js': ['function openJEquipe(id){\n', 'function openJEquipe(id){\n  var __t10 = 1;\n'] }, (r) => !r.tous && r.ids.join() === 'jequipe'],
  ['un commentaire seul ne fait rien rejouer', { 'src/app.js': ['function openJEquipe(id){\n', 'function openJEquipe(id){\n  // un mot de plus, rien d’autre\n'] }, (r) => !r.tous && r.ids.length === 0],
  ['la fonction qui dessine un bouton visé change (_jEqBtn) : son tuto', { 'src/app.js': ['function _jEqBtn(r){\n', 'function _jEqBtn(r){\n  var __t10 = 2;\n'] }, (r) => !r.tous && r.ids.join() === 'jequipe'],
  ['la ligne d’index.html d’un bouton visé change : son tuto', { 'index.html': ['data-tuto="journal.equipe.ok" onclick="saveJEquipe()">', 'data-tuto="journal.equipe.ok" onclick="saveJEquipe()" title="x">'] }, (r) => !r.tous && r.ids.join() === 'jequipe'],
  ['une fonction enseignée du Cuvier change (_matSaisie) : le tuto des maturités', { 'src/cuvier.js': ['function _matSaisie(focus){\n', 'function _matSaisie(focus){\n  var __t10 = 3;\n'] }, (r) => !r.tous && r.ids.join() === 'maturites'],
  ['une fonction sans rapport change (setJQui) : rien', { 'src/app.js': ['function setJQui(v,el){jQui=v;', 'function setJQui(v,el){jQui=v;var __t10=4;'] }, (r) => !r.tous && r.ids.length === 0],
  ['le moteur change (_boucle) : TOUS', { 'src/tutos.js': ['function _boucle() {\n', 'function _boucle() {\n  var __t10 = 5;\n'] }, (r) => r.tous && r.ids.length === r.total && r.total >= 4 && r.cote],
  ['le domaine d’entraînement change (_tuJournal) : TOUS', { 'src/tutos.js': ["v(1, -1, 'Les Charmes', 'Relevage', 'Paul', [])", "v(1, -1, 'Les Charmes', 'Relevage', 'Marie', [])"] }, (r) => r.tous],
  ['la fiche d’un tuto change : ce tuto', { 'src/tutos.js': ["duree: '1 min', depart: 'journal'", "duree: '2 min', depart: 'journal'"] }, (r) => !r.tous && r.ids.join() === 'jequipe'],
  ['un tuto neuf : lui', { 'src/tutos.js': ['\n];\n', "\n  { id: 'neuf', titre: 'Comment faire pour essayer ?', fin: 'essayer', module: 'Vigne', pages: ['home'], couvre: [], etapes: [] },\n];\n"] }, (r) => !r.tous && r.ids.join() === 'neuf' && /nouveau/.test((r.raisons.neuf || []).join())],
  ['une feuille de styles change : le côte à côte, aucun tuto', { 'src/styles.css': ['.mat-tete{', '.zz-t10{color:red}\n.mat-tete{'] }, (r) => !r.tous && r.cote && r.ids.length === 0],
  ['le bac à sable change (boot.js) : TOUS', { 'public/boot.js': ['__MV_BOOT_TUTO_V', '__MV_BOOT_TUTO_V/*t10*/ && true, __MV_BOOT_TUTO_V'] }, (r) => r.tous],
  ['le chemin vers les modules change (_dockDef) : TOUS', { 'src/app.js': ['function _dockDef(){\n', 'function _dockDef(){\n  var __t10 = 6;\n'] }, (r) => r.tous],
];

async function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  let A = null;
  try { A = await import('data:text/javascript;base64,' + Buffer.from(S.aig).toString('base64') + '#' + Math.random()); } catch (e) { t('l’aiguillage se charge', false, e.message); return L; }
  for (const [nom, changes, attendu] of SCENARIOS) {
    try {
      const ap = {};
      Object.keys(changes).forEach((f) => { ap[f] = apres(f, changes[f][0], changes[f][1]); });
      const r = A.concernes({ fichiers: Object.keys(changes), avant: (f) => (VRAI[f] === undefined ? null : VRAI[f]), apres: (f) => (ap[f] !== undefined ? ap[f] : (VRAI[f] === undefined ? null : VRAI[f])) });
      t(nom, attendu(r), JSON.stringify({ tous: r.tous, cote: r.cote, ids: r.ids, raisons: r.raisons }));
    } catch (e) { t(nom, false, e.message); }
  }
  const jeu = sansCommentaires(S.jeu), mq = sansCommentaires(S.marque);
  t('test:tutos --concernes ne rejoue que la liste de l’aiguillage', /let liste = \(aig && !aig\.tous\) \? aig\.ids\.slice\(\) : null, rouges = 0;/.test(jeu) && /const aig = process\.argv\.includes\('--concernes'\) \? depuisGit\(/.test(jeu));
  t('… le côte à côte si sa mise en page est touchée, le bac à sable si tout l’est', /for \(const \[l, h\] of \(\(!aig \|\| aig\.cote\) \?/.test(jeu) && /if \(!aig \|\| aig\.tous\) \{/.test(jeu));
  t('… et sans l’option (la CI), TOUT, comme avant', /mode: \(!aig \|\| aig\.tous\) \? 'tous' : 'concernes', cote: !aig \|\| aig\.cote/.test(jeu));
  t('la marque recalcule la liste du lot', /const aig = depuisGit\('HEAD', R\);/.test(mq));
  t('aucun tuto concerné : rien à rejouer, rien à attendre', /if \(!aig\.tous && !aig\.ids\.length && !aig\.cote\) tutos = \{ concernes: \[\]/.test(mq));
  t('sinon le rapport doit couvrir la liste (tous si tout est concerné)', /aig\.ids\.filter\(\(id\) => !\(rap\.tutos \|\| \[\]\)\.includes\(id\)\)/.test(mq) && /if \(manque\.length\) \{ console\.error\([^\n]*process\.exit\(4\); \}/.test(mq));
  return L;
}

const DEFAUTS = [
  ['les fonctions enseignées ne comptent plus', (S) => ({ ...S, aig: S.aig.replace("    t.couvre.forEach((n) => { if (modifiees.has(n)) ajoute(id, n + ' a changé'); });\n", '') })],
  ['un commentaire fait rejouer', (S) => ({ ...S, aig: S.aig.replace("const norm = (s) => (s == null ? null : blanc(String(s)).replace(/\\s+/g, ' ').trim());", "const norm = (s) => (s == null ? null : String(s).replace(/\\s+/g, ' ').trim());") })],
  ['le moteur ne fait plus tout rejouer', (S) => ({ ...S, aig: S.aig.replace("if (norm(T0.horsListe) !== norm(T1.horsListe)) tous(", "if (false) tous(") })],
  ['les boutons visés ne comptent plus', (S) => ({ ...S, aig: S.aig.replace('    t.etiquettes.forEach((e) => {', '    [].forEach((e) => {') })],
  ['les feuilles de styles ne font plus rejouer le côte à côte', (S) => ({ ...S, aig: S.aig.replace("export const COTE_FICHIERS = ['src/coquille.js', 'src/styles.css', 'src/charte.css'];", 'export const COTE_FICHIERS = [];') })],
  ['le dock ne fait plus tout rejouer', (S) => ({ ...S, aig: S.aig.replace("export const TOUS_FONCTIONS = ['_dockDef',", "export const TOUS_FONCTIONS = ['_rien',") })],
  ['un tuto neuf passe inaperçu', (S) => ({ ...S, aig: S.aig.replace("if (!a) ajoute(id, 'tuto nouveau'); else ", '') })],
  ['test:tutos --concernes rejoue tout', (S) => ({ ...S, jeu: S.jeu.replace('let liste = (aig && !aig.tous) ? aig.ids.slice() : null, rouges = 0;', 'let liste = null, rouges = 0;') })],
  ['la marque ne regarde plus la couverture', (S) => ({ ...S, marque: S.marque.replace('if (manque.length) {', 'if (false) {') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = await jouer(SAIN);
  console.log('\nTUTO-10 — l’aiguillage : seulement les tutos que le changement touche');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  let mordus = 0;
  console.log('\nTUTO-10 — contre-épreuves');
  for (const [nom, f] of DEFAUTS) {
    const S = f(SAIN), injecte = Object.keys(S).some((k) => S[k] !== SAIN[k]);
    const ko = injecte ? (await jouer(S)).filter((x) => !x.ok).length : 0, ok = injecte && ko > 0;
    if (ok) mordus++;
    console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + nom + (injecte ? (ok ? c.d('  (' + ko + ' rouge(s))') : c.r('  → rien n’a rougi')) : c.r('  → défaut non injecté (ancre introuvable)')));
  }
  console.log('\n  ' + mordus + '/' + DEFAUTS.length + ' contre-épreuves mordent\n');
  process.exit(mordus === DEFAUTS.length ? 0 : 1);
}
