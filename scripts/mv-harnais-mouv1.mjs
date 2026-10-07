// HARNAIS — MOUV-1 (§259) : le socle du mouvement.
//   node scripts/mv-harnais-mouv1.mjs           → doit être vert
//   node scripts/mv-harnais-mouv1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de src/utils.js (_mvAnim, _mvGraphDessine, _mvGraphTouch, _mvGraphMontre,
// _mvGraphCache, _mvGraphTtCss) dans un DOM minimal, et lit les jetons sur src/styles.css.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { uti: L('src/utils.js'), css: L('src/styles.css') };

function bloc(src, debut, fin) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin introuvable : ' + debut);
  return src.slice(i, j + fin.length);
}
const fn = (src, sig) => bloc(src, sig, '\n}\n');

// ── Un DOM minimal : on ne remplace que le navigateur, jamais le code testé ──
function El(tag, attrs) {
  const e = {
    tagName: tag, attrs: Object.assign({}, attrs || {}), style: {}, children: [], parentNode: null, textContent: '',
    _cls: new Set(), anims: [], _len: 0, offsetParent: {}, offsetTop: 0, clientWidth: 600, clientHeight: 240, offsetWidth: 160, offsetHeight: 40,
    get classList() { const s = e._cls; return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: c => (s.has(c) ? s.delete(c) : s.add(c)) }; },
    set className(v) { e._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }, get className() { return [...e._cls].join(' '); },
    getAttribute: n => (n in e.attrs ? e.attrs[n] : null), setAttribute: (n, v) => { e.attrs[n] = String(v); },
    appendChild: c => { e.children.push(c); c.parentNode = e; return c; },
    removeChild: c => { e.children = e.children.filter(x => x !== c); c.parentNode = null; return c; },
    get lastElementChild() { return e.children.length ? e.children[e.children.length - 1] : null; },
    contains: x => { for (let n = x; n; n = n.parentNode) if (n === e) return true; return false; },
    closest: sel => { for (let n = e; n; n = n.parentNode) if (n._cls && n._cls.has(sel.replace('.', ''))) return n; return null; },
    querySelector: sel => tous(e).find(x => corresp(x, sel)) || null,
    querySelectorAll: sel => tous(e).filter(x => sel.split(',').some(s => corresp(x, s.trim()))),
    getBoundingClientRect: () => ({ top: e._top || 0, left: 0, width: 100, height: 20 }),
    getTotalLength: () => e._len,
    animate: (kf, opts) => { const a = { kf, opts, onfinish: null, cancel() {} }; e.anims.push(a); return a; },
    handlers: {}, addEventListener: (t, f) => { (e.handlers[t] = e.handlers[t] || []).push(f); },
  };
  return e;
}
function tous(e) { const r = []; (function v(n) { n.children.forEach(c => { r.push(c); v(c); }); })(e); return r; }
function corresp(x, sel) {
  const p = sel.split(/\s+/), dernier = p[p.length - 1];
  const ok = s => s.startsWith('.') ? x._cls.has(s.slice(1)) : x.tagName === s;
  if (!ok(dernier)) return false;
  if (p.length === 1) return true;
  for (let n = x.parentNode; n; n = n.parentNode) if (n.tagName === p[0]) return true;
  return false;
}

