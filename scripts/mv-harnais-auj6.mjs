// HARNAIS — AUJ-6 (§308) : les dessins d'Aujourd'hui qui ne disparaissent plus, « À savoir » sous les barres collantes,
//   la pastille « Nouveau » entière, la charge restante sans traits verticaux.
//   node scripts/mv-harnais-auj6.mjs           → doit être vert
//   node scripts/mv-harnais-auj6.mjs --contre  → chaque défaut réinjecté doit rougir
// A. cockpit.js/_ckChargeSerie EXÉCUTÉ : photo sans période ou d'une autre période écartée, un jour = une valeur, un zéro
//    suivi d'un reste plus haut écarté, la vraie fin (0) gardée.
// B. pilotage.js/_pilPhotoEcrire et _pilSparkCharge EXÉCUTÉS (extraits, patron de mv-harnais-photo) : rien avant l'arrivée
//    des données ni sans travail prévu ; la petite courbe ignore zéros et autres périodes.
// C. Lu : le montage repart de zéro (G, GE, S.mode — la cause des dessins disparus, reproduite dans Chromium), l'entrée
//    isolée, la boîte vide qui se redessine, --ck-colle mesuré sous les barres, la carte « À savoir » qui ne coupe plus.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const BASE = { ck: lire('src/cockpit.js'), pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css') };

function partieA(S, T) {
  const ctx = { console, Date, Math, JSON, Intl, Number, String, Array, Object, Set, Map, isFinite, parseFloat, parseInt,
    setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => null, setItem() {} }, navigator: { onLine: true },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: () => ({ style: {} }) } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  const ph = [{ d: '2026-10-01', reste: 2357 }, { d: '2026-10-02', reste: 0 },                                   // d'avant AUJ-5 : sans période
    { d: '2026-10-06', reste: 2420, p: 'Hiver' }, { d: '2026-10-07', reste: 0, p: 'Hiver' },                      // un 0 pris avant les données
    { d: '2026-10-08', reste: 2414, p: 'Hiver' }, { d: '2026-10-08', reste: 2412, p: 'Hiver' },                   // deux valeurs le même jour
    { d: '2026-10-09', reste: 300, p: 'Vendanges' }, { d: '2026-10-10', reste: 0, p: 'Hiver' }, { d: '2026-10-11', reste: 9, p: 'Hiver' }];
  const s = ctx._ckChargeSerie(ph, { totalReste: 2405.4 }, '2026-10-10', 'Hiver'), k = s.map(x => x.iso + '=' + x.v).join(' ');
  T('A1 seules les photos sûres de la période : sans période, autre période, zéro impossible, jour même et jour à venir écartés (' + k + ')',
    k === '2026-10-06=2420 2026-10-08=2412 2026-10-10=2405');
  const s2 = ctx._ckChargeSerie(ph, { totalReste: 2405.4 }, '2026-10-10', ''), k2 = s2.map(x => x.iso).join(' ');
  T('A2 sans période connue, les photos restent, mais jamais un zéro suivi d’un reste plus haut (' + k2 + ')', k2 === '2026-10-01 2026-10-06 2026-10-08 2026-10-09 2026-10-10');
  const s3 = ctx._ckChargeSerie([{ d: '2026-10-08', reste: 12, p: 'H' }, { d: '2026-10-09', reste: 0, p: 'H' }], { totalReste: 0 }, '2026-10-10', 'H');
  T('A3 la vraie fin est gardée : un zéro que rien ne dément reste', s3.map(x => x.v).join(',') === '12,0,0');
}

