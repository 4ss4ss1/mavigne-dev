#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais MAPIED-1 (§458) : la mise à pied disciplinaire, dans le VRAI planning.js
// ═══════════════════════════════════════════════════════════════════════════
//  Nico (25/10/2026) : une absence pour motif disciplinaire, « ni payée, ni à rattraper » ; « regarde dans les lois ».
//  Accord national agricole du 23/12/1981, art. 10.4 : absence non payée → temps non récupérable (4.2), déduction sur
//  l'horaire programmé (§2). Ce que le moteur doit rendre, sur un mois d'octobre 2026 (récit à prénom fictif) :
//    · le motif existe, se choisit, journée entière seulement, et s'annonce « jamais rattrapée » ;
//    · trois jours de mise à pied (6, 7, 8) ne créent ni n'absorbent d'heure sup : 5h à 25 %, comme sans eux ; la récup,
//      les heures à rattraper et la retenue du compteur ne bougent pas ; le plafond annuel baisse de 21h ;
//    · « Pour la compta » : une ligne « Mise à pied disciplinaire — 21h à retirer, du 6 au 8 », et le salaire de base dit
//      « Aucune autre retenue » (plus « se paie en entier » à côté d'une ligne à retirer — le congé sans solde aussi) ;
//    · une absence injustifiée du même mois garde EXACTEMENT son sort d'avant (rattrapage, récup, retenue) ;
//    · le relevé imprimé : « non payée » sur les jours, un point de légende, la retenue totale ;
//    · les collègues ne reçoivent que « absent » (functions/planning-vues-calc.js).
//  Même chargement que mv-harnais-semaine (le vrai module, horloge figée au 10/11/2026). Un CRASH est ROUGE.
//  Usage :  node scripts/mv-harnais-mapied1.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');

// ── Horloge figee ───────────────────────────────────────────────────────────
const _D = Date;
class DateFigee extends _D {
  constructor(...a) { if (a.length) super(...a); else super(2026, 10, 10, 12, 0, 0); }
  static now() { return new _D(2026, 10, 10, 12, 0, 0).getTime(); }
}
globalThis.Date = DateFigee;

// ── DOM minimal ─────────────────────────────────────────────────────────────
function El() { return { id: '', innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, children: [],
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, getAttribute() { return null; }, appendChild(c) { this.children.push(c); return c; },
  insertBefore(c) { return c; }, removeChild() {}, addEventListener() {}, remove() {},
  querySelector() { return null; }, querySelectorAll() { return []; },
  getBoundingClientRect() { return { width: 700, height: 300, top: 0, left: 0 }; },
  focus() {}, click() {}, closest() { return null; } }; }
const doc = { body: El(), head: El(), documentElement: El(), getElementById() { return null; },
  querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return El(); },
  addEventListener() {}, cookie: '' };
const mem = {};
const win = { document: doc, location: { hostname: 'test', href: 'https://test/', origin: 'https://test', search: '', pathname: '/' },
  localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
    removeItem: k => { delete mem[k]; }, clear() {}, key() { return null; }, length: 0 },
  navigator: { userAgent: 'node', onLine: true, language: 'fr-FR' },
  addEventListener() {}, matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; },
  requestAnimationFrame(f) { return setTimeout(f, 0); },
  getComputedStyle() { return { getPropertyValue() { return ''; } }; },
  innerWidth: 900, innerHeight: 800, print() {}, alert() {}, confirm() { return true; }, open() { return null; },
  URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} }, Blob: function (p) { this.parts = p; } };
