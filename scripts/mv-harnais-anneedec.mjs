/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ANNEE-DEC (§542) : LA FRISE SORTIE DE planning.js, ET SA FRONTIÈRE
   Lancer : node scripts/mv-harnais-anneedec.mjs          (le contrôle)
            node scripts/mv-harnais-anneedec.mjs --contre  (chaque défaut reposé doit rougir)
   src/planning-annee.js (l'année d'un modèle) est chargé juste après src/planning.js. Un nom déclaré dans un module
   et lu dans l'autre n'existe pas après le build s'il n'est pas posé sur window (CLAUDE.md §24 n°6) : ce harnais
   tient la frontière, comme mv-harnais-cuvier tient celle du Cuvier — l'ordre d'import, les emprunts tous exposés,
   les gestes tous exposés, l'état de la vue lu et écrit par fonction, rien d'exécuté au chargement.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync(process.env[env] || path.join(R, f), 'utf8');
const DEFAUTS = {
  emprunt: ['un emprunt de la frise n’est plus exposé par le Planning', 'src/planning.js', 'MV_DEC_PL', 'window._planGetTpl', 'window._planGetTplX'],
  charge:  ['la frise lit le Planning au chargement', 'src/planning-annee.js', 'MV_DEC_AN', "function _paE(){ return window._planEditingGet(); }\n", "function _paE(){ return window._planEditingGet(); }\nvar _paAn=window._pY();\n"],
  geste:   ['un geste de la frise n’est plus exposé', 'src/planning-annee.js', 'MV_DEC_AN', 'window.planAnneeCoupe       = planAnneeCoupe;', '//'],
};
if (CONTRE) {
  console.log('\n── ANNEE-DEC — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, fichier, env, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const src = lire(fichier), n = src.split(ancre).length - 1;
    if (n < 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre absente'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-dec-')), fp = path.join(tmp, path.basename(fichier));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu'); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = lire('src/planning.js', 'MV_DEC_PL'), AN = lire('src/planning-annee.js', 'MV_DEC_AN'), APP = lire('src/app.js', 'MV_DEC_APP');
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
console.log('\n── ANNEE-DEC — la frontière de src/planning-annee.js\n');
const lignes = APP.split('\n'), ip = lignes.findIndex(l => /^import '\.\/planning\.js';/.test(l));
T(ip >= 0 && /^import '\.\/planning-annee\.js';/.test(lignes[ip + 1] || ''), 'app.js charge planning-annee.js juste après planning.js');
const imports = AN.match(/^import .*$/gm) || [];
T(imports.length === 1 && /from '\.\/utils\.js';$/.test(imports[0]), 'la frise n’importe que utils.js');
const emprunts = [...AN.matchAll(/^function (\w+)\(\)\{ return window\.\1\.apply\(null, arguments\); \}$/gm)].map(m => m[1]);
const absents = emprunts.filter(n => !new RegExp('^window\\.' + n + '\\s*=', 'm').test(PL));
T(emprunts.length >= 10 && absents.length === 0, 'chaque emprunt (' + emprunts.length + ') est exposé par planning.js', absents.join(', '));
T(/^window\._planEditingGet\s*=/m.test(PL) && /^window\._planEditingSet\s*=/m.test(PL), 'l’état de la vue se lit et s’écrit par fonction (_planEditingGet / Set)');
T(!/_planEditing(?!Get|Set)/.test(AN.replace(/^\s*\/\/.*$/gm, '')), 'la frise ne touche jamais _planEditing en direct');
const frise = ['_planAnneeLire', '_planRenderAnnee', 'planAnneeOuvrir', 'planAnneePas', 'planAnneeCoupe', '_planAnneeSuggestions'];
T(frise.every(n => new RegExp('^function ' + n + '\\s*\\(', 'm').test(AN)) && frise.every(n => !new RegExp('^function ' + n + '\\s*\\(', 'm').test(PL)), 'la frise vit dans planning-annee.js, plus dans planning.js');
const gestes = [...new Set([...AN.matchAll(/onclick=\\?"(planAnnee\w+)\(/g)].map(m => m[1]))];
const nonExposes = gestes.filter(n => !new RegExp('^window\\.' + n + '\\s*=\\s*' + n + ';', 'm').test(AN));
T(gestes.length >= 8 && nonExposes.length === 0, 'chaque geste de la frise (' + gestes.length + ') est exposé', nonExposes.join(', '));
T(/window\._planRenderAnnee\(\)/.test(PL) && /^window\._planRenderAnnee\s*=\s*_planRenderAnnee;/m.test(AN), 'la roue du Planning appelle le rendu par window');
// rien ne s'exécute au chargement : au niveau 0, des déclarations, des expositions, des commentaires
let prof = 0, mauvais = [];
AN.split('\n').forEach((l, k) => { const t = l.trim();
  if (prof === 0 && t && !/^(\/\/|function |var \w+\s*=\s*(\[|\{|'|"|\d|null|true|false)|import |window\.\w+\s*=|\}|\*|\/\*)/.test(t)) mauvais.push((k + 1) + ': ' + t.slice(0, 60));
  if (prof === 0 && /^var \w+\s*=\s*window\./.test(t)) mauvais.push((k + 1) + ': ' + t.slice(0, 60));
  for (const ch of l.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '')) { if (ch === '{') prof++; else if (ch === '}') prof--; } });
T(mauvais.length === 0, 'rien ne s’exécute au chargement de la frise', mauvais.slice(0, 2).join(' · '));
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
