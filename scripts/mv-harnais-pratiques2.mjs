// ═════════════════════════════════════════════════════════════════════════════
//  HARNAIS PRATIQUES-2 (§624) — LES GESTES DU BLANC AU CUVIER
// ═════════════════════════════════════════════════════════════════════════════
//  La suite de PRATIQUES-1 (Nico, 27/11 : « suite »), d'après la maquette v2 validée : débourber, soutirer le
//  jus clair, entonner ou fermenter dans la cuve ; le pressurage d'arrivée et les choix de la cuve ; la frise
//  d'une cuve de blanc et son prochain geste ; les repères du domaine.
//
//  Sur les VRAIES fonctions extraites de src/cuvier-pratiques.js (jouées dans Node) et sur les vrais fichiers
//  pour le branchement.
//
//  CE QUE CE HARNAIS PROUVE
//   A. les blocages, JOUÉS : débourber une cuve qui fermente, partie au Chai, pressurée ; un soutirage dont la
//      fin précède le début, sans jus, ou avec plus de jus et de bourbes que la cuve n'en a ;
//   B. le parcours d'une cuve suit ses choix (fût, cuve, démarrée en cuve ; la malo), et sa frise se LIT des
//      faits (pressé, débourbage en cours ou fini, entonné, en fermentation) ;
//   C. le prochain geste (débourber, soutirer, entonner) ; le repère de turbidité ; « pas de débourbage » ;
//   D. le branchement : la feuille vérifie AVANT d'écrire ; « fermenter en cuve » pose 'fa', daté ; « entonner »
//      ouvre la feuille de décuvage en mode entonnage (fa_finie:false) ; l'objet rebâti de la cuve garde le
//      débourbage, le pressurage, les choix ; la frise du blanc remplace celle d'avant ; la frontière ;
//   E. les repères du réglage et leur sécurité ; F. l'aide, le guide, « Quoi de neuf », le tuto.
//
//  Usage :  node scripts/mv-harnais-pratiques2.mjs
//           node scripts/mv-harnais-pratiques2.mjs --contre
// ═════════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { texteTutosDepot } from './mv-tutos-sources.mjs';   // ★ COULEUR-1 (§625) : le moteur des tutos et ses listes par module
const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SAIN = {
  pr: lire('src/cuvier-pratiques.js'), cu: lire('src/cuvier.js'), utils: lire('src/utils.js'), wn: lire('src/whats-new.js'),
  g08: lire('guide/08-cave.html'), tu: texteTutosDepot(), css: lire('src/styles.css')
};

function bornes(src, nom) {
  const re = new RegExp('^(?:export )?(?:async )?function ' + nom + '\\s*\\(', 'gm');
  const m = [...src.matchAll(re)];
  if (m.length !== 1) throw new Error(nom + ' : ' + m.length + ' définition(s)');
  let d = 0, q = null;
  for (let j = src.indexOf('{', m[0].index); j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j) + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return [m[0].index, j + 1];
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom) => { const [a, b] = bornes(src, nom); return src.slice(a, b); };
const avant = (t, a, b) => t.indexOf(a) >= 0 && t.indexOf(b) >= 0 && t.indexOf(a) < t.indexOf(b);

