#!/usr/bin/env node
// mv-harnais-champs.mjs — CHARTE-6 (§400) : le jeu des cases de saisie.
//
// La maquette Design « le jeu des cases de saisie (CHARTE-6) », validée par Nico (« go »), fixe UN dessin de champ :
// blanc, au filet assez marqué pour être vu au soleil (--champ-filet, un réglage de la charte), l'arrondi des cartes,
// la hauteur des boutons, 16 px de texte au téléphone (en dessous, Safari zoome), le focus à la couleur d'action,
// l'erreur au rouge, le désactivé effacé. Ce contrôle garde ce jeu :
//   A  le bloc CHARTE-6 est là, avec ses pièces et ses états
//   B  aucune couleur écrite en dur dans le bloc
//   C  le filet des champs est un réglage de la charte, en clair et dans les blocs sombres
//   D  .fi et .fsel ne prennent leur dessin (fond, filet, arrondi, ombre, couleur, marge, hauteur) que du jeu
//      — la seule exception est la règle anti-zoom de Safari (iOS), qui redit 16 px
//   E  au téléphone, le texte d'un champ fait 16 px
//   F  les champs stylés sur place (hors console GT, hors charte) ne remontent pas
//
// --contre : chaque vérification est cassée exprès, une à une ; le contrôle doit rougir à chaque fois.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const CONTRE = process.argv.includes('--contre');

// Les champs stylés sur place (fond, filet, marge, hauteur, taille ou arrondi écrits dans l'attribut style).
// Ce nombre ne peut que baisser.
const PLAFOND_INLINE = 7;   // CHARTE-6d (§404) : 60 → 7 (les cases à cocher sorties du compte, 48 champs passés au jeu)

const S0 = {
  css: L('src/styles.css'),
  charte: L('src/charte.css'),
  idx: L('index.html'),
  mods: Object.fromEntries(fs.readdirSync(path.join(R, 'src'))
    .filter(f => f.endsWith('.js') && f !== 'admin-gt.js')     // la console GUERETTECH est hors charte (§398)
    .sort().map(f => ['src/' + f, L('src/' + f)])),
};

const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
// Les classes passées au jeu : leur dessin ne vient que du bloc (CHARTE-6a : .fi, .fsel ; CHARTE-6b, §401 : la Réserve, les heures,
// la visite guidée, le Planning, le filtre de dates du Journal).
const JEU = ['fi', 'fsel', 'mvr-fi', 'emh-in', 'mvt-fi', 'plan-ge-input', 'pl2r-tin', 'j-date-input', 'mvv-tin', 'mvc-pk-in', 'tcfg-in'];   // CHARTE-6c (§403) : le Cuvier, la Cave, les tournées
const FOND = ['j-date-input', 'tcfg-in'];   // dessin seul (.mvchamp-fond) : sa taille (marge, texte) reste à lui
const RE_JEU = new RegExp('\\.(' + JEU.join('|') + ')(?![\\w-])');
function bloc(css) {
  const a = css.indexOf('/* ★ CHARTE-6 '), b = css.indexOf('/* ★ FIN CHARTE-6 */');
  return (a >= 0 && b > a) ? css.slice(a, b) : '';
}
function champsSurPlace(S) {
  let n = 0;
  for (const js of [...Object.values(S.mods), S.idx])
    for (const m of js.matchAll(/<(?:input|select|textarea)\b(?![^>]*type=\\?["'](?:checkbox|radio))[^>]*?style=\\?["']([^"'\\]*)/g))   // une case à cocher a sa taille, pas un dessin (CHARTE-6d)
      if (/(?:^|;)\s*(border|background|padding|height|font-size|border-radius)\s*:/.test(m[1])) n++;
  return n;
}

