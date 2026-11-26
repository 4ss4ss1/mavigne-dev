/* ───────────────────────────────────────────────────────
   HARNAIS — FRISE-AB2 (§616) : UN MOIS QUI N'A PAS DE QUOI LIRE L'ALTERNANCE A / B LA SUIT CHEZ SON VOISIN
   Lancer :          node scripts/mv-harnais-ab2.mjs
   Contre-épreuves : node scripts/mv-harnais-ab2.mjs --contre

   POURQUOI IL EXISTE
   La frise lit l'alternance A / B d'un mois dans ses semaines paires et impaires, deux de chaque sans exception (§551). Les
   fériés d'un mois peuvent les manger (mai 2026 : les vendredis 1er et 8 ; juillet 2028 : le 14), une semaine à part les casse
   (les vendanges à 8 h 30) : le mois faisait sa saison, entre deux morceaux de la sienne (§614e) — et le nom d'une saison
   (ANNEE-4) n'allait qu'au premier morceau. Ce harnais joue la VRAIE lecture (_planAnneeLire) et tient :
     ① une saison avril → septembre « un vendredi sur deux » reste d'un bloc, en 2026, 2027 et 2028, semaine A paire ou impaire ;
     ② un lundi sur deux (le lundi de Pâques, celui de Pentecôte) aussi ;
     ③ la semaine des vendanges reste une semaine à part, sa saison d'un bloc ; un pont reste un jour à part ;
     ④ un mois qui ne suit PAS l'alternance garde sa saison : tous ses vendredis pareils, ou un autre horaire ;
     ⑤ une saison qui commence au milieu d'un mois garde sa coupe ; la grille intégrée (sans alternance) ne change pas ;
     ⑥ le nom de la saison va à toute la saison.
   Hors de ce harnais, vu en route : le report d'un modèle A / B sur l'année d'après (_planRecale, au rang dans le mois) fait
   basculer la phase de l'alternance d'un mois à l'autre (§616e).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pl: lire('src/planning.js'), an: lire('src/planning-annee.js') };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
function monter(S) {
  const i0 = S.pl.indexOf('var PLAN_DEF = {'), j0 = S.pl.indexOf('};', i0);
  const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {}, console, PLAN_DEF: vm.runInNewContext('(' + S.pl.slice(i0 + 15, j0 + 1) + ')') });
  vm.runInContext([fonction(S.pl, '_mvEasterMD'), fonction(S.pl, '_feriesY'), ].concat(
    ['_planAnneeSaison', '_planAnneeLire', '_planAnneeNomsIx', '_planAnneeNoms'].map((n) => fonction(S.an, n))).join('\n')
    + '\nthis.f={_planAnneeLire:_planAnneeLire,_planAnneeNoms:_planAnneeNoms};', ctx);
  return { F: ctx.f, DEF: ctx.PLAN_DEF };
}
// un modèle : avril → septembre, lundi-jeudi 8 h et un vendredi sur deux 5 h ; le reste de l'année 7, 7, 7, 7, 4
function grille(yr, o = {}) { const g = {}; let w = 0;
  for (let d = new Date(yr, 0, 1); d.getFullYear() === yr; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), dd = d.getDate(), wd = (d.getDay() + 6) % 7; if (wd === 0 && !(m === 0 && dd === 1)) w++;
    if (!g[m]) g[m] = {}; let v;
    const ete = o.ete || [8, 8, 8, 8, 5, 0, 0], g0 = o.jour == null ? 4 : o.jour;
    if (m >= 3 && m <= 8) { v = ete[wd]; if (wd === g0 && w % 2 !== (o.pair || 0)) v = 0; } else v = [7, 7, 7, 7, 4, 0, 0][wd];
    if (o.modif) v = o.modif(m, dd, wd, w, v);
    if (v) g[m][dd] = v; }
  return g; }
const resume = (A) => A.saisons.map((s) => (s.m0 + 1) + '→' + (s.m1 + 1) + (s.ab ? ' A/B' : '')).join(' · ');
const BLOC = '1→3 · 4→9 A/B · 10→12';

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const { F, DEF } = monter(S);
  essai('① un vendredi sur deux, avril → septembre : une seule saison A / B, sans jour à part — 2026 (mai : vendredis 1er et 8 fériés), 2027, 2028 (le 14 juillet), A paire ou impaire', () => {
    const r = []; let ok = true;
    for (const yr of [2026, 2027, 2028]) for (const pair of [0, 1]) { const A = F._planAnneeLire('x', yr, grille(yr, { pair })); r.push(yr + '/' + pair + ' ' + resume(A) + ' j' + A.jours.length); if (resume(A) !== BLOC || A.jours.length) ok = false; }
    return [ok, r.join(' ; ')];
  });
  essai('② un lundi sur deux (le lundi de Pâques, celui de Pentecôte, fériés) : une seule saison A / B', () => {
    const r = []; let ok = true;
    for (const yr of [2026, 2027, 2028]) { const A = F._planAnneeLire('x', yr, grille(yr, { jour: 0, ete: [8, 8, 8, 8, 8, 0, 0] })); r.push(yr + ' ' + resume(A)); if (resume(A) !== BLOC) ok = false; }
    return [ok, r.join(' ; ')];
  });
  essai('③ la semaine des vendanges (8 h 30) reste une semaine à part, sa saison d’un bloc ; un pont (un vendredi de mai 2026 à 5 h, libéré) reste un jour à part', () => {
    const A = F._planAnneeLire('x', 2027, grille(2027, { modif: (m, dd, wd, w, v) => (m === 8 && dd >= 6 && dd <= 12) ? [8.5, 8.5, 8.5, 8.5, 8.5, 4, 0][wd] : v }));
    const ap = A.sem.filter((s) => s.apart);
    const g0 = grille(2026, { pair: 1 }), vf = Object.keys(g0[4]).map(Number).filter((d) => d > 8 && new Date(2026, 4, d).getDay() === 5 && g0[4][d] === 5)[0];   // le premier vendredi de mai à 5 h (le 1er et le 8 sont fériés)
    const B = F._planAnneeLire('x', 2026, grille(2026, { pair: 1, modif: (m, dd, wd, w, v) => (m === 4 && dd === vf) ? 0 : v }));   // les vendredis 15, 22, 29 : 5, 0, 5 → 0, 0, 5
    const pont = B.jours.map((x) => (x.d + '/' + (x.m + 1)));
    return [resume(A) === BLOC && ap.length === 1 && ap[0].j[0].d === 6 && resume(B) === BLOC && pont.join() === vf + '/5', resume(A) + ' | ' + ap.length + ' à part | ' + resume(B) + ' | ' + pont.join()];
  });
  essai('④ un mois qui ne suit pas l’alternance garde sa saison : mai aux vendredis tous à 5 h, ou tous libres, ou à 7 h du lundi au jeudi', () => {
    const r = [];
    const a = F._planAnneeLire('x', 2026, grille(2026, { modif: (m, dd, wd, w, v) => (m === 4 && wd === 4) ? 5 : v }));
    const b = F._planAnneeLire('x', 2026, grille(2026, { modif: (m, dd, wd, w, v) => (m === 4 && wd === 4) ? 0 : v }));
    const c = F._planAnneeLire('x', 2026, grille(2026, { modif: (m, dd, wd, w, v) => (m === 4 && wd < 4) ? 7 : v }));
    r.push(resume(a), resume(b), resume(c));
    const mai = (A) => A.saisons.find((s) => s.m0 === 4 && s.m1 === 4);
    return [mai(a) && !mai(a).ab && mai(b) && !mai(b).ab && mai(c) && !mai(c).ab, r.join(' ; ')];
  });
  essai('⑤ une saison A / B qui commence le lundi 13 avril 2026 garde sa coupe (le début de mai la suit) ; la grille intégrée n’a toujours aucune alternance', () => {
    const A = F._planAnneeLire('x', 2026, grille(2026, { modif: (m, dd, wd, w, v) => (m === 3 && dd < 13) ? [7, 7, 7, 7, 4, 0, 0][wd] : v }));
    const x = A.J.find((y) => y.m === 3 && y.d === 13), y = A.J.find((z) => z.m === 3 && z.d === 10), z = A.J.find((q) => q.m === 4 && q.d === 15);
    const S = A.saisons[x.s];
    const st = ['standard', 'nico'].filter((k) => DEF[k]).map((k) => F._planAnneeLire(k, 2026, DEF[k]));
    return [S && S.ab && y.s !== x.s && z.s === x.s && st.length >= 1 && st.every((B) => B.saisons.every((s) => !s.ab)), resume(A) + ' | début ' + A.J.find((q) => q.s === x.s && !q.ferme).d + '/' + (A.J.find((q) => q.s === x.s && !q.ferme).m + 1)];
  });
  essai('⑥ le nom de la saison (ANNEE-4) va à toute la saison, mai compris', () => {
    const G = grille(2026); G._noms = { '3-1': 'Travaux en vert' }; const A = F._planAnneeLire('x', 2026, G), N = F._planAnneeNoms(A, G);
    const x = A.J.find((y) => y.m === 4 && y.d === 20), si = x.s;
    const y = A.J.find((q) => q.m === 8 && q.d === 30);
    return [N.s[si] === 'Travaux en vert' && y.s === si && A.saisons.length === 3, JSON.stringify(N.s)];
  });
  return out;
}

if (!CONTRE) {
  console.log('\n── FRISE-AB2 — un mois sans de quoi lire l’alternance la suit chez son voisin\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['un mois ne suit plus son voisin (la lecture d’avant)', sur('an', "if(nb>=0){type[mm]=type[nb].slice();", "if(false){type[mm]=type[nb].slice();")],
    ['un mois suit son voisin même s’il suit mieux sa propre semaine', sur('an', "&&o.v<=pr.v&&", "&&")],
    ['une semaine à part empêche de suivre', sur('an', "if(o.ap<=1&&o.n<=2", "if(o.ap<=0&&o.n<=2")],
    ['un jour à part empêche de suivre', sur('an', "if(o.ap<=1&&o.n<=2", "if(o.ap<=1&&o.n<=0")],
    ['les semaines paires et impaires inversées', sur('an', "if(x.h!==((TB&&x.w%2===1)?TB:T)[x.g])pw[x.w]++;", "if(x.h!==((TB&&x.w%2===0)?TB:T)[x.g])pw[x.w]++;")],
    ['un seul tour (le mois suivi doit déjà alterner seul)', sur('an', "for(var tour=0,chg=true;chg&&tour<12;tour++){chg=false;", "for(var tour=0,chg=true;chg&&tour<1;tour++){chg=false;")],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
