// HARNAIS — ACC-1 (§276) : l'Accueil au dessin de la maquette v4 — la grille de 12 colonnes, le cadre commun, Personnaliser.
//   node scripts/mv-harnais-acc1.mjs           → doit être vert
//   node scripts/mv-harnais-acc1.mjs --contre  → chaque défaut réinjecté doit rougir
// ACCV-3 (§418) : les largeurs 7 / 5 (_homeSpans) sont retirées ; le harnais tient ce retrait et le reste du bloc ACC-1.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ ACC-1 (§276)'); if (i < 0) return ''; const j = css.indexOf('★ FIN ACC-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function faux(cls) { const st = { display: '', props: {}, setProperty(k, v) { this.props[k] = v; }, removeProperty(k) { delete this.props[k]; } }; return { classList: { contains: (c) => cls.split(' ').includes(c) }, style: st }; }
function largeurs(S, specs) {
  const els = specs.map(faux), doc = { getElementById: () => ({ children: els }) };
  new Function('document', 'homeEditMode', fonction(S.app, 'function _homeSpans(){') + '\n_homeSpans();')(doc, false);
  return els.map((e) => e.style.props['--hw-span'] || '-').join(' ');
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('ACCV-3 (§418) : les largeurs 7 / 5 sont retirées — plus de _homeSpans, l’ordre suit la journée', !S.app.includes('function _homeSpans(') && !/_homeSpans\(/.test(S.app));
  T('_homeRangees reste appelée après les commandes de Personnaliser', S.app.includes('  _homeRenderGrips(lay);\n  _homeRangees();\n'));
  T('_homeRangees garde son texte (le harnais ALIGN-2 vise sa fin)', S.app.includes("    att=att?null:el;\n  });\n  if(att) att.classList.add('home-w-seul');\n}"));
  T('le bloc ACC-1 est posé après PARC-2, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ ACC-1 (§276)') > S.css.indexOf('★ FIN PARC-2') && dur.length === 0);
  T('sur ordinateur, 12 colonnes et la largeur posée par bloc', B.includes('#page-home #home-cols{ grid-template-columns:repeat(12,minmax(0,1fr));') && B.includes('#page-home #home-cols > .home-w:not(.home-w-large):not(.home-w-seul){ grid-column:span var(--hw-span,6); }'));
  T('les titres de bloc quittent les capitales espacées', B.includes('#page-home .hv2-section-label{ font-family:var(--font-ui)!important; font-size:var(--pt-txt,13px)!important; font-weight:var(--fw-semi,600)!important; letter-spacing:0!important; text-transform:none!important;'));
  T('Personnaliser : bandeau, contour, outils au dessin du kit', B.includes('#page-home .home-edit-banner{ background:var(--accent-doux)!important;') && B.includes('.home-edit .home-w{ border:0!important; outline:var(--bw) dashed var(--ligne-forte);') && B.includes('#page-home .home-w-size.act,#page-home .home-w-larg.act{ background:var(--presse)!important;'));
  T('la projection des pistes du cockpit est un fin pointillé', B.includes('.ck2 .ck-fr-proj,.ck2 .ck-fr-reste{ background:repeating-linear-gradient(to right,var(--encours) 0 var(--e-1,4px),transparent var(--e-1,4px) var(--e-2,8px)) center / 100% var(--bw-2) no-repeat; }'));
  T('le guide dit que chaque carte garde la largeur de sa colonne (ACCV-3)', S.guide.includes('chaque carte garde la largeur de sa colonne'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-acc1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-acc1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['_homeSpans revient', 'app', 'function _homeRangees(){', 'function _homeSpans(){}\nfunction _homeRangees(){', 0],
    ['Personnaliser n’appelle plus _homeRangees', 'app', '  _homeRenderGrips(lay);\n  _homeRangees();\n', '  _homeRenderGrips(lay);\n', 1],
    ['_homeRangees perd sa fin', 'app', "  if(att) att.classList.add('home-w-seul');\n}", '\n}', 2],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .home-edit-banner{ background:var(--accent-doux)!important;', '#page-home .home-edit-banner{ background:#EAF2E4!important;', 3],
    ['la grille revient à deux colonnes', 'css', '#page-home #home-cols{ grid-template-columns:repeat(12,minmax(0,1fr));', '#page-home #home-cols{ grid-template-columns:repeat(2,minmax(0,1fr));', 4],
    ['les capitales espacées reviennent', 'css', "letter-spacing:0!important; text-transform:none!important; color:var(--texte)!important; }\n#page-home .hv2-voir-tout", "letter-spacing:.1em!important; text-transform:uppercase!important; color:var(--texte)!important; }\n#page-home .hv2-voir-tout", 5],
    ['la projection redevient des blocs', 'css', 'center / 100% var(--bw-2) no-repeat; }', '; }', 7],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-acc1.mjs'],", '', 9]
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
