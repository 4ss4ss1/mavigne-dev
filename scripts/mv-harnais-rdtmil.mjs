/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE PLAFOND DE RENDEMENT PAR MILLESIME (lot RDTMIL-1)
   Lancer :          node scripts/mv-harnais-rdtmil.mjs
   Contre-épreuves : node scripts/mv-harnais-rdtmil.mjs --contre

   CE QU'IL EMPÊCHE DE REVENIR
   Le 07/09/2026, Nico : « impossible de rentrer des plafonds de rendement pour
   les millesimes […] il n'y a juste pas l'option ». Trois défauts empilés :

   1. `p.rdt_max` était un SCALAIRE. Le rendement annuel autorisé est fixé par
      arrêté, campagne par campagne : le poser depuis l'écran d'un millésime
      réécrivait tous les autres, en silence.
   2. La carte du Pilotage renvoyait « depuis Le millésime » — et le Pilotage a
      un onglet qui porte EXACTEMENT ce nom. Le renvoi se lisait depuis l'écran
      qu'il croyait désigner.
   3. Poser 45 fois le même chiffre n'est pas une saisie, c'est une corvée.

   LES RÈGLES GRAVÉES ICI
   A. Un plafond se lit POUR UN MILLÉSIME. Deux millésimes, deux valeurs.
   B. AUCUN RATTRAPAGE : l'ancien scalaire n'est jamais recopié dans une année,
      il sert de repli et se déclare `herite`.
   C. Écrire un millésime ne touche NI les autres millésimes NI `p.rdt_max`.
   D. La pose groupée ne vise QUE les parcelles sans aucun plafond.
   E. Une seule porte d'écriture, appelée par les deux écrans, avec le rendu
      rendu à l'appelant.
   F. Aucun renvoi ne dit « depuis Le millésime » tout court : entre deux écrans
      homonymes, un chemin incomplet ne renvoie nulle part.

   Méthode C20 : les fonctions sont extraites de src/cave.js et exécutées pour
   de vrai. Aucune réécriture du calcul ici — un harnais qui recopie la formule
   qu'il teste ne prouve rien.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const CAVE = readFileSync('src/cave.js', 'utf8');
const PILO = readFileSync('src/pilotage.js', 'utf8');
const UTIL = readFileSync('src/utils.js', 'utf8');

const T = '\u001b[0m', R = '\u001b[31m', V = '\u001b[32m';
let vert = 0, rouge = 0;
function t(nom, ok) {
  if (ok) { vert++; console.log(`  ${V}\u2713${T} ${nom}`); }
  else { rouge++; console.log(`  ${R}\u2717 ${nom}${T}`); }
}

/* ══ EXTRACTION ════════════════════════════════════════════════════════════ */
const NOMS = ['_vendParcByName', '_vendAocNorm', '_vendAocList', '_vendAocDe',
              '_vendAocMax', '_vendRdtMax', '_vendSetRdtMax', '_mlRdtMoyen'];
function extraire(nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(CAVE);
  if (!m) { console.error('ABSENTE de src/cave.js : ' + nom); process.exit(1); }
  let i = CAVE.indexOf('{', m.index), d = 0;
  for (let j = i; j < CAVE.length; j++) {
    if (CAVE[j] === '{') d++;
    else if (CAVE[j] === '}' && --d === 0) return [m.index, CAVE.slice(m.index, j + 1)];
  }
  console.error('accolade non fermee : ' + nom); process.exit(1);
}
const BLOC = NOMS.map(extraire).sort((a, b) => a[0] - b[0]).map(x => x[1]).join('\n');

function monter(parc, mutation, aoc) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  const w = { PARCELLES: parc, CONFIG: { appellations: aoc || [] } };
  return new Function('PARCELLES', 'window',
    corps + '\nreturn {_vendRdtMax,_vendSetRdtMax,_vendParcByName,_vendAocDe,_vendAocMax,_mlRdtMoyen};')(parc, w);
}

