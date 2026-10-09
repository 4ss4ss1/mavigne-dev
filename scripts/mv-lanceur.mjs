#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   LISTE-1 (§190) — LE LANCEUR : joue scripts/mv-harnais-liste.mjs
   ★★ BUILD-1 (§305) — EN PARALLÈLE : plusieurs commandes à la fois (autant que le processeur a de
     cœurs), leurs sorties affichées dans l'ORDRE DE LA LISTE, comme avant.
   npm run check            → node scripts/mv-lanceur.mjs          (s'arrête au premier rouge)
   npm run build            → prebuild = npm run check, puis Vite
   CI (job controles)       → node scripts/mv-lanceur.mjs --continuer
   Options :
     --continuer            joue TOUT, puis liste les rouges (la CI : voir tous les rouges d'un coup)
     --groupe a,b           seulement ces groupes (ids de GROUPES), dans l'ordre de la liste
     --depuis <script>      reprendre à partir de la première commande qui contient <script>
     --liste                afficher la liste sans rien lancer ([seul] = joué seul, cf. SEULS)
     --un-par-un            l'ancien mode : une commande à la fois, sortie en direct
   Les plus longues d'abord : la durée de chaque commande est retenue dans node_modules/.cache/mv-lanceur-durees.json.
   MV_JOBS=N                nombre de commandes à la fois (défaut : les cœurs du processeur ; 1 = --un-par-un)

   ══ POURQUOI ══ voir mv-harnais-liste.mjs. Ce fichier ne décide de RIEN : il lit la liste.
   ══ BUILD-1, MESURÉ LE 09/10 ══ 345 commandes = 612 s jouées une par une (bac à sable, 1 cœur) ;
     10 commandes font 82 % du temps, les contre-épreuves 67 %. Une seule à la fois laissait les
     autres cœurs du PC à ne rien faire pendant tout le build.
   ⚠️ LES COMMANDES SEULES (SEULS, dans la liste) tournent EN PREMIER, une par une, avant les autres :
     elles écrivent un instant dans le dépôt (un vrai fichier de src/, ou un fichier temporaire dans
     src/ ou scripts/ que les contrôles qui listent ces dossiers verraient). Au milieu des autres,
     elles feraient rougir un voisin au hasard. En tête plutôt qu'à leur place : à leur place, il
     faudrait d'abord attendre la fin de la plus longue commande en cours.
   ⚠️ ON NE TUE JAMAIS UNE COMMANDE EN COURS. Au premier rouge (mode par défaut), plus rien ne démarre,
     mais ce qui tourne va au bout : mv-harnais-cuvgr3 réécrit un vrai fichier de src/ et ne le rend
     que dans son `finally` — tué au mauvais moment, il laisserait la copie fautive en place.
   ⚠️ Chaque commande tourne dans son propre processus Node (process.execPath, pas `node` trouvé dans
     le PATH : sous Windows, c'est le même Node que celui qui lance npm).
   ⚠️ Mode par défaut = la chaîne `&&` d'avant : premier rouge, arrêt, code 1.
   ⚠️ CHEMINS : fileURLToPath (§53).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HARNAIS, GROUPES, SEULS } from './mv-harnais-liste.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c = { g: s => `\x1b[32m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };

/* Une commande = node scripts/<fichier>.mjs [--drapeau]. Rien d'autre (cf. la liste). */
export const FORME = /^node (scripts\/[\w./-]+\.mjs)(?: (--[\w-]+))?$/;
export function decouper(cmd) {
  const m = FORME.exec(cmd);
  if (!m) throw new Error('commande hors forme dans mv-harnais-liste.mjs : « ' + cmd + ' »');
  return [m[1], ...(m[2] ? [m[2]] : [])];
}

/* ── LE MOTEUR, sans processus ────────────────────────────────────────────
   `executer(x)` rend une promesse { code, ... }. mv-harnais-lanceur le joue avec un faux exécutant
   (durées simulées) : c'est ce qui prouve le « seul », la limite de `jobs` et l'arrêt au premier
   rouge sans lancer 345 processus. Rend { res, arrete } — res[i] vide = commande jamais lancée. */
export async function jouer(liste, { jobs, continuer, executer, surFin, attendu }) {
  const res = new Array(liste.length);
  let rouge = false;
  const lancer = async i => {
    const r = await executer(liste[i]);
    res[i] = Object.assign({}, liste[i], r);
    if (r.code !== 0) rouge = true;
    if (surFin) surFin(i, res);
  };
  // 1. Les SEULES, une par une, en tête.
  for (let i = 0; i < liste.length; i++) {
    if (!liste[i].seul) continue;
    if (rouge && !continuer) break;
    await lancer(i);
  }
  // 2. Les autres, `jobs` à la fois : les plus longues d'abord quand on connaît leur durée (`attendu`, mesurée au build
  //    d'avant ; inconnue = en tête), sinon dans l'ordre de la liste. Une longue lancée tard finit tard, seule :
  //    recup --contre (134 s, 169ᵉ de la liste) donnait 174 s à 4 cœurs dans l'ordre, 140 s lancée d'abord (calcul).
  const autres = liste.map((x, i) => i).filter(i => !liste[i].seul);
  if (attendu) {
    const a = i => { const v = attendu(liste[i]); return typeof v === 'number' ? v : Infinity; };
    autres.sort((i, j) => (a(j) === a(i) ? 0 : a(j) > a(i) ? 1 : -1));
  }
  let k = 0;
  const ouvrier = async () => {
    while (k < autres.length) {
      if (rouge && !continuer) return;          // plus rien ne démarre ; ce qui tourne va au bout
      await lancer(autres[k++]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, autres.length)) }, ouvrier));
  return { res, arrete: rouge && !continuer };
}

