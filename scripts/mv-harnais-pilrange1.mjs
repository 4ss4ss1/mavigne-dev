/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-1 (§439) + PIL-RANGE-1b (§441) : AUJOURD'HUI SANS L'ANCIEN ORDRE ; LA CARTE DU TRACTEUR RELOGÉE
   Lancer :          node scripts/mv-harnais-pilrange1.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange1.mjs --contre

   POURQUOI IL EXISTE
   PIL-RANGE-1 (§439) : _pilTabAuj construisait les tuiles d'avant puis les jetait — le cockpit v2 est passé en premier.
   PIL-RANGE-1b (§441) : l'ancien ordre (_pilTabAujAncien et 16 fonctions du Pilotage) et le rendu de secours de cockpit.js
   (_ckAuj et 20 aides) sont RETIRÉS, mesurés au point fixe (aucune référence vivante). La moitié de cockpit.js qui nourrit
   le cockpit v2 reste. La carte du tracteur (GNR-M §213, GNR-2 §256), invisible depuis REF-1, est relogée dans
   Équipe & matériel › Matériel — choix de Nico (« A », maquette validée « go » le 23/10). Ce harnais EXÉCUTE :
   1. _pilTabAuj : v2 présent → squelette, modèle bâti une fois, montage programmé ; photo et marge une fois ;
   2. v2 absent ou qui lève → un message, jamais un écran blanc, l'erreur avalée ; plus aucun ancien cockpit appelé ;
   3. _pilTabMat : les cartes du tracteur sous leur titre quand il y a quelque chose à dire, rien (pas même le titre) sinon,
      rien si la case « mat_travaux » est décochée, l'erreur avalée sans perdre les trois panneaux ;
   et lit sur le texte : les fonctions retirées n'existent plus, celles que le v2 lit existent encore, la case est dans
   « Afficher dans cet onglet », les neuf fiches « i » de l'ancien écran sont parties, la liste joue ce fichier.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), ck: lire('src/cockpit.js'), vue: lire('src/cockpit-vue.js'), app: lire('src/app.js'), utils: lire('src/utils.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const RETIREES_PIL = ['_pilTabAujAncien', '_pilCkAlertes', '_pilCkBudget', '_pilCkCave', '_pilCkEtp', '_pilCkInaction', '_pilCkJours', '_pilCkPres',
  '_pilCkPrio', '_pilCkTension', '_pilCkTraiter', '_pilCockpitTimeline', '_pilMargeSous', '_pilPhotoSerie', '_pilSparkBudget', '_pilSparkCadence',
  '_pilSparkCharge', '_pilSparkDernier', '_pilSparkNOk', '_pilTuileTension'];
const RETIREES_CK = ['_ckApres', '_ckAuj', '_ckBasculeHtml', '_ckChargeSvg', '_ckDate', '_ckEsc', '_ckFilHtml', '_ckHa', '_ckJour', '_ckMeteoCache',
  '_ckPlanCorps', '_ckPlanDispo', '_ckPlanInitiales', '_ckPlanOuvrir', '_ckPlanPeriode', '_ckPlanSvg', '_ckPlanTache', '_ckQuand', '_ckResumeHtml',
  '_ckSavoirHtml', '_ckVue'];
const GARDEES_CK = ['_ckFilDonnees', '_ckTracJour', '_ckMeteoJour', '_ckPlanEtats', '_ckPlanDebuts', '_ckPlanTaches', '_ckQui', '_ckEt', '_ckChargeSerie',
  '_ckSvMeteo', '_ckSvAbsences', '_ckSvContrats', '_ckSvRetards'];
const FICHES = ['pil.plan', 'pil.savoir', 'pil.fil', 'pil.charge', 'pil.marge', 'pil.spark', 'pil.tension', 'pil.inaction', 'pil.prio'];
const defini = (src, n) => new RegExp('(?:^|\\n)(?:function\\s+' + n + '\\s*\\(|window\\.' + n + '\\s*=\\s*function)').test(src);

