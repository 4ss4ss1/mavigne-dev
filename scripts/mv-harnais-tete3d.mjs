/* ───────────────────────────────────────────────────────
   HARNAIS — TETE-3D (§482) : LA BANDE CAMPAGNE/DATE, SOUS L'EN-TÊTE, RETROUVE SA FORME
   Lancer :          node scripts/mv-harnais-tete3d.mjs
   Contre-épreuves : node scripts/mv-harnais-tete3d.mjs --contre

   POURQUOI IL EXISTE
   TETE-3B (§474) a sorti la bande campagne/date des en-têtes. Ce qui lui donnait sa forme — TETE-1 (§272) et TETE-2 (§329),
   « body .mod-header .X » — ne la visait plus : la date est retombée en graisse 300 (le gabarit du Pilotage a rougi en CI dès
   tete3c, run #326), la saison sur deux lignes au téléphone, la date longue à côté de la météo du Pilotage, « Aide » en toutes
   lettres, la température en Cormorant. Et la pastille blanche que TETE-3B croyait poser ne s'est jamais affichée : une règle
   d'UI-3 en !important la peignait en gris. Aucun des contrôles qui lisent les sources ne l'a vu.
   Ce harnais garde, dans le bloc TETE-2 (le dernier de la feuille, il l'emporte), chaque règle de la ligne du jour visée à la
   nouvelle place (« body .mod-header + .mod-meta-row ») ; la peau de TETE-3B (blanche, filet fin, l'ambre d'une campagne passée
   gardé) ; et que test:ux, qui joue le build en CI, porte la règle au rendu et sa contre-épreuve. Ce qu'il ne voit pas : l'écran
   — c'est le travail de test:ux (20 vues, téléphone et ordinateur).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { css: lire('src/styles.css'), ban: lire('src/bandeau.css'), ux: lire('scripts/mv-ux-rendu.mjs'), ci: lire('.github/workflows/ci.yml'), liste: lire('scripts/mv-harnais-liste.mjs') };
const N = 'body .mod-header + .mod-meta-row';
function bloc(css) { const i = css.indexOf('★ TETE-2 (§329)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TETE-2', i); return j < 0 ? '' : css.slice(i, j); }
function telephone(b) { const i = b.indexOf('@media (max-width:600px){'); if (i < 0) return ''; const j = b.indexOf('\n}', i); return j < 0 ? '' : b.slice(i, j); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function jouer(S) {
  const B = bloc(S.css), T = telephone(B);
  // ★ MOTS-18 (§618) : la « nouvelle place » de TETE-3D (sous l'en-tête, N) n'existe plus depuis TETE-4A (§577) — la ligne du jour
  //   vit dans l'en-tête, aucune page ne la pose plus dessous (relevé : 0 élément visé, 15 pages × 3 tailles). Les règles écrites
  //   pour N seulement sont parties ; celles qui visaient AUSSI l'en-tête restent, sans N. Le contrôle suit ce qui reste.
  const SC = B.replace(/\/\*[\s\S]*?\*\//g, '');
  t('① la ligne du jour, dans l’en-tête : une seule ligne, chaque morceau entier, la date en 400 avec « … », cachée à côté de la météo',
    B.includes('body .mod-header .mod-meta-row{ flex-wrap:nowrap;') && B.includes('body .mod-header .mod-meta-row > *{ flex-shrink:0; }')
    && B.includes('body .mod-header .hv2-saison-pill > span,body .mod-header .hv2-meteo-mini,body .mod-header .mv-help-btn{ white-space:nowrap; }')
    && B.includes('body .mod-header .hv2-date{ flex-shrink:1!important; min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-weight:var(--fw-reg,400)!important;')
    && B.includes('body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-date,body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-sep{ display:none!important; }'));
  t('② la saison à 28 px ; plus aucune règle pour la place « sous l’en-tête » (MOTS-18 : 0 élément visé)',
    B.includes('body .mod-header .hv2-saison-pill{ height:var(--h-sm,28px)!important;') && !SC.includes(N));
  t('③ la température en Outfit à chiffres droits, dans l’en-tête',
    B.includes('body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-ui)!important;') && B.includes('font-variant-numeric:lining-nums tabular-nums;'));
  t('④ « ? Aide » à sa forme de TETE-2, dans l’en-tête',
    B.includes('body .mod-header .mv-help-btn{ height:var(--h-sm,28px); min-height:0;'));
  // ★ MOTS-18 (§618) : la pastille blanche et la campagne qui cède en « … » vivent dans l'en-tête — bandeau.css (TETE-4A, §577) ;
  //   leurs règles « sous l'en-tête » (styles.css) sont parties. Une campagne passée garde son ambre.
  t('⑤ la pastille saison blanche à filet fin dans l’en-tête (bandeau.css) ; une campagne passée garde son ambre ; plus de règle « sous l’en-tête »',
    S.ban.includes('body .mod-header-top > .mod-meta-row .hv2-saison-pill:not(.consult){ background:var(--bg-card,#FFFFFF)!important;')
    && S.css.includes('.hv2-saison-pill.consult{ background:rgba(200,135,30,.14)!important;') && !/\.mod-header \+ \.mod-meta-row/.test(S.css.replace(/\/\*[\s\S]*?\*\//g, '')));
  t('⑥ la campagne cède en « … » dans l’en-tête (bandeau.css)',
    S.ban.includes('body .mod-header-top > .mod-meta-row .hv2-saison-pill > span:not(.hv2-dot):not(.hv2-sc-chev){ min-width:0; overflow:hidden; text-overflow:ellipsis;'));
  t('⑦ test:ux, joué sur le build en CI, porte la règle de la bande sur les vingt vues et sa contre-épreuve (deux défauts posés)',
    S.ux.includes('const BANDE = (tel) => {') && S.ux.includes('if (!m.connexion && !m.absente) m.bande = await page.evaluate(BANDE, ecran.tel);')
    && S.ux.includes("t('la bande campagne/date garde sa forme sur les ' + nbReleve + ' pages")
    && S.ux.includes("'journal › téléphone › bande', 'pilotage › téléphone › bande'];")
    && S.ux.includes("+ '#page-journal .mod-header-top > .mv-help-btn{width:auto!important;font-size:12px!important;")
    && S.ux.includes("+ '#page-pilotage .mod-header + .mod-meta-row .mv-help-btn{width:auto!important;font-size:12px!important;")
    && /run: npm run test:ux\b/.test(S.ci));
  t('⑧ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-tete3d.mjs'") > 0 && S.liste.indexOf("mv-harnais-tete3d.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    // ★ MOTS-18 (§618) : les défauts suivent ce qui reste — l'en-tête (styles.css sans N, et bandeau.css)
    ['la date perd sa graisse 400 et son « … »', m('css', 'body .mod-header .hv2-date{ flex-shrink:1!important; min-width:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-weight:var(--fw-reg,400)!important;', 'body .mod-header .hv2-date{ flex-shrink:1!important;')],
    ['la ligne repasse à la ligne', m('css', 'body .mod-header .mod-meta-row{ flex-wrap:nowrap;', 'body .mod-header .mod-meta-row{ flex-wrap:wrap;')],
    ['la date longue revient à côté de la météo', m('css', 'body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-date,body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-sep{ display:none!important; }', '')],
    ['la saison retombe sur deux lignes (plus de 28 px)', m('css', 'body .mod-header .hv2-saison-pill{ height:var(--h-sm,28px)!important;', 'body .mod-header .hv2-saison-pill{')],
    ['une règle « sous l’en-tête » revient', m('css', 'body .mod-header .mod-meta-row > *{ flex-shrink:0; }', N + ' .hv2-dot{ background:var(--ok)!important; }\nbody .mod-header .mod-meta-row > *{ flex-shrink:0; }')],
    ['la température repasse en Cormorant', m('css', 'body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-ui)!important;', 'body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-display)!important;')],
    ['« Aide » perd sa forme de TETE-2', m('css', 'body .mod-header .mv-help-btn{ height:var(--h-sm,28px); min-height:0;', 'body .mod-header .mv-help-btn{ min-height:0;')],
    ['la pastille saison redevient grise dans l’en-tête', m('ban', 'body .mod-header-top > .mod-meta-row .hv2-saison-pill:not(.consult){ background:var(--bg-card,#FFFFFF)!important;', 'body .mod-header-top > .mod-meta-row .hv2-saison-pill:not(.consult){ background:var(--gris-clair)!important;')],
    ['à côté de la météo, la campagne ne cède plus', m('ban', 'body .mod-header-top > .mod-meta-row .hv2-saison-pill > span:not(.hv2-dot):not(.hv2-sc-chev){ min-width:0; overflow:hidden; text-overflow:ellipsis;', 'body .mod-header-top > .mod-meta-row .hv2-saison-pill > span:not(.hv2-dot):not(.hv2-sc-chev){ min-width:0;')],
    ['test:ux ne lit plus la bande', m('ux', 'if (!m.connexion && !m.absente) m.bande = await page.evaluate(BANDE, ecran.tel);', '')],
    ['la contre-épreuve de test:ux ne vise plus la bande', m('ux', ", 'journal › téléphone › bande', 'pilotage › téléphone › bande'];", '];')],
    ['la CI ne joue plus test:ux', m('ci', 'run: npm run test:ux', 'run: echo test:ux')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-tete3d.mjs'").join("mv-harnais-tete3Z.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
