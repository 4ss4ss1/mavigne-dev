// HARNAIS — ACC-1 (§276) : l'Accueil au dessin de la maquette v4 — la grille de 12 colonnes, le cadre commun, Personnaliser.
//   node scripts/mv-harnais-acc1.mjs           → doit être vert
//   node scripts/mv-harnais-acc1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute _homeSpans (extraite par ses accolades) sur de faux blocs : 7 / 5 puis 5 / 7, un bloc large ou seul garde sa rangée.
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
  let r1 = '', r2 = ''; try { r1 = largeurs(S, ['home-w', 'home-w', 'home-w', 'home-w', 'home-w home-w-large', 'home-w', 'home-w home-w-seul']); r2 = largeurs(S, ['home-w', 'home-w home-w-off', 'home-w']); } catch (e) { r1 = 'plantage ' + e.message; }
  T('deux blocs se partagent la rangée, 7 et 5 puis 5 et 7 ; un bloc large ou seul garde la sienne (' + r1 + ')', r1 === '7 5 5 7 - - -');
  T('un bloc masqué ne compte pas hors Personnaliser (' + r2 + ')', r2 === '7 - 5');
  T('chaque appel de _homeRangees est suivi de _homeSpans', (S.app.match(/_homeRangees\(\);(?! _homeSpans\(\);)/g) || []).length === 0 && (S.app.match(/_homeRangees\(\); _homeSpans\(\);/g) || []).length >= 4);
  T('_homeRangees garde son texte (le harnais ALIGN-2 vise sa fin)', S.app.includes("    att=att?null:el;\n  });\n  if(att) att.classList.add('home-w-seul');\n}"));
  T('le bloc ACC-1 est posé après PARC-2, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ ACC-1 (§276)') > S.css.indexOf('★ FIN PARC-2') && dur.length === 0);
  T('sur ordinateur, 12 colonnes et la largeur posée par bloc', B.includes('#page-home #home-cols{ grid-template-columns:repeat(12,minmax(0,1fr));') && B.includes('#page-home #home-cols > .home-w:not(.home-w-large):not(.home-w-seul){ grid-column:span var(--hw-span,6); }'));
  T('les titres de bloc quittent les capitales espacées', B.includes('#page-home .hv2-section-label{ font-family:var(--font-ui)!important; font-size:var(--pt-txt,13px)!important; font-weight:var(--fw-semi,600)!important; letter-spacing:0!important; text-transform:none!important;'));
  T('Personnaliser : bandeau, contour, outils au dessin du kit', B.includes('#page-home .home-edit-banner{ background:var(--accent-doux)!important;') && B.includes('.home-edit .home-w{ border:0!important; outline:var(--bw) dashed var(--ligne-forte);') && B.includes('#page-home .home-w-size.act,#page-home .home-w-larg.act{ background:var(--presse)!important;'));
  T('la projection des pistes du cockpit est un fin pointillé', B.includes('.ck2 .ck-fr-proj,.ck2 .ck-fr-reste{ background:repeating-linear-gradient(to right,var(--encours) 0 var(--e-1,4px),transparent var(--e-1,4px) var(--e-2,8px)) center / 100% var(--bw-2) no-repeat; }'));
  T('le guide dit les deux largeurs d’une rangée', S.guide.includes("l'un est un peu plus large que l'autre, et ça s'inverse d'une rangée à la suivante"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-acc1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-acc1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['les deux largeurs ne s’alternent plus', 'app', 'var g=(paire%2)?[5,7]:[7,5];', 'var g=[7,5];', 0],
    ['un bloc masqué compte encore', 'app', "if((el.classList.contains('home-w-off')&&!homeEditMode)||el.style.display==='none') return;", "if(el.style.display==='none') return;", 1],
    ['un appel oublie _homeSpans', 'app', '  _homeRangees(); _homeSpans();', '  _homeRangees();', 2],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .home-edit-banner{ background:var(--accent-doux)!important;', '#page-home .home-edit-banner{ background:#EAF2E4!important;', 4],
    ['la grille revient à deux colonnes', 'css', '#page-home #home-cols{ grid-template-columns:repeat(12,minmax(0,1fr));', '#page-home #home-cols{ grid-template-columns:repeat(2,minmax(0,1fr));', 5],
    ['les capitales espacées reviennent', 'css', "letter-spacing:0!important; text-transform:none!important; color:var(--texte)!important; }\n#page-home .hv2-voir-tout", "letter-spacing:.1em!important; text-transform:uppercase!important; color:var(--texte)!important; }\n#page-home .hv2-voir-tout", 6],
    ['la projection redevient des blocs', 'css', 'center / 100% var(--bw-2) no-repeat; }', '; }', 8],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-acc1.mjs'],", '', 10]
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
