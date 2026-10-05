// HARNAIS — JOURNAL-1 (§248) : le Journal ne met en page que les jours qui se voient, sans changer un pixel.
//   node scripts/mv-harnais-journal1.mjs           → doit être vert
//   node scripts/mv-harnais-journal1.mjs --contre  → chaque défaut réinjecté doit rougir
// content-visibility CONTIENT le groupe de jour : les ombres seraient coupées et les marges ne traverseraient plus le
// groupe. Ce harnais relit les VRAIES valeurs de styles.css (.dgroup, .jitem, .dhead, .j-load-more-btn, .timeline,
// --shadow-sm) et refait les comptes de l'écart entre deux jours, avant « Voir plus », en fin de liste, et la place laissée
// aux ombres. Preuve au pixel et chronométrage dans Chromium : §248c.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE0 = { css: lire('src/styles.css'), app: lire('src/app.js') };
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
// La DERNIÈRE déclaration d'une propriété pour un sélecteur exact (c'est elle qui gagne, à spécificité égale).
function prop(css, sel, nom) {
  const rx = new RegExp('(^|[}\\s])' + sel.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g');
  let m, v = null;
  while ((m = rx.exec(css))) { const d = m[2].split(';').map(x => x.trim()).filter(Boolean); for (const x of d) { const i = x.indexOf(':'); if (x.slice(0, i).trim() === nom) v = x.slice(i + 1).trim(); } }
  return v;
}
const px = v => (v == null ? NaN : parseFloat(v));
// margin / padding raccourcis → [haut, droite, bas, gauche]
function quatre(v) { if (v == null) return [0, 0, 0, 0]; const a = v.split(/\s+/).map(px); return a.length === 1 ? [a[0], a[0], a[0], a[0]] : a.length === 2 ? [a[0], a[1], a[0], a[1]] : a.length === 3 ? [a[0], a[1], a[2], a[1]] : a; }
// Fusion de deux marges adjacentes (CSS 2.1 §8.3.1) : max des positives + min des négatives.
const fusion = (...m) => Math.max(0, ...m.filter(x => x > 0)) + Math.min(0, ...m.filter(x => x < 0));
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  const css = sansCom(B.css);
  const cv = prop(css, '.dgroup', 'content-visibility'), cis = prop(css, '.dgroup', 'contain-intrinsic-size');
  T('un jour hors écran n’est pas mis en page (content-visibility:auto sur .dgroup)', cv === 'auto');
  T('… avec une place réservée qui garde la vraie taille une fois dessiné (contain-intrinsic-size:auto …)', /^auto\s+\d+px$/.test(cis || ''));
  const [gpt, gpr, gpb, gpl] = quatre(prop(css, '.dgroup', 'padding')), [gmt, gmr, gmb, gml] = quatre(prop(css, '.dgroup', 'margin'));
  const mbLot = px(prop(css, '.dgroup:last-of-type', 'margin-bottom')), mbFin = px(prop(css, '.dgroup:last-child', 'margin-bottom'));
  // La marge basse de la DERNIÈRE ligne d'un jour : la règle dédiée si elle existe, sinon celle de toutes les lignes.
  const mbLigne = !isNaN(px(prop(css, '.jitem', 'margin-bottom'))) ? px(prop(css, '.jitem', 'margin-bottom')) : quatre(prop(css, '.jitem', 'margin'))[2];
  const mbDerniere = px(prop(css, '.dgroup>.jitem:last-child', 'margin-bottom'));
  const itemMb = isNaN(mbDerniere) ? mbLigne : mbDerniere;
  const dheadMt = px(prop(css, '.dhead', 'margin-top')), btnMt = quatre(prop(css, '.j-load-more-btn', 'margin'))[0], tlPb = quatre(prop(css, '.timeline', 'padding'))[2];
  // Écarts : le groupe contient ses enfants (leurs marges restent dedans) ; ses propres marges fusionnent avec ses voisins.
  const entreJours = itemMb + gpb + fusion(gmb, gmt) + gpt + dheadMt;
  const avantBouton = itemMb + gpb + fusion(mbLot, btnMt);
  const finDeListe = itemMb + gpb + mbFin + tlPb;
  T('entre deux jours : 20 px, comme avant (dernière carte → en-tête du jour suivant)', entreJours === 20);
  T('avant « Voir plus » : 20 px, comme avant', avantBouton === 20);
  T('en fin de liste : 36 px, comme avant (20 de marge + 16 de rembourrage)', finDeListe === 36);
  T('le contenu ne bouge pas de côté (rembourrage rendu par une marge négative égale)', gpl === -gml && gpr === -gmr && gpl > 0);
  const PAS_E = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40];
  T('toutes les valeurs posées sont sur l’échelle d’espacement (--e-*)', [gpt, gpr, gpb, gpl, gmt, gmr, gmb, gml, mbLot, mbFin, isNaN(mbDerniere) ? 0 : mbDerniere].every(v => PAS_E.includes(Math.abs(v))));
  // La place des ombres : --shadow-sm = « 0 1px 2px …, 0 2px 8px … » ; la plus large décide.
  const ombre = ((css.match(/--shadow-sm\s*:\s*([^;]+);/) || [])[1] || '').split(/,(?![^(]*\))/).map(o => o.trim().split(/\s+/).slice(0, 4).map(px));
  const cote = Math.max(...ombre.map(([x, y, f, e]) => Math.abs(x) + f + (e || 0))), bas = Math.max(...ombre.map(([x, y, f, e]) => y + f + (e || 0)));
  T('les ombres des cartes ne sont pas coupées sur les côtés (rembourrage ≥ flou de l’ombre)', ombre.length > 0 && gpl >= cote && gpr >= cote);
  T('… ni en bas (marge de la dernière ligne + rembourrage ≥ décalage + flou)', itemMb + gpb >= bas);
  T('la place réservée suit le nombre de lignes de chaque jour (renderJournalList)', /<div class="dgroup" style="contain-intrinsic-size:auto \$\{Number\(\d+\+items\.length\*\d+\)\}px">/.test(B.app));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nJOURNAL-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['plus de content-visibility', B => ({ ...B, css: B.css.replace('.dgroup{content-visibility:auto;', '.dgroup{') })],
  ['la place réservée oublie « auto » (taille figée)', B => ({ ...B, css: B.css.replace('contain-intrinsic-size:auto 300px;', 'contain-intrinsic-size:300px;') })],
  ['plus de rembourrage : les ombres sont coupées', B => ({ ...B, css: B.css.replace('padding:0 8px 12px;margin:0 -8px -8px;', 'padding:0 0 12px;margin:0 0 -8px;') })],
  ['la marge négative oubliée : 28 px entre deux jours', B => ({ ...B, css: B.css.replace('padding:0 8px 12px;margin:0 -8px -8px;', 'padding:0 8px 12px;margin:0 -8px 0;') })],
  ['sans la règle du dernier jour avant « Voir plus »', B => ({ ...B, css: B.css.replace('.dgroup:last-of-type{margin-bottom:-4px;}', '') })],
  ['sans la règle de fin de liste', B => ({ ...B, css: B.css.replace('.dgroup:last-child{margin-bottom:8px;}', '') })],
  ['la marge de la dernière ligne réapparaît (6 px de trop entre deux jours)', B => ({ ...B, css: B.css.replace('.dgroup>.jitem:last-child{margin-bottom:0;}', '') })],
  ['une valeur hors échelle (10 px) revient', B => ({ ...B, css: B.css.replace('padding:0 8px 12px;margin:0 -8px -8px;', 'padding:0 10px 12px;margin:0 -10px -8px;') })],
  ['la place n’est plus réservée par jour', B => ({ ...B, app: B.app.replace('<div class="dgroup" style="contain-intrinsic-size:auto ${Number(52+items.length*96)}px">', '<div class="dgroup">') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (B2.css === BASE0.css && B2.app === BASE0.app) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = joue(B2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
