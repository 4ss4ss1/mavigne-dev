// HARNAIS — RG-1 (§295) : Réglages › Domaine au dessin de la maquette v10 (habit seulement).
//   node scripts/mv-harnais-rg1.mjs           → doit être vert
//   node scripts/mv-harnais-rg1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), rg: L('src/reglages.js'), html: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ RG-1 (§295)'); if (i < 0) return ''; const j = css.indexOf('★ FIN RG-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc RG-1 est posé après RSV-3, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ RG-1 (§295)') > S.css.indexOf('★ FIN RSV-3') && dur.length === 0);
  T('les éléments recalés existent (carte d’identité, sections, vue, ordre des sections)', S.html.includes('id="regl-view-domaine"') && S.html.includes('<div class="set-sec" id="set-row-domaine-nom">') && S.html.includes('<div class="set-sec" id="set-sec-saisons">') && S.html.includes('<div class="set-sec" id="set-sec-donnees">') && S.html.includes('class="dom-badge"'));
  T('switchReglTab écrit bien display:block / none en ligne (la grille s’y appuie)', S.rg.includes("if(view)view.style.display=t===tab?'block':'none';"));
  T('la carte d’identité sur fond clair (plus de vert plein), les titres en casse normale', B.includes('#page-reglages .dom-badge{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px); background:var(--bg-card); color:var(--texte); }') && B.includes('#page-reglages .set-title{ letter-spacing:0; text-transform:none;'));
  T('chaque section en carte, lignes à filet', B.includes('#page-reglages .set-sec > .set-title + div{ border:var(--bw) solid var(--ligne,#E7E6E2);') && B.includes('#page-reglages .set-row{ margin-bottom:0; border-top:var(--bw) solid var(--ligne,#E7E6E2);'));
  T('au large : grille sur la vue visible, « Mon domaine » et « Données » côte à côte, la campagne sur toute la largeur', B.includes('#page-reglages #regl-view-domaine:not([style*="none"]){ display:grid!important;') && B.includes('#page-reglages #regl-view-domaine > #set-row-domaine-nom{ grid-column:1; order:2; }') && B.includes('#page-reglages #regl-view-domaine > #set-sec-donnees{ grid-column:2; order:3; }'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-rg1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rg1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-reglages .sr-arr{ color:var(--texte-doux); }', '#page-reglages .sr-arr{ color:#6E6C66; }', 0],
    ['la page renomme une section', 'html', '<div class="set-sec" id="set-sec-donnees">', '<div class="set-sec" id="set-sec-docs">', 1],
    ['l’onglet ne s’affiche plus en ligne', 'rg', "if(view)view.style.display=t===tab?'block':'none';", "if(view)view.classList.toggle('on',t===tab);", 2],
    ['la carte d’identité repasse en vert', 'css', '#page-reglages .dom-badge{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px); background:var(--bg-card);', '#page-reglages .dom-badge{ border:var(--bw) solid var(--ligne,#E7E6E2); border-radius:var(--r-md,8px);', 3],
    ['les sections perdent leur carte', 'css', '#page-reglages .set-sec > .set-title + div{ border:var(--bw) solid var(--ligne,#E7E6E2);', '#page-reglages .set-sec > .set-title + div{ border:0;', 4],
    ['la grille perd son !important', 'css', '#page-reglages #regl-view-domaine:not([style*="none"]){ display:grid!important;', '#page-reglages #regl-view-domaine:not([style*="none"]){ display:grid;', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rg1.mjs'],", '', 6]
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
