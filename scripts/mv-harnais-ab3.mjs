/* ───────────────────────────────────────────────────────
   HARNAIS — FRISE-AB3 (§617) : UN MODÈLE QUI ALTERNE SE REPORTE PAR SEMAINE SUR L'ANNÉE D'APRÈS
   Lancer :          node scripts/mv-harnais-ab3.mjs
   Contre-épreuves : node scripts/mv-harnais-ab3.mjs --contre

   POURQUOI IL EXISTE
   « Préparer 2027 », « Partir de 2026 », une année sans modèle qui lit celui d'avant : tous passent par _planRecale, qui place
   chaque jour au même jour de semaine et au même rang dans le mois (§559). Pour un modèle qui alterne (un vendredi sur deux),
   l'alternance basculait à certains changements de mois — elle compte les semaines de l'année (§616e). Nico (26/11) : un
   vendredi sur deux, c'est de janvier à décembre, et l'année d'après continue la précédente. Ce harnais joue le VRAI report
   (_planRecale, avec la VRAIE lecture de la frise exposée comme dans l'appli) et tient :
     ① un vendredi sur deux toute l'année, fériés chômés : 2027 et 2028 (reporté de 2027) sont l'alternance continuée, jour pour
        jour hors fériés ; janvier continue décembre ; rien à poser ; une seule saison A / B, aucun jour à part ;
     ② une saison A / B d'avril à septembre, l'hiver sans alternance, la semaine des vendanges : 3 saisons et 1 semaine à part en
        2027 comme en 2026 ; la saison commence toujours le 1er avril ou son lundi ;
     ③ un modèle SANS alternance (la grille intégrée) se reporte exactement comme avant, au rang dans le mois ;
     ④ la prise de poste d'un jour et le nom d'une saison suivent le même report ;
     ⑤ sans la lecture de la frise (un module pas chargé), le report d'avant.
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
function monter(S, frise = true) {
  const i0 = S.pl.indexOf('var PLAN_DEF = {'), j0 = S.pl.indexOf('};', i0);
  const ctx = vm.createContext({ window: {}, _MV_FERIES_CACHE: {}, console, PLAN_DEF: vm.runInNewContext('(' + S.pl.slice(i0 + 15, j0 + 1) + ')') });
  vm.runInContext(['_mvEasterMD', '_feriesY', '_planRecaleMap', '_planRecaleAlterne', '_planRecaleSemaines', '_planRecale'].map((n) => fonction(S.pl, n))
    .concat(['_planAnneeSaison', '_planAnneeLire', '_planAnneeNomsIx', '_planAnneeNoms'].map((n) => fonction(S.an, n))).join('\n')
    + (frise ? '\nwindow._planAnneeLire=_planAnneeLire;' : '') + '\nthis.f={R:_planRecale,L:_planAnneeLire,N:_planAnneeNoms,F:_feriesY};', ctx);
  return { F: ctx.f, DEF: ctx.PLAN_DEF };
}
const resume = (A) => A.saisons.map((s) => (s.m0 + 1) + '→' + (s.m1 + 1) + (s.ab ? ' A/B' : '')).join(' · ');

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const { F, DEF } = monter(S);
  // toute l'année : lundi-jeudi 8 h, un vendredi sur deux 5 h (le compte k continue d'une année à l'autre), fériés chômés
  const annee = (yr, k0) => { const g = {}, FE = F.F(yr); let k = k0;
    for (let d = new Date(yr, 0, 1); d.getFullYear() === yr; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), dd = d.getDate(), wd = d.getDay(); if (!g[m]) g[m] = {};
      let v = 0; if (wd >= 1 && wd <= 4) v = 8; if (wd === 5) { v = k % 2 === 1 ? 5 : 0; k++; } if (FE[m] && FE[m][dd]) v = 0; if (v) g[m][dd] = v; }
    return { g, k }; };
  const ecarts = (a, b, yr) => { const FE = F.F(yr), e = []; for (let m = 0; m < 12; m++) for (let d = 1; d <= new Date(yr, m + 1, 0).getDate(); d++) { const x = (a[m] || {})[d] || 0, y = (b[m] || {})[d] || 0; if (x !== y && !(FE[m] && FE[m][d])) e.push(d + '/' + (m + 1) + ':' + x + '≠' + y); } return e; };
  essai('① un vendredi sur deux toute l’année : 2027 puis 2028 continuent l’alternance jour pour jour (hors fériés), janvier suit décembre, rien à poser, une saison A / B, aucun jour à part', () => {
    const a26 = annee(2026, 0), a27 = annee(2027, a26.k), a28 = annee(2028, a27.k);
    const r27 = F.R(a26.g, 2026, 2027), r28 = F.R(r27.g, 2027, 2028), e27 = ecarts(r27.g, a27.g, 2027), e28 = ecarts(r28.g, a28.g, 2028);
    const A = F.L('', 2027, r27.g), B = F.L('', 2028, r28.g);
    return [!e27.length && !e28.length && !r27.perdus.length && !r27.vides.length && !r28.vides.length && resume(A) === '1→12 A/B' && !A.jours.length && resume(B) === '1→12 A/B' && !B.jours.length,
      '2027 : ' + e27.slice(0, 6).join(' ') + ' | 2028 : ' + e28.slice(0, 6).join(' ') + ' | ' + resume(A) + ' j' + A.jours.length + ' | à poser ' + (r27.perdus.length + r27.vides.length)];
  });
  // une saison A / B d'avril à septembre (lundi-jeudi 8 h, un vendredi sur deux 5 h), l'hiver 7, 7, 7, 7, 4, les vendanges (lundi 7 → dimanche 13 septembre 2026)
  const saisons = () => { const g = {}, FE = F.F(2026); let w = 0;
    for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), dd = d.getDate(), wd = (d.getDay() + 6) % 7; if (wd === 0 && !(m === 0 && dd === 1)) w++; if (!g[m]) g[m] = {};
      let v = (m >= 3 && m <= 8) ? [8, 8, 8, 8, w % 2 ? 5 : 0, 0, 0][wd] : [7, 7, 7, 7, 4, 0, 0][wd]; if (m === 8 && dd >= 7 && dd <= 13) v = [8.5, 8.5, 8.5, 8.5, 8.5, 4, 0][wd]; if (FE[m] && FE[m][dd]) v = 0; if (v) g[m][dd] = v; }
    return g; };
  essai('② une saison A / B d’avril à septembre, l’hiver, les vendanges : 2027 a 3 saisons, 1 semaine à part (un lundi → un dimanche), aucun jour à part ; la saison A / B commence le 1er avril', () => {
    const G = saisons(), A0 = F.L('', 2026, G), R = F.R(G, 2026, 2027), A = F.L('', 2027, R.g), ap = A.sem.filter((s) => s.apart);
    const x = A.J.find((y) => y.s === 1 && !y.ferme && !y.apart);
    return [resume(A0) === '1→3 · 4→9 A/B · 10→12' && resume(A) === resume(A0) && ap.length === 1 && ap[0].j[0].g === 0 && ap[0].j[0].m === 8 && !A.jours.length && x.m === 3 && x.d === 1,
      resume(A0) + ' → ' + resume(A) + ' | à part ' + ap.length + (ap[0] ? ' dès le ' + ap[0].j[0].d + '/' + (ap[0].j[0].m + 1) : '') + ' | jours à part ' + A.jours.map((y) => y.d + '/' + (y.m + 1)).join(',')];
  });
  essai('③ un modèle sans alternance (la grille intégrée) se reporte exactement comme avant, au rang dans le mois — 2027 et 2028', () => {
    const sans = monter(S, false).F, r = [];
    for (const k of Object.keys(DEF)) for (const an of [2027, 2028]) { const a = JSON.stringify(F.R(DEF[k], 2026, an)), b = JSON.stringify(sans.R(DEF[k], 2026, an)); r.push(k + '/' + an + (a === b ? ' =' : ' ≠')); }
    return [r.length >= 2 && r.every((x) => x.endsWith('=')), r.join(' ')];
  });
  essai('④ la prise de poste d’un jour et le nom d’une saison suivent le même report que les heures (le lundi 8 juin 2026 → le lundi 7 juin 2027)', () => {
    // le lundi 8 juin 2026 : 52 semaines plus tard, le lundi 7 juin 2027 (au rang dans le mois, le 14 — une semaine plus loin)
    const G = saisons(); G._timings_jour = { 5: { 8: { d: '06:30' } } }; G._noms = { '3-1': 'Travaux en vert', '8-7': 'Vendanges', '5-8': 'Repère' };
    const R = F.R(G, 2026, 2027), A = F.L('', 2027, R.g), N = F.N(A, R.g), w = A.sem.findIndex((s) => s.apart);
    return [JSON.stringify(R.g._timings_jour[5]) === '{"7":{"d":"06:30"}}' && R.g._noms['5-7'] === 'Repère' && R.g[5][7] === G[5][8] && N.s[1] === 'Travaux en vert' && N.w[w] === 'Vendanges', JSON.stringify(R.g._timings_jour) + ' ' + JSON.stringify(R.g._noms) + ' ' + JSON.stringify(N.s) + JSON.stringify(N.w)];
  });
  essai('⑤ sans la lecture de la frise (un module pas encore chargé), le report d’avant — au rang dans le mois', () => {
    const sans = monter(S, false).F, G = annee(2026, 0).g, a = sans.R(G, 2026, 2027), FE = F.F(2027);
    return [a.vides.length > 0 || a.perdus.length > 0, 'à poser ' + (a.perdus.length + a.vides.length)];
  });
  return out;
}

if (!CONTRE) {
  console.log('\n── FRISE-AB3 — un modèle qui alterne se reporte par semaine sur l’année d’après\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['un modèle qui alterne se reporte au rang dans le mois (le report d’avant)', sur('pl', "var SEM=_planRecaleAlterne(grille,anSrc)?", "var SEM=false?")],
    ['52 semaines deviennent 53 (A devient B)', sur('pl', "W=14*Math.round(D/14)", "W=7*(2*Math.round(D/14)+1)")],
    ['un jour d’un autre mois est pris', sur('pl', "c.getFullYear()===anSrc&&c.getMonth()===tm&&", "c.getFullYear()===anSrc&&")],
    ['un férié de l’année d’avant donne ses heures', sur('pl', "&&!(F[tm]&&F[tm][c.getDate()]))sd=c.getDate();", ")sd=c.getDate();")],
    ['tout modèle se reporte par semaine', sur('pl', "return !!(A&&A.saisons&&A.saisons.some(function(x){return x.ab;}));", "return !!A;")],
    ['la prise de poste d’un jour garde le rang dans le mois', sur('pl', "if(SEM)Object.keys(SEM.src[mm])", "if(false)Object.keys(SEM.src[mm])")],
    ['le nom garde le rang dans le mois', sur('pl', "(mps[mm]=SEM?SEM.inv[mm]:_planRecaleMap(", "(mps[mm]=false?SEM.inv[mm]:_planRecaleMap(")],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