const neuve = () => ([
  { nom: 'Ruchottes', surface: 0.42 },
  { nom: '20 Rangs', surface: 1.05 },
  { nom: 'Au Vell\u00e9', surface: 0.61, rdt_max: 40 }   // l'heritage : sans annee
]);

console.log('\n\u2500\u2500 A. un plafond se lit POUR UN MILLESIME \u2500\u2500');
{
  const P = neuve(), M = monter(P);
  const r = M._vendParcByName('Ruchottes');
  M._vendSetRdtMax(r, 2026, 45);
  M._vendSetRdtMax(r, 2025, 38.5);
  t('2026 rend sa propre valeur', M._vendRdtMax(r, 2026).max === 45);
  t('2025 rend la sienne, pas celle de 2026', M._vendRdtMax(r, 2025).max === 38.5);
  t('un millesime jamais pose rend null', M._vendRdtMax(r, 2024).max === null);
  t('la source d\'une valeur posee est \u00ab mil \u00bb', M._vendRdtMax(r, 2026).src === 'mil');
  t('le millesime se compare en CHAINE (2026 === \u00ab 2026 \u00bb)',
    M._vendRdtMax(r, '2026').max === 45);
  t('une parcelle absente ne leve pas', M._vendRdtMax(null, 2026).max === null);
}

console.log('\n\u2500\u2500 B. AUCUN RATTRAPAGE de l\'ancien scalaire \u2500\u2500');
{
  const P = neuve(), M = monter(P);
  const v = M._vendParcByName('Au Vell\u00e9');
  t('l\'heritage sert de repli sur n\'importe quelle annee', M._vendRdtMax(v, 2026).max === 40);
  t('\u2026 et se DECLARE herite, jamais \u00ab mil \u00bb', M._vendRdtMax(v, 2026).src === 'herite');
  t('l\'heritage n\'a PAS ete recopie dans rdt_max_hist', v.rdt_max_hist === undefined);
  M._vendSetRdtMax(v, 2026, 45);
  t('poser 2026 le remplace pour 2026', M._vendRdtMax(v, 2026).max === 45);
  t('\u2026 sans toucher aux autres annees, qui restent heritees',
    M._vendRdtMax(v, 2025).max === 40 && M._vendRdtMax(v, 2025).src === 'herite');
  t('\u2026 et sans jamais reecrire p.rdt_max', v.rdt_max === 40);
}

console.log('\n\u2500\u2500 C. ecrire une annee n\'en touche aucune autre \u2500\u2500');
{
  const P = neuve(), M = monter(P);
  const r = M._vendParcByName('20 Rangs');
  M._vendSetRdtMax(r, 2024, 35);
  M._vendSetRdtMax(r, 2025, 40);
  M._vendSetRdtMax(r, 2026, 45);
  t('trois annees, trois lignes', r.rdt_max_hist.length === 3);
  M._vendSetRdtMax(r, 2025, 41);
  t('corriger 2025 ne cree pas de doublon', r.rdt_max_hist.length === 3);
  t('corriger 2025 laisse 2024 et 2026 intacts',
    M._vendRdtMax(r, 2024).max === 35 && M._vendRdtMax(r, 2026).max === 45);
  t('valider a vide RETIRE la ligne du millesime', M._vendSetRdtMax(r, 2025, null) === true);
  t('\u2026 et d\'elle seule', r.rdt_max_hist.length === 2 && M._vendRdtMax(r, 2025).max === null);
  t('retirer une ligne qui n\'existe pas ne rend pas vrai',
    M._vendSetRdtMax(r, 2019, null) === false);
  t('une valeur <= 0 n\'ecrit pas un plafond', M._vendSetRdtMax(r, 2023, 0) === false
    && M._vendRdtMax(r, 2023).max === null);
  t('la valeur est arrondie au dixieme, comme le formulaire l\'annonce',
    (M._vendSetRdtMax(r, 2022, 44.44), M._vendRdtMax(r, 2022).max === 44.4));
  t('sans millesime, on n\'ecrit rien', M._vendSetRdtMax(r, null, 45) === false);
}

