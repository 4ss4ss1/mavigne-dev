/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CORRIGER UN RELEVÉ, CORRIGER UNE OPÉRATION (lot CUV-1)
   Lancer :          node scripts/mv-harnais-cuvier-correction.mjs
   Contre-épreuves : node scripts/mv-harnais-cuvier-correction.mjs --contre

   CE QU'IL EMPÊCHE DE REVENIR

   1. L'ORDRE DU TABLEAU PRIS POUR L'ORDRE DU TEMPS.
      `mesures_fa` était lu partout comme s'il était rangé : _vendLastMes,
      _vendStale, la sparkline, _mlProjFA (pente et fin de FA estimée),
      _mlAMesurer, _mlAgenda lisent tous m[m.length-1] ou m.slice(-3). Or rien
      ne le rangeait — et la saisie accepte n'importe quelle date. Un relevé de
      rattrapage suffisait déjà, avant même ce lot, à faire mentir la jauge, la
      courbe et la date de fin. Autoriser la correction d'une date sans trier
      aurait transformé un piège en fonctionnalité.

   2. LE VOLUME SAIGNÉ RETRANCHÉ DEUX FOIS.
      La saignée est la seule opération qui mute la cuve : elle retranche son
      volume à c.volume_hl. Corriger ou supprimer une saignée sans rendre
      d'abord l'ancien volume fait disparaître les hL une deuxième fois — et le
      rendement du millésime part avec eux (même famille que RDT-1/2/3).

   3. LE FROID SANS SON MOYEN.
      « Refroidir » n'enregistrait que la cible. La glace carbonique et l'azote
      sont des intrants : ce que le registre des manipulations doit retenir,
      c'est le moyen et la quantité, pas seulement la température visée.

   Méthode C20 : les fonctions sont extraites de src/cave.js et exécutées pour
   de vrai avec des bouchons minimaux. Aucune formule n'est recopiée ici — un
   harnais qui réécrit ce qu'il teste ne prouve rien.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC = readFileSync('src/cave.js', 'utf8');

/* ══ EXTRACTION — dans l'ordre du fichier (str.index avant de trancher) ═════ */
const NOMS = ['_vendTriDate', '_vendTriMes', '_vendTriOps', '_vendLastMes', '_vendSince',
  '_vendStale', '_vendFrDate', '_vendCorrTerm', '_vendD20', '_vendMesD20', '_vendCuvF1',
  '_vendMesHist', '_vendMesDel', 'saveVendMesure', '_vendOpLbl', '_vendMoyTbl', '_vendMoyLbl',
  '_vendMoyKg', '_vendOpQteCalc', 'saveVendOp', '_vendOpDel', '_vendOpDet', '_vendOpsSummary',
  '_rmNum', '_rmF', '_rmDetail', '_mlD', '_mlIso', '_mlEcartJ', '_mlAddJ', '_mlAuj', '_mlProjFA'];

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
/* Les tables sont des `var` : on les prend telles quelles, pas de recopie.
   ⚠️ Pas de `[\s\S]*?;$` : `var _ML_D20_SEC = 996;  // commentaire` n'a pas son
   point-virgule en fin de ligne, et la regex avalait tout jusqu'au suivant.
   On équilibre les crochets et on s'arrête au premier `;` de niveau zéro. */
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
const MORCEAUX = [...NOMS.map(extraire),
  ...['_VEND_OPS', '_VEND_FROID', '_VEND_CHAUD', '_VEND_DCORR', '_ML_D20_SEC'].map(table)]
  .sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

