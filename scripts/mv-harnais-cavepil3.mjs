/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEPIL-3 (§457) : LE CHAI NE DESSINE QUE CE QUI DEMANDE UN GESTE (vue Cave du Pilotage)
   Lancer :          node scripts/mv-harnais-cavepil3.mjs
   Contre-épreuves : node scripts/mv-harnais-cavepil3.mjs --contre

   POURQUOI IL EXISTE
   Nico (25/10) : « les fûts à jour, verts, prennent de la place pour pas grand-chose » ; maquette validée (« parfait »), avec
   la recommandation : les cuvées en cours aussi. Ce harnais monte le vrai cvPlan (cockpit-vue.js) sur un modèle de Chai et grave :
   1. les cuvées en alerte ou à faire gardent un rond par fût ; aucune cuvée en cours ou à jour n'est dessinée hors de sa rangée ;
   2. la rangée « À jour » : son nombre, ses fûts, le prochain ouillage (le plus proche, deux noms au plus, aucun nom pour une
      seule cuvée), « Tout est à jour » seulement quand rien d'autre n'est au Chai ; la rangée « En cours » compte malos et FA ;
   3. un fût marqué d'une cuvée rangée garde son rond (et lui seul) sous la rangée, avec sa référence ;
   4. la légende garde ses chiffres ; le HTML ne dépend pas de l'état déplié (cvFiltrer pose la classe, sans redessiner) ;
   5. le dépliage : le bouton de la rangée et l'état choisi dans la légende ; pas de bulle sur une rangée dépliée ;
   6. le modèle porte le prochain ouillage de l'agenda de la Cave et la phase (FA ou malo) ; la feuille par jetons, entre
      CAVEPIL-2 et AUJ-TETE-1 ; l'aide, le guide, la bulle « i » et les nouveautés le disent ; branché dans la liste.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures, npm run test:gabarit).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { vue: lire('src/cockpit-vue.js'), pil: lire('src/pilotage.js'), cave: lire('src/cave.js'), css: lire('src/styles.css'), utils: lire('src/utils.js'),
  guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function bloc(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); return (i < 0 || j < 0) ? '' : src.slice(i, j + b.length); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
// Le vrai dessin du cockpit, monté dans Node : esc, btnI, entete, puis toute la section de la vue Cave jusqu'à cvPlan.
function monter(S, etat) {
  const v = S.vue, ligne = (re) => { const m = v.match(re); if (!m) throw new Error('ligne absente : ' + re); return m[0]; };
  const i = v.indexOf('const btnI = '), j = v.indexOf("'</header>';", i), a = v.indexOf('const CV_PAS = '), b = v.indexOf('\nfunction cvSemaine(');
  if (i < 0 || j < 0 || a < 0 || b < 0) throw new Error('section de la vue Cave introuvable');
  const code = ligne(/^const esc = .*$/m) + '\n' + v.slice(i, j + 12) + '\n' + v.slice(a, b) + '\nreturn cvPlan;';
  return new Function('window', 'S', code)({}, Object.assign({ cvFiltre: null, cvGrp: {} }, etat || {}));
}
const TIP = (o) => ({ t: 'x', rows: o ? [['Fûts', 'x'], ['Dernier ouillage', o]] : [['Fûts', 'x']] });
const CV = (id, nom, e, futs, x) => Object.assign({ id, nom, e, futs, hl: '10\u00a0hL', puce: e === 'ok' ? 'À jour' : (e === 'faire' ? 'À ouiller' : (e === 'alerte' ? 'Malo bloquée' : 'Fermentation')),
  s: 'malo finie', go: 'cuvee:' + id, tip: TIP(), futsD: null, sgRes: [], sgCv: null, pro: '', proTxt: '', cours: '' }, x || {});
const FD = (n, sg) => Array.from({ length: n }, (_, i) => ({ t: 'Fût · 2026', ref: 'T26-0' + (10 + i), lot: '', sg: sg[i] || '', sgs: sg[i] ? ['Fleur en surface'] : [], d: sg[i] ? '19 janv.' : '', qui: '', rep: '' }));
const MODELE = (cuvees) => ({ cuvier: { resume: '1 cuve', cuves: [{ id: 'u1', nom: 'Cuve 3', mat: 'inox', cap: 120, hl: 100, e: 'cours', puce: 'FA', v: '1007', s: '', go: 'cuve:u1', tip: TIP() }] },
  chai: { resume: 'x', cuvees }, btl: { resume: '', l: [] } });
