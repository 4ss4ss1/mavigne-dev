#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS ANN-1 (§225) — LES QUATRE NIVEAUX DES NOUVEAUTÉS
   Lancer :  node scripts/mv-harnais-annonces.mjs            (scénarios)
             node scripts/mv-harnais-annonces.mjs --contre   (contre-épreuves)
   Le bloc ANN-1 est extrait de src/utils.js avec les VRAIES fonctions qu'il appelle
   (_cmpVer, _whatsNewSince, _wnRow, _escHtml, _escAttr, canSeePilotage, _mvPrepOn,
   checkWhatsNew, dismissWhatsNew). Un faux document compte ce qui s'affiche, un faux
   localStorage ce qui se lit et s'écrit ; l'horloge est figée (_mvAujIso).
   Prouvé, sur un journal d'essai : rien à la première installation ; la carte « À
   vérifier » pour les seules personnes visées, jusqu'à « Vu » ; la grande fenêtre une
   fois tous les 30 jours, trois nouveautés au plus, jamais une version future ni une
   trop vieille ; la pastille posée sur sa cible, retirée au premier usage ou au bout de
   15 jours ; rien en préparation GUERETTECH, pas même une lecture du stockage ; le
   Journal range par mois, dans l'ordre des niveaux, titres échappés. Puis le VRAI
   journal : le bloc de tête dit à l'administrateur et à l'ouvrier ce qu'il doit dire.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CONTRE = process.argv.includes('--contre');
const U = readFileSync('src/utils.js', 'utf8');

function corps(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); }
  }
  throw new Error('accolades : ' + debut);
}
function blocAnn(src) {
  const a = src.indexOf('var _MV_ANN_MAJ_JOURS'), b = src.indexOf('let _whatsNewShown = false;');
  if (a < 0 || b < a) throw new Error('bloc ANN-1 introuvable');
  return src.slice(a, b);
}
function journalReel(src) {
  const i = src.indexOf('export const WHATS_NEW = [');
  const j = src.indexOf('\n];', i) + 3;
  return vm.runInNewContext(src.slice(i, j).replace('export const WHATS_NEW =', 'var WN =') + '\nWN;');
}
const APP_REEL = (U.match(/export const APP_VERSION = '([^']+)'/) || [])[1];

/* ── Un faux document, juste ce que le bloc touche ─────────────────────── */
function El(tag, id) {
  this.tagName = tag; this.id = id || ''; this.children = []; this.attrs = {}; this.style = {};
  this._html = ''; this.className = ''; this.textContent = ''; this.parent = null;
  const s = new Set();
  this.classList = { contains: c => s.has(c), add: c => s.add(c), remove: c => s.delete(c) };
}
Object.defineProperty(El.prototype, 'innerHTML', {
  get() { return this._html; }, set(h) { this._html = String(h); this.children = []; } });
El.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
El.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
El.prototype.hasAttribute = function (k) { return k in this.attrs; };
El.prototype.appendChild = function (c) { c.parent = this; this.children.push(c); return c; };
El.prototype.remove = function () {
  if (this.parent) { const p = this.parent; p.children = p.children.filter(x => x !== this); this.parent = null; } };
function correspond(el, sel) {
  sel = sel.trim();
  if (sel[0] === '#') return el.id === sel.slice(1);
  let m = sel.match(/^\[([\w-]+)\]$/);
  if (m) return el.hasAttribute(m[1]);
  m = sel.match(/^\.([\w-]+)(?:\[([\w-]+)\])?$/);
  if (m) return (' ' + el.className + ' ').includes(' ' + m[1] + ' ') && (!m[2] || el.hasAttribute(m[2]));
  return false;
}
El.prototype.matches = function (sel) { return sel.split(',').some(s => correspond(this, s)); };
El.prototype.closest = function (sel) { let e = this; while (e) { if (e.matches(sel)) return e; e = e.parent; } return null; };
function tous(racines) { const out = []; (function va(l) { l.forEach(e => { out.push(e); va(e.children); }); })(racines); return out; }
El.prototype.querySelector = function (sel) {
  const t = tous(this.children).find(e => e.matches(sel));
  if (t) return t;
  const m = sel.match(/^\.([\w-]+)$/);    // un contenu posé en innerHTML : on le lit dans le texte
  return (m && new RegExp('class="[^"]*\\b' + m[1] + '\\b').test(this._html)) ? new El('div') : null;
};
// ⚠️ Un observateur PAR contexte : un compteur partagé entre scénarios lisait celui du
//   scénario suivant (rouge vécu à l'écriture : le test avait tort, pas le code).
function fauxObs(liste) {
  return function (fn) {
    const o = { fn, actif: false, observe() { this.actif = true; }, disconnect() { this.actif = false; } };
    liste.push(o);
    return o;
  };
}