/* L'affichage dans l'ordre de la liste : écrit les résultats consécutifs déjà arrivés à partir de
   etat.p. `fin` = plus rien n'arrivera (on saute alors les commandes jamais lancées). */
export function vider(res, etat, ecrire, fin) {
  while (etat.p < res.length && (res[etat.p] || fin)) {
    if (res[etat.p]) ecrire(etat.p, res[etat.p]);
    etat.p++;
  }
}

export function jobsParDefaut() {
  const n = Number(process.env.MV_JOBS);
  if (n >= 1) return Math.floor(n);
  return Math.max(1, typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length);
}

function executerVrai(x) {
  return new Promise(resoudre => {
    const t0 = Date.now(), morceaux = [];
    let fini = false;
    const finir = code => { if (fini) return; fini = true; resoudre({ code, morceaux, duree: (Date.now() - t0) / 1000 }); };
    let p;
    try { p = spawn(process.execPath, decouper(x.cmd), { cwd: RACINE, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }); }
    catch (e) { morceaux.push([2, Buffer.from(String(e && e.stack || e) + '\n')]); return finir('erreur'); }
    p.stdout.on('data', b => morceaux.push([1, b]));
    p.stderr.on('data', b => morceaux.push([2, b]));
    p.on('error', e => { morceaux.push([2, Buffer.from(String(e && e.stack || e) + '\n')]); finir('erreur'); });
    p.on('close', (code, signal) => finir(code === null ? 'signal ' + signal : code));
  });
}

/* Les durées du dernier passage, pour lancer les plus longues d'abord. Propres au poste (node_modules, jamais commité) ;
   absentes (CI, premier build) = l'ordre de la liste. Écrites APRÈS la liste, jamais pendant. */
const DUREES = path.join(RACINE, 'node_modules', '.cache', 'mv-lanceur-durees.json');
function lireDurees() {
  try { return JSON.parse(fs.readFileSync(DUREES, 'utf8')); } catch (e) { return {}; /* pas encore de mesure : l'ordre de la liste */ }
}
function ecrireDurees(res) {
  const d = lireDurees();
  for (const x of res) if (x) d[x.cmd] = Math.round(x.duree * 10) / 10;
  try { fs.mkdirSync(path.dirname(DUREES), { recursive: true }); fs.writeFileSync(DUREES, JSON.stringify(d, null, 1) + '\n'); }
  catch (e) { console.log(c.dim('  (durées non retenues : ' + e.message + ')')); }
}

