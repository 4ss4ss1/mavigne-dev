// HARNAIS — PHYTO-3 (§287) : la Fertilisation à la charte (habit seulement) et le bouton « Saisir un amendement ».
//   node scripts/mv-harnais-phyto3.mjs           → doit être vert
//   node scripts/mv-harnais-phyto3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), ph: L('src/phyto.js'), html: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PHYTO-3 (§287)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PHYTO-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function boutton(S, cat, fer, admin, tract) {
  const nb = { textContent: '', style: {} };
  const i = S.ph.indexOf("  var _nb=document.getElementById('ph-new-btn');"); const j = S.ph.indexOf('\n', i);
  new Function('document', 'isCat', 'isFer', 'isAdmin', 'isTractoriste', S.ph.slice(i, j))({ getElementById: () => nb }, cat, fer, () => admin, () => tract);
  return nb;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}, c = {}, d = {}; try { a = boutton(S, false, true, true, false); b = boutton(S, false, true, false, true); c = boutton(S, false, false, false, true); d = boutton(S, true, false, true, true); } catch (e) { a = { erreur: e.message, style: {} }; }
  T('sur la Fertilisation, « Saisir un amendement », pour l’admin seulement', a.textContent === 'Saisir un amendement' && a.style.display === '' && b.style.display === 'none');
  T('sur le Registre, « Saisir un traitement » pour un tractoriste ; rien sur le Catalogue', c.textContent === 'Saisir un traitement' && c.style.display === '' && d.style.display === 'none');
  T('le bouton passe par _phytoFab (qui choisit selon l’onglet)', S.html.includes('id="ph-new-btn" onclick="_phytoFab()"') && S.ph.includes("if(_phytoTab==='fer') openOvFerti(); else openOvTraitement();"));
  T('le bloc PHYTO-3 est posé après PHYTO-2, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ PHYTO-3 (§287)') > S.css.indexOf('★ FIN PHYTO-2') && dur.length === 0);
  T('la feuille fer-* recalée par une spécificité plus forte, page et fenêtres d’amendement', B.includes(':is(#page-phyto,#ovFerti,#ovFerParc) .fer-c{') && B.includes(':is(#page-phyto,#ovFerti,#ovFerParc) .fer-chip.zv{ background:var(--accent-doux);'));
  T('les cartes par deux au large, la liste du contrôle sur toute la largeur', B.includes('#page-phyto #tab-fer-trac{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr));') && B.includes('#page-phyto #tab-fer-trac > .fer-c:has(.fer-cf){ grid-column:1 / -1; }'));
  T('« Imprimer le cahier » à l’accent', B.includes('#page-phyto #tab-fer-trac button[onclick*="_ferExportPdf"]{') && S.ph.includes('onclick="_ferExportPdf()">Imprimer le cahier'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-phyto3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-phyto3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['l’amendement s’ouvre à un tractoriste', 'ph', "(isFer?isAdmin():(isAdmin()||isTractoriste()))", "(isFer?(isAdmin()||isTractoriste()):(isAdmin()||isTractoriste()))", 0],
    ['le libellé ne change plus selon l’onglet', 'ph', "_nb.textContent=isFer?'Saisir un amendement':'Saisir un traitement';", "_nb.textContent='Saisir un traitement';", 0],
    ['le bouton s’affiche sur le Catalogue', 'ph', "(isCat?false:", "(isCat?true:", 1],
    ['le bouton ouvre toujours un traitement', 'html', 'id="ph-new-btn" onclick="_phytoFab()"', 'id="ph-new-btn" onclick="openOvTraitement()"', 2],
    ['une couleur écrite en dur dans le bloc', 'css', ':is(#page-phyto,#ovFerti,#ovFerParc) .fer-fil{ background:var(--ok); }', ':is(#page-phyto,#ovFerti,#ovFerParc) .fer-fil{ background:#3D6B27; }', 3],
    ['la liste du contrôle reste sur une colonne', 'css', '  #page-phyto #tab-fer-trac > .fer-c:has(.fer-cf){ grid-column:1 / -1; }\n', '', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-phyto3.mjs'],", '', 7]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
