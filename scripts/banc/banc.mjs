// ── BANC DE CHIFFRES ────────────────────────────────────────────────────────
// Ne verifie pas la FORME du code (c'est le preflight) mais les VALEURS qu'il
// produit sur des donnees reelles figees. Ne d'un incident : le 14/08/2026 un
// lot a fait passer l'accueil de « +1 j d'avance » a « -202 j de retard » sans
// qu'une seule ligne rougisse, parce que rien ne surveillait les nombres.
//
//   node scripts/banc/banc.mjs              controle
//   node scripts/banc/banc.mjs --engraver   re-grave apres un changement VOULU
//
// L'instantane est reduit et anonyme : ni nom, ni montant. Le banc detecte
// qu'un chiffre BOUGE quand le code change ; il ne dit pas la verite comptable
// d'un domaine, et n'a donc aucun besoin de ses donnees nominatives.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chargePilotage } from './extrait.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const ENGRAVER = process.argv.includes('--engraver');
const SRC = (process.argv.find(a => a.startsWith('--src=')) || '').slice(6) || null;

const snap = JSON.parse(fs.readFileSync(path.join(ICI, 'instantane.json'), 'utf8'));
const { api, win, nbFn } = chargePilotage(SRC);

// ── Montage : on pose les collections la ou le code les cherche ─────────────
win.SAISONS = snap.saisons;
win.HISTORIQUE = snap.historique;
win.getSaisonActive = () => snap.saisons.find(s => s.active) || null;

// ── Mesures ─────────────────────────────────────────────────────────────────
const sa = win.getSaisonActive();
const refOff = api._pilCmpOffset(sa.debut);
const app = api._pilCmpSnapshot();
const per = app ? api._pilCmpPeriode(app.saisonNom) : null;
const appOff = per && per.debut ? api._pilCmpOffset(per.debut) : null;

// Recouvrement des deux periodes ramenees sur l'axe campagne (1er aout -> 31 juil).
// Deux periodes homologues se recouvrent ; deux periodes disjointes ne le sont pas.
function segment(p) {
  if (!p || !p.debut || !p.fin) return null;
  const o = api._pilCmpOffset(p.debut);
  const dur = api._arcN(p.fin) - api._arcN(p.debut);
  return [o.off, o.off + dur];
}
function recouvre(a, b) {
  if (!a || !b) return null;
  const inter = Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
  const court = Math.min(a[1] - a[0], b[1] - b[0]);
  return court > 0 ? Math.round(inter / court * 100) : 0;
}
const segA = segment(sa), segB = segment(per);

// Taux de completion de la periode appariee, pondere par les heures de bareme.
// Une periode archivee a 30 % a un denominateur ampute : tout ratio bati dessus
// mesure le trou de saisie, pas une cadence.
const ts = ((app && app.stats && app.stats.tachesStats) || []);
const hT = ts.reduce((s, t) => s + (t.h_total || 0), 0);
const hD = ts.reduce((s, t) => s + (t.h_done || 0), 0);

const mesures = {
  saison_active: sa.nom,
  saison_active_offset: refOff.off,
  saison_active_campagne: refOff.an,
  periode_appariee: app ? app.saisonNom : null,
  appariee_offset: appOff ? appOff.off : null,
  ecart_axe_jours: appOff ? Math.abs(appOff.off - refOff.off) : null,
  tolerance: api._PIL_CMP_TOL,
  recouvrement_pct: recouvre(segA, segB),
  hBar_denominateur: app ? (app.stats && app.stats.hFaites) : null,
  appariee_completion_pct: hT ? Math.round(hD / hT * 100) : null,
  nb_fonctions_extraites: nbFn
};

