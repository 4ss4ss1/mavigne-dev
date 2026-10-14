#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — MAJ-2 : LA MISE À JOUR NE TRAÎNE PLUS (§327)
   Lancer : node scripts/mv-harnais-maj2.mjs          (+ --contre)

   ══ POURQUOI ══
   VER-1 (§184) n'activait la version en attente qu'au retour après ≥ 4 h, et seulement si elle avait DÉJÀ fini
   de s'installer : reg.update() rend la main avant la fin de l'installation, le retour la ratait, puis plus rien
   jusqu'au lendemain. Une saisie en file bloquait tout. Le téléphone de Nico tournait en 8.85 le 13/10 (§326).
   Maquette validée le 13/10 (« c'est parfait »).

   ══ CE QU'IL TIENT ══
     A. _mvMajRetard (exécutée) : orange à 24 h, pas avant, jamais sans date.
     B. _mvRienEnCours (exécutée) : une saisie EN FILE ne bloque plus ; un envoi EN ROUTE, une fenêtre, un champ
        actif bloquent.
     C. _mvMajCalme (exécutée) : version prête + rien en cours → MV_ACTIVER_CALME, marque posée ; au retour le
        rideau d'abord, en arrière-plan sans rideau ; fenêtre, envoi, pas de version, première installation, demande
        déjà partie → rien ; refus du service worker → on relâche (rideau fermé, marque retirée).
     D. Le piège de VER-1 (_mvMajSuivre, exécutée) : une version qui FINIT de s'installer est notée ; l'appli
        cachée, elle s'installe aussitôt ; affichée, elle est seulement annoncée.
     E. _mvMajAnnoncer (exécutée) : « Ma Vigne est à jour · version » après un rechargement qui a changé de
        version, pas pendant l'écran de démarrage ; rien pour la même version ni sans marque.
     F. _mvMajRailHtml (exécutée) : rien sans version ; carte + pastille ; orange au-delà de 24 h.
     G. Code lu : sw.js, boot.js, controllerchange, plus de seuil de 4 h, les deux moments, version.json, la fin
        d'installation attendue, le dock, coquille.js, index.html, firebase.js, la feuille, l'écran obligatoire.
   ⚠️ Contre-épreuves en mémoire (--contre), garde d'injection. CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { app: lire('src/app.js'), sw: lire('public/sw.js'), boot: lire('public/boot.js'), coq: lire('src/coquille.js'),
               fb: lire('src/firebase.js'), css: lire('src/styles.css'), html: lire('index.html') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };
function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  return null;
}
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

const FONCS = ['_mvMajPrete', '_mvMajRetard', '_mvMajDepuis', '_mvMajNoterDepuis', '_mvMajMarquer', '_mvMajDemarquer', '_mvMajToast',
  '_mvMajSuivre', '_mvMajNouvelle', '_mvMajCalme', '_mvMajRideau', '_mvMajRideauFermer', '_mvMajCta', '_mvMajRailHtml',
  '_mvMajAnnoncer', '_mvRienEnCours'];
const VARS = [/^var _MV_MAJ_RETARD_MS = .*$/m, /^var _MV_MAJ_DEPUIS = .*$/m, /^var _MV_MAJ_FAITE = .*$/m, /^var _mvMajReg = .*$/m, /^var _mvMajCherche = .*$/m];

