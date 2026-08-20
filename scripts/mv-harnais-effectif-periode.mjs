// mv-harnais-effectif-periode.mjs — lot EFFECTIF-PERIODE (planning.js)
//
// NE PAS relire ce fichier pour se rassurer : le lancer.
//   node scripts/mv-harnais-effectif-periode.mjs
//
// POURQUOI IL EXISTE.
// Sept ecrans du Planning partaient de `_planMbrs()`, qui filtre `statut !==
// 'Inactif'`. Or ce statut se pose A LA MAIN a la fin d'un contrat — le Pilotage
// le conseille meme en toutes lettres — et il effacait donc RETROACTIVEMENT des
// heures qui ont ete faites. Mesure du 19/08/2026 sur un domaine reel : sept
// fiches rangees en fin de saison, et janvier->juillet du recap annuel retombe
// a la barre plancher. Aucun controle automatique ne voyait quoi que ce soit :
// le code faisait exactement ce qui etait ecrit.
//
// Methode C20 : on extrait les VRAIES fonctions du fichier livre, on leur donne
// des stubs minimaux, et on les EXECUTE. Aucune reecriture du code teste.
//
// ⚠️ Les contre-epreuves sont FONCTIONNELLES, pas textuelles. Une contre-epreuve
//    qui cherche un motif de texte se laisse satisfaire par la meme phrase ecrite
//    ailleurs dans le fichier (§42f, §53d).
// ⚠️ Une mutation qui casse la syntaxe ne prouve RIEN : chaque mutant passe donc
//    par `node --check` avant qu'on regarde sa couleur.
// ⚠️ Un harnais qui plante compte pour ROUGE.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// ⚠️ AUCUN chemin de bac a sable en dur (§44), et AUCUNE URL convertie a la main :
//    sous Windows `new URL(...).pathname` rend « /C:/Users/... », que Node repart
//    en « C:\C:\Users\... » — le harnais KML a plante chez Nico pour cette raison
//    exacte alors qu'il passait vert en bac a sable Linux (§53e). `fileURLToPath`
//    est la convention deja suivie par preflight.mjs.
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE   = process.argv[2] || path.join(RACINE, 'src', 'planning.js');
const src    = fs.readFileSync(FILE, 'utf8');

// ── Extraction par balance d'accolades ───────────────────────────────────────
// ⚠️ Le debut inclut « async » s'il est la : le couper produirait un `await`
//    hors fonction asynchrone, et le harnais planterait au lieu de tester.
function bloc(s, motif, nom) {
  const m = motif.exec(s);
  if (!m) throw new Error('absent du fichier : ' + nom);
  const start = m.index + (s[m.index] === '\n' ? 1 : 0);
  let d = 0, j = s.indexOf('{', m.index + m[0].length - 1);
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  if (d !== 0) throw new Error('accolades non fermees : ' + nom);
  return s.slice(start, j + 1);
}
const fn  = (s, n) => bloc(s, new RegExp('(?:^|\\n)(?:async\\s+)?function\\s+' + n + '\\s*\\(', 'm'), n);
const obj = (s, n) => bloc(s, new RegExp('(?:^|\\n)var\\s+' + n + '\\s*=\\s*\\{', 'm'), n) + ';';
function ligne(s, motif, nom) {
  const m = motif.exec(s);
  if (!m) throw new Error('absent du fichier : ' + nom);
  return m[0];
}

// Les fonctions reelles du cone, dans l'ordre ou elles se lisent.
const NOMS = [
  '_pY', '_pEntYear', '_pEntMonth', '_pEntDay', '_pTplStore',
  '_planDuesDebut', '_planDuesActive', '_planAbsDef', '_planAbsMotif', '_planAbsH',
  '_planDays', '_planGetTpl', '_planGetRefH', '_planFmt',
  '_planInContract', '_planJourCouvert', '_planDansCtr',
  '_planInContractRead', '_planInContractCtr', '_planWide',
  '_planMbrs', '_planEntAn', '_planCouvre', '_planMbrsPer', '_planMbrsMois', '_planMbrsAn',
  '_planPlId', '_planPlanned', '_planTimingH', '_planDefTiming', '_planDayH', '_planEffective',
  '_planCalcMonth', '_planAbsLostH', '_planAbsNeutH', '_planRempH', '_planSummary',
  '_pl2Actifs', '_pl2HorsContrat', '_pl2Annual', '_pl2Annual_', '_planGensArchives', '_paGroupes'
];

