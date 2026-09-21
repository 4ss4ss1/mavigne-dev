#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais SUBSET : CE QUE LES POLICES DU PROJET SAVENT DESSINER
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE — l'audit du 14/09.
//  Cinquante boutons d'ajout portaient « ＋ » (U+FF0B, le plus PLEINE CHASSE).
//  Ce caractere n'est dans AUCUNE des deux polices auto-hebergees : le subset
//  latin de `fonts.css` s'arrete a U+00FF plus quelques plages nommees. Il
//  etait donc dessine par une police SYSTEME — chasse pleine, ligne de base
//  etrangere a Outfit, et carre vide sur un poste sans police CJK.
//
//  ⚠️ LE HARNAIS DES ICONES NE POUVAIT PAS LE VOIR, et ce n'est pas un trou :
//  il repond a « est-ce un pictogramme ? ». U+FF0B n'en est pas un — il etait
//  meme nomme dans sa liste TYPO, « ce qui n'est pas une icone et reste ».
//  La question posee ici est AUTRE : « la police du projet contient-elle ce
//  glyphe ? ». Un signe typographique est legitime ; encore faut-il qu'on
//  puisse le composer.
//
//  ★★ LA REFERENCE EST LUE, JAMAIS ECRITE EN DUR. Les plages viennent des
//  `unicode-range` de `public/fonts/fonts.css`, les graisses des `@font-face`
//  du meme fichier. Le jour ou l'on ajoute un subset, le harnais suit tout
//  seul ; le jour ou quelqu'un le casse, les auto-controles rougissent.
//
//  ★ CE QUI EST UN CLIQUET ET CE QUI EST UNE INTERDICTION — et pourquoi.
//  U+FF0B est INTERDIT : il est corrige, nommement, et ne doit pas revenir.
//  Le reste (₂ ≈ ᵉ ʳ ⊘ ⋯ ≥ ≤ Σ ⠿ ① ② ③) est un CLIQUET par fichier : ce sont
//  274 occurrences dont une partie n'est meme pas rendue (plages de regex,
//  sentinelles de tri, commentaires HTML dans des documents generes). Les
//  declarer « toleres » un par un serait mentir sur ce qu'on a mesure ; un
//  compte qui ne peut que descendre dit la verite et rend la dette visible.
//
//  Usage :
//    node scripts/mv-harnais-subset.mjs
//    node scripts/mv-harnais-subset.mjs --contre
//    node scripts/mv-harnais-subset.mjs --baseline
//  Exit 0 si tout tient, 1 sinon.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const REBASE = process.argv.includes('--baseline');
const T = '\u001b[0m', R = '\u001b[31m', V = '\u001b[32m', G = '\u001b[2m', J = '\u001b[33m';

const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const REF  = 'scripts/subset-baseline.json';

/* ⚠️ On mesure CE QUI S'AFFICHE, pas ce qui est ecrit dans le fichier.
   Deux precautions, toutes deux vecues ailleurs dans le projet :
     · les commentaires sont blanchis — un bandeau `// ═══` n'est pas rendu ;
     · les echappements sont decodes — `'\\u2265'` est un glyphe a l'ecran,
       et il ne compte pas si on lit le fichier tel qu'il est ecrit. */
function blanchirJs(c){
  c = c.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  c = c.replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return c;
}
function blanchirHtml(c){ return blanchirJs(c.replace(/<!--[\s\S]*?-->/g, ' ')); }
function decoder(c){
  return c
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return m; } })
    .replace(/\\u([0-9a-fA-F]{4})/g,   (m, h) => String.fromCharCode(parseInt(h, 16)));
}

/* Les pictogrammes ont DEJA leur cliquet (mv-harnais-icones). Les compter ici
   ferait deux filets sur la meme dette, qui se contredisent au premier lot. */
const PICTO = /[\u2190-\u21FF\u2300-\u23FF\u25A0-\u25FF\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}]|\p{Extended_Pictographic}/u;
/* Selecteur de variante et liant : ce ne sont pas des glyphes, ils modifient
   celui d'a cote. Les compter annoncerait 371 la ou l'oeil en voit 274. */
const INVISIBLES = new Set([0xFE0E, 0xFE0F, 0x200D]);

const MODULES = ['app', 'utils', 'pilotage', 'planning', 'reglages', 'cave', 'cuvier',   // ★ CUV-DEC (§164)
                 'tracteur', 'phyto', 'reserve', 'admin-gt', 'firebase', 'onboarding'];

// ── La reference : lue dans fonts.css, jamais supposee ─────────────────────
const FONTS = lire('public/fonts/fonts.css');

