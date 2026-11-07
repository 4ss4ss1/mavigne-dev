/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-4 (§543) : UNE SEMAINE, RÉGLÉE SUR LA FRISE ; UNE ANNÉE VIDE SE CONSTRUIT
   Lancer : node scripts/mv-harnais-frise4.mjs          (le contrôle)
            node scripts/mv-harnais-frise4.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning-annee.js, et _feriesY de src/planning.js) et la VRAIE grille 2026 du modèle
   « standard ». Lu à la main avant le premier passage : fermer la semaine du 12 janvier met ses jours à 0 et la frise
   la lit fermée ; « comme la saison » la rouvre (7 h du lundi au jeudi, 4 h le vendredi) ; « changer le rythme à partir
   d'ici » sur le vendredi, dès la semaine du 19 octobre, passe les vendredis 23 et 30 octobre, 6 et 13 novembre à 3 h 30
   et laisse le 16 octobre à 4 h — la frise y lit une nouvelle saison dès le 19 octobre ; une année vide n'a aucune
   fermeture, une seule saison, et son lundi + 30 min donne 3 h 30 à tous ses lundis.
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
  vide:    ['une année vide se lit fermée partout', '  if(totAn>0)sem.forEach(function(s){var ouv=', '  sem.forEach(function(s){var ouv='],
  desici:  ['« à partir d’ici » change toute la saison', 'A.J.forEach(function(x){if(x.i>=debut&&x.s===si&&x.g===g&&', 'A.J.forEach(function(x){if(x.s===si&&x.g===g&&'],
  rouvrir: ['« comme la saison » ne rouvre plus une semaine fermée', 'jours=A.J.filter(function(x){return x.w===w&&!x.fer;});}', 'jours=A.J.filter(function(x){return x.w===w&&!x.fer&&!x.ferme;});}'],
};
if (CONTRE) {
  console.log('\n── FRISE-4 — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-frise4-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_FRISE4_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_FRISE4_SOURCES ? fs.readFileSync(process.env.MV_FRISE4_SOURCES, 'utf8') : SOURCES();
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneePose', '_planAnneePasVal', '_planAnneeReguliers',
  '_planAnneeBrouillon', '_planAnneeGrille', 'planAnneePas', 'planAnneeFermeSem', 'planAnneeRemettre', 'planAnneeDesIci', 'planAnneeSemaine', '_planAnneeSemDefaut', '_planAnneeSemSel'];
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {}, isAdmin: () => true, _an: 2026 });
ctx._planGetTpl = (pl, y) => (pl === 'standard' && y === 2026) ? PLAN_DEF.standard : {};
vm.runInContext('var _planEditing=null;\nfunction _paE(){return _planEditing;}\nwindow._planEditingSet=function(v){_planEditing=v;};\nfunction _pY(){return _an;}\nfunction _planLegal(){return {maxJour:10};}\nfunction _planRenderAnnee(){}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setE=function(v){_planEditing=v;};this.E=function(){return _planEditing;};', ctx);
const F = ctx.f;
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const md = (A, i) => String(A.J[i].m + 1).padStart(2, '0') + '-' + String(A.J[i].d).padStart(2, '0');
const wDe = (A, m, d) => A.J.find(x => x.m === m && x.d === d).w;
console.log('\n── FRISE-4 — une semaine réglée sur la vraie grille 2026\n');
const A = F._planAnneeLire('standard', 2026);
ctx.setE({ annee: 'standard' });
const wj = wDe(A, 0, 12);
F.planAnneeFermeSem({ dataset: { w: String(wj) } });
const G1 = ctx.E().brouillon, A1 = F._planAnneeLire('standard', 2026, G1);
vaut('fermer la semaine du 12 janvier : ses jours à 0, la frise la lit fermée', [G1[0][12] || 0, G1[0][16] || 0, A1.sem[wj].ferme], [0, 0, true]);
F.planAnneeRemettre({ dataset: { w: String(wj) } });
vaut('« comme la saison » la rouvre', [ctx.E().brouillon[0][12], ctx.E().brouillon[0][15], ctx.E().brouillon[0][16]], [7, 7, 4]);
F.planAnneeDesIci({ dataset: { w: String(wDe(A, 9, 19)), g: '4', p: '-0.5' } });
const G2 = ctx.E().brouillon, A2 = F._planAnneeLire('standard', 2026, G2);
vaut('le vendredi, dès la semaine du 19 octobre : 23 et 30 octobre, 6 et 13 novembre à 3 h 30', [G2[9][23], G2[9][30], G2[10][6], G2[10][13]], [3.5, 3.5, 3.5, 3.5]);
vaut('… le vendredi 16 octobre garde ses 4 h', G2[9][16], 4);
const sNov = A2.J.find(x => x.m === 10 && x.d === 6).s, deb = A2.J.find(x => x.s === sNov && !x.ferme && !x.apart);
vaut('… et la frise y lit une nouvelle saison dès le 19 octobre', md(A2, deb.i), '10-19');
ctx.setE({ annee: 'standard', semaine: 3 });
F.planAnneeSemaine({ dataset: { d: '1' } });
vaut('« Suivante » passe à la semaine d’après', ctx.E().semaine, 4);
console.log('\n── une année vide se construit\n');
ctx._an = 2027; ctx._planGetTpl = () => ({});
const V = F._planAnneeLire('vide', 2027);
vaut('aucune fermeture, une seule saison, à zéro', [V.fermetures.length, V.saisons.length, V.saisons[0].tot], [0, 1, 0]);
ctx.setE({ annee: 'vide' });
F.planAnneePas({ dataset: { s: '0', g: '0', d: '0.5' } });
const lundis = V.J.filter(x => x.g === 0 && !x.fer), Gv = ctx.E().brouillon;
vaut('son lundi + 30 min : tous ses lundis (hors fériés) à 3 h 30', lundis.every(x => Gv[x.m] && Gv[x.m][x.d] === 3.5) && lundis.length > 45, true);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