const CHAI = () => [
  CV('a1', 'Alerte ’25', 'alerte', 5), CV('f1', 'Fixin ’25', 'faire', 3),
  CV('c1', 'Vieilles Vignes ’26', 'cours', 22, { cours: 'fa' }), CV('c2', 'Gevrey ’26', 'cours', 8, { cours: 'malo', puce: 'En cours · 1,1\u00a0g/L' }),
  CV('o1', 'Bourgogne ’25', 'ok', 8, { pro: '2026-11-04', proTxt: 'mer.\u00a04\u00a0nov.', tip: TIP('21\u00a0oct.') }),
  CV('o2', 'Gevrey VV ’26', 'ok', 14, { pro: '2026-11-04', proTxt: 'mer.\u00a04\u00a0nov.', futsD: FD(14, { 2: 'fleur', 4: 'fleur' }), sgRes: [['fleur', 'fleur', ['T26-012', 'T26-014']]] }),
  CV('o3', 'Gevrey ’25', 'ok', 24, { pro: '2026-11-06', proTxt: 'ven.\u00a06\u00a0nov.' })];
const morceaux = (h) => {
  const chai = h.slice(h.indexOf('<b>Le Chai</b>')), g0 = chai.indexOf('<div class="cv-grp ');
  const det = g0 < 0 ? chai : chai.slice(0, g0), grp = (k) => { const x = chai.indexOf('<div class="cv-grp cv-grp-' + k + '"'); if (x < 0) return null;
    const t = chai.slice(x), y = t.indexOf('<div class="cv-cuvees cv-grp-d"'), hd = t.slice(0, t.indexOf('</button>') + 9), ex = t.indexOf('<div class="cv-grp-x">');
    const fin = t.indexOf('<div class="cv-grp ', 1);   // la rangée suivante : chaque rangée s'arrête où commence l'autre
    return { hd, ex: ex >= 0 && ex < y ? t.slice(ex, y) : '', d: fin > 0 ? t.slice(y, fin) : t.slice(y) }; };
  return { det, ok: grp('ok'), cours: grp('cours') };
};
const ronds = (s) => (s.match(/class="cv-fut"/g) || []).length;
const texte = (s) => s.replace(/<[^>]+>/g, '');

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  let plan = null;
  try { plan = monter(S); } catch (e) { T('le dessin s\u2019extrait (' + e.message + ')', false); return R; }
  const H = plan(MODELE(CHAI())), M = morceaux(H);
  essai('1 ce qui demande un geste garde un rond par fût (alerte 5 + à faire 3)', () => ronds(M.det) === 8 && /cv-cuvee cv-e-alerte/.test(M.det) && /cv-cuvee cv-e-faire/.test(M.det));
  essai('1 aucune cuvée en cours ou à jour n’est dessinée hors de sa rangée', () => !/cv-cuvee cv-e-(ok|cours)/.test(M.det) && !!M.ok && !!M.cours);
  essai('2 la rangée « À jour » : 3 cuvées, 46 fûts', () => /<b>À jour<\/b><span>3\u00a0cuvées\u00a0·\u00a046\u00a0fûts<\/span>/.test(M.ok.hd));
  essai('2 le prochain ouillage est le plus proche, avec ses deux cuvées', () => texte(M.ok.hd).includes('Prochain ouillage mer.\u00a04\u00a0nov. · Bourgogne ’25 et Gevrey VV ’26'));
  essai('2 la rangée « En cours » compte malos et fermentations', () => /<b>En cours<\/b><span>2\u00a0cuvées\u00a0·\u00a030\u00a0fûts<\/span>/.test(M.cours.hd) && texte(M.cours.hd).includes('1\u00a0malo en cours · 1\u00a0fermentation à finir en fûts'));
  essai('2 les rangées sont repliées au dessin, « Tout voir », le chevron', () => /aria-expanded="false"/.test(M.ok.hd) && /<span class="cv-grp-b"><span>Tout voir<\/span>/.test(M.ok.hd) && !/cv-grp[^"]*ouvert/.test(H));
  essai('2 une seule cuvée à jour : son nom, et le prochain ouillage sans nom', () => { const m = morceaux(plan(MODELE([CHAI()[1], CHAI()[4]]))).ok; return /<span>Bourgogne ’25\u00a0·\u00a08\u00a0fûts<\/span>/.test(m.hd) && texte(m.hd).includes('Prochain ouillage mer.\u00a04\u00a0nov.') && !texte(m.hd).includes('nov. ·'); });
  essai('2 « Tout est à jour » quand rien d’autre n’est au Chai, « À jour » sinon', () => { const t = plan(MODELE(CHAI().slice(4))), u = morceaux(t).ok.hd; return /<b>Tout est à jour<\/b>/.test(u) && !/Tout est à jour/.test(H); });
  essai('2 trois cuvées le même jour : « 3 cuvées »', () => { const L = CHAI().slice(4); L[2].pro = '2026-11-04'; return texte(morceaux(plan(MODELE(L))).ok.hd).includes('nov. · 3 cuvées'); });
  essai('3 le fût marqué d’une cuvée rangée garde son rond, et lui seul, sous la rangée', () => { const x = M.ok.ex; return ronds(x) === 2 && /data-fut="co2:2"/.test(x) && /data-fut="co2:4"/.test(x) && /<b>Gevrey VV ’26<\/b> · fleur T26-012, T26-014/.test(x) && /data-cave="cuvee:o2"/.test(x); });
  essai('3 dépliée, la rangée redonne toutes les lignes et tous les fûts', () => ronds(M.ok.d) === 46 && ronds(M.cours.d) === 30);
  essai('4 la légende garde ses chiffres (cuves comprises)', () => /À jour <b>3<\/b>/.test(H) && /En cours <b>3<\/b>/.test(H) && /À faire <b>1<\/b>/.test(H) && /Alerte <b>1<\/b>/.test(H));
  essai('4 le dessin ne dépend pas de l’état déplié (cvFiltrer pose la classe)', () => monter(S, { cvGrp: { ok: true, cours: true } })(MODELE(CHAI())) === H);
  const f = corps(S.vue, 'cvFiltrer');
  T('5 cvFiltrer déplie par le bouton OU par la légende, et le dit (aria-expanded, Replier)', f.includes("$$('.cv-cuve,.cv-cuvee,.cv-grp', plan)") && f.includes('ouvert = !!((S.cvGrp && S.cvGrp[k]) || S.cvFiltre === k)')
    && f.includes("g.classList.toggle('ouvert', ouvert)") && f.includes("b.setAttribute('aria-expanded', String(ouvert))") && f.includes("t.textContent = ouvert ? 'Replier' : 'Tout voir'"));
  const gh = S.vue.indexOf("const gh = ev.target.closest('#ck-cv-plan .cv-grp-h');"), ca = S.vue.indexOf("const ca = ev.target.closest('[data-cave]');");
  T('5 le toucher de la rangée la déplie, avant la porte vers la Cave ; replier efface le filtre de son état', gh > 0 && gh < ca && S.vue.includes('if (ouvert && S.cvFiltre === k) S.cvFiltre = null; S.cvGrp[k] = !ouvert; cvCacherTip(); cvFiltrer(); return; }'));
  T('5 pas de bulle sur une rangée dépliée ; l’état de départ porte cvGrp', corps(S.vue, 'cvTip').includes("el.classList.contains('cv-grp-h') && el.getAttribute('aria-expanded') === 'true') return;") && S.vue.includes('cvFiltre: null, cvFil: false, cvGrp: {} };'));
  T('6 la Cave passe le prochain ouillage de son agenda (jour ouvré)', corps(S.cave, '_caveSynthese').includes("pro:(pro[c.id]&&pro[c.id].date)||'',"));
  T('6 le Pilotage le met en forme et dit la phase (FA ou malo), sans recalculer l’agenda', S.pil.includes("pro:c.pro||'', proTxt:c.pro?JC[dI(c.pro).getDay()]+'\\u00a0'+dC(c.pro):'', cours:e==='cours'?(m.t==='Apr\\u00e8s la FA'?'fa':'malo'):'',") && !/_mlOuillages\(/.test(corps(S.pil, '_pilCk2Cave')));
  essai('6 la date du prochain ouillage se lit « mer. 4 nov. »', () => { const c = corps(S.pil, '_pilCk2Cave'), l = (re) => (c.match(re) || [''])[0];
    const g = new Function(l(/var MC=\[.*\];/) + '\n' + l(/var dI=function.*\};/) + '\n' + l(/var dC=function.*\};/) + "\nreturn JC[dI('2026-11-04').getDay()]+'\\u00a0'+dC('2026-11-04');")(); return g === 'mer.\u00a04\u00a0nov.'; });
  const css = bloc(S.css, '/* ══ ★★ CAVEPIL-3 (§457)', '/* ★ FIN CAVEPIL-3 */'), nu = sansVar(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  T('6 la feuille : entre CAVEPIL-2 et AUJ-TETE-1, jetons seulement (ni couleur, ni taille, ni espacement écrits)', css.length > 1500 && S.css.indexOf('/* ★ FIN CAVEPIL-2 */') < S.css.indexOf('/* ══ ★★ CAVEPIL-3 (§457)') && S.css.indexOf('/* ★ FIN CAVEPIL-3 */') < S.css.indexOf('★★ AUJ-TETE-1 (§454)')
    && !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(nu) && !/font-size\s*:\s*\d/.test(nu) && !/font-weight\s*:\s*\d/.test(nu) && !/(?:padding|margin|gap)(?:-[a-z]+)?\s*:[^;}]*\b(?:[13579]|1[0-9])px/.test(nu));
  T('6 replié, la rangée cache ses lignes ; dépliée, elle cache ses fûts marqués (ils sont dans les lignes)', css.includes('.ck2 .cv-grp-d{display:none;') && css.includes('.ck2 .cv-grp.ouvert .cv-grp-d{display:flex}') && css.includes('.ck2 .cv-grp.ouvert .cv-grp-x{display:none}') && css.includes('.ck2 .cv-filtre .cv-grp:not(.vis){opacity:.25}'));
  const info = (S.vue.match(/^ {2}cvplan: '.*',$/m) || [''])[0];
  T('6 la bulle « i » dit les rangées, « Tout voir » et le fût marqué', /tiennent chacune sur une ligne/.test(info) && /« Tout voir »/.test(info) && /garde toujours son rond/.test(info) && !/chaque fût du Chai/.test(info));
  T('6 l’aide du Pilotage et le guide disent la même chose', /tiennent chacune sur une ligne/.test(S.utils) && /garde son rond même quand sa cuvée est rangée/.test(S.utils) && !/et chaque fût du Chai, de la couleur/.test(S.utils)
    && /tiennent chacune sur <b>une ligne<\/b>/.test(S.guide) && /« Tout voir »/.test(S.guide) && !/puis chaque cuvée du Chai avec un rond par fût/.test(S.guide));
  T('6 les nouveautés annoncent le changement, en tête', /export const WHATS_NEW = \[\n {2}\{ v: '10\.13', d: '2026-10-25', items: \[\n {4}\{ niv: 1, pour: \['admin'\], emoji: 'barrique', titre: 'Pilotage › vue Cave : seuls les fûts qui demandent un geste sont dessinés'/.test(S.utils));
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-cavepil3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cavepil3.mjs --contre'],"));
  return R;
}

const MUT = [
  ['les cuvées à jour sont redessinées', (S) => ({ ...S, vue: S.vue.replace("const det = C.chai.cuvees.filter(c => c.e !== 'ok' && c.e !== 'cours')", "const det = C.chai.cuvees.filter(c => true)") })],
  ['les cuvées en cours restent dessinées', (S) => ({ ...S, vue: S.vue.replace("const det = C.chai.cuvees.filter(c => c.e !== 'ok' && c.e !== 'cours')", "const det = C.chai.cuvees.filter(c => c.e !== 'ok')") })],
  ['le fût marqué perd son rond', (S) => ({ ...S, vue: S.vue.replace(".filter(x => x[0].sg).map(x => '<span class=\"cv-fw\"", ".filter(x => false).map(x => '<span class=\"cv-fw\"") })],
  ['les fûts marqués ne sont plus sous la rangée', (S) => ({ ...S, vue: S.vue.replace("+ (ex ? '<div class=\"cv-grp-x\">' + ex + '</div>' : '')", "+ ''") })],
  ['le prochain ouillage est le plus lointain', (S) => ({ ...S, vue: S.vue.replace('.sort((a, b) => a.pro < b.pro ? -1 : (a.pro > b.pro ? 1 : 0))', '.sort((a, b) => a.pro < b.pro ? 1 : (a.pro > b.pro ? -1 : 0))') })],
  ['« Tout est à jour » même quand une cuvée attend un geste', (S) => ({ ...S, vue: S.vue.replace('!det.length && !cours.length && ok.length > 1', 'ok.length > 1') })],
  ['le dessin dépend de l’état déplié', (S) => ({ ...S, vue: S.vue.replace("'<div class=\"cv-grp cv-grp-' + k + '\" data-e=\"' + k + '\">'", "'<div class=\"cv-grp cv-grp-' + k + (S.cvGrp && S.cvGrp[k] ? ' ouvert' : '') + '\" data-e=\"' + k + '\">'") })],
  ['la légende ne déplie plus la rangée', (S) => ({ ...S, vue: S.vue.replace('ouvert = !!((S.cvGrp && S.cvGrp[k]) || S.cvFiltre === k)', 'ouvert = !!(S.cvGrp && S.cvGrp[k])') })],
  ['le toucher de la rangée est oublié', (S) => ({ ...S, vue: S.vue.replace("    const gh = ev.target.closest('#ck-cv-plan .cv-grp-h');", "    const gh = null;") })],
  ['la Cave ne passe plus le prochain ouillage', (S) => ({ ...S, cave: S.cave.replace("pro:(pro[c.id]&&pro[c.id].date)||'',", "pro:'',") })],
  ['toutes les cuvées en cours se disent « malo »', (S) => ({ ...S, pil: S.pil.replace("cours:e==='cours'?(m.t==='Apr\\u00e8s la FA'?'fa':'malo'):'',", "cours:e==='cours'?'malo':'',") })],
  ['une couleur écrite dans la feuille', (S) => ({ ...S, css: S.css.replace('.ck2 .cv-grp-ic{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--ok-doux)', '.ck2 .cv-grp-ic{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#E5EFDD') })],
  ['repliée, la rangée montre ses lignes', (S) => ({ ...S, css: S.css.replace('.ck2 .cv-grp-d{display:none;', '.ck2 .cv-grp-d{display:flex;') })],
  ['l’aide décrit encore chaque fût du Chai', (S) => ({ ...S, utils: S.utils.replace('et, au Chai, un rond par fût là où les fûts demandent un geste', 'et chaque fût du Chai, de la couleur de ce qu’il demande') })],
];

console.log('\n\u2500\u2500 CAVEPIL-3 : le Chai ne dessine que ce qui demande un geste\n');
const res = verifier(S0); let ko = 0;
for (const [nom, ok] of res) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + nom); if (!ok) ko++; }
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions');
if (CONTRE) {
  let rate = 0;
  console.log('\n\u2500\u2500 Contre-\u00e9preuves : chaque mutation doit rougir');
  for (const [nom, f] of MUT) {
    const S = f(S0), meme = Object.keys(S0).every((k) => S[k] === S0[k]);
    const rouge = verifier(S).some(([, ok]) => !ok);
    console.log((rouge && !meme ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom + (meme ? ' (MOTIF ABSENT)' : ''));
    if (!rouge || meme) rate++;
  }
  console.log('\n' + (rate ? 'ROUGE \u2014 ' + rate + ' contre-\u00e9preuve(s) sans effet' : 'VERT \u2014 ' + MUT.length + ' contre-\u00e9preuves rougissent'));
  process.exit(ko || rate ? 1 : 0);
}
process.exit(ko ? 1 : 0);
