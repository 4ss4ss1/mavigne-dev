// HARNAIS — VOILE-1 + PROFILS-1 (§243) : le voile tant que rien n'est prêt ; les tuiles de l'appareil d'abord.
//   node scripts/mv-harnais-voile1.mjs           → doit être vert
//   node scripts/mv-harnais-voile1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI bloc du voile d'app.js (« SPLASH SCREEN ») sur une horloge simulée, la VRAIE window._mvTuilesAppareil,
// et lit l'ordre réel de _fbLoad (firebase.js). Mesuré dans Chromium AVANT le lot (§241) : 3,42 s de voile imposé à
// chaque ouverture ; réseau sans réponse → zone des profils vide jusqu'à 18,6 s.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const APP = lire('src/app.js'), FB = lire('src/firebase.js');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function entre(src, debut, fin) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  if (src.indexOf(debut, i + 1) >= 0) throw new Error('en double : ' + debut);
  const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin introuvable après : ' + debut);
  return src.slice(i, j + fin.length);
}
const BASE = {
  voile: sansCom(entre(APP, 'var _MV_VOILE_VU = ', '\n})();\n')),
  tuiles: sansCom(entre(APP, 'window._mvTuilesAppareil = function(){', '\n};\n')),
  init: sansCom(entre(APP, 'function initLogin(){', '\n}\n')),
  load: sansCom(entre(FB, 'window._fbLoad = async function () {', '\n};\n')),
  demarre: sansCom(entre(APP, "document.addEventListener('DOMContentLoaded', _mvDemarrer);", '}, 2500);')),
};
// ── Une horloge simulée : setTimeout, setInterval, requestAnimationFrame avancent ensemble ──
function horloge() {
  let t = 0, seq = 0; const q = [];
  const ajoute = (f, ms, rep) => { const id = ++seq; q.push({ id, f, at: t + Math.max(0, ms || 0), rep: rep ? Math.max(1, ms) : 0 }); return id; };
  return {
    now: () => t,
    setTimeout: (f, ms) => ajoute(f, ms, false), setInterval: (f, ms) => ajoute(f, ms, true),
    clearTimeout: id => { const k = q.findIndex(x => x.id === id); if (k >= 0) q.splice(k, 1); },
    raf: f => ajoute(() => f(t), 16, false),
    avance(ms) { const fin = t + ms;
      for (let garde = 0; garde < 100000; garde++) { q.sort((a, b) => a.at - b.at || a.id - b.id); const x = q[0]; if (!x || x.at > fin) break;
        q.shift(); t = x.at; if (x.rep) q.push({ id: x.id, f: x.f, at: t + x.rep, rep: x.rep }); x.f(); }
      t = fin; },
  };
}
function El(id) { return { id, style: {}, children: [] }; }
function mondeVoile(B, o) {
  o = o || {};
  const H = horloge(), els = {}, ls = new Map(o.vu ? [['mavigne_voile_vu', '1']] : []);
  for (const id of ['splash-screen', 'sp-title', 'sp-logo-img', 'sp-flash', 'login-screen', 'login-profiles']) els[id] = El(id);
  const ctx = {
    document: { getElementById: id => els[id] || null },
    localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)) },
    setTimeout: H.setTimeout, setInterval: H.setInterval, clearTimeout: H.clearTimeout, clearInterval: H.clearTimeout,
    requestAnimationFrame: H.raf, Date: { now: H.now }, Math, console: { log() {}, warn() {} },
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(B.voile, ctx);
  return { H, els, ls, ctx, cache: () => els['splash-screen'].style.display === 'none' };
}
function mondeTuiles(B, o) {
  o = o || {};
  const rendu = [], appels = { load: 0 };
  const ctx = {
    MEMBRES: [], currentUser: o.connecte ? { nom: 'Nico' } : null, loginPendingIdx: o.touchee ? 0 : -1,
    sessionStorage: { getItem: k => (k === 'mavigne_demo_visite' && o.visite ? '1' : null) },
    localStorage: { getItem: k => (k === 'mavigne_tenant' ? (o.tenant || 'domaine-test') : null) },
    loadData: () => { appels.load++; if (!o.appareil) return false; ctx.MEMBRES = o.appareil; return true; },
    _loginRenderTuiles: () => rendu.push(ctx.MEMBRES.length),
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(B.tuiles, ctx);
  return { ctx, rendu, appels, r: ctx._mvTuilesAppareil() };
}
const M2 = [{ nom: 'Nico', statut: 'Actif' }, { nom: 'Ana', statut: 'Actif' }];
async function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── VOILE-1 ──
  let v = mondeVoile(B, { vu: false });
  v.H.avance(2000);
  T('première ouverture : le voile complet est encore là à 2 s', !v.cache());
  v.H.avance(1600);
  T('première ouverture : la chorégraphie se termine (voile retiré vers 3,4 s)', v.cache());
  T('… et l’appareil retient qu’il l’a vue', v.ls.get('mavigne_voile_vu') === '1');
  v = mondeVoile(B, { vu: true });
  v.els['login-profiles'].children.push({});               // les tuiles sont là presque tout de suite
  v.H.avance(500);
  T('ouverture habituelle, écran prêt : rien ne s’efface avant 600 ms (pas de clignotement)', !v.cache() && v.els['splash-screen'].style.opacity !== '0');
  v.H.avance(500);
  T('… le voile s’efface ensuite par un fondu (retiré avant 1,1 s)', v.cache() && v.els['splash-screen'].style.opacity === '0');
  v = mondeVoile(B, { vu: true });
  v.H.avance(3000);
  T('ouverture habituelle, rien de prêt : le voile reste (pas d’écran vide)', !v.cache());
  v.H.avance(3500);
  T('… et le filet de 6 s le retire quand même', v.cache());
  v = mondeVoile(B, { vu: true });
  v.H.avance(1500); v.els['login-screen'].style.display = 'none';   // quelqu'un est entré (ou l'écran de connexion a cédé)
  v.H.avance(400);
  T('ouverture habituelle : quelqu’un entre → le voile part aussitôt', v.cache());
  v = mondeVoile(B, { vu: true });
  v.H.avance(2400);
  T('ouverture habituelle : pas de lueur ni de flash (aucune animation lancée)', !v.els['sp-flash'].style.opacity && !v.els['sp-title'].style.textShadow);
  // ── PROFILS-1 ──
  let t = mondeTuiles(B, { appareil: M2 });
  T('l’appareil garde des profils : les tuiles s’affichent tout de suite', t.r === true && t.rendu.length === 1 && t.rendu[0] === 2);
  t = mondeTuiles(B, {});
  T('rien sur l’appareil : aucune tuile, on attend le serveur comme avant', t.r === false && t.rendu.length === 0);
  t = mondeTuiles(B, { appareil: [{ nom: 'Ancien', statut: 'Inactif' }] });
  T('seulement des profils inactifs : aucune tuile', t.r === false && t.rendu.length === 0);
  t = mondeTuiles(B, { appareil: M2, touchee: true });
  T('une tuile déjà touchée : ni la mémoire ni l’écran ne bougent', t.r === false && t.appels.load === 0 && t.rendu.length === 0);
  t = mondeTuiles(B, { appareil: M2, connecte: true });
  T('quelqu’un est déjà connecté : rien', t.r === false && t.appels.load === 0);
  t = mondeTuiles(B, { appareil: M2, visite: true });
  T('la visite guidée garde son écran', t.r === false && t.appels.load === 0);
  t = mondeTuiles(B, { appareil: M2, tenant: 'domaine-dupont' });
  T('le domaine de démo garde son écran du code d’accès', t.r === false && t.appels.load === 0);
  T('mêmes portes qu’initLogin (visite guidée, domaine de démo)', /mavigne_demo_visite'\)==='1'/.test(B.init) && /=== 'domaine-dupont'/.test(B.init));
  // ── L'ordre de _fbLoad ──
  const iT = B.load.indexOf('window._mvTuilesAppareil()'), iTen = B.load.indexOf("if (!localStorage.getItem('mavigne_tenant'))");
  const iS = B.load.indexOf("B.etape = 'statut'"), iR = B.load.indexOf("fbCallFn('getLoginRoster'");
  T('_fbLoad montre les tuiles de l’appareil APRÈS le domaine et AVANT les attentes réseau', iT > iTen && iTen >= 0 && iT < iS && iT < iR);
  const off = B.load.slice(B.load.indexOf('if (!navigator.onLine) {'), B.load.indexOf("showSyncBadge('⏳ Connexion…'"));
  T('la branche hors ligne passe par les helpers gardés', /_mvDonneesAppareil\(\);/.test(off) && /_mvProfilsAfficher\(\);/.test(off));
  T('plus aucun loadData ni initLogin nu dans _fbLoad', !/window\.loadData\(\)/.test(B.load) && !/window\.initLogin\(\)/.test(B.load));
  T('le démarrage part dès que la page est lue (DOMContentLoaded), load et le filet de 2,5 s restent',
    /document\.addEventListener\('DOMContentLoaded', _mvDemarrer\);/.test(B.demarre) && /window\.addEventListener\('load', _mvDemarrer\);/.test(B.demarre) && /\}, 2500\);/.test(B.demarre));
  return out;
}
async function joue(B) { try { return await suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(BASE)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nVOILE-1 + PROFILS-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['le voile complet revient à chaque ouverture', B => ({ ...B, voile: B.voile.replace('if(dejaVu && splash){', 'if(false && dejaVu && splash){') })],
  ['le voile s’efface avant 600 ms (clignotement)', B => ({ ...B, voile: B.voile.replace('if(Date.now()-t0>=_MV_VOILE_MIN && pret()){', 'if(pret()){') })],
  ['l’appareil n’enregistre plus qu’il a vu la chorégraphie', B => ({ ...B, voile: B.voile.replace("try{ localStorage.setItem(_MV_VOILE_VU,'1'); }", 'try{ }') })],
  ['le voile ne voit plus que quelqu’un est entré', B => ({ ...B, voile: B.voile.replace("return !!((ls && ls.style.display==='none') || (pr && pr.children.length));", 'return !!(pr && pr.children.length);') })],
  ['les tuiles de l’appareil écrasent une tuile touchée', B => ({ ...B, tuiles: B.tuiles.replace(" || (typeof window.loginPendingIdx==='number' && window.loginPendingIdx>=0)", '') })],
  ['les tuiles de l’appareil passent devant la visite guidée', B => ({ ...B, tuiles: B.tuiles.replace("if(sessionStorage.getItem('mavigne_demo_visite')==='1') return false;", '') })],
  ['un profil inactif suffit à montrer les tuiles', B => ({ ...B, tuiles: B.tuiles.replace(" && m.statut!=='Inactif'", '') })],
  ['_fbLoad attend de nouveau le serveur avant les tuiles', B => ({ ...B, load: B.load.replace("try { if (typeof window._mvTuilesAppareil === 'function') window._mvTuilesAppareil(); }", 'try { }') })],
  ['le démarrage attend de nouveau load (temps mort de 2,5 s)', B => ({ ...B, demarre: B.demarre.replace("document.addEventListener('DOMContentLoaded', _mvDemarrer);", '') })],
  ['la branche hors ligne redevient non gardée', B => ({ ...B, load: B.load.replace('    _mvDonneesAppareil();\n    _mvProfilsAfficher();\n    return;', '    window.loadData();\n    window.initLogin();\n    return;') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE);
  if (Object.keys(BASE).every(k => B2[k] === BASE[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const res = await joue(B2); const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
