// HARNAIS — ARRACH-5 : la facture de prestataire unique, l'arrachage dans le revient, le bouton « Prestataire ».
//   node scripts/mv-harnais-arrach5.mjs           → doit être vert
//   node scripts/mv-harnais-arrach5.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES _mvFactureOu / _mvNomPrestation (utils.js) et _pecRevCouts (pilotage.js), ses
// sources de coûts remplacées par des valeurs connues.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const UT = fs.readFileSync(path.join(R, 'src/utils.js'), 'utf8');
const PIL = fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const RSV = fs.readFileSync(path.join(R, 'src/reserve.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const ligne = re => { const m = UT.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0] + '\n'; };
const FACT = sansCom(ligne(/function _mvFactNorm\(s\)\{[^\n]*/) + fn(UT, 'function _mvFactureOu(four, num, exclure){')
  + ligne(/var MV_RE_PRESTA = [^\n]*/) + ligne(/function _mvNomPrestation\(nom\)\{[^\n]*/));
const REV = sansCom(fn(PIL, 'function _pecRevCouts(cy, auj, parc){'));

function monde(fact, rev) {
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite,
    INTRANTS: { achats: [{ four: 'Agri Sud', fact: 'F-2026/114', prix: 300 }] },
    JOURNAL: [{ presta: true, statut: 'Validé', prestaNom: 'ETA Morey', prestaFact: 'A-77' }],
    PARCELLES: [{ nom: 'A', surface: 1, statut: 'Active' }, { nom: 'B', surface: 3, statut: 'Active' }, { nom: 'X', surface: 0.5, statut: 'Arrachee' }],
    _ecoTempsVigne: () => ({ ok: true, eur: 1000, parcs: { A: { eur: 200 }, B: { eur: 600 }, X: { eur: 200 } }, nSansTaux: 0 }),
    _ecoTracHByParc: () => ({ cost: { A: 10, X: 80 }, h: { A: 1, X: 4 } }),
    _ecoGnrReel: () => ({ ok: true, eur: 0 }), _ecoPhytoByParc: () => ({ cost: { X: 20 } }),
    _ecoPrestaByParc: () => ({ cost: { B: 500, X: 300 } }),
    _pecRevPrevuMO: () => 0, _pexJourApres: d => d };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fact + '\n' + rev + '\nthis.__f={_mvFactureOu,_mvNomPrestation,_pecRevCouts};', ctx);
  return { ctx, f: ctx.__f };
}
function suite(fact, rev) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const w = monde(fact, rev);
  T('facture connue de La Réserve (fournisseur + n°, écriture libre)', w.f._mvFactureOu('agri sud', 'F 2026-114', 'presta') === 'achat');
  T('facture connue d\u2019une étape d\u2019arrachage', w.f._mvFactureOu('ETA Morey', 'a77', 'achat') === 'presta');
  T('autre fournisseur, même n° : pas la même facture', w.f._mvFactureOu('Autre SARL', 'A-77', 'achat') === '');
  T('sans n° de facture : rien à prouver', w.f._mvFactureOu('ETA Morey', '', 'achat') === '');
  T('une étape annulée ne bloque pas', (w.ctx.JOURNAL[0].statut = 'Annulé', w.f._mvFactureOu('ETA Morey', 'A-77', 'achat') === ''));
  T('nom d\u2019intrant « Prestation arrachage » refusé', w.f._mvNomPrestation('Prestation arrachage') && w.f._mvNomPrestation('Main d\u2019\u0153uvre') && w.f._mvNomPrestation('Arrachage vigne'));
  T('un vrai intrant passe', !w.f._mvNomPrestation('Bouillie bordelaise') && !w.f._mvNomPrestation('Piquets acacia'));
  const parc = w.ctx.PARCELLES.filter(p => p.statut !== 'Arrachee');
  const C = w.f._pecRevCouts({ d0: '2025-10-01', d1: '2026-09-30' }, '2026-10-02', parc);
  T('revient : la prestation d\u2019une vigne en place lui revient', Math.abs(C.by.B.pre - (500 + 400 * 0.75)) < 1e-9);
  T('revient : ce qu\u2019a coûté l\u2019arrachée (tracteur + phyto + presta) se répartit à la surface', C.arrEur === 400 && Math.abs(C.by.A.pre - 100) < 1e-9 && C.nArr === 1);
  T('revient : rien de perdu (500 de presta + 400 de l\u2019arrachée = poste pre)', Math.abs(C.tot.pre - 900) < 1e-9);
  T('revient : la MO entière reste répartie', Math.abs(C.by.A.mo + C.by.B.mo - 1000) < 1e-9);
  T('revient : le poste est sommé au coût', /var POST=\['mo','trac','gnr','phy','pre'\];/.test(PIL) && /\['pre','Arrachage & prestations',_PEC_COL\.pre\]/.test(PIL));
  T('La Réserve refuse la facture d\u2019une étape et l\u2019intrant « prestation »', /_mvFactureOu\(four,_fact,'achat'\)==='presta'/.test(RSV) && /_mvNomPrestation\(nom\)/.test(RSV) && /_mvNomPrestation\(p\.nom\)/.test(RSV));
  T('l\u2019étape refuse une facture de La Réserve (fiche et journal)', (APP.match(/_mvFactureOu\([^)]*'presta'\)==='achat'/g) || []).length === 2);
  T('le bouton « Prestataire » s\u2019allume en vert', /\(e\.presta\?' sel vert':''\)/.test(APP));
  return out;
}
let ok = 0, ko = 0;
suite(FACT, REV).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-5 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['le fournisseur ne compte plus', f => f.replace("(!f || !_mvFactNorm(j.prestaNom) || _mvFactNorm(j.prestaNom) === f)", 'true'), r => r],
  ['l\u2019écriture libre du n° fait passer un doublon', f => f.replace("replace(/[\\s.\\-_/]+/g, '')", "replace(/^$/, '')"), r => r],
  ['une étape annulée bloque encore', f => f.replace("if(!j || !j.presta || j.statut !== 'Valid\\u00e9') continue;", 'if(!j || !j.presta) continue;'), r => r],
  ['l\u2019arrachée ne pèse plus', f => f, r => r.replace('var c=((prs&&prs.cost&&prs.cost[p.nom])||0)+arrE*partSurf(p);', 'var c=((prs&&prs.cost&&prs.cost[p.nom])||0);')],
  ['les prestations des vignes en place oubliées', f => f, r => r.replace('var c=((prs&&prs.cost&&prs.cost[p.nom])||0)+arrE*partSurf(p);', 'var c=arrE*partSurf(p);')],
  ['le tracteur de l\u2019arrachée oublié', f => f, r => r.replace('var e=((tr&&tr.cost&&tr.cost[p.nom])||0)+', 'var e=')],
];
let rg = 0;
D.forEach(([n, ff, fr]) => {
  const a = ff(FACT), b = fr(REV);
  if (a === FACT && b === REV) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(a, b); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, c]) => !c); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
