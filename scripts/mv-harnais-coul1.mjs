// HARNAIS — COUL-1 (§297) : les teintes et leurs fonds pâles un cran plus francs, le fond de page un peu plus soutenu, sans perdre
//   un point de contraste de lecture ni l'invariant « --ligne dérive de --gris-clair ».
//   node scripts/mv-harnais-coul1.mjs           → doit être vert
//   node scripts/mv-harnais-coul1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), liste: L('scripts/mv-harnais-liste.mjs') };
const n = (css, s) => css.split(s).length - 1;
function hexL(h) { const c = h.replace('#', ''); const v = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
const ratio = (a, b) => { const A = hexL(a), B = hexL(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
function suite(S) {
  const out = []; const T = (n0, c) => out.push([n0, !!c]); const C = S.css;
  T('clair : le fond de page passe à #F0EEE9 (les cartes blanches s’en détachent), le cockpit suit', /--bg-app\s*:\s*#F0EEE9/.test(C) && !/--bg-app\s*:\s*#F5F5F3/.test(C) && !/--bg-app\s*:\s*#F2EFE7/.test(C));
  T('clair : les fonds pâles un cran plus soutenus (accent .11, ok .15, ambre .15, rouge .13)', n(C, '--accent-doux:rgba(122,40,80,.11)') + n(C, '--accent-doux: rgba(122,40,80,.11)') === 1 && /--ok-doux\s*:\s*rgba\(35,122,71,\.15\)/.test(C) && /--attention-doux\s*:\s*rgba\(161,92,0,\.15\)/.test(C) && /--danger-doux\s*:\s*rgba\(194,56,27,\.13\)/.test(C));
  T('clair : les teintes un cran plus franches et toujours lisibles sur blanc (≥ 4,5)', ['#237A47', '#A15C00', '#C2381B'].every((h) => C.includes(h) && ratio(h, '#FFFFFF') >= 4.5));
  T('clair : le texte doux reste lisible sur le nouveau fond (≥ 4,5)', /--texte-doux\s*:\s*#686660/.test(C) && ratio('#686660', '#F0EEE9') >= 4.5);
  T('sombre (les deux blocs) : fonds pâles .15 / .17, teintes plus vives', (C.match(/--ok-doux\s*:\s*rgba\(118,201,149,\.17\)/g) || []).length === 2 && (C.match(/--accent-doux\s*:\s*rgba\(229,154,189,\.15\)/g) || []).length === 2 && (C.match(/--danger\s*:\s*#F28B6A/g) || []).length === 2);
  T('invariants gardés : --ligne dérive toujours de --gris-clair, --gris-clair et la carte sombre n’ont pas bougé (ils servent de fond à du texte doux)', n(C, '--ligne:var(--gris-clair,#E7E6E2)') === 1 && n(C, '--ligne:var(--gris-clair,#272624)') === 2 && n(C, '--gris-clair:#E7E6E2;') === 1 && n(C, '--gris-clair:#272624;') === 2 && (C.match(/--bg-card\s*:\s*#151514/g) || []).length === 2);
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-coul1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-coul1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n0, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n0); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le fond revient au gris d’avant', 'css', '--bg-app:#F0EEE9', '--bg-app:#F5F5F3', 0],
    ['un fond pâle retombe', 'css', 'rgba(35,122,71,.15)', 'rgba(35,122,71,.08)', 1],
    ['une teinte trop claire pour être lue sur blanc', 'css', '#A15C00', '#C8902E', 2],
    ['le gris des filets est foncé (il sert aussi de fond au texte doux)', 'css', '--gris-clair:#E7E6E2;', '--gris-clair:#E1DED7;', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-coul1.mjs'],", '', 6]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].split(de).join(vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