// ── Bac a sable ──────────────────────────────────────────────────────────────
function makeEnv(opts) {
  opts = opts || {};
  const s   = opts.source || src;
  const win = {
    MEMBRES: opts.membres || [],
    _mvEstCollectif: m => !!(m && m.collectif),
    // Historique des contrats : `__per` quand la fiche en porte plusieurs,
    // sinon le couple debut/fin — exactement ce que rend _mvContrats.
    _mvContrats(m) {
      if (!m) return [];
      if (Array.isArray(m.__per)) return m.__per;
      return (m.debut_contrat || m.fin_contrat)
        ? [{ debut: m.debut_contrat || '', fin: m.fin_contrat || '' }] : [];
    }
  };
  const code = [
    obj(s, 'PLAN_DEF'), obj(s, 'PLAN_DEF_T'),
    ligne(s, /^var PLAN_MOIS=.*$/m, 'PLAN_MOIS'),
    ligne(s, /^var PLAN_MOIS_C=.*$/m, 'PLAN_MOIS_C'),
    ligne(s, /^var PLAN_BG=.*$/m, 'PLAN_BG'),
    'var PLAN_PAUSE_MIN=60;',
    'var PLANNING_TEMPLATES=' + JSON.stringify(opts.templates || {}) + ';',
    'var PLANNING_ENTRIES=' + JSON.stringify(opts.entrees || {}) + ';',
    'var planYear=' + (opts.an != null ? opts.an : 2026) + ';',
    'var planMonth=' + (opts.mois != null ? opts.mois : 7) + ';',
    'var _planCtxYear=null,_planWideCtx=false,_planCtrCtx=null;',
    'function _escHtml(x){return String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}',
    'function _escAttr(x){return _escHtml(x).replace(/"/g,"&quot;");}',
    ...NOMS.map(n => fn(s, n))
  ].join('\n');
  const api = new Function('window', code +
    '\n; return { _planCouvre, _planMbrsMois, _planMbrsAn, _pl2Actifs, _pl2HorsContrat,' +
    ' _pl2Annual, _planGensArchives, _paGroupes, _planCalcMonth, _planSummary,' +
    ' mois(m){ planMonth=m; } };')(win);
  return api;
}

// ── Jeux d'essai — la capture du 19/08 ───────────────────────────────────────
// Deux permanents entres en aout, sept saisonniers sortis le 17 juillet, une
// equipe collective de vendangeurs. Aucune saisie : heures faites = heures du
// modele, donc chaque mois sous contrat vaut 100 % du prevu.
const ANCIENS = ['Dessi', 'Matheo', 'Ancien3', 'Ancien4', 'Ancien5', 'Ancien6', 'Ancien7'];
function membres(anciensActifs) {
  const M = [
    { nom: 'Vic',     statut: 'Actif', planning_id: 'standard', debut_contrat: '2026-08-01' },
    { nom: 'Pauline', statut: 'Actif', planning_id: 'standard', debut_contrat: '2026-08-01' }
  ];
  ANCIENS.forEach(n => M.push({
    nom: n, statut: anciensActifs ? 'Actif' : 'Inactif', planning_id: 'standard',
    debut_contrat: '2026-01-05', fin_contrat: '2026-07-17'
  }));
  M.push({ nom: 'Vendangeurs', statut: 'Actif', planning_id: 'standard', collectif: true, effectif: 40 });
  return M;
}
const noms    = a => (a || []).map(x => x.nom);
const hauteur = h => (h.match(/height:([0-9.]+)px/g) || []).map(x => parseFloat(x.slice(7)));
const legende = h => {
  const m = h.match(/Sur 2026\u00a0: ([^ ]+) faites sur ([^ ]+) pr\u00e9vues(, (\d+) anciens?)?/);
  return m ? { faites: m[1], prevues: m[2], anciens: m[4] ? +m[4] : 0 } : null;
};

