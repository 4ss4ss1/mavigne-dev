#!/usr/bin/env node
// ── Cliquet de vocabulaire ──────────────────────────────────────────────────
// Trois nombres du planning se ressemblent et ne veulent pas dire la meme chose :
// la PRESENCE (arrivee → depart), la COUPURE (non travaillee, decidee par le
// domaine), les HEURES DUES (ce qui part en paie et alimente les 1607 h).
// Un ouvrier, un gerant et un RH ne lisent pas le meme nombre. Le mot « pause »
// designe en droit un DROIT du salarie (20 min apres 6 h) : l'employer pour la
// coupure dejeuner fait croire au salarie qu'il en choisit le moment.
//
// Ce controle empeche le mot de revenir. Il ne deploie rien et ne corrige rien :
// il echoue si le plafond est depasse, comme lint-cliquet.
import { readFileSync } from 'fs';

const CIBLES = ['src/planning.js', 'src/reglages.js', 'index.html'];
// Plafond documente : occurrences legitimes du mot, ou il designe bien la pause
// legale ou une cle de configuration historique qu'on ne renomme pas a la volee.
// Plafond a ZERO partout : la bascule est complete, aucune occurrence legitime
// ne subsiste. Toute reapparition est une regression.
const PLAFOND = { 'src/planning.js': 0, 'src/reglages.js': 0, 'index.html': 0 };
const INTERDIT = /pause\s*(d[ée]jeuner|d&eacute;jeuner|d\\u00e9jeuner)/gi;

let total = 0, fautes = [];
for (const f of CIBLES) {
  let src;
  try { src = readFileSync(f, 'utf8'); }
  catch { console.log(`  – ${f} : absent, ignore`); continue; }
  const lignes = src.split('\n');
  let n = 0;
  lignes.forEach((l, i) => {
    const m = l.match(INTERDIT);
    if (m) { n += m.length; fautes.push(`${f}:${i + 1}  ${l.trim().slice(0, 90)}`); }
  });
  const max = PLAFOND[f] ?? 0;
  const etat = n > max ? 'DEPASSE' : 'ok';
  console.log(`  ${etat === 'ok' ? '✓' : '✗'} ${f} : ${n} occurrence(s), plafond ${max}`);
  if (n > max) total += n - max;
}
if (total > 0) {
  console.log('\n« pause dejeuner » a reapparu. Le terme attendu est « coupure dejeuner ».');
  console.log('Si l\'occurrence est legitime (vraie pause legale), relevez le plafond');
  console.log('dans scripts/lint-vocabulaire.mjs en expliquant pourquoi.\n');
  fautes.slice(0, 12).forEach(l => console.log('   ' + l));
  process.exit(1);
}
console.log('\n✓ Vocabulaire du planning : presence / coupure / heures dues.');
