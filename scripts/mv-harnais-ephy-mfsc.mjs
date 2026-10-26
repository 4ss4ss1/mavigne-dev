#!/usr/bin/env node
// =============================================================================
// FERTI-4 (§461) — LE CATALOGUE E-PHY GARDE LES MATIÈRES FERTILISANTES VALABLES EN VIGNE
// -----------------------------------------------------------------------------
//   node scripts/mv-harnais-ephy-mfsc.mjs            les contrôles
//   node scripts/mv-harnais-ephy-mfsc.mjs --contre   deux défauts posés exprès : chacun doit faire rougir
//
// Rejoue le VRAI code de functions/ephy.js (synchro E-Phy) sur un extrait réel de l'export E-Phy du
// 24/02/2026 (scripts/fixtures/ephy-mfsc), sans réseau ni Firestore : modules Firebase, archive et
// lecture CSV remplacés par des doublures. Vérifie :
//   · le rapport à la vigne (functions/ephy-calc.js) : toutes cultures, sans culture, vigne nommée
//     autrement (« raisin de cuve », « viticulture »), autres cultures ;
//   · les teneurs déclarées (N, P2O5, K2O) et la taille comptée comme Firestore la compte ;
//   · le catalogue écrit : les nouvelles matières fertilisantes entrent avec leur statut et leurs
//     teneurs ; depuis FERTI-5 (§462), les « autres cultures » entrent aussi, marquées et réduites ;
//     les PPP ne bougent pas.
// =============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(R, 'scripts', 'fixtures', 'ephy-mfsc');
const ROLES = JSON.parse(fs.readFileSync(path.join(FIX, 'roles.json'), 'utf8'));
const require = createRequire(import.meta.url);
const Module = require('node:module');
const CALC = path.join(R, 'functions', 'ephy-calc.js');
const EPHY = path.join(R, 'functions', 'ephy.js');

// Lecteur CSV minimal : le jeu d'essai n'a ni guillemet ni point-virgule dans les cellules (LISEZMOI.txt).
function parse(txt) {
  const L = String(txt).replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  const h = L[0].split(';').map(x => x.trim());
  return L.slice(1).map(l => { const c = l.split(';'); const o = {}; h.forEach((k, i) => { o[k] = (c[i] || '').trim(); }); return o; });
}

async function rejoue(fichierEphy) {
  let ecrit = null;
  const stubs = {
    'firebase-functions/v2/scheduler': { onSchedule: (o, f) => f },
    'firebase-functions/v2/https': { onCall: (o, f) => f, HttpsError: class extends Error {} },
    'firebase-functions/v2': { logger: { info() {}, warn() {}, error() {} } },
    'firebase-admin': {
      apps: [1], initializeApp() {},
      firestore: Object.assign(() => ({ collection: () => ({ doc: () => ({ set: async d => { ecrit = d; } }) }) }),
        { FieldValue: { serverTimestamp: () => 'TS' } }),
    },
    'adm-zip': class {
      getEntries() {
        return fs.readdirSync(FIX).filter(f => f.endsWith('.csv'))
          .map(f => ({ entryName: 'x/' + f, isDirectory: false, getData: () => fs.readFileSync(path.join(FIX, f)) }));
      }
    },
    'csv-parse/sync': { parse },
  };
  const orig = Module._load, fetch0 = global.fetch;
  Module._load = function (req) { if (stubs[req]) return stubs[req]; return orig.apply(this, arguments); };
  global.fetch = async url => String(url).includes('/api/1/datasets/')
    ? { ok: true, json: async () => ({ resources: [{ format: 'zip', title: 'csv utf8', url: 'local.zip' }] }) }
    : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  let m;
  try { delete require.cache[fichierEphy]; m = require(fichierEphy); } finally { Module._load = orig; }
  try { await m.syncEphyVigne(); } finally { global.fetch = fetch0; }
  return ecrit;
}

let vertes = 0; const rouges = [];
const t = (c, msg) => { if (c) vertes++; else rouges.push(msg); };

