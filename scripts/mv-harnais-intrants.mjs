/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LES INTRANTS DE CUVERIE (lot INTR-1)
   Lancer :          node scripts/mv-harnais-intrants.mjs
   Contre-épreuves : node scripts/mv-harnais-intrants.mjs --contre

   CE QU'IL EMPÊCHE DE REVENIR
   1. LE GARDE-FOU DE STOCK. Le réflexe, en branchant une sortie sur un stock,
      est d'écrire « if(dose > stock) return ». Ce garde-fou refuserait
      d'enregistrer un tanin DÉJÀ dans la cuve parce qu'une facture n'est pas
      saisie : il ferait mentir le suivi pour protéger la comptabilité. Le
      négatif est une information — La Réserve sait déjà le nommer « écart ».
   2. LE VOLUME PRIS POUR ARGENT COMPTANT. `cuve.volume_hl` est la CONTENANCE,
      pas le contenu (faute RDT-1). Une dose juste sur un volume faux donne une
      quantité fausse, affichée avec l'aplomb d'un calcul. Tant que la cuve
      n'est pas décuvée, `vol_src` vaut 'estime' et l'écran le dit.
   3. LE CONSOMMÉ NON FILTRÉ. `cave_so2` additionne TOUT le soufre de la cave
      sans regarder le produit. Avec quatre produits œno au catalogue, ce
      raccourci attribuerait à chacun la totalité. `cuvier` filtre par
      `prod_id`, et c'est ce filtre qui est gravé ici.
   4. L'OUBLI AU REGISTRE. Un type absent de RM_TYPES n'entre PAS au registre
      des manipulations. Trois adjonctions muettes au contrôle bio, c'est
      exactement l'argument commercial qui tombe.

   Méthode C20 : les fonctions sont extraites de src/cave.js et src/reserve.js
   puis exécutées pour de vrai. Aucune formule n'est réécrite ici — un harnais
   qui recopie le calcul qu'il teste ne prouve rien.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const CAVE = readFileSync('src/cave.js', 'utf8');
const RSV  = readFileSync('src/reserve.js', 'utf8');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom); }
}

/* ══ EXTRACTION — dans l'ordre du fichier (str.index avant de trancher) ═════ */
function extraireFn(SRC, nom, ou) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de ' + ou + ' : ' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
/* Balayage à crochets équilibrés, pas de recherche de « \n]; » : `_VEND_INTR`
   tient sur une seule ligne, et un motif de fin ferait avaler tout ce qui
   sépare la déclaration du tableau suivant. */
function extraireVar(SRC, nom, ou) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*[\\[{]', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de ' + ou + ' : ' + nom); process.exit(1); }
  const dep = m.index;
  let i = dep; while (SRC[i] !== '[' && SRC[i] !== '{') i++;
  const ouvre = SRC[i], ferme = ouvre === '[' ? ']' : '}';
  let d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === ouvre) d++;
    else if (SRC[j] === ferme && --d === 0) return [dep, SRC.slice(dep, j + 2)];
  }
  console.error('crochet non fermé : ' + nom); process.exit(1);
}

const FN_CAVE = ['_vendEstIntrant', '_vendIntrUnite', '_vendIntrUniteQ', '_vendIntrVol',
  '_vendIntrVolLbl', '_vendIntrQte', '_vendIntrQteTxt', '_vendOpDet', '_vendCuvF1',
  '_vendMoyLbl', '_vendMoyTbl', '_vendVolLoge', '_caveVolL', '_rmDetail', '_rmF'];
const VA_CAVE = ['_VEND_INTR', '_VEND_OPS', '_VEND_FROID', '_VEND_CHAUD', 'RM_TYPES', 'RM_FAMILLES'];

const morceaux = []
  .concat(FN_CAVE.map(n => extraireFn(CAVE, n, 'src/cave.js')))
  .concat(VA_CAVE.map(n => extraireVar(CAVE, n, 'src/cave.js')))
  .sort((a, b) => a[0] - b[0]).map(x => x[1]);
const BLOC_CAVE = morceaux.join('\n');

const BLOC_RSV = ['_consoCuvier', '_consoCuvierEstime']
  .map(n => extraireFn(RSV, n, 'src/reserve.js'))
  .sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

