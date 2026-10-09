// HARNAIS — RSV-1 (§292) : la Réserve › Fûts au dessin de la maquette v9 (habit seulement).
//   node scripts/mv-harnais-rsv1.mjs           → doit être vert
//   node scripts/mv-harnais-rsv1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), rsv: L('src/reserve.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ RSV-1 (§292)'); if (i < 0) return ''; const j = css.indexOf('★ FIN RSV-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc RSV-1 est posé après CAVE-4, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ RSV-1 (§292)') > S.css.indexOf('★ FIN CAVE-4') && dur.length === 0);
  T('le rendu des Fûts produit bien les classes recalées (bande, bouton, filtre, fournisseur, lots)', S.rsv.includes('<div class="mvr-kpis">') && S.rsv.includes('<button class="mvr-btn mvr-btn-p" onclick="_rsvOpenFut()">+ Ajouter des fûts</button>') && S.rsv.includes("'<button class=\"mvr-fchip'+(_rsvFutYear==='__all__'?' on':'')+'\"") && S.rsv.includes("'<div class=\"mvr-sgrp'+(open?' open':'')+'\">'") && S.rsv.includes('<div class="mvr-sgpad">'));
  T('la carte du parc sur fond clair, le chiffre en Outfit (plus de noir cave)', B.includes('#page-reserve .mvr-parc{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px); background:var(--bg-card);') && B.includes('#page-reserve .mvr-parc-n{ font-family:var(--font-ui);'));
  T('la bande en trois cases, « Ajouter des fûts » à l’accent, le millésime choisi à l’accent', B.includes('#page-reserve .mvr-kpis{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr));') && B.includes('#page-reserve .mvr-btn-p{ border:0; border-radius:var(--r-sm,6px); background:var(--accent);') && B.includes('#page-reserve .mvr-fchip.on{ border-color:var(--accent); background:var(--accent-doux);'));
  T('au large, la Réserve prend la largeur (fin des 760 px) et les lots vont par deux', B.includes('#page-reserve .mvr-body{ max-width:none; }') && B.includes('#page-reserve .mvr-sgpad{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr));') && /\.mvr-body\s*\{[^}]*max-width:\s*760px/.test(S.css));
  T('les cartes venues du Pilotage (part des anges, pyramide) au cadre neutre, titres en casse normale', B.includes('#page-reserve .pcav-card{') && B.includes('#page-reserve .pcav-t{ font-size:var(--pt-micro,12px); letter-spacing:0; text-transform:none;'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-rsv1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rsv1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-reserve .mvr-fchip.on{ border-color:var(--accent);', '#page-reserve .mvr-fchip.on{ border-color:#7A2048;', 0],
    ['le rendu renomme ses fournisseurs', 'rsv', "'<div class=\"mvr-sgrp'+(open?' open':'')+'\">'", "'<div class=\"mvr-four'+(open?' open':'')+'\">'", 1],
    ['le parc repasse en noir', 'css', '#page-reserve .mvr-parc{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px); background:var(--bg-card);', '#page-reserve .mvr-parc{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px);', 2],
    ['« Ajouter des fûts » perd l’accent', 'css', '#page-reserve .mvr-btn-p{ border:0; border-radius:var(--r-sm,6px); background:var(--accent);', '#page-reserve .mvr-btn-p{ border:0; border-radius:var(--r-sm,6px);', 3],
    ['la Réserve reste sur 760 px au large', 'css', '  #page-reserve .mvr-body{ max-width:none; }\n', '', 4],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rsv1.mjs'],", '', 6]
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
