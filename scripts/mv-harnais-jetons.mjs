/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LES JETONS DU SOCLE (lot DS-0)
   Lancer :  node scripts/mv-harnais-jetons.mjs
   Contre-épreuves : node scripts/mv-harnais-jetons.mjs --contre
   Graver le cliquet : node scripts/mv-harnais-jetons.mjs --baseline

   Ce que ce harnais interdit :
   · qu'un pas du socle disparaisse, change de valeur, ou soit déclaré DEUX FOIS
     (une variable définie deux fois, c'est deux vérités en puissance) ;
   · qu'un jeton qui suit le thème soit redit dans UN SEUL des deux blocs
     sombres — la bascule manuelle et le mode auto de l'OS divergeraient ;
   · qu'un appel var(--X) du socle perde son repli, ou que le repli mente ;
   · qu'un CERCLE (border-radius:50%) soit converti en jeton de rayon ;
   · que les deux règles globales bougent de place — la règle de focus est morte
     si elle passe AVANT les `outline:none` des champs de saisie ;
   · que les valeurs écrites à la main remontent (quatre cliquets).

   ⚠️ CE QU'IL NE FAIT PAS : juger une mise en page. Aucun harnais ne lit un
      écran (§42). L'accueil, Pilotage › Décider et Planning › Équipe restent à
      regarder à l'œil.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync } from 'node:fs';

/* Les DRAPEAUX sont écartés des chemins : `--baseline` lu comme un nom de
   fichier tuait mv-harnais-echelle sur un ENOENT (§47c). */
const _args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const CHEMIN_CSS = _args[0] || 'src/styles.css';
const REF        = 'scripts/mv-jetons-baseline.json';

const CSS_BRUT = readFileSync(CHEMIN_CSS, 'utf8');
/* Les fichiers où un jeton pourrait être re-déclaré en douce. */
const AUTRES = ['index.html', 'src/app.js', 'src/utils.js', 'src/pilotage.js',
                'src/planning.js', 'src/cave.js', 'src/reglages.js', 'src/tracteur.js',
                'src/phyto.js', 'src/reserve.js', 'src/admin-gt.js', 'src/onboarding.js',
                'src/firebase.js']
  .map(f => { try { return [f, readFileSync(f, 'utf8')]; } catch { return null; } })
  .filter(Boolean);

/* ══ EXEMPTIONS — chacune porte SA RAISON, comme GUARD_EXEMPT (§6c) ═════════
   Un jeton peut porter le même nom ailleurs si ce « ailleurs » est un AUTRE
   DOCUMENT, qui ne charge pas styles.css. */
const EXEMPT_REDECL = [
  { jeton: '--ligne', fichier: 'src/app.js',
    raison: '_rsCss() est le :root d\'un document A4 imprimé, ouvert par '
          + 'window.open dans sa propre fenêtre. Il ne charge jamais styles.css.' }
];

/* ══ LE SOCLE, tel qu'il doit être ══════════════════════════════════════════ */
const SOCLE = [
  ['--r-sm',    '8px'],   ['--r-md',   '12px'], ['--r-lg',  '16px'], ['--r-full', '999px'],
  ['--fw-med',  '500'],   ['--fw-semi', '600'], ['--fw-bold', '700'],
  ['--e-9',    '48px'],   ['--e-10',   '64px']
];
/* Déclarés aussi, mais dont la valeur est une liste d'ombres : testés à part. */
const SOCLE_LIBRE = ['--shadow-lg', '--ligne'];
/* Jetons qui SUIVENT LE THÈME : s'ils sont redits dans un bloc sombre, ils
   doivent l'être dans LES DEUX, sinon la bascule manuelle et le mode auto de
   l'OS divergent — et personne ne le voit avant un client en mode sombre. */
const THEMES = ['--shadow-sm', '--shadow-md', '--shadow-lg', '--ligne'];

/* ══ Outils ════════════════════════════════════════════════════════════════ */
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
/* Découpe un bloc { … } par appariement d'accolades, à partir d'un motif
   d'ouverture. Une regex `\{[^}]*\}` s'arrête à la première accolade fermante
   et rendrait un bloc tronqué dès qu'il contient une @media ou une fonction. */
function blocDe(src, ouverture) {
  const i = src.indexOf(ouverture);
  if (i < 0) return '';
  let p = 0, j = i + ouverture.length - 1;
  for (; j < src.length; j++) {
    if (src[j] === '{') p++;
    else if (src[j] === '}') { p--; if (!p) break; }
  }
  return src.slice(i, j + 1);
}
const valDe = (bloc, jeton) => {
  const m = bloc.match(new RegExp(jeton.replace(/[-]/g, '\\-') + '\\s*:\\s*([^;}]+)'));
  return m ? m[1].trim() : null;
};
/* Compte les appels var(--X) SANS repli.
   ⚠️ Prend des PAIRES [fichier, source], jamais un blob concaténé : sans le nom
     du fichier on ne peut pas appliquer une exemption, et on rougit sur un
     document qui n'a rien à voir. Vécu au premier lancement — var(--ligne) de
     _rsCss() (document A4) comptait comme un appel sans repli, alors que ce
     document DÉCLARE --ligne deux lignes plus haut : le repli y est sans objet.
   ⚠️ Prend un PRÉDICAT, jamais un préfixe nu : « --ligne » en préfixe attrape
     « --ligne-2 », qui n'est pas un jeton du socle. */
function sansRepli(paires, estVise) {
  const out = [];
  for (const [f, src] of paires)
    for (const m of sansCom(src).matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g))
      if (estVise(m[1]) && !EXEMPT_REDECL.some(e => e.jeton === m[1] && e.fichier === f))
        out.push(m[1] + ' (' + f + ')');
  return out;
}
/* Le socle : la liste EXACTE, plus les deux familles à préfixe non ambigu. */
const estSocle = n => SOCLE.some(x => x[0] === n) || SOCLE_LIBRE.includes(n)
                   || /^--(?:r|fw)-/.test(n);