const PRELUDE = `
var window = { currentUser: { nom: 'Nico' } };
var CAVE_VENDANGE = { config: {}, cuves_vinif: [] };
var COUL = { Perr: 'b', Clos: 'r' }, FML = null, ECRIT = 0;
function _parcCoul(n){ return COUL[n] || '?'; }
function _mlAuj(){ return '2026-09-14'; }
function _vendFrDate(d){ var x = String(d).split('-'); return x[2] + '/' + x[1]; }
function _vendStatLbl(s){ return ({ fa: 'FA', fml: 'FML', setup: 'Setup', termine: 'Terminé', decuvage: 'Pressurage', mpf: 'MPF' })[s] || s; }
function _vendDecuvee(c){ return !!(c && c.decuvage && c.decuvage.date); }
function _vendPressee(c){ return !!c && c.statut === 'decuvage' && !_vendDecuvee(c); }
function _vendFaEnCours(c){ return _vendDecuvee(c) && c.decuvage.fa_finie === false; }
function _vendFmlVin(c){ return FML; }
function canWrite(){ return true; }
function _escHtml(s){ return String(s == null ? '' : s); }
function _escAttr(s){ return String(s == null ? '' : s); }
function _mvIcon(){ return ''; }
function __pose(o){ CAVE_VENDANGE.config = o.config || {}; FML = o.fml || null; }
`;
const NOMS = ['_pratHas', '_pratCfg', '_pratParcours', '_pratDe', '_vendParcCouls', '_vendCoulAuto', '_vendCuveCoul', '_pratAlertes',
  '_debJusL', '_debBaseL', '_debPossible', '_debEtat', '_debBloque', '_debQuand', '_debQuandTxt', '_debCheckFin', '_nbL', '_debNtuRep',
  '_pratParcoursCuve', '_pratAvance', '_pratEtapeLbl', '_pratDepuis', '_debProchain'];
function charger(S) {
  const vars = ['_PRAT_NOM', '_PRAT_Q'].map(v => {
    const i = S.pr.search(new RegExp('^var ' + v + ' = ', 'm')); if (i < 0) throw new Error(v + ' introuvable');
    let d = 0, q = null, j = S.pr.indexOf('{', i);
    for (; j < S.pr.length; j++) { const ch = S.pr[j]; if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; } if (ch === "'" || ch === '"') { q = ch; continue; } if (ch === '{') d++; else if (ch === '}' && --d === 0) break; }
    return S.pr.slice(i, j + 1) + ';';
  }).join('\n');
  const code = PRELUDE + vars + '\n' + NOMS.map(n => fn(S.pr, n)).join('\n') + '\n;({ ' + NOMS.join(', ') + ', __pose })';
  return vm.runInNewContext(code, {});
}
const P0 = (o) => Object.assign({ actif: { r: true, b: true, o: false },
  r: { egr: ['egr'], mpf: ['non'], ext: ['pig', 'rem'], sai: ['non'], pre: ['apres'], ml: ['fut'] },
  b: { arr: ['direct'], deb: ['stat'], ntu: ['oui'], fa: ['fut', 'cuve'], ml: ['fait'], lies: ['lies'], rep: { deb_h: 24, ntu_min: 200, ntu_max: 300 } },
  o: { met: ['direct'], deb: ['stat'], ml: ['bloq'] }, conf: {} }, o || {});
const cuve = (o) => Object.assign({ id: 'c1', nom: 'Cuve 1', statut: 'setup', parcelles: ['Perr'], volume_hl: 30, pressurage: { goutte_l: 2000, presse_l: 380 } }, o || {});
const noms = (l) => l.map(x => x[0]).join(' > ');

