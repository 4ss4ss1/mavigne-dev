#!/usr/bin/env node
// ── QDN-1 (§497) — LE GRAND PANNEAU « LA NOUVELLE MA VIGNE » ──────────────────────────────────────────────────────
//   node scripts/mv-harnais-qdn1.mjs           → les épreuves, jouées sur le VRAI bloc de src/utils.js
//   node scripts/mv-harnais-qdn1.mjs --contre  → chaque mutant du bloc doit faire rougir au moins une épreuve
// Le bloc est découpé entre ses deux marqueurs (« ════ QDN-1 (§497) » … « ════ fin QDN-1 ════ ») et exécuté dans un
// vm, avec les vraies _cmpVer et _mvEsc de utils.js et le vrai journal src/whats-new.js. Seuls les accès à la personne
// (_mvAnnPourMoi, _mvAnnLire, _mvAnnEcrire) et l'icône sont des bouchons.
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const U = fs.readFileSync(path.join(ici, '../src/utils.js'), 'utf8');
const { WHATS_NEW } = await import(pathToFileURL(path.join(ici, '../src/whats-new.js')).href);
const CONTRE = process.argv.includes('--contre');

function corps(nom) {
  const i = U.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente de utils.js : ' + nom);
  let k = U.indexOf('{', i), n = 0;
  for (; k < U.length; k++) { if (U[k] === '{') n++; else if (U[k] === '}') { n--; if (!n) break; } }
  return U.slice(i, k + 1);
}
const DEB = U.indexOf('// ════ QDN-1 (§497)'), FIN = U.indexOf('// ════ fin QDN-1 ════');
if (DEB < 0 || FIN < DEB) { console.log('\x1b[31mROUGE\x1b[0m — le bloc QDN-1 est introuvable dans src/utils.js'); process.exit(1); }
const BLOC = U.slice(DEB, FIN).replace(/^export function /gm, 'function ');
const SOCLE = corps('_cmpVer') + '\n' + corps('_mvEsc') + '\n';
const cmp = (a, b) => { const x = String(a).split('.'), y = String(b).split('.'); for (let i = 0; i < 2; i++) { const d = (+x[i] || 0) - (+y[i] || 0); if (d) return d; } return 0; };
const MODS = ['vigne', 'tracteur', 'phyto', 'cave', 'reserve', 'planning', 'pilotage'];

