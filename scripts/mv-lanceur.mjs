#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   LISTE-1 (§190) — LE LANCEUR : joue scripts/mv-harnais-liste.mjs
   npm run check            → node scripts/mv-lanceur.mjs          (s'arrête au premier rouge)
   npm run build            → prebuild = npm run check, puis Vite
   CI (job controles)       → node scripts/mv-lanceur.mjs --continuer
   Options :
     --continuer            joue TOUT, puis liste les rouges (la CI : voir tous les rouges d'un coup)
     --groupe a,b           seulement ces groupes (ids de GROUPES), dans l'ordre de la liste
     --depuis <script>      reprendre à partir de la première commande qui contient <script>
     --liste                afficher la liste sans rien lancer

   ══ POURQUOI ══ voir mv-harnais-liste.mjs. Ce fichier ne décide de RIEN : il lit la liste.
   ⚠️ Chaque commande tourne dans son propre processus Node (process.execPath, pas `node`
     trouvé dans le PATH : sous Windows, c'est le même Node que celui qui lance npm), sortie
     affichée telle quelle — exactement ce que faisait la chaîne `&&`.
   ⚠️ Mode par défaut = la chaîne `&&` d'avant : premier rouge, arrêt, code 1.
   ⚠️ CHEMINS : fileURLToPath (§53).
   ─────────────────────────────────────────────────────────────────────────── */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HARNAIS, GROUPES } from './mv-harnais-liste.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };

/* Une commande = node scripts/<fichier>.mjs [--drapeau]. Rien d'autre (cf. la liste). */
export const FORME = /^node (scripts\/[\w./-]+\.mjs)(?: (--[\w-]+))?$/;
export function decouper(cmd) {
  const m = FORME.exec(cmd);
  if (!m) throw new Error('commande hors forme dans mv-harnais-liste.mjs : « ' + cmd + ' »');
  return [m[1], ...(m[2] ? [m[2]] : [])];
}

function arg(nom) {
  const i = process.argv.indexOf(nom);
  return i < 0 ? null : (process.argv[i + 1] || '');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const CONTINUER = process.argv.includes('--continuer');
  let liste = HARNAIS.map(([cmd, groupe]) => ({ cmd, groupe: groupe || null }));

  const g = arg('--groupe');
  if (g !== null) {
    const voulus = g.split(',').map(s => s.trim()).filter(Boolean);
    const inconnus = voulus.filter(x => !(x in GROUPES));
    if (inconnus.length) { console.error(c.r('✗ groupe inconnu : ' + inconnus.join(', '))); process.exit(2); }
    liste = liste.filter(x => voulus.includes(x.groupe));
  }
  const d = arg('--depuis');
  if (d !== null) {
    const i = liste.findIndex(x => x.cmd.includes(d));
    if (i < 0) { console.error(c.r('✗ --depuis : aucune commande ne contient « ' + d + ' »')); process.exit(2); }
    liste = liste.slice(i);
  }

  if (process.argv.includes('--liste')) {
    liste.forEach((x, i) => console.log(String(i + 1).padStart(4) + '  ' + x.cmd + (x.groupe ? c.dim('   [' + x.groupe + ']') : '')));
    process.exit(0);
  }

  const debut = Date.now();
  const rouges = [];
  let n = 0;
  for (const x of liste) {
    const args = decouper(x.cmd);
    n++;
    console.log(c.dim(`\n── [${n}/${liste.length}] ${x.cmd}`));
    const r = spawnSync(process.execPath, args, { cwd: RACINE, stdio: 'inherit' });
    const code = r.status === null ? 'signal ' + r.signal : r.status;
    if (r.status !== 0) {
      rouges.push({ ...x, code });
      if (!CONTINUER) break;
    }
  }
  const s = ((Date.now() - debut) / 1000).toFixed(0);
  console.log('\n' + c.b('MA VIGNE — lanceur des contrôles') + c.dim(`  (${n}/${liste.length} commandes, ${s} s)`));
  if (!rouges.length) { console.log(c.g(`✓ ${n} commandes, 0 rouge`)); process.exit(0); }
  for (const x of rouges)
    console.log(c.r('  ✗ ' + x.cmd) + c.dim(`  (code ${x.code}${x.groupe ? ' · ' + GROUPES[x.groupe] : ''})`));
  if (!CONTINUER && n < liste.length)
    console.log(c.dim(`  arrêt au premier rouge — ${liste.length - n} commande(s) non jouée(s). Reprendre : node scripts/mv-lanceur.mjs --depuis ${decouper(rouges[0].cmd)[0].replace('scripts/', '')}`));
  process.exit(1);
}
