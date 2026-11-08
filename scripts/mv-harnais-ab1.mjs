/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-AB (§551) : DEUX SEMAINES QUI ALTERNENT (SEMAINES A ET B)
   Lancer : node scripts/mv-harnais-ab1.mjs          (le contrôle)
            node scripts/mv-harnais-ab1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning-annee.js) et la VRAIE grille 2026 du modèle « standard ». Lu à la main avant le
   premier passage : la grille 2026 n'a AUCUNE saison à deux semaines (un jour à part ne fait pas naître l'alternance) ;
   « Une semaine sur deux » puis le vendredi de la semaine B à − 30 min sur janvier-février : la semaine du 5 janvier est
   une semaine A, les vendredis 16 et 30 janvier, 13 et 27 février passent à 3 h 30, les 9 et 23 janvier, 6 et 20 février
   restent à 4 h ; la frise y lit une saison à deux semaines (A : vendredi 4 h, B : 3 h 30, moyenne 31 h 45), les jours à
   part ne bougent pas ; le programme indicatif écrit les deux semaines ; « Une seule semaine » remet les vendredis B à 4 h.
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
  lettre:  ['les lettres s’inversent', "  J.forEach(function(x){var S=saisons[x.s];x.lettre=(S&&x.w%2!==S.pA)?'B':'A';});", "  J.forEach(function(x){var S=saisons[x.s];x.lettre=(S&&x.w%2===S.pA)?'B':'A';});"],
  echange: ['la semaine A n’est plus celle du premier jour', '    if(S.ab&&S.pA===1){var tmp=S.h;S.h=S.hB;S.hB=tmp;}});', '    });'],
  une:     ['« Une seule semaine » recopie B sur A', "&&x.h===S.hB[x.g])_planAnneePose(G,x.m,x.d,S.h[x.g]);});", "&&x.h===S.hB[x.g])_planAnneePose(G,x.m,x.d,S.hB[x.g]-0.5);});"],
};
if (CONTRE) {
  console.log('\n── FRISE-AB — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-ab1-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_AB1_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 100) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_AB1_SOURCES ? fs.readFileSync(process.env.MV_AB1_SOURCES, 'utf8') : SOURCES();
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planCreditFerie', '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneePose', '_planAnneePasVal', '_planAnneeReguliers',
  '_planAnneeBrouillon', '_planAnneeGrille', '_planAnneeCleS', 'planAnneeAB', 'planAnneePas', 'planAnneeUneSemaine', '_planAnneeDate', '_planAnneePlage', '_planAnneeHoraireTxt', '_planAnneeNature', '_planAnneeModulation', '_planAnneeProgramme'];
const ctx = vm.createContext({ window: { CONFIG: {}, PLAN_MOIS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'] }, _MV_FERIES_CACHE: {}, isAdmin: () => true,
  PLAN_MOIS_FR: ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'] });
ctx._planGetTpl = () => PLAN_DEF.standard;
vm.runInContext('var _paEtat=null;function _paE(){return _paEtat;}\nfunction _pY(){return 2026;}\nfunction _planLegal(){return {maxJour:10,hebdoLeg:35,modulMax:250,plafAnnuel:1607};}\nfunction _planRenderAnnee(){}\nfunction _planFmt(h){return String(h)+" h";}\nfunction _escHtml(x){return String(x);}\nfunction _planMbrs(){return [];}\nfunction _planPlId(){return "std";}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setE=function(v){_paEtat=v;};this.E=function(){return _paEtat;};', ctx);
const F = ctx.f;
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const md = (A, i) => String(A.J[i].m + 1).padStart(2, '0') + '-' + String(A.J[i].d).padStart(2, '0');
console.log('\n── FRISE-AB — la vraie grille 2026\n');
const A0 = F._planAnneeLire('std', 2026);
vaut('aucune saison à deux semaines dans la grille 2026', A0.saisons.filter(s => s.ab).length, 0);
ctx.setE({ annee: 'std' });
const s0 = A0.saisons.findIndex(s => s.m0 === 0);
F.planAnneeAB({ dataset: { s: String(s0) } });
vaut('« Une semaine sur deux » ouvre la semaine B', Object.keys(ctx.E().ab || {}).length, 1);
F.planAnneePas({ dataset: { s: String(s0), g: '4', d: '-0.5', l: 'B' } });
const G = ctx.E().brouillon;
vaut('vendredis B (16 et 30 janvier, 13 et 27 février) à 3 h 30', [G[0][16], G[0][30], G[1][13], G[1][27]], [3.5, 3.5, 3.5, 3.5]);
vaut('vendredis A (9 et 23 janvier, 6 et 20 février) à 4 h', [G[0][9], G[0][23], G[1][6], G[1][20]], [4, 4, 4, 4]);
const A1 = F._planAnneeLire('std', 2026, G), S = A1.saisons[A1.saisons.findIndex(s => s.m0 === 0)];
vaut('la frise lit deux semaines : A vendredi 4 h, B 3 h 30, moyenne 31 h 45, de janvier à février', [S.ab, S.h[4], S.hB[4], S.tot, S.m0, S.m1], [true, 4, 3.5, 31.75, 0, 1]);
vaut('… les jours à part ne bougent pas', A1.jours.map(x => md(A1, x.i)), ['05-07', '12-24']);
ctx._planGetTpl = () => G;   // le programme imprime le modèle ENREGISTRÉ : on l'enregistre le temps de le lire
const H = F._planAnneeProgramme('std', 2026);
ctx._planGetTpl = () => PLAN_DEF.standard;
vaut('le programme indicatif écrit les deux semaines', /\(semaines A et B\)<\/td>/.test(H) && /Semaine A\u00a0: lundi au jeudi 7 h · vendredi 4 h · Semaine B\u00a0: lundi au jeudi 7 h · vendredi 3\.5 h/.test(H), true);
F.planAnneeUneSemaine({ dataset: { s: String(A1.saisons.findIndex(s => s.m0 === 0)) } });
const G2 = ctx.E().brouillon, A2 = F._planAnneeLire('std', 2026, G2);
vaut('« Une seule semaine » remet les vendredis B à 4 h, la saison n’alterne plus', [G2[0][16], G2[1][27], A2.saisons.filter(s => s.ab).length, Object.keys(ctx.E().ab || {}).length], [4, 4, 0, 0]);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
