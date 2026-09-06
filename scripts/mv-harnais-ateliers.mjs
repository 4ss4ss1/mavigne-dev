/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LES CONSOMMABLES PAR ATELIER
   Rejoue la ventilation de _pexData, puis REINTRODUIT chaque defaut et exige
   que le harnais ROUGISSE. Un harnais qu'on n'a pas vu rougir ne prouve rien.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
const SRC = readFileSync('src/pilotage.js', 'utf8');
const RSV = readFileSync('src/reserve.js', 'utf8');

let ok = 0, ko = 0;
const t = (n, c, d) => { if (c) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d !== undefined ? '\n      → ' + d : '')); } };

/* La table des ateliers est LUE dans reserve.js, jamais recopiee ici : un
   harnais qui teste sa propre copie est vert quoi qu'il arrive. */
const mCat = RSV.match(/var _CAT2ATE=\{([^}]*)\}/);
const CAT2ATE = {};
for (const m of (mCat ? mCat[1] : '').matchAll(/(\w+):'(\w+)'/g)) CAT2ATE[m[1]] = m[2];
const ORD = ['vigne', 'cave', 'trac', 'gen'];

function ventile({ achats, produits, gnr, reparations, d0, d1 }) {
  const prodBy = {}; produits.forEach(p => prodBy[p.id] = p);
  const ateEur = {}; ORD.forEach(k => ateEur[k] = 0);
  const add = (k, e) => { if (!(e > 0)) return; if (!(k in ateEur)) k = 'gen'; ateEur[k] += e; };

  add('trac', gnr);

  const byCat = {}; let achT = 0;
  achats.forEach(a => {
    if (!a.date) return;
    const iso = String(a.date).slice(0, 10);
    if (iso < d0 || iso > d1) return;
    const cat = (prodBy[a.prodId] || {}).cat || 'gen';
    byCat[cat] = (byCat[cat] || 0) + (Number(a.prix) || 0);
    achT += Number(a.prix) || 0;
  });
  Object.keys(byCat).forEach(c => add(CAT2ATE[c] || 'gen', byCat[c]));

  /* ⚠️⚠️ `eur != null` et NON `eur > 0`. Un montant a ZERO est une VALEUR
     (garantie, geste commercial), pas une absence. Les confondre laisserait une
     reparation deja reglee « a chiffrer » a vie. */
  let repT = 0, nRepSansPrix = 0;
  reparations.forEach(r => {
    if (!r.retour) return;
    const iso = String(r.retour).slice(0, 10);
    if (iso < d0 || iso > d1) return;
    const e = (r.eur != null && isFinite(Number(r.eur))) ? Number(r.eur) : null;
    if (e == null) { nRepSansPrix++; return; }
    repT += e; add('trac', e);
  });

  let ateT = 0; ORD.forEach(k => ateT += ateEur[k]);
  return { ateEur, ateT, achT, gnrT: gnr, repT, nRepSansPrix };
}

/* ══ SCENARIO — Cote de Nuits, exercice 2025-2026 ═════════════════════════ */
const S = {
  d0: '2025-08-01', d1: '2026-07-31', gnr: 4820,
  produits: [{id:'p1',cat:'phyto'},{id:'p2',cat:'oeno'},{id:'p3',cat:'vigne'},
             {id:'p4',cat:'cave'},{id:'p5',cat:'trac'},{id:'p6',cat:'gen'}],
  achats: [
    {prodId:'p1', date:'2026-05-12', prix:10540},
    {prodId:'p3', date:'2025-11-04', prix:3180},
    {prodId:'p2', date:'2025-09-20', prix:2960},
    {prodId:'p4', date:'2025-10-02', prix:1640},
    {prodId:'p5', date:'2026-01-08', prix:1340},
    {prodId:'p6', date:'2026-02-11', prix:320},
    {prodId:'p1', date:'2025-06-30', prix:9999},   // HORS fenetre
    {prodId:'p3', date:'2026-03-01', prix:0}       // saisi a zero
  ],
  reparations: [
    {depuis:'2026-03-08', retour:'2026-03-12', motif:'Révision 1000 h', eur:780},
    {depuis:'2026-01-20', retour:'2026-01-21', motif:'Flexible',        eur:246.5},
    {depuis:'2025-11-16', retour:'2025-11-18', motif:'Révision',        eur:620},
    {depuis:'2025-10-03', retour:'2025-10-06', motif:'Pompe attelage',  eur:418},
    {depuis:'2025-09-01', retour:'2025-09-02', motif:'Démarreur',       eur:0},     // SANS FRAIS
    {depuis:'2026-06-10', retour:'2026-06-12', motif:'Pneu',            eur:null},  // A CHIFFRER
    {depuis:'2025-07-25', retour:'2025-07-28', motif:'Pulvérisateur',   eur:240}    // HORS fenetre
  ]
};