win.window = win; win.self = win;
globalThis.window = win; globalThis.document = doc; globalThis.location = win.location;
globalThis.localStorage = win.localStorage; globalThis.sessionStorage = win.localStorage;
globalThis.requestAnimationFrame = win.requestAnimationFrame;
globalThis.getComputedStyle = win.getComputedStyle; globalThis.matchMedia = win.matchMedia;
globalThis.Blob = win.Blob; globalThis.alert = win.alert;
try { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, configurable: true }); } catch { /* lecture seule */ }
win.fbSaveToast = () => {}; win.showToast = () => {};
const pages = [];
win.open = () => { const p = { html: '' }; pages.push(p); return { document: { write(h) { p.html += h; }, close() {} }, focus() {}, print() {} }; };
// ⚠️ SUR L'OBJET GLOBAL, PAS SEULEMENT SUR window. planning.js lit _mvISO comme un nom libre
//    (_pl2YearTabs, au chargement) : dans Node, un nom libre se cherche sur globalThis, et `win`
//    n'est pas globalThis. Premiere version : l'erreur etait avalee et journalisee a CHAQUE
//    chargement — quatorze lignes rouges « ReferenceError » dans le terminal de Nico, sur un
//    harnais entierement vert. Un bruit qui ressemble a une panne finit par cacher une panne.
win._mvISO = d => { const x = new _D(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
globalThis._mvISO = win._mvISO;


// ── Le domaine de test : 7 h du lundi au vendredi, fériés chômés ──
function modele(an) {
  const t = {};
  for (let m = 0; m < 12; m++) { t[m] = {}; const nd = new _D(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new _D(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } }
  for (const [m, d] of [[0, 1], [3, 6], [4, 1], [4, 8], [4, 14], [4, 25], [6, 14], [7, 15], [10, 1], [10, 11], [11, 25]]) t[m][d] = 0;
  return t;
}
const EXPORTS = ['_planAbsDef', '_planAbsMotifsHtml', '_planAbsEffet', '_planHsupMois', '_planBank', '_planCompteur', '_planPaieMois',
  '_planSuspH', '_planDuesMonth', '_pfCadre', '_pfJours', '_pfPaieDonnees', '_planReleveFiche_', '_planFmt', '_planEntreeProbleme'];

window.PLANNING_TEMPLATES = {}; window.PLANNING_ENTRIES = {}; window.PLANNING_HSUP = {};
window.PLANNING_ACOMPTES = {}; window.CONFIG = {}; window.MEMBRES = [];
const _U = await import(pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href);
for (const n of ['_mvIcon', '_escHtml', '_escAttr']) if (typeof _U[n] === 'function') { globalThis[n] = _U[n]; win[n] = _U[n]; }
let _n = 0;
async function charger(src) {
  const utils = pathToFileURL(path.join(RACINE, 'src', 'utils.js')).href;
  const code = src.replace("from './utils.js'", "from '" + utils + "'")
    + '\n;globalThis.__MAP={' + EXPORTS.map(n => n + ':(typeof ' + n + "==='function'?" + n + ':undefined)').join(',')
    + ',_mois:function(m){planMonth=m;}};\n';
  const f = path.join(os.tmpdir(), 'mv-mapied1-' + process.pid + '-' + (_n++) + '.mjs');
  fs.writeFileSync(f, code);
  try { await import(pathToFileURL(f).href); } finally { fs.unlinkSync(f); }
  return globalThis.__MAP;
}
const VUES = createRequire(import.meta.url)(path.join(RACINE, 'functions', 'planning-vues-calc.js'));

// ── Scénarios ───────────────────────────────────────────────────────────────
function lance(R) {
  let ok = 0, ko = 0; const echecs = [];
  const eq = (nom, obt, att, tol = 1e-6) => {
    const bon = (typeof att === 'number') ? (typeof obt === 'number' && Math.abs(obt - att) <= tol) : obt === att;
    if (bon) ok++; else { ko++; echecs.push(nom + ' — obtenu ' + JSON.stringify(obt) + ', attendu ' + JSON.stringify(att)); }
  };
  const vrai = (nom, c) => eq(nom, !!c, true);
  // ⚠️ LES OBJETS SE MODIFIENT EN PLACE (le module recopie PLANNING_ENTRIES à sa façon, cf. mv-harnais-recup).
  const vider = o => { for (const k of Object.keys(o)) delete o[k]; return o; };
  const J = { nom: 'Jean', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard' };
  const T = (d, f) => ({ timing: { debut: d, fin: f, continu: true } });
  const abs = mo => ({ absent: true, motif: mo, comment: '' });
  function domaine(jours, hsup, autres) {
    const tpl = modele(2026); tpl._timings = {};
    for (let m = 0; m < 12; m++) tpl._timings[m] = { d: '08:00' };
    const oct = { 9: T('08:00', '17:00'), 19: T('08:00', '18:00') };   // +2h le vendredi 9, +3h le lundi 19
    Object.assign(oct, jours || {});
    Object.assign(vider(window.PLANNING_TEMPLATES), { 2026: { standard: tpl } });
    Object.assign(vider(window.PLANNING_ENTRIES), { Jean: { 2026: Object.assign({ 9: oct }, autres || {}) } });
    Object.assign(vider(window.PLANNING_HSUP), hsup ? { Jean: hsup } : {});
    Object.assign(vider(window.CONFIG), { hsup_mode: 'recup', coupure_heure: '12:00' });
    window.MEMBRES.length = 0; window.MEMBRES.push(J);
  }
  const trois = mo => ({ 6: abs(mo), 7: abs(mo), 8: abs(mo) });
  const dep = v => ({ '2026-dep': { solde: v, date: '2026-01-01' } });
  const clE = (html, k) => { const m = new RegExp('<div class="pf-cl pf-cl-' + k + '[^"]*"><span class="pf-cl-l">([\\s\\S]*?)</span><span class="pf-cl-v">(?:<svg[\\s\\S]*?</svg>)?<span>([\\s\\S]*?)</span></span>(?:<p class="pf-cl-p">([\\s\\S]*?)</p>)?</div>').exec(html || ''); return m ? { l: m[1], v: m[2], p: m[3] || '' } : { l: '', v: '', p: '' }; };
  const clP = (html, k) => { const m = new RegExp('<div class="cl ' + k + '[^"]*"><span class="cl-l">([\\s\\S]*?)</span><span class="cl-v">([\\s\\S]*?)</span>(?:<p class="cl-p">([\\s\\S]*?)</p>)?</div>').exec(html || ''); return m ? { l: m[1], v: m[2], p: m[3] || '' } : { l: '', v: '', p: '' }; };
  const F = R._planFmt;
  // Le relevé s'écrit dans une fenêtre (window.open) : le socle la capture dans `pages`.
  const releve = () => { R._mois(9); const n0 = pages.length; R._planReleveFiche_('Jean', J, null); return pages.length > n0 ? pages[pages.length - 1].html : ''; };

  // 1. Le motif
  const mo = R._planAbsDef('miseapied');
  eq('1a · le motif existe sous son nom', mo.id + ' / ' + mo.nom, 'miseapied / Mise à pied disciplinaire');
  eq('1b · suspend le contrat, non payé, hors compteur, journée entière', [mo.suspend, mo.paye, mo.assim, mo.heures, mo.cpt, mo.journee, !!mo.cache].join(','), 'true,false,false,false,,true,false');
  vrai('1c · proposé dans la liste des motifs', R._planAbsMotifsHtml('', false).indexOf('data-mo="miseapied"') >= 0);
  vrai('1d · absent d’une absence sur une partie de la journée', R._planAbsMotifsHtml('', true).indexOf('data-mo="miseapied"') < 0);
  vrai('1e · l’effet annoncé : jamais rattrapée', /jamais rattrap/.test(R._planAbsEffet(mo).t));
  eq('1f · une journée « mise à pied » passe le contrôle d’écriture', R._planEntreeProbleme(abs('miseapied')), '');
  eq('1g · un collègue ne reçoit que « absent »', JSON.stringify(VUES.vueJour({ absent: true, motif: 'miseapied', comment: 'sanction' })), '{"absent":true,"motif":"autre"}');

  // 2. Le calcul : avec et sans les trois jours de mise à pied
  domaine({}, dep(10));
  const z0 = R._planHsupMois(J, 9), b0 = R._planBank(J, 9), s0 = R._planSuspH(J);
  const P0 = R._planPaieMois(J, 9), H0 = R._pfCadre(J, P0), Rv0 = releve();
  domaine(trois('miseapied'), dep(10));
  const z1 = R._planHsupMois(J, 9), b1 = R._planBank(J, 9), c1 = R._planCompteur(J, 9).rows[9] || {};
  eq('2a · les heures sup d’octobre : 5h à 25 %, comme sans la mise à pied', [z1.plus, z1.buckets.map(b => b.taux + b.nat + ':' + b.h).join(' ')].join(' / '), '5 / 25hs:5');
  eq('2b · sans elle, les mêmes 5h', z0.plus, 5);
  eq('2c · aucune heure manquée créée (ni du salarié, ni du domaine)', [z1.retire, z1.domaine, z1.indet].join('/'), '0/0/0');
  eq('2d · la récup : le même solde qu’sans la mise à pied', b1.solde, b0.solde);
  eq('2e · aucune heure à rattraper, aucune retenue au compteur', [b1.dette, c1.retenue || 0].join('/'), '0/0');
  eq('2f · aucune heure due', R._planDuesMonth(J, 9), 0);
  eq('2g · le plafond annuel baisse des 21h (rien sans elle)', [R._planSuspH(J), s0].join('/'), '21/0');
  const P1 = R._planPaieMois(J, 9), D1 = R._pfPaieDonnees(J, P1);
  eq('2h · le mois : 21h de mise à pied, rien de non payé côté salarié', [P1.neutres.miseapied, P1.nonPayees].join('/'), '21/0');
  eq('2i · la retenue totale compte la mise à pied', [D1.neutreRetireH, D1.nonPayeTotal].join('/'), '21/21');

  // 3. « Pour la compta », à l'écran
  const H1 = R._pfCadre(J, P1), mp = clE(H1, 'miseapied'), ba = clE(H1, 'base');
  eq('3a · une ligne à son nom', mp.l, 'Mise à pied disciplinaire');
  vrai('3b · ses heures à retirer : ' + F(21), mp.v.indexOf(F(21)) === 0 && /à retirer/.test(mp.v));
  vrai('3c · ses dates et sa règle : « du 6 au 8 », jamais rattrapées, heures sup dues', /3 jours, du 6 au 8\./.test(mp.p) && /jamais rattrap/.test(mp.p) && /heures sup du mois restent dues/.test(mp.p));
  eq('3d · le salaire de base : « Aucune autre retenue »', ba.v, 'Aucune autre retenue');
  vrai('3e · … et renvoie à la ligne à retirer, sans « se paie en entier »', /Rien à retirer pour les absences du salarié\./.test(ba.p) && /La mise à pied disciplinaire se retire à part, ligne dessous\./.test(ba.p) && !/se paie en entier/.test(H1));
  vrai('3f · les heures sup ne « couvrent » pas la mise à pied : elles vont en récup', /vont en récup/.test(H1) && !/couvrent les absences/.test(H1));
  vrai('3g · le jour par jour de la fiche dit « ' + F(7) + ' non payées »', (R._pfJours(J, P1) || '').indexOf(F(7) + ' non payées') >= 0);
  // Non-régression : sans absence à retirer, la ligne d'avant
  const ba0 = clE(H0, 'base');
  eq('3h · sans elle : « Aucune retenue »', ba0.v, 'Aucune retenue');
  vrai('3i · sans elle : « se paie en entier », et aucune ligne de mise à pied', /se paie en entier/.test(ba0.p) && clE(H0, 'miseapied').l === '');

  // 4. Le congé sans solde, même dessin
  domaine(trois('sansolde'), dep(10));
  const H2 = R._pfCadre(J, R._planPaieMois(J, 9)), ss = clE(H2, 'sansolde'), ba2 = clE(H2, 'base');
  vrai('4a · le congé sans solde garde sa ligne à retirer', ss.l === 'Congé sans solde' && /à retirer/.test(ss.v) && ss.p === '3 jours, du 6 au 8.');
  vrai('4b · … et le salaire de base dit « Aucune autre retenue »', ba2.v === 'Aucune autre retenue' && /Le congé sans solde se retire à part, ligne dessous\./.test(ba2.p) && !/se paie en entier/.test(H2));

  // 5. Une absence injustifiée du même mois : son sort ne change pas
  domaine({ 21: abs('injustifie') });
  const P5 = R._planPaieMois(J, 9);
  domaine(Object.assign(trois('miseapied'), { 21: abs('injustifie') }));
  const P4 = R._planPaieMois(J, 9), D4 = R._pfPaieDonnees(J, P4), H4 = R._pfCadre(J, P4), ba4 = clE(H4, 'base');
  vrai('5a · l’absence injustifiée laisse une retenue (scénario utile)', P5.nonPayees > 0.0001);
  eq('5b · sa retenue est la même avec ou sans la mise à pied', P4.nonPayees, P5.nonPayees);
  eq('5c · le salaire de base : la retenue de l’absence injustifiée', ba4.v, 'Retenue de ' + F(P4.nonPayees));
  vrai('5d · … puis la mise à pied, à part', /La mise à pied disciplinaire se retire à part, ligne dessous\./.test(ba4.p) && clE(H4, 'miseapied').v.indexOf(F(21)) === 0);
  eq('5e · la retenue totale additionne les deux', D4.nonPayeTotal, P4.nonPayees + 21);

  // 5bis. Un mois d'AVANT septembre 2026 (l'ancien cadre « Pour la paie ») : la mise à pied y est à retirer aussi.
  //   Vécu au premier passage : un remplacement trop large avait collé « _planFmtD.nonPayeTotal » dans ce cadre — seul
  //   mv-harnais-robustesse-planning l'a vu (graine 4, janvier). Ce harnais le regarde désormais lui-même.
  domaine({}, null, { 7: { 4: abs('miseapied'), 5: abs('miseapied'), 6: abs('miseapied') } });
  let H7 = '';
  try { H7 = R._pfCadre(J, R._planPaieMois(J, 7)); } catch (e) { echecs.push('5f · l’ancien cadre plante — ' + (e && e.message)); ko++; }
  vrai('5f · août 2026 (ancien cadre) : « 21h d’absence ne sont pas payées : à retirer »', H7.indexOf(F(21) + ' d’absence ne sont pas payées') >= 0);
  vrai('5g · … et la ligne « Mise à pied disciplinaire » sous « À retirer »', /<h4>À retirer<\/h4>[\s\S]*Mise à pied disciplinaire/.test(H7));
  // 6. Le relevé imprimé
  domaine(trois('miseapied'), dep(10));
  let Rv1 = '';
  try { Rv1 = releve(); } catch (e) { echecs.push('6 · le relevé plante — ' + (e && e.message)); ko++; }
  vrai('6a · « Pour la compta » du relevé : la ligne de mise à pied', clP(Rv1, 'miseapied').l === 'Mise à pied disciplinaire' && clP(Rv1, 'base').v === 'Aucune autre retenue');
  vrai('6b · les jours portent « non payée »', Rv1.indexOf('<i>non payée</i>') >= 0);
  vrai('6c · la légende explique la mise à pied', Rv1.indexOf('<li><b>Mise à pied disciplinaire</b>') >= 0);
  vrai('6d · « jamais les deux » dit l’exception', Rv1.indexOf('(un congé sans solde ou une mise à pied se retirent à part)') >= 0);
  vrai('6e · sans mise à pied, ni point de légende ni exception', Rv0.indexOf('<li><b>Mise à pied disciplinaire</b>') < 0 && Rv0.indexOf('se retirent à part)') < 0 && Rv0.length > 1000);
  return { ok, ko, echecs };
}

// ── Contre-épreuve : chaque défaut réintroduit doit faire rougir ──────────────
const DEFAUTS = [
  ['la mise à pied se reprend sur les heures sup, comme une absence injustifiée', "contrat suspendu', suspend:true,  assim:false, paye:false, heures:false, cpt:''", "contrat suspendu', suspend:true,  assim:false, paye:false, heures:false, cpt:'retire'"],
  ['la mise à pied passe pour payée', "contrat suspendu', suspend:true,  assim:false, paye:false,", "contrat suspendu', suspend:true,  assim:false, paye:true,"],
  ['les lignes à retirer à part disparaissent', 'if(!_pfNeutreRetire(t))return;', 'return;'],
  ['le salaire de base redit « Aucune retenue » à côté d’une ligne à retirer', "(NR.length?'Aucune autre retenue':'Aucune retenue')", "'Aucune retenue'"],
  ['le motif n’est plus proposé', ",'sansolde','miseapied'];", ",'sansolde'];"],
  ['la retenue totale oublie la mise à pied', 'D.nonPayeTotal=P.nonPayees+D.neutreRetireH;', 'D.nonPayeTotal=P.nonPayees;'],
  ['le relevé ne marque plus « non payée »', "if(_pfNeutreRetire(x.neutreType)){abC='non';st.push('non pay\\u00e9e');}", ''],
  ['la fiche ne dit plus « non payées » sur le jour', "if(_pfNeutreRetire(x.neutreType))obs.push(F(x.neutre)+' non pay\\u00e9es');", ''],
  ['la légende du relevé ne dit rien de la mise à pied', "'<li><b>Mise \\u00e0 pied disciplinaire</b>", "'<li><b>Autre</b>"],
];

const SRC = fs.readFileSync(path.join(RACINE, 'src', 'planning.js'), 'utf8');
let sortie = 0, res;
try { res = lance(await charger(SRC)); } catch (e) { res = { ok: 0, ko: 1, echecs: ['PLANTAGE — ' + (e && e.stack || e)] }; }
console.log('\n  MA VIGNE — Harnais MAPIED-1 (la mise à pied disciplinaire)');
console.log('  ─────────────────────────────────────────────────────────');
if (res.ko) { console.log('  ✗ ' + res.ko + ' ROUGE(S) sur ' + (res.ok + res.ko) + ' :'); res.echecs.forEach(e => console.log('    · ' + e)); sortie = 1; }
else console.log('  ✓ ' + res.ok + ' assertions vertes.');
if (CONTRE) {
  console.log('\n  CONTRE-ÉPREUVE — chaque défaut réintroduit doit faire rougir');
  let manques = 0;
  for (const [nom, de, vers] of DEFAUTS) {
    if (SRC.split(de).length !== 2) { console.log('    ?        ' + nom + ' — motif introuvable ou non unique'); manques++; continue; }
    let r;
    try { r = lance(await charger(SRC.replace(de, vers))); } catch (e) { r = { ok: 0, ko: 1 }; }
    if (r.ko > 0) console.log('    DÉTECTÉ  ' + nom + ' (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')');
    else { console.log('    MANQUÉ   ' + nom + ' — le harnais reste vert, il ne prouve rien'); manques++; }
  }
  if (manques) sortie = 1;
  console.log(manques ? '\n  ' + manques + ' défaut(s) non détecté(s).' : '\n  Les ' + DEFAUTS.length + ' défauts sont détectés.');
}
process.exit(sortie);
