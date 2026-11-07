/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FRISE-5 (§544) : LA GRILLE DE 365 CASES LAISSE LA PLACE À LA FRISE
   Lancer : node scripts/mv-harnais-frise5.mjs          (le contrôle)
            node scripts/mv-harnais-frise5.mjs --contre  (chaque défaut reposé doit rougir)
   La frise sait tout faire de la grille (FRISE-4, §543) : l'éditeur de 365 cases (« Modifier ») est retiré. Ce harnais
   tient ce retrait — plus une fonction, plus un appel, plus une exposition de l'éditeur dans l'appli ; la roue du
   Planning ne route plus que l'année d'un modèle ; un modèle neuf s'ouvre sur son année ; l'export CSV reste.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync(process.env[env] || path.join(R, f), 'utf8');
const DEFAUTS = {
  creation: ['un modèle neuf rouvre l’éditeur de 365 cases', '  if(window.planAnneeOuvrir)window.planAnneeOuvrir(id);', '  planOpenGridEditor(id);'],
  route:    ['la roue route de nouveau vers l’éditeur', '  if(_planEditing&&_planEditing.annee&&window._planRenderAnnee){window._planRenderAnnee();return;}', '  if(_planEditing&&_planEditing.annee&&window._planRenderAnnee){window._planRenderAnnee();return;}\n  if(_planEditing){_planRenderGridEditor();return;}'],
  csv:      ['l’export CSV disparaît de l’année', "onclick=\"planExportCSV(this.dataset.pl)\">Exporter (CSV)</button>", "onclick=\"void 0\">Exporter (CSV)</button>"],
};
if (CONTRE) {
  console.log('\n── FRISE-5 — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const fic = cle === 'csv' ? 'src/planning-annee.js' : 'src/planning.js', env = cle === 'csv' ? 'MV_F5_AN' : 'MV_F5_PL';
    const src = lire(fic), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-f5-')), fp = path.join(tmp, path.basename(fic));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu'); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = lire('src/planning.js', 'MV_F5_PL'), AN = lire('src/planning-annee.js', 'MV_F5_AN');
const TOUT = PL + '\n' + AN + '\n' + lire('src/app.js') + '\n' + lire('index.html') + '\n' + lire('src/tutos.js');
const sansComm = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
console.log('\n── FRISE-5 — la grille de 365 cases est partie\n');
const PARTIS = ['planOpenGridEditor', '_planRenderGridEditor', 'planEditorSetMonth', 'planUpdateDay', 'planCloseGridEditor'];
const restes = PARTIS.filter(n => new RegExp('\\b' + n + '\\b').test(sansComm(TOUT)));
T(restes.length === 0, 'plus une fonction, un appel ni une exposition de l’éditeur dans l’appli', restes.join(', '));
T(!/>Modifier<\/button>/.test(sansComm(PL)), 'la carte d’un modèle n’a plus de bouton « Modifier »');
const cadre = (PL.match(/^function _planRenderCadre\(\)\{[\s\S]*?\n\}/m) || [''])[0];
T(/_planEditing&&_planEditing\.annee&&window\._planRenderAnnee/.test(cadre) && !/_planRenderGridEditor/.test(cadre), 'la roue du Planning ne route plus que l’année d’un modèle');
const creer = (PL.match(/^function planCreateTemplate\(\)\{[\s\S]*?\n\}/m) || [''])[0];
T(/window\.planAnneeOuvrir\(id\)/.test(creer), 'un modèle neuf s’ouvre sur son année');
T(/onclick="planExportCSV\(this\.dataset\.pl\)">Exporter \(CSV\)<\/button>/.test(AN) && /^window\.planExportCSV\s*=/m.test(PL), 'l’export CSV reste, depuis l’année');
T(/^function planSaveTpl\(/m.test(PL) && /planSaveTpl\(id\)/.test(AN), '« Enregistrer » de l’année écrit toujours par planSaveTpl');
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