function corps(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let j = src.indexOf('{', i), n = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } } throw new Error('accolades : ' + debut); }
function bloc(src) { const a = src.indexOf('var _PIL_PHOTO_MAX='), b = src.indexOf('// ★ SPARK-1 (§214) — LA CADENCE'); if (a < 0 || b < a) throw new Error('bloc PHOTO introuvable'); return src.slice(a, b); }
const RealDate = Date, FIXED = new RealDate('2026-10-10T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse;
function charger(src, o = {}) {
  const ecrits = [];
  const ctx = { Math, Object, Array, String, Number, isFinite, console, Date: FakeDate, ecrits,
    CONFIG: { photo: o.photo || [] }, SAISONS: [{ nom: 'Hiver' }], _visuSaison: () => '', getSaisonActive: () => ({ nom: 'Hiver' }),
    isAdmin: () => true, _dataReady: o.pret !== false, saveData: k => { ecrits.push(k); }, _pecData: () => ({ configured: false }) };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _pilSaison('), bloc(src)].join('\n'), ctx, { filename: 'auj6-extrait.js' });
  return ctx;
}
function partieB(S, T) {
  const d = { totalReste: 2405.4, totalTotal: 2405.4 };
  const X0 = charger(S.pil, { pret: false });
  T('B1 avant l’arrivée des données : ni photo, ni configuration enregistrée', X0._pilPhotoEcrire(d) === false && X0.ecrits.length === 0 && X0.CONFIG.photo.length === 0);
  const X1 = charger(S.pil);
  T('B2 rien de prévu dans la période (données pas encore là) : rien', X1._pilPhotoEcrire({ totalReste: 0, totalTotal: 0 }) === false && X1.ecrits.length === 0);
  T('B3 un reste illisible : rien', X1._pilPhotoEcrire({ totalReste: NaN, totalTotal: 100 }) === false && X1.ecrits.length === 0);
  T('B4 données là, travail prévu : la photo part, avec sa période', X1._pilPhotoEcrire(d) === true && X1.ecrits.length === 1 && X1.CONFIG.photo.length === 1 && X1.CONFIG.photo[0].reste === 2405 && X1.CONFIG.photo[0].p === 'Hiver');
  const iso = k => { const t = new RealDate(2026, 9, 10 - k); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
  const X2 = charger(S.pil, { photo: [{ d: iso(5), reste: 2500, p: 'Hiver' }, { d: iso(4), reste: 0, p: 'Hiver' }, { d: iso(3), reste: 300, p: 'Vendanges' }, { d: iso(2), reste: 2450 }, { d: iso(1), reste: 2440, p: 'Hiver' }] });
  const sp = X2._pilSparkCharge({ totalReste: 2420 }), pts = sp ? sp.filter(v => v != null).length : 0;
  T('B5 la petite courbe ignore le zéro, l’autre période et la photo sans période (3 points sûrs : ' + pts + ')', !!sp && pts === 3 && Math.min(...sp.filter(v => v != null)) > -5);
}

function partieC(S, T) {
  const vue = sansCom(S.vue), css = S.css;
  T('C1 le montage repart de zéro : cadres des graphes, bascule et filtre (la cause des dessins disparus)', vue.includes("G.c = null; G.w = 0; GE.c = null; GE.w = 0; GE.fait = GE.dep = GE.att = null; S.mode = 'terrain'; S.filtre = null;"));
  T('C2 l’entrée isole chaque mise à jour et montre la page avant les compteurs', vue.includes(".forEach(f => { try { f(); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/entree'); } });")
    && vue.includes("if (reduit()) { $('#ck-page').classList.remove('ck-entree'); fin(); return; }"));
  T('C3 une boîte cachée le dit, une boîte vide se redessine (charge restante et Économie)', vue.includes('if (box.offsetParent === null) { G.w = 0; return; }') && vue.includes('if (box.offsetParent === null) { GE.w = 0; return; }')
    && (vue.match(/box\.querySelector\('svg'\)\)\) return;/g) || []).length === 2);
  T('C4 les graphes ne visent jamais une boîte pas dessinée', vue.includes("if (!c || !$('#ck-c-ligne')) return;") && vue.includes("if (!c || !$('#ck-e-fait')) return;"));
  T('C5 « À savoir » colle sous les barres collantes du Pilotage, à leur hauteur mesurée', vue.includes("pg.style.setProperty('--ck-colle', colleHaut() + 'px');")
    && vue.includes("$$('#page-pilotage .mod-header, #page-pilotage .pil-portee, #page-pilotage .pil-tabsbar')"));   // COLLE-1 (§412) : le bandeau compris
  T('C6 la carte « À savoir » ne coupe plus (la pastille « Nouveau » dépasse de 8 px) : seule sa liste défile',
    css.includes('#ck-savoir{display:flex;flex-direction:column;max-height:calc(100dvh - var(--ck-colle,16px) - 24px);overflow:visible}') && css.includes('#ck-savoir>#ck-sv-l{flex:0 1 auto;min-height:0;overflow-y:auto;'));
  T('C7 la charge restante est une ligne : plus de ronds par photo', !vue.includes('ck-c-mes') && !css.includes('.ck-c-mes'));
  T('C8 une ligne de « À savoir » passe à la ligne au lieu d’être coupée', css.includes('.ck2 .ck-sv-h{flex-wrap:wrap;row-gap:0}'));
}

async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const [lib, f] of [['A', () => partieA(S, T)], ['B', () => partieB(S, T)], ['C', () => partieC(S, T)]]) {
    try { await f(); } catch (e) { T(lib + ' a planté : ' + e.message, false); }
  }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('contre-épreuve introuvable ou multiple : ' + a.slice(0, 60)); return s.replace(a, b); };
