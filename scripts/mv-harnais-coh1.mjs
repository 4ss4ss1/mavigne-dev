// HARNAIS — COH-1 : un même chiffre, un même nom, une même surface, sur tous les écrans.
//   node scripts/mv-harnais-coh1.mjs           → doit être vert
//   node scripts/mv-harnais-coh1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites des sources : calcHeures + _mvTFaite + getPCls (app.js, avec le
// bloc ARRACH-3), _pvSurfFr / _pvCompte / _qte (app.js), _pilBarQte (pilotage.js), tNom / tAbr (utils.js).
// Le reste (CSS des cartes, puces, journal, points de suspension) se vérifie sur le texte des sources.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { app: lire('src/app.js'), pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), css: lire('src/styles.css') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function ligne(src, re) { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; }
function bloc(src, debut, fin) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); return src.slice(i, src.indexOf(fin, i) + fin.length); }

function monde(S) {
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, Date,
    CONFIG: { arrachage: { etapes: [{ id: 'demontage', lbl: 'Démontage' }, { id: 'souches', lbl: 'Souches', presta: true }, { id: 'ramassage', lbl: 'Ramassage', presta: true }], apres: 'souches' } },
    PARCELLES: [
      { nom: 'Bras', surface: 0.1, statut: 'Arrachee', taches: {}, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' } } } },
      { nom: 'Charreux', surface: 0.1, statut: 'Arrachee', taches: {}, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' } } } },
      { nom: 'Clos', surface: 0.5, statut: 'En exploitation', taches: { Taille: 'Validé' } },
      { nom: 'Vigne2', surface: 0.25, statut: 'En exploitation', taches: {} }],
    JOURNAL: [], TRAVAUX: { Arrachage: { pct: 0 } }, SAISON_PASSAGES: {},
    _mvCampRef: () => 2026, _escHtml: s => String(s), _escAttr: s => String(s), fmtDate: d => d, _mvIcon: () => '',
    getTachesSaison: () => [{ nom: 'Arrachage' }, { nom: 'Taille', hha: 70 }],
    getTacheStatut: (p, n) => (p.taches[n] || 'Non démarré'),
    _visuSaison: () => '', getSaisonActive: () => ({}), pctColor: () => 'x', _mvExclu: () => false,
    _mvISO: d => d.toISOString().slice(0, 10), _pilNum: n => Math.round(Number(n) || 0).toLocaleString('fr-FR') };
  ctx._parcConcern = n => ctx.PARCELLES.filter(p => (n === 'Arrachage') ? p.statut === 'Arrachee' : p.statut !== 'Arrachee');
  ctx._surfConcern = n => ctx._parcConcern(n).reduce((a, p) => a + (parseFloat(p.surface) || 0), 0);
  ctx.window = ctx; vm.createContext(ctx);
  const A = S.app, U = S.uti;
  const code = sansCom(bloc(A, '// ══════ ARRACH-3', '// ══════ ARRACHAGE —'))
    + '\n' + sansCom(fn(A, 'function _mvTFaite(p,nom){') + fn(A, 'function calcHeures(){') + fn(A, 'function getPCls(p){'))
    + '\n' + ligne(A, /function _mvArrHors\(p,nom\)\{[^\n]*\n/)
    + ligne(A, /function _pvSurfFr\(s\)\{[^\n]*\n/) + ligne(A, /function _pvNbFait\(cl\)\{[^\n]*\n/) + ligne(A, /function _pvCompte\(cl\)\{[^\n]*\n/)
    + ligne(A, /function _haT\(v\)\{[^\n]*\}/) + '\n' + ligne(A, /function _qte\(t\)\{[^\n]*\}/) + '\n'
    + sansCom(fn(S.pil, 'function _pilBarQte(t){'))
    + bloc(U, 'export const TABREV = {', '};').replace('export ', '') + '\n'
    + bloc(U, 'export const TLIB = {', '};').replace('export ', '') + '\n'
    + ligne(U, /export function tLib\(nom\)[^\n]*\n/).replace('export ', '')
    + ligne(U, /export function tNom\(nom\)[^\n]*\n/).replace('export ', '')
    + ligne(U, /export function tAbr\(nom\)[^\n]*\n/).replace('export ', '')
    + '\nthis.__f={calcHeures,getPCls,_pvSurfFr,_pvCompte,_qte,_pilBarQte,tNom,tAbr};';
  vm.runInContext(code, ctx);
  return { ctx, f: ctx.__f };
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const w = monde(S);
  const ch = w.f.calcHeures(); const arr = ch.data.find(t => t.nom === 'Arrachage'); const tai = ch.data.find(t => t.nom === 'Taille');
  T('Pilotage : l\u2019arrachage découpé compte la part de ses étapes (1/3 → 33 %), plus 0 %', arr && arr.pct === 33);
  T('le même chiffre que la carte de la parcelle', arr && arr.pct === w.f.getPCls(w.ctx.PARCELLES[0]).pct);
  T('TRAVAUX n\u2019est plus réécrit à 0 derrière recalcTravaux', w.ctx.TRAVAUX.Arrachage && w.ctx.TRAVAUX.Arrachage.pct === 33);
  T('la ligne porte sa surface faite et concernée (0,07 sur 0,2 ha)', arr && arr.surf_done === 0.07 && Math.abs(arr.surf_total - 0.2) < 1e-9 && arr.h_total === 0);
  T('une tâche au barème ne bouge pas (Taille : 67 %, 35 h faites sur 53)', tai && tai.pct === 67 && tai.h_done === 35 && tai.h_total === 53);
  T('Pilotage : sans barème, la ligne s\u2019écrit en surface', w.f._pilBarQte(arr) === '0,07/0,20 ha');
  T('Pilotage : avec barème, elle reste en heures', w.f._pilBarQte(tai) === '35/53 h');
  T('Pilotage : ni heures ni surface → un tiret, plus « 0/0 h »', w.f._pilBarQte({ h_total: 0, surf_total: 0 }) === '\u2014');
  T('Accueil : la même règle (0,07 / 0,20 ha · 35h / 53h)', w.f._qte(arr) === '0,07 / 0,20 ha' && w.f._qte(tai) === '35h / 53h');
  T('carte : le compte suit le pourcentage (« 0,3/1 tâche », « 1,5/2 tâches »)',
    w.f._pvCompte(w.f.getPCls(w.ctx.PARCELLES[0])) === '0,3/1 t\u00e2che' && w.f._pvCompte({ nbDone: 1, part: 0.5, nbTotal: 2 }) === '1,5/2 t\u00e2ches');
  T('surface d\u2019une parcelle au centiare (0,0870 · 0,1144 · vide)', w.f._pvSurfFr(0.087) === '0,0870' && w.f._pvSurfFr('0,1144') === '0,1144' && w.f._pvSurfFr('') === '');
  T('un seul nom, entier et accentué (Brûlage, Réparation, Désherbage)', w.f.tNom('Brulage') === 'Brûlage' && w.f.tNom('Reparation') === 'Réparation' && w.f.tNom('Desherbage') === 'Désherbage');
  T('une tâche du domaine garde son nom ; la forme courte reste à tAbr', w.f.tNom('Dégraffage') === 'Dégraffage' && w.f.tAbr('Reparation') === 'Répar.' && w.f.tAbr('Ebourgeonnage') === 'Ébourg.');
  const A = S.app;
  T('puces de Parcelles : le nom affiché, plus la clé', /onclick="setPTacheFilter\('\$\{_escAttr\(t\.nom\)\}',this\)">\$\{_escHtml\(tNom\(t\.nom\)\)\}<\/div>/.test(A));
  T('journal : plus aucune lecture directe de TABREV dans app.js', !/TABREV\[/.test(A) && /const tacheAff=_escHtml\(tNom\(r\.tache\)/.test(A));
  T('« Ma part du chantier » : pas de point derrière « … »', A.includes("'\\u2026':'.')):'.')") && !A.includes("'\\u2026':'')):'')+'.'"));
  T('cartes du Pilotage confinées sous la barre du bas', /\.pil-map\{position:relative;z-index:0;/.test(S.css) && /\.pil-dz-map,\.pil-dz-svg\{position:relative;z-index:0;/.test(S.css));
  T('« 0,0 ETP tracteur » ne s\u2019affiche plus', S.pil.includes('(_tH>0&&_cr>0&&_tH/_cr>=0.05)'));
  T('la journée de référence dit ce qu\u2019elle fait (repli des échéances)', /h_jour: *\{[^}]*repli des <b>\\u00e9ch\\u00e9ances/.test(S.pil) && !/h_jour: *\{[^}]*cart de cadence/.test(S.pil));
  return out;
}

let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nCOH-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => S => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['calcHeures ne connaît plus que « Validé »', sub('app', '*_mvTFaite(p,t.nom),0);', "*(getTacheStatut(p,t.nom)==='Validé'?1:0),0);")],
  ['_mvTFaite oublie l\u2019arrachage découpé', sub('app', 'return _arrFraction(p)||0;', 'return 0;')],
  ['le Pilotage repasse en heures pour tout', sub('pil', 'if((t.h_total||0)>0) return', 'if(true) return')],
  ['l\u2019Accueil repasse en heures pour tout', sub('app', 'return (t.h_total>0||!(t.surf_total>0))?', 'return (true)?')],
  ['tNom relit les abréviations et les clés brutes', sub('uti', 'export function tNom(nom) { return tLib(nom); }', 'export function tNom(nom) { return TABREV[nom] || nom; }')],
  ['le compte oublie la part de l\u2019arrachage', sub('app', '+((cl&&cl.part)||0))*10', ')*10')],
  ['la surface repasse en brut', sub('app', "return isFinite(v)?v.toFixed(4).replace('.',','):String(s);", "return String(s).replace('.',',');")],
  ['les puces affichent la clé', sub('app', `onclick="setPTacheFilter('\${_escAttr(t.nom)}',this)">\${_escHtml(tNom(t.nom))}</div>`, `onclick="setPTacheFilter('\${_escAttr(t.nom)}',this)">\${t.nom}</div>`)],
  ['le journal relit TABREV', sub('app', 'const tacheAff=_escHtml(tNom(r.tache)+', 'const tacheAff=_escHtml((TABREV[r.tache]||r.tache)+')],
  ['le point revient derrière « … »', sub('app', "'\\u2026':'.')):'.')", "'\\u2026':'')):'')+'.'")],
  ['la carte du domaine ressort de son cadre', sub('css', '.pil-map{position:relative;z-index:0;', '.pil-map{')],
  ['« 0,0 ETP tracteur » revient', sub('pil', '(_tH>0&&_cr>0&&_tH/_cr>=0.05)', '(_tH>0)')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (['app', 'pil', 'uti', 'css'].every(k => S[k] === SRC0[k])) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
