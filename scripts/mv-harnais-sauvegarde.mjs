/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA SAUVEGARDE COMPLETE ET SA RESTAURATION (lot SAUV-1)
   Lancer : node scripts/mv-harnais-sauvegarde.mjs
            node scripts/mv-harnais-sauvegarde.mjs --contre

   Ce qu'il interdit :
     A. qu'une cle de COLLECTIONS sorte de la sauvegarde — c'est le defaut
        d'origine : 8 documents sur 26 sous une etiquette « complete » ;
     B. qu'une SECONDE liste de cles reapparaisse a la main dans l'export.
        C'est la cause racine, pas le symptome : une liste ecrite a cote de
        COLLECTIONS se perime au premier lot qui ajoute une collection, et
        elle se perime EN SILENCE ;
     C. que la fiche membre reparte tronquee ({nom,roles,statut}) — l'export
        le faisait, et l'import REECRIVAIT la fiche avec ca : la restauration
        detruisait l'historique des contrats ;
     D. que la restauration repasse par fbSave — `parcelles` y part en fusion
        3-way (une restauration qui fusionne garde ce qu'on voulait effacer)
        et la garde anti-ecrasement refuserait une collection divisee par
        deux, ce qu'une restauration legitime peut avoir a faire ;
     E. que `_baseParcelles` reste sur l'etat d'AVANT — la premiere ecriture
        de parcelle qui suit ferait remonter ce qu'on vient d'effacer ;
     F. qu'une collection neuve arrive sans nom en clair : l'ecran de
        restauration afficherait « planning_hsup : 0 -> 41 » a un vigneron.

   ⚠️ §34g : on lit le CODE, jamais les commentaires. Et pour tout ce qui peut
      s'executer, ON EXECUTE — _mvSauvLire est extrait du vrai reglages.js et
      lance, pas relu.
   ⚠️ §25.2 : la contre-epreuve injecte EN MEMOIRE, jamais sur disque, et
      compte les defauts reellement appliques (garde d'injection).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const R = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');

const CONTRE = process.argv.includes('--contre');

/* Le blanchiment du preflight, a l'identique. Deux comptages qui divergent,
   c'est une dispute de chiffres tous les six mois. */
function blank(c) {
  c = c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  c = c.replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return c;
}

let FB   = R('src/firebase.js');
let REGL = R('src/reglages.js');

/* ── Injections de la contre-epreuve : EN MEMOIRE, avec garde ────────────── */
const INJECTIONS = [
  { nom: 'export : liste de cles ecrite a la main',
    cible: 'REGL',
    de: 'var attendues = (window.MV_COLLECTIONS||[]).slice();',
    vers: "var attendues = ['parcelles','journal','sessions','membres'];" },
  { nom: 'export : fiche membre tronquee',
    cible: 'REGL',
    de: '    donnees: r.data',
    vers: '    donnees: Object.assign({}, r.data, {membres:(r.data.membres||[]).map(m=>({nom:m.nom,roles:m.roles,statut:m.statut}))})' },
  { nom: 'restauration : repasse par fbSave',
    cible: 'FB',
    de: '    return setDoc(fbDocRef(key), { value: _fbClone(key, val) });',
    vers: '    return window.fbSave(key, val);' },
  { nom: 'restauration : base de fusion laissee sur l\'etat d\'avant',
    cible: 'FB',
    de: '    _baseParcelles = deepClone(donnees.parcelles);',
    vers: '    void 0;' },
  { nom: 'lecture : une cle sautee',
    cible: 'FB',
    de: '  var lectures = COLLECTIONS.map(function (key) {',
    vers: '  var lectures = COLLECTIONS.slice(0, 8).map(function (key) {' },
  { nom: 'un nom en clair retire',
    cible: 'REGL',
    de: "  planning_hsup:'Heures supplémentaires',",
    vers: '' },
];

let injectes = 0;
if (CONTRE) {
  for (const inj of INJECTIONS) {
    const src = inj.cible === 'FB' ? FB : REGL;
    if (!src.includes(inj.de)) {
      console.error('  \x1b[31m!! INJECTION MORTE\x1b[0m — ' + inj.nom + ' : le motif ne matche pas');
      continue;
    }
    if (inj.cible === 'FB') FB = FB.replace(inj.de, inj.vers);
    else                    REGL = REGL.replace(inj.de, inj.vers);
    injectes++;
  }
  /* ⚠️ Une contre-epreuve dont la condition est « il reste des rouges » ne
     prouve rien si les rouges viennent d'ailleurs. On exige que TOUS les
     defauts soient reellement entres. */
  if (injectes !== INJECTIONS.length) {
    console.error('\n  \x1b[31m✗ GARDE D\'INJECTION : ' + injectes + '/' + INJECTIONS.length
      + ' defauts appliques — la contre-epreuve ne prouve rien.\x1b[0m\n');
    process.exit(1);
  }
}

const FBNU   = blank(FB);
const REGLNU = blank(REGL);

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

console.log('\n── LA SAUVEGARDE COMPLETE — lot SAUV-1\n');

/* ── 1. La liste des collections, une seule fois ─────────────────────────── */
const iC = FB.indexOf('const COLLECTIONS = [');
const jC = FB.indexOf('];', iC) + 2;
const blocC = FB.slice(iC, jC) + '\nexport { COLLECTIONS };\n';
const { COLLECTIONS } = await import('data:text/javascript;base64,'
  + Buffer.from(blocC, 'utf8').toString('base64'));

t('COLLECTIONS s\'execute et n\'est pas vide', Array.isArray(COLLECTIONS) && COLLECTIONS.length >= 20,
  'lu : ' + (COLLECTIONS || []).length);
t('window.MV_COLLECTIONS derive de COLLECTIONS',
  /window\.MV_COLLECTIONS\s*=\s*COLLECTIONS\.slice\(\)/.test(FBNU),
  'une liste recopiee a la main se perimerait au prochain lot');
t('window._mvTailleDoc est expose (l\'ecran compte comme la garde)',
  /window\._mvTailleDoc\s*=\s*function/.test(FBNU) && /_mvDocSize\(key,\s*val\)/.test(FBNU));

/* ── 2. La lecture couvre tout ───────────────────────────────────────────── */
const corps = (src, marque) => {
  const i = src.indexOf(marque); if (i < 0) return '';
  let d = 0, k = src.indexOf('{', i);
  for (let x = k; x < src.length; x++) {
    if (src[x] === '{') d++;
    else if (src[x] === '}') { d--; if (!d) return src.slice(i, x + 1); }
  }
  return '';
};
const lireTout = corps(FBNU, 'window.fbLireTout = async function');
t('fbLireTout existe', lireTout.length > 0);
t('fbLireTout balaie COLLECTIONS en entier',
  /COLLECTIONS\.map\(/.test(lireTout) && !/COLLECTIONS\.slice\(0/.test(lireTout),
  'toute restriction de la liste rend une sauvegarde incomplete sans le dire');
t('fbLireTout porte un catch PAR CLE (un refus n\'annule pas les 25 autres)',
  /getDoc\(fbDocRef\(key\)\)\.then\([\s\S]{0,200}function \(e\)/.test(lireTout));
t('fbLireTout distingue « jamais cree » de « en erreur »',
  /manquants/.test(lireTout) && /erreurs/.test(lireTout));
t('un document sans champ `value` n\'est pas compte comme present',
  /v === undefined[\s\S]{0,80}manquants\.push/.test(lireTout));

/* ── 3. La restauration ──────────────────────────────────────────────────── */
const restTout = corps(FBNU, 'window.fbRestaurerTout = async function');
t('fbRestaurerTout existe', restTout.length > 0);
t('fbRestaurerTout balaie COLLECTIONS', /COLLECTIONS\.length/.test(restTout));
const restUne = corps(FBNU, 'async function _mvRestaurerUne');
/* ⚠️ L'ECRITURE N'EST PAS DANS fbRestaurerTout, ELLE EST DANS _mvRestaurerUne.
   Une assertion qui ne regardait que la premiere serait restee verte pendant
   que la seconde repassait par fbSave — c'est le piege de l'injection qui ne
   touche pas l'assertion qu'elle croit tester (§123g). On couvre LES DEUX. */
t('ni fbRestaurerTout ni _mvRestaurerUne n\'appellent fbSave',
  !/fbSave\s*\(/.test(restTout) && !/fbSave\s*\(/.test(restUne),
  'fbSave fusionne les parcelles et applique la garde anti-ecrasement : ce n\'est plus une restauration');
t('l\'ecriture est un setDoc direct', /setDoc\(fbDocRef\(key\)/.test(restUne));
t('la base de fusion des parcelles est remise a l\'etat restaure',
  /_baseParcelles\s*=\s*deepClone\(donnees\.parcelles\)/.test(restTout),
  'sinon la premiere ecriture de parcelle fait remonter ce qu\'on vient d\'effacer');
t('la demo n\'ecrit rien, et le dit', /domaine-dupont/.test(restTout) && /rap\.demo\s*=\s*true/.test(restTout));
t('hors ligne, on refuse plutot que de mettre 26 docs en file',
  /navigator\.onLine/.test(restTout) && /horsligne\s*=\s*true/.test(restTout));
t('l\'application en memoire passe par applyFbData (chemin du pull)',
  /applyFbData\(k,\s*donnees\[k\]\)/.test(restTout),
  'reecrire les affectations ici, c\'est un second comportement a maintenir');

/* ── 4. L'export ─────────────────────────────────────────────────────────── */
const exp = corps(REGLNU, 'async function exportJSON()');
t('exportJSON existe et est asynchrone', exp.length > 0);
t('exportJSON lit le serveur (fbLireTout), pas la memoire',
  /window\.fbLireTout\(\)/.test(exp),
  'la memoire est partielle et transformee : un aller-retour ne rendrait pas le meme domaine');
t('exportJSON ne porte AUCUNE liste de cles ecrite a la main',
  /\(window\.MV_COLLECTIONS\|\|\[\]\)\.slice\(\)/.test(exp)
  && !/\['parcelles'\s*,/.test(exp)
  && !/parcelles\s*:\s*window\.PARCELLES/.test(exp),
  'c\'est la cause racine du defaut d\'origine');
t('exportJSON ne tronque plus la fiche membre',
  !/membres\s*:\s*[^,]*\.map\(/.test(exp),
  'l\'export tronquait a {nom,roles,statut} et l\'import reecrivait la fiche avec ca');
t('le fichier ecrit lui-meme ce qu\'il contient et ce qui manque',
  /cles_attendues/.test(exp) && /cles_presentes/.test(exp) && /cles_en_erreur/.test(exp));
t('une sauvegarde incomplete le dit dans son NOM de fichier',
  /_INCOMPLETE/.test(exp),
  'le silence de l\'ancien format est ce qui l\'a fait passer pour complet');

/* ── 5. L'import et l'ecran ──────────────────────────────────────────────── */
const imp = corps(REGLNU, 'function importJSON(input)');
t('importJSON n\'ecrit plus rien directement',
  !/window\.PARCELLES/.test(imp) && !/saveData/.test(imp),
  'il lit le fichier, puis l\'ecran de comparaison prend la main');
t('importJSON passe par l\'ecran de comparaison', /_docsRestOpen\(\)/.test(imp));
const rest = corps(REGLNU, 'async function _docsRestOpen()');
t('l\'ecran lit l\'etat actuel avant de comparer', /window\.fbLireTout\(\)/.test(rest));
t('l\'ecran nomme ce qui retrecit', /perte/.test(rest) && /ap\s*<\s*x?\.?av|nAp\s*<\s*nAv/.test(rest));
t('l\'ecran nomme ce a quoi on NE touche PAS', /intouchees/.test(rest));
t('le nom du fichier est echappe avant affichage',
  /_docsEsc\(_mvSauvEnCours\.nom\)/.test(rest),
  'un nom de fichier est une donnee hostile comme une autre');
const go = corps(REGLNU, 'window._docsRestGo = async function()');
t('la copie hors ligne est purgee avant le rechargement',
  /_mvPurgerSnapshot/.test(go) && /location\.reload\(\)/.test(go),
  'sinon un demarrage sans reseau relirait l\'etat d\'AVANT');
t('l\'avancement est recalcule quand le fichier ne le porte pas',
  /recalcAllTravaux\(\)/.test(go) && /absentes\.indexOf\('travaux'\)/.test(go),
  'un fichier ancien porte les parcelles sans l\'avancement qui en decoule');

/* ── 6. Les volets du hub ────────────────────────────────────────────────── */
const pane = corps(REGLNU, 'function _docsPane(id)');
t('_docsPane ne porte plus de liste de volets ecrite a la main',
  !/\['docs-pane-mois'/.test(pane) && /querySelectorAll/.test(pane),
  'la liste en dur avait deja un trou : docs-pane-plannom n\'y figurait pas');

/* ── 7. EXECUTION — la lecture d'un fichier ──────────────────────────────── */
const iS = REGL.indexOf("var MV_SAUV_FORMAT");
const iF = REGL.indexOf('function importJSON(input)');
const blocS = REGL.slice(iS, iF)
  + '\nexport { MV_SAUV_LEGACY, MV_SAUV_NOMS, _mvSauvLire, MV_SAUV_FORMAT };\n';
let M = null;
try {
  M = await import('data:text/javascript;base64,' + Buffer.from(blocS, 'utf8').toString('base64'));
} catch (e) {
  /* ⚠️ Le montage a rate : le dire, ne pas verdir sur du vide (§123g bis). */
  console.log('  \x1b[31m✗\x1b[0m le bloc sauvegarde ne se monte pas\n      → ' + e.message);
  ko++;
}

if (M) {
  t('l\'ancien format garde ses 8 cles exactement',
    M.MV_SAUV_LEGACY.length === 8 && M.MV_SAUV_LEGACY.indexOf('parcelles') === 0);

  const v2 = M._mvSauvLire({ meta: { format: M.MV_SAUV_FORMAT, version_format: 2 }, donnees: { parcelles: [1], paie: {} } });
  t('un fichier de format 2 est lu', !!v2 && !!v2.donnees.paie && v2.meta.version_format === 2);

  const v1 = M._mvSauvLire({ exportDate: '2026-01-01T00:00:00Z', version: '4.7', parcelles: [1, 2], journal: [], membres: [{ nom: 'A' }] });
  t('un fichier ancien est encore lu, et signale comme ancien', !!v1 && v1.meta.ancien === true);
  t('un fichier ancien ne ramene QUE ses 8 cles',
    !!v1 && Object.keys(v1.donnees).every(k => M.MV_SAUV_LEGACY.indexOf(k) >= 0));
  t('un fichier ancien n\'invente pas les cles absentes',
    !!v1 && !Object.prototype.hasOwnProperty.call(v1.donnees, 'cave_vendange'),
    'une cle a undefined ecraserait le document du serveur');

  t('un fichier quelconque est refuse', M._mvSauvLire({ hello: 1 }) === null
    && M._mvSauvLire(null) === null && M._mvSauvLire('texte') === null);

  /* ★★★ L'ASSERTION QUI NE SE PERIME PAS. Une collection ajoutee demain sans
     nom en clair ferait afficher « planning_hsup : 0 -> 41 » a un vigneron. */
  const sansNom = COLLECTIONS.filter(k => !M.MV_SAUV_NOMS[k]);
  t('les ' + COLLECTIONS.length + ' collections ont toutes un nom en clair',
    sansNom.length === 0, sansNom.join(', '));
}

/* ── Verdict ─────────────────────────────────────────────────────────────── */
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges'
  + (CONTRE ? '  (contre-epreuve : ' + injectes + '/' + INJECTIONS.length + ' defauts injectes)' : '') + '\n');

if (CONTRE) {
  if (ko === 0) {
    console.error('  \x1b[31m✗ CONTRE-EPREUVE : tout est vert avec ' + injectes
      + ' defauts en place — le harnais ne mord pas.\x1b[0m\n');
    process.exit(1);
  }
  console.log('  \x1b[32m✓ contre-epreuve : ' + ko + ' assertions rougissent sur '
    + injectes + ' defauts.\x1b[0m\n');
  process.exit(0);
}
process.exit(ko ? 1 : 0);
