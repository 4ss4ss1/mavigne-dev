/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — POURQUOI-1 (§336) : « POURQUOI ON LE FAIT », UNE FICHE PAR TÂCHE,
   POSÉE LÀ OÙ LE GESTE A LIEU
   Lancer : node scripts/mv-harnais-pourquoi.mjs         (le contrôle)
            node scripts/mv-harnais-pourquoi.mjs --contre (la contre-épreuve)
   ⚠️ ON EXÉCUTE le catalogue (le bloc borné de src/utils.js), on ne le relit pas.
   ⚠️ Les fiches entrent dans MV_INFO au chargement, hors du littéral que joue
      mv-harnais-info : c'est ici qu'on les tient.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';

const U = fs.readFileSync('src/utils.js', 'utf8');
const A = fs.readFileSync('src/app.js', 'utf8');
const T = fs.readFileSync('src/tracteur.js', 'utf8');
const C = fs.readFileSync('src/cave.js', 'utf8');
const H = fs.readFileSync('index.html', 'utf8');
const S = fs.readFileSync('src/styles.css', 'utf8');
const CONTRE = process.argv.includes('--contre');

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

const DEB = '// ── POURQUOI-1 : début du bloc exécutable', FIN = '// ── POURQUOI-1 : fin du bloc exécutable';
const i = U.indexOf(DEB), j = U.indexOf(FIN);
if (i < 0 || j < i) { console.log('  \x1b[31m✗\x1b[0m bloc POURQUOI-1 introuvable dans src/utils.js'); process.exit(1); }
async function charger(source) {
  const code = source + '\nexport { MV_POURQUOI, MV_SAVIEZ, _mvPqResout };\n';
  return import('data:text/javascript;base64,' + Buffer.from(code, 'utf8').toString('base64'));
}

