// HARNAIS — RENF-3 (§619) : le Renfort, votre plan ligne par ligne (maquette Renfort v1, « go » du 27/11).
//   node scripts/mv-harnais-renf3.mjs           → doit être vert
//   node scripts/mv-harnais-renf3.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/pilotage.js sur le scénario du harnais RENF-2 (3 permanents vigne, tracteur
// mesuré 0,3 — lu ici comme une LIGNE du plan —, hiver 28 h, fermeture de Noël, congé de deux semaines en février ; taille
// 805 h, tirage 575 h, brûlage 460 h, réparation 517 h ; k_retard = 0). Les chiffres attendus ont été relevés sur ce code,
// puis vérifiés à la main (heures = personnes × semaines × horaire de la semaine).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: lire('src/pilotage.js'), css: lire('src/pilotage.css'), sty: lire('src/styles.css'), uti: lire('src/utils.js'), guide: lire('guide/11-pilotage.html'), regl: lire('src/reglages.js') };

// Les commentaires retirés (leurs apostrophes fausseraient la lecture des chaînes), puis une fonction prise d'accolade en accolade.
const sansCom = (s) => s.replace(/(^|[\s;{}(])\/\/[^\n]*/g, '$1');
function prendre(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  const j = src.indexOf('{', src.indexOf(')', i)); let d = 0, q = null;
  for (let k = j; k < src.length; k++) {
    const ch = src[k];
    if (q) { if (ch === '\\') { k++; continue; } if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '{') d++; else if (ch === '}') { d--; if (!d) return src.slice(i, k + 1) + (sig.startsWith('window.') ? ';' : ''); }
  }
  throw new Error('non fermée : ' + sig);
}
const NOMS = ['_rfCfg', '_rfRMax', '_rfWOf', '_rfOkT', '_rfMinR', '_rfCapIn', '_rfHIn', '_rfProf', '_rfSim', '_rfWkEnd', '_rfCtxRenf', '_rfCalendrier',
  '_rfPeriodes', '_rfSansRenfort', '_rfPlafDef', '_rfPlanCle', '_rfIsoOk', '_rfPlanNorm', '_rfPlanLu', '_rfPlanEcrit', '_rfPlanPrevuSem', '_rfPlanSig',
  '_rfJo', '_rfOuv', '_rfFrac', '_rfHab', '_rfScN', '_rfAbs', '_rfCompile', '_rfSimPlan', '_rfProposition', '_rfEtat', '_rfVue', '_rfJr', '_rfPlage', '_rfJtxt',
  '_rfPct', '_rfPers', '_rfStatHtml', '_rfSemI', '_rfSemHtml', '_rfRangsTaches', '_rfEtiq', '_rfBarre', '_rfRangsLignes', '_rfOpt', '_rfEditeur',
  '_rfComparer', '_rfRetards', '_rfFond', '_rfLegende', '_rfMemo', '_rfPerso', '_rfOuvre', '_rfFerme', '_rfNouvelleVigne', '_rfNouveauTracteur',
  '_pilOrdD', '_pilOrdIso', '_pilAnnOrd', '_pilDfr', '_pilIsoJ', '_pilNum', '_ecoEur', '_ecoEur2', '_pilStat', '_pilPhPl'];
const ORD = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5);
const O0 = ORD(2026, 10, 5), N = 30;

