/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-3 (§541) : UN MOIS COUPÉ EN DEUX, LES JOURS ET SEMAINES À PART RÉGLÉS SUR LA FRISE
   Lancer : node scripts/mv-harnais-frise3.mjs          (le contrôle)
            node scripts/mv-harnais-frise3.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions et la VRAIE grille 2026 du modèle « standard ». Lu à la main avant le premier passage : en
   novembre 2026, les vendredis 20 et 27 sont libres comme en décembre — la fin d'année commence le lundi 16 novembre
   (la coupe part du lundi de la semaine du premier vendredi libre) ; avancer « Mars » d'une semaine passe du 23 au
   26 février à 7 h 30 du lundi au jeudi ; le jeudi 7 mai (5 h) se règle seul, puis revient « comme la saison » (8 h 30) ;
   la semaine de vendanges revient comme l'été (8 h 30 du lundi au jeudi, 5 h le vendredi, rien le samedi).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const DEFAUTS = {
  seuil: ['un mois n’est plus jamais coupé', '    if(dist<2)return;', '    if(dist<99)return;'],
  vides: ['la coupe ne part plus du lundi de sa semaine', '      if(fd){var lun=fd.i-fd.g;q=q.filter(function(y){return y.i>=lun;});}}', '      }'],
  sens:  ['« 1 sem. plus tôt » repousse au lieu d’avancer', '  if(n<0)A.J.slice(Math.max(0,b+n),b).forEach(', '  if(n>0)A.J.slice(Math.max(0,b+n),b).forEach('],
};
if (CONTRE) {
  console.log('\n── FRISE-3 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/planning.js'); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-frise3-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_FRISE3_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_FRISE3_PLANNING ? fs.readFileSync(process.env.MV_FRISE3_PLANNING, 'utf8') : lire('src/planning.js');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneePose', '_planAnneePasVal',
  '_planAnneeBrouillon', 'planAnneeCoupe', 'planAnneeJour', 'planAnneeRemettre', '_planAnneeEtat'];
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {}, isAdmin: () => true });
ctx._planGetTpl = (pl, y) => (pl === 'standard' && y === 2026) ? PLAN_DEF.standard : {};
vm.runInContext('var _planEditing=null;\nfunction _pY(){return 2026;}\nfunction _planLegal(){return {maxJour:10};}\nfunction _planRenderAnnee(){}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setE=function(v){_planEditing=v;};this.E=function(){return _planEditing;};', ctx);
const F = ctx.f;
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const md = (A, i) => String(A.J[i].m + 1).padStart(2, '0') + '-' + String(A.J[i].d).padStart(2, '0');
function debut(A, si) { const x = A.J.find(x => x.s === si && !x.ferme && !x.apart); return x ? md(A, x.i) : null; }
console.log('\n── FRISE-3 — la grille 2026 du modèle « standard »\n');
const A = F._planAnneeLire('standard', 2026);
const sDec = A.saisons.findIndex(s => s.m0 === 11), sMars = A.saisons.findIndex(s => s.m0 === 2);
vaut('la fin d’année commence le lundi 16 novembre (coupe du mois)', debut(A, sDec), '11-16');
vaut('les vendredis 20 et 27 novembre sont à la fin d’année, le vendredi 13 à l’automne', [A.J.find(x => x.m === 10 && x.d === 20).s, A.J.find(x => x.m === 10 && x.d === 27).s, A.J.find(x => x.m === 10 && x.d === 13).s === sDec], [sDec, sDec, false]);
ctx.setE({ annee: 'standard' });
F.planAnneeCoupe({ dataset: { s: String(sMars), n: '-7' } });
const G1 = ctx.E().brouillon, A1 = F._planAnneeLire('standard', 2026, G1);
vaut('« Mars » une semaine plus tôt : du 23 au 26 février à 7 h 30, le vendredi 27 à 4 h', [G1[1][23], G1[1][26], G1[1][27]], [7.5, 7.5, 4]);
vaut('… et la frise lit la coupe : mars dès le 23 février', debut(A1, A1.saisons.findIndex(s => s.m0 === 2)), '02-23');
F.planAnneeJour({ dataset: { m: '4', j: '7', p: '0.5' } });
vaut('le jeudi 7 mai, jour à part, se règle seul : 5 h 30', ctx.E().brouillon[4][7], 5.5);
F.planAnneeRemettre({ dataset: { m: '4', j: '7' } });
vaut('… puis revient « comme la saison » : 8 h 30', ctx.E().brouillon[4][7], 8.5);
const wv = A.J.find(x => x.m === 8 && x.d === 7).w;
F.planAnneeRemettre({ dataset: { w: String(wv) } });
const G3 = ctx.E().brouillon;
vaut('la semaine de vendanges revient comme l’été', [G3[8][7], G3[8][10], G3[8][11], G3[8][12] || 0], [8.5, 8.5, 5, 0]);
vaut('chaque geste se compte (les tutos le lisent)', F._planAnneeEtat().n, 4);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