function monde(S, opts) {
  opts = opts || {};
  let horloge = 0; const file = [];
  const ctx = { Math, Number, String, Array, Object, JSON, Date, parseFloat, parseInt, isFinite, setTimeout: () => 0, clearTimeout() {},
    performance: { now: () => horloge }, requestAnimationFrame: f => { file.push(f); return file.length; },
    _MV_GRAPHS: [], _MV_TRACES: {}, _mvTtGlobal: false, _mvEsc: s => String(s) };
  ctx.window = ctx;
  ctx.matchMedia = () => ({ matches: !!opts.reduit });
  ctx.window._mvGraphW = () => opts.w || 600;
  const head = El('head');
  ctx.document = { head, createElement: t => El(t), getElementById: () => null, addEventListener() {},
    querySelector: () => ctx.__box, elementFromPoint: () => ctx.__sous || null };
  vm.createContext(ctx);
  const U = S.uti;
  const code = bloc(U, 'window._mvAnim = (function(){', '\n})();\n')
    + fn(U, 'function _mvGraphTtCss(){') + '\n'
    + bloc(U, 'window._mvGraphTouch = function(box){', '\n};\n')
    + fn(U, 'function _mvGraphMontre(box, h){') + fn(U, 'function _mvGraphCache(box){')
    + fn(U, 'function _mvGraphDessine(e){')
    + '\nthis.__f = { _mvGraphDessine: _mvGraphDessine, _mvGraphMontre: _mvGraphMontre, _mvGraphCache: _mvGraphCache };';
  vm.runInContext(code, ctx);
  const avancer = ms => { horloge += ms; let n = 0; while (file.length && n < 5000) { const f = file.shift(); f(horloge); n++; } };
  const avancerPas = (ms, pas) => { for (let t = 0; t < ms; t += pas) avancer(pas); };
  return { ctx, f: ctx.__f, A: ctx._mvAnim, avancer, avancerPas, head };
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const css = S.css;
  T('les quatre durées et les trois courbes sont des jetons de :root',
    /--mv-d1:140ms; --mv-d2:240ms; --mv-d3:420ms; --mv-d4:900ms;/.test(css)
    && /--mv-sortie:cubic-bezier\(\.22,1,\.36,1\); --mv-glisse:cubic-bezier\(\.65,0,\.35,1\); --mv-ressort:cubic-bezier\(\.34,1\.56,\.64,1\);/.test(css)
    && css.indexOf('--mv-d1:140ms') < css.indexOf('--ligne'));
  T('« moins d\u2019animations » ramène les quatre durées à 1 ms',
    /@media\(prefers-reduced-motion:reduce\)\{\s*:root\{--mv-d1:1ms;--mv-d2:1ms;--mv-d3:1ms;--mv-d4:1ms\}/.test(css));
  T('le reflet d\u2019une barre existe, et s\u2019éteint sous « moins d\u2019animations »',
    /\.mv-reflet::after\{[^}]*animation:mv-reflet/.test(css) && /\.mv-reflet::after\{animation:none;display:none\}/.test(css));

  let w = monde(S);
  const A = w.A;
  T('_mvAnim expose ses neuf fonctions', ['reduit', 'tween', 'compter', 'rouler', 'noter', 'glisser', 'reflet', 'tracer', 'estMesure'].every(k => typeof A[k] === 'function'));

  // compter : défile depuis la valeur AFFICHÉE, arrive pile, garde data-v.
  const el = El('b', { 'data-v': '10' });
  A.compter(el, 20, v => String(Math.round(v)), 900);
  w.avancer(450);
  const mi = Number(el.textContent);
  w.avancerPas(600, 50);
  T('un chiffre défile de la valeur affichée (10) vers la nouvelle (20), et arrive pile', mi > 10 && mi < 20 && el.textContent === '20' && el.getAttribute('data-v') === '20');
  const el2 = El('b', { 'data-v': '50' });
  A.compter(el2, 60, v => String(Math.round(v)), 900); w.avancer(16);
  T('un écran redessiné repart de ce qu\u2019il montrait, pas de zéro', Number(el2.textContent) >= 50);
  // Le dernier appel prend la main : un long défilement vers 100 ne repasse pas par-dessus un court vers 200.
  const el3 = El('b', { 'data-v': '0' });
  A.compter(el3, 100, v => String(Math.round(v)), 2000);
  A.compter(el3, 200, v => String(Math.round(v)), 300);
  w.avancerPas(2600, 50);
  T('le dernier appel prend la main (200, jamais écrasé par l\u2019ancien défilement vers 100)', el3.textContent === '200');
  let k1 = -1; A.tween(0, k => { k1 = k; });
  T('une durée nulle finit tout de suite (fn(1))', k1 === 1);

  // Moins d'animations : tout arrive à sa fin, rien ne se trace.
  const wr = monde(S, { reduit: true });
  const el4 = El('b', { 'data-v': '3' });
  wr.A.compter(el4, 7, v => String(v), 900);
  let k2 = -1; wr.A.tween(900, k => { k2 = k; });
  T('moins d\u2019animations : le chiffre est posé d\u2019un coup, le tween finit tout de suite', el4.textContent === '7' && k2 === 1);

  // tracer : seules les courbes MESURÉES (trait ≥ 1,8, plein, sans remplissage, colorées).
  const racine = El('div'), svg = racine.appendChild(El('svg'));
  const P = (a, len) => { const p = svg.appendChild(El('path', a)); p._len = len; return p; };
  const mes = P({ fill: 'none', stroke: 'var(--terre)', 'stroke-width': '2' }, 300);
  // Un pointillé ÉPAIS existe dans le vrai code (cave.js : 2,6) : c'est le pointillé qui l'exclut, pas l'épaisseur.
  const prev = P({ fill: 'none', stroke: 'var(--or)', 'stroke-width': '2.6', 'stroke-dasharray': '6 4' }, 300);
  const fin = P({ fill: 'none', stroke: 'var(--gris)', 'stroke-width': '1' }, 300);
  const aire = P({ fill: 'var(--terre)', stroke: 'none', 'stroke-width': '2' }, 300);
  const poly = svg.appendChild(El('polyline', { fill: 'none', stroke: 'url(#g)', 'stroke-width': '1.8' })); poly._len = 200;
  const vide = P({ fill: 'none', stroke: 'var(--terre)', 'stroke-width': '2' }, 0);
  const n = A.tracer(racine);
  T('le tracé ne prend que les courbes mesurées (trait de 2 et polyligne de 1,8 : 2 sur 6)',
    n === 2 && mes.anims.length === 1 && poly.anims.length === 1 && !prev.anims.length && !fin.anims.length && !aire.anims.length && !vide.anims.length);
  T('… et part de sa longueur pour arriver à zéro', mes.style.strokeDasharray === 300 && mes.anims[0].kf[0].strokeDashoffset === 300 && mes.anims[0].kf[1].strokeDashoffset === 0);
  mes.anims[0].onfinish();
  T('… puis rend la courbe intacte (plus de pointillé imposé)', mes.style.strokeDasharray === '' && mes.style.strokeDashoffset === '');
  T('moins d\u2019animations : rien ne se trace', wr.A.tracer(racine) === 0);

  // Le registre : le tracé n'a lieu qu'à la PREMIÈRE peinture, et jamais sur un graphe caché.
  const w2 = monde(S);
  let traces = 0; w2.ctx._mvAnim.tracer = () => { traces++; return 1; };
  const box = El('div'); w2.ctx.__box = box;
  const e = { sel: '#g', build: () => '<svg></svg>', w: 0, el: null, agr: false, max: 0 };
  w2.ctx._MV_GRAPHS.push(e);
  box.firstChild = null; w2.f._mvGraphDessine(e);
  box.firstChild = {}; e.w = 0; w2.f._mvGraphDessine(e);
  T('un graphe se dessine en direct à sa première peinture, pas à la suivante (redimensionnement, écran redessiné)', traces === 1);
  const cache = El('div'); cache.offsetParent = null; w2.ctx.__box = cache;
  const e2 = { sel: '#h', build: () => '<svg></svg>', w: 0, el: null, agr: false, max: 0 };
  w2.f._mvGraphDessine(e2);
  const avantVu = traces;
  cache.offsetParent = {}; e2.w = 0; w2.f._mvGraphDessine(e2);
  T('un graphe caché ne se trace pas, et se tracera quand on le verra', avantVu === 1 && traces === 2);

  // L'infobulle suit : un trait sur le point montré, la souris au survol, le doigt en glissant.
  const w3 = monde(S);
  const b = El('div'), s3 = b.appendChild(El('svg')); s3.viewBox = { baseVal: { width: 600 } }; s3.clientWidth = 300;
  const h1 = s3.appendChild(El('rect', { class: 'mvg-hit', 'data-tt': '<b>lun.</b>', 'data-x': '100', 'data-y': '50' })); h1._cls.add('mvg-hit');
  const h2 = s3.appendChild(El('rect', { class: 'mvg-hit', 'data-tt': '<b>mar.</b>', 'data-x': '200', 'data-y': '60' })); h2._cls.add('mvg-hit');
  w3.ctx.window._mvGraphTouch(b);
  const gd = b.children.find(c => c._cls.has('mvg-guide')), tt = b.children.find(c => c._cls.has('mvg-tt'));
  T('le graphe reçoit son infobulle ET le trait du point montré', !!gd && !!tt && gd.getAttribute('aria-hidden') === 'true');
  b.handlers.pointerdown[0]({ target: h1, pointerType: 'mouse' });
  T('appui sur un point : l\u2019infobulle et le trait s\u2019allument, le trait à l\u2019échelle réelle (100 × 0,5 = 50 px)',
    tt._cls.has('on') && gd._cls.has('on') && gd.style.left === '50px' && b._mvHit === h1);
  w3.ctx.__sous = h2;
  b.handlers.pointermove[0]({ pointerType: 'mouse', clientX: 1, clientY: 1, target: h2 });
  T('la souris glisse sur un autre point : l\u2019infobulle suit (mar.)', b._mvHit === h2 && tt.innerHTML === '<b>mar.</b>' && gd.style.left === '100px');
  w3.ctx.__sous = El('p');
  b.handlers.pointermove[0]({ pointerType: 'mouse', clientX: 1, clientY: 1 });
  T('la souris sort des points : tout s\u2019éteint', !tt._cls.has('on') && !gd._cls.has('on') && b._mvHit === null);
  w3.ctx.__sous = h1;
  b.handlers.pointermove[0]({ pointerType: 'touch', clientX: 1, clientY: 1 });
  T('au doigt, un simple passage ne montre rien (il faut poser le doigt sur le graphe)', !tt._cls.has('on'));
  b.handlers.pointerdown[0]({ target: h1, pointerType: 'touch' });
  w3.ctx.__sous = h2;
  b.handlers.pointermove[0]({ pointerType: 'touch', clientX: 2, clientY: 2, target: h1 });
  T('doigt posé puis glissé : l\u2019infobulle suit ce qui est SOUS le doigt, pas le premier point', b._mvHit === h2);
  b.handlers.pointerup[0]({});
  w3.ctx.__sous = h1;
  b.handlers.pointermove[0]({ pointerType: 'touch', clientX: 3, clientY: 3 });
  T('doigt levé : l\u2019infobulle reste sur le dernier point, sans suivre un passage', b._mvHit === h2);
  const style = w3.head.children.map(c => c.textContent).join('');
  T('la boîte laisse le doigt à la page (défiler, zoomer à deux doigts), le trait a son style, rien à l\u2019impression',
    style.includes('.mvg-box{position:relative;touch-action:pan-y pinch-zoom}') && style.includes('.mvg-guide.on{opacity:.55}') && style.includes('@media print{.mvg-tt,.mvg-guide{display:none}}'));
  T('la nouveauté de MOUV-1 reste au Journal (bloc 8.31, niveau discret, pour tous)',
    /\{ v: '8\.31', d: '2026-10-07', items: \[\n    \{ niv: 0, pour: \['tous'\], emoji: 'graphique',/.test(S.uti));
  return out;
}

function jouer(S) {
  try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; }
}
const res = jouer(SRC0);
let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));

if (CONTRE) {
  const DEF = [
    ['une animation qui joue même sous « moins d\u2019animations »', 'uti', 'if(reduit() || !(dur > 0)){ fn(1); return; }', 'if(!(dur > 0)){ fn(1); return; }'],
    ['l\u2019ancien défilement qui écrase le nouveau', 'uti', 'if(el._mvCpt === jeton) el.textContent', 'el.textContent'],
    ['le prévu (pointillé) qui se trace comme une mesure', 'uti', "(!da || da === 'none' || da === '0') && ", ''],
    ['une aire qui se trace comme une courbe', 'uti', "return fill === 'none' && sw >= 1.8", 'return sw >= 1.8'],
    ['le tracé rejoué à chaque peinture', 'uti', '    _MV_TRACES[e.sel] = 1;\n', ''],
    ['un graphe caché qui consomme son tracé', 'uti', ' && box.offsetParent !== null){', '){'],
    ['plus de trait sur le point montré', 'uti', '  box.appendChild(gd);\n', ''],
    ['l\u2019infobulle qui lit le premier point au lieu de ce qui est sous le doigt', 'uti', "document.elementFromPoint ? document.elementFromPoint(ev.clientX, ev.clientY) : ev.target", 'ev.target'],
    ['la boîte qui confisque le doigt (plus de touch-action)', 'uti', '.mvg-box{position:relative;touch-action:pan-y pinch-zoom}', '.mvg-box{position:relative}'],
    ['« moins d\u2019animations » oublié dans les jetons', 'css', ':root{--mv-d1:1ms;--mv-d2:1ms;--mv-d3:1ms;--mv-d4:1ms}', ':root{}'],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const r = jouer(S), rouge = r.some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
