// HARNAIS — ALIGN-2 (§237) : l'Accueil en rangées (maquette validée le 04/10).
//   node scripts/mv-harnais-align2.mjs           → doit être vert
//   node scripts/mv-harnais-align2.mjs --contre  → chaque défaut réinjecté doit rougir
// KIT-2 (grille) laissait un trou sous un bloc court ; KIT-5 (colonnes) n'en laissait plus, mais rien ne s'alignait.
// ALIGN-2 : une grille en RANGÉES PLEINES — même hauteur par rangée, pied collé en bas, un bloc pleine largeur ou resté
// seul prend la rangée (_homeRangees). La météo par secteur a son bloc (« meteosect », né de « meteo5 ») et UNE carte.
// ⚠️ Aucun harnais ne voit un écran : le rendu à l'œil reste à faire sur ordinateur.
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const APP0 = lire('src/app.js'), CSS0 = lire('src/styles.css'), HTML0 = lire('index.html');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const ligne = (src, re) => { const m = src.match(re); return m ? m[0] : ''; };
const faux = (id, cls, disp) => ({ id, style: { display: disp || '' }, classList: { s: new Set(['home-w'].concat(cls || [])), contains(c) { return this.s.has(c); }, add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); } } });
function suite(APP, CSS, HTML) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const RG = sansCom(fn(APP, 'function _homeRangees(){'));
  const joue = (liste, edit) => { const ctx = { document: { getElementById: () => ({ children: liste }) }, homeEditMode: !!edit }; vm.createContext(ctx); vm.runInContext(RG, ctx); ctx._homeRangees(); return liste.filter(e => e.classList.contains('home-w-seul')).map(e => e.id).join(); };
  T('trois blocs : le troisième, seul dans sa rangée, la prend entière', joue([faux('a'), faux('b'), faux('c')]) === 'c');
  T('quatre blocs : deux rangées pleines, personne seul', joue([faux('a'), faux('b'), faux('c'), faux('d')]) === '');
  T('un bloc masqué : ses voisins forment la rangée', joue([faux('a'), faux('b', ['home-w-off']), faux('c')]) === '');
  T('en mode édition, un bloc masqué garde sa place', joue([faux('a'), faux('b', ['home-w-off']), faux('c')], true) === 'c');
  T('un bloc pleine largeur : celui d’avant, resté seul, s’étire aussi', joue([faux('a'), faux('L', ['home-w-large']), faux('c'), faux('d')]) === 'a');
  T('un bloc effacé (vide) ne compte pas', joue([faux('a'), faux('b', [], 'none'), faux('c'), faux('d')]) === 'd');
  // getHomeLayout : la place de « meteosect », la largeur conservée
  const consts = ligne(APP, /const HOME_WIDGETS=\[[^\]]*\];/) + '\n' + ligne(APP, /const HOME_NEW_TOP=\[[^\]]*\];/) + '\n' + ligne(APP, /const HOME_PINNED='[^']*';/);
  const GL = consts + '\n' + sansCom(fn(APP, 'function _homeLayoutKey(){')) + sansCom(fn(APP, 'function getHomeLayout(){'));
  const lay = (stocke) => { const ctx = { currentUser: { nom: 'Nico' }, localStorage: { getItem: () => null }, JSON }; ctx.window = { CONFIG: stocke ? { home_layout: { Nico: stocke } } : {} }; vm.createContext(ctx); vm.runInContext(GL + '\nthis.__g=getHomeLayout;', ctx); return ctx.__g(); };
  let L = null; try { L = lay({ order: ['mapart', 'avancement', 'meteo5', 'heures', 'tracteur'], hidden: ['meteo5'], compact: [], large: ['heures', 'inconnu'] }); } catch (e) { L = null; }
  T('un ordre déjà réglé : « meteosect » prend la place de « meteo5 », et son état masqué', L && L.order.indexOf('meteosect') === L.order.indexOf('meteo5') - 1 && L.hidden.indexOf('meteosect') >= 0);
  T('la pleine largeur est conservée, purgée des blocs inconnus', L && Array.isArray(L.large) && L.large.join() === 'heures');
  let D = null; try { D = lay(null); } catch (e) { D = null; }
  T('par défaut, les rangées de la maquette : Ma part | saison, tâches | secteurs, 5 jours | tracteur', D && D.order.slice(1, 7).join() === 'mapart,avancement,heures,meteosect,meteo5,tracteur');
  // CSS
  T('ordinateur : une grille de deux colonnes, les blocs d’une rangée étirés', /#home-cols\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);column-gap:var\(--e-4,16px\);align-items:stretch;\}/.test(CSS) && !/#home-cols\{column-count/.test(CSS));
  T('un bloc pleine largeur ou seul prend la rangée', /#home-cols > \.home-w-large,#home-cols > \.home-w-seul\{grid-column:1\/-1;\}/.test(CSS));
  T('les cartes remplissent le bloc, leur pied collé en bas', /#home-cols #home-stat-card > \.hv2-card-pied\{margin-top:auto;\}/.test(CSS) && /#home-cols #home-mapart \.hmp-rest\{margin-top:auto;\}/.test(CSS) && /\.cm-wx-pied\{margin-top:auto;/.test(CSS));
  T('ALIGN-3 : un bloc masqué reste masqué sur ordinateur (la règle à ID redit l’état), estompé en mode édition', /#home-cols > \.home-w\.home-w-off\{display:none;\}/.test(CSS) && /\.home-edit #home-cols > \.home-w\.home-w-off\{display:flex;opacity:0\.45;\}/.test(CSS));
  T('ALIGN-3 : l’œil reste un œil, barré quand le bloc est masqué, et son titre dit l’action', /window\._mvSetIcon\(eye, 'oeil', 16\);eye\.type='button';eye\.classList\.toggle\('off',hidden\);/.test(APP) && /eye\.title=hidden\?'Afficher ce bloc':'Masquer ce bloc'/.test(APP) && /\.home-w-eye\.off::after\{/.test(CSS));
  T('le bouton ↔ est cliquable en mode édition, et absent au téléphone', /:not\(\.home-w-pin\):not\(\.home-w-larg\)\{pointer-events:none;\}/.test(CSS) && /@media \(max-width:1023px\)\{\.home-edit \.home-w-larg\{display:none;\}\}/.test(CSS));
  // la météo par secteur
  const MC = fn(APP, 'function renderHomeMeteoCommunes(){');
  T('la météo par secteur : UNE carte, un pied « Communes », le bloc s’efface sous deux communes', /<div class="mv-c cm-wx-carte">/.test(MC) && /class="cm-wx-pied"/.test(MC) && /if\(groups\.length<2\)\{ c\.innerHTML=''; if\(wrapS\)wrapS\.style\.display='none';/.test(MC));
  T('index.html : le bloc « meteosect » porte les secteurs, « meteo5 » ne les porte plus', /data-w="meteosect">\s*<div class="hv2-section-label"[^>]*>Météo par secteur<\/div>\s*<div id="home-meteo-communes"><\/div>/.test(HTML) && !/data-w="meteo5">\s*<div id="home-meteo-communes">/.test(HTML) && /id="home-cm-bulk"/.test(HTML));
  T('les boutons du mode édition : ↔ posé, et retiré au rendu suivant', /'\.home-w-larg'\]\.forEach/.test(APP) && /homeWidgetLarge\(\\''\+id\+'\\'\)/.test(APP));
  return out;
}
function joueS(A, C, H) { try { return suite(A, C, H); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joueS(APP0, CSS0, HTML0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nALIGN-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['un bloc resté seul ne s’étire plus', a => a.replace("  if(att) att.classList.add('home-w-seul');\n}", '\n}'), c => c],
  ['un bloc masqué compte encore', a => a.replace("if(el.classList.contains('home-w-off')&&!homeEditMode) return false;", ''), c => c],
  ['la pleine largeur est ignorée', a => a.replace("if(el.classList.contains('home-w-large')){ if(att) att.classList.add('home-w-seul'); att=null; return; }", ''), c => c],
  ['« meteosect » part en queue d’un ordre réglé', a => a.replace("lay.order.splice(lay.order.indexOf('meteo5'),0,'meteosect');", ''), c => c],
  ['la pleine largeur se perd au chargement', a => a.replace(',large:(lay.large||[]).slice()', ''), c => c],
  ['les colonnes de KIT-5 reviennent', a => a, c => c.replace('#home-cols{display:grid;', '#home-cols{column-count:2;')],
  ['un bloc seul ne prend plus la rangée', a => a, c => c.replace('#home-cols > .home-w-large,#home-cols > .home-w-seul{grid-column:1/-1;}', '')],
  ['le pied de la carte de saison flotte', a => a, c => c.replace('#home-cols #home-stat-card > .hv2-card-pied{margin-top:auto;}', '')],
  ['le bouton ↔ n’est plus cliquable', a => a, c => c.replace(':not(.home-w-larg){pointer-events:none;}', '{pointer-events:none;}')],
  ['ALIGN-3 : un bloc masqué réapparaît sur ordinateur', a => a, c => c.replace('#home-cols > .home-w.home-w-off{display:none;}', '')],
  ['ALIGN-3 : l’œil redevient un panneau « interdit »', a => a.replace("window._mvSetIcon(eye, 'oeil', 16);", "window._mvSetIcon(eye, hidden?'interdit':'oeil', 16);"), c => c],
  ['les secteurs redeviennent cinq cartes', a => a.replace(`'<div class="mv-c cm-wx-carte">'`, `'<div>'`), c => c],
];
let rg = 0;
DEF.forEach(([n, fa, fc]) => {
  const A2 = fa(APP0), C2 = fc(CSS0);
  if (A2 === APP0 && C2 === CSS0) { console.log('  ⚠ non injecté : ' + n); return; }
  const rouge = joueS(A2, C2, HTML0).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
