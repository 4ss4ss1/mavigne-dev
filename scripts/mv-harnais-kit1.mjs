// HARNAIS — KIT-1 (§226) : le kit graphique commun, lot 3a (Accueil + Pilotage).
//   node scripts/mv-harnais-kit1.mjs           → doit être vert
//   node scripts/mv-harnais-kit1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de src/utils.js (_mvkEtat, _mvkDet, _mvkAvancement, _mvkRetards, _mvGraphDessine)
// et lit le reste sur le texte des sources (barre des parcelles, feuille #ovGraph, grands chiffres, largeur PC).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { uti: L('src/utils.js'), app: L('src/app.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), html: L('index.html') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function ligne(src, re) { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; }
const ORD = d => Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);

function monde(S) {
  const ctx = { Math, Number, String, Date, Array, Object, JSON, parseInt,
    _escHtml: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    tNom: n => ({ Brulage: 'Brûlage', Reparation: 'Réparation' }[n] || n), TABREV: { Reparation: 'Répar.', Brulage: 'Brul.' },
    _MV_GRAPHS: [], box: { style: {}, innerHTML: '', firstChild: null } };
  ctx.window = ctx;
  ctx.window._mvGraphW = () => 600;
  ctx.document = { querySelector: () => ctx.box };
  vm.createContext(ctx);
  const U = S.uti;
  const code = ['_mvkNb', '_mvkHa'].map(n => ligne(U, new RegExp('function ' + n + '\\([a-z]\\)\\{[^\\n]*\\n'))).join('')
    + ligne(U, /function _mvkEtat\(pct,enRetard\)\{[^\n]*\n/)
    + ['_mvkDet(t){', '_mvkLigne(nom,pct,etat,det,sous){', '_mvkAvancement(rows,retards){', '_mvkRetards(cd){', '_mvGraphDessine(e){']
        .map(s => sansCom(fn(U, 'function ' + s))).join('\n')
    + '\nthis.__f={_mvkEtat,_mvkDet,_mvkAvancement,_mvkRetards,_mvGraphDessine};';
  vm.runInContext(code, ctx);
  return { ctx, f: ctx.__f };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const w = monde(S), f = w.f;
  T('la couleur dit l\u2019état : fini, en retard (fenêtre passée), en cours — jamais le pourcentage',
    f._mvkEtat(100, false) === 'fait' && f._mvkEtat(100, true) === 'fait' && f._mvkEtat(10, true) === 'retard' && f._mvkEtat(10, false) === 'cours' && f._mvkEtat(45, false) === 'cours');
  T('le détail : heures avec barème, surface sans barème, sinon un tiret',
    f._mvkDet({ h_done: 35, h_total: 53 }) === '35 / 53 h' && f._mvkDet({ h_total: 0, surf_done: 0.07, surf_total: 0.2 }) === '0,07 / 0,20 ha' && f._mvkDet({}) === '\u2014');
  const rows = [{ nom: 'Brulage', pct: 0, h_done: 0, h_total: 460 }, { nom: 'Reparation', pct: 12, h_done: 62, h_total: 517 },
    { nom: 'Relevage', type: 'niveaux', pct: 40, h_done: 40, h_total: 100, detail: [{ num: 1, pct: 100, h_done: 50, h_total: 50 }, { num: 2, pct: 0, h_done: 0, h_total: 25 }, { num: 3, pct: 0, h_done: 0, h_total: 25 }] },
    { nom: 'Dégrafage', pct: 140, h_done: 329, h_total: 329 }];
  const html = f._mvkAvancement(rows, { Brulage: true });
  T('un seul dessin, noms entiers et accentués (« Brûlage », « Réparation », jamais « Répar. »)',
    html.includes('>Brûlage<') && html.includes('>Réparation<') && !html.includes('Répar.'));
  T('… l\u2019état sur chaque ligne : Brûlage en retard, Réparation en cours, Dégrafage fini',
    /Brûlage<\/span><span class="mvk-barre"><i class="mvk-retard"/.test(html) && /Réparation<\/span><span class="mvk-barre"><i class="mvk-cours"/.test(html) && /Dégrafage<\/span><span class="mvk-barre"><i class="mvk-fait" style="width:100%"/.test(html));
  T('… les niveaux du relevage en sous-lignes (N1, N2, N3)', (html.match(/mvk-ligne sous/g) || []).length === 3 && html.includes('>N1<') && html.includes('>N3<'));
  const t0 = new Date(), o = ORD(t0);
  const ret = f._mvkRetards({ taskWindows: [{ nom: 'A', we: o - 3 }, { nom: 'B', we: o }, { nom: 'C', we: o + 5 }] });
  T('en retard = fenêtre passée (fin exclusive) : A et B, pas C', ret.A === true && ret.B === true && !ret.C);
  w.ctx._MV_GRAPHS.push({ sel: '#g', build: () => '<svg aria-label="Essai"></svg>', w: 0, el: null, agr: true, max: 0 });
  f._mvGraphDessine(w.ctx._MV_GRAPHS[0]);
  const avec = w.ctx.box.innerHTML;
  w.ctx.box = { style: {}, innerHTML: '', firstChild: null }; w.ctx.document.querySelector = () => w.ctx.box;
  w.ctx._MV_GRAPHS.push({ sel: '#h', build: () => '<svg aria-label="Essai"></svg>', w: 0, el: null, agr: false, max: 0 });
  f._mvGraphDessine(w.ctx._MV_GRAPHS[1]);
  T('« Agrandir » fait partie du dessin d\u2019un graphe suivi, et se refuse (opts.agrandir === false)',
    /^<button type="button" class="mvk-agr" data-mvk-agr="0"/.test(avec) && avec.includes('<svg') && !w.ctx.box.innerHTML.includes('mvk-agr'));
  T('la feuille #ovGraph existe, ouverte par openOv', /id="ovGraph"/.test(S.html) && /id="graph-inner"/.test(S.html) && /id="graph-titre"/.test(S.html)
    && /window\.openOv\('ovGraph'\)/.test(S.uti) && /e\.agr = !\(opts && opts\.agrandir === false\)/.test(S.uti));
  T('la barre des cartes de parcelle dit l\u2019état (verte finie, dorée sinon), le dégradé reste à la carte',
    /var _fk=\(pct===100\)\?'var\(--vert-med\)':'var\(--or\)';/.test(S.app) && (S.app.match(/fill:_fk,/g) || []).length === 3 && !/fill:_gc,/.test(S.app));
  T('Accueil et Pilotage appellent le même dessin', /window\._mvkAvancement\(data,ret\)/.test(S.app) && /window\._mvkAvancement\(d\.data,_pilRetards\(\)\)/.test(S.pil)
    && !/function _pilBarQte\(/.test(S.pil) && !/function tAbr\(/.test(S.uti) && !/\btAbr\b/.test(sansCom(S.app)));
  const css = S.css;
  T('les grands chiffres en chiffres proportionnels (« 12 % », plus « I 2 % »)', /\.pil-th-stat b,[^{]*\{font-variant-numeric:lining-nums proportional-nums;letter-spacing:0;\}/.test(css)
    && css.lastIndexOf('proportional-nums') > css.indexOf('.pil-th-stat b{'));
  T('une largeur sur grand écran (1 200 px) pour l\u2019Accueil, les Parcelles et le Pilotage',
    /@media \(min-width:1200px\)\{ #page-home,#page-parcelles,#page-pilotage\{max-width:var\(--page-max,1200px\)/.test(css)
    && css.lastIndexOf('.pil-wrap{max-width:var(--page-max,1200px);}') > css.indexOf('.pil-wrap{max-width:1280px'));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nKIT-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b, tout) => S => Object.assign({}, S, { [k]: tout ? S[k].split(a).join(b) : S[k].replace(a, b) });
const D = [
  ['la couleur repart du pourcentage', sub('uti', "return (pct>=100)?'fait':(enRetard?'retard':'cours');", "return (pct>=100)?'fait':(pct<50?'retard':'cours');")],
  ['les noms abrégés reviennent', sub('uti', 'h=_mvkLigne(_escHtml(tNom(t.nom))', 'h=_mvkLigne(_escHtml(TABREV[t.nom]||t.nom)')],
  ['la fenêtre du jour n\u2019est plus « passée »', sub('uti', 'o>=w.we', 'o>w.we')],
  ['« Agrandir » disparaît', sub('uti', 'var agr = (html && e.agr !== false)', 'var agr = (false && e.agr !== false)')],
  ['la barre des parcelles revient au dégradé', sub('app', 'fill:_fk,', 'fill:_gc,', true)],
  ['les pages s\u2019étirent de nouveau', sub('css', '#page-home,#page-parcelles,#page-pilotage{max-width:var(--page-max,1200px)', '#page-home{max-width:none')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (Object.keys(S).every(k => S[k] === SRC0[k])) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
