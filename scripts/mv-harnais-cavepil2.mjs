/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEPIL-2 (§437) : LES SIGNES DE DÉGUSTATION SUR LES FÛTS (vue Cave du Pilotage)
   Lancer :          node scripts/mv-harnais-cavepil2.mjs
   Contre-épreuves : node scripts/mv-harnais-cavepil2.mjs --contre

   POURQUOI IL EXISTE
   Nico (23/10) : « à l'entonnage, je mets le fournisseur, l'année et la référence du fût — on peut mettre le sigle fleur,
   piqué ou oxydé sur un fût » ; maquette validée (« go »). Ce harnais grave _caveSignesFuts (cave.js, fonction pure) :
   1. chaque ligne d'entonnage (tonnelier, année, référence) garde le signe de SA dernière dégustation ; une plus récente
      qui ne le note plus l'efface ;
   2. « Volatile » → piqué, « Oxydatif » → oxydé, « Fleur en surface » → fleur ; le rond montre le plus grave (piqué, oxydé,
      fleur), la bulle les dit tous ;
   3. une ligne de plusieurs fûts porte le signe sur UN seul rond, avec le repère noté ;
   4. une dégustation de toute la cuvée donne un signe de cuvée, jamais posé sur un rond ;
   5. une autre cuvée, un fût qui n'existe plus, une donnée mal formée : ignorés ;
   6. un rond par fût (la somme des nb) ; la mise en forme du Pilotage n'invente rien ; le cockpit dessine la bulle d'un fût
      et la légende seulement s'il y a un signe ; feuille par jetons, deux sombres identiques ; branché dans la liste.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), charte: lire('src/charte.css'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function bloc(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); return (i < 0 || j < 0) ? '' : src.slice(i, j + b.length); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
