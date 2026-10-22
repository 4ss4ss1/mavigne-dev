// HARNAIS — ETAIN-1 (§426) : les icônes des modules en relief — l'étain au repos, l'émail lie-de-vin pour l'écran ouvert.
//   node scripts/mv-harnais-etain1.mjs           → doit être vert
//   node scripts/mv-harnais-etain1.mjs --contre  → chaque défaut réinjecté doit rougir
// Le rendu se regarde au navigateur (scripts/mv-captures.mjs : téléphone et ordinateur, clair et sombre). Ici :
//   1. la charte porte la matière (--etain-*, --email-*, --dock-relief) et les tailles ; le sombre s'y redit DEUX fois à
//      l'identique (bascule manuelle, mode automatique), et diffère bien du clair ;
//   2. le bloc ETAIN-1 de la feuille : après COQ-2 et RAIL-1 qu'il surcharge, avant l'en-tête commun (dernier bloc), sans
//      aucune couleur écrite, et chaque réglage qu'il lit existe dans la charte ;
//   3. _dockSync JOUÉE sur un faux document : l'écran ouvert marqué dans la barre ET dans la feuille « Plus », « Plus »
//      allumé quand l'écran ouvert y est rangé, éteint sinon ;
//   4. _railHtml JOUÉE (coquille.js dans un vm) : chaque entrée de la barre latérale porte son icône dans sa tuile.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(f, 'utf8');
const SAIN = { charte: lire('src/charte.css'), css: lire('src/styles.css'), app: lire('src/app.js'), coq: lire('src/coquille.js') };
const MATIERE = ['--etain-fond', '--etain-ombre', '--etain-ombre-petite', '--etain-appui', '--etain-encre', '--etain-gravure',
  '--email-fond', '--email-ombre', '--email-ombre-petite', '--email-appui', '--dock-relief'];
const TAILLES = ['--tuile-dock', '--tuile-feuille', '--tuile-rail', '--tuile-rail-pliee', '--rang-rail', '--r-tuile', '--ic-tuile', '--email-relief'];
const ITEMS = [{ p: 'pilotage', ic: 'graphique', l: 'Pilotage' }, { p: 'home', ic: 'feuille', l: 'Vigne' }, { p: 'cave', ic: 'verre', l: 'Cave' },
  { p: 'planning', ic: 'calendrier', l: 'Planning' }, { p: 'reglages', ic: 'curseurs', l: 'Réglages' }];

