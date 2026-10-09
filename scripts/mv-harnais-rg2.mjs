// HARNAIS — RG-2 (§296) : Réglages › Équipe et Moi au dessin de la maquette v10 (habit seulement).
//   node scripts/mv-harnais-rg2.mjs           → doit être vert
//   node scripts/mv-harnais-rg2.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), rg: L('src/reglages.js'), html: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ RG-2 (§296)'); if (i < 0) return ''; const j = css.indexOf('★ FIN RG-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('le bloc RG-2 est posé après RG-1, par jetons seulement (' + dur.length + ')', B.length > 2000 && S.css.indexOf('★ RG-2 (§296)') > S.css.indexOf('★ FIN RG-1') && dur.length === 0);
  T('le rendu produit bien les classes recalées (carte de membre, rôles, alertes, vue « Moi »)', S.rg.includes('membre-card') && S.rg.includes('m-role-badge') && S.rg.includes("id='contrats-alertes'") && S.html.includes('id="membres-list"') && S.html.includes('id="regl-view-app"'));
  T('les membres en lignes dans une carte, l’avatar neutre, le nom en Outfit', B.includes('#page-reglages #membres-list{ border:var(--bw) solid var(--ligne,#E7E6E2);') && B.includes('#page-reglages .membre-card{ margin:0; border:0; border-top:var(--bw) solid var(--ligne,#E7E6E2);') && B.includes('#page-reglages .m-ava{ border-radius:var(--r-full,999px); background:var(--presse)!important;'));
  T('les rôles au kit, l’admin à l’accent ; « Ajouter un membre » à l’accent', B.includes('#page-reglages .m-role-badge.rb-admin{ background:var(--accent-doux); color:var(--accent-texte); }') && B.includes('#regl-view-equipe .mbtn.verte{ border:0; border-radius:var(--r-sm,6px); background:var(--accent);'));
  T('le cadre des alertes de contrat caché tant qu’il est vide (sinon un trait vide sous le titre)', B.includes('#page-reglages #contrats-alertes:empty{ display:none; }'));
  T('la zone dangereuse bordée de rouge ; au large, les sections de « Moi » par deux sur la vue visible', B.includes('#page-reglages .set-sec-danger > .set-title + div{ border-color:var(--danger); }') && B.includes('#page-reglages #regl-view-app:not([style*="none"]){ display:grid!important;'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-rg2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-rg2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc', 'css', '#page-reglages .m-statut{ color:var(--texte-doux); }', '#page-reglages .m-statut{ color:#6E6C66; }', 0],
    ['la page perd la liste des membres', 'html', 'id="membres-list"', 'id="membres"', 1],
    ['les membres redeviennent des cartes', 'css', '#page-reglages .membre-card{ margin:0; border:0; border-top:var(--bw) solid var(--ligne,#E7E6E2);', '#page-reglages .membre-card{ margin:0;', 2],
    ['l’admin perd sa couleur', 'css', '#page-reglages .m-role-badge.rb-admin{ background:var(--accent-doux); color:var(--accent-texte); }', '', 3],
    ['le cadre vide reste affiché', 'css', '#page-reglages #contrats-alertes:empty{ display:none; }', '', 4],
    ['la zone dangereuse perd son rouge', 'css', '#page-reglages .set-sec-danger > .set-title + div{ border-color:var(--danger); }', '', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-rg2.mjs'],", '', 6]
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
