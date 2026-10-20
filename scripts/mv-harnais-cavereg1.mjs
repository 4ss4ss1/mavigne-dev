// HARNAIS — CAVEREG-1 (§386) : la roue crantée de la Cave en quatre sections (Le Cuvier, Le Chai, Appellations, Documents).
//   node scripts/mv-harnais-cavereg1.mjs           → doit être vert
//   node scripts/mv-harnais-cavereg1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions : _caveRegSec (cave.js), _aocResumeHtml et ses petits outils (_aocMax, _aocNb, _aocEsc,
// _aocAtt — reglages.js). Lit la page dans index.html. Bouchons : la liste des appellations, des parcelles et des millésimes ;
// une page factice (huit éléments data-creg) pour la bascule. Le contenu des quatre sections a ses harnais (CAVE-2,
// réglages du Cuvier, AOC-CAVE, MINAOC-1).
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cave: fs.readFileSync('src/cave.js', 'utf8'), reg: fs.readFileSync('src/reglages.js', 'utf8'), html: fs.readFileSync('index.html', 'utf8'),
  css: fs.readFileSync('src/styles.css', 'utf8'), utils: fs.readFileSync('src/utils.js', 'utf8') };
function bornes(src, nom) {
  const m = [...src.matchAll(new RegExp('^function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };

function jouer(S) {
  const L = [];
  const t = (nom, ok, detail) => L.push({ nom, ok: !!ok, detail: ok ? '' : (detail || '') });
  /* ══ 1. LA PAGE : la navigation et les quatre sections ══ */
  const i = S.html.indexOf('id="cave-reg-body"'), page = i < 0 ? '' : S.html.slice(i, S.html.indexOf('</section>\n        </div>\n      </div>', i) + 60);
  const boutons = [...page.matchAll(/<button type="button" class="mvbtn mvbtn-option( on)?" role="tab" aria-selected="(true|false)" data-creg="(\w+)" onclick="_caveRegSec\('(\w+)'\)">([^<]+)<\/button>/g)];
  t('la navigation : quatre options, Le Cuvier choisi au départ', boutons.length === 4 && boutons.map((b) => b[3]).join(',') === 'cuvier,chai,aoc,docs'
    && boutons[0][1] === ' on' && boutons[0][2] === 'true' && boutons.slice(1).every((b) => !b[1] && b[2] === 'false') && boutons.every((b) => b[3] === b[4]), String(boutons.length));
  t('les libellés de la maquette', boutons.map((b) => b[5]).join(' · ') === 'Le Cuvier · Le Chai · Appellations · Documents');
  const secs = [...page.matchAll(/<section class="creg-sec" data-creg="(\w+)" role="tabpanel"( hidden)?><div class="creg-grp">([^<]+)<\/div><div id="([\w-]+)"><\/div><\/section>/g)];
  t('quatre sections, une seule visible, les hôtes d’avant gardés', secs.length === 4 && secs.map((s) => s[4]).join(',') === 'cave-reg-cuvier,mvc-body-reglages,cave-reg-mil,cave-reg-docs'
    && !secs[0][2] && secs.slice(1).every((s) => s[2] === ' hidden'), secs.map((s) => s[4]).join(','));
  t('« Le Millésime » devient « Appellations »', secs.length === 4 && secs[2][3] === 'Appellations' && !/<div class="creg-grp">Le Millésime<\/div>/.test(S.html));
  /* ══ 2. LA BASCULE ══ */
  let code = "var _CREG_SEC='cuvier';\n";
  try { code += fn(S.cave, '_caveRegSec') + '\n'; for (const f of ['_aocResumeHtml', '_aocMax', '_aocNb']) code += fn(S.reg, f) + '\n'; }
  catch (e) { t('les fonctions de la roue crantée existent', false, e.message); return L; }
  const el = (tag, k) => ({ tagName: tag, hidden: tag === 'section' && k !== 'cuvier', k, cls: new Set(k === 'cuvier' && tag === 'button' ? ['on'] : []), aria: tag === 'button' ? (k === 'cuvier' ? 'true' : 'false') : null,
    getAttribute(n) { return n === 'data-creg' ? this.k : null; }, setAttribute(n, v) { if (n === 'aria-selected') this.aria = v; },
    get classList() { const s = this.cls; return { toggle: (c, on) => (on ? s.add(c) : s.delete(c)) }; } });
  const ELS = ['cuvier', 'chai', 'aoc', 'docs'].flatMap((k) => [el('button', k), el('section', k)]);
  const ctx = {
    document: { getElementById: (id) => (id === 'cave-reg-body' ? { querySelectorAll: () => ELS } : null) },
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>',
    AOCS: [{ nom: 'Gevrey-Chambertin', rdt_max_hist: [{ mil: '2026', max: 40 }], sucre_min: { r: 180 } }, { nom: 'Bourgogne', rdt_max_hist: [] }],
  };
  // _aocEsc et _aocAtt (reglages.js) portent des expressions régulières à guillemets que le découpeur ne sait pas lire :
  // réécrites ici, à l'identique de leur branche principale (_escHtml, _escAttr).
  ctx._aocEsc = (x) => ctx._escHtml(x); ctx._aocAtt = (x) => ctx._escAttr(x);
  ctx._aocAll = () => ctx.AOCS; ctx._aocActives = () => [{ appellation: 'Gevrey-Chambertin' }, { appellation: '' }]; ctx._aocMils = () => [2026];
  ctx._aocTrouve = (n) => ctx.AOCS.filter((a) => a.nom === n)[0] || null;
  ctx.window = ctx;
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'cavereg1-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }
  const etat = () => ELS.map((e) => e.k + ':' + (e.tagName === 'section' ? (e.hidden ? 'cachée' : 'VUE') : (e.cls.has('on') ? 'ON/' + e.aria : 'off/' + e.aria))).join(' ');
  ctx._caveRegSec('aoc');
  t('choisir « Appellations » : sa section seule visible, son option marquée', etat() === 'cuvier:off/false cuvier:cachée chai:off/false chai:cachée aoc:ON/true aoc:VUE docs:off/false docs:cachée', etat());
  ctx._caveRegSec('ailleurs');
  t('une section inconnue ne change rien', /aoc:ON\/true aoc:VUE/.test(etat()) && ctx._CREG_SEC === 'aoc');
  t('la page rendue retrouve la section choisie', /_caveRegSec\(_CREG_SEC\);/.test(fn(S.cave, 'renderCaveReglagesCave')) && /window\._caveRegSec = _caveRegSec;/.test(S.cave));
  /* ══ 3. LA SECTION APPELLATIONS ══ */
  const a = ctx._aocResumeHtml();
  t('une ligne par appellation : son maximum du millésime, son minimum', /<span class="t">Gevrey-Chambertin<\/span><span class="d">maximum 40 hL\/ha en 2026 · minimum de maturité : rouges 180 g\/L<\/span>/.test(a));
  t('sans plafond ni minimum : à poser, à renseigner', /<span class="t">Bourgogne<\/span><span class="d">plafond 2026 à poser · minimum de maturité à renseigner<\/span>/.test(a));
  t('les deux minimums à portée de main', /onclick="window\._aocSetMin\('Gevrey-Chambertin','r'\)">Rouges</.test(a) && /onclick="window\._aocSetMin\('Bourgogne','b'\)">Blancs</.test(a));
  t('les deux lignes d’avant restent en tête', a.indexOf('openAocPlafonds()') > -1 && a.indexOf('openAocPlafonds()') < a.indexOf('creg-aoc-t'));
  ctx.AOCS = [];
  t('aucune appellation : pas de liste de minimums', !/creg-aoc/.test(ctx._aocResumeHtml()));
  /* ══ 4. LE STYLE, L'AIDE, LA NOUVEAUTÉ ══ */
  t('la navigation en colonne collante à partir de 1 024 px, une section à la fois', /\.creg-sec\[hidden\]\{display:none\}/.test(S.css) && /\.creg-nav\{position:sticky;top:var\(--e-4,16px\);flex-direction:column/.test(S.css));
  t('l’aide et la nouveauté le disent', /quatre sections/.test(S.utils) && /\{ v: '9\.48'/.test(S.utils));
  return L;
}

const DEFAUTS = [
  ['aucune option n’est marquée au départ', (S) => ({ ...S, html: S.html.replace('class="mvbtn mvbtn-option on" role="tab" aria-selected="true" data-creg="cuvier"', 'class="mvbtn mvbtn-option" role="tab" aria-selected="false" data-creg="cuvier"') })],
  ['la bascule montre toutes les sections', (S) => ({ ...S, cave: S.cave.replace("if(String(el.tagName).toUpperCase()==='SECTION') el.hidden=!on;", "if(String(el.tagName).toUpperCase()==='SECTION') el.hidden=false;") })],
  ['la page oublie la section choisie', (S) => ({ ...S, cave: S.cave.replace('  _caveRegSec(_CREG_SEC);   // ★ CAVEREG-1\n', '') })],
  ['la ligne d’appellation tait le minimum', (S) => ({ ...S, reg: S.reg.replace("(mins?('minimum de maturit\\u00e9 : '+mins):'minimum de maturit\\u00e9 \\u00e0 renseigner')", "''") })],
  ['un hôte change de nom', (S) => ({ ...S, html: S.html.replace('<div id="cave-reg-mil"></div>', '<div id="cave-reg-aoc"></div>') })],
  ['« Le Millésime » revient', (S) => ({ ...S, html: S.html.replace('<div class="creg-grp">Appellations</div>', '<div class="creg-grp">Le Millésime</div>') })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nCAVEREG-1 — la roue crantée de la Cave en quatre sections');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nCAVEREG-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = Object.keys(SAIN).every((k) => S[k] === SAIN[k]);
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