const T = {
  // A — les blocages
  A1: ['débourber : possible au pressé (setup, mpf), refusé dès que la cuve fermente, est pressurée ou partie au Chai', (A) =>
    A._debBloque(cuve()) === null && A._debBloque(cuve({ statut: 'mpf' })) === null && /fermente déjà/.test(A._debBloque(cuve({ statut: 'fa' })) || '')
    && /pressurée/.test(A._debBloque(cuve({ statut: 'decuvage' })) || '') && /au Chai/.test(A._debBloque(cuve({ statut: 'termine', decuvage: { date: '2026-09-15' } })) || '')],
  A2: ['le soutirage : la fin ne précède pas le début', (A) => /précède/.test(A._debCheckFin(cuve({ debourbage: { debut: '2026-09-14T12:00' } }), { fin: '2026-09-14T09:00', jus: 2000 }) || '')],
  A3: ['le soutirage : sans jus clair, refusé', (A) => /jus clair/.test(A._debCheckFin(cuve({ debourbage: { debut: '2026-09-14T12:00' } }), { fin: '2026-09-15T12:00', jus: null }) || '')],
  A4: ['jus clair + bourbes au-delà du jus pressé : refusé ; juste dessous : accepté', (A) => {
    const c = cuve({ debourbage: { debut: '2026-09-14T12:00' } });
    const ko = A._debCheckFin(c, { fin: '2026-09-15T12:00', jus: 2250, bourbes: 230 }), ok = A._debCheckFin(c, { fin: '2026-09-15T12:00', jus: 2150, bourbes: 230 });
    return /2 480 L/.test(ko || '') && /2 380 L de jus/.test(ko || '') && ok === null; }],
  A5: ['sans pressurage dit, le plafond est la contenance de la cuve', (A) => {
    const c = cuve({ pressurage: undefined, volume_hl: 20, debourbage: { debut: '2026-09-14T12:00' } });
    return A._debBaseL(c) === 2000 && /que la cuve contient/.test(A._debCheckFin(c, { fin: '2026-09-15T12:00', jus: 1950, bourbes: 100 }) || ''); }],
  // B — le parcours d'une cuve, sa frise
  B1: ['le parcours suit le choix de la cuve : en cuve (pas d’entonnage), en fût (entonnage avant), démarrée en cuve (après)', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const fc = noms(A._pratParcoursCuve(cuve({ fa_lieu: 'cuve' }))), ff = noms(A._pratParcoursCuve(cuve({ fa_lieu: 'fut' }))), cf = noms(A._pratParcoursCuve(cuve({ fa_lieu: 'cf' })));
    return !fc.includes('Entonnage') && ff.includes('Débourbage > Entonnage > Fermentation') && cf.includes('Fermentation > Entonnage'); }],
  B2: ['la malo de la cuve se lit dans son parcours', (A) => {
    A.__pose({ config: { pratiques: P0() } }); const m = A._pratParcoursCuve(cuve({ fa_lieu: 'cuve', malo_prevue: 'bloq' })).find(x => x[0] === 'Malo');
    return m && m[1] === 'bloquée'; }],
  B3: ['la frise se lit des faits : pressé → débourbage en cours → fini → en fermentation (cuve)', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const c = cuve({ fa_lieu: 'cuve' }), s = A._pratParcoursCuve(c);
    const e0 = A._pratAvance(c, s).join(','); c.debourbage = { debut: '2026-09-14T09:00' };
    const e1 = A._pratAvance(c, s).join(','); c.debourbage.fin = '2026-09-15T09:00'; c.statut = 'fa';
    const e2 = A._pratAvance(c, s).join(',');
    return e0 === 'fait,,,,' + (s.length > 5 ? ',' : '') && e1.startsWith('fait,cours,') && e2.startsWith('fait,fait,cours,'); }],
  B4: ['entonnée (décuvée, FA au chai) : entonnage fait, fermentation en cours, « Au Chai » fait', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const c = cuve({ fa_lieu: 'fut', statut: 'termine', debourbage: { debut: 'a', fin: 'b' }, decuvage: { date: '2026-09-15', fa_finie: false } });
    const s = A._pratParcoursCuve(c), e = A._pratAvance(c, s), i = (n) => s.findIndex(x => x[0] === n);
    return e[i('Entonnage')] === 'fait' && e[i('Fermentation')] === 'cours' && e[i('Au Chai')] === 'fait' && e[i('Malo')] === ''; }],
  B5: ['rien n’est « en cours » au-delà de la première étape pas faite', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const c = cuve({ fa_lieu: 'cuve', statut: 'fa' });   // fermentation, sans débourbage dit
    const s = A._pratParcoursCuve(c), e = A._pratAvance(c, s);
    return e[1] === '' && e.slice(2).every(x => x === ''); }],
  B6: ['l’étape dite à la fiche : « Pressé, à débourber », « Débourbage », « Fermentation » ; un rouge n’en a pas', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const c = cuve({ fa_lieu: 'cuve' }); const l0 = A._pratEtapeLbl(c); c.debourbage = { debut: 'x' }; const l1 = A._pratEtapeLbl(c);
    c.debourbage.fin = 'y'; c.statut = 'fa'; const l2 = A._pratEtapeLbl(c);
    return l0 === 'Pressé, à débourber' && l1 === 'Débourbage' && l2 === 'Fermentation' && A._pratEtapeLbl(cuve({ parcelles: ['Clos'] })) === ''; }],
  // C — le prochain geste, les repères
  C1: ['le prochain geste : débourber, soutirer, entonner — rien quand la cuve fermente', (A) => {
    A.__pose({ config: { pratiques: P0() } });
    const c = cuve(); const k0 = (A._debProchain(c) || {}).k; c.debourbage = { debut: '2026-09-14T09:00' };
    const k1 = (A._debProchain(c) || {}).k, s1 = (A._debProchain(c) || {}).s; c.debourbage.fin = 'x'; c.debourbage.suite = 'fut'; c.debourbage.jus_l = 2150;
    const k2 = (A._debProchain(c) || {}).k; c.statut = 'fa'; c.debourbage.suite = 'cuve';
    return k0 === 'debut' && k1 === 'fin' && /repère de 24/.test(s1) && k2 === 'ent' && A._debProchain(c) === null; }],
  C2: ['sans réglage, un blanc se débourbe quand même ; un rouge, jamais', (A) => {
    A.__pose({ config: {} }); return A._debPossible(cuve()) && !A._debPossible(cuve({ parcelles: ['Clos'] })); }],
  C3: ['« pas de débourbage » au réglage : le geste ne se propose pas (sauf un débourbage déjà commencé)', (A) => {
    const P = P0(); P.b.deb = ['non']; A.__pose({ config: { pratiques: P } });
    return !A._debPossible(cuve()) && A._debPossible(cuve({ debourbage: { debut: 'x' } })); }],
  C4: ['le repère de turbidité : dedans, au-dessus, au-dessous ; sans repère, rien', (A) => {
    const r = { ntu_min: 200, ntu_max: 300 };
    return A._debNtuRep(r, 220) === 'dedans' && A._debNtuRep(r, 400) === 'au-dessus' && A._debNtuRep(r, 100) === 'au-dessous' && A._debNtuRep({}, 220) === null; }],
  C5: ['un repère de turbidité à l’envers est « impossible » au réglage', (A) => {
    const P = P0(); P.b.rep = { ntu_min: 300, ntu_max: 200 };
    return A._pratAlertes(P).some(a => a.id === 'rep-ntu-b' && a.niv === 'b'); }],
  // D — le branchement
  D1: ['saveDebourber vérifie AVANT d’écrire (le début comme la fin)', (A, S) => {
    const f = fn(S.pr, 'saveDebourber');
    return avant(f, 'var bl=_debBloque(c); if(bl){', 'c.debourbage={') && avant(f, 'var err=_debCheckFin(c,f); if(err){', 'Object.assign(c.debourbage,') && f.includes('_vendGarde()'); }],
  D2: ['fermenter en cuve : statut « fa », daté de la fin du débourbage ; entonner : la feuille de décuvage en mode entonnage', (A, S) => {
    const f = fn(S.pr, 'saveDebourber'), e = fn(S.pr, '_debEntonner');
    return f.includes("c.statut='fa';") && f.includes("_vendHistPose(c,'fa',f.fin.slice(0,10));") && e.includes('openVendDecuvage(c.id, { ent:true,'); }],
  D3: ['la feuille de décuvage en mode entonnage : la fermentation finira au chai, le jus clair proposé', (A, S) => {
    const f = fn(S.cu, 'openVendDecuvage');
    return f.includes('var _ent=!!(opts&&opts.ent);') && f.includes('_vendDecFaSet(0);') && f.includes("Entonner → Le Chai"); }],
  D4: ['l’objet rebâti de la cuve garde le débourbage, le pressurage et les choix', (A, S) => {
    const f = fn(S.cu, 'saveVendCuve');
    return f.includes('debourbage:existing?(existing.debourbage||undefined):undefined') && f.includes('var _ch=_vcuvChoixPris(_coul);')
      && f.includes('obj.pressurage=_ch.pressurage||(existing&&existing.pressurage)||undefined;') && f.includes('obj.fa_lieu=') && f.includes('obj.malo_prevue='); }],
  D5: ['la frise du blanc remplace celle d’avant ; la fiche dit l’étape ; la ligne porte son étiquette de tuto', (A, S) =>
    fn(S.cu, '_vendDetailHtml').includes('h+=_pst||(_vendStepper(c)+_vendParcLigne(c));') && fn(S.cu, '_vendFicheHtml').includes('_pratEtapeLbl(c)||_vendStatLbl(c.statut)')
    && S.cu.includes('class="mvv-hd" data-tuto="cuv.ligne"')],
  D6: ['le prochain geste est dans la fiche, avec ou sans réglage', (A, S) => fn(S.pr, '_vendParcoursHtml').includes('var nx=_debProchainHtml(c);') && fn(S.pr, '_vendParcoursHtml').includes('return nx;')],
  D7: ['la frontière : _vendFmlVin et _vendHistPose sur window ; les gestes exposés', (A, S) =>
    /^window\._vendFmlVin = _vendFmlVin;$/m.test(S.cu) && /^window\._vendHistPose = _vendHistPose;$/m.test(S.cu)
    && ['openDebourber', '_debMeth', '_debSuite', 'saveDebourber', '_vcuvFaLieu', '_vcuvMaloSet'].every(n => new RegExp('^window\\.' + n + '\\s*=\\s*' + n + ';', 'm').test(S.pr))],
  D8: ['le pressurage tapé survit au redessin de la fenêtre de la cuve', (A, S) => {
    const f = fn(S.pr, '_vcuvCoulRendre'); return f.includes("var _g=(document.getElementById('vcuv-goutte')||{}).value") && f.includes('if(g&&_g!=null) g.value=_g;'); }],
  // E — le réglage
  E1: ['les repères se règlent sous le débourbage, et se relisent sans redessiner', (A, S) =>
    fn(S.pr, '_pratRendre').includes('_pratRepHtml(P,c,adm)') && fn(S.pr, '_pratRendre').includes('_pratRepBind(P, c);') && !/_pratRendre\(/.test(fn(S.pr, '_pratRepBind'))],
  // F — l'accompagnement
  F1: ['l’aide, le guide et « Quoi de neuf » (11.44) le disent', (A, S) => {
    const i = S.wn.indexOf("{ v: '11.44'"), b = i < 0 ? '' : S.wn.slice(i, S.wn.indexOf('] },', i));
    return S.utils.includes("['Une cuve de blanc',") && S.g08.includes('<b>prochain geste</b>') && b.includes('PRATIQUES-2') && b.includes('Une cuve de blanc suit son parcours'); }],
  F2: ['le tuto « débourber » : sa cuve pour lui seul, la fermentation en cuve choisie, l’état vérifié', (A, S) => {
    const i = S.tu.indexOf("{ id: 'debourber'"), b = i < 0 ? '' : S.tu.slice(i, S.tu.indexOf("\n  // ★ PHENO-1C", i));
    return ['openDebourber', 'saveDebourber', '_debSuite'].every(n => b.includes("'" + n + "'")) && b.includes('[data-tuto="deb.suite.cuve"]')
      && b.includes("c.statut === 'fa'") && S.tu.includes("String(window.__MV_TUTO || '') === 'debourber'"); }]
};

