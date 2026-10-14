// HARNAIS — SANSREC-1 (§332) : « pas de récolte cette année » — une parcelle en place que l'on ne vendange pas.
//   node scripts/mv-harnais-sansrec1.mjs           → doit être vert
//   node scripts/mv-harnais-sansrec1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites (lignes de commentaire retirées) dans UN contexte : la règle (utils.js, blocs SEL-1,
// RETRAIT-1 et SANSREC-1), « Encore sur pied » (cuvier.js, lu par mv-cave-src), la feuille de récolte (app.js), le report des
// coûts et le calcul du Revient (pilotage.js). Aucun double du moteur : seules les primitives d'écran sont bouchonnées.
// Nico (14/10) : une parcelle rendue impropre à la récolte avant les vendanges restait « en attente d'être vendangée ».
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
import { sourceDates } from './mv-dates-reelles.mjs';
import { lireCave } from './mv-cave-src.mjs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC = { ut: lire('src/utils.js'), cav: lireCave(R), app: lire('src/app.js'), pil: lire('src/pilotage.js') };
const DOC = { g04: lire('guide/04-vigne.html'), g08: lire('guide/08-cave.html'), g11: lire('guide/11-pilotage.html') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function bloc(src, a, b, nom) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + nom); return src.slice(i, j + b.length); }
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('fonction introuvable : ' + sig); const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3); }
// Comptage naïf (celui du harnais « Encore sur pied », éprouvé sur ces fonctions de la Cave).
function corpsNaif(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let n = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++) { if (src[j] === '{') n++; else if (src[j] === '}') { n--; if (n === 0) break; } }
  return src.slice(i, j + 1);
}
// Comptage hors chaînes et commentaires (celui du harnais du Revient : son CSS et ses chaînes portent des accolades).
function corpsPil(src, nom) {
  const m = [...src.matchAll(new RegExp('^(?:export )?function ' + nom + '\\s*\\(', 'gm'))];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++; else if (ch === '}' && --d === 0) return src.slice(m[0].index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function varDeModule(src, nom) {
  const m = src.match(new RegExp('^var\\s+' + nom + '\\s*=\\s*([^;]+);', 'm'));
  if (!m) throw new Error('variable de module introuvable : ' + nom);
  return 'var ' + nom + ' = ' + m[1].trim() + ';';
}
const DE_CAVE = ['_matNorm', '_anaSpd', '_matSuc', '_matJours', '_mvF1', '_vendResteCle', '_vendResteActives', '_vendResteCmp',
  '_vendResteARentrer', '_vendResteVal', '_vendResteHtml', '_vendResteToggle', '_mlResteARentrer'];
function extraire(S) {
  const UT = [
    S.ut.match(/var MV_EX_MOIS_LBL = .*;/)[0], 'var MV_CAMP_MOIS_DEF = 7;',
    fn(S.ut, 'function _mvCampagneMois(){'), fn(S.ut, 'function _mvCampagneDe(iso){'),
    fn(S.ut, 'function _mvCampagneBornes(c){'), fn(S.ut, 'function _saisonObj(nom){'), fn(S.ut, 'function _saisonTaches(nom){'),
    S.ut.match(/^function _mvNormTache\(s\)\{.*$/m)[0],
    'function _mvAujIso(){ return window.__AUJ; }',
    bloc(S.ut, 'var MV_TACHES_SEL', 'window._mvSelResume       = _mvSelResume;', 'SEL-1'),
    bloc(S.ut, '// ★★ RETRAIT-1 (§325) — UNE TÂCHE ORDINAIRE', 'window._mvPerResume       = _mvPerResume;', 'RETRAIT-1'),
    bloc(S.ut, '// ★★ SANSREC-1 (§332) — « PAS DE RÉCOLTE CETTE ANNÉE »', 'window._mvSansRecolte     = _mvSansRecolte;', 'SANSREC-1'),
    corpsNaif(S.ut, '_escHtml'), corpsNaif(S.ut, '_escAttr'),
  ].join('\n');
  const CAV = [sourceDates(), varDeModule(S.cav, '_vendResteOuv'), varDeModule(S.cav, '_VEND_RESTE_MAX'),
    'function _vendCfg(){ return { sucre_par_degre: 16.83 }; }', 'function _mlCampagne(){ return window.__MIL; }',
    'function canWrite(){ return true; }', 'function _mvIcon(n,t){ return \'<svg data-ic="\'+n+\'"></svg>\'; }',
    'function renderVendRec(){}'].concat(DE_CAVE.map(n => corpsNaif(S.cav, n))).join('\n');
  const APP = bloc(S.app, '// ══════ SEL-1', 'function saveSelParc(){', 'feuille') + fn(S.app, 'function saveSelParc(){').slice('function saveSelParc(){'.length);
  const PIL = corpsPil(S.pil, '_pecRevReport') + '\n' + corpsPil(S.pil, '_pecRevCalc');
  return { UT: sansCom(UT), CAV: sansCom(CAV), APP: sansCom(APP), PIL };
}
const SAISONS_DEF = () => [
  { nom: 'Hiver 2025-2026', debut: '2025-11-01', fin: '2026-02-28', taches: ['Taille'] },
  { nom: 'Saison 2026', debut: '2026-03-01', fin: '2026-08-31', taches: ['Relevage'] },
  { nom: 'Vendanges 2026', debut: '2026-09-01', fin: '2026-10-15', taches: ['Vendange', 'Arrachage'], active: true },
  { nom: 'Automne 2026', debut: '2026-10-16', fin: '2026-12-31', taches: ['Arrachage', 'Reparation'] }];
const PARC_DEF = () => [
  { nom: 'Les Grandes Vignes', surface: '0.42', cepages: ['Pinot noir'], statut: 'Active', taches: {}, horsPer: { 'Vendanges 2026': ['Vendange'] } },
  { nom: 'Aux Combottes', surface: '0.55', statut: 'Active', taches: {} },
  { nom: 'Le Clos', surface: '1.10', statut: 'Active', taches: {}, horsPer: { 'Vendanges 2026': ['Vendange'] } },
  { nom: 'Vieille Vigne', surface: '0.80', statut: 'Arrachee', taches: {}, horsPer: { 'Vendanges 2026': ['Vendange'] } },
  { nom: 'Combe Brulee', surface: '0.26', statut: 'Active', taches: {}, tachesExclues: ['Vendange'] },
  { nom: 'En Champs', surface: '3.65', statut: 'Active', taches: { Vendange: 'En cours' } },
  { nom: 'La Justice', surface: '2.05', statut: 'Active', taches: {}, horsPer: { 'Automne 2026': ['Vendange'] } }];
function monde(X, { admin = true, saisons, parc, recoltes } = {}) {
  const toasts = [], log = [], els = {};
  const el = id => (els[id] ||= { id, value: '', textContent: '', innerHTML: '' });
  const ctx = {
    console, Date, Math, String, Number, Array, Object, JSON, RegExp, parseInt, parseFloat, isNaN, isFinite,
    __AUJ: '2026-10-14', __MIL: 2026, CONFIG: {}, JOURNAL: [], TRAVAUX: {}, SESSIONS: [], HISTORIQUE: [],
    SAISONS: saisons || SAISONS_DEF(), PARCELLES: parc || PARC_DEF(),
    TACHES: [{ nom: 'Vendange' }, { nom: 'Arrachage' }, { nom: 'Taille' }, { nom: 'Relevage' }, { nom: 'Reparation' },
      { nom: 'Vendanges vertes' }, { nom: 'Recolte', couperet: true }],
    TACHES_CATALOGUE: [{ nom: 'Vendange', label: 'Vendange' }],
    CAVE_VENDANGE: { recoltes: recoltes || [{ id: 'r1', parcelle: 'le clos', date: '2026-09-20', nb_caisses: 40 }], analyses: [] },
    isAdmin: () => admin, getSaisonActive: () => ({ nom: 'Vendanges 2026' }), _visuSaison: () => 'Vendanges 2026',
    getTacheStatut: (p, t) => (p.taches && typeof p.taches[t] === 'string') ? p.taches[t] : 'Non démarré',
    document: { getElementById: id => (id.startsWith('selp-') ? el(id) : null), querySelector: () => null },
    openOv: id => log.push('open:' + id), closeOv: (e, id) => log.push('close:' + id),
    showToast: m => toasts.push(m), saveData: k => log.push('save:' + k), recalcTravaux: n => log.push('recalc:' + n),
    renderParcelles: () => 0, computePStats: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(X.UT + '\nwindow._mvCampagneBornes=_mvCampagneBornes;\n' + X.CAV + '\n' + X.APP + '\n' + X.PIL, ctx);
  return { k: ctx, toasts, log, el, P: n => ctx.PARCELLES.find(p => p.nom === n) };
}
const P0 = (nom, surf, aoc, o) => Object.assign({ nom, surf, aoc, max: null, cout: { mo: 0, trac: 0, gnr: 0, phy: 0, pre: 0 }, rec: null, hist: [] }, o || {});
const proche = (a, b) => a != null && Math.abs(a - b) < 1e-6;
function suite(X) {
  const out = [];
  const T = (n, f) => { let c; try { c = !!f(); } catch (e) { c = false; n += ' [exception : ' + e.message + ']'; } out.push([n, c]); };
  // ── U : la règle (utils.js) ──
  let w = monde(X); const k = w.k;
  T('U1 la vendange : « Vendange(s) » à l’égalité stricte, le drapeau couperet ; « Vendanges vertes » non', () =>
    k._mvEstVendange('Vendange') && k._mvEstVendange(' vendanges ') && k._mvEstVendange('Recolte') && !k._mvEstVendange('Vendanges vertes') && !k._mvEstVendange('Taille'));
  T('U2 les périodes de 2026 qui portent la vendange : « Vendanges 2026 » seule', () => { const V = k._mvVendangePers(2026); return V.nom === 'Vendange' && V.pers.join('|') === 'Vendanges 2026'; });
  T('U3 sans récolte : désactivée sur la période (LGV), retrait d’avant (Combe) ; pas une arrachée, pas une autre période (La Justice)', () =>
    k._mvSansRecolte(w.P('Les Grandes Vignes'), 2026) && k._mvSansRecolte(w.P('Combe Brulee'), 2026) && !k._mvSansRecolte(w.P('Aux Combottes'), 2026)
    && !k._mvSansRecolte(w.P('Vieille Vigne'), 2026) && !k._mvSansRecolte(w.P('La Justice'), 2026));
  const wt = monde(X, { saisons: SAISONS_DEF().concat([{ nom: 'Vendanges tardives 2026', debut: '2026-10-10', fin: '2026-10-31', taches: ['Vendange'] }]) });
  T('U4 deux périodes de vendange : sans récolte seulement si elle est désactivée sur les deux', () => {
    const p = wt.P('Les Grandes Vignes'); const a = wt.k._mvSansRecolte(p, 2026); wt.k._mvHorsPose(p, 'Vendange', true, 'Vendanges tardives 2026'); return !a && wt.k._mvSansRecolte(p, 2026); });
  T('U5 une année sans période de vendange : rien n’est « sans récolte »', () => k._mvVendangePers(2027).pers.length === 0 && !k._mvSansRecolte(w.P('Les Grandes Vignes'), 2027));
  // ── C : « Encore sur pied » (cuvier.js) ──
  const r = k._vendResteARentrer(2026);
  T('C1 encore sur pied : Aux Combottes, En Champs, La Justice (la récoltée et l’arrachée absentes)', () => r.lignes.map(e => e.nom).join('|') === 'Aux Combottes|En Champs|La Justice');
  T('C2 sans récolte : Combe, Les Grandes Vignes — Le Clos, récoltée, n’y est pas (la récolte l’emporte)', () => r.sans.map(e => e.nom).join('|') === 'Combe Brulee|Les Grandes Vignes');
  T('C3 la carte connaît les périodes de vendange de l’année', () => r.vend && r.vend.pers.join('|') === 'Vendanges 2026');
  T('C4 le millésime lit les mêmes lignes', () => k._mlResteARentrer(2026).map(p => p.nom).join('|') === 'Aux Combottes|En Champs|La Justice');
  let h = k._vendResteHtml();
  T('C5 admin : la ligne nomme les deux, « Modifier » ouvre la feuille de 2026 ; la question cède la place', () =>
    h.includes('Pas de récolte cette année') && h.includes('<b>Combe Brulee</b>, <b>Les Grandes Vignes</b>') && h.includes('onclick="openRecParc(2026)">Modifier') && !h.includes('mvv-reste-q') && h.includes('<b>3</b>parcelles'));
  const wn = monde(X, { admin: false }); const hn = wn.k._vendResteHtml();
  T('C6 lecture : la ligne reste, aucun bouton vers la feuille', () => hn.includes('Pas de récolte cette année') && !hn.includes('openRecParc'));
  const sansNul = () => { const L = PARC_DEF(); delete L[0].horsPer; delete L[4].tachesExclues; return L; };
  const wq = monde(X, { parc: sansNul() }), hq = wq.k._vendResteHtml(), hqn = monde(X, { parc: sansNul(), admin: false }).k._vendResteHtml();
  T('C7 aucune sans récolte : l’admin voit « Une parcelle ne sera pas récoltée ? » (id de la nouveauté), le lecteur non', () =>
    hq.includes('id="mvv-reste-q"') && hq.includes('Une parcelle ne sera pas récoltée ?') && hq.includes('openRecParc(2026)') && !hqn.includes('mvv-reste-q'));
  const wr = monde(X, { recoltes: ['le clos', 'Aux Combottes', 'En Champs', 'La Justice'].map((n, i) => ({ id: 'x' + i, parcelle: n, date: '2026-09-2' + i, nb_caisses: 9 })) });
  const hr = wr.k._vendResteHtml();
  T('C8 tout rentré : « Tout est rentré », 4 parcelles à récolter (6 en place − 2 sans récolte), la ligne et « Modifier »', () =>
    hr.includes('Tout est rentré') && hr.includes('<b>4</b>parcelles') && hr.includes('chaque parcelle à récolter') && hr.includes('Pas de récolte cette année') && hr.includes('Modifier'));
  const sv = SAISONS_DEF(); sv[2].taches = ['Arrachage'];
  const hv = monde(X, { saisons: sv, parc: sansNul() }).k._vendResteHtml();
  T('C9 aucune période ne porte la vendange : pas de question (elle ne mènerait nulle part)', () => !hv.includes('mvv-reste-q') && hv.includes('Encore sur pied'));
  // ── F : la feuille de récolte (app.js) ──
  w = monde(X); w.k.openRecParc(2026);
  const rows = w.el('selp-rows').innerHTML;
  T('F1 ouverte : « Récolte 2026 », la période de vendange, le texte de la récolte', () =>
    w.log.includes('open:ovSelParc') && w.el('selp-titre').textContent === 'Récolte 2026' && w.el('selp-sub').textContent.includes('Vendanges 2026') && /Encore sur pied/.test(w.el('selp-intro').textContent));
  T('F2 seulement les parcelles encore sur pied et les sans récolte ; à récolter cochées, sans récolte décochées', () =>
    !rows.includes('data-selp-n="Le Clos"') && !rows.includes('data-selp-n="Vieille Vigne"') && /pchk sel vert" data-selp-n="Aux Combottes"/.test(rows)
    && /pchk sel vert" data-selp-n="La Justice"/.test(rows) && /class="pchk" data-selp-n="Les Grandes Vignes"/.test(rows) && /class="pchk" data-selp-n="Combe Brulee"/.test(rows));
  T('F3 la vendange commencée reste cochée et le dit ; surface à la française, « pas de récolte » sur une décochée', () =>
    /pchk sel vert" data-selp-n="En Champs"[^>]*title="Vendange commenc/.test(rows) && /En Champs <span[^>]*>3,65 ha · commencée</.test(rows) && rows.includes('0,42 ha · pas de récolte'));
  T('F4 total : 3 à récolter sur 5, 2 sans récolte pour 0,68 ha', () => w.el('selp-tot').textContent === '3 parcelles à récolter sur 5 · 2 sans récolte, 0,68 ha');
  w.k._mvSelPick({ getAttribute: () => 'En Champs' });
  T('F5 toucher la commencée : refus « Vendange commencée »', () => w.toasts.some(m => /Vendange commencée/.test(m)));
  w.k._mvSelPick({ getAttribute: () => 'Aux Combottes' }); w.k._mvSelPick({ getAttribute: () => 'Les Grandes Vignes' }); w.k.saveSelParc();
  T('F6 enregistrer : Aux Combottes désactivée sur la période, LGV remise ; Combe, En Champs, La Justice intactes ; sauvé, recalculé', () => {
    const A = w.P('Aux Combottes'), G = w.P('Les Grandes Vignes'), J = w.P('La Justice');
    return A.horsPer['Vendanges 2026'].indexOf('Vendange') >= 0 && !('horsPer' in G) && w.P('Combe Brulee').tachesExclues.indexOf('Vendange') >= 0
      && !('horsPer' in w.P('En Champs')) && J.horsPer['Automne 2026'].length === 1 && !J.horsPer['Vendanges 2026']
      && w.log.includes('save:parcelles') && w.log.includes('recalc:Vendange') && w.log.includes('close:ovSelParc'); });
  T('F7 la règle suit : Aux Combottes sans récolte, LGV de nouveau à récolter ; le message compte 2', () =>
    w.k._mvSansRecolte(w.P('Aux Combottes'), 2026) && !w.k._mvSansRecolte(w.P('Les Grandes Vignes'), 2026) && w.toasts.some(m => m === 'Récolte 2026 : 2 parcelles sans récolte'));
  const wa = monde(X, { admin: false }); wa.k.openRecParc(2026);
  const wb = monde(X); wb.k.openRecParc(2026); wb.k._mvSelPick({ getAttribute: () => 'Aux Combottes' }); wb.k.isAdmin = () => false; wb.k.saveSelParc();
  T('F8 non-admin : rien ne s’ouvre, et la garde est dans l’écriture', () => !wa.log.includes('open:ovSelParc') && !wb.log.includes('save:parcelles') && !('horsPer' in wb.P('Aux Combottes')));
  const w2 = monde(X, { saisons: SAISONS_DEF().concat([{ nom: 'Vendanges tardives 2026', debut: '2026-10-10', fin: '2026-10-31', taches: ['Vendange'] }]) });
  w2.k.openRecParc(2026); w2.k._mvSelPick({ getAttribute: () => 'Les Grandes Vignes' }); w2.k.saveSelParc();
  T('F9 deux périodes de vendange : décocher écrit sur les deux, et la parcelle devient sans récolte', () => {
    const h2 = w2.P('Les Grandes Vignes').horsPer; return h2['Vendanges 2026'].indexOf('Vendange') >= 0 && h2['Vendanges tardives 2026'].indexOf('Vendange') >= 0 && w2.k._mvSansRecolte(w2.P('Les Grandes Vignes'), 2026); });
  // ── R : le Revient (pilotage.js) ──
  const C = { by: { X: { mo: 100, trac: 50, gnr: 20, phy: 30, pre: 0 }, Y: { mo: 200, trac: 0, gnr: 0, phy: 0, pre: 0 }, Z: { mo: 300, trac: 0, gnr: 0, phy: 0, pre: 0 } } };
  const parc = [{ nom: 'X', surface: '1' }, { nom: 'Y', surface: '1' }, { nom: 'Z', surface: '3' }];
  const rep = k._pecRevReport(C, parc, { X: 1 });
  T('R1 report : le coût de X passe à la surface sur Y (¼) et Z (¾), poste par poste ; rien ne se perd', () =>
    rep.n === 1 && proche(rep.eur, 200) && proche(rep.ha, 1) && proche(C.by.Y.mo, 225) && proche(C.by.Z.trac, 37.5) && proche(C.by.Z.phy, 22.5)
    && ['mo', 'trac', 'gnr', 'phy', 'pre'].every(x => C.by.X[x] === 0) && proche(C.by.X.mo + C.by.Y.mo + C.by.Z.mo, 600) && proche(C.by.Y.gnr + C.by.Z.gnr, 20));
  const C2 = { by: { X: { mo: 100 }, Y: { mo: 200 } } }, rep2 = k._pecRevReport(C2, parc.slice(0, 2), { X: 1, Y: 1 });
  T('R2 aucune autre vigne : rien n’est déplacé', () => rep2.n === 0 && C2.by.X.mo === 100 && C2.by.Y.mo === 200);
  const PP = () => [P0('X', 1, 'A', { max: 40, hist: [35], sansRec: true }), P0('Y', 1, 'A', { max: 40, cout: { mo: 1000 }, rec: { hlTot: 40, domHl: 40, domShare: 1, kg: 5400 } }),
    P0('Z', 3, 'B', { max: 55, cout: { mo: 3000 }, rec: { hlTot: 150, domHl: 150, domShare: 1, kg: 20000 } })];
  const RV = k._pecRevCalc(PP(), 0), gA = RV.aoc.find(g => g.aoc === 'A');
  T('R3 sans récolte : « constaté » dès que les autres sont rentrées ; ni hL ni bouteille (son historique ignoré) ; surface comptée à part', () =>
    RV.etat === 'cons' && RV.tot.nX === 1 && proche(RV.tot.haX, 1) && proche(RV.tot.ha, 5) && proche(RV.tot.haAvec, 4)
    && RV.rows[0].src === 'x' && RV.rows[0].cols === 0 && RV.rows[0].hlha === null && proche(RV.tot.cols, 190 * 100 / 0.75) && proche(gA.ha, 2) && proche(gA.hlha, 40));
  const pp = PP(); pp[1].rec = null; pp[1].hist = [30];
  T('R4 une autre pas encore rentrée : reste « probable »', () => k._pecRevCalc(pp, 0).etat === 'prob');
  const RX = k._pecRevCalc([P0('Y', 1, 'A', { rec: { hlTot: 40, domHl: 40, domShare: 1, kg: 1 } }), P0('Q', 2, 'C', { sansRec: true })], 0), gC = RX.aoc.find(g => g.aoc === 'C');
  T('R5 seule dans son appellation : la ligne existe, sans bouteille ni prix', () => gC && proche(gC.ha, 2) && gC.cols === 0 && gC.eurCol === null && RX.etat === 'cons');
  // ── W : le câblage et ce que l'appli en dit ──
  T('W1 la feuille est exposée et aiguillée', () => SRC.app.includes('window.openRecParc = openRecParc') && SRC.app.includes("if(_SELP.mode==='rec') return _mvRecSave();"));
  T('W2 la nouveauté vise un bouton qui existe', () => SRC.cav.includes('id="mvv-reste-q"') && /\{ v: '9\.00'[\s\S]{0,300}cible: '#mvv-reste-q'/.test(SRC.ut));
  T('W3 l’aide, la fiche « i » et le guide le disent', () => SRC.ut.includes('Une parcelle ne sera pas récoltée ?') && SRC.ut.includes('ne sera pas récoltée cette année')
    && SRC.ut.includes('déclarée sans récolte cette année') && SRC.ut.includes('<b>Pas de récolte cette année</b> (SANSREC-1)')
    && DOC.g08.includes('Une parcelle ne sera pas récoltée ?') && DOC.g04.includes('ne sera pas récoltée cette année') && DOC.g11.includes('sans récolte cette année'));
  return out;
}
let ok = 0, ko = 0;
let base; try { base = suite(extraire(SRC)); } catch (e) { base = [['extraction : ' + e.message, false]]; }
base.forEach(([n, c]) => { if (c) ok++; else ko++; console.log((c ? '  \u2713 ' : '  \u2717 ') + n); });
console.log(`\nSANSREC-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('base rouge : contre-épreuve sans objet'); process.exit(1); }
const DEFAUTS = [
  ['« Encore sur pied » ignore la règle', 'cav', 'if(_V&&_V.pers.length&&window._mvSansRecolte(p,mil,_V)){', 'if(false){'],
  ['une arrachée peut être « sans récolte »', 'ut', "if(!p || p.nom == null || p.statut === 'Arrachee') return false;", 'if(!p || p.nom == null) return false;'],
  ['une seule période désactivée suffit', 'ut', 'for(var i = 0; i < V.pers.length; i++){ if(_mvConcernePer(p, V.nom, V.pers[i])) return false; }\n  return true;',
    'for(var i = 0; i < V.pers.length; i++){ if(!_mvConcernePer(p, V.nom, V.pers[i])) return true; }\n  return false;'],
  ['les périodes ne sont pas bornées à l’année', 'ut', '    if(String(s.fin).slice(0, 10) < d0 || String(s.debut).slice(0, 10) > d1) return;\n', ''],
  ['« Vendanges vertes » prise pour la vendange', 'ut', "  return k === 'vendange' || k === 'vendanges';", "  return k.indexOf('vendange') === 0;"],
  ['enregistrer n’écrit que la première période', 'app', '  var nom=_SELP.nom, P=_SELP.pers||[];', '  var nom=_SELP.nom, P=(_SELP.pers||[]).slice(0,1);'],
  ['une vendange commencée se décoche', 'app', '    if(comm){ _SELP.trav[p.nom]=true; _SELP.sel[p.nom]=true; }   // vendange commencée : reste à récolter', ''],
  ['la feuille montre tout le parcellaire', 'app', "      && (_SELP.mode!=='rec' || !!(_SELP.liste&&_SELP.liste[p.nom]));   // SANSREC-1 (§332) : la récolte ne montre que les parcelles encore sur pied", '      ;'],
  ['le report perd le coût', 'pil', '      out.eur+=v;\n', '      return;\n'],
  ['une sans récolte bloque le « constaté »', 'pil', '      T.ha+=p.surf; T.haX+=p.surf; T.nX++;', '      T.ha+=p.surf; T.haX+=p.surf; T.nX++; T.n++;'],
  ['« Tout est rentré » compte les sans récolte', 'cav', "+(nAct-sans.length)+'</b>parcelle'", "+nAct+'</b>parcelle'"],
  ['la question s’affiche sans période de vendange', 'cav', '    else if(adm&&r.vend&&r.vend.pers&&r.vend.pers.length)', '    else if(adm)'],
];
let rougies = 0;
DEFAUTS.forEach(([nom, cle, a, b]) => {
  const n = SRC[cle].split(a).length - 1;
  if (n !== 1) { console.log('  \u26a0 défaut non injecté (' + n + ' occurrence(s)) : ' + nom); return; }
  const S2 = Object.assign({}, SRC, { [cle]: SRC[cle].replace(a, b) });
  let r2; try { r2 = suite(extraire(S2)); } catch (e) { r2 = [['exception ' + e.message, false]]; }
  const rouge = r2.some(([, x]) => !x);
  if (rouge) rougies++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom);
});
console.log(`\ncontre-épreuves : ${rougies}/${DEFAUTS.length} rougissent`);
process.exit(rougies === DEFAUTS.length ? 0 : 1);