// ── Scenarios ───────────────────────────────────────────────────────────────
// Le cas nominal ci-dessus tourne sur donnees REELLES. Les cas ci-dessous sont
// synthetiques et minimaux, et c'est assume : ils ne mesurent pas un domaine,
// ils prouvent que CHAQUE garde mord toute seule. Sans eux, deux gardes qui se
// masquent l'une l'autre donnent un banc vert alors qu'aucune ne protege plus
// (constate le 15/08/2026 : quatre contre-epreuves passaient au vert a tort).
function monte(saisons, historique) {
  const r = chargePilotage(SRC);
  r.win.SAISONS = saisons;
  r.win.HISTORIQUE = historique;
  r.win.getSaisonActive = () => saisons.find(s => s.active) || null;
  return r;
}
function tachesA(pct) {
  return [{ nom: 'T', h_total: 1000, h_done: 10 * pct }];
}

// Legitime : meme place sur l'axe, recouvrement total, periode achevee -> apparie.
mesures.scenario_legitime = (() => {
  const r = monte(snap.saisons.map(x => ({ ...x, active: x.nom === 'Saison verte 2027' })),
                  snap.historique);
  const a = r.api._pilCmpSnapshot();
  return a ? a.saisonNom : null;
})();

// Garde RECOUVREMENT isolee : archive achevee a 100 %, mais disjointe de l'active.
// Seule la garde de recouvrement peut la rejeter.
mesures.scenario_garde_recouvrement = (() => {
  const sais = [
    { nom: 'Vend', debut: '2026-08-01', fin: '2026-09-30', active: true },
    { nom: 'Hiv', debut: '2025-10-01', fin: '2026-03-31', active: false }
  ];
  const r = monte(sais, [{ saisonNom: 'Hiv', stats: { hFaites: 800, tachesStats: tachesA(100) } }]);
  const a = r.api._pilCmpSnapshot();
  return a ? a.saisonNom : null;   // attendu : null (disjointes)
})();

// Garde ACHEVEMENT isolee : archive parfaitement recouvrante, mais close a 32 %.
// Seule la garde d'achevement peut la rejeter.
mesures.scenario_garde_achevement = (() => {
  const sais = [
    { nom: 'Vend', debut: '2026-08-01', fin: '2026-09-30', active: true },
    { nom: 'VendPrec', debut: '2025-08-01', fin: '2025-09-30', active: false }
  ];
  const r = monte(sais, [{ saisonNom: 'VendPrec', stats: { hFaites: 800, tachesStats: tachesA(32) } }]);
  const a = r.api._pilCmpSnapshot();
  return a ? a.saisonNom : null;   // attendu : null (close au tiers)
})();

// Temoin : meme cas, mais close a 95 %. Doit s'apparier — sinon la garde
// d'achevement bloque tout et non plus seulement l'incomplet.
mesures.scenario_temoin_acheve = (() => {
  const sais = [
    { nom: 'Vend', debut: '2026-08-01', fin: '2026-09-30', active: true },
    { nom: 'VendPrec', debut: '2025-08-01', fin: '2025-09-30', active: false }
  ];
  const r = monte(sais, [{ saisonNom: 'VendPrec', stats: { hFaites: 800, tachesStats: tachesA(95) } }]);
  const a = r.api._pilCmpSnapshot();
  return a ? a.saisonNom : null;   // attendu : 'VendPrec'
})();

