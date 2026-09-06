// ═══════════════════════════════════════════════════════════════════════════
// HARNAIS — LA CARTE DE PARCELLE : AUCUNE CLASSE ORPHELINE
// ═══════════════════════════════════════════════════════════════════════════
// NE PAS relire ce fichier pour se rassurer : le lancer.
//   node scripts/mv-harnais-carte-parcelle.mjs
//   node scripts/mv-harnais-carte-parcelle.mjs --contre   (contre-epreuve)
//
// POURQUOI IL EXISTE.
// `.pc-ord` — le rang de tournee devant le nom d'une parcelle — a vecu des mois
// avec une regle CSS qui ne l'atteignait pas : elle etait ecrite
// `.pc-nom .pc-ord`, or `.pc-nom` est le titre d'AVANT la charte DS-2 et plus
// aucun ecran ne l'emet. La pastille sortait donc en TEXTE BRUT, collee au nom.
// Rien ne l'a signale : ni `node --check`, ni ESLint, ni le preflight. Une
// regle CSS qui ne s'applique a rien ne casse pas, elle se tait.
//
// ⚠️⚠️ LA PREMIERE VERSION DE CE CONTROLE ETAIT INUTILE, et sa contre-epreuve
//   l'a prouve en trente secondes. Elle cherchait la chaine `.pc-ord` QUELQUE
//   PART dans la feuille — et `.pc-nom .pc-ord` la contient. Elle repondait
//   vert sur le defaut exact qu'elle etait censee attraper.
//   C'est la faute de §42f : chercher « au moins une fois » la ou il faut
//   MESURER. On ne demande pas « la classe est-elle citee ? » mais
//   « une regle ATTEINT-ELLE l'element ? ». Ce sont deux questions differentes,
//   et seule la seconde a un sens.
//
// CE QU'IL FAIT VRAIMENT. Il reconstruit la CHAINE D'ANCETRES telle que
// `app.js` l'emet, puis, pour chaque classe qui porte un role visuel, il
// cherche une regle dont le selecteur MATCHE cette chaine — combinateurs
// compris. Pas de DOM a installer : les selecteurs en jeu sont des compounds
// de classes separes par des descendants, ce qui se decide exactement.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = fs.readFileSync(path.join(RACINE, 'src/styles.css'), 'utf8');
const JS  = fs.readFileSync(path.join(RACINE, 'src/app.js'), 'utf8');
const CONTRE = process.argv.includes('--contre');

// ── La chaine reelle emise par _pvInner + _pvActions, racine -> feuille. ──
// Chaque maillon : le nom de balise et ses classes.
const CHAINE_PILL = [
  { tag: 'div', cls: ['mv-c', 'mv-c-clic', 'pcard-qv'] },
  { tag: 'div', cls: ['pc-row'] },
  { tag: 'div', cls: ['pc-left'] },
  { tag: 'div', cls: ['mv-hd'] },
  { tag: 'div', cls: [] },
  { tag: 'div', cls: ['mv-t', 'mv-t-ord'] },
  { tag: 'span', cls: ['pc-ord'] }
];
const CHAINE_NOM = CHAINE_PILL.slice(0, 6).concat([{ tag: 'span', cls: ['mv-t-nom'] }]);
const CHAINE_RAIL = [
  { tag: 'div', cls: ['mv-c', 'mv-c-clic', 'pcard-qv'] },
  { tag: 'div', cls: ['pc-row'] },
  { tag: 'div', cls: ['pc-actions'] },
  { tag: 'button', cls: ['pc-validate'] }
];
const CHAINE_START = CHAINE_RAIL.slice(0, 3).concat([{ tag: 'button', cls: ['pc-start'] }]);
const CHAINE_LB = CHAINE_RAIL.concat([{ tag: 'span', cls: ['pc-lb'] }]);
const CHAINE_LEFT = CHAINE_PILL.slice(0, 3);
const CHAINE_CARTE = CHAINE_PILL.slice(0, 1);

