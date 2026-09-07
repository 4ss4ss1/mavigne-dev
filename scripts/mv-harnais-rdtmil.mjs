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
const NOMS = ['_vendParcByName', '_vendRdtMax', '_vendSetRdtMax'];
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

function monter(parc, mutation) {
  const corps = mutation ? mutation(BLOC) : BLOC;
  const w = { PARCELLES: parc };
  return new Function('PARCELLES', 'window',
    corps + '\nreturn {_vendRdtMax,_vendSetRdtMax,_vendParcByName};')(parc, w);
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
  t('le Pilotage n\'ecrit PAS lui-meme : il appelle la porte de la Cave',
    /window\._mlSetRdtMax\(nom,\s*m,\s*function\(\)\{ _pilFillContent\(_pilData\(\)\); \}\)/.test(PILO)
    && !/rdt_max_hist/.test(PILO));
  // ⚠️ C24b : toute valeur posee dans un slot JS de gestionnaire passe par
  //    _escAttr, y compris un nombre. Le cliquet compte, il ne raisonne pas —
  //    et une exception « c'est un entier » se transforme un jour en variable.
  t('le bouton du millesime passe bien le millesime, via _escAttr',
    /_mlSetRdtMax\(\\''\+_escAttr\(r\.parcelle\.nom\)\+'\\','\+_escAttr\(mil\)\+'\)/.test(CAVE));
  t('★ sans millesime resolu, le Pilotage n\'ouvre AUCUNE saisie',
    /if\(!\(isFinite\(m\)&&m>0\)\)\{/.test(PILO));
  t('_mlGo sait atterrir sur l\'ecran de pose', /kind==='rdtmax'/.test(CAVE));
}

console.log('\n\u2500\u2500 F. le renvoi nomme un CHEMIN, pas un ecran homonyme \u2500\u2500');
{
  t('★ plus aucun \u00ab depuis Le millesime \u00bb seul dans le Pilotage',
    !/depuis Le mill\u00e9sime pour obtenir/.test(PILO));
  t('le chemin complet est ecrit quand le geste n\'est pas sur place',
    /Cave \\u203a Le mill\\u00e9sime \\u203a La ligne de vie/.test(PILO));
  t('la carte propose le geste sur place quand il est possible',
    /Touchez une parcelle pour le poser/.test(PILO));
  t('la fiche MV_INFO previent de l\'homonymie',
    /à ne pas confondre avec l\\u2019onglet du même nom/.test(UTIL));
  t('l\'ecran du millesime nomme l\'annee de son plafond',
    /titre:'Rendement maximum '\+m,/.test(CAVE)
    && /appellation pour ce mill\\u00e9sime/.test(CAVE)
    && /appellation renseign\\u00e9 pour '\+mil/.test(CAVE));
  t('un plafond herite est annonce comme tel a l\'ecran',
    /maxSrc==='herite'/.test(CAVE) && /maxSrc==='herite'/.test(PILO));
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
      s => s.replace("return {max:g,src:'herite'};", "return {max:g,src:'mil'};"),
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
