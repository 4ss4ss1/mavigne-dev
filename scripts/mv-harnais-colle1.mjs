// HARNAIS — COLLE-1 (§412) : « En direct » au-dessus d'« À savoir » dans la colonne de droite, collés SOUS le bandeau et
// les onglets ; « En direct » à la hauteur d'une journée calme, « Tout voir (N) » qui le déplie.
//   node scripts/mv-harnais-colle1.mjs           → doit être vert
//   node scripts/mv-harnais-colle1.mjs --contre  → chaque défaut réinjecté doit rougir
// Lit cockpit-vue.js (RANGS, colleHaut, ranger, majFil, le geste, l'observateur), pilotage.js (renderPilotage), le bloc
// ★ COLLE-1 de styles.css (avant TETE-2), l'aide et le guide ; EXÉCUTE filTaille et _pilEnteteBas avec un DOM minime.
// Ce qu'il ne voit pas : une mise en page. Le rendu a été mesuré dans Chromium (1 518 × 726, 1 280 × 800, 390 × 844,
// clair et sombre) — §412.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { ck: L('src/cockpit-vue.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: L('src/utils.js'),
  guide: L('guide/11-pilotage.html'), liste: L('scripts/mv-harnais-liste.mjs') };
// Le corps d'une fonction, par comptage d'accolades, chaînes et commentaires sautés. `sig` finit par « { ».
function corps(src, sig) {
  const i = src.indexOf(sig); if (i < 0) return '';
  let p = 0, j = i + sig.length - 1;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); if (j < 0) return ''; continue; }
    if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j + 2) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { const q = c; for (j++; j < src.length && src[j] !== q; j++) if (src[j] === '\\') j++; continue; }
    if (c === '{') p++; else if (c === '}' && --p === 0) return src.slice(i, j + 1);
  }
  return '';
}
function rangs(S) { const f = corps(S.ck, 'const RANGS = {'); if (!f) return null; try { return vm.runInNewContext('(' + f.slice('const RANGS = '.length) + ')'); } catch (e) { return null; } }
const jeu = set => ({ add: (...k) => k.forEach(x => set.add(x)), remove: (...k) => k.forEach(x => set.delete(x)), contains: k => set.has(k),
  toggle: (k, on) => { const v = on === undefined ? !set.has(k) : !!on; if (v) set.add(k); else set.delete(k); return v; } });
