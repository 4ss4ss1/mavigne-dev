#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   BUILD-1 (§305) — HARNAIS DU LANCEUR EN PARALLÈLE
   Le lanceur (scripts/mv-lanceur.mjs) joue la liste à plusieurs commandes en même temps. Ce harnais
   prouve, sur le VRAI moteur (jouer + vider, découpés dans le texte du lanceur et joués dans un vm)
   avec un faux exécutant aux durées simulées :
     A. les sorties s'écrivent dans l'ORDRE DE LA LISTE, quel que soit l'ordre d'arrivée ;
     B. jamais plus de `jobs` commandes à la fois — et vraiment `jobs` quand il y a de quoi faire ;
     C. une commande SEULE ne croise jamais une autre, et toutes passent avant les autres ;
     D. au premier rouge (sans --continuer), plus rien ne démarre, et tout ce qui a démarré va au
        bout (on ne tue jamais : mv-harnais-cuvgr3 rend son fichier dans un `finally`) ;
     E. avec --continuer, tout est joué ;
     G. les plus longues d'abord quand leur durée est connue (inconnue = en tête), sorties toujours dans l'ordre ;
   puis, sur les VRAIS scripts de la liste :
     F. tout script qui écrit dans le dépôt est déclaré dans SEULS ou ECRIT_HORS_LISTE ; aucune
        entrée n'est périmée ; la liste ne passe jamais le drapeau qui fait écrire (--baseline,
        --engraver), et passe bien --check / --test là où il faut.
   ⚠️ F est un REPÉRAGE, pas une preuve : il lit les appels d'écriture (writeFileSync, renameSync…)
     et remonte la variable du chemin sur trois niveaux. Un chemin qui passe par os.tmpdir() ou
     mkdtemp est temporaire ; un chemin bâti sur la racine du dépôt (RACINE, R, ICI, root…) ou sur
     'src/', 'scripts/'… écrit dans le dépôt. Le reste n'est pas jugé.
   --contre : chaque défaut réintroduit doit faire rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { HARNAIS, SEULS, ECRIT_HORS_LISTE } from './mv-harnais-liste.mjs';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const LANCEUR = fs.readFileSync(path.join(R, 'scripts', 'mv-lanceur.mjs'), 'utf8');

function corps(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable dans mv-lanceur.mjs : ' + debut);
  const j = src.indexOf('{', src.indexOf(')', i)); let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  throw new Error('accolade non fermée : ' + debut);
}
function moteur(src) {
  const code = corps(src, 'export async function jouer(').replace(/^export /, '') + '\n'
             + corps(src, 'export function vider(').replace(/^export /, '');
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(code + '\nthis.jouer = jouer; this.vider = vider;', ctx);
  return ctx;
}

/* ── A à E : le moteur, sur un faux exécutant ─────────────────────────── */
async function simuler(m, spec, jobs, continuer, attendu) {
  const journal = [], actifs = new Set(); let max = 0;
  const liste = spec.map(x => ({ cmd: x.nom, seul: !!x.seul }));
  const executer = x => new Promise(res => {
    const s = spec.find(y => y.nom === x.cmd);
    actifs.add(x.cmd); max = Math.max(max, actifs.size);
    journal.push({ ev: 'debut', nom: x.cmd, n: actifs.size });
    setTimeout(() => { actifs.delete(x.cmd); journal.push({ ev: 'fin', nom: x.cmd }); res({ code: s.code, duree: s.ms / 1000 }); }, s.ms);
  });
  const ecrits = [], etat = { p: 0 };
  const r = await m.jouer(liste, { jobs, continuer, executer, attendu, surFin: (i, rr) => m.vider(rr, etat, k => ecrits.push(k), false) });
  m.vider(r.res, etat, k => ecrits.push(k), true);
  return Object.assign(r, { journal, max, ecrits, spec });
}
const MS = [40, 5, 30, 10, 25, 5, 15, 35, 5, 20, 10, 30];
const fabrique = (seuls, rouges) => MS.map((ms, i) => ({ nom: 'c' + i, ms, seul: seuls.includes(i), code: rouges.includes(i) ? 1 : 0 }));
const lances = r => r.res.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
function apresRouge(r) {          // une commande a-t-elle DÉMARRÉ après la fin du premier rouge ?
  const iFin = r.journal.findIndex(e => e.ev === 'fin' && r.spec.find(s => s.nom === e.nom).code !== 0);
  return iFin >= 0 && r.journal.slice(iFin + 1).some(e => e.ev === 'debut');
}
const toutFini = r => r.journal.filter(e => e.ev === 'debut').every(d => r.journal.some(e => e.ev === 'fin' && e.nom === d.nom));

