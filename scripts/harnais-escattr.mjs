#!/usr/bin/env node
// ── HARNAIS : L'ECHAPPEMENT D'UN SLOT JS TIENT-IL VRAIMENT ? (lot SEC-7) ─────
//  On ne compte pas des occurrences : on REJOUE ce que fait le navigateur.
//
//  Dans onclick="f('VALEUR')", la chaine parcourt DEUX analyseurs a la suite :
//    1. l'analyseur HTML lit l'attribut et DECODE les entites (&#39; -> ') ;
//    2. le moteur JS compile ce qui en sort.
//  _escHtml protege l'etape 1 et se fait DEFAIRE par elle : son &#39; ressort
//  en apostrophe nue, qui ferme la chaine JS. _escAttr double d'abord
//  l'antislash et l'apostrophe, PUIS traite le HTML — l'ordre est le tout.
//
//  Le harnais extrait les DEUX fonctions du vrai src/utils.js (aucune copie),
//  les applique a des valeurs hostiles, rejoue le decodage HTML, et verifie :
//    · la chaine JS reste FERMEE au bon endroit (pas d'evasion) ;
//    · la fonction appelee recoit la valeur D'ORIGINE, intacte.
//  ⚠️ Et il exige que _escHtml ECHOUE ce meme test : un harnais que les deux
//  echappeurs passent ne prouverait rien.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url));   // ⚠️ jamais new URL().pathname (§53)
const RACINE = join(ICI, '..');
const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };

// ── extraction des vraies fonctions, pas d'une recopie ──────────────────────
const utils = readFileSync(join(RACINE, 'src', 'utils.js'), 'utf8');
function extraire(nom) {
  const i = utils.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error(nom + ' introuvable dans src/utils.js');
  let d = 0, j = utils.indexOf('{', i);
  for (let k = j; k < utils.length; k++) {
    if (utils[k] === '{') d++;
    else if (utils[k] === '}') { d--; if (!d) { j = k; break; } }
  }
  return utils.slice(i, j + 1);
}
const _escHtml = new Function(extraire('_escHtml') + '; return _escHtml;')();
const _escAttr = new Function(extraire('_escAttr') + '; return _escAttr;')();

// ── ce que fait l'analyseur HTML sur la valeur d'un attribut ────────────────
function decodeHtml(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
          .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
}
// Le moteur JS lit 'XXX' : ou se termine reellement la chaine, et que vaut-elle ?
// Rend { evasion:bool, recu:string|null }.
function lireChaineJs(apresDecodage) {
  let out = '', i = 0;
  while (i < apresDecodage.length) {
    const ch = apresDecodage[i];
    if (ch === '\\') { out += apresDecodage[i + 1] ?? ''; i += 2; continue; }
    if (ch === "'") return { evasion: i !== apresDecodage.length - 1, recu: out, reste: apresDecodage.slice(i + 1) };
    out += ch; i++;
  }
  return { evasion: true, recu: null, reste: '' };          // chaine jamais fermee
}
// La chaine complete telle qu'elle est ECRITE dans le HTML, valeur comprise.
function slot(esc, valeur) { return esc(valeur) + "'"; }    // …f('  + VALEUR + ')…

const HOSTILES = [
  { nom: "apostrophe simple (un nom de parcelle : « Clos d'Or »)", v: "Clos d'Or" },
  { nom: "★ evasion et appel de fonction", v: "'+alert(1)+'" },
  { nom: "antislash avant l'apostrophe (neutralise un echappement naif)", v: "a\\'+alert(1)+'" },
  { nom: "guillemet double (fermerait l'attribut lui-meme)", v: 'a" onmouseover="alert(1)' },
  { nom: "chevrons (sortie de balise)", v: '</button><img src=x onerror=alert(1)>' },
  { nom: "esperluette (double decodage)", v: '&#39;+alert(1)+&#39;' },
  { nom: "valeur banale, doit traverser INTACTE", v: 'Vris Bas' },
  { nom: "accents et espaces", v: 'Cuve n\u00b03 \u2014 \u00e9levage' },
];

console.log(c.b('\n  HARNAIS SEC-7 — un slot onclick tient-il apres decodage HTML ?\n'));
let ok = 0, ko = 0;

console.log(c.b('  _escAttr — doit TOUT tenir'));
for (const t of HOSTILES) {
  const rendu = decodeHtml(slot(_escAttr, t.v));
  const { evasion, recu } = lireChaineJs(rendu);
  const bon = !evasion && recu === t.v;
  if (bon) { ok++; console.log('    ' + c.g('✓') + ' ' + t.nom); }
  else {
    ko++;
    console.log('    ' + c.r('✗') + ' ' + t.nom);
    console.log(c.d(`        attendu « ${t.v} » · recu « ${recu} »` + (evasion ? ' · EVASION' : '')));
  }
}

console.log(c.b('\n  _escHtml au meme endroit — doit ECHOUER (sinon ce harnais ne prouve rien)'));
let tenus = 0;
for (const t of HOSTILES) {
  if (!/['\\]/.test(t.v)) continue;                          // seules les valeurs a apostrophe/antislash sont discriminantes
  const rendu = decodeHtml(slot(_escHtml, t.v));
  const { evasion, recu } = lireChaineJs(rendu);
  const casse = evasion || recu !== t.v;
  if (casse) { ok++; console.log('    ' + c.g('✓') + ' ' + t.nom + c.d('  → casse, comme attendu' + (evasion ? ' (EVASION)' : ''))); }
  else { ko++; tenus++; console.log('    ' + c.r('✗') + ' ' + t.nom + c.d('  → _escHtml a TENU : l\'assertion ne discrimine pas')); }
}
if (tenus) console.log(c.r('\n  ⚠️ _escHtml passe le test : le harnais est faux, pas le code.'));

// ── et le contexte TEXTE, lui, doit rester a _escHtml ───────────────────────
console.log(c.b('\n  Contexte TEXTE — _escHtml y reste le bon outil'));
for (const v of ["<b>x</b>", "a & b", 'guillemet "', "apostrophe '"]) {
  const r = _escHtml(v);
  const bon = !/[<>]/.test(r) && decodeHtml(r) === v;
  if (bon) { ok++; console.log('    ' + c.g('✓') + ' ' + JSON.stringify(v)); }
  else { ko++; console.log('    ' + c.r('✗') + ' ' + JSON.stringify(v) + c.d(' → ' + r)); }
}

console.log('\n' + (ko === 0 ? c.g(`  ✓ ${ok} assertions vertes`) : c.r(`  ✗ ${ko} assertion(s) rouge(s) sur ${ok + ko}`)) + '\n');
process.exit(ko === 0 ? 0 : 1);
