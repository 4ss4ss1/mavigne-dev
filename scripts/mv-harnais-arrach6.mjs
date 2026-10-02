// HARNAIS — ARRACH-6 : l'arrachage en un geste (déclarer « Arrachée » valide le travail ; valider l'arrachage propose « Arrachée »).
//   node scripts/mv-harnais-arrach6.mjs           → doit être vert
//   node scripts/mv-harnais-arrach6.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions du bloc ARRACH-3/6 (app.js) ; les branchements sont lus dans le source.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const i0 = APP.indexOf('// ══════ ARRACH-3'), i1 = APP.indexOf('// ══════ ARRACHAGE —');
const BLK = sansCom(APP.slice(i0, i1));

function monde(blk, { admin = true, etapes = false, periode = ['Arrachage', 'Prétaille'] } = {}) {
  const log = [], els = {}; const el = id => (els[id] ||= { id, value: '', style: {}, innerHTML: '' });
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite,
    CONFIG: etapes ? { arrachage: { etapes: [{ id: 'souches', lbl: 'Souches' }], apres: 'souches' } } : {},
    PARCELLES: [{ nom: 'Bras', surface: 0.1144, statut: 'Active', taches: {} }, { nom: 'Clos', surface: 1, statut: 'Arrachee', taches: {} }],
    JOURNAL: [], currentUser: { nom: 'Nico' }, _dpCurrentNom: 'Autre',
    isAdmin: () => admin, _mvOnActiveSaison: () => true, _mvEqApplique: e => e, _mvIcon: () => '',
    getTachesSaison: () => periode.map(n => ({ nom: n })), getTacheStatut: (p, n) => (p.taches[n] || 'Non démarré'),
    _mvTacheConcerne: () => false, _mvSelPose: (p, n, on) => { p.selCamp = { [n]: 2026 }; },
    _mvCampRef: () => 2026,
    document: { getElementById: id => (/^arr/.test(id) ? el(id) : null) },
    saveData: k => log.push('save:' + k), openDPArrachage: () => log.push('open:' + ctx._dpCurrentNom) };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(blk + '\nthis.__f={_arrValideRowMaj,_arrValideBascule,_arrValideAuPassage,_arrProposer};', ctx);
  return { ctx, f: ctx.__f, el, log };
}
const P = (w, n) => w.ctx.PARCELLES.find(x => x.nom === n);
function suite(blk) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let w = monde(blk);
  w.f._arrValideRowMaj(P(w, 'Bras'));
  T('feuille « Arracher » : « valider aussi le travail » coché d\u2019office', w.el('arr-valide-row').style.display === '' && /sel vert/.test(w.el('arr-valide-row').innerHTML));
  T('déclarer + case cochée : une entrée Arrachage validée, la parcelle choisie, 100 %',
    w.f._arrValideAuPassage(P(w, 'Bras'), '2026-10-01') && w.ctx.JOURNAL.length === 1 && w.ctx.JOURNAL[0].tache === 'Arrachage'
    && w.ctx.JOURNAL[0].statut === 'Validé' && w.ctx.JOURNAL[0].date === '2026-10-01' && P(w, 'Bras').taches.Arrachage === 'Validé' && P(w, 'Bras').selCamp);
  T('la case ne sert qu\u2019une fois (pas de seconde entrée)', !w.f._arrValideAuPassage(P(w, 'Bras'), '2026-10-01') && w.ctx.JOURNAL.length === 1);
  w = monde(blk); w.f._arrValideRowMaj(P(w, 'Bras')); w.f._arrValideBascule();
  T('case décochée : déclarer n\u2019écrit rien', !w.f._arrValideAuPassage(P(w, 'Bras'), '2026-10-01') && !w.ctx.JOURNAL.length);
  w = monde(blk); P(w, 'Bras').taches.Arrachage = 'Validé'; w.f._arrValideRowMaj(P(w, 'Bras'));
  T('arrachage déjà validé : la case n\u2019apparaît pas', w.el('arr-valide-row').style.display === 'none' && !w.f._arrValideAuPassage(P(w, 'Bras'), '2026-10-01'));
  w = monde(blk, { periode: ['Prétaille'] }); w.f._arrValideRowMaj(P(w, 'Bras'));
  T('arrachage hors de la période : la case n\u2019apparaît pas', w.el('arr-valide-row').style.display === 'none');
  w = monde(blk, { etapes: true }); w.f._arrValideRowMaj(P(w, 'Bras'));
  T('arrachage en étapes : renvoi aux étapes, rien de coché', /\u00e9tapes/.test(w.el('arr-valide-row').innerHTML) && !w.f._arrValideAuPassage(P(w, 'Bras'), '2026-10-01'));
  w = monde(blk);
  T('valider l\u2019arrachage propose « Arrachée » pour LA bonne parcelle, à sa date', w.f._arrProposer('Bras', '2026-09-30') && w.log.includes('open:Bras') && w.el('arr-date').value === '2026-09-30');
  T('pas de proposition pour une parcelle déjà arrachée', !w.f._arrProposer('Clos', '2026-09-30'));
  T('pas de proposition à un salarié', !monde(blk, { admin: false }).f._arrProposer('Bras', '2026-09-30'));
  T('saveArrachage valide au passage AVANT de recalculer', /_arrValideAuPassage\(p,date\);[^\n]*\n  _arrApres\(/.test(fn(APP, 'function saveArrachage(){')));
  T('la feuille « Arracher » prépare la case', /_arrValideRowMaj\(p\)/.test(fn(APP, 'function openDPArrachage(){')) && HTML.includes('id="arr-valide-row"'));
  T('confirmValidation propose « Arrachée » après un arrachage', /_validTache==='Arrachage'&&p\.statut!=='Arrachee'&&isAdmin\(\)&&_arrProposer\(p\.nom,date\)/.test(APP));
  return out;
}
let ok = 0, ko = 0;
suite(BLK).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-6 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['la case n\u2019est pas cochée d\u2019office', b => b.replace('  _ARRV.on=true;\n  _arrValideRowRendre(row);', '  _ARRV.on=false;\n  _arrValideRowRendre(row);')],
  ['la case resservirait (double entrée)', b => b.replace("if(!_ARRV.on||!p) return false;\n  _ARRV.on=false;", "if(!_ARRV.on||!p) return false;")
                                                .replace("if(typeof getTacheStatut==='function'&&getTacheStatut(p,'Arrachage')==='Valid\\u00e9') return false;", '')],
  ['la parcelle n\u2019est pas choisie pour la campagne', b => b.replace("    window._mvSelPose(p,'Arrachage',true);", '')],
  ['la proposition vise la dernière fiche ouverte', b => b.replace('  _dpCurrentNom=nom;\n', '')],
  ['la date de la validation est perdue', b => b.replace("var d=document.getElementById('arr-date'); if(d&&date) d.value=date;", '')],
];
let rg = 0;
D.forEach(([n, fb]) => {
  const b = fb(BLK); if (b === BLK) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(b); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, c]) => !c); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} contre-épreuves rougissent`);
process.exit(rg === D.length ? 0 : 1);
