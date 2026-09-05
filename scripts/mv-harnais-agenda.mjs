/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — L'AGENDA DU MILLÉSIME : LA CHAÎNE D'OUILLAGE
   Lancer :          node scripts/mv-harnais-agenda.mjs
   Contre-épreuves : node scripts/mv-harnais-agenda.mjs --contre

   POURQUOI IL EXISTE
   Le 30/08/2026, `_mlOuillages` poussait `{futs:futs, litres:futs*…}` alors que
   **`futs` n'était déclaré nulle part**. Le seul `var futs` du fichier est le
   local d'une autre fonction, à ~700 lignes de là. La fonction levait donc un
   `ReferenceError` dès la première cuvée ouillable, et emportait tout l'agenda
   du millésime avec elle. Le défaut était antérieur à CUV-1 — donc en
   production chez les deux clients.

   ★★★ CE QU'IL FAUT RETENIR : aucun harnais ne couvrait `_mlOuillages`. Une
   variable jamais déclarée est exactement ce qu'une exécution attrape en une
   assertion, et ce qu'aucune relecture n'attrape — le code se LIT très bien.
   Un défaut corrigé sans contre-épreuve peut revenir ; celui-là ne pourra plus.

   LES QUATRE RÈGLES GRAVÉES ICI
   1. `futs` et `seuil` se calculent DANS la boucle, par cuvée. Sortis de la
      boucle, toute la cave prend le compte et la cadence de la première.
   2. Une cuvée qui ne s'ouille pas (inox, béton) n'entre pas à l'agenda ; un
      foudre bois, si.
   3. Jamais ouillée = due aujourd'hui, et ça se dit (`jamais:true`).
   4. L'ordre d'affichage ne s'écrit JAMAIS `(ordre[k]||9)` : 'alerte' vaut 0,
      et 0||9 renvoie 9 — l'alerte passerait sous les ouillages.

   Méthode C20 : fonctions extraites de src/cave.js et exécutées pour de vrai,
   bouchons minimaux. Aucune formule réécrite ici.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC = readFileSync('src/cave.js', 'utf8');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom); }
}

/* ══ EXTRACTION — dans l'ordre du fichier ══════════════════════════════════ */
const NOMS = ['_caveCuvesBois', '_caveOuille', '_caveNbTonneaux',
  '_mlD', '_mlIso', '_mlAddJ', '_mlEcartJ', '_mlLundi',
  '_mlVolParFut', '_mlOuillages', '_mlAMesurer', '_mlAgenda', '_mlResumeSem',
  '_vendIsActive', '_vendTriDate', '_vendTriMes', '_vendLastMes'];

function extraire(nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(SRC);
  if (!m) { console.error('ABSENTE de src/cave.js : ' + nom); process.exit(1); }
  let i = SRC.indexOf('{', m.index), d = 0;
  for (let j = i; j < SRC.length; j++) {
    if (SRC[j] === '{') d++;
    else if (SRC[j] === '}' && --d === 0) return [m.index, SRC.slice(m.index, j + 1)];
  }
  console.error('accolade non ferm\u00e9e : ' + nom); process.exit(1);
}
const BLOC = NOMS.map(extraire).sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

/* ══ BOUCHONS ══════════════════════════════════════════════════════════════
   `_mlSeuil`, `_mlProjFA`, `_mlNomCuvee` et `_caveCuve` / `_caveMat` sont
   passés en paramètres plutôt qu'extraits : ils tirent chacun une grappe de
   configuration qui n'a rien à voir avec ce qu'on mesure ici. Un bouchon qui
   remplace une dépendance hors sujet ne fausse rien ; un bouchon qui remplace
   la fonction testée, si — et il n'y en a aucun. */
function monter(ce, cv, mutation, seuilFn) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  return new Function('CAVE_ELEVAGE', 'CAVE_VENDANGE', '_mlSeuil', '_mlProjFA',
    '_mlNomCuvee', '_caveCuve', '_caveMat',
    corps + '\nreturn {_mlOuillages,_mlAgenda,_mlVolParFut,_caveOuille,_mlAMesurer,_mlResumeSem};'
  )(ce, cv,
    seuilFn || (c => (c && c.millesime === 2026) ? 7 : 14),
    () => ({ etat: 'rien' }),
    c => c.nom,
    ref => ({ nom: ref, matiere: ref === 'cuve-bois' ? 'bois' : 'inox' }),
    mat => ({ ouille: mat === 'bois' })
  );
}

