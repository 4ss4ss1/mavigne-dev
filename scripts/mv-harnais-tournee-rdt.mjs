#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS TOUR-RDT (§216) — LE RENDEMENT DE LA TOURNÉE
   Lancer :  node scripts/mv-harnais-tournee-rdt.mjs            (scénarios)
             node scripts/mv-harnais-tournee-rdt.mjs --contre   (contre-épreuves)
   Méthode §6b (harnais INTÉGRÉ) : la VRAIE simulation (_dzSimuler, _dzHop) et
   le bloc TOUR-RDT sont extraits de src/pilotage.js ; seuls l'équipe du jour,
   la géographie et les taux sont doublés, avec LEUR signature.
   Les attendus sont posés à la main, sans relire la simulation : temps utile =
   travail ÷ effectif ÷ (travail ÷ effectif + trajets) ; coût = taux × heures ×
   part du jour occupée ; renfort et équipe anonyme au taux moyen ; sans taux
   lisible, un tiret — jamais zéro.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const PIL = readFileSync('src/pilotage.js', 'utf8');
function corps(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } }
  throw new Error('accolades : ' + debut);
}
function bloc(src) { const a = src.indexOf('function _dzCoutJour('), b = src.indexOf('function _dzResultatHtml(C){'); if (a < 0 || b < a) throw new Error('bloc TOUR-RDT introuvable'); return src.slice(a, b); }

const H = { pied_m: 300, pied_kmh: 4, fixe_min: 5, camion_kmh: 25, sans_min: 5 };
const P1 = { nom: 'P1', x: 0, geo: true }, P2 = { nom: 'P2', x: 2000, geo: true }, P3 = { nom: 'P3', x: 100, geo: true };
const row = p => ({ p, nom: p.nom, s: 0.5, reste: 7, geo: true });
const ouvre = iso => { const d = new Date(iso + 'T12:00:00').getDay(); return d >= 1 && d <= 5; };
const suiv = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

