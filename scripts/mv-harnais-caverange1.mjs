/* ───────────────────────────────────────────────────────
   HARNAIS — CAVE-RANGE-1 (§449) : UN SEUL MILLÉSIME REGARDÉ POUR TOUTE LA CAVE
   Lancer :          node scripts/mv-harnais-caverange1.mjs
   Contre-épreuves : node scripts/mv-harnais-caverange1.mjs --contre

   POURQUOI IL EXISTE
   Vérifié avant le code (23/10) : Le Chai avait son choix de millésime (_caveMillFilter : « Tous · 2026 · 2025 », pour
   ses cinq onglets et son bandeau) et Le Millésime le sien (_mlMil) — on pouvait filtrer le Chai sur 2025 et lire
   Le Millésime 2026 sans le voir. Ce harnais EXÉCUTE _mlMilActif, _mlSetMil, _caveSetMill et la tête du Millésime
   (_mlHead) : un seul choix, lu par les deux ; « Tous » au Chai → la campagne en cours au Millésime, dit à l'écran.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), utils: lire('src/utils.js'), guide: lire('guide/08-cave.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function monter(S, o) {
  const peint = [];
  const c = { _caveMillFilter: o.filtre, caveSection: o.section, caveTab: o.tab || 'cuv', Number, String,
    _mlCampagne: () => 2026, renderCaveMillesime: () => peint.push('millesime'), renderCaveCuvees: () => peint.push('cuvees'), renderCaveJournal: () => peint.push('journal'),
    renderCaveBouteille: () => peint.push('bouteille'), renderCaveLabo: () => peint.push('labo'), window: {}, _caveMilBarRender: () => peint.push('barre'),
    _caveKpisRender: () => peint.push('bande'), _mvcRenderHeader: () => peint.push('entete'), _caveSaisBanner: () => {},
    _mlEtat: () => ({ pill: '', ligne: '' }), _escHtml: (x) => String(x), _mlMillesimes: () => [2026, 2025, 2024], _mlTuiles: () => '', _pcavLog: () => {} };
  vm.createContext(c);
  c._caveMilsDuChai = () => [2026, 2025]; c.CAVE_ELEVAGE = { cuvees: [] };
  vm.runInContext(['_mlMilActif', '_caveSetMill', '_caveMillChipsHtml'].map((n) => corps(S.cave, n)).join('\n') + '\nthis.__lire = () => _caveMillFilter;', c);
  return { c, peint };
}
function jouer(S) {
  const A = monter(S, { filtre: 'tous', section: 'millesime' });
  t('① « Tous » au Chai : Le Millésime montre la campagne en cours (2026)', A.c._mlMilActif() === 2026);
  const hA = A.c._caveMillChipsHtml();
  t('① … et la barre le dit, au Millésime', /Le Millésime montre celui de la campagne en cours/.test(hA) && /pour toute la Cave/.test(hA));
  A.c._caveSetMill('2025');
  t('② choisir 2025 au Millésime le choisit pour toute la Cave (le même état)', A.c.__lire() === '2025' && A.c._mlMilActif() === 2025);
  t('② … et repeint Le Millésime, la bande et la barre, pas les vues du Chai', A.peint.includes('millesime') && A.peint.includes('bande') && A.peint.includes('barre') && !A.peint.includes('cuvees'));
  t('② la phrase « Tous » disparaît quand une année est choisie', !/pour toute la Cave/.test(A.c._caveMillChipsHtml()));
  const B = monter(S, { filtre: '2025', section: 'elevage', tab: 'labo' });
  B.c._caveSetMill('tous');
  t('③ « Tous » choisi au Chai repeint l’onglet du Chai à l’écran, sa barre et son en-tête', B.peint.includes('labo') && B.peint.includes('barre') && B.peint.includes('entete') && B.c.__lire() === 'tous');
  t('③ … et Le Millésime suit (campagne en cours)', B.c._mlMilActif() === 2026);
  const P = S.cave.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  t('④ plus de choix propre au Millésime (_mlMil, ses boutons _mlSetMil)', !/\b_mlMil\b|_mlSetMil|mlh-sel/.test(P));
  t('④ un renvoi « rendement maximum » choisit le millésime pour toute la Cave', /if\(isFinite\(_rm\)&&_rm>0\) _caveMillFilter=String\(_rm\);/.test(S.cave));
  t('④ une seule barre « Millésime regardé », sous les sections de la Cave (CAVE-RANGE-2b)', /<span class="mvcm-lab">Millésime regardé<\/span>/.test(S.cave) && /var ref=document\.getElementById\('cave-sec-tabs'\);/.test(S.cave) && /var la=\(caveSection==='elevage' \|\| caveSection==='millesime'\);/.test(S.cave));
  t('⑤ la nouveauté et le guide le disent', /titre: 'Cave : un seul millésime regardé'/.test(S.utils) && /une seule barre, juste sous les sections de la Cave/.test(S.guide));
  t('⑥ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-caverange1.mjs'") > 0 && S.liste.indexOf("mv-harnais-caverange1.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, a, b) => { if (S.cave.split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { cave: S.cave.split(a).join(b) }); };
  const mutants = [
    ['Le Millésime ignore le choix du Chai', (S) => R(S, "function _mlMilActif(){ return (_caveMillFilter && _caveMillFilter!=='tous') ? Number(_caveMillFilter) : _mlCampagne(); }", 'function _mlMilActif(){ return _mlCampagne(); }')],
    ['le Chai repeint au lieu du Millésime', (S) => R(S, "  if(caveSection==='millesime'){ renderCaveMillesime(); if(typeof _caveKpisRender==='function') _caveKpisRender(); _caveMilBarRender(); return; }\n", '')],
    ['la phrase « Tous » disparaît de la barre', (S) => R(S, "if(typeof caveSection!=='undefined' && caveSection==='millesime' && _caveMillFilter==='tous') h+=", 'if(false) h+=')],
    ['la barre se montre aussi au Cuvier', (S) => R(S, "var la=(caveSection==='elevage' || caveSection==='millesime');", 'var la=true;')],
    ['le renvoi garde un choix à part', (S) => R(S, 'if(isFinite(_rm)&&_rm>0) _caveMillFilter=String(_rm);', 'if(isFinite(_rm)&&_rm>0) _mlMil=_rm;')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-caverange1.mjs'").join("mv-harnais-caverangeX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