function monde(S, o = {}) {
  const P = sansCom(S.pil), saves = [];
  const code = ['var _RF_RMAX_DUR = 150;', (P.match(/var _RF_MOIS=\[[^\]]*\];/) || [''])[0],
    'function _pilEsc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
    'var _RF_SEL={R:0,a:0,b:0,dP:0,base:"eng"}, _RF_P=null, _RF_V=null, _RF_SAVE_T=null, _RF_RES=null, _PIL_ANR={k:1};',
    ...NOMS.map((n) => prendre(P, 'function ' + n + '(')), prendre(P, 'window._rfGeste=function('),
    'this.__f={' + NOMS.join(',') + '}; this.__g=function(){ return {P:_RF_P,V:_RF_V,ANR:_PIL_ANR}; };'].join('\n');
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, isNaN, Date,
    CONFIG: { eco: { k_retard: 0 } }, _planSemaineMax: () => 39, saveData: (k) => saves.push(k), isAdmin: () => o.admin !== false,
    setTimeout: (fn) => { fn(); return 1; }, clearTimeout: () => {},
    _pilSaison: () => ({ nom: 'Taille 2026-2027' }), _pilTnom: (n) => n, _pilTCol: () => '#888', _mvInfoBtn: () => '<i>',
    _rfRefresh: function () { if (ctx.__X) ctx.__f._rfVue(ctx.__X); }, _rfSemMaj: () => {} };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
  const W = [], dispo = [];
  for (let i = 0; i < N; i++) {
    const o0 = O0 + 7 * i, dt = new Date(Date.UTC(2026, 0, 1) + o0 * 864e5), mo = dt.getUTCMonth() + 1;
    const ferme = (o0 === ORD(2026, 12, 21) || o0 === ORD(2026, 12, 28));
    const cap = ferme ? 0 : (mo === 10 ? 32 : ([11, 12, 1, 2].includes(mo) ? 28 : (mo === 3 ? 32 : 35)));
    let p = 3; if (o0 === ORD(2027, 2, 8) || o0 === ORD(2027, 2, 15)) p -= 1;
    W.push({ o0, o1: o0 + 6, m: dt.getUTCMonth(), cap, capRatio: 1, need: 0, hours: 0 }); dispo.push(cap === 0 ? 0 : p);
  }
  const T = (nom, h, a, b) => ({ nom, h, ws: ORD(...a), we: ORD(...b) + 1, cpt: false });
  const tw = [T('Taille', 805, [2026, 11, 2], [2027, 3, 12]), T('Tirage', 575, [2026, 12, 7], [2027, 3, 26]),
    T('Brûlage', 460, [2026, 12, 7], [2027, 4, 2]), T('Réparation', 517, [2027, 1, 4], [2027, 4, 23])];
  const f = ctx.__f, c = f._rfCfg();
  // L'équipe ENTIÈRE (opts.sansTrac) : le tracteur mesuré n'est pas retiré d'office, c'est la ligne « habituel » qui le retire.
  const X = { W, dispo, tw, c, rate: 19.5, socle: 0, renfortPic: 0, cd: {}, charge: 805 + 575 + 460 + 517, trac: { etp: 0.3, mesure: true }, mode: 'plan' };
  ctx.__X = X;
  return { ctx, f, X, saves, g: ctx.__g };
}
// La lecture « ce qu'il reste », un vendredi 27 nov. : semaines écoulées retirées, la semaine en cours coupée au jour.
function reste(f, X) {
  const oT = ORD(2026, 11, 27), i0 = X.W.findIndex((w) => w.o1 >= oT);
  const W = X.W.slice(i0).map((w, k) => (k ? w : Object.assign({}, w, { o0: oT, cap: w.cap * 2 / 5, capRatio: (w.o1 - oT + 1) / 7 })));
  return Object.assign({}, X, { W, dispo: X.dispo.slice(i0), tw: X.tw.map((t) => Object.assign({}, t, { ws: Math.max(t.ws, oT) })), mode: 'reste' });
}
const pres = (a, b, t = 1) => Math.abs(a - b) <= t;
const J = (o) => JSON.stringify(o);
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const corps = (src, n) => { try { return prendre(sansCom(src), 'function ' + n + '('); } catch (e) { return ''; } };

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d]);
  const essai = (n, fn) => { try { const [c, d] = fn(); T(n, c, d); } catch (e) { T(n, false, 'exception : ' + (e && e.message)); } };
  // ① D3 : le tracteur habituel est une ligne, et elle retire exactement ce que le contexte retirait
  essai('① D3 : le tracteur mesuré (0,3) devient « 1 personne, 1 j ½ par semaine », et retire 0,3 bras chaque semaine ouverte', () => {
    const { f, X } = monde(S); const h = f._rfHab(X), k = f._rfCompile(X, [f._rfAbs(X, { t: 't', hab: 1 })]);
    const att = X.W.map((w, i) => (w.cap > 0 ? X.dispo[i] - 0.3 : 0));
    return [h && h.n === 1 && pres(h.j, 1.5, 1e-9) && k.dispo.every((v, i) => pres(v, att[i], 1e-9)) && k.hPay === 0, J(h)];
  });
  // ② D2 : la proposition, en lignes
  essai('② D2 : la proposition — 2 saisonniers du 16 nov. au 12 mars (Noël ne coupe pas la ligne), 1 du 15 au 26 mars', () => {
    const { f, X, g } = monde(S); const V = f._rfVue(X), l = V.S.l.filter((L) => L.t === 'v');
    return [J(l) === J([{ t: 'v', n: 2, a: '2026-11-16', b: '2027-03-12', ctr: 'tesa', p: 1 }, { t: 'v', n: 1, a: '2027-03-15', b: '2027-03-26', ctr: 'tesa', p: 1 }])
      && V.S.l[0].hab === 1 && !V.S.enr && g().P === V.S, J(V.S.l)];
  });
  essai('② … tout tient, 2 saisonniers, 920 h payées, 18 300 € (920 × 19,50 + 2 × 180)', () => {
    const { f, X } = monde(S); const V = f._rfVue(X), k = V.sim.k;
    return [V.sim.ok && k.pointe === 2 && pres(k.hPay, 920) && pres(k.cout, 18300) && V.sim.nRet === 0 && V.memes, [k.pointe, k.hPay, k.cout].join(' / ')];
  });
  essai('② … lue un 27 nov. : 4 dès le 4 janv. (pas avant Noël : le même monde), puis 2 la semaine du 22 mars — jamais 5 en même temps', () => {
    const { f, X } = monde(S); const x = reste(f, X), hab = [f._rfAbs(x, { t: 't', hab: 1 })], P = f._rfProposition(x, hab);
    const s = f._rfSimPlan(x, hab.concat(P.l.map((L) => f._rfAbs(x, L))));
    return [P.ok && J(P.l) === J([{ t: 'v', n: 4, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa', p: 1 }, { t: 'v', n: 2, a: '2027-03-22', b: '2027-03-26', ctr: 'tesa', p: 1 }])
      && s.ok && s.k.pointe === 4 && pres(s.k.hPay, 1216), J(P.l) + ' · pointe ' + s.k.pointe];
  });
  // ③ le choix de Nico : le nombre et les dates
  essai('③ « 3 saisonniers du 4 janv. au 12 mars » : la taille tient, le tirage +2 sem. et le brûlage +1 sem. — 864 h', () => {
    const { f, X } = monde(S); const A = [f._rfAbs(X, { t: 't', hab: 1 }), f._rfAbs(X, { t: 'v', n: 3, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' })];
    const s = f._rfSimPlan(X, A), by = (n) => s.T.find((t) => t.nom === n);
    return [!s.ok && s.nRet === 2 && by('Taille').ok && by('Tirage').dep === 2 && by('Brûlage').dep === 1 && pres(s.k.hPay, 864) && s.k.pointe === 3,
      s.T.map((t) => t.nom + (t.ok ? ' ok' : ' +' + t.dep)).join(', ')];
  });
  essai('③ … une ligne commence et finit au jour près : du jeudi 7 au vendredi 15 janv., 7 jours ouvrés sur 10 (28 h × 3/5 + 28 h)', () => {
    const { f, X } = monde(S); const k = f._rfCompile(X, [f._rfAbs(X, { t: 'v', n: 1, a: '2027-01-07', b: '2027-01-15', ctr: 'tesa' })]);
    return [pres(k.hPay, 28 * 2 / 5 + 28, 1e-6) && k.pointe === 1, String(k.hPay)];
  });
  essai('③ … en CDD : 35 h chaque semaine ouverte, quel que soit l’horaire (2 semaines de janvier = 70 h)', () => {
    const { f, X } = monde(S); const k = f._rfCompile(X, [f._rfAbs(X, { t: 'v', n: 1, a: '2027-01-04', b: '2027-01-15', ctr: 'cdd' })]);
    return [pres(k.hPay, 70, 1e-6), String(k.hPay)];
  });
  essai('③ … le domaine fermé ne paie personne : un CDD de Noël à la mi-janvier paie 2 semaines (70 h), pas 4', () => {
    const { f, X } = monde(S); const k = f._rfCompile(X, [f._rfAbs(X, { t: 'v', n: 1, a: '2026-12-21', b: '2027-01-15', ctr: 'cdd' })]);
    return [pres(k.hPay, 70, 1e-6) && k.prof.every((v) => isFinite(v)), String(k.hPay)];
  });
  // ④ au tracteur
  essai('④ quelqu’un de l’équipe au tracteur deux semaines : un bras de moins à la vigne ces semaines-là, rien de payé', () => {
    const { f, X } = monde(S); const A = [f._rfAbs(X, { t: 't', hab: 1 }), f._rfAbs(X, { t: 't', n: 1, j: 5, qui: 'eq', a: '2027-01-04', b: '2027-01-15' })];
    const k = f._rfCompile(X, A);
    return [pres(k.dispo[13], 1.7, 1e-9) && pres(k.dispo[14], 1.7, 1e-9) && pres(k.dispo[15], 2.7, 1e-9) && k.hPay === 0, J(k.dispo.slice(12, 16))];
  });
  essai('④ … et la proposition en tient compte : la taille se renforce une semaine plus tôt (dès le 9 nov.)', () => {
    const { f, X } = monde(S); const P = f._rfProposition(X, [f._rfAbs(X, { t: 't', hab: 1 }), f._rfAbs(X, { t: 't', n: 1, j: 5, qui: 'eq', a: '2027-01-04', b: '2027-01-15' })]);
    return [P.l[0] && P.l[0].a === '2026-11-09' && P.l[0].n === 2, J(P.l)];
  });
  essai('④ quelqu’un d’embauché pour le tracteur : la vigne garde ses bras, 56 h payées, 1 272 € (frais d’embauche compris)', () => {
    const { f, X } = monde(S); const k = f._rfCompile(X, [f._rfAbs(X, { t: 't', hab: 1 }), f._rfAbs(X, { t: 't', n: 1, j: 5, qui: 'emb', a: '2027-01-04', b: '2027-01-15' })]);
    return [pres(k.dispo[13], 2.7, 1e-9) && pres(k.hPay, 56, 1e-6) && pres(k.cout, 1272) && k.pointe === 1, [k.hPay, k.cout].join(' / ')];
  });
  // ⑤ D1 : le plan enregistré
  essai('⑤ D1 : un ouvrier ne modifie rien — ni CONFIG, ni écriture', () => {
    const { f, X, ctx, saves, g } = monde(S, { admin: false }); f._rfVue(X);
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'n+', 'data-i': '1' })[k] });
    return [!ctx.CONFIG.renfort_plan && saves.length === 0 && g().P.l[1].n === 2 && f._rfPlanEcrit() === false, J(ctx.CONFIG.renfort_plan || null)];
  });
  essai('⑤ … l’administrateur : « + » sur la ligne proposée la rend sienne (3, sans « proposé »), l’enregistre sous le nom de la campagne', () => {
    const { f, X, ctx, saves, g } = monde(S); f._rfVue(X);
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'n+', 'data-i': '1' })[k] });
    const P = ctx.CONFIG.renfort_plan && ctx.CONFIG.renfort_plan['Taille 2026-2027'];
    return [P && P.v === 1 && /^\d{4}-\d{2}-\d{2}$/.test(P.maj) && P.l[1].n === 3 && !('p' in P.l[1]) && P.l[2].p === 1 && P.l[0].hab === 1
      && saves.length === 1 && saves[0] === 'config' && g().P.enr && g().P.hist.length === 1 && g().V.sim.k.pointe === 3, J(P)];
  });
  essai('⑤ … « Annuler » revient à la proposition, et l’enregistre ; le plan relu redonne les mêmes lignes', () => {
    const { f, X, ctx, g } = monde(S); f._rfVue(X);
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'n+', 'data-i': '1' })[k] });
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'undo' })[k] });
    const lu = f._rfPlanLu('Taille 2026-2027');
    return [g().P.l[1].n === 2 && g().P.l[1].p === 1 && lu && lu.l[1].n === 2 && g().P.hist.length === 0, J(lu)];
  });
  essai('⑤ … « + Saisonniers » pose une ligne là où il manque des bras, et l’ouvre', () => {
    const { f, X, ctx, g } = monde(S); f._rfVue(X);
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'addv' })[k] });
    const P = g().P, L = P.l[P.l.length - 1];
    return [L.t === 'v' && L.n === 2 && L.a === '2027-01-04' && L.b === '2027-02-26' && P.sel === P.l.length - 1, J(L)];
  });
  essai('⑤ … une donnée abîmée se relit sans planter : lignes sans dates, n absurde, dates à l’envers, tracteur sans jours', () => {
    const { f } = monde(S);
    const l = f._rfPlanNorm([null, 3, { t: 'x' }, { t: 'v', n: 'a' }, { t: 'v', n: 400, a: '2027-03-01', b: '2027-01-04' }, { t: 't', n: 2, a: '2027-01-04', b: '2027-01-08', j: 9, qui: 'zz' }, { t: 't', hab: 1, n: 7 }]);
    return [J(l) === J([{ t: 'v', n: 150, a: '2027-01-04', b: '2027-03-01', ctr: 'tesa' }, { t: 't', n: 2, a: '2027-01-04', b: '2027-01-08', j: 5, qui: 'eq' }, { t: 't', hab: 1 }]), J(l)];
  });
  essai('⑤ … L’équipe & le matériel lit le plan : 3 saisonniers prévus la semaine du 4 janv., 2,55 bras à leur cadence', () => {
    const { f, X, ctx } = monde(S); f._rfVue(X);
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'n+', 'data-i': '1' })[k] });
    const p = f._rfPlanPrevuSem(ORD(2027, 1, 4), ORD(2027, 1, 10));
    return [p.n === 3 && pres(p.eq, 2.55, 1e-9), J(p)];
  });
  // ⑥ ce que l'écran dit
  essai('⑥ la pastille : « à prévoir » (proposé), « prévu » (enregistré), « 2 en retard » en rouge, « l’équipe suffit »', () => {
    const { f } = monde(S);
    const a = f._rfStatHtml({ ok: true, pointe: 2, cout: 18300, prevu: false }), b = f._rfStatHtml({ ok: true, pointe: 3, cout: 26826, prevu: true });
    const c = f._rfStatHtml({ ok: false, pointe: 3, cout: 17388, prevu: true, nRet: 2 }), d = f._rfStatHtml({ ok: true, pointe: 0, cout: 0, prevu: false });
    return [texte(a) === '2 saisonniers · 18 300 € à prévoir' && /pil-tv-pl or/.test(a) && texte(b) === '3 saisonniers · 26 826 € prévu' && /pil-tv-pl ok/.test(b)
      && texte(c) === '3 saisonniers · 17 388 € 2 en retard' && /pil-tv-pl ko/.test(c) && texte(d) === '0 l’équipe suffit', [a, b, c, d].map(texte).join(' | ')];
  });
  essai('⑥ le graphe : avec la proposition, des semaines « absorbées » et aucun manque ; avec 1 saisonnier, du manque', () => {
    const { f, X, ctx, g } = monde(S); const V = f._rfVue(X);
    const ok = V.sem.every((s) => s.st !== 'manque') && V.sem.some((s) => s.st === 'absorbe');
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'n-', 'data-i': '1' })[k] });
    ctx._rfGeste({ getAttribute: (k) => ({ 'data-rf': 'del', 'data-i': '2' })[k] });
    const V2 = g().V;
    return [ok && V2.sem.some((s) => s.st === 'manque') && !V2.sim.ok, V.sem.map((s) => s.st[0]).join('') + ' → ' + V2.sem.map((s) => s.st[0]).join('')];
  });
  essai('⑥ la semaine choisie d’office est celle qui manque le plus ; son détail dit besoin, bras, renfort, tracteur', () => {
    const { f, X } = monde(S); const V = f._rfVue(X), h = texte(f._rfSemHtml(V));
    return [/^Semaine du 8–12 févr\. besoin 5 bras 3,4 dont renfort 1,7 tracteur −0,3 \+1,6 absorbé/.test(h), h];
  });
  essai('⑥ Comparer : le plan, la proposition, l’équipe seule à 39 h (550 h sup, 13 416 €, la taille +7 sem.)', () => {
    const { f, X } = monde(S); const h = texte(f._rfComparer(f._rfVue(X)));
    return [h.includes('Coût 18 300 € 18 300 € 13 416 €') && h.includes('Heures sup 0 h 0 h 550 h') && h.includes('taille +7 sem.') && !h.includes('Prendre la proposition'), h.slice(0, 260)];
  });
  // ⑦ la source
  const P = S.pil, PN = sansCom(S.pil);
  T('⑦ le Renfort lit l’équipe entière (opts.sansTrac) ; les autres lecteurs gardent le retrait d’office', /var P=_rfPair\(d,\{sansTrac:true\}\)/.test(PN)
    && /var tracX=\(opts&&opts\.sansTrac\)\?0:trac\.etp;/.test(PN) && /return Math\.max\(0, hp-tracX\*cp\);/.test(PN) && /function _rfPair\(d,opts\)\{/.test(PN));
  T('⑦ l’écran d’avant est parti (calendrier, « Choisir moi-même la période », sélecteurs) et ses styles avec lui',
    !/function _rfCalSvg\(|window\._rfChoix=|window\._rfContrat=|window\._rfPlaf=/.test(P) && !/Choisir moi-m/.test(PN) && !/\.rf2-[a-z]+[ .{]|\.rf-step\{|\.rf-sel\{/.test(S.sty) && /\.rf-lim\{/.test(S.sty));
  T('⑦ les styles du Renfort vivent dans pilotage.css, sous #page-pilotage, préfixe .rfp-', /#page-pilotage \.rfp-bar\.v\{/.test(S.css) && /#page-pilotage \.rfp-gt\.rfp-et \.rfp-bar \.rfp-h\{display:none\}/.test(S.css));
  T('⑦ un seul gestionnaire de gestes, les valeurs dans data-* (C24b)', /window\._rfGeste=function\(el\)\{/.test(P) && !/onclick="window\._rfGeste\(this,/.test(P)
    && (P.match(/onclick="window\._rfGeste\(this\)"/g) || []).length >= 10);
  T('⑦ L’équipe & le matériel lit le plan (D1), et sa clé de cache aussi', /rf=_rfPlanPrevuSem\(a0,a1\)\.eq;/.test(P) && /manque:Math\.max\(0,need-dispo-rf\)/.test(P) && /\+'\|'\+_rfPlanSig\(\);/.test(P));
  T('⑦ la phrase du haut dit « prévus » et « le renfort prévu ne suffit pas »', /pr\\u00e9vu'\+\(Q\.pointe>1\?'s':''\)/.test(corps(P, '_pilDcPhrase')) && /le renfort pr\\u00e9vu ne suffit pas/.test(corps(P, '_pilDcPhrase')));
  const fns = ['_rfStatHtml', '_rfBody', '_rfLegende', '_rfSemHtml', '_rfRangsTaches', '_rfEtiq', '_rfRangsLignes', '_rfEditeur', '_rfComparer', '_rfRetards'];
  const chaines = (fns.map((n) => corps(P, n)).join('\n').match(/'(?:[^'\\]|\\.)*'/g) || []).join(' ');
  const hors = chaines.match(/pour finir|au champ|restantes?|r\\u00e9alis|réalis|effectif|planifi|attendu|fin de saison|fin estimée|à trouver|dépensé|consommé|' ?~ /);
  T('⑦ les mots du lexique (§580c) dans tout l’écran du Renfort', !hors, hors ? hors[0] : '');
  T('⑦ la fiche « Votre plan » dit la règle de la proposition ; les fiches mortes sont parties', S.uti.includes("'pil.sim.plan': { t: 'Votre plan'")
    && S.uti.includes('le <b>moins de monde possible</b> qui le fait tenir, embauché <b>le plus tard possible</b>') && !S.uti.includes("'pil.sim.frise'") && !S.uti.includes("'pil.sim.semaine'"));
  T('⑦ le guide le dit : votre plan, au tracteur, « Garder ce plan », Comparer', S.guide.includes('<li><b>Renfort — votre plan</b>') && S.guide.includes('<li><b>Au tracteur</b>')
    && S.guide.includes('« Garder ce plan »') && S.guide.includes('<li><b>Comparer</b>') && !S.guide.includes('Choisir moi-même la période'));
  essai('⑦ renommer la campagne emporte son plan (Réglages › Période), et l\u2019écrit', () => {
    const r = sansCom(S.regl), fn = corps(S.regl, '_renamePeriode');
    const ctx = { window: null, CONFIG: { renfort_plan: { 'Hiver': { v: 1, l: [] }, 'Autre': { v: 1, l: [{ t: 't', hab: 1 }] } } }, PARCELLES: [], SESSIONS: [], HISTORIQUE: [], Object };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fn + '\nthis.__r=_renamePeriode;', ctx); ctx.__r('Hiver', 'Hiver 2027');
    return [J(Object.keys(ctx.CONFIG.renfort_plan).sort()) === J(['Autre', 'Hiver 2027']) && /if\(_renomme\) window\.saveData\('config'\);/.test(r), J(ctx.CONFIG.renfort_plan)];
  });
  return out;
}

let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c, d]) => { if (c) { ok++; console.log('  ✓ ' + n); } else { ko++; console.log('  ✗ ' + n + (d ? '\n      → ' + d : '')); } });
console.log(`\nRENF-3 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => (S) => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['D2 : la proposition embauche le plus TÔT', sub('pil', '(R===best.R && m>best.m)', '(R===best.R && m<best.m)')],
  ['D2 : la pointe n’est plus regardée (5 en même temps)', sub('pil', 'if(!best || pk<best.pk || (pk===best.pk && (R<best.R || (R===best.R && m>best.m)))) best=', 'if(!best || R<best.R || (R===best.R && m>best.m)) best=')],
  ['D3 : le tracteur habituel prend 5 jours par semaine', sub('pil', 'return { n:n, j:Math.min(5,e*5/n), etp:e };', 'return { n:n, j:5, etp:e };')],
  ['le tracteur pris dans l’équipe ne retire plus de bras', sub('pil', '        else trac[k]+=part;', '        else trac[k]+=0;')],
  ['le tracteur embauché n’est plus payé', sub('pil', 'if(L.qui===\'emb\'){ if(w.cap>0){ hPay+=part*w.cap; pers[k]+=L.n; } }', 'if(L.qui===\'emb\'){ if(w.cap>0){ pers[k]+=L.n; } }')],
  ['le domaine fermé paie les saisonniers', sub('pil', "        if(!(w.cap>0)) continue;             // le domaine fermé", "        if(false) continue;             // le domaine fermé")],
  ['une ligne compte la semaine entière (pas au jour près)', sub('pil', 'var t=_rfOuv(w.o0,w.o1); return t?_rfOuv(a,b)/t:0;', 'return 1;')],
  ['un ouvrier enregistre le plan', sub('pil', 'if(!S||!S.cle||!S.admin||!window.CONFIG) return false;', 'if(!S||!S.cle||!window.CONFIG) return false;')],
  ['le plan ne part plus à l’écriture', sub('pil', "window.saveData('config'); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_rfPlanEcrit');", "window.saveData('cfg'); }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_rfPlanEcrit');")],
  ['une ligne touchée reste « proposé »', sub('pil', '  if(L.p) delete L.p;', '')],
  ['« Annuler » n’enregistre plus', sub('pil', "if(S.hist.length){ S.l=JSON.parse(S.hist.pop()); if(S.sel!=null&&!S.l[S.sel]) S.sel=null; _rfPlanEcrit(); _rfRefresh(); }", "if(S.hist.length){ S.l=JSON.parse(S.hist.pop()); if(S.sel!=null&&!S.l[S.sel]) S.sel=null; _rfRefresh(); }")],
  ['L’équipe ne lit plus le plan', sub('pil', 'manque:Math.max(0,need-dispo-rf)', 'manque:Math.max(0,need-dispo)')],
  ['la pastille oublie « prévu »', sub('pil', '  if(Q.prevu) return lib+', '  if(false) return lib+')],
  ['le graphe ne montre plus de manque', sub('pil', "?(rg?'manque':'absorbe'):'ok'", "?'absorbe':'ok'")],
  ['les prévus du plan ne comptent plus leur cadence', sub('pil', '  return { n:p, eq:p*c.rdt };', '  return { n:p, eq:p };')],
  ['le Renfort retire encore le tracteur d’office (en double)', sub('pil', 'var P=_rfPair(d,{sansTrac:true})', 'var P=_rfPair(d)')],
  ['renommer la campagne laisse son plan derrière', sub('regl', '    _rp[newN]=_rp[oldN]; delete _rp[oldN];', '    delete _rp[oldN];')],
  ['le plan renommé ne s\u2019écrit pas', sub('regl', "  if(_renomme) window.saveData('config');", '')],
  ['le guide reparle de « Choisir moi-même la période »', sub('guide', '<li><b>Comparer</b>', '<li>Choisir moi-même la période · <b>Comparer</b>')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (J(S) === J(SRC0)) { console.log('  ⚠ non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