/* ══ BOUCHONS — minimaux ═══════════════════════════════════════════════════ */
function monterCave(mutation) {
  const corps = mutation ? mutation(BLOC_CAVE) : BLOC_CAVE;
  return new Function('CAVE_ELEVAGE', 'window',
    corps + '\nreturn {_vendEstIntrant,_vendIntrQte,_vendIntrQteTxt,_vendIntrVol,'
          + '_vendIntrUnite,_vendIntrUniteQ,_vendOpDet,_rmDetail,_VEND_OPS,RM_TYPES,RM_FAMILLES};'
  )({ cuvees: [] }, {});
}
function monterRsv(cv, mutation) {
  const corps = mutation ? mutation(BLOC_RSV) : BLOC_RSV;
  const w = { CAVE_VENDANGE: cv };
  return new Function('window', corps + '\nreturn {_consoCuvier,_consoCuvierEstime};')(w);
}

/* ══ LE CAS RÉEL — cuve 4, Charmes 2026, 50 hL de contenance ═══════════════ */
const PROD_TAN = 'p_tanin';
const PROD_ENZ = 'p_enz';
function cuves() {
  return {
    cuves_vinif: [
      { id: 'cv1', nom: 'Cuve 4', volume_hl: 50, operations: [
        { id: 'o1', type: 'tanins',   date: '2026-09-22', prod_id: PROD_TAN, produit: '\u0152notanin SR',
          dose: 24, dose_unit: 'g/hL', volume_hl: 42, vol_src: 'estime', qte: 1.008, qte_unite: 'kg' },
        { id: 'o2', type: 'enzymes',  date: '2026-09-19', prod_id: PROD_ENZ, produit: 'Lallzyme EX',
          dose: 3,  dose_unit: 'g/hL', volume_hl: 42, vol_src: 'estime', qte: 0.126, qte_unite: 'kg' },
        { id: 'o3', type: 'saignee',  date: '2026-09-20', volume_hl: 5 }
      ] },
      { id: 'cv2', nom: 'Cuve 7', volume_hl: 30, decuvage: { date: '2026-10-02' }, vol_decuve_hl: 26,
        operations: [
        { id: 'o4', type: 'tanins',   date: '2026-09-30', prod_id: PROD_TAN, produit: '\u0152notanin SR',
          dose: 20, dose_unit: 'g/hL', volume_hl: 26, vol_src: 'mesure', qte: 0.52, qte_unite: 'kg' }
      ] }
    ]
  };
}

