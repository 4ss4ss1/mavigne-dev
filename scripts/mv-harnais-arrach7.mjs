// HARNAIS — ARRACH-7 : l'arrachage découpé lu deux fois — la part faite (domaine) et le fini pour l'équipe.
//   node scripts/mv-harnais-arrach7.mjs           → doit être vert
//   node scripts/mv-harnais-arrach7.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js (bloc ARRACH-3, getPCls, _mvPartTache, _mvPartCalc).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const BLK = sansCom(APP.slice(APP.indexOf('// ══════ ARRACH-3'), APP.indexOf('// ══════ ARRACHAGE —')));
const EXTRA = sansCom(fn(APP, 'function getPCls(p){') + fn(APP, 'function _mvPartTache(){') + fn(APP, 'function _mvPartCalc(tache,nom){')
  + APP.match(/function _mvArrHors\(p,nom\)\{[^\n]*\n/)[0]);
const RECALC = fn(APP, 'function recalcTravaux(nomTache){');

function monde(blk, extra) {
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, Date,
    CONFIG: { arrachage: { etapes: [{ id: 'demontage', lbl: 'Démontage' }, { id: 'souches', lbl: 'Souches', presta: true }, { id: 'ramassage', lbl: 'Ramassage', presta: true }], apres: 'souches' } },
    PARCELLES: [
      { nom: 'Bras', surface: 0.1, statut: 'Arrachee', taches: {}, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' } } } },
      { nom: 'Charreux', surface: 0.1, statut: 'Arrachee', taches: {}, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' } } } }],
    JOURNAL: [{ tache: 'Arrachage', date: new Date().toISOString().slice(0, 10), parcelle: 'Bras', statut: 'Validé', qui: 'Nico' }],
    TRAVAUX: { Arrachage: { pct: 33 }, 'Pré-taille': { pct: 10 } },
    _mvCampRef: () => 2026, _escHtml: s => String(s), _escAttr: s => String(s), fmtDate: d => d, _mvIcon: () => '',
    getTachesSaison: () => [{ nom: 'Arrachage' }, { nom: 'Pré-taille' }],
    getTacheStatut: (p, n) => (p.taches[n] || 'Non démarré'),
    _visuSaison: () => '', getSaisonActive: () => ({}), pctColor: () => 'x', _mvExclu: () => false,
    _mvISO: d => d.toISOString().slice(0, 10) };
  ctx._parcConcern = n => ctx.PARCELLES.filter(p => n === 'Arrachage' || p.statut !== 'Arrachee');
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(blk + '\n' + extra + '\nthis.__f={_arrFraction,_arrEquipeFinie,_arrEquipeFiniePartout,getPCls,_mvPartTache,_mvPartCalc};', ctx);
  return { ctx, f: ctx.__f };
}
function suite(blk, extra, recalc) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let w = monde(blk, extra);
  const B = w.ctx.PARCELLES[0];
  T('part faite : 1 étape sur 3 → 1/3', Math.abs(w.f._arrFraction(B) - 1 / 3) < 1e-9);
  T('fini pour l\u2019équipe : le démontage (seule étape équipe) est fait', w.f._arrEquipeFinie(B));
  T('partout fini pour l\u2019équipe', w.f._arrEquipeFiniePartout());
  T('la carte de la parcelle montre la part faite (33 %), pas 0 %', w.f.getPCls(B).pct === 33 && w.f.getPCls(B).nbDone === 0);
  T('« Ma part » passe au chantier suivant', w.f._mvPartTache() === 'Pré-taille');
  const pc = w.f._mvPartCalc('Arrachage', 'Nico');
  T('« Ma part » lit l\u2019arrachage côté équipe (100 %, rien ne reste)', pc.pct === 100 && pc.restN === 0);
  w.ctx.PARCELLES[1].arrEtapes.f = {};
  T('une parcelle sans démontage : pas fini pour l\u2019équipe, le chantier reste', !w.f._arrEquipeFiniePartout() && w.f._mvPartTache() === 'Arrachage');
  T('validée d\u2019un bloc : vaut 1 et « finie »', (B.taches.Arrachage = 'Validé', w.f._arrFraction(B) === 1 && w.f._arrEquipeFinie(B)));
  w = monde(blk, extra); w.ctx.CONFIG = {};
  T('sans découpage : rien ne change (l\u2019équipe n\u2019est pas « finie »)', !w.f._arrEquipeFiniePartout() && w.f.getPCls(w.ctx.PARCELLES[0]).pct === 0);
  T('recalcTravaux : l\u2019avancement du domaine compte la part des étapes', /acc\+\(parseFloat\(p\.surface\)\|\|0\)\*_arrFraction\(p\)/.test(recalc));
  return out;
}
let ok = 0, ko = 0;
suite(BLK, EXTRA, RECALC).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-7 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['le prestataire compte comme l\u2019équipe', b => b.replace('return E.filter(function(e){return !e.presta;}).every(', 'return E.every('), e => e, r => r],
  ['la part faite oubliée dans la carte', b => b, e => e.replace('Math.round((nbDone+_arrPart)/totalSaison*100)', 'Math.round(nbDone/totalSaison*100)'), r => r],
  ['« Ma part » ne saute plus l\u2019arrachage', b => b, e => e.replace("if(t.nom==='Arrachage'&&typeof _arrEquipeFiniePartout==='function'&&_arrEquipeFiniePartout())return;", '').replace("if(t.nom==='Arrachage'&&typeof _arrEquipeFiniePartout==='function'&&_arrEquipeFiniePartout())return false;", ''), r => r],
  ['« Ma part » relit le statut du domaine', b => b, e => e.replace('? function(p){ return _arrEquipeFinie(p); }', "? function(p){ return getTacheStatut(p,tache)==='Valid\\u00e9'; }"), r => r],
  ['une parcelle vide déclarée finie partout', b => b.replace('return L.length>0&&L.every(_arrEquipeFinie);', 'return L.some(_arrEquipeFinie);'), e => e, r => r],
];
let rg = 0;
D.forEach(([n, fb, fe, fr]) => {
  const a = fb(BLK), b = fe(EXTRA), c = fr(RECALC);
  if (a === BLK && b === EXTRA && c === RECALC) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(a, b, c); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