function contexte(bloc, roles, o = {}) {
  const ls = new Map();
  const pourMoi = (it) => {
    const p = it && it.pour;
    if (!Array.isArray(p) || !p.length) return true;
    for (const t of p) {
      if (t === 'tous') return true;
      if (t === 'admin' && roles.includes('admin')) return true;
      if (t === 'salaries' && (roles.includes('ouvrier') || roles.includes('tractoriste'))) return true;
      if (t === 'tractoriste' && roles.includes('tractoriste')) return true;
      if (MODS.includes(t) && roles.includes('admin')) return true;
    }
    return false;
  };
  const ctx = { navigator: { webdriver: !!o.webdriver }, WHATS_NEW: o.wn || WHATS_NEW, APP_VERSION: o.app || '10.48',
    _mvAnnPourMoi: pourMoi, _mvAnnLire: (k, d) => (ls.has(k) ? ls.get(k) : d), _mvAnnEcrire: (k, v) => ls.set(k, v),
    window: { currentUser: o.user || { roles }, _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>' } };
  vm.createContext(ctx);
  vm.runInContext(SOCLE + bloc + '\nthis.API = { _qdnRoles, _qdnPour, _qdnRecap, _qdnAMontrer, _qdnHtml, QDN_CHAPITRES, QDN_THEMES, QDN_LIVRETS };', ctx);
  return { X: ctx.API, ls };
}

function epreuves(bloc) {
  const err = [];
  let n = 0;
  const ok = (c, m) => { n++; if (!c) err.push(m); };
  const html = (h, ou) => {
    ok(!/undefined|NaN/.test(h), ou + ' : « undefined » ou « NaN » dans le HTML');
    for (const t of ['div', 'button', 'ul', 'ol', 'li', 'details', 'summary', 'span', 'p', 'nav', 'svg']) {
      const a = (h.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length, f = (h.match(new RegExp('</' + t + '>', 'g')) || []).length;
      ok(a === f, ou + ' : <' + t + '> ouvertes ' + a + ', fermées ' + f);
    }
    ok(h.split('<button').slice(1).every((b) => !b.split('</button>')[0].includes('<div')), ou + ' : un <div> dans un <button>');
  };
  try {
    // 1. La liste complète : toutes les versions parues après la base, chaque amélioration dans un seul thème.
    const { X } = contexte(bloc, ['admin']);
    const rec = X._qdnRecap('8.41');
    const att = WHATS_NEW.filter((b) => cmp(b.v, '8.41') > 0);
    ok(rec.versions === att.length, 'versions comptées ' + rec.versions + ', attendu ' + att.length);
    ok(rec.total === att.reduce((s, b) => s + b.items.length, 0), 'améliorations comptées');
    ok(rec.groupes.reduce((s, g) => s + g.items.length, 0) === rec.n, 'chaque amélioration dans un seul thème');
    ok(rec.groupes.every((g) => X.QDN_THEMES.some((t) => t[0] === g.code)), 'des thèmes connus seulement');
    // 2. Les chapitres de chaque rôle.
    const chap = (roles) => { const { X: Y } = contexte(bloc, roles); const R = Y._qdnRoles(); return Y.QDN_CHAPITRES.filter((c) => Y._qdnPour(c.pour, R)).map((c) => c.id); };
    const ca = chap(['admin']), co = chap(['ouvrier']), ct = chap(['ouvrier', 'tractoriste']);
    ok(['pilotage', 'cave', 'tracteur'].every((x) => ca.includes(x)), 'administrateur : Pilotage, cave et tracteur');
    ok(['pilotage', 'cave', 'tracteur'].every((x) => !co.includes(x)), 'ouvrier : ni Pilotage, ni cave, ni tracteur');
    ok(ct.includes('tracteur') && !ct.includes('pilotage'), 'tractoriste : le tracteur, pas le Pilotage');
    // 3. Chaque écran, pour chaque rôle : un HTML propre, et le bon livret.
    for (const roles of [['admin'], ['ouvrier'], ['ouvrier', 'tractoriste']]) {
      const { X: Y } = contexte(bloc, roles);
      const R = Y._qdnRoles();
      const ch = Y.QDN_CHAPITRES.filter((c) => Y._qdnPour(c.pour, R));
      const e = { R, ch, ecrans: ['couv', ...ch.map((c) => c.id), 'tout', 'fin'], i: 0, vus: {}, fait: {}, depuis: '8.41',
        rec: Y._qdnRecap('8.41'), livret: R.A ? Y.QDN_LIVRETS.admin : Y.QDN_LIVRETS.equipe };
      for (let i = 0; i < e.ecrans.length; i++) { e.i = i; html(Y._qdnHtml(e), roles.join('+') + ' / ' + e.ecrans[i]); }
      e.i = 0;
      ok(Y._qdnHtml(e).includes(R.A ? 'livret-nouvelle-ma-vigne-admin.pdf' : 'livret-nouvelle-ma-vigne-equipe.pdf'), roles.join('+') + ' : le livret de son édition');
    }
    // 4. Un titre du journal est échappé.
    const wn = [{ v: '99.01', d: '2026-11-01', items: [{ niv: 0, pour: ['tous'], titre: '<img src=x onerror=alert(1)>', desc: '' }] }].concat(WHATS_NEW);
    const { X: Z } = contexte(bloc, ['admin'], { wn, app: '99.01' });
    const Rz = Z._qdnRoles();
    const hz = Z._qdnHtml({ R: Rz, ch: [], ecrans: ['couv', 'tout', 'fin'], i: 1, vus: {}, fait: {}, depuis: '99.00', rec: Z._qdnRecap('99.00'), livret: Z.QDN_LIVRETS.admin });
    ok(hz.includes('&lt;img') && !hz.includes('<img src=x'), 'un titre du journal est échappé');
    // 5. Le déclenchement : une fois, pour une base ancienne, jamais en démo ni sous un contrôle automatique.
    const montre = (o, base, vue) => { const { X: W, ls } = contexte(bloc, ['admin'], o); if (vue) ls.set('qdn', 'refonte-2026'); return W._qdnAMontrer(base); };
    ok(montre({}, '8.41') === true, 'une base ancienne : la présentation s’ouvre');
    ok(montre({}, '10.48') === false, 'une base neuve (nouvel utilisateur) : rien');
    ok(montre({}, '8.41', true) === false, 'déjà vue : rien');
    ok(montre({ webdriver: true }, '8.41') === false, 'sous un contrôle automatique : rien');
    ok(montre({ user: { roles: ['admin'], _isDemo: true } }, '8.41') === false, 'en démo : rien');
    ok(montre({ app: '10.47' }, '8.41') === false, 'avant la version du panneau : rien');
  } catch (e) {
    err.push('plantage : ' + (e && e.message));
  }
  return { n, err };
}

const MUTANTS = [
  ['un titre non échappé', '_mvEsc(it.t)', '(it.t)'],
  ['tout le monde voit tout', "if (p === '*') return true;", 'return true;'],
  ['plus de garde des contrôles automatiques', "if (typeof navigator === 'undefined' || navigator.webdriver) return false;", ''],
  ['la version de base comptée', 'if (_cmpVer(b.v, depuis) <= 0) return;', 'if (_cmpVer(b.v, depuis) < 0) return;'],
];

if (!CONTRE) {
  const { n, err } = epreuves(BLOC);
  if (err.length) { err.forEach((m) => console.log('  \x1b[31m✗\x1b[0m ' + m)); console.log('\x1b[31mROUGE\x1b[0m — ' + n + ' assertions, ' + err.length + ' échec(s)'); process.exit(1); }
  console.log('\x1b[32mVERT\x1b[0m — ' + n + ' assertions, 0 échec(s)');
  process.exit(0);
}
let pris = 0;
for (const [nom, a, b] of MUTANTS) {
  if (!BLOC.includes(a)) { console.log('  \x1b[31m✗\x1b[0m mutant sans prise (texte absent du bloc) : ' + nom); continue; }
  const { err } = epreuves(BLOC.replace(a, b));
  if (err.length) { pris++; console.log('  \x1b[32m✓\x1b[0m mutant pris : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m mutant non vu : ' + nom);
}
if (pris !== MUTANTS.length) { console.log('\x1b[31mROUGE\x1b[0m — ' + pris + '/' + MUTANTS.length + ' mutants pris'); process.exit(1); }
console.log('\x1b[32mVERT\x1b[0m — ' + pris + '/' + MUTANTS.length + ' mutants pris');
process.exit(0);
