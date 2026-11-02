// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-1 — LA COQUILLE DE LA CONSOLE GUERETTECH (§516)
// ═══════════════════════════════════════════════════════════
//  La maquette v1 (docs/maquettes/maquette-console-gt-v1.html) et l'audit du 01/11 :
//   GT-B27 — la mise en page du téléphone étirée sur un grand écran → une barre
//            latérale sur ordinateur, le contenu centré ;
//   GT-B31 — pas de lien direct → #radar, #incidents, #clients/<slug>, #facturation… ;
//   la recherche partout (Ctrl K) ; D7 : « Business » devient « Facturation ».
//
//  Sur les VRAIES fonctions de src/gt/coquille.js (routes, palette), le reste lu
//  dans src/gt/console.html, src/styles.css, src/admin-gt.js et src/gt.js.
//
//  Usage :  node scripts/mv-harnais-gtui1.mjs
//           node scripts/mv-harnais-gtui1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { co: lire('src/gt/coquille.js'), html: lire('src/gt/console.html'), css: lire('src/styles.css'), gt: lire('src/admin-gt.js'), entree: lire('src/gt.js') };

function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
// La partie sans DOM de la coquille : tout ce qui précède la palette dessinée, rendu exécutable hors navigateur.
function monter(co, etat) {
  const fin = co.indexOf('var _pal = null');
  if (fin < 0) throw new Error('repère « var _pal » absent');
  const code = co.slice(0, fin).replace(/^export function /gm, 'function ');
  const E = Object.assign({ hash: '', replace: [], onglet: 'radar', verrou: false, ouvert: [], fiches: [] }, etat || {});
  const window = {
    addEventListener() {},
    agtSwitchTab(t) { E.ouvert.push(t); E.onglet = t; },
    _agtOngletCourant() { return E.onglet; },
    _agtEstVerrouille() { return E.verrou; },
    agtShowFiche(s) { E.fiches.push(s); }
  };
  const location = { get hash() { return E.hash; }, set hash(v) { E.hash = v; } };
  const history = { replaceState(a, b, h) { E.replace.push(h); E.hash = h; } };
  const api = new Function('window', 'location', 'history', code
    + '\nreturn { lireRoute, routeVersOnglet, ongletVersRoute, slugValide, plier, rang, entreesPalette, appliquerRoute };')(window, location, history);
  return Object.assign(api, { E, window });
}
const ESSAIS = {
  routes(co) {
    const M = monter(co);
    const r1 = M.lireRoute('#clients/clos-saint-aubin'), r2 = M.lireRoute('#facturation'), r3 = M.lireRoute('#%E0%A4%A'), r4 = M.lireRoute('');
    return r1.vue === 'clients' && r1.arg === 'clos-saint-aubin' && r2.vue === 'facturation' && r2.arg === '' && r3.vue === '' && r4.vue === ''
      && M.routeVersOnglet('facturation') === 'business' && M.routeVersOnglet('toString') === '' && M.routeVersOnglet('constructor') === ''
      && M.ongletVersRoute('business') === 'facturation' && M.ongletVersRoute('incidents') === 'incidents' && M.ongletVersRoute('nimporte') === '';
  },
  slugs(co) {
    const M = monter(co);
    return M.slugValide('clos-saint-aubin') && M.slugValide('dom2') && !M.slugValide('../x') && !M.slugValide('') && !M.slugValide('Clos')
      && !M.slugValide('a'.repeat(61)) && !M.slugValide('-tiret') && !M.slugValide('a b') && !M.slugValide('x"onerror');
  },
  noter(co) {
    const M = monter(co);
    M.window._agtRouteNoter('business'); M.window._agtRouteNoter('clients', 'clos-a'); M.window._agtRouteNoter('clients', '../pas'); M.window._agtRouteNoter('inconnu');
    return JSON.stringify(M.E.replace) === JSON.stringify(['#facturation', '#clients/clos-a', '#clients']);
  },
  arrivee(co) {
    const A = monter(co, { hash: '#clients/clos-a', onglet: 'radar' }); A.appliquerRoute();
    const B = monter(co, { hash: '#clients/clos-a', verrou: true }); B.appliquerRoute();
    const C = monter(co, { hash: '#clients/..%2Fx' }); C.appliquerRoute();
    const D = monter(co, { hash: '#facturation', onglet: 'business' }); D.appliquerRoute();
    return JSON.stringify(A.E.ouvert) === '["clients"]' && JSON.stringify(A.E.fiches) === '["clos-a"]'
      && B.E.ouvert.length === 0 && B.E.fiches.length === 0 && C.E.fiches.length === 0 && D.E.ouvert.length === 0;
  },
  recherche(co) {
    const M = monter(co);
    const d = { clients: [{ slug: 'domaine-berard', nom: 'Domaine Bérard' }, { slug: 'chateau-fontrouge', nom: 'Château Fontrouge' }],
      incidents: [{ id: 'g1', msg: 'Lecture refusée : config', n: 4, ouvert: true }], factures: [{ ref: 'MV-2026-0021', slug: 'chateau-fontrouge' }], leads: [{ nom: 'EARL des Coteaux' }] };
    const a = M.entreesPalette(d, 'bera', 12), b = M.entreesPalette(d, 'fontr', 12), c = M.entreesPalette(d, 'mv-2026-0021', 12), e = M.entreesPalette(d, 'coteaux', 12), f = M.entreesPalette(d, '', 5);
    return a[0] && a[0].titre === 'Domaine Bérard' && a[0].type === 'Client'
      && b[0].type === 'Client' && c[0].type === 'Facture' && e[0].type === 'Lead' && f.length === 5 && f[0].type === 'Commande'
      && (function(){ const o = M.entreesPalette({ clients: [{ slug: 'abbaye-lafont', nom: 'Abbaye Lafont' }, { slug: 'chateau-fontrouge', nom: 'Château Fontrouge' }, { slug: 'fontaine', nom: 'Fontaine & fils' }] }, 'font', 12).map(x => x.titre);
           return JSON.stringify(o) === JSON.stringify(['Fontaine & fils', 'Château Fontrouge', 'Abbaye Lafont']); })()
      && M.entreesPalette(d, 'zzz', 12).length === 0 && M.rang('Domaine Bérard', 'dom') === 3 && M.rang('Domaine Bérard', 'berard') === 2 && M.rang('Domaine Bérard', 'era') === 1;
  }
};
const LIB = {
  routes: '★★ les routes : #clients/<slug>, #facturation → l’onglet business (D7) ; une adresse cassée ou « toString » ne mène nulle part (GT-B31)',
  slugs: '★★ un slug venu de l’adresse n’atteint la console que s’il a la forme d’un slug',
  noter: '★ chaque onglet écrit son lien direct (sans empiler l’historique) ; un slug douteux reste hors de l’adresse',
  arrivee: '★★ la route d’arrivée ouvre l’écran et la fiche — jamais sous le verrou, jamais un slug douteux, rien si on y est déjà',
  recherche: '★★ la recherche : sans accents ni casse, le début d’un mot d’abord ; clients, incidents, factures, leads, commandes'
};
function statiques(S) {
  const r = [];
  const tabs = ['radar', 'incidents', 'clients', 'business', 'leads', 'outils'];
  const aside = S.html.slice(S.html.indexOf('<aside class="agt-side"'), S.html.indexOf('</aside>'));
  r.push([aside.length > 0 && tabs.every(t => aside.indexOf('data-tab="' + t + '" onclick="agtSwitchTab(\'' + t + '\')"') !== -1), '★★ la barre latérale mène aux six écrans (GT-B27)']);
  r.push([aside.indexOf('<span>Facturation</span>') !== -1 && S.html.indexOf(">Business<") === -1 && S.html.indexOf("onclick=\"agtSwitchTab('business')\">Facturation</button>") !== -1, '★ « Business » s’appelle « Facturation » (D7)']);
  r.push([aside.indexOf('onclick="agtPalette()" aria-keyshortcuts="Control+K"') !== -1 && aside.indexOf('onclick="agtLockNow()"') !== -1, 'la recherche (Ctrl K) et « Verrouiller » dans la barre']);
  const mq = S.css.slice(S.css.indexOf('@media (min-width:1100px){'), S.css.indexOf('.agt-side-marque{'));
  r.push([/\.agt-side\{display:none;\}/.test(S.css) && /#page-admin-gt \.agt-side\{display:flex;/.test(mq) && /#page-admin-gt \.agt-tabs,#page-admin-gt \.agt-bottom-bar\{display:none;\}/.test(mq)
    && /calc\(\(100% - 1180px\) \/ 2\)/.test(mq), '★★ sur ordinateur : la barre latérale, le contenu centré, les onglets du haut et la barre du bas effacés ; au téléphone, rien ne change']);
  const sw = fonction(S.gt, 'agtSwitchTab');
  r.push([sw.indexOf('window._agtRouteNoter(tab)') !== -1 && sw.indexOf(".agt-side-it") !== -1 && sw.indexOf("aria-current") !== -1, 'changer d’onglet : la barre, le titre et le lien direct suivent']);
  r.push([fonction(S.gt, 'renderAdminGT').indexOf('window._agtRouteAppliquer') !== -1, 'le premier chargement applique la route d’arrivée']);
  r.push([/window\._agtOngletCourant = function\(\)\{ return _agtTab; \};/.test(S.gt) && /window\._agtEstVerrouille = function\(\)\{ return !!_agtLocked; \};/.test(S.gt) && /window\._agtPaletteDonnees = function\(\)\{/.test(S.gt),
    'la console expose en lecture ce que la coquille lit']);
  r.push([fonction(S.gt, '_agtMajCompteurs').indexOf('_agtCompteursBarre();') !== -1, 'les nombres de la barre suivent les compteurs (GT-B21)']);
  r.push([/import '\.\/admin-gt\.js';\nimport '\.\/gt\/coquille\.js';/.test(S.entree), 'gt.js charge la coquille APRÈS la console (l’appli des clients ne la voit pas)']);
  r.push([/window\.agtPalette = function \(\) \{\n  if \(window\._agtEstVerrouille && window\._agtEstVerrouille\(\)\) return;/.test(S.co) && /if \(!page \|\| !page\.classList\.contains\('active'\)\) return;/.test(S.co),
    '★ la recherche ne s’ouvre jamais sous le verrou, ni hors de la console']);
  const zp = /\.agt-pal-fond\{position:fixed;inset:0;z-index:(\d+);/.exec(S.css), zv = /<div id="agt-lock"[^>]*z-index:(\d+)/.exec(S.html);
  r.push([zp && zv && +zp[1] > 10001 && +zp[1] < +zv[1], 'la palette passe au-dessus des fenêtres de la console, sous le verrou']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · les routes et la recherche ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.co); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · le câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}
const okC = [], koC = [];
function mord(titre, fichier, ancre, remplace, essai) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const S2 = Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) });
  let detecte;
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.co); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★ un slug quelconque passe', 'co', "return /^[a-z0-9][a-z0-9-]{0,59}$/.test(String(s || ''));", "return String(s || '').length > 0;", 'slugs');
mord('★★ « toString » devient une route', 'co', "return Object.prototype.hasOwnProperty.call(ROUTES, vue) ? ROUTES[vue] : '';", "return ROUTES[vue] || '';", 'routes');
mord('★★ la route d’arrivée passe sous le verrou', 'co', "  if (window._agtEstVerrouille && window._agtEstVerrouille()) return;\n  var r = lireRoute", "  var r = lireRoute", 'arrivee');
mord('★ un lien empile l’historique ou garde un slug douteux', 'co', "(arg && slugValide(arg) ? '/' + arg : '')", "(arg ? '/' + arg : '')", 'noter');
mord('★★ la recherche redevient sensible aux accents', 'co', "toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')", "toLowerCase()", 'recherche');
mord('★ le début d’un mot ne passe plus devant', 'co', "vues.sort(function (a, b) { return (b.r - a.r) || (a.i - b.i); });", "vues.sort(function (a, b) { return a.i - b.i; });", 'recherche');
mord('★★ changer d’onglet oublie le lien direct', 'gt', "  if(window._agtRouteNoter) window._agtRouteNoter(tab);\n", '', 'statiques');
mord('★ « Business » revient', 'html', "onclick=\"agtSwitchTab('business')\">Facturation</button>", "onclick=\"agtSwitchTab('business')\">Business</button>", 'statiques');
mord('★★ la recherche s’ouvre sous le verrou', 'co', "window.agtPalette = function () {\n  if (window._agtEstVerrouille && window._agtEstVerrouille()) return;", "window.agtPalette = function () {", 'statiques');
mord('★★ la barre latérale ne paraît plus sur ordinateur', 'css', "  #page-admin-gt .agt-tabs,#page-admin-gt .agt-bottom-bar{display:none;}\n", '', 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