const nomCourt = cmd => decouper(cmd).join(' ').replace('scripts/', '');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const CONTINUER = process.argv.includes('--continuer');
  const arg = nom => { const i = process.argv.indexOf(nom); return i < 0 ? null : (process.argv[i + 1] || ''); };
  let liste = HARNAIS.map(([cmd, groupe]) => ({ cmd, groupe: groupe || null, seul: decouper(cmd)[0] in SEULS }));

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
    liste.forEach((x, i) => console.log(String(i + 1).padStart(4) + '  ' + x.cmd + (x.groupe ? c.dim('   [' + x.groupe + ']') : '') + (x.seul ? c.dim('   [seul]') : '')));
    process.exit(0);
  }

  const debut = Date.now();
  const jobs = process.argv.includes('--un-par-un') ? 1 : jobsParDefaut();
  let res, arrete;
  if (jobs === 1) {
    // ── L'ancien mode, tel quel : une commande à la fois, sortie en direct.
    res = new Array(liste.length); arrete = false;
    for (let n = 0; n < liste.length; n++) {
      const x = liste[n];
      console.log(c.dim(`\n── [${n + 1}/${liste.length}] ${x.cmd}`));
      const t0 = Date.now();
      const r = spawnSync(process.execPath, decouper(x.cmd), { cwd: RACINE, stdio: 'inherit' });
      res[n] = Object.assign({}, x, { code: r.status === null ? 'signal ' + r.signal : r.status, duree: (Date.now() - t0) / 1000 });
      if (res[n].code !== 0 && !CONTINUER) { arrete = n < liste.length - 1; break; }
    }
  } else {
    const nSeules = liste.filter(x => x.seul).length;
    console.log(c.dim(`── ${liste.length} commandes : ${nSeules} seule(s) d'abord, puis ${jobs} à la fois — sorties dans l'ordre de la liste`));
    const etat = { p: 0 };
    const ecrire = (i, r) => {
      console.log(c.dim(`\n── [${i + 1}/${liste.length}] ${r.cmd}   ${r.duree.toFixed(1)} s`));
      for (const [fd, b] of r.morceaux) (fd === 1 ? process.stdout : process.stderr).write(b);
    };
    const connues = lireDurees();
    ({ res, arrete } = await jouer(liste, { jobs, continuer: CONTINUER, executer: executerVrai, attendu: x => connues[x.cmd], surFin: (i, rr) => vider(rr, etat, ecrire, false) }));
    vider(res, etat, ecrire, true);
  }

  ecrireDurees(res);
  const joues = res.filter(Boolean), rouges = joues.filter(x => x.code !== 0);
  const s = ((Date.now() - debut) / 1000).toFixed(0);
  console.log('\n' + c.b('MA VIGNE — lanceur des contrôles') + c.dim(`  (${joues.length}/${liste.length} commandes, ${s} s, ${jobs} à la fois)`));
  const longs = joues.slice().sort((a, b) => b.duree - a.duree).slice(0, 5);
  if (longs.length) console.log(c.dim('  les plus longues : ' + longs.map(x => nomCourt(x.cmd) + ' ' + x.duree.toFixed(0) + ' s').join(' · ')));
  if (!rouges.length) { console.log(c.g(`✓ ${joues.length} commandes, 0 rouge`)); process.exit(0); }
  for (const x of rouges)
    console.log(c.r('  ✗ ' + x.cmd) + c.dim(`  (code ${x.code}${x.groupe ? ' · ' + GROUPES[x.groupe] : ''})`));
  if (arrete) {
    const i = res.findIndex(x => !x || x.code !== 0);
    console.log(c.dim(`  arrêt au premier rouge — ${liste.length - joues.length} commande(s) non jouée(s). Reprendre : node scripts/mv-lanceur.mjs --depuis ${decouper(liste[i].cmd)[0].replace('scripts/', '')}`));
  }
  process.exit(1);
}