// ── Regles de bon sens : vraies quelles que soient les donnees ──────────────
// Une valeur figee dit « ca a change ». Une regle dit « c'est faux ». Il faut
// les deux : le figement seul aurait grave -202 j comme reference.
// ⚠ Aucune regle n'EXIGE un appariement. Exiger qu'on trouve toujours un
//   homologue, c'est le travers d'origine : plutot rien que n'importe quoi.
const app_ = () => mesures.periode_appariee !== null;
const regles = [
  ['si appariement, il RECOUVRE la periode active',
   () => !app_() || (mesures.recouvrement_pct !== null && mesures.recouvrement_pct >= 50),
   'deux periodes qui ne se recouvrent pas sur l\'axe ne sont pas homologues'],
  ['si appariement, il vient d\'une periode achevee (>= 80 %)',
   () => !app_() || (mesures.appariee_completion_pct !== null && mesures.appariee_completion_pct >= 80),
   'un ratio bati sur une periode incomplete mesure un trou de saisie'],
  ['si appariement, son denominateur n\'est pas nul',
   () => !app_() || (mesures.hBar_denominateur || 0) > 0],
  ['les fonctions reelles sont bien extraites (garde de montage)',
   () => mesures.nb_fonctions_extraites === 10,
   'un banc qui n\'a rien charge verdit sur du vide'],
  ['le cas legitime s\'apparie toujours',
   () => mesures.scenario_legitime === 'Printemps 2026',
   'un correctif qui bloque TOUT appariement est aussi faux qu\'un qui apparie tout'],
  ['la garde RECOUVREMENT mord seule',
   () => mesures.scenario_garde_recouvrement === null,
   'deux periodes disjointes s\'apparient : c\'est le defaut du 14/08 (hiver -> vendange)'],
  ['la garde ACHEVEMENT mord seule',
   () => mesures.scenario_garde_achevement === null,
   'une periode close au tiers sert de reference : son hFaites est ampute'],
  ['la garde ACHEVEMENT laisse passer l\'achevee',
   () => mesures.scenario_temoin_acheve === 'VendPrec',
   'la garde bloque tout, pas seulement l\'incomplet']
];

// ── Sortie ──────────────────────────────────────────────────────────────────
const CH = path.join(ICI, 'baseline.json');
console.log('\n  MA VIGNE — Banc de chiffres  (valeurs sur donnees reelles figees)');
console.log('  Instantane : ' + snap.origine);
if (SRC) console.log('  Source     : ' + SRC);
console.log('');
for (const [k, v] of Object.entries(mesures)) {
  console.log('    ' + k.padEnd(28) + ' = ' + JSON.stringify(v));
}

let ko = 0;
console.log('\n  ── Regles de bon sens ──');
for (const [nom, f, pourquoi] of regles) {
  let vrai = false;
  try { vrai = !!f(); } catch { vrai = false; }
  if (vrai) console.log('    \u2713 ' + nom);
  else { ko++; console.log('    \u2717 ' + nom + (pourquoi ? '\n        \u2192 ' + pourquoi : '')); }
}

if (ENGRAVER) {
  fs.writeFileSync(CH, JSON.stringify(mesures, null, 1) + '\n');
  console.log('\n  \u2713 Valeurs gravees dans baseline.json');
  console.log('  ' + (ko ? '\u26a0 ' + ko + ' regle(s) rouge(s) : gravees telles quelles, le defaut reste ouvert.' : ''));
  process.exit(0);
}

if (!fs.existsSync(CH)) {
  console.log('\n  \u26a0 Aucune reference. Graver avec --engraver.');
  process.exit(1);
}
const ref = JSON.parse(fs.readFileSync(CH, 'utf8'));
const bouge = [];
for (const k of new Set([...Object.keys(ref), ...Object.keys(mesures)])) {
  const a = JSON.stringify(ref[k]), b = JSON.stringify(mesures[k]);
  if (a !== b) bouge.push('    ' + k + ' : ' + a + '  \u2192  ' + b);
}
console.log('\n  ── Ecarts a la reference ──');
if (bouge.length) {
  bouge.forEach(l => console.log(l));
  console.log('\n  \u2717 ' + bouge.length + ' chiffre(s) ont bouge.');
  console.log('    Si le changement est VOULU : node scripts/banc/banc.mjs --engraver');
} else {
  console.log('    aucun');
}
const total = bouge.length + ko;
console.log('\n  ' + (total ? '\u2717 ' + bouge.length + ' ecart(s) \u00b7 ' + ko + ' regle(s) rouge(s)'
                            : '\u2713 Tout est bon.') + '\n');
process.exit(total ? 1 : 0);
