// HARNAIS — AUJ-4 (§263) : la bascule Terrain / Économie du cockpit d'Aujourd'hui.
//   node scripts/mv-harnais-auj4.mjs           → doit être vert
//   node scripts/mv-harnais-auj4.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
function monde(S) {
  const appels = { eco: 0, repeint: 0 };
  const els = {};
  const vues = [{ v: 'terrain', hidden: false }, { v: 'eco', hidden: true }].map(o => ({ hidden: o.hidden, getAttribute: () => o.v }));
  const bts = ['terrain', 'eco'].map(v => { const b = { a: {}, getAttribute: k => k === 'data-vue' ? v : b.a[k], setAttribute: (k, x) => { b.a[k] = x; } }; return b; });
  const corps = { firstChild: null, set innerHTML(h) { this._h = h; this.firstChild = h ? {} : null; }, get innerHTML() { return this._h || ''; } };
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvInfoBtn = k => '';
  ctx._pilTabEco = d => { appels.eco++; return '<div class="pec">ECO</div>'; };
  ctx._mvGraphRepeindre = () => { appels.repeint++; };
  ctx.document = { querySelectorAll: s => s === '.ck-vue' ? vues : s === '#ck-bascule button' ? bts : [], getElementById: id => id === 'ck-eco-corps' ? corps : null };
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  return { W: ctx, appels, vues, bts, corps };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const M = monde(S), W = M.W;
  const o = { d: { totalReste: 10 }, m: {}, hero: '<div class="pil-hero">H</div>', inaction: '<div class="pil-inaction">I</div>',
    kpis: '<div class="pil-ck">K</div><div class="pil-ck bud">B</div>', budget: '<div class="pil-ck bud">B</div>', journal: [], montrer: { resume: true } };
  const avec = W._ckAuj(Object.assign({ eco: true }, o));
  const terrain = avec.slice(avec.indexOf('data-vue="terrain"'), avec.indexOf('data-vue="eco"', avec.indexOf('class="ck-vue"') + 1));
  T('la bascule est là, Terrain sélectionné, la vue Économie cachée', avec.includes('id="ck-bascule"') && avec.includes('data-vue="terrain" aria-selected="true" onclick="_ckVue(this.getAttribute(\'data-vue\'))"')
    && /class="ck-vue" data-vue="eco" hidden/.test(avec));
  T('le coût de l\u2019inaction et le budget quittent le terrain pour la vue Économie', !terrain.includes('pil-inaction') && !terrain.includes('bud') && terrain.includes('pil-hero')
    && avec.lastIndexOf('pil-inaction') > avec.indexOf('data-vue="eco"') && avec.lastIndexOf('bud') > avec.indexOf('data-vue="eco"'));
  T('la vue Économie ne se calcule pas tant qu\u2019on reste sur le terrain', M.appels.eco === 0 && avec.includes('<div id="ck-eco-corps"></div>'));
  W._ckVue('eco');
  T('basculer : la vue Économie se montre, se remplit de l\u2019onglet Économie tel quel, les graphes se repeignent',
    M.vues[1].hidden === false && M.vues[0].hidden === true && M.corps.innerHTML === '<div class="pec">ECO</div>' && M.appels.eco === 1 && M.appels.repeint === 1
    && M.bts[1].a['aria-selected'] === 'true');
  W._ckVue('terrain'); W._ckVue('eco');
  T('revenir ne recalcule pas ce qui est déjà dessiné', M.appels.eco === 1);
  const resteEco = W._ckAuj(Object.assign({ eco: true }, o));
  T('tant qu\u2019on reste en Économie, chaque dessin la reprend (le direct suit)', M.appels.eco === 2 && resteEco.includes('ECO') && /data-vue="terrain" hidden/.test(resteEco));
  W._ckVue('terrain');
  const sans = W._ckAuj(Object.assign({ eco: false }, o));
  T('vue Économie masquée : pas de bascule, le coût de l\u2019inaction et le budget restent sur le terrain', !sans.includes('ck-bascule') && sans.includes('pil-inaction') && sans.includes('bud'));
  const P = S.pil;
  T('pilotage.js expose l\u2019onglet Économie tel quel et passe la tuile Budget à part',
    P.includes('window._pilTabEco=function(d){ return _pilTabEco(d); };') && P.includes('var _ckBud=kpis.slice(_ckB0);') && P.includes("budget:_ckBud, eco:_pilShow('auj_eco'),") && P.includes("['auj_eco',"));
  // REF-1 (§266) : la feuille de cet ancien cockpit est remplacée par celle de la maquette validée, passée à la charte.
  T('l\u2019ancienne feuille a laissé la place à celle de la maquette (REF-1)', S.css.includes('★★★ REF-1 (§266) — LE COCKPIT D\'AUJOURD\'HUI : LA FEUILLE DE LA MAQUETTE VALIDÉE') && !S.css.includes('AUJ-4 (§263) — LA BASCULE'));
  T('la nouveauté d\u2019AUJ-4 reste au Journal (8.35, pastille sur la bascule)', /\{ v: '8\.35', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-bascule'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le budget laissé aussi sur le terrain', 'ck', "(eco && o.budget && o.kpis) ? String(o.kpis).replace(o.budget, '') :", "(eco && o.budget && o.kpis) ? String(o.kpis) :"],
    ['l\u2019inaction laissée aussi sur le terrain', 'ck', "+ (!eco && o.inaction ? ", "+ (o.inaction ? "],
    ['la vue Économie calculée à chaque dessin, même cachée', 'ck', "if(vueEco && typeof window._pilTabEco === 'function'){", "if(typeof window._pilTabEco === 'function'){"],
    ['l\u2019onglet recalculé à chaque bascule', 'ck', "if(_CK.vue === 'eco' && h && !h.firstChild && typeof window._pilTabEco === 'function'){", "if(_CK.vue === 'eco' && h && typeof window._pilTabEco === 'function'){"],
    ['les graphes pas repeints à la bascule', 'ck', "  if(typeof window._mvGraphRepeindre === 'function') window._mvGraphRepeindre();\n};", "};"],
    ['vue masquée : les indicateurs perdus', 'ck', "String(o.kpis).replace(o.budget, '') : (o.kpis || '');", "String(o.kpis).replace(o.budget, '') : '';"],
    ['la tuile Budget pas passée à part', 'pil', "budget:_ckBud, eco:_pilShow('auj_eco'),", "eco:_pilShow('auj_eco'),"],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