// ── Compteur ─────────────────────────────────────────────────────────────────
let ok = 0, ko = 0;
const T = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \u2705 ' + nom); }
  else { ko++; console.log('  \u274C ' + nom + (detail ? '  \u2014 ' + detail : '')); }
};

console.log('\n=== HARNAIS EFFECTIF-PERIODE \u2014 ' + FILE + ' ===\n');

console.log('A. La primitive _planCouvre');
{
  const api = makeEnv({});
  const AN = ['2026-01-01', '2026-12-31'];
  const cdd = (st) => ({ nom: 'x', statut: st, debut_contrat: '2026-01-05', fin_contrat: '2026-07-17' });
  T('A1 fiche ACTIVE dont le contrat recoupe la periode', api._planCouvre(cdd('Actif'), ...AN) === true);
  T('A2 fiche INACTIVE dont le contrat recoupe la periode \u2014 LE COEUR DU LOT',
    api._planCouvre(cdd('Inactif'), ...AN) === true);
  T('A3 fiche INACTIVE hors periode', api._planCouvre(cdd('Inactif'), '2025-01-01', '2025-12-31') === false);
  T('A4 fiche ACTIVE sans aucune date (CDI sans date = present)',
    api._planCouvre({ nom: 'y', statut: 'Actif' }, ...AN) === true);
  T('A5 fiche INACTIVE sans date NI heures : ecartee',
    api._planCouvre({ nom: 'z', statut: 'Inactif' }, ...AN) === false);
}
{
  const api = makeEnv({ entrees: { z: { 2026: { 4: { 4: { modifier: 0 } } } } } });
  T('A6 fiche INACTIVE sans date MAIS avec des heures sur l\'annee : comptee',
    api._planCouvre({ nom: 'z', statut: 'Inactif' }, '2026-01-01', '2026-12-31') === true);
}
{
  const api = makeEnv({});
  const deux = { nom: 'r', statut: 'Actif', __per: [{ debut: '2026-03-01', fin: '2026-05-31' }, { debut: '2026-09-01', fin: '' }] };
  T('A7 un contrat ARCHIVE compte (avril)', api._planCouvre(deux, '2026-04-01', '2026-04-30') === true);
  T('A8 le trou entre deux contrats ne compte pas (juillet)', api._planCouvre(deux, '2026-07-01', '2026-07-31') === false);
}

console.log('\nB. La grille suit le MOIS affiche, pas le statut');
{
  const juin = noms(makeEnv({ membres: membres(false), mois: 5 })._pl2Actifs());
  const aout = noms(makeEnv({ membres: membres(false), mois: 7 })._pl2Actifs());
  T('B1 juin : les sept anciens sont la', ANCIENS.every(n => juin.includes(n)), juin.join(','));
  T('B2 juin : Vic et Pauline (contrat en aout) n\'y sont pas',
    !juin.includes('Vic') && !juin.includes('Pauline'), juin.join(','));
  T('B3 aout : les sept anciens n\'y sont pas', ANCIENS.every(n => !aout.includes(n)), aout.join(','));
  T('B4 aout : Vic et Pauline y sont', aout.includes('Vic') && aout.includes('Pauline'));
}

console.log('\nC. Aucun nom affiche deux fois sur le meme ecran');
for (const mo of [5, 7]) {
  const api = makeEnv({ membres: membres(false), mois: mo });
  const act = noms(api._pl2Actifs());
  const arc = api._planGensArchives() || '';
  const hc  = api._pl2HorsContrat()   || '';
  T('C' + mo + 'a mois ' + mo + ' : zero nom a la fois dans la liste et dans « anciens salaries »',
    act.filter(n => arc.includes('>' + n + '<')).length === 0);
  T('C' + mo + 'b mois ' + mo + ' : zero nom a la fois dans la grille et dans « hors contrat »',
    act.filter(n => hc.includes(n)).length === 0);
}
{
  const api = makeEnv({ membres: membres(false), mois: 5 });
  T('C3 juin : la section « anciens salaries » disparait, ils sont tous dans la liste',
    (api._planGensArchives() || '') === '');
  const api2 = makeEnv({ membres: membres(false), mois: 7 });
  T('C4 aout : les sept anciens sont bien dans la section', /Anciens salari\u00e9s \u2014 7/.test(api2._planGensArchives() || ''));
}

