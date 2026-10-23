/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEAUJ-1 (§434) : CAVE › AUJOURD'HUI AU DESSIN DE LA MAQUETTE VALIDÉE
   Lancer :          node scripts/mv-harnais-caveauj1.mjs
   Contre-épreuves : node scripts/mv-harnais-caveauj1.mjs --contre

   POURQUOI IL EXISTE
   Le 22/10/2026, Nico valide la maquette de Cave › Aujourd'hui (« j'aime beaucoup », puis « go »), après une v2 :
   la colonne fixe de droite recouvrait le calendrier. En route, sur la démo, Cuve 5 — en macération à froid — était
   lue comme « la fermentation ralentit » et le verdict disait « 1 cuve demande un contrôle » ; le Pilotage, qui lit le
   même verdict, le répétait. Ce harnais grave :
   1. une cuve en macération ('mpf') n'est jamais une fermentation qui ralentit : _mlProjFA rend 'mpf' ;
   2. le verdict accorde le mot au contenant (cuve, cuvée) et le nombre (« sa / leur malo ») ; sa seconde ligne dit
      pourquoi, puis « Puis : … » ;
   3. des gestes, pas des lignes : _mlGestes écarte la fin de FA estimée et le démarrage ; la bande et la carte Cave
      du Pilotage comptent par lui ;
   4. une ligne par contenant : _aujGrouper réunit les gestes d'une même cuve ou cuvée, contrôle et dû en tête ;
   5. la macération plus longue que prévu (le seul calcul neuf du lot) ;
   6. « À surveiller » ne colle que par .colle (quand elle tient), et le calendrier est rendu HORS de sa zone ;
   7. les boutons du rendu viennent du jeu commun (.mvbtn) ; le bloc CSS est par jetons (aucune couleur écrite) ;
   8. il est branché dans la liste des contrôles.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures, §370).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), css: lire('src/styles.css'), pil: lire('src/pilotage.js'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }   // les replis des jetons du socle ne sont pas des couleurs écrites
