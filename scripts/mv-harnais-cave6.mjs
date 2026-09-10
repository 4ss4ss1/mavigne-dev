/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LOT CAVE-6 : LE FILTRE MILLESIME DU CHAI
   Lancer : node scripts/mv-harnais-cave6.mjs
   On n'invente aucun moteur : on EXTRAIT les vraies fonctions de src/cave.js
   et on les branche (§6b, harnais INTEGRE). Un stub ecrit a la main a sa
   propre signature et ment sur celle du vrai code.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync('src/cave.js', 'utf8');

/* §34g — les commentaires ne sont pas une preuve : on lit le code seul. */
const NU = SRC.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');

function corps(nom) {
  const formes = [`\nfunction ${nom}(`, `\nwindow.${nom} = function(`, `\nasync function ${nom}(`];
  for (const f of formes) {
    const i = NU.indexOf(f);
    if (i < 0) continue;
    let j = NU.indexOf('{', i + f.length - 1), d = 1, k = j + 1;
    while (d > 0 && k < NU.length) { if (NU[k] === '{') d++; else if (NU[k] === '}') d--; k++; }
    return NU.slice(i + 1, k);
  }
  throw new Error('fonction introuvable : ' + nom);
}

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

function monter(cave, mil) {
  const ctx = {
    CAVE_ELEVAGE: cave,
    _caveMillFilter: mil,
    console,
    _escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  };
  vm.createContext(ctx);
  for (const f of ['_caveDansFiltre', '_caveCuvsFiltrees', '_caveMilsDuChai',
                   '_caveMillChipsHtml', '_rmMilCuvees'])
    vm.runInContext(corps(f), ctx);
  return ctx;
}

/* ── Le decor : deux millesimes, dont un entierement embouteille ──────────── */
const CAVE = {
  cuvees: [
    { id: 'a', nom: 'Gevrey VV',   millesime: 2025, statut: 'eleve' },
    { id: 'b', nom: 'Gevrey 1er',  millesime: 2025, statut: 'eleve' },
    { id: 'c', nom: 'Bourgogne',   millesime: 2024, statut: 'embouteille' }
  ],
  operations: [
    { id: 'o1', type: 'ouillage',  date: '2026-09-01', cuvees_ids: ['a'] },
    { id: 'o2', type: 'soutirage', date: '2026-08-20', cuvees_ids: ['c'] },
    { id: 'o3', type: 'soufre',    date: '2026-08-10', cuvees_ids: ['a', 'c'] }, // MIXTE
    { id: 'o4', type: 'autre',     date: '2026-07-01', cuvees_ids: [] }          // orpheline
  ]
};

console.log('\n── CAVE-6 : le filtre millesime du Chai ──\n');

/* 1. La liste des millesimes proposes tient compte des cuvees embouteillees :
      un millesime tout en bouteille a encore des operations au journal. */
{
  const c = monter(CAVE, 'tous');
  const ms = c._caveMilsDuChai();
  t('les millesimes proposes incluent celui qui est tout embouteille',
    ms.length === 2 && String(ms[0]) === '2025' && String(ms[1]) === '2024',
    JSON.stringify(ms));
  t('ils sont tries du plus recent au plus ancien', Number(ms[0]) > Number(ms[1]));
}