function monterAuj(S, o) {
  const a = {}; const compte = (n) => { a[n] = (a[n] || 0) + 1; }; const timers = [];
  const window = { _mvAvale: (e, ou) => compte('_mvAvale:' + ou), _ckAuj: () => { compte('_ckAuj'); return 'ANCIEN'; } };
  if (o.ck2) { window._ck2Squelette = () => { compte('_ck2Squelette'); return '<div class="ck2">squelette</div>'; }; window._ck2Monter = () => compte('_ck2Monter'); }
  const ctx = { window, setTimeout: (f) => timers.push(f),
    _pilMargeCalc: () => { compte('_pilMargeCalc'); return { marge: 2 }; }, _pilPhotoEcrire: () => compte('_pilPhotoEcrire'),
    _pilCk2Modele: () => { compte('_pilCk2Modele'); if (o.leve) throw new Error('panne'); return {}; }, _pilCk2Eco: () => { compte('_pilCk2Eco'); return {}; },
    _pilStickyH: () => compte('_pilStickyH') };
  vm.createContext(ctx); vm.runInContext(corps(S.pil, '_pilTabAuj'), ctx);
  return { html: ctx._pilTabAuj({}), a, timers };
}
function monterMat(S, o) {
  const a = {}; const compte = (n) => { a[n] = (a[n] || 0) + 1; };
  const show = Object.assign({ mat_tracteur: true, mat_gnr: true, mat_conso: true, mat_travaux: true }, o.show || {});
  const ctx = { window: { _mvAvale: (e, ou) => compte('_mvAvale:' + ou) }, _pilShow: (k) => !!show[k],
    _pilPanelTracteur: () => '<i>PARC</i>', _pilPanelGnr: () => '<i>CUVE</i>', _pilPanelConso: () => '<i>CONSO</i>',
    _pilCkTracteur: () => { compte('_pilCkTracteur'); if (o.leve) throw new Error('panne'); return o.cartes || ''; } };
  vm.createContext(ctx); vm.runInContext(corps(S.pil, '_pilTabMat'), ctx);
  return { html: ctx._pilTabMat({}), a };
}

let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const sur = (f) => { try { return f(); } catch (e) { return { html: '', a: { PLANTAGE: String(e && e.message) }, timers: [] }; } };