if (!CONTRE) {
  const C = monterCave();

  console.log('\n\u2500\u2500 1. Les trois types existent et sont reconnus \u2500\u2500');
  for (const k of ['tanins', 'enzymes', 'bentonite']) {
    pose(C._vendEstIntrant(k), k + ' est un intrant');
    pose(C._VEND_OPS.some(o => o.k === k), k + ' est dans _VEND_OPS');
  }
  pose(!C._vendEstIntrant('so2'), 'le SO\u2082 n\u2019est PAS un intrant de ce lot');
  pose(!C._vendEstIntrant('levurage'), 'le levurage garde son texte libre');

  console.log('\n\u2500\u2500 2. La quantit\u00e9 : dose \u00d7 volume \u00f7 1000 \u2500\u2500');
  pose(C._vendIntrQte(24, 42) === 1.008, '24 g/hL sur 42 hL = 1,008 kg');
  pose(C._vendIntrQte(3, 42) === 0.126, '3 g/hL sur 42 hL = 0,126 kg');
  pose(C._vendIntrQte(0, 42) === 0, 'dose nulle \u2192 0');
  pose(C._vendIntrQte(24, 0) === 0, 'volume nul \u2192 0');
  pose(C._vendIntrQte(NaN, 42) === 0, 'dose absente \u2192 0, jamais NaN');

  console.log('\n\u2500\u2500 3. L\u2019unit\u00e9 d\u00e9coule du produit, jamais de la saisie \u2500\u2500');
  pose(C._vendIntrUnite({ unite: 'kg' }) === 'g/hL', 'produit en kg \u2192 dose en g/hL');
  pose(C._vendIntrUnite({ unite: 'L' }) === 'mL/hL', 'produit en L \u2192 dose en mL/hL');
  pose(C._vendIntrUniteQ({ unite: 'L' }) === 'L', 'quantit\u00e9 d\u2019un liquide en L');
  pose(C._vendIntrUniteQ(null) === 'kg', 'sans produit, le kilo par d\u00e9faut');

  console.log('\n\u2500\u2500 4. Sous le kilo, on affiche des grammes \u2500\u2500');
  const t126 = C._vendIntrQteTxt(0.126, 'kg');
  pose(t126.n === '126' && t126.u === 'g', '0,126 kg s\u2019affiche 126 g');
  const t1008 = C._vendIntrQteTxt(1.008, 'kg');
  pose(t1008.n === '1,01' && t1008.u === 'kg', '1,008 kg s\u2019affiche 1,01 kg');
  pose(C._vendIntrQteTxt(0.05, 'L').u === 'mL', '0,05 L s\u2019affiche en mL');
  pose(C._vendIntrQteTxt(0, 'kg').n === '\u2014', 'rien \u00e0 dire \u2192 tiret, jamais z\u00e9ro');

  console.log('\n\u2500\u2500 5. Le volume porte sa source \u2500\u2500');
  const cv = cuves();
  const vEst = C._vendIntrVol(cv.cuves_vinif[0]);
  pose(vEst.src === 'estime', 'cuve non d\u00e9cuv\u00e9e \u2192 volume estim\u00e9');
  pose(vEst.hl === 50, 'et c\u2019est la CONTENANCE qui sert de rep\u00e8re, dite comme telle');
  const vMes = C._vendIntrVol(cv.cuves_vinif[1]);
  pose(vMes.src === 'mesure', 'cuve d\u00e9cuv\u00e9e \u2192 volume mesur\u00e9');
  pose(vMes.hl === 26, 'et c\u2019est le volume log\u00e9, pas la contenance');

  console.log('\n\u2500\u2500 6. Le d\u00e9tail court dit tout, y compris l\u2019estimation \u2500\u2500');
  const d1 = C._vendOpDet(cv.cuves_vinif[0].operations[0]);
  pose(/\u0152notanin SR/.test(d1), 'le produit est nomm\u00e9');
  pose(/24 g\/hL/.test(d1), 'la dose est dite avec son unit\u00e9');
  pose(/1,01 kg/.test(d1), 'la quantit\u00e9 r\u00e9elle est dite');
  pose(/volume estim\u00e9/.test(d1), 'le volume estim\u00e9 est ANNONC\u00c9');
  pose(!/volume estim\u00e9/.test(C._vendOpDet(cv.cuves_vinif[1].operations[0])),
       'un volume mesur\u00e9 ne porte pas la mention');
  const dSans = C._vendOpDet({ type: 'bentonite', dose: 40, volume_hl: 20, qte: 0.8, vol_src: 'saisi' });
  pose(/hors bilan mati\u00e8re/.test(dSans), 'sans produit, l\u2019\u00e9cran le DIT');
  pose(C._vendOpDet(cv.cuves_vinif[0].operations[2]) === '5 hL',
       'la saign\u00e9e garde son propre d\u00e9tail \u2014 aucun type n\u2019a d\u00e9bord\u00e9');

  console.log('\n\u2500\u2500 7. Le registre des manipulations les voit \u2500\u2500');
  for (const k of ['tanins', 'enzymes', 'bentonite']) {
    pose(!!C.RM_TYPES[k], k + ' entre au registre');
    pose(C.RM_TYPES[k] && C.RM_TYPES[k].fam === 'intrant', k + ' est rang\u00e9 en Adjonctions');
  }
  pose(C.RM_FAMILLES.some(f => f.k === 'intrant'), 'la famille Adjonctions existe');
  const rd = C._rmDetail(cv.cuves_vinif[0].operations[0]);
  pose(/\(estim\u00e9\)/.test(rd), 'le registre \u00e9crit « (estim\u00e9) » sur un volume non mesur\u00e9');
  pose(/1,008 kg/.test(rd), 'le registre donne la quantit\u00e9 \u00e0 trois d\u00e9cimales');
  pose(!/\(estim\u00e9\)/.test(C._rmDetail(cv.cuves_vinif[1].operations[0])),
       'et se tait quand le volume est mesur\u00e9');

  console.log('\n\u2500\u2500 8. Le consomm\u00e9 est filtr\u00e9 PAR PRODUIT \u2500\u2500');
  const R = monterRsv(cuves());
  pose(Math.abs(R._consoCuvier(PROD_TAN, null) - 1.528) < 1e-9,
       'le tanin cumule ses deux cuves (1,008 + 0,52)');
  pose(Math.abs(R._consoCuvier(PROD_ENZ, null) - 0.126) < 1e-9,
       'l\u2019enzyme ne re\u00e7oit QUE sa propre quantit\u00e9');
  pose(R._consoCuvier('p_inconnu', null) === 0, 'un produit jamais utilis\u00e9 consomme z\u00e9ro');
  pose(R._consoCuvier(null, null) === 0, 'sans identifiant, rien n\u2019est attribu\u00e9');
  pose(Math.abs(R._consoCuvier(PROD_TAN, 'o1') - 0.52) < 1e-9,
       'l\u2019op\u00e9ration en cours de correction est exclue de la projection');

  console.log('\n\u2500\u2500 9. Les volumes estim\u00e9s se comptent \u2500\u2500');
  pose(R._consoCuvierEstime(PROD_TAN) === 1, 'une seule adjonction de tanin sur volume estim\u00e9');
  pose(R._consoCuvierEstime(PROD_ENZ) === 1, 'l\u2019enzyme aussi');
  pose(R._consoCuvierEstime('p_inconnu') === 0, 'et z\u00e9ro ailleurs');

  console.log('\n\u2500\u2500 10. \u2605 LE N\u00c9GATIF EST LIBRE \u2500\u2500');
  const stock = 0.4 - R._consoCuvier(PROD_TAN, null);
  pose(stock < 0, 'un stock de 0,4 kg pour 1,528 kg consomm\u00e9s DEVIENT n\u00e9gatif');
  pose(!/Stock insuffisant/i.test(CAVE), 'aucun refus « stock insuffisant » dans cave.js');
  pose(!/Stock insuffisant/i.test(RSV), 'aucun refus « stock insuffisant » dans reserve.js');
  const zoneSave = CAVE.slice(CAVE.indexOf('function saveVendOp'),
                              CAVE.indexOf('function _vendOpDel'));
  pose(!/Math\.max\(0[\s,]/.test(zoneSave.replace(/c\.volume_hl=Math\.max\(0,[^\n]*\n/, '')),
       'aucun \u00e9cr\u00eatage \u00e0 z\u00e9ro sur les quantit\u00e9s d\u2019intrant');
  const zoneCalc = CAVE.slice(CAVE.indexOf('function _vendIntrCalc'),
                              CAVE.indexOf('window._vendEstIntrant'));
  pose(/s\'enregistre quand m/.test(zoneCalc) || /enregistre quand m\\u00eame/.test(zoneCalc),
       'l\u2019\u00e9cran promet explicitement d\u2019enregistrer malgr\u00e9 l\u2019\u00e9cart');

  console.log('\n\u2500\u2500 11. La cha\u00eene est branch\u00e9e de bout en bout \u2500\u2500');
  pose(/_rsvStockPour/.test(CAVE) && /window\._rsvStockPour/.test(RSV),
       'le Cuvier lit le stock par la porte export\u00e9e de La R\u00e9serve');
  pose(/cat==='oeno'\)\?'cuvier'/.test(RSV), 'un nouvel intrant \u0153no part en source « cuvier »');
  pose(/<option value="cuvier">/.test(RSV), 'la source est offerte au formulaire produit');
  pose(/_rsvNegEstime/.test(RSV), 'l\u2019alerte de n\u00e9gatif nomme la cause « volume estim\u00e9 »');
  pose(/window\.INTRANTS/.test(CAVE.slice(CAVE.indexOf('function _vendIntrProds'),
        CAVE.indexOf('function _vendIntrProd('))),
       'La R\u00e9serve est lue par window, jamais import\u00e9e \u2014 cave.js charge avant');

} else {
  /* ══ CONTRE-ÉPREUVES ═══════════════════════════════════════════════════════
     Chaque défaut est réintroduit. Une contre-épreuve qui ne peut pas rougir
     ne prouve rien : le motif est donc vérifié avant d'être muté. */
  console.log('\n\u2500\u2500 CONTRE-\u00c9PREUVES \u2014 chaque d\u00e9faut r\u00e9introduit doit rougir \u2500\u2500');

  const casCave = [
    ['C1 \u00b7 la contenance relue comme un contenu mesur\u00e9',
     b => b.replace('  var m=_vendVolLoge(c);\n  if(m>0) return {hl:m, src:\'mesure\'};',
                    '  var m=(c&&c.volume_hl)||0;\n  if(m>0) return {hl:m, src:\'mesure\'};'),
     C => C._vendIntrVol({ volume_hl: 50 }).src === 'estime',
     'le volume redevient « mesur\u00e9 » sans d\u00e9cuvage'],
    ['C2 \u00b7 division par mille oubli\u00e9e (g pris pour des kg)',
     b => b.replace('return dose*vol/1000;', 'return dose*vol;'),
     C => C._vendIntrQte(24, 42) === 1.008,
     '1,008 kg devient 1 008 kg'],
    ['C3 \u00b7 l\u2019unit\u00e9 de dose laiss\u00e9e \u00e0 la saisie',
     b => b.replace("function _vendIntrUnite(p){ return (p&&p.unite==='L')?'mL/hL':'g/hL'; }",
                    "function _vendIntrUnite(p){ return 'g/hL'; }"),
     C => C._vendIntrUnite({ unite: 'L' }) === 'mL/hL',
     'un liquide se dose en g/hL \u2014 facteur mille'],
    ['C4 \u00b7 la mention « volume estim\u00e9 » retir\u00e9e du d\u00e9tail',
     b => b.replace("if(o.vol_src==='estime') di.push('volume estim\\u00e9');", ''),
     C => /volume estim/.test(C._vendOpDet({ type: 'tanins', produit: 'X', dose: 24,
            qte: 1.008, qte_unite: 'kg', vol_src: 'estime', prod_id: 'p' })),
     'le suivi ne dit plus d\u2019o\u00f9 vient son volume'],
    ['C5 \u00b7 les trois types retir\u00e9s du registre',
     b => b.replace(/  tanins:\s+\{fam:'intrant',\s+lbl:'Tanins'\},\n/, ''),
     C => !!C.RM_TYPES.tanins,
     'le tanin dispara\u00eet du registre des manipulations'],
    ['C6 \u00b7 le registre tait l\u2019estimation',
     b => b.replace("+ (o.vol_src === 'estime' ? ' (estim\\u00e9)' : '')", "+ ''"),
     C => /\(estim/.test(C._rmDetail({ type: 'tanins', produit: 'X', dose: 24,
            volume_hl: 42, vol_src: 'estime', qte: 1.008, qte_unite: 'kg' })),
     'le contr\u00f4le croit le volume mesur\u00e9']
  ];
  for (const [nom, mut, verif, effet] of casCave) {
    if (mut(BLOC_CAVE) === BLOC_CAVE) { pose(false, nom + ' \u2014 motif introuvable, la contre-\u00e9preuve ne peut pas rougir'); continue; }
    let rougit = false;
    try { rougit = !verif(monterCave(mut)); } catch (e) { rougit = true; }
    console.log('   ' + nom + ' \u2192 ' + effet);
    pose(rougit, nom + ' fait bien rougir');
  }

  const casRsv = [
    ['C7 \u00b7 le consomm\u00e9 ne filtre plus par produit',
     b => b.replace("if(!o||o.prod_id!==pid) return;", "if(!o) return;"),
     R => Math.abs(R._consoCuvier('p_enz', null) - 0.126) < 1e-9,
     'l\u2019enzyme se voit attribuer aussi les tanins'],
    ['C8 \u00b7 l\u2019exclusion de l\u2019op\u00e9ration corrig\u00e9e supprim\u00e9e',
     b => b.replace("if(exclId&&o.id===exclId) return;", ""),
     R => Math.abs(R._consoCuvier('p_tanin', 'o1') - 0.52) < 1e-9,
     'la correction compte deux fois dans la projection'],
    ['C9 \u00b7 le compteur de volumes estim\u00e9s aveugl\u00e9',
     b => b.replace("o.vol_src==='estime'&&", ""),
     R => R._consoCuvierEstime('p_tanin') === 1,
     'l\u2019alerte annonce des estimations l\u00e0 o\u00f9 tout est mesur\u00e9']
  ];
  for (const [nom, mut, verif, effet] of casRsv) {
    if (mut(BLOC_RSV) === BLOC_RSV) { pose(false, nom + ' \u2014 motif introuvable, la contre-\u00e9preuve ne peut pas rougir'); continue; }
    let rougit = false;
    try { rougit = !verif(monterRsv(cuves(), mut)); } catch (e) { rougit = true; }
    console.log('   ' + nom + ' \u2192 ' + effet);
    pose(rougit, nom + ' fait bien rougir');
  }

  /* ★ LA CONTRE-ÉPREUVE DU LOT : réintroduire le garde-fou de stock. Elle ne
     porte pas sur une fonction extraite mais sur le TEXTE de saveVendOp — le
     défaut qu'on veut empêcher est une ligne qu'on n'a pas écrite. */
  const saveAvecGarde = CAVE.replace(
    "    op.qte=_vendIntrQte(op.dose,op.volume_hl);",
    "    if(op.qte>_stockDispo(op.prod_id)){ showToast('Stock insuffisant'); return; }\n    op.qte=_vendIntrQte(op.dose,op.volume_hl);");
  pose(saveAvecGarde !== CAVE && /Stock insuffisant/.test(saveAvecGarde) && !/Stock insuffisant/.test(CAVE),
       'C10 \u00b7 le garde-fou de stock, r\u00e9introduit, serait bien d\u00e9tect\u00e9 \u2014 et il est absent');
}

console.log('\n' + vert + '/' + total + ' assertions vertes');
if (rouges.length) { console.error('ROUGE : ' + rouges.join(' | ')); process.exit(1); }
