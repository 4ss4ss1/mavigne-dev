// HARNAIS — COTE-1 (§424) : le panneau du tuto collé à droite, l'appli resserrée à côté ; le « + » des boutons d'ajout.
//   node scripts/mv-harnais-cote1.mjs           → doit être vert
//   node scripts/mv-harnais-cote1.mjs --contre  → chaque défaut réinjecté doit rougir
// La page elle-même est mesurée au navigateur par scripts/mv-tutos-jeu.mjs (npm run test:tutos : trois largeurs, le bouton
// touchable, l'anneau visible, rien sous le panneau). Ici :
//   1. le seuil et la feuille du panneau collé (_coteCss JOUÉE, pas lue par une expression : §24) ;
//   2. ★ L'INVENTAIRE : chaque couche fixe de la feuille posée sur toute la largeur (voile, barre, tiroir, message centré) est
//      rangée dans une liste COTE_* de tutos.js ou exemptée ICI, avec sa raison — une couche neuve rougit tant qu'on n'a pas
//      décidé ; et chaque entrée des listes existe encore quelque part ;
//   3. la barre latérale jugée sur la place qui reste (ouvert() de coquille.js JOUÉE) ;
//   4. le « + » : l'icône des trois points s'appelle « points », celle du « + » « ajout », et « plus » n'existe plus nulle part.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(f, 'utf8');
const SRC = ['src/app.js', 'src/cave.js', 'src/comptes.js', 'src/cuvier.js', 'src/tournees.js', 'src/utils.js', 'src/pilotage.js', 'src/reglages.js', 'src/tracteur.js', 'src/planning.js'];
const SAIN = { tutos: lire('src/tutos.js'), coq: lire('src/coquille.js'), css: lire('src/styles.css'), html: lire('index.html'), guide: lire('guide/05-saisons.html'),
  autres: SRC.filter((f) => fs.existsSync(f)).map(lire).join('\n') };
