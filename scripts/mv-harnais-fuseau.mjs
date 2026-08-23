#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : LES DATES SOUS CINQ FUSEAUX
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE (23/08/2026).
//  `_mvJourApres` faisait :
//        Date.parse(iso + 'T00:00:00')        ← lu en heure LOCALE
//        new Date(t + 86400000).toISOString() ← reserialise en UTC
//  A Paris, minuit local vaut 22 h (ete) ou 23 h (hiver) la VEILLE en UTC :
//  ajouter 24 h retombe sur le MEME JOUR. `_mvJourApres('2026-06-30')` rendait
//  '2026-06-30'. Consequence : `_mvContrats` ne fusionnait plus jamais deux
//  contrats contigus, et le releve d'heures perdait son contexte de contrat.
//
//  ⚠️⚠️⚠️ LE BAC A SABLE DE CLAUDE TOURNE EN UTC. C'est le SEUL fuseau au monde
//  ou ce code etait juste. Aucun essai de mon cote ne pouvait l'attraper — il a
//  fallu que Nico lance le harnais sur sa machine. Comme pour Windows (§53, §55n),
//  la parade n'est pas « faire attention » : c'est un filet qui MESURE.
//
//  LA REGLE TENUE ICI, et elle est generale :
//    ★ une fonction qui manipule des dates-calendrier doit rendre EXACTEMENT le
//      meme resultat sous n'importe quel fuseau. Si le resultat bouge, la
//      fonction melange deux horloges.
//  Le harnais se relance lui-meme en fils, un par fuseau, et compare.
//
//  Usage :
//    node scripts/mv-harnais-fuseau.mjs            # les tests
//    node scripts/mv-harnais-fuseau.mjs --contre   # + les contre-epreuves
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const args   = process.argv.slice(2);
const CONTRE = args.includes('--contre');
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'utils.js'));

/* Cinq fuseaux : de part et d'autre de Greenwich, avec et sans heure d'ete.
   ⚠️ UTC EST VOLONTAIREMENT DANS LA LISTE, mais il ne prouve rien seul — c'est
   justement celui qui rendait le defaut invisible. Il sert de temoin. */
const FUSEAUX = [
  'UTC',                  //  0     temoin (le bac a sable)
  'Europe/Paris',         // +1/+2  MG, Chapelle, Garraud — tous les clients
  'Pacific/Auckland',     // +12/13 le plus a l'est
  'America/Los_Angeles',  //  -7/-8 a l'ouest : le defaut symetrique
  'Asia/Kolkata'          // +5:30  decalage non entier
];

// ── Le mode FILS : execute les mesures et rend du JSON ──────────────────────
if (args.includes('--mesure')) {
  const src = fs.readFileSync(CIBLE, 'utf8');
  const bloc = (nom) => {
    const i = src.indexOf('window.' + nom + ' = function');
    if (i < 0) return null;
    // Jusqu'a la ligne « }; » en colonne 0 qui suit.
    const j = src.indexOf('\n};', i);
    return j < 0 ? null : src.slice(i, j + 3);
  };
  const jourApres = bloc('_mvJourApres');
  if (!jourApres) { console.log(JSON.stringify({ erreur: '_mvJourApres introuvable' })); process.exit(0); }

  const win = {};
  // eslint-disable-next-line no-new-func
  new Function('window', jourApres)(win);

  /* La fusion de _mvContrats, rejouee a l'identique : c'est SA ligne de
     contiguite qui consommait _mvJourApres, et c'est elle qui a casse. */
  const fusion = (periodes) => {
    const out = periodes.map(p => ({ debut: p.debut || '', fin: p.fin || '' }));
    if (!out.length) return [];
    out.sort((a, b) => String(a.debut || '0000-00-00').localeCompare(String(b.debut || '0000-00-00')));
    const res = [{ debut: out[0].debut, fin: out[0].fin }];
    for (let i = 1; i < out.length; i++) {
      const p = res[res.length - 1], c = out[i];
      let fus;
      if (!p.fin) fus = true;
      else if (!c.debut) fus = true;
      else fus = (c.debut <= win._mvJourApres(p.fin));
      if (fus) { if (!p.fin || !c.fin) p.fin = ''; else if (c.fin > p.fin) p.fin = c.fin; }
      else res.push({ debut: c.debut, fin: c.fin });
    }
    return res;
  };

  const m = {};
  /* Des dates choisies pour tomber sur les charnieres : bascules d'heure d'ete
     (dernier dimanche de mars / octobre), fins de mois, 28/29 fevrier, 31/12. */
  ['2026-06-30', '2026-01-31', '2026-02-28', '2026-03-28', '2026-03-29',
   '2026-10-24', '2026-10-25', '2026-12-31', '2024-02-28', '2024-02-29']
    .forEach(d => { m['apres:' + d] = win._mvJourApres(d); });
  m['apres:vide']    = win._mvJourApres('');
  m['apres:nimporte'] = win._mvJourApres('pas-une-date');
  m['fusion:contigus'] = JSON.stringify(fusion(
    [{ debut: '2026-01-06', fin: '2026-06-30' }, { debut: '2026-07-01', fin: '2026-12-31' }]));
  m['fusion:coupure'] = JSON.stringify(fusion(
    [{ debut: '2025-01-01', fin: '2026-07-31' }, { debut: '2026-08-17', fin: '' }]));
  m['fusion:chevauche'] = JSON.stringify(fusion(
    [{ debut: '2026-01-01', fin: '2026-08-31' }, { debut: '2026-06-01', fin: '2026-12-31' }]));
  m['fusion:bissextile'] = JSON.stringify(fusion(
    [{ debut: '2024-01-01', fin: '2024-02-29' }, { debut: '2024-03-01', fin: '2024-12-31' }]));
  console.log(JSON.stringify(m));
  process.exit(0);
}

