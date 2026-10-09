// HARNAIS — TEXTE-A (§247) : les trois petits crans relevés (décision de Nico sur maquette, 05/10).
//   node scripts/mv-harnais-textea.mjs           → doit être vert
//   node scripts/mv-harnais-textea.mjs --contre  → chaque défaut réinjecté doit rougir
// Vérifie les crans dans :root, qu'AUCUNE autre définition ne les écrase (modules, index.html, reste de styles.css), et
// exécute la VRAIE carte du registre phyto (renderPhytoTrac, _phParcParts de tracteur.js) : la ligne des parcelles ne passe
// plus à la ligne, les noms se raccourcissent, le « +N » reste lisible. Mesure Chromium (la ligne tient) : §247c.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const MODULES = fs.readdirSync(path.join(R, 'src')).filter(f => f.endsWith('.js')).sort();
const BASE0 = { css: lire('src/styles.css'), html: lire('index.html'), trac: lire('src/tracteur.js'), typo: lire('scripts/mv-harnais-typo.mjs'),
  modules: Object.fromEntries(MODULES.map(f => [f, lire('src/' + f)])) };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
const CRANS = { '--pt-micro': 12, '--pt-lbl': 12, '--pt-nano': 11 };
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  const i = B.css.indexOf(':root'), j = B.css.indexOf('}', i), racine = B.css.slice(i, j), reste = B.css.slice(0, i) + B.css.slice(j);
  const val = k => { const m = racine.match(new RegExp(k.replace(/-/g, '\\-') + '\\s*:\\s*([0-9.]+)px')); return m ? parseFloat(m[1]) : null; };
  T('les trois petits crans sont relevés dans :root (12 · 11,5 · 11 px)', Object.keys(CRANS).every(k => val(k) === CRANS[k]));
  T('plus aucun cran sous 11 px', Object.keys(CRANS).every(k => val(k) >= 11));
  const redef = new RegExp('--pt-(micro|lbl|nano)\\s*:', 'g');
  const ailleurs = [].concat((reste.match(redef) || []).map(() => 'styles.css'), (B.html.match(redef) || []).map(() => 'index.html'),
    ...Object.entries(B.modules).map(([f, s]) => (s.match(redef) || []).map(() => f)));
  T('aucune autre définition ne les écrase (styles.css hors :root, index.html, modules)', ailleurs.length === 0);
  T('le harnais typographique porte le même barème', /'--pt-micro': 12,/.test(B.typo) && /'--pt-lbl': 12, '--pt-nano': 11 /.test(B.typo));
  // La vraie carte du registre
  const parts = fonction(B.trac, '_phParcParts'), rend = fonction(B.trac, 'renderPhytoTrac');
  const NOMS = ['Les Grandes Vignes', 'Clos du Moulin', 'La Combe', 'Les Chaumes', 'En Champs', 'Le Pré de la Rue', 'Les Crais', 'La Justice', 'Les Seuvrées', 'Aux Corvées'];
  const el = { innerHTML: '' };
  const ctx = { window: {}, document: { getElementById: () => el }, _mvIcon: () => '', dreEffectif: () => ({ h: 0 }),
    _escHtml: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), TRAITEMENTS: [], Date, Math, JSON };
  ctx.window.PARCELLES = NOMS.map(nom => ({ nom, statut: 'Actif' }));
  vm.createContext(ctx); vm.runInContext([parts, rend].join('\n'), ctx);
  const p8 = ctx._phParcParts({ parcelles: NOMS.slice(0, 8) }), p2 = ctx._phParcParts({ parcelles: NOMS.slice(0, 2) }), pT = ctx._phParcParts({ parcelles: NOMS });
  T('la liste abrégée en deux morceaux : trois noms, et « +5 » à part', p8.noms === 'Les Grandes Vignes, Clos du Moulin, La Combe' && p8.plus === '+5');
  T('… deux parcelles : les deux noms, pas de « + »', p2.noms === 'Les Grandes Vignes, Clos du Moulin' && p2.plus === '');
  T('… tout le domaine : « Domaine entier (10) »', pT.noms === 'Domaine entier (10)' && pT.plus === '');
  T('… et, mis bout à bout, le même texte qu’avant (« … La Combe +5 »)', p8.noms + ' ' + p8.plus === 'Les Grandes Vignes, Clos du Moulin, La Combe +5');
  ctx.TRAITEMENTS.push({ produit: 'Bouillie bordelaise RSR', type: 'Cuivre', dose: '2 kg/ha', date: '2026-07-21', conducteur: 'Marc T.', parcelles: NOMS.slice(0, 8) });
  ctx.renderPhytoTrac();
  const meta = (el.innerHTML.match(/<div class="phyto-row-meta"[\s\S]*?›<\/span><\/div>/) || [''])[0];
  T('la carte a sa ligne parcelles · opérateur · flèche', !!meta && /Marc T\./.test(meta));
  T('… qui ne passe plus à la ligne (aucun flex-wrap)', !!meta && !/flex-wrap/.test(meta));
  T('… les noms se raccourcissent au besoin (points de suspension, sur une ligne)',
    /<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Les Grandes Vignes, Clos du Moulin, La Combe<\/span>/.test(meta));
  T('… le « +5 » reste toujours lisible, hors des points de suspension', /<\/span><span style="flex-shrink:0;white-space:nowrap">\+5<\/span>/.test(meta));
  T('… l’opérateur et la flèche ne rétrécissent jamais', /<span style="flex-shrink:0;white-space:nowrap">Marc T\.<\/span>/.test(meta) && /flex-shrink:0;color:var\(--gris\)">›/.test(meta));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nTEXTE-A : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['--pt-micro redescend à 11 px', B => ({ ...B, css: B.css.replace('--pt-micro:12px;', '--pt-micro:11px;') })],
  ['--pt-nano redescend à 9,5 px', B => ({ ...B, css: B.css.replace('--pt-nano:11px;', '--pt-nano:9.5px;') })],
  ['un module redéfinit --pt-lbl en douce', B => ({ ...B, modules: { ...B.modules, 'app.js': B.modules['app.js'] + "\nvar _x='<style>#app-root{--pt-lbl:10.5px}</style>';" } })],
  ['la ligne repasse en flex-wrap', B => ({ ...B, trac: B.trac.replace('<div class="phyto-row-meta" style="display:flex;gap:12px;', '<div class="phyto-row-meta" style="display:flex;flex-wrap:wrap;gap:12px;') })],
  ['les noms ne se raccourcissent plus', B => ({ ...B, trac: B.trac.replace('<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">', '<span>') })],
  ['le « +N » retombe dans les points de suspension', B => ({ ...B, trac: B.trac.replace("'+_escHtml(parc)+'</span>'+(parcP.plus?'<span style=\"flex-shrink:0;white-space:nowrap\">'+_escHtml(parcP.plus)+'</span>':'')+'</span>'", "'+_escHtml(parc+(parcP.plus?' '+parcP.plus:''))+'</span></span>'") })],
  ['la liste perd son « +N »', B => ({ ...B, trac: B.trac.replace("return {noms:a.slice(0,3).join(', '), plus:'+'+(a.length-3)};", "return {noms:a.slice(0,3).join(', '), plus:''};") })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (JSON.stringify(B2) === JSON.stringify(BASE0)) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = joue(B2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
