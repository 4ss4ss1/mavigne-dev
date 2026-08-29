/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA CHAÎNE DE RENDEMENT (lots RDT-1 · RDT-2 · RDT-3)
   Lancer :          node scripts/mv-harnais-rendement.mjs
   Contre-épreuves : node scripts/mv-harnais-rendement.mjs --contre

   CE QU'IL EMPÊCHE DE REVENIR
   Le 28/08/2026, Pilotage › Cave annonçait 117,1 hL/ha sur 20 Rangs. Cause :
   `cuve.volume_hl` est la CONTENANCE de la cuve — elle se pré-remplit depuis le
   parc (_vcuvPick) et la jauge de remplissage la lit comme telle — mais
   _vendVolCuve la prenait pour le volume de vin produit. Une cuve de 60 hL
   remplie à 38 % rendait 60 hL, et le prorata étalait l'erreur sur toutes ses
   parcelles. Trois cuves sur quatre étaient touchées.

   LES TROIS RÈGLES GRAVÉES ICI
   1. Un volume de vin n'existe qu'APRÈS le décuvage. Avant, le rendement est une
      estimation au ratio kg/hL, et il le dit.
   2. Le rendement ne doit JAMAIS dépendre de la contenance de la cuve.
   3. Ce qui est déjà dans une cuve se RECALCULE depuis les récoltes. Rien ne
      s'accumule dans un champ, donc rien ne peut être compté deux fois.

   Méthode C20 : les fonctions sont extraites de src/cave.js et exécutées pour
   de vrai avec des bouchons minimaux. Aucune réécriture du calcul ici — un
   harnais qui recopie la formule qu'il teste ne prouve rien.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const SRC = readFileSync('src/cave.js', 'utf8');

/* ══ EXTRACTION — dans l'ordre du fichier (str.index avant de trancher) ═════ */
const NOMS = ['_vendCfg', '_vendClient', '_caveFutL', '_caveVolCuvesL', '_caveNbTonneaux',
  '_caveVolL', '_vendPckLegacy', '_vendParts', '_vpPck', '_vpCs', '_vpKg', '_vpNom', '_vpSurf',
  '_recKg', '_recCaisses', '_recKgDom', '_recCsDom', '_recKgCli', '_recHasDom', '_recSold',
  '_vendRdtBase', '_vendLitresRetour', '_vendVolLoge', '_vendCuvCsDom', '_vendVolCuve',
  '_vendVolPart', '_vendSurfParc', '_vendVolParc', '_vendRdtParc', '_vendParcSurf',
  '_vendMillOfDate', '_vendCuvHl', '_vendParcByName', '_mlKgHl', '_mlRecoltesDe',
  '_mlRendements'];

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
const BLOC = NOMS.map(extraire).sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

/* ══ BOUCHONS ══════════════════════════════════════════════════════════════ */
function monter(cv, ce, parc, mutation) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  const w = { PARCELLES: parc, CONFIG: { cave: { fut_l: 228 } } };
  return new Function('CAVE_VENDANGE', 'CAVE_ELEVAGE', 'PARCELLES', 'window',
    corps + '\nreturn {_mlRendements,_vendVolLoge,_vendCuvCsDom,_vendCuvHl};')(cv, ce, parc, w);
}

/* Le cas réel de Marchand-Grillot, millésime 2026 : la cuve « Au vellé » porte
   une contenance de 60 hL et reçoit 123 caisses domaine de trois parcelles. */
const PARC = [{ nom: '20 Rangs', surface: 0.1875 },
              { nom: 'Au Velle', surface: 0.3699 },
              { nom: '7 Rangs',  surface: 0.0667 }];