function jouer(S) {
  let A = null, err = null;
  try { A = charger(S); } catch (e) { err = e; }
  const res = {};
  for (const [k, [, f]] of Object.entries(T)) { try { res[k] = !!f(A, S); } catch (e) { res[k] = false; } }
  return { res, err };
}
const CASSES = [
  ['pr', "  if(c.statut&&c.statut!=='setup'&&c.statut!=='mpf') return", "  if(false) return", 'A1', 'une cuve qui fermente se débourbe encore'],
  ['pr', "  if(d.debut && f.fin<d.debut) return", "  if(false) return", 'A2', 'une fin avant le début acceptée'],
  ['pr', "  if(b && tot>b) return", "  if(false) return", 'A4', 'plus de jus que la cuve n’en a'],
  ['pr', "    if(lieu==='fut'&&iE===-1) s.splice(iF,0,['Entonnage','fûts du parc']);", "", 'B1', 'l’entonnage oublié d’une cuve en fût'],
  ['pr', "    if(n==='Débourbage'||n==='Flottation') return deb==='fini'?'fait':(deb==='encours'?'cours':'');", "    if(n==='Débourbage'||n==='Flottation') return 'fait';", 'B3', 'le débourbage dit fait avant d’avoir eu lieu'],
  ['pr', "    if(vu) return '';", "", 'B5', 'une étape lointaine « en cours » avant les premières'],
  ['pr', "  if(e==='fini'&&!dec&&c.statut==='setup'&&c.debourbage.suite==='fut') return", "  if(false) return", 'C1', 'le jus clair qui attend l’entonnage oublié'],
  ['pr', "  if(d && _pratHas(d.P,k,'deb','non') && !(c.debourbage&&c.debourbage.debut)) return false;", "", 'C3', '« pas de débourbage » ignoré'],
  ['pr', "    var bl=_debBloque(c); if(bl){ showToast(bl,'#B85A1A'); return; }   // ⚠ AVANT toute écriture\n", "", 'D1', 'le début écrit sans contrôle'],
  ['pr', "    _vendHistPose(c,'fa',f.fin.slice(0,10));", "", 'D2', 'la fermentation en cuve non datée'],
  ['cu', "    _vendDecFaSet(0);\n", "", 'D3', 'un entonnage qui déclare la fermentation finie'],
  ['cu', "    debourbage:existing?(existing.debourbage||undefined):undefined,", "", 'D4', 'le débourbage perdu par l’objet rebâti'],   // PRATIQUES-3 (§626) : saignee_de suit désormais
  ['pr', "  if(g&&_g!=null) g.value=_g;", "", 'D8', 'le pressurage tapé perdu au choix d’une couleur'],
  ['tu', "  if (String(window.__MV_TUTO || '') === 'debourber' && typeof window.applyFbData === 'function')", "  if (false && typeof window.applyFbData === 'function')", 'F2', 'la cuve du tuto jamais chargée']
];

