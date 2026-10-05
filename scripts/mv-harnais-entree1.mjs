// HARNAIS — ENTREE-1 (§244) : se connecter SANS RÉSEAU, en retapant son mot de passe.
//   node scripts/mv-harnais-entree1.mjs           → doit être vert
//   node scripts/mv-harnais-entree1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (04/10) : « on peut se connecter même sans réseau (cave, mauvais signal) ». Exécute les VRAIES fonctions
// d'app.js (empreinte PBKDF2 par le WebCrypto de Node, vérification, entrée, connexion bornée, confirmLogin) et de
// firebase.js (_fbBasesDepuisAppareil, et la vraie fusion des parcelles), dans un vm. Aucun moteur inventé.
// Ce qu'aucun harnais ne voit : une vraie session Firebase gardée sur un vrai téléphone (§244e).
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
  const j = src.indexOf(fin, i + debut.length); if (j < 0) throw new Error('fin introuvable après : ' + debut);
  return src.slice(i, j + fin.length);
}
const BASE = {
  bloc: sansCom(entre(APP, 'var _MV_EMPREINTE_ITER = ', '\nfunction selectProfile(idx){')).replace(/\nfunction selectProfile\(idx\)\{$/, ''),
  login: sansCom(entre(APP, 'async function confirmLogin(){', '\n}\n')),
  erreur: sansCom(entre(APP, 'function _loginErreur(msg, relancer){', '\n}\n')),
  apres: sansCom(entre(APP, 'function _mvApresEntree(){', '\n}\n')),
  sortie: sansCom(entre(APP, 'function logout(){', '\n}\n')),
  snap: sansCom(entre(APP, 'function _mvSnapPayload(){', '\n}\n')),
  load: sansCom(entre(APP, 'function loadData() {', '\n}\n')),
  bases: sansCom(entre(FB, 'window._fbBasesDepuisAppareil = function (valeurs) {', '\n};\n')),
  fusion: sansCom(entre(FB, 'function _mvDeepEqual(a, b) {', '\n  return out;\n}\n')),
  online: sansCom(entre(FB, "window.addEventListener('online', function () {\n  if(DEBUG) console.log('[Réseau] Connexion rétablie');", '\n});\n')),
};
const vide = async (n = 12) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
// L'empreinte se calcule hors du fil JS (WebCrypto) : il faut du VRAI temps, pas seulement des tours de file.
const attendre = ms => new Promise(r => setTimeout(r, ms));
function El(id) { const el = { id, value: '', textContent: '', disabled: false, style: {}, children: [] };
  el.appendChild = c => { el.children.push(c); return c; }; el.focus = () => {}; return el; }
// Un téléphone : le domaine « domaine-test », une copie qui dit avoir reçu parcelles et membres du serveur (pas saisons).
function monde(B, o) {
  o = o || {};
  const ls = new Map(Object.entries(o.ls || {})), els = {}, minut = [], appels = { entree: 0, log: [], sign: 0 };
  let resoudre = null;
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, DEBUG: false, Promise, String, Object, JSON, Date, Math, Uint8Array, TextEncoder, btoa, atob,
    setTimeout: (f, ms) => { minut.push({ f, ms }); return minut.length; },
    navigator: { onLine: !o.horsLigne, vibrate() {} },
    localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : (k === 'mavigne_tenant' ? 'domaine-test' : null)), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) },
    document: { getElementById: id => els[id] || (els[id] = El(id)), createElement: () => El('cree'), body: { style: {} } },
    MEMBRES: [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }, { nom: 'Ana', statut: 'Actif', roles: ['ouvrier'] }],
    currentUser: null, _loginVoirTous: true, _mvKeySeen: {}, _mvKeyLoaded: {},
    _mvSnapCles: o.cles === undefined ? { parcelles: true, membres: true, saisons: false } : o.cles,
    _loginAwaitEmail: async () => 'compte.test', _mvLoadClaims: async () => {}, _mvMustChangePwd: () => !!o.mustpwd,
    _mvShowFirstPwd() {}, _loginMemEcrire() {}, _mvSessArm() {}, _mvApresEntree: () => { appels.entree++; },
    _mvValeursMemoire: () => ({ parcelles: [{ nom: 'P1' }] }),
    firebase: { auth: () => ({ signInWithEmailAndPassword: () => { appels.sign++;
      if (o.lent) return new Promise(r => { resoudre = () => r({ user: { uid: 'u1' } }); });
      if (o.code) return Promise.reject({ code: o.code });
      return Promise.resolve({ user: { uid: 'u1' } }); } }) },
  };
  ctx.window = ctx; ctx.crypto = globalThis.crypto;
  ctx._MV_CLAIMS = o.claims || {};
  ctx._fbUtilisateurPret = async () => (o.session === undefined ? { uid: 'u1' } : o.session);
  ctx._fbBasesDepuisAppareil = v => { appels.bases = v; return 1; };
  ctx.logError = x => appels.log.push(x); ctx._mvAvale = (e, ou) => appels.log.push({ cat: 'avale', msg: ou + ' ' + ((e && e.message) || e) });
  vm.createContext(ctx);
  vm.runInContext([B.bloc, B.login, B.erreur].join('\n'), ctx);
  return { ctx, els, ls, minut, appels, resoudre: () => resoudre && resoudre() };
}
async function connexion(c, mdp, idx) {
  c.ctx.loginPendingIdx = idx === undefined ? 0 : idx; c.els['login-pwd-input'] = El('login-pwd-input'); c.els['login-pwd-input'].value = mdp;
  c.els['login-pwd-btn'] = El('login-pwd-btn'); c.els['login-pwd-error'] = El('login-pwd-error');
  const p = c.ctx.confirmLogin(); await vide(); await attendre(350); await vide(); return p;
}
const CLE = 'mavigne_entree_v1_domaine-test';
// Une empreinte posée par une vraie connexion réussie (le vrai _mvEmpreinteEcrire, dans un premier téléphone).
async function empreinte(B, mdp, nom) {
  const c = monde(B, { claims: { tenant: 'domaine-test', adm: true, terms: { c: 1, d: 1 }, gtAdmin: true, mustpwd: false, gts: 9 } });
  c.ctx.MEMBRES[0].nom = nom || 'Nico';
  await connexion(c, mdp); await vide(20);
  return c.ls.get(CLE);
}
async function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── L'empreinte ──
  const e1 = await empreinte(B, 'cave-rouge-42');
  const E = e1 ? JSON.parse(e1) : {};
  T('connexion réussie avec réseau : le téléphone garde une empreinte du compte', !!e1 && E.v === 1 && E.nom === 'Nico' && E.uid === 'u1');
  T('… jamais le mot de passe lui-même', !!e1 && e1.indexOf('cave-rouge-42') < 0);
  T('… une vraie empreinte (sel de 16 octets, 32 octets d’empreinte, assez de tours)', !!e1 && atob(E.sel).length === 16 && atob(E.emp).length === 32 && E.iter >= 100000);
  T('… et les droits utiles hors réseau, sans ceux de GUERETTECH ni le mot de passe provisoire', !!e1 && E.droits && E.droits.adm === true && E.droits.terms && E.droits.gtAdmin === undefined && E.droits.mustpwd === undefined && E.droits.gts === undefined);
  let c = monde(B, { mustpwd: true }); await connexion(c, 'provisoire-1'); await vide(20);
  T('premier mot de passe (SEC-2) : aucune empreinte du provisoire', !c.ls.has(CLE));
  c = monde(B, { code: 'auth/invalid-credential' }); await connexion(c, 'faux'); await vide(20);
  T('mauvais mot de passe avec réseau : aucune empreinte', !c.ls.has(CLE) && c.els['login-pwd-error'].textContent === 'Mot de passe incorrect.');
  // ── Sans réseau ──
  const ok = async o => { const m = monde(B, Object.assign({ horsLigne: true, code: 'appCheck/fetch-network-error', ls: { [CLE]: e1 } }, o || {})); await connexion(m, (o && o.mdp) || 'cave-rouge-42', o && o.idx); await vide(20); return m; };
  c = await ok();
  T('sans réseau, bon mot de passe, session du téléphone à ce compte : on ENTRE', c.appels.entree === 1 && c.ctx.currentUser && c.ctx.currentUser.nom === 'Nico');
  T('… marquée « entrée sans réseau » (le retour du signal relancera la session)', c.ctx._mvEntreeHL === true);
  T('… avec les droits gardés sur le téléphone (sinon l’écran des conditions bloquerait l’admin)', c.ctx._MV_CLAIMS && c.ctx._MV_CLAIMS.adm === true && !!c.ctx._MV_CLAIMS.terms);
  T('… seules les clés que la copie dit venues du serveur sont libérées (parcelles, membres ; pas saisons)', c.ctx._mvKeySeen.parcelles === true && c.ctx._mvKeySeen.membres === true && !c.ctx._mvKeySeen.saisons);
  T('… et la copie du téléphone devient la base de fusion', !!(c.appels.bases && c.appels.bases.parcelles));
  c = await ok({ mdp: 'cave-rouge-43' });
  T('sans réseau, mauvais mot de passe : « Mot de passe incorrect. », on n’entre pas', c.appels.entree === 0 && c.els['login-pwd-error'].textContent === 'Mot de passe incorrect.');
  c = await ok({ ls: {} });
  T('sans réseau, aucune empreinte : la première connexion sur ce téléphone demande du réseau', c.appels.entree === 0 && /première connexion sur ce téléphone/.test(c.els['login-pwd-error'].textContent));
  c = await ok({ idx: 1 });
  T('sans réseau, empreinte d’une autre personne : seule la dernière personne connectée peut entrer', c.appels.entree === 0 && /seule la dernière personne connectée/.test(c.els['login-pwd-error'].textContent));
  c = await ok({ session: null });
  T('sans réseau, plus de session gardée sur le téléphone : on n’entre pas', c.appels.entree === 0 && /Pas de connexion réseau/.test(c.els['login-pwd-error'].textContent));
  c = await ok({ session: { uid: 'u2' } });
  T('sans réseau, la session gardée est celle d’un AUTRE compte : on n’entre pas', c.appels.entree === 0 && /seule la dernière personne connectée/.test(c.els['login-pwd-error'].textContent));
  c = await ok({ cles: null });
  T('copie d’avant le lot (sans liste des clés) : on entre, mais rien n’est libéré (prudence)', c.appels.entree === 1 && !c.ctx._mvKeySeen.parcelles);
  // ── Le réseau qui traîne ──
  c = monde(B, { lent: true, ls: { [CLE]: e1 } }); const pr = connexion(c, 'cave-rouge-42');
  await vide(); const t8 = c.minut.find(t => t.ms === 8000);
  T('réseau qui traîne : la connexion est bornée à 8 s quand une empreinte existe', !!t8);
  if (t8) t8.f(); await attendre(350); await vide(40);
  T('… au bout de la borne, l’empreinte ouvre', c.appels.entree === 1 && c.ctx._mvEntreeHL === true);
  c.resoudre(); await vide(20); await pr;
  T('… et la réponse tardive du serveur n’ouvre pas une seconde fois', c.appels.entree === 1);
  c = monde(B, { lent: true }); connexion(c, 'cave-rouge-42'); await vide();
  T('réseau qui traîne, sans empreinte : comme avant, on attend la réponse (aucune borne)', !c.minut.some(t => t.ms === 8000) && c.appels.entree === 0);
  // ── Les bases de fusion (le vrai _fbBasesDepuisAppareil) ──
  const fb = { _offlineQueue: { journal: [1] }, _baseParcelles: null, _fbBases: { sessions: ['serveur'] }, _MV_FUSION_EXCLUES: { parcelles: 1, kml_polygons: 1, travaux: 1 },
    _loadQueue() {}, deepClone: v => JSON.parse(JSON.stringify(v)), window: {} };
  vm.createContext(fb); vm.runInContext(B.bases.replace('window._fbBasesDepuisAppareil = function', 'var _b = function'), fb);
  vm.runInContext("_b({ parcelles:[{nom:'P1'}], journal:[{id:'a'}], sessions:[{id:'s'}], kml_polygons:[{x:1}], traitements:[{id:'t'}] })", fb);
  T('base de fusion : les parcelles prennent la copie du téléphone', Array.isArray(fb._baseParcelles) && fb._baseParcelles[0].nom === 'P1');
  T('… une clé déjà en file garde sa première base (rien posé)', fb._fbBases.journal === undefined);
  T('… une base déjà reçue du serveur n’est pas écrasée', fb._fbBases.sessions[0] === 'serveur');
  T('… le KML (remplacé, jamais fusionné) n’en reçoit pas ; les autres clés oui', fb._fbBases.kml_polygons === undefined && Array.isArray(fb._fbBases.traitements));
  // ── Pourquoi la base compte : la VRAIE fusion des parcelles ──
  const fu = {}; vm.createContext(fu); vm.runInContext(B.fusion, fu);
  const copie = [{ nom: 'P1', taches: { Taille: 'En cours', Palissage: 'Non démarré' } }];
  const moi = [{ nom: 'P1', taches: { Taille: 'En cours', Palissage: 'Validé' } }];          // validé sans réseau
  const serveur = [{ nom: 'P1', taches: { Taille: 'Validé', Palissage: 'Non démarré' } }];    // un collègue a fini la taille
  const avec = fu._mvMergeParcelles(copie, moi, serveur)[0].taches, sans = fu._mvMergeParcelles(serveur, moi, serveur)[0].taches;
  T('avec la copie pour base : ma validation ET celle du collègue sont gardées', avec.Palissage === 'Validé' && avec.Taille === 'Validé');
  T('sans base (base = serveur), la copie en retard aurait effacé la taille du collègue', sans.Taille === 'En cours');
  // ── Les branchements ──
  T('la copie locale dit quelles clés venaient du serveur (CLES), loadData la relit', /CLES: \{ parcelles:/.test(B.snap) && /_mvSnapCles = \(d && d\.CLES/.test(B.load));
  T('sans réseau, l’entrée dessine l’écran tout de suite (la suite partagée)', /\} else \{\s*_mvApresChargement\(\);\s*\}/.test(B.apres));
  T('au retour du signal : d’abord la file, puis la session complète', /window\._mvEntreeHL && !window\._authReady/.test(B.online) && B.online.indexOf('_flushQueue()') < B.online.indexOf('window._fbLoadAfterAuth()') && /_mvApresChargement\(\)/.test(B.online));
  T('une déconnexion volontaire efface l’empreinte (poste partagé)', /_mvEmpreinteEffacer\(\);/.test(B.sortie));
  return out;
}
async function joue(B) { try { return await suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(BASE)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nENTREE-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['le mot de passe est gardé en clair', B => ({ ...B, bloc: B.bloc.replace('emp:emp, droits:droits', 'emp:emp, mdp:String(mdp), droits:droits') })],
  ['l’empreinte est posée AVANT la garde SEC-2', B => ({ ...B, login: B.login
    .replace('    _mvEmpreinteEcrire(m, saisi, cred.user);', '')
    .replace('if (cred && cred._mvHL) return;', 'if (cred && cred._mvHL) return; if (cred && cred.user) _mvEmpreinteEcrire(m, saisi, cred.user);') })],
  ['la session du téléphone n’est plus vérifiée', B => ({ ...B, bloc: B.bloc.replace("if(String(u.uid)!==String(E.uid)) return { r:'autre' };", '') })],
  ['toutes les clés sont libérées, même un squelette', B => ({ ...B, bloc: B.bloc.replace("if(_mvSnapCles && _mvSnapCles[k]) _mvKeySeen[k] = true;", '_mvKeySeen[k] = true;') })],
  ['les droits ne sont plus restaurés', B => ({ ...B, bloc: B.bloc.replace("window._MV_CLAIMS = Object.assign({}, v.droits||{});", '0;') })],
  ['la base de fusion n’est plus posée', B => ({ ...B, bloc: B.bloc.replace('window._fbBasesDepuisAppareil(_mvValeursMemoire());', '0;') })],
  ['le réseau qui traîne n’est plus borné', B => ({ ...B, bloc: B.bloc.replace('}, _MV_ENTREE_LENTE);', '}, 999999);') })],
  ['la réponse tardive ouvre une seconde fois', B => ({ ...B, bloc: B.bloc.replace("sign.then(function(c){ if(!fini){ fini=true; res(c); } }", "sign.then(function(c){ fini=true; res(c); _mvApresEntree(); }") })],
  ['les bases écrasent la première base d’une clé en file', B => ({ ...B, bases: B.bases.replace('if (Object.prototype.hasOwnProperty.call(_offlineQueue, key)) return;', '') })],
  ['le retour du signal ne relance plus la session', B => ({ ...B, online: B.online.replace('window._mvEntreeHL && !window._authReady', 'false') })],
  ['une déconnexion garde l’empreinte', B => ({ ...B, sortie: B.sortie.replace('_mvEmpreinteEffacer();', '') })],
  ['l’entrée sans réseau ne dessine plus l’écran', B => ({ ...B, apres: B.apres.replace(/\} else \{\s*_mvApresChargement\(\);\s*\}/, '} else { window._dataReady = true; }') })],
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