async function verifierMoteur(src) {
  const t = [], ok = (nom, v) => t.push([nom, !!v]);
  let m; try { m = moteur(src); } catch (e) { return [['le moteur se découpe et se charge (' + e.message + ')', false]]; }
  const s1 = await simuler(m, fabrique([3, 7], []), 3, false);
  ok('A. sorties dans l’ordre de la liste (arrivées dans le désordre)', s1.ecrits.join() === MS.map((_, i) => i).join());
  ok('B. jamais plus de 3 à la fois, et 3 atteint', s1.max === 3);
  const seulsDebuts = s1.journal.filter(e => e.ev === 'debut' && ['c3', 'c7'].includes(e.nom));
  ok('C. une commande SEULE ne croise jamais une autre', seulsDebuts.length === 2 && seulsDebuts.every(e => e.n === 1));
  const dernFinSeule = Math.max(...['c3', 'c7'].map(n => s1.journal.findIndex(e => e.ev === 'fin' && e.nom === n)));
  const premDebAutre = s1.journal.findIndex(e => e.ev === 'debut' && !['c3', 'c7'].includes(e.nom));
  ok('C. les SEULES passent toutes avant les autres', dernFinSeule >= 0 && dernFinSeule < premDebAutre);
  ok('tout vert : tout est joué, pas d’arrêt', lances(s1).length === MS.length && !s1.arrete);
  const s2 = await simuler(m, fabrique([], [1]), 2, false);
  ok('D. au premier rouge, plus rien ne démarre', !apresRouge(s2) && s2.arrete && lances(s2).length < MS.length);
  ok('D. ce qui a démarré va au bout (rien n’est tué)', toutFini(s2));
  ok('A. arrêt : on écrit, dans l’ordre, exactement ce qui a été joué', s2.ecrits.join() === lances(s2).join());
  const s3 = await simuler(m, fabrique([], [1]), 2, true);
  ok('E. --continuer joue tout', lances(s3).length === MS.length && !s3.arrete);
  const s4 = await simuler(m, fabrique([5, 9], []), 1, false);
  const ordre4 = s4.journal.filter(e => e.ev === 'debut').map(e => +e.nom.slice(1));
  ok('jobs = 1 : une à la fois, les seules puis la liste dans l’ordre', s4.max === 1 && ordre4.join() === [5, 9, 0, 1, 2, 3, 4, 6, 7, 8, 10, 11].join());
  const s5 = await simuler(m, fabrique([2, 6], [2]), 3, false);
  ok('D. une SEULE en rouge : rien d’autre ne démarre', s5.journal.filter(e => e.ev === 'debut').length === 1 && s5.arrete);
  const connu = { c11: 90, c4: 80, c0: 1, c1: 1, c2: 1, c3: 1, c5: 1, c6: 1, c7: 1, c8: 1, c9: 1 };   // c10 : inconnue
  const s6 = await simuler(m, fabrique([], []), 2, false, x => connu[x.cmd]);
  const premiers = s6.journal.filter(e => e.ev === 'debut').slice(0, 3).map(e => e.nom);
  ok('G. les plus longues d’abord (durée connue), l’inconnue en tête', premiers.join() === 'c10,c11,c4');
  ok('G. … et les sorties restent dans l’ordre de la liste', s6.ecrits.join() === MS.map((_, i) => i).join());
  return t;
}