// Ce qu'on exige : une classe, la chaine ou elle vit, et la PROPRIETE qui
// prouve que la regle fait quelque chose (une regle vide ne compte pas).
const EXIGENCES = [
  { cls: 'pc-ord',    chaine: CHAINE_PILL,  prop: 'background', quoi: 'la pastille de rang de tournee' },
  { cls: 'mv-t-ord',  chaine: CHAINE_PILL.slice(0, 6), prop: 'display', quoi: 'la gouttiere du titre' },
  { cls: 'mv-t-nom',  chaine: CHAINE_NOM,   prop: 'min-width',  quoi: 'le nom de parcelle' },
  { cls: 'pcard-qv',  chaine: CHAINE_CARTE, prop: 'overflow',   quoi: 'le clip des coins du rail' },
  { cls: 'pc-left',   chaine: CHAINE_LEFT,  prop: 'padding',    quoi: 'l air autour du contenu' },
  { cls: 'pc-actions',chaine: CHAINE_RAIL.slice(0, 3), prop: 'width', quoi: 'la largeur du rail' },
  { cls: 'pc-validate', chaine: CHAINE_RAIL,  prop: 'color',    quoi: 'le bouton Valider' },
  { cls: 'pc-start',  chaine: CHAINE_START, prop: 'background', quoi: 'le bouton Debut' },
  { cls: 'pc-lb',     chaine: CHAINE_LB,    prop: 'font-size',  quoi: 'le libelle sous l icone' }
];

// ── Lecture des regles : selecteur -> corps. Commentaires retires d'abord,
//    sinon un selecteur cite en commentaire se prend pour une regle. ──
function reglesDe(css) {
  const net = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const re = /([^{}@]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(net))) {
    const corps = m[2];
    m[1].split(',').forEach(s => {
      s = s.trim();
      if (s) out.push({ sel: s, corps });
    });
  }
  return out;
}

// ── Un compound (« div.a.b », « .a », « button ») matche-t-il un maillon ? ──
function compoundMatche(comp, noeud) {
  const tag = (comp.match(/^[a-zA-Z][\w-]*/) || [''])[0];
  if (tag && tag !== noeud.tag) return false;
  const classes = comp.match(/\.[\w-]+/g) || [];
  return classes.every(c => noeud.cls.includes(c.slice(1)));
}