/* ══ BOUCHONS ══════════════════════════════════════════════════════════════ */
const PRELUDE = `
var _vmesureCuveId=null,_vmesureEditId=null,_vmRem=0,_vmPig=0;
var _vendOpType='chaptalisation',_vendOpCuveId=null,_vendOpEditId=null,_vendOpEditOp=null;
function _vendCfg(){ return {sucre_par_degre:16.83}; }
function _vendOpCalc(){}
function _vendSheetClose(){}
function _vendEnsureSheetCss(){}
`;
const RETOUR = `
return {_vendTriMes:_vendTriMes,_vendTriOps:_vendTriOps,_vendLastMes:_vendLastMes,
  _vendStale:_vendStale,_vendMesHist:_vendMesHist,_vendMesDel:_vendMesDel,
  saveVendMesure:saveVendMesure,saveVendOp:saveVendOp,_vendOpDel:_vendOpDel,
  _vendOpDet:_vendOpDet,_vendOpsSummary:_vendOpsSummary,_rmDetail:_rmDetail,
  _vendMoyLbl:_vendMoyLbl,_vendMoyKg:_vendMoyKg,_vendOpQteCalc:_vendOpQteCalc,
  _mlProjFA:_mlProjFA,
  poser:function(o){ for(var k in o) if(k==='_vmesureCuveId')_vmesureCuveId=o[k];
    else if(k==='_vmesureEditId')_vmesureEditId=o[k]; else if(k==='_vmRem')_vmRem=o[k];
    else if(k==='_vmPig')_vmPig=o[k]; else if(k==='_vendOpType')_vendOpType=o[k];
    else if(k==='_vendOpCuveId')_vendOpCuveId=o[k]; else if(k==='_vendOpEditId')_vendOpEditId=o[k];
    else if(k==='_vendOpEditOp')_vendOpEditOp=o[k]; }};
`;

function monter(cv, champs, mutation) {
  const corps = mutation ? mutation(MORCEAUX) : MORCEAUX;
  const journal = { toasts: [], saves: 0, confirme: null };
  /* Les noeuds sont PERSISTANTS : sans cela, une fonction qui ecrit dans un
     noeud et un test qui le relit ne parleraient pas du meme objet. */
  const noeuds = {};
  const doc = {
    getElementById: id => {
      if (!(id in champs)) return null;
      if (!noeuds[id]) noeuds[id] = { value: champs[id], textContent: '', innerHTML: '' };
      return noeuds[id];
    },
    querySelector: () => null, createElement: () => ({ style: {} })
  };
  journal.noeuds = noeuds;
  const w = {
    fbSave: () => { journal.saves++; },
    closeOv: () => {},
    /* La confirmation est jouée tout de suite : on teste l'effet, pas la modale. */
    openConfirmDel: (t, d, fn) => { journal.confirme = d; fn(); }
  };
  const api = new Function('CAVE_VENDANGE', 'window', 'document', 'showToast', 'renderVendCuves',
    '_escHtml', '_escAttr', '_mvIcon', 'canWrite',
    PRELUDE + corps + RETOUR)(
    cv, w, doc, (m) => journal.toasts.push(m), () => {},
    s => String(s == null ? '' : s), s => String(s == null ? '' : s), () => '<svg/>', () => true);
  api._journal = journal;
  return api;
}

/* Une cuve saisie DANS LE DÉSORDRE : le relevé du 12 arrive après celui du 15,
   comme quand on rattrape un carnet resté au cuvier. */
const CUVE_DESORDRE = () => ({ cuves_vinif: [{
  id: 'v1', nom: 'Cuve 3', volume_hl: 40, statut: 'fa', date_entree: '2026-09-08',
  mesures_fa: [
    { id: 'm1', date: '2026-09-09', densite: 1080, temp_c: 20, remontages: 2, pigeages: 1 },
    { id: 'm3', date: '2026-09-15', densite: 1010, temp_c: 26, remontages: 2, pigeages: 1 },
    { id: 'm2', date: '2026-09-12', densite: 1045, temp_c: 28, remontages: 2, pigeages: 1 }
  ], operations: [] }] });

const CUVE_SAIGNEE = () => ({ cuves_vinif: [{
  id: 'v1', nom: 'Cuve 3', volume_hl: 34, statut: 'fa', date_entree: '2026-09-08',
  mesures_fa: [], operations: [{ id: 'o1', type: 'saignee', date: '2026-09-09', volume_hl: 6, note: '' }] }] });

/* ══ VERDICT ═══════════════════════════════════════════════════════════════ */
let vert = 0, total = 0, rouges = [];
function pose(cond, quoi) {
  total++;
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}

