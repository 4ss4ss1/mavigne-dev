// HARNAIS — NOTIF-2 (§310) : une notification ne part que si l'appareil l'autorise, et un refus ne s'affiche jamais.
//   node scripts/mv-harnais-notif2.mjs           → doit être vert
//   node scripts/mv-harnais-notif2.mjs --contre  → chaque défaut réinjecté doit rougir
// Le défaut corrigé : `reg.showNotification` REJETTE sa promesse sans permission, et rien ne rattrapait ce rejet — le
// gestionnaire global l'affichait en orange (« Promesse rejetée : Failed to execute 'showNotification'… »). 19 fois du
// 20/09 au 10/10, après chaque mise en ligne : l'appel de NOTIF-1 (§158) était le seul sans garde (§158e ①).
// A. utils.js/_swNotify EXÉCUTÉE (extraite du vrai fichier) sur huit appareils : permission absente, refusée, API absente
//    (iOS hors écran d'accueil), accordée, retirée entre la garde et l'envoi, sans service worker, constructeur interdit
//    (Android). On compte ce qui est envoyé, ce qui est avalé, et les rejets NON GÉRÉS (process 'unhandledRejection').
// B. Lu (commentaires retirés) : un seul chemin vers showNotification et vers `new Notification` dans src/ — celui de
//    _swNotify. Un appel direct ajouté ailleurs contournerait la garde.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const SRC = fs.readdirSync(path.join(R, 'src')).filter(f => f.endsWith('.js')).sort();
const BASE = { u: lire('src/utils.js'), mods: Object.fromEntries(SRC.filter(f => f !== 'utils.js').map(f => [f, lire('src/' + f)])) };

const nonGerees = [];
process.on('unhandledRejection', r => { nonGerees.push(String((r && r.message) || r)); });

function corps(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } } throw new Error('accolades : ' + debut); }

// Un appareil. `perm` : ce que dit Notification.permission (undefined = pas d'API). `reelle` : ce que le navigateur
// applique AU MOMENT de l'envoi (différente de `perm` si la permission est retirée entre-temps). Comme Chrome,
// showNotification rejette dès que la permission réelle n'est pas 'granted'.
async function appareil(src, o) {
  const vu = { show: [], ctor: [], avale: [] };
  const reelle = o.reelle !== undefined ? o.reelle : o.perm;
  const reg = { showNotification: (t, op) => { vu.show.push([t, op]);
    return reelle === 'granted' ? Promise.resolve() : Promise.reject(new TypeError('No notification permission has been granted for this origin.')); } };
  const ctx = { console };
  if (o.perm !== undefined) {
    const N = function (t, op) { vu.ctor.push([t, op]); if (o.ctorInterdit) throw new TypeError("Failed to construct 'Notification': Illegal constructor."); };
    N.permission = o.perm; ctx.Notification = N;
  }
  ctx.navigator = o.sansApiSw ? {} : { serviceWorker: { controller: o.controleur ? {} : null, ready: Promise.resolve(reg) } };
  ctx._mvAvale = (e, ou) => { vu.avale.push(ou); };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(corps(src, 'function _swNotify('), ctx, { filename: 'notif2-extrait.js' });
  const avant = nonGerees.length; let leve = null;
  try { ctx._swNotify('Mise à jour Ma Vigne', { body: 'Fermez et rouvrez', tag: 'maj_dispo' }); } catch (e) { leve = e; }
  await new Promise(r => setTimeout(r, 30));
  return { ...vu, leve, rejets: nonGerees.length - avant };
}

