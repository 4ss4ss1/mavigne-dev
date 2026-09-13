/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — AXE-1 : LE CADRE DE LA CAMPAGNE, ET LES FENETRES DES DOCUMENTS
   Lancer : node scripts/mv-harnais-axe.mjs   ·   contre-epreuves : --contre

   ⚠️ ON EXECUTE LES FONCTIONS, ON NE LES RELIT PAS (§34g). Une relecture ne voit
      ni un repli fige, ni une borne fausse un 31 fevrier.
   ⚠️ Les assertions de VOCABULAIRE lisent le code sans ses commentaires : un
      harnais qui lit ce qu'on RACONTE au sujet du code ne teste pas le code.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';

const contre = process.argv.includes('--contre');
const R = f => fs.readFileSync(f, 'utf8');
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')
                                        && !l.trimStart().startsWith('*')
                                        && !l.trimStart().startsWith('/*')).join('\n');
/* ★★ LA CONTRE-EPREUVE REINTRODUIT LES DEFAUTS, EN MEMOIRE, JAMAIS SUR DISQUE.
   ⚠️ Vecu (§25.2) : une contre-epreuve a laisse les fichiers abimes parce que
   l'assert tombait AVANT la restauration. Ici rien n'est ecrit : on abime des
   CHAINES. Et on n'inverse pas les assertions en bloc — inverser, c'est verdir
   sur celles qui restent vraies, donc ne rien prouver. On compte combien
   rougissent, et on exige qu'aucun defaut ne passe. */