// ── Le mode PERE : lance un fils par fuseau et compare ──────────────────────
let ok = 0, ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const vert = s => useColor ? `\x1b[32m${s}\x1b[0m` : s;
const rge  = s => useColor ? `\x1b[31m${s}\x1b[0m` : s;
const T = (n, c, d) => { if (c) { ok++; console.log('   ' + vert('vert ') + ' ' + n); }
  else { ko++; console.log('   ' + rge('ROUGE') + ' ' + n + (d ? '  → ' + d : '')); } };

function mesurer(tz, cible) {
  const out = execFileSync(process.execPath,
    [fileURLToPath(import.meta.url), '--mesure', cible || CIBLE],
    { stdio: 'pipe', env: { ...process.env, TZ: tz, NO_COLOR: '1' } }).toString();
  return JSON.parse(out.trim().split('\n').pop());
}

console.log('\n  MA VIGNE — Harnais des fuseaux horaires');
console.log('  ' + '─'.repeat(58));

let releves;
try { releves = FUSEAUX.map(tz => ({ tz, m: mesurer(tz) })); }
catch (e) {
  console.log('\n  ' + rge('LE HARNAIS N\'A PAS PU MESURER') + ' — ' + e.message + '\n');
  process.exit(1);                    // ★ un plantage COMPTE COMME ROUGE
}

if (releves.some(r => r.m.erreur)) {
  console.log('\n  ' + rge('EXTRACTION : ' + releves[0].m.erreur) + '\n');
  process.exit(1);
}

console.log('\n1. Les valeurs attendues (fond du calendrier)');
const ref = releves[0].m;
T('_mvJourApres(2026-06-30) = 2026-07-01', ref['apres:2026-06-30'] === '2026-07-01', ref['apres:2026-06-30']);
T('_mvJourApres(2026-01-31) = 2026-02-01', ref['apres:2026-01-31'] === '2026-02-01', ref['apres:2026-01-31']);
T('_mvJourApres(2026-02-28) = 2026-03-01 (2026 non bissextile)',
  ref['apres:2026-02-28'] === '2026-03-01', ref['apres:2026-02-28']);
T('_mvJourApres(2024-02-28) = 2024-02-29 (2024 bissextile)',
  ref['apres:2024-02-28'] === '2024-02-29', ref['apres:2024-02-28']);
T('_mvJourApres(2024-02-29) = 2024-03-01', ref['apres:2024-02-29'] === '2024-03-01', ref['apres:2024-02-29']);
T('_mvJourApres(2026-12-31) = 2027-01-01', ref['apres:2026-12-31'] === '2027-01-01', ref['apres:2026-12-31']);
T('une chaîne vide rend une chaîne vide', ref['apres:vide'] === '');
T('une entrée qui n’est pas une date est rendue telle quelle',
  ref['apres:nimporte'] === 'pas-une-date', ref['apres:nimporte']);

