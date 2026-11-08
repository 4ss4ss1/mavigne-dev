/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — MONAN-1 (§546) : « MON ANNÉE » — LA FRISE D'UN SALARIÉ, SON COMPTEUR, SES CONGÉS, SON PLANNING IMPRIMÉ
   Lancer : node scripts/mv-harnais-monan1.mjs          (le contrôle)
            node scripts/mv-harnais-monan1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning-annee.js) et la VRAIE grille 2026 du modèle « standard ». Lu à la main avant le
   premier passage : la petite frise liste, dans l'ordre de l'année, la fermeture du 1er au 4 janvier puis la saison du
   5 janvier au 28 février (32 h par semaine), …, la semaine des vendanges à part, les quatre fermetures, la fin d'année
   du 16 novembre au 27 décembre — la fermeture du 28 au 31 la termine (28 h). Et dans le code : la vue d'un salarié montre la carte « Mon année » entre son mois et ses
   jours (son compteur, ses congés, son PDF) ; son planning imprimé porte le programme indicatif de son modèle.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync(process.env[env] || path.join(R, f), 'utf8');
const DEFAUTS = {
  carte:  ['la carte « Mon année » disparaît de la vue', 'src/planning.js', 'MV_M1_PL', '  return sumHtml+anHtml+daysHtml+_planLegalCard(mbr);', '  return sumHtml+daysHtml+_planLegalCard(mbr);'],
  ordre:  ['les périodes ne suivent plus l’ordre de l’année', 'src/planning-annee.js', 'MV_M1_AN', '  P.sort(function(a,b){return a.i-b.i;});\n  return h+', '  return h+'],
  prog:   ['le planning imprimé perd le programme du modèle', 'src/planning.js', 'MV_M1_PL', "    +(window._planAnneeProgramme?window._planAnneeProgramme(plId,yr):'');", "    +'';"],
};
if (CONTRE) {
  console.log('\n── MONAN-1 — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, fic, env, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const src = lire(fic), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-m1-')), fp = path.join(tmp, path.basename(fic));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu'); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = lire('src/planning.js', 'MV_M1_PL'), AN = lire('src/planning-annee.js', 'MV_M1_AN'), SRC = PL + '\n' + AN;
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const i0 = SRC.indexOf('var PLAN_DEF = {'), j0 = SRC.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + SRC.slice(i0 + 15, j0 + 1) + ')');
const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {}, PLAN_MOIS_FR: ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], PLAN_MOIS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'] });
ctx._planGetTpl = (pl, y) => (pl === 'standard' && y === 2026) ? PLAN_DEF.standard : {};
vm.runInContext('function _planFmt(h){return String(h)+" h";}\nfunction _escAttr(x){return String(x);}\n'
  + ['_mvEasterMD', '_feriesY', '_planAnneeSaison', '_planAnneeLire', '_planAnneeTon', '_planAnneeDate', '_planAnneePlage', '_paH', '_planAnneeMini'].map(n => fonction(SRC, n)).join('\n') + '\nthis.mini=_planAnneeMini;', ctx);
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
console.log('\n── MONAN-1 — la petite frise de la vraie grille 2026\n');
const H = ctx.mini('standard', 2026);
const lignes = [...H.matchAll(/<\/span>([^<]+)<\/div>/g)].map(m => m[1]);
T(lignes[0] === '1er\u00a0→ 4\u00a0janv. · fermé'.replace('1er\u00a0→', '1er → ') || /^1er → 4\u00a0janv\. · fermé$/.test(lignes[0]), 'd’abord la fermeture du 1er au 4 janvier', lignes[0]);
T(/^5 → 28\u00a0févr\. · 32\u00a0h par semaine$/.test(lignes[1]) || /^5\u00a0janv\. → 28\u00a0févr\. · 32\u00a0h par semaine$/.test(lignes[1]), 'puis la saison du 5 janvier au 28 février, 32 h par semaine', lignes[1]);
T(lignes.filter(l => / · fermé$/.test(l)).length === 4, 'les quatre fermetures', String(lignes.filter(l => / · fermé$/.test(l)).length));
T(lignes.some(l => /\(semaine à part\)$/.test(l) && /sept\./.test(l)), 'la semaine des vendanges, à part');
T(lignes.some(l => /^16\u00a0nov\. → 27\u00a0déc\. · 28\u00a0h par semaine$/.test(l)), 'la fin d’année du 16 novembre au 27 décembre (la fermeture du 28 la termine), 28 h');
console.log('\n── la vue d’un salarié et son planning imprimé\n');
const mon = fonction(PL, '_planBuildMonHtml');
T(/return sumHtml\+anHtml\+daysHtml/.test(mon), 'la carte « Mon année » entre son mois et ses jours');
T(/_planAnnu\(mbr,planMonth\)/.test(mon) && /_planAnneeMini\(plId,_yrA\)/.test(mon) && /cpSolde/.test(mon), 'son compteur de l’année, sa petite frise, ses congés');
T(/data-n="'\+_escAttr\(mbr\.nom\)\+'" data-a="'\+_yrA\+'" onclick="planAnnuelNomPdf\(this\.dataset\.n,this\.dataset\.a\)"/.test(mon), 'son planning de l’année en PDF, sans valeur crue dans le geste');
T(/_planAnneeProgramme\(plId,yr\)/.test(fonction(PL, '_paDocNom')), 'son planning imprimé porte le programme indicatif de son modèle');
T(/^window\._planAnneeMini\s*=\s*_planAnneeMini;/m.test(AN), 'la petite frise est exposée au Planning');
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