// ── Le selecteur matche-t-il la chaine ? Descendant et enfant direct.
//    Tout selecteur portant un combinateur qu'on ne sait pas decider
//    (`>` mis a part) est REJETE, jamais suppose vrai : un harnais qui
//    accorde le benefice du doute est un harnais qui ment. ──
function selecteurMatche(sel, chaine) {
  if (/[~+\[]/.test(sel)) return false;
  const morceaux = sel.replace(/\s*>\s*/g, ' > ').trim().split(/\s+/);
  let i = chaine.length - 1;
  const dernier = morceaux[morceaux.length - 1];
  if (dernier === '>' || !compoundMatche(dernier, chaine[i])) return false;
  let k = morceaux.length - 2;
  i -= 1;
  let direct = false;
  while (k >= 0) {
    const t = morceaux[k];
    if (t === '>') { direct = true; k -= 1; continue; }
    if (direct) {
      if (i < 0 || !compoundMatche(t, chaine[i])) return false;
      i -= 1; direct = false; k -= 1; continue;
    }
    let trouve = false;
    while (i >= 0) { if (compoundMatche(t, chaine[i])) { trouve = true; i -= 1; break; } i -= 1; }
    if (!trouve) return false;
    k -= 1;
  }
  return true;
}

// ── Contre-epreuve : on casse EXACTEMENT le defaut d'origine et on exige
//    que le harnais rougisse. Un harnais qu'on n'a jamais vu rougir sur le
//    defaut qu'il vise n'a pas ete teste, il a ete ecrit. ──
const cssUtile = CONTRE ? CSS.replace(/\.mv-t-ord \.pc-ord\{/, '.pc-nom .pc-ord{') : CSS;
const regles = reglesDe(cssUtile);

const rouges = [];
for (const e of EXIGENCES) {
  const atteintes = regles.filter(r =>
    r.sel.includes('.' + e.cls) &&
    selecteurMatche(r.sel, e.chaine) &&
    new RegExp('(^|[;{\\s])' + e.prop + '\\s*:').test(r.corps)
  );
  if (!atteintes.length) {
    const citees = regles.filter(r => r.sel.includes('.' + e.cls)).map(r => r.sel);
    rouges.push(`.${e.cls} (${e.quoi}) : aucune regle n'ATTEINT l'element avec « ${e.prop} ».`
      + (citees.length ? `\n      Regles qui citent la classe sans l'atteindre : ${citees.join(' | ')}` : ''));
  }
}

// ── Le JS doit vraiment emettre ces classes : une regle CSS parfaite sur une
//    classe que personne n'ecrit est l'exacte symetrie du defaut d'origine. ──
for (const c of ['mv-t-ord', 'mv-t-nom', 'pc-ord', 'pc-lb', 'pc-actions']) {
  if (!JS.includes(c)) rouges.push(`.${c} : stylee dans styles.css, JAMAIS emise par app.js.`);
}
// ── Et plus aucun emoji dans le rail : c'etait la moitie du defaut. ──
// ⚠️ LES COMMENTAIRES SONT RETIRES D'ABORD. La premiere version de ce controle
//   comptait les emojis cites DANS LE COMMENTAIRE qui explique qu'on les a
//   retires : il se declarait rouge sur sa propre correction. C'est le piege
//   connu du grep qui compte des commentaires — il ne se contourne pas, il se
//   supprime a la source.
const JS_CODE = JS.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
if (/0x2713|0x23F3/.test(JS_CODE)) rouges.push("Le rail reutilise un emoji (0x2713 / 0x23F3) au lieu du sprite DS-1.");
// ── Et l'identifiant nu qui a tue `_mvMapQuickOpen` : tout mot lu comme une
//    valeur doit etre declare. On ne re-verifie ici que le puits concerne. ──
{
  const i = JS_CODE.indexOf('function _mvMapQuickOpen(');
  if (i < 0) rouges.push('_mvMapQuickOpen a disparu : le panneau rapide de la carte n a plus de code.');
  else {
    let d = 0, j = i;
    while (j < JS_CODE.length) { const c = JS_CODE[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } j++; }
    const corps = JS_CODE.slice(i, j + 1);
    const lus = corps.match(/(?<![\w.$'"`])(em|emo|ic)(?![\w$])/g) || [];
    const declares = corps.match(/\b(?:var|let|const)\s+(em|emo|ic)\b/g) || [];
    if (lus.length > declares.length)
      rouges.push('_mvMapQuickOpen lit un identifiant court non declare (' + [...new Set(lus)].join(', ') + ') : ReferenceError en mode strict.');
  }
}

console.log('\n  HARNAIS — carte de parcelle' + (CONTRE ? '   [CONTRE-EPREUVE : defaut reinjecte]' : ''));
if (rouges.length) {
  rouges.forEach(r => console.log('    ROUGE  ' + r));
  console.log(`\n  ${rouges.length} rouge(s).\n`);
} else {
  console.log(`    ${EXIGENCES.length} classes verifiees, toutes atteintes.\n`);
}

// En mode contre-epreuve, le SUCCES est de rougir. Un lanceur doit lire le
// code de retour, pas la derniere ligne affichee.
if (CONTRE) {
  const ok = rouges.length > 0;
  console.log(ok ? '  ✓ le harnais mord.\n' : '  ✗ LE HARNAIS NE MORD PAS — il est inutile.\n');
  process.exit(ok ? 0 : 1);
}
process.exit(rouges.length ? 1 : 0);