console.log('\nD. Le recap annuel');
{
  const avant = hauteur(makeEnv({ membres: membres(true),  mois: 7 })._pl2Annual());
  const apres = hauteur(makeEnv({ membres: membres(false), mois: 7 })._pl2Annual());
  T('D1 desactiver les sept fiches ne change AUCUNE des douze barres',
    JSON.stringify(avant) === JSON.stringify(apres),
    avant.join(' ') + '  |  ' + apres.join(' '));
  T('D2 janvier->juillet est au-dessus de la barre plancher (4 px)',
    apres.slice(0, 7).every(x => x > 4), apres.slice(0, 7).join(' '));
  T('D3 aout->decembre reste plein : un mois hors contrat pese 0/0, pas 0/reference',
    apres.slice(7).every(x => x === 38), apres.slice(7).join(' '));
}
{
  const h = makeEnv({ membres: membres(false), mois: 7 })._pl2Annual();
  const L = legende(h);
  T('D4 la legende dit ce que mesure la hauteur', /Hauteur\u00a0: part du pr\u00e9vu r\u00e9alis\u00e9e/.test(h));
  T('D5 la legende compte les sept anciens', !!L && L.anciens === 7, JSON.stringify(L));
  T('D6 sans aucune saisie, faites === prevues', !!L && L.faites === L.prevues, JSON.stringify(L));
  T('D7 douze aria-label, un par mois', (h.match(/aria-label="/g) || []).length === 12);
  T('D8 l\'equipe collective reste hors du recap', !/Vendangeurs/.test(h));
}
{
  // Les heures d'un ANCIEN pesent dans SON mois, et nulle part ailleurs.
  const sans = hauteur(makeEnv({ membres: membres(false), mois: 7 })._pl2Annual());
  const avec = hauteur(makeEnv({ membres: membres(false), mois: 7, entrees: { Dessi: { 2026: { 4: { 4: { modifier: -3 } } } } } })._pl2Annual());
  T('D9 -3 h le 4 mai chez un ancien : mai baisse', avec[4] < sans[4], sans[4] + ' -> ' + avec[4]);
  T('D10 et les onze autres mois ne bougent pas',
    avec.filter((v, i) => i !== 4 && v !== sans[i]).length === 0);
}

console.log('\nE. Le planning de l\'annee imprime');
{
  const g = y => (makeEnv({ membres: membres(false), mois: 7 })._paGroupes(y) || []).reduce((a, x) => a.concat(x.noms), []);
  const g26 = g(2026), g25 = g(2025);
  T('E1 2026 : les sept anciens figurent sur le document', ANCIENS.every(n => g26.includes(n)), g26.join(','));
  T('E2 2025 : aucun d\'eux (leurs contrats ne couvrent pas 2025)',
    ANCIENS.every(n => !g25.includes(n)), g25.join(','));
}

// ── Contre-epreuves : on remet le defaut, le harnais doit ROUGIR ─────────────
console.log('\nF. Contre-epreuves fonctionnelles');
const contres = [];
const contre = (nom, mutation, verif) => contres.push({ nom, mutation, verif });

function runContres() {
  for (const c of contres) {
    let mute;
    try { mute = c.mutation(src); } catch (e) { ko++; console.log('  \u274C ' + c.nom + ' \u2014 mutation impossible'); continue; }
    if (mute === src) { ko++; console.log('  \u274C ' + c.nom + ' \u2014 motif introuvable, contre-epreuve IMPOSSIBLE'); continue; }
    // ⚠️ une mutation qui casse la syntaxe ferait rougir pour la mauvaise raison.
    try { execFileSync('node', ['--check', '--input-type=module'], { input: mute, stdio: 'pipe' }); }
    catch (e) { ko++; console.log('  \u274C ' + c.nom + ' \u2014 mutation invalide (syntaxe cassee)'); continue; }
    let vert;
    try { vert = !!c.verif(mute); } catch (e) { vert = false; }
    if (!vert) { ok++; console.log('  \u2705 ' + c.nom + ' \u2014 rougit bien'); }
    else { ko++; console.log('  \u274C ' + c.nom + ' \u2014 LE DEFAUT PASSE'); }
  }
}

// F1 — le defaut d'origine : le statut refiltre dans la primitive.
// ⚠️ PREMIERE VERSION FAUSSE, gardee en memoire : elle mutait
//    `if(mbr.statut!=='Inactif')return true;` — une ligne qui vit DANS la branche
//    « fiche sans aucune date ». Les sept anciens ont des dates, ils ne
//    l'atteignent jamais : le mutant restait vert et la contre-epreuve ne
//    prouvait rien. C'est la faute de §53d, troisieme recidive. La mutation doit
//    porter sur la PORTE D'ENTREE, la ou l'ancien filtre vivait.
contre('F1 le statut refiltre dans _planCouvre',
  s => s.replace('function _planCouvre(mbr,d0,d1){\n  if(!mbr)return false;',
                 "function _planCouvre(mbr,d0,d1){\n  if(!mbr||mbr.statut==='Inactif')return false;"),
  m => ANCIENS.every(n => noms(makeEnv({ source: m, membres: membres(false), mois: 5 })._pl2Actifs()).includes(n)));

// F2 — la grille repart de « qui est la aujourd'hui »
contre('F2 _pl2Actifs repart de _planMbrs',
  s => s.replace('function _pl2Actifs(){return _planMbrsMois(planMonth);}',
                 'function _pl2Actifs(){return _planMbrs();}'),
  m => noms(makeEnv({ source: m, membres: membres(false), mois: 5 })._pl2Actifs()).includes('Dessi'));

// F3 — la reference du recap revient au modele NU, non borne aux contrats
contre('F3 reference du recap non bornee aux contrats',
  s => s.replace('mbrs.forEach(function(m){var s=_planSummary(m,mi)||{};mw+=(s.worked||0);mr+=(s.ref||0);});',
                 'mbrs.forEach(function(m){mw+=_planCalcMonth(m,mi);mr+=_planGetRefH(_planPlId(m),mi);});'),
  m => hauteur(makeEnv({ source: m, membres: membres(false), mois: 7 })._pl2Annual()).slice(7).every(x => x === 38));

// F4 — le recap repart de _planMbrs
contre('F4 le recap annuel repart de _planMbrs',
  s => s.replace('var mbrs=_planMbrsAn(planYear).filter(', 'var mbrs=_planMbrs().filter('),
  m => {
    const a = hauteur(makeEnv({ source: m, membres: membres(true),  mois: 7 })._pl2Annual());
    const b = hauteur(makeEnv({ source: m, membres: membres(false), mois: 7 })._pl2Annual());
    return JSON.stringify(a) === JSON.stringify(b);
  });

// F5 — les archives ne dedoublonnent plus : un nom sur deux listes du meme ecran
contre('F5 les archives ne dedoublonnent plus',
  s => s.replace("return m.statut==='Inactif'&&_duMois.indexOf(m)<0;", "return m.statut==='Inactif';"),
  m => {
    const api = makeEnv({ source: m, membres: membres(false), mois: 5 });
    const act = noms(api._pl2Actifs()), arc = api._planGensArchives() || '';
    return act.filter(n => arc.includes('>' + n + '<')).length === 0;
  });

// F6 — la garde « fiche sans aucune date » retiree : une fiche morte pese partout
contre('F6 garde « fiche sans aucune date » retiree',
  s => s.replace('    for(var y=y0;y<=y1;y++){if(_planEntAn(mbr.nom,y))return true;}\n    return false;',
                 '    for(var y=y0;y<=y1;y++){if(_planEntAn(mbr.nom,y))return true;}\n    return true;'),
  m => makeEnv({ source: m })._planCouvre({ nom: 'z', statut: 'Inactif' }, '2026-01-01', '2026-12-31') === false);

// F7 — le mode large retire : un contrat ARCHIVE cesse de peser.
// ⚠️⚠️ DEUX VERSIONS FAUSSES AVANT CELLE-CI, gardees en memoire (§53d).
//   ① elle comparait le total AVEC et SANS la fiche reembauchee : sans le mode
//     large la fiche entre quand meme et pese son contrat EN COURS, le total
//     changeait dans les deux cas.
//   ② elle comparait le code livre au mutant. Une contre-epreuve doit evaluer LA
//     PROPRIETE sur le mutant seul, pas mettre deux sources en regard : ecrite
//     ainsi, elle rendait `vrai` sur le bon code et annoncait « LE DEFAUT PASSE ».
//   La bonne forme : une fiche dont le contrat EN COURS ne pese presque rien
//   (un seul jour en decembre) et dont le contrat ARCHIVE couvre mars->mai. En
//   mode large elle ajoute ~500 h a la reference de l'annee, sinon ~8 h.
const H = t => parseInt(String(t || '').replace(/h.*$/, ''), 10) || 0;
const REEMB = membres(false).concat([{
  nom: 'Reembauche', statut: 'Actif', planning_id: 'standard',
  debut_contrat: '2026-12-31', fin_contrat: '2026-12-31',
  __per: [{ debut: '2026-03-01', fin: '2026-05-31' }, { debut: '2026-12-31', fin: '2026-12-31' }]
}]);
const apportArchive = s => {
  const o = { mois: 7 }; if (s) o.source = s;
  const sans = H(legende(makeEnv({ ...o, membres: membres(false) })._pl2Annual()).prevues);
  const avec = H(legende(makeEnv({ ...o, membres: REEMB })._pl2Annual()).prevues);
  return avec - sans;
};
T('D11 un contrat archive mars->mai pese dans la reference de l\'annee',
  apportArchive(null) > 100, apportArchive(null) + ' h apportees');
contre('F7 le recap annuel sort du mode large',
  s => s.replace('function _pl2Annual(){ return _planWide(_pl2Annual_); }',
                 'function _pl2Annual(){ return _pl2Annual_(); }'),
  m => apportArchive(m) > 100);

runContres();

// ── Cliquets de structure ────────────────────────────────────────────────────
console.log('\nG. Cliquets de structure');
T('G1 _planHasContractThisMonth n\'existe plus (elle ne lisait que le contrat en cours)',
  !/function\s+_planHasContractThisMonth\s*\(/.test(src));
T('G2 _pl2Actifs ne rappelle pas _planMbrs', !/_planMbrs\(\)/.test(fn(src, '_pl2Actifs')));
T('G3 le recap annuel ne rappelle pas _planMbrs', !/_planMbrs\(\)/.test(fn(src, '_pl2Annual_')));
T('G4 _paGroupes ne rappelle pas _planMbrs', !/_planMbrs\(\)/.test(fn(src, '_paGroupes')));
T('G5 le recap annuel est la 5e entree de mesure (mode large)',
  /function _pl2Annual\(\)\{ return _planWide\(_pl2Annual_\); \}/.test(src) && /ENTREE DE MESURE 5\/5/.test(src));
T('G6 les quatre entrees precedentes sont renumerotees en /5',
  [1, 2, 3, 4].every(n => src.includes('ENTREE DE MESURE ' + n + '/5')));
T('G7 _planMbrsMois, _planMbrsAn et _planSurAnnee sont exposes sur window',
  ['_planMbrsMois', '_planMbrsAn'].every(n => new RegExp('window\\.' + n + '\\s*=').test(src))
  && /window\._planSurAnnee\s*=\s*function/.test(src));
T('G8 aucun demi-surrogate isole dans le fichier',
  !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/.test(src));

console.log('\n=== ' + ok + ' vert' + (ok > 1 ? 's' : '') + ', ' + ko + ' rouge' + (ko > 1 ? 's' : '') + ' ===');
process.exit(ko ? 1 : 0);