console.log('\n2. ★★★ L’INVARIANCE — même résultat sous tous les fuseaux');
const cles = Object.keys(ref).sort();
for (const tz of FUSEAUX.slice(1)) {
  const r = releves.find(x => x.tz === tz).m;
  const divergent = cles.filter(k => r[k] !== ref[k]);
  T('sous ' + tz.padEnd(20) + ' : identique à UTC',
    divergent.length === 0,
    divergent.slice(0, 3).map(k => k + ' = ' + r[k] + ' au lieu de ' + ref[k]).join(' · '));
}

console.log('\n3. La fusion des contrats, là où le défaut se voyait');
T('★ deux contrats contigus (30/06 → 01/07) n’en font QU’UN',
  JSON.parse(ref['fusion:contigus']).length === 1, ref['fusion:contigus']);
T('… et sous Europe/Paris aussi — c’est le cas qui a rougi chez Nico',
  JSON.parse(releves.find(x => x.tz === 'Europe/Paris').m['fusion:contigus']).length === 1,
  releves.find(x => x.tz === 'Europe/Paris').m['fusion:contigus']);
T('une vraie coupure (31/07 → 17/08) reste DEUX périodes',
  JSON.parse(ref['fusion:coupure']).length === 2, ref['fusion:coupure']);
T('deux périodes qui se chevauchent fusionnent',
  JSON.parse(ref['fusion:chevauche']).length === 1, ref['fusion:chevauche']);
T('contiguïté par-dessus un 29 février',
  JSON.parse(ref['fusion:bissextile']).length === 1, ref['fusion:bissextile']);

console.log('\n──────────────────────────────');
console.log('  ' + ok + ' vert · ' + ko + ' ' + (ko ? rge('ROUGE') : 'rouge'));

if (CONTRE && !ko) {
  const base = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['★ retour à Date.parse local + toISOString (le défaut du 23/08)',
      "  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));\n  if(isNaN(d.getTime())) return iso;\n  d.setUTCDate(d.getUTCDate() + 1);\n  return d.toISOString().slice(0, 10);",
      "  var t = Date.parse(m[0] + 'T00:00:00');\n  if(isNaN(t)) return iso;\n  return new Date(t + 86400000).toISOString().slice(0, 10);"],
    ['le jour suivant n’avance plus',
      '  d.setUTCDate(d.getUTCDate() + 1);', '  d.setUTCDate(d.getUTCDate());'],
    ['le mois n’est plus décalé de 1 (janvier devient février)',
      '  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));',
      '  var d = new Date(Date.UTC(+m[1], +m[2], +m[3]));']
  ];
  console.log('\n  CONTRE-EPREUVES — ' + DEFAUTS.length + ' defauts reinjectes un par un\n');
  let sansEffet = 0;
  DEFAUTS.forEach(([nom, vieux, neuf], i) => {
    const n = base.split(vieux).length - 1;
    if (n !== 1) {
      console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(52) + ' '
        + rge('MOTIF INTROUVABLE (' + n + ')'));
      sansEffet++; return;
    }
    const tmp = path.join(RACINE, 'src', '.mv-ko-tz-' + (i + 1) + '.js');
    fs.writeFileSync(tmp, base.replace(vieux, neuf));
    let rouge = false;
    try {
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), tmp],
        { stdio: 'pipe', env: { ...process.env, NO_COLOR: '1' } });
    } catch { rouge = true; }
    fs.unlinkSync(tmp);
    console.log('  ' + String(i + 1).padStart(2) + '. ' + nom.padEnd(52) + ' '
      + (rouge ? vert('rouge') : rge('LE HARNAIS RESTE VERT')));
    if (!rouge) sansEffet++;
  });
  console.log();
  if (sansEffet) { console.log('  ' + rge(sansEffet + ' contre-epreuve(s) sans effet.')); process.exit(1); }
  console.log('  ' + vert('Les ' + DEFAUTS.length + ' defauts font tous rougir le harnais.'));
}
process.exit(ko ? 1 : 0);