async function partieA(S, T) {
  const propre = r => !r.leve && r.rejets === 0;
  const a1 = await appareil(S.u, { perm: 'default', controleur: true });
  T('A1 permission jamais donnée, service worker actif : rien n’est envoyé, aucun rejet non géré (envois ' + a1.show.length + ', rejets ' + a1.rejets + ')',
    propre(a1) && a1.show.length === 0 && a1.ctor.length === 0 && a1.avale.length === 0);
  const a2 = await appareil(S.u, { perm: 'denied', controleur: true });
  T('A2 permission refusée : rien n’est envoyé, aucun rejet non géré', propre(a2) && a2.show.length === 0 && a2.ctor.length === 0);
  const a3 = await appareil(S.u, { perm: undefined, controleur: true });
  T('A3 pas d’API Notification (iPhone, appli hors écran d’accueil) : rien n’est envoyé, rien ne lève', propre(a3) && a3.show.length === 0);
  const a4 = await appareil(S.u, { perm: 'granted', controleur: true });
  T('A4 permission accordée : la notification part, une fois, titre et options intacts', propre(a4) && a4.show.length === 1
    && a4.show[0][0] === 'Mise à jour Ma Vigne' && a4.show[0][1].tag === 'maj_dispo' && a4.avale.length === 0);
  const a5 = await appareil(S.u, { perm: 'granted', reelle: 'denied', controleur: true });
  T('A5 permission retirée entre la garde et l’envoi : le refus est avalé avec son nom, aucun rejet non géré (rejets ' + a5.rejets + ', avalés ' + a5.avale.join(',') + ')',
    propre(a5) && a5.show.length === 1 && a5.avale.length === 1 && a5.avale[0] === 'utils.js/_swNotify');
  const a6 = await appareil(S.u, { perm: 'granted', controleur: false });
  T('A6 sans service worker aux commandes : le constructeur sert de repli, une fois', propre(a6) && a6.show.length === 0 && a6.ctor.length === 1 && a6.ctor[0][0] === 'Mise à jour Ma Vigne');
  const a7 = await appareil(S.u, { perm: 'granted', controleur: false, ctorInterdit: true });
  T('A7 constructeur interdit (Android) : rien ne lève, le refus est avalé avec son nom', propre(a7) && a7.avale.length === 1 && a7.avale[0] === 'utils.js/_swNotify#new');
  const a8 = await appareil(S.u, { perm: 'default', sansApiSw: true });
  T('A8 ni service worker ni permission : rien, même pas le constructeur', propre(a8) && a8.ctor.length === 0 && a8.show.length === 0);
}

function partieB(S, T) {
  const u = sansCom(S.u), fn = sansCom(corps(S.u, 'function _swNotify('));
  const compte = (re) => { let n = (u.match(re) || []).length, ou = [];
    for (const [f, s] of Object.entries(S.mods)) { const k = (sansCom(s).match(re) || []).length; if (k) { n += k; ou.push(f + '×' + k); } } return { n, ou }; };
  const show = compte(/\.showNotification\s*\(/g), ctor = compte(/new\s+Notification\s*\(/g);
  T('B1 un seul appel à showNotification dans src/, celui de _swNotify (' + show.n + (show.ou.length ? ' — aussi : ' + show.ou.join(', ') : '') + ')',
    show.n === 1 && /\.showNotification\s*\(/.test(fn));
  T('B2 un seul `new Notification` dans src/, celui de _swNotify (' + ctor.n + (ctor.ou.length ? ' — aussi : ' + ctor.ou.join(', ') : '') + ')',
    ctor.n === 1 && /new\s+Notification\s*\(/.test(fn));
}

async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const [lib, f] of [['A', () => partieA(S, T)], ['B', () => partieB(S, T)]]) {
    try { await f(); } catch (e) { T(lib + ' a planté : ' + e.message, false); }
  }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('contre-épreuve introuvable ou multiple : ' + a.slice(0, 60)); return s.replace(a, b); };
const ANCIENNE = "function _swNotify(title, opts) {\n  if (navigator.serviceWorker && navigator.serviceWorker.controller) {\n    navigator.serviceWorker.ready.then(function(reg){ reg.showNotification(title, opts); });\n"
  + "  } else if ('Notification' in window && Notification.permission === 'granted') {\n    try { new Notification(title, opts); } catch(e){ if (window._mvAvale) window._mvAvale(e, 'utils.js/_swNotify#new'); }\n  }\n}";
if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert  ' : '  ROUGE ') + n); });
  console.log(ko ? `NOTIF-2 : ${ko} ROUGE(S) sur ${res.length}` : `NOTIF-2 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['la garde de permission disparaît', S => ({ ...S, u: remp(S.u, "  if (!('Notification' in window) || Notification.permission !== 'granted') return;\n", '') })],
    ['le refus de showNotification n’est plus rattrapé', S => ({ ...S, u: remp(S.u, "\n      .catch(function(e){ if (window._mvAvale) window._mvAvale(e, 'utils.js/_swNotify'); })", '') })],
    ['le .then ne rend plus la promesse (le .catch ne voit plus le refus)', S => ({ ...S, u: remp(S.u, 'function(reg){ return reg.showNotification(title, opts); }', 'function(reg){ reg.showNotification(title, opts); }') })],
    ['retour à la fonction de NOTIF-1', S => ({ ...S, u: remp(S.u, corps(S.u, 'function _swNotify('), ANCIENNE) })],
    ['un appel direct à showNotification ailleurs', S => ({ ...S, mods: { ...S.mods, 'app.js': S.mods['app.js'] + "\nnavigator.serviceWorker.ready.then(function(r){ r.showNotification('Ma Vigne', {}); });\n" } })],
    ['Android : le refus du constructeur redevient muet', S => ({ ...S, u: remp(S.u, "catch(e){ if (window._mvAvale) window._mvAvale(e, 'utils.js/_swNotify#new'); }", 'catch(e){ /* muet */ }') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `NOTIF-2 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `NOTIF-2 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
