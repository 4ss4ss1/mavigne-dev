// ═══ mv-harnais-demo ═══ La visite guidée : ce qu'on montre, et ce qu'on facture.
//  ⚠️ Il LIT src/app.js. Rien n'est réimplémenté ici : la table de chiffrage est
//     ÉVALUÉE (c'est de la donnée pure), les moments sont analysés sur leur
//     CORPS, commentaires ôtés — un commentaire qui cite `.pil-tbody` ne doit
//     pas rougir, et une assertion qui passe grâce à un commentaire est verte
//     pour rien (§34g).
import fs from 'fs';
const SRC = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const PIL = fs.readFileSync(new URL('../src/pilotage.js', import.meta.url), 'utf8');
const IDX = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const CSS = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const AUTRES = ['planning','cave','tracteur','phyto','reserve','reglages','utils','onboarding','firebase','admin-gt']
  .map(m => { try { return fs.readFileSync(new URL(`../src/${m}.js`, import.meta.url), 'utf8'); } catch { return ''; } }).join('\n');
// ⚠️⚠️ LE PIEGE : chercher un selecteur dans app.js le trouve TOUJOURS —
//    puisque c'est _mvtSteps lui-meme qui l'ecrit. L'assertion se prouvait
//    toute seule. On retire donc du corpus le bloc des moments ET la table des
//    chapitres : ce qui reste est le code qui doit REELLEMENT produire la cible.
//    La contre-epreuve ④ est ce qui l'a revele.
function sansCitations(src) {
  let s = src;
  for (const [d, f] of [['var _mvtSteps = [', '\n];'], ['var _MVT_CHAPS=[', '\n];']]) {
    const i = s.indexOf(d); if (i < 0) continue;
    const j = s.indexOf(f, i); if (j < 0) continue;
    s = s.slice(0, i) + s.slice(j + f.length);
  }
  return s;
}
const TOUT = sansCitations(SRC) + PIL + IDX + CSS + AUTRES;

let ok = 0, ko = 0;
let MUET = false;
const t = (nom, cond, det = '') => { if (cond) { ok++; } else { ko++; if (!MUET) console.log('  ✗ ' + nom + (det ? ' — ' + det : '')); } };

// ── corps() : le code sans ses commentaires de ligne ────────────────────────
const corps = (s) => s.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

// ── extraction ──────────────────────────────────────────────────────────────
function bloc(src, debut, fin) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('ancre absente : ' + debut);
  const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin absente : ' + fin);
  return src.slice(i, j + fin.length);
}
export function lireCredits(src = SRC) {
  const b = bloc(src, 'var DEMO2_CREDITS = [', '\n];');
  return eval(b.replace('var DEMO2_CREDITS = [', '[').replace(/\n\];$/, ']'));
}
export function lireHors(src = SRC) {
  const l = corps(src).match(/var DEMO2_HORS = (\{[^}]*\});/); if (!l) throw new Error('DEMO2_HORS absent');
  return eval('(' + l[1] + ')');
}
export function lireMoments(src = SRC) {
  const b = corps(bloc(src, 'var _mvtSteps = [', '\n];'));
  // Un moment commence à `{ kick:` en début de ligne indentée de deux espaces.
  const parts = b.split(/\n  \{ kick:/).slice(1);
  return parts.map(p => '{ kick:' + p);
}
const selsDe = (m) => {
  const out = [];
  for (const mm of m.matchAll(/(?:sel|selAll|clickSel)\s*:\s*'([^']+)'/g)) out.push(mm[1]);
  for (const mm of m.matchAll(/(?:sel|selAll)\s*:\s*\[([^\]]+)\]/g))
    for (const s of mm[1].matchAll(/'([^']+)'/g)) out.push(s[1]);
  return out;
};
// ⚠️ On ne cherche les clés QUE dans `credits:[…]`. Un `k:'…'` attrapé au vol
//    ramassait `block:'center'` des navigations : une assertion rouge pour une
//    clé qui n'existe pas est aussi fausse qu'une verte pour rien.
const clesDe = (m) => {
  const out = [];
  for (const cm of m.matchAll(/credits\s*:\s*\[([\s\S]*?)\]/g))
    for (const km of cm[1].matchAll(/k\s*:\s*'([a-z]+)'/g)) out.push(km[1]);
  return out;
};