const CFG = { poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140 };
const CE_VIDE = { cuvees: [] };
const monde = cuve => ({
  config: CFG, cuves_vinif: [cuve], recoltes: [
    { id: 'r1', parcelle: '20 Rangs', date: '2026-08-20', cuve_id: 'v1', parts: [{ dom: true, caisses: 45, pck: 25 }] },
    { id: 'r2', parcelle: 'Au Velle', date: '2026-08-20', cuve_id: 'v1', parts: [{ dom: true, caisses: 71, pck: 25 }] },
    { id: 'r3', parcelle: '7 Rangs',  date: '2026-08-21', cuve_id: 'v1', parts: [{ dom: true, caisses: 7,  pck: 25 }] }]
});
const MACERE  = () => monde({ id: 'v1', nom: 'Au vellé', volume_hl: 60, statut: 'mpf' });
const par = (r, n) => r.find(x => x.parcelle.nom === n);

/* ══ VERDICT ═══════════════════════════════════════════════════════════════ */
let vert = 0, total = 0, rouges = [];
function pose(cond, quoi) {
  total++;
  if (cond) { vert++; console.log('  vert   ' + quoi); }
  else { rouges.push(quoi); console.log('  ROUGE  ' + quoi); }
}

if (!CONTRE) {
  console.log('\n── RDT-1 · une cuve qui macère ne donne aucun volume mesuré ──');
  {
    const r = monter(MACERE(), CE_VIDE, PARC)._mlRendements(2026);
    const g = par(r, '20 Rangs');
    console.log('   20 Rangs ' + g.hlHa + ' · Au Velle ' + par(r, 'Au Velle').hlHa
      + ' · 7 Rangs ' + par(r, '7 Rangs').hlHa + ' hL/ha');
    pose(Math.abs(g.hlHa - 44.4) < 0.15, '20 Rangs ≈ 44,4 hL/ha (annonçait 117,1)');
    pose(Math.abs(par(r, 'Au Velle').hlHa - 35.5) < 0.15, 'Au Velle ≈ 35,5 hL/ha (annonçait 93,6)');
    pose(g.statut === 'estime', 'le statut dit « estime »');
    pose(g.hlMin < g.hlMax, 'une fourchette encadre l’estimation');
    pose(r.every(x => x.hlHa < 80), 'aucune parcelle au-dessus de 80 hL/ha');
  }

  console.log('\n── RDT-1 · la contenance ne touche plus le rendement ──');
  {
    const a = monter(MACERE(), CE_VIDE, PARC)._mlRendements(2026)[0].hlHa;
    const b = monter(monde({ id: 'v1', nom: 'c', volume_hl: 200, statut: 'fa' }), CE_VIDE, PARC)._mlRendements(2026)[0].hlHa;
    console.log('   60 hL de contenance → ' + a + '   ·   200 hL → ' + b);
    pose(a === b, 'même rendement quelle que soit la contenance');
  }

  console.log('\n── RDT-2 · après décuvage, le volume logé fait la mesure ──');
  {
    const cv = monde({ id: 'v1', nom: 'c', volume_hl: 60, statut: 'termine',
                       decuvage: { cuvee_id: 'c1' }, vol_decuve_hl: 23.4 });
    const g = par(monter(cv, CE_VIDE, PARC)._mlRendements(2026), '20 Rangs');
    console.log('   20 Rangs ' + g.hlHa + ' hL/ha · statut ' + g.statut);
    pose(g.statut === 'mesure', 'le statut passe à « mesure »');
    pose(Math.abs(g.hlHa - (23.4 * 45 / 123) / 0.1875) < 0.1, 'prorata calculé sur le volume logé');
    pose(g.hlHa < 60, 'et le chiffre reste plausible');
  }

  console.log('\n── RDT-2 · rattrapage des cuves décuvées avant le lot ──');
  {
    const cv = monde({ id: 'v1', nom: 'c', volume_hl: 60, statut: 'termine', decuvage: { cuvee_id: 'c1' } });
    const ce = { cuvees: [{ id: 'c1', millesime: 2026, tonneaux: [{ annee: 2025, nb: 10 }], cuves: [{ ref: 'x', litres: 120 }] }] };
    const A = monter(cv, ce, PARC);
    const v = A._vendVolLoge(cv.cuves_vinif[0]);
    console.log('   volume relu sur la cuvée d’élevage : ' + v + ' hL (10 fûts + 120 L)');
    pose(Math.abs(v - 24) < 0.01, '10 × 228 L + 120 L = 24,00 hL');
    pose(par(A._mlRendements(2026), '20 Rangs').statut === 'mesure', 'statut « mesure » sans vol_decuve_hl');
  }

  console.log('\n── RDT-2 · une cuve sans décuvage n’a pas de volume ──');
  {
    const A = monter(MACERE(), CE_VIDE, PARC);
    pose(A._vendVolLoge(MACERE().cuves_vinif[0]) === 0, 'volume logé nul tant que la cuve n’est pas décuvée');
    pose(A._vendVolLoge(null) === 0, 'et nul sur une cuve absente');
  }

  console.log('\n── RDT-3 · le cumul est mort : tout se recalcule ──');
  {
    const A = monter(MACERE(), CE_VIDE, PARC);
    console.log('   caisses domaine de la cuve : ' + A._vendCuvCsDom('v1')
      + ' · hors la récolte éditée : ' + A._vendCuvCsDom('v1', 'r1'));
    pose(A._vendCuvCsDom('v1') === 123, '123 caisses rattachées');
    pose(A._vendCuvCsDom('v1', 'r1') === 78, '78 en excluant la récolte en cours d’édition');
    pose(A._vendCuvCsDom(null) === 0, 'aucune cuve, aucune caisse');
  }

  console.log('\n── RDT-3 · la source ne rebâtit plus le cumul ──');
  {
    pose(!/\+add\)\*10\)\/10/.test(SRC), '_vendCuvAtt ne propose plus « contenance + estimé »');
    pose(/vol_decuve_hl:existing/.test(SRC), 'saveVendCuve préserve vol_decuve_hl à l’édition');
    pose(!/el\.value=Math\.max\(1,Math\.round\(d\.kg/.test(SRC), 'la contenance ne se déduit plus des kilos');
    pose(/_vendCuvHl\(_vendCuvCsDom\(c\.id\)\)/.test(SRC), '_mlChaine estime « en cuve » d’après les caisses');
  }
} else {
  /* ══ CONTRE-ÉPREUVES ═════════════════════════════════════════════════════
     Chaque défaut est réintroduit dans le bloc extrait. Une contre-épreuve qui
     ne peut pas rougir ne prouve rien : ici, chacune DOIT ramener le 117,1. */
  console.log('\n── CONTRE-ÉPREUVES — chaque défaut réintroduit doit rougir ──');
  const cas = [
    ['C1 · volume_hl relu comme un volume de vin',
     b => b.replace('var vol=_vendVolLoge(cv);', 'var vol=cv?(parseFloat(cv.volume_hl)||0):0;')],
    ['C2 · garde de décuvage retirée de _vendVolLoge',
     b => b.replace('if(!cv||!cv.decuvage) return 0;',
                    'if(!cv) return 0; if(!cv.decuvage) return parseFloat(cv.volume_hl)||0;')]
  ];
  for (const [nom, mut] of cas) {
    const avant = mut(BLOC);
    if (avant === BLOC) { pose(false, nom + ' — le motif n’existe plus, la contre-épreuve ne peut pas rougir'); continue; }
    const v = monter(MACERE(), CE_VIDE, PARC, mut)._mlRendements(2026)[0].hlHa;
    console.log('   ' + nom + ' → 20 Rangs ' + v + ' hL/ha');
    pose(v > 100, nom + ' ramène bien un rendement impossible');
  }
}

console.log('\n' + vert + '/' + total + ' assertions vertes');
if (rouges.length) { console.error('ROUGE : ' + rouges.join(' | ')); process.exit(1); }
