// HARNAIS — TOURCUV-1 (§384) : la Tournée du Cuvier rangée — la tête claire des autres onglets, les boutons du jeu.
//   node scripts/mv-harnais-tourcuv1.mjs           → doit être vert
//   node scripts/mv-harnais-tourcuv1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions de cuvier.js (_vtBandeauHtml, renderVendTour, _vtCss) ; les lignes des cuves, leur saisie et
// leur écriture (_vtRowHtml, _vtMaj, _vtLoad…) sont des marques — CUV-7 et CUV-11 les jouent pour de vrai.
import fs from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const SAIN = { cuv: fs.readFileSync('src/cuvier.js', 'utf8'), utils: fs.readFileSync('src/utils.js', 'utf8'), guide: fs.readFileSync('guide/08-cave.html', 'utf8') };
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
  let code = "var _VT_WHO = [], _VT_FILT = 'cours', _VT_BUF = { x: 1 };\n";
  try { for (const f of ['_vtBandeauHtml', 'renderVendTour', '_vtCss', '_vendDateLongue']) code += fn(S.cuv, f) + '\n'; }
  catch (e) { t('les fonctions de la Tournée existent', false, e.message); return L; }
  const body = { innerHTML: '' }; let style = '';
  const ctx = {
    ECRIRE: true, MESURABLES: 2, VISIBLES: 2,
    document: { getElementById: (id) => (id === 'mvv-body' ? body : null), createElement: () => ({ set textContent(v) { style = v; } }), head: { appendChild() {} } },
    _mvToday: () => '2026-09-08', _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>', canWrite: () => ctx.ECRIRE,
    _escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'),
    _caveIntLabel: (l) => l.join(', '), _vendEnsureSheetCss() {}, _vtLoad() {}, _vtMaj() {},
    _vtMesurables: () => new Array(ctx.MESURABLES).fill(0), _vtVisibles: () => new Array(ctx.VISIBLES).fill({ id: 'c' }), _vtRowHtml: () => '<div class="MARQUE-LIGNE"></div>',
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  try { vm.runInContext(code, ctx, { filename: 'tourcuv1-extrait.js' }); } catch (e) { t('les fonctions extraites se chargent', false, e.message); return L; }

  /* ══ 1. LA TÊTE ET LA CARTE DE PROGRESSION ══ */
  const b = ctx._vtBandeauHtml();
  t('la tête des autres onglets : « Tournée du mardi 8 septembre », « Tournée du jour » au téléphone', /class="mat-tete"/.test(b)
    && /<span class="vt-lg">Tournée du mardi 8 septembre<\/span><span class="vt-sm">Tournée du jour<\/span>/.test(b) && /Les cuves en macération et en fermentation/.test(b));
  t('« Qui ? » est un bouton du jeu, à droite de la tête', /class="mvbtn mvbtn-secondaire vt-who" onclick="_vtWho\(\)">Qui \?</.test(b));
  ctx._VT_WHO = ['Marie', 'Jean'];
  t('« Qui ? » nomme ceux qui font la tournée', /vt-who" onclick="_vtWho\(\)">Marie, Jean</.test(ctx._vtBandeauHtml()));
  t('la progression garde ses identifiants (vt-pf, vt-pn, vt-pt)', /id="vt-pf"/.test(b) && /id="vt-pn"/.test(b) && /id="vt-pt"/.test(b) && /class="mvcarte vt-hd"/.test(b));
  const on = (b.match(/mvbtn-option mvbtn-compact on" aria-pressed="true"/g) || []).length, off = (b.match(/aria-pressed="false"/g) || []).length;
  t('les filtres sont les options du jeu, un seul choisi', on === 1 && off === 2 && /onclick="_vtFilt\('reste'\)">Reste à faire</.test(b) && /mvbtn-choix vt-filt/.test(b));
  /* ══ 2. LE BAS DE L'ÉCRAN ══ */
  ctx.renderVendTour();
  const e1 = body.innerHTML;
  t('« Terminer la tournée » est le bouton principal, son compte dedans', /class="mvbtn mvbtn-principal vt-fin" onclick="_vtFin\(\)">Terminer la tournée <small id="vt-fin-n"><\/small>/.test(e1));
  t('le « + » flottant devient « Intervention groupée », écrit', /class="mvbtn mvbtn-secondaire vt-fab" onclick="_vtSheet\(\)">[\s\S]{0,60}<span>Intervention groupée<\/span>/.test(e1) && !/aria-label="Intervention groupée"/.test(e1));
  ctx.ECRIRE = false; ctx.renderVendTour();
  t('lecture seule : ni « Terminer » ni intervention', !/vt-fin/.test(body.innerHTML) && !/vt-fab/.test(body.innerHTML));
  ctx.ECRIRE = true; ctx.VISIBLES = 0; ctx.renderVendTour();
  t('un filtre vide le dit, avec le chemin vers « Toutes »', /class="mvbtn mvbtn-secondaire" onclick="_vtFilt\('tout'\)">Voir toutes les cuves/.test(body.innerHTML));
  ctx.MESURABLES = 0; ctx.renderVendTour();
  t('rien à relever : l’écran le dit et mène aux cuves', /Aucune cuve à relever/.test(body.innerHTML) && /class="mvbtn mvbtn-secondaire" onclick="switchVendOng\('cuves'\)">Aller aux cuves/.test(body.innerHTML));
  /* ══ 3. LE STYLE ══ */
  t('le bandeau sombre est parti : la carte reste collée en haut, claire', /\.vt-hd\{position:sticky;top:0;z-index:40;padding:/.test(style) && !/\.vt-hd\{[^}]*--cave/.test(style));
  t('plus de bouton fait main : ni filtre, ni « Terminer », ni « + »', !/\.vt-fb\{/.test(style) && /\.vt-fin\{flex:1;min-height:var\(--e-9,48px\)\}/.test(style) && /\.vt-fab\{flex:none;min-height:var\(--e-9,48px\)\}/.test(style));
  t('le titre long sur ordinateur, court au téléphone', /\.vt-sm\{display:none\}/.test(style) && /@media \(max-width:1023px\)\{\.vt-lg\{display:none\}\.vt-sm\{display:inline\}\}/.test(style));
  /* ══ 4. L'AIDE, LE GUIDE, LA NOUVEAUTÉ ══ */
  t('l’aide et le guide parlent du bouton « Intervention groupée », plus du « + »', !/le bouton \+ en bas à droite de la tournée/.test(S.utils) && /\['L’intervention groupée', "le bouton « Intervention groupée »/.test(S.utils)
    && !/Le bouton <b>\+<\/b> en bas à droite/.test(S.guide));
  t('la nouveauté vise l’onglet Tournée', /cible: '#mvv-tab-tour'/.test(S.utils) && /id="mvv-tab-tour"/.test(S.cuv));
  return L;
}

const DEFAUTS = [
  ['le bandeau sombre revient', (S) => ({ ...S, cuv: S.cuv.replace('".vt-hd{position:sticky;top:0;z-index:40;padding:var(--e-3,12px) var(--e-4,16px) var(--e-2,8px);gap:var(--e-2,8px)}",', '".vt-hd{position:sticky;top:0;z-index:40;background:var(--cave,#14110D);color:#F0E2C8;padding:13px 14px 0}",') })],
  ['le filtre choisi ne se voit plus', (S) => ({ ...S, cuv: S.cuv.replace("'<button type=\"button\" class=\"mvbtn mvbtn-option mvbtn-compact'+(on?' on':'')+'\" aria-pressed=\"'+on+'\"", "'<button type=\"button\" class=\"mvbtn mvbtn-option mvbtn-compact\" aria-pressed=\"false\"") })],
  ['le « + » muet revient', (S) => ({ ...S, cuv: S.cuv.replace("onclick=\"_vtSheet()\">'+_mvIcon('plus',16)+'<span>Intervention groupée</span></button>'", "onclick=\"_vtSheet()\" aria-label=\"Intervention groupée\">'+_mvIcon('plus',24)+'</button>'") })],
  ['la tête perd la date', (S) => ({ ...S, cuv: S.cuv.replace("+'<span class=\"mat-an-t\"><span class=\"vt-lg\">Tournée du '+d+'</span>", "+'<span class=\"mat-an-t\"><span class=\"vt-lg\">Tournée</span>") })],
  ['la progression perd un identifiant', (S) => ({ ...S, cuv: S.cuv.replace('<div class="vt-prog-f" id="vt-pf"></div>', '<div class="vt-prog-f"></div>') })],
  ['l’aide reparle du « + »', (S) => ({ ...S, utils: S.utils.replace("['L’intervention groupée', \"le bouton « Intervention groupée »", "['L’intervention groupée', \"le bouton + en bas à droite de la tournée") })],
];

const c = { v: (s) => '\x1b[32m' + s + '\x1b[0m', r: (s) => '\x1b[31m' + s + '\x1b[0m', d: (s) => '\x1b[2m' + s + '\x1b[0m' };
if (!CONTRE) {
  const L = jouer(SAIN);
  console.log('\nTOURCUV-1 — la Tournée du Cuvier rangée');
  for (const x of L) console.log('  ' + (x.ok ? c.v('✓') : c.r('✗')) + ' ' + x.nom + (x.ok ? '' : c.d('  → ' + x.detail)));
  const ko = L.filter((x) => !x.ok).length;
  console.log('\n  ' + (L.length - ko) + ' verts · ' + ko + ' rouge(s)\n');
  process.exit(ko ? 1 : 0);
} else {
  const base = jouer(SAIN).filter((x) => !x.ok);
  if (base.length) { console.log(c.r('  le code sain n’est pas vert : ' + base.map((x) => x.nom).join(' · '))); process.exit(1); }
  let rate = 0;
  console.log('\nTOURCUV-1 — contre-épreuve');
  for (const [nom, casse] of DEFAUTS) {
    const S = casse(SAIN);
    const inchange = S.cuv === SAIN.cuv && S.utils === SAIN.utils && S.guide === SAIN.guide;
    const rouges = inchange ? 0 : jouer(S).filter((x) => !x.ok).length;
    if (inchange) { rate++; console.log('    ' + c.r('INJECTION RATÉE') + '  ' + nom + c.d('  (le texte visé a changé : mettre la contre-épreuve à jour)')); }
    else if (!rouges) { rate++; console.log('    ' + c.r('NON DÉTECTÉ') + '  ' + nom); }
    else console.log('    DÉTECTÉ  ' + nom + c.d(' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'));
  }
  console.log('\n  ' + (DEFAUTS.length - rate) + '/' + DEFAUTS.length + ' défauts détectés\n');
  process.exit(rate ? 1 : 0);
}