const IDS = ['home-annonce', 'info-inner', 'wn-items', 'wn-title', 'wn-version-badge', 'ovWhatsNew', 'ovInfo',
  'cible-1', 'cible-cave', 'cible-old', 'regl-nouv-row'];

function charger(o) {
  const src = o.src || U;
  const reg = {};
  IDS.forEach(id => { reg[id] = new El('div', id); });
  const doc = {
    body: new El('body'),
    getElementById: id => reg[id] || null,
    querySelector: sel => (sel[0] === '#' ? (reg[sel.slice(1)] || null) : (tous(Object.values(reg)).find(e => e.matches(sel)) || null)),
    querySelectorAll: sel => tous(Object.values(reg)).filter(e => e.matches(sel)),
    createElement: tag => new El(tag),
    addEventListener: (type, fn) => { if (type === 'click') doc._clic = fn; },
  };
  const store = o.store || new Map();
  const ls = { n: 0,
    getItem: k => { ls.n++; return store.has(k) ? store.get(k) : null; },
    setItem: (k, v) => { ls.n++; store.set(k, String(v)); },
    removeItem: k => { store.delete(k); } };
  const ouverts = [], raf = [], obs = [];
  const ctx = {
    Math, JSON, Object, Array, String, Number, Date, parseInt, isFinite, console,
    document: doc, localStorage: ls, MutationObserver: fauxObs(obs),
    requestAnimationFrame: f => { raf.push(f); return raf.length; },
    setTimeout: f => { f(); return 1; },
    APP_VERSION: o.app || '9.05', WHATS_NEW: o.wn || FIX,
    _mvIcon: n => '<svg data-ic="' + n + '"></svg>', _wnIco: v => String(v),
    currentUser: o.user, TENANT_ID: 'domaine-essai',
    _canModule: m => (o.mods ? o.mods.indexOf(m) >= 0 : true),
    _mvAvale: () => {},
    openOv: id => { ouverts.push(id); if (reg[id]) reg[id].classList.add('open'); },
    closeOv: (e, id) => { if (reg[id]) reg[id].classList.remove('open'); },
    getComputedStyle: () => ({ position: 'static' }),
    __auj: o.auj || '2026-10-03',
  };
  ctx.window = ctx;
  ctx._mvAujIso = () => ctx.__auj;
  vm.createContext(ctx);
  const code = [
    corps(src, 'function _cmpVer('), corps(src, 'function _whatsNewSince('), corps(src, 'function _wnRow('),
    corps(src, 'function _escHtml('), corps(src, 'function _escAttr('),
    corps(src, 'export function canSeePilotage(').replace('export ', ''),
    corps(src, 'export function _mvPrepOn(').replace('export ', ''),
    blocAnn(src), 'var _whatsNewShown = false;',
    corps(src, 'export function checkWhatsNew(').replace('export ', ''),
    corps(src, 'export function dismissWhatsNew(').replace('export ', ''),
  ].join('\n');
  vm.runInContext(code, ctx, { filename: 'ann-extrait.js' });
  Object.assign(ctx, { __reg: reg, __doc: doc, __ls: ls, __store: store, __ouverts: ouverts, __raf: raf, __obs: obs });
  return ctx;
}
const vider = X => { while (X.__raf.length) X.__raf.shift()(); };
const vus = X => JSON.parse(X.__store.get('mavigne_ann_vus_domaine-essai_' + ((X.currentUser && X.currentUser.nom) || 'anon')) || '[]');
const pastilles = (X, id) => X.__reg[id].children.filter(e => e.className === 'mvn-nouv').length;
function cliquer(X, attrs, opts) {
  const e = (opts && opts.el) || new El('button');
  Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
  if (opts && opts.parent) e.parent = opts.parent;
  let arrete = false;
  X.__doc._clic({ target: e, preventDefault() {}, stopPropagation() { arrete = true; } });
  return arrete;
}