const DEFAUTS = [
  ['l\u2019axe redevient fige a aout', s => s.replace(/var md=_mvCampagneMois\(\)\+1;/, 'var md=8;')],
  ['_bcBornes reecrit ses bornes en dur', s => s.replace(/if\(typeof window!=='undefined' && typeof window\._mvCampagneBornes==='function'\)\{[\s\S]*?\n  \}\n  return \{d0:c \+ '-08-01'/, "return {d0:c + '-08-01'")],
  ['un repli retombe a 8', s => s.replace(/_mvCampMoisRepli\(\)/g, '7')],
  ['le PDF phyto reprend tout l\u2019historique', s => s.replace(/if\(!_borne\) return true;[\s\S]{0,200}?return \(j>=_b0 && j<=_b1\);/, 'return true;')],
  ['le panneau ne sert plus que le CSV', s => s.replace(/function _phytoExportChoix\(cible\)/, 'function _phytoExportChoix()')],
  ['la periode redevient une « campagne »', s => s.replace(/lbl:'P.{0,8}riode de travail[^,]*,/, "lbl:'Campagne consult\\u00e9e',")],
  ['le mois est reecrit en dur dans l\u2019ecran', s => s.replace(/moisIdeal:\(ann\.align/, 'moisIdeal:9||(ann.align')]
];
/* ⚠️⚠️ GARDE DE LA CONTRE-EPREUVE : un defaut qui ne s'INJECTE pas ressemble
   trait pour trait a un harnais aveugle. On compte les injections qui ont
   REELLEMENT modifie le texte, et une injection morte est une erreur de
   montage, pas une preuve. (Symetrique du §25 : « une assertion verte peut
   etre une panne de lecture ».) */
const applique = new Set();
function abime(txt) {
  if (!contre) return txt;
  return DEFAUTS.reduce((a, [nom, f]) => { const b = f(a); if (b !== a) applique.add(nom); return b; }, txt);
}

const U = abime(R('src/utils.js')), CAVE = nu(abime(R('src/cave.js'))), PIL = nu(abime(R('src/pilotage.js')));
const REG = nu(abime(R('src/reglages.js'))), PHY = nu(abime(R('src/phyto.js')));

let ok = 0, ko = 0;
const t = (nom, cond, det) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); }
};
console.log('\n── AXE-1 — le cadre de la campagne' + (contre ? '  (CONTRE-EPREUVES : tout doit rougir)' : '') + '\n');

/* ══ 1. LE MOTEUR, EXECUTE ══════════════════════════════════════════════ */
function moteur(defaut) {
  let src = '';
  const bloc = (deb, fin) => {
    const i = U.indexOf(deb); if (i < 0) throw new Error('bloc absent : ' + deb);
    const j = U.indexOf(fin, i); if (j < 0) throw new Error('fin absente : ' + fin);
    src += U.slice(i, j + fin.length) + '\n';
  };
  bloc('var MV_EX_MOIS_DEF', 'window._mvExerciceList    = _mvExerciceList;');
  bloc('var MV_CAMP_MOIS_DEF', 'window._mvFenFr           = _mvFenFr;');
  if (defaut != null) src = src.replace(/var MV_CAMP_MOIS_DEF = \d+;/, 'var MV_CAMP_MOIS_DEF = ' + defaut + ';');
  /* Le bloc expose des voisins qu'on n'extrait pas (_mvEstChantier, _mvProj...).
     On retire ces lignes d'exposition : le harnais teste l'axe, pas le montage. */
  src = src.replace(/^window\.(_mvEstChantier|_mvJoursOuvrables|_mvAujIso|_mvJoursRestants|_mvFenetre|_mvProj)\b.*$/gm, '')
           .replace(/^window\./gm, 'G.').replace(/window\./g, 'G.');
  const G = { CONFIG: { eco: {} } };
  return { G, api: new Function('G', src + '\nreturn {_mvCampagneDe,_mvCampagneBornes,_mvCampagneMois,_mvFenetresAnnee};')(G) };
}
const { G, api } = moteur(null);

t('le defaut reste le 1er aout — aucun domaine ne bouge sans le demander',
  api._mvCampagneMois() === 7, 'mois par defaut = ' + api._mvCampagneMois());

/* ★ NON-REGRESSION : au defaut, l'axe est EXACTEMENT l'ancien (mo>=8). Mesure
   sur 360 dates de 2020 a 2030, comme la preuve d'origine de l'axe campagne. */
const ancien = iso => { const p = iso.split('-'); return (+p[1] >= 8) ? +p[0] : +p[0] - 1; };
let ecarts = 0, n = 0;
for (let a = 2020; a <= 2030; a++) for (let m = 1; m <= 12; m++) for (const j of ['01', '15', '28']) {
  const iso = a + '-' + String(m).padStart(2, '0') + '-' + j;
  n++; if (api._mvCampagneDe(iso) !== ancien(iso)) ecarts++;
}
t('non-regression : zero ecart avec l\u2019ancien axe sur ' + n + ' dates (2020-2030)',
  ecarts === 0, ecarts + ' ecart(s)');

/* Le reglage, lui, doit MORDRE. Septembre appartient a la campagne precedente
   quand on ouvre en octobre : c'est la vendange qui CLOT le cycle. */
G.CONFIG = { eco: { campagne_mois: 9 } };
t('ouverture en octobre : le 15/09/2026 appartient a la campagne 2025',
  api._mvCampagneDe('2026-09-15') === 2025, 'rend ' + api._mvCampagneDe('2026-09-15'));
t('ouverture en octobre : le 01/10/2026 ouvre la campagne 2026',
  api._mvCampagneDe('2026-10-01') === 2026);
const b = api._mvCampagneBornes(2025);
t('bornes 2025 = 01/10/2025 \u2192 30/09/2026',
  b.d0 === '2025-10-01' && b.d1 === '2026-09-30', b.d0 + ' \u2192 ' + b.d1);

/* ⚠️ Les fins de mois ne se devinent pas : une campagne ouverte en mars finit un
   29 fevrier une annee sur quatre. C'est le genre de borne qu'aucune relecture
   n'attrape. */
G.CONFIG = { eco: { campagne_mois: 2 } };
t('bissextile : campagne 2023 finit le 29/02/2024',
  api._mvCampagneBornes(2023).d1 === '2024-02-29', api._mvCampagneBornes(2023).d1);
t('non bissextile : campagne 2024 finit le 28/02/2025',
  api._mvCampagneBornes(2024).d1 === '2025-02-28', api._mvCampagneBornes(2024).d1);
G.CONFIG = { eco: { campagne_mois: 0 } };
const c0 = api._mvCampagneBornes(2025);
t('campagne civile : 01/01 \u2192 31/12 de la MEME annee',
  c0.d0 === '2025-01-01' && c0.d1 === '2025-12-31' && c0.civil === true);

/* ══ 2. LES FENETRES : CHACUNE PORTE SON NOM ════════════════════════════ */
G.CONFIG = { eco: { campagne_mois: 9, exercice_mois: 9 } };
G._visuSaison = () => 'Printemps 2026';
G._saisonObj = () => ({ debut: '2026-03-08', fin: '2026-07-31' });
const F = api._mvFenetresAnnee({ campagnes: 2, exercices: 1 });
const per = F.find(f => f.axe === 'periode');
t('une periode de travail n\u2019est JAMAIS nommee « campagne »',
  !!per && !/campagne/i.test(per.lbl), per ? per.lbl : 'aucune periode');
t('la campagne et l\u2019exercice sont proposes, nommes, et distincts',
  F.some(f => f.axe === 'campagne') && F.some(f => f.axe === 'exercice')
  && F.filter(f => f.axe === 'exercice').every(f => /exercice comptable/i.test(f.lbl)));
t('deux cadres aux memes dates : la liste le DIT au lieu de masquer une ligne',
  F.some(f => f.axe === 'exercice' && /m\u00eames dates que la campagne/.test(f.sub || '')));
t('la derniere fenetre est « tout », sans bornes (le filtre reste facultatif)',
  F[F.length - 1].axe === 'tout' && !F[F.length - 1].d0 && !F[F.length - 1].d1);

/* ══ 3. PLUS UNE SEULE BORNE EN DUR ═════════════════════════════════════ */
/* \u26a0\ufe0f Cette assertion COMPTAIT les bornes en dur, et tolerait le repli \u2014 donc
   supprimer l'appel a la source unique la laissait verte (trouve par la
   contre-epreuve). On verifie que _bcBornes INTERROGE _mvCampagneBornes AVANT
   de retomber sur sa valeur de repli. */
t('cave.js : _bcBornes lit la source unique avant tout repli',
  /function _bcBornes\(c\)\{[\s\S]{0,320}_mvCampagneBornes\(c\)[\s\S]{0,420}return \{d0:c \+ '-08-01'/.test(CAVE));
t('cave.js : les bornes en dur ne survivent que comme repli (\u2264 2 sites)',
  (CAVE.match(/'-0?8-01'|'-0?7-31'/g) || []).length <= 2,
  (CAVE.match(/'-0?8-01'|'-0?7-31'/g) || []).join(' '));
t('pilotage.js : les bornes passent par _arcBornes, plus par une chaine',
  !/_arcN\(an\s*\+\s*'-08-01'\)/.test(PIL) && !/_arcN\(\(an\+1\)\s*\+\s*'-07-31'\)/.test(PIL));
t('les cinq replis lisent le reglage, aucun ne reste fige a 8',
  /_mvCampMoisRepli\(\)/.test(CAVE) && /_arcCampMois\(\)/.test(PIL)
  && (CAVE.match(/>=\s*8\s*\)\s*\?/g) || []).length === 0,
  'replis figes restants : ' + (CAVE.match(/>=\s*8\s*\)\s*\?/g) || []).length);

/* ══ 4. LE REGISTRE PHYTO PDF EST BORNE ═════════════════════════════════ */
t('exportPDFPhyto prend une fenetre en argument',
  /function exportPDFPhyto\(mode\)/.test(REG));
t('sans cle, il POSE LA QUESTION — il ne sort pas tout en silence',
  /_phytoExportChoix\('pdf'\)/.test(REG));
t('les traitements sont filtres sur la fenetre',
  /_borne[\s\S]{0,220}j>=_b0 && j<=_b1/.test(REG));
t('l\u2019attestation ne certifie plus « la campagne <nom de periode> »',
  !/registre phytosanitaire pour la campagne \$\{annee\}/.test(REG));
t('les traitements sans date sont ecartes ET comptes',
  /_sansDate\+\+/.test(REG) && /_sansDate\?/.test(REG));
t('le panneau de choix sert les DEUX documents',
  /function _phytoExportChoix\(cible\)/.test(PHY) && /pdf \? \("exportPDFPhyto/.test(PHY));

/* ══ 5. LE JOURNAL DES INTERVENTIONS ════════════════════════════════════ */
t('le document existe et est expose',
  /window\.exportJournalInterventions = function/.test(REG));
t('il est branche dans le catalogue et dans docsGo',
  /act:'journal'/.test(REG) && /case 'journal':/.test(REG));
t('trois sources distinctes, JAMAIS sommees en un total unique',
  /trav:trav, sess:sess, trt:trt/.test(REG)
  && !/trav\.length\s*\+\s*sess\.length\s*\+\s*trt\.length[^)]*compteur/i.test(REG));
t('il ne compte que les travaux VALIDES, et jamais la meteo',
  /j\.statut!=='Valid\\u00e9'/.test(REG) && /j\.meteo/.test(REG));
t('la surface cumulee annonce qu\u2019elle additionne les passages',
  /passages compris/.test(REG));

/* ══ 6. LE REGLAGE SE RAISONNE SUR LA VENDANGE, PAS SUR UN MOIS ═════════ */
t('_pilCampVend cadre la vendange sur la campagne CANDIDATE',
  /function _pilCampVend\(md\)/.test(PIL) && /ann\.vend/.test(PIL));
t('l\u2019ecran dit si la vendange ouvre, clot, ou est coupee par la borne',
  /coupe:coupe/.test(PIL) && /clot:\(!coupe/.test(PIL) && /ouvre:\(!coupe/.test(PIL));
/* \u26a0\ufe0f `/moisIdeal/` restait vrai avec un litteral pose devant (contre-epreuve).
   On verifie que la valeur vient de ann.align, et QUE RIEN ne la court-circuite. */
t('le mois propose est DEDUIT de la vendange du domaine, pas ecrit en dur',
  /moisIdeal:\(ann\.align&&ann\.align\.moisIdeal!=null\)\?ann\.align\.moisIdeal:null/.test(PIL.replace(/\s+/g, ''))
  || /moisIdeal:\s*\(ann\.align\s*&&\s*ann\.align\.moisIdeal\s*!=\s*null\)\s*\?\s*ann\.align\.moisIdeal\s*:\s*null/.test(PIL));
t('aucun mois n\u2019est prescrit en dur dans l\u2019ecran de reglage',
  !/1<sup>er<\/sup> octobre/.test(PIL) && !/moisIdeal:\s*\d/.test(PIL));
t('le reglage de campagne et celui de l\u2019exercice sont rendus cote a cote',
  /_pexMoisChoix\(\)[\s\S]{0,160}_pilCampMoisChoix\(\)/.test(PIL));
t('campagne_mois passe la liste blanche de _ecoCfgSet',
  /'exercice_mois','campagne_mois'/.test(REG));

if (contre) {
  const morts = DEFAUTS.map(d => d[0]).filter(n => !applique.has(n));
  console.log('\n  ' + (morts.length ? '\x1b[31m✗' : '\x1b[32m✓') + '\x1b[0m '
    + applique.size + '/' + DEFAUTS.length + ' defaut(s) reellement injectes'
    + (morts.length ? '\n      → injection morte : ' + morts.join(' · ') : ''));
  const vu = ko >= applique.size && morts.length === 0;
  console.log('  ' + (vu ? '\x1b[32m✓' : '\x1b[31m✗') + '\x1b[0m ' + ko
    + ' assertion(s) rougissent — au moins une par defaut injecte');
  if (!vu && !morts.length) console.log('    \x1b[31mUn defaut qui passe le harnais est un harnais qui ne protege de rien.\x1b[0m');
  console.log('');
  process.exit(vu ? 0 : 1);
}
console.log('\n  ' + (ko === 0 ? '\x1b[32m' : '\x1b[31m') + ok + ' vert' + (ok > 1 ? 's' : '')
  + ' · ' + ko + ' rouge' + (ko > 1 ? 's' : '') + '\x1b[0m\n');
process.exit(ko === 0 ? 0 : 1);
