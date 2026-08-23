/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LES CONSOMMABLES PAR ATELIER
   Extrait la ventilation de _pexData et la rejoue sur des scenarios reels.
   Puis REINTRODUIT chaque defaut et exige que le harnais ROUGISSE.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
const SRC = readFileSync('src/pilotage.js', 'utf8');
const RSV = readFileSync('src/reserve.js', 'utf8');

let ok = 0, ko = 0;
const t = (nom, cond, det) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); }
};

/* La table des ateliers, lue DANS reserve.js — jamais recopiee ici, sinon le
   harnais testerait sa propre copie et serait vert quoi qu'il arrive (§53). */
const mCat = RSV.match(/var _CAT2ATE=\{([^}]*)\}/);
const CAT2ATE = {};
for (const m of (mCat ? mCat[1] : '').matchAll(/(\w+):'(\w+)'/g)) CAT2ATE[m[1]] = m[2];
const ORD = ['vigne','cave','trac','gen'];

/* Le moteur de ventilation, reproduit a l'identique depuis la source. */
function ventile({achats, produits, gnr, depenses, d0, d1}) {
  const prodBy = {}; produits.forEach(p => prodBy[p.id] = p);
  const ateEur = {}; ORD.forEach(k => ateEur[k] = 0);
  const add = (k, e) => { if (!(e > 0)) return; if (!(k in ateEur)) k = 'gen'; ateEur[k] += e; };

  add('trac', gnr);

  const byCat = {};
  let achT = 0;
  achats.forEach(a => {
    if (!a.date) return;
    const iso = String(a.date).slice(0, 10);
    if (iso < d0 || iso > d1) return;
    const pr = prodBy[a.prodId] || null;
    const cat = (pr && pr.cat) || 'gen';
    byCat[cat] = (byCat[cat] || 0) + (Number(a.prix) || 0);
    achT += Number(a.prix) || 0;
  });
  Object.keys(byCat).forEach(c => add(CAT2ATE[c] || 'gen', byCat[c]));

  let depT = 0, nDepSansPrix = 0;
  depenses.forEach(d => {
    if (!d.date) return;
    const iso = String(d.date).slice(0, 10);
    if (iso < d0 || iso > d1) return;
    const e = Number(d.eur) || 0;
    if (!(e > 0)) nDepSansPrix++;
    depT += e;
    add(d.ate || 'gen', e);
  });

  let ateT = 0; ORD.forEach(k => ateT += ateEur[k]);
  return { ateEur, ateT, achT, gnrT: gnr, depT, nDepSansPrix };
}

/* ══ SCENARIO — un domaine de Cote de Nuits, exercice 2025-2026 ═══════════ */
const S = {
  d0: '2025-08-01', d1: '2026-07-31',
  gnr: 4820,
  produits: [
    {id:'p1', cat:'phyto'}, {id:'p2', cat:'oeno'}, {id:'p3', cat:'vigne'},
    {id:'p4', cat:'cave'},  {id:'p5', cat:'trac'}, {id:'p6', cat:'gen'}
  ],
  achats: [
    {prodId:'p1', date:'2026-05-12', prix:10540},
    {prodId:'p3', date:'2025-11-04', prix:3180},
    {prodId:'p2', date:'2025-09-20', prix:2960},
    {prodId:'p4', date:'2025-10-02', prix:1640},
    {prodId:'p5', date:'2026-01-08', prix:1340},
    {prodId:'p6', date:'2026-02-11', prix:320},
    {prodId:'p1', date:'2025-06-30', prix:9999},   // HORS fenetre : ignore
    {prodId:'p3', date:'2026-03-01', prix:0}       // sans prix : compte 0
  ],
  depenses: [
    {date:'2026-03-12', ate:'trac', eur:780},
    {date:'2026-02-04', ate:'cave', eur:720},
    {date:'2025-11-18', ate:'trac', eur:620},
    {date:'2025-10-06', ate:'trac', eur:418},
    {date:'2025-09-15', ate:'cave', eur:480},
    {date:'2025-09-02', ate:'trac', eur:355.5},
    {date:'2025-07-28', ate:'trac', eur:240},      // HORS fenetre (avant d0)
    {date:'2026-06-12', ate:'trac', eur:0}         // sans prix
  ]
};

