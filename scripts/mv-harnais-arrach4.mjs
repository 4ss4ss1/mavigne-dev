// HARNAIS — ARRACH-4 : les prestations au Pilotage, l'arrachée au tableau des parcelles, l'étape au formulaire du journal.
//   node scripts/mv-harnais-arrach4.mjs           → doit être vert
//   node scripts/mv-harnais-arrach4.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE _ecoPrestaByParc (pilotage.js) et les vrais gestes du formulaire (app.js) ; le
// câblage de _pecData / _pexData est lu dans le source (ces moteurs tournent au harnais de robustesse).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const PIL = fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const PRE = sansCom(fn(PIL, 'function _ecoPrestaByParc(win){'));
const i0 = APP.indexOf('// ══════ ARRACH-3'), i1 = APP.indexOf('// ══════ ARRACHAGE —');
const BLK = sansCom(APP.slice(i0, i1));
const PEC = fn(PIL, 'function _pecData(){'), PEX = fn(PIL, 'function _pexData(ex, noCmp, coupeIso){');

function monde(pre, blk) {
  const els = {}; const el = id => (els[id] ||= { id, value: '', style: {}, innerHTML: '', options: [] });
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite,
    JOURNAL: [], PARCELLES: [], CONFIG: { arrachage: { etapes: [{ id: 'souches', lbl: 'Arrachage des souches' }, { id: 'ramassage', lbl: 'Ramassage', presta: true }], apres: 'souches' } },
    _pilSaison: () => ({ debut: '2026-09-01', fin: '2026-11-30' }),
    _escHtml: s => String(s), _escAttr: s => String(s), _mvCampRef: () => 2026,
    document: { getElementById: id => (/^je-/.test(id) ? el(id) : null) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(pre + '\n' + blk + '\nthis.__f={_ecoPrestaByParc,_jeEtapeMaj,_jeEtapeLue,_jeEtapePresta};', ctx);
  return { ctx, f: ctx.__f, el };
}
const J = (id, date, parc, etape, statut, extra = {}) => Object.assign({ id, date, parcelle: parc, tache: 'Arrachage', etape, statut }, extra);

function suite(pre, blk, pec, pex) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let w = monde(pre, blk);
  w.ctx.JOURNAL.push(J('a1', '2026-10-01', 'A', 'ramassage', 'Validé', { presta: true, prestaMontant: 1200 }));
  w.ctx.JOURNAL.push(J('a2', '2026-10-02', 'B', 'ramassage', 'Validé', { presta: true }));
  w.ctx.JOURNAL.push(J('a3', '2026-10-02', 'B', 'souches', 'Validé'));
  w.ctx.JOURNAL.push(J('a4', '2026-08-15', 'C', 'ramassage', 'Validé', { presta: true, prestaMontant: 500 }));
  let r = w.f._ecoPrestaByParc();
  T('prestation comptée sur sa parcelle, à sa date', r.cost.A === 1200 && r.byDate['2026-10-01'] === 1200 && r.tot === 1200);
  T('étape sans montant : comptée à part, pas à zéro', r.n === 2 && r.nSansPrix === 1);
  T('étape faite par l\u2019équipe : pas une prestation', !r.cost.B);
  T('hors de la période : écartée', !r.cost.C);
  T('fenêtre explicite (exercice) respectée', w.f._ecoPrestaByParc({ d0: '2026-08-01', d1: '2026-08-31' }).tot === 500);
  w.ctx.JOURNAL.push(J('a5', '2026-10-03', 'A', 'ramassage', 'Annulé'));
  T('étape annulée : ne compte plus', !w.f._ecoPrestaByParc().cost.A);
  w.ctx.JOURNAL.push(J('a6', '2026-10-04', 'A', 'ramassage', 'Validé', { presta: true, prestaMontant: 900 }));
  w.ctx.JOURNAL.push(J('a7', '2026-10-05', 'A', 'ramassage', 'Validé', { presta: true, prestaMontant: 950 }));
  T('revalidée : une seule facture, la dernière', w.f._ecoPrestaByParc().cost.A === 950);
  // formulaire
  w = monde(pre, blk);
  w.el('je-tache').value = 'Pioche'; w.f._jeEtapeMaj();
  T('formulaire : pas d\u2019étape pour une autre tâche', w.el('je-etape-wrap').style.display === 'none' && w.f._jeEtapeLue() === null);
  w.el('je-tache').value = 'Arrachage'; w.f._jeEtapeMaj();
  T('formulaire : étapes proposées pour l\u2019arrachage découpé', w.el('je-etape-wrap').style.display === '' && /souches/.test(w.el('je-etape').innerHTML));
  w.el('je-etape').value = 'ramassage'; w.f._jeEtapePresta();
  T('formulaire : étape prestataire → nom et montant', w.el('je-presta').style.display === '' && w.f._jeEtapeLue().presta);
  w.ctx.CONFIG = {}; w.f._jeEtapeMaj();
  T('formulaire : arrachage non découpé → pas d\u2019étape', w.el('je-etape-wrap').style.display === 'none' && w.f._jeEtapeLue() === null);
  // câblage
  T('_pecData : l\u2019arrachée qui a coûté entre au tableau', /if\(p\.statut!=='Arrachee'\) return true;/.test(pec) && /\(prs\.cost\[p\.nom\]\|\|0\)>0/.test(pec));
  T('_pecData : pas de barème sur une arrachée', /if\(arr \|\| !def \|\| !_opApplic\(p,def\)\) return;/.test(pec));
  T('_pecData : pas de surface au total pour une arrachée', /if\(!arr\) T\.surf\+=surf;/.test(pec));
  T('_pecData : la prestation dans l\u2019engagé et le budget', /engage \+= T\.prestF;/.test(pec) && /phyB \+ T\.prestF;/.test(pec));
  T('_pexData : la prestation dans le total et les ateliers', /total\+=preT;/.test(pex) && /_ateAdd\('vigne','Prestations'/.test(pex));
  T('le graphique mensuel empile les prestations', /\(b\.pre\|\|0\)/.test(PIL) && /\['pre',_PEC_COL\.pre\]/.test(PIL));
  T('le journal écrit l\u2019étape et la pose sur la parcelle', /jEntry\.etape=_jeEt\.id/.test(APP) && /_arrPose\(_jePp,_jeEt\.id,_jeSt\)/.test(APP));
  T('index.html porte le choix d\u2019étape', HTML.includes('id="je-etape"') && HTML.includes('id="je-pm"'));
  return out;
}
let ok = 0, ko = 0;
suite(PRE, BLK, PEC, PEX).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-4 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['« Annulé » ignoré', p => p.replace("if(st==='Annul\\u00e9') { delete last[k]; return; }", ''), b => b, x => x, y => y],
  ['deux factures pour une étape revalidée', p => p.replace('if(j.presta) last[k]=j; else delete last[k];', "if(j.presta) last[k+'\\u0000'+j.id]=j; else delete last[k];"), b => b, x => x, y => y],
  ['montant absent compté zéro sans le dire', p => p.replace('if(!(e>0)){ out.nSansPrix++; return; }', 'if(!(e>0)){ return; }'), b => b, x => x, y => y],
  ['fenêtre ignorée', p => p.replace('if(iso<d0 || iso>d1) return;', ''), b => b, x => x, y => y],
  ['étape proposée hors arrachage', p => p, b => b.replace("var on=!!(t&&t.value==='Arrachage'&&_arrActif());", 'var on=true;'), x => x, y => y],
  ['barème posé sur une arrachée', p => p, b => b, x => x.replace('if(arr || !def', 'if(!def'), y => y],
  ['surface arrachée au total', p => p, b => b, x => x.replace('if(!arr) T.surf+=surf;', 'T.surf+=surf;'), y => y],
  ['prestation hors du total de l\u2019exercice', p => p, b => b, x => x, y => y.replace('total+=preT;', '')],
];
let rg = 0;
D.forEach(([n, fp, fb, fx, fy]) => {
  const a = [fp(PRE), fb(BLK), fx(PEC), fy(PEX)];
  if (a[0] === PRE && a[1] === BLK && a[2] === PEC && a[3] === PEX) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(...a); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, c]) => !c); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