console.log('\n\u2500\u2500 D. la pose groupee ne vise que ce qui est VIDE \u2500\u2500');
{
  // _mlRdtSansMax lit CAVE_VENDANGE : on verifie le contrat par le texte, la
  // logique de selection etant celle de _vendRdtMax, deja eprouvee ci-dessus.
  const f = /function _mlRdtSansMax\(mil\)\{[\s\S]*?\n\}/.exec(CAVE);
  t('_mlRdtSansMax existe', !!f);
  const s = f ? f[0] : '';
  t('elle passe par _mlRecoltesDe (un seul filtre de millesime dans le fichier)',
    /_mlRecoltesDe\(mil\)/.test(s));
  t('elle apparie les noms par _vendParcByName, jamais en brut',
    /_vendParcByName\(r\.parcelle\)/.test(s));
  t('elle ne retient QUE les parcelles dont le plafond est null',
    /_vendRdtMax\(p,\s*mil\)\.max\s*==\s*null/.test(s));
  const g = /function _mlRdtProposeGroupe\([\s\S]*?\n\}/.exec(CAVE);
  t('_mlRdtProposeGroupe existe', !!g);
  const gs = g ? g[0] : '';
  t('elle NOMME les parcelles avant de rien faire', /apercu/.test(gs) && /noms\.slice\(0,\s*6\)/.test(gs));
  t('elle dit en clair que les autres ne sont pas touchees',
    /ne sont pas touch/.test(gs));
  t('★ elle groupe les ecritures : 45 parcelles ne font pas 45 transactions',
    /_vendParcLot\(/.test(gs));
  t('elle ne s\'ouvre jamais sur une valeur nulle', /if\(!\(val>0\)\)\s*return;/.test(gs));
}

console.log('\n\u2500\u2500 E. UNE SEULE PORTE D\'ECRITURE, deux appelants \u2500\u2500');
{
  t('_mlSetRdtMax prend (nom, mil, apres)',
    /function _mlSetRdtMax\(nom,\s*mil,\s*apres\)/.test(CAVE));
  t('★ elle rend la main a l\'appelant, sinon redessine la Cave',
    /typeof apres==='function'\)\?apres:function\(\)\{ renderCaveMillesime\(\); \}/.test(CAVE));
  t('le droit admin est verifie DANS la fonction, pas chez l\'appelant',
    /function _mlSetRdtMax[\s\S]{0,240}isAdmin\(\)/.test(CAVE));
  t('elle n\'ecrit plus jamais p.rdt_max directement',
    !/p\.rdt_max\s*=\s*Math\.round/.test(CAVE));
  t('_vendRdtMax est expose pour le Pilotage', /window\._vendRdtMax\s*=/.test(CAVE));
  /* Lot CAVE-3 : la carte « Rendement face au plafond » du Pilotage a disparu
     avec l'onglet Pilotage › Cave — c'etait une copie du bloc de La ligne de
     vie. Le Pilotage ne touche plus au plafond, ni en lecture ni en ecriture. */
  t('le Pilotage n\'a plus de carte rendement : ni pose, ni historique',
    !/_mlSetRdtMax/.test(PILO) && !/rdt_max/.test(PILO) && !/_pcavRdt/.test(PILO));
  // ⚠️ C24b : toute valeur posee dans un slot JS de gestionnaire passe par
  //    _escAttr, y compris un nombre. Le cliquet compte, il ne raisonne pas —
  //    et une exception « c'est un entier » se transforme un jour en variable.
  t('le bouton du millesime passe bien le millesime, via _escAttr',
    /_mlSetRdtMax\(\\''\+_escAttr\(r\.parcelle\.nom\)\+'\\','\+_escAttr\(mil\)\+'\)/.test(CAVE));
  t('★ la pose passe par la porte de la Cave, seul ecrivain',
    /function _mlSetRdtMax\(nom,mil,apres\)/.test(CAVE) && !/_pcavPoseRdt/.test(CAVE));
  t('_mlGo sait atterrir sur l\'ecran de pose', /kind==='rdtmax'/.test(CAVE));
}