function jouer(S) {
  // ① Aujourd'hui, v2 présent
  const A = sur(() => monterAuj(S, { ck2: true }));
  t('① v2 présent : le squelette v2, le modèle et la vue Économie bâtis une fois', A.html.indexOf('squelette') >= 0 && A.a._pilCk2Modele === 1 && A.a._pilCk2Eco === 1, JSON.stringify(A.a));
  t('① le montage est programmé et monte le modèle', A.timers.length === 1 && (A.timers[0](), A.a._ck2Monter === 1 && A.a._pilStickyH === 1));
  t('① photo du jour écrite une fois, marge calculée une fois', A.a._pilPhotoEcrire === 1 && A.a._pilMargeCalc === 1);
  // ② les replis
  const B = sur(() => monterAuj(S, { ck2: false }));
  t('② v2 absent : un message, jamais un écran blanc', /pas pu s(\\u2019|’)afficher/.test(B.html) && B.html.length > 30, B.html.slice(0, 80) || JSON.stringify(B.a));
  const C = sur(() => monterAuj(S, { ck2: true, leve: true }));
  t('② v2 qui lève : le message, l’erreur avalée', /pas pu s(\\u2019|’)afficher/.test(C.html) && C.a['_mvAvale:pilotage.js/_pilTabAuj#ck2'] === 1, JSON.stringify(C.a));
  t('② plus aucun ancien cockpit appelé, dans aucun cas', !A.a._ckAuj && !B.a._ckAuj && !C.a._ckAuj);
  // ③ la carte du tracteur relogée
  const M = sur(() => monterMat(S, { cartes: '<div class="pil-trx">CARTES</div>' }));
  t('③ Matériel : les trois panneaux, puis le titre et les cartes du tracteur', /PARC[\s\S]*CUVE[\s\S]*CONSO[\s\S]*Pour finir les travaux tracteur en cours[\s\S]*CARTES/.test(M.html), M.html.slice(0, 200));
  const M0 = sur(() => monterMat(S, { cartes: '' }));
  t('③ rien à dire : ni cartes ni titre', M0.a._pilCkTracteur === 1 && !/Pour finir les travaux/.test(M0.html) && /CONSO/.test(M0.html));
  const Mx = sur(() => monterMat(S, { cartes: 'X', show: { mat_travaux: false } }));
  t('③ case « Pour finir les travaux tracteur en cours » décochée : rien n’est calculé', !Mx.a._pilCkTracteur && !/Pour finir/.test(Mx.html));
  const Me = sur(() => monterMat(S, { leve: true }));
  t('③ une erreur des cartes est avalée, les trois panneaux restent', Me.a['_mvAvale:pilotage.js/_pilTabMat#trx'] === 1 && /PARC[\s\S]*CONSO/.test(Me.html), JSON.stringify(Me.a));
  t('③ la case est dans « Afficher dans cet onglet » et réveille la section Matériel', S.pil.includes("['mat_travaux','Pour finir les travaux tracteur en cours']") && S.pil.includes("_pilAnyShow(['mat_tracteur','mat_gnr','mat_conso','mat_travaux'])"));
  t('③ la carte de la cuve a son propre titre : « Gasoil après les travaux »', /<span class="t">Gasoil après les travaux<\/span>'\+_mvInfoBtn\('pil\.trxgnr'\)/.test(corps(S.pil, '_pilCkTracteur')));
  // ④ ce qui est retiré, ce qui reste
  const encore = RETIREES_PIL.filter((n) => defini(S.pil, n)).concat(RETIREES_CK.filter((n) => defini(S.ck, n)));
  t('④ les 41 fonctions retirées n’existent plus (Pilotage et cockpit.js)', encore.length === 0, encore.join(', '));
  const tout = S.pil + S.vue + S.app + S.ck;
  t('④ plus personne n’appelle l’ancien rendu (_ckAuj)', !/window\._ckAuj\s*\(|_ckAuj\s*=\s*function/.test(tout));
  const perdues = GARDEES_CK.filter((n) => !defini(S.ck, n) && !new RegExp('window\\.' + n + '\\s*=').test(S.ck));
  t('④ cockpit.js garde les ' + GARDEES_CK.length + ' lectures dont vit le cockpit v2', perdues.length === 0, perdues.join(', '));
  const lues = GARDEES_CK.filter((n) => new RegExp('\\b' + n + '\\b').test(S.pil + S.vue + S.app));
  t('④ … et chacune est bien lue hors de cockpit.js', lues.length === GARDEES_CK.length, GARDEES_CK.filter((n) => lues.indexOf(n) < 0).join(', '));
  const fiches = FICHES.filter((k) => S.utils.includes("'" + k + "':"));
  t('④ les neuf fiches « i » de l’ancien écran sont parties', fiches.length === 0, fiches.join(', '));
  t('④ cockpit.js reste importé juste après pilotage.js', /import '\.\/pilotage\.js';\nimport '\.\/cockpit\.js';/.test(S.app));
  t('⑤ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange1.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange1.mjs --contre'") > 0);
}

if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 60)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const REPLI = "  return '<div class=\"pil-empty\">Le tableau de bord n\\u2019a pas pu s\\u2019afficher. Rechargez la page.</div>';\n}";
  const mutants = [
    ['l’ancien cockpit revient en repli', (S) => R(S, 'pil', REPLI, "  return (typeof window._ckAuj==='function')?window._ckAuj({}):'';\n}")],
    ['le repli redevient un écran blanc', (S) => R(S, 'pil', REPLI, "  return '';\n}")],
    ['la photo du jour n’est plus écrite', (S) => R(S, 'pil', 'try{ _pilPhotoEcrire(d); }', 'try{ }')],
    ['la case « mat_travaux » n’est plus lue', (S) => R(S, 'pil', "if(_pilShow('mat_travaux')){", 'if(true){')],
    ['le titre s’affiche même sans carte', (S) => R(S, 'pil', "if(_trx) H+='<div class=\"pil-sec-h\">Pour finir", "H+='<div class=\"pil-sec-h\">Pour finir")],
    ['une erreur des cartes n’est plus avalée', (S) => R(S, 'pil', "try{ _trx=_pilCkTracteur(d)||''; }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabMat#trx'); }", "_trx=_pilCkTracteur(d)||'';")],
    ['la cuve reprend le titre « Cuve GNR »', (S) => R(S, 'pil', '<span class="t">Gasoil après les travaux</span>', '<span class="t">Cuve GNR</span>')],
    ['une fonction retirée revient', (S) => Object.assign({}, S, { ck: S.ck + '\nwindow._ckAuj = function(o){ return \'\'; };\n' })],
    ['cockpit.js perd une lecture du v2', (S) => R(S, 'ck', 'window._ckFilDonnees = function(', 'window._ckFilDonneesX = function(')],
    ['une fiche « i » de l’ancien écran revient', (S) => Object.assign({}, S, { utils: S.utils.replace("'pil.trx':", "'pil.marge': { t: 'x', p: ['x'] },\n  'pil.trx':") })],
    ['la liste ne joue plus le harnais', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange1.mjs'").join("mv-harnais-pilrangeX.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ' rouge' + (ko > 1 ? 's' : '') + ')'); }
    else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