// Les couches fixes posées sur toute la largeur qui n'ont pas à suivre le panneau — chacune avec sa raison.
const EXEMPT = {
  '.qdn': 'QDN-1 (§497) : le grand panneau « La nouvelle Ma Vigne » — une fois à l’ouverture, ou depuis Réglages › Moi ; jamais pendant un tuto',
  'body.mvr-mvt-ouvert #page-reserve .mvr-mvt-voile': 'RSV-UX-1 (§495) : le voile de « Nouveau mouvement », au téléphone seulement',
  'body.mvr-mvt-ouvert #page-reserve .mvr-mvt': 'RSV-UX-1 (§495) : la feuille « Nouveau mouvement » de la Réserve, au téléphone seulement',
  '#page-tracteur .t-feuille': 'TRAC-UX-1A (§480) : la feuille des filtres du Tracteur, au téléphone seulement',
  'body.t-feuille-ouverte #page-tracteur .t-voile': 'TRAC-UX-1A (§480) : son voile, au téléphone seulement',
  '#page-tracteur .t-barre': 'TRAC-UX-1A (§480) : la barre basse du Tracteur (recherche, « Filtrer »), au téléphone seulement',
  '#page-parcelles .p-srow': 'FILTRE-1B (§477) : la barre basse de Parcelles (recherche, « Filtres »), au téléphone seulement',
  // ★ FILTRE-1A (§476) — au téléphone seulement (moins de 768 px) : jamais visibles à côté du panneau, qui s'ouvre à 1 280 px et plus.
  '#page-journal .j-feuille': 'FILTRE-1A (§476) : la feuille des filtres du Journal, au téléphone seulement',
  'body.j-feuille-ouverte #page-journal .j-voile': 'FILTRE-1A (§476) : son voile, au téléphone seulement',
  '#page-journal .j-barre': 'FILTRE-1A (§476) : la barre basse du Journal (recherche, « Filtrer »), au téléphone seulement',
  '#login-screen': 'écran de connexion : pas de tuto avant d’être connecté',
  '#onboarding-screen': 'assistant de démarrage : pas de tuto pendant',
  '#ob-toast': 'message de l’assistant de démarrage',
  '.agt-bottom-bar': 'console GT : pas de tuto',
  '#mv-dock': 'barre du bas : téléphone et tablette seulement (< 1 024 px)',
  '#mv-dock-sheet-bg': 'feuille « Plus » du téléphone',
  '#mv-dock-sheet': 'feuille « Plus » du téléphone',
  '.mvt-ov': 'visite guidée des prospects : pas de tuto pendant',
  '#mv-maj-rideau': 'rideau noir de mise à jour, juste avant le rechargement',
};
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
const sansCommentaires = (s) => s.replace(/^\s*\/\/.*$/gm, '');
const varLigne = (src, nom) => { const m = src.match(new RegExp('^var ' + nom + ' = [^\\n]*;$', 'm')); if (!m) throw new Error('var ' + nom + ' absente'); return m[0]; };

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  const tu = sansCommentaires(S.tutos);
  /* ══ 1. LE SEUIL ET LA FEUILLE ══ */
  let K = null, css = '';
  try {
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(['COTE_MQ', 'COTE_L', 'COTE_VOILES', 'COTE_DROITE', 'COTE_BARRES', 'COTE_CENTRES', 'COTE_BOUTONS'].map((n) => varLigne(tu, n)).join('\n') + '\n' + fn(tu, '_coteCss')
      + '\nthis.K = { mq: COTE_MQ, l: COTE_L, voiles: COTE_VOILES, droite: COTE_DROITE, barres: COTE_BARRES, centres: COTE_CENTRES, boutons: COTE_BOUTONS }; this.css = _coteCss();', ctx);
    K = ctx.K; css = ctx.css;
  } catch (e) { t('les réglages du panneau collé se jouent', false, e.message); }
  t('le seuil : 1 280 px, le même pour ouvrir le panneau et pour le coller', K && K.mq === '(min-width: 1280px)' && /window\.matchMedia\(COTE_MQ\)\.matches && !window\.matchMedia\('\(pointer: coarse\)'\)\.matches/.test(fn(tu, '_aCoteDispo')), K && K.mq);
  t('la largeur : de 360 à 420 px, 28 % de l’écran entre les deux', K && K.l === 'clamp(360px, 28vw, 420px)', K && K.l);
  t('la feuille ne vaut qu’au-dessus du seuil', css.startsWith('@media (min-width: 1280px){') && css.endsWith('}'));
  t('le panneau est collé au bord droit, sur toute la hauteur', css.includes('html.mvtu-cote .mvtu-panneau{top:0;bottom:0;right:0;width:clamp(360px, 28vw, 420px);'));
  t('l’appli se resserre de la largeur du panneau', css.includes('html.mvtu-cote #app-root{padding-right:clamp(360px, 28vw, 420px)}'));
  const regle = (liste, decl) => K && liste.length && css.includes(liste.map((s) => 'html.mvtu-cote ' + s).join(',') + '{' + decl + '}');
  t('les voiles et fenêtres s’arrêtent au panneau', regle(K ? K.voiles : [], 'right:clamp(360px, 28vw, 420px)!important'));
  t('le tiroir aussi', regle(K ? K.droite : [], 'right:clamp(360px, 28vw, 420px)!important'));
  t('les barres pleine largeur aussi', regle(K ? K.barres : [], 'right:clamp(360px, 28vw, 420px)!important;width:auto!important'));
  t('les messages et la recherche se centrent sur la place de l’appli', regle(K ? K.centres : [], 'left:calc((100% - clamp(360px, 28vw, 420px)) / 2)!important'));
  t('les boutons ronds du Tracteur et du Phyto se décalent', regle(K ? K.boutons : [], 'right:calc(clamp(360px, 28vw, 420px) + 24px)!important'));
  t('la feuille du panneau collé est posée avec les autres', /_coteCss\(\),/.test(fn(tu, '_css')));
  const pan = fn(tu, '_panneau'), fer = fn(tu, '_fermerPanneau');
  t('ouvrir : la page fait sa place, et prévient ce qui se recale', /_fermerPanneau\(true\);/.test(pan) && /document\.documentElement\.classList\.add\('mvtu-cote'\);[^\n]*\n\s*_coteRecaler\(\);/.test(pan));
  t('fermer : la page reprend sa largeur (sauf remplacement)', /if \(!remplace && document\.documentElement\.classList\.contains\('mvtu-cote'\)\) \{ document\.documentElement\.classList\.remove\('mvtu-cote'\); _coteRecaler\(\); \}/.test(fer));
  /* ══ 2. L'INVENTAIRE DES COUCHES FIXES ══ */
  const feuille = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  const vues = new Set();
  for (const m of feuille.matchAll(/([^{}]+)\{([^{}]*position\s*:\s*fixed[^{}]*)\}/g)) {
    const corps = m[2];
    const large = /inset\s*:\s*0/.test(corps) || /(^|[;\s])right\s*:\s*0/.test(corps) && /(^|[;\s])left\s*:\s*0/.test(corps) || /left\s*:\s*50%/.test(corps) || /(^|[;\s])right\s*:\s*0/.test(corps);
    if (large) m[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => vues.add(x));
  }
  const rangees = K ? new Set([].concat(K.voiles, K.droite, K.barres, K.centres, K.boutons)) : new Set();
  const orphelines = [...vues].filter((x) => !rangees.has(x) && !EXEMPT[x]);
  t('chaque couche fixe pleine largeur de la feuille est rangée ou exemptée (' + vues.size + ' lues)', vues.size >= 25 && orphelines.length === 0, 'à décider : ' + orphelines.join(', '));
  // le corpus de l'appli, SANS les listes elles-mêmes (une entrée se trouverait sinon toujours dans sa propre déclaration)
  const corpus = S.css + '\n' + S.html + '\n' + S.autres + '\n' + S.tutos.replace(/^var COTE_[A-Z]+ = .*$/gm, '');
  const mortes = [...rangees].filter((x) => !new RegExp('(^|[^\\w-])' + x.slice(1).replace(/[-.]/g, '\\$&') + '(?![\\w-])').test(corpus));
  t('chaque entrée des listes existe encore dans l’appli', K && mortes.length === 0, mortes.join(', '));
  /* ══ 3. LA BARRE LATÉRALE ══ */
  try {
    const coq = S.coq;
    const ctx = { window: { innerWidth: 1536, _mvTutoCote: () => 0 }, localStorage: { getItem: () => null }, MQ_LARGE: { matches: true } };
    vm.createContext(ctx);
    vm.runInContext('let manuel = null;\n' + (coq.match(/^let coteVu = false;$/m) || [''])[0] + '\n' + fn(coq, 'coteTuto') + '\n' + fn(coq, 'ouvert') + '\nthis.ouvert = ouvert; this.poser = (v) => { manuel = v; };', ctx);
    const essai = (w, cote, mq) => { ctx.window.innerWidth = w; ctx.window._mvTutoCote = () => cote; ctx.MQ_LARGE.matches = mq; return ctx.ouvert(); };
    t('sans panneau, rien ne change : dépliée à 1 536 px', essai(1536, 0, true) === true);
    t('panneau collé à 1 536 px : il reste 1 116 px, la barre se replie', essai(1536, 420, true) === false);
    t('panneau collé à 1 920 px : il reste 1 500 px, la barre reste dépliée', essai(1920, 420, true) === true);
    essai(1536, 0, true); ctx.poser(true);
    t('le choix fait à la main repart à zéro quand le panneau s’ouvre', essai(1536, 420, true) === false);
    ctx.poser(true);
    t('… et vaut tant que le panneau reste là', essai(1536, 420, true) === true);
  } catch (e) { t('ouvert() se joue', false, e.message); }
  /* ══ 4. LE « + » ══ */
  t('l’icône des trois points s’appelle « points », celle du « + » « ajout »', /<symbol id="ic-points" viewBox="0 0 24 24" data-src="ellipsis">/.test(S.html) && /<symbol id="ic-ajout" viewBox="0 0 24 24" data-src="plus"><path d="M5 12h14" \/> <path d="M12 5v14" \/><\/symbol>/.test(S.html));
  const restes = (S.html + S.autres + S.guide + S.tutos).match(/ic-plus|_mvIcon\('plus'|_trnIc\('plus'|\{ic:plus\}|emoji: 'plus'/g) || [];
  t('« plus » n’existe plus nulle part : un nom qui ne dit pas ce qu’il dessine', restes.length === 0, restes.join(', '));
  const ajouts = (S.autres.match(/_mvIcon\('ajout'/g) || []).length;
  t('les boutons d’ajout dessinent le « + » (' + ajouts + ')', ajouts >= 9 && /<use href="#ic-ajout"><\/use>/.test(S.html));
  t('les menus « Plus » gardent leurs trois points', /_mvIcon\('points',20\)\+'<\/span><span class="mv-dk-lb">Plus<\/span>/.test(S.autres) && /_trnIc\('points', 18\)/.test(S.autres));
  return L;
}

const DEFAUTS = [
  ['le seuil retombe à 1 024 px', (S) => ({ ...S, tutos: S.tutos.replace("var COTE_MQ = '(min-width: 1280px)';", "var COTE_MQ = '(min-width: 1024px)';") })],
  ['le panneau flotte de nouveau par-dessus', (S) => ({ ...S, tutos: S.tutos.replace("'html.mvtu-cote .mvtu-panneau{top:0;bottom:0;right:0;width:'", "'html.mvtu-cote .mvtu-panneau{top:12px;bottom:12px;right:12px;width:'") })],
  ['l’appli ne se resserre plus', (S) => ({ ...S, tutos: S.tutos.replace("+ 'html.mvtu-cote #app-root{padding-right:' + COTE_L + '}'", '') })],
  ['les fenêtres de l’appli repassent dessous', (S) => ({ ...S, tutos: S.tutos.replace("var COTE_VOILES = ['.overlay', ", 'var COTE_VOILES = [') })],
  ['une couche fixe neuve arrive sans décision', (S) => ({ ...S, css: S.css + '\n.zz-voile-neuf{position:fixed;inset:0;z-index:700}\n' })],
  ['une entrée des listes ne vise plus rien', (S) => ({ ...S, tutos: S.tutos.replace("var COTE_BOUTONS = ['#trac-fab', '#phyto-fab'];", "var COTE_BOUTONS = ['#trac-fab', '#phyto-fab', '#bouton-disparu'];") })],
  ['la feuille du panneau collé n’est plus posée', (S) => ({ ...S, tutos: S.tutos.replace("    _coteCss(),   // ★ COTE-1 (§424) : collé à droite, l'appli à côté\n", '') })],
  ['fermer le panneau laisse la page resserrée', (S) => ({ ...S, tutos: S.tutos.replace("document.documentElement.classList.remove('mvtu-cote'); _coteRecaler(); }", "_coteRecaler(); }") })],
  ['la barre latérale ignore le panneau', (S) => ({ ...S, coq: S.coq.replace('  return choix && MQ_LARGE.matches && window.innerWidth - cote >= 1200;', '  return choix && MQ_LARGE.matches;') })],
  ['le choix à la main survit à l’ouverture du panneau', (S) => ({ ...S, coq: S.coq.replace('  if ((cote > 0) !== coteVu) { coteVu = cote > 0; manuel = null; }\n', '') })],
  ['un bouton d’ajout redemande « plus »', (S) => ({ ...S, autres: S.autres.replace("_mvIcon('ajout'", "_mvIcon('plus'") })],
  ['l’icône des trois points reprend le nom « plus »', (S) => ({ ...S, html: S.html.replace('<symbol id="ic-points"', '<symbol id="ic-plus"') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCOTE-1 — le tuto à côté de l’appli, rien dessous ; le « + » des boutons d’ajout');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  let mordus = 0;
  console.log('\nCOTE-1 — contre-épreuves');
  for (const [nom, f] of DEFAUTS) {
    const S = f(SAIN);
    const injecte = Object.keys(S).some((k) => S[k] !== SAIN[k]);
    const ko = injecte ? jouer(S).filter((x) => !x.ok).length : 0;
    const ok = injecte && ko > 0;
    if (ok) mordus++;
    console.log('  ' + (ok ? c.v('✓') : c.r('✗')) + ' ' + nom + (injecte ? (ok ? c.d('  (' + ko + ' rouge(s))') : c.r('  → rien n’a rougi')) : c.r('  → défaut non injecté (ancre introuvable)')));
  }
  console.log('\n  ' + mordus + '/' + DEFAUTS.length + ' contre-épreuves mordent\n');
  process.exit(mordus === DEFAUTS.length ? 0 : 1);
}
