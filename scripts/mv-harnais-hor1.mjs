/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — HOR-1 (§550) : LES HORAIRES SUR LA FRISE (prise par saison, prise d'un jour, codes D/M/A en clair)
   Lancer : node scripts/mv-harnais-hor1.mjs          (le contrôle)
            node scripts/mv-harnais-hor1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions : _planDefTiming (src/planning.js, ce que lisent le relevé, les retards, le planning imprimé) et
   la frise (src/planning-annee.js). Lu à la main avant le premier passage : un jour à prise propre {d:'09:00'} de 8 h 30
   finit à 18 h 30 (9 h + 8 h 30 + 1 h de coupure) ; {d,f} se lit tel quel ; la frise lit chaque jour exactement comme
   _planDefTiming (mois réglé, codes D/M/A, jour propre, défaut par heures) ; « + 15 min » sur la saison de janvier-février
   pose 7 h 15 sur janvier ET février, rien ailleurs ; la prise d'un jour se pose puis se retire ; les codes D/M/A
   s'écrivent en heures identiques ; « Enregistrer » écrit les horaires du brouillon.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SOURCES = () => lire('src/planning.js') + '\n' + lire('src/planning-annee.js');
const DEFAUTS = {
  jour:   ['_planDefTiming ignore la prise propre d’un jour', "if(tCode&&typeof tCode==='object'){var _hj=_hm(tCode.d,'');if(_hj)return", "if(false){var _hj=_hm(tCode.d,'');if(_hj)return"],
  pause:  ['la frise oublie la coupure dans la fin', "var e=_paMinT(dbt)+Math.round(h*60)+((!cont&&h>=6)?P:0);", "var e=_paMinT(dbt)+Math.round(h*60);"],
  saison: ['la prise d’une saison ne va qu’à son premier mois', '  for(var m=S.m0;m<=S.m1;m++)meta._timings[m]=', '  for(var m=S.m0;m<=S.m0;m++)meta._timings[m]='],
};
if (CONTRE) {
  console.log('\n── HOR-1 — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-hor1-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_HOR1_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 100) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_HOR1_SOURCES ? fs.readFileSync(process.env.MV_HOR1_SOURCES, 'utf8') : SOURCES();
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const i1 = PL.indexOf('var PLAN_DEF_T = {'), j1 = PL.indexOf('};', i1);
const PLAN_DEF_T = vm.runInNewContext('(' + PL.slice(i1 + 17, j1 + 1) + ')');
const NOMS = ['_mvEasterMD', '_feriesY', '_planDefTiming', '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneeBrouillon', '_planAnneeMetaCopie', '_planAnneeMetaEd',
  '_paMinT', '_paHHMM', '_paHm', '_planAnneeHoraire', '_planAnneePriseSaison', '_planAnneeCodes', 'planAnneePrise', 'planAnneeJourSel', 'planAnneePriseJour', 'planAnneeDma', 'planAnneeEnregistrer'];
const TPL = { std: JSON.parse(JSON.stringify(PLAN_DEF.standard)) };
const ctx = vm.createContext({ window: { PLAN_PAUSE_MIN: 60, PLAN_DEF_T }, PLAN_PAUSE_MIN: 60, PLAN_DEF_T, _MV_FERIES_CACHE: {}, isAdmin: () => true, STORE: {}, PLANNING_TEMPLATES: { 2026: {} } });
ctx._planGetTpl = (pl, y) => (pl === 'std' ? TPL.std : {});
vm.runInContext('var _planEditing=null;var _paEtat=null;\nfunction _paE(){return _paEtat;}\nfunction _pY(){return 2026;}\nfunction _planRenderAnnee(){}\nfunction _pTplStore(){return STORE;}\nfunction planSaveTpl(){}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setE=function(v){_paEtat=v;};this.E=function(){return _paEtat;};', ctx);
const F = ctx.f;
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const dt = t => t ? { d: t.d, f: t.f } : null;
console.log('\n── HOR-1 — ce que lit _planDefTiming\n');
ctx.PLANNING_TEMPLATES[2026].t = { _timings: { 5: { d: '07:00' } }, _timings_jour: { 5: { 3: 'D', 4: 'M', 5: 'A', 10: { d: '09:00' }, 11: { d: '09:00', f: '16:30' }, 12: {} } }, _horaires_dma: { decale: '09:00', fin: '16:30' } };
vaut('un jour à prise propre, 8 h 30 : 9 h 00 → 18 h 30', dt(F._planDefTiming(8.5, 't', 5, 10, 2026)), { d: '09:00', f: '18:30' });
vaut('… et un code converti {d,f} se lit tel quel', dt(F._planDefTiming(6.5, 't', 5, 11, 2026)), { d: '09:00', f: '16:30' });
vaut('… un objet sans heure valable retombe sur le mois', dt(F._planDefTiming(8.5, 't', 5, 12, 2026)), { d: '07:00', f: '16:30' });
console.log('\n── la frise lit chaque jour comme _planDefTiming\n');
const meta = F._planAnneeMetaCopie(ctx.PLANNING_TEMPLATES[2026].t);
const cas = [[8.5, 5, 3], [6.5, 5, 4], [6.5, 5, 5], [8.5, 5, 10], [6.5, 5, 11], [8.5, 5, 12], [8.5, 5, 20], [5, 5, 21], [7, 0, 6], [4, 0, 9], [8.5, 6, 7]];
const ecarts = cas.filter(([h, m, d]) => JSON.stringify(dt(F._planAnneeHoraire(meta, m, d, h))) !== JSON.stringify(dt(F._planDefTiming(h, 't', m, d, 2026))));
vaut('mois réglé, codes D/M/A, jour propre, défaut par heures : aucun écart', ecarts, []);
console.log('\n── régler sur la frise\n');
ctx.setE({ annee: 'std' });
const A = F._planAnneeLire('std', 2026, F._planAnneeCopie(TPL.std));
const s0 = A.saisons.findIndex(s => s.m0 === 0);
F.planAnneePrise({ dataset: { s: String(s0), p: '15' } });
const M = ctx.E().meta;
vaut('« + 15 min » sur la saison de janvier-février : 7 h 15 en janvier et février, rien en mars', [M._timings[0] && M._timings[0].d, M._timings[1] && M._timings[1].d, M._timings[2] || null], ['07:15', '07:15', null]);
F.planAnneeJourSel({ dataset: { m: '5', j: '10' } });
F.planAnneePriseJour({ dataset: { p: '15' } });
vaut('la prise du mercredi 10 juin : 7 h 15, ce jour seul', ctx.E().meta._timings_jour[5][10], { d: '07:15' });
F.planAnneePriseJour({ dataset: { p: '0' } });
vaut('… « Comme la saison » la retire', ctx.E().meta._timings_jour[5][10] || null, null);
ctx.setE({ annee: 'std', meta: F._planAnneeMetaCopie(ctx.PLANNING_TEMPLATES[2026].t), brouillon: F._planAnneeCopie(TPL.std) });
const avant = [3, 4, 5].map(d => dt(F._planAnneeHoraire(ctx.E().meta, 5, d, 1)));
F.planAnneeDma();
vaut('les codes D/M/A s’écrivent en heures, identiques', [F._planAnneeCodes(ctx.E().meta), [3, 4, 5].map(d => dt(F._planAnneeHoraire(ctx.E().meta, 5, d, 1)))], [0, avant]);
F.planAnneeEnregistrer();
vaut('« Enregistrer » écrit les horaires du brouillon, puis le libère', [ctx.STORE.std && ctx.STORE.std._timings_jour && ctx.STORE.std._timings_jour[5] && ctx.STORE.std._timings_jour[5][4], ctx.E().meta], [{ d: '09:00', f: '16:30' }, null]);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
