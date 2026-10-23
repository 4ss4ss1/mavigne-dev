/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEAUJ-3 (§438) : CAVE › AUJOURD’HUI, UN BOUTON FIN PAR GESTE, À DROITE DU NOM
   Lancer :          node scripts/mv-harnais-caveauj3.mjs
   Contre-épreuves : node scripts/mv-harnais-caveauj3.mjs --contre

   POURQUOI IL EXISTE
   Nico (23/10, capture de Cave › Aujourd’hui sur son téléphone) : « Les boutons ici sont beaucoup trop grossiers, c’est
   une application professionnelle ». Au téléphone, chaque geste portait un bouton de terrain (48 px) étiré sur toute la
   largeur, et la cuve qui avait une alerte ET un relevé dû portait deux « Relever » qui ne faisaient pas la même chose :
   celui de l’alerte ouvrait seulement l’onglet Cuves, celui du relevé ouvrait la fenêtre du relevé. Ce harnais grave :
   1. un bouton par geste RÉEL : l’alerte d’une cuve se contrôle par un relevé (`_AUJ_GESTE`) — alerte + relevé dû → un
      seul « Relever », qui ouvre la fenêtre du relevé ; une alerte seule aussi ; toutes les raisons restent affichées ;
   2. deux gestes différents → deux boutons et la ligne `.plus` ; un seul → pas de `.plus` ;
   3. chaque bouton de ligne est du jeu commun en taille compacte, jamais étiré ; la ligne en zones : le geste à droite du
      nom, le détail et les raisons dessous ; `.plus` : la rangée sous les raisons au téléphone ; sur ordinateur, le geste
      à droite, centré sur le nom et le détail ;
   4. la zone de toucher : 8 px au-delà du filet en haut et en bas (44 px pour un bouton de 28) ;
   5. le bas de la carte en taille bureau, « · N cuves » recollé au libellé ; « Tout voir » en compact ;
   6. il est branché dans la liste des contrôles.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures, mesure de la zone de toucher).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { cave: lire('src/cave.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function objet(src, nom) {
  const m = src.match(new RegExp('var ' + nom + '\\s*=\\s*\\{[^}]*\\};'));
  if (!m) throw new Error('variable absente : ' + nom);
  return m[0];
}
function monter(S) {
  const code = [objet(S.cave, '_AUJ_VERBE'), objet(S.cave, '_AUJ_GESTE'), corps(S.cave, '_aujMaj'), corps(S.cave, '_aujRaison'), corps(S.cave, '_aujLigne')].join('\n');
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return new Function('_escHtml', '_escAttr', '_mvIcon', '_aujMeta', '_ML_LBL', code + '\nreturn _aujLigne;')(esc, esc, () => '<svg></svg>', () => '', { so2: 'Dose de SO\u2082' });
}
const boutons = (h) => [...h.matchAll(/<button\b[^>]*?class="([^"]*)"[^>]*?onclick="([^"]*)"[^>]*>([^<]*)<\/button>/g)].map((m) => ({ cls: m[1], on: m[2], txt: m[3] }));

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  let L = null;
  try { L = monter(S); } catch (e) { T('les fonctions s\u2019extraient (' + e.message + ')', false); return R; }
  // 1. un bouton par geste réel
  const cuve = (G) => ({ k: 'c:c1', ref: 'c1', cuve: true, titre: 'Petite Chapelle + Perri\u00e8res', rang: 0, G });
  const al = { kind: 'alerte', urgence: 'due', note: '\u00e7a stagne \u2014 \u00e0 contr\u00f4ler', detail: 'sucres au labo 0,9 \u2192 0,7\u00a0g/L en 8\u00a0j', ref: 'c1' };
  const me = { kind: 'mesure', urgence: 'due', detail: 'dernier relev\u00e9 il y a 9 j', ref: 'c1' };
  essai('alerte + relev\u00e9 d\u00fb sur la m\u00eame cuve : un seul \u00ab Relever \u00bb, qui ouvre la fen\u00eatre du relev\u00e9', () => { const b = boutons(L(cuve([al, me]))); return b.length === 1 && b[0].txt === 'Relever' && b[0].on === "_mlGo('mesure','c1')"; });
  essai('les deux raisons restent affich\u00e9es', () => (L(cuve([al, me])).match(/class="caj-r /g) || []).length === 2);
  essai('une alerte seule ouvre aussi la fen\u00eatre du relev\u00e9', () => { const b = boutons(L(cuve([{ kind: 'alerte', urgence: 'warn', note: 'temp\u00e9rature haute', detail: '31 \u00b0C au dernier relev\u00e9', ref: 'c1' }]))); return b.length === 1 && b[0].txt === 'Relever' && b[0].on === "_mlGo('mesure','c1')"; });
  const iMe = S.cave.indexOf("if(kind==='mesure'){"), jMe = iMe < 0 ? -1 : S.cave.indexOf('if(kind===', iMe + 10);
  T('le geste \u00ab mesure \u00bb de _mlGo ouvre bien la fen\u00eatre du relev\u00e9', iMe > 0 && jMe > iMe && S.cave.slice(iMe, jMe).includes('openOvVendMesure(ref);'));
  // 2. plusieurs gestes
  const cuvee = (G) => ({ k: 'v:v1', ref: 'v1', cuve: false, titre: 'Fixin 1er Cru \u201925', rang: 1, G });
  const ou = { kind: 'ouillage', urgence: 'due', detail: '3 f\u00fbts \u00b7 ~21 L', ref: 'v1' }, so = { kind: 'soutirage', detail: 'malo finie, pas encore soutir\u00e9e', ref: 'v1' };
  essai('deux gestes diff\u00e9rents : deux boutons dans l\u2019ordre, et la ligne .plus', () => { const h = L(cuvee([ou, so])); const b = boutons(h); return b.length === 2 && b[0].on === "_mlGo('ouillage','v1')" && b[1].on === "_mlGo('soutirage','v1')" && /<li class="caj-l plus">/.test(h); });
  essai('un seul geste : pas de .plus', () => /<li class="caj-l">/.test(L(cuve([me]))));
  // 3. la taille et la place
  essai('chaque bouton de ligne : jeu commun, taille compacte', () => { const b = boutons(L(cuvee([ou, so]))).concat(boutons(L(cuve([al, me])))); return b.length === 3 && b.every((x) => x.cls === 'mvbtn mvbtn-secondaire mvbtn-compact caj-b'); });
  T('aucun bouton de ligne \u00e9tir\u00e9 sur la largeur', !/\.caj-acts \.mvbtn\{\s*flex:1 1 0;/.test(S.css) && S.css.includes('#page-cave .caj-b{ position:relative; flex:none; }'));
  T('la ligne en zones : le geste \u00e0 droite du nom, le d\u00e9tail et les raisons dessous sur toute la largeur',
    /#page-cave \.caj-l\{[^}]*grid-template-areas:"ico nom acts" "ico meta meta" "\. rs rs"; gap:/.test(S.css) && S.css.includes('#page-cave .caj-lc{ display:contents; }')
    && S.css.includes('#page-cave .caj-acts{ grid-area:acts;') && S.css.includes('#page-cave .caj-rs{ grid-area:rs;') && S.css.includes('#page-cave .caj-meta{ grid-area:meta;'));
  T('plusieurs gestes au t\u00e9l\u00e9phone : la rang\u00e9e sous les raisons, \u00e0 droite',
    S.css.includes('#page-cave .caj-l.plus{ grid-template-areas:"ico nom nom" "ico meta meta" ". rs rs" ". acts acts"; }') && S.css.includes('#page-cave .caj-l.plus .caj-acts{ justify-content:flex-end;'));
  const iPc = S.css.indexOf('#page-cave .caj-l, #page-cave .caj-l.plus{ grid-template-rows:none; grid-template-areas:"ico nom acts" "ico meta acts" ". rs rs"; }');
  T('sur ordinateur, le geste \u00e0 droite, centr\u00e9 sur le nom et le d\u00e9tail (dans le bloc 1024 px)', iPc > 0 && S.css.lastIndexOf('@media (min-width:1024px){', iPc) > S.css.lastIndexOf('}\n}', iPc) - 1);
  // 4. la zone de toucher
  T('la zone de toucher : 8 px au-del\u00e0 du filet en haut et en bas (44 px pour 28)', S.css.includes('#page-cave .caj-b::before{ content:""; position:absolute; inset:calc(var(--e-2,8px) * -1 - var(--bw,1px)) calc(var(--e-1,4px) * -1 - var(--bw,1px)); }'));
  // 5. le bas de la carte, « Tout voir »
  let rendu = ''; try { rendu = corps(S.cave, '_aujRender'); } catch (e) { rendu = ''; }
  T('le bas de la carte en taille bureau', rendu.includes('class="mvbtn mvbtn-principal mvbtn-bureau caj-cta"') && rendu.includes('class="mvbtn mvbtn-secondaire mvbtn-bureau caj-cta"'));
  T('au t\u00e9l\u00e9phone, les deux boutons du bas partagent la ligne quand ils tiennent', S.css.includes('#page-cave .caj-ctas .mvbtn{ flex:1 1 auto; }'));
  T('\u00ab \u00b7 N cuves \u00bb recoll\u00e9 au libell\u00e9', S.css.includes('#page-cave .caj-ctan{ margin-left:calc(var(--e-1,4px) * -1);'));
  let rec = ''; try { rec = corps(S.cave, '_aujRecentsHtml'); } catch (e) { rec = ''; }
  T('\u00ab Tout voir \u00bb en compact, comme celui de l\u2019Accueil', rec.includes('class="mvbtn mvbtn-secondaire mvbtn-compact caj-plus"'));
  // 6. branché
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-caveauj3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-caveauj3.mjs --contre'],"));
  return R;
}

const MUT = [
  ['l\u2019alerte garde son propre geste (deux \u00ab Relever \u00bb)', (S) => ({ ...S, cave: S.cave.replace("var _AUJ_GESTE={alerte:'mesure'};", 'var _AUJ_GESTE={};') })],
  ['les gestes ne sont plus d\u00e9doublonn\u00e9s', (S) => ({ ...S, cave: S.cave.replace('if(vus[k]) return; vus[k]=1; ', '') })],
  ['une raison perdue en fusionnant', (S) => ({ ...S, cave: S.cave.replace("  x.G.forEach(function(it){ h+='<span class=\"caj-r ", "  x.G.slice(0,1).forEach(function(it){ h+='<span class=\"caj-r ") })],
  ['plus de ligne .plus', (S) => ({ ...S, cave: S.cave.replace("'<li class=\"caj-l'+(B.length>1?' plus':'')+'\">", "'<li class=\"caj-l\">") })],
  ['le bouton repasse en taille terrain', (S) => ({ ...S, cave: S.cave.replace('class="mvbtn mvbtn-secondaire mvbtn-compact caj-b"', 'class="mvbtn mvbtn-secondaire caj-b"') })],
  ['le bouton de nouveau \u00e9tir\u00e9', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-b{ position:relative; flex:none; }', '#page-cave .caj-b{ position:relative; flex:1 1 0; }') })],
  ['plus de zone de toucher', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-b::before{ content:""; position:absolute; inset:calc(var(--e-2,8px) * -1 - var(--bw,1px)) calc(var(--e-1,4px) * -1 - var(--bw,1px)); }', '') })],
  ['le d\u00e9tail coinc\u00e9 sous le bouton au t\u00e9l\u00e9phone', (S) => ({ ...S, css: S.css.replace('grid-template-areas:"ico nom acts" "ico meta meta" ". rs rs"; gap:', 'grid-template-areas:"ico nom acts" "ico meta acts" ". rs rs"; gap:') })],
  ['plusieurs gestes coinc\u00e9s \u00e0 c\u00f4t\u00e9 du nom au t\u00e9l\u00e9phone', (S) => ({ ...S, css: S.css.replace('#page-cave .caj-l.plus{ grid-template-areas:"ico nom nom" "ico meta meta" ". rs rs" ". acts acts"; }', '') })],
  ['les boutons du bas en taille terrain', (S) => ({ ...S, cave: S.cave.replace('class="mvbtn mvbtn-principal mvbtn-bureau caj-cta"', 'class="mvbtn mvbtn-principal caj-cta"') })],
  ['\u00ab Tout voir \u00bb en grand', (S) => ({ ...S, cave: S.cave.replace('class="mvbtn mvbtn-secondaire mvbtn-compact caj-plus"', 'class="mvbtn mvbtn-secondaire caj-plus"') })],
  ['le harnais d\u00e9branch\u00e9', (S) => ({ ...S, liste: S.liste.replace("  ['node scripts/mv-harnais-caveauj3.mjs --contre'],\n", '') })],
];

console.log('\n\u2500\u2500 CAVEAUJ-3 : Cave \u203a Aujourd\u2019hui, un bouton fin par geste, \u00e0 droite du nom\n');
const res = verifier(S0); let ko = 0;
for (const [nom, ok] of res) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + nom); if (!ok) ko++; }
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions');
if (CONTRE) {
  let rate = 0;
  console.log('\n\u2500\u2500 Contre-\u00e9preuves : chaque mutation doit rougir');
  for (const [nom, f] of MUT) {
    const S = f(S0), meme = S.cave === S0.cave && S.css === S0.css && S.liste === S0.liste;
    const rouge = verifier(S).some(([, ok]) => !ok);
    console.log((rouge && !meme ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom + (meme ? ' (MOTIF ABSENT)' : ''));
    if (!rouge || meme) rate++;
  }
  console.log('\n' + (rate ? 'ROUGE \u2014 ' + rate + ' contre-\u00e9preuve(s) sans effet' : 'VERT \u2014 ' + MUT.length + ' contre-\u00e9preuves rougissent'));
  process.exit(ko || rate ? 1 : 0);
}
process.exit(ko ? 1 : 0);