function charger(src, o = {}) {
  const ctx = { Math, Object, Array, String, Number, isFinite, console,
    _dzEquipeJour: (iso, c) => {   // signature reelle (iso, ctx)
      const out = { iso, n: 0, C: 0, J: 0, pers: [], abs: [], coup: 0 };
      if (!ouvre(iso)) return out;
      out.pers = [{ nom: 'A', h: 7, n: 1 }, { nom: 'B', h: 7, n: 1 }]; out.n = 2; out.C = 14; out.J = 7;
      if (c.anon != null) { out.n = c.anon; out.C = c.anon * 7; }
      if (c.R) { out.n += c.R; out.C += c.R * 7; }
      return out; },
    _dzSuivant: (iso, c, sens) => { let x = iso; for (let g = 0; g < 30; g++) { x = suiv(x); if (ouvre(x)) return x; } return null; },
    _opGeoOK: p => !!(p && p.geo), _opHav: (a, b) => Math.abs(a.x - b.x),
    _dzMbs: () => ({ A: { nom: 'A' }, B: { nom: 'B' } }),
    _mvPaieTauxEffAt: (m, iso) => (o.sansTaux ? 0 : (m.nom === 'A' ? 20 : 0)),
    _ecoRate: () => (o.sansTaux ? 0 : 18),
    _opNNNames: () => (o.nn || ['P1', 'P3', 'P2']), _opActTodo: () => [P1, P2, P3],
    _opCanEdit: () => o.edit !== false,
    _mvInfoBtn: k => '<button class="mv-i" data-info="' + k + '">i</button>' };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _dzHop('), corps(src, 'function _dzSimuler('), corps(src, 'function _dzMin('), corps(src, 'function _dzPl('),
    corps(src, 'function _opFmtHa('), corps(src, 'function _ecoEur('), bloc(src)].join('\n'), ctx, { filename: 'tournee-extrait.js' });
  return ctx;
}
function C0(X, rows, ctxT) { return { rows, ctx: ctxT || { noms: ['A', 'B'] }, ref: { iso: '2026-06-16' }, H, sim: X._dzSimuler(rows, '2026-06-16', ctxT || { noms: ['A', 'B'] }, H) }; }

function scenarios(src, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  const proche = (a, b, e = 1e-6) => a != null && Math.abs(a - b) < e;
  try {
    const X = charger(src), rows = [row(P1), row(P2), row(P3)];
    const C = C0(X, rows), R = X._dzRendement(C), A = R.A;
    const tr = (5 + 2 / 25 * 60) + (5 + 1.9 / 25 * 60);   // deux trajets en camion, en minutes
    t('trajets : 2 en camion (9,8 + 9,56 min), aucun à pied', proche(A.cam, tr) && A.pied === 0 && A.gps === 0, JSON.stringify([A.cam, A.pied]));
    const used = 21 / 2 + tr / 60;
    t('temps utile = (21 h ÷ 2 pers.) ÷ (10,5 h + trajets) = 97,0 %', proche(A.utile, 10.5 / used), A.utile);
    t('deux jours de tournée, 1,5 ha', A.jours === 2 && proche(A.surf, 1.5));
    const jour = 7 * 20 + 7 * 18, cout = jour * (1 + (used - 7) / 7);
    t('coût = (7 h × 20 € + 7 h × 18 € au taux moyen) × (1 jour + la part du 2e)', proche(A.cout, cout, 1e-6), A.cout + ' / ' + cout);
    t('une personne sans taux propre est comptée au taux moyen, et dite', A.nSans === 1);
    t('revient à l’hectare = coût ÷ 1,5 ha', proche(A.eurHa, cout / 1.5, 1e-6));
    t('l’ordre « au plus proche » est recalculé sur la même simulation', R.same === false && R.B && R.B.jours === 2);
    const trB = (0.1 / 4 * 60) + (5 + 1.9 / 25 * 60), usedB = 10.5 + trB / 60;
    t('au plus proche : un trajet à pied (1,5 min) + un en camion, utile 98,3 %', proche(R.B.pied, 1.5) && proche(R.B.utile, 10.5 / usedB), JSON.stringify([R.B.pied, R.B.utile]));
    t('mémorisé le temps d’un rendu', X._dzRendement(C) === R);
    const Hh = X._dzRendementHtml(C);
    t('le rendu : barre, trois chiffres, tableau de deux ordres', Hh.includes('pil-dz-rdt-bar') && (Hh.match(/class="pil-dz-kpi"/g) || []).length === 3 && (Hh.match(/<tr><td>/g) || []).length === 2);
    t('en gras le meilleur : trajets, utile et €/ha au plus proche', /<td>Au plus proche<\/td><td>2<\/td><td class="mieux">[^<]+<\/td><td class="mieux">[^<]+<\/td><td class="mieux">/.test(Hh), Hh.slice(Hh.indexOf('<tbody>'), Hh.indexOf('</tbody>')));
    t('le bouton prend l’ordre au plus proche (même action que le tri)', Hh.includes('data-op="sort" data-mode="nn"'));
    const larg = [...Hh.matchAll(/width:([\d.]+)%/g)].map(m => +m[1]);
    t('la barre se partage à 100 %', proche(larg.reduce((a, b) => a + b, 0), 100, 0.05), JSON.stringify(larg));
    t('aucun undefined / NaN, balises équilibrées', !/undefined|NaN/.test(Hh) && (Hh.match(/<div[ >]/g) || []).length === (Hh.match(/<\/div>/g) || []).length);
    // renfort et equipe anonyme
    const Cr = C0(X, rows, { noms: ['A', 'B'], R: 1 }), Ar = X._dzRendement(Cr).A, usedR = 21 / 3 + tr / 60;
    t('renfort simulé (+1) : payé au taux moyen, 7 h par jour (2 jours, le 2e au prorata)', usedR > 7 && proche(Ar.cout, (jour + 7 * 18) * (1 + (usedR - 7) / 7), 1e-6), Ar.cout);
    const Ca = C0(X, rows, { noms: ['A', 'B'], anon: 4 }), Aa = X._dzRendement(Ca).A, usedA = 21 / 4 + tr / 60;
    t('équipe anonyme (4) : 4 × 7 h au taux moyen, au prorata du jour', proche(Aa.cout, 4 * 7 * 18 * (usedA / 7), 1e-6), Aa.cout);
    // sans taux, ordre identique, lecture seule
    const Xs = charger(src, { sansTaux: true }), Cs = C0(Xs, rows), Hs = Xs._dzRendementHtml(Cs);
    t('sans aucun taux lisible : coût et revient en tiret, jamais 0 €', Xs._dzRendement(Cs).A.cout === null && Hs.includes('<b>—</b><span>coût') && !Hs.includes('<b>0 €</b>') && Hs.includes('réservés à l’administrateur'));
    const Xi = charger(src, { nn: ['P1', 'P2', 'P3'] }), Ci = C0(Xi, rows), Hi = Xi._dzRendementHtml(Ci);
    t('ordre déjà « au plus proche » : dit, pas de tableau', Hi.includes('déjà celui « au plus proche »') && !Hi.includes('<table'));
    const Xe = charger(src, { edit: false }), He = Xe._dzRendementHtml(C0(Xe, rows));
    t('lecture seule : la comparaison reste, le bouton disparaît', He.includes('<table') && !He.includes('data-op="sort"'));
    t('branché sous le résultat de la tournée', /return h\+_dzRendementHtml\(C\);/.test(src));
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}

console.log('\n\x1b[1mMA VIGNE — Harnais TOUR-RDT · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(PIL, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['la part du jour n’est plus prise en compte', 'o.cout+=c.eur*(d.J>0?Math.min(1,d.used/d.J):0);', 'o.cout+=c.eur;'],
  ['les trajets comptent comme du temps utile', 'Math.max(0,o.used-o.traj/60)/o.used', 'o.used/o.used'],
  ['le renfort n’est pas payé', 'var extra=Math.max(0,(d.n||0)-nNom);', 'var extra=0;'],
  ['sans taux propre, la personne est gratuite', 'tx=r0; nSans+=n; }', 'tx=0; nSans+=n; }'],
  ['sans aucun taux, le coût devient zéro', "if(!(isFinite(tx)&&tx>0)){ if(!(r0>0)) return {eur:null, nSans:0}; tx=r0; nSans+=n; }", 'if(!(isFinite(tx)&&tx>0)){ tx=r0||0; nSans+=n; }'],
  ['la comparaison n’est jamais calculée', "if(nn.join('|')!==cur.join('|')){", 'if(false){'],
  ['à pied et en camion sont inversés', "if(hp.mode==='pied') o.pied+=hp.min; else if(hp.mode==='camion') o.cam+=hp.min;", "if(hp.mode==='camion') o.pied+=hp.min; else if(hp.mode==='pied') o.cam+=hp.min;"],
];
let rougit = 0;
for (const [nom, a, b] of DEFAUTS) {
  const n = PIL.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = scenarios(PIL.replace(a, b), false);
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); }
  else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