console.log('\u2500\u2500 G. L\'APPELLATION : la ou le plafond a un sens \u2500\u2500');
{
  const AOC = [{ nom: 'Gevrey-Chambertin', rdt_max_hist: [{ mil: '2026', max: 40 }] },
               { nom: 'Gevrey-Chambertin 1er Cru', rdt_max_hist: [{ mil: '2026', max: 45 }] }];
  const P = [
    { nom: 'Ruchottes', surface: 0.42, appellation: 'Gevrey-Chambertin 1er Cru' },
    { nom: '20 Rangs',  surface: 1.05, appellation: 'gevrey-chambertin  ' },  // casse + espaces
    { nom: 'Reniard',   surface: 0.30, appellation: 'Appellation Inconnue' },
    { nom: 'Au Vell\u00e9', surface: 0.61, rdt_max: 38 },
    { nom: 'Herbues',   surface: 0.50, appellation: 'Gevrey-Chambertin', rdt_max_hist: [{ mil: '2026', max: 33 }] }
  ];
  const M = monter(P, null, AOC);
  const g = n => M._vendRdtMax(M._vendParcByName(n), 2026);
  t('une parcelle prend le plafond de son appellation', g('Ruchottes').max === 45);
  t('\u2026 et le DECLARE comme venant de l\'appellation', g('Ruchottes').src === 'aoc');
  t('\u2026 en nommant laquelle', g('Ruchottes').aoc === 'Gevrey-Chambertin 1er Cru');
  t('★ le rattachement se compare NORMALISE (casse et espaces)', g('20 Rangs').max === 40);
  t('une appellation inconnue ne rend aucun plafond', g('Reniard').max === null);
  t('\u2026 et ne pretend pas etre rattachee', g('Reniard').aoc === null);
  t('★ le plafond POSE SUR LA PARCELLE bat celui de l\'appellation',
    g('Herbues').max === 33 && g('Herbues').src === 'mil');
  t('sans appellation, l\'ancien scalaire reste le repli',
    g('Au Vell\u00e9').max === 38 && g('Au Vell\u00e9').src === 'herite');
  t('une annee sans arrete pose ne rend rien', M._vendRdtMax(M._vendParcByName('Ruchottes'), 2025).max === null);
  t('_vendAocMax ignore une valeur <= 0',
    M._vendAocMax({ rdt_max_hist: [{ mil: '2026', max: 0 }] }, 2026) === null);
}