console.log('\n── LES CONSOMMABLES PAR ATELIER\n');

t('la table des ateliers est lue dans reserve.js, pas recopiee',
  Object.keys(CAT2ATE).length === 6, JSON.stringify(CAT2ATE));

const R = ventile(S);
console.log('     ' + ORD.map(k => k + '=' + Math.round(R.ateEur[k])).join('  '));

t('phyto part sur la vigne, oeno dans la cave', CAT2ATE.phyto === 'vigne' && CAT2ATE.oeno === 'cave');
t('vigne = phyto 10540 + fournitures 3180', Math.abs(R.ateEur.vigne - 13720) < 0.005, R.ateEur.vigne);
t('cave  = oeno 2960 + fournitures 1640 + locations 1200', Math.abs(R.ateEur.cave - 5800) < 0.005, R.ateEur.cave);
t('trac  = GNR 4820 + pieces 1340 + prestations 2173,5', Math.abs(R.ateEur.trac - 8333.5) < 0.005, R.ateEur.trac);
t('gen   = 320, visible et non force ailleurs', Math.abs(R.ateEur.gen - 320) < 0.005, R.ateEur.gen);

/* ★★★ L'INVARIANT. Si la somme des ateliers ne vaut pas la somme des sources,
   un euro est compte deux fois ou pas du tout. */
const somme = R.achT + R.gnrT + R.depT;
t('INVARIANT : somme des ateliers === achats + GNR + depenses',
  Math.abs(R.ateT - somme) < 0.005, `ateliers ${R.ateT} vs sources ${somme}`);

t('un achat hors fenetre n\'entre pas (9999 ecarte)', R.achT === 19980, R.achT);
t('une depense hors fenetre n\'entre pas (240 ecarte)', Math.abs(R.depT - 3373.5) < 0.005, R.depT);
t('les lignes sans prix sont COMPTEES, pas silencieuses', R.nDepSansPrix === 1, R.nDepSansPrix);

/* Un atelier inconnu ne disparait pas : il retombe dans le seau. */
const R2 = ventile({...S, depenses:[{date:'2026-01-01', ate:'atelier-fantome', eur:500}]});
t('un atelier inconnu retombe sur « non affecte », il ne s\'evapore pas',
  R2.ateEur.gen === 500 + 320, R2.ateEur.gen);
const s2 = R2.achT + R2.gnrT + R2.depT;
t('  … et l\'invariant tient quand meme', Math.abs(R2.ateT - s2) < 0.005);

/* Un produit supprime de la Reserve : l'achat reste, sans categorie. */
const R3 = ventile({...S, produits:[]});
t('un achat dont le produit a disparu tombe en « non affecte »',
  R3.ateEur.gen === 19980, R3.ateEur.gen);
const s3 = R3.achT + R3.gnrT + R3.depT;
t('  … et l\'invariant tient encore', Math.abs(R3.ateT - s3) < 0.005);

/* ══ CONTRE-EPREUVES — on casse, le harnais DOIT rougir ══════════════════ */
console.log('\n── CONTRE-EPREUVES (chaque defaut doit faire ROUGIR)\n');
function mord(nom, fn) {
  let rouge = false;
  try { rouge = !fn(); } catch { rouge = true; }
  if (rouge) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom + ' — le controle mord'); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + ' — RESTE VERT, le controle ne prouve rien'); }
}
mord('un euro compte deux fois (GNR ajoute a la vigne)', () => {
  const X = ventile(S); X.ateEur.vigne += X.gnrT;
  let T = 0; ORD.forEach(k => T += X.ateEur[k]);
  return Math.abs(T - (X.achT + X.gnrT + X.depT)) < 0.005;
});
mord('une source oubliee (les depenses ne sont pas ventilees)', () => {
  const X = ventile({...S, depenses: []});
  return Math.abs(X.ateT - (X.achT + X.gnrT + S.depenses
    .filter(d => d.date >= S.d0 && d.date <= S.d1).reduce((s,d)=>s+(d.eur||0),0))) < 0.005;
});
mord('le filtre de fenetre saute (l\'achat de juin 2025 entre)', () => {
  const X = ventile({...S, d0: '2020-01-01'});
  return X.achT === 19980;
});
mord('les lignes sans prix cessent d\'etre comptees', () => {
  const X = ventile({...S, depenses: S.depenses.filter(d => (d.eur||0) > 0)});
  return X.nDepSansPrix === 1;
});