function filTaille(S, cas) {
  const f0 = corps(S.ck, 'function filTaille() {'); if (!f0) return null;
  const cls = new Set(cas.classes || []), lc = new Set();
  const f = { parentElement: { id: cas.col }, classList: jeu(cls), scrollHeight: cas.sh, clientHeight: cas.ch };
  const b = { hidden: false, textContent: '', at: {}, setAttribute(k, v) { this.at[k] = v; } };
  const c = { $: q => ({ '#ck-fil': f, '#ck-fil-tout': b, '#ck-fil-l': { classList: jeu(lc) } })[q] || null, String,
    S: { evts: new Array(cas.evts).fill(0), filTout: !!cas.filTout, filOuvert: !!cas.ouvert }, coursItems: () => new Array(cas.cours).fill(0) };
  try { vm.createContext(c); vm.runInContext(f0 + ';filTaille();', c); } catch (e) { return null; }
  return [...cls].sort().join(' ') + '|' + (b.hidden ? 'caché' : b.textContent) + '|' + (b.at['aria-expanded'] || '-') + '|' + (lc.has('tout') ? 'tout' : '-');
}
function enteteBas(S, top, h) {
  const f0 = corps(S.pil, 'function _pilEnteteBas(){'); if (!f0) return null;
  const pose = [], hd = { getBoundingClientRect: () => ({ height: h }) };
  const c = { document: { querySelector: q => q === '#page-pilotage .mod-header' ? hd : null, documentElement: { style: { setProperty: (k, v) => pose.push(k + '=' + v) } } },
    getComputedStyle: () => ({ top }), window: {}, Math, parseFloat };
  try { vm.createContext(c); vm.runInContext(f0 + ';_pilEnteteBas();', c); } catch (e) { return null; }
  return pose.join(',') || 'rien';
}
function bloc(css) { const i = css.indexOf('★ COLLE-1 (§412)'); if (i < 0) return ''; const j = css.indexOf('★ FIN COLLE-1', i); return j < 0 ? '' : css.slice(i, j); }
function verifs(S) {
  const r = [], ok = (n, v, d) => r.push([n, !!v, d || '']);
  const G = rangs(S), t = G && G.t;
  ok('A. large : « En direct » puis « À savoir » en colonne de droite, rien d’autre', t && JSON.stringify(t.large) === JSON.stringify([['verdict', 'decision'], ['plan', 'chant', 'courbe'], ['fil', 'savoir']]), t && JSON.stringify(t.large));
  ok('B. moyen : la colonne de droite = [fil, savoir]', t && JSON.stringify(t.moyen) === JSON.stringify([['verdict', 'decision', 'plan', 'chant', 'courbe'], [], ['fil', 'savoir']]), t && JSON.stringify(t.moyen));
  ok('C. téléphone inchangé', t && JSON.stringify(t.petit) === JSON.stringify([['verdict', 'savoir', 'decision', 'plan', 'fil', 'chant', 'courbe'], [], []]));
  ok('D. colleHaut compte le bandeau', corps(S.ck, 'function colleHaut() {').includes("'#page-pilotage .mod-header, #page-pilotage .pil-portee, #page-pilotage .pil-tabsbar'"));
  ok('E. ranger remesure « En direct »', /\n {2}filTaille\(\);/.test(corps(S.ck, 'function ranger() {')));
  ok('F. majFil remesure « En direct », et après les animations', /filTaille\(\); setTimeout\(filTaille, 520\)/.test(corps(S.ck, 'function majFil() {')));
  ok('G. « Tout voir » dans la colonne de droite déplie / replie', S.ck.includes("if (plus && plus.id === 'ck-fil-tout' && plus.closest('#ck-t-c')) { S.filOuvert = !S.filOuvert; filTaille(); return; }"));
  ok('H. l’observateur suit le bandeau', S.ck.includes("const hd = document.querySelector('#page-pilotage .mod-header'); if (hd) obs.observe(hd);"));
  const cas = [
    ['I1. chargé, replié : fondu et « Tout voir (10) »', { col: 'ck-t-c', sh: 900, ch: 186, cours: 3, evts: 7 }, 'deborde|Tout voir (10)|false|-'],
    ['I2. chargé, déplié : « Replier », toute la liste', { col: 'ck-t-c', sh: 1105, ch: 1105, cours: 3, evts: 7, ouvert: 1, classes: ['deborde'] }, 'deborde ouvert|Replier|true|tout'],
    ['I3. calme : ni fondu ni bouton (tolérance d’arrondi)', { col: 'ck-t-c', sh: 186, ch: 185, cours: 0, evts: 0 }, '|caché|false|-'],
    ['I4. téléphone, 7 faits : « Tout le fil » comme avant', { col: 'ck-t-a', sh: 900, ch: 900, cours: 3, evts: 7, classes: ['deborde', 'ouvert'] }, '|Tout le fil|false|-'],
    ['I5. téléphone, 3 faits : pas de bouton', { col: 'ck-t-a', sh: 400, ch: 400, cours: 1, evts: 3 }, '|caché|false|-'],
  ];
  cas.forEach(([n, c, att]) => { const v = filTaille(S, c); ok(n, v === att, v + ' (attendu ' + att + ')'); });
  ok('J1. le bas du bandeau est mesuré et posé', enteteBas(S, '0px', 118) === '--pil-entete-bas=118px', enteteBas(S, '0px', 118));
  ok('J2. sous la barre de démo, son décalage compte', enteteBas(S, '40px', 118) === '--pil-entete-bas=158px', enteteBas(S, '40px', 118));
  ok('J3. page cachée (hauteur 0) : rien d’écrasé', enteteBas(S, '0px', 0) === 'rien', enteteBas(S, '0px', 0));
  ok('J4. la mesure ne rebranche jamais l’observateur (la boucle)', corps(S.pil, 'function _pilEnteteBas(){') && !corps(S.pil, 'function _pilEnteteBas(){').includes('observe('));
  ok('J5. renderPilotage suit le bandeau', corps(S.pil, 'function renderPilotage(){').includes('_pilEnteteSuivre();'));
  const B = bloc(S.css), iT = S.css.indexOf('★ TETE-2 (§329)'), iC = S.css.indexOf('★ COLLE-1 (§412)');
  ok('K1. le bloc existe, AVANT celui de TETE-2', B && iC > 0 && iT > iC);
  ok('K2. les onglets sous le bandeau, sur ordinateur et tablette seulement', /@media \(min-width:760px\) and \(min-height:600px\)\{\s*body #page-pilotage \.pil-tabsbar\{top:var\(--pil-entete-bas,0px\)\}/.test(B));
  ok('K3. la colonne bornée à l’écran, qui défile seule', B.includes('max-height:calc(100dvh - var(--ck-colle,16px) - var(--e-2,8px))') && B.includes('overflow-y:auto'));
  ok('K4. « En direct » plafonné à une journée calme, et pas écrasé', B.includes('#ck-t-c #ck-fil{position:relative;max-height:186px;overflow:hidden}') && B.includes('#ck-t-c #ck-fil,#ck-t-c #ck-savoir{flex:none}'));
  ok('K5. déplié sans plafond ; le fondu ; le bouton à la hauteur du titre', B.includes('#ck-t-c #ck-fil.ouvert{max-height:none;overflow:visible}') && B.includes('#ck-t-c #ck-fil.deborde:not(.ouvert)::after') && B.includes('min-height:var(--h-sm,28px)'));
  const nu = B.replace(/\/\*[\s\S]*?\*\//g, ''); ok('K6. accolades du bloc équilibrées', nu.split('{').length === nu.split('}').length);
  ok('L1. l’aide dit la nouvelle place et « Tout voir »', S.uti.includes('le fil <b>En direct</b> puis <b>À savoir</b> restent visibles') && S.uti.includes('« Tout voir » le déplie') && !S.uti.includes('À droite sur ordinateur, <b>À savoir</b> réunit'));
  ok('L2. le guide aussi', S.guide.includes('Sur le côté, en haut, le fil <b>En direct</b>') && S.guide.includes('« Tout voir » la déplie') && !S.guide.includes('; dessous, le fil <b>En direct</b>'));
  ok('M. inscrit dans la chaîne (et sa contre-épreuve)', S.liste.includes("['node scripts/mv-harnais-colle1.mjs']") && S.liste.includes("['node scripts/mv-harnais-colle1.mjs --contre']"));
  return r;
}
const sub = (k, a, b) => S => { if (!S[k].includes(a)) throw new Error('contre-épreuve sans prise : ' + a.slice(0, 60)); return { ...S, [k]: S[k].replace(a, b) }; };
const DEFAUTS = [
  ['« En direct » rendu à la colonne de gauche', sub('ck', "large: [['verdict', 'decision'], ['plan', 'chant', 'courbe'], ['fil', 'savoir']]", "large: [['verdict', 'decision', 'fil'], ['plan', 'chant', 'courbe'], ['savoir']]")],
  ['moyen d’avant', sub('ck', "moyen: [['verdict', 'decision', 'plan', 'chant', 'courbe'], [], ['fil', 'savoir']]", "moyen: [['verdict', 'decision', 'plan', 'chant', 'courbe', 'fil'], [], ['savoir']]")],
  ['colleHaut sans le bandeau', sub('ck', "'#page-pilotage .mod-header, #page-pilotage .pil-portee, #page-pilotage .pil-tabsbar'", "'#page-pilotage .pil-portee, #page-pilotage .pil-tabsbar'")],
  ['ranger ne remesure plus', sub('ck', "\n  filTaille();   // COLLE-1", "\n  // COLLE-1")],
  ['majFil ne remesure plus', sub('ck', 'filTaille(); setTimeout(filTaille, 520);', '')],
  ['le geste perdu', sub('ck', 'S.filOuvert = !S.filOuvert; filTaille(); return;', 'return;')],
  ['l’observateur ne suit plus le bandeau', sub('ck', 'if (hd) obs.observe(hd);', '')],
  ['sans tolérance d’arrondi', sub('ck', 'f.scrollHeight > f.clientHeight + 4', 'f.scrollHeight > f.clientHeight')],
  ['le libellé d’avant en colonne de droite', sub('ck', "ouvert ? 'Replier' : 'Tout voir (' +", "ouvert ? 'Replier' : 'Tout le fil (' +")],
  ['le bouton montré même sans débord', sub('ck', "b.hidden = !f.classList.contains('deborde');", 'b.hidden = false;')],
  ['la mesure sans garde de page cachée', sub('pil', 'var h=hd.getBoundingClientRect().height; if(!h) return;', 'var h=hd.getBoundingClientRect().height;')],
  ['la mesure sans le décalage du haut', sub('pil', '(parseFloat(getComputedStyle(hd).top)||0)+h', 'h')],
  ['la mesure qui rebranche l’observateur', sub('pil', "document.documentElement.style.setProperty('--pil-entete-bas', b+'px');", "document.documentElement.style.setProperty('--pil-entete-bas', b+'px'); if(_pilEnteteObs) _pilEnteteObs.observe(hd);")],
  ['renderPilotage ne suit plus le bandeau', sub('pil', '  _pilEnteteSuivre();   // ★ COLLE-1', '  // ★ COLLE-1')],
  ['le bloc posé après TETE-2', S => { const i = S.css.indexOf('/* ★ COLLE-1 (§412)'), j = S.css.indexOf('/* ★ FIN COLLE-1 */') + '/* ★ FIN COLLE-1 */\n'.length; if (i < 0) throw new Error('sans prise'); const b = S.css.slice(i, j); return { ...S, css: S.css.slice(0, i) + S.css.slice(j) + '\n' + b }; }],
  ['« En direct » écrasé (sans flex:none)', sub('css', '#ck-t-c #ck-fil,#ck-t-c #ck-savoir{flex:none}', '')],
  ['les onglets sous le bandeau aussi au téléphone', sub('css', '@media (min-width:760px) and (min-height:600px){\n  body #page-pilotage .pil-tabsbar', '@media (min-width:0px){\n  body #page-pilotage .pil-tabsbar')],
  ['plus de plafond', sub('css', 'max-height:186px;', '')],
  ['l’aide d’avant', sub('uti', 'le fil <b>En direct</b> puis <b>À savoir</b> restent visibles', '<b>À savoir</b> reste visible')],
  ['le guide d’avant', sub('guide', 'Sur le côté, en haut, le fil <b>En direct</b>', 'Sur le côté, <b>En direct</b>')],
  ['absent de la chaîne', sub('liste', "['node scripts/mv-harnais-colle1.mjs --contre']", "['node scripts/mv-harnais-autre.mjs --contre']")],
];
if (!CONTRE) {
  const r = verifs(S0); let ko = 0;
  r.forEach(([n, v, d]) => { if (!v) ko++; console.log((v ? '  ✓ ' : '  ✗ ') + n + (v ? '' : '  → ' + d)); });
  console.log(ko ? '\nCOLLE-1 : ' + ko + ' rouge(s)' : '\nCOLLE-1 : ' + r.length + ' vérifications vertes'); process.exit(ko ? 1 : 0);
} else {
  let ko = 0;
  DEFAUTS.forEach(([n, f]) => { let rouges = []; try { rouges = verifs(f(S0)).filter(x => !x[1]).map(x => x[0].split('.')[0]); } catch (e) { rouges = null; console.log('  ✗ ' + n + ' — ' + e.message); ko++; return; }
    if (rouges.length) console.log('  ✓ rougit : ' + n + '  (' + rouges.join(', ') + ')'); else { ko++; console.log('  ✗ reste vert : ' + n); } });
  console.log(ko ? '\nCOLLE-1 --contre : ' + ko + ' défaut(s) non vus' : '\nCOLLE-1 --contre : ' + DEFAUTS.length + '/' + DEFAUTS.length + ' défauts vus'); process.exit(ko ? 1 : 0);
}