if (!CONTRE) {
  console.log('\n── 1 · l’ordre du tableau n’est plus l’ordre de saisie ──');
  {
    const cv = CUVE_DESORDRE(), A = monter(cv, {});
    const c = cv.cuves_vinif[0];
    console.log('   avant : ' + c.mesures_fa.map(m => m.date).join(' · '));
    const l = A._vendLastMes(c);
    console.log('   après : ' + c.mesures_fa.map(m => m.date).join(' · ') + '   → dernier ' + l.date);
    pose(l.date === '2026-09-15', 'le dernier relevé est le plus récent par DATE, pas par position');
    pose(l.densite === 1010, 'et c’est bien sa densité qui est reprise');
    pose(c.mesures_fa.map(m => m.date).join() === '2026-09-09,2026-09-12,2026-09-15',
      'le tableau lui-même est rangé, donc tout ce qui le lit est réparé');
  }

  console.log('\n── 2 · la projection de fin de FA repose sur la bonne pente ──');
  {
    const cv = CUVE_DESORDRE(), A = monter(cv, {});
    const p = A._mlProjFA(cv.cuves_vinif[0], '2026-09-15');
    console.log('   état ' + p.etat + ' · densité 20 °C ' + Math.round(p.d20) + ' · pente ' + p.pente + ' pts/j');
    pose(p.d20 != null && Math.round(p.d20) === 1012, 'la densité lue est celle du 15 (1010 brut à 26 °C → 1012 à 20 °C)');
    pose(p.pente > 0, 'la pente descend (une pente négative signalerait un tableau à l’envers)');
    pose(p.etat === 'normal', 'la fermentation est vue comme normale, pas « ralentit »');
  }

  console.log('\n── 3 · corriger un relevé le remplace, il ne s’ajoute pas ──');
  {
    const cv = CUVE_DESORDRE();
    const A = monter(cv, { 'vm-densite': '1042', 'vm-date': '2026-09-11', 'vm-temp': '27', 'vm-note': 'corrigé' });
    A.poser({ _vmesureCuveId: 'v1', _vmesureEditId: 'm2', _vmRem: 3, _vmPig: 2 });
    A.saveVendMesure();
    const c = cv.cuves_vinif[0], m = c.mesures_fa.find(x => x.id === 'm2');
    console.log('   ' + c.mesures_fa.length + ' relevés · m2 → ' + m.date + ' · ' + m.densite
      + ' · ' + m.temp_c + ' °C · ' + m.remontages + ' remontages');
    pose(c.mesures_fa.length === 3, 'toujours 3 relevés — la correction n’en crée pas un quatrième');
    pose(m.densite === 1042 && m.date === '2026-09-11', 'la date et la densité sont bien reprises');
    pose(m.remontages === 3 && m.pigeages === 2, 'le travail du chapeau suit');
    pose(c.mesures_fa.map(x => x.date).join() === '2026-09-09,2026-09-11,2026-09-15',
      'la date corrigée remet le relevé à sa place');
    pose(A._journal.saves === 1, 'et l’enregistrement part une fois');
  }

  console.log('\n── 4 · une température de 0 °C n’est plus avalée ──');
  {
    const cv = CUVE_DESORDRE();
    const A = monter(cv, { 'vm-densite': '1042', 'vm-date': '2026-09-11', 'vm-temp': '0', 'vm-note': '' });
    A.poser({ _vmesureCuveId: 'v1', _vmesureEditId: null, _vmRem: 0, _vmPig: 0 });
    A.saveVendMesure();
    const m = cv.cuves_vinif[0].mesures_fa.find(x => x.date === '2026-09-11');
    console.log('   température enregistrée : ' + JSON.stringify(m.temp_c));
    pose(m.temp_c === 0, '0 est une valeur, pas une absence (parseFloat(…)||null l’effaçait)');
  }

  console.log('\n── 5 · supprimer un relevé ──');
  {
    const cv = CUVE_DESORDRE(), A = monter(cv, {});
    A.poser({ _vmesureCuveId: 'v1', _vmesureEditId: 'm2' });
    A._vendMesDel();
    console.log('   restent : ' + cv.cuves_vinif[0].mesures_fa.map(m => m.id).join(' · '));
    pose(cv.cuves_vinif[0].mesures_fa.length === 2, 'le relevé disparaît');
    pose(!cv.cuves_vinif[0].mesures_fa.some(m => m.id === 'm2'), 'et c’est bien celui-là');
  }

  console.log('\n── 6 · chaque relevé a sa porte de correction ──');
  {
    const cv = CUVE_DESORDRE(), A = monter(cv, {});
    const h = A._vendMesHist(cv.cuves_vinif[0], true);
    const n = (h.match(/openOvVendMesure\(/g) || []).length;
    console.log('   ' + n + ' crayons pour 3 relevés · lecture seule → '
      + (A._vendMesHist(cv.cuves_vinif[0], false).match(/openOvVendMesure\(/g) || []).length);
    pose(n === 3, 'un crayon par relevé');
    pose(/'v1','m2'/.test(h.replace(/\s/g, '')), 'le crayon vise la cuve ET le relevé');
    pose(!/openOvVendMesure\(/.test(A._vendMesHist(cv.cuves_vinif[0], false)),
      'aucun crayon pour qui ne peut pas écrire');
  }

  console.log('\n── 7 · corriger une saignée rend d’abord l’ancien volume ──');
  {
    const cv = CUVE_SAIGNEE();
    const A = monter(cv, { 'vop-date': '2026-09-09', 'vop-note': '', 'vop-vol': '10' });
    A.poser({ _vendOpCuveId: 'v1', _vendOpEditId: 'o1', _vendOpType: 'saignee' });
    A.saveVendOp();
    const c = cv.cuves_vinif[0];
    console.log('   cuve à 34 hL (40 − 6) · saignée corrigée 6 → 10 hL · volume ' + c.volume_hl + ' hL');
    pose(c.volume_hl === 30, '40 − 10 = 30 hL, et non 34 − 10 = 24');
    pose(c.operations.length === 1, 'une seule saignée, pas deux');
  }

  console.log('\n── 8 · supprimer une saignée rend le volume ──');
  {
    const cv = CUVE_SAIGNEE(), A = monter(cv, {});
    A.poser({ _vendOpCuveId: 'v1', _vendOpEditId: 'o1' });
    A._vendOpDel();
    const c = cv.cuves_vinif[0];
    console.log('   volume ' + c.volume_hl + ' hL · avertissement : ' + A._journal.confirme);
    pose(c.volume_hl === 40, 'les 6 hL reviennent à la cuve');
    pose(c.operations.length === 0, 'l’opération disparaît');
    pose(/6 hL/.test(A._journal.confirme || ''), 'et l’avertissement annonce ce qui va être rendu');
  }

  console.log('\n── 9 · changer une saignée en autre chose rend aussi le volume ──');
  {
    const cv = CUVE_SAIGNEE();
    const A = monter(cv, { 'vop-date': '2026-09-09', 'vop-note': '', 'vop-nb': '2' });
    A.poser({ _vendOpCuveId: 'v1', _vendOpEditId: 'o1', _vendOpType: 'delestage' });
    A.saveVendOp();
    console.log('   volume ' + cv.cuves_vinif[0].volume_hl + ' hL · type '
      + cv.cuves_vinif[0].operations[0].type);
    pose(cv.cuves_vinif[0].volume_hl === 40, 'ce n’est plus une saignée : la cuve retrouve ses 40 hL');
  }

  console.log('\n── 10 · le froid dit COMMENT, et le registre le reprend ──');
  {
    const cv = { cuves_vinif: [{ id: 'v1', nom: 'Cuve 3', volume_hl: 40, statut: 'fa', operations: [] }] };
    const A = monter(cv, { 'vop-date': '2026-09-12', 'vop-note': '', 'vop-temp': '18',
      'vop-moyen': 'carbo', 'vop-qte': '25' });
    A.poser({ _vendOpCuveId: 'v1', _vendOpEditId: null, _vendOpType: 'refroidissement' });
    A.saveVendOp();
    const o = cv.cuves_vinif[0].operations[0];
    console.log('   ' + JSON.stringify({ moyen: o.moyen, qte_kg: o.qte_kg, temp_c: o.temp_c }));
    console.log('   registre : ' + A._rmDetail(o));
    pose(o.moyen === 'carbo' && o.qte_kg === 25, 'le moyen et la quantité sont enregistrés');
    pose(/[Gg]lace carbonique/.test(A._rmDetail(o)), 'le registre des manipulations nomme le moyen');
    pose(/25 kg/.test(A._rmDetail(o)), 'et porte la quantité');
    pose(/cible 18/.test(A._rmDetail(o)), 'sans perdre la température visée');
  }

  console.log('\n── 11 · seuls les moyens qui se pèsent réclament des kilos ──');
  {
    const A = monter({ cuves_vinif: [] }, {});
    console.log('   carbo ' + A._vendMoyKg('carbo') + ' · azote ' + A._vendMoyKg('azote')
      + ' · groupe ' + A._vendMoyKg('groupe') + ' · échangeur ' + A._vendMoyKg('echangeur'));
    pose(A._vendMoyKg('carbo') && A._vendMoyKg('azote') && A._vendMoyKg('co2liq'),
      'carboglace, azote et CO₂ liquide se comptent en kilos');
    pose(!A._vendMoyKg('groupe') && !A._vendMoyKg('echangeur') && !A._vendMoyKg(''),
      'un groupe de froid ne se pèse pas');
    pose(A._vendMoyLbl('rechauffement', 'ceinture') === 'Ceinture chauffante',
      'réchauffer et refroidir n’ont pas la même liste');
    pose(A._vendMoyLbl('refroidissement', 'ceinture') === 'ceinture',
      'et une clé du mauvais côté n’est pas maquillée en libellé');
  }

  console.log('\n── 12 · l’ordre de grandeur de la carboglace est calculé, et annoncé comme tel ──');
  {
    const A = monter({ cuves_vinif: [{ id: 'v1', volume_hl: 40 }] },
      { 'vop-moyen': 'carbo', 'vop-qte': '40', 'vop-qte-note': '' });
    A.poser({ _vendOpCuveId: 'v1' });
    A._vendOpQteCalc();
    const txt = A._journal.noeuds['vop-qte-note'].innerHTML;
    console.log('   40 kg sur 40 hL → ' + txt.slice(0, 46) + '…');
    pose(/1,4 °C/.test(txt), '40 kg de carboglace sur 40 hL ≈ 1,4 °C de moins');
    pose(/[Oo]rdre de grandeur/.test(txt), 'et le texte dit que c’est un ordre de grandeur');

    const B = monter({ cuves_vinif: [{ id: 'v1', volume_hl: 40 }] },
      { 'vop-moyen': 'azote', 'vop-qte': '40', 'vop-qte-note': '' });
    B.poser({ _vendOpCuveId: 'v1' });
    B._vendOpQteCalc();
    const tz = B._journal.noeuds['vop-qte-note'].innerHTML;
    console.log('   azote liquide → ' + tz.slice(0, 46) + '…');
    pose(!/°C/.test(tz), 'pour l’azote, aucun abaissement n’est inventé');
    pose(/registre/.test(tz), 'mais la quantité part quand même au registre');
  }

  console.log('\n── 13 · les opérations aussi sont rangées et corrigeables ──');
  {
    const cv = { cuves_vinif: [{ id: 'v1', nom: 'C', volume_hl: 40, statut: 'fa', mesures_fa: [], operations: [
      { id: 'o2', type: 'so2', date: '2026-09-14', dose: 3 },
      { id: 'o1', type: 'levurage', date: '2026-09-09', souche: 'RC212', dose: 20 }] }] };
    const A = monter(cv, {});
    const h = A._vendOpsSummary(cv.cuves_vinif[0], true);
    console.log('   ordre : ' + cv.cuves_vinif[0].operations.map(o => o.date).join(' · '));
    pose(cv.cuves_vinif[0].operations[0].date === '2026-09-09', 'les opérations sont rangées par date');
    pose((h.match(/openVendOp\(/g) || []).length === 2, 'un crayon par opération');
    pose(/SO/.test(h.slice(0, h.indexOf('</summary>'))), 'le résumé montre la plus récente');
  }
} else {
  /* ══ CONTRE-ÉPREUVES ═════════════════════════════════════════════════════
     Chaque défaut est réintroduit dans le bloc extrait. Une contre-épreuve qui
     ne peut pas rougir ne prouve rien. */
  console.log('\n── CONTRE-ÉPREUVES — chaque défaut réintroduit doit rougir ──');

  const cas = [
    ['C1 · le tri retiré de _vendTriMes',
      b => b.replace('if(m.length>1) m.sort(_vendTriDate);', ''),
      () => {
        const cv = CUVE_DESORDRE();
        const A = monter(cv, {}, b => b.replace('if(m.length>1) m.sort(_vendTriDate);', ''));
        return A._vendLastMes(cv.cuves_vinif[0]).date !== '2026-09-15';
      },
      'le dernier relevé redevient celui du bas du tableau'],

    ['C2 · la restitution du volume saigné retirée',
      b => b.replace("if(prev&&prev.type==='saignee'&&prev.volume_hl) c.volume_hl=(c.volume_hl||0)+prev.volume_hl;", ''),
      () => {
        const cv = CUVE_SAIGNEE();
        const A = monter(cv, { 'vop-date': '2026-09-09', 'vop-note': '', 'vop-vol': '10' },
          b => b.replace("if(prev&&prev.type==='saignee'&&prev.volume_hl) c.volume_hl=(c.volume_hl||0)+prev.volume_hl;", ''));
        A.poser({ _vendOpCuveId: 'v1', _vendOpEditId: 'o1', _vendOpType: 'saignee' });
        A.saveVendOp();
        return cv.cuves_vinif[0].volume_hl === 24;
      },
      'les hL sont retranchés deux fois (34 − 10 = 24 au lieu de 30)'],

    ['C3 · le moyen retiré du registre',
      b => b.replace('if(o.moyen)          d.push(_vendMoyLbl(o.type, o.moyen));', ''),
      () => {
        const A = monter({ cuves_vinif: [] }, {},
          b => b.replace('if(o.moyen)          d.push(_vendMoyLbl(o.type, o.moyen));', ''));
        return !/[Gg]lace carbonique/.test(
          A._rmDetail({ type: 'refroidissement', temp_c: 18, moyen: 'carbo', qte_kg: 25 }));
      },
      'le registre redevient muet sur la façon dont le froid a été fait'],

    ['C4 · la correction repasse en ajout',
      b => b.replace('if(pos!==-1) cu.mesures_fa[pos]=mesure; else cu.mesures_fa.push(mesure);',
                     'cu.mesures_fa.push(mesure);'),
      () => {
        const cv = CUVE_DESORDRE();
        const A = monter(cv, { 'vm-densite': '1042', 'vm-date': '2026-09-11', 'vm-temp': '27', 'vm-note': '' },
          b => b.replace('if(pos!==-1) cu.mesures_fa[pos]=mesure; else cu.mesures_fa.push(mesure);',
                         'cu.mesures_fa.push(mesure);'));
        A.poser({ _vmesureCuveId: 'v1', _vmesureEditId: 'm2', _vmRem: 0, _vmPig: 0 });
        A.saveVendMesure();
        return cv.cuves_vinif[0].mesures_fa.length === 4;
      },
      'corriger crée un doublon au lieu de remplacer']
  ];

  for (const [nom, mut, jouer, attendu] of cas) {
    if (mut(MORCEAUX) === MORCEAUX) {
      pose(false, nom + ' — le motif n’existe plus, la contre-épreuve ne peut pas rougir');
      continue;
    }
    let ok = false, err = '';
    try { ok = jouer(); } catch (e) { err = ' (exception : ' + e.message + ')'; }
    console.log('   ' + nom + ' → ' + (ok ? attendu : 'RIEN NE BOUGE' + err));
    pose(ok, nom + ' ramène bien le défaut');
  }
}

console.log('\n' + vert + '/' + total + ' assertions vertes');
if (rouges.length) { console.error('ROUGE : ' + rouges.join(' | ')); process.exit(1); }
