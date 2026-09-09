/* ───────────────────────────────────────────────────────
   HARNAIS — L'ONGLET PILOTAGE › CAVE EST RENTRÉ DANS LA CAVE (lot CAVE-3, +④)
   Lancer :          node scripts/mv-harnais-cave-mil.mjs
   Contre-épreuves : node scripts/mv-harnais-cave-mil.mjs --contre

   POURQUOI IL EXISTE
   Le Pilotage s'était construit une SECONDE cave, rangée par question
   (ce qui presse / le millésime / le parc / les courbes), sur les moteurs
   de cave.js (§94a). Chaque information avait deux adresses ; « Le
   millésime » était deux écrans. Ce lot ramène tout chez lui, supprime ce
   qui doublait, et ne laisse au Pilotage qu'une carte et un bouton.

   CE QU'IL GRAVE
   1. Le Pilotage n'a plus d'onglet Cave ni de code de cave : la clé `cav`
      survit en MIGRATION vers `auj` — un client qui l'avait mémorisée atterrit.
   2. Dans Pilotage › Aujourd'hui, une carte Cave LIT window._mlVerdict /
      _mlAgendaComplet — une seule définition, celle de cave.js — et ouvre
      la Cave sur Aujourd'hui.
   3. Le millésime a deux onglets : La ligne de vie (tuiles en tête, N-1 en
      pied) et Les courbes (_pcrbPose après la pose du HTML, famille de
      graphes oubliée dès qu'on la quitte).
   4. Le parc — part des anges, pyramide — se rend en tête de La Réserve › Fûts
      par window._caveParcHtml ; la Réserve garde état et mouvements (pas de
      double).
   5. Rien de ce qui doublait n'a survécu : ni _pcavVuePresse, ni _pcavMalo,
      ni _pcavFlux, ni _pcavRdt, ni _pcavBandeau, ni _pcavEtat, ni _pcavMouv.
   6. Les fiches suivent leurs cartes : plus aucune `pil.cav.*`, et la
      pastille « i » de _pcavCard passe par window (hors import dans cave.js).

   Méthode : structurel, lu APRÈS retrait des commentaires (§34g) ; une
   exécution pour _mlTuiles sur une chaîne fictive.
   ─────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const CAVE = readFileSync('src/cave.js', 'utf8');
const PIL  = readFileSync('src/pilotage.js', 'utf8');
const RSV  = readFileSync('src/reserve.js', 'utf8');
const UT   = readFileSync('src/utils.js', 'utf8');
const HTML = readFileSync('index.html', 'utf8');
const CSS  = readFileSync('src/styles.css', 'utf8');

const nu = s => s
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
const CAVENU = nu(CAVE), PILNU = nu(PIL), RSVNU = nu(RSV), UTNU = nu(UT);
const HTMLNU = HTML.replace(/<!--[\s\S]*?-->/g, '');

let vert = 0, total = 0;
const rouges = [];
function pose(ok, nom, detail) {
  total++;
  if (ok) { vert++; console.log('   \u2713 ' + nom); }
  else { rouges.push(nom); console.log('   \u2717 ' + nom + (detail ? '\n      \u2192 ' + detail : '')); }
}
function extraire(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) return null;
  let i = src.indexOf('{', m.index), d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  return null;
}

function jouer(cave, pil, rsv, ut, html, css, silencieux) {
  let ok = true;
  const T = (c, nom, det) => { if (!silencieux) pose(c, nom, det); if (!c) ok = false; };
  const L = t => { if (!silencieux) console.log('\n  ' + t); };

  L('Le Pilotage n\u2019a plus de cave');
  T(!/\['cav',/.test(pil), 'plus d\u2019onglet cav dans _PIL_TABS');
  T(/cav:'auj'/.test(pil), 'la cl\u00e9 cav migre vers auj (_PIL_TAB_MIGR)');
  T(!/_PIL_CAVSUB|_pilLoadCav|_pilSaveCav|_pilTabCav|_pilAvertCav|_PCAV_MIL|_pcav|_pcrb/.test(pil), 'aucun reste de l\u2019onglet : ni sous-vue, ni handlers, ni fonctions');
  T(!/Ouillage <b>'\+_pilEsc/.test(pil), 'l\u2019alerte ouillage du Pilotage (seuil global) a disparu');
  const ck = extraire(pil, '_pilCkCave') || '';
  T(/window\._mlAgendaComplet/.test(ck) && /window\._mlVerdict/.test(ck), 'la carte Cave LIT _mlVerdict et _mlAgendaComplet de cave.js');
  T(/_pilOuvrirCave\(\)/.test(ck) && /window\._pilOuvrirCave\s*=\s*function/.test(pil), 'la carte a son bouton, et il est sur window');
  T(/selectCaveSection\('aujourdhui'\)/.test(pil), 'le bouton ouvre la Cave sur Aujourd\u2019hui');
  T(/auj_cave:1/.test(pil) && /\['auj_cave','La Cave/.test(pil), 'la carte est un panneau param\u00e9trable (auj_cave)');
  T(/\.pil-ck-btn\{/.test(css), 'le bouton de la carte a son style');

  L('Le millesime a deux onglets');
  T(/id="ml-tab-vie" onclick="_mlSetTab\('vie'\)"/.test(html) && /id="ml-tab-crb" onclick="_mlSetTab\('crb'\)"/.test(html), 'La ligne de vie et Les courbes dans #ml-tabs-row');
  const rcm = extraire(cave, 'renderCaveMillesime') || '';
  T(/_mlTab==='crb'\)\{[\s\S]{0,400}_pcavVueCourbes\(c\)[\s\S]{0,300}_pcrbPose\(\)/.test(rcm), 'les courbes se posent apr\u00e8s le HTML (_pcrbPose)');
  const rc = extraire(cave, 'renderCave') || '';
  T(/_mvGraphOublier\('#pcrb-g-'\)/.test(rc), 'la famille de graphes est oubli\u00e9e d\u00e8s qu\u2019on quitte les courbes');
  const vie = extraire(cave, '_mlRenderVie') || '';
  T(/h\+=_mlTuiles\(ch\);/.test(vie), 'La ligne de vie ouvre sur les quatre tuiles');
  T(/_pcavN1\(\{mil:mil, milAff:mil\}, mil\)/.test(vie), 'et se ferme sur face \u00e0 N-1');
  const st = extraire(cave, '_mlSetTab') || '';
  T(/t==='venir'/.test(st) && /_mlTab=\(t==='crb'\)\?'crb':'vie'/.test(st), '_mlSetTab : venir \u2192 Aujourd\u2019hui, sinon vie|crb');
  const ctx = extraire(cave, '_pcavCtx') || '';
  T(/^function _pcavCtx\(\)\{/.test(ctx) && /_caveSeuilGlobal\(\)/.test(ctx), '_pcavCtx ne d\u00e9pend plus du Pilotage (seuil via _caveSeuilGlobal)');

  L('Le parc a un seul chez-soi');
  T(/window\._caveParcHtml\s*=\s*_caveParcHtml/.test(cave), '_caveParcHtml est sur window');
  T(/_caveParcHtml\(\)/.test(rsv) && /_rsvFutsHtml\(\)/.test(rsv), 'La R\u00e9serve \u203a F\u00fbts le rend en t\u00eate');
  const vp = extraire(cave, '_pcavVueParc') || '';
  T(/_pcavAngesCard\(c\)/.test(vp) && /_pcavPyramide\(c\)/.test(vp) && !/_pcavEtat|_pcavMouv/.test(vp), 'le parc n\u2019apporte que ce que la R\u00e9serve n\u2019a pas : anges et pyramide');

  L('Rien de ce qui doublait n\u2019a surv\u00e9cu');
  for (const f of ['_pcavVuePresse','_pcavVerdict','_pcavMalo','_pcavSoutirages','_pcavFinMalo','_pcavFlux','_pcavRdt','_pcavBandeau','_pcavVueMillesime','_pcavPoseRdt','_pcavEtat','_pcavMouv','_pcavMils'])
    T(!new RegExp('function ' + f + '\\(').test(cave), f + ' n\u2019existe plus');
  const orphelins = [...cave.matchAll(/^function (_pc(?:av|rb)\w+)\(/gm)].map(m => m[1])
    .filter(f => (cave.match(new RegExp('\\b' + f + '\\b', 'g')) || []).length < 2);
  T(orphelins.length === 0, 'aucune fonction _pcav*/_pcrb* sans appelant', orphelins.join(', '));

  L('Les fiches suivent leurs cartes');
  T(!/'pil\.cav\./.test(ut) && !/'pil\.cav\./.test(cave) && !/'pil\.cav\./.test(pil), 'plus aucune fiche pil.cav.*');
  T(['cave.anges','cave.courbes','cave.rdt'].every(k => ut.includes("'" + k + "'") && cave.includes("'" + k + "'")), 'cave.anges, cave.courbes et cave.rdt existent et sont pos\u00e9es');
  const card = extraire(cave, '_pcavCard') || '';
  T(/typeof window\._mvInfoBtn==='function'\?window\._mvInfoBtn\(infoCle\)/.test(card), '_pcavCard pose la pastille via window (hors import dans cave.js)');
  const auj = (ut.match(/'cave\.auj': \{[\s\S]*?\] \}/) || [''])[0];
  T(/ouillage/i.test(auj) && /soutirage/i.test(auj), 'ouillage et soutirage sont expliqu\u00e9s dans la fiche d\u2019Aujourd\u2019hui');

  L('Ex\u00e9cut\u00e9 : les tuiles');
  const tu = extraire(cave, '_mlTuiles') || '';
  if (tu) {
    const fn = new Function('_pcavMatiere', '_mlRdtMoyen', '_pcavK', '_pcavF1', '_pcavInt', 'ch', tu + '\nreturn _mlTuiles(ch);');
    const K = (lab, val, unit) => '[' + lab + '=' + val + unit + ']';
    const out = fn(ch => !!ch && ch.kg > 0, () => ({ hlHa: 18.4, statut: 'estime', sansSurface: 0, approx: 0, ha: 10.9 }),
      K, n => String(n).replace('.', ','), n => String(n), { ha: 10.9, kg: 29000, kgVendu: 9370, hlFut: 0, futs: 0, parcelles: 45 });
    T(/\[Surface r\u00e9colt\u00e9e=10,9ha\]/.test(out) && /\[Raisin rentr\u00e9=29t\]/.test(out) && /\[Rendement moyen=\u2248 18,4hL\/ha\]/.test(out), 'quatre tuiles, le rendement estim\u00e9 marqu\u00e9 \u2248', out);
    const vide = fn(() => false, () => null, K, String, String, { kg: 0 });
    T(vide === '', 'sans mati\u00e8re, pas de tuiles');
  } else T(false, '_mlTuiles est extractible');
  return ok;
}