const sain = jouer(SAIN);
let rouge = 0;
if (sain.err) { console.log('  \x1b[31m✗\x1b[0m chargement : ' + sain.err.message); rouge++; }
for (const [k, [lbl]] of Object.entries(T)) {
  const ok = sain.res[k]; if (!ok) rouge++;
  if (!CONTRE) console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + k + ' — ' + lbl);
}
if (!CONTRE) {
  console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' rouge(s)\x1b[0m' : '\x1b[32m✓ ' + Object.keys(T).length + ' vertes, 0 rouge\x1b[0m'));
  process.exit(rouge ? 1 : 0);
}
if (rouge) { console.log('\x1b[31m✗ le code sain n’est pas vert : contre-épreuve impossible\x1b[0m'); process.exit(1); }
let det = 0;
for (const [f, de, vers, cle, nom] of CASSES) {
  const n = SAIN[f].split(de).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ancre ' + (n ? 'non unique (' + n + ')' : 'introuvable') + ' : ' + nom); rouge++; continue; }
  const r = jouer(Object.assign({}, SAIN, { [f]: SAIN[f].replace(de, vers) }));
  const vu = r.err || !r.res[cle];
  console.log('  ' + (vu ? '\x1b[32m✓\x1b[0m DÉTECTÉ ' : '\x1b[31m✗\x1b[0m MANQUÉ  ') + ' ' + nom + ' (' + cle + ')');
  if (vu) det++; else rouge++;
}
console.log('\n' + (rouge ? '\x1b[31m✗ ' + rouge + ' contre-épreuve(s) manquée(s)\x1b[0m' : '\x1b[32m✓ ' + det + '/' + CASSES.length + ' défauts détectés\x1b[0m'));
process.exit(rouge ? 1 : 0);
