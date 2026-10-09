// HARNAIS — PLAN-3 (§281) : les feuilles du Planning et le récapitulatif annuel à la charte (habit seulement).
//   node scripts/mv-harnais-plan3.mjs           → doit être vert
//   node scripts/mv-harnais-plan3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), pl: L('src/planning.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PLAN-3 (§281)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PLAN-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc PLAN-3 est posé après PLAN-2, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ PLAN-3 (§281)') > S.css.indexOf('★ FIN PLAN-2') && dur.length === 0);
  T('les en-têtes des feuilles sont clairs (feuilles communes, chaleur, journée)', B.includes('.overlay .pl2-sh-hdr,.overlay .pl2-sh-hdr.pl2-sh-heat{ background:var(--bg-card)!important;') && B.includes('#ovPlanDay .plan-modal-hdr{ background:var(--bg-card)!important;'));
  T('les champs, la note et les boutons prennent le kit (principal à l’accent)', B.includes('.overlay .pl2-sh-body input:not([type="checkbox"]):not([type="radio"])') && B.includes('.overlay .pl2-note{') && B.includes('.overlay .pl2-ed-btn,.overlay .pl2-ed-heat{ border:0!important; border-radius:var(--r-sm,6px)!important; background:var(--accent)!important;'));
  T('le salarié choisi dans la journée est marqué à l’accent', B.includes('#ovPlanDay .pl2-ms.on{ border-color:var(--accent)!important;'));
  T('le récap annuel : titre en casse normale, le mois en cours (sa barre n’est pas grise) à l’accent', B.includes('#page-planning .plan-card-lbl{') && B.includes('text-transform:none!important;') && B.includes('#page-planning .plan-bar-fill:not([style*="gris-clair"]){ background:var(--accent)!important; }'));
  T('la règle du mois en cours tient : les autres mois sont peints en gris-clair par planning.js', S.pl.includes("background:'+(act?PLAN_ACC2:'var(--gris-clair)')+'"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-plan3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-plan3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#ovPlanDay .plan-modal-hdr{ background:var(--bg-card)!important;', '#ovPlanDay .plan-modal-hdr{ background:#2A2550!important;', 0],
    ['la journée garde sa bande violette', 'css', '#ovPlanDay .plan-modal-hdr{ background:var(--bg-card)!important;', '#ovPlanDay .plan-modal-hdr{ color:var(--texte)!important;', 1],
    ['le bouton principal reste orange', 'css', '.overlay .pl2-ed-btn,.overlay .pl2-ed-heat{ border:0!important; border-radius:var(--r-sm,6px)!important; background:var(--accent)!important;', '.overlay .pl2-ed-btn,.overlay .pl2-ed-heat{ border:0!important; border-radius:var(--r-sm,6px)!important;', 2],
    ['le salarié choisi n’est plus marqué', 'css', '#ovPlanDay .pl2-ms.on{ border-color:var(--accent)!important;', '#ovPlanDay .pl2-ms.off{ border-color:var(--accent)!important;', 3],
    ['planning.js ne peint plus les autres mois en gris-clair', 'pl', "background:'+(act?PLAN_ACC2:'var(--gris-clair)')+'", "background:'+(act?PLAN_ACC2:'var(--gris)')+'", 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-plan3.mjs'],", '', 6]
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