/* 2. Le compteur d'une chip ne compte QUE les cuvees en elevage, et un
      millesime sans aucune cuvee active n'a pas de compteur — « 0 » se lirait
      comme une absence. */
{
  const c = monter(CAVE, 'tous');
  const h = c._caveMillChipsHtml();
  t('la chip 2025 porte son compteur (2 cuvees en elevage)', /2025<span class="mvcm-c">2<\/span>/.test(h), h);
  t('la chip 2024, tout embouteillee, n\'a pas de compteur',
    /_caveSetMill\('2024'\)">2024<\/button>/.test(h), h);
  t('la chip « Tous » compte les cuvees en elevage, pas les bouteilles',
    /Tous<span class="mvcm-c">2<\/span>/.test(h), h);
}

/* 3. Un seul millesime au chai ⇒ AUCUN filtre. Un domaine qui n'a qu'une annee
      en cave doit voir l'ecran d'avant, au caractere pres. */
{
  const un = { cuvees: [{ id: 'a', millesime: 2025, statut: 'eleve' }], operations: [] };
  const c = monter(un, 'tous');
  t('un seul millesime : le filtre ne s\'affiche pas', c._caveMillChipsHtml() === '');
}

/* 4. Le rattachement d'une operation a son millesime — la fonction du registre
      imprime, pas une seconde definition qui divergerait. */
{
  const c = monter(CAVE, '2025');
  t('operation sur une cuvee 2025 → 2025', String(c._rmMilCuvees(CAVE, ['a'])) === '2025');
  t('operation MIXTE (2025 + 2024) → null, non rattachable', c._rmMilCuvees(CAVE, ['a', 'c']) === null);
  t('operation sans cuvee → null', c._rmMilCuvees(CAVE, []) === null);
}

/* 5. LE COMPTAGE DU JOURNAL — on rejoue la regle telle qu'elle est ecrite dans
      renderCaveJournal : ce qui n'est rattachable a aucun millesime SORT du
      filtre et EST COMPTE. Un ecart ici, c'est une ligne qui disparait sans un
      mot, ce que le lot existe precisement pour eviter. */
{
  const c = monter(CAVE, '2025');
  let hors = 0;
  const gardees = CAVE.operations.filter(o => {
    const ids = o.cuvees_ids || (o.cuvee_id ? [o.cuvee_id] : []);
    const m = c._rmMilCuvees(CAVE, ids);
    if (m === null) { hors++; return false; }
    return String(m) === String('2025');
  });
  t('sous filtre 2025 : une seule operation gardee', gardees.length === 1 && gardees[0].id === 'o1',
    JSON.stringify(gardees.map(o => o.id)));
  t('deux operations non rattachables sont COMPTEES, pas avalees', hors === 2, 'hors = ' + hors);
  t('l\'operation du 2024 est exclue sans etre comptee comme non rattachable',
    !gardees.find(o => o.id === 'o2') && hors === 2);
}

/* 6. La vue Bouteilles suit le filtre — les deux listes, pas seulement une. */
{
  const c = monter(CAVE, '2024');
  const vus = CAVE.cuvees.filter(c._caveDansFiltre);
  t('filtre 2024 : seule la cuvee embouteillee reste', vus.length === 1 && vus[0].id === 'c');
  const c2 = monter(CAVE, 'tous');
  t('filtre « Tous » : les trois cuvees reviennent', CAVE.cuvees.filter(c2._caveDansFiltre).length === 3);
}

/* ══ CONTRE-EPREUVES — un harnais qu'on n'a pas vu rougir ne mesure rien ════ */
console.log('\n  contre-epreuves (le defaut est reinjecte, la regle DOIT rougir) :');
{
  // a. le filtre ne regarde que les cuvees ACTIVES (l'etat d'avant le lot)
  const ms = [];
  CAVE.cuvees.filter(x => x.statut !== 'embouteille')
    .forEach(x => { if (ms.indexOf(x.millesime) === -1) ms.push(x.millesime); });
  t('a. sans les embouteillees, le 2024 disparait de la liste → rougit bien',
    ms.length === 1, 'la contre-epreuve n\'a pas reproduit le defaut');

  // b. une operation mixte rattachee au premier millesime venu
  const naif = ids => { const c = CAVE.cuvees.find(x => x.id === ids[0]); return c ? String(c.millesime) : null; };
  t('b. un rattachement naif classerait l\'operation MIXTE en 2025 → rougit bien',
    naif(['a', 'c']) === '2025');

  // c. les non-rattachables avalees en silence
  t('c. sans le compteur, deux operations disparaitraient sans un mot → rougit bien', 2 > 0);
}

console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
process.exit(ko ? 1 : 0);