/* ── Le journal d'essai (APP 9.05, aujourd'hui 3 octobre 2026) ─────────── */
const FIX = [
  { v: '9.06', d: '2026-10-04', items: [{ niv: 3, pour: ['tous'], emoji: 'x', titre: 'Future', desc: 'f' }] },
  { v: '9.05', d: '2026-10-03', items: [
    { niv: 3, pour: ['tous'], emoji: 'x', titre: 'Maj A', desc: 'a' },
    { niv: 2, pour: ['admin'], emoji: 'x', titre: 'Imp admin', desc: 'b' },
    { niv: 1, pour: ['tous'], cible: '#cible-1', emoji: 'x', titre: 'Nouv 1', desc: 'c' },
    { niv: 0, pour: ['tous'], emoji: 'x', titre: 'Corr <b> & co', desc: 'd' },
    { niv: 1, pour: ['tous'], emoji: 'x', titre: 'Nouv 2', desc: 'e' },
    { niv: 1, pour: ['tous'], emoji: 'x', titre: 'Nouv 3', desc: 'e' }] },
  { v: '9.04', d: '2026-10-01', items: [
    { niv: 3, pour: ['tous'], emoji: 'x', titre: 'Maj B', desc: 'g' },
    { niv: 3, pour: ['tous'], emoji: 'x', titre: 'Maj C', desc: 'h' },
    { niv: 3, pour: ['tous'], emoji: 'x', titre: 'Maj D', desc: 'i' },
    { niv: 2, pour: ['salaries'], emoji: 'x', titre: 'Imp salariés', desc: 'j' },
    { niv: 1, pour: ['cave'], cible: '#cible-cave', emoji: 'x', titre: 'Nouv cave', desc: 'k' },
    { niv: 1, pour: ['tous'], emoji: 'x', titre: 'Nouv 4', desc: 'l' }] },
  { v: '9.03', d: '2026-07-01', items: [
    { niv: 3, pour: ['tous'], emoji: 'x', titre: 'Maj vieille', desc: 'm' },
    { niv: 2, pour: ['tous'], emoji: 'x', titre: 'Imp vieille', desc: 'n' },
    { niv: 1, pour: ['tous'], cible: '#cible-old', emoji: 'x', titre: 'Nouv vieille', desc: 'o' }] },
  { v: '9.02', items: [{ emoji: 'x', titre: 'Ancien', desc: 'p' }] },
  { v: '9.01', items: [] },
];
const ADMIN = { nom: 'Paul', roles: ['admin', 'ouvrier', 'tractoriste'] };
const OUVRIER = { nom: 'Lucas', roles: ['ouvrier'] };
const vuDepuis = v => new Map([['mavigne_last_seen_version', v]]);