const PLAGES = [];
for (const m of FONTS.matchAll(/unicode-range\s*:\s*([^;}]+)/g))
  for (const p of m[1].split(',')){
    const r = /U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?/.exec(p.trim());
    if (r) PLAGES.push([parseInt(r[1], 16), parseInt(r[2] || r[1], 16)]);
  }
const couvert = (c) => PLAGES.some(([a, b]) => c >= a && c <= b);

const FACES = [];
for (const m of FONTS.matchAll(/@font-face\s*\{([^}]*)\}/g)){
  const b = m[1];
  const fam = /font-family\s*:\s*['"]?([^;'"]+)/.exec(b);
  const pds = /font-weight\s*:\s*(\d+)/.exec(b);
  const sty = /font-style\s*:\s*([a-z]+)/.exec(b);
  if (fam && pds) FACES.push({ fam: fam[1].trim(), pds: parseInt(pds[1], 10), sty: sty ? sty[1] : 'normal' });
}
const familles = [...new Set(FACES.map(f => f.fam))];
const pdsMax   = Math.max(...FACES.map(f => f.pds));

// ── Le corpus : toutes les surfaces rendues ────────────────────────────────
const corpus = [];
for (const m of MODULES) corpus.push(['src/' + m + '.js', decoder(blanchirJs(lire('src/' + m + '.js')))]);
/* ⚠️ `styles.css` fait partie du corpus : c'est la ou vivent le plus de
   graisses, et ses `content:` sont du texte rendu. Un cliquet qui ne lit pas
   la feuille de style principale ne protege pas grand-chose. */
corpus.push(['src/styles.css', decoder(blanchirJs(lire('src/styles.css')))]);
const HTML = lire('index.html');
const spr  = HTML.match(/<svg id="mv-sprite"[\s\S]*?<\/svg>/);
corpus.push(['index.html', decoder(blanchirHtml(spr ? HTML.replace(spr[0], ' ') : HTML))]);
for (const f of fs.readdirSync(path.join(RACINE, 'guide')))
  if (/^[\w-]+\.html$/.test(f)) corpus.push(['guide/' + f, decoder(blanchirHtml(lire('guide/' + f)))]);
for (const f of ['public/demarrage.html', 'public/logiciel-vigne.html',
                 'public/essai.html', 'public/mise-en-route.html'])
  if (fs.existsSync(path.join(RACINE, f))) corpus.push([f, decoder(blanchirHtml(lire(f)))]);

if (CONTRE){
  /* ⚠️ Le sabotage doit etre un MENSONGE REEL : on remet un « ＋ » pleine
     chasse dans un module et une graisse que la police n'a pas. Si le harnais
     reste vert la-dessus, il ne prouve rien. */
  corpus.push(['src/CONTRE-EPREUVE.js', 'h+=\'<button>\uFF0B Ajouter</button>\';' +
                                        'st.textContent=".x{font-weight:900}";']);
}

// ── Mesure ─────────────────────────────────────────────────────────────────
const horsSubset = {};       // fichier -> compte
const carUniq    = new Map();// caractere -> compte
let totHors = 0, ff0b = [];
for (const [f, txt] of corpus){
  let n = 0;
  for (const ch of txt){
    const c = ch.codePointAt(0);
    if (c < 0x80 || couvert(c) || INVISIBLES.has(c) || PICTO.test(ch)) continue;
    n++; totHors++;
    carUniq.set(ch, (carUniq.get(ch) || 0) + 1);
    if (c === 0xFF0B) ff0b.push(f);
  }
  if (n) horsSubset[f] = n;
}

/* Les fausses graisses : une valeur au-dessus de la plus lourde des fontes
   chargees ne rend rien de plus — le navigateur retombe sur la meme fonte.
   L'emphase voulue n'existe pas, et personne ne le voit. */
const grasses = {};
let totGras = 0;
for (const [f, txt] of corpus){
  const g = (txt.match(/font-weight\s*:\s*(?:\d{3}|bolder)/g) || [])
    .filter(d => { const v = /(\d{3})/.exec(d); return v ? parseInt(v[1], 10) > pdsMax : true; });
  if (g.length){ grasses[f] = g.length; totGras += g.length; }
}

let ref = null;
try { ref = JSON.parse(lire(REF)); } catch { /* premier passage */ }

if (REBASE){
  fs.writeFileSync(path.join(RACINE, REF),
    JSON.stringify({ _note: 'Cliquet du harnais SUBSET. Regraver : node scripts/mv-harnais-subset.mjs --baseline. Il ne doit que DESCENDRE.',
                     genere: new Date().toISOString().slice(0, 10),
                     hors_subset: horsSubset, hors_subset_total: totHors,
                     fausses_graisses: grasses, fausses_graisses_total: totGras }, null, 2) + '\n');
  console.log('\n  cliquet regrave : ' + totHors + ' hors subset · ' + totGras + ' fausses graisses');
  process.exit(0);
}

let ko = 0, n = 0;
const A = (titre, ok, det) => { n++; if (!ok) ko++;
  console.log('  ' + (ok ? V + 'OK  ' + T : R + 'KO  ' + T) + titre + (det ? '   ' + G + det + T : '')); };

console.log('\n  MA VIGNE — Harnais SUBSET : ce que les polices savent dessiner\n');
console.log('  ' + G + familles.join(' + ') + ' · ' + FACES.length + ' fontes · graisse max ' + pdsMax
            + ' · ' + PLAGES.length + ' plages' + T);
console.log('  ' + G + corpus.length + ' surfaces lues · ' + totHors + ' caracteres hors subset ('
            + carUniq.size + ' distincts) · ' + totGras + ' fausses graisses' + T + '\n');

// ── A. Les auto-controles : un harnais doit nommer ce qu'il surveille ──────
A('Les plages sont lues dans fonts.css', PLAGES.length > 0, PLAGES.length + ' plages');
A('Les @font-face sont lues dans fonts.css', FACES.length > 0 && familles.length === 2,
  familles.join(' + '));
A('\u2605 Le subset couvre bien le francais',
  [...'\u00e9\u00e0\u00e7\u00f9\u0153\u00ab\u00bb\u20ac\u2019\u2014\u2026\u00b7'].every(ch => couvert(ch.codePointAt(0))));
A('\u2605 Le subset ne couvre PAS le + pleine chasse', !couvert(0xFF0B),
  'sinon ce harnais ne prouverait rien');

// ── B. L'interdiction nommee ──────────────────────────────────────────────
A('\u2605\u2605\u2605 Aucun « \uFF0B » (U+FF0B) dans une surface rendue', ff0b.length === 0,
  ff0b.length ? ff0b.length + ' dans ' + [...new Set(ff0b)].slice(0, 4).join(', ') : 'U+002B partout');

// ── C. Le cliquet : le compte ne remonte jamais ───────────────────────────
if (!ref){
  A('Le cliquet existe', false, 'lancer : node scripts/mv-harnais-subset.mjs --baseline');
} else {
  const montees = [];
  for (const f of Object.keys(horsSubset)){
    const av = ref.hors_subset && ref.hors_subset[f] != null ? ref.hors_subset[f] : 0;
    if (horsSubset[f] > av) montees.push(f + ' ' + av + '\u2192' + horsSubset[f]);
  }
  A('\u2605\u2605 Aucun fichier ne remonte (hors subset)', montees.length === 0,
    montees.length ? montees.slice(0, 5).join(' \u00b7 ') : Object.keys(horsSubset).length + ' fichiers suivis');
  A('\u2605 Le total hors subset ne remonte pas',
    ref.hors_subset_total == null || totHors <= ref.hors_subset_total,
    totHors + ' \u2264 ' + ref.hors_subset_total);

  const mg = [];
  for (const f of Object.keys(grasses)){
    const av = ref.fausses_graisses && ref.fausses_graisses[f] != null ? ref.fausses_graisses[f] : 0;
    if (grasses[f] > av) mg.push(f + ' ' + av + '\u2192' + grasses[f]);
  }
  A('\u2605\u2605 Aucun fichier ne remonte (fausses graisses > ' + pdsMax + ')', mg.length === 0,
    mg.length ? mg.slice(0, 5).join(' \u00b7 ') : totGras + ' au total, ' + Object.keys(grasses).length + ' fichiers');
}

// ── D. Le detail, pour que la dette soit lisible ──────────────────────────
const top = [...carUniq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log('  ' + G + '    hors subset : '
  + top.map(([c, k]) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ' \u00d7' + k).join(' \u00b7 ') + T);

console.log('\n' + (ko ? R + ko + ' ROUGE(S) sur ' + n + T : V + 'TOUT VERT — ' + n + ' assertions' + T));
if (CONTRE){
  console.log(ko ? '\n' + V + 'CONTRE-EPREUVE CONCLUANTE : le \uFF0B remis et la graisse 900 font rougir.' + T
                 : '\n' + R + '\u26a0\ufe0f CONTRE-EPREUVE MUETTE : le harnais ne voit pas le defaut.' + T);
  process.exit(ko ? 0 : 1);
}
if (!ko && totHors) console.log('  ' + J + 'dette : ' + totHors + ' caracteres hors subset, ' + totGras + ' fausses graisses' + T);
process.exit(ko ? 1 : 0);
