#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Contrôle du journal des nouveautés (WHATS_NEW)
// ═══════════════════════════════════════════════════════════════════════════
//  ⚠️ LA REGLE EST : ON EXECUTE LE TABLEAU, ON NE LE RELIT PAS. Une relecture
//  a l'oeil ne voit ni un backslash rendu littéralement, ni un demi-surrogate
//  isolé, ni un bloc en double, ni une tête desynchronisee d'APP_VERSION.
//
//  Le tableau est decoupe du source, `export const` devient `const`, et le
//  morceau est importe en data: — donc c'est bien le tableau LIVRE qui est
//  evalue, pas une copie.
//
//  Usage : node scripts/mv-whatsnew-check.mjs [racine]
//  Exit 0 si tout passe, 1 sinon.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(process.argv[2] || path.join(ICI, '..'));
const SRC    = fs.readFileSync(path.join(RACINE, 'src', 'utils.js'), 'utf8');

const i = SRC.indexOf('export const WHATS_NEW = [');
if (i < 0) { console.error('WHATS_NEW introuvable dans src/utils.js'); process.exit(1); }
const j = SRC.indexOf('\n];', i) + 3;
const bloc = SRC.slice(i, j).replace('export const', 'const') + '\nexport { WHATS_NEW };\n';
const { WHATS_NEW: WN } = await import('data:text/javascript;base64,'
  + Buffer.from(bloc, 'utf8').toString('base64'));

const APP = (SRC.match(/export const APP_VERSION = '([^']+)'/) || [])[1];

// Le comparateur du projet : NUMERIQUE, jamais lexicographique ("5.10" > "5.9").
const cmp = (a, b) => {
  const pa = String(a).split('.'), pb = String(b).split('.');
  for (let k = 0; k < Math.max(pa.length, pb.length); k++) {
    const x = parseInt(pa[k], 10) || 0, y = parseInt(pb[k], 10) || 0;
    if (x !== y) return x - y;
  }
  return 0;
};
const since = seen => WN.filter(b => b && b.items && b.items.length
  && cmp(b.v, seen) > 0 && cmp(b.v, APP) <= 0).sort((a, b) => cmp(b.v, a.v));

let ko = 0;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const T = (n, c, d) => {
  const tag = c ? (useColor ? '\x1b[32mvert \x1b[0m' : 'vert ') : (useColor ? '\x1b[31mROUGE\x1b[0m' : 'ROUGE');
  console.log('   ' + tag + ' ' + n + (c || !d ? '' : '  → ' + d));
  if (!c) ko++;
};

console.log('\n  MA VIGNE — WHATS_NEW  (' + WN.length + ' blocs · APP_VERSION ' + APP + ')\n');
T('le bloc de tête porte APP_VERSION', WN[0] && WN[0].v === APP, WN[0] && WN[0].v);
let dec = true;
for (let k = 1; k < WN.length; k++) if (cmp(WN[k - 1].v, WN[k].v) <= 0) dec = false;
T('ordre strictement décroissant', dec);
T('aucune version en double', new Set(WN.map(b => b.v)).size === WN.length);
T('chaque item porte emoji, titre et desc',
  WN.every(b => (b.items || []).every(it => it.emoji && it.titre && it.desc)));

const txt = WN.flatMap(b => (b.items || []).flatMap(it => [it.emoji, it.titre, it.desc])).join('\n');
T('aucun backslash rendu littéralement', txt.indexOf('\\') === -1);
let bad = 0;
for (let k = 0; k < txt.length; k++) {
  const o = txt.charCodeAt(k);
  // ⚠️ On verifie l'APPARIEMENT : un emoji hors BMP est une paire LEGITIME.
  if (o >= 0xD800 && o <= 0xDBFF) {
    const n = txt.charCodeAt(k + 1); if (!(n >= 0xDC00 && n <= 0xDFFF)) bad++;
  } else if (o >= 0xDC00 && o <= 0xDFFF) {
    const p = txt.charCodeAt(k - 1); if (!(p >= 0xD800 && p <= 0xDBFF)) bad++;
  }
}
T('aucun demi-surrogate isolé', bad === 0, bad + ' isolé(s)');

// Le récap cumulatif, joué et non suppose.
if (WN.length > 1) {
  const prec = WN[1].v;
  T('depuis ' + prec + ' → le seul bloc ' + WN[0].v,
    since(prec).length === 1 && since(prec)[0].v === WN[0].v, since(prec).map(b => b.v).join(','));
}
const vieux = WN[Math.min(WN.length - 1, 8)].v;
T('depuis ' + vieux + ' → récap cumulatif (' + since(vieux).length + ' blocs)',
  since(vieux).length > 1);
T('depuis ' + APP + ' → rien à annoncer', since(APP).length === 0);
T('depuis une version future → rien', since('99.99').length === 0);

console.log('\n  ' + (ko ? ko + ' erreur(s)' : 'tout vert') + '  ·  bloc ' + WN[0].v + ' :');
(WN[0].items || []).forEach(it => console.log('   ' + it.emoji + '  ' + it.titre));
if (!(WN[0].items || []).length) console.log('   (aucun item : correctif invisible, bump SW seul)');
console.log();
process.exit(ko ? 1 : 0);