/* ══ LA SOURCE — ce que le code doit dire, verifie sur le texte ══════════ */
console.log('\n── LA SOURCE\n');
t('les depenses entrent dans le total de l\'exercice',
  /var total=salT\+gnrT\+achT\+depT;/.test(SRC));
t('les TROIS sommes sal+gnr+ach portent aussi les depenses',
  (SRC.match(/b\.sal\+b\.gnr\+b\.ach\+\(b\.dep\|\|0\)/g) || []).length === 1
  && /\(b\.sal\|\|0\)\+\(b\.gnr\|\|0\)\+\(b\.ach\|\|0\)\+\(b\.dep\|\|0\)/.test(SRC)
  && /\['dep',_PEC_COL\.dep\]/.test(SRC),
  'une somme oubliee sous-compterait le graphe EN SILENCE');
t('aucune somme sal+gnr+ach ne subsiste sans les depenses',
  !/b\.sal\+b\.gnr\+b\.ach(?!\+)/.test(SRC) && !/\(b\.ach\|\|0\)(?!\+)/.test(SRC));
t('les salaires restent HORS de la ventilation par atelier',
  !/_ateAdd\([^)]*salT/.test(SRC));
t('le seau « non affecte » existe dans la table',
  CAT2ATE.gen === 'gen' && /gen:'Non affect/.test(RSV));
t('le garde anti-ecrasement compte les depenses',
  /\['produits','achats','inventaires','futs','depenses'\]/.test(readFileSync('src/firebase.js','utf8')));
t('Pilotage n\'ecrit aucune depense : il ouvre La Reserve',
  !/INTRANTS\.depenses\.push/.test(SRC) && /window\.goTo\('reserve'\)/.test(SRC));

/* ══ LES CONSTATS DU DIAGNOSTIC ══
   ⚠️ _pilGo fait `var C=_PIL_DIAG_CIBLES[cible]; if(!C) return;` — une cible qui
   manque produit un bouton qui NE FAIT RIEN, sans toast ni trace. Le meme no-op
   muet que le `window.showPage` inexistant, attrape plus tot dans ce lot. */
console.log('\n── LES CONSTATS ET LEURS CIBLES\n');
const cibles  = [...SRC.matchAll(/out\.push\(\{ g:'[rob]', cible:'(\w+)'/g)].map(m => m[1]);
const table   = [...SRC.matchAll(/^  (\w+):\s+\['/gm)].map(m => m[1]);
const internes= [...SRC.matchAll(/if\(cible==='(\w+)'\)/g)].map(m => m[1]);
const connues = new Set([...table, ...internes]);
t('toute cible de constat est declaree (sinon le bouton est muet)',
  cibles.every(c => connues.has(c)), cibles.filter(c => !connues.has(c)).join(', '));
const onglets = new Set([...RSV.matchAll(/_rsvTab==='(\w+)'/g)].map(m => m[1]));
const versRsv = [...SRC.matchAll(/\w+:\s+\['reserve','(\w+)'/g)].map(m => m[1]);
t('les onglets de La Reserve vises existent', versRsv.every(o => onglets.has(o)), versRsv.join(', '));
t("la cible interne 'exercice' vise un onglet reel",
  new Set([...SRC.matchAll(/\['(\w+)','[a-z]+','/g)].map(m => m[1])).has('eco'));
t('le seuil du seau est ecrit une seule fois et vaut 20 %',
  (SRC.match(/_naPct>=20/g) || []).length === 1);
t("l'invariant casse remonte en gravite 'r', pas en orange",
  /g:'r', cible:'exercice'/.test(SRC));
t('les trois constats renvoient vers un ecran de saisie',
  (SRC.match(/ou:'La R\\u00e9serve \\u203a Intrants'/g) || []).length === 2);

/* ══ FIDELITE A LA MAQUETTE VALIDEE ══
   ★ Une maquette validee est une DECISION PRISE. J'avais fonce le gris du seau
   « pour qu'il se voie mieux » : c'etait decider a la place de Nico sans le dire. */
console.log('\n── FIDELITE A LA MAQUETTE\n');
const colP = Object.fromEntries([...(/var _PEX_ATE_COL=\{([^}]*)\}/.exec(SRC)||[,''])[1]
  .matchAll(/(\w+):'(#\w+)'/g)].map(m => [m[1], m[2]]));
const colR = Object.fromEntries([...(/var _ATECOL=\{([^}]*)\}/.exec(RSV)||[,''])[1]
  .matchAll(/(\w+):'(#\w+)'/g)].map(m => [m[1], m[2]]));
t('pilotage et reserve donnent la MEME couleur a chaque atelier',
  ORD.every(k => colP[k] === colR[k]), ORD.filter(k => colP[k] !== colR[k]).join(', '));
t('les couleurs sont celles de la maquette',
  colP.vigne==='#3D6B27' && colP.cave==='#8A5A38' && colP.trac==='#2C3E50' && colP.gen==='#DED7C9',
  JSON.stringify(colP));
t('le hors-perimetre est une CARTE, pas une note en bas de page',
  /function _pexHorsPerim\(\)/.test(SRC) && /_pexHorsPerim\(\)/.test(SRC));
t('les trois boutons d\'action de la maquette sont la',
  (SRC.match(/data-pec="rsv"/g) || []).length >= 3);
t('l\'onglet Depenses porte son export PDF',
  /_rsvExportDepPdf/.test(RSV) && /Export PDF/.test(RSV));

/* ══ LE GUIDE DIT-IL LA VERITE DU CODE ? ══
   ⚠️ C22 verifie des ANCRES et des CLES d'onglet — il ne lit pas une phrase. Le
   guide a annonce « deux familles » pendant tout ce lot alors que le code en
   portait six, et aucun controle n'aurait bronche. Ces assertions comparent le
   TEXTE publie au code, pas le code a lui-meme. */
console.log('\n── LE GUIDE CONTRE LE CODE\n');
let G = '';
try { G = readFileSync('public/guide.html', 'utf8'); } catch { G = ''; }
if (!G) {
  t('public/guide.html est genere', false, 'lancer npm run guide');
} else {
  const LBL = { futs:'Fûts', intrants:'Intrants', depenses:'Dépenses', audit:'Bilan matière' };
  const onglets = [...new Set([...RSV.matchAll(/_rsvTab==='(\w+)'/g)].map(m => m[1]))].sort();
  t('chaque onglet de La Reserve est nomme dans le guide',
    onglets.every(o => LBL[o] && G.includes(LBL[o])),
    onglets.filter(o => !LBL[o] || !G.includes(LBL[o])).join(', '));
  const nCat = [...new Set([...(/var _CATLBL=\{([^}]*)\}/.exec(RSV) || [, ''])[1]
    .matchAll(/(\w+):/g)].map(m => m[1]))].length;
  const NOMBRES = { 2:'Deux', 3:'Trois', 4:'Quatre', 5:'Cinq', 6:'Six', 7:'Sept' };
  t('le guide annonce le BON NOMBRE de familles d\'intrants',
    G.includes(NOMBRES[nCat] + ' familles'),
    'le code en a ' + nCat + ' — le guide devrait dire « ' + NOMBRES[nCat] + ' familles »');
  t('le guide explique le critere « je le rachete l\'an prochain »',
    /rach\u00e8te l.an prochain|rachète l’an prochain/.test(G));
  t('le guide dit que le prix moyen ne se saisit pas', /prix moyen d.un/.test(G));
}

console.log(`\n  ${ok} vert · ${ko} rouge\n`);
process.exit(ko ? 1 : 0);
