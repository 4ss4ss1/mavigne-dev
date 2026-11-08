/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ONGLETS-1 (§549) : LES ONGLETS DU PLANNING — MOIS, ANNÉE, PERSONNEL
   Lancer : node scripts/mv-harnais-onglets1.mjs          (le contrôle)
            node scripts/mv-harnais-onglets1.mjs --contre  (chaque défaut reposé doit rougir)
   Nico (07/11), après ANNEE-TAB : « il aurait fallu mettre mois, année, personnels (les gens mais sans mettre les gens) ».
   Ce harnais tient l'ordre et les noms : dans la barre, l'aide, le guide et les tutos — et plus un « Les gens » visible.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync((env && process.env[env]) || path.join(R, f), 'utf8');
const DEFAUTS = {
  ordre: ['Personnel repasse avant Année', 'index.html', 'MV_O1_HTML', s => { const L = s.split('\n'), a = L.findIndex(l => /data-tab="annee"/.test(l)), g = L.findIndex(l => /data-tab="gens"/.test(l)); [L[a], L[g]] = [L[g], L[a]]; return L.join('\n'); }],
  nom:   ['« Les gens » revient dans la barre', 'index.html', 'MV_O1_HTML', s => s.replace('</span>Personnel</button>', '</span>Les gens</button>')],
  aide:  ['l’aide redit « Les gens »', 'src/utils.js', 'MV_O1_UT', s => s.replace('Reculez d’un mois dans Personnel :', 'Reculez d’un mois dans Les gens :')],
};
if (CONTRE) {
  console.log('\n── ONGLETS-1 — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, fic, env, casser]] of Object.entries(DEFAUTS)) {
    total++; const src = lire(fic), abime = casser(src);
    if (abime === src) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — le défaut ne s’est pas posé'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-o1-')), fp = path.join(tmp, path.basename(fic));
    fs.writeFileSync(fp, abime);
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu'); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const HTML = lire('index.html', 'MV_O1_HTML'), UT = lire('src/utils.js', 'MV_O1_UT'), G = lire('guide/10-planning.html'), TU = lire('src/tutos.js');
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
console.log('\n── ONGLETS-1 — Mois, Année, Personnel\n');
const barre = [...HTML.matchAll(/class="mvu-tab plan-tab-admin" data-tab="([a-z]+)"[^>]*>.*?<\/span>([^<]+)<\/button>/g)].map(m => m[1] + ':' + m[2]);
T(JSON.stringify(barre) === JSON.stringify(['mois:Mois', 'annee:Année', 'gens:Personnel']), 'la barre : Mois, Année, Personnel — dans cet ordre', JSON.stringify(barre));
const sansHist = UT.replace(/^\s*\/\/.*$/gm, '');
T(/\['Trois onglets', ": Mois, [^"]*Année, [^"]*Personnel, /.test(UT) && !/Les gens/.test(sansHist), 'l’aide : les trois noms, dans l’ordre, et plus un « Les gens »');
T(/Mois · Année · Personnel/.test(G) && !/Les gens|<b>Le mois<\/b>/.test(G), 'le guide du Planning : les trois noms, et plus un « Les gens »');
T(!/« Les gens »|« Le mois »/.test(TU) && /« Année », entre « Mois » et « Personnel »/.test(TU), 'les tutos nomment les onglets comme la barre');
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