function monter(S) {
  const i = S.cave.indexOf('var _CAVE_SG='), j = S.cave.indexOf('\n', i);
  if (i < 0) throw new Error('table des signes absente');
  return new Function(S.cave.slice(i, j) + '\n' + corps(S.cave, '_caveSignesFuts') + '\nreturn _caveSignesFuts;')();
}
const CUV = () => ({ id: 'c1', tonneaux: [{ annee: 2025, four: 'Taransaud', ref: 'T25-013', nb: 1 }, { annee: 2025, four: 'Taransaud', ref: 'T25-015', nb: 1 }, { annee: 2023, four: 'François Frères', ref: 'FF23', nb: 4 }] });
const DG = (date, fut, sig, qui, rep) => ({ type: 'degustation', date, cuvee_id: 'c1', cuvees_ids: ['c1'], operateur: qui || 'Marie', data: { signaux: sig, fut: fut ? Object.assign({}, fut, { repere: rep || '' }) : null } });
const F13 = { annee: 2025, four: 'Taransaud', ref: 'T25-013' }, F15 = { annee: 2025, four: 'Taransaud', ref: 'T25-015' }, FF = { annee: 2023, four: 'François Frères', ref: 'FF23' };

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  let sf = null;
  try { sf = monter(S); } catch (e) { T('la fonction s\u2019extrait (' + e.message + ')', false); return R; }
  essai('un rond par fût : la somme des nb des lignes d’entonnage', () => sf(CUV(), []).futs.length === 6);
  essai('la fleur notée sur T25-013 se pose sur son rond, avec la date et qui a goûté', () => { const r = sf(CUV(), [DG('2026-10-20', F13, ['fleur'])]).futs; return r[0].sg === 'fleur' && r[0].d === '2026-10-20' && r[0].qui === 'Marie' && r[1].sg === ''; });
  essai('une dégustation plus récente du même fût qui ne la note plus l’efface', () => { const r = sf(CUV(), [DG('2026-10-20', F13, ['fleur']), DG('2026-10-22', F13, ['fruit'])]).futs; return r[0].sg === '' && !r[0].sgs.length; });
  essai('l’ordre des dégustations dans la liste ne compte pas, seule la date', () => sf(CUV(), [DG('2026-10-22', F13, ['fruit']), DG('2026-10-20', F13, ['fleur'])]).futs[0].sg === '');
  essai('Volatile devient piqué, Oxydatif oxydé ; le rond montre le plus grave, la bulle les dit tous', () => { const f = sf(CUV(), [DG('2026-10-20', F15, ['fleur', 'oxy', 'vol'])]).futs[1]; return f.sg === 'pique' && f.sgs.join() === 'pique,oxyde,fleur'; });
  essai('une ligne de quatre fûts porte le signe sur un seul rond, avec le repère noté', () => { const r = sf(CUV(), [DG('2026-10-20', FF, ['vol'], 'Marie', '3e fût du rang')]).futs.slice(2); return r[0].sg === 'pique' && r[0].rep === '3e fût du rang' && r[0].nb === 4 && r.slice(1).every((x) => x.sg === ''); });
  essai('une dégustation de toute la cuvée donne un signe de cuvée, jamais posé sur un rond', () => { const x = sf(CUV(), [DG('2026-10-21', null, ['oxy'], 'Jean')]); return x.cuvee && x.cuvee.sgs.join() === 'oxyde' && x.cuvee.qui === 'Jean' && x.futs.every((f) => !f.sg); });
  essai('une autre cuvée, un fût retiré, une donnée mal formée : ignorés', () => { const o = DG('2026-10-20', F13, ['fleur']); o.cuvee_id = 'c9'; o.cuvees_ids = ['c9'];
    const r = sf(CUV(), [o, DG('2026-10-20', { annee: 2020, four: 'X', ref: 'X1' }, ['vol']), { type: 'degustation', date: '2026-10-20', cuvee_id: 'c1', data: 'abc' }, null, { type: 'degustation', date: 'hier', cuvee_id: 'c1', data: { signaux: ['vol'] } }]);
    return r.futs.every((f) => !f.sg) && !r.cuvee; });
  essai('des lignes qui ne sont pas des listes ne font pas planter', () => { const r = sf({ id: 'c1', tonneaux: 'x' }, 'y'); return r.futs.length === 0 && r.cuvee === null; });
  T('la synthèse de la Cave passe les signes de chaque cuvée', S.cave.includes('signes:_caveSignesFuts(c, CAVE_ELEVAGE.operations)});'));
  T('la clé du fût est celle de la dégustation (_copDgFutKey : année, tonnelier, référence)', corps(S.cave, '_caveSignesFuts').includes("[(l&&l.annee!=null)?l.annee:'',(l&&l.four)||'',(l&&l.ref)||''].join('|')") && corps(S.cave, '_copDgFutKey').includes("[(l&&l.annee!=null)?l.annee:'',(l&&l.four)||'',(l&&l.ref)||''].join('|')"));
  T('le Pilotage met en forme sans rien recalculer, et n’invente pas de ronds (sinon le dessin d’avant)', S.pil.includes('var futsD=(sgF.length&&sgF.length===(c.futs||0))?sgF.map(') && S.pil.includes('futsD:futsD, sgRes:sgRes, sgCv:sgCv,') && !/_caveSignesFuts\(/.test(S.pil));   /* le Pilotage la nomme en commentaire, il ne l'appelle pas */
  const v = bloc(S.vue, '/* ═══ 11 bis. LA VUE CAVE', '/* ═══ 12. NAVIGATION');
  T('le cockpit dessine les trois signes, par la forme autant que la couleur', ['sg-fl-p', 'sg-pi', 'sg-ox-h'].every((k) => v.includes(k)) && v.includes("const CV_SG = { pique: ['Piqué (volatile)', 'piqué'], oxyde: ['Oxydé', 'oxydé'], fleur: ['Fleur en surface', 'fleur'] };"));
  T('la bulle d’un fût passe avant celle de la cuvée, et la légende ne paraît qu’avec un signe', S.vue.includes("ev.target.closest('#ck-cv-plan [data-fut]') || ev.target.closest('#ck-cv-plan [data-tip]')") && v.includes("C.chai.cuvees.some(c => (c.sgRes && c.sgRes.length) || c.sgCv) ? '<p class=\"cv-sg-leg\">"));
  T('toujours aucun bouton de geste dans la vue Cave', !/_mlGo|onclick|_caveQuickOp/.test(v));
  const f = bloc(S.css, '/* ══ ★★ CAVEPIL-2 (§437)', '/* ★ FIN CAVEPIL-2 */');
  T('la feuille des signes : par jetons, aucune couleur écrite, après CAVEPIL-1 et avant TETE-2', f.length > 800 && !/#[0-9a-fA-F]{3,8}\b/.test(sansVar(f)) && S.css.indexOf('/* ★ FIN CAVEPIL-1 */') < S.css.indexOf('/* ══ ★★ CAVEPIL-2 (§437)') && S.css.indexOf('/* ★ FIN CAVEPIL-2 */') < S.css.indexOf('/* ★ TETE-2 (§329)'));
  const sombres = S.charte.split('\n').filter((l) => l.includes('--sg-fleur:') && !/^:root\{/.test(l)).map((l) => l.slice(l.indexOf('{') + 1, l.lastIndexOf('}')));
  T('les jetons des signes sont dans la charte, clair et sombre — les deux sombres identiques', /:root\{--sg-fleur:/.test(S.charte) && sombres.length === 2 && sombres[0] === sombres[1]);
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-cavepil2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cavepil2.mjs --contre'],"));
  return R;
}

const MUT = [
  ['la première dégustation gagne au lieu de la dernière', (S) => ({ ...S, cave: S.cave.replace('if(!p||d>=p.d){ if(f) der[k]', 'if(!p){ if(f) der[k]') })],
  ['le moins grave passe devant', (S) => ({ ...S, cave: S.cave.replace("_CAVE_SG_ORDRE=['pique','oxyde','fleur']", "_CAVE_SG_ORDRE=['fleur','oxyde','pique']") })],
  ['tous les fûts d’une ligne portent le signe', (S) => ({ ...S, cave: S.cave.replace('var porte=s.length>0&&i===0;', 'var porte=s.length>0;') })],
  ['la dégustation de cuvée se pose sur les ronds', (S) => ({ ...S, cave: S.cave.replace("var f=(o.data.fut&&typeof o.data.fut==='object')?o.data.fut:null, k=f?cle(f):'*', p=f?der[k]:cuv;", "var f=(o.data.fut&&typeof o.data.fut==='object')?o.data.fut:{}, k=cle(f), p=der[k];") })],
  ['une autre cuvée compte', (S) => ({ ...S, cave: S.cave.replace('if(!c||!ids.some(function(x){ return String(x)===String(c.id); })) return;', 'if(!c) return;') })],
  ['le Pilotage invente des ronds', (S) => ({ ...S, pil: S.pil.replace('var futsD=(sgF.length&&sgF.length===(c.futs||0))?sgF.map(', 'var futsD=(sgF.length)?sgF.map(') })],
  ['la légende paraît toujours', (S) => ({ ...S, vue: S.vue.replace("C.chai.cuvees.some(c => (c.sgRes && c.sgRes.length) || c.sgCv) ? '<p class=\"cv-sg-leg\">", "true ? '<p class=\"cv-sg-leg\">") })],
  ['une couleur écrite dans la feuille', (S) => ({ ...S, css: S.css.replace('.ck2 .sg-pi{fill:var(--danger);stroke:none}', '.ck2 .sg-pi{fill:#C2381B;stroke:none}') })],
  ['les deux sombres divergent', (S) => ({ ...S, charte: S.charte.replace('--sg-marque:#151514;}\n#app-root[data-theme="dark"]', '--sg-marque:#000000;}\n#app-root[data-theme="dark"]') })],
];

console.log('\n\u2500\u2500 CAVEPIL-2 : les signes de dégustation sur les fûts\n');
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
