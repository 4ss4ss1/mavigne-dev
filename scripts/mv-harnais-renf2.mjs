// HARNAIS — RENF-2 (§224) : le renfort, combien et quand — SANS heures sup.
//   node scripts/mv-harnais-renf2.mjs           → doit être vert
//   node scripts/mv-harnais-renf2.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/pilotage.js (_rfCfg, _rfSim, _rfMinR, _rfCalendrier, _rfPeriodes,
// _rfSansRenfort, _rfPlafDef…) et de src/planning.js (_planSemaineMax), sur le scénario d'exemple de la maquette v2
// validée par Nico : 3 permanents vigne (tracteur 0,3), modèle d'hiver 28 h, fermeture de Noël, un congé de deux
// semaines en février, taille 805 h, tirage 575 h, brûlage 460 h, réparation 517 h. k_retard = 0 (déterministe).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const SRC0 = { pil: fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8'), plan: fs.readFileSync(path.join(R, 'src/planning.js'), 'utf8') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const NOMS = ['_rfCfg', '_rfWOf', '_rfOkT', '_rfProf', '_rfSim', '_rfMinR', '_rfRMax', '_rfCtxRenf', '_rfCalendrier', '_rfPeriodes', '_rfSansRenfort', '_rfPlafDef'];

// Le scénario : ordinaux base 2026-01-01, semaines de 7 jours à partir du lundi 5 octobre 2026.
const ORD = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 86400000);
const O0 = ORD(2026, 10, 5), N = 30;
function scenario() {
  const W = [], dispo = [];
  for (let i = 0; i < N; i++) {
    const o0 = O0 + 7 * i, dt = new Date(Date.UTC(2026, 0, 1) + o0 * 86400000), mo = dt.getUTCMonth() + 1;
    const ferme = (o0 === ORD(2026, 12, 21) || o0 === ORD(2026, 12, 28));
    const cap = ferme ? 0 : (mo === 10 ? 32 : ([11, 12, 1, 2].includes(mo) ? 28 : (mo === 3 ? 32 : 35)));
    let p = 2.7; if (o0 === ORD(2027, 2, 8) || o0 === ORD(2027, 2, 15)) p -= 1;
    W.push({ o0, o1: o0 + 6, m: dt.getUTCMonth(), cap, capRatio: 1, need: 0, hours: 0 });
    dispo.push(cap === 0 ? 0 : p);
  }
  const T = (nom, h, a, b) => ({ nom, h, ws: ORD(...a), we: ORD(...b) + 1, cpt: false });
  const tw = [T('Taille', 805, [2026, 11, 2], [2027, 3, 12]), T('Tirage', 575, [2026, 12, 7], [2027, 3, 26]),
              T('Brûlage', 460, [2026, 12, 7], [2027, 4, 2]), T('Réparation', 517, [2027, 1, 4], [2027, 4, 23])];
  return { W, dispo, tw };
}
function monde(S, contrat) {
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, Date,
    CONFIG: { eco: { k_retard: 0 } }, _RF_SEL: { R: 0, a: 0, b: 0, dP: 0, base: 'eng', contrat: contrat || 'tesa' },
    _planSemaineMax: () => 39 };
  ctx.window = ctx; vm.createContext(ctx);
  const code = (S.pil.match(/var _RF_RMAX_DUR *= *\d+;/) || ['var _RF_RMAX_DUR = 150;'])[0] + '\n'
    + NOMS.map(n => sansCom(fn(S.pil, 'function ' + n + '('))).join('\n')
    + '\nthis.__f={' + NOMS.join(',') + '};';
  vm.runInContext(code, ctx);
  const sc = scenario();
  const c = ctx.__f._rfCfg();
  const X = { W: sc.W, dispo: sc.dispo, tw: sc.tw, c, rate: 19.5, socle: 0, renfortPic: 0 };
  return { ctx, f: ctx.__f, X };
}
function planSem(S, tpl) {
  const ctx = { Math, Date, parseFloat, String, _pY: () => 2027, _planGetTpl: () => tpl };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(sansCom(fn(S.plan, 'function _planSemaineMax(yr){')) + '\nthis.__p=_planSemaineMax;', ctx);
  return ctx.__p;
}
const pres = (a, b, t = 1) => Math.abs(a - b) <= t;

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let w = monde(S, 'tesa'); const f = w.f, X = w.X;
  T('_rfCfg : la capacité est celle du planning (hMax = hJour), un CDD vaut 35 h', X.c.hMax === X.c.hJour && X.c.hCdd === 35);
  const cal = f._rfCalendrier(X), per = f._rfPeriodes(cal);
  T('le calendrier tient toutes les fenêtres', cal.ok && !cal.res.deborde);
  T('aucune heure sup dans le plan (hSup = 0)', cal.res.hSup < 1e-6);
  T('2 saisonniers, pour la taille, en deux périodes coupées par la fermeture de Noël',
    per.length === 2 && per.every(p => p.R === 2 && p.pour.length === 1 && p.pour[0] === 'Taille'));
  T('968 h payées en TESA (392 + 576), l\u2019horaire de l\u2019équipe', pres(per[0].h, 392) && pres(per[1].h, 576));
  const wc = monde(S, 'cdd'); const calC = wc.f._rfCalendrier(wc.X), perC = wc.f._rfPeriodes(calC);
  T('en CDD : 35 h fixes chaque semaine ouverte (1 190 h pour le même effectif)', perC.length === 2 && pres(perC[0].h + perC[1].h, 1190));
  T('… et le simulateur paie ces mêmes heures (capRenf = 1 190 h)', pres(calC.res.capRenf, 1190));
  T('en CDD : une semaine fermée ne paie rien', wc.X.c && wc.f._rfCtxRenf(wc.X).c.capS(11) === 0 && wc.f._rfCtxRenf(wc.X).c.capS(5) === 35);
  const xr = f._rfCtxRenf(X), aT = f._rfWOf(X.W, X.tw[0].ws), bT = cal.res.taches.find(s => s.nom === 'Taille').lim;
  T('_rfMinR s\u2019ajoute à ce qui est posé : sur le calendrier, il ne réclame plus personne', f._rfMinR(xr, aT, bT, f._rfRMax(X), 'Taille', cal.prof) === 0
    && f._rfMinR(xr, aT, bT, f._rfRMax(X), 'Taille', f._rfProf(xr, null)) === 2);
  const S0 = f._rfSansRenfort(X, 0);
  T('sans renfort ni heures sup : la taille finit 12 semaines après sa fenêtre', S0.hs < 1e-6 && S0.r.taches.find(s => s.nom === 'Taille').dep === 12);
  const S39 = f._rfSansRenfort(X, 39);
  T('équipe à 39 h : 550 h sup, toutes à 25 %, 13 416 €, la taille encore 7 semaines en retard',
    pres(S39.hs, 550) && S39.h50 < 0.5 && pres(S39.cout, 13416, 2) && S39.r.taches.find(s => s.nom === 'Taille').dep === 7);
  const S48 = f._rfSansRenfort(X, 48);
  T('équipe à 48 h : 696 h à 25 % et 237 h à 50 % (seuil de la 43e heure), 23 907 €, tout tient',
    pres(S48.h25, 696) && pres(S48.h50, 237) && pres(S48.cout, 23907, 2) && !S48.r.deborde);
  let Cmin = null; for (let C = 28; C <= 48; C++) { if (!f._rfSansRenfort(X, C).r.deborde) { Cmin = C; break; } }
  T('pour tenir sans renfort, il faudrait des semaines de 46 h', Cmin === 46);
  const a = 13, b = 24, r3 = f._rfMinR(f._rfCtxRenf(X), a, b, f._rfRMax(X), null);
  const okR = R => { const x = f._rfCtxRenf(X); return !f._rfSim(x, f._rfProf(x, { R, a, b })).deborde; };
  T('« choisir la période » (4 janv. – 26 mars) : 3 saisonniers, et 2 ne suffisent pas', r3 === 3 && okR(3) && !okR(2));
  T('le plafond proposé d\u2019office est la semaine la plus longue du planning (39 h)', f._rfPlafDef(X) === 39);
  const tpl = {}; for (let m = 0; m < 12; m++) { tpl[m] = {}; for (let d = 1; d <= 31; d++) { const dt = new Date(2027, m, d); if (dt.getMonth() !== m) continue; const j = dt.getDay(); if (j >= 1 && j <= 5) tpl[m][d] = (m === 5 ? 7.8 : 5.6); } }
  T('_planSemaineMax lit la grille : 39 h en juin, pas la somme d\u2019un mois', pres(planSem(S, tpl)(2027), 39, 0.01));
  T('la carte ne fabrique plus d\u2019heures sup (verdict, stratégies, sélecteur d\u2019avant)',
    !/h sup des permanents/.test(S.pil) && !/function _rfStrategies\(/.test(S.pil) && !/window\._rfAppliquer *=/.test(S.pil)
    && /_rfCalendrier\(ctx\)/.test(S.pil) && /_rfSansRenfort\(x,pl\)/.test(S.pil));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENF-2 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => S => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['l\u2019heure sup cachée revient (hMax 8)', sub('pil', 'tauxRenfort:tr, hJour:7, hMax:7, hCdd:35 };', 'tauxRenfort:tr, hJour:7, hMax:8, hCdd:35 };')],
  ['le simulateur oublie les heures d\u2019un saisonnier', sub('pil', 'var capS=(c.capS?c.capS(iw):cap);', 'var capS=cap;')],
  ['le CDD suit l\u2019horaire de l\u2019équipe', sub('pil', "return (contrat==='cdd')?hC*(w.capRatio!=null?w.capRatio:1):w.cap;", 'return w.cap;')],
  ['le plafond est ignoré', sub('pil', 'plaf:(plaf>0?plaf:0), capS:null', 'plaf:0, capS:null')],
  ['le taux de 50 % part de la 48e heure', sub('pil', 'Math.min(pp,43)-s.cap', 'Math.min(pp,48)-s.cap')],
  ['_rfMinR n\u2019ajoute plus au calendrier posé', sub('pil', 'if(base){ p=base.slice();', 'if(false){ p=base.slice();')],
  ['la semaine du modèle ne se remet plus à zéro le lundi', sub('plan', 'if(d.getDay()===1) sem=0;', '')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (S.pil === SRC0.pil && S.plan === SRC0.plan) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
