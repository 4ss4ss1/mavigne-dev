/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-1 (§539) : L'ANNÉE D'UN MODÈLE, RELUE EN SAISONS (LECTURE)
   Lancer : node scripts/mv-harnais-frise1.mjs          (le contrôle)
            node scripts/mv-harnais-frise1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (_planAnneeLire, _planAnneeSaison, _feriesY, _mvEasterMD) et le VRAI modèle intégré
   « standard » (PLAN_DEF, calé sur 2026), extraits de src/planning.js ; plus un modèle 2027 « domaine ouvert »
   aux rythmes de la maquette v2. Ce qu'on attend de la grille 2026, lu à la main : six saisons (janvier-février
   32 h, mars 34 h, avril 37 h, mai-septembre 39 h, octobre-novembre 32 h, décembre 28 h), quatre fermetures
   (1er → 4 janvier, 9 → 15 mars, 3 → 23 août, 28 → 31 décembre), la semaine de vendanges à part (7 → 13
   septembre), quatre jours à part (le jeudi 7 mai court devant le vendredi 8 férié, les vendredis 20 et 27
   novembre libres, la veille de Noël à 6 h 30).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const DEFAUTS = {
  ferme: ['les semaines fermées ne sont plus vues', 'if(ouv.length&&ouv.every(function(x){return x.h<=0;})){s.ferme=true;', 'if(false){s.ferme=true;'],
  apart: ['la semaine de vendanges n’est plus « à part »', '    if(n>=3){s.apart=true;', '    if(n>=7){s.apart=true;'],
  mode:  ['la semaine type prend le maximum au lieu du plus fréquent', 'ordre.forEach(function(k){if(cpt[k]>bn){bn=cpt[k];best=k;}});', 'ordre.forEach(function(k){if(best==null||parseFloat(k)>parseFloat(best))best=k;});'],
  jours: ['les jours à part disparaissent', '  var jours=J.filter(function(x){return !x.fer&&!x.ferme&&!x.apart&&x.h!==type[x.m][x.g];});', '  var jours=[];'],
};
if (CONTRE) {
  console.log('\n── FRISE-1 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/planning.js'); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-frise1-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_FRISE1_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_FRISE1_PLANNING ? fs.readFileSync(process.env.MV_FRISE1_PLANNING, 'utf8') : lire('src/planning.js');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
function rythme(d) {                       // le modèle 2027 « domaine ouvert » de la maquette v2
  const m = d.getMonth(), j = d.getDate(), g = d.getDay();
  if (m === 8 && j >= 6 && j <= 11) return g >= 1 && g <= 6 ? 7 : 0;
  const S = m < 2 ? [7, 4] : m === 2 ? [7.5, 4] : m === 3 ? [8, 5] : m < 9 ? [8.5, 5] : (m === 9 || (m === 10 && j < 15)) ? [7, 4] : [7, 0];
  return g >= 1 && g <= 4 ? S[0] : g === 5 ? S[1] : 0;
}
const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {} });
vm.runInContext(['_mvEasterMD', '_feriesY', '_planAnneeSaison', '_planAnneeLire'].map(n => fonction(PL, n)).join('\n') + ';this.lire=_planAnneeLire;this.fer=_feriesY;', ctx);
const F27 = ctx.fer(2027), O27 = {};
for (let d = new Date(2027, 0, 1); d.getFullYear() === 2027; d.setDate(d.getDate() + 1)) {
  const m = d.getMonth(), j = d.getDate(); if (F27[m] && F27[m][j]) continue;
  const h = (m === 11 && j === 23) ? 6.5 : rythme(d); if (h > 0) (O27[m] = O27[m] || {})[j] = h; }
const TPL = { standard: { 2026: PLAN_DEF.standard }, ouvert: { 2027: O27 } };
ctx._planGetTpl = (pl, y) => (TPL[pl] && TPL[pl][y]) || {};
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const md = (A, i) => String(A.J[i].m + 1).padStart(2, '0') + '-' + String(A.J[i].d).padStart(2, '0');
console.log('\n── FRISE-1 — la grille 2026 du modèle « standard », relue en saisons\n');
const A = ctx.lire('standard', 2026);
vaut('six saisons, mois et heures par semaine', A.saisons.map(s => [s.m0, s.m1, s.tot]), [[0, 1, 32], [2, 2, 34], [3, 3, 37], [4, 8, 39], [9, 10, 32], [11, 11, 28]]);
vaut('la semaine type de mars : 7 h 30 du lundi au jeudi, 4 h le vendredi', A.saisons[1].h, [7.5, 7.5, 7.5, 7.5, 4, 0, 0]);
vaut('quatre fermetures, semaines voisines réunies', A.fermetures.map(f => md(A, f.i0) + '→' + md(A, f.i1)), ['01-01→01-04', '03-09→03-15', '08-03→08-23', '12-28→12-31']);
vaut('la semaine de vendanges, à part', A.sem.filter(s => s.apart).map(s => md(A, s.j[0].i) + '→' + md(A, s.j[s.j.length - 1].i)), ['09-07→09-13']);
vaut('quatre jours à part', A.jours.map(x => md(A, x.i) + ':' + x.h), ['05-07:5', '11-20:0', '11-27:0', '12-24:6.5']);
vaut('les fériés ne font ni jour ni semaine à part (le lundi de Pâques, l’Ascension)', A.jours.some(x => x.fer) || A.sem.some(s => s.apart && s.j.some(x => x.m === 3 && x.d === 6)), false);
console.log('\n── un modèle 2027 « domaine ouvert »\n');
const B = ctx.lire('ouvert', 2027);
vaut('six saisons', B.saisons.map(s => [s.m0, s.m1, s.tot]), [[0, 1, 32], [2, 2, 34], [3, 3, 37], [4, 8, 39], [9, 10, 32], [11, 11, 28]]);
vaut('aucune fermeture', B.fermetures.length, 0);
vaut('les vendanges, à part', B.sem.filter(s => s.apart).map(s => md(B, s.j[0].i) + '→' + md(B, s.j[s.j.length - 1].i)), ['09-06→09-12']);
vaut('les vendredis libres de fin novembre et la veille de Noël, à part', B.jours.map(x => md(B, x.i) + ':' + x.h), ['11-19:0', '11-26:0', '12-23:6.5']);
vaut('la frise couvre l’année, sans trou ni recouvrement', B.plages.reduce((a, p, k) => a && (k === 0 ? p.i0 === 0 : p.i0 === B.plages[k - 1].i1 + 1), true) && B.plages[B.plages.length - 1].i1 === B.J.length - 1, true);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
