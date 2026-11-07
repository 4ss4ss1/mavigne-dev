/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-2 (§540) : L'ANNÉE D'UN MODÈLE, À RÉGLER SUR LA FRISE
   Lancer : node scripts/mv-harnais-frise2.mjs          (le contrôle)
            node scripts/mv-harnais-frise2.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning.js et, depuis ANNEE-DEC §542, src/planning-annee.js) extraites de src/planning.js (le moteur d'édition, les gestes, la base de l'année, la lecture
   en saisons), le VRAI modèle « standard » de 2026, et un modèle 2027 « domaine ouvert » aux rythmes de la maquette v2
   SANS la veille de Noël à 6 h 30 — 1 827 h 30 pour une base de 1 827 h : la maquette l'avait montré, « Tomber juste »
   doit proposer d'abord le jeudi 23 décembre à 6 h 30, et l'appliquer pose le total sur la base.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const DEFAUTS = {
  reguliers: ['une retouche de saison écrase aussi les jours à part', 'return A.J.filter(function(x){return x.s===si&&x.g===g&&!x.fer&&!x.ferme&&!x.apart&&x.h===S.h[g];});}', 'return A.J.filter(function(x){return x.s===si&&x.g===g&&!x.fer&&!x.ferme&&!x.apart;});}'],
  veille:    ['« Tomber juste » ne sait plus raccourcir la veille de Noël', "  [[11,25,'No\\u00ebl'],[11,31,'la Saint-Sylvestre']].forEach(function(v){", '  [].forEach(function(v){'],
  horaires:  ['enregistrer perd les horaires du modèle', "  Object.keys(old).forEach(function(k){if(isNaN(parseInt(k,10)))neuf[k]=old[k];});", '  void old;'],
  annuler:   ['« Annuler » garde le brouillon', 'function planAnneeAnnuler(){var E=_paE();if(!E||!E.annee)return;E.brouillon=null;', 'function planAnneeAnnuler(){var E=_paE();if(!E||!E.annee)return;'],
};
if (CONTRE) {
  console.log('\n── FRISE-2 — contre-épreuve (un processus par défaut)\n');
  const src = (lire('src/planning.js') + '\n' + lire('src/planning-annee.js')); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-frise2-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_FRISE2_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_FRISE2_PLANNING ? fs.readFileSync(process.env.MV_FRISE2_PLANNING, 'utf8') : (lire('src/planning.js') + '\n' + lire('src/planning-annee.js'));
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planJoursSem', '_planBaseAn', '_planSolid', '_planSolidJour', '_planEstSolid',
  '_planSolidRatio', '_planCreditFerie', '_planModelBrut', '_planBaseAttendue', '_planAnneeSaison', '_planAnneeLire',
  '_planAnneeCopie', '_planAnneeTotal', '_planAnneeCible', '_planAnneePose', '_planAnneeReguliers', '_planAnneePasVal', '_planAnneeNomS',
  '_planAnneeRetouches', '_planAnneeSuggestions', 'planAnneePas', 'planAnneeAppliquer', 'planAnneeEnregistrer', 'planAnneeAnnuler'];
const MODES = /var PLAN_SOLID_MODES=\{[^;]*\};/.exec(PL)[0];
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const ctx = vm.createContext({ window: { CONFIG: {} }, _MV_FERIES_CACHE: {}, PLAN_MOIS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  _an: 2027, STORE: {}, SAUVE: [], isAdmin: () => true, _planFmt: h => String(h) + ' h' });
vm.runInContext(MODES + '\nvar _planEditing=null;\nfunction _paE(){return _planEditing;}\nwindow._planEditingSet=function(v){_planEditing=v;};\nfunction _pY(){return _an;}\nfunction _planLegal(){return {maxJour:10,plafAnnuel:1607,hebdoLeg:35};}\nfunction _planRenderAnnee(){}\n'
  + 'function _pTplStore(){return STORE;}\nfunction planSaveTpl(id){SAUVE.push(id);}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.E=function(){return _planEditing;};this.setE=function(v){_planEditing=v;};', ctx);