console.log('\n\u2500\u2500 H. LE RENDEMENT MOYEN : ce que le domaine rentre, sur ce qu\'il recolte \u2500\u2500');
{
  /* Formule EXTRAITE de la source, rejouee sur un domaine calque sur la capture
     de Nico : 11,8 ha, rien de decuve, et une parcelle dont une partie est
     vendue AVEC sa surface achetee saisie.
     Historique des faux : hlDecuve/ha -> 0 ; (hlDecuve+hlCuve)/ha -> 13,7 ;
     tout/tout -> 20,3 (juste pour la vigne, pas pour la cave). */
  const F = /function _mlRdtMoyen\(ch\)\{[\s\S]*?\n\}/.exec(CAVE);
  t('_mlRdtMoyen existe', !!F);
  const src = F ? F[0] : '';

  // parts : la portion domaine {kg, hl, connu} ; surf : la ligne domaine {ha, src}
  const P = (nom, kg, hl, connu, ha, ssrc) => ({
    parcelle: { nom: nom, surface: 3 }, kg: kg,
    rdt: { parts: [{ dom: true, kg: kg, hl: hl, connu: connu },
                   { dom: false, kg: 1000, hl: 0, connu: 0 }],
           surf: { lignes: [{ dom: true, ha: ha, src: ssrc },
                            { dom: false, ha: 1, src: 'declaree' }] },
           vol: { hl: hl, kgKo: kg - connu, statut: connu >= kg ? 'mesure' : 'estime' } }
  });
  const moy = (liste, retro) => new Function('window', 'ch',
    'function _mlKgHl(){return 121;}function _mlRendements(){return '
    + JSON.stringify(liste) + ';}\n' + src + '\nreturn _mlRdtMoyen(ch);')({}, { millesime: 2026, retro: retro });

  {
    // 3 ha de parcelle, 1 ha vendu et DECLARE -> le domaine a recolte 2 ha.
    const r = moy([P('A', 4840, 0, 0, 2, 'reste')]);
    t('★ la surface ACHETEE est deduite : 2 ha, pas 3', r.ha === 2);
    t('★ \u2026 et le volume est celui du DOMAINE seul', Math.round(r.hl) === 40);
    t('★ 20 hL/ha \u2014 le rendement de la cave, pas celui de la vigne',
      Math.round(r.hlHa * 10) / 10 === 20);
    t('rien de mesure \u2192 statut estime', r.statut === 'estime');
    t('aucune information ne manque', r.approx === 0 && r.sansSurface === 0);
  }
  {
    // Surface achetee NON saisie sur deux destinations -> partage au prorata.
    const r = moy([P('B', 4840, 0, 0, 1.8, 'reste-prorata')]);
    t('★ une surface vendue non renseign\u00e9e est COMPT\u00c9E, pas ignor\u00e9e', r.approx === 1);
    t('\u2026 et le chiffre sort quand m\u00eame, marqu\u00e9 comme approch\u00e9', r.hlHa != null);
  }
  {
    const r = moy([P('C', 2000, 0, 0, 0, 'aucune')]);
    t('★ sans aucune surface pour le domaine, la parcelle est \u00e9cart\u00e9e', r.sansSurface === 1);
    t('\u2026 et rien n\'est invent\u00e9 : pas de chiffre', r.hlHa === null);
  }
  {
    const r = moy([P('D', 2420, 20, 2420, 2, 'declaree')]);
    t('la part du domaine enti\u00e8rement mesur\u00e9e \u2192 statut mesure', r.statut === 'mesure');
    t('\u2026 et le volume connu est repris tel quel', r.hl === 20);
  }
  {
    // Parcelle 100 % vendue : le domaine n'a rien rentre, elle ne pese pas.
    const z = { parcelle: { nom: 'E', surface: 3 }, kg: 0,
      rdt: { parts: [{ dom: true, kg: 0, hl: 0, connu: 0 }],
             surf: { lignes: [{ dom: true, ha: 0, src: 'aucune' }] }, vol: {} } };
    t('★ une parcelle enti\u00e8rement vendue n\'est pas compt\u00e9e comme \u00ab sans surface \u00bb',
      moy([z]).sansSurface === 0);
  }
  t('un millesime retro retombe sur son bilan fige',
    moy([], true) && new Function('window', 'ch',
      'function _mlKgHl(){return 121;}function _mlRendements(){return [];}\n' + src
      + '\nreturn _mlRdtMoyen(ch);')({}, { retro: true, ha: 10, hlDecuve: 300, millesime: 2019 }).hlHa === 30);

  /* Lot CAVE-3 : la tuile « Rendement moyen » est rentree dans la Cave
     (_mlTuiles) ; le Pilotage n'affiche plus de rendement de cave. */
  t('★ la tuile du millesime et le bilan lisent la MEME fonction',
    /function _mlTuiles\(ch\)\{[\s\S]{0,200}_mlRdtMoyen\(ch\)/.test(CAVE)
    && /var _rm = _mlRdtMoyen\(d\.chaine\);/.test(CAVE));
  t('★ plus aucune division ch.hlDecuve\/ch.ha a l\'ecran', !/ch\.hlDecuve\/ch\.ha/.test(PILO));
  t('★ la moyenne ne lit plus hlCuve : le raisin vendu n\'y passe jamais',
    !/hlCuve/.test(src));
  t('★ elle lit la surface par `_vendSurfParc`, pas `p.surface`',
    /d\.surf\.lignes/.test(src) && !/parseFloat\(o\.parcelle\.surface\)/.test(src));
  t('les deux surfaces nomment l\'information qui manque',
    /vendue'\+\(rm\.approx>1\?'s':''\)\+' non renseign/.test(CAVE)
    && /d\.rdtMoyenAx>0/.test(CAVE));
  t('le bilan imprime porte le \u00ab \u2248 \u00bb quand une surface manque',
    CAVE.includes("((d.rdtMoyenEst||d.rdtMoyenAx>0)?'\\u2248 ':'')"));
}

console.log('\n\u2500\u2500 I. la carte des Reglages \u2500\u2500');
{
  const REG = readFileSync('src/reglages.js', 'utf8');
  t('la carte existe et est rendue avec l\'onglet Domaine',
    // ★ Lot NAV-3 : la carte « Economie & conformite » n'existe plus (conso GNR dans la
    //   roue du Tracteur, IFT dans celle du Pilotage) ; la carte des appellations suit
    //   directement _ecoRenderConsoCard dans renderReglages, et s'ancre sur #saisons-list.
    /function _aocRenderCard\(\)/.test(REG) && /_ecoRenderConsoCard\(\);\n    _aocRenderCard\(\);/.test(REG));
  t('elle est reservee a l\'administrateur',
    /function _aocRenderCard\(\)\{\n  if\(typeof isAdmin==='function'&&!isAdmin\(\)\) return;/.test(REG));
  t('CONFIG.appellations est mute EN PLACE, jamais remplace',
    !/CONFIG\s*=\s*\{[^}]*appellations/.test(REG));
  t('★ renommer une appellation reporte le nom sur ses parcelles',
    /l\.forEach\(function\(p\)\{ p\.appellation=neuf; \}\)/.test(REG));
  t('★ supprimer DIT combien de parcelles sont detachees',
    /perd'\+\(n>1\?'ent':''\)\+' son rattachement/.test(REG));
  t('un doublon de nom est refuse au nom normalise',
    /if\(_aocTrouve\(nom\)\)\{[^}]*existe d/.test(REG));
  t('l\'habillage est inline, pas les classes mvc-\* de la Cave',
    !/class="mvc-set-card"/.test(REG.slice(REG.indexOf('function _aocRenderCard'))));
  t('les millesimes proposes viennent de la Cave, pas de nulle part',
    /_mlMillesimes\(\)/.test(REG));
}

console.log('\n\u2500\u2500 F. le renvoi nomme un CHEMIN, pas un ecran homonyme \u2500\u2500');
{
  t('★ plus aucun \u00ab depuis Le millesime \u00bb seul dans le Pilotage',
    !/depuis Le mill\u00e9sime pour obtenir/.test(PILO));
  /* Lot CAVE-3 : il n'y a plus qu'UN ecran « Le millesime » — l'homonymie que
     ces trois assertions gardaient a disparu avec l'onglet Pilotage › Cave. */
  t('un seul ecran s\'appelle « Le millesime » : le Pilotage n\'en a plus',
    !/\['cav',/.test(PILO) && !/_pcavVueMillesime/.test(PILO) && !/_pcavVueMillesime/.test(CAVE));
  t('la carte propose le geste sur place : chaque ligne de rendement pose le plafond',
    /onclick="_mlSetRdtMax\(/.test(CAVE));
  t('la fiche MV_INFO du rendement suit le bloc de la Cave (cave.rdt, « ici meme »)',
    /'cave\.rdt'/.test(UTIL) && /le pose <b>ici même<\/b>/.test(UTIL) && !/'pil\.cav\.rdt'/.test(UTIL));
  t('l\'ecran du millesime nomme l\'annee de son plafond',
    /titre:'Rendement maximum '\+m,/.test(CAVE)
    && /appellation pour ce mill\\u00e9sime/.test(CAVE)
    && /appellation renseign\\u00e9 pour '\+mil/.test(CAVE));
  t('un plafond herite est annonce comme tel a l\'ecran',
    /maxSrc==='herite'/.test(CAVE));
  t('le guide ne dit plus que le Pilotage ne modifie jamais rien',
    !/Il ne\s+modifie jamais rien/.test(readFileSync('guide/11-pilotage.html', 'utf8')));
  t('le guide de la Cave ne dit plus \u00ab aucune saisie \u00bb',
    !/ne demande <b>aucune saisie<\/b>/.test(readFileSync('guide/08-cave.html', 'utf8')));
}

/* ══ CONTRE-EPREUVES ═══════════════════════════════════════════════════════
   Chaque règle doit ROUGIR quand on la casse. Une assertion qui reste verte
   sur du code cassé ne teste rien (§80). */
if (CONTRE) {
  console.log('\n\u2500\u2500 contre-epreuves \u2500\u2500');
  const cas = [
    ['le repli lit rdt_max_hist au lieu de rdt_max \u2192 l\'heritage disparait',
      s => s.replace('var g=parseFloat(p.rdt_max);', 'var g=NaN;'),
      M => M._vendRdtMax(M._vendParcByName('Au Vell\u00e9'), 2026).max === 40],
    ['l\'heritage cesse de se declarer \u2192 on croit une valeur datee',
      s => s.replace("return {max:g,src:'herite',aoc:nom};", "return {max:g,src:'mil',aoc:nom};"),
      M => M._vendRdtMax(M._vendParcByName('Au Vell\u00e9'), 2026).src === 'herite'],
    ['l\'ecriture ignore le millesime \u2192 une annee ecrase l\'autre',
      s => s.replace('var k=String(mil), i=-1;', 'var k="*", i=-1;'),
      M => { const r = M._vendParcByName('Ruchottes');
             M._vendSetRdtMax(r, 2026, 45); M._vendSetRdtMax(r, 2025, 38);
             return M._vendRdtMax(r, 2026).max === 45; }],
    ['l\'ecriture retombe sur p.rdt_max \u2192 tous les millesimes suivent',
      s => s.replace('if(i<0) p.rdt_max_hist.push({mil:k,max:v}); else p.rdt_max_hist[i].max=v;',
                     'p.rdt_max=v;'),
      M => { const r = M._vendParcByName('Ruchottes');
             M._vendSetRdtMax(r, 2026, 45);
             return M._vendRdtMax(r, 2025).max === null; }],
    ['une valeur nulle cesse de retirer la ligne \u2192 rien ne s\'efface',
      s => s.replace('if(i<0) return false;\n    p.rdt_max_hist.splice(i,1);\n    return true;',
                     'return false;'),
      M => { const r = M._vendParcByName('Ruchottes');
             M._vendSetRdtMax(r, 2026, 45); M._vendSetRdtMax(r, 2026, null);
             return M._vendRdtMax(r, 2026).max === null; }]
  ];
  cas.forEach(([nom, mut, verif], i) => {
    let ok;
    try { ok = verif(monter(neuve(), mut)); } catch (e) { ok = false; }
    // L'assertion doit ECHOUER sur le code casse : ok === false = contre-epreuve reussie.
    t(`${i + 1}. ${nom} \u2192 rouge`, ok === false);
  });
}

console.log(`\n${rouge ? R : V}${vert} vertes, ${rouge} rouge${rouge > 1 ? 's' : ''}${T}\n`);
process.exit(rouge ? 1 : 0);
