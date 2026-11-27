// HARNAIS — RENF-4 (§620) : « Créer le contrat » depuis une ligne du Renfort ; la ligne « sous contrat ».
//   node scripts/mv-harnais-renf4.mjs           → doit être vert
//   node scripts/mv-harnais-renf4.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions : celles du Renfort (src/pilotage.js) sur le scénario de RENF-2/RENF-3, la feuille « Créer le contrat »
// (src/reglages.js) avec un createAuthAccount simulé (un compte qui passe, une adresse déjà prise, la démo), et le journal du
// salarié (src/utils.js : _mvHist, _mvPeriodes, _mvHistMirror) qui porte le contrat.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: lire('src/pilotage.js'), regl: lire('src/reglages.js'), uti: lire('src/utils.js'), html: lire('index.html'),
  css: lire('src/pilotage.css'), cfg: lire('scripts/tutos-couverture.json'), aj: lire('scripts/mv-harnais-ajour1.mjs'), guide: lire('guide/11-pilotage.html') };

const sansCom = (s) => s.replace(/(^|[\s;{}(])\/\/[^\n]*/g, '$1');
function prendre(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  const j = src.indexOf('{', src.indexOf(')', i)); let d = 0, q = null;
  for (let k = j; k < src.length; k++) {
    const ch = src[k];
    if (q) { if (ch === '\\') { k++; continue; } if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '/' && src[k + 1] !== '/' && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {   // une expression régulière : jusqu'à sa barre
      for (k++; k < src.length && src[k] !== '/'; k++) { if (src[k] === '\\') k++; else if (src[k] === '[') { while (src[++k] !== ']') { if (src[k] === '\\') k++; } } }
      continue;
    }
    if (ch === '{') d++; else if (ch === '}') { d--; if (!d) return src.slice(i, k + 1) + (sig.startsWith('window.') ? ';' : ''); }
  }
  throw new Error('non fermée : ' + sig);
}
const PIL = ['_rfCfg', '_rfRMax', '_rfWOf', '_rfOkT', '_rfMinR', '_rfCapIn', '_rfHIn', '_rfProf', '_rfSim', '_rfWkEnd', '_rfCtxRenf', '_rfCalendrier',
  '_rfPeriodes', '_rfSansRenfort', '_rfPlafDef', '_rfPlanCle', '_rfIsoOk', '_rfPlanNorm', '_rfPlanLu', '_rfPlanEcrit', '_rfPlanPrevuSem', '_rfPlanSig',
  '_rfJo', '_rfOuv', '_rfFrac', '_rfHab', '_rfScN', '_rfAbs', '_rfCompile', '_rfSimPlan', '_rfProposition', '_rfEtat', '_rfVue', '_rfJr', '_rfPlage',
  '_rfJtxt', '_rfPct', '_rfPers', '_rfStatHtml', '_rfSemI', '_rfSemHtml', '_rfRangsTaches', '_rfEtiq', '_rfBarre', '_rfRangsLignes', '_rfOpt',
  '_rfEditeur', '_rfComparer', '_rfRetards', '_rfFond', '_rfLegende', '_rfMemo', '_rfPerso', '_rfOuvre', '_rfFerme', '_rfNouvelleVigne',
  '_rfNouveauTracteur', '_rfContrat', '_pilOrdD', '_pilOrdIso', '_pilAnnOrd', '_pilDfr', '_pilIsoJ', '_pilNum', '_ecoEur', '_ecoEur2', '_pilStat', '_pilPhPl'];
const RFC = ['_rfcJ', '_rfcSlug', '_rfcConvention', '_rfcMail', '_rfcDemo', '_rfcAdresses', '_rfcOuvrir', '_rfcOpt', '_rfcRendu', '_rfcSaisie', '_rfcMsg', '_rfcGeste'];
const ORD = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5);
const O0 = ORD(2026, 10, 5), N = 30;

// Un document minimal : la feuille écrit dans #rfc-corps et lit ses champs ; le Renfort n'est pas peint (pas d'écran ici).
function doc() {
  const els = { 'rfc-corps': { innerHTML: '' }, 'rfc-err': { textContent: '' } };
  return { els, getElementById: (id) => els[id] || null, querySelector: () => null, querySelectorAll: () => [] };
}
function monde(S, o = {}) {
  const P = sansCom(S.pil), G = sansCom(S.regl), U = sansCom(S.uti), saves = [], toasts = [], ouverts = [], fermes = [], comptes = [];
  const code = ['var _RF_RMAX_DUR = 150;', (P.match(/var _RF_MOIS=\[[^\]]*\];/) || [''])[0], (G.match(/var _RFC_MOIS=\[[^\]]*\];/) || [''])[0],
    'function _pilEsc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }',
    'var _escHtml=_pilEsc, _escAttr=_pilEsc;',
    'var _RF_SEL={R:0,a:0,b:0,dP:0,base:"eng"}, _RF_P=null, _RF_V=null, _RF_SAVE_T=null, _RF_RES=null, _PIL_ANR={k:1}, _RFC=null;',
    'window.MV_HIST_TYPES=["embauche","renouvellement","fin"];',
    prendre(U, 'window._mvHist = function('), prendre(U, 'window._mvPeriodes = function('), prendre(U, 'window._mvHistMirror = function('),
    ...PIL.map((n) => prendre(P, 'function ' + n + '(')), prendre(P, 'window._rfGeste=function('),
    ...RFC.map((n) => prendre(G, 'function ' + n + '(')), prendre(G, 'async function _rfcCreer('),
    'this.__f={' + PIL.concat(RFC).join(',') + ',_rfcCreer:_rfcCreer}; this.__g=function(){ return {P:_RF_P,V:_RF_V,C:_RFC}; };'].join('\n');
  const D = doc();
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, isNaN, Date, Promise, Buffer,
    document: D, navigator: {}, CONFIG: { eco: { k_retard: 0 } }, _planSemaineMax: () => 39, saveData: (k) => saves.push(k),
    isAdmin: () => o.admin !== false, setTimeout: (fn) => { fn(); return 1; }, clearTimeout: () => {},
    showToast: (t) => toasts.push(t), openOv: (id) => ouverts.push(id), closeOv: (e, id) => fermes.push(id), _mvCopyFallback: () => {},
    DOMAINE_NOM: 'Domaine des Grandes Vignes', currentUser: o.demo ? { nom: 'Visiteur', _isDemo: true } : { nom: 'Admin' },
    MEMBRES: (o.membres || [{ nom: 'Basile', email: 'basile.essai@mavigne.app', roles: ['ouvrier'], statut: 'Actif' },
      { nom: 'Awa', email: 'awa.essai@mavigne.app', roles: ['ouvrier'], statut: 'Actif' }]).map((m) => Object.assign({}, m)),
    createAuthAccount: async (email, pwd, op) => {
      comptes.push([email, (op && op.roles || []).join('+')]);
      if (/^paul\./.test(email)) throw Object.assign(new Error('pris'), { code: 'auth/email-already-in-use' });
      return { user: { uid: 'u' + comptes.length, email }, password: 'mot-' + comptes.length, generated: true };
    },
    _pilSaison: () => ({ nom: 'Taille 2026-2027' }), _pilTnom: (n) => n, _pilTCol: () => '#888', _mvInfoBtn: () => '<i>',
    _rfRefresh: function () { if (ctx.__X) ctx.__f._rfVue(ctx.__X); }, _rfSemMaj: () => {} };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(code, ctx);
  ctx._rfcOuvrir = ctx.__f._rfcOuvrir;
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
  const f = ctx.__f;
  const X = { W, dispo, tw, c: f._rfCfg(), rate: 19.5, socle: 0, renfortPic: 0, cd: {}, charge: 2357, trac: { etp: 0.3, mesure: true }, mode: 'plan' };
  ctx.__X = X;
  return { ctx, f, X, saves, toasts, ouverts, fermes, comptes, g: ctx.__g, D };
}
const J = (o) => JSON.stringify(o);
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const geste = (ctx, attrs) => ctx._rfGeste({ getAttribute: (k) => (attrs[k] != null ? String(attrs[k]) : null) });
const rfc = (ctx, attrs, val) => ({ getAttribute: (k) => (attrs[k] != null ? String(attrs[k]) : null), value: val });

