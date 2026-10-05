// HARNAIS — GT-1 (§249) : la console GUERETTECH quitte le téléphone des clients (gt.html, sa propre entrée).
//   node scripts/mv-harnais-gt1.mjs           → doit être vert
//   node scripts/mv-harnais-gt1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE fabrique de gt.html (scripts/mv-gt-page.mjs), la VRAIE exclusion du précache
// (scripts/inject-precache.mjs) et le VRAI geste des cinq appuis (onboarding.js) ; relit l'entrée, la configuration Vite,
// les scripts npm, l'hébergement et le preflight. Preuve sur le build réel dans Chromium : §249c.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const BASE0 = { app: lire('src/app.js'), gt: lire('src/gt.js'), index: lire('index.html'), connexion: lire('src/gt/connexion.html'),
  console: lire('src/gt/console.html'), onb: lire('src/onboarding.js'), vite: lire('vite.config.js'), pkg: lire('package.json'),
  ignore: lire('.gitignore'), fb: lire('firebase.json'), pf: lire('scripts/preflight.mjs'), fab: lire('scripts/mv-gt-page.mjs'), pre: lire('scripts/inject-precache.mjs') };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
// Les deux modules réels, chargés depuis leur TEXTE (les contre-épreuves en injectent une version fautive).
async function charger(texte, nom) {
  const f = path.join(R, 'scripts', '.mv-gt1-' + nom + '-' + process.pid + '.mjs');
  fs.writeFileSync(f, texte.replace("from 'url';", "from 'url';").replace(/^if \(process\.argv\[1\][\s\S]*$/m, '').replace(/^const PRINCIPAL[\s\S]*$/m, ''));
  try { return await import(pathToFileURL(f).href + '?' + Date.now()); } finally { fs.unlinkSync(f); }
}
function geste(onb, avecPanneau) {
  const el = {}, appels = { montre: 0 }, ecoute = [];
  const mk = id => (el[id] = el[id] || { id, style: {}, value: '', disabled: false, textContent: '', focus() {}, addEventListener: (t, f) => ecoute.push(f) });
  const ids = ['login-logo-tap', 'gt-otp-box', 'gt-login-btn', 'gt-login-pwd', 'gt-otp-code', 'login-profiles', 'login-pwd-panel', 'gt-login-email'].concat(avecPanneau ? ['gt-login-panel'] : []);
  ids.forEach(mk);
  const ctx = { document: { getElementById: id => el[id] || null }, location: { href: '/' }, setTimeout: () => 0, clearTimeout() {}, _gtTapCount: 0, _gtTapTimer: null };
  vm.createContext(ctx);
  vm.runInContext('var _gtAutoVu = false;\n' + fonction(onb, 'showGTLoginPanel') + '\n' + fonction(onb, 'initGTLoginTap'), ctx);
  const montrer = ctx.showGTLoginPanel; ctx.showGTLoginPanel = function () { appels.montre++; return montrer.apply(this, arguments); };
  return { ctx, el, appels, ecoute };
}
async function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  T('l’appli des clients n’importe plus la console (app.js)', !/^\s*import\s+['"]\.\/admin-gt\.js['"]/m.test(sansCom(B.app)));
  T('l’entrée de gt.html charge l’appli PUIS la console (src/gt.js)', /import '\.\/app\.js';\s*\nimport '\.\/admin-gt\.js';/.test(sansCom(B.gt)));
  const ix = B.index.replace(/<!--[\s\S]*?-->/g, '');
  T('index.html ne contient plus rien de la console (page, verrou, nouveau domaine, appels agt…)',
    !/id="page-admin-gt"|id="agt-|id="ovAddTenant"|onclick="agt|saveAddTenant|agtSlugPreview/.test(ix));
  T('… ni le panneau de connexion GUERETTECH', !/id="gt-login-panel"|confirmGTLogin|confirmGTOtp|gtOtpResend/.test(ix));
  T('… mais un repère de chaque fragment, une fois', (B.index.match(/<!-- MV-GT:CONNEXION —/g) || []).length === 1 && (B.index.match(/<!-- MV-GT:CONSOLE —/g) || []).length === 1);
  T('les fragments portent ce qui est parti', /id="page-admin-gt"/.test(B.console) && /id="agt-lock"/.test(B.console) && /id="ovAddTenant"/.test(B.console)
    && /id="gt-login-panel"/.test(B.connexion) && /id="gt-otp-box"/.test(B.connexion));
  // La vraie fabrique
  const F = await charger(B.fab, 'fab');
  let h = '', refus = false;
  try { h = F.fabriquerPageGT(B.index, B.connexion, B.console); } catch (e) { h = ''; }
  try { F.fabriquerPageGT(B.index.replace(/<!-- MV-GT:CONSOLE —[^\n]*-->/, ''), B.connexion, B.console); } catch (e) { refus = true; }
  T('gt.html fabriqué contient la console et le panneau de connexion', /id="page-admin-gt"/.test(h) && /id="gt-login-panel"/.test(h) && /id="ovAddTenant"/.test(h));
  T('… charge src/gt.js et plus src/app.js', /<script type="module" src="\/src\/gt\.js"><\/script>/.test(h) && !/src="\/src\/app\.js"/.test(h));
  T('… n’est pas indexé (une seule balise robots, noindex, nofollow), sans manifeste d’installation, titré GUERETTECH',
    (h.match(/<meta name="robots"/g) || []).length === 1 && /content="noindex, nofollow"/.test(h) && !/rel="manifest"/.test(h) && /<title>Ma Vigne · GUERETTECH<\/title>/.test(h));
  T('… dit qu’il est fabriqué (ne pas éditer), et la fabrique est stable', /^<!-- FABRIQUÉ par scripts\/mv-gt-page\.mjs/.test(h) && h === F.fabriquerPageGT(B.index, B.connexion, B.console));
  T('… et la fabrique REFUSE un index.html sans repère (jamais de page à moitié)', refus);
  // Le build et l'hébergement
  T('Vite construit les deux pages', /input:\s*\{\s*main:\s*'\.\/index\.html',\s*gt:\s*'\.\/gt\.html'\s*\}/.test(B.vite));
  T('npm run build et npm run dev fabriquent gt.html avant Vite', /"build": "node scripts\/mv-gt-page\.mjs && vite build/.test(B.pkg) && /"dev": "node scripts\/mv-gt-page\.mjs && vite"/.test(B.pkg));
  T('gt.html n’entre pas dans git (fabriqué)', /^gt\.html$/m.test(B.ignore));
  let fbj = {}; try { fbj = JSON.parse(B.fb); } catch (e) { fbj = {}; }
  const H = (fbj.hosting && fbj.hosting.headers) || [];
  T('gt.html servi sans cache, comme index.html', H.some(x => /\/gt\.html/.test(x.source) && x.headers.some(k => k.key === 'Cache-Control' && /no-cache/.test(k.value))));
  T('… et non indexé côté serveur (X-Robots-Tag)', H.some(x => x.source === '/gt.html' && x.headers.some(k => k.key === 'X-Robots-Tag' && /noindex/.test(k.value))));
  // Le vrai précache
  const P = await charger(B.pre, 'pre');
  const toutes = ['/assets/app-1.js', '/assets/app-1.css', '/assets/gt-1.js', '/assets/pdf-1.js'];
  const idx = '<link rel="stylesheet" href="/assets/app-1.css"><script type="module" src="/assets/app-1.js"></script>';
  const gtp = '<script type="module" src="/assets/gt-1.js"></script><link rel="modulepreload" href="/assets/app-1.js"><link rel="stylesheet" href="/assets/app-1.css">';
  const r = P.precacheSansGT(toutes, idx, gtp), r0 = P.precacheSansGT(toutes, idx, '');
  T('précache : le fichier propre à la console n’est JAMAIS téléchargé par un client', r.exclus.join() === '/assets/gt-1.js' && r.garder.indexOf('/assets/gt-1.js') < 0);
  T('… le code commun et celui chargé à la demande restent précachés', ['/assets/app-1.js', '/assets/app-1.css', '/assets/pdf-1.js'].every(u => r.garder.includes(u)));
  T('… et sans gt.html dans le build, rien n’est retiré', r0.garder.length === toutes.length && !r0.exclus.length);
  // Le vrai geste des cinq appuis
  let g = geste(B.onb, false); g.ctx.initGTLoginTap(); for (let i = 0; i < 5; i++) g.ecoute.forEach(f => f());
  T('appli des clients : cinq appuis sur le logo envoient vers /gt.html', g.ctx.location.href === '/gt.html' && g.appels.montre === 0);
  g = geste(B.onb, true); g.ctx.initGTLoginTap(); g.ctx.initGTLoginTap();
  T('gt.html : le panneau de connexion s’ouvre de lui-même, une seule fois', g.appels.montre === 1 && g.el['gt-login-panel'].style.display === 'block');
  for (let i = 0; i < 5; i++) g.ecoute[0]();
  T('… et les cinq appuis l’ouvrent sans quitter la page', g.ctx.location.href === '/' && g.appels.montre === 2);
  T('dans l’appli des clients, aller à la console renvoie vers gt.html (goTo)', /if\(page==='admin-gt' && !document\.getElementById\('page-admin-gt'\)\)\{ location\.href='\/gt\.html'; return; \}/.test(B.app));
  T('le preflight lit aussi les fragments de gt.html (ids, appels, caractères)', (B.pf.match(/htmlGT\(\)/g) || []).length >= 3 && /listDir\('src\/gt', '\.html'\)/.test(B.pf));
  return out;
}
async function joue(B) { try { return await suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(BASE0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nGT-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['app.js réimporte la console', B => ({ ...B, app: B.app.replace("import './onboarding.js';\n", "import './onboarding.js';\nimport './admin-gt.js';\n") })],
  ['la page de la console reste dans index.html', B => ({ ...B, index: B.index.replace(/<!-- MV-GT:CONSOLE —[^\n]*-->/, B.console.replace(/^<!-- ★★ GT-1[\s\S]*?-->\n/, '')) })],
  ['la fabrique garde l’entrée de l’appli client', B => ({ ...B, fab: B.fab.replace(".replace(ENTREE_CLIENT, ENTREE_GT)", "") })],
  ['la fabrique garde le manifeste d’installation', B => ({ ...B, fab: B.fab.replace(".replace(/<link rel=\"manifest\"[^>]*>\\n?/g, '')", "") })],
  ['la fabrique accepte un repère absent', B => ({ ...B, fab: B.fab.replace("  unique(index, REPERES.console, 'repère MV-GT:CONSOLE');\n", "") })],
  ['le précache garde le fichier de la console', B => ({ ...B, pre: B.pre.replace("return { garder: urls.filter(u => !seulGT.has(u)), exclus: urls.filter(u => seulGT.has(u)) };", "return { garder: urls.slice(), exclus: [] };") })],
  ['Vite oublie gt.html', B => ({ ...B, vite: B.vite.replace("input: { main: './index.html', gt: './gt.html' },", "input: { main: './index.html' },") })],
  ['le build ne fabrique plus gt.html', B => ({ ...B, pkg: B.pkg.replace('"build": "node scripts/mv-gt-page.mjs && vite build', '"build": "vite build') })],
  ['gt.html redevient cachable', B => ({ ...B, fb: B.fb.replace('"source": "@(/|/index.html|/gt.html)"', '"source": "@(/|/index.html)"') })],
  ['cinq appuis ouvrent le panneau (absent) au lieu d’envoyer vers gt.html', B => ({ ...B, onb: B.onb.replace("      if (!document.getElementById('gt-login-panel')) { location.href = '/gt.html'; return; }\n", "") })],
  ['gt.html n’ouvre plus le panneau de lui-même', B => ({ ...B, onb: B.onb.replace("  if (document.getElementById('gt-login-panel') && !_gtAutoVu) { _gtAutoVu = true; showGTLoginPanel(); }\n", "") })],
  ['le preflight ne lit plus les fragments', B => ({ ...B, pf: B.pf.replace(/ \+ '\\n' \+ htmlGT\(\)/g, '') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (Object.keys(BASE0).every(k => B2[k] === BASE0[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = (await joue(B2)).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
