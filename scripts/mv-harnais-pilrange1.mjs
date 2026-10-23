/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-1 (§438) : AUJOURD'HUI, LE COCKPIT D'ABORD — RIEN D'AUTRE N'EST CALCULÉ
   Lancer :          node scripts/mv-harnais-pilrange1.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange1.mjs --contre

   POURQUOI IL EXISTE
   Audit du 23/10 : _pilTabAuj construisait les tuiles d'avant en entier (marge, inaction, KPIs, décision du jour,
   alertes) à chaque affichage de l'écran d'arrivée de l'admin, puis le `return` du cockpit v2 jetait tout — trois
   générations calculées, une seule montrée. Ce harnais EXÉCUTE _pilTabAuj avec des bâtisseurs qui comptent leurs appels :
   1. cockpit v2 présent → le squelette v2 est rendu, le modèle est bâti UNE fois, le montage est programmé, et AUCUN
      bâtisseur de l'ancien ordre n'est appelé ;
   2. la photo du jour (_pilPhotoEcrire) et la marge (_pilMargeCalc) restent calculées une fois, avant tout ;
   3. cockpit v2 absent → l'ancien ordre (_pilTabAujAncien) prend le relais avec la même marge : l'écran ne reste pas blanc ;
   4. cockpit v2 qui lève → même repli, l'erreur avalée par _mvAvale, jamais un écran vide ;
   5. le fichier ne garde qu'UN chemin qui bâtit l'ancien ordre (dans _pilTabAujAncien), et la liste des harnais joue ce fichier.
   ⚠️ Il ne regarde pas un écran : rien ne change à l'écran, c'est précisément ce qu'il garantit.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const ANCIENS = ['_pilCockpitTimeline','_pilCkInaction','_pilSparkCharge','_pilSparkDernier','_pilSparkCadence','_pilCkTension','_pilCkBudget',
  '_pilCkEtp','_pilCkJours','_pilCkCave','_pilCkPres','_pilCkTraiter','_pilCkPrio','_pilTuileTension','_pilProtCarte','_pilCardTension','_pilCkAlertes',
  '_pilRetards','_pilPhotoListe','_pilMargeSous','_pilPctColor','_pilNum','_mvInfoBtn','_pilEsc'];

// Monte _pilTabAuj + _pilTabAujAncien dans un bac à sable où chaque dépendance compte ses appels.
function monter(S, opts) {
  const o = Object.assign({ ck2: true, ck2Leve: false, ckAuj: false }, opts || {});
  const appels = {}; const compte = (n) => { appels[n] = (appels[n] || 0) + 1; };
  const timers = [];
  const ctx = { appels, timers };
  const window = { isAdmin: () => true, _mvAvale: (e, ou) => compte('_mvAvale:' + ou), JOURNAL: [], PARCELLES: [], _mvkAvancement: () => '', _mvGraphSpark: () => '<svg/>', _pilShow: () => true };
  if (o.ck2) { window._ck2Squelette = () => { compte('_ck2Squelette'); return '<div class="ck2">squelette v2</div>'; };
    window._ck2Monter = (V) => { compte('_ck2Monter'); ctx.V = V; }; }
  if (o.ckAuj) window._ckAuj = (p) => { compte('_ckAuj'); return '<div class="ck1">cockpit de secours</div>'; };
  ctx.window = window;
  ctx.setTimeout = (fn) => { timers.push(fn); };
  ctx._pilMargeCalc = () => { compte('_pilMargeCalc'); return { marge: 2, seasonJ: 10, cadH: 34, objIso: '2026-11-15', gaugePct: 61 }; };
  ctx._pilPhotoEcrire = () => compte('_pilPhotoEcrire');
  ctx._pilCk2Modele = (d, m) => { compte('_pilCk2Modele'); if (o.ck2Leve) throw new Error('modèle en panne'); return { m: m, savoir: [] }; };
  ctx._pilCk2Eco = () => { compte('_pilCk2Eco'); return { budget: 1 }; };
  ctx._pilStickyH = () => compte('_pilStickyH');
  ctx._pilShow = () => true;
  ctx._rfCd = () => ({ taskDates: [] });
  ctx._pilGainsProlong = () => '';
  ANCIENS.forEach((n) => { ctx[n] = () => { compte(n); return '<span>' + n + '</span>'; }; });
  vm.createContext(ctx);
  vm.runInContext(corps(S.pil, '_pilTabAuj') + '\n' + corps(S.pil, '_pilTabAujAncien'), ctx);
  const html = ctx._pilTabAuj({ data: [], gaugePct: 61, totalReste: 478 });
  return { html, appels, timers, ctx };
}

let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const anciensAppeles = (a) => ANCIENS.filter((n) => a[n]);

