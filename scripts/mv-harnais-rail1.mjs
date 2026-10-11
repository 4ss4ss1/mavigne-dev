// HARNAIS — RAIL-1 (§313) : la barre latérale dans l'ordre du dock, gardée par thèmes, et son logo dessiné pour 28 px.
//   Le VRAI _dockDef d'app.js et le VRAI coquille.js sont exécutés : la barre doit montrer les entrées du dock dans le même ordre
//   (le Pilotage en tête, puis Terrain, Cave et réserve, Organisation, Réglages au pied). La feuille, les deux dessins du logo
//   (décodés : couverture et couleurs) et le précache du service worker sont lus.
//   node scripts/mv-harnais-rail1.mjs [--contre]
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import zlib from 'zlib'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8'), B = f => fs.readFileSync(path.join(R, f));
const SRC0 = { coq: L('src/coquille.js'), app: L('src/app.js'), css: L('src/styles.css'), sw: L('public/sw.js'),
  clair: B('public/logo-barre.png'), sombre: B('public/logo-barre-sombre.png'), icone: B('public/icon-192.png') };

// Une fonction découpée par ses accolades, chaînes et commentaires sautés.
function corps(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let n = 0, q = null;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    const c = src[j], d = src[j + 1];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '/' && d === '/') { j = src.indexOf('\n', j); if (j < 0) return null; continue; }
    if (c === '/' && d === '*') { j = src.indexOf('*/', j + 2) + 1; if (j <= 0) return null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') n++; else if (c === '}' && --n === 0) return src.slice(i, j + 1);
  }
  return null;
}
// Le vrai dock : _dockDef d'app.js, ses trois portes ouvertes ou fermées.
function dock(S, pil, mode) {
  const f = corps(S.app, 'function _dockDef(){'); if (!f) throw new Error('_dockDef introuvable dans app.js');
  const ctx = { _canPilotage: () => pil, _mvCan: () => true, _mvMode: () => mode || '' };
  vm.createContext(ctx); vm.runInContext(f, ctx); return vm.runInContext('_dockDef()', ctx);
}
function monde(S) {
  const ctx = { Math, String, Array, Object, JSON, Number, matchMedia: () => ({ matches: true, addEventListener() {} }), document: { addEventListener() {} }, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvIcon = n => '<svg data-ic="' + n + '"></svg>'; vm.createContext(ctx); vm.runInContext(S.coq, ctx); return ctx;
}
const ordre = h => [...h.matchAll(/data-page="([^"]+)"/g)].map(m => m[1]).join();
const MOI = { nom: 'Nico', ini: 'N', role: 'Administration' }, DOM = { nom: 'Domaine', sous: '' };

// PNG 8 bits RGBA, non entrelacé (la forme des deux dessins) : en-tête, puis pixels défiltrés.
function png(buf) {
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  let o = 8, w = 0, h = 0, prof = 0, type = 0, entrel = 0; const idat = [];
  while (o < buf.length) {
    const n = buf.readUInt32BE(o), t = buf.slice(o + 4, o + 8).toString('latin1'), d = buf.slice(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); prof = d[8]; type = d[9]; entrel = d[12]; }
    if (t === 'IDAT') idat.push(d);
    o += 12 + n;
  }
  const im = { w, h, prof, type, px: null };
  if (prof !== 8 || type !== 6 || entrel !== 0) return im;
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, ligne = w * bpp, px = Buffer.alloc(h * ligne);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (ligne + 1)], src = y * (ligne + 1) + 1;
    for (let x = 0; x < ligne; x++) {
      const a = x >= bpp ? px[y * ligne + x - bpp] : 0, b = y ? px[(y - 1) * ligne + x] : 0, c = (x >= bpp && y) ? px[(y - 1) * ligne + x - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = f === 1 ? a : f === 2 ? b : f === 3 ? ((a + b) >> 1) : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
      px[y * ligne + x] = (raw[src + x] + pred) & 255;
    }
  }
  im.px = px; return im;
}
// Part des pixels opaques, et part de ceux qui sont proches d'une couleur donnée (distance RGB).
function couverture(im) { let n = 0; for (let i = 3; i < im.px.length; i += 4) if (im.px[i] > 200) n++; return n / (im.w * im.h); }
function proches(im, hex, tol) {
  const c = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)); let n = 0, op = 0;
  for (let i = 0; i < im.px.length; i += 4) { if (im.px[i + 3] <= 200) continue; op++; if (Math.hypot(im.px[i] - c[0], im.px[i + 1] - c[1], im.px[i + 2] - c[2]) <= tol) n++; }
  return op ? n / op : 0;
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const W = monde(S);
  const D = dock(S, true, '');
  T('le vrai _dockDef est lu : 8 entrées pour un administrateur, du Pilotage aux Réglages', D.length === 8 && D[0].p === 'pilotage' && D[7].p === 'reglages');
  const h = W._railHtml(D, MOI, DOM), Rb = W._railRubriques(D);
  T('la barre montre les entrées dans l’ordre du dock (' + ordre(h) + ')', ordre(h) === D.map(x => x.p).join());
  T('le Pilotage en tête, sous la recherche, sans titre de thème au-dessus', h.indexOf('id="mv-rail-cherche"') < h.indexOf('data-page="pilotage"') && h.indexOf('data-page="pilotage"') < h.indexOf('class="mv-rail-sec"') && Rb.tete.map(x => x.p).join() === 'pilotage');
  T('trois thèmes dans l’ordre : Terrain, Cave et réserve, Organisation — plus de « Gestion »', Rb.rub.map(r => r.nom).join() === 'Terrain,Cave et réserve,Organisation' && !h.includes('>Gestion<'));
  T('Réglages au pied, juste au-dessus de la personne', /<div class="mv-rail-bas"><button class="mv-rail-b"[^>]*data-page="reglages"[\s\S]*?<\/button><div class="mv-rail-moi">/.test(h) && Rb.pied.map(x => x.p).join() === 'reglages');
  T('la pastille vivante reste sur le Pilotage', /data-page="pilotage"[^]*?mv-rail-vif[^]*?<\/button>/.test(h.slice(h.indexOf('data-page="pilotage"'), h.indexOf('class="mv-rail-sec"'))));
  const D2 = dock(S, false, ''), h2 = W._railHtml(D2, MOI, DOM), R2 = W._railRubriques(D2);
  T('sans Pilotage (salarié) : la barre s’ouvre sur Terrain, Réglages reste au pied, même ordre que le dock', ordre(h2) === D2.map(x => x.p).join() && !R2.tete.length && D2[0].p === 'home' && R2.pied.map(x => x.p).join() === 'reglages');
  const D3 = dock(S, true, 'tracteur'), R3 = W._railRubriques(D3);
  T('mode tracteur : Terrain s’ouvre sur Tracteur, Phyto, Vigne, comme le dock', R3.rub[0].nom === 'Terrain' && R3.rub[0].items.map(x => x.p).join() === 'tracteur,phyto,home' && D3.slice(0, 3).map(x => x.p).join() === 'tracteur,phyto,home');
  const DX = D.slice(0, 7).concat([{ p: 'nouveau', ic: 'liste', l: 'Nouveau' }], D.slice(7)), RX = W._railRubriques(DX);
  T('un module que la barre ne connaît pas rejoint « Organisation », jamais perdu', RX.rub.some(r => r.nom === 'Organisation' && r.items.some(x => x.p === 'nouveau')) && ordre(W._railHtml(DX, MOI, DOM)).includes('nouveau'));
  T('le logo n’est plus l’icône de l’appli réduite : un dessin posé par la feuille', !S.coq.includes('icon-192.png') && h.includes('<span class="mv-rail-logo" aria-hidden="true"></span>'));
  const a = S.css.indexOf('/* ★ RAIL-1 (§313)'), b = S.css.indexOf('/* ★ FIN RAIL-1 */'), BL = a >= 0 && b > a ? S.css.slice(a, b) : '';
  T('la feuille : dessin clair par défaut, dessin sombre dans les deux cas du thème sombre (forcé, automatique sauf clair forcé)',
    BL.includes('body .mv-rail .mv-rail-logo{ background:url(/logo-barre.png) center / contain no-repeat; }')
    && BL.includes(':root[data-theme="dark"] body .mv-rail .mv-rail-logo{ background-image:url(/logo-barre-sombre.png); }')
    && /@media\(prefers-color-scheme:dark\)\{\s*:root:not\(\[data-theme="light"\]\) body \.mv-rail \.mv-rail-logo\{ background-image:url\(\/logo-barre-sombre\.png\); \}\s*\}/.test(BL));
  const C = png(S.clair), N = png(S.sombre), I = png(S.icone);
  T('les deux dessins : PNG avec transparence, au moins 3 fois les 28 px affichés, distincts de l’icône et l’un de l’autre',
    !!C && !!N && C.px && N.px && C.w >= 84 && C.h === C.w && N.w >= 84 && N.h === N.w && sha(S.clair) !== sha(S.icone) && sha(S.sombre) !== sha(S.icone) && sha(S.clair) !== sha(S.sombre));
  const cC = C && C.px ? couverture(C) : 0, cI = I && I.px ? couverture(I) : 1;
  T('trait épaissi : le dessin couvre au moins une fois et demie la surface de l’icône (' + Math.round(cC * 100) + ' % contre ' + Math.round(cI * 100) + ' %)', cC >= cI * 1.5);
  T('couleurs franches en clair : la grappe en lie-de-vin de l’accent (#7A2850), les lettres en jaune doré',
    C && C.px && proches(C, '#7A2850', 40) >= 0.35 && proches(C, '#E2BC1C', 45) >= 0.15 && proches(C, '#EBDF52', 20) < 0.05);
  T('en sombre : une grappe plus vive que l’accent, le jaune d’origine', N && N.px && proches(N, '#B4467C', 40) >= 0.35 && proches(N, '#F0E040', 30) >= 0.15);
  const sh = (S.sw.match(/const SHELL_STATIC = \[([^\]]*)\]/) || [])[1] || '';
  T('hors réseau aussi : les deux dessins sont dans le précache du service worker', sh.includes("'./logo-barre.png'") && sh.includes("'./logo-barre-sombre.png'"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const PLANNING = "  if(_mvCan('planning')) it.push({p:'planning',ic:'calendrier',l:'Planning'});\n", CAVE = "  if(_mvCan('cave')) it.push({p:'cave',ic:'verre',l:'Cave'});\n";
  const DEF = [
    ['le Pilotage rangé dans un thème', 'coq', [["const TETE = 'pilotage', PIED = 'reglages';", "const TETE = '', PIED = 'reglages';"]]],
    ['Réglages remonté parmi les thèmes', 'coq', [["const TETE = 'pilotage', PIED = 'reglages';", "const TETE = 'pilotage', PIED = '';"]]],
    ['Cave et réserve après Organisation', 'coq', [["const ORDRE_RUB = ['Terrain', 'Cave et réserve', 'Organisation'];", "const ORDRE_RUB = ['Terrain', 'Organisation', 'Cave et réserve'];"]]],
    ['le dock réordonné sans que la barre suive (Planning avant Cave)', 'app', [[PLANNING, ''], [CAVE, PLANNING + CAVE]]],
    ['un module inconnu perdu', 'coq', [["const r = RUB[x.p] || 'Organisation';", 'const r = RUB[x.p];']]],
    ['le logo revenu à l’icône de l’appli', 'coq', [['<span class="mv-rail-logo" aria-hidden="true"></span>', '<img class="mv-rail-logo" src="/icon-192.png" alt="">']]],
    ['le thème sombre automatique oublié', 'css', [['@media(prefers-color-scheme:dark){ :root:not([data-theme="light"]) body .mv-rail .mv-rail-logo{ background-image:url(/logo-barre-sombre.png); } }\n', '']]],
    ['les dessins hors du précache', 'sw', [["'./logo-barre.png', './logo-barre-sombre.png', ", '']]],
    ['le dessin clair remplacé par l’icône pâle', 'clair', null],
  ];
  let m = 0;
  DEF.forEach(([nom, f, reps]) => {
    const S = Object.assign({}, SRC0);
    if (f === 'clair') S.clair = SRC0.icone;
    else for (const [a, b] of reps) { if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom + ' (motif absent ou multiple)'); m++; return; } S[f] = S[f].replace(a, b); }
    const rouge = jouer(S).some(x => !x[1]); if (!rouge) { console.log('  !!  contre-épreuve muette : ' + nom); m++; } else console.log('  ok  rougit : ' + nom);
  });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