/* ══ LE CAS RÉEL — domaine de référence, trois cuvées de contenants différents ══ */
const AUJ = '2026-09-07';                              // un lundi
function cave() {
  return {
    config: {},
    cuvees: [
      { id: 'c1', nom: 'Charmes', millesime: 2026, nb_tonneaux: 6, last_ouillage: '2026-09-01' },
      { id: 'c2', nom: 'Village', millesime: 2025, nb_tonneaux: 2, last_ouillage: '2026-08-20' },
      { id: 'c3', nom: 'Cuve inox', millesime: 2026, cuves: [{ ref: 'cuve-inox', litres: 3600 }] },
      { id: 'c4', nom: 'Foudre', millesime: 2026, cuves: [{ ref: 'cuve-bois', litres: 2000 }] },
      { id: 'c5', nom: 'Neuve', millesime: 2026, nb_tonneaux: 3 }   // jamais ouillée
    ],
    operations: [
      { type: 'ouillage', cuvees_ids: ['c1'], data: { vol_par_fut_L: 5 } },
      { type: 'ouillage', cuvees_ids: ['c2'], data: { vol_par_fut_L: 11 } }
    ]
  };
}
const VIDE = { cuves_vinif: [] };

if (!CONTRE) {
  const A = monter(cave(), VIDE);

  console.log('\n\u2500\u2500 1. \u2605 LA FONCTION S\u2019EX\u00c9CUTE \u2500\u2500');
  let ech = null, crash = null;
  try { ech = A._mlOuillages(AUJ, 4); } catch (e) { crash = e; }
  pose(!crash, '_mlOuillages ne l\u00e8ve plus de ReferenceError'
       + (crash ? ' \u2014 ' + crash.message : ''));
  if (crash) { console.log('\n' + vert + '/' + total); process.exit(1); }
  pose(ech.length > 0, 'et elle rend bien des \u00e9ch\u00e9ances (' + ech.length + ')');
  pose(ech.every(o => typeof o.futs === 'number' && isFinite(o.futs)),
       'chaque \u00e9ch\u00e9ance porte un nombre de f\u00fbts fini');

  console.log('\n\u2500\u2500 2. Les f\u00fbts sont compt\u00e9s PAR CUV\u00c9E \u2500\u2500');
  const parCuvee = {};
  ech.forEach(o => { parCuvee[o.cuvee.id] = o.futs; });
  pose(parCuvee.c1 === 6, 'Charmes : 6 f\u00fbts');
  pose(parCuvee.c2 === 2, 'Village : 2 f\u00fbts');
  pose(parCuvee.c5 === 3, 'Neuve : 3 f\u00fbts');
  pose(parCuvee.c1 !== parCuvee.c2, 'deux cuv\u00e9es ne partagent pas le m\u00eame compte');

  console.log('\n\u2500\u2500 3. Les litres suivent le volume par f\u00fbt de CETTE cuv\u00e9e \u2500\u2500');
  pose(A._mlVolParFut('c1') === 5, 'Charmes ouille \u00e0 5 L/f\u00fbt');
  pose(A._mlVolParFut('c2') === 11, 'Village ouille \u00e0 11 L/f\u00fbt');
  pose(A._mlVolParFut('c9') === 8, 'cuv\u00e9e inconnue \u2192 moyenne du domaine (8)');
  const l1 = ech.find(o => o.cuvee.id === 'c1');
  pose(l1.litres === 30, '6 f\u00fbts \u00d7 5 L = 30 L');

  console.log('\n\u2500\u2500 4. Seules les cuv\u00e9es qui s\u2019ouillent entrent \u2500\u2500');
  pose(!ech.some(o => o.cuvee.id === 'c3'), 'la cuve inox n\u2019est PAS \u00e0 l\u2019agenda');
  pose(ech.some(o => o.cuvee.id === 'c4'), 'le foudre bois, si');
  pose(A._caveOuille(cave().cuvees[2]) === false, '_caveOuille dit non \u00e0 l\u2019inox');
  pose(A._caveOuille(cave().cuvees[3]) === true, '_caveOuille dit oui au bois');

  console.log('\n\u2500\u2500 5. Jamais ouill\u00e9e = due aujourd\u2019hui, et \u00e7a se dit \u2500\u2500');
  const neuve = ech.filter(o => o.cuvee.id === 'c5');
  pose(neuve[0].date === AUJ, 'la premi\u00e8re \u00e9ch\u00e9ance tombe aujourd\u2019hui');
  pose(neuve[0].jamais === true, 'et elle est marqu\u00e9e « jamais ouill\u00e9e »');
  pose(neuve[0].retard === 0, 'sans retard invent\u00e9 \u2014 il n\u2019y a pas de pr\u00e9c\u00e9dent');

  console.log('\n\u2500\u2500 6. Le retard se compte, et ram\u00e8ne l\u2019\u00e9ch\u00e9ance \u00e0 aujourd\u2019hui \u2500\u2500');
  const vil = ech.filter(o => o.cuvee.id === 'c2');
  pose(vil[0].date === AUJ, 'Village, ouill\u00e9 le 20/08 avec un seuil de 14 j, est en retard');
  pose(vil[0].retard === 4, 'de 4 jours exactement');
  pose(vil.slice(1).every(o => o.retard === 0), 'les \u00e9ch\u00e9ances suivantes ne recopient pas le retard');

  console.log('\n\u2500\u2500 7. La cadence est propre \u00e0 chaque mill\u00e9sime \u2500\u2500');
  const ecC1 = ech.filter(o => o.cuvee.id === 'c1').map(o => o.date);
  const ecC2 = vil.map(o => o.date);
  const pas = (a) => (new Date(a[1]) - new Date(a[0])) / 86400000;
  pose(pas(ecC1) === 7, 'un 2026 revient tous les 7 jours');
  pose(pas(ecC2) === 14, 'un 2025 tous les 14');

  console.log('\n\u2500\u2500 8. La garde borne la boucle \u2500\u2500');
  const B = monter(cave(), VIDE, null, () => 1);   // seuil d'un jour
  pose(B._mlOuillages(AUJ, 52).filter(o => o.cuvee.id === 'c1').length <= 12,
       'm\u00eame \u00e0 un jour de seuil sur un an, 12 \u00e9ch\u00e9ances au plus par cuv\u00e9e');

  console.log('\n\u2500\u2500 9. L\u2019agenda tient debout \u2500\u2500');
  let sem = null, crash2 = null;
  try { sem = A._mlAgenda(AUJ, 4); } catch (e) { crash2 = e; }
  pose(!crash2, '_mlAgenda ne plante pas' + (crash2 ? ' \u2014 ' + crash2.message : ''));
  pose(sem && sem.length === 4, 'quatre semaines');
  pose(sem && sem[0].items.length > 0, 'la premi\u00e8re porte des items');
  const r = A._mlResumeSem(sem[0]);
  pose(r.futs > 0 && r.litres > 0, 'le r\u00e9sum\u00e9 de semaine additionne f\u00fbts et litres');

  console.log('\n\u2500\u2500 10. \u2605 UNE ALERTE PASSE AVANT UN OUILLAGE \u2500\u2500');
  const CV = { cuves_vinif: [{ id: 'v1', nom: 'Cuve 4', statut: 'fa',
    mesures_fa: [{ id: 'm1', date: AUJ, densite: 1050, temp_c: 31 }] }] };
  const D = monter(cave(), CV);
  const s0 = D._mlAgenda(AUJ, 4)[0];
  const duJour = s0.items.filter(i => i.date === AUJ);
  const iAl = duJour.findIndex(i => i.kind === 'alerte');
  const iOu = duJour.findIndex(i => i.kind === 'ouillage');
  pose(iAl !== -1, 'la temp\u00e9rature \u00e0 31 \u00b0C l\u00e8ve une alerte');
  pose(iOu !== -1, 'et il y a bien un ouillage le m\u00eame jour');
  pose(iAl < iOu, '\u2605 l\u2019alerte est AVANT l\u2019ouillage (le pi\u00e8ge du 0||9)');

} else {
  /* ══ CONTRE-ÉPREUVES ═══════════════════════════════════════════════════════
     Chaque défaut est réintroduit dans le bloc extrait. Une contre-épreuve qui
     ne peut pas rougir ne prouve rien : le motif est vérifié avant mutation. */
  console.log('\n\u2500\u2500 CONTRE-\u00c9PREUVES \u2014 chaque d\u00e9faut r\u00e9introduit doit rougir \u2500\u2500');
  const cas = [
    ['C1 \u2605 `futs` \u00e0 nouveau jamais d\u00e9clar\u00e9 \u2014 LE D\u00c9FAUT DU 30/08',
     b => b.replace('var garde=0, futs=_caveNbTonneaux(c);', 'var garde=0;'),
     A => A._mlOuillages(AUJ, 4).length > 0,
     'ReferenceError, tout l\u2019agenda tombe'],
    ['C2 \u00b7 `futs` sorti de la boucle des cuv\u00e9es',
     b => b.replace('var garde=0, futs=_caveNbTonneaux(c);', 'var garde=0; futs=futs||_caveNbTonneaux(c);')
           .replace('function _mlOuillages(from,nSem){\n  var fin=', 'function _mlOuillages(from,nSem){\n  var futs=0;\n  var fin='),
     A => { const e = A._mlOuillages(AUJ, 4); const m = {}; e.forEach(o => m[o.cuvee.id] = o.futs);
            return m.c1 !== m.c2; },
     'toute la cave prend le compte de la premi\u00e8re cuv\u00e9e'],
    ['C3 \u00b7 le seuil sorti de la boucle',
     b => b.replace('    var seuil=_mlSeuil(c);', '    var seuil=_mlSeuil(CAVE_ELEVAGE.cuvees[0]);'),
     A => { const e = A._mlOuillages(AUJ, 4).filter(o => o.cuvee.id === 'c2').map(o => o.date);
            return (new Date(e[1]) - new Date(e[0])) / 86400000 === 14; },
     'un 2025 se met \u00e0 la cadence d\u2019un 2026'],
    ['C4 \u00b7 le filtre `_caveOuille` remplac\u00e9 par le compte de f\u00fbts',
     b => b.replace('    if(!_caveOuille(c)) return;', '    if(!_caveNbTonneaux(c)) return;'),
     A => A._mlOuillages(AUJ, 4).some(o => o.cuvee.id === 'c4'),
     'le foudre bois sort de l\u2019agenda'],
    ['C5 \u00b7 `(ordre[k]||9)` r\u00e9introduit dans le tri',
     b => b.replace('var oa=(ordre[a.kind]!=null?ordre[a.kind]:9), ob=(ordre[b.kind]!=null?ordre[b.kind]:9);',
                    'var oa=(ordre[a.kind]||9), ob=(ordre[b.kind]||9);'),
     A => { const CV = { cuves_vinif: [{ id: 'v1', nom: 'Cuve 4', statut: 'fa',
              mesures_fa: [{ id: 'm1', date: AUJ, densite: 1050, temp_c: 31 }] }] };
            const s = A.__agendaAvec(CV); const j = s[0].items.filter(i => i.date === AUJ);
            return j.findIndex(i => i.kind === 'alerte') < j.findIndex(i => i.kind === 'ouillage'); },
     'l\u2019alerte de temp\u00e9rature repasse sous les ouillages'],
    ['C6 \u00b7 `cuvees_ids` relu comme `cuvees` dans _mlVolParFut',
     b => b.replace('var _ids=o.cuvees_ids||(o.cuvee_id?[o.cuvee_id]:[]);', 'var _ids=o.cuvees||[];'),
     A => A._mlVolParFut('c1') === 5,
     'le volume d\u2019un 2026 se calcule sur les ouillages du 2025']
  ];
  for (const [nom, mut, verif, effet] of cas) {
    if (mut(BLOC) === BLOC) { pose(false, nom + ' \u2014 motif introuvable, la contre-\u00e9preuve ne peut pas rougir'); continue; }
    let rougit = false;
    try {
      const CVal = { cuves_vinif: [{ id: 'v1', nom: 'Cuve 4', statut: 'fa',
        mesures_fa: [{ id: 'm1', date: AUJ, densite: 1050, temp_c: 31 }] }] };
      const A = monter(cave(), CVal, mut);
      A.__agendaAvec = () => A._mlAgenda(AUJ, 4);
      rougit = !verif(A);
    } catch (e) { rougit = true; }
    console.log('   ' + nom + ' \u2192 ' + effet);
    pose(rougit, nom + ' fait bien rougir');
  }
}

console.log('\n' + vert + '/' + total + ' assertions vertes');
if (rouges.length) { console.error('ROUGE : ' + rouges.join(' | ')); process.exit(1); }