console.log('\n\u2500\u2500 CAVE-3 : la cave du Pilotage est rentr\u00e9e chez elle\n');
jouer(CAVENU, PILNU, RSVNU, UTNU, HTMLNU, CSS, false);

if (CONTRE) {
  console.log('\n  Contre-\u00e9preuves');
  const cas = [
    ['la cl\u00e9 cav n\u2019est plus migr\u00e9e', [PILNU.replace("cav:'auj'", ''), CAVENU, RSVNU, UTNU, HTMLNU]],
    ['la carte Cave recalcule au lieu de lire', [PILNU.replace(/window\._mlVerdict/g, '_pilVerdictMaison'), CAVENU, RSVNU, UTNU, HTMLNU]],
    ['les courbes ne se posent plus apr\u00e8s le HTML', [PILNU, CAVENU.replace("try{ _pcrbPose(); }catch(e){ _pcavLog('poseCourbes',e); }", ''), RSVNU, UTNU, HTMLNU]],
    ['la R\u00e9serve oublie le parc', [PILNU, CAVENU, RSVNU.replace('_caveParcHtml()', "''"), UTNU, HTMLNU]],
    ['une copie du verdict revient dans cave.js', [PILNU, CAVENU + '\nfunction _pcavVerdict(c){ return null; }\n', RSVNU, UTNU, HTMLNU]],
    ['la pastille repasse hors window', [PILNU, CAVENU.replace("typeof window._mvInfoBtn==='function'?window._mvInfoBtn(infoCle)", "typeof _mvInfoBtn==='function'?_mvInfoBtn(infoCle)"), RSVNU, UTNU, HTMLNU]],
  ];
  for (const [nom, [p, c, r, u, h]] of cas) {
    const identique = p === PILNU && c === CAVENU && r === RSVNU && u === UTNU && h === HTMLNU;
    const vertApres = identique ? true : jouer(c, p, r, u, h, CSS, true);
    pose(!identique && !vertApres, nom + ' \u2192 rougit bien', identique ? 'la mutation n\u2019a rien chang\u00e9' : 'rest\u00e9 vert');
  }
}

console.log('\n  ' + vert + ' / ' + total + ' vertes' + (rouges.length ? '\n  ROUGES : ' + rouges.join(' \u00b7 ') : '') + '\n');
process.exit(rouges.length ? 1 : 0);