function ligneVar(src, nom) { const m = src.match(new RegExp('^var ' + nom + '=.*$', 'm')); if (!m) throw new Error('var absente : ' + nom); return m[0]; }
function monter(S) {
  const code = [ligneVar(S.cave, '_ML_INFO'), ligneVar(S.cave, '_AUJ_CUVE'), ligneVar(S.cave, '_AUJ_ORD'),
    ...['_mlIso', '_mlD', '_mlAuj', '_mlAddJ', '_mlEcartJ', '_mlProjFA', '_mlVerdict', '_mlGestes', '_aujGrouper', '_aujMaceration'].map((n) => corps(S.cave, n))].join('\n');
  const stub = 'var window={};'
    + 'function _vendTriMes(c){ return (c.mesures_fa||[]).slice().sort(function(a,b){ return a.date<b.date?-1:1; }); }'
    + 'function _vendMesD20(m){ return m&&m.densite; }'
    + 'function _vendDSec(){ return 996; }'
    + 'function _vendStatDeb(c,st){ return (c.hist&&c.hist[st])||null; }'
    + 'function _mvF1(x){ return String(x); }';
  return new Function(stub + '\n' + code + '\nreturn {_mlProjFA:_mlProjFA,_mlVerdict:_mlVerdict,_mlGestes:_mlGestes,_aujGrouper:_aujGrouper,_aujMaceration:_aujMaceration};')();
}

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  let M = null;
  try { M = monter(S); } catch (e) { T('les fonctions s\u2019extraient et s\u2019ex\u00e9cutent (' + e.message + ')', false); return R; }
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  // 1. la macération
  const mes = [{ date: '2026-10-17', densite: 1096.5 }, { date: '2026-10-19', densite: 1095 }, { date: '2026-10-21', densite: 1093 }];
  essai('une cuve en mac\u00e9ration rend \u00ab mpf \u00bb, pas une fermentation qui ralentit', () => M._mlProjFA({ statut: 'mpf', date_entree: '2026-10-14', mesures_fa: mes }, '2026-10-22').etat === 'mpf');
  essai('la m\u00eame s\u00e9rie, cuve en fermentation, ralentit bien : c\u2019est le garde qui compte', () => M._mlProjFA({ statut: 'fa', date_entree: '2026-10-14', mesures_fa: mes }, '2026-10-22').etat === 'ralentit');
  // 2. le verdict
  const V = (items) => M._mlVerdict([{ items }, { items: [] }], {});
  essai('une malo bloqu\u00e9e : \u00ab 1 cuv\u00e9e demande un contr\u00f4le \u00bb, et pourquoi', () => { const v = V([{ kind: 'malo', ref: 'v1', urgence: 'due' }]); return v.t === '1 cuv\u00e9e demande un contr\u00f4le' && /^La malo ne descend plus\./.test(v.s); });
  essai('deux alertes d\u2019une m\u00eame cuve : \u00ab 1 cuve demande un contr\u00f4le \u00bb', () => { const v = V([{ kind: 'alerte', ref: 'c1' }, { kind: 'alerte', ref: 'c1' }]); return v.t === '1 cuve demande un contr\u00f4le' && /^La fermentation ralentit ou la temp\u00e9rature est haute\./.test(v.s); });
  essai('deux malos finies : \u00ab 2 cuv\u00e9es ont fini leur malo \u00bb', () => V([{ kind: 'soutirage', ref: 'a' }, { kind: 'soutirage', ref: 'b' }]).t === '2 cuv\u00e9es ont fini leur malo');
  essai('une malo finie : \u00ab 1 cuv\u00e9e a fini sa malo \u00bb', () => V([{ kind: 'soutirage', ref: 'a' }]).t === '1 cuv\u00e9e a fini sa malo');
  essai('la seconde ligne dit pourquoi, puis \u00ab Puis : \u2026 \u00bb', () => {
    const v = V([{ kind: 'mesure', ref: 'c5' }, { kind: 'mesure', ref: 'c7' }, { kind: 'ouillage', ref: 'v2', urgence: 'due' }, { kind: 'soutirage', ref: 'v1' }, { kind: 'soutirage', ref: 'v2' }]);
    return v.t === '2 cuves \u00e0 mesurer' && v.s === 'Pas de relev\u00e9 depuis hier ou avant. Puis\u00a0: 1 cuv\u00e9e \u00e0 ouiller \u00b7 2 cuv\u00e9es ont fini leur malo.';
  });
  // 3. des gestes, pas des lignes
  essai('la fin de FA estim\u00e9e et le d\u00e9marrage ne sont pas des gestes', () => M._mlGestes([{ kind: 'fa' }, { kind: 'demarrage' }, { kind: 'mesure' }, { kind: 'ouillage' }]).length === 2);
  T('la bande compte par _mlGestes, sous \u00ab \u00e0 faire cette semaine \u00bb', /var aFaire=_mlGestes\(sem\[0\]\.items\)\.length;/.test(S.cave) && /\[aFaire,'\\u00e0 faire cette semaine',aFaire>0\]/.test(S.cave));
  T('la carte Cave du Pilotage compte par window._mlGestes', /window\._mlGestes\(sem\[0\]\.items\)\.length/.test(S.pil));
  // 4. une ligne par contenant
  essai('une ligne par contenant, dans l\u2019ordre : contr\u00f4le, d\u00fb, le reste ; le geste d\u00fb en t\u00eate de sa ligne', () => {
    const G = M._aujGrouper([
      { kind: 'mesure', ref: 'c5' }, { kind: 'alerte', ref: 'c5', urgence: 'due' }, { kind: 'mesure', ref: 'c7', urgence: 'due' },
      { kind: 'soutirage', ref: 'v1' }, { kind: 'soutirage', ref: 'v2' }, { kind: 'ouillage', ref: 'v2', urgence: 'due', futs: 3 }]);
    return G.map((x) => x.k).join(' ') === 'c:c5 c:c7 v:v2 v:v1' && G[0].G.length === 2 && G[2].G.map((i) => i.kind).join(' ') === 'ouillage soutirage';
  });
  // 5. la macération plus longue que prévu
  const c = { statut: 'mpf', date_entree: '2026-10-14', mpf: { active: true, duree_j: 7 } };
  essai('mac\u00e9ration plus longue que pr\u00e9vu : 7 jours pr\u00e9vus, 8 en cuve', () => { const x = M._aujMaceration(c, '2026-10-22'); return x && x.prevu === 7 && x.jours === 8; });
  essai('rien tant que la dur\u00e9e n\u2019est pas d\u00e9pass\u00e9e, ni hors mac\u00e9ration', () => M._aujMaceration(c, '2026-10-21') === null && M._aujMaceration(Object.assign({}, c, { statut: 'fa' }), '2026-10-22') === null);
  // 6. la colonne collée ne descend pas sur le calendrier
  let ren = '', co = '';
  try { ren = corps(S.cave, '_aujRender'); co = corps(S.cave, '_aujColle'); } catch (e) { T('rendu et _aujColle pr\u00e9sents (' + e.message + ')', false); }
  const iZ = ren.indexOf('<div class="caj-zone">'), iF = ren.indexOf("</aside></div>'"), iC = ren.indexOf('_aujCal(sem,from)');
  T('le calendrier est rendu apr\u00e8s la fermeture de la zone : la colonne coll\u00e9e ne peut pas le recouvrir', iZ >= 0 && iF > iZ && iC > iF);
  const i0 = S.css.indexOf('\u2605\u2605 CAVEAUJ-1 (\u00a7434)'), i1 = S.css.indexOf('/* \u2605 FIN CAVEAUJ-1 */', i0), B = i0 < 0 || i1 < 0 ? '' : S.css.slice(i0, i1);
  const sticky = [...B.matchAll(/([^{}]*)\{[^{}]*position:sticky/g)].map((m) => m[1].trim());
  T('\u00ab \u00c0 surveiller \u00bb ne colle que par .colle, jamais sans condition', sticky.length === 1 && /\.caj-dr\.colle$/.test(sticky[0]));
  T('_aujColle pose .colle seulement si la colonne tient dans l\u2019\u00e9cran, sur ordinateur', /classList\.toggle\('colle',window\.innerWidth>=1024&&\(dr\.offsetHeight\+h\+40\)<=window\.innerHeight\)/.test(co));
  T('renderCaveAujourdhui appelle _aujColle apr\u00e8s le rendu', /_aujRender\(\);\s*\n\s*_aujColle\(\);/.test(S.cave));
  // 7. jeu commun, jetons
  let rendu = '';
  try { rendu = ['_aujLigne', '_aujEquipe', '_aujVeille', '_aujCal', '_aujRender'].map((n) => corps(S.cave, n)).join('\n'); } catch (e) { rendu = ''; }
  const btns = [...rendu.matchAll(/<button\b[^>]*?class="([^"]*)"/g)].map((m) => m[1]);
  T('chaque bouton du rendu vient du jeu commun (.mvbtn) \u2014 ' + btns.length + ' boutons', btns.length >= 6 && btns.every((k) => /^mvbtn(\s|$)/.test(k)));
  T('les cartes et la pastille du verdict viennent du jeu commun (.mvcarte, .mvpas)', (rendu.match(/<section class="mvcarte caj-c /g) || []).length === 3 && /class="mvpas mvpas-statut '\+/.test(rendu));
  T('le bloc CAVEAUJ-1 est pos\u00e9, par jetons : aucune couleur \u00e9crite', B.length > 4000 && !/#[0-9A-Fa-f]{3,8}\b/.test(sansVar(B)) && !/rgba?\(/.test(sansVar(B)));
  // 8. branché
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-caveauj1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-caveauj1.mjs --contre'],"));
  return R;
}

const MUT = [
  ['le garde de la mac\u00e9ration retir\u00e9', (S) => ({ ...S, cave: S.cave.replace("if(c.statut==='mpf') return {etat:'mpf'", "if(false) return {etat:'mpf'") })],
  ['\u00ab ont fini sa malo \u00bb revenu', (S) => ({ ...S, cave: S.cave.replace("'s ont fini leur malo'", "'s ont fini sa malo'") })],
  ['la malo bloqu\u00e9e redevient \u00ab cuve \u00bb', (S) => ({ ...S, cave: S.cave.replace(":nV+' cuv\\u00e9e'+(nV>1?'s demandent':' demande'))", ":nV+' cuve'+(nV>1?'s demandent':' demande'))") })],
  ['la fin de FA estim\u00e9e recompt\u00e9e comme un geste', (S) => ({ ...S, cave: S.cave.replace('var _ML_INFO={fa:1, demarrage:1};', 'var _ML_INFO={demarrage:1};') })],
  ['une ligne par geste (regroupement cass\u00e9)', (S) => ({ ...S, cave: S.cave.replace("k=(cuve?'c:':'v:')+(it.ref||it.titre);", "k=(cuve?'c:':'v:')+(it.ref||it.titre)+it.kind;") })],
  ['la colonne coll\u00e9e sans condition', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-dr.colle{ position:sticky;', '#page-cave .caj-dr{ position:sticky;') })],
  ['le calendrier rentr\u00e9 dans la zone', (S) => ({ ...S, cave: S.cave.replace("'</aside></div>'\n    +_aujCal(sem,from);", "_aujCal(sem,from)+'</aside></div>';") })],
  ['un bouton hors du jeu commun', (S) => ({ ...S, cave: S.cave.replace('class="mvbtn mvbtn-secondaire caj-b"', 'class="caj-b"') })],
  ['une carte maison au lieu de .mvcarte', (S) => ({ ...S, cave: S.cave.replace('<section class="mvcarte caj-c caj-hero"', '<section class="caj-c caj-hero"') })],
  ['une couleur \u00e9crite dans le bloc', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-ico.due{ background:var(--danger-doux);', '#page-cave .caj-ico.due{ background:#FAEAE8;') })],
];

console.log('\n\u2500\u2500 CAVEAUJ-1 : Cave \u203a Aujourd\u2019hui au dessin de la maquette\n');
const res = verifier(S0); let ko = 0;
for (const [nom, ok] of res) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + nom); if (!ok) ko++; }
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions');
if (CONTRE) {
  let rate = 0;
  console.log('\n\u2500\u2500 Contre-\u00e9preuves : chaque mutation doit rougir');
  for (const [nom, f] of MUT) {
    const S = f(S0), meme = S.cave === S0.cave && S.css === S0.css;
    const rouge = verifier(S).some(([, ok]) => !ok);
    console.log((rouge && !meme ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom + (meme ? ' (MOTIF ABSENT)' : ''));
    if (!rouge || meme) rate++;
  }
  console.log('\n' + (rate ? 'ROUGE \u2014 ' + rate + ' contre-\u00e9preuve(s) sans effet' : 'VERT \u2014 ' + MUT.length + ' contre-\u00e9preuves rougissent'));
  process.exit(ko || rate ? 1 : 0);
}
process.exit(ko ? 1 : 0);