if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert  ' : '  ROUGE ') + n); });
  console.log(ko ? `AUJ-6 : ${ko} ROUGE(S) sur ${res.length}` : `AUJ-6 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['une photo sans période revient', S => ({ ...S, ck: remp(S.ck, 'if(per && x.p !== per) return;', 'if(per && x.p && x.p !== per) return;') })],
    ['un zéro impossible revient', S => ({ ...S, ck: remp(S.ck, 'if(!(s[i].v > 0) && s.slice(i + 1).some(function(o){ return o.v > 0; })) s.splice(i, 1);', '') })],
    ['deux valeurs le même jour', S => ({ ...S, ck: remp(S.ck, 'parJour[x.d] = x.reste;', "parJour[x.d + ' ' + Math.random()] = x.reste;") })],
    ['la photo part avant l’arrivée des données', S => ({ ...S, pil: remp(S.pil, 'if(!window._dataReady||', 'if(') })],
    ['une période sans travail prévu est photographiée', S => ({ ...S, pil: remp(S.pil, '!(Number(d.totalTotal)>0)||', '') })],
    ['la petite courbe reprend les zéros', S => ({ ...S, pil: remp(S.pil, "x.reste>0&&(!per||x.p===per)", 'true') })],
    ['le montage garde les cadres d’avant', S => ({ ...S, vue: remp(S.vue, "G.c = null; G.w = 0; GE.c = null; GE.w = 0; GE.fait = GE.dep = GE.att = null; S.mode = 'terrain'; S.filtre = null;", '') })],
    ['une mise à jour qui lève arrête de nouveau l’entrée', S => ({ ...S, vue: remp(S.vue, ".forEach(f => { try { f(); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'cockpit-vue.js/entree'); } });", '.forEach(f => f());') })],
    ['la boîte cachée se croit de nouveau dessinée', S => ({ ...S, vue: remp(S.vue, 'if (box.offsetParent === null) { G.w = 0; return; }', 'if (box.offsetParent === null) return;') })],
    ['« À savoir » recolle à 16 px', S => ({ ...S, vue: remp(S.vue, "  pg.style.setProperty('--ck-colle', colleHaut() + 'px');   // AUJ-6\n", '') })],
    ['la carte « À savoir » coupe de nouveau', S => ({ ...S, css: remp(S.css, 'max-height:calc(100dvh - var(--ck-colle,16px) - 24px);overflow:visible}', 'max-height:calc(100dvh - var(--ck-colle,16px) - 24px);overflow:auto}') })],
    ['les ronds reviennent', S => ({ ...S, vue: remp(S.vue, '<path id="ck-c-ligne" class="ck-c-ligne"/><circle id="ck-c-pt"', '<path id="ck-c-ligne" class="ck-c-ligne"/><g id="ck-c-mes" class="ck-c-mes"></g><circle id="ck-c-pt"') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `AUJ-6 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `AUJ-6 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