// ── les six assertions ──────────────────────────────────────────────────────
export function jouer(src = SRC, tout = null, muet = false) {
  if (tout === null || tout === undefined) tout = sansCitations(src) + PIL + IDX + CSS + AUTRES;
  ok = 0; ko = 0; MUET = muet;
  const C = lireCredits(src), H = lireHors(src), M = lireMoments(src);
  const montrees = new Set(M.flatMap(clesDe));

  if (!muet) console.log(`  · ${C.length} lignes de chiffrage · ${M.length} moments`);

  // 1 — ON NE FACTURE QUE CE QU'ON A MONTRÉ.
  for (const c of C) t(`ligne « ${c.k} » démontrée par un moment`, montrees.has(c.k));

  // 2 — Aucun crédit orphelin : un moment ne crédite pas une ligne inexistante.
  const cles = new Set(C.map(c => c.k));
  for (const k of montrees) t(`crédit « ${k} » correspond à une ligne`, cles.has(k));

  // 3 — AUCUNE CIBLE DANS UN CORPS DE CARTE REPLIÉE (§42).
  const sels = M.flatMap(selsDe);
  for (const s of sels) t(`« ${s} » ne vise pas un corps replié`, !/\.pil-tbody|#pil-body-/.test(s));

  // 4 — Toute cible citée existe dans les sources (C22, appliqué à la visite).
  for (const s of sels) {
    const jetons = s.match(/[.#][\w-]+|\[[\w-]+(="[^"]*")?\]/g) || [];
    for (const j of jetons) {
      const brut = j.replace(/^[.#]/, '').replace(/^\[|\]$/g, '');
      t(`jeton « ${j} » présent dans les sources`, tout.includes(brut), 'sélecteur ' + s);
    }
  }

  // 5 — La ligne molle est HORS du total, et le total est celui qu'on annonce.
  const totalH = C.reduce((s, c) => s + c.min * c.freq, 0) / 60;
  t('la ligne « info » n\'est plus dans le total', !C.some(c => c.k === 'info'));
  t('DEMO2_HORS porte bien la ligne sortie', /info/.test(H.lab) || /d\\u00e9placement|déplacement/.test(H.lab));
  t('total ≈ 127 h', Math.round(totalH) === 127, 'lu : ' + Math.round(totalH));
  t('hors total ≈ 37 h', Math.round(H.min * H.freq / 60) === 37);

  // 6 — TOUTE FONCTION APPELEE PAR LE MOTEUR EST DEFINIE.
  //   `node --check` ne voit pas un appel a une fonction qui n'existe pas :
  //   _mvtCredits a ete APPELE avant d'etre ECRIT, et rien n'a rougi. La
  //   syntaxe etait valable, la visite aurait plante au premier moment.
  const corpsSrc = corps(src);
  const appeles = new Set([...corpsSrc.matchAll(/\b(_mvt[A-Z]\w*|_demo2\w*)\s*\(/g)].map(m => m[1]));
  for (const f of [...appeles].sort())
    t(`« ${f} » est définie`, new RegExp('function\\s+' + f + '\\s*\\(').test(corpsSrc));

  // 7 — La clôture ne soustrait plus, et reste en heures.
  const add = corps(bloc(src, 'function _mvtAddition(){', '\n}'));
  t('la clôture ne pose plus de soustraction en euros', !/\u2212|premi\\u00e8re ann\\u00e9e, tout compris/.test(add));
  t('la clôture dit un coût par heure rendue', /heure rendue/.test(add));
  t('le total est affiché en heures', /Math\.round\(totalH\)/.test(add));

  return { ok, ko, totalH, horsH: H.min * H.freq / 60, moments: M.length };
}

if (process.argv[1] && process.argv[1].endsWith('harnais-demo.mjs')) {
  console.log('── mv-harnais-demo ──');
  let r;
  try { r = jouer(); } catch (e) { console.log('  ✗ CRASH : ' + e.message); process.exit(2); }
  console.log(`\n  ${r.ok} vertes · ${r.ko} rouges · total ${Math.round(r.totalH)} h (+${Math.round(r.horsH)} h hors total) · ${r.moments} moments`);
  process.exit(r.ko ? 1 : 0);
}