/* ── F : les vrais scripts de la liste ────────────────────────────────── */
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const ECRIT = /\b(writeFileSync|appendFileSync|renameSync|copyFileSync|cpSync|createWriteStream|writeFile)\s*\(/g;
const TEMP = /tmpdir|mkdtemp/;
const DEPOT = /\b(RACINE|ROOT|root|R|ICI|B|__dirname)\b|process\.cwd\(\)|['"`](?:\.\/)?(?:src|scripts|public|guide|docs|dist|lots)\/|['"`](?:index\.html|CLAUDE\.md|gt\.html)['"`]/;
const COMMUNS = new Set(['path', 'join', 'fs', 'os', 'process', 'String', 'JSON', 'Math', 'Date', 'replace', 'slice', 'pid', 'random', 'toString', 'resolve', 'dirname', 'tmpdir', 'mkdtempSync']);
function lesArgs(s, i) {           // textes des deux premiers arguments d'un appel, depuis la parenthèse ouvrante
  const a = []; let d = 0, k = i, debut = i;
  for (; k < s.length && a.length < 2; k++) {
    const ch = s[k];
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) { if (d === 0) { a.push(s.slice(debut, k)); break; } d--; }
    else if (ch === ',' && d === 0) { a.push(s.slice(debut, k)); debut = k + 1; }
  }
  return a;
}
function remonter(s, expr, avant, niveaux) {
  let texte = expr;
  if (niveaux <= 0) return texte;
  for (const id of new Set(expr.match(/[A-Za-z_$][\w$]*/g) || [])) {
    if (COMMUNS.has(id)) continue;
    const re = new RegExp('(?:const|let|var)\\s+' + id.replace(/\$/g, '\\$') + '\\s*=\\s*([^;\\n]+)', 'g');
    let def = null, m;
    while ((m = re.exec(s)) && m.index < avant) def = m;
    if (def) texte += ' ' + remonter(s, def[1], def.index, niveaux - 1);
  }
  return texte;
}
export function ecritDansLeDepot(texte) {
  const s = sansCom(texte); let m; ECRIT.lastIndex = 0;
  while ((m = ECRIT.exec(s))) {
    // La cible : le 1er argument (writeFileSync…) ; le 2e pour une copie (la source est LUE) ; les deux pour un
    // renommage (la source quitte sa place). Repéré à la mise en service : icones-contre copie DEPUIS le dépôt.
    const [a1 = '', a2 = ''] = lesArgs(s, m.index + m[0].length);
    const cibles = /^(copyFileSync|cpSync)$/.test(m[1]) ? [a2] : m[1] === 'renameSync' ? [a1, a2] : [a1];
    for (const cible of cibles) {
      const t = remonter(s, cible, m.index, 3);
      if (!TEMP.test(t) && DEPOT.test(t)) return true;
    }
  }
  return false;
}
function verifierDepot(e) {
  const t = [], ok = (nom, v, detail) => t.push([nom + (v ? '' : (detail ? '  ← ' + detail : '')), !!v]);
  const scripts = [...new Set(e.harnais.map(([cmd]) => cmd.split(' ')[1]))];
  const D = scripts.filter(f => ecritDansLeDepot(e.lire(f)));
  const declares = new Set([...Object.keys(e.seuls), ...Object.keys(e.hors)]);
  const nonDeclares = D.filter(f => !declares.has(f));
  ok('F. tout script qui écrit dans le dépôt est déclaré (SEULS ou ECRIT_HORS_LISTE)', !nonDeclares.length, nonDeclares.join(', '));
  const perimes = [...declares].filter(f => !scripts.includes(f) || !D.includes(f));
  ok('F. aucune entrée périmée (hors liste, ou plus aucune écriture repérée)', !perimes.length, perimes.join(', '));
  const lesDeux = Object.keys(e.seuls).filter(f => f in e.hors);
  ok('F. aucun script n’est à la fois SEUL et ECRIT_HORS_LISTE', !lesDeux.length, lesDeux.join(', '));
  const fautes = [];
  for (const [f, drap] of Object.entries(e.hors)) {
    const cmds = e.harnais.map(([cmd]) => cmd.split(' ')).filter(a => a[1] === f);
    const m = /^sans (--[\w-]+)$/.exec(drap);
    if (m) { if (cmds.some(a => a[2] !== m[1])) fautes.push(f + ' joué sans ' + m[1]); }
    else if (cmds.some(a => a[2] === drap)) fautes.push(f + ' joué avec ' + drap);
  }
  ok('F. la liste ne passe jamais le drapeau qui fait écrire', !fautes.length, fautes.join(' · '));
  return t;
}
const lireVrai = f => fs.readFileSync(path.join(R, f), 'utf8');
const ETAT = { harnais: HARNAIS, seuls: SEULS, hors: ECRIT_HORS_LISTE, lire: lireVrai };

async function tout(src, etat) { return [...await verifierMoteur(src), ...verifierDepot(etat)]; }

const base = await tout(LANCEUR, ETAT);
console.log('\n  MA VIGNE — Harnais du LANCEUR EN PARALLÈLE (BUILD-1)');
base.forEach(([n, v]) => console.log('  ' + (v ? '\u2713 ' : '\u2717 ') + n));
const ko = base.filter(([, v]) => !v).length;
console.log(`\n  ${base.length - ko} vert(s) · ${ko} rouge(s)`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);

const remplace = (src, de, vers) => { if (src.split(de).length !== 2) throw new Error('motif introuvable ou multiple : ' + de); return src.replace(de, vers); };
const FAUX = 'scripts/mv-harnais-faux-ecrivain.mjs';
const DEF = [
  ['plus de `jobs` commandes à la fois', () => [remplace(LANCEUR, 'Math.max(1, Math.min(jobs, autres.length))', 'autres.length'), ETAT]],
  ['les SEULES jouées au milieu des autres', () => [remplace(remplace(LANCEUR, 'if (!liste[i].seul) continue;', 'continue;'), '.filter(i => !liste[i].seul)', '.filter(i => true)'), ETAT]],
  ['au premier rouge, ça continue de démarrer', () => [remplace(LANCEUR, 'if (rouge && !continuer) return;', ''), ETAT]],
  ['une SEULE en rouge n’arrête pas les suivantes', () => [remplace(LANCEUR, 'if (rouge && !continuer) break;', ''), ETAT]],
  ['les durées connues ne changent plus l’ordre de lancement', () => [remplace(LANCEUR, 'if (attendu) {', 'if (false) {'), ETAT]],
  ['l’affichage saute les commandes pas encore arrivées', () => [remplace(LANCEUR, '(res[etat.p] || fin)', 'true'), ETAT]],
  ['cuvgr3 retiré de SEULS', () => { const s = Object.assign({}, SEULS); delete s['scripts/mv-harnais-cuvgr3.mjs']; return [LANCEUR, Object.assign({}, ETAT, { seuls: s })]; }],
  ['un nouveau harnais écrit dans src/ sans être déclaré', () => [LANCEUR, Object.assign({}, ETAT, {
    harnais: HARNAIS.concat([['node ' + FAUX]]),
    lire: f => (f === FAUX ? "import fs from 'fs';\nfs.write" + "FileSync(path.join(RACINE, 'src', 'x.js'), '');\n" : lireVrai(f)) })]],
  ['une entrée SEULS périmée', () => [LANCEUR, Object.assign({}, ETAT, { seuls: Object.assign({ 'scripts/mv-harnais-disparu.mjs': 'x' }, SEULS) })]],
  ['la liste fait réécrire guide.html (build-guide sans --check)', () => [LANCEUR, Object.assign({}, ETAT, {
    harnais: HARNAIS.map(([c, g]) => [c === 'node scripts/build-guide.mjs --check' ? 'node scripts/build-guide.mjs' : c, g]) })]],
  ['la liste regrave le cliquet du preflight (--baseline)', () => [LANCEUR, Object.assign({}, ETAT, { harnais: HARNAIS.concat([['node scripts/preflight.mjs --baseline']]) })]],
];
console.log('\n  CONTRE-ÉPREUVE — chaque défaut réintroduit doit faire rougir');
let rg = 0;
for (const [nom, f] of DEF) {
  let rouge;
  try { const [src, etat] = f(); rouge = (await tout(src, etat)).some(([, v]) => !v); }
  catch (e) { console.log('    ?        ' + nom + ' — ' + e.message); continue; }
  if (rouge) rg++;
  console.log((rouge ? '    DÉTECTÉ  ' : '    MANQUÉ   ') + nom);
}
console.log(`\n  ${rg}/${DEF.length} défauts détectés`);
process.exit(rg === DEF.length ? 0 : 1);