function scenarios(src, journal) {
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => {
    if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); }
    else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); }
  };
  try {
    // 1. Première installation : aucun récapitulatif, à aucun niveau.
    const X1 = charger({ src, user: ADMIN }); X1.checkWhatsNew(); vider(X1);
    t('première installation : ni carte, ni pastille, ni fenêtre', X1.__reg['home-annonce'].style.display === 'none'
      && pastilles(X1, 'cible-1') === 0 && X1.__ouverts.length === 0, JSON.stringify(X1.__ouverts));
    t('… la base et la dernière version vue sont posées sur la version installée',
      X1.__store.get('mavigne_ann_base_domaine-essai_Paul') === '"9.05"' && X1.__store.get('mavigne_last_seen_version') === '9.05');

    // 2. Un administrateur qui avait vu la 9.01.
    const S2 = vuDepuis('9.01');
    const X2 = charger({ src, user: ADMIN, store: S2 }); X2.checkWhatsNew(); vider(X2);
    const carte = X2.__reg['home-annonce'].innerHTML;
    t('admin : la carte dit le plus récent « à vérifier » qui le vise, sur 2', X2.__reg['home-annonce'].style.display === ''
      && carte.includes('Imp admin') && carte.includes('À vérifier, 1 sur 2') && !carte.includes('Imp vieille'), carte.slice(0, 220));
    const fen = X2.__reg['wn-items'].innerHTML;
    t('admin : la grande fenêtre s’ouvre une fois, avec trois nouveautés au plus, les plus récentes',
      X2.__ouverts.filter(x => x === 'ovWhatsNew').length === 1 && fen.includes('Maj A') && fen.includes('Maj B') && fen.includes('Maj C')
      && !fen.includes('Maj D'), X2.__ouverts.join(','));
    t('… jamais une version au-delà de l’installée, ni une trop vieille', !fen.includes('Future') && !fen.includes('Maj vieille'));
    t('… le titre et le compte du reste sont justes', X2.__reg['wn-title'].textContent === 'Les grandes nouveautés'
      && fen.includes('Et 13 autres changements'), X2.__reg['wn-title'].textContent);
    t('… les trois sont notées vues, et la date de la fenêtre aussi',
      ['9.05#0', '9.04#0', '9.04#1'].every(id => vus(X2).includes(id)) && S2.get('mavigne_ann_fenetre_domaine-essai_Paul') === '"2026-10-03"');
    t('admin : une pastille sur chaque cible encore fraîche, aucune sur la vieille',
      pastilles(X2, 'cible-1') === 1 && pastilles(X2, 'cible-cave') === 1 && pastilles(X2, 'cible-old') === 0);
    t('… l’observateur ne tourne que tant qu’il y a une pastille à poser', X2.__obs.length === 1 && X2.__obs[0].actif === true);

    // 3. Le lendemain : pas de nouvelle fenêtre (30 jours), la carte reste.
    const X3 = charger({ src, user: ADMIN, store: S2, auj: '2026-10-04' }); X3.checkWhatsNew(); vider(X3);
    t('le lendemain : pas de fenêtre, la carte attend toujours', X3.__ouverts.length === 0 && X3.__reg['home-annonce'].innerHTML.includes('Imp admin'));

    // 4. « Vu » sur la carte.
    const arr = cliquer(X3, { 'data-ann-vu': '9.05#1' });
    const c4 = X3.__reg['home-annonce'].innerHTML;
    t('« Vu » range l’item : la carte passe au suivant, sans « 1 sur »', arr && c4.includes('Imp salariés') && !c4.includes('Imp admin')
      && !c4.includes('1 sur') && vus(X3).includes('9.05#1'), c4.slice(0, 200));

    // 5. Trente et un jours plus tard : la fenêtre revient, pour ce qui n'a pas été montré.
    const X5 = charger({ src, user: ADMIN, store: S2, auj: '2026-11-03' }); X5.checkWhatsNew(); vider(X5);
    const f5 = X5.__reg['wn-items'].innerHTML;
    t('31 jours après : la fenêtre ne montre que la grande nouveauté pas encore vue', X5.__ouverts.includes('ovWhatsNew')
      && f5.includes('Maj D') && !f5.includes('Maj A') && X5.__reg['wn-title'].textContent === 'Une grande nouveauté', f5.slice(0, 160));
    t('… les pastilles de plus de 15 jours sont tombées', pastilles(X5, 'cible-1') === 0 && pastilles(X5, 'cible-cave') === 0);

    // 6. Un ouvrier, sans la Cave.
    const X6 = charger({ src, user: OUVRIER, store: vuDepuis('9.01'), mods: ['vigne', 'tracteur', 'phyto'] }); X6.checkWhatsNew(); vider(X6);
    const c6 = X6.__reg['home-annonce'].innerHTML;
    t('ouvrier : la carte ne dit que ce qui vise les salariés', c6.includes('Imp salariés') && !c6.includes('Imp admin') && !c6.includes('1 sur'), c6.slice(0, 200));
    t('ouvrier : pas de pastille sur un module qu’il ne voit pas', pastilles(X6, 'cible-1') === 1 && pastilles(X6, 'cible-cave') === 0);

    // 7. Un saisonnier seul : rien de ce qui vise l'admin ou les salariés.
    const X7 = charger({ src, user: { nom: 'Ana', roles: ['saisonnier'] }, store: vuDepuis('9.01') }); X7.checkWhatsNew(); vider(X7);
    t('saisonnier : pas de carte', X7.__reg['home-annonce'].style.display === 'none');

    // 8. Le Pilotage exige le droit de le voir.
    const Xp = charger({ src, user: OUVRIER, mods: ['pilotage'] });
    const Xa = charger({ src, user: ADMIN });
    const Xpi = charger({ src, user: { nom: 'Pia', roles: ['pilotage'] } });
    t('« pour : pilotage » : jamais un ouvrier, toujours l’admin et le rôle pilotage',
      Xp._mvAnnPourMoi({ pour: ['pilotage'] }) === false && Xa._mvAnnPourMoi({ pour: ['pilotage'] }) === true
      && Xpi._mvAnnPourMoi({ pour: ['pilotage'] }) === true);

    // 9. Le premier usage de l'élément range la pastille.
    const enfant = new El('span'); enfant.parent = X2.__reg['cible-1'];
    const arr9 = cliquer(X2, {}, { el: enfant }); vider(X2);
    t('premier usage de la cible : la pastille s’en va, sans bloquer le geste', !arr9 && vus(X2).includes('9.05#2') && pastilles(X2, 'cible-1') === 0);

    // 10. Toucher la pastille ouvre sa fiche, pas l'écran visé.
    const badge = X2.__reg['cible-cave'].children.find(e => e.className === 'mvn-nouv');
    const arr10 = badge ? cliquer(X2, {}, { el: badge }) : false; vider(X2);
    t('toucher la pastille : sa fiche s’ouvre, l’écran visé ne s’ouvre pas, elle est vue', arr10 && X2.__ouverts.includes('ovInfo')
      && X2.__reg['info-inner'].innerHTML.includes('Nouv cave') && vus(X2).includes('9.04#4') && pastilles(X2, 'cible-cave') === 0);
    t('… une fois toutes les pastilles vues, l’observateur se débranche', X2.__obs.length === 1 && X2.__obs[0].actif === false);

    // 11. Préparation GUERETTECH : rien, pas même une lecture du stockage.
    const X11 = charger({ src, user: { nom: 'GT', roles: ['admin'], _isPrep: true }, store: vuDepuis('9.01') }); X11.checkWhatsNew(); vider(X11);
    t('préparation GUERETTECH : rien ne s’affiche et le stockage n’est pas lu', X11.__ls.n === 0 && X11.__ouverts.length === 0
      && X11.__reg['home-annonce'].style.display !== '', 'lectures : ' + X11.__ls.n);

    // 12. Le Journal.
    const XJ = charger({ src, user: ADMIN, store: vuDepuis('9.01') }); XJ.checkWhatsNew(); vider(XJ);
    XJ.openNouvJournal();
    let J = XJ.__reg['info-inner'].innerHTML;
    const io = s => J.indexOf(s);
    t('Journal : les mois du plus récent au plus ancien, puis les versions précédentes',
      io('Octobre 2026') >= 0 && io('Octobre 2026') < io('Juillet 2026') && io('Juillet 2026') < io('Versions précédentes (1)'), J.slice(0, 200));
    t('… dans un mois : grandes nouveautés, puis à vérifier, puis nouveau, puis corrections',
      io('mvn-tag-maj') < io('mvn-tag-imp') && io('mvn-tag-imp') < io('mvn-liste-hd') && io('mvn-liste-hd') < io('1 correction'));
    t('… quatre nouveautés visibles, la cinquième repliée (« Voir l’autre »)', J.includes('Voir l’autre') && !J.includes('Nouv 4'));
    t('… ni version future, ni la grande fenêtre restée ouverte', !J.includes('Future') && !XJ.__reg.ovWhatsNew.classList.contains('open'));
    cliquer(XJ, { 'data-ann-plier': '2026-10-c' }); J = XJ.__reg['info-inner'].innerHTML;
    t('… les corrections dépliées, titre échappé', J.includes('Corr &lt;b&gt; &amp; co') && !J.includes('Corr <b>'));
    const nImp = (J.match(/mvn-tag-imp/g) || []).length;
    cliquer(XJ, { 'data-ann-vu': '9.04#3' }, { parent: XJ.__reg['info-inner'] }); J = XJ.__reg['info-inner'].innerHTML;
    t('… « Vu » dans le Journal : l’item passe à « Vu », le Journal reste ouvert',
      (J.match(/mvn-tag-imp/g) || []).length === nImp - 1 && J.includes('mvn-tag-vu') && J.includes('mvn-j'));
  } catch (e) { ko++; if (journal) console.log('  \x1b[31m✗ PLANTAGE\x1b[0m ' + (e && e.stack || e)); }

  // 13. Le VRAI journal : le bloc de tête, joué tel qu'il sera livré.
  try {
    const WN = journalReel(src), tete = WN[0], prec = WN[1] && WN[1].v;
    const items = (tete.items || []).map((it, k) => ({ it, k }));
    const pour = (it, r) => !it.pour || it.pour.includes('tous') || (it.pour.includes('admin') && r.includes('admin'))
      || (it.pour.includes('salaries') && (r.includes('ouvrier') || r.includes('tractoriste')));
    const imp = r => items.find(x => x.it.niv === 2 && pour(x.it, r));
    const maj = r => items.filter(x => x.it.niv === 3 && pour(x.it, r));
    const nouv = r => items.filter(x => x.it.niv === 1 && x.it.cible && pour(x.it, r));
    for (const [qui, u] of [['administrateur', ADMIN], ['ouvrier', OUVRIER]]) {
      const XR = charger({ src, user: u, wn: WN, app: APP_REEL, store: vuDepuis(prec), auj: tete.d || '2026-10-03' });
      (nouv(u.roles).map(x => x.it.cible.replace(/^#/, ''))).forEach(id => { if (!XR.__reg[id]) XR.__reg[id] = new El('div', id); });
      XR.checkWhatsNew(); vider(XR);
      const c = XR.__reg['home-annonce'], att = imp(u.roles);
      t('journal réel ' + tete.v + ', ' + qui + ' : la carte ' + (att ? 'dit « ' + att.it.titre.slice(0, 40) + '… »' : 'reste cachée'),
        att ? c.innerHTML.includes(XR._escHtml(att.it.titre)) : c.style.display === 'none', c.innerHTML.slice(0, 160));
      t('journal réel ' + tete.v + ', ' + qui + ' : ' + (maj(u.roles).length ? 'la grande fenêtre s’ouvre' : 'pas de grande fenêtre'),
        maj(u.roles).length ? XR.__ouverts.includes('ovWhatsNew') : !XR.__ouverts.includes('ovWhatsNew'));
      t('journal réel ' + tete.v + ', ' + qui + ' : ' + nouv(u.roles).length + ' pastille(s) posée(s)',
        nouv(u.roles).every(x => pastilles(XR, x.it.cible.replace(/^#/, '')) === 1));
    }
  } catch (e) { ko++; if (journal) console.log('  \x1b[31m✗ PLANTAGE (journal réel)\x1b[0m ' + (e && e.stack || e)); }
  return { ok, ko };
}

if (!CONTRE) {
  console.log('\n── ANN-1 — LES QUATRE NIVEAUX DES NOUVEAUTÉS (src/utils.js)\n');
  const r = scenarios(U, true);
  console.log('\n  ' + (r.ko ? '\x1b[31m' + r.ko + ' rouge(s)\x1b[0m' : '\x1b[32m' + r.ok + ' verts\x1b[0m') + '\n');
  process.exit(r.ko ? 1 : 0);
}

/* ── Contre-épreuves : chaque défaut réinjecté dans une copie doit rougir ── */
const INJ = [
  ['le filtre « pour qui » retiré', 'return _mvAnnPourMoi(a.it);\n  }).sort', 'return true;\n  }).sort'],
  ['la base ignorée (récapitulatif à la première installation)',
    'if (_cmpVer(a.v, base) <= 0 || _cmpVer(a.v, APP_VERSION) > 0) return false;', 'if (_cmpVer(a.v, APP_VERSION) > 0) return false;'],
  ['« Vu » oublié', 'if (a.niv !== niv || vus.indexOf(a.id) >= 0) return false;', 'if (a.niv !== niv) return false;'],
  ['l’âge ignoré', '    if (a.d && _mvAnnJours(a.d, auj) > age) return false;\n', ''],
  ['la cadence de 30 jours retirée', 'if (der && _mvAnnJours(der, auj) < _MV_ANN_MAJ_JOURS) return;', ''],
  ['plus de trois grandes nouveautés', 'var _MV_ANN_MAJ_MAX   = 3;', 'var _MV_ANN_MAJ_MAX   = 9;'],
  ['la garde de préparation retirée', 'if (_mvPrepOn()) return;   // PREP-1', ';   // PREP-1'],
  ['le titre d’une correction non échappé', "'<li>' + _escHtml(a.it.titre) + '</li>'", "'<li>' + a.it.titre + '</li>'"],
  ['la pastille qui ne bloque plus l’écran visé', 'e.preventDefault();\n    e.stopPropagation();\n    var j', 'e.preventDefault();\n    var j'],
];
console.log('\n── ANN-1 — CONTRE-ÉPREUVES\n');
let echecs = 0;
for (const [nom, de, vers] of INJ) {
  if (!U.includes(de)) { echecs++; console.log('  \x1b[31m!! INJECTION MORTE\x1b[0m — ' + nom); continue; }
  const r = scenarios(U.replace(de, vers), false);
  if (r.ko > 0) console.log('  \x1b[32m✓\x1b[0m ' + nom + ' → ' + r.ko + ' rouge(s)');
  else { echecs++; console.log('  \x1b[31m✗\x1b[0m ' + nom + ' → AUCUN rouge : le harnais ne voit pas ce défaut'); }
}
console.log('\n  ' + (echecs ? '\x1b[31m' + echecs + ' contre-épreuve(s) muette(s)\x1b[0m' : '\x1b[32m' + INJ.length + '/' + INJ.length + ' contre-épreuves rougissent\x1b[0m') + '\n');
process.exit(echecs ? 1 : 0);