/* Les vérifications portent sur un catalogue donné : la contre-épreuve leur passe un catalogue cassé. */
function controles(K) {
  const { MV_POURQUOI: P, MV_SAVIEZ: SV, _mvPqResout: R } = K;
  const r = [];
  const cles = Object.keys(P);
  r.push(['le catalogue s’exécute et compte au moins 37 fiches', cles.length >= 37, cles.length + ' fiche(s)']);
  const vides = cles.filter(k => !['n', 'q', 'p', 'v'].every(c => typeof P[k][c] === 'string' && P[k][c].trim()) || !['vigne', 'cave'].includes(P[k].d));
  r.push(['chaque fiche a un titre, un quand, un pourquoi, un « pour le vin » et un domaine', !vides.length, vides.join(', ')]);
  const txt = cles.flatMap(k => [P[k].n, P[k].q, P[k].p, P[k].v]).concat(SV.vigne, SV.cave);
  const sales = txt.filter(x => /[<>&"]/.test(x));
  r.push(['aucun texte ne porte < > & ou " (la bulle rend du HTML)', !sales.length, sales.slice(0, 2).join(' | ')]);
  const longs = txt.filter(x => x.length > 260);
  r.push(['aucun texte de plus de 260 signes (une bulle, pas une page)', !longs.length, longs.slice(0, 1).join('')]);
  const NOM = /^[a-z]{3,5}(\.[a-z0-9]+){1,2}$/;
  const malNommees = cles.filter(k => !NOM.test('pqt.' + k));
  r.push(['chaque clé pqt.<slug> a la forme des fiches « i »', !malNommees.length, malNommees.join(', ')]);
  r.push(['un « Le saviez-tu ? » pour la vigne et pour la cave', SV.vigne.length >= 3 && SV.cave.length >= 3]);
  // La vigne : tout le catalogue de l'app, plus le relevage et le dégraffage
  const a0 = A.indexOf('TACHES_CATALOGUE = ['), a1 = A.indexOf('\n];', a0);
  const taches = [...new Set([...A.slice(a0, a1).matchAll(/nom:'([^']+)'/g)].map(m => m[1]))];
  const sansFiche = taches.concat(['Relevage', 'Dégraffage']).filter(x => !R(x, 'vigne'));
  r.push(['chaque tâche du catalogue (' + taches.length + '), le relevage et le dégraffage ont leur fiche', taches.length >= 15 && !sansFiche.length, sansFiche.join(', ')]);
  // La cave : chaque type de « Nouvelle opération », sauf « autre »
  const types = [...new Set([...H.matchAll(/selCaveOpType\('([a-z_]+)'\)/g)].map(m => m[1]))].filter(x => x !== 'autre');
  const typesSans = types.filter(x => !R(x, 'cave'));
  r.push(['chaque type d’opération du Chai (' + types.length + ') a sa fiche', types.length >= 6 && !typesSans.length, typesSans.join(', ')]);
  // Le tracteur
  const act = ['Tarière', 'Rognage', 'Labour', 'Traitement', 'Engrais', 'Ensemencement'];
  const actSans = act.filter(x => !R(x, 'trac'));
  r.push(['les activités du tracteur ont leur fiche (dont la Tarière, posée d’office)', !actSans.length, actSans.join(', ')]);
  r.push(['« traitement » : la vigne au tracteur, le vin en cave', R('Traitement', 'trac') === 'traitements' && R('traitement', 'cave') === 'collage']);
  r.push(['un libellé inconnu ne pose aucune pastille', R('Apéritif', 'vigne') === null && R('', 'cave') === null && R(null, 'trac') === null]);
  return r;
}

const K = await charger(U.slice(i, j));
if (!CONTRE) {
  console.log('\n── POURQUOI-1 — une fiche par tâche, posée là où le geste a lieu\n');
  for (const [nom, cond, det] of controles(K)) t(nom, cond, det);
  // Les quatre points de pose, et leur câblage
  t('Parcelles : la priorité du moment porte la pastille de sa tâche', /p-focus-bar[\s\S]{0,400}_mvPqBtn\(pTacheFilter,'vigne'\)/.test(A));
  t('Parcelles : sans priorité verrouillée (l’admin), la tâche choisie porte sa pastille', /pTacheFilter===t\.nom&&window\._mvPqBtn\?window\._mvPqBtn\(t\.nom,'vigne'\)/.test(A));
  t('la feuille de validation remplit #vp-pq', /getElementById\('vp-pq'\)[\s\S]{0,120}_mvPqBtn\(nomTache,'vigne'\)/.test(A) && H.includes('id="vp-pq"'));
  t('la fiche d’une session tracteur remplit #sd-pq', /getElementById\('sd-pq'\)[\s\S]{0,120}_mvPqBtn\(s\.activite,'trac'\)/.test(T) && H.includes('id="sd-pq"'));
  t('« Nouvelle opération » de la cave remplit #cop-pq au choix du type', /function selCaveOpType\(type\) \{[\s\S]{0,260}getElementById\('cop-pq'\)[\s\S]{0,120}_mvPqBtn\(type,'cave'\)/.test(C) && H.includes('id="cop-pq"'));
  t('les fiches entrent dans MV_INFO sous pqt.<slug>', /MV_INFO\['pqt\.' \+ s\] = \{/.test(U) && U.indexOf("MV_INFO['pqt.' + s]") > U.indexOf('export const MV_INFO = {'));
  t('la pastille est un vrai bouton, nommé, qui passe par l’écouteur délégué [data-mvi]',
    /class="mv-pq"/.test(U) && /type="button"/.test(U.slice(U.indexOf('export function _mvPqBtn'), U.indexOf('export function _mvPqBtn') + 600)) && /aria-label="Pourquoi on le fait/.test(U));
  t('aucun data-mvi écrit en dur dans le bloc (le contrôle de mv-harnais-info le prendrait pour une fiche)', !/data-mvi="/.test(U.slice(U.indexOf('// POURQUOI ON LE FAIT — lot POURQUOI-1'), U.indexOf('window._mvPqCle = _mvPqCle;'))));
  t('_mvPqBtn et _mvPqCle sont exposés sur window', /window\._mvPqBtn = _mvPqBtn;/.test(U) && /window\._mvPqCle = _mvPqCle;/.test(U));
  const regle = (S.match(/\.mv-pq\{[^}]*\}/) || [''])[0];
  t('le style de la pastille existe, sans couleur en dur', !!regle && !/#[0-9a-fA-F]{3,6}\b/.test(regle));
  t('une zone vide ne prend pas de place', /\.mv-pq-zone:empty\{display:none\}/.test(S));
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
  process.exit(ko ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVE : un catalogue cassé doit rougir, sinon le contrôle ne contrôle rien ══ */
console.log('\n── POURQUOI-1 — contre-épreuve\n');
const casse1 = U.slice(i, j).replace(/\n  ouillage: +\{[^\n]*\n/, '\n');
const casse2 = U.slice(i, j).replace("q: 'Avant le débourrement.'", "q: 'Avant le <b>débourrement</b>.'");
const casse3 = U.slice(i, j).replace("cave: { traitement: 'collage',", "cave: {");
const essais = [
  ['une fiche retirée (ouillage) est vue', casse1, 'chaque type d’opération du Chai'],
  ['du HTML glissé dans un texte est vu', casse2, 'aucun texte ne porte'],
  ['« traitement » sans contexte de cave est vu', casse3, '« traitement » : la vigne au tracteur'],
];
let rates = 0;
for (const [nom, src, cible] of essais) {
  const res = controles(await charger(src));
  const vu = res.some(([n, c]) => n.startsWith(cible) && !c);
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + nom); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + nom + ' — le contrôle ne l’a pas vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`);
process.exit(rates ? 1 : 0);
