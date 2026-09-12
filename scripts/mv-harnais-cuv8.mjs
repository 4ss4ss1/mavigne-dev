// ═══════════════════════════════════════════════════════════════════════════
//  HARNAIS CUV-8 / CUV-9 — LE SEUIL DU VIN SEC, ET LA FA QUI CONTINUE
// ═══════════════════════════════════════════════════════════════════════════
//  Sur les VRAIES fonctions extraites de src/cave.js. Aucun bouchon sur ce
//  qu'on mesure : seul `_vendCfg` est bouchonné (le réglage « sucre par
//  degré » de la cave), parce que c'est une donnée, pas une règle.
//
//  CE QUE CE HARNAIS PROUVE
//   1. le modèle de sucre est exact AUX DEUX BOUTS — au moût il rend le sucre
//      du moût, à la densité de sucre nul il rend zéro. C'est ce qui manquait
//      à la pente de la table IFV, juste en fin de FA et fausse au moût ;
//   2. le seuil du vin sec DESCEND quand le degré potentiel monte, d'environ
//      1,1 point par degré ;
//   3. une cuve dont on ne peut rien lire retombe sur le seuil général, et le
//      dit ;
//   4. une cuve décuvée qui porte encore du sucre est « en FA », reste suivie,
//      et n'a pas de date de vin sec tant qu'aucun relevé n'est passé dessous.
//
//  Usage :  node scripts/mv-harnais-cuv8.mjs
//           node scripts/mv-harnais-cuv8.mjs --contre
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC = readFileSync(new URL('../src/cave.js', import.meta.url), 'utf8');