console.log('\n── LES CONSOMMABLES PAR ATELIER\n');
t('la table des ateliers est lue dans reserve.js', Object.keys(CAT2ATE).length === 6);
const R = ventile(S);
console.log('     ' + ORD.map(k => k + '=' + R.ateEur[k]).join('  '));
t('vigne = phyto 10540 + fournitures 3180', R.ateEur.vigne === 13720, R.ateEur.vigne);
t('cave  = oeno 2960 + fournitures 1640',   R.ateEur.cave === 4600,  R.ateEur.cave);
t('trac  = GNR 4820 + pieces 1340 + reparations 2064,5',
  Math.abs(R.ateEur.trac - 8224.5) < 0.005, R.ateEur.trac);
t('gen   = 320, visible et non force ailleurs', R.ateEur.gen === 320, R.ateEur.gen);

const somme = R.achT + R.gnrT + R.repT;
t('INVARIANT : ateliers === achats + GNR + reparations',
  Math.abs(R.ateT - somme) < 0.005, `${R.ateT} vs ${somme}`);

console.log('\n── LES TROIS ETATS D\'UN PRIX\n');
t('un montant a ZERO est chiffre, pas « a chiffrer »', R.nRepSansPrix === 1, R.nRepSansPrix);
t('  … et il n\'ajoute rien au total', Math.abs(R.repT - 2064.5) < 0.005, R.repT);
t('un test truthy compterait 2 manquants au lieu de 1 — la preuve que != null est requis',
  S.reparations.filter(r => r.retour >= S.d0 && r.retour <= S.d1 && !r.eur).length === 2);
t('une reparation hors fenetre n\'entre pas (240 ecarte)', !String(R.repT).includes('2304'));
t('un achat hors fenetre n\'entre pas (9999 ecarte)', R.achT === 19980, R.achT);

console.log('\n── LES CAS LIMITES\n');
const R2 = ventile({ ...S, produits: [] });
t('un achat dont le produit a disparu tombe en « non affecte »', R2.ateEur.gen === 19980);
t('  … et l\'invariant tient', Math.abs(R2.ateT - (R2.achT + R2.gnrT + R2.repT)) < 0.005);
const R3 = ventile({ ...S, reparations: [] });
t('aucune reparation : le total se replie sans casser',
  R3.repT === 0 && Math.abs(R3.ateT - (R3.achT + R3.gnrT)) < 0.005);

/* ★ Les futs sont ACQUIS mais pas CONSOMMES : ils figurent dans Achats et
   n'entrent PAS dans les consommables. Deux ecrans, deux perimetres — c'est
   voulu, et l'ecran le dit dans sa carte « ce qui n'entre pas ». */
/* TROU TROUVE PAR CONTRE-EPREUVE : tester l'ABSENCE d'un motif textuel ne prouve
   rien — injecter `_ateAdd('cave',9)` ne contenait pas « futs » et passait.
   On liste les appels REELS et on exige exactement trois entrees. */