async function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d]);
  const essai = async (n, fn) => { try { const [c, d] = await fn(); T(n, c, d); } catch (e) { T(n, false, 'exception : ' + (e && e.message)); } };
  // ① la ligne sous contrat
  await essai('① une ligne garde ses fiches (sc) ; une donnée abîmée se relit (vides, doublons, non-textes)', async () => {
    const { f } = monde(S); const l = f._rfPlanNorm([{ t: 'v', n: 3, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa', sc: ['Jean', '', 'Jean', null, 'Paul', 4] }, { t: 'v', n: 2, a: '2027-01-04', b: '2027-01-08', sc: 'x' }]);
    return [J(l) === J([{ t: 'v', n: 3, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa', sc: ['Jean', 'Paul', '4'] }, { t: 'v', n: 2, a: '2027-01-04', b: '2027-01-08', ctr: 'tesa' }]), J(l)];
  });
  await essai('① sous contrat = des fiches de l’équipe : une personne compte 1, une équipe collective son nombre, une fiche inactive ou retirée 0', async () => {
    const { f, ctx } = monde(S, { membres: [{ nom: 'Jean', statut: 'Actif' }, { nom: 'Equipe', collectif: true, effectif: 3, statut: 'Actif' }, { nom: 'Paul', statut: 'Inactif' }] });
    return [f._rfScN(['Jean', 'Equipe', 'Paul', 'Inconnu']) === 4 && f._rfScN([]) === 0 && f._rfScN(null) === 0 && ctx.MEMBRES.length === 3, String(f._rfScN(['Jean', 'Equipe', 'Paul', 'Inconnu']))];
  });
  await essai('① sous contrat, la ligne ne compte plus en renfort (ils sont dans l’équipe) ; à moitié, elle compte le reste', async () => {
    const { f, X } = monde(S, { membres: [{ nom: 'Jean', statut: 'Actif' }, { nom: 'Paul', statut: 'Actif' }] });
    const L = { t: 'v', n: 2, a: '2027-01-04', b: '2027-01-15', ctr: 'tesa' };
    const k0 = f._rfCompile(X, [f._rfAbs(X, L)]), k2 = f._rfCompile(X, [f._rfAbs(X, Object.assign({}, L, { sc: ['Jean', 'Paul'] }))]);
    const k1 = f._rfCompile(X, [f._rfAbs(X, Object.assign({}, L, { sc: ['Jean', 'Ailleurs'] }))]);
    return [Math.round(k0.hPay) === 112 && k2.hPay === 0 && k2.pointe === 0 && Math.round(k1.hPay) === 56 && k1.pointe === 1, [k0.hPay, k1.hPay, k2.hPay].join(' / ')];
  });
  await essai('① … et L’équipe & le matériel ne la compte plus en « prévu » (le planning les compte déjà)', async () => {
    const { f, ctx } = monde(S, { membres: [{ nom: 'Jean', statut: 'Actif' }] });
    ctx.CONFIG.renfort_plan = { 'Taille 2026-2027': { v: 1, l: [{ t: 'v', n: 3, a: '2027-01-04', b: '2027-01-08', ctr: 'tesa', sc: ['Jean'] }] } };
    const p = f._rfPlanPrevuSem(ORD(2027, 1, 4), ORD(2027, 1, 10));
    return [p.n === 2, J(p)];
  });
  // ② le geste
  await essai('② « Créer le contrat » sur une ligne proposée : le plan s’enregistre, la feuille s’ouvre pour 2, la ligne passe sous contrat — sans doublon', async () => {
    const { f, X, ctx, g, ouverts } = monde(S); f._rfVue(X); const S0 = g().P;
    geste(ctx, { 'data-rf': 'sel', 'data-i': 1 }); geste(ctx, { 'data-rf': 'ctrt', 'data-i': 1 });
    const C = g().C, o = C && C.o, enr = g().P.enr;
    ctx.MEMBRES.push({ nom: 'Jean', statut: 'Actif' }, { nom: 'Paul', statut: 'Actif' });
    C.fin({ noms: ['Jean', 'Paul'], n: 2 });
    const l = g().P.l.filter((L) => L.t === 'v'), plan = ctx.CONFIG.renfort_plan['Taille 2026-2027'].l.filter((L) => L.t === 'v');
    return [S0 && ouverts.includes('ovRfContrat') && o.n === 2 && o.a === '2026-11-16' && o.b === '2027-03-12' && o.ctr === 'tesa' && enr
      && l.length === 2 && J(l[0].sc) === J(['Jean', 'Paul']) && !('p' in l[0]) && J(plan[0].sc) === J(['Jean', 'Paul']), J(l)];
  });
  await essai('② sous contrat, la ligne ne se règle plus ici (combien, dates, contrat) ; « Prendre la proposition » la garde', async () => {
    const { f, X, ctx, g } = monde(S, { membres: [{ nom: 'Jean', statut: 'Actif' }, { nom: 'Paul', statut: 'Actif' }] });
    ctx.CONFIG.renfort_plan = { 'Taille 2026-2027': { v: 1, l: [{ t: 't', hab: 1 }, { t: 'v', n: 2, a: '2026-11-16', b: '2027-03-12', ctr: 'tesa', sc: ['Jean', 'Paul'] }] } };
    f._rfVue(X);
    geste(ctx, { 'data-rf': 'n+', 'data-i': 1 }); geste(ctx, { 'data-rf': 'ctr', 'data-i': 1, 'data-v': 'cdd' });
    const L = g().P.l[1];
    geste(ctx, { 'data-rf': 'prop' });
    const apres = g().P.l.filter((x) => x.t === 'v');
    return [L.n === 2 && L.ctr === 'tesa' && apres.some((x) => x.sc && x.sc.length === 2), J(apres)];
  });
  await essai('② la ligne dit « sous contrat » (ou « 1 sur 2 ») ; le réglage montre les noms et propose le reste', async () => {
    const { f, X, g } = monde(S, { membres: [{ nom: 'Jean', statut: 'Actif' }] });
    f._rfVue(X); const S0 = g().P; S0.l.push({ t: 'v', n: 2, a: '2027-01-04', b: '2027-02-26', ctr: 'tesa', sc: ['Jean', 'Paul'] }); S0.touche = true;
    const V = f._rfVue(X), k = S0.l.length - 1, et = texte(f._rfEtiq(S0.l[k], V.A[k])); S0.sel = k; const ed = f._rfEditeur(V);
    return [et === '2 saisonniers TESA · 4 janv. → 26 févr. 1 sur 2 sous contrat' && /Jean/.test(ed) && /Paul/.test(ed) && /data-rf="ctrt"[^>]*>Créer le contrat · 1</.test(ed) && !/data-rf="n\+"/.test(ed), et];
  });
  // ③ la feuille
  await essai('③ l’adresse fictive suit la convention du domaine (par majorité), sans accents, sans doublon', async () => {
    const { f, ctx } = monde(S);
    const a = f._rfcMail('Léa', []), b = f._rfcMail('Jean-Marc', ['jean-marc.essai@mavigne.app']);
    ctx.MEMBRES = [];
    const c = f._rfcMail('Zoé', []);
    return [a === 'lea.essai@mavigne.app' && b === 'jean-marc2.essai@mavigne.app' && c === 'zoe.domaine-des-grandes-vignes@mavigneapp.fr', [a, b, c].join(' · ')];
  });
  await essai('③ une fiche par personne : un compte chacun (ouvrier + saisonnier), le contrat dans le journal, le mot de passe montré une fois', async () => {
    const { f, ctx, g, comptes, saves } = monde(S); let rendu = null;
    f._rfcOuvrir({ n: 2, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, (r) => { rendu = r; });
    f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 0 }, 'Léa')); f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 1 }, 'Marc'));
    await f._rfcCreer();
    const m = ctx.MEMBRES.find((x) => x.nom === 'Léa'), h = ctx.document.els['rfc-corps'].innerHTML;
    return [J(comptes) === J([['lea.essai@mavigne.app', 'ouvrier+saisonnier'], ['marc.essai@mavigne.app', 'ouvrier+saisonnier']])
      && m && m.type_contrat === 'TESA' && m.debut_contrat === '2027-01-04' && m.fin_contrat === '2027-03-12' && J(m.hist) === J([{ d: '2027-01-04', t: 'embauche', type: 'TESA', fin: '2027-03-12' }])
      && J(m.roles) === J(['ouvrier', 'saisonnier']) && m.statut === 'Actif' && saves.filter((x) => x === 'membres').length === 2
      && rendu && J(rendu.noms) === J(['Léa', 'Marc']) && /mot-1/.test(h) && /mot-2/.test(h) && /s’afficheront plus/.test(h), J(comptes)];
  });
  await essai('③ un compte refusé (adresse prise) : pas de fiche pour lui, les autres passent, la feuille le dit', async () => {
    const { f, ctx, comptes } = monde(S); let rendu = null;
    f._rfcOuvrir({ n: 2, a: '2027-01-04', b: '2027-03-12', ctr: 'cdd' }, (r) => { rendu = r; });
    f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 0 }, 'Paul')); f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 1 }, 'Inès'));
    await f._rfcCreer();
    const h = ctx.document.els['rfc-corps'].innerHTML, i = ctx.MEMBRES.find((x) => x.nom === 'Inès');
    return [comptes.length === 2 && !ctx.MEMBRES.some((x) => x.nom === 'Paul') && i && i.type_contrat === 'CDD' && J(rendu.noms) === J(['Inès'])
      && /Paul : cette adresse est déjà utilisée/.test(h), texte(h).slice(0, 200)];
  });
  await essai('③ les prénoms se vérifient AVANT tout compte : vide, déjà dans l’équipe, en double', async () => {
    const { f, ctx, comptes } = monde(S); const essais = [];
    for (const noms of [['', 'X'], ['Awa', 'Zoé'], ['Zoé', 'zoé']]) {
      f._rfcOuvrir({ n: 2, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, () => {});
      noms.forEach((p, i) => f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': i }, p)));
      await f._rfcCreer(); essais.push(ctx.__g().C.err);
    }
    return [comptes.length === 0 && /n°1 manque/.test(essais[0]) && /Awa.*déjà dans l’équipe/.test(essais[1]) && /zoé.*déjà dans l’équipe/.test(essais[2]), essais.join(' | ')];
  });
  await essai('③ une adresse tapée à la main est gardée (la proposition ne l’écrase plus)', async () => {
    const { f, ctx, comptes } = monde(S);
    f._rfcOuvrir({ n: 1, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, () => {});
    f._rfcSaisie(rfc(ctx, { 'data-rfc': 'e', 'data-i': 0 }, 'zoe@exemple.fr')); f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 0 }, 'Zoé'));
    await f._rfcCreer();
    return [J(comptes) === J([['zoe@exemple.fr', 'ouvrier+saisonnier']]), J(comptes)];
  });
  await essai('③ une équipe collective : une fiche, N personnes, sans compte ni adresse ; la feuille se ferme', async () => {
    const { f, ctx, comptes, fermes } = monde(S); let rendu = null;
    f._rfcOuvrir({ n: 3, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, (r) => { rendu = r; });
    f._rfcGeste(rfc(ctx, { 'data-rfc': 'mode', 'data-v': 'coll' }));
    await f._rfcCreer();
    const m = ctx.MEMBRES.find((x) => x.collectif);
    return [m && m.nom === 'Saisonniers 4 janv.' && m.effectif === 3 && !m.email && m.type_contrat === 'TESA' && m.fin_contrat === '2027-03-12'
      && comptes.length === 0 && fermes.includes('ovRfContrat') && J(rendu) === J({ noms: ['Saisonniers 4 janv.'], n: 3 }), J(m)];
  });
  await essai('③ la démo : des fiches, aucun compte, et elle le dit', async () => {
    const { f, ctx, comptes } = monde(S, { demo: true });
    f._rfcOuvrir({ n: 1, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, () => {});
    f._rfcSaisie(rfc(ctx, { 'data-rfc': 'p', 'data-i': 0 }, 'Zoé'));
    await f._rfcCreer();
    return [comptes.length === 0 && ctx.MEMBRES.some((x) => x.nom === 'Zoé') && /Démo : aucun compte/.test(ctx.document.els['rfc-corps'].innerHTML), String(comptes.length)];
  });
  await essai('③ un ouvrier n’ouvre pas la feuille et ne crée rien', async () => {
    const { f, ctx, ouverts, comptes } = monde(S, { admin: false });
    f._rfcOuvrir({ n: 1, a: '2027-01-04', b: '2027-03-12', ctr: 'tesa' }, () => {});
    return [!ouverts.length && ctx.__g().C === null && !comptes.length, J(ouverts)];
  });
  // ④ la source
  T('④ la fenêtre existe (index.html), son corps est #rfc-corps, l’inventaire des fenêtres la range (FORMULAIRE)',
    /<div class="overlay" id="ovRfContrat" onclick="closeOv\(event,'ovRfContrat'\)"><div class="modal" onclick="event\.stopPropagation\(\)"><div class="modal-handle"><\/div><div id="rfc-corps"><\/div><\/div><\/div>/.test(S.html)
    && /ovRfContrat: \['FORMULAIRE'/.test(S.aj));
  T('④ la feuille vit avec l’équipe (reglages.js) et s’expose ; le Renfort l’appelle', /window\._rfcOuvrir {12}= _rfcOuvrir;/.test(S.regl) && /window\._rfcOuvrir\(o, function\(r\)\{/.test(S.pil));
  T('④ les deux gestes de la feuille sont exemptés du cliquet des tutos, avec leur raison', /"_rfcGeste": "RENF-4 \(§620\)/.test(S.cfg) && /"_rfcSaisie": "RENF-4 \(§620\)/.test(S.cfg));
  T('④ une ligne sous contrat ne se glisse pas (ni poignées, ni glisser)', /if\(!L\|\|!A\|\|L\.sc\) return;/.test(S.pil) && /\(\(S\.admin&&!sc\)\?'<i class="rfp-h l">/.test(S.pil));
  T('④ le style : la barre sous contrat, les noms, la feuille', /#page-pilotage \.rfp-bar\.v\.sc\{/.test(S.css) && /#ovRfContrat \.rfc-r\{/.test(S.css));
  T('④ le guide dit « Créer le contrat »', /Créer le contrat/.test(S.guide) && /sous contrat/.test(S.guide));
  return out;
}

const D = [
  ['la ligne sous contrat compte encore en renfort', (S) => Object.assign({}, S, { pil: S.pil.replace("if(!(nn>0)) continue;                // RENF-4", "nn=L.n; if(!(nn>0)) continue;                // RENF-4") })],
  ['L’équipe la compte encore en « prévu »', (S) => Object.assign({}, S, { pil: S.pil.replace('nn=Math.max(0,L.n-_rfScN(L.sc));', 'nn=L.n;') })],
  ['une équipe collective compte pour une personne', (S) => Object.assign({}, S, { pil: S.pil.replace("n+=(m.collectif?Math.max(1,Number(m.effectif)||1):1);", 'n+=1;') })],
  ['une fiche inactive compte encore', (S) => Object.assign({}, S, { pil: S.pil.replace("if(m&&m.nom===nom&&m.statut!=='Inactif')", 'if(m&&m.nom===nom)') })],
  ['la ligne se relit mal après l’enregistrement (doublon)', (S) => Object.assign({}, S, { pil: S.pil.replace('if(!S.enr){ _rfPlanEcrit(); L=S.l[k]; if(!L) return; }', 'if(!S.enr){ _rfPlanEcrit(); }').replace('for(q=0;i<0&&q<S2.l.length;q++)', 'for(q=0;false;q++)') })],
  ['la ligne sous contrat se règle encore', (S) => Object.assign({}, S, { pil: S.pil.replace("if(L.sc&&(a==='n+'||a==='n-'||a==='ctr'||a==='a'||a==='b')) return;", '') })],
  ['« Prendre la proposition » efface les fiches', (S) => Object.assign({}, S, { pil: S.pil.replace("return L.t==='t'||L.sc; }).concat(", "return L.t==='t'; }).concat(") })],
  ['le contrat n’entre pas au journal', (S) => Object.assign({}, S, { regl: S.regl.replace("hist:[{ d:o.a, t:'embauche', type:type, fin:o.b }]", 'hist:[]') })],
  ['un compte refusé laisse sa fiche', (S) => Object.assign({}, S, { regl: S.regl.replace('+_rfcMsg(eC)); continue; }', '+_rfcMsg(eC)); }') })],
  ['les prénoms ne se vérifient plus', (S) => Object.assign({}, S, { regl: S.regl.replace("if(noms.indexOf(p.toLowerCase())>=0||vus.indexOf(p.toLowerCase())>=0)", 'if(false)') })],
  ['la proposition d’adresse écrase la saisie', (S) => Object.assign({}, S, { regl: S.regl.replace("r.e=el.value.trim(); r.auto=!r.e;", 'r.e=el.value.trim();') })],
  ['la convention n’est plus déduite (le slug d’office)', (S) => Object.assign({}, S, { regl: S.regl.replace("if(best){ var i=best.indexOf('@');", "if(false){ var i=best.indexOf('@');") })],
  ['la démo crée des comptes', (S) => Object.assign({}, S, { regl: S.regl.replace("function _rfcDemo(){ var cu=window.currentUser; return !!(cu&&(cu._isDemo||cu._isVisite)); }", 'function _rfcDemo(){ return false; }') })],
  ['un ouvrier ouvre la feuille', (S) => Object.assign({}, S, { regl: S.regl.replace("if(!isAdmin()||!o||!(o.n>0)) return;", 'if(!o||!(o.n>0)) return;') })],
  ['l’équipe collective reçoit une adresse', (S) => Object.assign({}, S, { regl: S.regl.replace("M.push(fiche({ nom:nc, roles:['saisonnier'], collectif:true, effectif:o.n }));", "M.push(fiche({ nom:nc, email:'x@y.fr', roles:['saisonnier'], collectif:true, effectif:o.n }));") })],
  ['les gestes de la feuille perdent leur exemption', (S) => Object.assign({}, S, { cfg: S.cfg.replace('"_rfcGeste": "RENF-4', '"_rfcGesteX": "RENF-4') })],
];
let ok = 0, ko = 0;
(await suite(SRC0)).forEach(([n, c, d]) => { if (c) { ok++; console.log('  ✓ ' + n); } else { ko++; console.log('  ✗ ' + n + (d ? '\n      → ' + d : '')); } });
console.log(`\nRENF-4 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
let rg = 0;
for (const [n, f] of D) {
  const S = f(SRC0);
  if (J(S) === J(SRC0)) { console.log('  ⚠ non injecté : ' + n); continue; }
  let res; try { res = await suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