function monter(S, o = {}) {
  const vars = VARS.map(x => { const m = S.app.match(x); if (!m) throw new Error('extraction ' + x); return m[0]; }).join('\n');
  const foncs = FONCS.map(n => { const b = bloc(S.app, 'function ' + n + '('); if (!b) throw new Error('extraction ' + n); return b; }).join('\n');
  const E = { posts: [], rideaux: 0, peint: 0, toasts: [], activer: 0, reload: 0, ls: {}, ss: {} };
  const el = {};
  if (o.splash) el['splash-screen'] = { style: { display: '' }, isConnected: true };
  const vis = { v: o.cache ? 'hidden' : 'visible' };
  const document = {
    get visibilityState() { return vis.v; },
    activeElement: o.champ ? { tagName: 'INPUT' } : { tagName: 'BODY' },
    querySelector: () => (o.ov ? {} : null),
    getElementById: id => el[id] || null,
    createElement: () => ({ attrs: {}, style: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
    body: { appendChild: n => { if (n.id === 'mv-maj-rideau') E.rideaux++; el[n.id] = n; n.parentNode = { removeChild: () => { delete el[n.id]; } }; },
            classList: { add() {}, remove() {} } },
    addEventListener: () => {}, removeEventListener: () => {}
  };
  const navigator = { serviceWorker: { controller: o.premiere ? null : {} }, onLine: true };
  const window = { APP_VERSION: o.version || '8.95', _mvAvale: () => {}, showToast: m => E.toasts.push(m),
                   _offlineQueueCount: () => o.file || 0, _mvEnvoisEnCours: () => o.route || 0 };
  const stock = st => ({ getItem: k => (Object.prototype.hasOwnProperty.call(st, k) ? st[k] : null),
                         setItem: (k, v) => { st[k] = String(v); }, removeItem: k => { delete st[k]; } });
  const timers = [];
  const setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; };
  const courir = (max = 300) => { let n = 0; while (timers.length && n++ < max) timers.shift().f(); };
  const lst = {};
  const reg = { waiting: o.pas ? null : { postMessage: m => E.posts.push(m.type) }, installing: null,
                addEventListener: (t, f) => { lst[t] = f; }, update: () => Promise.resolve() };
  const corps = vars + '\n' + foncs + '\nreturn { prete: _mvMajPrete, retard: _mvMajRetard, calme: _mvMajCalme, suivre: _mvMajSuivre,'
    + ' annoncer: _mvMajAnnoncer, rail: _mvMajRailHtml, rien: _mvRienEnCours, setReg: function (r) { _mvMajReg = r; },'
    + ' installe: function () { return _mvMajInstalle; } };';
  const api = new Function('window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'setTimeout', '_mvIcon', '_escHtml',
    '_mvMajPeindre', '_mvActiverMaj', '_swReload', corps)(window, document, navigator, stock(E.ls), stock(E.ss), setTimeout,
    n => '<svg data-ic="' + n + '"></svg>', s => String(s), () => { E.peint++; }, () => { E.activer++; }, () => { E.reload++; });
  if (!o.sansReg) api.setReg(reg);
  return { api, E, reg, lst, vis, timers, courir, el };
}

async function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  const titre = s => { if (!silencieux) console.log('\n' + c.b(s)); };
  try {
    titre('A. L’orange : « En attente depuis hier »');
    let M = monter(S, {}); const now = Date.now();
    t('Moins de 24 h → pas orange', M.api.retard(now - 23 * 3600000, now) === false);
    t('24 h → orange', M.api.retard(now - 24 * 3600000, now) === true);
    t('Sans date → jamais orange', M.api.retard(0, now) === false && M.api.retard(null, now) === false);

    titre('B. Rien en cours ?');
    const rien = o => monter(S, o).api.rien();
    t('Rien d’ouvert → oui', rien({}) === true);
    t('Une saisie EN FILE ne bloque plus (elle repart après la relance)', rien({ file: 3 }) === true);
    t('Un envoi EN ROUTE → non', rien({ route: 1 }) === false);
    t('Une fenêtre ouverte → non', rien({ ov: 1 }) === false);
    t('Un champ actif → non', rien({ champ: 1 }) === false);

    titre('C. Le moment calme');
    M = monter(S, { cache: true }); let r = M.api.calme('cache');
    t('Arrière-plan, version prête, rien en cours → MV_ACTIVER_CALME', r === true && M.E.posts.join() === 'MV_ACTIVER_CALME');
    t('… la marque est posée (écran de démarrage, toast après)', !!M.E.ss.mv_maj_faite && JSON.parse(M.E.ss.mv_maj_faite).de === '8.95');
    t('… sans rideau (personne ne regarde)', M.E.rideaux === 0);
    M = monter(S, {}); M.api.calme('retour');
    t('Au retour : le rideau, puis l’activation', M.E.rideaux === 1 && M.E.posts.join() === 'MV_ACTIVER_CALME');
    M = monter(S, { ov: 1 }); t('Fenêtre ouverte → rien', M.api.calme('cache') === false && M.E.posts.length === 0);
    M = monter(S, { route: 1 }); t('Envoi en route → rien', M.api.calme('cache') === false && M.E.posts.length === 0);
    M = monter(S, { pas: true }); t('Pas de version en attente → rien', M.api.calme('cache') === false && M.E.posts.length === 0);
    M = monter(S, { premiere: true }); t('Première installation (pas de contrôleur) → rien', M.api.calme('cache') === false && M.E.posts.length === 0);
    M = monter(S, {}); M.api.calme('cache'); r = M.api.calme('cache');
    t('Une seule demande à la fois', r === false && M.E.posts.length === 1);
    M = monter(S, {}); M.api.calme('retour'); M.courir();
    t('Refus du service worker : on relâche (rideau fermé, marque retirée)', M.api.installe() === false && !M.el['mv-maj-rideau'] && !M.E.ss.mv_maj_faite);

    titre('D. Le piège de VER-1 : la version qui FINIT de s’installer');
    M = monter(S, { cache: true, pas: true, sansReg: true }); M.api.suivre(M.reg);
    t('Rien n’attend au démarrage → rien d’annoncé, épisode fini', M.E.posts.length === 0 && !M.E.ls.mv_maj_depuis);
    let inst = { state: 'installing', addEventListener: (k, f) => { inst.f = f; } };
    M.reg.installing = inst; M.lst.updatefound(); inst.state = 'installed';
    M.reg.waiting = { postMessage: m => M.E.posts.push(m.type) }; inst.f();
    t('Elle est notée (depuis quand elle attend)', !!M.E.ls.mv_maj_depuis);
    t('… et, l’appli cachée, s’installe aussitôt', M.E.posts.join() === 'MV_ACTIVER_CALME');
    M = monter(S, { pas: true, sansReg: true }); M.api.suivre(M.reg);
    inst = { state: 'installing', addEventListener: (k, f) => { inst.f = f; } };
    M.reg.installing = inst; M.lst.updatefound(); inst.state = 'installed';
    M.reg.waiting = { postMessage: m => M.E.posts.push(m.type) }; inst.f();
    t('Appli affichée : annoncée, pas installée sous les doigts', M.E.posts.length === 0 && M.E.peint >= 2);
    M = monter(S, { sansReg: true }); M.api.suivre(M.reg);
    t('Une version qui attendait déjà au démarrage est annoncée', !!M.E.ls.mv_maj_depuis && M.E.peint >= 1 && M.E.posts.length === 0);

    titre('E. « Ma Vigne est à jour »');
    M = monter(S, { version: '8.95' }); M.E.ss.mv_maj_faite = JSON.stringify({ de: '8.94', t: 1 }); r = M.api.annoncer(); M.courir();
    t('Version changée → « Ma Vigne est à jour · 8.95 »', r === true && M.E.toasts.length === 1 && /à jour · 8\.95$/.test(M.E.toasts[0]));
    t('… la marque est retirée', !M.E.ss.mv_maj_faite);
    M = monter(S, { version: '8.95' }); M.E.ss.mv_maj_faite = JSON.stringify({ de: '8.95' }); r = M.api.annoncer(); M.courir();
    t('Même version (rechargé sans changer) → rien', r === false && M.E.toasts.length === 0);
    M = monter(S, {}); r = M.api.annoncer(); M.courir();
    t('Sans marque → rien', r === false && M.E.toasts.length === 0);
    M = monter(S, { version: '8.95', splash: true }); M.E.ss.mv_maj_faite = JSON.stringify({ de: '8.94' }); M.api.annoncer();
    if (M.timers.length) M.timers.shift().f();
    t('Pas pendant l’écran de démarrage', M.E.toasts.length === 0);
    M.el['splash-screen'].style.display = 'none'; M.courir();
    t('… dit dès qu’il est parti', M.E.toasts.length === 1);

    titre('F. La carte de la barre latérale');
    M = monter(S, { pas: true }); t('Rien n’attend → pas de carte', M.api.rail() === '');
    M = monter(S, {}); M.E.ls.mv_maj_depuis = String(Date.now()); let h = M.api.rail();
    t('« Nouvelle version prête », bouton et pastille', /Nouvelle version prête/.test(h) && (h.match(/data-mv-maj="1"/g) || []).length === 2 && /mv-maj-mini/.test(h) && !/retard/.test(h));
    M = monter(S, {}); M.E.ls.mv_maj_depuis = String(Date.now() - 25 * 3600000); h = M.api.rail();
    t('Après 24 h : orange, « En attente depuis hier »', /En attente depuis hier/.test(h) && /mv-maj-carte retard/.test(h));

    titre('G. Le câblage (code lu)');
    const sw = sansCom(S.sw);
    t('sw.js : MV_ACTIVER_CALME seulement si aucune autre fenêtre n’est affichée', /event\.data\?\.type === 'MV_ACTIVER_CALME'\) \{[\s\S]{0,200}includeUncontrolled: true[\s\S]{0,200}c\.id !== src && c\.visibilityState === 'visible'[\s\S]{0,80}if \(!autreVue\) return self\.skipWaiting\(\);/.test(sw));
    t('boot.js : l’écran de démarrage dit « Mise à jour »', /sessionStorage\.getItem\('mv_maj_faite'\)[\s\S]{0,120}getElementById\('sp-sub'\)[\s\S]{0,80}Mise \\u00e0 jour/.test(S.boot));
    const app = sansCom(S.app);
    t('controllerchange → _mvMajRecharger (jamais sous les doigts)', /addEventListener\('controllerchange', function\(\) \{[\s\S]{0,200}_mvMajRecharger\(\);/.test(app));
    t('Plus de seuil de 4 h', !/_MV_RETOUR_H/.test(app));
    t('Arrière-plan → moment calme ; retour → moment calme, sinon recherche', /if\(document\.visibilityState === 'hidden'\)\{ _mvMajCalme\('cache'\); return; \}[\s\S]{0,300}if\(!_mvMajCalme\('retour'\)\) _mvMajChercher\(\);/.test(app));
    const vv = bloc(app, 'async function _mvVerifierVersion(') || '';
    t('version.json annonce une autre version → recherche (ordinateur resté ouvert)', vv.indexOf('_mvPasserPerime(j);') > 0 && vv.indexOf('_mvMajVersionServeur') > vv.indexOf('_mvPasserPerime(j);'));
    t('La recherche attend la fin de l’installation', /function _mvMajChercher\(\)\{[\s\S]{0,400}_mvMajFinInstall\(15000\)/.test(app));
    t('Le dock repeint la barre', /function _dockBuild\(\)\{\s*setTimeout\(function\(\)\{ if\(window\._mvMajPeindre\) window\._mvMajPeindre\(\); \}, 0\);/.test(app));
    t('coquille.js : le logement de la carte avant le pied', /id="mv-rail-maj"[\s\S]{0,160}_mvMajRailHtml[\s\S]{0,200}mv-rail-bas/.test(S.coq));
    t('index.html : Réglages › Moi › Mise à jour (état, bouton)', /id="regl-maj-row"[\s\S]{0,800}id="regl-maj-etat"[\s\S]{0,200}id="regl-maj-btn"[^>]*_mvMajBoutonReglages/.test(S.html));
    t('firebase.js : les envois en route se comptent', /window\._mvEnvoisEnCours = function \(\) \{ return Object\.keys\(_mvEnvoiDernier\)\.length; \};/.test(S.fb));
    t('Feuille : la barre, son décalage, le rideau, l’écran obligatoire', /#mv-maj-barre\{/.test(S.css) && /body\.mv-maj-barre #trac-fab/.test(S.css) && /#mv-maj-rideau\{/.test(S.css) && /\.mv-perime-carte\{/.test(S.css));
    const ep = bloc(app, 'function _mvEcranPerime(') || '';
    t('Écran obligatoire : plus de vert en dur, le bouton de la charte, le rideau', ep && !/#3D6B27/.test(ep) && /mv-perime-b/.test(ep) && /_mvMajRideau\(\)/.test(ep));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!process.argv.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais MAJ-2'));
  const r = await jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, a, b) { if (!S[f].includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 50)); return Object.assign({}, S, { [f]: S[f].replace(a, b) }); }
const MUT = [
  ['une saisie en file bloque de nouveau la mise à jour', S => muter(S, 'app', "if(typeof window._mvEnvoisEnCours==='function' && window._mvEnvoisEnCours()>0) return false;", "if(typeof window._offlineQueueCount==='function' && window._offlineQueueCount()>0) return false;")],
  ['un envoi en route ne retient plus la mise à jour', S => muter(S, 'app', "if(typeof window._mvEnvoisEnCours==='function' && window._mvEnvoisEnCours()>0) return false;", '')],
  ['le moment calme ignore ce qui est en cours', S => muter(S, 'app', 'if(!_mvRienEnCours()) return false;', 'if(false) return false;')],
  ['orange dès la première minute', S => muter(S, 'app', '(maintenant - d) >= _MV_MAJ_RETARD_MS', '(maintenant - d) >= 0')],
  ['le retour sans rideau', S => muter(S, 'app', "if(moment === 'retour') _mvMajRideau();", '')],
  ['la version qui finit de s\u2019installer passe inaperçue (le piège de VER-1)', S => muter(S, 'app', "if(inst.state === 'installed' && navigator.serviceWorker.controller) _mvMajNouvelle();", 'if(false) _mvMajNouvelle();')],
  ['« à jour » annoncé sans changement de version', S => muter(S, 'app', 'if(!v || de === v) return false;', 'if(!v) return false;')],
  ['sw.js active malgré une autre fenêtre affichée', S => muter(S, 'sw', 'if (!autreVue) return self.skipWaiting();', 'return self.skipWaiting();')],
  ['controllerchange recharge de nouveau tout de suite', S => muter(S, 'app', '      _mvMajRecharger();\n    });', '      _swReload();\n    });')],
  ['le seuil de 4 h revient', S => muter(S, 'app', 'var _MV_MAJ_RETARD_MS = ', 'var _MV_RETOUR_H = 4;\nvar _MV_MAJ_RETARD_MS = ')],
  ['le refus du service worker laisse le rideau', S => muter(S, 'app', '_mvMajInstalle = false; _mvMajRideauFermer(); _mvMajDemarquer(); _mvMajPeindre();', '_mvMajInstalle = false; _mvMajPeindre();')],
];
console.log(c.b('MA VIGNE — Harnais MAJ-2 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = await jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent' + (bad ? c.r(' — ' + bad + ' en défaut') : '') + '\n');
process.exit(bad ? 1 : 0);