ctx.window.PLAN_MOIS = ctx.PLAN_MOIS;   // depuis ANNEE-DEC (§542), la frise lit les mois par window
const F = ctx.f, FER27 = F._feriesY(2027);
function rythme(d) { const m = d.getMonth(), j = d.getDate(), g = d.getDay();
  if (m === 8 && j >= 6 && j <= 11) return g >= 1 && g <= 6 ? 7 : 0;
  const S = m < 2 ? [7, 4] : m === 2 ? [7.5, 4] : m === 3 ? [8, 5] : m < 9 ? [8.5, 5] : (m === 9 || (m === 10 && j < 15)) ? [7, 4] : [7, 0];
  return g >= 1 && g <= 4 ? S[0] : g === 5 ? S[1] : 0; }
const O27 = {}; for (let d = new Date(2027, 0, 1); d.getFullYear() === 2027; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), j = d.getDate(); if (FER27[m] && FER27[m][j]) continue; const h = rythme(d); if (h > 0) (O27[m] = O27[m] || {})[j] = h; }
const TPL = { ouvert: { 2027: O27 }, standard: { 2026: PLAN_DEF.standard } };
ctx._planGetTpl = (pl, y) => (TPL[pl] && TPL[pl][y]) || {};
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const r2 = x => Math.round(x * 100) / 100;
console.log('\n── FRISE-2 — « Tomber juste » sur le modèle 2027 de la maquette\n');
const G = F._planAnneeCopie(O27);
vaut('le modèle sans la veille de Noël : 1 827 h 30', r2(F._planAnneeTotal('ouvert', 2027, G)), 1827.5);
vaut('la cible : la base de l’année', F._planAnneeCible('ouvert', 2027), 1827);
const S = F._planAnneeSuggestions('ouvert', 2027, G, 1827, 10);
vaut('d’abord : le jeudi 23 décembre, veille de Noël, à 6 h 30 — juste', [S.length > 0 && S[0].mv.length === 1 && /23 d.cembre, veille de No.l/.test(S[0].mv[0].lib), S[0] && r2(S[0].reste)], [true, 0]);
ctx.setE({ annee: 'ouvert' }); ctx.E().sg = S; F.planAnneeAppliquer({ dataset: { k: '0' } });
vaut('appliquer la pose dans le brouillon, et le total tombe sur la base', [r2(F._planAnneeTotal('ouvert', 2027, ctx.E().brouillon)), ctx.E().brouillon[11][23]], [1827, 6.5]);
vaut('le modèle enregistré, lui, n’a pas bougé tant qu’on n’enregistre pas', O27[11][23], 7);
F.planAnneeAnnuler();
vaut('« Annuler » laisse le modèle comme il était', ctx.E().brouillon, null);
console.log('\n── une saison réglée jour par jour, sur la vraie grille 2026\n');
ctx._an = 2026; ctx.setE({ annee: 'standard' });
const avant = F._planAnneeLire('standard', 2026);
const sMars = avant.saisons.findIndex(s => s.m0 === 2);
F.planAnneePas({ dataset: { s: String(sMars), g: '4', d: '0.5' } });
const B = ctx.E().brouillon;
vaut('mars, vendredi + 30 min : les vendredis réguliers passent à 4 h 30', [B[2][6], B[2][20], B[2][27]], [4.5, 4.5, 4.5]);
vaut('… la semaine fermée (vendredi 13 mars) reste fermée', B[2][13] || 0, 0);
const sEte = avant.saisons.findIndex(s => s.m0 === 4);
F.planAnneePas({ dataset: { s: String(sEte), g: '3', d: '0.5' } });
vaut('mai → septembre, jeudi + 30 min : les jeudis réguliers passent à 9 h', [ctx.E().brouillon[4][21], ctx.E().brouillon[6][2], ctx.E().brouillon[8][17]], [9, 9, 9]);
vaut('… le jeudi 7 mai, jour à part (5 h devant le vendredi férié), ne bouge pas', ctx.E().brouillon[4][7], 5);
ctx.STORE.standard = { _timings: { 0: '07:30' }, 0: { 5: 7 } };
F.planAnneeEnregistrer();
vaut('enregistrer écrit l’année du modèle, ses horaires gardés', [ctx.STORE.standard._timings && ctx.STORE.standard._timings[0], ctx.STORE.standard[2][6], ctx.SAUVE.slice(-1)[0], ctx.E().brouillon], ['07:30', 4.5, 'standard', null]);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