function monterSur(S, o) { try { return monter(S, o); } catch (e) { return { html: '', appels: { PLANTAGE: 1 }, timers: [], ctx: {}, erreur: String(e && e.message || e) }; } }
function jouer(S) {
  // 1 · cockpit v2 présent
  const A = monterSur(S, { ck2: true, ckAuj: true });
  t('① le montage ne plante pas', !A.erreur, A.erreur);
  t('① v2 présent : le squelette v2 est rendu', A.html.indexOf('squelette v2') >= 0, A.html.slice(0, 80));
  t('① le modèle est bâti UNE fois, la vue Économie aussi', A.appels._pilCk2Modele === 1 && A.appels._pilCk2Eco === 1, JSON.stringify(A.appels));
  t('① le montage est programmé (un setTimeout) et monte le modèle', A.timers.length === 1 && (A.timers[0](), A.appels._ck2Monter === 1 && A.appels._pilStickyH === 1));
  t('① AUCUN bâtisseur de l\u2019ancien ordre n\u2019est appelé', anciensAppeles(A.appels).length === 0, 'appelés : ' + anciensAppeles(A.appels).join(', '));
  t('① le cockpit de secours (_ckAuj) n\u2019est pas appelé', !A.appels._ckAuj);
  // 2 · la photo et la marge
  t('② la photo du jour est écrite une fois, la marge calculée une fois', A.appels._pilPhotoEcrire === 1 && A.appels._pilMargeCalc === 1, JSON.stringify(A.appels));
  t('② le modèle reçoit la marge calculée (m.marge = 2)', A.ctx.V && A.ctx.V.m && A.ctx.V.m.marge === 2);
  // 3 · cockpit v2 absent
  const B = monterSur(S, { ck2: false, ckAuj: true });
  t('③ le repli ne plante pas', !B.erreur, B.erreur);
  t('③ v2 absent : l\u2019ancien ordre bâtit, le cockpit de secours rend', B.appels._ckAuj === 1 && B.html.indexOf('cockpit de secours') >= 0, B.html.slice(0, 80));
  t('③ … avec les tuiles d\u2019avant construites (au moins six bâtisseurs)', anciensAppeles(B.appels).length >= 6, 'appelés : ' + anciensAppeles(B.appels).length);
  t('③ … et la marge calculée UNE seule fois (reçue, pas recalculée)', B.appels._pilMargeCalc === 1, JSON.stringify(B.appels));
  const C = monterSur(S, { ck2: false, ckAuj: false });
  t('③ v2 et secours absents : l\u2019ancien HTML lui-même, jamais vide', C.html.length > 40 && C.html.indexOf('pil-cockpit-card') >= 0, C.html.slice(0, 60));
  // 4 · cockpit v2 qui lève
  const D = monterSur(S, { ck2: true, ck2Leve: true, ckAuj: true });
  t('④ v2 qui lève : repli sur l\u2019ancien ordre, erreur avalée (_mvAvale), écran non vide', D.appels['_mvAvale:pilotage.js/_pilTabAuj#ck2'] === 1 && D.html.indexOf('cockpit de secours') >= 0, JSON.stringify(D.appels));
  // 5 · un seul chemin qui bâtit l'ancien ordre
  const corpsAuj = corps(S.pil, '_pilTabAuj');
  t('⑤ _pilTabAuj ne bâtit plus rien de l\u2019ancien ordre (aucun _pilCk*, aucune tuile)', !/_pilCk[A-Z]|pil-cockpit-card|_ckAuj\(/.test(corpsAuj.replace(/\/\/.*$/gm, '')), 'motif trouvé dans _pilTabAuj');
  t('⑤ le squelette v2 passe AVANT le repli (return du v2 d\u2019abord)', corpsAuj.indexOf('_ck2Squelette()') > 0 && corpsAuj.indexOf('_ck2Squelette()') < corpsAuj.indexOf('_pilTabAujAncien(d,m)'));
  t('⑤ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange1.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange1.mjs --contre'") > 0);
}

if (!CONTRE) {
  jouer(S0);
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  // Contre-épreuves : chaque défaut réinjecté en mémoire doit rougir au moins une assertion.
  const mutants = [
    ['l\u2019ancien ordre repasse devant le v2 (la construction revient avant le return)', (S) => Object.assign({}, S, { pil: S.pil.replace(
        "  if(typeof window._ck2Squelette==='function'&&typeof window._ck2Monter==='function'){\n    try{ var _V=_pilCk2Modele(d,m);",
        "  var _H0=_pilTabAujAncien(d,m);\n  if(typeof window._ck2Squelette==='function'&&typeof window._ck2Monter==='function'){\n    try{ var _V=_pilCk2Modele(d,m);") })],
    ['le repli disparaît (écran blanc sans v2)', (S) => Object.assign({}, S, { pil: S.pil.replace('  return _pilTabAujAncien(d,m);\n}', "  return '';\n}") })],
    ['la photo du jour n\u2019est plus écrite', (S) => Object.assign({}, S, { pil: S.pil.replace('try{ _pilPhotoEcrire(d); }', 'try{ }') })],
    ['la marge est recalculée dans le repli', (S) => Object.assign({}, S, { pil: S.pil.replace('function _pilTabAujAncien(d,m){\n', 'function _pilTabAujAncien(d,m){\n  m=_pilMargeCalc(d);\n') })],
    ['la liste ne joue plus le harnais', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange1.mjs'").join("mv-harnais-pilrangeX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    const S = mut(S0);
    if (S.pil === S0.pil && S.liste === S0.liste) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ' rouge' + (ko > 1 ? 's' : '') + ')'); }
    else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