function groupe(charte) {   // le groupe ETAIN-1 de la charte, de son titre au commentaire suivant
  const i = charte.indexOf('★★ ETAIN-1 (§426)'); if (i < 0) return '';
  const j = charte.indexOf('/*', charte.indexOf('*/', i) + 2);
  return charte.slice(i, j < 0 ? undefined : j);
}
const decl = (b) => { const o = {}; for (const m of b.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) o[m[1]] = m[2].trim(); return o; };
function themes(g) {
  const c = g.match(/:root\{([\s\S]*?)\n\}/), m = g.match(/:root\[data-theme="dark"\]\{([\s\S]*?)\}/), a = g.match(/:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}/);
  return { clair: c ? decl(c[1]) : {}, manuel: m ? decl(m[1]) : {}, auto: a ? decl(a[1]) : {} };
}
function blocCss(css) { const i = css.indexOf('★ ETAIN-1 (§426)'); if (i < 0) return { i: -1, b: '' }; const j = css.indexOf('★ FIN ETAIN-1', i); return { i, b: j < 0 ? '' : css.slice(i, j) }; }
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
function corps(src, nom) {   // le texte d'une fonction déclarée `function nom(`, accolades appariées hors chaînes et commentaires
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return src.slice(m[0].index, j + 1);
  }
  throw new Error(nom + ' : accolades non appariées');
}
function dockSync(S, page) {
  const el = (attrs) => { const cl = new Set(); return { attrs, getAttribute: (k) => (k in attrs ? attrs[k] : null), classList: { toggle: (c, on) => { if (on) cl.add(c); else cl.delete(c); }, contains: (c) => cl.has(c) } }; };
  const barre = ['pilotage', 'home', 'tracteur', 'phyto'].map((p) => el({ 'data-page': p })).concat([el({ 'data-plus': '1' })]);
  const feuille = ['cave', 'reserve', 'planning', 'reglages'].map((p) => el({ 'data-page': p })), mode = el({ 'data-mode': '1' });
  const ctx = { document: { getElementById: (id) => (id === 'mv-dock-inner' ? { querySelectorAll: (s) => (s === '.mv-dk' ? barre : []) }
    : id === 'mv-dock-sheet-items' ? { querySelectorAll: (s) => (s === '.mv-sg[data-page]' ? feuille : s === '.mv-sg' ? feuille.concat([mode]) : []) } : null) } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(corps(S.app, '_dockSync') + '\n;window.__f = _dockSync;', ctx); ctx.__f(page);
  const on = (xs) => xs.filter((x) => x.classList.contains('on')).map((x) => x.attrs['data-page'] || 'plus').join();
  return { barre: on(barre), feuille: on(feuille), mode: mode.classList.contains('on') };
}
function rail(S) {
  const ctx = { Math, String, Array, Object, JSON, Number, matchMedia: () => ({ matches: true, addEventListener() {} }), document: { addEventListener() {} }, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvIcon = (n) => '<svg data-ic="' + n + '"></svg>'; vm.createContext(ctx); vm.runInContext(S.coq, ctx);
  return ctx._railHtml(ITEMS, { nom: 'Nico', ini: 'N', role: 'Administration' }, { nom: 'Domaine', sous: '' });
}

function suite(S) {
  const out = []; const T = (n, f) => { let ok = false; try { ok = !!f(); } catch (e) { ok = false; } out.push([n, ok]); };
  const g = groupe(S.charte), th = themes(g);
  T('la charte porte la matière et les tailles (groupe ETAIN-1, :root)', () => g && [...MATIERE, ...TAILLES].every((k) => th.clair[k]));
  T('le sombre redit deux fois à l’identique — bascule manuelle et mode automatique', () => MATIERE.every((k) => th.manuel[k] && th.manuel[k] === th.auto[k])
    && Object.keys(th.manuel).sort().join() === Object.keys(th.auto).sort().join());
  T('le sombre diffère du clair (l’étain foncé, l’émail plus vif)', () => ['--etain-fond', '--etain-encre', '--email-fond'].every((k) => th.manuel[k] !== th.clair[k]));
  T('l’émail reste la lie-de-vin de la charte (#7A2850 en clair, #8A3560 en sombre)', () => th.clair['--email-fond'].includes('#7A2850') && th.manuel['--email-fond'].includes('#8A3560'));
  const { i, b } = blocCss(S.css), net = sansCommentaires(b);
  // Un appel du socle redit sa valeur en repli (mv-harnais-jetons) : la couleur d'un repli n'est pas une couleur écrite.
  const nu = net.replace(/var\((--[\w-]+)\s*,[^)]*\)/g, 'var($1)');
  T('le bloc ETAIN-1 existe, balisé jusqu’à sa fin', () => i >= 0 && b.length > 0);
  T('après COQ-2 et RAIL-1 qu’il surcharge, avant l’en-tête commun qui reste le dernier', () => i > S.css.indexOf('★ FIN COQ-2') && i > S.css.indexOf('★ RAIL-1 (§313)') && i < S.css.indexOf('★ TETE-2 (§329)'));
  T('aucune couleur écrite dans le bloc (la matière vient de la charte)', () => net.length > 0 && !/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(nu));
  T('chaque réglage lu par le bloc existe dans la charte', () => [...net.matchAll(/var\((--[\w-]+)/g)].every((m) => new RegExp(m[1].replace(/-/g, '\\-') + '\\s*:').test(S.charte)));
  T('la barre du bas, la feuille « Plus » et la barre latérale reçoivent la tuile, l’écran ouvert l’émail', () => ['body #mv-dock .mv-dk .mv-dk-ic{', 'body #mv-dock .mv-dk.on .mv-dk-ic{',
    'body #mv-dock-sheet .mv-sg .mv-sg-ic{', 'body #mv-dock-sheet .mv-sg.on .mv-sg-ic{', 'body .mv-rail .mv-rail-ic{', 'body .mv-rail .mv-rail-b[aria-current="page"] .mv-rail-ic{'].every((s) => net.includes(s))
    && /\.mv-dk\.on \.mv-dk-ic\{[^}]*var\(--email-fond\)/.test(net) && /\.mv-sg\.on \.mv-sg-ic\{[^}]*var\(--email-fond\)/.test(net));
  T('la feuille « Plus » : quatre par rang, sans cadre', () => /#mv-dock-sheet-items\{[^}]*repeat\(4,/.test(net) && /body #mv-dock-sheet \.mv-sg\{[^}]*border:0;[^}]*background:none/.test(net));
  T('l’écran ouvert rangé dans la feuille : « Plus » s’allume, l’entrée de la feuille aussi', () => { const r = dockSync(S, 'cave'); return r.barre === 'plus' && r.feuille === 'cave' && !r.mode; });
  T('Réglages, rangé lui aussi : « Plus » allumé', () => { const r = dockSync(S, 'reglages'); return r.barre === 'plus' && r.feuille === 'reglages'; });
  T('un écran de la barre : lui seul allumé, « Plus » éteint, la feuille sans marque', () => { const r = dockSync(S, 'tracteur'); return r.barre === 'tracteur' && r.feuille === ''; });
  T('Parcelles et Journal allument toujours Vigne', () => dockSync(S, 'journal').barre === 'home' && dockSync(S, 'parcelles').barre === 'home');
  T('chaque entrée de la barre latérale porte son icône dans sa tuile, le libellé après', () => {
    const h = rail(S), bs = h.match(/<button class="mv-rail-b"[\s\S]*?<\/button>/g) || [];
    return bs.length === ITEMS.length && bs.every((x) => /^<button class="mv-rail-b"[^>]*><span class="mv-rail-ic" aria-hidden="true"><svg data-ic="[\w-]+"><\/svg><\/span><span class="mv-rail-lbl">/.test(x));
  });
  return out;
}

function rapport(res, titre) {
  console.log('\n── ' + titre + ' ──');
  for (const [n, ok] of res) console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + n);
  const r = res.filter((x) => !x[1]).length;
  console.log('  ' + (res.length - r) + ' vert(s) · ' + r + ' rouge(s)');
  return r;
}

if (!CONTRE) {
  process.exit(rapport(suite(SAIN), 'ETAIN-1 (§426) — les icônes des modules en relief') ? 1 : 0);
} else {
  const blocE = blocCss(SAIN.css);
  const finE = SAIN.css.indexOf('★ FIN ETAIN-1') + '★ FIN ETAIN-1 */'.length;
  const debutE = SAIN.css.lastIndexOf('/*', blocE.i);
  const DEFAUTS = [
    ['une couleur écrite dans le bloc', { css: SAIN.css.replace('body #mv-dock{ box-shadow:var(--dock-relief); }', 'body #mv-dock{ box-shadow:0 -10px 24px -14px rgba(20,18,14,.18); }') }],
    ['le sombre automatique oublié', { charte: SAIN.charte.replace(/(:root:not\(\[data-theme="light"\]\)\{[\s\S]*?)--etain-fond:[^;]+;/, '$1') }],
    ['« Plus » qui ne s’allume plus', { app: SAIN.app.replace("getAttribute('data-plus') ? range :", "getAttribute('data-plus') ? false :") }],
    ['la feuille sans marque', { app: SAIN.app.replace("ss[j].classList.toggle('on',o);", "ss[j].classList.toggle('on',false);") }],
    ['l’icône de la barre latérale sans sa tuile', { coq: SAIN.coq.replace('\'"><span class="mv-rail-ic" aria-hidden="true">\' + ico(x.ic, 20) + \'</span>\'', '\'">\' + ico(x.ic, 20)') }],
    ['le bloc posé après l’en-tête commun', { css: SAIN.css.slice(0, debutE) + SAIN.css.slice(finE) + '\n' + SAIN.css.slice(debutE, finE) }],
    ['un réglage lu qui n’existe pas', { css: SAIN.css.replace('box-shadow:var(--etain-appui)', 'box-shadow:var(--etain-apui)') }],
  ];
  console.log('\n  CONTRE-ÉPREUVE — chaque défaut réintroduit doit faire rougir');
  let manques = 0;
  for (const [nom, mut] of DEFAUTS) {
    const S = Object.assign({}, SAIN, mut);
    const change = Object.keys(mut).every((k) => mut[k] !== SAIN[k]);
    const rouge = change && suite(S).some((x) => !x[1]);
    console.log('    ' + (rouge ? '\x1b[32mDÉTECTÉ\x1b[0m  ' : '\x1b[31mMANQUÉ\x1b[0m   ') + nom + (change ? '' : ' (le défaut ne s’est pas posé : ancre introuvable)'));
    if (!rouge) manques++;
  }
  console.log('  ' + (DEFAUTS.length - manques) + ' détecté(s) · ' + manques + ' manqué(s)');
  process.exit(manques ? 1 : 0);
}