const appels = [...SRC.matchAll(/^\s*_ateAdd\((?!k,lib)(.+)$/gm)].map(m => m[1].slice(0, 30));
t('la ventilation a exactement trois entrees', appels.length === 3, appels.length + ' : ' + appels.join(' | '));
t('  carburant -> tracteur', appels.some(x => /^'trac','Carburant GNR'/.test(x)));
t('  achats -> atelier deduit de la categorie', appels.some(x => /^_pexAteDe\(cat\)/.test(x)));
t('  reparations -> tracteur', appels.some(x => /^'trac', f,/.test(x)));
t('aucun fut n\'alimente les consommables (deux perimetres, c\'est voulu)',
  !appels.some(x => /fut/i.test(x)));

console.log('\n── CONTRE-EPREUVES (chaque defaut doit faire ROUGIR)\n');
const mord = (n, fn) => { let rouge; try { rouge = !fn(); } catch { rouge = true; }
  if (rouge) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + n + ' — mord'); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — RESTE VERT, ne prouve rien'); } };
mord('un euro compte deux fois (GNR ajoute a la vigne)', () => {
  const X = ventile(S); X.ateEur.vigne += X.gnrT;
  let T = 0; ORD.forEach(k => T += X.ateEur[k]);
  return Math.abs(T - (X.achT + X.gnrT + X.repT)) < 0.005; });
mord('le filtre de fenetre saute', () => ventile({ ...S, d0: '2020-01-01' }).achT === 19980);
mord('« sans frais » traite comme un vide', () => {
  const X = ventile({ ...S, reparations: S.reparations.map(r => r.eur === 0 ? { ...r, eur: null } : r) });
  return X.nRepSansPrix === 1; });

console.log('\n── LA SOURCE\n');
t('les reparations entrent dans le total', /var total=salT\+gnrT\+achT\+repT;/.test(SRC));
t('les TROIS sommes mensuelles portent le 4e poste',
  /b\.sal\+b\.gnr\+b\.ach\+\(b\.dep\|\|0\)/.test(SRC) && /\(b\.ach\|\|0\)\+\(b\.dep\|\|0\)/.test(SRC)
  && /\['dep',_PEC_COL\.dep\]/.test(SRC));
t('aucune somme ne subsiste sans le 4e poste',
  !/b\.sal\+b\.gnr\+b\.ach(?!\+)/.test(SRC) && !/\(b\.ach\|\|0\)(?!\+)/.test(SRC));
t('les salaires restent HORS de la ventilation', !/_ateAdd\([^)]*salT/.test(SRC));
t('Pilotage ne cree aucun fait metier',
  !/INTRANTS\.(achats|futs)\.push/.test(SRC) && /window\.goTo\('reserve'\)/.test(SRC));

console.log('\n── LES CONSTATS ET LEURS CIBLES\n');
/* ⚠️ _pilGo fait `if(!C) return;` — une cible absente donne un bouton MUET,
   sans toast ni trace. Deux fois rencontre dans ce chantier. */
const cibles = [...SRC.matchAll(/out\.push\(\{ g:'[rob]', cible:'(\w+)'/g)].map(m => m[1]);
const connues = new Set([...[...SRC.matchAll(/^  (\w+):\s+\['/gm)].map(m => m[1]),
                         ...[...SRC.matchAll(/if\(cible==='(\w+)'\)/g)].map(m => m[1])]);
t('toute cible de constat est declaree', cibles.every(c => connues.has(c)),
  cibles.filter(c => !connues.has(c)).join(', '));
const onglets = new Set([...RSV.matchAll(/_rsvTab==='(\w+)'/g)].map(m => m[1]));
t('les onglets de La Reserve vises existent',
  [...SRC.matchAll(/\w+:\s+\['reserve','(\w+)'/g)].map(m => m[1]).every(o => onglets.has(o)));
t('les onglets vises par un BOUTON existent aussi (2e chemin)',
  [...SRC.matchAll(/data-pec="rsv" data-v="(\w+)"/g)].map(m => m[1]).every(o => onglets.has(o)),
  [...SRC.matchAll(/data-pec="rsv" data-v="(\w+)"/g)].map(m => m[1]).filter(o => !onglets.has(o)).join(', '));
t('le seuil du seau vaut 20 %', (SRC.match(/_naPct>=20/g) || []).length === 1);
t('l\'invariant casse remonte en gravite \'r\'', /g:'r', cible:'exercice'/.test(SRC));

console.log('\n── FIDELITE A LA MAQUETTE VALIDEE\n');
const col = re => Object.fromEntries([...(re.exec(SRC) || re.exec(RSV) || [, ''])[1]
  .matchAll(/(\w+):'(#\w+)'/g)].map(m => [m[1], m[2]]));
const colP = col(/var _PEX_ATE_COL=\{([^}]*)\}/);
const colR = Object.fromEntries([...(/var _ATECOL=\{([^}]*)\}/.exec(RSV) || [, ''])[1]
  .matchAll(/(\w+):'(#\w+)'/g)].map(m => [m[1], m[2]]));
t('pilotage et reserve donnent la MEME couleur a chaque atelier',
  ORD.every(k => colP[k] === colR[k]));
t('les couleurs sont celles de la maquette',
  colP.vigne === '#3D6B27' && colP.cave === '#8A5A38' && colP.trac === '#2C3E50' && colP.gen === '#DED7C9');
t('le hors-perimetre est une CARTE, pas une note', /function _pexHorsPerim\(\)/.test(SRC));
t('la sous-vue Achats porte le filtre « a chiffrer »', /data-pec="pachf"/.test(SRC));

console.log('\n── LE GUIDE CONTRE LE CODE\n');
/* ⚠️ C22 verifie des ANCRES, pas des phrases : le guide a annonce « deux
   familles » alors que le code en portait six, sans que rien ne bronche. */
let G = ''; try { G = readFileSync('public/guide.html', 'utf8'); } catch { G = ''; }
if (!G) { t('public/guide.html est genere', false, 'lancer npm run guide'); }
else {
  const LBL = { futs: 'Fûts', intrants: 'Intrants', audit: 'Bilan matière' };
  t('chaque onglet de La Reserve est nomme dans le guide',
    [...onglets].every(o => LBL[o] && G.includes(LBL[o])),
    [...onglets].filter(o => !LBL[o] || !G.includes(LBL[o])).join(', '));
  const nCat = [...new Set([...(/var _CATLBL=\{([^}]*)\}/.exec(RSV) || [, ''])[1]
    .matchAll(/(\w+):/g)].map(m => m[1]))].length;
  const N = { 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six', 7: 'Sept' };
  t('le guide annonce le BON NOMBRE de familles', G.includes(N[nCat] + ' familles'),
    'le code en a ' + nCat);
  t('le guide dit que le prix moyen se calcule seul', /prix moyen/i.test(G));
  t('le guide renvoie vers l\'ecran ou l\'on chiffre', /\u00c9conomie \u203a Achats|Économie › Achats/.test(G));
  t('le guide explique les trois etats d\'un prix', /sans frais/i.test(G) && /\u00e0 chiffrer|à chiffrer/.test(G));
}

console.log(`\n  ${ok} vert · ${ko} rouge\n`);
process.exit(ko ? 1 : 0);