function verifie(S) {
  const res = [];
  const T = (id, msg, ok, detail = '') => res.push({ id, msg, ok, detail });
  const B = sansCom(bloc(S.css));
  T('A', 'le bloc du jeu des cases de saisie est là, avec ses pièces et ses états (focus, erreur, désactivé, bureau)',
    !!B && /\.mvchamp, \.fi, \.fsel[^{]*\{/.test(B) && /:focus\{/.test(B) && /\[aria-invalid="true"\]/.test(B) && /:disabled\{/.test(B) && /@media \(min-width:768px\)/.test(B));
  const sansVar = B.replace(/var\(--[\w-]+(?:,[^()]*(?:\([^()]*\))?[^()]*)?\)/g, '');
  T('B', 'aucune couleur écrite en dur dans le bloc', !!B && !/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(sansVar));
  T('C', 'le filet des champs est un réglage de la charte, en clair et dans les blocs sombres',
    (sansCom(S.charte).match(/--champ-filet:/g) || []).length >= 3);
  const hors = sansCom(S.css.replace(bloc(S.css), ''));
  const viol = [];
  for (const m of hors.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = m[1].split(',').map(x => x.trim());
    if (!sels.some(x => RE_JEU.test(x))) continue;
    if (/-webkit-touch-callout/.test(hors.slice(Math.max(0, m.index - 200), m.index + m[1].length))) continue;
    const fond = sels.every(x => !RE_JEU.test(x) || FOND.some(f => new RegExp('\\.' + f + '(?![\\w-])').test(x)));
    const INTERDIT = fond ? /(?:^|;)\s*(background(?:-color)?|border(?:-color|-radius|-width)?|box-shadow|color)\s*:/ : /(?:^|;)\s*(background(?:-color)?|border(?:-color|-radius|-width)?|box-shadow|color|padding|min-height|height)\s*:/;
    if (INTERDIT.test(m[2]))
      viol.push(m[1].trim().replace(/\s+/g, ' ').slice(0, 70));
  }
  T('D', 'les champs passés au jeu ne prennent leur dessin que de lui', viol.length === 0, viol.join(' | '));
  T('E', 'au téléphone, le texte d’un champ fait 16 px (Safari ne zoome pas)', /\.mvchamp, \.fi, \.fsel[^{]*\{[^}]*font-size:var\(--pt-sm,16px\)/.test(B));
  const n = champsSurPlace(S);
  T('F', `les champs stylés sur place ne remontent pas (${n} ≤ ${PLAFOND_INLINE})`, n <= PLAFOND_INLINE);
  return { res, n };
}

function affiche({ res, n }, titre) {
  console.log(titre);
  for (const r of res) console.log(`  ${r.ok ? '✓' : '✗'} ${r.id} · ${r.msg}` + (!r.ok && r.detail ? `\n      → ${r.detail}` : ''));
  if (n < PLAFOND_INLINE) console.log(`    ↓ ${PLAFOND_INLINE - n} champ(s) stylé(s) sur place de moins — baisser PLAFOND_INLINE`);
  return res.every(r => r.ok);
}

const v0 = verifie(S0);
const ok0 = affiche(v0, 'Champs — le jeu des cases de saisie (CHARTE-6)');
if (!CONTRE) process.exit(ok0 ? 0 : 1);
if (!ok0) { console.log('  contre-épreuves non jouées : le harnais est rouge sur le code livré'); process.exit(1); }

const B0 = bloc(S0.css);
const DEF = [
  ['le bloc disparaît', 'A', S => ({ ...S, css: S.css.replace(B0, '') })],
  ['une couleur en dur entre dans le bloc', 'B', S => ({ ...S, css: S.css.replace(B0, B0.replace('border-color:var(--accent); }', 'border-color:#7A2850; }')) })],
  ['le filet quitte la charte', 'C', S => ({ ...S, charte: S.charte.replace(/--champ-filet:[^;]+;/g, '') })],
  ['une règle d’avant redessine .fi', 'D', S => ({ ...S, css: S.css + '\n.modal .fi{ background:var(--gris-clair); }\n' })],
  ['le texte redescend à 14 px au téléphone', 'E', S => ({ ...S, css: S.css.replace(B0, B0.replace('font-size:var(--pt-sm,16px); line-height', 'font-size:var(--pt-base,14px); line-height')) })],
  ['un champ stylé sur place de plus', 'F', S => ({ ...S, idx: S.idx + '<input style="border:1px solid #ccc;padding:4px">'.repeat(PLAFOND_INLINE - v0.n + 1) })],
];
let mordu = 0;
console.log('\n  contre-épreuves :');
for (const [nom, id, casse] of DEF) {
  const S = casse(S0);
  const avant = JSON.stringify(S) === JSON.stringify(S0);
  const r = verifie(S).res.find(x => x.id === id);
  const bon = !avant && r && !r.ok;
  if (bon) mordu++;
  console.log(`  ${bon ? '✓' : '✗'} ${nom} → ${avant ? 'motif introuvable — contre-épreuve inopérante' : (r && !r.ok ? id + ' rougit' : 'reste vert')}`);
}
console.log(`\n  ${mordu}/${DEF.length} contre-épreuves mordent`);
process.exit(mordu === DEF.length ? 0 : 1);