const estAncien = n => /^--(?:pt|e)-/.test(n) || n === '--shadow-sm' || n === '--shadow-md';

/* ══ LES CONTRÔLES ═════════════════════════════════════════════════════════
   Une FONCTION PURE du texte de la feuille. C'est ce qui rend les
   contre-épreuves réelles : on mute une copie en mémoire et on relance le même
   jeu. Un harnais dont on ne peut pas rejouer les assertions sur une source
   abîmée ne prouve rien (§46 : « une contre-épreuve qui ne mord pas »). */
function controles(CSS, ref) {
  const R = [];
  const t = (nom, ok, detail) => R.push({ nom, ok: !!ok, detail: detail || '' });
  const NU = sansCom(CSS);

  /* ⚠️⚠️ CES TROIS BLOCS SE REPÈRENT PAR LEUR CONTENU, PLUS PAR LEUR SÉLECTEUR.
     Première version : trois chaînes exactes du type
     '#app-root[data-theme="dark"]{\n  color-scheme:dark;'. Le jour où le lot du
     thème (§59) a ajouté ':root[data-theme="dark"]' au même bloc — pour que les
     overlays, qui sont HORS de #app-root, reçoivent enfin les couleurs sombres —
     les trois marqueurs sont tombés d'un coup et le harnais a accusé du code
     parfaitement sain. Figer un sélecteur revient à figer un numéro de ligne :
     ça se décale au premier changement légitime. On cherche donc la déclaration
     `color-scheme`, qui est ce qui IDENTIFIE vraiment ces blocs, et on remonte
     à l'accolade ouvrante. */
  const blocAutourDe = (src, aiguille, rang) => {
    let i = -1;
    for (let k = 0; k <= rang; k++) { i = src.indexOf(aiguille, i + 1); if (i < 0) return ''; }
    const o = src.lastIndexOf('{', i);
    if (o < 0) return '';
    let p = 1, j = o + 1;
    for (; j < src.length && p; j++) { if (src[j] === '{') p++; else if (src[j] === '}') p--; }
    return src.slice(o, j);
  };
  const clair  = blocAutourDe(NU, 'color-scheme:light dark;', 0);
  const sombre = blocAutourDe(NU, 'color-scheme:dark;', 0);
  const media  = blocAutourDe(NU, 'color-scheme:dark;', 1);
  t('les trois blocs de thème sont repérables', clair && sombre && media,
    `clair=${!!clair} sombre=${!!sombre} media=${!!media}`);

  /* ── A. Chaque pas est déclaré dans le :root clair, à sa valeur exacte ──── */
  for (const [jeton, val] of SOCLE)
    t(`${jeton} vaut ${val} dans :root`, valDe(clair, jeton) === val,
      'trouvé : ' + valDe(clair, jeton));
  for (const jeton of SOCLE_LIBRE)
    t(`${jeton} est déclaré dans :root`, !!valDe(clair, jeton));

  /* Les échelles antérieures ne bougent pas : le socle AJOUTE, il ne remplace. */
  t('les onze pas --pt-* sont intacts',
    ['hero','xxl','xl','lg','md','sm','base','txt','micro','lbl','nano']
      .every(n => clair.includes(`--pt-${n}:`)));
  t('les neuf pas --e-0..--e-8 sont intacts',
    [2,4,8,12,16,20,24,32,40].every((v,i) => clair.includes(`--e-${i}:${v}px`)));

  /* ── B. Aucun pas re-déclaré ailleurs : deux déclarations = deux vérités ── */
  const tousJetons = [...SOCLE.map(x => x[0]), ...SOCLE_LIBRE];
  const doublons = [];
  for (const j of tousJetons) {
    const n = [...NU.matchAll(new RegExp('(?<![a-z0-9-])' + j + '\\s*:', 'g'))].length;
    const attendu = THEMES.includes(j) ? 3 : 1;   // clair + 2 blocs sombres
    if (n !== attendu) doublons.push(`${j} déclaré ${n}× (attendu ${attendu})`);
  }
  t('aucun pas déclaré plus de fois que prévu', doublons.length === 0, doublons.join(' · '));

  const horsFeuille = [];
  for (const [f, s] of AUTRES) for (const j of tousJetons) {
    if (!new RegExp('(?<![a-z0-9-])' + j + '\\s*:').test(sansCom(s))) continue;
    if (EXEMPT_REDECL.some(e => e.jeton === j && e.fichier === f)) continue;
    horsFeuille.push(`${j} dans ${f}`);
  }
  t('aucun pas re-déclaré hors de la feuille (hors exemptions écrites)',
    horsFeuille.length === 0, horsFeuille.join(' · '));

  /* ── C. Parité des thèmes ────────────────────────────────────────────────
     Un jeton redit dans UN SEUL bloc sombre = mode manuel et mode auto
     divergents. Le défaut ne se voit que chez un client en sombre. */
  const boiteux = THEMES.filter(j => !!valDe(sombre, j) !== !!valDe(media, j));
  t('tout jeton de thème est redit dans LES DEUX blocs sombres',
    boiteux.length === 0, boiteux.join(' · '));
  const divergents = THEMES.filter(j => valDe(sombre, j) && valDe(sombre, j) !== valDe(media, j));
  t('les deux blocs sombres disent la même chose', divergents.length === 0,
    divergents.map(j => `${j}: ${valDe(sombre, j)} ≠ ${valDe(media, j)}`).join(' · '));

  /* --ligne doit suivre le neutre gagnant, pas une couleur écrite en dur. */
  t('--ligne dérive de --gris-clair, en clair comme en sombre',
    /var\(--gris-clair,/.test(valDe(clair, '--ligne') || '')
    && /var\(--gris-clair,/.test(valDe(sombre, '--ligne') || ''),
    'clair=' + valDe(clair, '--ligne') + ' · sombre=' + valDe(sombre, '--ligne'));

  /* ── D. Le cercle n'est pas un rayon ─────────────────────────────────────
     PLANCHER, pas plafond : border-radius:50% ne doit jamais BAISSER. Une
     baisse voudrait dire qu'une pastille ronde a été convertie en --r-full, ce
     qui la déforme dès que sa hauteur dépasse 198 px. */
  const cercles = (NU.match(/border-radius\s*:\s*50%/g) || []).length;
  t(`les cercles restent des cercles (${cercles} ≥ ${ref.cercles})`, cercles >= ref.cercles,
    cercles < ref.cercles ? (ref.cercles - cercles) + ' cercle(s) converti(s) en jeton' : '');
  const jetonRond = SOCLE.filter(([j, v]) => v.includes('%'));
  t('aucun pas de rayon ne vaut un pourcentage', jetonRond.length === 0,
    jetonRond.map(x => x[0]).join(' · '));

  /* ── E. Les deux règles globales ─────────────────────────────────────────
     La 1re doit être sur :root et NON sur #app-root : index.html ferme
     #app-root ligne 3197, les overlays sont ses FRÈRES et les overlays
     dynamiques sont posés par document.body.appendChild. Ancrée sur #app-root,
     la règle laisserait toutes les modales en chiffres proportionnels. */
  t('les chiffres sont tabulaires, et la règle est posée sur :root',
    /:root\{\s*font-variant-numeric\s*:\s*tabular-nums\s*;?\s*\}/.test(NU));
  t('la règle des chiffres n\'est PAS ancrée sur #app-root',
    !/#app-root\s*\{[^}]*font-variant-numeric/.test(NU));
  t('l\'anneau de focus existe, avec son repli et son décalage',
    /:focus-visible\{[^}]*outline\s*:\s*2px solid var\(--or,#C2A14D\)[^}]*outline-offset\s*:\s*2px/.test(NU));
  t('le focus souris est éteint', /\*:focus:not\(:focus-visible\)\{\s*outline\s*:\s*none\s*;?\s*\}/.test(NU));

  /* ⚠️ LA POSITION EST UNE ASSERTION, PAS UNE CONVENTION. 17 « outline:none »
     dans la feuille, la plupart sur des règles de base de champs en (0,1,0) —
     spécificité ÉGALE à :focus-visible. À égalité, l'ordre de source tranche :
     placé avant, l'anneau est mort sur tous les champs, en silence.
     Après la règle de focus, le SEUL outline:none toléré est celui du couple. */
  /* ⚠️ L'ANCRE EST LA RÈGLE GLOBALE, PAS LE PREMIER « :focus-visible{ » VENU.
     La feuille en compte NEUF (.emh-x, .emh-add, .emh-rap-b, .emh-opt,
     .mv-syncdot, .mvt-cta, .mv-i, .rf-f select, plus celle-ci). Ancré sur le
     premier, le contrôle mesurait 15 outline:none « après » et rougissait sur
     du code parfaitement sain — l'assertion satisfaite par une AUTRE phrase du
     fichier, la faute exacte de §53. */
  const ANCRE = ':focus-visible{ outline:2px solid var(--or,#C2A14D)';
  const iFocus = NU.indexOf(ANCRE);
  const apres = iFocus < 0 ? '' : NU.slice(iFocus);
  const noneApres = (apres.match(/outline\s*:\s*none/g) || []).length;
  t('rien ne vient éteindre l\'anneau après lui (1 seul outline:none toléré)',
    iFocus >= 0 && noneApres === 1,
    noneApres + ' outline:none après la règle de focus (attendu 1)');

  /* ── F. Chaque appel porte son repli, et le repli redit la valeur ────────
     Une variable inconnue rend la déclaration INVALIDE : le navigateur la jette
     en silence. Le repli protège un client dont styles.css serait en retard. */
  const nus = sansRepli(PAIRES(CSS), estSocle);
  t('aucun appel du socle sans repli', nus.length === 0, [...new Set(nus)].join(' · '));

  const table = new Map([...SOCLE, ['--radius-card', '16px']]);
  const menteurs = [...CSS_TOUT(CSS).matchAll(/var\(\s*(--[a-z0-9-]+)\s*,\s*([^)]+)\)/g)]
    .filter(m => table.has(m[1]) && table.get(m[1]) !== m[2].trim())
    .map(m => m[0]);
  t('chaque repli redit la valeur du pas', menteurs.length === 0,
    [...new Set(menteurs)].slice(0, 3).join(' · '));

  /* Cliquet sur les replis manquants ANTÉRIEURS au socle (--pt-*, --e-*,
     --shadow-sm/md) : 89 au clone. Ils ne se soldent pas dans ce lot, ils ne
     peuvent plus monter. Transformer une dette en cliquet vaut mieux que la
     solder à l'aveugle (§47b). */
  const nusVieux = sansRepli(PAIRES(CSS), estAncien).length;
  t(`les replis manquants antérieurs ne remontent pas (${nusVieux} ≤ ${ref.sansRepli})`,
    nusVieux <= ref.sansRepli);
  if (nusVieux < ref.sansRepli) R.push({ baisse: `replis manquants : ${ref.sansRepli} → ${nusVieux}` });

  /* ── G. Les trois cliquets de valeurs écrites à la main ─────────────────
     Le socle DÉCLARE ; il ne remappe pas 674 border-radius sans pouvoir
     regarder une seule capture — ce serait un pari, pas un lot. Ce qui est
     tenu, c'est que la dette ne grossisse plus. */
  const radDur = (NU.match(/border-radius\s*:\s*[^;}]+/g) || [])
    .flatMap(d => (d.match(/(\d+)px/g) || []).map(v => parseInt(v)))
    .filter(v => [8, 12, 16, 999].includes(v)).length;
  t(`les rayons en dur qui doublent un pas ne remontent pas (${radDur} ≤ ${ref.radDur})`,
    radDur <= ref.radDur);
  if (radDur < ref.radDur) R.push({ baisse: `rayons en dur : ${ref.radDur} → ${radDur}` });

  const fwHors = [...CSS_TOUT(CSS).matchAll(/font-weight\s*:\s*([0-9]{3}|bold|bolder|lighter)/g)]
    .filter(m => !['500', '600', '700'].includes(m[1])).length;
  t(`les graisses hors des trois pas ne remontent pas (${fwHors} ≤ ${ref.fwHors})`,
    fwHors <= ref.fwHors,
    '⚠ 800 en est l\'essentiel : quatrième pas de fait, à trancher sur capture');
  if (fwHors < ref.fwHors) R.push({ baisse: `graisses hors pas : ${ref.fwHors} → ${fwHors}` });

  /* --gris est le PERDANT de l'arbitrage du filet (71 contre 172). Son compte
     ne remonte pas ; --gris-clair reste libre, c'est la source retenue. */
  const perdant = (CSS_TOUT(CSS).match(/border(?:-[a-z]+)?\s*:\s*1px\s+solid\s+var\(--gris\)/g) || []).length;
  t(`le filet perdant ne regagne pas de terrain (${perdant} ≤ ${ref.filetPerdant})`,
    perdant <= ref.filetPerdant);
  if (perdant < ref.filetPerdant) R.push({ baisse: `1px solid var(--gris) : ${ref.filetPerdant} → ${perdant}` });

  return R;
}

/* Le repli et les graisses se lisent sur TOUTE la base, pas sur la seule
   feuille : un `font-weight:800` écrit dans une chaîne HTML de cave.js compte
   autant. La feuille est passée en argument pour que les contre-épreuves
   puissent la muter ; les autres fichiers sont lus une fois. */
function CSS_TOUT(feuille) { return feuille + '\n' + AUTRES.map(x => x[1]).join('\n'); }
function PAIRES(feuille) { return [[CHEMIN_CSS, feuille], ...AUTRES]; }

/* ══ MESURE DE RÉFÉRENCE ═══════════════════════════════════════════════════ */
function mesure(CSS) {
  const NU = sansCom(CSS);
  return {
    cercles: (NU.match(/border-radius\s*:\s*50%/g) || []).length,
    sansRepli: sansRepli(PAIRES(CSS), estAncien).length,
    radDur: (NU.match(/border-radius\s*:\s*[^;}]+/g) || [])
      .flatMap(d => (d.match(/(\d+)px/g) || []).map(v => parseInt(v)))
      .filter(v => [8, 12, 16, 999].includes(v)).length,
    fwHors: [...CSS_TOUT(CSS).matchAll(/font-weight\s*:\s*([0-9]{3}|bold|bolder|lighter)/g)]
      .filter(m => !['500', '600', '700'].includes(m[1])).length,
    filetPerdant: (CSS_TOUT(CSS).match(/border(?:-[a-z]+)?\s*:\s*1px\s+solid\s+var\(--gris\)/g) || []).length
  };
}

if (process.argv.includes('--baseline')) {
  const m = mesure(CSS_BRUT);
  writeFileSync(REF, JSON.stringify(m, null, 2) + '\n');
  console.log('\n  cliquets gravés :', JSON.stringify(m), '\n');
  process.exit(0);
}

let ref;
try { ref = JSON.parse(readFileSync(REF, 'utf8')); }
catch {
  console.log('\n  \x1b[31m✗\x1b[0m aucun cliquet gravé — lancer : node scripts/mv-harnais-jetons.mjs --baseline\n');
  process.exit(1);
}

/* ══ LANCEUR ═══════════════════════════════════════════════════════════════ */
function joue(CSS, silencieux) {
  let ok = 0, ko = 0;
  const R = controles(CSS, ref);
  for (const r of R) {
    if (r.baisse) { if (!silencieux) console.log('    \x1b[33m↓\x1b[0m ' + r.baisse + ' — regraver après vérification'); continue; }
    if (r.ok) { ok++; if (!silencieux) console.log('  \x1b[32m✓\x1b[0m ' + r.nom); }
    else { ko++; if (!silencieux) console.log('  \x1b[31m✗\x1b[0m ' + r.nom + (r.detail ? '\n      → ' + r.detail : '')); }
  }
  return { ok, ko, R };
}

/* ══ CONTRE-ÉPREUVES ═══════════════════════════════════════════════════════
   ⚠️ DEUX DE MES CONTRE-ÉPREUVES ÉTAIENT FAUSSES DEUX LOTS DE SUITE (§53, §54).
   Le piège : chercher un motif qu'une AUTRE phrase du fichier satisfait déjà.
   Ici chaque mutation est vérifiée deux fois — qu'elle a bien mordu le texte
   (le CSS muté DIFFÈRE de l'original), et que l'assertion NOMMÉE rougit. */
const MUTATIONS = [
  ['on retire --r-md de :root',
    s => s.replace('--r-sm:8px; --r-md:12px;', '--r-sm:8px;'),
    'vaut 12px'],
  ['on change la valeur de --fw-semi',
    s => s.replace('--fw-semi:600;', '--fw-semi:650;'),
    'vaut 600'],
  ['on retire --e-3 de l\'échelle antérieure',
    s => s.replace('--e-2:8px; --e-3:12px;', '--e-2:8px;'),
    '--e-0..--e-8 sont intacts'],
  ['--ligne n\'est plus redit que dans UN bloc sombre',
    s => s.replace('    --ligne:var(--gris-clair,#2D2924);\n', ''),
    'LES DEUX blocs sombres'],
  ['les deux blocs sombres divergent',
    s => s.replace('    --shadow-lg:0 14px 56px rgba(0,0,0,0.70);',
                   '    --shadow-lg:0 10px 40px rgba(0,0,0,0.70);'),
    'la même chose'],
  ['--shadow-lg est déclaré deux fois dans :root',
    s => s.replace('  --fw-med:500;', '  --shadow-lg:0 1px 1px #000;\n  --fw-med:500;'),
    'plus de fois que prévu'],
  ['la règle des chiffres redescend sur #app-root',
    s => s.replace(':root{ font-variant-numeric:tabular-nums; }',
                   '#app-root{ font-variant-numeric:tabular-nums; }'),
    'posée sur :root'],
  ['un champ éteint l\'anneau APRÈS la règle de focus',
    s => s + '\n.zz-champ{outline:none;}\n',
    'après lui'],
  ['un appel du socle perd son repli',
    s => s.replace('--radius-card:var(--r-lg,16px);', '--radius-card:var(--r-lg);'),
    'sans repli'],
  ['un repli ment sur la valeur du pas',
    s => s.replace('--radius-card:var(--r-lg,16px);', '--radius-card:var(--r-lg,14px);'),
    'redit la valeur'],
  /* ⚠️⚠️ CETTE MUTATION-CI A ÉTÉ FAUSSE AU PREMIER JET, ET C'EST LA TROISIÈME
     FOIS QUE CETTE FAMILLE DE FAUTE REVIENT (§53). Écrite « border-radius:50% »
     sans point-virgule, elle frappait LA PREMIÈRE OCCURRENCE DU FICHIER — qui
     est le commentaire que je venais d'écrire, dix lignes plus haut, pour
     expliquer qu'un cercle n'est pas un rayon. sansCom() le retirait ensuite :
     le compte ne bougeait pas, la contre-épreuve ne mordait pas, et elle se
     lisait comme une mutation légitime. Le « ; » vise du code (80 occurrences,
     exactement le compte hors commentaires). Le garde-fou ci-dessous ferme la
     famille entière plutôt que ce seul cas. */
  ['un cercle est converti en jeton',
    s => s.replace('border-radius:50%;', 'border-radius:var(--r-full,999px);'),
    'restent des cercles'],
  ['une graisse hors pas est ajoutée',
    s => s.replace('  --fw-med:500;', '  --fw-med:500;\n.zz-g{font-weight:800;}'),
    'ne remontent pas']
];

if (process.argv.includes('--contre')) {
  console.log('\n── CONTRE-ÉPREUVES — chaque défaut réintroduit doit faire ROUGIR\n');
  let vertes = 0, rouges = 0;
  const refVert = joue(CSS_BRUT, true);
  if (refVert.ko) {
    console.log('  \x1b[31m✗\x1b[0m la feuille n\'est pas verte au départ — contre-épreuves sans valeur\n');
    process.exit(1);
  }
  for (const [nom, mute, motif] of MUTATIONS) {
    const mute_ = mute(CSS_BRUT);
    /* ⚠️ Premier filet : une mutation qui ne mord pas le texte prouverait
       seulement que mon motif de remplacement est faux. */
    if (mute_ === CSS_BRUT) {
      console.log(`  \x1b[31m✗\x1b[0m ${nom}\n      → la mutation n'a RIEN changé : le motif ne trouve pas sa cible`);
      rouges++; continue;
    }
    /* ⚠️ Le filet qui ferme la famille : une mutation peut « changer le
       fichier » en ne touchant QUE des commentaires — que les contrôles
       retirent avant de mesurer. Elle se lit alors comme une mutation valide
       et ne mord rien. On exige qu'elle bouge le CODE. */
    if (sansCom(mute_) === sansCom(CSS_BRUT)) {
      console.log(`  \x1b[31m✗\x1b[0m ${nom}\n      → la mutation n'a touché QUE des commentaires : elle ne teste rien`);
      rouges++; continue;
    }
    const res = joue(mute_, true);
    const nommee = res.R.filter(r => !r.baisse && !r.ok && r.nom.includes(motif));
    /* ⚠️ Second filet : il ne suffit pas que « ça rougisse », il faut que ce
       soit L'ASSERTION VISÉE. Une mutation qui casse autre chose passerait. */
    if (nommee.length) { vertes++; console.log(`  \x1b[32m✓\x1b[0m ${nom}\n      → rougit : « ${nommee[0].nom} »`); }
    else {
      rouges++;
      console.log(`  \x1b[31m✗\x1b[0m ${nom}\n      → aucune assertion contenant « ${motif} » n'a rougi`
        + ` (${res.ko} rouge(s) au total)`);
    }
  }
  console.log(`\n  ${vertes} contre-épreuves mordent, ${rouges} ne mordent pas\n`);
  process.exit(rouges ? 1 : 0);
}

console.log('\n── LES JETONS DU SOCLE — ' + CHEMIN_CSS + '\n');
const { ok, ko } = joue(CSS_BRUT, false);
console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