async function controles(calcPath, ephyPath) {
  delete require.cache[calcPath];
  const K = require(calcPath);
  t(K.classeVigne([{ type: 'Traitements généraux', com: 'Toutes cultures' }]) === 'tc', 'toutes cultures → tc');
  t(K.classeVigne([{ type: 'Autres', com: 'Raisin de cuve stimulation de la croissance' }]) === 'v', '« raisin de cuve » → vigne');
  t(K.classeVigne([{ type: 'Autres', com: 'Cultures légumières, petits fruits et viticulture' }]) === 'v', '« viticulture » → vigne');
  t(K.classeVigne([{ type: '', com: '' }]) === 'nc', 'aucune culture → nc');
  t(K.classeVigne([]) === 'nc', 'aucune ligne → nc');
  t(K.classeVigne([{ type: 'Grandes cultures', com: 'Apport au sol' }, { type: 'Cultures maraîchères', com: '' }]) === 'non', 'autres cultures → non');
  t(K.classeVigne([{ type: 'Arboriculture fruitière et vigne', com: '' }]) === 'v', 'catégorie « Arboriculture fruitière et vigne » → vigne (inchangé)');
  const c = K.lireCompo('Azote (N) total (Min: 10.0 %, Max: 10.0 %)  | Anhydride phosphorique (Min: 5.0 %, Max: 5.0 %)  | Oxyde de potassium (K2O)  (Min: 7.0 %, Max: 7.0 %) | dont azote (N) organique (Min: 4.0 %, Max: 4.0 %)');
  t(!!c && c.N === 10 && c.P === 5 && c.K === 7, 'teneurs 10-5-7 lues, la ligne « dont » ignorée');
  t(K.lireCompo("Oxyde de potassium (K2O) soluble dans l'eau (Min: 25.0 %, Max: 25.0 %)") === null, 'une forme « soluble dans l’eau » n’est pas un total');
  t(K.tailleFs({ ab: 'cd', n: 1, b: true, l: ['x'] }) === (3 + 3) + (2 + 8) + (2 + 1) + (2 + 2), 'taille comptée comme Firestore');

  const doc = await rejoue(ephyPath);
  const P = {}; ((doc && doc.produits) || []).forEach(e => { P[e.amm] = e; });
  t(!!doc && Array.isArray(doc.produits) && doc.count === doc.produits.length, 'catalogue écrit');
  t(!!P['1210082'] && P['1210082'].vg === 'tc' && !!P['1210082'].compo && P['1210082'].compo.N === 6, 'KITOGREEN YIELD : gardé, toutes cultures, 6 % N');
  t(!!P['1180798'] && P['1180798'].vg === 'nc' && !!P['1180798'].compo && P['1180798'].compo.K === 7, 'CORNACTYL : gardé, sans culture, 10-5-7');
  t(!!P['1210642'] && P['1210642'].vg === 'v', 'SVL-204 (« raisin de cuve ») : gardé, vigne');
  t(!!P['1170609'] && P['1170609'].vg === 'v', 'BACTERIOLIS (« viticulture ») : gardé, vigne');
  t(!!P['1160001'] && P['1160001'].vg === 'tc', 'TRADIBASE MG : gardé, toutes cultures');
  t(!!P['1180074'] && P['1180074'].vg === 'non' && /grandes cultures/.test(P['1180074'].cult || '') && !(P['1180074'].usages || []).length && !P['1180074'].sub, 'KTS (autres cultures) : au catalogue depuis FERTI-5, marqué « non », ses cultures, fiche réduite');
  t(!!P[ROLES.cat_only] && P[ROLES.cat_only].vg === 'v', 'vigne par la seule catégorie : toujours gardé');
  t(!P[ROLES.retire_tc], 'retiré « toutes cultures » : dehors');
  t(!!P[ROLES.ppp_v] && P[ROLES.ppp_v].vg === undefined && P[ROLES.ppp_v].compo === undefined, 'PPP vigne : gardé, sans statut ni teneurs');
  t(!P[ROLES.ppp_x], 'PPP sans vigne : dehors');
}

function copieDefaut(source, remplacements, calcAbs) {
  let s = fs.readFileSync(source, 'utf8');
  for (const [a, b] of remplacements) { if (!s.includes(a)) throw new Error('défaut impossible à poser, ancre absente : ' + a); s = s.split(a).join(b); }
  if (calcAbs) s = s.split("require('./ephy-calc')").join('require(' + JSON.stringify(calcAbs) + ')');
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mv-ephy-')), path.basename(source));
  fs.writeFileSync(f, s);
  return f;
}

if (!process.argv.includes('--contre')) {
  await controles(CALC, EPHY);
  console.log('mv-harnais-ephy-mfsc : ' + vertes + ' vertes, ' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : ''));
  rouges.forEach(r => console.log('  ✗ ' + r));
  process.exit(rouges.length ? 1 : 0);
} else {
  const defauts = [
    { nom: '« toutes cultures » oublié', calc: [["x.includes('toutes cultures') || x.includes('toute culture') || t === 'traitements generaux'", 'false']] },
    { nom: 'les « autres cultures » restent dehors', ephy: [['const INCLURE_HORS_VIGNE = true;', 'const INCLURE_HORS_VIGNE = false;']] },
  ];
  let attrapes = 0;
  for (const d of defauts) {
    vertes = 0; rouges.length = 0;
    const calc = d.calc ? copieDefaut(CALC, d.calc) : CALC;
    const ephy = copieDefaut(EPHY, d.ephy || [], calc);
    await controles(calc, ephy);
    const vu = rouges.length > 0;
    if (vu) attrapes++;
    console.log((vu ? '  ✓ attrapé : ' : '  ✗ PAS attrapé : ') + d.nom + (vu ? ' (' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : '') + ')' : ''));
  }
  console.log('mv-harnais-ephy-mfsc --contre : ' + attrapes + '/' + defauts.length + ' défauts attrapés');
  process.exit(attrapes === defauts.length ? 0 : 1);
}