/* ══ EXTRACTION — indices relus avant de trancher, ordre réel du fichier ══ */
const NOMS = [
  '_vendTriDate', '_vendTriMes', '_vendLastMes', '_vendLastD', '_vendIsActive',
  '_vendEstFusionnee', '_vendHist', '_vendStatIdx', '_vendStatDeb',
  '_vendCorrTerm', '_vendD20', '_vendMesD20', '_vendSucre',
  '_vendSucPente', '_vendMesD', '_vendD0', '_vendChaptDeg', '_vendDPot',
  '_vendDZero', '_vendDSec', '_vendDSecTxt', '_vendSucreRest', '_vendFaPct',
  '_vendDecuvee', '_vendFaEnCours', '_vendJourSec', '_vendSuivie', '_vendDecD20',
  '_vendFrDate', '_pcrbFin',
  '_mlD', '_mlIso', '_mlEcartJ', '_mlAddJ', '_mlAuj', '_mlProjFA'
];
function extraire(nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de src/cave.js : ' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
function table(nom) {
  const m = new RegExp('^var ' + nom + '\\s*=', 'm').exec(SRC);
  if (!m) { console.error('TABLE ABSENTE : ' + nom); process.exit(1); }
  let d = 0;
  for (let j = m.index; j < SRC.length; j++) {
    const ch = SRC[j];
    if (ch === '[' || ch === '{' || ch === '(') d++;
    else if (ch === ']' || ch === '}' || ch === ')') d--;
    else if (ch === ';' && d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('point-virgule non trouvé : ' + nom); process.exit(1);
}
const TABLES = ['_VEND_DCORR', '_ML_D20_SEC', '_VEND_SEC_A', '_VEND_SEC_B',
                '_VEND_SEC_G', '_VEND_D_MOUT'];
const BLOC = [...NOMS.map(extraire), ...TABLES.map(table)]
  .sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

const SPD = 16.83;
const PRELUDE = `
var CAVE_VENDANGE = { cuves_vinif: [], analyses: [], config: { sucre_par_degre: ${SPD} } };
function _vendCfg(){ return { sucre_par_degre: ${SPD} }; }
`;
const RETOUR = `
return { _vendSucre, _vendSucPente, _vendDPot, _vendDZero, _vendDSec, _vendDSecTxt,
         _vendSucreRest, _vendFaPct, _vendDecuvee, _vendFaEnCours, _vendJourSec,
         _vendSuivie, _vendD0, _vendDecD20, _vendMesD, _pcrbFin, _mlProjFA, _ML_D20_SEC };
`;
function monter(mutation) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  return new Function(PRELUDE + corps + RETOUR)();
}

let vert = 0; const rouges = [];
function pose(cond, quoi) {
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}
const r1 = x => Math.round(x * 10) / 10;

/* ══ LE DÉCOR ════════════════════════════════════════════════════════════
   Une cuve est décrite par le DEGRÉ POTENTIEL qu'on veut lui donner : on
   remonte à la densité du moût par la formule du moût elle-même, jamais par
   un nombre écrit à la main qui se serait décalé au premier réglage changé. */
const dMout = dp => (dp * SPD + 2581.5) / 2.564;
const J = n => new Date(Date.UTC(2026, 8, 12 + n)).toISOString().slice(0, 10);

function cuve(dp, suite, opts) {
  const mes = [{ id: 'm0', date: J(0), densite: Math.round(dMout(dp) * 10) / 10, temp_c: 20 }];
  (suite || []).forEach((d, k) => mes.push({ id: 'm' + (k + 1), date: J(k + 1), densite: d, temp_c: 20 }));
  return Object.assign({ id: 'c' + dp, nom: 'Cuve ' + dp, statut: 'fa',
                         date_entree: J(0), parcelles: [], mesures_fa: mes,
                         operations: [] }, opts || {});
}
const decuvee = (c, fin, opts) => Object.assign(c, { statut: 'termine',
  decuvage: Object.assign({ date: J(9), cuvee_id: 'cuv_x' },
    (fin === undefined ? {} : { fa_finie: fin }), opts || {}) });

const A = monter();

if (!CONTRE) {
  console.log('\n── 1 · le modèle de sucre est exact aux DEUX bouts ──');
  {
    const c13 = cuve(13);
    const d0 = A._vendD0(c13);
    const attendu = A._vendSucre(d0);
    const rendu = A._vendSucreRest(c13, d0);
    console.log('   moût ' + r1(d0) + ' → formule moût ' + r1(attendu)
      + ' g/L · modèle de FA ' + r1(rendu) + ' g/L');
    pose(Math.abs(rendu - attendu) <= 1.5,
      '★ au moût, le modèle de FA retrouve le sucre du moût (à 1,5 g/L près)');
    pose(r1(A._vendSucreRest(c13, A._vendDZero(c13))) === 0,
      'à la densité de sucre nul, il ne reste rien');
    pose(A._vendSucreRest(c13, 900) === 0, 'et il ne descend jamais sous zéro');
  }

  console.log('\n── 2 · le seuil descend quand le degré monte ──');
  {
    const s = dp => A._vendDSec(cuve(dp));
    console.log('   12° → ' + s(12) + '  ·  13° → ' + s(13) + '  ·  14° → ' + s(14) + '  ·  15° → ' + s(15));
    pose(s(12) > s(13) && s(13) > s(14) && s(14) > s(15), 'le seuil est strictement décroissant');
    pose(Math.abs((s(12) - s(14)) - 2.2) < 0.4, '★ environ 1,1 point de densité par degré');
    pose(s(12) > 994 && s(12) < 995.5, 'un moût à 12° est sec vers 995');
    pose(s(14) > 992 && s(14) < 993.5, 'un moût à 14° est sec vers 992,7');
  }

  console.log('\n── 3 · LE DÉFAUT CORRIGÉ : 996 pour tout le monde ──');
  {
    const c14 = cuve(14, [1040, 1005, 995.5]);
    const d = 995.5, reste = A._vendSucreRest(c14, d);
    console.log('   moût à 14°, relevé à ' + d + ' → ' + r1(reste) + ' g/L restants');
    pose(reste > 2, '★ à 995,5 un moût à 14° porte encore plus de 2 g/L');
    pose(d <= A._ML_D20_SEC, '   … or l’ancien seuil unique (996) l’aurait déclarée sèche');
    pose(d > A._vendDSec(c14), '★ avec son propre seuil, elle ne l’est pas');
    const c11 = cuve(11, [1040, 1005, 995.5]);
    pose(A._vendSucreRest(c11, 995.5) < 2 && 995.5 > A._vendDSec(c11) === false,
      '★ et l’erreur joue dans l’autre sens : à 11° la même densité EST sèche');
  }

  console.log('\n── 4 · rien à lire : repli sur le seuil général, et on le dit ──');
  {
    const nue = { id: 'x', nom: 'x', statut: 'fa', mesures_fa: [], operations: [] };
    pose(A._vendDPot(nue) === null, 'aucun degré potentiel n’est inventé');
    pose(A._vendDSec(nue) === A._ML_D20_SEC, 'la cuve retombe sur le seuil général');
    pose(/g\u00e9n\u00e9ral/.test(A._vendDSecTxt(nue)), '★ et le texte affiché dit « seuil général »');
    pose(/mo\u00fbt/.test(A._vendDSecTxt(cuve(13))), 'sinon il nomme le degré du moût');
    /* Un relevé pris en pleine FA n'est PAS un moût : il ne doit pas servir
       de départ, sinon le degré potentiel serait sous-évalué. */
    const tard = { id: 'y', nom: 'y', statut: 'fa', operations: [],
                   mesures_fa: [{ id: 'a', date: J(0), densite: 1020, temp_c: 20 }] };
    pose(A._vendDPot(tard) === null, '★ un premier relevé à 1020 n’est plus un moût : refusé');
  }

  console.log('\n── 5 · une chaptalisation datée compte ──');
  {
    const c = cuve(12, [1030]);
    const avant = A._vendDSec(c);
    c.operations.push({ id: 'o1', type: 'chaptalisation', date: J(1), degre: 1 });
    const apres = A._vendDSec(c);
    console.log('   sans chaptalisation ' + avant + ' → avec +1° ' + apres);
    pose(apres < avant, 'chaptaliser abaisse le seuil du vin sec');
    pose(Math.abs((avant - apres) - 1.1) < 0.2, '★ d’environ 1,1 point pour un degré');
  }

  console.log('\n── 6 · l’avancement part du départ RÉELLEMENT LU ──');
  {
    const c = cuve(11, [1050, 1010]);
    console.log('   moût à 11° = ' + r1(A._vendD0(c)) + ', sous l’ancienne borne fixe de 1085');
    pose(A._vendFaPct(c, A._vendD0(c)) === 0, '★ le jour de l’encuvage, l’avancement est 0 %');
    pose(A._vendFaPct(c, A._vendDSec(c)) === 100, 'au seuil, il est à 100 %');
    pose(A._vendFaPct(c, 1010) > 0 && A._vendFaPct(c, 1010) < 100, 'et il monte entre les deux');
  }

  console.log('\n── 7 · CUV-10 · le décuvage est un FAIT, pas une densité ──');
  {
    /* Même densité de fin sur les trois : seul le fait noté au décuvage change.
       C'est tout le lot CUV-10 en une assertion. */
    const finie   = decuvee(cuve(13, [1040, 1005, 997]), true);
    const afinir  = decuvee(cuve(13, [1040, 1005, 997]), false);
    const ancienne= decuvee(cuve(13, [1040, 1005, 997]));          // avant le lot
    pose(!A._vendFaEnCours(finie), '★ décuvée à 997 mais déclarée finie en cuve : pas en FA');
    pose(A._vendFaEnCours(afinir), '★ même densité, déclarée à finir au chai : en FA');
    pose(!A._vendFaEnCours(ancienne), '★ décuvée avant le lot : rien n’est deviné (pas de backfill)');
    pose(A._vendSuivie(afinir) && !A._vendSuivie(finie), 'seule la première reste suivie');
    pose(!A._vendFaEnCours(cuve(13, [1040, 1005, 997])), 'une cuve NON décuvée n’est jamais dans ce cas');
    const fus = decuvee(cuve(13, [1040, 1005, 997]), false);
    fus.fusion = { vers: 'autre', date: J(8) };
    pose(!A._vendFaEnCours(fus), '★ une cuve fusionnée ne suit rien : son vin est ailleurs');
    /* Le repere ne doit plus rien armer : une cuve tres sucree, declaree finie,
       reste finie. C'est la degustation qui a tranche, pas le densimetre. */
    pose(!A._vendFaEnCours(decuvee(cuve(13, [1040, 1020]), true)),
      '★★ le repère n’arme plus rien : même à 1020, un « finie » reste finie');
  }

  console.log('\n── 7b · la densité de mise en fût ──');
  {
    const sans = decuvee(cuve(13, [1040, 997]), true);
    pose(A._vendDecD20(sans) === null, 'pas de densité saisie : rien, pas un zéro');
    const avec = decuvee(cuve(13, [1040, 997]), true, { densite_fut: 999, temp_fut: 26 });
    console.log('   999 relevé à 26 °C → ' + r1(A._vendDecD20(avec)) + ' à 20 °C');
    pose(A._vendDecD20(avec) > 999, '★ elle est ramenée à 20 °C comme tout relevé');
    const brut = decuvee(cuve(13, [1040, 997]), true, { densite_fut: 999 });
    pose(A._vendDecD20(brut) === 999, 'sans température, la valeur brute est reprise');
    pose(A._vendMesD(avec).every(m => m.densite !== 999),
      '★★ elle ne rejoint PAS la série de la cuve : la courbe ne remonte pas');
  }

  console.log('\n── 7c · le comparatif ne dit plus « pas encore » d’une cuve décuvée ──');
  {
    const fin = s => A._pcrbFin(s);
    const enCours = { cuve: cuve(13, [1040, 1005, 997]), jSec: null, jFin: 14, dFin: 997 };
    const dec = { cuve: decuvee(cuve(13, [1040, 1005, 997]), true), jSec: null, jFin: 14, dFin: 997 };
    const decFa = { cuve: decuvee(cuve(13, [1040, 1005, 997]), false), jSec: null, jFin: 14, dFin: 997 };
    const rep = { cuve: cuve(13, [1040, 992]), jSec: 12, jFin: 12, dFin: 992 };
    pose(/en cours/.test(fin(enCours)) && !/pas encore/.test(fin(enCours)),
      '★ une cuve qui fermente est « en cours », plus « pas encore »');
    pose(/d\u00e9cuv\u00e9e/.test(fin(dec)) && !/en cours/.test(fin(dec)),
      '★★ une cuve décuvée affiche la DATE de son décuvage');
    pose(/FA au chai/.test(fin(decFa)), 'celle qui finit au chai le dit en plus');
    pose(/rep\u00e8re/.test(fin(rep)), 'le passage sous le repère est marqué comme un repère');
  }

  console.log('\n── 8 · la date de vin sec est RELEVÉE, jamais interpolée ──');
  {
    const c = cuve(13, [1040, 1005, 994, 991, 990]);
    console.log('   seuil ' + A._vendDSec(c) + ' → sèche le ' + A._vendJourSec(c));
    pose(A._vendJourSec(c) === J(4), '★ c’est le PREMIER jour passé sous le seuil, pas le dernier');
    pose(A._vendJourSec(cuve(13, [1040, 1005, 997])) === null,
      'jamais atteint : pas de date, plutôt qu’une date fabriquée');
  }

  console.log('\n── 9 · _mlProjFA projette sur le seuil de LA cuve ──');
  {
    const c = cuve(14, [1040, 1005, 995.5]);
    c.statut_hist = [{ id: 's1', statut: 'fa', date: J(0) }];
    const p = A._mlProjFA(c, J(6));
    console.log('   état ' + p.etat + ' · seuil ' + (p.dSec != null ? p.dSec : A._vendDSec(c)));
    pose(p.etat !== 'sec', '★ à 995,5 sur un moût à 14°, la cuve n’est pas déclarée sèche');
    const d = cuve(11, [1040, 1005, 995.5]);
    d.statut_hist = [{ id: 's1', statut: 'fa', date: J(0) }];
    const q = A._mlProjFA(d, J(6));
    pose(q.etat === 'sec' && q.dSec === A._vendDSec(d),
      'la même densité sur un moût à 11° l’est, et la projection porte son seuil');
  }
}

/* ══ CONTRE-ÉPREUVE ═══════════════════════════════════════════════════════
   On réintroduit chaque défaut dans le code extrait : le harnais DOIT rougir.
   Un harnais qu'on ne peut pas mettre en défaut n'a rien prouvé. */
if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVE : chaque défaut réintroduit doit mordre ──');
  const mord = (titre, mutation, essai) => {
    let rouge = false;
    try { rouge = !essai(monter(mutation)); } catch (e) { rouge = true; }
    if (rouge) { vert++; console.log('  vert   ' + titre + ' → détecté'); }
    else { rouges.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
  };

  mord('le seuil redevient une constante pour tout le monde',
    b => b.replace(/return Math\.round\(Math\.max\(984,Math\.min\(999,d\)\)\*10\)\/10;/,
                   'return 996;'),
    F => { const s = dp => F._vendDSec(cuve(dp)); return s(12) > s(14); });

  mord('★ la pente de la table IFV (2,59) au lieu du bilan de matière',
    b => b.replace(/return spd\/\(spd\/2\.564\+_VEND_SEC_B\);/, 'return 2.59;'),
    F => { const c = cuve(13), d0 = F._vendD0(c);
           return Math.abs(F._vendSucreRest(c, d0) - F._vendSucre(d0)) <= 1.5; });

  mord('un relevé de pleine FA passe pour un moût',
    b => b.replace(/d0>=_VEND_D_MOUT/, 'd0>0'),
    F => F._vendDPot({ id: 'y', statut: 'fa', operations: [],
                       mesures_fa: [{ id: 'a', date: J(0), densite: 1020, temp_c: 20 }] }) === null);

  mord('la chaptalisation cesse de compter',
    b => b.replace(/return base\+_vendChaptDeg\(c\);/, 'return base;'),
    F => { const c = cuve(12, [1030]); const a = F._vendDSec(c);
           c.operations.push({ id: 'o1', type: 'chaptalisation', date: J(1), degre: 1 });
           return F._vendDSec(c) < a; });

  mord('★ une cuve fusionnée redevient « en FA »',
    b => b.replace(/if\(!_vendDecuvee\(c\)\|\|_vendEstFusionnee\(c\)\) return false;/,
                   'if(!_vendDecuvee(c)) return false;'),
    F => { const f = decuvee(cuve(13, [1040, 1005, 997]), false);
           f.fusion = { vers: 'autre', date: J(8) }; return !F._vendFaEnCours(f); });

  mord('★★ le repère redécide de la fin de FA à la place du vigneron',
    b => b.replace(/return c\.decuvage\.fa_finie===false;/,
                   'var l=_vendLastD(c); return !!l && _vendMesD20(l)>_vendDSec(c);'),
    F => !F._vendFaEnCours(decuvee(cuve(13, [1040, 1005, 997]), true)));

  mord('la cuve décuvée avant le lot est devinée « à finir »',
    b => b.replace(/return c\.decuvage\.fa_finie===false;/,
                   'return c.decuvage.fa_finie!==true;'),
    F => !F._vendFaEnCours(decuvee(cuve(13, [1040, 1005, 997]))));

  mord('★ la densité de mise en fût cesse d’être corrigée en température',
    b => b.replace(/return _vendD20\(d\.densite_fut,\(d\.temp_fut!=null\)\?d\.temp_fut:null\);/,
                   'return d.densite_fut;'),
    F => F._vendDecD20(decuvee(cuve(13, [1040, 997]), true, { densite_fut: 999, temp_fut: 26 })) > 999);

  mord('_vendJourSec rend le DERNIER relevé sec au lieu du premier',
    b => b.replace(/for\(var i=0;i<m\.length;i\+\+\) if\(_vendMesD20\(m\[i\]\)<=ds\) return m\[i\]\.date;/,
                   'for(var i=m.length-1;i>=0;i--) if(_vendMesD20(m[i])<=ds) return m[i].date;'),
    F => F._vendJourSec(cuve(13, [1040, 1005, 994, 991, 990])) === J(4));

  mord('l’avancement repart des anciennes bornes fixes',
    b => b.replace(/if\(d0==null\|\|!\(d0>ds\+10\)\) d0=1085;/, 'd0=1085; ds=990;'),
    /* Un moût à 11° part SOUS 1085 : avec les anciennes bornes, son premier
       jour affichait déjà 6 %. C'est la sonde qui mord. */
    F => { const c = cuve(11, [1050, 1010]); return F._vendFaPct(c, F._vendD0(c)) === 0; });
}

console.log('\n' + '─'.repeat(30));
console.log('  ' + vert + ' vert' + (rouges.length ? ' · ' + rouges.length + ' ROUGE' : ' · 0 rouge'));
if (rouges.length) { rouges.forEach(r => console.log('   ✗ ' + r)); process.exit(1); }
